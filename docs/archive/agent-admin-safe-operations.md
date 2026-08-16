---
doc_contract: DocContractV1
doc_type: checklist
authority: execution
status: completed
scope: agent-admin-safe-operations
last_verified: 2026-08-16
max_lines: 180
change_id: AGENT-WORKSPACE-010
risk_tier: upgraded
validation_profile: work_item
allowed_paths: apps/web/src/agent/**, apps/web/src/cms/article-hooks.ts, apps/web/src/cms/article-publication.ts, apps/web/tests/agent-contracts.ts, apps/web/tests/agent-http.ts, apps/web/tests/agent-routes.ts, apps/web/tests/agent-fixtures.ts, apps/web/tests/agent-schema.ts, apps/web/tests/agent-live.ts, apps/web/tests/editorial-workflow.ts, apps/web/tests/cold-start-translations.ts, docs/roadmap/**, docs/reference/**, docs/current-state.md, docs/product-feature-registry.md
approval_gates: main-push, production-deploy, real-account, real-data, production-public-state, real-external-notification
---

# AGENT-WORKSPACE-010 Super Admin 安全站务

目标：补齐两个 Super Admin 闭环：从符合门槛的中文 Editorial Master 创建、读取和保存 Site Article 工作副本；为既有 `admin_recent_activity` 增加有限筛选与分页。继续复用当前 Article hooks、版本、发布动作、冷启动翻译合同和 workflow events，不建立通用后台接口。

当前状态：Local 实现、工作项验证、一次独立终局/定向复核、011 统一 Preview、012 Production 发布与 phase-release 独立复审均 `PASS`（P0/P1/P2=`0/0/0`），已合入 `main` 并归档，不再扩代码。

父级：[`Agent Workspace Parent Checklist`](../roadmap/agent-workspace-program.md)。009 与 010 均已完成 Local/独立复审、合入 `main`，并通过 011 统一 Preview、012 Production 发布与终审；现已归档。本清单不再授权实现，也不自行执行 Production。

## Scope

- `editorial_reference_options` 增加 Super Admin-only `site_master` kind；只列出 `rightsStatus=cleared` 且 `editorialStatus in [approved, translated, released]` 的完整中文母稿，支持有限搜索、page / limit（最大 50）。
- Taxonomy 与 approved public cover 继续使用 008 已有 reference kinds；010 不另建基础对象目录或第二套查询工具。
- `site_article_master_get` 精确读取一个同门槛母稿的中文 title、summary、Body V2、Agent-facing master fingerprint、purpose/topics 和必要来源元数据；指纹至少覆盖既有 content hash 与规范化 topics，不返回第三方全文、创建者/复核者资料、版本历史或内部翻译备注。
- `site_article_create_draft` 以母稿 ID、读取时 master fingerprint、`en/es`、title、summary、Body V2 和幂等键建立一条私有 Site Article draft。服务端固定机构署名、`author=null`、当前 owner、母稿关系、初始状态与 slug，并从母稿复制 purpose/topics/source notes/freshness。
- 同一母稿的 EN/ES Article 共享服务端 translation group；同一母稿每个 locale 最多一条。创建事务锁定当前 actor 与母稿，复查同组 Article；重复 key 同输入读回，异输入冲突。
- `editorial_article_get` 为 Super Admin 的 Site Article 增加母稿 ID/fingerprint 和完整工作副本；`site_article_save_draft` 以 partial patch、revision、幂等键保存最新 draft，并做写后读回。
- 已公开 Site Article 的保存只建立 pending working copy；既有逐篇 publication prepare/commit 与 `editorial_release_site_article_batch` 仍是唯一 release 路径。只允许最小补齐该路径对 pending Site draft 的识别、发布与读回，不改变确认、权限或批量上限。
- `admin_recent_activity` 保持空输入兼容（默认 page 1 / limit 20），增加可选 page / limit（最大 50）、首屏生成且后续页复用的 `asOf`，以及 `axis / articleId / notificationKind / notificationStatus` 白名单筛选；排序固定为 `occurredAt desc, id desc`，输出字段保持 004 的最小投影。

## 最小工具合同

| 工具 | 最小输入 | 结果与边界 |
|---|---|---|
| `editorial_reference_options` | `kind=site_master`；可选 query、page、limit | 仅 Super Admin 得到 ID、contentKey、中文标题、状态、master fingerprint 与分页；Editor 直调该 kind 失败 |
| `site_article_master_get` | master ID | 返回建立译稿所需的单个合格中文母稿与 Body V2；只读并审计 |
| `site_article_create_draft` | master ID/fingerprint、locale、title、summary、Body V2、idempotency key | 创建或幂等读回一个私有 draft；返回 Article ID、slug、translation pair、revision 与 working-copy 摘要；重放仍复核当前指纹 |
| `editorial_article_get` | Site Article ID；Body V2 | Super Admin 得到完整工作副本、母稿绑定、当前 live/draft 影响和 revision；不改变状态 |
| `site_article_save_draft` | Article ID、master fingerprint、revision、idempotency key、至少一个白名单字段 | 保存 latest draft，返回新 revision、working copy 与 `publicEffect`；幂等重放仍复核当前指纹，既有 live 内容不随保存改变 |
| `admin_recent_activity` | 可选 page、limit、asOf 和四项白名单筛选 | 空输入仍返回最新 20 条；后续页必须带首屏 asOf；不接受任意 where/sort/export |

## Site Article 可编辑字段

| 字段 | 输入规则 |
|---|---|
| `title / summary / body` | title 非空；Body 只接受现有 V2 节点、approved public media 与既有 embed 白名单 |
| `format` | `guide / reporting / analysis / first_person / update` 或 `null` |
| `purposes / topics / geographies / situations` | 各维度现有 taxonomy ID 数组；整体替换、去重并拒绝跨维度/不存在 ID |
| `sourceNotes / freshnessDate` | 沿用 008 的数量、URL、日期和字符串限制；允许在母稿基线之上受控修订 |
| `coverImage` | approved public Media ID 或 `null`；不挂载 Member 私有媒体 |
| `seo` | title 最多 70 字符、description 最多 180 字符；不开放独立 share image 写入 |

`authorshipType / author / owner / editorialMaster / locale / translationGroup / slug` 在创建后不可由本工具改变。首页排期、publication、curation、workflow 和 `_status` 也不属于普通保存；live 状态保持不变，pending draft 可沿用既有 `needs_recheck` 语义。公开、撤回和站方精选继续使用既有 prepare/commit 与 `editorial_release_site_article_batch`。

## No-go

- 不创建、修改、批准或发布 Editorial Master；不自动翻译，不保存第三方抓取全文，不绕过中文母稿完整性、审批、权利或 content-hash 门槛。
- 不创建/修改 Person，不设置任意 author/owner，不把 Site Article 伪装成 Member Article，也不修改 Member Article 的 title/body 或身份字段。
- 不新增或替代发布、策展、排期、复核、通知或批量写工具；除让既有 release 路径正确消费 pending Site working copy 外，不扩 009 动作或站方批次发布语义。
- 不开放任意 User、Person、Media、Taxonomy、Place、Editorial Master、Article、WorkflowEvent 或 AgentEvent CRUD；不接受 collection、where、sort、field、SQL、GraphQL、导出或无边界搜索。
- 不开放邀请、提权、降权、暂停/恢复、删除、媒体批准/删除、审计修改、通知重试、migration、部署、DNS、密钥或生产动作。
- 不新增 schema/migration/index/enum、Payload collection、通用 repository/CRUD SDK、工作流平台、后台 UI、依赖、环境变量、cron、queue 或 worker。

## Upgraded contract

- `data_truth`：Payload Editorial Masters、Article live/draft versions、Taxonomies、Media、WorkflowEvents、AgentEvents 和当前 User/Person/connection 是唯一真相；本批无 schema/migration。
- `read_path`：Agent request → 当前 connection/User/Person/client/Super Admin 重检 → 固定母稿门槛或 activity 白名单 → depth-0 关系读取 → 显式字段投影 → 结构化结果。
- `write_path`：strict schema → actor/母稿或 Article 行锁 → 当前角色、母稿 hash/rights/status、Article identity、revision/idempotency 与引用重检 → 既有 Payload hooks/versions → Agent event → working-copy 读回。
- `permission_boundary`：只有当前 active Super Admin 发现三个新工具并使用 `site_master` kind/activity 扩展；Editor/Member、paused、missing Person、降权旧 token、revoked connection 和 disabled client 均失败关闭。既有 Editor 读取能力不得因 010 获得中文母稿内容或 Site Article 写权。
- `audit_boundary`：记录 actor、connection、tool、request、result、Article ID 与前后 revision；母稿读取沿用 account-scoped read audit，不把中文正文、source check、content hash、筛选结果、邮件、token、notification key/error 或内部错误写入 Agent event。
- `recovery`：创建/保存只产生私有 draft/version；失败整次回滚。超时先按幂等键与 revision 读回；成功保存由 Article version 恢复，已公开页面仅经既有发布动作更新。Activity 只读，无领域恢复动作。
- `independent_review`：未主持实现者做一次终局复审，覆盖母稿门槛、身份/双语唯一性、live/draft 隔离、权限、revision/幂等、activity 隐私/分页和 allowed paths；只对合同内 BLOCK 定向复核。
- `key_invariants`：母稿始终 rights-cleared 且完整批准；一个母稿/locale 一条 Site Article、双语同组；机构署名且无 Person；普通保存不公开；activity 仍是 Article workflow 的最小只读投影。
- `finding_route`：三角色真实客户端、Preview fixture/cleanup、统一发布与 Production 回读进入 011；账户生命周期、任意人物/基础对象写入、通用审计或运营平台另建需求，不扩 010。

## 权限、数据与恢复负例

- Editor/Member 不发现新工具；猜测工具名、`site_master` kind 或直接 service 调用失败。Super Admin 降权、暂停、Person 断联、connection/client 撤销后立即失败。
- candidate/in_review、pending/restricted、缺 title/summary/body/purpose/source、fingerprint stale 或调用间 content hash/topics 被改写的母稿不能创建/保存 Site Article，成功写的幂等重放也必须失败关闭。
- 重复 master+locale、伪造 translation group/owner/author/master/locale/slug、site 工具指向 Member Article、非法 Body/media/taxonomy/source/SEO、空 patch、stale revision 均整次失败。
- 两个 locale 必须绑定同一 master/group；并发创建最多一条同 master+locale。相同 key 异输入冲突；超时重放不产生第二 Article。
- 保存 published Site Article 只形成 pending draft；live/public path 内容及 live publication/curation/homepage/workflow 状态逐项不变。母稿降级或 rights 变化后继续失败关闭；只有既有 release 动作能推广 pending copy。
- activity 拒绝未知 filter、任意 where/sort、future/非法 asOf、page<1、limit>50，以及 page>1 缺 asOf；空输入保持 004 兼容，跨页复用同一 asOf。输出与审计不得含 email、recipient/key/error、正文/source/owner、账户状态、connection 或 confirmation。
- activity 调用前后 WorkflowEvent、Article、User、Person 和 notification 不变，只新增既有最小 read audit；关系缺失返回有限 `null`，不扩大读取。

## Acceptance

- [x] Super Admin 能发现合格中文母稿、读取 Body V2，以当前 master fingerprint 创建一条私有 EN/ES Site Article draft，并用 `editorial_article_get` 取得同一指纹与可继续保存的 working copy。
- [x] Site save 覆盖 copy、format、四类 taxonomy、来源、freshness、cover 与 SEO；revision、幂等、事务、版本恢复、pending draft/live 隔离和写后读回通过。
- [x] 同母稿 EN/ES 共享 translation group 且每 locale 唯一；母稿状态/权利/hash 变化、身份伪造、跨对象、并发和媒体/引用越权全部失败关闭。
- [x] `admin_recent_activity` 支持有限筛选、最大 50 的分页与 asOf 复用，继续保持 004 权限、最小字段、只读和审计隐私。
- [x] 既有 Member/Editor 工具、冷启动导入、Article hooks、逐篇发布与 009 行为无回归；站方批次发布能继续处理新 draft，并按既有门槛推广已公开 Article 的 pending working copy。无 schema/migration、通用 CRUD、账户特权或 011 动作。

## Validation

- `npm --prefix apps/web run test:agent`；专用 Local scratch DB 运行 `npm --prefix apps/web run test:agent:live`；目标 `npm --prefix apps/web run test:editorial` 与 `test:cold-start-translations`。
- `npm --prefix apps/web run typecheck`、`npm --prefix apps/web run lint`、`npm --prefix apps/web run build`、`npm run governance:check`、`git diff --check`。
- Preview 不在本实现批单独重复；与 Media、007–009 一起进入 011 的一次性虚构三角色真实客户端验收。

## Release gates

- 用户已预授权 010 本地开发、commit、本地 merge、branch push 与 Preview；本次只冻结合同。`main` push 会自动触发 Production，仍与 Production deploy、真实账户/数据、公开状态和外部通知一起保留。

## Writeback

- Local、一次独立终局/定向复核与 011 统一 Preview 均 PASS（P0/P1/P2=`0/0/0`），feature registry、current、父级与 evidence 已写回。
- 当前门：010 Local/独立复审、011 统一 Preview、012 Production 33-tool 部署/discovery 与 phase-release 独立复审均 PASS；Production 未创建真实 Site Article 或执行站务写入。证据见 [`Production`](../reference/implementation/agent-workspace-012-production-runtime-2026-08-16.md)；本清单归档。
