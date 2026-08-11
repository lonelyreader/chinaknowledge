---
doc_contract: DocContractV1
doc_type: reference
authority: evidence
status: active
scope: utm-and-event-naming
last_verified: 2026-08-11
max_lines: 120
---

# UTM 与自定义事件命名约定

约束来源：INFRA-MEASURE-001。采集方为 Vercel Web Analytics（无 cookie 匿名统计），本约定供 INFRA-OUTBOUND-001 与社交发布流水线复用。命名一经使用不改写历史值；新增值先登记在本页再投放。

## 无 cookie 约束

- Vercel WA 不设 cookie、不做跨站与跨会话识别；访客以匿名、短期聚合方式计数。
- UTM 参数与自定义事件属性中禁止出现邮箱、用户名、user id 等任何可识别个人的数据。
- 事件属性只允许有限枚举值（见下），不允许自由文本透传用户输入。

## UTM 参数约定

规则：全小写，词间用 `_`；三个参数都必填，缺一不投放。

| 参数 | 取值规则 | 允许值 |
|---|---|---|
| `utm_source` | 流量来源平台，固定枚举 | `x`、`substack`、`instagram`、`discord` |
| `utm_medium` | 触达方式，固定枚举 | `social`（平台公开帖）、`newsletter`（邮件）、`community`（社群内分享）、`bio`（个人资料页链接） |
| `utm_campaign` | 活动或内容批次，`{yyyymm}_{slug}` | 如 `202608_launch`、`202609_mid_autumn_guide`；常驻位使用 `evergreen_{slug}` |

平台默认组合：

- X 帖子：`utm_source=x&utm_medium=social`
- Substack 邮件：`utm_source=substack&utm_medium=newsletter`
- Instagram 帖子/Story：`utm_source=instagram&utm_medium=social`；主页 bio 链接用 `utm_medium=bio`
- Discord 社群分享：`utm_source=discord&utm_medium=community`

不使用 `utm_term` 与 `utm_content`；如未来需要区分同帖多链接，先在本页登记 `utm_content` 枚举再启用。

## 自定义事件命名约定

规则：`{object}_{action}` 前缀式，全小写 snake_case；object 在前便于按前缀聚合，action 用一般现在时动词。事件总数保持精简，新增事件先登记。

| 事件名 | 触发 | 属性 |
|---|---|---|
| `outbound_click` | 点击站外链接（INFRA-OUTBOUND-001） | `destination`（目标域名，如 `substack.com`）、`position`（`header`、`footer`、`article_body`、`about`） |
| `discord_join` | 点击 Discord 邀请入口 | `position`（同上枚举） |
| `newsletter_subscribe` | 站内订阅表单提交成功 | `locale`（`en`、`es`） |

属性值一律小写枚举；`destination` 只记录域名，不记录完整 URL 或查询串。

## 使用方式

- 前端通过 `@vercel/analytics` 的 `track(name, properties)` 上报；开发模式不发送真实数据。
- 社交流水线生成链接时按本页组合 UTM；人工发帖复制既有组合，不临场造值。
