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

本地实现、静态配置与 Preview 资源准备 **PASS**。应用已经具备 preview-only Blob adapter、严格环境边界、健康检查、安全响应头、双重 `noindex`、fixture fallback 和最小 CI。Vercel project、Preview Neon 与 Blob 已创建并连接，但尚无 deployment、migration 或数据。

这不是 Preview Release Candidate 的最终 PASS。新增付费、migration、deploy、跨部署媒体和独立复审仍未执行。

## Implemented Boundary

- `APP_ENV` 固定为 `local / preview / production`；Vercel 环境冲突时失败。
- Preview 强制要求 `CMS_READ_MODE=cms`、PostgreSQL URL、至少 32 字符的 Payload secret 和合法格式 Blob token。
- Production runtime 在 P2 内显式失败，不能因 Vercel 默认 production 环境被意外启用。
- 本地 Media 继续写入 `media/`；preview 才启用 `@payloadcms/storage-vercel-blob@3.86.0`，关闭实例本地媒体并使用 client upload。
- Blob 配置没有增加 Payload 字段或数据库 schema；`payload-types.ts` 与 P1 schema 一致。
- `/api/health` 真实查询 PostgreSQL，只返回 `ok / unavailable`，不暴露连接信息。
- 非 production 全站返回 `X-Robots-Tag`，公共 HTML 输出 robots metadata，`robots.txt` 为 `Disallow: /`。
- 全站加入 MIME sniffing、frame、referrer、camera/microphone/geolocation 限制；非本地环境加入 HSTS。
- GitHub workflow 使用 fixture read path 运行治理、环境测试、lint、typecheck、production dependency audit 和 build，不运行 migration 或连接 preview 数据库。
- Guides 列表与详情强制 request-time rendering，避免 preview 在 build 时固化 CMS 内容；编辑公开或撤回后无需重新构建才生效。
- `apps/web/vercel.json` 将 Vercel Functions 固定为已批准的美国东部 `iad1`；该配置尚未用于部署。

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

完整 npm audit 另报告 9 个 high dev-tool findings，集中于 ESLint/minimatch 链且有升级路径；它们不进入 production dependency tree。本轮没有获得现有依赖升级授权，因此未运行 `npm audit fix`。Payload PostgreSQL/drizzle-kit/esbuild 链的 5 个 moderate findings 当前无可用修复。

## Runtime Readback

- `GET http://127.0.0.1:3000/api/health` → 200，`{"status":"ok"}`，`Cache-Control: no-store`。
- `GET /robots.txt` → 200，`User-Agent: *` 与 `Disallow: /`。
- `GET /en` → 200，并含 `<meta name="robots" content="noindex, nofollow, nocache">`。
- CMS read path `GET /en/guides/driving-in-shanghai` → 200；未公开西班牙语 `GET /es/guides/conducir-en-shanghai` → 404。
- `/en`、`/admin` 与 `/api/health` 均有 `X-Robots-Tag: noindex, nofollow, noarchive` 及四项安全响应头。
- `poweredByHeader` 已关闭；`127.0.0.1` 被列为本地开发允许来源，浏览器 HMR 不再触发跨源阻止警告。

## External Boundary

- `Migration Ran: No`；没有 development push 到 preview，也没有新 migration artifact。
- `Vercel Project: lonelyreader/china-in-fact`；`apps/web/.vercel/project.json` 已绑定 project `prj_MlM7hL16TkyUeDisgb48UucNw6RZ`，该目录被 Git 忽略。
- `Deployments: 0`；Vercel API 回读为空，没有 preview URL。
- `Neon: china-in-fact-preview-db`；resource `store_ddLh0IcbWMpKZBZE`，Free、Available、Preview-only，创建参数为 `iad1 / auth=false`，外部项目 `damp-lake-01785339`。
- `Blob: china-in-fact-preview-media`；store `store_CZgZHdC2j44o2LAy`，`iad1 / public / 0 objects / 0B`，Preview-only。
- `Preview Env: 5/5 required`；`APP_ENV`、`CMS_READ_MODE`、`PAYLOAD_SECRET`、`DATABASE_URL`、`BLOB_READ_WRITE_TOKEN` 均存在且只作用于 Preview。
- `Paid Actions: None`；`lonelyreader` 原本已是 Pro，本次没有购买或升级。
- `Secrets: Vercel Preview only`；密钥值未输出、未写入仓库；CLI 自动下载的本地 `.env.local` 只含短期 OIDC token，核对键名后已删除。
- `Preview Deploy: No`；没有 DNS、真实数据、内容公开、Newsletter 或 Discord 写入。
