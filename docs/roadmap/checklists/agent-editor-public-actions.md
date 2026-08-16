---
doc_contract: DocContractV1
doc_type: checklist
authority: execution
status: active
scope: agent-editor-public-actions
last_verified: 2026-08-16
max_lines: 180
change_id: AGENT-WORKSPACE-009
risk_tier: upgraded
validation_profile: work_item
allowed_paths: apps/web/src/agent/**, apps/web/src/cms/article-publication.ts, apps/web/src/cms/editorial-notifications.ts, apps/web/tests/agent-contracts.ts, apps/web/tests/agent-http.ts, apps/web/tests/agent-routes.ts, apps/web/tests/agent-fixtures.ts, apps/web/tests/agent-schema.ts, apps/web/tests/agent-live.ts, apps/web/tests/editorial-workflow.ts, docs/roadmap/**, docs/reference/**, docs/current-state.md, docs/product-feature-registry.md
approval_gates: main-push, production-deploy, real-account, real-data, production-public-state, real-external-notification
---

# AGENT-WORKSPACE-009 Editor 公共与外部动作

目标：在既有 Agent Gateway 上增加两项明确动作的 `prepare → explicit confirmation → commit → readback`：已公开且已策展 Article 的首页排期，以及 Member Article 的 `major_edit` 作者通知。失败通知只重试原 commit 和同一 WorkflowEvent。

父级：[`Agent Workspace Parent Checklist`](../agent-workspace-program.md)。008 已完成 Local 实现与独立复审，只等待统一 Preview/release，不再扩代码。本批不新增“复核”工具，不重复既有站方选择或自动策展通知，也不提前实现 010。

## Scope

- `editorial_prepare_homepage_schedule` / `editorial_commit_homepage_schedule` 只修改 `homepagePlacement / homepageStartsAt / homepageEndsAt`；prepare 只写 pending Agent event，commit 才写 Article，并返回 revision、排期和当前公开影响。
- 首页目标仅为 `none`（清空并要求 start/end 均为 `null`）或 `lead / selected` 加完整 RFC 3339 start/end，且 end 必须晚于 start；不建立后台 scheduler、冲突消解或唯一 lead 平台，继续由现有首页 read model 按时间窗决定展示。
- 排期对象必须已经 `publicationStatus=published`、`curationStatus=curated`、Payload live version 为 published，且不存在未发布的 pending draft。prepare 与 commit 都重检；排期绝不能顺带发布或覆盖 pending draft。
- `editorial_prepare_major_edit_notification` / `editorial_commit_major_edit_notification` 固定发送既有 `major_edit` 模板给 Member Article 的当前 owner 邮箱。输入只接受 Article ID、revision，以及 commit 的 confirmation ref / idempotency key。
- 通知首次 commit 最多创建一个 WorkflowEvent；`failed` 或中断后以原 commit 相同输入安全重试同一 WorkflowEvent、recipient 与 notification key，即使原 confirmation 随后过期也不重新 prepare。`sent` / `not_required` 重放只读回，不再次发送。
- Preview 沿用现有环境合同返回 `not_required`，不得调用真实邮件 provider；真实外部通知只进入 Production 单独发布门。

## 最小工具合同

| 工具 | 最小输入 | 结果与边界 |
|---|---|---|
| `editorial_prepare_homepage_schedule` | Article ID、revision、placement、startsAt、endsAt | 返回服务端排期摘要、当前公开影响、5 分钟 confirmation；Article/version/workflow 不变 |
| `editorial_commit_homepage_schedule` | confirmation ref、revision、idempotency key | 重检 actor、connection、live/pending 状态与 revision 后写排期；返回新 revision、公开读回与恢复前值 |
| `editorial_prepare_major_edit_notification` | Article ID、revision | 返回固定 `major_edit`、Article、作者显示名和“账户邮箱”影响摘要，不返回邮箱；不建 WorkflowEvent、不发邮件 |
| `editorial_commit_major_edit_notification` | confirmation ref、revision、idempotency key | 服务端推导 kind/recipient/copy；创建或复用唯一 WorkflowEvent，返回 event ID、status、attempts 和安全重试指引 |

## No-go

- 不新增复核、批准或 workflow-status 工具；现有 `editorial_article_get`、站方字段保存和站方选择已覆盖本批前置任务。
- 不改变 title、summary、body、cover、分类、owner、author、locale、translation、publication、curation、workflow 或 `_status`；排期不发布 Article 或 pending draft。
- 不重复发送或改造现有 Select/Add、Remove、`needs_recheck` 通知；新工具不接受 notification kind。
- 通知输入不能提供 recipient、email、from、reply-to、subject、body、template、locale 或 provider 参数；服务端只使用现有 `major_edit` 模板和 Article owner。
- 不创建站方 Article，不读写 Editorial Master，不增加基础对象查询或 activity 筛选；这些属于 010。
- 不新增 schema/migration、WorkflowEvent 字段、队列、cron、worker、通用 action/notification framework、模板平台、批量排期或批量通知。
- 不改 Payload Admin UI、现有网页通知 endpoint、OAuth/client adapter、环境配置、provider、依赖、密钥、WAF 或部署。

## Upgraded contract

- `data_truth`：Payload Article live/draft versions、User、WorkflowEvent、AgentEvent 和当前 connection 是唯一真相；本批无 schema/migration。
- `read_path`：Agent request → 当前 connection/User/role → Article live 与 latest draft 对照 → owner/公开/策展/排期或 notification event 最小投影 → 结构化结果。
- `write_path`：strict schema → prepare 绑定 actor/connection/Article/action/target/revision/expiry；通知同时绑定服务端 owner ID 与 recipient digest → commit 行锁与当前事实重检 → 既有 Payload hooks/versions 或 editorial notification helper → Agent event → 公开/事件读回。
- `permission_boundary`：只有当前 active Editor / Super Admin 可发现和直调四个工具；Member、paused、降权旧 token、revoked connection 和 disabled client 失败关闭。通知目标只能是 Member Article 的服务器当前 owner。
- `audit_boundary`：记录 actor、connection、tool、Article、action、request、confirmation digest、前后 revision、WorkflowEvent ID 和结果；不记录 confirmation ref、token、email、recipient、subject/body、provider response 或内部错误。
- `recovery`：首页排期用新一次 prepare/commit 恢复 prepare 摘要中的旧值；通知不能撤回，依靠固定 notification key 与同一 WorkflowEvent 幂等重试，绝不以新 event“补发”。
- `independent_review`：未主持实现者做一次终局复审，覆盖 pending draft 隔离、confirmation 绑定、通知单事件重试、Preview `not_required`、权限/审计负例和 allowed paths；只对合同内 BLOCK 定向复核。
- `key_invariants`：prepare 不改领域状态；排期只改三项 homepage 字段且不发布 pending draft；通知 kind/recipient/copy 只由服务端决定；一个已确认动作最多一个 WorkflowEvent；失败重试不重复投递；既有策展通知不变。
- `finding_route`：站方 Article、基础对象与 activity 进入 010；三角色真实客户端、Preview cleanup 与 Production 总验收进入 011；其他相邻需求回父级排队。

## 权限、确认与恢复负例

- Member、paused actor、missing Person、revoked/expired connection、disabled client 和降权旧 token 不发现工具且直调失败。
- 排期对未公开、未 curated、withdrawn、Payload pending draft、非法 placement、缺失/无效时区、end<=start、stale revision 全部拒绝，Article 与 version 不变。
- prepare 后 actor/role/connection/Article revision、live/draft 状态或原排期变化，首次 commit 失败；confirmation 跨工具、跨对象、过期、已用或被篡改均失败，唯有已创建通知 WorkflowEvent 的同指纹原 commit 可继续安全重试/读回。
- 通知对 site-authored、owner 缺失或不可用、伪造 kind/recipient/email/subject/body、stale revision 失败；prepare 不创建 WorkflowEvent。
- 首次 commit 失败后重试必须保持同一 WorkflowEvent ID、notification key 与 recipient；并发 commit 最多一次发送，sent/not_required 重放不增加 attempts。
- Preview 强制 `not_required` 且 provider 调用为零；若观察到 pending/sent 或真实外部请求，立即 BLOCK。
- 同 idempotency key 同输入安全重放、不同输入冲突；失败和审计输出不得泄露邮件地址、文案、provider error 或 confirmation ref。

## Acceptance

- [x] Editor 能对符合门槛的 Article prepare/commit 首页排期或清空排期，获得精确摘要、写后 revision、公开读回和可执行恢复值；pending draft 从未被发布。
- [ ] Editor 能 prepare/commit 一次固定 `major_edit` 作者通知；输入无法控制 kind/recipient/copy，Preview 只生成 `not_required` WorkflowEvent 且不发真实邮件。
- [x] 通知失败以原 commit 重试同一 WorkflowEvent；并发、重放、provider timeout 和 sent/not_required 读回均不产生第二事件或重复投递。
- [x] Member 隔离、当前角色、stale/expired/tampered confirmation、状态变化、审计隐私和恢复负例全部通过；既有站方选择及 selected/removed/needs_recheck 通知行为不变。
- [x] 无复核工具、无 010 能力、无 schema/migration、无通用动作/通知平台、无 UI/provider/config diff。

## Validation

- `npm --prefix apps/web run test:agent`；专用 Local scratch DB 运行 `npm --prefix apps/web run test:agent:live`；目标 `npm --prefix apps/web run test:editorial`。
- `npm --prefix apps/web run typecheck`、`npm --prefix apps/web run lint`、`npm --prefix apps/web run build`、`npm run governance:check`、`git diff --check`。
- Preview 不单独重复前序验收；与 Media、007、008、010 一起进入 011 的一次性三角色真实客户端演练，通知必须 `not_required`。

## Release gates

- 用户已预授权本批本地开发、commit、本地 merge、branch push 与 Preview；Preview 仅用虚构 Article 且不发邮件。`main` push 会自动触发 Production，仍与 Production deploy、真实账户/数据、Production 首页状态和真实外部通知一起保留。

## Writeback

- Local PASS 后更新 feature registry、current-state、父级状态和 implementation evidence；一次独立复审 PASS 后 010 才能激活。Production 读回后再归档。
- 当前门：009 Local 工作项与独立终局复审 PASS（P0/P1/P2=`0/0/0`），已合入本地 `main`（`83ce74f`）；只剩 011 统一 Preview/release，不再扩代码。证据见 [`AGENT-WORKSPACE-009 Local runtime`](../../reference/implementation/agent-workspace-009-local-runtime-2026-08-16.md)。
