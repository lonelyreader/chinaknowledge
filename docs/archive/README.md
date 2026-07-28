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

规则：

- Archive 只用于追溯，不授权重新执行。
- active checklist 完成后，先写回 current、decision 和 reference，再移入本目录。
- 被替代的文件保留替代入口。
- 不把大段历史复制回 current、architecture 或 roadmap。
