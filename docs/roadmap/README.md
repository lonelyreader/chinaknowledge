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
| P2 Preview release candidate | [`P2-PREVIEW-001`](checklists/p2-preview-release-candidate.md) | 阶段进入已批准；仅建立 checklist，等待 checklist commit 批准后开始只读技术核验 |

## Deferred

| 工作项 | 进入条件 |
|---|---|
| P3 平台深化 | 有真实访问、订阅和作者运营数据 |

P0 Stitch 设计原型、P1 可运行公共产品切片与 P1 编辑 CMS 基础已经完成，历史与交接分别见 [`P0-STITCH-001`](../archive/p0-stitch-design-prototype.md)、[`P1-WEB-001`](../archive/p1-public-runnable-slice.md) 和 [`P1-EDITORIAL-001`](../archive/p1-editorial-cms-foundation.md)。

## 状态规则

- 只使用 `active`、`deferred`、`completed`、`superseded`。
- 阻塞原因写在 checklist 内，不创造新状态。
- 完成项写回 current 和 decision 后移动到 archive。
- Deferred 工作不获得实现授权；开始前必须建立 active checklist。
