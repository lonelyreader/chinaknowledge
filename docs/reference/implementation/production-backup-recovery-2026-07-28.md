---
doc_contract: DocContractV1
doc_type: reference
authority: evidence
status: active
scope: production-backup-recovery
last_verified: 2026-07-28
max_lines: 140
change_id: PROD-LAUNCH-001
---

# Production Backup And Recovery Evidence

## Result

2026-07-28 完成 Production 跨供应商恢复基线、migration 后复验，以及首位管理员、首张真实媒体和首个真实 Person 草稿后的再次备份：Neon 与 Vercel Blob 的恢复点写入 Cloudflare R2 Standard 私有桶，数据库文件和媒体清单均从 R2 读回；数据库 dump 在隔离 PostgreSQL 17 实例中恢复成功。当前 Production 有 29 张表和 5 条 migration、1 名 Super Admin、1 条 Media、1 个 Person 草稿，Article/Place 为 0；run `30351414680` 已完成 29/5/5/8 断言、1/1/0/1/0 数据回读与真实媒体抽样 SHA 核对。

## Resource Boundary

- Bucket：`china-in-fact-production-backups`，North America East，Standard storage。
- Public access：关闭；未配置 public development URL 或 custom domain。
- Bucket lock：`protect-all-backups-30d`，覆盖全部对象，30 天内禁止删除或覆盖。
- Lifecycle：`expire-database-backups-90d`，仅匹配 `database/`，90 天后删除；媒体对象不自动删除，源端删除不向备份传播。
- Budget：当前账单 US$0.00；每月 US$10 阈值提醒已建立。
- Credential：Cloudflare Account API token 仅允许该桶对象读写，不允许创建、删除存储桶或编辑配置。Neon 使用独立 `china_in_fact_backup` 登录角色，只具备数据库连接、`public` schema 使用和表/序列读取权限；无数据库或 schema 创建权限，也不是应用 owner role 成员。

## Automation

[`production-backup.yml`](../../../.github/workflows/production-backup.yml) 每日 08:17 UTC 运行，也支持人工触发：

1. 用 PostgreSQL 17 `pg_dump` 导出 Production database custom-format dump。
2. 枚举 Production Blob，对每个来源版本生成稳定哈希键；R2 中已存在的媒体对象保持不动。
3. 上传数据库 dump、SHA-256 校验文件、媒体对象与带时间戳的媒体清单。
4. 从 R2 读回数据库和媒体清单，验证校验值，并把 dump 恢复到一次性 PostgreSQL 17 容器。
5. 有媒体时抽取一个对象读回并核对 SHA-256；空 Blob 则要求零对象清单可读。

GitHub Actions secrets 为 `PRODUCTION_DATABASE_BACKUP_URL`、`PRODUCTION_BLOB_READ_WRITE_TOKEN`、`R2_ACCESS_KEY_ID`、`R2_SECRET_ACCESS_KEY`；非敏感的桶名与 endpoint 使用 Actions variables。数据库 secret 使用只读 backup role，不复用应用 owner URL。密钥只注入实际需要的 step，checkout、Node setup 与依赖安装无权读取；外部 Actions 固定到完整 commit SHA。值未写入仓库、文档、日志或截图。

## First Recovery Point

- UTC capture：`2026-07-27T16-39-39-540Z`（Asia/Shanghai 为 2026-07-28）。
- Database：874-byte PostgreSQL custom-format dump；R2 读回 SHA-256 一致；隔离 PostgreSQL 17 `pg_restore --exit-on-error` 通过，恢复后 `public` 表数为 0，符合空 Production 事实。
- Database permission negative：backup role 可连接并使用 `public`，没有 database `CREATE`、schema `CREATE` 或应用 owner membership；用该角色执行 `pg_dump` 仍通过。
- Media：Production Blob 返回 0 个对象；带时间戳的 zero-object manifest 写入 R2 后读回，`count = 0`。
- R2 操作回读：首次验证产生 21 次 Class A 与 8 次 Class B 操作，账单仍为 US$0.00。

## Hosted Workflow Readback

- Commit：`f6cbd4d`，GitHub Actions run [`30286886253`](https://github.com/lonelyreader/chinaknowledge/actions/runs/30286886253)。
- Result：`success`，`backup-and-verify` 用时 49 秒；checkout、setup、无脚本依赖安装、配置检查、导出、上传、数据库恢复与媒体读回全部成功。
- Database：远程 run 上传带时间戳的 dump 与 SHA-256 文件，读回后 `production.dump: OK`，隔离恢复为 0 张 `public` 表。
- Media：远程 run 上传并读回 zero-object manifest，日志确认 Production Blob 当前为 0 个对象。

## Production Migration And Recovery Retry

- Migration：2026-07-28 01:00 Asia/Shanghai 执行 `20260727_054408_p1_editorial_foundation`，耗时 958ms；状态回读为 Batch 1 / `Ran: Yes`。
- Live schema：23 张 `public` 表、1 条 migration；users/people/articles/media/workflow_events 均为 0。重新生成 Payload types 无差异，typecheck 通过。
- First post-migration run：[`30287433284`](https://github.com/lonelyreader/chinaknowledge/actions/runs/30287433284) 已完成只读 dump、R2 上传、读回和 `production.dump: OK`；官方 PostgreSQL 镜像临时初始化 server 随后 shutdown，`createdb` 命中竞态，数据库恢复失败，媒体读回被跳过。
- Fix：恢复容器先等待 `PostgreSQL init process complete; ready for start up.`，再等待最终 server 的 `pg_isready`。恢复后新增硬断言：23 张 `public` 表、1 条且名称正确的 migration、6 张关键业务表；只打印表数不再视为 PASS。
- Passing retry：[`30287841720`](https://github.com/lonelyreader/chinaknowledge/actions/runs/30287841720) 在 commit `1ca8036` 上用时 42 秒，全步骤成功；`production.dump: OK`，schema assertion 为 `23,1,1,6`，恢复出的 users/people/articles/media/workflow_events 均为 0，零对象媒体清单读回成功。

## Public Product Schema Upgrade

- Pre-migration recovery：run [`30339027394`](https://github.com/lonelyreader/chinaknowledge/actions/runs/30339027394) 在 23/1 基线上全步骤成功；本地 custom dump SHA-256 为 `8f15405f26c05d585aa1a28059fc58785a0fc508b7a2b30f23ac8d11a3d0f455`，隔离恢复与 live 均为 `23,1,0,0,0,0,0`。
- Migration：2026-07-28 15:40 Asia/Shanghai 依次执行其余 4 条 migration，全部成功并回读为 Batch 2 / `Ran: Yes`；最终为 29 张 `public` 表、5 条且名称全部匹配的 migration、8 张关键业务表，users/people/articles/media/workflow_events 均为 0。
- Workflow update：commit `8cef12e` 将隔离恢复硬断言同步收紧到 `29,5,5,8`，包含全部 migration 名称与 `places / person_revisions`；旧 23/1 基线先完成最后一次恢复，再执行 migration 与 workflow 更新。
- Post-migration recovery：run [`30339406235`](https://github.com/lonelyreader/chinaknowledge/actions/runs/30339406235) 在 commit `8cef12e` 上用时 41 秒，全步骤成功；`production.dump: OK`、schema assertion `29,5,5,8`、五类业务数据为 0，零对象媒体清单读回成功。
- First-admin recovery：首位 Super Admin 建立后立即运行 [`30343054714`](https://github.com/lonelyreader/chinaknowledge/actions/runs/30343054714)，全流程成功；`production.dump: OK`、隔离恢复 schema assertion `29,5,5,8`、零对象媒体清单读回成功。备份和文档不记录管理员邮箱、密码或重置 token。
- First-media recovery：首张本人授权头像写入后运行 [`30345197248`](https://github.com/lonelyreader/chinaknowledge/actions/runs/30345197248)，全流程用时 1m3s；`production.dump: OK`，隔离恢复为 29/5/5/8、users/people/articles/media/workflow_events 为 1/0/0/1/0。Blob 枚举得到原图与 card 版本 2 个对象，全部上传为不可变哈希键；随后下载 manifest 和其中一个对象，SHA-256 与来源一致。
- First-person recovery：首个真实 Person 草稿写入后运行 [`30351414680`](https://github.com/lonelyreader/chinaknowledge/actions/runs/30351414680)，全流程用时 42 秒；`production.dump: OK`，隔离恢复为 29/5/5/8、users/people/articles/media/workflow_events 为 1/1/0/1/0。媒体 manifest 再次读回，并下载一个对象核对 SHA-256 一致。

## Remaining Gate

- 首张真实媒体和首个真实 Person 草稿均已进入恢复链路并完成读回；后续每日 workflow 继续覆盖新增数据与媒体。
- staged Production 已部署；首篇真实 Article、Person 公开、正式域名和索引仍须在内容审核与 release 门禁后执行。
