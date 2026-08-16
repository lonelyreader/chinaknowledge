---
doc_contract: DocContractV1
doc_type: reference
authority: evidence
status: active
scope: agent-workspace-007-local-runtime
last_verified: 2026-08-16
max_lines: 100
---

# AGENT-WORKSPACE-007 Local runtime

## 结果

`AGENT-WORKSPACE-007` 在专用分支完成实现与 Local 工作项验证。Agent 注册表由 16 个增至 23 个工具；新增 7 个工具，没有单独的 Profile preview 工具，`my_profile_get` 直接返回 `previewPath`。本批没有 collection schema、migration、Person UI、Editor 工作台或通用 CRUD 改动。

## 实现边界

- `my_profile_get / my_profile_save / my_links_save` 固定当前 connection 绑定的 Person；输入不接受 Person ID，普通资料写入使用 revision、幂等、Person 版本和写后读回，公开 Person 返回 `immediate_public_update`。
- `my_profile_prepare_publication / my_profile_commit_publication` 使用独立 HMAC confirmation 域，重检当前角色、connection、client、Person、revision、头像和公开条件；最终写入继续走现有 Person hook 与 `profileTransitionConfirmed`。
- `my_media_list` 和增强后的 `my_articles_list` 使用当前 owner 的显式边界、最大 50 条分页和固定筛选；Article 列表返回本人 EN/ES 配对状态。
- `article_create_translation_draft` 与网页 endpoint 复用同一 helper；服务器决定目标 locale、owner、author 和 translation group，source 行锁与既有唯一索引阻止并发重复。
- MCP server 以每次请求读取的当前 User role 注册 Editor/Admin 工具，不再使用旧 token 中的 `authInfo.extra.role`。Profile 写审计使用 `objectType=account` 与 Person ID；translation 使用 `article`。

## Local 正反例

专用 scratch database 完成 15 条既有 migration 后运行真实 Payload 与 MCP Gateway。正例覆盖 Profile 全字段白名单、X 与 mailto 外链、Preview path、公开/转私有、公开资料即时影响、本人媒体/文章分页与筛选、translation 配对和当前角色升降 discovery。

负例覆盖他人未公开头像、非 Topic taxonomy、非法链接、未知受保护字段、stale revision 并发、幂等同键异参、prepare 后 Person/角色变化、跨 Member translation、重复与并发 translation、paused/revoked/expired/disabled/scope/Person 失败关闭。Profile publication confirmation 的签名域、篡改、过期和 Article/Profile 交叉解析由合同测试覆盖。没有写入真实账号、真实 Person、Preview 或 Production。

## 验证

- `npm --prefix apps/web run test:agent` — PASS。
- 专用 scratch `npm run test:agent:live` — PASS。
- 独立 scratch `npm run test:editorial` — PASS；Profile publication 与 Article translation 的共享 helper 保持网页回归。
- `npm --prefix apps/web run typecheck` — PASS。
- `npm --prefix apps/web run lint` — PASS，只有 48 条既有 migration warning，0 error。
- `npm --prefix apps/web run build` — PASS。首次使用跨 worktree `node_modules` symlink 时 Turbopack 按预期拒绝；在本 worktree 执行未改 lockfile 的 `npm ci` 后重跑通过。
- `npm run governance:check`、change intake 与 `git diff --check` 在最终文档写回后执行。

## 剩余门禁

一次独立终局复审、branch push/Preview 验收尚未执行。`main` push 会自动触发 Production，因此与 Production deploy、真实账号/数据和 Person 可见状态一起保持未授权。Person Page migration 继续由目标环境的独立 release gate 控制；007 不携带 migration。
