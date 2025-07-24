You'll notice here we can add an `onFinish` callback to the `toUIMessageStreamResponse` function.

```ts
return result.toUIMessageStreamResponse({
  onFinish: async ({ responseMessage }) => {
    console.log('onFinish', responseMessage);
  },
});
```

This callback is called when the stream is complete.

The `responseMessage` is the last message that was produced by the model.

You can use this to log out the final message that was produced, or to do something with it.
