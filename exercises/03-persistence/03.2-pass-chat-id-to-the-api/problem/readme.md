If our goal is to persist messages, we need some sort of concept of a chat. Every time we send a message, it's part of a chat thread, similar to how ChatGPT works. The AI SDK has this as a first-class concept, and it's worth examining how it works.

In fact, the AI SDK does something quite surprising. If I say "Hello, how are you?" and then look inside the request payload, we can see it's already sending an ID along with the messages:

```ts
// Example request payload
{
  messages: [...],
  id: "some-uuid-here"
}
```

This is unexpected behavior! The AI SDK generates a UUID on the frontend, which then gets passed to the backend. That backend UUID can be used to save in a database or update existing chats.

For our purposes, this automatic ID generation is problematic because we want to control the ID ourselves. Let's say we're on a URL where we're looking at a specific chat - we want that chat ID from the URL to flow into our API chat call.

I've set up React Router in our code to help with this:

```tsx
// Inside client/root.tsx
import { useSearchParams } from 'react-router';

const App = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  console.log(searchParams.get('chatId'));

  // Rest of component...
};
```

This gives us an up-to-date reference to the search params. From there, I'm grabbing the `chatId` and logging it to the console.

When we navigate to `localhost:3000?chatId=123`, we can see "123" gets logged to the console. Now we have a stable reference to a chat ID.

Your task is to find a way to pass that ID into the `useChat` hook.

```tsx
const chatId = searchParams.get('chatId');

const { messages, sendMessage } = useChat({
  // TODO: pass the chatId to the API call
});
```

Good luck, and I'll see you in the solution!

## Steps To Complete

- Extract the `chatId` from search parameters using `searchParams.get('chatId')`
- Pass the `chatId` to the `useChat` hook's options object (check the [docs](https://ai-sdk.dev/docs/ai-sdk-ui/chatbot-message-persistence#loading-an-existing-chat) for more information)
- Consider adding a fallback in case there's no `chatId` in the URL (using `crypto.randomUUID()`)
- Test your solution by navigating to `localhost:3000?chatId=123`
- Check the server console logs to verify that your specified `chatId` is being received
- Try refreshing the page to confirm the chat maintains continuity with the same ID
