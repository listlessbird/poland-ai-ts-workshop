import { google } from "@ai-sdk/google";
import {
  createUIMessageStream,
  createUIMessageStreamResponse,
  streamObject,
  streamText,
} from "ai";
import z from "zod";
import {
  EVALUATE_SLACK_MESSAGE_SYSTEM,
  WRITE_SLACK_MESSAGE_FIRST_DRAFT_SYSTEM,
  formatMessageHistory,
  LoopContext,
  type MyMessage,
} from "./utils.ts";

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
