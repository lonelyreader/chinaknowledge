---
doc_contract: DocContractV1
doc_type: reference
authority: evidence
status: active
scope: agent-workspace-001-auth-design
last_verified: 2026-07-31
max_lines: 220
---

# AGENT-WORKSPACE-001 Auth Design

状态：`APPROVED 2026-07-31`。用户已通过 `auth-design`、`dependency-install`、`database-schema` 与必要路径扩展；本页不代替 `migration` 或任何外部动作批准。

## Current Evidence

- MCP 当前 TypeScript SDK v2 `2.0.0` 随 2026-07-28 protocol 发布，Server 提供 Web Standard `Request` / `Response` handler、Streamable HTTP、Bearer 验证和 RFC 9728 metadata helper。
- SDK v2 已把 Authorization Server helpers 移入冻结的 `server-legacy`；官方升级说明要求新实现使用独立 IdP/OAuth library。
- MCP Authorization 要求 HTTP resource server 提供 RFC 9728 protected-resource metadata，authorization server 提供 RFC 8414 或 OIDC discovery；client 必须发送 `resource`，server 必须验证目标 audience。Authorization Code 必须使用 PKCE，公开 client 使用 refresh rotation。
- Cursor、Claude Code 和 Gemini CLI 官方资料均确认 remote Streamable HTTP + OAuth。Gemini 明确会在 server 支持时执行 dynamic client registration，并使用随机 localhost callback；Cursor 的共享配置只要求 remote URL，不能依赖用户粘贴 secret。
- Payload 现有 User cookie/session、账户暂停、角色和 Person 关系继续作为身份真相。Agent token 不能替代 Payload 用户，也不能绕过 collection access。
- TRAE 与 Tencent WorkBuddy 尚缺足够公开官方协议细节，必须以安装版本和真实连接为最终证据，不能从产品宣传推定支持。

官方来源：

- [MCP TypeScript SDK v2](https://github.com/modelcontextprotocol/typescript-sdk)
- [MCP Authorization](https://modelcontextprotocol.io/specification/2025-11-25/basic/authorization)
- [MCP Authorization tutorial](https://modelcontextprotocol.io/docs/tutorials/security/authorization)
- [Payload custom authentication strategies](https://payloadcms.com/docs/authentication/custom-strategies)
- [Cursor MCP](https://docs.cursor.com/context/model-context-protocol)
- [Claude Code MCP](https://docs.anthropic.com/en/docs/claude-code/mcp)
- [Gemini CLI MCP](https://github.com/google-gemini/gemini-cli/blob/main/docs/tools/mcp-server.md)

## Decision

首版在现有 Next.js/Payload 应用内组合两层：

1. `@modelcontextprotocol/server@2.0.0` 负责 MCP protocol、tool schema、Streamable HTTP、401 challenge 和 protected-resource metadata。
2. `@node-oauth/oauth2-server@5.3.0` 负责 Authorization Code、PKCE code verification、access/refresh token issuance 和 refresh rotation。
3. China, in Fact 只实现必须由产品决定的边界：Payload session consent、dynamic client registration validation、opaque token persistence、audience/resource validation、connection revoke 和逐次业务权限。
4. `zod@4.4.3` 作为直接依赖编写工具 schema；不依赖 SDK 的传递依赖。

三个包当前均为 MIT；Node 要求与仓库 Node 22 匹配。`dependency-install` 已批准；安装后仍需运行 production audit。

### Rejected alternatives

- 不使用 SDK v1/`server-legacy` Authorization Server helper：官方已经冻结，不能作为新实现基础。
- 不引入 Better Auth 作为第二套用户/session 系统：其 OAuth provider 很完整，但会增加平行 user、session、account 和 token schema；当前 Payload 已经是账户真相。
- 不嵌入 `oidc-provider`：协议能力成熟，但它依赖 Node `IncomingMessage` / `ServerResponse` host，不能自然进入当前 Next Route Handler 和 Vercel runtime。
- 不使用 API key、Payload JWT 或数据库凭据代替 OAuth：无法满足按连接撤销、PKCE、refresh rotation、audience 和客户端自动发现。

## Endpoint Contract

Canonical resource：`${PAYLOAD_PUBLIC_SERVER_URL}/api/agent/mcp`。

| Endpoint | 责任 |
|---|---|
| `/.well-known/oauth-protected-resource/api/agent/mcp` | RFC 9728 resource、authorization server、最小 scope |
| `/.well-known/oauth-authorization-server/api/agent/oauth` | RFC 8414 endpoints、PKCE S256、registration、refresh、revoke |
| `/api/agent/oauth/register` | 只注册公开 MCP client，不发 client secret |
| `/api/agent/oauth/authorize` | 复用 Payload cookie；显示 client、redirect host、scope 和 Allow/Deny |
| `/api/agent/oauth/token` | authorization code / refresh token；要求 exact resource |
| `/api/agent/oauth/revoke` | 撤销单 token 或整条 connection |
| `/api/agent/mcp` | 验证 Bearer、audience、expiry、connection 和当前 User，再进入 MCP |

Metadata routes 放在现有 `apps/web/src/app/(payload)/**` 范围内，通过 route group 暴露标准 `/.well-known/**` URL；不新增公共产品页面。所有 metadata、MCP 与 OAuth 外部入口只有在 `AGENT_GATEWAY_ENABLED=true` 时发布；默认在进入数据库或 OAuth 逻辑前返回 `404 no-store`。后台 `Agent access` 继续允许查看历史和撤销已有连接，但关闭新配置下载。

## OAuth Policy

- 只允许 `response_type=code`、`grant_type=authorization_code|refresh_token`。
- public client 强制 PKCE `S256`；`plain`、无 challenge、无 `state` 全部拒绝。
- authorization code 60 秒、单次使用；access token 10 分钟；refresh token 7 天。
- refresh 每次轮换；已使用 refresh token 再次出现时撤销整个 token family。实现中的 refresh token 含服务端 HMAC 验证的 family 标识；它对客户端仍是不透明随机凭据，但允许任意历史代重放定位并撤销当前 family，伪造标识不能触发撤销。
- token 为至少 256-bit opaque random value；数据库只保存 HMAC-SHA-256 digest，不保存可用 token。
- token audience/resource 必须与 canonical MCP URL exact match；不接受为其他 API 签发的 token。
- OAuth scope 固定为 `agent:member` 与可选 `offline_access`。scope 不携带 role；业务工具每次重新读取 User、account status、Person 和 owner。
- 只有明确请求 `offline_access` 才签发、保存 refresh token 与 refresh expiry；仅 `agent:member` 的授权只有短期 access token。
- authorize 必须显示 client name、redirect hostname 和请求能力；不能自动 consent。
- `/revoke` 对未知 token 仍返回成功，避免 token oracle；connection revoke 立即使 access 和 refresh 都失效。
- 未认证 token/revoke form body 上限为 8 KiB；声明长度或流式读取超限均以 `413` 失败，不进入数据库或 OAuth model。
- Production 只接受 HTTPS；Local 可接受 loopback HTTP。

## Dynamic Client Registration

首批桌面 Agent 不能安全保存共享 client secret，因此 DCR 只产生 public client：

- `token_endpoint_auth_method` 必须为 `none`。
- `grant_types` 只能是 `authorization_code`、`refresh_token`；`response_types` 只能是 `code`。
- redirect URI 必须 exact match；允许 HTTPS，或 `localhost` / `127.0.0.1` / `[::1]` 的 HTTP loopback。Cursor 只例外允许精确的 `cursor://anysphere.cursor-mcp/oauth/callback`；其他 custom scheme 继续拒绝。
- 拒绝 wildcard、userinfo、fragment、未列入上项的非 HTTP scheme、过长 URI 和重复 URI。
- client name、redirect URIs、创建时间、最近使用和 client family 可保存；不保存机器名、工作区路径或 Agent 对话。
- 未完成首次授权的注册 24 小时过期；已绑定 connection 后按 connection 生命周期保留。
- registration endpoint 需要长度、数量、频率和总量限制；独立安全复审必须覆盖 redirect injection 与 storage exhaustion。

## Persistence Proposal

Schema 门禁通过后使用三个最小 collection：

### `agent-oauth-clients`

保存 public DCR client：`clientId`、`clientName`、`clientFamily`、exact `redirectUris`、created/lastUsed/expires/disabled。无用户权限字段，无 secret。

### `agent-connections`

保存具体 User grant 和 token family：User、Person snapshot ID、client、scope、authorization-code digest/PKCE/expiry/consumed、access digest/expiry、refresh current/previous digest、family state、last used、revoked at。角色和 Person snapshot 只供审计；调用时读取当前关系。

### `agent-events`

保存 actor、connection、client family、tool、object、request ID、result、before/after revision 和时间。禁止 token、code、cookie、完整正文、prompt 或数据库地址。

`AgentOAuthClients.ts`、`AgentConnections.ts` 和 `AgentEvents.ts` 均由 active checklist 精确覆盖。

## Payload Identity Bridge

Authorize route 通过当前 request headers 调用 Payload auth。未登录时跳到现有 `/admin/login`，并只携带服务端生成的一次性 continuation ID，不把原始 authorize query 或 token 放入日志和可编辑参数。登录返回后重新读取原请求并再次校验 client、redirect、PKCE、resource 和 expiry。

Token 中只绑定本地 User ID、connection ID、client ID、scope 和 resource。MCP 调用按以下顺序失败关闭：

1. token digest、expiry、resource、connection state；
2. 当前 User 存在且未 paused；
3. 当前 Person relationship；
4. 当前 tool capability；
5. 当前 Article owner 和字段权限；
6. `overrideAccess:false` 领域写入与读回。

## Schema Drift And Recovery

按照 schema drift 四方合同交付：

1. Payload collection config；
2. 生成并人工审查的 migration；
3. `payload-types.ts`；
4. runtime service 与专项测试。

Local 使用 fixture 完成 apply → rollback → reapply。Preview migration、Production migration 和真实数据分别批准；migration 未应用时 route 应安全返回 unavailable，不能退化为内存 token store。关闭 Gateway route 和回滚 OAuth collections 不影响 `/admin`、公共站和文章版本恢复。

## Approval Record

用户于 2026-07-31 同时通过以下本地门禁：

- `auth-design`：接受本页设计；
- `dependency-install`：允许安装三个固定依赖；
- `database-schema`：允许增加 `agent-oauth-clients`、`agent-connections`、`agent-events`；
- 路径扩展：metadata routes 已由 `(payload)/**` 覆盖，并精确增加 `AgentOAuthClients.ts`。

本设计批准时，`migration`、Preview、真实账户、真实数据、public MCP、Production、merge 和 push 仍未授权；随后经逐项批准完成 Local/Preview migration 与虚构 `.test` Cursor 验收，见 [`Preview runtime`](agent-workspace-001-preview-runtime-2026-07-31.md)。Production、真实成员/内容、merge 和 push 仍未执行。
