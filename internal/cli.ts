import { existsSync } from "fs";
import { Command } from "commander";
import path from "path";
import { readdir } from "fs/promises";
import { execSync } from "child_process";
import { fileURLToPath } from "url";
import prompts from "prompts";

const program = new Command();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

program.arguments("<exerciseNumber>").action(async (exerciseNumber: string) => {
  const exercisesDir = path.resolve(__dirname, "..", "exercises");

  if (!existsSync(exercisesDir)) {
    console.error(`Exercises directory not found at ${exercisesDir}`);
    process.exit(1);
  }

  const sections = await readdir(exercisesDir);

  // Find the section directory that starts with the exercise number
  const sectionDir = sections.find((section) => {
    return section.startsWith(exerciseNumber);
  });

  if (!sectionDir) {
    console.error(
      `Could not find section ${exerciseNumber} in ${exercisesDir}. Does it exist?`
    );
    process.exit(1);
  }

  const sectionPath = path.resolve(exercisesDir, sectionDir);
  const exercises = await readdir(sectionPath);

  // Find the first exercise (assuming it's the main one)
  const exerciseDir = exercises.find((exercise) => {
    return exercise.includes("example") || exercise.includes("problem");
  });

  if (!exerciseDir) {
    console.error(`Could not find a valid exercise in ${sectionPath}.`);
    process.exit(1);
  }

  const exercisePath = path.resolve(sectionPath, exerciseDir);

  // Get all directories inside the exercise
  const exerciseContents = await readdir(exercisePath, { withFileTypes: true });
  const directories = exerciseContents
    .filter((item) => item.isDirectory())
    .map((dir) => dir.name);

  if (directories.length === 0) {
    console.error(`No directories found in exercise ${exerciseNumber}.`);
    process.exit(1);
  }

  // Prompt user to choose which directory to run
  const response = await prompts({
    type: "autocomplete",
    name: "selectedDirectory",
    message: `Choose which directory to run for exercise ${exerciseNumber}:`,
    choices: directories.map((dir) => ({
      title: dir,
      value: dir,
    })),
  });

  if (!response.selectedDirectory) {
    console.log("No directory selected. Exiting.");
    process.exit(0);
  }

  const selectedPath = path.resolve(exercisePath, response.selectedDirectory);
  const mainFilePath = path.resolve(selectedPath, "main.ts");

  if (!existsSync(mainFilePath)) {
    console.error(
      `Could not find main.ts file in ${response.selectedDirectory} for exercise ${exerciseNumber}.`
    );
    process.exit(1);
  }

  console.log(`Running exercise ${exerciseNumber} from ${mainFilePath}`);

  try {
    execSync(`pnpm tsx --env-file=.env ${mainFilePath}`, {
      stdio: "inherit",
    });
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
});

program.parse(process.argv);
