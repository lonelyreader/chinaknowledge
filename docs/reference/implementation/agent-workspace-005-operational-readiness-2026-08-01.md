---
doc_contract: DocContractV1
doc_type: reference
authority: evidence
status: active
scope: agent-workspace-005-operational-readiness
last_verified: 2026-08-01
max_lines: 180
---

# Agent Workspace 005 Operational Readiness

## Gate contract

本门只为现有 9 个 Agent 工具增加公网运营保护与支持证据，不新增业务工具、权限、schema、migration 或依赖。用户于 2026-08-01 批准 provider/firewall 与剩余 005 门禁；仍禁止 checklist 外能力和真实内容写入。

## Baseline

- Vercel CLI `58.4.4` 已登录 `lonelyreader`，project 为 `china-in-fact`。
- Firewall 已启用，System Mitigations active，Attack Mode off，IP block/system bypass 均为 `0`，没有 pending draft。
- 执行前只有 `Newsletter signup rate limit`：Production `POST /api/newsletter`，fixed window `5/600s/IP`，enabled。
- 应用层只有 DCR 最近 `50/60s` 与有效未绑定 client `500` 的数据库总量阈值；authorize/token/revoke/MCP 没有 durable IP rate limit。
- Vercel 提供 exact path/method/environment WAF、fixed-window 429、Firewall traffic/event、基础 request logs 和默认 error/critical alert，足以在 provider 层完成本门；高级 Metrics 查询需要付费 Observability Plus，本门没有启用，也不需要 serverless 内存计数器。

## Frozen rules

| Rule | Match | Fixed window | Result |
|---|---|---:|---|
| Agent DCR | Preview/Production `POST /api/agent/oauth/register` | `10/60s/IP` | excess `429` |
| Agent authorize | Preview/Production `/api/agent/oauth/authorize` | `30/60s/IP` | excess `429` |
| Agent token | Preview/Production `POST /api/agent/oauth/token` | `20/60s/IP` | excess `429` |
| Agent revoke | Preview/Production `POST /api/agent/oauth/revoke` | `20/60s/IP` | excess `429` |
| Agent MCP | Preview/Production `/api/agent/mcp` | `60/60s/IP` | excess `429` |

规则不设置持久封禁；正常 WorkBuddy/Cursor 证据均远低于阈值。DCR 低于应用全局 `50/60s`，先在边缘按来源收敛滥用；MCP 允许真实客户端短时工具链但限制单来源持续突发。

## Observability and privacy

- HTTP：只查询 environment、path/route、method、status、request/deployment ID、region 和时间。
- Domain：只查询既有 `agent_events` 的 request ID、client family、tool、object type/id、result 和 occurredAt。
- 支持顺序：先按 deployment/route/status 定位 HTTP，再按 request ID 定位 Agent audit；不得读取 token、code、cookie、email、title/body、confirmation、数据库 URL 或对话。
- 告警：沿用 project default error/critical alert 和 Firewall alerts；本门不创建外部收件人、Webhook、Log Drain 或付费集成。

## Execution evidence

- Rollout：先发布 5 条 `log` rule；等待完整 10 分钟观察窗后，Firewall dashboard 显示每条规则各命中 `1` 次、合计 `Logged 5`，既有 Newsletter rule 未变化。随后只把相同 5 条 rule 改为冻结的 fixed-window rate limit；每次 publish 前后 diff 与 live JSON 均已读回，最终 `hasDraft=false`、`pendingChanges=0`。
- Threshold：在 SSO 临时关闭、Gateway 仍关闭的 stable Preview alias 上逐条压测。DCR 为 `10x404 + 2x429`，authorize 为 `30x404 + 2x429`，token/revoke 各为 `20x404 + 2x429`，MCP 在先前已有 1 次允许请求后为 `59x404 + 3x429`；总允许量与五个冻结阈值一致。非 Agent 首页保持正常 redirect，没有被规则误伤。
- Window/recovery：超过 60 秒后 token probe 恢复 `404`，不再 `429`。DCR rule disable/publish 后饱和请求恢复 `404`；enable/publish 后 live JSON 重新读回 `10/60s/IP`，证明 provider rollback 可逆。
- Observability：Firewall live traffic 显示 `Allowed 178`、`Logged 5`、各 rule event/group 命中且无 active deny IP 或近期 alert；project activity 留下 rule draft/publish 与 SSO disable/enable actor/timestamp。基础 function logs 不把在 SSO/WAF/404 层终止的请求伪装成函数事件；高级 Metrics 查询返回 `payment_required`，没有启用付费能力。支持查询仍按 Firewall route/status/deployment，再在 Gateway 开启且已有域事件时用 request ID 对应 `agent_events`。
- Runtime/security：专用 Local 数据库依次执行 13 条 migration；修正测试用 secret 长度后 `test:agent:live` 通过，覆盖 token replay 导致 connection compromised、revoke、权限矩阵、confirmation 与 cleanup。随后 `test:agent`、typecheck、lint 和 build 通过；lint 为 `0 error / 40` 条既有 migration warning。
- Cleanup/readback：两个专用 Local 数据库均已精确删除，本轮启动的 PostgreSQL 已停止。Preview SSO 从精确基线 `all_except_custom_domains` 临时关闭后已恢复同值；匿名 public/Admin/health/metadata/MCP 全部回到 `302`。Gateway 始终关闭，stable alias 未移动，未创建 client、connection、Agent event 或内容 fixture。
- Privacy：命令和写回只保留 route、method、status、threshold、deployment/activity 元数据与聚合计数；没有输出 token、code、cookie、数据库 URL、账号、正文、confirmation 或对话。
