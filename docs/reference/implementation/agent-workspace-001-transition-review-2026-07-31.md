---
doc_contract: DocContractV1
doc_type: reference
authority: evidence
status: active
scope: agent-workspace-001-transition-review
last_verified: 2026-07-31
max_lines: 180
---

# Agent Workspace 001 — Transition review

## Decision

001 已证明远程 OAuth/MCP、服务器权限、revision、幂等、审计、跨对象拒绝和撤权可以在 Cursor + Preview 形成真实闭环。下一候选保持 002，但必须收窄；推荐顺序为 `002 → 003 → 004 → 005`。这只是父级阶段决定，不创建 active checklist，也不授权实现。

| 阶段 | 决定 | 001 后的范围调整 | 理由 |
|---|---|---|---|
| 002 | `keep + narrow` | 只验证 Member Article publication 的 `prepare → confirm → commit → readback`，覆盖公开、更新、撤回与恢复的最小状态集合 | 001 已稳定身份、对象所有权、revision 和幂等；下一项未知是有公共副作用的确认合同 |
| 003 | `keep + reorder` | 保持 Editor curation 独立切片，排在 002 后；复用确认、revision 与审计，不复制 Member 工具 | Editor 是跨作者与站方分发权限，风险高于本人公开；先由 002 证明确认合同更稳妥 |
| 004 | `split` | 定义时拆成低风险站务与高风险账户/身份两类；删除、提权、migration、密钥、批量公开和 Production 动作不进入通用 MCP | “Super Admin 全能力”不是安全工具边界；每类动作需要不同 step-up、恢复和审计 |
| 005 | `keep + expand` | 收口 TRAE/WorkBuddy、Cursor callback/启用预检、分发包、监控、限流、支持、撤权、恢复和 release runbook | 001 暴露了真实客户端启用、callback、部署 scope 和 provider protection 差异；这些属于可运营发布，不应散落到 capability 切片 |

## Contract readback

- Cursor 的 Streamable HTTP + DCR + PKCE 合同可复用；workspace MCP 默认 Disabled 和固定 callback 行为必须由 005 真实预检，不靠文档假设。
- OAuth、connection、capability、revision、idempotency 和最小 audit 已足以承载下一切片；任何公共状态工具仍须逐次做 role、owner、state 和 revision 校验。
- 001 的结构化工作副本和受限 Markdown 已满足草稿写作。没有证据支持把本地文件同步作为 002 前置，更不需要新增 file watcher 或专用 schema。
- Cursor Preview 的创建、保存和读回延迟足以继续；旧 toast 的 30 秒连接超时与短暂 alias TLS/tunnel 波动应进入 005 的重试、状态和支持验收，不改变同域 Gateway 决定。
- `prepare → confirm → commit` 应先用于 Member publication。它提供本人对象、单一公共副作用和清晰回读，是验证确认合同的最小风险场景。
- Editor 应复用 Article domain service、revision、审计和确认 primitive，但获得独立工具与更严格 capability；不能仅靠模型根据同一宽工具自行判断。
- 适合 Agent 的 Admin 候选仅限可逆、低影响、有明确对象和读回的动作。提权、删除、migration、密钥、Production 发布和批量公开继续留在网页或专门发布流程。
- 没有非 MCP Agent 的真实需求证据，因此不开发 CLI fallback；若 005 收集到真实客户端缺口，再单独比较 MCP adapter 与 CLI 的维护成本。
- Preview 运行证明同一 Next.js/Payload 部署可承载 Gateway；没有理由拆第二个服务。

## 002 entry contract

可以开始准备 002，但在用户明确批准前不建立 active checklist。002 的初始边界应是：

- 只处理当前用户拥有的 Article，不碰 Person、媒体、翻译创建或 Editor 策展。
- `prepare` 返回将发生的状态变化、公共 URL、revision 和一次性 confirmation reference，不写入公共状态。
- `commit` 必须携带 confirmation reference、当前 revision 和 idempotency key；过期、对象变化、重复或跨用户确认安全失败。
- 覆盖首次公开、已公开内容更新后的状态、撤回和重新公开；每个动作都读回数据库状态与匿名公共页面。
- Preview 继续使用虚构 `.test` fixture；Production、真实成员和真实内容仍分别批准。

## Program implication

001 的成果不要求推翻 002–005，但要求调整执行方式：002 收窄为确认 primitive 的首个真实证明；003 明确在其后复用；004 不再以角色名一次打包；005 增加真实客户端启用、callback、provider protection、部署 project scope 和运营恢复门禁。父级清单已同步这些决定。
