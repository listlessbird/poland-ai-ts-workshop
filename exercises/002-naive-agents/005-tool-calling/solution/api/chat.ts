import { google } from "@ai-sdk/google";
import {
  convertToModelMessages,
  stepCountIs,
  streamText,
  tool,
  type UIMessage,
} from "ai";
import { spawnSync } from "child_process";
import { z } from "zod";

export const POST = async (req: Request): Promise<Response> => {
  const body: { messages: UIMessage[] } = await req.json();
  const { messages } = body;

  const PATH_TO_TYPESCRIPT_DOCS = process.env.PATH_TO_TYPESCRIPT_DOCS;

  if (!PATH_TO_TYPESCRIPT_DOCS) {
    console.error("PATH_TO_TYPESCRIPT_DOCS is not set in the environment");
    return new Response("Unknown error occurred", { status: 500 });
  }

  const result = streamText({
    model: google("gemini-2.5-flash"),
    messages: convertToModelMessages(messages),
    system: `
      You are a helpful TypeScript developer. You have a deep knowledge of TypeScript.

      Behind the scenes, you have access to the TypeScript documentation via grep.

      Rely on the grep tool to answer questions about TypeScript.

      Since grep uses exact string matching, use extremely short and explicit queries:
      - "interface"
      - "generics"
      - "type"
      - "function"
      - "class"
      - "enum"
      - "namespace"
    `,
    tools: {
      grepTypeScriptDocumentation: tool({
        description: "Grep the TypeScript documentation",
        inputSchema: z.object({
          queries: z
            .array(z.string())
            .describe(
              "The queries to grep the TypeScript documentation for. Supply MANY queries."
            ),
        }),
        execute: async ({ queries }) => {
          console.log("grepping for", queries);

          const result = spawnSync("grep", [
            "-ri",
            "-C",
            "5",
            "--include=*.md",
            ...queries,
            PATH_TO_TYPESCRIPT_DOCS,
          ]);

          return result.stdout.toString();
        },
      }),
    },
    stopWhen: [stepCountIs(10)],
  });

  return result.toUIMessageStreamResponse();
};
