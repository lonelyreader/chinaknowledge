---
doc_contract: DocContractV1
doc_type: checklist
authority: execution
status: completed
scope: p1-editorial-cms-foundation
last_verified: 2026-07-27
max_lines: 240
change_id: P1-EDITORIAL-001
risk_tier: upgraded
validation_profile: work_item
allowed_paths: .gitignore, package.json, package-lock.json, compose.yaml, apps/README.md, apps/web/**, apps/cms/**, docs/current-state.md, docs/architecture/**, docs/decisions/**, docs/roadmap/README.md, docs/roadmap/checklists/README.md, docs/roadmap/checklists/p1-editorial-cms-foundation.md, docs/archive/README.md, docs/archive/p1-editorial-cms-foundation.md, docs/reference/README.md, docs/reference/technical-stack-proposal.md, docs/reference/implementation/**
approval_gates: checklist-commit, product-code, dependency-install, cms, local-database, database-schema, migration, account-activation, real-data, preview-deploy, production-deploy, content-publication
---

# P1 Editorial CMS Foundation

目标：在本地、纯虚构数据边界内，为 **China, in Fact** 建立可验证的编辑 CMS 基础，并让一条内容从作者草稿经过审核、退回、批准和独立公开确认后进入现有公共站。

本清单以一位虚构作者和一篇虚构 Guide 作为合同证明，不为该样例建立专用 schema、页面或权限分支。

## Scope

- 核验 Payload 与当前 Next.js 16 公共应用的兼容性，并用 ADR 决定同应用集成或独立 CMS 应用。
- 决定本地数据库、schema、migration、备份与清空重建方式；生产供应商继续 deferred。
- 建立 `Author / Editor / Super Admin` 角色与基于文档所有权的权限。
- 建立 People、Article、分类、来源说明、编辑评论和必要审计字段。
- 明确区分业务工作流状态与 CMS 自带的 draft / published 状态。
- 支持 `en / es` 独立标题、正文、URL 和公开状态，不静默回退到另一语言。
- 复用现有公共内容契约，让 CMS 读路径替换或并行于 fixture loader，而不重写公共页面。
- 用虚构数据跑通作者投稿、编辑审核、退回重投、批准、公开确认和公共读取。
- 使用成熟 CMS Admin；只在权限、工作流或可用性无法表达时增加最小定制。

## No-go

- 不接生产或 preview 环境，不选择或开通付费数据库、对象存储、邮件或托管账号。
- 不创建真实作者账号，不导入真实人物、文章、邮箱、外部链接或个人数据。
- 不执行 production migration，不批量迁移现有 fixtures，不让任何内容对外公开。
- 不实现 Newsletter、Discord、分析、支付、私信、作者排行或服务市场。
- 不先造一套独立定制后台，不按 Stitch 缓存截图复制旧模板视觉或文案。
- 不把 CMS 的 `_status` 直接当作完整编辑工作流，也不让前端隐藏按钮代替服务端权限。
- 不提前进入 P2 上线准备。

## Upgraded Boundaries

- `data_truth`：只使用本地一次性数据库与明确标记的虚构账户、人物和内容；数据库不是生产真相。
- `read_path`：匿名公共读取只能得到目标语言已公开内容；草稿、审核状态、评论、来源备注和账户字段不得泄漏。
- `write_path`：写操作只进入本地 CMS；状态变化必须经过允许的角色、合法前置状态和服务端校验。
- `permission_boundary`：Author 只能管理自己的资料与内容且不能批准或公开；Editor 可审核全部内容并执行独立公开确认；Super Admin 额外管理用户和角色。UI 隐藏不算权限证明。
- `audit_boundary`：记录状态变化、操作者、时间、退回意见、批准和公开确认；不记录密码、token 或无关个人数据。
- `recovery`：schema 和 migration 在执行前给出回退方式；本地数据可导出或清空重建；当前 fixture 公共站在 CMS 验收完成前保持可恢复。
- `independent_review`：产品负责人或其明确授权代理用三个角色和匿名读者复核主流程、权限负例、双语隔离、响应式和可见文案，并给出 PASS 或 BLOCK；代理复审必须如实记录，不冒充人员隔离。

## Acceptance Fixture

- 虚构 Author `Chen Rui` 创建英语 Guide 草稿并保存，无法看到批准、排期或公开动作。
- Author 提交后不能继续绕过审核直接改为 Public；Editor 能接手、留下锚定意见并退回。
- Author 只能修改自己的退回稿并重新提交，不能读取或修改另一位作者的草稿。
- Editor 完成来源与分类检查后批准；批准不自动公开。
- Editor 在独立确认状态核对标题、作者、对象、语言、URL、来源、分类和 Freshness 后公开英语版本。
- 匿名 `/en` 读路径可以读取英语公开版本；对应西语版本保持未公开并返回 not-found，不回退英语正文。
- Super Admin 可以管理测试账户与角色；Editor 和 Author 都不能提升自己的角色。

## Work

- [x] 将本清单作为唯一 active checklist 提交，建立后续改动的 HEAD 授权基线（2026-07-27，产品负责人批准）。
- [x] 刷新 Payload 官方兼容性、权限、草稿、双语状态与 PostgreSQL 能力证据。
- [x] 用最小 spike 比较同应用集成与独立 CMS 应用，并由 [`ADR-0006`](../decisions/0006-editorial-cms-foundation.md) 固定同应用集成与本地 PostgreSQL 方案。
- [x] 决定独立语言文档、业务状态、Payload 公开状态和审计事件的职责，不依赖 CMS 默认值猜测。
- [x] 单独获得 `product-code`、`dependency-install`、`cms`、`local-database` 与 `database-schema` 批准（2026-07-27，产品负责人确认“全部批准”）。
- [x] 建立可清空重建的本地 CMS 与虚构测试账户，不连接任何外部账号或真实数据。
- [x] 实现 People、Article、分类、来源、评论、版本和工作流状态。
- [x] 实现 Author 所有权、Editor 审核与公开、Super Admin 账户角色权限及服务端负例。
- [x] 实现 `en / es` 独立内容与公开状态，并接入现有公共内容 loader 边界。
- [x] 跑通 Acceptance Fixture 的桌面主流程与必要移动端状态。
- [x] 完成自动检查、权限矩阵、schema / recovery 证据、浏览器截图和人工 copy gate；见 [`P1-EDITORIAL-001 evidence`](../reference/implementation/p1-editorial-cms-foundation-2026-07-27.md)。
- [x] 产品负责人授权 Codex 代理完成独立复审；补齐公开前摘要并修复后台按钮与公共 Guide 移动端宽度后复核 PASS（2026-07-27；不是不同人员隔离）。
- [x] 获得 commit 批准，提交实现与证据并完成归档收口（2026-07-27）。

## Completion

- Result：实现者验证与产品负责人授权的代理独立复审均为 PASS。
- Evidence：[`P1 Editorial CMS Foundation Evidence`](../reference/implementation/p1-editorial-cms-foundation-2026-07-27.md)。
- Boundary：migration 尚未执行；没有外部账号、真实数据、preview、production 或对外内容公开。

## Acceptance

- 技术 ADR 说明 Payload 是否采用、放置位置、数据库选择、公共读路径和退出方案。
- 业务工作流至少表达 `Draft / Submitted / In review / Changes requested / Approved / Public / Archived`，合法转换可测试。
- 权限由服务端 access control 和状态转换共同保证；三个角色的允许项与禁止项都有自动化负例。
- `en / es` 语言版本拥有独立 URL 与公开状态；任何 fallback 都不能泄漏未公开或错误语言内容。
- 来源说明、编辑评论、版本和审计信息只对允许角色可见，不进入匿名公共响应。
- 现有公共首页、Guide、People 和作者页保持可构建；CMS 接入通过稳定 loader 契约完成。
- 后台可见文字遵守 `DESIGN.md`，不出现模板页脚、内部工程术语、操作教学或解释性长文案。
- 本地数据库可以通过记录过的命令安全重建；migration、生产部署、真实数据和内容公开仍保持未授权。

## Validation

- Payload / Next 版本与 peer dependency 检查。
- lint、typecheck、build 与目标测试命令，以 ADR 确认后的实际应用为准。
- Author / Editor / Super Admin 权限矩阵和所有权负例。
- 工作流合法与非法状态转换测试。
- `en / es` 草稿、公开、not-found 与匿名响应字段检查。
- 桌面完整编辑流程和移动端状态 / 轻量审核浏览器 smoke test。
- schema 变更预览、migration dry-run、清空重建与恢复演练；执行 migration 仍需单独批准。
- 人工扫描全部新增可见文字。
- `npm run governance:check`
- `git diff --check`

## Writeback

- 当前能力：`docs/current-state.md`
- 技术与数据决定：`docs/decisions/`
- 长期权限或恢复合同：`docs/architecture/`
- 版本、权限、migration、浏览器和复审证据：`docs/reference/implementation/`
- 执行状态：本清单与 `docs/roadmap/README.md`
- 完成历史：`docs/archive/`

## Approval Gates

`product-code`、`dependency-install`、`cms`、`local-database`、`database-schema` 与 commit 已于 2026-07-27 获得批准并完成。Migration 执行、账号开通、真实数据、preview、production 和内容公开继续保持未授权；本轮只生成并审查了 migration 文件，没有执行共享或生产 migration。
