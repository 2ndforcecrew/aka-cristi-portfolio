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

/* ---------- 1. 文件存在 ---------- */
test('文件存在：index.html / css 5 个 / js 3 个 / svg / md', () => {
  assert.ok(exists('index.html'));
  assert.deepEqual(cssFiles().sort(), ['base.css', 'hero.css', 'layout.css', 'motion.css', 'tokens.css']);
  assert.deepEqual(jsFiles().sort(), ['data.js', 'hero.js', 'main.js']);
  assert.ok(exists('assets/a-symbol.svg'));
  assert.ok(exists('assets/favicon.svg'));
  assert.ok(exists('DESIGN.md'));
  assert.ok(exists('README.md'));
});

/* ---------- 2. 零外部 URL ---------- */
test('零外部 URL：html/css/js 无 http(s)://，无 Google Fonts', () => {
  const files = ['index.html', ...cssFiles().map((f) => 'css/' + f), ...jsFiles().map((f) => 'js/' + f)];
  for (const f of files) {
    const src = read(f);
    assert.ok(!/https?:\/\//.test(src), f + ' 含外部 URL');
    assert.ok(!/fonts\.googleapis|fonts\.gstatic/.test(src), f + ' 含 Google Fonts');
  }
});

/* ---------- 3. ?v= 缓存 ---------- */
test('?v= 缓存：css/js 引用全带查询串且版本一致', () => {
  const html = read('index.html');
  const refs = [...html.matchAll(/<(?:link|script)[^>]+(?:href|src)="([^"]+)"/g)].map((m) => m[1]);
  const local = refs.filter((r) => /^(css|js)\//.test(r));
  assert.ok(local.length >= 8, 'css/js 引用数异常：' + local.length);
  const versions = new Set();
  for (const r of local) {
    const m = r.match(/\?v=([\d.]+)$/);
    assert.ok(m, r + ' 缺 ?v=');
    versions.add(m[1]);
  }
  assert.equal(versions.size, 1, '版本号不一致：' + [...versions].join(','));
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
  const all = cssFiles().map((f) => read('css/' + f)).join('\n');
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

/* ---------- 11. design.md lint ---------- */
test('design.md lint：0 错误 0 警告', () => {
  const out = execSync('design.md lint DESIGN.md', { cwd: ROOT, encoding: 'utf8' });
  const m = out.match(/"errors":\s*(\d+)[\s\S]*"warnings":\s*(\d+)/);
  assert.ok(m, 'lint 输出解析失败');
  assert.equal(m[1], '0', 'lint errors=' + m[1]);
  assert.equal(m[2], '0', 'lint warnings=' + m[2]);
});
