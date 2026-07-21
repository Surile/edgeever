PRAGMA foreign_keys = ON;

CREATE TABLE memo_semantic_index (
  memo_id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  revision INTEGER NOT NULL,
  chunk_count INTEGER NOT NULL DEFAULT 0,
  indexed_at TEXT NOT NULL
);

CREATE INDEX idx_memo_semantic_index_workspace ON memo_semantic_index(workspace_id, memo_id);
