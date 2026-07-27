---
doc_contract: DocContractV1
doc_type: decision
authority: canonical
status: accepted
scope: decision-preview-hosting-foundation
last_verified: 2026-07-27
max_lines: 140
change_id: P2-PREVIEW-001
---

# ADR-0007：P2 Preview 托管基础

## Context

P2 需要把现有 Next.js 16 + Payload 3 + PostgreSQL 应用部署为受保护、`noindex`、只使用虚构数据的 preview release candidate，并证明媒体跨部署持久化、migration、权限、恢复与回读链路。当前应用已经使用标准 PostgreSQL adapter，但 Media 仍写入本地文件系统。

本项目不需要服务位于中国大陆的用户或作者，客户主要位于北美和拉丁美洲，因此中国大陆可用性不参与本阶段选择，客户高频读取优先于中国作者的低频后台写入。Production、正式域名、真实数据与公开发布仍未授权。

## Decision

- P2 Preview 使用 Vercel Pro 承载同一个 Next.js + Payload 部署单元。
- Preview PostgreSQL 使用 Neon Free，继续通过 `@payloadcms/db-postgres` 和标准连接字符串访问；不引入供应商专用数据模型或认证。
- Preview 媒体使用 Vercel Blob，并通过 Payload 官方 `@payloadcms/storage-vercel-blob` adapter 接入；preview 不依赖实例本地文件系统。
- Preview 使用 Vercel Standard Protection、独立环境变量和 `noindex`。部署层保护只控制 preview 入口，不替代 Payload 的 Author、Editor、Super Admin 权限。
- Preview 区域固定为 Vercel Functions `iad1`、Vercel Blob `iad1` 与 Neon AWS `us-east-1`；三个动态读写资源保持同区。
- Preview 基础预算上限为 `US$20/月`。Neon 保持 Free；Blob 低用量优先由 Vercel Pro usage credit 覆盖，并在资源创建后设置 spend limit 和提醒。
- 账号、Pro 购买、密钥、数据库、Blob、migration 和 deploy 继续分别审批；本决定本身不执行这些动作。
- Production 架构、容量、区域、恢复目标和预算留待 production launch checklist 重新决定，不能从 preview 自动继承。

## Why This Option

- 它保持现有 Next.js、Payload 和 PostgreSQL 结构，P2 只需补环境校验、持久化媒体与部署边界。
- Vercel 自带 preview 部署保护；Payload 官方提供 Blob adapter，减少自建鉴权媒体代理和存储集成。
- Neon 提供标准 PostgreSQL 连接与 pooling，足以验证 P2 的 migration 和读取链路。
- 美国东部在单区方案中更均衡地覆盖北美、墨西哥、哥伦比亚、加勒比和拉美北部；公共静态资产仍由全球 CDN 分发。
- Railway 是最接近的替代方案，但访问保护、私有 Bucket 读取与对象恢复需要更多项目自建工作；Render 和 Fly.io 也需要组合更多独立运行与恢复边界。

## Environment Boundary

- `local`：继续使用本地 PostgreSQL 与本地媒体，不要求云账号。
- `preview`：只连接专属 Neon 数据库和 Blob store，只装载可删除的虚构账户、内容与媒体。
- `production`：当前不存在，不共享 preview 的 URL、数据库、对象存储、密钥或数据。

## Recovery And Exit

- 代码可退回上一通过提交；Preview 正常态读取 CMS，数据库故障时可通过显式 `CMS_READ_MODE=fixtures` 部署恢复公共读取。
- Preview migration 执行前必须保留可回读的备份或恢复点；具体步骤在执行批准前写入 migration plan。
- PostgreSQL 退出使用逻辑导出迁移到其他兼容 PostgreSQL；业务读取不调用 Neon 专用 API。
- 媒体退出通过 Payload storage adapter 更换后端并搬迁对象；内容数据只保存对象引用，不把 Blob API 变成领域模型。
- Preview 资源删除必须在回读和证据留存后逐项执行；production 不依赖这些资源。

## Consequences

- P2 可以以较小代码改动验证完整云端链路，但会增加 Vercel、Neon 与 Blob 三处资源和密钥管理。
- Free 数据库的容量与恢复窗口只适合 preview；进入 production 前必须重新评估付费层、区域、备份、恢复目标和供应商集中度。
- 位于亚洲的作者访问 Admin 和上传媒体会承担更高延迟；P2 接受这一低频写入代价，以优先保障目标客户的高频读取。
- 该组合是当前 Preview 的最优解，不宣称是未来 Production 的永久架构。

## Verification Basis

- 独立供应商比较与成本证据见 [`P2 Preview Provider Research`](../reference/implementation/p2-preview-provider-research-2026-07-27.md)。
- 官方参考：[Payload storage adapters](https://payloadcms.com/docs/upload/storage-adapters)、[Vercel deployment protection](https://vercel.com/docs/deployment-protection)、[Vercel pricing](https://vercel.com/pricing)、[Neon pricing](https://neon.com/pricing)。
