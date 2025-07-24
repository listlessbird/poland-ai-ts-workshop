import { createUIMessageStream, type UIMessage } from 'ai';

type MyMessage = UIMessage<
  unknown,
  {
    hello: string;
    goodbye: string;
  }
>;

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

for await (const chunk of stream) {
  console.log(chunk);
}
