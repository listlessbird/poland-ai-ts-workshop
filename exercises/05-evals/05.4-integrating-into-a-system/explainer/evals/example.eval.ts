import { evalite } from 'evalite';
import {
  createChatStream,
  type MyMessage,
} from '../api/chat.ts';

evalite('Example', {
  data: async () => [
    {
      input: 'Write a message to my boss asking for a raise.',
    },
  ],
  task: async (input) => {
    const messages: MyMessage[] = [
      {
        id: '1',
        role: 'user',
        parts: [{ type: 'text', text: input }],
      },
    ];
    const stream = createChatStream(messages);

    let text = '';

    for await (const message of stream) {
      if (message.type === 'text-delta') {
        text += message.delta;
      }
    }

    return text;
  },
  scorers: [],
});
