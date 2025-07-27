Our workflow is working pretty nicely. We're getting some decent output, but our user is not seeing anything on their screen for a significant amount of time. That's because we are using `generateText` here.

```ts
// Current code using generateText
const writeSlackResult = await generateText({
  model: google('gemini-2.0-flash-001'),
  system: WRITE_SLACK_MESSAGE_FIRST_DRAFT_SYSTEM,
  prompt: `
    Conversation history:
    ${formatMessageHistory(messages)}
  `,
});
```

In other words, this `await` is waiting for this entire piece of text to be generated before we can continue with the evaluation. And then only finally, when we get to the final Slack attempt, do we then start streaming the text to the user via `toUIMessageStreamResponse`.

It would be much better if the user could see tokens on the screen faster, if we could improve our TTFT, time to first token. The way we're going to do that is via streaming some custom data parts.

## Declaring A Custom Message Type

We're going to create a custom `MyMessage` type using `UIMessage` and declare some custom data parts in here:

```ts
// TODO: Replace with this
export type MyMessage = UIMessage<
  unknown,
  {
    'slack-message': string;
    'slack-message-feedback': string;
  }
>;
```

One data part is going to represent the evaluation result and one is gonna represent the first draft. And I think we can keep the final Slack attempt how it is.

You probably won't need to change much of this code here. As extra prep for this lesson, I recommend you check out the reference material on streaming custom data parts, because that will tell you a few things that will help you solve these next todos.

## Streaming The Custom Data Parts

Instead of waiting for the entire text to be generated, we're going to stream the custom data parts as they are generated.

Check out the reference material on streaming custom data parts for more information on how to do this.

## Passing The Custom Message Type To The Frontend

Inside our frontend here, we definitely want to pass `MyMessage` to the `useChat` hook:

```tsx
// Change this:
const { messages, sendMessage } = useChat({});

// To this:
const { messages, sendMessage } = useChat<MyMessage>({});
```

## Rendering The Custom Data Parts

And we'll also want to go into the components and render the messages inside the message component. You'll need to update the `Message` component to handle the custom data parts:

```tsx
// Message component will need to handle custom data parts
export const Message = ({
  role,
  parts,
}: {
  role: string;
  parts: MyMessage['parts'];
}) => {
  // Add rendering for slack-message and slack-message-feedback parts
  // ...
};
```

And again, there's examples for all of these things in the reference material, which as a generous teacher, I will link to. But good luck and I will see you in the solution.
