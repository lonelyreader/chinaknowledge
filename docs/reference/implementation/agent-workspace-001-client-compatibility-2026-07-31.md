---
doc_contract: DocContractV1
doc_type: reference
authority: evidence
status: active
scope: agent-workspace-001-client-compatibility
last_verified: 2026-07-31
max_lines: 220
---

# AGENT-WORKSPACE-001 Client Compatibility

本页只记录 2026-07-31 能由官方资料、当前安装版本、自动 spike 或真实 Local 客户端证明的事实。配置可解析不等于 OAuth 已端到端通过；Local 结果也不推导 Preview、公开 MCP 或 Production。

## Gateway Spike

当前实现已用 `@modelcontextprotocol/server@2.0.0` 在 Next Route Handler 内通过以下自动验证：

- RFC 9728 protected-resource metadata 与路径化 resource；
- RFC 8414 authorization-server metadata、S256、DCR、refresh 与 revoke 地址；
- 无 Bearer 和错误 Bearer 返回 `401`，并携带 `resource_metadata` challenge；
- 错误 Host 与浏览器 Origin 被拒绝；
- 正确 Bearer、scope 和 exact resource 完成无状态 Streamable HTTP `initialize`；
- handler 使用 Web Standard `Request` / `Response`，不需要 Express adapter 或第二个服务。

自动证据：`npm --prefix apps/web run test:agent`。它证明 transport、metadata、Gateway 默认关闭、五个 JSON fixture 解析，以及 Codex TOML 由真实 CLI 在隔离配置目录中加载；OAuth 持久化与真实客户端另由 Local runtime 和 Cursor 记录证明，外网部署仍未验证。

## Client Matrix

| 客户端 | 当前项目入口 | Streamable HTTP | OAuth / DCR | 001 状态 |
|---|---|---|---|---|
| Cursor 3.13.10 | `.cursor/mcp.json`，remote server 使用 URL | 真实 Local 连接通过 | DCR、PKCE、token、refresh、撤销与重新认证真实通过 | `LOCAL PASS`，带 `8787` 占用说明 |
| TRAE SOLO 0.1.3 | MCP 页面或 `mcp.json` JSON | 官方确认 | 官方资料未确认 DCR、PKCE 与 callback | `NOT RUN / NOT_VERIFIED`，转 005 |
| WorkBuddy 5.1.7 | 自定义连接器；本机配置为 `~/.workbuddy/mcp.json` | 当前本机 bundle 含 HTTP/SSE schema 与 Streamable HTTP client | 官方连接器页确认 OAuth token 类凭据，但未公开确认自定义 remote MCP 的 DCR/callback | `NOT RUN / NOT_VERIFIED`，转 005 |
| Codex CLI 0.142.5 | `~/.codex/config.toml` 或 `codex mcp add --url` | 当前 CLI 明确支持 | 当前 CLI 提供 `mcp login`、scope、client ID 与 resource | fixture-ready |
| Claude Code | project `.mcp.json` 或 `claude mcp add --transport http` | 官方确认 | 官方确认浏览器 OAuth、token refresh 与清除认证 | fixture-ready |
| Gemini CLI | project `.gemini/settings.json` 的 `mcpServers.*.httpUrl` | 官方确认 | 官方确认 discovery、DCR、localhost callback、refresh | fixture-ready |

版本来自当前机器 `/Applications` metadata 与本机 CLI；只用于确定首轮测试对象，不作为最低支持版本。

## Cursor real-client result

- 临时项目只含 `.cursor/mcp.json` 和说明文件，Gateway 为 `http://localhost:3000/api/agent/mcp`；没有把 token、角色、Cookie 或账号写进 Workspace。
- Cursor 真实发出 protected-resource discovery、authorization-server discovery 与 DCR；注册请求包含 `cursor://anysphere.cursor-mcp/oauth/callback`、Cursor Web callback 和 `http://localhost:8787/callback`。服务端只为精确 Cursor scheme 增加 allowlist，没有开放任意 custom scheme。
- 当前 Cursor build 选择固定 loopback `localhost:8787`。本机该端口由既有 `agent-memory` dashboard 占用，任务没有停止或修改它；浏览器同意后把同一 code/state 通过 Cursor 已注册的 deep link 交回，随后 Cursor 自己完成 token exchange、refresh rotation 和 MCP initialize。
- Cursor IDE Agent 依次完成 `account_context`、`capabilities_list`、`my_articles_list`、create、get、save、preview；创建 Article 2，最新 version 标题为 `Cursor local acceptance saved`。读取另一 Member 的 Article 1 返回 `NOT_FOUND`，不泄露存在性。
- 后台 `Agent access` 显示 `Cursor`、8 条业务活动和越权 `Denied`；撤销实际使用中的连接后，Cursor 下一次调用得到 `Unauthorized`，refresh 返回 400，并要求重新连接。
- 结论是 Gateway 与 Cursor 真实协议/工具闭环通过；`8787` 被占用时不能视为一键连接。005 必须把端口预检和无人工回调作为客户端发布验收，不在 001 UI 中增加解释性教程。

## Minimal Fixtures

所有 fixture 只保存同一 Gateway URL，不保存 token、角色或账户：

```json
{
  "mcpServers": {
    "china-in-fact": {
      "url": "https://HOST/api/agent/mcp"
    }
  }
}
```

- Cursor 使用上述结构写入 `.cursor/mcp.json`。
- TRAE 使用其 MCP JSON 导入；实际 build 若要求 `type`，adapter 在真实测试后固定。
- WorkBuddy 写入 `~/.workbuddy/mcp.json` 的行为不能由下载包直接修改用户目录；首轮用自定义连接器导入验证。
- Codex fixture 使用 TOML：`[mcp_servers.china-in-fact] url = "https://HOST/api/agent/mcp"`，并通过 `codex mcp login china-in-fact --scopes agent:member,offline_access`。
- Claude project fixture 使用 `.mcp.json` 的 `type: "http"` 与 `url`。
- Gemini project fixture 使用 `.gemini/settings.json` 的 `httpUrl`，由自动 discovery 启动 OAuth。

五个 JSON fixture 由自动测试实际解析；Codex fixture 由本机 `codex mcp get china-in-fact --json` 在一次性 `CODEX_HOME` 中加载并回读 URL。具体字段只有在对应当前版本真实解析通过后才能进入下载包；不能把一套 JSON 假定为所有客户端通用格式。

## Evidence Boundary

- Cursor 已完成本项目 Gateway 的 Local PKCE、DCR、callback handoff、refresh、工具调用和撤销；Preview/public MCP 仍未验证。
- TRAE：`NOT RUN / NOT_VERIFIED` — 当前没有客户端账号；未验证本项目 Gateway 的 OAuth、DCR、callback 或 Member workflow。若 005 实测不能完成标准 discovery，不以 API key 降级。
- WorkBuddy：`NOT RUN / NOT_VERIFIED` — 当前没有客户端账号；未验证本项目 Gateway 的 OAuth、DCR、callback 或 Member workflow。真实测试前不标记支持。
- 所有客户端的 OAuth 凭据必须保存在客户端自己的安全存储；Workspace fixture 不包含 bearer token、refresh token 或 client secret。
- 本页不批准 Preview、public MCP、真实账户、真实数据或 Production。

## Sources

- [Cursor MCP](https://docs.cursor.com/context/model-context-protocol)
- [Cursor staff：当前 IDE/CLI 使用固定 `localhost:8787`，并保留 custom-scheme fallback](https://forum.cursor.com/t/oauth-redirect-uri-changed-from-cursor-to-http-localhost-for-streamable-http-mcp/165019/18)
- [TRAE 官方 MCP FAQ](https://forum.trae.cn/t/topic/65)
- [WorkBuddy 连接器](https://www.codebuddy.cn/docs/workbuddy/From-Beginner-to-Expert-Guide/Function-Description/Connector)
- [Claude Code MCP](https://code.claude.com/docs/en/mcp)
- [Gemini CLI MCP](https://github.com/google-gemini/gemini-cli/blob/main/docs/tools/mcp-server.md)
- 本机 `codex-cli 0.142.5` 的 `codex mcp add --help` 与 `codex mcp login --help`。
