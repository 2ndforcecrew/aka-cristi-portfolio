/* ============================================================
 * AKA.CRISTI — data.js
 * 作品数据（spec §44 字段，对齐 WP 阶段 ACF 字段组，见 README 映射表）。
 * title 沿用 cristi-portfolio 原 repo；category 按 AKA 新分类体系重映射。
 * gallery 第一阶段为 [cover]（详情页在第二阶段展开）。
 * 全部挂 window.AKA；经典 script 引入，禁 ES module。
 * ============================================================ */
(function () {
  'use strict';

  var AKA = (window.AKA = window.AKA || {});

  /* 分类集合（smoke 校验用） */
  AKA.PHOTO_CATS = ['FASHION', 'EDITORIAL', 'PORTRAIT', 'CAMPAIGN', 'BEAUTY', 'PERSONAL'];
  AKA.DESIGN_CATS = ['BRANDING', 'POSTER', 'ART DIRECTION', 'TYPOGRAPHY', 'EDITORIAL', 'AUTOMOTIVE'];

  AKA.WORKS = [
    /* ---------------- 概念影像（v2.7-B：首屏轮播开场即视频） ---------------- */
    {
      id: 'river-leviathan', kind: 'video', category: 'FILM',
      title: '江雾巨兽', titleEn: 'RIVER LEVIATHAN', year: '2026',
      client: 'PERSONAL', location: 'RIVERSIDE',
      cover: 'assets/video/river-leviathan-poster.jpg',
      hero: 'assets/video/river-leviathan-poster.jpg',
      video: 'assets/video/river-leviathan.mp4',
      poster: 'assets/video/river-leviathan-poster.jpg',
      description: '黑白概念短片——巨兽自城市江雾中浮现，一镜十秒。',
      descEn: 'B&W concept short — a leviathan surfacing through urban river mist, one ten-second take.',
      gallery: ['assets/video/river-leviathan-poster.jpg'],
      credits: 'FILM — AKA.CRISTI',
      tone: 'dark'
    },
    /* ---------------- PHOTOGRAPHY ---------------- */
    {
      id: 'neon-city-nights', kind: 'photo', category: 'FASHION',
      title: '霓裳之夜', titleEn: 'NEON CITY NIGHTS', year: '2025',
      client: 'ATELIER NOIR', location: 'SHANGHAI',
      cover: 'assets/img/photo-01.jpg', hero: 'assets/img/hero-neon-01.jpg',
      gallery: ['assets/img/photo-01.jpg'],
      description: '城市霓虹下的高定时装大片，以胶片颗粒还原夜晚的迷离质感。',
      descEn: 'A haute couture editorial under city neon, with film grain restoring the haze of the night.',
      credits: 'PHOTOGRAPHY — AKA.CRISTI'
    },
    {
      id: 'urban-soliloquy', kind: 'photo', category: 'PORTRAIT',
      title: '都市独白', titleEn: 'URBAN SOLILOQUY', year: '2025',
      client: '—', location: 'TAIPEI',
      cover: 'assets/img/photo-02.jpg', hero: 'assets/img/hero-urban-02.jpg',
      gallery: ['assets/img/photo-02.jpg'],
      description: '黑白街头系列，用硬光与阴影讲述都市人的内心独白。',
      descEn: 'A black-and-white street series — hard light and shadow telling the inner monologue of city dwellers.',
      credits: 'PHOTOGRAPHY — AKA.CRISTI'
    },
    {
      id: 'dreamweaver', kind: 'photo', category: 'EDITORIAL',
      title: '织梦者', titleEn: 'DREAMWEAVER', year: '2024',
      client: 'VELVET MAGAZINE', location: 'PARIS',
      cover: 'assets/img/photo-03.jpg', hero: 'assets/img/hero-dream-03.jpg',
      gallery: ['assets/img/photo-03.jpg'],
      description: '棚内概念大片，流动的纱幔与高饱和色彩编织出一场梦境。',
      descEn: 'A studio concept editorial where flowing veils and saturated colors weave a dream.',
      credits: 'PHOTOGRAPHY — AKA.CRISTI'
    },
    {
      id: 'prism-echo', kind: 'photo', category: 'BEAUTY',
      title: '棱镜回响', titleEn: 'PRISM ECHO', year: '2024',
      client: 'LUMIÈRE BEAUTY', location: 'HONG KONG',
      cover: 'assets/img/photo-04.jpg', hero: 'assets/img/hero-prism-04.jpg',
      gallery: ['assets/img/photo-04.jpg'],
      description: '棱镜折射实验系列，探索光影在面部妆容上的二次创作。',
      descEn: 'A prism-refraction experiment series exploring a second creation of light and shadow on makeup.',
      credits: 'PHOTOGRAPHY — AKA.CRISTI'
    },
    {
      id: 'morning-mist', kind: 'photo', category: 'CAMPAIGN', tone: 'light',
      title: '晨雾时装', titleEn: 'MORNING MIST', year: '2023',
      client: 'MAISON BRUME', location: 'MILAN',
      cover: 'assets/img/bw-01.jpg', hero: 'assets/img/bw-01.jpg',
      gallery: ['assets/img/bw-01.jpg'],
      description: '清晨薄雾中的外景时装，自然光下的克制与高级感。',
      descEn: 'An outdoor fashion story in morning mist — restraint and sophistication in natural light.',
      credits: 'PHOTOGRAPHY — AKA.CRISTI'
    },
    {
      id: 'haute-silhouette', kind: 'photo', category: 'PERSONAL', tone: 'light',
      title: '高定剪影', titleEn: 'HAUTE SILHOUETTE', year: '2023',
      client: 'PERSONAL', location: 'LONDON',
      cover: 'assets/img/bw-02.jpg', hero: 'assets/img/bw-02.jpg',
      gallery: ['assets/img/bw-02.jpg'],
      description: '极简剪影系列，以轮廓线条致敬高定时装的建筑感。',
      descEn: 'A minimalist silhouette series saluting the architectural quality of haute couture through contour lines.',
      credits: 'PHOTOGRAPHY — AKA.CRISTI'
    },
    {
      id: 'sculpted-void', kind: 'photo', category: 'FASHION',
      title: '雕塑虚空', titleEn: 'SCULPTED VOID', year: '2025',
      client: 'ATELIER NOIR', location: 'SHANGHAI',
      cover: 'assets/img/photo-05.jpg', hero: 'assets/img/photo-05.jpg',
      gallery: ['assets/img/photo-05.jpg'],
      description: '雕塑感廓形与冷冽混凝土空间的对话，极简中的力量感。',
      descEn: 'A dialogue between sculptural silhouettes and cold concrete space — power in minimalism.',
      credits: 'PHOTOGRAPHY — AKA.CRISTI'
    },
    {
      id: 'androgynous-gaze', kind: 'photo', category: 'PORTRAIT',
      title: '中性凝视', titleEn: 'ANDROGYNOUS GAZE', year: '2025',
      client: '—', location: 'BERLIN',
      cover: 'assets/img/photo-06.jpg', hero: 'assets/img/photo-06.jpg',
      gallery: ['assets/img/photo-06.jpg'],
      description: '戏剧性侧光下的中性面孔，深影中透出的疏离与冷峻。',
      descEn: 'An androgynous face under dramatic side light — detachment and coldness emerging from deep shadow.',
      credits: 'PHOTOGRAPHY — AKA.CRISTI'
    },
    {
      id: 'liquid-skin', kind: 'photo', category: 'BEAUTY',
      title: '液态肌肤', titleEn: 'LIQUID SKIN', year: '2024',
      client: 'LUMIÈRE BEAUTY', location: 'TOKYO',
      cover: 'assets/img/photo-07.jpg', hero: 'assets/img/photo-07.jpg',
      gallery: ['assets/img/photo-07.jpg'],
      description: '水珠覆盖下的先锋妆容微距，探索肌肤的液态质感。',
      descEn: 'Macro of avant-garde makeup under water droplets — exploring the liquid texture of skin.',
      credits: 'PHOTOGRAPHY — AKA.CRISTI'
    },
    {
      id: 'neon-alley', kind: 'photo', category: 'EDITORIAL',
      title: '霓虹巷弄', titleEn: 'NEON ALLEY', year: '2024',
      client: 'VELVET MAGAZINE', location: 'HONG KONG',
      cover: 'assets/img/photo-08.jpg', hero: 'assets/img/photo-08.jpg',
      gallery: ['assets/img/photo-08.jpg'],
      description: '深夜巷弄里的廓形大衣，霓虹光晕下的电影感街头时装。',
      descEn: 'An oversized coat in a midnight alley — cinematic street fashion under neon glow.',
      credits: 'PHOTOGRAPHY — AKA.CRISTI'
    },
    {
      id: 'ethereal-drift', kind: 'photo', category: 'CAMPAIGN',
      title: '空灵漂流', titleEn: 'ETHEREAL DRIFT', year: '2023',
      client: 'MAISON BRUME', location: 'PARIS',
      cover: 'assets/img/photo-09.jpg', hero: 'assets/img/photo-09.jpg',
      gallery: ['assets/img/photo-09.jpg'],
      description: '半透明纱幔包裹下的空灵瞬间，柔光中的漂流梦境。',
      descEn: 'An ethereal moment wrapped in translucent veils — a drifting dream in soft light.',
      credits: 'PHOTOGRAPHY — AKA.CRISTI'
    },
    {
      id: 'brutalist-form', kind: 'photo', category: 'PERSONAL', tone: 'light',
      title: '野兽形态', titleEn: 'BRUTALIST FORM', year: '2023',
      client: 'PERSONAL', location: 'LONDON',
      cover: 'assets/img/photo-10.jpg', hero: 'assets/img/photo-10.jpg',
      gallery: ['assets/img/photo-10.jpg'],
      description: '几何建筑立面前的剪影，粗野主义背景下的图形化时装。',
      descEn: 'A silhouette against geometric facades — graphic fashion on brutalist background.',
      credits: 'PHOTOGRAPHY — AKA.CRISTI'
    },
    /* ---------------- GRAPHIC DESIGN ---------------- */
    {
      id: 'street-brand-identity', kind: 'design', category: 'BRANDING',
      title: '潮牌视觉系统', titleEn: 'STREET BRAND IDENTITY', year: '2025',
      client: 'CONCRETE SUPPLY', location: 'SHENZHEN',
      cover: 'assets/img/design-01.svg', hero: 'assets/img/design-01.svg',
      gallery: ['assets/img/design-01.svg'],
      description: '街头潮牌完整视觉系统：Logo、辅助图形与全套应用延展。',
      descEn: 'A complete visual identity for a streetwear label: logo, graphic system and full applications.',
      credits: 'ART DIRECTION — AKA.CRISTI'
    },
    {
      id: 'editorial-covers', kind: 'design', category: 'EDITORIAL',
      title: '杂志封面设计', titleEn: 'EDITORIAL COVERS', year: '2025',
      client: 'PULSE WEEKLY', location: 'GUANGZHOU',
      cover: 'assets/img/design-02.svg', hero: 'assets/img/design-02.svg',
      gallery: ['assets/img/design-02.svg'],
      description: '时尚杂志封面系列，大胆的网格排版与字体对比。',
      descEn: 'A fashion magazine cover series with bold grid layouts and typographic contrast.',
      credits: 'DESIGN — AKA.CRISTI'
    },
    {
      id: 'festival-posters', kind: 'design', category: 'POSTER',
      title: '音乐节海报', titleEn: 'FESTIVAL POSTERS', year: '2024',
      client: 'VOLT FEST', location: 'SHANGHAI',
      cover: 'assets/img/design-03.svg', hero: 'assets/img/design-03.svg',
      gallery: ['assets/img/design-03.svg'],
      description: '电子音乐节主视觉海报，迷幻色彩与故障艺术的碰撞。',
      descEn: 'Key visuals for an electronic music festival — psychedelic color meets glitch art.',
      credits: 'DESIGN — AKA.CRISTI'
    },
    {
      id: 'type-experiments', kind: 'design', category: 'TYPOGRAPHY',
      title: '排印实验', titleEn: 'TYPE EXPERIMENTS', year: '2024',
      client: 'PERSONAL', location: '—',
      cover: 'assets/img/design-04.svg', hero: 'assets/img/design-04.svg',
      gallery: ['assets/img/design-04.svg'],
      description: '中文排印实验，以解构字形探索文字的视觉张力。',
      descEn: 'Chinese typography experiments exploring the visual tension of deconstructed letterforms.',
      credits: 'DESIGN — AKA.CRISTI'
    },
    {
      id: 'exhibition-visual', kind: 'design', category: 'ART DIRECTION',
      title: '展览视觉', titleEn: 'EXHIBITION VISUAL', year: '2023',
      client: 'GRAY BOX GALLERY', location: 'BEIJING',
      cover: 'assets/img/design-05.svg', hero: 'assets/img/design-05.svg',
      gallery: ['assets/img/design-05.svg'],
      description: '摄影展主视觉与空间导视系统设计。',
      descEn: 'Key visual and spatial wayfinding for a photography exhibition.',
      credits: 'ART DIRECTION — AKA.CRISTI'
    },
    {
      id: 'packaging-design', kind: 'design', category: 'AUTOMOTIVE',
      title: '包装设计', titleEn: 'PACKAGING DESIGN', year: '2023',
      client: 'APEX MOTORS', location: 'DONGGUAN',
      cover: 'assets/img/design-06.svg', hero: 'assets/img/design-06.svg',
      gallery: ['assets/img/design-06.svg'],
      description: '小众香氛品牌包装设计，极简主义下的材质实验。',
      descEn: 'Packaging for a niche fragrance brand — material experiments under minimalism.',
      credits: 'DESIGN — AKA.CRISTI'
    }
  ];

  /* hero 3 张（v2.8.7：用户要求从 7 张减到 3 张）：视频开场 + 2 张新 AI 图 */
  AKA.HERO_WORKS = AKA.WORKS.filter(function (w) {
    return w.id === 'river-leviathan' || w.id === 'neon-city-nights' || w.id === 'urban-soliloquy';
  });

  /* 图片 helper（Phase 2，§43）：jpg → <picture> webp 优先 + jpg fallback；
     svg / 其他原样返回 <img>。供 hero.js / main.js / project.js 共用。 */
  AKA.picture = function (src, alt, opts) {
    opts = opts || {};
    var img = document.createElement('img');
    img.src = src;
    img.alt = alt || '';
    img.decoding = 'async';
    img.loading = opts.eager ? 'eager' : 'lazy';
    if (opts.eager) img.fetchPriority = 'high';
    if (!/\.jpe?g$/i.test(src)) return img;
    var pic = document.createElement('picture');
    var s = document.createElement('source');
    s.type = 'image/webp';
    s.srcset = src.replace(/\.jpe?g$/i, '.webp');
    pic.appendChild(s);
    pic.appendChild(img);
    return pic;
  };
})();
