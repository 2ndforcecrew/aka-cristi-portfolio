/* ============================================================
 * AKA.CRISTI — i18n.js（中英切换，中文为主）
 * 默认 lang='zh'；localStorage 'aka-lang' 持久化；切换更新 <html lang>。
 * 静态文本：[data-i18n]（innerHTML）/ [data-i18n-ph]（placeholder）。
 * 动态内容：各模块把刷新函数推进 AKA.i18n.onChange。
 * 经典 script，挂 window.AKA；i18n.js 在 data.js 之后、hero.js/main.js 之前引入。
 * ============================================================ */
(function () {
  'use strict';

  var AKA = (window.AKA = window.AKA || {});

  /* ---------- 分类 / 城市映射（未知值原样返回） ---------- */
  var CAT_MAP = {
    'FASHION': '时装', 'PORTRAIT': '肖像', 'EDITORIAL': '编辑',
    'BEAUTY': '美妆', 'CAMPAIGN': '广告大片', 'PERSONAL': '个人创作',
    'BRANDING': '品牌形象', 'POSTER': '海报', 'TYPOGRAPHY': '字体实验',
    'ART DIRECTION': '艺术指导', 'AUTOMOTIVE': '汽车', 'FILM': '概念影像'
  };
  var CITY_MAP = {
    'SHANGHAI': '上海', 'TAIPEI': '台北', 'PARIS': '巴黎',
    'HONG KONG': '香港', 'MILAN': '米兰', 'LONDON': '伦敦',
    'SHENZHEN': '深圳', 'GUANGZHOU': '广州', 'BEIJING': '北京',
    'DONGGUAN': '东莞', 'RIVERSIDE': '江畔'
  };

  /* ---------- 字典（zh/en key 必须完全对应，smoke 校验） ---------- */
  var DICT = {
    zh: {
      'nav.home': '首页', 'nav.work': '作品', 'nav.photo': '摄影', 'nav.design': '设计',
      'nav.about': '关于', 'nav.contact': '联系', 'nav.close': '关闭',
      'hero.scroll': '滚动<br>↓',
      'hero.view': '查看项目 →',
      'hero.t1': 'AKA.CRISTI', 'hero.d1': '暗河巨獸，黑白時裝電影開場。',
      'hero.t2': '霓裳之夜', 'hero.d2': '城市霓虹下的高定時裝大片。',
      'hero.t3': '城市獨白', 'hero.d3': '混凝土森林中的獨白。',
      'hero.t4': 'WAWA ANDROID', 'hero.d4': '未來都市中的仿生時裝。',
      'sec.selected': '精选作品', 'sec.viewAll': '查看全部作品 →',
      'sec.photo': '摄影', 'sec.design': '平面设计',
      'sec.archive': '档案', 'sec.projects': '件作品',
      'sec.statement': '摄影是内容。排印是结构。动态是行为。',
      'sec.aboutIndex': '04 / 06 — 关于', 'sec.contactIndex': '05 / 06 — 联系',
      'about.disc1': '摄影', 'about.disc2': '平面设计',
      'about.disc3': '艺术指导', 'about.disc4': '视觉形象',
      'about.p1': 'AKA.CRISTI 不是传统的摄影师作品集。它是一本先锋时装杂志、一座设计档案馆、一间单一品牌画廊——冷冽、精确、锋利。',
      'about.p2': '作品在两种媒介之间游走：相机追逐光线与姿态；纸张把那种情绪重构成品牌可以留存的视觉语言。镜头捕捉，纸张沉淀。两者共享同一种美学。',
      'about.p3': '从按下快门到最终成品，每一步都在同一只眼睛的控制之下——因为摄影师和设计师，是同一个人。',
      'about2.p1': 'AKA.CRISTI 是藏在两种技艺背后的一只眼睛。相机追逐姿态、面料，以及光线把平凡变昂贵的精确一秒；图版把那一秒拆开，重建成品牌可以拥有的系统——网格、字体、节奏、克制。',
      'about2.p2': '这里没有任何装饰。每一帧都经过丈量；每一种字体在获准上版之前都要接受盘问。摄影是内容，排印是结构，动态是行为。当三者服从同一条规则，结果不需要讨好注意力——它直接下令。',
      'about2.p3': '作品集游走于时装大片、广告影像、品牌形象与字体实验之间。媒介在变，标准不变。从第一帧到最终交付，快门与版式由同一只手控制，因为在这里，精确不是一种风格，它是唯一选项。',
      'about2.p4': '接受委托：拒绝平庸的广告、品牌形象与视觉系统——门开着。',
      'cta.title': '一起做点<br>锋利的<br>东西。',
      'cta.start': '开始一个项目',
      'foot.colophon': '06 / 06 — 刊记',
      'contact.direct': '直接联系 —',
      'contact.name': '姓名', 'contact.email': '邮箱',
      'contact.type': '项目类型', 'contact.msg': '留言',
      'contact.send': '发送询价',
      'contact.errRequired': '必填', 'contact.errEmail': '邮箱格式不正确',
      'proj.info': '项目信息', 'proj.year': '年份', 'proj.client': '客户',
      'proj.loc': '地点', 'proj.cat': '分类', 'proj.credits': '创作团队',
      'proj.series': '图系列', 'proj.desc': '项目描述',
      'proj.ds': '设计系统', 'proj.next': '下一个项目',
      'proj.nextPrefix': '下一个 — ', 'proj.kicker': '项目',
      'proj.nfTitle': '项目<br>未找到',
      'proj.nfNote': '该项目不存在或已被移动。',
      'proj.nfBack': '← 返回首页',
      'proj.nfDoc': '项目未找到 — AKA.CRISTI',
      'filter.all': '全部'
    },
    en: {
      'nav.home': 'Home', 'nav.work': 'Work', 'nav.photo': 'Photography', 'nav.design': 'Design',
      'nav.about': 'About', 'nav.contact': 'Contact', 'nav.close': 'Close',
      'hero.scroll': 'Scroll<br>↓',
      'hero.view': 'VIEW PROJECT →',
      'hero.t1': 'AKA.CRISTI', 'hero.d1': 'River leviathan, a black-and-white fashion film opening.',
      'hero.t2': 'NEON CITY NIGHTS', 'hero.d2': 'Haute couture editorial under city neon.',
      'hero.t3': 'URBAN SOLILOQUY', 'hero.d3': 'A soliloquy in the concrete forest.',
      'hero.t4': 'WAWA ANDROID', 'hero.d4': 'Android couture in the future city.',
      'sec.selected': 'Selected Work', 'sec.viewAll': 'View all work →',
      'sec.photo': 'Photography', 'sec.design': 'Graphic Design',
      'sec.archive': 'ARCHIVE', 'sec.projects': 'PROJECTS',
      'sec.statement': 'Photography is content. Typography is structure. Motion is behaviour.',
      'sec.aboutIndex': '04 / 06 — About', 'sec.contactIndex': '05 / 06 — Contact',
      'about.disc1': 'Photography', 'about.disc2': 'Graphic Design',
      'about.disc3': 'Art Direction', 'about.disc4': 'Visual Identity',
      'about.p1': 'AKA.CRISTI is not a traditional photographer portfolio. It is an avant-garde fashion magazine, a design archive, and a single-brand gallery — cold, precise, and sharp.',
      'about.p2': 'The work moves between two mediums: the camera chases light and posture; paper reconstructs that emotion into a visual language a brand can keep. Lens captures. Paper settles. Both share one aesthetic.',
      'about.p3': 'From shutter to final piece, every step is controlled under the same eye — because the photographer and the designer are the same person.',
      'about2.p1': 'AKA.CRISTI is a single eye behind two disciplines. The camera hunts posture, fabric, and the exact second light turns ordinary into expensive. The drawing board takes that second apart and rebuilds it into a system a brand can own — grids, type, rhythm, restraint.',
      'about2.p2': 'Nothing here is decorated. Every frame is measured; every typeface is interrogated before it is allowed on the page. Photography is content. Typography is structure. Motion is behaviour. When all three obey the same rule, the result does not ask for attention — it commands it.',
      'about2.p3': 'The portfolio moves between fashion editorials, campaign imagery, brand identities, and typographic experiments. The medium changes. The standard does not. From the first frame to the final deliverable, one hand controls the shutter and the layout, because precision is not a style here. It is the only option.',
      'about2.p4': 'For commissions, campaigns, and visual identities that refuse to be ordinary — the door is open.',
      'cta.title': 'Let&rsquo;s make<br>something<br>sharp.',
      'cta.start': 'Start a project',
      'foot.colophon': '06 / 06 — Colophon',
      'contact.direct': 'Direct —',
      'contact.name': 'Name', 'contact.email': 'Email',
      'contact.type': 'Project type', 'contact.msg': 'Message',
      'contact.send': 'Send inquiry',
      'contact.errRequired': 'Required', 'contact.errEmail': 'Invalid email',
      'proj.info': 'Project Information', 'proj.year': 'YEAR', 'proj.client': 'CLIENT',
      'proj.loc': 'LOCATION', 'proj.cat': 'CATEGORY', 'proj.credits': 'CREDITS',
      'proj.series': 'Image Series', 'proj.desc': 'Description',
      'proj.ds': 'Design System', 'proj.next': 'Next Project',
      'proj.nextPrefix': 'Next — ', 'proj.kicker': 'PROJECT',
      'proj.nfTitle': 'PROJECT<br>NOT FOUND',
      'proj.nfNote': 'This project does not exist or was moved.',
      'proj.nfBack': '← Back to index',
      'proj.nfDoc': 'PROJECT NOT FOUND — AKA.CRISTI',
      'filter.all': 'ALL'
    }
  };

  var STORE_KEY = 'aka-lang';
  var lang = 'zh';
  try {
    var saved = window.localStorage.getItem(STORE_KEY);
    if (saved === 'zh' || saved === 'en') lang = saved;
  } catch (e) { /* storage 不可用时默认中文 */ }

  function t(key) {
    var d = DICT[lang] || {};
    if (d[key] != null) return d[key];
    var en = DICT.en || {};
    if (en[key] != null) return en[key];
    return key;
  }
  function cat(c) {
    if (lang === 'en' || c == null) return c;
    return CAT_MAP[c] || c;
  }
  function city(l) {
    if (lang === 'en' || l == null) return l;
    return CITY_MAP[l] || l;
  }

  var onChange = [];

  function syncToggle() {
    var btns = document.querySelectorAll('[data-js="lang-toggle"]');
    for (var i = 0; i < btns.length; i++) {
      (function (btn) {
        /* v2.8：图标版按钮（内含 svg[data-icon]）不重写 innerHTML，只更新无障碍属性；
           否则 syncToggle 会把 inline SVG 图标 wipe 掉 */
        var label = lang === 'zh' ? '切换语言到英文 / Switch language to English'
                                  : 'Switch language to Chinese / 切换语言到中文';
        if (btn.querySelector('svg[data-icon]')) {
          btn.setAttribute('aria-label', label);
          btn.setAttribute('aria-pressed', lang === 'en' ? 'true' : 'false');
          btn.setAttribute('data-lang', lang);
          return;
        }
        btn.innerHTML = '<span class="' + (lang === 'zh' ? 'on' : 'off') + '">中</span>' +
          ' / <span class="' + (lang === 'en' ? 'on' : 'off') + '">EN</span>';
        btn.setAttribute('aria-label', label);
        btn.setAttribute('aria-pressed', lang === 'en' ? 'true' : 'false');
      })(btns[i]);
    }
  }

  function applyStatic() {
    var els = document.querySelectorAll('[data-i18n]');
    for (var i = 0; i < els.length; i++) {
      els[i].innerHTML = t(els[i].getAttribute('data-i18n'));
    }
    var phs = document.querySelectorAll('[data-i18n-ph]');
    for (var j = 0; j < phs.length; j++) {
      phs[j].setAttribute('placeholder', t(phs[j].getAttribute('data-i18n-ph')));
    }
    document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
    syncToggle();
  }

  function setLang(l) {
    if (l !== 'zh' && l !== 'en') return;
    if (l === lang) return;
    lang = l;
    try { window.localStorage.setItem(STORE_KEY, l); } catch (e) {}
    i18n.lang = l;
    if (typeof document !== 'undefined') applyStatic();
    for (var i = 0; i < onChange.length; i++) {
      try { onChange[i](); } catch (e) { /* 单个刷新失败不阻断其他 */ }
    }
  }

  function bindToggle() {
    var btns = document.querySelectorAll('[data-js="lang-toggle"]');
    for (var i = 0; i < btns.length; i++) {
      (function (btn) {
        if (btn.getAttribute('data-i18n-bound')) return;
        btn.setAttribute('data-i18n-bound', '1');
        btn.addEventListener('click', function () {
          setLang(lang === 'zh' ? 'en' : 'zh');
        });
      })(btns[i]);
    }
  }

  var i18n = (AKA.i18n = {
    lang: lang,
    dict: DICT,
    t: t,
    cat: cat,
    city: city,
    setLang: setLang,
    applyStatic: applyStatic,
    onChange: onChange
  });

  /* 无 DOM 环境（测试沙箱）时跳过启动 */
  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function () {
        applyStatic();
        bindToggle();
      });
    } else {
      applyStatic();
      bindToggle();
    }
  }
})();
