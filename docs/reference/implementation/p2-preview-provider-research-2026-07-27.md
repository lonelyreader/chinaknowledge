---
doc_contract: DocContractV1
doc_type: reference
authority: evidence
status: active
scope: p2-preview-provider-research
last_verified: 2026-07-27
max_lines: 180
change_id: P2-PREVIEW-001
---

# P2 Preview Provider Research

## Conclusion

2026-07-27 产品负责人已接受 preview 使用 **Vercel Pro + Neon Free + Vercel Blob**，基础预算上限为 `US$20/月`。独立复核在“不服务中国大陆用户或作者”的明确前提下给出 **PASS**：该组合与现有 Next.js、Payload PostgreSQL adapter 和媒体模型的改动最小，preview 可使用 Vercel Authentication 保护，数据库有 serverless pooling 与短期恢复能力，媒体有 Payload 官方 adapter。

Payload Cloud 不再作为候选。Payload 官方在并入 Figma 后暂停了新 Cloud 项目部署，并说明现有 Cloud 客户未来仍需迁移；本项目当前没有既有 Payload Cloud 项目。

这项接受决定只固定 P2 Preview 的技术方向与预算上限，不授权创建账号、购买计划、写入密钥、创建资源、执行 migration 或部署，也不预先决定 production 架构。

## Current Constraints

- 当前应用是同一 Next.js 16.2.12 + Payload 3.86.0 部署单元，已经使用 `@payloadcms/db-postgres`。
- 当前 Media 写入本地 `media/`；Vercel 等临时文件系统不能保持上传文件。
- Preview 必须受保护、`noindex`、只用虚构数据，并保持 Author / Editor / Super Admin 服务端权限。
- 项目不需要服务位于中国大陆的用户或作者，因此 `.vercel.app` 在中国大陆可能受限不构成本阶段阻塞。
- Production、DNS、真实数据、Newsletter、Discord 和内容公开不属于本次决策。

## Candidate Comparison

| 方案 | Preview 成本与恢复 | 适配度 | 结论 |
|---|---|---|---|
| Vercel Pro + Neon Free + Vercel Blob | Vercel `US$20/月`，含 `US$20` usage credit；Neon Free `US$0`、0.5 GB、100 CU-hours/月、6 小时 restore window；Blob 按量计费 | Payload 官方支持任意 PostgreSQL 与 Vercel Blob adapter；Neon 有 PgBouncer pooling；Vercel Standard Protection 可保护 preview | 推荐 |
| Vercel Pro + Supabase Free | Vercel `US$20/月`；Supabase Free `US$0`、500 MB DB、1 GB storage，但闲置一周暂停且无自动备份 | 可以提供 PostgreSQL；若同时使用 Supabase Storage，需要额外适配与 S3/Storage 运维边界 | 备选，不适合作为最小路径 |
| Railway app + PostgreSQL + Bucket | 按资源用量计费，可建立 preview environments | 单一供应商、可运行长驻服务；但 preview 访问保护需要应用层补齐，Bucket 仅私有且当前没有对象版本或备份 | 最强替代方案，但 P2 实现与恢复面更大 |
| Render 或 Fly.io + 托管 PostgreSQL + 对象存储 | 可组成完整托管栈，费用随实例、数据库和存储分别产生 | 对通用容器和长驻服务更自由；需要自行组合访问保护、媒体、数据库和恢复链路 | 可行，当前阶段运维面超过收益 |
| Payload Cloud | 新项目部署暂停 | 原本一体化，但当前无法创建新项目，且官方已说明未来迁移 | 排除 |
| Vercel Hobby + Neon Free + Blob | `US$0` 起 | 技术上可做个人 preview；Vercel Hobby 条款限制为个人、非商业用途，协作和运行保障也较弱 | 仅在产品负责人明确确认符合 Hobby 条款时考虑 |

## Why The Recommendation Is Narrow

- 使用现有 `@payloadcms/db-postgres` 即可连接 Neon，不必换数据库模型或启用 Supabase Auth。
- Payload 官方 `@payloadcms/storage-vercel-blob` 会为目标 collection 关闭本地存储；Vercel 部署时应启用 client uploads，避开 4.5 MB server upload 限制。
- Vercel Marketplace 的 Neon 集成可以注入环境变量，也可以连接既有 Neon 账号；供应商仍保持为标准 PostgreSQL，退出时可使用逻辑导出迁移。
- Vercel Blob 底层为持久化对象存储，适合公开图片；区域创建后不能修改，因此区域选择必须在账号创建前单独决定。
- Vercel Authentication 的 Standard Protection 在各计划可用，足够保护 preview；Password Protection 需要 Pro 的 `US$150/月` add-on，不建议为本阶段购买。
- Railway 是成本和一体化程度最接近的挑战者，但它会把 preview 保护、私有媒体读取和存储恢复变成本项目自己的实现责任；对于本轮“证明既有产品链路可部署”，这些额外变量没有带来相称收益。
- 选择 Neon 和 Blob 不把核心内容模型锁进专用数据接口：数据库仍是标准 PostgreSQL，媒体可通过 Payload storage adapter 更换后端。

## Cost Boundary

Preview 推荐预算：

- Vercel Pro：`US$20/月`，包含 `US$20` usage credit。
- Neon Free：`US$0`；达到容量、恢复窗口或稳定性需求前不升级。
- Vercel Blob：低用量按量计费，预计由 Pro credit 覆盖；创建后必须设置 spend limit 和用量提醒。

未来 production 的粗略基础线是 Vercel Pro `US$20/月` 加 Neon Launch 典型 `US$15/月`，再加媒体和流量用量；这不是 production 预算批准。

## Decision Outcome

已接受 **Vercel Pro + Neon Free + Vercel Blob** 作为 P2 preview 架构，并接受基础预算上限 `US$20/月`。

Product code 与 dependency install 已于 2026-07-27 批准并完成本地验证。区域已于同日批准；下一门禁是账号绑定、Vercel Pro 购买、Neon/Blob 资源和密钥，migration 与 preview deploy 仍在更后的独立门禁。

## Region Decision

已接受三个资源统一放在美国东部：Vercel Functions `iad1`、Vercel Blob `iad1`、Neon AWS `us-east-1`。

- 客户主要位于北美和拉丁美洲；高频公开读取应优先于中国作者低频的后台写入和上传。
- `iad1 / us-east-1` 在单区方案中更均衡地覆盖北美、墨西哥、哥伦比亚、加勒比和拉美北部；相比 São Paulo，它不会显著牺牲北美客户。
- Vercel 官方要求 Functions 尽量靠近数据库；`iad1` 与 Neon AWS `us-east-1` 对齐。Blob 与 Functions 同设 `iad1`，公开媒体继续由全球 CDN 分发。
- P2 只使用一个 Function region，不为低量 preview 引入多区域数据库一致性与额外费用。Production 重新评估全球读者、编辑位置、恢复目标和区域成本。

最初的新加坡建议错误地提高了贡献者写入延迟的权重；在客户地理信息明确后已撤回，且撤回前没有创建任何资源。`apps/web/vercel.json` 已固定 Functions `iad1`；Neon 与 Blob 的实际创建仍停在资源门禁。

## Official Sources

- [Payload production deployment](https://payloadcms.com/docs/production/deployment)
- [Payload storage adapters](https://payloadcms.com/docs/upload/storage-adapters)
- [Payload Cloud update after joining Figma](https://payloadcms.com/payload-has-joined-figma)
- [Vercel pricing](https://vercel.com/pricing)
- [Vercel deployment protection](https://vercel.com/docs/deployment-protection)
- [Vercel Blob usage and pricing](https://vercel.com/docs/vercel-blob/usage-and-pricing)
- [Vercel regions](https://vercel.com/docs/regions)
- [Vercel Function region configuration](https://vercel.com/docs/functions/configuring-functions/region)
- [Vercel regional pricing](https://vercel.com/docs/pricing/regional-pricing)
- [Vercel Postgres marketplace direction](https://vercel.com/docs/postgres)
- [Neon pricing](https://neon.com/pricing)
- [Neon connection pooling](https://neon.com/docs/connect/connection-pooling)
- [Neon regional latency dashboard](https://neon.com/demos/regional-latency)
- [Supabase pricing](https://supabase.com/pricing)
- [Supabase backups](https://supabase.com/docs/guides/platform/backups)
- [Railway pricing](https://docs.railway.com/pricing)
- [Railway environments](https://docs.railway.com/environments)
- [Railway storage buckets](https://docs.railway.com/storage-buckets)
- [Render persistent disks](https://render.com/docs/disks)
- [Fly.io pricing](https://fly.io/docs/about/pricing/)
