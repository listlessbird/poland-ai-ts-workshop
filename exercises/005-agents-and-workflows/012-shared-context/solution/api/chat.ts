import { google } from "@ai-sdk/google";
import {
  createUIMessageStream,
  createUIMessageStreamResponse,
  streamObject,
  streamText,
  type UIMessage,
} from "ai";
import z from "zod";

export type MyMessage = UIMessage<
  unknown,
  {
    "slack-message": string;
    "slack-message-feedback": string;
  }
>;

const formatMessageHistory = (messages: UIMessage[]) => {
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

const WRITE_SLACK_MESSAGE_FIRST_DRAFT_SYSTEM = `You are writing a Slack message for a user based on the conversation history. Only return the Slack message, no other text.`;
const EVALUATE_SLACK_MESSAGE_SYSTEM = `You are evaluating the Slack message produced by the user.

  Evaluation criteria:
  - The Slack message should be written in a way that is easy to understand.
  - It should be appropriate for a professional Slack conversation.
`;

class LoopContext {
  step = 0;
  mostRecentDraft = "";
  previousFeedback = "";

  shouldStop() {
    return this.step > 2;
  }

  private messages: UIMessage[];

  constructor(messages: UIMessage[]) {
    this.messages = messages;
  }

  formatMessageHistory(): string {
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

  const sharedContext = new LoopContext(messages);

  const stream = createUIMessageStream({
    execute: async ({ writer }) => {
      while (!sharedContext.shouldStop()) {
        // Write Slack message
        const writeSlackResult = streamText({
          model: google("gemini-2.0-flash-001"),
          system: WRITE_SLACK_MESSAGE_FIRST_DRAFT_SYSTEM,
          prompt: `
          Conversation history:
          ${formatMessageHistory(messages)}

          Previous draft (if any):
          ${sharedContext.mostRecentDraft}

          Previous feedback (if any):
          ${sharedContext.previousFeedback}
        `,
        });

        const firstDraftId = crypto.randomUUID();

        let firstDraft = "";

        for await (const part of writeSlackResult.textStream) {
          firstDraft += part;

          writer.write({
            type: "data-slack-message",
            data: firstDraft,
            id: firstDraftId,
          });
        }

        sharedContext.mostRecentDraft = firstDraft;

        // Evaluate Slack message
        const evaluateSlackResult = streamObject({
          model: google("gemini-2.0-flash-001"),
          system: EVALUATE_SLACK_MESSAGE_SYSTEM,
          prompt: `
            Conversation history:
            ${formatMessageHistory(messages)}

            Most recent draft:
            ${sharedContext.mostRecentDraft}

            Previous feedback (if any):
            ${sharedContext.previousFeedback}
          `,
          schema: z.object({
            feedback: z
              .string()
              .describe("The feedback about the most recent draft."),
            isGoodEnough: z
              .boolean()
              .describe(
                "Whether the most recent draft is good enough to stop the loop."
              ),
          }),
        });

        const feedbackId = crypto.randomUUID();

        for await (const part of evaluateSlackResult.partialObjectStream) {
          if (part.feedback) {
            writer.write({
              type: "data-slack-message-feedback",
              data: part.feedback,
              id: feedbackId,
            });
          }
        }

        const finalEvaluationObject = await evaluateSlackResult.object;

        // If the draft is good enough, break the loop
        if (finalEvaluationObject.isGoodEnough) {
          break;
        }

        sharedContext.previousFeedback = finalEvaluationObject.feedback;

        sharedContext.step++;
      }

      const textPartId = crypto.randomUUID();

      writer.write({
        type: "text-start",
        id: textPartId,
      });

      writer.write({
        type: "text-delta",
        delta: sharedContext.mostRecentDraft,
        id: textPartId,
      });

      writer.write({
        type: "text-end",
        id: textPartId,
      });
    },
  });

  return createUIMessageStreamResponse({
    stream,
  });
};
