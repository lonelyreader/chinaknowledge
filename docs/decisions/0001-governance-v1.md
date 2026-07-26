---
doc_contract: DocContractV1
doc_type: decision
authority: canonical
status: accepted
scope: decision-governance-v1
last_verified: 2026-07-26
max_lines: 160
---

# ADR-0001：Governance V1 与文档路由

## Context

项目将长期经历设计、实现、内容运营和多人编辑。过往开发经验表明，文档容易因重复解释、平行真相和长期堆叠 checklist 失去可用性。

## Decision

- 使用 `current / architecture / roadmap / decisions / reference / archive` 分责。
- `AGENTS.md` 和各区 README 保持为短 router。
- 任务授权只保留在 `development-governance.md`，文档合同只保留在 `document-governance.md`。
- 每个 active 工作使用一个 `ChangeContractV1` checklist。
- 每个代码或配置改动必须被 active checklist 的 `allowed_paths` 覆盖。
- 每份 `docs/**/*.md` 使用 `DocContractV1` frontmatter 和行数预算。
- 用无第三方依赖的治理脚本检查 frontmatter、预算、链接、挂载和 active checklist 结构。
- 只有真实跨任务风险出现后才建立独立风险台账。

## Consequences

- Agent 可以按任务读取最小材料。
- 文档增长必须通过 router 挂载，不能靠新建“补充版”绕过权威。
- 行数预算超限会阻止治理检查通过。
- 结构检查不能代替人工判断 current、roadmap 和 checklist 的语义是否一致。

## Supersedes

无。
