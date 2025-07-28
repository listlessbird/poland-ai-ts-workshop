import path from 'path';
import { readdir, readFile, writeFile } from 'fs/promises';
import { cosineSimilarity, embed, embedMany } from 'ai';
import { google } from '@ai-sdk/google';
import { existsSync } from 'fs';
import BM25 from 'okapibm25';

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

export const getExistingEmbeddings = async (
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

const myEmbeddingModel = google.textEmbeddingModel(
  'text-embedding-004',
);

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

  // Chunk the values into batches of 99
  const chunkSize = 99;
  const chunks = [];
  for (let i = 0; i < docValues.length; i += chunkSize) {
    chunks.push(docValues.slice(i, i + chunkSize));
  }

  // Process each chunk sequentially
  let processedCount = 0;
  for (const chunk of chunks) {
    const embedManyResult = await embedMany({
      model: myEmbeddingModel,
      values: chunk.map((doc) => doc.content),
      maxRetries: 0,
    });

    embedManyResult.embeddings.forEach((embedding, index) => {
      const originalIndex = processedCount + index;
      const originalValue = docValues[originalIndex]!;
      embeddings[originalValue.filename] = embedding;
    });

    processedCount += chunk.length;
  }

  await saveEmbeddings(cacheKey, embeddings);

  return embeddings;
};

export const searchTypeScriptDocs = async (
  query: string,
  bm25Keywords: string[],
) => {
  const embeddings =
    await getExistingEmbeddings(EMBED_CACHE_KEY);

  if (!embeddings) {
    throw new Error(
      `Embeddings not yet created under this cache key: ${EMBED_CACHE_KEY}`,
    );
  }
  const docs = await loadTsDocs();

  // Get embeddings-based search results
  const queryEmbedding = await embed({
    model: myEmbeddingModel,
    value: query,
  });

  const embeddingScores = Object.entries(embeddings).map(
    ([key, value]) => {
      return {
        score: cosineSimilarity(queryEmbedding.embedding, value),
        filename: key,
        content: docs.get(key)!.content,
        method: 'embeddings' as const,
      };
    },
  );

  const bm25Scores: number[] = (BM25 as any)(
    Array.from(docs.values()).map((doc) => doc.content),
    bm25Keywords,
  );

  const bm25Results = bm25Scores.map((score, index) => {
    const doc = Array.from(docs.values())[index]!;
    return {
      score,
      filename: doc.filename,
      content: doc.content,
      method: 'bm25' as const,
    };
  });

  // Get top 5 from each method
  const topEmbeddingResults = embeddingScores
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  const topBM25Results = bm25Results
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  // Combine top results and deduplicate by filename
  const allTopResults = [
    ...topEmbeddingResults,
    ...topBM25Results,
  ];

  // Create a map to deduplicate by filename, keeping the higher score
  const deduplicatedMap = new Map<
    string,
    (typeof allTopResults)[number]
  >();

  for (const result of allTopResults) {
    const existing = deduplicatedMap.get(result.filename);
    if (!existing || result.score > existing.score) {
      deduplicatedMap.set(result.filename, result);
    }
  }

  // Convert back to array and sort by score
  return Array.from(deduplicatedMap.values()).sort(
    (a, b) => b.score - a.score,
  );
};

export const EMBED_CACHE_KEY = 'ts-docs-google';
