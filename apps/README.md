# apps/

可部署应用放在这里。每个应用一个子目录，例如：

```
apps/
└── knowledge-web/     # 示例名，尚未创建
    ├── README.md      # 如何安装与启动（给小白 + Agent）
    └── ...
```

规则：

- 一个目录 = 一个可独立理解的产品
- 内容不要复制进 app；从 `inbox/` / `dataset/` 按约定读取
- 新建 app 前先开 Issue 对齐垂直切口与成功标准
