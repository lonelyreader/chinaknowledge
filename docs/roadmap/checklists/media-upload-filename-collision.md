---
doc_contract: DocContractV1
doc_type: checklist
authority: execution
status: active
scope: media-upload-filename-collision
last_verified: 2026-08-10
max_lines: 180
change_id: MEDIA-UPLOAD-001
risk_tier: upgraded
validation_profile: phase_release
allowed_paths: apps/web/package.json, apps/web/src/payload.config.ts, apps/web/src/app/(payload)/admin/importMap.js, apps/web/src/cms/components/UniqueVercelBlobClientUploadHandler.tsx, apps/web/src/cms/media-upload-filename.ts, apps/web/tests/media-upload-filename.ts, apps/web/tests/preview-config.ts, docs/current-state.md, docs/product-feature-registry.md, docs/roadmap/README.md, docs/roadmap/checklists/README.md, docs/roadmap/checklists/media-upload-filename-collision.md, docs/reference/README.md, docs/reference/implementation/media-upload-filename-collision-2026-08-10.md, docs/archive/README.md, docs/archive/media-upload-filename-collision.md
approval_gates: checklist-commit, product-code, push, merge, production-deploy, production-fixture, fixture-cleanup
---

# Media Upload Filename Collision

目标：同一浏览器或不同成员上传同名图片时，Production 不再因 Vercel Blob 路径已存在而失败；原图和 `card` 缩略图继续使用不可变、可追踪的地址。

## Frozen batch

- `data_truth`：Production Media、数据库记录与 Vercel Blob 是运行真相；本批不迁移或重写既有对象。
- `read_path`：Payload Admin 的 Images 上传表单，经客户端直传路由写入 Production Blob，再由 Payload 建立 Media 记录和缩略图。
- `write_path`：只改变新上传文件的路径生成；既有 Media、Person、Article、URL 和 Blob 不改写。
- `permission_boundary`：仍由 Media collection 的现有 create/read/update/delete access 决定；唯一文件名不授予额外权限。
- `audit_boundary`：沿用 Media 记录的上传者与公开使用字段；文件名不承载身份或授权。
- `recovery`：代码回滚到当前 Production deployment；本批没有 schema 或数据回填。Production fixture 必须使用唯一标记并在断言后精确删除。
- `independent_review`：未主持实现的 reviewer 对冻结合同、上传调用链、缩略图、权限和回滚给出 PASS 或 BLOCK。
- `key_invariants`：保持 `clientUploads: true`；不覆盖既有 Blob；`card` 地址与数据库文件名一致；不触碰既有内容和个人媒体；Local 继续使用本地存储。
- `finding_route`：孤儿 Blob 的长期清点、private media 或依赖升级另建后续工作项；除非当前 diff 造成数据泄露、覆盖或不可恢复，不扩大本批。

## Root cause

- 当前客户端 handler 在 Payload 计算数据库安全文件名之前，以浏览器 `File.name` 直接上传 Blob。
- `addRandomSuffix: false` 使 Vercel 对已存在的 pathname 返回冲突；同名文件、保存重试或孤儿 Blob 都能触发。
- 直接开启 adapter 全局随机后缀会同时作用于服务端生成的缩略图，现有回归门禁不允许缩略图文件名与记录失配。

## Scope

- 在客户端直传前为文件 basename 加入随机 UUID；扩展名保持不变。
- 把 Vercel 返回的实际 basename 写回 Payload 上传元数据，让服务端以同一名称生成可预测的 `card` 文件名。
- adapter 继续使用 `addRandomSuffix: false`，因此服务端缩略图不会再次随机化。
- 为同名两次上传、扩展名、无扩展名、隐藏文件和 config provider 替换增加自动验证。

## No-go

- 不使用 `allowOverwrite`，不覆盖同路径对象。
- 不关闭客户端直传，不降低上传尺寸能力。
- 不删除 `card` 缩略图，不修改 Media schema、migration、权限或公开批准逻辑。
- 不升级 Payload、Vercel Blob 或其他依赖。
- 不读取、下载、重命名或删除既有真实媒体。

## Acceptance

- 相同文件名连续生成两个不同 Blob pathname，basename 均保留原扩展名。
- Payload 记录使用客户端返回的实际 basename；原图和 `card` 缩略图都可读取。
- Production 用两个同名虚构图片依次创建两条 Media，均成功；断言后精确删除记录并确认 Blob 清理。
- 匿名与未授权上传继续失败关闭；Media 权限语义不变。
- `npm run governance:check`、`git diff --check`、目标测试、typecheck、lint、build 与独立复审通过。

## Validation

- `npm run test:media-upload-filename`
- `npm run test:preview-config`
- `npm run typecheck`
- `npm run lint`
- `npm run build`
- `npm run governance:check`
- `git diff --check`
- Production 两条同名 fixture 的创建、原图、`card`、删除和 Blob 读回

## Writeback

- 当前能力写入 `docs/current-state.md`。
- Media 运营入口写入 `docs/product-feature-registry.md`。
- 实现、复审、部署和 fixture 清理证据写入 `docs/reference/implementation/media-upload-filename-collision-2026-08-10.md`。
- 完成后 checklist 移入 `docs/archive/`，router 删除 active 项。

## Work

- [x] 产品负责人提供截图并授权修复、提交、发布和后续必要操作。
- [x] 只读确认 Production 错误、当前 adapter 配置和同名 pathname 拒绝行为。
- [x] 提交本 checklist，建立产品代码的 HEAD 授权基线；commit `096a6a2`。
- [x] 实现客户端唯一 pathname，并保持 adapter 服务端缩略图名称稳定。
- [x] 目标测试、typecheck、lint、Production build、治理和 changed-path 检查通过；lint 仅保留既有 migration warning。
- [ ] 首轮复审发现隐藏无扩展名被二次解析，第二轮复审发现末尾点导致 `card` 重名；均修复并进入第三轮复审。
- [ ] 推送、部署 Production，并用虚构同名图片完成创建、读回和精确清理。
- [ ] 写回 current、feature registry、evidence，并把 checklist 移入 archive。
