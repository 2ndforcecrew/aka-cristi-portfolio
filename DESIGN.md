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
- **hero**：100vw×100vh，7 层 layer（背景图 / 巨大 A 标 / N°01 / 分类 / 标题 / 元数据 / scroll 指示器），
  editorial mask 转场（clip-path inset，RIGHT→LEFT），禁普通 fade / 标准左右 slide。
- **work-card**：1px #D9D9D9 边框，无 shadow；hover 边框转 ink + 图 scale(1.03) / 400ms。
- **photo-grid**：3/2/1 列，gap 24/16px，分类切换用 display:none（禁 fade filter）。
- **design-grid**：aligned masonry（CSS columns，break-inside avoid），左右边界对齐。
- **brand-motion**：`AKA.CRISTI`×5 outline hollow 字，垂直排列，translateY(-50%)→0 循环 25–45s，
  opacity 0.05–0.10。
- **contact-cta**：`START A PROJECT` 黑底白字 16px 32px；hover 反转为透明底 + 1px ink 描边 + ink 字。
- **footer**：#0A0A0A 底，文字 paper，hover frost。

## Motion

- Easing 统一 `cubic-bezier(0.16, 1, 0.3, 1)`；快进 400–700ms / 停留 2–5s / 快退 300–500ms。
- Hero timeline（§13）：0s 图 → 0.15s 编号 → 0.30s 分类 → 0.45s 标题 → 0.60s A 标 →
  0.80s 稳定；6.5s/张；5.5–6.5s mask transition。
- 图片呼吸（§15）：scale 1→1.035，6000ms，x 0→-1.5%，y 0→0.5%，弱到感觉不到。
- A 标（§16）：进场 opacity 0→1、x +30→0、clip 80%→0、700ms；退场 x 0→-20、opacity→0、450ms。
  禁旋转 / 弹跳 / 辉光 / 3D。
- 视差（§17）：mouse ±8px（lerp）；scroll 三层 translateY：A ±20px / 图 ±8px / 文 ±3px；
  手机关 mouse parallax。
- Hover 必须冷静：border 色、underline、scale 1.03、位移 4–8px、frost。
  禁 glow / shadow / bounce / gradient / blur / neon。
- 所有动效过两道门：`prefers-reduced-motion` 直接给终态（hero 停 autoplay/timeline/parallax/breath，
  slide 静态切换）；移动端简化。

## Don'ts

- 不要引入 Google Fonts 或任何外部 URL（svg xmlns 除外）；不要用 pill / shadow / glassmorphism /
  gradient / 圆角卡片。
- 不要重画或修改 `assets/a-symbol.svg`（断裂 A 精确几何）；浅色底用 CSS filter 反色适配。
  Logo 永不用 Frost；不改断裂位置、不拿掉针尖与方点、不旋转。
- Frost 全站 <5%，只 hover / 链接。
- 图片：黑白优先、高对比、硬光；彩色降饱和 30%；禁暖黄滤镜 / 柔光 / 复古黄 / IG preset。
- 大段文字禁居中；内容左对齐；grid 边界对齐。
