---
doc_contract: DocContractV1
doc_type: checklist
authority: execution
status: active
scope: people-community-direction-reset
last_verified: 2026-08-26
max_lines: 140
change_id: PEOPLE-COMMUNITY-DIRECTION-001
risk_tier: base
validation_profile: slice
allowed_paths: docs/product-brief.md, DESIGN.md, docs/decisions/0012-people-community-first-direction.md, docs/decisions/README.md, docs/roadmap/**, docs/reference/people-community-direction-evidence-2026-08-26.md, docs/current-state.md
approval_gates: intake-commit, implementation, schema, migration, discord-write, reddit-write, production-deploy, real-data, public-content, merge, push
---

# PEOPLE-COMMUNITY-DIRECTION-001 人物与社群优先方向纠偏

目标：根据 Production People 与 Discord 成员项目的当前供给，把 China, in Fact 从“内容把读者带到作者”的单向模型推进为“先遇见有趣的人，再从其项目、作品、经历和内容继续”的人物与社群网络；明确网站、Discord 与 Reddit 的初步联动职责，并重写 Batch 3 的实现前提。

证据：[`People 与社群方向现状`](../../reference/people-community-direction-evidence-2026-08-26.md)。

## Scope

- 修订 `product-brief.md`：一句话定义、核心价值、People 定义、信息架构权重和增长闭环以人物发现为先。
- 修订 `DESIGN.md`：People 首页、Person 页、首页人物段落和项目呈现从“正式名片”推进为“有生命的人物发现与连接”。
- 新建 ADR-0012，记录“人物与社群优先”以及网站 / Discord / Reddit 的职责边界。
- 重写 `INFRA-HOME-001` 与 `INFRA-PROJECTS-001` mini-spec；项目成为认识人的证据，不预设独立项目黄页或顶级导航。
- 定义下一实现切片的最小验收，但本项不实现页面、schema、同步或外部平台配置。

## No-go

- 不改前端、CMS、schema、migration、权限、Agent 工具或 Production。
- 不读取或公开私密 Discord 内容；不按 Discord 显示名自动关联 Person。
- 不向 Discord、Reddit 或网站写真实内容，不批量导入项目，不建立自动回复或自动分发。
- 不做关注、排名、评分、热度、站内私信、交易市场或黑箱个性化推荐。
- 不把“宋式编辑部”视觉语言、编辑可信度或内容事实标准当成本次需要推翻的对象。

## Acceptance

- [ ] 产品首要承诺能用一句话表达为：让世界遇见一群真实、有趣、有灵魂的中国人，并从他们正在做的事继续连接。
- [ ] People 不再要求先有文章；项目、作品、经历、问题和持续表达都可以成为人物证据。
- [ ] 网站、Discord、Reddit 的职责、往返路径、同意边界和禁止项写清。
- [ ] HOME 与 PROJECTS 的旧 mini-spec 已纠偏，不再允许按旧合同直接实现项目目录。
- [ ] 下一实现切片只选择一个可验证的 People 发现闭环，不顺手建设整套社交网络。

## Validation

- [ ] 核对 Product / Design / Decision / Roadmap 四层无冲突。
- [ ] 扫描可见文案方向，不引入解释型 UI 文案、内部术语或操作指导。
- [ ] `npm run governance:check`、`git diff --check`。

## Writeback

- 规则写 ADR-0012，产品定义写 `product-brief.md`，界面合同写 `DESIGN.md`，执行顺序写本 checklist 与 Site Infrastructure Parent，当前已接受方向写 `current-state.md`。
- 本项完成后归档；任何代码实现建立新的 upgraded checklist。

## Current gate

- [x] 产品负责人明确要求恢复历史但不固化早期假设，并接受人物驱动、社群驱动、“meet a bunch of interesting people”作为前进方向（2026-08-26）。
- [x] 当前证据已读回：34 个 Discord 项目帖 / 23 位发布者；Production 匿名可读 People 为 11 人。
- [ ] 本 intake checklist 先进入 Git 基线；之后才修改 canonical Product / Design / Decision，避免同一 diff 临时补票。
- [ ] 本项只授权文档方向纠偏；实现、外部平台写入和 Production 保持分别批准。
