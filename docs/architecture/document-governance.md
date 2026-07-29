---
doc_contract: DocContractV1
doc_type: contract
authority: canonical
status: active
scope: document-governance
last_verified: 2026-07-26
max_lines: 180
---

# Document Governance

本合同约束仓库文档的职责、路由、体积和机器检查。任务授权、风险和交付规则由
[`development-governance.md`](development-governance.md) 负责。

## DocContractV1

所有 `docs/**/*.md` 必须包含：

```yaml
doc_contract: DocContractV1
doc_type: router | product | current | contract | checklist | decision | reference | archive
authority: routing | canonical | execution | evidence | historical
status: active | deferred | completed | superseded | accepted
scope: 本文唯一负责的主题
last_verified: YYYY-MM-DD
max_lines: 数字
```

Active checklist 还必须声明 `change_id`、`risk_tier`、`validation_profile`、
`allowed_paths` 和 `approval_gates`。

## Router

- Router 只回答去哪里、什么时候读、不要读什么。
- Router 不包含 checkbox、完整任务步骤、证据正文、长历史或实现细节。
- 根 `AGENTS.md` 不记录阶段、当前任务 ID、端口、日期或其他短期状态。
- Router 最多 120 行，通常控制在 80 行以内。
- 链接只用于按需读取，不是启动时的全量预读清单。

## 权威边界

- 同一个 `scope` 只能有一个 `authority: canonical`。
- Product 只定义稳定产品；阶段和执行顺序进入 roadmap。
- Design 只定义长期界面合同；具体页面交付进入 checklist。
- Reference 只能举证或保存未接受建议，不能决定路线或授权实现。
- Archive 只能追溯，不能重新授权实现。
- Checklist 只决定当前交付，不重写长期产品或架构合同。
- 决策采用一项一文件和短索引，不维护不断增长的单文件决策日志。

## 拆分触发器

命中任一条件必须重构文档：

- 超出 `max_lines`。
- 同时承担 router、contract、checklist、evidence 中两个以上职责。
- 新内容无法由现有标题清晰归属。
- 同一事实需要在三个以上文件重复更新。
- 新线程必须通读全文才能找到当前入口。

拆分后原权威文档保留短路由或收窄 scope；禁止通过新建“补充说明”“最终版”或
“V2 总结”形成平行真相。

## 机器门禁

`npm run governance:check` 至少检查：

- frontmatter、字段枚举和行数预算。
- canonical scope 唯一性。
- 本地 Markdown 链接和各目录 router 挂载。
- Router 不含 checkbox。
- Active checklist 的合同字段与必需章节。
- 当前工作树中的所有改动都被 active checklist 的 `allowed_paths` 覆盖。
- 功能实现观察范围与 `product-feature-registry.md` 的实现指纹一致。
- 稳定入口文件不混入阶段状态或执行清单。

机器检查证明结构、路径覆盖和功能登记所对应的实现快照一致。登记册的自然语言是否准确，
仍需在任务验收和独立复审中按受影响功能编号核对。
