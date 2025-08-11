#!/usr/bin/env node

import fs from 'fs';
import { glob } from 'node:fs/promises';

interface ProcessedFile {
  filePath: string;
  intro: string;
  stepsToComplete: string;
  hasStepsSection: boolean;
}

/**
 * Finds all readme.md files in the repository
 */
async function findReadmeFiles(): Promise<string[]> {
  const pattern = '**/readme.md';
  const files = await glob(pattern, {
    exclude: (path) =>
      path.includes('node_modules') || path.includes('.git'),
  });
  return await Array.fromAsync(files);
}

/**
 * Splits a markdown file into intro and steps sections
 */
function splitReadmeContent(content: string): {
  intro: string;
  stepsToComplete: string;
  hasStepsSection: boolean;
} {
  // Case insensitive regex to find "Steps to Complete" section
  const stepsRegex = /^##\s+Steps\s+To\s+Complete\s*$/im;
  const match = content.match(stepsRegex);

  if (!match) {
    return {
      intro: content,
      stepsToComplete: '',
      hasStepsSection: false,
    };
  }

  const stepsIndex = match.index!;
  const intro = content.substring(0, stepsIndex).trim();
  const stepsToComplete = content.substring(stepsIndex).trim();

  return {
    intro,
    stepsToComplete,
    hasStepsSection: true,
  };
}

/**
 * Converts top-level list items to checkboxes, preserving nested items as regular list items
 * and adding spacing between top-level checkbox items
 */
function convertListItemsToCheckboxes(markdown: string): string {
  const lines = markdown.split('\n');
  const result: string[] = [];
  let inStepsSection = false;
  let lastWasTopLevelCheckbox = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;

    // Check if we're entering the Steps to Complete section
    if (line.match(/^##\s+Steps\s+To\s+Complete\s*$/i)) {
      inStepsSection = true;
      result.push(line);
      continue;
    }

    // If we're not in the steps section, just add the line as-is
    if (!inStepsSection) {
      result.push(line);
      continue;
    }

    // Check if we're leaving the steps section (next ## heading)
    if (
      line.match(/^##\s+/) &&
      !line.match(/^##\s+Steps\s+To\s+Complete\s*$/i)
    ) {
      inStepsSection = false;
      result.push(line);
      continue;
    }

    // Process list items in the steps section
    const listItemMatch = line.match(/^(\s*)([-*+]\s+)(.*)$/);

    if (listItemMatch) {
      const [, indent, listMarker, content] = listItemMatch;
      const indentLevel = indent!.length;

      // Only convert top-level list items to checkboxes
      if (indentLevel === 0) {
        // Check if it's already a checkbox
        if (content!.match(/^\[[ xX]\]\s+/)) {
          // Already a checkbox, leave as-is
          result.push(line);
        } else {
          // Convert to unchecked checkbox
          result.push(`${indent}- [ ] ${content}`);
        }

        // Add spacing after top-level checkbox items
        lastWasTopLevelCheckbox = true;
      } else {
        // Nested list item, keep as regular list item
        result.push(line);
        lastWasTopLevelCheckbox = false;
      }
    } else {
      // Not a list item, add as-is
      result.push(line);
      lastWasTopLevelCheckbox = false;
    }

    // Add spacing after top-level checkbox items (but not after the last one)
    if (lastWasTopLevelCheckbox && i < lines.length - 1) {
      const nextLine = lines[i + 1]!;
      const nextListItemMatch = nextLine.match(
        /^(\s*)([-*+]\s+)(.*)$/,
      );

      // Only add spacing if the next line is also a top-level list item
      if (nextListItemMatch) {
        const [, nextIndent] = nextListItemMatch;
        const nextIndentLevel = nextIndent!.length;

        if (nextIndentLevel === 0) {
          result.push('');
        }
      }
    }
  }

  return result.join('\n');
}

/**
 * Processes a single readme file
 */
function processReadmeFile(filePath: string): ProcessedFile {
  const content = fs.readFileSync(filePath, 'utf-8');
  const { intro, stepsToComplete, hasStepsSection } =
    splitReadmeContent(content);

  let processedSteps = stepsToComplete;
  if (hasStepsSection) {
    processedSteps =
      convertListItemsToCheckboxes(stepsToComplete);
  }

  return {
    filePath,
    intro,
    stepsToComplete: processedSteps,
    hasStepsSection,
  };
}

/**
 * Writes the processed content back to the file
 */
function writeProcessedFile(processed: ProcessedFile): void {
  const fullContent = processed.hasStepsSection
    ? `${processed.intro}\n\n${processed.stepsToComplete}`
    : processed.intro;

  fs.writeFileSync(processed.filePath, fullContent, 'utf-8');
}

/**
 * Main function
 */
async function main() {
  try {
    console.log('🔍 Finding readme.md files...');
    const readmeFiles = await findReadmeFiles();

    if (readmeFiles.length === 0) {
      console.log('❌ No readme.md files found');
      return;
    }

    console.log(
      `📁 Found ${readmeFiles.length} readme.md files`,
    );

    let processedCount = 0;
    let skippedCount = 0;

    for (const filePath of readmeFiles) {
      console.log(`\n📄 Processing: ${filePath}`);

      const processed = processReadmeFile(filePath);

      if (processed.hasStepsSection) {
        writeProcessedFile(processed);
        console.log(`✅ Converted list items to checkboxes`);
        processedCount++;
      } else {
        console.log(
          `⏭️  No "Steps to Complete" section found, skipping`,
        );
        skippedCount++;
      }
    }

    console.log(`\n🎉 Summary:`);
    console.log(`   - Processed: ${processedCount} files`);
    console.log(`   - Skipped: ${skippedCount} files`);
    console.log(`   - Total: ${readmeFiles.length} files`);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

await main();
