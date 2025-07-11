import { existsSync } from 'fs';
import { readdir, readFile, writeFile } from 'fs/promises';
import path from 'path';

export const loadTsDocs = async () => {
  const TS_DOCS_LOCATION = path.resolve(
    import.meta.dirname,
    '../../../../../datasets/ts-docs',
  );

  const files = await readdir(TS_DOCS_LOCATION);

  const docs = await Promise.all(
    files.map(async (file) => {
      const filePath = path.join(TS_DOCS_LOCATION, file);
      const content = await readFile(filePath, 'utf8');
      return {
        filename: file,
        content,
      };
    }),
  );

  return new Map(docs.map((doc) => [doc.filename, doc]));
};

export type Embeddings = Record<string, number[]>;

const getExistingEmbeddingsPath = (cacheKey: string) => {
  return path.resolve(process.cwd(), 'data', `${cacheKey}.json`);
};

/**
 * Save the embeddings in JSON
 */
const saveEmbeddings = async (
  cacheKey: string,
  embeddingsResult: Embeddings,
) => {
  const existingEmbeddingsPath =
    getExistingEmbeddingsPath(cacheKey);

  await writeFile(
    existingEmbeddingsPath,
    JSON.stringify(embeddingsResult),
  );
};

/**
 * Get the existing embeddings from the JSON file
 */
const getExistingEmbeddings = async (
  cacheKey: string,
): Promise<Embeddings | undefined> => {
  const existingEmbeddingsPath =
    getExistingEmbeddingsPath(cacheKey);

  if (!existsSync(existingEmbeddingsPath)) {
    return;
  }

  try {
    const existingEmbeddings = await readFile(
      existingEmbeddingsPath,
      'utf8',
    );
    return JSON.parse(existingEmbeddings);
  } catch (error) {
    return;
  }
};

// The amount of documents to embed in each batch
const BATCH_SIZE = 99;

// TODO: Create an embedding model
const myEmbeddingModel = 'TODO';

/**
 * Embed the documents and save them
 */
export const embedTsDocs = async (
  cacheKey: string,
): Promise<Embeddings> => {
  const docs = await loadTsDocs();

  const existingEmbeddings =
    await getExistingEmbeddings(cacheKey);

  if (existingEmbeddings) {
    return existingEmbeddings;
  }

  const embeddings: Embeddings = {};
  const docValues = Array.from(docs.values());

  // Chunk the values into batches of BATCH_SIZE
  const batches = [];
  for (let i = 0; i < docValues.length; i += BATCH_SIZE) {
    batches.push(docValues.slice(i, i + BATCH_SIZE));
  }

  // Process each chunk sequentially
  let processedCount = 0;
  for (const batch of batches) {
    // TODO - Embed the batch and save it in the embeddings object

    processedCount += batch.length;
  }

  await saveEmbeddings(cacheKey, embeddings);

  return embeddings;
};

/**
 * Search the embeddings for the most relevant documents
 */
export const searchTypeScriptDocs = async (query: string) => {
  const embeddings =
    await getExistingEmbeddings(EMBED_CACHE_KEY);

  if (!embeddings) {
    throw new Error(
      `Embeddings not yet created under this cache key: ${EMBED_CACHE_KEY}`,
    );
  }
  const docs = await loadTsDocs();

  // TODO: Embed the query
  const queryEmbedding = 'TODO';

  // TODO: Calculate the cosine similarity between the query embedding
  // and each document embedding
  const documents = 'TODO';

  return documents.sort((a, b) => b.score - a.score);
};

export const EMBED_CACHE_KEY = 'ts-docs-google';
