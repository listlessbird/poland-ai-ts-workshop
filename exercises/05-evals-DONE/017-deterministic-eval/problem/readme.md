There are two main ways that you can write scorers for your evaluations. We're gonna examine the first one here, which are deterministic scorers. These are scorers that you write in code to check something deterministically about the output that the LLM contains.

For context, the other kind of scorers are LLM as a judge scorers. In other words, probabilistic scorers that might return one score or another. Those are useful for other kind of metrics that deterministic scorers can't handle. And don't worry, we'll look at those in a minute.

## The Data

I've set up a question answerer function here. We've given it a set of links here, TypeScript 5.8 release notes, 5.5, 5.6, et cetera. And we're asking the LLM a couple of questions.

```ts
const links = [
  {
    title: 'TypeScript 5.8',
    url: 'https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-8.html',
  },
  // more links...
];

evalite('Capitals', {
  data: () => [
    {
      input: 'Tell me about the TypeScript 5.8 release',
    },
    {
      input: 'Tell me about the TypeScript 5.2 release',
    },
  ],
  // ...
});
```

## The Scorers

Now we want to check this on two separate metrics here. We want to check whether the output includes some kind of markdown link. This is a really good metric to check because it makes sure that the LLM is using up-to-date sources and sources which kind of back up its point.

And also it's really helpful for the user just to be able to see something they can click out to in the output. We also want the output to be extremely concise too. So we want to check if the output is less than 500 characters.

Your job here is to do a little bit of TDD or EDD, I suppose, eval-driven development. You are going to write the scorers here based on the example that I've shown you before:

```ts
scorers: [
  {
    name: 'Includes Markdown Links',
    scorer: ({ input, output, expected }) => {
      // TODO: check if the output includes markdown links
    },
  },
  {
    name: 'Output length',
    scorer: ({ input, output, expected }) => {
      // TODO: check if the output is less than 500 characters
    },
  },
],
```

## The Task

And then you're going to update the system prompt above to first of all pass the links in here:

```ts
prompt: `
  You are a helpful assistant that can answer questions about TypeScript releases.

  Question:
  ${input}
`,
```

You'll also need to design the system prompt so that it always includes markdown links and that it answers the question very, very succinctly.

You can then use Evalite to make sure that these two deterministic evals eventually pass.

Good luck, and I'll see you in the solution.

## Steps To Complete

- Complete the "Includes Markdown Links" scorer
  - Implement logic to check if the output contains markdown links using a regular expression (your LLM will be able to help you with this)
  - Return 1 if links are found, 0 if not

- Complete the "Output length" scorer
  - Implement logic to check if the output is less than 500 characters
  - Return 1 if it's concise enough, 0 if not

- Run the exercise to see the evaluation results

- Update the system prompt to:
  - Pass the links data to the model
  - Explicitly instruct the model to include markdown links
  - Direct the model to be extremely succinct in its answers
  - Provide examples of properly formatted markdown links

- Run the evaluation using Evalite and check if both scorers pass
  - If they don't pass, refine your prompt until they do
