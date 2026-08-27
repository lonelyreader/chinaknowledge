---
doc_contract: DocContractV1
doc_type: checklist
authority: execution
status: active
scope: people-community-frontend
last_verified: 2026-08-27
max_lines: 140
change_id: PEOPLE-COMMUNITY-FRONTEND-001
risk_tier: upgraded
validation_profile: work_item
allowed_paths: apps/web/src/app/(frontend)/[locale]/layout.tsx, apps/web/src/app/(frontend)/[locale]/page.tsx, apps/web/src/app/(frontend)/[locale]/people/**, apps/web/src/components/site-header.tsx, apps/web/src/components/person-row.tsx, apps/web/src/components/cms-person-row.tsx, apps/web/src/components/people-directory.tsx, apps/web/src/components/cms-people-directory.tsx, apps/web/src/components/community/**, apps/web/src/content/index.ts, apps/web/src/app/(frontend)/globals.css, DESIGN.md, docs/roadmap/**, docs/reference/**, docs/current-state.md, docs/product-feature-registry.md
approval_gates: commit, merge, push, preview, production-deploy, real-data, schema, migration
---

# PEOPLE-COMMUNITY-FRONTEND-001 连接优先核心页面实现

目标：把产品负责人已通过的 Figma `Community Production V3` 落到当前 Next.js 前端，完成 Home、People、Person 的连接优先重排，使访问者先看到具体的人、当前行动、可提供或正在寻找的连接，以及明确的外部继续路径。

设计源：[`ChinaInFact — People & Community Core Experience`](https://www.figma.com/design/uduLwDLMhjiP5FB79pHBPW/ChinaInFact-%E2%80%94-People---Community-Core-Experience?node-id=0-1&p=f)。产品负责人于 2026-08-26 明确通过 V3 并授权直接实现。

## Scope

- 公共首页改为连接入口：人物搜索意图、紧凑人物列表、人物关联行动、Discord/Reddit 继续路径、来自人物的 Stories/Guides。
- People 移除 Spotlight 与人物专题开场，改为搜索、辅助筛选和连续分隔人物行。
- Person 首屏改为连接就绪布局，优先呈现身份、地点、语言、公开链接、能帮什么和当前可用的人物证据。
- 新增最少量共享组件，只抽取 Home、People、Person 已出现的真实复用。
- 视觉基线改为紧凑无衬线产品界面；文章阅读页不在本批重构。
- EN/ES 继续使用现有 locale、数据读取与回退路径。

## No-go

- 不新增 Project schema、字段、migration、权限、后台表单或 Agent 工具。
- 不把 Discord 帖子、私密内容或 Figma 虚构人物写进网站；只渲染当前公开数据。
- 不做站内私信、关注、匹配、排名、评分、热度、在线状态、人数或虚构活动。
- 不新建 `/projects`、`/questions` 或 `/community` 顶级路由；导航保持 `People / Stories / Guides / Places`。
- 不修改真实数据、DNS 或外部社区；Production 只允许已批准的 `--prod --skip-domain` 分阶段候选，不切换正式域名。
- 不顺手重构 Article、Guide、Place、CMS Admin 或数据层。

## Data boundary

- Person 当前行动优先使用已有公开 contribution、identity、introduction、canHelpWith、links 与公开 Article；缺失时隐藏，不填充虚构内容。
- 首页行动与社群继续模块只在存在公开、可验证去向时显示；Discord 总入口可以使用现有公开邀请链接。
- Figma 文案和人物仅用于结构与密度参考，不成为内容来源。

## Acceptance

- [x] Home 首屏在桌面与移动端先出现“找人”入口及真实 People，不再由 Article Hero 主导。
- [x] People 没有 Spotlight、人物专题文案或等尺寸人物卡片网格；筛选后结果仍可访问、可分页。
- [x] Person 先回答“是谁、在哪里、能提供什么、从哪里继续”，并隐藏无数据模块。
- [x] Desktop 1440px 与 Mobile 390px 无重叠、截断、水平溢出或必要信息省略号。
- [x] UI 不出现解释性操作文案、内部术语、虚构实时状态、人数、排名或社交证明。
- [x] EN/ES 公共路由、文章 canonical、Person URL 与 CMS/fixture 双读取路径保持。
- [x] changed-path lint、typecheck、build、候选提交治理检查与 `git diff --check` 通过。

## Validation

- 实现中运行范围内 lint/typecheck；收尾运行一次 aggregate build 与治理检查。
- 本地浏览器检查 Home、People、至少一个 Person 的 EN/ES，覆盖 1440px 与 390px。
- 手工可见文案检查：无 `Spotlight`、`Featured`、`Active now`、`Message`、`Follow`、`Match`、人数、排名和操作指导。

## Writeback

- `DESIGN.md` 写入社区产品界面的现行视觉合同，保留 Article 阅读面的独立职责。
- `docs/current-state.md` 只在本地验证完成后记录实现事实；功能登记册按实际路由与行为更新。
- 完成后移入 archive；commit、Preview、Production、merge 与 push 分别批准。

## Current gate

- [x] 产品负责人通过 Figma V3 并要求建立 Checklist、避免过度工程、保证质量并全速实现（2026-08-26）。
- [x] 初始实现只授权本地前端、文档与验证，不含 schema、migration、真实数据或 Production。
- [x] 本地实现与代表性浏览器验收完成（2026-08-27）。
- [x] 连接优先 IA 与行为验收继续有效；颜色与排版基线已由 `SITE-TOKEN-SYSTEM-RETHEME-001` 接管，V3 冷靛蓝不再是视觉权威（2026-08-27）。
- [x] 产品负责人于 2026-08-27 批准本地 Git 提交。
- [x] 产品负责人于 2026-08-27 另行批准分支 push、受保护 Preview 部署与 CMS 模式读回；虚构验收数据的技术 Preview 已通过。
- [x] 产品负责人于 2026-08-27 确认 `--prod --skip-domain` 分阶段 Production 候选与只读真实数据回读；未授权真实数据写入、正式域名切换或 promote。
- [x] 新版 UI 已读取 Production 的 11 位公开真实人物，并完成 Home、People、全部 EN Person、可用 ES Person 与代表性 Article 的桌面/移动回读。
- [ ] 正式域名 promote、`main` 合并与 Production branch push 尚未批准；清单保持 active。

## Closure evidence

- `npm run typecheck`、`npm run build` PASS；`npm run lint` 零 error，48 个既有 migration unused-parameter warning。
- Fixture 模式下 EN/ES 的 Home、People、Person 均完成 1440px 与 390px 浏览器回读；六条西语组合均 `rendered`、无 Spotlight、无水平溢出，Person 的 `Connect on Discord` 精确一个。
- `/en/people?q=Mobility` 精确返回 Chen Rui 与 Deng Ke，证明首页 GET search 与目录查询相连。
- 本地 CMS 数据库因既有重复 `translationGroup_locale_idx` 数据无法启动页面；本批未改 schema 或数据。早期受保护 Preview 只补齐 CMS 运行模式，使用 `Acceptance Person` 等虚构验收数据；后续真实内容验收改由只读 Production 候选完成。
- Checklist 与 router 先以 `2ffd2a3` 进入 HEAD；实现候选在隔离工作树通过 `npm run governance:check`，没有扩大 allowed paths。主工作树的 `outputs/facebook-group/**`、`outputs/reddit-brand/**`、`outputs/reddit-questions/**` 等无关改动未暂存、未提交。
- 实现提交 `e974420` 与治理写回 `570d502` 已推送至 `codex/site-token-retheme-preview`；后续空 Topic 筛选与同源 Media 修复为 `30630e7`、`723d84f`。分阶段 Production 候选 `dpl_FKLCUWhd59G28btAn6wmpnCTW1r8` 为 `READY / target: production`，`/api/health=200`、公开 People API=`11`，读取同一 Production 数据库但未写数据。
- 候选在 1440px 与 390px 回读 EN/ES Home、People、全部 11 个 EN Person、7 个可用 ES Person、代表性 Article、搜索和移动菜单；无水平溢出或浏览器 error/warn。没有 Topic 数据时筛选已隐藏，本站 Media file 以当前域名同源读取。Tao 原图经正式域名与全新缓存键均以 `1179×2556` 正常解码；一次受保护候选精确 URL 的失败缓存不构成文件或代码缺陷。
- 候选匿名请求仍 302 至 Vercel SSO 且 `noindex`。`chinainfact.com` 继续绑定旧正式部署 `dpl_CQkJRqNYFHDPhWE7BsXW54KNFoQi`；没有 promote、正式流量切换、`main` 合并或 Production branch push。
