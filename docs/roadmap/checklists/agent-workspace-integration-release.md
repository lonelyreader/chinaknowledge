---
doc_contract: DocContractV1
doc_type: checklist
authority: execution
status: active
scope: agent-workspace-integration-release
last_verified: 2026-08-16
max_lines: 180
change_id: AGENT-WORKSPACE-011
risk_tier: upgraded
validation_profile: phase_release
allowed_paths: docs/roadmap/**, docs/reference/**, docs/current-state.md, docs/product-feature-registry.md
approval_gates: main-push, merge, production-backup, production-migration, production-deploy, production-public-state, real-account, real-data, real-external-notification
---

# AGENT-WORKSPACE-011 Preview 集成与生产前交接

目标：把 Media 与 007–010 已通过 Local/独立复审的能力，在一个受保护 Preview 中用虚构三角色、真实 OAuth/MCP 客户端完成一次集成验收、迁移恢复和精确清理，产出可审核的 Production 交接包。本批不实现新工具、不改 schema、不进入 Production。

当前状态：Preview 集成、migration recovery、三角色真实 MCP、精确 cleanup 与一次 phase-release 独立复审均 `PASS`，P0/P1/P2=`0/0/0`；关闭态已恢复 SSO `302` / Gateway-off `404`。007–010 均为 release-only，Production 保持 no-go。

## Scope

- 在专用 branch/Draft PR 上部署一个绑定精确 SHA 的受保护 Preview；只处理 Media 与 007–010 的现有 33 工具。
- 分批验证 Preview migration 14/15 与 Person 独立 rollback/reapply；用一套虚构三角色+eligible master 运行真实 OAuth/MCP。
- 恢复 SSO/Gateway/alias/env、精确删除 fixture，并形成 Production 交接包；本批不进入 Production。

## No-go

- 唯一发布分支为 `codex/agent-workspace-011-preview`，只 push 此分支并创建 base=`main` 的 Draft PR。
- 禁止 `git push origin main`、PR merge、`vercel --prod`、`vercel promote`、Production alias/env/DB、正式域名、真实账户/数据、真实公共内容和真实外部通知。
- 分支 push 或 Draft PR 只有在 Vercel live 配置确认 production branch=`main` 后才可执行；若其触发或显示 Production target，立即停止。
- 本批只允许现有代码、migration 与工具合同；不补新 helper、fixture framework、通用发布脚本、CRUD、账户动作、通知平台或第二套清单。
- 临时凭据/env 只进入权限 `0600` 的系统临时目录或受控进程环境，不写 repo、shell history、PR、日志或 evidence；结束后精确删除。

## 1. 冻结分支、项目与 SHA

- [x] 从干净本地 `main` 建立或更新 `codex/agent-workspace-011-preview`；确认 remote 为 `https://github.com/lonelyreader/chinaknowledge.git`，无无关 commit 或脏树。
- [x] 在任何 push 前冻结 `RELEASE_SHA=$(git rev-parse HEAD)`；后续部署、migration runner、evidence 与交接只引用此完整 SHA。
- [x] 用已审核的固定版本 Vercel CLI/API 读取 live 项目设置，确认 project=`china-in-fact`、rootDirectory=`apps/web`、Git repo=`lonelyreader/chinaknowledge`、production branch=`main`；记录命令版本和只读结果。
- [x] 确认本地 link 解析到同一 Vercel project；不得仅凭 `.vercel/project.json`、alias 或历史 evidence 推断 live 设置。
- [x] 执行 `git push -u origin codex/agent-workspace-011-preview`，再用 Draft PR base=`main`、head=`codex/agent-workspace-011-preview`；PR 保持 Draft，未启用 auto-merge。
- [x] 等待 Preview READY；断言 deployment target/environment=`preview` 且 Git source SHA 精确等于 `RELEASE_SHA`。alias、构建时间或分支名未替代 SHA。

## 2. Preview 基线与迁移分批恢复

- [x] 开窗前记录 Preview deployment/alias、SSO policy、Gateway/env、migration ledger、关键表计数与 fixture 查重；完成数据库 dump、SHA-256 和隔离恢复可读检查。
- [x] 只连接 Preview 数据库；先运行现有 migration status/recovery 工具。repo 共 15 条 migration，Person 为第 15 条。
- [x] 现场为 14/15，第 14 条已在 batch 8；因此没有运行 13→14 旧 runner，也没有重复 apply。
- [x] 按 live ledger 与 repo 顺序制定同等隔离批次；未出现未知、缺口、重复、dirty 或超前 migration。
- [x] Person recovery 在最新 batch 恰好且仅含第 15 条时执行：batch 9 `down`、核对 schema 回退、再单独 reapply并验证 data/schema/ledger。未 reset、手写 SQL、跨 batch rollback 或连接 Production。
- [x] 迁移成功后 Preview ledger 保持 15；domain 数据在 fixture 清理后回到 live baseline。dump 只作为失败恢复点，未回灌。

## 3. 临时 SSO、Gateway 与虚构 fixture

- [x] 先保存可精确恢复的 Preview SSO policy、稳定 alias/closed deployment 与相关 env 原值；全部可读回。
- [x] 仅对 Preview 临时设置 `AGENT_GATEWAY_ENABLED=true` 与该 Preview 的 `PAYLOAD_PUBLIC_SERVER_URL`，重部署并再次核对 `RELEASE_SHA`/Preview/READY；按已记录策略短期开 SSO。未改 Production scope。
- [x] 生成唯一 run ID，创建恰好三组 `.test` User+Person：active Member、Editor、Super Admin；manifest 记录精确关系，Super Admin 为 Person-linked。
- [x] 创建一条明确虚构且可清理的 eligible 中文 Editorial Master：rights cleared、approved、中文 title/summary/Body V2/purpose/source 完整，并读回 Agent fingerprint。
- [x] 只在受保护 Preview 补最小虚构 Article/approved Media；homepage 动作完成后清除并删除。没有引用既有真实或 Production 对象。
- [x] OAuth client、connection 与 token 只经真实 DCR/OAuth 流程建立；每个角色独立会话。Preview 邮件为 `not_required`、provider call=`0`。

## 4. 真实 MCP 验收

- [x] 从部署 HTTP 入口完成真实 discovery、授权与 MCP 调用；记录 server identity、client、role、tool/result/event 摘要，未记录 token、email 或正文。
- [x] Super Admin discovery 精确为 33 个工具，Member/Editor 为 18/28；低角色不出现高角色工具，猜测直调由服务端拒绝。
- [x] Member 完成 account/capabilities、Profile/X、Article draft/cover/publication/working-copy 与恢复；本人、revision、媒体与翻译关系保持隔离。
- [x] Editor 完成 attention/reference/get/save、selection、homepage schedule set/clear；`major_edit` commit/replay 复用同一 Preview `not_required` WorkflowEvent，不发邮件。
- [x] Super Admin 完成 eligible master options/get、Site Article private draft create/replay/get/save、activity 固定筛选/page/asOf；未批准母稿、公开 Site draft、查询任意集合或管理账户。
- [x] 顺序完成 paused、missing Person、同 token 降权、revoked connection、disabled client、跨对象、stale revision、篡改 confirmation、重复 master+locale与任意 filter 负例，并恢复下一步所需状态。
- [x] 写入均核对领域 readback 与最小 Agent/Workflow audit；正文、email、token、notification key/error、confirmation 和内部错误未泄漏到 discovery、结果或审计。

## 5. 精确 cleanup 与关闭

- [x] 清理前以 run ID + 精确 ID 清点关系；未使用 email domain、时间段、collection 或模糊前缀批量删除。
- [x] 先清除 homepage/profile/public 状态，再按依赖精确移除本次 Workflow/Agent events、connections/OAuth clients、Article/version、Media、master、Person、User 与 taxonomy；只处理本次记录 ID。
- [x] 撤销 token/connection并以旧 token `401` 证明失效。三个 locator 与全部 fixture ID 均不存在，领域/OAuth/event 计数回到基线；ledger 保持 15。
- [x] 先恢复 SSO 原 policy，再移除临时 Preview env并重建同 SHA 关闭态 deployment；匿名 Agent route 为 SSO `302`，短时授权面回读 Gateway-off `404`。
- [x] 所有 harness 未通过尝试都先完成 cleanup 与 SSO 恢复，没有使用备份回灌或扩大删除范围。

## Stop conditions

- Vercel project/root/repo/production branch、Git branch/remote/HEAD/clean tree、deployment target/SHA/READY 任一不符。
- Preview backup/SHA、SSO/env/alias 原值或 migration ledger 无法确认；latest batch 不只含 Person；数据计数异常或 rollback/reapply 不闭合。
- 任何命令将触及 `main`、merge、Production、正式域名、Production alias/env/DB，或出现 secrets/个人数据泄漏。
- Preview 通知为 pending/sent/failed、provider call 非零，或 fixture 不是唯一虚构对象。
- role discovery/直调隔离、pending/live 隔离、confirmation/revision/idempotency、审计最小化任一失败。
- cleanup locator 有歧义、基线计数未恢复、SSO/Gateway 未关闭，或出现 P0/P1/P2 合同 blocker；停止并保留证据，不继续 Production。

## Validation

- `npm --prefix apps/web run test:agent`、`typecheck`、`lint`、`build`，再运行 `npm run governance:check` 与 `git diff --check`。
- Preview 验证只接受部署 HTTP 上的真实 OAuth/MCP、精确 SHA、migration ledger/schema/data、SSO/Gateway 和 cleanup readback；Local/mock 不能替代。
- 未主持实现者做一次 phase-release 复审；只对本合同违约、当前 diff 回归或直接安全失败阻断，修复后最多定向复核。

## Acceptance

- [x] Draft PR 与 Preview deployment 均精确绑定 `RELEASE_SHA`，Vercel live 断言证明 branch push 未触发 Production；`main` 未 push/merge。
- [x] Preview 现场 14→15、Person 独立 down/reapply、ledger/schema/data 回读和 dump 隔离恢复均有证据；未运行 reset/手写 SQL。
- [x] 一套虚构三角色+eligible master 完成真实 OAuth/MCP discovery、三条代表性闭环和关键负例；Super Admin 为 33 工具，低角色隔离，邮件 provider call=`0`。
- [x] 所有 fixture、token、connection、临时 env 与 SSO/Gateway 开窗精确清理；领域计数回到基线，Preview 恢复 SSO `302` / Gateway-off `404`。
- [x] `npm --prefix apps/web run test:agent`、`typecheck`、`lint`、`build`、`npm run governance:check`、`git diff --check` 与 Preview smoke 均 PASS；一次独立 phase-release 复审与定向复核最终 P0/P1/P2=`0/0/0`。
- [x] 形成 Production 交接包：完整 `RELEASE_SHA`、Draft PR/Preview URL、33 工具矩阵、migration 14/15 次序、备份/rollback、预期回读、cleanup 与 stop conditions；未执行 Production。

## Writeback 与 release gate

- 执行证据写入唯一 `docs/reference/implementation/agent-workspace-011-preview-runtime-2026-08-16.md` 并由 evidence router 挂载；current/feature registry 只写已经发生的运行事实。
- 只有上述 acceptance 与一次独立复审全部 PASS，才能请求新的 `main` push/merge 与 Production 批准。Production 必须另行备份、migration、deploy、真实角色与恢复，不沿用 Preview token/fixture/临时 env。
- 本批已执行 branch push、Draft PR、Preview deploy、migration recovery、SSO/Gateway 开窗、虚构 fixture 与真实 MCP；`main` push、merge 与一切 Production 动作仍保留。
