---
doc_contract: DocContractV1
doc_type: checklist
authority: execution
status: active
scope: production-launch-readiness
last_verified: 2026-07-28
max_lines: 220
change_id: PROD-LAUNCH-001
risk_tier: upgraded
validation_profile: phase_release
allowed_paths: .github/**, apps/README.md, apps/web/**, scripts/**, vercel.json, docs/current-state.md, docs/architecture/**, docs/decisions/**, docs/roadmap/README.md, docs/roadmap/checklists/README.md, docs/roadmap/checklists/production-launch-readiness.md, docs/archive/README.md, docs/archive/production-launch-readiness.md, docs/reference/README.md, docs/reference/implementation/**
approval_gates: checklist-commit, product-code, dependency-install, provider-choice, paid-service, domain-binding, legal-copy, secrets, production-database, object-storage, backup, transactional-email, newsletter, discord, migration, real-data, content-publication, production-deploy, dns, public-indexing
---

# Production Launch Readiness

目标：把已通过 P2 的受保护 Preview 收敛为可恢复、可公开、使用真实内容的首个 Production release；Production 资源、真实数据、部署、DNS 与公开索引仍分别过门禁。

## Scope

- 固定 Production 的托管、数据库、对象存储、邮件、区域、成本和退出路径。
- 建立独立 Production 数据库、Blob store、环境变量与恢复链路；不复用 Preview 数据。
- 移除 production runtime 的 P2 禁用守卫，并用环境测试保证 Preview 继续受保护且 `noindex`。
- 处理真实邮件订阅、Payload 事务邮件、Discord 入口、正式域名和最低限度隐私文本。
- 用经过审核的真实作者、人物、文章、媒体和外链替换公开面的虚构验收数据。
- 先生成不绑定域名的 staged production deployment，验收通过后再配置 DNS 和公开索引。
- 完成 migration、权限负例、语言隔离、备份恢复、监控、回滚和独立复审。

## No-go

- 不把 Preview 数据库、Blob、密钥、虚构账户或验收内容复制为 Production 真相。
- 不保留“没有真正订阅却显示成功”的 Newsletter，也不公开通用 Discord 或 `example.com` 外链。
- 不因创建 Production deployment 自动批准正式域名、DNS、真实数据、内容公开或索引。
- 不在域名、发件人、隐私文本和退订链路未就绪时收集或发送营销邮件。
- 不购买域名、激活付费服务、写入密钥、执行 migration 或处理真实个人数据，除非对应门禁已单独批准。
- 不引入支付、广告、私信、个性化推荐、追踪型 analytics 或 P3 平台深化。

## Upgraded Boundaries

- `data_truth`：Production 从空库开始，只接收已审核真实内容；Preview 继续保留可删除的虚构验收数据。
- `read_path`：只有正式域名在内容公开和索引门禁后可匿名访问；Preview 与生成 deployment URL 继续受保护。
- `write_path`：CMS、Newsletter、邮件、数据库和媒体写入必须落入明确的 Production 资源并可审计。
- `permission_boundary`：Author、Editor、Super Admin 服务端权限与英语/西班牙语独立公开状态不降级。
- `personal_data`：作者账户、个人主页资料和订阅邮箱按最小字段收集，公开字段与后台字段隔离。
- `recovery`：代码、数据库和媒体分别有恢复点、演练证据和明确 RPO/RTO；DNS 变更可回退。
- `independent_review`：非主持实现者在 DNS 前复核完整 release candidate，并给出 PASS 或 BLOCK。

## Current Blockers

- 独立 Production Neon Launch、Blob 与 Cloudflare R2 私有备份桶已创建；Neon 7 天恢复窗口、R2 30 天防删、数据库 90 天保留和首次恢复演练均已回读。
- staged Production `dpl_DvSJVxiPcpAGfrhWk3GcSW92tcCp` 已 `READY / target: production`，生成 `.vercel.app` 地址受 SSO 保护且 `noindex`；已购正式域名尚未绑定项目。
- Production 已执行全部 5 条 migration：29 张 `public` 表；首位 Super Admin 已建立，内容数据与 Blob 仍为空；Resend 域名、密钥与发件配置已经就绪。
- 迁移后 R2 dump、SHA 和零对象媒体清单已写入并读回；首次 run `30287433284` 暴露 PostgreSQL 初始化竞态，修复后的 run `30287841720` 已完成恢复与 23/1/1/6 schema 断言。
- Newsletter 已使用 Resend Contacts/Topic 真实写路径并保持 Preview 失败关闭；Production 端点有按 IP 限流且不会由公开重复提交逆转退订状态；People 页已接正式 website Discord invite。
- fixture 占位外链已经移除，最低隐私与订阅同意已实现；首批真实内容及其作者外链仍未审核。
- 2026-07-28 公共产品彻查、本地修复、受保护 Preview 和 staged Production 均已 `PASS`。Preview 已用 25 个合格人物通过桌面 24/页、移动 12/页、翻页、筛选与 Spotlight，周轮换为相邻周互斥并覆盖跨年边界。Production 首轮 accessibility 的空首页 `h1` 与 4.39:1 对比度已修复；最终独立复审确认无 contrast failure、逻辑 tab order、3px focus-visible、桌面/移动无溢出，运行日志无邮件适配器告警或 5xx，P0/P1/P2 均为 0。
- 公共产品候选提交为 `4125230`，人物规模与轮换修复提交为 `31a7988 / 5964da7 / 3be99c6`。最终受保护 Preview `dpl_AZaJ5DPimMSjq2NakcciToVAvVrL` 为 `READY / target: null`，绑定 clean HEAD `2ec2aeb`；staged Production `dpl_DvSJVxiPcpAGfrhWk3GcSW92tcCp` 为 `READY / target: production`，绑定 clean HEAD `d95e2b1`，数据库 29/5 且零业务数据。

## Accepted Baseline

- 继续使用现有 `lonelyreader` Vercel Pro 团队和 `china-in-fact` project；Production 使用独立环境资源。
- Functions 保持 `iad1`，Production Neon 使用 AWS `us-east-1` 的 Launch plan，Production Blob 使用独立 `iad1` store。
- Vercel Standard Protection 继续保护 Preview/生成 URL，正式自定义域名公开；不购买 Advanced Protection add-on。
- 使用 Resend 同时提供 Payload 事务邮件和 Newsletter Contacts/Broadcasts；首期在 Free 限额内验证。
- Neon 设 7 天 restore window 并在 migration 前创建快照/逻辑导出；Blob 另做定期异地副本，不把代码回滚当数据恢复。
- 正式域名采用 `chinainfact.com`；产品负责人已于 2026-07-27 在当前 Vercel 账户购买，绑定与 DNS 仍留在发布末端门禁。

## Accepted Decision Package

产品负责人已于 2026-07-27 接受以下基线；接受不自动创建资源或授权 product code：

1. `Vercel Pro + Neon Launch + Production Blob`，区域继续 `iad1 / us-east-1`。
2. 已购 `chinainfact.com` 在 staged production PASS 后再绑定项目并改 DNS；购买不提前触发公开。
3. Newsletter 与 Payload 事务邮件统一使用 Resend；不接受时，首发必须移除全部 Newsletter 入口并另选事务邮件。
4. website Discord invite 使用 `https://discord.gg/CCUbfaRVd2`；上线代码只接正式 source invite，不使用 Discord 通用首页。
5. 数据库 7 天 restore window；媒体建立单独异地备份，并在公开前各完成一次恢复演练。

## Account And Resource Preparation

- 已就绪：现有 Vercel Pro account、已链接的 `china-in-fact` project、Preview Neon integration、Preview Blob 和已购 `chinainfact.com`；不需要新建 Vercel account 或第二个 App。
- 人工邮箱已就绪：复用现有飞书组织启用 `chinainfact.com`，创建公共邮箱 `hello@chinainfact.com` 并授权给产品负责人；没有新增邮箱供应商或账号。
- Discord 已就绪：`China, in Fact` server 的 website invite 已实时验证为永久有效并进入 `start-here`；无需新建 server 或 invite。
- Resend 已就绪：`mail.chinainfact.com / us-east-1` 已验证，Topic、locale 属性、两把职责隔离的 Production key 与八项 Vercel 变量均已回读。
- 已创建：`china-in-fact-production-db` 为 Neon Launch、`iad1 / us-east-1`、仅连接 Production；`china-in-fact-production-media` 为公开 Blob、`iad1`、仅连接 Production。
- Production 已具备独立数据库、Blob、Payload、CMS、邮件、稳定 HTTPS origin 和 `noindex` 变量；环境校验通过，migration 后数据库为 29 张 `public` 表和 5 条 migration，首位 Super Admin 已建立，内容数据为 0，Blob 为 0B。
- Neon Console 已完成账号激活并将 `History retention` 从 1 day 调整为 7 days；异地备份目标、只读 backup role 与首次恢复演练已完成。
- Cloudflare R2 Standard 已激活；私有桶使用 North America East、全部对象 30 天防删、`database/` 90 天生命周期。Account API token 只允许指定桶对象读写，GitHub Actions secrets/variables 已配置，每月 US$10 预算提醒已建立。
- Neon Launch 或其他付费资源出现结算/条款确认时由产品负责人完成；Codex 不代替接受付费条款。

## Work

- [x] 产品负责人在 P2 PASS 后指示继续推进，授权建立 Production launch 准备线（2026-07-27）。
- [x] 只读核验当前 Vercel project、代码阻断和官方 Production 能力；见 [`readiness research`](../../reference/implementation/production-launch-readiness-research-2026-07-27.md)。
- [x] 产品负责人购买 `chinainfact.com`；CLI 回读确认域名位于当前 Vercel 账户、使用 Vercel nameserver、到期日为 2027-07-27，尚未绑定项目（2026-07-27）。
- [x] 从 `/Volumes/External/codex-ops` 找到 website source invite，并经 Discord 公共 API 验证 `https://discord.gg/CCUbfaRVd2` 指向 `China, in Fact / start-here`、无到期时间（2026-07-27）。
- [x] 复用现有飞书组织启用 `chinainfact.com` 邮箱域名；Vercel DNS 已配置并回读 MX、SPF、域名验证、DKIM 和监测态 DMARC，飞书 CLI 已确认 `hello@chinainfact.com` 为产品负责人可访问的公共邮箱，并已向 `gexu@lonelyreader.com` 实发且确认收达（2026-07-27）。
- [x] 产品负责人接受完整推荐基线（2026-07-27）。
- [x] 获得 checklist commit 批准，提交本清单并固定 HEAD 授权基线（2026-07-27）。
- [x] 用 [`ADR-0008`](../../decisions/0008-production-launch-foundation.md) 固定 Production 基础设施、邮件、域名、备份、成本和退出路径。
- [x] 获得 product code 与 dependency install 批准，修复环境守卫、邮件、Newsletter、Discord、robots 和占位外链（2026-07-27）。
- [x] 实现最低限度隐私、显式订阅同意、Resend Topic 退订偏好和 Preview 失败关闭；真实作者资料仍在内容公开门禁逐人审核（2026-07-27）。
- [x] 创建并验证 `mail.chinainfact.com / us-east-1`、Topic、locale 属性、职责隔离的 Production keys 与 Vercel 变量；事务邮件实发收达，临时联系人/key 清理后 Contacts 为零（2026-07-27）。
- [x] 配置并发布 Vercel Firewall 规则 `Newsletter signup rate limit`：仅匹配 Production `POST /api/newsletter`，每 IP 每 600 秒 5 次，超限返回 rate-limit；路由同时拒绝缺失或跨域 Origin，已有联系人只更新 locale、不覆盖退订偏好（2026-07-27）。
- [x] 邮件与 Newsletter slice 经同一非主持实现者两轮独立复审；首轮 3 个 P1 与 2 个 P2 全部修复，第二轮 PASS，剩余 P0/P1/P2 为零（2026-07-27）。
- [x] 产品负责人批准进入 Production 资源阶段；创建并回读独立 Neon Launch `china-in-fact-production-db` 与 Blob `china-in-fact-production-media`，均仅连接 Production，环境校验为 `cms + blob + noindex`，空库与空 Blob 未执行 migration 或真实数据写入；Neon `History retention` 已回读为 7 days（2026-07-27）。
- [x] 创建并回读 Production Neon、Blob 与 R2 备份目标及其 secrets；首次空库 dump 与零对象媒体清单已完成写入、读回和隔离恢复，GitHub Actions run `30286886253` 全步骤成功（2026-07-28）。
- [x] migration 前恢复点已验证，Production migration 已执行并回读 23 张表、1 条 migration、0 业务数据；迁移后 run `30287841720` 完成 R2 读回、SHA、隔离恢复、schema 断言和零媒体清单验证（2026-07-28）。
- [x] 对全体公共路由、CMS schema、发布门禁、People 机制、双语、账号启动与 CI 覆盖执行只读 Production 产品彻查；结论 `BLOCK`，真实数据门禁撤回到公共产品闭环之后（2026-07-28）。
- [x] 完成本地第一修复片：CMS 首页、Stories/Guides、People/人物页、Purpose/Topic/About、真实 portrait/cover、发布时间、发布完整性、署名归属、匿名字段隔离、双语 canonical 跳转、People 搜索筛选/分页与按周稳定轮换；生成 migration 与 types，并以临时 PostgreSQL 完成迁移、权限和公共 runtime 验收（2026-07-28）。
- [x] 固定并实现 Places 一等对象：独立 Place 编辑节点映射 Geography，公开内容和人物自动聚合；列表、详情、双语 canonical、发布负例、25/3 schema、全量 rollback/reapply 与 CMS runtime 均通过本地验收（2026-07-28）。
- [x] 实现首页 lead/推荐池生效与到期、自动回退，以及 Spotlight 单人置顶、排除、按周稳定轮换和足量人物池下的连续曝光规避；发布窗口与置顶冲突负例由服务端验证（2026-07-28）。
- [x] 补齐人物资料修订审核和媒体公开使用边界；数据库唯一键阻止并发双修订，行锁和旧值核对阻止并发审核分叉，上传归属不可伪造，应用记录不可常规删除；第 5 条 migration 在空库完成 reverse rollback/reapply 与并发/权限负例，Production 仍未应用（2026-07-28）。
- [x] 建立首位 Super Admin、密码重置和最多 500 人一批的 dry-run-first 可审计开户 CLI；显式环境/数据库目标和 Production 专属确认失败关闭，首位管理员在锁定事务中建立，批量账户原子写入且邮件结果完整汇总。虚构空库并发启动严格只创建一人（2026-07-28）。
- [x] 经产品负责人提供身份后在 Production 建立首位 Super Admin，回读严格为 1 名 Super Admin；建立后备份 run `30343054714` 完成 dump、SHA、隔离恢复、29/5/5/8 断言和零媒体清单。首次真实重置邮件暴露相对链接缺陷，提交 `bd35454` 增加经环境校验的 HTTPS Production origin；deployment `dpl_4QkjZptx6L5LGspiS61nDMWNLFHL` 上重发成功，Resend 回读 delivered 且邮件使用稳定 alias，健康检查为 200（2026-07-28）。
- [x] 同一非主持实现者完成公共产品本地候选两轮只读复审：首轮 5 个 P1、3 个 P2 全部修复，第二轮 PASS，P0/P1/P2 为零；该结论不替代受保护 Preview 的 release-level 复审（2026-07-28）。
- [x] 产品负责人批准提交候选并推进受保护 Preview；创建提交 `4125230`。发布前回读发现 Preview schema 仍为 23/1，旧短 `PAYLOAD_SECRET` 已安全轮换，deployment 在 migration 门禁前停止（2026-07-28）。
- [x] 经单独批准建立迁移前 dump 与隔离恢复点，Preview 从 23/1 升至 29/5；纯虚构数据完成公共路由、媒体公开批准、25 人桌面/移动分页、搜索/Topic/Place/Language 筛选、Spotlight 周稳定与跨周/跨年避重、权限负例、语言跳转、基础可访问性、保护/noindex 和运行日志验收，clean deployment 经独立复审 PASS（2026-07-28）。
- [x] 产品负责人统一批准后，先以 run `30339027394` 完成最后一次 23/1 恢复，再应用 Production 四条新增 migration；workflow 在 commit `8cef12e` 收紧到 29/5，run `30339406235` 完成 R2 读回、SHA、隔离恢复、29/5/5/8 断言和零媒体清单（2026-07-28）。
- [ ] 分别批准真实作者账户、人物、文章、媒体、外链与公开状态；完成编辑审核。
- [x] 生成 `--prod --skip-domain` staged deployment `dpl_DvSJVxiPcpAGfrhWk3GcSW92tcCp`；首轮发现并修复空首页无 `h1` 和 4.39:1 对比度，最终实现者复验唯一 `h1`、零 contrast failure、逻辑 tab order、3px focus-visible、桌面/移动无溢出/破图/浏览器错误、健康检查 200、无邮件适配器告警或 5xx（2026-07-28）。
- [x] 非主持实现者完成 staged Production 独立复审：部署/HEAD/SSO/noindex、29/5 空库、迁移前后恢复、桌面/移动、可访问性和运行日志均回读，结论 `PASS`，P0/P1/P2 为 0；该结论不授权真实数据、正式域名或索引（2026-07-28）。
- [ ] PASS 后分别批准域名绑定、DNS、内容公开和搜索引擎索引。
- [ ] 发布后回读、监控、回滚演练和归档。

## Acceptance

- 正式域名、邮件、数据库、媒体、备份、预算、RPO/RTO 和退出方式有已接受决定。
- Production 使用独立资源与密钥；Preview 仍受保护、`noindex` 且只含虚构数据。
- Newsletter 真正落库或进入已接受邮件平台并支持退订；Payload 重置密码邮件可达。
- Discord 与作者外链真实、明确且可撤回；公开页不含虚构验收内容或占位外链。
- migration、备份恢复、权限、语言、移动端、可访问性、安全头和秘密扫描均通过。
- staged production 经独立复审 PASS 后才绑定正式域名；索引是最后的单独门禁。
- 发布后健康检查、错误日志和回滚目标可用，Current State 与历史已回写。

## Validation

- 官方版本、供应商限额、区域、成本、邮件域名与备份能力核验。
- lint、typecheck、目标测试、production build、依赖审计、copy gate 和 changed-path 检查。
- 空 Production migration、状态回读、数据库 PITR/restore、媒体异地副本和恢复演练。
- Author / Editor / Super Admin 权限负例、匿名字段隔离和英语/西班牙语公开隔离。
- Newsletter 订阅、重复提交、失败、退订与滥用保护；事务邮件可达性。
- staged production 桌面/移动端浏览器 smoke、console、网络错误、安全头和 robots 检查。
- 独立复审、发布后日志回读与人工 PASS / BLOCK。
- `npm run governance:check`
- `git diff --check`

## Writeback

- 当前环境与能力：`docs/current-state.md`
- Production 技术决定：`docs/decisions/`
- 长期发布、数据、权限和恢复规则：`docs/architecture/`
- 调研、migration、恢复、部署与复审证据：`docs/reference/implementation/`
- 执行状态：本清单与 `docs/roadmap/README.md`
- 完成历史：`docs/archive/`

## Approval Gates

产品负责人已接受 Production 基线，并于 2026-07-28 明确统一批准为查看 Production 所需的后续动作。域名购买、飞书人工邮箱、Resend、邮件 DNS/密钥、Newsletter/隐私、Discord、Production 环境代码、独立 Neon、独立 Blob、R2、全部 migration、29/5 恢复断言、staged Production deploy 与首位 Super Admin 已完成并回读。Production 内容数据仍为零；没有可供推导的真实贡献者名单或内容，因此其他账户、真实内容、内容公开、正式域名绑定和索引均未擅自执行。
