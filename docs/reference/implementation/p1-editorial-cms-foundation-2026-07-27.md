---
doc_contract: DocContractV1
doc_type: reference
authority: evidence
status: accepted
scope: p1-editorial-cms-foundation-evidence
last_verified: 2026-07-27
max_lines: 200
change_id: P1-EDITORIAL-001
---

# P1 Editorial CMS Foundation Evidence

## Result

`apps/web` 已在纯本地、全虚构数据边界内完成 Payload 3.86.0 编辑 CMS、PostgreSQL 16、角色权限、编辑工作流、双语公开隔离与公共 Guide 读取。实现者验证与产品负责人授权的代理独立复审均为 PASS；实现与证据已提交，checklist 已归档。

Migration 文件已经生成并检查，但状态保持 `Ran: No`。没有创建外部账号，没有连接共享或生产数据库，没有导入真实数据，没有部署或公开真实内容。

## Implemented Contract

- 公共站与 CMS 同处 `apps/web`，使用 `(frontend)` / `(payload)` route group 隔离 root layout；入口为 `/en`、`/es`、`/admin` 和 `/api`。
- Article 每个语言版本是独立文档，通过 `translationGroup` 关联；公开读取必须命中目标 `locale`、业务状态 `public` 与 Payload `_status=published`。
- 业务状态为 `draft / submitted / in_review / changes_requested / approved / public / archived`。批准不会自动公开；公开动作需要编辑角色和第二次确认。
- 从 `public` 转为 `archived` 会真正撤下旧公开版本；匿名页面立即返回 404。重新审阅、批准并确认公开后才恢复。
- 公共正文由项目自己的 server-only Lexical renderer 输出，不把 Payload Admin 客户端包带入公共 Guide。

## Permission Matrix

| Actor | Allowed | Denied and verified |
|---|---|---|
| Anonymous | 读取目标语言的公开文章、公开 People 与公开来源标签 | 草稿、错误语言、owner、editor comment、内部来源检查、workflow status |
| Author | 创建和修改自己的 draft / changes requested；提交与重提；读取自己的版本 | 读取或修改他人草稿；提交后继续编辑；批准、公开、修改角色 |
| Editor | 审阅全部文章；退回、批准、独立确认公开、撤回；维护分类、来源和评论 | 自行提升角色；绕过公开确认 |
| Super Admin | Editor 能力及测试账户、角色管理 | 仍受文章状态转换和公开确认约束 |

权限由 collection / field access、最新草稿版本所有权检查和服务端状态 hook 共同执行。Admin 中隐藏按钮不作为权限证明。

## Automated Checks

| Check | Result |
|---|---|
| `npm run lint` | PASS，0 errors；生成 migration 有 4 个 unused-argument warnings |
| `npm run typecheck` | PASS |
| `npm run build` | PASS，68 个静态页面；Admin 与 API 为动态路由 |
| `npm run test:editorial` | PASS；匿名英语 1、西语 0、撤回后 0、作者看到他人草稿 0、工作流事件 13 |
| HTTP transition probes | 匿名 401；作者公开 403；编辑未确认公开 403；编辑确认公开 200 |
| Withdraw / republish probes | Archive 200 → 公共 Guide 404 → `archived:draft`；重新批准确认后 Guide 200 → `public:published` |
| `npm audit --omit=dev` | 0 high / critical；5 moderate，均为 Payload PostgreSQL 带入且无兼容修复的旧 esbuild 开发工具链 |
| Full `npm audit` | 另有 9 high，来自既有 ESLint / minimatch 开发工具链 |

DOMPurify 已固定到审计通过的 3.4.12，消除了可兼容修复的 1 low / 1 moderate 链。剩余 esbuild 告警描述的是旧开发服务器被其他网站读取；本地数据库和应用只绑定回环地址，且没有把该开发服务器对外开放。未使用 `npm audit fix --force`。

## Schema And Migration

| Contract surface | Evidence |
|---|---|
| Payload config | Users、People、Taxonomies、Media、Articles、WorkflowEvents collections |
| Generated types | `src/payload-types.ts` 由 `npm run cms:types` 生成并通过 TypeScript |
| Live local schema | 从空卷启动后生成 23 个 public tables；测试恢复 4 个用户与 3 篇文章 |
| Migration artifact | `20260727_054408_p1_editorial_foundation.ts` / `.json`；`cms:migration:status` 为 `Ran: No` |
| Runtime | Local API、REST transition endpoint、Admin 和匿名公共读取均通过 |

Migration 未被当作 live local schema 已执行的证明；开发期 local push 与待执行 migration 状态在证据中分开记录。

## Recovery Drill

1. 只读确认 Compose 项目下唯一目标卷为 `chinaknowledge-web_cms_pgdata`。
2. 停止 dev server，执行 `docker compose down`，只删除该明确命名卷。
3. `docker compose up -d cms-db` 后启动 dev server，由开发期 push 从空库重建 schema。
4. `/admin` 返回 200；`npm run test:editorial` PASS；回读得到 23 个表、4 个虚构用户和 3 篇虚构文章。

恢复演练没有执行 migration，也没有触碰共享或生产数据。Fixture 公共读路径仍可通过 `CMS_READ_MODE=fixtures` 恢复。

## Browser Checks

- Editor 的 approved 状态显示 `Request changes / Publish`；点击 Publish 后只显示 `Confirm publish / Cancel`，未确认不会发起公开。
- 公开确认摘要回读已保存草稿，逐项展示标题、作者、对象、语言、URL、来源、分类和 Freshness；摘要未就绪时不能确认。
- Author 的 draft 状态只显示 `Submit for review`，没有 Publish；提交后正文和元数据变为只读。
- Payload 默认 Publish / Unpublish 按钮已移除，避免绕过业务工作流。
- Admin 桌面与窄屏没有 Next.js error overlay 或 console error；窄屏顶部状态栏不再造成横向溢出，公开确认按钮均达到 44px 高。
- CMS 英语 Guide、公共首页和 `/admin` 均正常加载；未公开西语 URL 返回 404且不回退英语正文。
- 公共 Guide 在移动断点下 `scrollWidth` 与 `innerWidth` 均为 312px，没有横向溢出；桌面与移动检查均无 console warning / error。
- 公共 Guide 客户端 chunk 不包含 `(payload)` Admin 路由或 Payload RichText UI 包。

## Screenshots

| Surface | Evidence |
|---|---|
| Author draft | [`p1-cms-author-draft-desktop.jpg`](assets/p1-cms-author-draft-desktop.jpg) |
| Author submitted read-only | [`p1-cms-author-submitted-readonly-desktop.jpg`](assets/p1-cms-author-submitted-readonly-desktop.jpg) |
| Editor public | [`p1-cms-editor-public-desktop.jpg`](assets/p1-cms-editor-public-desktop.jpg) |
| Editor publish confirmation | [`p1-cms-editor-publish-confirmation-desktop.jpg`](assets/p1-cms-editor-publish-confirmation-desktop.jpg) |
| Editor publish confirmation mobile | [`p1-cms-editor-publish-confirmation-mobile.jpg`](assets/p1-cms-editor-publish-confirmation-mobile.jpg) |
| Public CMS Guide | [`p1-cms-public-guide-desktop.jpg`](assets/p1-cms-public-guide-desktop.jpg) |
| Independent review: publication confirmation | [`p1-cms-independent-review-confirmation-desktop.png`](assets/p1-cms-independent-review-confirmation-desktop.png) |
| Independent review: publication confirmation mobile | [`p1-cms-independent-review-confirmation-mobile.png`](assets/p1-cms-independent-review-confirmation-mobile.png) |
| Independent review: public Guide | [`p1-cms-independent-review-public-guide-desktop.png`](assets/p1-cms-independent-review-public-guide-desktop.png) |

## Copy Gate

新增 Admin 可见文字只包含对象名、字段名、业务状态和动作。Collection API 地址、Payload `_status`、`Payload Settings` 标题与上传拖放操作提示均已从编辑界面移除；没有加入操作教学、工程术语、模板营销文案或解释性长文。公开页没有暴露 owner、workflow、schema、数据库或权限内部状态。

## Independent Review

- Reviewer：Codex，经产品负责人明确授权代理复审；本次是独立复审轮次，不构成不同人员隔离。
- Review scope：作者草稿与提交后只读、编辑退回/批准/公开确认、移动端发布确认、英语公开与西语未公开隔离。
- Initial result：BLOCK。公开前确认未逐项展示八项核对信息；移动端操作按钮未达到 44px。
- Fix and retest：公开摘要改为从已保存草稿回读；八项信息齐全；Cancel 保持 Approved 且公共页 404；Confirm 后变为 Public；后台移动按钮 44px；公共 Guide 移动端无横向溢出。
- Final result：PASS（2026-07-27）。
- Commit：产品负责人已批准；实现、证据与归档收口已提交。
