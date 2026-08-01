---
doc_contract: DocContractV1
doc_type: current
authority: canonical
status: active
scope: implemented-app-features
last_verified: 2026-08-01
max_lines: 200
feature_registry_contract: FeatureRegistryV1
implementation_fingerprint: sha256:b7532b2c5d0628537accc4aed6744375a9862b0b5ded094011c9d99ed215babe
---

# App 功能登记册

这份登记册回答一个问题：**China, in Fact 现在已经能为不同的人做什么。**它只记录当前代码和已验证运行事实，不记录计划、愿望或“以后可以做”的能力。

阅读方法：先按自己的用户类型查找。Editor 和 Super Admin 如果同时关联了 Person，也拥有 Member 的作者功能。每条编号是长期稳定的功能身份；功能改名、改变行为、改变权限、换入口或下线时，都更新原条目，不另建一份“新版清单”。

## 访客与读者（无需登录）

| 编号 | 当前功能 | 人能得到的结果 | 主要入口与边界 |
|---|---|---|---|
| RDR-01 | 英语与西班牙语网站 | 浏览两套语言界面；只在目标语言页面真实存在时显示对应语言入口 | `/en`、`/es`；文章、人物和地点使用真实 alternate/canonical 地址 |
| RDR-02 | 编辑型首页 | 查看站方主推、精选、最近更新、地点、人物和 Newsletter | `/{locale}`；只展示已公开且被站方选中的内容 |
| RDR-03 | Stories | 浏览站方选中的报道、观察、分析、评论和第一人称内容 | `/{locale}/stories` |
| RDR-04 | Guides | 浏览带来源、时效和维护信息的实用指南 | `/{locale}/guides` |
| RDR-05 | 稳定文章页 | 阅读标题、摘要、正文、封面、来源、日期和作者信息，并进入作者主页 | `/{locale}/posts/{slug}`；旧 Stories/Guides 详情地址会永久转到稳定地址 |
| RDR-06 | 个人公开文章 | 阅读 Member 已公开但未被站方选中的文章 | 文章稳定地址和作者主页；不会进入首页、Stories、Guides 等官方入口 |
| RDR-07 | Places | 浏览地点列表和地点详情，查看与该地点关联的文章和人物 | `/{locale}/places`、`/{locale}/places/{slug}` |
| RDR-08 | Purpose 入口 | 按 Understand、Visit、Live、Study、Work、Business 找到站方内容 | `/{locale}/purposes/{slug}` |
| RDR-09 | Topic 入口 | 按主题聚合站方内容 | `/{locale}/topics/{slug}` |
| RDR-10 | People 目录 | 查看每周稳定轮换的一主两辅人物，并按姓名、主题、地点、语言筛选和分页 | `/{locale}/people`；桌面每页 24 人，移动端每页 12 人 |
| RDR-11 | Person 主页 | 查看人物头像、身份、地点、介绍、主题、全部公开文章、站方精选和个人外链 | `/{locale}/people/{slug}`；西语资料缺失时回退英语 |
| RDR-12 | 作者导流 | 从首页、栏目、文章进入原作者主页，再进入个人网站、Newsletter、社交账号、邮箱或其他公开渠道 | 文章作者区、Person 外链；外链在新窗口打开 |
| RDR-13 | Discord 社群入口 | 从 Person 页面进入平台 Discord | Person 页面底部的 Discord 入口 |
| RDR-14 | Newsletter 订阅 | 用邮箱和明确同意加入对应语言的邮件名单，收到成功或必要错误状态 | 首页与 `/{locale}/newsletter`；重复邮箱更新语言，不替用户重新开启已取消订阅状态 |
| RDR-15 | About 与 Privacy | 了解产品定位、Newsletter 数据用途、公开人物资料、跟踪政策和联系邮箱 | `/{locale}/about`、`/{locale}/privacy` |
| RDR-16 | 搜索引擎入口 | Production 可被索引，并提供 sitemap、canonical 和多语言 alternate；Preview 与草稿预览不索引 | `/robots.txt`、`/sitemap.xml` 与页面 metadata |
| RDR-17 | 响应式和键盘访问 | 在桌面与移动端使用主导航、移动菜单、表单、焦点状态和语义化页面 | 全部公共页面；当前验收宽度包含 390px |
| RDR-18 | 不存在页面处理 | 无效人物、文章或地点返回 Not Found，并提供回到网站的入口 | 各动态详情页 |
| RDR-19 | 一致品牌字标 | 在公共 Header 与 Footer 看到同一单行 `China, in Fact` 轮廓字标；完整名称保持可读，朱砂红第二阅读层为 `hi, act` | 全部 `/{locale}` 公共页面；字标不依赖客户端字体 |

## Member（铲子计划成员）

Member 是有后台账户并关联 Person 的内容作者。文章公开由本人决定，不需要提交站方审核。

| 编号 | 当前功能 | 人能做到的事情 | 主要入口与边界 |
|---|---|---|---|
| MEM-01 | 登录和密码设置 | 使用邀请/重置邮件设置密码并登录后台；连续失败会触发临时锁定 | `/admin`；暂停账户不能登录 |
| MEM-02 | My work | 登录后查看自己的最近文章、语言、个人公开状态、站方选择状态和下一动作 | `/admin`；只显示本人文章，支持进入全部个人文章 |
| MEM-03 | 新建文章 | 从 My work 进入 Payload 原生 Article 新建页，选择 English 或 Español 后开始写作 | My work 的 New article；作者、owner 和稳定身份由服务端建立 |
| MEM-04 | 文章写作 | 编辑标题、摘要、富文本正文和封面；封面可在文章内上传、预览、替换或移除 | Article 的 Writing 模式 |
| MEM-05 | 保存状态与失败恢复 | 使用 Payload 原生 Saving、Last saved 和错误反馈；Article 自动保存，失败后保留本地内容并在后续周期重试 | Article/Person 编辑页；重试期间继续输入不会被旧版本覆盖 |
| MEM-06 | 并发与离页保护 | 看到其他编辑者的锁定状态；未保存时阻止误离开；避免静默覆盖 | Article 与 Person 编辑页，锁定时长 5 分钟 |
| MEM-07 | 版本历史 | 查看和恢复 Article、Person 的历史版本；自动保存版本状态与界面同步 | 后台版本入口；每个文档最多保留 50 个版本 |
| MEM-08 | 登录态预览 | 在公开前预览自己的文章和 Person；预览页不会被搜索引擎索引 | Article/Person 的 Preview |
| MEM-09 | 个人发布 | 将草稿直接公开、更新公开文章、撤回或重新公开 | Article 的 Personal publication；未被站方选择也有稳定公开页 |
| MEM-10 | 原作者身份保护 | 无论站方怎样编辑或分类，公开署名仍指向原 Member，文章仍是一条记录 | 所有 Article；Member 不能把文章改成他人作品 |
| MEM-11 | 双语文章关联 | 为自己的 English 文章建立 Español 版本，或反向建立 English 版本 | Article 的 Add English/Spanish version；两种语言独立保存和公开 |
| MEM-12 | My profile | 持久进入自己的 Person 编辑页，不必在 People 全量列表中寻找自己 | 后台主导航 My profile |
| MEM-13 | 双语个人资料 | 维护共享姓名、头像、语言、主题，以及英语/西语的身份、地点和介绍 | My profile 的 Profile、English、Español 分区 |
| MEM-14 | 头像管理 | 在个人页内上传、预览、替换、编辑或移除头像，并填写图片说明 | My profile；站方是否把媒体用于策展入口由 Editor 另行确认 |
| MEM-15 | 个人外链 | 最多维护 8 个个人网站、Newsletter、社交、Email 或其他链接；可改标签、顺序和删除 | My profile 的 Links；网页限 http/https，Email 限 mailto |
| MEM-16 | 个人页公开控制 | 预览、公开或转为不公开自己的 Person | Profile 动作区；有公开文章时需先撤回文章，被 Super Admin 暂停时不能自行恢复 |
| MEM-17 | 私有内容隔离 | 读取和修改自己的草稿、版本及未采用媒体，但不能读取其他 Member 的私有内容 | 后台和 API 均由服务端校验 |
| MEM-18 | 站方变更通知 | 在文章被选择、重大编辑、需要复核或撤出时接收事务邮件 | 邮件发送失败不回滚文章状态，可由站方安全重试 |

## Editor（站方编辑）

Editor 负责选择和组织成员已经公开的内容。若 Editor 账户同时关联 Person，也拥有上面的全部 Member 功能。

| 编号 | 当前功能 | 人能做到的事情 | 主要入口与边界 |
|---|---|---|---|
| EDT-01 | Needs attention | 默认看到未选择和待复核文章，按 EN/ES、本人负责、未分配筛选 | `/admin`；显示作者、负责人、最后动作、更新时间和下一动作 |
| EDT-02 | 策展队列 | 查看 Not selected、Needs recheck、Selected、Editing、Site selected、Removed 六类数量和列表 | 后台首页 Queues；All articles 是次级全量入口 |
| EDT-03 | 同文档编辑 | 在原 Member 的同一 Article 上修改正文、核对和整理，不生成“官方副本” | Article 的 Site 模式；公开署名保持原作者 |
| EDT-04 | 负责人分配 | 给文章指定 Editor，支持按本人负责或未分配查找任务 | Article 与 Needs attention |
| EDT-05 | 内容分类 | 设置 Guide、Reporting、Analysis、First person、Update，并关联 Purpose、Topic、Geography、Situation | Article 的 Site 模式 |
| EDT-06 | 来源与时效 | 记录来源、核对说明、Freshness 日期和编辑意见 | Article 的 Site 模式；核对说明不对匿名读者公开 |
| EDT-07 | 媒体公开确认 | 核对封面、图片说明和媒体公开使用状态 | Article/Images；未获站方确认的媒体不能进入站方策展入口 |
| EDT-08 | 站方选择流程 | Select、Editing、Add to site、Remove from site，并在正式加入网站前查看标题、作者、栏目、语言、URL、封面、来源、分类和时效检查；Local Agent 可对一篇明确的跨作者 Article 读取、确认 Add 并确认 Remove | 网页 Article Site curation；Agent 只开放 exact read 与确认后的站方收录，不开放普通保存、队列或批量能力 |
| EDT-09 | 首页排期 | 设置 Lead/Selected 位置及开始、结束时间；没有人工排期时由合格内容自动回退 | Article 的 Site 模式和首页 |
| EDT-10 | 更新复核 | Member 修改已被选择的文章后，文章自动进入 Needs recheck 并暂离官方入口；Editor 可重新确认 | Needs attention 与 Article |
| EDT-11 | 作者通知 | 从文章向原作者发送策展相关事务通知；失败会被记录且可重试 | Article 的 Notify author |
| EDT-12 | 编辑/写作模式分离 | 当 Editor 同时是作者时，可在 Writing 与 Site 两个聚焦界面间切换 | 自己的 Article；编辑他人文章时只进入 Site 模式 |

## Super Admin（超级管理员）

Super Admin 包含全部 Editor 能力，并负责账户、权限、全站基础对象和审计。

| 编号 | 当前功能 | 人能做到的事情 | 主要入口与边界 |
|---|---|---|---|
| ADM-01 | 成员邀请 | 用姓名、邮箱和 Member/Editor 角色邀请账户，并发送密码设置邮件 | Members 的唯一开户入口；同一邮箱和 Person 关系保持唯一 |
| ADM-02 | 重发邀请 | 对尚需激活的账户重新发送密码设置邮件 | Members |
| ADM-03 | 角色管理 | 在 Member、Editor、Super Admin 之间调整后台权限 | Members；普通用户不能修改自己的角色 |
| ADM-04 | 暂停与恢复 | 暂停账户登录或恢复访问，不删除 Person、文章、版本和审计记录 | Members |
| ADM-05 | Person 管理 | 创建、编辑、预览、公开或转私有任意 Person，设置 Spotlight 排除/临时置顶，并保护已有文章的人物不被误删 | People；全站同时至多一人临时置顶 |
| ADM-06 | Categories 管理 | 维护 Purpose、Topic、Geography、Situation 等分类及英西名称、slug | Categories |
| ADM-07 | Places 管理 | 维护地点名称、摘要、封面、所属 Geography、英西 slug 与公开状态 | Places；地点页自动聚合相关人物和文章 |
| ADM-08 | Images 管理 | 查看和管理图片、上传者、图片说明和公开使用状态 | Images；创建、读取、修改和删除均受角色权限控制 |
| ADM-09 | Activity 审计 | 查看文章发布、策展、通知等工作流事件及操作者、前后状态和时间 | Activity 记录只读；Agent 的 Super Admin-only 最近 20 条最小读取已完成 Local 验证与独立复审，Preview/Production 未开启 |
| ADM-10 | 全量内容管理 | 访问全部 Articles、People、Images、Categories、Places 和 Members | 后台主导航；权限仍由服务端执行 |

## 运营与维护

这组能力服务于产品负责人或技术维护者，不是日常内容后台功能。

| 编号 | 当前功能 | 可完成的运营结果 | 入口与保护 |
|---|---|---|---|
| OPS-01 | 环境隔离 | Local、Preview、Production 使用不同数据和能力；配置冲突会在启动时失败 | 环境校验；Production 强制 CMS、Blob、邮件和 HTTPS 主地址 |
| OPS-02 | Preview 保护 | Preview 使用测试数据、SSO 保护和 noindex，不自动复制 Production 个人数据 | Vercel Preview |
| OPS-03 | 健康检查 | 外部系统可确认 App 与数据库可响应 | `/api/health` |
| OPS-04 | 数据库迁移 | 以有序 migration 升级 CMS schema，并提供状态、整批回滚屏障和恢复测试 | `cms:migration:*` 与 migration recovery test |
| OPS-05 | 数据库与媒体备份 | 定时或手动导出 Production 数据和媒体清单，上传 Cloudflare R2，校验 SHA 并在隔离数据库恢复读回 | Production backup workflow |
| OPS-06 | 媒体持久化 | Preview/Production 图片存入 Vercel Blob；Local 使用本地存储 | Media collection 与环境配置 |
| OPS-07 | 事务邮件 | 通过 Resend 发送邀请和编辑通知，记录失败并支持只重试未成功任务 | 后台动作与 retry script |
| OPS-08 | Newsletter 名单 | 将有效且同意订阅的邮箱加入 Resend，并记录 EN/ES 偏好 | Newsletter API；只允许同源请求并使用隐藏反机器人字段 |
| OPS-09 | 首位管理员建立 | 在空数据库中以双重确认建立第一个 Super Admin，不在命令或日志中暴露密码 | `cms:bootstrap-super-admin`，默认只显示计划 |
| OPS-10 | 批量账户准备 | 从受控 JSON 预检或建立 Member/Editor；限制字段、批量规模和冲突 | `cms:provision-accounts`，默认 dry-run |
| OPS-11 | 搜索索引开关 | 只有明确启用的 Production 可索引；Preview 和预览内容保持 noindex | 环境变量、robots、页面 metadata |
| OPS-12 | 自动质量门禁 | PR 自动运行治理、功能登记同步、环境、migration、编辑权限、Newsletter、lint、typecheck、依赖审计、build 和公共路由 smoke | GitHub Preview checks |

## 当前明确不提供

- 读者注册、读者个人账户、站内关注、点赞、评论、私信或个性化推荐。
- 支付、预约、服务市场、商品、排行榜或站内交易。
- Member 投稿后等待 Editor 批准的审核流程；Member 的个人公开与站方策展是两个独立决定。
- 在 App 内撰写和群发 Newsletter、管理退订或查看邮件营销分析；当前 App 只提供订阅入口，名单和发送由 Resend 承担。
- App 内 Discord 账号绑定、成员同步或聊天；当前只提供外部社群入口。
- 自动翻译文章或 Person 文案；English 与 Español 内容由人分别维护。
- 通过 Agent 操作 Production 账户或文章；Agent Workspace 001–002 已完成 Local 与受控 Preview 的 Member OAuth、草稿和确认式 publication，003 完成 Local 的单 Article Editor exact read、确认 Add 和 Remove，004 完成 Local 的 Super Admin-only 最近 20 条 workflow activity 最小读取。005 adapter 只保留 Cursor、WorkBuddy、Codex、Claude、Gemini，Cursor/WorkBuddy 使用显式 HTTP MCP 配置；WorkBuddy Preview OAuth、私有 draft、跨作者拒绝、re-auth 与 revoke 已实测，Cursor 完成 callback/授权/9 tools discovery，但 Gate 2 仍缺 prepare confirmation 和 Cursor capability call。Preview 测试数据与公开 MCP 已关闭，Production 不提供该能力。
- 自动证明登记册的自然语言一定正确。机器门禁负责阻止“实现已变但登记册完全没复核”，最终语义仍由实现者和 reviewer 对照事实确认。

## 同步门禁

1. 功能登记册是当前已实现功能的唯一人类可读入口；产品定位仍在 [`product-brief.md`](product-brief.md)，运行环境和真实数据状态仍在 [`current-state.md`](current-state.md)。
2. 功能开发、下线、权限变化、路由变化、schema 变化、运维能力变化或上线状态变化，必须在同一个 active checklist 和同一个变更批次中更新本文件。
3. `npm run feature-registry:check` 对功能实现、产品事实、环境、工作流和治理脚本生成内容指纹。观察范围任一文件改变而登记册指纹未更新时，检查直接失败。
4. 更新者先按受影响用户类型修正文案，再运行 `npm run feature-registry:update` 写入新指纹；只刷新指纹而没有核对真实行为不算完成。
5. `npm run governance:check` 和 CI 都包含该检查。Reviewer 必须核对受影响功能编号、权限边界、入口和“当前明确不提供”。

主要事实入口：公共页面在 `apps/web/src/app/(frontend)`，后台能力在 `apps/web/src/cms` 与 `apps/web/src/collections`，权限在 `apps/web/src/cms/access.ts`，运行和恢复入口在 `apps/web/src/config`、`apps/web/scripts` 与 `.github/workflows`。
