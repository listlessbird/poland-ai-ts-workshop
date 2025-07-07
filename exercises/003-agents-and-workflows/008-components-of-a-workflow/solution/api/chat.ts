import { google } from "@ai-sdk/google";
import {
  createUIMessageStream,
  createUIMessageStreamResponse,
  streamObject,
  streamText,
  type UIMessage,
} from "ai";
import { z } from "zod";

export type MyMessage = UIMessage<
  unknown,
  {
    "email-delta": {
      id: string;
      delta: string;
    };
    "email-feedback-delta": {
      id: string;
      delta: string;
    };
  }
>;

class SharedContext {
  step = 0;
  emailProduced = "";
  previousFeedback = "";

  shouldStop() {
    return this.step > 2;
  }

  private messages: UIMessage[];

  constructor(messages: UIMessage[]) {
    this.messages = messages;
  }

  messageHistory(): string {
    return this.messages
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
  }
}

export const POST = async (req: Request): Promise<Response> => {
  const body: { messages: MyMessage[] } = await req.json();
  const { messages } = body;

  const sharedContext = new SharedContext(messages);

  const stream = createUIMessageStream<MyMessage>({
    execute: async ({ writer }) => {
      writer.write({
        type: "start",
      });
      while (!sharedContext.shouldStop()) {
        // Write email
        const writeEmailResult = streamText({
          model: google("gemini-2.0-flash-001"),
          system: `You are writing an email for a user based on the conversation history. Only return the email, no other text.`,
          prompt: `
            Conversation history:
            ${sharedContext.messageHistory()}

            Previous feedback (if any):
            ${sharedContext.previousFeedback}
          `,
        });

        const id = crypto.randomUUID();

        for await (const part of writeEmailResult.textStream) {
          writer.write({
            type: "data-email-delta",
            data: {
              id,
              delta: part,
            },
          });
        }

        sharedContext.emailProduced = await writeEmailResult.text;

        // Evaluate email
        const evaluateEmailResult = streamObject({
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
            ${sharedContext.messageHistory()}

            Email:
            ${sharedContext.emailProduced}

            Previous feedback (if any):
            ${sharedContext.previousFeedback}
          `,
        });

        const feedbackId = crypto.randomUUID();

        for await (const part of evaluateEmailResult.partialObjectStream) {
          if (part.reasoning) {
            writer.write({
              type: "data-email-feedback-delta",
              data: {
                id: feedbackId,
                delta: part.reasoning,
              },
            });
          }
        }

        const finalObject = await evaluateEmailResult.object;

        if (!finalObject.shouldRegenerate) {
          break;
        }

        sharedContext.previousFeedback = finalObject.reasoning;

        sharedContext.step++;
      }

      if (sharedContext.emailProduced) {
        const id = crypto.randomUUID();
        writer.write({
          type: "text-start",
          id,
        });
        writer.write({
          type: "text-delta",
          id,
          delta: sharedContext.emailProduced,
        });
        writer.write({
          type: "text-end",
          id,
        });
      }

      writer.write({
        type: "finish",
      });
    },
  });

  return createUIMessageStreamResponse({
    stream,
  });
};
