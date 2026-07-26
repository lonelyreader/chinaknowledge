# China, in Fact Web

公共阅读产品的本地 P1 切片。当前只读取 `src/content/` 中的虚构 fixtures，覆盖英语与西班牙语首页、Guide、People、作者页和 Newsletter 浏览器状态。

## Commands

```bash
npm install
npm run dev
npm run lint
npm run typecheck
npm run build
```

本地入口为 `http://localhost:3000/en` 和 `http://localhost:3000/es`。

## Boundaries

- 没有 CMS、认证、数据库、邮件发送、分析或部署配置。
- Newsletter 只改变浏览器内组件状态。
- 人物、文章和图像均为本地原型 fixtures，不得作为真实作者或待公开内容。
- 生成图像的源文件保留在 Codex 本地生成目录；应用使用 `public/images/fixtures/` 中的项目副本。
- Satoshi 字体文件来自 Fontshare CDN；Instrument Serif 与 Geist Mono 由 Next.js 字体管线打包。
