---
doc_contract: DocContractV1
doc_type: current
authority: canonical
status: active
scope: current-state
last_verified: 2026-08-16
max_lines: 160
---

# Current State

## 当前阶段

项目已完成并归档 **P1：可运行公共产品切片**、**P1：编辑 CMS 基础**、**P2：Preview release candidate**、[`PROD-LAUNCH-001`](archive/production-launch-readiness.md)、[`PUB-CURATION-001`](archive/member-publishing-curation-closure.md) 与 [`ADMIN-UI-001`](archive/admin-payload-native-ui-reconstruction.md)。`https://chinainfact.com` 已正式匿名公开并允许搜索引擎索引。Production 为 33 张表、12 条 migration；成员直接发布、站方同文档策展与 Payload-native Admin 已上线并通过独立复审。

- 产品需求基线已经建立。
- Stitch 设计系统已经建立。
- 正式品牌名为 **China, in Fact**，正式网站为 [`chinainfact.com`](https://chinainfact.com)；域名已绑定 `china-in-fact` project，`www.chinainfact.com` 以 308 永久跳转到主域名，TLS、匿名访问和公开索引均已启用。Registrar 与 nameserver 均为 Vercel，到期日为 2027-07-27；邮件专用 DNS 保持独立。正式公共字标已经接入 Header 与 Footer；黑、朱砂红双形体与中央开放通道构成的定稿 favicon 已接入 ICO、SVG 和 Apple Touch Icon，三条 Production 路由与仓库 SHA-256 一致。商标可用性仍需另行核验。
- 信息架构采用稳定内容对象、目的入口与横向语义分层：`Stories / Guides / Places / People` 为主导航，`Understand / Visit / Live / Study / Work / Business` 为目的入口，`Topics / Geography / Situation` 为横向发现。
- 产品进一步明确为由真实中国成员直接发布、经站方选择与策展的人物驱动信息 Hub；People 同时是独立对象和其他内容背后的常驻人格层。成员个人公开与站方官方分发是两个决定，站方在同一 Article 上编辑且不改变原作者署名。
- Stitch 公共站、People 机制及 Newsletter 状态已经形成 P1 视觉基线。People 使用每周稳定的一主两辅 Spotlight，配合规则匹配、至多一人临时置顶、搜索、筛选和分页；公共 Article、Home 与 Person 已具备明显作者链接。`PUB-CURATION-001` 已把 Member publication 与 Editorial curation 两轴、同 Article 编辑和人物流量链路部署到 Production。
- P0 Stitch 设计原型、P1 可运行公共产品切片、`P1-EDITORIAL-001` 编辑 CMS 基础与 `P2-PREVIEW-001` 均已完成并归档。
- Production launch 基线已由 [`ADR-0008`](decisions/0008-production-launch-foundation.md) 接受：Vercel Pro + Neon Launch + Production Blob + Resend，区域保持 `iad1 / us-east-1`，数据库使用 7 天恢复窗口，异地备份使用 Cloudflare R2。Production 已完整执行 12 条 migration，形成 33 张 `public` 表；首位管理员、公开 Person、头像、原创 Article 封面和两篇英西 Article 均已进入恢复链路，migration 前后备份、读回、SHA、隔离恢复和 schema 断言均已通过。
- 人工域名邮箱已复用现有飞书组织完成配置：`chinainfact.com` 邮箱域名、MX、SPF、DKIM 与监测态 DMARC 均已启用，公共邮箱 `hello@chinainfact.com` 已创建并授权给产品负责人；2026-07-27 从该地址向 `gexu@lonelyreader.com` 的真实测试邮件已发送并确认收达。Resend 使用已验证的 `mail.chinainfact.com / us-east-1` 承担程序邮件，真实事务邮件已由飞书主邮箱回读收达。
- `apps/web` 是 Next.js 16 公共应用与 Payload 3.86.0 编辑 CMS 的同一部署单元。提交 `4125230` 已接通 CMS 首页、Stories/Guides、Places、People/人物页、Purpose、Topic 与 About，并在 CMS 模式停止公共 fixture 回退。Place 是独立编辑节点，对应一个 Geography；页面自动聚合同语言公开内容与人物。Payload Admin 与 API 位于 `/admin` 和 `/api`，本地 PostgreSQL 16 只绑定回环地址。
- P2 Preview 使用 Vercel Pro + Neon Free + Vercel Blob；Vercel Functions/Blob 位于 `iad1`，Neon 位于 AWS `us-east-1`。`PUB-CURATION-001` 最终受 SSO 保护的 Preview RC 为 [`china-in-fact-hlngq6kq7`](https://china-in-fact-hlngq6kq7-lonelyreader-c40e168c.vercel.app)，保持 `noindex`。
- CMS 已上线 Member publication 与 Editorial curation 两轴、同 Article 编辑、固定原作者、个人/官方 read model、稳定 `/posts` canonical、登录态草稿与 Person 预览、My work/My profile、Person 版本历史、Editor Needs attention 收件箱、账户邀请和暂停、可重试事务通知。`ADMIN-UI-001` 已恢复 Payload 原生 Nav、Dashboard、list 与 document shell，并用受支持的 workspace widget、list slot、field condition 和 Writing/Site tabs 承载业务；自动保存、并发、离页和版本边界不变，Members 开户入口已收敛为 invite-only。
- 邀请与忘记密码链接显式使用 24 小时有效期，重发后仅最新邮件有效。无效、过期或已替代链接会在显示密码框前进入恢复页；重新申请和登录入口已在 Production 匿名回读。
- Media 客户端直传会在写入 Vercel Blob 前为新文件生成唯一、不可覆盖的 pathname；Payload 记录、原图与 `card` 缩略图保持同一唯一 basename。同一浏览器文件名连续上传已在 Production 创建、读回并精确清理，权限与既有媒体未改变。
- 虚构验收流程、权限负例、匿名字段隔离、公开撤回/恢复、桌面与移动端后台和公共 Guide 已通过实现者验证与代理独立复审。复审补齐公开前八项摘要、44px 移动操作按钮和公共 Guide 窄屏无溢出；证据见 [`P1-EDITORIAL-001`](reference/implementation/p1-editorial-cms-foundation-2026-07-27.md)。
- 公共产品切片的 lint、typecheck、build、实现者浏览器验收和产品负责人复审均已通过；实现基线提交为 `6e075ea`。
- Governance V1 已建立并提交为仓库基线（`d1bd435`）。当前 72 项已实现能力按访客、Member、Editor、Super Admin 与运营维护登记在 [`App 功能登记册`](product-feature-registry.md)；255 个当前功能实现与事实文件受内容指纹门禁约束，变更后未同步登记册会使治理检查失败。
- Preview 已执行 13 条 CMS migration，形成 39 张 `public` 表；005 临时开放均已恢复原 SSO 并回到 Gateway 默认关闭。重试用虚构 User/Person/Media/Article、DCR client、connection、workflow 与 Agent event 已精确删除；当前 User/Person/Media/Article/workflow event 为 `36/32/6/32/150`，OAuth client/connection/Agent event 为 `0/0/0`。Production 已完成前后 backup/restore、既有 `20260730_181300`、Gateway-off staged release 和公开启用；当前为 13 条 migration、39 张表，Gateway 公开开启。WorkBuddy、Cursor 与 Codex 已完成真实客户端兼容验收；Codex 用现有 Member 完成三项只读调用、隐藏高角色工具、撤销失败关闭与精确 cleanup。User/Person/Media/Article/workflow 仍为 `2/2/2/3/10`，Agent client/connection/event 为 `0/0/0`，真实内容、账号和角色未改写。
- 旧 `inbox/` / `dataset/` 架构已经退出当前方案。

## 当前真相源

| 内容 | 当前真相 |
|---|---|
| 产品 | [`product-brief.md`](product-brief.md) |
| 已实现功能 | [`product-feature-registry.md`](product-feature-registry.md) |
| 设计与可见文案 | [`../DESIGN.md`](../DESIGN.md) |
| 开发与文档治理 | [`architecture/README.md`](architecture/README.md) |
| 当前执行 | [`roadmap/README.md`](roadmap/README.md) |
| 长期决定 | [`decisions/README.md`](decisions/README.md) |

## 当前执行线

[`AGENT-WORKSPACE-001`](archive/agent-workspace-member-foundation.md)至 [`AGENT-WORKSPACE-006`](archive/agent-workspace-codex-member-compatibility.md)、[`MEDIA-UPLOAD-001`](archive/media-upload-filename-collision.md)、[`MIDGAME-COLD-START-001`](archive/midgame-cold-start.md) 与 [`FAVICON-PROD-001`](archive/favicon-production-release.md) 均已完成并归档。[`INFRA-AGENT-MEDIA-001`](roadmap/checklists/agent-media-tools.md) 的代码实现、工作项验证与独立复审已在 Local `PASS`：Agent 正文合同 V2（本人图片与 YouTube 块）、`media_upload`（复用唯一文件名直传管线）、`article_set_cover` 与 `article_preview` 发布预检就绪，四类权限负例经服务级测试全部拒绝并审计；Preview/Production 运行验收尚未执行。冷启动已在 Production 完成第 14 条 migration、六个 Purpose、60 个中文母稿和 120 条英西 Site Article；60 个双语组各有 EN/ES 两条，全部 Article 为 `published + curated + _status=published`。公开由 Production MCP 分批执行，数据库聚合、三波六个匿名页面、机构署名、Guides、health 与含 122 条 post URL 的 sitemap 均已回读；恢复 run 为 `31405564024`。既有 Member、Person、Media 和 Article 未改写。

`INFRA-PERSON-PAGE-001` 已在 Local 完成正式成员名片 schema、页面与名录实现，并通过隔离 migration recovery、权限/未公开隔离、EN/ES、build、桌面 1440px 与移动 390px 浏览器主流程及独立复审。Preview 与 Production 尚未 apply 本条 migration，也未部署本实现；两环境仍分别受 migration、虚构数据验收、备份与发布门控制。

`AGENT-WORKSPACE-007` 已完成 Local 实现、工作项验证与独立复审并合入本地 `main`（`4bf7e96`）：Member Agent 可读取和保存本人 Profile 与 X 等外链、从 `my_profile_get` 取得 Person Preview path、以 prepare/commit 改变 Profile 可见状态、分页读取本人媒体和文章、读取翻译配对并建立唯一的另一语言私有 draft；`account_context`、capability 与 MCP discovery 均按当前服务端 User 角色和 connection 状态重检。Local 工具总数为 23，未新增 schema/migration 或 Person UI；统一 Preview、`main` push 与 Production 尚未执行。

`AGENT-WORKSPACE-008` 已在专用分支完成 Local 实现与工作项验证：工具总数增至 26，Editor 可从固定 Needs attention 队列发现 Article、读取严格白名单引用和 Body V2/站方字段，并以 revision、幂等、事务和写后读回保存负责人、format、四类分类、来源、freshness、编辑意见与已批准封面。普通 Editor 只能分配本人或清空，Super Admin 只能分配 active editorial role；Member、越权引用、受保护字段、并发覆盖、site-authored 保存和 curated 不完整保存均失败关闭。未新增 schema/migration、UI、009/010 能力或通知；独立终局复审、Preview、`main` push 与 Production 尚未执行。

## 当前运行边界

- 本地应用位于 `apps/web`；先运行 `npm run cms:db:up`，再用 `npm run dev` 启动。公共站与 CMS 已在 `http://127.0.0.1:3000` 完成浏览器验证。
- `PUB-CURATION-001` 使用独立临时 PostgreSQL 完成 12 条 migration apply、clean rollback/reapply、populated fail-closed 和虚构权限/状态矩阵；最终集中运行 typecheck、lint、build、editorial、migration recovery 与 diff check，全部 PASS。
- Production Neon 当前为 45 张表、14 条 migration。Person `gexu` 已公开，地点为杭州和墨西哥 Mérida，身份为 Educator and entrepreneur；西语身份、地点和简介分别为 Educador y emprendedor、Hangzhou y Mérida, México、Coherentista；外链为 `https://lonelyreader.com`。既有英西 Article 保持原 ID、slug、translation group、owner、author、正文和媒体；冷启动新增 120 条站方 Article，固定机构署名并由 MCP 公开。
- 当前 Preview CMS 账户、内容、人物、来源说明和图像均为虚构验收数据，不是可公开的真实内容；Production 没有复制这些数据。
- 正式 Vercel Production deployment `dpl_HLKSMNtWV7HfSvvckXTeWpQ8KnA4`（commit `6b6a143`，Site Infrastructure Batch 1：token 化样式、正文媒体、Web Analytics、隐私文案）为 `READY / target: production`，已绑定 `chinainfact.com`。上一稳定 deployment `dpl_6jgR7oVx5zu5KGZMN6DpQSxhckoc` 保留为代码回滚目标。仓库整合曾使 Vercel project 丢失 GitHub 连接与 Root Directory；2026-08-11 已重连 `lonelyreader/chinaknowledge` 并恢复 `rootDirectory=apps/web`，push `main` 恢复自动部署。
- 站点测量已接入：Vercel Web Analytics 已启用（无 cookie 匿名统计），前台 layout 挂 `<Analytics />`，EN/ES 隐私文案如实披露；GSC 域名资源 `sc-domain:chinainfact.com` 经 Vercel DNS TXT 自动验证，`sitemap.xml` 提交成功（2026-08-12）；Bing Webmaster 按产品负责人决定暂缓。UTM 与事件命名约定见 [`utm-and-event-naming.md`](reference/utm-and-event-naming.md)。
- 最终恢复 run [`30395828366`](https://github.com/lonelyreader/chinaknowledge/actions/runs/30395828366) 在提交 `31f38c9` 上完成数据库与媒体导出、Cloudflare R2 不可变上传、SHA 读回和隔离恢复，断言 33 张表、12 条 ledger migration、12 个 migration 文件和 8 条 workflow event。
- 2026-07-28 公共产品彻查后的修复已提交为 `4125230`；人物规模复审进一步形成 `31a7988 / 5964da7 / 3be99c6`，补齐 25 人分页、筛选、相邻周互斥轮换和跨年连续周边界。Production staged deployment 首轮 accessibility 发现空首页无 `h1` 与次级文字 4.39:1 对比度，提交 `d95e2b1` 修复后复验为唯一 `h1`、可见文字零 contrast failure、逻辑 tab order、3px focus-visible、桌面/移动无溢出或应用错误；Production 邮件适配器告警与 5xx 均为零。最终独立复审 `PASS`，P0/P1/P2 均为 0。证据见 [`Production Public Product Audit`](reference/implementation/production-public-product-audit-2026-07-28.md)。

当上述事实发生变化时更新本页；计划和愿望不得写成当前能力。
