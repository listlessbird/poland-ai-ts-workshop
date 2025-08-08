import {
  createUIMessageStream,
  createUIMessageStreamResponse,
  type UIMessage,
} from 'ai';

export type MyMessage = UIMessage<
  unknown,
  {
    hello: string;
    goodbye: string;
  }
>;

export const POST = async (req: Request): Promise<Response> => {
  const body: { messages: UIMessage[] } = await req.json();
  const { messages } = body;

  const stream = createUIMessageStream<MyMessage>({
    execute: async ({ writer }) => {
      writer.write({
        type: 'data-hello',
        data: 'Bonjour!',
      });

      await new Promise((resolve) => setTimeout(resolve, 1000));

      writer.write({
        type: 'data-goodbye',
        data: 'Au revoir!',
      });

      await new Promise((resolve) => setTimeout(resolve, 1000));

      writer.write({
        type: 'data-hello',
        data: 'Guten Tag!',
      });

      await new Promise((resolve) => setTimeout(resolve, 1000));

      writer.write({
        type: 'data-goodbye',
        data: 'Auf Wiedersehen!',
      });
    },
  });

  return createUIMessageStreamResponse({
    stream,
  });
};
