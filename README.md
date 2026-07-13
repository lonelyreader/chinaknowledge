# 中国知识出海 / China Knowledge

多人 + 多 AI Agent 协作仓库。目标：用深度中国相关信息与工具，服务海外用户与开发者，沉淀信任。

> 你不需要先成为资深工程师。推荐工作方式：**你定方向与验收，AI Agent 动手改文件**。

## 仓库地图（只需记住这些）

```
chinaknowledge/
├── apps/        → 所有正式应用（网站、工具等）放这里
├── inbox/       → 原始文章/条目（Markdown），尽量不分子文件夹
├── dataset/     → 给 AI/程序读的派生数据（可由 inbox 再生成）
├── packages/    → 多个 app 共用的代码与规范
├── docs/        → 说明文档
├── AGENTS.md    → 给 AI Agent 的硬性公约（让 Agent 先读这个）
└── README.md    → 你正在读的协作指南
```

一句话：

- **写内容** → 去 `inbox/`
- **做产品** → 去 `apps/`
- **给机器用的数据** → 经脚本进 `dataset/`，不要手改当主源

## 第一次参与（5 分钟）

1. 用浏览器打开本 GitHub 仓库，点 **Fork**（或请管理员把你加成 collaborator）。
2. 用 Cursor / Claude Code / 其他带 Agent 的编辑器打开本地仓库。
3. 对新开的 Agent 说：

   > 请先阅读 `AGENTS.md` 和 `README.md`，然后帮我……（说清任务）

4. 改完后让 Agent **开 Pull Request**，你在 GitHub 上点开 PR 看一眼再合并。

不会用命令行没关系：让 Agent 执行 git / `gh` 即可，但 **合并到 main 前你要看一眼**。

## 你怎么提需求（复制即用）

把下面填完发给 Agent：

```text
任务：
成功标准：
只改这些路径：（例如 inbox/ 或 apps/xxx/）
不要做：
相关 Issue：（可选）
```

好例子：

```text
任务：在 inbox 新增 3 篇关于中国签证基础的英文短文
成功标准：每篇有完整 frontmatter，status 为 draft，事实处标注来源
只改这些路径：inbox/
不要做：不要新建 app，不要改 dataset
```

坏例子：「帮我把整个平台做完」。范围太大，Agent 容易乱改。

## 内容怎么写（inbox）

1. 在 `inbox/` 新建一个 `.md` 文件（不要新建一堆子文件夹）。
2. 文件顶部加 frontmatter，字段说明见 [`docs/inbox-frontmatter.md`](docs/inbox-frontmatter.md)。
3. `status` 先用 `draft`，人工核对后再改为 `published`。

示例见 `inbox/_example.md`。

## 应用怎么开发（apps）

- 每个应用一个子目录：`apps/<app-name>/`。
- 该目录里应有自己的 `README.md`（如何安装、启动、环境变量）。
- 当前阶段：优先做一个垂直 App，不要并行开很多空壳项目。

## Pull Request 规则（请遵守）

- **一次 PR 只做一件事**
- 标题写清目的，例如：`docs: add three draft visa guides to inbox`
- 描述里写：改了什么、如何验收、有没有风险
- 事实性内容（政策、数据、历史）需要人类快速过目
- 禁止把密钥、`.env`、账号密码提交进仓库

模板：创建 PR 时会自动带出（见 `.github/PULL_REQUEST_TEMPLATE.md`）。

## 给 AI Agent 的最短指令

若你只想丢一句话给 Agent，用这个：

> 严格遵守仓库根目录 `AGENTS.md`。改动保持最小。完成后用中文总结：改了哪些文件、我该如何验收。

## 还没有的东西（正常）

仓库刚搭骨架，第一个正式 App、自动生成 dataset 的脚本、CI 部署等会陆续补上。请先用 Issue 讨论「做什么」，再开 PR「怎么做」。

## 许可证

待定。对外发布内容与代码许可策略将由维护者另行宣布。
