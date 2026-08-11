---
doc_contract: DocContractV1
doc_type: router
authority: routing
status: active
scope: active-checklists
last_verified: 2026-08-11
max_lines: 80
---

# Active Checklist Router

本目录只存 active 执行清单。一个 checklist 对应一个交付目标，完成或被替代后移入 `docs/archive/`。

Agent Workspace 的阶段关系由 [`父级清单`](../agent-workspace-program.md) 记录；Site Infrastructure 的批次与依赖由 [`Site Infrastructure 父级清单`](../site-infrastructure-program.md) 记录；父级均不授权实现。

当前 active（Site Infrastructure Batch 1，可并行）：

- [`INFRA-MEASURE-001`](site-measurement-foundation.md)：测量接入——Web Analytics、GSC/Bing、隐私文案核对。
- [`INFRA-TOKENS-001`](design-token-architecture.md)：Design token 化与样式架构重构，视觉零变化。
- [`INFRA-BODY-MEDIA-001`](article-body-media.md)：正文图片与白名单 embed 能力（upgraded）。
- [`DESIGN-DIRECTION-001`](design-direction-revision.md)：DESIGN.md 桥梁化方向修订与 ADR。

非紧急收尾：

- [`GUIDE-FOUNDATION-001`](guide-foundation-research-corpus.md)：语料采集与抽样已经完成，只等待报告写回和归档，不占用当前执行优先级。

已完成的 [`AUTH-RESET-001`](../../archive/password-reset-recovery.md)、[`FAVICON-PROD-001`](../../archive/favicon-production-release.md)、[`MIDGAME-COLD-START-001`](../../archive/midgame-cold-start.md)、[`AGENT-WORKSPACE-001`](../../archive/agent-workspace-member-foundation.md)至 [`AGENT-WORKSPACE-006`](../../archive/agent-workspace-codex-member-compatibility.md)、[`MEDIA-UPLOAD-001`](../../archive/media-upload-filename-collision.md)、[`CI-DOC-LINKS-001`](../../archive/ci-portable-evidence-links.md)、[`GOV-INDEPENDENT-REVIEW-001`](../../archive/independent-review-boundary-governance.md) 与 [`REPO-CONSOLIDATION-001`](../../archive/repository-main-consolidation.md) 位于 archive。

新清单必须先在本页和上级 [`roadmap/README.md`](../README.md) 登记，并遵守 `ChangeContractV1`；已有清单覆盖当前工作时不重复创建。
