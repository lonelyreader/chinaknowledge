---
doc_contract: DocContractV1
doc_type: checklist
authority: execution
status: active
scope: agent-media-tools
last_verified: 2026-08-16
max_lines: 160
change_id: INFRA-AGENT-MEDIA-001
risk_tier: upgraded
validation_profile: work_item
allowed_paths: apps/web/src/agent/**, apps/web/tests/agent-contracts.ts, apps/web/tests/agent-routes.ts, apps/web/tests/agent-http.ts, apps/web/tests/agent-fixtures.ts, apps/web/tests/agent-schema.ts, docs/roadmap/**, docs/reference/**, docs/current-state.md, docs/product-feature-registry.md
approval_gates: preview, production-deploy, commit, merge, push
---

# INFRA-AGENT-MEDIA-001 Agent 正文合同 V2 与媒体工具

目标：Agent 通道获得与网页编辑器对等的媒体能力——`AgentArticleBodyV2` 支持 image（引用本人 media）与 youtube embed 块；新增 `media_upload`（走唯一 pathname 直传管道）与 `article_set_cover` 工具；`article_preview` 返回发布预检（缺封面/缺摘要/标题层级问题）。

父级：[`Site Infrastructure Program`](../site-infrastructure-program.md)。

## Scope

- `AgentArticleBodyV1` 保持兼容；新增 V2 合同：image 块（media ID + alt 必填 + caption 可选）、youtube 块（服务端白名单校验复用 BODY-MEDIA 逻辑）；V2 与 Lexical JSON 双向转换。
- `media_upload`：认证成员上传图片，复用唯一 pathname 直传管道与 Media collection 权限；返回 media ID 与只读元数据。
- `article_set_cover`：为本人文章设置封面（引用本人或已公开 media，复用 `assertMediaAllowedForMemberPublication` 语义）。
- `article_preview` 预检：缺封面、缺摘要、标题层级跳级、正文媒体归属问题，以结构化 warning 返回。
- 工具注册、schema、审计事件沿既有 Gateway 模式。

## No-go

- 不改 Media collection 权限与上传管道本体（只调用）。
- 不改网页编辑器、渲染器、发布管道（BODY-MEDIA-001/002 代码已冻结）。
- 不提供引用或修改他人媒体的任何路径；不提供删除媒体工具。
- 不改既有工具的行为与合同；V1 客户端不受影响。
- 无 schema 变更（如确需，先停下走 schema/migration 门禁）。

## Upgraded contract

- `data_truth`：Media 与 Articles 经既有服务端规则写入；Local 开发，Preview 验收；Production 部署单独批准。
- `read_path`：`article_preview` 新增预检字段；media 元数据只返回本人可读项。
- `write_path`：`media_upload`、`article_set_cover`、V2 body 写入；全部经服务器确认与审计。
- `permission_boundary`：负例必须覆盖——引用他人未公开 media 的 image 块被拒；`article_set_cover` 指向他人未公开 media 被拒；跨成员文章 set cover 被拒；暂停账户全部工具被拒。
- `audit_boundary`：新工具进入既有 Agent 审计事件流，不新增审计面。
- `recovery`：工具注册回退即恢复 V1 行为；已上传 media 沿既有媒体治理，无需数据回滚。
- `independent_review`：非实现者按本合同复核权限负例、上传管道复用正确性、V1 兼容与不支持节点显式报错，给出 PASS/BLOCK。
- `key_invariants`：V1 客户端行为不变；不支持的节点显式报错不静默丢弃；封面与正文媒体语义与网页侧一致；审计不缺失。
- `finding_route`：`my_profile_*` 相邻需求进入 `AGENT-WORKSPACE-007`；发布管道问题路由 BODY-MEDIA-002 验收或父级登记。

## Acceptance

- [x] Agent 可上传图片、以 V2 正文引用并 set cover，`article_preview` 预检返回正确 warning。
- [x] 四类权限负例（他人媒体 image、他人媒体 cover、跨成员文章、暂停账户）全部被拒且有审计。
- [x] V1 合同回归测试全过；不支持节点显式报错。
- [x] 白名单外 embed URL 被拒，与网页侧一致。

## Validation

- [x] `npm run test:agent`：contracts / http / routes / fixtures / oauth-model / schema 全过。
- [x] lint（0 error，44 条既有 migration warning）、typecheck、build 全过。
- [x] `npm run governance:check`、`git diff --check` 全过。
- [x] 非原实现者按冻结合同完成一轮独立复审：`PASS`，P0/P1/P2=`0/0/0`（2026-08-16）。

## Writeback

- [x] feature registry Agent 段与 current-state 写回；权限负例与独立复审证据入 reference。
- [ ] Preview 与 Production 部署/discovery 已回读；Production 真实 media upload/cover 专项完成后归档。

## Current gate

- [x] 用户批准 Batch 2 启动并冻结本批合同（2026-08-12，scope/no-go/invariants 冻结）。
- [x] 实现完成并提交 worktree 分支 `infra/agent-media-001`（`d04510d`，10 files +947/−49）。
- [x] 独立复审 PASS（2026-08-12，非实现者；四类权限负例/归属校验/V1 兼容/白名单一致/审计幂等/无 schema 变更/allowed_paths 全过；5 项不阻断 finding 已路由父级，含 `tests/agent-live.ts` 工具清单断言待 Preview 批次更新）。
- [x] 本地实现、工作项验证与独立复审完成；本地关闭 verdict 为 `PASS`（2026-08-16）。
- [x] 合入并通过单次 `main` fast-forward 发布到 Production（2026-08-16）。
- [x] 统一 Preview 已通过 18/28/33 真实 MCP discovery、角色隔离、本人 Media 列表与封面设置；Production Super Admin discovery 精确为 33，媒体工具已部署。
- [x] `tests/agent-live.ts` 工具清单断言已由后续 007–010 更新，并在 011 release SHA 的 Local/Preview 总验收通过。
- [ ] Production 未用真实内容重演 media upload/cover；该专项仍待执行，不阻断 012 的 33-tool 发布与本人 X 闭环。
