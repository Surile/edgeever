PRAGMA foreign_keys = ON;

ALTER TABLE api_tokens
  ADD COLUMN token_value TEXT;
