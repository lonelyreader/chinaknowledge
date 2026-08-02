---
doc_contract: DocContractV1
doc_type: router
authority: routing
status: active
scope: active-checklists
last_verified: 2026-08-02
max_lines: 80
---

# Active Checklist Router

本目录只存 active 执行清单。一个 checklist 对应一个交付目标，完成或被替代后移入 `docs/archive/`。

Agent Workspace 的阶段关系由 [`父级清单`](../agent-workspace-program.md) 记录；父级不授权实现。

当前唯一 implementation active checklist 是 [`AGENT-WORKSPACE-006`](agent-workspace-codex-member-compatibility.md)：只用本机 Codex CLI 和一个现有 Member 做 Production OAuth/MCP 只读兼容验收、角色隔离、撤销和精确 cleanup；不调用写工具，不修改真实内容、账号或产品代码。

已完成的 [`AGENT-WORKSPACE-001`](../../archive/agent-workspace-member-foundation.md)、[`AGENT-WORKSPACE-002`](../../archive/agent-workspace-member-publication.md)、[`AGENT-WORKSPACE-003`](../../archive/agent-workspace-editor-site-curation.md)、[`AGENT-WORKSPACE-004`](../../archive/agent-workspace-super-admin-activity-read.md)、[`AGENT-WORKSPACE-005`](../../archive/agent-workspace-compatibility-release.md) 与 [`GOV-INDEPENDENT-REVIEW-001`](../../archive/independent-review-boundary-governance.md) 位于 archive。

新清单必须先在本页和上级 [`roadmap/README.md`](../README.md) 登记，并遵守 `ChangeContractV1`。
