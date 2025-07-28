import { Memory } from 'mem0ai/oss';

const memory = new Memory({
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
});

const result = await memory.add(
  [
    {
      role: 'user',
      content: 'I went to get my son some shoes yesterday.',
    },
    {
      role: 'assistant',
      content: 'Where did you go?',
    },
    {
      role: 'user',
      content: 'I went to Clarks.',
    },
    {
      role: 'assistant',
      content: 'Is that your favourite shoe shop?',
    },
    {
      role: 'user',
      content: "Meh, it's okay.",
    },
  ],
  { userId: 'me' },
);

const memories = await memory.search(
  'When did I go to get my son some shoes?',
  {
    limit: 10,
    userId: 'me',
  },
);

console.log(memories);
