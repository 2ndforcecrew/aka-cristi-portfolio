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
test('文件存在：4 页面 / css 6 个 / js 5 个 / svg / md / webp / wp-migration', () => {
  for (const p of PAGES) assert.ok(exists(p), '缺页面 ' + p);
  assert.deepEqual(cssFiles().sort(),
    ['base.css', 'hero.css', 'layout.css', 'motion.css', 'pages.css', 'tokens.css', 'transition.css']);
  assert.deepEqual(jsFiles().sort(),
    ['data.js', 'hero.js', 'main.js', 'project.js', 'transition.js']);
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

test('v1.1 mask 转场无 fade 回归：clip-path inset 进场，无 fade 关键帧', () => {
  const heroCss = read('css/hero.css');
  assert.ok(heroCss.includes('inset(0 0 0 100%)'), '缺 mask 进场 inset(0 0 0 100%)');
  assert.ok(!/@keyframes\s+[\w-]*fade/i.test(heroCss), 'hero 含 fade 关键帧（§14 禁止）');
  assert.ok(heroCss.includes('@keyframes hero-progress'), '缺 2px 进度条 hero-progress');
  assert.ok(heroCss.includes('6.5s linear'), '进度条未与 6.5s 轮播同步');
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

test('v1.1 双网格：design 12 列 span7/5/4 + 长宽比穿插；photo 4/5', () => {
  const css = read('css/layout.css');
  assert.ok(css.includes('repeat(12, 1fr)'), 'design 缺 12 列');
  assert.ok(css.includes('.span7') && css.includes('.span5') && css.includes('.span4'), '缺 span 分配');
  assert.ok(css.includes('ratio-45') && css.includes('ratio-1610') && css.includes('ratio-34'), '缺长宽比穿插');
  assert.ok(!/(^|[{;])\s*columns\s*:\s*\d/.test(css), 'design 仍用 CSS columns masonry');
  assert.ok(read('js/main.js').includes('DESIGN_PAT'), 'main.js 缺 DESIGN_PAT 分配表');
});

test('v1.1 编号体系：sec-index / archive 条目 / 微标签', () => {
  const html = read('index.html');
  assert.ok(html.includes('01 / 06') && html.includes('06 / 06'), '缺 01/06–06/06 编号');
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

test('v1.2 浅色 slide：tone=light 的 slide 前景转 ink（主题挂 section.hero）', () => {
  const data = read('js/data.js');
  assert.ok(/tone:\s*'light'/.test(data), 'data.js 缺少 tone=light');
  const heroJs = read('js/hero.js');
  assert.ok(/tone:\s*{/.test(heroJs) && /hero\.tone\.sync/.test(heroJs),
    'hero.js 缺少 tone.sync（主题须挂 section.hero，dots/scroll 是兄弟元素）');
  const css = read('css/hero.css');
  for (const sel of [
    '.hero.is-light .hero-textgroup',
    '.hero.is-light .hero-topline',
    '.hero.is-light [data-layer="a"]',
    '.hero.is-light [data-layer="meta"]',
    '.hero.is-light .scroll-indicator',
    '.hero.is-light .hero-dots button.is-active',
    '.hero.is-light .hero-progress i',
  ]) {
    assert.ok(css.includes(sel), 'hero.css 缺少 ' + sel);
  }
  /* 回归：旧的 .hero-slide.is-light 后代选择器套不上兄弟元素，不许残留 */
  assert.ok(!/\.hero-slide\.is-light\s+\.(hero-dots|scroll-indicator)/.test(css),
    'hero.css 残留套不上的 .hero-slide.is-light 兄弟选择器');
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
    'page-wipe-a', '1600', 'invert']) {
    assert.ok(js.includes(s) || read('css/transition.css').includes(s), '转场缺 ' + s);
  }
  assert.ok(js.includes('invert(1)') || read('css/transition.css').includes('invert(1)'),
    'A 标闪现未用 invert(1) 反色');
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
