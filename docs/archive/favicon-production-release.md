---
doc_contract: DocContractV1
doc_type: checklist
authority: execution
status: completed
scope: favicon-production-release
last_verified: 2026-08-11
max_lines: 100
change_id: FAVICON-PROD-001
risk_tier: base
validation_profile: work_item
allowed_paths: apps/web/src/app/favicon.ico, apps/web/src/app/apple-icon.png, apps/web/src/app/icon.svg, docs/current-state.md, docs/product-feature-registry.md, docs/roadmap/README.md, docs/roadmap/checklists/README.md, docs/roadmap/checklists/favicon-production-release.md, docs/archive/README.md, docs/archive/favicon-production-release.md
approval_gates: product-code, commit, push, merge, production-deploy, worktree-cleanup
---

# FAVICON-PROD-001

目标：把已选定并完成尺寸验证的 favicon 运行资产合入 `main`，部署到 `chinainfact.com`，再清理已经被 `main` 完整包含的临时工作树。

## Scope

- 运行资产只包括 `favicon.ico`、`icon.svg` 与 `apple-icon.png`。
- 功能登记说明浏览器与设备图标已接入。
- Production 部署后比较线上与仓库 favicon 哈希，并回读公共页面、health 和图标路由。
- 删除前用 `merge-base --is-ancestor` 确认临时工作树提交已包含在 `origin/main`。

## No-go

- 不合入 favicon 研究图、ImageGen 输出或已过时的新人指南草稿。
- 不修改数据库、内容、权限、环境变量、DNS 或依赖。
- 不强推，不删除仍含未合入提交的保全分支。

## Acceptance

- 三个运行资产位于 `main`，Next build 通过。
- `https://chinainfact.com/favicon.ico` 与仓库文件 SHA-256 一致。
- 英文入口、health、favicon、SVG 与 Apple 图标均返回成功状态。
- release/media 临时工作树仅在提交已包含后删除；剩余工作树干净。

## Validation

- `xmllint --noout apps/web/src/app/icon.svg`
- `npm run governance:check`
- `npm run typecheck`
- `npm run build`
- `git diff --check`
- Production HTTP 与 SHA-256 回读

## Recovery

- Production 代码回滚到部署前的 `dpl_GpjFsp6hwby7FSLEThpQnF6gUqLL`。
- Git 回滚仅撤销三个运行资产和对应登记，不触碰内容与数据。

## Writeback

- 部署 ID、线上哈希和公开路由结果写入 `docs/current-state.md`。
- 完成后清单移入 `docs/archive/`，两个 roadmap router 删除 active 项。

## Work

- [x] 用户批准合并、Production 部署和已包含工作树清理。
- [x] 发布提交 `eaf288b` 已非强制快进推送至 `main`。
- [x] Production deployment `dpl_7VSEy3qNbymrRtx4ZTvZyh8xSLYm` 为 READY；英西入口、health 与三个图标路由均为 200，线上与仓库 SHA-256 一致。
- [x] 当前状态与功能登记已写回，清单归档。
- [x] 已删除被 `main` 包含的 media 与 midgame release 工作树；未合入指南草稿的保全分支继续保留。
