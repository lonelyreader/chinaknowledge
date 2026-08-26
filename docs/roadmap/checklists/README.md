---
doc_contract: DocContractV1
doc_type: router
authority: routing
status: active
scope: active-checklists
last_verified: 2026-08-26
max_lines: 80
---

# Active Checklist Router

本目录只存 active 执行清单。一个 checklist 对应一个交付目标，完成或被替代后移入 `docs/archive/`。

Agent Workspace 的阶段关系由 [`父级清单`](../agent-workspace-program.md) 记录；Site Infrastructure 的批次与依赖由 [`Site Infrastructure 父级清单`](../site-infrastructure-program.md) 记录；父级均不授权实现。

Batch 1 收尾（代码已上线，剩验收归档）：

- [`INFRA-BODY-MEDIA-001`](article-body-media.md)：正文媒体能力（upgraded），剩 Preview/生产验收。
- [`INFRA-BODY-MEDIA-002`](article-body-media-002.md)：媒体权限收敛（upgraded），已部署剩生产验收。

当前 active（Site Infrastructure Batch 2；旧分支不得整枝合并，收敛顺序见父级）：

- [`SITE-TOKEN-SYSTEM-RETHEME-001`](site-token-system-retheme.md)：Figma 重建全站 Token，并据此统一公共网站；接管 People V3 尚未提交实现的视觉基线。
- [`PEOPLE-COMMUNITY-FRONTEND-001`](people-community-frontend.md)：三条连接优先页面已完成本地实现与响应式验收，等待独立 Git/发布批准。
- [`INFRA-RETHEME-001`](site-retheme-song.md)：保留宋式 token 候选，等待核心页面 proof 后按当前主线收敛。
- [`INFRA-ARTICLE-TEMPLATE-001`](article-page-template.md)：保留行为与测试，RETHEME 后移植（upgraded）。
- [`INFRA-OG-001`](dynamic-og-cover-fallback.md)：保留动态 OG 与封面兜底候选，等待 Person/Home 构图。
- [`INFRA-AGENT-MEDIA-001`](agent-media-tools.md)：Agent 媒体工具与正文 V2（upgraded）。
- [`INFRA-PERSON-PAGE-001`](person-page-expansion.md)：正式名片已上线，只剩专项 UI 验收后归档（upgraded）。
- [`INFRA-FEEDS-001`](feeds-structured-data.md)：保留 Feed 与 JSON-LD 候选，Person/Project 模型稳定后移植。

非紧急收尾：

- [`GUIDE-FOUNDATION-001`](guide-foundation-research-corpus.md)：语料采集与抽样已经完成，只等待报告写回和归档，不占用当前执行优先级。

已完成的 [`PEOPLE-COMMUNITY-DIRECTION-001`](../../archive/people-community-direction.md)、[`INFRA-MEASURE-001`](../../archive/site-measurement-foundation.md)、[`INFRA-TOKENS-001`](../../archive/design-token-architecture.md)、[`DESIGN-DIRECTION-001`](../../archive/design-direction-revision.md)、[`AUTH-RESET-001`](../../archive/password-reset-recovery.md)、[`FAVICON-PROD-001`](../../archive/favicon-production-release.md)、[`MIDGAME-COLD-START-001`](../../archive/midgame-cold-start.md)、[`AGENT-WORKSPACE-001`](../../archive/agent-workspace-member-foundation.md)至 [`AGENT-WORKSPACE-012`](../../archive/agent-workspace-production-release.md)、[`MEDIA-UPLOAD-001`](../../archive/media-upload-filename-collision.md)、[`CI-DOC-LINKS-001`](../../archive/ci-portable-evidence-links.md)、[`GOV-INDEPENDENT-REVIEW-001`](../../archive/independent-review-boundary-governance.md) 与 [`REPO-CONSOLIDATION-001`](../../archive/repository-main-consolidation.md) 位于 archive。

新清单必须先在本页和上级 [`roadmap/README.md`](../README.md) 登记，并遵守 `ChangeContractV1`；已有清单覆盖当前工作时不重复创建。
