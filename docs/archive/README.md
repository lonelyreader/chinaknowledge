---
doc_contract: DocContractV1
doc_type: router
authority: routing
status: active
scope: archive-index
last_verified: 2026-08-03
max_lines: 80
---

# Archive Router

本目录保存已完成、被替代或退出执行状态的 checklist 与历史材料。

| ID | 结果 | 归档材料 |
|---|---|---|
| `GOV-001` | Governance V1 已建立为仓库基线 | [`gov-001-governance-bootstrap.md`](gov-001-governance-bootstrap.md) |
| `P0-STITCH-001` | 产品、信息架构与 Stitch 设计基线已接受 | [`p0-stitch-design-prototype.md`](p0-stitch-design-prototype.md) |
| `P1-WEB-001` | Fixture-only 的英西双语公共产品切片已实现并接受 | [`p1-public-runnable-slice.md`](p1-public-runnable-slice.md) |
| `P1-EDITORIAL-001` | 本地编辑 CMS、角色权限、双语隔离与公开确认已实现并接受 | [`p1-editorial-cms-foundation.md`](p1-editorial-cms-foundation.md) |
| `P2-PREVIEW-001` | 受保护 Preview、migration、媒体持久化、灾备恢复与独立复审均通过 | [`p2-preview-release-candidate.md`](p2-preview-release-candidate.md) |
| `PROD-LAUNCH-001` | 正式域名、真实内容、匿名公开、搜索索引、恢复与回滚演练均通过 | [`production-launch-readiness.md`](production-launch-readiness.md) |
| `PUB-CURATION-001` | 成员直接发布、站方同文档策展、Editor 作者体验、双语资料、生产恢复与双重独立复审均通过 | [`member-publishing-curation-closure.md`](member-publishing-curation-closure.md) |
| `FEATURE-REGISTRY-001` | 70 项当前功能已按用户类型登记，188 个实现与事实文件受同步门禁约束 | [`app-feature-registry.md`](app-feature-registry.md) |
| `ADMIN-UI-001` | 全部自定义 Admin UI 已按 Payload `3.86.0` 原生能力重构，桌面视觉与技术/权限独立复审通过并部署 Production | [`admin-payload-native-ui-reconstruction.md`](admin-payload-native-ui-reconstruction.md) |
| `BRAND-WORDMARK-001` | 定稿轮廓字标已接入公共 Header 与 Footer，SVG、构建、桌面和移动视觉验证通过 | [`brand-wordmark-site-integration.md`](brand-wordmark-site-integration.md) |
| `AGENT-WORKSPACE-001` | 远程 OAuth/MCP、Member read/draft/preview、Local/Preview migration、Cursor 真实工具链、越权与撤权负例和独立复审均通过 | [`agent-workspace-member-foundation.md`](agent-workspace-member-foundation.md) |
| `AGENT-WORKSPACE-002` | Member publication 的 Local/Preview Cursor prepare、人工确认、commit、重放、撤回、过期拒绝、匿名读回、精确清理和最终独立复审均通过 | [`agent-workspace-member-publication.md`](agent-workspace-member-publication.md) |
| `AGENT-WORKSPACE-003` | Editor 单篇跨作者 Article exact read、确认后 Add/Remove、权限负例、匿名读回、Local 清理和最终独立复审均通过；Preview 未执行 | [`agent-workspace-editor-site-curation.md`](agent-workspace-editor-site-curation.md) |
| `AGENT-WORKSPACE-004` | Super Admin-only 最近 20 条 workflow activity 最小读取、权限/隐私负例、领域不变、Agent audit、Local 清理和独立复审均通过；Preview 未执行 | [`agent-workspace-super-admin-activity-read.md`](agent-workspace-super-admin-activity-read.md) |
| `AGENT-WORKSPACE-005` | WorkBuddy/Cursor 兼容、运营保护、恢复、Production migration/staged release/public enable、只读 smoke、精确清理和 Gate 2–6 独立复审均通过 | [`agent-workspace-compatibility-release.md`](agent-workspace-compatibility-release.md) |
| `AGENT-WORKSPACE-006` | Codex CLI Production Member 只读兼容、权限隔离、撤销失败关闭、精确 cleanup 和独立复审均通过 | [`agent-workspace-codex-member-compatibility.md`](agent-workspace-codex-member-compatibility.md) |
| `GOV-INDEPENDENT-REVIEW-001` | Upgraded 批次合同、独立复审阻断证据、后续路由与三轮范围校准已写入长期治理 | [`independent-review-boundary-governance.md`](independent-review-boundary-governance.md) |
| `REPO-CONSOLIDATION-001` | 54 个用户路径已保全，001–006 历史与 Git refs/worktrees 已收敛到唯一 clean `main` | [`repository-main-consolidation.md`](repository-main-consolidation.md) |

规则：

- Archive 只用于追溯，不授权重新执行。
- active checklist 完成后，先写回 current、decision 和 reference，再移入本目录。
- 被替代的文件保留替代入口。
- 不把大段历史复制回 current、architecture 或 roadmap。
