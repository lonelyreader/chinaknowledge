---
doc_contract: DocContractV1
doc_type: checklist
authority: execution
status: active
scope: p0-stitch-design-prototype
last_verified: 2026-07-27
max_lines: 260
change_id: P0-STITCH-001
risk_tier: base
validation_profile: work_item
allowed_paths: README.md, DESIGN.md, docs/product-brief.md, docs/current-state.md, docs/architecture/development-governance.md, docs/decisions/**, docs/roadmap/README.md, docs/roadmap/checklists/README.md, docs/roadmap/checklists/p0-stitch-design-prototype.md, docs/roadmap/checklists/p1-public-runnable-slice.md, docs/archive/README.md, docs/reference/README.md, docs/reference/design/**
approval_gates: product-code, paid-service, account-activation, production-deploy
---

# P0 Stitch Design Prototype

目标：先完成信息架构零基研究与产品决定，再用被确认的产品和设计合同完成可评审的公共站、作者与编辑后台原型，为 P1 实现提供唯一设计输入。

## Scope

- 首页，桌面和移动端。
- 信息架构决定后选定的代表性栏目或集合页。
- 长篇 Guide 文章页。
- People 列表与作者主页。
- Newsletter 成功与错误状态。
- 作者文章列表、编辑与提交状态。
- 编辑审核队列、详情、分类和公开动作。
- 正式品牌名及公共字标写法。
- 使用同一个上海作者与驾照指南 fixture 贯穿全部页面。

允许写回：

- `DESIGN.md`
- `docs/product-brief.md`
- `docs/current-state.md`
- `docs/roadmap/`
- `docs/reference/design/`

## No-go

- 不创建产品 App。
- 不安装产品依赖。
- 不接 CMS、数据库、邮件、部署平台或真实账号。
- 不把驾照 fixture 变成专用产品、schema 或页面类型。
- 不把未接受的 Stitch 草稿登记为设计真相。

## Work

- [x] 产品定位、用户、角色和阶段基线。
- [x] 从零调研跨地区国家信息产品，不沿用既有栏目作为输入。
- [x] 评审信息架构候选并批准产品结构。
- [x] 用扩展受众复核目的入口、Geography、Situation、Language 与 Freshness 的归属。
- [x] Stitch 视觉、交互、响应式和文案规则。
- [x] 正式品牌名确定为 `China, in Fact`。
- [x] 生成第一轮公共站页面。
- [x] 明确“编辑可信度 + 真实人物可信度 + 持续连接”的产品中心机制。
- [x] 生成一组六页人物驱动修订稿，与原稿并列供评审。
- [x] 明确首页混合编排机制与 100–200 人分层发现规则。
- [x] 生成能证明首页运营和 People 规模机制的桌面与移动端页面。
- [x] 将 People 顶部三人收敛为每周稳定的一主两辅 Spotlight，并定义规则匹配与人工干预边界。
- [x] 生成 Spotlight 桌面与移动端修订稿，实际呈现 24 / 12 人分页样例。
- [x] 评审信息架构、视觉层级和人物感。
- [x] 生成作者与编辑后台关键状态。
- [x] 评审角色边界、审核路径和移动端。
- [x] 补齐 Newsletter 成功与错误状态，并清理最终状态的模板文案。
- [x] 收敛被接受的设计资产与证据。
- [ ] 写回 current-state，关闭并归档本清单。

## Acceptance

- 第一眼呈现可信的国际编辑媒体和真实人物网络。
- People 不只存在于人物目录；首页、内容页、地点和主题发现均能感知内容背后的具体人物。
- 人物页足够丰富，能够承载持续作品、个人视角、地点、主题和外部渠道，同时不呈现为简历、排行榜、黄页或交易页。
- 平台的专业性由编辑层级、核验与来源表达建立；人物温度不依赖解释性宣传文案。
- 首页在没有每日人工排序时仍有确定内容；人工置顶、排期、到期回退、自动内容流和人物轮换边界清楚。
- People 能承载 100–200 人，通过每周稳定的一主两辅 Spotlight、搜索、内容型筛选、分页和上下文自动匹配完成浏览；Spotlight 支持至多一人临时置顶，不形成固定三人、头像墙或人气榜。
- 被批准的稳定内容对象、目的入口、Topics、Geography、Situation、地点和人物之间的浏览关系清楚。
- 作者无法误触让内容公开，编辑能完成审核与分类。
- 桌面与移动端没有结构性断裂或横向溢出。
- 可见文案通过人工 copy gate。
- 被接受的页面有可追溯设计文件或截图，并由 reference router 挂载。
- P1 能从被接受的设计和本文恢复实现范围，不依赖聊天记录。

后续原型使用已接受的分层结构，不把目的入口做成与四个内容对象同权的栏目，也不把 Language 或 Freshness 当成主题分类。

公共站接受证据见 [`stitch-public-prototype-round-1-2026-07-27.md`](../../reference/design/stitch-public-prototype-round-1-2026-07-27.md)。画布保留原稿、人物驱动修订稿和机制证明页用于追溯；P1 只继承已接受的结构、机制和 Final 状态，不继承旧页面中的模板 fixture、项目级错误 token 或残留解释性文案。

作者与编辑后台证据见 [`stitch-editorial-workflow-prototype-2026-07-27.md`](../../reference/design/stitch-editorial-workflow-prototype-2026-07-27.md)。八张 Refined 页面证明角色动作和公开确认分层；产品负责人已接受功能边界。Stitch 下载预览中的修正前缓存不进入实现，P1 组件仍须重新通过权限、移动端和 copy gate。

2026-07-27，产品负责人确认当前公共站与后台功能边界通过，剩余视觉和文案问题由实现阶段按 `DESIGN.md` 收口。P0 只剩 Git closeout 门禁：先提交当前 P0 设计与证据基线，再归档本清单并建立 `P1-WEB-001` active checklist；未获得 commit 与 product-code 单独批准前不跨越这两个门禁。

## P1 Handoff Proposal

首个代码切片拟登记为 `P1-WEB-001`：

- 建立一个本地可运行的公共 Web App，先用独立 fixture 文件实现 `en / es` 首页、Guide、People、作者页和 Newsletter 成功/错误状态。
- 技术入口采用待确认的 Next.js App Router、TypeScript 与 Tailwind CSS 建议；安装依赖前先形成技术 ADR。
- 只实现公共读路径和设计系统，不接 CMS、登录、作者权限、数据库、邮件供应商、真实数据或部署。
- 通过桌面与移动端浏览器主流程、无横向溢出、可见文案、双语言 URL 和 changed-path 检查。
- 完成本切片后，再建立 upgraded checklist 接入投稿、审核、公开和权限负例。

该拆法允许尽快开始真实代码，同时不把未经验证的 Payload、PostgreSQL、账号和生产边界一次性带入第一个 diff。

## Validation

- `npm run governance:check`
- `git diff --check`
- 人工检查全部新增可见文字。
- 人工检查桌面与移动端关键页面。
- 人工确认接受或退回每类页面。

## Writeback

- 当前事实：`docs/current-state.md`
- 设计规则：`DESIGN.md`
- 产品变化：`docs/product-brief.md`
- 接受证据：`docs/reference/design/`
- 完成历史：`docs/archive/`
- 下一阶段：完成后建立 P1 active checklist

## Approval Gates

本清单不授权产品编码、付费、账号开通、数据库、部署或生产操作。
