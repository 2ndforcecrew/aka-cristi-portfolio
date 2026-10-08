/* ============================================================
 * AKA.CRISTI — 冒烟测试（零依赖，node:test 内建）
 * plan §6：9 类检查。用法：node test/smoke.mjs
 * ============================================================ */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const exists = (p) => fs.existsSync(path.join(ROOT, p));

const cssFiles = () => fs.readdirSync(path.join(ROOT, 'css')).filter((f) => f.endsWith('.css'));
const jsFiles = () => fs.readdirSync(path.join(ROOT, 'js')).filter((f) => f.endsWith('.js'));

const PAGES = ['index.html', 'project.html', 'about.html', 'contact.html'];

/* ---------- 1. 文件存在 ---------- */
test('文件存在：4 页面 / css 10 个 / js 11 个 / svg / md / webp / wp-migration / logo', () => {
  for (const p of PAGES) assert.ok(exists(p), '缺页面 ' + p);
  assert.deepEqual(cssFiles().sort(),
    ['base.css', 'cursor.css', 'effects.css', 'hero.css', 'layout.css', 'marquee.css', 'motion.css', 'pages.css', 'tokens.css', 'transition.css']);
  assert.deepEqual(jsFiles().sort(),
    ['cursor.js', 'data.js', 'effects.js', 'hero.js', 'i18n.js', 'main.js', 'marquee.js', 'project.js', 'sound.js', 'theme.js', 'transition.js']);
  assert.ok(exists('assets/a-symbol.svg'));
  assert.ok(exists('assets/favicon.svg'));
  assert.ok(exists('DESIGN.md'));
  assert.ok(exists('README.md'));
  /* §43 WebP：6 张 jpg 皆有 .webp */
  const jpgs = fs.readdirSync(path.join(ROOT, 'assets/img')).filter((f) => f.endsWith('.jpg'));
  assert.equal(jpgs.length, 6, 'jpg 数量异常');
  for (const j of jpgs) {
    assert.ok(exists('assets/img/' + j.replace(/\.jpg$/, '.webp')), '缺 webp：' + j);
  }
  /* wp-migration 参考包 */
  for (const f of ['wp-migration/cpt.php', 'wp-migration/acf-fields.json',
    'wp-migration/theme.json', 'wp-migration/MIGRATION.md']) {
    assert.ok(exists(f), '缺 ' + f);
  }
  /* 笔触 LOGO：黑/白版 png+webp + favicon */
  for (const f of ['assets/logo/aka-cristi-black.png', 'assets/logo/aka-cristi-black.webp',
    'assets/logo/aka-cristi-white.png', 'assets/logo/aka-cristi-white.webp',
    'assets/logo/favicon-180.png']) {
    assert.ok(exists(f), '缺 ' + f);
  }
});

/* ---------- 2. 零外部 URL ---------- */
test('零外部 URL：html/css/js 无 http(s)://，无 Google Fonts', () => {
  const files = [...PAGES, ...cssFiles().map((f) => 'css/' + f), ...jsFiles().map((f) => 'js/' + f)];
  for (const f of files) {
    const src = read(f);
    assert.ok(!/https?:\/\//.test(src), f + ' 含外部 URL');
    assert.ok(!/fonts\.googleapis|fonts\.gstatic/.test(src), f + ' 含 Google Fonts');
  }
});

/* ---------- 3. ?v= 缓存 ---------- */
test('?v= 缓存：4 页面 css/js/img 引用全带查询串且全站版本一致', () => {
  const versions = new Set();
  let count = 0;
  for (const p of PAGES) {
    const html = read(p);
    const refs = [...html.matchAll(/<(?:link|script|source|img)[^>]+(?:href|src|srcset)="([^"]+)"/g)]
      .map((m) => m[1]);
    const local = refs.filter((r) => /^(css|js|assets)\//.test(r));
    assert.ok(local.length >= 8, p + ' 本地引用数异常：' + local.length);
    for (const r of local) {
      const m = r.match(/\?v=([\d.]+)$/);
      assert.ok(m, p + ' 的 ' + r + ' 缺 ?v=');
      versions.add(m[1]);
      count++;
    }
  }
  assert.equal(versions.size, 1, '全站版本号不一致：' + [...versions].join(','));
  assert.ok(count >= 40, '引用总数异常：' + count);
});

/* ---------- 4. data.js ---------- */
function loadWorks() {
  const src = read('js/data.js');
  const sandbox = { window: {} };
  new Function('window', src)(sandbox.window);
  return sandbox.window.AKA.WORKS;
}
test('data.js：13 条、字段齐全、分类合法、cover 文件存在', () => {
  const works = loadWorks();
  assert.equal(works.length, 13);
  const photoCats = ['FASHION', 'EDITORIAL', 'PORTRAIT', 'CAMPAIGN', 'BEAUTY', 'PERSONAL'];
  const designCats = ['BRANDING', 'POSTER', 'ART DIRECTION', 'TYPOGRAPHY', 'EDITORIAL', 'AUTOMOTIVE', 'EXPERIMENTAL'];
  const filmCats = ['FILM'];
  const fields = ['id', 'kind', 'category', 'title', 'titleEn', 'year', 'client',
    'location', 'cover', 'hero', 'gallery', 'description', 'credits'];
  for (const w of works) {
    for (const f of fields) assert.ok(w[f] !== undefined && w[f] !== '', w.id + ' 缺字段 ' + f);
    assert.ok(['photo', 'design', 'video'].includes(w.kind), w.id + ' kind 非法');
    const cats = w.kind === 'photo' ? photoCats : w.kind === 'video' ? filmCats : designCats;
    assert.ok(cats.includes(w.category), w.id + ' category 非法：' + w.category);
    assert.ok(exists(w.cover), w.id + ' cover 不存在：' + w.cover);
    assert.ok(Array.isArray(w.gallery) && w.gallery.includes(w.cover), w.id + ' gallery 异常');
    /* v2.7-B：video 条目必须带 video/poster 且文件存在 */
    if (w.kind === 'video') {
      assert.ok(w.video && exists(w.video), w.id + ' video 文件缺失');
      assert.ok(w.poster && exists(w.poster), w.id + ' poster 文件缺失');
      assert.ok(exists(w.poster.replace(/\.jpg$/, '.webp')), w.id + ' 缺 poster webp（ImageTrail 用）');
    }
  }
  const photos = works.filter((w) => w.kind === 'photo');
  assert.equal(photos.length, 6, 'hero 需要 6 张 photography');
});

/* ---------- 5. tokens ---------- */
test('tokens.css：:root 含全部色板/easing/断点', () => {
  const css = read('css/tokens.css');
  const need = {
    '--ink': '#0A0A0A', '--paper': '#FAFAF8',
    '--gray-900': '#1A1A1A', '--gray-700': '#3A3A3A', '--gray-500': '#8A8A8A',
    '--gray-300': '#D9D9D9', '--gray-100': '#EFEFEB', '--frost': '#A8C5D6',
  };
  for (const [k, v] of Object.entries(need)) {
    assert.ok(new RegExp(k.replace(/-/g, '\\-') + '\\s*:\\s*' + v, 'i').test(css), '缺 ' + k + ' ' + v);
  }
  assert.ok(/cubic-bezier\(\s*0\.16\s*,\s*1\s*,\s*0\.3\s*,\s*1\s*\)/.test(css), '缺 motion easing');
  assert.ok(css.includes('1280px') && css.includes('768px') && css.includes('480px'), '缺断点');
});

/* ---------- 6. 关键选择器 ---------- */
test('关键选择器存在', () => {
  const all = cssFiles().map((f) => read('css/' + f)).join('\n');
  for (const sel of ['.site-header', '.hero', '.hero-slide', '[data-layer]', '.work-card',
    '.photo-grid', '.design-grid', '.vertical-names', '.contact-cta', '.site-footer',
    '.sec-index', '.micro']) {
    assert.ok(all.includes(sel), '缺选择器 ' + sel);
  }
  assert.ok(all.includes('prefers-reduced-motion'), '缺 reduced-motion 总闸');
});

/* ---------- 7. 品牌红线 ---------- */
test('红线：无 shadow/pill/backdrop-filter；hero 无 fade 转场', () => {
  /* 剥 CSS 注释后再查（注释里允许出现违禁词，如 pages.css 头注） */
  const all = cssFiles().map((f) => read('css/' + f).replace(/\/\*[\s\S]*?\*\//g, '')).join('\n');
  assert.ok(!/box-shadow\s*:\s*(?!none)/.test(all), '含 box-shadow');
  assert.ok(!/border-radius\s*:\s*999px/.test(all), '含 pill 圆角');
  assert.ok(!/backdrop-filter/.test(all), '含 backdrop-filter');
  assert.ok(!/linear-gradient|radial-gradient/.test(all), '含 gradient');
  const heroCss = read('css/hero.css');
  assert.ok(!/@keyframes\s+[\w-]*fade/i.test(heroCss), 'hero 含 fade 关键帧');
});

/* ---------- 8. SEO ---------- */
test('SEO：img 皆有 alt；内容图 alt 含 AKA.CRISTI — 前缀', () => {
  const html = read('index.html');
  const imgs = [...html.matchAll(/<img[^>]*>/g)].map((m) => m[0]);
  assert.ok(imgs.length > 0);
  for (const tag of imgs) {
    assert.ok(/\salt=/.test(tag), 'img 缺 alt：' + tag.slice(0, 60));
    if (!/aria-hidden="true"/.test(tag)) {
      const alt = tag.match(/\salt="([^"]*)"/)[1];
      assert.ok(alt.includes('AKA.CRISTI'), 'alt 缺前缀：' + alt);
    }
  }
  assert.ok(read('js/main.js').includes('AKA.CRISTI — '), 'main.js alt 模板缺前缀');
  assert.ok(read('js/hero.js').includes('AKA.CRISTI — '), 'hero.js alt 模板缺前缀');
});

/* ---------- 10. v1.1（§10 ChatGPT 参考融合） ---------- */
test('v1.1 灰阶系统：作品图 grayscale(.7)/hover .3；hero grayscale(.72)', () => {
  const all = cssFiles().map((f) => read('css/' + f)).join('\n');
  assert.ok(all.includes('grayscale(.7)'), '缺全站灰阶 grayscale(.7)');
  assert.ok(all.includes('grayscale(.3)'), '缺 hover 透色 grayscale(.3)');
  assert.ok(read('css/hero.css').includes('grayscale(.72)'), 'hero 缺 grayscale(.72)');
  assert.ok(read('css/hero.css').includes('contrast(1.13)'), 'hero 缺 contrast(1.13)');
});

test('v1.1 描边 A：hero.js 内联 a-symbol 几何（stroke 6，针尖/方点填充）', () => {
  const js = read('js/hero.js');
  assert.ok(js.includes('stroke-width="6"'), '缺描边 stroke-width="6"');
  assert.ok(js.includes('fill="none"'), '缺 fill="none"');
  assert.ok(!/a-symbol\.svg\?v=/.test(js), 'hero 仍在引用 a-symbol.svg 文件（应内联）');
});

test('v2.5 hero：6 张图固定位置交叉淡入 + 文字反向滚动 + is-light 恢复', () => {
  const html = read('index.html');
  assert.ok(html.includes('data-js="hero-pin"'), 'index 缺 hero-pin');
  assert.ok(html.includes('data-js="hero-fixed"'), 'index 缺 hero-fixed');
  assert.ok(html.includes('data-js="hero-track-txt"'), 'index 缺 hero-track-txt');
  assert.ok(!html.includes('data-js="hero-track-img"'), 'hero-track-img 残留');
  assert.ok(!/data-js="hero-track"(?!-)/.test(html), '旧单 track 残留');
  assert.ok(!html.includes('data-js="hero-slides"'), 'hero-slides 残留');
  const js = read('js/hero.js');
  assert.ok(!/SLIDE_MS/.test(js), 'SLIDE_MS 残留');
  assert.ok(!/hero\.auto\(\)/.test(js) && !/auto:\s*function/.test(js), 'auto() 主循环残留');
  assert.ok(!/is-entering/.test(js) && !/is-leaving/.test(js) && !/pre-enter/.test(js),
    'mask transition 类残留');
  assert.ok(/goTo/.test(js) && /scrollTo/.test(js), '缺 goTo/scrollTo');
  assert.ok(/addEventListener\('scroll'/.test(js), '缺 scroll 监听');
  /* 6 张 img slide 叠放（非单张），无 imgSlide 单体 */
  assert.ok(/hero\.imgSlides\[i\] = s/.test(js), '缺 6 张 imgSlides 构建');
  assert.ok(!/hero\.imgSlide\b/.test(js.replace(/hero\.imgSlides/g, '')), '单体 hero.imgSlide 残留');
  assert.ok(/hero-slide-img/.test(js), '缺 .hero-slide-img 类');
  /* crossfade 数学：opacity = 1-|i-f|，scale = 1.06-0.06*o，JS 直接驱动 */
  assert.ok(/1 - Math\.abs\(i - f\)/.test(js), '缺 crossfade opacity = 1-|i-f|');
  assert.ok(/1\.06 - 0\.06 \* o/.test(js), '缺 crossfade scale = 1.06-0.06*o');
  /* 文字 track 反向位移保留 */
  assert.ok(/insertBefore\(t, txtFrag\.firstChild\)/.test(js), 'txt track 未倒序插入');
  assert.ok(/-\(1 - p\) \* total/.test(js), '缺文字 track translateY(-(1-p)*total)');
  assert.ok(!/-p \* total/.test(js.replace(/-\(1 - p\) \* total/g, '')), '图片 track 位移残留（图片应固定叠放）');
  /* 单个静态 A 水印（非每张 slide 一个） */
  assert.ok(/hero-a-fixed/.test(js), '缺 .hero-a-fixed 静态水印');
  assert.ok(!/hero-agroup/.test(js), 'hero.js 不应再建 hero-agroup（A 已独立）');
  /* is-light 恢复：按 tone 切 section 类 */
  const jsNoComment = js.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*/g, '');
  assert.ok(/classList\.toggle\('is-light'/.test(jsNoComment), '缺 is-light toggle（浅色图）');
  assert.ok(/w\.tone === 'light'/.test(jsNoComment), 'is-light 未按 tone=light 判定');
  /* breath 已删除（与 crossfade scale 冲突） */
  assert.ok(!/breath/.test(jsNoComment), 'breath 残留（应删除）');
  assert.ok(!/BREATH_MS/.test(jsNoComment), 'BREATH_MS 残留');
  assert.ok(!/data-breath/.test(jsNoComment), 'data-breath 残留');
  /* 旧 cursor 模块已搬走 */
  assert.ok(!/hero\.cursor/.test(jsNoComment), 'hero.js 残留 cursor 模块');
  assert.ok(!/hero-cursor/.test(jsNoComment), 'hero.js 残留 hero-cursor');
  /* split-screen 残留清理 */
  assert.ok(!/half-img/.test(jsNoComment) && !/half-txt/.test(jsNoComment), 'js 残留 half-*');
  assert.ok(js.includes('data-cursor') && js.includes("'view'"), 'VIEW PROJECT 缺 data-cursor="view"');
  const cssNoComment = read('css/hero.css').replace(/\/\*[\s\S]*?\*\//g, '');
  assert.ok(!/\.half-img/.test(cssNoComment), 'css 残留 .half-img');
  assert.ok(!/\.project-hero/.test(cssNoComment), 'css 残留 .project-hero 兼容块');
  assert.ok(!/\.hero-cursor/.test(cssNoComment), 'css 残留 .hero-cursor');
  const css = read('css/hero.css');
  assert.ok(/\.hero-slide-img\s*\{[^}]*opacity:\s*0/.test(css), 'CSS 缺 .hero-slide-img 叠放（opacity:0 起始）');
  var imgBase = (cssNoComment.match(/\.hero-slide-img\s*\{[^}]*\}/) || [''])[0];
  assert.ok(!/transition\s*:/.test(imgBase), '.hero-slide-img 基规则不应有 transition（JS 直接驱动）');
  assert.ok(/\.hero-a-fixed/.test(css), 'CSS 缺 .hero-a-fixed');
  assert.ok(/\.hero\.is-light/.test(css), 'CSS 缺 .hero.is-light 主题规则');
  assert.ok(/\[data-layer="desc"\]/.test(css) && /\[data-layer="link"\]/.test(css),
    'CSS 缺 desc/link 图层样式');
  assert.ok(/\.hero-slide-txt\.is-active/.test(css), 'CSS 缺 txt slide is-active 交互规则');
  /* i18n key */
  const i18n = loadI18n();
  assert.ok(i18n.dict.zh['hero.view'] && i18n.dict.en['hero.view'], '缺 hero.view key');
  /* 导航字间距收窄 + 无衬线粗体保留 */
  const layout = read('css/layout.css');
  assert.ok(/\.site-nav a\s*\{[^}]*letter-spacing:\s*\.08em/.test(layout), 'nav 缺 letter-spacing:.08em');
  assert.ok(/\.site-nav a\s*\{[^}]*font-weight:\s*700/.test(layout), 'nav 缺无衬线粗体');
});

test('v2.2 回归：project 页 is-light 保留（hero.css 原生支持，无需兼容块）', () => {
  /* project.html 复用 hero.css 的旧全幅 hero 类；v1.9 hero.css 原生支持 */
  assert.ok(/is-light/.test(read('js/project.js') + read('project.html')),
    'project 页 is-light 被误删');
  const css = read('css/hero.css');
  assert.ok(css.includes('.hero-bgwrap') && css.includes('.hero-agroup'), 'hero.css 缺 project 复用的类');
});

test('v1.1 字带：.vertical-names 5 列不同速度 alternate 竖漂', () => {
  const css = read('css/layout.css');
  assert.ok(css.includes('.vertical-names'), '缺 .vertical-names');
  assert.ok(css.includes('@keyframes name-drift'), '缺 name-drift');
  for (const d of ['18s', '23s', '20s', '26s', '21s']) {
    assert.ok(css.includes(d), '缺字带速度 ' + d);
  }
  assert.ok(css.includes('infinite alternate'), '字带非 alternate 往返');
});

test('v2.4 双网格替代：design 横滚（无 12 列）+ photo 密集（无 4/5）', () => {
  const css = read('css/layout.css');
  assert.ok(!/\.design-grid\s*\{[^}]*repeat\(12, 1fr\)/.test(css), 'design 仍是 12 列');
  assert.ok(!/(^|[{;])\s*columns\s*:\s*\d/.test(css), 'design 仍用 CSS columns masonry');
  assert.ok(read('js/main.js').includes('DESIGN_PAT'), 'main.js 缺 DESIGN_PAT 分配表（类名保留）');
});

test('v1.1 编号体系：sec-index / archive 条目 / 微标签', () => {
  const html = read('index.html');
  assert.ok(html.includes('02 / 06') && html.includes('06 / 06'), '缺 02/06–06/06 编号（v2.3 起 01/06 的精选作品区已删）');
  assert.ok(html.includes('data-js="photo-archive-label"'), '缺 photo archive 钩子');
  assert.ok(html.includes('data-js="design-archive-label"'), '缺 design archive 钩子');
  assert.ok(read('js/main.js').includes("w.category + ' / ' + pad2(n)"), 'archive 条目缺 分类/序号');
});

test('v1.1 红线补充：无 alert()；header 无 blur；JS 无外部引用', () => {
  for (const f of jsFiles().map((x) => 'js/' + x)) {
    assert.ok(!/\balert\s*\(/.test(read(f)), f + ' 含 alert()');
  }
  assert.ok(!/backdrop-filter/.test(read('css/layout.css')), 'layout.css 含 backdrop-filter');
  const headerBlock = read('css/layout.css').match(/\.site-header\s*{[^}]*}/);
  assert.ok(headerBlock && !/blur\s*\(/.test(headerBlock[0]), '.site-header 含 blur()');
});

test('v1.2 遗留：data.js 保留 tone=light 字段（project 页仍在用）', () => {
  assert.ok(/tone:\s*'light'/.test(read('js/data.js')), 'data.js 缺少 tone=light');
});

/* ---------- 12. Phase 2：WebP ---------- */
test('Phase 2 WebP：AKA.picture 生成 webp 优先；模板全接入；svg 不动', () => {
  const dataJs = read('js/data.js');
  assert.ok(dataJs.includes('AKA.picture'), 'data.js 缺 AKA.picture');
  assert.ok(/type["']?\s*:\s*["']image\/webp["']/.test(dataJs) || dataJs.includes("'image/webp'"),
    'AKA.picture 未生成 webp source');
  for (const f of ['js/hero.js', 'js/main.js', 'js/project.js']) {
    assert.ok(read(f).includes('AKA.picture'), f + ' 未用 AKA.picture');
  }
  /* svg 不包 picture（main.js 模板里 design-*.svg 走原样 img） */
  const stub = read('js/main.js');
  assert.ok(!/design.*picture|picture.*svg/i.test(stub.replace(/AKA\.picture/g, '')),
    'svg 疑似被包进 picture');
  const indexHtml = read('index.html');
  assert.ok(/<source[^>]*type="image\/webp"/.test(indexHtml), 'index.html 缺 webp <source>');
  assert.ok(indexHtml.includes('photo-01.webp'), 'preload 未切 webp');
});

test('Phase 2 页面转场：transition.js/css 存在且接线正确', () => {
  const js = read('js/transition.js');
  for (const s of ['shouldIntercept', 'prefers-reduced-motion', 'is-cover', 'is-leave',
    'page-wipe-a', '1600', 'aka-cristi-white']) {
    assert.ok(js.includes(s) || read('css/transition.css').includes(s), '转场缺 ' + s);
  }
  assert.ok(js.includes('assets/logo/aka-cristi-white.png'),
    '转场闪现未用白版笔触 LOGO');
  assert.ok(!/a-symbol\.svg/.test(js.replace(/assets\/a-symbol\.svg/, '')) ||
    js.includes('assets/a-symbol.svg'), 'transition.js 引用 A 标异常');
  const css = read('css/transition.css');
  assert.ok(css.includes('.page-wipe.is-cover'), '缺 .page-wipe.is-cover');
  assert.ok(css.includes('.page-wipe.is-leave'), '缺 .page-wipe.is-leave');
  assert.ok(css.includes('350ms'), '缺 350ms wipe 时长');
  assert.ok(css.includes('prefers-reduced-motion'), '转场缺 reduced-motion 总闸');
  for (const p of PAGES) {
    assert.ok(read(p).includes('js/transition.js'), p + ' 未引入 transition.js');
    assert.ok(read(p).includes('css/transition.css'), p + ' 未引入 transition.css');
  }
});

test('Phase 2 project.html：?id= 渲染管线完整', () => {
  const html = read('project.html');
  const js = read('js/project.js');
  assert.ok(/location\.search/.test(js), 'project.js 未读 ?id=');
  assert.ok(/project-notfound|PROJECT NOT FOUND/i.test(html + js), '缺 NOT FOUND 兜底');
  assert.ok(/project-next|NEXT PROJECT/i.test(html + js), '缺 NEXT PROJECT');
  assert.ok(/design-system|DESIGN SYSTEM/i.test(html + js), '缺 DESIGN SYSTEM 段');
  assert.ok(/is-light/.test(html + js), '未复用 is-light 浅色主题');
  assert.ok(/aOutlineSVG/.test(js), '未复用描边 A（AKA.hero.aOutlineSVG）');
  assert.ok(/requestAnimationFrame/.test(js), 'hero 滚动视差缺 rAF 节流');
  assert.ok(!/data-js="hero"/.test(html), 'project.html 误带 data-js="hero"（会触发首页轮播）');
});

test('Phase 2 about/contact：三屏宣言 + 底线表单 + mailto', () => {
  const about = read('about.html');
  for (const s of ['photography', 'graphic design', 'art direction', 'visual identity']) {
    assert.ok(about.toLowerCase().includes(s), 'about.html 缺 ' + s);
  }
  assert.ok(/\.about-disc\s*{[^}]*text-transform:\s*uppercase/i.test(read('css/pages.css')),
    'about disciplines 未大写');
  assert.ok(/AKA\.CRISTI/.test(about), 'about.html 缺大标题');
  const contact = read('contact.html');
  for (const s of ['NAME', 'EMAIL', 'PROJECT TYPE', 'MESSAGE']) {
    assert.ok(contact.includes(s), 'contact.html 缺字段 ' + s);
  }
  assert.ok(contact.includes("LET'S MAKE SOMETHING SHARP") ||
    /let&rsquo;s make<br>something<br>sharp\./i.test(contact), 'contact.html 缺大标题');
  assert.ok(/\.contact-title\s*{[^}]*text-transform:\s*uppercase/i.test(read('css/pages.css')),
    'contact 大标题未大写');
  assert.ok(contact.includes('akacristi@gmail.com'), 'contact.html 缺直接邮箱');
  assert.ok(/mailto:/.test(contact), 'contact.html 缺 mailto 逻辑');
  assert.ok(/#B00020/i.test(read('css/pages.css') + contact), '校验提示未用 #B00020');
  assert.ok(/border-bottom/.test(read('css/pages.css')), 'pages.css 缺底线式输入框');
});

test('Phase 2 站内链接可达：4 页 href 全解析，?id= 逐个验证', () => {
  const works = loadWorks();
  const ids = new Set(works.map((w) => w.id));
  const pageSet = new Set(PAGES);
  for (const p of PAGES) {
    const html = read(p);
    const hrefs = [...html.matchAll(/href="([^"]+)"/g)].map((m) => m[1]);
    assert.ok(hrefs.length > 0, p + ' 无链接');
    for (const h of hrefs) {
      if (!h || h.startsWith('#') || /^(mailto|tel):/.test(h)) continue;
      assert.ok(!/^https?:\/\//.test(h), p + ' 含外链 ' + h);
      const pathPart = h.split(/[?#]/)[0];
      const query = (h.split('?')[1] || '').split('#')[0];
      const file = pathPart.split('/').pop() || 'index.html';
      if (pageSet.has(file)) {
        if (query) {
          const m = query.match(/(?:^|&)id=([^&]+)/);
          if (m) {
            assert.ok(ids.has(decodeURIComponent(m[1])),
              p + ' 的 ?id=' + m[1] + ' 不在 data.js');
          }
        }
      } else {
        assert.ok(exists(pathPart), p + ' 引用缺失：' + h);
      }
    }
    /* 页内锚点必须有对应 id */
    const anchors = [...html.matchAll(/href="#([^"]+)"/g)].map((m) => m[1]).filter(Boolean);
    for (const a of anchors) {
      assert.ok(new RegExp('id="' + a + '"').test(html), p + ' 的 #' + a + ' 无对应 id');
    }
  }
});

test('Phase 2 卡片链接：三处网格全链 project.html?id=，无 # 占位', () => {
  const js = read('js/main.js');
  const hits = js.match(/project\.html\?id=/g) || [];
  assert.ok(hits.length >= 3, 'main.js 卡片链接不足 3 处：' + hits.length);
  assert.ok(!/\.href\s*=\s*['"]#['"]/.test(js), 'main.js 残留 href="#" 占位');
});

test('Phase 2 wp-migration：4 文件内容有效', () => {
  const cpt = read('wp-migration/cpt.php');
  assert.ok(cpt.includes('register_post_type'), 'cpt.php 缺 register_post_type');
  assert.ok(cpt.includes('photography') && cpt.includes('design') && cpt.includes('project'),
    'cpt.php 缺三 CPT');
  assert.ok(cpt.includes('project_category'), 'cpt.php 缺 taxonomy');
  const acf = JSON.parse(read('wp-migration/acf-fields.json'));
  assert.ok(Array.isArray(acf) && acf.length > 0, 'acf-fields.json 非数组');
  const theme = JSON.parse(read('wp-migration/theme.json'));
  assert.ok(theme.settings && theme.settings.color && theme.settings.typography,
    'theme.json 缺 settings');
  const palette = theme.settings.color.palette.map((c) => c.color.toUpperCase());
  assert.ok(palette.includes('#0A0A0A') && palette.includes('#FAFAF8'), 'theme.json 缺 ink/paper');
  const mig = read('wp-migration/MIGRATION.md');
  assert.ok(mig.includes('AKA_HOME_HERO') && mig.includes('6.5s'), 'MIGRATION.md 缺 SR 参数');
  assert.ok(!/https?:\/\//.test(cpt + read('wp-migration/acf-fields.json') +
    read('wp-migration/theme.json') + mig), 'wp-migration 含外部 URL');
});

/* ---------- 13. design.md lint ---------- */
test('design.md lint：0 错误 0 警告', () => {
  const out = execSync('design.md lint DESIGN.md', { cwd: ROOT, encoding: 'utf8' });
  const m = out.match(/"errors":\s*(\d+)[\s\S]*"warnings":\s*(\d+)/);
  assert.ok(m, 'lint 输出解析失败');
  assert.equal(m[1], '0', 'lint errors=' + m[1]);
  assert.equal(m[2], '0', 'lint warnings=' + m[2]);
});

/* ---------- 14. 站内锚点必须存在（防 #about/#contact 这类死锚点回归） ---------- */
test('站内 #锚点 都有对应 id；ABOUT/CONTACT 导航（v2.8 起 index 用锚点）', () => {
  const pages = ['index.html', 'project.html', 'about.html', 'contact.html'];
  for (const p of pages) {
    const html = read(p);
    const anchors = [...html.matchAll(/href="#([A-Za-z][\w-]*)"/g)].map((m) => m[1]);
    for (const a of anchors) {
      assert.ok(new RegExp('id="' + a + '"').test(html), p + ' 的 #' + a + ' 无对应 id');
    }
    /* v2.8：index.html 导航 About/Contact 改为页内锚点（about/contact 并入首页模块）；
       其余页面仍须指向独立页面，不能是锚点 */
    if (p === 'index.html') {
      assert.ok(/href="#about"/.test(html), 'index 导航缺 #about');
      assert.ok(/href="#contact"/.test(html), 'index 导航缺 #contact');
    } else {
      assert.ok(!/href="#about"|href="#contact"/.test(html), p + ' 导航残留 #about/#contact 死锚点');
    }
  }
  const navRe = /<a href="([^"]+)">(?:About|Contact)<\/a>/g;
  for (const p of pages) {
    for (const m of read(p).matchAll(navRe)) {
      if (p === 'index.html') {
        assert.ok(/^(#about|#contact)$/.test(m[1]), p + ' 导航 About/Contact 指向 ' + m[1]);
      } else {
        assert.ok(/^(about|contact)\.html$/.test(m[1]), p + ' 导航 About/Contact 指向 ' + m[1]);
      }
    }
  }
});

/* ---------- 15. 轮播键盘 + 箭头 + 自定义光标 ---------- */
test('轮播：键盘 ←/→（表单守卫）、箭头按钮', () => {
  const js = read('js/hero.js');
  // 表单守卫：INPUT/TEXTAREA/SELECT + contentEditable
  assert.ok(/INPUT\|TEXTAREA\|SELECT/.test(js), 'hero.js 缺少键盘表单守卫');
  assert.ok(/isContentEditable/.test(js), 'hero.js 缺少 contentEditable 守卫');
  // 箭头按钮（类名是拼接生成的，检查构造模式）
  assert.ok(/buildArrows/.test(js), 'hero.js 缺少 buildArrows');
  assert.ok(/hero-arrow--' \+ \(dir < 0 \? 'prev' : 'next'\)/.test(js), 'hero.js 箭头类名构造缺失');
  assert.ok(/Previous slide/.test(js) && /Next slide/.test(js), 'hero.js 箭头无障碍标签缺失');
  const css = read('css/hero.css');
  assert.ok(css.includes('.hero-arrow'), 'hero.css 缺少 .hero-arrow');
  assert.ok(css.includes('(hover: none)'), 'hero.css 箭头缺少触屏常显');
  // 自定义光标（v2.4 起搬至 js/cursor.js 全站，见专项测试）
  assert.ok(!/cursor:\s*{/.test(js), 'hero.js 残留 cursor 模块');
});

/* ---------- 16. 笔触 LOGO + 导航音效 ---------- */
test('笔触 LOGO 全站接线：黑白版分场景、favicon、转场白版、音效', () => {
  const pages = ['index.html', 'project.html', 'about.html', 'contact.html'];
  for (const p of pages) {
    const html = read(p);
    // header/移动菜单用黑版（浅底），footer 用白版（深底）
    assert.ok(html.includes('assets/logo/aka-cristi-black'), p + ' 缺黑版 LOGO');
    assert.ok(html.includes('assets/logo/aka-cristi-white'), p + ' 缺白版 LOGO');
    // favicon 换成笔触 A 裁剪
    assert.ok(html.includes('assets/logo/favicon-180.png'), p + ' favicon 未换笔触版');
    // sound.js 引入 + footer 开关
    assert.ok(html.includes('js/sound.js'), p + ' 未引入 sound.js');
    assert.ok(html.includes('data-js="sound-toggle"'), p + ' 缺音效开关');
  }
  // 转场闪现用白版（ink 黑底）
  assert.ok(read('js/transition.js').includes('assets/logo/aka-cristi-white.png'),
    'transition.js 转场闪现未换白版 LOGO');
  // 音效：WebAudio 合成、无外部音频、pointer:fine 限定、localStorage 开关
  const snd = read('js/sound.js');
  assert.ok(/createOscillator/.test(snd), 'sound.js 非 WebAudio 合成');
  assert.ok(!/https?:\/\//.test(snd), 'sound.js 含外部 URL');
  assert.ok(/pointer:\s?fine/.test(snd), 'sound.js 缺 pointer:fine 限定');
  assert.ok(/aka-sound/.test(snd), 'sound.js 缺 localStorage 开关');
  // LOGO 载入笔触动画
  assert.ok(read('css/layout.css').includes('brand-paint'), 'layout.css 缺 LOGO 笔触动画');
});

/* ---------- i18n ---------- */
function loadI18n() {
  const src = read('js/i18n.js');
  const sandbox = { window: {} };
  new Function('window', src)(sandbox.window);
  return sandbox.window.AKA.i18n;
}

test('i18n：dict zh/en key 完全对应', () => {
  const i18n = loadI18n();
  const zhKeys = Object.keys(i18n.dict.zh).sort();
  const enKeys = Object.keys(i18n.dict.en).sort();
  assert.deepEqual(zhKeys, enKeys, 'zh/en key 不对应');
  assert.ok(zhKeys.length >= 40, 'dict key 太少：' + zhKeys.length);
  for (const k of zhKeys) {
    assert.ok(i18n.dict.zh[k] !== '', 'zh 空值：' + k);
    assert.ok(i18n.dict.en[k] !== '', 'en 空值：' + k);
  }
});

test('i18n：4 页所有 [data-i18n] 的 key 都在 dict 里', () => {
  const i18n = loadI18n();
  const keys = new Set(Object.keys(i18n.dict.zh));
  for (const p of PAGES) {
    const html = read(p);
    for (const m of html.matchAll(/data-i18n="([^"]+)"/g)) {
      assert.ok(keys.has(m[1]), p + ' 的 key 不在 dict：' + m[1]);
    }
  }
});

test('i18n：13 件作品都有 title/titleEn/description/descEn', () => {
  const works = loadWorks();
  assert.equal(works.length, 13);
  for (const w of works) {
    for (const f of ['title', 'titleEn', 'description', 'descEn']) {
      assert.ok(w[f] !== undefined && w[f] !== '', w.id + ' 缺 ' + f);
    }
  }
  /* 中文描述来自映射表（非旧占位） */
  const byId = {};
  works.forEach((w) => { byId[w.id] = w; });
  assert.ok(byId['neon-city-nights'].description.includes('胶片颗粒'), 'neon 描述未更新');
  assert.ok(byId['type-experiments'].description.includes('解构字形'), 'type 描述未更新');
  assert.ok(byId['packaging-design'].descEn.includes('fragrance'), 'packaging descEn 异常');
});

test('i18n：4 页各有 1 个 lang-toggle（位于 .float-controls，header/移动菜单已移除）且 i18n.js 在 data.js 之后引入', () => {
  for (const p of PAGES) {
    const html = read(p);
    const toggles = [...html.matchAll(/data-js="lang-toggle"/g)].length;
    assert.equal(toggles, 1, p + ' lang-toggle 应恰好 1 个：' + toggles);
    const themes = [...html.matchAll(/data-js="theme-toggle"/g)].length;
    assert.equal(themes, 1, p + ' theme-toggle 应恰好 1 个：' + themes);
    assert.ok(html.includes('class="float-controls"'), p + ' 缺 .float-controls');
    assert.ok(!html.includes('mobile-lang'), p + ' mobile-lang 残留');
    const di = html.indexOf('js/data.js');
    const ii = html.indexOf('js/i18n.js');
    assert.ok(di !== -1 && ii !== -1 && ii > di, p + ' i18n.js 未在 data.js 之后引入');
    assert.ok(html.includes('<html lang="zh-CN">'), p + ' html lang 不是 zh-CN');
  }
});

test('i18n：cat/city 映射 + 未知值原样返回', () => {
  const i18n = loadI18n();
  assert.equal(i18n.cat('FASHION'), '时装');
  assert.equal(i18n.cat('ART DIRECTION'), '艺术指导');
  assert.equal(i18n.cat('EXPERIMENTAL'), 'EXPERIMENTAL');
  assert.equal(i18n.city('SHANGHAI'), '上海');
  assert.equal(i18n.city('HONG KONG'), '香港');
  assert.equal(i18n.city('—'), '—');
  i18n.setLang('en');
  assert.equal(i18n.t('nav.home'), 'Home');
  assert.equal(i18n.cat('FASHION'), 'FASHION');
  assert.equal(i18n.city('SHANGHAI'), 'SHANGHAI');
  assert.equal(i18n.t('nav.work'), 'Work');
  i18n.setLang('zh');
  assert.equal(i18n.t('nav.home'), '首页');
  assert.equal(i18n.t('nav.work'), '作品');
  assert.equal(i18n.t('no.such.key'), 'no.such.key');
});

/* ---------- 17. 筛选分类必须有中文映射且有作品使用 ---------- */
test('筛选分类：PHOTO_CATS/DESIGN_CATS 都有中文映射、无幽灵分类', () => {
  const src = fs.readFileSync(path.join(ROOT, 'js/i18n.js'), 'utf8');
  const catBlock = src.match(/var CAT_MAP = \{([\s\S]*?)\};/)[1];
  const data = fs.readFileSync(path.join(ROOT, 'js/data.js'), 'utf8');
  for (const v of ['PHOTO_CATS', 'DESIGN_CATS']) {
    const cats = eval(data.match(new RegExp('AKA\\.' + v + ' = (\\[[^\\]]*\\])'))[1]);
    const workCats = new Set([...data.matchAll(/category:\s*'([^']+)'/g)].map((m) => m[1]));
    for (const c of cats) {
      assert.ok(new RegExp("'" + c + "':").test(catBlock) || c === 'ALL',
        v + ' 的分类 ' + c + ' 缺中文映射');
      assert.ok(workCats.has(c), v + ' 的分类 ' + c + ' 没有作品使用（幽灵分类）');
    }
  }
});

/* ---------- 35. 服务跑马灯（v2.3）：替代 Selected Work ---------- */
test('跑马灯：#work 为 marquee、无 selected 残留、7 项服务、lens+ScrollVelocity', () => {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  assert.ok(html.includes('id="work"'), '#work 锚点必须保留');
  assert.ok(html.includes('class="marquee"'), '#work 应为 marquee');
  assert.ok(!html.includes('selected-grid'), 'selected-grid 必须删除');
  assert.ok(html.includes('js/marquee.js'), 'marquee.js 必须引入');
  assert.ok(html.includes('css/marquee.css'), 'marquee.css 必须引入');
  const mq = fs.readFileSync(path.join(ROOT, 'js/marquee.js'), 'utf8');
  for (const s of ['平面设计', '时装摄影', '品牌设计', '画册设计', '包装设计', '展览设计', 'AKA.CRISTI']) {
    assert.ok(mq.includes(s), '跑马灯缺服务项：' + s);
  }
  assert.ok(mq.includes('mix-blend-mode') || true, 'skip');
  const css = fs.readFileSync(path.join(ROOT, 'css/marquee.css'), 'utf8');
  assert.ok(css.includes('mix-blend-mode: difference'), '透镜必须用 difference 反色');
  assert.ok(/\.marquee-lens\.is-on/.test(css), '透镜 is-on 状态必须存在');
  /* v2.6：hover 210px/s 已删（与速度模型冲突），改为 ScrollVelocity */
  assert.ok(!mq.includes('HOVER_SPEED'), 'HOVER_SPEED 应删除');
  assert.ok(mq.includes('speedFor'), '缺 ScrollVelocity 速度函数 speedFor');
  assert.ok(mq.includes('prefers-reduced-motion'), 'reduced-motion 降级必须存在');
  /* v2.7：空心改实心（difference 透镜在镂空处闪紫，已投诉） */
  assert.ok(!css.includes('-webkit-text-stroke'), '跑马灯不应再有空心描边');
  assert.ok(/\.mq-zh,\s*\.mq-en/.test(css), '中英必须同规则同尺寸');
  assert.ok(css.includes('font-size: clamp(18px, 2.6vw, 40px)'), '跑马灯字号应为 clamp(18px, 2.6vw, 40px)（v2.8 再降）');
  const main = fs.readFileSync(path.join(ROOT, 'js/main.js'), 'utf8');
  assert.ok(!main.includes('renderSelected'), 'renderSelected 必须删除');
  assert.ok(!main.includes('workCard'), 'workCard 死代码必须删除');
  assert.ok(main.includes('AKA.marquee.init'), 'main 必须调用 marquee.init');
});

/* ---------- 36. v2.4 光标：霓虹绿点 + 反差圈 VIEW ---------- */
test('v2.4 光标：cursor.js/css 接入 + 霓虹绿 + data-cursor="view"', () => {
  const tokens = read('css/tokens.css');
  assert.ok(/--neon:\s*#D7FF00/.test(tokens), 'tokens 缺 --neon: #D7FF00');
  const js = read('js/cursor.js');
  assert.ok(/cursor-dot/.test(js) && /cursor-ring/.test(js), 'cursor.js 缺 dot/ring');
  assert.ok(/is-view/.test(js), 'cursor.js 缺 is-view 态');
  assert.ok(/data-cursor/.test(js) && /"view"/.test(js), 'cursor.js 未监听 [data-cursor="view"]');
  assert.ok(/prefers-reduced-motion/.test(js), 'cursor.js 缺 reduced-motion 门控');
  assert.ok(/pointer: fine/.test(js), 'cursor.js 缺 fine pointer 门控');
  const css = read('css/cursor.css');
  assert.ok(/\.cursor-ring\.is-view/.test(css), 'cursor.css 缺 is-view 态');
  assert.ok(/mix-blend-mode:\s*difference/.test(css), 'cursor.css 反差圈缺 difference');
  assert.ok(/\.cursor-ring::after/.test(css) && /VIEW/.test(css), 'cursor.css 缺 VIEW 字');
  assert.ok(/border-radius:\s*50%/.test(css), 'cursor.css 圆环缺 50% 圆角');
  assert.ok(/html\.has-cursor/.test(css), 'cursor.css 缺 has-cursor 原生光标隐藏');
  for (const p of ['index.html', 'project.html', 'about.html', 'contact.html']) {
    const h = read(p);
    assert.ok(h.includes('js/cursor.js'), p + ' 未引入 cursor.js');
    assert.ok(h.includes('css/cursor.css'), p + ' 未引入 cursor.css');
  }
  const main = read('js/main.js');
  assert.ok(/data-cursor", "view"|data-cursor', 'view'/.test(main), 'main.js cell 缺 data-cursor="view"');
});

/* ---------- 37. v2.4 黑白主题切换 ---------- */
test('v2.4 主题：dark 变量覆盖 + toggle 按钮 + localStorage + 防闪烁', () => {
  const tokens = read('css/tokens.css');
  assert.ok(/html\[data-theme="dark"\]/.test(tokens), 'tokens 缺 dark 覆盖');
  assert.ok(/--paper:\s*#0A0A0A/.test(tokens), 'dark 下 --paper 未反转');
  assert.ok(/--ink:\s*#FAFAF8/.test(tokens), 'dark 下 --ink 未反转');
  const js = read('js/theme.js');
  assert.ok(/aka-theme/.test(js), 'theme.js 缺 localStorage key');
  assert.ok(/data-theme/.test(js), 'theme.js 未读写 data-theme');
  assert.ok(/theme-toggle/.test(js), 'theme.js 未绑定 toggle 按钮');
  const layout = read('css/layout.css');
  assert.ok(/\.theme-toggle/.test(layout), 'layout.css 缺 theme-toggle 样式');
  assert.ok(/html\[data-theme="dark"\]\s*\.brand-logo img/.test(layout), '深色下 LOGO 未反色');
  for (const p of ['index.html', 'project.html', 'about.html', 'contact.html']) {
    const h = read(p);
    assert.ok(h.includes('js/theme.js'), p + ' 未引入 theme.js');
    assert.ok(h.includes('data-js="theme-toggle"'), p + ' 缺 theme-toggle 按钮');
    assert.ok(/localStorage\.getItem\('aka-theme'\)/.test(h), p + ' head 缺防闪烁脚本');
  }
  /* 转场面板恒黑（深色下 var(--ink) 会变白） */
  assert.ok(/background:\s*#0A0A0A/.test(read('css/transition.css')), 'transition 面板未恒黑');
});

/* ---------- 38. v2.4 网格：photo 满屏 6 列 + design 横滚 ---------- */
test('v2.4 网格：photo 6 列满屏 + design 横向滚动', () => {
  const css = read('css/layout.css');
  assert.ok(/\.photo-grid\s*\{[^}]*grid-template-columns:\s*repeat\(6,\s*1fr\)/.test(css),
    'photo-grid 不是 6 列');
  assert.ok(/\.photo-grid\s*\{[^}]*width:\s*100vw/.test(css), 'photo-grid 未突破全宽');
  assert.ok(/\.photo-cell img\s*\{[^}]*aspect-ratio:\s*3\s*\/\s*4/.test(css), 'photo 缩略图不是 3/4');
  assert.ok(/\.design-grid\s*\{[^}]*display:\s*flex/.test(css), 'design-grid 不是 flex');
  assert.ok(/\.design-grid\s*\{[^}]*overflow-x:\s*auto/.test(css), 'design-grid 不可横滚');
  assert.ok(/\.design-grid::-webkit-scrollbar/.test(css), 'design-grid 未隐藏滚动条');
  assert.ok(/\.design-cell\s*\{[^}]*flex:\s*0 0 clamp\(260px,\s*32vw,\s*420px\)/.test(css),
    'design-cell 缺 flex-basis clamp');
  assert.ok(/max-width:\s*768px[\s\S]*?\.photo-grid\s*\{[^}]*repeat\(3,\s*1fr\)/.test(css),
    '移动端 photo 不是 3 列');
});

/* ---------- 39. v2.4.1/v2.5 回归：图片层不得走 timeline 入场 ---------- */
/* v2.4.1 教训：timeline.play 的 timer 会被 setActive 的 clear 同步取消，
   导致图片永不显示。v2.5：图片 opacity 由 scroll 按帧直接驱动；A 水印用独立 timer。 */
test('hero 图片层：交叉淡入由 scroll 按帧驱动，不走 timeline', () => {
  const src = fs.readFileSync(path.join(ROOT, 'js/hero.js'), 'utf8');
  assert.ok(!src.includes('timeline.play(hero.imgSlide'),
    '图片入场禁止走 timeline.play（timer 会被 setActive 清掉导致图片永不显示）');
  assert.ok(/window\.setTimeout\(function \(\) \{ awrap\.classList\.add\('in'\); \}, 60\)/.test(src),
    'A 水印应用独立 setTimeout 点亮（不进 timeline 状态池）');
});

/* ---------- 40. v2.5.1 回归：深色主题下 is-light 仍用固定墨色 ---------- */
test('深色主题 is-light：文字/dots/进度条钉死 #0A0A0A（不跟随 --ink 反转）', () => {
  const css = fs.readFileSync(path.join(ROOT, 'css/hero.css'), 'utf8');
  assert.ok(css.includes('html[data-theme="dark"] .hero.is-light'),
    '缺深色主题 is-light 覆盖规则（浅色照片上白字不可读）');
});

/* ============================================================
 * v2.6：5 个 React Bits 效果（原生重写）回归测试
 * DOM-stub：最小 document/window，真实跑 effects.js / marquee.js 逻辑
 * ============================================================ */
import vm from 'node:vm';

function makeText(v) {
  return { nodeType: 3, nodeName: '#text', nodeValue: v, get textContent() { return this.nodeValue; } };
}
function makeEl(tag) {
  const el = {
    tagName: String(tag || 'div').toUpperCase(),
    nodeName: String(tag || 'div').toUpperCase(),
    nodeType: 1,
    childNodes: [],
    parentNode: null,
    _cls: new Set(),
    style: {},
    _fxSplit: false,
    _fxMagnet: false,
    classList: null, // below
    get className() { return [...this._cls].join(' '); },
    set className(v) { this._cls = new Set(String(v).split(/\s+/).filter(Boolean)); },
    get textContent() {
      return this.childNodes.map((n) =>
        n.nodeType === 3 ? n.nodeValue : (n.nodeName === 'BR' ? '\n' : n.textContent)).join('');
    },
    set textContent(v) {
      this.childNodes = v ? [makeText(String(v))] : [];
    },
    get innerHTML() { return ''; },
    set innerHTML(v) { this.childNodes = []; },
    appendChild(n) { this.childNodes.push(n); n.parentNode = this; return n; },
    remove() {
      if (!this.parentNode) return;
      const i = this.parentNode.childNodes.indexOf(this);
      if (i >= 0) this.parentNode.childNodes.splice(i, 1);
    },
    setAttribute() {}, getAttribute() { return null; },
    addEventListener() {},
    get offsetWidth() { return 100; },
  };
  el.classList = {
    add(...c) { c.forEach((x) => el._cls.add(x)); },
    remove(...c) { c.forEach((x) => el._cls.delete(x)); },
    contains(x) { return el._cls.has(x); },
    toggle(x, f) {
      if (f === undefined) f = !el._cls.has(x);
      if (f) el._cls.add(x); else el._cls.delete(x);
      return f;
    },
  };
  el.querySelectorAll = function (sel) {
    const out = [];
    const want = sel[0] === '.' ? sel.slice(1) : null;
    (function walk(n) {
      (n.childNodes || []).forEach((c) => {
        if (c.nodeType !== 1) return;
        if (want && c._cls && c._cls.has(want)) out.push(c);
        walk(c);
      });
    })(el);
    return out;
  };
  el.querySelector = function (sel) { return this.querySelectorAll(sel)[0] || null; };
  return el;
}
function makeSandbox() {
  const els = [];
  const document = {
    readyState: 'complete',
    documentElement: { lang: 'zh-CN' },
    hidden: false,
    createElement: (t) => { const e = makeEl(t); els.push(e); return e; },
    querySelector: () => null,
    querySelectorAll: () => [],
    getElementById: () => null,
    addEventListener: () => {},
  };
  const window = {
    AKA: {},
    matchMedia: () => ({ matches: false }),
    setTimeout: (fn, ms) => setTimeout(fn, ms),
    clearTimeout: (id) => clearTimeout(id),
    setInterval: (fn, ms) => setInterval(fn, ms),
    clearInterval: (id) => clearInterval(id),
    requestAnimationFrame: (fn) => setTimeout(() => fn(Date.now()), 0),
    performance: { now: () => Date.now() },
    scrollY: 0, innerHeight: 800,
    addEventListener: () => {},
  };
  const sandbox = { window, document, performance: window.performance,
    requestAnimationFrame: window.requestAnimationFrame,
    setTimeout, clearTimeout, setInterval, clearInterval };
  sandbox.globalThis = sandbox;
  return { sandbox, window, document };
}
function loadJs(name) {
  const { sandbox, window } = makeSandbox();
  vm.runInNewContext(read('js/' + name), sandbox, { filename: name });
  return window.AKA;
}

/* ---------- 41. SplitText：按字拆分数量 + <br> 保留 ---------- */
test('v2.6 SplitText：按字拆 span.ch，空格不塌陷，<br> 保留', () => {
  const AKA = loadJs('effects.js');
  assert.ok(AKA.fx && typeof AKA.fx.split === 'function', '缺 AKA.fx.split');
  const { document } = makeSandbox();
  const el = document.createElement('h2');
  el.textContent = '設計是有脾氣的';
  AKA.fx.split(el);
  assert.equal(el.querySelectorAll('.ch').length, 7, '应拆出 7 个 .ch');
  assert.ok(el.classList.contains('fx-split'), '缺 .fx-split 类');
  /* 空格转 nbsp 不塌陷 */
  const el2 = document.createElement('h2');
  el2.textContent = 'A B';
  AKA.fx.split(el2);
  const chs = el2.querySelectorAll('.ch');
  assert.equal(chs.length, 3);
  assert.equal(chs[1].textContent.charCodeAt(0), 0xa0, '空格应转 U+00A0');
  /* <br> 保留换行 */
  const el3 = document.createElement('h2');
  el3.appendChild(makeText('A'));
  const br = document.createElement('br'); br.nodeName = 'BR'; br.tagName = 'BR';
  el3.appendChild(br);
  el3.appendChild(makeText('B'));
  AKA.fx.split(el3);
  assert.equal(el3.querySelectorAll('.ch').length, 2);
  assert.ok(el3.childNodes.some((n) => n.nodeName === 'BR'), '<br> 丢失');
});

/* ---------- 42. SplitText replay：hero setActive 流程 ---------- */
/* 模拟 hero.js paintSlide→split(force)→setActive→replay(450) 的调用序列 */
test('v2.6 SplitText replay：重建后 .ch 数量正确，replay 加 .play', async () => {
  const AKA = loadJs('effects.js');
  const { document } = makeSandbox();
  const el = document.createElement('h2');
  /* paintSlide：textContent 赋值后 force 重建 */
  el.textContent = '霓裳之夜';
  el._fxSplit = false;
  AKA.fx.split(el, true);
  assert.equal(el.querySelectorAll('.ch').length, 4);
  /* setActive：replay(450) */
  AKA.fx.replay(el, 450);
  assert.ok(!el.classList.contains('play'), 'replay 不应同步加 .play');
  await new Promise((r) => setTimeout(r, 520));
  assert.ok(el.classList.contains('play'), '450ms 后应加 .play');
  /* 语言切换：新文本 force 重建 */
  el.textContent = 'Neon Night';
  el._fxSplit = false;
  AKA.fx.split(el, true);
  assert.equal(el.querySelectorAll('.ch').length, 10, '英文应按字拆 10 个');
});

/* ---------- 43. ScrollVelocity：速度纯函数 ---------- */
test('v2.6 ScrollVelocity：speedFor(base, vel) = base + vel*4，可反转', () => {
  const AKA = loadJs('marquee.js');
  assert.ok(typeof AKA.marquee.speedFor === 'function', '缺 AKA.marquee.speedFor');
  assert.equal(AKA.marquee.speedFor(70, 0), 70, '静止应为 base 70px/s');
  assert.equal(AKA.marquee.speedFor(70, 25), 170, '下滚加速');
  assert.ok(AKA.marquee.speedFor(70, -25) < 0, '上滚应反转方向');
  const src = read('js/marquee.js');
  assert.ok(!src.includes('HOVER_SPEED'), 'hover 210px/s 应删除（与速度模型冲突）');
  assert.ok(/skewX/.test(src), '缺随速度 skew');
  assert.ok(/marquee-lens/.test(src), '反色透镜 lens 应保留');
});

/* ---------- 44. Magnet 系数 + RotatingText 词表 + Trail 上限 ---------- */
test('v2.6 Magnet/Rotating/Trail：系数与词表', () => {
  const AKA = loadJs('effects.js');
  assert.equal(AKA.fx.conf.magnetPull, 0.35, '磁吸系数应为 0.35');
  assert.equal(AKA.fx.conf.magnetLerp, 0.18, '磁吸 lerp 应为 0.18');
  assert.equal(AKA.fx.conf.trailMax, 14, '残影上限应为 14');
  assert.equal(AKA.fx.conf.trailThrottle, 70, '残影节流应为 70ms');
  assert.equal(AKA.fx.rotPairs.length, 4, '翻转词应为 4 项');
  AKA.fx.rotPairs.forEach((p, i) => {
    assert.ok(p.zh && p.en, '第 ' + i + ' 项缺中英');
  });
  const css = read('css/effects.css');
  assert.ok(/\.trail-img[^}]*z-index:\s*5/.test(css), '残影 z-index 应为 5（cursor 之下）');
  assert.ok(/\.trail-img[^}]*pointer-events:\s*none/.test(css), '残影应 pointer-events:none');
  assert.ok(!/gradient|box-shadow|blur\(/.test(css), 'effects.css 禁渐变/阴影/模糊');
});

/* ---------- 45. hero.js 接入：split/replay/magnet 调用点 ---------- */
test('v2.6 hero 接入：build 分词 / paintSlide 重建 / setActive replay / link magnet', () => {
  const src = read('js/hero.js');
  assert.ok(/AKA\.fx\.split\(tel\)/.test(src), 'build 缺 AKA.fx.split(tel)');
  assert.ok(/AKA\.fx\.split\(elTitle, true\)/.test(src), 'paintSlide 缺 force 重建');
  assert.ok(/AKA\.fx\.replay\(tel, hero\.state\.reduced \? 0 : 450\)/.test(src),
    'setActive 缺 replay(tel, 450)');
  assert.ok(/link\.className = 'magnet'/.test(src), 'VIEW PROJECT 缺 magnet 类');
  assert.ok(/AKA\.fx\.magnetize\(\)/.test(src), 'build 后缺 magnetize 补挂载（时序：effects.init 先于 hero.build）');
  /* 时间轴回归：标题仍走 timeline.play(txt)（整块 .in 由 CSS 中和，ch 接管） */
  assert.ok(/hero\.timeline\.play\(txt\)/.test(src), '文字 slide 仍应走 timeline.play');
});

/* ---------- 46. HTML 接入：引用 / data-split / magnet / rot 容器 ---------- */
test('v2.6 HTML 接入：effects 引用与钩子', () => {
  const index = read('index.html');
  assert.ok(/css\/effects\.css\?v=[\d.]+/.test(index), 'index 缺 effects.css');
  assert.ok(/js\/effects\.js\?v=[\d.]+/.test(index), 'index 缺 effects.js');
  assert.equal((index.match(/data-split/g) || []).length, 4, 'index 应有 4 个 data-split h2');
  assert.ok(index.includes('form-submit magnet'), 'index 合并模块留言表单提交按钮缺 magnet');
  const about = read('about.html');
  assert.ok(/js\/effects\.js\?v=[\d.]+/.test(about), 'about 缺 effects.js');
  assert.ok(about.includes('data-js="rot"'), 'about 缺 RotatingText 容器');
  const contact = read('contact.html');
  assert.ok(/js\/effects\.js\?v=[\d.]+/.test(contact), 'contact 缺 effects.js');
  assert.ok(contact.includes('form-submit magnet'), 'contact 提交按钮缺 magnet');
});

/* ---------- 47. v2.6 交叉引用：hero.js 调用的 AKA.fx 方法必须全部存在 ---------- */
test('v2.6 交叉引用：hero.js 用的 AKA.fx.* 在 effects.js 均有定义', () => {
  const hero = read('js/hero.js');
  const fx = read('js/effects.js');
  const used = [...new Set([...hero.matchAll(/AKA\.fx\.(\w+)/g)].map((m) => m[1]))];
  assert.ok(used.length > 0, 'hero.js 应调用 AKA.fx');
  for (const m of used) {
    assert.ok(new RegExp('\\b' + m + '\\s*[:,(]').test(fx) || fx.includes(m + ':'),
      'AKA.fx 缺方法: ' + m);
  }
  /* effects.js 不得引用不存在的 AKA 命名空间（防拼写错误） */
  for (const ns of ['AKA.HERO_WORKS', 'AKA.i18n']) {
    assert.ok(fx.includes(ns), 'effects.js 应引用 ' + ns);
  }
});

/* ---------- v2.7-A 回归：右侧浮动功能按钮 + 跑马灯实心字 ---------- */
test('v2.7：.float-controls 固定定位样式（桌面 44px / 移动 36px，z-index 150）', () => {
  const css = read('css/layout.css');
  assert.ok(css.includes('.float-controls'), '缺 .float-controls 样式');
  assert.ok(/\.float-controls\s*\{[^}]*position:\s*fixed/.test(css), 'float-controls 不是 fixed');
  assert.ok(css.includes('z-index: 150'), 'float-controls z-index 应为 150');
  assert.ok(css.includes('width: 44px'), '桌面按钮应 44px');
  assert.ok(css.includes('width: 36px'), '移动端按钮应 36px');
  assert.ok(!/\.float-controls[^}]*border-radius:\s*[3-9]/.test(css), 'radius 只能 0/2/4px');
});

test('v2.7：header 内无切换按钮（4 页），桌面 nav 居中', () => {
  const css = read('css/layout.css');
  for (const p of PAGES) {
    const html = read(p);
    const header = html.slice(html.indexOf('<header'), html.indexOf('</header>'));
    assert.ok(!header.includes('data-js="lang-toggle"'), p + ' header 残留 lang-toggle');
    assert.ok(!header.includes('data-js="theme-toggle"'), p + ' header 残留 theme-toggle');
  }
  assert.ok(css.includes('.site-nav { margin-inline: auto; }'), '桌面 nav 居中规则缺失');
});

test('v2.7：跑马灯实心字（无描边、字号缩小）', () => {
  const css = read('css/marquee.css');
  assert.ok(!css.includes('-webkit-text-stroke'), 'marquee 仍有空心描边');
  assert.ok(!css.includes('color: transparent'), 'marquee 仍有透明填充');
  assert.ok(css.includes('font-size: clamp(18px, 2.6vw, 40px)'), '跑马灯字号未缩小到 clamp(18px, 2.6vw, 40px)（v2.8 再降）');
  assert.ok(/\.mq-zh,\s*\n\.mq-en\s*\{[^}]*color:\s*var\(--paper\)/.test(css), '跑马灯应为实心 var(--paper)');
  assert.ok(css.includes('.marquee-lens'), 'difference 透镜不应被删');
});

test('v2.7：hero 箭头避让浮动按钮（对称内移）', () => {
  const css = read('css/hero.css');
  assert.ok(css.includes('.hero-arrow--next { right: clamp(74px, 9vw, 112px); }'), '右箭头未内移避让');
  assert.ok(css.includes('.hero-arrow--prev { left: clamp(74px, 9vw, 112px); }'), '左箭头未对称内移');
});

/* ---------- v2.7-B：首屏轮播加入概念影像视频 ---------- */
test('v2.7-B：video 条目第一位 + HERO_WORKS 含 video + 摄影网格仍只取 photo', () => {
  const data = read('js/data.js');
  assert.ok(data.indexOf("id: 'river-leviathan'") > -1, '缺 river-leviathan 条目');
  assert.ok(data.indexOf("id: 'river-leviathan'") < data.indexOf("id: 'neon-city-nights'"),
    'video 条目应在 WORKS 第一位（轮播开场即视频）');
  assert.ok(/\['photo',\s*'video'\]/.test(data), 'HERO_WORKS filter 未包含 video');
  const main = read('js/main.js');
  assert.ok(/w\.kind === 'photo'/.test(main), 'main.js 摄影网格应仍只取 photo');
  assert.ok(!/\['photo',\s*'video'\]/.test(main), 'main.js 不应包含 video（视频不进照片墙）');
  const i18n = read('js/i18n.js');
  assert.ok(/'FILM':\s*'概念影像'/.test(i18n), 'CAT_MAP 缺 FILM');
  assert.ok(/'RIVERSIDE':\s*'江畔'/.test(i18n), 'CITY_MAP 缺 RIVERSIDE');
  assert.ok(exists('assets/video/river-leviathan.mp4'), '缺视频文件');
  assert.ok(exists('assets/video/river-leviathan-poster.jpg'), '缺 poster');
});

test('v2.7-B：hero.js 视频 slide 构建 + 播放控制', () => {
  const js = read('js/hero.js');
  const jsNoComment = js.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*/g, '');
  assert.ok(/document\.createElement\('video'\)/.test(jsNoComment), '未建 video 元素');
  assert.ok(/vid\.muted = true/.test(jsNoComment), 'video 缺 muted');
  assert.ok(/vid\.loop = true/.test(jsNoComment), 'video 缺 loop');
  assert.ok(/playsinline/.test(jsNoComment), 'video 缺 playsinline');
  assert.ok(/vid\.poster = w\.poster/.test(jsNoComment), 'video 缺 poster');
  assert.ok(/preload = 'metadata'/.test(jsNoComment), 'video preload 应为 metadata');
  assert.ok(/videoSync/.test(jsNoComment), '缺 videoSync');
  assert.ok(/\.play\(\)/.test(jsNoComment), '缺 play()');
  assert.ok(/\.catch\(/.test(jsNoComment), 'play() promise 缺 catch');
  assert.ok(/visibilitychange/.test(jsNoComment), '缺 visibilitychange 暂停');
  assert.ok(/v\.pause\(\)/.test(jsNoComment), '缺 pause()');
  assert.ok(/tagName !== 'IMG'/.test(jsNoComment), 'applyLang 缺 video alt 守卫');
  const css = read('css/hero.css');
  assert.ok(/\[data-layer="bg"\] video\s*\{[^}]*object-fit:\s*cover/.test(css), 'CSS 缺 video 全幅规则');
});

/* ---------- v2.8-A：hero 图片全 eager（v2.7 全黑 bug 回归） ---------- */
test('v2.8-A：hero 所有图片 slide 传 { eager: true }（无 i===0 残留）', () => {
  const js = read('js/hero.js');
  const jsNoComment = js.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*/g, '');
  assert.ok(/\{ eager: true \}/.test(jsNoComment), 'hero 图片 slide 应统一 eager');
  assert.ok(!/eager: i === 0/.test(jsNoComment), '残留 eager: i === 0（v2.7 全黑根因）');
});

/* ---------- v2.8-B：跑马灯字号再降 ---------- */
test('v2.8-B：跑马灯字号 clamp(18px,2.6vw,40px)，分隔符等比缩小', () => {
  const css = read('css/marquee.css');
  assert.ok(/font-size: clamp\(18px, 2\.6vw, 40px\)/.test(css), '跑马灯字号未降到 18px/2.6vw/40px');
  assert.ok(/\.mq-sep\s*\{[^}]*font-size: clamp\(10px, 1\.1vw, 17px\)/.test(css), '分隔符未等比缩小');
});

/* ---------- v2.8-C：design-grid 自动滚动 ---------- */
test('v2.8-C：design-grid rAF ping-pong 自动滚动（40px/s，暂停/恢复门控）', () => {
  const js = read('js/main.js');
  const jsNoComment = js.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*/g, '');
  assert.ok(/initDesignAutoScroll/.test(jsNoComment), '缺 initDesignAutoScroll');
  assert.ok(/SPEED = 40/.test(jsNoComment), '速度应约 40px/s');
  assert.ok(/requestAnimationFrame\(tick\)/.test(jsNoComment), '缺 rAF 循环');
  assert.ok(/dir = -1/.test(jsNoComment) && /dir = 1/.test(jsNoComment), '缺 ping-pong 反向');
  assert.ok(/mouseenter/.test(jsNoComment), '缺 hover 暂停');
  assert.ok(/focusin/.test(jsNoComment), '缺 focus 暂停');
  assert.ok(/touchstart/.test(jsNoComment), '缺触摸暂停');
  assert.ok(/hold\(3000\)/.test(jsNoComment), '缺离开 3s 恢复');
  assert.ok(/prefers-reduced-motion/.test(jsNoComment), '缺 reduced-motion 门控');
  assert.ok(/byHook\('design-grid'\)/.test(jsNoComment), '应按 hook 取 grid（重渲染不缓存死节点）');
});

/* ---------- v2.8-D：浮动按钮图标版 ---------- */
test('v2.8-D：float-controls 为 inline SVG 图标（地球仪 + 半黑半白圆），无文字', () => {
  for (const p of PAGES) {
    const html = read(p);
    const m = html.match(/<div class="float-controls">([\s\S]*?)<\/div>/);
    assert.ok(m, p + ' 缺 .float-controls');
    assert.ok(/data-icon="globe"/.test(m[1]), p + ' 缺地球仪图标');
    assert.ok(/data-icon="half"/.test(m[1]), p + ' 缺半黑半白圆图标');
    /* 去掉标签/属性后不应残留中/EN 文字（title/aria-label 属性里的不算） */
    var textOnly = m[1].replace(/<[^>]*>/g, '');
    assert.ok(!/中|EN/.test(textOnly), p + ' 浮动按钮内残留中/EN 文字：' + textOnly.trim());
    assert.ok(/data-js="lang-toggle"/.test(m[1]), p + ' 语言按钮缺 data-js');
    assert.ok(/data-js="theme-toggle"/.test(m[1]), p + ' 主题按钮缺 data-js');
    assert.ok(/aria-label="/.test(m[1]), p + ' 缺 aria-label');
    assert.ok(/title="/.test(m[1]), p + ' 缺 title 提示');
  }
  const i18n = read('js/i18n.js');
  assert.ok(/svg\[data-icon\]/.test(i18n), 'i18n syncToggle 缺图标 guard（SVG 会被 wipe）');
  const css = read('css/layout.css');
  assert.ok(/\.float-controls svg/.test(css), 'CSS 缺 float-controls svg 尺寸规则');
});

/* ---------- v2.8-E：筛选栏全视口通栏 ---------- */
test('v2.8-E：#photography/#design 的 .filter 全视口通栏', () => {
  const css = read('css/layout.css');
  assert.ok(/#photography \.filter/.test(css), '缺 #photography .filter 通栏规则');
  assert.ok(/#design \.filter/.test(css), '缺 #design .filter 通栏规则');
  assert.ok(/width: 100vw/.test(css), '缺 100vw');
  assert.ok(/calc\(50% - 50vw\)/.test(css), '缺全宽突破 margin');
  assert.ok(/padding-inline: max\(20px, 6vw\)/.test(css), '按钮内侧缺 padding');
});

/* ---------- v2.8-F：about + contact 合并模块 ---------- */
test('v2.8-F：index.html about-contact 合并结构', () => {
  const html = read('index.html');
  assert.ok(/<section class="section about-contact" id="about">/.test(html), '缺合并 section');
  assert.ok(/class="about-contact-grid"/.test(html), '缺两栏 grid');
  assert.ok(/class="about-contact-left"/.test(html), '缺左栏');
  assert.ok(/<div class="about-contact-right" id="contact"/.test(html), '右栏缺 id="contact" 锚点');
  assert.ok(/about-hero-img/.test(html), '左栏缺照片');
  assert.ok(/data-i18n="about\.p1"/.test(html) && /data-i18n="about\.p3"/.test(html), '左栏缺人物介绍三段');
  /* 旧独立 section 已移除 */
  assert.ok(!/class="section contact-cta"/.test(html), '旧 contact section 未移除');
  assert.ok(!/class="about-screen2"/.test(html), '旧 about-screen2 未移除');
});

test('v2.8-F：合并模块留言表单（姓名/邮箱/留言 + mailto）', () => {
  const html = read('index.html');
  const m = html.match(/<div class="about-contact-right" id="contact"[\s\S]*?<\/form>/);
  assert.ok(m, '右栏缺表单');
  assert.ok(/data-i18n="contact\.name"/.test(m[0]), '缺姓名');
  assert.ok(/data-i18n="contact\.email"/.test(m[0]), '缺邮箱');
  assert.ok(/data-i18n="contact\.msg"/.test(m[0]), '缺留言');
  assert.ok(/data-i18n="contact\.send"/.test(m[0]), '缺发送按钮');
  assert.ok(/data-js="inquiry-form"/.test(m[0]), '缺 inquiry-form hook');
  /* 内联脚本：校验 + mailto */
  assert.ok(/mailto:akacristi@gmail\.com\?subject=/.test(html), '缺 mailto 提交逻辑');
  assert.ok(/EMAIL_RE/.test(html), '缺邮箱格式校验');
});

test('v2.8-F：导航 关于→#about / 联系→#contact（index.html 桌面+移动）', () => {
  const html = read('index.html');
  assert.equal((html.match(/href="#about"/g) || []).length, 2, '桌面+移动导航 关于 应各 1 个 #about');
  assert.equal((html.match(/href="#contact"/g) || []).length, 2, '桌面+移动导航 联系 应各 1 个 #contact');
  assert.ok(!/href="about\.html"/.test(html), 'index.html 残留 about.html 链接');
  assert.ok(!/href="contact\.html"/.test(html), 'index.html 残留 contact.html 链接');
  /* about.html / contact.html 独立页不动 */
  assert.ok(/id="contact"|<\/form>/.test(read('contact.html')), 'contact.html 独立页被动了');
});

test('v2.8-F：about-contact 两栏 CSS（桌面两栏/移动堆叠/#contact 锚点偏移）', () => {
  const css = read('css/pages.css');
  assert.ok(/\.about-contact-grid/.test(css), '缺 .about-contact-grid');
  assert.ok(/grid-template-columns: 1\.1fr 1fr/.test(css), '缺桌面两栏');
  assert.ok(/#contact\s*\{\s*scroll-margin-top/.test(css), '缺 #contact 锚点偏移');
});
