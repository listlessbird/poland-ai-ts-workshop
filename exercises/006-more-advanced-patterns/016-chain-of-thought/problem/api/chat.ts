import { google } from "@ai-sdk/google";
import { tavily } from "@tavily/core";
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
    queries: string[];
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

export const POST = async (req: Request): Promise<Response> => {
  const body: { messages: MyMessage[] } = await req.json();
  const { messages } = body;

  const tavilyClient = tavily({
    apiKey: process.env.TAVILY_API_KEY,
  });

  const stream = createUIMessageStream<MyMessage>({
    execute: async ({ writer }) => {
      const planText = "NOT IMPLEMENTED YET";

      const queries = streamObject({
        model: google("gemini-2.0-flash-001"),
        system: `You are a helpful assistant that generates queries to search the web for information.
          You should generate 3-5 queries that are relevant to the conversation history.`,
        schema: z.object({
          queries: z.array(z.string()),
        }),
        prompt: `
          Conversation history:
          ${formatMessageHistory(messages)}

          Plan:
          ${planText}
        `,
      });

      const queriesPartId = crypto.randomUUID();

      for await (const part of queries.partialObjectStream) {
        if (
          part.queries &&
          part.queries.every((query) => typeof query === "string")
        ) {
          writer.write({
            type: "data-queries",
            data: part.queries,
            id: queriesPartId,
          });
        }
      }

      const allQueries = (await queries.object).queries;

      const searchResults = await Promise.all(
        allQueries.map(async (query) => {
          const searchResult = await tavilyClient.search(query, {
            maxResults: 5,
          });

          return {
            query,
            results: searchResult,
          };
        })
      );

      const answer = streamText({
        model: google("gemini-2.0-flash-001"),
        system: `You are a helpful assistant that answers questions based on the search results.
          You should use the search results to answer the question.
          ALWAYS cite sources as markdown links.
        `,
        prompt: `
          Conversation history:
          ${formatMessageHistory(messages)}

          Plan:
          ${planText}

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
