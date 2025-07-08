import { google } from "@ai-sdk/google";
import {
  createUIMessageStream,
  createUIMessageStreamResponse,
  generateText,
  streamText,
  type UIMessage,
} from "ai";

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
      // Write Slack message
      const writeSlackResult = await generateText({
        model: google("gemini-2.0-flash-001"),
        system: `You are writing a Slack message for a user based on the conversation history. Only return the Slack message, no other text.`,
        prompt: `
          Conversation history:
          ${messageHistory(messages)}
        `,
      });

      // Evaluate Slack message
      const evaluateSlackResult = await generateText({
        model: google("gemini-2.0-flash-001"),
        system: `You are evaluating the Slack message produced by the user.

          Evaluation criteria:
          - The Slack message should be written in a way that is easy to understand.
          - It should be appropriate for a professional Slack conversation.
        `,
        prompt: `
          Conversation history:
          ${messageHistory(messages)}

          Slack message:
          ${writeSlackResult.text}
        `,
      });

      const finalSlackAttempt = streamText({
        model: google("gemini-2.0-flash-001"),
        system: `You are writing a Slack message based on the conversation history, a first draft, and some feedback given about that draft.
        
          Return only the final Slack message, no other text.
        `,
        prompt: `
          Conversation history:
          ${messageHistory(messages)}

          First draft:
          ${writeSlackResult.text}

          Previous feedback (if any):
          ${evaluateSlackResult.text}
        `,
      });

      writer.merge(finalSlackAttempt.toUIMessageStream());
    },
  });

  return createUIMessageStreamResponse({
    stream,
  });
};
