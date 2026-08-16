---
doc_contract: DocContractV1
doc_type: checklist
authority: execution
status: active
scope: agent-workspace-production-release
last_verified: 2026-08-16
max_lines: 140
change_id: AGENT-WORKSPACE-012
risk_tier: upgraded
validation_profile: phase_release
allowed_paths: .github/workflows/production-backup.yml, apps/web/package.json, apps/web/package-lock.json, docs/roadmap/README.md, docs/roadmap/agent-workspace-program.md, docs/roadmap/checklists/README.md, docs/roadmap/checklists/agent-workspace-production-release.md, docs/roadmap/checklists/guide-foundation-research-corpus.md, docs/current-state.md, docs/product-feature-registry.md, docs/reference/implementation/README.md, docs/reference/implementation/agent-workspace-012-production-runtime-2026-08-16.md, docs/archive/README.md, docs/archive/agent-workspace-production-release.md
approval_gates: main-push, production-backup, production-migration, production-deploy, production-public-enable, real-account, real-data
---

# AGENT-WORKSPACE-012 Production 发布与本人 X 外链验收

目标：将 011 已通过 Preview 和独立复审的同一批 33 个工具发布到 Production，完成第 15 条 Person migration、公共与权限 smoke，并用用户当前真实账号只修改和读回本人的 X 外链。本批不实现产品代码。

授权：用户于 2026-08-16 在 011 Production gate 后明确回复“批准”，覆盖本合同冻结的 `main` push、Production backup/migration/deploy/public enable，以及当前账号本人 X 外链的一次受控写入与恢复。授权不覆盖下列 No-go。

## Scope

- 唯一候选来自 011：Preview 验收 SHA `af2ffbf5755c397221660bc658e630f7b75eb0b2`，Draft PR #2；发布 SHA 只可增加已审核 docs/backup 门禁和下述精确依赖安全升级，其他应用源码与该 SHA 精确一致。
- Production 预期基线为 14/15 migrations、Super Admin 14 tools；执行前必须现场只读确认 Vercel project/root/repo/production branch=`main`、Production deployment/env/Gateway/SSO、数据库 ledger/关键计数和 Git fast-forward。
- 唯一领域写入是用户当前账号本人 Person 的 X 外链；先保存原 links/revision，使用现有 `my_links_save`，写后用 `my_profile_get` 及数据库最小 readback 核对 owner 与值。
- 其余动作仅为既有 release、OAuth/MCP discovery/read、备份、migration、开关、审计和精确 cleanup；不创建业务 fixture。
- 发布前只允许两项直接门禁修复：把 GUIDE 外部本机证据链接改为非链接路径文本；把既有 Production backup restore 的 schema/migration 断言先同步到 live 45/14，再在第 15 条迁移后同步到 49/15。不改 backup/export/upload/retention/provider 行为。
- 若 CI production audit 因 011 验收后新公布的 advisory 阻断，只允许一次锁步 Payload `3.86.0→3.87.1` 安全升级，以及 `dompurify@3.4.13`、`fast-uri@3.1.5`、`js-yaml@4.3.1`、`nanoid@3.3.18` 精确 override；不得执行自动 audit fix、升级 Next/React 或引入其他依赖。升级后须 fresh install、完整 Local 门禁、scratch migration/read-path 与 Preview CI 全过，否则停止发布。

## No-go

- 不改应用代码、migration、schema 定义、Vercel project/provider/WAF 规则、DNS、付费项、密钥或 Git 配置；依赖只允许上述 CI advisory 的精确安全升级，backup workflow 只允许上述精确断言更新。
- 不修改其他真实账号、Person、Article、Media、母稿、首页或公开状态；不批量内容、不公开内容、不触发 `major_edit` 或任何真实外部通知。
- 不调用通用/高风险站务写入，不邀请、提权、暂停、恢复或删除账号；不以 Production 发现的问题临场扩项修复。
- 不复用 Preview token、client、connection、dump 或 fixture；不把 token、cookie、email、DB URL、正文、confirmation 或外链原值写入日志和 evidence。
- 不执行强推、rebase、第二次隐式部署或并行 release；`main` 非 fast-forward、候选 tree 不一致或 auto-deploy 目标不唯一即停止。

## Release path

1. [ ] 冻结完整 `RELEASE_SHA`，证明其应用源码等于 011 Preview SHA、仅含合同允许的依赖与门禁差异，worktree 无无关改动；读取 remote `main` 与 Vercel live 配置，确认一次 `main` fast-forward push 会触发唯一 Production auto-deploy。
2. [ ] 关闭 PR `verify` 的 GUIDE 本机绝对链接和 production audit 失败；把连续失败的 backup restore 断言按 live `45 tables / 14 migrations` 精确更新并在 release branch 运行成功，恢复 CI 与每日备份门后才继续。
3. [ ] 记录 Production migration ledger、关键业务/OAuth/event 计数和当前部署/Gateway；运行现有 Production backup，保存 dump SHA，并在隔离 PostgreSQL 完整恢复后读回 ledger/schema/关键计数。
4. [ ] 只应用 repo 既有第 15 条 `20260812_042454_person_page_member_card`，预期 Production `14→15` 且独立新 batch；读回新增 Person schema、ledger 与迁移前业务计数不变，再把 backup restore 断言同步到 `49/15` 并完成迁移后备份恢复。
5. [ ] 以精确 ref 执行一次 `git push origin RELEASE_SHA:main`；不另跑 `vercel --prod/promote`。等待 GitHub→Vercel auto-deploy，断言 target=`production`、state=`READY`、git SHA=`RELEASE_SHA`、正式 alias 指向该 deployment。
6. [ ] Gateway 关闭态先验证公共首页、代表性文章、CMS/登录和 health；Agent route 保持关闭。再按现有 Production 配置公开 Gateway，不改变 SSO/WAF/provider。
7. [ ] 用户当前真实账号完成 DCR/PKCE/OAuth，读回当前 User/Person/role/connection；Super Admin discovery 精确为 33，server identity/protocol 与 011 一致。Preview 的 Member 18 / Editor 28 权限证据随同 exact product tree，不在 Production 新建其他真实角色或 fixture 重演。
8. [ ] 调用 `account_context`、`capabilities_list` 与最小公共 read smoke；猜测高权限工具、任意 Person target 或跨人写入无入口/失败关闭。公共网页、CMS、既有内容计数和公开状态不变。
9. [ ] 保存本人当前 links/revision 后，用 `my_links_save` 只设置用户明确提供/当前登录 X 账号的规范 `https://x.com/<handle>`；`my_profile_get` 与数据库按本人 Person ID 最小读回一致，Agent audit 只含 actor/tool/object/revision/result。
10. [ ] 撤销本次 connection，旧 token 返回 `401`；精确删除本次 DCR client/connection 与可删除的临时 Agent events，或按既有 retention 留存最小审计并记录计数差。删除本地 token、callback、manifest、dump 和隔离数据库。
11. [ ] 运行 Local changed-path gates、Production 公共/Agent/Gateway/DB/部署最终 readback；未主持执行者完成一次 phase-release 独立复审，最终 P0/P1/P2 必须为 `0/0/0` 才写 current/evidence/registry 并归档。

## Stop 与 recovery

- backup/隔离恢复失败，ledger 不是 14/15，第 15 条内容或顺序不符，未知 migration/schema/data drift：不 push、不 migrate；保持 Production 原状。
- migration 失败且尚无领域写入：Gateway 保持关闭，仅在第 15 条为最新独立 batch 且 down 已演练时回退；否则从已验证 dump 恢复并独立核对。禁止 reset、手写修库或跨 batch down。
- push/deploy SHA、target、READY、alias 任一不符：Gateway 保持关闭，停止后续 OAuth/真实数据；alias/code rollback 只指向发布前已记录的 READY Production deployment。
- 33-tool discovery、当前身份/Person、self-only、revision、审计最小化或公共 smoke 任一失败：不写 X；若 X 已写则用保存的原 links+最新 revision 精确恢复本人，再关闭 Gateway。
- 发布后应用故障优先关闭 Gateway并回滚 deployment；第 15 条已有真实 Person 写入后默认保留 migration，不因代码回滚执行 down。只有数据完整性事故才使用备份恢复，并再次独立复审。

## Acceptance

- [ ] `RELEASE_SHA` 除合同允许的依赖与门禁差异外等于 011 Preview 候选；一次 fast-forward `main` push 只产生一个精确 SHA 的 READY Production deployment。
- [ ] Production 备份 SHA、隔离恢复、14→15 独立 migration、ledger/schema/data readback 全部 PASS，恢复点可用。
- [ ] Production Super Admin discovery 为 33；当前角色、服务端权限、撤销和旧 token `401` 闭合；未创建其他账号或 fixture。
- [ ] 当前用户本人 X 外链经 `my_links_save → my_profile_get → DB` 三方一致读回；其他 links/Person/内容/公开状态不变，审计无敏感值。
- [ ] 公共首页/文章/CMS/health 与 Gateway off/on smoke PASS；无内容公开、批量操作、真实通知、DNS/付费/provider 变更。
- [ ] `test:agent`、typecheck、lint、build、`npm run governance:check`、`git diff --check`、Production 最终 readback和一次独立复审 PASS。

## Validation

- Local 只验证冻结 SHA 的 `test:agent`、typecheck、lint、build、governance 与 diff；不得用 Local/Preview 替代 Production deployment、migration、OAuth/MCP 或公共 readback。
- Production 证据必须包含 backup/隔离 restore、ledger/schema/count、deployment target/SHA/READY/alias、Gateway off/on、33-tool discovery、self-only X 三方 readback、撤销/cleanup 与独立复审。

## Writeback

- 运行事实只写唯一 Production evidence、current、feature registry、本 checklist 与父级/routers；失败项保持 `NOT RUN/FAIL`，不写成 PASS。
- 完成后把 007–012 的 Production release 事实写回父级并归档 012；不为发布脚本、真实账号或单个 X 字段建立新平台/清单。
