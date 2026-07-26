---
doc_contract: DocContractV1
doc_type: decision
authority: canonical
status: accepted
scope: decision-layered-information-architecture
last_verified: 2026-07-26
max_lines: 120
---

# ADR-0003：内容对象与任务集合分层

## Context

旧产品基线将 `Travel / Live / Study / Work / Business / Understand` 同时用作主导航、文章主归属和 URL 骨架。零基调研检查了 27 个跨地区产品，并用 64 个中国任务进行压力测试。结果显示，内容对象、用户任务、地点、人物和更新状态属于不同维度；压成单层栏目会造成大量重复归类。

研究证据见 [`../reference/design/information-architecture-zero-base-research-2026-07-26.md`](../reference/design/information-architecture-zero-base-research-2026-07-26.md)。

## Decision

- 公共站稳定内容入口采用 `Stories / Guides / Places / People`。
- `Visit / Move / Study / Work / Build` 作为任务集合，为明确目标提供入口，但不决定文章唯一归属或 URL。
- 主题、地区、受众阶段、语言和更新状态作为横向维度。
- Stories 承载个人故事、报道、分析和时效更新；Guides 承载实用指南。
- 同一内容可以进入多个任务集合，不复制正文。
- 首页由编辑策展内容、地点和人物，不平均展示全部入口。
- `Build` 的公开命名仍可在原型文案评审中检验；任何改名不得改变本决定的分层关系。

## Consequences

- 内容对象和 URL 可以保持稳定，任务入口可随读者需求调整。
- People 与 Places 成为一等对象，符合人物网络和地区发现需求。
- 编辑后台需要分别管理内容形式、任务集合、主题、地点和更新状态。
- 原型不得继续使用旧六栏目作为同权主导航。

## Supersedes

替代 `Travel / Live / Study / Work / Business / Understand` 作为单层一级栏目、文章主归属和 URL 骨架的方案。
