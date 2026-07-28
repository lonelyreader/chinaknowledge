---
doc_contract: DocContractV1
doc_type: decision
authority: canonical
status: accepted
scope: decision-member-publishing-and-editorial-curation
last_verified: 2026-07-28
max_lines: 180
change_id: PUB-CURATION-001
---

# ADR-0009：成员直接发布与站方策展分离

## Context

现有 CMS 把所有内容放在 `Draft → Submitted → In review → Approved → Public` 的同一条审核链上，只有 Editor 能公开。这把铲子计划成员误建模成向站方投稿的外部作者，也把“作者公开表达”和“站方选择扩大分发”混成同一个动作。

产品的真实关系是：成员拥有 Person 和个人内容空间，可以直接公开；站方从成员已公开内容中选择一部分，在原 Article 上编辑、核对、分类并分发。站方的价值是策展和共同流量，不能通过复制文章或替换署名实现。

## Decision

- Article 使用两条独立状态轴：Member publication 决定 `Draft / Published / Withdrawn`；Editorial curation 决定 `Not selected / Selected / Editing / Curated / Needs recheck / Removed`。
- 同一语言的一次创作始终只有一条 Article。Editor 在该记录的版本历史上修改，不创建“官方版”副本。
- `author` 始终指向原成员的 Person。编辑操作者进入审计，不替代公开 byline。
- Person 页读取作者全部 Member Published Article；Home、Stories、Guides、Topics、Places、Purpose 和站方推荐只读取 `Published + Curated`。
- Editor 移除策展不撤回个人文章；Member 撤回同时移除个人与官方公开。
- Member 修改已 Curated Article 时，同一 Article 继续在个人空间公开，策展状态进入 Needs recheck 并暂时退出官方入口。
- Story/Guide 是站方分类，不决定 Article 的永久身份。分类变化不得改变 canonical；现有公开 URL 必须用永久重定向或兼容路由保护。具体稳定路由在 schema migration 前形成实施决定。
- 英语和西班牙语继续使用 translation group 下的独立 Article；“一个文档”禁止同语言成员版/站方版重复，不合并不同语言记录。
- Person 是公开身份，Member、Editor、Super Admin 是账户能力；Editor/Super Admin 关联 Person 后也可以作为成员发文。
- Member 可直接维护自己的 Person，保留版本、暂停和恢复能力；不再为每次公开资料修改强制走 Editor apply revision。

## Consequences

- 现有公共页面的视觉结构和作者链接可以保留，但公共 loader 必须拆成个人公开与官方策展两个 read model。
- 现有单一 `workflowStatus`、Author transition、Profile revision gate、媒体/来源统一发布门槛、格式派生 URL 与测试夹具需要重构。
- Member 后台从投稿工作台变成 `My work / My profile`；Editor 后台从审核队列变成候选与策展工作台。
- 站方对 Curated 内容承担更强的来源、媒体、Freshness 和分类责任；个人发布只保留安全与最低可读性门槛。
- 流量归因保持稳定：官方入口进入同一 Article，再进入原 Person 与其外部渠道。

## Recovery And Migration

- 现有公开 Article 迁移为 `Member Published + Curated`，保留 ID、author、translation group、正文、媒体、时间与 workflow history。
- 在路由变化前建立旧 URL 清单；上线后永久兼容并验证 canonical、locale alternate、分享链接与 sitemap。
- migration 必须支持临时 PostgreSQL 的 apply、rollback/reapply 和 Production-shape 恢复；Production 前建立备份。
- 任何自动迁移不得创建副本、改变署名或向未确认内容赋予新的官方策展范围。

## Supersession

本决定仅替代 [`ADR-0006`](0006-editorial-cms-foundation.md) 中关于 Article 审核状态、Author 禁止公开、Person revision 必审和统一公开门槛的产品工作流。ADR-0006 的同应用 Payload、PostgreSQL、语言独立记录、服务端权限、版本审计、Media 隔离和 migration 纪律继续有效。
