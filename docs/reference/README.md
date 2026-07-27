---
doc_contract: DocContractV1
doc_type: router
authority: routing
status: active
scope: reference-index
last_verified: 2026-07-27
max_lines: 80
---

# Reference Router

本目录保存调研、截图、设计版本、测试报告和独立复审证据。

| 主题 | 状态 | 入口 |
|---|---|---|
| 技术栈建议 | Web 基础栈已由 ADR-0005 决定，其余候选 deferred | [`technical-stack-proposal.md`](technical-stack-proposal.md) |
| 设计与信息架构证据 | 按子目录标注 | [`design/README.md`](design/README.md) |
| P1/P2 实现与浏览器证据 | P1 已接受；P2 实现者验收与独立复审均通过 | [`implementation/README.md`](implementation/README.md) |

规则：

- Reference 只能支持判断，不能决定当前路线或授权实现。
- 每组证据必须由本页或子目录 router 挂载。
- 原始大文件放在清晰命名的子目录，使用短 README 说明来源、日期、对象和结论。
- 被接受的设计资产进入 `design/`；未接受草稿不登记为设计真相。
