---
doc_contract: DocContractV1
doc_type: current
authority: canonical
status: active
scope: implemented-app-features
last_verified: 2026-08-27
max_lines: 200
feature_registry_contract: FeatureRegistryV1
implementation_fingerprint: sha256:931e890c078618f45824aed8ec867741735be061b6e0dbea60fdc4ddc007fe70
---

# App 功能登记册

这份登记册回答一个问题：**China, in Fact 现在已经能为不同的人做什么。**它只记录当前代码和已验证运行事实，不记录计划、愿望或“以后可以做”的能力。

阅读方法：先按自己的用户类型查找。Editor 和 Super Admin 如果同时关联了 Person，也拥有 Member 的作者功能。每条编号是长期稳定的功能身份；功能改名、改变行为、改变权限、换入口或下线时，都更新原条目，不另建一份“新版清单”。

## 访客与读者（无需登录）

| 编号 | 当前功能 | 人能得到的结果 | 主要入口与边界 |
|---|---|---|---|
| RDR-01 | 英语与西班牙语网站 | 浏览两套语言界面；只在目标语言页面真实存在时显示对应语言入口 | `/en`、`/es`；文章、人物和地点使用真实 alternate/canonical 地址 |
| RDR-02 | 人物连接首页 | 先按姓名、地点或兴趣找人，再浏览公开人物、他们当前的工作、Discord、来自社群的 Stories/Guides 和 Newsletter | `/{locale}`；人物与工作来自公开 Person/contribution，Figma 示例和私密 Discord 内容不进入页面 |
| RDR-03 | Stories | 浏览站方选中的报道、观察、分析、评论和第一人称内容 | `/{locale}/stories` |
| RDR-04 | Guides | 浏览带来源、时效和维护信息的实用指南 | `/{locale}/guides` |
| RDR-05 | 稳定文章页 | 阅读标题、摘要、正文、封面或站方视觉、来源、日期和署名；正文可包含作者插入的图片（含说明文字）和 YouTube 视频，视频经 youtube-nocookie 惰性加载并保持 16:9；Member 稿进入作者主页，站方稿进入 About | `/{locale}/posts/{slug}`；旧 Stories/Guides 详情地址会永久转到稳定地址；正文只渲染白名单媒体节点，其他节点安全忽略，不输出原始 HTML |
| RDR-06 | 个人公开文章 | 阅读 Member 已公开但未被站方选中的文章 | 文章稳定地址和作者主页；不会进入首页、Stories、Guides 等官方入口 |
| RDR-07 | Places | 浏览地点列表和地点详情，查看与该地点关联的文章和人物 | `/{locale}/places`、`/{locale}/places/{slug}` |
| RDR-08 | Purpose 入口 | 按 Understand、Visit、Live、Study、Work、Business 找到站方内容 | `/{locale}/purposes/{slug}` |
| RDR-09 | Topic 入口 | 按主题聚合站方内容 | `/{locale}/topics/{slug}` |
| RDR-10 | People 连接目录 | 直接搜索并连续浏览人物；每行显示肖像、姓名、身份、地点、当前工作，以及真实主题或能帮什么，可按主题、地点、语言筛选和分页 | `/{locale}/people`；无 Spotlight、人物判词开场、人数或排名；桌面每页 24 人，移动端每页 12 人；缺失字段隐藏 |
| RDR-11 | Person 连接主页 | 先查看肖像、姓名、身份、地点、语言/主题和公开连接动作，再看当前工作、能帮什么、全部公开贡献和 About | `/{locale}/people/{slug}`；Discord 与其他外链只在已有公开链接时出现；Current work、Can help with、贡献等无数据整体隐藏；西语资料缺失时回退英语 |
| RDR-12 | 人物导流 | Member 稿从首页、栏目、文章进入原作者主页；站方稿只在确有相关人物时提供人物入口 | 文章署名区和 Related people；站方稿不生成虚构 Person |
| RDR-13 | Discord 联系入口 | 从全局导航和首页进入公开社群；从 Person 页经唯一的 `Connect on Discord` 进入成员本人公开 Discord | 全局与首页使用现有公开邀请；CMS Person 无 discord link 时不显示成员动作；不镜像聊天、人数或活动状态 |
| RDR-14 | Newsletter 订阅 | 用邮箱和明确同意加入对应语言的邮件名单，收到成功或必要错误状态 | 首页与 `/{locale}/newsletter`；重复邮箱更新语言，不替用户重新开启已取消订阅状态 |
| RDR-15 | About 与 Privacy | 了解产品定位、Newsletter 数据用途、公开人物资料、跟踪政策和联系邮箱 | `/{locale}/about`、`/{locale}/privacy` |
| RDR-16 | 搜索引擎入口 | Production 可被索引，并提供 Article JSON-LD、分享信息、sitemap、canonical 和多语言 alternate；Preview 与草稿预览不索引 | `/robots.txt`、`/sitemap.xml` 与页面 metadata；Purpose、Topic 和已公开内容进入 sitemap |
| RDR-17 | 响应式和键盘访问 | 在桌面与移动端使用主导航、移动菜单、表单、焦点状态和语义化页面 | 全部公共页面；当前本地验收覆盖 1440px、768px、390px 与 EN/ES，Production 仍是上次发布版本 |
| RDR-18 | 不存在页面处理 | 无效人物、文章或地点返回 Not Found，并提供回到网站的入口 | 各动态详情页 |
| RDR-19 | 一致品牌系统 | 在公共页面看到同一轮廓字标、暖纸/墨色/朱砂语义颜色、Geist 产品字体、Newsreader 阅读字体与统一的间距、圆角、边框和控件状态 | 全部 `/{locale}` 公共页面；本地 Token 批次已完成，字标与 favicon 仍使用固定资产且不依赖客户端字体，Production 仍是上次发布版本 |

## Member（铲子计划成员）

Member 是有后台账户并关联 Person 的内容作者。文章公开由本人决定，不需要提交站方审核。

| 编号 | 当前功能 | 人能做到的事情 | 主要入口与边界 |
|---|---|---|---|
| MEM-01 | 登录和密码设置 | 使用 24 小时有效的最新邀请/重置邮件设置密码并登录后台；失效链接在填写密码前提供重新申请入口；连续失败会触发临时锁定 | `/admin`、`/admin/reset/:token`；重发会使旧链接失效，暂停账户不能登录 |
| MEM-02 | My work | 登录后查看自己的最近文章、语言、个人公开状态、站方选择状态和下一动作 | `/admin`；只显示本人文章，支持进入全部个人文章 |
| MEM-03 | 新建文章 | 从 My work 进入 Payload 原生 Article 新建页，选择 English 或 Español 后开始写作 | My work 的 New article；作者、owner 和稳定身份由服务端建立 |
| MEM-04 | 文章写作 | 编辑标题、摘要、富文本正文和封面；封面可在文章内上传、预览、替换或移除；正文可插入本人上传的图片（含说明文字）和 YouTube 视频嵌入 | Article 的 Writing 模式；正文图片仅限 media 库且服务端校验归属（他人未公开图片被拒绝），视频嵌入仅接受 YouTube 链接且由服务端校验，非白名单地址被拒绝；发布时正文图片随文公开 |
| MEM-05 | 保存状态与失败恢复 | 使用 Payload 原生 Saving、Last saved 和错误反馈；Article 自动保存，失败后保留本地内容并在后续周期重试 | Article/Person 编辑页；重试期间继续输入不会被旧版本覆盖 |
| MEM-06 | 并发与离页保护 | 看到其他编辑者的锁定状态；未保存时阻止误离开；避免静默覆盖 | Article 与 Person 编辑页，锁定时长 5 分钟 |
| MEM-07 | 版本历史 | 查看和恢复 Article、Person 的历史版本；自动保存版本状态与界面同步 | 后台版本入口；每个文档最多保留 50 个版本 |
| MEM-08 | 登录态预览 | 在公开前预览自己的文章和 Person；预览页不会被搜索引擎索引 | Article/Person 的 Preview |
| MEM-09 | 个人发布 | 将草稿直接公开、更新公开文章、撤回或重新公开 | Article 的 Personal publication；未被站方选择也有稳定公开页 |
| MEM-10 | 原作者身份保护 | 无论站方怎样编辑或分类，公开署名仍指向原 Member，文章仍是一条记录 | 所有 Article；Member 不能把文章改成他人作品 |
| MEM-11 | 双语文章关联 | 为自己的 English 文章建立 Español 版本，或反向建立 English 版本 | Article 的 Add English/Spanish version；007 Local Agent 也可从本人 Article 建立唯一的另一语言私有 draft；两种语言独立保存和公开 |
| MEM-12 | My profile | 持久进入自己的 Person 编辑页，不必在 People 全量列表中寻找自己 | 后台主导航 My profile |
| MEM-13 | 双语个人资料 | 维护共享姓名、汉字姓名、头像、语言、主题，以及英语/西语的身份、地点、介绍、本人引语和「能帮什么」 | My profile 的 Profile、English、Español 分区；007 Local Agent 只保存本人同一白名单；编辑传记与判词只由 Editor 维护 |
| MEM-14 | 头像管理 | 在个人页内上传、预览、替换、编辑或移除头像，并填写图片说明 | My profile；站方是否把媒体用于策展入口由 Editor 另行确认 |
| MEM-15 | 个人外链 | 最多维护 8 个个人网站、Newsletter、社交、Email 或其他链接；可改标签、顺序和删除 | My profile 的 Links；007 Local Agent 支持同一完整列表与 X；网页和 Agent 普通链接限 http/https，Email 限 mailto |
| MEM-16 | 个人页公开控制 | 预览、公开或转为不公开自己的 Person | Profile 动作区；007 Local Agent 从资料读取返回 Preview path，可见状态只经 prepare/commit；有公开文章时需先撤回文章，被 Super Admin 暂停时不能自行恢复 |
| MEM-17 | 私有内容隔离 | 读取和修改自己的草稿、版本及未采用媒体，但不能读取其他 Member 的私有内容 | 后台和 API 均由服务端校验；007 Local Agent 的 Profile、媒体、文章与 translation 工具固定当前 Person/owner |
| MEM-18 | 站方变更通知 | 在文章被选择、重大编辑、需要复核或撤出时接收事务邮件 | 邮件发送失败不回滚文章状态，可由站方安全重试 |

## Editor（站方编辑）

Editor 负责选择和组织成员已经公开的内容。若 Editor 账户同时关联 Person，也拥有上面的全部 Member 功能。

| 编号 | 当前功能 | 人能做到的事情 | 主要入口与边界 |
|---|---|---|---|
| EDT-01 | Needs attention | 默认看到未选择和待复核文章，按 EN/ES、本人负责、未分配筛选 | `/admin`；显示作者、负责人、最后动作、更新时间和下一动作；008 Local Agent 提供同一固定查询与最大 50 条分页 |
| EDT-02 | 策展队列 | 查看 Not selected、Needs recheck、Selected、Editing、Site selected、Removed 六类数量和列表 | 后台首页 Queues；All articles 是次级全量入口 |
| EDT-03 | 同文档编辑 | 在原 Member 的同一 Article 上修改正文、核对和整理，不生成“官方副本” | Article 的 Site 模式；公开署名保持原作者 |
| EDT-04 | 负责人分配 | 给文章指定 Editor，支持按本人负责或未分配查找任务 | Article 与 Needs attention；008 Local Agent 中 Editor 只能分配本人或清空，Super Admin 只能分配 active Editor / Super Admin |
| EDT-05 | 内容分类 | 设置 Guide、Reporting、Analysis、First person、Update，并关联 Purpose、Topic、Geography、Situation | Article 的 Site 模式；008 Local Agent 可读取白名单引用并普通保存这些站方字段 |
| EDT-06 | 来源与时效 | 记录来源、核对说明、Freshness 日期和编辑意见 | Article 的 Site 模式；008 Local Agent 可完整读写这些站方字段，核对说明不对匿名读者公开 |
| EDT-07 | 媒体公开确认 | 核对封面、图片说明和媒体公开使用状态 | Article/Images；008 Local Agent 只列出并保存已获站方确认的封面 |
| EDT-08 | 站方选择流程 | Select、Editing、Add to site、Remove from site，并在正式加入网站前查看标题、作者、栏目、语言、URL、封面、来源、分类和时效检查；Agent 可对一篇明确的跨作者 Article 读取、确认 Add 并确认 Remove | Production Agent Gateway 仍只开放 exact read 与确认后的站方收录；008 Local 分支增加队列、Body V2/站方字段读取和普通保存，但不改变个人公开或站方选择状态 |
| EDT-09 | 首页排期 | 设置 Lead/Selected 位置及开始、结束时间；没有人工排期时由合格内容自动回退 | Article 的 Site 模式和首页；009 Local Agent 对已公开、已策展且无 pending draft 的 Article 提供确认后设置/清空，只改三项首页字段 |
| EDT-10 | 更新复核 | Member 修改已被选择的文章后，文章自动进入 Needs recheck 并暂离官方入口；Editor 可重新确认 | Needs attention 与 Article |
| EDT-11 | 作者通知 | 从文章向原作者发送策展相关事务通知；失败会被记录且可重试 | Article 的 Notify author；009 Local Agent 固定 `major_edit`，服务端决定 owner 邮箱与文案，失败只重试同一 WorkflowEvent，Local/Preview 为 `not_required` |
| EDT-12 | 编辑/写作模式分离 | 当 Editor 同时是作者时，可在 Writing 与 Site 两个聚焦界面间切换 | 自己的 Article；编辑他人文章时只进入 Site 模式 |
| EDT-13 | 中文母稿 | 用中文维护站方选题、结构化详细攻略、来源、权利、风险、核验与翻译状态，作为英西稿共同真相 | Chinese masters；只对 Editor/Super Admin 可读，事实提纲不算母稿，批准前必须通过详细攻略结构、来源与权利检查 |
| EDT-14 | 机构署名内容 | 建立不依附 Member 的站方 Article，并固定显示 `China, in Fact` | Site Article；必须关联同一份已批准中文母稿，不创建虚构 Person，不向作者发送通知；010 Local Agent 为 Super Admin 提供合格母稿读取、同组 EN/ES 私有 draft 创建与 pending working-copy 保存，公开仍只经既有 release 动作 |

## Super Admin（超级管理员）

Super Admin 包含全部 Editor 能力，并负责账户、权限、全站基础对象和审计。

| 编号 | 当前功能 | 人能做到的事情 | 主要入口与边界 |
|---|---|---|---|
| ADM-01 | 成员邀请 | 用姓名、邮箱和 Member/Editor 角色邀请账户，并发送 24 小时有效的密码设置邮件 | Members 的唯一开户入口；同一邮箱和 Person 关系保持唯一，只有最新链接有效 |
| ADM-02 | 重发邀请 | 对尚需激活的账户重新发送密码设置邮件，并明确旧链接随即失效 | Members；邮件和后台成功状态均说明 24 小时与最新链接规则 |
| ADM-03 | 角色管理 | 在 Member、Editor、Super Admin 之间调整后台权限 | Members；普通用户不能修改自己的角色 |
| ADM-04 | 暂停与恢复 | 暂停账户登录或恢复访问，不删除 Person、文章、版本和审计记录 | Members |
| ADM-05 | Person 管理 | 创建、编辑、预览、公开或转私有任意 Person，设置 Spotlight 排除/临时置顶，并保护已有文章的人物不被误删 | People；全站同时至多一人临时置顶 |
| ADM-06 | Categories 管理 | 维护 Purpose、Topic、Geography、Situation 等分类及英西名称、slug | Categories |
| ADM-07 | Places 管理 | 维护地点名称、摘要、封面、所属 Geography、英西 slug 与公开状态 | Places；地点页自动聚合相关人物和文章 |
| ADM-08 | Images 管理 | 查看和管理图片、上传者、图片说明和公开使用状态 | Images；创建、读取、修改和删除均受角色权限控制 |
| ADM-09 | Activity 审计 | 查看文章发布、策展、通知等工作流事件及操作者、前后状态和时间 | Activity 记录只读；Production Agent 仍是最近 20 条最小读取。010 Local Agent 增加最大 50 条分页、首屏 `asOf` 与 axis、Article、通知 kind/status 固定筛选，仍不返回任意查询、正文、邮件或内部错误 |
| ADM-10 | 全量内容管理 | 访问全部 Chinese masters、Articles、People、Images、Categories、Places 和 Members | 后台主导航；权限仍由服务端执行 |

## 运营与维护

这组能力服务于产品负责人或技术维护者，不是日常内容后台功能。

| 编号 | 当前功能 | 可完成的运营结果 | 入口与保护 |
|---|---|---|---|
| OPS-01 | 环境隔离 | Local、Preview、Production 使用不同数据和能力；配置冲突会在启动时失败 | 环境校验；Production 强制 CMS、Blob、邮件和 HTTPS 主地址 |
| OPS-02 | Preview 保护 | Preview 使用测试数据、SSO 保护和 noindex，不自动复制 Production 个人数据 | Vercel Preview |
| OPS-03 | 健康检查 | 外部系统可确认 App 与数据库可响应 | `/api/health` |
| OPS-04 | 数据库迁移 | 以有序 migration 升级 CMS schema，并提供状态、整批回滚屏障和恢复测试 | `cms:migration:*` 与 migration recovery test |
| OPS-05 | 数据库与媒体备份 | 定时或手动导出 Production 数据和媒体清单，上传 Cloudflare R2，校验 SHA 并在隔离数据库恢复读回 | Production backup workflow |
| OPS-06 | 媒体持久化 | Preview/Production 图片存入 Vercel Blob；同名图片在客户端直传前获得不同的不可变路径，原图与 `card` 缩略图保持对应；Local 使用本地存储 | Media collection、唯一上传文件名处理器与环境配置；不覆盖既有 Blob |
| OPS-07 | 事务邮件 | 通过 Resend 发送邀请和编辑通知，记录失败并支持只重试未成功任务 | 后台动作与 retry script |
| OPS-08 | Newsletter 名单 | 将有效且同意订阅的邮箱加入 Resend，并记录 EN/ES 偏好 | Newsletter API；只允许同源请求并使用隐藏反机器人字段 |
| OPS-09 | 首位管理员建立 | 在空数据库中以双重确认建立第一个 Super Admin，不在命令或日志中暴露密码 | `cms:bootstrap-super-admin`，默认只显示计划 |
| OPS-10 | 批量账户准备 | 从受控 JSON 预检或建立 Member/Editor；限制字段、批量规模和冲突 | `cms:provision-accounts`，默认 dry-run |
| OPS-11 | 搜索索引开关 | 只有明确启用的 Production 可索引；Preview 和预览内容保持 noindex | 环境变量、robots、页面 metadata |
| OPS-12 | 自动质量门禁 | PR 自动运行治理、功能登记同步、环境、migration、编辑权限、Newsletter、lint、typecheck、依赖审计、build 和公共路由 smoke | GitHub Preview checks |
| OPS-13 | Agent Gateway | 后台账号可从 Agent 经标准 OAuth/MCP 使用服务器权限内的写作、本人资料与外链、本人媒体发现、双语 draft、图片上传、封面设置、个人发布、策展和最小审计工具，并随时撤销连接；正文支持文本合同 V1 与含本人图片、YouTube 嵌入的 V2 | Production `/api/agent/*` 已发布 33 个工具；Local、统一 Preview 与 Production 已验证 Member/Editor/Super Admin 分层发现、Profile/X、文章与策展、首页排期/无邮件通知、Site draft/activity、权限负例、migration recovery 与 cleanup，012 已通过本人 X 外链写入、MCP/数据库/公开 EN/ES 三方读回。每次调用仍重检当前角色、connection、client、Person、对象关系、revision、幂等与引用权限；不支持 TRAE、静态 API key、任意 CRUD、自动翻译或 Agent 账户管理 |
| OPS-14 | 冷启动批次 | 为空环境补齐六个核心 Purpose，从受控 JSONL 幂等写入通过 `DetailedGuideV1` 门槛的中文母稿，按内容 hash 写入人工批准，再建立英西翻译并检查结构、数字、链接与来源一致性 | `cms:provision-core-taxonomies`、`cms:import-cold-start`、`cms:rebind-cold-start-release`、`cms:apply-cold-start-review`、`cms:build-cold-start-translations` 与 `cms:import-cold-start-translations`；跨环境只在已批准 hash 与译文源一致且中文标题、摘要、正文逐项相同后重绑目标 ID/hash。导入不自动公开；Super Admin 可用 MCP `editorial_release_site_article_batch` 对明确批准的 1–20 条站方 Article 逐篇执行发布、精选、幂等与读回 |
| OPS-15 | 站点测量 | 以无 cookie 的匿名聚合统计查看站点流量，并经搜索引擎工具监测索引与 sitemap 状态 | Vercel Web Analytics（前台 layout `<Analytics />`，隐私政策如实披露）；GSC 域名资源经 Vercel DNS TXT 验证并已提交 sitemap；Bing 暂缓 |

## 当前明确不提供

- 读者注册、读者个人账户、站内关注、点赞、评论、私信或个性化推荐。
- 支付、预约、服务市场、商品、排行榜或站内交易。
- Member 投稿后等待 Editor 批准的审核流程；Member 的个人公开与站方策展是两个独立决定。
- 在 App 内撰写和群发 Newsletter、管理退订或查看邮件营销分析；当前 App 只提供订阅入口，名单和发送由 Resend 承担。
- App 内 Discord 账号绑定、成员同步或聊天；当前只提供外部社群入口。
- 自动翻译文章或 Person 文案；English 与 Español 内容由人分别维护。
- 通过 Agent 执行账户邀请、角色调整、暂停/恢复、Person 管理、删除、批量动作、任意 Payload CRUD、SQL 或 CLI fallback。Production Gateway 已开放 001–004 的窄工具，但 005 只用现有 Super Admin 完成只读 smoke 和危险动作负例，没有修改真实文章、账号、角色或公开状态。
- 自动证明登记册的自然语言一定正确。机器门禁负责阻止“实现已变但登记册完全没复核”，最终语义仍由实现者和 reviewer 对照事实确认。

## 同步门禁

1. 功能登记册是当前已实现功能的唯一人类可读入口；产品定位仍在 [`product-brief.md`](product-brief.md)，运行环境和真实数据状态仍在 [`current-state.md`](current-state.md)。
2. 功能开发、下线、权限变化、路由变化、schema 变化、运维能力变化或上线状态变化，必须在同一个 active checklist 和同一个变更批次中更新本文件。
3. `npm run feature-registry:check` 对功能实现、产品事实、环境、工作流和治理脚本生成内容指纹。观察范围任一文件改变而登记册指纹未更新时，检查直接失败。
4. 更新者先按受影响用户类型修正文案，再运行 `npm run feature-registry:update` 写入新指纹；只刷新指纹而没有核对真实行为不算完成。
5. `npm run governance:check` 和 CI 都包含该检查。Reviewer 必须核对受影响功能编号、权限边界、入口和“当前明确不提供”。

主要事实入口：公共页面在 `apps/web/src/app/(frontend)`，后台能力在 `apps/web/src/cms` 与 `apps/web/src/collections`，权限在 `apps/web/src/cms/access.ts`，运行和恢复入口在 `apps/web/src/config`、`apps/web/scripts` 与 `.github/workflows`。
