---
doc_contract: DocContractV1
doc_type: reference
authority: evidence
status: active
scope: agent-workspace-005-preview-runtime
last_verified: 2026-08-01
max_lines: 180
---

# Agent Workspace 005 Preview Runtime

## Verdict

`GATE 2 BLOCKED BEFORE OAUTH / PREVIEW RESTORED`

用户于 2026-08-01 批准本门的 Preview deploy、temporary public MCP、虚构 Preview fixture 与真实 WorkBuddy/Cursor client test。执行在首个真实客户端 WorkBuddy 的动态注册阶段停止：WorkBuddy 5.3.5 使用的精确 callback 不在服务器 allowlist，`POST /api/agent/oauth/register` 返回 `400`。没有进入登录、授权、token、connection、MCP tool call 或 Article write；Cursor 未在已知首客户端阻断后继续运行。

## Frozen scope

- 本门只使用 `china-in-fact` Vercel project、受保护 Preview、虚构 `.test` Member 和当前 WorkBuddy 5.3.5。
- provider、firewall/rate limit、migration、Production、真实账号、真实数据、merge 与 push 均不在授权内。
- Production 没有被读取或修改；没有创建真实内容或改变公共状态。

## Backup and opening

- 执行前 Preview database dump 为 `250845` bytes，SHA-256 `622e93c1ebaddbd98185b46a631b45e0542ae4bd3ea26a9036fcc8e0de3db892`。
- 初始计数：User `36`、Person `32`、Article `32`、workflow event `150`、OAuth client `4`、connection `0`、Agent event `0`、migration `13`。
- 4 条既有 Cursor DCR client 为精确行 `1/2/5/6`，均没有 connection；按已批准清理范围删除，没有触碰其他对象。
- 临时开启部署为 `dpl_CxcWAikG7wdVo3V3bcYB9XSHk6Md`，稳定 alias 为 `china-in-fact-agent005-ac1f2c0.vercel.app`；部署 `READY`，构建、typecheck 与 `75` routes 完成。
- 临时关闭 Preview SSO 后，health、protected-resource metadata 与 authorization-server metadata 返回 `200`，匿名 MCP 返回 `401`，未登录 access 返回 `401`。

## Fictional fixture

- 使用 Payload Local API 创建 `agent005-20260801134930@example.test`：User `42`、Person `37` 与 profile draft。
- WorkBuddy 在 OAuth 前停止，因此没有创建 Article、version、workflow event、connection 或 Agent event。
- fixture 密码只保存在本地临时文件中，没有输出、写入仓库或提交。

## Real WorkBuddy evidence

- WorkBuddy 通过 UI 接受 `{ "mcpServers": { "china-in-fact": { "type": "http", "url": "https://china-in-fact-agent005-ac1f2c0.vercel.app/api/agent/mcp" } } }`，没有 header 或 token。
- 点击连接后依次取得 protected-resource metadata、authorization-server metadata 与 MCP `401` challenge，然后向 `/api/agent/oauth/register` 发起 DCR。
- 客户端声明 `WorkBuddy Connector (custom-mcp:china-in-fact)`、authorization code + refresh token、PKCE 与无客户端认证；callback 为 `workbuddy://workbuddy/mcp/custom-mcp%3Achina-in-fact/oauth/callback`。
- 服务器在 [`validRedirectUri`](../../../apps/web/src/agent/oauth-http.ts) 拒绝该 callback 并返回 `400`。当前实现只特殊允许 Cursor 精确 callback，另允许 HTTPS 与 HTTP loopback；[`registration`](../../../apps/web/src/agent/registration.ts) 已能把该客户端识别为 `workbuddy`。
- DCR 失败发生在浏览器 OAuth 之前：没有 OAuth client、authorization code、grant、access/refresh token、connection、tool discovery 或 tool call。

## Cleanup and closed-state readback

- 精确删除 Person `37` 与 User `42`；确认没有关联 Article、connection 或 event。
- WorkBuddy MCP 配置经 UI 恢复为 `{ "mcpServers": {} }`。
- 删除临时 Preview env，恢复原 SSO policy `{ deploymentType: "all_except_custom_domains" }`。
- 关闭态部署为 `dpl_yhk2kebQvDia4E3GLNB5rUQymyoW`，稳定 alias 已回指该 `READY` 部署。
- 最终匿名 health/MCP 均为 SSO `302`；经授权 health 为 `200`，MCP 为 Gateway-off `404`。
- 最终计数：User `36`、Person `32`、Article `32`、workflow event `150`、OAuth client `0`、connection `0`、Agent event `0`、migration `13`。
- dump、临时 env、fixture 凭据和辅助脚本已移至可恢复的 `/Users/gexu/.Trash/chinainfact-agent005-gate2-blocked-20260801-140029/`；没有进入仓库。

## Root cause and next gate

最小修复是只允许上面的 WorkBuddy 精确 callback literal，并保留 Cursor、HTTPS 与 loopback 现有行为。扩大任意 `workbuddy:` scheme 会把 authorization code 交给非预期客户端，因此 amendment 必须有相似 URI 拒绝测试。产品代码尚未获该 amendment 授权；Gate 2 保持 blocked，等待 `product-code` 批准后先做 Local 实现、负例与独立复审，再复用已批准的 Gate 2 外部验收范围。
