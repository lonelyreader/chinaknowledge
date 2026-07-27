---
doc_contract: DocContractV1
doc_type: reference
authority: evidence
status: active
scope: p2-preview-migration-recovery-plan
last_verified: 2026-07-27
max_lines: 180
change_id: P2-PREVIEW-001
---

# P2 Preview Migration And Recovery Plan

## Status

本文件固定执行顺序并记录结果。`Ran: Yes`；migration、虚构数据装载、Blob 持久化、隔离 restore smoke、fixtures 灾备和受保护 Preview 部署均已完成。首轮独立复审 BLOCK 已修复，等待重审。

当前 migration artifact 为 `apps/web/src/migrations/20260727_054408_p1_editorial_foundation.ts`。本轮 Blob adapter 没有增加 Payload 字段或数据库 schema，生成类型与 P1 schema 保持一致。

## Required Approvals

账号激活、preview database、object storage 与 secrets 已批准并完成；团队原本已是 Pro，本轮没有购买。当前 baseline commit、Preview migration、虚构验收数据、受保护 Preview deploy 与部署后验证均已批准；区域为 `iad1 / us-east-1`。Production、正式域名、真实数据和内容公开不在本次授权内。

## Resource Isolation

- Preview 使用独立 Vercel project、Neon project/branch 和 Blob store；名称明确包含 `preview`。
- 只读预检已确认 Preview Neon 可连接，`public` schema 为 0 tables，Payload migration table 为 0；临时连接文件已删除。
- Vercel Functions 与 Blob 使用 `iad1`，Neon 使用 AWS `us-east-1`；创建后回读实际区域，不接受默认值漂移。
- `APP_ENV=preview` 与 `VERCEL_ENV=preview` 必须一致，`CMS_READ_MODE=cms`。
- Preview 只装载虚构账户、内容和媒体，不连接 production；production 当前不存在。
- 证据只记录资源 ID、区域、时间、命令结果和哈希，不记录连接串、token、密码或完整测试邮箱。

## Preflight

1. 记录待部署 commit，并确认工作树和 CI 对该 commit 通过。
2. 确认 Vercel Standard Protection 已启用，再允许任何 preview URL 被共享。
3. 运行 `npm run env:check`；确认输出为 `preview`、`media=blob`、`indexable=false`。
4. 运行 `npm run cms:migration:status`，保存脱敏输出；预期 migration 未执行。
5. 确认目标数据库是新建或只含可删除的虚构 preview 数据，并记录目标资源 ID。
6. 对 preview 数据库执行执行前备份；备份产物不得进入 Git。

备份命令模板：

```bash
pg_dump --format=custom --no-owner --no-privileges "$DATABASE_URL" --file <approved-preview-backup-path>
```

## Migration Run

只有 migration 门禁批准后才运行：

```bash
npm run cms:migration:status
npm run cms:migration:run
npm run cms:migration:status
```

执行日志必须证明目标环境、开始与结束时间、exit code、执行前后状态和 artifact 名称，不复制连接串。不得使用 Payload development push 代替 preview migration。

## Execution Record

- 执行前自定义格式备份为 885 bytes，SHA-256 为 `6fa44a4d939f72757e78ff02ef5c045e2b1c5e5aa67d4723c10edc828c58ee76`；migration 与验收完成后，含凭据的临时目录和该空库备份已删除。
- `20260727_054408_p1_editorial_foundation` 执行一次，状态回读为 `Ran: Yes`；未使用 development push。
- 最终数据回读：`migrations=1`、`users=3`、`people=1`、`articles=2`、`media=1`、`workflow_events=11`。数据均为虚构 fixture。
- 最终 Blob 回读只有 `shanghai-morning.webp` 与 `shanghai-morning-800x600.webp`；验收产生的 1 条无引用媒体记录和 3 个孤儿对象已按精确名称删除。
- 当前 CMS Preview 为 `dpl_9cTeUwsM9JBNCdfps3HEzF3mBhA7`，commit `eb55721`，区域 `iad1`，状态 `READY`，匿名访问进入 Vercel SSO。
- 首次 CLI 调用误取 production target；production 环境守卫在构建期失败关闭，deployment `dpl_9Db17Q8SNbVxtYQX426c9KfsRU5X` 为 `ERROR`，没有可用 production runtime、数据或地址。
- 最终健康检查曾因在仓库根目录调用未链接的 CLI 而误建空 `chinaknowledge` project；确认其没有 deployment、domain 或数据后已按精确 project 删除，`apps/web` 的原项目绑定未改变。
- 首轮独立复审后，用当前纯虚构 Preview 创建 108802-byte custom dump，SHA-256 为 `f8d0f1574c378f7cce19c8a2ac1149d69537fc58e9d080c1665d76e789cfd3e8`；恢复到隔离数据库后回读 23 张表、1 条 migration、3/1/2/1/11 数据计数及英语 `public` / 西班牙语 `draft`，随后删除隔离库、dump 和临时凭据。
- Fixtures 灾备 deployment `dpl_5PoVCMHLF76Q4jbvwPQ4g1r29QPz` 将数据库指向不可用本地端口；`driving-in-shanghai` 仍为 200，CMS-only slug 为 404，health 为 503，`robots.txt` 保持 `Disallow: /` 和 `X-Robots-Tag`。

## Readback

- `/api/health` 返回 200 和 `{"status":"ok"}`。
- Payload migration status 显示目标 artifact 已执行一次。
- Admin 登录、Author / Editor / Super Admin 权限负例与 P1 一致。
- 英语虚构 Guide 公开后为 200；未公开西班牙语版本为 404。
- 上传虚构图片并重新部署后仍可读取；媒体 URL 指向 preview Blob store。
- 首页、Admin 与媒体响应不暴露密钥；页面与 header 均为 `noindex`。

## Failure Recovery

1. 停止继续 migration 或数据写入，并保留失败日志；不在原库上反复试错。
2. 将 preview 指向执行前恢复点或由备份恢复出的替代数据库；恢复动作仍需明确确认目标资源。
3. 回读 migration status、表结构和虚构 fixture；失败则保持 preview 不可共享。
4. 代码部署失败时回退到上一通过 commit；公共读取可切回 `CMS_READ_MODE=fixtures`，但该切换仍属于 preview secret 与 deploy 变更。
5. 恢复完成后重新执行 health、权限负例、语言隔离和媒体读取检查。

## Resource Deletion

Preview 结束后依次取消分享、保存脱敏证据、删除 Blob 测试对象、删除 preview Blob store、删除 Neon preview project/branch、删除 Vercel preview project或取消 Pro。每一步先核对资源 ID，不使用通配符，不触碰未来 production 资源。

## Evidence Record

实现者证据已覆盖 commit、区域、资源 ID、保护状态、migration 前后状态、真实 backup/restore/readback、fixtures 灾备、health、媒体跨部署、权限负例、语言隔离、秘密扫描、视觉证据和精确删除路径。当前结论为 `IMPLEMENTER PASS / INDEPENDENT RE-REVIEW PENDING`。
