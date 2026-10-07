/* ============================================================
 * AKA.CRISTI — main.js
 * 渲染 selected / photography / design grids、分类切换、
 * 移动菜单、reveal、页脚年份；调用 AKA.hero.init()。
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
    return 'AKA.CRISTI — ' + w.titleEn + ' — ' + w.category;
  }

  /* ---------- 卡片 ---------- */
  function workCard(w, i) {
    var card = document.createElement('article');
    card.className = 'work-card';
    card.setAttribute('data-id', w.id);

    var num = document.createElement('span');
    num.className = 'work-card-num';
    num.textContent = 'N°' + pad2(i + 1);

    var imgw = document.createElement('div');
    imgw.className = 'work-card-img';
    var img = document.createElement('img');
    img.src = w.cover;
    img.alt = altFor(w);
    img.loading = 'lazy';
    img.decoding = 'async';
    imgw.appendChild(img);

    var meta = document.createElement('div');
    meta.className = 'work-card-meta';
    var cat = document.createElement('p');
    cat.className = 'work-card-cat';
    cat.textContent = w.category;
    var title = document.createElement('h3');
    title.className = 'work-card-title';
    title.textContent = w.titleEn;
    var year = document.createElement('p');
    year.className = 'work-card-year';
    year.textContent = w.year;
    meta.appendChild(cat);
    meta.appendChild(title);
    meta.appendChild(year);

    card.appendChild(num);
    card.appendChild(imgw);
    card.appendChild(meta);
    return card;
  }

  function photoCell(w, i) {
    var cell = document.createElement('article');
    cell.className = 'photo-cell';
    cell.setAttribute('data-id', w.id);
    var img = document.createElement('img');
    img.src = w.cover;
    img.alt = altFor(w);
    img.loading = 'lazy';
    img.decoding = 'async';
    var meta = document.createElement('div');
    meta.className = 'work-card-meta';
    var cat = document.createElement('p');
    cat.className = 'work-card-cat';
    cat.textContent = w.category;
    var title = document.createElement('h3');
    title.className = 'work-card-title';
    title.textContent = w.titleEn;
    meta.appendChild(cat);
    meta.appendChild(title);
    cell.appendChild(img);
    cell.appendChild(meta);
    return cell;
  }

  function designCell(w) {
    var cell = document.createElement('article');
    cell.className = 'design-cell';
    cell.setAttribute('data-id', w.id);
    var imgw = document.createElement('div');
    imgw.className = 'design-imgwrap';
    var img = document.createElement('img');
    img.src = w.cover;
    img.alt = altFor(w);
    img.loading = 'lazy';
    img.decoding = 'async';
    imgw.appendChild(img);
    var meta = document.createElement('div');
    meta.className = 'work-card-meta';
    var cat = document.createElement('p');
    cat.className = 'work-card-cat';
    cat.textContent = w.category;
    var title = document.createElement('h3');
    title.className = 'work-card-title';
    title.textContent = w.titleEn;
    meta.appendChild(cat);
    meta.appendChild(title);
    cell.appendChild(imgw);
    cell.appendChild(meta);
    return cell;
  }

  /* ---------- 渲染 ---------- */
  function renderSelected() {
    var grid = byHook('selected-grid');
    if (!grid || !AKA.WORKS) return;
    var picks = ['neon-city-nights', 'dreamweaver', 'street-brand-identity', 'editorial-covers'];
    var frag = document.createDocumentFragment();
    each(picks, function (id, i) {
      var w = null;
      each(AKA.WORKS, function (x) { if (x.id === id) w = x; });
      if (w) frag.appendChild(workCard(w, i));
    });
    grid.innerHTML = '';
    grid.appendChild(frag);
  }

  function renderPhotoGrid(cat) {
    var grid = byHook('photo-grid');
    if (!grid || !AKA.WORKS) return;
    var frag = document.createDocumentFragment();
    var i = 0;
    each(AKA.WORKS, function (w) {
      if (w.kind !== 'photo') return;
      if (cat && cat !== 'ALL' && w.category !== cat) return; /* display:none 语义：重渲染，不残留 */
      frag.appendChild(photoCell(w, i++));
    });
    grid.innerHTML = '';
    grid.appendChild(frag);
  }

  function renderDesignGrid(cat) {
    var grid = byHook('design-grid');
    if (!grid || !AKA.WORKS) return;
    var frag = document.createDocumentFragment();
    each(AKA.WORKS, function (w) {
      if (w.kind !== 'design') return;
      if (cat && cat !== 'ALL' && w.category !== cat) return;
      frag.appendChild(designCell(w));
    });
    grid.innerHTML = '';
    grid.appendChild(frag);
  }

  /* ---------- 分类切换（§22：非 fade，直接切换） ---------- */
  function initFilter(hook, cats, render) {
    var bar = byHook(hook);
    if (!bar) return;
    var frag = document.createDocumentFragment();
    each(cats, function (c, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.textContent = c;
      b.setAttribute('data-cat', c);
      if (i === 0) b.classList.add('is-active');
      b.addEventListener('click', function () {
        each(bar.querySelectorAll('button'), function (x) {
          x.classList.remove('is-active');
        });
        b.classList.add('is-active');
        render(c); /* 直接重渲染，无残留 */
      });
      frag.appendChild(b);
    });
    bar.innerHTML = '';
    bar.appendChild(frag);
    render('ALL');
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

  /* ---------- 启动 ---------- */
  function init() {
    renderSelected();
    initFilter('photo-filter', ['ALL'].concat(AKA.PHOTO_CATS || []), renderPhotoGrid);
    initFilter('design-filter', ['ALL'].concat(AKA.DESIGN_CATS || []), renderDesignGrid);
    initMenu();
    initReveal();
    initYear();
    if (AKA.hero && typeof AKA.hero.init === 'function') AKA.hero.init();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
