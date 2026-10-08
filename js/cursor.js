/* ============================================================
 * AKA.CRISTI — cursor.js（全站自定义光标，v2.4）
 * 旧站方案回归：8px 霓虹绿点（#D7FF00）即时跟随 + 36px 圆环 rAF lerp；
 * 悬停 [data-cursor="view"]（作品图片/卡片/VIEW PROJECT）时圆环扩到 84px、
 * mix-blend-mode: difference（图片上的反差圈），圆内显 VIEW（mono 小字），绿点隐藏。
 * 门控：fine pointer + 非 reduced-motion，否则不初始化、无残留。
 * 全部防御性，不抛错。
 * ============================================================ */
(function () {
  'use strict';

  var AKA = (window.AKA = window.AKA || {});

  function init() {
    var mq = window.matchMedia;
    var reduced = mq && mq('(prefers-reduced-motion: reduce)').matches;
    var fine = mq && mq('(hover: hover) and (pointer: fine)').matches;
    if (reduced || !fine || !document.body) return;

    var dot = document.createElement('div');
    dot.className = 'cursor-dot';
    dot.setAttribute('aria-hidden', 'true');
    var ring = document.createElement('div');
    ring.className = 'cursor-ring';
    ring.setAttribute('aria-hidden', 'true');
    document.body.appendChild(dot);
    document.body.appendChild(ring);
    document.documentElement.classList.add('has-cursor');

    var x = -100, y = -100, rx = -100, ry = -100, shown = false;

    document.addEventListener('mousemove', function (ev) {
      x = ev.clientX;
      y = ev.clientY;
      if (!shown) { shown = true; }
      /* 绿点即时跟随 */
      dot.style.transform = 'translate(' + x + 'px,' + y + 'px)';
      /* 作品悬停：反差圈 + VIEW */
      var t = ev.target;
      var view = t && t.closest ? t.closest('[data-cursor="view"]') : null;
      ring.classList.toggle('is-view', !!view);
      dot.style.opacity = view ? '0' : '';
    }, { passive: true });

    document.addEventListener('mouseleave', function () {
      document.documentElement.classList.remove('has-cursor');
    });
    document.addEventListener('mouseenter', function () {
      document.documentElement.classList.add('has-cursor');
    });

    /* 圆环 lerp 缓动跟随 */
    (function loop() {
      rx += (x - rx) * 0.16;
      ry += (y - ry) * 0.16;
      ring.style.transform = 'translate(' + rx.toFixed(1) + 'px,' + ry.toFixed(1) + 'px)';
      requestAnimationFrame(loop);
    })();
  }

  AKA.cursor = { init: init };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
