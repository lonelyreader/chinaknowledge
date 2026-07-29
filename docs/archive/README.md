---
doc_contract: DocContractV1
doc_type: router
authority: routing
status: active
scope: archive-index
last_verified: 2026-07-29
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

规则：

- Archive 只用于追溯，不授权重新执行。
- active checklist 完成后，先写回 current、decision 和 reference，再移入本目录。
- 被替代的文件保留替代入口。
- 不把大段历史复制回 current、architecture 或 roadmap。
