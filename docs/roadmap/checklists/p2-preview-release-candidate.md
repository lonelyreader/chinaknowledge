---
doc_contract: DocContractV1
doc_type: checklist
authority: execution
status: active
scope: p2-preview-release-candidate
last_verified: 2026-07-27
max_lines: 220
change_id: P2-PREVIEW-001
risk_tier: upgraded
validation_profile: phase_release
allowed_paths: .github/**, apps/README.md, apps/web/**, scripts/**, vercel.json, docs/current-state.md, docs/architecture/**, docs/decisions/**, docs/roadmap/README.md, docs/roadmap/checklists/README.md, docs/roadmap/checklists/p2-preview-release-candidate.md, docs/archive/README.md, docs/archive/p2-preview-release-candidate.md, docs/reference/README.md, docs/reference/technical-stack-proposal.md, docs/reference/implementation/**
approval_gates: checklist-commit, product-code, dependency-install, provider-choice, account-activation, paid-service, secrets, preview-database, object-storage, migration, preview-deploy, real-data, dns, production-deploy, content-publication
---

# P2 Preview Release Candidate

目标：把 P1 的本地公共站与编辑 CMS 收敛成一个使用纯虚构数据、受保护且不被搜索引擎收录的 preview release candidate，证明部署、数据库、媒体、migration、权限、恢复和回读链路可工作；本清单不进行 production 发布。

## Scope

- 基于当前 Next.js + Payload 架构核验托管、PostgreSQL、对象存储和 preview 运行方式，形成一个可退出的技术决定。
- 建立 `local / preview / production` 配置边界，确保密钥只在服务端环境管理，不进入仓库、客户端或截图。
- 让 CMS 媒体使用可持久化存储；preview 不依赖实例临时文件系统。
- 为已生成的 migration 建立 preview 执行、状态回读、备份与恢复方案；任何执行仍需单独批准。
- 建立最小 CI、部署前检查、健康检查和发布回读，保留可回退到上一提交或 fixture 读路径的办法。
- 在单独批准后创建受保护 preview，使用虚构账户、人物和文章复跑 P1 主流程。
- 检查 preview 的访问控制、`noindex`、安全响应头、错误边界、英语/西班牙语隔离和移动端关键路径。

## No-go

- 不部署 production，不配置正式域名、DNS、搜索引擎提交或公开索引。
- 不导入真实作者、邮箱、人物、文章、媒体、外链或其他个人数据。
- 不把 P1 fixture 冒充正式内容，不对外批量公开内容。
- 不接通 Newsletter 发送、Discord 自动化、支付、交易、私信、广告或个性化追踪。
- 不购买或激活付费计划，不创建外部账号，不写入密钥，除非对应门禁已单独批准。
- 不因 preview 成功自动批准 production migration、production 部署或真实内容公开。

## Upgraded Boundaries

- `data_truth`：preview 只使用可删除的虚构验收数据；production 继续为空且不存在。
- `read_path`：preview 受访问保护并声明 `noindex`；匿名公共读取仍只返回目标语言已公开的虚构内容。
- `write_path`：写入仅进入明确标记的 preview CMS、preview PostgreSQL 与 preview 对象存储；Newsletter 和 Discord 不产生外部写入。
- `permission_boundary`：Author、Editor、Super Admin 继续使用 P1 服务端权限；部署层保护不能替代 CMS 权限负例。
- `audit_boundary`：记录 deployment、migration、备份、恢复和回读结果；不记录密钥、密码、完整邮箱或无关个人数据。
- `recovery`：代码可退回上一提交，公共读取可切回 fixtures，preview 数据库可从执行前备份恢复，preview 资源可明确删除。
- `independent_review`：非主持实现者复核 preview 主流程、权限负例、语言隔离、移动端、恢复证据和边界，并给出 PASS 或 BLOCK。

## Acceptance Fixture

- 一个受保护、`noindex` 的 preview URL 能加载英语公共站和 `/admin`，没有使用正式域名。
- 空 preview PostgreSQL 在单独批准后执行受控 migration，状态回读为已执行；执行前备份与失败恢复步骤可用。
- 虚构 Author、Editor、Super Admin 在 preview 复跑投稿、退回、批准、确认公开和撤回；权限负例与本地一致。
- 英语虚构 Guide 公开后返回 200；未公开西班牙语版本返回 404，不回退英语正文。
- 上传一张虚构测试图片后重新部署，图片仍可读取；删除测试资源的路径明确。
- 未配置 Newsletter、Discord、analytics、真实邮箱或真实外链；浏览器和构建产物不暴露密钥。
- preview 失败时能够回退上一提交，或切换 fixture 读路径恢复公共读取。

## Work

- [x] 产品负责人批准进入 P2，并同意先建立 preview release candidate 清单（2026-07-27）。
- [x] 获得 checklist commit 批准并提交本清单，建立后续改动的 HEAD 授权基线（`142052f`；router 写回 `6f2f2ca`）。
- [x] 只读核验当前官方托管、PostgreSQL、对象存储、Payload migration 与成本边界，形成候选比较；见 [`provider research`](../../reference/implementation/p2-preview-provider-research-2026-07-27.md)。
- [x] 用 ADR 固定 preview 架构、环境边界、供应商退出方式和 production 仍未授权的事实；见 [`ADR-0007`](../../decisions/0007-preview-hosting-foundation.md)。
- [x] 产品负责人接受 Vercel Pro + Neon Free + Vercel Blob 与 `US$20/月` preview 预算上限（2026-07-27）。
- [x] 产品负责人接受 Vercel Functions/Blob `iad1` 与 Neon AWS `us-east-1`，撤回未获批准的新加坡建议（2026-07-27）。
- [x] 获得 product code 与 dependency install 批准，完成应用修改并安装 Payload 官方 Vercel Blob adapter（2026-07-27）。
- [x] 获得 Vercel account activation 批准，在现有 `lonelyreader` Pro 团队创建并绑定零 deployment 的 `china-in-fact` project；没有新增购买，CLI 自动下载的临时 OIDC 环境文件已删除（2026-07-27）。
- [x] 获得密钥、preview 数据库与对象存储批准；创建 Preview-only Neon Free 数据库与 public `iad1` Blob store，配置五个应用必需键且没有把值写入仓库或留在本机（2026-07-27）。
- [x] 获得当前 P2 baseline commit、Preview migration、虚构验收数据、受保护 Preview deploy 与部署后验证批准；Production、正式域名、真实数据和内容公开不在本次授权内（2026-07-27）。
- [x] 实现环境校验、preview-only 持久化媒体配置、部署前检查、健康检查、安全头、CI 和 preview `noindex`；本地与静态配置验证通过。见 [`local preparation evidence`](../../reference/implementation/p2-preview-local-preparation-2026-07-27.md)。
- [x] 建立 migration plan、备份、恢复与删除资源步骤，并完成执行前资源回读。见 [`migration and recovery plan`](../../reference/implementation/p2-preview-migration-recovery-plan-2026-07-27.md)。
- [x] 执行 migration、装载虚构验收数据并部署受保护 Preview；最终 deployment 为 `dpl_DGYVZBMM3qUphXfg87dJgCU71A7x`（2026-07-27）。
- [x] 复跑 Acceptance Fixture、权限负例、响应式、copy gate、秘密扫描和发布后回读；实现者验收 PASS（2026-07-27）。
- [ ] 由独立复审者给出 PASS 或 BLOCK；PASS 后再决定是否建立 production launch checklist。
- [x] 获得后续 P2 commit 与 Preview deploy 批准，提交实现并回写执行证据。
- [ ] 独立复审 PASS 后完成归档收口。

## Acceptance

- Preview 架构、成本层级、数据位置、媒体持久化、退出路径和 production 差异有已接受 ADR。
- Local、preview、production 的环境变量和数据边界明确，仓库与客户端不包含密钥。
- Preview 使用持久化 PostgreSQL 与对象存储，不依赖实例本地文件；migration、备份和恢复有回读证据。
- Preview 受访问保护且不进入搜索索引；英语/西班牙语、角色权限和公共字段隔离保持 P1 合同。
- CI、build、健康检查、浏览器主流程、权限负例和恢复 smoke test 均通过。
- 所有内容、账户和媒体均为虚构验收数据；production、DNS、真实数据和内容公开仍未发生。

## Validation

- 官方版本、peer dependency、运行时与供应商约束核验。
- lint、typecheck、目标测试、production build 和依赖审计。
- Preview migration plan、状态回读、备份/恢复与资源删除演练。
- Author / Editor / Super Admin 权限矩阵和匿名字段负例。
- 英语公开、西班牙语未公开、媒体跨部署持久化和 fixture fallback。
- Preview 桌面与移动端浏览器 smoke、console、网络错误、安全头与 `noindex` 检查。
- 仓库、客户端 bundle、日志和证据中的秘密扫描。
- 独立复审、发布后回读与人工 PASS / BLOCK。
- `npm run governance:check`
- `git diff --check`

## Writeback

- 当前环境与能力：`docs/current-state.md`
- Preview 技术决定：`docs/decisions/`
- 长期发布与恢复规则：`docs/architecture/`
- 研究、migration、部署、浏览器和复审证据：`docs/reference/implementation/`
- 执行状态：本清单与 `docs/roadmap/README.md`
- 完成历史：`docs/archive/`

## Approval Gates

2026-07-27 已获得“进入 P2”、checklist、供应商选择、`US$20/月` preview 预算、美国东部区域、product code、dependency install、Vercel account activation、Preview 数据库、对象存储、密钥、后续 P2 commit、Preview migration、虚构验收数据、受保护 Preview deploy 与部署后验证批准。上述动作已执行。新增付费、真实数据、DNS、production deploy 和内容公开仍未授权。
