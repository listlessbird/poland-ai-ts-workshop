import { Memory } from 'mem0ai/oss';

export const memory = new Memory({
  llm: {
    provider: 'google',
    config: {
      model: 'gemini-2.0-flash-001',
      apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
    },
  },
  embedder: {
    provider: 'google',
    config: {
      apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
      model: 'text-embedding-004',
    },
  },
  vectorStore: {
    provider: 'memory',
    config: {
      collectionName: 'memories',
      dimension: 768,
    },
  },
  historyDbPath: './memory.db',
});
