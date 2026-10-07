# AKA.CRISTI — 静态原型 v1.1

Avant-Garde Fashion Magazine × Photographer Portfolio × Graphic Design Archive。
体验关键词：«冷、精密、留白、昂贵、带锋芒。»

这是 **WordPress 阶段之前的静态原型**：WordPress CMS 与付费 Slider Revolution
插件无法跑在 GitHub Pages 上，原型用原生 JS/CSS 复刻 spec 全部 motion 参数
（timeline / editorial mask 转场 / 呼吸 / A 标动画 / 视差数值与 spec 一一对应）。
设计系统见 [DESIGN.md](./DESIGN.md)，实施计划见 [BUILD_PLAN.md](./BUILD_PLAN.md)。

## v1.1 变更（BUILD_PLAN §10：ChatGPT 参考融合）

- **Hero**：杂志封面版式——顶部 mono 行 `N°01 / 06` + `城市 — 年份`；
  巨标题 `clamp(58px,9.4vw,145px)/.82` 紧排；右侧描边 A（内联 a-symbol.svg 几何，
  `min(63vw,850px)`，opacity .7）；底部短横线 dots（34px→62px）+ 2px 进度条与 6.5s 同步；
  Ken Burns 改 `scale 1.01→1.07` / 7s linear。**转场仍是 editorial mask（禁 fade）**。
- **灰阶系统**：作品图默认 `grayscale(.7) contrast(1.1)`，hover 透至 `.3`；hero 图 `.72/1.13`。
- **编号体系**：sec-head 右侧 `01 / 06`；archive 条目 `分类 / 序号` + 年份；10px mono 微标签；
  photography `ARCHIVE / 2023—2025`、design `ARCHIVE / 06 PROJECTS`（由 data.js 计算）。
- **双网格**：photography 均匀 3 列 4/5；design 12 列不对称（span7/5/4，长宽比 4/5、16/10、3/4 穿插）。
- **字带**：版块间 `.vertical-names`，5 列描边 AKA.CRISTI 不同速度 alternate 竖漂。
- 不采用：header blur（纯色）、hero fade、大 cursor、alert() 移动菜单（已用全屏菜单）。

## 本地预览

```bash
cd aka-cristi
python3 -m http.server 8080
# 打开 http://localhost:8080
```

或直接部署到 GitHub Pages（Settings → Pages → main / root）。

## 技术约束

- **零外部 URL**：无 Google Fonts、无任何库，vanilla JS + CSS（字体走系统栈）。
- 经典 script 引入：`data.js → hero.js → main.js`（禁 ES module），全部挂 `window.AKA`，
  DOM 查询走 `data-js` 钩子。
- 品牌红线：禁 pill（圆角只 0/2/4px）、禁 shadow/glass/gradient、主色 Ink/Paper/Gray、
  Frost <5% 不进 Logo、英文 label 大写 mono 0.32em、左对齐。
- `assets/a-symbol.svg`（断裂 A 精确几何）只引用，禁止重画/修改。

## 图片占位说明（诚实标注）

| 资产 | 状态 |
|---|---|
| `photo-01~04.jpg` | 真照片（从 cristi-portfolio 复制） |
| `bw-01/bw-02.jpg` | AI 生成黑白高对比硬光大片，**占位可替换** |
| `design-01~06.svg` | SVG 灰度占位，CSS `grayscale(1)` 处理，待换真图 |
| design `EXPERIMENTAL` 分类 | 暂空，待 cristi 补作品 |

换图：替换 `assets/img/` 下同名文件即可（hero 首张在 `index.html` 有 preload，
保持文件名或同步改两处）。

## WP 阶段映射表

| WP 概念 | 原型对应 | 说明 |
|---|---|---|
| CPT `photography` / `design` / `project` | `js/data.js` kind/category | 字段见 BUILD_PLAN §5 |
| ACF 字段组（Title/Category/Year/Client/Location/Cover/Hero/Gallery/Description/Credits） | `data.js` 同名字段 | 字段名保持一致，迁移时直搬 |
| `theme.json` | `css/tokens.css` | token 名一一对应 |
| SR 模块 `AKA_HOME_HERO` | `js/hero.js` + `css/hero.css` | timeline/transition/breath/parallax 参数见 BUILD_PLAN §4，直填 SR |
| SR 模块 `AKA_PROJECT_HERO` | （第二阶段） | 非 autoplay，hero 图 + N°01/TITLE/年份/分类 |
| SR 模块 `AKA_EDITORIAL_INTRO` / `AKA_BRAND_MOTION` / `AKA_FULL_IMAGE` | （第二阶段） | brand-motion 先用 CSS 实现，SR 阶段再搬 |
| Template `single-project.php`（spec §24/§27） | （第二阶段） | PROJECT HEADER → HERO → INFO → IMAGE SERIES → CREDITS → NEXT |
| 页面 /about /contact（spec §28/§29） | 首页 about-intro / contact-cta（第一阶段） | 独立页第二阶段 |

SR 参数速查（填 Slider Revolution 时用）：slide 6.5s；timeline 0/.15/.30/.45/(.55)/.60s；
转场 editorial mask（clip-path inset，RIGHT→LEFT，禁 fade）；呼吸 scale 1.01→1.07 / 7000ms /
linear 单程（v1.1 参考参数，覆盖 §15）；A 标进 700ms（opacity+x+30→0+clip 80%→0）退 450ms（x→−20）；
视差 mouse ±8px，scroll 上 A ±20px / 图 ±8px / 文 ±3px；easing `cubic-bezier(0.16,1,0.3,1)`。

## 已知折扣

1. 无 webfont：Archivo/Inter/JetBrains Mono 全部 fallback 到系统字体，
   0.32em tracking 的味道打折——WP 阶段上真字体后校准。
2. 第一阶段单页锚点（`/photography/` 等 URL 不存在），多页路由等 WP permalink。
3. 无视频（video 留 WP 阶段）。

## 测试

```bash
node test/smoke.mjs          # 16 项检查，全绿（含 7 项 v1.1 新增）
node --check js/data.js js/hero.js js/main.js
design.md lint DESIGN.md     # 0 错误 0 警告
```
