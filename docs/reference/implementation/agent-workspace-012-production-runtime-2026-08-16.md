---
doc_contract: DocContractV1
doc_type: reference
authority: evidence
status: completed
scope: agent-workspace-012-production-runtime
last_verified: 2026-08-16
max_lines: 150
---

# Agent Workspace 012 Production Runtime

## Verdict

`PRODUCTION + INDEPENDENT REVIEW PASS`

011 的 33-tool 候选已经 Production 发布。第 15 条 Person migration、前后备份与隔离恢复、正式域名和公共路由、当前 Super Admin MCP discovery、本人 X 外链三方读回均通过；未写其他账号、内容或公开状态，未发送真实通知。未主持执行者的 phase-release 独立复审最终 `PASS`，P0/P1/P2=`0/0/0`，无未验证项或阻断项。

## Release identity

- Production release SHA：`ce23ba610eefbe15707bd2d22d72324349096889`；remote `main` 由 `a288b2148beeee4bdb62bc31dd1acf7d2730e5ef` 单次 fast-forward 到该 SHA。
- 011 应用源码候选为 `af2ffbf5755c397221660bc658e630f7b75eb0b2`；其后应用范围只有 `apps/web/package.json` 与 lock 的精确安全升级，其他应用源码未变。
- 正式 deployment：`dpl_CQkJRqNYFHDPhWE7BsXW54KNFoQi`，`READY / production / main`，Git SHA 与 release SHA 一致；`chinainfact.com`、`www`、主 Vercel aliases 均指向它。
- 发布前 READY 回滚点：`dpl_38Ni7qVCZDLnQ4vpiL1eVDuzjLDG`，SHA=`a288b2148beeee4bdb62bc31dd1acf7d2730e5ef`。
- Vercel project=`china-in-fact`、repo=`lonelyreader/chinaknowledge`、root=`apps/web`、production branch=`main`、Node=`24.x`；SSO 保持 `all_except_custom_domains`，Production Gateway 既有配置保持开启。

## Pre-release gates

- PR [`#2`](https://github.com/lonelyreader/chinaknowledge/pull/2) 在最终候选上为 Draft、`MERGEABLE / CLEAN`；Preview checks run [`31942515091`](https://github.com/lonelyreader/chinaknowledge/actions/runs/31942515091) 全绿，Vercel Preview checks 同 SHA 成功。
- 首轮 CI 的本机绝对证据链接已改为 portable 文本；Production backup 的旧 `39/13` restore 断言先按 live `45/14` 修复，没有改变导出、上传、保留或 provider 行为。
- 新 advisory 使原 Payload `3.86.0` 出现 6 个 high。最小修复锁步到 `3.87.1`，并精确 override `dompurify@3.4.13`、`fast-uri@3.1.5`、`js-yaml@4.3.1`、`nanoid@3.3.18`；Next/React 未升级，未运行 `npm audit fix`。
- Fresh install 后 production audit 为 high/critical=`0/0`；剩余 5 个 moderate 均来自 `db-postgres → drizzle-kit → @esbuild-kit → esbuild` 的开发工具链，当前上游无兼容修复。

## Backup and migration

- 迁移前 ledger 精确等于 repo 前 14 条；第 14 条 `20260803_163331` 单独位于 batch `7`，第 15 条是唯一 pending。
- 迁移前 backup run [`31942311181`](https://github.com/lonelyreader/chinaknowledge/actions/runs/31942311181) 上传 `2026-08-16T10-41-33Z.dump` 与独立 checksum；下载校验 `production.dump: OK`，隔离恢复为 `45 tables / 14 migrations / 14 allowlisted / 12 critical tables`，媒体 manifest 和样本 SHA 读回成功。
- 第 15 条 `20260812_042454_person_page_member_card` 单独 apply 成 batch `8`；即时回读为 49 tables、15 migrations、7 个 Person 字段、7 个 version 字段、4 张数组表和 2 个 Discord enum 标签。
- 迁移前后业务计数保持 `12 Users / 12 People / 6 Taxonomies / 12 Media / 60 masters / 134 Articles / 284 WorkflowEvents`；migration 前 AgentEvent/connection/client 为 `548/11/11`。
- 迁移后 backup run [`31942516786`](https://github.com/lonelyreader/chinaknowledge/actions/runs/31942516786) 上传 `2026-08-16T10-46-11Z.dump` 与 checksum；隔离恢复为 `49/15/15/16`，业务计数仍为 `12/12/134/12/284`，媒体 manifest 与样本 SHA 再次读回成功。

## Production runtime

- 匿名 smoke：`/` 为预期 `307→/en`；`/en`、代表性 Article、`/admin/login`、`/api/health`、OAuth metadata 与 protected-resource metadata 均 `200`；无 token 的 MCP POST 为 `401`。
- 当前常驻 MCP connection 的 `account_context` 返回 `userId=1 / personId=1 / super_admin / active / public`；`capabilities_list` 精确返回 33 个工具。
- 角色数量边界沿用同一应用源码在 011 真实 OAuth/MCP 的 Member/Editor/Super Admin=`18/28/33` 证据；Production 未创建虚构角色、client、connection 或内容 fixture。
- Gateway 和 SSO 未临时开关；未创建 DCR，因此没有可撤销的本批 token/client/connection。用户既有常驻 connection 保留，connection/client 总数仍为 `11/11`。

## Current user X write

- Chrome 已登录 X 页确认目标为 `https://x.com/WorldlyGeXu`；写入前 `my_profile_get` 的 links 只有一个 `personal_site`，没有 `x`。
- `my_links_save` 使用最新 revision 和唯一 idempotency key，提交完整原 links 原样加 `{type:x,label:X,labelEs:X,url:https://x.com/WorldlyGeXu}`；成功 audit ID=`575`，revision 前进一次。
- 写后 `my_profile_get` 证明 links 为 `personal_site,x`，数量 `1→2`，原 link 的类型、标签、URL、顺序逐字段不变；Profile 字段、公开状态、public/preview path、完整度与 public effect 全部不变。
- 数据库按本人 Person ID 最小读回：total=`2`、x=`1`、non-x=`1`、X exact=`true`；AgentEvent `575` 为 `my_links_save / account / object 1 / success`，含前后 revision，不含链接或个人资料值。
- 匿名 [`EN Person`](https://chinainfact.com/en/people/gexu) 与 [`ES Person`](https://chinainfact.com/es/people/gexu) 均 `200` 并包含精确 X URL。其他 User/Person/Article/Media/WorkflowEvent 计数不变；AgentEvent 在执行阶段因最小读写 smoke 从 `548→559`，独立复审另执行 9 次只读 MCP 调用并按设计增加最小审计，不属于领域数据变化。

## Local and CI validation

- Payload `3.87.1` fresh install：`test:agent`、typecheck、lint（0 error / 48 既有 migration warning）、77-route build、production audit、governance 与 diff check PASS。
- 全新 Local scratch DB 完整 apply 15 migrations；`test:agent:live` 与 `test:editorial` PASS。Release branch 的 GitHub CI 再次完成 migration/editorial/newsletter/lint/typecheck/audit/build/public-route smoke。
- 未改 schema 定义或 migration 文件；未升级 Next/React；未改 DNS、provider、WAF、付费项或密钥。

## Cleanup and review

- 没有 Preview fixture、临时 OAuth 凭据或 Production dump 落到本机；R2 recovery points 由既有 retention 管理。
- Local scratch database、SSH forward、测试依赖备份、Vercel 临时链接文件和 build 输出已精确清理；集成 worktree clean。用户 `outputs/` 改动始终未暂存、未提交、未修改。
- 未主持执行者完成一次 phase-release 独立复审；唯一 canonical 旧状态 finding 已定向修复并复核，最终 `PASS`，P0/P1/P2=`0/0/0`、未验证项=`0`、阻断项=`0`。007–012 已归档。
