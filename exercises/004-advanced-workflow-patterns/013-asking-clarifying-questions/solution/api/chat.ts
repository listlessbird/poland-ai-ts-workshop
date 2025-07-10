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
  CHECK_FOR_CLARIFYING_QUESTIONS_SYSTEM,
} from "./utils.ts";

export const POST = async (req: Request): Promise<Response> => {
  const body: { messages: MyMessage[] } = await req.json();
  const { messages } = body;

  const sharedContext = new LoopContext(messages);

  const stream = createUIMessageStream<MyMessage>({
    execute: async ({ writer }) => {
      if (messages.length === 1) {
        // Check for clarifying questions
        const checkForClarifyingQuestionsResult = streamObject({
          model: google("gemini-2.0-flash-001"),
          system: CHECK_FOR_CLARIFYING_QUESTIONS_SYSTEM,
          prompt: `
            Conversation history:
            ${formatMessageHistory(messages)}
          `,
          schema: z.object({
            reasoning: z
              .string()
              .describe(
                "The reasoning for why the clarifying questions are needed."
              ),
            message: z
              .string()
              .describe(
                "The message to send to the user, containing the clarifying questions."
              ),
            areClarifyingQuestionsNeeded: z
              .boolean()
              .describe(
                "Whether writing Slack message requires any clarifying questions."
              ),
          }),
        });

        const clarifyingQuestionsReasoningId = crypto.randomUUID();

        for await (const part of checkForClarifyingQuestionsResult.partialObjectStream) {
          if (part.reasoning) {
            writer.write({
              type: "data-clarifying-questions-reasoning",
              data: part.reasoning,
              id: clarifyingQuestionsReasoningId,
            });
          }
        }

        const finalObject = await checkForClarifyingQuestionsResult.object;

        // If the draft requires clarifying questions, send them to the user
        // and don't enter the loop
        if (finalObject.areClarifyingQuestionsNeeded) {
          const id = crypto.randomUUID();

          writer.write({
            type: "text-start",
            id,
          });

          writer.write({
            type: "text-delta",
            delta: finalObject.message,
            id,
          });

          writer.write({
            type: "text-end",
            id,
          });

          return;
        }
      }

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
