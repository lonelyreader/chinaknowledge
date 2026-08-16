---
doc_contract: DocContractV1
doc_type: router
authority: routing
status: active
scope: execution-roadmap
last_verified: 2026-08-16
max_lines: 100
---

# Roadmap Router

本页是当前执行与后置工作的唯一队列。详细步骤进入 [`checklists/README.md`](checklists/README.md) 挂载的单项 checklist。

## Active：Site Infrastructure Program

网站基础设施升级由 [`Site Infrastructure Parent Checklist`](site-infrastructure-program.md) 统一控制批次、并行线与阻塞关系。`INFRA-MEASURE-001` 已完成并[归档](../archive/site-measurement-foundation.md)（Bing 部分 deferred）。当前 active：

| 工作项 | 交付目标 |
|---|---|
| [`INFRA-BODY-MEDIA-001`](checklists/article-body-media.md) | 正文媒体能力（剩 Preview/生产验收） |
| [`INFRA-BODY-MEDIA-002`](checklists/article-body-media-002.md) | 媒体权限收敛（已部署，剩生产验收） |
| [`INFRA-RETHEME-001`](checklists/site-retheme-song.md) | 宋式视觉换装：token 值切换 |
| [`INFRA-ARTICLE-TEMPLATE-001`](checklists/article-page-template.md) | 文章页模板：目录、印章署名、文末路由 |
| [`INFRA-OG-001`](checklists/dynamic-og-cover-fallback.md) | 动态 OG 与封面兜底 |
| [`INFRA-AGENT-MEDIA-001`](checklists/agent-media-tools.md) | Agent 媒体工具与正文合同 V2 |
| [`INFRA-PERSON-PAGE-001`](checklists/person-page-expansion.md) | Person 页扩展与正式名片 |
| [`INFRA-FEEDS-001`](checklists/feeds-structured-data.md) | RSS/JSON Feed 与结构化数据 |

除下方已启动的 `AGENT-WORKSPACE-007` 外，其余 Batch 2–3 工作项为 queued，进入条件与 mini-spec 见父级清单；queued 不构成实现授权。

## Active：Agent Workspace 完整化

[`Agent Workspace Parent Checklist`](agent-workspace-program.md) 按 Production 当前 14 个工具和本地 `main` 的 33 个工具控制 007–011。Media、007–010 已完成 Local/独立复审并转为 release-only；[`AGENT-WORKSPACE-011 Preview 集成与生产前交接`](checklists/agent-workspace-integration-release.md) 是唯一 active 执行批，只允许专用 branch、Draft PR、受保护 Preview、虚构数据和真实 MCP 验收，不 push/merge `main` 或进入 Production。

## Non-urgent closeout

| 工作项 | 当前门禁 |
|---|---|
| [`GUIDE-FOUNDATION-001`](checklists/guide-foundation-research-corpus.md) | `17,706` 条统一索引与抽样已完成；只等待报告写回和归档，不与冷启动争用优先级，不公开原文 |

`MIDGAME-COLD-START-001`、`FAVICON-PROD-001` 与 `AUTH-RESET-001` 均已部署 Production 并移入 [`archive`](../archive/README.md)。Agent Workspace 001–006 与仓库收敛也已归档；后续能力补全由上面的父级清单继续控制。

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
