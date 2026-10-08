---
version: alpha
name: AKA.CRISTI Editorial
description: AKA.CRISTI 浅色 editorial 杂志风设计系统——冷白纸面、墨黑排印、断裂 A 标、Editorial Motion。视觉主角只有 Photography / Typography / A Symbol / Motion / White Space。
colors:
  primary: "#0A0A0A"
  secondary: "#FAFAF8"
  bg: "#FAFAF8"
  bg-soft: "#EFEFEB"
  ink: "#0A0A0A"
  dim: "#3A3A3A"
  faint: "#8A8A8A"
  line: "#D9D9D9"
  frost: "#A8C5D6"
typography:
  display:
    fontFamily: "Archivo, Helvetica Neue, Helvetica, Arial, Noto Sans TC, sans-serif"
    fontSize: 80px
    fontWeight: 600
    lineHeight: 1.08
    letterSpacing: "-0.01em"
  h2:
    fontFamily: "Archivo, Helvetica Neue, Helvetica, Arial, Noto Sans TC, sans-serif"
    fontSize: 44px
    fontWeight: 600
    lineHeight: 1.1
  body:
    fontFamily: "Inter, system-ui, PingFang TC, Noto Sans TC, Microsoft JhengHei, sans-serif"
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.7
  label-mono:
    fontFamily: "JetBrains Mono, IBM Plex Mono, ui-monospace, Menlo, monospace"
    fontSize: 12px
    fontWeight: 500
    lineHeight: 1.5
    letterSpacing: "0.32em"
  wordmark:
    fontFamily: "Archivo, Helvetica Neue, Helvetica, Arial, sans-serif"
    fontSize: 16px
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "0.32em"
rounded:
  none: 0px
  sm: 2px
  ui: 4px
spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  xxl: 48px
  xxxl: 64px
  section: 96px
---

## Overview

AKA.CRISTI Editorial 是 AKA.CRISTI 的视觉语言：冷白纸面（#FAFAF8）上的墨黑（#0A0A0A）
精密排印，配断裂 A 标（DESIGN-v3 精确几何，只引用不重画）。英文只以全大写、
JetBrains Mono、0.32em 字距的 label 形式出现。整体冷、精密、留白、昂贵、带锋芒——
访客第一眼应该觉得走进一间冷调摄影画廊，而不是一个 WordPress 模板站。

语言策略：英文 label 为主（FASHION / EDITORIAL / N°01），中文标题为辅，全部左对齐。

Phase 2（多页）：`index.html` / `project.html`（`?id=` 读 data.js）/ `about.html` / `contact.html`，
站内跳转走 §40 页面转场（见 Motion）。图片走 WebP 优先：`<picture>` + jpg fallback（PIL 质量 82），
svg 占位图保持原样。

## Colors

- **ink (#0A0A0A)**：主文字、页眉描边、按钮底色、页脚底色。
- **paper (#FAFAF8)**：页面底色，冷白而非纯白。
- **gray-900 / 700 / 500 / 300 / 100**：#1A1A1A / #3A3A3A / #8A8A8A / #D9D9D9 / #EFEFEB。
  #D9D9D9 用于 1px 分隔线与卡片边框；#8A8A8A 用于非 active 导航。
- **frost (#A8C5D6)**：全站 <5%，只用于 hover / 链接。**永不进 Logo**。
- **success / warning / error**：#2E7D4F / #B7791F / #C23B2E，仅功能性提示。

## Typography

- Display：Archivo 600，桌面 40–80px（clamp），行高 1.08，-0.01em。
- H2：28–44px。Body：Inter 400，16px，行高 1.7，最大 68ch，左对齐。
- Label：JetBrains Mono 500，12px，全大写，0.32em 字距。
- Wordmark：Archivo 600，`AKA.CRISTI`，tracking 0.32em。
- 零外部 URL：全部走系统栈 fallback（plan §1.1），WP 阶段上真字体后校准。

## Shape & Components

- 圆角只有 0px（品牌默认）/ 2px（头像、小标签）/ 4px（一般 UI 上限）。**禁止 pill（999px）**。
- **header**：72–80px（手机 60–64px），左 A 标（20px 高 img）+ AKA.CRISTI 字标，
  右 nav（**无衬线粗体** font-display 700 / 15px，hover 1px 下划线；v2.1 起含 HOME），
  底部 1px #D9D9D9，无 shadow/blur/glass/gradient。
- **hero（v2.0：50/50 split-screen）**：左半图片（50%×100vh）/ 右半纸色文字面板
  （50%×100vh）；滚轮驱动两半**反向运动**（图上 / 文下），过渡中每半都是一半一半；
  移动端（≤768px）两半上下堆叠（图 52% / 文 48%），同向运动。
  section 高 n*100vh，`.hero-pin` sticky 锁 100vh；slide 绝对叠放，
  每半按 `f = i - p*(n-1)` 位移（`translateY(f*vh)` / 桌面文半 `-f*vh`）；
  位移本身即过渡，**无 autoplay、无 mask 转场**。禁普通 fade / 标准左右 slide。
  右半面板：顶部 mono 行 `N°01 / 06`、分类、Archivo 600 大标题
  `clamp(40px,5.4vw,92px)/.92`（按 50vw 校准）、英文副标题、描述（38ch）、
  年份—地点—分类 meta、`查看项目 →` 下划线链接；A 标退为面板水印
  （描边版内联 a-symbol.svg 几何：paths `fill="none" stroke-width="6"`，
  针尖/方点保留填充，几何不变）：`min(26vw,340px)`，`rgba(10,10,12,.09)`。
  只有 active slide 可交互（`pointer-events`）。
  chrome（dots / 箭头 / 2px 进度条 / scroll 指示器）全部
  `mix-blend-mode: difference` 深浅自适应，**无 is-light 主题切换**。
  底部短横线 dots（34px→active 62px）+ 2px 进度条由 JS 按 scroll 进度 scaleX。
  Hero 图 `grayscale(.72) contrast(1.13)`；Ken Burns `scale 1.01→1.07` / 7s linear（单程）。
- **work-card**：1px #D9D9D9 边框，无 shadow；hover 边框转 ink + 图 scale(1.03) / 400ms；
  图默认 `grayscale(.7) contrast(1.1)`，hover 透至 `grayscale(.3)`（.5s）。
- **photo-grid**：均匀 3 列（tablet 2 / 手机 2→1），`aspect-ratio: 4/5`，gap 24/16px；
  条目 `分类 / 序号`（10px mono）+ 标题 + 年份；分类切换用 display:none（禁 fade filter）。
- **design-grid**：12 列不对称（wide span7 / span5 / tall span4），长宽比 4/5、16/10、3/4 穿插，
  行对齐（7+5 / 4+4+4）；手机 2 列（wide 跨 2）→ 1 列。
- **vertical-names**：版块间呼吸口。5 列描边 `AKA.CRISTI`（纸底 `-webkit-text-stroke: 1px #b7b7b7`，
  深色带 `rgba(255,255,255,.14)`），每列不同速度/负延迟竖向漂移（18/23/20/26/21s，alternate 往返），
  慢速不抢戏。statement 区用其做背景（opacity .55）。
- **编号体系**：sec-head 右侧 `01 / 06` 式索引（mono 10px #8A8A8A）；
  photography 配 `ARCHIVE / 2023—2025` 馆藏标签（由 data.js 年份计算），design 配 `ARCHIVE / 06 PROJECTS`；
  about `04 / 06`、contact `05 / 06`、footer `06 / 06 — Colophon`；10px mono 微标签全站统一。
- **contact-cta**：`START A PROJECT` 黑底白字 16px 32px；hover 反转为透明底 + 1px ink 描边 + ink 字。
- **footer**：#0A0A0A 底，文字 paper，hover frost。
- **project.html（AKA_PROJECT_HERO，非自动轮播）**：全幅 hero 图 + `PROJECT` / `N°序号`
  （data.js 顺序）/ 大标题 / 年份 / 分类 / scroll cue；复用 hero.css 的 7 层类与
  `.hero.is-light` 浅色主题（tone=light 的作品）；滚动视差：图 translateY（rAF 节流，禁 blur）。
  **PROJECT INFORMATION**：两列信息表（YEAR / CLIENT / LOCATION / CATEGORY / CREDITS，
  dt 为 mono 微标签）。**IMAGE SERIES**：gallery 序列，其中一张 100vw 全幅断点
  （`width:100vw; margin-left:calc(50% - 50vw)`）。**DESCRIPTION**：68ch 左对齐。
  **DESIGN SYSTEM**（仅 design 类）：色板 swatch（ink/paper/5 档灰 + hex 标签）+
  字体样本（Archivo 600 / Inter 400 / JetBrains Mono 500）。**NEXT PROJECT**：
  按 data.js 顺序下一条（末条回绕）。id 无效/缺失 → 优雅的 `PROJECT NOT FOUND` + 返回首页，
  不许白屏。
- **about.html（三屏宣言）**：屏1 `AKA.CRISTI` 大标题 + 图；屏2 四行 disciplines
  （PHOTOGRAPHY / GRAPHIC DESIGN / ART DIRECTION / VISUAL IDENTITY）；屏3 英文宣言长文案
  （冷冽、精确、昂贵调性，约 150 词），68ch 左对齐。
- **contact.html**：`LET'S MAKE SOMETHING SHARP.` 大标题；底线式表单
  （border-bottom 1px #D9D9D9，focus 2px ink，无圆角，背景 transparent）；
  无后端：提交拼 `mailto:`（subject 含姓名+类型，body 含各字段）跳转，同时明示直接邮箱；
  空字段校验用 #B00020 深红小字 mono 提示，保持克制。

## Motion

- Easing 统一 `cubic-bezier(0.16, 1, 0.3, 1)`；快进 400–700ms / 停留 2–5s / 快退 300–500ms。
- Hero timeline（§13）：0s 图 → 0.12s 编号 → 0.22s 分类 → 0.32s 标题 →
  0.40s 英文副标题 → 0.48s 描述 → 0.56s meta → 0.64s 链接 → 0.60s A 水印；
  每张 slide 进入视口时播一遍（右半面板为主）。
- **Hero 滚轮驱动（v2.0 split-screen，替代 v1.9 track 位移）**：section 高 `n*100vh`；
  `.hero-pin` sticky 锁 100vh；slide 绝对叠放（无 `.hero-track`）。
  scroll 更新时对每张 slide `i` 计算 `f = i - p*(n-1)`：
  `.half-img` → `translateY(f*vh)`，`.half-txt` → 桌面反向 `translateY(-f*vh)`、
  移动端（`matchMedia('(max-width: 768px)')`）同向 `translateY(f*vh)`；
  rAF 节流 + passive 监听。`idx=round(p*(n-1))` 变化时：
  is-active（pointer-events）+ dots 同步 + timeline 重播 + breath 重开。
  mouse parallax 保留（`data-px` 直接写像素：img 8 / txt 3，作用在 `.half-in` 上，
  与 scroll 位移分层不冲突）；scroll 三层视差已删除。
  底部 2px 进度条由 JS 按 scroll 进度 `scaleX(p)`；scroll 指示器滚开（p>0.03）即淡出。
  dots / 箭头 / 键盘 ←/→ 统一走 `goTo(i)` → `scrollTo({top: elTop+i*vh, smooth})`
  （reduced-motion 用 'auto'；键盘保留表单守卫，pin 在视口内才响应）。
- Ken Burns（§10 P1，覆盖 §15）：scale 1.01→1.07，7000ms linear，单程（每张 slide 播一次）。
  弱到"让图片呼吸，而不是让观众注意到动画"。
- A 标（§16）：进场 opacity 0→1、x +30→0、clip 80%→0、700ms；退场 x 0→-20、opacity→0、450ms。
  禁旋转 / 弹跳 / 辉光 / 3D。
- 视差（§17）：mouse lerp（pin 区间；v2.0 起 `data-px` 直接写像素：左半图 ±8px /
  右半文 ±3px，作用在 `.half-in` 上）；scroll 三层视差已删除；手机关 mouse parallax。
- Hover 必须冷静：border 色、underline、scale 1.03、位移 4–8px、frost。
  禁 glow / shadow / bounce / gradient / blur / neon。
- 所有动效过两道门：`prefers-reduced-motion` 直接给终态（hero 无 timeline 动画/parallax/breath，
  goTo 用 'auto' 跳转）；移动端简化。
- 页面转场（§40）：站内 4 页（index / project / about / contact）跳转时，ink 面板从底部 wipe 进入
  （translateY 100%→0，350ms）→ 中央白版笔触 LOGO 闪现（`assets/logo/aka-cristi-white.png`，
  ~200px，~200ms）→ 跳转；新页面若 `document.referrer` 同源，面板从顶部 wipe 退出（0→-100%，350ms）。
  总计 500–700ms。页内锚点（`#work` 等）不拦截；`prefers-reduced-motion` 直接跳转无动画；
  修饰键/右键新标签/外链/`mailto:` 不拦截；1600ms 兜底强制跳转，浏览器前进/后退走原生导航，不卡死。
- 轮播键盘：`←`/`→` 切上下张（仅 hero 在视口内；焦点在 INPUT/TEXTAREA/SELECT/contentEditable
  时不劫持，循环首尾）。
- 轮播箭头：JS 生成 `←`/`→` 按钮，hero 两侧垂直居中；桌面 hover 显现（.6→1），触屏常显（.65）；
  `mix-blend-mode: difference` 深浅自适应；可聚焦 + aria-label。
- 方形跟随光标（fine pointer 限定）：16px 方形描边（2px 圆角），`mix-blend-mode: difference`
  深浅自适应；lerp 跟随；悬停 button/a 时放大到 30px；hero 区域隐藏原生光标；
  `mouseleave` 隐藏；reduced-motion / 触屏不启用。

## Brand（笔触 LOGO，2026-10-08 用户提供）

- `assets/logo/`：`aka-cristi-black.png/.webp`（黑版，浅底用）、`aka-cristi-white.png/.webp`
  （白版，深底用）、`favicon-180.png`（笔触 A 裁剪）。源 PNG 为 RGBA（图案在 alpha 通道）。
- header / 移动菜单：黑版，高 30px（≤480px 缩至 24px 继续显示，不隐藏）；footer（深底）：白版，
  高 26px；转场闪现：白版 ~200px；favicon/apple-touch-icon：`favicon-180.png`。
- 载入笔触：`brand-paint` 600ms，`clip-path: inset(0 100% 0 0)→0` 从左向右 wipe 展开，
  每页载入跑一次；hover 不加特效。
- Hero 巨型描边 A 保持原样（构图锚点，不替换）。
- 导航音效（`js/sound.js`）：WebAudio 原生合成，零外部音频；hover sine 660→990Hz / 70ms /
  gain .05，click 440→880Hz / 90ms / gain .07；仅 `(pointer: fine)` 启用；AudioContext 懒初始化；
  footer 设 `SOUND ON/OFF` 开关（`localStorage aka-sound`，默认开）。

## i18n（中英切换，中文为主）

- `js/i18n.js`（`data.js` 之后引入）：`AKA.i18n = { lang, dict, t, cat, city, setLang, applyStatic, onChange }`。
  默认 `lang='zh'`，`localStorage 'aka-lang'` 持久化；`setLang` 更新 `<html lang>`（zh-CN/en）。
- 静态文本：`[data-i18n="key"]`（innerHTML）/ `[data-i18n-ph]`（placeholder），key 点分隔命名
  （`nav.*` / `sec.*` / `about.*` / `cta.*` / `contact.*` / `proj.*` / `filter.all`）。
  dict zh/en key 必须完全对应（smoke 校验）；`t()` 缺 key 时回退英文再回退 key 本身。
- 动态内容订阅 `onChange`：`hero.applyLang()`（slide 存 `s._work`/`s._idx` 引用重刷文字层）、
  `AKA.renderAll()`（main.js：卡片/网格/筛选器/馆藏标签，先清空再渲染）、project.js 按当前 id 重渲染。
  各模块防御：`AKA.i18n` 缺失时退回英文原文。
- `cat()`/`city()` 映射分类与城市（未知值原样返回）；作品 `title`（中）/`titleEn`（英）、
  `description`（中）/`descEn`（英）按语言选用。
- 切换按钮：header 与移动菜单各一个 `<button class="lang-toggle" data-js="lang-toggle">`，
  显示 `中 / EN`（当前高亮），mono 小字无 pill；JS 统一绑定。
- 中文字体：系统 fallback（`--font-body` 已含 PingFang TC / Noto Sans TC / Microsoft JhengHei），
  不引入外部字体。HTML 静态默认英文（无 JS 时完整可读），`applyStatic` 在 DOMContentLoaded 即转中文。

## Don'ts

- 不要引入 Google Fonts 或任何外部 URL（svg xmlns 除外）；不要用 pill / shadow / glassmorphism /
  gradient / 圆角卡片。
- 不要重画或修改 `assets/a-symbol.svg`（断裂 A 精确几何）；浅色底用 CSS filter 反色适配。
  Logo 永不用 Frost；不改断裂位置、不拿掉针尖与方点、不旋转。
- Frost 全站 <5%，只 hover / 链接。
- 图片：黑白优先、高对比、硬光；彩色降饱和 30%；禁暖黄滤镜 / 柔光 / 复古黄 / IG preset。
  灰阶系统（§10 P2）：作品图默认 `grayscale(.7) contrast(1.1)`，hover 透至 `.3`（.5s）；
  hero 图 `grayscale(.72) contrast(1.13)`。
- 大段文字禁居中；内容左对齐；grid 边界对齐。
