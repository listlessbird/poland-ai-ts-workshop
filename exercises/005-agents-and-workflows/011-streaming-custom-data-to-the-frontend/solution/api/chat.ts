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
    slackMessage: string;
    "slack-message-feedback": string;
  }
>;

class SharedContext {
  step = 0;
  slackMessageProduced = "";
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
      while (!sharedContext.shouldStop()) {
        // Write Slack message
        const writeSlackResult = streamText({
          model: google("gemini-2.0-flash-001"),
          system: `You are writing a Slack message for a user based on the conversation history. Only return the Slack message, no other text.`,
          prompt: `
            Conversation history:
            ${sharedContext.messageHistory()}

            Previous feedback (if any):
            ${sharedContext.previousFeedback}
          `,
        });

        const id = crypto.randomUUID();

        let slackMessage = "";

        for await (const part of writeSlackResult.textStream) {
          slackMessage += part;
          writer.write({
            type: "data-slackMessage",
            data: slackMessage,
            id,
          });
        }

        sharedContext.slackMessageProduced = await writeSlackResult.text;

        // Evaluate Slack message
        const evaluateSlackResult = streamObject({
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
            ${sharedContext.messageHistory()}

            Slack message:
            ${sharedContext.slackMessageProduced}

            Previous feedback (if any):
            ${sharedContext.previousFeedback}
          `,
        });

        const feedbackId = crypto.randomUUID();

        for await (const part of evaluateSlackResult.partialObjectStream) {
          if (part.reasoning) {
            writer.write({
              type: "data-slack-message-feedback",
              data: part.reasoning,
              id: feedbackId,
            });
          }
        }

        const finalObject = await evaluateSlackResult.object;

        if (!finalObject.shouldRegenerate) {
          break;
        }

        sharedContext.previousFeedback = finalObject.reasoning;

        sharedContext.step++;
      }

      if (sharedContext.slackMessageProduced) {
        const id = crypto.randomUUID();
        writer.write({
          type: "text-start",
          id,
        });
        writer.write({
          type: "text-delta",
          id,
          delta: sharedContext.slackMessageProduced,
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
