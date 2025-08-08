import {
  accessSync,
  existsSync,
  readdirSync,
  readFileSync,
} from 'fs';
import { join } from 'path';

const EXERCISE_DIR = 'exercises';

const sections = readdirSync(EXERCISE_DIR);

const errors: {
  section: string;
  exercise: string;
  error: string;
}[] = [];

for (const section of sections) {
  const sectionDir = join(EXERCISE_DIR, section);
  const exercises = readdirSync(sectionDir);

  for (const exercise of exercises) {
    const exerciseDir = join(sectionDir, exercise);

    const folders = readdirSync(exerciseDir);

    const folderForReadme = folders.find(
      (folder) => folder === 'problem' || folder === 'explainer',
    );

    if (!folderForReadme) {
      errors.push({
        section,
        exercise,
        error: 'No problem or explainer folder found',
      });
      continue;
    }

    const readmeExists = existsSync(
      join(exerciseDir, folderForReadme, 'readme.md'),
    );

    if (!readmeExists) {
      errors.push({
        section,
        exercise,
        error: 'No readme.md file found',
      });
    }
  }
}

for (const error of errors) {
  console.log(
    `[${error.section}] ${error.exercise}: ${error.error}`,
  );
}
