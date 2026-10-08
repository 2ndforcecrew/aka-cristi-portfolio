/* ============================================================
 * AKA.CRISTI — carousel.js（v2.9.7 scroll 驅動 parallax）
 * v2.9.7：用戶要求改成 parallax scrolling + 文字反向滾動。
 *   - 400vh 滾動行程，sticky 100vh 視口
 *   - scroll 進度驅動：圖片 crossfade + parallax 位移
 *   - 文字反向滾動（scroll 下，文字上）
 *   - 箭頭/圓點：點擊滾動到對應位置
 *   - 無 autoplay（scroll 即驅動）
 * ============================================================ */
(function () {
  'use strict';

  function initOne(root) {
    var pin = root.querySelector('.carousel-pin');
    var slides = root.querySelectorAll('.carousel-slide');
    if (!slides.length || !pin) return;
    var n = slides.length;

    var prevBtn = root.querySelector('[data-carousel-prev]');
    var nextBtn = root.querySelector('[data-carousel-next]');
    var dotsWrap = root.querySelector('[data-carousel-dots]');
    var countEl = root.querySelector('[data-carousel-count]');

    var current = -1;

    /* 建圓點 */
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

      var y = scrollTop;
      var p = (y - elTop) / total;
      p = Math.max(0, Math.min(1, p));

      var f = p * (n - 1); /* 連續 slide 位置 */
      var fi = Math.floor(f);
      var frac = f - fi;

      for (var i = 0; i < n; i++) {
        var s = slides[i];
        /* crossfade：當前 1→0，下一張 0→1 */
        var o;
        if (i === fi) o = 1 - frac;
        else if (i === fi + 1) o = frac;
        else o = 0;
        /* 首尾邊界：p=0 時第 0 張為 1，p=1 時最後一張為 1 */
        if (f <= 0) o = (i === 0) ? 1 : 0;
        if (f >= n - 1) o = (i === n - 1) ? 1 : 0;

        s.style.opacity = o.toFixed(4);
        s.style.visibility = o > 0.01 ? 'visible' : 'hidden';
        s.style.zIndex = (i === fi || i === fi + 1) ? 1 : 0;

        /* parallax：媒體上下位移（±5%，v2.9.8 從 ±8% 縮小以減少放大感），比 scroll 慢 */
        var media = s.querySelector('.carousel-media');
        if (media) {
          var py = (o > 0) ? (frac - 0.5) * 10 : 0;
          /* 只對可見的兩張做 parallax */
          if (i === fi || i === fi + 1) {
            media.style.transform = 'translateY(' + py.toFixed(2) + '%)';
          }
        }

        /* 文字反向滾動：scroll 下，文字上（v2.9.7） */
        var cap = s.querySelector('.carousel-caption');
        if (cap && o > 0) {
          var ty = -(frac * 120); /* 反向 120px */
          cap.style.transform = 'translateY(' + ty.toFixed(1) + 'px)';
        }
      }

      /* 飛入效果：當前主 slide 的 caption 子元素 stagger */
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
        /* 視頻：播當前，停其他 */
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

    /* 鍵盤左右鍵 */
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
