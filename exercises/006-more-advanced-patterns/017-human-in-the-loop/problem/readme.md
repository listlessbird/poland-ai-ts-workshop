In this exercise, we are going to add a step into our setup where we need to approve or reject the plan before the AI performs its searches.

This can be achieved pretty easily by using custom data parts in the AI SDK.

I've given you a few things to work with. Inside my message, our custom UI message, I've given you a custom data part called `"plan-acceptance"`.

```ts
export type MyMessage = UIMessage<
  unknown,
  {
    queries: string[];
    /**
     * Represents whether a message is a plan acceptance or rejection.
     *
     * This will only be present on user messages.
     */
    "plan-acceptance": {
      accepted: boolean;
      feedback?: string;
    };
  }
>;
```

This represents whether the message is a plan acceptance or a rejection. It will be sent by the frontend when the plan has been accepted or rejected.

This means that all the work you'll need to do is inside the API chat endpoint.

You'll need to detect whether a plan has already been generated (by checking the reasoning part of the message).

If it has, you then need to check if the plan was accepted or rejected.

- If it was accepted, you can continue with the conversation.
- If it was rejected, you need to generate a new plan, passing in the feedback from the user.
