import { promises as fs } from 'fs';
import { join } from 'path';
import type { UIMessage } from 'ai';

export namespace DB {
  // Types for our persistence layer
  export interface MemoryItem {
    id: string;
    memory: string;
    createdAt: string;
  }

  export interface PersistenceData {
    memories: DB.MemoryItem[];
  }
}

// File path for storing the data
const DATA_FILE_PATH = join(
  process.cwd(),
  'data',
  'memories.local.json',
);

export const generateId = () => {
  return Math.random().toString(36).substring(2, 10);
};

/**
 * Ensure the data directory exists
 */
async function ensureDataDirectory(): Promise<void> {
  const dataDir = join(process.cwd(), 'data');
  try {
    await fs.access(dataDir);
  } catch {
    await fs.mkdir(dataDir, { recursive: true });
  }
}

async function loadDB(): Promise<DB.PersistenceData> {
  try {
    await ensureDataDirectory();
    const data = await fs.readFile(DATA_FILE_PATH, 'utf-8');
    return JSON.parse(data) as DB.PersistenceData;
  } catch (error) {
    return { memories: [] };
  }
}

/**
 * Load all chats from the JSON file
 */
export async function loadMemories(): Promise<DB.MemoryItem[]> {
  try {
    await ensureDataDirectory();
    const data = await fs.readFile(DATA_FILE_PATH, 'utf-8');
    const parsed: DB.PersistenceData = JSON.parse(data);
    return parsed.memories || [];
  } catch (error) {
    // If file doesn't exist or is invalid, return empty array
    return [];
  }
}

/**
 * Save all chats to the JSON file
 */
export async function saveMemories(
  memories: DB.MemoryItem[],
): Promise<void> {
  const data = await loadDB();
  data.memories = [...data.memories, ...memories];

  await fs.writeFile(
    DATA_FILE_PATH,
    JSON.stringify(data, null, 2),
    'utf-8',
  );
}

export async function updateMemory(
  memoryId: string,
  memory: Omit<DB.MemoryItem, 'id'>,
): Promise<boolean> {
  const data = await loadDB();
  data.memories = data.memories.map((m) =>
    m.id === memoryId ? { ...m, ...memory } : m,
  );

  await fs.writeFile(
    DATA_FILE_PATH,
    JSON.stringify(data, null, 2),
    'utf-8',
  );

  return true;
}

export async function deleteMemory(
  memoryId: string,
): Promise<boolean> {
  const data = await loadDB();
  data.memories = data.memories.filter((m) => m.id !== memoryId);

  await fs.writeFile(
    DATA_FILE_PATH,
    JSON.stringify(data, null, 2),
    'utf-8',
  );

  return true;
}
