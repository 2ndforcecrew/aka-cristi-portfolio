/* ============================================================
 * AKA.CRISTI — effects.js（v2.6：React Bits 原生重写，零依赖）
 * SplitText（逐字 stagger）+ Magnet（磁吸）+ RotatingText（翻转词）
 * + ImageTrail（照片残影）。全部防御性：钩子缺失静默跳过。
 * spec 禁区：无渐变/发光/阴影/3D/bounce/pill；radius 只 0/2/4px。
 * ============================================================ */
(function () {
  'use strict';

  var AKA = (window.AKA = window.AKA || {});

  var reduced = !!(window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  var finePointer = !!(window.matchMedia &&
    window.matchMedia('(hover: hover) and (pointer: fine)').matches);

  /* 可测试常量（smoke 用） */
  var conf = {
    splitDelay: 45,      /* ms，每字 stagger */
    magnetPull: 0.35,    /* 磁吸系数 */
    magnetLerp: 0.18,    /* 磁吸 lerp */
    trailMax: 14,        /* 残影上限 */
    trailThrottle: 70,   /* ms，残影节流 */
    trailLife: 900,      /* ms，残影存活 */
    rotInterval: 2400,   /* ms，翻转词间隔 */
    rotOut: 420          /* ms，翻转词退出时长 */
  };

  function each(arr, fn) {
    for (var i = 0; i < arr.length; i++) fn(arr[i], i);
  }

  /* ============ 1. SplitText：按字拆 span.ch ============ */
  /* 保留 <br> 换行；空格转 \u00a0 防塌陷；force=true 强制重建（语言切换后） */
  function split(el, force) {
    if (!el) return el;
    if (el._fxSplit && !force) return el;
    /* 拍平旧结构：取文本，<br> 记为 \n */
    var parts = [];
    each(Array.prototype.slice.call(el.childNodes), function (n) {
      if (n.nodeType === 3) parts.push(n.nodeValue);
      else if (n.nodeName === 'BR') parts.push('\n');
      else parts.push(n.textContent);
    });
    var text = parts.join('');
    el.innerHTML = '';
    el.classList.add('fx-split');
    var i = 0;
    each(text.split(''), function (c) {
      if (c === '\n') { el.appendChild(document.createElement('br')); return; }
      var s = document.createElement('span');
      s.className = 'ch';
      s.textContent = (c === ' ') ? ' ' : c;
      if (!reduced) s.style.transitionDelay = (i * conf.splitDelay) + 'ms';
      el.appendChild(s);
      i++;
    });
    el._fxSplit = true;
    return el;
  }

  /* replay：重播 stagger（delayMs 与 hero 图层节奏对齐用） */
  function replay(el, delayMs) {
    if (!el || !el._fxSplit) return;
    el.classList.remove('play');
    if (reduced) { el.classList.add('play'); return; }
    void el.offsetWidth; /* 强制回流 */
    if (delayMs) {
      window.setTimeout(function () { el.classList.add('play'); }, delayMs);
    } else {
      requestAnimationFrame(function () { el.classList.add('play'); });
    }
  }

  /* section 标题 [data-split]：进入视口播一次；语言切换后重建 */
  function splitSections() {
    var els = document.querySelectorAll('[data-split]');
    if (!els.length) return;
    function onChange() {
      each(els, function (el) {
        split(el, true);
        /* 已在视口内则直接播（语言切换时） */
        var r = el.getBoundingClientRect();
        if (r.top < window.innerHeight && r.bottom > 0) replay(el, 0);
      });
    }
    if ('IntersectionObserver' in window && !reduced) {
      var io = new IntersectionObserver(function (entries) {
        each(entries, function (en) {
          if (en.isIntersecting) {
            split(en.target);
            replay(en.target, 0);
            io.unobserve(en.target);
          }
        });
      }, { threshold: 0.3 });
      each(els, function (el) { split(el); io.observe(el); });
    } else {
      each(els, function (el) { split(el); replay(el, 0); });
    }
    if (AKA.i18n && AKA.i18n.onChange) AKA.i18n.onChange.push(onChange);
  }

  /* ============ 3. Magnet：磁吸 ============ */
  function magnetize() {
    if (!finePointer || reduced) return;
    each(document.querySelectorAll('.magnet'), function (btn) {
      if (btn._fxMagnet) return;
      btn._fxMagnet = true;
      var tx = 0, ty = 0, cx = 0, cy = 0, raf = 0;
      function tick() {
        cx += (tx - cx) * conf.magnetLerp;
        cy += (ty - cy) * conf.magnetLerp;
        if (Math.abs(tx - cx) < 0.1 && Math.abs(ty - cy) < 0.1) {
          btn.style.transform = '';
          raf = 0;
          return;
        }
        btn.style.transform = 'translate(' + cx.toFixed(1) + 'px,' + cy.toFixed(1) + 'px)';
        raf = requestAnimationFrame(tick);
      }
      function kick() { if (!raf) raf = requestAnimationFrame(tick); }
      btn.addEventListener('mousemove', function (e) {
        var r = btn.getBoundingClientRect();
        tx = (e.clientX - (r.left + r.width / 2)) * conf.magnetPull;
        ty = (e.clientY - (r.top + r.height / 2)) * conf.magnetPull;
        kick();
      });
      btn.addEventListener('mouseleave', function () {
        tx = 0; ty = 0;
        kick();
      });
    });
  }

  /* ============ 4. RotatingText：about 宣言区翻转词 ============ */
  var ROT_PAIRS = [
    { zh: '平面設計師', en: 'Graphic Designer' },
    { zh: '時裝攝影師', en: 'Fashion Photographer' },
    { zh: '品牌設計師', en: 'Brand Designer' },
    { zh: '展覽設計師', en: 'Exhibition Designer' }
  ];

  function rotInit() {
    var host = document.querySelector('[data-js="rot"]');
    if (!host) return;
    var idx = 0, timer = 0;
    function lang() {
      return document.documentElement.lang === 'en' ? 'en' : 'zh';
    }
    function render() {
      var l = lang();
      host.innerHTML = '';
      var pre = document.createElement('span');
      pre.className = 'rot-pre';
      pre.textContent = l === 'en' ? "I'm a " : '我是';
      var w = document.createElement('span');
      w.className = 'rot-word';
      var rw = document.createElement('span');
      rw.className = 'rw';
      rw.textContent = ROT_PAIRS[idx][l];
      w.appendChild(rw);
      host.appendChild(pre);
      host.appendChild(w);
    }
    function next() {
      idx = (idx + 1) % ROT_PAIRS.length;
      var rw = host.querySelector('.rw');
      if (!rw || reduced) { render(); return; }
      rw.classList.add('out');
      window.setTimeout(function () {
        render();
        var nrw = host.querySelector('.rw');
        if (!nrw) return;
        nrw.classList.add('in');
        requestAnimationFrame(function () {
          requestAnimationFrame(function () { nrw.classList.remove('in'); });
        });
      }, conf.rotOut);
    }
    function stop() { if (timer) { clearInterval(timer); timer = 0; } }
    function start() {
      stop();
      if (!reduced) {
        timer = window.setInterval(function () {
          if (!document.hidden) next();
        }, conf.rotInterval);
      }
    }
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) stop(); else start();
    });
    if (AKA.i18n && AKA.i18n.onChange) {
      AKA.i18n.onChange.push(function () { idx = 0; render(); });
    }
    render();
    start();
  }

  /* ============ 5. ImageTrail：摄影区照片残影 ============ */
  function trailInit() {
    if (!finePointer || reduced) return;
    var sec = document.getElementById('photography');
    if (!sec) return;
    var works = Array.isArray(AKA.HERO_WORKS) ? AKA.HERO_WORKS : [];
    if (!works.length) return;
    /* 本地 webp（data.js 里是 .jpg，全部有 .webp 对应，smoke 已覆盖） */
    var urls = works.map(function (w) {
      return String(w.hero || w.cover || '').replace(/\.jpg$/, '.webp');
    }).filter(Boolean);
    if (!urls.length) return;
    var i = 0, last = 0;
    sec.addEventListener('mousemove', function (e) {
      var now = performance.now();
      if (now - last < conf.trailThrottle) return;
      last = now;
      var r = sec.getBoundingClientRect();
      var img = document.createElement('img');
      img.className = 'trail-img';
      img.src = urls[i % urls.length];
      i++;
      img.alt = '';
      img.setAttribute('aria-hidden', 'true');
      img.style.left = (e.clientX - r.left - 75) + 'px';
      img.style.top = (e.clientY - r.top - 100) + 'px';
      img.style.transform = 'rotate(' + ((Math.random() * 16) - 8).toFixed(1) + 'deg)';
      sec.appendChild(img);
      var t0 = 0;
      function fade(ts) {
        if (!t0) t0 = ts;
        var p = (ts - t0) / conf.trailLife;
        if (p >= 1) { img.remove(); return; }
        img.style.opacity = String(p < 0.15 ? p / 0.15 : 1 - (p - 0.15) / 0.85);
        img.style.marginTop = (-p * 46) + 'px';
        requestAnimationFrame(fade);
      }
      requestAnimationFrame(fade);
      var all = sec.querySelectorAll('.trail-img');
      while (all.length > conf.trailMax) {
        all[0].remove();
        all = sec.querySelectorAll('.trail-img');
      }
    });
  }

  /* ============ 对外 API（hero.js 用） ============ */
  AKA.fx = {
    split: split,
    replay: replay,
    magnetize: magnetize,
    conf: conf,
    rotPairs: ROT_PAIRS
  };

  /* ============ 启动 ============ */
  /* 注意：main.js 的 DOMContentLoaded init 先注册先执行（effects.js 在 main.js
     之前引入），hero/marquee 初始化完成后这里再挂载 section 标题与磁吸 */
  function init() {
    splitSections();
    magnetize();
    rotInit();
    trailInit();
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
