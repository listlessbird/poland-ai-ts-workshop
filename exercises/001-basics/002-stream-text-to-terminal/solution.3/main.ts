import { google } from '@ai-sdk/google';
import { generateText } from 'ai';

const model = google('gemini-2.0-flash');

console.log('Generating text...');

const { text } = await generateText({
  model,
  prompt:
    'Give me the first paragraph of a story about an imaginary planet.',
});

console.log(text);
