---
doc_contract: DocContractV1
doc_type: checklist
authority: execution
status: active
scope: brand-wordmark-site-integration
last_verified: 2026-07-30
max_lines: 180
change_id: BRAND-WORDMARK-001
risk_tier: base
validation_profile: slice
allowed_paths: apps/web/public/brand/**, apps/web/src/components/wordmark.tsx, apps/web/src/components/site-header.tsx, apps/web/src/app/(frontend)/[locale]/layout.tsx, apps/web/src/app/(frontend)/globals.css, apps/web/design-qa.md, DESIGN.md, docs/decisions/0002-china-in-fact-name.md, docs/current-state.md, docs/product-feature-registry.md, docs/roadmap/README.md, docs/roadmap/checklists/README.md, docs/roadmap/checklists/brand-wordmark-site-integration.md, docs/reference/README.md, docs/reference/implementation/**, docs/archive/README.md, docs/archive/brand-wordmark-site-integration.md
approval_gates: checklist-commit, product-code, preview-deploy, production-deploy, merge, push
---

# Public Site Wordmark Integration

目标：把用户定稿的单行 `China, in Fact` 矢量字标纳入公共网站 Header 与 Footer，保持定稿字形及 `hi, act` 朱砂红取色，不重新排字或换字体。

## Scope

- 从已批准的轮廓矢量母版生成适合网页占位的紧边界透明 SVG。
- 建立单一可复用的 Wordmark 组件，替换公共 Header 与 Footer 的纯文本品牌名。
- 保持现有导航、链接、语义、移动菜单、布局和语言路由行为。
- 把字标资产路径、颜色映射和禁止重新排字规则写回现有设计真相源。

## No-go

- 不重新设计、重绘、换字体、重新排字或改变字母轮廓。
- 不改变 `China, in Fact` 拼写、大小写、空格或逗号。
- 不把生成过程、实验图、Raster 预览或本地绝对路径作为运行时资产。
- 不改导航信息架构、页面内容、CMS、权限、schema、数据、依赖或公开路由。
- 不部署 Preview 或 Production，不 push，不操作真实内容与账号。

## Acceptance

- Header 与 Footer 均显示同一份轮廓 SVG，单行且无字体运行时依赖。
- 字标保留定稿字形；`h`、`i`、逗号和 `act` 使用 Cinnabar，其余字母使用 Ink，组合阅读仍为 `China, in Fact`。
- 资产无 `<text>`、外链图片、内联字体或栅格嵌入；小尺寸清晰，无异常留白。
- Header 首页链接、移动菜单关闭行为和 Footer 语义不退化。
- 桌面与移动视口无溢出、遮挡或导航挤压；浏览器控制台无新增错误。
- 可见文案未新增解释性文字，符合 `DESIGN.md` copy gate。

## Validation

- 静态检查 SVG 元素、viewBox、颜色与资产哈希。
- `npm --prefix apps/web run typecheck`
- `npm --prefix apps/web run lint`
- `npm --prefix apps/web run build`
- 同页面桌面与移动截图，对照定稿参考完成设计 QA；`apps/web/design-qa.md` 最终为 `passed`。
- `npm run feature-registry:update`
- `npm run governance:check`
- `git diff --check`

## Writeback

- 稳定字标规则与运行时路径：`DESIGN.md` 与现有品牌决定。
- 当前公共网站事实：`docs/current-state.md`。
- 视觉与技术验证证据：`docs/reference/implementation/` 与 `apps/web/design-qa.md`。
- 完成后移入 `docs/archive/brand-wordmark-site-integration.md`，恢复 roadmap router 的无 active 状态。

## Approval Gates

- `checklist-commit`：本 checklist 进入 HEAD 后，产品代码才获得路径授权。
- `product-code`：用户“纳入网站吧”已批准本 checklist 范围内的本地实现。
- `preview-deploy / production-deploy / merge / push`：均未批准，不执行。

## Work

- [x] 提交本 checklist，建立 HEAD 授权基线。
- [ ] 生成并校验网页用紧边界 SVG 资产。
- [ ] 接入 Header 与 Footer 的复用组件。
- [ ] 写回稳定设计规则、当前事实和验证证据。
- [ ] 通过代码、治理、桌面与移动视觉门禁。
- [ ] 归档 checklist 并记录实现提交。
