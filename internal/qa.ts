import * as c from '@clack/prompts';
import { anthropic } from '@ai-sdk/anthropic';
import { streamText } from 'ai';
import fs, { existsSync } from 'fs';
import path from 'path';

function handleNoSelection(
  input: string | symbol,
): asserts input is string {
  if (c.isCancel(input)) {
    c.outro('No selection made');
    process.exit(0);
  }
}

c.intro('QA');

const EXERCISE_DIR = path.join(process.cwd(), 'exercises');

const sections = fs.readdirSync(EXERCISE_DIR);

const section = await c.select({
  message: 'Select a section',
  options: sections.map((section) => ({
    label: section,
    value: section,
  })),
});

handleNoSelection(section);

const exercises = fs.readdirSync(
  path.join(EXERCISE_DIR, section),
);

const exercise = await c.select({
  message: 'Select an exercise',
  options: exercises.map((exercise) => ({
    label: exercise,
    value: exercise,
  })),
});

handleNoSelection(exercise);

const exercisePath = path.join(EXERCISE_DIR, section, exercise);

const isProblem = existsSync(path.join(exercisePath, 'problem'));

c.log.info(`isProblem: ${isProblem}`);

const isExplainer = existsSync(
  path.join(exercisePath, 'explainer'),
);

c.log.info(`isExplainer: ${isExplainer}`);

if (!isProblem && !isExplainer) {
  c.outro('No problem or explainer found');
  process.exit(1);
}

const files = fs.readdirSync(exercisePath, {
  recursive: true,
}) as string[];

const exerciseType = isExplainer ? 'explainer' : 'problem';

const readmeFile = files.find(
  (file) =>
    file.includes('readme.md') && file.includes(exerciseType),
);

if (!readmeFile) {
  c.outro('No readme file found');
  process.exit(1);
}

const readmePath = path.join(exercisePath, readmeFile);

const readme = fs.readFileSync(readmePath, 'utf-8');

c.log.info(`Readme: ${readmePath}`);

const linkRequests = await streamText({
  model: anthropic('claude-3-7-sonnet-20250219'),
  system: `
    You are a helpful assistant that checks for missing links in a piece of course material.
    You'll be provided the course material as a markdown document.
    The user is expected to take the Markdown document and complete a coding exercise.
    The Markdown document will be likely missing some crucial links to external documentation or reference material that the student will need to complete the task.
    Your job is to identify these missing links and return a set of link requests.
    You should explain why each link request is being made and specifically what is required.
    
    Assume that the student already has API keys for a Google AI model, a Node.js environment set up, and TypeScript.
  `,
  prompt: readme,
});

await c.stream.success(linkRequests.textStream);

c.outro('Complete!');
