---
doc_contract: DocContractV1
doc_type: contract
authority: canonical
status: active
scope: agent-workspace-program-control
last_verified: 2026-08-16
max_lines: 260
---

# Agent Workspace Parent Checklist

本页是 Agent Workspace 的唯一执行规划。稳定需求见 [`Agent Workspace Requirements`](../agent-workspace-requirements.md)；历史验收见 001–006 archive。本文定义剩余能力、顺序、门禁和完成条件，不直接授权代码、schema、migration、部署或真实数据动作。每个实现项开始前仍须建立独立 active `ChangeContractV1`。

## 完整的含义

MCP 完整，指 Member、Editor 与 Super Admin 能在 Agent 中完成高频、权限内、可恢复的真实任务，从发现对象到读取、修改、预览、确认、执行和读回形成闭环。完整不等于复制 Payload 后台的每个按钮，也不等于开放通用 CRUD。

- Member：维护自己的 Person、外链、媒体、英西文章关系、草稿、预览与个人公开。
- Editor：找到待处理内容，维护站方字段，完成复核、排期、策展与作者通知。
- Super Admin：处理站方 Article、安全的基础对象读取和审计；账户提权、暂停、删除等特权动作默认留在网页后台。
- 服务端：继续负责当前身份、角色、所有权、状态机、revision、确认、审计、读回和恢复。

## 当前基线（2026-08-16）

Production 当前 Super Admin 连接返回 14 个工具；这与主分支注册表一致，不是运行时漏注册。

| 能力层 | 已上线 | 主要缺口 |
|---|---|---|
| Member（9） | 账户与 capability、本人文章列表、工作副本、建稿、保存、预览、个人发布/撤回 | Person、外链、媒体、封面、正文媒体、翻译关系、列表分页筛选 |
| Editor（+3） | 精确读取一篇跨作者 Article、确认加入或移出站方入口 | 待处理队列、普通保存、负责人、分类、来源、时效、排期、复核、通知 |
| Super Admin（+2） | 站方 Article 受控批次公开、最近 20 条 Article 活动 | 站方建稿、基础对象查询、可筛选审计；特权账户动作保持网页入口 |

001–006 已完成 OAuth、远程 MCP、Member 文章闭环、单篇策展、最小审计、Production Gateway 和真实客户端兼容。Media 与 007 已实现、复审并合入本地 `main`；Production 仍是 14 个工具，本地 `main` 为 23 个，尚未完成统一 Preview、`main` push 和 Production deploy。

## 设计与安全原则

1. 工具按用户任务命名；不提供 `raw_query`、`run_sql`、`payload_update` 或任意 collection CRUD。
2. 优先扩展现有查询的筛选、分页和结果字段；只有独立业务动作才新增工具。
3. 读取最小字段；普通写入使用 revision、幂等键和写后读回。
4. 改变公开状态、排期或联系外部人员时使用 `prepare → 用户确认 → commit → readback`。
5. 角色、暂停/恢复、删除、migration、部署、密钥和无边界批量操作不进入普通 MCP。
6. 每次调用重新读取服务端账户、Person、连接、角色和对象关系；客户端 tool list 不授予权限。
7. 每个写工具记录 actor、connection、tool、object、request、前后 revision 和结果，不记录 token、完整私密正文或无关个人数据。
8. 不为一个字段建立新平台；复用现有 Payload access、hooks、版本、媒体和状态转换逻辑。

## 目标能力合同

工具名是规划基线；每个子级冻结合同时可做小幅命名校正，但不能削弱用户任务和安全边界。

| 任务族 | 最小能力 | 风险与边界 |
|---|---|---|
| 上下文与发现 | `account_context` 增加 Person 状态、完整度和公开路径；`my_articles_list` 增加分页/筛选；`editorial_attention_list`；受限 reference options | Read；字段白名单、稳定游标或页码 |
| 文章与媒体 | 保留现有文章工具；上线 Body V2、`media_upload`、`article_set_cover`、`my_media_list` | 本人媒体或已公开媒体；不提供删除 |
| Person 与外链 | `my_profile_get`（含 Preview path）、`my_profile_save`、`my_links_save` | 只改本人；链接类型、协议、数量和顺序由服务端校验 |
| Person 公开 | `my_profile_prepare_publication`、`my_profile_commit_publication`，覆盖公开和转私有 | 复用 Person 状态机；普通资料保存沿用网页即时保存语义，公开状态只经 prepare/commit 改变 |
| 双语关系 | 从本人 Article 建立另一 locale 的 translation draft，并读取配对状态 | 服务端固定 owner、author、translation group 和目标 locale；不覆盖既有版本 |
| Editor 工作台 | 待处理列表；精确读；保存负责人、format、分类、来源、freshness、编辑意见与站方封面 | Draft write；不改 owner、author、locale、translation group 或 Member publication |
| Editor 公共动作 | 保留站方选择；增加排期、复核和作者通知的 prepare/commit | 公共或外部动作逐次确认；通知失败可安全重试 |
| 站方与审计 | 站方 Article 建稿/保存；`admin_recent_activity` 增加受限筛选和分页；基础对象只读查询 | Super Admin；不开放通用批量写、账户提权或删除 |

## 不进入完成条件的网页专属动作

- 邀请或重发邀请、角色调整、暂停与恢复账户。
- 删除 User、Person、Article、Media、Category、Place 或审计记录。
- 任意 Person 代写、任意 Payload CRUD、SQL、migration、部署、DNS、密钥和备份恢复。
- 自动翻译、自动事实批准、自动公开或绕过作者和编辑的两个公开决定。

若以后有真实高频需求，必须建立独立 upgraded checklist，重新设计 step-up、确认、通知、恢复和 Production 负例；本计划不预先承诺开放。

## 执行路线

```mermaid
flowchart LR
    B["001–006<br/>已完成基础"] --> M["AGENT-MEDIA<br/>媒体与正文 V2"]
    M --> C["007<br/>Member 完整闭环"]
    C --> E1["008<br/>Editor 工作台"]
    E1 --> E2["009<br/>公共与外部动作"]
    E2 --> A["010<br/>安全站务"]
    A --> R["011<br/>Production 完整验收"]
```

| ID | 状态 | 唯一交付结果 | 依赖 |
|---|---|---|---|
| `AGENT-WORKSPACE-001`–`006` | completed | OAuth、Member 文章、策展、最小审计、Production 与客户端基线 | archive |
| `INFRA-AGENT-MEDIA-001` | active（release） | Body V2、图片上传、封面和发布预检进入 Production | 当前 Preview/`main` push/deploy 门 |
| [`AGENT-WORKSPACE-007`](checklists/agent-member-completion.md) | active（release） | 资料与外链、Profile Preview path/publication、翻译 draft、媒体列表、发现与当前角色 discovery 补齐 Member 闭环 | Local 实现/复审 PASS；统一 Preview 与 release 待执行 |
| [`AGENT-WORKSPACE-008`](checklists/agent-editor-workbench.md) | active（review） | Needs attention、reference options、Body V2 读取与站方字段普通保存形成 Editor 工作台 | Local 工作项 PASS；独立终局复审待执行 |
| `AGENT-WORKSPACE-009` | queued | 排期、复核与作者通知按公共/外部动作合同上线 | 008 |
| `AGENT-WORKSPACE-010` | queued | 站方 Article 建稿/保存、基础对象只读与可筛选审计 | 009 |
| `AGENT-WORKSPACE-011` | queued | 三角色真实客户端、权限负例、恢复和 Production 总验收 | 010 |

`queued` 只固定需求边界和依赖，不授权实现。原 queued `INFRA-AGENT-PROFILE-001` 已吸收进 007，不建立第二个 Profile checklist。Agent capability 同一时刻只允许一个 active 实现子级；只剩 release 回读的旧 checklist 不阻断下一子级本地实现。

## 分阶段清单

### 当前批次：媒体

- [x] Body V2、`media_upload`、`article_set_cover` 与预检已实现并通过独立复审。
- [x] 合入本地 `main`（`f100908`）；不再接受相邻代码扩项。
- [ ] 完成 Preview 权限矩阵和真实 MCP discovery。
- [ ] 经发布门完成 `main` push、Production deploy，并读回 Production 新工具。

### 已完成本地实现：Profile 与 Member 完整闭环（007）

- [x] 完成 `my_profile_get / my_profile_save / my_links_save`，覆盖姓名、头像关系、语言、主题、英西资料和最多 8 条外链。
- [x] `my_profile_get` 返回 Profile Preview path；公开/转私有使用 prepare/commit/readback。
- [x] 增加本人媒体列表、本人文章分页/筛选和账户上下文中的 Profile 状态/完整度。
- [x] 增加从本人 Article 建立另一语言 draft 的受控动作，并证明重复建立和跨人建立失败关闭。

### 已完成本地实现：Editor 工作台（008）

- [x] Agent 能从 Needs attention 找到目标，不要求用户先提供内部 Article ID。
- [x] Agent 能保存负责人、format、分类、来源、freshness、编辑意见和站方封面，不改变原作者与个人公开决定。

### 后续：Editor 公共与外部动作（009）

- [ ] 排期、复核、策展和作者通知分别按风险进入 prepare/commit；通知可读回、可重试、不重复发送。

### Super Admin 安全站务

- [ ] Super Admin 能创建和保存站方 Article，并继续使用现有受控发布清单。
- [ ] 基础对象提供完成任务所需的只读查询；不把 collection CRUD 暴露给 Agent。
- [ ] Activity 支持有限筛选和分页，同时继续隔离邮件、token、正文和内部错误详情。
- [ ] 账户提权、暂停、删除和任意代写的直调负例全部失败关闭。

### 最终发布

- [ ] Member、Editor、Super Admin 分别用真实客户端完成一条代表性闭环；低角色 discovery 不出现高角色工具。
- [ ] 覆盖 paused、missing Person、跨 owner、降权、撤销连接、disabled client、stale revision、过期确认、重复请求和超时读回。
- [ ] Preview、Production、真实账户、真实数据、公开状态和外部通知分别授权、执行、读回和恢复。
- [ ] Current、feature registry、roadmap、reference 与 archive 写回一致，Production capability list 与文档一致。

## 子级合同与验证

每个 007–011 子级都属于 upgraded 工作，开始前必须冻结：目标、allowed paths、no-go、data truth、read/write path、permission boundary、audit、recovery、关键不变量、finding route 和独立复审。最低验证统一包括：

1. 合同与 schema 测试、目标服务测试、typecheck、lint、build、governance 和 diff check。
2. 真实 Payload 权限路径；不以 mock、客户端角色或 tool discovery 代替服务端授权。
3. 正例、越权负例、revision 冲突、幂等重放、审计字段隔离和写后读回。
4. 公共或外部动作的 prepare 摘要、人工确认、短期凭证、commit、匿名/外部读回与恢复。
5. 未主持实现者最终 `PASS` 后才进入下一道门。

## Program Rules

- 父级不持有代码 `allowed_paths`，不绕过子级 ChangeContract。
- 一个 capability 实现子级未关闭时，不启动下一个；已完成实现、只等待 release 的旧 checklist 可以并存，但不再获得扩代码授权。
- schema、migration、Preview、Production、真实个人数据、公开状态、外部通知、merge 和 push 分别批准。
- 不为预想复用提前抽共享 SDK，不开发没有真实客户端需求的 CLI fallback。
- 每阶段结束都用当前运行、权限和用户任务证据重估后续范围；可以删减无实际价值的工具。

## Program Closure

只有在以下事实成立后才能关闭父级清单：

- Member 能完成含图片、封面、双语关系、个人资料、外链和个人公开的完整任务。
- Editor 能从队列开始完成普通编辑、策展、排期、复核和通知，不依赖内部 ID 或网页补最后一步。
- Super Admin 能完成已接受的安全站务；网页专属特权边界被清楚记录并有直调负例。
- 身份、权限、确认、审计、恢复、撤销和幂等均有 Production 证据。
- 所有 queued 能力已完成、取消或写成明确决定；不存在无归属的“以后再做”。
