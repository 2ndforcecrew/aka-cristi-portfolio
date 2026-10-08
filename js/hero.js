/* ============================================================
 * AKA.CRISTI — hero.js（AKA_HOME_HERO，spec §07–§19）
 * v2.4：图片固定 + 文字反向滚动。section 高 n*100vh；.hero-pin sticky 锁 100vh；
 *   .hero-fixed：一张固定全屏图片（works[0]，bg + 描边 A + Ken Burns + mouse 视差），
 *     不随滚动切换；.hero-track-txt（文字 slide，倒序 [5..0]）
 *     位移 translateY(-(1-p)*total)，滚轮往下时文字往下走（反向），
 *     在固定视口位置一张张经过。位移本身即过渡，无 mask 切换。
 *   图层 stagger 入场（图片播一次 / 文字每张进入播）；tone/is-light 在 hero 移除
 *   （图片固定为深色，文字恒白；data.js tone 字段保留给 project 页）。
 *   光标已移至 js/cursor.js（全站）。
 * JS 只调度、不直接写样式（样式全在 hero.css）。
 * 全部防御性：钩子缺失静默跳过，不抛错。
 * ============================================================ */
(function () {
  'use strict';

  var AKA = (window.AKA = window.AKA || {});

  /* spec §13 timeline 延迟（s） */
  var TL = { bg: 0, num: 0.15, loc: 0.15, cat: 0.30, title: 0.45, desc: 0.52, meta: 0.58, link: 0.64, a: 0.60 };
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
    el: null, pinEl: null, imgSlide: null, txtSlides: [], rafId: 0,
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
      hero.a11y.bind();
      hero.parallax.bind();

      hero.scroll.measure();
      hero.scroll.bind();

      /* 首张文字：跑 timeline；固定图片的图层播一次；随后全由滚动驱动 */
      if (hero.imgSlide) {
        if (hero.state.reduced) {
          each(hero.imgSlide.querySelectorAll('[data-layer]'), function (l) { l.classList.add('in'); });
        } else {
          hero.timeline.play(hero.imgSlide);
        }
      }
      hero.setActive(0);
      hero.scroll.update();
    },

    /* ============ 建 slide DOM（v2.4：单张固定图 + 文字 track） ============ */
    /* .hero-fixed：works[0] 的全幅 bg + 描边 A，不随滚动切换
       .hero-track-txt：文字 slide，倒序 [5..0]（topline + textgroup + desc + link）
       描边 A：内联 a-symbol.svg 几何（§10 P1）。
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
      var fixedWrap = byHook('hero-fixed', hero.el);
      var txtWrap = byHook('hero-track-txt', hero.el);
      if (!txtWrap) return;
      hero.txtSlides = [];

      /* ---- 固定图片：works[0]，全幅 bg + 描边 A，不随滚动切换 ---- */
      if (fixedWrap) {
        var w0 = works[0];
        var s = document.createElement('article');
        s.className = 'hero-slide hero-slide-fixed';
        s.setAttribute('data-js', 'hero-slide-fixed');
        s.setAttribute('aria-hidden', 'true');
        s._work = w0;

        /* layer 01：背景 */
        var bgw = document.createElement('div');
        bgw.className = 'hero-bgwrap';
        bgw.setAttribute('data-px', 'bg');
        var bg = document.createElement('div');
        bg.setAttribute('data-layer', 'bg');
        /* §43 WebP：AKA.picture 生成 <picture> webp 优先 + jpg fallback */
        var pic = AKA.picture(w0.hero || w0.cover,
          'AKA.CRISTI — ' + w0.titleEn + ' — ' + w0.category,
          { eager: true });
        var heroImg = (pic.tagName === 'PICTURE') ? pic.querySelector('img') : pic;
        heroImg.setAttribute('data-breath', '1');
        heroImg.setAttribute('alt', 'AKA.CRISTI — ' + w0.title + ' — ' + w0.category);
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
        awrap.innerHTML = hero.aOutlineSVG(0);
        ag.appendChild(awrap);
        s.appendChild(ag);

        fixedWrap.innerHTML = '';
        fixedWrap.appendChild(s);
        hero.imgSlide = s;
      }

      /* ---- 文字 slide：透明叠加（topline + textgroup + desc + link），倒序 ---- */
      var txtFrag = document.createDocumentFragment();
      each(works, function (w, i) {
        var t = document.createElement('article');
        t.className = 'hero-slide hero-slide-txt';
        t.setAttribute('data-js', 'hero-slide-txt');
        t.setAttribute('aria-roledescription', 'slide');
        t.setAttribute('aria-label', (i + 1) + ' / ' + works.length + ' — ' + w.titleEn);
        t._work = w;
        t._idx = i;

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
        t.appendChild(nw);

        /* layer 04–08：文字组（cat / 巨标题 / desc / meta / link） */
        var tg = document.createElement('div');
        tg.className = 'hero-textgroup';
        tg.setAttribute('data-px', 'text');
        var cat = document.createElement('div');
        cat.setAttribute('data-layer', 'cat');
        cat.textContent = w.category;
        var title = document.createElement('h2');
        title.setAttribute('data-layer', 'title');
        title.textContent = w.titleEn;
        var desc = document.createElement('p');
        desc.setAttribute('data-layer', 'desc');
        desc.textContent = w.description || '';
        var meta = document.createElement('div');
        meta.setAttribute('data-layer', 'meta');
        meta.textContent = w.location + ' — ' + w.year + ' — ' + w.category;
        var link = document.createElement('a');
        link.setAttribute('data-layer', 'link');
        link.setAttribute('data-cursor', 'view');
        link.href = 'project.html?id=' + w.id + '&v=2.4';
        link.textContent = 'VIEW PROJECT →';
        tg.appendChild(cat);
        tg.appendChild(title);
        tg.appendChild(desc);
        tg.appendChild(meta);
        tg.appendChild(link);
        t.appendChild(tg);

        /* 倒序插入：txt track 最上方是最后一个 */
        txtFrag.insertBefore(t, txtFrag.firstChild);
        hero.txtSlides[i] = t;
      });
      txtWrap.innerHTML = '';
      txtWrap.appendChild(txtFrag);
      hero.applyLang(); /* 按当前语言刷一遍文字层 */

      /* 进度条：pin 级单条，scroll 驱动 scaleX（v1.9 起不再是 6.5s keyframes） */
      var pin = hero.pinEl || hero.el;
      var prog = document.createElement('div');
      prog.className = 'hero-progress';
      prog.setAttribute('aria-hidden', 'true');
      prog.innerHTML = '<i></i>';
      pin.appendChild(prog);
      hero.progressBar = prog.querySelector('i');
    },

    /* ============ i18n：按当前语言重刷文字 slide 文字层 ============ */
    /* build 与 onChange 共用；timeline/转场/键盘/光标逻辑不动 */
    paintSlide: function (t, w, i, n) {
      var I = AKA.i18n;
      var zh = !I || I.lang !== 'en';
      var cat = I ? I.cat(w.category) : w.category;
      var loc = I ? I.city(w.location) : w.location;
      var title = zh ? w.title : w.titleEn;
      var desc = zh ? (w.description || '') : (w.descEn || '');
      var view = I ? I.t('hero.view') : '查看项目 →';
      function q(k) { return t.querySelector('[data-layer="' + k + '"]'); }
      var elNum = q('num');
      if (elNum) elNum.textContent = 'N°' + pad2(i + 1) + ' / ' + pad2(n);
      var elLoc = q('loc');
      if (elLoc) elLoc.textContent = loc + ' — ' + w.year;
      var elCat = q('cat');
      if (elCat) elCat.textContent = cat;
      var elTitle = q('title');
      if (elTitle) elTitle.textContent = title;
      var elDesc = q('desc');
      if (elDesc) elDesc.textContent = desc;
      var elMeta = q('meta');
      if (elMeta) elMeta.textContent = w.year + ' — ' + w.client + ' — ' + cat;
      var elLink = q('link');
      if (elLink) elLink.textContent = view;
      t.setAttribute('aria-label', (i + 1) + ' / ' + n + ' — ' + title);
      /* 固定图片 slide 的 alt 同步（无障碍） */
      var imgS = hero.imgSlide;
      var img = imgS && imgS.querySelector('[data-breath]');
      if (img && i === 0) img.setAttribute('alt', 'AKA.CRISTI — ' + title + ' — ' + cat);
    },
    applyLang: function () {
      each(hero.txtSlides, function (t) {
        if (t && t._work) hero.paintSlide(t, t._work, t._idx, hero.state.n);
      });
    },

    /* ============ timeline（§13）：slide 进入时播一遍图层 stagger ============ */
    /* v2.4：图片图层只播一次（init），文字 slide 每张进入时播 */
    timeline: {
      clear: function () {
        each(hero.state.timers, function (t) { clearTimeout(t); });
        hero.state.timers = [];
      },
      play: function () {
        hero.timeline.clear();
        var layers = [];
        each(arguments, function (slide) {
          if (!slide) return;
          each(slide.querySelectorAll('[data-layer]'), function (l) { layers.push(l); });
        });
        each(layers, function (l) { l.classList.remove('in'); });
        /* 强制回流，让 .in 移除生效后再按序加回 */
        if (hero.el) void hero.el.offsetWidth;
        each(layers, function (l) {
          var key = l.getAttribute('data-layer');
          var d = (TL[key] != null ? TL[key] : 0.8) * 1000;
          hero.state.timers.push(setTimeout(function () {
            l.classList.add('in');
          }, d));
        });
      }
    },

    /* ============ 当前文字 slide：dots + 入场 + 呼吸 ============ */
    /* v2.4：图片固定只播一次（init），setActive 只处理文字 slide */
    setActive: function (idx) {
      var txt = hero.txtSlides[idx];
      if (!txt) return;
      hero.state.i = idx;
      hero.nav.sync();
      /* 只有当前文字 slide 可交互（VIEW PROJECT 只在当前张可点） */
      each(hero.txtSlides, function (t, k) {
        if (t) t.classList.toggle('is-active', k === idx);
      });
      if (hero.state.reduced) {
        each(txt.querySelectorAll('[data-layer]'), function (l) { l.classList.add('in'); });
      } else {
        hero.timeline.play(txt);
      }
      hero.breath.restart();
    },

    /* ============ scroll 驱动（v1.9） ============ */
    scroll: {
      elTop: 0, elH: 0,
      measure: function () {
        if (!hero.el) return;
        var r = hero.el.getBoundingClientRect();
        hero.scroll.elTop = r.top + (window.scrollY || window.pageYOffset || 0);
        hero.scroll.elH = hero.el.offsetHeight;
      },
      update: function () {
        if (!hero.el || !hero.state.n) return;
        var vh = window.innerHeight || 1;
        var total = hero.scroll.elH - vh;
        var y = window.scrollY || window.pageYOffset || 0;
        var p = total > 0 ? (y - hero.scroll.elTop) / total : 0;
        p = Math.max(0, Math.min(1, p));
        /* 文字 track 反向位移：滚轮往下时文字往下走；位移本身即过渡 */
        var trackTxt = byHook('hero-track-txt', hero.el);
        if (trackTxt) trackTxt.style.transform = 'translateY(' + (-(1 - p) * total).toFixed(1) + 'px)';
        /* 进度条：JS 直接 scaleX */
        if (hero.progressBar) hero.progressBar.style.transform = 'scaleX(' + p.toFixed(4) + ')';
        /* scroll 指示器：滚开即淡出 */
        var cue = hero.el.querySelector('.scroll-indicator');
        if (cue) cue.style.opacity = p > 0.03 ? '0' : '';
        /* 当前 slide */
        var idx = Math.round(p * (hero.state.n - 1));
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
        var slide = hero.imgSlide;
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
    /* v1.9：sticky 时 section rect.top 恒 ~0，旧 scroll 三层视差已无意义，删除 */
    parallax: {
      bind: function () {
        if (hero.state.reduced || !hero.el) return;
        var zone = hero.pinEl || hero.el;
        var fine = window.matchMedia && window.matchMedia('(hover: hover)').matches;
        if (fine) {
          /* mouse ±8px；手机（hover:none）关闭 mouse 分支 */
          zone.addEventListener('mousemove', function (ev) {
            var r = zone.getBoundingClientRect();
            hero.tmx = ((ev.clientX - r.left) / r.width - 0.5) * 2;   /* -1..1 */
            hero.tmy = ((ev.clientY - r.top) / r.height - 0.5) * 2;
          });
          zone.addEventListener('mouseleave', function () {
            hero.tmx = 0; hero.tmy = 0;
          });
        }
        /* breath 共用 rAF（光标已移至 js/cursor.js） */
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
        var groups = hero.el.querySelectorAll('[data-px]');
        each(groups, function (g) {
          var k = g.getAttribute('data-px');
          var depth = k === 'a' ? 1 : k === 'bg' ? 0.5 : 0.25;
          var x = hero.mx * 8 * depth;
          var y = hero.my * 8 * depth;
          g.style.transform = 'translate(' + x.toFixed(2) + 'px,' + y.toFixed(2) + 'px)';
        });
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
