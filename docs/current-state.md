---
doc_contract: DocContractV1
doc_type: current
authority: canonical
status: active
scope: current-state
last_verified: 2026-07-27
max_lines: 160
---

# Current State

## 当前阶段

项目已完成并归档 **P1：可运行公共产品切片** 与 **P1：编辑 CMS 基础**。当前没有 active checklist；P2 尚未获得实现授权。

- 产品需求基线已经建立。
- Stitch 设计系统已经建立。
- 正式品牌名已经确定为 **China, in Fact**；域名、商标和品牌资产尚未确定。
- 信息架构采用稳定内容对象、目的入口与横向语义分层：`Stories / Guides / Places / People` 为主导航，`Understand / Visit / Live / Study / Work / Business` 为目的入口，`Topics / Geography / Situation` 为横向发现。
- 产品进一步明确为由真实中国作者共同构成、经编辑组织和把关的人物驱动信息 Hub；People 同时是独立对象和其他内容背后的常驻人格层。
- Stitch 公共站、People 机制、作者与编辑工作流及 Newsletter 状态已经形成 P1 结构基线。People 使用每周稳定的一主两辅 Spotlight，配合规则匹配、至多一人临时置顶、搜索、筛选和分页；后台区分作者提交与修订、编辑审核与分类、独立公开确认和移动端轻量审核。产品负责人已接受功能边界；Stitch 旧缓存中的模板文案、fixture、页脚和错误字体没有进入接受资产，P1 实现已按 `DESIGN.md` 通过视觉与 copy gate。
- P0 Stitch 设计原型、P1 可运行公共产品切片与 `P1-EDITORIAL-001` 编辑 CMS 基础均已完成并归档。
- `apps/web` 是 Next.js 16 公共应用与 Payload 3.86.0 编辑 CMS 的同一部署单元。公共站仍保留 typed fixture 读路径；本地可切换到 CMS 公开读路径。Payload Admin 与 API 位于 `/admin` 和 `/api`，本地 PostgreSQL 16 只绑定回环地址。
- CMS 已实现 People、Article、分类、来源说明、编辑评论、版本与工作流审计；Author、Editor、Super Admin 权限和 `draft / submitted / in_review / changes_requested / approved / public / archived` 转换均由服务端约束。英语和西班牙语使用独立文档、URL 与公开状态。
- 虚构验收流程、权限负例、匿名字段隔离、公开撤回/恢复、桌面与移动端后台和公共 Guide 已通过实现者验证与代理独立复审。复审补齐公开前八项摘要、44px 移动操作按钮和公共 Guide 窄屏无溢出；证据见 [`P1-EDITORIAL-001`](reference/implementation/p1-editorial-cms-foundation-2026-07-27.md)。
- 公共产品切片的 lint、typecheck、build、实现者浏览器验收和产品负责人复审均已通过；实现基线提交为 `6e075ea`。
- Governance V1 已建立并提交为仓库基线（`d1bd435`）。
- 生成的 CMS migration 尚未执行；生产数据库、真实账户、真实数据、preview 与 production 环境均未创建。
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

Active 工作及其授权边界以 [`roadmap/README.md`](roadmap/README.md) 为准。当前没有 active checklist；已完成的 [`P1-EDITORIAL-001`](archive/p1-editorial-cms-foundation.md) 只用于追溯，不继续授权执行。Migration 执行、账号开通、真实数据、部署和内容公开继续保持未授权。

## 当前运行边界

- 本地应用位于 `apps/web`；先运行 `npm run cms:db:up`，再用 `npm run dev` 启动。公共站与 CMS 已在 `http://127.0.0.1:3000` 完成浏览器验证。
- 没有 preview 或 production 环境。
- 没有生产数据库和真实作者数据。
- 当前 CMS 账户、内容、人物、来源说明和图像均为本地虚构验收数据，不是可公开的真实内容。

当上述事实发生变化时更新本页；计划和愿望不得写成当前能力。
