import BM25 from "okapibm25";
import path from "path";
import { readdir, readFile } from "fs/promises";

export const loadTsDocs = async () => {
  const TS_DOCS_LOCATION = path.resolve(
    import.meta.dirname,
    "../../../../../datasets/ts-docs"
  );

  const files = await readdir(TS_DOCS_LOCATION);

  const docs = await Promise.all(
    files.map(async (file) => {
      const filePath = path.join(TS_DOCS_LOCATION, file);
      const content = await readFile(filePath, "utf8");
      return {
        filename: file,
        content,
      };
    })
  );

  return docs;
};

export const searchTypeScriptDocs = async (keywords: string[]) => {
  const docs = await loadTsDocs();

  const scores: number[] = (BM25 as any)(
    docs.map((doc) => doc.content),
    keywords
  );

  return scores
    .map((score, index) => ({
      score,
      doc: docs[index],
    }))
    .sort((a, b) => b.score - a.score);
};
