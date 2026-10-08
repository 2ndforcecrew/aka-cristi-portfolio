/* ============================================================
 * AKA.CRISTI — carousel.js（v2.9.9 覆蓋滑入無放大）
 * Elementor 風格：自動播放 + 箭頭 + 圓點 + 滾輪 + 鍵盤
 * 覆蓋滑入（translateX），無 zoom、無 parallax。
 * ============================================================ */
(function () {
  'use strict';

  function initOne(root) {
    var slides = root.querySelectorAll('.carousel-slide');
    if (!slides.length) return;
    var n = slides.length;
    var i = 0;
    var timer = null;

    var autoplayMs = parseInt(root.getAttribute('data-autoplay') || '5000', 10);
    var prevBtn = root.querySelector('[data-carousel-prev]');
    var nextBtn = root.querySelector('[data-carousel-next]');
    var dotsWrap = root.querySelector('[data-carousel-dots]');
    var countEl = root.querySelector('[data-carousel-count]');

    var dots = [];
    if (dotsWrap) {
      for (var d = 0; d < n; d++) {
        (function (idx) {
          var li = document.createElement('li');
          var b = document.createElement('button');
          b.type = 'button';
          b.setAttribute('aria-label', 'Go to slide ' + (idx + 1));
          b.addEventListener('click', function () {
            go(idx, idx > i ? 1 : -1);
            restart();
          });
          li.appendChild(b);
          dotsWrap.appendChild(li);
          dots.push(b);
        })(d);
      }
    }

    function render() {
      for (var k = 0; k < n; k++) {
        if (dots[k]) dots[k].classList.toggle('is-active', k === i);
      }
      if (countEl) {
        var pad = function (x) { return (x < 10 ? '0' : '') + x; };
        countEl.textContent = pad(i + 1) + ' / ' + pad(n);
      }
      for (var v = 0; v < n; v++) {
        var vid = slides[v].querySelector('video');
        if (!vid) continue;
        if (v === i) {
          if (vid.paused) { try { vid.play(); } catch (e) {} }
        } else {
          if (!vid.paused) vid.pause();
        }
      }
    }

    /* 覆蓋滑入：dir=1 從右，dir=-1 從左 */
    function go(idx, dir) {
      var target = ((idx % n) + n) % n;
      if (target === i) { render(); return; }
      var prevIdx = i;
      i = target;
      dir = dir || 1;

      slides[prevIdx].classList.remove('is-active');
      slides[prevIdx].classList.add('is-under');

      var incoming = slides[i];
      incoming.classList.remove('is-under', 'no-anim');
      if (dir < 0) incoming.classList.add('from-left');
      void incoming.offsetWidth;
      incoming.classList.add('is-active');

      setTimeout(function () {
        var old = slides[prevIdx];
        old.classList.add('no-anim');
        old.classList.remove('is-under', 'from-left');
        void old.offsetWidth;
        old.classList.remove('no-anim');
      }, 720);

      render();
    }

    function next() { go(i + 1, 1); }
    function prev() { go(i - 1, -1); }

    function stop() {
      if (timer) { clearInterval(timer); timer = null; }
    }
    function start() {
      stop();
      if (autoplayMs > 0 && n > 1) timer = setInterval(next, autoplayMs);
    }
    function restart() { start(); }

    if (prevBtn) prevBtn.addEventListener('click', function () { prev(); restart(); });
    if (nextBtn) nextBtn.addEventListener('click', function () { next(); restart(); });

    root.addEventListener('mouseenter', stop);
    root.addEventListener('mouseleave', start);

    /* 鍵盤 */
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      var r = root.getBoundingClientRect();
      if (r.bottom < 0 || r.top > window.innerHeight) return;
      if (e.key === 'ArrowLeft') { prev(); restart(); }
      if (e.key === 'ArrowRight') { next(); restart(); }
    });

    /* 滾輪 */
    var wheelCool = false;
    root.addEventListener('wheel', function (e) {
      if (wheelCool) return;
      var r = root.getBoundingClientRect();
      if (r.bottom < 0 || r.top > window.innerHeight) return;
      e.preventDefault();
      wheelCool = true;
      if (e.deltaY > 0) next(); else prev();
      restart();
      setTimeout(function () { wheelCool = false; }, 900);
    }, { passive: false });

    /* 觸控 */
    var tx0 = null;
    root.addEventListener('touchstart', function (e) {
      tx0 = e.touches[0].clientX;
    }, { passive: true });
    root.addEventListener('touchend', function (e) {
      if (tx0 === null) return;
      var dx = e.changedTouches[0].clientX - tx0;
      tx0 = null;
      if (Math.abs(dx) < 40) return;
      if (dx < 0) next(); else prev();
      restart();
    }, { passive: true });

    render();
    slides[0].classList.add('no-anim', 'is-active');
    void slides[0].offsetWidth;
    slides[0].classList.remove('no-anim');
    start();
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
