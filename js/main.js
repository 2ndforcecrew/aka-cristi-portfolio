/* ============================================================
 * AKA.CRISTI — main.js
 * 渲染 photography / design grids、分类切换、
 * 移动菜单、reveal、页脚年份；调用 AKA.hero.init()、AKA.marquee.init()。
 * 全部挂 window.AKA；DOM 查询走 data-js 钩子；防御性编码。
 * ============================================================ */
(function () {
  'use strict';

  var AKA = (window.AKA = window.AKA || {});

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

  function altFor(w) {
    return 'AKA.CRISTI — ' + workTitle(w) + ' — ' + workCat(w.category);
  }

  /* ---------- i18n 小工具（AKA.i18n 缺失时退回英文原文） ---------- */
  function workTitle(w) {
    return (AKA.i18n && AKA.i18n.lang === 'en') ? w.titleEn : w.title;
  }
  function workCat(c) {
    return (AKA.i18n && AKA.i18n.cat) ? AKA.i18n.cat(c) : c;
  }
  function T(key) {
    return (AKA.i18n && AKA.i18n.t) ? AKA.i18n.t(key) : key;
  }

  /* ---------- 卡片（Phase 2：整卡即链接 → project.html?id=） ---------- */
  function photoCell(w, n) {
    var cell = document.createElement('a');
    cell.className = 'photo-cell';
    cell.href = 'project.html?id=' + encodeURIComponent(w.id);
    cell.setAttribute('data-id', w.id);
    cell.setAttribute('data-cursor', 'view');
    cell.appendChild(AKA.picture(w.cover, altFor(w)));
    /* §10 P3：archive 条目 = 分类 / 序号 + 年份（10px mono 微标签） */
    var meta = document.createElement('div');
    meta.className = 'photo-meta';
    var idx = document.createElement('p');
    idx.className = 'micro';
    /* archive 条目格式：w.category + ' / ' + pad2(n)（分类经 i18n 映射，smoke 校验格式） */
    idx.textContent = workCat(w.category) + ' / ' + pad2(n);
    var title = document.createElement('h3');
    title.className = 'work-card-title';
    title.textContent = workTitle(w);
    var year = document.createElement('p');
    year.className = 'micro';
    year.textContent = w.year;
    meta.appendChild(idx);
    meta.appendChild(title);
    meta.appendChild(year);
    cell.appendChild(meta);
    return cell;
  }

  /* §10 P4：design 12 列不对称分配（行对齐：7+5 / 4+4+4） */
  var DESIGN_PAT = [
    ['span7', 'ratio-45'], ['span5', 'ratio-1610'],
    ['span4', 'ratio-34'], ['span4', 'ratio-45'], ['span4', 'ratio-1610'],
    ['span7', 'ratio-34']
  ];

  function designCell(w, i) {
    var cell = document.createElement('a');
    var pat = DESIGN_PAT[i % DESIGN_PAT.length];
    cell.className = 'design-cell ' + pat[0] + ' ' + pat[1];
    cell.href = 'project.html?id=' + encodeURIComponent(w.id);
    cell.setAttribute('data-id', w.id);
    cell.setAttribute('data-cursor', 'view');
    var imgw = document.createElement('div');
    imgw.className = 'design-imgwrap';
    imgw.appendChild(AKA.picture(w.cover, altFor(w)));
    var meta = document.createElement('div');
    meta.className = 'work-card-meta';
    var cat = document.createElement('p');
    cat.className = 'work-card-cat';
    cat.textContent = workCat(w.category);
    var title = document.createElement('h3');
    title.className = 'work-card-title';
    title.textContent = workTitle(w);
    meta.appendChild(cat);
    meta.appendChild(title);
    cell.appendChild(imgw);
    cell.appendChild(meta);
    return cell;
  }

  /* ---------- 渲染 ---------- */
  function renderPhotoGrid(cat) {
    var grid = byHook('photo-grid');
    if (!grid || !AKA.WORKS) return;
    var frag = document.createDocumentFragment();
    var n = 0; /* 全局 archive 序号（过滤不改变编号） */
    each(AKA.WORKS, function (w) {
      if (w.kind !== 'photo') return;
      n++;
      if (cat && cat !== 'ALL' && w.category !== cat) return; /* display:none 语义：重渲染，不残留 */
      frag.appendChild(photoCell(w, n));
    });
    grid.innerHTML = '';
    grid.appendChild(frag);
  }

  function renderDesignGrid(cat) {
    var grid = byHook('design-grid');
    if (!grid || !AKA.WORKS) return;
    var frag = document.createDocumentFragment();
    var i = 0;
    each(AKA.WORKS, function (w) {
      if (w.kind !== 'design') return;
      if (cat && cat !== 'ALL' && w.category !== cat) return;
      frag.appendChild(designCell(w, i++));
    });
    grid.innerHTML = '';
    grid.appendChild(frag);
  }

  /* ---------- 分类切换（§22：非 fade，直接切换；语言切换时保持选中态） ---------- */
  var filterState = { photo: 'ALL', design: 'ALL' };
  function initFilter(hook, cats, render, key) {
    var bar = byHook(hook);
    if (!bar) return;
    var active = filterState[key] || 'ALL';
    var frag = document.createDocumentFragment();
    each(cats, function (c) {
      var b = document.createElement('button');
      b.type = 'button';
      b.textContent = (c === 'ALL') ? T('filter.all') : workCat(c);
      b.setAttribute('data-cat', c);
      if (c === active) b.classList.add('is-active');
      b.addEventListener('click', function () {
        each(bar.querySelectorAll('button'), function (x) {
          x.classList.remove('is-active');
        });
        b.classList.add('is-active');
        filterState[key] = c;
        render(c); /* 直接重渲染，无残留 */
      });
      frag.appendChild(b);
    });
    bar.innerHTML = '';
    bar.appendChild(frag);
    render(active);
  }

  /* ---------- 移动菜单 ---------- */
  function initMenu() {
    var menu = byHook('mobile-menu');
    var openBtn = byHook('menu-toggle');
    var closeBtn = byHook('menu-close');
    if (!menu || !openBtn) return;
    function open() {
      menu.classList.add('is-open');
      document.body.style.overflow = 'hidden';
      if (closeBtn) closeBtn.focus();
    }
    function close() {
      menu.classList.remove('is-open');
      document.body.style.overflow = '';
    }
    openBtn.addEventListener('click', open);
    if (closeBtn) closeBtn.addEventListener('click', close);
    each(menu.querySelectorAll('a'), function (a) {
      a.addEventListener('click', close);
    });
    document.addEventListener('keydown', function (ev) {
      if (ev.key === 'Escape' && menu.classList.contains('is-open')) close();
    });
  }

  /* ---------- reveal ---------- */
  function initReveal() {
    var els = byHookAll('reveal');
    if (!els.length || !('IntersectionObserver' in window)) {
      each(els, function (el) { el.classList.add('in'); });
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
    each(els, function (el) { io.observe(el); });
  }

  /* ---------- 年份 ---------- */
  function initYear() {
    var y = byHook('year');
    if (y) y.textContent = String(new Date().getFullYear());
  }

  /* ---------- 馆藏标签（§10 P3：ARCHIVE / 2023—2025 式，由 data.js 计算） ---------- */
  function initArchiveLabels() {
    var works = Array.isArray(AKA.WORKS) ? AKA.WORKS : [];
    var photos = works.filter(function (w) { return w.kind === 'photo'; });
    var years = photos
      .map(function (w) { return parseInt(w.year, 10); })
      .filter(function (y) { return !isNaN(y); });
    var pl = byHook('photo-archive-label');
    if (pl && years.length) {
      pl.textContent = T('sec.archive') + ' / ' + Math.min.apply(null, years) +
        '—' + Math.max.apply(null, years);
    }
    var designs = works.filter(function (w) { return w.kind === 'design'; });
    var dl = byHook('design-archive-label');
    if (dl) {
      dl.textContent = T('sec.archive') + ' / ' + pad2(designs.length) + ' ' + T('sec.projects');
    }
  }

  /* ---------- i18n：语言切换时重渲染全部动态内容 ---------- */
  function renderAll() {
    initFilter('photo-filter', ['ALL'].concat(AKA.PHOTO_CATS || []), renderPhotoGrid, 'photo');
    initFilter('design-filter', ['ALL'].concat(AKA.DESIGN_CATS || []), renderDesignGrid, 'design');
    initArchiveLabels();
  }
  AKA.renderAll = renderAll;
  if (AKA.i18n && AKA.i18n.onChange) {
    AKA.i18n.onChange.push(function () { renderAll(); });
  }

  /* ---------- design-grid 自动左右滚动（v2.8：rAF ping-pong，约 40px/s） ----------
     每帧按 hook 取当前 grid（筛选重渲染不缓存死节点）；hover/focus/触摸/手动滚时暂停，
     离开 3s 恢复；prefers-reduced-motion 不自动滚。手动横滚保留（overflow-x auto）。 */
  function initDesignAutoScroll() {
    var mq = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mq && mq.matches) return;
    var grid0 = byHook('design-grid');
    if (!grid0) return;
    var SPEED = 40, dir = 1, last = 0, paused = false, resumeAt = 0, vis = true;
    function hold(ms) { paused = true; resumeAt = performance.now() + ms; }
    grid0.addEventListener('mouseenter', function () { paused = true; });
    grid0.addEventListener('mouseleave', function () { hold(3000); });
    grid0.addEventListener('focusin', function () { paused = true; });
    grid0.addEventListener('focusout', function () { hold(3000); });
    grid0.addEventListener('touchstart', function () { paused = true; }, { passive: true });
    grid0.addEventListener('touchend', function () { hold(3000); });
    grid0.addEventListener('wheel', function () { hold(3000); }, { passive: true });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) { vis = en[0].isIntersecting; },
        { threshold: 0 }).observe(grid0);
    }
    function tick(ts) {
      requestAnimationFrame(tick);
      if (!last) last = ts;
      var dt = Math.min((ts - last) / 1000, 0.1); last = ts;
      if (paused && ts >= resumeAt) paused = false;
      if (paused || !vis) return;
      var g = byHook('design-grid');
      if (!g) return;
      var max = g.scrollWidth - g.clientWidth;
      if (max <= 2) return;
      var x = g.scrollLeft + dir * SPEED * dt;
      if (x >= max) { x = max; dir = -1; }
      else if (x <= 0) { x = 0; dir = 1; }
      g.scrollLeft = x;
    }
    requestAnimationFrame(tick);
  }

  /* ---------- rogi 表單：本地時間 + 複製郵箱 + 驗證（v2.9.32） ---------- */
  function initRogiForm() {
    /* 本地時間 */
    var timeEl = document.querySelector('[data-js="local-time"]');
    if (timeEl) {
      function tickTime() {
        var d = new Date();
        var p = function (x) { return (x < 10 ? '0' : '') + x; };
        timeEl.textContent = p(d.getHours()) + ':' + p(d.getMinutes()) + ':' + p(d.getSeconds());
      }
      tickTime();
      setInterval(tickTime, 1000);
    }
    /* 複製郵箱 */
    var copyBtn = document.querySelector('[data-js="copy-email"]');
    if (copyBtn) {
      copyBtn.addEventListener('click', function () {
        var email = 'hello@aka-cristi.com';
        if (navigator.clipboard) {
          navigator.clipboard.writeText(email).then(function () {
            copyBtn.textContent = 'COPIED';
            setTimeout(function () { copyBtn.textContent = 'COPY EMAIL'; }, 1500);
          });
        }
      });
    }
    /* 表單驗證 */
    var form = document.querySelector('[data-js="inquiry-form"]');
    if (!form) return;
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var ok = true;
      var rows = form.querySelectorAll('.rogi-row[data-js^="field-"]');
      for (var i = 0; i < rows.length; i++) {
        var input = rows[i].querySelector('input, textarea');
        var valid = input && input.value.trim().length > 0;
        if (input && input.type === 'email') {
          valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value.trim());
        }
        rows[i].classList.toggle('invalid', !valid);
        if (!valid) ok = false;
      }
      if (ok) {
        var btn = form.querySelector('.rogi-submit');
        if (btn) {
          btn.textContent = 'MESSAGE SENT ✓';
          btn.disabled = true;
        }
        form.reset();
      }
    });
  }

  /* ---------- 启动 ---------- */
  function init() {
    renderAll();
    initMenu();
    initReveal();
    initYear();
    initDesignAutoScroll();
    initRogiForm();
    if (AKA.hero && typeof AKA.hero.init === 'function') AKA.hero.init();
    if (AKA.marquee && typeof AKA.marquee.init === 'function') AKA.marquee.init();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
