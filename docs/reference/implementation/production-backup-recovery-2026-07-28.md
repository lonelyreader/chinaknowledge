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

2026-07-28 完成 Production 跨供应商恢复基线：Neon 与 Vercel Blob 的恢复点写入 Cloudflare R2 Standard 私有桶，数据库文件和媒体清单均从 R2 读回；数据库 dump 在隔离 PostgreSQL 17 实例中恢复成功。当前 Production 数据库与 Blob 均为空，本轮证明链路和边界可用，migration 后必须再次用真实 schema 与媒体执行恢复验收。

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

## Remaining Gate

- Production migration 前确认最新数据库恢复点存在；migration 后再次运行 workflow，要求恢复库出现预期 schema。
- 第一批真实媒体写入后再次运行 workflow，要求至少一个媒体对象从 R2 读回且校验一致。
- 这些验收通过前不部署、不绑定网站域名、不公开内容或索引。
