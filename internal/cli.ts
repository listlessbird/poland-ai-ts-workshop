import { existsSync } from 'fs';
import { Command } from 'commander';
import path from 'path';
import { readdir } from 'fs/promises';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import prompts from 'prompts';

const program = new Command();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

program
  .arguments('<exerciseNumber>')
  .action(async (exerciseNumber: string) => {
    const exercisesDir = path.resolve(
      __dirname,
      '..',
      'exercises',
    );

    if (!existsSync(exercisesDir)) {
      console.error(
        `Exercises directory not found at ${exercisesDir}`,
      );
      process.exit(1);
    }

    const sections = await readdir(exercisesDir);
    let foundExerciseDir: string | null = null;

    // Search through each section to find the exercise
    for (const section of sections) {
      const sectionPath = path.resolve(exercisesDir, section);
      const exercises = await readdir(sectionPath);

      // Find the exercise that contains the exercise number
      const exerciseDir = exercises.find((exercise) => {
        return exercise.includes(exerciseNumber);
      });

      if (exerciseDir) {
        foundExerciseDir = path.resolve(
          sectionPath,
          exerciseDir,
        );
        break;
      }
    }

    if (!foundExerciseDir) {
      console.error(
        `Could not find exercise ${exerciseNumber} in any section.`,
      );
      process.exit(1);
    }

    // Get all directories inside the exercise (problem/solution)
    const exerciseContents = await readdir(foundExerciseDir, {
      withFileTypes: true,
    });
    const directories = exerciseContents
      .filter((item) => item.isDirectory())
      .map((dir) => dir.name);

    if (directories.length === 0) {
      console.error(
        `No directories found in exercise ${exerciseNumber}.`,
      );
      process.exit(1);
    }

    let selectedDirectory: string;

    // If there's only one directory, use it automatically
    if (directories.length === 1) {
      selectedDirectory = directories[0]!;
      console.log(
        `Auto-selecting directory: ${selectedDirectory}`,
      );
    } else {
      // Prompt user to choose which directory to run
      const response = await prompts({
        type: 'autocomplete',
        name: 'selectedDirectory',
        message: `Choose which directory to run for exercise ${exerciseNumber}:`,
        choices: directories.map((dir) => ({
          title: dir,
          value: dir,
        })),
      });

      if (!response.selectedDirectory) {
        console.log('No directory selected. Exiting.');
        process.exit(0);
      }

      selectedDirectory = response.selectedDirectory;
    }

    const selectedPath = path.resolve(
      foundExerciseDir,
      selectedDirectory,
    );
    const mainFilePath = path.resolve(selectedPath, 'main.ts');

    if (!existsSync(mainFilePath)) {
      console.error(
        `Could not find main.ts file in ${selectedDirectory} for exercise ${exerciseNumber}.`,
      );
      process.exit(1);
    }

    console.log(
      `Running exercise ${exerciseNumber} from ${mainFilePath}`,
    );

    try {
      execSync(`pnpm tsx --env-file=.env ${mainFilePath}`, {
        stdio: 'inherit',
      });
    } catch (e) {
      console.error(e);
      process.exit(1);
    }
  });

program.parse(process.argv);
