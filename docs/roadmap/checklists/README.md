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

当前 active checklist：

- [`MEDIA-UPLOAD-001`](media-upload-filename-collision.md)：修复客户端直传时同名图片路径冲突，保持原图与 `card` 缩略图可寻址。

已完成的 [`AGENT-WORKSPACE-001`](../../archive/agent-workspace-member-foundation.md)至 [`AGENT-WORKSPACE-006`](../../archive/agent-workspace-codex-member-compatibility.md)、[`GOV-INDEPENDENT-REVIEW-001`](../../archive/independent-review-boundary-governance.md) 与 [`REPO-CONSOLIDATION-001`](../../archive/repository-main-consolidation.md) 位于 archive。

新清单必须先在本页和上级 [`roadmap/README.md`](../README.md) 登记，并遵守 `ChangeContractV1`。
