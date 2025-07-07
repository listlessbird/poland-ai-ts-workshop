If we're going to persist chats, we need some way of telling the backend which chats we are either creating or updating.

Every call to `POST /api/chat` is going to be an upsert. In other words, if no chat exists with the given id, a new chat will be created. If a chat exists with the given id, the chat will be updated.

That means we're going to need to pass an `id` to `/api/chat` with every request - and we'll want to control which ID that is from the frontend.

I've added a console log to our API chat endpoint.

```ts
import { type UIMessage } from "ai";

export const POST = async (req: Request): Promise<Response> => {
  const body: { messages: UIMessage[]; id: string } = await req.json();
  const { messages, id } = body;

  console.log("id", id);

  // ...
};
```

I want you to try something and notice how strange it is. Try making a request to our API.

You'll notice that an ID is already being passed there. In other words, this is a pattern that the AI SDK encourages.

To get this under control, I want you to pass a `chat` property to `useChat`. This will represent the state of the current chat as it is now, and will allow you to customize the `id` that is passed to the API.
