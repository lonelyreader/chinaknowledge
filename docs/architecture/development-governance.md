---
doc_contract: DocContractV1
doc_type: contract
authority: canonical
status: active
scope: development-governance
last_verified: 2026-07-26
max_lines: 240
---

# Development Governance V1

本合同约束 China, in Fact 的需求、设计、实现、审查、数据变更和发布。文档结构与防膨胀规则由
[`document-governance.md`](document-governance.md) 负责。

## 任务授权与完成合同

| 用户任务 | 默认授权 | 完成或停止条件 | 默认写回 |
|---|---|---|---|
| 回答、解释、状态报告 | 只读检索和必要核验 | 问题已回答，事实有当前证据 | 没有长期变化时不写回 |
| 审计、复核、review | 只读检查和结论 | finding 有证据、状态和边界；不直接修复 | 需要长期追踪时写入现有 checklist 或 reference |
| 诊断 | 只读复现、源码和运行核查 | 根因或最小阻塞已确认；没有修复授权时停止 | durable blocker 写回所属 checklist |
| 计划、新需求、intake | 只读调研、登记和拆解 | 验收、风险、依赖和授权边界明确 | 更新 roadmap 和唯一 checklist |
| 修复、实现、更新、完成 | 范围内本地编辑和相称验证 | 验收满足，相关门禁通过或 blocker 已说明 | 只写发生变化的 current、decision、checklist 或 reference |
| commit、merge | 只执行用户点名的 Git 动作和范围 | scope、staged diff 和验证复核完成 | checklist 记录 commit 或 merge 结果 |
| migration、生产部署、批量公开 | 不由本地“完成”自动授权 | 单独批准、计划、执行、回读和恢复证据完成 | release checklist、current 和 reference |

付费服务、provider 激活、DNS、密钥、真实个人数据、破坏性操作和 scope 扩张也必须单独批准。

## ChangeContractV1

任何进入代码、配置、schema 或 CI 的工作，必须先由一个 active checklist 登记：

```yaml
change_id: CKH-AREA-NNN
status: active
risk_tier: base | upgraded
validation_profile: slice | work_item | phase_release
scope: 本次要实现的唯一结果
allowed_paths: 可以修改的路径
no_go: 明确禁止扩张的内容
acceptance: 用户可观察或机器可证明的完成条件
validation: 本层级实际运行的检查
writeback: 完成后更新的正式真相源
approval_gates: 仍需单独批准的动作
```

规则：

- 一个 checklist 只拥有一个清晰交付目标。
- 代码 diff 必须落在 `allowed_paths`。
- 已有 active checklist 且覆盖当前工作时，不重复创建 intake。
- 同一个代码 diff 中临时补写的清单不能掩盖未经登记的实现。
- 正常 diff 由 `HEAD` 中已经 active 的 checklist 授权；该合同可以覆盖自身完成并以同名文件移入 `docs/archive/` 的 closeout diff。
- 唯一例外是首次建立本治理基线：必须有用户明确授权、标记 `bootstrap: true`，并在首次治理提交后立即归档；此例外不能再次使用。
- 完成后 checklist 进入 archive，当前事实写回 current；不要把完成项长期留在 active 队列。

## 风险分级

### Base

用于文档、独立设计、fixture、低风险单点 UI 和不影响数据或权限的局部修改。

最低要求：

- 目标和路径边界明确。
- 运行目标检查。
- 检查可见文案与移动端状态。
- 运行治理检查和 `git diff --check`。

### Upgraded

以下范围自动升级：

- CMS 登录、用户、作者、Editor、Super Admin 和访问控制。
- 作者所有权、审核、公开、撤回和版本历史。
- 数据库 schema、migration、批量数据操作和个人数据。
- 英语与西班牙语独立内容状态与 fallback。
- Newsletter 邮箱、外部链接审核和安全边界。
- shared code、跨域改动、生产、历史事故复发面。

除 Base 字段外，还必须明确：

- `data_truth`：数据真相及目标环境。
- `read_path` / `write_path`：读写路径。
- `permission_boundary`：允许和禁止的角色行为。
- `audit_boundary`：应记录什么。
- `recovery`：失败后的恢复方式。
- `independent_review`：由未主持实现的人给出 PASS 或 BLOCK。

测试、typecheck 或 build 通过不能单独证明作者、编辑或读者的真实任务可用。

## 验证层级

| Profile | 用途 | 最低证据 |
|---|---|---|
| `slice` | 单个文档、组件或局部行为 | 目标检查、diff、必要的视觉或文案检查 |
| `work_item` | 一条完整用户或编辑流程 | 聚合检查、浏览器主流程、权限负例、正式写回 |
| `phase_release` | 合并、migration、生产发布或阶段关闭 | preview smoke、migration plan、恢复方案、独立复审、人工批准和发布后回读 |

每次只选择一个主 profile，再补 changed-path 触发的检查。不要同时重复运行聚合门禁和它已经包含的命令。

## 环境与生产边界

环境固定为：

- `local`：本地开发，可使用 fixture。
- `preview`：PR 或阶段验收，不使用生产个人数据。
- `production`：真实用户、内容和外部服务。

以下动作分别授权：

1. 合并代码。
2. 执行 migration。
3. 部署 production。
4. 批量创建或修改真实数据。
5. 让内容对外公开。

英文内容通过不能自动公开西班牙文；代码部署也不能自动批量公开文章。

## Git 与交付

- `main` 应保持可构建、可部署。
- 一个分支和 PR 对应一个 active checklist。
- 分支使用 `codex/<change-id>-<slug>`，除非用户指定其他名称。
- 只暂存当前任务文件；提交前检查 staged diff。
- schema、权限、生产和内容公开必须保留回退或恢复证据。
- 未经请求不 commit、merge、push 或创建 PR。

## 写回矩阵

| 发生变化 | 写回 |
|---|---|
| 当前真实能力、运行入口、环境 | `docs/current-state.md` |
| 产品定位、栏目或角色 | `docs/product-brief.md` |
| 长期工程规则 | `docs/architecture/` 中现有合同 |
| 当前执行状态 | `docs/roadmap/README.md` 和 active checklist |
| 已接受且以后仍要遵守的选择 | `docs/decisions/` |
| 截图、调研、验证和复审证据 | `docs/reference/` |
| 已完成或被替代的执行材料 | `docs/archive/` |
