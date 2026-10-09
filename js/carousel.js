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
      var isMask = slide.classList.contains('text-mask-slide') || slide.classList.contains('hero-video');
      var h2 = slide.querySelector('h2');
      var p = slide.querySelector('.carousel-caption > p:last-child');
      if (!h2) return;
      var h2Text = h2.getAttribute('data-text') || h2.textContent;
      h2.setAttribute('data-text', h2Text);
      var pText = p ? (p.getAttribute('data-text') || p.textContent) : '';
      if (p) p.setAttribute('data-text', pText);
      /* mask slide：標題不打字（已在形狀中），只打描述 */
      if (!isMask) h2.textContent = '';
      if (p) p.textContent = '';
      var delayT = setTimeout(function () {
        if (isMask) {
          /* 直接打描述 */
          if (p) {
            var pi0 = 0;
            var pTimer0 = setInterval(function () {
              if (pi0 < pText.length) {
                p.textContent += pText.charAt(pi0);
                pi0++;
              } else { clearInterval(pTimer0); }
            }, 60);
            typeTimers.push(pTimer0);
          }
          return;
        }
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
      /* 視頻播放控制（支援雙層視頻） */
      for (var v = 0; v < n; v++) {
        var vids = slides[v].querySelectorAll('video');
        for (var vi = 0; vi < vids.length; vi++) {
          var vid = vids[vi];
          if (v === current) {
            if (vid.paused) { try { vid.play(); } catch (e) {} }
          } else {
            if (!vid.paused) vid.pause();
          }
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

      /* 視頻（支援雙層） */
      for (var v = 0; v < n; v++) {
        var vids2 = slides[v].querySelectorAll('video');
        for (var vi2 = 0; vi2 < vids2.length; vi2++) {
          var vid2 = vids2[vi2];
          if (v === current) {
            if (vid2.paused) { try { vid2.play(); } catch (e) {} }
          } else {
            if (!vid2.paused) vid2.pause();
          }
        }
      }

      /* 動畫結束後整理 */
      setTimeout(function () {
        animating = false;
        render();
        /* 停止舊 slide 的時間軸 */
        stopHeroTimeline(slides[from]);

        /* 新 slide 打字機 + 自動播放 */
        startTypewriter(slides[current]);
        startAutoplay();
        /* 如果是第一張（RIVER），啟動字母散開 */
        if (slides[current].classList.contains('hero-video')) {
          startHeroTimeline(slides[current]);
        }
        /* WAWA：常駐文字遮罩，不關（v2.9.28） */
        inSlide.classList.add('is-active');
        slides[from].classList.remove('is-active');
      }, 650);
    }

    /* Hero Video：字母散開方向（v2.9.26） */
    var HERO_SCATTER = [
      { dx: '-320px', dy: '-220px', r: '-35deg' },
      { dx: '-140px', dy: '-280px', r: '-12deg' },
      { dx: '60px',   dy: '-300px', r: '8deg' },
      { dx: '240px',  dy: '-240px', r: '22deg' },
      { dx: '380px',  dy: '-160px', r: '38deg' },
      { dx: '-360px', dy: '180px',  r: '-28deg' },
      { dx: '-200px', dy: '260px',  r: '-15deg' },
      { dx: '-40px',  dy: '300px',  r: '-5deg' },
      { dx: '120px',  dy: '290px',  r: '10deg' },
      { dx: '280px',  dy: '230px',  r: '25deg' },
      { dx: '-280px', dy: '120px',  r: '-20deg' },
      { dx: '360px',  dy: '140px',  r: '30deg' },
      { dx: '-120px', dy: '-180px', r: '-18deg' },
      { dx: '180px',  dy: '-200px', r: '18deg' },
    ];
    function buildHeroMask(slide) {
      /* WAWA 的字母已在 HTML 寫死（含散開方向），跳過 */
      if (slide.querySelector('#wawa-clip')) return;
      var h2 = slide.querySelector('h2');
      if (!h2) return;
      var text = (h2.getAttribute('data-text') || h2.textContent).trim();
      var words = text.split(/\s+/);
      var lines;
      if (words.length >= 2) {
        var mid = Math.ceil(words.length / 2);
        lines = [words.slice(0, mid).join(''), words.slice(mid).join('')];
      } else {
        lines = [text.replace(/\s+/g, '')];
      }
      var textEls = slide.querySelectorAll('#river-clip text');
      var di = 0;
      for (var li = 0; li < textEls.length && li < lines.length; li++) {
        var html = '';
        for (var ci = 0; ci < lines[li].length; ci++) {
          var d = HERO_SCATTER[di % HERO_SCATTER.length];
          html += '<tspan class="river-letter" style="--dx:' + d.dx + ';--dy:' + d.dy + ';--r:' + d.r + '">' +
            lines[li].charAt(ci).replace(/&/g, '&amp;') + '</tspan>';
          di++;
        }
        textEls[li].innerHTML = html;
      }
    }
    /* Hero 時間軸：0-3s 遮罩 → 3-4.5s 散開 → 4.5s 全片 */
    var heroTimers = [];
    function startHeroTimeline(slide) {
      for (var t = 0; t < heroTimers.length; t++) clearTimeout(heroTimers[t]);
      heroTimers = [];
      slide.classList.remove('scatter', 'mask-off');
      var maskSvg = slide.querySelector('.mask-svg');
      if (maskSvg) { maskSvg.style.display = ''; }
      /* 雙視頻同步 */
      var fullVid = slide.querySelector('.full-video');
      var maskVid = slide.querySelector('.mask-svg video');
      if (fullVid && maskVid) {
        try { fullVid.currentTime = maskVid.currentTime || 0; } catch (e) {}
      }
      heroTimers.push(setTimeout(function () {
        slide.classList.add('scatter'); /* 3s：字母散開 */
      }, 3000));
      heroTimers.push(setTimeout(function () {
        slide.classList.add('mask-off'); /* 4.5s：全片 */
        heroTimers.push(setTimeout(function () {
          if (maskSvg) maskSvg.style.display = 'none';
        }, 1100));
      }, 4500));
    }
    function stopHeroTimeline(slide) {
      for (var t = 0; t < heroTimers.length; t++) clearTimeout(heroTimers[t]);
      heroTimers = [];
      if (slide) slide.classList.remove('scatter', 'mask-off');
    }
    /* Mouse Parallax（v2.9.26） */
    function initParallax(root, slide) {
      var layer = slide.querySelector('.mask-parallax');
      var fullVid = slide.querySelector('.full-video');
      if (!layer) return;
      var raf = null;
      root.addEventListener('mousemove', function (e) {
        if (raf) return;
        raf = requestAnimationFrame(function () {
          raf = null;
          var r = root.getBoundingClientRect();
          var nx = (e.clientX - r.left) / r.width - 0.5;
          var ny = (e.clientY - r.top) / r.height - 0.5;
          layer.style.transform = 'translate(' + (-nx * 40).toFixed(1) + 'px,' + (-ny * 40).toFixed(1) + 'px)';
          if (fullVid) fullVid.style.transform = 'translate(' + (nx * 20).toFixed(1) + 'px,' + (ny * 20).toFixed(1) + 'px) scale(1.05)';
        });
      });
    }
    /* WAWA：3秒後關遮罩（v2.9.25） */
    var wawaTimers = [];
    function startWawaMaskOff(slide) {
      for (var t = 0; t < wawaTimers.length; t++) clearTimeout(wawaTimers[t]);
      wawaTimers = [];
      slide.classList.remove('mask-off');
      var maskSvg = slide.querySelector('.mask-svg');
      var fullVid = slide.querySelector('.full-video');
      var maskVid = slide.querySelector('.mask-svg video');
      if (maskSvg) { maskSvg.style.display = ''; maskSvg.style.opacity = ''; }
      if (fullVid) fullVid.style.opacity = '';
      /* 同步雙視頻 */
      if (fullVid && maskVid) {
        try { fullVid.currentTime = maskVid.currentTime || 0; } catch (e) {}
      }
      wawaTimers.push(setTimeout(function () {
        slide.classList.add('mask-off');
        wawaTimers.push(setTimeout(function () {
          if (maskSvg) maskSvg.style.display = 'none';
        }, 900));
      }, 3000));
    }
    function stopWawaMaskOff(slide) {
      for (var t = 0; t < wawaTimers.length; t++) clearTimeout(wawaTimers[t]);
      wawaTimers = [];
      if (slide) slide.classList.remove('mask-off');
    }

    function next() { return goTo(current + 1); }
    function prev() { return goTo(current - 1); }

    /* 自動播放：視頻播完切下一個，圖片停 6 秒，最後一張停不循環（v2.9.19） */
    var autoTimer = null;
    function stopAutoplay() {
      if (autoTimer) { clearTimeout(autoTimer); autoTimer = null; }
      for (var i = 0; i < n; i++) {
        var vs = slides[i].querySelectorAll('video');
        for (var vii = 0; vii < vs.length; vii++) {
          if (slides[i]._autoEnded) {
            vs[vii].removeEventListener('ended', slides[i]._autoEnded);
          }
        }
        slides[i]._autoEnded = null;
      }
    }
    function startAutoplay() {
      stopAutoplay();
      if (current >= n - 1) return; /* 最後一張：停，不循環 */
      var slide = slides[current];
      var vid = slide.querySelector('video');
      if (vid) {
        var onEnded = function () {
          var vs2 = slide.querySelectorAll('video');
          for (var q = 0; q < vs2.length; q++) vs2[q].removeEventListener('ended', onEnded);
          slides[current]._autoEnded = null;
          if (current < n - 1) goTo(current + 1);
        };
        slide._autoEnded = onEnded;
        /* 雙層視頻都監聽 ended */
        var vidsAll = slide.querySelectorAll('video');
        for (var qq = 0; qq < vidsAll.length; qq++) vidsAll[qq].addEventListener('ended', onEnded);
      } else {
        autoTimer = setTimeout(function () {
          if (current < n - 1) goTo(current + 1);
        }, 6000);
      }
    }

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
    /* 第一張：構建 RIVER 字母遮罩 */
    var heroSlides = root.querySelectorAll('.hero-video');
    for (var hs = 0; hs < heroSlides.length; hs++) {
      buildHeroMask(heroSlides[hs]);
      initParallax(root, heroSlides[hs]);
    }
    var heroSlide = heroSlides[0];
    startTypewriter(slides[0]);
    startAutoplay();
    if (heroSlide && slides[0] === heroSlide) startHeroTimeline(slides[0]);

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
