---
doc_contract: DocContractV1
doc_type: checklist
authority: execution
status: active
scope: production-cold-start
last_verified: 2026-08-04
max_lines: 300
change_id: MIDGAME-COLD-START-001
risk_tier: upgraded
validation_profile: phase_release
allowed_paths: package.json, package-lock.json, apps/web/**, DESIGN.md, docs/README.md, docs/product-brief.md, docs/operational-publishing-requirements.md, docs/current-state.md, docs/product-feature-registry.md, docs/roadmap/README.md, docs/roadmap/checklists/README.md, docs/roadmap/checklists/midgame-cold-start.md, docs/archive/README.md, docs/archive/midgame-cold-start.md, docs/decisions/**, docs/reference/README.md, docs/reference/implementation/**
approval_gates: dependency-install, paid-plan-change, third-party-republication, new-personal-data, git-merge, git-push
---

# MIDGAME-COLD-START-001 生产冷启动

目标：把现有研究语料变成一套可持续的中文编辑真相和英西公开内容体系，使 `chinainfact.com` 在六个目的入口中形成充分、可信、可维护的首批信息覆盖，并让内容、人物、搜索和站方责任在 Production 上真实成立。

用户于 2026-08-03 明确授权本任务涉及的产品代码、schema、migration、真实站方内容写入、Production 部署、内容公开和必要的追加 Firecrawl。授权不改变第三方版权、真实人物同意、付费升级和 Git 动作边界。

## Scope

- 以 `/Volumes/External/service/china-in-fact-corpus/` 的 `17,706` 条索引为内部研究层，完成来源、质量、时效、权利与六个目的入口的覆盖分析；只对已证实缺口追加定向 Firecrawl。
- 建立站方内容的中文编辑母稿：保留来源 URL、抓取/核验时间、事实风险、权利判断、编辑状态和版本；中文是人类审查真相，不对公众建立第三个 locale。
- 允许两类公开署名：Member 内容继续固定原 Person；站方原创事实指南使用固定 `China, in Fact` 机构署名，不创建虚构 Person，也不把第三方作者冒充为站方。
- 英语和西班牙语继续使用 translation group 下的独立 Article；它们忠实翻译同一份已通过中文母稿，分别检查并分别公开。
- 建立候选生成、人工可编辑母稿、翻译、导入 dry-run、幂等 apply、发布前检查、批量回读和失败恢复工具；不要求编辑直接操作 SQL。
- 首批 Production 至少公开 `60` 组中英西内容单元，即 `60` 份中文母稿和 `120` 条英西 Article。六个 Purpose 各至少 `8` 组，Visit、Live、Business 各至少 `12` 组；不足的组不以低质内容补数。
- 每条公开内容具备稳定 canonical、相互 hreflang、来源、核验日期、摘要、分类、SEO metadata 和合法可用的站方图片或安全 fallback。
- 保持并强化 `官方入口 → Article → Person`：Member Article 继续进入原作者 Person；站方 Article 在主题相关且有真实合适人物时提供人物入口，不伪造人物或强行挂靠。
- 补齐公共结构化数据、sitemap、canonical、alternate、分享信息和清晰的正文层级，使搜索引擎和生成式检索都能准确理解页面事实、语言、来源、日期和署名。

## No-go

- 不把第三方抓取全文、中文辅助翻译或 AI 改写稿直接当作站方原创公开；公开可访问不等于可转载。
- 不用虚构作者、虚构经历、虚构引语、虚构人物页或未经本人同意的个人资料制造“有人味”。
- 不让英文或西班牙文脱离中文母稿自由扩写；不以模板句、空泛总结和批量同质段落凑篇数。
- 不因代码部署自动公开全部候选；migration、数据导入、英文章节公开、西文章节公开和搜索索引分别回读。
- 不复制 Preview 虚构数据到 Production，不覆盖现有真实 Person、Article、Media、translation group、版本或审计。
- 不更换 Payload、PostgreSQL、Blob、Resend、Vercel 或现有公共视觉方向；不建设读者账户、支付、评论、私信或推荐系统。
- 不购买或升级 Firecrawl、Vercel、Neon、Resend、Blob 或其他计划，除非现有额度明确不足并再次获得批准。

## Upgraded Boundaries

- `data_truth`：研究原文只在外部语料目录；Local/Preview 只使用虚构或明确的冷启动 fixture；Production 只写已通过内容清单，不从 Preview 复制数据。
- `read_path`：中文母稿和内部核验字段只对 Editor/Super Admin 可读；匿名只读各语言已 Published + Curated 的公开字段。站方稿不进入 Person 个人归档。
- `write_path`：导入先校验 manifest、目标环境、内容 hash 和既有 translation group，再以幂等批次写入；公开状态只能由显式 release 清单改变。
- `permission_boundary`：Member 只能维护自己的 Person/Article；Editor 可维护站方母稿、翻译和策展字段；Super Admin 才能执行 Production 批量 apply；匿名和 Member 不能读取中文母稿或内部检查。
- `audit_boundary`：记录批次 ID、输入 hash、执行 actor、创建/更新/跳过/失败、Article ID、translation group、公开动作、回滚动作和时间；日志不得包含密钥或未公开正文。
- `recovery`：schema 与内容写入前建立 Production 恢复点；导入以批次标识可精确回滚新记录，并保持既有记录不变；保留上一 READY deployment 和数据库隔离恢复证据。
- `independent_review`：非主持实现者分别复核产品/内容与技术/权限/migration；只有冻结合同违约、当前 diff 回归或直接安全失败可以 BLOCK。
- `key_invariants`：现有 Member byline、owner、ID、translation group、canonical、公开状态和版本不漂移；站方稿不伪装 Person；中英西关系不串组；草稿和内部来源检查不泄漏；失败可恢复。
- `finding_route`：不阻断本批的成员招募、更多人物、社交功能、推荐系统和长期内容运营进入 P3；生产紧急故障进入独立 release/incident 记录；明确覆盖缺口回到本清单的 Firecrawl 队列。

## Work

- [x] 用户批准本 checklist 基线，随本提交进入 HEAD，使后续代码 diff 获得正式范围合同。
- [ ] 完成现有公共产品、Payload schema、编辑体验、SEO、Production 数据与恢复链路审计。
- [ ] 冻结机构署名、中文母稿、英西翻译和批量发布的长期产品决定。
- [ ] 从现有语料建立覆盖矩阵、来源权利表、时效分级和首批 60 组候选；仅对明确缺口追加抓取。
- [ ] 实现中文母稿、站方署名、翻译关系、权限、审计、幂等导入和精确恢复。
- [ ] 实现公共 Article、列表、People 关系、metadata、结构化数据、sitemap 和分享结果。
- [ ] 生成并编辑首批中文母稿；逐组完成英文和西班牙文忠实翻译与来源/时效检查。
- [ ] 在 Local 与 Preview 完成权限负例、批量 dry-run/apply/rollback、桌面/移动、英西独立公开和搜索结构验证。
- [ ] 通过内容与技术两条独立复审，修复冻结合同内 finding 至 PASS。
- [ ] 建立 Production 前恢复点，执行 migration 和冷启动批次，分别公开英西内容并回读真实页面、数据库、sitemap、日志和恢复能力。
- [ ] 写回覆盖、实际发布数、来源结构、失败项、成本、Production 结果和下一阶段建议，并归档本清单。

## Acceptance

- Production 至少存在 60 份已通过中文母稿和对应 120 条公开英西 Article；同组 title/body/来源/日期语义一致，英西状态分别可撤回。
- 六个 Purpose 满足最低覆盖，核心来华与在华任务不存在明显空栏目；内容质量不足时以真实缺口报告替代凑数。
- 站方稿显示固定机构署名且不生成 Person；Member 稿仍显示原作者并进入其 Person，现有三篇 Production Article 不发生身份或内容漂移。
- Editor 能用中文检查事实、来源、时效和翻译状态；普通 Member 与匿名请求不能读取母稿或内部核验。
- 导入重复运行不重复创建；任一批次可以精确回读创建/更新/跳过/失败，并能恢复到批次前状态。
- 每个公开页面有正确 canonical、EN/ES alternate、metadata、来源、核验日期和结构化数据；草稿不进入 sitemap、alternate 或官方入口。
- 首页、Stories、Guides、Purpose、Topic、Place 与 People 在桌面和 390px 下没有空壳、明显重复、错误语言、断链、溢出或解释性 UI 文案。
- Production migration、内容写入、英西公开和索引均有独立执行记录、恢复点、部署回滚目标和发布后读回；运行日志无新增 5xx 或权限泄漏。

## Validation

- schema/migration diff、apply、rollback/reapply、Production-shape restore、批次 dry-run/apply/idempotency/rollback。
- Super Admin / Editor / Member / anonymous 权限矩阵；跨成员、机构冒充、母稿泄漏、翻译串组和未确认公开负例。
- 中文母稿与英西稿逐组结构/事实/source URL/freshness 检查；重复、广告、失效来源和高风险陈旧内容检查。
- 公共 canonical、redirect、hreflang、JSON-LD、metadata、sitemap、robots、404 与错误语言测试。
- 首页、栏目、文章、Person、Purpose 与 Place 的桌面和 390px 浏览器回放；人工扫描所有新增可见文字。
- `npm run lint`、`npm run typecheck`、`npm run test:editorial`、新增目标测试、`npm run test:migration-recovery`、`npm run build`、`npm run governance:check`、`git diff --check`。

## Writeback

- 产品与内容合同：`docs/product-brief.md`、`docs/operational-publishing-requirements.md`、`docs/decisions/`
- 当前能力与生产事实：`docs/current-state.md`、`docs/product-feature-registry.md`
- 执行与证据：本 checklist、`docs/reference/implementation/`、外部语料根的覆盖与批次报告
- 完成历史：`docs/archive/midgame-cold-start.md`

## Approval Status

- 已批准：产品代码、schema、migration、Production 部署、真实站方内容批量写入、英西内容公开、搜索索引和覆盖缺口内的现有 Firecrawl 额度使用。
- 仍单独门禁：依赖新增、付费计划升级、第三方全文转载、真实人物资料新增、merge 与 push。
