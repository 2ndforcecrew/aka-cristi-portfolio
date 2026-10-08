/* ============================================================
 * AKA.CRISTI — 页面转场（spec §40）
 * 拦截站内 4 页之间的跳转：ink 面板从底部 wipe 进入（350ms）
 * → 中央 A 标闪现（~200ms）→ 跳转 → 新页面（同源 referrer）
 * 面板从顶部 wipe 退出（350ms）。总计 500–700ms。
 * 页内锚点不拦截；prefers-reduced-motion 直接跳转；前进/后退走
 * 原生导航，不卡死。经典 script，挂 window.AKA.transition。
 * ============================================================ */
(function () {
  'use strict';

  var AKA = (window.AKA = window.AKA || {});

  var PAGES = ['index.html', 'project.html', 'about.html', 'contact.html'];
  var COVER_MS = 350;   /* 面板进入 */
  var FLASH_MS = 200;   /* A 标闪现 */
  var SAFETY_MS = 1600; /* 兜底：超时强制跳转 */

  var reduced = !!(
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );

  function fileOf(pathname) {
    var f = String(pathname || '').split('/').pop();
    return f || 'index.html';
  }

  /* 该链接是否走转场；返回目标 URL 或 null */
  function shouldIntercept(a) {
    var href = a.getAttribute('href');
    if (!href || href.charAt(0) === '#') return null; /* 页内锚点 */
    if (/^(mailto|tel|sms|javascript):/i.test(href)) return null;
    if (a.target === '_blank') return null;
    var url;
    try {
      url = new URL(href, location.href);
    } catch (e) {
      return null;
    }
    if (url.origin !== location.origin) return null; /* 外链 */
    if (PAGES.indexOf(fileOf(url.pathname)) === -1) return null;
    var cur = fileOf(location.pathname);
    var tgt = fileOf(url.pathname);
    if (tgt === cur && url.pathname === location.pathname && url.hash) return null; /* 同页锚点 */
    if (tgt === cur && !url.search && !url.hash) return null; /* 同页无操作 */
    return url.href;
  }

  function go(url) {
    if (reduced) {
      location.href = url;
      return;
    }
    var panel = document.createElement('div');
    panel.className = 'page-wipe';
    panel.setAttribute('aria-hidden', 'true');
    var aImg = document.createElement('img');
    aImg.className = 'page-wipe-a';
    aImg.src = 'assets/logo/aka-cristi-white.png?v=2.8.4'; /* ink 黑底，用白版笔触 LOGO */
    aImg.alt = '';
    aImg.setAttribute('aria-hidden', 'true');
    document.body.appendChild(panel);
    document.body.appendChild(aImg);
    void panel.offsetWidth; /* 回流，确保初态生效 */

    var done = false;
    function nav() {
      if (done) return;
      done = true;
      location.href = url;
    }

    panel.classList.add('is-cover');
    window.setTimeout(function () {
      aImg.classList.add('is-show');
      window.setTimeout(nav, FLASH_MS);
    }, COVER_MS);
    window.setTimeout(nav, SAFETY_MS); /* 兜底：动画异常也不卡死 */
  }

  /* 进入：同源 referrer → 面板盖在顶部，随后 wipe 退出 */
  function entrance() {
    if (reduced) return;
    var ref = document.referrer;
    if (!ref) return;
    try {
      if (new URL(ref).origin !== location.origin) return;
    } catch (e) {
      return;
    }
    var panel = document.createElement('div');
    panel.className = 'page-wipe';
    panel.setAttribute('aria-hidden', 'true');
    panel.style.transform = 'translateY(0)'; /* 起始：全覆盖 */
    document.body.appendChild(panel);
    void panel.offsetWidth;
    panel.classList.add('is-leave');
    panel.style.transform = '';
    function remove() {
      if (panel.parentNode) panel.parentNode.removeChild(panel);
    }
    panel.addEventListener('transitionend', remove, { once: true });
    window.setTimeout(remove, 700); /* 兜底 */
  }

  function init() {
    document.addEventListener('click', function (ev) {
      if (ev.button !== 0) return;
      if (ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey) return;
      var t = ev.target;
      var a = t && t.closest ? t.closest('a') : null;
      if (!a) return;
      var url = shouldIntercept(a);
      if (!url) return;
      ev.preventDefault();
      go(url);
    });
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', entrance);
    } else {
      entrance();
    }
  }

  AKA.transition = { init: init, shouldIntercept: shouldIntercept };
  init();
})();
