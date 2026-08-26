---
doc_contract: DocContractV1
doc_type: current
authority: canonical
status: active
scope: current-state
last_verified: 2026-08-27
max_lines: 160
---

# Current State

## 当前阶段

项目已完成并归档 **P1：可运行公共产品切片**、**P1：编辑 CMS 基础**、**P2：Preview release candidate**、[`PROD-LAUNCH-001`](archive/production-launch-readiness.md)、[`PUB-CURATION-001`](archive/member-publishing-curation-closure.md) 与 [`ADMIN-UI-001`](archive/admin-payload-native-ui-reconstruction.md)。`https://chinainfact.com` 已正式匿名公开并允许搜索引擎索引。Production 当前为 49 张表、15 条 migration；成员直接发布、站方同文档策展、Payload-native Admin 与 33-tool Agent workspace 已上线。

- 产品需求基线已经建立。
- Stitch 设计系统已经建立。
- 正式品牌名为 **China, in Fact**，正式网站为 [`chinainfact.com`](https://chinainfact.com)；域名已绑定 `china-in-fact` project，`www.chinainfact.com` 以 308 永久跳转到主域名，TLS、匿名访问和公开索引均已启用。Registrar 与 nameserver 均为 Vercel，到期日为 2027-07-27；邮件专用 DNS 保持独立。正式公共字标已经接入 Header 与 Footer；黑、朱砂红双形体与中央开放通道构成的定稿 favicon 已接入 ICO、SVG 和 Apple Touch Icon，三条 Production 路由与仓库 SHA-256 一致。商标可用性仍需另行核验。
- 信息架构采用稳定内容对象与横向语义分层：`People / Stories / Guides / Places` 为主导航，`Understand / Visit / Live / Study / Work / Business` 保留为内容目的入口，`Topics / Geography / Situation` 为横向发现。
- 2026-08-26 产品方向已按当前供给推进为人物与社群优先：首要承诺是让世界遇见真实、有趣、有灵魂的中国人，并从他们正在做的事继续。People 是中心对象；项目、作品、经历、问题和内容都可成为人物证据。网站负责长期人物发现，Discord 负责交流与协作，Reddit 从真实问题进入外部对话；详见 ADR-0012。产品负责人已通过 Figma AI 的 Home、People、Person V3。
- [`PEOPLE-COMMUNITY-FRONTEND-001`](roadmap/checklists/people-community-frontend.md) 已以 `e974420` 完成本地实现，并在受 SSO 保护的 Preview `dpl_FKoZxwC5K6orRAHDmbSNDvoQPQtz` 完成真实 CMS 与响应式读回：Home 先找人与人物列表，People 移除 Spotlight/判词专题开场，Person 先呈现身份、当前工作、能帮什么与公开连接动作；公共导航为 `People / Stories / Guides / Places + Join Discord`。实现只读取既有 Person、contribution、canHelpWith、links 与公开 Article，不含新 schema 或真实数据改动；Production 仍保持上次发布版本。
- [`SITE-TOKEN-SYSTEM-RETHEME-001`](roadmap/checklists/site-token-system-retheme.md) 已在同一 Figma 核心文件建立 119 个 Primitive、Semantic、Typography 与 Dimension 变量、18 个桌面/移动文字样式、3 个效果样式、7 类核心组件及连接/发现/阅读/工具模板；公共站的 Geist、Newsreader、Geist Mono 与暖纸/墨色/朱砂语义 Token 已随 `e974420` 提交，旧冷靛蓝只读基线退出。EN/ES 的 Home、People、Person、Stories、Guides、Article、Places、About、Newsletter 已完成本地 1440/768/390px 与 Preview 1440/390px 回读；Production 尚未发布。
- P0 Stitch 设计原型、P1 可运行公共产品切片、`P1-EDITORIAL-001` 编辑 CMS 基础与 `P2-PREVIEW-001` 均已完成并归档。
- Production launch 基线已由 [`ADR-0008`](decisions/0008-production-launch-foundation.md) 接受：Vercel Pro + Neon Launch + Production Blob + Resend，区域保持 `iad1 / us-east-1`，数据库使用 7 天恢复窗口，异地备份使用 Cloudflare R2。Production 已完整执行 12 条 migration，形成 33 张 `public` 表；首位管理员、公开 Person、头像、原创 Article 封面和两篇英西 Article 均已进入恢复链路，migration 前后备份、读回、SHA、隔离恢复和 schema 断言均已通过。
- 人工域名邮箱已复用现有飞书组织完成配置：`chinainfact.com` 邮箱域名、MX、SPF、DKIM 与监测态 DMARC 均已启用，公共邮箱 `hello@chinainfact.com` 已创建并授权给产品负责人；2026-07-27 从该地址向 `gexu@lonelyreader.com` 的真实测试邮件已发送并确认收达。Resend 使用已验证的 `mail.chinainfact.com / us-east-1` 承担程序邮件，真实事务邮件已由飞书主邮箱回读收达。
- `apps/web` 是 Next.js 16 公共应用与 Payload 3.87.1 编辑 CMS 的同一部署单元。Payload 在 012 发布门中由 3.86.0 锁步升级到首个同时移除脆弱 `image-size` 并修复 `undici` 的稳定补丁；Next/React 未升级。提交 `4125230` 已接通 CMS 首页、Stories/Guides、Places、People/人物页、Purpose、Topic 与 About，并在 CMS 模式停止公共 fixture 回退。Place 是独立编辑节点，对应一个 Geography；页面自动聚合同语言公开内容与人物。Payload Admin 与 API 位于 `/admin` 和 `/api`，本地 PostgreSQL 16 只绑定回环地址。
- P2 Preview 使用 Vercel Pro + Neon Free + Vercel Blob；Vercel Functions/Blob 位于 `iad1`，Neon 位于 AWS `us-east-1`。`PUB-CURATION-001` 最终受 SSO 保护的 Preview RC 为 [`china-in-fact-hlngq6kq7`](https://china-in-fact-hlngq6kq7-lonelyreader-c40e168c.vercel.app)，保持 `noindex`。
- CMS 已上线 Member publication 与 Editorial curation 两轴、同 Article 编辑、固定原作者、个人/官方 read model、稳定 `/posts` canonical、登录态草稿与 Person 预览、My work/My profile、Person 版本历史、Editor Needs attention 收件箱、账户邀请和暂停、可重试事务通知。`ADMIN-UI-001` 已恢复 Payload 原生 Nav、Dashboard、list 与 document shell，并用受支持的 workspace widget、list slot、field condition 和 Writing/Site tabs 承载业务；自动保存、并发、离页和版本边界不变，Members 开户入口已收敛为 invite-only。
- 邀请与忘记密码链接显式使用 24 小时有效期，重发后仅最新邮件有效。无效、过期或已替代链接会在显示密码框前进入恢复页；重新申请和登录入口已在 Production 匿名回读。
- Media 客户端直传会在写入 Vercel Blob 前为新文件生成唯一、不可覆盖的 pathname；Payload 记录、原图与 `card` 缩略图保持同一唯一 basename。同一浏览器文件名连续上传已在 Production 创建、读回并精确清理，权限与既有媒体未改变。
- 虚构验收流程、权限负例、匿名字段隔离、公开撤回/恢复、桌面与移动端后台和公共 Guide 已通过实现者验证与代理独立复审。复审补齐公开前八项摘要、44px 移动操作按钮和公共 Guide 窄屏无溢出；证据见 [`P1-EDITORIAL-001`](reference/implementation/p1-editorial-cms-foundation-2026-07-27.md)。
- 公共产品切片的 lint、typecheck、build、实现者浏览器验收和产品负责人复审均已通过；实现基线提交为 `6e075ea`。
- Governance V1 已建立并提交为仓库基线（`d1bd435`）。当前 72 项已实现能力按访客、Member、Editor、Super Admin 与运营维护登记在 [`App 功能登记册`](product-feature-registry.md)；260 个当前功能实现与事实文件受内容指纹门禁约束，变更后未同步登记册会使治理检查失败。
- Preview 已执行 15 条 CMS migration；AGENT-WORKSPACE-011 临时开放后已恢复原 SSO 与 Gateway 关闭态，虚构 User/Person/taxonomy/Media/master/Article、DCR client、connection、workflow 与 Agent event 已精确清理。Production 012 已完成前后 R2 backup、checksum、隔离 restore 和 Person 第 15 条独立 migration，当前为 `49 tables / 15 migrations`，Gateway 保持公开开启；release SHA `ce23ba6` 的 Super Admin discovery 为 33 tools。当前真实账号只经 `my_links_save` 新增本人 X，其他 Profile/links/可见状态不变；未创建临时 DCR 或 connection，未发送真实通知。最终 phase-release 独立复审 `PASS`，P0/P1/P2=`0/0/0`。
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

[`AGENT-WORKSPACE-001`](archive/agent-workspace-member-foundation.md)至 [`AGENT-WORKSPACE-006`](archive/agent-workspace-codex-member-compatibility.md)、[`MEDIA-UPLOAD-001`](archive/media-upload-filename-collision.md)、[`MIDGAME-COLD-START-001`](archive/midgame-cold-start.md) 与 [`FAVICON-PROD-001`](archive/favicon-production-release.md) 均已完成并归档。[`INFRA-AGENT-MEDIA-001`](roadmap/checklists/agent-media-tools.md) 的实现、Local 独立复审、统一 Preview 和 Production 部署/discovery 均 `PASS`；Production 未用真实内容重演上传或封面写入，专项运行验收仍由原 checklist 收尾。冷启动已在 Production 完成第 14 条 migration、六个 Purpose、60 个中文母稿和 120 条英西 Site Article；60 个双语组各有 EN/ES 两条，全部 Article 为 `published + curated + _status=published`。公开由 Production MCP 分批执行，数据库聚合、三波六个匿名页面、机构署名、Guides、health 与含 122 条 post URL 的 sitemap 均已回读；恢复 run 为 `31405564024`。

`INFRA-PERSON-PAGE-001` 已在 Local 完成正式成员名片 schema、页面与名录实现，并通过隔离 migration recovery、权限/未公开隔离、EN/ES、build、桌面 1440px 与移动 390px 浏览器主流程及独立复审。Preview 已完成 Person migration apply/down/reapply 与 Agent Profile/X 虚构闭环；Production 已在前后恢复点下应用第 15 条 migration、部署页面，并由本人 MCP X 写入及 EN/ES 匿名公开页读回证明。专项 Member UI、Editor 判词与完整 EN/ES UI 仍由原 checklist 收尾。

`INFRA-RETHEME-001`、`INFRA-ARTICLE-TEMPLATE-001`、`INFRA-OG-001` 与 `INFRA-FEEDS-001` 的 2026-08-12 worktree 分支均比当前 `main` 少 39 个主线提交，merge-tree 已出现冲突。成果保留为候选，不直接合并；后续前端批次必须从已归档的连接优先合同出发，不回收旧 editorial People 方向。

`AGENT-WORKSPACE-007` 已完成 Local/独立复审、统一 Preview 与 Production 发布：Member Agent 可维护本人 Profile、X 等外链、Preview path、可见状态、媒体/文章分页和唯一翻译 draft。Production 当前账号已用 `my_links_save` 只追加本人 X，并由 MCP、数据库与 EN/ES 匿名页三方读回；原 link、Profile 与可见状态不变。

`AGENT-WORKSPACE-008` 已完成 Local/独立复审、统一 Preview 与 Production 部署：Editor 的 Needs attention、受限引用、Body V2/站方字段和安全保存均在 33-tool release 中上线；Production 不用真实内容重演站方写入，角色/对象边界由同一源码的 Preview 负例与 Production discovery 共同证明。

`AGENT-WORKSPACE-009` 已完成 Local/独立复审、统一 Preview 与 Production 部署：首页排期与固定 `major_edit` 通知的 prepare/commit 已上线；Production 按本批 no-go 未触发任何真实排期、内容公开或外部通知。

`AGENT-WORKSPACE-010` 已完成 Local 实现、工作项验证与一次独立终局/定向复核，P0/P1/P2=`0/0/0`，并合入本地 `main`（`c8351ee`）：本地工具总数增至 33，Super Admin 可从合格且权利已清的中文母稿读取 Body V2，以覆盖既有 content hash 与规范化 topics 的 Agent 母稿指纹创建同组唯一 EN/ES Site Article 私有 draft，并在 revision、幂等、母稿/Article/引用行锁下保存完整站方 working copy；创建/保存重放也复核当前母稿指纹。已公开 Article 的普通保存只形成 pending version，既有逐篇或批次 release 才会推广全部站方字段。`admin_recent_activity` 保持空输入最新 20 条兼容，同时增加最大 50 条分页、首屏 `asOf` 与四项固定筛选。Editor/Member、降权、重复 locale、过期母稿指纹、伪造身份、跨维度引用、未批准媒体、stale revision、并发创建和任意查询均失败关闭；无 schema/migration、UI、通用 CRUD 或账户管理改动。

012 已把 010 随同完整 33-tool 候选发布到 Production；当前 Super Admin discovery 精确为 33，未创建真实 Site Article 或运行高风险站务写入。

`AGENT-WORKSPACE-011` 已在专用分支与 Draft PR [`#2`](https://github.com/lonelyreader/chinaknowledge/pull/2) 完成 33-tool Preview migration recovery、虚构三角色真实 DCR/OAuth/MCP、权限负例、cleanup 与 phase-release 复审（P0/P1/P2=`0/0/0`）。012 已把同一应用源码加精确依赖安全补丁通过单次 `main` fast-forward 发布到 Production。

## 当前运行边界

- 本地应用位于 `apps/web`。当前视觉批次以 fixture read mode 在 `http://localhost:3000` 完成 EN/ES 公共页面的 1440px、768px、390px 浏览器验证；现有本地 CMS 数据库启动时因重复 `(translation_group, locale)=(acceptance-member-curation, en)` 无法创建 `translationGroup_locale_idx`，本批未改 schema 或本地数据。CMS 视觉读回已由受保护 Preview `dpl_FKoZxwC5K6orRAHDmbSNDvoQPQtz` 补齐：`READY`、health 正常，EN/ES、人物、成员文章、移动菜单和旧公共入口通过，无坏图、溢出或浏览器 error/warn；匿名访问转向 Vercel SSO，页面保持 `noindex`。
- `PUB-CURATION-001` 使用独立临时 PostgreSQL 完成 12 条 migration apply、clean rollback/reapply、populated fail-closed 和虚构权限/状态矩阵；最终集中运行 typecheck、lint、build、editorial、migration recovery 与 diff check，全部 PASS。
- Production Neon 当前为 49 张表、15 条 migration；第 15 条 Person migration 单独位于 batch 8。Person `gexu` 保持公开，原个人站未变，并新增 `https://x.com/WorldlyGeXu`；EN/ES 匿名页均已读回。既有英西 Article 与冷启动 120 条站方 Article 未被本批改写。
- 当前 Preview CMS 账户、内容、人物、来源说明和图像均为虚构验收数据，不是可公开的真实内容；Production 没有复制这些数据。
- 正式 Vercel Production deployment `dpl_CQkJRqNYFHDPhWE7BsXW54KNFoQi`（commit `ce23ba6`，Agent Workspace 33 tools + Person migration 对应应用）为 `READY / target: production`，已绑定 `chinainfact.com`；发布前稳定 deployment `dpl_38Ni7qVCZDLnQ4vpiL1eVDuzjLDG` 保留为代码回滚目标。Project 仍连接 `lonelyreader/chinaknowledge`，root=`apps/web`、production branch=`main`。
- 站点测量已接入：Vercel Web Analytics 已启用（无 cookie 匿名统计），前台 layout 挂 `<Analytics />`，EN/ES 隐私文案如实披露；GSC 域名资源 `sc-domain:chinainfact.com` 经 Vercel DNS TXT 自动验证，`sitemap.xml` 提交成功（2026-08-12）；Bing Webmaster 按产品负责人决定暂缓。UTM 与事件命名约定见 [`utm-and-event-naming.md`](reference/utm-and-event-naming.md)。
- 最新 Production 恢复 run [`31942516786`](https://github.com/lonelyreader/chinaknowledge/actions/runs/31942516786) 完成数据库与媒体导出、Cloudflare R2 不可变上传、checksum 读回、隔离恢复及媒体样本 SHA，断言 `49 tables / 15 ledger / 15 allowlisted / 16 critical tables`；业务计数为 `12 Users / 12 People / 134 Articles / 12 Media / 284 WorkflowEvents`。
- 2026-07-28 公共产品彻查后的修复已提交为 `4125230`；人物规模复审进一步形成 `31a7988 / 5964da7 / 3be99c6`，补齐 25 人分页、筛选、相邻周互斥轮换和跨年连续周边界。Production staged deployment 首轮 accessibility 发现空首页无 `h1` 与次级文字 4.39:1 对比度，提交 `d95e2b1` 修复后复验为唯一 `h1`、可见文字零 contrast failure、逻辑 tab order、3px focus-visible、桌面/移动无溢出或应用错误；Production 邮件适配器告警与 5xx 均为零。最终独立复审 `PASS`，P0/P1/P2 均为 0。证据见 [`Production Public Product Audit`](reference/implementation/production-public-product-audit-2026-07-28.md)。

当上述事实发生变化时更新本页；计划和愿望不得写成当前能力。
