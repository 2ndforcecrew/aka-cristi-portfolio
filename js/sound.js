/* ============================================================
 * AKA.CRISTI — 导航科技感音效（用户需求）
 * WebAudio 原生合成，零外部音频文件。
 *   hover：sine 660→990Hz / 70ms / gain .05
 *   click：sine 440→880Hz / 90ms / gain .07
 * 只在 pointer:fine 设备启用；footer 开关 localStorage 'aka-sound'
 * 持久化，默认 ON。经典 script，挂 window.AKA.sound。
 * ============================================================ */
(function () {
  'use strict';

  var KEY = 'aka-sound';
  var enabled = true;
  try {
    enabled = window.localStorage.getItem(KEY) !== 'off';
  } catch (e) { /* storage 不可用时默认开 */ }

  function syncBtn(btn) {
    btn.textContent = enabled ? 'SOUND ON' : 'SOUND OFF';
    btn.setAttribute('aria-pressed', enabled ? 'true' : 'false');
  }

  function setEnabled(on) {
    enabled = !!on;
    try { window.localStorage.setItem(KEY, enabled ? 'on' : 'off'); } catch (e) {}
    var btn = document.querySelector('[data-js="sound-toggle"]');
    if (btn) syncBtn(btn);
  }

  /* AudioContext 懒初始化：首次手势（hover/click）时创建并 resume */
  var ctx = null;
  function ac() {
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    if (!ctx) ctx = new AC();
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function blip(f0, f1, dur, vol) {
    if (!enabled) return;
    var c = ac();
    if (!c) return;
    var t = c.currentTime;
    var o = c.createOscillator();
    var g = c.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(f0, t);
    o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g);
    g.connect(c.destination);
    o.start(t);
    o.stop(t + dur + 0.05);
  }

  function bindNav() {
    var links = document.querySelectorAll('.site-nav a, .mobile-menu nav a');
    for (var i = 0; i < links.length; i++) {
      (function (a) {
        a.addEventListener('mouseenter', function () { blip(660, 990, 0.07, 0.05); });
        a.addEventListener('click', function () { blip(440, 880, 0.09, 0.07); });
      })(links[i]);
    }
  }

  function bindToggle() {
    var btn = document.querySelector('[data-js="sound-toggle"]');
    if (!btn) return;
    syncBtn(btn);
    btn.addEventListener('click', function () { setEnabled(!enabled); });
  }

  var fine = !!(window.matchMedia && window.matchMedia('(pointer:fine)').matches);
  if (fine) bindNav(); /* 粗指针设备不启用 hover 音效 */
  bindToggle();

  window.AKA = window.AKA || {};
  window.AKA.sound = {
    isEnabled: function () { return enabled; },
    setEnabled: setEnabled
  };
})();
