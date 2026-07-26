---
doc_contract: DocContractV1
doc_type: checklist
authority: execution
status: active
scope: p0-stitch-design-prototype
last_verified: 2026-07-26
max_lines: 260
change_id: P0-STITCH-001
risk_tier: base
validation_profile: work_item
allowed_paths: README.md, DESIGN.md, docs/product-brief.md, docs/current-state.md, docs/architecture/development-governance.md, docs/decisions/**, docs/roadmap/README.md, docs/roadmap/checklists/README.md, docs/roadmap/checklists/p0-stitch-design-prototype.md, docs/reference/README.md, docs/reference/design/**
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
- [ ] 评审信息架构候选并批准产品结构。
- [x] Stitch 视觉、交互、响应式和文案规则。
- [x] 正式品牌名确定为 `China, in Fact`。
- [ ] 生成第一轮公共站页面。
- [ ] 评审信息架构、视觉层级和人物感。
- [ ] 生成作者与编辑后台关键状态。
- [ ] 评审角色边界、审核路径和移动端。
- [ ] 收敛被接受的设计资产与证据。
- [ ] 写回 current-state，关闭并归档本清单。

## Acceptance

- 第一眼呈现可信的国际编辑媒体和真实人物网络。
- 被批准的稳定内容对象、任务入口、主题、地点和作者之间的浏览关系清楚。
- 作者无法误触让内容公开，编辑能完成审核与分类。
- 桌面与移动端没有结构性断裂或横向溢出。
- 可见文案通过人工 copy gate。
- 被接受的页面有可追溯设计文件或截图，并由 reference router 挂载。
- P1 能从被接受的设计和本文恢复实现范围，不依赖聊天记录。

在信息架构决定写回 `docs/product-brief.md` 前，不生成以旧六栏目为前提的新原型。

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
