import {
  createUIMessageStream,
  createUIMessageStreamResponse,
  type UIMessage,
} from 'ai';
import { songFinderAgent } from './agents/song-finder-agent.ts';

export type MyMessage = UIMessage<
  unknown,
  {
    'slack-message': string;
    'slack-message-feedback': string;
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

export const POST = async (req: Request): Promise<Response> => {
  const body: { messages: MyMessage[] } = await req.json();
  const { messages } = body;

  const stream = createUIMessageStream<MyMessage>({
    execute: async ({ writer }) => {
      const result = await songFinderAgent({
        prompt: formatMessageHistory(messages),
        onSummaryStart: () => {
          const id = crypto.randomUUID();

          writer.write({
            type: 'text-start',
            id,
          });

          return id;
        },
        onSummaryDelta: (id, delta) => {
          writer.write({
            type: 'text-delta',
            id,
            delta,
          });
        },
        onSummaryEnd: (id) => {
          writer.write({
            type: 'text-end',
            id,
          });
        },
      });
    },
    onError(error) {
      console.error(error);
      return 'An error occurred while finding the song.';
    },
  });

  return createUIMessageStreamResponse({
    stream,
  });
};
