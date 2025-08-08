import { google } from '@ai-sdk/google';
import {
  createUIMessageStream,
  createUIMessageStreamResponse,
  streamObject,
  streamText,
  type UIMessage,
} from 'ai';
import z from 'zod';
import { schedulerAgent } from './agents/scheduler-agent.ts';
import { songFinderAgent } from './agents/song-finder-agent.ts';
import { studentNotesManagerAgent } from './agents/student-notes-manager.ts';
import { todosAgent } from './agents/todos-agent.ts';

export type MyMessage = UIMessage<
  unknown,
  {
    // TODO: Define a 'data-task' type that will
    // be used to store the tasks our main agent
    // delegates to the subagents.
    // Tasks should have the following fields:
    // - id: the id of the task
    // - subagent: the name of the subagent that will perform the task
    // - task: the task to perform
    // - output: the output of the task
    task: TODO;
  }
>;

const subagents = {
  'todos-agent': todosAgent,
  'student-notes-manager': studentNotesManagerAgent,
  'song-finder-agent': songFinderAgent,
  'scheduler-agent': schedulerAgent,
};

const getSystemPrompt = () => {
  return `
    You are a helpful assistant that manages a multi-agent system.
    You will be given a conversation history and the user's initial prompt.
    You will also be given a plan to follow.

    The current date is ${new Date().toISOString()}.

    You must follow the plan exactly, and generate the _next_ step only.

    If the plan is complete, return an empty list of tasks.

    You have access to four subagents:

    - todos-agent: This agent manages a list of todos.
    - student-notes-manager: This agent manages a list of student notes.
    - song-finder-agent: This agent finds songs using the web.
    - scheduler-agent: This agent manages a calendar.

    You will return a list of tasks to delegate to the subagents.
    These tasks will be executed in parallel.

    Subagents can handle complicated tasks, so don't be afraid to delegate large tasks to them.

    This means that inter-dependent tasks (like finding X and using X to create Y) should be split into two tasks.

    Think step-by-step - first decide what tasks need to be performed,
    then decide which subagent to use for each task.
  `;
};

const formatMessageHistory = (messages: MyMessage[]) => {
  return messages
    .map((message) => {
      return [
        message.role === 'user' ? '## User' : '## Assistant',
        message.parts
          .map((part) => {
            if (part.type === 'text') {
              return part.text;
            }

            return '';
          })
          .join('\n'),
      ].join('\n');
    })
    .join('\n');
};

export const POST = async (req: Request): Promise<Response> => {
  const body: { messages: MyMessage[] } = await req.json();
  const { messages } = body;

  const stream = createUIMessageStream<MyMessage>({
    execute: async ({ writer }) => {
      const formattedMessages = formatMessageHistory(messages);
      let step = 0;

      while (
        // TODO: add a condition to the while loop
        // that will act as a backstop to prevent infinite loops
        TODO
      ) {
        // TODO: call streamObject to generate a list of tasks
        // that will be handed out to the subagents. Use the
        // getSystemPrompt function to get the system prompt.
        // Pass in the formattedMessages as the initial prompt.
        // The returned tasks should be an array of objects with
        // the following fields:
        // - subagent: the name of the subagent that will perform the task
        // - task: the task to perform
        const tasksResult = TODO;

        // NOTE: Now, we're streaming in the tasks to the client
        // as they are generated. So that we get a stable
        // reference for each task, we create a map of indexes
        // (where the index is the index of the task in the array)
        // to a unique id, which we can use to pass to the writer.
        const indexToIdMap = new Map<number, string>();

        for await (const chunk of tasksResult.partialObjectStream) {
          const tasks = chunk.tasks ?? [];

          tasks.forEach((task, index) => {
            // NOTE: If we haven't seen this index before,
            // we need to create a new id for it.
            if (!indexToIdMap.has(index)) {
              indexToIdMap.set(index, crypto.randomUUID());
            }

            const id = indexToIdMap.get(index)!;

            // TODO: Write the task to the client, using writer.write,
            // remembering to pass in the id above.
            // If we don't pass in an id, a new data part will
            // be created for each task update - potentially
            // spewing out a LOT of half-formed in the UI.
            TODO;
          });
        }

        // TODO: Get the tasks from the result.
        const tasks = TODO;

        // NOTE: If there are no tasks, we're done
        // and we can break out of the loop.
        if (tasks.length === 0) {
          break;
        }

        // TODO: console.log the tasks so we can see them
        // in the terminal.
        TODO;

        // NOTE: For now, we'll just break after the first step
        // so we can see the output
        break;

        step++;
      }
    },
    onError(error) {
      console.error(error);
      return 'An error occurred while finding the song.';
    },
  });

  return createUIMessageStreamResponse({
    stream,
  });
};
