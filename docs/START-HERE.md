---
doc_contract: DocContractV1
doc_type: router
authority: routing
status: active
scope: task-recovery
last_verified: 2026-07-26
max_lines: 100
---

# Start Here

新线程和 Agent 从这里按任务恢复。先读根目录 `README.md` 和本页，再打开一组最小材料。

| 任务 | 继续读取 |
|---|---|
| “现在是什么状态” | [`current-state.md`](current-state.md)、相关 active checklist、当前 repo/runtime 证据 |
| “App 有什么功能”或功能影响分析 | [`product-feature-registry.md`](product-feature-registry.md)、受影响源码；开发后更新登记册指纹 |
| 新需求或产品讨论 | [`product-brief.md`](product-brief.md)、[`roadmap/README.md`](roadmap/README.md) |
| Agent Workspace、MCP 或 Agent 权限 | [`agent-workspace-requirements.md`](agent-workspace-requirements.md)、相关 active checklist、CMS 权限与业务端点 |
| Stitch、UI 或文案 | [`../DESIGN.md`](../DESIGN.md)、相关设计 reference、active checklist |
| 实现或修复 | [`architecture/development-governance.md`](architecture/development-governance.md)、active checklist、相关源码 |
| CMS、权限、数据或 migration | 开发治理合同、相关 architecture、权限与 migration 证据 |
| 审计或复核 | 当前状态、目标 checklist、范围内源码和证据；默认只读 |
| 决策追溯 | [`decisions/README.md`](decisions/README.md) 中命中的决定 |
| 完成历史 | [`archive/README.md`](archive/README.md) 中命中的归档 |

## 停止条件

已经能够回答或执行当前任务时停止扩读。链接是路由，不是预加载清单。

## 冲突顺序

1. 当前代码、运行结果和最新验证证据。
2. active checklist 的明确范围和验收。
3. `current-state.md` 的当前事实。
4. product、architecture、design 和 accepted decisions。
5. reference。
6. archive 和旧聊天。

发现冲突时更新已有权威文件，不创建旁路解释文档。
