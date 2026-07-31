---
doc_contract: DocContractV1
doc_type: reference
authority: evidence
status: active
scope: agent-workspace-003-local-runtime
last_verified: 2026-08-01
max_lines: 180
---

# Agent Workspace 003 — Local runtime evidence

## Verdict

`PASS — P0/P1/P2 = 0/0/0`

003 首批已在独立 Local 数据库证明：Editor 能精确读取一篇其他 Member 的 Article，经服务端摘要和用户确认加入站方公共入口，再由另一 Editor 确认移除；Member publication、canonical、owner、原作者和公开署名不变。

本轮没有新增 schema、migration、依赖、OAuth scope、Preview 或 Production 能力。未主持实现者的最终只读复审已 `PASS`，`P0/P1/P2 = 0/0/0`。

## Delivered contract

- `editorial_article_get` 只接受精确 Article ID；仅 Editor/Super Admin 获得工具并读取 latest draft、正文、作者、策展字段、公共路径、缺失项与 revision。Member 调用返回 `FORBIDDEN`。
- `editorial_prepare_site_selection` 只接受 `selected | editing | needs_recheck → curated` 或 `curated → removed`，复用当前网页策展完整性和 workflow；只写 pending Agent event，不更新 Article、version、Workflow Event 或站方入口。
- `editorial_commit_site_selection` 使用独立的 HMAC confirmation audience，绑定 user、Person、connection、Article、action、target 与 revision，最长 5 分钟并一次消费。
- Commit 在一个事务内锁定 connection context、confirmation event、Article、封面和作者头像，重检当前 role、account、Person、scope、OAuth client、revision、transition 与完整性。
- 网页 transition endpoint 与 Agent 共同调用 `article-curation.ts`；现有 Select、Editing、Add、Remove、版本和通知仍由同一 Article access/hooks/workflow 执行。
- 同 key 同输入返回首次结果快照；同 key 换 confirmation 返回 `IDEMPOTENCY_CONFLICT`。两个不同 key 并发消费同一 confirmation 时只有一个成功。

## Permission and failure matrix

| Case | Local result |
|---|---|
| Editor，跨作者 Article | exact read、Add、replay 均成功 |
| 另一 Editor | 不能消费首位 Editor confirmation；可独立 prepare/commit Remove |
| Super Admin | 不能消费他人 confirmation；可独立 Add 和 Remove |
| Member / 原作者 | 三项 editorial tools 不出现在 capability；直接调用为 `FORBIDDEN` |
| Missing Person | `NO_PERSON` |
| Paused Editor | prepare 后 commit 为 `ACCOUNT_PAUSED` |
| Editor 降为 Member | prepare 后 commit 为 `FORBIDDEN` |
| Connection revoked | prepare 后 commit 为 `CONNECTION_REVOKED` |
| OAuth client disabled | 事务内重检后为 `CONNECTION_REVOKED` |
| Other actor / connection | `CONFIRMATION_INVALID` |
| Tampered / expired / used | `CONFIRMATION_INVALID` / `CONFIRMATION_EXPIRED` / `CONFIRMATION_USED` |
| Article changed after prepare | `REVISION_CONFLICT`，不覆盖新稿 |
| Same key, different confirmation | `IDEMPOTENCY_CONFLICT` |

## State and readback

- Prepare 前后 Article `updatedAt`、version 总数和 curated read model 不变。
- Add 后同一 Article 命中 `publicationStatus=published + curationStatus=curated + _status=published` 的站方 read model；Workflow Event 为 `editing → curated`。
- Remove 后不再命中站方 read model；匿名 `findByID` 仍能读取同一 canonical Article。内部读回确认 publication 仍为 `published`，owner、author 和 Article ID 未变化。
- Agent audit 保存 confirmation digest、输入指纹、前后 revision 与结果，不包含 confirmation 明文、正文或 source 内容。
- Member 的九项既有工具保持不变；Editor/Super Admin 的 MCP `tools/list` 和 `capabilities_list` 才增加三项 editorial tools。

## Verification

- 专用数据库：`chinaknowledge_agent003_20260801`；`APP_ENV=local`，Payload local push 只用于建立与当前 schema 相同的空测试库，没有生成 migration。
- `npm --prefix apps/web run test:agent:live` — PASS；在全新数据库完成单 Article Add、重放、Remove、角色/连接/过期/冲突负例和 OAuth MCP tool discovery。
- `npm --prefix apps/web run test:editorial` — PASS；网页 Editor curation 与 Member publication 回归通过。
- `npm --prefix apps/web run test:agent` — PASS。
- `npm --prefix apps/web run typecheck` — PASS。
- `npm --prefix apps/web run lint` — 0 errors；40 条既有 migration unused-parameter warnings。
- `npm --prefix apps/web run build` — PASS；75 个静态页面完成，MCP/OAuth 路由保留。
- `git diff --check` — PASS。
- 最终 `test:agent:live` 在断言和 `payload.destroy()` 均成功后明确 `exit 0`；测试成功路径显式结束 MCP handler 遗留的本地 socket/timeout，异常路径仍保持失败。

## Local isolation note

一次未显式传入 `DATABASE_URL` 的 `test:editorial` 误落到默认 Local 数据库，并在既有测试清理阶段失败，没有进入 003 流程。只读核对定位到本轮新建的 User `38`、Person `35`、Article `93`、2 条 Workflow Event 和 1 条 Article version；随后通过 Payload Local API 按这些精确 ID 删除并读回全部为 0。更早的 User `37` 和其他默认 Local 内容未改动。该失败不作为验收证据；上面的正式矩阵全部在专用数据库运行。

独立 reviewer 首次回归时也漏传了专用 `DATABASE_URL`，默认 Local 因缺少测试预期的 `(translationGroup, locale)` 唯一约束在负例处失败。UTC `2026-07-31 20:59:58` 时间窗内精确核对到 Article `96/99`、Article version `403/406`、Workflow Event `419/420/425/426`，以及既有 acceptance Person `29/30/31` 的新 version `19–23`；Media `5/6` 的值和时间均未变化。按对象、ID、时间和 fixture identity 四重门禁删除新增 Article、version、event 与 Person version，并把三个既有 Person 的 `updatedAt` 恢复到各自上一 version；读回六组新增记录均为 0，Person 字段、语言、链接和 Media 状态与事故前 version 一致。Reviewer 随后只使用显式专用数据库继续复审。

## Closeout

- 独立复审见 [`AGENT-WORKSPACE-003 independent review`](agent-workspace-003-independent-review-2026-08-01.md)，结论为 `PASS — P0/P1/P2 = 0/0/0`。
- 专用数据库 `chinaknowledge_agent003_20260801` 已按名称精确删除并读回不存在；本轮启动的 Local PostgreSQL 已停止。
- Preview、public MCP、真实账户、真实数据、真实公共状态、Production、schema、migration、merge 和 push均未执行。
