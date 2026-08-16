---
doc_contract: DocContractV1
doc_type: router
authority: routing
status: active
scope: active-checklists
last_verified: 2026-08-16
max_lines: 80
---

# Active Checklist Router

本目录只存 active 执行清单。一个 checklist 对应一个交付目标，完成或被替代后移入 `docs/archive/`。

Agent Workspace 的阶段关系由 [`父级清单`](../agent-workspace-program.md) 记录；Site Infrastructure 的批次与依赖由 [`Site Infrastructure 父级清单`](../site-infrastructure-program.md) 记录；父级均不授权实现。

Batch 1 收尾（代码已上线，剩验收归档）：

- [`INFRA-BODY-MEDIA-001`](article-body-media.md)：正文媒体能力（upgraded），剩 Preview/生产验收。
- [`INFRA-BODY-MEDIA-002`](article-body-media-002.md)：媒体权限收敛（upgraded），已部署剩生产验收。

当前 active（Site Infrastructure Batch 2，可并行，合并顺序见父级）：

- [`INFRA-RETHEME-001`](site-retheme-song.md)：宋式视觉换装，token 值切换。
- [`INFRA-ARTICLE-TEMPLATE-001`](article-page-template.md)：文章页模板（upgraded）。
- [`INFRA-OG-001`](dynamic-og-cover-fallback.md)：动态 OG 与封面兜底。
- [`INFRA-AGENT-MEDIA-001`](agent-media-tools.md)：Agent 媒体工具与正文 V2（upgraded）。
- [`INFRA-PERSON-PAGE-001`](person-page-expansion.md)：Person 页扩展与正式名片（upgraded）。
- [`INFRA-FEEDS-001`](feeds-structured-data.md)：Feed 与结构化数据。

当前 active（Agent Workspace）：

- [`AGENT-WORKSPACE-007`](agent-member-completion.md)：Member 完整闭环（upgraded），Local/复审与统一 Preview PASS，只剩 Production release。
- [`AGENT-WORKSPACE-008`](agent-editor-workbench.md)：Editor 工作台（upgraded），Local/复审与统一 Preview PASS，只剩 Production release。
- [`AGENT-WORKSPACE-009`](agent-editor-public-actions.md)：首页排期与 `major_edit` 作者通知（upgraded），Local/复审与统一 Preview PASS，只剩 Production release。
- [`AGENT-WORKSPACE-010`](agent-admin-safe-operations.md)：Site Article working-copy 与有限 activity（upgraded），Local/复审与统一 Preview PASS，只剩 Production release。
- [`AGENT-WORKSPACE-011`](agent-workspace-integration-release.md)：一次性虚构三角色真实 MCP、Preview migration/recovery/cleanup 与 Production 交接（upgraded）；Preview/phase-release 复审 PASS，停在 Production gate。

非紧急收尾：

- [`GUIDE-FOUNDATION-001`](guide-foundation-research-corpus.md)：语料采集与抽样已经完成，只等待报告写回和归档，不占用当前执行优先级。

已完成的 [`INFRA-MEASURE-001`](../../archive/site-measurement-foundation.md)、[`INFRA-TOKENS-001`](../../archive/design-token-architecture.md)、[`DESIGN-DIRECTION-001`](../../archive/design-direction-revision.md)、[`AUTH-RESET-001`](../../archive/password-reset-recovery.md)、[`FAVICON-PROD-001`](../../archive/favicon-production-release.md)、[`MIDGAME-COLD-START-001`](../../archive/midgame-cold-start.md)、[`AGENT-WORKSPACE-001`](../../archive/agent-workspace-member-foundation.md)至 [`AGENT-WORKSPACE-006`](../../archive/agent-workspace-codex-member-compatibility.md)、[`MEDIA-UPLOAD-001`](../../archive/media-upload-filename-collision.md)、[`CI-DOC-LINKS-001`](../../archive/ci-portable-evidence-links.md)、[`GOV-INDEPENDENT-REVIEW-001`](../../archive/independent-review-boundary-governance.md) 与 [`REPO-CONSOLIDATION-001`](../../archive/repository-main-consolidation.md) 位于 archive。

新清单必须先在本页和上级 [`roadmap/README.md`](../README.md) 登记，并遵守 `ChangeContractV1`；已有清单覆盖当前工作时不重复创建。
