import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { google } from "@ai-sdk/google";
import {
  createChat,
  getChat,
  appendToChatMessages,
} from "./persistence-layer.ts";

export const POST = async (req: Request): Promise<Response> => {
  const body: { messages: UIMessage[]; id: string } = await req.json();
  const { messages, id } = body;

  let chat = await getChat(id);

  if (!chat) {
    const newChat = await createChat(id, messages);
    chat = newChat;
  } else {
    await appendToChatMessages(id, messages);
  }

  const result = streamText({
    model: google("gemini-2.0-flash-001"),
    messages: convertToModelMessages(messages),
  });

  return result.toUIMessageStreamResponse({
    onFinish: async ({ responseMessage }) => {
      await appendToChatMessages(id, [responseMessage]);
    },
  });
};

export const GET = async (req: Request): Promise<Response> => {
  const url = new URL(req.url);
  const chatId = url.searchParams.get("chatId");

  if (!chatId) {
    return new Response("No chatId provided", { status: 400 });
  }

  const chat = await getChat(chatId);

  return new Response(JSON.stringify(chat), {
    headers: {
      "Content-Type": "application/json",
    },
  });
};
