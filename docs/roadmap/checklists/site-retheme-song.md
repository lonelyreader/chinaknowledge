---
doc_contract: DocContractV1
doc_type: checklist
authority: execution
status: active
scope: site-retheme-song
last_verified: 2026-08-12
max_lines: 120
change_id: INFRA-RETHEME-001
risk_tier: base
validation_profile: work_item
allowed_paths: apps/web/src/app/(frontend)/globals.css, apps/web/src/app/(frontend)/[locale]/layout.tsx, docs/roadmap/**, docs/reference/**, docs/current-state.md, docs/product-feature-registry.md
approval_gates: design-acceptance, commit, merge, push, production-deploy
---

# INFRA-RETHEME-001 宋式视觉换装（token 值切换）

目标：把 `DESIGN-DIRECTION-001` 批准的宋式方案落到 token 实际值——TOKENS-001 建立了 token 架构但保持旧值（暖米色系、18 种 clamp），本项做全站一次性换装：宋式色板、六级字阶、mono 系统层、墨下划线链接、正文 measure 620px、思源宋体（Noto Serif SC）汉字层接入。结构性组件（印章署名、目录、作者卡）不在本项，属 ARTICLE-TEMPLATE/PERSON-PAGE。

父级：[`Site Infrastructure Program`](../site-infrastructure-program.md)。本项持有本批 `globals.css` 结构性修改权，合并顺序第一（见父级并行规则）。

## Scope

- 色板 token 值切换（值以 DESIGN.md 为准）：画布纸灰 `#EFF0EA`、阅读面纸白 `#FBFBF8`、墨分五色灰阶（焦/浓/重/淡/清）、印泥朱砂 `#A63A2B`、石青 `#2F5D8A`；分隔线统一「清」。
- 字阶收敛为 6 级（display-xl / display-l / heading-l / heading-m / body / meta），废除散落 clamp；meta 层统一 Geist Mono 全大写 0.08em。
- 链接改墨下划线；正文 measure 收窄 620px；区块间距按 DESIGN.md 上调一档。
- `layout.tsx` 接入 Noto Serif SC（next/font，subset 按需）供汉字点缀层使用。
- 逐页核对：Home、文章、People、Person、Purpose、About、Newsletter、Privacy 在新版色板下无对比度回归（可见文字 AA）。

## No-go

- 不改模板结构、组件层级、数据获取与任何 TSX 逻辑（className 与字体接入除外）。
- 不引入 DESIGN.md 禁令元素（龙凤纹、祥云、鎏金、书法字库大标题、大面积朱砂）。
- 不动 `(payload)` 后台样式。
- 不新增除 Noto Serif SC 外的依赖或字体。

## Acceptance

- [ ] 全部公开页面在 1440px 与 390px 呈现宋式色板与六级字阶，与 DESIGN.md 定值一致；朱砂只以印章尺寸出现。
- [ ] 可见文字对比度全部 ≥ AA；焦点态可见。
- [ ] 字标（墨+朱砂）在纸灰底上呈现正常。
- [ ] 产品负责人截图验收通过（design-acceptance 门禁）。

## Validation

- lint、build、`npm run governance:check`、`git diff --check`。
- 八类页面 × 两宽度截图；对比度扫描；hover/focus 抽查。

## Writeback

- 截图证据入 reference；current-state 记录换装事实；本 checklist 归档。

## Current gate

- [x] 用户批准 Batch 2 启动并冻结本项范围（2026-08-12）。
- [ ] 实现完成后产品负责人截图验收（design-acceptance）。
- [ ] merge/push/production-deploy 分别批准。
