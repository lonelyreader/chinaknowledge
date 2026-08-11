---
doc_contract: DocContractV1
doc_type: checklist
authority: execution
status: active
scope: article-body-media-002
last_verified: 2026-08-11
max_lines: 160
change_id: INFRA-BODY-MEDIA-002
risk_tier: upgraded
validation_profile: work_item
allowed_paths: apps/web/src/collections/Articles.ts, apps/web/src/cms/rich-text-media.ts, apps/web/src/cms/article-publication.ts, apps/web/src/content/cms.ts, apps/web/src/components/CMSRichText.tsx, docs/roadmap/**, docs/reference/**, docs/current-state.md, docs/product-feature-registry.md
approval_gates: schema, migration, preview, production-deploy, commit, merge, push
---

# INFRA-BODY-MEDIA-002 正文媒体权限收敛与发布管道补全

目标：落实 `INFRA-BODY-MEDIA-001` 独立复审的 F1/F2/F4——正文 upload 节点写入时校验媒体归属、预览读路径收敛越权 populate、发布管道对正文图片补公开标记、inlineBlock 写读一致化与渲染日志降噪。完成后成员发布的正文图片才能在公开页真正渲染（001 验收第 1 条的 Preview 前置）。

父级：[`Site Infrastructure Program`](../site-infrastructure-program.md)。F3（文章模板相邻问题)属 `INFRA-ARTICLE-TEMPLATE-001`，不进本批。

## Scope

- F1 写路径：新增 `cms/rich-text-media.ts` 提供正文 upload 节点 media ID 收集器；`Articles.ts` 的 beforeValidate guard 对每个正文 media 调 `assertMediaAllowedForMemberPublication`（编辑角色天然豁免）。
- F1 读路径：`getDraftPreviewCMSArticle` 的 `findByID`/`findVersions` 由 `overrideAccess: true` 收敛为 `overrideAccess: false` + 认证 user，访问被拒时返回 null；media populate 由此回归 `readApprovedMediaOrOwn`。
- F2 发布管道：`assertMemberPublicationComplete` 对正文全部 upload media 执行与封面一致的 assert/mark 分支（`markMediaForMemberPublication`，label "Body image"）。
- F4：`assertAllowedRichTextEmbeds` 拒绝一切 `inlineBlock`（编辑器未配置 inline blocks，渲染器不支持）；`CMSRichText` 的 `ignoreNode` 按 reason 去重告警。

## No-go

- 不改 Media collection 权限、`media-policy.ts` 既有函数语义与上传管道。
- 不改 Agent 合同与工具（`apps/web/src/agent/**`）。
- 不迁移或改写既有文章正文数据；无 schema 变更（如确需，先停下走 schema/migration 门禁）。
- 不改公开列表读路径（`findMemberPublishedArticles`/`findCuratedArticles`）的 overrideAccess 语义。
- 不引入新的公开渲染节点类型。

## Upgraded contract

- `data_truth`：Articles richText JSONB 与 media `memberUsePublishedAt`；Local 开发，Preview 验收；Production 部署单独批准。
- `read_path`：登录态草稿预览（收敛为按 user 走访问控制）；公开文章页行为仅因 F2 标记而多渲染成员正文图片。
- `write_path`：Articles beforeValidate 新增媒体归属校验；发布 transition 对正文 media 补标记；无新增端点。
- `permission_boundary`：成员正文只能引用本人或已公开 media；预览不再以 overrideAccess populate 他人未公开 media；负例——成员 API 直写他人未公开 media ID 必须 403。
- `audit_boundary`：无新增审计面；media 标记沿用 `memberPublicationMediaSync` context。
- `recovery`：各改动点独立可回退；F2 已标记的 media 与封面路径同语义，无需数据回滚；预览收敛回退即恢复旧行为。
- `independent_review`：非实现者按本合同复核权限负例（他人媒体、预览越权、inlineBlock 直写）与发布链路，给出 PASS/BLOCK。
- `key_invariants`：封面逻辑不变；编辑角色工作流不受阻；既有公开文章渲染不变；autosave 不被媒体校验打断（本人媒体恒通过）；EN/ES 一致。
- `finding_route`：文章模板与站点署名（site authorship）媒体审批相邻问题登记父级；其余 finding 路由后续批次。

## Acceptance

- [ ] 成员正文引用他人未公开 media：写入被 403 拒绝（负例脚本或 API 验证）。
- [ ] 成员发布含本人正文图片的文章后，该 media 带 `memberUsePublishedAt`，匿名读回正文图片正常渲染。
- [ ] 预览读路径不再 `overrideAccess: true` populate 正文 media；无权限 media 在预览中被安全忽略。
- [ ] `inlineBlock` 节点（任意 blockType）写入被 400 拒绝。
- [ ] 既有纯文字文章与 001 已支持节点渲染结果不变。

## Validation

- lint、typecheck、build、`npm run governance:check`、`git diff --check`。
- 节点级用例：收集器（嵌套/空/非 media upload）、guard 负例（他人媒体、inlineBlock、youtubeEmbed block 仍通过）。
- 浏览器主流程（含本人图片发布公开读回）留待 Preview 验收。
- 独立复审 PASS。

## Writeback

- 完成后：current-state 写回、安全证据补充入 reference、父级登记状态更新、本 checklist 归档。

## Current gate

- [x] 用户批准建立本 checklist 并冻结合同（2026-08-11，"全都批准" 批次授权，scope/no-go/invariants 冻结）。
- [x] allowed_paths 补 `docs/product-feature-registry.md`（指纹重算为 governance 强制项，沿 001 先例，同批次授权覆盖）。
- [x] 独立复审 PASS（2026-08-11，非实现者；权限负例/预览收敛/发布链路/F4 一致性/invariants/no-go/allowed_paths 七项全过；4 个不阻断 finding 已路由父级）。
- [ ] Preview 验收与 Production 部署分别批准。
