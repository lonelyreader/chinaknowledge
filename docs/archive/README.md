---
doc_contract: DocContractV1
doc_type: router
authority: routing
status: active
scope: archive-index
last_verified: 2026-08-26
max_lines: 80
---

# Archive Router

本目录保存已完成或被替代的 checklist。

| ID | 结果 | 归档材料 |
|---|---|---|
| `GOV-001` | Governance V1 已建立为仓库基线 | [`gov-001-governance-bootstrap.md`](gov-001-governance-bootstrap.md) |
| `P0-STITCH-001` | 产品、信息架构与 Stitch 设计基线已接受 | [`p0-stitch-design-prototype.md`](p0-stitch-design-prototype.md) |
| `P1-WEB-001` | Fixture-only 的英西双语公共产品切片已实现并接受 | [`p1-public-runnable-slice.md`](p1-public-runnable-slice.md) |
| `P1-EDITORIAL-001` | 编辑 CMS、角色权限与双语隔离已实现并接受 | [`p1-editorial-cms-foundation.md`](p1-editorial-cms-foundation.md) |
| `P2-PREVIEW-001` | 受保护 Preview、migration、灾备恢复与复审通过 | [`p2-preview-release-candidate.md`](p2-preview-release-candidate.md) |
| `PROD-LAUNCH-001` | 正式域名、匿名公开、索引与恢复回滚演练通过 | [`production-launch-readiness.md`](production-launch-readiness.md) |
| `PUB-CURATION-001` | 成员发布、站方策展、作者署名与生产恢复通过 | [`member-publishing-curation-closure.md`](member-publishing-curation-closure.md) |
| `FEATURE-REGISTRY-001` | 功能登记册与实现指纹同步门禁建立 | [`app-feature-registry.md`](app-feature-registry.md) |
| `ADMIN-UI-001` | Admin UI 已按 Payload 原生能力重构并上线 | [`admin-payload-native-ui-reconstruction.md`](admin-payload-native-ui-reconstruction.md) |
| `BRAND-WORDMARK-001` | 定稿轮廓字标已接入公共 Header 与 Footer，SVG、构建、桌面和移动视觉验证通过 | [`brand-wordmark-site-integration.md`](brand-wordmark-site-integration.md) |
| `AGENT-WORKSPACE-001–006` | OAuth/MCP、Member、策展、审计、客户端兼容与 Production 基线通过 | [`001`](agent-workspace-member-foundation.md)、[`002`](agent-workspace-member-publication.md)、[`003`](agent-workspace-editor-site-curation.md)、[`004`](agent-workspace-super-admin-activity-read.md)、[`005`](agent-workspace-compatibility-release.md)、[`006`](agent-workspace-codex-member-compatibility.md) |
| `AGENT-WORKSPACE-007–012` | 33-tool Member/Editor/Admin 闭环、Preview recovery、Production 15 migrations、本人 X 与终审通过 | [`007`](agent-workspace-member-completion.md)、[`008`](agent-editor-workbench.md)、[`009`](agent-editor-public-actions.md)、[`010`](agent-admin-safe-operations.md)、[`011`](agent-workspace-integration-release.md)、[`012`](agent-workspace-production-release.md) |
| `GOV-INDEPENDENT-REVIEW-001` | Upgraded 批次合同、独立复审阻断证据、后续路由与三轮范围校准已写入长期治理 | [`independent-review-boundary-governance.md`](independent-review-boundary-governance.md) |
| `REPO-CONSOLIDATION-001` | 仓库历史与 refs/worktrees 收敛到唯一 clean `main`，用户路径保全 | [`repository-main-consolidation.md`](repository-main-consolidation.md) |
| `MEDIA-UPLOAD-001` | 同名 Media 唯一不可覆盖 pathname 已在 Production 验证与清理 | [`media-upload-filename-collision.md`](media-upload-filename-collision.md) |
| `MIDGAME-COLD-START-001` | 60 份中文母稿与 120 条英西 Article 已公开并回读 | [`midgame-cold-start.md`](midgame-cold-start.md) |
| `FAVICON-PROD-001` | 定稿 favicon 已上线并完成哈希回读 | [`favicon-production-release.md`](favicon-production-release.md) |
| `AUTH-RESET-001` | 24 小时重置链接与失效恢复页已上线 | [`password-reset-recovery.md`](password-reset-recovery.md) |
| `CI-DOC-LINKS-001` | 旧字标证据的本机绝对图片路径已改为仓库相对链接，GitHub runner 可解析 | [`ci-portable-evidence-links.md`](ci-portable-evidence-links.md) |
| `INFRA-MEASURE-001` | Vercel Web Analytics 与 GSC 验证 + sitemap 提交已上线，隐私文案同步；Bing 暂缓 | [`site-measurement-foundation.md`](site-measurement-foundation.md) |
| `INFRA-TOKENS-001` | 81 token 样式架构上线，视觉零变化，编译产物字节级一致 | [`design-token-architecture.md`](design-token-architecture.md) |
| `DESIGN-DIRECTION-001` | 宋式编辑部方向写入 DESIGN.md 与 ADR-0011，代码落地由 RETHEME-001 承接 | [`design-direction-revision.md`](design-direction-revision.md) |
| `PEOPLE-COMMUNITY-DIRECTION-001` / `PEOPLE-COMMUNITY-FRONTEND-001` / `SITE-TOKEN-SYSTEM-RETHEME-001` | 人物与社群合同、连接优先页面及全站 Token 已以真实人物上线 | [`方向`](people-community-direction.md)、[`前端`](people-community-frontend.md)、[`Token`](site-token-system-retheme.md) |

规则：

- Archive 只供追溯，不授权执行。
- active checklist 完成后，先写回 current、decision 和 reference，再移入本目录。
- 被替代的文件保留替代入口。
- 不把大段历史复制回 current、architecture 或 roadmap。
