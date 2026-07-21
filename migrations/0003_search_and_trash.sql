PRAGMA foreign_keys = ON;

CREATE INDEX IF NOT EXISTS idx_memos_trash_feed
  ON memos(is_deleted, deleted_at DESC, updated_at DESC);

DELETE FROM memos_fts;

INSERT INTO memos_fts (memo_id, title, content_text, tags)
SELECT
  m.id,
  COALESCE(m.title, ''),
  COALESCE(c.content_text, ''),
  REPLACE(REPLACE(REPLACE(m.tags_json, '[', ' '), ']', ' '), '"', ' ')
FROM memos m
INNER JOIN memo_contents c ON c.memo_id = m.id
WHERE m.is_deleted = 0;
