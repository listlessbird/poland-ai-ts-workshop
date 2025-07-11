import { useChat } from '@ai-sdk/react';
import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ChatInput, Message, Wrapper } from './components.tsx';
import './tailwind.css';
import type { MyMessage } from '../api/chat.ts';

const App = () => {
  const { messages, sendMessage } = useChat<MyMessage>({});

  const [input, setInput] = useState(
    `Which are better? Gas, electric, or induction hobs? Please provide a detailed answer.`,
  );

  const [planAcceptanceState, setPlanAcceptanceState] = useState<
    'reject' | 'idle'
  >('idle');

  const mostRecentMessageIsAPlan =
    messages[messages.length - 1]?.parts.some(
      (part) => part.type === 'reasoning',
    ) ?? false;

  const handlePlanAcceptance = () => {
    sendMessage({
      parts: [
        {
          type: 'text',
          text: 'Go ahead',
        },
        {
          type: 'data-plan-acceptance',
          data: {
            accepted: true,
          },
        },
      ],
    });
    setPlanAcceptanceState('idle');
  };

  const handlePlanRejection = () => {
    setPlanAcceptanceState('reject');
  };

  const handleFeedbackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage({
      parts: [
        {
          type: 'text',
          text: input,
        },
        {
          type: 'data-plan-acceptance',
          data: {
            accepted: false,
            feedback: input,
          },
        },
      ],
    });
    setInput('');
    setPlanAcceptanceState('idle');
  };

  const handleNormalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage({
      text: input,
    });
    setInput('');
  };

  const renderInput = () => {
    if (
      mostRecentMessageIsAPlan &&
      planAcceptanceState === 'idle'
    ) {
      return (
        <div className="fixed bottom-0 w-full max-w-md mb-8 flex gap-2">
          <button
            onClick={handlePlanAcceptance}
            className="flex-1 p-2 bg-green-600 hover:bg-green-700 text-white rounded shadow-xl"
          >
            Accept Plan
          </button>
          <button
            onClick={handlePlanRejection}
            className="flex-1 p-2 bg-red-600 hover:bg-red-700 text-white rounded shadow-xl"
          >
            Reject Plan
          </button>
        </div>
      );
    }

    if (
      mostRecentMessageIsAPlan &&
      planAcceptanceState === 'reject'
    ) {
      return (
        <ChatInput
          input={input}
          onChange={(e) => setInput(e.target.value)}
          onSubmit={handleFeedbackSubmit}
          placeholder="Give feedback about the plan..."
        />
      );
    }

    return (
      <ChatInput
        input={input}
        onChange={(e) => setInput(e.target.value)}
        onSubmit={handleNormalSubmit}
      />
    );
  };

  return (
    <Wrapper>
      {messages.map((message) => (
        <Message
          key={message.id}
          role={message.role}
          parts={message.parts}
        />
      ))}

      {renderInput()}
    </Wrapper>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
