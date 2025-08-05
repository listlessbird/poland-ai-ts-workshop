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
import type { MyMessage } from '../chat.ts';

type Student = {
  id: string;
  name: string;
  notes: string[];
  createdAt: string;
  updatedAt: string;
};

const notesDb = createPersistenceLayer<{
  students: {
    [studentId: string]: Student;
  };
}>({
  databasePath: join(process.cwd(), 'student-notes.json'),
  defaultDatabase: {
    students: {},
  },
});

const formatStudentNotes = (studentNotes: Student[]) => {
  return studentNotes
    .map((student) =>
      [
        `## ${student.name}`,
        `ID: ${student.id}`,
        `Created at: ${student.createdAt}`,
        `Updated at: ${student.updatedAt}`,
        `<notes>`,
        student.notes,
        `</notes>`,
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

export const studentNotesManagerAgent = async (opts: {
  prompt: string;
  onSummaryStart: () => string;
  onSummaryDelta: (id: string, delta: string) => void;
  onSummaryEnd: (id: string) => void;
}) => {
  const db = await notesDb.loadDatabase();

  const studentNotesAsArray = Object.values(db.students);

  const streamResult = streamText({
    model: google('gemini-2.0-flash'),
    system: `
      You are a helpful assistant that manages student notes.
      The user is the singing teacher, and you are a helpful assistant that manages their student notes.
      You may be asked to search for information, or to add notes to the student's notes.

      In their current state, the notes are:

      ${formatStudentNotes(studentNotesAsArray)}
    `,
    prompt: opts.prompt,
    tools: {
      appendToStudentNotes: tool({
        description: "Append to a student's notes",
        inputSchema: z.object({
          studentId: z.string(),
          note: z
            .string()
            .describe(
              "The note to append to the student's notes.",
            ),
        }),
        execute: async ({ studentId, note }) => {
          if (!db.students[studentId]) {
            return 'Could not append note - student not found with that id.';
          }

          await notesDb.updateDatabase((db) => {
            const student = db.students[studentId]!;
            db.students[studentId] = {
              ...student,
              notes: [...student.notes, note],
              updatedAt: new Date().toISOString(),
            };
          });

          return `Success.`;
        },
      }),
      createStudent: tool({
        description: 'Create a new student',
        inputSchema: z.object({
          name: z.string(),
          note: z
            .string()
            .describe("The note to add to the student's notes."),
        }),
        execute: async ({ name, note }) => {
          const studentId = crypto.randomUUID();
          await notesDb.updateDatabase((db) => {
            db.students[studentId] = {
              id: studentId,
              name,
              notes: [note],
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
          });

          return `Success. Created student with id ${studentId}.`;
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
