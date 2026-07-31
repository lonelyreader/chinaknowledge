---
doc_contract: DocContractV1
doc_type: reference
authority: evidence
status: active
scope: agent-workspace-001-pre-migration-review
last_verified: 2026-07-31
max_lines: 120
---

# Agent Workspace 001 — Pre-migration review

## Verdict

`PRE-MIGRATION PASS`

一名未参与主持实现的 reviewer 对当前 Local 工作树完成只读复审。当前快照没有剩余静态阻断，可以进入独立的 `migration` 门禁。这个结论不是 001 最终 PASS，也不证明运行态权限或客户端兼容已经通过。

## Reviewed boundaries

- Authorization code 以 digest、state、expiry、resource 和 `codeConsumedAt` 条件更新原子领取。
- Refresh token 原子移入 previous digest；新 token 落盘再次按 claim digest 和 active state 执行条件更新。
- DCR 对真实请求体执行 32 KB 流式上限，并限制分钟注册量、未绑定总量和有界清理过期记录。
- Agent event 将可关联的 request ID 与唯一 idempotency digest 分开；失败写入沿用响应 request ID。
- Member 工具逐次读取当前 User、Person 和 Article owner；Agent access API 即使由 Super Admin 调用也只管理当前账户的连接。
- Collection config、未执行 migration、snapshot 和 generated types 的静态字段合同一致。
- UI copy 只保留短标签、动作、状态和必要错误；没有安装说明或内部协议解释。

## Verification evidence

- `npm --prefix apps/web run test:agent`：PASS。
- `npm --prefix apps/web run typecheck`：PASS。
- `npm --prefix apps/web run build`：PASS；全部 Agent routes 被 Next 构建识别。
- `npm --prefix apps/web run lint`：0 errors；40 条既有 migration warnings。
- `npm run feature-registry:check`：PASS。
- `npm run docs:governance:check`：PASS。
- `git diff --check`：PASS。
- Production dependency audit：0 high、0 critical；5 条 moderate 来自既有 Payload/Drizzle/esbuild 链。

完整 `governance:check` 的 intake 子项仍会列出用户已有的 `outputs/**` 脏树；这些文件不属于 001，未清理、未纳入 scope、未暂存。

## Not yet verified

- 未执行任何 migration；Local 状态显示全部 migration 为 pending，数据库已恢复为停止状态。
- 未运行 live schema 读回、apply → rollback → reapply 或 migration recovery。
- 未运行 Member A / Member B / paused / no-Person / Editor / Super Admin 的数据库权限矩阵。
- 未运行真实 authorization code、refresh replay、幂等并发和 stale revision 数据库竞争测试。
- 未运行 Cursor、TRAE、WorkBuddy 或第二协议客户端的实际 OAuth 连接。
- 未部署 Preview、未开放 public MCP、未使用真实账户或真实内容。

下一步只有在 `migration` 单独批准后，才能进入 Local 数据库验证。
