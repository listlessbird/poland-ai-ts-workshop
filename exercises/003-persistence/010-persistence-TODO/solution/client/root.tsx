import { Chat, useChat } from '@ai-sdk/react';
import {
  QueryClient,
  QueryClientProvider,
  useSuspenseQuery,
} from '@tanstack/react-query';
import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import type { DB } from '../api/persistence-layer.ts';
import { ChatInput, Message, Wrapper } from './components.tsx';
import './tailwind.css';

const App = () => {
  const searchParams = new URLSearchParams(
    window.location.search,
  );
  const chatIdFromSearchParams = searchParams.get('chatId');

  const { data } = useSuspenseQuery({
    queryKey: ['chat', chatIdFromSearchParams],
    queryFn: () => {
      if (!chatIdFromSearchParams) {
        return null;
      }

      return fetch(
        `/api/chat?chatId=${chatIdFromSearchParams}`,
      ).then((res): Promise<DB.Chat> => res.json());
    },
  });

  const chat = new Chat({
    id: chatIdFromSearchParams ?? crypto.randomUUID(),
    messages: data?.messages ?? [],
  });

  const { messages, sendMessage } = useChat({
    chat,
  });

  const [input, setInput] = useState('');

  return (
    <Wrapper>
      {messages.map((message) => (
        <Message
          key={message.id}
          role={message.role}
          parts={message.parts}
        />
      ))}
      <ChatInput
        input={input}
        onChange={(e) => setInput(e.target.value)}
        onSubmit={(e) => {
          e.preventDefault();
          sendMessage({
            text: input,
          });
          setInput('');
          window.history.pushState({}, '', `?chatId=${chat.id}`);
        }}
      />
    </Wrapper>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(
  <QueryClientProvider client={new QueryClient()}>
    <App />
  </QueryClientProvider>,
);
