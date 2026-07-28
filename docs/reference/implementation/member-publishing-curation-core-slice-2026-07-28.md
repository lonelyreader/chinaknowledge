---
doc_contract: DocContractV1
doc_type: reference
authority: evidence
status: active
scope: member-publishing-curation-core-slice
last_verified: 2026-07-28
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
- 新建 Article 由服务端绑定当前账户的 Person 与 owner，自动生成稳定 slug，并使用草稿自动保存；成员和 Editor 可在登录态预览最新草稿，预览页禁止索引且匿名访问返回 404。
- 新账户自动得到 Person 草稿；Super Admin 可暂停账户，暂停后登录和既有 API session 均被服务端拒绝。
- Member 可直接维护 Person 与外链；草稿资料允许不完整，公开时强制头像、身份、介绍、地点和语言。
- Member 自有媒体可在个人公开内容中使用；进入站方策展时仍要求 Editor 的公共使用确认、封面、来源、分类及 Guide freshness。
- Production indexable 环境生成 sitemap；非索引环境保持空 sitemap 和 robots disallow。

## 自动化证据

- 临时 PostgreSQL：从空库执行全部 7 条 migration PASS。
- Recovery：整批 rollback 后重新执行全部 migration PASS。
- `npm run test:editorial` PASS：Article count 保持 1、原 byline 不变、13 条双轴事件、最终 Published + Curated；同时覆盖最新 autosave 提升为公开版本、个人未策展文章、Editor 作为 Member、账户自动建 Person 与暂停负例。
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

## 尚未完成

- 事务通知与通知重试。
- 英西成对 fixture、metadata/sitemap 全矩阵、无障碍和正式 390px/桌面验证。
- 旧 Production 数据形状恢复夹具、Preview migration、非主持独立复审。
- Production 备份、migration、真实 Ge Xu 内容原地映射、public routing 与部署。

Production 当前仍运行旧单轴工作流；本页所有新能力只存在于未提交的本地实现树与临时数据库。
