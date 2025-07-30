In this exercise, we're exploring how the `UIMessage` objects are structured when streaming from the backend to the frontend. Let's dive into how messages are represented and what they contain.

## The Setup

We're using a simplified example from a previous exercise, putting it into its own `main.ts` file. The code is set up to run a `streamText` call with all the previously defined tools, but now we're converting the stream into a `UIMessageStream` and logging it to the console.

The stream follows a familiar pattern with events like `start`, `finish`, `text-delta`, `text-start`, and `text-end`. But we're also going to examine the final shape of the messages through an `onFinish` callback.

```ts
const result = streamText({
  // Configuration for the model and prompt
  // ...
  stopWhen: [stepCountIs(10)],
});

const stream = result.toUIMessageStream({
  onFinish: ({ messages }) => {
    console.log('--- ON FINISH ---');
    console.dir(messages, { depth: null });
  },
});

console.log('--- STREAM ---');

for await (const message of stream) {
  console.log(message);
}
```

## Tool Calls In `UIMessageStream`

When we run this code, we see the stream events unfold. The process starts with a `start` event, followed by a `start-step` event. Each step counts toward our `stopWhen` condition, and typically represents a tool call.

The stream shows us the detailed progression of tool events:

```ts
{
  type: 'tool-input-start',
  toolCallId: 'mjDMqVhIzJMwcC22',
  toolName: 'writeFile',
  providerExecuted: undefined
}
```

This indicates the tool is being called with a specific `toolCallId` and the tool name. The `tool-input-delta` shows the input being built incrementally.

```ts
{
  type: 'tool-input-delta',
  toolCallId: 'mjDMqVhIzJMwcC22',
  inputTextDelta: `{"path":"pirate.md","content":"A salty dog with a patch on his eye,\\nSailed the seas under a stormy sky.\\nWith a cutlass keen and a parrot so green,\\nHe plundered and roamed, a fearsome machine.\\n\\nGold doubloons and jewels so bright,\\nFilled his chest with all his might.\\nA life of adventure, wild and free,\\nA pirate's life, for him and for me!"}`
}
```

The `tool-input-available` event indicates that the complete input is now available.

```ts
{
  type: 'tool-input-available',
  toolCallId: 'mjDMqVhIzJMwcC22',
  toolName: 'writeFile',
  input: {
    path: 'pirate.md',
    content: 'A salty dog with a patch on his eye,\n' +
      // The complete pirate poem content
  },
  providerExecuted: undefined,
  providerMetadata: undefined
}
```

The `tool-output-available` event shows the result of the tool execution.

```ts
{
  type: 'tool-output-available',
  toolCallId: 'mjDMqVhIzJMwcC22',
  output: {
    success: true,
    message: 'File written successfully: pirate.md',
    path: 'pirate.md'
  },
  providerExecuted: undefined
}
```

After the tool completes, we finish that step and start a new one where we stream text to the frontend:

```ts
{ type: 'text-start', id: '0' }
{ type: 'text-delta', id: '0', delta: 'I' }
{
  type: 'text-delta',
  id: '0',
  delta: "'ve written a poem about a pirate and saved it to a file named `pir"
}
{ type: 'text-delta', id: '0', delta: 'ate.md`.' }
{ type: 'text-end', id: '0' }
```

## `parts` in `UIMessage`

But the most interesting part is what happens after the stream completes. The `onFinish` callback gives us the final shape of the `UIMessage`, which is what would be used by `useChat` in a frontend application.

In the final `UIMessage` structure, all the streamed parts are collected into a single `assistant` message.

The key property here is the `parts` array, which collects all the streamed chunks into a clean, easy-to-read structure:

1. `step-start` - Marks the beginning of a step
2. `tool-writeFile` - Contains both the input and output of the tool call
3. Another `step-start` - Beginning a new step
4. `text` - The final text response

```ts
[
  {
    id: '',
    metadata: undefined,
    role: 'assistant',
    parts: [
      { type: 'step-start' },
      {
        type: 'tool-writeFile',
        toolCallId: 'mjDMqVhIzJMwcC22',
        state: 'output-available',
        input: {
          path: 'pirate.md',
          content: '...', // The pirate poem content
        },
        output: {
          success: true,
          message: 'File written successfully: pirate.md',
          path: 'pirate.md',
        },
        // Other properties
      },
      { type: 'step-start' },
      {
        type: 'text',
        text: "I've written a poem about a pirate and saved it to a file named `pirate.md`.",
        state: 'done',
      },
    ],
  },
];
```

This structured format makes it much easier to persist messages and render them appropriately in the frontend.

You can experiment with changing the prompt and observing how it affects both the stream events and the final `UIMessage` structure.

## Steps To Complete

- Open the `main.ts` file and review the existing implementation of the `streamText` function and how it's converted to a `UIMessageStream`.

- Try modifying the prompt to request a different type of content, perhaps a different poem theme or a different file format.

- Run the exercise and observe the console output.

- Compare the streamed events with the final `UIMessage` structure in the `onFinish` callback.

- Experiment with different prompts to see how they affect the tool usage and final `UIMessage` structure.
