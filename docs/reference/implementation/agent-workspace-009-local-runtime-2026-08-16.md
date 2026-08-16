---
doc_contract: DocContractV1
doc_type: reference
authority: evidence
status: active
scope: agent-workspace-009-local-runtime
last_verified: 2026-08-16
max_lines: 100
---

# AGENT-WORKSPACE-009 Local runtime

## 结果

`AGENT-WORKSPACE-009` 完成实现、Local 工作项验证和一次独立终局复审，P0/P1/P2=`0/0/0`，并合入本地 `main`（`83ce74f`）。Agent 注册表由 26 个增至 30 个工具；新增首页排期 prepare/commit 与固定 `major_edit` 作者通知 prepare/commit。本批没有 schema、migration、Payload collection、Admin UI、010、复核工具或通用动作平台改动。

## 首页排期边界

- 只接受 `none` 或带完整 RFC 3339 时间窗的 `lead / selected`；`none` 清空 placement/start/end，其他目标要求 end>start。
- prepare 只创建 pending AgentEvent。commit 重检当前角色、connection、Article row、live 状态、latest version、revision 与 confirmation，只以 `draft:false` 更新三个 homepage 字段并读回受保护字段不变量。
- 对象必须为 live `published + curated + _status=published`。latest Payload version 若为 autosave 或非 published 均失败关闭；真实 pending autosave 负例证明 live Article、公开页状态和版本未被排期动作提升或覆盖。

## 作者通知边界

- 输入不能提供 kind、recipient、邮箱、标题、正文或 provider；服务端固定既有 `major_edit` 模板，并在 prepare/commit 中绑定 Member Article 当前 owner 与 HMAC recipient digest。Agent 输出和 AgentEvent 不含邮箱、文案、notification key、provider error 或 confirmation ref。
- prepare 不创建 WorkflowEvent、不调用 provider。首次 commit 先持久化唯一 deterministic-key WorkflowEvent，再按 event row lock 投递；failed/pending 的同指纹原 commit 只重试 stored event，sent/not_required 重放只读回。
- Local 使用 `not_required` 且 attempts=0。测试进程内 synthetic provider 覆盖 timeout→failed→同 event retry→sent、sent replay 与并发同 commit；event ID、key、recipient 不变，且没有第二事件或重复调用。

## Local 正反例

全新专用 scratch database 完成 15 条既有 migration 后运行真实 Payload 与 MCP Gateway。正例覆盖排期 set/clear/recovery、公开读回、版本增加、幂等重放、Editor/Super Admin、固定通知、失败重试、并发合流和 Local `not_required`。

负例覆盖 Member discovery/直调、paused/降权/role 变化、revoked connection、disabled client、stale/expired/tampered confirmation、未公开/未策展/pending autosave、非法时间窗、site-authored、owner 缺失/不可用、伪造通知字段和审计隐私。既有 selected/removed/needs_recheck 通知与网页 `major_edit` endpoint 保持不变。

## 验证

- `npm --prefix apps/web run test:agent` — PASS；合同、strict schema、30 工具、confirmation 域隔离与权限负例通过。
- 全新专用 scratch `npm --prefix apps/web run test:agent:live` — PASS。
- 独立 scratch `npm --prefix apps/web run test:editorial` — PASS；普通排期不触发 workflow，deferred helper 在 Local 为 `not_required`，既有编辑通知回归通过。
- `npm --prefix apps/web run typecheck` — PASS。
- `npm --prefix apps/web run lint` — PASS，只有 48 条既有 migration warning，0 error。
- `npm --prefix apps/web run build` — PASS。
- `npm run governance:check`（含 change intake）与 `git diff --check` — PASS；变更路径均被 009 合同覆盖。
- 未主持实现者独立终局复审 — PASS，P0/P1/P2=`0/0/0`；合入后 `test:agent` / typecheck PASS。

## 剩余门禁

本批只剩 Preview、`main` push、Production deploy、真实账户/数据、Production 首页状态和真实外部通知，统一进入 011 发布门；009 不再扩代码。
