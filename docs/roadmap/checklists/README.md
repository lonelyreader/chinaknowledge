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

Agent Workspace 的阶段关系由 [`父级清单`](../agent-workspace-program.md) 记录；父级不授权实现。

非紧急收尾：

- [`AUTH-RESET-001`](password-reset-recovery.md)：正式修复已批准，正在处理 24 小时 token、最新链接提示和过期恢复页。
- [`GUIDE-FOUNDATION-001`](guide-foundation-research-corpus.md)：语料采集与抽样已经完成，只等待报告写回和归档，不占用当前执行优先级。

已完成的 [`FAVICON-PROD-001`](../../archive/favicon-production-release.md)、[`MIDGAME-COLD-START-001`](../../archive/midgame-cold-start.md)、[`AGENT-WORKSPACE-001`](../../archive/agent-workspace-member-foundation.md)至 [`AGENT-WORKSPACE-006`](../../archive/agent-workspace-codex-member-compatibility.md)、[`MEDIA-UPLOAD-001`](../../archive/media-upload-filename-collision.md)、[`CI-DOC-LINKS-001`](../../archive/ci-portable-evidence-links.md)、[`GOV-INDEPENDENT-REVIEW-001`](../../archive/independent-review-boundary-governance.md) 与 [`REPO-CONSOLIDATION-001`](../../archive/repository-main-consolidation.md) 位于 archive。

新清单必须先在本页和上级 [`roadmap/README.md`](../README.md) 登记，并遵守 `ChangeContractV1`；已有清单覆盖当前工作时不重复创建。
