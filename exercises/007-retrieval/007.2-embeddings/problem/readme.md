In the previous exercise, we looked at BM25 as a technique for retrieving documents. While it works fine with keywords, it has limitations. What we ideally want is to take the conversation history and use the LLM's knowledge to figure out what it wants from the documents.

This might sound impossible, but it exists - it's called semantic search, and it works via embeddings.

## Semantic Search

An embedding is an LLM's understanding of what a word, phrase, or document means. It's represented as an array of numbers that captures the semantic meaning of text.

The process works like this:

1. Create embeddings for all documents in your corpus
2. Create an embedding for your query (conversation history)
3. Compare the query embedding against all document embeddings
4. Rank documents by similarity score

This gives us a more sophisticated search algorithm that leverages the LLM's own understanding of text to find related patterns.

The AI SDK provides helpful functions like [`embed`](https://ai-sdk.dev/docs/reference/ai-sdk-core/embed) and [`embedMany`](https://ai-sdk.dev/docs/reference/ai-sdk-core/embed-many), and allows us to use embedding models with `google.textEmbeddingModel`.

## The Problem

In `createEmbeddings.ts`, there are three functions we need to implement:

First, we need to implement `embedLotsOfText`:

```ts
const embedLotsOfText = async (
  documents: { filename: string; content: string }[],
): Promise<
  {
    filename: string;
    content: string;
    embedding: number[];
  }[]
> => {
  // TODO: Implement this function by using the embedMany function
  throw new Error('Not implemented');
};
```

Then, we need to implement `embedOnePieceOfText`:

```ts
const embedOnePieceOfText = async (
  text: string,
): Promise<number[]> => {
  // TODO: Implement this function by using the embed function
};
```

And finally, `calculateScore`:

```ts
const calculateScore = (
  queryEmbedding: number[],
  embedding: number[],
): number => {
  // TODO: Implement this function by using the cosineSimilarity function
};
```

The `searchTypeScriptDocs` function uses these implementations to take a query, create an embedding from it, and calculate scores by comparing it against document embeddings.

## The `/api/chat` Endpoint

Once those are implemented, we need to update the chat route. In `chat.ts`, we need to modify this section:

```ts
export const POST = async (req: Request): Promise<Response> => {
  const body: { messages: MyMessage[] } = await req.json();
  const { messages } = body;

  const stream = createUIMessageStream<MyMessage>({
    execute: async ({ writer }) => {
      // TODO: call the searchTypeScriptDocs function with the
      // conversation history to get the search results
      const searchResults = TODO;

      // TODO: take the top X search results
      const topSearchResults = TODO;

      const answer = streamText({
        model: google('gemini-2.0-flash-001'),
        system: `You are a helpful TypeScript documentation assistant that answers questions based on the TypeScript documentation.
          You should use the provided documentation snippets to answer questions accurately.
          ALWAYS cite sources using markdown formatting with the filename as the source.
          Be concise but thorough in your explanations.
        `,
        prompt: [
          '## Conversation History',
          formatMessageHistory(messages),
          '## TypeScript Documentation Snippets',
          // Content continues...
```

You'll need to call the `searchTypeScriptDocs` function with the conversation history, then slice the results to get the top results (like top 5).

I recommend logging out the search results to see which files are being fetched. Once that's done, we should get similar performance to what we had before, except probably a little bit improved.

Good luck with the implementation!
