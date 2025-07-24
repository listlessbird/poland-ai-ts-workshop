It's time to start working with agents. We're going to implement a pretty naive agent that works with a local file system.

This agent needs two things to succeed:

- A set of tools in order to act on the local file system
- A custom stop condition to work out when it should stop generating content

Without the set of tools, our agent will simply be a ChatGPT wrapper. It won't be able to act on the world in any meaningful way.

And without a custom stop condition, it will stop after a single generation. What we need to do is to call its tools and then react to the tool call results.

I've given you a set of functions inside `file-system-functionality.ts` that implement each of the tools that we're looking to create.

I've also given you a brief system prompt inside `chat.ts`.

```ts
const result = streamText({
  model: google('gemini-2.5-flash'),
  messages: convertToModelMessages(messages),
  system: `
    You are a helpful assistant that can use a sandboxed file system to create, edit and delete files.

    You have access to the following tools:
    - writeFile
    - readFile
    - deletePath
    - listDirectory
    - createDirectory
    - exists
    - searchFiles

    Use these tools to record notes, create todo lists, and edit documents for the user.

    Use markdown files to store information.
  `,
});
```

Any files that it outputs will be inside `data/file-system-db.local`.
