---
doc_contract: DocContractV1
doc_type: router
authority: routing
status: active
scope: execution-roadmap
last_verified: 2026-07-30
max_lines: 100
---

# Roadmap Router

本页是当前执行与后置工作的唯一队列。详细步骤进入 [`checklists/README.md`](checklists/README.md) 挂载的单项 checklist。

## Active

[`AGENT-WORKSPACE-001`](checklists/agent-workspace-member-foundation.md)：建立远程 MCP、OAuth 连接与 Member read/draft/preview 首个闭环。当前只授权需求与 checklist 文档；代码、依赖、schema、migration、Preview、真实账户和 Production 分别受门禁约束。

## Deferred

| 工作项 | 进入条件 |
|---|---|
| Agent Workspace 公开/撤回与 Editor 策展 | `AGENT-WORKSPACE-001` 通过真实客户端、权限负例和独立复审 |
| Agent Workspace Super Admin 与 CLI fallback | Member/Editor 工具稳定，特权动作与非 MCP 客户端需求经真实使用确认 |
| P3 平台深化 | 有真实访问、订阅和作者运营数据 |

P0 Stitch 设计原型、P1 可运行公共产品切片、P1 编辑 CMS 基础、P2 Preview release candidate、Production launch 与 Payload-native Admin 重构已经完成，历史与交接见 [`archive`](../archive/README.md)。

## 状态规则

- 只使用 `active`、`deferred`、`completed`、`superseded`。
- 阻塞原因写在 checklist 内，不创造新状态。
- 完成项写回 current 和 decision 后移动到 archive。
- Deferred 工作不获得实现授权；开始前必须建立 active checklist。
