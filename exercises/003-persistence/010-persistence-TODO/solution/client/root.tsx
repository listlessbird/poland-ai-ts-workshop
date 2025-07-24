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
import { BrowserRouter, useSearchParams } from 'react-router';

const App = () => {
  const [backupChatId, setBackupChatId] = useState(
    crypto.randomUUID(),
  );
  const [searchParams, setSearchParams] = useSearchParams();

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

  const { messages, sendMessage } = useChat({
    id: chatIdFromSearchParams ?? backupChatId,
    messages: data?.messages ?? [],
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

          if (chatIdFromSearchParams) {
            return;
          }

          // Refresh the backup chat id
          setBackupChatId(crypto.randomUUID());
          setSearchParams({ chatId: backupChatId });
        }}
      />
    </Wrapper>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(
  <QueryClientProvider client={new QueryClient()}>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </QueryClientProvider>,
);
