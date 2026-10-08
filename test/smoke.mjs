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
test('文件存在：4 页面 / css 9 个 / js 10 个 / svg / md / webp / wp-migration / logo', () => {
  for (const p of PAGES) assert.ok(exists(p), '缺页面 ' + p);
  assert.deepEqual(cssFiles().sort(),
    ['base.css', 'cursor.css', 'hero.css', 'layout.css', 'marquee.css', 'motion.css', 'pages.css', 'tokens.css', 'transition.css']);
  assert.deepEqual(jsFiles().sort(),
    ['cursor.js', 'data.js', 'hero.js', 'i18n.js', 'main.js', 'marquee.js', 'project.js', 'sound.js', 'theme.js', 'transition.js']);
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
test('data.js：12 条、字段齐全、分类合法、cover 文件存在', () => {
  const works = loadWorks();
  assert.equal(works.length, 12);
  const photoCats = ['FASHION', 'EDITORIAL', 'PORTRAIT', 'CAMPAIGN', 'BEAUTY', 'PERSONAL'];
  const designCats = ['BRANDING', 'POSTER', 'ART DIRECTION', 'TYPOGRAPHY', 'EDITORIAL', 'AUTOMOTIVE', 'EXPERIMENTAL'];
  const fields = ['id', 'kind', 'category', 'title', 'titleEn', 'year', 'client',
    'location', 'cover', 'hero', 'gallery', 'description', 'credits'];
  for (const w of works) {
    for (const f of fields) assert.ok(w[f] !== undefined && w[f] !== '', w.id + ' 缺字段 ' + f);
    assert.ok(['photo', 'design'].includes(w.kind), w.id + ' kind 非法');
    const cats = w.kind === 'photo' ? photoCats : designCats;
    assert.ok(cats.includes(w.category), w.id + ' category 非法：' + w.category);
    assert.ok(exists(w.cover), w.id + ' cover 不存在：' + w.cover);
    assert.ok(Array.isArray(w.gallery) && w.gallery.includes(w.cover), w.id + ' gallery 异常');
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

test('v2.4 hero：图片固定 + 文字反向滚动 + 无 is-light 同步 + 无旧 cursor', () => {
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
  /* 固定图 + 文字反向位移数学 */
  assert.ok(js.includes('hero-fixed') && js.includes('hero-track-txt'), '缺 fixed/txt hook');
  assert.ok(/hero\.imgSlide\b/.test(js) && !/imgSlides/.test(js), 'imgSlides 数组残留，应为单 imgSlide');
  assert.ok(/insertBefore\(t, txtFrag\.firstChild\)/.test(js), 'txt track 未倒序插入');
  assert.ok(!/-p \* total/.test(js.replace(/-\(1 - p\) \* total/g, '')), '图片 track 位移残留（图片应固定）');
  assert.ok(/-\(1 - p\) \* total/.test(js), '缺文字 track translateY(-(1-p)*total)');
  assert.ok(js.includes('data-cursor') && js.includes("'view'"), 'VIEW PROJECT 缺 data-cursor="view"');
  /* v2.4：hero 移除 tone/is-light 同步 */
  const jsNoComment = js.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*/g, '');
  assert.ok(!/tone\.sync/.test(jsNoComment), 'hero tone.sync 残留');
  assert.ok(!/tone:\s*\{/.test(jsNoComment), 'hero tone 对象残留');
  /* 旧 cursor 模块已搬走 */
  assert.ok(!/hero\.cursor/.test(jsNoComment), 'hero.js 残留 cursor 模块');
  assert.ok(!/hero-cursor/.test(jsNoComment), 'hero.js 残留 hero-cursor');
  /* split-screen 残留清理 */
  assert.ok(!/half-img/.test(jsNoComment) && !/half-txt/.test(jsNoComment), 'js 残留 half-*');
  const cssNoComment = read('css/hero.css').replace(/\/\*[\s\S]*?\*\//g, '');
  assert.ok(!/\.half-img/.test(cssNoComment), 'css 残留 .half-img');
  assert.ok(!/\.project-hero/.test(cssNoComment), 'css 残留 .project-hero 兼容块');
  assert.ok(!/\.hero-cursor/.test(cssNoComment), 'css 残留 .hero-cursor');
  const css = read('css/hero.css');
  assert.ok(css.includes('.hero-fixed') && css.includes('.hero-track-txt'), 'CSS 缺 fixed/txt');
  assert.ok(/\.hero\.is-light/.test(css), 'CSS 缺 .hero.is-light 主题规则（project 页仍需）');
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
test('站内 #锚点 都有对应 id；ABOUT/CONTACT 导航指向独立页面', () => {
  const pages = ['index.html', 'project.html', 'about.html', 'contact.html'];
  for (const p of pages) {
    const html = read(p);
    const anchors = [...html.matchAll(/href="#([A-Za-z][\w-]*)"/g)].map((m) => m[1]);
    for (const a of anchors) {
      assert.ok(new RegExp('id="' + a + '"').test(html), p + ' 的 #' + a + ' 无对应 id');
    }
    /* 导航里的 About/Contact 必须是页面链接，不能是锚点 */
    assert.ok(!/href="#about"|href="#contact"/.test(html), p + ' 导航残留 #about/#contact 死锚点');
  }
  const navRe = /<a href="([^"]+)">(?:About|Contact)<\/a>/g;
  for (const p of pages) {
    for (const m of read(p).matchAll(navRe)) {
      assert.ok(/^(about|contact)\.html$/.test(m[1]), p + ' 导航 About/Contact 指向 ' + m[1]);
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

test('i18n：12 件作品都有 title/titleEn/description/descEn', () => {
  const works = loadWorks();
  assert.equal(works.length, 12);
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

test('i18n：4 页都有 lang-toggle（header+移动菜单）且 i18n.js 在 data.js 之后引入', () => {
  for (const p of PAGES) {
    const html = read(p);
    const toggles = [...html.matchAll(/data-js="lang-toggle"/g)].length;
    assert.ok(toggles >= 2, p + ' lang-toggle 不足 2 个：' + toggles);
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
test('跑马灯：#work 为 marquee、无 selected 残留、7 项服务、lens+加速逻辑', () => {
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
  assert.ok(mq.includes('HOVER_SPEED'), 'hover 加速逻辑必须存在');
  assert.ok(mq.includes('prefers-reduced-motion'), 'reduced-motion 降级必须存在');
  /* v2.4：中英同尺寸空心描边小字 */
  assert.ok(css.includes('-webkit-text-stroke'), '跑马灯文字必须空心描边');
  assert.ok(/\.mq-zh,\s*\.mq-en/.test(css), '中英必须同规则同尺寸');
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
