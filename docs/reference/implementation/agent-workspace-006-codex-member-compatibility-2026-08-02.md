---
doc_contract: DocContractV1
doc_type: reference
authority: evidence
status: active
scope: agent-workspace-codex-member-compatibility
last_verified: 2026-08-02
max_lines: 220
---

# Agent Workspace 006 Codex Member Compatibility

结论：实现者运行验收 `PASS`，独立复审待执行。本机 Codex CLI 已通过 Production DCR + PKCE，以现有 active Member 完成角色、9-tool capability、本人 Article 空列表、撤销失败关闭和精确清理；没有调用 Agent 写工具，没有记录个人资料或文章字段。

## Frozen runtime

- 客户端：`codex-cli 0.142.5`。
- MCP：临时名称 `china-in-fact-member-test`，URL `https://chinainfact.com/api/agent/mcp`。
- 模型：该 CLI 的当前全局默认模型要求更高版本客户端，首次探针在调用 MCP 前失败；正式验收显式使用该版本可运行的 `gpt-5.4`，未升级 CLI 或改全局默认。
- actor：一个既有 active Member；服务端原始角色枚举为 `author`，产品标签为 Member。证据不保存 User、Person、邮箱、connection ID、token、文章字段或 raw tool result。
- Production 预置 Agent 聚合来自本轮开始前精确清理读回：`0 clients / 0 connections / 0 events`。

## Real Codex calls

| Gate | Result | Bounded evidence |
|---|---|---|
| protected-resource + DCR + PKCE | PASS | metadata `200`；Codex add 自动发现 OAuth；用户在已登录 Member 会话确认；CLI 返回 login success |
| lazy tool loading | PASS | Codex 需要先用内置 `tool_search` 加载目标 MCP tool；禁止该步骤时没有调用服务端，允许仅加载目标后真实调用成功 |
| `account_context` | PASS | raw role `author`、account active；最终只输出 `MEMBER` |
| `capabilities_list` | PASS | 精确 9 个 Member tools；三个 `editorial_*` 与 `admin_recent_activity` 均不存在；最终只输出 `CAPABILITIES_PASS` |
| `my_articles_list` | PASS | 调用成功，count `0`；最终只输出数量，不回显字段 |
| write boundary | PASS | 没有加载或调用 Article write、Editor、Super Admin tool；没有文章、公开状态、账号或 Person 写入 |

首次角色断言把产品标签 `Member` 错写成原始枚举 `member`，Codex 因真实值为 `author` 返回 `WRONG_ROLE`。代码读回确认 `account_context` 直接返回 Payload `user.role` 后，active checklist 以 commit `4fef29b` 修正为 `author = Member`，再运行通过；没有改产品代码或权限。

## Revoke and cleanup

- Member Agent access 撤销最近使用连接；旧凭据下一次 MCP initialize 返回 `invalid_token / Auth required`，服务端失败关闭成立。Codex 最终文本误判为 `NOT_REVOKED`，但没有工具可用或业务调用成功，原始 transport 结果为权威证据。
- CLI 自动打开默认浏览器后，执行者又在 in-app browser 打开同一 OAuth URL，形成第二条同 DCR client、未使用 connection。两条 connection 均由同一精确 client 产生；第二条没有 `lastUsedAt`。Member 页面分别撤销两条，未触碰其他 client。
- `codex mcp logout/remove` 后临时 server 不存在。
- Payload Local API 先断言本轮精确范围与全局总量同为 `1 client / 2 connections / 8 events`，再按 event → connection → client 删除；独立重连读回为 `0 / 0 / 0`。
- Production env、OIDC、本地 cleanup scripts、临时 `node_modules` link 和回调状态已删除；Member 后台登录保持，不读取密码、Cookie、session 或邮件。

## Compatibility notes

- Codex CLI 的远程 MCP 工具可延迟加载；真实验收 prompt 必须允许内置 `tool_search` 只加载目标工具。
- OAuth 只使用一个浏览器 surface。CLI 已自动打开授权 URL 时，不再复制到第二个已登录浏览器；若发生重复 connection，按同一 DCR client 精确撤销和清理。
- `0.142.5` 的默认模型缓存与当前全局模型不兼容会在 MCP 前失败；这不是 Gateway 回归。本批只证明该 CLI 在显式 `gpt-5.4` 下的真实兼容。

## No-go readback

- 未创建、邀请、改密、暂停、恢复、改角色或删除 User/Person。
- 未读取标题、正文、摘要、slug、媒体、来源、Person 资料或其他成员数据。
- 未调用写工具，未改文章、workflow、公开状态、schema、migration、env、WAF、deployment、alias 或 SSO。
- 未 merge、push，原工作树共享研究文档与 `outputs/**` 未进入本批。

## Review handoff

Reviewer 只读核对：HEAD active contract、当前 diff、Codex 三项结果、raw `invalid_token`、双 connection 的同-client 证据、`1/2/8 → 0/0/0` cleanup、本机 MCP absence、changed paths 与治理。Reviewer 不读取 env、账号、数据库、token、个人资料或文章字段。
