---
doc_contract: DocContractV1
doc_type: reference
authority: evidence
status: active
scope: agent-workspace-002-preview-runtime
last_verified: 2026-08-01
max_lines: 180
---

# Agent Workspace 002 — Preview runtime evidence

## Verdict

`PREVIEW CURSOR PUBLICATION PASS / FIXTURE REMOVED / GATE CLOSED`

Cursor 真实客户端已在受保护 Preview 完成 Member Article 的 `prepare → 人工确认 → commit → anonymous readback`、幂等重放、撤回和 confirmation 过期负例。验收只使用虚构 `.test` Member；结束后全部测试记录、连接和本轮 OAuth client 已删除，SSO 与默认关闭的 Gateway 状态已恢复。Production、真实成员、真实内容、merge 和 push均未触碰。

## Preview gate

- 验收部署为 `dpl_BJuV6rSTeMS3XHzEdCvFC3rCKiVM`，稳定临时别名为 `china-in-fact-agent002-1c1bcf1.vercel.app`；target 为 Preview。
- 用户批准后临时设置 `AGENT_GATEWAY_ENABLED=true` 与稳定 Preview server URL，并把项目 SSO 从 `all_except_custom_domains` 临时设为关闭。匿名 health、OAuth metadata 和 protected-resource metadata 均为 200，匿名 MCP 无 bearer token 返回 401。
- 验收前 Preview 数据为 13 条 migration、36 User、32 Person、32 Article、0 connection、0 Agent event、4 OAuth client；先保存可恢复 dump，SHA-256 为 `cbaf1d06477c3cef822226ff230dad03502181e726987584e4706ab6c2c7d381`。
- fixture 只创建 `agent002-91639006@example.test`、User 41、Person 36、Media 13 和后续 Article 47；未读取或复制 Production 数据。

## Cursor real-client lifecycle

Cursor 项目级 `.cursor/mcp.json` 只包含稳定 Streamable HTTP URL，没有凭据。启用后真实完成 DCR、浏览器 OAuth、9 项工具发现，并用 `account_context` 与 `capabilities_list` 读回虚构 Member、Person、`author`、`active` 和两项 publication 工具。

1. Cursor 创建英文 Article 47，读取工作副本后以 revision `rev1_X9Kv…` prepare publish，并按要求停止；匿名路径保持不可见。
2. 独立确认消息明确 Article、target、prepared revision 和新 idempotency key 后，Cursor 才调用 commit。Article 变为 published，revision 变为 `rev1_qXyb…`，audit ID 为 28；匿名稳定路径返回 200。
3. 使用完全相同的 confirmation、revision 和 key 重放，返回相同 request/result/revision/updatedAt，没有第二次状态变化或新 audit ID。
4. Cursor 读取最新 revision 后单独 prepare withdraw，再收到独立确认才 commit。Article 变为 withdrawn，revision 变为 `rev1__JEJ…`，audit ID 为 32；匿名稳定路径返回 404。
5. 对 withdrawn Article prepare republish 后不提交，等待到 `expiresAt` 之后再调用 commit。服务器返回不可重试 `CONFIRMATION_EXPIRED`；随后工作副本仍为 withdrawn，revision 与 updatedAt 均未改变。

验收没有把 confirmation reference、token、Cookie、密码、正文或数据库地址写入仓库证据。

## Client findings

- Cursor 首次从工作区读取 MCP 配置时显示 Disabled，需要在 Tools & MCP 中启用；配置必须显式声明 `type: http`。
- 一次授权回调因本机 `8787` 已被其他健康服务占用而超时；Cursor 随后的 deep-link 回退仍可完成。005 应把 callback 端口与回退路径纳入预检。
- 长于一轮 access-token 生命周期的验收在 withdraw prepare 前收到 `Unauthorized`。Cursor 重新认证后恢复 9 项工具；prepare 使用新 connection 完成，没有把旧 connection 的 confirmation 带入新会话。005 需覆盖 token renewal、长任务恢复和遗留 client 清理。

## Cleanup and closed gate

- 清理前 Article 47 为 withdrawn；本轮共有 2 条 connection、15 条 Agent event，并覆盖 account、capability、draft、working copy、prepare、commit 与 authorization audit。
- 清理事务删除 User 41、Person 36、Media 13、Article 47、相关 versions/workflow events、2 条 connection、15 条 Agent event 和本轮 6 个 OAuth client。读回为 User/Person/Media/Article/connection/event 全 0；全库回到 36 User、32 Person、32 Article、0 connection、0 Agent event、4 OAuth client 和 13 条 migration。
- 项目 SSO 已精确恢复为 `all_except_custom_domains`；两项临时 Preview 环境变量已移除。
- 最终关闭部署为 `dpl_E2yZbufUX2bwwpKk9Lv1dTuobfSp`，状态 READY、target Preview。稳定别名已指向该部署；匿名 health 和 MCP 都返回 Vercel SSO 302，授权 health 为 200，授权 MCP 为 404，证明 Gateway 回到默认关闭。
- fixture dump、临时 env、测试账号状态、Cursor workspace 与响应文件已移入 `/Users/gexu/.Trash/chinainfact-agent002-closure-20260801-0410/`，可恢复但不再位于运行路径。

## Remaining boundary

- Preview 保留 002 代码和受 SSO 保护的关闭态部署，不保留测试身份、内容、连接、公开 MCP 或临时环境变量。
- TRAE 与 WorkBuddy 仍为 `NOT RUN / NOT_VERIFIED`，因为当前没有客户端账号；转入 005。
- Production、真实成员、真实内容、merge 和 push未执行。
