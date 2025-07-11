import { google } from '@ai-sdk/google';
import {
  convertToModelMessages,
  stepCountIs,
  streamText,
  type UIMessage,
} from 'ai';

if (!process.env.GITHUB_PERSONAL_ACCESS_TOKEN) {
  throw new Error('GITHUB_PERSONAL_ACCESS_TOKEN is not set');
}

export const POST = async (req: Request): Promise<Response> => {
  const body: { messages: UIMessage[] } = await req.json();
  const { messages } = body;

  const result = streamText({
    model: google('gemini-2.5-flash'),
    messages: convertToModelMessages(messages),
    system: `
      You are a helpful assistant that can use the GitHub API to interact with the user's GitHub account.
    `,
    stopWhen: [stepCountIs(10)],
  });

  return result.toUIMessageStreamResponse();
};
