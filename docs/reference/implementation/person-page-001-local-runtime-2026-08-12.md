---
doc_contract: DocContractV1
doc_type: reference
authority: evidence
status: active
scope: person-page-001-local-runtime
last_verified: 2026-08-12
max_lines: 150
---

# INFRA-PERSON-PAGE-001 Local 实现与验证证据

供独立复审。合同见 `docs/roadmap/checklists/person-page-expansion.md`。分支 `infra/person-page-001`（worktree `.worktrees/person-page`）。

## Schema 与权限矩阵

| 字段 | 类型 | 写权限 | 读 |
|---|---|---|---|
| `nameZh` | text | 成员自管（own person）或 Editor+ | 公开 |
| `quote` / `quoteEs` | text | 成员自管或 Editor+ | 公开 |
| `canHelpWith` / `canHelpWithEs` | array(item: text, maxRows 8) | 成员自管或 Editor+ | 公开 |
| `editorialBio` / `editorialBioEs` | richText | 仅 Editor+（field access `create/update: editorialField`） | 公开 |
| `verdict` / `verdictEs` | text | 仅 Editor+（同上） | 公开 |
| links `type` | select | 新增 `discord` 选项（Email 前） | 公开 |

集合级 `update: updateOwnPersonOrEditorial` 不变；成员自管字段不加 field access（走集合级 own-person 约束）；Editor 字段沿用 `editorialField` 模式。公开/撤回语义、版本、锁定、权限模型本体未动。

## 读取映射（ARTICLE-TEMPLATE-001 接口对齐）

`content/cms.ts` `PublishedCMSPerson`（`PublishedCMSByline` 经 Omit 继承）按 locale 本地化输出单字段：

- `hanziName?: string` ← `nameZh`（trim 后非空才输出）。
- `epithet?: string` ← `verdict`/`verdictEs`（es 优先、空回退 en）。
- `bioThirdPerson?: string` ← `editorialBio(Es)` richText 转纯文本（作者卡用）；richText 原文另以 `editorialBio` 字段输出供 Person 页 `CMSRichText` 渲染（只读调用，未改该组件）。
- `discordLine?: string` ← links 含 discord 项时组装成员主语句（en/es 各一版，含 topics 前 3 项）；无 discord link 不输出。
- 另有 `quote: string | null`、`canHelpWith: string[]`（es 行存在则整组用 es，否则回退 en）。
- 空 richText（只有空 root）视为缺失并回退 `introduction`。

## 页面与索引

- `/people/[slug]`（CMS 分支）重构为 660px 窄版心「介绍信」体：竖排汉字侧签（`hanziName`，980px 以下隐藏）→ 肖像 + 姓名 + 紧贴外链 → `identity · city` 身份行 + topics → 判词署名行（seal-size 丹红方印记）→ 编辑传记（缺失回退 introduction）→ 本人引语 → Selected work / Posts 作品流 → Can help with → 成员主语 Discord 行。全部新区块无数据整体隐藏；URL 与静态回退分支未变。
- People 索引 `CMSPeopleDirectory` 结果区改判词名录行（`components/person/roster-row.tsx`：`判词 — 姓名` + identity·city + 最近作品链接）；Spotlight、筛选、分页未动。
- OG description 用 `epithet ?? identity`。
- 样式以独立注释块追加 `globals.css` 尾部，全部引用既有 token（汉字层用 `var(--font-hanzi, "Noto Serif SC", …)` 供 RETHEME 接管）。

## Migration 证据（本地，Preview/Production 未触碰）

文件 `apps/web/src/migrations/20260812_042454_person_page_member_card.ts/.json`。

- `npm run test:migration-recovery` PASS（scratch 库全量 up/down/重建 + 有数据回滚 fail-closed）。
- 批次隔离：scratch 库先 apply 旧 migrations（batch 1），单独 apply 本 migration（batch 2）→ people 表 7 个新列 + 2×2 `can_help_with` 表 + enum 含 `discord`、`slug` 保持 NOT NULL；`migrate:down`（仅 batch 2）→ 新列/表归零、enum 恢复、people 表完好。
- 既有漂移记录：生成器另产出 `people.slug DROP NOT NULL`（slug 于 2026-07-29 获得 admin.condition 后快照滞后，本地 push 库已为可空），与本项无关，已从 DDL 中剔除并在 migration 注释中说明；snapshot json 保留生成值。后续 migration 作者与复审者需知悉。

## 权限负例与读路径（scratch 库 `payload migrate` 后运行）

脚本：[`assets/person-page-001/person-page-permission-tests.mts`](assets/person-page-001/person-page-permission-tests.mts)、[`assets/person-page-001/person-page-readpath-tests.mts`](assets/person-page-001/person-page-readpath-tests.mts)。复现（apps/web 内）：

```
DATABASE_URL=postgresql://chinaknowledge@127.0.0.1:54329/<scratch> npx payload migrate
DATABASE_URL=... node --import tsx ../../docs/reference/implementation/assets/person-page-001/person-page-permission-tests.mts
DATABASE_URL=... node --import tsx --conditions react-server .../person-page-readpath-tests.mts
```

（`--conditions react-server` 满足 `server-only`/`react.cache`；本地需 `node_modules/server-only` stub 或经 Next 运行时。）

2026-08-12 结果（overrideAccess: false 走真实访问控制）：

- PASS 成员 A 直写成员 B 的 Person 被拒。
- PASS 成员直写本人 `verdict`/`verdictEs`/`editorialBio`/`editorialBioEs`：请求被接受但字段被剥离，存储值不变（Payload field-access 语义）。
- PASS Editor 写判词与编辑传记（正例）；成员自管 `nameZh`/`quote`/`canHelpWith` 持久化（正例）。
- PASS 匿名按 id 读 draft Person 被拒；匿名列表与其他成员视角均不含 draft Person（新字段不泄露）。
- PASS 公开读路径：draft 不可见→发布后 EN 映射（hanziName/epithet/bioThirdPerson/quote/canHelpWith/discordLine）逐项断言；ES 用 es 值、缺失回退 EN，discordLine 西语句式。

## 常规验证

- `tsc --noEmit` PASS；`eslint` 0 error（新 migration 4 条 unused-vars warning 与既有 migration 签名模式一致）。
- `payload generate:types` 与 `generate:importmap` 已再生成（importMap 仅注册顺序变化，因 People 新增 richText）。

## Pending（本批未完成，需后续门禁）

1. `npm run build`、Preview/Production migration apply——schema/migration 门禁单独批准后执行。
2. 浏览器验证（桌面与 390px 无溢出、成员编辑→公开读回主流程）——归合并评审阶段（dev server 在沙箱内因 `uv_interface_addresses` 无法启动，见 `/tmp/pp-dev.log`）。
3. 独立复审（权限负例、migration 回滚、未公开隔离、EN/ES 回退）。
4. feature registry 与 current-state 写回、checklist 归档——合并后执行。
