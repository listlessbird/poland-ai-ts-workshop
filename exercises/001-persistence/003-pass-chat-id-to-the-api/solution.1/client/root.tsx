import { useChat, type UIMessage } from "@ai-sdk/react";
import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import { ChatInput, Message, Wrapper } from "./components.tsx";
import "./tailwind.css";

const id = crypto.randomUUID();

const initialMessages: UIMessage[] = [
  {
    id: crypto.randomUUID(),
    role: "user",
    parts: [{ type: "text", text: "Hello, how are you?" }],
  },
];

const App = () => {
  const { messages, sendMessage } = useChat({
    id,
    messages: initialMessages,
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
