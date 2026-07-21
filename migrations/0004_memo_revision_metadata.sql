PRAGMA foreign_keys = ON;

ALTER TABLE memo_revisions
  ADD COLUMN tags_json TEXT NOT NULL DEFAULT '[]';

ALTER TABLE memo_revisions
  ADD COLUMN content_text TEXT NOT NULL DEFAULT '';
