---
doc_contract: DocContractV1
doc_type: checklist
authority: execution
status: active
scope: agent-member-completion
last_verified: 2026-08-16
max_lines: 180
change_id: AGENT-WORKSPACE-007
risk_tier: upgraded
validation_profile: work_item
allowed_paths: apps/web/src/agent/**, apps/web/src/cms/article-endpoints.ts, apps/web/src/cms/article-translation.ts, apps/web/src/cms/people-endpoints.ts, apps/web/src/cms/profile-publication.ts, apps/web/src/cms/components/AgentAccess.tsx, apps/web/tests/agent-contracts.ts, apps/web/tests/agent-http.ts, apps/web/tests/agent-routes.ts, apps/web/tests/agent-fixtures.ts, apps/web/tests/agent-schema.ts, apps/web/tests/agent-live.ts, apps/web/tests/editorial-workflow.ts, docs/roadmap/**, docs/reference/**, docs/current-state.md, docs/product-feature-registry.md
approval_gates: main-push, production-deploy, real-account, real-data, public-state
---

# AGENT-WORKSPACE-007 Member 完整闭环

目标：在现有 Agent Gateway 上补齐 Member 的资料、外链、媒体发现、双语文章和对象发现闭环；吸收原 queued `INFRA-AGENT-PROFILE-001`，只保留本 checklist，不建立第二条 Profile 实现线。

父级：[`Agent Workspace Parent Checklist`](../agent-workspace-program.md)。Person 字段前置由 `INFRA-PERSON-PAGE-001` 交付；Agent 正文与媒体写入前置已由 `INFRA-AGENT-MEDIA-001` 合入本地 `main`。

## Scope

- Person：`my_profile_get`、`my_profile_save` 和 `my_links_save`；`my_profile_get` 同时返回登录态 Preview path。Profile 工具不接受 Person ID，只处理当前连接绑定的 Person。
- Person 公开：`my_profile_prepare_publication` / `my_profile_commit_publication` 只改变 `draft` / `public` 可见状态，复用现有 Person hook、版本和公开完整性检查。
- Media：`my_media_list` 分页读取本人上传的最小媒体元数据；不提供删除、审批或跨成员私有媒体读取。
- 双语关系：`article_create_translation_draft` 从本人 Article 创建另一 locale 的私有 draft；目标 locale、owner、author 与 translation group 由服务器决定，不做自动翻译。
- 发现：`account_context` 增加 Profile 状态、完整度和公开路径；`my_articles_list` 增加有限分页及 locale / publication status 筛选，并返回翻译配对状态。
- 当前角色：MCP tool discovery、`account_context` 与 `capabilities_list` 使用每次请求实时读到的服务端 User 角色；不再以 token 中的旧 `authInfo.extra.role` 决定 Editor / Super Admin 工具注册。
- 普通资料与外链保存沿用网页 My profile 的直接保存语义：若 Person 已公开，成功保存会立即影响公开页；结果必须明确返回 `publicEffect`、新 revision 和可恢复版本。

## 最小工具合同

| 工具 | 最小输入 | 结果与边界 |
|---|---|---|
| `my_profile_get` | `{}` | 本人可编辑资料、外链、状态、公开路径、Preview path、完整度、`updatedAt`、revision |
| `my_profile_save` | revision、idempotency key、至少一个白名单字段 | 姓名、汉字名、头像关系、语言、Topic、英西 identity / city / introduction / quote / can-help；写后读回 |
| `my_links_save` | revision、idempotency key、完整有序 links | 0–8 条；类型白名单；普通链接只用 http/https，Email 只用 mailto |
| `my_profile_prepare_publication` | target `draft` / `public`、revision | 返回精确影响、公开完整性问题和短期确认引用；不写数据 |
| `my_profile_commit_publication` | confirmation ref、revision、idempotency key | 重检当前连接、角色、Person、版本和公开条件后改变可见状态并读回 |
| `my_media_list` | page、limit（最大 50） | 只返回本人上传媒体的 ID、alt、可访问 URL、状态和更新时间 |
| `article_create_translation_draft` | source Article ID、idempotency key | 只从本人 Article 建立另一 locale draft；已存在时返回既有配对，不重复创建 |
| `account_context` | `{}` | 增加 Profile 状态、完整度和公开路径；字段最小化 |
| `my_articles_list` | page、limit（最大 50）、可选 locale / publication status | 固定更新时间倒序；返回页信息与翻译配对状态，不接受任意 where / sort |

## No-go

- 不改 People、Articles、Media、AgentEvents collection schema，不生成 migration；若确需 schema，立即停下重开 schema 门禁。
- 不改 Person 页面、My profile 网页表单、文章编辑器或公开渲染，不把 `INFRA-PERSON-PAGE-001` UI 工作带入本批。
- 不建立 Person 草稿平台，不扩展或接入旧 `PersonRevisions` 工作流；不为公开资料保存伪造第二份真相。
- 不允许 `my_profile_save` 写 `user`、`slug`、`profileStatus`、发布时间、Spotlight、`editorialBio`、`verdict` 或其他站方字段。
- 不提供任意 Person ID、通用 CRUD、媒体删除、媒体审批、账户邀请/角色/暂停、Editor 工作台或 Super Admin 站务能力。
- 不自动翻译、不覆盖既有另一语言 Article、不改变原 Article 的 owner、author、locale、translation group 或公开状态。
- 不新增 OAuth scope、客户端适配器、CLI fallback、共享 SDK、数据库枚举或新的审计系统。

## Upgraded contract

- `data_truth`：People、Articles、Media 与当前 User / Person / connection 是唯一服务端真相；Person Page migration 属前置项，本批默认无 schema/migration。
- `read_path`：Agent request → 当前连接/User/Person/客户端重检 → Payload access → 字段白名单 → 结构化结果；discovery 使用同一份当前角色事实。
- `write_path`：Agent schema → 当前 actor 锁定 → Person/Article 行锁 → revision / idempotency 校验 → 既有 Payload access、hooks 与版本 → Agent event → 写后读回。
- `permission_boundary`：所有 Profile 工具固定本人 Person；媒体只读本人上传；translation source 必须本人拥有；Editor/Super Admin 也不能借自身角色通过这些 Member 工具修改他人对象。
- `audit_boundary`：Profile 写入沿用 `AgentEvents.objectType=account` 并记录 Person ID；Article 写入用 `article`；记录 actor、connection、tool、request、结果和前后 revision，不记录 token、完整正文或无关个人数据。
- `recovery`：普通写入以 Person/Article 版本和旧 revision 恢复；确认引用过期或重放安全失败；同 idempotency key 同输入读回既有结果、不同输入冲突；工具回退不删除已保存业务数据。
- `independent_review`：未主持实现者只做一次终局复审，覆盖本合同、权限负例、角色 discovery、幂等/冲突、公开读回和 allowed paths。若出现合同内 `BLOCK`，只复核对应最小修正，不重新发起无边界全量审查。
- `key_invariants`：服务端当前角色权威于 token 旧声明；不认错 Person；不覆盖并发更新；不泄露他人私有资料或媒体；translation 不改原文与公开状态；Profile 可见状态只经 prepare/commit 改变；公开 Person 的普通资料保存必须如实标记即时公开影响。
- `finding_route`：Editor 队列与普通保存进入 `AGENT-WORKSPACE-008`；排期/复核/通知进入 `009`；站务与审计增强进入 `010`；真实客户端总验收进入 `011`；其他相邻需求回父级排队，不扩本批。

## 权限与恢复负例

- paused account、revoked/expired connection、disabled client、scope 移除、Person 缺失或重新绑定后，下一次 discovery/call 失败关闭。
- 旧 token 声明为 Super Admin、服务端已降为 Member 时，discovery 不出现 Editor/Admin 工具且直调失败；服务端升级后的 discovery 也以当前角色为准。
- Profile 输入不能指定他人 Person；未知字段、受保护字段、他人未公开头像、非 Topic taxonomy、非法协议、超过 8 条外链全部拒绝且不部分写入。
- stale revision 不覆盖新版本；幂等 key 同输入安全重放、不同输入冲突；超时先读回状态，不盲目重试。
- Profile 公开 prepare 后 Person、角色、连接、revision、头像或必填资料变化时 commit 失败；有公开 Article 时转私有继续沿用现有拒绝规则。
- translation 对跨 owner、site Article、目标语言已存在、重复请求和并发唯一键竞争均不产生第二条 Article；新 draft 保持私有。

## Acceptance

- [x] Member 可经 Agent 读取并保存本人资料与 X 等外链，从 `my_profile_get` 获得 Preview path，并以 prepare/commit 公开或转私有；每次结果含 revision、读回和必要公开影响。
- [x] Member 可分页查本人媒体与文章、按受限条件筛选，并从本人 Article 建立唯一的另一语言 draft。
- [x] 当前角色 discovery 修复生效；Member、Editor、Super Admin 的工具列表和直调权限都由当前服务端角色证明。
- [x] 上述权限、冲突、幂等、确认过期、公开完整性和恢复负例已在 Local 通过；无新增 schema/migration、无 Person UI diff。

## Validation

- `npm --prefix apps/web run test:agent`；专用 Local scratch DB 运行 `npm --prefix apps/web run test:agent:live`；translation 共用逻辑回归运行目标 editorial workflow 测试。
- lint、typecheck、build、`npm run governance:check`、`git diff --check`。
- Preview 使用虚构 Member 完成 OAuth、当前角色 discovery、Profile X 外链、媒体/文章分页、translation draft、Profile prepare/commit 与撤销连接回读。
- 一次独立复审 `PASS` 后进入 Production 发布门；相邻 finding 只路由，不触发反复全量复审。

## Release gates

- 用户已预授权本批本地开发、commit、本地 merge、branch push 与 Preview 验收；各动作仍须在当前 diff 和验证通过后执行并记录。
- `main` push 会自动触发 Production，和 Production deploy、Production migration、真实账号/数据、真实 Person 可见状态及任何对外公开动作同属发布门；发布前单独确认，并准备回滚与发布后 capability/readback 证据。
- Person Page migration 必须先在目标环境完成并回读；本批不得自行把其 schema/migration 并入 Agent diff。

## Writeback

- 实现完成时更新 feature registry、current-state、父级 checklist 与 reference 证据；Production 回读后将本 checklist 移入 archive。
- 原 `INFRA-AGENT-PROFILE-001` 仅作为被吸收的历史编号，不创建文件、不保留 queued 实现项。

## Current gate

- [x] 用户批准把 Profile 与 Member 余项收敛为一个 007 checklist，并预授权本地开发、commit、本地 merge、branch push 与 Preview；`main` push 未授权（2026-08-16）。
- [x] `INFRA-AGENT-MEDIA-001` 已合入本地 `main`（`f100908`）；其 Preview/Production release 仍由原 checklist 收尾。
- [x] `INFRA-PERSON-PAGE-001` 已合入本地 `main`（`4591719`）；其 Preview/Production migration 分别留在对应 release gate。
- [x] 实现与 Local 工作项验证完成；证据见 [`AGENT-WORKSPACE-007 Local runtime`](../../reference/implementation/agent-workspace-007-local-runtime-2026-08-16.md)。
- [x] 独立复审的两项 `BLOCK` 已最小修复并定向复核 `PASS`，最终 P0/P1/P2=`0/0/0`（2026-08-16）。
- [x] 011 统一 Preview 已完成 18-tool discovery、Profile/X、Article/cover/publication 与权限负例；`main` push 与 Production 发布未授权。
