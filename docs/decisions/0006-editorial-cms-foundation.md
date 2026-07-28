---
doc_contract: DocContractV1
doc_type: decision
authority: canonical
status: accepted
scope: decision-editorial-cms-foundation
last_verified: 2026-07-28
max_lines: 150
change_id: P1-EDITORIAL-001
---

# ADR-0006：编辑 CMS 基础

## Context

> 2026-07-28：本文关于单一投稿审核状态、Author 禁止公开、Person revision 必审与统一公开门槛的决定已被 [`ADR-0009`](0009-member-publishing-and-editorial-curation.md) 替代；同应用 Payload、PostgreSQL、语言独立记录、服务端权限、版本审计、Media 隔离与 migration 纪律继续有效。

P1 需要在不破坏现有公共站的前提下，证明作者投稿、编辑审核、独立公开确认、双语隔离和公共读取是一条可执行工作流。当前公共应用是 Next.js 16.2.12；Payload 3.86.0 官方模板和 peer dependency 已支持 Next.js 16.2.6 以上版本。

Payload 的 draft 只原生表达 `draft / published`，locale-specific status 仍是实验功能；它们不能直接替代本项目的审核状态和英语、西班牙语独立公开合同。

## Decision

- Payload 3.86.0 集成在现有 `apps/web`，不建立第二个 Next.js 应用。公共站与 CMS 分别进入 `(frontend)` 和 `(payload)` route group，保持现有公共 URL，并为两个界面使用独立 root layout。
- CMS Admin 与 API 使用 Payload 官方 Next.js 路由，分别位于 `/admin` 和 `/api`；不自行复制成熟 CMS 的通用工作台。
- 本地数据库使用 Docker 中的 PostgreSQL 16，通过只绑定 `127.0.0.1` 的 app-local Compose 配置运行。生产数据库和托管供应商继续 deferred。
- Payload schema、生成类型、migration 文件和运行代码构成同一个变更合同。开发期允许对一次性本地数据库执行 Drizzle push；migration 只生成和审查，本轮不对任何共享或生产环境执行。
- Article 每个语言版本使用独立文档，以 `locale` 和 `translationGroup` 建立关系；不启用实验性的 localized status。公共读取必须同时匹配目标 locale、`workflowStatus=public` 和 Payload `_status=published`，且不使用语言 fallback。
- `workflowStatus` 独立表达 `draft / submitted / in_review / changes_requested / approved / public / archived`；Payload `_status` 只承担草稿版本与公开版本存储。合法转换由服务端 hook 校验，不能只依靠隐藏按钮。
- Author、Editor、Super Admin 使用同一认证集合。Author 的文档所有权、Editor 的全局审核和 Super Admin 的角色管理同时由 collection、field access 和状态转换规则约束。
- 已公开人物不接受 Author 原地改写。Author 在独立 Profile revision 中维护完整资料快照并提交；公开 Person 保持不变，Editor 只能要求修改或把作者提交的版本整体应用，不能静默改写作者提案。每人至多一条开放修订由数据库唯一键保证；更新先锁定并核对当前 revision，已应用记录不通过常规 collection access 删除。
- Media 是准备公开的图片库：上传归属由服务端写入；经 Payload/API 或 Payload 文件路由访问时，未获 Editor 公开使用批准的记录只能由上传者和编辑角色读取，不能被其他 Author 或匿名请求读取，也不能用于公开 Article、Person 或 Place。现有 Vercel Blob adapter 只支持 public store，底层 Blob URL 不具备同等权限，因此敏感原始文件不得上传到该 collection；若以后需要私密原件，使用独立 private store 和鉴权读取链路。
- 首位 Super Admin 只允许在空 Users collection 中由一次性 CLI 建立，零用户检查与创建必须处于同一个锁定事务。后续批量开户默认 dry-run，只接受 Author/Editor；apply 必须明确应用环境与数据库目标、现有 Super Admin 身份和专属确认，账户批量写入原子提交，Production 强制发送密码重置邮件并汇总失败项供重发。
- 公共页面通过现有 content loader 契约读取 CMS；在本工作项验收完成前保留 fixture 路径，确保公共站可恢复。
- Local API 代表具体用户执行时必须传入用户并设置 `overrideAccess: false`；测试不得用默认绕过权限的行为证明角色合同。

## Consequences

- 公共站与 CMS 共用一个 Next.js 构建、类型系统和部署单元，减少跨应用 API、CORS 和版本漂移；CMS 数据库仍只在需要的服务端路径初始化。
- 双语版本会有少量共享字段重复，但公开状态、URL、标题和编辑排期天然独立，且不依赖 beta 能力。
- 业务审核状态需要最小自定义动作和审计记录；Payload 默认 Publish 按钮不能直接代表完整公开确认。
- 本地 Postgres 与生产候选保持同类数据库，但本地数据和容器卷均可清空，不构成生产事实。
- 未来若更换 CMS，公共页面继续依赖项目自己的 content contract；迁移 People、Article、taxonomy 和 workflow events，而不是重写页面组件。

## Recovery And Exit

- 关闭 CMS 读开关即可恢复 fixture 公共读路径。
- 本地数据库可停止并以空卷重建；任何清空动作只针对明确命名的本项目容器和 volume。
- 每次 schema 改动同时检查 migration、Payload 生成类型、live local schema 和 runtime tests。
- 生产 migration、真实数据导入、preview 和 production 部署必须另行批准。

## Verification Basis

- Payload blank template 3.86.0 已验证同一 Next.js 应用内的 `(frontend)` / `(payload)` route group 结构。
- npm peer dependency：`@payloadcms/next@3.86.0` 接受 Next.js `>=16.2.6 <17.0.0`。
- 官方参考：[Installation](https://payloadcms.com/docs/getting-started/installation)、[Local API access](https://payloadcms.com/docs/local-api/access-control)、[Localization](https://payloadcms.com/docs/configuration/localization)、[Migrations](https://payloadcms.com/docs/database/migrations)。
