export const productTimeline = [
  {
    date: "2026-07-03",
    title: "可配置笔记快捷入口",
    summary: "新增可配置的 note shortcuts，让常用笔记和操作入口更容易被固定与复用。",
    commits: ["55d8e04"],
    highlights: ["配置化快捷入口", "继续打磨高频笔记工作流"],
  },
  {
    date: "2026-07-02",
    title: "README、演示环境与长期会话完善",
    summary:
      "集中更新产品使用指导、公开演示数据和登录体验；默认 Web session TTL 延长到 5 年，降低个人自托管场景的重复登录成本。",
    commits: ["7369d94", "2c82e82", "746f3d9", "f937376", "21c1639"],
    highlights: ["产品 README 更新", "Demo reset 与预填登录", "演示图片种子资源", "5 年会话 TTL"],
  },
  {
    date: "2026-07-01",
    title: "Agent 与编辑体验增强",
    summary:
      "MCP 能力继续扩展，新增 memo listing tool；设置页拆分组件，配置复制更清晰；编辑器工具栏、代码块和新建笔记响应也同步优化。",
    commits: ["dca1762", "8cd7ba2", "74b623c", "77122d6", "58f8453"],
    highlights: ["MCP memo listing tool", "AI Agent 部署流程优化", "设置页组件拆分", "编辑器 toolbar tooltip", "多行代码块选择修复"],
  },
  {
    date: "2026-06-30",
    title: "Evernote 迁移、MCP 配置与 PWA 稳定性",
    summary:
      "这一天是迁移与 Agent 接入的主线：Evernote ENEX 导入脚本加入 sharp 本地图片压缩与空文本预处理，MCP Token 配置复制流程完善，同时加入 PWA 更新提示和前后台恢复刷新。",
    commits: ["d11171c", "631a3df", "02906eb", "7dd12e9", "e9136b2"],
    highlights: ["Evernote 导入脚本本地图片压缩", "ENEX 空文本预处理", "MCP 配置复制", "资源面板网格 / 搜索 / 拖拽上传", "PWA resume 刷新"],
  },
  {
    date: "2026-06-29",
    title: "移动端笔记与 Evernote 迁移入口",
    summary:
      "移动端笔记阅读、附件上传、格式工具栏和新建笔记焦点细节持续打磨；同时引入 Evernote import flow 和迁移指南。",
    commits: ["69abf9b", "779784d", "64b254b", "16dce39", "a08f3d5"],
    highlights: ["移动端笔记视图模式", "移动端附件上传", "移动端格式工具栏", "Evernote import flow", "迁移指南入口"],
  },
  {
    date: "2026-06-28",
    title: "工作区重构与品牌视觉统一",
    summary:
      "Web 端从单体 App 结构重构为模块化组件，设置页和资源页变成工作区视图；同时引入 shadcn/ui、EdgeEver 品牌色变量、移动端交互与性能拆包。",
    commits: ["b201d7d", "c0868dc", "e7ab278", "fa139b9", "2a0978a"],
    highlights: ["App.tsx 模块化", "设置 / 资源全页工作区", "EdgeEver brand variables", "初始 bundle 拆分", "笔记本排序选项"],
  },
  {
    date: "2026-06-27",
    title: "离线同步、MCP/CLI 文档与三栏交互细化",
    summary:
      "新增离线同步和 Agent 文档，强化 MCP/CLI 工作流；围绕 Evernote 式笔记列表、选择、pinning、移动端笔记本导航做了一轮交互打磨。",
    commits: ["377b7b9", "8ab55b7", "a40d85b", "a9478ea", "202e795"],
    highlights: ["离线同步", "MCP 与 CLI 使用文档", "移动端笔记本导航", "笔记选择与 pinning", "绿色主题调色"],
  },
  {
    date: "2026-06-26",
    title: "Cloudflare 自托管基础成型",
    summary:
      "多实例部署、密码登录、Worker 兼容密码 hash、PWA、搜索、回收站、修订历史、Agent Token 和 MCP CLI 接入在这一阶段成型。",
    commits: ["da8ac14", "e2f9b66", "49646ca", "f7a144b", "fd2250b"],
    highlights: ["多实例 Cloudflare 部署", "密码登录", "PWA 支持", "自动保存 / 回收站 / 搜索", "Agent Tokens 与 MCP CLI"],
  },
];
