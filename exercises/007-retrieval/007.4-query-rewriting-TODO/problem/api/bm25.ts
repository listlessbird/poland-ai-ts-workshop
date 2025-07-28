import BM25 from 'okapibm25';
import { loadTsDocs } from './utils.ts';

export const searchTypeScriptDocsViaBM25 = async (
  keywords: string[],
) => {
  const docs = await loadTsDocs();

  const docsArray = Array.from(docs.values());

  const scores: number[] = (BM25 as any)(
    docsArray.map((doc) => doc.content),
    keywords,
  );

  return scores
    .map((score, index) => ({
      score,
      filename: docsArray[index]!.filename,
      content: docsArray[index]!.content,
    }))
    .sort((a, b) => b.score - a.score);
};
