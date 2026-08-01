---
doc_contract: DocContractV1
doc_type: reference
authority: evidence
status: active
scope: agent-workspace-004-local-runtime
last_verified: 2026-08-01
max_lines: 160
---

# Agent Workspace 004 — Local runtime evidence

## Verdict

`PASS — P0/P1/P2 = 0/0/0`

004 首批已在独立 Local 数据库证明：只有当前 Super Admin 能通过 Agent 读取最近 20 条 Article workflow activity；结果按时间倒序，只包含冻结合同允许的 Article、actor、状态、通知类型/状态和时间字段。调用不改变 workflow 或领域对象，只新增一条最小 Agent read audit。

本轮没有新增 schema、migration、依赖、OAuth scope、账户写动作、Preview 或 Production 能力。未主持实现者的独立复审已 `PASS`，`P0/P1/P2 = 0/0/0`。

## Delivered contract

- `admin_recent_activity` 输入为空，固定 `limit=20`、`sort=-occurredAt`，并以服务端 `asOf` 排除查询开始后的新事件。
- MCP 只在 token verifier 返回当前 `super_admin` 时注册工具；service 调用再次读取当前 User、Person、connection、resource、scope、过期时间、OAuth client 和 role。
- Activity 从现有只读 `workflow-events` 读取；Article 与 User 关系均为 depth 0、正常 collection access 和批量最小 lookup，没有通用 filter、CRUD、SQL 或第二套审计真相。
- 输出逐字段构造：event ID；Article ID/title/locale/public path；actor ID/display name；axis；from/to status；notification kind/status；occurredAt。缺失 actor 保持 `null`。
- 输出不包含 email、账户状态/角色、notification recipient/key/error、正文、source、owner、Person、token、connection 或 Payload 内部字段。
- 成功与失败读取只向现有 `agent-events` 写 actor、connection、client family、tool、object type、request ID、result 和时间，不保存查询结果或个人资料。

## Permission and failure matrix

| Case | Local result |
|---|---|
| Current Super Admin | MCP discovery 与 direct call 成功；返回最近 20 条 |
| Editor / Member | 无 capability；direct call 为 `FORBIDDEN` |
| 已降权的 Super Admin | direct call 重新读当前 role，返回 `FORBIDDEN` |
| Paused Super Admin | `ACCOUNT_PAUSED` |
| Missing Person | `NO_PERSON` |
| Revoked connection | `CONNECTION_REVOKED` |
| Disabled OAuth client | `CONNECTION_REVOKED` |
| Missing actor relation | item actor 为 `null`，没有扩大查询或关系展开 |

## Privacy and state readback

- 21 条带唯一时间的虚构 workflow events 中只返回最新 20 条，ID 顺序与 `occurredAt` 倒序完全一致，最旧一条不返回。
- 序列化结果不包含虚构 email、notification recipient/key/error、正文、source、owner、account、role 或 connection 字段；Article 和 actor 子对象的 key 集合逐项断言。
- 调用前后 workflow event 总数、Article 全文档、Super Admin User 全文档和 Person 全文档完全相同。
- 成功调用仅使 `agent-events` 增加 1；读回审计为 `admin_recent_activity / account / success`，没有 object ID、input fingerprint 或测试敏感值。
- 现有网页 Activity collection、Users access、Article workflow、Member publication 和 Editor site selection 未修改。

## Verification

- 专用数据库：`chinaknowledge_agent004_20260801`；`APP_ENV=local`，Payload local push 只用于建立与当前 schema 相同的空测试库，没有生成 migration。
- `npm --prefix apps/web run test:agent:live` — PASS；覆盖最新 20 条、MCP discovery/call、权限/账户/Person/connection/client 负例、关系缺失、字段隔离、领域不变与 Agent audit。
- `npm --prefix apps/web run test:editorial` — PASS；现有网页 Member publication 与 Editor workflow 回归通过。
- `npm --prefix apps/web run test:agent` — PASS。
- `npm --prefix apps/web run typecheck` — PASS。
- `npm --prefix apps/web run lint` — 0 errors；40 条既有 migration unused-parameter warnings。
- `npm --prefix apps/web run build` — PASS；75 个静态页面完成，MCP/OAuth 路由保留。
- `git diff --check` — PASS。

## Isolation and closeout

所有 User、Person、Article、Workflow Event、connection、OAuth client 和 Agent event 都在专用 Local 数据库中生成；测试邮件仅写入本地 console，收件地址为 `test.invalid`。Preview、public MCP、真实账户、真实数据、真实邮件、Production、schema、migration、merge、push 和 `outputs/**` 均未进入本轮。

独立 reviewer 只读核对实现、测试语义、隔离门禁和数据库 fixture 后给出 `PASS`。专用数据库 `chinaknowledge_agent004_20260801` 已按完整名称精确删除并读回不存在；本轮启动的 Local PostgreSQL 已停止。
