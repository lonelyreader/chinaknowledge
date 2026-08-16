---
doc_contract: DocContractV1
doc_type: reference
authority: evidence
status: active
scope: agent-workspace-008-local-runtime
last_verified: 2026-08-16
max_lines: 100
---

# AGENT-WORKSPACE-008 Local runtime

## 结果

`AGENT-WORKSPACE-008` 在专用分支完成实现与 Local 工作项验证。Agent 注册表由 23 个增至 26 个工具；新增 `editorial_attention_list`、`editorial_reference_options`、`editorial_save_site_fields`，并扩展 `editorial_article_get` 的 Body V2 与站方字段读回。本批没有 schema、migration、Payload collection、Admin UI、009 或 010 改动。

## 实现边界

- Needs attention 固定为已公开 Article 中的 `not_selected / needs_recheck`，只接受 EN/ES、本人/未分配与最大 50 条分页；最近 workflow event 按 Article 精确读取。
- Reference options 只开放 assignee、四类 taxonomy 与已批准公开使用的 cover。普通 Editor 只看到本人 assignee，不以 `overrideAccess` 读取其他 User；Super Admin 只看到 active Editor / Super Admin。
- `editorial_article_get` 保持默认 Body V1，按请求返回 Body V2，并读回 assignee、format、四类分类 ID/名称、完整 source notes、freshness、editor comments、cover、public effect 与 revision。
- `editorial_save_site_fields` 只更新白名单站方字段；Editor assignee 仅本人或 `null`，Super Admin 仅 active editorial role。保存使用当前角色重检、actor/Article/Media 锁、revision、幂等、Payload access/hooks/versions、写后读回和受保护字段前后不变量。
- 保存事务对全部传入 taxonomy ID 去重排序后逐项加共享锁，再读取并验证存在性和 dimension；并发修改维度时保存等待锁释放，并按锁后的当前维度失败关闭。
- 普通保存不写 owner、author、locale、translation、正文、个人公开、curation/workflow、homepage 或通知。Curated Article 的完整性继续由现有 Article hook 权威重检；失败整事务回滚。

## Local 正反例

全新 scratch database 完成 15 条既有 migration 后运行真实 Payload 与 MCP Gateway。正例覆盖固定队列、六类 reference、Body V2、完整站方字段、公开页即时读回、版本、幂等重放、并发单胜、Editor 本人分配和 Super Admin active-role 分配。

负例覆盖 Member discovery/直调、任意 assignee/status/where 类输入、其他或 paused assignee、跨 taxonomy、taxonomy dimension 并发变化、未批准 cover、非法来源、未知 comment row、stale revision、同键异参、site-authored save、curated 不完整回滚和受保护字段 schema；审计只保存 hash 与 reference kind，不含正文、完整核对或评论。没有写入真实账户、真实数据、Preview 或 Production。

## 验证

- `npm --prefix apps/web run test:agent` — PASS。
- 全新专用 scratch `npm run test:agent:live` — PASS。
- 独立 scratch `npm run test:editorial` — PASS；普通站方保存保持状态且不产生 workflow/notification，curated 完整性失败回滚。
- `npm --prefix apps/web run typecheck` — PASS。
- `npm --prefix apps/web run lint` — PASS，只有 48 条既有 migration warning，0 error。
- `npm --prefix apps/web run build` — PASS。
- `npm run governance:check`（含 change intake）与 `git diff --check` — PASS；13 条变更路径均被 008 合同覆盖。
- 独立终局复审的 taxonomy dimension 并发 P2 已最小修复并定向复核 PASS，最终 P0/P1/P2=`0/0/0`；合并 `1648b34` 后 `test:agent` / typecheck PASS。

## 剩余门禁

Local 与独立复审已关闭；本批只剩 011 统一 Preview/release。`main` push、Production deploy、真实账户/数据、公开状态和外部通知继续保留发布门。
