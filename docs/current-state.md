---
doc_contract: DocContractV1
doc_type: current
authority: canonical
status: active
scope: current-state
last_verified: 2026-07-29
max_lines: 160
---

# Current State

## 当前阶段

项目已完成并归档 **P1：可运行公共产品切片**、**P1：编辑 CMS 基础**、**P2：Preview release candidate** 与 [`PROD-LAUNCH-001`](archive/production-launch-readiness.md)。`https://chinainfact.com` 已正式匿名公开并允许搜索引擎索引。Production 为 33 张表、10 条 migration，成员直接发布与站方同文档策展已经上线；[`PUB-CURATION-001`](roadmap/checklists/member-publishing-curation-closure.md) 因最终产品/UX复审发现 6 个 P1 与 2 个 P2 而继续 active。

- 产品需求基线已经建立。
- Stitch 设计系统已经建立。
- 正式品牌名为 **China, in Fact**，正式网站为 [`chinainfact.com`](https://chinainfact.com)；域名已绑定 `china-in-fact` project，`www.chinainfact.com` 以 308 永久跳转到主域名，TLS、匿名访问和公开索引均已启用。Registrar 与 nameserver 均为 Vercel，到期日为 2027-07-27；邮件专用 DNS 保持独立。商标和品牌资产尚未确定。
- 信息架构采用稳定内容对象、目的入口与横向语义分层：`Stories / Guides / Places / People` 为主导航，`Understand / Visit / Live / Study / Work / Business` 为目的入口，`Topics / Geography / Situation` 为横向发现。
- 产品进一步明确为由真实中国成员直接发布、经站方选择与策展的人物驱动信息 Hub；People 同时是独立对象和其他内容背后的常驻人格层。成员个人公开与站方官方分发是两个决定，站方在同一 Article 上编辑且不改变原作者署名。
- Stitch 公共站、People 机制及 Newsletter 状态已经形成 P1 视觉基线。People 使用每周稳定的一主两辅 Spotlight，配合规则匹配、至多一人临时置顶、搜索、筛选和分页；公共 Article、Home 与 Person 已具备明显作者链接。`PUB-CURATION-001` 已把 Member publication 与 Editorial curation 两轴、同 Article 编辑和人物流量链路部署到 Production。
- P0 Stitch 设计原型、P1 可运行公共产品切片、`P1-EDITORIAL-001` 编辑 CMS 基础与 `P2-PREVIEW-001` 均已完成并归档。
- Production launch 基线已由 [`ADR-0008`](decisions/0008-production-launch-foundation.md) 接受：Vercel Pro + Neon Launch + Production Blob + Resend，区域保持 `iad1 / us-east-1`，数据库使用 7 天恢复窗口，异地备份使用 Cloudflare R2。Production 已完整执行 10 条 migration，形成 33 张 `public` 表；首位管理员、公开 Person、头像、原创 Article 封面和两篇英西 Article 均已进入恢复链路，migration 前后备份、读回、SHA、隔离恢复和 schema 断言均已通过。
- 人工域名邮箱已复用现有飞书组织完成配置：`chinainfact.com` 邮箱域名、MX、SPF、DKIM 与监测态 DMARC 均已启用，公共邮箱 `hello@chinainfact.com` 已创建并授权给产品负责人；2026-07-27 从该地址向 `gexu@lonelyreader.com` 的真实测试邮件已发送并确认收达。Resend 使用已验证的 `mail.chinainfact.com / us-east-1` 承担程序邮件，真实事务邮件已由飞书主邮箱回读收达。
- `apps/web` 是 Next.js 16 公共应用与 Payload 3.86.0 编辑 CMS 的同一部署单元。提交 `4125230` 已接通 CMS 首页、Stories/Guides、Places、People/人物页、Purpose、Topic 与 About，并在 CMS 模式停止公共 fixture 回退。Place 是独立编辑节点，对应一个 Geography；页面自动聚合同语言公开内容与人物。Payload Admin 与 API 位于 `/admin` 和 `/api`，本地 PostgreSQL 16 只绑定回环地址。
- P2 Preview 使用 Vercel Pro + Neon Free + Vercel Blob；Vercel Functions/Blob 位于 `iad1`，Neon 位于 AWS `us-east-1`。`PUB-CURATION-001` 最终受 SSO 保护的 Preview RC 为 [`china-in-fact-7jm00o79j`](https://china-in-fact-7jm00o79j-lonelyreader-c40e168c.vercel.app)，保持 `noindex`。
- CMS 已上线 Member publication 与 Editorial curation 两轴、同 Article 编辑、固定原作者、个人/官方 read model、稳定 `/posts` canonical、登录态草稿与 Person 预览、My work/My profile、Person 版本历史、Editor 候选队列、账户邀请和暂停、可重试事务通知。普通 API 不能绕过发布/显隐动作，站方字段由服务端隔离，未策展文章不会进入官方内容入口。
- 虚构验收流程、权限负例、匿名字段隔离、公开撤回/恢复、桌面与移动端后台和公共 Guide 已通过实现者验证与代理独立复审。复审补齐公开前八项摘要、44px 移动操作按钮和公共 Guide 窄屏无溢出；证据见 [`P1-EDITORIAL-001`](reference/implementation/p1-editorial-cms-foundation-2026-07-27.md)。
- 公共产品切片的 lint、typecheck、build、实现者浏览器验收和产品负责人复审均已通过；实现基线提交为 `6e075ea`。
- Governance V1 已建立并提交为仓库基线（`d1bd435`）。
- Preview 与 Production 均已执行全部 10 条 CMS migration，形成 33 张表。Preview 只使用 `.test` 账户与虚构验收内容；Production 当前为 1 名 Super Admin、1 个公开 Person、2 条已批准 Media、2 篇同一翻译组下的 Published + Curated Article、8 条 workflow event 和 0 Place，未复制 Preview 夹具。
- 旧 `inbox/` / `dataset/` 架构已经退出当前方案。

## 当前真相源

| 内容 | 当前真相 |
|---|---|
| 产品 | [`product-brief.md`](product-brief.md) |
| 设计与可见文案 | [`../DESIGN.md`](../DESIGN.md) |
| 开发与文档治理 | [`architecture/README.md`](architecture/README.md) |
| 当前执行 | [`roadmap/README.md`](roadmap/README.md) |
| 长期决定 | [`decisions/README.md`](decisions/README.md) |

## 当前执行线

当前唯一 active checklist 是 `PUB-CURATION-001`。Production migration、域名切换、真实数据读回与迁移前后恢复演练已经完成，技术/权限/migration 复审为 `PASS`；产品/UX复审暂为 `BLOCK (P0/P1/P2 = 0/6/2)`，需继续收口 Editor 作者旅程、双语 Person、默认任务收件箱、媒体/外链、防丢稿、真实作者外链、持久 My profile 和直接语言 canonical。

## 当前运行边界

- 本地应用位于 `apps/web`；先运行 `npm run cms:db:up`，再用 `npm run dev` 启动。公共站与 CMS 已在 `http://127.0.0.1:3000` 完成浏览器验证。
- `PUB-CURATION-001` 使用独立临时 PostgreSQL 完成 10 条 migration apply、clean rollback/reapply、populated fail-closed 和虚构权限/状态矩阵。GitHub run [`30388465174`](https://github.com/lonelyreader/chinaknowledge/actions/runs/30388465174) 在全新 PostgreSQL 上完成治理、migration、权限、通知、lint、typecheck、依赖审计、build 与路由 smoke，全部 PASS。
- Production Neon 当前为 33/10。Person `gexu` 已公开，地点为杭州和墨西哥 Mérida，身份为 Educator and entrepreneur，简介为 A coherentist，语言为英语和西班牙语。英西 Article 保持原 ID、slug、translation group、owner、author、正文和媒体并原地映射为 Published + Curated；重复 locale、混合 owner/author、owner/byline mismatch 和缺失 owner/author 均为 0。
- 当前 Preview CMS 账户、内容、人物、来源说明和图像均为虚构验收数据，不是可公开的真实内容；Production 没有复制这些数据。
- 正式 Vercel Production deployment [`dpl_2gJFdjQEQ9kfyzYqRdUmnDKFJh5y`](https://china-in-fact-30q42u0kz-lonelyreader-c40e168c.vercel.app) 为 `READY / target: production / iad1`，使用 `cms + blob + indexable=true`。它先以 `--skip-domain` 候选态完成真实 Home、英西 Article、Person、语言跳转、后台登录、robots、sitemap、桌面与 390×844 移动端验证，再 promote 到 `chinainfact.com`；100 条运行日志中 error 和 5xx 均为 0。
- migration 前 run [`30384139368`](https://github.com/lonelyreader/chinaknowledge/actions/runs/30384139368) 与 migration 后 run [`30389201732`](https://github.com/lonelyreader/chinaknowledge/actions/runs/30389201732) 均完成数据库与媒体导出、Cloudflare R2 不可变上传、SHA 读回和隔离恢复；后者断言 33 张表、10 条 ledger migration、10 个 migration 文件和 8 条 workflow event。第一次迁移后重跑请求因 Docker Hub 网络重置在导出前失败，不构成数据或恢复点损坏。
- 2026-07-28 公共产品彻查后的修复已提交为 `4125230`；人物规模复审进一步形成 `31a7988 / 5964da7 / 3be99c6`，补齐 25 人分页、筛选、相邻周互斥轮换和跨年连续周边界。Production staged deployment 首轮 accessibility 发现空首页无 `h1` 与次级文字 4.39:1 对比度，提交 `d95e2b1` 修复后复验为唯一 `h1`、可见文字零 contrast failure、逻辑 tab order、3px focus-visible、桌面/移动无溢出或应用错误；Production 邮件适配器告警与 5xx 均为零。最终独立复审 `PASS`，P0/P1/P2 均为 0。证据见 [`Production Public Product Audit`](reference/implementation/production-public-product-audit-2026-07-28.md)。

当上述事实发生变化时更新本页；计划和愿望不得写成当前能力。
