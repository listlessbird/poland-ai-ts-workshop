import { google } from '@ai-sdk/google';
import { streamText } from 'ai';

const model = google('gemini-2.0-flash');

const result = await streamText({
  model,
  prompt: 'What is the capital of France?',
});

console.log(result);
