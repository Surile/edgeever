# 可选的语义搜索

EdgeEver 可以为 MCP 服务可选地添加笔记语义搜索。笔记正文仍以 D1 为唯一
数据源；Cloudflare Vectorize 只保存向量嵌入和少量标识信息。该功能默认关闭：
普通部署不需要 Workers AI、Vectorize 或额外配置。

## 提供的能力

启用后，MCP 端点会额外提供两个工具：

- `semantic_search_memos`：按语义查找未删除的笔记。精确文本、标签和日期
  筛选仍应使用 `search_memos`。
- `reindex_memos`：为当前工作区索引一页笔记。首次部署、导入数据或变更
  元数据索引后应运行它。

新建或保存笔记后，会在写入响应返回后立即排入该笔记的索引任务，因此不会让
保存操作等待 Workers AI。Worker 还会每五分钟执行一次轻量的增量索引，作为
失败重试和导入数据的兜底。返回结果前会再次使用 D1 校验，因此放入回收站、
已删除或已过期的笔记不会被返回。

## 启用方式

1. 使用 EdgeEver 相同的模型配置创建一个 Vectorize **V2** 索引。
   `@cf/baai/bge-m3` 会生成 1024 维向量，EdgeEver 使用余弦相似度：

   ```sh
   yarn wrangler vectorize create edgeever-memo-vectors --dimensions=1024 --metric=cosine
   ```

2. 在首次索引前创建元数据索引。这是将每次查询限制在对应 EdgeEver 工作区
   所必需的：

   ```sh
   yarn wrangler vectorize create-metadata-index edgeever-memo-vectors --property-name=workspaceId --type=string
   ```

3. 在部署使用的 `wrangler.toml` 中添加以下可选绑定。请把示例索引名替换为
   你自己的；不要将个人索引名提交到共享 Fork。

   ```toml
   [[vectorize]]
   binding = "MEMO_VECTORS"
   index_name = "edgeever-memo-vectors"

   [ai]
   binding = "AI"

   [vars]
   EDGE_EVER_SEMANTIC_SEARCH_ENABLED = "true"

   [triggers]
   crons = ["*/5 * * * *"]
   ```

   cron 触发器是可选但建议保留：它会重试失败的后台索引并处理导入的数据。
   它被有意排除在 EdgeEver 的默认配置之外。

4. 按正常方式部署。随后通过 MCP 调用 `reindex_memos`，传入 `limit: 25`；
   持续将返回的 `nextCursor` 传入下一次调用，直到它为 `null`。

`workspaceId` 元数据索引必须在第一次运行 `reindex_memos` 前创建。若稍后才
创建，请再次运行索引并传入 `force: true`，以便 Vectorize 重写已有向量并填充
新的元数据索引。`force` 只应用于这类修复；常规增量索引不需要传入。

## 关闭方式

移除 `EDGE_EVER_SEMANTIC_SEARCH_ENABLED`（或设为任何非 `"true"` 的值）后
重新部署即可。语义 MCP 工具会消失，且不再执行索引任务。已有向量会保留在
Vectorize 中，直到你删除索引；这是有意为之，以便重新启用时不必完整重建索引。
