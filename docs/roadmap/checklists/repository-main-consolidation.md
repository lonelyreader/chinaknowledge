---
doc_contract: DocContractV1
doc_type: checklist
authority: execution
status: active
scope: repository-main-consolidation
last_verified: 2026-08-03
max_lines: 200
change_id: REPO-CONSOLIDATION-001
risk_tier: upgraded
validation_profile: work_item
allowed_paths: docs/roadmap/README.md, docs/roadmap/checklists/README.md, docs/roadmap/checklists/repository-main-consolidation.md, docs/archive/README.md, docs/archive/repository-main-consolidation.md, docs/reference/README.md, docs/reference/shared-research-layer-proposal-review-2026-08-02.md, outputs/IMAGEGEN_OUTPUTS.md, outputs/editorial-drafts/china-ai-talent-migration-zh-draft.docx, outputs/editorial-drafts/china-ai-talent-migration-zh-draft.md, outputs/logo-concepts/**, outputs/logo-wordmark-study/**
approval_gates: preserve-user-files, discard-superseded-worktree, fast-forward-main, push-main, delete-local-branches, delete-remote-branch
---

# Repository Main Consolidation

目标：在不丢失根工作树用户文件、不改产品代码或外部运行状态的前提下，把已完成的 001–006 历史收敛到唯一 `main`，最终只保留 `/Volumes/External/chinaknowledge` 一个 clean worktree、一个本地 `main` 和一个远端 `main`。

用户于 2026-08-03 先要求只读判断，随后以“批准”授权按审计建议执行：默认保留根工作树 54 个用户路径；丢弃已被最终 005 取代的 detached Gate 1 工作树；fast-forward 并 push `main`；在 containment readback 后删除多余本地分支、worktree 和远端 005 分支。

## Frozen evidence

- 远端 `main` 与远端 005 均为 `305ddbf`；006 为 `31fede1`，只领先 4 个 docs-only commit，`origin/main...006 = 0/4`。
- 所有 8 个历史 `codex/*` 分支 tip 和本地 `main` 均被 006 包含；不需要 merge commit、rebase 或 history rewrite。
- 006 worktree clean，`npm run governance:check` PASS。
- detached Gate 1 HEAD `7f208871` 被 005/006 包含；其 7 modified + 1 untracked 是 005 active/preflight 旧状态，最终 005 closure 已取代。
- 根工作树有 3 modified + 51 untracked 路径：共享研究审查、中文文章草稿、ImageGen 清单、Logo 概念/源文件/最终矢量。它们不得在建立可恢复提交前清理。

## Scope

- 在 006 后保留根工作树用户内容；只对 `docs/roadmap/README.md` 做语义合并，保留 006 closure 并加入共享研究 deferred 行。
- 把共享研究审查中的阶段事实从 001–005 校准为 001–006；不改变其 `revise` 结论、范围或产品授权。
- 输出文件按原路径和字节复制；`outputs/IMAGEGEN_OUTPUTS.md` 保留已有条目并追加用户记录。
- 完成独立只读复审和治理后归档本 checklist，再收敛 Git refs/worktrees。

## No-go

- 不删除或覆盖根工作树用户文件，直到相同内容已进入最终分支提交并完成逐路径/哈希读回。
- 不使用 broad `git clean`、hard reset、force push、history rewrite 或未解析 glob 删除。
- 不改 App、schema、migration、依赖、Production 数据、Vercel、Gateway、账号、内容公开状态或浏览器会话。
- 不把 detached Gate 1 的旧 active/current 文档合回最终历史。
- 不保留临时备份分支、tag、stash、第二 worktree 或远端 feature branch作为最终状态。

## Recovery and deletion contract

- 用户内容必须先进入具名 commit；清理前逐项确认 final branch blob 或工作树文件与源文件一致。清理后可从该 commit 恢复。
- 只有 `main` 已包含目标 tip 时才删除对应本地分支；只有远端 `main` 读回目标 tip 后才删除远端 005。
- detached worktree 只按精确绝对路径删除；006 worktree 只在 `main` 已包含其 final tip 后删除。
- remote `main` 只允许 fast-forward push；push 前以 `git ls-remote` 重读远端 tip，发生漂移立即停止。

## Acceptance

- [ ] 54 个根工作树用户路径全部保留到最终历史；文本校准项有精确 diff，二进制与输出源有哈希/路径读回。
- [ ] 共享研究审查与 roadmap 兼容 006 closure；没有新 active 产品工作或产品实现授权。
- [ ] 文档治理、feature registry、change intake、`git diff --check` 与独立 reviewer 全部 PASS。
- [ ] 本地和远端 `main` 包含 001–006 与用户内容 closure；push 为 fast-forward，无 force。
- [ ] detached Gate 1 和 006 临时 worktree 已删除；所有历史本地分支和远端 005 已在 containment 后删除。
- [ ] 最终只有 `/Volumes/External/chinaknowledge` 一个 worktree，本地/远端各只有 `main`，`git status --short --branch` clean。

## Validation

- Git：`worktree list --porcelain`、`branch --merged main`、`rev-list --left-right --count`、`ls-remote --heads origin`、逐分支 containment。
- 内容：源/目标路径清单、`git hash-object`/blob readback、tracked/untracked 精确状态、Logo/草稿/审查文档存在性。
- 仓库：`npm run governance:check`、`git diff --check`、最终 clean status。
- 独立复审：未主持整合者只读核对 changed paths、用户内容保存、旧 worktree supersession、fast-forward 和删除前提。

## Writeback

- 执行状态写回本 checklist、`docs/roadmap/checklists/README.md` 和 `docs/roadmap/README.md`。
- 用户内容写回既有 reference router、共享研究审查、ImageGen 清单与原 `outputs/**` 路径，不创建平行报告。
- 验收通过后把本 checklist 移入 `docs/archive/`，并登记 `docs/archive/README.md`。
- 最终 commit、ref、worktree、远端 readback 和清理恢复点记录在归档 checklist；不把运行时 Git 状态写入 current 产品事实。

## Current gate

Active intake 已建立。下一步只把根工作树用户内容复制到 006 后的受控路径并校准两处阶段文字；通过哈希、治理和独立复审前，不清理任何源文件、worktree、分支或远端 ref。
