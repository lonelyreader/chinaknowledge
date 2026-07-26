---
doc_contract: DocContractV1
doc_type: checklist
authority: execution
status: active
scope: p1-public-runnable-slice
last_verified: 2026-07-27
max_lines: 220
change_id: P1-WEB-001
risk_tier: upgraded
validation_profile: work_item
allowed_paths: package.json, package-lock.json, apps/README.md, apps/web/**, docs/current-state.md, docs/architecture/**, docs/decisions/**, docs/roadmap/README.md, docs/roadmap/checklists/README.md, docs/roadmap/checklists/p1-public-runnable-slice.md, docs/archive/README.md, docs/reference/**
approval_gates: product-code, dependency-install, paid-service, account-activation, cms, database-schema, migration, real-data, production-deploy, content-publication
---

# P1 Public Runnable Slice

目标：把已经接受的公共站设计实现为一个本地可运行、可在浏览器验收的 `en / es` 公共 Web App 切片，为后续编辑工作流提供稳定前台基线。

## Scope

- 先确认技术栈并写 ADR，再安装依赖。
- 在 `apps/web` 建立一个公共 Web App。
- 实现 `en / es` 首页、Guide、People 列表、作者主页与 Newsletter 成功/错误状态。
- 用独立 typed fixture 文件承载样例内容，不把长内容写死在组件中。
- 实现 `DESIGN.md` 约束下的 tokens、公共布局、响应式和必要交互。
- 为 Guide、People 和作者建立可直接访问的语言化 URL。
- 用桌面与移动端浏览器验证接受结构和关键状态。

建议栈为 Next.js App Router、TypeScript 与 Tailwind CSS；它只是待 ADR 验证的入口，不是本清单预先批准的事实。

## No-go

- 不接 CMS、Payload、登录、作者或编辑权限。
- 不建数据库、schema、migration 或持久化写路径。
- 不接邮件供应商、Discord、分析服务或付费服务。
- 不使用真实作者、真实内容、真实账号或个人数据。
- 不部署 preview 或 production，不公开批量内容。
- 不提前抽取共享 package，不实现投稿、审核或公开后台。

## Upgraded Boundaries

- `data_truth`：仅使用仓库内的虚构 fixture 文件；不声称是真实作者、内容、账户或运营数据。
- `read_path`：typed fixture loader 向公共页面提供内容；组件不直接内嵌完整文章或人物数据。
- `write_path`：仅有浏览器内 Newsletter 成功/错误状态；不发送网络请求，不持久化。
- `permission_boundary`：匿名公共读路径；没有作者、编辑、管理员或认证能力。
- `audit_boundary`：不采集用户或审计数据；只保留本地验证命令与截图证据。
- `recovery`：删除或回退 `apps/web` 切片即可恢复；根治理文件不依赖应用运行。
- `independent_review`：非实现者在完成前复核响应式、语言路由、可见文案和边界证据，并给出 PASS 或明确问题。

## Work

- [x] 确认技术栈、运行边界与目录，并写入 ADR。
- [x] 获得 `product-code` 与 `dependency-install` 单独批准（2026-07-27，产品负责人确认“全部批准”）。
- [x] 建立 `apps/web` 和本地开发命令。
- [x] 实现 tokens、公共布局、导航与响应式基础。
- [x] 建立 typed fixtures、`en / es` 内容和语言路由。
- [x] 实现首页、Guide、People 列表和作者主页。
- [x] 实现 Newsletter 默认、成功与错误状态。
- [x] 完成自动检查、浏览器验收、截图和人工 copy gate。证据见 [`p1-public-runnable-slice-2026-07-27.md`](../../reference/implementation/p1-public-runnable-slice-2026-07-27.md)。
- [x] 产品负责人作为非实现者完成独立复审并给出 PASS（2026-07-27）。
- [ ] 完成归档收口并提交本清单。

## Acceptance

- 仓库中有明确的本地启动命令，公共 App 可以运行和构建。
- 页面继承已接受的 Stitch 结构、首页混合编排与 People 发现机制，并符合 `DESIGN.md`。
- 样例内容位于独立 fixture 文件；组件不承载大段文章数据。
- `en / es` 有独立 URL 和对应内容；缺失语言或资源进入明确的 not-found，不静默回退到另一语言。
- 首页、Guide、People 和作者页在桌面与移动端没有结构性断裂或横向溢出。
- 可交互目标满足 44px 下限；键盘焦点和必要状态可见。
- Newsletter 仅演示本地表单状态，不制造已订阅或已发送的产品事实。
- 公共界面没有作者或编辑控制，也没有工程、权限、数据库或操作指导类可见文案。
- 浏览器主流程、自动检查、人工 copy gate 与独立复审均有可追溯证据。

## Validation

- ADR 确认后登记该栈实际可用的 lint、typecheck、test 与 build 命令。
- 本地桌面与移动端浏览器 smoke test。
- 检查 `en / es` URL、not-found、导航、Newsletter 状态和横向溢出。
- 人工扫描全部新增可见文字。
- `npm run governance:check`
- `git diff --check`

## Writeback

- 当前能力：`docs/current-state.md`
- 技术决定：`docs/decisions/`
- 验收证据：`docs/reference/`
- 执行状态：本清单与 `docs/roadmap/README.md`
- 完成历史：`docs/archive/`

## Approval Gates

`product-code` 与 `dependency-install` 已于 2026-07-27 获得批准。CMS、数据库、真实数据、部署和内容公开未获授权，继续留在后续独立门禁。
