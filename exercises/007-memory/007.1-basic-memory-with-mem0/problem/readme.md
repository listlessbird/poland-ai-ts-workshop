The way that most LLM apps work is that you have a single thread that you talk to the LLM with. The messages in that thread then get passed to the LLM and that forms a kind of working memory of things that you've talked about within that thread.

That means that you can ask follow-up questions, you can do useful stuff where the LLM will remember all of the context of what you've talked about before. But those memories are encoded in the thread, right?

If you switch to a new thread, then the LLM completely forgets everything that you were saying before. How do we make it so that the LLM application actually remembers our preferences and customizes and tailors its behavior to our needs long-term?

Well, that's what we're going to look at in this exercise. I'm going to show you a basic memory setup here using some open source tools, specifically from [Mem0](https://mem0.ai/). This will let us get something off the ground quickly where we can pass memories to a memory store and it will remember them between chat threads.

## Our Memory Setup

The main file to look at is this `memory.ts` file where we are creating a new memory from `mem0ai/oss`. This is an open source version of Mem0.

```ts
import { Memory } from 'mem0ai/oss';

export const memory = new Memory({
  llm: {
    provider: 'google',
    config: {
      model: 'gemini-2.0-flash-001',
      apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
    },
  },
  embedder: {
    provider: 'google',
    config: {
      apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
      model: 'text-embedding-004',
    },
  },
  vectorStore: {
    provider: 'memory',
    config: {
      collectionName: 'memories',
      dimension: 768,
    },
  },
  historyDbPath: './memory.db',
});
```

We're configuring the memory here to use a Google provider to pass in the model and we also pass in the API key here manually.

We do the same with a text embedder here too, again, passing in the same Google generative AI API key and passing in `text-embedding-004`. We'll look at this in more detail in a minute, but for now, you can think of it just as an implementation detail of Mem0.

## The `POST` Endpoint

We're then importing this memory into our API chat endpoint where we have a few helper methods and our normal post API endpoint.

```ts
// From problem/api/chat.ts
import { memory } from './memory.ts';

const formatMessageHistory = (messages: UIMessage[]) => {
  return messages
    .map((message) => {
      return `${message.role}: ${partsToText(message.parts)}`;
    })
    .join('\n');
};

const partsToText = (parts: UIMessage['parts']) => {
  return parts
    .map((part) => {
      if (part.type === 'text') {
        return part.text;
      }
      return '';
    })
    .join('');
};

const USER_ID = 'me';

const formatMemory = (memory: MemoryItem) => {
  return [
    `Memory: ${memory.memory}`,
    `Updated At: ${memory.updatedAt}`,
    `Created At: ${memory.createdAt}`,
  ].join('\n');
};
```

## Searching for Memories

The first `TODO` in our list is to search for memories using Mem0. The memory from Mem0 that we've imported has several methods that you can use. One of them is `memory.search`.

```ts
const stream = createUIMessageStream<MyMessage>({
  execute: async ({ writer }) => {
    // TODO: search for memories using mem0,
    // making sure to pass in the user id
    const memoryResult = TODO;

    console.log('Search Result');
    console.dir(memoryResult, { depth: null });
```

The query that we pass into `memory.search` is kind of interesting because in this setup here, we are searching for relevant memories based on the entire message history. So you actually want to take the messages on the body and format them into a string so that you can pass them into the `memory.search`. For that, you can use the `formatMessageHistory` function that we have up the top of the file.

### Passing in the User ID

`memory.search` also takes a second parameter called `config`, which is where you'll need to pass in the user ID. In Mem0, there are no global memories. Memories are always associated with either an agent ID or a user ID or something else. And in our case, we have a user ID of `me` here that we're just going to use as a demo.

But of course, in a real application, you would use an authentication provider to grab a user ID for you.

### Adding Memories to the System Prompt

Our next `TODO` is to add these memories and format them into the system prompt. We have a handy function up the top here called `formatMemory`, which allows us to format a memory that we get from Mem0.

```ts
// TODO: Add memories to the system prompt
// TODO: Add the current date to the system prompt so it
// can contextualise the memories
const result = streamText({
  model: google('gemini-2.0-flash-lite'),
  system: `You are a helpful assistant that can answer questions and help with tasks.

  You have access to the following memories:
  `,
  messages: convertToModelMessages(messages),
});
```

As a little aside here, we'll also need to make sure that we pass in the current date to the system prompt so it can contextualize the memories that it has.

## Adding Memories to Mem0

And finally, we go down to `onFinish` here where we need to add the new memories to Mem0, making sure to pass the user ID.

```ts
onFinish: async (response) => {
  // TODO: add memories to mem0, making
  // sure to pass in the user id.
  // Pass the entire message history to mem0
  const result = TODO;

  console.log('Add Result');
  console.dir(result, { depth: null });
};
```

We also want to make sure we pass the entire message history to Mem0, not just the stuff that we're getting from the initial JSON payload. But also, since we're inside `onFinish` here, we have access to `response.messages`, which is very, very handy. That's all of the messages that were generated from the UI message stream.

Once this is done, we should be able to tell our LLM some preferences, for instance, that you prefer aisle seats on planes.

Then you should be able to refresh the browser and see some of the new preferences sneaking into the LLM's behavior.

It's pretty exciting and pretty powerful. Good luck, and I will see you in the solution.
