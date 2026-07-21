# Optional semantic search

EdgeEver can optionally add semantic memo search to its MCP server. It keeps the
source-of-truth memo data in D1 and stores only embeddings plus small identifiers
in Cloudflare Vectorize. The feature is disabled by default: a normal deployment
does not require Workers AI, Vectorize, or any extra configuration.

## What it provides

When enabled, the MCP endpoint exposes two additional tools:

- `semantic_search_memos` finds active memos by meaning. Use `search_memos` for
  exact text, tag, and date filtering.
- `reindex_memos` indexes a page of the current workspace. Run it after the
  first deployment, an import, or a metadata-index change.

The Worker also runs a small incremental indexing job every five minutes. Search
results are checked against D1 again before they are returned, so trashed,
deleted, or out-of-date memos are never returned.

## Enable it

1. Create a Vectorize **V2** index using the same model configuration used by
   EdgeEver. `@cf/baai/bge-m3` produces 1024-dimensional embeddings and EdgeEver
   uses cosine similarity:

   ```sh
   yarn wrangler vectorize create edgeever-memo-vectors --dimensions=1024 --metric=cosine
   ```

2. Create a metadata index before the initial indexing pass. This is required to
   filter every query to its EdgeEver workspace:

   ```sh
   yarn wrangler vectorize create-metadata-index edgeever-memo-vectors --property-name=workspaceId --type=string
   ```

3. Add these optional bindings to the deployment's `wrangler.toml`. Replace the
   example index name with your own. Do not commit a personal index name to a
   shared fork.

   ```toml
   [[vectorize]]
   binding = "MEMO_VECTORS"
   index_name = "edgeever-memo-vectors"

   [ai]
   binding = "AI"

   [vars]
   EDGE_EVER_SEMANTIC_SEARCH_ENABLED = "true"
   ```

4. Deploy normally. Then call `reindex_memos` through MCP with `limit: 25`, and
   keep passing its `nextCursor` until the returned value is `null`.

The `workspaceId` metadata index must exist before the initial `reindex_memos`
run. If it is added later, run indexing again so Vectorize can populate the new
metadata index.

## Disable it

Remove `EDGE_EVER_SEMANTIC_SEARCH_ENABLED` (or set it to any value except
`"true"`) and deploy. The semantic MCP tools disappear and no indexing work is
performed. Existing vectors remain in Vectorize until you delete the index; this
is intentional so re-enabling does not require another full index.
