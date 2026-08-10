---
doc_contract: DocContractV1
doc_type: reference
authority: evidence
status: completed
scope: media-upload-filename-collision-evidence
last_verified: 2026-08-10
max_lines: 140
change_id: MEDIA-UPLOAD-001
---

# Media Upload Filename Collision Evidence

## 结论

Production 的同名图片上传冲突已修复。客户端在直传前为每个新文件生成 UUID basename，Payload 记录、原图与 `card` 缩略图沿用同一 basename；Vercel Blob adapter 继续禁止覆盖。

## 根因与实现

- 原 handler 直接使用浏览器 `File.name` 作为 Blob pathname；`addRandomSuffix: false` 会拒绝已存在路径。
- `UniqueVercelBlobClientUploadHandler` 在直传前生成唯一名称，并把 Vercel 返回的 basename 写回 Payload 上传元数据。
- `media-upload-filename.ts` 覆盖普通扩展名、无扩展名、隐藏文件和末尾点，避免原图或 `card` 二次重名。
- adapter 不使用 `allowOverwrite`，不改权限、Media schema、既有对象、依赖或 Local 存储。

实现提交：

- `d48555f`：客户端唯一 pathname。
- `f70fa64`：隐藏文件与末尾点归一化。
- `cf48fd8`：直接覆盖 Payload `generateFileData` 的缩略图命名回归。

## 自动验证

| 检查 | 结果 |
|---|---|
| `npm run test:media-upload-filename` | PASS |
| `npm run test:preview-config` | PASS |
| `npm run typecheck` | PASS |
| `npm run lint` | PASS；0 error，保留既有 migration warning |
| `npm run test:environment` | PASS |
| Vercel Production build | PASS；75/75 static pages |
| `npm run governance:check` | PASS |
| `git diff --check` | PASS |

## 独立复审

- 首轮 `BLOCK`：隐藏无扩展名被二次解析；已修复。
- 第二轮 `BLOCK`：末尾点文件名可使 `card` 重名；已修复。
- 最终复审 `PASS`，`P0/P1/P2 = 0/0/0`，没有剩余 finding。

## Production 验收

- deployment：`dpl_7KkTgKWbYC1GmgvGK83iykFbECFy`，`READY / target: production`，已提升到 `chinainfact.com`。
- `/api/health` 返回 `{"status":"ok"}`。
- 在 Payload Admin 使用同一来源文件名连续创建两条虚构 Media，均成功：

| Media | 原图 basename | card basename |
|---|---|---|
| `5` | `portrait-a-00-246cbaa8-ceb3-48ea-bf9f-137af6310dfa.webp` | `portrait-a-00-246cbaa8-ceb3-48ea-bf9f-137af6310dfa-800x600.webp` |
| `6` | `portrait-a-00-dec30fef-9ef7-4247-bf31-4244523e799b.webp` | `portrait-a-00-dec30fef-9ef7-4247-bf31-4244523e799b-800x600.webp` |

- 两组原图与 `card` 均在登录态读回，original 与 card pathname 分别唯一。
- 两条 fixture 依次通过 Admin 删除；删除成功状态已回读，Images 列表 fixture 数为 `0`。Payload 同步等待原图与尺寸文件的 adapter 删除，相关 `DELETE /api/media/6` 与 `/5` 均完成且没有应用错误。
- 既有 Media 数量恢复为 `3`，没有改写真实内容、账号、角色或既有媒体。

## 恢复边界

上一 Production deployment `dpl_2praoBzrH9hhuAMMmJYR3nCexQB4` 保留为代码回滚目标。本批没有 schema migration、数据回填或依赖升级。
