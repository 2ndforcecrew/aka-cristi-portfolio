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
  var TL = { bg: 0, num: 0.15, loc: 0.15, cat: 0.30, title: 0.45, meta: 0.55, a: 0.60 };
  var SLIDE_MS = 6500;          /* §13：6–8s，取 6.5s */
  var BREATH_MS = 7000;         /* §10 P1：Ken Burns 7s linear（参考参数，覆盖 §15） */
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
      hero.cursor.build();
      hero.a11y.bind();
      hero.parallax.bind();

      /* 首张：直接呈现 + 跑 timeline；随后进主循环 */
      var s0 = hero.slides[0];
      if (s0) {
        s0.classList.add('is-active');
        s0.setAttribute('aria-hidden', 'false');
        hero.tone.sync(s0);
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

    /* ============ 主题：浅色 slide 时 section 切 is-light ============ */
    /* dots / scroll-indicator 是 slide 的兄弟元素，主题必须挂在 section.hero 上 */
    tone: {
      sync: function (s) {
        if (hero.el) {
          hero.el.classList.toggle('is-light', !!(s && s.classList.contains('is-light')));
        }
      }
    },

    /* ============ 建 slide DOM ============ */
    /* 描边 A：内联 a-symbol.svg 几何（§10 P1）。
       paths 改 fill="none" stroke-width="6"；针尖/方点保留填充；
       几何不变，不算重画。clipPath id 按 slide 加后缀防冲突。 */
    aOutlineSVG: function (i) {
      var u = 'a-upper-' + i, l = 'a-lower-' + i;
      return '<svg viewBox="60 -20 312 432" aria-hidden="true" focusable="false">' +
        '<defs>' +
        '<clipPath id="' + u + '"><rect x="0" y="-20" width="460" height="266"/></clipPath>' +
        '<clipPath id="' + l + '"><rect x="0" y="272" width="460" height="160"/></clipPath>' +
        '</defs>' +
        '<g clip-path="url(#' + u + ')"><g transform="translate(28,0)">' +
        '<path d="M 102 400 L 216 40" fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="butt"/>' +
        '<path d="M 216 40 L 330 400" fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="butt"/>' +
        '<rect x="233" y="-8" width="22" height="48" fill="currentColor"/>' +
        '</g></g>' +
        '<g clip-path="url(#' + l + ')">' +
        '<path d="M 102 400 L 216 40" fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="butt"/>' +
        '<path d="M 216 40 L 330 400" fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="butt"/>' +
        '</g>' +
        '<rect x="207" y="326" width="18" height="18" fill="currentColor"/>' +
        '</svg>';
    },

    build: function (works) {
      var wrap = byHook('hero-slides', hero.el);
      if (!wrap) return;
      var frag = document.createDocumentFragment();
      hero.slides = [];
      each(works, function (w, i) {
        var s = document.createElement('article');
        s.className = 'hero-slide';
        /* 浅色照片：前景全部转 ink（描边 A / 文字 / dots / 进度条） */
        if (w.tone === 'light') s.classList.add('is-light');
        s.setAttribute('data-js', 'hero-slide');
        s.setAttribute('aria-roledescription', 'slide');
        s.setAttribute('aria-label', (i + 1) + ' / ' + works.length + ' — ' + w.titleEn);
        s.setAttribute('aria-hidden', 'true');
        s._work = w;   /* i18n：applyLang 用 */
        s._idx = i;

        /* layer 01：背景 */
        var bgw = document.createElement('div');
        bgw.className = 'hero-bgwrap';
        bgw.setAttribute('data-px', 'bg');
        var bg = document.createElement('div');
        bg.setAttribute('data-layer', 'bg');
        /* §43 WebP：AKA.picture 生成 <picture> webp 优先 + jpg fallback */
        var pic = AKA.picture(w.hero || w.cover,
          'AKA.CRISTI — ' + w.titleEn + ' — ' + w.category,
          { eager: i === 0 });
        var heroImg = (pic.tagName === 'PICTURE') ? pic.querySelector('img') : pic;
        heroImg.setAttribute('data-breath', '1');
        bg.appendChild(pic);
        bgw.appendChild(bg);
        s.appendChild(bgw);

        /* layer 02：A 标（描边版内联 SVG） */
        var ag = document.createElement('div');
        ag.className = 'hero-agroup';
        ag.setAttribute('data-px', 'a');
        var awrap = document.createElement('div');
        awrap.setAttribute('data-layer', 'a');
        awrap.setAttribute('aria-hidden', 'true');
        awrap.innerHTML = hero.aOutlineSVG(i);
        ag.appendChild(awrap);
        s.appendChild(ag);

        /* layer 03：顶部 mono 行（§10 P1：N°01 / 06 + 城市 — 年份） */
        var nw = document.createElement('div');
        nw.className = 'hero-topline';
        nw.setAttribute('data-px', 'text');
        var num = document.createElement('div');
        num.setAttribute('data-layer', 'num');
        num.textContent = 'N°' + pad2(i + 1) + ' / ' + pad2(works.length);
        var loc = document.createElement('div');
        loc.setAttribute('data-layer', 'loc');
        loc.textContent = w.location + ' — ' + w.year;
        nw.appendChild(num);
        nw.appendChild(loc);
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

        /* 底部 2px 进度条（§10 P1：与 6.5s 轮播同步，CSS animation 驱动） */
        var prog = document.createElement('div');
        prog.className = 'hero-progress';
        prog.setAttribute('aria-hidden', 'true');
        prog.innerHTML = '<i></i>';
        s.appendChild(prog);

        frag.appendChild(s);
        hero.slides.push(s);
      });
      wrap.innerHTML = '';
      wrap.appendChild(frag);
      hero.applyLang(); /* 按当前语言刷一遍文字层 */
    },

    /* ============ i18n：按当前语言重刷 slide 文字层 ============ */
    /* build 与 onChange 共用；timeline/转场/键盘/光标逻辑不动 */
    paintSlide: function (s, w, i, n) {
      var I = AKA.i18n;
      var zh = !I || I.lang !== 'en';
      var cat = I ? I.cat(w.category) : w.category;
      var loc = I ? I.city(w.location) : w.location;
      var title = zh ? w.title : w.titleEn;
      function q(k) { return s.querySelector('[data-layer="' + k + '"]'); }
      var elNum = q('num');
      if (elNum) elNum.textContent = 'N°' + pad2(i + 1) + ' / ' + pad2(n);
      var elLoc = q('loc');
      if (elLoc) elLoc.textContent = loc + ' — ' + w.year;
      var elCat = q('cat');
      if (elCat) elCat.textContent = cat;
      var elTitle = q('title');
      if (elTitle) elTitle.textContent = title;
      var elMeta = q('meta');
      if (elMeta) elMeta.textContent = w.year + ' — ' + w.client + ' — ' + cat;
      s.setAttribute('aria-label', (i + 1) + ' / ' + n + ' — ' + title);
      var img = s.querySelector('[data-breath]');
      if (img) img.setAttribute('alt', 'AKA.CRISTI — ' + title + ' — ' + cat);
    },
    applyLang: function () {
      each(hero.slides, function (s) {
        if (s._work) hero.paintSlide(s, s._work, s._idx, hero.state.n);
      });
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
          hero.tone.sync(nxt);
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
        hero.tone.sync(nxt);
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

    /* ============ breath（§10 P1）：scale 1.01→1.07 / 7000ms linear ============ */
    breath: {
      restart: function () { hero.breathT0 = performance.now(); },
      tick: function (now) {
        if (hero.state.reduced) return;
        var slide = hero.slides[hero.state.i];
        if (!slide) return;
        var img = slide.querySelector('[data-breath]');
        if (!img) return;
        /* 单程 linear：每张 slide 播一次，切换时 restart（参考行为） */
        var t = Math.min(1, (now - hero.breathT0) / BREATH_MS);
        var s = 1.01 + 0.06 * t;
        img.style.transform = 'scale(' + s.toFixed(4) + ')';
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
        /* scroll + breath + cursor 共用一个 rAF */
        var raf = function (now) {
          hero.parallax.frame(now);
          hero.breath.tick(now);
          hero.cursor.tick();
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

    /* ============ cursor：方形跟随光标（fine pointer 限定） ============ */
    /* mix-blend-mode: difference 实现深浅自适应，无需 is-light 切换 */
    cursor: {
      el: null, x: 0, y: 0, tx: 0, ty: 0,
      build: function () {
        if (hero.state.reduced || !hero.el) return;
        var mq = window.matchMedia;
        var fine = mq && mq('(hover: hover) and (pointer: fine)').matches;
        if (!fine) return;
        var c = document.createElement('div');
        c.className = 'hero-cursor';
        c.setAttribute('aria-hidden', 'true');
        document.body.appendChild(c);
        hero.cursor.el = c;
        hero.el.classList.add('has-cursor');
        hero.el.addEventListener('mousemove', function (ev) {
          hero.cursor.tx = ev.clientX;
          hero.cursor.ty = ev.clientY;
          c.classList.add('is-on');
        });
        hero.el.addEventListener('mouseleave', function () {
          c.classList.remove('is-on', 'is-hover');
        });
        /* 悬停可交互元素时放大 */
        hero.el.addEventListener('mouseover', function (ev) {
          var t = ev.target && ev.target.closest ? ev.target.closest('button, a') : null;
          c.classList.toggle('is-hover', !!t);
        });
      },
      tick: function () {
        var cu = hero.cursor;
        if (!cu.el) return;
        cu.x += (cu.tx - cu.x) * 0.22;
        cu.y += (cu.ty - cu.y) * 0.22;
        cu.el.style.transform = 'translate(' + cu.x.toFixed(1) + 'px,' + cu.y.toFixed(1) + 'px)';
      }
    },

    /* ============ nav（§10 P1：短横线 dots；顶部已有 N°01/06，不再重复计数） ============ */
    nav: {
      build: function () {
        var nav = byHook('hero-nav', hero.el);
        if (!nav) return;
        var dots = document.createElement('div');
        dots.className = 'hero-dots';
        dots.setAttribute('role', 'tablist');
        dots.setAttribute('aria-label', 'Hero slides');
        for (var i = 0; i < hero.state.n; i++) {
          (function (idx) {
            var b = document.createElement('button');
            b.type = 'button';
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
        nav.appendChild(dots);
        hero.nav.sync();
        /* 左右箭头：挂在 section.hero 上（CSS 绝对定位两侧），JS 生成 */
        hero.nav.buildArrows();
      },
      buildArrows: function () {
        if (!hero.el) return;
        var mk = function (dir) {
          var b = document.createElement('button');
          b.type = 'button';
          b.className = 'hero-arrow hero-arrow--' + (dir < 0 ? 'prev' : 'next');
          b.setAttribute('aria-label', dir < 0 ? 'Previous slide' : 'Next slide');
          b.innerHTML = '<span aria-hidden="true">' + (dir < 0 ? '←' : '→') + '</span>';
          b.addEventListener('click', function () {
            hero.timeline.clear();
            hero.transition.to((hero.state.i + dir + hero.state.n) % hero.state.n);
            hero.auto();
          });
          return b;
        };
        hero.el.appendChild(mk(-1));
        hero.el.appendChild(mk(1));
      },
      sync: function () {
        var nav = byHook('hero-nav', hero.el);
        if (!nav) return;
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
        /* 键盘 ←/→（仅 hero 在视口内；表单输入时不劫持） */
        document.addEventListener('keydown', function (ev) {
          var t = ev.target;
          var tag = t && t.tagName;
          if (tag && /^(INPUT|TEXTAREA|SELECT)$/.test(tag)) return;
          if (t && t.isContentEditable) return;
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

  /* i18n 订阅：语言切换时重刷 slide 文字层（hero 不存在时静默跳过） */
  if (AKA.i18n && AKA.i18n.onChange) {
    AKA.i18n.onChange.push(function () {
      if (hero.el) hero.applyLang();
    });
  }
})();
