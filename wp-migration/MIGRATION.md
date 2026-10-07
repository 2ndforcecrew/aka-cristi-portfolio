# MIGRATION.md — 静态原型 → WordPress 映射说明

参考包（`wp-migration/`），**仅供将来 WordPress 阶段参考，不链入网站**。
静态原型（index.html / css / js）与此目录零依赖：网站构建、smoke 测试都不读这里。

- `cpt.php` — CPT + taxonomy 注册（functions.php require 或插件加载）
- `acf-fields.json` — ACF 字段组（ACF → Tools → Import Field Groups）
- `theme.json` — 由 `css/tokens.css` 生成，WP 主题根目录同名文件
- 本文件 — 映射表 + Slider Revolution 四个模块参数规格

## 1. 映射表

### 1.1 data.js → ACF 字段

| data.js（js/data.js §44） | ACF（字段组 group_aka_project） | ACF 类型 | 说明 |
|---|---|---|---|
| `title` | `title` | text | 中文标题 |
| `titleEn` | `titleEn` | text | 英文标题（全大写 mono） |
| `category` | `category` | taxonomy → project_category | 字段名保持一致，直搬 |
| `year` | `year` | text | 四位年份 |
| `client` | `client` | text | 客户名，个人作品为 PERSONAL |
| `location` | `location` | text | 城市，全大写 |
| `cover` | `cover` | image（return id） | 卡片/列表图 |
| `hero` | `hero` | image（return id） | 详情页/首页轮播大图 |
| `gallery` | `gallery` | gallery | 详情页图序，第一阶段 = [cover] |
| `description` | `description` | textarea | 短文案 |
| `credits` | `credits` | text | 如 `PHOTOGRAPHY — AKA.CRISTI` |
| `tone` | `tone` | select：dark / light，默认 dark | 浅色 slide 前景转 ink |
| `id` | —（post_name） | — | 用作 permalink slug：`/photography/<id>/`，禁 `?p=123` |
| `kind` | —（post_type） | — | `photo` → photography CPT；`design` → design CPT |

location 规则：`post_type == photography` OR `post_type == design` OR `post_type == project`。

### 1.2 tokens.css → theme.json

| css/tokens.css | theme.json |
|---|---|
| `--ink / --paper / --gray-* / --frost` | `settings.color.palette`（slug 同名） |
| `--font-display / --font-body / --font-mono` | `settings.typography.fontFamilies`（display / body / mono，栈字符串逐字搬运） |
| `--text-display-min/max`（40–80px） | `fontSizes.display = clamp(40px,6vw,80px)` |
| `--text-h2-max` 44px | `fontSizes.h2 = 44px` |
| `--text-body` 16px | `fontSizes.body = 16px` |
| `--label-size` 12px | `fontSizes.label = 12px` |
| `--space-1..9`（4/8/16/24/32/48/64/96/128） | `settings.spacing.spacingSizes` slug 1–9 |
| `--ease-out cubic-bezier(0.16,1,0.3,1)` | SR 全局 easing（主题层无对应 token，填 SR 全局设置） |
| `--hero-slide 6500ms` | SR 模块 AKA_HOME_HERO 的 slide 停留时长 |
| `--label-tracking 0.32em` | SR label 层 letter-spacing（letterSpacing: 0.32em） |
| `--bp-desktop/tablet/mobile` | SR breakpoint 4 档（1280 / 768 / 480 + 手机横屏） |
| success / warning / error | 不进 theme.json（后台提示用，不进品牌色板） |

### 1.3 页面 → WP Template

| 原型页面 | WP Template | 说明 |
|---|---|---|
| project.html（作品详情页，第二阶段） | `single-project.php` | §24/§27 结构：PROJECT HEADER → HERO → INFO → IMAGE SERIES → CREDITS → NEXT |
| about.html（宣言页，第二阶段） | `page-about.php` | §28 三屏宣言；SR 模块 AKA_EDITORIAL_INTRO + AKA_BRAND_MOTION |
| contact.html（联系页，第二阶段） | `page-contact.php` | §29 底线表单，focus 2px ink |
| index.html（首页，v1.0/v1.1） | `front-page.php` | SR 模块 AKA_HOME_HERO |

### 1.4 CPT / taxonomy → cpt.php

| WP 概念 | cpt.php |
|---|---|
| CPT `photography` | `register_post_type('photography')` — dashicons-camera，rewrite slug `photography` |
| CPT `design` | `register_post_type('design')` — dashicons-art，rewrite slug `design` |
| CPT `project` | `register_post_type('project')` — dashicons-portfolio，rewrite slug `project` |
| taxonomy `project_category` | `register_taxonomy('project_category', …)` — hierarchical，rewrite slug `category` |
| 全部注册 | 包在 `add_action('init', 'aka_register_cpts')`，函数名前缀 `aka_` |

## 2. Slider Revolution 模块参数规格

规格来源：BUILD_PLAN §4（Hero motion 模块 JS 结构）+ §10 P1（v1.1 融合参数）。
原型用原生 JS 复刻了这些数字；WP 阶段把同一套值填进 SR（animation mode in/out、
advanced mask keyframes、scroll-based timeline、breakpoint 4 档 layer 坐标）。
全局 easing：`cubic-bezier(0.16,1,0.3,1)`。禁 fade 转场、禁 pill、禁阴影、禁渐变（spec §59）。

### 2.1 SR 模块 AKA_HOME_HERO（首页轮播）

对应：`js/hero.js` + `css/hero.css`。

- 轮播：**6.5s/张** autoplay（`--hero-slide 6500ms`）；首屏 preload 第一张后 show(0)
- 转场 **editorial mask，禁 fade**：clip-path `inset(0 100% 0 0)` → `inset(0)`（RIGHT→LEFT 展开）
- Ken Burns（P1 覆盖 spec §15）：背景图 **scale 1.01→1.07，7000ms，linear**
- timeline 分层入场（§13）：图 **0s** → 编号 **.15s** → 分类 **.30s** → 标题 **.45s** → A 标 **.60s** → 稳定（scroll cue/进度条）**.80s**
- A 标（描边几何版，`assets/a-symbol.svg` 路径改 `fill="none" stroke="currentColor" stroke-width="6"`，方点/针尖保留填充）：
  - 进：**700ms**，opacity 0→1，x +30→0，clip 80%→0
  - 退：**450ms**，x 0→-20，opacity→0
- scroll 视差三层 translateY：A **±20px** / 图 **±8px** / 文 **±3px**；手机（hover:none）关 mouse 分支
- 导航：**`01 / 06`** 计数（mono，location — year 行取 `location`/`year` 字段）+ **dots**（34px 短横线，active 62px）+ 2px 进度条与 6.5s 同步（linear）
- 浅色 slide（`tone === 'light'`）：**`is-light` 挂在 section 层**，前景转 ink（`#0A0A0A`）
- 版式（P1）：顶部 mono 行 `N°01 / 06` + `城市 — 年份`；巨标题 Archivo 600 `clamp(58px,9.4vw,145px)/.82`，letter-spacing `-.065em`；右侧巨型描边 A `min(63vw,850px)` opacity .7；SCROLL ↓ 上下 8px（禁 bounce）
- a11y：reduced-motion 时停 autoplay/timeline/Ken Burns/parallax，slide 静态切换；←/→ 键盘；visibilitychange 暂停计时

### 2.2 SR 模块 AKA_PROJECT_HERO（作品详情首屏）

- **非自动轮播**（无 autoplay、无 dots）
- 结构：全幅 hero 图（ACF `hero` 字段）+ `PROJECT` 顶标 + `N°01` 序号 + 大标题（`titleEn`）+ 年份（`year`）+ 分类（`category`）+ scroll cue
- 滚动视差：hero 图 translateY（滚动进度驱动，系数同 HOME_HERO 图层 ±8px）
- client/location 字段进 INFO 区（非 hero 层）

### 2.3 SR 模块 AKA_EDITORIAL_INTRO（宣言三屏）

- **三屏宣言结构**：
  1. 大标题 + 图（宣言主标题，全幅）
  2. 四行 disciplines（服务能力列表，四行 mono/标题排印）
  3. 68ch 长文案（`--measure: 68ch` 正文最大宽度，`--leading-body: 1.7`）
- 每屏入场沿用 HOME_HERO 的分层 timeline（0/.15/.30/.45/.60/.80s）与 editorial mask

### 2.4 SR 模块 AKA_BRAND_MOTION（竖排流动品牌字带）

- **5 列竖排描边 `AKA.CRISTI`**（`-webkit-text-stroke: 1px #b7b7b7` 纸底；深色带用 `rgba(255,255,255,.14)`）
- 每列不同速度竖向漂移：**18s / 23s / 20s / 26s / 21s + 负 delay，alternate 往返**
- opacity 极低，不抢戏（spec §32 精神：呼吸口，非焦点）

---

## 3. 迁移检查清单（WP 阶段动手前）

1. `cpt.php` 加载后，WP 后台出现 Photography / Design / Project 三个菜单（dashicons-camera/art/portfolio）
2. `acf-fields.json` 导入后，三个 CPT 编辑页出现 12 个字段；`tone` 默认 dark；`category` 关联 project_category
3. `theme.json` 放进主题根目录，编辑器色板显示 ink/paper/6 灰/frost，字体下拉出现 display/body/mono
4. 四个 SR 模块按 §2 参数建好，breakpoint 4 档 layer 坐标逐个校对
5. 12 条作品从 data.js 录入：`id` → post_name（slug），`kind` → 对应 CPT，`cover`/`hero`/`gallery` 上传到媒体库
6. permalink：`/photography/<slug>/`，禁 `?p=123`（Settings → Permalinks → Post name）
7. 真字体上线后校准排印（原型是系统栈 fallback，字重 600 + 全大写 + 0.32em 模拟）
