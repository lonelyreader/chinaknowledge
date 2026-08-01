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
- Vercel 提供 exact path/method/environment WAF、fixed-window 429、Firewall traffic/event、request logs、function metrics 和默认 error/critical alert，足以在 provider 层完成本门；不需要 serverless 内存计数器。

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

待运行后写回 log-first、429、窗口恢复、query、cleanup、disabled Gateway 和 provider rollback 结果。
