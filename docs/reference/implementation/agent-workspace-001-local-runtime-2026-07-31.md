---
doc_contract: DocContractV1
doc_type: reference
authority: evidence
status: active
scope: agent-workspace-001-local-runtime
last_verified: 2026-07-31
max_lines: 160
---

# Agent Workspace 001 — Local runtime evidence

## Verdict

`LOCAL CURSOR CLIENT PASS`

AGENT-WORKSPACE-001 的 Local migration、live schema、真实 OAuth allow flow、真实 MCP Gateway 调用、Member 权限、后台最小界面与 Cursor 3.13.10 真实客户端已通过。这个结论不等于 001 closure，也不授权 Preview、公开 MCP、真实账户、Production、commit、merge 或 push。

本轮提交前独立 reviewer 首审为 `BLOCK`，并在窄复验继续发现范围、callback、`offline_access` 和 body 上限问题；全部修复后，同一 reviewer 对最终快照给出 `FINAL PASS`，P0/P1/P2 为 `0/0/0`。完整 finding 与关闭证据见 [`final review`](agent-workspace-001-final-review-2026-07-31.md)。

## Isolated migration

- 专用数据库：`chinaknowledge_agent001_20260731_0300`；没有对默认 Local、Preview 或 Production 数据库运行本切片 migration。
- 从空库依序执行 13 个 migration，`20260730_181300` 成功建立 `agent_oauth_clients`、`agent_connections` 与 `agent_events`。
- live readback 确认 `request_id` 非空且普通索引，`idempotency_digest` 可空且唯一，`input_fingerprint` 可空，事件结果为 `pending / success / denied / conflict / failed`。
- `test:migration-recovery` 通过 clean apply → down → rebuild/reapply；有业务数据时 rollback fail-closed，不执行危险回滚。
- migration、live schema、generated types 与 collection/runtime config 四向一致。
- 验证结束后已删除专用数据库并停止 Local Postgres，恢复执行前的停止状态。

## OAuth and MCP entry path

- 测试通过真实 Payload login JWT 进入 authorize GET，读取 consent，再经 authorize POST `allow` 得到带原 state 的 redirect code；没有绕过到 model 内部保存。
- Authorization code + S256 PKCE 成功换取 token；code 重放、错误 PKCE、错误 audience 安全失败。
- Refresh 成功 rotation；旧 refresh 重放把连接标为 compromised，已签发 access 随即失效。
- Refresh token 携带由服务端 HMAC 验证的 family 标识；三次连续轮换后重放第一代仍能定位并撤销当前 family，伪造 family 不能触发他人连接撤销。
- 只请求 `agent:member` 的真实 authorization-code 流程不返回 refresh token，数据库的 refresh digest 与 expiry 均为空；只有 `offline_access` 才建立七天 rotation。
- token、revoke 与 consent form 使用 8 KiB 流式读取上限；超限在进入 OAuth/数据库逻辑前返回 `413`。
- 显式 revoke 和过期 access token 均被 verifier 拒绝；access/refresh/code 只以不可逆 digest 保存。
- 真实 Gateway + verifier + 默认 server 完成 `tools/list`、`account_context`、`article_create_draft` 和跨 Member `article_get_working_copy` 拒绝。
- `AGENT_GATEWAY_ENABLED` 只有精确为 `true` 才发布两个 metadata、MCP 和 OAuth 外部入口；默认与 `false` 均在任何数据库/OAuth 调用前返回 `404 no-store`。后台仍可查看历史并撤销连接，但不提供新配置下载。
- `test:agent:live` 会在非 `APP_ENV=local` 或非 `chinaknowledge_agent*` 数据库直接失败。

## Cursor 3.13.10 real-client run

- 使用独立 Docker PostgreSQL `chinaknowledge_agentcursor_20260731`、虚构 `.test` Member A/B 和临时项目 `/tmp/china-in-fact-cursor-e2e`；未读取默认 Local、Preview、Production 或真实业务数据。
- Cursor 实际完成 DCR、浏览器同意、authorization code + PKCE、token、refresh rotation、MCP initialize 和 7 个工具发现。
- Member A 在 Cursor IDE Agent 中完成 8 步：7 个成功调用；创建 Article 2，保存后的 latest version 标题为 `Cursor local acceptance saved`；Article 1 跨 Member 读取返回 `NOT_FOUND`。
- 浏览器同意页原有两个运行态缺陷已修复：`Response.redirect()` immutable headers 无法追加 continuation Cookie；CSP `form-action 'self'` 阻止跨端口 callback。测试覆盖登录 redirect Cookie 和已注册 callback source。
- Cursor DCR 的 exact custom callback 已加入 allowlist，其他 `cursor://` 地址继续拒绝。
- 本机固定 callback 端口 `8787` 已由不相关的 `agent-memory` dashboard 占用且未被改动；批准后的 code/state 通过 Cursor 已注册 deep link 交回。Cursor 随后自行完成 token exchange 和 MCP 调用，因此协议与工具闭环通过，但一键 callback 仍有宿主环境约束。
- `Agent access` 读回显示 `Cursor`、完整活动和越权 `Denied`；撤销实际使用连接后，下一次 MCP 为 401、refresh 为 400，Cursor 报 `Unauthorized` 并要求重新连接。全部临时连接最终撤销。

## Member and concurrency matrix

| Case | Result |
|---|---|
| Anonymous gateway | `401` + protected-resource challenge |
| Paused / missing Person | denied |
| Member A / Member B | 本人列表、工作副本和 Preview 隔离；跨 Member ID 拒绝 |
| Editor / Super Admin with Person | 只得到与 Member 相同的 7 个工具，不增加策展或账户动作 |
| Concurrent create | 同 idempotency key 只产生一篇 Article |
| Timeout recovery | 假定首个成功响应丢失后以同 key 重试；返回同一 Article、同一 revision，读回成功且总数仍为一篇 |
| Same key, different input | `IDEMPOTENCY_CONFLICT`，失败事件沿用响应 request ID |
| Concurrent save | 一个成功，一个 `REVISION_CONFLICT`，不静默覆盖 |
| Article content | prompt-injection 样本文本只作为正文往返 |

## Admin browser check

- 使用 `.test` fixture 在 Local 桌面与 390px 检查 `Agent access`；结构无横向溢出。
- 自定义 list view 完整替换 Payload 默认表格，页面不再暴露搜索、排序、内部时间列或 `Untitled - ID`。
- Connected、empty 与 revoked 状态读回通过；Revoke 由页面发起，状态变为 `Ended`，最近活动增加 `Connection revoked`。
- OAuth 客户端发起 revoke 也写入同一最小审计；未知 token 仍统一成功且不产生 token oracle。
- 真实 Cursor 连接名称不再因 Member 无权展开内部 OAuth client 而退化为 `Agent`；服务端只返回安全的 `clientName`。连接按实际 `lastUsedAt` 排序，避免空时间排在正在使用的连接之前。
- 可见文案人工 copy gate 通过：只有对象名、短标签、动作、状态和必要错误；未加入安装说明或内部协议术语。
- 通过浏览器网络故障注入阻断 `/api/agent/access`，页面保留后台结构并显示必要错误 `Agent access unavailable.`；恢复网络后正常读回。

## Regression evidence

- `test:agent`（含全部外部路由默认关闭、Consent 能力、8 KiB token/revoke 负例、五个 JSON fixture 与 Codex CLI 隔离加载）、`test:agent:live`（含仅 access-token 授权、四代 refresh、第一代 replay 与成功响应丢失后的幂等读回）、`test:editorial`、`test:environment`、`test:newsletter`、`test:preview-config`：PASS。
- `typecheck`、`build`：PASS；构建识别全部 Agent metadata、OAuth、access 与 MCP routes。
- `lint`：0 errors；40 条既有 migration unused-parameter warnings。
- Production dependency audit：0 high、0 critical；5 条 moderate 来自既有 Payload/Drizzle/esbuild 链。

## Still open

- TRAE、WorkBuddy 为 `NOT RUN / NOT_VERIFIED`：当前没有客户端账号，真实 OAuth、DCR、callback 和 Member workflow 转入 005。
- Codex、Claude、Gemini 的下载 fixture 已自动解析；001 不要求第二个真实客户端，完整多客户端目标仍由长期合同与 005 持有。
- Preview migration/deploy、公开 MCP、真实账户、真实数据和 Production 均未执行。
- 001 保持 active；父级 transition review 与 002–005 重新分析不能提前开始。
