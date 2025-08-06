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

type CalendarEvent = {
  id: string;
  title: string;
  description?: string;
  start: string;
  end: string;
  createdAt: string;
  updatedAt: string;
};

const eventsDb = createPersistenceLayer<{
  events: {
    [eventId: string]: CalendarEvent;
  };
}>({
  databasePath: join(process.cwd(), 'schedule.json'),
  defaultDatabase: {
    events: {},
  },
});

const formatCalendarEvents = (events: CalendarEvent[]) => {
  return events
    .map((event) =>
      [
        `## ${event.title}`,
        `ID: ${event.id}`,
        `Start: ${event.start}`,
        `End: ${event.end}`,
        `Created at: ${event.createdAt}`,
        `Updated at: ${event.updatedAt}`,
        `<description>`,
        event.description,
        `</description>`,
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

export const schedulerAgent = async (opts: {
  prompt: string;
  onStatusUpdate: (status: string) => void;
  onSummaryStart: () => string;
  onSummaryDelta: (id: string, delta: string) => void;
  onSummaryEnd: (id: string) => void;
}) => {
  opts.onStatusUpdate(`Deciding what to do...`);

  const streamResult = streamText({
    model: google('gemini-2.0-flash'),
    system: `
      You are a helpful assistant that manages a calendar.

      The current date and time is ${new Date().toISOString()}.

      You have access to the following tools:

      - createEvents: Create one or more events in the calendar
      - updateEvent: Update an existing event in the calendar
      - deleteEvent: Delete an existing event in the calendar
      - listEvents: List events in the calendar between a specified range

      When you are asked to create an event, ensure that you check the day's events first to avoid conflicts.

      If you need to find an ID for a lesson, use the list events tool.
      
      You will be given a prompt, and you will need to use the tools to manage the calendar.
    `,
    prompt: opts.prompt,
    tools: {
      createEvents: tool({
        description: 'Create a new event in the calendar',
        inputSchema: z.object({
          events: z.array(
            z.object({
              title: z.string(),
              description: z.string().optional(),
              start: z
                .string()
                .describe(
                  'The start time of the event in ISO 8601 format',
                ),
              end: z
                .string()
                .describe(
                  'The end time of the event in ISO 8601 format',
                ),
            }),
          ),
        }),
        execute: async (input) => {
          const events = input.events.map((event) => ({
            id: crypto.randomUUID(),
            title: event.title,
            description: event.description,
            start: event.start,
            end: event.end,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }));

          await eventsDb.updateDatabase((db) => {
            events.forEach((event) => {
              db.events[event.id] = event;
            });
          });

          return [
            `Events created successfully`,
            ...events.map(
              (event) => `- ${event.title} (${event.id})`,
            ),
          ].join('\n');
        },
      }),
      updateEvent: tool({
        description: 'Update an existing event in the calendar',
        inputSchema: z.object({
          id: z.string(),
          title: z
            .string()
            .optional()
            .describe(
              'The title of the event - only include if you want to change it',
            ),
          description: z
            .string()
            .optional()
            .describe(
              'The description of the event - only include if you want to change it',
            ),
          start: z
            .string()
            .optional()
            .describe(
              'The start time of the event - only include if you want to change it',
            ),
          end: z
            .string()
            .optional()
            .describe(
              'The end time of the event - only include if you want to change it',
            ),
        }),
        execute: async (input) => {
          const db = await eventsDb.loadDatabase();

          const event = db.events[input.id];

          if (!event) {
            return `Event with ID ${input.id} not found`;
          }

          await eventsDb.updateDatabase((db) => {
            db.events[input.id] = {
              ...event,
              ...input,
              updatedAt: new Date().toISOString(),
            };
          });

          return 'Event updated successfully';
        },
      }),
      deleteEvent: tool({
        description: 'Delete an existing event in the calendar',
        inputSchema: z.object({
          id: z.string(),
        }),
        execute: async (input) => {
          const db = await eventsDb.loadDatabase();

          if (!db.events[input.id]) {
            return `Event with ID ${input.id} not found`;
          }

          await eventsDb.updateDatabase((db) => {
            delete db.events[input.id];
          });

          return 'Event deleted successfully';
        },
      }),
      listEvents: tool({
        description:
          'List events in the calendar between a specified range',
        inputSchema: z.object({
          start: z
            .string()
            .optional()
            .describe(
              'The start time of the range in ISO 8601 format - if not provided, the start of the calendar will be used',
            ),
          end: z
            .string()
            .optional()
            .describe(
              'The end time of the range in ISO 8601 format - if not provided, the end of the calendar will be used',
            ),
        }),
        execute: async (input) => {
          const db = await eventsDb.loadDatabase();
          const allEvents = Object.values(db.events);

          const filteredEvents = allEvents.filter((event) => {
            const eventStart = new Date(event.start);
            const eventEnd = new Date(event.end);

            const rangeStart = input.start
              ? new Date(input.start)
              : new Date(0);
            const rangeEnd = input.end
              ? new Date(input.end)
              : new Date();

            return (
              eventStart >= rangeStart && eventEnd <= rangeEnd
            );
          });

          if (filteredEvents.length === 0) {
            return 'No events found in the specified range';
          }

          return formatCalendarEvents(filteredEvents);
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
