Now that we've gone full workflow, why don't we pull it back a little bit and inject some agentic behavior into our workflow. Instead of just taking a linear path - creating a first draft, evaluating it, then creating another draft - let's run that loop a specific number of times to see if we can get a better output.

The appeal of this approach is flexibility. That loop count could be increased over time or tuned to configure our system remotely. You might even give high-paying customers a better experience than lower-paying customers by increasing their loop iterations.

The code for this lives inside our POST route. In the problem code, we need to modify the `execute` function to implement our loop:

```ts
export const POST = async (req: Request): Promise<Response> => {
  const body: { messages: MyMessage[] } = await req.json();
  const { messages } = body;

  const stream = createUIMessageStream<MyMessage>({
    execute: async ({ writer }) => {
      let step = TODO; // TODO: keep track of the step we're on
      let mostRecentDraft = TODO; // TODO: keep track of the most recent draft
      let mostRecentFeedback = TODO; // TODO: keep track of the most recent feedback

      // TODO: create a loop which:
      // 1. Writes a Slack message
      // 2. Evaluates the Slack message
      // 3. Saves the feedback in the variables above
      // 4. Increments the step variable
    },
  });

  return stream.toUIMessageStreamResponse();
};
```

Instead of the existing linear workflow with separate sections for first draft, feedback, and final message, we'll create a `while` loop that repeats the process a specified number of times.

We'll need to maintain state between iterations by tracking:

- Which step we're on
- The most recent draft
- The most recent feedback

Once the loop is done, we'll use the final draft as our response, streaming it as a text part rather than a custom data part. Check out the reference material to see how to do this.

Make sure you lock down the stop condition of your while loop - paid systems with potential infinite loops can be scary! Always ensure your loop has a clear exit condition.

Good luck, and I'll see you in the solution.
