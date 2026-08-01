---
doc_contract: DocContractV1
doc_type: reference
authority: evidence
status: active
scope: agent-workspace-005-independent-review
last_verified: 2026-08-01
max_lines: 120
---

# Agent Workspace 005 Independent Review

## Product amendment B

Verdict：`PASS`

Severity：`P0/P1/P2 = 0/0/0`

复审者未主持 Product amendment B 的实现，并保持只读。复审基线为 `bf59543` 后的当前任务 diff，用户 `outputs/**` 明确排除。

## Contract readback

- 产品 changed paths 仅 `apps/web/src/agent/oauth-http.ts` 与 `apps/web/tests/agent-http.ts`。
- WorkBuddy 只接受 `workbuddy://workbuddy/mcp/custom-mcp%3Achina-in-fact/oauth/callback`；其他 host、server key、query、hash、userinfo 与任意路径均失败关闭。
- Cursor 精确 callback、HTTPS 与 HTTP loopback 行为保持不变。
- WorkBuddy DCR fixture 返回 `201`，创建数据读回 `clientFamily=workbuddy`，callback 原样保存。
- 没有 schema、migration、依赖、env、provider、权限或敏感日志变化；没有访问外部环境。

## Verification

- `npm --prefix apps/web run test:agent`：PASS。
- `npm --prefix apps/web run typecheck`：PASS。
- `npm --prefix apps/web run lint`：PASS，`0 errors / 40` 条既有 migration warnings。
- `npm --prefix apps/web run build`：PASS，`75` routes。
- `npm run feature-registry:check`：PASS。
- `npm run docs:governance:check`：PASS。
- isolated changed-path coverage：PASS，5 个任务路径均由 `AGENT-WORKSPACE-005` 覆盖。
- `git diff --check` 与 `git diff --cached --check`：PASS。

Product amendment B 可以提交并进入已获授权的 Gate 2 重试。该结论不批准 provider、migration、Production、真实账户/数据、merge 或 push。

## Gate 2 client batch

Verdict：`PASS`

Severity：`P0/P1/P2 = 0/0/0`

复审者未主持本轮 WorkBuddy/Cursor 执行，并保持只读；用户 `outputs/**` 明确排除。

- WorkBuddy 最终重试严格限于 Article `49` 的 working-copy 与 publication prepare；服务器确认已呈现，commit event 为 `0`，Article 仍为 draft，公共状态未改变。
- Cursor 证据准确限定为 Cursor 3.13.25 随附的官方 Agent CLI；`account_context` 与 `capabilities_list` 均形成服务端 `success` event，没有把 GUI discovery 写成实际调用。
- 数据库计数、SSO、Gateway、alias、WorkBuddy/Cursor 本地配置及 Cursor CLI 登录状态均有精确恢复读回。
- 任务 changed paths 全部属于 `AGENT-WORKSPACE-005` allowed paths；未发现 secret、PII、越界产品代码或 Gate 3/Production 暗示授权。
- 独立复跑 docs governance、feature registry 与 `git diff --check` 均 PASS；完整 intake 只因明确排除的用户 `outputs/**` 失败。

Gate 2 客户端批次可以关闭。该结论不批准 Gate 3、provider、firewall、migration、Production、真实账户或真实数据。

## Gate 3 operational protection

Verdict：`PASS`

Severity：`P0/P1/P2 = 0/0/0`

复审者未主持 Gate 3 provider 执行，并保持只读；用户 `outputs/**` 明确排除。

- Live WAF 有 5 条与 Operational amendment C 一致的 exact-path rule：均覆盖 Preview + Production，以 IP 为 key、fixed window、无持久封禁；DCR/token/revoke 限定 `POST`，authorize/MCP 保留协议所需 method。
- 阈值分别为 `10/30/20/20/60` 每 60 秒；既有 Newsletter rule 保持 Production `POST /api/newsletter`、`5/600s/IP`。Firewall 开启、Attack Mode 关闭、IP block/system bypass 为空，draft 和 pending diff 为空。
- Provider activity 的 log-first 与 rate-limit publish 相隔约 10 分 55 秒，并记录 disable/publish、enable/publish 与 SSO disable/restore，和执行证据时间线一致。
- Preview SSO 当前为 `all_except_custom_domains`；匿名 public/Admin/health/metadata/MCP 均 `302`，保护绕过只读请求为 health `200`、Gateway-off MCP `404`。
- Local token replay、connection compromised、后续 token 失效与专用数据库 cleanup 有测试断言；观测合同把 Firewall/request metadata 与 `agent_events` 分开，未引入付费 Metrics、Webhook、Log Drain、收件人或敏感字段。
- 8 个非 `outputs/**` changed paths 均由 HEAD allowed paths 覆盖；`git diff --check`、docs governance 与 feature registry PASS。完整 intake 只被明确排除的用户 `outputs/**` 阻断。

历史 dashboard 的 `Logged 5 / Allowed 178` 与逐请求 429 序列不能由 CLI 回放，只保存在本门 evidence；当前 live rules、发布时序和证据算术一致，不构成 finding。Gate 3 可以关闭并进入 Gate 4。

## Gate 4 Preview release rehearsal

Verdict：`PASS`

Severity：`P0/P1/P2 = 0/0/0`

复审者未主持 Gate 4 执行，并保持只读；用户 `outputs/**` 明确排除。

- Closed baseline `dpl_2NFvyEXSH52bsUDhFRPX7viRYvY6` 与 rehearsal `dpl_25Sd4JrMTBo27v5KaLBo3mwNsZSx` 均为 Preview / `READY`；stable alias 已精确回指 closed baseline。
- Preview SSO 为 `all_except_custom_domains`，临时 `AGENT_GATEWAY_ENABLED` / `PAYLOAD_PUBLIC_SERVER_URL` 均不存在。匿名 public/Admin/health/metadata/MCP 均 `302`；保护绕过只读 health `200`、MCP `404`，符合 Gateway 关闭态。
- WAF 6 条 live rule 均启用，5 条 Agent 阈值未变化，draft/diff 为空。Rehearsal request logs 独立读回 DCR `1x201 + 9x400`、authorize `200/302`、token `200`、MCP `3x200` 与撤销链 `401`、revoke `200`。
- 同窗 `1` 次有效 DCR 与 `9` 次应用层 `400` 占满 `10` 次允许量，后续 `2x429` 在 WAF 层终止且不进入 function logs；执行证据与独立日志算术一致。
- 8 个非 `outputs/**` changed paths 均在 HEAD allowed paths 内；没有产品代码、schema、migration 或依赖 diff。
- 按禁止 env pull/secret 的审计边界，reviewer 没有重新连接 Preview DB；最终 `36/32/6/32/150/0/0/0/13`、39 tables 依赖执行者的 exact locator、删除前断言、删除顺序和最终聚合证据。当前 env、SSO、alias、Gateway/WAF 无残留，与该清理结论一致，不构成 finding。

Gate 4 可以关闭并进入 Gate 5。

## Gate 5 Recovery amendment D

Verdict：`PASS`

Severity：`P0/P1/P2 = 0/0/0`

复审者未参与 workflow 实现，并保持只读；用户 `outputs/**` 明确排除。

- 唯一实现路径为 `.github/workflows/production-backup.yml`，由 HEAD `6bc2815` 精确授权。
- Workflow diff 只增加 named migration `20260730_181300`、三个 Agent 主表，并把 accepted tuple 从 `33,12,12,8` 改为 `39,13,13,11`；schedule、export/upload、R2/Blob、secret/vars、media verification、migration、应用代码和依赖均未变化。
- migration 源码创建 3 张主表与 3 张关系子表，因此 public tables 为 `33 + 6 = 39`；migration、named migration、critical tables 分别为 `12 + 1 = 13`、`12 + 1 = 13`、`8 + 3 = 11`。
- Local 13-migration fixture 的 `39,13,13,11` 写回与源码和 workflow SQL 一致；Ruby YAML parse、`git diff --check`、docs governance、feature registry 与 changed-path coverage PASS。
- 顺序和恢复合同成立：migration 前先用 default branch 旧断言取得新 backup PASS；migration 后不得单独回退旧断言或执行 down migration，必须用本分支新断言完成恢复演练。

Recovery amendment D 可以提交并按冻结顺序推进。
