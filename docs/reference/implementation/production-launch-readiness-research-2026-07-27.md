---
doc_contract: DocContractV1
doc_type: reference
authority: evidence
status: active
scope: production-launch-readiness-research
last_verified: 2026-07-27
max_lines: 180
change_id: PROD-LAUNCH-001
---

# Production Launch Readiness Research

## Conclusion

首个 Production 应延续 P2 已验证的应用结构和美国东部区域，但必须使用独立 Production 数据库、Blob、环境变量与恢复点。产品负责人已于 2026-07-27 接受现有 Vercel Pro project + Neon Launch + Vercel Blob + Resend 基线；接受决定不授权购买、创建资源、迁移、部署、DNS 或公开内容。

Production 当前不能部署：代码仍主动拒绝 production runtime，Vercel project 状态为 `live: false`，正式域名尚未绑定网站 project；Newsletter 会在没有保存邮箱时显示成功，代码中的 Discord 与 fixture 外链仍是占位入口。真实 Discord website invite 与人工域名邮箱已经就绪，后续分别接入产品代码和运营流程。

## Current Evidence

- Vercel project `china-in-fact` 位于现有 `lonelyreader` account；2026-07-27 只读回读为 `live: false`，没有绑定自定义域名。
- `chinainfact.com` 已由产品负责人在 Vercel 购买；CLI 回读显示 registrar 与 nameserver 均为 Vercel，到期日为 2027-07-27，但尚未进入该 project 的 domain 列表。2026-07-27 已单独写入飞书邮箱所需 MX、SPF、验证与 DKIM 记录；邮件 DNS 不构成网站绑定或公开。
- `apps/web/src/config/environment.ts` 对 `production` 固定报错，并只在 Preview 启用 Blob。
- Payload config 没有 email adapter；官方说明没有 adapter 时认证邮件会告警而不发送。
- Newsletter 表单只在客户端检查邮箱格式，没有 API、数据库或邮件平台写入。
- People 页 Discord 仍指向 `https://discord.com`，fixtures 仍有 `example.com` 与 `/newsletter` 占位链接。
- `/Volumes/External/codex-ops` registry 已保存 website、newsletter、X、YouTube 和 partners 五个 source invite；2026-07-27 实时验证 website invite `https://discord.gg/CCUbfaRVd2` 指向 guild `China, in Fact` 的 `start-here`，且无到期时间。
- Production 数据库、对象存储、环境变量、备份、真实账户和真实内容均不存在。

## Accepted Foundation

### Hosting And Public Access

- 继续使用当前 Vercel Pro team/project，避免拆出新的账号和运维边界。
- Production 使用同 project 的 Production environment，但 Neon、Blob、密钥必须与 Preview 分离。
- Functions 和 Blob 保持 `iad1`，Neon 保持 AWS `us-east-1`；这延续 P2 面向北美和拉美的区域决定。
- 使用 Vercel Standard Protection：Preview 和生成 deployment URL 保持受保护，自定义 Production domain 对公众开放。
- 不购买 `US$150/月` 的 Advanced Deployment Protection；当前公共内容站不需要把正式域名设为私有。
- 先用 `vercel --prod --skip-domain` 生成 staged production，复审 PASS 后才绑定域名；代码可用 `vercel rollback` 回到前一 deployment。

### Database And Media

- Preview 的 Neon Free 只有 6 小时 restore window，不应承担正式内容和作者账户。
- Neon Launch 当前为按量计费，典型示例约 `US$15/月`，提供最长 7 天 time travel/restore；新付费项目默认 1 天，需要显式设为 7 天。
- Migration 前至少保留 Neon snapshot 或逻辑导出，且必须在隔离目标完成一次 restore smoke。
- Production Blob 使用独立 store；Vercel 官方备份示例是通过 Cron 把 Blob 流式复制到 S3，说明媒体恢复需要单独设计，不能只依赖 deployment rollback。
- 初始建议数据库 `RPO <= 24h / RTO <= 4h`，媒体 `RPO <= 7d / RTO <= 8h`；公开前以恢复演练验证，而不是只记录步骤。

### Email And Newsletter

- Payload 官方推荐 Vercel/serverless 使用轻量的 `@payloadcms/email-resend`，用于重置密码、验证和其他事务邮件。
- Resend 也提供 Contacts、Segments、Topics 与 Broadcasts，可让一个供应商同时覆盖 Newsletter 和 Payload 事务邮件，并自动处理营销邮件退订。
- 当前 Free 额度为每月 3,000 封事务邮件、每日 100 封，以及 1,000 个营销联系人，足够首期验证；超过后分别升级。
- 正式域名、发件地址、DNS 验证、订阅同意、重复提交、滥用保护、失败状态和退订必须一起验收。
- 如果产品负责人不接受 Resend，首发必须隐藏所有 Newsletter 入口，另选事务邮件；现有假成功绝不能带入 Production。

### Human Mailbox

- 当前 `lonelyreader.com` 的实际邮箱托管方是飞书，产品负责人已有主邮箱和多个公共邮箱；Notion 的 TXT 仅用于域名验证，不提供邮箱托管。
- 复用现有飞书组织比新增 Zoho 或阿里云邮箱减少账号、账单和运维边界。飞书基础版包含邮箱，当前组织虽处于商业标准版试用，但没有为第二域名或公共邮箱显示单独付费门槛。
- `chinainfact.com` 已作为独立邮箱域名启用，公共邮箱 `hello@chinainfact.com` 已创建并授权给产品负责人；CLI 回读确认它是可访问的 `PUBLIC_MAILBOX`。2026-07-27 已从该公共邮箱向现有 `gexu@lonelyreader.com` 实发测试邮件，并由收件人确认收达；现有主邮箱未被替换。
- Vercel DNS 已配置三条 MX、一条 SPF、飞书域名验证、2048 位 DKIM 和 `p=none` 监测态 DMARC；飞书后台回读域名与 DKIM 均为已启用。Resend 继续只承担 Payload 事务邮件和 Newsletter，不替代人工邮箱；DMARC 只在 Resend 发件子域验收后再考虑收紧。
- 邮箱域名本身不触发 ICP 备案；网站只有在接入中国大陆服务器或 CDN 提供互联网信息服务时才进入备案范围。当前 Vercel 海外部署基线不要求备案。

### Domain And Public Content

- 正式域名已确定为 `chinainfact.com`：与正式品牌一致、没有连字符、口述和输入成本最低。
- 域名已经购买并使用 Vercel nameserver，但购买不等于 project 绑定、Production alias、DNS 发布或搜索索引；这些动作继续留在 release 末端。
- DNS 之前先把已验证的 website Discord invite 接入产品，并完成作者外链、最低限度隐私文本和首批真实内容审核。
- Production domain 可以公开但先保持 `noindex`；只有内容公开复核通过后再允许索引。

## Cost Boundary

建议的低流量基础线：

- Vercel Pro：现有团队已在使用；不新增 Advanced Protection。
- Neon Launch：用量计费，官方典型示例约 `US$15/月`，另有 compute、storage 和 history storage 实际用量。
- Vercel Blob：按实际存储与流量计费；需要用量提醒和单独备份目标。
- Resend：初期 Free；额度超出或联系人超过 1,000 后另行批准升级。
- 域名：`chinainfact.com` 已购买；本次只读回读未核验最终账单金额。
- 异地媒体备份：供应商与费用尚未选择，不能遗漏在 Production 预算之外。

精确预算必须在资源创建前按当日价格重算。本报告不把动态价格写成长期承诺。

## Risks That Were Easy To Miss

- 代码部署回滚不会恢复已被覆盖或删除的数据库、媒体和订阅数据。
- 公开 Production domain 与受保护 Preview 可以共存，不需要为了公开站关闭所有 deployment protection。
- Payload Admin 没有邮件 adapter 时，用户能存在但重置密码链路不可运营。
- Newsletter 的假成功比暂时没有 Newsletter 更危险，会制造数据与用户信任损失。
- 作者主页将真实人物资料和外链公开，必须逐字段确认公开同意，不能把后台账户资料自动映射到公共页。
- 域名、发件域和 Newsletter 订阅链路相互依赖，应在 DNS 发布前共同验收。
- `robots` 放开应晚于内容公开，不应由 Production environment 自动提前触发。

## Decision Boundary

研究结论已由产品负责人接受并写入 [`ADR-0008`](../../decisions/0008-production-launch-foundation.md)。下一门禁是 product code、依赖安装、账号激活与外部资源；它们仍分别批准，不由本报告自动执行。

## Official Sources

- [Vercel deployment protection](https://vercel.com/docs/deployment-protection)
- [Vercel custom domains](https://vercel.com/kb/guide/how-do-i-add-a-custom-domain-to-my-vercel-project)
- [Vercel deployments](https://vercel.com/docs/deployments/overview)
- [Vercel rollback CLI](https://vercel.com/docs/cli/rollback)
- [Vercel Blob backup example](https://vercel.com/docs/vercel-blob/examples)
- [Neon pricing](https://neon.com/pricing)
- [Neon point-in-time restore](https://neon.com/blog/announcing-point-in-time-restore)
- [Neon scheduled snapshots update](https://neon.com/docs/changelog/2025-10-31)
- [Payload email adapters](https://payloadcms.com/docs/email/overview)
- [Resend pricing](https://resend.com/docs/knowledge-base/what-is-resend-pricing)
- [Resend Contacts and Broadcasts](https://resend.com/docs/dashboard/audiences/introduction)
- [飞书邮箱管理员使用手册](https://www.feishu.cn/hc/zh-CN/articles/207987789616-%E9%A3%9E%E4%B9%A6%E9%82%AE%E7%AE%B1%E7%AE%A1%E7%90%86%E5%91%98%E4%BD%BF%E7%94%A8%E6%89%8B%E5%86%8C)
- [在飞书上使用邮箱的 4 种方案](https://www.feishu.cn/hc/zh-CN/articles/670282738496-%E5%9C%A8%E9%A3%9E%E4%B9%A6%E4%B8%8A%E4%BD%BF%E7%94%A8%E9%82%AE%E7%AE%B1%E7%9A%84-4-%E7%A7%8D%E6%96%B9%E6%A1%88)
- [工信部非经营性互联网信息服务备案管理办法](https://wap.miit.gov.cn/gyhxxhb/jgsj/cyzcyfgs/bmgz/xxtxl/art/2024/art_84a0cfa0ebd049bbbe751dca9a008e56.html)
