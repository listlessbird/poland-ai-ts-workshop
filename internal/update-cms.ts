import { execSync } from 'child_process';
import {
  getSectionAndLessonNumberFromPath,
  notFound,
} from './lesson-and-section-logic.ts';
import path from 'path';
import { existsSync } from 'fs';

const mapToLessonPath = (filePath: string) => {
  const sectionAndLessonNumber =
    getSectionAndLessonNumberFromPath(filePath);

  if (sectionAndLessonNumber === notFound) {
    return notFound;
  }

  return `${sectionAndLessonNumber.sectionPathWithNumber}${path.sep}${sectionAndLessonNumber.lessonPathWithNumber}`;
};

const unique = <T>(arr: T[]) => [...new Set(arr)];

const getChangedFiles = (): {
  created: string[];
  deleted: string[];
  renamed: Record<string, string>;
} => {
  // rename examples/rag/{01-what-is-rag-TODO => 01-what-is-rag}/.gitkeep (100%)
  // rename examples/rag/{01-what-is-rag-TODO => 01-what-is-rag}/article.md (97%)
  // rename examples/vercel-ai-sdk/{20-deepseek-reasoning-tokens => 20-deepseek-reasoning-tokens-TODO}/article.md (100%)
  // create mode 100644 examples/vercel-ai-sdk/20-deepseek-reasoning-tokens-TODO/main.ts
  // delete mode 100644 examples/vercel-ai-sdk/20-deepseek-reasoning-tokens/main.ts
  // create mode 100644 internal/shortlinks.json
  // create mode 100644 internal/shortlinks:update.ts
  const diff = execSync(
    `git diff --summary --cached`,
  ).toString();

  const renamedFiles = diff
    .trim()
    .split('\n')
    .filter(Boolean)
    .filter((line) => line.includes('rename'))
    .map((line) => {
      // Remove the percentage at the end of the line
      line = line.replace(/\s*\(\d+%\)$/, '');

      const match = line.match(
        /rename (.*?){(.+?) => (.+?)}(.*)/,
      );
      if (!match) return null;
      const [, prefix, oldSegment, newSegment, suffix] = match;
      const oldPath = prefix! + oldSegment + suffix;
      const newPath = prefix! + newSegment + suffix;

      return { oldPath, newPath };
    })
    .filter((m) => m !== null);

  const createdFiles = diff
    .trim()
    .split('\n')
    .filter(Boolean)
    .filter((line) => line.includes('create'))
    .map((line) => line.replace(/^create mode \d+/, '').trim());

  const deletedFiles = diff
    .trim()
    .split('\n')
    .filter(Boolean)
    .filter((line) => line.includes('delete'))
    .map((line) => line.replace(/^delete mode \d+/, '').trim());

  return {
    created: unique(
      createdFiles
        .map(mapToLessonPath)
        .filter((m) => m !== notFound),
    ),
    deleted: unique(
      deletedFiles
        .map(mapToLessonPath)
        .filter((m) => m !== notFound),
    ),
    renamed: renamedFiles.reduce(
      (acc, m) => {
        const oldPath = mapToLessonPath(m.oldPath);
        const newPath = mapToLessonPath(m.newPath);

        if (oldPath === notFound || newPath === notFound) {
          return acc;
        }

        acc[oldPath] = newPath;
        return acc;
      },
      {} as Record<string, string>,
    ),
  };
};

const repoPath = path.join(process.cwd(), 'exercises');

const changedFiles = getChangedFiles();

if (
  changedFiles.created.length === 0 &&
  changedFiles.deleted.length === 0 &&
  Object.keys(changedFiles.renamed).length === 0
) {
  console.log('No changes to the CMS');
  process.exit(0);
}

const pingResult = await fetch('http://localhost:5173/api/ping');

if (!pingResult.ok) {
  console.error('Failed to ping the CMS - is the CMS running?');
  process.exit(1);
}

// If lesson still exists in the repo, don't delete it
// This filters out the case where we delete a single file
// in the lesson directory
const filteredDeletedLessons = changedFiles.deleted.filter(
  (lesson) => {
    const lessonPath = path.join(repoPath, lesson);
    return !existsSync(lessonPath);
  },
);

const updateResult = await fetch(
  'http://localhost:5173/api/repos/update',
  {
    method: 'POST',
    body: JSON.stringify({
      filePath: repoPath,
      modifiedLessons: changedFiles.renamed,
      addedLessons: changedFiles.created,
      deletedLessons: filteredDeletedLessons,
    }),
  },
);

if (!updateResult.ok) {
  console.error('Failed to update the CMS');
  process.exit(1);
}

console.log('Successfully updated the CMS');
