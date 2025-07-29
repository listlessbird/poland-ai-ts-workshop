Our setup is working relatively well, but there's an optimization that I've spotted that will really make a big difference. Our system is lacking a query rewriter.

## Query Rewriting

A query rewriter takes the user's query (in our case, a conversation history) and makes a more specific query out of it that we can then use to query our corpus with. It's something that happens before retrieval, and it's used to optimize the retrieval.

```txt
┌───────────────────────┐      ┌─────────────────┐      ┌───────────────┐
│                       │      │                 │      │               │
│  Conversation History │──────►  Query Rewriter │──────►  Refined Query│
│  "Tell me about TS    │      │     (LLM)       │      │ "TypeScript   │
│   generics. How do    │      │                 │      │  generics     │
│   they work in        │      │                 │      │  syntax usage │
│   interfaces?"        │      │                 │      │  interfaces"  │
│                       │      │                 │      │               │
└───────────────────────┘      └─────────────────┘      └───────┬───────┘
                                                                │
                                                                │
                                                                ▼
┌────────────────────────┐     ┌────────────────────┐     ┌────────────────┐
│                        │     │                    │     │                │
│  Retrieved Documents   │◄────┤  Vector Database/  │◄────┤  Embedding     │
│  from Corpus           │     │  Search System     │     │  Model         │
│                        │     │                    │     │                │
└────────────────────────┘     └────────────────────┘     └────────────────┘
```

## The Problem

The problem in our current setup is that we're embedding the entire conversation history, and then using that to search the corpus.

The reason that's an issue is that as the conversation gets longer, the embedding gets bigger and bigger, and the stuff towards the end (the most relevant part to the actual user's question) will start to have less impact on what gets returned from the corpus.

We need to take that massive conversation history, pass it to an LLM, and then get it to make a really refined search query that we can use to fetch the most relevant documents. That's what the query rewriter does - it rewrites this big query into something very small and focused.

## Our BM25 Keyword Search

We are already doing some of this with our BM25. BM25 requires a list of keywords that you then search the corpus with.

```ts
const keywords = await generateObject({
  model: google('gemini-2.0-flash-001'),
  system: `You are a helpful TypeScript developer, able to search the TypeScript docs for information.
    Your job is to generate a list of keywords which will be used to search the TypeScript docs.
  `,
  schema: z.object({
    keywords: z
      .array(z.string())
      .describe(
        'A list of keywords to search the TypeScript docs with. Use these for exact terminology.',
      ),
  }),
  prompt: `
    Conversation history:
    ${formatMessageHistory(messages)}
  `,
});
```

## The Solution

All we need to do is tag on an extra bit of code into this `generateObject` call, which will also return a search query. We'll need to do a little bit of prompt engineering to describe what the use case is - basically just say this thing's going to be used for semantic search.

```ts
// In chat.ts
// TODO: Generate a search query based on the conversation history
// This will be used for semantic search, which will be a big
// improvement over passing the entire conversation history.
const searchQuery = TODO;
```

This isn't a terribly difficult job. We just need to take the keyword writer we've already got and add something that makes sure we're doing it for the embeddings as well as for the BM25.

Good luck, and I will see you in the solution.
