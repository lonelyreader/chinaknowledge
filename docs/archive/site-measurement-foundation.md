---
doc_contract: DocContractV1
doc_type: checklist
authority: execution
status: completed
scope: site-measurement-foundation
last_verified: 2026-08-12
max_lines: 120
change_id: INFRA-MEASURE-001
risk_tier: base
validation_profile: work_item
allowed_paths: apps/web/src/app/(frontend)/[locale]/layout.tsx, apps/web/src/app/(frontend)/[locale]/privacy/**, apps/web/package.json, apps/web/package-lock.json, docs/roadmap/**, docs/reference/**, docs/product-feature-registry.md, docs/current-state.md, docs/archive/README.md, docs/archive/site-measurement-foundation.md
approval_gates: third-party-service-enable, legal-copy, dns, production-deploy, commit, merge, push
---

# INFRA-MEASURE-001 测量接入

目标：网站获得基础测量能力——Vercel Web Analytics 采集访问与自定义事件，Google Search Console 与 Bing Webmaster 接入索引监测，隐私文案如实反映采集方式。本项是所有后续基础设施工作效果验证的前置。

父级：[`Site Infrastructure Program`](../roadmap/site-infrastructure-program.md)。

## Scope

- 在 Vercel project `china-in-fact` 启用 Web Analytics（dashboard 动作，需单独批准），前端接入 `@vercel/analytics` 组件。
- 注册 GSC 与 Bing Webmaster，完成域名验证（优先 meta tag 或既有 DNS 记录；新增 DNS 记录属 dns 门禁），提交 `sitemap.xml`，取回索引覆盖基线。
- 核对 `/{locale}/privacy` 文案与实际采集一致：Vercel WA 为无 cookie 匿名统计；文案修改属 legal-copy 门禁，EN 与 ES 分别核对。
- 建立 UTM 与自定义事件命名约定（写入 reference），供 OUTBOUND-001 与社交流水线复用。

## No-go

- 不引入 Google Analytics、cookie、指纹或任何跨站跟踪。
- 不修改 robots、sitemap 生成逻辑、公开路由或 SEO metadata。
- 不在本项启用 Speed Insights 或其他付费附加项。
- 不代表用户完成需要账号所有权的注册动作；提供步骤并由产品负责人执行或明确授权。

## Acceptance

- [x] Vercel Web Analytics 已启用（CLI `vercel project web-analytics` 返回 `enabled: true`），`<Analytics />` 已随 Batch 1 部署上线；count 非零留待首批真实流量（脚本路由 `/_vercel/insights/script.js` 生产 200 已确认）。
- [x] GSC 域名资源 `sc-domain:chinainfact.com` 经 Vercel DNS TXT 记录自动验证，`https://chinainfact.com/sitemap.xml` 提交成功（2026-08-12）；新资源首日无索引数据，基线记 0。Bing Webmaster 按产品负责人决定 deferred（2026-08-12），不阻塞本项收口。
- [x] EN/ES 隐私文案与实际采集一致，legal-copy 已获批准（2026-08-11）。
- [x] UTM 与事件命名约定已写入 [`utm-and-event-naming.md`](../reference/utm-and-event-naming.md)。

## Validation

- `npm run governance:check`、`git diff --check`、lint、build。
- 浏览器验证 analytics 请求发出且无 console 错误；390px 隐私页无溢出。
- Analytics API count 读回；GSC sitemap 状态读回。

## Writeback

- 完成后：feature registry 运营段新增测量能力条目并更新指纹；current-state 记录测量接入事实；本 checklist 归档。

## Current gate

- [x] 用户批准建立本 checklist（2026-08-11，接手规划批次）。
- [x] 代码与文档部分完成：前台 layout 接入 `@vercel/analytics`，UTM 与事件命名约定写入 [`docs/reference/utm-and-event-naming.md`](../reference/utm-and-event-naming.md)（2026-08-11，已随 Batch 1 提交）。
- [x] 用户授权账号侧动作（"全都批准"，2026-08-11）：WA 经 CLI 启用；GSC 在用户登录的 Cursor 浏览器会话中完成注册、DNS TXT 验证与 sitemap 提交；Bing deferred（2026-08-12，用户决定）。
- [x] 隐私文案修订获 legal-copy 批准（2026-08-11）。
- [x] Production 部署获批准并完成（`dpl_HLKSMNtWV7HfSvvckXTeWpQ8KnA4`，2026-08-11）。
- [x] 本项收口（2026-08-12，用户确认 "GSC 做完就算完结"）；WA count 首批流量读回归入日常运营，不再单列工作项。
