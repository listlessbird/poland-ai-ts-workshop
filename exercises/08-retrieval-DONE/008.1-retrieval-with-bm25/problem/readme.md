How do we get an LLM to answer questions based on data that isn't in its training set? This is a really common problem when building anything with LLMs. You might want to create a question-answering bot that searches internal company docs and provides accurate answers.

For public information, it's easy - just call an API like Brave's or Tavily's that performs a Google search, scrape some websites, and you have what you need. But what about private information?

In this exercise, we'll implement a simple and cost-effective approach to this problem. Then in later exercises, we'll refine and improve it.

## The Setup

We're building a TypeScript documentation assistant that will:

1. Generate keywords from user questions
2. Search TypeScript docs using those keywords using the BM25 algorithm
3. Feed the most relevant doc snippets to the LLM to produce accurate answers

Let's examine our setup. We have a POST route handler that receives messages from the user:

```ts
export const POST = async (req: Request): Promise<Response> => {
  const body: { messages: MyMessage[] } = await req.json();
  const { messages } = body;

  const stream = createUIMessageStream<MyMessage>({
    execute: async ({ writer }) => {
      // TODO: Implement keyword generator
      const keywords = TODO;

      // TODO: Get top search results
      const topSearchResults = TODO;

      // Stream text response based on search results
      // ...
    },
  });

  return createUIMessageStreamResponse({
    stream,
  });
};
```

Our first task is implementing a keyword generator. We need to extract relevant search terms from the conversation history. This is where we'll use `streamObject` from the AI SDK.

For search functionality, we'll use the BM25 algorithm (Best Match 25), which ranks documents based on keyword relevance. The system loads TypeScript documentation from the repo's root at `datasets/ts-docs` using the `loadTsDocs` function:

```ts
export const loadTsDocs = async () => {
  const TS_DOCS_LOCATION = path.resolve(
    import.meta.dirname,
    '../../../../../datasets/ts-docs',
  );

  const files = await readdir(TS_DOCS_LOCATION);

  const docs = await Promise.all(
    files.map(async (file) => {
      const filePath = path.join(TS_DOCS_LOCATION, file);
      const content = await readFile(filePath, 'utf8');
      return {
        filename: file,
        content,
      };
    }),
  );

  return docs;
};
```

This function reads all the TypeScript documentation files from the dataset and returns an array of objects containing the filename and content of each document.

The `searchTypeScriptDocs` function then uses these documents for keyword searching:

```ts
export const searchTypeScriptDocs = async (
  keywords: string[],
) => {
  const docs = await loadTsDocs();

  const scores: number[] = (BM25 as any)(
    docs.map((doc) => doc.content),
    keywords,
  );

  return scores
    .map((score, index) => ({
      score,
      doc: docs[index],
    }))
    .sort((a, b) => b.score - a.score);
};
```

This function calculates relevance scores for each document based on our keywords, and returns a sorted list with the most relevant docs first.

After getting search results, we need to select the top X most relevant documents to feed into our LLM. There are many docs, so we need to be selective about how many we pass to the model.

Finally, we'll use these selected documents as context for the LLM to generate an informative response that cites sources from the TypeScript documentation.

BM25 is a simple starting point for this task - not perfect, but effective for getting started. In future exercises, we'll explore more sophisticated approaches.

## Steps To Complete

- Implement the keyword generator using `streamObject` with the Google Gemini model
  - Use the provided `KEYWORD_GENERATOR_SYSTEM_PROMPT`
  - Define a schema using Zod that specifies an array of strings for keywords
  - Pass the formatted message history to the prompt

- Create a way to display generated keywords to the user during the search
  - Generate a unique ID for this part
  - Write the keywords to the stream writer

- Use the `searchTypeScriptDocs` function with the generated keywords
  - Wait for the complete keywords object to be available

- Select the top most relevant search results (decide how many - 5 to 10 is typical)
  - Use array slicing to get the top results

- Test your implementation by running the local dev server
  - Try asking different TypeScript questions to see if the assistant returns relevant documentation
  - Check if the keyword queries are displayed correctly in the UI
  - Verify that the responses include citations from TypeScript documentation files
