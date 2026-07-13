# inbox frontmatter 约定

`inbox/` 里每个 Markdown 文件顶部都应有 YAML frontmatter。分类靠这些字段，不靠文件夹。

## 最小必填

```yaml
---
title: "Clear English title for overseas readers"
lang: en
audience: general          # general | developer | researcher
topic: visa                # 短横线小写主题词，可多值见 tags
tags: [visa, travel]
status: draft              # draft | review | published
updated: 2026-07-13
---
```

## 推荐字段

| 字段 | 含义 | 示例 |
|------|------|------|
| `summary` | 一两句摘要 | `"How to think about Chinese visa types"` |
| `sources` | 来源链接列表 | `["https://..."]` |
| `needs-source` | 尚缺权威来源的断言 | `true` / `false` |
| `app` | 计划被哪些 app 消费 | `["knowledge-web"]` |
| `slug` | URL 友好短名 | `china-visa-basics` |

## 状态流转

`draft` → `review` → `published`

- `draft`：可写可不完美，默认不进生产展示
- `review`：等人核对事实
- `published`：可被生产 App 展示

## 文件命名

- 小写 + 短横线
- 可加日期前缀：`2026-07-china-visa-basics.md`
- 不要用空格和中文文件名（便于跨工具与 CI）
