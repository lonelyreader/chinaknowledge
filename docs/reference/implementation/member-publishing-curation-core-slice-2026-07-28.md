---
doc_contract: DocContractV1
doc_type: reference
authority: evidence
status: active
scope: member-publishing-curation-core-slice
last_verified: 2026-07-29
max_lines: 180
change_id: PUB-CURATION-001
---

# Member Publishing And Curation Core Slice

本页记录 `PUB-CURATION-001` 的本地实现证据。它不授权 Production migration、真实账户变更、事务邮件、public routing 切换或部署。

## 已实现

- Article 拆为 `Draft / Published / Withdrawn` 与 `Not selected / Selected / Editing / Curated / Needs recheck / Removed` 两条状态轴。
- Member 可直接公开、更新、撤回本人 Article；更新 Curated Article 后同一记录进入 Needs recheck。
- Editor 在同一 Article 上选择、编辑、策展和移除；服务端固定 owner、原 Person byline 和审计 actor。
- Person archive 读取全部 Member Published；Home、Stories、Guides、Topic、Purpose 与 Place 只读取 Curated。
- Article canonical 固定为 `/{locale}/posts/{slug}`；旧 Stories/Guides 详情返回 308；已公开翻译才进入 alternate。
- Person 页分别显示 Selected work 与其他 Posts，Article 标题附近和页尾均保留原作者入口。
- Member 登录首页显示 My work、New article、My profile；Editor 同时看到 New、Needs recheck、Selected、Editing 队列。
- My work 显示个人公开、站方选择、最后保存时间和下一动作；My profile 支持本人直接显隐、登录态预览和本人版本历史，撤回文章、移除策展与隐藏资料均有确认。
- 新建 Article 由服务端绑定当前账户的 Person 与 owner，自动生成稳定 slug，并使用草稿自动保存；成员和 Editor 可在登录态预览最新草稿，预览页禁止索引且匿名访问返回 404。
- 新账户自动得到 Person 草稿；Super Admin 可暂停账户，暂停后登录和既有 API session 均被服务端拒绝。
- Super Admin 可在 Users 后台邀请 Member/Editor 或重发邀请；批量脚本保留 dry-run、幂等冲突检查、Production 双确认和失败重试。
- Selected、Needs recheck、Removed 与人工确认的重大编辑会写入同一工作流审计；Production 通过 Resend 发送带稳定幂等键的事务邮件，失败不回滚内容并可由独立重试命令恢复。
- Member 可直接维护 Person 与外链；草稿资料允许不完整，公开时强制头像、身份、介绍、地点和语言。
- Member 自有媒体可在个人公开内容中使用；进入站方策展时仍要求 Editor 的公共使用确认、封面、来源、分类及 Guide freshness。
- Production indexable 环境生成 sitemap；非索引环境保持空 sitemap 和 robots disallow。
- 已公开 Article 的 locale、slug 与 translation group 不再允许改动；Member 不能通过普通 API 绕过发布动作，也不能写入分类、format、来源、freshness 或首页排期等站方字段。
- Article 的 Payload `_status` 始终由 Member publication 归一化，Member 或 Editor 不能单独改 `_status` 让个人文章消失；Person 未公开、资料不完整或不支持 Article 语言时，Article publication 会被服务端拒绝。有 Article 的 Person 不能删除；有公开 Article 的 Person 不能隐藏、清空公开必填资料或移除文章所用语言。已公开 Person 的 slug、账户归属和系统发布时间保持固定；有 Person 或 Article 的 User 只能暂停，不能删除。匿名 Article access 再次约束 author 必须仍为资料完整、公开且支持 Article 语言的 Person。People Spotlight 只从带 Curated contribution 的人物中选取，完整 People 目录仍保留全部公开人物。

## 自动化证据

- 临时 PostgreSQL：从空库执行全部 9 条 migration PASS；新增 Person 版本历史和事务通知投递状态 schema。
- Recovery：无新模型写入的全新数据库完成 9 条 migration 上行与整批 rollback；清空同一临时目标后重新执行全部 migration PASS。最新受保护 migration 在整批 down 的第一步同时检查 Article 两轴/versions、Person versions、Member media、workflow axis 与 paused accounts；任一新模型写入都会在任何 schema 被拆除前拒绝回退并要求恢复 migration 前备份，账户状态 migration 另有独立防线。
- `npm run test:migration-recovery` 可重复创建独立临时数据库，验证 clean apply/整批 rollback/清空重建，以及 populated down 在第一条 migration fail-closed 后 Person versions、account status、Article 两轴字段和 migration ledger 全部仍在；脚本结束会删除其随机临时数据库。
- `npm run test:editorial` PASS：Article count 保持 1、原 byline 不变、15 条双轴事件、最终 Published + Curated；同时覆盖普通 API publication/profile/`_status` 绕过、未公开 Person 的 Article publication、canonical 篡改、站方字段伪造、Curated 后直接改文进入 Needs recheck、个人未策展文章、本人版本隔离、Editor/Super Admin 组合权限、账户自动建 Person、暂停登录和暂停前 JWT 不再获得授权。
- `npm run typecheck` PASS。
- `npm run lint` PASS，只有已有及生成 migration 的未使用参数 warning。
- `npm run build` PASS，包含动态 `/posts`、永久 legacy route 与静态 `sitemap.xml`。

## 浏览器证据

- Member dashboard：My work、New article、My profile 可见，Curation 不可见。
- Editor dashboard：My work、My profile 与四个策展队列同时可见。
- Person：Selected work 与 Posts 分区，均链接稳定 `/posts`。
- Curated Article：显示 Story、原作者与 Person 链接。
- Personal-only Article：显示 Post，不进入官方内容流；它可以作为人物卡的个人贡献被发现。
- Legacy Story URL 最终到稳定 `/posts`，HTTP 实测为 308。
- Published Article 修改时，autosave 先保持公开旧版；点击 Update public article 后最新草稿原地替换公开版本、进入 Needs recheck、退出 Home，Person 页继续显示同一 Article ID 的最新公开标题。
- 登录态 Preview 显示未公开草稿，robots 为 `noindex, nofollow`；登出后同一 preview URL 返回 404，普通公开 URL 继续显示旧公开版本且不泄漏草稿。
- Member 侧栏只保留 People、Images 与 Articles；Users、Categories、Places 和策展队列不再干扰成员任务。
- 极窄内置浏览器视口下后台操作仍可访问；正式 390px 与桌面复验仍待 Preview RC。

## 独立复审

- 2026-07-29 两位非主持 reviewer 首轮均为 `BLOCK`，共同指出普通 API 可绕过状态动作、未策展文章可从 Home/People 进入站方内容、profile 缺版本/预览、危险动作缺确认和两轴 migration 回退会损坏语义。
- 后续每次修复都在新提交上重新复审，继续发现并关闭 `_status` 绕过、假公开 Article、同 batch 部分回退、Person/Article 语言和完整性漂移、User 删除使 owner 失联等到达路径。
- 最终代码基线 `8956ee7` 由产品/UX reviewer 与技术/权限/migration reviewer 分别给出 `PASS`，两边均为 `P0/P1/P2 = 0/0/0`；旧 BLOCK 结论未被复用。

## 尚未完成

- 英西成对 fixture、metadata/sitemap 全矩阵、无障碍和正式 390px/桌面验证。
- 旧 Production 数据形状恢复夹具、Preview migration 与 Preview 环境复验。
- Production 备份、migration、真实 Ge Xu 内容原地映射、public routing 与部署。

Production 当前仍运行旧单轴工作流；本页所有新能力只存在于本地实现与临时数据库。
