---
doc_contract: DocContractV1
doc_type: reference
authority: evidence
status: active
scope: article-body-media-render-security
last_verified: 2026-08-11
max_lines: 120
---

# INFRA-BODY-MEDIA-001 渲染安全证据

供独立复审：正文富媒体（图片 upload 节点 + YouTube embed block）的白名单落点、渲染策略与负例说明。工作项合同见 `docs/roadmap/checklists/article-body-media.md`。

## 白名单校验落点（服务端）

| 层 | 位置 | 行为 |
|---|---|---|
| Lexical feature 配置 | `apps/web/src/payload.config.ts` `youTubeEmbedBlock.fields.url.validate` | 只接受可解析出 11 位 video ID 的 https YouTube 链接；validate 在 Payload 服务端写入路径执行（admin 表单同函数提前反馈） |
| Collection hook | `apps/web/src/collections/Articles.ts` `validateBodyEmbeds`（beforeValidate）与 `apps/web/src/collections/EditorialMasters.ts` `validateBodyZhEmbeds` | 遍历 richText JSON，`block`/`inlineBlock` 节点只允许 `blockType === "youtubeEmbed"` 且 URL 通过 `extractYouTubeVideoID`，否则抛 400。覆盖 draft autosave（`versions.drafts.validate: false` 不影响 hook）与任意 API 直写 |
| URL 解析规则 | `apps/web/src/collections/Articles.ts` `extractYouTubeVideoID` | 仅 https；主机白名单 `youtube.com`/`www`/`m`/`youtube-nocookie.com`/`www.youtube-nocookie.com`/`youtu.be`；路径限 `/watch?v=`、`/embed/`、`/shorts/`、`/live/`；ID 必须匹配 `^[A-Za-z0-9_-]{11}$` |

## 渲染器安全策略（读路径）

位置：`apps/web/src/components/CMSRichText.tsx`（server-only 自定义序列化器，无 `dangerouslySetInnerHTML`，从不输出原始 HTML）。

- upload 节点：仅 `relationTo === "media"`；`value` 未 populate（读者无权限）或无可用 URL 时安全忽略并 `console.warn`；alt 取 media.alt，回退 caption，再回退空串；用 `next/image`（`unoptimized`，与封面渲染一致）。
- youtubeEmbed block：渲染器自带同规则的 `extractYouTubeVideoID` 副本，iframe `src` 由提取出的 video ID 重新拼为 `https://www.youtube-nocookie.com/embed/{id}`，从不透传存储的 URL；`loading="lazy"`、`allowFullScreen`、`referrerPolicy="strict-origin-when-cross-origin"`、16:9 固定纵横比容器。
- 其他 block 类型与所有未知节点类型：`console.warn` 后返回 `null`（既不渲染子节点也不输出任何标记）。链接仍经 `safeHref` 限 `https?:`/`mailto:`/相对路径。

## 负例说明

| 负例 | 拦截层 | 结果 |
|---|---|---|
| embed URL 为 `https://evil.example/embed/x` | feature validate + collection hook | 写入被拒（400，明确报错文案）；即便入库，渲染器提不出 video ID → 忽略 |
| embed URL 为 `javascript:alert(1)` 或 http | `extractYouTubeVideoID` 要求 https 且主机白名单 | 同上双层拒绝 |
| API 直写 `blockType: "arbitraryIframe"` 的 block 节点 | collection hook 抛 400 | 入不了库；渲染器对非 `youtubeEmbed` block 也返回 null |
| 正文粘贴 `<script>` 文本 | Lexical 存为纯文本节点 | 渲染为转义文本（React text node），无 HTML 注入面 |
| upload 节点指向他人未公开 media | Payload read access（`readApprovedMediaOrOwn`）使 populate 结果为空 | 渲染器安全忽略，不泄露 URL |
| 旧渲染器遇到新节点 | 渲染层 default 分支 | 忽略 + warn，页面不破坏（恢复路径成立） |

## 验证状态

- 已执行：tsc、eslint、`next build`、`npm run governance:check`、`git diff --check`；`extractYouTubeVideoID` 12 组正/负 URL 用例与 `assertAllowedRichTextEmbeds` 5 组 guard 用例（evil 域、任意 blockType、inlineBlock、script 文本）全部按预期通过/拒绝；本地 dev server（3012）公开首页 200 冒烟。
- 未执行：浏览器主流程（编辑器插图/插视频/预览）与移动端视口验证——本地库无已公开文章且无后台凭据，留待 Preview 验收；独立复审待做。
- 生成产物：`payload-types.ts` 与 `importMap.js` 不在冻结合同 allowed_paths 内，本批 diff 保持 HEAD 原状；合并（另行批准）时必须运行 `npm run cms:types && npm run cms:importmap` 再生成（新增 `YouTubeEmbedBlock` 接口与 Blocks/Upload feature client 条目），否则 admin 编辑器新能力不可用。
