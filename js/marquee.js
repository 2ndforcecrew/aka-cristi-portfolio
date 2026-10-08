/* ============================================================
 * AKA.CRISTI — 服务跑马灯（v2.3）
 * 黑底横条，大字无限循环（中英对照），JS rAF 驱动；
 * hover：方形反色透镜跟随鼠标 + 滚动加速；
 * reduced-motion / 粗指针：静止无透镜。
 * ============================================================ */
(function () {
  'use strict';

  var AKA = (window.AKA = window.AKA || {});

  /* 服务项：中英同时显示，无需语言切换 */
  var SERVICES = [
    { zh: 'AKA.CRISTI', en: 'PORTFOLIO', brand: true },
    { zh: '平面设计', en: 'GRAPHIC DESIGN' },
    { zh: '时装摄影', en: 'FASHION PHOTOGRAPHY' },
    { zh: '品牌设计', en: 'BRAND DESIGN' },
    { zh: '画册设计', en: 'BROCHURE DESIGN' },
    { zh: '包装设计', en: 'PACKAGING DESIGN' },
    { zh: '展览设计', en: 'EXHIBITION DESIGN' }
  ];

  var BASE_SPEED = 70;    /* px/s，常速 */
  var HOVER_SPEED = 210;  /* px/s，hover 加速 */

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  var marquee = {
    init: function () {
      var sec = document.querySelector('[data-js="marquee"]');
      if (!sec) return;
      var track = sec.querySelector('[data-js="marquee-track"]');
      var lens = sec.querySelector('[data-js="marquee-lens"]');
      if (!track) return;

      /* 建两组相同序列，无缝循环 */
      function buildSeq() {
        var seq = el('div', 'marquee-seq');
        seq.setAttribute('aria-hidden', 'true');
        SERVICES.forEach(function (s) {
          var item = el('span', 'mq-item');
          var zh = el('span', 'mq-zh' + (s.brand ? ' mq-brand' : ''), s.zh);
          var en = el('span', 'mq-en', s.en);
          item.appendChild(zh);
          item.appendChild(en);
          seq.appendChild(item);
          seq.appendChild(el('span', 'mq-sep', '✦'));
        });
        return seq;
      }
      var seqA = buildSeq();
      seqA.removeAttribute('aria-hidden');
      track.appendChild(seqA);
      track.appendChild(buildSeq());

      var reduced = window.matchMedia &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      var finePointer = window.matchMedia &&
        window.matchMedia('(pointer: fine)').matches;

      var seqW = 0;
      function measure() {
        seqW = seqA.getBoundingClientRect().width || 1;
      }
      measure();
      window.addEventListener('resize', measure);

      /* rAF 驱动：无缝循环 + hover 加速 */
      var offset = 0, speed = BASE_SPEED, targetSpeed = BASE_SPEED, last = 0;
      var hovering = false;
      if (!reduced) {
        sec.addEventListener('mouseenter', function () { hovering = true; });
        sec.addEventListener('mouseleave', function () { hovering = false; });
        (function frame(t) {
          if (!last) last = t;
          var dt = Math.min((t - last) / 1000, 0.1);
          last = t;
          targetSpeed = hovering ? HOVER_SPEED : BASE_SPEED;
          speed += (targetSpeed - speed) * Math.min(dt * 6, 1);
          offset -= speed * dt;
          if (offset <= -seqW) offset += seqW;
          track.style.transform = 'translate3d(' + offset.toFixed(1) + 'px,0,0)';
          requestAnimationFrame(frame);
        })(performance.now());
      }

      /* 反色透镜：跟随鼠标，lerp 缓动 */
      if (lens && finePointer && !reduced) {
        var lx = 0, ly = 0, tx = 0, ty = 0, on = false, started = false;
        sec.addEventListener('mousemove', function (ev) {
          var r = sec.getBoundingClientRect();
          tx = ev.clientX - r.left;
          ty = ev.clientY - r.top;
          if (!on) { on = true; lens.classList.add('is-on'); }
        });
        sec.addEventListener('mouseleave', function () {
          on = false; lens.classList.remove('is-on');
        });
        (function follow(t) {
          if (on || started) {
            started = true;
            lx += (tx - lx) * 0.2;
            ly += (ty - ly) * 0.2;
            lens.style.transform =
              'translate3d(' + (lx - 85).toFixed(1) + 'px,' + (ly - 85).toFixed(1) + 'px,0)';
          }
          requestAnimationFrame(follow);
        })(0);
      }
    }
  };

  AKA.marquee = marquee;
})();
