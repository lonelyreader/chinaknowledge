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

本页记录 `PUB-CURATION-001` 从本地实现到 Production 收口的证据。

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

- 临时 PostgreSQL：从空库执行全部 10 条 migration PASS；新增 Person 版本历史、事务通知投递状态和 `translation group + locale` 复合唯一索引。
- Recovery：无新模型写入的全新数据库完成 10 条 migration 上行与整批 rollback；清空同一临时目标后重新执行全部 migration PASS。最新受保护 migration 在整批 down 的第一步同时检查 Article 两轴/versions、Person versions、Member media、workflow axis 与 paused accounts；任一新模型写入都会在任何 schema 或身份索引被拆除前拒绝回退并要求恢复 migration 前备份，账户状态 migration 另有独立防线。
- `npm run test:migration-recovery` 可重复创建独立临时数据库，验证 clean apply/整批 rollback/清空重建，以及 populated down 在第一条 migration fail-closed 后 Person versions、account status、Article 两轴字段和 migration ledger 全部仍在；脚本结束会删除其随机临时数据库。
- `npm run test:editorial` PASS：Article count 保持 1、原 byline 不变、15 条双轴事件、最终 Published + Curated；同时覆盖普通 API publication/profile/`_status` 绕过、未公开 Person 的 Article publication、canonical 篡改、站方字段伪造、Curated 后直接改文进入 Needs recheck、个人未策展文章、本人版本隔离、Editor/Super Admin 组合权限、账户自动建 Person、暂停登录和暂停前 JWT 不再获得授权。
- `npm run typecheck` PASS。
- `npm run lint` PASS，只有已有及生成 migration 的未使用参数 warning。
- `npm run build` PASS，包含动态 `/posts`、永久 legacy route 与静态 `sitemap.xml`。
- GitHub Preview checks run [`30388465174`](https://github.com/lonelyreader/chinaknowledge/actions/runs/30388465174) 在全新 PostgreSQL 上完成 10 条 migration、治理、权限与编辑流程、Newsletter、lint、typecheck、production dependency audit、build 和公开路由 smoke，全部 PASS。

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
- Preview RC `dpl_9fpnVzGPaWN6gPJg5wFddUcHzJiQ` 完成 Member、Editor、anonymous 的桌面与 390px 复验；移动端无横向溢出，Member 工作台只保留本人发文与资料任务，Editor 保留本人发文和六个策展队列。
- Production `dpl_2gJFdjQEQ9kfyzYqRdUmnDKFJh5y` 在不接管域名的候选态完成真实 Home、英西 Article、Person、语言跳转、登录页、robots、sitemap、桌面与 390px 检查后才 promote；`chinainfact.com` 复验均为 200，运行日志 100 条中 error 与 5xx 均为 0。

## 独立复审

- 2026-07-29 两位非主持 reviewer 首轮均为 `BLOCK`，共同指出普通 API 可绕过状态动作、未策展文章可从 Home/People 进入站方内容、profile 缺版本/预览、危险动作缺确认和两轴 migration 回退会损坏语义。
- 后续每次修复都在新提交上重新复审，继续发现并关闭 `_status` 绕过、假公开 Article、同 batch 部分回退、Person/Article 语言和完整性漂移、User 删除使 owner 失联等到达路径。
- Preview 最终基线由产品/UX reviewer 与技术/权限/migration reviewer 分别给出 `PASS`，两边均为 `P0/P1/P2 = 0/0/0`；旧 BLOCK 结论未被复用。

## Production 数据与恢复

- migration 前恢复点 run [`30384139368`](https://github.com/lonelyreader/chinaknowledge/actions/runs/30384139368) 完成 dump、R2 不可变上传、SHA 读回、隔离恢复和旧 29/5 schema/count 断言。
- Production 依次执行新增 5 条 migration，最终为 33 张表、10 条 migration；users/people/articles/media/workflow events 保持 `1/1/2/2/8`。
- Ge Xu 的英西 Article 保持原 ID、slug、translation group、owner 与 author，原地映射为 `Published + Curated`；重复 locale、混合 owner、混合 author、owner/byline mismatch 和 owner/author 缺失均为 0。
- migration 后恢复点首次运行因 Docker Hub 拉取镜像时网络重置而在导出前失败；重跑 run [`30389201732`](https://github.com/lonelyreader/chinaknowledge/actions/runs/30389201732) 完成导出、R2 不可变上传、隔离恢复、33/10/10/8 断言与媒体读回，全部 PASS。
