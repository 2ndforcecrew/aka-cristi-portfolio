/* ============================================================
 * AKA.CRISTI — project.js（project.html 逻辑）
 * 读 ?id= 查 AKA.WORKS；渲染 hero / info / series / description /
 * credits / design-system / next；id 无效时渲染 NOT FOUND。
 * 全部挂 window.AKA；DOM 查询走 data-js 钩子；防御性编码。
 * 不调用 AKA.hero.init()（借用 hero.js 的 aOutlineSVG 即可）。
 * ============================================================ */
(function () {
  'use strict';

  var AKA = (window.AKA = window.AKA || {});

  /* ---------- 小工具（约定同 main.js） ---------- */
  function each(arr, fn) {
    for (var i = 0; i < arr.length; i++) fn(arr[i], i);
  }
  function byHook(name, root) {
    return (root || document).querySelector('[data-js="' + name + '"]');
  }
  function byHookAll(name, root) {
    return (root || document).querySelectorAll('[data-js="' + name + '"]');
  }
  function pad2(n) { return (n < 10 ? '0' : '') + n; }
  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  /* ---------- i18n 小工具 ---------- */
  function I() { return AKA.i18n || null; }
  function T(key) { var i = I(); return (i && i.t) ? i.t(key) : key; }
  function workTitle(w) { var i = I(); return (i && i.lang === 'en') ? w.titleEn : w.title; }
  function workCat(c) { var i = I(); return (i && i.cat) ? i.cat(c) : c; }
  function workCity(l) { var i = I(); return (i && i.city) ? i.city(l) : l; }
  function workDesc(w) {
    var i = I();
    if (i && i.lang === 'en' && w.descEn) return w.descEn;
    return w.description || '';
  }

  function getId() {
    var q = '';
    if (typeof window.URLSearchParams !== 'undefined') {
      try {
        q = new URLSearchParams(window.location.search).get('id') || '';
      } catch (e) { q = ''; }
    } else {
      var m = /(?:^|[?&])id=([^&]*)/.exec(window.location.search || '');
      if (m) q = decodeURIComponent(m[1].replace(/\+/g, ' '));
    }
    return (q || '').trim();
  }

  function findWork(id) {
    var works = Array.isArray(AKA.WORKS) ? AKA.WORKS : [];
    var found = null;
    each(works, function (w) { if (w && w.id === id) found = w; });
    return found;
  }

  /* ---------- hero ---------- */
  function renderHero(w, idx, total) {
    var heroEl = byHook('project-hero');
    var wrap = byHook('project-hero-slides');
    if (!heroEl || !wrap) return;
    if (w.tone === 'light') heroEl.classList.add('is-light');

    var s = el('article', 'hero-slide is-active');
    s.setAttribute('aria-label', pad2(idx + 1) + ' / ' + pad2(total) + ' — ' + workTitle(w));

    /* layer 01：背景（webp 优先，首图 eager） */
    var bgw = el('div', 'hero-bgwrap');
    var bg = el('div', null);
    bg.setAttribute('data-layer', 'bg');
    bg.classList.add('in');
    bg.setAttribute('data-project-bg', '1');
    var pic = (AKA.picture && AKA.picture(w.hero || w.cover,
      'AKA.CRISTI — ' + workTitle(w) + ' — ' + workCat(w.category), { eager: true })) || null;
    if (pic) bg.appendChild(pic);
    bgw.appendChild(bg);
    s.appendChild(bgw);

    /* layer 02：A 标（描边版内联 SVG，几何不变） */
    var ag = el('div', 'hero-agroup');
    var awrap = el('div', null);
    awrap.setAttribute('data-layer', 'a');
    awrap.classList.add('in');
    awrap.setAttribute('aria-hidden', 'true');
    if (AKA.hero && typeof AKA.hero.aOutlineSVG === 'function') {
      awrap.innerHTML = AKA.hero.aOutlineSVG(0);
    }
    ag.appendChild(awrap);
    s.appendChild(ag);

    /* layer 03：顶部 mono 行 */
    var nw = el('div', 'hero-topline');
    var num = el('div', null, 'N°' + pad2(idx + 1) + ' / ' + pad2(total));
    num.setAttribute('data-layer', 'num');
    num.classList.add('in');
    var loc = el('div', null, workCity(w.location || '') + ' — ' + (w.year || ''));
    loc.setAttribute('data-layer', 'loc');
    loc.classList.add('in');
    nw.appendChild(num);
    nw.appendChild(loc);
    s.appendChild(nw);

    /* layer 04–06：文字组 */
    var tg = el('div', 'hero-textgroup');
    var cat = el('div', null, T('proj.kicker') + ' / ' + workCat(w.category || ''));
    cat.setAttribute('data-layer', 'cat');
    cat.classList.add('in');
    var title = el('h1', null, workTitle(w) || '');
    title.setAttribute('data-layer', 'title');
    title.classList.add('in');
    var meta = el('div', null, (w.year || '') + ' — ' + (w.client || '') + ' — ' + workCat(w.category || ''));
    meta.setAttribute('data-layer', 'meta');
    meta.classList.add('in');
    tg.appendChild(cat);
    tg.appendChild(title);
    tg.appendChild(meta);
    s.appendChild(tg);

    wrap.innerHTML = '';
    wrap.appendChild(s);

    /* info 区的 N° 与 hero 同步 */
    var heroNum = byHook('project-hero-num');
    if (heroNum) heroNum.textContent = 'N°' + pad2(idx + 1) + ' / ' + pad2(total);
  }

  /* ---------- 滚动视差：rAF 节流，图 translateY 轻微上移（禁 blur） ---------- */
  function initParallax() {
    var heroEl = byHook('project-hero');
    var img = document.querySelector('[data-project-bg] img');
    if (!heroEl || !img) return;
    var reduced = window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;
    var ticking = false;
    function frame() {
      ticking = false;
      var sy = window.scrollY || window.pageYOffset || 0;
      var r = heroEl.getBoundingClientRect();
      /* hero 完全滚出视口时复位 */
      if (r.bottom <= 0) {
        img.style.transform = '';
        return;
      }
      var off = Math.min(120, sy * 0.12);
      img.style.transform = 'translateY(' + off.toFixed(2) + 'px)';
    }
    window.addEventListener('scroll', function () {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(frame);
      }
    }, { passive: true });
  }

  /* ---------- information 表 ---------- */
  function renderInfo(w) {
    var dl = byHook('project-info');
    if (!dl) return;
    var rows = [
      [T('proj.year'), w.year || '—', false],
      [T('proj.client'), w.client || '—', true],
      [T('proj.loc'), workCity(w.location) || '—', true],
      [T('proj.cat'), workCat(w.category) || '—', true],
      [T('proj.credits'), w.credits || '—', true]
    ];
    var frag = document.createDocumentFragment();
    each(rows, function (r) {
      var row = el('div', 'project-info-row');
      row.appendChild(el('dt', null, r[0]));
      row.appendChild(el('dd', r[2] ? 'en' : null, r[1]));
      frag.appendChild(row);
    });
    dl.innerHTML = '';
    dl.appendChild(frag);
  }

  /* ---------- image series ---------- */
  function renderSeries(w) {
    var box = byHook('project-series');
    if (!box) return;
    var gallery = Array.isArray(w.gallery) && w.gallery.length ? w.gallery : [w.cover || w.hero];
    var frag = document.createDocumentFragment();
    each(gallery, function (src, i) {
      if (!src) return;
      var item = el('figure', 'series-item');
      /* 全幅断点：gallery[1] 存在则它全幅，否则 gallery[0] */
      var isBleed = (gallery.length > 1 && i === 1) || (gallery.length === 1 && i === 0);
      if (isBleed) item.classList.add('full-bleed');
      item.setAttribute('data-js', 'reveal');
      var alt = 'AKA.CRISTI — ' + workTitle(w) + ' — ' + (i + 1) + ' / ' + gallery.length;
      var pic = (AKA.picture && AKA.picture(src, alt)) || null;
      if (pic) item.appendChild(pic);
      item.appendChild(el('figcaption', 'series-cap', workCat(w.category) + ' — ' + pad2(i + 1) + ' / ' + pad2(gallery.length)));
      frag.appendChild(item);
    });
    box.innerHTML = '';
    box.appendChild(frag);
  }

  /* ---------- description / credits ---------- */
  function renderDesc(w) {
    var box = byHook('project-desc');
    if (!box) return;
    box.innerHTML = '';
    var p = el('p', null, workDesc(w));
    box.appendChild(p);
  }
  function renderCredits(w) {
    var box = byHook('project-credits');
    if (box) box.textContent = w.credits || '';
  }

  /* ---------- design system（仅 design） ---------- */
  var DS_SWATCHES = [
    ['ink', '#0A0A0A'], ['paper', '#FAFAF8'],
    ['gray-900', '#1A1A1A'], ['gray-700', '#3A3A3A'],
    ['gray-500', '#8A8A8A'], ['gray-300', '#D9D9D9'],
    ['gray-100', '#EFEFEB']
  ];
  var DS_TYPES = [
    ['archivo', 'Aa — Archivo Semibold'],
    ['inter', 'Aa — Inter Regular'],
    ['mono', 'Aa — JetBrains Mono Medium']
  ];
  function renderDesignSystem(w) {
    var sec = byHook('project-ds-section');
    if (!sec) return;
    if (w.kind !== 'design') {
      sec.setAttribute('hidden', '');
      return;
    }
    sec.removeAttribute('hidden');
    var sw = byHook('project-ds-swatches');
    if (sw) {
      var sf = document.createDocumentFragment();
      each(DS_SWATCHES, function (pair) {
        var box = el('div', 'ds-swatch');
        var chip = el('div', 'ds-chip');
        chip.style.background = pair[1];
        box.appendChild(chip);
        box.appendChild(el('span', 'ds-hex', pair[1]));
        sf.appendChild(box);
      });
      sw.innerHTML = '';
      sw.appendChild(sf);
    }
    var ty = byHook('project-ds-type');
    if (ty) {
      var tf = document.createDocumentFragment();
      each(DS_TYPES, function (pair) {
        var row = el('div', 'ds-type-row');
        row.appendChild(el('p', 'ds-sample ' + pair[0], pair[1]));
        row.appendChild(el('p', 'ds-name', pair[1]));
        tf.appendChild(row);
      });
      ty.innerHTML = '';
      ty.appendChild(tf);
    }
  }

  /* ---------- next project ---------- */
  function renderNext(w, idx) {
    var box = byHook('project-next');
    if (!box) return;
    var works = Array.isArray(AKA.WORKS) ? AKA.WORKS : [];
    if (!works.length) { box.innerHTML = ''; return; }
    var next = works[(idx + 1) % works.length];
    if (!next) { box.innerHTML = ''; return; }
    var nextIdx = (idx + 1) % works.length;
    var a = el('a', 'next-card');
    a.href = 'project.html?id=' + next.id;
    a.appendChild(el('span', 'next-card-num', T('proj.nextPrefix') + 'N°' + pad2(nextIdx + 1)));
    var mid = el('div', null);
    mid.appendChild(el('h3', 'next-card-title', workTitle(next) || ''));
    mid.appendChild(el('p', 'next-card-cat', workCat(next.category) || ''));
    a.appendChild(mid);
    a.appendChild(el('span', 'next-card-arrow', '→'));
    box.innerHTML = '';
    box.appendChild(a);
  }

  /* ---------- not found ---------- */
  function renderNotFound() {
    var content = byHook('project-content');
    var nf = byHook('project-notfound');
    if (content) content.setAttribute('hidden', '');
    if (nf) nf.removeAttribute('hidden');
    document.title = T('proj.nfDoc');
  }

  /* ---------- 本页 reveal（main.js 已处理静态节点；
     此处补观察 project.js 动态插入的 [data-js="reveal"]） ---------- */
  function initReveal() {
    var els = byHookAll('reveal');
    if (!els.length) return;
    if (!('IntersectionObserver' in window)) {
      each(els, function (e) { e.classList.add('in'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      each(entries, function (en) {
        if (en.isIntersecting) {
          en.target.classList.add('in');
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.12 });
    each(els, function (e) {
      if (!e.classList.contains('in')) io.observe(e);
    });
  }

  /* ---------- 启动（render 可重入：语言切换时按当前 id 重渲染） ---------- */
  var currentId = null;
  var parallaxBound = false;
  function render(id) {
    var works = Array.isArray(AKA.WORKS) ? AKA.WORKS : [];
    var w = id ? findWork(id) : null;
    if (!w) {
      renderNotFound();
      initReveal();
      return;
    }
    var idx = 0;
    each(works, function (x, i) { if (x === w) idx = i; });
    document.title = workTitle(w) + ' — AKA.CRISTI';
    /* not-found 可能留下的 hidden 状态要清掉（语言切换重渲染时） */
    var content = byHook('project-content');
    if (content) content.removeAttribute('hidden');
    var nf = byHook('project-notfound');
    if (nf) nf.setAttribute('hidden', '');
    renderHero(w, idx, works.length);
    renderInfo(w);
    renderSeries(w);
    renderDesc(w);
    renderCredits(w);
    renderDesignSystem(w);
    renderNext(w, idx);
    initReveal();
    if (!parallaxBound) {
      initParallax();
      parallaxBound = true;
    }
  }
  function init() {
    currentId = getId();
    render(currentId);
  }

  /* i18n 订阅：语言切换时重渲染当前作品 */
  if (AKA.i18n && AKA.i18n.onChange) {
    AKA.i18n.onChange.push(function () {
      if (currentId !== null) render(currentId);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
