---
doc_contract: DocContractV1
doc_type: checklist
authority: execution
status: active
scope: dynamic-og-cover-fallback
last_verified: 2026-08-12
max_lines: 120
change_id: INFRA-OG-001
risk_tier: base
validation_profile: work_item
allowed_paths: apps/web/src/app/(frontend)/[locale]/posts/[slug]/opengraph-image.tsx, apps/web/src/app/(frontend)/[locale]/opengraph-image.tsx, apps/web/src/app/(frontend)/[locale]/people/[slug]/opengraph-image.tsx, apps/web/src/lib/og/**, apps/web/src/components/editorial-cover.tsx, apps/web/public/og/**, docs/roadmap/**, docs/reference/**, docs/current-state.md, docs/product-feature-registry.md
approval_gates: design-acceptance, preview, production-deploy, commit, merge, push
---

# INFRA-OG-001 动态 OG 与封面兜底

目标：文章、Person 与站点默认页获得动态生成的 OG 图（标题 + 作者头像或字标 + 品牌底），封面缺失时公共卡片使用系统化兜底视觉；废除标题重复红块的封面生成逻辑。构图遵守 DESIGN.md 宋式条款：受控水墨质感图片资产做容器，不用 CSS 渐变，朱砂只以印章尺寸出现。

父级：[`Site Infrastructure Program`](../site-infrastructure-program.md)。

## Scope

- `opengraph-image.tsx`（next/og）：文章页（标题 + 成员稿作者名/头像、机构稿字标 + 品牌底）、Person 页（姓名 + 判词/身份）、locale 默认。
- 兜底封面：`editorial-cover.tsx` 废除标题复读色块，改为水墨底纹资产 + mono 元信息的系统化兜底。
- 水墨底纹为仓库内静态资产（`public/og/**`，自制或可商用授权，记录来源）。
- OG 字体子集与生成耗时控制（edge/node runtime 择优，缓存头正确）。

## No-go

- 不改文章/Person 页面模板本体（属 ARTICLE-TEMPLATE/PERSON-PAGE；`opengraph-image` 为独立文件，与页面 glob 名义相交但文件集不重叠，见父级）。
- 不改 metadata 生成之外的任何数据路径；不新增 schema。
- 不引入外部图片服务；不在 OG 中呈现未公开 Person 或未公开内容。
- 不使用违反 DESIGN.md 禁令的视觉元素。

## Acceptance

- [ ] 文章、Person、默认三类 OG 图动态生成且 <1s 冷生成、有缓存；标题长文换行不破版。
- [ ] 无封面文章的列表卡片与 OG 使用系统兜底视觉，不再出现标题复读色块。
- [ ] 未公开 Person/文章的 OG 路由返回兜底而非数据泄露。
- [ ] 产品负责人样张验收通过（design-acceptance）。

## Validation

- lint、typecheck、build、`npm run governance:check`、`git diff --check`。
- 本地对三类路由抓 OG 图样张（长短标题、有无头像、EN/ES）。

## Writeback

- 样张证据入 reference；feature registry 与 current-state 写回；本 checklist 归档。

## Current gate

- [x] 用户批准 Batch 2 启动并冻结本项范围（2026-08-12）。
- [ ] 样张 design-acceptance；preview/merge/push/production-deploy 分别批准。
