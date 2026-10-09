/* ============================================================
 * AKA.CRISTI — carousel.js（v2.9.10 sticky 敘事）
 * Elementor Sticky 概念：400vh 滾程，sticky 鎖 100vh，
 * 滾動驅動 4 張（視頻×2 + 圖片×2）crossfade，無放大。
 * 箭頭/圓點/鍵盤：點擊滾動到對應位置。
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

    var current = -1;

    var dots = [];
    if (dotsWrap) {
      for (var d = 0; d < n; d++) {
        (function (idx) {
          var li = document.createElement('li');
          var b = document.createElement('button');
          b.type = 'button';
          b.setAttribute('aria-label', 'Go to slide ' + (idx + 1));
          b.addEventListener('click', function () { scrollToSlide(idx); });
          li.appendChild(b);
          dotsWrap.appendChild(li);
          dots.push(b);
        })(d);
      }
    }

    function scrollToSlide(idx) {
      var rect = root.getBoundingClientRect();
      var scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      var elTop = rect.top + scrollTop;
      var total = root.offsetHeight - window.innerHeight;
      var target = elTop + (total * idx) / (n - 1);
      window.scrollTo({ top: target, behavior: 'smooth' });
    }

    function update() {
      var rect = root.getBoundingClientRect();
      var scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      var elTop = rect.top + scrollTop;
      var total = root.offsetHeight - window.innerHeight;
      if (total <= 0) return;

      var p = (scrollTop - elTop) / total;
      p = Math.max(0, Math.min(1, p));

      var f = p * (n - 1);
      var fi = Math.floor(f);
      var frac = f - fi;
      /* 邊界：f 為整數時 frac=0，fi 即當前 */
      if (fi >= n - 1) { fi = n - 2; frac = 1; }

      for (var i = 0; i < n; i++) {
        var s = slides[i];
        if (i < fi) {
          /* 已滾過：在上方藏起 */
          s.style.transform = 'translateY(-100%)';
          s.style.visibility = 'hidden';
          s.style.zIndex = 0;
        } else if (i === fi) {
          /* 當前：原地不動在下層 */
          s.style.transform = 'translateY(0%)';
          s.style.visibility = 'visible';
          s.style.zIndex = 1;
        } else if (i === fi + 1) {
          /* 下一張：從下方上滑蓋住（v2.9.12） */
          s.style.transform = 'translateY(' + ((1 - frac) * 100).toFixed(2) + '%)';
          s.style.visibility = 'visible';
          s.style.zIndex = 2;
        } else {
          /* 更遠：在下方待命 */
          s.style.transform = 'translateY(100%)';
          s.style.visibility = 'hidden';
          s.style.zIndex = 0;
        }
      }

      var activeIdx = Math.round(f);
      if (activeIdx !== current) {
        current = activeIdx;
        for (var k = 0; k < n; k++) {
          slides[k].classList.toggle('is-active', k === current);
        }
        for (var di = 0; di < dots.length; di++) {
          dots[di].classList.toggle('is-active', di === current);
        }
        if (countEl) {
          var pad = function (x) { return (x < 10 ? '0' : '') + x; };
          countEl.textContent = pad(current + 1) + ' / ' + pad(n);
        }
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
    }

    if (prevBtn) prevBtn.addEventListener('click', function () {
      scrollToSlide(Math.max(0, current - 1));
    });
    if (nextBtn) nextBtn.addEventListener('click', function () {
      scrollToSlide(Math.min(n - 1, current + 1));
    });

    document.addEventListener('keydown', function (e) {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      var r = root.getBoundingClientRect();
      if (r.bottom < 0 || r.top > window.innerHeight) return;
      if (e.key === 'ArrowLeft') scrollToSlide(Math.max(0, current - 1));
      if (e.key === 'ArrowRight') scrollToSlide(Math.min(n - 1, current + 1));
    });

    var ticking = false;
    function onScroll() {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(function () {
          update();
          ticking = false;
        });
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);

    update();
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
