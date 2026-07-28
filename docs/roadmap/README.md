---
doc_contract: DocContractV1
doc_type: router
authority: routing
status: active
scope: execution-roadmap
last_verified: 2026-07-29
max_lines: 100
---

# Roadmap Router

本页是当前执行与后置工作的唯一队列。详细步骤进入 [`checklists/README.md`](checklists/README.md) 挂载的单项 checklist。

## Active

[`PUB-CURATION-001 Member Publishing And Editorial Curation Closure`](checklists/member-publishing-curation-closure.md)：本地核心 slice 已完成两轴状态、同 Article 策展、原作者署名、个人/官方 read model、稳定路由、草稿与 Person 预览、版本历史、Member/Editor 工作台和账户生命周期；最终代码基线 `8956ee7` 已通过产品/UX与技术/权限/migration 双重独立复审，事务通知、完整双语/无障碍验证、Preview 和 Production 仍按各自门禁推进。

## Deferred

| 工作项 | 进入条件 |
|---|---|
| P3 平台深化 | 有真实访问、订阅和作者运营数据 |

P0 Stitch 设计原型、P1 可运行公共产品切片、P1 编辑 CMS 基础、P2 Preview release candidate 与 Production launch 已经完成，历史与交接见 [`archive`](../archive/README.md)。

## 状态规则

- 只使用 `active`、`deferred`、`completed`、`superseded`。
- 阻塞原因写在 checklist 内，不创造新状态。
- 完成项写回 current 和 decision 后移动到 archive。
- Deferred 工作不获得实现授权；开始前必须建立 active checklist。
