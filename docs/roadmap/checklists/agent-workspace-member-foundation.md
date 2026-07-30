---
doc_contract: DocContractV1
doc_type: checklist
authority: execution
status: active
scope: agent-workspace-member-foundation
last_verified: 2026-07-31
max_lines: 300
change_id: AGENT-WORKSPACE-001
risk_tier: upgraded
validation_profile: work_item
allowed_paths: .github/workflows/**, package.json, package-lock.json, apps/web/package.json, apps/web/package-lock.json, apps/web/src/agent/**, apps/web/src/app/(payload)/**, apps/web/src/app/(frontend)/api/agent/**, apps/web/src/cms/**, apps/web/src/collections/AgentOAuthClients.ts, apps/web/src/collections/AgentConnections.ts, apps/web/src/collections/AgentEvents.ts, apps/web/src/migrations/**, apps/web/src/payload-types.ts, apps/web/src/payload.config.ts, apps/web/tests/**, docs/README.md, docs/START-HERE.md, docs/agent-workspace-requirements.md, docs/product-brief.md, docs/product-feature-registry.md, docs/current-state.md, docs/roadmap/README.md, docs/roadmap/agent-workspace-program.md, docs/roadmap/checklists/README.md, docs/roadmap/checklists/agent-workspace-member-foundation.md, docs/reference/README.md, docs/reference/implementation/**, docs/decisions/**, docs/archive/README.md, docs/archive/agent-workspace-member-foundation.md
approval_gates: checklist-commit, auth-design, product-code, dependency-install, database-schema, migration, preview-deploy, real-account, real-data, production-deploy, public-mcp, merge, push
---

# Agent Workspace Member Foundation

目标：交付第一个可由真实 Agent 客户端验证的 China, in Fact Member 工作闭环。虚构 Member 在 Local/Preview 完成 OAuth 连接后，可以查询自己的文章、创建和保存带 revision 的草稿、获得登录态 Preview，并在撤销连接后失去访问。

本 checklist 只建立远程 MCP、身份连接和 Member read/draft 基础，不一次完成 Editor、Super Admin 或全部 Agent 自动化。

## Scope

- 在现有 Next.js/Payload 部署内建立远程 Streamable HTTP MCP Gateway。
- 以当前 Payload User 登录为授权身份，完成 OAuth 2.1 Authorization Code + PKCE、短期 access token、refresh rotation 和单连接撤销。
- 建立服务器端 capability read model；它只描述当前能力，实际调用仍逐次执行权限和对象所有权校验。
- 提供 `account_context`、`capabilities_list`、`my_articles_list`、`article_get_working_copy`、`article_create_draft`、`article_save_draft` 和 `article_preview`。
- 文章工作副本使用受限 Markdown/结构化正文合同，并携带 Article ID、locale 和 revision。
- 在 Payload Admin 提供最小 `Agent access`：选择客户端、连接/下载、已连接项、撤销和最近活动。
- 建立 Cursor、TRAE、Tencent WorkBuddy 三个首要适配器；Codex、Claude、Gemini 提供配置 fixture 和协议验证。
- 为连接、草稿写入、冲突、撤销和失败建立最小审计与读回。

## No-go

- 不开放个人公开、撤回、重新公开、Editor 策展、作者通知、邀请、角色修改、暂停或恢复。
- 不提供任意 REST、GraphQL、Payload Local API、collection CRUD、SQL 或数据库连接。
- 不处理 Production migration、Production 部署、真实账户、真实内容或真实邮件。
- 不修改 Astria，不实现 Astria SSO，不建立跨项目共享 SDK。
- 不实现 CLI fallback、定时自动化、批处理或无人值守写入。
- 不新增独立后台、独立数据库或默认拆分第二个部署服务；只有技术 spike 证明现有部署不可承载时才停下重新决策。
- 不建设大陆网络封锁适配、境内中继、镜像或专项网络验收。
- 不在 UI 中加入 MCP、OAuth、token、schema、权限表或安装教程式长文案。

## Upgraded Boundaries

- `data_truth`：Local 和 Preview 只使用 `.test` 虚构账户、Person、Article 和连接；Production 不读取、不迁移、不写入。
- `read_path`：Gateway 只返回当前用户、当前能力、本人 Article 和本人 Preview；不返回其他 Member 的草稿、版本、媒体或私有字段。
- `write_path`：首切片只允许创建本人 Article draft、更新本人 draft 和管理本人的 Agent connection；所有写入通过领域服务和 `overrideAccess:false` 请求上下文。
- `permission_boundary`：角色、账户状态、Person 关系、Article owner 和字段权限由服务器逐次校验；capability manifest、客户端配置和 token scope 都不是最终授权。
- `identity_boundary`：OAuth token 只绑定 Agent Gateway audience 和本地 User ID；Agent 不接触后台密码、Payload Cookie、数据库凭据或长期 API key。
- `content_boundary`：工作副本正文和外链作为不可信数据处理；不得从文章内容提升工具权限或触发额外调用。
- `concurrency`：保存必须带 revision；版本不一致返回 409 类冲突和最新 revision，不静默覆盖。
- `audit_boundary`：记录 actor、connection、client family、tool、object、request ID、结果、前后 revision 和时间；不记录 token、密码、完整正文或 Agent 对话全文。
- `recovery`：连接可单独撤销；OAuth 与 Agent collection migration 可 rollback/reapply；草稿依赖 Payload versions 恢复；MCP 路由可关闭而不影响 `/admin`。
- `independent_review`：非主持实现者分别复核 OAuth/MCP 安全边界和 Member/跨 Member 权限负例，只能给出 `PASS` 或 `BLOCK`。

## Work

### Gate 0 — 授权基线

- [x] 将需求、roadmap 与本 checklist 提交进 HEAD；提交前不修改代码、配置或 schema。
- [x] 取得 `auth-design` 批准：用户于 2026-07-31 接受 auth design evidence；OAuth provider/library、metadata、PKCE、audience、token TTL、refresh rotation、撤销和客户端注册方案已固定。
- [x] 取得 `product-code` 批准后再开始本地实现；用户于 2026-07-31 要求开始执行 001，新增依赖和 schema 仍使用独立门禁。

### Gate 1 — Contract spike

- [ ] 在 reference 记录 Cursor、TRAE、WorkBuddy、Codex、Claude、Gemini 当前项目配置、Streamable HTTP 和 OAuth 能力，只保留官方证据与版本日期。
- [ ] 用一次性 spike 验证现有 Vercel/Next 路由能承载无状态 Streamable HTTP MCP、OAuth metadata 和 callback；失败时停止，不直接拆服务。
- [x] 固定 `AgentToolResultV1`、错误码、request ID、revision、idempotency key 和 capability response；工具说明前 512 字符自足。
- [x] 固定最小 Markdown/正文映射，证明支持的结构可往返；不支持的 Lexical 节点必须拒绝或无损保留。

### Gate 2 — Identity and connections

- [ ] 实现 protected-resource metadata、authorization-server metadata、authorize、token、refresh 和 revoke。
- [ ] 复用当前 Payload User 登录，建立 Agent connection；暂停账户、连接撤销和角色/Person 关系变化必须在后续调用中生效。
- [ ] 建立连接与事件的最小 schema、migration 和 generated types；token 只以不可逆摘要或合适的加密材料保存。
- [ ] `Agent access` 只展示短标签、连接状态、客户端、最近使用、Revoke 和 Add/Download 动作。

### Gate 3 — Member tools

- [ ] 实现 `account_context` 与 `capabilities_list`，明确当前 User、Person、role 和本切片可用工具。
- [ ] 实现 `my_articles_list`，只返回本人 Article 的最小字段、publication/curation 状态和 revision。
- [ ] 实现 `article_get_working_copy`，返回受限 Markdown、locale、对象 ID、revision 和 Preview metadata。
- [ ] 实现 `article_create_draft`，服务端固定 owner、author、translation identity 和初始状态。
- [ ] 实现 `article_save_draft`，只更新本切片允许的写作字段，要求 revision 和 idempotency key，并读回最终 revision。
- [ ] 实现 `article_preview`，只为当前登录 Member 的 Person/Article 返回短期或登录态 Preview 路径，不生成公开 URL。
- [ ] 对工具标记 read/write 风险；工具结果不返回隐藏字段、密码、token、内部权限表或完整 User 记录。

### Gate 4 — Client adapters

- [ ] Cursor：项目级 MCP 配置和 OAuth 实际连接通过。
- [ ] TRAE：项目规则/Agent 与 MCP、OAuth 实际连接通过。
- [ ] Tencent WorkBuddy：项目级连接器与 OAuth 实际连接通过。
- [ ] Codex、Claude、Gemini：配置 fixture 能被解析，至少选择一个作为第二协议客户端完成端到端连接。
- [ ] 通用 Workspace 不包含凭据或角色，换账户登录后能力随服务器变化。

### Gate 5 — Verification and closeout

- [ ] 完成 anonymous、paused、Member A、Member B、Editor-with-Person、Super-Admin-with-Person 权限矩阵。
- [ ] 覆盖 token 过期、refresh rotation、撤销、错误 audience、错误 PKCE、重放、重复 idempotency key、stale revision、超时后读回和文章内容 prompt injection。
- [ ] 用桌面浏览器验证 `Agent access` 的正常、空、错误和撤销状态；人工执行 `DESIGN.md` copy gate。
- [ ] 完成 OAuth/MCP 安全独立复审与 Member 权限独立复审，所有 BLOCK 修复后复验。
- [ ] 更新 App 功能登记册与实现指纹；只在能力已真实验证后更新 current。
- [ ] 关闭 001 前更新父级清单并完成 transition review；基于真实证据决定 002–005 保留、拆分、合并、改序或取消，不自动启动 002。
- [ ] Preview 部署、migration 和真实账户测试分别取得批准；本地完成不推导外部授权。
- [ ] 全部验收通过后写 implementation evidence、必要 ADR，并把 checklist 移入 archive。

## Acceptance

- Cursor、TRAE、WorkBuddy 均能发现同一远程 MCP Gateway 并完成 OAuth；至少两个不同客户端完成完整 Member 流程。
- 同一通用配置由 Member A 与 Member B 登录时只返回各自 Person、Article 和 Preview；跨 Member ID 直接调用被服务端拒绝。
- Member 能查询本人文章、创建草稿、取得工作副本、保存一次修改并打开登录态 Preview。
- `article_save_draft` 的重复请求不产生重复文章或重复副作用；stale revision 不覆盖新版本。
- 暂停账户、撤销连接、错误 audience、过期 token 和无 Person 关系均安全失败。
- Editor/Super Admin 只有在关联 Person 时获得同一作者工具；本切片不因其站方角色增加策展或账户工具。
- Agent Workspace、适配器、日志和错误响应中不存在密码、Cookie、API key、refresh token、数据库地址或个人数据泄漏。
- `Agent access` 不用解释性长文案，不暴露内部工程术语；用户可以完成连接、查看和撤销。
- 普通 Payload Admin、公共站、Member 发布、Editor 策展、Newsletter 和现有 migration recovery 无回归。

## Validation

- OAuth metadata、authorization code、PKCE、audience、refresh rotation、revoke 和 token replay 自动测试。
- MCP initialize、tool discovery、tool schema、read/write annotations、成功/错误 result 和超时读回测试。
- Member A / Member B / paused / anonymous / Editor-with-Person / Super-Admin-with-Person 权限正负例。
- Article create/get/save/preview、revision conflict、idempotency 和不支持正文节点测试。
- Cursor、TRAE、WorkBuddy 实际连接记录；Codex、Claude、Gemini 配置解析 fixture。
- Agent access 桌面与 390px 灾难性回归、键盘、焦点、空态和必要错误。
- `npm --prefix apps/web run test:editorial`
- 新增 Agent 专项测试命令。
- `npm --prefix apps/web run typecheck`
- `npm --prefix apps/web run lint`
- `npm --prefix apps/web run build`
- `npm run feature-registry:check`
- `npm run governance:check`
- `git diff --check`

## Writeback

- 稳定产品合同：`docs/agent-workspace-requirements.md`。
- 当前实现能力：`docs/product-feature-registry.md` 和 `docs/current-state.md`。
- OAuth、MCP、客户端兼容、权限与复审证据：`docs/reference/implementation/`。
- 被接受的长期技术选择：必要时新增 `docs/decisions/` ADR 并登记。
- 当前执行：本 checklist、`docs/roadmap/README.md`、`docs/roadmap/checklists/README.md`。
- 父级计划与阶段转换：`docs/roadmap/agent-workspace-program.md`。
- 完成历史：`docs/archive/agent-workspace-member-foundation.md`。

## Approval Gates

- `checklist-commit`：本 checklist 进入 HEAD 后才允许后续代码、配置或 schema 改动。
- `auth-design`：OAuth provider/library 与协议边界形成证据并获批准后才实现认证。
- `product-code`：本地实现单独批准。
- `dependency-install`：新增 OAuth/MCP 依赖单独批准并审计版本、许可证和维护状态。
- `database-schema / migration`：分别批准；migration 先 Local/Preview apply、rollback/reapply 和恢复测试。
- `preview-deploy / public-mcp`：分别批准；Preview MCP 对外可达不等于 Production 启用。
- `real-account / real-data`：只对点名目标执行，不从 Preview fixture 验收推导。
- `production-deploy`：独立复审 PASS、恢复和监控就绪后单独批准。
- `merge / push`：分别批准。

当前门禁：`checklist-commit`、`product-code`、`auth-design`、`dependency-install` 与 `database-schema` 已通过；认证设计见 [`auth design evidence`](../../reference/implementation/agent-workspace-001-auth-design-2026-07-31.md)。`migration` 及全部外部动作尚未通过。
