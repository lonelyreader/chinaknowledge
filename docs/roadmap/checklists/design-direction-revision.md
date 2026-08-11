---
doc_contract: DocContractV1
doc_type: checklist
authority: execution
status: active
scope: design-direction-revision
last_verified: 2026-08-11
max_lines: 120
change_id: DESIGN-DIRECTION-001
risk_tier: base
validation_profile: slice
allowed_paths: DESIGN.md, docs/decisions/**, docs/roadmap/**, docs/product-brief.md
approval_gates: design-direction-acceptance, commit, merge, push
---

# DESIGN-DIRECTION-001 设计方向修订：从出版物到桥梁

目标：修订 DESIGN.md 的方向性条款，把「克制的编辑出版物」校准为「通往真实的人的桥梁与路由器」，并以 ADR 固化决定。本项只改文档，是 ARTICLE-TEMPLATE、PERSON-PAGE、HOME 三个公开面子级的合同前置。

父级：[`Site Infrastructure Program`](../site-infrastructure-program.md)。

## 修订议题（2026-08-11 产品负责人已逐条接受）

1. **人物权重**（已接受）：首页与文章页的人物存在感从「避免 profile card 化」校准为「每一屏都能回答这背后是谁、如何找到他」；保留不做头像墙的边界。
2. **社群延续入口**（已接受）：Discord 从「仅 Person 页一处克制入口」放宽为「首页社群实况模块、文章末尾编辑私语式深链、Person 页本人联系渠道」三种证据化形态；保留不做弹窗、banner 与重复推广的边界。
3. **Hero 组合**（已接受）：首页 Hero 允许「人物 + 内容」组合叙事形态，不再限定纯内容主推。
4. **封面与 OG 方向**（已接受）：确立封面缺失时的兜底视觉原则与动态 OG 构图方向（标题 + 作者/字标 + 品牌底），废除标题重复色块。
5. **文章页模块**（已接受）：目录、作者卡、文末路由模块（相关人物/社群/下一篇）成为模板合同的一部分。
6. **Person 页定位**（已接受）：从档案页升级为「成员的正式名片」——第三人称编辑传记、能帮什么、项目展示、近期动态的信息架构获得设计地位。

## 已批准的参数级方案（2026-08-11 两轮拍板；第二轮确立宋式方向，色彩条款以本节为准）

深研依据：生产站四页截图审计 + 六站排版 CSS/浏览器实测（Rest of World、Asterisk、Works in Progress、Aeon、The Pudding、Sixth Tone）+ 人物与社群呈现十案例对标。第二轮产品负责人反馈现行「暖米+衬线+陶土红」组合审美疲劳（AI 俗套），确立**宋式编辑部（水墨丹青）**方向：色彩从画论来、版式从册页来、签名从金石来；目标质感为《汉声》/宋人册页/中华书局，禁止龙凤纹、祥云、灯笼、鎏金、故宫红黄配、书法字库大标题。以下写入 DESIGN.md 修订：

1. **字阶收敛为 6 级**：display-xl `clamp(48px,7vw,80px)/1.0`（Hero、文章 H1）、display-l `clamp(36px,4.5vw,56px)/1.05`、heading-l `clamp(24px,2.5vw,32px)/1.15`、heading-m `20px/1.3`（Satoshi Medium）、body `18px/1.65`（移动 16px）、meta `12px` mono 全大写字距 0.08em；废除现有 18 种随手 clamp。拉丁文继续 Instrument Serif / Satoshi / Geist Mono；汉字层用思源宋体（Noto Serif SC）。
2. **Geist Mono 升格系统层**：kicker、日期、图注、按钮、标签、语言切换统一 mono 规格——「当代实录」层，防止整站滑向仿古。
3. **署名制度升级为印章体系（全站唯一签名元素）**：文首签名组件（署名印色块 + mono 拼音姓名+汉字+城市 + 编辑判词行）、文末「文」字印、竖排汉字栏目侧签、People 索引判词名录（Gentlewoman 式）。
4. **色板（宋式定值，初值可在真实页面调校）**：画布纸灰 `#EFF0EA`（汝窑灰，替代暖米 `#F4F0E7`）、阅读面纸白 `#FBFBF8`；文字灰阶＝墨分五色：焦 `#1A1A16`（标题正文）、浓 `#333330`、重 `#55564F`、淡 `#8A8A80`、清 `#C6C7BE`（唯一分隔线色）；印泥朱砂 `#A63A2B` 仅以印章尺寸与逻辑出现（署名印、文末印、fact 标记、焦点态），永不作大面积背景，标题复读红块废除；石青 `#2F5D8A` 承担数据/图表/社群制度层（丹青字面兑现）；链接为墨下划线。
5. **摄影兑现**：摄影为主、水墨只做容器——封面兜底与 OG 底纹用受控水墨质感图片资产（不用 CSS 渐变）；模板强制图位；内容供给属内容侧不进本 program。
6. **列宽与留白**：正文 measure 收窄至 620px（约 65ch）；留白升格为有画论依据的 spacing 制度（区块间距上调一档），不对称构图（马远一角）延续现有网格。
7. **交互增量**：目录随滚动高亮当前章节（不加顶部进度条）；出站链接统一箭头字形供计量；既有 motion 参数不变。

决定记录（第一轮）：D1 七动作+署名制度＝接受；D2 独立第二强调色＝不加；D3 巨标策略＝Instrument Serif 极端化；D4 Newsletter 红底模块＝改墨底/白底细框。（第二轮，宋式）Q1 底色＝纸灰（离开米色区）；Q2 石青＝加；Q3 链接＝墨下划线；Q4 摄影为主、水墨做容器。石青的引入取代第一轮 D2 的「不加冷色」结论。字标为固定 artwork（墨+朱砂点缀），在纸灰上成立无需重制。完整方案与渲染样张存于 Cursor Canvas `visual-direction-proposal`。

## Scope

- 起草上述条款的 DESIGN.md 修订 diff 与一份 ADR（编号顺延，记录方向转变的动机与边界）。
- product-brief 中与「克制社群推广」相关的表述做最小一致性同步。

## No-go

- 不改代码；不改色板、字体与既有组件规格（那是 TOKENS-001 与后续子级的事）。
- 不引入违反现有禁令的元素：紫色/霓虹蓝/金属金/国旗配色/装饰性渐变仍然禁止。
- 未获产品负责人逐条接受前，修订不生效，后续子级不得引用草案实现。

## Acceptance

- [x] 六项议题逐条获得接受/驳回结论（2026-08-11 全部接受，含参数级方案 D1–D4）。
- [ ] DESIGN.md 修订完成并通过行数预算与治理检查。
- [ ] ADR 进入 `docs/decisions/` 并在 router 登记。

## Validation

- `npm run governance:check`、`git diff --check`、文档链接检查。

## Writeback

- ADR 与 DESIGN.md 即为写回本体；roadmap 状态更新；本 checklist 归档。

## Current gate

- [x] 用户批准建立本 checklist（2026-08-11，接手规划批次；方向性批评已由产品负责人在对话中确认）。
- [x] 产品负责人逐条接受修订议题（2026-08-11，含深研后参数级方案 D1–D4 拍板）。
- [ ] 起草 DESIGN.md 修订 diff 与 ADR，提交治理检查。
