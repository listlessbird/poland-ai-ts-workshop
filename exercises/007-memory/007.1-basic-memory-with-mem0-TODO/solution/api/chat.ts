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
      const memoryResult = await memory.search(
        formatMessageHistory(messages),
        {
          limit: 10,
          userId: USER_ID,
        },
      );

      console.log('Search Result');
      console.dir(memoryResult, { depth: null });

      const result = streamText({
        model: google('gemini-2.0-flash-lite'),
        system: `You are a helpful assistant that can answer questions and help with tasks.

        The date is ${new Date().toISOString().split('T')[0]}.

        You have access to the following memories:

        <memories>
        ${memoryResult.results.map(formatMemory).join('\n\n')}
        </memories>
        `,
        messages: convertToModelMessages(messages),
      });

      writer.merge(result.toUIMessageStream());
    },
    onFinish: async (response) => {
      const allMessages = [...messages, ...response.messages];

      const result = await memory.add(
        allMessages.map((message) => ({
          role: message.role,
          content: partsToText(message.parts),
        })),
        { userId: USER_ID },
      );

      console.log('Add Result');
      console.dir(result, { depth: null });
    },
  });

  return createUIMessageStreamResponse({
    stream,
  });
};
