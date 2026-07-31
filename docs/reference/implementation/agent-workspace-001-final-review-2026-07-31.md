---
doc_contract: DocContractV1
doc_type: reference
authority: evidence
status: active
scope: agent-workspace-001-final-review
last_verified: 2026-07-31
max_lines: 120
---

# Agent Workspace 001 — Final review

## First verdict

`BLOCK`

一名未参与主持实现的 reviewer 对提交前快照做只读复审。P0=0、P1=4、P2=3；未编辑、暂存、提交、部署或接触外部账户。

P1：

- Gateway 没有默认关闭的总开关，代码部署会绕过 `public-mcp` 单独门禁。
- refresh rotation 只保存上一代 digest，多次轮换后重放更早 token 不能撤销当前 family。
- Consent 未展示草稿读写与保持连接两项实际能力。
- Codex TOML 只有正则断言，不能支撑“六个 fixture 均已解析”。

P2：

- OAuth 客户端 revoke 没有事件审计。
- 连接先按数据库 `-lastUsedAt` 截断 50 条再用 JS 重排，空时间记录可能挤掉活跃连接。
- current 的指纹文件数、checklist 复审勾选和 evidence router 状态不一致。

## Remediation

- `AGENT_GATEWAY_ENABLED` 改为显式且默认关闭；两个 metadata、MCP 与全部 OAuth 外部入口在数据库/OAuth 逻辑前统一 `404 no-store`。后台历史与 revoke 保留，配置下载关闭。
- Refresh token 使用服务端 HMAC 验证的 family 标识；任意已签发历史 token 都能定位当前 family，三次轮换后重放第一代会将连接标为 compromised 并使当前 access/refresh 失效。
- Consent 使用短用户语言显示 `Read and edit your drafts` 与按 scope 出现的 `Keep this connection signed in`，不暴露内部 scope 名称。
- 五个 JSON fixture 继续由自动测试解析；Codex TOML 由本机 Codex CLI 在一次性 `CODEX_HOME` 中加载并回读 Streamable HTTP URL。
- OAuth revoke 写最小连接事件；连接列表先取有使用时间的 50 条，再按剩余额度补未使用连接。
- 文档、功能登记册和实现指纹按当前事实同步。
- 二次复验发现环境配置文件不在 001 的既有 allowed paths；开关读取已收回授权范围内的 Agent 模块，没有扩大 checklist。认证设计也已补记唯一 Cursor custom-scheme 特例。
- OAuth 窄复验继续发现仅 `agent:member` 仍可能获得 refresh token，以及 token/revoke body 无上限；实现已改为只有 `offline_access` 才保存 refresh 凭据，并对 consent、token、revoke form 统一执行 8 KiB 流式上限。

## Recheck

`FINAL PASS — P0/P1/P2 = 0/0/0`

同一 reviewer 对最终快照完成第二轮只读复验；首审 7 项、范围与 Cursor callback 文档项、`offline_access` 和 8 KiB body 上限均已关闭，没有剩余 P0/P1/P2。最终读回包括 `test:agent`、`test:agent:live`、typecheck、60 份文档治理、221 文件功能指纹、范围隔离后的完整 governance 与 `git diff --check`；reviewer 未编辑、暂存或提交。

这个 PASS 不授权 Preview migration/deploy、public MCP、真实账户/数据、Production、merge 或 push。001 保持 active；Gate 5 的完整错误/浏览器复合项、transition review、外部门禁和 closure 仍未完成，TRAE/WorkBuddy 真实连接属于 005。
