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
  AKA.DESIGN_CATS = ['BRANDING', 'POSTER', 'ART DIRECTION', 'TYPOGRAPHY', 'EDITORIAL', 'AUTOMOTIVE', 'EXPERIMENTAL'];

  AKA.WORKS = [
    /* ---------------- PHOTOGRAPHY ---------------- */
    {
      id: 'neon-city-nights', kind: 'photo', category: 'FASHION',
      title: '霓裳之夜', titleEn: 'NEON CITY NIGHTS', year: '2025',
      client: 'ATELIER NOIR', location: 'SHANGHAI',
      cover: 'assets/img/photo-01.jpg', hero: 'assets/img/photo-01.jpg',
      gallery: ['assets/img/photo-01.jpg'],
      description: '霓虹与丝绸的城市夜曲。',
      credits: 'PHOTOGRAPHY — AKA.CRISTI'
    },
    {
      id: 'urban-soliloquy', kind: 'photo', category: 'PORTRAIT',
      title: '都市独白', titleEn: 'URBAN SOLILOQUY', year: '2025',
      client: '—', location: 'TAIPEI',
      cover: 'assets/img/photo-02.jpg', hero: 'assets/img/photo-02.jpg',
      gallery: ['assets/img/photo-02.jpg'],
      description: '一个人在城市里的安静时刻。',
      credits: 'PHOTOGRAPHY — AKA.CRISTI'
    },
    {
      id: 'dreamweaver', kind: 'photo', category: 'EDITORIAL',
      title: '织梦者', titleEn: 'DREAMWEAVER', year: '2024',
      client: 'VELVET MAGAZINE', location: 'PARIS',
      cover: 'assets/img/photo-03.jpg', hero: 'assets/img/photo-03.jpg',
      gallery: ['assets/img/photo-03.jpg'],
      description: '为 VELVET 拍摄的时装大片。',
      credits: 'PHOTOGRAPHY — AKA.CRISTI'
    },
    {
      id: 'prism-echo', kind: 'photo', category: 'BEAUTY',
      title: '棱镜回响', titleEn: 'PRISM ECHO', year: '2024',
      client: 'LUMIÈRE BEAUTY', location: 'HONG KONG',
      cover: 'assets/img/photo-04.jpg', hero: 'assets/img/photo-04.jpg',
      gallery: ['assets/img/photo-04.jpg'],
      description: '光在皮肤上的折射实验。',
      credits: 'PHOTOGRAPHY — AKA.CRISTI'
    },
    {
      id: 'morning-mist', kind: 'photo', category: 'CAMPAIGN',
      title: '晨雾时装', titleEn: 'MORNING MIST', year: '2023',
      client: 'MAISON BRUME', location: 'MILAN',
      cover: 'assets/img/bw-01.jpg', hero: 'assets/img/bw-01.jpg',
      gallery: ['assets/img/bw-01.jpg'],
      description: '黑白、高对比、硬光。Campaign 占位系列。',
      credits: 'PHOTOGRAPHY — AKA.CRISTI'
    },
    {
      id: 'haute-silhouette', kind: 'photo', category: 'PERSONAL',
      title: '高定剪影', titleEn: 'HAUTE SILHOUETTE', year: '2023',
      client: 'PERSONAL', location: 'LONDON',
      cover: 'assets/img/bw-02.jpg', hero: 'assets/img/bw-02.jpg',
      gallery: ['assets/img/bw-02.jpg'],
      description: '个人创作：硬光下的人像雕塑。',
      credits: 'PHOTOGRAPHY — AKA.CRISTI'
    },
    /* ---------------- GRAPHIC DESIGN ---------------- */
    {
      id: 'street-brand-identity', kind: 'design', category: 'BRANDING',
      title: '潮牌视觉系统', titleEn: 'STREET BRAND IDENTITY', year: '2025',
      client: 'CONCRETE SUPPLY', location: 'SHENZHEN',
      cover: 'assets/img/design-01.svg', hero: 'assets/img/design-01.svg',
      gallery: ['assets/img/design-01.svg'],
      description: '潮牌全套视觉识别占位。',
      credits: 'ART DIRECTION — AKA.CRISTI'
    },
    {
      id: 'editorial-covers', kind: 'design', category: 'EDITORIAL',
      title: '杂志封面设计', titleEn: 'EDITORIAL COVERS', year: '2025',
      client: 'PULSE WEEKLY', location: 'GUANGZHOU',
      cover: 'assets/img/design-02.svg', hero: 'assets/img/design-02.svg',
      gallery: ['assets/img/design-02.svg'],
      description: '杂志封面系列占位。',
      credits: 'DESIGN — AKA.CRISTI'
    },
    {
      id: 'festival-posters', kind: 'design', category: 'POSTER',
      title: '音乐节海报', titleEn: 'FESTIVAL POSTERS', year: '2024',
      client: 'VOLT FEST', location: 'SHANGHAI',
      cover: 'assets/img/design-03.svg', hero: 'assets/img/design-03.svg',
      gallery: ['assets/img/design-03.svg'],
      description: '音乐节海报系列占位。',
      credits: 'DESIGN — AKA.CRISTI'
    },
    {
      id: 'type-experiments', kind: 'design', category: 'TYPOGRAPHY',
      title: '排印实验', titleEn: 'TYPE EXPERIMENTS', year: '2024',
      client: 'PERSONAL', location: '—',
      cover: 'assets/img/design-04.svg', hero: 'assets/img/design-04.svg',
      gallery: ['assets/img/design-04.svg'],
      description: '排印实验占位。',
      credits: 'DESIGN — AKA.CRISTI'
    },
    {
      id: 'exhibition-visual', kind: 'design', category: 'ART DIRECTION',
      title: '展览视觉', titleEn: 'EXHIBITION VISUAL', year: '2023',
      client: 'GRAY BOX GALLERY', location: 'BEIJING',
      cover: 'assets/img/design-05.svg', hero: 'assets/img/design-05.svg',
      gallery: ['assets/img/design-05.svg'],
      description: '展览视觉系统占位。',
      credits: 'ART DIRECTION — AKA.CRISTI'
    },
    {
      id: 'packaging-design', kind: 'design', category: 'AUTOMOTIVE',
      title: '包装设计', titleEn: 'PACKAGING DESIGN', year: '2023',
      client: 'APEX MOTORS', location: 'DONGGUAN',
      cover: 'assets/img/design-06.svg', hero: 'assets/img/design-06.svg',
      gallery: ['assets/img/design-06.svg'],
      description: '汽车品牌包装占位（GTR34 式全案在第二阶段展开）。',
      credits: 'DESIGN — AKA.CRISTI'
    }
  ];

  /* hero 用 6 张 photography（spec §46：6–10 slides） */
  AKA.HERO_WORKS = AKA.WORKS.filter(function (w) { return w.kind === 'photo'; });
})();
