import { stepCountIs, streamText, tool } from 'ai';

import { google } from '@ai-sdk/google';
import { tavily } from '@tavily/core';
import z from 'zod';

export const songFinderAgent = async (opts: {
  prompt: string;
  onStatusUpdate: (status: string) => void;
  onSummaryStart: () => string;
  onSummaryDelta: (id: string, delta: string) => void;
  onSummaryEnd: (id: string) => void;
}) => {
  const tavilyClient = tavily({
    apiKey: process.env.TAVILY_API_KEY,
  });

  opts.onStatusUpdate('Starting search...');

  const streamResult = streamText({
    model: google('gemini-2.0-flash'),
    system: `
      You are a helpful assistant that finds songs.
      You're mostly being used by singing teachers who need to find songs for their students.
      You will be given a prompt and you will need to find the song.
      You will need to use the Tavily API to find the song, using your searchWeb tool.
      You will need to return the song name, artist, and album.
    `,
    prompt: opts.prompt,
    tools: {
      searchWeb: tool({
        description: 'Search the web for information',
        inputSchema: z.object({
          q: z
            .string()
            .describe('The query to search the web for'),
        }),
        execute: async ({ q }) => {
          opts.onStatusUpdate(`Searching for: ${q}`);

          const result = await tavilyClient.search(q, {
            maxResults: 5,
          });

          opts.onStatusUpdate(
            `Found ${result.results.length} results`,
          );

          return result.results
            .map((result, index) =>
              [
                `## Result ${index + 1}: ${result.title}`,
                `${result.url}`,
                `Published on ${result.publishedDate}`,
                `<content>`,
                `${result.content}`,
                `</content>`,
              ].join('\n\n'),
            )
            .join('\n\n');
        },
      }),
    },
    stopWhen: stepCountIs(10),
  });

  await streamResult.consumeStream();

  opts.onStatusUpdate('Summarizing results...');

  const finalMessages = (await streamResult.response).messages;

  const summarizeStreamResult = streamText({
    model: google('gemini-2.0-flash'),
    system: `
      You are a helpful assistant that summarizes the results of a subagent's search.
      You will be given an agent's thought process and results, and you will need to summarize the results.
      You will also be given the initial prompt so you can understand the context of the search.
      Provide a summary that is relevant to the initial prompt.
      Reply as if you are the subagent.
      The user will ONLY see the summary, not the thought process or results - so make it good!
    `,
    messages: [
      {
        role: 'user',
        content: `Initial prompt: ${opts.prompt}`,
      },
      ...finalMessages,
    ],
  });

  const summaryPartId = opts.onSummaryStart();

  for await (const delta of summarizeStreamResult.textStream) {
    opts.onSummaryDelta(summaryPartId, delta);
  }

  opts.onSummaryEnd(summaryPartId);

  await summarizeStreamResult.consumeStream();
};
