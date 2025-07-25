import { google } from '@ai-sdk/google';
import { generateText } from 'ai';
import { evalite } from 'evalite';

evalite('Capitals', {
  data: () => [
    {
      input: 'What is the capital of France?',
      expected: 'Paris',
    },
    {
      input: 'What is the capital of Germany?',
      expected: 'Berlin',
    },
    {
      input: 'What is the capital of Italy?',
      expected: 'Rome',
    },
  ],
  task: async (input) => {
    const capitalResult = await generateText({
      model: google('gemini-1.5-flash'),
      prompt: `
        You are a helpful assistant that can answer questions about the capital of countries.
        The user will ask you a question about the capital of a country.
        You should answer the question.

        Question: 
        ${input}
      `,
    });

    return capitalResult.text;
  },
  scorers: [
    {
      name: 'includes',
      scorer: ({ input, output, expected }) => {
        return output.includes(expected!) ? 1 : 0;
      },
    },
  ],
});
