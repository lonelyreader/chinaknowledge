---
doc_contract: DocContractV1
doc_type: reference
authority: evidence
status: active
scope: agent-workspace-010-local-runtime
last_verified: 2026-08-16
max_lines: 100
---

# AGENT-WORKSPACE-010 Local runtime

## 结果

`AGENT-WORKSPACE-010` 已完成 Local 实现与工作项验证，等待一次独立终局复审。Agent 注册表由 30 个增至 33 个工具：新增合格中文母稿读取、Site Article 私有 draft 创建和 pending working-copy 保存；既有 `editorial_reference_options` 增加 Super Admin-only `site_master`，`admin_recent_activity` 增加有限筛选、分页与首屏 `asOf`。

本批没有 schema、migration、Payload collection、Admin UI、账户管理、通用 CRUD、Production、真实数据或外部通知改动。

## Site Article working copy

- 只有每次调用实时重检通过的 active Super Admin 能发现和调用三个新工具。Editor/Member 猜测工具名、直接 service 调用或使用 `site_master` kind 均失败。
- 母稿固定要求 rights cleared、状态 approved/translated/released、中文 title/summary/body、purpose 与完整非 restricted 来源。读取只返回 Body V2、purpose/topics、必要来源元数据和 Agent-facing master fingerprint，不返回创建者、复核者、版本、翻译备注或 source check。
- 现有 Editorial Master content hash 不覆盖 topics。本批不修改公共 hash 或 schema；Agent service 生成版本化 SHA-256 master fingerprint，覆盖既有 content hash 与排序去重后的 topic IDs。`site_master` reference、master get 和 Article working-copy 返回同一指纹；create/save 事务及成功幂等重放均重读母稿并复核该指纹，再复制当前 purpose、topics、source notes 与由 checkedAt 推导的 freshness。
- 创建由服务端固定 `authorshipType=site`、`author=null`、当前 owner、master、group、slug 与初始状态。同一 master 的 EN/ES 共用 group；master 行锁与既有 `(translationGroup, locale)` unique index保证并发同 locale 最多一条。
- 保存只接受 title、summary、Body V2、format、四类 taxonomy、source/freshness、approved cover 与 SEO title/description。事务重检 master/hash、Article identity、revision、分类和媒体；写后核对 owner/author/master/locale/group/slug 与 live revision。
- 已公开 Site Article 的普通保存只形成 pending version。逐篇 publication 或既有 batch release 识别 pending autosave，并按 Site promotable whitelist 推广 copy、format、四类 taxonomy、source/freshness、cover、SEO 等字段；最终读回要求 live/latest 一致且无 pending。

## Activity 边界

- 空输入仍是 page 1 / limit 20；limit 最大 50。page>1 必须复用首屏 `asOf`，排序固定为 `occurredAt desc, id desc`。
- 只接受 axis、Article ID、notification kind/status 四项筛选；future/非法 asOf、非法分页、where/sort/export 和未知字段失败。
- 输出保持 Article ID/title/locale/publicPath、actor ID/displayName、axis、前后状态、通知 kind/status 与时间的最小投影。真实 WorkflowEvent、Article、User、Person 和通知均不变，只增加既有 account-scoped read audit；邮箱、recipient/key/error、正文、来源、owner、connection 和确认凭证未进入输出或 AgentEvent。

## Local 验证

- 全新专用 `chinaknowledge_agent010_20260816` scratch database 顺序完成 15 条既有 migration，`npm --prefix apps/web run test:agent:live` — PASS。覆盖 reference/get/working-copy 指纹一致、topics 在读取后变化、底层 content hash 变化后的 create/save replay 失败、双语同组、重复/并发 locale、幂等重放、stale revision、Site identity、private/pending/live 隔离、batch promotion、角色 discovery/直调与 activity 分页筛选/隐私。
- 独立 fresh scratch `npm --prefix apps/web run test:editorial` — PASS；既有 hooks、共享 publication helper、策展与 009 通知行为无回归。
- `npm --prefix apps/web run test:cold-start-translations` — PASS；冷启动翻译合同无回归。
- `npm --prefix apps/web run test:agent` 与 `npm --prefix apps/web run typecheck` — PASS；合同、strict schema、33 工具、HTTP/MCP、route、OAuth 和 no-schema 断言通过。
- `npm --prefix apps/web run lint` — PASS，0 error；48 条既有 migration warning。
- `npm --prefix apps/web run build` — PASS，77 routes。首次仅因跨 worktree 临时 `node_modules` symlink 被 Turbopack 拒绝；改用 ignored 本地依赖副本后完整构建通过，未修改依赖或 lockfile。

## 剩余门禁

独立终局复审、Preview、`main` push、Production deploy、真实账户/数据、公共状态和外部通知均未执行。010 复审通过后才可进入 011 的统一三角色真实客户端与发布验收。
