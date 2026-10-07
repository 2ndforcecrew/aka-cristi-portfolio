/* ============================================================
 * AKA.CRISTI — hero.js（AKA_HOME_HERO，spec §07–§19）
 * JS 只调度、不直接写样式（样式全在 hero.css）。
 * 6 子模块：state / timeline / transition / breath / parallax / nav / a11y。
 * 全部防御性：钩子缺失静默跳过，不抛错。
 * ============================================================ */
(function () {
  'use strict';

  var AKA = (window.AKA = window.AKA || {});

  /* spec §13 timeline 延迟（s） */
  var TL = { bg: 0, num: 0.15, cat: 0.30, title: 0.45, meta: 0.55, a: 0.60 };
  var SLIDE_MS = 6500;          /* §13：6–8s，取 6.5s */
  var BREATH_MS = 6000;         /* §15 */
  var EASE = 'cubic-bezier(0.16,1,0.3,1)'; /* 仅文档用，样式在 CSS */

  function each(arr, fn) {
    for (var i = 0; i < arr.length; i++) fn(arr[i], i);
  }
  function byHook(name, root) {
    return (root || document).querySelector('[data-js="' + name + '"]');
  }
  function pad2(n) { return (n < 10 ? '0' : '') + n; }

  var hero = (AKA.hero = {
    state: { i: 0, n: 0, timers: [], reduced: false, inited: false },
    el: null, slides: [], rafId: 0,
    /* parallax 状态 */
    mx: 0, my: 0, tmx: 0, tmy: 0,
    breathT0: 0,

    /* ============ init ============ */
    init: function () {
      if (hero.state.inited) return;
      hero.state.inited = true;
      var el = (hero.el = byHook('hero'));
      if (!el) return;
      var works = Array.isArray(AKA.HERO_WORKS) ? AKA.HERO_WORKS : [];
      if (!works.length) return;

      hero.state.reduced =
        !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
      hero.state.n = works.length;

      hero.build(works);
      hero.nav.build();
      hero.a11y.bind();
      hero.parallax.bind();

      /* 首张：直接呈现 + 跑 timeline；随后进主循环 */
      var s0 = hero.slides[0];
      if (s0) {
        s0.classList.add('is-active');
        s0.setAttribute('aria-hidden', 'false');
        if (hero.state.reduced) {
          each(s0.querySelectorAll('[data-layer]'), function (l) {
            l.classList.add('in');
          });
        } else {
          hero.timeline.play(s0);
          hero.breath.restart();
        }
      }
      hero.nav.sync();
      if (!hero.state.reduced) hero.auto();
    },

    /* ============ 建 slide DOM ============ */
    build: function (works) {
      var wrap = byHook('hero-slides', hero.el);
      if (!wrap) return;
      var frag = document.createDocumentFragment();
      hero.slides = [];
      each(works, function (w, i) {
        var s = document.createElement('article');
        s.className = 'hero-slide';
        s.setAttribute('data-js', 'hero-slide');
        s.setAttribute('aria-roledescription', 'slide');
        s.setAttribute('aria-label', (i + 1) + ' / ' + works.length + ' — ' + w.titleEn);
        s.setAttribute('aria-hidden', 'true');

        /* layer 01：背景 */
        var bgw = document.createElement('div');
        bgw.className = 'hero-bgwrap';
        bgw.setAttribute('data-px', 'bg');
        var bg = document.createElement('div');
        bg.setAttribute('data-layer', 'bg');
        var img = document.createElement('img');
        img.src = w.hero || w.cover;
        img.alt = 'AKA.CRISTI — ' + w.titleEn + ' — ' + w.category;
        img.decoding = 'async';
        if (i === 0) { img.loading = 'eager'; img.fetchPriority = 'high'; }
        else { img.loading = 'lazy'; }
        img.setAttribute('data-breath', '1');
        bg.appendChild(img);
        bgw.appendChild(bg);
        s.appendChild(bgw);

        /* layer 02：A 标 */
        var ag = document.createElement('div');
        ag.className = 'hero-agroup';
        ag.setAttribute('data-px', 'a');
        var aimg = document.createElement('img');
        aimg.setAttribute('data-layer', 'a');
        aimg.src = 'assets/a-symbol.svg?v=1.0';
        aimg.alt = '';
        aimg.setAttribute('aria-hidden', 'true');
        ag.appendChild(aimg);
        s.appendChild(ag);

        /* layer 03：编号 */
        var nw = document.createElement('div');
        nw.className = 'hero-numwrap';
        nw.setAttribute('data-px', 'text');
        var num = document.createElement('div');
        num.setAttribute('data-layer', 'num');
        num.textContent = 'N°' + pad2(i + 1);
        nw.appendChild(num);
        s.appendChild(nw);

        /* layer 04–06：文字组 */
        var tg = document.createElement('div');
        tg.className = 'hero-textgroup';
        tg.setAttribute('data-px', 'text');
        var cat = document.createElement('div');
        cat.setAttribute('data-layer', 'cat');
        cat.textContent = w.category;
        var title = document.createElement('h2');
        title.setAttribute('data-layer', 'title');
        title.textContent = w.titleEn;
        var meta = document.createElement('div');
        meta.setAttribute('data-layer', 'meta');
        meta.textContent = w.location + ' — ' + w.year + ' — ' + w.category;
        tg.appendChild(cat);
        tg.appendChild(title);
        tg.appendChild(meta);
        s.appendChild(tg);

        frag.appendChild(s);
        hero.slides.push(s);
      });
      wrap.innerHTML = '';
      wrap.appendChild(frag);
    },

    /* ============ timeline（§13） ============ */
    timeline: {
      clear: function () {
        each(hero.state.timers, function (t) { clearTimeout(t); });
        hero.state.timers = [];
        if (hero.state.autoId) {
          clearTimeout(hero.state.autoId);
          hero.state.autoId = 0;
        }
      },
      play: function (slide) {
        hero.timeline.clear();
        var layers = slide.querySelectorAll('[data-layer]');
        each(layers, function (l) { l.classList.remove('in'); });
        /* 强制回流，让 .in 移除生效后再按序加回 */
        void slide.offsetWidth;
        each(layers, function (l) {
          var key = l.getAttribute('data-layer');
          var d = (TL[key] != null ? TL[key] : 0.8) * 1000;
          hero.state.timers.push(setTimeout(function () {
            l.classList.add('in');
          }, d));
        });
      }
    },

    /* ============ transition（§14 editorial mask） ============ */
    transition: {
      to: function (n, instant) {
        var st = hero.state;
        var cur = hero.slides[st.i];
        var nxt = hero.slides[n];
        if (!nxt || nxt === cur) return;
        hero.timeline.clear();
        /* 快速连点：先强制收尾上一轮未完成的转场 */
        each(hero.slides, function (s) {
          if (s !== nxt) {
            s.classList.remove('is-active', 'is-entering', 'is-leaving', 'pre-enter');
            s.setAttribute('aria-hidden', 'true');
          }
        });

        if (instant || st.reduced) {
          /* reduced-motion：静态切换（a11y） */
          if (cur) {
            cur.classList.remove('is-active', 'is-entering', 'is-leaving', 'pre-enter');
            cur.setAttribute('aria-hidden', 'true');
          }
          each(nxt.querySelectorAll('[data-layer]'), function (l) { l.classList.add('in'); });
          nxt.classList.add('is-active');
          nxt.setAttribute('aria-hidden', 'false');
          st.i = n;
          hero.nav.sync();
          return;
        }

        /* 退场：clip 向左收起 + x -20px / 450ms */
        if (cur) {
          cur.classList.add('is-leaving');
          cur.setAttribute('aria-hidden', 'true');
        }
        /* 进场：mask 从右侧展开（RIGHT→LEFT） */
        nxt.classList.add('is-active', 'pre-enter');
        nxt.setAttribute('aria-hidden', 'false');
        void nxt.offsetWidth; /* 回流，确保 pre-enter 生效 */
        nxt.classList.remove('pre-enter');
        nxt.classList.add('is-entering');

        hero.timeline.play(nxt);
        hero.breath.restart();

        st.timers.push(setTimeout(function () {
          if (cur) cur.classList.remove('is-active', 'is-leaving');
          nxt.classList.remove('is-entering');
        }, 950)); /* transitionend 双保险：超时兜底 */
        st.i = n;
        hero.nav.sync();
      }
    },

    /* ============ 主循环 ============ */
    auto: function () {
      if (hero.state.reduced) return;
      if (hero.state.autoId) clearTimeout(hero.state.autoId);
      hero.state.autoId = setTimeout(function () {
        hero.state.autoId = 0;
        if (!document.hidden) {
          hero.transition.to((hero.state.i + 1) % hero.state.n);
        }
        hero.auto();
      }, SLIDE_MS);
    },

    /* ============ breath（§15）：scale 1→1.035 / 6000ms ============ */
    breath: {
      restart: function () { hero.breathT0 = performance.now(); },
      tick: function (now) {
        if (hero.state.reduced) return;
        var slide = hero.slides[hero.state.i];
        if (!slide) return;
        var img = slide.querySelector('[data-breath]');
        if (!img) return;
        var t = ((now - hero.breathT0) % BREATH_MS) / BREATH_MS;
        var e = t * t * (3 - 2 * t); /* smoothstep：弱到感觉不到 */
        var s = 1 + 0.035 * e;
        var x = (-1.5 * e).toFixed(3);
        var y = (0.5 * e).toFixed(3);
        img.style.transform =
          'translate(' + x + '%, ' + y + '%) scale(' + s.toFixed(4) + ')';
      }
    },

    /* ============ parallax（§17） ============ */
    parallax: {
      bind: function () {
        if (hero.state.reduced || !hero.el) return;
        var fine = window.matchMedia && window.matchMedia('(hover: hover)').matches;
        if (fine) {
          /* mouse ±8px；手机（hover:none）关闭 mouse 分支 */
          hero.el.addEventListener('mousemove', function (ev) {
            var r = hero.el.getBoundingClientRect();
            hero.tmx = ((ev.clientX - r.left) / r.width - 0.5) * 2;   /* -1..1 */
            hero.tmy = ((ev.clientY - r.top) / r.height - 0.5) * 2;
          });
          hero.el.addEventListener('mouseleave', function () {
            hero.tmx = 0; hero.tmy = 0;
          });
        }
        /* scroll + breath 共用一个 rAF */
        var raf = function (now) {
          hero.parallax.frame(now);
          hero.breath.tick(now);
          hero.rafId = requestAnimationFrame(raf);
        };
        hero.rafId = requestAnimationFrame(raf);
      },
      frame: function () {
        if (!hero.el || hero.state.reduced) return;
        /* lerp 平滑 mouse */
        hero.mx += (hero.tmx - hero.mx) * 0.08;
        hero.my += (hero.tmy - hero.my) * 0.08;
        /* scroll 进度：A ±20 / 图 ±8 / 文 ±3 */
        var r = hero.el.getBoundingClientRect();
        var vh = window.innerHeight || 1;
        var p = Math.max(0, Math.min(1, -r.top / vh));
        var groups = hero.el.querySelectorAll('[data-px]');
        each(groups, function (g) {
          var k = g.getAttribute('data-px');
          var depth = k === 'a' ? 1 : k === 'bg' ? 0.5 : 0.25;
          var srange = k === 'a' ? 20 : k === 'bg' ? 8 : 3;
          var x = hero.mx * 8 * depth;
          var y = hero.my * 8 * depth + (p - 0.5) * 2 * srange;
          g.style.transform = 'translate(' + x.toFixed(2) + 'px,' + y.toFixed(2) + 'px)';
        });
      }
    },

    /* ============ nav（§18） ============ */
    nav: {
      build: function () {
        var nav = byHook('hero-nav', hero.el);
        if (!nav) return;
        var count = document.createElement('span');
        count.className = 'hero-count';
        count.setAttribute('data-js', 'hero-count');
        var dots = document.createElement('div');
        dots.className = 'hero-dots';
        dots.setAttribute('role', 'tablist');
        dots.setAttribute('aria-label', 'Hero slides');
        for (var i = 0; i < hero.state.n; i++) {
          (function (idx) {
            var b = document.createElement('button');
            b.type = 'button';
            b.textContent = pad2(idx + 1);
            b.setAttribute('role', 'tab');
            b.setAttribute('aria-label', 'Go to slide ' + (idx + 1));
            b.addEventListener('click', function () {
              hero.timeline.clear();
              hero.transition.to(idx);
              hero.auto();
            });
            dots.appendChild(b);
          })(i);
        }
        nav.innerHTML = '';
        nav.appendChild(count);
        nav.appendChild(dots);
        hero.nav.sync();
      },
      sync: function () {
        var nav = byHook('hero-nav', hero.el);
        if (!nav) return;
        var count = nav.querySelector('[data-js="hero-count"]');
        if (count) {
          count.textContent = pad2(hero.state.i + 1) + ' / ' + pad2(hero.state.n);
        }
        var btns = nav.querySelectorAll('.hero-dots button');
        each(btns, function (b, k) {
          b.classList.toggle('is-active', k === hero.state.i);
          b.setAttribute('aria-selected', k === hero.state.i ? 'true' : 'false');
        });
      }
    },

    /* ============ a11y ============ */
    a11y: {
      bind: function () {
        if (!hero.el) return;
        /* 键盘 ←/→ */
        document.addEventListener('keydown', function (ev) {
          var r = hero.el.getBoundingClientRect();
          var inView = r.bottom > 0 && r.top < window.innerHeight;
          if (!inView) return;
          if (ev.key === 'ArrowRight') {
            hero.timeline.clear();
            hero.transition.to((hero.state.i + 1) % hero.state.n);
            hero.auto();
          } else if (ev.key === 'ArrowLeft') {
            hero.timeline.clear();
            hero.transition.to((hero.state.i - 1 + hero.state.n) % hero.state.n);
            hero.auto();
          }
        });
        /* visibilitychange：暂停计时（rAF 由浏览器自动节流） */
        document.addEventListener('visibilitychange', function () {
          if (!document.hidden && !hero.state.reduced) {
            hero.breath.restart();
          }
        });
      }
    }
  });
})();
