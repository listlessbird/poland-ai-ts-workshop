import {
  accessSync,
  existsSync,
  readdirSync,
  readFileSync,
  unlinkSync,
} from 'fs';
import { join } from 'path';
import { styleText } from 'util';

const EXERCISE_DIR = 'exercises';

const sections = readdirSync(EXERCISE_DIR);

// Group errors by section and exercise
const groupedErrors: {
  [section: string]: {
    [exercise: string]: string[];
  };
} = {};

const addError = (
  section: string,
  exercise: string,
  error: string,
) => {
  if (!groupedErrors[section]) {
    groupedErrors[section] = {};
  }
  if (!groupedErrors[section][exercise]) {
    groupedErrors[section][exercise] = [];
  }
  groupedErrors[section][exercise].push(error);
};

for (const section of sections) {
  const sectionDir = join(EXERCISE_DIR, section);
  const exercises = readdirSync(sectionDir);

  for (const exercise of exercises) {
    const exerciseDir = join(sectionDir, exercise);

    const topLevelFilesAndFolders = readdirSync(exerciseDir);

    const folderForReadme = topLevelFilesAndFolders.find(
      (folder) => folder === 'problem' || folder === 'explainer',
    );

    const allFilesRecursively = readdirSync(exerciseDir, {
      recursive: true,
    });

    const gitKeepFile = allFilesRecursively.find((file) =>
      file.includes('.gitkeep'),
    );

    if (allFilesRecursively.length > 0 && gitKeepFile) {
      // addError(
      //   section,
      //   exercise,
      //   'Found a .gitkeep file - deleted',
      // );

      unlinkSync(join(exerciseDir, gitKeepFile as string));
    }

    if (!folderForReadme) {
      addError(
        section,
        exercise,
        'No problem or explainer folder found',
      );
      continue;
    }

    const readmeExists = existsSync(
      join(exerciseDir, folderForReadme, 'readme.md'),
    );

    if (!readmeExists) {
      addError(section, exercise, 'No readme.md file found');
    }
  }
}

// Output grouped errors with proper indentation
for (const [section, exercises] of Object.entries(
  groupedErrors,
)) {
  console.log(styleText(['bold'], section));

  for (const [exercise, errors] of Object.entries(exercises)) {
    console.log(`  ${exercise}`);

    for (const error of errors) {
      console.log(styleText(['red'], `    ${error}`));
    }
  }
}
