import {
  convertToModelMessages,
  createUIMessageStream,
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
    onFinish: ({ response }) => {
      console.log('streamText.onFinish');
      console.log('  response.messages');
      console.dir(response.messages, { depth: null });
    },
  });

  return result.toUIMessageStreamResponse({
    onFinish: ({ messages, responseMessage }) => {
      console.log('toUIMessageStreamResponse.onFinish');
      console.log('  messages');
      console.dir(messages, { depth: null });
      console.log('toUIMessageStreamResponse.onFinish');
      console.log('  responseMessage');
      console.dir(responseMessage, { depth: null });
    },
  });
};
