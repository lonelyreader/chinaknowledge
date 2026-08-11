---
doc_contract: DocContractV1
doc_type: router
authority: routing
status: active
scope: execution-roadmap
last_verified: 2026-08-11
max_lines: 100
---

# Roadmap Router

本页是当前执行与后置工作的唯一队列。详细步骤进入 [`checklists/README.md`](checklists/README.md) 挂载的单项 checklist。

## Non-urgent closeout

| 工作项 | 当前门禁 |
|---|---|
| [`AUTH-RESET-001`](checklists/password-reset-recovery.md) | 正式修复已批准；冻结 24 小时 token、最新链接提示、过期恢复页与 Production 回读 |
| [`GUIDE-FOUNDATION-001`](checklists/guide-foundation-research-corpus.md) | `17,706` 条统一索引与抽样已完成；只等待报告写回和归档，不与冷启动争用优先级，不公开原文 |

`MIDGAME-COLD-START-001` 与 `FAVICON-PROD-001` 均已部署 Production 并移入 [`archive`](../archive/README.md)。Agent Workspace 001–006 与仓库收敛也已归档；其父级控制见 [`Agent Workspace Parent Checklist`](agent-workspace-program.md)。

## Deferred

| 工作项 | 进入条件 |
|---|---|
| 004 后的高风险账户动作 | 邀请、角色、暂停/恢复、Person、删除或批量动作出现独立需求后另建 upgraded capability checklist；不并入 005 release |
| Member/Agent 共享研究产品 | 当前审查建议 [`revise`](../reference/shared-research-layer-proposal-review-2026-08-02.md)；先等待 `GUIDE-FOUNDATION-001` 的 go/no-go 证据，不并入基础语料采集 |
| P3 平台深化 | 有真实访问、订阅和作者运营数据 |

P0 Stitch 设计原型、P1 可运行公共产品切片、P1 编辑 CMS 基础、P2 Preview release candidate、Production launch 与 Payload-native Admin 重构已经完成，历史与交接见 [`archive`](../archive/README.md)。

## 状态规则

- 只使用 `active`、`deferred`、`completed`、`superseded`。
- 阻塞原因写在 checklist 内，不创造新状态。
- 完成项写回 current 和 decision 后移动到 archive。
- Deferred 工作不获得实现授权；开始前必须建立 active checklist。
