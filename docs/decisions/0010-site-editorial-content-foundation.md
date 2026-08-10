---
doc_contract: DocContractV1
doc_type: decision
authority: canonical
status: accepted
scope: decision-site-editorial-content-foundation
last_verified: 2026-08-04
max_lines: 180
change_id: MIDGAME-COLD-START-001
---

# ADR-0010：站方编辑内容基础

## Context

成员内容和 People 流量链路已经上线，但 Production 只有少量真实文章，来华旅行、生活、学习、工作和商务等基础问题几乎没有公开覆盖。研究层已经形成 17,706 条内部语料和 60 个首批主题；第三方原文不能直接转载，也不能为了满足现有 `author → Person` 约束而虚构自然人。

首批公开内容需要一个可由中文编辑审查的事实真相，再忠实形成 English 与 Español。中文服务编辑，不作为第三个公共 locale；站方内容与成员表达也不能混成同一种署名责任。

## Decision

- Article 增加 `member / site` 两种 authorship。既有和新 Member Article 继续固定原 Person；Site Article 使用固定机构署名 `China, in Fact`，不创建 Person、不借用 Editor 署名。
- `owner` 继续表示有权限维护记录的账户，不等于公开作者。Site Article 只允许 Editor/Super Admin 维护，只有 Super Admin 可以执行 Production 批量写入和公开。
- 新建仅后台可读的 Editorial Master，保存中文标题、摘要、正文、来源、权利判断、风险、核验时间、内容 hash、批次和审批状态。每个 Site translation group 必须关联一份已批准母稿。
- English 与 Español 继续是独立 Article，分别保存 URL、正文、状态、SEO 与公开时间；同组必须关联同一 Editorial Master，不能脱离中文母稿自由扩写。
- Site Article 只用于 Guide、Reporting、Analysis 或 Update，不使用 First person，也不包含虚构经历、引语或自然人身份。
- Site Article 的公开署名进入 About，不进入 Person 归档。它可以关联真实相关人物，并在关系确实存在时把读者带到 People；缺少合适人物时不强行挂靠。
- Member Article 现有个人公开、站方策展、Needs recheck、Person 归档和外链流量规则不变。站方编辑成员文章仍不能改署名或生成副本。
- 研究抓取全文只留在外部私有语料目录。Editorial Master 只保存站方中文稿、必要来源元数据和核验，不把第三方全文写入 CMS。
- Site Guide 可以使用站方自有封面，也可以使用确定性的品牌化安全 fallback；Member 内容进入站方分发仍要求获准的封面和作者头像。

## Public Contract

- 页面近标题处明确显示 Person 或 `China, in Fact`，结构化数据分别使用 `Person` 或 `Organization`。
- Site Article 的来源与核验日期公开；内部权利、编辑意见、内容 hash 和批次记录不公开。
- canonical、hreflang、sitemap 与索引只包含已分别公开的 English/Spanish Article；中文母稿永不生成公共 URL。
- 首页、Stories、Guides、Purpose、Topic 和 Place 可以混合符合条件的 Member 与 Site Article，但卡片和详情页必须保持真实署名。

## Migration And Recovery

- 现有 Article 全部原地补为 `member`，保留 ID、author、owner、translation group、URL、版本、状态、媒体与审计。
- `author` 只对 Member Article 必填；Site Article 必须没有 author，且必须有关联 Editorial Master。两种非法组合都由 schema hook 和服务端权限拒绝。
- migration 在临时 Production-shape 数据库验证 apply、rollback/reapply；Production 前建立恢复点。冷启动批次带 batch ID，可精确删除本批新记录，不改既有 Member 数据。
- 关闭 Site Article 公共读路径或撤回本批公开状态即可从公共页面移除冷启动内容；数据库恢复与代码回滚分别保留。

## Consequences

- China, in Fact 可以快速建立事实型信息覆盖，同时保留 People 作为真实自然人的长期网络。
- 中文编辑真相和英西公开记录增加一层关系与 QA，但避免让 AI 生成稿直接绕过中文审查。
- 站方对事实、来源、时效、翻译和图片承担明确责任；数量不能替代发布门槛。
