---
doc_contract: DocContractV1
doc_type: reference
authority: evidence
status: active
scope: agent-workspace-005-production-runtime
last_verified: 2026-08-01
max_lines: 220
---

# Agent Workspace 005 Production Runtime

## Gate contract

Gate 5 只应用仓库既有 migration `20260730_181300`，并以 Agent Gateway 关闭态完成 staged Production release。用户已批准剩余冻结门禁；仍禁止新 schema/migration、真实内容改写、批量动作、额外依赖、付费能力和 checklist 外路径。

## Read-only baseline

- Production 当前 deployment 为 `dpl_AtoZhpk3PudBrkZPq9NZfzDgxYbG`，状态 `READY`；Agent Gateway 关闭。
- 数据库为 33 张 public table、12 条 migration，最后一条为 `20260729_193000_batch_rollback_barrier`；没有 Agent table。
- 只读计数为 User/Person/Media/Article/workflow `2/2/2/3/10`：1 Super Admin、1 author；1 public Person、1 draft Person；2 Published + Curated Article、1 draft + not_selected Article。它们都是既有真实对象，不属于 005 fixture 或清理范围。
- 最近一次 scheduled backup run `30692830561` 成功：数据库对象与 SHA readback PASS，isolated restore 为 `33/12/12/8`，业务计数为 `2/2/3/2/10`，4 个 media object 完成备份/readback。

## Recovery amendment D validation

- Workflow changed path 只有 `.github/workflows/production-backup.yml`。没有改 schedule、export/upload、R2/Blob、secret/vars、media verification、migration 文件、应用代码或依赖。
- Exact diff 只增加 named migration `20260730_181300`，critical tables 只增加 `agent_oauth_clients`、`agent_connections`、`agent_events`，accepted tuple 从 `33,12,12,8` 更新为 `39,13,13,11`。
- Ruby YAML parse 与 `git diff --check` PASS。
- 专用 Local database `chinaknowledge_agent005_workflow_20260802_0031` 从空库顺序执行全部 13 条 migration，最后一条为 `20260730_181300`；复用 workflow 的 exact SQL 读回 `39,13,13,11`。
- 专用数据库已精确删除并读回不存在；本轮启动的 Local PostgreSQL 已停止。

## Pending execution

Recovery amendment D 已由未主持实现者独立复审 `PASS`，`P0/P1/P2 = 0/0/0`。提交/push workflow 后按顺序执行：default branch 新 backup PASS → apply 既有 migration → 空 Agent tables readback → 本分支更新 workflow backup PASS → Gateway-off staged deployment。每一步失败即停止，不进入 Gate 6。
