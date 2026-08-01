---
doc_contract: DocContractV1
doc_type: router
authority: routing
status: active
scope: active-checklists
last_verified: 2026-08-01
max_lines: 80
---

# Active Checklist Router

本目录只存 active 执行清单。一个 checklist 对应一个交付目标，完成或被替代后移入 `docs/archive/`。

Agent Workspace 的阶段关系由 [`父级清单`](../agent-workspace-program.md) 记录；父级不授权实现。

当前唯一 implementation active checklist 是 [`AGENT-WORKSPACE-005`](agent-workspace-compatibility-release.md)：Gate 2 真实 WorkBuddy 已到达 DCR，但精确 `workbuddy:` callback 被当前 allowlist 拒绝；未进入 OAuth，Preview 与 fixture 已恢复清理。当前等待 Product amendment B 的 `product-code` 批准，再做两个产品路径的 exact callback 修复、Local 负例与独立复审；TRAE 不在范围，provider、migration、Production 和真实数据仍分别设门。

已完成的 [`AGENT-WORKSPACE-001`](../../archive/agent-workspace-member-foundation.md)、[`AGENT-WORKSPACE-002`](../../archive/agent-workspace-member-publication.md)、[`AGENT-WORKSPACE-003`](../../archive/agent-workspace-editor-site-curation.md)、[`AGENT-WORKSPACE-004`](../../archive/agent-workspace-super-admin-activity-read.md) 与 [`GOV-INDEPENDENT-REVIEW-001`](../../archive/independent-review-boundary-governance.md) 位于 archive。

新清单必须先在本页和上级 [`roadmap/README.md`](../README.md) 登记，并遵守 `ChangeContractV1`。
