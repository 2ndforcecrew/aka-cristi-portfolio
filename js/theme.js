/* ============================================================
 * AKA.CRISTI — theme.js（v2.4 黑白主题切换）
 * localStorage['aka-theme'] 持久化（dark/light，默认 light）；
 * <html data-theme="dark"> 驱动 tokens.css 变量覆盖；
 * 防闪烁的初始应用由各页 <head> 内联脚本负责，本文件只管切换。
 * 全部防御性：按钮缺失静默跳过，不抛错。
 * ============================================================ */
(function () {
  'use strict';

  var KEY = 'aka-theme';

  function current() {
    return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
  }

  function apply(t) {
    if (t === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
    try { localStorage.setItem(KEY, t); } catch (e) { /* 忽略 */ }
    syncButtons(t);
  }

  function syncButtons(t) {
    var btns = document.querySelectorAll('[data-js="theme-toggle"]');
    for (var i = 0; i < btns.length; i++) {
      btns[i].setAttribute('aria-pressed', t === 'dark' ? 'true' : 'false');
    }
  }

  function init() {
    syncButtons(current());
    var btns = document.querySelectorAll('[data-js="theme-toggle"]');
    for (var i = 0; i < btns.length; i++) {
      (function (b) {
        b.addEventListener('click', function () {
          apply(current() === 'dark' ? 'light' : 'dark');
        });
      })(btns[i]);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
