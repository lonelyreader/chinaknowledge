---
doc_contract: DocContractV1
doc_type: checklist
authority: execution
status: active
scope: governance-v1-bootstrap
last_verified: 2026-07-26
max_lines: 220
change_id: GOV-001
risk_tier: base
validation_profile: work_item
allowed_paths: .github/ISSUE_TEMPLATE/task.md, .github/PULL_REQUEST_TEMPLATE.md, .gitignore, AGENTS.md, README.md, DESIGN.md, apps/README.md, packages/README.md, package.json, scripts/**, docs/README.md, docs/START-HERE.md, docs/current-state.md, docs/product-brief.md, docs/architecture/**, docs/roadmap/**, docs/decisions/**, docs/reference/README.md, docs/reference/technical-stack-proposal.md, docs/archive/README.md, dataset/README.md, docs/inbox-frontmatter.md, inbox/_example.md
approval_gates: commit, merge, push
bootstrap: true
---

# GOV-001 Governance V1 Bootstrap

目标：把已经明确批准的仓库重整收敛为短路由、单一真相源、可检查的任务合同和可提交的首次治理基线。

本清单记录一次性的 bootstrap 例外。用户已经明确批准重整陈旧仓库，并在发现治理问题后要求开始修改。
首次治理提交完成后必须归档本清单；后续改动不得复用 `bootstrap: true`。

## Scope

- 拆分产品、设计、阶段、技术建议、开发治理和文档治理的职责。
- 精简根入口与目录 router，消除阶段信息和计划目录重复。
- 为 active checklist 增加 `allowed_paths`，检查当前工作树的路径覆盖。
- 更新 Issue、PR、roadmap、decision 和 current-state 以匹配治理合同。
- 保留已批准的旧 `inbox/`、`dataset/` 架构退出改动。

## No-go

- 不创建产品 App，不安装产品依赖。
- 不把 Payload、PostgreSQL、Vercel 或任何供应商确认为已接受架构。
- 不接入账号、数据库、真实数据、付费服务或生产环境。
- 不 commit、merge、push；这些动作分别等待用户批准。
- 不修改允许路径之外的用户改动。

## Work

- [x] 建立文档路由、当前状态和执行队列。
- [x] 拆分稳定产品定义、执行阶段和技术建议。
- [x] 拆分开发治理与文档治理。
- [x] 删除根 Agent 路由中的具体阶段和重复任务表。
- [x] 增加 changed-path 覆盖检查。
- [x] 运行完整治理验证并复核工作树范围。
- [ ] 经用户批准后提交首次治理基线并归档本清单。

## Acceptance

- `AGENTS.md` 不含阶段、当前任务、计划目录或具体技术栈。
- 产品、设计、roadmap、技术建议和治理合同各有单一职责。
- 每个 active checklist 声明 `allowed_paths`。
- 当前工作树的所有修改和删除都被 active checklist 覆盖。
- 文档 frontmatter、行数、链接、挂载和 canonical scope 检查通过。
- Current-state 明确区分工作树事实与已经提交的仓库基线。

## Validation

- `node --check scripts/check-doc-governance.mjs`
- `node --check scripts/check-change-intake.mjs`
- `npm run governance:check`
- `git diff --check`
- 人工复核稳定入口中没有阶段和执行清单。
- 人工复核 `git status --short` 与 `allowed_paths`。

## Writeback

- 当前事实：`docs/current-state.md`
- 长期合同：`docs/architecture/`
- 执行状态：`docs/roadmap/`
- 接受决定：`docs/decisions/0001-governance-v1.md`
- 入口路由：`AGENTS.md`、`README.md`、`docs/README.md`

## Approval Gates

本清单授权当前范围内的本地文档、模板、配置和检查脚本修改。Commit、merge 和 push 仍需分别批准。
