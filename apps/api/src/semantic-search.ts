const EMBEDDING_MODEL = "@cf/baai/bge-m3";
const CHUNK_SIZE = 1_000;
const CHUNK_OVERLAP = 160;
const MAX_CHUNKS_PER_MEMO = 100;

export type SemanticSearchBindings = {
  AI: Ai;
  MEMO_VECTORS: Vectorize;
};

type EmbeddingResponse = { data: number[][] };
type MemoRow = {
  id: string;
  notebook_id: string;
  title: string | null;
  content_text: string;
  revision: number;
};
type IndexRow = { memo_id: string; revision: number; chunk_count: number };
type StaleIndexRow = { memo_id: string; chunk_count: number };
type SearchMemoRow = {
  id: string;
  notebook_id: string;
  title: string | null;
  excerpt: string;
  tags_json: string;
  updated_at: string;
  revision: number;
};

export type SemanticSearchResult = {
  memoId: string;
  notebookId: string;
  title: string | null;
  excerpt: string;
  tags: string[];
  updatedAt: string;
  score: number;
};

const vectorId = (memoId: string, chunkIndex: number) => `memo:${memoId}:${chunkIndex}`;

const splitText = (value: string) => {
  const text = value.trim() || "(empty memo)";
  const chunks: string[] = [];

  for (let start = 0; start < text.length && chunks.length < MAX_CHUNKS_PER_MEMO; start += CHUNK_SIZE - CHUNK_OVERLAP) {
    chunks.push(text.slice(start, start + CHUNK_SIZE));
  }

  return chunks;
};

const parseTags = (value: string) => {
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((tag): tag is string => typeof tag === "string") : [];
  } catch {
    return [];
  }
};

const embed = async (ai: Ai, texts: string[]) => {
  const response = await ai.run(EMBEDDING_MODEL, { text: texts }) as EmbeddingResponse;

  if (!Array.isArray(response.data)) {
    throw new Error("Workers AI did not return embedding data.");
  }

  return response.data;
};

const deleteVectors = async (index: Vectorize, memoId: string, chunkCount: number) => {
  if (chunkCount > 0) {
    await index.deleteByIds(Array.from({ length: chunkCount }, (_, chunkIndex) => vectorId(memoId, chunkIndex)));
  }
};

const purgeStaleMemos = async (env: SemanticSearchBindings, db: D1Database, workspaceId: string, limit: number) => {
  const rows = await db
    .prepare(
      `SELECT i.memo_id, i.chunk_count
       FROM memo_semantic_index i
       LEFT JOIN memos m ON m.id = i.memo_id AND m.workspace_id = i.workspace_id
       WHERE i.workspace_id = ? AND (m.id IS NULL OR m.is_deleted = 1)
       ORDER BY i.memo_id ASC
       LIMIT ?`
    )
    .bind(workspaceId, limit)
    .all<StaleIndexRow>();

  for (const row of rows.results) {
    await deleteVectors(env.MEMO_VECTORS, row.memo_id, row.chunk_count);
    await db.prepare(`DELETE FROM memo_semantic_index WHERE memo_id = ?`).bind(row.memo_id).run();
  }

  return rows.results.length;
};

const indexMemo = async (env: SemanticSearchBindings, db: D1Database, workspaceId: string, memo: MemoRow) => {
  const previous = await db
    .prepare(`SELECT memo_id, revision, chunk_count FROM memo_semantic_index WHERE memo_id = ?`)
    .bind(memo.id)
    .first<IndexRow>();

  if (previous?.revision === memo.revision) {
    return 0;
  }

  await deleteVectors(env.MEMO_VECTORS, memo.id, previous?.chunk_count ?? 0);
  const chunks = splitText(`${memo.title ?? ""}\n${memo.content_text}`);
  const vectors = await embed(env.AI, chunks);

  if (vectors.length !== chunks.length) {
    throw new Error(`Workers AI returned ${vectors.length} embeddings for ${chunks.length} chunks.`);
  }

  await env.MEMO_VECTORS.upsert(
    vectors.map((values, chunkIndex) => ({
      id: vectorId(memo.id, chunkIndex),
      values,
      metadata: {
        memoId: memo.id,
        workspaceId,
        notebookId: memo.notebook_id,
        revision: memo.revision,
      },
    }))
  );
  await db
    .prepare(
      `INSERT INTO memo_semantic_index (memo_id, workspace_id, revision, chunk_count, indexed_at)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(memo_id) DO UPDATE SET
         workspace_id = excluded.workspace_id,
         revision = excluded.revision,
         chunk_count = excluded.chunk_count,
         indexed_at = excluded.indexed_at`
    )
    .bind(memo.id, workspaceId, memo.revision, chunks.length, new Date().toISOString())
    .run();

  return chunks.length;
};

export const reindexMemos = async (
  env: SemanticSearchBindings,
  db: D1Database,
  workspaceId: string,
  limit: number,
  cursor?: string
) => {
  const rows = await db
    .prepare(
      `SELECT m.id, m.notebook_id, m.title, c.content_text, c.revision
       FROM memos m
       INNER JOIN memo_contents c ON c.memo_id = m.id
       WHERE m.workspace_id = ? AND m.is_deleted = 0 AND m.id > ?
       ORDER BY m.id ASC
       LIMIT ?`
    )
    .bind(workspaceId, cursor ?? "", limit)
    .all<MemoRow>();
  let indexedMemos = 0;
  let indexedChunks = 0;

  for (const memo of rows.results) {
    const chunkCount = await indexMemo(env, db, workspaceId, memo);
    if (chunkCount > 0) {
      indexedMemos += 1;
      indexedChunks += chunkCount;
    }
  }

  const purgedMemos = await purgeStaleMemos(env, db, workspaceId, limit);

  return {
    indexedMemos,
    indexedChunks,
    purgedMemos,
    nextCursor: rows.results.length === limit ? rows.results.at(-1)?.id ?? null : null,
  };
};

export const syncSemanticMemo = async (
  env: SemanticSearchBindings,
  db: D1Database,
  workspaceId: string,
  memoId: string
) => {
  const memo = await db
    .prepare(
      `SELECT m.id, m.notebook_id, m.title, c.content_text, c.revision
       FROM memos m
       INNER JOIN memo_contents c ON c.memo_id = m.id
       WHERE m.workspace_id = ? AND m.id = ? AND m.is_deleted = 0`
    )
    .bind(workspaceId, memoId)
    .first<MemoRow>();

  if (memo) {
    const indexedChunks = await indexMemo(env, db, workspaceId, memo);
    return { indexed: indexedChunks > 0, indexedChunks, removed: false };
  }

  const previous = await db
    .prepare(`SELECT memo_id, chunk_count FROM memo_semantic_index WHERE memo_id = ? AND workspace_id = ?`)
    .bind(memoId, workspaceId)
    .first<StaleIndexRow>();

  if (!previous) {
    return { indexed: false, indexedChunks: 0, removed: false };
  }

  await deleteVectors(env.MEMO_VECTORS, memoId, previous.chunk_count);
  await db.prepare(`DELETE FROM memo_semantic_index WHERE memo_id = ?`).bind(memoId).run();
  return { indexed: false, indexedChunks: 0, removed: true };
};

export const syncChangedSemanticMemos = async (env: SemanticSearchBindings, db: D1Database, limit: number) => {
  const stale = await db
    .prepare(
      `SELECT m.id, m.workspace_id, m.notebook_id, m.title, c.content_text, c.revision
       FROM memos m
       LEFT JOIN memo_semantic_index i ON i.memo_id = m.id
       INNER JOIN memo_contents c ON c.memo_id = m.id
       WHERE m.is_deleted = 0 AND (i.memo_id IS NULL OR i.revision != c.revision)
       ORDER BY m.updated_at ASC, m.id ASC
       LIMIT ?`
    )
    .bind(limit)
    .all<MemoRow & { workspace_id: string }>();
  let indexedMemos = 0;
  let indexedChunks = 0;
  let purgedMemos = 0;

  for (const memo of stale.results) {
    const chunkCount = await indexMemo(env, db, memo.workspace_id, memo);
    if (chunkCount > 0) {
      indexedMemos += 1;
      indexedChunks += chunkCount;
    }
  }

  const workspaces = await db
    .prepare(`SELECT DISTINCT workspace_id FROM memo_semantic_index LIMIT ?`)
    .bind(limit)
    .all<{ workspace_id: string }>();

  for (const workspace of workspaces.results) {
    purgedMemos += await purgeStaleMemos(env, db, workspace.workspace_id, limit);
  }

  return { indexedMemos, indexedChunks, purgedMemos };
};

export const searchSemanticMemos = async (
  env: SemanticSearchBindings,
  db: D1Database,
  workspaceId: string,
  query: string,
  limit: number
): Promise<SemanticSearchResult[]> => {
  const [queryEmbedding] = await embed(env.AI, [query]);

  if (!queryEmbedding) {
    throw new Error("Workers AI did not return an embedding for the query.");
  }

  const matches = await env.MEMO_VECTORS.query(queryEmbedding, {
    topK: Math.min(50, Math.max(limit * 4, limit)),
    returnMetadata: "all",
    filter: { workspaceId },
  });
  const scores = new Map<string, number>();

  for (const match of matches.matches) {
    const memoId = match.metadata?.memoId;
    const revision = match.metadata?.revision;

    if (typeof memoId !== "string" || typeof revision !== "number") {
      continue;
    }

    const existing = scores.get(memoId);
    if (existing === undefined || match.score > existing) {
      scores.set(memoId, match.score);
    }
  }

  const memoIds = Array.from(scores.keys());

  if (memoIds.length === 0) {
    return [];
  }

  const placeholders = memoIds.map(() => "?").join(", ");
  const rows = await db
    .prepare(
      `SELECT m.id, m.notebook_id, m.title, m.excerpt, m.tags_json, m.updated_at, c.revision
       FROM memos m
       INNER JOIN memo_contents c ON c.memo_id = m.id
       INNER JOIN memo_semantic_index i ON i.memo_id = m.id AND i.revision = c.revision
       WHERE m.workspace_id = ? AND m.is_deleted = 0 AND m.id IN (${placeholders})`
    )
    .bind(workspaceId, ...memoIds)
    .all<SearchMemoRow>();
  const byId = new Map(rows.results.map((row) => [row.id, row]));

  return memoIds
    .map((memoId) => {
      const memo = byId.get(memoId);
      const score = scores.get(memoId);
      if (!memo || score === undefined) {
        return null;
      }

      return {
        memoId: memo.id,
        notebookId: memo.notebook_id,
        title: memo.title,
        excerpt: memo.excerpt,
        tags: parseTags(memo.tags_json),
        updatedAt: memo.updated_at,
        score,
      } satisfies SemanticSearchResult;
    })
    .filter((result): result is SemanticSearchResult => result !== null)
    .sort((left, right) => right.score - left.score)
    .slice(0, limit);
};
