---
doc_contract: DocContractV1
doc_type: checklist
authority: execution
status: active
scope: password-reset-recovery
last_verified: 2026-08-11
max_lines: 140
change_id: AUTH-RESET-001
risk_tier: upgraded
validation_profile: phase_release
allowed_paths: apps/web/package.json, apps/web/src/collections/Users.ts, apps/web/src/payload.config.ts, apps/web/src/cms/password-reset.ts, apps/web/src/cms/components/InviteMember.tsx, apps/web/src/cms/components/PasswordSetupForm.tsx, apps/web/src/cms/views/PasswordSetup.tsx, apps/web/src/app/(payload)/custom.scss, apps/web/src/app/(payload)/admin/importMap.js, apps/web/tests/password-reset.ts, docs/current-state.md, docs/product-feature-registry.md, docs/roadmap/README.md, docs/roadmap/checklists/README.md, docs/roadmap/checklists/password-reset-recovery.md, docs/reference/README.md, docs/reference/implementation/README.md, docs/reference/implementation/password-reset-recovery-2026-08-11.md, docs/archive/README.md, docs/archive/password-reset-recovery.md
approval_gates: product-code, auth-change, commit, push, merge, production-deploy, real-account-resend
---

# AUTH-RESET-001

目标：修复邀请与密码重置链接一小时后失效、重发后旧链接无提示、用户填完密码才发现链接失效的问题。

## Frozen batch

- `data_truth`：Payload Users 的 `resetPasswordToken` 与 `resetPasswordExpiration` 是 token 运行真相；不读取、导出或记录真实值。
- `read_path`：用户从邀请或 forgot-password 邮件进入公开 Admin 密码设置页。
- `write_path`：forgotPassword 生成唯一 token 与 expiration；resetPassword 只在 token 匹配且未过期时写入新密码。
- `permission_boundary`：任何人可提交邮箱请求重置，但响应不暴露邮箱是否存在；只有持有当前有效 token 的人可设置密码。
- `audit_boundary`：验证只记录状态码、有效期断言和虚构账号结果，不记录邮箱、密码、token、cookie 或邮件正文。
- `recovery`：代码回滚到部署前 Production；不回滚密码、不恢复旧 token，不执行数据库 down migration。
- `key_invariants`：重发使旧 token 失效；无效、过期和未知 token 使用同一恢复状态；最新 token 成功；账号枚举继续失败关闭。

## Scope

- 将 forgot-password token 有效期显式设为 24 小时。
- 邀请与重置邮件说明 24 小时有效期和仅最新链接有效，并进入自定义密码设置页。
- 自定义页面在显示密码框前验证 token；无效、过期或被替代时只显示必要错误和重新申请入口。
- Invite Member 成功状态显示 24 小时有效期和最新邮件规则。
- 增加纯虚构 token、URL、邮件、预检、成功和失败路径测试。

## No-go

- 不读取、记录或修改真实用户邮箱、密码、token、cookie、账号状态或角色。
- 不改变登录 session 的八小时有效期、锁定策略、OAuth、Agent、权限、schema 或 migration。
- 不让预检取代 resetPassword 的事务内 token 校验；预检通过后仍由 Payload 原生操作完成最终写入。
- 不自动重发任何真实账号邮件；真实账号恢复必须给出精确目标并另行执行。

## Acceptance

- 新 token 的 expiration 为生成时间后 24 小时。
- 重发后旧 token 安全失效，最新 token 可设置密码。
- 无效、过期和旧链接在输入密码前进入同一恢复界面；重新申请链接可达。
- 未注册邮箱请求不泄露账号存在性。
- 邮件和 Admin 成功状态清楚说明 24 小时与最新链接规则。
- Local/Preview 正例与负例、typecheck、build、governance、diff check 和独立复审通过。
- Production 部署后公开 reset/forgot 路由、health 和无效 token 恢复页回读通过，不创建真实账号或发送真实邮件。

## Validation

- `npm run test:password-reset`
- `npm run typecheck`
- `npm run build`
- `npm run governance:check`
- `git diff --check`
- Production 匿名路由与无效 token 恢复页回读

## Writeback

- 用户恢复能力写入 `docs/current-state.md` 与功能登记册。
- 实现、测试、部署和回读写入 reference evidence。
- 完成后移入 archive，并在 Linear LON-93 写回结果。

## Work

- [x] 用户批准正式修复；产品代码、提交、合并与 Production 部署进入本批。
- [x] checklist 基线已提交为 `cc8a64c`。
- [x] 已实现 24 小时、最新链接提示与过期恢复页。
- [x] 自动验证通过；首轮复审 finding 已修复，复审结论为 `PASS`。
- [ ] 推送、合并、部署并完成匿名 Production 回读。
- [ ] 写回、归档并关闭 LON-93。
