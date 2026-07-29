---
doc_contract: DocContractV1
doc_type: checklist
authority: execution
status: active
scope: app-feature-registry-delivery
last_verified: 2026-07-29
max_lines: 180
change_id: FEATURE-REGISTRY-001
risk_tier: base
validation_profile: work_item
allowed_paths: README.md, package.json, .github/PULL_REQUEST_TEMPLATE.md, docs/README.md, docs/START-HERE.md, docs/current-state.md, docs/architecture/development-governance.md, docs/architecture/document-governance.md, docs/product-feature-registry.md, docs/roadmap/README.md, docs/roadmap/checklists/README.md, docs/roadmap/checklists/app-feature-registry.md, docs/archive/README.md, docs/archive/app-feature-registry.md, scripts/check-feature-registry.mjs
approval_gates: commit, merge, production-deploy
---

# FEATURE-REGISTRY-001 App Feature Registry

目标：建立一份按用户类型组织、只记录当前已实现能力的人类可读功能登记册，并以仓库门禁保证所有功能开发同步更新登记册。

## Scope

- 从当前公共路由、CMS 集合、权限、工作流、运维脚本和已验证事实整理完整功能登记。
- 把功能登记册接入根项目入口、Docs Router 和 Start Here。
- 增加机器门禁：功能相关代码、配置或公开路由变化时，登记册必须在同一变更中更新。
- 将登记册检查接入现有 `npm run governance:check` 和 PR 复核入口。
- 把登记册的责任、更新时点和事实核验方式写入长期开发与文档治理合同。

## No-go

- 不新增、修改或删除产品功能。
- 不把计划、设想、未上线能力或 fixture 写成现状。
- 不部署、不执行 migration、不修改生产数据、账号、DNS、密钥或外部服务。
- 不修改或提交 `outputs/editorial-drafts/` 下的用户草稿。

## Work

- [ ] 建立按访客、Member、Editor、Super Admin 和运营维护分类的功能登记册。
- [ ] 为每组能力标明入口、边界和当前事实来源。
- [ ] 将登记册挂载到项目文档路由和任务恢复路由。
- [ ] 增加功能变更与登记册同步的机器门禁。
- [ ] 更新治理合同、PR 模板和当前状态。
- [ ] 运行治理、门禁、脚本语法和 diff 检查。
- [ ] 完成后写回并归档本清单。

## Acceptance

- 非技术产品负责人可以按用户类型找到 App 当前全部主要功能，不需要阅读源码或迁移记录。
- 每项只描述已经实现的行为，并明确什么条件下可见、由谁操作、在哪里发生。
- 根 README、Docs Router 与 Start Here 都能路由到登记册。
- 对功能观察范围内任意代码、配置或路由做变更而不改登记册时，机器检查失败。
- 同时修改登记册后机器检查通过；检查已纳入 `npm run governance:check` 和 CI 现有治理步骤。
- 新需求、功能修改、下线、权限变化、路由变化和上线状态变化都必须更新登记册。

## Validation

- `node --check scripts/check-feature-registry.mjs`
- `npm run docs:governance:check`
- `npm run feature-registry:check`
- 对观察路径制造临时 diff，验证未更新登记册时失败、更新登记册时通过。
- `npm run governance:check`
- `git diff --check`
- 人工逐项比对公共路由、Payload collections、角色权限、运行与恢复入口。

## Writeback

- 功能事实：`docs/product-feature-registry.md`
- 项目路由：`README.md`、`docs/README.md`、`docs/START-HERE.md`
- 长期规则：`docs/architecture/development-governance.md`、`docs/architecture/document-governance.md`
- 当前状态：`docs/current-state.md`
- 完成历史：`docs/archive/app-feature-registry.md`

## Approval Gates

本批次只做本地文档、治理脚本、验证和窄提交。merge 与 Production 部署不在本清单范围内。
