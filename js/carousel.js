/* ============================================================
 * AKA.CRISTI — carousel.js（v2.9 Elementor 風格輪播）
 * 功能對標 Elementor Image Carousel：
 *   - 自動播放（可配速，hover 暫停）
 *   - 上一張/下一張箭頭
 *   - 圓點導航
 *   - 無限循環
 *   - 淡入切換（CSS transition，可靠優先）
 * 用法：<section class="carousel" data-js="carousel" data-autoplay="5000">
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

    /* 建圓點 */
    var dots = [];
    if (dotsWrap) {
      for (var d = 0; d < n; d++) {
        (function (idx) {
          var li = document.createElement('li');
          var b = document.createElement('button');
          b.type = 'button';
          b.setAttribute('aria-label', 'Go to slide ' + (idx + 1));
          b.addEventListener('click', function () { go(idx); restart(); });
          li.appendChild(b);
          dotsWrap.appendChild(li);
          dots.push(b);
        })(d);
      }
    }

    function render() {
      for (var k = 0; k < n; k++) {
        slides[k].classList.toggle('is-active', k === i);
        if (dots[k]) dots[k].classList.toggle('is-active', k === i);
      }
      if (countEl) {
        var pad = function (x) { return (x < 10 ? '0' : '') + x; };
        countEl.textContent = pad(i + 1) + ' / ' + pad(n);
      }
      /* 視頻 slide：播當前，停其他 */
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

    function go(idx) {
      i = ((idx % n) + n) % n;
      render();
    }

    function next() { go(i + 1); }
    function prev() { go(i - 1); }

    function stop() {
      if (timer) { clearInterval(timer); timer = null; }
    }

    function start() {
      stop();
      if (autoplayMs > 0 && n > 1) {
        timer = setInterval(next, autoplayMs);
      }
    }

    function restart() { start(); }

    if (prevBtn) prevBtn.addEventListener('click', function () { prev(); restart(); });
    if (nextBtn) nextBtn.addEventListener('click', function () { next(); restart(); });

    /* hover 暫停（對標 Elementor pause on hover） */
    root.addEventListener('mouseenter', stop);
    root.addEventListener('mouseleave', start);

    /* 鍵盤左右鍵 */
    root.setAttribute('tabindex', '0');
    root.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') { prev(); restart(); }
      if (e.key === 'ArrowRight') { next(); restart(); }
    });

    /* 觸控滑動 */
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
