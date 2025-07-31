import { searchTypeScriptDocsViaBM25 } from './bm25.ts';
import { searchTypeScriptDocsViaEmbeddings } from './embeddings.ts';
import { reciprocalRankFusion } from './utils.ts';

export const searchTypeScriptDocs = async (opts: {
  keywordsForBM25: string[];
  embeddingsQuery: string;
}) => {
  const bm25SearchResults = await searchTypeScriptDocsViaBM25(
    opts.keywordsForBM25,
  );

  const embeddingsSearchResults =
    await searchTypeScriptDocsViaEmbeddings(
      opts.embeddingsQuery,
    );

  const rrfResults = reciprocalRankFusion([
    bm25SearchResults,
    embeddingsSearchResults,
  ]);

  return rrfResults;
};
