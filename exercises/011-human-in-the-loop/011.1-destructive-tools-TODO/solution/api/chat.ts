import { google } from '@ai-sdk/google';
import {
  createUIMessageStream,
  createUIMessageStreamResponse,
  generateText,
  streamObject,
  streamText,
  type UIMessage,
} from 'ai';
import z from 'zod';
import {
  findDecisionsToProcess,
  type HITLDecisionsToProcess,
} from './hitl-processor.ts';
import { sendEmail } from './email-service.ts';

export type Action = {
  id: string;
  type: 'send-email';
  content: string;
  to: string;
  subject: string;
};

export type ActionOutput = {
  type: 'send-email';
  message: string;
};

export type ActionDecision =
  | {
      type: 'approve';
    }
  | {
      type: 'reject';
      reason: string;
    };

export type MyMessage = UIMessage<
  unknown,
  {
    'action-start': {
      action: Action;
    };
    'action-decision': {
      // The original action ID that this decision is for.
      actionId: string;
      decision: ActionDecision;
    };
    'action-end': {
      output: ActionOutput;
      // The original action ID that this output is for.
      actionId: string;
    };
  }
>;

export const POST = async (req: Request): Promise<Response> => {
  const body: { messages: MyMessage[] } = await req.json();
  const { messages } = body;

  const mostRecentUserMessage = messages[messages.length - 1];

  if (!mostRecentUserMessage) {
    return new Response('Messages array cannot be empty', {
      status: 400,
    });
  }

  if (mostRecentUserMessage.role !== 'user') {
    return new Response('Last message must be a user message', {
      status: 400,
    });
  }

  const mostRecentAssistantMessage = messages.findLast(
    (message) => message.role === 'assistant',
  );

  const hitlResult = findDecisionsToProcess({
    mostRecentUserMessage,
    mostRecentAssistantMessage,
  });

  if ('status' in hitlResult) {
    return new Response(hitlResult.message, {
      status: hitlResult.status,
    });
  }

  const stream = createUIMessageStream<MyMessage>({
    execute: async ({ writer }) => {
      for (const { action, decision } of hitlResult) {
        if (decision.type === 'approve') {
          // Perform the action
          sendEmail({
            to: action.to,
            subject: action.subject,
            content: action.content,
          });

          // Write the result of the action to the stream
          writer.write({
            type: 'data-action-end',
            data: {
              actionId: action.id,
              output: {
                type: action.type,
                message: 'Email sent',
              },
            },
          });
        } else {
          // TODO: write recovery logic here

          console.log('Email not sent:', action);
          writer.write({
            type: 'data-action-end',
            data: {
              actionId: action.id,
              output: {
                type: action.type,
                message: 'Email not sent: ' + decision.reason,
              },
            },
          });
        }
      }

      // TODO: talk to an actual LLM instead of just ALWAYS
      // requesting to send an email
      writer.write({
        type: 'data-action-start',
        data: {
          action: {
            id: crypto.randomUUID(),
            type: 'send-email',
            content: 'Hello, world!',
            to: 'test@test.com',
            subject: 'Test',
          },
        },
      });
    },
  });

  return createUIMessageStreamResponse({
    stream,
  });
};
