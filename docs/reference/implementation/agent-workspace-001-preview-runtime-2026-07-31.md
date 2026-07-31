---
doc_contract: DocContractV1
doc_type: reference
authority: evidence
status: active
scope: agent-workspace-001-preview-runtime
last_verified: 2026-07-31
max_lines: 180
---

# Agent Workspace 001 — Preview runtime evidence

## Verdict

`PREVIEW CURSOR CLIENT PASS`

受保护 Preview 已完成 migration、公开 MCP 临时验收、Cursor 3.13.10 真实 OAuth、7 个 Member 工具、跨成员拒绝、后台撤权与撤权后失败读回。验收只使用虚构 `.test` Member；结束后相关 User、Person、Article、connection、event、OAuth client 和 workflow event 均已删除，Vercel SSO 已恢复。Production 未部署、未迁移、未读写。

## Migration and deployment

- 变更前完成 Preview Neon dump，SHA-256 为 `69028cb84bf3da6093ed791f883e9ef018e3c201c2b535b82c7a5354e45e081a`；恢复路径在执行窗口内保留，结束后随临时目录移入废纸篓。
- Preview 批次 7 应用 `20260730_181300` 后，live readback 为 39 张 `public` 表、13 条 migration ledger 和 3 张 Agent 主表；初始 connection/event 均为 0。
- 最终 Preview deployment `6nj8a4NMTBKMeuiP7RHBNBFM3hiJ` 为 `READY`，稳定验收别名为 `china-in-fact-agent001-ecb2f98c3be5.vercel.app`。
- Alias 级 protection exception API 返回 `428 deployment_protection_exceptions_not_available`，因为当前项目没有 Advanced Deployment Protection。经用户批准，验收期间临时关闭项目 Preview SSO；完成后恢复 `all_except_custom_domains`，匿名 `/api/health` 再次返回 `302` 到 Vercel SSO。
- `china-in-fact` 既有 Production deployment、正式域名和 Production 数据库均未触碰。

## Real Cursor OAuth

- Cursor 项目级 `.cursor/mcp.json` 使用稳定 Preview MCP URL，不含凭据。Tools & MCPs 中 workspace server 初始为 Disabled，需要用户一次启用；这是需要进入 005 支持材料的真实客户端行为。
- Cursor 完成 DCR、浏览器登录、consent、authorization code + S256 PKCE、token exchange 和 Streamable HTTP 连接；日志读回 `tokens persisted`、`callback exchange completed` 与 `Successfully connected`。
- 真实 Chrome 表单提交携带 `Origin: null`。首轮实现把它交给 `new URL()` 导致 `Invalid URL`；修复后又发现 Payload auth 将 opaque Origin 判定为账户变化。
- 最终合同只在 `Sec-Fetch-Site: same-origin`、`Mode: navigate`、`Dest: document` 同时成立时接受 `Origin: null`，并仅在调用 Payload auth 前从克隆 headers 删除该 opaque Origin；Cookie 和其他认证 headers 保持不变。跨站、畸形或 fetch metadata 不匹配仍拒绝。
- 自动测试覆盖缺失 Origin、正常同源、跨源、畸形 Origin、合法/非法 `Origin: null` 和 Cookie 保留；`test:agent` 与 typecheck 通过后重新部署并完成真实 OAuth。

## Eight-step Member workflow

Cursor 在 Agent 模式中只使用 `china-in-fact-preview` MCP，顺序完成：

1. `account_context` 返回虚构 Member、Person、`author` 和 `active`。
2. `capabilities_list` 返回 7 个 Member 工具，没有 Editor 或账户管理动作。
3. `my_articles_list` 返回空列表。
4. `article_create_draft` 创建英文 draft Article 46，正文只有一段验收文本。
5. `article_get_working_copy` 读回相同标题、正文和 revision。
6. `article_save_draft` 使用前一 revision 和新 idempotency key 成功，返回新 revision。
7. `article_preview` 返回登录态 Preview 路径，没有公开 URL 或发布动作。
8. 读取 Article 1 返回不可重试 `NOT_FOUND`，未泄漏非本人对象。

Cursor 最终报告八步全部完成。整个流程产生最小工具审计，没有把 token、Cookie、数据库地址或正文写入 Agent event。

## Revocation and cleanup

- Member 在 Payload `Agent access` 页面看到实际 Cursor connection 和最近活动；撤销最活跃连接后状态立即从 `Active` 变为 `Ended`，活动新增 `Connection revoked`。
- 同一 Cursor 会话随后只调用一次 `account_context`，返回 `Unauthorized`；没有重新登录或授权，证明撤权在下一调用生效。
- 验收期间多次 OAuth 诊断共形成 12 条 test-user connection；清理事务删除 2 条 workflow event、21 条 agent event、12 条 connection、4 条专属 OAuth client、2 条 Article version、1 条 Article、1 条 Person version、1 条 Person 和 1 条 User。
- 清理后按 User 39、Person 34、Article 46、对应 connection/event/client/workflow event 逐项读回均为 0。临时 Preview 环境与 Cursor workspace 已移入废纸篓，可恢复；OAuth 浏览器标签已关闭。

## Recovered deployment-scope incident

一次 Vercel CLI 命令误从仓库根目录执行，创建了新的 `chinaknowledge` Vercel project，并把该新项目首个 deployment 标记为其 Production。它没有指向、覆盖或 promote 既有 `china-in-fact` project，也没有触碰 `chinainfact.com` 或 Production 数据。

发现后立即删除整个误建 `chinaknowledge` project，移除根目录 `.vercel`，并回退 CLI 添加的重复 `.gitignore` 行。后续 deployment 从正确的 `apps/web` project scope 执行。该事件说明 005 的 release runbook 必须先断言 Vercel project ID、working directory 和 target，再允许 deploy。

## Remaining boundary

- TRAE 与 WorkBuddy 仍为 `NOT RUN / NOT_VERIFIED`，因为当前没有客户端账号。
- Preview 保留 13 条 migration 和受 SSO 保护的部署证据，但没有 001 fixture 或公开 MCP。
- Production、真实成员、真实内容、merge 和 push 不属于本次执行，也未发生。
