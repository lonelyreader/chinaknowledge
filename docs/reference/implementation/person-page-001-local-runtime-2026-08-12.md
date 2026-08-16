---
doc_contract: DocContractV1
doc_type: reference
authority: evidence
status: active
scope: person-page-001-local-runtime
last_verified: 2026-08-16
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

- 2026-08-16 独立 scratch 库全量 apply 后，将本 migration 隔离为 batch 2；先向 live 与 Person version links 写入 `discord`，`migrate:down` 将其保值降级为 `other` 后重建旧 enum，并确认新增列、两组 `can_help_with` 表被移除，同时 `people` 表、旧 `identity_es` 与 `slug NOT NULL` 保持；随后单条 reapply，新增结构和 migration ledger 恢复，PASS。
- 通用 `npm run test:migration-recovery` 在全新库把 15 条 migration 记入同一 batch，整批 down 会执行到基础 migration 删除 `payload_migrations`，随后 runner 报 ledger 不存在。该 helper 不能证明本 slice 回滚失败；本条 migration 的隔离 down/reapply 已通过。此既有工具限制不在 Person allowed paths，路由后续修正。
- 既有漂移记录：生成器另产出 `people.slug DROP NOT NULL`（slug 于 2026-07-29 获得 admin.condition 后快照滞后，本地 push 库已为可空），与本项无关，已从 DDL 中剔除并在 migration 注释中说明；snapshot json 保留生成值。后续 migration 作者与复审者需知悉。

## 权限负例与读路径（scratch 库 `payload migrate` 后运行）

脚本：[`assets/person-page-001/person-page-permission-tests.mts`](assets/person-page-001/person-page-permission-tests.mts)、[`assets/person-page-001/person-page-readpath-tests.mts`](assets/person-page-001/person-page-readpath-tests.mts)。复现（apps/web 内）：

```
DATABASE_URL=postgresql://chinaknowledge@127.0.0.1:54329/<scratch> npx payload migrate
DATABASE_URL=... node --import tsx ../../docs/reference/implementation/assets/person-page-001/person-page-permission-tests.mts
DATABASE_URL=... node --import tsx --conditions react-server .../person-page-readpath-tests.mts
```

（`--conditions react-server` 满足 `server-only`/`react.cache`；本地需 `node_modules/server-only` stub 或经 Next 运行时。）

2026-08-16 复跑结果（overrideAccess: false 走真实访问控制）：

- PASS 成员 A 直写成员 B 的 Person 被拒。
- PASS 成员直写本人 `verdict`/`verdictEs`/`editorialBio`/`editorialBioEs`：请求被接受但字段被剥离，存储值不变（Payload field-access 语义）。
- PASS Editor 写判词与编辑传记（正例）；成员自管 `nameZh`/`quote`/`canHelpWith` 持久化（正例）。
- PASS 匿名按 id 读 draft Person 被拒；匿名列表与其他成员视角均不含 draft Person（新字段不泄露）。
- PASS 公开读路径：draft 不可见→发布后 EN 映射（hanziName/epithet/bioThirdPerson/quote/canHelpWith/discordLine）逐项断言；ES 用 es 值、缺失回退 EN，discordLine 西语句式。
- PASS 空白 ES 判词、引语与帮助条目按缺失处理并回退 EN。
- PASS 编辑传记内未获公开批准的 Media 不进入匿名 read model；Editor 批准后只保留公开图像字段，owner、审批字段与嵌套用户不序列化；People client 目录不接收 richText。

## 常规验证

- `npm run typecheck`、`npm run build` PASS（Next.js 16.2.12，77 routes/pages）；`npm run lint` 0 error、48 warning（migration 签名模式，Person migration 占 4 条）。
- `payload generate:types` 与 `generate:importmap` 已再生成（importMap 仅注册顺序变化，因 People 新增 richText）。

## 浏览器主流程与修复（2026-08-16）

- Local scratch 数据库使用虚构 Member/Person/Media；Member 登录 My profile 后更新本人引语与「我能帮什么」，保存成功；编辑传记与判词保持不可编辑。
- EN Person 页在 1440×1000 正确读回姓名、汉字侧签、引语、帮助条目、判词、编辑传记与 Discord 联系行；空作品区不渲染，横向溢出为 0。
- ES Person 页在 390×844 使用西语 identity、引语、帮助条目与 Discord 句式；缺失的判词和编辑传记回退 EN，窄屏汉字侧签隐藏，横向溢出为 0。
- People 索引在桌面与 390px 均显示 `判词 — 姓名` 名录行及最近作品边界，无横向溢出。
- Discord 从页首普通 links 排除，只保留页底成员主语联系行；源码断言与修复后 build PASS。
- 发现公开 Person 的 Member 表单未注册隐藏 `profileStatus`，动作区误显示 `Draft / Publish profile`。`ProfileActions` 现从表单值回退到 Payload `data/initialData`；同一浏览器会话读回为 `Public / Make private`。

## 最终独立复审

2026-08-16 对冻结合同、实现 diff、权限/读路径脚本、含 Discord 数据的隔离 migration recovery、桌面/390px 浏览器证据及修复后 build 完成唯一一轮独立复审：PASS，未解决 P0/P1/P2=`0/0/0`。未改 Agent、Article、Home、Production 数据或 Production schema。

## 剩余发布门

1. Preview：在受保护、noindex 环境以虚构数据 apply migration，复跑 Member/Editor/匿名 EN/ES 主流程与 rollback drill。
2. Production：单独批准 backup、deploy、migration apply、公开读回与恢复点；本地验证未连接或改写 Production。
3. merge/push 由父级编排；本分支未 merge、push 或 deploy。Preview/Production 门完成后再归档 checklist。
