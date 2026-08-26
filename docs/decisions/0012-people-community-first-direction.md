---
doc_contract: DocContractV1
doc_type: decision
authority: canonical
status: accepted
scope: decision-people-community-first-direction
last_verified: 2026-08-26
max_lines: 140
change_id: PEOPLE-COMMUNITY-DIRECTION-001
---

# ADR-0012：人物与社群优先方向

## Context

China, in Fact 最初以中国信息与人物网络起步，随后把 Person 从作者归档推进为正式名片。当前 Production 公开 People 已有 11 人，Discord 成员项目 Forum 已形成 34 个项目帖、23 位发布者的真实供给。现有首页仍由 lead、selected 与 latest 文章主导，People 位于页面后段；People 索引仍以每周 Spotlight 和筛选目录为主；Person 页虽已具备身份、介绍、作品和联系字段，但很少回答“这个人现在在做什么”。早期设计解决了编辑可信度和作者归属，没有充分兑现“meet a bunch of interesting people”。

## Decision

- 产品首要承诺是让世界遇见一群真实、有趣、有灵魂的中国人，并从他们正在做的事继续连接。
- Person 成为公开产品的中心对象。Article 仍是重要证据，但项目、作品、经历、问题和持续表达都可以让一个人进入 People；不再要求先成为作者。
- 首页先让访问者遇见具体人物及其当前行动；Stories、Guides、Places 与主题入口继续存在，但承担背景、证据与发现路径，不再决定首页的第一叙事顺序。
- 项目先附着于 Person，不默认建立顶级 Projects 导航或独立项目黄页。跨人物项目入口只有在真实使用证明它改善人物发现后才建立。
- 网站承担面向世界的长期人物发现与公开页；Discord 承担持续交流、项目更新和协作；Reddit 从真实问题进入外部对话。三者互相路由，但不复制成同一条信息流。
- Discord 内容进入网站前必须由本人选择公开范围并可撤回；Discord 与 Person 使用稳定显式关联，不按显示名自动合并。Reddit 保持人工参与，先回答问题，再提供确实相关的人、项目或内容。
- 不引入关注数、热度榜、评分、自动推荐黑箱、站内私信或交易撮合。人物发现依赖编辑选择、清晰关系和可验证的公开证据。

## Interface consequences

- 首页从“主文章 + 内容流 + 页面末端 People”改为“人物及当前行动 + 更多值得认识的人 + 来自他们的内容与社群近况”。
- People 索引先呈现人物行动与判断，再提供搜索和筛选；既有稳定轮换机制可以保留为后台选择手段，不再规定可见页面必须叫 weekly spotlight。
- Person 页在身份之后优先呈现当前项目、当前问题、阶段和希望获得的连接；内容归档、编辑传记、引语与外链继续保留，但不再占据人物理解的唯一主轴。
- Project 需要稳定 owner/collaborator、公开状态、阶段、更新时间、外链、近况与撤回边界；首个实现切片不做自动 Discord 导入。

## Relationship to ADR-0011

本决定替代 ADR-0011 中“首页以文章为主叙事”“People 固定以 weekly Spotlight 为可见结构”“Person 以正式名片为终点”的部分。宋式色板、字体、摄影、留白、印章尺度、反仿古边界、编辑可信度与三个 Discord 证据位继续有效。视觉方向保留，页面重心和对象关系向前推进。

## Consequences

- 旧 `INFRA-HOME-001` 与 `INFRA-PROJECTS-001` mini-spec 不得直接实现；先把真实供给与设计合同交给 Figma AI 完成核心页面重构证明，设计验收后再分别冻结页面与数据合同。Codex 不在此阶段先行重构前端。
- 既有 RETHEME、ARTICLE、OG 与 FEEDS 分支保存为候选实现，不按 2026-08-12 基线直接合并；它们需在新页面合同后 rebase 或按当前主线重做。
- 方向是否成立以真实人物发现闭环验证：访问者从 Home 或 People 进入 Person，并继续到本人公开的项目、外链或 Discord。项目数量、页面浏览量和社群人数不能单独证明成功。
