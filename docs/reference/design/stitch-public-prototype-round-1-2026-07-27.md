---
doc_contract: DocContractV1
doc_type: reference
authority: evidence
status: active
scope: stitch-public-prototype-round-1
last_verified: 2026-07-27
max_lines: 160
change_id: P0-STITCH-001
---

# Stitch 公共站第一轮原型与人物驱动修订

## 当前状态

- 项目：[China in Fact Editorial](https://stitch.withgoogle.com/projects/12004751494305530503?pli=1)
- 页面类型：Homepage Mobile、Homepage Desktop、Stories Index、Guide、People Directory、Author Profile。
- 画布：保留原始六页、人物驱动六页、十张机制证明与修正稿，以及两张 Newsletter Final 状态页。
- 状态：产品负责人已接受公共站的信息层级、人物机制和响应式方向，作为 P1 实现基线。旧模板文案、fixture 和项目级 token 不进入接受范围。
- Fixture：上海作者 Chen Rui 与 Guide `Driving in Shanghai: licences, permits and the first week`。

## 输入合同

- 主导航仅为 `Stories / Guides / Places / People`。
- `Understand / Visit / Live / Study / Work / Business` 作为第二层文字入口。
- Topics 可发现但不与主导航同权。
- 视觉、字体、色彩、响应式和 copy gate 以 [`DESIGN.md`](../../../DESIGN.md) 为准。
- 产品关系以 [`product-brief.md`](../../product-brief.md) 和 ADR-0004 为准。

## 迭代记录

1. 首轮生成六页公共站，稳定对象、目的入口和共享 fixture 均已出现。
2. 初审发现 Purpose 被做成带图标侧栏，Stories、Guide、People 与 Author 页面偏任务门户或后台。
3. 第二轮删除全部 Discovery 侧栏与 Purpose 图标，统一为四对象顶栏；Purpose 只在首页以文字入口出现。
4. 第三次定点修订试图修改项目级字体 token 和残留标题，但 Stitch 另建了一套设计系统和六个重复页面；该次结果已撤销，项目恢复为六页版本。
5. 产品进一步明确：真实中国贡献者不是后台供稿资源，而是公共产品可被持续发现的人物网络；编辑机制承担专业可信度，具体人物承担人际可信度。
6. 直接编辑接口一度返回“六页已修改”，但实际截图和 HTML 没有变化；该次结果不计入完成证据。
7. 在 Stitch 画布内分两批生成六页人物驱动修订稿。Stitch 采用新增 variant 的方式而非原位覆盖，因此原稿与修订稿均保留。
8. 接受“首页不靠每日手排”和“People 承载 100–200 人”的产品规则后，生成首页与 People 的桌面、移动端证明页。
9. 首轮桌面首页缺少 `Latest` 与 `People to know`，移动首页只生成首屏，桌面 People 只有八条且没有贡献标题；这些页面保留为失败证据。
10. 定向修正后，新增完整桌面与移动首页，并另建 People 桌面完整版。实际导出的截图和 HTML 已人工复核；没有把 Stitch 的完成回复直接当成证据。
11. 产品负责人批准 People 顶部三人采用每周稳定的一主两辅 Spotlight；系统按当期重点、新近贡献和低曝光生成，编辑至多临时置顶一人，跨页面人物匹配首期使用可解释规则。
12. 新增 Spotlight 桌面与移动端。桌面实际呈现 24 条并使用 `Showing 1–24 of 148`；移动端实际呈现 12 条并使用 `Showing 1–12 of 148`。随后另建移动端 Refined 版，删除底部导航、修正 EN / ES 和页尾口号。
13. 产品负责人通过公共站信息层级、人物感与 Spotlight 方向。已知 fixture、项目级 token 和移动端输入间距继续作为收敛项，不阻塞进入作者与编辑工作流原型。

人物驱动修订稿 screen ID：

- Homepage Desktop：`7bb61c9e8afb4f2c9bcaf77b03e51c30`
- Homepage Mobile：`7f43760207274de492fee74ff0192ea6`
- Stories Index：`c92f5bc9c74745d3aef815cc972e66a5`
- Guide：`8141bda8df9b43e494690eb677e8bd41`
- People Directory：`80a3d9e212a74d07b041fc5855d6338e`
- Author Profile：`d7827b67e50d4c78a0ff3cec0bf6b5b5`

当前机制证明评审目标 screen ID：

- Homepage Desktop：`534fe3c0103c4a4fb3656fc8694112ef`
- Homepage Mobile：`1c42c28853ab431b86534523bf98b02e`
- People Spotlight Desktop：`72ef0c572ee74761b151b05439f3fba7`
- People Spotlight Mobile Refined：`888aaef5bca749d2a7107ed4bfb2fba3`

Newsletter Final 状态 screen ID：

- Success Desktop：`f1871b79879b41b2a3e77fe2ba247ef4`
- Error Mobile：`98aa6ae518c2480bb66504ee2a3a9f8e`

已被修正版取代的首轮证明页：Desktop Homepage `d3ca8b1ed07440a08968f389c764dde9`、Mobile Homepage `82ef5d46f7754ce9a1a67a655bbdad6a`、Desktop People `8db7c0f41f3f42fcbaf6a962178c03e7`。

## 初审结果

已满足：

- 四个稳定对象是唯一同权主导航。
- 首页 Purpose 为次级文字入口，不再使用图标、侧栏或任务门户结构。
- Desktop Homepage 具备主故事、支持内容、Guide 和作者身份的非对称编辑层级。
- Guide 使用长文阅读结构；People 使用人物摄影；Author 使用编辑型人物介绍。
- Desktop 与 Mobile Homepage 同时存在，正式品牌名保留逗号。
- Desktop 与 Mobile Homepage 都出现 `People to know`，主故事与 Chen Rui 的姓名、身份和地点直接相连。
- Stories 出现 `People in Stories`，主要内容开始使用可见署名；People 由目录式布局转为人物与贡献交叉的编辑索引。
- Guide 在标题附近显示 Chen Rui、`Written by`、`Last reviewed` 和 verification 信息，并在文末提供 `About Chen Rui`。
- Author Profile 已移除侧栏，改为全站统一顶栏，并包含第一人称介绍、Selected work、All contributions、外部链接和 Discord 延续入口。
- 修订稿 HTML 实际使用 `Instrument Serif / Satoshi / Geist Mono`，不再依赖旧屏幕的字体呈现。
- Desktop Homepage 同时出现一个主精选、两个支持内容、五条 `Latest`、三条 `Recently Updated Guides`、四名 `People to know`，以及 Newsletter 和 Discord 入口。
- Mobile Homepage 不再停在首屏，完整呈现支持内容、三条更新指南、五条最新内容、三名人物和页尾连接入口。
- Desktop People 显示三名 Featured、搜索、Topics / Places / Languages、`148 people`、十二条带地点、主题和贡献标题的双栏记录，以及显式分页。
- Mobile People 显示两名 Featured、搜索、合并 Filters、`148 people`、八条带贡献标题的单栏记录和显式分页。
- Spotlight Desktop 使用 `This week’s spotlight`、一主两辅和 `Browse all 148 people` 明确三人只是周期窗口；三人均关联贡献，目录实际显示二十四人。
- Spotlight Mobile Refined 保留同一结构，目录实际显示十二人，计数与分页一致；已删除底部导航并恢复 EN / ES。

不进入实现真相的 Stitch 模板残留：

- Stitch 项目级 token 面板仍显示 `EB Garamond / DM Sans`；修订稿自身字体正确，但设计系统真相仍未合并。
- 原始六页仍保留在画布中。评审通过后再决定删除或归档，避免当前就破坏前后比较。
- Stories 仍有 `The Quiet Rhythms of the Mega-Campus`、`The Revival of Cinnabar Seals` 等模板化标题，并混入 `Sarah Jenkins`、`David Chen` 等不一致 fixture 署名。
- Mobile Homepage 页尾仍有一段平台说明；Author 的 Discord 区域仍有一段解释性社群文案，不符合最终 copy gate。
- Desktop Homepage 的部分 `People to know` 项只显示身份，尚未清楚显示对应贡献。
- 机制证明 Mobile Homepage 的 Purpose 横排在 780px 截图中裁切了 `Business`，尚未满足无横向溢出要求。
- 机制证明 Mobile Homepage 的 `People to know` 仍以角色代替贡献标题，社群区仍有一句解释性文案；Desktop Homepage 的 Discord 按钮颜色也偏离当前强调色。
- People Desktop 用十二条样例证明双栏密度，但分页状态写 `Showing 1-24 of 148`；实现前需选择实际渲染二十四条，或让计数与可见条目一致。
- 机制证明页中的头像、地点、题目和日期均为设计 fixture；图片还存在重复人物和占位块，不可作为内容资产。
- Spotlight Mobile Refined 的搜索图标仍与 placeholder 轻微重叠，最终收敛时需修正输入框内部间距。
- 自动轮换、资格池、曝光限制和上下文匹配目前只是已批准产品规则与设计证明；正式应用尚未建立，不能将其描述为当前已运行能力。
- 人物身份、地点和内容均为原型 fixture，未经过事实核验，不可视为待发布内容。
- 需要在 Stitch 内逐页检查实际字号、44px 触控区、移动端溢出和全部可见文案。

## 下一步

P1 以本页列出的公共页面结构、`DESIGN.md` 和产品合同为实现输入。旧页面中的模板题目、人物、图片、年份、页脚和解释性文案只用于追溯，不得照抄到产品。实现验收使用真实组件、fixture 文件、浏览器截图和 copy gate，不再等待 Stitch 的旧缓存资产刷新。
