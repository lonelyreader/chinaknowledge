---
doc_contract: DocContractV1
doc_type: router
authority: routing
status: active
scope: execution-roadmap
last_verified: 2026-07-27
max_lines: 100
---

# Roadmap Router

本页是当前执行与后置工作的唯一队列。详细步骤进入 [`checklists/README.md`](checklists/README.md) 挂载的单项 checklist。

## Active

| 工作项 | Checklist | 当前边界 |
|---|---|---|
| P1 可运行公共产品切片 | [`P1-WEB-001`](checklists/p1-public-runnable-slice.md) | 实现者验证与产品负责人复审通过；等待 Git 归档收口 |

## Deferred

| 工作项 | 进入条件 |
|---|---|
| P1 编辑工作流与 CMS 接入 | 公共产品切片完成，技术栈确定，并为权限、数据和公开路径建立 upgraded checklist |
| P2 上线准备 | P1 投稿—审核—公开流程和权限复审通过 |
| P3 平台深化 | 有真实访问、订阅和作者运营数据 |

P0 Stitch 设计原型已经完成，历史与交接见 [`P0-STITCH-001`](../archive/p0-stitch-design-prototype.md)。

## 状态规则

- 只使用 `active`、`deferred`、`completed`、`superseded`。
- 阻塞原因写在 checklist 内，不创造新状态。
- 完成项写回 current 和 decision 后移动到 archive。
- Deferred 工作不获得实现授权；开始前必须建立 active checklist。
