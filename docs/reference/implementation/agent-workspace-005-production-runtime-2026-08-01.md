---
doc_contract: DocContractV1
doc_type: reference
authority: evidence
status: active
scope: agent-workspace-005-production-runtime
last_verified: 2026-08-02
max_lines: 220
---

# Agent Workspace 005 Production Runtime

## Gate contract

Gate 5 只应用仓库既有 migration `20260730_181300`，并以 Agent Gateway 关闭态完成 staged Production release。用户已批准剩余冻结门禁；仍禁止新 schema/migration、真实内容改写、批量动作、额外依赖、付费能力和 checklist 外路径。

## Read-only baseline

- Production 当前 deployment 为 `dpl_AtoZhpk3PudBrkZPq9NZfzDgxYbG`，状态 `READY`；Agent Gateway 关闭。
- 数据库为 33 张 public table、12 条 migration，最后一条为 `20260729_193000_batch_rollback_barrier`；没有 Agent table。
- 只读计数为 User/Person/Media/Article/workflow `2/2/2/3/10`：1 Super Admin、1 author；1 public Person、1 draft Person；2 Published + Curated Article、1 draft + not_selected Article。它们都是既有真实对象，不属于 005 fixture 或清理范围。
- 最近一次 scheduled backup run `30692830561` 成功：数据库对象与 SHA readback PASS，isolated restore 为 `33/12/12/8`，业务计数为 `2/2/3/2/10`，4 个 media object 完成备份/readback。

## Recovery amendment D validation

- Workflow changed path 只有 `.github/workflows/production-backup.yml`。没有改 schedule、export/upload、R2/Blob、secret/vars、media verification、migration 文件、应用代码或依赖。
- Exact diff 只增加 named migration `20260730_181300`，critical tables 只增加 `agent_oauth_clients`、`agent_connections`、`agent_events`，accepted tuple 从 `33,12,12,8` 更新为 `39,13,13,11`。
- Ruby YAML parse 与 `git diff --check` PASS。
- 专用 Local database `chinaknowledge_agent005_workflow_20260802_0031` 从空库顺序执行全部 13 条 migration，最后一条为 `20260730_181300`；复用 workflow 的 exact SQL 读回 `39,13,13,11`。
- 专用数据库已精确删除并读回不存在；本轮启动的 Local PostgreSQL 已停止。

## Pending execution

Recovery amendment D 已由未主持实现者独立复审 `PASS`，`P0/P1/P2 = 0/0/0`。

## Backup and migration

- 分支在 `451dcfd` 推送后，先从 default branch 触发 pre-migration backup run `30708739270`：dump 与 SHA readback PASS，isolated restore `33,12,12,8`，业务计数 `2/2/3/2/10`，media manifest/object readback PASS。Recovery point 时间为 `2026-08-01T16-43-17Z`。
- Production migration status 再次读回只有 `20260730_181300` 未执行。首次 migration 命令受 env pull 中 Vercel 运行标记影响，进程 `0` 退出但没有 migration log；立即数据库读回仍为 `33/12` 且无 Agent table，证明没有半迁移。
- 隔离进程只携带 Production `DATABASE_URL` 与 Local migration 所需最小配置，随后精确执行 `20260730_181300`，migration log 为 `Migrated (600ms)`。
- 执行后读回 39 张 public table、13 条 migration、最后一条 `20260730_181300`、6 张 Agent table；`agent_oauth_clients/agent_connections/agent_events = 0/0/0`。业务计数仍为 `2/2/2/3/10`，没有改写既有真实对象。
- 本分支更新 workflow 的 post-migration backup run `30708854966` PASS：dump/SHA readback、isolated restore `39,13,13,11`、业务计数 `2/2/3/2/10` 与 media readback 全部通过。Recovery point 时间为 `2026-08-01T16-46-26Z`。

## Gateway-off staged release

- Production env 没有 `AGENT_GATEWAY_ENABLED`，因此保持默认关闭；没有新增或改动 env。`PAYLOAD_PUBLIC_SERVER_URL` 继续使用既有 Production 值。
- `npx vercel --prod --yes` 完成 environment check、Next build、typecheck 与 75 routes，deployment `dpl_EcWc4j6xvHohk9JciWkhCr31CGQZ` 为 Production / `READY`，并接管 `chinainfact.com`、`www` 与既有 Vercel aliases。
- 关闭态 smoke：`/` 为 `307 → /en`，`/en`、`/en/stories`、Admin、health 为 `200`；protected-resource metadata、authorization-server metadata、authorize、DCR/token/revoke POST 与 MCP GET/POST 均 `404`。
- Request logs 以 deployment/path/method/status 读回公共站/Admin/health 成功与 Agent 关闭态 `404`；没有读取 message、token、cookie、账号、正文或对话。5 条 Agent WAF rule 保持 live，threshold 未变，provider 无 pending draft。
- Deployment 不隐式 migration：发布后数据库仍为 `39/13/0/0/0`，业务计数 `2/2/2/3/10`。旧 Production deployment `dpl_AtoZhpk3PudBrkZPq9NZfzDgxYbG` 仍为 `READY`，是明确代码 rollback target；schema 保留向后兼容的空 Agent tables，不执行 down migration。

Gate 5 staged release 已由未主持执行者独立复审 `PASS`，`P0/P1/P2 = 0/0/0`。

## Gate 6 public enable

- Production 环境新增 `AGENT_GATEWAY_ENABLED=true` 后，从 Gate 5 构建重新部署为 `dpl_2praoBzrH9hhuAMMmJYR3nCexQB4`；状态为 `READY / production`，`chinainfact.com`、`www` 与既有 Vercel aliases 均指向该 deployment。
- 公开读回为 `/ → 307`，`/en`、`/en/stories`、Admin、health、两条 OAuth metadata 均 `200`；匿名 MCP GET/POST 均 `401`。公开站、CMS 和健康检查未回归。
- 当前已登录 Super Admin 只用于一次受控 smoke：DCR `201`、PKCE S256、授权确认、token exchange、13 tools discovery、`account_context=super_admin`、`capabilities_list` 和 `admin_recent_activity` 成功。带虚构 confirmation/revision 的 `article_commit_publication` 以 `VALIDATION_ERROR` 失败，没有领域写入；revoke 后旧 token MCP 为 `401`。
- 审计读回精确为 `authorization_approval/account_context/capabilities_list/admin_recent_activity/oauth_revoke = success` 与 `article_commit_publication = failed`。执行前后 Article 状态均为 2 条 `published + curated + public + published`、1 条 `draft + not_selected + draft + draft`；User/Person/Media/Article/workflow 保持 `2/2/2/3/10`。
- DCR fixed-window/IP rule 的并发无效请求为 `10x400 + 1x429`；窗口恢复后请求回到应用层 `400`。5 条 Agent rule 与既有 Newsletter rule 均 active，Attack Mode 关闭、无 bypass、无 provider draft。
- Vercel request logs 只读回 deployment、environment、path、method、status、request ID 与 source，覆盖 authorize `200/302`、token `200`、MCP `200`、revoke `200` 和撤销后 MCP `401`；没有读取或保存 message、token、code、cookie、账号字段、内容或对话。
- cleanup 先断言 Production 只有本轮 `1 client / 1 revoked connection / 6 events`，再通过 Payload Local API 按 event → connection → client 删除；外部数据库最终读回 `39 tables / 13 migrations / 0/0/0 Agent`，业务计数和 Article 状态不变。临时 client、callback、token、env pull 与三个本地运行脚本均已精确删除。
- Gateway 保持公开启用；旧 Gate 5 deployment 仍为代码 rollback target，紧急恢复可移除 Production flag 并重新部署关闭态。Gate 6 未主持执行者独立复审 `PASS`，`P0/P1/P2 = 0/0/0`。
