---
doc_contract: DocContractV1
doc_type: reference
authority: evidence
status: accepted
scope: member-publishing-curation-architecture-audit
last_verified: 2026-07-28
max_lines: 240
change_id: PUB-CURATION-001
---

# Member Publishing And Editorial Curation Architecture Audit

日期：2026-07-28。范围：Production 公共页面、Article/Person schema、权限 hooks、工作流、公共 loader、路由和现有产品文档。本文记录当前事实与差距，不授权代码、migration 或 Production 动作。

## Accepted Product Truth

1. Contributor 就是铲子计划 Member，也是 People 中的真实人物。
2. Member 发文后可以直接在自己的公开空间出现，不提交、不申请、不等待站方批准。
3. 站方从成员已公开内容中选择一部分，在同一 Article 上编辑、核对、分类和扩大分发。
4. 策展后仍是同一篇文章、同一原作者；Editor 是修改 actor，不是公开 byline。
5. 读者路径必须成立：站方入口 → Article → 原作者 → Person → 外部链接。

## Executive Finding

当前公共视觉大体符合“内容把人带出来”的方向；Article 和首页已经把 Ge Xu 作为明确作者，Person 页也具备头像、身份、地点和外链位置。前端无需推倒重做。

当前后台状态机和公共数据读取不符合新逻辑，属于架构级差距：系统只有一个“Editor 批准后 Public”的状态，任何 Public Article 又自动同时进入个人页与全部官方栏目。要实现产品真相，必须重构状态、权限、loader、路由和 Member/Editor 操作面。

## What Already Fits

| 现有部分 | 结论 |
|---|---|
| Article 是单一 collection | 可继续承载“一篇文章”，`author` 与 `owner` 已分离（`Articles.ts:99-113`） |
| translation group | 英西独立记录可以保留，不会强迫同语言复制成员版/官方版 |
| 版本与 workflow event | 可改造成同 Article 编辑审计，不需要另建官方副本 |
| Article detail | Production 已在标题近处显示头像、`Written by Ge Xu` 和 Person 链接 |
| Home | Lead、Selected、Latest 均显示作者或作者入口，视觉上支持人物导流 |
| Person | 已显示头像、身份、地点、介绍、内容区域和外链区域 |
| People 规模机制 | Spotlight、筛选、分页与稳定轮换可继续使用 |

浏览器证据：[`Article`](assets/member-publishing-curation-audit/01-article.png)、[`Person`](assets/member-publishing-curation-audit/02-person.png)、[`Home`](assets/member-publishing-curation-audit/03-home.png)。截图仅证明当前外显结构，不证明后台状态或权限。

## What Is Wrong Today

### P0 — Publication and curation are one state

- `workflow.ts:5-35` 只有 `draft / submitted / in_review / changes_requested / approved / public / archived`。
- `workflow.ts:56-58` 明确禁止 Author 公开并要求 editorial confirmation。
- `article-hooks.ts:177-195` 让 Author 在提交后只读，并只允许 Editor 进入 public。

结果：成员无法自主公开；站方策展被误当成发布许可。

### P0 — Every public article is treated as official editorial content

- `access.ts:36-52` 用一个 `workflowStatus=public` 定义匿名可读。
- `cms.ts:174-190` 只建立一份 `findPublishedArticles`。
- `cms.ts:237-243,263-276,307-319` 用同一列表生成 Guides、Stories、Home、Person 和 taxonomy。

结果：当前系统无法表达“个人已公开、站方未策展”。只要公开，就会混入官方栏目；不公开，又无法出现在个人页。

### P0 — Format controls identity URL

- `cms.ts:393-395` 根据 `format` 生成 `/stories/[slug]` 或 `/guides/[slug]`。

结果：Editor 把同一 Article 从普通文章改为 Guide 时可能改变 canonical，与“策展不制造新文档、外部链接持续有效”冲突。

### P1 — Member editing is a submission workflow

- 新建 Article 被强制设为 draft（`article-hooks.ts:107-110,156-165`）。
- Author 只能在 draft 或 changes requested 编辑（`article-hooks.ts:177-185`）。
- 当前操作面只有 Submit/Resubmit，Editor 才有 Approve/Publish。

结果：后台要求成员理解站方审核状态，不能专注于写作和个人页面。

### P1 — Personal page uses the wrong archive boundary

- Person page调用 `getPublishedCMSPersonArticles`（`people/[slug]/page.tsx:25-62`）。
- 该函数仍过滤同一份 Editor-public 列表（`cms.ts:307-309`）。

结果：个人页无法展示成员已经公开但未被站方选择的内容，也无法同时表达“站方精选”和“全部文章”。

### P1 — Profile ownership is still review-gated

- `people-hooks.ts:49-64` 禁止 Member 修改已经公开的 Person，并要求 editorial approval。

结果：成员配置个人介绍、头像、地点和外链仍依赖 Editor，与个人页作为成员长期公开空间的目标冲突。

### P1 — Personal publishing inherits official editorial gates

- `Articles.ts:120-135` 强制每篇 Article 至少一条来源和内部 Check。
- `article-hooks.ts:57-85` 对任何 public Article 强制批准封面、来源、Guide freshness、作者头像与资料批准。

结果：站方 Guide 需要的严谨门槛被错误施加给所有成员文章，直接发文会受到大量无关字段阻塞。

### P1 — Account role is too rigid

当前 User 单角色思路把 Author、Editor、Super Admin 当成互斥身份；产品实际需要“公开 Person 身份”与“站方权限”组合。Editor 或 Super Admin 也可能是铲子计划成员并以自己的 Person 发文。

## Target Read Model

| 页面/入口 | 读取条件 | 署名 |
|---|---|---|
| Article stable detail | Member Published | 原 Person |
| Person complete archive | Member Published + author match | 原 Person |
| Person site-selected section | Member Published + Curated + author match | 原 Person |
| Home/Stories/Guides | Member Published + Curated + 对应站方分类 | 原 Person |
| Topic/Place/Purpose | Member Published + Curated + 对应关系 | 原 Person |
| Draft/Withdrawn | 仅 owner 与授权站方 | 不公开 |

## Target State Rules

- Member publication：Draft、Published、Withdrawn。
- Editorial curation：Not selected、Selected、Editing、Curated、Needs recheck、Removed。
- Editor Remove 不影响个人公开；Member Withdraw 同时影响两处。
- Member 更新 Curated Article 后，Article 仍是同一 ID，个人页公开最新版本，官方入口暂时撤出并等待 recheck。
- Editor 所有修改进入版本与 actor 审计；`author` 关系不可被策展动作替换。

## Frontend Impact

| 区域 | 是否大改 | 需要做什么 |
|---|---|---|
| Home/Stories/Guides | 否 | 保留视觉，loader 改为 Curated-only，链接稳定 Article route |
| Article detail | 小改 | 保留强署名；增加克制的 site-selected 语义与稳定 canonical |
| Person | 中改 | 展示全部个人公开内容，并区分站方精选；外链保持显眼 |
| People | 小改 | 合格池改用 Member Published；推荐仍不等于策展所有文章 |
| Member Admin | 大改 | My work、My profile、直接 publish/update/withdraw，移除提交审核 |
| Editor Admin | 大改 | 公开候选、同文档编辑、分类、Curated/Removed/Needs recheck |

## Migration Impact

- 新增两轴状态和组合权限字段；替换现有 workflow 转换与 Profile revision gate。
- 把现有 Ge Xu 英西 Article 原地映射为 Member Published + Curated；保留 Article ID、author、translation group、正文、媒体、时间和历史。
- 拆分个人与官方 loaders；不复制 Production 内容。
- 固定不随 format 改变的 Article canonical；现有 `/stories/...` 与 `/guides/...` 永久兼容。
- 重写权限与测试，覆盖同 ID、同 author、未策展不进官方、Removed 仍个人公开、Needs recheck 和 Withdrawn。

## Misunderstandings Corrected

- “发布”曾被当成站方批准；实际包含成员个人公开和站方策展两个决定。
- “Editor”曾被当成作者的发布许可人；实际主要是官方分发的策展者。
- “Public Article”曾被当成官方内容；实际个人公开内容可以不进入任何站方栏目。
- “编辑改写”曾隐含生成另一个官方文档；实际必须在同一 Article 上版本化。
- “角色”曾把人物身份与权限绑定；实际 Person 与 Editor/Super Admin 能力可以组合。
- “作者资料审核”曾成为日常个人页维护前置；实际成员应直接维护，站方保留安全暂停和审计。

## Audit Conclusion

公共前端的信息层级和人物感可以保留，尤其是 Article 近标题署名、Person 主页和首页作者链接。真正需要大改的是 CMS 领域模型与读路径。不能在旧投稿工作流上增加一个“自动批准”按钮；必须用两轴状态、同 Article 编辑、固定原作者和个人/官方两套 read model 重建。
