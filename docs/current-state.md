---
doc_contract: DocContractV1
doc_type: current
authority: canonical
status: active
scope: current-state
last_verified: 2026-07-28
max_lines: 160
---

# Current State

## 当前阶段

项目已完成并归档 **P1：可运行公共产品切片**、**P1：编辑 CMS 基础** 与 **P2：Preview release candidate**。当前唯一 active checklist 为 [`PROD-LAUNCH-001`](roadmap/checklists/production-launch-readiness.md)；受保护 Preview 与不绑定正式域名的 staged Production 均已 `PASS`。Production 为 29/5，首位 Super Admin、真实 Person、头像和首篇英西双语 Article 已公开并进入恢复链路；剩余发布门禁是正式域名绑定、匿名公开面复验和搜索引擎索引。

- 产品需求基线已经建立。
- Stitch 设计系统已经建立。
- 正式品牌名已经确定为 **China, in Fact**，正式域名已确定并购买为 **chinainfact.com**；Vercel CLI 已确认 registrar 与 nameserver 均为 Vercel、到期日为 2027-07-27。域名尚未绑定 `china-in-fact` project，Production alias 和公开索引仍未执行；邮件专用 DNS 已单独配置，不代表网站发布。商标和品牌资产尚未确定。
- 信息架构采用稳定内容对象、目的入口与横向语义分层：`Stories / Guides / Places / People` 为主导航，`Understand / Visit / Live / Study / Work / Business` 为目的入口，`Topics / Geography / Situation` 为横向发现。
- 产品进一步明确为由真实中国作者共同构成、经编辑组织和把关的人物驱动信息 Hub；People 同时是独立对象和其他内容背后的常驻人格层。
- Stitch 公共站、People 机制、作者与编辑工作流及 Newsletter 状态已经形成 P1 结构基线。People 使用每周稳定的一主两辅 Spotlight，配合规则匹配、至多一人临时置顶、搜索、筛选和分页；后台区分作者提交与修订、编辑审核与分类、独立公开确认和移动端轻量审核。产品负责人已接受功能边界；Stitch 旧缓存中的模板文案、fixture、页脚和错误字体没有进入接受资产，P1 实现已按 `DESIGN.md` 通过视觉与 copy gate。
- P0 Stitch 设计原型、P1 可运行公共产品切片、`P1-EDITORIAL-001` 编辑 CMS 基础与 `P2-PREVIEW-001` 均已完成并归档。
- Production launch 基线已由 [`ADR-0008`](decisions/0008-production-launch-foundation.md) 接受：现有 Vercel Pro project + 独立 Neon Launch + 独立 Production Blob + Resend，区域保持 `iad1 / us-east-1`，数据库使用 7 天恢复窗口，异地备份使用 Cloudflare R2。Production 已完整执行 5 条 migration，形成 29 张 `public` 表；首位管理员、公开 Person、头像、原创 Article 封面和两篇英西 Article 均已进入恢复链路，迁移前后备份、读回、SHA、隔离恢复和 schema 断言均已通过。
- 人工域名邮箱已复用现有飞书组织完成配置：`chinainfact.com` 邮箱域名、MX、SPF、DKIM 与监测态 DMARC 均已启用，公共邮箱 `hello@chinainfact.com` 已创建并授权给产品负责人；2026-07-27 从该地址向 `gexu@lonelyreader.com` 的真实测试邮件已发送并确认收达。Resend 使用已验证的 `mail.chinainfact.com / us-east-1` 承担程序邮件，真实事务邮件已由飞书主邮箱回读收达。
- `apps/web` 是 Next.js 16 公共应用与 Payload 3.86.0 编辑 CMS 的同一部署单元。提交 `4125230` 已接通 CMS 首页、Stories/Guides、Places、People/人物页、Purpose、Topic 与 About，并在 CMS 模式停止公共 fixture 回退。Place 是独立编辑节点，对应一个 Geography；页面自动聚合同语言公开内容与人物。Payload Admin 与 API 位于 `/admin` 和 `/api`，本地 PostgreSQL 16 只绑定回环地址。
- P2 Preview 使用 Vercel Pro + Neon Free + Vercel Blob，基础预算上限为 `US$20/月`；Vercel Functions/Blob 位于 `iad1`，Neon 位于 AWS `us-east-1`。受 SSO 保护的最终 Preview 为 [`china-in-fact-9refblv25`](https://china-in-fact-9refblv25-lonelyreader-c40e168c.vercel.app)。环境仍以 `local / preview / production` 失败即停；Production 只有在独立数据库、Blob 与邮件变量齐全时放行，并由独立索引开关保持 `noindex`。
- CMS 已实现 People、Profile revision、Article、Place、Media、分类、来源说明、编辑评论、版本与工作流审计；人物修订不会提前覆盖公开 Person，Editor 只能要求修改或整体应用作者提案，并发更新由数据库唯一键和行锁保护。经 Payload/API 与 Payload 文件路由读取时，未批准 Media 只对服务端记录的上传者和编辑角色可见，只有批准记录进入匿名读取和内容公开；底层 Blob 是 public store，因此该 collection 不承载敏感原件。Author、Editor、Super Admin 权限和文章状态转换均由服务端约束。英语和西班牙语使用独立文档、URL 与公开状态。
- 虚构验收流程、权限负例、匿名字段隔离、公开撤回/恢复、桌面与移动端后台和公共 Guide 已通过实现者验证与代理独立复审。复审补齐公开前八项摘要、44px 移动操作按钮和公共 Guide 窄屏无溢出；证据见 [`P1-EDITORIAL-001`](reference/implementation/p1-editorial-cms-foundation-2026-07-27.md)。
- 公共产品切片的 lint、typecheck、build、实现者浏览器验收和产品负责人复审均已通过；实现基线提交为 `6e075ea`。
- Governance V1 已建立并提交为仓库基线（`d1bd435`）。
- Preview 与 Production 均已执行全部 5 条 CMS migration，形成 29 张表。Preview 的纯虚构验收数据为 31 个账户、27 个人物、30 篇文章、4 个媒体记录、3 个地点、1 条人物修订和 130 条 workflow event，其中 24 组固定 `.test` 人物与贡献只用于规模、分页、筛选和轮换验收；Production 当前为 1 名 Super Admin、1 个公开 Person、2 条已批准 Media、2 篇同一翻译组下的公开 Article、8 条 workflow event 和 0 Place，未复制 Preview 夹具。
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

Active 工作及其授权边界以 [`roadmap/README.md`](roadmap/README.md) 为准。`PROD-LAUNCH-001` 的 Preview schema、虚构编辑流、人物规模、分页/筛选、保护、运行日志与独立复审已经通过；邮件、Newsletter、Discord、最低隐私和 Production 环境代码也已通过。首篇真实内容已完成专有名词核对、英译和拉美西语翻译，两个语言版本分别走完 Draft → In review → Approved → Public，双向 canonical 跳转、Stories 列表和 Person 贡献页均已回读。下一步是正式域名绑定、匿名公开面复验和索引决定。

## 当前运行边界

- 本地应用位于 `apps/web`；先运行 `npm run cms:db:up`，再用 `npm run dev` 启动。公共站与 CMS 已在 `http://127.0.0.1:3000` 完成浏览器验证。
- Preview deployment `dpl_AZaJ5DPimMSjq2NakcciToVAvVrL` 为 `READY / target: null`，绑定 clean HEAD `2ec2aeb`；匿名请求进入 Vercel SSO，授权健康检查返回 200。Preview 为 29/5，并以 25 个合格虚构人物完成桌面 24/页、移动 12/页、翻页、筛选、Spotlight、连续周和跨年轮换验收。唯一 WARN 是 Preview 未配置邮件适配器的预期提示；没有正式域名或可用的 Production URL。
- 首次 CLI 部署误取 production target，但环境守卫在构建期拒绝并留下一个 `ERROR` 记录；没有启动 production runtime、写入 production 数据或生成可用地址。后续部署均显式使用 Preview。
- Production Neon 已执行全部 5 条 migration：29 张 `public` 表。Person `gexu` 已公开，关联本人账户与批准头像；地点为杭州和墨西哥 Mérida，身份为 Educator and entrepreneur，简介为 A coherentist，语言为英语和西班牙语。首篇 Analysis 为 `A Decade of AI Talent Migration in China / Una década de migración del talento de IA en China`，两个版本共享翻译组、原创批准封面和作者，英西切换均跳到目标 canonical URL。run [`30354709841`](https://github.com/lonelyreader/chinaknowledge/actions/runs/30354709841) 完成 dump、R2 读回、隔离恢复和 29/5/5/8 断言，users/people/articles/media/workflow_events 为 1/1/2/2/8，4 个媒体对象进入不可变备份并抽样核对 SHA。
- 当前 Preview CMS 账户、内容、人物、来源说明和图像均为虚构验收数据，不是可公开的真实内容；Production 没有复制这些数据。
- 最新 Vercel staged Production deployment [`dpl_Di8rJZg5ByBr9V7tE3pgBU4TYBf2`](https://china-in-fact-lsqfwa8zt-lonelyreader-c40e168c.vercel.app) 为 `READY / target: production`，部署提交 `614265b` 并回绑稳定 alias，使用 `cms + blob + noindex`；稳定 Production alias 与生成地址均受 Vercel SSO 保护，已购 `chinainfact.com` 仍未绑定网站 project。该提交同时收录首篇英西终稿、原创封面和 CMS 媒体直出修复；登录态浏览器确认英文与西语文章的头像、封面均有有效自然尺寸，正文无横向溢出，错误语言 slug 跳向目标 canonical URL。
- 2026-07-28 公共产品彻查后的修复已提交为 `4125230`；人物规模复审进一步形成 `31a7988 / 5964da7 / 3be99c6`，补齐 25 人分页、筛选、相邻周互斥轮换和跨年连续周边界。Production staged deployment 首轮 accessibility 发现空首页无 `h1` 与次级文字 4.39:1 对比度，提交 `d95e2b1` 修复后复验为唯一 `h1`、可见文字零 contrast failure、逻辑 tab order、3px focus-visible、桌面/移动无溢出或应用错误；Production 邮件适配器告警与 5xx 均为零。最终独立复审 `PASS`，P0/P1/P2 均为 0。证据见 [`Production Public Product Audit`](reference/implementation/production-public-product-audit-2026-07-28.md)。

当上述事实发生变化时更新本页；计划和愿望不得写成当前能力。
