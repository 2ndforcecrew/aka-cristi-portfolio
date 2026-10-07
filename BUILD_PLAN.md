# BUILD_PLAN — AKA.CRISTI（浅色 editorial 杂志风作品集，原型 v1.0）

> 定位：Avant-Garde Fashion Magazine × Photographer Portfolio × Graphic Design Archive。
> 体验关键词：«冷、精密、留白、昂贵、带锋芒。»视觉主角只有 Photography / Typography / A Symbol / Motion / White Space。
> 本文件是**静态原型**的实施计划。WordPress CMS 与付费 Slider Revolution 插件无法跑在 GitHub Pages 上，
> 原型用原生 JS/CSS 复刻 spec 全部 motion 参数；README 另写 WP 阶段映射（见 §8）。
> 完整 60 节 spec 以用户原文为准，本 plan 只收录实施必需的约束与参数。

## 0. 铁律（不可违反）

1. **零外部 URL**：`index.html`、`css/*`、`js/*` 不得出现 `http(s)://`（svg 的 `xmlns` 命名空间除外）。
   **不许用 Google Fonts**，不许引入任何库，vanilla JS + CSS。
2. **a-symbol.svg 禁止重画**：`assets/a-symbol.svg` 是 DESIGN-v3 精确几何（断裂 A），只许引用；
   纸面浅色底需要深色 A 时，用 CSS `filter` 反色适配，不动文件本身。
3. **编码约定**（沿用 cristi-portfolio）：经典 script 引入（data.js → hero.js → main.js，禁止 ES module）；
   全部挂 `window.AKA`；DOM 查询一律走 `data-js` 钩子；防御性编码（钩子缺失静默跳过、不抛错）。
4. **品牌红线**（spec §59）：Logo 不用 Frost、不改断裂/针尖/方点；主色只有 Ink/Paper/Gray；
   禁止 pill（圆角只许 0/2/4px）、禁止 shadow/glass/gradient/圆角卡片；英文 label 一律大写 + JetBrains Mono + 0.32em；左对齐。
5. **内容**：12 件作品数据从 `../cristi-portfolio/js/data.js` 重映射（字段扩展，不改原 repo）；
   图片资产见 §2。

---

## 1. 文件清单与职责

```
aka-cristi/
├── index.html              单页：header / hero / selected / photography /
│                           design / statement / about-intro / contact-cta / footer
│                           （第一阶段单页 + 锚点导航；独立 URL 留给 WP 阶段）
├── css/
│   ├── tokens.css          §51 设计 token：COLOR / TYPE / SPACE / GRID /
│                           RADIUS / MOTION / BREAKPOINT（:root 变量；
│                           未来直转 WordPress theme.json，见 §8）
│   ├── base.css            reset、字体栈（§1.1 fallback 顺序）、基础排印、
│                           selection / focus-visible
│   ├── layout.css          header、nav、移动菜单、section 容器（1200px）、
│                           grids、cards、statement、about、contact、footer、
│                           断点 1280 / 768 / 480
│   ├── hero.css            AKA_HOME_HERO：100vw×100vh、7 层 layer、
│                           editorial mask 转场、Ken Burns 呼吸、A 标动画、
│                           导航（01/06）、scroll indicator
│   └── motion.css          通用 reveal、hover（冷静：border/underline/
│                           scale 1.03/位移 4–8px）、prefers-reduced-motion 总闸、
│                           移动端简化
├── js/
│   ├── data.js             作品数据（§44 字段，见 §5）
│   ├── hero.js             AKA_HOME_HERO motion 模块（见 §4）
│   └── main.js             渲染 grids、header/nav 状态、移动菜单、
│                           分类切换、brand-motion 循环、reveal、页脚年份
├── assets/
│   ├── a-symbol.svg        断裂 A（只引用，禁改）
│   ├── favicon.svg         站点图标
│   └── img/                photo-01~04.jpg（从 cristi-portfolio 复制）；
│                           bw-01/bw-02.jpg（AI 生成黑白高对比时装大片，
│                           1200px 级，占位可替换）；design-*.svg（复制后
│                           CSS 灰度处理，见 §2）
├── test/smoke.mjs          零依赖冒烟测试（见 §6）
├── DESIGN.md               design.md 规范（`design.md lint` 0 错误 0 警告）
├── README.md               项目说明 + WP 阶段映射表（见 §8）
└── BUILD_PLAN.md           本文件
```

### 1.1 字体栈（零外部 URL，spec fallback 顺序）

```css
--font-display: "Archivo","Helvetica Neue",Helvetica,Arial,"Noto Sans TC",sans-serif;
--font-body: "Inter",system-ui,"PingFang TC","Noto Sans TC","Microsoft JhengHei",sans-serif;
--font-mono: "JetBrains Mono","IBM Plex Mono",ui-monospace,Menlo,monospace;
```

### 1.2 色彩 token（css/tokens.css）

```css
--ink:#0A0A0A; --paper:#FAFAF8;
--gray-900:#1A1A1A; --gray-700:#3A3A3A; --gray-500:#8A8A8A;
--gray-300:#D9D9D9; --gray-100:#EFEFEB;
--frost:#A8C5D6; /* <5%，只 hover/链接，不进 Logo */
--success:#2E7D4F; --warning:#B7791F; --error:#C23B2E;
```

---

## 2. 资产准备（步骤 0）

1. `assets/img/`：复制 `../cristi-portfolio/assets/img/photo-01.jpg` ~ `photo-04.jpg`；
   复制 `design-01.svg` ~ `design-06.svg`（展示时加 `filter: grayscale(1)`，§54）。
2. 用 media 生成管线补 2 张：**黑白、高对比、硬光、时装大片**，1200px 级，
   命名 `bw-01.jpg` / `bw-02.jpg`，文件头注释「占位待替换」。
   Prompt 要点：black & white fashion editorial, hard light, sharp detail, high contrast,
   full-body / portrait, no warm filter, no soft glow。
3. Hero 用图：6 张 photography（photo-01~04 + bw-01~02），CSS 做黑白/降饱和处理：
   - 黑白优先：`filter: grayscale(1) contrast(1.08);`
   - 彩色：`filter: saturate(.7);`（降饱和 30%，§54）
   - 禁止 warm yellow / glow / soft focus / IG preset。
4. `assets/a-symbol.svg`、`favicon.svg` 已就位，不动。

**验收**：`assets/img/` 共 12 个文件；a-symbol.svg 与交付时一致（smoke 只校验存在性，不校验 hash——hash 由实现者在 commit message 记录）。

---

## 3. 实施步骤（spec §58 第一阶段顺序，每步独立验收）

### 步骤 1 — Brand tokens + base（tokens.css / base.css / DESIGN.md）
- `:root` 落齐 §51 七组 token：COLOR（§1.2）、TYPE（display 40–80 / H2 28–44 /
  body 16/1.7 / label mono 12/0.32em 大写 / wordmark Archivo 600 tracking 0.32em）、
  SPACE（8pt：4/8/16/24/32/48/64/96/128）、GRID（12/8/4 列，gutter 24/16）、
  RADIUS（0/2/4，禁 999px）、MOTION（easing `cubic-bezier(0.16,1,0.3,1)`；快进 400–700ms /
  停留 2–5s / 快退 300–500ms）、BREAKPOINT（1280/768/480）。
- 写 DESIGN.md（frontmatter + 章节），`design.md lint` 0 错误 0 警告。
- **验收**：lint 通过；smoke token 检查全绿。

### 步骤 2 — Header / Nav（layout.css + main.js）
- Desktop：高 72–80px；左 A 标（20px 高，`<img src="assets/a-symbol.svg">`）+
  `AKA.CRISTI` 字标（Archivo 600，tracking 0.32em）；右 nav：WORK / PHOTOGRAPHY /
  DESIGN / ABOUT / CONTACT（mono 大写 0.32em，hover 1px 下划线，frost 只用于 hover/链接）；
  底部 `1px solid #D9D9D9`；背景 `#FAFAF8`；**无 shadow/blur/glass/gradient**。
- Mobile ≤768px：汉堡 → 全屏纸面菜单（左上 A，右上 CLOSE，中间 5 项 Archivo 600 大字左对齐，
  无圆角按钮）；≤480px 只留 A 标，字标收进菜单。
- **验收**：桌面/768/480 三档截图；菜单开合；hover 下划线。

### 步骤 3 — data.js（§44 字段 + 新分类）
字段：`id / kind("photo"|"design") / category / title / titleEn / year / client /
location / cover / hero / gallery[] / description / credits`。
12 件映射（title 沿用原 repo，category 按新体系）：

| id | kind | category | cover |
|---|---|---|---|
| 霓裳之夜 NEON CITY NIGHTS | photo | FASHION | photo-01.jpg |
| 都市独白 URBAN SOLILOQUY | photo | PORTRAIT | photo-02.jpg |
| 织梦者 DREAMWEAVER | photo | EDITORIAL | photo-03.jpg |
| 棱镜回响 PRISM ECHO | photo | BEAUTY | photo-04.jpg |
| 晨雾时装 MORNING MIST | photo | CAMPAIGN | bw-01.jpg |
| 高定剪影 HAUTE SILHOUETTE | photo | PERSONAL | bw-02.jpg |
| 潮牌视觉系统 | design | BRANDING | design-01.svg |
| 杂志封面设计 | design | EDITORIAL | design-02.svg |
| 音乐节海报 | design | POSTER | design-03.svg |
| 排印实验 | design | TYPOGRAPHY | design-04.svg |
| 展览视觉 | design | ART DIRECTION | design-05.svg |
| 包装设计 | design | AUTOMOTIVE | design-06.svg |

（design 的 EXPERIMENTAL 分类暂空——诚实标注，待 cristi 补作品。）
`gallery[]` 第一阶段可先为 `[cover]`（详情页在第二阶段展开）。
- **验收**：smoke 数据结构检查（12 条、字段齐全、图片文件存在、分类 ∈ 允许集合）。

### 步骤 4 — Homepage Hero（AKA_HOME_HERO：hero.css + js/hero.js）
Spec §07–§19，JS 结构见 §4。6 slides（取 6 件 photo）。
每 slide 7 层：背景图 → 巨大 A 标（桌面 45–60vw / 手机 65–80vw）→ `N°01`
（mono 12px / 0.32em）→ 分类（FASHION / EDITORIAL）→ 标题（Archivo 600）→
元数据（PARIS / 2026 / EDITORIAL）→ SCROLL 指示器（右下，mono 12px/0.32em，上下 8px，禁 bounce）。
Timeline（§13）：0s 图 → 0.15s 编号 → 0.30s 分类 → 0.45s 标题 → 0.60s A 标 →
0.80s 稳定；6.5s/张；5.5–6.5s 下一张 mask transition。
转场（§14）：**禁普通 fade / 禁标准左右 slide**；editorial mask——下一张
`clip-path: inset()` 从 RIGHT→LEFT（或 BOTTOM→TOP）展开 + 轻微位移/缩放，像杂志翻页。
图片呼吸（§15）：`scale 1→1.035`，6000ms，`x 0→-1.5%`，`y 0→0.5%`，弱到"感觉不到动画"。
A 标（§16）：进场 opacity 0→1、x +30→0、clip 80%→0、700ms；退场 x 0→-20、opacity→0、450ms；
**禁旋转/弹跳/辉光/3D**；A 永远黑或白、不断裂错位（文件本身不动）。
视差（§17）：mouse ±8px（lerp 平滑）；scroll 三层 `translateY`：A ±20px / 图 ±8px / 文 ±3px；
手机关 mouse parallax。
导航（§18）：`01 / 06` 或数字列表；active ink / inactive #8A8A8A / hover 1px 下划线；禁大圆箭头。
无障碍：`prefers-reduced-motion` → 关 autoplay/timeline/parallax/breath，slide 直接静态切换；
键盘 ←/→ 切 slide；`aria-roledescription="carousel"`。
性能（§43）：首张 preload，其余 lazy；手机用小图（`bw-*/photo-*` 的小尺寸版本或 `media` 降采样，
实现者定）。
- **验收**：live 浏览器看 2 个完整循环：timeline 层序正确、转场是 mask 不是 fade、
  A 标无旋转弹跳、01/06 导航可用、reduced-motion 下静态。

### 步骤 5 — Selected Work（layout.css + main.js）
Hero 之后。左标题 + 右 `VIEW ALL WORK →`；Desktop 2 列 / Mobile 1 列；
卡片：`1px #D9D9D9` 边框，N°01 + IMAGE（上），下为 分类 / PROJECT NAME / 2026；
hover：边框转 `#0A0A0A` + 图 `scale(1.03)` / 400ms；**无 shadow**。
取 4 件（2 photo + 2 design）。
- **验收**：2/1 列；hover 边框+缩放；边界对齐。

### 步骤 6 — Photography 网格
`/photography/` 在原型中是首页 section（锚点）。顶部 `PHOTOGRAPHY` + 分类：
ALL / FASHION / EDITORIAL / PORTRAIT / CAMPAIGN / PERSONAL。
切换：**不是 fade filter**——选中分类只显示该类，其余 `display:none`（或重渲染），
不许不同分类残留同屏。Desktop 3 列 / Tablet 2 列 / Mobile 1 列；gap 24/16；
WebP/AVIF 优先（本阶段 JPG 即可，记录升级项）；hover scale 1.03；
**禁 overlay gradient / heavy text overlay / shadow**。
- **验收**：每个分类点一遍，无残留；3/2/1 列截图。

### 步骤 7 — Design 网格（aligned masonry）
`GRAPHIC DESIGN` + 分类 ALL / BRANDING / POSTER / ART DIRECTION / TYPOGRAPHY /
EDITORIAL / AUTOMOTIVE / EXPERIMENTAL。CSS columns masonry：
左右边界对齐、column gap 24px、图片自然比例、无卡片阴影、不密密麻麻
（`break-inside: avoid`，列数 3/2/1）。
- **验收**：边界对齐截图；窄屏不错位。

### 步骤 8 — Brand statement（§32 signature effect）
`AKA.CRISTI` ×5，outline / hollow typography（`-webkit-text-stroke: 1px var(--ink)`，
`color: transparent`），垂直排列，`translateY(-50%)→0→loop`，25–45s，
opacity 0.05–0.10，**不抢作品**。reduced-motion 下静态。
- **验收**：慢速循环可见；不干扰阅读。

### 步骤 9 — About intro / Contact CTA / Footer
- About intro（首页版）：第一屏 `AKA.CRISTI` + IMAGE；第二屏
  PHOTOGRAPHY / GRAPHIC DESIGN / ART DIRECTION / VISUAL IDENTITY；第三屏长文
  （max 68ch，左对齐）。宣言口吻，不写 "Hi, I am…"。
- Contact CTA：大标 `LET'S MAKE SOMETHING SHARP.`；按钮 `START A PROJECT`
  黑底白字 `16px 32px`；hover：transparent 底 + 1px ink 描边 + ink 字；无 shadow。
  （表单是第二阶段联系页的事，首页 CTA 只放按钮 → `mailto:`。）
- Footer：`#0A0A0A` 底；`[A] AKA.CRISTI` + INSTAGRAM / EMAIL / BEHANCE / OTHER；
  `© AKA.CRISTI 2026`；文字 paper，hover frost。
- **验收**：三段各截图；CTA hover 反转；footer 链接 frost hover。

### 步骤 10 — 收尾：a11y / 性能 / SEO / 测试 / 发布
- §42：全站 Ink/Paper 对比度；图上文字优先移位，overlay 最多 60% 黑。
- §43：图片 lazy（hero 首张除外）；无视频（video 留 WP 阶段，手机 poster 同理）。
- §55：语义标题（每 section H2，作品卡 H3）；`alt="AKA.CRISTI — {titleEn} — {category}"`。
- `node test/smoke.mjs` 全绿；`node --check` 三个 JS；`design.md lint` 通过。
- 静态资源 `?v=1.0`；commit；push main；开 GitHub Pages（Settings → Pages → main / root）。
- **验收**：smoke 报告；live 链接；live 浏览器走查（步骤 4 的 hero 验收在此做）。

---

## 4. Hero motion 模块 JS 结构（js/hero.js，挂 `AKA.hero`）

只调度、不直接写样式（样式全在 hero.css，easing 统一 `cubic-bezier(0.16,1,0.3,1)`）。
拆 6 个子模块，全部防御性（钩子缺失则静默跳过）：

```
AKA.hero = {
  state,      // { i, n, playing, timers[], reduced }
  timeline,   // §13：按 [0, .15, .30, .45, .60, .80]s 依次给 7 层加 .in；
              //   用 setTimeout 链，存 timer id 以便打断
  transition, // §14：editorial mask。outgoing 层 clip 收起 + x -20px/450ms；
              //   incoming 层 clip 从 inset(0 100% 0 0) 展开到 inset(0) + 轻微 scale；
              //   用 transitionend / 超时双保险推进 state
  breath,     // §15：rAF 循环 6000ms，当前 slide 背景图
              //   scale 1→1.035、x 0→-1.5%、y 0→0.5%（transform 合成，一次写）
  parallax,   // §17：mouse → lerp 跟随 ±8px（A/图/文三层不同系数）；
              //   scroll → 按 hero 进度三层 translateY（A ±20 / 图 ±8 / 文 ±3）；
              //   手机（matchMedia hover:none）关闭 mouse 分支
  nav,        // §18：01/06 计数 + 数字列表；click 跳 slide；hover 下划线（CSS）
  a11y        // reduced-motion：停 autoplay/timeline/breath/parallax，
              //   slide 静态切换；←/→ 键盘；visibilitychange 暂停计时
}
```

主循环：`show(i)` → transition.out(current) → transition.in(next) →
timeline.play(next) → breath.restart() → nav.sync() → 6.5s 后 `show((i+1)%n)`。
首屏：`preload` 第一张后 `show(0)`。

---

## 5. data.js 字段（§44 对齐，WP 阶段 → ACF）

```js
{ id, kind: "photo"|"design", category, title, titleEn, year,
  client, location, cover, hero, gallery: [], description, credits }
```

`cover`/`hero` 第一阶段可同图；`gallery` 先为 `[cover]`。
分类映射见 §3 步骤 3 表格。

---

## 6. 测试策略（test/smoke.mjs，零依赖，沿用 portfolio 的写法）

1. 文件存在：index.html、css/ 恰好 5 个、js/ 恰好 3 个、assets/a-symbol.svg、
   favicon.svg、DESIGN.md、README.md。
2. 零外部 URL：html/css/js 无 `http(s)://`；**无 Google Fonts**（查 `@import`、
   `fonts.googleapis`、`@font-face` 外链）。
3. `?v=` 缓存：每个 css/js 引用带查询串；全站版本号一致。
4. data.js：12 条；`kind` ∈ photo/design；`category` ∈ §3 集合；
   每条含全部 §44 字段；`cover` 文件存在于 assets/img/。
5. tokens：`:root` 含 --ink #0A0A0A、--paper #FAFAF8、6 个灰阶、--frost #A8C5D6、
   easing `cubic-bezier(0.16,1,0.3,1)`、断点 1280/768/480。
6. 关键选择器存在：`.site-header`、`.hero`、`.hero-slide`、`[data-layer]`、
   `.work-card`、`.photo-grid`、`.design-grid`、`.brand-motion`、
   `.contact-cta`、`.site-footer`、`prefers-reduced-motion`。
7. 红线：css 无 `box-shadow`（`none` 除外）、无 `border-radius: 999px`（禁 pill）、
   无 `backdrop-filter`；hero.css 无 `fade` 关键帧名残留（防普通 fade 转场）。
8. SEO：`img` 皆有 `alt` 且含 `AKA.CRISTI —` 前缀（静态 html 部分；JS 渲染的由 main.js 保证，
   smoke 抽查模板字符串）。
9. `design.md lint DESIGN.md` 0 错误 0 警告（plan 要求实现者在步骤 1 跑）。

---

## 7. 风险与取舍

1. **无 webfont 的排印损失**：Archivo/Inter/JetBrains Mono 全部 fallback 到系统字体；
   0.32em tracking 的 mono 味道会打折。用字重 600 + 全大写 + 字距尽量模拟，
   WP 阶段上真字体后再校准。这是静态原型的最大视觉折扣，已告知用户。
2. **静态原型无 WP**：内容改 `data.js`，无后台；README 必须写清 CPT/ACF 映射（§8），
   否则原型与 WP 阶段脱节。
3. **Slider Revolution 跑不上 Pages**：原型用原生 JS 复刻 §13/15/16/17 参数，
   参数值与 spec 一一对应（本 plan 已列出），WP 阶段把同一套数字填进 SR。
4. **移动端 hero 层叠**：45–60vw 的 A 标在小屏与标题/元数据打架 → ≤480px
   隐藏 mono 辅助标签（§37），A 标 65–80vw 置底、文字移位避让（§42 优先移位而非 overlay）。
5. **图片家底薄**：真照片 4 张 + AI 黑白 2 张；design 全是 SVG 灰度占位。
   第一阶段视觉说服力有限——plan 里诚实标注占位，cristi 换图即换 `cover` 路径。
6. **单页 vs 多页**：第一阶段单页锚点（`/photography/` 等 URL 不存在）；
   这是故意的——多页路由等 WP 阶段用 permalink 实现，原型不造假 URL（SEO §55 的
   URL 结构在 WP 阶段兑现）。

---

## 8. WP 阶段映射（实现者写入 README.md，本 plan 定稿）

| WP 概念 | 原型对应 | 说明 |
|---|---|---|
| CPT `photography` / `design` / `project` | `data.js` kind/category | 字段见 §5 |
| ACF 字段组（Title/Category/Year/Client/Location/Cover/Hero/Gallery/Description/Credits） | `data.js` 同名字段 | 字段名保持一致，迁移时直搬 |
| `theme.json` | `css/tokens.css` | token 名一一对应 |
| SR 模块 `AKA_HOME_HERO` | `js/hero.js` + `hero.css` | timeline/transition/breath/parallax 参数见 §4，直填 SR |
| SR 模块 `AKA_PROJECT_HERO` | （第二阶段） | 非 autoplay，hero 图 + N°01/TITLE/年份/分类 |
| SR 模块 `AKA_EDITORIAL_INTRO` / `AKA_BRAND_MOTION` / `AKA_FULL_IMAGE` | （第二阶段） | brand-motion 先用 CSS 实现，SR 阶段再搬 |
| Template `single-project.php`（§24/§27） | （第二阶段） | PROJECT HEADER → HERO → INFO → IMAGE SERIES → CREDITS → NEXT |
| 页面 /about /contact（§28/§29） | 首页 about-intro / contact-cta（第一阶段） | 独立页第二阶段 |

---

## 9. 第二阶段 backlog（不做，只列）

1. Project 详情页：`single-project.php` 结构（§24 photography / §27 design，含 GTR34 式
   12 段展示：HERO/SPECIFICATIONS/TURNAROUND/FRONT/SIDE/REAR/DETAIL/WHEEL/BRAKE/ENGINE/INTERIOR/LIVERY/TYPOGRAPHY）。
2. About 独立页（§28 三屏宣言）/ Contact 独立页（§29 底线表单，focus 2px ink）。
3. Page transition（§40）：ink panel editorial wipe + A 标闪现，500–700ms。
4. SR 模块 `AKA_PROJECT_HERO` / `AKA_EDITORIAL_INTRO` / `AKA_BRAND_MOTION` / `AKA_FULL_IMAGE`。
5. 真 Slider Revolution 迁移清单：把 §4 参数填进 SR（animation mode in/out、advanced mask keyframes、
   scroll-based timeline、breakpoint 4 档 layer 坐标）。
6. WP theme 脚手架：CPT 注册、ACF 字段组 JSON、`theme.json`（由 tokens.css 生成）、
   permalink（`/photography/project-name/`，禁 `?p=123`）。
7. 性能升级：AVIF/WebP、hero 桌面/手机双裁切、video（手机用 poster）。

---

## 10. ChatGPT 参考融合（v1.1，用户指令，2026-10-08）

用户发来 `aka_cristi_motion_portfolio_v2.html`（ChatGPT 单文件作品集），明确喜欢其**作品展示**，
要求把以下 5 个模式融进新版。已逐行读过参考源码。**只参考版式与动效**，不照搬以下：
Unsplash 外链（用自己 assets）、`alert()` 移动菜单（用 v1.0 全屏菜单）、Google Fonts（零外部 URL 铁律）、
header `backdrop-filter: blur`（spec §06 禁止，改纯色 #FAFAF8）、大圆形 cursor（spec §41 保留普通 cursor）。

### P1 — Hero 杂志封面轮播（版式对齐参考，转场保留 spec）
- 版式（取自参考）：顶部 mono 行（`N°01 / 06` + `城市 — 年份`，数据取 data.js location/year）；
  巨标题 Archivo 600 `clamp(58px,9.4vw,145px)/.82` 紧排 `-.065em`（中文 fallback 按 plan §1.1）；
  右侧巨型描边 A 构图锚点（`min(63vw,850px)`，opacity .7，禁止压住人物脸部→object-position 微调）；
  底部 dots（34px 短横线，active 62px 白）+ 2px 进度条与 6.5s 轮播同步（linear）；
  SCROLL ↓（上下 8px，禁 bounce，spec §19）。
- **转场不取参考的 fade**：保留 v1.0 editorial mask（clip-path wipe right→left / bottom→top，spec §14）。
- Ken Burns 取参考参数：`scale 1.01→1.07 / 7s linear`（用户明确喜欢参考；覆盖 spec §15 的 1→1.035/6000ms，
  plan §4 备注此偏离）。
- 描边 A **不用字体 A**：用 `assets/a-symbol.svg` 的几何，描边渲染版
  （内联 SVG，paths 改 `fill="none" stroke="currentColor" stroke-width="6"`，方点/针尖保留填充），
  颜色 `rgba(255,255,255,.82)`。几何不变，不算重画。
- 保留 v1.0 的分层 timeline（§13：0/.15/.30/.45/.60/.80s）与 A 标 700ms 进 / 450ms 退（§16）。

### P2 — 灰阶优先的图片处理
- 全站作品图默认 `filter: grayscale(.7) contrast(1.1)`；hover 透出部分色彩
  （`grayscale(.25~.35)`，transition .5s）。Hero 图 `grayscale(.72) contrast(1.13)`。
- 统一不同品类图片的视觉系统（spec §54 精神）。

### P3 — 编辑编号体系
- sectionHead 右侧 `01 / 06` 式索引（mono，#8A8A8A）；卡片左上 `N°01`；
  archive 条目 `FASHION / 01` + 年份；微标签 10px JetBrains Mono 大写 0.32em；
  photography head 配 `ARCHIVE / 2024—2026` 式馆藏标签。

### P4 — 双网格性格
- Photography：均匀 3 列（桌面），`aspect-ratio: 4/5`，档案感；filter 切换用 display:none（spec §22）。
- Design：12 列不对称（wide `span 7` / 标准 `span 5` / tall `span 4`），
  长宽比 `4/5`、`16/10`、`3/4` 穿插（spec §26 aligned masonry，边界对齐）。
- 移动端：photo 2→1 列，design 2 列（wide 跨 2）→1 列。

### P5 — 竖排流动品牌字带（替代 §32 单列循环）
- 版块之间插入 `.vertical-names`：5 列描边 `AKA.CRISTI`（`-webkit-text-stroke: 1px #b7b7b7`，
  纸底；深色带用 `rgba(255,255,255,.14)`），每列不同速度/延迟竖向漂移
  （18s/23s/20s/26s/21s + 负 delay，alternate 往返），当呼吸口。
- 慢速、不抢戏（spec §32 精神保留：opacity 极低感）。

### P6 — 不采用清单（已决策）
- 参考 header 的 `blur(12px)` → spec §06 禁止，纯色。
- 参考 hero fade 切换 → spec §14 禁止，editorial mask。
- 参考的字体 A（`.bigA` font Archivo）→ 用手绘 A 描边版（§59 Logo 纪律）。
- 参考 `.magnetic` 磁吸 hover → 可选轻量保留（translate ≤8px，spec §41 允许），不强制。
- 参考 `pageWipe`（定义了但从未触发）→ 单页原型无页面跳转，不做；WP 阶段按 §40 做。
