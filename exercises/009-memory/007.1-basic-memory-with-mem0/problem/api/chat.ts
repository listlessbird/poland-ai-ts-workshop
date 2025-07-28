import { google } from '@ai-sdk/google';
import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  streamText,
  type UIMessage,
} from 'ai';
import type { MemoryItem } from 'mem0ai/oss';
import { memory } from './memory.ts';

export type MyMessage = UIMessage<unknown, {}>;

const formatMessageHistory = (messages: UIMessage[]) => {
  return messages
    .map((message) => {
      return `${message.role}: ${partsToText(message.parts)}`;
    })
    .join('\n');
};

const partsToText = (parts: UIMessage['parts']) => {
  return parts
    .map((part) => {
      if (part.type === 'text') {
        return part.text;
      }

      return '';
    })
    .join('');
};

const USER_ID = 'me';

const formatMemory = (memory: MemoryItem) => {
  return [
    `Memory: ${memory.memory}`,
    `Updated At: ${memory.updatedAt}`,
    `Created At: ${memory.createdAt}`,
  ].join('\n');
};

export const POST = async (req: Request): Promise<Response> => {
  const body: { messages: MyMessage[] } = await req.json();
  const { messages } = body;

  const stream = createUIMessageStream<MyMessage>({
    execute: async ({ writer }) => {
      // TODO: search for memories using mem0,
      // making sure to pass in the user id
      const memoryResult = TODO;

      console.log('Search Result');
      console.dir(memoryResult, { depth: null });

      // TODO: Add memories to the system prompt

      // TODO: Add the current date to the system prompt so it
      // can contextualise the memories
      const result = streamText({
        model: google('gemini-2.0-flash-lite'),
        system: `You are a helpful assistant that can answer questions and help with tasks.

        You have access to the following memories:
        `,
        messages: convertToModelMessages(messages),
      });

      writer.merge(result.toUIMessageStream());
    },
    onFinish: async (response) => {
      // TODO: add memories to mem0, making
      // sure to pass in the user id.
      // Pass the entire message history to mem0
      const result = TODO;

      console.log('Add Result');
      console.dir(result, { depth: null });
    },
  });

  return createUIMessageStreamResponse({
    stream,
  });
};
