---
doc_contract: DocContractV1
doc_type: router
authority: routing
status: active
scope: execution-roadmap
last_verified: 2026-07-31
max_lines: 100
---

# Roadmap Router

本页是当前执行与后置工作的唯一队列。详细步骤进入 [`checklists/README.md`](checklists/README.md) 挂载的单项 checklist。

## Active

父级控制见 [`Agent Workspace Parent Checklist`](agent-workspace-program.md)。它记录 001–005 的关系和阶段转换，不授权实现。

当前没有 implementation active checklist。[`AGENT-WORKSPACE-002`](../archive/agent-workspace-member-publication.md) 已完成 Local + Preview Cursor 验收、精确清理和最终独立复审并归档；003 可进入独立 intake，但尚未创建或授权。真实数据和 Production 继续分别设门禁。

## Deferred

| 工作项 | 进入条件 |
|---|---|
| Agent Workspace 003–005 | 002 后复审已记录 003 `keep + narrow first batch`、004 `split`、005 `keep + expand`；分别通过新 active checklist 授权 |
| P3 平台深化 | 有真实访问、订阅和作者运营数据 |

P0 Stitch 设计原型、P1 可运行公共产品切片、P1 编辑 CMS 基础、P2 Preview release candidate、Production launch 与 Payload-native Admin 重构已经完成，历史与交接见 [`archive`](../archive/README.md)。

## 状态规则

- 只使用 `active`、`deferred`、`completed`、`superseded`。
- 阻塞原因写在 checklist 内，不创造新状态。
- 完成项写回 current 和 decision 后移动到 archive。
- Deferred 工作不获得实现授权；开始前必须建立 active checklist。
