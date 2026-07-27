---
doc_contract: DocContractV1
doc_type: router
authority: routing
status: active
scope: decisions-index
last_verified: 2026-07-27
max_lines: 100
---

# Decisions Router

本目录保存已经接受、以后仍要遵守的重要决定。一项决定一个文件；本页只保存短索引。

| ID | 状态 | 决定 |
|---|---|---|
| `ADR-0001` | accepted | [`Governance V1 与文档路由`](0001-governance-v1.md) |
| `ADR-0002` | accepted | [`正式品牌名 China, in Fact`](0002-brand-name.md) |
| `ADR-0003` | accepted | [`内容对象与目的入口分层`](0003-layered-information-architecture.md) |
| `ADR-0004` | accepted | [`拓宽目的入口与横向分类`](0004-broaden-purpose-and-context-classification.md) |
| `ADR-0005` | accepted | [`公共 Web 基础栈`](0005-public-web-foundation.md) |
| `ADR-0006` | accepted | [`编辑 CMS 基础`](0006-editorial-cms-foundation.md) |
| `ADR-0007` | accepted | [`P2 Preview 托管基础`](0007-preview-hosting-foundation.md) |

## 登记规则

- 只有已经确认的选择才能标为 `accepted`。
- 建议、调研和备选方案进入 reference，不进入本目录。
- 被替代的决定改为 `superseded`，并链接新决定。
- 当前能力仍写入 `current-state.md`；决定文件不充当状态报告。
