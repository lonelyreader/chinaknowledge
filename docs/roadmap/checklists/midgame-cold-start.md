---
doc_contract: DocContractV1
doc_type: checklist
authority: execution
status: active
scope: production-cold-start
last_verified: 2026-08-10
max_lines: 300
change_id: MIDGAME-COLD-START-001
risk_tier: upgraded
validation_profile: phase_release
allowed_paths: package.json, package-lock.json, apps/web/**, DESIGN.md, docs/README.md, docs/product-brief.md, docs/operational-publishing-requirements.md, docs/agent-workspace-requirements.md, docs/current-state.md, docs/product-feature-registry.md, docs/roadmap/README.md, docs/roadmap/checklists/README.md, docs/roadmap/checklists/midgame-cold-start.md, docs/archive/README.md, docs/archive/midgame-cold-start.md, docs/decisions/**, docs/reference/README.md, docs/reference/implementation/**
approval_gates: dependency-install, paid-plan-change, third-party-republication, new-personal-data, git-merge, git-push
---

# MIDGAME-COLD-START-001 生产冷启动

这是当前唯一紧急执行计划。目标不是把抓取文章批量改写，而是尽快建立一批真正解决外国人来华、在华问题的站方 Guide，并形成之后可以持续扩展的中文审查、英西翻译和发布流水线。

用户已授权本计划内的产品代码、schema、migration、站方真实内容、Preview、Production 部署、分批公开、搜索索引及明确缺口内的现有 Firecrawl 额度。第三方转载、付费升级、真实人物资料、merge 与 push仍分别批准。

## Scope

- 用现有私有语料完成选题聚类、来源包、中文母稿、英西翻译、导入、Preview、分批公开和发布回读。
- 完善计划所需的 Editorial Master、Site Article、权限、恢复、SEO/GEO 和编辑工具。
- 先交付 Wave A 20 篇，再依据真实结果扩展 Wave B/C，最终完成 60 组中英西内容单元。
- 外部语料目录只承担内部研究与批次证据；仓库实现改动仍受 frontmatter 的 `allowed_paths` 约束。

## No-go

- 不把 979 个 core 来源机械生产成 979 篇文章，不把篇数当质量。
- 不把第三方全文、逐段翻译或近义改写稿作为站方原创公开。
- 不发布 48 篇占位候选，不让代码部署自动公开候选内容。
- 不让英西版本脱离中文母稿扩写，不虚构人物、经历、引语或案例。
- 不用商业来源替代高风险内容的官方依据，不把旧规则写成当前事实。
- 不购买或升级 Firecrawl、Vercel、Neon、Resend、Blob 或其他计划，除非额度明确不足并再次批准。
- 不覆盖既有 Member、Person、Article、Media、translation group、版本或审计。

## 当前基线

- 私有研究库共有 `17,706` 条索引，不作为公开内容库。
- 8 个指南网站、9 个语言或栏目来源中，有 `3,729` 个可读、非重复正文页。
- 当前实用指南清单有 `1,614` 条：`979 core / 337 support / 298 review`。
- `979 core` 是研究来源池，不对应 `979` 篇公开文章。
- 现有 `cold-start-60-v1` 有 60 个选题，但只有 12 篇中文实用稿；其余 48 篇是占位候选，不能翻译或发布。
- 站方内容继续使用中文 Editorial Master、独立英西 Article、固定 `China, in Fact` 署名和现有发布权限。

研究入口：

- `/Volumes/External/service/china-in-fact-corpus/guide-review.html`
- `/Volumes/External/service/china-in-fact-corpus/guide-selection.xlsx`
- `/Volumes/External/service/china-in-fact-corpus/guide-briefing.md`
- `/Volumes/External/service/china-in-fact-corpus/guide-topic-clusters.xlsx`
- `/Volumes/External/service/china-in-fact-corpus/wave-a-20-chinese-review.html`
- `/Volumes/External/service/china-in-fact-corpus/wave-a-20-chinese-review.xlsx`
- `/Volumes/External/service/china-in-fact-corpus/wave-a-20-chinese-review.md`

## 执行原则

1. 按读者问题生产 Guide，不按抓取页面生产文章。
2. 先合并重复主题，再决定文章数量；不为完成数字保留重复选题。
3. 人类主要审中文。英语和西班牙语忠实翻译已批准母稿，不独立扩写。
4. 低风险内容走快速线；签证、证件、税务、劳动、支付限制和医疗走高风险线。
5. 第一波 20 篇达到标准就发布，不等待 60 篇全部完成。
6. 研究全文继续留在外部私有目录；CMS 不保存第三方全文。
7. 第三方文章可以提供事实、问题、案例和表达参考，但公开权利必须单独判断。

## 从来源到公开内容

```mermaid
flowchart LR
    A["979 篇 core 来源"] --> B["按用户问题合并去重"]
    B --> C["独立 Guide 选题"]
    C --> D["来源包与权利路线"]
    D --> E["中文母稿"]
    E --> F["中文人工通过"]
    F --> G["英语忠实翻译"]
    F --> H["西语忠实翻译"]
    G --> I["一致性与页面检查"]
    H --> I
    I --> J["Preview"]
    J --> K["10–20 篇一批公开"]
    K --> L["页面、索引与时效回读"]
```

## Stage 1：从 979 个来源收敛选题

- 以用户问题、适用身份、地区和时效为聚类键；支付、签证、居留、交通等重复页面合成一个来源包。
- 一个来源可以支持多个真正不同的问题；同一问题不能因网站或语言不同重复建稿。
- 国家签证页、城市医院页等模板型集合先形成父选题，需要时再拆国籍或城市子页。
- 目标是得到约 200–350 个可维护选题；这是规划区间，不是硬性篇数。
- 首批从中重新确定 60 个选题，替换旧 manifest 中不合适的来源和 48 篇占位内容。

选题至少记录：`contentKey / 中文题目 / 用户问题 / 适用对象 / 地区 / 风险 / 来源 / 权利路线 / 合并组 / 发布波次`。

## Stage 2：来源包与权利路线

每个选题只进入以下一条路线：

| 路线 | 用法 | 公开结果 |
|---|---|---|
| 已授权或自有 | 已取得许可、自有内容或许可明确 | 可忠实编辑、翻译并明确署名 |
| 站方事实指南 | 第三方只用于事实、问题和表达参考 | 形成独立中文母稿，署名 `China, in Fact` |
| 仅研究 | 权利、身份、事实或时效不清 | 留在研究库，不进入发布 |

快速线适用于常青旅行、语言、礼仪、家庭和一般生活问题：一个高质量人类来源即可启动，中文全文仍需人工通过。

高风险线必须增加现行中文官方来源，逐项核对资格、日期、金额、地区和例外。没有权威依据时不写确定性结论，也不以第二个商业网站代替官方核验。

## Stage 3：中文 Editorial Master

现有 `wave-a-20-chinese-masters.json` 中 20 份 350—850 字正文只算事实提纲，不算中文母稿，也不能进入翻译。详细攻略使用 `DetailedGuideV1`：有章节、步骤、清单和失败处理，可直接进入 CMS 富文本，不再把纯段落数组当完成稿。

中文母稿固定回答：

1. 这篇解决什么问题；
2. 适用于谁、哪里和什么时间；
3. 直接答案；
4. 实际步骤；
5. 常见失败与例外；
6. 城市或身份差异；
7. 官方入口与参考来源；
8. 最后核验时间。

详细攻略的最低结构：

- 标准篇正文通常为 1,500—3,500 个中文字符；复杂政策题可以更长。字数只用于拦截摘要，不作为凑字目标。
- 至少 6 个有实际任务含义的章节，覆盖 `decision / scope / preparation / procedure / exceptions / verification`；需要地区或身份拆分时增加 `differences`。
- 至少有两组真正可执行的编号步骤或检查清单，不能把连续段落加序号伪装成步骤。
- 每项时间、金额、资格、地区、证件和例外都能回到来源；高风险稿以当前中文官方来源为事实底座。
- 开头直接给判断，正文说明材料、操作顺序、卡住时怎么办，结尾提供官方入口和核验日期。
- 机器校验只负责拦截摘要、缺章节、缺步骤、失去来源和模板化语言；Editor 仍按真实可用性决定是否批准。

中文写作门槛：

- 删除空泛开头、重复总结、情绪化升华和批量模板句。
- 不把“先……再……”当作通用路标；步骤有依赖时写明条件，没有依赖时直接陈述内容。
- QA 生成器对标题、摘要和章节中的独立“先”以及正文破折号执行硬拦截，并报告路标句、权威腔和否定式排比；机器只报具体模式，不把正式或平实写作直接判为 AI。
- 不虚构经历、引语、案例、人物或现场感。
- 不沿单一第三方原文逐段改写；无转载权时重新组织为读者任务结构。
- 可以保留来源中的具体问题、事实和真实案例线索，但必须能定位来源并说明适用边界。
- Editor 只在中文全文、来源、风险和权利均可判断时将状态从 `in_review` 改为 `approved`。

## Stage 4：英语和西班牙语

- 两种语言分别建立 Article，但共享同一 translation group 和已批准中文母稿。
- 翻译保持标题意图、段落顺序、数字、日期、专名、步骤、限制和来源，不自由发挥。
- 自动比较三种语言的段落、列表、数字、链接、地区、证件名称和核验日期。
- 删除翻译中新增的前言、总结、解释性套话和没有中文依据的结论。
- 首批每种语言人工抽查 20%；高风险内容逐篇核对关键事实和限定语。
- 通过后 Editorial Master 进入 `translated`，但仍不自动公开。

## Stage 5：Preview 与分批发布

- manifest 先 dry-run，报告创建、更新、跳过和冲突；相同 hash 重跑不得重复创建。
- Local 与 Preview 验证中文母稿权限、英西关系、机构署名、来源、核验日期、canonical、hreflang、metadata、sitemap 和恢复。
- Preview 检查桌面与 390px 页面，不用解释性文案弥补结构。
- Production 发布前建立恢复点；Super Admin 使用明确 release 清单，通过 MCP `article_prepare_publication` / `article_commit_publication` 逐篇公开，导入和公开分开执行。
- 每次公开 10–20 篇；单批可以精确撤回，不改现有 Member、Person 和三篇 Production Article。
- 公开后读回数据库、匿名页面、列表、Purpose、Topic、sitemap、日志和错误语言 URL。

## 三个发布波次

### Wave A：20 篇核心办事指南

优先覆盖签证与免签、入境、住宿登记、支付与现金、SIM/eSIM、网络与地图、高铁、出租车、酒店、医疗急救、保险、租房、银行账户和生活成本。Wave A 是第一个可独立发布的成功节点。

### Wave B：20 篇长期生活指南

覆盖居留、工作、劳动、求职、留学、学校、家庭、儿童、宠物和城市落地。

### Wave C：20 篇补齐站点结构

覆盖商务办事、中国社会与日常语境、地区差异以及 Wave A/B 暴露的核心缺口。完成后达到 60 组中文母稿和对应 120 条英西 Article。

## 状态与责任

Editorial Master 继续只用：

`candidate → in_review → approved → translated → released`

权利状态独立使用：

`pending / cleared / restricted`

- Agent：聚类、来源包、中文初稿辅助、翻译、一致性检查、dry-run、页面验证和发布回读。
- Editor：中文全文、来源、风险、权利和修改决定。
- Super Admin：Production 批量 apply、公开、撤回和恢复。
- 匿名与 Member：不能读取中文母稿、内部权利判断或未公开翻译。

## 当前 Work

- [x] 冻结机构署名、中文母稿、英西翻译、权限和恢复的产品决定。
- [x] 建立 `17,706` 条研究索引、覆盖矩阵和首轮来源抽样。
- [x] 从指南型来源筛出 `979 core / 337 support / 298 review`。
- [x] 建立 Editorial Master、Site Article、翻译关系和批量导入的工作树实现。
- [x] 将 979 个 core 来源聚类为独立读者问题，形成 307 组可审查候选选题。
- [ ] 用新选题覆盖旧 60 组来源结构，删除 48 篇占位稿的进度含义。
- [x] 将 Wave A 20 份事实提纲重写为 `DetailedGuideV1` 中文详细攻略。60 篇已完成 `humanizer-zh v2.9.1` 中文编辑并由用户统一批准；批准记录绑定逐稿内容 hash、来源权利、操作者和回读，审查后改稿会使原决定失效。本地 CMS 批准回读与 60/60 幂等复跑通过。商业医疗保险稿已有社会保险官方依据，但全国商业产品选择仍明确标记为官方依据缺口。
- [x] 完成 60 篇英西翻译和一致性检查。`gpt-5.6-sol / medium` 通过 Codex CLI 受监督分片生成 120 个译文，保留中文块结构、数字和链接；60/60 `ColdStartTranslationV1` 全量合同通过。Local CMS 创建 120 条 Article 并事务回读 PASS，幂等复跑 120/120 跳过、零冲突。规范 manifest hash 为 `90a94aee45e136e5ca330ada6f8e0531a8011fc9da1d5b4948cc18532bbdc859`。
- [ ] 完成 Wave B 20 篇长期生活指南；选题与来源包、`DetailedGuideV1` 中文详细草稿均为 20/20，本地 CMS 导入与回读 20/20，重复导入 20/20 全部跳过且零冲突。生育、宠物和驾驶的官方依据已补齐；学校、托育和城市选择保留全国性依据缺口，发布前按目标城市与机构复核。
- [x] 完成 migration、权限、导入、回滚和页面的 Local/Preview 验证；站方 Article 已纳入现有 MCP 逐篇 `prepare/commit`，Local 专用数据库通过 Super Admin 公开、幂等重放、撤回和 Editor 权限负例。Preview 从最新 `origin/main` 隔离发布为 READY，第 14 条 migration、六个 Purpose、60 个母稿和 120 条英西 Draft 均已写入并回读；跨环境重绑只在旧审批 hash、译文中文源与目标中文标题/摘要/正文逐项相同后生成。翻译幂等复跑 120/120 跳过、零冲突，health 为 OK。
- [ ] 通过内容与技术独立复审，建立 Production 恢复点。
- [ ] 发布 Wave A，回读真实页面、索引、日志和恢复能力。
- [ ] 根据 Wave A 结果完成并发布 Wave B 与 Wave C；Wave B 与 Wave C 中文详细攻略、来源包和本地 CMS 回读均已完成 20/20。Wave C 包含 8 篇中国社会与日常语境、12 篇商务办事；数字平台稿已补商务部移动支付和公安反诈依据，本地更新回读与 20/20 幂等复跑通过。全批仍有 7 篇按题目性质保留官方依据缺口，发布前按城市、机构或当事人复核。60 篇统一审查入口为 `/Volumes/External/service/china-in-fact-corpus/cold-start-60-chinese-review.html`；中文 60/60 已批准，英西 120 个译文已完成并导入 Local CMS，尚未进入 Preview 或公开。
- [ ] 写回实际选题数、发布数、来源结构、成本、失败项和维护计划后归档。

## Acceptance

Wave A 成功标准：

- 20 份中文母稿全部人工批准、权利 cleared，且没有占位文或第三方逐段改写。
- 对应 40 条英西 Article 忠实关联同一母稿，数字、步骤、来源与日期一致。
- Production 真实公开后页面、机构署名、canonical、hreflang、sitemap、Purpose 与移动端回读通过。
- 导入可幂等重跑，本批可精确撤回，既有 Member、Person、Article 和媒体不漂移。

本 checklist 完成标准：

- Wave A/B/C 共 60 份中文母稿和 120 条英西 Article 公开并通过回读。
- 六个 Purpose 均有真实可用内容；不足以发布的题目用缺口记录替代凑数。
- Editor 能只用中文完成日常审查，英西翻译不脱离中文自由扩写。
- 高风险内容具备官方依据、核验日期和复查周期；内部研究正文不泄漏。

## Maintenance

- `high`：政策变化触发复核，最长 30–60 天检查。
- `volatile`：每季度检查。
- `annual`：每年检查。
- `evergreen`：来源变化或满一年检查。
- 过期内容先进入 Needs recheck 或撤回，不让批量更新自动覆盖公开事实。

## Validation

- 选题聚类重复率、来源域分布、权利路线和 20/60 组覆盖检查。
- 中文全文与英西翻译的段落、事实、数字、链接、专名和日期一致性检查。
- schema apply/rollback/reapply、Production-shape restore、导入 dry-run/apply/idempotency/rollback。
- Super Admin / Editor / Member / anonymous 权限矩阵和母稿泄漏负例。
- canonical、redirect、hreflang、JSON-LD、metadata、sitemap、robots、404 与错误语言测试。
- 首页、Guides、Purpose、Topic、Place、Article 在桌面和 390px 下的浏览器回放。
- `npm run lint`、`npm run typecheck`、`npm run test:editorial`、`npm run test:migration-recovery`、`npm run build`、`npm run governance:check`、`git diff --check`。

## Writeback

- 当前执行真相：本 checklist。
- 产品与发布规则：`docs/product-brief.md`、`docs/operational-publishing-requirements.md`、`docs/decisions/0010-site-editorial-content-foundation.md`。
- 当前能力与 Production 事实：`docs/current-state.md`、`docs/product-feature-registry.md`。
- 来源、选题和批次证据：`/Volumes/External/service/china-in-fact-corpus/` 与 `docs/reference/implementation/`。
- 完成历史：`docs/archive/midgame-cold-start.md`。
