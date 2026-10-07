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
  右 nav（mono label，hover 1px 下划线），底部 1px #D9D9D9，无 shadow/blur/glass/gradient。
- **hero**：100vw×100vh，7 层 layer（背景图 / 巨大 A 标 / 顶部 mono 行 / 分类 / 标题 / 元数据 / scroll 指示器），
  editorial mask 转场（clip-path inset，RIGHT→LEFT），禁普通 fade / 标准左右 slide。
  顶部 mono 行：`N°01 / 06` + `城市 — 年份`（取 data.js location/year）。
  标题 Archivo 600 `clamp(58px,9.4vw,145px)/.82`，`-.065em` 紧排。
  A 标为描边版（内联 a-symbol.svg 几何：paths `fill="none" stroke-width="6"`，针尖/方点保留填充，
  几何不变）：`min(63vw,850px)`，`rgba(255,255,255,.82)`，稳定态 opacity .7。
  底部短横线 dots（34px→active 62px 白）+ 2px 进度条与 6.5s 轮播同步（linear）。
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
- Hero timeline（§13）：0s 图 → 0.15s 编号/城市年份 → 0.30s 分类 → 0.45s 标题 → 0.60s A 标 →
  0.80s 稳定；6.5s/张；5.5–6.5s mask transition。
- Ken Burns（§10 P1，覆盖 §15）：scale 1.01→1.07，7000ms linear，单程（每张 slide 播一次）。
  弱到"让图片呼吸，而不是让观众注意到动画"。
- A 标（§16）：进场 opacity 0→1、x +30→0、clip 80%→0、700ms；退场 x 0→-20、opacity→0、450ms。
  禁旋转 / 弹跳 / 辉光 / 3D。
- 视差（§17）：mouse ±8px（lerp）；scroll 三层 translateY：A ±20px / 图 ±8px / 文 ±3px；
  手机关 mouse parallax。
- Hover 必须冷静：border 色、underline、scale 1.03、位移 4–8px、frost。
  禁 glow / shadow / bounce / gradient / blur / neon。
- 所有动效过两道门：`prefers-reduced-motion` 直接给终态（hero 停 autoplay/timeline/parallax/breath，
  slide 静态切换）；移动端简化。
- 页面转场（§40）：站内 4 页（index / project / about / contact）跳转时，ink 面板从底部 wipe 进入
  （translateY 100%→0，350ms）→ 中央 A 标闪现（`assets/a-symbol.svg` + `filter: invert(1)` 得 paper 白，
  120px，~200ms）→ 跳转；新页面若 `document.referrer` 同源，面板从顶部 wipe 退出（0→-100%，350ms）。
  总计 500–700ms。页内锚点（`#work` 等）不拦截；`prefers-reduced-motion` 直接跳转无动画；
  修饰键/右键新标签/外链/`mailto:` 不拦截；1600ms 兜底强制跳转，浏览器前进/后退走原生导航，不卡死。

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
