import { google } from "@ai-sdk/google";
import { tavily } from "@tavily/core";
import {
  createUIMessageStream,
  createUIMessageStreamResponse,
  streamText,
  type UIMessage,
} from "ai";

export type MyMessage = UIMessage<unknown, {}>;

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

export const POST = async (req: Request): Promise<Response> => {
  const body: { messages: MyMessage[] } = await req.json();
  const { messages } = body;

  const stream = createUIMessageStream<MyMessage>({
    execute: async ({ writer }) => {
      const answer = streamText({
        model: google("gemini-2.0-flash-001"),
        system: `You are a helpful assistant that answers questions based on the search results.
          You should use the search results to answer the question.
          ALWAYS cite sources as markdown links.
        `,
        prompt: `
          Conversation history:
          ${formatMessageHistory(messages)}

          Search results:
          ${searchResults
            .map((result, i) => {
              // Render each query and its results as a Markdown section
              const queryHeader = `### Search Query ${i + 1}: ${result.query}\n`;
              const resultsList = result.results.results
                .map(
                  (res, j) =>
                    `**${j + 1}. [${res.title}](${res.url ?? "#"})**\n\n${res.content ?? ""}`
                )
                .join("\n\n---\n\n");
              return `${queryHeader}\n${resultsList}`;
            })
            .join("\n\n")}
        `,
      });

      writer.merge(answer.toUIMessageStream());
    },
  });

  return createUIMessageStreamResponse({
    stream,
  });
};
