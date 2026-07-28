---
doc_contract: DocContractV1
doc_type: reference
authority: evidence
status: active
scope: production-public-product-audit
last_verified: 2026-07-28
max_lines: 220
change_id: PROD-LAUNCH-001
---

# Production Public Product Audit

## Verdict

`BLOCK`（针对 Production release）。审计开始时公共产品仍是 P1 fixture 原型与单篇 Guide CMS 证明的组合；当前本地候选已关闭下列代码 finding，非主持独立复审首轮发现 5 个 P1、3 个 P2，修复后第二轮为 `PASS`，P0/P1/P2 均为零。候选仍未提交，也未完成受保护 Preview 全量回读或 Production migration；不得进入真实数据、Production deploy、域名绑定或内容公开。

## Findings At Audit Start

1. 首页、Stories、Places、People、人物页无条件读取 `src/content/fixtures.ts`；`CMS_READ_MODE=cms` 只影响 Guides。
2. CMS 只有 Guide 公开 loader。Reporting、Analysis、First-person、Update 即使标为 Public，也没有 Stories 详情页；People 和 Places 同样没有 CMS 公共读取。
3. 首期合同中的 `/stories/[slug]`、`/places/[slug]`、`/purposes/[slug]`、`/topics/[slug]`、`/about` 尚不存在。本地路由回读均为 404。
4. Places 已由 ADR-0003 固定为一等对象，但 CMS 没有 Places collection，Article format 也不能表达 Place。
5. People schema 没有 portrait；Article `coverImage` 可空且公开 Guide 不读取它。CMS Guide 仍使用 fixture portrait 与 Shanghai fixture image。
6. 首页没有 lead 排期、推荐池、到期回退、Latest/Recently updated 生成逻辑；People Spotlight 实际为 `people.slice(0, 3)`，没有周稳定轮换、排除、置顶或曝光约束。Article schedule publish 被关闭。
7. 公开门禁允许 cover、Freshness 和 Sources 缺失；确认界面只显示 `Not set`。CMS Guide 缺 Freshness 时会显示硬编码日期 `2026-07-27`。分类依产品合同允许为零，不列作强制发布项。
8. Author 可直接更新已公开 Person 的简介、slug、Topics 和外链，没有人物草稿、复审、版本或同意审计；这与隐私页的编辑审核和作者批准承诺不一致。
9. Article `owner` 与公开署名 `author` 没有关联校验；Author 可以提交署名为其他 Person 的内容。
10. 语言切换只替换 URL locale，不按 `translationGroup` 找到另一语言 slug。People Language 筛选没有任何过滤或导航行为。
11. Production 仍为零用户；只有 Super Admin 能创建账号，但 checklist 把真实账户放在 staged deployment 前，且没有首位管理员初始化、邀请或批量开户闭环。
12. CI 使用 `CMS_READ_MODE=fixtures` 构建；editorial test 只证明单篇 Guide。现有检查不会验证 Production 首页、Stories、Places、People、真实媒体或双语跳转，因此此前全部通过并不能证明公开产品可运营。

## Contract Conflicts

- `DESIGN.md` 禁止把文章正文作为硬编码 Production 内容，但 Production 公共页面仍引用 fixture。
- `product-brief.md` 要求四个稳定对象、首期详情路由、真实 portrait、cover、来源、发布时间、Freshness、首页混合编排和 People 分层发现；现有 schema 与公共路由只覆盖其中一部分。
- `P1-EDITORIAL-001` 明确只用一位虚构作者和一篇 Guide 证明工作流，不应被解释为全站 CMS 接入完成。
- `PROD-LAUNCH-001` Scope 已要求替换公开 fixture，但 Work 从基础设施直接跳到真实数据，缺少公共产品闭环实现与验收项。

## Verified Healthy Boundaries

- `main` 与 `origin/main` 同步；只读审计开始与证据落文档前 worktree clean，当前修复树按授权保留未提交改动。
- Vercel 实时回读只有 Ready Preview 与一条 Error Production；没有 Ready Production deployment，`chinainfact.com` 没有项目 alias。
- Production database 和 Blob 仍为空；没有真实数据或公开事故。
- `governance:check`、lint、typecheck、environment、Newsletter 和 Preview storage tests 通过；lint 只有 20 条 Payload 自动生成 migration 的 unused-argument warnings。
- Newsletter、环境守卫、数据库与媒体备份恢复不是本轮发现的失败面。

## Local Remediation Status

以下改动只存在于当前本地修复树，尚未提交、应用 Production migration 或部署：

- 已关闭：`CMS_READ_MODE=cms` 下首页、Stories、Guides、Places、People、人物页不再读取 fixture；补齐 Story、Place、Purpose、Topic 与 About 详情路由。
- 已关闭：公共内容使用 CMS portrait/cover；Guide 不再伪造 Freshness；公开门禁要求 cover、Sources、Guide Freshness、人物 portrait 与作者批准记录，并在首次公开时记录 `publishedAt`。
- 已关闭：Author 署名必须属于自己的 Person；人物公开要求真实公开贡献，匿名 API 不返回账户、人物状态或批准时间。
- 已关闭：错误语言 slug 会按公开 `translationGroup` 跳到目标语言 canonical slug；People 搜索、Topics、Places、Language 和分页使用真实数据。
- 已关闭：首页可在无人每日排序时按发布时间自动回退；People 使用按周稳定轮换，不在刷新时随机变化。
- 已关闭：首页 lead 与推荐池支持生效/到期窗口；无有效配置时回退最新合格内容。Spotlight 支持最多一人临时置顶、排除和在人物池足够时避开上周入选者。
- 已关闭：Place 作为独立编辑节点保存名称、简介、封面、语言/翻译关系和对应 Geography；相关 Stories、Guides 与 People 从同语言公开内容自动生成，无相关公开内容时不能公开。
- 已关闭：Preview CI 改为临时 PostgreSQL + 全量 migration + editorial integration + CMS build/runtime smoke，覆盖 Guide、Story、People、人物页和双语跳转。
- 已关闭：Profile revision 保存作者完整资料快照；Author 只能维护自己的 Draft/Changes requested 并提交，Editor 只能要求修改或整体应用，不能静默改写提案。数据库唯一键保证每人至多一条开放修订，更新事务先锁定并核对当前 revision，避免并发 Apply/Changes requested 造成 Person 与审核状态分叉；应用记录不允许通过 collection access 删除。
- 已关闭：Media 增加 Editor 公开使用批准；上传归属由服务端无条件写入，不能由 Author 伪造。Payload/API 和 Payload 文件路由内，未批准记录只对真实上传者与编辑角色可见；Article、Person 与 Place 公开时校验实际媒体记录。底层 public Blob URL 不受这层权限保护，敏感文件继续禁止进入该 collection。
- 已关闭：首位 Super Admin CLI 在锁定事务内执行零用户检查与创建；批量开户默认 dry-run，只允许 Author/Editor，账户写入为单事务，邮件阶段逐项汇总并支持失败后重发。所有 apply 明确声明应用环境和数据库目标，Production 另有专属确认且强制密码重置邮件。
- 尚未关闭：受保护 Preview 上的完整公共路由、移动端、可访问性与 release-level 独立复审；本地代码/文档 slice 的第二轮独立复审已 PASS。
- Production backup workflow 仍按已部署的 1 条 migration 断言；四条待应用 migration 获批应用时，必须与 5 条 migration、29 张表的恢复断言原子更新，不能提前改坏现有每日备份。

## Media Storage Boundary

- Vercel 官方把 public store 定义为“任何拿到 URL 的人都可读”，private store 必须经 Function 鉴权读取；两种 store 不能事后互换。[Vercel Blob](https://vercel.com/docs/vercel-blob)
- Vercel Private Blob 已于 2026-06-30 GA，但当前项目锁定的 `@payloadcms/storage-vercel-blob@3.86.0` 类型和客户端实现仍只接受 `access: 'public'`。[Vercel GA](https://vercel.com/changelog/vercel-private-blob-is-now-generally-available)
- Payload 官方 adapter 会保留 `/api/media/file/...` 路径并在读取时执行 collection access；本次匿名隔离依赖这层能力，但它不能把底层 public Blob 变成机密存储。[Payload Storage Adapters](https://payloadcms.com/docs/upload/storage-adapters)
- 结论：当前 Media 可以承载“待编辑批准、最终准备公开”的图片，不能承载证件、合同、未获授权的人像原件或其他敏感文件。真正私密媒体不是本次上线需要，后续若出现需求再建立第二个 private collection/store。

## Local Verification Update

- 空 PostgreSQL 16 完整应用 5 条 migration 后为 29 张 `public` 表；Profile revision 并发双创建只有一条成功，并发 Apply/Changes requested 只有一个状态提交且 Person 与最终状态一致；伪造媒体上传者被服务端覆盖。匿名与跨 Author 媒体隔离、未批准媒体发布、作者/编辑越权、公开版本保持与整体应用负例均通过。
- `migrate:down` 按最新到最旧完整回滚 5 条 migration 后重新应用并复测通过。Payload 3.86 的 `migrate:reset` 会按错误顺序执行 down，本项目发布与恢复流程禁止使用该命令。
- 账号工具在独立空库完成两次并发首位管理员 apply，结果严格为一次成功、一次非空库拒绝、最终仅一名用户；2 人批量写入、重复运行、目标环境缺失拒绝和密码重置重发也已验证。全部使用虚构 `.test` 账户，未触碰 Production 或真实邮件。
- CMS production build 后以 1440px 与 390px 浏览器逐页验证 Home、People、Person、Story、Place 和西班牙语 Home：状态均为 200，无 console/page/network error、横向溢出、损坏图片、无名交互控件或缺失 form label；英语/西班牙语 `html lang` 已分别回读为 `en / es`。证据截图：[`desktop home`](assets/production-public-closure/desktop-home.png)、[`mobile home`](assets/production-public-closure/mobile-home.png)、[`mobile people`](assets/production-public-closure/mobile-people.png)。
- 非主持独立复审首轮提出 5 个 P1 与 3 个 P2；并发唯一性、事务锁、生产失败关闭、媒体归属、批量写入/邮件摘要、Blob 表述和审核记录保留全部修复。第二轮只读复审 `PASS`，P0/P1/P2 为零；该结论只覆盖当前本地修复树。

## Account Startup Contract

- `npm run cms:bootstrap-super-admin` 默认只显示计划；`--apply` 要求显式 `APP_ENV`、匹配的 `CMS_DATABASE_TARGET`、`CMS_BOOTSTRAP_CONFIRM=CREATE_FIRST_SUPER_ADMIN`、邮箱、姓名和至少 14 位密码，且在数据库锁定事务内确认 Users 为零。Production 另需 `CMS_BOOTSTRAP_PRODUCTION_CONFIRM=CREATE_FIRST_SUPER_ADMIN_IN_PRODUCTION`。密码只从环境读取，不进入参数或输出。
- `npm run cms:provision-accounts -- --input=/private/path/accounts.json` 默认 dry-run。输入只允许 `email / displayName / author|editor`，单批最多 500 人；重复邮箱和既有账户字段冲突在写前失败。
- 所有开户 apply 都要求显式 `APP_ENV`、匹配的 `CMS_DATABASE_TARGET`、`CMS_ACCOUNT_OPERATOR_EMAIL` 指向现有 Super Admin 和 `CMS_ACCOUNT_PROVISION_CONFIRM=PROVISION_CMS_ACCOUNTS`。Production 另需 `CMS_ACCOUNT_PRODUCTION_CONFIRM=PROVISION_CMS_ACCOUNTS_IN_PRODUCTION`、HTTPS `CMS_ACCOUNT_RESET_BASE_URL` 和 `--send-reset-email`。账户批次在单事务中写入和回读；邮件在提交后逐项尝试并完整输出成功/失败，失败项用 `--resend-existing` 恢复。
- 真实名单和命令输出含个人数据，不提交 Git；执行、邮件发送和真实数据仍分别过门禁。

## Required Recovery Sequence

1. 用纯虚构 Preview 数据重新跑完整公共产品、权限、语言、媒体与运营机制验收。
2. 在受保护 Preview 完成移动端、可访问性和 release-level 独立复审。
3. PASS 后重新申请 Production migration、首位管理员、真实账户、真实数据、staged deploy 与公开门禁。

## Evidence Pointers

- Public fixture surfaces：`apps/web/src/app/(frontend)/[locale]/**`
- CMS public loader：`apps/web/src/content/cms.ts`
- Schema and permissions：`apps/web/src/collections/**`、`apps/web/src/cms/**`
- CI boundary：`.github/workflows/preview-checks.yml`
- Product contract：`docs/product-brief.md`、`DESIGN.md`、ADR-0003/0004
- Execution contract：`docs/roadmap/checklists/production-launch-readiness.md`
