/* ============================================================
 * AKA.CRISTI — hero.js（AKA_HOME_HERO，spec §07–§19）
 * v2.0：50/50 split-screen。左半图片 / 右半纸色文字面板；
 *   滚轮驱动两半反向运动（图上 / 文下），过渡中一半一半；
 *   移动端两半上下堆叠（图 52% / 文 48%），同向运动。
 *   section 高 n*100vh；.hero-pin sticky 锁 100vh；
 *   slide 绝对叠放，每半按 f = i - p*(n-1) 位移。
 *   chrome（dots/箭头/进度条/scroll 指示器）mix-blend-mode:difference，
 *   深浅自适应；v1.x 的 is-light / tone.sync 已删除。
 * JS 只调度、不直接写样式（样式全在 hero.css）。
 * 全部防御性：钩子缺失静默跳过，不抛错。
 * ============================================================ */
(function () {
  'use strict';

  var AKA = (window.AKA = window.AKA || {});

  /* spec §13 timeline 延迟（s） */
  var TL = { bg: 0, num: 0.12, cat: 0.22, title: 0.32, 'title-en': 0.40,
             desc: 0.48, meta: 0.56, link: 0.64, a: 0.60 };
  var BREATH_MS = 7000;         /* §10 P1：Ken Burns 7s linear（参考参数，覆盖 §15） */
  var MOBILE_Q = '(max-width: 768px)';

  function each(arr, fn) {
    for (var i = 0; i < arr.length; i++) fn(arr[i], i);
  }
  function byHook(name, root) {
    return (root || document).querySelector('[data-js="' + name + '"]');
  }
  function pad2(n) { return (n < 10 ? '0' : '') + n; }

  var hero = (AKA.hero = {
    state: { i: 0, n: 0, timers: [], reduced: false, inited: false, mobile: false },
    el: null, pinEl: null, slides: [], rafId: 0,
    progressBar: null,
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
      hero.pinEl = byHook('hero-pin', el);

      /* 滚动区：n 张 × 100vh */
      el.style.height = (works.length * 100) + 'vh';

      hero.build(works);
      hero.nav.build();
      hero.cursor.build();
      hero.a11y.bind();
      hero.parallax.bind();

      hero.scroll.measure();
      hero.scroll.bind();

      /* 首张：跑 timeline；随后全由滚动驱动 */
      hero.setActive(0);
      hero.scroll.update();
    },

    /* ============ 建 slide DOM（目标：hero-pin，绝对叠放） ============ */
    /* 描边 A：内联 a-symbol.svg 几何（§10 P1）。
       paths 改 fill="none" stroke-width="6"；针尖/方点保留填充；
       几何不变，不算重画。clipPath id 按 slide 加后缀防冲突。
       v2.0：A 退为右半面板的水印（faint ink）。 */
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
      var host = hero.pinEl || hero.el;
      if (!host) return;
      var frag = document.createDocumentFragment();
      hero.slides = [];
      each(works, function (w, i) {
        var s = document.createElement('article');
        s.className = 'hero-slide';
        s.setAttribute('data-js', 'hero-slide');
        s.setAttribute('data-i', String(i));
        s.setAttribute('aria-roledescription', 'slide');
        s.setAttribute('aria-label', (i + 1) + ' / ' + works.length + ' — ' + w.titleEn);
        s._work = w;   /* i18n：applyLang 用 */
        s._idx = i;

        /* ---- 左半：图片（scroll 位移目标） ---- */
        var him = document.createElement('div');
        him.className = 'half half-img';
        var himIn = document.createElement('div');
        himIn.className = 'half-in';
        himIn.setAttribute('data-px', '8');   /* mouse parallax ±8px */
        var bg = document.createElement('div');
        bg.setAttribute('data-layer', 'bg');
        /* §43 WebP：AKA.picture 生成 <picture> webp 优先 + jpg fallback */
        var pic = AKA.picture(w.hero || w.cover,
          'AKA.CRISTI — ' + w.titleEn + ' — ' + w.category,
          { eager: i === 0 });
        var heroImg = (pic.tagName === 'PICTURE') ? pic.querySelector('img') : pic;
        heroImg.setAttribute('data-breath', '1');
        bg.appendChild(pic);
        himIn.appendChild(bg);
        him.appendChild(himIn);
        s.appendChild(him);
        s._img = him;

        /* ---- 右半：纸色文字面板（scroll 反向位移目标） ---- */
        var htx = document.createElement('div');
        htx.className = 'half half-txt';
        var htxIn = document.createElement('div');
        htxIn.className = 'half-in';
        htxIn.setAttribute('data-px', '3');   /* mouse parallax ±3px */
        var inner = document.createElement('div');
        inner.className = 'txt-inner';

        var num = document.createElement('p');
        num.setAttribute('data-layer', 'num');
        num.setAttribute('data-hook', 'hero-num');
        num.textContent = 'N°' + pad2(i + 1) + ' / ' + pad2(works.length);
        inner.appendChild(num);

        var cat = document.createElement('p');
        cat.setAttribute('data-layer', 'cat');
        cat.setAttribute('data-hook', 'hero-cat');
        cat.textContent = w.category;
        inner.appendChild(cat);

        var title = document.createElement('h2');
        title.setAttribute('data-layer', 'title');
        title.setAttribute('data-hook', 'hero-title');
        title.textContent = w.titleEn;
        inner.appendChild(title);

        var titleEn = document.createElement('p');
        titleEn.setAttribute('data-layer', 'title-en');
        titleEn.setAttribute('data-hook', 'hero-title-en');
        titleEn.textContent = w.title;
        inner.appendChild(titleEn);

        var desc = document.createElement('p');
        desc.setAttribute('data-layer', 'desc');
        desc.setAttribute('data-hook', 'hero-desc');
        desc.textContent = w.description;
        inner.appendChild(desc);

        var meta = document.createElement('p');
        meta.setAttribute('data-layer', 'meta');
        meta.setAttribute('data-hook', 'hero-meta');
        meta.textContent = w.location + ' — ' + w.year + ' — ' + w.category;
        inner.appendChild(meta);

        var link = document.createElement('a');
        link.setAttribute('data-layer', 'link');
        link.setAttribute('data-hook', 'hero-link');
        link.href = 'project.html?id=' + w.id + '&v=2.0'; /* ?v 占位，部署时统一 bump */
        link.textContent = 'VIEW PROJECT →';
        inner.appendChild(link);

        htxIn.appendChild(inner);

        /* A 水印：描边版内联 SVG，faint ink */
        var awrap = document.createElement('div');
        awrap.className = 'txt-a';
        awrap.setAttribute('data-layer', 'a');
        awrap.setAttribute('aria-hidden', 'true');
        awrap.innerHTML = hero.aOutlineSVG(i);
        htxIn.appendChild(awrap);

        htx.appendChild(htxIn);
        s.appendChild(htx);
        s._txt = htx;

        frag.appendChild(s);
        hero.slides.push(s);
      });
      host.appendChild(frag);
      hero.applyLang(); /* 按当前语言刷一遍文字层 */

      /* 进度条：pin 级单条，scroll 驱动 scaleX */
      var prog = document.createElement('div');
      prog.className = 'hero-progress';
      prog.setAttribute('aria-hidden', 'true');
      prog.innerHTML = '<i></i>';
      host.appendChild(prog);
      hero.progressBar = prog.querySelector('i');
    },

    /* ============ i18n：按当前语言重刷 slide 文字层 ============ */
    /* build 与 onChange 共用；timeline/转场/键盘/光标逻辑不动 */
    paintSlide: function (s, w, i, n) {
      var I = AKA.i18n;
      var zh = !I || I.lang !== 'en';
      var cat = I ? I.cat(w.category) : w.category;
      var loc = I ? I.city(w.location) : w.location;
      var title = zh ? w.title : w.titleEn;
      var titleAlt = zh ? w.titleEn : w.title;
      var desc = zh ? w.description : w.descEn;
      function h(k) { return s.querySelector('[data-hook="' + k + '"]'); }
      var el;
      el = h('hero-num');
      if (el) el.textContent = 'N°' + pad2(i + 1) + ' / ' + pad2(n);
      el = h('hero-cat');
      if (el) el.textContent = cat;
      el = h('hero-title');
      if (el) el.textContent = title;
      el = h('hero-title-en');
      if (el) el.textContent = titleAlt;
      el = h('hero-desc');
      if (el) el.textContent = desc;
      el = h('hero-meta');
      if (el) el.textContent = loc + ' — ' + w.year + ' — ' + cat;
      el = h('hero-link');
      if (el) {
        el.textContent = I ? I.t('hero.view') : 'VIEW PROJECT →';
        el.href = 'project.html?id=' + w.id + '&v=2.0';
      }
      s.setAttribute('aria-label', (i + 1) + ' / ' + n + ' — ' + title);
      var img = s.querySelector('[data-breath]');
      if (img) img.setAttribute('alt', 'AKA.CRISTI — ' + title + ' — ' + cat);
    },
    applyLang: function () {
      each(hero.slides, function (s) {
        if (s._work) hero.paintSlide(s, s._work, s._idx, hero.state.n);
      });
    },

    /* ============ timeline（§13）：slide 进入时播一遍图层 stagger ============ */
    timeline: {
      clear: function () {
        each(hero.state.timers, function (t) { clearTimeout(t); });
        hero.state.timers = [];
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

    /* ============ 当前 slide：is-active（pointer-events）+ dots + 入场 + 呼吸 ============ */
    /* v2.0：删掉 tone/is-light 同步——chrome 走 mix-blend-mode:difference 自适应 */
    setActive: function (idx) {
      var slide = hero.slides[idx];
      if (!slide) return;
      hero.state.i = idx;
      each(hero.slides, function (s, k) {
        s.classList.toggle('is-active', k === idx);
      });
      hero.nav.sync();
      if (hero.state.reduced) {
        each(slide.querySelectorAll('[data-layer]'), function (l) { l.classList.add('in'); });
      } else {
        hero.timeline.play(slide);
      }
      hero.breath.restart();
    },

    /* ============ scroll 驱动（v2.0 split-screen） ============ */
    /* 每张 slide i：f = i - p*(n-1)；
       .half-img → translateY(f*vh)；
       .half-txt → 桌面反向 translateY(-f*vh)，移动端同向 translateY(f*vh)。 */
    scroll: {
      elTop: 0, elH: 0,
      measure: function () {
        if (!hero.el) return;
        var r = hero.el.getBoundingClientRect();
        hero.scroll.elTop = r.top + (window.scrollY || window.pageYOffset || 0);
        hero.scroll.elH = hero.el.offsetHeight;
        hero.state.mobile =
          !!(window.matchMedia && window.matchMedia(MOBILE_Q).matches);
      },
      update: function () {
        if (!hero.el || !hero.state.n) return;
        var vh = window.innerHeight || 1;
        var total = hero.scroll.elH - vh;
        var y = window.scrollY || window.pageYOffset || 0;
        var p = total > 0 ? (y - hero.scroll.elTop) / total : 0;
        p = Math.max(0, Math.min(1, p));
        var span = p * (hero.state.n - 1);
        var mobile = hero.state.mobile;
        each(hero.slides, function (s, i) {
          var f = i - span;
          var imgY = f * vh;
          var txtY = mobile ? imgY : -imgY;
          if (s._img) s._img.style.transform = 'translateY(' + imgY.toFixed(1) + 'px)';
          if (s._txt) s._txt.style.transform = 'translateY(' + txtY.toFixed(1) + 'px)';
        });
        /* 进度条：JS 直接 scaleX */
        if (hero.progressBar) hero.progressBar.style.transform = 'scaleX(' + p.toFixed(4) + ')';
        /* scroll 指示器：滚开即淡出 */
        var cue = hero.el.querySelector('.scroll-indicator');
        if (cue) cue.style.opacity = p > 0.03 ? '0' : '';
        /* 当前 slide */
        var idx = Math.round(span);
        if (idx !== hero.state.i) hero.setActive(idx);
      },
      bind: function () {
        var ticking = false;
        window.addEventListener('scroll', function () {
          if (ticking) return;
          ticking = true;
          requestAnimationFrame(function () {
            ticking = false;
            hero.scroll.update();
          });
        }, { passive: true });
        window.addEventListener('resize', function () {
          hero.scroll.measure();
          hero.scroll.update();
        });
      }
    },

    /* ============ 跳到第 i 张（dots / 箭头 / 键盘统一走 scroll） ============ */
    goTo: function (i) {
      var n = hero.state.n;
      if (!n) return;
      i = Math.max(0, Math.min(n - 1, i));
      var vh = window.innerHeight || 1;
      window.scrollTo({
        top: hero.scroll.elTop + i * vh,
        behavior: hero.state.reduced ? 'auto' : 'smooth'
      });
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

    /* ============ parallax（§17）：只保留 mouse 分支 ============ */
    /* v1.9：sticky 时 section rect.top 恒 ~0，旧 scroll 三层视差已无意义，删除。
       v2.0：data-px 直接写像素值（img 8 / txt 3），作用在 .half-in 上，
       与 scroll 驱动写在 .half 上的位移不冲突。 */
    parallax: {
      bind: function () {
        if (hero.state.reduced || !hero.el) return;
        var zone = hero.pinEl || hero.el;
        var fine = window.matchMedia && window.matchMedia('(hover: hover)').matches;
        if (fine) {
          /* mouse ±px；手机（hover:none）关闭 mouse 分支 */
          zone.addEventListener('mousemove', function (ev) {
            var r = zone.getBoundingClientRect();
            hero.tmx = ((ev.clientX - r.left) / r.width - 0.5) * 2;   /* -1..1 */
            hero.tmy = ((ev.clientY - r.top) / r.height - 0.5) * 2;
          });
          zone.addEventListener('mouseleave', function () {
            hero.tmx = 0; hero.tmy = 0;
          });
        }
        /* breath + cursor 共用一个 rAF */
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
        var groups = hero.el.querySelectorAll('[data-px]');
        each(groups, function (g) {
          var d = parseFloat(g.getAttribute('data-px'));
          if (isNaN(d)) d = 4;
          var x = hero.mx * d;
          var y = hero.my * d;
          g.style.transform = 'translate(' + x.toFixed(2) + 'px,' + y.toFixed(2) + 'px)';
        });
      }
    },

    /* ============ cursor：方形跟随光标（fine pointer 限定） ============ */
    /* mix-blend-mode: difference 实现深浅自适应 */
    cursor: {
      el: null, x: 0, y: 0, tx: 0, ty: 0,
      build: function () {
        if (hero.state.reduced || !hero.el) return;
        var mq = window.matchMedia;
        var fine = mq && mq('(hover: hover) and (pointer: fine)').matches;
        if (!fine) return;
        var zone = hero.pinEl || hero.el;
        var c = document.createElement('div');
        c.className = 'hero-cursor';
        c.setAttribute('aria-hidden', 'true');
        document.body.appendChild(c);
        hero.cursor.el = c;
        hero.el.classList.add('has-cursor');
        zone.addEventListener('mousemove', function (ev) {
          hero.cursor.tx = ev.clientX;
          hero.cursor.ty = ev.clientY;
          c.classList.add('is-on');
        });
        zone.addEventListener('mouseleave', function () {
          c.classList.remove('is-on', 'is-hover');
        });
        /* 悬停可交互元素时放大 */
        zone.addEventListener('mouseover', function (ev) {
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

    /* ============ nav：短横线 dots（点击走 scrollTo） ============ */
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
            b.addEventListener('click', function () { hero.goTo(idx); });
            dots.appendChild(b);
          })(i);
        }
        nav.innerHTML = '';
        nav.appendChild(dots);
        hero.nav.sync();
        /* 左右箭头：挂在 hero-pin 上（CSS 绝对定位两侧），JS 生成 */
        hero.nav.buildArrows();
      },
      buildArrows: function () {
        var host = hero.pinEl || hero.el;
        if (!host) return;
        var mk = function (dir) {
          var b = document.createElement('button');
          b.type = 'button';
          b.className = 'hero-arrow hero-arrow--' + (dir < 0 ? 'prev' : 'next');
          b.setAttribute('aria-label', dir < 0 ? 'Previous slide' : 'Next slide');
          b.innerHTML = '<span aria-hidden="true">' + (dir < 0 ? '←' : '→') + '</span>';
          b.addEventListener('click', function () {
            hero.goTo(hero.state.i + dir);
          });
          return b;
        };
        host.appendChild(mk(-1));
        host.appendChild(mk(1));
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
        /* 键盘 ←/→：pin 区间在视口内时走 scroll；表单输入时不劫持 */
        document.addEventListener('keydown', function (ev) {
          var t = ev.target;
          var tag = t && t.tagName;
          if (tag && /^(INPUT|TEXTAREA|SELECT)$/.test(tag)) return;
          if (t && t.isContentEditable) return;
          var zone = hero.pinEl || hero.el;
          var r = zone.getBoundingClientRect();
          var inView = r.bottom > 0 && r.top < window.innerHeight;
          if (!inView) return;
          if (ev.key === 'ArrowRight') {
            hero.goTo(hero.state.i + 1);
          } else if (ev.key === 'ArrowLeft') {
            hero.goTo(hero.state.i - 1);
          }
        });
        /* visibilitychange：rAF 由浏览器自动节流；回来后重开呼吸避免跳变 */
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
