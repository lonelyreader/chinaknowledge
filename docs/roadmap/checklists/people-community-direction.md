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
allowed_paths: docs/product-brief.md, docs/product-feature-registry.md, DESIGN.md, docs/decisions/0012-people-community-first-direction.md, docs/decisions/README.md, docs/roadmap/**, docs/reference/people-community-direction-evidence-2026-08-26.md, docs/current-state.md, docs/archive/README.md
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

- [x] 产品首要承诺能用一句话表达为：让世界遇见一群真实、有趣、有灵魂的中国人，并从他们正在做的事继续连接。
- [x] People 不再要求先有文章；项目、作品、经历、问题和持续表达都可以成为人物证据。
- [x] 网站、Discord、Reddit 的职责、往返路径、同意边界和禁止项写清。
- [x] HOME 与 PROJECTS 的旧 mini-spec 已纠偏，不再允许按旧合同直接实现项目目录。
- [x] 下一实现切片只选择一个可验证的 People 发现闭环，不顺手建设整套社交网络。

## Checklist review and disposition

2026-08-26 以 `main` 和各 worktree 只读复核，不把旧分支完成度当成当前适用性：

| 工作项 | 当前事实 | 处理 |
|---|---|---|
| `INFRA-PERSON-PAGE-001` | 分支已完整包含于 `main`，Local/Preview/Production 主流程已通过，只剩专项 UI 收尾 | 不扩 scope；完成专项验收后归档，作为 Person 基础 |
| `INFRA-RETHEME-001` | 旧分支相对 `main` 为 39/1 分叉，merge-tree 已出现冲突 | 保存 token 候选；核心页面 Figma proof 后在当前主线重做或 rebase |
| `INFRA-ARTICLE-TEMPLATE-001` | 旧分支相对 `main` 为 39/2 分叉，且与当前文章渲染冲突 | 保留目录、署名、文末路由行为与测试；页面合同确认后移植，不整枝合并 |
| `INFRA-OG-001` | 旧分支相对 `main` 为 39/1 分叉并冲突 | 保留底纹、字体与 composition 代码；Person/Home 构图确定后校准 |
| `INFRA-FEEDS-001` | 旧分支相对 `main` 为 39/1 分叉并冲突 | 保留 feed/JSON-LD 逻辑；Person/Project 公开模型稳定后最后注入页面 |
| `INFRA-HOME-001` | 未启动，旧 mini-spec 已冻结 | Figma 核心体验和 Person current-work slice 通过后再启动 |
| `INFRA-PROJECTS-001` | 未启动，旧独立目录假设已冻结 | 改为首个实现切片：Project + Person `Now` + People 到外链的最小闭环 |

## Concrete sequence

1. **Core Figma AI proof**：由 Figma AI 执行 UI 重构，只做 5 个 frame——Home desktop/mobile、People desktop、Person desktop/mobile；另放 4 个最小组件样张：person lead、current pursuit、community pulse、question-to-person。Codex 只提供产品合同、真实数据形状、设计约束与验收反馈，不在代码中先行重构，也不手工替代 Figma AI 设计；不建全量组件库。
2. **`INFRA-PROJECTS-001` 首个实现切片**：新增成员自管的公开 Project，支持 owner/collaborators、标题、简述、阶段、图片、外链、当前近况、希望获得的连接、更新时间与撤回；People opening 显示具体行动，Person 增加 `Now`。不建 `/projects`，不导入 Discord。
3. **视觉与文章基础收敛**：先按 RETHEME → ARTICLE 在新主线移植有效工作，每项重新跑 changed-path 验证；不直接合并 2026-08-12 分支。
4. **`INFRA-HOME-001` 与分发底盘**：首页改为 person-and-pursuit lead → 4–6 人物 passage → 来自他们的近期作品 → 实用 Guides → community continuation → Newsletter；People 提到主导航首位。页面确认后再收敛 OG → FEEDS。
5. **社群联动**：网站只读本人公开 Project；Discord 只接收相关深链与本人更新；Reddit 继续人工回答真实问题。自动同步、批量内容公开和 Production 分别另行批准。

首个实现切片的代表性闭环：`People 上的具体行动 → Person 的 Now → 本人 Project 外链或 Discord 联系`。Home 重排在它之后，避免先用假数据把新版首页做成静态概念稿。

## Validation

- [x] Product / Design / Decision / Roadmap 四层已核对，无当前合同冲突。
- [x] 已扫描可见文案方向，未引入解释型 UI 文案、内部术语或操作指导。
- [x] 隔离任务 diff 的 `npm run governance:check` 与 `git diff --check` 均 PASS；主工作树的 intake 全量检查仅被用户已有 `outputs/**` 改动阻断。

## Writeback

- 规则写 ADR-0012，产品定义写 `product-brief.md`，界面合同写 `DESIGN.md`，执行顺序写本 checklist 与 Site Infrastructure Parent，当前已接受方向写 `current-state.md`。
- 本项完成后归档；任何代码实现建立新的 upgraded checklist。

## Current gate

- [x] 产品负责人明确要求恢复历史但不固化早期假设，并接受人物驱动、社群驱动、“meet a bunch of interesting people”作为前进方向（2026-08-26）。
- [x] 当前证据已读回：34 个 Discord 项目帖 / 23 位发布者；Production 匿名可读 People 为 11 人。
- [x] 本 intake checklist 已以 `a5150f0` 进入 Git 基线；canonical Product / Design / Decision 在后续 diff 修改。
- [x] 产品负责人已批准提交本轮方案并新建 Figma 核心文件（2026-08-26）；Figma AI 负责 UI 重构，Codex 不先行改前端。代码实现、外部平台写入和 Production 保持分别批准。
