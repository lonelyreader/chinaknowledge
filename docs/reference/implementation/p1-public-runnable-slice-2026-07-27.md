---
doc_contract: DocContractV1
doc_type: reference
authority: evidence
status: accepted
scope: p1-public-runnable-slice-evidence
last_verified: 2026-07-27
max_lines: 180
change_id: P1-WEB-001
---

# P1 Public Runnable Slice Evidence

## Result

`apps/web` 已实现 fixture-only 的英语与西班牙语公共站切片，覆盖首页、Guides、Guide、Stories、Places、People、24 位人物主页和 Newsletter 浏览器状态。CMS、认证、数据库、邮件发送、真实数据和部署均未接入。

本页记录实现者验证与非实现者复审。2026-07-27，产品负责人完成页面评审并确认 `P1 通过，批准提交`；实现基线已提交为 `6e075ea`，P1 checklist 已归档。

## Automated Checks

| Check | Result |
|---|---|
| `npm run lint` | PASS |
| `npm run typecheck` | PASS |
| `npm run build` | PASS，66 个静态页面 |
| `npm audit --omit=dev` | PASS，0 vulnerabilities |
| `npm run governance:check` | PASS，28 docs / 9 canonical scopes / 83 changed paths covered |
| `git diff --check` | PASS |

完整 `npm audit` 仍报告 9 个 high severity 开发工具链告警，均来自 ESLint 9 / `eslint-config-next` 的 `minimatch` 依赖链。升级到 ESLint 10 会使当前 React lint plugin 运行失败；未使用 `--force` 降级或破坏 lint。生产依赖审计为 0。

## Browser Checks

- `/` 返回 307 到 `/en`。
- `/fr` 与不存在的 Guide 返回 404，没有静默语言回退。
- `/en` 与 `/es` 使用独立 URL 和对应界面、标题与正文。
- 首页、Guide、People 和作者页在 `1440 × 1000` 与 `390 × 844` 下没有横向溢出。
- 桌面 People 首屏目录实际渲染 24 人；移动端实际渲染 12 人，并显示 `1 / 2` 分页。
- People 姓名搜索以 `Chen` 验证后只保留 1 个结果。
- 移动菜单打开后保留主导航和 Subscribe。
- 首页当前可见交互目标在桌面与移动端均不小于 `44 × 44px`。
- Newsletter 用合法邮箱进入成功状态；西班牙语页面用非法邮箱进入必要错误状态。
- 首页、People 与 Guide 的 WCAG A / AA axe 检查均为 0 violations。
- 浏览器没有 Next.js error overlay 或运行时 page error。

## Screenshots

| Surface | Evidence |
|---|---|
| Homepage desktop | [`p1-home-desktop-full.png`](assets/p1-home-desktop-full.png) |
| Homepage mobile | [`p1-home-mobile-full.png`](assets/p1-home-mobile-full.png) |
| People desktop | [`p1-people-desktop-full.png`](assets/p1-people-desktop-full.png) |
| People mobile | [`p1-people-mobile-full.png`](assets/p1-people-mobile-full.png) |
| Guide desktop | [`p1-guide-desktop-full.png`](assets/p1-guide-desktop-full.png) |
| Guide mobile | [`p1-guide-mobile-full.png`](assets/p1-guide-mobile-full.png) |
| Author desktop | [`p1-author-desktop-full.png`](assets/p1-author-desktop-full.png) |
| Newsletter success desktop | [`p1-newsletter-success-desktop.png`](assets/p1-newsletter-success-desktop.png) |
| Newsletter error mobile | [`p1-newsletter-error-mobile.png`](assets/p1-newsletter-error-mobile.png) |

## Fixture And Asset Boundary

- 全部人物、姓名、身份、文章、来源说明、日期和外部链接都是虚构 fixtures。
- 24 张人物肖像与上海街道图由内置图像生成工具制作，并复制到 `apps/web/public/images/fixtures/`；它们不代表真实作者或事实现场。
- 图像生成源位于 `/Users/gexu/.codex/generated_images/019f9e10-2107-7a90-b802-99f8c382bd05/`。项目引用的稳定副本位于仓库内。
- Newsletter 不发送请求，也不持久化邮箱。

## Review

- Reviewer：产品负责人，非实现者。
- Result：PASS。
- Scope：响应式、语言路由、可见文案、人物机制、Newsletter 状态和 fixture 边界。
- Approval：批准提交并归档 `P1-WEB-001`。
