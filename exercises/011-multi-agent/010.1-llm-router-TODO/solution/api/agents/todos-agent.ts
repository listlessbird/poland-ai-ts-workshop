import {
  stepCountIs,
  streamText,
  tool,
  type ModelMessage,
} from 'ai';

import { google } from '@ai-sdk/google';
import { join } from 'node:path';
import z from 'zod';
import { createPersistenceLayer } from '../create-persistence-layer.ts';

type Todo = {
  id: string;
  title: string;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
};

const todosDb = createPersistenceLayer<{
  todos: {
    [todoId: string]: Todo;
  };
}>({
  databasePath: join(process.cwd(), 'todos.json'),
  defaultDatabase: {
    todos: {},
  },
});

const formatTodos = (todos: Todo[]) => {
  return todos
    .map((todo) =>
      [
        `## ${todo.title}`,
        `ID: ${todo.id}`,
        `Completed: ${todo.completed}`,
        `Created at: ${todo.createdAt}`,
        `Updated at: ${todo.updatedAt}`,
      ].join('\n'),
    )
    .join('\n\n');
};

const formatMessages = (messages: ModelMessage[]) => {
  return messages
    .map((message) => {
      let content: string;

      if (typeof message.content === 'string') {
        content = message.content;
      } else {
        content = message.content
          .map((part) => {
            if (part.type === 'text') {
              return part.text;
            }

            if (part.type === 'tool-call') {
              return [
                `Tool call: ${part.toolName}`,
                `Input: ${JSON.stringify(part.input)}`,
              ].join('\n');
            }

            if (part.type === 'tool-result') {
              return [
                `Tool result: ${part.toolName}`,
                `Output: ${JSON.stringify(part.output)}`,
              ].join('\n');
            }
          })
          .filter((part) => part !== undefined)
          .join('\n\n');
      }

      return [
        message.role === 'user' ? 'User:' : 'Assistant:',
        content,
      ].join('\n\n');
    })
    .join('\n\n');
};

export const todosAgent = async (opts: {
  prompt: string;
  onStatusUpdate: (status: string) => void;
  onSummaryStart: () => string;
  onSummaryDelta: (id: string, delta: string) => void;
  onSummaryEnd: (id: string) => void;
}) => {
  opts.onStatusUpdate(`Deciding what to do...`);

  const db = await todosDb.loadDatabase();
  const todos = Object.values(db.todos);

  const streamResult = streamText({
    model: google('gemini-2.0-flash'),
    system: `
      You are a helpful assistant that manages a list of todos.

      You have access to the following tools:

      - createTodos: Create one or more todos
      - updateTodo: Update an existing todo
      - deleteTodo: Delete an existing todo

      You will be given a prompt, and you will need to use the tools to manage the todos.

      Never show the IDs to the user; they are for internal use only.

      The current todos are:

      ${formatTodos(todos)}
    `,
    prompt: opts.prompt,
    tools: {
      createTodos: tool({
        description: 'Create a new todo',
        inputSchema: z.object({
          todos: z.array(
            z.object({
              title: z.string(),
            }),
          ),
        }),
        execute: async (input) => {
          const todos = input.todos.map((todo) => ({
            id: crypto.randomUUID(),
            title: todo.title,
            completed: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }));

          await todosDb.updateDatabase((db) => {
            todos.forEach((todo) => {
              db.todos[todo.id] = todo;
            });
          });

          return [
            `Todos created successfully`,
            ...todos.map(
              (todo) => `- ${todo.title} (${todo.id})`,
            ),
          ].join('\n');
        },
      }),
      updateTodo: tool({
        description: 'Update an existing todo',
        inputSchema: z.object({
          id: z.string(),
          title: z
            .string()
            .optional()
            .describe(
              'The title of the todo - only include if you want to change it',
            ),
          completed: z
            .boolean()
            .optional()
            .describe(
              'Whether the todo is completed - only include if you want to change it',
            ),
        }),
        execute: async (input) => {
          const db = await todosDb.loadDatabase();

          const todo = db.todos[input.id];

          if (!todo) {
            return `Todo with ID ${input.id} not found`;
          }

          await todosDb.updateDatabase((db) => {
            db.todos[input.id] = {
              ...todo,
              ...input,
              updatedAt: new Date().toISOString(),
            };
          });

          return 'Todo updated successfully';
        },
      }),
      deleteTodo: tool({
        description: 'Delete an existing todo',
        inputSchema: z.object({
          id: z.string(),
        }),
        execute: async (input) => {
          const db = await todosDb.loadDatabase();

          if (!db.todos[input.id]) {
            return `Todo with ID ${input.id} not found`;
          }

          await todosDb.updateDatabase((db) => {
            delete db.todos[input.id];
          });

          return 'Todo deleted successfully';
        },
      }),
    },
    stopWhen: stepCountIs(10),
  });

  await streamResult.consumeStream();

  const finalMessages = (await streamResult.response).messages;

  const summarizeStreamResult = streamText({
    model: google('gemini-2.0-flash'),
    system: `
      You are a helpful assistant that summarizes a subagent's output.
      You will be given an agent's thought process and results, and you will need to summarize the results.
      You will also be given the initial prompt so you can understand the context of the output.
      Provide a summary that is relevant to the initial prompt.
      Reply as if you are the subagent.
      The user will ONLY see the summary, not the thought process or results - so make it good!
    `,
    prompt: `
      Initial prompt:
      
      ${opts.prompt}

      The subagent's output is:

      ${formatMessages(finalMessages)}
    `,
  });

  const summaryPartId = opts.onSummaryStart();

  for await (const chunk of summarizeStreamResult.toUIMessageStream()) {
    if (chunk.type === 'text-delta') {
      opts.onSummaryDelta(summaryPartId, chunk.delta);
    }
  }

  opts.onSummaryEnd(summaryPartId);

  await summarizeStreamResult.consumeStream();
};
