OK, we've got a working orchestrator that manages our sub-agents and executes tasks. Now let's add a final summary to the output.

The problem is that once all the sub-agents have completed their tasks, we need our orchestrator to analyze the results and provide a human-friendly summary to the user. This will make the output more coherent and useful.

## The Summary

To fix this issue, we need to add a summarization step at the end of our orchestration process. This will involve:

1. Calling `streamText` to generate a summary based on the diary of work performed
2. Writing this summary to the client

Let's look at the code that needs to be implemented:

In the `POST` function of our `chat.ts` file, we have a `while` loop that processes tasks. After this loop completes (when there are no more tasks to execute), we need to add code to summarize everything that happened:

```ts
// TODO: Call streamText to summarize the results of the
// multi-agent system. Use the getSummarizeSystemPrompt
// function to get the system prompt. Use the formattedMessages
// and diary to get the prompt.
const summarizeResult = TODO;

// TODO: Write the summary to the client, either by manually
// writing the text parts or by using .toUIMessageStream()
// and calling writer.merge() to merge the text parts.
//
// If you use .toUIMessageStream(), you'll need to pass
// .toUIMessageStream({ sendStart: false }) to avoid
// creating multiple messages.
TODO;
```

The `getSummarizeSystemPrompt()` function is already available to us, and it provides a system prompt that instructs the model to summarize the multi-agent work.

For the first TODO, we need to create a stream using `streamText()` that will generate a summary based on the diary and conversation history.

For the second TODO, we need to get that generated text to the client. We have two options:

1. Manually writing the text parts
2. Using `.toUIMessageStream()` and `writer.merge()`

If we choose the second option, we need to make sure we pass `{ sendStart: false }` to avoid creating multiple messages. Take a look at the reference material to help.

Good luck, and I'll see you in the solution!

## Steps To Complete

- Replace the first TODO with code that calls `streamText` to generate a summary
  - Use the `getSummarizeSystemPrompt()` function for the system prompt
  - Pass the `formattedMessages` and `diary` as part of the prompt

- Replace the second TODO with code that writes the summary to the client
  - Either manually write text parts OR
  - Use `.toUIMessageStream()` with `writer.merge()`
  - If using `.toUIMessageStream()`, remember to pass `{ sendStart: false }`

- Test your changes by running the local dev server
  - Go to localhost:3000 in your browser
  - Enter a prompt like "Find all of my lessons for tomorrow and pull up all of their notes"
  - Verify that after the sub-agents complete their tasks, you see a final summary message

- Check for any errors in the terminal console while testing
