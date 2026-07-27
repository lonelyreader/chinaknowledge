---
doc_contract: DocContractV1
doc_type: reference
authority: evidence
status: deferred
scope: technical-stack-proposal
last_verified: 2026-07-27
max_lines: 180
---

# Technical Stack Proposal

这是一份待确认的技术建议，不是已接受架构，也不授权创建应用、安装依赖、接入账号或部署。
进入产品实现前，应通过单独的 active checklist 核验并形成 ADR。

2026-07-27，公共 Web 基础栈已由 [`ADR-0005`](../decisions/0005-public-web-foundation.md) 接受并进入 `apps/web`。本文对 CMS、数据库、图片、邮件、分析和部署的建议继续保持 deferred，不因此获得授权。

## CMS 候选刷新（2026-07-27）

- npm registry 当前的 `payload`、`@payloadcms/next` 与 `@payloadcms/db-postgres` 均为 `3.86.0`；`@payloadcms/next` 的 peer range 接受 Next.js `16.2.6` 以上、17 以下，当前公共应用的 `16.2.12` 不构成版本阻塞。
- Payload 官方支持加入现有 Next.js 应用，也支持认证集合、按操作和文档查询约束的 access control、版本、draft、定时公开和 PostgreSQL adapter。
- Payload draft 的内建 `_status` 主要表达 `draft / published`。本项目的 `Submitted / In review / Changes requested / Approved` 仍需独立业务状态和服务端转换规则。
- Payload 的 locale-specific draft status 目前标为 beta。P1 必须比较 localized fields 与“每种语言独立文档、translation group 关联”两种模型，不能因候选功能存在就直接接受。

官方依据：[Installation](https://payloadcms.com/docs/getting-started/installation)、[Access Control](https://payloadcms.com/docs/access-control/overview)、[Drafts](https://payloadcms.com/docs/versions/drafts)、[Localization](https://payloadcms.com/docs/configuration/localization)、[Postgres](https://payloadcms.com/docs/database/postgres)。

## 建议组合

| 层 | 候选 | 当前理由 |
|---|---|---|
| Web | Next.js App Router + TypeScript | 适合内容页面、动态编辑能力与 Vercel 预览 |
| UI | React + Tailwind CSS + CSS variables | 便于从设计资产落地为组件和设计令牌 |
| CMS | Payload CMS | 与 Next.js 同栈，并提供认证、权限、草稿、版本和管理界面 |
| 数据库 | 托管 PostgreSQL | 适合作者、内容、多语言状态、分类和审核记录 |
| 图片 | Vercel Blob 或兼容 S3 的对象存储 | 避免依赖临时文件系统 |
| 邮件 | 事务邮件服务与 Newsletter 平台分离 | 系统通知与内容订阅职责不同 |
| 分析 | Vercel Web Analytics 起步 | 先观察入口、阅读与订阅转化 |
| 部署 | Vercel | 与候选 Web 栈的预览和缓存能力匹配 |

## 为什么不是纯静态站

公共内容适合预渲染，但作者登录、草稿、审核、定时公开和角色权限需要动态服务。
候选方案应同时保持公共阅读性能和编辑能力。

## Payload 的适配点

项目需要的是编辑系统：作者提交、编辑审核、分类、版本、预览和公开。Payload 能覆盖这些
基础能力，可能减少自建后台的工作量。是否采用仍需验证：

- 英语与西班牙语独立内容和独立公开状态。
- Author、Editor、Super Admin 的所有权与权限负例。
- Vercel 环境中的数据库、媒体、任务和预览边界。
- 100–200 位作者规模下的运营与成本。
- 备份、导出、迁移和供应商退出路径。

## 待决定事项

- 正式应用目录与仓库结构。
- CMS、数据库、对象存储、邮件和 Newsletter 供应商。
- 运行中的内容真相、导入导出与灾难恢复方式。
- Preview、production 和内容公开的独立门禁。

## 参考

- [Next.js App Router](https://nextjs.org/docs/app)
- [Next.js 国际化路由](https://nextjs.org/docs/app/guides/internationalization)
- [Next.js on Vercel](https://vercel.com/frameworks/nextjs)
- [Payload Admin Panel](https://payloadcms.com/docs/admin/overview)
- [Payload Drafts](https://payloadcms.com/docs/versions/drafts)
- [Payload Access Control](https://payloadcms.com/docs/access-control/collections)
- [Payload PostgreSQL Adapter](https://payloadcms.com/docs/database/postgres)
- [Google Search 多语言站点建议](https://developers.google.com/search/docs/advanced/crawling/managing-multi-regional-sites)
