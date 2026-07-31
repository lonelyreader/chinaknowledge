---
doc_contract: DocContractV1
doc_type: checklist
authority: execution
status: active
scope: agent-workspace-member-publication
last_verified: 2026-07-31
max_lines: 300
change_id: AGENT-WORKSPACE-002
risk_tier: upgraded
validation_profile: work_item
allowed_paths: apps/web/src/agent/**, apps/web/src/cms/article-endpoints.ts, apps/web/src/cms/article-hooks.ts, apps/web/src/cms/article-publication.ts, apps/web/src/cms/components/AgentAccess.tsx, apps/web/src/cms/media-policy.ts, apps/web/src/cms/workflow.ts, apps/web/tests/**, docs/current-state.md, docs/product-feature-registry.md, docs/roadmap/README.md, docs/roadmap/agent-workspace-program.md, docs/roadmap/checklists/README.md, docs/roadmap/checklists/agent-workspace-member-publication.md, docs/reference/implementation/**, docs/archive/README.md, docs/archive/agent-workspace-member-publication.md
approval_gates: checklist-commit, product-code, public-state-write, database-schema, migration, preview-deploy, public-mcp, real-account, real-data, production-deploy, merge, push
---

# Agent Workspace Member Publication

目标：让后台成员在自己的 Agent 中安全公开、更新公开版本、撤回和重新公开本人 Article。每次公共状态动作都必须经过 `prepare → 用户确认 → commit → readback`，不能由一次普通工具调用直接改变公开页面。

本切片只证明 Member Article publication 的确认 primitive；不扩展 Editor、Super Admin、Person、媒体、翻译或 Production 能力。

## Scope

- 新增 `article_prepare_publication`：只读取本人 Article、当前 revision 和目标状态，返回短摘要、影响、公共路径、短期一次性 confirmation reference 与 audit ID；不改变 Article。
- 新增 `article_commit_publication`：只接受同一连接刚刚 prepare 的 confirmation reference、对应 revision 和新的 idempotency key；执行后读回最终状态、revision、公共路径与 audit ID。
- 输入目标只允许 `published` 或 `withdrawn`。服务端根据当前状态解释为首次公开、更新公开版本、撤回或重新公开，不让 Agent 构造任意内部状态。
- 复用既有 Article owner、Person、语言、媒体、版本、publication/curation 状态机和 Payload hooks；网页后台与 Agent 不能形成两套发布规则。
- 把网页 transition endpoint 与 Agent 需要的公共发布操作收敛到同一领域 helper；两条入口仍分别负责 HTTP/Agent 输入和身份上下文。
- 使用既有 Agent event 与事务能力实现 confirmation reservation、一次消费、commit 幂等、冲突和审计；默认不新增 schema、migration 或依赖。
- 用 Local `.test` fixture 完成自动权限矩阵，再以 Cursor + 受保护 Preview 完成一次真实人工确认闭环；Preview 外部动作仍单独批准。

## Tool contract

### `article_prepare_publication`

输入：

- `id`：本人 Article ID。
- `targetStatus`：`published | withdrawn`。
- `revision`：调用前取得的当前 Agent revision。

返回：

- Article ID、标题、locale、当前与目标 publication status。
- 动作名称：`publish | update_public | withdraw | republish`，由服务器推导。
- 将进入公共页面的稳定路径；撤回时明确该路径将不再匿名可见。
- 对 curation 的可预见影响，例如 `curated → needs_recheck` 或撤回后的 `removed`。
- `confirmationRef`、`expiresAt`、prepared revision 与 audit ID。

Prepare 必须校验 owner、Person、账户状态、revision、允许的 transition 和公开完整性，但不得修改 Article、Payload version、publication/curation status 或公共页面。它可以写最小 pending audit/confirmation reservation。

### `article_commit_publication`

输入：

- `confirmationRef`：未过期、未消费、属于当前 user/person/connection 的 reference。
- `revision`：必须与 prepare 绑定的 revision 一致。
- `idempotencyKey`：16–128 字符的新 key。

Commit 在同一事务中锁定 confirmation 与 Article，重新检查账户、Person、连接、owner、revision、transition 和完整性，再调用共享领域 helper。成功后消费 confirmation 并读回 Article；相同 key 和相同输入重放返回同一结果，不产生第二次状态变化。

## No-go

- 不允许 Agent 直接设置 `_status`、`curationStatus`、`publishedAt`、owner、author、slug、locale、translation group 或其他内部字段。
- 不处理 Person 公开、媒体上传/批准、翻译创建、Editor 策展、排期、通知、成员邀请或账户状态。
- Editor 或 Super Admin 即使有站方角色，也只能通过本工具处理自己拥有的 Article；不能替其他 Member 公开或撤回。
- 不提供 `confirmed: true` 一步式绕过，不复用浏览器 Cookie，不接受客户端生成的角色、影响摘要或公共 URL。
- 不开发通用 workflow transition、任意 Payload CRUD、REST/GraphQL、SQL、CLI fallback、批量发布或无人值守动作。
- 不新增依赖、schema 或 migration；如果既有 Agent event 无法证明一次消费和幂等，停止并单独申请 schema/migration 门禁。
- 不部署 Production，不接入真实成员或真实内容，不公开 Preview 测试内容。

## Upgraded boundaries

- `data_truth`：Local 与获批 Preview 只使用 `.test` User、Person、Article 和 connection；Production 不读取、不迁移、不写入。
- `read_path`：只读取当前 owner 的 Article、最新可发布 draft version 和最小公开状态；跨 owner 统一 `NOT_FOUND` 或 `FORBIDDEN`，不泄漏对象存在性。
- `write_path`：只允许既有 publication transition 的本人 Article 写入；公共正文推广、撤回和 curation 副作用继续由同一领域 helper 与 hooks 决定。
- `permission_boundary`：每次 prepare 和 commit 都重新校验账户、Person、connection、owner 和服务端状态；capability、role label、confirmation reference 和 Agent 文字都不单独授予权限。
- `confirmation_boundary`：reference 最长 5 分钟，绑定 user/person/connection/article/target/revision，服务端留有不可逆摘要并一次消费；过期、换连接、换用户、换对象、换 revision 或已消费均失败关闭。
- `concurrency`：commit 对 Article 与 confirmation 加事务锁；prepare 后任何 Article 变化都返回 `REVISION_CONFLICT`，不自动重新 prepare 或覆盖。
- `idempotency`：commit key 按 connection + tool 作用域保留；同 key 不同输入返回 `IDEMPOTENCY_CONFLICT`，成功响应丢失后可安全读回。
- `audit_boundary`：记录 actor、connection、tool、Article、prepare/commit request、目标、结果、前后 revision 和时间；不记录 confirmation 明文、token、正文、Cookie 或 Agent 对话。
- `recovery`：无 migration；关闭两项新工具即可停止 Agent publication，网页后台仍可工作。失败写入使用事务回滚，Article versions 与 workflow events保留现有恢复能力。
- `independent_review`：未主持实现者分别复核 confirmation/replay 安全和 Member/跨 Member/public readback；结论只能为 `PASS` 或 `BLOCK`。

## Work

### Gate 0 — Intake

- [x] 001 已归档，transition review 明确 002 为 `keep + narrow` 的下一候选。
- [x] 用户于 2026-07-31 要求“按结论执行”，批准建立本 active checklist、提交 intake 基线，并在 Local 虚构 fixture 上实现公共状态写路径。
- [ ] 本 checklist 进入 HEAD 后才开始产品代码；Preview、真实账户/数据和 Production 不由该批准推导。

### Gate 1 — Shared publication contract

- [ ] 固定 action 推导、prepare 摘要、target status、公共路径、curation 影响和错误码。
- [ ] 提取网页 endpoint 与 Agent 共用的最小 publication helper，不改变既有网页确认行为和权限。
- [ ] 把媒体发布规则拆成 prepare 可调用的纯检查与 commit 才执行的使用时间写入；两者必须共享同一 owner/approval 判断。
- [ ] 证明现有 Agent event 足以保存 pending confirmation、不可逆 digest、一次消费、前后 revision 和 commit 幂等；否则停止申请 schema 门禁。

### Gate 2 — Agent tools

- [ ] 注册两项工具、Zod 输入、风险 annotations 与自足说明；commit 标记为 destructive，prepare 不标记为写入 Article。
- [ ] 为后台 Recent activity 增加两项短标签，不显示工具名、confirmation 或内部协议术语。
- [ ] 实现 5 分钟 confirmation、actor/connection/object/action/revision 绑定与原子消费。
- [ ] 实现 publish、update public、withdraw、republish 四条服务器推导路径和最终读回。
- [ ] capability 列表只对有 Person 的当前后台账户增加两项工具；实际调用仍逐次校验。

### Gate 3 — Local verification

- [ ] 覆盖 Member owner 正例与 anonymous、paused、missing Person、other Member、Editor/Super Admin 非 owner 负例。
- [ ] 覆盖过期、已消费、跨连接、跨用户、篡改、错误 target、stale revision、并发 commit、重复 key 和同 key 不同输入。
- [ ] 覆盖首次公开、公开更新、撤回、重新公开、curated 后更新进入 Needs recheck、撤回进入 Removed。
- [ ] 每个成功动作读回 Article、latest version、workflow event、agent event 与匿名公共路由；撤回后匿名路由不可见。
- [ ] 既有网页 `POST /api/articles/:id/transition` 和完整 editorial workflow 无回归。

### Gate 4 — Preview real client

- [ ] 单独取得 `preview-deploy` 与 `public-mcp` 批准；无 schema 时不运行 migration。
- [ ] 用虚构 `.test` Member 在 Cursor 真实执行 prepare，停下等待人工确认，再 commit 并匿名读回公共页面。
- [ ] 验证撤回和 confirmation 过期/重放负例，随后删除全部测试记录、恢复 Preview SSO 并读回。

### Gate 5 — Review and closeout

- [ ] 完成 confirmation/replay 安全与权限/公共读回独立复审，修复到 `P0/P1/P2 = 0/0/0`。
- [ ] 更新 feature registry、current、implementation evidence 和父级清单；关闭后移入 archive。
- [ ] 根据 002 证据重新判断 003 的确认 primitive、工具范围和进入条件；不自动启动 003。

## Acceptance

- Agent 不能通过一次调用或伪造 `confirmed` 改变公开状态；prepare 后必须等待用户确认，commit 必须使用服务器 reference。
- Prepare 不改变 Article、version、publication/curation status 或匿名页面。
- Commit 只处理当前 owner 的 Article；同一通用配置和更高站方角色都不能扩大对象范围。
- 公开/重新公开推广最新允许 draft，更新公开版本保留 canonical URL，撤回后匿名不可见。
- Prepare 后 Article、账户、Person、连接、权限或状态发生变化时，commit 安全失败。
- Confirmation 只用一次；重复 commit 依靠 idempotency 读回，不能重复写 workflow event 或版本。
- Agent audit 与 workflow event 能串起 prepare、用户确认后的 commit、最终状态和失败原因，不保存敏感值或正文。
- 网页后台 publication、Editor curation、公共路由、版本、通知和现有 001 工具无回归。

## Validation

- `npm --prefix apps/web run test:agent`
- `npm --prefix apps/web run test:agent:live`
- `npm --prefix apps/web run test:editorial`
- `npm --prefix apps/web run typecheck`
- `npm --prefix apps/web run lint`
- `npm --prefix apps/web run build`
- Cursor Local/Preview prepare → 人工确认 → commit → public readback 与撤回负例。
- `npm run feature-registry:check`
- `npm run governance:check`
- `git diff --check`

## Writeback

- 当前执行：本 checklist、`docs/roadmap/README.md`、`docs/roadmap/checklists/README.md` 与父级清单。
- 当前能力：实现完成后更新 `docs/product-feature-registry.md` 与 `docs/current-state.md`。
- 运行、安全、权限和复审证据：`docs/reference/implementation/agent-workspace-002-*.md`。
- 完成历史：`docs/archive/agent-workspace-member-publication.md`。

## Current gate

当前只批准 intake 基线提交与 Local `.test` fixture 实现。没有新增依赖、schema 或 migration 计划；Preview deploy、公开 MCP 临时验收、真实账户、真实数据、Production、merge 和 push 均未执行或未获本 checklist 推导授权。
