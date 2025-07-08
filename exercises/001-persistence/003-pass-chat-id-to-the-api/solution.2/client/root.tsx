import { Chat, useChat } from "@ai-sdk/react";
import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import { ChatInput, Message, Wrapper } from "./components.tsx";
import "./tailwind.css";

const initialChat = new Chat({
  id: crypto.randomUUID(),
  messages: [
    {
      id: crypto.randomUUID(),
      role: "user",
      parts: [{ type: "text", text: "Hello, how are you?" }],
    },
  ],
});

const App = () => {
  const { messages, sendMessage } = useChat({
    chat: initialChat,
  });

  const [input, setInput] = useState("");

  return (
    <Wrapper>
      {messages.map((message) => (
        <Message key={message.id} role={message.role} parts={message.parts} />
      ))}
      <ChatInput
        input={input}
        onChange={(e) => setInput(e.target.value)}
        onSubmit={(e) => {
          e.preventDefault();
          sendMessage({
            text: input,
          });
          setInput("");
        }}
      />
    </Wrapper>
  );
};

const root = createRoot(document.getElementById("root")!);
root.render(<App />);
