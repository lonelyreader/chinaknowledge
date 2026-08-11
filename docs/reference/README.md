---
doc_contract: DocContractV1
doc_type: router
authority: routing
status: active
scope: reference-index
last_verified: 2026-08-10
max_lines: 80
---

# Reference Router

本目录保存调研、截图、设计版本、测试报告和独立复审证据。

| 主题 | 状态 | 入口 |
|---|---|---|
| 技术栈建议 | Web 基础栈已由 ADR-0005 决定，其余候选 deferred | [`technical-stack-proposal.md`](technical-stack-proposal.md) |
| 设计与信息架构证据 | 按子目录标注 | [`design/README.md`](design/README.md) |
| 实现、Production 与当前架构审计证据 | P1/P2/Production 已验证；成员发布与站方策展差距已完成审计 | [`implementation/README.md`](implementation/README.md) |
| 共享研究素材层提案审查 | `revise`；只建议先做 summary-only 运营验证 | [`shared-research-layer-proposal-review-2026-08-02.md`](shared-research-layer-proposal-review-2026-08-02.md) |
| Media 同名上传修复 | Production 创建、读回、精确清理与独立复审通过 | [`implementation/media-upload-filename-collision-2026-08-10.md`](implementation/media-upload-filename-collision-2026-08-10.md) |
| 密码重置恢复 | 24 小时有效期、最新链接规则与失效链接恢复页已通过本地验证和独立复审 | [`implementation/password-reset-recovery-2026-08-11.md`](implementation/password-reset-recovery-2026-08-11.md) |

规则：

- Reference 只能支持判断，不能决定当前路线或授权实现。
- 每组证据必须由本页或子目录 router 挂载。
- 原始大文件放在清晰命名的子目录，使用短 README 说明来源、日期、对象和结论。
- 被接受的设计资产进入 `design/`；未接受草稿不登记为设计真相。
