---
doc_contract: DocContractV1
doc_type: reference
authority: evidence
status: active
scope: p2-preview-local-preparation
last_verified: 2026-07-27
max_lines: 180
change_id: P2-PREVIEW-001
---

# P2 Preview Local Preparation Evidence

## Result

本地实现与 Preview 执行 **PASS**。应用具备 preview-only Blob adapter、严格环境边界、健康检查、安全响应头、双重 `noindex`、可执行 fixture fallback 和最小 CI；migration、虚构数据和受保护部署已完成。

首轮独立复审给出 BLOCK 后，恢复与视觉证据缺口均已修复；等待同一复审者重新判定。

## Implemented Boundary

- `APP_ENV` 固定为 `local / preview / production`；Vercel 环境冲突时失败。
- Preview 正常态使用 `CMS_READ_MODE=cms`，灾备部署可显式使用 `fixtures`；两者都要求 PostgreSQL URL、至少 32 字符的 Payload secret 和合法格式 Blob token。
- PostgreSQL adapter 在入口将旧的 `prefer / require / verify-ca` 统一规范为 `sslmode=verify-full`；当前 deployment 运行日志不再出现 SSL 未来语义警告。
- Production runtime 在 P2 内显式失败，不能因 Vercel 默认 production 环境被意外启用。
- 本地 Media 继续写入 `media/`；preview 才启用 `@payloadcms/storage-vercel-blob@3.86.0`，关闭实例本地媒体并使用 client upload。
- Blob 配置没有增加 Payload 字段或数据库 schema；`payload-types.ts` 与 P1 schema 一致。
- `/api/health` 真实查询 PostgreSQL，只返回 `ok / unavailable`，不暴露连接信息。
- 非 production 全站返回 `X-Robots-Tag`，公共 HTML 输出 robots metadata，`robots.txt` 为 `Disallow: /`。
- 全站加入 MIME sniffing、frame、referrer、camera/microphone/geolocation 限制；非本地环境加入 HSTS。
- GitHub workflow 使用 fixture read path 运行治理、环境测试、lint、typecheck、production dependency audit 和 build，不运行 migration 或连接 preview 数据库。
- Guides 列表与详情强制 request-time rendering，避免 preview 在 build 时固化 CMS 内容；编辑公开或撤回后无需重新构建才生效。
- `apps/web/vercel.json` 将 Vercel Functions 固定为已批准的美国东部 `iad1`；最终 Preview 区域回读为 `iad1`。

## Validation

| 检查 | 结果 |
|---|---|
| `npm run test:environment` | PASS；preview 缺 token、错误 read mode、Vercel 冲突与 production 均失败 |
| `npm run test:preview-config` | PASS；preview 关闭本地媒体且没有 preview-only database field |
| `npm run test:editorial` | PASS；英语公开 1、西班牙语公开 0、他人草稿 0、撤回后公开 0、13 条 workflow event |
| `npm run lint` | PASS with 4 existing generated-migration warnings, 0 errors |
| `npm run typecheck` | PASS |
| `npm run audit:production` | PASS at high threshold；production tree 为 5 moderate、0 high、0 critical |
| CI-equivalent fixture `npm run build` with non-routable PostgreSQL URL | PASS；69-page generation pass；Guides、Admin、API 与 health 为 dynamic routes |
| `npm run governance:check` | PASS；36 docs、11 canonical scopes、P2 changed paths covered |
| `git diff --check` | PASS |
| Preview env scope readback | PASS；5/5 必需键位于 Preview，Production 0，Development 0 |
| Preview Neon read-only preflight | PASS；连接成功，`publicTables=0`，`migrationTables=0`，临时 env 已删除 |
| Preview migration/readback | PASS；目标 migration 执行一次，最终 1 条 migration 记录 |
| 权限与语言隔离 | PASS；Author 不能直接公开或改已公开文章，Editor 可完成审批；英语 200，西班牙语 404 |
| 媒体跨部署 | PASS；主图 259746 bytes、card 91598 bytes，重新部署后均为 200 |
| 浏览器与运行日志 | PASS；桌面和 390px 移动端无溢出；最终 deployment 近 30 分钟无 5xx |
| 隔离 restore smoke | PASS；108802-byte custom dump 恢复出 23 张表、1 条 migration 与完整虚构数据，目标库随后删除 |
| Fixtures 灾备部署 | PASS；DB 指向不可用端口时 fixture Guide 200、CMS-only Guide 404、health 503、robots `Disallow: /` |

完整 npm audit 另报告 9 个 high dev-tool findings，集中于 ESLint/minimatch 链且有升级路径；它们不进入 production dependency tree。本轮没有获得现有依赖升级授权，因此未运行 `npm audit fix`。Payload PostgreSQL/drizzle-kit/esbuild 链的 5 个 moderate findings 当前无可用修复。

## Runtime Readback

- `GET http://127.0.0.1:3000/api/health` → 200，`{"status":"ok"}`，`Cache-Control: no-store`。
- `GET /robots.txt` → 200，`User-Agent: *` 与 `Disallow: /`。
- `GET /en` → 200，并含 `<meta name="robots" content="noindex, nofollow, nocache">`。
- CMS read path `GET /en/guides/driving-in-shanghai` → 200；未公开西班牙语 `GET /es/guides/conducir-en-shanghai` → 404。
- `/en`、`/admin` 与 `/api/health` 均有 `X-Robots-Tag: noindex, nofollow, noarchive` 及四项安全响应头。
- `poweredByHeader` 已关闭；`127.0.0.1` 被列为本地开发允许来源，浏览器 HMR 不再触发跨源阻止警告。
- 当前 CMS Preview：`dpl_9cTeUwsM9JBNCdfps3HEzF3mBhA7`；英语虚构 Guide 200、西班牙语 draft 404、health 200、匿名请求 302 到 Vercel SSO。
- 灾备 Preview：`dpl_5PoVCMHLF76Q4jbvwPQ4g1r29QPz`；数据库不可用时 fixture Guide 仍为 200，health 明确返回 503 `unavailable`。
- 桌面与移动端浏览器均无 framework overlay；1440px 与 390px 的 `scrollWidth` 等于 `clientWidth`。证据：[Guide desktop](assets/p2-preview-guide-desktop-full.png)、[Guide 390px](assets/p2-preview-guide-mobile-390-full.png)、[Admin desktop](assets/p2-preview-admin-desktop-full.png)、[Admin 390px](assets/p2-preview-admin-mobile-390-full.png)、[Spanish draft 404](assets/p2-preview-spanish-draft-404-mobile-390-full.png)。
- 临时 share link 在截图完成后撤销，保护配置回读为 `remaining=0`；隔离浏览器已关闭。

## External Boundary

- `Migration Ran: Yes`；artifact `20260727_054408_p1_editorial_foundation` 仅执行一次，没有 development push。
- `Vercel Project: lonelyreader/china-in-fact`；`apps/web/.vercel/project.json` 已绑定 project `prj_MlM7hL16TkyUeDisgb48UucNw6RZ`，该目录被 Git 忽略。
- `Preview Deploy: READY`；`dpl_9cTeUwsM9JBNCdfps3HEzF3mBhA7`，commit `eb55721`，受 Vercel SSO 保护，授权 `/api/health` 为 200。
- `Neon: china-in-fact-preview-db`；resource `store_ddLh0IcbWMpKZBZE`，Free、Available、Preview-only，创建参数为 `iad1 / auth=false`，外部项目 `damp-lake-01785339`。
- `Blob: china-in-fact-preview-media`；store `store_CZgZHdC2j44o2LAy`，`iad1 / public`，仅保留验收主图与 card 两个对象。
- `Preview Env: 5/5 required`；`APP_ENV`、`CMS_READ_MODE`、`PAYLOAD_SECRET`、`DATABASE_URL`、`BLOB_READ_WRITE_TOKEN` 均存在且只作用于 Preview。
- `Paid Actions: None`；`lonelyreader` 原本已是 Pro，本次没有购买或升级。
- `Secrets: Vercel Preview only`；密钥值未输出、未写入仓库；执行用临时环境文件已删除。
- 没有 DNS、真实数据、正式内容公开、Newsletter 或 Discord 写入；production 仍由运行时守卫拒绝。
