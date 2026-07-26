---
doc_contract: DocContractV1
doc_type: decision
authority: canonical
status: accepted
scope: decision-public-web-foundation
last_verified: 2026-07-27
max_lines: 120
change_id: P1-WEB-001
---

# ADR-0005：公共 Web 基础栈

## Context

P1 需要把已经接受的公共站设计落成一个本地可运行的英语与西班牙语切片。当前阶段只有仓库 fixture 读路径和浏览器内 Newsletter 状态，不需要 CMS、认证、数据库、邮件服务或部署耦合。

候选方案需要支持内容型页面的服务端渲染、明确的语言 URL、静态参数生成、响应式设计令牌和后续接入编辑系统的空间，同时保持第一个实现切片足够小。

## Decision

- 公共应用放在 `apps/web`，作为独立 npm package，不在尚无真实复用时建立 monorepo package 层。
- 使用 Next.js 16 App Router、React 19、TypeScript strict mode 与 ESLint。
- 使用 Tailwind CSS 4 及 CSS variables 实现 `DESIGN.md` 中的视觉令牌；品牌组件保持项目内原生实现，不在首个切片引入通用组件库。
- 路由采用顶层 `[locale]` 动态段，首期仅接受 `en` 与 `es`；页面通过静态参数生成，缺失语言或资源进入 not-found。
- 默认使用 Server Components；只把移动导航和 Newsletter 表单等确有浏览器状态的叶子组件设为 Client Components。
- 内容来自 `apps/web/src/content` 的 typed fixtures，经单一 loader 读取；完整文章、作者资料和语言文本不写在页面组件中。
- 使用每个应用自己的 `package-lock.json` 固定依赖版本；根 `package.json` 继续只承载仓库治理命令。
- P1 不增加服务端写操作、Route Handler、Server Action、环境变量或外部 SDK。

## Consequences

- 公共页面可以独立运行、构建和用浏览器验收，同时保持零账号、零数据库和零真实数据边界。
- `en / es` URL 与内容缺失行为由路由结构直接表达，不依赖客户端语言切换隐藏状态。
- 后续 CMS 可以替换 fixture loader，不需要重写页面的公共数据契约。
- 应用依赖暂时由 `apps/web` 独立维护；只有出现第二个真实应用或共享包后才重新评估 workspace。

## Verification Basis

- 当前 npm registry 核验：Next.js `16.2.12`、React `19.2.8`、Tailwind CSS `4.3.3`。
- 本机实现环境：Node.js `22.22.3`、npm `10.9.8`。
- 官方参考：[Next.js App Router](https://nextjs.org/docs/app)、[Next.js internationalization](https://nextjs.org/docs/app/guides/internationalization)、[Tailwind CSS with Next.js](https://tailwindcss.com/docs/installation/framework-guides/nextjs)。
