---
doc_contract: DocContractV1
doc_type: checklist
authority: execution
status: completed
scope: member-publishing-curation-closure
last_verified: 2026-07-29
max_lines: 300
change_id: PUB-CURATION-001
risk_tier: upgraded
validation_profile: phase_release
allowed_paths: .github/workflows/**, package.json, package-lock.json, apps/web/**, DESIGN.md, docs/README.md, docs/product-brief.md, docs/operational-publishing-requirements.md, docs/current-state.md, docs/roadmap/README.md, docs/roadmap/checklists/README.md, docs/roadmap/checklists/member-publishing-curation-closure.md, docs/archive/README.md, docs/archive/member-publishing-curation-closure.md, docs/decisions/**, docs/reference/README.md, docs/reference/implementation/**
approval_gates: checklist-commit, product-code, dependency-install, database-schema, migration, transactional-email, real-account, production-deploy, public-routing
---

# Member Publishing And Editorial Curation Closure

目标：把当前“Author 投稿、Editor 审核后统一公开”的实现改成“Member 直接公开自己的内容、站方在同一 Article 上策展并分发”，同时保留原作者署名、人物主页和外链流量链路。

## Scope

- 将公开状态拆成 Member publication 与 Editorial curation 两条独立状态轴。
- Member 直接维护并公开自己的 Person 与 Article；Editor 在同一 Article 上选择、编辑、核对、分类、策展和移除分发。
- 官方页面只展示 Curated 内容；Person 页展示作者全部 Member Published 内容。
- 固定 Article 身份、作者和 canonical，不因 Story/Guide 分类改变而生成副本或失效链接。
- 重做 Author/Editor 后台任务入口、权限、媒体与来源门槛、通知和审计。
- 安全迁移现有 Production User、Person、Article、Media、translation group、URL 与 workflow history。

## No-go

- 不建设第二套 CMS，不更换 Payload、PostgreSQL、Blob、Resend 或 Vercel。
- 不复制 Article 形成“成员原文”和“站方编辑版”；不把 Editor 或站方改成公开作者。
- 不把未策展成员文章混入 Home、Stories、Guides、Topics、Places 或 Purpose。
- 不引入公开注册、社交关注、支付、私信、排行榜、自动翻译、个性化推荐或 CRM。
- 不重做已经符合人物导流目标的公共视觉系统；只改必要的数据边界、路由、状态和外显关系。
- 不批量邀请真实成员，不自动修改真实正文，不因部署自动公开、撤回或策展内容。

## Upgraded Boundaries

- `data_truth`：Local/Preview 只用 `.test` 账户与虚构内容；Production 数据不从 Preview 复制。
- `read_path`：匿名个人内容只读取 Member Published；官方入口只读取 Member Published + Curated；Draft、Withdrawn 与其他 Member 私有字段不得泄漏。
- `write_path`：Member 只能写自己的 Person/Article；Editor 可编辑与策展全部候选；author、owner、actor 和状态转换由服务端确定。
- `attribution`：任何 Editor 改动后 `author` 仍为原 Person；审计 actor 与公开 byline 分离。
- `identity`：同一语言创作始终只有一个 Article ID；版本、策展与重分类不产生第二条公开记录。
- `recovery`：Production migration 前备份；验证 apply、rollback/reapply、旧 URL、数据计数与现有英西内容恢复。
- `independent_review`：非主持实现者用 Member、Editor、Super Admin、anonymous 四个身份复核状态、署名、重复记录、路由与流量链路。

## Work

- [x] 产品负责人批准并提交本 checklist，替代旧 `OPS-CLOSURE-001` 文档草案，建立代码改动 HEAD 基线。
- [x] 固定两轴状态、组合权限、同文档编辑、署名、路由与版本规则；对公共稳定详情路由和旧 `/stories`、`/guides` 兼容方案形成 migration-ready decision。
- [x] 设计 schema 与 migration：Member publication、curation state、curated fields/timestamps、recheck、组合权限；保留 translation group 与现有审计。
- [x] 重写服务端权限与 hooks：Member 可直接公开/更新/撤回本人 Article，Editor 可策展同一 Article，author 不可被替换，Member 更新触发 Needs recheck。
- [x] 重做 `My work`、Article editor 与 `My profile`：聚焦本人内容、自动保存、预览、直接公开、撤回和外链配置；删除 Submit/Resubmit/等待审核流程。
- [x] 重做 Editor 候选与策展面：Not selected、Needs recheck、Selected/Editing、Curated、Removed；在同一 Article 上编辑、核对、分类和排期。
- [x] 拆分公开 loaders：Person archive 读取全部 Member Published，官方 Home/Stories/Guides/Topics/Places/Purpose 只读取 Curated。
- [x] 固定 Article canonical 与旧 URL 永久兼容；更新 metadata、sitemap、locale alternate 和错误语言行为。
- [x] 在 Person 与 Article 上完成 `官方入口 → Article → 原作者 → Person → 外链`，并给 Curated 内容提供克制的站方选择标记。
- [x] 拆分个人发布和官方策展的媒体、来源、封面、Freshness 与 SEO 门槛；Member 上传权限和匿名隔离保持服务端有效。
- [x] 修复独立复审 BLOCK：普通 API publication/profile/`_status` 状态绕过、未公开 Person 的假公开 Article、站方字段伪造、未策展内容从 Home/People 泄入站方入口、Person 版本/预览缺失、危险动作无确认和两轴回退语义损坏。
- [x] 在代码基线 `8956ee7` 完成本地 core 双重独立复审：产品/UX与技术/权限/migration 均 `PASS`，两边 `P0/P1/P2 = 0/0/0`。
- [x] 更新邀请、组合权限、通知、审计与后台直达关系；Editor/Super Admin 关联 Person 后也能作为 Member 发文。
- [x] 用虚构数据完成状态矩阵、同 Article 断言、署名断言、双语隔离、桌面/移动和无障碍验证。
- [x] 在临时 PostgreSQL 完成 migration apply、rollback/reapply、旧 Production 形状恢复和旧 URL 兼容测试。
- [x] 完成 Preview release candidate 和非主持独立复审，修复至 PASS。
- [x] 取得用户对后续操作的整体明确批准；建立 migration 前恢复点后把现有 Ge Xu 英西 Article 原地迁移为 Published + Curated，以候选态验证后 promote Production 并回读。
- [x] 验收 Editor/Super Admin 作为作者的完整登录、个人页、新建、预览、公开、更新与撤回旅程。
- [x] 固定双语 Person 产品决定并实现 English/Spanish 资料编辑与公共页面选择/fallback。
- [x] 把 Editor 默认入口收敛为 Needs attention 任务收件箱，保留语言、负责人、最后动作与下一动作信息；全量 Articles 降为次级入口。
- [x] 把头像、封面和外链变成页面内高频任务：上传/替换/删除、类型、URL 校验、排序与预览均可理解。
- [x] 固定自动保存状态、失败恢复、离页保护、并发锁定与版本恢复合同并验收。
- [x] 在真实 Person 上建立至少一个明确属于作者本人的外部渠道，完成官方入口到作者外链的 Production 点击闭环。
- [x] 把 My profile 设为持久导航入口，并让语言切换直接输出目标语言 canonical URL。
- [x] 修复最终 UX 独立复审的 `P1=6 / P2=2` 至 `P0/P1/P2 = 0/0/0`。
- [x] 完成最后一轮 Production schema/data/deploy/readback 与恢复点验证。
- [x] 写回 current、decision 和 implementation evidence，归档本 checklist。

## Closure

- GitHub Preview checks run `30388465174` 在全新 PostgreSQL 上完整 PASS。
- 首轮 Production migration 后为 33 张表、10 条 migration；真实实体计数保持 users/people/articles/media/workflow events `1/1/2/2/8`，身份与翻译不变量异常均为 0。
- 首轮 Production deployment `dpl_2gJFdjQEQ9kfyzYqRdUmnDKFJh5y` 先以候选态完成真实内容、桌面、390px、英西、后台和日志复验，再 promote 到 `chinainfact.com`。
- migration 前 backup run `30384139368` 与 migration 后 run `30389201732` 均完成不可变上传、SHA 读回、隔离恢复和 schema/count/media 断言。
- 技术/权限/migration 最终 Production 独立复审 `PASS`，`P0/P1/P2 = 0/0/0`；上一 Production deployment 在 10-migration 数据库上保持兼容，数据恢复点也已验证。
- 最终 Preview `dpl_57WuvghzZvvP39yvX11tzYdDBViM` 在 `31f38c9` 上集中验证 Editor 起稿、Writing/Site 聚焦、My profile、双语 Person、Purpose/Place/Article 语言 canonical、保存失败重试、重试期间继续输入、390px 与无障碍；临时草稿全部清理。
- 本地集中验证 `typecheck / lint / build / editorial / migration recovery / diff check` 全部通过；lint 只有生成 migration 的 40 条既有 warning。Preview 与 Production 均为 33 张表、12 条 migration。
- 产品/UX与技术/权限/migration 两位独立 reviewer 最终均 `PASS`，两边 `P0/P1/P2 = 0/0/0`。
- Production 候选 `dpl_BXJNsTa28fwmMqcxt9k22VbCJoWb` 完成英西首页、Person、Article、后台登录页、robots、sitemap、390px 与 100 条日志零 error/5xx 后 promote 到 `chinainfact.com`。
- 最终恢复 run [`30395828366`](https://github.com/lonelyreader/chinaknowledge/actions/runs/30395828366) 在 `31f38c9` 上完成 R2 不可变上传、读回、隔离恢复、33/12/12/8 断言与媒体核验。

## Acceptance

- Member 可在 My work 新建、预览、直接公开、更新和撤回本人 Article；UI 与 API 均不存在强制投稿审核。
- Member 可直接维护自己的 Person 与外链；其他 Member 无法读取或修改其草稿和后台字段。
- 个人公开 Article 立即拥有稳定详情页并进入作者 archive，但在未 Curated 时不会进入任何官方聚合入口。
- Editor 在原 Article ID 上完成选择、编辑、核对、分类和 Curated；记录总数不增加，公开 byline 始终为原 Person。
- Editor 移除策展只影响官方分发；Member 撤回影响个人和官方两处。
- Member 修改 Curated Article 后自动 Needs recheck 并退出官方入口，个人页仍显示同一 Article 的最新公开版本。
- Person 页清楚展示全部个人公开内容、站方精选关系和外部链接；从 Home/Stories/Guides 到作者外链的完整点击路径成立。
- 英西记录分别决定个人公开与策展，共享 translation group 和作者；草稿不会进入 alternate 或 sitemap。
- 现有 Production 英西 Article、Person、Media、历史审计和旧 URL 在迁移与部署后保持，无副本、无署名漂移。

## Validation

- schema diff、migration apply、rollback/reapply、Production-shape restore fixture、Article ID/count 与 author invariants。
- Member / Editor / Super Admin / anonymous 权限矩阵；跨成员读写、author 替换、非法策展、非法撤回和草稿泄漏负例。
- 两轴状态全转换测试，特别覆盖 Removed、Withdrawn、Needs recheck 与再次 Curated。
- 个人 archive 与官方入口 read-model 测试；Home/Stories/Guides/Topics/Places/Purpose 不混入未策展内容。
- stable canonical、legacy redirects、locale alternate、metadata、sitemap 与分享链接测试。
- 桌面与 390px 移动端 Member 发文、个人页配置、Editor 策展和公共流量链路浏览器验证。
- 人工扫描新增可见文字，遵守 `DESIGN.md` copy gate；无说明性后台长文案。
- `npm run lint`
- `npm run typecheck`
- `npm run test:editorial`
- `npm run test:migration-recovery`
- `npm run build`
- `npm run governance:check`
- `git diff --check`

## Writeback

- 稳定产品合同：`docs/product-brief.md`、`docs/operational-publishing-requirements.md`、`DESIGN.md`
- 当前真实能力：`docs/current-state.md`
- 当前实现差距与验证证据：`docs/reference/implementation/`
- 长期状态、路由、权限决定：`docs/decisions/`
- 当前执行：本 checklist 与 `docs/roadmap/README.md`
- 完成历史：`docs/archive/member-publishing-curation-closure.md`

## Approval Gates

- `checklist-commit`：提交文档基线后才开始产品代码。
- `product-code / dependency-install / database-schema`：分别确认；无必要不增加依赖。
- `migration`：Preview 与 Production 分别批准，Production 前必须有恢复点。
- `public-routing`：canonical 与永久重定向通过 Preview 验证后单独批准。
- `transactional-email / real-account`：只对虚构或明确授权目标执行。
- `production-deploy`：独立复审 PASS 后单独批准；部署不自动迁移、邀请或改变真实内容状态。
