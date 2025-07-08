import { google } from "@ai-sdk/google";
import {
  createUIMessageStream,
  createUIMessageStreamResponse,
  generateObject,
  generateText,
  type UIMessage,
} from "ai";
import { z } from "zod";

const messageHistory = (messages: UIMessage[]) => {
  return messages
    .map((message) => {
      return `${message.role}: ${message.parts
        .map((part) => {
          if (part.type === "text") {
            return part.text;
          }

          return "";
        })
        .join("")}`;
    })
    .join("\n");
};

export const POST = async (req: Request): Promise<Response> => {
  const body: { messages: UIMessage[] } = await req.json();
  const { messages } = body;

  const stream = createUIMessageStream({
    execute: async ({ writer }) => {
      let step = 0;

      let emailProduced = "";
      let previousFeedback = "";

      while (step < 2) {
        // Write email
        const writeEmailResult = await generateText({
          model: google("gemini-2.0-flash-001"),
          system: `You are writing an email for a user based on the conversation history. Only return the email, no other text.`,
          prompt: `
            Conversation history:
            ${messageHistory(messages)}

            Previous feedback (if any):
            ${previousFeedback}
          `,
        });

        emailProduced = writeEmailResult.text;

        // Evaluate email
        const evaluateEmailResult = await generateObject({
          model: google("gemini-2.0-flash-001"),
          system: `You are evaluating the email produced by the user.`,
          schema: z.object({
            shouldRegenerate: z.boolean(),
            reasoning: z
              .string()
              .describe(
                "The reasoning for the decision, including any changes to the email that should be made."
              ),
          }),
          prompt: `
            Conversation history:
            ${messageHistory(messages)}

            Email:
            ${emailProduced}

            Previous feedback (if any):
            ${previousFeedback}
          `,
        });

        const finalObject = evaluateEmailResult.object;

        if (!finalObject.shouldRegenerate) {
          break;
        }

        previousFeedback = finalObject.reasoning;

        step++;
      }

      if (emailProduced) {
        const id = crypto.randomUUID();
        writer.write({
          type: "text-start",
          id,
        });
        writer.write({
          type: "text-delta",
          id,
          delta: emailProduced,
        });
        writer.write({
          type: "text-end",
          id,
        });
      }
    },
  });

  return createUIMessageStreamResponse({
    stream,
  });
};
