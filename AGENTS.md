# AGENTS.md — China Knowledge Hub Agent Router

做路由。产品见 `docs/product-brief.md`，设计见 `DESIGN.md`，治理见 `docs/architecture/README.md`。

## Start

非轻量任务先运行 `git status --short --branch`，再读 `README.md` 和 `docs/START-HERE.md`。由 `START-HERE.md` 按任务补最小材料，证据足够后停止扩读。

## Authorization

- 回答、审计、诊断和计划默认只读；修改请求只授权范围内本地编辑与验证。
- commit、merge、migration、生产部署、真实数据、批量内容公开、付费、DNS、密钥和破坏性操作分别批准。
- 保留无关脏树，不擅自清理、回退、暂存、提交或归属其他改动。
- 规则见 [任务授权与完成合同](docs/architecture/development-governance.md#任务授权与完成合同)。

## Hard Boundaries

- UI 遵守 `DESIGN.md`；不用解释性文案补偿结构，不暴露内部术语或操作指导。
- 权限、schema、多语言公开、个人数据和生产动作属于 upgraded 风险，需权限负例、恢复和独立复审。
- migration、部署、真实数据和内容公开分别验证、分别授权。

## Intake And Writeback

- 新需求、bug 和优化进入唯一 active checklist；已有覆盖时不重复建。
- Checklist 必须声明范围、禁止项、风险、验收、验证、写回和审批门禁。
- Upgraded 工作在实现前冻结批次合同；独立复审只用合同违约、当前 diff 回归或直接安全失败阻断本批，其他 finding 路由后续；连续三轮 BLOCK 先校准范围。规则见开发治理合同。
- 验证只选 `slice`、`work_item` 或 `phase_release` 中一层，再补 changed-path 检查。
- 事实写 current，规则写 architecture，执行写 roadmap，决定写 decisions，证据写 reference，历史写 archive。
- 改动完成后运行 `npm run governance:check` 和 `git diff --check`。

## Documentation Shape

- Router 只放去哪里、何时读、不要读什么；不放清单、长历史或证据。
- 每个 scope 只有一个 canonical 文档；所有 `docs/**/*.md` 必须带 `DocContractV1` 和行数预算。
- 超预算时按职责拆分并由原 router 挂载，不建平行真相。
- 详细规则见 [文档治理合同](docs/architecture/document-governance.md)。

## Safety

- 不提交 `.env`、token、私钥、账号或个人数据。
- 不无请求升级依赖、扩大 scope、创建额外 App 或修改 Git 配置。
- 完成时报告验证、写回、未触碰范围和剩余事项。
