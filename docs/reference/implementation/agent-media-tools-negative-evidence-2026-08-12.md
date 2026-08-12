---
doc_contract: DocContractV1
doc_type: reference
authority: evidence
status: active
scope: agent-media-tools-negative-evidence
last_verified: 2026-08-12
max_lines: 120
change_id: INFRA-AGENT-MEDIA-001
---

# Agent Media Tools 权限负例证据

## Verdict

INFRA-AGENT-MEDIA-001 合同要求的四类权限负例全部被拒绝并写入 Agent 审计事件流；白名单外 embed URL 在 schema、内容转换和服务三层都被拒；V1 客户端行为不变，含媒体正文对 V1 读取显式返回 `UNSUPPORTED_CONTENT`，不静默丢弃。证据由 `apps/web/tests/agent-http.ts`（mock Payload 的服务级断言）与 `apps/web/tests/agent-contracts.ts`（转换合同断言）固化，`npm run test:agent` 全过。

## 负例矩阵

| # | 合同负例 | 触发方式 | 结果 | 审计 |
|---|---|---|---|---|
| 1 | 引用他人未公开 media 的 image 块 | `article_create_draft` V2 正文 image 块指向 `uploadedBy: 99`、未公开的 media | `FORBIDDEN`，报错指明 Body image 归属规则，未产生任何写入 | `article_create_draft / failed` |
| 2 | `article_set_cover` 指向他人未公开 media | 本人文章 + 他人 media，revision 正确 | `FORBIDDEN`，事务回滚，无 articles update | `article_set_cover / denied` |
| 3 | 跨成员文章 set cover | 他人文章（`owner: 99`）+ 本人 media | `FORBIDDEN`（非属主），无 articles update | `article_set_cover / denied` |
| 4 | 暂停账户使用新工具 | `accountStatus: "paused"` 下调用 `media_upload` 与 `article_set_cover` | 均 `ACCOUNT_PAUSED`，无媒体创建、无文章更新 | `media_upload / denied / account`、`article_set_cover / denied / article` |

## 相邻负例

- 白名单外 embed：`https://vimeo.com/...` 在 `article_create_draft` V2 正文返回 `VALIDATION_ERROR`（服务层 `extractYouTubeVideoID` 复用）；`agentBodyToLexical` 与 `lexicalToAgentBodyV2` 各自显式抛错；gateway zod schema 只放行 `youtube` 块 URL 字符串本身，最终校验以服务端为准。
- V1 兼容：`article_get_working_copy` 默认仍返回 V1，含 upload/block 节点的正文显式失败；`AgentArticleBodyV1` 版本的写入不接受 image/youtube 块（`TypeError` → `VALIDATION_ERROR`）。
- 上传输入：非 base64 数据与非 `image/*` mimeType 均 `VALIDATION_ERROR`，解码后限 10 MB。

## 审计事件

- `media_upload` 复用既有 agent-events 流：写入前 `pending` 预留（幂等 digest 唯一索引），成功后 `success`；`objectType` 使用既有枚举中的 `account`（media 无枚举值，schema 冻结不改），media ID 记入 `objectId`。
- `article_set_cover` 与既有文章写工具相同：`pending → success/conflict`，拒绝路径由 `auditReadFailure` 记 `denied`。

## 验证命令

- `npm run test:agent`（contracts / http / routes / fixtures / oauth-model / schema 全过，2026-08-12）
- `npm run typecheck`、`npm run lint`（0 error）
- `npm run governance:check`、`git diff --check`

## 边界说明

- 证据来自 mock Payload 的服务级测试；`tests/agent-live.ts`（真实数据库直跑）不在本合同 allowed_paths 内，其 capabilities 工具清单断言在启用新工具后需要随后续批次更新。
- Preview/Production 环境验收与独立复审按 checklist 门禁另行执行。
