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

      let slackMessageProduced = "";
      let previousFeedback = "";

      while (step < 2) {
        // Write Slack message
        const writeSlackResult = await generateText({
          model: google("gemini-2.0-flash-001"),
          system: `You are writing a Slack message for a user based on the conversation history. Only return the Slack message, no other text.`,
          prompt: `
            Conversation history:
            ${messageHistory(messages)}

            Previous feedback (if any):
            ${previousFeedback}
          `,
        });

        slackMessageProduced = writeSlackResult.text;

        // Evaluate Slack message
        const evaluateSlackResult = await generateObject({
          model: google("gemini-2.0-flash-001"),
          system: `You are evaluating the Slack message produced by the user.`,
          schema: z.object({
            shouldRegenerate: z.boolean(),
            reasoning: z
              .string()
              .describe(
                "The reasoning for the decision, including any changes to the Slack message that should be made."
              ),
          }),
          prompt: `
            Conversation history:
            ${messageHistory(messages)}

            Slack message:
            ${slackMessageProduced}

            Previous feedback (if any):
            ${previousFeedback}
          `,
        });

        const finalObject = evaluateSlackResult.object;

        if (!finalObject.shouldRegenerate) {
          break;
        }

        previousFeedback = finalObject.reasoning;

        step++;
      }

      if (slackMessageProduced) {
        const id = crypto.randomUUID();
        writer.write({
          type: "text-start",
          id,
        });
        writer.write({
          type: "text-delta",
          id,
          delta: slackMessageProduced,
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
