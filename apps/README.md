# apps/

可部署产品放在这里。

本目录只登记已经批准并实际创建的部署单元。计划中的应用、进入条件和执行顺序由
[`docs/roadmap/README.md`](../docs/roadmap/README.md) 管理；技术建议由
[`docs/reference/technical-stack-proposal.md`](../docs/reference/technical-stack-proposal.md)
保存。

| App | 当前职责 | 入口 |
|---|---|---|
| `web` | 英语与西班牙语公共阅读产品及同应用本地编辑 CMS | [`web/README.md`](web/README.md) |

规则：

- 不把长篇生产正文写进 React 组件。
- 不为单个作者、栏目或主题建立独立 App。
- 每个应用必须有自己的 README，说明职责、入口、验证和环境边界。
- 只有存在明确且获批的独立部署边界时，才新增 `apps/<name>/`。
- 不在本页记录尚未开始的目录树、框架文件或阶段状态。
