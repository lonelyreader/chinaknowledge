---
doc_contract: DocContractV1
doc_type: router
authority: routing
status: active
scope: execution-roadmap
last_verified: 2026-08-01
max_lines: 100
---

# Roadmap Router

本页是当前执行与后置工作的唯一队列。详细步骤进入 [`checklists/README.md`](checklists/README.md) 挂载的单项 checklist。

## Active

父级控制见 [`Agent Workspace Parent Checklist`](agent-workspace-program.md)。它记录 001–005 的关系和阶段转换，不授权实现。

当前没有 implementation active checklist。[`AGENT-WORKSPACE-004`](../archive/agent-workspace-super-admin-activity-read.md) 的 Super Admin 最近 20 条 Article workflow activity 最小只读工具已完成 Local 实现、权限/隐私/不变性回归、独立复审和 fixture 清理；邀请、角色、暂停/恢复、Person、基础对象和其他写动作继续保留在网页后台。Preview/Production 未执行。

## Deferred

| 工作项 | 进入条件 |
|---|---|
| Agent Workspace 005 | 001–004 已关闭；005 的客户端兼容、监控、限流、恢复和 release 仍需用户批准并建立新的 active checklist |
| P3 平台深化 | 有真实访问、订阅和作者运营数据 |

P0 Stitch 设计原型、P1 可运行公共产品切片、P1 编辑 CMS 基础、P2 Preview release candidate、Production launch 与 Payload-native Admin 重构已经完成，历史与交接见 [`archive`](../archive/README.md)。

## 状态规则

- 只使用 `active`、`deferred`、`completed`、`superseded`。
- 阻塞原因写在 checklist 内，不创造新状态。
- 完成项写回 current 和 decision 后移动到 archive。
- Deferred 工作不获得实现授权；开始前必须建立 active checklist。
