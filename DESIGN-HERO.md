# Hero Video Carousel — 设计方案 v1.0

> 对标：Apple 官网 / Awwwards 获奖站 / 先锋时尚杂志沉浸式视频开场
> 风格：Minimal / Editorial / Luxury Fashion / Cinematic

## 1. 页面结构

```
<section id="hero-carousel" data-js="carousel">          <!-- 100vh 全屏 -->
  <div class="carousel-pin">                              <!-- sticky 锁定 -->
    <ul class="carousel-slides">
      <li class="carousel-slide hero-video" data-video="0">
        <div class="carousel-media">
          <div class="mask-bg"></div>                     <!-- 暗色底 -->
          <video class="full-video">…</video>             <!-- 底层：全片 -->
          <svg class="mask-svg">                          <!-- 顶层：文字遮罩 -->
            <clipPath id="hero-clip-0">
              <text><tspan class="hl">R</tspan>…</text>    <!-- 逐字母 -->
            </clipPath>
            <foreignObject clip-path="url(#hero-clip-0)">
              <video>…</video>                            <!-- 遮罩内视频 -->
            </foreignObject>
          </svg>
        </div>
        <div class="carousel-caption">…描述…</div>
      </li>
      …更多视频 slide…
    </ul>
    <nav>箭头 / 圆点 / 计数器</nav>
  </div>
</section>
```

## 2. 动画逻辑（时间轴）

| 时间 | 阶段 | 视频 | 文字 |
|---|---|---|---|
| 0s – 3s | **Video Mask Mode** | 只在字形内播放，亮度压暗 20% | 巨型标题居中，高对比，逐字母已就位 |
| 3s – 4.5s | **Transition** | 从遮罩扩展到全屏，亮度恢复 | Letter Scatter：逐字母向随机方向飞散 + 旋转 + blur(0→12px) + 透明度→0 |
| 4.5s+ | **Normal Video Mode** | 全屏正常播放 | 完全消失 |

每次 Carousel Change（切换/自动播放/滚轮）重新执行完整时间轴。

## 3. 前端实现方案

| 技术 | 用途 |
|---|---|
| HTML5 `<video>` | 双层：遮罩层 video + 全片层 video，`currentTime` 同步 |
| SVG `<clipPath>` + `<text>` + `<tspan>` | 文字遮罩形状，每字母独立 tspan 可动画 |
| CSS `transform` / `opacity` / `filter: blur()` | 字母散开动画（GPU 合成，不触发布局） |
| JS 时间轴 | `setTimeout` 链：3s 加 `.scatter` → 4.5s 加 `.mask-off` |
| Mouse Parallax | `mousemove` → mask-svg `translate(±20px)`，rAF 节流 |
| `prefers-reduced-motion` | 降级：跳过遮罩，直接全片播放 |

**关键细节：**
- 字母散开方向：预设 14 组 `--dx/--dy/--r`，覆盖上下左右放射状
- 双视频同步：`fullVideo.currentTime = maskVideo.currentTime`
- 字体：`Arial Black` 回退链（SVG data-uri 外的 inline SVG 可用系统黑体）
- 遮罩文字从 `h2[data-text]` 动态生成，支持 i18n 切换后重建

## 4. 交互

- **鼠标移动**：遮罩层轻微 parallax（±20px），视频层反向 ±10px，营造深度
- **自动播放**：视频播完 → 下一张（重新执行时间轴）；图片 6s → 下一张
- **手动切换**（滚轮/箭头/圆点/键盘）：中断当前时间轴，重置后重新执行
- **最后一张**：停止，不循环；滚轮放行页面滚动

## 5. 文件结构

```
aka-cristi/
├── index.html                  # slide 结构（含 SVG 遮罩模板）
├── css/
│   ├── carousel.css            # hero-video 样式、遮罩、散开动画、parallax
│   └── …（现有）
├── js/
│   ├── carousel.js             # 时间轴、字母生成、parallax、双视频同步
│   └── …（现有）
└── assets/
    ├── video/river-leviathan.mp4
    └── video/wawa-android.mp4
```

## 6. 视觉规范

- 遮罩阶段背景：`#0A0A0A` 纯黑（或 rgba(0,0,0,0.85) 压暗）
- 标题：`font-weight: 900`，`font-size: clamp(80px, 16vw, 280px)`，居中
- 散开：`cubic-bezier(0.2, 0.8, 0.2, 1)`，1.2–1.5s，`blur(12px)` + `opacity: 0`
- 禁止：bounce、spin、overshoot、glow、3D（站内 spec 约束）
