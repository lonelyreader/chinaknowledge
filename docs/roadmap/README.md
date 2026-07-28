---
doc_contract: DocContractV1
doc_type: router
authority: routing
status: active
scope: execution-roadmap
last_verified: 2026-07-28
max_lines: 100
---

# Roadmap Router

本页是当前执行与后置工作的唯一队列。详细步骤进入 [`checklists/README.md`](checklists/README.md) 挂载的单项 checklist。

## Active

[`PUB-CURATION-001 Member Publishing And Editorial Curation Closure`](checklists/member-publishing-curation-closure.md)：把当前投稿审核架构改为成员直接公开与站方策展两条独立状态，在同一 Article 上保留原作者署名，并打通官方入口到 Person 与外链的流量路径。当前已建立产品合同与架构审计；产品代码、schema、migration、public routing、真实账户和 Production 分别过门禁。

## Deferred

| 工作项 | 进入条件 |
|---|---|
| P3 平台深化 | 有真实访问、订阅和作者运营数据 |

P0 Stitch 设计原型、P1 可运行公共产品切片、P1 编辑 CMS 基础、P2 Preview release candidate 与 Production launch 已经完成，历史与交接见 [`archive`](../archive/README.md)。

## 状态规则

- 只使用 `active`、`deferred`、`completed`、`superseded`。
- 阻塞原因写在 checklist 内，不创造新状态。
- 完成项写回 current 和 decision 后移动到 archive。
- Deferred 工作不获得实现授权；开始前必须建立 active checklist。
