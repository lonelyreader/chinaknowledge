---
doc_contract: DocContractV1
doc_type: reference
authority: evidence
status: accepted
scope: brand-wordmark-site-integration-evidence
last_verified: 2026-07-30
max_lines: 140
---

# BRAND-WORDMARK-001 Integration Evidence

## Result

定稿的单行 `China, in Fact` 字标已作为轮廓 SVG 接入公共 Header 与 Footer。运行时没有重新排字、字体依赖、栅格嵌入或外部图片引用；完整名称和 `hi, act` 朱砂红层均保持定稿结构。

## Asset

- 运行时资产：`apps/web/public/brand/china-in-fact-wordmark.svg`
- 运行时 SHA-256：`41559bdcb640af2fb2b1706b9e5e4981ae8b3eda512fbd76e97f20d55ba6a036`
- 定稿轮廓源 SHA-256：`d5fb3d84851490f08da64d2e2ac7e1be4c17436af1477083406a8c286a236dca`
- 定稿 Raster 来源 SHA-256：`702bc52fd6a4a4bd1659abf5bd6efee44f0ebfcd27cba2fb1562ac6df433a9b7`
- 结构：14 个 `<path>`；无 `<text>`、`<image>`、`font-family` 或外链引用。
- ViewBox：`139 295 1497 274`，在实际字形边界外保留 16 单位安全留白，避免 C 与 t 的抗锯齿边缘被裁切。
- 色值：Charcoal Ink `#1D1D1A`；Cinnabar `#B43A2F`。

## Browser Evidence

- [桌面 1440×900](/Volumes/External/chinaknowledge/docs/reference/implementation/brand-wordmark-site-integration/home-desktop-1440x900.png)：Header 字标 180×32.94 CSS px；页面横向宽度 `1440 / 1440`，无溢出。
- [移动 390×844](/Volumes/External/chinaknowledge/docs/reference/implementation/brand-wordmark-site-integration/home-mobile-390x844.png)：Header 字标 144×26.36 CSS px；页面横向宽度 `390 / 390`，无溢出。
- [Footer 全页证据](/Volumes/External/chinaknowledge/docs/reference/implementation/brand-wordmark-site-integration/home-desktop-full-1440.png)：Footer 使用与 Header 相同的资产、alt 和 180×32.94 CSS px 尺寸。
- [定稿源与浏览器归一化对照](/Volumes/External/chinaknowledge/docs/reference/implementation/brand-wordmark-site-integration/comparison-wordmark-source-vs-browser.png)：左为定稿源，右为浏览器截图；两侧先统一到 180×33 px，再同时放大检查轮廓与颜色映射。
- Header 首页链接的 accessible name 为 `China, in Fact`；Footer 图像 alt 同名。
- 移动菜单在 390px 下完成打开与关闭；`aria-expanded` 依次为 `true / false`，过程中无横向溢出。
- 新开浏览器 tab 在桌面与移动检查中 console error/warning 均为 0。

## Validation

- `npm --prefix apps/web run typecheck`：PASS。
- `npm --prefix apps/web run lint`：PASS，保留 40 个既有 migration unused-parameter warning；0 error。
- `CMS_READ_MODE=fixtures npm --prefix apps/web run build`：PASS，75 个静态页面生成完成。
- `apps/web/design-qa.md`：`final result: passed`。
- Docker local CMS 未用于本次视觉验证：Colima socket 未运行；公共页面按已接受的 local fixture 模式启动，不修改 `.env`，也不触碰 Production 数据。
