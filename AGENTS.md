# AGENTS.md — 给 AI Agent 与人类协作者的公约

> 本仓库服务「中国知识出海」。大多数贡献者是 **技术小白 + AI Agent**。Agent 必须先读完本文再改代码或内容。

## 项目目标（一句话）

用深度、可信的中国相关信息与工具，服务海外用户与开发者，沉淀长期信任。

## 目录职责（不许越界）

| 路径 | 是什么 | Agent 可以做什么 | 禁止 |
|------|--------|------------------|------|
| `inbox/` | 原始 Markdown 内容源（source of truth） | 新增/修订 md、补全 frontmatter | 建深层子目录；把 md 挪去别处当主源 |
| `dataset/` | 由 inbox **派生** 的机器可读数据 | 只通过约定脚本生成/更新 | 手改当权威；绕过 inbox 直接写“正文真相” |
| `apps/` | 可部署的应用 | 在对应 app 内开发功能、读 inbox/dataset | 每个 app 各造一套内容体系 |
| `packages/` | 跨 app 共享代码与 schema | 抽公共逻辑、统一类型与校验 | 塞业务只属于某一个 app 的逻辑 |
| `docs/` | 给人/给 agent 的规范与设计 | 更新规范、补示例 | 用 docs 替代真正的产品代码 |
| `.github/` | Issue/PR 模板与 CI | 按模板协作；改 CI 需说明 | 跳过模板直接糊弄描述 |

**原则：`inbox` 是内容真相；`dataset` 可重建；`apps` 只消费约定 schema。**

## 默认工作流（人 + Agent）

1. **先对齐任务**：在 Issue 或对话里写清「改哪一层、成功标准、不要做什么」。
2. **小步提交**：一次 PR 只做一件事（例如：只加 3 篇 inbox，或只改一个 app 的一个功能）。
3. **改内容走 inbox**：写 Markdown + frontmatter；不要在 app 里硬编码大段文章。
4. **改产品走 apps**：功能、页面、API 在 `apps/<name>/`。
5. **生成数据走脚本**：需要检索/结构化时，更新 pipeline，再生成 `dataset/`，不要手搓一堆无法复现的 JSON。
6. **开 PR**：用 `.github` 模板；标题说清「为什么」；让人过目事实性内容。

## inbox Markdown 约定

- 文件放在 `inbox/` **根目录**（尽量扁平）。
- 文件名：小写、短横线、可含日期或主题，例如 `2026-07-china-visa-basics.md`。
- 必须有 YAML frontmatter。最小字段见 `docs/inbox-frontmatter.md`。
- `status: draft | review | published`。未 `published` 的内容默认不应被生产 App 展示（除非 app 明确做预览）。

## 对 Agent 的硬性要求

- **先读再改**：改某 app 前先看该 app 的 README（若有）和本文件。
- **不编造事实**：中国相关事实、政策、数据不确定时，标注 `needs-source` 或向人类提问，禁止装作权威。
- **不提交密钥**：禁止提交 `.env`、token、私钥。
- **不跑破坏性 git**：禁止 `push --force` 到 `main`、禁止改 git config、禁止无请求的 amend。
- **不擅自扩 scope**：用户没要的 App、重构、依赖升级，先问再做。
- **中文沟通默认**：与仓库主人对话默认中文；面向海外用户的产品文案默认英文（除非任务另有说明）。

## 人类负责人保留的决策

- 品牌、合规、对外口径
- 哪些内容可以 `published`
- 第一个正式上线的 App 与垂直切口
- 仓库权限与发布到生产环境

## 成功协作的标志

- Issue/PR 描述小白也能看懂
- Agent 改动可复查、可回滚
- 内容与代码边界清晰，不会「文章写进组件、数据写进偶然文件」
