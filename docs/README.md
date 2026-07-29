---
doc_contract: DocContractV1
doc_type: router
authority: routing
status: active
scope: docs-root
last_verified: 2026-07-26
max_lines: 100
---

# Docs Router

本页只负责文档导航。新线程从 [`START-HERE.md`](START-HERE.md) 按任务恢复，不默认通读全部链接。

| 需要确认 | 唯一入口 | 不要从哪里推断 |
|---|---|---|
| 产品定位、用户、栏目、角色 | [`product-brief.md`](product-brief.md) | 旧聊天、fixture、旧投稿流程 |
| App 按用户类型已经具备哪些功能 | [`product-feature-registry.md`](product-feature-registry.md) | 产品愿景、旧验收清单、单个页面截图 |
| 成员发布、站方策展、署名与人物导流 | [`operational-publishing-requirements.md`](operational-publishing-requirements.md) | 后台默认按钮、旧 workflow 状态、临时运维步骤 |
| 当前真实状态 | [`current-state.md`](current-state.md) | roadmap 目标、历史归档 |
| 开发授权、风险、验收、文档规则 | [`architecture/README.md`](architecture/README.md) | PR 描述、临时清单 |
| 当前工作与后置项 | [`roadmap/README.md`](roadmap/README.md) | reference、聊天计划 |
| 已接受的长期决定 | [`decisions/README.md`](decisions/README.md) | 未确认建议 |
| 调研、截图、验证等证据 | [`reference/README.md`](reference/README.md) | 把证据当当前计划 |
| 已完成或被替代的历史 | [`archive/README.md`](archive/README.md) | 把归档重新当授权 |

设计与可见文案的根级真相是 [`../DESIGN.md`](../DESIGN.md)。

## 路由规则

- Router 只保留入口、读取条件和边界。
- 任何详细文档必须由一个上级 router 挂载。
- 同一 scope 只允许一个 canonical 文档。
- 文档超出 frontmatter 的 `max_lines` 时必须拆分，原文档保留为 router 或收窄职责。
- 稳定事实、决定、当前任务、证据和历史必须进入各自区域。
