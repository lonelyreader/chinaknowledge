---
doc_contract: DocContractV1
doc_type: product
authority: canonical
status: active
scope: member-publishing-and-editorial-curation
last_verified: 2026-07-28
max_lines: 260
---

# Member Publishing And Editorial Curation Requirements

本文定义 China, in Fact 的成员发布、站方策展和人物流量分发。产品定位与公共栏目仍以 [`product-brief.md`](product-brief.md) 为准；实现现状与差距见 [`member publishing and curation audit`](reference/implementation/member-publishing-curation-architecture-audit-2026-07-28.md)。

## Outcome

铲子计划成员拥有自己的 Person 和内容空间，可以保存、预览并直接公开自己的文章，不需要投稿或等待站方批准。站方 Editor 从已经公开的成员文章中选择内容，在同一篇 Article 上编辑、核对、分类和策展，并决定是否把它分发到 Home、Stories、Guides、Topics、Places 与 Purpose 等站方入口。

读者无论从站方入口还是个人页进入文章，都看到原始成员署名，并能顺畅进入作者主页和外部链接。站方策展不制造第二篇文章，也不把署名改成 Editor 或机构。

首期继续使用同一 Payload Admin；为 Member 与 Editor 提供两个聚焦入口，不建设第二套 CMS。

## Core Terms

- **Member**：铲子计划成员；公开身份是 Person，账户能力包括维护自己的资料和发布自己的 Article。
- **Editor**：站方策展能力；选择、编辑、核对、分类和分发成员内容。
- **Super Admin**：成员与权限管理，并包含 Editor 能力。
- **Member publication**：作者决定文章是否在自己的公开内容空间出现。
- **Editorial curation**：站方决定同一篇文章是否进入官方组织和分发的页面。
- **People 与权限分离**：Person 是公开身份，Editor/Super Admin 是后台权限；同一账户可以既有 Person，又有 Editor 或 Super Admin 能力。

## R1. One Article, One Author, Two Independent States

- 同一语言的一次创作只有一条 Article；策展、编辑、分类、撤出和再次策展都在该记录及其版本历史上完成。
- `author` 始终指向原始 Member 的 Person。Editor 改写、核对或分类不改变公开署名。
- 编辑操作者、修改时间和变更内容进入版本与审计记录，不替代公开作者。
- Member publication 至少表达 `Draft / Published / Withdrawn`。
- Editorial curation 至少表达 `Not selected / Selected / Editing / Curated / Needs recheck / Removed`。
- 个人公开条件只依赖 Member publication；官方入口条件同时要求 `Published + Curated`。
- Member 撤回 Article 时，它从个人与官方所有入口消失；Editor 移除策展时，Article 仍保留在作者个人空间。
- Member 修改已经 Curated 的 Article 后，新版本继续在个人空间公开，同时自动进入 `Needs recheck` 并退出官方入口，直到 Editor 再次确认。

## R2. Member Publishing Experience

- Member 登录后首先看到 `My work` 与 `My profile`，不需要在全站集合中寻找自己的记录。
- `My work` 只列本人文章，优先显示标题、语言、个人公开状态、站方策展状态、最近保存时间与明确主动作。
- Member 可以新建、自动保存、预览、直接公开、更新和撤回自己的 Article；没有 Submit、Resubmit、Approve 或等待审核步骤。
- 新文章的作者、owner 和 Person 关系由服务端写入，客户端不能冒充其他作者。
- 个人发布的最低门槛只保护可读性与安全：语言、标题、正文、作者关系和稳定 URL；封面、摘要、来源、分类与 SEO 可逐步补齐。
- Member 可以直接维护并公开自己的姓名、头像、身份、地点、介绍、语言和外部链接；保留版本历史与 Super Admin 暂停/恢复能力，不逐次等待 Editor 应用 revision。
- 日常发文和配置个人页不得要求 CLI、数据库操作、代码修改或重新部署。

## R3. Editorial Curation Experience

- Editor 有一个候选内容入口，默认查看成员已经公开、尚未策展或需要复核的 Article。
- Editor 可以在同一 Article 上选择、编辑、核对来源、指定 `Story / Guide` 及 Purpose、Topics、Geography、Situation、Freshness，并安排官方分发。
- `Selected` 只表示站方开始处理，不改变个人公开状态；只有 `Curated` 才进入官方入口。
- 站方编辑后的公开正文仍属于同一 Article、同一稳定 URL 和同一作者页归档；禁止复制为“官方版”。
- Article 的站方入口可因分类变化而改变，canonical 身份和外部链接不得因此改变。现有 `/stories/...`、`/guides/...` 必须在路由调整时保留永久兼容。
- Guide 的来源、封面、Freshness、维护日期等较强要求只在进入官方 Guides 前强制；普通成员文章不被 Guide 标准阻断个人发布。
- Material edit 可通知作者，但不引入强制申请或审批循环。争议、侵权、安全和违法内容由 Super Admin 使用暂停或下线能力处理。

## R4. Public Distribution And Person Loop

- 每篇 Member Published Article 有稳定公开详情页，并出现在作者 `/people/[slug]` 的完整内容列表。
- Home、Stories、Guides、Topics、Places、Purpose 和站方推荐流只读取 Curated Article。
- 官方入口和文章页保持作者头像、姓名、简短身份与 Person 链接；不得只在页尾弱化署名。
- Person 页包含全部 Member Published Article，并可区分站方精选与其他文章；不得隐藏未被策展但已由成员公开的内容。
- Person 页保留个人网站、社交账号和公开渠道，使 `官方策展内容 → Article → Person → 外部渠道` 成为可验证的流量路径。
- People Spotlight 与自动匹配只能使用有公开内容且资料完整的人；它们影响曝光，不改变文章或人物的所有权。
- 官方策展标记表达站方选择与维护责任，不暗示文章由站方署名或原创。

## R5. Languages And Identity

- 英语和西班牙语仍是独立 Article 记录，以 translation group 关联；每种语言独立保存、个人公开和站方策展。
- “一个文档”指同一语言中不产生成员版与站方版两个 Article，不要求把不同语言硬塞进同一记录。
- 创建另一语言版本时复用作者、translation group 和可复用关系，目标语言正文、状态、时间和 URL 独立。
- 语言切换、alternate metadata 与 sitemap 不泄漏 Draft 或 Withdrawn 版本。

## R6. Membership And Account Lifecycle

- Super Admin 可以邀请、重发邀请、暂停和恢复 Member 或 Editor；同一邮箱和同一 Person 关系必须唯一且幂等。
- Member 邀请原子建立或关联一个 Person；拥有 Editor/Super Admin 权限的人也可以关联自己的 Person 并作为 Member 发文。
- 暂停账户不删除 Person、署名、文章、版本与审计。内容是否继续公开由独立内容状态决定。
- 成员权限、Editor 权限和 Super Admin 权限由服务端校验，不能只依靠隐藏按钮。

## R7. Media, Sources, SEO And Notifications

- Member 可以上传并使用自己的头像与文章媒体，需确认使用权；未公开草稿和未采用媒体不得被其他 Member 或匿名读取。
- 进入官方策展时由 Editor 完成媒体公开使用、来源、Freshness 与分享信息确认。
- Article 支持 SEO title、description、share image 与安全 fallback；稳定 canonical 不随策展分类变化。
- 通知服务用于邀请、站方选中、重大编辑、Needs recheck 和撤出策展。邮件失败不回滚内容状态，且可安全重试。
- Newsletter、Discord、DNS、备份和 migration 继续使用各自运营面，不复制到 CMS。

## Acceptance Journeys

1. 新 Member 激活后直接进入 My profile，完成并公开 Person；随后在 My work 新建、预览并公开 Article，全程没有提交审核。
2. Article 立即拥有稳定 URL，并出现在作者页；它不出现在 Home、Stories、Guides、Topics、Places 或 Purpose。
3. Editor 选择同一 Article，在原记录上编辑、核对和分类为 Story；公开作者仍是原 Member，数据库和公共页面都没有第二篇副本。
4. Article 进入官方 Stories 或其他被配置入口；读者从入口打开文章，点击署名进入 Person，再打开作者外链。
5. Editor 移除策展后，Article 从官方入口消失，但仍在作者页和稳定 URL 公开。
6. Member 修改已策展 Article 后，个人页立即显示新版本，官方入口暂时撤出并显示给 Editor 复核；再次确认后恢复分发。
7. Member 撤回 Article 后，个人页、官方入口、metadata 与 sitemap 都不再公开它。
8. Editor/Super Admin 同时关联 Person 时，可以发布自己的文章；公开 Person 不暴露后台权限。
9. 英西版本共享 translation group 与作者，但分别决定个人公开与官方策展；同一语言不产生“成员版/官方版”两条内容。
10. 现有 Ge Xu 英西 Article 迁移后保持作者、内容、翻译关系、外链和旧 URL 可访问，并成为 `Published + Curated`。

## Success Boundary

完成本需求意味着 100–200 名受邀成员可以独立发文和维护个人页，站方可以从中策展并把流量准确分发回原作者。它不包含公开注册、社交关注、支付、排行榜、站内私信、自动翻译、个性化推荐或完整 CRM。
