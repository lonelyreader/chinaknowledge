---
doc_contract: DocContractV1
doc_type: decision
authority: canonical
status: accepted
scope: decision-production-launch-foundation
last_verified: 2026-07-27
max_lines: 160
change_id: PROD-LAUNCH-001
---

# ADR-0008：Production Launch 基础

## Context

P2 已证明 Next.js + Payload + PostgreSQL 在受保护 Preview 中可部署、迁移和恢复，但 Preview 使用短恢复窗口、纯虚构数据和专属密钥，代码仍主动拒绝 Production。首个公开版本需要正式域名、独立数据与媒体、可达邮件、真实入口和数据级恢复，不能把 Preview 直接转正。

客户主要位于北美和拉丁美洲，作者后台写入频率低于公众读取；P2 已接受并验证美国东部区域。产品负责人已在当前 Vercel 账户购买 `chinainfact.com`。

## Decision

- 继续使用当前 `lonelyreader` Vercel Pro account 与 `china-in-fact` project，不新建 Vercel account 或第二个 App。
- Production 使用独立环境变量、Neon database 和 Vercel Blob store，不共享或复制 Preview 密钥和虚构验收数据。
- Functions 与 Blob 保持 `iad1`，Neon 使用 AWS `us-east-1`；公开静态资源继续由 CDN 分发。
- Production PostgreSQL 使用 Neon Launch，restore window 设为 7 天；migration 前另建 snapshot 或逻辑导出并完成隔离恢复演练。
- Production 媒体使用独立 Vercel Blob store，并定期复制到另一供应商的 S3-compatible storage；备份供应商在创建资源前单独选择。
- Payload 事务邮件与 Newsletter Contacts/Broadcasts 统一使用 Resend；初期使用 Free tier，超额升级另行批准。
- 正式域名为 `chinainfact.com`。Vercel Standard Protection 继续保护 Preview 和生成 deployment URL；自定义 Production domain 在 release PASS 后公开，不购买 Advanced Protection add-on。
- Production 发布前必须提供真实 Discord invite；没有可用入口时隐藏 Discord CTA。公开面不得保留 `example.com` 或其他占位外链。
- staged production 先使用 `--prod --skip-domain` 验收；独立复审 PASS 后再分别批准域名绑定、DNS、内容公开和索引。
- 本决定接受架构与产品边界，不自动授权创建资源、付费升级、密钥、migration、真实数据、部署或公开。

## Environment Boundary

- `local`：本地 PostgreSQL 与媒体，用于开发和目标测试。
- `preview`：现有 Neon Free、Preview Blob、Preview 密钥与虚构验收数据，保持受保护和 `noindex`。
- `production`：独立 Neon Launch、Blob、Resend、密钥和真实内容；在 release 门禁完成前保持无正式 alias、无公开索引。

## Email Boundary

- Resend API key 只进入 Production server environment，不进入浏览器、仓库、日志或截图。
- Payload password reset 与验证邮件必须可达；Newsletter 必须真正创建 contact，并覆盖重复提交、失败、退订和滥用保护。
- 发件域和 Reply-To 必须使用经过验证且能收到回复的地址；邮箱托管方案在资源创建前确认。
- 不在最低限度隐私文本、订阅同意和退订链路通过前收集营销邮箱。

## Recovery

- 代码：保留上一通过 deployment，可用 Vercel rollback 恢复。
- 数据库：7 天 PITR/restore；migration 前 snapshot 或逻辑导出，目标 `RPO <= 24h / RTO <= 4h`。
- 媒体：异地副本，目标 `RPO <= 7d / RTO <= 8h`；恢复演练必须证明 Payload 引用可重新读取。
- DNS：域名绑定与 DNS 留在 release 最后阶段，失败时撤销 alias 或恢复上一记录。
- 代码回滚不被视为数据库、媒体或 Newsletter 数据恢复。

## Consequences

- Production 与 Preview 仍在一个 Vercel project 内管理，但所有有状态资源和密钥严格分环境。
- 基础成本在现有 Vercel Pro 之外增加 Neon Launch、Blob 用量和异地备份；Resend 初期可以保持 Free。
- 统一 Resend 降低事务邮件与 Newsletter 的供应商数量，但发件域、联系人和退订成为新的个人数据与运营边界。
- 独立媒体备份会增加一个外部 storage provider；这是避免单供应商删除或误操作损失的必要成本。

## Verification Basis

- 比较、当前阻断、成本与官方来源见 [`Production Launch Readiness Research`](../reference/implementation/production-launch-readiness-research-2026-07-27.md)。
- 产品负责人于 2026-07-27 接受完整推荐基线，并单独批准建立 checklist baseline commit。
