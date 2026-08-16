---
doc_contract: DocContractV1
doc_type: reference
authority: evidence
status: completed
scope: agent-workspace-011-preview-runtime
last_verified: 2026-08-16
max_lines: 150
---

# Agent Workspace 011 Preview Runtime

## Verdict

`PREVIEW + INDEPENDENT REVIEW PASS / PRODUCTION NOT RUN`

Media 与 007–010 的统一 release SHA 已在受保护 Preview 完成 migration recovery、三角色真实 OAuth/MCP、权限负例、精确 cleanup 与关闭态回读。Production、正式域名、真实账号、真实数据、真实邮件、`main` push/merge 均未进入本批。一次独立 phase-release 复审及定向复核最终 `PASS`，P0/P1/P2=`0/0/0`。

## Release identity

- Release SHA：`af2ffbf5755c397221660bc658e630f7b75eb0b2`。
- 分支：`codex/agent-workspace-011-preview`；remote 只推送该分支。
- Draft PR：[`#2`](https://github.com/lonelyreader/chinaknowledge/pull/2)，base=`main`，未 merge、未启用 auto-merge。
- Vercel CLI 固定 `59.1.3`；live project=`china-in-fact`、root=`apps/web`、repo=`lonelyreader/chinaknowledge`、production branch=`main`。
- 验收部署：`dpl_B96wceKZqUufQXGGbeCQiHYYwPK9`，`READY / preview`，Git SHA 与 Release SHA 完全一致。
- 稳定 Preview alias：`china-in-fact-git-codex-agent-work-ccd471-lonelyreader-c40e168c.vercel.app`。
- 关闭态 deployment：`dpl_6qZ3KXFNfCU3LNtGH5sDZ6B9mgoV`，CLI inspect 为 `READY / preview`，Git source 仍是同一分支与 Release SHA，稳定 alias 已指向它。

## Backup and migration recovery

- 开窗前 Preview dump 为 `1,567,815` bytes，SHA-256 `7f878db4bdfdbd0f3b769cc2ca0c942be3fb81f6028f7428ff5e20a653b2fd3e`；`pg_restore --list` 为 `679` 行。
- dump 已恢复到隔离 PostgreSQL，并回读 `14 migrations / 36 Users / 32 People / 152 Articles / 60 masters`；不是只做文件存在检查。
- live ledger 实际为 `14/15`，不是合同中的预期 `13/15`。第 14 条 `20260803_163331` 已存在于 batch `8`，没有重复 apply 或猜测修复。
- Person 第 15 条 `20260812_042454_person_page_member_card` 独立 apply 为 batch `9`；核对 7 个 Person 字段、4 张 revision 表和 Discord enum。
- 最新 batch 只含 Person 后执行独立 down；字段、表、enum 均回退，User/Person/Media/Article/workflow/master 计数不变。随后单独 reapply 并回读恢复。
- 最终 ledger 为 `15`，Person=`batch 9`、第 14 条=`batch 8`。未运行 reset、手写 SQL、跨 batch rollback 或 Production connection。

## Fictional fixture and protocol

- 唯一 PASS run：`20260816093257-bbf39d6d`；manifest 位于权限 `0700` 临时目录并以 `0600` 原子写入。
- 恰好三组 `.test` User+Person：Member `59/54`、Editor `60/55`、Super Admin `61/56`；没有第四个角色账户。
- 精确 fixture：Purpose taxonomy `15`、approved Media `20`、eligible master `65`、Member Article `174`、Site draft `175`。
- 三个 DCR client `50/51/52` 与 connection `39/40/41` 均通过部署 HTTP 的 DCR、login、PKCE S256、authorize、token 建立，不用静态 API key 或本地 service 代替。
- MCP initialize 返回 server=`china-in-fact`、protocol=`2025-11-25`。Member/Editor/Super Admin discovery 精确为 `18/28/33` 个当前工具。
- token、password、authorization code、email、confirmation、notification key、正文与内部错误没有写入日志、仓库、PR 或本页。

## Real MCP results

| 角色 | 代表性闭环 | 关键读回 |
|---|---|---|
| Member | account/capabilities、Profile、X 外链、Article draft、cover、publication prepare/commit、working copy | Profile=`public` 后发布 Article；本人 media list 不含 Editor fixture，translation pair 保持未配对；最后 Article withdrawn、Profile draft、links 清空 |
| Editor | attention、purpose/approved-cover reference、Body V2 get、site fields save、selection prepare/commit、homepage schedule set/clear、major_edit prepare/commit/replay | Article=`published + curated`；排期清回 `none`；major_edit 为同一 WorkflowEvent、`not_required`、attempts=`0`、sent/error 均为空 |
| Super Admin | eligible master options/get、Site Article create/replay/get/save、activity page/asOf/filter | Site Article 保持 private draft；同 key replay 同 ID；固定 activity 过滤只有 major_edit 目标事件 |

负例通过：低角色不发现高角色工具、猜测直调拒绝、stale Profile/Article/Site revision、篡改 confirmation、重复 master+locale、任意 activity filter、Member 跨读 Site Article、paused User、同 token 降权 discovery、disabled client、missing Person、revoked connection 与旧 token `401`。审计临时形成 54 条 AgentEvent 和 10 条精确关联 WorkflowEvent；未含 email、token、confirmation 或正文。

测试 harness 的前置调整只涉及 `/tmp`：修正 Activity `asOf`、失败时先记录 User ID、用独立虚构 taxonomy、改用真实 Member publication、补 selected→curated 前置状态和响应 shape 断言。每次未通过的 harness 均先完成精确 cleanup 与 SSO 恢复；repo 产品代码和 schema 没有因此变化。

## Cleanup and closed state

- 先清除 homepage、Article public/curation 与 Profile public/links，再 revoke 三套 token；旧 token 均返回 `401`。
- 按 WorkflowEvent → AgentEvent → connection → Article/version → Media → master → Person → User → taxonomy → OAuth client 的精确 ID 顺序删除；没有按 domain、时间或前缀批量删除。
- PASS manifest 最终为 `cleaned`，password/token 已从 manifest 清空；全部 fixture ID 与三个 email locator 均不存在。
- 最终只读事务回读：migration `15`、User `36`、Person `32`、taxonomy `10`、Media `6`、master `60`、Article `152`、workflow `152`、AgentEvent/connection/OAuth client=`0/0/0`，与开窗前基线一致。
- 临时 branch-scoped `AGENT_GATEWAY_ENABLED` 与 `PAYLOAD_PUBLIC_SERVER_URL` 已删除；branch env 回读两者均不存在。
- 原 SSO policy `{ deploymentType: "all_except_custom_domains" }` 已恢复并由 project API 回读；匿名 MCP 为 `302`。短时关闭 SSO 后同一 stable alias 的 MCP 为 `404`，证明关闭态 deployment 的 Gateway 默认关闭；随后的匿名回读重新稳定为 `302`。
- 浏览器已登录 Vercel 会话能进入 stable Preview 首页，临时浏览器标签已关闭；没有保留登录态测试页面或 MCP 凭据。
- 独立复审完成后已停止隔离 PostgreSQL，并删除本地 Preview dump、已清敏 manifest 与一次性 harness；仓库和运行环境均不保留临时凭据。

## Local and Preview gates

- Release SHA 上 `npm ci`、`test:agent`、typecheck、lint、build、governance 与 diff check 全部 PASS；lint 为 0 error / 48 条既有 migration warning，build 为 77 routes。
- Preview 真实 HTTP OAuth/MCP、migration recovery、三角色闭环、关键负例、audit 最小化、provider call=`0`、cleanup、关闭态 404/302 均 PASS。
- npm audit 的 22 条既有依赖提示不在本批修复范围；未升级依赖或修改 package/lock。
- 独立复审只发现一组 canonical 状态过期 P2；同步 Preview ledger/计数、Media/007–010 和 Person 专项边界后定向复核 `PASS`，最终 P0/P1/P2=`0/0/0`。

## Production handoff

Production 仍保持 no-go。若获得新的 Production 批准，必须从独立备份开始，在 Production 单独核对当前 14 条 ledger，再 apply Person 第 15 条；随后部署包含 Release SHA 的 `main`、回读 33 tools/角色边界/公开路径/通知与恢复点。禁止沿用 Preview fixture、token、client、临时 env 或 migration batch 假设。

Production 交接包与 phase-release 独立复审已经闭合；下一步只能在新的 Production 批准下执行。
