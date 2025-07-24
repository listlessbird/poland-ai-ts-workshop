You can also add an `onFinish` callback to the `streamText` function.

```ts
const result = streamText({
  model: google('gemini-2.0-flash-001'),
  messages: convertToModelMessages(messages),
  onFinish: async ({ response }) => {
    console.log('onFinish', response.messages);
  },
});
```

This callback is called when the stream is complete.

The `response` is the final response from the model.
