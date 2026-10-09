/* ============================================================
 * AKA.CRISTI — carousel.js（v2.9.14 滾輪劫持）
 * 100vh sticky，滾輪只切換輪播內容不滾頁面；
 * 4 張播完才放行頁面滾動。
 * 四方向進入（右/左/下/上），文字 2s 延遲打字機。
 * ============================================================ */
(function () {
  'use strict';

  function initOne(root) {
    var slides = root.querySelectorAll('.carousel-slide');
    if (!slides.length) return;
    var n = slides.length;

    var prevBtn = root.querySelector('[data-carousel-prev]');
    var nextBtn = root.querySelector('[data-carousel-next]');
    var dotsWrap = root.querySelector('[data-carousel-dots]');
    var countEl = root.querySelector('[data-carousel-count]');

    var current = 0;
    var animating = false;

    var dots = [];
    if (dotsWrap) {
      for (var d = 0; d < n; d++) {
        (function (idx) {
          var li = document.createElement('li');
          var b = document.createElement('button');
          b.type = 'button';
          b.setAttribute('aria-label', 'Go to slide ' + (idx + 1));
          b.addEventListener('click', function () { goTo(idx); });
          li.appendChild(b);
          dotsWrap.appendChild(li);
          dots.push(b);
        })(d);
      }
    }

    /* 方向對應的 transform */
    function dirTransform(dir, prog) {
      /* prog: 0=就位, 100=完全在外 */
      var p = prog.toFixed(2) + '%';
      if (dir === 'right') return 'translateX(' + p + ')';
      if (dir === 'left') return 'translateX(-' + p + ')';
      if (dir === 'top') return 'translateY(-' + p + ')';
      return 'translateY(' + p + ')'; /* bottom */
    }

    /* 打字機 */
    var typeTimers = [];
    function clearTypeTimers() {
      for (var t = 0; t < typeTimers.length; t++) {
        clearTimeout(typeTimers[t]);
        clearInterval(typeTimers[t]);
      }
      typeTimers = [];
    }
    function startTypewriter(slide) {
      clearTypeTimers();
      var h2 = slide.querySelector('h2');
      var p = slide.querySelector('.carousel-caption > p:last-child');
      if (!h2) return;
      var h2Text = h2.getAttribute('data-text') || h2.textContent;
      h2.setAttribute('data-text', h2Text);
      var pText = p ? (p.getAttribute('data-text') || p.textContent) : '';
      if (p) p.setAttribute('data-text', pText);
      h2.textContent = '';
      if (p) p.textContent = '';
      var delayT = setTimeout(function () {
        var hi = 0;
        var hTimer = setInterval(function () {
          if (hi < h2Text.length) {
            h2.textContent += h2Text.charAt(hi);
            hi++;
          } else {
            clearInterval(hTimer);
            if (p) {
              var pi = 0;
              var pTimer = setInterval(function () {
                if (pi < pText.length) {
                  p.textContent += pText.charAt(pi);
                  pi++;
                } else { clearInterval(pTimer); }
              }, 60);
              typeTimers.push(pTimer);
            }
          }
        }, 90);
        typeTimers.push(hTimer);
      }, 2000);
      typeTimers.push(delayT);
    }
    function stopTypewriter(slide) {
      clearTypeTimers();
      var h2 = slide.querySelector('h2');
      var p = slide.querySelector('.carousel-caption > p:last-child');
      if (h2 && h2.getAttribute('data-text')) h2.textContent = h2.getAttribute('data-text');
      if (p && p.getAttribute('data-text')) p.textContent = p.getAttribute('data-text');
    }

    /* 顯示指定 slide */
    function render() {
      for (var i = 0; i < n; i++) {
        var s = slides[i];
        var dir = s.getAttribute('data-dir') || 'bottom';
        if (i < current) {
          s.style.transform = dirTransform(dir, 100);
          /* 已過：藏到反側避免干擾 */
          if (dir === 'right') s.style.transform = 'translateX(-100%)';
          else if (dir === 'left') s.style.transform = 'translateX(100%)';
          else if (dir === 'top') s.style.transform = 'translateY(100%)';
          else s.style.transform = 'translateY(-100%)';
          s.style.visibility = 'hidden';
          s.style.zIndex = 0;
        } else if (i === current) {
          s.style.transform = 'translateX(0) translateY(0)';
          s.style.visibility = 'visible';
          s.style.zIndex = 1;
        } else {
          s.style.transform = dirTransform(dir, 100);
          s.style.visibility = 'hidden';
          s.style.zIndex = 0;
        }
        s.classList.toggle('is-active', i === current);
      }
      for (var di = 0; di < dots.length; di++) {
        dots[di].classList.toggle('is-active', di === current);
      }
      if (countEl) {
        var pad = function (x) { return (x < 10 ? '0' : '') + x; };
        countEl.textContent = pad(current + 1) + ' / ' + pad(n);
      }
      /* 視頻播放控制 */
      for (var v = 0; v < n; v++) {
        var vid = slides[v].querySelector('video');
        if (!vid) continue;
        if (v === current) {
          if (vid.paused) { try { vid.play(); } catch (e) {} }
        } else {
          if (!vid.paused) vid.pause();
        }
      }
    }

    function goTo(idx) {
      if (idx < 0 || idx >= n || idx === current || animating) return;
      var from = current;
      var to = idx;
      var forward = to > from;

      /* 停止舊打字機 */
      stopTypewriter(slides[from]);

      animating = true;
      current = to;

      var inSlide = slides[to];
      var dir = inSlide.getAttribute('data-dir') || 'bottom';

      /* 進場 slide：先放到進入方向，無動畫 */
      inSlide.style.transition = 'none';
      inSlide.style.transform = dirTransform(dir, 100);
      inSlide.style.visibility = 'visible';
      inSlide.style.zIndex = 2;
      /* 強制 reflow */
      void inSlide.offsetWidth;
      /* 再滑入，有動畫 */
      inSlide.style.transition = '';
      inSlide.style.transform = 'translateX(0) translateY(0)';

      /* 舊 slide 降到下層 */
      slides[from].style.zIndex = 1;

      /* 更新 dots/count */
      for (var di = 0; di < dots.length; di++) {
        dots[di].classList.toggle('is-active', di === current);
      }
      if (countEl) {
        var pad = function (x) { return (x < 10 ? '0' : '') + x; };
        countEl.textContent = pad(current + 1) + ' / ' + pad(n);
      }

      /* 視頻 */
      for (var v = 0; v < n; v++) {
        var vid = slides[v].querySelector('video');
        if (!vid) continue;
        if (v === current) {
          if (vid.paused) { try { vid.play(); } catch (e) {} }
        } else {
          if (!vid.paused) vid.pause();
        }
      }

      /* 動畫結束後整理 */
      setTimeout(function () {
        animating = false;
        render();
        /* 新 slide 打字機 */
        startTypewriter(slides[current]);
        inSlide.classList.add('is-active');
        slides[from].classList.remove('is-active');
      }, 650);
    }

    function next() { return goTo(current + 1); }
    function prev() { return goTo(current - 1); }

    /* 滾輪劫持：只切輪播，播完才放行頁面 */
    root.addEventListener('wheel', function (e) {
      if (animating) { e.preventDefault(); return; }
      var rect = root.getBoundingClientRect();
      /* 只有輪播佔滿視口時才劫持 */
      var pinned = rect.top <= 1 && rect.top >= -1;
      if (!pinned) return;

      if (e.deltaY > 0) {
        /* 向下 */
        if (current < n - 1) {
          e.preventDefault();
          next();
        }
        /* 最後一張：不 preventDefault，放行頁面滾動 */
      } else if (e.deltaY < 0) {
        /* 向上 */
        if (current > 0) {
          e.preventDefault();
          prev();
        }
        /* 第一張：不 preventDefault，放行頁面滾動 */
      }
    }, { passive: false });

    /* 觸控 */
    var touchY = null;
    root.addEventListener('touchstart', function (e) {
      touchY = e.touches[0].clientY;
    }, { passive: true });
    root.addEventListener('touchend', function (e) {
      if (touchY === null || animating) return;
      var dy = touchY - e.changedTouches[0].clientY;
      if (Math.abs(dy) < 40) return;
      var rect = root.getBoundingClientRect();
      var pinned = rect.top <= 1 && rect.top >= -1;
      if (!pinned) return;
      if (dy > 0 && current < n - 1) next();
      else if (dy < 0 && current > 0) prev();
      touchY = null;
    }, { passive: true });

    if (prevBtn) prevBtn.addEventListener('click', function () { prev(); });
    if (nextBtn) nextBtn.addEventListener('click', function () { next(); });

    document.addEventListener('keydown', function (e) {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      var r = root.getBoundingClientRect();
      if (r.bottom < 0 || r.top > window.innerHeight) return;
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    });

    /* 初始 */
    render();
    startTypewriter(slides[0]);
    slides[0].classList.add('is-active');
  }

  function init() {
    var roots = document.querySelectorAll('[data-js="carousel"]');
    for (var r = 0; r < roots.length; r++) initOne(roots[r]);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
