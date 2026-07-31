---
doc_contract: DocContractV1
doc_type: reference
authority: evidence
status: active
scope: agent-workspace-002-transition-review
last_verified: 2026-08-01
max_lines: 160
---

# Agent Workspace 002 — Transition review

## Verdict

`002 COMPLETE / 003 MAY ENTER INTAKE / 004–005 ADJUSTED`

002 已用 Local 自动矩阵和 Cursor Preview 真实客户端证明 Member publication confirmation primitive。003 可以成为下一条 active checklist 候选，但本结论不创建、不批准也不开始 003；开始前仍须冻结独立范围、禁止项、验证和门禁。

## Reusable contract from 002

- 公开状态写入使用 `prepare → 用户确认 → commit → readback`；prepare 不改变业务对象，commit 绑定 actor、connection、object、action、target 和 revision。
- 服务端生成影响摘要和一次性 reference，Agent 不能用 `confirmed: true`、角色文字或客户端摘要绕过。
- commit 在事务内重检账户、Person、connection、OAuth client、owner、revision、transition 和公开完整性；相同 key 同输入安全重放，不同输入失败关闭。
- 成功后同时读回业务对象、公开路径、workflow event 和 Agent audit；撤回与失败必须再做匿名读回。
- confirmation 不跨 connection 继承。认证在 prepare 前过期时先完成新会话，再重新 prepare；不能把旧会话的 pending action搬到新会话。

## 003 — keep, narrow before implementation

003 保留并成为下一候选，目标仍是 Editor curation，不把 Member publication、账户管理或通用 Payload CRUD带入。

进入 intake 时应按动作风险拆成两类：

- 低风险队列读取、本人负责/未分配筛选、来源与分类草稿可以使用普通 read/save 合同，但仍需对象 revision、跨作者权限负例和 readback。
- 会改变站方公开入口、策展状态、负责人或排期的动作必须复用 002 confirmation primitive；尤其 Add to site、Remove from site 和会让内容离开/重新进入公共入口的动作要独立 prepare/commit。

003 首批不应一次覆盖 Needs attention、分配、分类、来源、策展、排期、复核和通知全部能力。intake 应先从一个跨作者对象、一个公共策展状态变化和一个恢复路径组成最小端到端切片，再决定是否拆出后续 Editor 子级。

## 004 — split remains, boundary strengthened

004 继续拆为低风险站务与高风险账户/身份。002 没有提供把 confirmation primitive 扩展到提权、删除、migration、密钥、Production 或批量公开的依据；这些动作继续留在网页或专门流程。

如果后续评估暂停/恢复账户，应单独证明 step-up、双人或二次确认、目标账户 readback、当前连接撤权、恢复和不可自提权。不能因为 Member/Editor publication 已通过而复用同一风险等级。

## 005 — keep and expand with observed failures

005 保留 compatibility + phase release，并新增真实运行项：

- Cursor 工作区 server 初次启用状态和 `type: http` 配置校验。
- callback `8787` 端口预检、占用提示、deep-link 回退和无人工恢复验证。
- access token 到期、refresh/re-auth、长任务中断恢复、connection 变化后的 pending confirmation 失效规则。
- DCR/OAuth 失败重试产生的 client/connection 清理与运营读回。
- TRAE/WorkBuddy 真实账号到位后的 OAuth、Streamable HTTP、工具发现、确认 UI 和完整 Member workflow；在此之前保持 `NOT RUN / NOT_VERIFIED`。
- 监控、限流、支持、撤权、恢复、工作目录与 Vercel project ID 断言，以及 Production deploy、真实账户、真实数据和公开启用的分立门禁。

CLI fallback 仍没有开发依据。只有目标 Agent 明确不支持 MCP 且出现真实任务阻塞时才重新评估。

## Next decision

002 归档后仓库暂时没有 implementation active checklist。下一步可以建立 003 intake，但必须先决定其首批最小跨作者策展动作；004、005 继续 provisional，不因编号或本结论自动获得授权。
