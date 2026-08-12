---
doc_contract: DocContractV1
doc_type: checklist
authority: execution
status: active
scope: article-page-template
last_verified: 2026-08-12
max_lines: 160
change_id: INFRA-ARTICLE-TEMPLATE-001
risk_tier: upgraded
validation_profile: work_item
allowed_paths: apps/web/src/app/(frontend)/[locale]/posts/**, apps/web/src/components/CMSRichText.tsx, apps/web/src/components/article-byline.tsx, apps/web/src/components/article/**, apps/web/src/app/(frontend)/globals.css, docs/roadmap/**, docs/reference/**, docs/current-state.md, docs/product-feature-registry.md
approval_gates: preview, production-deploy, commit, merge, push
---

# INFRA-ARTICLE-TEMPLATE-001 文章页模板

目标：文章页成为可读、可路由的模板——目录、排版修复、成员稿印章署名体系（文首签名组件 + 文末「文」字印）、文末路由模块（相关人物 / 社群深链 / 下一篇）、机构稿 Related people 呈现。视觉值遵守 DESIGN.md 宋式条款；全局 token 换装属 `INFRA-RETHEME-001`，本项在其合并后 rebase。

父级：[`Site Infrastructure Program`](../site-infrastructure-program.md)。

## Scope

- 目录：正文 ≥3 个 H2 时显示，随滚动高亮当前章节；不加顶部进度条；390px 折叠为可展开。
- 排版：列表、行距、blockquote、图注按 DESIGN.md 修复；文章 measure 应用 620px。
- 署名：文首签名组件（署名印色块 + mono 拼音姓名 + 汉字 + 城市 + 编辑判词行）、文末「文」字印；点击进 Person 页。机构稿用机构署名变体并呈现 Related people。
- 文末路由模块：相关人物卡、社群编辑私语式深链（Discord）、下一篇；无数据的子模块整体隐藏不留空。
- 吸收 BODY-MEDIA-001 复审 F3：`CMSRichText` 对 HorizontalRule / Checklist / Align / Indent 补呈现或做明确降级决定并记录。
- 文章页样式进入 `globals.css` 独立注释块（合并顺序见父级）。

## No-go

- 不改 schema、权限、数据写路径与 Agent 合同。
- 不改 Media/Articles collection 与发布管道（BODY-MEDIA-001/002 代码已冻结，仅剩验收）。
- 不改公开列表页与首页（HOME-001 属 Batch 3）。
- 不引入新依赖；目录滚动高亮用 IntersectionObserver 原生实现。
- 编辑判词为 Person 既有字段或省略；本项不新增字段（字段扩展属 PERSON-PAGE-001）。

## Upgraded contract

- `data_truth`：无数据变更；只读既有 Article/Person 关系。
- `read_path`：公开文章页模板重构；预览页同步。
- `write_path`：无。
- `permission_boundary`：路由模块只呈现已公开 Person 与已公开文章；不因模块泄露未公开数据；负例——未公开 Person 不出现在相关人物。
- `audit_boundary`：无新增审计面。
- `recovery`：模板为纯前端提交，revert 即恢复。
- `independent_review`：非实现者复核未公开数据负例、渲染安全（F3 节点）、390px/1440px 表现，给出 PASS/BLOCK。
- `key_invariants`：既有文章 URL 与 metadata 不变；EN/ES 一致；无 CLS 明显回归；BODY-MEDIA 已上线的图片/embed 渲染不回归。
- `finding_route`：首页与列表页相邻问题登记父级（HOME-001）；Person 字段需求路由 PERSON-PAGE-001。

## Acceptance

- [ ] ≥3 H2 的文章显示目录并随滚动高亮；<3 H2 不显示。
- [ ] 成员稿呈现文首签名组件与文末印，链接进 Person；机构稿呈现机构署名与 Related people。
- [ ] 文末路由模块三个子模块按数据出现/隐藏，无空壳。
- [ ] F3 四类节点有明确呈现或降级，负例不破版。
- [ ] 桌面与 390px 无溢出；既有文章渲染不回归。

## Validation

- lint、typecheck、build、`npm run governance:check`、`git diff --check`。
- 浏览器主流程：长文目录、成员稿/机构稿署名、路由模块、双语言；独立复审 PASS。

## Writeback

- feature registry（RDR-05 等）与 current-state 写回；证据入 reference；本 checklist 归档。

## Current gate

- [x] 用户批准 Batch 2 启动并冻结本批合同（2026-08-12，scope/no-go/invariants 冻结）。
- [ ] 实现与独立复审完成后，preview/merge/push/production-deploy 分别批准。
