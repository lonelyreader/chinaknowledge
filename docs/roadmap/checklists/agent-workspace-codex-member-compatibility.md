---
doc_contract: DocContractV1
doc_type: checklist
authority: execution
status: active
scope: agent-workspace-codex-member-compatibility
last_verified: 2026-08-02
max_lines: 260
change_id: AGENT-WORKSPACE-006
risk_tier: upgraded
validation_profile: work_item
allowed_paths: docs/current-state.md, docs/product-feature-registry.md, docs/roadmap/README.md, docs/roadmap/agent-workspace-program.md, docs/roadmap/checklists/README.md, docs/roadmap/checklists/agent-workspace-codex-member-compatibility.md, docs/reference/implementation/README.md, docs/reference/implementation/agent-workspace-006-codex-member-compatibility-2026-08-02.md, docs/reference/implementation/agent-workspace-006-independent-review-2026-08-02.md, docs/archive/README.md, docs/archive/agent-workspace-codex-member-compatibility.md
approval_gates: intake-commit, local-client-config, production-mcp, real-member-login, own-data-read, oauth-state-write, exact-cleanup, independent-review, closure-commit, push
---

# Agent Workspace Codex Member Compatibility

目标：用本机 Codex CLI 对 Production 远程 MCP 做一次单 Member、只读、可撤销、可精确清理的真实客户端验收。006 不新增工具、权限、产品代码或部署，只把 Codex 从“提供配置 adapter”推进到“真实客户端兼容已验证”或保留为未验证。

用户于 2026-08-02 要求“直接帮我测”。该请求授权准备本批、配置临时 Codex MCP、使用一个现有 Member 完成只读 OAuth/MCP smoke、撤销和精确清理；不授权创建或修改账号、读取正文、写文章、公开状态动作、schema、migration、部署、merge 或 push。`intake-commit` 与 `closure-commit` 仍按仓库治理单独确认。

## Scope

- 客户端固定为本机 `codex-cli 0.142.5`，临时 server 名固定为 `china-in-fact-member-test`，远程 URL 固定为 `https://chinainfact.com/api/agent/mcp`。该 CLI 的当前默认模型要求升级客户端，因此真实 MCP 调用显式使用该版本已验证可运行的 `gpt-5.4`；不升级 CLI 或改全局默认模型。
- 只使用一个现有、active、已关联 Person 的 Member；登录由用户在浏览器完成，执行者不读取密码、Cookie、session 或邮箱。
- 成功调用只限 `account_context`、`capabilities_list`、`my_articles_list`。运行证据只记录角色、工具名、结果、数量和时间，不记录标题、正文、摘要、slug、Person 资料或 token。
- 负例固定为 discovery 不含 `editorial_*` 与 `admin_recent_activity`；不通过猜测工具名绕过 MCP discovery，不使用客户端声称的角色。
- 完成后从后台撤销 connection，验证旧凭据失败关闭；再 logout/remove 本机 MCP，并精确删除本轮 DCR client、connection 和 Agent events。

## No-go

- 不调用 `article_create_draft`、`article_save_draft`、`article_prepare_publication`、`article_commit_publication`、Editor commit 或任何写工具。
- 不读取文章正文、摘要、标题、slug、媒体、来源、Person 资料、邮箱或其他成员数据；`my_articles_list` 只核对响应成功、条数和 owner 均属于当前 actor。
- 不创建、邀请、改密、暂停、恢复、改角色或删除真实 User/Person；没有可登录 Member 时停止并报告，不用 Super Admin 代替 Member PASS。
- 不修改产品代码、adapter、OAuth、权限、schema、migration、依赖、env、WAF、deployment、alias、SSO 或 Production 内容。
- 不复用或改写现有 Codex MCP 配置；临时 server 名冲突时停止。不得把 OAuth callback、code、token 或客户端配置凭据写入仓库和证据。
- 不 merge、不 push，不触碰原工作树的 `outputs/**`、共享研究提案或其他用户改动。

## Upgraded contract

- `data_truth`：Production 只读取当前 Member 的服务器角色、capability 与本人 Article 列表元数据；正式证据不保存任何业务字段值。执行前后核对 User/Person/Media/Article/workflow 聚合与 Article 状态分布不变。
- `read_path`：Codex config → protected-resource metadata → DCR → PKCE browser consent → token → current connection/User/Person/client → Member tool discovery → 三项只读调用。
- `write_path`：仅 OAuth DCR client、authorization connection、最小 Agent events 与 Codex 本机临时配置/凭据；没有领域对象写路径。
- `permission_boundary`：服务器必须返回 `role=member`；Member discovery 只含 9 个 Member 工具，不含三个 Editor 工具和 `admin_recent_activity`。Super Admin/Editor 会话不能替代本批验收。
- `audit_boundary`：只读回本轮 authorization、三次工具调用和 revoke 结果；不读取或记录 event input、request body、token、code、Cookie、标题、正文或对话。
- `recovery`：后台 revoke → 旧 Codex credential 调用失败 → `codex mcp logout` → `codex mcp remove` → Payload API 精确删除本轮 event/connection/client → 聚合读回；任一步不能精确定位时停止扩大删除。
- `independent_review`：未主持执行者只读核对 Codex CLI 证据、Production 安全字段日志、权限矩阵、撤销、清理、changed paths 与治理；不读取 env、数据库、账号或业务内容。只有 `PASS` 才可登记 Codex 真实兼容并归档。
- `key_invariants`：actor 必须是 Member；只读三工具；其他角色工具不可发现；真实对象与公开状态不变；临时 OAuth/Agent/本机状态最终无残留；WorkBuddy/Cursor 和 Production Gateway 不回归。
- `finding_route`：Codex 特有 callback、OAuth 或 config 问题留在 006；通用 server bug 另建产品 amendment；Member 内容能力不进入本批；账户/身份、客户端 UX、监控、Production release 分别进入新 checklist。

## Acceptance

- [ ] Intake 已进入 HEAD，changed paths 全部受 006 覆盖；原工作树用户改动未进入本批。
- [ ] `codex mcp add` 与 `codex mcp login` 通过 DCR + PKCE 完成，Codex `/mcp` 或 CLI 状态确认 server 可用。
- [ ] `account_context`、`capabilities_list`、`my_articles_list` 真实调用成功，服务器角色为 Member；只记录本人文章数量，不记录字段值。
- [ ] discovery 精确为 9 个 Member 工具，且不含 `editorial_article_get`、`editorial_prepare_site_selection`、`editorial_commit_site_selection`、`admin_recent_activity`。
- [ ] 没有调用任何写工具；Production 领域聚合、Article 状态与 workflow 前后不变。
- [ ] Member 从 Agent access 撤销本轮 connection 后，旧 Codex credential 下一次调用失败关闭；本机 logout/remove 完成。
- [ ] 本轮 client、connection、Agent events 经 Payload API 精确删除；Production 回到执行前 Agent 聚合，临时文件、callback 和凭据无残留。
- [ ] 独立 reviewer `PASS`，`P0/P1/P2 = 0/0/0`；Current、feature registry、parent、evidence 与 archive 已写回。

## Validation

- Intake：Codex 官方 manual、`codex --version`、`codex mcp --help`、adapter config readback、docs governance、changed-path coverage、`git diff --check`。
- Runtime：Codex CLI add/get/login/list、OAuth browser consent、MCP discovery、三项只读调用、隐藏工具负例、后台 revoke、旧 credential failure-close。
- Readback：Vercel 日志仅 path/method/status/request/deployment/source；数据库由执行者做非敏感聚合与精确 locator，reviewer 不重连。
- Cleanup：Codex logout/remove、本轮 event → connection → client Payload 删除、业务和 Agent 聚合读回、临时目录不存在。
- Closure：`npm run docs:governance:check`、`npm run feature-registry:check`、`git diff --check`；完整 intake 若只被原工作树明确排除文件影响，必须单独说明。

## Writeback

- 执行状态：本 checklist、roadmap/checklists router 和父级计划。
- 运行证据：`docs/reference/implementation/agent-workspace-006-codex-member-compatibility-2026-08-02.md`。
- 独立复审：`docs/reference/implementation/agent-workspace-006-independent-review-2026-08-02.md`。
- 只有最终 PASS 后，才把 `OPS-13` 的 Codex 从“配置 adapter”改为“真实客户端兼容验收完成”，更新 current 并归档本 checklist。

## Current gate

用户于 2026-08-02 明确要求重新启动 006，并已在浏览器完成现有 Member 登录。Intake 进入 HEAD 后重新配置临时 Codex MCP 并发起 Production OAuth；此前已撤销批次的 client、connection、event 和本机配置均为零，不复用旧状态。
