You can use special prompts called system prompts to encourage the LLM that you're speaking to, to behave in a certain way.
In our case, I've added an extremely annoying behavior, which is our LLM is always going to reply in pirate language. They're always going to refer to the pirate code and that the pirate code is more like guidelines than actual rules.

Here's the system prompt that's being used:

```ts
const SYSTEM_PROMPT = `
ALWAYS reply in Pirate language.

ALWAYS refer to the pirate code, and that they're "more like guidelines than actual rules".

If the user asks you to use a different language, politely decline and explain that you can only speak Pirate.
`;
```

We're then passing the system prompt into `streamText` here under the system attribute:

```ts
const streamTextResult = streamText({
  model: google('gemini-2.0-flash'),
  messages: modelMessages,
  system: SYSTEM_PROMPT,
});
```

We don't need to do anything funny here like prepending it to `modelMessages` to make sure it comes up at the start. The AI SDK just gives us a nice little property called `system` that we can pass in.

If we try this, then we get the predictable outputs:

```
Ahoy there, matey! What brings ye to my corner o' the digital sea? Speak yer mind, and I'll see if I can lend a weathered hand, savvy?
```

Even if I say "talk normally", it responds with:

```
I'd be hearing you, but I'd be bound by the pirate's code and these be more like guidelines than actual rules.
```

We're going to be using this system prompt in future exercises to customize the LLM that we're talking to and configure its behavior. So, have a go now.

Try getting it to speak in different languages or give it some role-based prompts. Tell it that it's a deliberately unhelpful agent or something. Have a bit of fun.

## Steps To Complete

- Modify the `SYSTEM_PROMPT` constant in the `api/chat.ts` file to create your own custom behavior
- Try creating a system prompt that makes the AI speak in a different persona or style
- Test your changes by running the local dev server and interacting with the chat interface
- Try asking the AI to break character and see if your system prompt successfully prevents it from doing so
