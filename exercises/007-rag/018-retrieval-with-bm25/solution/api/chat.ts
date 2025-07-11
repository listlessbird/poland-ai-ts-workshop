import { google } from "@ai-sdk/google";
import {
  createUIMessageStream,
  createUIMessageStreamResponse,
  streamObject,
  streamText,
  type UIMessage,
} from "ai";
import { readdir, readFile } from "fs/promises";
import BM25 from "okapibm25";
import path from "path";
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

const loadTsDocs = async () => {
  const TS_DOCS_LOCATION = path.resolve(
    import.meta.dirname,
    "../../../../../datasets/ts-docs"
  );

  const files = await readdir(TS_DOCS_LOCATION);

  const docs = await Promise.all(
    files.map(async (file) => {
      const filePath = path.join(TS_DOCS_LOCATION, file);
      const content = await readFile(filePath, "utf8");
      return {
        filename: file,
        content,
      };
    })
  );

  return docs;
};

const searchTypeScriptDocs = async (keywords: string[]) => {
  const docs = await loadTsDocs();

  const scores: number[] = (BM25 as any)(
    docs.map((doc) => doc.content),
    keywords
  );

  return scores
    .map((score, index) => ({
      score,
      doc: docs[index],
    }))
    .sort((a, b) => b.score - a.score);
};

export const POST = async (req: Request): Promise<Response> => {
  const body: { messages: MyMessage[] } = await req.json();
  const { messages } = body;

  const stream = createUIMessageStream<MyMessage>({
    execute: async ({ writer }) => {
      const keywords = streamObject({
        model: google("gemini-2.0-flash-001"),
        system: `You are a helpful TypeScript developer, able to search the TypeScript docs for information.
          Your job is to generate a list of keywords which will be used to search the TypeScript docs.
        `,
        schema: z.object({
          keywords: z.array(z.string()),
        }),
        prompt: `
          Conversation history:
          ${formatMessageHistory(messages)}
        `,
      });

      const keywordsPartId = crypto.randomUUID();

      for await (const part of keywords.partialObjectStream) {
        if (
          part.keywords &&
          part.keywords.every((keyword) => typeof keyword === "string")
        ) {
          writer.write({
            type: "data-queries",
            data: part.keywords,
            id: keywordsPartId,
          });
        }
      }

      const allKeywords = (await keywords.object).keywords;

      const searchResults = await searchTypeScriptDocs(allKeywords);

      const topResults = searchResults.slice(0, 10);

      const answer = streamText({
        model: google("gemini-2.0-flash-001"),
        system: `You are a helpful TypeScript documentation assistant that answers questions based on the TypeScript documentation.
          You should use the provided documentation snippets to answer questions accurately.
          ALWAYS cite sources using markdown formatting with the filename as the source.
          Be concise but thorough in your explanations.
        `,
        prompt: [
          "## Conversation History",
          formatMessageHistory(messages),
          "## TypeScript Documentation Snippets",
          ...topResults.map((result, i) => {
            const filename = result.doc?.filename || `document-${i + 1}`;

            const content = result.doc?.content || "";
            const score = result.score;

            return [
              `### 📄 Source ${i + 1}: [${filename}](#${filename.replace(/[^a-zA-Z0-9]/g, "-")})`,
              `**Relevance Score:** ${score.toFixed(3)}`,
              content,
              "---",
            ].join("\n\n");
          }),
          "## Instructions",
          "Based on the TypeScript documentation above, please answer the user's question. Always cite your sources using the filename in markdown format.",
        ].join("\n\n"),
      });

      writer.merge(answer.toUIMessageStream());
    },
  });

  return createUIMessageStreamResponse({
    stream,
  });
};
