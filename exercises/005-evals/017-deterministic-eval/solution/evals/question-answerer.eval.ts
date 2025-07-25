import { google } from '@ai-sdk/google';
import { generateText } from 'ai';
import { evalite } from 'evalite';

const links = [
  {
    title: 'TypeScript 5.8',
    url: 'https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-8.html',
  },
  {
    title: 'TypeScript 5.7',
    url: 'https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-7.html',
  },
  {
    title: 'TypeScript 5.6',
    url: 'https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-6.html',
  },
  {
    title: 'TypeScript 5.5',
    url: 'https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-5.html',
  },
  {
    title: 'TypeScript 5.4',
    url: 'https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-4.html',
  },
  {
    title: 'TypeScript 5.3',
    url: 'https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-3.html',
  },
  {
    title: 'TypeScript 5.2',
    url: 'https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-2.html',
  },
  {
    title: 'TypeScript 5.1',
    url: 'https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-1.html',
  },
  {
    title: 'TypeScript 5.0',
    url: 'https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-0.html',
  },
];

evalite('Capitals', {
  data: () => [
    {
      input: 'Tell me about the TypeScript 5.8 release',
    },
    {
      input: 'Tell me about the TypeScript 5.2 release',
    },
  ],
  task: async (input) => {
    const capitalResult = await generateText({
      model: google('gemini-1.5-flash'),
      prompt: `
        You are a helpful assistant that can answer questions about TypeScript releases.

        Answer the question extremely succinctly.

        ALWAYS include relevant links in your answer.

        Format the markdown links inline:

        I really like [this website about cakes](https://www.cakes.com).

        Question:
        ${input}

        Links:
        ${links.map((link) => `${link.title}: ${link.url}`).join('\n')}
      `,
    });

    return capitalResult.text;
  },
  scorers: [
    {
      name: 'Includes Markdown Links',
      scorer: ({ input, output, expected }) => {
        const markdownLinksFound =
          output.match(/\[.*?\]\((.*?)\)/g) ?? [];

        return markdownLinksFound.length > 0 ? 1 : 0;
      },
    },
    {
      name: 'Output length',
      scorer: ({ input, output, expected }) => {
        return output.length < 500 ? 1 : 0;
      },
    },
  ],
});
