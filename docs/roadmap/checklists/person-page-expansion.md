---
doc_contract: DocContractV1
doc_type: checklist
authority: execution
status: active
scope: person-page-expansion
last_verified: 2026-08-16
max_lines: 160
change_id: INFRA-PERSON-PAGE-001
risk_tier: upgraded
validation_profile: work_item
allowed_paths: apps/web/src/collections/People.ts, apps/web/src/migrations/**, apps/web/src/app/(frontend)/[locale]/people/**, apps/web/src/components/person-row.tsx, apps/web/src/components/cms-person-row.tsx, apps/web/src/components/people-directory.tsx, apps/web/src/components/cms-people-directory.tsx, apps/web/src/components/person/**, apps/web/src/cms/components/**, apps/web/src/content/cms.ts, apps/web/src/payload-types.ts, apps/web/src/app/(payload)/admin/importMap.js, apps/web/src/app/(frontend)/globals.css, docs/roadmap/**, docs/reference/**, docs/current-state.md, docs/product-feature-registry.md
approval_gates: schema, migration, preview, production-deploy, commit, merge, push
---

# INFRA-PERSON-PAGE-001 Person 页扩展与正式名片

目标：Person 从档案页升级为成员的正式名片——schema 增加长自述（richText）、「我能帮什么」、编辑判词（People 索引判词名录用）、近期动态区；页面按 DESIGN.md 宋式条款重构（第三人称编辑传记、判词、联系渠道、近期发布）；My profile 表单同步扩展；双语字段延续既有 EN/ES 回退规则。

父级：[`Site Infrastructure Program`](../site-infrastructure-program.md)。

## Scope

- People schema：长自述 richText（EN/ES）、「我能帮什么」结构化条目、编辑判词短语（EN/ES，Editor 维护）；字段设计先过 schema 门禁再实现。
- 迁移：新增字段的 migration 文件（本地生成与验证；Preview/Production apply 分别批准）。
- 公开页 `/people/[slug]` 重构：编辑传记、判词、能帮什么、近期公开文章动态区、既有联系渠道与外链；无数据区块整体隐藏。
- People 索引页呈现判词名录（Gentlewoman 式一行判词）。
- My profile 表单扩展自管字段；判词只读（Editor 在 Person 文档维护）。
- 竖排汉字栏目侧签等宋式细节按 DESIGN.md 实现；样式以独立注释块追加 `globals.css` 尾部。

## No-go

- 不改 Person 公开/撤回语义、版本历史、锁定与权限模型；新字段沿用既有字段级权限模式。
- 不做 Member Projects（属 PROJECTS-001）；不做 Agent 工具（属 `AGENT-WORKSPACE-007`）。
- 不改文章页与首页；不动既有 Person 数据（新字段全部可空，无回填）。
- richText 新字段渲染复用 `CMSRichText` 只读调用，不修改该文件。

## Upgraded contract

- `data_truth`：People 表新增可空字段；Local 开发，Preview 验收；migration 与 Production 分别批准。
- `read_path`：公开 Person 页与 People 索引新增字段呈现；未公开 Person 行为不变。
- `write_path`：My profile 表单与 Payload admin 写新字段；无新增端点。
- `permission_boundary`：成员只能改本人自管字段；判词仅 Editor+ 可写；负例——成员 API 直写他人 Person 或判词字段被拒。
- `audit_boundary`：沿用 Person 版本历史，无新增审计面。
- `recovery`：字段可空、无回填，migration 逐条可回滚；页面 revert 即恢复。
- `independent_review`：非实现者复核权限负例、migration 回滚、未公开 Person 隔离、EN/ES 回退，给出 PASS/BLOCK。
- `key_invariants`：既有 Person 页 URL 与公开语义不变；自动保存与并发行为不变；空字段页面不出现空壳区块；EN/ES 回退规则一致。
- `finding_route`：Projects 与 Agent profile 需求分别路由 PROJECTS-001 / `AGENT-WORKSPACE-007`；首页人物模块路由 HOME-001。

## Acceptance

- [x] schema 设计经批准后实现；migration 本地 apply + 隔离批次 down/reapply 通过（2026-08-16）。
- [x] 成员经 My profile 维护本人引语与「我能帮什么」，公开页正确读回；编辑传记与判词对 Member 只读，判词在索引页呈现（2026-08-16 API + 浏览器主流程）。
- [x] 未公开 Person 不因新字段泄露；权限负例被拒（2026-08-12 负例脚本 PASS，见证据）。
- [x] 全部新区块无数据时整体隐藏；桌面与 390px 无溢出；EN/ES 回退正确（2026-08-16 浏览器验证）。

## Validation

- [x] `npm run lint`（0 error，48 条既有 migration 签名 warning）、`npm run typecheck`、`npm run build`。
- [x] Person migration 在独立 batch 完成 apply → populated down → reapply；live/version Discord links 降级为 `other`，旧列、`people` 表与 `slug NOT NULL` 保持。
- [x] 权限负例、未公开与未批准 Media 隔离、EN/ES（含空白回退）映射脚本；桌面 1440px 与移动 390px 成员编辑 → EN/ES 公开读回、索引与无溢出浏览器主流程。
- [x] 非实现者最终复审 PASS：合同内 P0/P1/P2 finding 为 0（2026-08-16）。
- [x] `npm run governance:check`、`git diff --check`。

## Writeback

- [x] feature registry（People 相关条目）与 current-state 写回。
- [ ] Preview/Production migration、部署与本人 X 公开读回已完成；剩余专项 UI 验收后归档。

## Current gate

- [x] 用户批准 Batch 2 启动并冻结本批合同（2026-08-12，scope/no-go/invariants 冻结）。
- [x] schema 字段设计批准（2026-08-12）：`nameZh`（成员自管）、`editorialBio`/`editorialBioEs`（richText，Editor+）、`verdict`/`verdictEs`（text，Editor+）、`quote`/`quoteEs`（text，成员自管）、`canHelpWith`/`canHelpWithEs`（array(text)，成员自管）；全部可空无回填；近期动态由公开文章聚合不加字段；links 缺 discord 选项则补。
- [x] 实现完成于分支 `infra/person-page-001`（2026-08-12）：schema、migration 文件、公开页重构、判词名录、cms.ts 单字段映射（ARTICLE-TEMPLATE-001 接口）；本地证据见 [`person-page-001-local-runtime-2026-08-12.md`](../../reference/implementation/person-page-001-local-runtime-2026-08-12.md)。
- [x] Local 实现、migration recovery、build、桌面/390px 浏览器主流程与独立复审 PASS（2026-08-16）；修复公开 Person 在 My profile 动作区误显示为 Draft 的状态回退。
- [x] Preview：已在受保护环境部署并以虚构 Person 完成 migration 独立 apply/down/reapply 与 Agent Profile/X 闭环；未复制 Production 个人数据。
- [ ] Preview 专项：Member UI 编辑、Editor 判词和 EN/ES 匿名 UI 读回仍待执行，不以 011 的 Agent 验收代替。
- [x] Production：前后 R2 backup/checksum/隔离 restore、Person 第 15 条独立 batch、精确 SHA 部署、本人的 MCP X 写入及 EN/ES 匿名 Person 读回均 PASS；其他 Profile 字段与公开状态不变。
- [ ] Preview/Production 专项：Member UI 编辑、Editor 判词与完整 EN/ES UI 流程仍待执行，不以 012 的 MCP X 验收代替。
