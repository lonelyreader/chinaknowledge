---
doc_contract: DocContractV1
doc_type: reference
authority: evidence
status: active
scope: production-public-product-audit
last_verified: 2026-07-28
max_lines: 220
change_id: PROD-LAUNCH-001
---

# Production Public Product Audit

## Verdict

受保护 Preview 与不绑定正式域名的 staged Production 均为 `PASS`，最终独立复审 P0/P1/P2 均为零。审计开始时公共产品仍是 P1 fixture 原型与单篇 Guide CMS 证明的组合；修复候选在 `4125230` 提交，本地两轮非主持独立复审关闭 5 个 P1、3 个 P2，Preview 又补齐人物规模与跨周/跨年轮换。产品负责人批准首篇内容后，Production 已公开首位 Person 和首篇英西双语 Analysis；文章页、Stories 列表、人物贡献页、原创封面和双向 canonical 跳转均已回读。正式域名、匿名公开面复验、Place 与索引仍未执行。

## Findings At Audit Start

1. 首页、Stories、Places、People、人物页无条件读取 `src/content/fixtures.ts`；`CMS_READ_MODE=cms` 只影响 Guides。
2. CMS 只有 Guide 公开 loader。Reporting、Analysis、First-person、Update 即使标为 Public，也没有 Stories 详情页；People 和 Places 同样没有 CMS 公共读取。
3. 首期合同中的 `/stories/[slug]`、`/places/[slug]`、`/purposes/[slug]`、`/topics/[slug]`、`/about` 尚不存在。本地路由回读均为 404。
4. Places 已由 ADR-0003 固定为一等对象，但 CMS 没有 Places collection，Article format 也不能表达 Place。
5. People schema 没有 portrait；Article `coverImage` 可空且公开 Guide 不读取它。CMS Guide 仍使用 fixture portrait 与 Shanghai fixture image。
6. 首页没有 lead 排期、推荐池、到期回退、Latest/Recently updated 生成逻辑；People Spotlight 实际为 `people.slice(0, 3)`，没有周稳定轮换、排除、置顶或曝光约束。Article schedule publish 被关闭。
7. 公开门禁允许 cover、Freshness 和 Sources 缺失；确认界面只显示 `Not set`。CMS Guide 缺 Freshness 时会显示硬编码日期 `2026-07-27`。分类依产品合同允许为零，不列作强制发布项。
8. Author 可直接更新已公开 Person 的简介、slug、Topics 和外链，没有人物草稿、复审、版本或同意审计；这与隐私页的编辑审核和作者批准承诺不一致。
9. Article `owner` 与公开署名 `author` 没有关联校验；Author 可以提交署名为其他 Person 的内容。
10. 语言切换只替换 URL locale，不按 `translationGroup` 找到另一语言 slug。People Language 筛选没有任何过滤或导航行为。
11. Production 仍为零用户；只有 Super Admin 能创建账号，但 checklist 把真实账户放在 staged deployment 前，且没有首位管理员初始化、邀请或批量开户闭环。
12. CI 使用 `CMS_READ_MODE=fixtures` 构建；editorial test 只证明单篇 Guide。现有检查不会验证 Production 首页、Stories、Places、People、真实媒体或双语跳转，因此此前全部通过并不能证明公开产品可运营。

## Contract Conflicts

- `DESIGN.md` 禁止把文章正文作为硬编码 Production 内容，但 Production 公共页面仍引用 fixture。
- `product-brief.md` 要求四个稳定对象、首期详情路由、真实 portrait、cover、来源、发布时间、Freshness、首页混合编排和 People 分层发现；现有 schema 与公共路由只覆盖其中一部分。
- `P1-EDITORIAL-001` 明确只用一位虚构作者和一篇 Guide 证明工作流，不应被解释为全站 CMS 接入完成。
- `PROD-LAUNCH-001` Scope 已要求替换公开 fixture，但 Work 从基础设施直接跳到真实数据，缺少公共产品闭环实现与验收项。

## Verified Healthy Boundaries

- 公共产品候选、人物规模与跨年轮换修复已提交为 `4125230`、`31a7988`、`5964da7` 与 `3be99c6`；最终 deployment 绑定 clean HEAD `2ec2aeb`，meta 没有 `gitDirty`。
- 审计开始时 Vercel 只有 Ready Preview 与一条 Error Production；当前最新 staged Production 为 `dpl_3MGyKkPpepboeuhoXc8V1nJVS55b / READY / target: production`，`chinainfact.com` 仍没有项目 alias。
- Production 已有首位 Super Admin、1 张本人授权头像与 1 个真实 Person 草稿；Article、Place 和公开页面内容仍为空，没有内容公开事故。
- `governance:check`、lint、typecheck、environment、Newsletter 和 Preview storage tests 通过；lint 只有 20 条 Payload 自动生成 migration 的 unused-argument warnings。
- Newsletter、环境守卫、数据库与媒体备份恢复不是本轮发现的失败面。

## Local Remediation Status

以下改动从提交 `4125230` 开始形成，并已在受保护 Preview 和 staged Production 验收：

- 已关闭：`CMS_READ_MODE=cms` 下首页、Stories、Guides、Places、People、人物页不再读取 fixture；补齐 Story、Place、Purpose、Topic 与 About 详情路由。
- 已关闭：公共内容使用 CMS portrait/cover；Guide 不再伪造 Freshness；公开门禁要求 cover、Sources、Guide Freshness、人物 portrait 与作者批准记录，并在首次公开时记录 `publishedAt`。
- 已关闭：Author 署名必须属于自己的 Person；人物公开要求真实公开贡献，匿名 API 不返回账户、人物状态或批准时间。
- 已关闭：错误语言 slug 会按公开 `translationGroup` 跳到目标语言 canonical slug；People 搜索、Topics、Places、Language 和分页使用真实数据。
- 已关闭：首页可在无人每日排序时按发布时间自动回退；People 使用按周稳定轮换，不在刷新时随机变化。
- 已关闭：首页 lead 与推荐池支持生效/到期窗口；无有效配置时回退最新合格内容。Spotlight 支持最多一人临时置顶、排除和在人物池足够时避开上周入选者。
- 已关闭：Place 作为独立编辑节点保存名称、简介、封面、语言/翻译关系和对应 Geography；相关 Stories、Guides 与 People 从同语言公开内容自动生成，无相关公开内容时不能公开。
- 已关闭：Preview CI 改为临时 PostgreSQL + 全量 migration + editorial integration + CMS build/runtime smoke，覆盖 Guide、Story、People、人物页和双语跳转。
- 已关闭：Profile revision 保存作者完整资料快照；Author 只能维护自己的 Draft/Changes requested 并提交，Editor 只能要求修改或整体应用，不能静默改写提案。数据库唯一键保证每人至多一条开放修订，更新事务先锁定并核对当前 revision，避免并发 Apply/Changes requested 造成 Person 与审核状态分叉；应用记录不允许通过 collection access 删除。
- 已关闭：Media 增加 Editor 公开使用批准；上传归属由服务端无条件写入，不能由 Author 伪造。Payload/API 和 Payload 文件路由内，未批准记录只对真实上传者与编辑角色可见；Article、Person 与 Place 公开时校验实际媒体记录。底层 public Blob URL 不受这层权限保护，敏感文件继续禁止进入该 collection。
- 已关闭：首位 Super Admin CLI 在锁定事务内执行零用户检查与创建；批量开户默认 dry-run，只允许 Author/Editor，账户写入为单事务，邮件阶段逐项汇总并支持失败后重发。所有 apply 明确声明应用环境和数据库目标，Production 另有专属确认且强制密码重置邮件。
- 已关闭：受保护 Preview 的完整公共路由、人物规模、桌面/移动分页与筛选、基础可访问性、运行日志与 release-level 独立复审。
- Production backup workflow 已在 commit `8cef12e` 从 23/1 收紧为 29/5，并以迁移前 run `30339027394` 与迁移后 run `30339406235` 跨越升级；没有留下接受两种 schema 的长期宽松断言。

## Media Storage Boundary

- Vercel 官方把 public store 定义为“任何拿到 URL 的人都可读”，private store 必须经 Function 鉴权读取；两种 store 不能事后互换。[Vercel Blob](https://vercel.com/docs/vercel-blob)
- Vercel Private Blob 已于 2026-06-30 GA，但当前项目锁定的 `@payloadcms/storage-vercel-blob@3.86.0` 类型和客户端实现仍只接受 `access: 'public'`。[Vercel GA](https://vercel.com/changelog/vercel-private-blob-is-now-generally-available)
- Payload 官方 adapter 会保留 `/api/media/file/...` 路径并在读取时执行 collection access；本次匿名隔离依赖这层能力，但它不能把底层 public Blob 变成机密存储。[Payload Storage Adapters](https://payloadcms.com/docs/upload/storage-adapters)
- 结论：当前 Media 可以承载“待编辑批准、最终准备公开”的图片，不能承载证件、合同、未获授权的人像原件或其他敏感文件。真正私密媒体不是本次上线需要，后续若出现需求再建立第二个 private collection/store。

## Local Verification Update

- 空 PostgreSQL 16 完整应用 5 条 migration 后为 29 张 `public` 表；Profile revision 并发双创建只有一条成功，并发 Apply/Changes requested 只有一个状态提交且 Person 与最终状态一致；伪造媒体上传者被服务端覆盖。匿名与跨 Author 媒体隔离、未批准媒体发布、作者/编辑越权、公开版本保持与整体应用负例均通过。
- `migrate:down` 按最新到最旧完整回滚 5 条 migration 后重新应用并复测通过。Payload 3.86 的 `migrate:reset` 会按错误顺序执行 down，本项目发布与恢复流程禁止使用该命令。
- 账号工具先在独立空库完成两次并发首位管理员 apply，结果严格为一次成功、一次非空库拒绝、最终仅一名用户；2 人批量写入、重复运行、目标环境缺失拒绝和密码重置重发也以虚构 `.test` 账户验证。随后经单独授权在 Production 建立首位 Super Admin，回读 users=1、super_admin=1；未建立其他真实账户。
- CMS production build 后以 1440px 与 390px 浏览器逐页验证 Home、People、Person、Story、Place 和西班牙语 Home：状态均为 200，无 console/page/network error、横向溢出、损坏图片、无名交互控件或缺失 form label；英语/西班牙语 `html lang` 已分别回读为 `en / es`。证据截图：[`desktop home`](assets/production-public-closure/desktop-home.png)、[`mobile home`](assets/production-public-closure/mobile-home.png)、[`mobile people`](assets/production-public-closure/mobile-people.png)。
- 非主持独立复审首轮提出 5 个 P1 与 3 个 P2；并发唯一性、事务锁、生产失败关闭、媒体归属、批量写入/邮件摘要、Blob 表述和审核记录保留全部修复。第二轮只读复审 `PASS`，P0/P1/P2 为零。
- Preview migration 前 custom dump 的 SHA-256 为 `b6dd68dd45e5b0bfe1517a873cfeced0e5672044f61a865019b827600619a89f`；隔离恢复回读与原库一致，均为 23 张表、1 条 migration、3/1/2/1 个虚构 User/Person/Article/Media，临时恢复库随后删除。
- 四条新增 migration 依次成功，读回为 29 张表、5 条 migration；`places`、`person_revisions`、开放修订唯一索引和媒体公开批准字段均存在，原有记录数量在迁移后未变。纯虚构 editorial workflow 随后 `PASS`，当前形成 31 个账户、27 个人物、30 篇文章、4 个媒体记录、3 个地点、1 条已应用人物修订和 130 条 workflow event。额外 24 个固定 `.test` 账户、人物与公开贡献专门用于规模验收；没有写入真实个人或正式内容。
- 最终受保护 Preview `dpl_AZaJ5DPimMSjq2NakcciToVAvVrL` 为 `READY / target: null`，绑定 clean HEAD `2ec2aeb`。英语/西班牙语 Home、People、Person、Guide、Story、Place、Purpose、Topic 与 About 在 1440×900 和 390×844 均有有效 `main / h1 / lang`，无横向溢出、破图、缺失控件名称或 console error。People 读回 25 个合格人物：桌面 24/页、移动 12/页，翻页、姓名、Topic、Place 与 Language 筛选均通过；同周稳定、跨周与跨年边界轮换断言通过。授权健康检查为 200，`robots.txt` 为 `Disallow: /`，页面响应带 `x-robots-tag: noindex, nofollow, noarchive`，匿名访问进入保护层。唯一运行 WARN 是 Preview 故意不配置邮件适配器时 Payload 的 console-email 提示；Preview 不发真实邮件，因此不阻断。
- release-level 第二轮独立复审 `PASS`，P0=0、P1=0、P2=2。两个 P2 留给 staged Production：确认 Production 邮件适配器下不再出现上述 WARN；补键盘顺序、焦点可见性与自动化 accessibility/contrast 检查。
- Production pre-migration custom dump SHA-256 为 `8f15405f26c05d585aa1a28059fc58785a0fc508b7a2b30f23ac8d11a3d0f455`，本地隔离恢复与 live 均为 `23,1,0,0,0,0,0`；run `30339027394` 同时完成 R2 迁移前恢复。其余 4 条 migration 全部成功，最终 live 为 29 张表、5 条 migration、8 张关键表、五类业务数据均为 0；run `30339406235` 的 `production.dump: OK`、29/5/5/8 隔离恢复与零媒体清单均通过。
- staged Production `dpl_DvSJVxiPcpAGfrhWk3GcSW92tcCp` 为 `READY / target: production / iad1`，绑定 clean HEAD `d95e2b1`，使用 `--skip-domain`，正式域名未绑定；匿名请求进入 SSO，授权 `/api/health` 与 `/en` 为 200，响应和 robots 均为 `noindex`。
- 首轮 Production accessibility 发现空内容首页没有 `h1`、`--stone` 可见文字对比度为 4.39:1；提交 `d95e2b1` 将空首页 Newsletter 标题提升为唯一 `h1`，并以最小幅度将 `--stone` 调整为 `#6b6c66`。最终桌面 1440×900 自动检查为零 contrast failure、零可见无标签控件、逻辑 tab order 和全局 3px `:focus-visible`；移动 390×844 无横向溢出、破图、overlay 或 console error。Production runtime 没有 `No email adapter` 告警或 5xx，两个 P2 均关闭。
- 最终非主持独立复审重新回读部署/HEAD/区域、SSO/noindex、授权健康检查、29/5 空库、两次恢复、桌面/移动和可访问性；浏览器只有扩展自身的 listener/message-channel 噪声，没有应用来源错误。结论 `PASS`，P0=0、P1=0、P2=0；复审未编辑文件、写 Production、绑定域名或执行公开动作。
- 首位管理员创建后的真实密码重置请求虽然成功发信，但邮件使用 `admin/reset/...` 相对地址，浏览器将 `admin` 当作主机名并报 `ERR_NAME_NOT_RESOLVED`。根因是 Payload 未配置 `serverURL`，请求 origin 又未进入其可信来源回退。提交 `bd35454` 增加 `PAYLOAD_PUBLIC_SERVER_URL` 的 Production HTTPS origin 校验并传入 Payload；最新 deployment `dpl_4QkjZptx6L5LGspiS61nDMWNLFHL` 为 READY，环境检查 `production / cms / blob / noindex`、授权健康检查 200、重发接口返回成功。Resend 控制台回读最新邮件为 delivered，预览中的 reset URL 使用稳定 Production alias；近 10 分钟运行日志无 warning、error 或 5xx。旧 token 已由重发失效，证据不记录 token。
- 首张真实头像上传暴露通用 Payload Media 表单把随机存储名、日期和审计关系当作主操作字段。提交 `09e63e1 / 22b4853` 保持底层时间戳与批准人审计不变，但在操作面隐藏随机文件名、上传者与批准人，把 `Alt text` 改成 `Image description`，把日期控件改成一个公开使用勾选。最新 deployment `dpl_3MGyKkPpepboeuhoXc8V1nJVS55b` 登录态回读只呈现图片说明和已勾选批准状态；typecheck、lint、editorial integration、production build 均通过。首次真实媒体 backup run `30345197248` 恢复 users/media 为 1/1，并从两个 Blob 对象中抽样读回 SHA。
- 产品负责人随后提供首位人物的真实资料；Production 建立 Person `gexu`，关联本人账户与已批准头像，记录杭州与墨西哥 Mérida、Educator and entrepreneur、A coherentist、英语与西班牙语及作者授权日期。因为 Person 公开门禁要求至少一篇公开 Article，该记录保持 Draft；run `30351414680` 恢复 users/people/articles/media/workflow_events 为 1/1/0/1/0，媒体抽样 SHA 读回通过。
- 首篇真实内容从中文访谈记录改写，公开前只核对专有名词官方写法，随后生成英语和拉美西语终稿及无文字、无公司标识的原创封面。两篇 Analysis 分别完成 Draft → In review → Approved → Public；数据库翻译组统一后，`/es/stories/a-decade-of-ai-talent-migration-in-china` 与反向英语路径均跳到目标 canonical URL。英语、西语 Stories 列表各出现一条，公开 Person `gexu` 显示英语贡献；页面无 console error。run [`30354709841`](https://github.com/lonelyreader/chinaknowledge/actions/runs/30354709841) 隔离恢复 users/people/articles/media/workflow_events 为 1/1/2/2/8，4 个媒体对象进入备份并完成样本 SHA 读回。

## Account Startup Contract

- `npm run cms:bootstrap-super-admin` 默认只显示计划；`--apply` 要求显式 `APP_ENV`、匹配的 `CMS_DATABASE_TARGET`、`CMS_BOOTSTRAP_CONFIRM=CREATE_FIRST_SUPER_ADMIN`、邮箱、姓名和至少 14 位密码，且在数据库锁定事务内确认 Users 为零。Production 另需 `CMS_BOOTSTRAP_PRODUCTION_CONFIRM=CREATE_FIRST_SUPER_ADMIN_IN_PRODUCTION`。密码只从环境读取，不进入参数或输出。
- `npm run cms:provision-accounts -- --input=/private/path/accounts.json` 默认 dry-run。输入只允许 `email / displayName / author|editor`，单批最多 500 人；重复邮箱和既有账户字段冲突在写前失败。
- 所有开户 apply 都要求显式 `APP_ENV`、匹配的 `CMS_DATABASE_TARGET`、`CMS_ACCOUNT_OPERATOR_EMAIL` 指向现有 Super Admin 和 `CMS_ACCOUNT_PROVISION_CONFIRM=PROVISION_CMS_ACCOUNTS`。Production 另需 `CMS_ACCOUNT_PRODUCTION_CONFIRM=PROVISION_CMS_ACCOUNTS_IN_PRODUCTION`、HTTPS `CMS_ACCOUNT_RESET_BASE_URL` 和 `--send-reset-email`。账户批次在单事务中写入和回读；邮件在提交后逐项尝试并完整输出成功/失败，失败项用 `--resend-existing` 恢复。
- 真实名单和命令输出含个人数据，不提交 Git；执行、邮件发送和真实数据仍分别过门禁。

## Required Recovery Sequence

1. 首位真实贡献者、头像、原创封面和英西首发内容已经建立并公开；未从 Preview 虚构夹具推导或复制。
2. 其他账户继续只按产品负责人提供的真实名单开户；当前作者没有个人外链，不构造占位项。
3. 绑定正式域名后复验匿名公开面，再单独决定搜索引擎索引。

## Evidence Pointers

- Public fixture surfaces：`apps/web/src/app/(frontend)/[locale]/**`
- CMS public loader：`apps/web/src/content/cms.ts`
- Schema and permissions：`apps/web/src/collections/**`、`apps/web/src/cms/**`
- CI boundary：`.github/workflows/preview-checks.yml`
- Product contract：`docs/product-brief.md`、`DESIGN.md`、ADR-0003/0004
- Execution contract：`docs/roadmap/checklists/production-launch-readiness.md`
