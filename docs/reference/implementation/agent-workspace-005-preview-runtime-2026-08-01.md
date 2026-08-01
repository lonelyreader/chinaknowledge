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

`GATE 2 PARTIAL / PREVIEW RESTORED`

用户于 2026-08-01 批准本门的 Preview deploy、temporary public MCP、虚构 Preview fixture 与真实 WorkBuddy/Cursor client test。首次执行在 WorkBuddy DCR callback allowlist 处停止并完成清理；Product amendment B 通过后复用同一外部授权重试。重试证明了 WorkBuddy 的真实 OAuth/MCP 私有工作流、重新授权和撤销，也证明 Cursor 的 8787 callback、授权与工具发现；WorkBuddy prepare confirmation 和 Cursor 实际 capability call 仍缺证据，因此本门不判 PASS。

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

最小修复是只允许上面的 WorkBuddy 精确 callback literal，并保留 Cursor、HTTPS 与 loopback 现有行为。扩大任意 `workbuddy:` scheme 会把 authorization code 交给非预期客户端，因此 amendment 必须有相似 URI 拒绝测试。

用户已于 2026-08-01 明确批准 Product amendment B 的 `product-code`。Local 实现只修改 `oauth-http.ts` 与 `agent-http.ts`：WorkBuddy 精确 callback 和真实 DCR metadata fixture 通过，其他 host、server key、query、hash、userinfo 与任意 WorkBuddy 路径均拒绝；Cursor、HTTPS 与 loopback 不回归。`test:agent`、typecheck、lint 和 build 已通过，lint 为 `0 error / 40` 条既有 migration warning。未主持实现者独立复审 `PASS`、`P0/P1/P2 = 0/0/0`；随后进入下面的 Gate 2 重试。

## Retry opening and fixture

- 重试前 database dump SHA-256 为 `60adb3e028bc686510c17e05d47fcee1853793860df8a9af5f8ef3a95826b47d`；基线为 User `36`、Person `32`、Article `32`、workflow event `150`、OAuth client/connection/Agent event `0`、migration `13`。
- 临时公开部署 `dpl_HYjWMXbhtb7grsBrwqpejwEnRi6W` 运行提交 `fa84692`，稳定 alias 为 `china-in-fact-agent005-fa84692.vercel.app`；只临时设置 Gateway 和 public server URL，并关闭 Preview SSO。
- 虚构 fixture 为 User `43`、Person `38`；WorkBuddy 创建 Article `48`。密码、code、token、state、client secret 与 confirmation reference 均只在本地临时文件中，没有写入仓库或证据文档。

## Retry WorkBuddy evidence

- WorkBuddy 5.3.5 完成受保护资源发现、DCR、PKCE、浏览器登录/consent、custom-scheme callback 和 9 个工具发现。
- 真实调用 `account_context`、`capabilities_list`、`article_create_draft`、`article_get_working_copy`、带 revision 的 `article_save_draft`、save 后 readback 与 `article_preview` 全部成功。Article `48` 保持 `_status=draft / publication_status=draft / workflow_status=draft / curation_status=not_selected`，owner `43`、author `38`，没有 `published_at`。
- 对既有其他 Member Article `32` 的 working-copy 读取返回不可重试 `FORBIDDEN`，没有写入。匿名读取 fixture public slug 与 preview query 都为 `404`，没有暴露正文。
- `article_prepare_publication` 在现有规则的 “Publish your profile before publishing an article” 前置条件处失败；未生成用户影响摘要或 confirmation，也没有调用 commit。为了保持私有 fixture 和本门 no-public-state 边界，没有把 Person 改为 public。
- 首个 access token 为约 599 秒，客户端只请求 `agent:member`，没有 `offline_access` 或 refresh token。过期后 WorkBuddy 标记 Unauthorized 并自动发起新 consent；人工授权后新 connection 可用。这证明 re-auth/reconnect，不证明 silent refresh。
- Member access endpoint 撤销新 connection 后，数据库状态为 `revoked` 并写一条 `connection_revoke / success`；WorkBuddy 随后看不到 china-in-fact 工具且没有自动重新授权，撤销失败关闭成立。

## Retry Cursor evidence

- Cursor 3.13.25 读取用户级 `{ type: "http", url }` 配置，显示 Needs authentication；DCR 使用 `http://localhost:8787/callback`，浏览器 consent 后 deep-link 返回本机端口，连接显示 `9 tools enabled`。
- 数据库只形成 `cursor / authorization_approval / success`。两次限定为 `account_context + capabilities_list` 的只读 Agent task 都直接进入 archived/Continue Working，没有形成服务端 tool event；因此只接受 callback、authorization 和 discovery，不把 capability call 写成 PASS。

## Retry cleanup and closed-state readback

- 先通过 Payload hooks 删除 Article `48` 及 2 条 workflow event，再删除本轮 18 条 Agent event、8 条 connection、10 条 DCR client、Person `38` 与 User `43`；脚本对 owner/author/User/Person/client family 做拒绝扩大断言。
- WorkBuddy MCP 配置恢复为空，凭据文件与执行前备份 SHA 一致；Cursor `mcp.json` 恢复备份 SHA `89e5a7655477463e599d3f8272117fd953c4d38d30ee6e5122ba52169676ac37`。
- 删除两个临时 Preview env，SSO 精确恢复为 `{ deploymentType: "all_except_custom_domains" }`。关闭态部署 `dpl_yLcrbZZ2MHt4BtyChk4GCfQYxKFQ` 为 `READY`，stable alias 已回指该部署。
- 最终匿名 health 与 MCP GET 为 SSO `302`，匿名 MCP POST 为 `401`；经 Vercel 授权 health 为 `200`，MCP 为 Gateway-off `404`。
- 最终计数回到 User `36`、Person `32`、Article `32`、workflow event `150`、OAuth client/connection/Agent event `0`、migration `13`。Production、真实账号、真实数据、migration、provider、merge 与 push 均未触碰。
- dump、临时 env、fixture 凭据、OAuth 临时文件和辅助脚本已整体移至可恢复的 `/Users/gexu/.Trash/chinainfact-agent005-gate2-partial-20260801-1534/`；没有进入仓库。

## Gate decision

Gate 2 保持 open。下一次只需补两项：在不突破公共状态授权的 fixture 设计下到达 WorkBuddy prepare confirmation 呈现，以及让 Cursor 实际产生 `account_context + capabilities_list` 服务端事件。两项补齐前不启动客户端批次独立复审，也不进入 Gate 3。
