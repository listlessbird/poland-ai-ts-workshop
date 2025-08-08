import { google } from '@ai-sdk/google';
import {
  createUIMessageStream,
  createUIMessageStreamResponse,
  streamText,
  type UIMessage,
} from 'ai';

export type MyMessage = UIMessage<
  unknown,
  {
    queries: string[];
  }
>;

const formatMessageHistory = (messages: UIMessage[]) => {
  return messages
    .map((message) => {
      return `${message.role}: ${message.parts
        .map((part) => {
          if (part.type === 'text') {
            return part.text;
          }

          return '';
        })
        .join('')}`;
    })
    .join('\n');
};

const KEYWORD_GENERATOR_SYSTEM_PROMPT = `
  You are a helpful TypeScript developer, able to search the TypeScript docs for information.
  Your job is to generate a list of keywords which will be used to search the TypeScript docs.
`;

export const POST = async (req: Request): Promise<Response> => {
  const body: { messages: MyMessage[] } = await req.json();
  const { messages } = body;

  const stream = createUIMessageStream<MyMessage>({
    execute: async ({ writer }) => {
      // TODO: Implement a keyword generator that generates a list of keywords
      // based on the conversation history. Use generateObject to do this.
      const keywords = TODO;

      // TODO: Use the searchTypeScriptDocs function to get the top X number of
      // search results based on the keywords
      const topSearchResults = TODO;

      const answer = streamText({
        model: google('gemini-2.0-flash-001'),
        system: `You are a helpful TypeScript documentation assistant that answers questions based on the TypeScript documentation.
          You should use the provided documentation snippets to answer questions accurately.
          ALWAYS cite sources using markdown formatting with the filename as the source.
          Be concise but thorough in your explanations.
        `,
        prompt: [
          '## Conversation History',
          formatMessageHistory(messages),
          '## TypeScript Documentation Snippets',
          ...topSearchResults.map((result, i) => {
            const filename =
              result.doc?.filename || `document-${i + 1}`;

            const content = result.doc?.content || '';
            const score = result.score;

            return [
              `### 📄 Source ${i + 1}: [${filename}](#${filename.replace(/[^a-zA-Z0-9]/g, '-')})`,
              `**Relevance Score:** ${score.toFixed(3)}`,
              content,
              '---',
            ].join('\n\n');
          }),
          '## Instructions',
          "Based on the TypeScript documentation above, please answer the user's question. Always cite your sources using the filename in markdown format.",
        ].join('\n\n'),
      });

      writer.merge(answer.toUIMessageStream());
    },
  });

  return createUIMessageStreamResponse({
    stream,
  });
};
