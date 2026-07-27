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

项目已完成 **P1：可运行公共产品切片**，进入 **P1：编辑 CMS 基础** 的技术与权限合同验证。

- 产品需求基线已经建立。
- Stitch 设计系统已经建立。
- 正式品牌名已经确定为 **China, in Fact**；域名、商标和品牌资产尚未确定。
- 信息架构采用稳定内容对象、目的入口与横向语义分层：`Stories / Guides / Places / People` 为主导航，`Understand / Visit / Live / Study / Work / Business` 为目的入口，`Topics / Geography / Situation` 为横向发现。
- 产品进一步明确为由真实中国作者共同构成、经编辑组织和把关的人物驱动信息 Hub；People 同时是独立对象和其他内容背后的常驻人格层。
- Stitch 公共站、People 机制、作者与编辑工作流及 Newsletter 状态已经形成 P1 结构基线。People 使用每周稳定的一主两辅 Spotlight，配合规则匹配、至多一人临时置顶、搜索、筛选和分页；后台区分作者提交与修订、编辑审核与分类、独立公开确认和移动端轻量审核。产品负责人已接受功能边界；Stitch 旧缓存中的模板文案、fixture、页脚和错误字体没有进入接受资产，P1 实现已按 `DESIGN.md` 通过视觉与 copy gate。
- P0 Stitch 设计原型与 P1 可运行公共产品切片均已完成并归档；`P1-EDITORIAL-001` 是唯一 active checklist。
- `apps/web` 已建立为 Next.js 16 公共应用，使用 typed fixtures 实现 `en / es` 首页、Guide、People、作者页和 Newsletter 成功/错误状态。lint、typecheck、build、实现者浏览器验收和产品负责人复审均已通过；实现基线提交为 `6e075ea`。
- Governance V1 已建立并提交为仓库基线（`d1bd435`）。
- CMS、数据库和部署项目尚未创建。
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

Active 工作及其授权边界以 [`roadmap/README.md`](roadmap/README.md) 为准。当前唯一 active 工作是
[`P1-EDITORIAL-001`](roadmap/checklists/p1-editorial-cms-foundation.md)：先验证 CMS 架构、业务状态、双语公开和角色权限合同。依赖安装、CMS 代码、本地数据库、schema、migration、真实数据和部署尚未获得授权。

## 当前运行边界

- 本地公共应用位于 `apps/web`，可用 `npm run dev` 启动；本轮已在 `http://127.0.0.1:3000` 完成浏览器验证。
- 没有 preview 或 production 环境。
- 没有生产数据库和真实作者数据。
- 当前内容、人物、外部链接和图像均为本地 fixtures，不是可公开的真实内容。

当上述事实发生变化时更新本页；计划和愿望不得写成当前能力。
