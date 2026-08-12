---
doc_contract: DocContractV1
doc_type: checklist
authority: execution
status: active
scope: feeds-structured-data
last_verified: 2026-08-12
max_lines: 120
change_id: INFRA-FEEDS-001
risk_tier: base
validation_profile: work_item
allowed_paths: apps/web/src/app/feed/**, apps/web/src/lib/structured-data.ts, apps/web/src/app/(frontend)/[locale]/posts/[slug]/page.tsx, apps/web/src/app/(frontend)/[locale]/people/[slug]/page.tsx, docs/roadmap/**, docs/reference/**, docs/current-state.md, docs/product-feature-registry.md
approval_gates: preview, production-deploy, commit, merge, push
---

# INFRA-FEEDS-001 Feed 与结构化数据

目标：站点获得订阅与搜索引擎语义底盘——按 locale 的 RSS/JSON Feed，文章页 `BreadcrumbList` 与成员稿 author 指向 Person URL 的 JSON-LD，Person 页 `ProfilePage`/`Person` JSON-LD。

父级：[`Site Infrastructure Program`](../site-infrastructure-program.md)。本项对 posts/people 页面文件的改动仅限插入 JSON-LD，合并顺序在 ARTICLE-TEMPLATE 与 PERSON-PAGE 之后 rebase（见父级并行规则）。

## Scope

- `/feed/en.xml`、`/feed/es.xml`（RSS 2.0，公开 Article，含机构/成员署名与封面 enclosure）；JSON Feed 同路径 `.json` 变体。
- `structured-data.ts` 共享构造器：`Article`（补 author → Person URL）、`BreadcrumbList`、`ProfilePage`/`Person`。
- 文章页与 Person 页注入上述 JSON-LD（`<script type="application/ld+json">`，服务端序列化，无用户输入直插）。
- feed 与 JSON-LD 只含已公开内容与已公开 Person。

## No-go

- 不改页面模板结构与样式（只加 JSON-LD 注入点）。
- 不改 sitemap、robots 与既有 metadata 字段语义。
- 不引入 feed 生成依赖；手写序列化并转义。
- 未公开内容、未公开 Person、草稿与预览一律不进 feed 与 JSON-LD。

## Acceptance

- [ ] 两个 locale 的 RSS 与 JSON Feed 可获取、通过 W3C validator、条目与公开列表一致。
- [ ] 文章页 JSON-LD 含 BreadcrumbList 与 author Person URL（成员稿）；Person 页含 ProfilePage/Person；Rich Results 测试无错误。
- [ ] 未公开数据负例：撤回文章从 feed 消失；未公开 Person 不出现在任何 JSON-LD。
- [ ] XML/JSON 转义正确（含中文、引号、CDATA 场景）。

## Validation

- lint、typecheck、build、`npm run governance:check`、`git diff --check`。
- validator 与 Rich Results 证据留档。

## Writeback

- feature registry 与 current-state 写回；证据入 reference；本 checklist 归档。

## Current gate

- [x] 用户批准 Batch 2 启动并冻结本项范围（2026-08-12）。
- [ ] 实现完成后 preview/merge/push/production-deploy 分别批准（页面注入部分在两个页面子级合并后 rebase）。
