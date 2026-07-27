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

项目已完成并归档 **P1：可运行公共产品切片**、**P1：编辑 CMS 基础** 与 **P2：Preview release candidate**。当前唯一 active checklist 为 [`PROD-LAUNCH-001`](roadmap/checklists/production-launch-readiness.md)；Production 资源、migration 与恢复已完成，真实数据、部署、网站域名、DNS 和公开仍分别过门禁。

- 产品需求基线已经建立。
- Stitch 设计系统已经建立。
- 正式品牌名已经确定为 **China, in Fact**，正式域名已确定并购买为 **chinainfact.com**；Vercel CLI 已确认 registrar 与 nameserver 均为 Vercel、到期日为 2027-07-27。域名尚未绑定 `china-in-fact` project，Production alias 和公开索引仍未执行；邮件专用 DNS 已单独配置，不代表网站发布。商标和品牌资产尚未确定。
- 信息架构采用稳定内容对象、目的入口与横向语义分层：`Stories / Guides / Places / People` 为主导航，`Understand / Visit / Live / Study / Work / Business` 为目的入口，`Topics / Geography / Situation` 为横向发现。
- 产品进一步明确为由真实中国作者共同构成、经编辑组织和把关的人物驱动信息 Hub；People 同时是独立对象和其他内容背后的常驻人格层。
- Stitch 公共站、People 机制、作者与编辑工作流及 Newsletter 状态已经形成 P1 结构基线。People 使用每周稳定的一主两辅 Spotlight，配合规则匹配、至多一人临时置顶、搜索、筛选和分页；后台区分作者提交与修订、编辑审核与分类、独立公开确认和移动端轻量审核。产品负责人已接受功能边界；Stitch 旧缓存中的模板文案、fixture、页脚和错误字体没有进入接受资产，P1 实现已按 `DESIGN.md` 通过视觉与 copy gate。
- P0 Stitch 设计原型、P1 可运行公共产品切片、`P1-EDITORIAL-001` 编辑 CMS 基础与 `P2-PREVIEW-001` 均已完成并归档。
- Production launch 基线已由 [`ADR-0008`](decisions/0008-production-launch-foundation.md) 接受：现有 Vercel Pro project + 独立 Neon Launch + 独立 Production Blob + Resend，区域保持 `iad1 / us-east-1`，数据库使用 7 天恢复窗口，异地备份使用 Cloudflare R2。Production migration 已执行一次，形成 23 张 `public` 表和 1 条 migration 记录，业务数据与 Blob 仍为空；迁移后备份、读回、SHA、隔离恢复和 schema 断言均已通过。
- 人工域名邮箱已复用现有飞书组织完成配置：`chinainfact.com` 邮箱域名、MX、SPF、DKIM 与监测态 DMARC 均已启用，公共邮箱 `hello@chinainfact.com` 已创建并授权给产品负责人；2026-07-27 从该地址向 `gexu@lonelyreader.com` 的真实测试邮件已发送并确认收达。Resend 使用已验证的 `mail.chinainfact.com / us-east-1` 承担程序邮件，真实事务邮件已由飞书主邮箱回读收达。
- `apps/web` 是 Next.js 16 公共应用与 Payload 3.86.0 编辑 CMS 的同一部署单元。公共站仍保留 typed fixture 读路径；本地可切换到 CMS 公开读路径。Payload Admin 与 API 位于 `/admin` 和 `/api`，本地 PostgreSQL 16 只绑定回环地址。
- P2 Preview 使用 Vercel Pro + Neon Free + Vercel Blob，基础预算上限为 `US$20/月`；Vercel Functions/Blob 位于 `iad1`，Neon 位于 AWS `us-east-1`。受 SSO 保护的当前 Preview 为 [`china-in-fact-m079nig02`](https://china-in-fact-m079nig02-lonelyreader-c40e168c.vercel.app)。环境仍以 `local / preview / production` 失败即停；Production 只有在独立数据库、Blob 与邮件变量齐全时放行，并由独立索引开关保持 `noindex`。
- CMS 已实现 People、Article、分类、来源说明、编辑评论、版本与工作流审计；Author、Editor、Super Admin 权限和 `draft / submitted / in_review / changes_requested / approved / public / archived` 转换均由服务端约束。英语和西班牙语使用独立文档、URL 与公开状态。
- 虚构验收流程、权限负例、匿名字段隔离、公开撤回/恢复、桌面与移动端后台和公共 Guide 已通过实现者验证与代理独立复审。复审补齐公开前八项摘要、44px 移动操作按钮和公共 Guide 窄屏无溢出；证据见 [`P1-EDITORIAL-001`](reference/implementation/p1-editorial-cms-foundation-2026-07-27.md)。
- 公共产品切片的 lint、typecheck、build、实现者浏览器验收和产品负责人复审均已通过；实现基线提交为 `6e075ea`。
- Governance V1 已建立并提交为仓库基线（`d1bd435`）。
- CMS migration `20260727_054408_p1_editorial_foundation` 已分别在 Preview 与 Production 执行一次。当前 Preview 只有 3 个虚构账户、1 个人物、2 篇分语言文章、1 个媒体记录及其 2 个 Blob 对象；英语 Guide 已公开，西班牙语版本保持未公开。Production 已有 23 张表和 1 条 migration，但业务数据与 Blob 仍为空。
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

Active 工作及其授权边界以 [`roadmap/README.md`](roadmap/README.md) 为准。`PROD-LAUNCH-001` 的邮件、Newsletter、Discord、最低隐私和 Production 环境代码已独立复审 PASS；独立 Production Neon Launch、Blob 与 Cloudflare R2 私有备份桶已创建，Neon 为 7 天恢复窗口，R2 为全部对象 30 天防删、数据库备份 90 天生命周期。Production migration 与迁移后恢复 workflow 均已通过。`P2-PREVIEW-001` 的完成记录见 [`archive`](archive/p2-preview-release-candidate.md)。网站域名绑定、真实数据、正式内容公开、部署和索引仍未执行。

## 当前运行边界

- 本地应用位于 `apps/web`；先运行 `npm run cms:db:up`，再用 `npm run dev` 启动。公共站与 CMS 已在 `http://127.0.0.1:3000` 完成浏览器验证。
- Preview deployment `dpl_9cTeUwsM9JBNCdfps3HEzF3mBhA7` 为 `READY`，匿名请求进入 Vercel SSO，授权健康检查返回 200。隔离恢复库已完成 23 张表和全部虚构 fixture 回读并删除；数据库不可用的 fixtures 灾备 deployment 也已验证后保留为短期证据。没有正式域名或可用的 production URL。
- 首次 CLI 部署误取 production target，但环境守卫在构建期拒绝并留下一个 `ERROR` 记录；没有启动 production runtime、写入 production 数据或生成可用地址。后续部署均显式使用 Preview。
- Production Neon 已执行 `20260727_054408_p1_editorial_foundation`：23 张 `public` 表、1 条 migration，users/people/articles/media/workflow_events 均为 0；Production Blob 为 0B。Cloudflare R2 私有备份桶已在北美东部建立，公开访问关闭；迁移后 run `30287841720` 的 dump、SHA、隔离恢复、23/1/1/6 schema 断言与零对象媒体清单均通过。
- 当前 Preview CMS 账户、内容、人物、来源说明和图像均为虚构验收数据，不是可公开的真实内容。
- Vercel project 当前回读为 `live: false`，已购 `chinainfact.com` 尚未绑定网站 project。独立 Production Neon Launch、Blob、R2、运行变量、migration 与恢复验收已就绪，环境校验为 `cms + blob + noindex`；真实内容尚未审核和写入，因此仍不部署。Payload Resend adapter、Newsletter Contacts/Topic opt-in、最低隐私页、真实 Discord invite 和占位外链清理已实现；公开订阅端点有 Production-only IP 限流，重复提交不会改写已有联系人的退订状态，Local 与 Preview 不写真实订阅者。

当上述事实发生变化时更新本页；计划和愿望不得写成当前能力。
