# China, in Fact Web

公共阅读产品与编辑 CMS 的本地 P1 切片，以及 P2 Preview 的本地可验证部署边界。公共站覆盖英语与西班牙语首页、Guide、People、作者页和 Newsletter 浏览器状态；Payload Admin 与 API 位于同一 Next.js 应用的独立 route group。

## Commands

```bash
npm install
npm run cms:db:up
npm run dev
npm run test:editorial
npm run test:environment
npm run test:preview-config
npm run lint
npm run typecheck
npm run build
```

本地入口为 `http://127.0.0.1:3000/en`、`/es` 和 `/admin`。从 `.env.example` 创建本地 `.env`；`CMS_READ_MODE=fixtures` 使用仓库 fixture，`CMS_READ_MODE=cms` 使用本地 CMS 公开内容。

本地数据库只绑定 `127.0.0.1:54329`。停止服务使用 `npm run cms:db:stop`。需要验证从零恢复时，先停止应用并确认目标卷名严格为 `chinaknowledge-web_cms_pgdata`，再执行：

```bash
docker compose down
docker volume rm chinaknowledge-web_cms_pgdata
npm run cms:db:up
npm run dev
npm run test:editorial
```

开发期由 Payload push 建立一次性本地 schema。`npm run cms:migration:create` 只生成 migration，`npm run cms:migration:status` 只读状态；`npm run cms:migration:run` 只在 migration 单独批准后执行。

## Preview Boundary

Preview 使用 `APP_ENV=preview`，在 Vercel 中还必须与 `VERCEL_ENV=preview` 一致。Vercel Functions 固定在 `iad1`，Neon 与 Blob 创建时分别使用 AWS `us-east-1` 和 `iad1`。它要求 `CMS_READ_MODE=cms`、独立 PostgreSQL、至少 32 字符的 Payload secret 和 Blob token；缺少或冲突时启动前失败。变量清单见 `.env.preview.example`，所有值只进入服务端环境管理。

本地始终使用 `media/`；preview 才启用 Payload 官方 Vercel Blob adapter，并使用 client upload。全站安全响应头、`robots.txt`、页面 robots metadata 和 `/api/health` 已可本地验证。Preview 资源、密钥、migration 与 deploy 尚未创建或执行。

## Boundaries

- CMS、认证和 PostgreSQL 当前仅供本机虚构数据验证；没有 preview/production 数据库、邮件发送、分析或已激活部署资源。
- Newsletter 只改变浏览器内组件状态。
- CMS 测试账户、人物、文章和图像均为虚构数据，不得作为真实作者或待公开内容。
- 生成图像的源文件保留在 Codex 本地生成目录；应用使用 `public/images/fixtures/` 中的项目副本。
- Satoshi 字体文件来自 Fontshare CDN；Instrument Serif 与 Geist Mono 由 Next.js 字体管线打包。
