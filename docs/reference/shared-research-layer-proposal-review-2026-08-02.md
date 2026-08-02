---
doc_contract: DocContractV1
doc_type: reference
authority: evidence
status: active
scope: shared-research-layer-proposal-review
last_verified: 2026-08-02
max_lines: 220
---

# 共享研究素材层提案审查

## 审查合同

- 日期：2026-08-02
- 审查人：Codex，China, in Fact 独立只读审查
- 对象：`/Volumes/External/service/china-in-fact-materials/PROPOSAL-shared-research-layer.md`
- 范围：当前产品、功能登记、Agent Gateway、Article 来源字段、执行队列和素材库事实
- 未执行：代码、schema、migration、provider 购买、Production、真实成员、内容公开或素材采集

## 结论

**建议：`revise`。**

共享研究可以帮助成员减少重复检索，也可以加强 Guide 的来源和时效核对，问题方向与 China, in Fact 的成员创作和站方策展目标相容。但当前提案不能按现有范围进入产品决定或实现：它把大规模全文采集、长期私有保存、内部研究工作、100–200 名成员访问、个人素材包、Agent 工具和 Article 草稿串成了一次产品化，现有证据只足以支持一个小型 `summary-only` 运营验证。

本结论不接受 `ResearchSource`、`Research Pack`、`research_search`、Firecrawl 采购、全文保存、成员默认访问或任何存储与检索方案。提案仍是未接受建议；修订版通过再次审查前，不建立 ADR，不建立 implementation active checklist。

## 对提案的准确复述

提案希望把公开网页采集为私有研究素材，完成清洗、去重、分类和时效标记，再允许成员从后台或 Agent 搜索来源、建立个人素材包，并关联到本人 Article 草稿。原始正文不自动公开，身份、权限、文章作者、策展、审计和恢复仍由 China, in Fact 服务端负责。

这项设想实际包含三个需要分别决定的层次：

1. 来源发现、采集、保存、更新和删除的研究运营。
2. Editor 或内部研究人员使用的核对工作台。
3. Member/Agent 使用的共享搜索、素材包和 Article 衔接。

三个层次的使用人、数据暴露、权利风险、成功指标和实现成本不同，不能由一个方向性提案一次批准。

## 当前仓库事实

| 已具备 | 当前证据 |
|---|---|
| Member 的 `My work`、Article 写作、预览和个人公开 | `docs/product-feature-registry.md:43-66` |
| Editor 在 Article 上维护来源、核对说明和 Freshness | `docs/product-feature-registry.md:68-83`；`apps/web/src/collections/Articles.ts:163-211` |
| Production Agent Gateway 已启用，提供受角色约束的文章、策展和最小审计工具 | `docs/current-state.md:30-48`；`apps/web/src/agent/server.ts:57-181` |
| 001–006 已归档；当前 active checklist 仅处理仓库收敛，不授权产品实现 | `docs/current-state.md`；`docs/roadmap/README.md` |
| 旧 `inbox/` / `dataset/` 架构已经退出 | `docs/current-state.md:32-33` |
| 当前素材库是 12 份入口级卡片，默认 `summary-only`，先扩到 100–200 份具体页面 | `/Volumes/External/service/china-in-fact-materials/README.md:1-10,48-52`；`INDEX.md:3-24` |

当前代码没有 `ResearchSource`、共享素材 collection、研究检索、个人素材包、采集批次、rights/retention 工作流或相应 Agent 工具。现有 Article `sourceNotes` 是编辑内容的来源记录，不能兼任大规模私有研究库。

## 必须修订的问题

### 1. 执行基线已经过时

提案仍写着 Production 没有 Agent 产品入口、`AGENT-WORKSPACE-002` 是 active 工作。当前事实是 001–006 已归档、Production Gateway 已启用；当前 `REPO-CONSOLIDATION-001` 只处理用户文件与 Git 收敛，不授权产品实现。修订版必须以当前状态重新确定独立工作线，不能挂接旧 checklist。

### 2. 规模结论没有得到素材证据支持

12 份入口级来源可以证明选题面广，不能证明应立即发现 20,000 页面、长期保留 3,000–8,000 份正文，也不能证明 100–200 名成员需要相同访问能力。素材库自己的当前门槛仍是先形成 100–200 份页面卡片，到约 500 份后再评估自动发现、去重和全文检索。

### 3. 全文保存和成员访问缺少可执行的权利合同

提案列出了 robots、条款、rights/retention、投诉和删除，但没有回答谁按域名批准、保存什么、保存多久、谁可看原文、如何证明删除已覆盖文件与索引。第三方全文向大量成员开放也不能只按“私有”处理。默认规则应继续是摘要、必要短摘、原链接和抓取日期；全文保存必须按来源另行批准，并先经过适用的法律与运营审查。

### 4. 产品价值与运营责任尚未验证

提案没有真实任务基线、节省时间、来源命中率、过期发现率、成员使用反馈、维护人力或删除时限。没有明确运营负责人时，Freshness、投诉处理和季度补抓会变成无人承担的持续义务。先验证两项真实编辑任务是否因共享素材明显受益，再讨论 App 入口。

### 5. Provider 与产品决定绑得过紧

Firecrawl 可以作为候选采集工具，不能成为研究层的产品前提。2026-08-02 查到的 [Firecrawl 官方价格页](https://www.firecrawl.dev/pricing)显示 Standard 为 100,000 credits、标价 `$83/month` 但按年计费，普通 credits 不结转；提案中的“一月 Standard 月付”尚未得到 checkout 级确认。采购、额度和保留价值要在运营验证后单独批准。

### 6. 权限设计起点过宽

现有 Gateway 的优势是业务意图窄、服务端逐次授权。首版同时开放 Member 搜索、原始正文、素材包、导出和草稿衔接，会一次增加跨成员私有数据、导出泄露、来源权利、删除传播和审计面。即使后续产品化，也应先做 Editor-only、只读、摘要级检索，再根据证据决定 Member 和 Agent 能力。

## 应保留的原则

- 研究素材与公开 Article 分离，来源不能自动成为成员原创内容。
- 官方事实、第三方经验、个人观点、矛盾、过期和待核实项必须可区分。
- 服务端继续负责身份、角色、对象权限、审计、撤销和失败关闭。
- 不开放 SQL、Payload 通用 CRUD、文件系统或 provider 密钥。
- 高风险事实回到当前官方来源核对。
- 旧 `inbox/` / `dataset/` 不因本提案恢复。

## 最小首切片

首切片应是**人工、摘要级的运营验证**，不进入 App：

1. 从现有素材库选择两个具体编辑 brief，每个 brief 覆盖官方、机构/专业站和个人经验来源。
2. 补齐总计 30 份页面级素材卡；只保存摘要、必要短摘、URL、访问日期、来源类型、适用地域、Freshness、rights 状态和核对说明。
3. 由一名 Editor 和一名受邀试用者分别用这些卡片形成可追溯的研究包与文章提纲，记录从零搜索与使用素材库的耗时、遗漏、过期项和无效来源。
4. 对一份素材执行“标记过期—停止返回—删除记录”的人工演练，确认索引与派生产物可追踪。
5. 形成一页 go/no-go 结论：是否值得进入 Editor-only 产品读取切片，以及应保存摘要、短摘还是经批准的全文。

首切片禁止 Firecrawl 付费、大规模 crawl、全文长期保存、App/schema/migration、Member 全量开放、Agent 工具、Article 自动创建、Astria eligibility、Preview/Production 和真实内容公开。

## 后续 checklist 建议

修订提案被接受后，建立唯一 active checklist：

```yaml
change_id: SHARED-RESEARCH-DISCOVERY-001
status: active
risk_tier: base
validation_profile: slice
scope: 用两个真实编辑 brief 验证 summary-only 共享素材是否有持续运营价值
allowed_paths:
  - /Volumes/External/service/china-in-fact-materials/**
  - docs/reference/**
  - docs/roadmap/**
no_go: App 代码、schema、migration、全文库、付费采集、成员或 Agent 产品入口、Production
acceptance: 30 份可追溯页面卡、两份研究包、一次过期与删除演练、一份有数据的 go/no-go 结论
validation: 索引链接、必填元数据、来源核对、删除追踪、人工任务回放、governance:check、diff check
writeback: 本审查记录、roadmap、素材库 README/INDEX；若接受产品化，再单独建立 ADR
approval_gates: provider 购买、全文保存、真实成员访问、schema、migration、Preview、Production
```

本次不创建该研究 active checklist；当前仓库收敛 checklist 与本提案无关，也不构成研究工作授权。它的进入条件是：提案按上述问题完成修订，并由产品负责人明确接受这项运营验证。验证通过后，如需产品化，再建立 upgraded `SHARED-RESEARCH-READ-001`，范围只应是 Editor-only、只读、摘要级的 Local/Preview 工作流；Member、Agent、全文和 Article 衔接继续后置。

## 未验证项

- 未进行法律意见或逐站条款审查。
- 未登录 Firecrawl checkout，未确认单月方案、税费、取消和数据处理条款。
- 未访问 Production 或真实成员账户；当前运行事实来自仓库的最新 current、功能登记和实现代码。
- 未验证真实成员是否愿意使用研究包，首切片正是为补这项证据。
