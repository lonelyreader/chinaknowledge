---
doc_contract: DocContractV1
doc_type: checklist
authority: execution
status: active
scope: independent-review-boundary-governance
last_verified: 2026-08-01
max_lines: 120
change_id: GOV-INDEPENDENT-REVIEW-001
risk_tier: base
validation_profile: slice
allowed_paths: AGENTS.md, docs/architecture/development-governance.md, docs/roadmap/checklists/README.md, docs/roadmap/checklists/independent-review-boundary-governance.md, docs/archive/README.md, docs/archive/independent-review-boundary-governance.md
approval_gates: merge, push
---

# Independent Review Boundary Governance

## Goal

为 upgraded 工作冻结批次合同和独立复审阻断边界，使 reviewer 能追踪相邻风险，但不能把相邻建设自动扩成本批实现。

## Scope

- 在开发治理合同中固定批次合同、BLOCK 条件、finding 证据、后续路由、三轮范围校准和 PASS 含义。
- 在根 `AGENTS.md` 增加一条短路由，不复制完整规则。
- 让后续 upgraded checklist 必须声明明确排除项与相邻 finding 的后续路由。

## No-go

- 不修改 Agent Workspace 002 的范围、状态或 Preview 门禁。
- 不引入 Astria 的 `EngineeringRiskV1`、四级质量命令或大型风险台账。
- 不降低权限、公开、数据、恢复和生产动作的安全标准。
- 不修改代码、schema、CI、运行环境或 Production。

## Acceptance

- 只有违反冻结合同、当前 diff 导致的回归或直接危及主体/资产/权限/数据/清理/回滚的问题可以阻断当前批次。
- 每条 BLOCK finding 必须给出违反条款、复现路径、直接因果和最小关闭条件。
- 相邻问题进入已有 checklist；没有入口时建立后续工作项，不自动扩项。
- 连续三轮 BLOCK 后必须校准范围；PASS 只代表当前批次可以进入下一道门。
- 实现者不得为 upgraded 工作给出最终 PASS；复审失败、超时或未真实启动不等于通过。

## Validation

- `npm run docs:governance:check`
- `npm run governance:check`
- `git diff --check`
- 人工核对根路由没有复制长规则，治理合同没有引入 Astria 专属系统。

## Writeback

- 长期规则写入 `docs/architecture/development-governance.md`。
- 根 `AGENTS.md` 只保留短路由；完成记录归档到 `docs/archive/`。

## Work

- [ ] Intake baseline 进入 HEAD。
- [ ] 更新开发治理合同和根路由。
- [ ] 完成验证并归档本清单。
