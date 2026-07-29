---
doc_contract: DocContractV1
doc_type: checklist
authority: execution
status: active
scope: admin-payload-native-ui-reconstruction
last_verified: 2026-07-29
max_lines: 300
change_id: ADMIN-UI-001
risk_tier: upgraded
validation_profile: work_item
allowed_paths: apps/web/src/payload.config.ts, apps/web/src/payload-types.ts, apps/web/src/app/(payload)/**, apps/web/src/cms/access.ts, apps/web/src/cms/user-endpoints.ts, apps/web/src/cms/components/**, apps/web/src/collections/**, apps/web/tests/**, PRODUCT.md, DESIGN.md, .impeccable/live/config.json, docs/current-state.md, docs/product-feature-registry.md, docs/roadmap/README.md, docs/roadmap/checklists/README.md, docs/roadmap/checklists/admin-payload-native-ui-reconstruction.md, docs/reference/README.md, docs/reference/implementation/**, docs/archive/README.md, docs/archive/admin-payload-native-ui-reconstruction.md
approval_gates: checklist-commit, payload-native-baseline, visual-direction, product-code, permission-change, dependency-install, database-schema, migration, preview-deploy, production-deploy, real-data, public-routing, merge, push
---

# Payload-native Admin UI Reconstruction

目标：以仓库当前锁定的 Payload `3.86.0` 原生 Admin 为基线，系统审计并重构全部自定义 Admin UI。Payload 已成熟解决的导航、列表、表单、编辑器、上传、状态反馈和响应式行为直接复用；自定义只承担 China, in Fact 独有且原生能力无法表达的业务任务。

本工作是 Admin 桌面端专项，不是重新设计 Payload，也不是把截图问题逐个打补丁。

## Scope

- 覆盖 `/admin` 登录后的全部可见 Admin 界面：壳层、Dashboard、列表、编辑页、上传、弹层、状态、空态和错误态。
- 覆盖 `Member`、`Editor`、`Super Admin` 三种角色及 `My work`、`My profile`、`Needs attention`、Members、People、Images、Articles、Categories、Places、Activity。
- 审计 `payload.config.ts`、`custom.scss`、全部 `cms/components` 和 collection admin 配置之间的组合关系。
- 首要视口为 `1440×900` 和 `1920×1080`，补验 `1280×800`；移动端只做灾难性回归检查。
- 保护现有发布、策展、翻译、邀请、权限、版本、锁定、自动保存和媒体业务能力。
- 为每个自定义组件形成可追溯裁决：删除、使用原生扩展点组合、或最小保留。

## Payload-native First

仓库当前安装的 Payload `3.86.0` 源码、类型声明和实际运行界面是唯一原生能力基线，不按其他版本文档或印象判断。

每个自定义项在动代码前必须记录：

1. Payload 当前是否已有对应的原生界面、行为或受支持扩展点。
2. China, in Fact 的真实业务缺口是什么。
3. 裁决是 `remove`、`compose` 还是 `retain-minimal`。
4. 为什么原生能力不足，以及保留自定义的最小边界。
5. 自定义是否破坏原生布局、键盘行为、权限、状态反馈或升级兼容性。
6. 删除或回退自定义后如何恢复到 Payload 原生状态。

硬规则：

- 不为品牌感、视觉新鲜感或“看起来更定制”替换成熟的 Payload 原生界面。
- 优先使用受支持的 `beforeNavLinks`、`afterNavLinks`、`beforeListTable`、field component、document control 和 dashboard widget 等扩展点。
- 默认不替换 `Nav`、collection list、document edit、表单控件、上传器、对话框、抽屉和系统状态组件。
- 不重新实现 Payload 已提供的搜索、筛选、排序、分页、Create New、验证、toast、autosave、versions、document lock 和 accessibility 行为。
- 不用绝对定位、负 margin、固定像素位移或依赖 Payload 私有 DOM 层级的选择器修补截图。
- 整页或核心原生组件替换必须单列证据，并再次取得用户批准；不能混在普通样式整理里实施。

## Initial Component Disposition

以下是执行起点，不是无证据的最终结论。原生基线审计可以把 `compose` 或 `retain-minimal` 下调为 `remove`，不得无批准上调为整页替换。

| 当前自定义项 | 初始裁决 | 允许承担的最小职责 |
|---|---|---|
| `AdminNav` | `remove → compose` | 恢复原生 Nav；仅通过官方 nav link 扩展点补 My work、My profile、Needs attention |
| `AdminLogo` / `AdminIcon` | `compose` | 只替换品牌图形，不改变原生壳层尺寸和定位 |
| `MemberWorkspace` | `retain-minimal` | 保留角色任务入口与队列数据；放回原生 dashboard/gutter/widget 几何体系 |
| `NewArticleStart` | `remove` 优先 | 优先进入 Payload 原生 Create New；只有标题、语言和 owner 建立无法安全完成时才保留最小入口 |
| `InviteMember` | `retain-minimal` | 保留邀请与重发业务；进入原生 list 容器/扩展点，不覆盖标题栏和表格 |
| `ArticleWorkspaceMode` | `retain-minimal` | 仅表达 Writing / Site 两种领域任务，不替代 Payload document shell |
| `NoPublishButton` | `retain-minimal` | 只处理两轴状态与 Payload 单轴发布按钮的冲突 |
| `WorkflowActions` | `retain-minimal` | 只处理个人发布与站方策展动作 |
| `TranslationActions` | `retain-minimal` | 只处理英西关联创建与跳转 |
| `ProfileActions` | `retain-minimal` | 只处理 Person 预览、公开与撤回 |
| `ProfileFocus` | `remove` 优先 | 用 field access、原生 condition 或安全配置实现；禁止靠 CSS 隐藏治理字段 |
| `SaveSafetyStatus` | `remove` 优先 | Payload 原生 autosave、lock、validation、toast 足够时删除；只保留经失败测试证明的缺口 |
| `UploadAccessibility` | `remove` 优先 | 当前 Payload 原生上传语义通过后删除；不长期维护重复控件 |
| `ProfileLinkRowLabel` | `compose` | 继续使用受支持的 RowLabel 扩展点，且只输出短标签 |
| `PublicUseApprovalField` | `retain-minimal` | 只表达现有业务字段，不重做原生 field shell |

## Desktop Page Contracts

### Shell and navigation

- 左侧导航、折叠、顶部栏、账户入口、breadcrumbs 和 content gutter 以 Payload 原生实现为准。
- 品牌只能占用 Payload 提供的 graphics 区域；不能用自定义品牌节点改变导航宽度或主内容起点。
- 角色差异通过可见链接和权限配置表达，不复制一套壳层。

### Dashboard

- Dashboard 只承载当前角色最重要的工作入口、最近工作和必要队列，不出现漂浮在远端的控件。
- 标题、动作、列表和队列进入一个稳定容器；使用 Payload spacing、button、card/list 语义或 dashboard widget 能力。
- 快速起稿默认改走原生 Create New；若保留自定义起稿，必须在视觉门禁中证明其不破坏标题区和网格。

### Collection lists

- 原生标题、Create New、搜索、Columns、Filters、表头、排序、分页和行交互保持完整。
- 业务扩展放入 Payload 支持的 list 扩展点；不得把邀请表单插到 document title 与原生 list toolbar 之间造成跨屏散落。
- Members 只能保留一个清晰的新建路径。邀请与 Payload 原生 Create New 的角色关系必须在基线裁决中明确。

### Document edit

- 保留 Payload 原生 document header、form fields、sidebar、validation、save/autosave、versions、lock、upload 和 preview 结构。
- Writing / Site、publication / curation、translation 等业务动作只能组合到受支持区域，不得改变原生字段的基本交互。
- My profile 不得靠 DOM 或 CSS 隐藏无权查看的字段；权限和可见性必须由服务端访问规则与受支持的 admin 配置共同保证。

## Work

- [x] 用户批准并提交本 checklist，建立后续产品代码的 HEAD 授权基线；commit `c9e228b`。
- [x] 在隔离的本地测试数据上恢复并截图 Payload `3.86.0` 原生 Admin 基线；未连接或改写 Production 数据。
- [x] 建立 `docs/reference/implementation/admin-payload-native-baseline-2026-07-29.md`，逐项记录原生能力、当前自定义、视觉问题、业务缺口与裁决。
- [ ] 对所有 Admin 路由建立页面 × 角色 × 状态清单，覆盖正常、空、加载、错误、disabled、modal/drawer 和长内容。
- [x] 输出 Dashboard、Members list、Article edit 三个桌面参考面，取得 `payload-native-baseline` 与 `visual-direction` 双门禁批准。
- [x] 恢复 Payload 原生 Nav、header、breadcrumbs、content gutter 与 collection list shell，移除整壳替换。
- [x] 把角色快捷入口迁移到 Payload 官方扩展点；保持服务端权限是最终边界。
- [x] 重组 Dashboard：保留业务队列，删除与原生 Create New 重复的快速起稿，恢复语言与负责人筛选。
- [x] 重组 Members：把 Invite / Resend 纳入原生 list 几何；用户已批准 `permission-change`，Invite 成为唯一开户路径，原生直接创建由服务端 access 拒绝。
- [x] 逐页审计 Articles、People、Images、Categories、Places、Activity，恢复 Payload 原生 list/edit/upload 行为。
- [x] 逐项执行组件裁决；新增的可访问上传 field wrapper 已补入基线证据。
- [x] 删除仅用于覆盖 Payload 几何的 CSS，收敛品牌 token、必要业务组件样式和窄范围适配。
- [ ] 校验 light/dark、缩放、长标题、长邮箱、英西内容、浏览器最小高度及所有 overlay stacking。
- [x] 完成 Anonymous、Member、Editor、Super Admin 权限负例和服务端直接请求负例；新增验证覆盖 context 伪造、直接创建、非 Super Admin 邀请拒绝及 Super Admin 邀请成功。
- [x] 完成 UI 重构的非主持独立视觉复审和技术/权限复审，两项均为 `PASS，P0/P1/P2 = 0/0/0`。
- [x] 完成 Members `permission-change` 增量独立复审：`PASS，P0/P1/P2 = 0/0/0`。
- [ ] 写回 current、feature registry、implementation evidence，完成后把 checklist 移入 archive。

## No-go

- 不建设第二套 Admin，不引入另一个后台 UI 框架，不重新设计 Payload 的成熟通用界面。
- 不修改 schema、migration、数据库数据、collection slug、公开 URL、hook 或业务状态机；唯一例外是用户已批准的 Members invite-only access 与 invite endpoint 服务端 context。
- collection 配置改动只允许 Admin 展示和受支持扩展点；不得借 UI 重构改变权限、字段语义或写入路径。
- 不改公开站点，不做内容编辑、批量邀请、真实邮件、真实账号或 Production 数据操作。
- 不安装依赖，不升级 Payload，不依据新版 Payload 文档重写当前 `3.86.0` 实现。
- 不把移动端作为设计主线；仅保证无灾难性横向溢出、遮挡或无法完成紧急操作。
- 不用说明性长文案解释错乱布局；通过层级、分组、对齐、控件状态和原生交互解决。
- 不为了让截图“像设计稿”隐藏 Payload 的重要系统状态、权限反馈或可访问性能力。

## Upgraded Boundaries

- `data_truth`：只使用 Local/Preview 虚构 fixture；Production 只允许经单独批准的只读参照。
- `read_path`：Member 只能读取自己的私有工作；Editor 与 Super Admin 的现有范围不扩大。
- `write_path`：邀请、文章、人物、媒体和策展写路径不变；本 change 不新增写 API。
- `permission_boundary`：服务端 access/hook 是最终边界；Users create 只允许已认证 Super Admin 通过 invite endpoint 注入的服务端上下文，直接 Admin/REST/Local API 创建均拒绝。
- `audit_boundary`：Activity 和 workflow event 继续只读，不因布局变化丢失 actor、时间或前后状态。
- `recovery`：无 migration；开户权限可通过把 `Users.access.create` 恢复为 `superAdmin` 并移除 invite context 恢复原生直接创建，其余 UI 批次可用 Git revert 回退。
- `independent_review`：非主持实现者分别做全路由桌面视觉复审与角色/权限负例复审，结论只能为 `PASS` 或 `BLOCK`。

## Acceptance

- 每个自定义 Admin 组件都有原生能力证据和 `remove / compose / retain-minimal` 裁决；没有“为了好看”保留或新增的替代实现。
- Payload 原生 Nav、list、document edit、fields、upload、dialog/drawer、search/filter/sort/pagination 和系统状态保持可识别且可用。
- `1440×900`、`1920×1080` 和 `1280×800` 下无控件漂浮、跨区散落、遮挡、意外超宽、异常留白或层级脱节。
- Dashboard 的标题、动作、最近工作和队列处于同一内容体系；首要动作清晰且不与原生入口重复。
- Members 页邀请/重发与原生 list toolbar、table 对齐；只保留一个清晰的新建账户路径。
- Articles、People 和 Images 的原生 autosave、versions、lock、validation、upload、preview 和错误反馈未退化。
- My profile 不显示 Member 无权查看的治理字段，且直接 API 负例仍被服务端拒绝。
- Member、Editor、Super Admin 的导航、页面入口和可执行动作与现有产品合同一致。
- 可见文案通过 `DESIGN.md` copy gate；没有内部术语、操作教程或为布局补洞的说明文。
- 移动端只需通过灾难性回归检查，不用以牺牲桌面信息密度换取移动端视觉精修。
- 独立视觉复审和技术/权限复审均 `PASS`，`P0/P1/P2 = 0/0/0`。

## Validation

- 原生基线：核对 `apps/web/node_modules/payload` 与 `@payloadcms/ui` 的 `3.86.0` 类型、实现和运行界面；记录实际使用的官方扩展点。
- 浏览器矩阵：三种角色 × 全 Admin 路由 × 三个桌面视口；补验空态、错误态、长内容、zoom 125% 和 overlay。
- 交互回归：Create New、Invite、Resend、search、filter、sort、pagination、edit、autosave、version、lock、upload、preview、publish/withdraw、curation 和 translation。
- 权限负例：跨 Member 私有读写、角色修改、自我提权、治理字段直读直写、Activity 改写和暂停账户登录。
- 视觉证据：重构前后同路由、同角色、同 fixture 截图；独立 reviewer 按桌面路由清单逐页签字。
- 人工扫描全部变更的可见文字，执行 `DESIGN.md` copy gate。
- `npm --prefix apps/web run typecheck`
- `npm --prefix apps/web run lint`
- `npm --prefix apps/web run build`
- `npm --prefix apps/web run test:editorial`
- `npm run feature-registry:check`
- `npm run governance:check`
- `git diff --check`

## Writeback

- 原生基线、组件裁决和逐页视觉证据：`docs/reference/implementation/admin-payload-native-baseline-2026-07-29.md`
- 稳定视觉规则：仅在形成长期规则时更新 `DESIGN.md`。
- 用户可用能力与入口：更新 `docs/product-feature-registry.md` 中受影响的 `MEM-02` 至 `MEM-16`、`EDT-01` 至 `EDT-09`、`ADM-01` 至 `ADM-10`。
- 当前实现事实：完成且验证后更新 `docs/current-state.md`。
- 当前执行入口：本 checklist、`docs/roadmap/README.md` 和 `docs/roadmap/checklists/README.md`。
- 完成历史：验证与复审通过后移动到 `docs/archive/admin-payload-native-ui-reconstruction.md`。

## Approval Gates

- `checklist-commit`：本 checklist 进入 HEAD 后，后续改动才获得路径授权。
- `payload-native-baseline`：用户先看原生基线、组件裁决和三张关键桌面参考面。
- `visual-direction`：视觉参考通过后才进入产品代码；未通过时只修改参考和裁决。
- `product-code`：单独批准本 checklist 范围内的本地产品代码修改。
- `permission-change / dependency-install / database-schema / migration`：默认禁止；若发现确有必要，停止并建立独立变更审批。
- `preview-deploy / production-deploy / real-data / public-routing`：分别批准；本地通过不自动获得任何外部操作权限。
- `merge / push`：分别批准，不从实现或 commit 授权推导。

当前门禁：`payload-native-baseline`、`visual-direction`、`product-code`、`permission-change`、`commit`、`push`、`preview-deploy` 与 `production-deploy` 已通过；本分支为 `main`，不涉及单独 merge。Members 仅保留 Invite 作为开户入口，原生直接创建由服务端权限关闭；部署不授权 migration、真实邀请、真实邮件、批量数据或内容公开。
