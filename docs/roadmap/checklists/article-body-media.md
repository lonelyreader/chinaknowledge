---
doc_contract: DocContractV1
doc_type: checklist
authority: execution
status: active
scope: article-body-media
last_verified: 2026-08-11
max_lines: 160
change_id: INFRA-BODY-MEDIA-001
risk_tier: upgraded
validation_profile: work_item
allowed_paths: apps/web/src/payload.config.ts, apps/web/src/components/CMSRichText.tsx, apps/web/src/app/(frontend)/globals.css, apps/web/src/collections/Articles.ts, apps/web/src/collections/EditorialMasters.ts, apps/web/src/payload-types.ts, apps/web/src/app/(payload)/admin/importMap.js, docs/roadmap/**, docs/reference/**, docs/product-feature-registry.md
approval_gates: schema, migration, preview, production-deploy, commit, merge, push
---

# INFRA-BODY-MEDIA-001 正文媒体能力

目标：文章正文从纯文字升级为可承载图片与白名单视频嵌入的富内容——Lexical 启用 Upload 与受控 embed，前端渲染器与样式同步扩展。成员在网页编辑器即可插入自己上传的图片和 YouTube 视频。Agent 合同升级属 `INFRA-AGENT-MEDIA-001`，不进本批。

父级：[`Site Infrastructure Program`](../site-infrastructure-program.md)。

## Scope

- `lexicalEditor` 显式配置 features：保留现有段落/标题/引用/列表/链接，新增 Upload（relationTo `media`）与 embed 能力（首批只允许 YouTube，URL 白名单在服务端校验）。
- `CMSRichText` 渲染 upload 节点（`next/image` 或等价、alt 必填回退、caption）与 YouTube embed（`youtube-nocookie.com` iframe、惰性加载、固定纵横比）。
- 正文媒体样式以独立注释块追加到 `globals.css` 尾部（合并顺序见 TOKENS-001）。
- 功能登记册更新 MEM-04（文章写作）与 RDR-05（稳定文章页）的能力描述。

## No-go

- 不允许任意 iframe、script 或非白名单 embed 源；不支持的节点在渲染层显式失败或安全忽略并记录，不静默输出原始 HTML。
- 不改动 Media collection 权限、上传管道与唯一 pathname 逻辑。
- 不改 Agent 合同与工具（`apps/web/src/agent/**` 不在 allowed_paths）。
- 不迁移或改写既有文章正文数据。
- 富文本为 JSONB 存储；如实现确需 schema 变更，先停下走 schema/migration 门禁。

## Upgraded contract

- `data_truth`：Articles/EditorialMasters 的 richText JSONB，Local 开发，Preview 验收；Production 部署单独批准。
- `read_path`：公开文章页与登录态预览渲染新增节点类型。
- `write_path`：Payload 编辑器写入 upload/embed 节点；无新增服务端写端点。
- `permission_boundary`：正文只能引用作者本人可读的 media；embed 只接受白名单域名；匿名读者不因新节点获得任何未公开数据。
- `audit_boundary`：无新增审计面；沿用文章版本历史。
- `recovery`：feature 配置回退即恢复纯文字渲染；已插入节点在旧渲染器下安全忽略，不破坏页面。
- `independent_review`：非主持实现者按本合同复核渲染安全（XSS/任意 iframe 负例）、媒体归属与移动端表现，给出 PASS/BLOCK。
- `key_invariants`：既有文章渲染结果不变；无任意远程内容注入；封面逻辑与 Media 权限不变；EN/ES 行为一致。
- `finding_route`：编辑器体验类相邻问题进入 `INFRA-AGENT-MEDIA-001` 或父级登记新工作项；样式架构问题进入 `INFRA-TOKENS-001`。

## Acceptance

- [ ] 成员在网页编辑器可插入本人上传图片（含 alt/caption）并在预览与公开页正确渲染。
- [ ] 成员可插入 YouTube 链接成为受控 embed；非白名单 URL 被拒绝并有明确反馈。
- [ ] 既有纯文字文章渲染逐像素不变；390px 与 1440px 新节点无溢出。
- [ ] XSS 与任意 iframe 负例被服务端/渲染层双重拒绝。
- [ ] 功能登记册已更新并通过 `feature-registry:check`。

## Validation

- lint、typecheck、build、`npm run governance:check`、`git diff --check`。
- 浏览器主流程：插入图片、插入视频、预览、公开、匿名读回；负例：他人媒体 ID、非白名单域、脚本注入文本。
- 独立复审 PASS。

## Writeback

- 完成后：feature registry、current-state 写回；渲染安全证据入 reference；本 checklist 归档。

## Current gate

- [x] 用户批准建立本 checklist（2026-08-11，接手规划批次）。
- [x] 实现前冻结本批合同（scope/no-go/invariants 复读确认，2026-08-11）；实现已完成并通过本地静态验证，浏览器验证与独立复审待做。
- [x] 用户批准把生成文件 `payload-types.ts` 与 `importMap.js` 补进 allowed_paths 并执行再生成（2026-08-11）。
- [x] 独立复审 PASS（2026-08-11，非实现者，24 组 URL 负例 + 6 组 guard 负例全过；4 项 finding 已路由父级，见 program 登记）。
- [ ] Preview 验收与 Production 部署分别批准。
