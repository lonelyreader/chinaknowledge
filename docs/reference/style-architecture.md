---
doc_contract: DocContractV1
doc_type: reference
authority: evidence
status: active
scope: style-architecture
last_verified: 2026-08-11
max_lines: 240
---

# 前台样式架构与 design token 说明

约束来源：INFRA-TOKENS-001。本页记录 `apps/web/src/app/(frontend)/globals.css` 的分层结构、token 命名与扩展规则、组件样式归属，以及重构时的 token↔原字面值对照审计。视觉合同本身仍以 `DESIGN.md` 为准；本页只描述实现架构，不决定设计方向。

## 样式分层

`globals.css` 按以下顺序组织（重构后 1258 行，重构前 1439 行）：

1. 自托管字体（Satoshi `@font-face`）。
2. Design tokens：`@theme inline`（Tailwind preflight 默认值来源）＋ `@theme static`（项目 token 全集）。
3. 布局原语（`--page` 派生变量、`.page-shell`）。
4. Reset 与 base（`*`、`html`、`body`、媒体元素、链接默认态）。
5. 排版原语（`.section-heading` 等跨页复用类）。
6. 逐组件样式段（按 header → 首页 → 列表 → 文章 → People/Places → About → footer 顺序）。
7. 响应式（`@media (max-width: theme(--breakpoint-nav))` 与 `theme(--breakpoint-mobile)`）。
8. Reduced motion 覆盖。

## Token 命名规则

全部 token 定义在 `@theme static` 块中，Tailwind v4 会将其发射为 `:root` CSS 变量并生成对应 utility。命名空间取 Tailwind v4 约定：

- `--color-*`：色彩。DESIGN.md 调色板名直译（`rice-paper`、`charcoal-ink`、`cinnabar` 等）；未入册的现存工作值按语义命名（`ink-summary`、`hairline-on-ink`、`cinnabar-press`）；合成值用 `color-mix()` 表达派生关系（`header-veil`、`cover-deep`）。
- `--font-*`：字体族。`display`（衬线标题）、`body`（Satoshi 正文）、`meta`（等宽元信息）。`next/font` 变量（`--font-instrument-serif`、`--font-geist-mono`）由 `[locale]/layout.tsx` 注入 `<html>`，token 只做引用。
- `--text-*`：字号。固定阶梯按用途命名（`meta`/`ui`/`nav`/`body`/`prose`/`title-*`）；流式阶梯保留 `clamp()` 原值，按层级命名（`lede-*` < `heading-*` < `display-*`）。
- `--tracking-*`：字距，按 display/heading/meta/label 分档。
- `--spacing-*`：结构尺寸与节奏间距（header 高度、gutter、各段落垂直节奏 clamp）。
- `--radius-*`、`--duration-*`、`--ease-*`：圆角与 motion。
- `--breakpoint-*`：断点，媒体查询经 `theme(--breakpoint-nav)` 引用（CSS 变量不能直接用于 `@media`）。

## 扩展方式

- 新增设计值：先查 `@theme static` 是否已有等值 token，有则引用，无则按上述命名空间追加，并同步本页审计表。
- 一次性布局值（如某组件独有的 `grid-template-columns` 比例）不建 token，留在组件样式段内。
- 禁止在组件样式段内新写十六进制色、字面 `clamp()` 字号或字面时长；lint 前可用 `rg '#[0-9a-f]{3,8}|clamp\(' globals.css` 自查（token 块除外）。
- 组件级 CSS 使用 `*.module.css` 时同样引用 `:root` 上发射的 token 变量，不复制值。

## 组件样式归属

- 全站骨架（header、subnav、footer、`.page-shell`）与所有页面级样式段：`globals.css`。
- React 组件（`apps/web/src/components/**`）当前无独立样式文件，类名由 `globals.css` 逐组件样式段承接；如未来样式规模增长，优先拆分为同目录 `*.module.css` 并引用 token。
- `(payload)` 后台样式不属于本架构，不引用本 token 层。

## DESIGN.md 不一致 findings（记录不修正）

以下现行实现值与 `DESIGN.md` 不完全一致；按铁律「按现值建 token、不归一」全部保留现值：

1. 灰阶工作值未入册：`#454640`（摘要文本）、`#343530`（正文 prose）、`#55564f`（深底 hairline）、`#b8b7af`（深底次级文本）。
2. 主色按压态 `#922e26` 未入册（cinnabar 的深化变体）。
3. 合成色 `color-mix(...94%, transparent)`（header 毛玻璃底）与 `color-mix(...88%, #000)`（封面深红）为实现层派生值。
4. 18 种 `clamp()` 流式字号均为实现层自定阶梯，DESIGN.md 未逐一定义。
5. `--text-ui`（0.9rem）等固定字号阶梯同为实现层约定。

## Token 对照审计表

「引用数」为重构后 `var(--token)` 在 `globals.css` 中的出现次数（断点 token 经 `theme()` 引用计 2 处媒体查询）。值等价性另由编译产物对比与七类页面 1440/390px 前后截图逐像素一致共同证明（见文末验证记录）。

| Token | 原字面值 | 引用数 |
|---|---|---|
| `--color-rice-paper` | `#f4f0e7` | 3 |
| `--color-editorial-white` | `#fffcf6` | 6 |
| `--color-charcoal-ink` | `#1d1d1a` | 15 |
| `--color-stone-gray` | `#6b6c66` | 11 |
| `--color-hairline-stone` | `#d8d2c7` | 15 |
| `--color-cinnabar` | `#b43a2f` | 8 |
| `--color-ink-summary` | `#454640` | 2 |
| `--color-ink-prose` | `#343530` | 1 |
| `--color-cinnabar-press` | `#922e26` | 1 |
| `--color-hairline-on-ink` | `#55564f` | 1 |
| `--color-stone-on-ink` | `#b8b7af` | 1 |
| `--color-header-veil` | `color-mix(in srgb, var(--color-rice-paper) 94%, transparent)` | 1 |
| `--color-cover-deep` | `color-mix(in srgb, var(--color-cinnabar) 88%, #000)` | 1 |
| `--font-display` | `var(--font-instrument-serif), serif` | 13 |
| `--font-body` | `"Satoshi", sans-serif` | 1 |
| `--font-meta` | `var(--font-geist-mono), monospace` | 5 |
| `--text-root` | `16px` | 1 |
| `--text-meta-xs` | `0.7rem` | 1 |
| `--text-meta` | `0.72rem` | 2 |
| `--text-meta-sm` | `0.76rem` | 1 |
| `--text-fine` | `0.78rem` | 1 |
| `--text-label` | `0.8rem` | 1 |
| `--text-ui` | `0.9rem` | 6 |
| `--text-nav` | `0.92rem` | 1 |
| `--text-body` | `1rem` | 1 |
| `--text-prose` | `1.125rem` | 1 |
| `--text-identity` | `1.15rem` | 1 |
| `--text-title-person` | `1.45rem` | 1 |
| `--text-title-menu` | `1.65rem` | 1 |
| `--text-title-author` | `2.4rem` | 1 |
| `--text-lede-dek` | `clamp(1.08rem, 1.6vw, 1.35rem)` | 1 |
| `--text-lede-intro` | `clamp(1.15rem, 1.7vw, 1.4rem)` | 1 |
| `--text-heading-list` | `clamp(1.35rem, 2.2vw, 2.35rem)` | 1 |
| `--text-heading-story` | `clamp(1.45rem, 2vw, 2.2rem)` | 1 |
| `--text-heading-place-sm` | `clamp(1.7rem, 2.5vw, 2.7rem)` | 1 |
| `--text-heading-person` | `clamp(1.7rem, 2.8vw, 3rem)` | 1 |
| `--text-heading-lead` | `clamp(1.8rem, 3.2vw, 3.6rem)` | 1 |
| `--text-heading-section` | `clamp(2rem, 3vw, 3.25rem)` | 1 |
| `--text-heading-prose` | `clamp(2rem, 3.5vw, 3.2rem)` | 1 |
| `--text-heading-place` | `clamp(2rem, 3.5vw, 3.8rem)` | 1 |
| `--text-heading-result` | `clamp(2rem, 4vw, 3.8rem)` | 1 |
| `--text-display-feature` | `clamp(2.25rem, 5vw, 5rem)` | 1 |
| `--text-display-cover` | `clamp(2.3rem, 5vw, 5.5rem)` | 1 |
| `--text-display-band` | `clamp(2.6rem, 5vw, 5.2rem)` | 1 |
| `--text-display-page-sm` | `clamp(3rem, 15vw, 4.6rem)` | 1 |
| `--text-display-page` | `clamp(3.25rem, 6.5vw, 6rem)` | 1 |
| `--tracking-display` | `-0.035em` | 3 |
| `--tracking-display-sm` | `-0.03em` | 3 |
| `--tracking-heading` | `-0.025em` | 3 |
| `--tracking-heading-sm` | `-0.02em` | 1 |
| `--tracking-meta` | `0.04em` | 1 |
| `--tracking-label` | `0.08em` | 1 |
| `--container-page` | `1440px` | 1 |
| `--spacing-gutter` | `48px` | 1 |
| `--spacing-header` | `76px` | 4 |
| `--spacing-subnav` | `58px` | 2 |
| `--spacing-wordmark` | `clamp(9rem, 14vw, 11.25rem)` | 1 |
| `--spacing-nav-gap` | `clamp(1.25rem, 2.5vw, 2.75rem)` | 1 |
| `--spacing-purpose-gap` | `clamp(1.2rem, 3.2vw, 3.5rem)` | 1 |
| `--spacing-offset` | `clamp(2rem, 4vw, 4rem)` | 2 |
| `--spacing-cover` | `clamp(2rem, 5vw, 5rem)` | 3 |
| `--spacing-inset` | `clamp(2rem, 6vw, 7rem)` | 2 |
| `--spacing-passage` | `clamp(2rem, 6vw, 6rem)` | 1 |
| `--spacing-guide-gap` | `clamp(2rem, 7vw, 9rem)` | 1 |
| `--spacing-guide-end` | `clamp(3rem, 5vw, 5rem)` | 1 |
| `--spacing-hero-end` | `clamp(3rem, 6vw, 6rem)` | 1 |
| `--spacing-section-sm` | `clamp(3rem, 7vw, 7rem)` | 3 |
| `--spacing-identity` | `clamp(3rem, 8vw, 8rem)` | 1 |
| `--spacing-band` | `clamp(4rem, 7vw, 7rem)` | 2 |
| `--spacing-section` | `clamp(4rem, 8vw, 8rem)` | 2 |
| `--spacing-header-top` | `clamp(4rem, 9vw, 8rem)` | 1 |
| `--spacing-guide-top` | `clamp(4rem, 9vw, 9rem)` | 1 |
| `--spacing-page-end` | `clamp(5rem, 9vw, 9rem)` | 1 |
| `--radius-field` | `3px` | 1 |
| `--radius-action` | `4px` | 1 |
| `--duration-quick` | `160ms` | 3 |
| `--duration-reveal` | `500ms` | 1 |
| `--ease-standard` | `ease` | 3 |
| `--ease-image` | `cubic-bezier(0.16, 1, 0.3, 1)` | 1 |
| `--breakpoint-nav` | `980px` | 2 |
| `--breakpoint-mobile` | `767px` | 1 |

`@theme inline` 另保留 `--color-background`、`--color-foreground`、`--font-sans/serif/mono` 五项，值与重构前逐字符一致，仅为 Tailwind preflight 默认值来源。

## 验证记录（2026-08-11）

- `npm run build`（apps/web）通过；编译产物 CSS 与重构前基线用于视觉对比。
- 视觉等价：dev server（端口 3011）+ Playwright 路由拦截（同一页面加载分别注入重构前/后编译 CSS），首页、Stories、People、Person、Places、About、Newsletter 七类页面 × 1440px/390px 共 14 组全页截图逐像素一致（0 差异像素）。
- 残留字面值扫描：token 块外无十六进制色、无 `clamp()`、无字面时长（reduced-motion 的 `0.01ms` 覆盖除外，属可访问性语义而非设计值）。
