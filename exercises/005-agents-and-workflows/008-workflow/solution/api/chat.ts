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
      // Write email
      const writeEmailResult = await generateText({
        model: google("gemini-2.0-flash-001"),
        system: `You are writing an email for a user based on the conversation history. Only return the email, no other text.`,
        prompt: `
          Conversation history:
          ${messageHistory(messages)}
        `,
      });

      // Evaluate email
      const evaluateEmailResult = await generateText({
        model: google("gemini-2.0-flash-001"),
        system: `You are evaluating the email produced by the user.

          Evaluation criteria:
          - The email should be written in a way that is easy to understand.
        `,
        prompt: `
          Conversation history:
          ${messageHistory(messages)}

          Email:
          ${writeEmailResult.text}
        `,
      });

      const finalEmailAttempt = streamText({
        model: google("gemini-2.0-flash-001"),
        system: `You are writing an email based on the conversation history, a first draft, and some feedback given about that draft.
        
          Return only the final email, no other text.
        `,
        prompt: `
          Conversation history:
          ${messageHistory(messages)}

          First draft:
          ${writeEmailResult.text}

          Previous feedback (if any):
          ${evaluateEmailResult.text}
        `,
      });

      writer.merge(finalEmailAttempt.toUIMessageStream());
    },
  });

  return createUIMessageStreamResponse({
    stream,
  });
};
