---
doc_contract: DocContractV1
doc_type: decision
authority: canonical
status: accepted
scope: decision-broaden-purpose-and-context-classification
last_verified: 2026-07-27
max_lines: 120
change_id: P0-STITCH-001
---

# ADR-0004：拓宽目的入口与横向分类

## Context

ADR-0003 已确定内容对象与用户任务分层。扩展调研发现，原 `Visit / Move / Study / Work / Build` 只覆盖一部分来华任务，无法充分服务希望理解中国、已经离华、长期往返、华裔与跨国家庭，以及关注中国企业和海外社区的读者。

原横向维度还把语义分类、语言出版和内容维护混在一起。扩展证据见[零基调研](../reference/design/information-architecture-zero-base-research-2026-07-26.md)与[扩展调研](../reference/design/information-architecture-expanded-research-2026-07-26.md)。

## Decision

- 主导航继续采用 `Stories / Guides / Places / People`。
- 第二层目的入口采用 `Understand / Visit / Live / Study / Work / Business`。
- 目的入口只负责策展和发现，不拥有内容、不决定唯一归属，也不锁定 URL。
- `Understand` 服务希望理解中国、但没有来华行动任务的读者；它不是内容兜底桶。
- `Live` 覆盖准备、在华生活、离境、离华后、返回与长期往返。
- `Business` 取代 `Build`，覆盖经商、创业、投资、采购、合作及企业相关判断。
- 横向语义分类只采用 `Topics / Geography / Situation`。
- `Geography` 同时覆盖中国境内地点和与中国直接相关的海外社区、企业节点与跨境区域。
- `Situation` 表示关系状态，可使用 `Exploring / Preparing / In China / Leaving / After China / Cross-border`；它不是强制线性旅程。
- `Language` 是独立出版轴；`Freshness` 是核验、维护、排序与展示状态。两者不属于主题分类。
- `Topics` 是全站可见的发现入口，但不升级成第五个内容对象或与四个主导航同权的栏目。
- Stories 对外保持一个内容对象，内部区分 `Reporting / Analysis / First-person / Update`；Guides 只承载可执行且需要持续维护的内容。
- People 只表示自然人。机构和服务通过内容、搜索或外部链接被发现。
- `Latest` 只作为首页和内容流状态，不进入稳定主导航。

## Consequences

- 产品能覆盖理解中国、来华、在华、离华后与跨境关系，不需要增加按用户身份命名的导航。
- 同一内容可进入多个目的集合，并通过 Topics、Geography 和 Situation 被再次发现。
- 英语与西班牙语可共享内容关系，同时保持独立标题、发布状态和策展顺序。
- 原型需要证明四个主对象、目的入口和 Topics 能形成清楚但不同权的发现层级。

## Amends

修订 ADR-0003 中关于 `Visit / Move / Study / Work / Build`、横向维度和 Stories 内部形态的条款；ADR-0003 的对象与任务分层原则继续有效。
