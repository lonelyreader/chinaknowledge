---
doc_contract: DocContractV1
doc_type: router
authority: routing
status: active
scope: execution-roadmap
last_verified: 2026-08-10
max_lines: 100
---

# Roadmap Router

本页是当前执行与后置工作的唯一队列。详细步骤进入 [`checklists/README.md`](checklists/README.md) 挂载的单项 checklist。

## Active

| 工作项 | 当前门禁 |
|---|---|
| [`MIDGAME-COLD-START-001`](checklists/midgame-cold-start.md) | 合同基线已获授权；进入中文母稿、机构署名、英西内容、SEO/GEO 与 Production 冷启动 |
| [`GUIDE-FOUNDATION-001`](checklists/guide-foundation-research-corpus.md) | `17,706` 条统一索引与 24 条 Codex 分层抽样已完成；等待归档，不公开原文 |

Agent Workspace 001–006 与仓库收敛均已完成并归档；其父级控制见 [`Agent Workspace Parent Checklist`](agent-workspace-program.md)。

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
