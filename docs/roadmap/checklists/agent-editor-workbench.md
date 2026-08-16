---
doc_contract: DocContractV1
doc_type: checklist
authority: execution
status: active
scope: agent-editor-workbench
last_verified: 2026-08-16
max_lines: 180
change_id: AGENT-WORKSPACE-008
risk_tier: upgraded
validation_profile: work_item
allowed_paths: apps/web/src/agent/**, apps/web/src/cms/article-curation.ts, apps/web/src/cms/media-policy.ts, apps/web/tests/agent-contracts.ts, apps/web/tests/agent-http.ts, apps/web/tests/agent-routes.ts, apps/web/tests/agent-fixtures.ts, apps/web/tests/agent-schema.ts, apps/web/tests/agent-live.ts, apps/web/tests/editorial-workflow.ts, docs/roadmap/**, docs/reference/**, docs/current-state.md, docs/product-feature-registry.md
approval_gates: main-push, production-deploy, real-account, real-data, public-state, external-notification
---

# AGENT-WORKSPACE-008 Editor 工作台

目标：让 Editor 不依赖用户提供内部 Article ID，即可从现有 Needs attention 队列找到 Article、读取 Body V2 与站方字段、取得受限引用选项，并按网页后台的普通保存语义更新站方字段。

父级：[`Agent Workspace Parent Checklist`](../agent-workspace-program.md)。007 已完成 Local 实现与复审，只等待统一 Preview/release；它不再获得代码扩项。本批不提前实现 009 的排期、复核和作者通知，也不实现 010 的站方 Article 建稿与安全站务。

## Scope

- `editorial_attention_list` 复刻现有 Needs attention 查询：`publicationStatus=published` 且 `curationStatus in [not_selected, needs_recheck]`，按 `updatedAt desc`；只允许 locale `en/es` 与 assignee `all/mine/unassigned`，增加 page / limit（最大 50）。
- `editorial_reference_options` 只提供本工具保存所需的引用白名单：当前 Editor 本人或 Super Admin 可分配的 active Editor / Super Admin、四类 taxonomy 和已批准公开使用的 cover media；支持有限搜索和分页，不接受 collection、where 或 sort。
- `editorial_article_get` 增加可选 Body V2 读取，并返回保存所需的 assignee、format、分类 ID/名称、完整 source notes、freshness、editor comments、cover 与 revision；继续隔离无关个人资料。
- `editorial_save_site_fields` 只允许 Editor / Super Admin 更新既有 Member-authored Article 的站方字段。它使用 partial patch、revision、idempotency key、事务和写后读回；数组字段被提供时整体替换，未提供字段保持不变。
- 普通保存不改变 Article 的个人公开或站方选择状态，也不触发通知；若目标已公开，结果必须如实返回本次字段是否立即影响公开页。

## 最小工具合同

| 工具 | 最小输入 | 结果与边界 |
|---|---|---|
| `editorial_attention_list` | page、limit；可选 locale、assignee | 返回 Article ID、标题、作者、locale、assignee、curation status、最近 workflow event、updatedAt、revision 与分页；查询条件固定 |
| `editorial_reference_options` | kind；可选 query、page、limit | kind 仅为 `assignee / purpose / topic / geography / situation / approved_cover`；返回最小 ID、label、kind 与分页 |
| `editorial_article_get` | Article ID；可选 Body V1/V2 | 返回现有正文读结果和完整站方字段、公开影响状态、revision；只读并审计 |
| `editorial_save_site_fields` | Article ID、revision、idempotency key、至少一个白名单字段 | 服务端重检角色、Member authorship、引用对象与 revision 后保存；返回新 revision、站方字段读回和 `publicEffect` |

## 可编辑站方字段

| 字段 | 输入规则 |
|---|---|
| `assignedEditor` | Editor 只能保存本人 ID 或 `null`；Super Admin 才能保存任一 active Editor / Super Admin ID；Member、paused 或不存在的 User 一律拒绝 |
| `format` | `guide / reporting / analysis / first_person / update` 或 `null` |
| `purposes / topics / geographies / situations` | 各自维度中的现有 taxonomy ID 数组；去重并拒绝跨维度、不可见或不存在的 ID |
| `sourceNotes` | 完整数组；每项仅含 label、可选 http/https URL、checkedAt 与 check；限制数量和字符串长度 |
| `freshnessDate` | ISO 日期或 `null`；Guide 进入站方分发前仍服从既有 freshness 门槛 |
| `editorComments` | 完整数组；输入不能指定 `createdBy`；新意见绑定当前 actor，既有行只按稳定 ID更新或移除，未知 ID 失败关闭 |
| `coverImage` | 已批准公开使用的 Media ID 或 `null`；不能读取或挂载他人未公开媒体 |

## No-go

- 不改 schema、migration、Payload collection 定义、Admin UI、OAuth、客户端 adapter、依赖或环境配置；若确需任一项，立即停止并重开门禁。
- 不写 `title`、`summary`、`body`、`slug`、`owner`、`author`、`locale`、`translationGroup`、`authorshipType`、`editorialMaster` 或相关人物。
- 不写 `publicationStatus`、`curationStatus`、`workflowStatus`、`publishedAt`、Payload `_status`；不改变 Member 的个人公开决定或现有站方选择动作。
- 不写 homepage placement/window、review 状态或通知；这些属于 009。
- 不创建或保存 site-authored Article，不查询 Editorial Master，不扩展 activity；这些属于 010。
- 不开放任意 Person/User/Media/Taxonomy 查询、任意 where/sort、通用 CRUD、批量保存、账户提权/暂停/删除、自动公开或自动事实批准。
- 不新建通用 repository、CRUD 平台、共享 SDK、队列系统、确认协议或审计系统。

## Upgraded contract

- `data_truth`：Payload Articles、Users、Taxonomies、Media、workflow events 和当前 User / connection 是唯一真相；本批无 schema/migration。
- `read_path`：Agent request → 当前 connection/User/role 重检 → 固定 Needs attention 查询或 kind 白名单 → Payload access → 字段投影 → 结构化结果。
- `write_path`：严格 schema → 当前 actor 与 Member-authored Article 锁定 → revision/idempotency 校验 → 引用白名单校验 → 既有 Payload access/hooks/version → Agent event → 写后读回。
- `permission_boundary`：Member discovery 不出现三个新工具且直调失败；Editor / Super Admin 可处理 Member-authored Article 的站方字段，但不能借本工具修改个人内容、身份、公开状态或站方动作；普通 Editor 的 assignee options 与 save 仅限本人/`null`，不得用 `overrideAccess` 展开其他 User，Super Admin 才能查看和指定其他 active Editor / Super Admin。
- `audit_boundary`：记录 actor、connection、tool、request、筛选 kind、Article/object ID、结果和前后 revision；不记录 token、正文、完整 source check/comment、私密媒体 URL 或无关个人数据。
- `recovery`：保存失败不部分写入；stale revision 返回最新 revision；相同 idempotency key 同输入读回既有结果、不同输入冲突；成功写入由 Payload Article version 恢复。
- `independent_review`：未主持实现者做一次终局复审，覆盖合同、Needs attention 等价、工具 schema、权限负例、引用白名单、revision/幂等、审计隔离和 allowed paths；只对合同内 BLOCK 做定向复核。
- `key_invariants`：不认错角色或 Article；owner/author/locale/translation 不变；个人公开与站方选择状态不变；引用对象类型正确；已 curated Article 保存后仍满足既有 curation completeness，否则整次拒绝；并发更新不被覆盖。
- `finding_route`：排期、复核、通知进入 009；站方 Article、Editorial Master、基础对象查询和 activity 进入 010；真实三角色总验收进入 011；其余相邻需求回父级排队。

## 权限与恢复负例

- Member、paused account、revoked/expired connection、disabled client、missing Person 和降权后的旧 token 均不能发现或直调新工具。
- `editorial_attention_list` 对任意 status、assignee ID、where、sort、超限 page/limit 失败；`mine` 只能由当前服务端 User ID 推导。
- reference kind 不在白名单、跨 taxonomy dimension、paused/Member assignee、未批准或私有 media 均不返回也不能通过 save 直调绕过；Editor 查询或保存其他 assignee 失败，Super Admin 仍只获得 active Editor / Super Admin。
- save 对 site-authored、未知字段、受保护字段、空 patch、跨对象引用、非法 URL/date、伪造 comment creator 和超限数组整次失败，不部分写入。
- stale revision 不覆盖新版本；同 key 异输入冲突；超时先以 Article revision 与 Agent event 读回，不盲目重试。
- 保存前后 owner、author、locale、translation group、publication、curation、workflow 与 homepage 字段必须逐项相等；失败审计不得包含正文或内部错误详情。

## Acceptance

- [x] Editor 能从固定 Needs attention 队列分页找到目标，不需要预先知道 Article ID；筛选与网页后台当前语义一致。
- [x] Editor 能取得严格白名单引用，使用 `editorial_article_get` 读取 Body V2 和全部允许站方字段，并以 revision 安全保存后读回。
- [x] 保存覆盖 assignee、format、四类分类、来源、freshness、编辑意见和站方封面；Editor assignee 仅本人/`null`、Super Admin 仅 active editorial roles，受保护字段、引用越权、并发与幂等负例全部失败关闭。
- [x] Member discovery/直调隔离、Editor/Super Admin 正例、审计字段隔离和版本恢复通过；无 schema/migration、无 UI diff、无 009/010 能力。

## Validation

- `npm --prefix apps/web run test:agent`；专用 Local scratch DB 运行 `npm --prefix apps/web run test:agent:live`；复跑目标 `test:editorial`。
- `npm --prefix apps/web run typecheck`、`npm --prefix apps/web run lint`、`npm --prefix apps/web run build`、`npm run governance:check`、`git diff --check`。
- Preview 不在本实现批单独开放；与 Media、007、009、010 一起进入 011 的一次性三角色真实客户端验收。

## Release gates

- 用户已预授权本批本地开发、commit、本地 merge、branch push 与 Preview；`main` push 会自动触发 Production，仍与 Production deploy、真实账户/数据、个人公开状态和外部通知一起保留。

## Writeback

- Local PASS 后更新 feature registry、current-state、父级状态和 implementation reference；一次独立复审 PASS 后 009 才能激活。Production 回读后再归档本 checklist。
- 当前门：008 Local 实现与工作项验证 PASS，证据见 [`AGENT-WORKSPACE-008 Local runtime`](../../reference/implementation/agent-workspace-008-local-runtime-2026-08-16.md)；独立终局复审待执行，009 继续 queued，release gates 不变。
