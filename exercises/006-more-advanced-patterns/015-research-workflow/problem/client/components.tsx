import React, { type ReactNode } from "react";
import type { MyMessage } from "../api/chat.ts";

export const Wrapper = (props: { children: React.ReactNode }) => {
  return (
    <div className="flex flex-col w-full max-w-md py-24 mx-auto stretch">
      {props.children}
    </div>
  );
};

export const FadeIn = (props: { children: ReactNode; className?: string }) => {
  return (
    <span
      className={props.className}
      style={{
        animation: "fadeIn 0.2s",
      }}
    >
      {props.children}
    </span>
  );
};

export const Message = ({
  role,
  parts,
}: {
  role: string;
  parts: MyMessage["parts"];
}) => (
  <div>
    {parts.map((part) => {
      if (part.type === "data-queries") {
        return (
          <div key={part.id} className="mb-4">
            <h2 className="text-gray-300 text-sm mb-1">Queries</h2>
            <ul className="text-gray-400 text-xs monospace">
              {Object.values(part.data).map((query) => (
                <li key={query}>{query}</li>
              ))}
            </ul>
          </div>
        );
      }

      return null;
    })}

    <div className="whitespace-pre-wrap my-6 leading-7">
      <FadeIn className="font-semibold text-gray-200">
        {role === "user" ? "User: " : "AI: "}
      </FadeIn>
      {parts.map((part, index) => {
        if (part.type === "text") {
          return (
            <FadeIn key={index} className="text-gray-100">
              {part.text}
            </FadeIn>
          );
        }
        return null;
      })}
    </div>
  </div>
);

export const ChatInput = ({
  input,
  onChange,
  onSubmit,
  disabled,
}: {
  input: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
  disabled?: boolean;
}) => (
  <form onSubmit={onSubmit}>
    <input
      className={`fixed bottom-0 w-full max-w-md p-2 mb-8 border-2 border-zinc-700 rounded shadow-xl bg-gray-800 ${
        disabled ? "opacity-50 cursor-not-allowed" : ""
      }`}
      value={input}
      placeholder={
        disabled ? "Please handle tool calls first..." : "Say something..."
      }
      onChange={onChange}
      disabled={disabled}
      autoFocus
    />
  </form>
);
