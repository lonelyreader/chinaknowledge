## Summary

<!-- 用 1–3 条说明：这次为什么改、解决什么问题 -->

-

## Change contract

- Checklist / `change_id`：
- Risk tier：
- Validation profile：
- Allowed paths：

## What changed

<!-- 改了哪些产品层和路径 -->

-

## How to verify（小白可执行）

<!-- 写出别人点哪里、看什么就算通过 -->

1.
2.

## Checklist

- [ ] 我（或 Agent）已阅读 `AGENTS.md`
- [ ] 代码 / 配置 diff 已被 active checklist 覆盖
- [ ] 一次 PR 只做一件主要的事
- [ ] 没有提交密钥或 `.env`
- [ ] `npm run governance:check` 通过
- [ ] 若功能、权限、路由、schema、运维或上线状态变化：已更新功能登记册的对应编号和实现指纹
- [ ] `git diff --check` 通过
- [ ] 若改了可见页面：已检查桌面、移动端和新增文案
- [ ] 若涉及事实性内容：来源与更新时间可复查
- [ ] 若涉及 schema / 数据库：migration、权限负例和恢复方式已说明
- [ ] 若涉及 upgraded 风险：独立复审结论已记录
- [ ] 若涉及部署：preview、production 和内容公开已经分开
- [ ] 没有重新引入旧的 `inbox/` / `dataset/` 内容架构

## Notes for reviewers

<!-- 风险、不确定处、需要人类拍板的问题 -->

-
