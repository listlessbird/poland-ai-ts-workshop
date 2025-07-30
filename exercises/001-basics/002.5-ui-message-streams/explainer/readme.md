So far we've seen how you can stream text from an LLM response, but LLMs can return more than just text parts.

They can return reasoning tokens, sources, tool calls, and tool results. The stream is the thing that connects your front end to your back end, and all of these different parts can't just be represented by a simple text stream.

We need something a bit more complex. In the AI SDK, this is a `UIMessage`. A `UIMessage` is a really important type in the AI SDK. It represents the messages as they appear in your UI. A `UIMessageStream` is your back end constructing one of these `UIMessage`s in real time.

Let's look at an example:

```ts
import { google } from '@ai-sdk/google';
import { streamText } from 'ai';

const model = google('gemini-2.0-flash');

const stream = streamText({
  model,
  prompt: 'Give me a sonnet about a cat called Steven.',
});

for await (const chunk of stream.toUIMessageStream()) {
  console.log(chunk);
}
```

In this code, we're passing a Google model into `streamText` with a prompt asking for a sonnet about a cat called Steven. Instead of referring to `textStream`, we're calling `toUIMessageStream()` and streaming down the chunks.

If we run this code, we'll see a whole list of objects being streamed out, like this:

```
{ type: 'start', id: 'msg_...' }
{ type: 'startStep', id: 'step_...', message: 'msg_...', metadata: { toolCallId: null } }
{ type: 'textStart', id: 'text_...', step: 'step_...', message: 'msg_...' }
{ type: 'textDelta', id: 'text_...', step: 'step_...', message: 'msg_...', delta: 'Steven, ' }
{ type: 'textDelta', id: 'text_...', step: 'step_...', message: 'msg_...', delta: 'the ' }
{ type: 'textDelta', id: 'text_...', step: 'step_...', message: 'msg_...', delta: 'cat ' }
// ... more textDelta objects ...
{ type: 'textEnd', id: 'text_...', step: 'step_...', message: 'msg_...' }
{ type: 'finishStep', id: 'step_...', message: 'msg_...', metadata: { toolCallId: null } }
{ type: 'finish', id: 'msg_...' }
```

These objects represent the `UIMessageStream` and all their various parts. The stream starts with a "start" event, then a "start step", followed by "text start" and multiple "text delta" events containing the actual content, and finally "text end", "finish step" and "finish" events.

Streaming to a terminal is relatively simple, but streaming to a UI means you need a little bit more complexity. That's what the `UIMessageStream` gives you.

We're going to see it more and more in the next few exercises, especially when we look in the network tab to see what streaming from our back end to our front end looks like.

Try messing about with the prompt, see if you can get some different outputs, and run the exercise a few times with different inputs to see what the outputs look like. Get used to the shape of the `UIMessageStream` - we're going to be seeing it a lot.

## Steps To Complete

- Examine the provided code that uses `toUIMessageStream()` to output `UIMessage` components
- Run the code to see the structure of a `UIMessageStream` in action
- Observe the different parts that make up the stream (start, start step, text start, text delta, etc.)
- Try modifying the prompt to generate different content and observe how the `UIMessageStream` structure remains similar
- Run the exercise multiple times to become familiar with the `UIMessageStream` format
- Pay attention to how this more complex stream format enables richer UI representations beyond simple text
