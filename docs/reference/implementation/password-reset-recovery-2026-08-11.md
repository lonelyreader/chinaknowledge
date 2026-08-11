---
doc_contract: DocContractV1
doc_type: reference
authority: evidence
status: completed
scope: password-reset-recovery-evidence
last_verified: 2026-08-11
max_lines: 120
change_id: AUTH-RESET-001
---

# Password Reset Recovery Evidence

## 结论

邀请与忘记密码流程已改为 24 小时有效，并明确只有最新邮件中的链接可用。页面会在显示密码框前检查链接；无效、过期或已被新邮件替代的链接直接进入恢复状态。

## 根因与实现

- Payload 3.86 的 forgot-password 默认有效期为一小时；原配置只设置了登录 session 的八小时有效期，没有覆盖 reset token。
- 每次重新申请都会替换 token，旧邮件自然失效；原生页面在提交新密码后才报告失效，用户已经完成无效输入。
- Users auth 现在显式配置 24 小时 expiration，并统一邀请与重置邮件中的有效期和最新链接说明。
- 自定义 `/admin/reset/:token` 页面只回传 token 是否有效，不向浏览器暴露 token、过期时间或账号信息；最终写入仍由 Payload 原生 reset-password 操作再次校验。
- 暂停账号的原生错误保持为账号状态错误，不被误判为失效链接，也不会诱导重复申请。
- 没有 schema、migration、依赖、登录 session、OAuth、角色或锁定策略变化。

## 自动验证

| 检查 | 结果 |
|---|---|
| `npm run test:password-reset` | PASS；URL、文案、路径解析、错误分类与预检 |
| `PASSWORD_RESET_LIVE=1 npm run test:password-reset` | PASS；虚构本地账号验证 24 小时、重发替换、旧 token 拒绝、最新 token 成功与精确清理 |
| `npm run typecheck` | PASS |
| `npm run lint` | PASS；0 error，保留 44 条既有 migration warning |
| `npm run build` | PASS；77/77 static pages |
| `npm run governance:check` | PASS |
| `git diff --check` | PASS |

本地无效 token 页面为 200，显示恢复状态且不显示密码字段；forgot-password 与登录入口可达。测试只创建并删除 `.invalid` 域名的虚构账号，禁用邮件发送，没有记录邮箱、密码、token、cookie 或邮件正文。

## 独立复审

- 首轮发现暂停账号的 403 可能被误判为失效链接；实现改为匹配 Payload 的精确失效错误，并增加回归测试。
- 修复后的独立只读复审结论为 `PASS`，没有剩余 finding。

## Production

- deployment `dpl_6jgR7oVx5zu5KGZMN6DpQSxhckoc` 为 `READY / target: production`，已绑定 `chinainfact.com`。
- `/api/health` 返回 `{"status":"ok"}`；`/admin/login`、`/admin/forgot` 与 `/admin/reset/invalid-fixture-token` 均为 200。
- 浏览器回读确认失效链接页显示恢复状态，密码字段数为 `0`，`Request a new link` 与 `Back to login` 均可见。
- `Request a new link` 进入 `/admin/forgot`；没有提交邮箱、创建真实账号、发送真实邮件或操作真实密码。

## 恢复边界

上一稳定 deployment `dpl_7VSEy3qNbymrRtx4ZTvZyh8xSLYm` 保留为代码回滚目标。token 与密码不执行数据回滚；本批没有数据库 migration。
