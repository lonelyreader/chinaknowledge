---
doc_contract: DocContractV1
doc_type: checklist
authority: execution
status: active
scope: design-token-architecture
last_verified: 2026-08-11
max_lines: 120
change_id: INFRA-TOKENS-001
risk_tier: base
validation_profile: work_item
allowed_paths: apps/web/src/app/(frontend)/globals.css, apps/web/src/app/(frontend)/**/*.module.css, apps/web/src/components/**, apps/web/postcss.config.*, apps/web/tailwind.config.*, docs/roadmap/**, docs/reference/**
approval_gates: commit, merge, push, production-deploy
---

# INFRA-TOKENS-001 Design Token 化与样式架构重构

目标：把 DESIGN.md 的色彩、字体、间距与 motion 合同抽成可复用 token（Tailwind v4 `@theme`），将 1,439 行单体 `globals.css` 分解为 token 层 + 组件级样式，**公开页面视觉零变化**。本项是一切后续视觉迭代的架构前置。

父级：[`Site Infrastructure Program`](../site-infrastructure-program.md)。

## Scope

- 建立 token 层：Rice Paper、Editorial White、Charcoal Ink、Stone Gray、Hairline Stone、Cinnabar 及字体族、字号阶梯、间距、断点、过渡时长，全部来源于 DESIGN.md 现行值。
- `globals.css` 结构化拆分：reset/base、token、排版、布局原语、逐组件样式；组件样式与 `src/components/**` 对应。
- 清理重复与死样式；不改变任何计算后视觉结果。
- 产出一页样式架构说明（reference），说明 token 命名、扩展方式与组件样式归属规则，供后续子级引用。

## No-go

- 不改变任何页面的可见视觉结果：颜色、字号、间距、布局在验收截图中逐像素等价（抗锯齿差异除外）。
- 不改动 DESIGN.md 的设计值；发现值不一致时以 DESIGN.md 为准并记录 finding。
- 不引入组件库、CSS-in-JS 或新依赖（Tailwind v4 已在依赖内）。
- 不修改 `(payload)` 后台样式、模板结构、数据获取或任何 TSX 逻辑（className 迁移除外）。

## Acceptance

- [ ] token 层建立且所有颜色/字体/间距硬编码值收敛到 token 引用。
- [ ] `globals.css` 主体拆分完成，总体样式行数不升。
- [ ] 首页、文章页、People、Person、Places、About 六类页面在 1440px 与 390px 前后截图对比视觉等价。
- [ ] 样式架构说明写入 `docs/reference/`。

## Validation

- lint、build、`npm run governance:check`、`git diff --check`。
- 六类页面 × 两宽度前后截图对比；焦点态与 hover 态抽查。

## Writeback

- 完成后：reference 收录架构说明与截图证据；本 checklist 归档。功能登记册无行为变化时只在指纹核对中确认。

## Merge order

- 本项持有 `globals.css` 结构性重写权，先于 `INFRA-BODY-MEDIA-001` 的样式段进入 `main`；对方样式在本项合并后 rebase 为 token 引用。

## Current gate

- [x] 用户批准建立本 checklist（2026-08-11，接手规划批次）。
- [ ] 实现完成后按验收截图复核。
