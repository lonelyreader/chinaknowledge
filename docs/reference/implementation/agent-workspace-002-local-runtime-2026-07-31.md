---
doc_contract: DocContractV1
doc_type: reference
authority: evidence
status: active
scope: agent-workspace-002-local-runtime
last_verified: 2026-07-31
max_lines: 180
---

# Agent Workspace 002 — Local runtime evidence

## Verdict

`LOCAL IMPLEMENTATION + INDEPENDENT REVIEW PASS / PREVIEW NOT AUTHORIZED`

Member Article publication 已在独立 Local `.test` 数据库完成 `prepare → confirm → commit → readback`。本轮没有新增 collection、字段、migration、依赖或 Production 能力；受保护 Preview、公开 MCP 临时启用与 Cursor 真实人工确认仍是独立门禁。

## Delivered contract

- `article_prepare_publication` 只接受本人 Article、`published | withdrawn` 和当前 revision。服务端推导 `publish | update_public | withdraw | republish`，返回公共路径、curation 影响、5 分钟一次性 confirmation 和 audit ID。
- Prepare 复用 Article、Person、语言和媒体公开规则，只写 pending Agent event；测试读回 Article `updatedAt`、publication status 和 version 总数均未改变。
- `article_commit_publication` 绑定 user、Person、connection、Article、action、target 与 revision。commit 在同一事务锁定 confirmation event 和 Article，重新检查连接、账户、Person、owner、公开完整性与最新 draft version。
- confirmation 明文只返回调用方；Agent event 只保存 HMAC-signed reference 的 SHA-256 digest、input fingerprint、前后 revision 和结果。后台活动只显示 `Publication checked / Publication changed`。
- 相同 idempotency key 与相同输入读回同一结果；reservation 只按 connection + tool + key，target 仅进入可读 request ID。同 key 跨 `published → withdrawn` 或换 confirmation 均返回 `IDEMPOTENCY_CONFLICT`。
- 首次 commit 把 action、Article 最小摘要、公共路径和 after revision 作为非敏感结果快照写入隐藏 Agent event 字段；重放不依赖 Article 的 50 个 version 保留窗口。测试在 Article 已撤回后重放旧 publish key，仍返回首次 `published` 快照。
- 网页 `POST /api/articles/:id/transition` 与 Agent 共用 publication helper；publication hooks、media owner/approval 判断、version promotion 和 curation 副作用保持同一来源。

## Permission and failure matrix

| Case | Local result |
|---|---|
| Member owner | publish、update public、withdraw、republish 均成功 |
| Other Member | Article 不可操作；他人 confirmation 为 `CONFIRMATION_INVALID` |
| Same Member, other connection | confirmation 为 `CONFIRMATION_INVALID` |
| Editor / Super Admin, non-owner | 不能借更高站方角色处理该 Article |
| Editor / Super Admin, own Article | 各自完成 publish、update public、withdraw、republish |
| Paused / missing Person | `ACCOUNT_PAUSED` / `NO_PERSON` |
| Person 在 prepare 后转为不公开 | commit 重新检查公开完整性并失败，Article 不变 |
| Connection revoked after prepare | `CONNECTION_REVOKED`，Article 不变 |
| OAuth client disabled after prepare | 事务内重检后 `CONNECTION_REVOKED` |
| Editor prepare 后降为 Member | hooks 使用锁定后的新 role，不能沿用 Editor 媒体权限 |
| Tampered / expired / used confirmation | `CONFIRMATION_INVALID` / `CONFIRMATION_EXPIRED` / `CONFIRMATION_USED` |
| Two concurrent commit keys | 一个成功，一个 `CONFIRMATION_USED` |
| Article saved after prepare | `REVISION_CONFLICT`；旧 confirmation 被关闭，不覆盖新稿 |
| Same key, different input | `IDEMPOTENCY_CONFLICT` |

## State and readback

- 首次公开后匿名 Article read 成功，latest version 为 `published`，workflow event 为 `draft → published`，prepare/commit Agent event 均能按 Article、connection 和前后 revision 串起。
- 对已 `curated` Article 更新公开版本后进入 `needs_recheck`；撤回后进入 `withdrawn + removed` 且匿名读取失败；重新公开后匿名读取恢复，canonical 路径不变。
- 成功响应丢失后的同 key replay 没有新增 workflow event；prepare 后改稿会由 latest draft version revision 检出。
- Local 测试还覆盖真实 OAuth Gateway 的 9 项工具发现、匿名保护、跨 Member MCP 拒绝、refresh rotation、revoke 和既有草稿幂等/并发合同。
- 网页 transition endpoint 由测试直接调用完成 withdraw → republish；真实 `next start` Local 路由读回为 published `200`、withdrawn `404`，不只依赖 collection access。
- Agent event 全量序列化断言不包含 confirmation 明文或正文；有效签名但 action/target 不一致的负例写入 Article、target 和清洗后的 `CONFIRMATION_INVALID`，不保存 token。

## Verification

- `npm --prefix apps/web run test:agent` — PASS。
- `npm --prefix apps/web run test:agent:live` — PASS；`APP_ENV=local`，独立数据库 `chinaknowledge_agent002_20260731`。
- `npm --prefix apps/web run test:editorial` — PASS；网页 publication、Editor curation、版本和权限回归通过。
- `npm --prefix apps/web run typecheck` — PASS。
- `npm --prefix apps/web run lint` — 0 errors；40 条既有 migration unused-parameter warnings。
- `npm --prefix apps/web run build` — PASS；75 个静态页面生成完成，Agent MCP/OAuth 路由保留。

## Independent review

- 第一轮独立复审为 `BLOCK`：发现事务外 actor/expiry 竞态、幂等重放读取当前状态，以及审计和验证空缺。第二轮确认这些主要问题已关闭，又发现 target 被错误并入 reservation、事务未重检 role/client/scope/resource/expiry，以及历史 replay 依赖 50 个 versions。
- 当前实现已把稳定 reservation 与可读 target 分开；事务锁定并重检 connection、scope、OAuth client、User role/account、Person、Article 和媒体，hooks 使用锁定后的新 User；结果快照不再依赖 version 留存。
- 第三轮独立复审结论为 `PASS`，`P0/P1/P2 = 0/0/0`。Reviewer 独立复跑 `test:agent`、typecheck、lint、feature registry、文档治理和 diff check；未编辑、暂存、提交或触碰 `outputs/**`。

## Remaining gates

- `preview-deploy`、`public-mcp`、Cursor Preview 人工确认、虚构数据清理与 SSO 恢复尚未批准或执行。
- Production、真实成员、真实内容、merge 和 push 未执行。003 仍为 provisional，须在 002 完整关闭后依据本切片证据重新定义。
- Local 验证完成后已删除专用数据库 `chinaknowledge_agent002_20260731` 并停止本轮启动的 Local PostgreSQL；默认 Local、Preview 和 Production 数据未读取或修改。
