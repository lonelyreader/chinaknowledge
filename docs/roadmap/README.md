---
doc_contract: DocContractV1
doc_type: router
authority: routing
status: active
scope: execution-roadmap
last_verified: 2026-08-26
max_lines: 100
---

# Roadmap Router

本页是当前执行与后置工作的唯一队列。详细步骤进入 [`checklists/README.md`](checklists/README.md) 挂载的单项 checklist。

## Active：Site Infrastructure Program

网站基础设施升级由 [`Site Infrastructure Parent Checklist`](site-infrastructure-program.md) 统一控制批次、并行线与阻塞关系。`INFRA-MEASURE-001` 已完成并[归档](../archive/site-measurement-foundation.md)（Bing 部分 deferred）。当前 active：

| 工作项 | 交付目标 |
|---|---|
| [`PEOPLE-COMMUNITY-DIRECTION-001`](checklists/people-community-direction.md) | 人物与社群合同及 Figma AI 核心 proof 已完成，等待最终治理写回与归档 |
| [`INFRA-BODY-MEDIA-001`](checklists/article-body-media.md) | 正文媒体能力（剩 Preview/生产验收） |
| [`INFRA-BODY-MEDIA-002`](checklists/article-body-media-002.md) | 媒体权限收敛（已部署，剩生产验收） |
| [`INFRA-RETHEME-001`](checklists/site-retheme-song.md) | 旧分支保存宋式 token 候选；等待人物核心页面 proof 后按当前主线收敛 |
| [`INFRA-ARTICLE-TEMPLATE-001`](checklists/article-page-template.md) | 保留目录、署名、文末路由行为与测试；等待新页面合同后移植 |
| [`INFRA-OG-001`](checklists/dynamic-og-cover-fallback.md) | 保留动态 OG 与封面兜底候选；等待 Person/Home 构图 |
| [`INFRA-AGENT-MEDIA-001`](checklists/agent-media-tools.md) | Agent 媒体工具与正文合同 V2 |
| [`INFRA-PERSON-PAGE-001`](checklists/person-page-expansion.md) | 正式名片已上线，只剩专项 UI 验收后归档，不扩入新 People 体验 |
| [`INFRA-FEEDS-001`](checklists/feeds-structured-data.md) | 保留 feed/JSON-LD 候选；Person/Project 模型稳定后移植 |

人物与社群方向合同及核心页面 Figma AI proof 已完成，当前只剩最终治理写回与归档。下一顺序为 `INFRA-PROJECTS-001` 人物当前行动闭环 → RETHEME → ARTICLE → `INFRA-HOME-001` 人物优先首页 → OG → FEEDS。Figma AI 负责 UI 重构，Codex 不先行改前端；实现、schema、migration、真实内容与 Production 仍需分别授权。

## Completed：Agent Workspace 完整化

[`Agent Workspace Parent Checklist`](agent-workspace-program.md) 的 007–012 已完成实现、分级复审、统一 Preview、Production 运行验收与最终 phase-release 独立复审：Production 现为 15 migrations / 33 tools，当前用户本人 X 已经 MCP、数据库与 EN/ES 匿名页读回。007–012 已移入 [`archive`](../archive/README.md)。

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
