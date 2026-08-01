---
doc_contract: DocContractV1
doc_type: reference
authority: evidence
status: active
scope: agent-workspace-005-intake
last_verified: 2026-08-01
max_lines: 180
---

# Agent Workspace 005 — Intake evidence

## Decision

`START PHASE-RELEASE INTAKE / EXTERNAL GATES CLOSED`

001–004 已稳定远程 MCP、OAuth、Member 草稿与 publication、Editor 单篇站方策展和 Super Admin 最小 Activity read。005 不再增加角色能力；它负责把已经完成的能力收口为经过真实客户端证明、具备运营保护、可恢复且可分阶段发布的 Agent Gateway。

当前只授权文档 intake。产品代码、真实客户端登录、Preview、public MCP、provider 配置、firewall、migration、真实账户/数据、Production、merge 和 push均未执行。

## Current client evidence

| Client | Current evidence | 005 treatment |
|---|---|---|
| Cursor 3.13.25 | 本机已安装；001–002 在较早 3.13.10 build 完成 Local/Preview OAuth、refresh、工具、撤销和 publication | 作为 regression；预检 `localhost:8787`，不停止端口占用者，验证 `type: http`、deep-link 回退和重新认证 |
| WorkBuddy 5.3.5 | 本机已安装；官方 4.9.1 changelog 已声明 MCP OAuth 主动 token 刷新与自动重连，官方 connector 支持自定义 MCP；本项目尚未登录或实测 | 首个新客户端；在受保护 Preview 用虚构 `.test` Member 完成真实 DCR/OAuth/MCP、10 分钟 renewal、私有 draft、prepare 停止、撤销和清理 |
| TRAE SOLO 0.1.3 | 本机已安装；旧 001 证据为未实测。官方 2026-04 新版 TRAE IDE 公告称 MCP OAuth 完整链路，但不能证明 SOLO 0.1.3 | 先核对产品线、版本、账号和 remote MCP 入口；不满足时保持 `NOT_VERIFIED`，不降级 API key 或开发 CLI |

官方参考：[`WorkBuddy changelog`](https://www.codebuddy.cn/docs/workbuddy/Changelog)、[`WorkBuddy connectors`](https://www.codebuddy.cn/docs/workbuddy/From-Beginner-to-Expert-Guide/Function-Description/Connector)、[`TRAE MCP OAuth update`](https://forum.trae.cn/t/topic/13259)。宣传或配置可见性都不能替代本项目真实连接。

## Current server and release facts

- Gateway、metadata、DCR 与 OAuth 只有 `AGENT_GATEWAY_ENABLED=true` 才公开；Preview 当前恢复 Vercel SSO，Gateway 默认关闭。
- OAuth access token 为 10 分钟，refresh token 为 7 天并轮换；replay 会使 token family compromised。001–002 已自动与 Cursor 实测，WorkBuddy 自动 renewal 尚未证明。
- DCR 限制 body 32 KB、redirect 数量与 URI，按数据库总量限制最近 1 分钟 50 个、有效未绑定 client 500 个，并清理少量过期未绑定 client；这不是按来源的公网 abuse control。
- `/authorize`、`/token`、`/revoke` 与 `/mcp` 当前没有 Agent 专用的 provider rate-limit 证据。Gateway 本身只有 Host/Origin、Bearer scope/resource 与 no-store；公网 Production 前必须建立可读回的限流门。
- 领域操作有 `agent-events` 审计，OAuth 只记录未预期的 authorize failure，Gateway 没有覆盖 route/outcome/status/client family 的最小结构化运行事件。Production 前必须证明支持诊断但不记录 token、email、正文、confirmation 或对话。
- Preview 已应用 13 条 migration；Production 当前是 12 条。Agent collections 来自既有 `20260730_181300`，005 若进入 Production 必须在备份与恢复门后单独批准 apply，不创建新的 migration，也不以 deployment 隐式执行。

## Selected first execution gate

第一批不做 Production release，也不先写 monitoring/rate-limit 代码。它只在得到新的 Preview、public MCP、真实客户端和虚构 fixture 授权后完成：

1. 只读核对 Preview project/deployment/SSO/Gateway/env 与数据库基线，保存可恢复计数或 dump。
2. 建立一个虚构 `.test` Member、Person 和最小私有 Article fixture；不复制 Production 数据，不发送真实邮件。
3. WorkBuddy 通过标准 protected-resource metadata、DCR、PKCE 与浏览器人工授权连接；Workspace/config 不保存 token。
4. 调用 account、capabilities、本人列表、create/get/save/preview；prepare publication 只验证客户端会停下来请求用户确认，不 commit，不改变公开状态。
5. 跨过 10 分钟 access token 生命周期后再次调用，证明主动 refresh 或明确 re-auth 与自动重连；失败时保留安全错误，不复用旧 confirmation。
6. 撤销 connection 后再次调用失败；Cursor 对同一 Gateway 做 tools/callback/re-auth 回归。
7. 精确删除 fixture、connections、Agent events 和本轮 DCR clients，恢复 SSO 与 Gateway 默认关闭并读回。

该门可以独立得到 `PASS/BLOCK`，但 PASS 只证明客户端兼容，不授权限流、Production 或真实成员接入。

## Risk matrix

| Risk | Current gap | Gate |
|---|---|---|
| 客户端宣传与真实协议不一致 | WorkBuddy/TRAE 未连接本项目 | 当前版本真实 DCR/OAuth/MCP/tool/refresh/revoke；不能用 config parse 代替 |
| callback 被占用或丢失 | Cursor 曾遇到 `8787` 占用 | 只读端口预检、记录占用者、deep-link 回退；不杀进程、不改其他服务 |
| 长任务 token 过期 | Cursor 002 曾 `Unauthorized` | 跨 10 分钟 renewal；重连后重新 prepare，不跨 connection 搬 confirmation |
| DCR/OAuth/MCP 被公网滥用 | 只有 DCR 数据库总量阈值 | Production 前单独批准 provider/rate-limit 设计、阈值、429 readback 与恢复 |
| 日志泄密或无法支持 | 领域 audit 不等于 HTTP 运行观测 | 仅 route/outcome/status/client family/request correlation；禁止 token/email/content/conversation |
| Production schema 不具备 Agent tables | Production 12 migrations，Agent 为第 13 条 | migration 前备份、status、apply、schema/readback 和恢复；deployment 不隐式执行 |
| 发布后影响现有公共站 | 同域 Next/Payload | staged production、关闭态先验收、Gateway flag rollback、公共站 smoke 与日志回读 |

## Intake conclusion

005 可进入 active phase-release，但当前不能直接实施代码或外部运行。下一批准请求应只针对首个 WorkBuddy + Cursor Preview compatibility gate；如果它暴露 server incompatibility，先形成只读诊断，再把精确代码路径与最小修复 amendment 提交到 HEAD。限流、可观测性、migration 和 Production 在后续门分别批准。
