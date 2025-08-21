import { google } from "@ai-sdk/google";
import {
	convertToModelMessages,
	stepCountIs,
	streamText,
	tool,
	type UIMessage,
} from "ai";
import {z} from "zod"
import * as fsTools from "./file-system-functionality.ts";




const tools = {
  writeFile: tool({
    description: "Write a file to the file system",
    inputSchema: z.object({
      filePath: z
      .string()
      .describe("The path to the file to write to"),
      content: z.string().describe("The content to write to the file"),
    }),
    execute: async ({filePath, content}) => {
      console.log("using writeFile", filePath, content);
      return fsTools.writeFile(filePath, content);
    }
  }),
  readFile: tool({
    description: "Read a file from the file system",
    inputSchema: z.object({
      filePath: z.string().describe("The path to the file to read from")
    }),
    execute: async ({filePath}) => {
      console.log("using readFile", filePath);
      return fsTools.readFile(filePath);
    }
  }),
  deletePath: tool({
    description: "Delete a file or directory from the file system",
    inputSchema: z.object({
      pathToDelete: z
      .string()
      .describe("The path to the file or directory to delete")
    }),
    execute: async ({pathToDelete}) => {
      console.log("using deletePath", pathToDelete);
      return fsTools.deletePath(pathToDelete);
    }
  }),
  listDirectory: tool({
    description: "List the contents of a directory",
    inputSchema: z.object({
      dirPath: z.string().describe("The path to the directory to list")
    }),
    execute: async ({ dirPath}) => {
      console.log("using listDirectory", dirPath);
      return fsTools.listDirectory(dirPath);
    }
  }),
  createDirectory: tool({
    description: "Create a directory in the file system",
    inputSchema: z.object({
      dirPath: z.string().describe("The path to the directory to create")
    }),
    execute: async ({dirPath}) => {
      console.log("using createDirectory", dirPath);
      return fsTools.createDirectory(dirPath);
    }
  }),
  exists: tool({
    description: "Check if a file or directory exists",
    inputSchema: z.object({
      pathToCheck: z.string().describe("The path to the file or directory to check")
    }),
    execute: async ({pathToCheck}) => {
      console.log("using exists", pathToCheck);
      return fsTools.exists(pathToCheck);
    }
  }),
  searchFiles: tool({
    description: "Search for files by pattern",
    inputSchema: z.object({
      pattern: z.string().describe("The pattern to search for"),
      searchDir: z.string()
                .optional()
                .default(".")
                .describe("The directory to search in. Defaults to the current directory.")
    }),
    execute: async ({pattern, searchDir}) => {
      console.log("using searchFiles", pattern, searchDir);
      return fsTools.searchFiles(pattern, searchDir);
    }
  })
}


export const POST = async (req: Request): Promise<Response> => {
	const body: { messages: UIMessage[] } = await req.json();
	const { messages } = body;

	const result = streamText({
		model: google("gemini-2.5-flash"),
		messages: convertToModelMessages(messages),
		system: `
      You are a helpful assistant that can use a sandboxed file system to create, edit and delete files.

      You have access to the following tools:
      - writeFile
      - readFile
      - deletePath
      - listDirectory
      - createDirectory
      - exists
      - searchFiles

      Use these tools to record notes, create todo lists, and edit documents for the user.

      Use markdown files to store information.
    `,
		// TODO: add the tools to the streamText call,
		tools: tools,
		// TODO: add a custom stop condition to the streamText call
		// to force the agent to stop after 10 steps have been taken
		stopWhen: stepCountIs(10),
	});

	return result.toUIMessageStreamResponse();
};
