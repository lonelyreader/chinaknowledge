---
doc_contract: DocContractV1
doc_type: checklist
authority: execution
status: completed
scope: site-token-system-retheme
last_verified: 2026-08-27
max_lines: 180
change_id: SITE-TOKEN-SYSTEM-RETHEME-001
risk_tier: upgraded
validation_profile: work_item
allowed_paths: apps/web/src/app/(frontend)/**, apps/web/src/components/**, apps/web/src/content/**, apps/web/public/fonts/**, PRODUCT.md, DESIGN.md, docs/roadmap/**, docs/archive/**, docs/reference/**, docs/current-state.md, docs/product-feature-registry.md
approval_gates: commit, merge, push, preview, production-deploy, real-data, schema, migration
---

# SITE-TOKEN-SYSTEM-RETHEME-001 全站 Token 系统与视觉统一

目标：让 Figma 重新建立 China, in Fact 的完整设计 Token，并以通过验证的 Figma Foundations 和代表性页面为唯一视觉基准，把当前公共网站统一为一套人物驱动、社群驱动、适合阅读的产品系统。

设计文件：[`ChinaInFact — People & Community Core Experience`](https://www.figma.com/design/uduLwDLMhjiP5FB79pHBPW/ChinaInFact-%E2%80%94-People---Community-Core-Experience?node-id=0-1&p=f)。

## Scope

- Figma 建立 Primitive、Semantic 与必要 Component token，覆盖颜色、字体、字号、行高、字距、间距、栅格、圆角、边框、阴影、动效时长和响应式密度。
- 建立 Figma Foundations 文档与变量绑定，保留旧画板作为历史，不原位覆盖。
- 以现有信息架构为基础完成代表性全站页面：Home、People、Person、Stories、Guides、Places、Article、About、Newsletter；同时覆盖桌面和移动关键状态。
- 前端移除互相冲突的旧 token 与局部硬编码，把公共页面改为统一语义 token；保持现有 locale、数据读取、路由和业务行为。
- People / Person / Home 保持连接优先的 community 产品结构；Stories / Guides / Article 保持阅读职责，但共享同一品牌基础。

## No-go

- 不把旧 V3 冷靛蓝、旧 editorial 视觉或当前代码 token 当作新系统的视觉权威。
- 不使用冷色主导、旗帜红、金色、中国风装饰、渐变、玻璃拟态或杂志式人物专题。
- 不新增或修改 schema、migration、权限、CMS 数据模型、真实数据或外部社区配置；正式域名切换只能在分阶段候选验收和产品负责人明确批准后执行。
- 不改公开路由、canonical、EN/ES 内容关系或业务动作；不借视觉统一重构数据层。
- 不为解释设计而增加可见帮助文案、实现术语或操作指导。

## Figma token contract

- Primitive 只保存原始值；Semantic 通过 alias 表达角色；组件只绑定 Semantic，不直接绑定 Primitive。
- Color 至少覆盖 canvas、surface、elevated、text、border、brand/action、focus、selection、success、warning、danger 与 inverse。
- Typography 至少覆盖 display、page title、section title、card/row title、body、prose、label、meta 和 code/date；每级固定 family、weight、size、line-height、tracking。
- Dimension 至少覆盖 spacing、section rhythm、content widths、radius、stroke、shadow、control height、portrait/image ratios 和 desktop/mobile density。
- 所有变量设置明确 scope 和 Web code syntax；所有代表性 Figma 页面使用变量或样式，不保留无理由硬编码。

## Acceptance

- [x] Figma 存在可审阅的 Foundations，包含完整变量集合、文本样式、效果样式和用途说明。
- [x] Figma 的代表性桌面与移动页面体现同一系统，且 Home/People/Person 不回到 editorial 人物专题方向。
- [x] 暖色系统保持清晰、现代、可连接，不依靠中国符号或长文案表达品牌。
- [x] 文本与关键控件满足 WCAG AA；焦点、错误、成功和禁用状态不只靠颜色表达。
- [x] 前端公共页面只通过语义 token 消费视觉值；无新增临时色值、字号、间距或阴影。
- [x] EN/ES 路由、People 搜索筛选、Person 连接路径、文章 canonical 与 fixture/CMS 读取行为保持。
- [x] 1440px、768px、390px 代表性页面无重叠、截断、水平溢出或失真的层级。
- [x] 可见文案通过 explanation-first、内部术语和操作指导检查。
- [x] changed-path lint、typecheck、build、候选提交治理检查与 diff 门禁通过。

## Validation

- Figma：变量/样式清单、alias 与 scope 审核，Foundations 截图，代表性页面截图和对比度检查。
- 前端：changed-path lint 与 typecheck；一次 aggregate build；EN/ES 代表性浏览器回读覆盖 desktop/mobile。
- 手工扫描 CSS 与 JSX：不新增未登记的颜色、字体尺寸、间距、圆角、阴影和解释性文案。

## Writeback

- `DESIGN.md` 写入通过后的唯一视觉与 token 合同。
- `docs/current-state.md` 和 `docs/product-feature-registry.md` 只记录真实完成的页面与行为。
- 当前 checklist 持续记录 Figma、实现和验证证据；完成后移入 archive。

## Current gate

- [x] 产品负责人要求废弃旧 token 偏好和当前冷色方向，由 Figma 重新完整设计 Token 并统一网站（2026-08-27）。
- [x] Phase 0 发现：代码存在互相叠加的旧 editorial 与 community token；Figma 当前无变量集合或本地样式。
- [x] 本批授权 Figma 设计、本地公共前端实现与验证；Git、Preview、Production、数据和 schema 动作仍分别批准。
- [x] Figma Foundations 与代表性页面完成并通过视觉、变量和可访问性检查。
- [x] 本地公共网站实现与 EN/ES 响应式回读完成。
- [x] 产品负责人于 2026-08-27 批准本地 Git 提交。
- [x] 产品负责人于 2026-08-27 另行批准分支 push、受保护 Preview 部署与 CMS 模式读回；虚构验收数据的技术 Preview 已通过。
- [x] 产品负责人于 2026-08-27 确认 `--prod --skip-domain` 分阶段 Production 候选与只读真实数据回读；未授权真实数据写入、正式域名切换或 promote。
- [x] 新版 Token 与版式已用 Production 的 11 位公开真实人物完成代表性桌面/移动回读。
- [x] 产品负责人于 2026-08-27 明确批准正式上线；`main` fast-forward 至 `eebb43c`，正式域名发布完成。

## Evidence

- Figma 文件：`00 — CIF Token System`、`01 — Foundations`、`02 — Core Patterns`、`03 — Page Templates`；旧 `Page 1` 保留为历史。
- Figma 变量：4 个集合、119 个变量；Semantic 28 项全部 alias Primitive，未发现 raw Semantic 值、缺失 Web syntax 或空 scope。
- Figma 样式与组件：18 个桌面/移动文本样式、3 个效果样式；Button、Search、Desktop/Mobile Header、Desktop/Mobile Person Row、Content Row、Footer 均绑定变量。
- 对比度：primary text/canvas `16.54:1`、secondary text/canvas `8.36:1`、muted text/canvas `5.65:1`、white/cinnabar-700 `7.54:1`。
- 浏览器：EN/ES 的 Home、People、Person、Stories、Guides、Article、Places、About、Newsletter 在 1440px、768px、390px 无横向溢出；移动菜单开合通过；Article prose 为 Newsreader `18/29`，移动 display 为 Geist `44/48`。
- Preview：`codex/site-token-retheme-preview` 已推送；Vercel deployment `dpl_FKoZxwC5K6orRAHDmbSNDvoQPQtz` 为 `READY / target: preview`。CMS 模式使用 `Acceptance Person` 等虚构验收数据，Home、People、Person、Member Article 与 EN/ES 代表路由在 1440px、390px 的技术读回通过；坏图、横向溢出、浏览器 error/warn 均为零，匿名访问受 SSO 保护且保持 `noindex`。这组证据不代表真实内容已经通过。
- 分阶段 Production：提交 `723d84f` 的 `dpl_FKLCUWhd59G28btAn6wmpnCTW1r8` 为 `READY / target: production`，只读 Production 的 11 位公开 Person；1440px 与 390px 的 EN/ES Home、People、全部 EN Person、可用 ES Person、代表性 Article、搜索和移动菜单通过，无水平溢出或 browser error/warn。空 Topic 筛选隐藏，本站 Media file 同源渲染；Tao 原图在正式域名和全新缓存键正常解码。
- 前端：`npm run typecheck` PASS；`npm run lint` 为 0 error、48 个既有 migration unused-parameter warning；`npm run build` PASS，77 个静态页面生成完成。
- 仓库：Checklist 与 router 先以 `2ffd2a3` 进入 HEAD；实现候选在隔离工作树通过 `npm run governance:check` 与 `git diff --check`。主工作树另有本批未触碰的 `outputs/` 改动，未暂存、未提交。
- 本地实现提交：`e974420`；Preview 治理基线：`570d502`；真实数据修复基线：`723d84f`；正式上线基线：`eebb43c / dpl_HeTTVA54riLEprKkBeP6UcfJFtVZ`。正式域名以 11 位真实人物完成 EN/ES、1440px/390px、搜索、移动菜单、媒体和索引回读，Vercel error log 为空。

## Relationship

- 本清单接管 `PEOPLE-COMMUNITY-FRONTEND-001` 尚未提交实现的视觉基线；其连接优先 IA 与行为验收继续有效，冷靛蓝与临时排版不再有效。
- `INFRA-RETHEME-001` 的旧宋式候选不自动并入本批；只有与本轮通过的 Figma token 一致的部分才可保留。
