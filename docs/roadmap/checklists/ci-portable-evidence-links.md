---
doc_contract: DocContractV1
doc_type: checklist
authority: execution
status: active
scope: ci-portable-evidence-links
last_verified: 2026-08-10
max_lines: 100
change_id: CI-DOC-LINKS-001
risk_tier: base
validation_profile: work_item
allowed_paths: docs/reference/implementation/brand-wordmark-site-integration-2026-07-30.md, docs/product-feature-registry.md, docs/roadmap/README.md, docs/roadmap/checklists/README.md, docs/roadmap/checklists/ci-portable-evidence-links.md, docs/archive/README.md, docs/archive/ci-portable-evidence-links.md
approval_gates: docs-fix, push, merge
---

# CI Portable Evidence Links

目标：让字标验收文档的四张已跟踪图片在本机和 GitHub Actions 都能解析。

## Scope

- 把四个写死 `/Volumes/External/chinaknowledge/` 的 Markdown 图片链接改为同目录相对链接。
- 不修改图片、产品代码、运行配置或历史结论。

## No-go

- 不删除、重生成或重压缩证据图片。
- 不修改字标实现或已归档验收结论。

## Acceptance

- 四个链接都指向仓库内已跟踪文件。
- `npm run governance:check` 与 `git diff --check` 通过。
- GitHub `Preview checks / verify` 通过。

## Validation

- `npm run governance:check`
- `git diff --check`
- GitHub `Preview checks / verify`

## Writeback

- 完成后移入 `docs/archive/`，并从 active router 删除。

## Work

- [x] 从失败 Actions 日志确认 4 个 broken local link；上传代码未进入失败步骤。
- [x] 改为仓库相对链接并更新内容指纹。
- [ ] 通过本地与 GitHub 门禁，归档 checklist。
