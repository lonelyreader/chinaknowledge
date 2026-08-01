---
doc_contract: DocContractV1
doc_type: reference
authority: evidence
status: active
scope: agent-workspace-005-client-compatibility
last_verified: 2026-08-01
max_lines: 180
---

# Agent Workspace 005 — Client compatibility preflight

## Decision

`GATE 1 PREFLIGHT PASS / PRODUCT AMENDMENT INDEPENDENT PASS / EXTERNAL WRITES CLOSED`

用户于 2026-08-01 以“继续推进”批准 checklist 当前等待的 `real-client-login + preview-read`。本门只读取本机客户端、受保护 Preview、Vercel 配置名和数据库聚合计数；没有保存客户端配置、创建 OAuth grant、部署、开放 MCP、修改 env/provider、创建 fixture、执行 migration 或触碰 Production。

## Local clients

| Client | Live evidence | Frozen contract |
|---|---|---|
| WorkBuddy 5.3.5 | `/Applications/WorkBuddy.app`，bundle `com.workbuddy.workbuddy`；已有登录会话；“自定义连接器 → MCP 服务管理”可用；`~/.workbuddy/mcp.json` 当前只有空 `mcpServers` | 顶层 `mcpServers`；条目显式使用 `type: "http"` 与 `url`；不保存 header/token |
| Cursor 3.13.25 | `/Applications/Cursor.app`，bundle `com.todesktop.230313mzl4w4u92`；本机 `127.0.0.1:8787` 仍被既有 Python 服务占用且未停止 | 项目 `.cursor/mcp.json`；条目显式使用 `type: "http"` 与 `url`；先走注册 scheme/HTTPS callback，保留 8787 fallback 诊断 |

安装版 WorkBuddy bundle 的 HTTP MCP schema 要求 `name/url/type=http`，自定义配置 UI 接受 `mcpServers` object。当前运行使用 `workbuddy://workbuddy/mcp` OAuth base；若 server key 为 `china-in-fact`，DCR callback 为 `workbuddy://workbuddy/mcp/custom-mcp%3Achina-in-fact/oauth/callback`，HTTP fallback 才使用当前动态 `127.0.0.1:<proxy-port>/oauth/callback`。其 DCR `client_name` 为 `WorkBuddy Connector (custom-mcp:china-in-fact)`，服务端会归类为 `client_family=workbuddy`。

当前 WorkBuddy connector proxy 为回环地址并通过 `/health` 返回 `200`；端口只属于本次运行，不能写死在 adapter。Cursor 既有 DCR callback 集合为 `cursor://anysphere.cursor-mcp/oauth/callback`、`https://www.cursor.com/agents/mcp/oauth/callback` 与 `http://localhost:8787/callback`。

## Protected Preview readback

- Vercel project：`china-in-fact / prj_MlM7hL16TkyUeDisgb48UucNw6RZ`；当前核对的 Preview 为 `dpl_57WuvghzZvvP39yvX11tzYdDBViM`，target `preview`、status `READY`、Functions `iad1`。
- `/api/health`、protected-resource metadata 与 `/api/agent/mcp` 匿名请求均先被 Vercel SSO 以 `302` 拦截，并带 `x-robots-tag: noindex`；没有绕过 SSO读取应用响应。
- Preview env 名单没有 `AGENT_GATEWAY_ENABLED`，因此应用仍走默认关闭；本门没有读取或记录任何 env 值。Vercel project 当前显示 Node.js `24.x`，与旧 evidence 的 Node 22 记录不同，留给 Gate 4 核对实际 deployment runtime，不在本门改 project 设置。
- 数据库为 13 migrations，最新 `20260730_181300`；聚合基线为 User 36、Person 32、Article 32、workflow event 150、Agent OAuth client 4、Agent connection 0、Agent event 0。

## Residual DCR clients and cleanup locator

4 条现有 OAuth client 为 Preview rows `1 / 2 / 5 / 6`，均为 `client_family=cursor`、`disabled=false`，注册 callback 相同且没有 connection/event。这纠正了 current-state 中“没有 OAuth client 残留”的旧描述；本门没有删除它们。

进入 Gate 2 前必须先备份和重读：

1. 以 rows `1 / 2 / 5 / 6` 固定旧基线；确认仍无 connection 后，只有在 `preview-fixture`/清理授权覆盖时才精确删除并读回。
2. WorkBuddy 新 DCR client 以数据库 row ID、`client_family=workbuddy`、精确 callback 和本轮开始时间定位；connection 只按该 client FK 和 fixture User ID定位。
3. fixture 以新建 User/Person/Article 的精确 ID 和 `.test` email 定位；events 以 fixture User、connection 与本轮 request ID 定位。
4. 清理后分别读回 fixture、versions、workflow、connection、event 与本轮 client 为 0，并读回 SSO、env、Gateway 和原聚合计数；不得用广泛 email domain 或日期范围删除。

## Product amendment A

预检发现 `apps/web/src/agent/access-route.ts` 仍把 TRAE 放在 adapter 列表并允许下载，Cursor/WorkBuddy 下载 JSON 只有 `url`。用户批准 `product-code` 后已完成最小修复：

- `apps/web/src/agent/access-route.ts`：adapter 收窄为 Cursor、WorkBuddy、Codex、Claude、Gemini；未知下载和 TRAE 均返回 no-store 404；Cursor/WorkBuddy/Claude 显式输出 `type: "http"`。
- `apps/web/tests/agent-http.ts`：精确断言 adapter 列表、TRAE 404、Cursor/WorkBuddy/Claude `{ type, url }`、Gemini `httpUrl`、Codex TOML 和关闭态 404。

不需要修改 WorkBuddy 应用、registration family 的历史识别、OAuth、Gateway、CMS UI、schema、migration 或依赖。`npm run test:agent`、typecheck、lint 与 Local build 已通过；lint 为 0 error、40 条既有 migration warning，build 为 75 条静态/动态路由成功。Preview、public MCP、fixture 和客户端项目 OAuth 均未运行。

## Independent review

未参与实现的 reviewer 对当前代码与 10 个任务路径完成只读复审。首轮仅发现 feature registry 指纹和 checklist 门状态两项文档同步 P2；修正后复跑 Agent tests、typecheck、lint、docs governance、feature registry、任务路径覆盖和 `git diff --check`，第二轮 `PASS`，`P0/P1/P2 = 0/0/0`。用户自有 `outputs/**` 明确排除且保持原状。
