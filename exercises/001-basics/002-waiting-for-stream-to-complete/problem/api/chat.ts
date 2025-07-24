import {
  convertToModelMessages,
  streamText,
  type UIMessage,
} from 'ai';
import { google } from '@ai-sdk/google';

export const POST = async (req: Request): Promise<Response> => {
  const body: { messages: UIMessage[] } = await req.json();
  const { messages } = body;

  const result = streamText({
    model: google('gemini-2.0-flash'),
    messages: convertToModelMessages(messages),
  });

  return result.toUIMessageStreamResponse();
};
