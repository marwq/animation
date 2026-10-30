// Оформление в стиле «animal hospital long»: дневной фон с травой, тени, искры,
// пыль, дым превращения, золотые лучи, жилка злости, пар, пот, звёздочки, блеск.
// Никакого текста, HUD и линий скорости.
'use strict';

const FX = (() => {
  // детерминированный «рандом», чтобы каждый рендер был одинаковым
  const rng = (seed) => () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
  const TAU = Math.PI * 2;
  const ease = (t) => 1 - Math.pow(1 - Math.max(0, Math.min(1, t)), 3);

  // Фон: небо (голубое -> светлое -> тёплое у горизонта), трава с чёрной кромкой и
  // травинками, ступенчатый край, под ним пиксельная земля. edge — верх травы.
  function background(w, h, edge, opts = {}) {
    const margin = 80;
    const c = document.createElement('canvas');
    c.width = w + 2 * margin; c.height = h + 2 * margin;
    const g = c.getContext('2d');
    g.translate(margin, margin);
    const sky = g.createLinearGradient(0, -margin, 0, edge);
    const [top, mid, low] = opts.sky || ['#3d9cf0', '#a9c0f1', '#f2c8b3'];
    sky.addColorStop(0, top); sky.addColorStop(0.55, mid); sky.addColorStop(1, low);
    g.fillStyle = sky; g.fillRect(-margin, -margin, c.width, edge + margin + 4);
    const r = rng(opts.seed || 11);
    // нижний ступенчатый край травы
    const steps = [];
    for (let x = -margin; x < w + margin; ) {
      const sw = 60 + Math.floor(r() * 4) * 22;
      steps.push([x, sw, edge + 95 + Math.floor(r() * 4) * 22]);
      x += sw;
    }
    // земля
    g.fillStyle = '#a3622c'; g.fillRect(-margin, edge + 60, c.width, h + margin - edge);
    const B = 34;
    for (let y = edge + 60; y < h + margin; y += B) {
      for (let x = -margin; x < w + margin; x += B) {
        const v = r();
        if (v < 0.22) { g.fillStyle = '#8d5224'; g.fillRect(x, y, B, B); }
        else if (v < 0.3) { g.fillStyle = '#b5743a'; g.fillRect(x, y, B, B); }
      }
    }
    // трава: заливка до ступенек
    g.beginPath();
    g.moveTo(-margin, edge);
    const bumps = [];
    for (let x = -margin; x <= w + margin; x += 18) {
      const bump = r() < 0.12 ? 10 + r() * 16 : r() * 4;
      bumps.push([x, edge - bump]);
    }
    for (const [x, y] of bumps) g.lineTo(x, y);
    g.lineTo(w + margin, edge);
    for (let i = steps.length - 1; i >= 0; i--) {
      const [x, sw, y] = steps[i];
      g.lineTo(x + sw, y); g.lineTo(x, y);
    }
    g.closePath();
    g.fillStyle = '#25c516'; g.fill();
    // тёмно-зелёные пиксельные пятна внизу травы
    g.save(); g.clip();
    for (let y = edge + 40; y < edge + 200; y += 30) {
      for (let x = -margin; x < w + margin; x += 30) {
        if (r() < 0.35 + (y - edge) / 400) { g.fillStyle = r() < 0.5 ? '#1fae12' : '#20b814'; g.fillRect(x, y, 30, 30); }
      }
    }
    g.restore();
    g.lineJoin = 'round'; g.lineCap = 'round';
    // кромка травы сверху (с бугорками) и ступенчатый край снизу — чёрная линия
    g.lineWidth = 5; g.strokeStyle = '#151515';
    g.beginPath(); bumps.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.stroke();
    g.lineWidth = 6;
    g.beginPath();
    steps.forEach(([x, sw, y], i) => { if (i) g.lineTo(x, y); else g.moveTo(x, y); g.lineTo(x + sw, y); });
    g.stroke();
    // травинки «ʍ»
    g.lineWidth = 4;
    for (let i = 0; i < 14; i++) {
      const x = 60 + r() * (w - 120), y = edge + 50 + r() * 30;
      g.beginPath();
      g.moveTo(x, y); g.lineTo(x + 6, y - 14); g.lineTo(x + 12, y); g.lineTo(x + 18, y - 16); g.lineTo(x + 24, y);
      g.lineTo(x + 30, y - 12); g.lineTo(x + 34, y - 2);
      g.stroke();
    }
    return { canvas: c, margin };
  }

  // ---------------------------------------------------------------- фоны «майнкрафт» по темам
  // Каждая тема — своё сочное небо, дальние холмы, деревья вдали, цветы; seed меняет расстановку.
  const MC_THEMES = {
    meadow: { sky: ['#1b8cff', '#62c3ff', '#dff6ff'], sun: '#fff27a', hills: ['#9fd8c0', '#7cc79f'],
      grass: ['#5fd331', '#79e449', '#46b81f', '#2e8a12'], trees: ['oak', 'oak', 'birch'], flowers: ['#ff3040', '#ffe02e', '#ffffff'], cloud: ['#ffffff', '#d3ebff'] },
    cherry: { sky: ['#3aa8ff', '#9fd9ff', '#fff0fa'], sun: '#fff59a', hills: ['#f2bfe0', '#d9a3dc'],
      grass: ['#62d43a', '#83e65a', '#48b925', '#2f8c17'], trees: ['cherry', 'cherry', 'oak'], flowers: ['#ff5fb0', '#ffffff', '#ffd23a'], cloud: ['#ffffff', '#ffe3f3'] },
    sunset: { sky: ['#ff4f81', '#ff9f5a', '#ffe38a'], sun: '#fff1a8', hills: ['#c86aa8', '#a5508f'],
      grass: ['#58c92c', '#73db43', '#3fa51c', '#2a7a10'], trees: ['oak', 'spruce', 'oak'], flowers: ['#ff3a3a', '#ffdd33', '#ff8be0'], cloud: ['#fff6ee', '#ffc8b0'] },
    jungle: { sky: ['#00a6ff', '#58e1ff', '#e2fff7'], sun: '#fffb8a', hills: ['#7fe0b9', '#4fc79a'],
      grass: ['#4fd12c', '#74ea45', '#36ad16', '#237a0c'], trees: ['jungle', 'jungle', 'oak'], flowers: ['#ff8a00', '#ff2e8a', '#ffe500'], cloud: ['#ffffff', '#c9f1ff'] },
    evening: { sky: ['#3d2cc9', '#a14dff', '#ff9ccf'], moon: '#fffbe0', hills: ['#7a4fc7', '#5d3aa6'],
      grass: ['#4ec12b', '#6ad545', '#37a01b', '#246f0f'], trees: ['spruce', 'spruce', 'birch'], flowers: ['#7af0ff', '#ffffff', '#ff7ad9'], cloud: ['#fdf1ff', '#e2c6ff'] },
    // ---- голубое небо, сочная трава (серия по образцу)
    birch: { sky: ['#2f9bff', '#86d0ff', '#eefaff'], sun: '#fff38a', hills: ['#a9e3c9', '#86d4ac'],
      grass: ['#63d637', '#82e65a', '#4abb24', '#2f8c15'], trees: ['birch', 'birch', 'birch', 'oak'], flowers: ['#4f7dff', '#ffffff', '#ffe02e'], cloud: ['#ffffff', '#d8eeff'],
      features: ['bushes'] },
    taiga: { sky: ['#1e6fff', '#5aa8ff', '#d6ecff'], sun: '#fff6a0', hills: ['#8fc6c0', '#6fb19a'],
      grass: ['#57cf2f', '#74e04a', '#3fae1d', '#277d10'], trees: ['spruce', 'spruce', 'spruce', 'birch'], flowers: ['#4f7dff', '#ffffff', '#b06bff'], cloud: ['#ffffff', '#cfe4ff'],
      features: ['mountains', 'rocks'] },
    plains: { sky: ['#0f7ff0', '#4fb6ff', '#d2f1ff'], sun: '#fff27a', hills: ['#a3dcb4', '#7fcd93'],
      grass: ['#62d633', '#7fe852', '#48bc1f', '#2f8c12'], trees: ['oak', 'oak'], sparse: true, flowers: ['#ff3040', '#ffe02e', '#ff8a00'], cloud: ['#ffffff', '#d3ebff'],
      features: ['sunflowers', 'fence'] },
    orchard: { sky: ['#1b8cff', '#6cc8ff', '#e6f8ff'], sun: '#fff27a', hills: ['#b5e3b0', '#90d48d'],
      grass: ['#5fd331', '#7be64e', '#46b81f', '#2e8a12'], trees: ['apple', 'apple', 'oak'], flowers: ['#ff3040', '#ffffff', '#ffe02e'], cloud: ['#ffffff', '#d3ebff'],
      features: ['fence', 'pumpkins'] },
    savanna: { sky: ['#0a9bff', '#5fd0ff', '#e5fbff'], sun: '#fffb8a', hills: ['#c6e09a', '#a7d07b'],
      grass: ['#6ad13a', '#8ae25c', '#50b526', '#348616'], trees: ['acacia', 'acacia', 'oak'], sparse: true, flowers: ['#ff8a00', '#ffe02e', '#ff3040'], cloud: ['#ffffff', '#d6f3ff'],
      features: ['rocks'] },
    lakeside: { sky: ['#2f9bff', '#86d0ff', '#eefaff'], sun: '#fff38a', hills: ['#9fd8c0', '#7cc79f'],
      grass: ['#5fd331', '#79e449', '#46b81f', '#2e8a12'], trees: ['oak', 'birch', 'oak'], flowers: ['#ff5fb0', '#ffffff', '#4f7dff'], cloud: ['#ffffff', '#d3ebff'],
      features: ['lake', 'sugarcane'] },
    village: { sky: ['#1b8cff', '#62c3ff', '#dff6ff'], sun: '#fff27a', hills: ['#a9dcc0', '#86cda0'],
      grass: ['#60d432', '#7de650', '#47b920', '#2e8a12'], trees: ['oak', 'oak', 'birch'], sparse: true, flowers: ['#ff3040', '#ffe02e', '#ffffff'], cloud: ['#ffffff', '#d3ebff'],
      features: ['houses', 'fence'] },
    mushroom: { sky: ['#38a6ff', '#a6dcff', '#f4fbff'], sun: '#fff59a', hills: ['#b9e0c4', '#98d1a8'],
      grass: ['#5fd331', '#7be64e', '#46b81f', '#2e8a12'], trees: ['mushroom', 'oak', 'mushroom', 'birch'], flowers: ['#ff3040', '#ffffff', '#ff8a00'], cloud: ['#ffffff', '#dff2ff'],
      features: ['bushes'] },
    darkforest: { sky: ['#1e6fff', '#5aa8ff', '#d6ecff'], sun: '#fff6a0', hills: ['#86c9a6', '#62b386'],
      grass: ['#55cc2e', '#72de48', '#3cab1b', '#25790f'], trees: ['darkoak', 'darkoak', 'oak'], flowers: ['#ff3040', '#ffffff', '#b06bff'], cloud: ['#ffffff', '#cfe4ff'],
      features: ['bushes', 'rocks'] },
    castle: { sky: ['#0f7ff0', '#4fb6ff', '#d2f1ff'], sun: '#fff27a', hills: ['#a3d6c4', '#7fc7a0'],
      grass: ['#60d432', '#7de650', '#47b920', '#2e8a12'], trees: ['oak', 'spruce', 'oak'], sparse: true, flowers: ['#ffe02e', '#ffffff', '#ff3040'], cloud: ['#ffffff', '#d3ebff'],
      features: ['mountains', 'castle'] },
    flowerfield: { sky: ['#2f9bff', '#86d0ff', '#eefaff'], sun: '#fff38a', hills: ['#b2e6bd', '#8fd79c'],
      grass: ['#63d637', '#82e65a', '#4abb24', '#2f8c15'], trees: ['oak', 'birch', 'cherry'], sparse: true, flowers: ['#ff3040', '#ffe02e', '#ffffff', '#ff5fb0', '#4f7dff', '#ff8a00'], cloud: ['#ffffff', '#d8eeff'],
      features: ['meadowflowers'] },
  };
  const mix = (c1, c2, k) => {
    const p = (c) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
    const a = p(c1), b = p(c2);
    return '#' + a.map((v, i) => Math.round(v + (b[i] - v) * k).toString(16).padStart(2, '0')).join('');
  };

  // дерево вдали из блоков: (x, base) — низ ствола, b — размер блока, haze — доля цвета неба
  function mcTree(g, kind, x, base, b, r, haze, sky) {
    const H = (c) => mix(c, sky, haze);
    const out = H('#1d3a1a');
    const blk = (cx, cy, col) => { g.fillStyle = col; g.fillRect(Math.round(x + cx * b), Math.round(base - (cy + 1) * b), Math.ceil(b), Math.ceil(b)); };
    const pal = {
      oak: { trunk: ['#7a5230', '#5e3d22'], leaf: ['#3dbb2c', '#2f9e22', '#57d23f'] },
      birch: { trunk: ['#f2f0e6', '#2b2b2b'], leaf: ['#7fd34a', '#62bb34', '#9be563'] },
      cherry: { trunk: ['#5b3a2e', '#43291f'], leaf: ['#ff9fd2', '#ff78bd', '#ffc6e6'] },
      spruce: { trunk: ['#5a3b1f', '#40290f'], leaf: ['#2d7a3a', '#22612d', '#3b9449'] },
      jungle: { trunk: ['#8a6a35', '#6a4f24'], leaf: ['#2fae2a', '#228c1e', '#4fcd3c'] },
      apple: { trunk: ['#7a5230', '#5e3d22'], leaf: ['#3dbb2c', '#2f9e22', '#57d23f'] },
      acacia: { trunk: ['#8c6a4a', '#6e5238'], leaf: ['#79c234', '#64a92a', '#93d64b'] },
      darkoak: { trunk: ['#4a3420', '#38261a'], leaf: ['#2a8a2a', '#1f6f22', '#3aa23a'] },
      mushroom: { trunk: ['#e9dfc8', '#d4c7aa'], leaf: ['#e8262e', '#c81d24', '#ff4a4f'] },
    }[kind];
    const th = kind === 'spruce' ? 2 : kind === 'jungle' ? 6 + Math.floor(r() * 3) : kind === 'mushroom' ? 3 + Math.floor(r() * 2)
      : kind === 'darkoak' ? 3 : 3 + Math.floor(r() * 2);
    const cells = [];
    const leaf = (cx, cy) => { const v = r(); cells.push([cx, cy, pal.leaf[v < 0.55 ? 0 : v < 0.8 ? 1 : 2]]); };
    if (kind === 'acacia') {                                       // кривой ствол и плоская широкая крона
      const lean = r() < 0.5 ? -1 : 1;
      cells.push([0, 0, pal.trunk[0]], [0, 1, pal.trunk[1]], [lean, 2, pal.trunk[0]], [lean * 2, 3, pal.trunk[1]]);
      for (let cx = -3; cx <= 3; cx++) leaf(lean * 2 + cx, 4);
      for (let cx = -2; cx <= 2; cx++) leaf(lean * 2 + cx, 5);
    } else if (kind === 'mushroom') {                              // большой гриб: светлая ножка, красная шляпка в белых точках
      for (let i = 0; i < th; i++) cells.push([0, i, pal.trunk[i % 2]]);
      for (let cx = -2; cx <= 2; cx++) cells.push([cx, th, pal.leaf[0]], [cx, th + 1, pal.leaf[cx % 2 ? 1 : 0]]);
      for (let cx = -1; cx <= 1; cx++) cells.push([cx, th + 2, pal.leaf[0]]);
      cells.push([-3, th, pal.leaf[1]], [3, th, pal.leaf[1]]);
      for (const [cx, cy] of [[-1, th + 1], [2, th], [1, th + 2], [-2, th]]) cells.push([cx, cy, '#ffffff']);
    } else if (kind === 'darkoak') {                               // толстый ствол в два блока, крона пошире
      for (let i = 0; i < th; i++) cells.push([0, i, pal.trunk[i % 2]], [1, i, pal.trunk[(i + 1) % 2]]);
      for (let cy = th - 1; cy < th + 2; cy++) for (let cx = -2; cx <= 3; cx++) if (!(cy === th - 1 && (cx === -2 || cx === 3))) leaf(cx, cy);
      for (let cx = -1; cx <= 2; cx++) leaf(cx, th + 2);
    } else for (let i = 0; i < th; i++) cells.push([0, i, kind === 'birch' && r() < 0.3 ? pal.trunk[1] : pal.trunk[i % 2 ? 1 : 0]]);
    if (kind === 'acacia' || kind === 'mushroom' || kind === 'darkoak') {
      /* крона уже собрана */
    } else if (kind === 'spruce') {
      let y = th;
      for (const w of [2, 1, 2, 1, 1, 0, 0]) { for (let cx = -w; cx <= w; cx++) leaf(cx, y); y++; }
    } else {
      const w = kind === 'jungle' ? 3 : 2, top = th;
      for (let cy = top - 1; cy < top + 2; cy++) for (let cx = -w; cx <= w; cx++) if (!(Math.abs(cx) === w && cy === top - 1 && r() < 0.6)) leaf(cx, cy);
      for (let cx = -1; cx <= 1; cx++) leaf(cx, top + 2);
      if (r() < 0.6) leaf(0, top + 3);
      if (kind === 'cherry') for (let cx = -w - 1; cx <= w + 1; cx += 2 * w + 2) if (r() < 0.7) leaf(cx, top);   // лепестки свисают
      if (kind === 'apple') for (let k = 0; k < 4; k++) cells.push([Math.floor(r() * 5) - 2, top - 1 + Math.floor(r() * 3), '#e8262e']);   // яблоки
    }
    // обводка: тень на блок вокруг силуэта
    g.save();
    for (const [cx, cy] of cells) {
      g.fillStyle = out;
      g.fillRect(Math.round(x + cx * b - 2), Math.round(base - (cy + 1) * b - 2), Math.ceil(b) + 4, Math.ceil(b) + 4);
    }
    for (const [cx, cy, col] of cells) blk(cx, cy, H(col));
    g.restore();
  }

  // ---- детали фона
  const block = (g, x, y, b, col, line = 'rgba(0,0,0,0.18)') => {
    g.fillStyle = col; g.fillRect(Math.round(x), Math.round(y), Math.ceil(b), Math.ceil(b));
    if (line) { g.fillStyle = line; g.fillRect(Math.round(x), Math.round(y + b - 3), Math.ceil(b), 3); }
  };
  // горы со снежными шапками далеко за холмами
  function mcMountains(g, w, edge, margin, r, sky) {
    const B = 36, peaks = [];
    for (let i = 0; i < 3 + Math.floor(r() * 2); i++) peaks.push([w * (0.05 + 0.9 * (i + r() * 0.8) / 4), 300 + r() * 170]);
    const rock = mix('#7f8fa6', sky, 0.45), rock2 = mix('#6c7c93', sky, 0.45), snow = mix('#ffffff', sky, 0.15);
    for (let x = -margin; x < w + margin; x += B) {
      let hgt = 0;
      for (const [px, ph] of peaks) hgt = Math.max(hgt, ph - Math.abs(x + B / 2 - px) * 0.95);
      hgt = Math.floor(hgt / B) * B;
      if (hgt <= 0) continue;
      const top = edge - 40 - hgt;
      for (let y = top; y < edge; y += B) {
        const depth = y - top;
        g.fillStyle = depth < B * 1.2 ? snow : ((x / B + y / B) % 3 === 0 ? rock2 : rock);
        g.fillRect(x, y, B + 1, B + 1);
      }
    }
  }
  // озеро: голубые блоки воды с бликами
  function mcLake(g, x, lw, edge, r) {
    const B = 22, y0 = edge - 66;
    for (let y = y0; y < edge + 4; y += B) {
      const inset = y === y0 ? B * 3 : y === y0 + B ? B : 0;
      for (let xx = x + inset; xx < x + lw - inset; xx += B) {
        const v = r();
        g.fillStyle = v < 0.2 ? '#5ab0ff' : v < 0.35 ? '#2f7fe0' : '#3f95f5';
        g.fillRect(xx, y, B + 1, B + 1);
      }
    }
    g.fillStyle = 'rgba(255,255,255,0.75)';
    for (let i = 0; i < 6; i++) g.fillRect(x + B * 2 + r() * (lw - B * 6), y0 + 6 + Math.floor(r() * 3) * B, 26 + r() * 30, 4);
  }
  // домик из досок вдали: стены, брёвна по углам, крыша ступеньками, дверь и окно
  function mcHouse(g, x, base, b, r, haze, sky) {
    const H = (c) => mix(c, sky, haze), W = 7, WH = 4;
    const x0 = x - (W * b) / 2;
    g.fillStyle = H('#1d1a14');                                       // обводка по силуэту
    g.fillRect(x0 - 3, base - WH * b - 3, W * b + 6, WH * b + 3);
    for (let j = 0; j < 4; j++) g.fillRect(x0 + j * b - 3, base - (WH + j + 1) * b - 3, (W - 2 * j) * b + 6, b + 3);
    for (let i = 0; i < W; i++) for (let j = 0; j < WH; j++) {
      const corner = i === 0 || i === W - 1;
      block(g, x0 + i * b, base - (j + 1) * b, b, H(corner ? '#6b4a2a' : j % 2 ? '#b7864a' : '#c39258'));
    }
    for (let j = 0; j < 4; j++) for (let i = j; i < W - j; i++) block(g, x0 + i * b, base - (WH + j + 1) * b, b, H(j % 2 ? '#8a5a32' : '#7a4b2a'));
    block(g, x0 + 3 * b, base - b, b, H('#5a3a1e'), null); block(g, x0 + 3 * b, base - 2 * b, b, H('#5a3a1e'), null);   // дверь
    block(g, x0 + 1 * b, base - 3 * b, b, H('#aee3ff'), null); block(g, x0 + 5 * b, base - 3 * b, b, H('#aee3ff'), null); // окна
  }
  // замок вдали: стена с зубцами и две башни
  function mcCastle(g, x, base, b, sky) {
    const H = (c) => mix(c, sky, 0.4);
    const col = (i, j) => H((i + j) % 3 ? '#9aa3ad' : '#868f99');
    const tower = (tx, hgt) => {
      for (let i = 0; i < 4; i++) for (let j = 0; j < hgt; j++) block(g, tx + i * b, base - (j + 1) * b, b, col(i, j));
      for (let i = 0; i < 4; i += 2) block(g, tx + i * b, base - (hgt + 1) * b, b, col(i, 9));
      block(g, tx + 1.5 * b, base - (hgt - 2) * b, b, H('#3a3f46'), null);
    };
    for (let i = 0; i < 14; i++) for (let j = 0; j < 7; j++) block(g, x - 7 * b + i * b, base - (j + 1) * b, b, col(i, j));
    for (let i = 0; i < 14; i += 2) block(g, x - 7 * b + i * b, base - 8 * b, b, col(i, 3));
    tower(x - 9 * b, 12); tower(x + 5 * b, 12);
    block(g, x - b, base - 2 * b, b * 2, H('#4a3220'), null);
    g.fillStyle = H('#ff3040'); g.fillRect(x - 7 * b, base - 16 * b, 3, b * 3); g.fillRect(x - 7 * b + 3, base - 16 * b, b * 1.4, b * 0.9);
  }
  // забор на кромке травы
  function mcFence(g, x0, x1, edge, b) {
    const post = (x) => { g.fillStyle = '#111'; g.fillRect(x - 3, edge - b * 1.5 - 3, 16, b * 1.5 + 3); g.fillStyle = '#b07d45'; g.fillRect(x, edge - b * 1.5, 10, b * 1.5); };
    for (const y of [edge - b * 1.25, edge - b * 0.7]) {
      g.fillStyle = '#111'; g.fillRect(x0, y - 3, x1 - x0, 13); g.fillStyle = '#c08b52'; g.fillRect(x0, y, x1 - x0, 7);
    }
    for (let x = x0; x <= x1; x += b * 1.6) post(x);
  }
  function mcBush(g, x, edge, b, r) {
    const cells = [[0, 0], [1, 0], [-1, 0], [0, 1]];
    if (r() < 0.5) cells.push([1, 1]);
    for (const [cx, cy] of cells) { g.fillStyle = '#163d12'; g.fillRect(x + cx * b - 2, edge - (cy + 1) * b - 2, b + 4, b + 4); }
    for (const [cx, cy] of cells) block(g, x + cx * b, edge - (cy + 1) * b, b, r() < 0.5 ? '#3dbb2c' : '#2f9e22');
  }
  function mcRock(g, x, edge, b, r) {
    const cells = [[0, 0], [1, 0]];
    if (r() < 0.6) cells.push([0, 1]);
    for (const [cx, cy] of cells) { g.fillStyle = '#2a2a2a'; g.fillRect(x + cx * b - 2, edge - (cy + 1) * b - 2, b + 4, b + 4); }
    for (const [cx, cy] of cells) {
      block(g, x + cx * b, edge - (cy + 1) * b, b, r() < 0.5 ? '#8f8f8f' : '#a3a3a3');
      g.fillStyle = '#6f6f6f'; g.fillRect(x + cx * b + 6, edge - (cy + 1) * b + 8, 8, 6); g.fillRect(x + cx * b + 18, edge - (cy + 1) * b + 18, 8, 6);
    }
  }
  function mcPumpkin(g, x, edge, b) {
    g.fillStyle = '#111'; g.fillRect(x - 3, edge - b - 3, b + 6, b + 6);
    g.fillStyle = '#f08a12'; g.fillRect(x, edge - b, b, b);
    g.fillStyle = '#d2700a'; for (const k of [0.25, 0.6]) g.fillRect(x + b * k, edge - b, 4, b);
    g.fillStyle = '#4a7a1a'; g.fillRect(x + b * 0.4, edge - b - 8, 8, 8);
  }
  function mcSunflower(g, x, edge, b) {
    g.fillStyle = '#1d5e12'; g.fillRect(x - 2, edge - 7 * b, b + 4, 7 * b);
    g.fillStyle = '#3ea82a'; g.fillRect(x, edge - 7 * b, b, 7 * b);
    g.fillStyle = '#4fc43a'; g.fillRect(x + b, edge - 4 * b, b * 1.4, b); g.fillRect(x - b * 1.4, edge - 5.5 * b, b * 1.4, b);   // листья
    const cx = x + b / 2, cy = edge - 9 * b;
    g.fillStyle = '#111';
    for (const [dx, dy] of [[-1, -2.6], [-2.6, -1], [0.6, -2.6], [1.6, -1], [-1, 1.6], [-2.6, 0.6], [0.6, 1.6], [1.6, 0.6]]) g.fillRect(cx + dx * b - 2, cy + dy * b - 2, b + 4, b + 4);
    g.fillStyle = '#ffd21f';
    for (const [dx, dy] of [[-1, -2.6], [-2.6, -1], [0.6, -2.6], [1.6, -1], [-1, 1.6], [-2.6, 0.6], [0.6, 1.6], [1.6, 0.6]]) g.fillRect(cx + dx * b, cy + dy * b, b, b);
    g.fillStyle = '#111'; g.fillRect(cx - 1.7 * b - 3, cy - 1.7 * b - 3, 3.4 * b + 6, 3.4 * b + 6);
    g.fillStyle = '#ffd21f'; g.fillRect(cx - 1.7 * b, cy - 1.7 * b, 3.4 * b, 3.4 * b);
    g.fillStyle = '#7a4a1e'; g.fillRect(cx - b, cy - b, 2 * b, 2 * b);
    g.fillStyle = '#5a3412'; g.fillRect(cx - b, cy, b, b);
  }
  function mcCane(g, x, edge, b, n) {
    for (let i = 0; i < n; i++) { g.fillStyle = '#1d5e12'; g.fillRect(x - 2, edge - (i + 1) * b - 6 - 2, 12, b + 2); g.fillStyle = i % 2 ? '#8fdc5a' : '#76c844'; g.fillRect(x, edge - (i + 1) * b - 6, 8, b); }
  }

  function mcBackground(w, h, edge, opts = {}) {
    const T = { ...MC_THEMES[opts.theme || 'meadow'], ...(opts.override || {}) };
    if (opts.trees) T.trees = opts.trees;
    if (opts.sky) T.sky = opts.sky;
    const margin = 80;
    const c = document.createElement('canvas');
    c.width = w + 2 * margin; c.height = h + 2 * margin;
    const g = c.getContext('2d');
    g.translate(margin, margin);
    const r = rng(opts.seed || 7);
    // небо
    const sky = g.createLinearGradient(0, -margin, 0, edge);
    sky.addColorStop(0, T.sky[0]); sky.addColorStop(0.55, T.sky[1]); sky.addColorStop(1, T.sky[2]);
    g.fillStyle = sky; g.fillRect(-margin, -margin, c.width, edge + margin + 4);
    // солнце или луна — квадратные, с ореолом
    const sx = opts.sunX ?? (w * (0.12 + r() * 0.76)), sy = opts.sunY ?? (150 + r() * 120);
    const body = T.sun || T.moon;
    if (body) {
      const glow = g.createRadialGradient(sx, sy, 20, sx, sy, 260);
      glow.addColorStop(0, mix(body, '#ffffff', 0.3) + 'cc'); glow.addColorStop(1, body + '00');
      g.fillStyle = glow; g.fillRect(sx - 260, sy - 260, 520, 520);
      g.fillStyle = body; g.fillRect(sx - 56, sy - 56, 112, 112);
      g.fillStyle = mix(body, '#ffffff', 0.55); g.fillRect(sx - 40, sy - 40, 48, 48);
      if (T.moon) { g.fillStyle = mix(body, '#c9b8ff', 0.4); g.fillRect(sx + 10, sy + 14, 24, 24); g.fillRect(sx - 34, sy + 22, 16, 16); }
    }
    // дальние ступенчатые холмы — два слоя
    const hills = (col, base, amp, B, seed) => {
      const rr = rng(seed);
      g.fillStyle = col;
      let y = base - amp * rr();
      for (let x = -margin; x < w + margin; x += B) {
        y = Math.min(base - 10, Math.max(base - amp, y + (Math.floor(rr() * 3) - 1) * B));
        g.fillRect(x, y, B + 1, edge - y + 10);
      }
    };
    const F = new Set(opts.features || T.features || []);
    const fr = rng((opts.seed || 7) * 13 + 5);                      // особенности — свой генератор (деревья не сдвигаются)
    const skyLow = T.sky[2];
    if (F.has('mountains')) mcMountains(g, w, edge, margin, fr, skyLow);
    hills(T.hills[0], edge - 70, 230, 40, (opts.seed || 7) + 1);
    hills(T.hills[1], edge - 20, 120, 32, (opts.seed || 7) + 2);
    let castleX = null;
    if (F.has('castle')) { castleX = w * (0.2 + fr() * 0.6); mcCastle(g, castleX, edge + 2, 22, skyLow); }
    // озеро — полоса воды за травой; деревья в нём не растут
    let lake = null;
    if (F.has('lake')) {
      let lw = 520 + fr() * 260, lx = fr() < 0.5 ? 60 + fr() * 200 : w - lw - 60 - fr() * 200;
      if (opts.lake) [lx, lw] = opts.lake;                             // [x, ширина] — где озеро
      lake = [lx, lx + lw];
      mcLake(g, lx, lw, edge, fr);
    }
    // деревья вдали: дальний ряд (меньше, в дымке) и ближний
    const rows = T.sparse ? [[0.55, 17, 6 + Math.floor(r() * 3)], [0.2, 27, 3 + Math.floor(r() * 2)]]
      : [[0.55, 17, 9 + Math.floor(r() * 3)], [0.2, 27, 5 + Math.floor(r() * 3)]];
    const houses = [];
    if (F.has('houses')) for (let i = 0; i < 2 + Math.floor(fr() * 2); i++) houses.push(w * (0.08 + 0.84 * (i + 0.2 + fr() * 0.6) / 3));
    rows.forEach(([haze, B, n], ri) => {
      const xs = [];
      for (let i = 0; i < n; i++) xs.push(-60 + (i + 0.2 + r() * 0.6) * (w + 120) / n);
      const kinds = xs.map(() => T.trees[Math.floor(r() * T.trees.length)]);
      xs.forEach((x, i) => {
        if (lake && x > lake[0] - 60 && x < lake[1] + 60) return;
        if (houses.some((hx) => Math.abs(x - hx) < 150)) return;
        if (castleX !== null && Math.abs(x - castleX) < 290) return;
        mcTree(g, kinds[i], x, edge + 2, B, r, haze, skyLow);
      });
      if (ri === 0) for (const hx of houses) mcHouse(g, hx, edge + 2, 20, fr, 0.25, skyLow);
    });
    // земля: блоки трёх оттенков, кое-где камень
    const B = 34;
    g.fillStyle = '#8b5a2b'; g.fillRect(-margin, edge + 40, c.width, h + margin - edge);
    for (let y = edge + 40; y < h + margin; y += B) {
      for (let x = -margin; x < w + margin; x += B) {
        const v = r();
        g.fillStyle = v < 0.2 ? '#6f4521' : v < 0.34 ? '#a26d3a' : v < 0.38 ? '#8f8f8f' : '#8b5a2b';
        g.fillRect(x, y, B, B);
        if (r() < 0.25) { g.fillStyle = 'rgba(0,0,0,0.12)'; g.fillRect(x + B / 2, y + B / 2, B / 2, B / 2); }
      }
    }
    // трава: верхний край с пиксельными бугорками, снизу «натёки» ступеньками
    const top = [];
    for (let x = -margin; x <= w + margin; x += 22) top.push([x, edge - (r() < 0.18 ? 11 : 0)]);
    const drips = [];
    for (let x = -margin; x < w + margin;) {
      const sw = 22 * (2 + Math.floor(r() * 4));
      drips.push([x, sw, edge + 88 + Math.floor(r() * 4) * 22]);
      x += sw;
    }
    const grassPath = () => {
      g.beginPath();
      g.moveTo(-margin, edge);
      for (let i = 0; i < top.length; i++) { const [x, y] = top[i]; g.lineTo(x, y); g.lineTo(x + 22, y); }
      g.lineTo(w + margin, edge);
      for (let i = drips.length - 1; i >= 0; i--) { const [x, sw, y] = drips[i]; g.lineTo(x + sw, y); g.lineTo(x, y); }
      g.closePath();
    };
    grassPath(); g.fillStyle = T.grass[0]; g.fill();
    g.save(); grassPath(); g.clip();
    const GB = 22;
    for (let y = edge - 12; y < edge + 190; y += GB) {
      for (let x = -margin; x < w + margin; x += GB) {
        const v = r();
        if (v < 0.22) { g.fillStyle = T.grass[1]; g.fillRect(x, y, GB, GB); }
        else if (v < 0.22 + 0.1 + (y - edge) / 500) { g.fillStyle = T.grass[2]; g.fillRect(x, y, GB, GB); }
      }
    }
    g.restore();
    // кромки: тёмно-зелёная линия сверху и по натёкам
    g.lineJoin = 'miter';
    g.strokeStyle = T.grass[3]; g.lineWidth = 6;
    g.beginPath(); top.forEach(([x, y], i) => { i ? g.lineTo(x, y) : g.moveTo(x, y); g.lineTo(x + 22, y); }); g.stroke();
    g.beginPath();
    drips.forEach(([x, sw, y], i) => { i ? g.lineTo(x, y) : g.moveTo(x, y); g.lineTo(x + sw, y); });
    g.stroke();
    // предметы на кромке травы — по краям кадра (в середине стоят герои)
    const sideX = (k) => (fr() < 0.5 ? 40 + fr() * 300 : w - 340 + fr() * 300);
    if (F.has('fence')) {
      const L = fr() < 0.5;
      mcFence(g, L ? -20 : w - 360, L ? 360 : w + 20, edge, 40);
      if (fr() < 0.6) mcFence(g, L ? w - 300 : -20, L ? w + 20 : 300, edge, 40);
    }
    if (F.has('sugarcane') && lake) for (let i = 0; i < 4; i++) mcCane(g, lake[0] + 30 + fr() * (lake[1] - lake[0] - 60), edge, 18, 2 + Math.floor(fr() * 3));
    if (F.has('bushes')) for (let i = 0; i < 4; i++) mcBush(g, sideX(), edge, 30, fr);
    if (F.has('rocks')) for (let i = 0; i < 3; i++) mcRock(g, sideX(), edge, 32, fr);
    if (F.has('pumpkins')) for (let i = 0; i < 3; i++) mcPumpkin(g, sideX(), edge, 40);
    if (F.has('sunflowers')) for (let i = 0; i < 5; i++) mcSunflower(g, sideX(), edge, 12);
    if (F.has('meadowflowers')) for (let i = 0; i < 22; i++) {
      const x = 20 + fr() * (w - 40), fb = 6, col = T.flowers[Math.floor(fr() * T.flowers.length)];
      g.fillStyle = '#2f8a17'; g.fillRect(x, edge - 3 * fb, fb, 2 * fb + 2);
      g.fillStyle = col; g.fillRect(x - fb, edge - 5 * fb, 3 * fb, 2 * fb); g.fillRect(x, edge - 6 * fb, fb, fb);
    }
    // цветы на кромке травы (в стороне от середины, где стоят герои)
    for (let i = 0; i < 9; i++) {
      const x = r() < 0.5 ? 30 + r() * 320 : w - 350 + r() * 320, col = T.flowers[Math.floor(r() * T.flowers.length)];
      const fb = 7;
      g.fillStyle = '#2f8a17'; g.fillRect(x, edge - 4 * fb, fb, 3 * fb);
      g.fillStyle = col; g.fillRect(x - fb, edge - 6 * fb, 3 * fb, 2 * fb); g.fillRect(x, edge - 7 * fb, fb, fb);
      g.fillStyle = '#ffde3a'; g.fillRect(x, edge - 5 * fb - fb / 2, fb, fb);
    }
    return { canvas: c, margin, cloud: T.cloud };
  }

  // тонкая рука-лапа (превращение «рост»): точки пути, толщина, цвет; на конце три пальца-когтя
  function limb(ctx, pts, w, col) {
    ctx.save();
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const path = () => { ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); };
    path(); ctx.lineWidth = w + 8; ctx.strokeStyle = '#111'; ctx.stroke();
    path(); ctx.lineWidth = w; ctx.strokeStyle = col; ctx.stroke();
    const [ax, ay] = pts[pts.length - 2], [bx, by] = pts[pts.length - 1];
    const a = Math.atan2(by - ay, bx - ax);
    for (const da of [-0.7, 0, 0.7]) {
      const ex = bx + Math.cos(a + da) * w * 1.6, ey = by + Math.sin(a + da) * w * 1.6;
      for (const [lw, c] of [[w * 0.55 + 6, '#111'], [w * 0.55, col]]) {
        ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(ex, ey); ctx.lineWidth = lw; ctx.strokeStyle = c; ctx.stroke();
      }
    }
    ctx.restore();
  }

  // нотка (поёт): (x, y) — головка, s — масштаб, two — сдвоенная
  function note(ctx, x, y, s = 1, alpha = 1, two = false, col = '#2b2b2b') {
    ctx.save();
    ctx.globalAlpha = alpha; ctx.translate(x, y); ctx.scale(s, s); ctx.rotate(-0.25);
    ctx.fillStyle = col; ctx.strokeStyle = col; ctx.lineWidth = 4; ctx.lineCap = 'round';
    const head = (hx) => { ctx.beginPath(); ctx.ellipse(hx, 0, 10, 7.5, -0.4, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.moveTo(hx + 8.5, -2); ctx.lineTo(hx + 8.5, -40); ctx.stroke(); };
    head(0);
    if (two) { head(26); ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(8.5, -40); ctx.lineTo(34.5, -44); ctx.stroke(); }
    else { ctx.beginPath(); ctx.moveTo(8.5, -40); ctx.quadraticCurveTo(22, -30, 18, -16); ctx.stroke(); }
    ctx.restore();
  }

  // шарик с водой: (x, y) — центр, r — радиус, col — цвет, rot — поворот (узелок снизу при rot = 0), k — сплющенность
  function waterBalloon(ctx, x, y, r = 30, col = '#ff4f6d', rot = 0, k = 1) {
    ctx.save();
    ctx.translate(x, y); ctx.rotate(rot); ctx.scale(1 / Math.sqrt(k), k);
    ctx.lineJoin = 'round'; ctx.lineWidth = 4; ctx.strokeStyle = '#111';
    ctx.beginPath();
    ctx.moveTo(0, -r);
    ctx.bezierCurveTo(r * 1.15, -r, r * 1.2, r * 0.75, 0, r * 1.02);
    ctx.bezierCurveTo(-r * 1.2, r * 0.75, -r * 1.15, -r, 0, -r);
    ctx.fillStyle = col; ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-r * 0.2, r * 1.28); ctx.lineTo(0, r * 0.98); ctx.lineTo(r * 0.2, r * 1.28); ctx.closePath();   // узелок
    ctx.fillStyle = col; ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(-r * 0.38, -r * 0.42, r * 0.2, r * 0.32, 0.5, 0, TAU); ctx.fillStyle = 'rgba(255,255,255,0.75)'; ctx.fill();
    ctx.beginPath(); ctx.arc(-r * 0.1, -r * 0.72, r * 0.08, 0, TAU); ctx.fill();
    ctx.restore();
  }

  // корзина с шариками: (x, ground) — середина дна, w — ширина, cols — цвета шариков (сколько осталось)
  function basket(ctx, x, ground, w = 170, cols = []) {
    const h = w * 0.5;
    ctx.save();
    ctx.lineJoin = 'round';
    cols.forEach((c, i) => {
      const n = cols.length, u = n > 1 ? i / (n - 1) : 0.5;
      waterBalloon(ctx, x + (u - 0.5) * w * 0.62, ground - h - 6 - Math.sin(u * Math.PI) * 18, w * 0.15, c, (u - 0.5) * 0.9);
    });
    ctx.beginPath();
    ctx.moveTo(x - w / 2, ground - h); ctx.lineTo(x + w / 2, ground - h); ctx.lineTo(x + w * 0.4, ground); ctx.lineTo(x - w * 0.4, ground); ctx.closePath();
    ctx.fillStyle = '#d29a4c'; ctx.fill();
    ctx.save(); ctx.clip();
    ctx.strokeStyle = '#9a6526'; ctx.lineWidth = 4;
    for (let y = ground - h + 12; y < ground; y += 14) { ctx.beginPath(); ctx.moveTo(x - w / 2, y); ctx.lineTo(x + w / 2, y); ctx.stroke(); }
    for (let i = -4; i <= 4; i++) { ctx.beginPath(); ctx.moveTo(x + i * w * 0.11, ground - h); ctx.lineTo(x + i * w * 0.09, ground); ctx.stroke(); }
    ctx.restore();
    ctx.beginPath();
    ctx.moveTo(x - w / 2, ground - h); ctx.lineTo(x + w / 2, ground - h); ctx.lineTo(x + w * 0.4, ground); ctx.lineTo(x - w * 0.4, ground); ctx.closePath();
    ctx.lineWidth = 5; ctx.strokeStyle = '#111'; ctx.stroke();
    ctx.beginPath(); ctx.rect(x - w / 2 - 6, ground - h - 6, w + 12, 14); ctx.fillStyle = '#b97d34'; ctx.fill(); ctx.stroke();   // обод
    ctx.restore();
  }

  // брызги лопнувшего шарика: капли во все стороны (вниз падают быстрее), в центре — клякса воды
  function waterSplash(ctx, x, y, life, size = 1, seed = 5) {
    if (life < 0 || life > 1) return;
    const r = rng(seed);
    ctx.save();
    if (life < 0.35) {                                               // клякса в первые кадры
      const k = life / 0.35;
      ctx.globalAlpha = 1 - k;
      ctx.beginPath();
      for (let i = 0; i <= 12; i++) {
        const a = i / 12 * TAU, rr = (40 + 50 * k) * size * (0.75 + 0.5 * r());
        i ? ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr * 0.8) : ctx.moveTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr * 0.8);
      }
      ctx.closePath(); ctx.fillStyle = '#8fd7ff'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = '#1d6fa6'; ctx.stroke();
    }
    for (let i = 0; i < 22; i++) {
      const a = r() * TAU, sp = (140 + r() * 300) * size;
      const px = x + Math.cos(a) * sp * life, py = y + Math.sin(a) * sp * life * 0.8 + 520 * life * life * size;
      const s = (7 + r() * 10) * size * (1 - 0.5 * life);
      ctx.globalAlpha = Math.min(1, (1 - life) * 2.5);
      ctx.save(); ctx.translate(px, py); ctx.rotate(Math.atan2(Math.sin(a) * 0.8 + 2 * life, Math.cos(a)) - Math.PI / 2);
      ctx.beginPath(); ctx.moveTo(0, -s * 1.6); ctx.quadraticCurveTo(s, 0, 0, s); ctx.quadraticCurveTo(-s, 0, 0, -s * 1.6);
      ctx.fillStyle = '#8fd7ff'; ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = '#1d6fa6'; ctx.stroke();
      ctx.restore();
    }
    ctx.restore();
  }

  // бумеранг: (x, y) — центр сгиба, s — размах, rot — поворот
  function boomerang(ctx, x, y, s = 120, rot = 0) {
    const k = s / 120;
    ctx.save();
    ctx.translate(x, y); ctx.rotate(rot); ctx.scale(k, k);
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(-60, 26); ctx.quadraticCurveTo(-30, -6, 2, -22); ctx.quadraticCurveTo(32, -6, 62, 26);
    ctx.quadraticCurveTo(66, 38, 54, 38); ctx.quadraticCurveTo(28, 14, 2, 4); ctx.quadraticCurveTo(-26, 14, -52, 38);
    ctx.quadraticCurveTo(-66, 38, -60, 26); ctx.closePath();
    ctx.fillStyle = '#e8892c'; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = '#111'; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-44, 22); ctx.quadraticCurveTo(-20, 0, 2, -10); ctx.quadraticCurveTo(24, 0, 46, 22);
    ctx.lineWidth = 4; ctx.strokeStyle = '#ffd36b'; ctx.stroke();
    ctx.restore();
  }

  // цветок на стебле: (x, y) — низ стебля, s — длина, rot — наклон
  function flower(ctx, x, y, s = 110, rot = 0, col = '#ff4fa0') {
    const k = s / 110;
    ctx.save();
    ctx.translate(x, y); ctx.rotate(rot); ctx.scale(k, k);
    ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(8, -40, 0, -78);
    ctx.lineWidth = 11; ctx.strokeStyle = '#111'; ctx.stroke(); ctx.lineWidth = 6; ctx.strokeStyle = '#2fa82a'; ctx.stroke();
    ctx.beginPath(); ctx.ellipse(12, -38, 14, 7, -0.6, 0, TAU); ctx.fillStyle = '#3ec43a'; ctx.fill(); ctx.lineWidth = 3.5; ctx.strokeStyle = '#111'; ctx.stroke();
    for (let i = 0; i < 6; i++) {
      const a = i / 6 * TAU;
      ctx.beginPath(); ctx.ellipse(Math.cos(a) * 17, -96 + Math.sin(a) * 17, 13, 10, a, 0, TAU);
      ctx.fillStyle = col; ctx.fill(); ctx.lineWidth = 3.5; ctx.strokeStyle = '#111'; ctx.stroke();
    }
    ctx.beginPath(); ctx.arc(0, -96, 11, 0, TAU); ctx.fillStyle = '#ffd92e'; ctx.fill(); ctx.stroke();
    ctx.restore();
  }

  // палочка для мыльных пузырей: (x, y) — низ ручки, s — длина, rot — наклон (0 — кольцо сверху)
  function bubbleWand(ctx, x, y, s = 120, rot = 0) {
    const k = s / 120;
    ctx.save();
    ctx.translate(x, y); ctx.rotate(rot); ctx.scale(k, k);
    ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -74);
    ctx.lineWidth = 12; ctx.strokeStyle = '#111'; ctx.stroke(); ctx.lineWidth = 7; ctx.strokeStyle = '#4fc3ff'; ctx.stroke();
    ctx.beginPath(); ctx.ellipse(0, -100, 24, 27, 0, 0, TAU);
    ctx.lineWidth = 12; ctx.strokeStyle = '#111'; ctx.stroke(); ctx.lineWidth = 7; ctx.strokeStyle = '#4fc3ff'; ctx.stroke();
    ctx.beginPath(); ctx.ellipse(0, -100, 18, 21, 0, 0, TAU); ctx.fillStyle = 'rgba(190,235,255,0.45)'; ctx.fill();
    ctx.restore();
  }

  // мыльный пузырь (прозрачный, радужный блик): (x, y) — центр, r — радиус, t — секунды (переливы)
  function soapBubble(ctx, x, y, r, t = 0, alpha = 1) {
    if (r <= 1) return;
    ctx.save();
    ctx.globalAlpha = alpha;
    const g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.35, r * 0.1, x, y, r);
    g.addColorStop(0, 'rgba(255,255,255,0.10)'); g.addColorStop(0.75, 'rgba(180,230,255,0.16)'); g.addColorStop(1, 'rgba(150,120,255,0.38)');
    ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fillStyle = g; ctx.fill();
    const hue = (t * 90) % 360;
    ctx.lineWidth = Math.max(3, r * 0.025);
    ctx.strokeStyle = `hsla(${hue}, 90%, 60%, 0.8)`; ctx.beginPath(); ctx.arc(x, y, r, Math.PI * 0.1, Math.PI * 1.0); ctx.stroke();
    ctx.strokeStyle = `hsla(${(hue + 140) % 360}, 90%, 60%, 0.8)`; ctx.beginPath(); ctx.arc(x, y, r, Math.PI * 1.0, Math.PI * 2.1); ctx.stroke();
    ctx.beginPath(); ctx.arc(x, y, r * 0.78, Math.PI * 1.12, Math.PI * 1.42);
    ctx.lineWidth = Math.max(3, r * 0.06); ctx.lineCap = 'round'; ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.stroke();
    ctx.beginPath(); ctx.arc(x + r * 0.45, y + r * 0.5, r * 0.06, 0, TAU); ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.fill();
    ctx.restore();
  }

  // пузырь лопнул: колечко капель
  function bubblePop(ctx, x, y, r, life) {
    if (life < 0 || life > 1) return;
    ctx.save();
    ctx.globalAlpha = 1 - life;
    for (let i = 0; i < 14; i++) {
      const a = i / 14 * TAU, d = r * (0.9 + 0.5 * life);
      ctx.beginPath(); ctx.arc(x + Math.cos(a) * d, y + Math.sin(a) * d + 60 * life * life, Math.max(2, r * 0.05 * (1 - life)), 0, TAU);
      ctx.fillStyle = 'rgba(200,240,255,0.95)'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = '#4b8fc8'; ctx.stroke();
    }
    ctx.restore();
  }

  // снежок: (x, y) — центр, r — радиус
  function snowball(ctx, x, y, r = 26, rot = 0) {
    ctx.save();
    ctx.translate(x, y); ctx.rotate(rot);
    ctx.beginPath();
    for (let i = 0; i <= 48; i++) {                                    // чуть комковатый, но гладкий край
      const a = i / 48 * TAU, k = 1 + 0.035 * Math.sin(a * 5 + 1.3) + 0.02 * Math.sin(a * 9);
      i ? ctx.lineTo(Math.cos(a) * r * k, Math.sin(a) * r * k) : ctx.moveTo(Math.cos(a) * r * k, Math.sin(a) * r * k);
    }
    ctx.closePath();
    ctx.fillStyle = '#ffffff'; ctx.fill();
    ctx.lineWidth = Math.max(3, r * 0.12); ctx.lineJoin = 'round'; ctx.strokeStyle = '#1b2a3a'; ctx.stroke();
    ctx.save(); ctx.clip();
    ctx.beginPath(); ctx.arc(r * 0.25, r * 0.3, r * 0.85, 0, TAU); ctx.fillStyle = 'rgba(150,190,235,0.45)'; ctx.fill();
    ctx.restore();
    ctx.beginPath(); ctx.arc(-r * 0.35, -r * 0.35, r * 0.18, 0, TAU); ctx.fillStyle = '#ffffff'; ctx.fill();
    ctx.restore();
  }

  // куча снежных блоков: (x, ground) — середина низа, w — ширина, rows — сколько рядов, taken — сколько «вычерпано»
  function snowPile(ctx, x, ground, w = 200, rows = 3, seed = 3) {
    const r = rng(seed), B = 40;
    const cells = [];
    for (let j = 0; j < rows; j++) {
      const n = Math.max(1, Math.round(w / B) - j - (j > 1 ? 1 : 0));
      for (let i = 0; i < n; i++) cells.push([x - (n * B) / 2 + i * B, ground - (j + 1) * B + 4]);
    }
    ctx.save();
    ctx.fillStyle = '#1b2a3a';
    for (const [bx, by] of cells) ctx.fillRect(bx - 3, by - 3, B + 6, B + 6);
    for (const [bx, by] of cells) {
      const v = r();
      ctx.fillStyle = v < 0.3 ? '#eaf4ff' : v < 0.45 ? '#d8e9fb' : '#ffffff'; ctx.fillRect(bx, by, B, B);
      ctx.fillStyle = 'rgba(140,180,225,0.35)'; ctx.fillRect(bx, by + B - 7, B, 7);
    }
    ctx.restore();
  }

  // снег на макушке: кучка комков, (x, y) — низ середины, w — ширина
  function snowCap(ctx, x, y, w = 120, alpha = 1) {
    if (alpha <= 0) return;
    ctx.save(); ctx.globalAlpha = alpha;
    const lumps = [[-0.42, -0.08, 0.15], [0.43, -0.07, 0.15], [-0.26, -0.16, 0.2], [0.26, -0.16, 0.21], [0, -0.2, 0.24],
      [-0.1, -0.3, 0.17], [0.14, -0.3, 0.16], [-0.47, 0.06, 0.08], [0.48, 0.08, 0.08]];   // пологий сугроб и комья по бокам
    ctx.lineWidth = Math.max(3, w * 0.035); ctx.strokeStyle = '#1b2a3a';
    for (const [dx, dy, rr] of lumps) { ctx.beginPath(); ctx.arc(x + dx * w, y + dy * w, rr * w, 0, TAU); ctx.stroke(); }
    for (const [dx, dy, rr] of lumps) { ctx.beginPath(); ctx.arc(x + dx * w, y + dy * w, rr * w - ctx.lineWidth / 2, 0, TAU); ctx.fillStyle = '#ffffff'; ctx.fill(); }
    ctx.beginPath(); ctx.ellipse(x + 0.12 * w, y - 0.08 * w, 0.34 * w, 0.07 * w, 0, 0, TAU); ctx.fillStyle = 'rgba(150,190,235,0.45)'; ctx.fill();
    ctx.restore();
  }

  // снег на лице/теле: круглая кучка комьев, (x, y) — центр, w — ширина
  function snowSplat(ctx, x, y, w = 140, alpha = 1, seed = 3) {
    if (alpha <= 0) return;
    const r = rng(seed);
    const lumps = [[0, 0, 0.3]];
    for (let i = 0; i < 7; i++) { const a = i / 7 * TAU + r() * 0.5; lumps.push([Math.cos(a) * 0.3, Math.sin(a) * 0.26, 0.17 + r() * 0.06]); }
    ctx.save(); ctx.globalAlpha = alpha;
    ctx.lineWidth = Math.max(3, w * 0.03); ctx.strokeStyle = '#1b2a3a';
    for (const [dx, dy, rr] of lumps) { ctx.beginPath(); ctx.arc(x + dx * w, y + dy * w, rr * w, 0, TAU); ctx.stroke(); }
    for (const [dx, dy, rr] of lumps) { ctx.beginPath(); ctx.arc(x + dx * w, y + dy * w, rr * w - ctx.lineWidth / 2, 0, TAU); ctx.fillStyle = '#ffffff'; ctx.fill(); }
    ctx.beginPath(); ctx.ellipse(x + 0.08 * w, y + 0.14 * w, 0.28 * w, 0.1 * w, 0, 0, TAU); ctx.fillStyle = 'rgba(150,190,235,0.4)'; ctx.fill();
    ctx.beginPath(); ctx.arc(x - 0.12 * w, y - 0.12 * w, 0.06 * w, 0, TAU); ctx.fillStyle = '#ffffff'; ctx.fill();
    ctx.restore();
  }

  // снег разлетелся: белые комки во все стороны и вниз
  function snowBurst(ctx, x, y, life, size = 1, seed = 5) {
    if (life < 0 || life > 1) return;
    const r = rng(seed);
    ctx.save();
    for (let i = 0; i < 18; i++) {
      const a = r() * TAU, sp = (120 + r() * 260) * size;
      const px = x + Math.cos(a) * sp * life, py = y + Math.sin(a) * sp * life * 0.8 + 600 * life * life * size;
      const s = (8 + r() * 12) * size * (1 - 0.4 * life);
      ctx.globalAlpha = Math.min(1, (1 - life) * 2.5);
      ctx.beginPath(); ctx.arc(px, py, s, 0, TAU);
      ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = '#6a8db3'; ctx.stroke();
    }
    ctx.restore();
  }

  // блок слизи (майнкрафт): (x, y) — середина низа, s — сторона, sx/sy — сплющивание, alpha — прозрачность
  function slimeBlock(ctx, x, y, s = 130, sx = 1, sy = 1, alpha = 1, rot = 0) {
    const w = s * sx, h = s * sy;
    ctx.save();
    ctx.translate(x, y - h / 2); ctx.rotate(rot);
    ctx.globalAlpha = alpha;
    ctx.lineJoin = 'round';
    ctx.fillStyle = 'rgba(126, 222, 92, 0.78)'; ctx.fillRect(-w / 2, -h / 2, w, h);
    ctx.fillStyle = '#4fae35'; ctx.fillRect(-w * 0.3, -h * 0.3, w * 0.6, h * 0.6);           // ядро
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.fillRect(-w / 2 + w * 0.08, -h / 2 + h * 0.08, w * 0.18, h * 0.08); ctx.fillRect(-w / 2 + w * 0.08, -h / 2 + h * 0.08, w * 0.08, h * 0.2);
    ctx.fillStyle = '#2f7a1f';                                                             // пиксели-глазки ядра
    ctx.fillRect(-w * 0.18, -h * 0.12, w * 0.1, h * 0.1); ctx.fillRect(w * 0.08, -h * 0.12, w * 0.1, h * 0.1);
    ctx.fillRect(-w * 0.04, h * 0.1, w * 0.08, h * 0.06);
    ctx.lineWidth = 5; ctx.strokeStyle = '#1f4a14'; ctx.strokeRect(-w / 2, -h / 2, w, h);
    ctx.lineWidth = 3; ctx.strokeStyle = '#2f7a1f'; ctx.strokeRect(-w * 0.3, -h * 0.3, w * 0.6, h * 0.6);
    ctx.restore();
  }

  // помидор: (x, y) — центр, r — радиус, rot — поворот
  function tomato(ctx, x, y, r = 24, rot = 0) {
    ctx.save();
    ctx.translate(x, y); ctx.rotate(rot);
    ctx.beginPath(); ctx.ellipse(0, 0, r * 1.08, r * 0.95, 0, 0, TAU);
    ctx.fillStyle = '#ec2d2d'; ctx.fill(); ctx.lineWidth = Math.max(3, r * 0.13); ctx.strokeStyle = '#3a0c0c'; ctx.stroke();
    ctx.beginPath(); ctx.ellipse(-r * 0.38, -r * 0.32, r * 0.22, r * 0.14, -0.6, 0, TAU); ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.fill();
    ctx.beginPath();                                                          // зелёная звёздочка-хвостик
    for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * TAU / 10, rr = i % 2 ? r * 0.16 : r * 0.42; ctx.lineTo(Math.cos(a) * rr, -r * 0.82 + Math.sin(a) * rr * 0.6); }
    ctx.closePath(); ctx.fillStyle = '#3cae2a'; ctx.fill(); ctx.lineWidth = Math.max(2, r * 0.07); ctx.strokeStyle = '#173d10'; ctx.stroke();
    ctx.restore();
  }

  // грядка: тёмная земля бортиком и ростки; (x, ground) — середина, w — ширина
  function gardenBed(ctx, x, ground, w = 260) {
    ctx.save();
    ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(x - w / 2, ground + 2); ctx.lineTo(x - w / 2 + 14, ground - 34); ctx.lineTo(x + w / 2 - 14, ground - 34); ctx.lineTo(x + w / 2, ground + 2); ctx.closePath();
    ctx.fillStyle = '#6b3d1c'; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = '#2a170a'; ctx.stroke();
    ctx.fillStyle = '#4e2a12';
    for (let i = 0; i < 6; i++) ctx.fillRect(x - w / 2 + 24 + i * (w - 48) / 6, ground - 26, 18, 8);
    ctx.restore();
  }

  // куст помидоров на колышке: (x, ground) — низ, h — высота; fruits — [dx, dy] видимых помидоров
  function tomatoBush(ctx, x, ground, h = 230, fruits = []) {
    ctx.save();
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(x + 6, ground + 2); ctx.lineTo(x + 6, ground - h);
    ctx.lineWidth = 12; ctx.strokeStyle = '#2a170a'; ctx.stroke(); ctx.lineWidth = 7; ctx.strokeStyle = '#b58146'; ctx.stroke();   // колышек
    ctx.beginPath(); ctx.moveTo(x, ground); ctx.bezierCurveTo(x - 30, ground - h * 0.4, x + 30, ground - h * 0.6, x - 4, ground - h * 0.95);
    ctx.lineWidth = 12; ctx.strokeStyle = '#173d10'; ctx.stroke(); ctx.lineWidth = 7; ctx.strokeStyle = '#3cae2a'; ctx.stroke();
    for (const [dx, dy, a] of [[-40, -0.35, 0.4], [38, -0.5, -0.5], [-36, -0.7, 0.6], [34, -0.82, -0.4], [-8, -0.98, 0]]) {
      ctx.save(); ctx.translate(x + dx * 0.4, ground + dy * h); ctx.rotate(a);
      ctx.beginPath(); ctx.ellipse(dx * 0.6, 0, 34, 16, 0, 0, TAU); ctx.fillStyle = '#3cae2a'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = '#173d10'; ctx.stroke();
      ctx.restore();
    }
    ctx.restore();
    for (const [dx, dy] of fruits) tomato(ctx, x + dx, ground + dy, 24, 0);
  }

  // блок динамита (майнкрафт): (x, y) — середина низа, s — сторона, flash — 0..1 мигание белым, rot — поворот
  function tnt(ctx, x, y, s = 90, flash = 0, rot = 0) {
    ctx.save();
    ctx.translate(x, y - s / 2); ctx.rotate(rot);
    const h = s / 2;
    ctx.fillStyle = '#d8322a'; ctx.fillRect(-h, -h, s, s);
    ctx.fillStyle = '#b02520'; for (let i = -h; i < h; i += s / 6) ctx.fillRect(i, -h, s / 18, s);
    ctx.fillStyle = '#f2f2f2'; ctx.fillRect(-h, -s * 0.16, s, s * 0.32);                     // белая полоса
    ctx.fillStyle = '#222'; ctx.font = `bold ${Math.round(s * 0.24)}px monospace`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('TNT', 0, s * 0.01);
    ctx.fillStyle = '#e9e1c8'; ctx.fillRect(-h, -h, s, s * 0.1);                             // верх
    if (flash > 0) { ctx.fillStyle = `rgba(255,255,255,${0.75 * flash})`; ctx.fillRect(-h, -h, s, s); }
    ctx.lineWidth = 5; ctx.strokeStyle = '#2a0c08'; ctx.strokeRect(-h, -h, s, s);
    ctx.beginPath(); ctx.moveTo(0, -h); ctx.quadraticCurveTo(s * 0.12, -h - s * 0.18, s * 0.04, -h - s * 0.3);   // фитиль
    ctx.lineWidth = 6; ctx.strokeStyle = '#222'; ctx.stroke();
    ctx.restore();
  }

  // искры горящего фитиля: (x, y) — кончик фитиля, t — секунды
  function fuseSparks(ctx, x, y, t, s = 1) {
    const r = rng(Math.floor(t * 30) + 7);
    ctx.save();
    for (let i = 0; i < 9; i++) {
      const a = r() * TAU, d = (6 + r() * 22) * s;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a) * d, y + Math.sin(a) * d);
      ctx.lineWidth = 3 * s; ctx.strokeStyle = r() < 0.5 ? '#ffd21f' : '#ff8a00'; ctx.stroke();
    }
    ctx.beginPath(); ctx.arc(x, y, 6 * s, 0, TAU); ctx.fillStyle = '#fff6a0'; ctx.fill();
    ctx.restore();
  }

  // взрыв мультяшный: оранжево-жёлтая звезда-облако и клубы дыма, life 0..1
  function boom(ctx, x, y, size, life, seed = 3) {
    if (life < 0 || life > 1) return;
    const r = rng(seed);
    ctx.save();
    const k = Math.min(1, life / 0.25), fade = life < 0.5 ? 1 : 1 - (life - 0.5) / 0.5;
    ctx.globalAlpha = fade;
    for (const [col, kk] of [['#ff5a1f', 1], ['#ffb21f', 0.72], ['#fff3a0', 0.42]]) {
      ctx.beginPath();
      for (let i = 0; i <= 16; i++) {
        const a = i / 16 * TAU, rr = size * kk * k * (i % 2 ? 0.62 : 1) * (0.9 + r() * 0.2);
        i ? ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr * 0.85) : ctx.moveTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr * 0.85);
      }
      ctx.closePath(); ctx.fillStyle = col; ctx.fill();
      if (kk === 1) { ctx.lineWidth = 6; ctx.strokeStyle = '#5a1a08'; ctx.stroke(); }
    }
    ctx.restore();
    if (life > 0.2) for (let i = 0; i < 7; i++) {
      const a = r() * TAU, d = size * (0.5 + 0.6 * (life - 0.2)), u = (life - 0.2) / 0.8;
      puff(ctx, x + Math.cos(a) * d, y + Math.sin(a) * d * 0.7 - u * 80, size * (0.22 + 0.12 * r()) * (0.6 + u), 0.9 * (1 - u), '#6d6d6d', '#2f2f2f');
    }
  }

  // сажа на лице: тёмная клякса с белыми «просветами» — (x, y) центр, w ширина
  function soot(ctx, x, y, w = 160, alpha = 1, seed = 5) {
    if (alpha <= 0) return;
    const r = rng(seed);
    ctx.save(); ctx.globalAlpha = alpha * 0.6;
    ctx.beginPath();
    for (let i = 0; i <= 14; i++) { const a = i / 14 * TAU, rr = w * (0.42 + r() * 0.12); i ? ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr * 0.85) : ctx.moveTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr * 0.85); }
    ctx.closePath(); ctx.fillStyle = '#2b2b2b'; ctx.fill();
    ctx.restore();
  }

  // воздушный шарик на нитке: (x, y) — низ нитки (где держат), len — длина нитки, r — радиус, col — цвет,
  // sway — наклон нитки (радианы), squash — сплющивание
  function balloon(ctx, x, y, len = 150, r = 46, col = '#ff3b6b', sway = 0, squash = 1) {
    const top = [x + Math.sin(sway) * len, y - Math.cos(sway) * len];
    ctx.save();
    ctx.beginPath(); ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x + Math.sin(sway) * len * 0.5 + 12, y - Math.cos(sway) * len * 0.5, top[0], top[1]);
    ctx.lineWidth = 2.5; ctx.strokeStyle = '#333'; ctx.stroke();
    ctx.translate(top[0], top[1] - r * squash); ctx.rotate(sway * 0.6);
    ctx.beginPath(); ctx.ellipse(0, 0, r / Math.sqrt(squash), r * 1.15 * squash, 0, 0, TAU);
    ctx.fillStyle = col; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = '#2a0a14'; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-r * 0.16, r * 1.15 * squash + 8); ctx.lineTo(0, r * 1.15 * squash - 2); ctx.lineTo(r * 0.16, r * 1.15 * squash + 8); ctx.closePath();
    ctx.fillStyle = col; ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(-r * 0.35, -r * 0.45, r * 0.16, r * 0.3, 0.5, 0, TAU); ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.fill();
    ctx.restore();
  }

  // лопнувший шарик: рваные лоскутки разлетаются
  function balloonPop(ctx, x, y, life, col = '#ff3b6b', size = 1, seed = 3) {
    if (life < 0 || life > 1) return;
    const r = rng(seed);
    ctx.save();
    ctx.globalAlpha = Math.min(1, (1 - life) * 2);
    for (let i = 0; i < 9; i++) {
      const a = r() * TAU, d = (40 + r() * 90) * size * life;
      ctx.save(); ctx.translate(x + Math.cos(a) * d, y + Math.sin(a) * d + 160 * life * life); ctx.rotate(a + life * 6);
      ctx.beginPath(); ctx.moveTo(-10 * size, -6 * size); ctx.lineTo(12 * size, -3 * size); ctx.lineTo(4 * size, 8 * size); ctx.closePath();
      ctx.fillStyle = col; ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = '#2a0a14'; ctx.stroke();
      ctx.restore();
    }
    if (life < 0.3) {                                                  // «ба-бах» — звёздочка
      ctx.globalAlpha = 1 - life / 0.3;
      ctx.beginPath();
      for (let i = 0; i < 16; i++) { const a = i / 16 * TAU, rr = (i % 2 ? 22 : 50) * size * (0.6 + life * 2); ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
      ctx.closePath(); ctx.fillStyle = '#fff6a0'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = '#b07a00'; ctx.stroke();
    }
    ctx.restore();
  }

  // кактус (майнкрафт): (x, ground) — середина низа, h — высота в блоках, b — блок
  function cactus(ctx, x, ground, h = 3, b = 46) {
    ctx.save();
    for (let i = 0; i < h; i++) {
      const y = ground - (i + 1) * b;
      ctx.fillStyle = '#163d12'; ctx.fillRect(x - b / 2 - 3, y - 3, b + 6, b + 6);
      ctx.fillStyle = '#3e9a2f'; ctx.fillRect(x - b / 2, y, b, b);
      ctx.fillStyle = '#2f7d23'; ctx.fillRect(x - b / 2 + b * 0.2, y, b * 0.12, b); ctx.fillRect(x + b * 0.15, y, b * 0.12, b);
      ctx.fillStyle = '#d9f2b0';
      for (const [dx, dy] of [[-0.44, 0.2], [0.44, 0.55], [-0.44, 0.75], [0.44, 0.1]]) ctx.fillRect(x + dx * b - 3 + (dx > 0 ? 3 : -3), y + dy * b, 6, 3);   // колючки
    }
    ctx.restore();
  }

  // ведро с краской: (x, y) — середина дна, s — ширина, rot — поворот (π — вверх дном), col — краска
  function paintBucket(ctx, x, y, s = 110, rot = 0, col = '#e8262e', full = true) {
    const k = s / 110;
    ctx.save();
    ctx.translate(x, y); ctx.rotate(rot); ctx.scale(k, k);
    ctx.lineJoin = 'round'; ctx.lineWidth = 5; ctx.strokeStyle = '#1d2530';
    ctx.beginPath(); ctx.moveTo(-46, 0); ctx.lineTo(-55, -96); ctx.lineTo(55, -96); ctx.lineTo(46, 0); ctx.closePath();
    ctx.fillStyle = '#b9c3cf'; ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.fillRect(-38, -88, 10, 80);
    if (Math.cos(rot) > -0.9) {                                       // дужка (вверх дном — лежит, не видна)
      ctx.beginPath(); ctx.moveTo(-55, -96); ctx.quadraticCurveTo(-40, -150, 0, -150); ctx.quadraticCurveTo(40, -150, 55, -96);
      ctx.lineWidth = 6; ctx.stroke();
    }
    ctx.beginPath(); ctx.ellipse(0, -96, 55, 12, 0, 0, TAU); ctx.fillStyle = full ? col : '#5a6470'; ctx.fill(); ctx.lineWidth = 5; ctx.stroke();
    if (full) {                                                        // потёки краски по борту
      ctx.fillStyle = col;
      for (const [dx, l] of [[-34, 26], [6, 40], [30, 18]]) { ctx.beginPath(); ctx.ellipse(dx, -90 + l / 2, 7, l / 2, 0, 0, TAU); ctx.fill(); ctx.lineWidth = 3; ctx.stroke(); }
    }
    ctx.restore();
  }

  // большая малярная кисть: (x, y) — где держат (низ ручки), s — длина, rot — наклон (0 — щетина вверх), col — краска на щетине
  function paintBrush(ctx, x, y, s = 200, rot = 0, col = '#222') {
    const k = s / 200;
    ctx.save();
    ctx.translate(x, y); ctx.rotate(rot); ctx.scale(k, k);
    ctx.lineJoin = 'round'; ctx.lineWidth = 5; ctx.strokeStyle = '#1d1208';
    ctx.beginPath(); ctx.rect(-9, -110, 18, 110); ctx.fillStyle = '#c98b47'; ctx.fill(); ctx.stroke();      // ручка
    ctx.beginPath(); ctx.rect(-26, -146, 52, 36); ctx.fillStyle = '#b9c3cf'; ctx.fill(); ctx.stroke();     // обойма
    ctx.beginPath(); ctx.moveTo(-30, -146); ctx.lineTo(-32, -196); ctx.quadraticCurveTo(0, -206, 32, -196); ctx.lineTo(30, -146); ctx.closePath();
    ctx.fillStyle = '#e8c88a'; ctx.fill(); ctx.stroke();                                                    // щетина
    ctx.beginPath(); ctx.moveTo(-32, -180); ctx.lineTo(-32, -196); ctx.quadraticCurveTo(0, -206, 32, -196); ctx.lineTo(32, -180); ctx.quadraticCurveTo(0, -172, -32, -180);
    ctx.fillStyle = col; ctx.fill(); ctx.stroke();                                                          // краска на кончике
    ctx.restore();
  }

  // усы, нарисованные краской: (x, y) — середина над губой, w — ширина, part — сколько штрихов (0..3)
  function mustache(ctx, x, y, w = 120, part = 3, dir = 1) {
    ctx.save();
    ctx.translate(x, y); ctx.scale(dir, 1);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = '#151515';
    if (part > 0) {                                                    // левая половина
      const u = Math.min(1, part);
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.bezierCurveTo(-w * 0.2 * u, -w * 0.14, -w * 0.45 * u, -w * 0.08, -w * 0.5 * u, w * 0.04 * u);
      ctx.lineWidth = w * 0.13; ctx.stroke();
    }
    if (part > 1) {
      const u = Math.min(1, part - 1);
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.bezierCurveTo(w * 0.2 * u, -w * 0.14, w * 0.45 * u, -w * 0.08, w * 0.5 * u, w * 0.04 * u);
      ctx.lineWidth = w * 0.13; ctx.stroke();
    }
    if (part > 2) {                                                    // завитки на кончиках
      const u = Math.min(1, part - 2);
      for (const sx of [-1, 1]) {
        ctx.beginPath(); ctx.arc(sx * w * 0.5, -w * 0.06, w * 0.09, Math.PI * (sx > 0 ? 0.5 : 0.5), Math.PI * (sx > 0 ? 0.5 - 1.6 * u : 0.5 + 1.6 * u), sx < 0);
        ctx.lineWidth = w * 0.07; ctx.stroke();
      }
    }
    ctx.restore();
  }

  // нарисованная дыра: чёрный овал с неровным краем; (x, y) — центр, w — ширина, u — сколько нарисовано (0..1)
  function paintHole(ctx, x, y, w = 260, u = 1, seed = 4) {
    if (u <= 0) return;
    const r = rng(seed), h = w * 0.22;
    ctx.save();
    ctx.beginPath();
    const n = 24, m = Math.max(2, Math.round(n * u));
    for (let i = 0; i <= m; i++) {
      const a = Math.PI + (i / n) * TAU, j = 1 + (r() - 0.5) * 0.08;
      const px = x + Math.cos(a) * w / 2 * j, py = y + Math.sin(a) * h / 2 * j;
      i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
    }
    if (u >= 1) ctx.closePath(); else ctx.lineTo(x, y);
    ctx.fillStyle = '#0d0d12'; ctx.fill();
    ctx.lineWidth = 4; ctx.strokeStyle = '#2a2a35'; ctx.stroke();
    ctx.beginPath(); ctx.ellipse(x - w * 0.12, y - h * 0.18, w * 0.18, h * 0.12, 0, 0, TAU); ctx.fillStyle = 'rgba(60,60,80,0.6)'; ctx.fill();
    ctx.restore();
  }

  // брызги краски: цветные капли во все стороны и клякса в первые кадры; cols — цвета
  function paintSplash(ctx, x, y, life, cols = ['#e8262e'], size = 1, seed = 5) {
    if (life < 0 || life > 1) return;
    const r = rng(seed);
    ctx.save();
    for (let i = 0; i < 20; i++) {
      const a = r() * TAU, sp = (110 + r() * 240) * size, col = cols[i % cols.length];
      const px = x + Math.cos(a) * sp * life, py = y + Math.sin(a) * sp * life * 0.8 + 500 * life * life * size;
      const s = (8 + r() * 11) * size * (1 - 0.4 * life);
      ctx.globalAlpha = Math.min(1, (1 - life) * 2.5);
      ctx.beginPath(); ctx.arc(px, py, s, 0, TAU); ctx.fillStyle = col; ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = '#1a1a1a'; ctx.stroke();
    }
    ctx.restore();
  }

  // струя воды от a к b (дугой arc), t — секунды (бежит рябь), w — толщина, u — докуда дошла (0..1)
  function waterJet(ctx, a, b, t, w = 34, u = 1, arc = 0, alpha = 1, pal = null) {
    const PL = pal || ['#1d5e8c', '#5ab8f5', '#bfe6ff', '#8fd7ff', '#1d6fa6'];
    if (u <= 0 || alpha <= 0) return;
    const pt = (k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k - Math.sin(Math.PI * k) * arc];
    const n = 24, pts = [];
    for (let i = 0; i <= n; i++) pts.push(pt((i / n) * u));
    ctx.save(); ctx.globalAlpha = alpha; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    for (const [lw, col] of [[w + 8, PL[0]], [w, PL[1]], [w * 0.4, PL[2]]]) {
      ctx.beginPath(); pts.forEach(([x, y], i) => { const q = Math.sin(i * 1.3 - t * 30) * w * 0.12; i ? ctx.lineTo(x, y + q) : ctx.moveTo(x, y + q); });
      ctx.lineWidth = lw; ctx.strokeStyle = col; ctx.stroke();
    }
    const r = rng(Math.floor(t * 24));                                 // брызги на конце
    const e = pts[pts.length - 1];
    for (let i = 0; i < 8; i++) {
      const ang = r() * TAU, d = w * (0.6 + r() * 1.4);
      ctx.beginPath(); ctx.arc(e[0] + Math.cos(ang) * d, e[1] + Math.sin(ang) * d, 4 + r() * 6, 0, TAU);
      ctx.fillStyle = PL[3]; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = PL[4]; ctx.stroke();
    }
    ctx.restore();
  }

  // блок булыжника (майнкрафт): (x, y) — центр, s — сторона, rot — поворот
  function cobble(ctx, x, y, s = 90, rot = 0) {
    ctx.save();
    ctx.translate(x, y); ctx.rotate(rot);
    const h = s / 2, c = s / 4;
    ctx.fillStyle = '#7d7d7d'; ctx.fillRect(-h, -h, s, s);
    const cols = ['#9a9a9a', '#6a6a6a', '#8a8a8a', '#a8a8a8', '#5f5f5f'];
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { ctx.fillStyle = cols[(i * 3 + j * 2) % 5]; ctx.fillRect(-h + i * c + 1, -h + j * c + 1, c - 2, c - 2); }
    ctx.fillStyle = '#4f9a2c'; ctx.fillRect(-h, -h, s, c * 0.45); ctx.fillRect(-h, -h + c * 0.45, c, c * 0.3);    // мох
    ctx.lineWidth = 5; ctx.strokeStyle = '#2a2a2a'; ctx.strokeRect(-h, -h, s, s);
    ctx.restore();
  }

  // яблоня в стиле майнкрафта: ствол-бревно, крона из блоков листвы, на ней яблоки.
  // shake — качание кроны (пиксели), apples — [[dx, dy], ...] от центра низа кроны
  function mcAppleTree(ctx, x, ground, shake = 0, apples = [], o = {}) {
    const B = o.block || 70, trunkH = o.trunk || 440, bot = ground - trunkH;
    ctx.save();
    // ствол
    const tw = B * 0.95;
    ctx.fillStyle = '#111'; ctx.fillRect(x - tw / 2 - 4, bot - 10, tw + 8, trunkH + 14);
    ctx.fillStyle = '#7a5128'; ctx.fillRect(x - tw / 2, bot - 10, tw, trunkH + 10);
    ctx.fillStyle = '#5c3b1a';
    for (let i = 0; i < trunkH; i += 34) { ctx.fillRect(x - tw / 2 + ((i / 34) % 3) * 18 + 6, bot + i, 8, 22); ctx.fillRect(x + tw / 2 - 18 - ((i / 34) % 2) * 14, bot + i + 12, 8, 18); }
    ctx.fillStyle = '#9a6a38'; ctx.fillRect(x - tw / 2, bot - 10, 10, trunkH + 10);
    // крона: ряды блоков (снизу вверх)
    const rows = o.rows || [5, 7, 7, 5];
    const sx = shake;
    const r = rng(o.seed || 7);
    const cells = [];
    rows.forEach((n, j) => { for (let i = 0; i < n; i++) cells.push([x + sx * (0.5 + j * 0.25) + (i - n / 2) * B, bot - (j + 1) * B]); });
    ctx.fillStyle = '#111';
    for (const [cx, cy] of cells) ctx.fillRect(cx - 5, cy - 5, B + 10, B + 10);
    const greens = ['#3fae2a', '#4cc232', '#2f8f1f', '#56cf3a', '#38a326'];
    for (const [cx, cy] of cells) {
      ctx.fillStyle = greens[Math.floor(r() * greens.length)]; ctx.fillRect(cx, cy, B, B);
      for (let k = 0; k < 5; k++) { ctx.fillStyle = greens[Math.floor(r() * greens.length)]; const q = B / 5; ctx.fillRect(cx + Math.floor(r() * 5) * q, cy + Math.floor(r() * 5) * q, q, q); }
    }
    ctx.restore();
    for (const [dx, dy] of apples) apple(ctx, x + sx + dx, bot + dy, 26);
  }

  // тыква-фонарь (майнкрафт): куб, низ по центру в (x, y), поворот вокруг центра куба; face — вырезанное лицо
  function pumpkinBlock(ctx, x, y, s = 140, rot = 0, face = true, sq = 1) {
    ctx.save();
    ctx.translate(x, y); ctx.scale(1 / sq, sq); ctx.translate(0, -s / 2); ctx.rotate(rot);   // sq — сплющивание от низа, площадь та же
    const h = s / 2;
    ctx.fillStyle = '#111'; ctx.fillRect(-h - 5, -h - 5, s + 10, s + 10);
    ctx.fillStyle = '#f39314'; ctx.fillRect(-h, -h, s, s);
    ctx.fillStyle = '#d6740a';
    for (const k of [0.18, 0.5, 0.8]) ctx.fillRect(-h + s * k, -h, s * 0.06, s);
    ctx.fillStyle = '#ffab3a'; ctx.fillRect(-h, -h, s, s * 0.08);
    ctx.fillStyle = '#4a7a1a'; ctx.fillRect(-s * 0.08, -h - s * 0.14, s * 0.16, s * 0.14);       // хвостик
    ctx.strokeStyle = '#111'; ctx.lineWidth = 4; ctx.strokeRect(-s * 0.08, -h - s * 0.14, s * 0.16, s * 0.14);
    if (face) {
      const u = s / 8;
      ctx.fillStyle = '#3a1d05';
      ctx.fillRect(-2.6 * u, -1.8 * u, 1.6 * u, 1.4 * u); ctx.fillRect(1.0 * u, -1.8 * u, 1.6 * u, 1.4 * u);   // глаза
      ctx.fillRect(-2.6 * u, 0.8 * u, 5.2 * u, 1.0 * u);                                                         // рот
      ctx.fillRect(-2.6 * u, 1.8 * u, 1.0 * u, 0.7 * u); ctx.fillRect(-0.5 * u, 1.8 * u, 1.0 * u, 0.7 * u); ctx.fillRect(1.6 * u, 1.8 * u, 1.0 * u, 0.7 * u);
      ctx.fillStyle = '#ffd23a';
      ctx.fillRect(-2.3 * u, -1.5 * u, 0.6 * u, 0.5 * u); ctx.fillRect(1.3 * u, -1.5 * u, 0.6 * u, 0.5 * u);
    }
    ctx.restore();
  }

  // сундук-кусака (майнкрафт): низ по центру в (x, y), ширина s; lid — угол крышки (0 — закрыт);
  // o: dir — в какую сторону открывается пасть (петли с другой стороны), teeth, eyes (глаза в темноте),
  // glow 0..1 (золотой свет изнутри), rot, sq (сплющивание от низа, площадь та же)
  function mcChest(ctx, x, y, s = 170, lid = 0, o = {}) {
    const dir = o.dir || 1, bh = s * 0.6, lh = s * 0.28, sq = o.sq || 1;
    ctx.save();
    ctx.translate(x, y); ctx.rotate(o.rot || 0); ctx.scale(1 / sq, sq);
    const top = -bh, hx = -dir * s / 2, a = -dir * lid, ca = Math.cos(a), sa = Math.sin(a);
    const onLid = (px, py) => [hx + px * ca - py * sa, top + px * sa + py * ca];   // точка крышки (от петли)
    const L = onLid(dir * s, 0);
    ctx.lineJoin = 'round';
    if (lid > 0.03) {
      // пасть
      ctx.fillStyle = '#1e0f04';
      ctx.beginPath(); ctx.moveTo(hx, top); ctx.lineTo(-hx, top); ctx.lineTo(L[0], L[1]); ctx.closePath(); ctx.fill();
      if (o.glow > 0) {
        const cx = (hx - hx + L[0]) / 3 + hx * 0.33, cy = (top * 2 + L[1]) / 3;
        ctx.save(); ctx.globalAlpha = o.glow;
        const g = ctx.createRadialGradient(cx, cy, 4, cx, cy, s * 1.3);
        g.addColorStop(0, 'rgba(255,240,120,0.95)'); g.addColorStop(0.4, 'rgba(255,214,40,0.45)'); g.addColorStop(1, 'rgba(255,214,40,0)');
        ctx.fillStyle = g;
        for (let i = 0; i < 7; i++) {
          const an = -Math.PI / 2 + (i - 3) * 0.24 + Math.sin((o.t || 0) * 3 + i) * 0.04;
          ctx.beginPath(); ctx.moveTo(cx, cy);
          ctx.lineTo(cx + Math.cos(an - 0.07) * s * 1.6, cy + Math.sin(an - 0.07) * s * 1.6);
          ctx.lineTo(cx + Math.cos(an + 0.07) * s * 1.6, cy + Math.sin(an + 0.07) * s * 1.6);
          ctx.closePath(); ctx.fill();
        }
        ctx.beginPath(); ctx.arc(cx, cy, s * 0.5, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      }
      if (o.teeth !== false) {
        const n = 5, th = s * 0.11;
        ctx.fillStyle = '#fffdf2'; ctx.strokeStyle = '#111'; ctx.lineWidth = 3;
        for (let i = 0; i < n; i++) {                          // нижние — по краю ящика, вверх
          const x0 = hx + (-hx * 2) * (i + 0.08) / n, x1 = hx + (-hx * 2) * (i + 0.92) / n;
          ctx.beginPath(); ctx.moveTo(x0, top); ctx.lineTo((x0 + x1) / 2, top - th); ctx.lineTo(x1, top); ctx.closePath(); ctx.fill(); ctx.stroke();
        }
        for (let i = 0; i < n; i++) {                          // верхние — по краю крышки, к ящику
          const p0 = onLid(dir * s * (i + 0.08) / n, 0), p1 = onLid(dir * s * (i + 0.92) / n, 0), pm = onLid(dir * s * (i + 0.5) / n, th);
          ctx.beginPath(); ctx.moveTo(p0[0], p0[1]); ctx.lineTo(pm[0], pm[1]); ctx.lineTo(p1[0], p1[1]); ctx.closePath(); ctx.fill(); ctx.stroke();
        }
      }
      if (o.eyes) {
        const ex = (hx * 0.3 + -hx + L[0]) / 2.3, ey = top - (top - L[1]) * 0.28, r = s * 0.07;
        for (const k of [-1, 1]) {
          ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(ex + k * r * 1.5, ey, r, r * 1.25, 0, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc(ex + k * r * 1.5 + (o.look || 0) * r * 0.4, ey + r * 0.15, r * 0.5, 0, Math.PI * 2); ctx.fill();
        }
      }
    }
    // ящик
    const plank = (px, py, w, h) => {
      ctx.fillStyle = '#111'; ctx.fillRect(px - 4, py - 4, w + 8, h + 8);
      ctx.fillStyle = '#a8702e'; ctx.fillRect(px, py, w, h);
      ctx.fillStyle = '#8c5a22';
      for (let k = 1; k < 4; k++) ctx.fillRect(px, py + h * k / 4 - 2, w, 4);
      ctx.fillStyle = '#5e3a12';
      ctx.fillRect(px, py, w, h * 0.12); ctx.fillRect(px, py + h * 0.88, w, h * 0.12);
      ctx.fillRect(px, py, w * 0.08, h); ctx.fillRect(px + w * 0.92, py, w * 0.08, h);
    };
    plank(-s / 2, top, s, bh);
    // крышка
    ctx.save(); ctx.translate(hx, top); ctx.rotate(a);
    const lx = dir > 0 ? 0 : -s;
    plank(lx, -lh, s, lh);
    ctx.fillStyle = '#111'; ctx.fillRect(dir * s * 0.5 - s * 0.075, -lh * 0.45, s * 0.15, s * 0.2);      // замок
    ctx.fillStyle = '#c9c9c9'; ctx.fillRect(dir * s * 0.5 - s * 0.055, -lh * 0.45 + 3, s * 0.11, s * 0.2 - 6);
    ctx.restore();
    ctx.restore();
  }

  // рожок мороженого: (x, y) — середина края вафли, s — ширина края; вафля вниз (при rot = 0),
  // шарики вверх стопкой (scoops — цвета снизу вверх); drip 0..1 — потёки по краю
  function iceCream(ctx, x, y, s = 160, rot = 0, scoops = ['#ff9ec7', '#fff3d6', '#8a5634'], drip = 0) {
    ctx.save();
    ctx.translate(x, y); ctx.rotate(rot);
    ctx.lineJoin = 'round'; ctx.lineWidth = Math.max(4, s * 0.04); ctx.strokeStyle = '#111';
    const h = s * 1.35;
    ctx.beginPath(); ctx.moveTo(-s / 2, 0); ctx.lineTo(s / 2, 0); ctx.lineTo(0, h); ctx.closePath();
    ctx.fillStyle = '#e8b25c'; ctx.fill();
    ctx.save(); ctx.clip();
    ctx.strokeStyle = '#b57b2e'; ctx.lineWidth = Math.max(3, s * 0.03);
    for (let k = -4; k <= 4; k++) {
      ctx.beginPath(); ctx.moveTo(k * s * 0.22 - s * 0.6, 0); ctx.lineTo(k * s * 0.22 + s * 0.6, h); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(k * s * 0.22 + s * 0.6, 0); ctx.lineTo(k * s * 0.22 - s * 0.6, h); ctx.stroke();
    }
    ctx.restore();
    ctx.strokeStyle = '#111'; ctx.lineWidth = Math.max(4, s * 0.04);
    ctx.beginPath(); ctx.moveTo(-s / 2, 0); ctx.lineTo(s / 2, 0); ctx.lineTo(0, h); ctx.closePath(); ctx.stroke();
    const r = s * 0.5;
    scoops.forEach((col, i) => {
      const cy = -r * 0.55 - i * r * 1.25;
      ctx.beginPath();
      ctx.arc(0, cy, r, Math.PI * 0.92, Math.PI * 2.08);
      for (let k = 0; k <= 6; k++) {                          // волнистый низ шарика
        const u = k / 6, px = r * Math.cos(Math.PI * 0.08) * (1 - 2 * u);
        ctx.quadraticCurveTo(px + r * 0.16, cy + r * 0.42 + (k % 2 ? r * 0.18 : 0), px, cy + r * 0.3);
      }
      ctx.closePath(); ctx.fillStyle = col; ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(-r * 0.38, cy - r * 0.35, r * 0.18, r * 0.11, -0.6, 0, TAU); ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.fill();
      if (i === 0 && drip > 0) {
        for (const [dx, len] of [[-0.6, 0.5], [-0.15, 0.85], [0.42, 0.62]]) {
          const L = len * drip * r;
          ctx.beginPath(); ctx.moveTo(dx * r - r * 0.09, cy + r * 0.3); ctx.lineTo(dx * r - r * 0.09, cy + r * 0.3 + L);
          ctx.arc(dx * r, cy + r * 0.3 + L, r * 0.09, Math.PI, 0, true); ctx.lineTo(dx * r + r * 0.09, cy + r * 0.3);
          ctx.fillStyle = col; ctx.fill(); ctx.lineWidth = Math.max(3, s * 0.025); ctx.stroke(); ctx.lineWidth = Math.max(4, s * 0.04);
        }
      }
    });
    ctx.restore();
  }

  // шарик мороженого на макушке: (x, y) — макушка, w — ширина; drip 0..1 — потёки вниз по лицу
  function scoopCap(ctx, x, y, w = 150, col = '#8a5634', drip = 0, alpha = 1) {
    if (alpha <= 0) return;
    ctx.save(); ctx.globalAlpha = alpha;
    ctx.lineJoin = 'round'; ctx.lineWidth = Math.max(3, w * 0.035); ctx.strokeStyle = '#111';
    for (const [dx, len] of [[-0.38, 0.55], [-0.05, 0.9], [0.3, 0.65]]) {
      const L = len * drip * w, rr = w * 0.07;
      ctx.beginPath(); ctx.moveTo(x + dx * w - rr, y); ctx.lineTo(x + dx * w - rr, y + L);
      ctx.arc(x + dx * w, y + L, rr, Math.PI, 0, true); ctx.lineTo(x + dx * w + rr, y);
      ctx.fillStyle = col; ctx.fill(); ctx.stroke();
    }
    ctx.beginPath(); ctx.ellipse(x, y - w * 0.12, w * 0.5, w * 0.36, 0, Math.PI * 0.95, Math.PI * 2.05);
    for (let k = 0; k <= 6; k++) { const u = k / 6, px = x + w * 0.5 * (1 - 2 * u); ctx.quadraticCurveTo(px + w * 0.08, y + w * 0.12 + (k % 2 ? w * 0.08 : 0), px, y + w * 0.05); }
    ctx.closePath(); ctx.fillStyle = col; ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(x - w * 0.18, y - w * 0.26, w * 0.1, w * 0.06, -0.5, 0, TAU); ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.fill();
    ctx.restore();
  }

  // ледяная глыба: низ по центру в (x, y), w×h; crack 0..1 — трещины; grow 0..1 — растёт снизу вверх
  function iceBlock(ctx, x, y, w, h, crack = 0, grow = 1, seed = 3) {
    if (grow <= 0) return;
    const hh = h * grow;
    ctx.save();
    ctx.lineJoin = 'round';
    ctx.fillStyle = 'rgba(150,215,255,0.42)'; ctx.fillRect(x - w / 2, y - hh, w, hh);
    ctx.fillStyle = 'rgba(235,250,255,0.55)';
    ctx.beginPath(); ctx.moveTo(x - w / 2 + w * 0.08, y - hh + 8); ctx.lineTo(x - w / 2 + w * 0.22, y - hh + 8); ctx.lineTo(x - w / 2 + w * 0.08, y - hh + hh * 0.45); ctx.closePath(); ctx.fill();
    ctx.fillRect(x + w / 2 - w * 0.12, y - hh + 10, w * 0.05, hh * 0.3);
    ctx.lineWidth = 6; ctx.strokeStyle = '#2a6fa8'; ctx.strokeRect(x - w / 2, y - hh, w, hh);
    ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.strokeRect(x - w / 2 + 7, y - hh + 7, w - 14, hh - 14);
    if (crack > 0) {
      const r = rng(seed);
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 4; ctx.lineCap = 'round';
      for (let i = 0; i < 5; i++) {
        let px = x + (r() - 0.5) * w * 0.6, py = y - hh * (0.2 + r() * 0.6);
        ctx.beginPath(); ctx.moveTo(px, py);
        const n = Math.ceil(4 * crack);
        for (let k = 0; k < n; k++) { px += (r() - 0.5) * w * 0.35; py += (r() - 0.5) * hh * 0.3; ctx.lineTo(px, py); }
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  // морозное дыхание: от a к b клубы и снежинки; t — время (с), alpha
  function frost(ctx, a, b, t, alpha = 1, seed = 4) {
    const r = rng(seed);
    ctx.save();
    for (let i = 0; i < 14; i++) {
      const ph = r(), u = (t * 1.8 + ph) % 1, off = (r() - 0.5) * 2;
      const px = E.lerp(a[0], b[0], u) + off * 30 * u, py = E.lerp(a[1], b[1], u) + off * 60 * u;
      puff(ctx, px, py, 16 + 40 * u, alpha * 0.75 * (1 - u * 0.6), '#e6f6ff', '#7fb3dc');
    }
    ctx.fillStyle = '#ffffff'; ctx.strokeStyle = '#4f8fc4'; ctx.lineWidth = 2;
    for (let i = 0; i < 10; i++) {
      const ph = r(), u = (t * 2.2 + ph) % 1, off = (r() - 0.5) * 2;
      const px = E.lerp(a[0], b[0], u) + off * 50 * u, py = E.lerp(a[1], b[1], u) + off * 70 * u;
      ctx.globalAlpha = alpha; star(ctx, px, py, 6, 12, 5, t * 4 + i); ctx.fill(); ctx.stroke();
    }
    ctx.restore();
  }

  // волшебный радужный луч из точки a в b; grow 0..1 — дотянулся, alpha
  function magicBeam(ctx, a, b, t, grow = 1, alpha = 1) {
    const ex = E.lerp(a[0], b[0], grow), ey = E.lerp(a[1], b[1], grow);
    ctx.save(); ctx.globalAlpha = alpha; ctx.lineCap = 'round';
    const cols = ['#ff2a3a', '#ff9a00', '#ffe500', '#2ed14a', '#2aa0ff', '#8a4dff'];
    const nx = -(ey - a[1]), ny = ex - a[0], L = Math.hypot(nx, ny) || 1;
    ctx.lineWidth = 50; ctx.strokeStyle = '#111'; ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(ex, ey); ctx.stroke();
    cols.forEach((c, i) => {
      const k = (i - 2.5) * 7.5;
      ctx.lineWidth = 8.5; ctx.strokeStyle = c;
      ctx.beginPath(); ctx.moveTo(a[0] + nx / L * k, a[1] + ny / L * k); ctx.lineTo(ex + nx / L * k, ey + ny / L * k); ctx.stroke();
    });
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 6; i++) {
      const u = ((t * 2.5 + i / 6) % 1) * grow;
      star(ctx, E.lerp(a[0], b[0], u), E.lerp(a[1], b[1], u), 4, 18, 6, t * 5 + i); ctx.fill();
    }
    ctx.restore();
  }

  // рельсы вдоль ломаной pts [[x, y], ...] (y — верх рельса): шпалы и железная полоса
  function rails(ctx, pts) {
    ctx.save();
    ctx.lineCap = 'butt';
    for (let i = 0; i + 1 < pts.length; i++) {
      const [x0, y0] = pts[i], [x1, y1] = pts[i + 1], L = Math.hypot(x1 - x0, y1 - y0), a = Math.atan2(y1 - y0, x1 - x0);
      for (let d = 18; d < L; d += 56) {
        const px = x0 + Math.cos(a) * d, py = y0 + Math.sin(a) * d;
        ctx.save(); ctx.translate(px, py); ctx.rotate(a);
        ctx.fillStyle = '#111'; ctx.fillRect(-19, 2, 38, 16);
        ctx.fillStyle = '#8a5a2b'; ctx.fillRect(-16, 4, 32, 11);
        ctx.restore();
      }
    }
    for (const [w, c] of [[12, '#111'], [7, '#a8a8a8']]) {
      ctx.lineWidth = w; ctx.strokeStyle = c;
      ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y + 2) : ctx.moveTo(x, y + 2))); ctx.stroke();
    }
    ctx.lineWidth = 2; ctx.strokeStyle = '#e6e6e6';
    ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.stroke();
    ctx.restore();
  }

  // горка из блоков земли с травой: столбики [[x, ширина, высота], ...] от земли y
  function grassSteps(ctx, y, cols, B = 70) {
    ctx.save();
    for (const [x, w, h] of cols) {
      ctx.fillStyle = '#111'; ctx.fillRect(x - 3, y - h - 3, w + 6, h + 3);
      for (let yy = y - h; yy < y; yy += B) {
        for (let xx = x; xx < x + w; xx += B) {
          const top = yy === y - h, bw = Math.min(B, x + w - xx), bh = Math.min(B, y - yy);
          ctx.fillStyle = top ? '#8a5a2b' : '#7a4f25'; ctx.fillRect(xx, yy, bw, bh);
          ctx.fillStyle = '#6a421c';
          for (let k = 0; k < 4; k++) ctx.fillRect(xx + ((k * 37 + yy) % (bw - 12)) + 2, yy + ((k * 23 + xx) % (bh - 12)) + 2, 10, 10);
          if (top) { ctx.fillStyle = '#5fd331'; ctx.fillRect(xx, yy, bw, bh * 0.28); ctx.fillStyle = '#46b81f'; for (let k = 0; k < bw; k += 14) ctx.fillRect(xx + k, yy + bh * 0.28, 7, 7); }
          ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(xx, yy + bh - 3, bw, 3); ctx.fillRect(xx + bw - 3, yy, 3, bh);
        }
      }
    }
    ctx.restore();
  }

  // вагонетка (майнкрафт): (x, y) — низ колёс по центру, w — ширина; rot вокруг центра ящика
  // center: (x, y) — середина ящика (иначе низ колёс; поворот — вокруг этой точки)
  function minecart(ctx, x, y, w = 240, rot = 0, sq = 1, center = false) {
    const bh = w * 0.46, wr = w * 0.1, up = wr * 2 + bh / 2 - 4;
    ctx.save();
    ctx.translate(x, y); ctx.rotate(rot); ctx.scale(1 / sq, sq);
    if (!center) ctx.translate(0, -up);
    ctx.lineJoin = 'round';
    for (const k of [-0.3, 0.3]) {                                   // колёса
      ctx.beginPath(); ctx.arc(k * w, bh / 2 + wr - 4, wr, 0, TAU); ctx.fillStyle = '#2b2b2b'; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = '#111'; ctx.stroke();
      ctx.beginPath(); ctx.arc(k * w, bh / 2 + wr - 4, wr * 0.35, 0, TAU); ctx.fillStyle = '#8a8a8a'; ctx.fill();
    }
    ctx.fillStyle = '#111'; ctx.fillRect(-w / 2 - 5, -bh / 2 - 5, w + 10, bh + 10);
    ctx.fillStyle = '#8f949b'; ctx.fillRect(-w / 2, -bh / 2, w, bh);
    ctx.fillStyle = '#6c7178';
    ctx.fillRect(-w / 2, -bh / 2, w, bh * 0.16); ctx.fillRect(-w / 2, bh / 2 - bh * 0.16, w, bh * 0.16);
    ctx.fillRect(-w / 2, -bh / 2, w * 0.07, bh); ctx.fillRect(w / 2 - w * 0.07, -bh / 2, w * 0.07, bh);
    ctx.fillStyle = '#b4b9c0'; ctx.fillRect(-w / 2 + w * 0.07, -bh / 2 + bh * 0.16, w * 0.86, bh * 0.08);
    ctx.fillStyle = '#5a5e64';
    for (const k of [-0.25, 0, 0.25]) ctx.fillRect(k * w - 5, -bh / 2 + bh * 0.3, 10, bh * 0.38);
    ctx.restore();
  }

  // воздушный змей (ромб из цветных клеток, хвост с бантиками): (x, y) — центр, s — высота ромба,
  // rot — наклон, t — время (хвост вьётся), tail — куда тянется хвост (угол)
  function kite(ctx, x, y, s = 200, rot = 0, t = 0, tail = Math.PI / 2) {
    ctx.save();
    ctx.translate(x, y);
    // хвост: волнистая линия с бантиками
    const L = s * 1.6, n = 4;
    const tp = (u) => {
      const d = s * 0.5 + u * L, w = Math.sin(u * 9 - t * 8) * s * 0.12 * u;
      return [Math.cos(tail) * d - Math.sin(tail) * w, Math.sin(tail) * d + Math.cos(tail) * w];
    };
    ctx.lineWidth = 5; ctx.strokeStyle = '#111'; ctx.beginPath();
    for (let i = 0; i <= 20; i++) { const [px, py] = tp(i / 20); i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }
    ctx.stroke();
    const bows = ['#ff2a3a', '#ffd21f', '#2aa0ff', '#2ed14a'];
    for (let i = 1; i <= n; i++) {
      const [px, py] = tp(i / n), b = s * 0.08;
      ctx.fillStyle = bows[i % 4]; ctx.strokeStyle = '#111'; ctx.lineWidth = 3;
      for (const k of [-1, 1]) { ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px + k * b * 1.4, py - b); ctx.lineTo(px + k * b * 1.4, py + b); ctx.closePath(); ctx.fill(); ctx.stroke(); }
    }
    // ромб из клеток
    ctx.rotate(rot);
    const h = s / 2, wq = s * 0.36, cols = ['#ff2a3a', '#ff9a00', '#ffe500', '#2ed14a', '#2aa0ff', '#8a4dff'];
    ctx.save();
    ctx.beginPath(); ctx.moveTo(0, -h); ctx.lineTo(wq, -h * 0.25); ctx.lineTo(0, h); ctx.lineTo(-wq, -h * 0.25); ctx.closePath(); ctx.clip();
    const B = s / 8;
    for (let i = -6; i < 6; i++) for (let j = -5; j < 5; j++) { ctx.fillStyle = cols[((i + j) % 6 + 6) % 6]; ctx.fillRect(i * B, j * B, B, B); }
    ctx.restore();
    ctx.lineWidth = 6; ctx.strokeStyle = '#111';
    ctx.beginPath(); ctx.moveTo(0, -h); ctx.lineTo(wq, -h * 0.25); ctx.lineTo(0, h); ctx.lineTo(-wq, -h * 0.25); ctx.closePath(); ctx.stroke();
    ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(0, -h); ctx.lineTo(0, h); ctx.moveTo(-wq, -h * 0.25); ctx.lineTo(wq, -h * 0.25); ctx.stroke();
    ctx.restore();
  }

  // нитка змея: провисающая кривая от a к b; spark 0..1 — искра бежит по нитке от b к a
  function kiteString(ctx, a, b, sag = 60, spark = -1, t = 0) {
    const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2 + sag;
    ctx.save();
    ctx.lineWidth = 3; ctx.strokeStyle = '#2b2b2b';
    ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.quadraticCurveTo(mx, my, b[0], b[1]); ctx.stroke();
    if (spark >= 0 && spark <= 1) {
      const u = 1 - spark, px = (1 - u) * (1 - u) * a[0] + 2 * (1 - u) * u * mx + u * u * b[0], py = (1 - u) * (1 - u) * a[1] + 2 * (1 - u) * u * my + u * u * b[1];
      ctx.fillStyle = '#ffe14d'; ctx.strokeStyle = '#111'; ctx.lineWidth = 3;
      star(ctx, px, py, 6, 30, 12, t * 20); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#fff'; star(ctx, px, py, 6, 14, 6, t * 20); ctx.fill();
    }
    ctx.restore();
  }

  // попкорн: пушистое облачко с жёлтой серединкой; (x, y) — центр, r — радиус
  function popcorn(ctx, x, y, r = 16, rot = 0) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
    const P = [[-0.45, 0.1, 0.55], [0.4, 0.15, 0.55], [0, -0.4, 0.6], [0.05, 0.35, 0.5]];
    ctx.lineWidth = Math.max(2, r * 0.16); ctx.strokeStyle = '#6b5326';
    for (const [dx, dy, rr] of P) { ctx.beginPath(); ctx.arc(dx * r, dy * r, rr * r, 0, TAU); ctx.stroke(); }
    ctx.fillStyle = '#fff8e2';
    for (const [dx, dy, rr] of P) { ctx.beginPath(); ctx.arc(dx * r, dy * r, rr * r - ctx.lineWidth / 2, 0, TAU); ctx.fill(); }
    ctx.fillStyle = '#ffcf3a'; ctx.beginPath(); ctx.arc(0.1 * r, 0.05 * r, r * 0.22, 0, TAU); ctx.fill();
    ctx.restore();
  }

  // куча попкорна: низ по центру в (x, ground), ширина w, высота h
  function popcornPile(ctx, x, ground, w, h, seed = 3) {
    if (h < 2) return;
    const r = rng(seed), R = Math.max(14, Math.min(26, w / 18));
    ctx.save();
    ctx.beginPath(); ctx.ellipse(x, ground, w / 2, h, 0, Math.PI, TAU); ctx.closePath();
    ctx.fillStyle = '#fff1c8'; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = '#6b5326'; ctx.stroke();
    const n = Math.round(w * h / 1400);
    for (let i = 0; i < n; i++) {
      const a = Math.PI + r() * Math.PI, d = Math.sqrt(r());
      popcorn(ctx, x + Math.cos(a) * w / 2 * d, ground + Math.sin(a) * h * d, R * (0.8 + r() * 0.5), r() * 6);
    }
    for (let i = 0; i <= 18; i++) {                         // пушистый край
      const a = Math.PI + (i / 18) * Math.PI;
      popcorn(ctx, x + Math.cos(a) * w / 2, ground + Math.sin(a) * h, R * (0.9 + r() * 0.4), r() * 6);
    }
    ctx.restore();
  }

  // ведёрко попкорна (красно-белые полосы): низ по центру в (x, y), s — ширина верха
  function popBucket(ctx, x, y, s = 160, full = true, rot = 0) {
    const h = s * 1.1, b = s * 0.7;
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
    if (full) for (let i = 0; i < 9; i++) popcorn(ctx, (i / 8 - 0.5) * s * 0.85, -h - s * 0.08 - Math.sin(i / 8 * Math.PI) * s * 0.2, s * 0.13, i);
    ctx.beginPath(); ctx.moveTo(-b / 2, 0); ctx.lineTo(-s / 2, -h); ctx.lineTo(s / 2, -h); ctx.lineTo(b / 2, 0); ctx.closePath();
    ctx.save(); ctx.clip();
    for (let i = -4; i <= 4; i++) { ctx.fillStyle = i % 2 ? '#ffffff' : '#e8262e'; ctx.fillRect(i * s / 9 - s / 18, -h, s / 9, h); }
    ctx.restore();
    ctx.lineWidth = 5; ctx.strokeStyle = '#111'; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(-b / 2, 0); ctx.lineTo(-s / 2, -h); ctx.lineTo(s / 2, -h); ctx.lineTo(b / 2, 0); ctx.closePath(); ctx.stroke();
    ctx.fillStyle = '#ffd21f'; ctx.lineWidth = 4; star(ctx, 0, -h * 0.5, 5, s * 0.17, s * 0.08, 0); ctx.fill(); ctx.stroke();
    ctx.restore();
  }

  // початок кукурузы: центр (x, y), длина len, rot; pop 0..1 — початок раздувается и трясётся
  function cornCob(ctx, x, y, len = 160, rot = 0, pop = 0) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(1 + pop * 0.15, 1 + pop * 0.15);
    const w = len * 0.36;
    ctx.lineJoin = 'round'; ctx.lineWidth = 5; ctx.strokeStyle = '#111';
    ctx.beginPath(); ctx.ellipse(0, 0, len / 2, w / 2, 0, 0, TAU); ctx.fillStyle = pop > 0 ? '#ffb21f' : '#ffd21f'; ctx.fill(); ctx.stroke();
    ctx.save(); ctx.clip();
    ctx.fillStyle = '#e8a300';
    for (let i = -6; i <= 6; i++) for (let j = -2; j <= 2; j++) ctx.fillRect(i * len / 13 - 3 + (j % 2) * len / 26, j * w / 5 - 3, 6, 6);
    ctx.restore();
    ctx.fillStyle = '#4fc43a';                              // листья обёртки
    for (const k of [-1, 1]) {
      ctx.beginPath(); ctx.moveTo(len * 0.5, 0); ctx.quadraticCurveTo(len * 0.2, k * w * 0.9, -len * 0.15, k * w * 0.45);
      ctx.quadraticCurveTo(len * 0.25, k * w * 0.3, len * 0.5, 0); ctx.fill(); ctx.stroke();
    }
    ctx.restore();
  }

  // солнечный луч (как лупой): от a к b; alpha, t — дрожание
  function sunRay(ctx, a, b, t, alpha = 1) {
    if (alpha <= 0) return;
    ctx.save(); ctx.globalAlpha = alpha; ctx.lineCap = 'round';
    const wob = Math.sin(t * 30) * 3;
    for (const [w, c] of [[64 + wob, 'rgba(255,214,40,0.35)'], [36 + wob, 'rgba(255,230,90,0.7)'], [14, '#fffbe0']]) {
      ctx.lineWidth = w; ctx.strokeStyle = c; ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
    }
    const g = ctx.createRadialGradient(b[0], b[1], 4, b[0], b[1], 90);
    g.addColorStop(0, 'rgba(255,255,230,1)'); g.addColorStop(0.4, 'rgba(255,190,40,0.6)'); g.addColorStop(1, 'rgba(255,120,0,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(b[0], b[1], 90, 0, TAU); ctx.fill();
    ctx.restore();
  }

  // кирка (майнкрафт, алмазная): (x, y) — низ рукояти (хват), s — длина, rot — наклон (0 — головка вверх)
  function pickaxe(ctx, x, y, s = 200, rot = 0) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
    const w = s * 0.11, q = s / 12;
    ctx.fillStyle = '#111'; ctx.fillRect(-w / 2 - 4, -s * 0.92, w + 8, s * 0.92 + 4);
    ctx.fillStyle = '#8a5a2b'; ctx.fillRect(-w / 2, -s * 0.92, w, s * 0.92);
    ctx.fillStyle = '#5e3a12'; for (let k = 1; k < 6; k++) ctx.fillRect(-w / 2, -k * s * 0.15, w, q * 0.5);
    // головка: дуга из квадратиков
    const cells = [[-5, 1], [-4, 0], [-3, -1], [-2, -1], [-1, -2], [0, -2], [1, -2], [2, -1], [3, -1], [4, 0], [5, 1]];
    ctx.fillStyle = '#111';
    for (const [i, j] of cells) ctx.fillRect(i * q - q / 2 - 4, -s + j * q - 4, q + 8, q * 1.6 + 8);
    for (const [i, j] of cells) {
      ctx.fillStyle = Math.abs(i) > 3 ? '#2fa8a0' : '#5fe0d8'; ctx.fillRect(i * q - q / 2, -s + j * q, q, q * 1.6);
      ctx.fillStyle = '#c8fffa'; ctx.fillRect(i * q - q / 2, -s + j * q, q, q * 0.4);
    }
    ctx.restore();
  }

  // блок травы (майнкрафт) с центром (x, y), сторона b, поворот rot, масштаб k (появление)
  function grassBlock(ctx, x, y, b = 100, rot = 0, k = 1) {
    if (k <= 0) return;
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(k, k);
    grassSteps(ctx, b / 2, [[-b / 2, b, b]], b);
    ctx.restore();
  }

  // яма в земле (разрез): x0..x1, от поверхности y вниз на глубину d
  function pit(ctx, x0, x1, y, d) {
    ctx.save();
    ctx.fillStyle = '#111'; ctx.fillRect(x0 - 4, y - 2, x1 - x0 + 8, d + 6);
    ctx.fillStyle = '#3a2410'; ctx.fillRect(x0, y, x1 - x0, d);
    ctx.fillStyle = '#2a190a';
    for (let yy = y; yy < y + d; yy += 50) for (let xx = x0 + ((yy - y) / 50 % 2) * 25; xx < x1; xx += 50) ctx.fillRect(xx, yy, 24, 24);
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(x0, y, x1 - x0, 18);
    ctx.restore();
  }

  // острый перец: центр (x, y), длина s, поворот rot (0 — хвостик слева, кончик вправо-вниз)
  function chili(ctx, x, y, s = 90, rot = 0, col = '#e8262e') {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
    const w = s * 0.26;
    ctx.lineJoin = 'round'; ctx.lineWidth = Math.max(3, s * 0.05); ctx.strokeStyle = '#111';
    ctx.beginPath();
    ctx.moveTo(-s * 0.4, -w * 0.5);
    ctx.bezierCurveTo(-s * 0.05, -w * 0.75, s * 0.35, -w * 0.4, s * 0.5, w * 0.9);
    ctx.bezierCurveTo(s * 0.25, w * 0.25, -s * 0.1, w * 0.65, -s * 0.4, w * 0.5);
    ctx.quadraticCurveTo(-s * 0.5, 0, -s * 0.4, -w * 0.5);
    ctx.closePath(); ctx.fillStyle = col; ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(-s * 0.12, -w * 0.25, s * 0.14, w * 0.12, -0.15, 0, TAU); ctx.fillStyle = 'rgba(255,255,255,0.65)'; ctx.fill();
    ctx.fillStyle = '#3fae2a';                              // чашечка и хвостик
    ctx.beginPath(); ctx.moveTo(-s * 0.4, -w * 0.6); ctx.lineTo(-s * 0.3, 0); ctx.lineTo(-s * 0.4, w * 0.6); ctx.lineTo(-s * 0.5, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-s * 0.45, 0); ctx.quadraticCurveTo(-s * 0.6, -w * 0.2, -s * 0.62, -w * 0.9); ctx.lineWidth = Math.max(4, s * 0.07); ctx.strokeStyle = '#111'; ctx.stroke();
    ctx.lineWidth = Math.max(2, s * 0.035); ctx.strokeStyle = '#3fae2a'; ctx.stroke();
    ctx.restore();
  }

  // куст перца из блоков листвы: низ по центру (x, ground), перцы — [[dx, dy, rot], ...] от центра низа
  function chiliBush(ctx, x, ground, b = 56, peppers = [], seed = 5) {
    const r = rng(seed), cells = [[-1, 0], [0, 0], [1, 0], [-1, 1], [0, 1], [1, 1], [0, 2], [-2, 0], [2, 0], [-1, 2], [1, 2]];
    ctx.save();
    ctx.fillStyle = '#111';
    for (const [i, j] of cells) ctx.fillRect(x + i * b - b / 2 - 4, ground - (j + 1) * b - 4, b + 8, b + 8);
    const g = ['#2f8f1f', '#3fae2a', '#4cc232', '#38a326'];
    for (const [i, j] of cells) {
      ctx.fillStyle = g[Math.floor(r() * 4)]; ctx.fillRect(x + i * b - b / 2, ground - (j + 1) * b, b, b);
      ctx.fillStyle = g[Math.floor(r() * 4)]; ctx.fillRect(x + i * b - b / 2 + b * 0.5 * Math.floor(r() * 2), ground - (j + 1) * b + b * 0.5 * Math.floor(r() * 2), b / 2, b / 2);
    }
    ctx.restore();
    for (const [dx, dy, rot] of peppers) chili(ctx, x + dx, ground + dy, b * 1.2, rot);
  }

  // огненное дыхание: конус языков пламени от a к b; t — время, alpha
  function fireBreath(ctx, a, b, t, alpha = 1, seed = 2) {
    if (alpha <= 0) return;
    const r = rng(seed), L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, nx = -(b[1] - a[1]) / L, ny = (b[0] - a[0]) / L;
    ctx.save();
    const cols = [['#ffef7a', '#ff9a1f'], ['#ffb21f', '#e8501a'], ['#ff6a1a', '#b81e12']];
    for (let i = 0; i < 26; i++) {
      const ph = r(), u = (t * 2.6 + ph) % 1, off = (r() - 0.5) * 2 * u * L * 0.22;
      const px = a[0] + (b[0] - a[0]) * u + nx * off, py = a[1] + (b[1] - a[1]) * u + ny * off;
      const c = cols[Math.min(2, Math.floor(u * 3))];
      puff(ctx, px, py, 14 + u * 52, alpha * Math.min(1, (1 - u) * 2.5), c[0], c[1]);
    }
    ctx.restore();
  }

  // язычок пламени (горит шляпа и т. п.): низ по центру (x, y), высота s; t — время
  function flame(ctx, x, y, s = 80, t = 0, alpha = 1) {
    if (alpha <= 0) return;
    ctx.save(); ctx.globalAlpha = alpha; ctx.lineJoin = 'round';
    const layers = [[1, '#e8501a', '#111'], [0.72, '#ff9a1f', null], [0.45, '#ffef7a', null]];
    for (const [k, col, line] of layers) {
      const h = s * k * (1 + 0.12 * Math.sin(t * 22 + k * 5)), w = s * 0.42 * k, sw = Math.sin(t * 17 + k * 3) * s * 0.08;
      ctx.beginPath();
      ctx.moveTo(x - w, y);
      ctx.quadraticCurveTo(x - w * 1.1, y - h * 0.5, x + sw, y - h);
      ctx.quadraticCurveTo(x + w * 1.1, y - h * 0.5, x + w, y);
      ctx.quadraticCurveTo(x, y + w * 0.4, x - w, y);
      ctx.closePath(); ctx.fillStyle = col; ctx.fill();
      if (line) { ctx.lineWidth = 4; ctx.strokeStyle = line; ctx.stroke(); }
    }
    ctx.restore();
  }

  // большой лист (джунгли), щит: черенок в (x, y), длина s, поворот rot (0 — лист вверх)
  function bigLeaf(ctx, x, y, s = 300, rot = 0) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
    ctx.lineJoin = 'round'; ctx.lineWidth = 6; ctx.strokeStyle = '#111';
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -s * 0.25); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, -s * 0.2);
    ctx.bezierCurveTo(s * 0.42, -s * 0.3, s * 0.32, -s * 0.85, 0, -s);
    ctx.bezierCurveTo(-s * 0.32, -s * 0.85, -s * 0.42, -s * 0.3, 0, -s * 0.2);
    ctx.closePath(); ctx.fillStyle = '#2fae3a'; ctx.fill(); ctx.stroke();
    ctx.lineWidth = 4; ctx.strokeStyle = '#1d6e1f';
    ctx.beginPath(); ctx.moveTo(0, -s * 0.22); ctx.lineTo(0, -s * 0.95); ctx.stroke();
    for (let i = 1; i < 6; i++) {
      const yy = -s * (0.22 + i * 0.12);
      ctx.beginPath(); ctx.moveTo(0, yy); ctx.lineTo(s * 0.3 * Math.sin(i / 6 * Math.PI), yy - s * 0.08); ctx.moveTo(0, yy); ctx.lineTo(-s * 0.3 * Math.sin(i / 6 * Math.PI), yy - s * 0.08); ctx.stroke();
    }
    ctx.restore();
  }

  // пруд в земле (разрез): x0..x1, поверхность воды на y, глубина d; t — время (блики плывут)
  function pond(ctx, x0, x1, y, d, t = 0) {
    const B = 22;
    ctx.save();
    ctx.fillStyle = '#111'; ctx.fillRect(x0 - 5, y - 14, x1 - x0 + 10, d + 19);
    ctx.fillStyle = '#5a3a1a'; ctx.fillRect(x0 - 1, y - 10, x1 - x0 + 2, 10);
    for (let yy = y; yy < y + d; yy += B) {
      const depth = (yy - y) / d;
      for (let xx = x0; xx < x1; xx += B) {
        const h = Math.abs(Math.sin(xx * 12.9898 + yy * 78.233) * 43758.5453) % 1;
        const base = depth < 0.15 ? ['#6cc0ff', '#4aa6f5', '#5ab4ff'] : depth < 0.5 ? ['#3f95f5', '#2f7fe0', '#4a9ff5'] : ['#2a6fd0', '#2160c0', '#2d78da'];
        ctx.fillStyle = base[Math.floor(h * 3)];
        ctx.fillRect(xx, yy, Math.min(B, x1 - xx) + 1, Math.min(B, y + d - yy) + 1);
      }
    }
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    for (let i = 0; i < 6; i++) {
      const px = x0 + ((i * 97 + t * 40) % (x1 - x0 - 50)), py = y + 6 + (i % 3) * B;
      ctx.fillRect(px, py, 26 + (i % 2) * 18, 4);
    }
    ctx.restore();
  }

  // рыба (майнкрафт-лосось): центр (x, y), длина s, поворот rot; t — время (хвост бьёт)
  function fish(ctx, x, y, s = 110, rot = 0, t = 0, col = '#e8603a') {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
    const h = s * 0.42, ta = Math.sin(t * 22) * 0.45;
    ctx.lineJoin = 'round'; ctx.lineWidth = Math.max(3, s * 0.05); ctx.strokeStyle = '#111';
    ctx.save(); ctx.translate(-s * 0.36, 0); ctx.rotate(ta);                // хвост
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-s * 0.32, -h * 0.6); ctx.lineTo(-s * 0.26, 0); ctx.lineTo(-s * 0.32, h * 0.6); ctx.closePath();
    ctx.fillStyle = '#c94a2a'; ctx.fill(); ctx.stroke(); ctx.restore();
    ctx.beginPath(); ctx.ellipse(0, 0, s * 0.42, h / 2, 0, 0, TAU); ctx.fillStyle = col; ctx.fill(); ctx.stroke();
    ctx.save(); ctx.clip();
    ctx.fillStyle = '#ffb08a'; ctx.fillRect(-s * 0.42, h * 0.08, s * 0.84, h * 0.5);
    ctx.fillStyle = '#c94a2a'; for (const k of [-0.15, 0.05]) ctx.fillRect(k * s, -h / 2, s * 0.06, h);
    ctx.restore();
    ctx.beginPath(); ctx.moveTo(-s * 0.05, -h * 0.45); ctx.lineTo(s * 0.08, -h * 0.85); ctx.lineTo(s * 0.18, -h * 0.42); ctx.closePath();
    ctx.fillStyle = '#c94a2a'; ctx.fill(); ctx.stroke();                     // плавник
    ctx.beginPath(); ctx.arc(s * 0.25, -h * 0.08, s * 0.06, 0, TAU); ctx.fillStyle = '#fff'; ctx.fill(); ctx.lineWidth = 2; ctx.stroke();
    ctx.beginPath(); ctx.arc(s * 0.265, -h * 0.08, s * 0.03, 0, TAU); ctx.fillStyle = '#111'; ctx.fill();
    ctx.restore();
  }

  // удочка: хват в (x, y), угол a (от вертикали, по часовой), длина L; возвращает кончик
  function fishingRod(ctx, x, y, a, L = 320) {
    const tx = x + Math.sin(a) * L, ty = y - Math.cos(a) * L;
    ctx.save(); ctx.lineCap = 'round';
    ctx.lineWidth = 15; ctx.strokeStyle = '#111'; ctx.beginPath(); ctx.moveTo(x - Math.sin(a) * 30, y + Math.cos(a) * 30); ctx.lineTo(tx, ty); ctx.stroke();
    ctx.lineWidth = 9; ctx.strokeStyle = '#a8702e'; ctx.stroke();
    ctx.lineWidth = 3; ctx.strokeStyle = '#d9a35e'; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(tx, ty); ctx.stroke();
    const rx = x + Math.sin(a) * L * 0.12 - Math.cos(a) * 16, ry = y - Math.cos(a) * L * 0.12 - Math.sin(a) * 16;   // катушка
    ctx.beginPath(); ctx.arc(rx, ry, 16, 0, TAU); ctx.fillStyle = '#8a8a8a'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = '#111'; ctx.stroke();
    ctx.beginPath(); ctx.arc(rx, ry, 5, 0, TAU); ctx.fillStyle = '#111'; ctx.fill();
    ctx.restore();
    return [tx, ty];
  }

  // леска от кончика до крючка (провис sag); крючок или поплавок на конце
  function fishLine(ctx, tip, end, sag = 30, kind = 'hook') {
    ctx.save();
    ctx.lineWidth = 2.5; ctx.strokeStyle = '#2b2b2b';
    ctx.beginPath(); ctx.moveTo(tip[0], tip[1]); ctx.quadraticCurveTo((tip[0] + end[0]) / 2, (tip[1] + end[1]) / 2 + sag, end[0], end[1]); ctx.stroke();
    if (kind === 'float') {
      ctx.lineWidth = 3; ctx.strokeStyle = '#111';
      ctx.beginPath(); ctx.arc(end[0], end[1], 13, Math.PI, TAU); ctx.fillStyle = '#e8262e'; ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.arc(end[0], end[1], 13, 0, Math.PI); ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.stroke();
    } else if (kind === 'hook') {
      ctx.lineWidth = 5; ctx.strokeStyle = '#111'; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(end[0], end[1]); ctx.lineTo(end[0], end[1] + 18); ctx.arc(end[0] - 9, end[1] + 18, 9, 0, Math.PI * 0.9); ctx.stroke();
      ctx.lineWidth = 2.5; ctx.strokeStyle = '#c8c8c8'; ctx.stroke();
    }
    ctx.restore();
  }

  // перо: центр (x, y), длина s, поворот rot (0 — вдоль x, очин слева); col — цвет кончика
  function feather(ctx, x, y, s = 120, rot = 0, col = '#ffffff', bend = 0) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
    const w = s * 0.17;
    ctx.lineJoin = 'round'; ctx.lineWidth = Math.max(2.5, s * 0.03); ctx.strokeStyle = '#1b1b1b';
    ctx.beginPath();
    ctx.moveTo(-s * 0.32, 0);
    ctx.bezierCurveTo(-s * 0.1, -w * 1.2, s * 0.3, -w * 1.1 + bend * w, s * 0.5, bend * w);
    ctx.bezierCurveTo(s * 0.3, w * 0.9 + bend * w, -s * 0.1, w * 1.0, -s * 0.32, 0);
    ctx.closePath(); ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.stroke();
    ctx.save(); ctx.clip();
    ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(s * 0.42, bend * w, s * 0.16, w * 1.3, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 1.5;
    for (let i = -3; i <= 4; i++) { ctx.beginPath(); ctx.moveTo(i * s * 0.09, 0); ctx.lineTo(i * s * 0.09 + s * 0.06, -w); ctx.moveTo(i * s * 0.09, 0); ctx.lineTo(i * s * 0.09 + s * 0.06, w); ctx.stroke(); }
    ctx.restore();
    ctx.lineWidth = Math.max(2, s * 0.025); ctx.strokeStyle = '#8a8a8a';
    ctx.beginPath(); ctx.moveTo(-s * 0.5, 0); ctx.quadraticCurveTo(0, 0, s * 0.48, bend * w); ctx.stroke();
    ctx.restore();
  }

  // пузырь из носа (спит): (x, y) — у носа, r — радиус
  function sleepBubble(ctx, x, y, r) {
    if (r < 2) return;
    ctx.save();
    ctx.beginPath(); ctx.arc(x + r * 0.7, y + r * 0.2, r, 0, TAU);
    ctx.fillStyle = 'rgba(190,230,255,0.55)'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = '#6aa8d8'; ctx.stroke();
    ctx.beginPath(); ctx.arc(x + r * 0.45, y - r * 0.15, r * 0.22, 0, TAU); ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.fill();
    ctx.restore();
  }

  // шнур скакалки через точки pts (гладко, через середины отрезков); col — цвет
  function jumpCord(ctx, pts, col = '#ff4f9a') {
    if (!pts || pts.length < 2) return;
    ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const path = () => {
      ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i < pts.length - 1; i++) {
        const mx = (pts[i][0] + pts[i + 1][0]) / 2, my = (pts[i][1] + pts[i + 1][1]) / 2;
        ctx.quadraticCurveTo(pts[i][0], pts[i][1], mx, my);
      }
      const l = pts[pts.length - 1]; ctx.lineTo(l[0], l[1]);
    };
    path(); ctx.lineWidth = 12; ctx.strokeStyle = '#111'; ctx.stroke();
    path(); ctx.lineWidth = 6; ctx.strokeStyle = col; ctx.stroke();
    ctx.restore();
  }
  // ручка скакалки: (x, y) — где шнур входит, ang — куда смотрит ручка (от шнура)
  function ropeHandle(ctx, x, y, ang = Math.PI / 2, s = 60) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(ang - Math.PI / 2);
    ctx.lineJoin = 'round'; ctx.lineWidth = 5; ctx.strokeStyle = '#111';
    ctx.beginPath(); ctx.moveTo(-s * 0.16, 0); ctx.lineTo(-s * 0.2, s); ctx.quadraticCurveTo(0, s * 1.12, s * 0.2, s); ctx.lineTo(s * 0.16, 0); ctx.closePath();
    ctx.fillStyle = '#ffd21f'; ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#e8a300'; ctx.fillRect(-s * 0.17, s * 0.35, s * 0.34, s * 0.12); ctx.fillRect(-s * 0.18, s * 0.65, s * 0.36, s * 0.12);
    ctx.restore();
  }

  // зефирка (цилиндр): центр (x, y), высота s, поворот rot; col — цвет
  function marshmallow(ctx, x, y, s = 60, rot = 0, col = '#ffd6ea') {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
    const w = s * 0.9, h = s, ry = s * 0.2;
    ctx.lineJoin = 'round'; ctx.lineWidth = Math.max(3, s * 0.06); ctx.strokeStyle = '#6b3a52';
    ctx.beginPath(); ctx.moveTo(-w / 2, -h / 2); ctx.lineTo(-w / 2, h / 2); ctx.ellipse(0, h / 2, w / 2, ry, 0, Math.PI, 0, true); ctx.lineTo(w / 2, -h / 2); ctx.closePath();
    ctx.fillStyle = col; ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(0, -h / 2, w / 2, ry, 0, 0, TAU); ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.fillRect(-w * 0.32, -h * 0.3, w * 0.12, h * 0.6);
    ctx.restore();
  }
  // бумажный пакет с зефиром: низ по центру (x, y), ширина s
  function mallowBag(ctx, x, y, s = 160, n = 4) {
    ctx.save();
    const h = s * 1.15;
    for (let i = 0; i < n; i++) marshmallow(ctx, x + (i - (n - 1) / 2) * s * 0.24, y - h - s * 0.05 + (i % 2) * 10, s * 0.32, (i - 1.5) * 0.25, i % 2 ? '#ffffff' : '#ffd6ea');
    ctx.lineJoin = 'round'; ctx.lineWidth = 5; ctx.strokeStyle = '#111';
    ctx.beginPath(); ctx.moveTo(x - s / 2, y); ctx.lineTo(x - s * 0.46, y - h); ctx.lineTo(x - s * 0.3, y - h + 14); ctx.lineTo(x - s * 0.1, y - h); ctx.lineTo(x + s * 0.1, y - h + 14); ctx.lineTo(x + s * 0.3, y - h); ctx.lineTo(x + s * 0.46, y - h + 14); ctx.lineTo(x + s / 2, y); ctx.closePath();
    ctx.fillStyle = '#d9a35e'; ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#ff6fb0'; ctx.beginPath(); ctx.arc(x, y - h * 0.45, s * 0.16, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.restore();
  }
  // рогатка: (x, y) — середина рукояти (хват), s — высота, rot; возвращает концы рогов
  function slingshotY(ctx, x, y, s = 200, rot = 0) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const tips = [[-s * 0.32, -s * 0.72], [s * 0.32, -s * 0.72]];
    for (const [w, c] of [[s * 0.15, '#111'], [s * 0.1, '#8a5a2b']]) {
      ctx.lineWidth = w; ctx.strokeStyle = c;
      ctx.beginPath(); ctx.moveTo(0, s * 0.28); ctx.lineTo(0, -s * 0.18); ctx.lineTo(tips[0][0], tips[0][1]); ctx.moveTo(0, -s * 0.18); ctx.lineTo(tips[1][0], tips[1][1]); ctx.stroke();
    }
    ctx.restore();
    const c = Math.cos(rot), sn = Math.sin(rot);
    return tips.map(([a, b]) => [x + a * c - b * sn, y + a * sn + b * c]);
  }
  // резинка рогатки: от концов к кармашку p
  function slingBand(ctx, tips, p, w = 6) {
    ctx.save(); ctx.lineCap = 'round';
    for (const [lw, c] of [[w + 5, '#111'], [w, '#e8262e']]) {
      ctx.lineWidth = lw; ctx.strokeStyle = c;
      ctx.beginPath(); ctx.moveTo(tips[0][0], tips[0][1]); ctx.lineTo(p[0], p[1]); ctx.lineTo(tips[1][0], tips[1][1]); ctx.stroke();
    }
    ctx.fillStyle = '#6b3a12'; ctx.beginPath(); ctx.ellipse(p[0], p[1], 16, 10, 0, 0, TAU); ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = '#111'; ctx.stroke();
    ctx.restore();
  }

  // горшок мёда: низ по центру (x, y), ширина s, поворот rot (π — вверх дном); full — мёд через край
  function honeyPot(ctx, x, y, s = 130, rot = 0, full = true) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
    const h = s * 0.95;
    ctx.lineJoin = 'round'; ctx.lineWidth = 5; ctx.strokeStyle = '#111';
    ctx.beginPath(); ctx.moveTo(-s * 0.3, 0); ctx.bezierCurveTo(-s * 0.62, -h * 0.2, -s * 0.6, -h * 0.75, -s * 0.34, -h * 0.85);
    ctx.lineTo(s * 0.34, -h * 0.85); ctx.bezierCurveTo(s * 0.6, -h * 0.75, s * 0.62, -h * 0.2, s * 0.3, 0); ctx.closePath();
    ctx.fillStyle = '#c8763a'; ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#a85a24'; ctx.fillRect(-s * 0.48, -h * 0.55, s * 0.96, h * 0.1);
    ctx.beginPath(); ctx.ellipse(0, -h * 0.85, s * 0.38, s * 0.1, 0, 0, TAU); ctx.fillStyle = full ? '#ffb21f' : '#5a3412'; ctx.fill(); ctx.stroke();
    if (full) {
      ctx.fillStyle = '#ffb21f';
      for (const [dx, l] of [[-0.25, 0.3], [0.05, 0.45], [0.28, 0.22]]) { ctx.beginPath(); ctx.ellipse(dx * s, -h * 0.85 + l * h * 0.5, s * 0.06, l * h * 0.5, 0, 0, TAU); ctx.fill(); ctx.lineWidth = 3; ctx.stroke(); }
    }
    ctx.restore();
  }
  // мёд на голове и потёки: (x, y) — макушка, w — ширина, drip 0..1
  function honeyCap(ctx, x, y, w = 160, drip = 0.5, alpha = 1) {
    if (alpha <= 0) return;
    ctx.save(); ctx.globalAlpha = alpha; ctx.lineJoin = 'round'; ctx.lineWidth = 4; ctx.strokeStyle = '#8a4a00';
    ctx.fillStyle = 'rgba(255,176,24,0.92)';
    for (const [dx, len] of [[-0.42, 0.7], [-0.15, 1.0], [0.12, 0.55], [0.38, 0.85]]) {
      const L = len * drip * w * 0.9, r = w * 0.06;
      ctx.beginPath(); ctx.moveTo(x + dx * w - r, y); ctx.lineTo(x + dx * w - r, y + L); ctx.arc(x + dx * w, y + L, r, Math.PI, 0, true); ctx.lineTo(x + dx * w + r, y); ctx.fill(); ctx.stroke();
    }
    ctx.beginPath(); ctx.ellipse(x, y, w * 0.52, w * 0.2, 0, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.beginPath(); ctx.ellipse(x - w * 0.2, y - w * 0.05, w * 0.1, w * 0.04, -0.3, 0, TAU); ctx.fill();
    ctx.restore();
  }
  // яйцо: центр (x, y), высота s, поворот rot; crack 0..1 — трещина
  function egg(ctx, x, y, s = 160, rot = 0, crack = 0) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
    const w = s * 0.78;
    ctx.beginPath(); ctx.moveTo(0, -s / 2); ctx.bezierCurveTo(w * 0.62, -s / 2, w * 0.66, s / 2, 0, s / 2); ctx.bezierCurveTo(-w * 0.66, s / 2, -w * 0.62, -s / 2, 0, -s / 2);
    ctx.fillStyle = '#fff6e0'; ctx.fill(); ctx.lineWidth = Math.max(4, s * 0.035); ctx.strokeStyle = '#111'; ctx.stroke();
    ctx.fillStyle = '#e8d4a8'; for (const [dx, dy] of [[-0.2, -0.1], [0.15, 0.15], [0.05, -0.28], [-0.12, 0.25]]) { ctx.beginPath(); ctx.arc(dx * s, dy * s, s * 0.03, 0, TAU); ctx.fill(); }
    ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.beginPath(); ctx.ellipse(-w * 0.2, -s * 0.18, w * 0.08, s * 0.12, 0.3, 0, TAU); ctx.fill();
    if (crack > 0) {
      ctx.lineWidth = 4; ctx.strokeStyle = '#111'; ctx.beginPath(); ctx.moveTo(-w * 0.5 * crack, -s * 0.05);
      for (let i = 0; i <= 6 * crack; i++) ctx.lineTo(-w * 0.5 * crack + i * w * 0.17, -s * 0.05 + (i % 2 ? -s * 0.07 : s * 0.05));
      ctx.stroke();
    }
    ctx.restore();
  }
  // цыплёнок (майнкрафт-стиль, круглый): низ по центру (x, y), высота s, dir — куда смотрит, t — время
  function chick(ctx, x, y, s = 90, dir = 1, t = 0, peck = 0) {
    ctx.save(); ctx.translate(x, y); ctx.scale(dir, 1); ctx.rotate(peck * 0.5);
    ctx.lineJoin = 'round'; ctx.lineWidth = 4; ctx.strokeStyle = '#111';
    for (const k of [-1, 1]) { ctx.beginPath(); ctx.moveTo(k * s * 0.12, -s * 0.1); ctx.lineTo(k * s * 0.12, 0); ctx.lineTo(k * s * 0.12 + s * 0.12, 0); ctx.strokeStyle = '#e8a300'; ctx.lineWidth = 5; ctx.stroke(); }
    ctx.lineWidth = 4; ctx.strokeStyle = '#111';
    ctx.beginPath(); ctx.ellipse(0, -s * 0.48, s * 0.42, s * 0.4, 0, 0, TAU); ctx.fillStyle = '#ffe14d'; ctx.fill(); ctx.stroke();
    const fl = Math.sin(t * 30) * 0.4;
    ctx.beginPath(); ctx.ellipse(-s * 0.12, -s * 0.45, s * 0.2, s * 0.12, -0.4 + fl, 0, TAU); ctx.fillStyle = '#ffd21f'; ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(s * 0.36, -s * 0.6); ctx.lineTo(s * 0.58, -s * 0.54); ctx.lineTo(s * 0.36, -s * 0.46); ctx.closePath(); ctx.fillStyle = '#ff8a00'; ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.arc(s * 0.2, -s * 0.66, s * 0.06, 0, TAU); ctx.fillStyle = '#111'; ctx.fill();
    ctx.beginPath(); ctx.arc(s * 0.22, -s * 0.68, s * 0.02, 0, TAU); ctx.fillStyle = '#fff'; ctx.fill();
    ctx.restore();
  }

  // магнит-подкова: (x, y) — середина дуги (хват), ось — по углу aim (полюса смотрят туда), s — длина
  // возвращает точку между полюсами
  function horseshoeMagnet(ctx, x, y, s = 120, aim = 0) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(aim);
    const r = s * 0.32, L = s * 0.62, w = s * 0.2;
    const path = () => { ctx.beginPath(); ctx.moveTo(L, -r); ctx.lineTo(0, -r); ctx.arc(0, 0, r, -Math.PI / 2, Math.PI / 2, true); ctx.lineTo(L, r); };
    ctx.lineCap = 'butt'; ctx.lineJoin = 'round';
    path(); ctx.lineWidth = w + 10; ctx.strokeStyle = '#111'; ctx.stroke();
    path(); ctx.lineWidth = w; ctx.strokeStyle = '#e8262e'; ctx.stroke();
    ctx.lineWidth = w * 0.25; ctx.strokeStyle = 'rgba(255,255,255,0.45)';
    ctx.beginPath(); ctx.arc(0, 0, r - w * 0.2, -Math.PI / 2, -Math.PI * 0.9, true); ctx.stroke();
    for (const k of [-1, 1]) {                                   // полюса
      ctx.fillStyle = '#111'; ctx.fillRect(L - 2, k * r - w / 2 - 5, s * 0.2 + 7, w + 10);
      ctx.fillStyle = '#d8dde4'; ctx.fillRect(L, k * r - w / 2, s * 0.2, w);
    }
    ctx.restore();
    return [x + Math.cos(aim) * (L + s * 0.2), y + Math.sin(aim) * (L + s * 0.2)];
  }
  // магнитные волны от полюсов вдоль aim; t — время, alpha
  function magnetWaves(ctx, p, aim, t, alpha = 1) {
    ctx.save(); ctx.lineCap = 'round';
    for (let i = 0; i < 4; i++) {
      const u = ((t * 2.2) + i / 4) % 1, d = 20 + u * 220, a = (1 - u) * alpha;
      ctx.globalAlpha = a; ctx.lineWidth = 7; ctx.strokeStyle = '#111';
      ctx.beginPath(); ctx.arc(p[0] - Math.cos(aim) * 30, p[1] - Math.sin(aim) * 30, d, aim - 0.45, aim + 0.45); ctx.stroke();
      ctx.lineWidth = 4; ctx.strokeStyle = i % 2 ? '#7ad1ff' : '#ffe14d'; ctx.stroke();
    }
    ctx.restore();
  }
  // наковальня (майнкрафт): низ по центру (x, y), ширина s, поворот rot вокруг центра
  function anvil(ctx, x, y, s = 170, rot = 0, sq = 1) {
    const h = s * 0.62;
    ctx.save(); ctx.translate(x, y); ctx.scale(1 / sq, sq); ctx.translate(0, -h / 2); ctx.rotate(rot); ctx.translate(0, h / 2);
    const part = (px, py, w, hh, c) => { ctx.fillStyle = '#111'; ctx.fillRect(px - 4, py - 4, w + 8, hh + 8); ctx.fillStyle = c; ctx.fillRect(px, py, w, hh); };
    part(-s * 0.36, -h * 0.22, s * 0.72, h * 0.22, '#4a4f56');          // основание
    part(-s * 0.16, -h * 0.62, s * 0.32, h * 0.42, '#3d4248');          // шейка
    part(-s * 0.5, -h, s, h * 0.38, '#5a6068');                          // верх
    ctx.fillStyle = '#7d848d'; ctx.fillRect(-s * 0.5, -h, s, h * 0.08); ctx.fillRect(-s * 0.36, -h * 0.22, s * 0.72, h * 0.05);
    ctx.fillStyle = '#353a40'; ctx.fillRect(s * 0.1, -h * 0.85, s * 0.3, h * 0.1);
    ctx.restore();
  }

  // пружина: низ по центру (x, y), длина L вверх (по углу rot от вертикали), ширина w; плашки сверху и снизу
  function coilSpring(ctx, x, y, L = 100, w = 80, rot = 0) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
    const n = 6, h = Math.max(10, L - 16);
    const pts = [];
    for (let i = 0; i <= n * 2; i++) pts.push([(i % 2 ? 1 : -1) * w * 0.42, -8 - h * i / (n * 2)]);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    for (const [lw, c] of [[13, '#111'], [7, '#aab3be'], [2.5, '#eef2f6']]) {
      ctx.lineWidth = lw; ctx.strokeStyle = c; ctx.beginPath(); pts.forEach(([px, py], i) => (i ? ctx.lineTo(px, py) : ctx.moveTo(px, py))); ctx.stroke();
    }
    for (const yy of [0, -L]) {
      ctx.fillStyle = '#111'; ctx.fillRect(-w / 2 - 4, yy - 12, w + 8, 16);
      ctx.fillStyle = '#e8262e'; ctx.fillRect(-w / 2, yy - 8, w, 8);
    }
    ctx.restore();
  }

  // ракета фейерверка: (x, y) — хвост (низ палочки), s — длина корпуса, rot (0 — носом вверх), col
  function rocket(ctx, x, y, s = 90, rot = 0, col = '#e8262e') {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
    const w = s * 0.3;
    ctx.lineWidth = 4; ctx.strokeStyle = '#111'; ctx.lineJoin = 'round';
    ctx.fillStyle = '#c8a060'; ctx.fillRect(-3, -s * 0.2, 6, s * 0.9);  ctx.strokeRect(-3, -s * 0.2, 6, s * 0.9);   // палочка
    ctx.beginPath(); ctx.rect(-w / 2, -s, w, s * 0.8); ctx.fillStyle = col; ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#ffffff'; ctx.fillRect(-w / 2 + 2, -s * 0.7, w - 4, s * 0.1);
    ctx.beginPath(); ctx.moveTo(-w / 2 - 3, -s); ctx.lineTo(0, -s * 1.3); ctx.lineTo(w / 2 + 3, -s); ctx.closePath(); ctx.fillStyle = '#ffd21f'; ctx.fill(); ctx.stroke();
    ctx.restore();
  }
  // хвост искр за летящей ракетой: от (x, y) по направлению rot+π; t — время
  function rocketTrail(ctx, x, y, rot, t, len = 120) {
    const r = rng(Math.floor(t * 24));
    const dx = -Math.sin(rot), dy = Math.cos(rot);
    ctx.save();
    for (let i = 0; i < 14; i++) {
      const u = r(), px = x + dx * len * u + (r() - 0.5) * 22 * u, py = y + dy * len * u + (r() - 0.5) * 22 * u;
      ctx.fillStyle = u < 0.3 ? '#ffffff' : u < 0.6 ? '#ffe14d' : '#ff8a00';
      ctx.globalAlpha = 1 - u; ctx.beginPath(); ctx.arc(px, py, 6 + 8 * (1 - u), 0, TAU); ctx.fill();
    }
    ctx.restore();
  }
  // салют: вспышка-звезда из N лучей с искрами; life 0..1; cols — палитра
  function fireworkBurst(ctx, x, y, life, size = 260, cols = ['#ff3a6a', '#ffe14d', '#3ad1ff'], seed = 1) {
    if (life < 0 || life > 1) return;
    const r = rng(seed), n = 22;
    ctx.save(); ctx.lineCap = 'round';
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU + r() * 0.1, d = size * E.EASE.out(life) * (0.75 + r() * 0.3), dropY = 120 * life * life;
      const px = x + Math.cos(a) * d, py = y + Math.sin(a) * d + dropY, c = cols[i % cols.length];
      ctx.globalAlpha = 1 - life * 0.8;
      ctx.strokeStyle = c; ctx.lineWidth = 6 * (1 - life) + 2;
      ctx.beginPath(); ctx.moveTo(x + Math.cos(a) * d * 0.6, y + Math.sin(a) * d * 0.6 + dropY * 0.6); ctx.lineTo(px, py); ctx.stroke();
      ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(px, py, 5 * (1 - life) + 2, 0, TAU); ctx.fill();
    }
    if (life < 0.25) { ctx.globalAlpha = 1 - life * 4; ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(x, y, size * 0.35 * (1 - life * 2), 0, TAU); ctx.fill(); }
    ctx.restore();
  }

  // каток: лёд на траве от x0 до x1, верх на y; crack 0..1 — трещины; t — время (блики)
  function iceRink(ctx, x0, x1, y, crack = 0, t = 0) {
    ctx.save();
    ctx.fillStyle = '#111'; ctx.fillRect(x0 - 5, y - 5, x1 - x0 + 10, 42);
    ctx.fillStyle = '#8fd8ff'; ctx.fillRect(x0, y, x1 - x0, 32);
    ctx.fillStyle = '#e8f8ff'; ctx.fillRect(x0, y, x1 - x0, 9);
    ctx.fillStyle = '#8fd0ff'; for (let x = x0 + 30; x < x1 - 40; x += 90) ctx.fillRect(x, y + 12, 50, 4);
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    for (let i = 0; i < 3; i++) { const px = x0 + ((i * 337 + t * 60) % (x1 - x0 - 80)); ctx.fillRect(px, y + 2, 60, 3); }
    if (crack > 0) {
      const r = rng(5); ctx.strokeStyle = '#2a6fa8'; ctx.lineWidth = 4;
      for (let i = 0; i < 6; i++) {
        let px = x0 + (i + 0.5) * (x1 - x0) / 6, py = y + 10;
        ctx.beginPath(); ctx.moveTo(px, py);
        for (let k = 0; k < 4 * crack; k++) { px += (r() - 0.5) * 90; py = y + 4 + r() * 16; ctx.lineTo(px, py); }
        ctx.stroke();
      }
    }
    ctx.restore();
  }
  // ледяная крошка из-под скольжения: life 0..1
  function iceSpray(ctx, x, y, life, dir = 1, seed = 1) {
    if (life < 0 || life > 1) return;
    const r = rng(seed);
    ctx.save();
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 - dir * (0.4 + r() * 0.9), v = 80 + r() * 140;
      const px = x + Math.cos(a) * v * life, py = y + Math.sin(a) * v * life + 200 * life * life;
      ctx.globalAlpha = 1 - life; ctx.fillStyle = r() < 0.5 ? '#ffffff' : '#cdeeff';
      ctx.fillRect(px - 5, py - 5, 10, 10);
    }
    ctx.restore();
  }

  // блок разлетается кусочками: life 0..1, кусочки-квадраты по дугам с вращением
  function blockBurst(ctx, x, y, life, seed = 1, cols = ['#f39314', '#d6740a', '#ffab3a'], n = 14, size = 46, spread = 1, floor = Infinity) {
    if (life < 0 || life > 1) return;
    const r = rng(seed);
    for (let i = 0; i < n; i++) {
      const a = -Math.PI * (0.1 + 0.8 * r()), v = (260 + 320 * r()) * spread, sz = size * (0.5 + 0.6 * r()), spin = (r() - 0.5) * 14;
      const px = x + Math.cos(a) * v * life * (r() < 0.5 ? -1 : 1), py = Math.min(floor - sz / 2, y + Math.sin(a) * v * life + 900 * life * life);
      ctx.save(); ctx.translate(px, py); ctx.rotate(spin * life); ctx.globalAlpha = life > 0.75 ? (1 - life) * 4 : 1;
      ctx.fillStyle = '#111'; ctx.fillRect(-sz / 2 - 3, -sz / 2 - 3, sz + 6, sz + 6);
      ctx.fillStyle = cols[i % cols.length]; ctx.fillRect(-sz / 2, -sz / 2, sz, sz);
      ctx.restore();
    }
  }

  // пиксельное облачко без обводки (белое, снизу светло-голубая полоса)
  function cloud(ctx, x, y, s, kind, tint) {
    const u = 16 * s;
    const shapes = [
      [[2, 0, 4], [0, 1, 9]],
      [[1, 0, 3], [0, 1, 6]],
      [[0, 0, 2]],
    ];
    const rows = shapes[kind % shapes.length];
    ctx.fillStyle = tint ? tint[0] : '#ffffff';
    for (const [a, r, b] of rows) ctx.fillRect(x + a * u, y + r * u, b * u, u + 1);
    const last = rows[rows.length - 1];
    ctx.fillStyle = tint ? tint[1] : '#cfe1f6';
    ctx.fillRect(x + last[0] * u, y + (last[1] + 1) * u - u * 0.28, last[2] * u, u * 0.28);
  }

  function shadow(ctx, x, y, w, alpha) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#145c0c';
    ctx.beginPath(); ctx.ellipse(x, y, w, w * 0.13, 0, 0, TAU); ctx.fill();
    ctx.restore();
  }

  function star(ctx, x, y, n, r1, r2, rot = 0) {
    ctx.beginPath();
    for (let i = 0; i < 2 * n; i++) {
      const r = i % 2 ? r2 : r1, a = rot + (i * Math.PI) / n - Math.PI / 2;
      ctx.lineTo(x + r * Math.cos(a), y + r * Math.sin(a));
    }
    ctx.closePath();
  }

  // искра удара: жёлтая звезда с белой серединой; life 0..1 (~8 кадров)
  function spark(ctx, x, y, r, life, rot = 0) {
    if (life < 0 || life > 1) return;
    const s = life < 0.25 ? ease(life / 0.25) * 1.1 : 1.1 - (life - 0.25) * 0.4;
    ctx.save();
    ctx.globalAlpha = life < 0.6 ? 1 : 1 - (life - 0.6) / 0.4;
    ctx.lineJoin = 'round';
    star(ctx, x, y, 10, r * s, r * s * 0.5, rot);
    ctx.fillStyle = '#ffd41f'; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = '#1a1a1a'; ctx.stroke();
    star(ctx, x, y, 10, r * s * 0.55, r * s * 0.3, rot + 0.16);
    ctx.fillStyle = '#ffffff'; ctx.fill();
    ctx.restore();
  }

  // клуб: светлый полупрозрачный круг с тонкой серой обводкой
  function puff(ctx, x, y, r, alpha, fill = '#e6e6e0', line = '#7c7c74') {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.beginPath(); ctx.arc(x, y, r, 0, TAU);
    ctx.fillStyle = fill; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = line; ctx.stroke();
    ctx.restore();
  }

  // пыль при приземлении / торможении: клубы в стороны по земле (~18 кадров)
  function dust(ctx, x, y, r, life, n = 6, seed = 1) {
    if (life < 0 || life > 1) return;
    const rr = rng(seed);
    for (let i = 0; i < n; i++) {
      const side = i % 2 ? 1 : -1, k = Math.floor(i / 2) + 1;
      const sp = 0.7 + rr() * 0.5;
      const px = x + side * (r * 0.4 + r * 0.9 * k * ease(life) * sp);
      const py = y - r * 0.25 - rr() * r * 0.25 * ease(life);
      puff(ctx, px, py, r * (0.35 + 0.35 * ease(life)) * (0.8 + rr() * 0.4), 0.8 * (1 - life), '#d9dccf', '#8d917f');
    }
  }

  // дым превращения: плотное облако из множества серых клубов, потом тает
  function smoke(ctx, x, y, size, life, seed = 3) {
    if (life < 0 || life > 1) return;
    const rr = rng(seed);
    const grow = ease(life / 0.15);
    // как в образце: крупные клубы плотной шапкой, первые ~5 кадров непрозрачно, потом быстро светлеет
    const alpha = life < 0.2 ? 0.97 : 0.97 * Math.pow(1 - (life - 0.2) / 0.8, 1.4);
    const spread = 0.9 + 0.25 * life;
    const P = [[0, 0, 0.26]];
    for (let k = 0; k < 6; k++) P.push([0.2, 0.24, 0.2, (k * 60 + 30) * Math.PI / 180]);
    for (let k = 0; k < 10; k++) P.push([0.34, 0.4, 0.17, (k * 36) * Math.PI / 180]);
    for (const dx of [-0.22, 0, 0.22]) P.push([dx, 0.42, 0.16, 'xy']);           // низ шапки у самой земли
    for (const [rx, ry, r, a = 0] of P.reverse()) {
      if (a === 'xy') {
        puff(ctx, x + rx * size * spread, y + ry * size * spread - life * 24, size * r * (0.5 + 0.5 * grow), alpha, '#d7d7d4', '#8e8e88');
        continue;
      }
      const j = 0.85 + rr() * 0.3, aj = a + (rr() - 0.5) * 0.3;
      const px = x + Math.cos(aj) * rx * size * j * spread, py = y + Math.sin(aj) * ry * size * j * spread - life * 24;
      puff(ctx, px, py, size * (r + rr() * 0.04) * (0.5 + 0.5 * grow), alpha, '#d7d7d4', '#8e8e88');
    }
  }

  // белая вспышка: круг и лёгкая засветка всего кадра
  function flash(ctx, w, h, x, y, life, strength = 0.35) {
    if (life < 0 || life > 1) return;
    ctx.save();
    ctx.globalAlpha = strength * (1 - life);
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, w, h);
    ctx.globalAlpha = 0.9 * (1 - life);
    ctx.beginPath(); ctx.arc(x, y, 160 + 140 * life, 0, TAU); ctx.fill();
    ctx.restore();
  }

  // золотые лучи за спиной перед превращением
  function rays(ctx, x, y, len, life, rot) {
    if (life <= 0) return;
    const n = 16, L = len * ease(Math.min(1, life * 1.6));
    ctx.save();
    ctx.globalAlpha = 0.55 * Math.min(1, life * 3);
    ctx.fillStyle = '#ffe682';
    for (let i = 0; i < n; i++) {
      const a = rot + (i * TAU) / n, w = 0.07;
      const l = L * (i % 2 ? 0.75 : 1);
      ctx.beginPath();
      ctx.moveTo(x + Math.cos(a - w) * 40, y + Math.sin(a - w) * 40);
      ctx.lineTo(x + Math.cos(a - w) * l, y + Math.sin(a - w) * l);
      ctx.lineTo(x + Math.cos(a + w) * l, y + Math.sin(a + w) * l);
      ctx.lineTo(x + Math.cos(a + w) * 40, y + Math.sin(a + w) * 40);
      ctx.closePath(); ctx.fill();
    }
    ctx.restore();
  }

  // жилка злости: красный знак из четырёх уголков, пульсирует
  function vein(ctx, x, y, s, t) {
    const k = s * (1 + 0.12 * Math.sin(t * 18));
    ctx.save();
    ctx.translate(x, y); ctx.scale(k, k);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    for (const [sx, sy] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) {
      ctx.beginPath();
      ctx.moveTo(sx * 4, sy * 16); ctx.quadraticCurveTo(sx * 5, sy * 5, sx * 16, sy * 4);
      ctx.lineWidth = 12; ctx.strokeStyle = '#1a1a1a'; ctx.stroke();
      ctx.lineWidth = 7; ctx.strokeStyle = '#e8202f'; ctx.stroke();
    }
    ctx.restore();
  }

  // пар от злости: белые клубы поднимаются над головой
  function steam(ctx, x, y, t, s = 1) {
    for (let i = 0; i < 4; i++) {
      const u = ((t * 1.4 + i * 0.25) % 1);
      const side = i % 2 ? 1 : -1;
      puff(ctx, x + side * (30 + u * 40) * s, y - u * 90 * s, (10 + u * 22) * s, 0.75 * (1 - u), '#f4f4f4', '#9a9a9a');
    }
  }

  // капля пота: голубая, с бликом
  function sweat(ctx, x, y, s, alpha = 1) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(x, y); ctx.scale(s, s);
    ctx.beginPath();
    ctx.moveTo(0, -22); ctx.bezierCurveTo(10, -6, 14, 2, 14, 8); ctx.arc(0, 8, 14, 0, Math.PI); ctx.bezierCurveTo(-14, 2, -10, -6, 0, -22);
    ctx.fillStyle = '#7fd0f7'; ctx.fill(); ctx.lineWidth = 3.5; ctx.strokeStyle = '#1d5e86'; ctx.stroke();
    ctx.beginPath(); ctx.ellipse(-5, 6, 3, 6, 0.3, 0, TAU); ctx.fillStyle = '#fff'; ctx.fill();
    ctx.restore();
  }

  // слёзы ручьём: из глаза (x, y) капли летят по дуге в сторону side, t — секунды от начала
  function tears(ctx, x, y, side, t, s = 1, alpha = 1) {
    const EVERY = 0.11, LIFE = 0.55;
    for (let i = Math.max(0, Math.floor((t - LIFE) / EVERY)); i * EVERY <= t; i++) {
      const u = (t - i * EVERY) / LIFE;
      if (u < 0 || u > 1) continue;
      const v = 0.8 + 0.4 * (((i * 7919) % 13) / 13);
      const px = x + side * 150 * s * u * v, py = y - 40 * s * u + 260 * s * u * u;
      const ang = Math.atan2(260 * 2 * u - 40, side * 150 * v);
      ctx.save();
      ctx.globalAlpha = alpha * Math.min(1, (1 - u) * 4);
      ctx.translate(px, py); ctx.rotate(ang - Math.PI / 2); ctx.scale(s * 0.75, s * 0.75);
      ctx.beginPath();
      ctx.moveTo(0, -22); ctx.bezierCurveTo(10, -6, 14, 2, 14, 8); ctx.arc(0, 8, 14, 0, Math.PI); ctx.bezierCurveTo(-14, 2, -10, -6, 0, -22);
      ctx.fillStyle = '#7fd0f7'; ctx.fill(); ctx.lineWidth = 3.5; ctx.strokeStyle = '#1d5e86'; ctx.stroke();
      ctx.restore();
    }
  }

  // звёздочки над головой оглушённого
  function stars(ctx, x, y, t, r = 60) {
    for (let i = 0; i < 3; i++) {
      const a = t * 6 + (i * TAU) / 3;
      const px = x + Math.cos(a) * r, py = y + Math.sin(a) * r * 0.3;
      star(ctx, px, py, 5, 16, 7, a);
      ctx.fillStyle = '#ffd92e'; ctx.fill(); ctx.lineWidth = 3.5; ctx.strokeStyle = '#3b2a00'; ctx.lineJoin = 'round'; ctx.stroke();
    }
  }

  // блеск: четырёхлучевая звёздочка (улетел за кадр, победа)
  function twinkle(ctx, x, y, life, size = 46) {
    if (life < 0 || life > 1) return;
    const s = Math.sin(Math.PI * life) * size;
    ctx.save();
    star(ctx, x, y, 4, s, s * 0.22, life * 2);
    ctx.fillStyle = '#fffbe0'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = '#e0a800'; ctx.stroke();
    ctx.restore();
  }

  // сердечко: красное, с чёрной обводкой и бликом; s — ширина
  function heart(ctx, x, y, s, alpha = 1, rot = 0) {
    if (alpha <= 0 || s <= 0) return;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(x, y); ctx.rotate(rot);
    ctx.beginPath();
    ctx.moveTo(0, 0.5 * s);
    ctx.bezierCurveTo(-0.55 * s, 0.1 * s, -0.62 * s, -0.45 * s, -0.27 * s, -0.47 * s);
    ctx.bezierCurveTo(-0.1 * s, -0.48 * s, 0, -0.35 * s, 0, -0.24 * s);
    ctx.bezierCurveTo(0, -0.35 * s, 0.1 * s, -0.48 * s, 0.27 * s, -0.47 * s);
    ctx.bezierCurveTo(0.62 * s, -0.45 * s, 0.55 * s, 0.1 * s, 0, 0.5 * s);
    ctx.closePath();
    ctx.fillStyle = '#ff2d55'; ctx.fill();
    ctx.lineWidth = Math.max(2, s * 0.07); ctx.strokeStyle = '#111'; ctx.stroke();
    ctx.beginPath(); ctx.ellipse(-0.28 * s, -0.22 * s, 0.09 * s, 0.05 * s, -0.7, 0, TAU);
    ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.fill();
    ctx.restore();
  }

  // маленькие сердечки летят вверх над головой (влюбился); t — секунды
  function hearts(ctx, x, y, t, life = 1) {
    for (let i = 0; i < 5; i++) {
      const u = ((t * 0.7 + i / 5) % 1);
      const hx = x + Math.sin(u * 7 + i * 2.1) * 28 + (i - 2) * 26;
      const hy = y - u * 170;
      heart(ctx, hx, hy, 30 + 10 * Math.sin(i), Math.min(1, (1 - u) * 2.5) * life, Math.sin(u * 6 + i) * 0.3);
    }
  }

  // ветер по земле: клубы пыли и травинки летят от x0 к x1 (порыв от крыльев)
  function wind(ctx, x0, x1, ground, life, seed = 5) {
    if (life < 0 || life > 1) return;
    const r = rng(seed);
    for (let i = 0; i < 34; i++) {
      const d0 = r() * 0.6, sp = 0.3 + r() * 0.2, h = 15 + r() * 260, kind = r(), sz = r();
      const u = (life - d0) / sp;
      if (u < 0 || u > 1) continue;
      const x = x0 + (x1 - x0) * u, y = ground - h - Math.sin(u * 9 + i) * 16;
      const a = Math.min(1, Math.sin(Math.PI * u) * 1.6);
      if (kind < 0.6) puff(ctx, x, y, 16 + sz * 22, 0.85 * a, '#f1e6cc', '#a8936a');
      else {                                        // травинка кувыркается
        ctx.save(); ctx.globalAlpha = a; ctx.translate(x, y); ctx.rotate(u * 14 + i);
        ctx.beginPath(); ctx.ellipse(0, 0, 14 + sz * 8, 5, 0, 0, TAU);
        ctx.fillStyle = kind < 0.8 ? '#25c516' : '#1c9a10'; ctx.fill();
        ctx.lineWidth = 2; ctx.strokeStyle = '#0d4f07'; ctx.stroke(); ctx.restore();
      }
    }
  }

  // засасывание: травинки, листья и пыль летят по сходящимся дугам в точку (mx, my); t — секунды
  function suck(ctx, mx, my, x0, ground, t, alpha = 1, seed = 9) {
    const r = rng(seed);
    for (let i = 0; i < 30; i++) {
      const sp = 0.55 + r() * 0.5, ph = r(), h = 10 + r() * 330, kind = r(), sz = r();
      const u = (t * sp + ph) % 1;                                   // 0 — у края, 1 — во рту
      const e = u * u;
      const sx = x0 + r() * 160, sy = ground - h;
      const x = sx + (mx - sx) * e, y = sy + (my - sy) * e + Math.sin(u * 7 + i) * 10 * (1 - u);
      const a = alpha * Math.min(1, u * 5) * Math.min(1, (1 - u) * 6);
      if (a <= 0) continue;
      if (kind < 0.45) puff(ctx, x, y, (12 + sz * 16) * (1 - 0.6 * u), 0.8 * a, '#f1e6cc', '#a8936a');
      else {
        ctx.save(); ctx.globalAlpha = a; ctx.translate(x, y); ctx.rotate(u * 16 + i);
        ctx.beginPath(); ctx.ellipse(0, 0, (14 + sz * 8) * (1 - 0.5 * u), 5, 0, 0, TAU);
        ctx.fillStyle = kind < 0.75 ? '#25c516' : '#7cc23a'; ctx.fill();
        ctx.lineWidth = 2; ctx.strokeStyle = '#0d4f07'; ctx.stroke(); ctx.restore();
      }
    }
  }

  // капли слюны: летят из (x, y) веером и падают; life 0..1
  function drool(ctx, x, y, life, dir = 1, seed = 4) {
    if (life < 0 || life > 1) return;
    const r = rng(seed);
    for (let i = 0; i < 10; i++) {
      const vx = dir * (60 + r() * 260), vy = -120 - r() * 200, s = 7 + r() * 8;
      const px = x + vx * life, py = y + vy * life + 520 * life * life;
      ctx.save(); ctx.globalAlpha = 1 - life * 0.6;
      ctx.beginPath(); ctx.ellipse(px, py, s * 0.7, s, Math.atan2(vy + 1040 * life, vx) + Math.PI / 2, 0, TAU);
      ctx.fillStyle = '#9ee7ff'; ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = '#1b5e8c'; ctx.stroke();
      ctx.restore();
    }
  }

  // дерево (яблоня): ствол, крона из кругов; shake — качание кроны (радианы), apples — какие висят
  // [[dx, dy, golden], ...] относительно центра кроны
  function tree(ctx, x, ground, shake = 0, apples = [], s = 1) {
    const cy = ground - 520 * s, R = 235 * s;
    ctx.save();
    ctx.lineJoin = 'round'; ctx.lineWidth = 6; ctx.strokeStyle = '#111';
    // ствол с развилкой
    ctx.beginPath();
    ctx.moveTo(x - 46 * s, ground + 4); ctx.quadraticCurveTo(x - 30 * s, ground - 200 * s, x - 34 * s, cy + 120 * s);
    ctx.lineTo(x - 90 * s, cy + 40 * s); ctx.lineTo(x - 66 * s, cy + 24 * s); ctx.lineTo(x - 6 * s, cy + 90 * s);
    ctx.lineTo(x + 40 * s, cy + 20 * s); ctx.lineTo(x + 62 * s, cy + 36 * s); ctx.lineTo(x + 30 * s, cy + 120 * s);
    ctx.quadraticCurveTo(x + 28 * s, ground - 200 * s, x + 46 * s, ground + 4);
    ctx.closePath(); ctx.fillStyle = '#8a5a2b'; ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x - 10 * s, ground - 60 * s); ctx.quadraticCurveTo(x - 4 * s, ground - 160 * s, x - 14 * s, ground - 250 * s);
    ctx.lineWidth = 4; ctx.strokeStyle = '#5e3a17'; ctx.stroke();
    // крона качается вокруг развилки
    ctx.translate(x, cy + 100 * s); ctx.rotate(shake); ctx.translate(-x, -(cy + 100 * s));
    const blobs = [[0, -40, 1.0], [-150, 20, 0.62], [150, 20, 0.62], [-95, -120, 0.6], [100, -125, 0.6], [0, 70, 0.7],
      [-190, -50, 0.45], [190, -55, 0.45]];
    ctx.lineWidth = 6; ctx.strokeStyle = '#111';
    for (const [bx, by, k] of blobs) { ctx.beginPath(); ctx.arc(x + bx * s, cy + by * s, R * k * 0.8, 0, Math.PI * 2); ctx.stroke(); }
    for (const [bx, by, k] of blobs) {
      ctx.beginPath(); ctx.arc(x + bx * s, cy + by * s, R * k * 0.8 - 3, 0, Math.PI * 2); ctx.fillStyle = '#2fb52a'; ctx.fill();
    }
    for (const [bx, by, k] of blobs.slice(0, 5)) {
      ctx.beginPath(); ctx.arc(x + bx * s - R * k * 0.2, cy + by * s - R * k * 0.25, R * k * 0.3, 0, Math.PI * 2);
      ctx.fillStyle = '#4fd13e'; ctx.fill();
    }
    for (const [ax, ay, gold] of apples) apple(ctx, x + ax * s, cy + ay * s, 26 * s, 0, gold);
    ctx.restore();
  }

  // яблоко (красное или золотое) с листиком
  function apple(ctx, x, y, r = 26, rot = 0, gold = false) {
    ctx.save();
    ctx.translate(x, y); ctx.rotate(rot);
    ctx.lineWidth = Math.max(3, r * 0.16); ctx.strokeStyle = '#111'; ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(0, -r * 0.7);
    ctx.bezierCurveTo(r * 0.6, -r * 1.15, r * 1.25, -r * 0.5, r * 0.95, r * 0.35);
    ctx.bezierCurveTo(r * 0.75, r * 1.0, r * 0.25, r * 1.05, 0, r * 0.85);
    ctx.bezierCurveTo(-r * 0.25, r * 1.05, -r * 0.75, r * 1.0, -r * 0.95, r * 0.35);
    ctx.bezierCurveTo(-r * 1.25, -r * 0.5, -r * 0.6, -r * 1.15, 0, -r * 0.7);
    ctx.closePath();
    ctx.fillStyle = gold ? '#ffcf1f' : '#e8262d'; ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(-r * 0.4, -r * 0.25, r * 0.16, r * 0.28, 0.4, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.75)'; ctx.fill();
    ctx.beginPath(); ctx.moveTo(0, -r * 0.65); ctx.lineTo(r * 0.08, -r * 1.15); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(r * 0.38, -r * 1.05, r * 0.32, r * 0.14, -0.5, 0, Math.PI * 2);
    ctx.fillStyle = '#3fbf30'; ctx.fill(); ctx.lineWidth = Math.max(2, r * 0.1); ctx.stroke();
    if (gold) {
      ctx.lineWidth = 3; ctx.strokeStyle = '#fff6b0';
      for (let i = 0; i < 4; i++) {
        const a = i * Math.PI / 2 + 0.4;
        ctx.beginPath(); ctx.moveTo(Math.cos(a) * r * 1.3, Math.sin(a) * r * 1.3); ctx.lineTo(Math.cos(a) * r * 1.6, Math.sin(a) * r * 1.6); ctx.stroke();
      }
    }
    ctx.restore();
  }

  // пузырь жвачки: розовый полупрозрачный шар с бликом
  function bubble(ctx, x, y, r) {
    if (r <= 1) return;
    ctx.save();
    ctx.beginPath(); ctx.arc(x, y, r, 0, TAU);
    ctx.fillStyle = 'rgba(255, 110, 200, 0.82)'; ctx.fill();
    ctx.lineWidth = Math.max(3, r * 0.035); ctx.strokeStyle = '#7a1050'; ctx.stroke();
    ctx.beginPath(); ctx.arc(x, y, r * 0.72, Math.PI * 1.1, Math.PI * 1.45);
    ctx.lineWidth = Math.max(3, r * 0.08); ctx.lineCap = 'round'; ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.stroke();
    ctx.beginPath(); ctx.arc(x - r * 0.18, y - r * 0.62, r * 0.06, 0, TAU); ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.fill();
    ctx.restore();
  }

  // жвачка лопнула и облепила: розовая клякса с потёками; s — ширина
  function gumSplat(ctx, x, y, s, seed = 3, fill = '#ff6ec7', line = '#7a1050') {
    if (s <= 1) return;
    const r = rng(seed);
    ctx.save();
    ctx.translate(x, y);
    ctx.beginPath();
    const n = 14;
    for (let i = 0; i <= n; i++) {
      const a = i / n * TAU, k = 0.42 + r() * 0.16 + (Math.sin(a) > 0.3 ? r() * 0.25 : 0);
      const px = Math.cos(a) * s * k, py = Math.sin(a) * s * k * 0.9;
      i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
    }
    ctx.closePath();
    ctx.fillStyle = fill; ctx.fill();
    ctx.lineJoin = 'round'; ctx.lineWidth = Math.max(3, s * 0.03); ctx.strokeStyle = line; ctx.stroke();
    for (let i = 0; i < 3; i++) {                                     // потёки вниз
      const dx = (r() - 0.5) * s * 0.6, len = s * (0.2 + r() * 0.25);
      ctx.beginPath(); ctx.ellipse(dx, s * 0.35 + len * 0.5, s * 0.05, len * 0.5, 0, 0, TAU);
      ctx.fillStyle = fill; ctx.fill(); ctx.stroke();
    }
    ctx.beginPath(); ctx.ellipse(-s * 0.15, -s * 0.15, s * 0.08, s * 0.05, -0.5, 0, TAU);
    ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.fill();
    ctx.restore();
  }

  // тучка-реквизит: тёмная, с обводкой; s — ширина
  function rainCloud(ctx, x, y, s = 260) {
    const k = s / 260, P = [[-90, 10, 55], [-40, -25, 70], [30, -30, 65], [90, 5, 55], [0, 20, 60], [-60, 30, 45], [60, 30, 45]];
    ctx.save();
    ctx.lineWidth = 6; ctx.strokeStyle = '#1f232a';
    for (const [dx, dy, r] of P) { ctx.beginPath(); ctx.arc(x + dx * k, y + dy * k, r * k, 0, TAU); ctx.stroke(); }
    for (const [dx, dy, r] of P) { ctx.beginPath(); ctx.arc(x + dx * k, y + dy * k, r * k - 3, 0, TAU); ctx.fillStyle = '#7d8796'; ctx.fill(); }
    for (const [dx, dy, r] of P.slice(1, 3)) {
      ctx.beginPath(); ctx.arc(x + (dx - 15) * k, y + (dy - 18) * k, r * k * 0.45, 0, TAU); ctx.fillStyle = '#9aa4b2'; ctx.fill();
    }
    ctx.restore();
  }

  // дождь из-под тучки: x — центр, w — ширина, от y0 до земли y1; t — секунды
  function rain(ctx, x, y0, y1, w, t, alpha = 1, seed = 7) {
    const r = rng(seed);
    ctx.save();
    ctx.globalAlpha = alpha; ctx.lineCap = 'round';
    for (let i = 0; i < 40; i++) {
      const dx = (r() - 0.5) * w, ph = r(), sp = 1.6 + r() * 0.8;
      const u = (t * sp + ph) % 1, y = y0 + u * (y1 - y0);
      ctx.beginPath(); ctx.moveTo(x + dx, y); ctx.lineTo(x + dx - 3, y + 26);
      ctx.lineWidth = 5; ctx.strokeStyle = '#1b5e8c'; ctx.stroke();
      ctx.lineWidth = 2.5; ctx.strokeStyle = '#9ee7ff'; ctx.stroke();
    }
    ctx.restore();
  }

  // молния: зигзаг от (x0, y0) к (x1, y1); life 0..1 — мигает и гаснет
  function lightning(ctx, x0, y0, x1, y1, life, seed = 11) {
    if (life < 0 || life > 1) return;
    const r = rng(seed + Math.floor(life * 6));
    const n = 8, pts = [[x0, y0]];
    for (let i = 1; i < n; i++) {
      const u = i / n;
      pts.push([x0 + (x1 - x0) * u + (r() - 0.5) * 70, y0 + (y1 - y0) * u]);
    }
    pts.push([x1, y1]);
    ctx.save();
    ctx.globalAlpha = life < 0.6 ? 1 : (1 - life) / 0.4;
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    for (const [wdt, col] of [[22, '#111'], [16, '#ffe14d'], [6, '#ffffff']]) {
      ctx.beginPath(); pts.forEach(([px, py], i) => (i ? ctx.lineTo(px, py) : ctx.moveTo(px, py)));
      ctx.lineWidth = wdt; ctx.strokeStyle = col; ctx.stroke();
    }
    ctx.restore();
  }

  // лужа на траве
  function puddle(ctx, x, y, w, alpha = 1) {
    if (alpha <= 0 || w <= 0) return;
    ctx.save(); ctx.globalAlpha = alpha;
    ctx.beginPath(); ctx.ellipse(x, y, w / 2, w * 0.09, 0, 0, TAU);
    ctx.fillStyle = '#58b8ef'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = '#1b5e8c'; ctx.stroke();
    ctx.beginPath(); ctx.ellipse(x - w * 0.15, y - w * 0.02, w * 0.12, w * 0.02, 0, 0, TAU);
    ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.fill();
    ctx.restore();
  }

  // качели: бревно-опора и доска; x, y — ось (верх бревна), len — длина доски, ang — наклон (радианы)
  function seesaw(ctx, x, y, len, ang) {
    ctx.save();
    ctx.lineJoin = 'round'; ctx.lineWidth = 6; ctx.strokeStyle = '#111';
    // бревно
    ctx.beginPath(); ctx.moveTo(x - 60, y + 62); ctx.lineTo(x, y); ctx.lineTo(x + 60, y + 62); ctx.closePath();
    ctx.fillStyle = '#9a6a35'; ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.arc(x, y + 10, 16, 0, TAU); ctx.fillStyle = '#6b4520'; ctx.fill(); ctx.stroke();
    // доска
    ctx.translate(x, y); ctx.rotate(ang);
    ctx.beginPath(); ctx.rect(-len / 2, -18, len, 22); ctx.fillStyle = '#c98b47'; ctx.fill(); ctx.stroke();
    ctx.lineWidth = 3; ctx.strokeStyle = '#8a5a2b';
    for (const k of [-0.3, 0.05, 0.38]) { ctx.beginPath(); ctx.moveTo(len * k, -12); ctx.lineTo(len * k + 40, -12); ctx.stroke(); }
    ctx.restore();
  }

  // грязевая лужа: тёмно-коричневая, с пузырями; t — секунды
  function mudPit(ctx, x, y, w, t) {
    ctx.save();
    ctx.beginPath(); ctx.ellipse(x, y, w / 2, w * 0.11, 0, 0, TAU);
    ctx.fillStyle = '#5b3a1a'; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = '#2a170a'; ctx.stroke();
    ctx.beginPath(); ctx.ellipse(x - w * 0.12, y - w * 0.025, w * 0.22, w * 0.03, 0, 0, TAU);
    ctx.fillStyle = '#7a5129'; ctx.fill();
    for (let i = 0; i < 4; i++) {                                     // пузыри то надуваются, то лопаются
      const u = (t * 0.8 + i * 0.27) % 1, bx = x + (i - 1.5) * w * 0.2, r = 4 + 10 * Math.sin(Math.PI * u);
      ctx.beginPath(); ctx.arc(bx, y - 4, r, Math.PI, 0); ctx.fillStyle = '#6b4522'; ctx.fill();
      ctx.lineWidth = 2.5; ctx.strokeStyle = '#2a170a'; ctx.stroke();
    }
    ctx.restore();
  }

  // брызги грязи веером вверх; life 0..1
  function mudSplash(ctx, x, y, life, size = 1, seed = 5) {
    if (life < 0 || life > 1) return;
    const r = rng(seed);
    for (let i = 0; i < 16; i++) {
      const a = -Math.PI * (0.1 + 0.8 * r()), sp = (160 + r() * 260) * size;
      const px = x + Math.cos(a) * sp * life, py = y + Math.sin(a) * sp * life + 700 * life * life * size;
      const s = (10 + r() * 14) * size * (1 - 0.4 * life);
      if (py > y + 16) continue;                                      // упала обратно — в лужу
      ctx.save(); ctx.globalAlpha = 1 - life * 0.5;
      ctx.beginPath(); ctx.arc(px, py, s, 0, TAU); ctx.fillStyle = '#5b3a1a'; ctx.fill();
      ctx.lineWidth = 2.5; ctx.strokeStyle = '#2a170a'; ctx.stroke(); ctx.restore();
    }
  }

  // верёвка: от a к b, sag — провис (0 — натянута)
  function rope(ctx, a, b, sag = 0) {
    ctx.save();
    ctx.lineCap = 'round';
    const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2 + sag;
    for (const [w, c] of [[11, '#3a2410'], [7, '#d9b56b']]) {
      ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.quadraticCurveTo(mx, my, b[0], b[1]);
      ctx.lineWidth = w; ctx.strokeStyle = c; ctx.stroke();
    }
    ctx.restore();
  }

  // торт на тарелке: x — центр, y — низ тарелки, s — ширина
  function cake(ctx, x, y, s = 150, rot = 0) {
    const k = s / 150;
    ctx.save();
    ctx.translate(x, y); ctx.rotate(rot); ctx.scale(k, k);
    ctx.lineJoin = 'round'; ctx.lineWidth = 5; ctx.strokeStyle = '#111';
    ctx.beginPath(); ctx.ellipse(0, -6, 82, 12, 0, 0, TAU); ctx.fillStyle = '#f3f3f3'; ctx.fill(); ctx.stroke();       // тарелка
    ctx.beginPath(); ctx.rect(-62, -78, 124, 70); ctx.fillStyle = '#c47a3a'; ctx.fill(); ctx.stroke();               // корж
    ctx.beginPath(); ctx.rect(-62, -50, 124, 12); ctx.fillStyle = '#fff1f6'; ctx.fill(); ctx.stroke();               // крем
    ctx.beginPath(); ctx.moveTo(-66, -76);                                                                             // глазурь с потёками
    ctx.lineTo(66, -76); ctx.lineTo(66, -62); ctx.quadraticCurveTo(56, -50, 48, -62); ctx.quadraticCurveTo(36, -46, 24, -62);
    ctx.quadraticCurveTo(6, -44, -8, -62); ctx.quadraticCurveTo(-24, -48, -36, -62); ctx.quadraticCurveTo(-52, -46, -66, -62);
    ctx.closePath(); ctx.fillStyle = '#ff7fbf'; ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(0, -76, 66, 10, 0, 0, TAU); ctx.fillStyle = '#ff9fd0'; ctx.fill(); ctx.stroke();
    const sp = ['#ffe14d', '#5ad1ff', '#7bff6b', '#ffffff'];
    for (let i = 0; i < 9; i++) {
      ctx.beginPath(); ctx.ellipse(-48 + i * 12, -76 + (i % 2 ? 3 : -3), 4, 1.8, i, 0, TAU); ctx.fillStyle = sp[i % 4]; ctx.fill();
    }
    ctx.beginPath(); ctx.arc(0, -96, 13, 0, TAU); ctx.fillStyle = '#e8262d'; ctx.fill(); ctx.stroke();               // вишенка
    ctx.beginPath(); ctx.moveTo(2, -108); ctx.quadraticCurveTo(10, -124, 22, -126); ctx.lineWidth = 4; ctx.stroke();
    ctx.beginPath(); ctx.ellipse(-4, -100, 4, 3, -0.5, 0, TAU); ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.fill();
    ctx.restore();
  }

  // корона: x — центр, y — низ, s — ширина
  function crown(ctx, x, y, s = 110, rot = 0) {
    const k = s / 110;
    ctx.save();
    ctx.translate(x, y); ctx.rotate(rot); ctx.scale(k, k);
    ctx.lineJoin = 'round'; ctx.lineWidth = 5; ctx.strokeStyle = '#111';
    ctx.beginPath();
    ctx.moveTo(-50, 0); ctx.lineTo(-55, -62); ctx.lineTo(-28, -32); ctx.lineTo(0, -76); ctx.lineTo(28, -32); ctx.lineTo(55, -62);
    ctx.lineTo(50, 0); ctx.closePath();
    ctx.fillStyle = '#ffcf1f'; ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.rect(-50, -16, 100, 16); ctx.fillStyle = '#f0a800'; ctx.fill(); ctx.stroke();
    for (const [gx, gy, c] of [[-55, -64, '#e8262d'], [0, -78, '#3fbfff'], [55, -64, '#e8262d']]) {
      ctx.beginPath(); ctx.arc(gx, gy, 8, 0, TAU); ctx.fillStyle = c; ctx.fill(); ctx.stroke();
    }
    for (const [gx, c] of [[-25, '#3fdc4a'], [0, '#e8262d'], [25, '#3fbfff']]) {
      ctx.beginPath(); ctx.ellipse(gx, -8, 6, 5, 0, 0, TAU); ctx.fillStyle = c; ctx.fill(); ctx.lineWidth = 3; ctx.stroke();
    }
    ctx.beginPath(); ctx.moveTo(-40, -30); ctx.lineTo(-44, -50); ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.stroke();
    ctx.restore();
  }

  // леденец на палочке: (x, y) — конец палочки, rot — наклон (0 — конфета сверху), s — длина
  function lollipop(ctx, x, y, s = 120, rot = 0) {
    const k = s / 120;
    ctx.save();
    ctx.translate(x, y); ctx.rotate(rot); ctx.scale(k, k);
    ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -78);
    ctx.lineWidth = 12; ctx.strokeStyle = '#111'; ctx.stroke();
    ctx.lineWidth = 7; ctx.strokeStyle = '#f4f1ea'; ctx.stroke();
    ctx.beginPath(); ctx.arc(0, -112, 40, 0, TAU); ctx.fillStyle = '#ff4fa3'; ctx.fill();
    ctx.lineWidth = 5; ctx.strokeStyle = '#111'; ctx.stroke();
    ctx.beginPath();
    for (let a = 0; a < TAU * 2.2; a += 0.15) {                      // спираль
      const r = 3 + a * 2.25, px = Math.cos(a) * r, py = -112 + Math.sin(a) * r;
      a ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
    }
    ctx.lineWidth = 7; ctx.strokeStyle = '#fff3fa'; ctx.stroke();
    ctx.beginPath(); ctx.ellipse(-16, -128, 8, 5, -0.6, 0, TAU); ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.fill();
    ctx.restore();
  }

  // подушка: (x, y) — середина края, за который держат; rot — куда вытянута (0 — вверх);
  // L — длина, W — ширина, k — сплющенность поперёк (удар, лежит на траве)
  function pillow(ctx, x, y, rot = 0, L = 190, W = 124, k = 1) {
    ctx.save();
    ctx.translate(x, y); ctx.rotate(rot); ctx.scale(k, 1);
    const w = W / 2, b = 12;                                         // b — выпуклость сторон
    ctx.beginPath();
    ctx.moveTo(-w, -4);
    ctx.quadraticCurveTo(0, b, w, -4);                                 // край у руки
    ctx.quadraticCurveTo(w + b, -L / 2, w, -L + 4);                    // правый бок
    ctx.quadraticCurveTo(0, -L - b, -w, -L + 4);                       // дальний край
    ctx.quadraticCurveTo(-w - b, -L / 2, -w, -4);                      // левый бок
    ctx.closePath();
    ctx.fillStyle = '#f4f7ff'; ctx.fill();
    ctx.lineWidth = 5; ctx.lineJoin = 'round'; ctx.strokeStyle = '#111'; ctx.stroke();
    ctx.save(); ctx.clip();
    ctx.beginPath(); ctx.ellipse(w * 0.35, -L * 0.5, w * 0.55, L * 0.42, 0, 0, TAU); ctx.fillStyle = 'rgba(150,170,220,0.25)'; ctx.fill();
    ctx.beginPath(); ctx.ellipse(-w * 0.35, -L * 0.62, w * 0.22, L * 0.2, 0.15, 0, TAU); ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.fill();
    ctx.restore();
    ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(40,40,60,0.55)';
    ctx.beginPath(); ctx.moveTo(-w * 0.55, -L * 0.18); ctx.quadraticCurveTo(-w * 0.2, -L * 0.24, 0, -L * 0.2); ctx.stroke();   // складки
    ctx.beginPath(); ctx.moveTo(w * 0.15, -L * 0.82); ctx.quadraticCurveTo(w * 0.4, -L * 0.76, w * 0.6, -L * 0.8); ctx.stroke();
    ctx.restore();
  }

  // перья: разлетаются из точки (x, y) и медленно падают, покачиваясь; t — секунды от удара
  function feathers(ctx, x, y, t, seed = 1, n = 18, size = 1) {
    const LIFE = 2.6;
    if (t < 0 || t > LIFE) return;
    const r = rng(seed * 31 + 7);
    for (let i = 0; i < n; i++) {
      const a = r() * TAU, v = 180 + r() * 380, ph = r() * TAU, sw = 18 + r() * 26, s = (0.7 + r() * 0.6) * size;
      const burst = (1 - Math.exp(-4 * t)) / 4;
      const px = x + Math.cos(a) * v * burst + Math.sin(t * 3 + ph) * sw;
      const py = y + Math.sin(a) * v * burst * 0.8 + 70 * t;
      const ang = Math.sin(t * 3 + ph) * 0.9 + a;
      ctx.save();
      ctx.globalAlpha = Math.min(1, (LIFE - t) / 0.6);
      ctx.translate(px, py); ctx.rotate(ang); ctx.scale(s, s);
      ctx.beginPath();
      ctx.moveTo(-17, 0); ctx.quadraticCurveTo(-4, -10, 17, -2); ctx.quadraticCurveTo(2, 9, -17, 0);
      ctx.fillStyle = '#fff'; ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = '#555'; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-20, 1); ctx.lineTo(14, -1); ctx.lineWidth = 1.6; ctx.stroke();
      ctx.restore();
    }
  }

  // пчела: (x, y) — центр, s — масштаб, t — секунды (взмахи крыльев), dir — куда смотрит (1 — вправо)
  function bee(ctx, x, y, s = 1, t = 0, dir = 1) {
    ctx.save();
    ctx.translate(x, y); ctx.scale(s * dir, s);
    const flap = 0.35 + 0.65 * Math.abs(Math.sin(t * 60));
    ctx.lineWidth = 2.2; ctx.strokeStyle = '#111';
    for (const [wx, a] of [[-3, -0.5], [4, 0.3]]) {                       // крылья
      ctx.save(); ctx.translate(wx, -7); ctx.rotate(a); ctx.scale(1, flap);
      ctx.beginPath(); ctx.ellipse(0, -7, 6, 9, 0, 0, TAU);
      ctx.fillStyle = 'rgba(235,248,255,0.85)'; ctx.fill(); ctx.stroke(); ctx.restore();
    }
    ctx.beginPath(); ctx.ellipse(0, 0, 13, 9, 0, 0, TAU); ctx.fillStyle = '#ffd21f'; ctx.fill();
    ctx.save(); ctx.clip();
    ctx.fillStyle = '#111';
    for (const sx of [-5, 2]) ctx.fillRect(sx, -10, 3.5, 20);
    ctx.restore();
    ctx.beginPath(); ctx.ellipse(0, 0, 13, 9, 0, 0, TAU); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-13, 0); ctx.lineTo(-19, 1.5); ctx.lineTo(-13, 3); ctx.fillStyle = '#111'; ctx.fill();   // жало
    ctx.beginPath(); ctx.arc(8, -2, 2, 0, TAU); ctx.fill();                                                         // глаз
    ctx.restore();
  }

  // улей-колпак: (x, y) — центр, s — высота
  function hive(ctx, x, y, s = 110, rot = 0) {
    const k = s / 110;
    ctx.save();
    ctx.translate(x, y); ctx.rotate(rot); ctx.scale(k, k);
    ctx.lineWidth = 5; ctx.lineJoin = 'round'; ctx.strokeStyle = '#111';
    const bands = [[44, 55, 24], [26, 52, 22], [8, 45, 20], [-10, 36, 18], [-27, 25, 16], [-42, 13, 12]];   // y, полуширина, полувысота
    for (const [by, w, h] of bands) {
      ctx.beginPath(); ctx.ellipse(0, by, w, h, 0, 0, TAU);
      ctx.fillStyle = '#e9a92a'; ctx.fill(); ctx.stroke();
    }
    for (const [by, w, h] of bands.slice(0, 4)) {
      ctx.beginPath(); ctx.ellipse(-w * 0.35, by - h * 0.35, w * 0.3, h * 0.28, 0, 0, TAU); ctx.fillStyle = 'rgba(255,225,130,0.8)'; ctx.fill();
    }
    ctx.beginPath(); ctx.ellipse(6, 40, 13, 9, 0, 0, TAU); ctx.fillStyle = '#3a2108'; ctx.fill(); ctx.stroke();   // леток
    ctx.beginPath(); ctx.moveTo(22, 58); ctx.quadraticCurveTo(26, 70, 22, 78); ctx.quadraticCurveTo(18, 70, 22, 58);   // капля мёда
    ctx.fillStyle = '#ffb000'; ctx.fill(); ctx.lineWidth = 3; ctx.stroke();
    ctx.restore();
  }

  // стол: (x, ground) — середина под столом, w — ширина столешницы, h — высота
  function table(ctx, x, ground, w = 260, h = 170) {
    ctx.save();
    ctx.lineJoin = 'round'; ctx.lineWidth = 5; ctx.strokeStyle = '#111';
    for (const sx of [-1, 1]) {                                           // ножки
      ctx.beginPath();
      ctx.moveTo(x + sx * (w / 2 - 34), ground - h + 20); ctx.lineTo(x + sx * (w / 2 - 14), ground + 2);
      ctx.lineTo(x + sx * (w / 2 - 34), ground + 2); ctx.lineTo(x + sx * (w / 2 - 52), ground - h + 20); ctx.closePath();
      ctx.fillStyle = '#9a6430'; ctx.fill(); ctx.stroke();
    }
    ctx.beginPath(); ctx.rect(x - w / 2, ground - h, w, 26); ctx.fillStyle = '#c58646'; ctx.fill(); ctx.stroke();   // столешница
    ctx.beginPath(); ctx.moveTo(x - w / 2 + 12, ground - h + 9); ctx.lineTo(x + w / 2 - 40, ground - h + 9);
    ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(255,230,190,0.7)'; ctx.stroke();
    ctx.restore();
  }

  // торт-пирог с кремом: (x, y) — середина донышка, s — ширина
  function pie(ctx, x, y, s = 110, rot = 0) {
    const k = s / 110;
    ctx.save();
    ctx.translate(x, y); ctx.rotate(rot); ctx.scale(k, k);
    ctx.lineJoin = 'round'; ctx.lineWidth = 4.5; ctx.strokeStyle = '#111';
    ctx.beginPath(); ctx.moveTo(-55, -22); ctx.lineTo(55, -22); ctx.lineTo(44, 0); ctx.lineTo(-44, 0); ctx.closePath();   // форма
    ctx.fillStyle = '#c9ccd6'; ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-50, -14); ctx.lineTo(50, -14); ctx.lineWidth = 2.5; ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.stroke();
    ctx.lineWidth = 4.5; ctx.strokeStyle = '#111';
    ctx.beginPath();                                                          // крем
    ctx.moveTo(-56, -22);
    for (const [cx, r] of [[-40, 17], [-15, 22], [12, 21], [38, 17]]) ctx.arc(cx, -30, r, Math.PI * 0.95, Math.PI * 0.05, false);
    ctx.lineTo(56, -22); ctx.closePath();
    ctx.fillStyle = '#fffdf5'; ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.arc(0, -58, 10, 0, TAU); ctx.fillStyle = '#e8203a'; ctx.fill(); ctx.stroke();       // вишенка
    ctx.beginPath(); ctx.arc(-3, -61, 3, 0, TAU); ctx.fillStyle = '#fff'; ctx.fill();
    ctx.restore();
  }

  // футбольный мяч: (x, y) — центр, r — радиус, rot — поворот
  function ball(ctx, x, y, r = 48, rot = 0) {
    const pent = (cx, cy, R, a0) => {
      ctx.beginPath();
      for (let i = 0; i < 5; i++) { const a = a0 + i * TAU / 5; i ? ctx.lineTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R) : ctx.moveTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R); }
      ctx.closePath();
    };
    ctx.save();
    ctx.translate(x, y); ctx.rotate(rot);
    ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fillStyle = '#fbfbf7'; ctx.fill();
    ctx.save(); ctx.clip();
    ctx.fillStyle = '#1b1b1b'; ctx.strokeStyle = '#1b1b1b'; ctx.lineWidth = r * 0.06;
    pent(0, 0, r * 0.32, -Math.PI / 2); ctx.fill();
    for (let i = 0; i < 5; i++) {                                     // швы и половинки соседних пятиугольников
      const a = -Math.PI / 2 + i * TAU / 5;
      ctx.beginPath(); ctx.moveTo(Math.cos(a) * r * 0.32, Math.sin(a) * r * 0.32); ctx.lineTo(Math.cos(a) * r * 0.72, Math.sin(a) * r * 0.72); ctx.stroke();
      pent(Math.cos(a + Math.PI / 5) * r * 1.02, Math.sin(a + Math.PI / 5) * r * 1.02, r * 0.3, a + Math.PI / 5); ctx.fill();
    }
    ctx.beginPath(); ctx.ellipse(-r * 0.42, -r * 0.5, r * 0.16, r * 0.09, -0.6, 0, TAU); ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.fill();
    ctx.restore();
    ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.lineWidth = Math.max(4, r * 0.1); ctx.strokeStyle = '#111'; ctx.stroke();
    ctx.restore();
  }

  // банановая кожура (лежит на траве): s — ширина, rot — поворот
  function banana(ctx, x, y, s = 90, rot = 0) {
    ctx.save();
    ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s / 100, s / 100);
    ctx.lineJoin = 'round'; ctx.lineWidth = 5; ctx.strokeStyle = '#111';
    const flap = (dx, ang, len) => {
      ctx.save(); ctx.translate(dx, -8); ctx.rotate(ang);
      ctx.beginPath(); ctx.moveTo(-9, 0);
      ctx.quadraticCurveTo(-14, len * 0.55, 0, len); ctx.quadraticCurveTo(14, len * 0.55, 9, 0); ctx.closePath();
      ctx.fillStyle = '#ffe14d'; ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-2, len * 0.15); ctx.quadraticCurveTo(-6, len * 0.55, 0, len * 0.85);
      ctx.lineWidth = 3; ctx.strokeStyle = '#e8b800'; ctx.stroke(); ctx.lineWidth = 5; ctx.strokeStyle = '#111';
      ctx.restore();
    };
    flap(-20, 1.25, 48); flap(20, -1.25, 48); flap(-8, 0.45, 42); flap(8, -0.45, 42);
    // середина (мякоть ушла) и хвостик
    ctx.beginPath(); ctx.ellipse(0, -10, 16, 12, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#fff3a8'; ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-5, -20); ctx.lineTo(-4, -34); ctx.lineTo(5, -34); ctx.lineTo(5, -20); ctx.closePath();
    ctx.fillStyle = '#6b4a1e'; ctx.fill(); ctx.stroke();
    ctx.restore();
  }

  // подарок-ловушка: красная коробка с жёлтой лентой; lid 0..1 — крышка откинута;
  // spring {dx, dy} — пружина с боксёрской перчаткой от верха коробки (координаты сцены)
  function giftBox(ctx, x, y, s = 110, rot = 0, lid = 0, spring = null) {
    const w = s, h = s * 0.72, ink = '#111';
    ctx.save();
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    // пружина и перчатка — из коробки, позади крышки
    if (spring && Math.hypot(spring.dx, spring.dy) > 4) {
      const top = [x + Math.sin(rot) * h, y - Math.cos(rot) * h];
      const L = Math.hypot(spring.dx, spring.dy), ux = spring.dx / L, uy = spring.dy / L;
      const n = Math.max(4, Math.round(L / 22)), amp = 16;
      ctx.beginPath(); ctx.moveTo(top[0], top[1]);
      for (let i = 1; i <= n; i++) {
        const t = i / n, side = i === n ? 0 : (i % 2 ? 1 : -1) * amp;
        ctx.lineTo(top[0] + ux * L * t - uy * side, top[1] + uy * L * t + ux * side);
      }
      ctx.lineWidth = 9; ctx.strokeStyle = ink; ctx.stroke();
      ctx.lineWidth = 5; ctx.strokeStyle = '#c9c9c9'; ctx.stroke();
      const g = [top[0] + spring.dx, top[1] + spring.dy];
      ctx.save(); ctx.translate(g[0], g[1]); ctx.rotate(Math.atan2(uy, ux));
      ctx.lineWidth = 5; ctx.strokeStyle = ink;
      ctx.beginPath(); ctx.rect(-26, -20, 18, 40); ctx.fillStyle = '#fff'; ctx.fill(); ctx.stroke();   // манжета
      ctx.beginPath(); ctx.ellipse(16, 0, 34, 30, 0, 0, Math.PI * 2); ctx.fillStyle = '#e8262d'; ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(8, -26, 16, 11, -0.3, 0, Math.PI * 2); ctx.fill(); ctx.stroke();       // большой палец
      ctx.beginPath(); ctx.ellipse(22, -8, 9, 6, -0.4, 0, Math.PI * 2); ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.fill();
      ctx.restore();
    }
    ctx.translate(x, y); ctx.rotate(rot);
    ctx.lineWidth = 5; ctx.strokeStyle = ink;
    ctx.beginPath(); ctx.rect(-w / 2, -h, w, h); ctx.fillStyle = '#e8303a'; ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.rect(-w * 0.09, -h, w * 0.18, h); ctx.fillStyle = '#ffd21f'; ctx.fill(); ctx.stroke();
    // крышка с бантом, откидывается назад на петле
    ctx.save();
    ctx.translate(-w * 0.55, -h); ctx.rotate(-lid * 1.9); ctx.translate(w * 0.55, 0);
    ctx.beginPath(); ctx.rect(-w * 0.55, -h * 0.26, w * 1.1, h * 0.26); ctx.fillStyle = '#ff4650'; ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.rect(-w * 0.09, -h * 0.26, w * 0.18, h * 0.26); ctx.fillStyle = '#ffd21f'; ctx.fill(); ctx.stroke();
    for (const k of [-1, 1]) {
      ctx.beginPath(); ctx.ellipse(k * w * 0.16, -h * 0.4, w * 0.16, h * 0.13, k * 0.5, 0, Math.PI * 2);
      ctx.fillStyle = '#ffd21f'; ctx.fill(); ctx.stroke();
    }
    ctx.beginPath(); ctx.arc(0, -h * 0.3, w * 0.06, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.restore();
    ctx.restore();
  }

  // напольный вентилятор: (x, y) — низ подставки; s — высота; face -1..1 — куда дует (0 — на зрителя);
  // ang — угол лопастей; speed 0..1 — размытие; o.btn — нажата кнопка; o.tilt — наклон головы; o.noBase — без подставки
  function deskFan(ctx, x, y, s = 400, face = 1, ang = 0, speed = 0, o = {}) {
    const R = s * 0.27, hx = x, hy = y - s * 0.72, af = Math.abs(face), sg = face < 0 ? -1 : 1;
    ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.strokeStyle = '#111';
    if (!o.noBase) {
      // подставка
      ctx.beginPath(); ctx.ellipse(x, y - s * 0.045, s * 0.3, s * 0.06, 0, 0, TAU);
      ctx.fillStyle = '#7d8a9c'; ctx.fill(); ctx.lineWidth = 5; ctx.stroke();
      ctx.beginPath(); ctx.ellipse(x, y - s * 0.07, s * 0.26, s * 0.045, 0, Math.PI, TAU);
      ctx.fillStyle = '#a7b4c6'; ctx.fill();
      // кнопка
      const bx = x - s * 0.17, by = y - s * 0.075 + (o.btn ? 4 : 0);
      ctx.beginPath(); ctx.ellipse(bx, by, s * 0.05, s * 0.022, 0, 0, TAU);
      ctx.fillStyle = o.btn ? '#a8121b' : '#e8262e'; ctx.fill(); ctx.lineWidth = 4; ctx.stroke();
      if (!o.btn) { ctx.beginPath(); ctx.rect(bx - s * 0.05, by - 9, s * 0.1, 9); ctx.fillStyle = '#e8262e'; ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.ellipse(bx, by - 9, s * 0.05, s * 0.022, 0, 0, TAU); ctx.fillStyle = '#ff5a5f'; ctx.fill(); ctx.stroke(); }
    }
    // штанга
    ctx.beginPath(); ctx.rect(x - s * 0.028, hy, s * 0.056, y - s * 0.08 - hy); ctx.fillStyle = '#c9d3df'; ctx.fill(); ctx.lineWidth = 5; ctx.stroke();
    ctx.translate(hx, hy); ctx.rotate(o.tilt || 0);
    // мотор позади решётки
    const mx = -face * R * 0.55, mw = R * (0.35 + 0.35 * af);
    ctx.beginPath(); ctx.ellipse(mx, 0, mw, R * 0.42, 0, 0, TAU); ctx.fillStyle = '#5c6878'; ctx.fill(); ctx.lineWidth = 5; ctx.stroke();
    ctx.beginPath(); ctx.ellipse(mx - sg * mw * 0.2, -R * 0.12, mw * 0.5, R * 0.14, 0, 0, TAU); ctx.fillStyle = '#8693a6'; ctx.fill();
    // решётка и лопасти (окружность, сплюснутая по x)
    const gx = face * R * 0.12, rx = R * (1 - 0.58 * af);
    ctx.save(); ctx.translate(gx, 0); ctx.scale(rx / R, 1);
    ctx.beginPath(); ctx.arc(0, 0, R, 0, TAU); ctx.fillStyle = 'rgba(214,240,255,0.55)'; ctx.fill();
    const bl = 1 - Math.min(1, speed * 1.3) * 0.75;
    for (let i = 0; i < 3; i++) {
      const a = ang + i * TAU / 3;
      ctx.save(); ctx.rotate(a); ctx.globalAlpha = bl;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.bezierCurveTo(R * 0.25, -R * 0.42, R * 0.86, -R * 0.36, R * 0.84, 0);
      ctx.bezierCurveTo(R * 0.8, R * 0.22, R * 0.3, R * 0.2, 0, 0);
      ctx.fillStyle = '#2fa6ff'; ctx.fill(); ctx.lineWidth = 4; ctx.stroke();
      ctx.restore();
    }
    if (speed > 0.05) { ctx.globalAlpha = Math.min(0.75, speed); ctx.beginPath(); ctx.arc(0, 0, R * 0.86, 0, TAU); ctx.fillStyle = '#7fd0ff'; ctx.fill(); ctx.globalAlpha = 1; }
    ctx.lineWidth = 5;
    for (let i = 0; i < 8; i++) { const a = i * TAU / 8; ctx.beginPath(); ctx.moveTo(Math.cos(a) * R * 0.18, Math.sin(a) * R * 0.18); ctx.lineTo(Math.cos(a) * R, Math.sin(a) * R); ctx.strokeStyle = 'rgba(40,46,58,0.55)'; ctx.stroke(); }
    ctx.strokeStyle = '#111';
    ctx.beginPath(); ctx.arc(0, 0, R * 0.55, 0, TAU); ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(40,46,58,0.55)'; ctx.stroke();
    ctx.beginPath(); ctx.arc(0, 0, R, 0, TAU); ctx.lineWidth = 9; ctx.strokeStyle = '#3d4756'; ctx.stroke();
    ctx.lineWidth = 3; ctx.strokeStyle = '#111'; ctx.beginPath(); ctx.arc(0, 0, R + 5, 0, TAU); ctx.stroke();
    ctx.beginPath(); ctx.arc(0, 0, R * 0.17, 0, TAU); ctx.fillStyle = '#e8262e'; ctx.fill(); ctx.lineWidth = 4; ctx.stroke();
    ctx.restore();
    ctx.restore();
  }
  // поток от вентилятора: белые штрихи и лепестки летят от (x, y) в сторону dir; len — дальность;
  // t — секунды; power 0..1; spread — разлёт по вертикали; o.up — подъём струи (px на len)
  function fanWind(ctx, x, y, dir, len, t, power = 1, spread = 220, seed = 3, o = {}) {
    if (power <= 0) return;
    const r = rng(seed);
    ctx.save(); ctx.lineCap = 'round';
    for (let i = 0; i < 38; i++) {
      const ph = r(), sp = 1.3 + r() * 0.7, dy = (r() - 0.5) * 2, L = 60 + r() * 80, kind = r();
      const u = (t * sp + ph) % 1;
      const px = x + dir * (30 + len * u), py = y + dy * spread * (0.25 + u) * 0.5 - (o.up || 0) * u + Math.sin(u * 8 + i) * 8;
      const a = power * Math.min(1, Math.sin(Math.PI * u) * 1.8);
      if (a <= 0.02) continue;
      if (kind < 0.78) {
        ctx.globalAlpha = a * 0.7; ctx.strokeStyle = '#7cc8f0'; ctx.lineWidth = 14;
        ctx.beginPath(); ctx.moveTo(px - dir * L, py + 6); ctx.quadraticCurveTo(px - dir * L * 0.5, py - 10, px, py); ctx.stroke();
        ctx.globalAlpha = a; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 7; ctx.stroke();
      } else {                                      // листик / лепесток кувыркается
        ctx.globalAlpha = a; ctx.save(); ctx.translate(px, py); ctx.rotate(u * 16 + i);
        ctx.beginPath(); ctx.ellipse(0, 0, 13, 5, 0, 0, TAU);
        ctx.fillStyle = kind < 0.9 ? '#25c516' : '#ff9ad5'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = '#0d4f07'; ctx.stroke(); ctx.restore();
      }
    }
    ctx.restore();
  }

  // арбуз-блок (майнкрафт): низ по центру в (x, y), сторона s; rot; sq — сплющивание от низа (площадь та же)
  function melonBlock(ctx, x, y, s = 180, rot = 0, sq = 1) {
    ctx.save();
    ctx.translate(x, y); ctx.scale(1 / sq, sq); ctx.translate(0, -s / 2); ctx.rotate(rot);
    const h = s / 2, n = 8, u = s / n;
    ctx.fillStyle = '#111'; ctx.fillRect(-h - 5, -h - 5, s + 10, s + 10);
    const r = rng(77);
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
      const stripe = (i % 3 === 1), v = r();
      ctx.fillStyle = stripe ? (v < 0.5 ? '#2f7d14' : '#3b8f1c') : (v < 0.3 ? '#8fd23f' : v < 0.7 ? '#7cc434' : '#a6e04f');
      ctx.fillRect(-h + i * u, -h + j * u, u + 0.6, u + 0.6);
    }
    ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fillRect(-h, -h, s, u * 0.8);
    ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.fillRect(-h, h - u * 0.8, s, u * 0.8);
    ctx.restore();
  }
  // корка арбуза шлемом на голове: (x, y) — низ шлема по центру, w — ширина; rot
  function melonHelmet(ctx, x, y, w = 220, rot = 0, alpha = 1) {
    if (alpha <= 0) return;
    const hh = w * 0.62;
    ctx.save(); ctx.globalAlpha = alpha; ctx.translate(x, y); ctx.rotate(rot); ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.ellipse(0, 0, w / 2, hh, 0, Math.PI, TAU); ctx.closePath();
    ctx.fillStyle = '#3f9a1f'; ctx.fill();
    ctx.save(); ctx.clip();
    for (let k = -3; k <= 3; k++) {                 // тёмные полосы
      ctx.beginPath(); ctx.ellipse(k * w * 0.13, 0, w * 0.035, hh * 1.05, k * 0.12, 0, TAU);
      ctx.fillStyle = '#1f6410'; ctx.fill();
    }
    ctx.fillStyle = 'rgba(255,255,255,0.22)'; ctx.beginPath(); ctx.ellipse(-w * 0.18, -hh * 0.72, w * 0.12, hh * 0.1, -0.4, 0, TAU); ctx.fill();
    ctx.restore();
    ctx.lineWidth = Math.max(4, w * 0.025); ctx.strokeStyle = '#111'; ctx.stroke();
    // край: белая корка и красная мякоть с семечками
    ctx.beginPath(); ctx.rect(-w / 2 - 4, -w * 0.02, w + 8, w * 0.07); ctx.fillStyle = '#f2ffd9'; ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.rect(-w / 2 + 2, w * 0.05, w - 4, w * 0.06); ctx.fillStyle = '#ff3b4f'; ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#111';
    for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.ellipse(-w * 0.38 + i * w * 0.15, w * 0.08, w * 0.012, w * 0.02, 0, 0, TAU); ctx.fill(); }
    ctx.restore();
  }
  // долька арбуза: (x, y) — середина корки, s — ширина; rot; bite 0..1 — откушено
  function melonSlice(ctx, x, y, s = 120, rot = 0, bite = 0) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.lineJoin = 'round';
    const h = s * 0.85 * (1 - bite * 0.6);
    ctx.beginPath(); ctx.moveTo(-s / 2, 0); ctx.lineTo(0, -h); ctx.lineTo(s / 2, 0); ctx.closePath();
    ctx.fillStyle = '#ff3b4f'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = '#111'; ctx.stroke();
    ctx.fillStyle = '#111';
    for (const [a, b] of [[-0.2, 0.3], [0.15, 0.35], [0, 0.55], [-0.08, 0.2], [0.22, 0.15]]) if (b < 0.7 * (1 - bite * 0.6)) {
      ctx.beginPath(); ctx.ellipse(a * s, -b * s, s * 0.025, s * 0.04, 0, 0, TAU); ctx.fill();
    }
    ctx.beginPath(); ctx.moveTo(-s / 2 - 4, 0); ctx.quadraticCurveTo(0, s * 0.22, s / 2 + 4, 0); ctx.closePath();
    ctx.fillStyle = '#3f9a1f'; ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-s / 2 + 2, 0); ctx.lineTo(s / 2 - 2, 0); ctx.lineWidth = 6; ctx.strokeStyle = '#f2ffd9'; ctx.stroke();
    ctx.restore();
  }
  // арбузная семечка: чёрная капля с бликом
  function melonSeed(ctx, x, y, rot = 0, s = 16) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
    ctx.beginPath(); ctx.moveTo(0, -s * 0.7); ctx.quadraticCurveTo(s * 0.55, 0, 0, s * 0.6); ctx.quadraticCurveTo(-s * 0.55, 0, 0, -s * 0.7);
    ctx.fillStyle = '#1a1208'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = '#000'; ctx.stroke();
    ctx.beginPath(); ctx.ellipse(-s * 0.1, -s * 0.15, s * 0.1, s * 0.2, 0.3, 0, TAU); ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.fill();
    ctx.restore();
  }
  // арбуз раскололся: красные и зелёные кусочки, капли сока, семечки; life 0..1
  function melonSplash(ctx, x, y, life, seed = 1, floor = Infinity, size = 1) {
    if (life < 0 || life > 1) return;
    blockBurst(ctx, x, y, life, seed, ['#ff3b4f', '#3f9a1f', '#ff6a78', '#8fd23f'], 14, 40 * size, 0.8 * size, floor);
    const r = rng(seed + 9);
    ctx.save();
    for (let i = 0; i < 18; i++) {
      const a = -Math.PI * r(), v = (200 + 300 * r()) * size, px = x + Math.cos(a) * v * life, py = Math.min(floor, y + Math.sin(a) * v * life + 700 * life * life);
      ctx.globalAlpha = 1 - life;
      if (i % 3 === 0) melonSeed(ctx, px, py, life * 10 + i, 14);
      else { ctx.beginPath(); ctx.arc(px, py, (9 + r() * 9) * (1 - life * 0.5), 0, TAU); ctx.fillStyle = '#ff4a5c'; ctx.fill(); }
    }
    ctx.restore();
  }

  // зелье (майнкрафт): колба с горлышком и пробкой; (x, y) — низ по центру, s — высота; col — цвет;
  // fill 0..1 — сколько осталось; rot — наклон (вокруг низа)
  function potion(ctx, x, y, s = 110, col = '#3ad15a', rot = 0, fill = 1, t = 0) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.lineJoin = 'round';
    const R = s * 0.34, cy = -R, nw = s * 0.14, nh = s * 0.3;
    // жидкость
    ctx.save();
    ctx.beginPath(); ctx.arc(0, cy, R, 0, TAU); ctx.clip();
    ctx.fillStyle = 'rgba(220,240,255,0.55)'; ctx.fillRect(-R, cy - R, 2 * R, 2 * R);
    const top = cy + R - 2 * R * fill * 0.85;
    ctx.fillStyle = col; ctx.fillRect(-R - 2, top + Math.sin(t * 9) * 3, 2 * R + 4, 2 * R);
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    for (let i = 0; i < 3; i++) { const by = cy + R * 0.5 - ((t * 60 + i * 23) % (R * 1.4)); if (by > top) { ctx.beginPath(); ctx.arc(-R * 0.3 + i * R * 0.3, by, R * 0.08, 0, TAU); ctx.fill(); } }
    ctx.restore();
    ctx.beginPath(); ctx.arc(0, cy, R, 0, TAU); ctx.lineWidth = Math.max(4, s * 0.045); ctx.strokeStyle = '#111'; ctx.stroke();
    // горлышко и пробка
    ctx.beginPath(); ctx.rect(-nw / 2, cy - R - nh + 6, nw, nh); ctx.fillStyle = 'rgba(220,240,255,0.8)'; ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.rect(-nw * 0.62, cy - R - nh - s * 0.08, nw * 1.24, s * 0.12); ctx.fillStyle = '#b07a3e'; ctx.fill(); ctx.stroke();
    // блик
    ctx.beginPath(); ctx.ellipse(-R * 0.42, cy - R * 0.35, R * 0.16, R * 0.3, 0.5, 0, TAU); ctx.fillStyle = 'rgba(255,255,255,0.75)'; ctx.fill();
    ctx.restore();
  }
  // зелье разбилось: осколки стекла и цветные завитки; life 0..1
  function potionBurst(ctx, x, y, life, col = '#b04dff', seed = 1, size = 1) {
    if (life < 0 || life > 1) return;
    const r = rng(seed);
    ctx.save(); ctx.lineJoin = 'round';
    for (let i = 0; i < 12; i++) {                  // осколки
      const a = -Math.PI * (0.05 + 0.9 * r()), v = (180 + 260 * r()) * size, sz = (10 + 14 * r()) * size;
      const px = x + Math.cos(a) * v * life, py = y + Math.sin(a) * v * life + 500 * life * life;
      ctx.save(); ctx.translate(px, py); ctx.rotate(life * 12 * (r() - 0.5)); ctx.globalAlpha = 1 - life;
      ctx.beginPath(); ctx.moveTo(-sz / 2, sz / 3); ctx.lineTo(0, -sz / 2); ctx.lineTo(sz / 2, sz / 3); ctx.closePath();
      ctx.fillStyle = 'rgba(220,245,255,0.9)'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = '#3a6a8a'; ctx.stroke();
      ctx.restore();
    }
    for (let i = 0; i < 16; i++) {                  // облачко цвета зелья
      const a = r() * TAU, d = (60 + 120 * r()) * size * E.EASE.out(life);
      ctx.globalAlpha = (1 - life) * 0.85;
      ctx.beginPath(); ctx.arc(x + Math.cos(a) * d, y + Math.sin(a) * d * 0.6 - 60 * life, (26 + 20 * r()) * size * (0.6 + life), 0, TAU);
      ctx.fillStyle = col; ctx.fill();
    }
    ctx.restore();
  }
  // частицы действия зелья (как в майнкрафте): пиксельные завитки поднимаются вокруг (x, y); r — радиус
  function effectSwirls(ctx, x, y, t, col = '#b04dff', r = 140, alpha = 1, seed = 4) {
    if (alpha <= 0) return;
    const g = rng(seed);
    ctx.save();
    for (let i = 0; i < 24; i++) {
      const ph = g(), sp = 0.6 + g() * 0.5, ang = g() * TAU, u = (t * sp + ph) % 1;
      const px = x + Math.cos(ang + u * 3) * r * (0.5 + 0.5 * g()), py = y + r * 0.6 - u * r * 1.8;
      const a = alpha * Math.sin(Math.PI * u), sz = 11 + 10 * (1 - u);
      ctx.globalAlpha = a;
      ctx.fillStyle = '#111'; ctx.fillRect(px - sz / 2 - 2, py - sz / 2 - 2, sz + 4, sz + 4);
      ctx.fillStyle = i % 3 ? col : '#ffffff'; ctx.fillRect(px - sz / 2, py - sz / 2, sz, sz);
      if (i % 4 === 0) { ctx.fillRect(px + sz, py - sz, sz * 0.6, sz * 0.6); }
    }
    ctx.restore();
  }

  // портал (незер): эллипс с обсидиановой рамкой и фиолетовым вихрем; (x, y) — центр, rx/ry — радиусы,
  // t — секунды, k 0..1 — раскрытие
  function portal(ctx, x, y, rx, ry, t, k = 1, seed = 2) {
    if (k <= 0) return;
    rx *= k; ry *= k;
    ctx.save(); ctx.translate(x, y);
    const g = ctx.createRadialGradient(0, 0, 4, 0, 0, Math.max(rx, ry));
    g.addColorStop(0, '#ffb3fb'); g.addColorStop(0.35, '#d24dff'); g.addColorStop(0.8, '#6a12c9'); g.addColorStop(1, '#2b0757');
    ctx.save(); ctx.scale(1, ry / rx);
    ctx.beginPath(); ctx.arc(0, 0, rx, 0, TAU); ctx.fillStyle = g; ctx.fill();
    ctx.clip();
    ctx.lineCap = 'round';
    for (let i = 0; i < 5; i++) {                   // вихрь
      const a0 = t * 4 + i * TAU / 5;
      ctx.beginPath(); ctx.arc(0, 0, rx * (0.25 + i * 0.14), a0, a0 + 2.2);
      ctx.lineWidth = rx * 0.07; ctx.strokeStyle = i % 2 ? 'rgba(255,200,255,0.75)' : 'rgba(150,60,255,0.8)'; ctx.stroke();
    }
    ctx.restore();
    // обсидиановая рамка с бликами-пикселями
    ctx.save(); ctx.scale(1, ry / rx);
    ctx.beginPath(); ctx.arc(0, 0, rx, 0, TAU);
    ctx.lineWidth = 26 * Math.min(1, rx / 120); ctx.strokeStyle = '#140a24'; ctx.stroke();
    ctx.lineWidth = 16 * Math.min(1, rx / 120); ctx.strokeStyle = '#2e1650'; ctx.stroke();
    ctx.restore();
    const r = rng(seed);
    for (let i = 0; i < 18; i++) {
      const a = (i / 18) * TAU, px = Math.cos(a) * rx, py = Math.sin(a) * ry, sz = 7 * Math.min(1, rx / 120);
      ctx.fillStyle = r() < 0.5 ? '#6b3aa8' : '#4a2380'; ctx.fillRect(px - sz / 2, py - sz / 2, sz, sz);
    }
    // искры
    for (let i = 0; i < 10; i++) {
      const u = (t * (0.6 + r() * 0.5) + r()) % 1, a = r() * TAU;
      const px = Math.cos(a) * rx * (0.6 + u * 0.6), py = Math.sin(a) * ry * (0.6 + u * 0.6) - u * 30;
      ctx.globalAlpha = Math.sin(Math.PI * u); ctx.fillStyle = i % 2 ? '#ff9cf5' : '#c77dff';
      ctx.fillRect(px - 5, py - 5, 10, 10);
    }
    ctx.restore();
  }

  // сахарная вата: пушистый комок, (x, y) — центр, r — радиус
  function fluff(ctx, x, y, r, seed = 3, alpha = 1, col = '#ff9cd6', line = '#b8287a') {
    if (r <= 2 || alpha <= 0) return;
    const g = rng(seed), lumps = [[0, 0, 0.62]];
    for (let i = 0; i < 11; i++) { const a = i / 11 * TAU + g() * 0.4, d = 0.42 + g() * 0.18; lumps.push([Math.cos(a) * d, Math.sin(a) * d * 0.9, 0.3 + g() * 0.14]); }
    ctx.save(); ctx.globalAlpha = alpha;
    ctx.lineWidth = Math.max(3, r * 0.05); ctx.strokeStyle = line;
    for (const [dx, dy, rr] of lumps) { ctx.beginPath(); ctx.arc(x + dx * r, y + dy * r, rr * r, 0, TAU); ctx.stroke(); }
    for (const [dx, dy, rr] of lumps) { ctx.beginPath(); ctx.arc(x + dx * r, y + dy * r, rr * r - ctx.lineWidth / 2, 0, TAU); ctx.fillStyle = col; ctx.fill(); }
    ctx.fillStyle = col === '#ff9cd6' ? 'rgba(255,240,250,0.8)' : 'rgba(255,255,255,0.85)';
    for (let i = 0; i < 6; i++) { const a = g() * TAU, d = g() * 0.6; ctx.beginPath(); ctx.arc(x + Math.cos(a) * d * r, y + Math.sin(a) * d * r - r * 0.1, r * (0.07 + g() * 0.06), 0, TAU); ctx.fill(); }
    ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = Math.max(2, r * 0.025);
    for (let i = 0; i < 5; i++) { const a = g() * TAU, d = g() * 0.5 * r; ctx.beginPath(); ctx.arc(x + Math.cos(a) * d, y + Math.sin(a) * d, r * 0.18, a, a + 2); ctx.stroke(); }
    ctx.restore();
  }
  // вата на палочке: (x, y) — низ палочки, L — длина, r — радиус ваты (0 — съедена), rot — наклон от вертикали
  function cottonCandy(ctx, x, y, L = 300, r = 120, rot = 0, seed = 3) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
    ctx.lineCap = 'round';
    ctx.lineWidth = 16; ctx.strokeStyle = '#111'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -L); ctx.stroke();
    ctx.lineWidth = 9; ctx.strokeStyle = '#f4e3c1'; ctx.stroke();
    ctx.lineWidth = 9; ctx.strokeStyle = '#ff5fa8'; ctx.setLineDash([14, 18]); ctx.stroke(); ctx.setLineDash([]);
    ctx.restore();
    if (r > 2) fluff(ctx, x + Math.sin(rot) * (L - r * 0.15), y - Math.cos(rot) * (L - r * 0.15), r, seed);
  }
  // вата разлетелась клочьями: life 0..1
  function fluffBurst(ctx, x, y, life, size = 1, seed = 6, col = '#ff9cd6', line = '#b8287a') {
    if (life < 0 || life > 1) return;
    const g = rng(seed);
    for (let i = 0; i < 10; i++) {
      const a = g() * TAU, v = (160 + 240 * g()) * size;
      fluff(ctx, x + Math.cos(a) * v * life, y + Math.sin(a) * v * life + 260 * life * life, (26 + 22 * g()) * size * (1 - life * 0.4), seed + i, 1 - life, col, line);
    }
  }

  // колокол (майнкрафт): (x, y) — точка подвеса (верх), s — ширина низа; rot — качание вокруг подвеса;
  // flip — вверх ногами (как шапка/колпак: y — середина низа)
  function mcBell(ctx, x, y, s = 150, rot = 0, sq = 1) {
    const h = s * 0.95, top = s * 0.62;
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(1 / sq, sq);
    ctx.lineJoin = 'round'; ctx.lineWidth = Math.max(4, s * 0.035); ctx.strokeStyle = '#111';
    ctx.beginPath(); ctx.rect(-s * 0.08, 0, s * 0.16, s * 0.12); ctx.fillStyle = '#6b4a2b'; ctx.fill(); ctx.stroke();      // ушко
    ctx.beginPath();
    ctx.moveTo(-top / 2, s * 0.12); ctx.lineTo(top / 2, s * 0.12);
    ctx.quadraticCurveTo(top / 2 + s * 0.06, h * 0.55, s / 2, h);
    ctx.lineTo(-s / 2, h);
    ctx.quadraticCurveTo(-top / 2 - s * 0.06, h * 0.55, -top / 2, s * 0.12);
    ctx.closePath();
    const g = ctx.createLinearGradient(-s / 2, 0, s / 2, 0);
    g.addColorStop(0, '#c98a0e'); g.addColorStop(0.35, '#ffe14d'); g.addColorStop(0.6, '#ffd21f'); g.addColorStop(1, '#b0740a');
    ctx.fillStyle = g; ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.rect(-s / 2 - 6, h - s * 0.1, s + 12, s * 0.12); ctx.fillStyle = '#e8a514'; ctx.fill(); ctx.stroke();       // обод
    ctx.beginPath(); ctx.rect(-top / 2 - 2, h * 0.38, top + 4, s * 0.07); ctx.fillStyle = '#d18f0f'; ctx.fill();                      // поясок
    ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.fillRect(-top / 2 + s * 0.06, s * 0.2, s * 0.06, h * 0.55);
    ctx.restore();
  }
  // стойка колокола: два бревна и перекладина; (x, y) — низ по центру, H — высота, W — ширина; grow 0..1 — вырастает
  function bellStand(ctx, x, y, H = 430, W = 300, grow = 1) {
    if (grow <= 0) return;
    const hh = H * grow;
    ctx.save(); ctx.lineJoin = 'round';
    const post = (px) => {
      ctx.fillStyle = '#111'; ctx.fillRect(px - 22, y - hh - 4, 44, hh + 4);
      ctx.fillStyle = '#8a5a2e'; ctx.fillRect(px - 18, y - hh, 36, hh);
      ctx.fillStyle = '#6b4320'; for (let k = 0; k < hh; k += 34) ctx.fillRect(px - 18, y - hh + k, 36, 6);
      ctx.fillStyle = '#a8733f'; ctx.fillRect(px - 14, y - hh, 8, hh);
    };
    post(x - W / 2); post(x + W / 2);
    ctx.fillStyle = '#111'; ctx.fillRect(x - W / 2 - 30, y - hh - 30, W + 60, 34);
    ctx.fillStyle = '#4a2f17'; ctx.fillRect(x - W / 2 - 26, y - hh - 26, W + 52, 26);
    ctx.fillStyle = '#6b4320'; ctx.fillRect(x - W / 2 - 26, y - hh - 26, W + 52, 6);
    ctx.restore();
  }
  // звуковые волны колокола: дуги расходятся от (x, y); life 0..1; dir 0 — во все стороны, ±1 — в сторону
  function soundRings(ctx, x, y, life, size = 1, dir = 0) {
    if (life < 0 || life > 1) return;
    ctx.save(); ctx.lineCap = 'round';
    for (let i = 0; i < 4; i++) {
      const u = life - i * 0.12;
      if (u <= 0 || u >= 1) continue;
      const r = (60 + 520 * E.EASE.out(u)) * size;
      ctx.globalAlpha = (1 - u) * 0.9;
      for (const [lw, c] of [[16, '#7a5200'], [8, '#ffe14d']]) {
        ctx.lineWidth = lw * (1 - u * 0.5); ctx.strokeStyle = c;
        if (dir === 0) { ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.stroke(); }
        else { const a0 = dir > 0 ? -0.6 : Math.PI - 0.6; ctx.beginPath(); ctx.arc(x, y, r, a0, a0 + 1.2); ctx.stroke(); }
      }
    }
    ctx.restore();
  }

  // лимон: (x, y) — центр, r — полуширина, rot, sq — сплющен (площадь та же)
  function lemon(ctx, x, y, r = 60, rot = 0, sq = 1) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(1 / sq, sq);
    ctx.lineJoin = 'round'; ctx.lineWidth = Math.max(3, r * 0.07); ctx.strokeStyle = '#111';
    const h = r * 0.72;
    ctx.beginPath();
    ctx.moveTo(-r * 1.08, 0);
    ctx.bezierCurveTo(-r * 0.9, -h * 1.15, r * 0.9, -h * 1.15, r * 1.08, 0);
    ctx.bezierCurveTo(r * 0.9, h * 1.15, -r * 0.9, h * 1.15, -r * 1.08, 0);
    ctx.closePath();
    ctx.fillStyle = '#ffe12e'; ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(r * 0.1, h * 0.35, r * 0.7, h * 0.35, 0, 0, TAU); ctx.fillStyle = 'rgba(230,170,0,0.35)'; ctx.fill();
    ctx.beginPath(); ctx.ellipse(-r * 0.3, -h * 0.4, r * 0.32, h * 0.18, -0.3, 0, TAU); ctx.fillStyle = 'rgba(255,255,255,0.75)'; ctx.fill();
    ctx.fillStyle = 'rgba(200,150,0,0.6)';
    for (const [dx, dy] of [[0.4, -0.2], [0.55, 0.15], [-0.1, 0.3], [0.2, 0.05], [-0.5, 0.1]]) { ctx.beginPath(); ctx.arc(dx * r, dy * h, r * 0.035, 0, TAU); ctx.fill(); }
    ctx.beginPath(); ctx.ellipse(-r * 1.08, 0, r * 0.12, r * 0.08, 0, 0, TAU); ctx.fillStyle = '#8fbf1f'; ctx.fill(); ctx.lineWidth = 2; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-r * 1.05, -r * 0.05); ctx.quadraticCurveTo(-r * 1.3, -r * 0.5, -r * 0.95, -r * 0.62);
    ctx.quadraticCurveTo(-r * 0.75, -r * 0.3, -r * 1.05, -r * 0.05); ctx.fillStyle = '#3fae2a'; ctx.fill(); ctx.stroke();      // листик
    ctx.restore();
  }
  // брызги сока: жёлтые капли во все стороны; life 0..1
  function juiceSplash(ctx, x, y, life, size = 1, seed = 4) {
    if (life < 0 || life > 1) return;
    const r = rng(seed);
    ctx.save();
    for (let i = 0; i < 18; i++) {
      const a = -Math.PI * (0.05 + 0.9 * r()) + (r() < 0.25 ? Math.PI : 0), v = (140 + 260 * r()) * size;
      const px = x + Math.cos(a) * v * life, py = y + Math.sin(a) * v * life + 420 * life * life, rr = (6 + r() * 9) * size * (1 - life * 0.5);
      ctx.globalAlpha = 1 - life;
      ctx.beginPath(); ctx.arc(px, py, rr, 0, TAU); ctx.fillStyle = '#fff36a'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = '#c99a00'; ctx.stroke();
    }
    ctx.restore();
  }
  // «кисло!»: зелёно-жёлтые волнистые чёрточки вокруг головы; (x, y) — центр, r — радиус, t — секунды
  function sourLines(ctx, x, y, r, t, alpha = 1) {
    if (alpha <= 0) return;
    ctx.save(); ctx.globalAlpha = alpha; ctx.lineCap = 'round';
    for (let i = 0; i < 8; i++) {
      const a = i / 8 * TAU + Math.sin(t * 7 + i) * 0.08, r0 = r * (1.05 + 0.08 * Math.sin(t * 20 + i * 2)), L = r * 0.32;
      const ax = x + Math.cos(a) * r0, ay = y + Math.sin(a) * r0, nx = Math.cos(a), ny = Math.sin(a);
      for (const [lw, c] of [[10, '#4d6b00'], [5, '#d8ff3a']]) {
        ctx.lineWidth = lw; ctx.strokeStyle = c; ctx.beginPath(); ctx.moveTo(ax, ay);
        for (let k = 1; k <= 4; k++) { const s = k / 4 * L, w = (k % 2 ? 1 : -1) * 7; ctx.lineTo(ax + nx * s - ny * w, ay + ny * s + nx * w); }
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  // блок песка (майнкрафт): (x, y) — центр, s — сторона, rot — поворот, seed — узор
  function sandBlock(ctx, x, y, s = 110, rot = 0, seed = 1, sq = 1) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(1 / sq, sq);
    const h = s / 2, n = 8, u = s / n, r = rng(seed * 7 + 3);
    ctx.fillStyle = '#111'; ctx.fillRect(-h - 4, -h - 4, s + 8, s + 8);
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
      const v = r();
      ctx.fillStyle = v < 0.22 ? '#e6cf8a' : v < 0.6 ? '#f2dea0' : v < 0.85 ? '#f8e9b8' : '#d9bf78';
      ctx.fillRect(-h + i * u, -h + j * u, u + 0.6, u + 0.6);
    }
    ctx.fillStyle = 'rgba(255,255,255,0.22)'; ctx.fillRect(-h, -h, s, u * 0.7);
    ctx.fillStyle = 'rgba(120,90,30,0.18)'; ctx.fillRect(-h, h - u * 0.7, s, u * 0.7);
    ctx.restore();
  }

  // стрела-присоска: (x, y) — присоска (кончик), rot — куда летит (0 — вправо), L — длина
  function toyArrow(ctx, x, y, rot = 0, L = 150, cup = '#e8262e') {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.lineWidth = 15; ctx.strokeStyle = '#111'; ctx.beginPath(); ctx.moveTo(-L, 0); ctx.lineTo(-12, 0); ctx.stroke();
    ctx.lineWidth = 8; ctx.strokeStyle = '#ffcf3a'; ctx.stroke();
    for (const k of [-1, 1]) {                         // оперение
      ctx.beginPath(); ctx.moveTo(-L + 6, 0); ctx.lineTo(-L - 18, k * 22); ctx.lineTo(-L + 30, k * 4); ctx.closePath();
      ctx.fillStyle = '#2a8cff'; ctx.fill(); ctx.lineWidth = 3.5; ctx.strokeStyle = '#111'; ctx.stroke();
    }
    ctx.beginPath(); ctx.moveTo(-16, -8); ctx.lineTo(-4, -22); ctx.quadraticCurveTo(4, 0, -4, 22); ctx.lineTo(-16, 8); ctx.closePath();
    ctx.fillStyle = cup; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = '#111'; ctx.stroke();
    ctx.restore();
  }
  // красный кружок-след от присоски
  function suctionMark(ctx, x, y, r = 22, alpha = 1) {
    if (alpha <= 0) return;
    ctx.save(); ctx.globalAlpha = alpha;
    ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.lineWidth = r * 0.45; ctx.strokeStyle = 'rgba(230,30,60,0.75)'; ctx.stroke();
    ctx.beginPath(); ctx.arc(x, y, r * 0.55, 0, TAU); ctx.fillStyle = 'rgba(255,90,120,0.45)'; ctx.fill();
    ctx.restore();
  }
  // вантуз: (x, y) — середина края присоски, rot — куда смотрит присоска (0 — вправо), L — длина ручки, s — ширина присоски
  function plunger(ctx, x, y, rot = 0, L = 260, s = 130) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.lineWidth = 24; ctx.strokeStyle = '#111'; ctx.beginPath(); ctx.moveTo(-s * 0.45, 0); ctx.lineTo(-s * 0.45 - L, 0); ctx.stroke();
    ctx.lineWidth = 15; ctx.strokeStyle = '#b07a3e'; ctx.stroke();
    ctx.lineWidth = 4; ctx.strokeStyle = '#d9a566'; ctx.beginPath(); ctx.moveTo(-s * 0.5, -3); ctx.lineTo(-s * 0.45 - L + 6, -3); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, -s / 2); ctx.quadraticCurveTo(-s * 0.55, -s * 0.5, -s * 0.55, 0); ctx.quadraticCurveTo(-s * 0.55, s * 0.5, 0, s / 2);
    ctx.closePath(); ctx.fillStyle = '#e8262e'; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = '#111'; ctx.stroke();
    ctx.beginPath(); ctx.ellipse(-s * 0.3, -s * 0.2, s * 0.08, s * 0.16, 0.3, 0, TAU); ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.fill();
    ctx.beginPath(); ctx.rect(-4, -s / 2 - 2, 10, s + 4); ctx.fillStyle = '#a8121b'; ctx.fill(); ctx.stroke();
    ctx.restore();
  }

  // пончик спереди: (x, y) — центр, r — радиус; glaze — глазурь; rot; bite 0..1 — откушено (справа)
  function donut(ctx, x, y, r = 70, rot = 0, glaze = '#ff7ac8', seed = 3) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.lineJoin = 'round';
    const lw = Math.max(3, r * 0.06);
    ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.arc(0, 0, r * 0.34, 0, TAU, true);
    ctx.fillStyle = '#d99a4e'; ctx.fill('evenodd'); ctx.lineWidth = lw; ctx.strokeStyle = '#111'; ctx.stroke();
    ctx.beginPath();                                // глазурь с подтёками
    for (let i = 0; i <= 24; i++) { const a = i / 24 * TAU, rr = r * (0.84 + (i % 3 === 0 ? 0.1 : 0) * Math.max(0, Math.sin(a))); i ? ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) : ctx.moveTo(Math.cos(a) * rr, Math.sin(a) * rr); }
    ctx.closePath(); ctx.arc(0, 0, r * 0.42, 0, TAU, true);
    ctx.fillStyle = glaze; ctx.fill('evenodd'); ctx.lineWidth = lw * 0.7; ctx.stroke();
    const g = rng(seed), cols = ['#ffffff', '#2a8cff', '#ffe14d', '#3ad15a', '#ff3a3a'];
    ctx.lineCap = 'round';
    for (let i = 0; i < 16; i++) {
      const a = g() * TAU, d = r * (0.5 + g() * 0.3), q = g() * TAU;
      ctx.strokeStyle = cols[i % cols.length]; ctx.lineWidth = r * 0.07;
      ctx.beginPath(); ctx.moveTo(Math.cos(a) * d - Math.cos(q) * r * 0.06, Math.sin(a) * d - Math.sin(q) * r * 0.06); ctx.lineTo(Math.cos(a) * d + Math.cos(q) * r * 0.06, Math.sin(a) * d + Math.sin(q) * r * 0.06); ctx.stroke();
    }
    ctx.beginPath(); ctx.ellipse(-r * 0.45, -r * 0.5, r * 0.18, r * 0.08, -0.6, 0, TAU); ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.fill();
    ctx.restore();
  }
  // пончик-кольцо вокруг персонажа (вид сбоку): (x, y) — центр, w — ширина; half 'back' | 'front'; rot — наклон
  function donutRing(ctx, x, y, w, half = 'front', rot = 0, glaze = '#ff7ac8') {
    const h = w * 0.28, t = w * 0.16;
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.lineJoin = 'round'; ctx.lineWidth = Math.max(4, w * 0.02); ctx.strokeStyle = '#111';
    const a0 = half === 'back' ? Math.PI : 0, a1 = half === 'back' ? TAU : Math.PI;
    ctx.beginPath(); ctx.ellipse(0, 0, w / 2, h, 0, a0, a1); ctx.ellipse(0, 0, w / 2 - t, h - t * 0.55, 0, a1, a0, true); ctx.closePath();
    ctx.fillStyle = '#d99a4e'; ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(0, -t * 0.25, w / 2 - t * 0.12, h - t * 0.1, 0, a0, a1); ctx.ellipse(0, -t * 0.25, w / 2 - t * 0.85, h - t * 0.6, 0, a1, a0, true); ctx.closePath();
    ctx.fillStyle = glaze; ctx.fill(); ctx.lineWidth = Math.max(3, w * 0.014); ctx.stroke();
    ctx.restore();
  }

  // пицца: (x, y) — центр, r — радиус, rot — поворот, sy — сплющенность по вертикали (лежит — ~0.3), gone — сколько кусков съедено (из 8)
  function pizza(ctx, x, y, r = 150, rot = 0, sy = 1, gone = 0, seed = 2) {
    ctx.save(); ctx.translate(x, y); ctx.scale(1, sy); ctx.rotate(rot); ctx.lineJoin = 'round';
    const lw = Math.max(3, r * 0.035) / Math.max(0.35, sy);
    const a0 = (gone / 8) * TAU;
    const slicePath = (rr) => { ctx.beginPath(); if (gone > 0) { ctx.moveTo(0, 0); ctx.arc(0, 0, rr, a0 - Math.PI / 2, TAU - Math.PI / 2); ctx.closePath(); } else ctx.arc(0, 0, rr, 0, TAU); };
    slicePath(r); ctx.fillStyle = '#d9913e'; ctx.fill(); ctx.lineWidth = lw; ctx.strokeStyle = '#111'; ctx.stroke();
    slicePath(r * 0.86); ctx.fillStyle = '#e8402a'; ctx.fill();
    ctx.save(); slicePath(r * 0.84); ctx.clip();
    const g = rng(seed);
    for (let i = 0; i < 14; i++) { const a = g() * TAU, d = g() * r * 0.7; ctx.beginPath(); ctx.arc(Math.cos(a) * d, Math.sin(a) * d, r * (0.16 + g() * 0.1), 0, TAU); ctx.fillStyle = '#ffd84a'; ctx.fill(); }
    for (let i = 0; i < 9; i++) { const a = g() * TAU, d = r * (0.2 + g() * 0.5); ctx.beginPath(); ctx.arc(Math.cos(a) * d, Math.sin(a) * d, r * 0.1, 0, TAU); ctx.fillStyle = '#c9182c'; ctx.fill(); ctx.lineWidth = lw * 0.6; ctx.stroke(); }
    for (let i = 0; i < 6; i++) { const a = g() * TAU, d = r * (0.2 + g() * 0.55); ctx.fillStyle = '#2f9a2a'; ctx.fillRect(Math.cos(a) * d - r * 0.03, Math.sin(a) * d - r * 0.03, r * 0.06, r * 0.06); }
    ctx.lineWidth = lw * 0.7; ctx.strokeStyle = 'rgba(120,40,10,0.6)';
    for (let k = 0; k < 4; k++) { const a = k * Math.PI / 4; ctx.beginPath(); ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r); ctx.lineTo(-Math.cos(a) * r, -Math.sin(a) * r); ctx.stroke(); }
    ctx.restore();
    ctx.restore();
  }
  // кусок пиццы: (x, y) — середина корки, L — длина, rot — направление кончика (0 — вверх)
  function pizzaSlice(ctx, x, y, L = 150, rot = 0, seed = 4) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.lineJoin = 'round';
    const w = L * 0.78, lw = Math.max(3, L * 0.035);
    ctx.beginPath(); ctx.moveTo(-w / 2, 0); ctx.quadraticCurveTo(0, L * 0.12, w / 2, 0); ctx.lineTo(0, -L); ctx.closePath();
    ctx.fillStyle = '#ffd84a'; ctx.fill(); ctx.lineWidth = lw; ctx.strokeStyle = '#111'; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-w * 0.32, -L * 0.14); ctx.quadraticCurveTo(-w * 0.36, L * 0.02, -w * 0.28, -L * 0.04); ctx.lineTo(-w * 0.3, -L * 0.2); ctx.fillStyle = '#ffd84a'; ctx.fill();
    const g = rng(seed);
    for (const [px, py] of [[-0.12, -0.3], [0.12, -0.45], [-0.02, -0.62], [0.16, -0.2]]) { ctx.beginPath(); ctx.arc(px * w, py * L, L * 0.065, 0, TAU); ctx.fillStyle = '#c9182c'; ctx.fill(); ctx.lineWidth = lw * 0.6; ctx.stroke(); }
    ctx.beginPath(); ctx.moveTo(-w / 2 - 3, 0); ctx.quadraticCurveTo(0, L * 0.14, w / 2 + 3, 0); ctx.quadraticCurveTo(0, L * 0.26, -w / 2 - 3, 0);
    ctx.fillStyle = '#d9913e'; ctx.fill(); ctx.lineWidth = lw; ctx.stroke();
    for (let i = 0; i < 3; i++) { const dx = (g() - 0.5) * w * 0.6, dl = L * (0.08 + g() * 0.08); ctx.beginPath(); ctx.moveTo(dx - 5, -L * 0.05); ctx.lineTo(dx - 4, -L * 0.05 + dl); ctx.arc(dx, -L * 0.05 + dl, 5, Math.PI, 0, true); ctx.lineTo(dx + 5, -L * 0.05); ctx.fillStyle = '#ffd84a'; ctx.fill(); }
    ctx.restore();
  }
  // тянущийся сыр между двумя точками; sag — провис, w — толщина
  function cheeseString(ctx, a, b, sag = 30, w = 14) {
    const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2 + sag;
    ctx.save(); ctx.lineCap = 'round';
    for (const [lw, c] of [[w + 6, '#b8860b'], [w, '#ffd84a'], [w * 0.35, '#fff3a8']]) {
      ctx.lineWidth = lw; ctx.strokeStyle = c; ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.quadraticCurveTo(mx, my, b[0], b[1]); ctx.stroke();
    }
    ctx.restore();
  }

  // эндер-жемчуг: (x, y) — центр, r — радиус, t — время (переливы)
  function enderPearl(ctx, x, y, r = 28, t = 0) {
    ctx.save(); ctx.translate(x, y);
    const g = ctx.createRadialGradient(-r * 0.3, -r * 0.3, r * 0.1, 0, 0, r);
    g.addColorStop(0, '#7fe8d6'); g.addColorStop(0.5, '#1f8f86'); g.addColorStop(1, '#0b3d3f');
    ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fillStyle = g; ctx.fill(); ctx.lineWidth = Math.max(3, r * 0.12); ctx.strokeStyle = '#06201f'; ctx.stroke();
    ctx.save(); ctx.clip(); ctx.rotate(t * 3);
    ctx.lineWidth = r * 0.22; ctx.strokeStyle = 'rgba(20,60,60,0.6)'; ctx.beginPath(); ctx.arc(0, 0, r * 0.55, 0.3, 2.6); ctx.stroke();
    ctx.restore();
    ctx.beginPath(); ctx.arc(-r * 0.35, -r * 0.35, r * 0.22, 0, TAU); ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.fill();
    ctx.restore();
  }
  // телепорт: фиолетовые пиксели-частицы клубятся и поднимаются вокруг (x, y); life 0..1; h — высота облака
  function teleportPuff(ctx, x, y, life, h = 300, seed = 3) {
    if (life < 0 || life > 1) return;
    const r = rng(seed);
    ctx.save();
    for (let i = 0; i < 40; i++) {
      const dx = (r() - 0.5) * h * 0.7, y0 = -r() * h, up = 120 * r() + 40, sz = 8 + r() * 12;
      const px = x + dx * (1 + life * 0.4), py = y + y0 - up * life;
      ctx.globalAlpha = (1 - life) * (0.6 + 0.4 * r());
      ctx.fillStyle = '#111'; ctx.fillRect(px - sz / 2 - 2, py - sz / 2 - 2, sz + 4, sz + 4);
      ctx.fillStyle = i % 3 === 0 ? '#e9a6ff' : i % 3 === 1 ? '#b04dff' : '#7a1fd1'; ctx.fillRect(px - sz / 2, py - sz / 2, sz, sz);
    }
    ctx.restore();
  }

  // паутина: радиальная сетка с центром (x, y), радиус r; spokes — лучей; alpha; tear 0..1 — порвана
  function cobweb(ctx, x, y, r = 200, alpha = 1, spokes = 10, seed = 4, k = 1) {
    if (alpha <= 0) return;
    const g = rng(seed);
    ctx.save(); ctx.globalAlpha = alpha; ctx.lineCap = 'round'; ctx.translate(x, y); ctx.scale(k, k);
    const ang = []; for (let i = 0; i < spokes; i++) ang.push(i / spokes * TAU + (g() - 0.5) * 0.25);
    const draw = (lw, col) => {
      ctx.lineWidth = lw; ctx.strokeStyle = col;
      for (const a of ang) { ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); ctx.stroke(); }
      for (let ring = 1; ring <= 5; ring++) {
        const rr = r * ring / 5.4;
        ctx.beginPath();
        ang.forEach((a, i) => { const b = ang[(i + 1) % spokes], m = (a + b) / 2 + (i === spokes - 1 ? Math.PI : 0); const p1 = [Math.cos(a) * rr, Math.sin(a) * rr], p2 = [Math.cos(b) * rr, Math.sin(b) * rr];
          if (i === 0) ctx.moveTo(p1[0], p1[1]); ctx.quadraticCurveTo(Math.cos(m) * rr * 0.86, Math.sin(m) * rr * 0.86, p2[0], p2[1]); });
        ctx.stroke();
      }
    };
    draw(7, 'rgba(60,70,90,0.55)'); draw(3.5, '#ffffff');
    ctx.restore();
  }
  // паутина обмотала: белые нити крест-накрест поверх (x, y) — центр, w×h; t — дрожь
  function webWrap(ctx, x, y, w, h, t = 0, alpha = 1, seed = 6) {
    if (alpha <= 0) return;
    const g = rng(seed);
    ctx.save(); ctx.globalAlpha = alpha; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.ellipse(x, y, w / 2, h / 2, 0, 0, TAU); ctx.fillStyle = 'rgba(240,245,255,0.35)'; ctx.fill();
    const lines = [];
    for (let i = 0; i < 16; i++) {
      const a = g() * TAU, b = a + Math.PI * (0.6 + g() * 0.8);
      lines.push([[x + Math.cos(a) * w / 2, y + Math.sin(a) * h / 2], [x + Math.cos(b) * w / 2, y + Math.sin(b) * h / 2], (g() - 0.5) * 40]);
    }
    for (const [lw, c] of [[7, 'rgba(60,70,90,0.5)'], [3.5, '#ffffff']]) {
      ctx.lineWidth = lw; ctx.strokeStyle = c;
      for (const [a, b, sg] of lines) { ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.quadraticCurveTo((a[0] + b[0]) / 2 + sg + Math.sin(t * 20) * 3, (a[1] + b[1]) / 2 + sg, b[0], b[1]); ctx.stroke(); }
    }
    ctx.restore();
  }
  // комок паутины: (x, y), r
  function webBall(ctx, x, y, r = 40, rot = 0) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fillStyle = 'rgba(235,240,250,0.85)'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(60,70,90,0.6)'; ctx.stroke();
    ctx.lineWidth = 3; ctx.strokeStyle = '#ffffff';
    for (let i = 0; i < 6; i++) { const a = i * 1.1; ctx.beginPath(); ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r); ctx.quadraticCurveTo(0, 0, Math.cos(a + 2.4) * r, Math.sin(a + 2.4) * r); ctx.stroke(); }
    for (let i = 0; i < 5; i++) { const a = i * 1.3 + 0.4; ctx.beginPath(); ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r); ctx.lineTo(Math.cos(a) * r * 1.5, Math.sin(a) * r * 1.5); ctx.stroke(); }
    ctx.restore();
  }
  // нить паутины между точками
  function webString(ctx, a, b, sag = 20, alpha = 1) {
    ctx.save(); ctx.globalAlpha = alpha; ctx.lineCap = 'round';
    for (const [lw, c] of [[6, 'rgba(60,70,90,0.5)'], [3, '#ffffff']]) { ctx.lineWidth = lw; ctx.strokeStyle = c; ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.quadraticCurveTo((a[0] + b[0]) / 2, (a[1] + b[1]) / 2 + sag, b[0], b[1]); ctx.stroke(); }
    ctx.restore();
  }

  // кровать (майнкрафт): (x, y) — низ по центру, w — длина; dip — прогиб матраса (0..1) в точке dipX (доля 0..1);
  // pillow — подушка видна; blanket 0..1 — сколько одеяла (сдёрнуто)
  function mcBed(ctx, x, y, w = 360, dip = 0, dipX = 0.5, o = {}) {
    const h = w * 0.3, leg = w * 0.07, top = y - leg - h * 0.55;
    ctx.save(); ctx.lineJoin = 'round';
    // ножки
    ctx.fillStyle = '#111'; for (const k of [-1, 1]) ctx.fillRect(x + k * (w / 2 - leg) - leg / 2 - 3, y - leg - 3, leg + 6, leg + 6);
    ctx.fillStyle = '#9a6a35'; for (const k of [-1, 1]) ctx.fillRect(x + k * (w / 2 - leg) - leg / 2, y - leg, leg, leg);
    // каркас
    ctx.fillStyle = '#111'; ctx.fillRect(x - w / 2 - 4, y - leg - h * 0.28 - 4, w + 8, h * 0.28 + 8);
    ctx.fillStyle = '#b07a3e'; ctx.fillRect(x - w / 2, y - leg - h * 0.28, w, h * 0.28);
    ctx.fillStyle = '#8a5a2a'; ctx.fillRect(x - w / 2, y - leg - h * 0.08, w, h * 0.08);
    // матрас с прогибом
    const mtop = (u) => top + Math.max(0, dip) * h * 0.6 * Math.exp(-Math.pow((u - dipX) / 0.18, 2));
    const y0 = y - leg - h * 0.28;
    const path = () => { ctx.beginPath(); ctx.moveTo(x - w / 2, y0); for (let i = 0; i <= 24; i++) { const u = i / 24; ctx.lineTo(x - w / 2 + u * w, mtop(u)); } ctx.lineTo(x + w / 2, y0); ctx.closePath(); };
    path(); ctx.fillStyle = '#f2f2f2'; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = '#111'; ctx.stroke();
    // одеяло (красное, пиксели) — справа, отступая от подушки
    const bk = o.blanket ?? 1;
    if (bk > 0) {
      ctx.save(); path(); ctx.clip();
      const bx0 = x - w / 2 + w * 0.32, bx1 = bx0 + (x + w / 2 - bx0) * bk;
      ctx.fillStyle = '#d92a2a'; ctx.fillRect(bx0, top - 40, bx1 - bx0, y0 - top + 60);
      ctx.fillStyle = '#b01818'; for (let i = 0; i < 10; i++) ctx.fillRect(bx0 + i * (bx1 - bx0) / 10, top - 40, (bx1 - bx0) / 20, y0 - top + 60);
      ctx.fillStyle = '#ff5050'; ctx.fillRect(bx0, top - 40, bx1 - bx0, h * 0.16 + 40 + Math.max(0, dip) * 0);
      ctx.restore();
      ctx.lineWidth = 4; ctx.strokeStyle = '#111'; ctx.beginPath(); ctx.moveTo(bx0, mtop((bx0 - x + w / 2) / w)); ctx.lineTo(bx0, y0); ctx.stroke();
    }
    // подушка
    if (o.pillow !== false) {
      const px = x - w / 2 + w * 0.16, py = mtop(0.16) - h * 0.08;
      ctx.beginPath(); ctx.rect(px - w * 0.12, py - h * 0.14, w * 0.24, h * 0.24);
      ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.lineWidth = 4; ctx.stroke();
      ctx.fillStyle = '#dcdcdc'; ctx.fillRect(px - w * 0.12, py + h * 0.04, w * 0.24, h * 0.06);
    }
    // спинка у изголовья
    ctx.fillStyle = '#111'; ctx.fillRect(x - w / 2 - 6, top - h * 0.55 - 4, leg + 8, y - top + h * 0.55);
    ctx.fillStyle = '#b07a3e'; ctx.fillRect(x - w / 2 - 2, top - h * 0.55, leg, y - top + h * 0.55 - 4);
    ctx.restore();
    return top;
  }

  // снежный блок (майнкрафт): (x, y) — центр, s — сторона, rot
  function snowBlock(ctx, x, y, s = 120, rot = 0, seed = 2) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
    const h = s / 2, n = 8, u = s / n, r = rng(seed * 13 + 5);
    ctx.fillStyle = '#111'; ctx.fillRect(-h - 4, -h - 4, s + 8, s + 8);
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { const v = r(); ctx.fillStyle = v < 0.2 ? '#e3eef8' : v < 0.75 ? '#f7fbff' : '#ffffff'; ctx.fillRect(-h + i * u, -h + j * u, u + 0.6, u + 0.6); }
    ctx.fillStyle = 'rgba(150,190,230,0.25)'; ctx.fillRect(-h, h - u, s, u);
    ctx.restore();
  }
  // снежный голем: (x, y) — низ по центру, s — сторона блока; rot — наклон всего (вокруг низа);
  // head — показывать тыкву; arm — взмах рук (-1..1); hx, hy, hr — смещение и поворот тыквы
  function snowGolem(ctx, x, y, s = 120, o = {}) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(o.rot || 0);
    const arm = o.arm || 0;
    ctx.lineCap = 'round';
    for (const k of [-1, 1]) {                       // руки-палки
      const ax = k * s * 0.5, ay = o.blocks === 1 ? -s * 0.6 : -s * 1.55, a = -k * (0.5 + arm * 0.8 * (k === 1 ? 1 : 0.4));
      const ex = ax + k * Math.cos(a) * s * 0.75, ey = ay + Math.sin(-Math.abs(a)) * s * 0.45 * (k === 1 ? 1 : 1);
      ctx.lineWidth = 14; ctx.strokeStyle = '#111'; ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(ex, ey); ctx.stroke();
      ctx.lineWidth = 8; ctx.strokeStyle = '#7a4b22'; ctx.stroke();
    }
    if (o.blocks !== 1) snowBlock(ctx, 0, -s * 0.5, s, 0, 1);
    snowBlock(ctx, 0, o.blocks === 1 ? -s * 0.5 : -s * 1.5, s * 0.96, 0, 2);
    if (o.head !== false) pumpkinBlock(ctx, o.hx || 0, (o.blocks === 1 ? -s : -s * 2) + (o.hy || 0), s * 0.86, o.hr || 0, true);
    ctx.restore();
  }

  // клубок шерсти: (x, y) — центр, r — радиус, rot — поворот, col — цвет
  function yarnBall(ctx, x, y, r = 70, rot = 0, col = '#e8262e', seed = 3, dark = null) {
    if (r <= 2) return;
    dark = dark || (col === '#e8262e' ? '#a8121b' : 'rgba(0,0,0,0.3)');
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
    ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fillStyle = col; ctx.fill();
    ctx.save(); ctx.clip();
    ctx.lineCap = 'round';
    const g = rng(seed);
    for (let k = 0; k < 4; k++) {                    // мотки в разные стороны
      const a = g() * Math.PI;
      ctx.save(); ctx.rotate(a);
      for (let i = -5; i <= 5; i++) {
        ctx.beginPath(); ctx.ellipse(0, i * r * 0.17, r * 1.05, r * 0.32, 0, 0, Math.PI);
        ctx.lineWidth = Math.max(2, r * 0.05); ctx.strokeStyle = (i + k) % 2 ? dark : 'rgba(255,255,255,0.35)'; ctx.stroke();
      }
      ctx.restore();
    }
    ctx.restore();
    ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.lineWidth = Math.max(3, r * 0.07); ctx.strokeStyle = '#111'; ctx.stroke();
    ctx.restore();
  }
  // нитка через точки (сглажено)
  function yarnThread(ctx, pts, col = '#e8262e', w = 6) {
    if (!pts || pts.length < 2) return;
    ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const path = () => {
      ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i < pts.length - 1; i++) { const mx = (pts[i][0] + pts[i + 1][0]) / 2, my = (pts[i][1] + pts[i + 1][1]) / 2; ctx.quadraticCurveTo(pts[i][0], pts[i][1], mx, my); }
      ctx.lineTo(pts[pts.length - 1][0], pts[pts.length - 1][1]);
    };
    path(); ctx.lineWidth = w + 4; ctx.strokeStyle = '#111'; ctx.stroke();
    path(); ctx.lineWidth = w; ctx.strokeStyle = col; ctx.stroke();
    ctx.restore();
  }
  // обмотан ниткой: витки по эллипсу (x, y, w, h), n — число витков, k 0..1 — сколько намотано
  function yarnWrap(ctx, x, y, w, h, n = 7, k = 1, col = '#e8262e', tilt = 0.25) {
    if (k <= 0) return;
    ctx.save(); ctx.translate(x, y); ctx.lineCap = 'round';
    const m = Math.max(1, Math.round(n * k));
    for (let i = 0; i < m; i++) {
      const yy = -h / 2 + (i + 0.5) * h / n, ww = w / 2 * Math.sqrt(Math.max(0.05, 1 - Math.pow(yy / (h / 2), 2)));
      for (const [lw, c] of [[11, '#111'], [6.5, col]]) {
        ctx.lineWidth = lw; ctx.strokeStyle = c; ctx.beginPath();
        ctx.moveTo(-ww, yy - ww * tilt); ctx.quadraticCurveTo(0, yy + ww * 0.25, ww, yy + ww * tilt); ctx.stroke();
      }
    }
    ctx.restore();
  }

  // тюк сена (майнкрафт): (x, y) — центр, s — сторона, rot
  function hayBale(ctx, x, y, s = 150, rot = 0, seed = 4, sq = 1) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(1 / sq, sq);
    const h = s / 2, n = 8, u = s / n, r = rng(seed * 11 + 1);
    ctx.fillStyle = '#111'; ctx.fillRect(-h - 4, -h - 4, s + 8, s + 8);
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { const v = r(); ctx.fillStyle = v < 0.25 ? '#c9a227' : v < 0.7 ? '#e3bf3a' : '#f2d65a'; ctx.fillRect(-h + i * u, -h + j * u, u + 0.6, u + 0.6); }
    ctx.fillStyle = '#8a5a14'; ctx.fillRect(-h, -h + s * 0.2, s, s * 0.08); ctx.fillRect(-h, h - s * 0.28, s, s * 0.08);   // обвязка
    ctx.fillStyle = 'rgba(255,255,255,0.2)'; ctx.fillRect(-h, -h, s, u * 0.7);
    ctx.restore();
  }
  // соломинки разлетаются: life 0..1
  function hayBurst(ctx, x, y, life, size = 1, seed = 3) {
    if (life < 0 || life > 1) return;
    const r = rng(seed);
    ctx.save(); ctx.lineCap = 'round';
    for (let i = 0; i < 26; i++) {
      const a = -Math.PI * (0.05 + 0.9 * r()) + (r() < 0.2 ? Math.PI : 0), v = (160 + 300 * r()) * size, L = (16 + 18 * r()) * size;
      const px = x + Math.cos(a) * v * life, py = y + Math.sin(a) * v * life + 380 * life * life, q = r() * 6 + life * 8;
      ctx.globalAlpha = 1 - life;
      for (const [lw, c] of [[6, '#7a5a10'], [3.5, i % 2 ? '#f2d65a' : '#e3bf3a']]) { ctx.lineWidth = lw; ctx.strokeStyle = c; ctx.beginPath(); ctx.moveTo(px - Math.cos(q) * L / 2, py - Math.sin(q) * L / 2); ctx.lineTo(px + Math.cos(q) * L / 2, py + Math.sin(q) * L / 2); ctx.stroke(); }
    }
    ctx.restore();
  }
  // соломинки торчат на голове/теле: (x, y) — центр, w — ширина пучка
  function hayStuck(ctx, x, y, w = 140, seed = 5) {
    const r = rng(seed);
    ctx.save(); ctx.lineCap = 'round';
    for (let i = 0; i < 12; i++) {
      const px = x + (r() - 0.5) * w, py = y + (r() - 0.5) * w * 0.4, a = -Math.PI / 2 + (r() - 0.5) * 1.6, L = w * (0.2 + r() * 0.2);
      for (const [lw, c] of [[6, '#7a5a10'], [3.5, i % 2 ? '#f2d65a' : '#e3bf3a']]) { ctx.lineWidth = lw; ctx.strokeStyle = c; ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px + Math.cos(a) * L, py + Math.sin(a) * L); ctx.stroke(); }
    }
    ctx.restore();
  }

  // куст сладких ягод (майнкрафт): (x, y) — низ по центру, w — ширина, grow 0..1, shake — качание (px), berries — ягоды видны
  function berryBush(ctx, x, y, w = 300, grow = 1, shake = 0, berries = 1, seed = 4) {
    if (grow <= 0) return;
    const h = w * 0.62 * grow, r = rng(seed);
    ctx.save(); ctx.translate(x, y);
    const cells = [];
    const n = 9, u = w / n;
    for (let i = 0; i < n; i++) {
      const colH = Math.round((0.55 + 0.45 * Math.sin(Math.PI * (i + 0.5) / n)) * (h / u));
      for (let j = 0; j < colH; j++) cells.push([i, j, r()]);
    }
    for (const [i, j, v] of cells) {
      const px = -w / 2 + i * u + Math.sin(j * 0.8 + shake * 0.2) * shake * (j / 6), py = -(j + 1) * u;
      ctx.fillStyle = '#0e3a12'; ctx.fillRect(px - 2, py - 2, u + 4, u + 4);
      ctx.fillStyle = v < 0.3 ? '#1f6b1f' : v < 0.7 ? '#2a8a2a' : '#3aa33a'; ctx.fillRect(px, py, u, u);
    }
    // колючки
    ctx.strokeStyle = '#d8e8b0'; ctx.lineWidth = 3; ctx.lineCap = 'round';
    for (let k = 0; k < 18; k++) {
      const c = cells[Math.floor(r() * cells.length)]; if (!c) break;
      const px = -w / 2 + c[0] * u + u / 2 + Math.sin(c[1] * 0.8 + shake * 0.2) * shake * (c[1] / 6), py = -(c[1] + 0.5) * u, a = r() * TAU;
      ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px + Math.cos(a) * u * 0.6, py + Math.sin(a) * u * 0.6); ctx.stroke();
    }
    // ягоды
    if (berries > 0) {
      for (let k = 0; k < Math.round(9 * berries); k++) {
        const c = cells[Math.floor(r() * cells.length)]; if (!c) break;
        const px = -w / 2 + c[0] * u + u / 2 + Math.sin(c[1] * 0.8 + shake * 0.2) * shake * (c[1] / 6), py = -(c[1] + 0.5) * u;
        berry(ctx, px, py, u * 0.38);
      }
    }
    ctx.restore();
  }
  function berry(ctx, x, y, r = 14) {
    ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fillStyle = '#d6182e'; ctx.fill(); ctx.lineWidth = Math.max(2, r * 0.25); ctx.strokeStyle = '#4a0610'; ctx.stroke();
    ctx.beginPath(); ctx.arc(x - r * 0.35, y - r * 0.35, r * 0.28, 0, TAU); ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.fill();
  }
  // колючки впились: «ай!» — короткие острые штрихи вокруг точки; life 0..1
  function prickle(ctx, x, y, life, size = 1) {
    if (life < 0 || life > 1) return;
    ctx.save(); ctx.lineCap = 'round'; ctx.globalAlpha = 1 - life;
    for (let i = 0; i < 10; i++) {
      const a = i / 10 * TAU, r0 = (40 + 50 * life) * size, r1 = r0 + 30 * size;
      for (const [lw, c] of [[8, '#111'], [4, i % 2 ? '#ff3a3a' : '#ffe14d']]) { ctx.lineWidth = lw; ctx.strokeStyle = c; ctx.beginPath(); ctx.moveTo(x + Math.cos(a) * r0, y + Math.sin(a) * r0); ctx.lineTo(x + Math.cos(a) * r1, y + Math.sin(a) * r1); ctx.stroke(); }
    }
    ctx.restore();
  }

  // торт (майнкрафт): блок — сверху белая глазурь с красными точками, бока бисквит; (x, y) — низ по центру, s — ширина;
  // bites 0..1 — откушено справа; rot; sq — сплющен от низа (площадь та же)
  function mcCake(ctx, x, y, s = 200, rot = 0, bites = 0, sq = 1) {
    const h = s * 0.5, w = s * (1 - bites * 0.8), u = s / 8;
    ctx.save(); ctx.translate(x, y); ctx.scale(1 / sq, sq); ctx.translate(0, -h / 2); ctx.rotate(rot); ctx.translate(0, h / 2);
    const x0 = -s / 2;
    ctx.fillStyle = '#111'; ctx.fillRect(x0 - 4, -h - 4, w + 8, h + 8);
    // бока: бисквит с полосами
    for (let i = 0; i * u < w; i++) for (let j = 0; j < 4; j++) { ctx.fillStyle = (i + j) % 3 === 0 ? '#b8702e' : (i + j) % 3 === 1 ? '#c8823c' : '#d6914a'; ctx.fillRect(x0 + i * u, -h + h * 0.35 + j * h * 0.65 / 4, Math.min(u, w - i * u) + 0.5, h * 0.65 / 4 + 0.5); }
    ctx.fillStyle = '#e8263a'; ctx.fillRect(x0, -h + h * 0.62, w, h * 0.08);              // слой варенья
    // глазурь сверху с потёками
    ctx.fillStyle = '#ffffff'; ctx.fillRect(x0, -h, w, h * 0.35);
    for (let i = 0; i * u < w; i++) if (i % 2 === 0) ctx.fillRect(x0 + i * u, -h + h * 0.35, Math.min(u, w - i * u), h * 0.12 + (i % 4 === 0 ? h * 0.08 : 0));
    ctx.fillStyle = '#e9eef5'; ctx.fillRect(x0, -h + h * 0.28, w, h * 0.07);
    ctx.fillStyle = '#e8263a';
    for (const [a, b] of [[0.15, 0.08], [0.45, 0.16], [0.75, 0.06], [0.3, 0.24], [0.62, 0.26], [0.88, 0.18]]) if (a * s < w - u * 0.5) ctx.fillRect(x0 + a * s, -h + b * h, u * 0.55, u * 0.45);
    ctx.restore();
  }
  // лужица крема на траве: (x, y) — центр, w — ширина
  function creamPuddle(ctx, x, y, w = 160, alpha = 1, seed = 3) {
    if (alpha <= 0) return;
    const r = rng(seed);
    ctx.save(); ctx.globalAlpha = alpha;
    ctx.beginPath();
    for (let i = 0; i <= 16; i++) { const a = i / 16 * TAU, k = 0.8 + r() * 0.3; const px = x + Math.cos(a) * w / 2 * k, py = y + Math.sin(a) * w * 0.12 * k; i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }
    ctx.closePath(); ctx.fillStyle = '#fffaf2'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = '#bfa98a'; ctx.stroke();
    ctx.beginPath(); ctx.ellipse(x - w * 0.15, y - w * 0.03, w * 0.12, w * 0.025, 0, 0, TAU); ctx.fillStyle = '#ffffff'; ctx.fill();
    ctx.restore();
  }

  // поршень (майнкрафт), смотрит вверх: (x, y) — низ по центру, s — сторона блока; ext 0..1 — выдвинут; grow 0..1 — вырастает из земли
  function piston(ctx, x, y, s = 150, ext = 0, grow = 1, sticky = false) {
    if (grow <= 0) return;
    ctx.save(); ctx.beginPath(); ctx.rect(x - s, -2000, 2 * s, 2000 + y); ctx.clip();
    ctx.translate(x, y + s * (1 - grow));
    const h = s / 2, u = s / 8, L = ext * s * 0.9;
    // шток
    if (L > 2) {
      ctx.fillStyle = '#111'; ctx.fillRect(-u * 0.9, -s - L - 2, u * 1.8, L + 4);
      ctx.fillStyle = '#c9a26a'; ctx.fillRect(-u * 0.6, -s - L, u * 1.2, L);
      ctx.fillStyle = '#a88452'; ctx.fillRect(-u * 0.6, -s - L, u * 0.35, L);
    }
    // корпус: камень
    ctx.fillStyle = '#111'; ctx.fillRect(-h - 4, -s - 4, s + 8, s + 8);
    for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) { ctx.fillStyle = (i * 7 + j * 3) % 5 === 0 ? '#6e6e6e' : (i + j) % 3 === 0 ? '#8a8a8a' : '#7c7c7c'; ctx.fillRect(-h + i * u, -s + j * u, u + 0.5, u + 0.5); }
    // доски сверху корпуса (если голова уехала — видно тёмное гнездо)
    ctx.fillStyle = ext > 0.05 ? '#3a3a3a' : '#c9a26a'; ctx.fillRect(-h, -s, s, u * 2);
    // голова-плита
    const hy = -s - L - u * 2;
    ctx.fillStyle = '#111'; ctx.fillRect(-h - 4, hy - 4, s + 8, u * 2 + 8);
    for (let i = 0; i < 8; i++) { ctx.fillStyle = i % 2 ? '#c9a26a' : '#b89058'; ctx.fillRect(-h + i * u, hy, u + 0.5, u * 2); }
    ctx.fillStyle = sticky ? '#7fd34a' : '#a88452'; ctx.fillRect(-h, hy, s, u * 0.5);
    ctx.restore();
  }

  // деревянный ящик из досок (дуб): (x, y) — точка опоры, px — её сдвиг от середины низа (−s/2 — левый нижний угол),
  // rot — наклон вокруг точки опоры
  function woodCrate(ctx, x, y, s = 300, rot = 0, px = 0) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.translate(-px, 0);
    const h = s / 2, n = 4, u = s / n;
    ctx.fillStyle = '#111'; ctx.fillRect(-h - 5, -s - 5, s + 10, s + 10);
    for (let j = 0; j < n; j++) {
      ctx.fillStyle = j % 2 ? '#b8894a' : '#c99a58'; ctx.fillRect(-h, -s + j * u, s, u);
      ctx.fillStyle = 'rgba(90,55,20,0.45)'; ctx.fillRect(-h, -s + j * u + u - 5, s, 5);
      for (let i = 0; i < 6; i++) { ctx.fillStyle = (i + j) % 3 ? 'rgba(120,80,35,0.35)' : 'rgba(255,230,180,0.25)'; ctx.fillRect(-h + ((i * 37 + j * 23) % 10) / 10 * s * 0.9, -s + j * u + u * 0.35, s * 0.12, u * 0.14); }
    }
    // рамка из тёмных брусьев и диагональ
    ctx.fillStyle = '#6b4520';
    const b = s * 0.11;
    ctx.fillRect(-h, -s, s, b); ctx.fillRect(-h, -b, s, b); ctx.fillRect(-h, -s, b, s); ctx.fillRect(h - b, -s, b, s);
    ctx.save(); ctx.beginPath(); ctx.rect(-h + b, -s + b, s - 2 * b, s - 2 * b); ctx.clip();
    ctx.translate(0, -h); ctx.rotate(-Math.PI / 4); ctx.fillRect(-s, -b / 2, 2 * s, b); ctx.restore();
    ctx.fillStyle = '#3a2410';
    for (const [ax, ay] of [[-h + b / 2, -s + b / 2], [h - b / 2, -s + b / 2], [-h + b / 2, -b / 2], [h - b / 2, -b / 2]]) ctx.fillRect(ax - 5, ay - 5, 10, 10);
    ctx.restore();
  }
  // палка из майнкрафта: от (x0, y0) до (x1, y1)
  function mcStick(ctx, x0, y0, x1, y1, w = 16) {
    const L = Math.hypot(x1 - x0, y1 - y0), a = Math.atan2(y1 - y0, x1 - x0);
    ctx.save(); ctx.translate(x0, y0); ctx.rotate(a);
    ctx.fillStyle = '#111'; ctx.fillRect(-4, -w / 2 - 4, L + 8, w + 8);
    ctx.fillStyle = '#8a5a2b'; ctx.fillRect(0, -w / 2, L, w);
    ctx.fillStyle = '#6b4520'; ctx.fillRect(0, w / 6, L, w / 3);
    for (let i = 0; i < L; i += w * 1.6) { ctx.fillStyle = '#a8763c'; ctx.fillRect(i, -w / 2, w * 0.7, w / 3); }
    ctx.restore();
  }
  // печенька из майнкрафта: bites — сколько откушено (0..3)
  function mcCookie(ctx, x, y, r = 30, rot = 0, bites = 0) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
    if (bites > 0) {
      ctx.beginPath(); ctx.rect(-r * 2, -r * 2, r * 4, r * 4);
      for (let i = 0; i < Math.min(3, bites); i++) { const a = -0.6 + i * 0.75; ctx.moveTo(Math.cos(a) * r * 1.05 + r * 0.42, Math.sin(a) * r * 1.05); ctx.arc(Math.cos(a) * r * 1.05, Math.sin(a) * r * 1.05, r * 0.42, 0, TAU); }
      ctx.clip('evenodd');
    }
    const u = r / 4;
    ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc(0, 0, r + 4, 0, TAU); ctx.fill();
    ctx.fillStyle = '#d9913c'; ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fill();
    ctx.fillStyle = '#eaa955'; ctx.fillRect(-r * 0.6, -r * 0.7, u * 2, u);
    ctx.fillStyle = '#5a2e12';
    for (const [cx, cy] of [[-0.5, -0.2], [0.25, -0.45], [0.4, 0.3], [-0.2, 0.45], [0.05, 0.02]]) ctx.fillRect(cx * r - u / 2, cy * r - u / 2, u, u);
    ctx.restore();
  }
  // доска (дуб): центр (x, y), длина L
  function plank(ctx, x, y, L = 150, rot = 0) {
    const t = L * 0.22;
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
    ctx.fillStyle = '#111'; ctx.fillRect(-L / 2 - 4, -t / 2 - 4, L + 8, t + 8);
    ctx.fillStyle = '#c99a58'; ctx.fillRect(-L / 2, -t / 2, L, t);
    ctx.fillStyle = '#a87a3e'; ctx.fillRect(-L / 2, t / 6, L, t / 3);
    ctx.fillStyle = '#3a2410'; ctx.fillRect(-L / 2 + 6, -5, 9, 9); ctx.fillRect(L / 2 - 15, -5, 9, 9);
    ctx.restore();
  }

  // пылесос-баллон на колёсах (блочный, красный): (x, y) — середина низа; on — дрожит и горит лампочка;
  // inflate — мешок раздувается (1..1.4)
  function vacuum(ctx, x, y, s = 200, on = 0, t = 0, inflate = 1) {
    const r = rng(7);
    ctx.save(); ctx.translate(x + (on ? Math.sin(t * 90) * 2.5 : 0), y);
    const w = s * 1.25, h = s * 0.62, u = s / 10;
    // колёса
    for (const wx of [-w * 0.32, w * 0.32]) { ctx.fillStyle = '#111'; ctx.fillRect(wx - u * 1.3, -u * 2.2, u * 2.6, u * 2.2); ctx.fillStyle = '#555'; ctx.fillRect(wx - u * 0.5, -u * 1.5, u, u); }
    ctx.translate(0, -u * 1.4);
    ctx.scale(inflate, inflate * (1 + (inflate - 1) * 0.4));
    // корпус
    ctx.fillStyle = '#111'; ctx.fillRect(-w / 2 - 5, -h - 5, w + 10, h + 10);
    for (let i = 0; i < 12; i++) for (let j = 0; j < 6; j++) { const v = r(); ctx.fillStyle = j < 1 ? '#ff5a4a' : v < 0.2 ? '#c41d1d' : v < 0.75 ? '#e8262e' : '#f04040'; ctx.fillRect(-w / 2 + i * w / 12, -h + j * h / 6, w / 12 + 0.6, h / 6 + 0.6); }
    // крышка-мешок сверху
    ctx.fillStyle = '#111'; ctx.fillRect(-w * 0.36 - 4, -h - u * 2.4 - 4, w * 0.72 + 8, u * 2.4 + 8);
    ctx.fillStyle = '#9a9a9a'; ctx.fillRect(-w * 0.36, -h - u * 2.4, w * 0.72, u * 2.4);
    ctx.fillStyle = '#c4c4c4'; ctx.fillRect(-w * 0.36, -h - u * 2.4, w * 0.72, u * 0.6);
    // кнопка и лампочка
    ctx.fillStyle = '#111'; ctx.fillRect(w * 0.18 - 4, -h - u * 3.4 - 4, u * 2 + 8, u + 8);
    ctx.fillStyle = '#f2f2f2'; ctx.fillRect(w * 0.18, -h - u * 3.4, u * 2, u);
    ctx.fillStyle = on ? '#3cff3c' : '#2a5a2a'; ctx.fillRect(-w * 0.3, -h * 0.55, u, u);
    // патрубок слева
    ctx.fillStyle = '#111'; ctx.fillRect(-w / 2 - u * 1.4 - 4, -h * 0.62 - 4, u * 1.4 + 8, u * 1.8 + 8);
    ctx.fillStyle = '#7a7a7a'; ctx.fillRect(-w / 2 - u * 1.4, -h * 0.62, u * 1.4, u * 1.8);
    ctx.restore();
  }
  // гофрированный шланг по точкам
  function vacHose(ctx, pts, w = 26) {
    if (!pts || pts.length < 2) return;
    ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const path = () => {
      ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i < pts.length - 1; i++) { const mx = (pts[i][0] + pts[i + 1][0]) / 2, my = (pts[i][1] + pts[i + 1][1]) / 2; ctx.quadraticCurveTo(pts[i][0], pts[i][1], mx, my); }
      ctx.lineTo(pts[pts.length - 1][0], pts[pts.length - 1][1]);
    };
    path(); ctx.lineWidth = w + 8; ctx.strokeStyle = '#111'; ctx.stroke();
    path(); ctx.lineWidth = w; ctx.strokeStyle = '#6e6e6e'; ctx.stroke();
    path(); ctx.lineWidth = w * 0.7; ctx.setLineDash([5, 9]); ctx.strokeStyle = '#4a4a4a'; ctx.stroke();
    ctx.restore();
  }
  // насадка: (x, y) — середина раструба, rot — куда смотрит раструб; возвращает точку, где крепится шланг
  function vacNozzle(ctx, x, y, rot = 0, s = 1) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
    ctx.fillStyle = '#111'; ctx.fillRect(-150, -13, 130, 26);
    ctx.fillStyle = '#b8b8b8'; ctx.fillRect(-148, -9, 126, 18);
    ctx.fillStyle = '#dcdcdc'; ctx.fillRect(-148, -9, 126, 5);
    ctx.fillStyle = '#111'; ctx.beginPath(); ctx.moveTo(-26, -18); ctx.lineTo(4, -40); ctx.lineTo(4, 40); ctx.lineTo(-26, 18); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#e8262e'; ctx.beginPath(); ctx.moveTo(-22, -13); ctx.lineTo(0, -34); ctx.lineTo(0, 34); ctx.lineTo(-22, 13); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#2a2a2a'; ctx.fillRect(-2, -36, 8, 72);
    ctx.restore();
    return [x - Math.cos(rot) * 150 * s, y - Math.sin(rot) * 150 * s];
  }
  // поток воздуха у раструба: suck — струйки летят внутрь, иначе — наружу; t — секунды
  function airLines(ctx, x, y, rot, t, suck = true, len = 380, seed = 3) {
    const r = rng(seed);
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.lineCap = 'round';
    for (let i = 0; i < 16; i++) {
      const sp = 1.6 + r() * 1.2, ph = r(), a = (r() - 0.5) * 1.1, L = 30 + r() * 40;
      let u = (t * sp + ph) % 1; if (suck) u = 1 - u;
      const d = 30 + u * len, k = suck ? 1 - u * 0.65 : 1 - u * 0.2;
      const px = Math.cos(a * k) * d, py = Math.sin(a * k) * d * 0.9;
      ctx.globalAlpha = Math.min(1, (1 - u) * 3) * Math.min(1, u * 6) * 0.9;
      for (const [lw, c] of [[7, 'rgba(90,120,160,0.5)'], [3.5, '#ffffff']]) {
        ctx.lineWidth = lw; ctx.strokeStyle = c; ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px + Math.cos(a * k) * L, py + Math.sin(a * k) * L * 0.9); ctx.stroke();
      }
    }
    ctx.restore();
  }

  // скалка: центр (x, y), длина L, радиус r, rot — наклон, roll — поворот вокруг оси (прокатка)
  function rollingPin(ctx, x, y, L = 280, r = 26, rot = 0, roll = 0) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
    const b = L * 0.34;
    // ручки
    for (const sgn of [-1, 1]) {
      ctx.fillStyle = '#111'; ctx.fillRect(sgn > 0 ? b - 4 : -b - L * 0.16 - 4, -r * 0.45 - 4, L * 0.16 + 8, r * 0.9 + 8);
      ctx.fillStyle = '#b07a3e'; ctx.fillRect(sgn > 0 ? b : -b - L * 0.16, -r * 0.45, L * 0.16, r * 0.9);
      ctx.fillStyle = '#8a5a2b'; ctx.fillRect(sgn > 0 ? b : -b - L * 0.16, r * 0.15, L * 0.16, r * 0.3);
    }
    // вал
    ctx.fillStyle = '#111'; ctx.fillRect(-b - 5, -r - 5, 2 * b + 10, 2 * r + 10);
    ctx.fillStyle = '#e2b273'; ctx.fillRect(-b, -r, 2 * b, 2 * r);
    ctx.save(); ctx.beginPath(); ctx.rect(-b, -r, 2 * b, 2 * r); ctx.clip();
    for (let i = -3; i < 6; i++) {                       // волокна бегут при прокатке
      const yy = -r + (((i * 0.45 + roll / (Math.PI * 2)) % 1 + 1) % 1) * 2 * r;
      ctx.fillStyle = 'rgba(150,95,40,0.45)'; ctx.fillRect(-b, yy, 2 * b, 4);
    }
    ctx.fillStyle = 'rgba(255,240,210,0.6)'; ctx.fillRect(-b, -r, 2 * b, r * 0.35);
    ctx.fillStyle = 'rgba(120,70,25,0.35)'; ctx.fillRect(-b, r * 0.55, 2 * b, r * 0.45);
    ctx.restore();
    ctx.restore();
  }
  // тесто: (x, y) — середина низа, r — радиус, sx/sy — сплющивание; seed — где мука
  function dough(ctx, x, y, r = 100, sx = 1, sy = 1, seed = 3) {
    const rr = rng(seed), w = r * sx, h = r * sy;
    ctx.save(); ctx.translate(x, y - h);
    ctx.beginPath();
    for (let i = 0; i <= 24; i++) {
      const a = i / 24 * TAU, k = 1 + Math.sin(a * 3 + seed) * 0.04 + Math.sin(a * 5 + seed * 2) * 0.03;
      const px = Math.cos(a) * w * k, py = Math.max(-h * 1.05, Math.min(h, Math.sin(a) * h * k));
      i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
    }
    ctx.closePath();
    ctx.lineWidth = 7; ctx.strokeStyle = '#111'; ctx.stroke();
    ctx.fillStyle = '#f4dfae'; ctx.fill();
    ctx.save(); ctx.clip();
    ctx.fillStyle = '#e6c88a'; ctx.beginPath(); ctx.ellipse(w * 0.15, h * 0.55, w * 0.95, h * 0.5, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    for (let i = 0; i < 14; i++) { const px = (rr() * 2 - 1) * w * 0.8, py = (rr() * 2 - 1) * h * 0.8; ctx.beginPath(); ctx.arc(px, py, 3 + rr() * 4, 0, TAU); ctx.fill(); }
    ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.beginPath(); ctx.ellipse(-w * 0.35, -h * 0.45, w * 0.25, h * 0.18, -0.4, 0, TAU); ctx.fill();
    ctx.restore();
    ctx.restore();
  }
  // пласт теста накинут сверху: (x, y) — макушка, w — ширина, h — сколько свисает, t — время (колышется)
  function doughSheet(ctx, x, y, w = 300, h = 360, t = 0) {
    ctx.save(); ctx.translate(x, y);
    ctx.beginPath();
    ctx.moveTo(-w * 0.5, h * 0.75);
    ctx.quadraticCurveTo(-w * 0.55, -h * 0.12, 0, -h * 0.12);
    ctx.quadraticCurveTo(w * 0.55, -h * 0.12, w * 0.5, h * 0.75);
    const n = 10;
    for (let i = n; i >= 0; i--) { const px = -w * 0.5 + w * i / n, py = h * (0.8 + 0.035 * Math.sin(i * 1.3 + t * 6) + (i % 2 ? 0.03 : 0)); ctx.lineTo(px, py); }
    ctx.closePath();
    ctx.lineWidth = 7; ctx.strokeStyle = '#111'; ctx.stroke();
    ctx.fillStyle = '#f4dfae'; ctx.fill();
    ctx.save(); ctx.clip();
    ctx.fillStyle = '#e6c88a'; for (let i = 0; i < 4; i++) ctx.fillRect(-w * 0.4 + i * w * 0.25, h * 0.1, 8, h * 0.6);
    ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.beginPath(); ctx.ellipse(-w * 0.15, 0, w * 0.2, h * 0.06, 0, 0, TAU); ctx.fill();
    ctx.restore();
    ctx.restore();
  }

  // огнетушитель: (x, y) — середина низа (стоя), rot — наклон корпуса вокруг середины, aim — куда смотрит раструб;
  // возвращает [x, y] конца раструба
  function extinguisher(ctx, x, y, s = 170, rot = 0, aim = Math.PI, lever = 0, noz = null) {
    const w = s * 0.42, h = s * 0.82;
    const cx = x + Math.sin(rot) * s * 0.5, cy = y - Math.cos(rot) * s * 0.5;
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(rot);
    const top = -s * 0.5;
    // корпус
    ctx.fillStyle = '#111'; ctx.beginPath(); ctx.roundRect(-w / 2 - 5, top + s * 0.18 - 5, w + 10, h + 10, w * 0.35); ctx.fill();
    ctx.fillStyle = '#e8262e'; ctx.beginPath(); ctx.roundRect(-w / 2, top + s * 0.18, w, h, w * 0.32); ctx.fill();
    ctx.fillStyle = '#ff6a5a'; ctx.fillRect(-w * 0.32, top + s * 0.26, w * 0.14, h * 0.75);
    ctx.fillStyle = '#b81a1a'; ctx.fillRect(w * 0.18, top + s * 0.26, w * 0.12, h * 0.8);
    ctx.fillStyle = '#f2f2f2'; ctx.fillRect(-w / 2, top + s * 0.5, w, s * 0.16);
    ctx.fillStyle = '#111'; ctx.fillRect(-w * 0.25, top + s * 0.55, w * 0.5, s * 0.06);
    // вентиль и рычаг
    ctx.fillStyle = '#111'; ctx.fillRect(-w * 0.22 - 4, top + s * 0.06 - 4, w * 0.44 + 8, s * 0.13 + 8);
    ctx.fillStyle = '#9a9a9a'; ctx.fillRect(-w * 0.22, top + s * 0.06, w * 0.44, s * 0.13);
    ctx.save(); ctx.translate(-w * 0.1, top + s * 0.06); ctx.rotate(-0.35 + lever * 0.3);
    ctx.fillStyle = '#111'; ctx.fillRect(-4, -s * 0.07 - 4, s * 0.36 + 8, s * 0.07 + 8);
    ctx.fillStyle = '#c4c4c4'; ctx.fillRect(0, -s * 0.07, s * 0.36, s * 0.07);
    ctx.restore();
    ctx.restore();
    // шланг и раструб (в мировых координатах)
    const vl = top + s * 0.1, vx = cx - vl * Math.sin(rot), vy = cy + vl * Math.cos(rot);
    const nx = noz ? noz[0] : vx + Math.cos(aim) * s * 0.55, ny = noz ? noz[1] : vy + Math.sin(aim) * s * 0.55;
    ctx.save(); ctx.lineCap = 'round';
    const mx = (vx + nx) / 2, my = Math.max(vy, ny) + s * 0.25;
    for (const [lw, c] of [[s * 0.11, '#111'], [s * 0.065, '#2e2e2e']]) { ctx.lineWidth = lw; ctx.strokeStyle = c; ctx.beginPath(); ctx.moveTo(vx, vy); ctx.quadraticCurveTo(mx, my, nx, ny); ctx.stroke(); }
    ctx.translate(nx, ny); ctx.rotate(aim);
    ctx.fillStyle = '#111'; ctx.beginPath(); ctx.moveTo(-s * 0.04, -s * 0.05); ctx.lineTo(s * 0.16, -s * 0.09); ctx.lineTo(s * 0.16, s * 0.09); ctx.lineTo(-s * 0.04, s * 0.05); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#3a3a3a'; ctx.fillRect(s * 0.02, -s * 0.05, s * 0.1, s * 0.1);
    ctx.restore();
    return [nx + Math.cos(aim) * s * 0.16, ny + Math.sin(aim) * s * 0.16];
  }
  // гора пены: (x, y) — середина низа, w × h
  function foamPile(ctx, x, y, w = 300, h = 300, t = 0, seed = 3) {
    if (w < 4 || h < 4) return;
    const r = rng(seed), blobs = [];
    for (let i = 0; i < 26; i++) {
      const u = r(), v = r(), a = (u - 0.5) * Math.PI * 0.95;
      const rr = (0.18 + 0.12 * r()) * Math.min(w, h * 1.4);
      const px = Math.sin(a) * w * 0.42 * Math.sqrt(v), py = -Math.cos(a) * h * (0.35 + 0.4 * v) * 0.95;
      blobs.push([x + px + Math.sin(t * 3 + i) * 3, Math.min(y - rr * 0.6, y + py), rr * (1 + 0.04 * Math.sin(t * 5 + i * 1.7))]);
    }
    blobs.sort((a, b) => a[1] - b[1]);
    ctx.save();
    for (const [bx, by, br] of blobs) { ctx.beginPath(); ctx.arc(bx, by, br + 5, 0, TAU); ctx.fillStyle = '#5a6a78'; ctx.fill(); }
    for (const [bx, by, br] of blobs) { ctx.beginPath(); ctx.arc(bx, by, br, 0, TAU); ctx.fillStyle = '#ffffff'; ctx.fill(); }
    for (const [bx, by, br] of blobs) { ctx.beginPath(); ctx.arc(bx + br * 0.25, by + br * 0.3, br * 0.55, 0, TAU); ctx.fillStyle = '#e6eef6'; ctx.fill(); }
    for (const [bx, by, br] of blobs) { ctx.beginPath(); ctx.arc(bx - br * 0.35, by - br * 0.35, br * 0.18, 0, TAU); ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(120,150,190,0.5)'; ctx.stroke(); }
    ctx.restore();
  }
  // струя пены из (x0, y0) в (x1, y1), t — секунды
  function foamJet(ctx, x0, y0, x1, y1, t, arc = 40, seed = 5, col = '#ffffff', line = '#7a8a98') {
    const r = rng(seed);
    for (let i = 0; i < 22; i++) {
      const sp = 2.2 + r(), ph = r(), u = (t * sp + ph) % 1, rr = 14 + 20 * u + r() * 8;
      const px = E.lerp(x0, x1, u) + (r() - 0.5) * 30 * u, py = E.lerp(y0, y1, u) - Math.sin(Math.PI * u) * arc + (r() - 0.5) * 30 * u;
      puff(ctx, px, py, rr, 0.95, col, line);
    }
  }

  // свинья из майнкрафта: (x, y) — середина низа, s — длина тела, face — куда смотрит, phase — шаг ног (рад),
  // chew — жуёт (0..1), sq — сплющивание при прыжке/посадке
  function mcPig(ctx, x, y, s = 200, face = 1, phase = 0, chew = 0, sq = 1) {
    const pk = ['#f2a3a3', '#ec9393', '#f6b3b3', '#e58787'];
    const box = (bx, by, bw, bh, seed, n = 4) => {
      ctx.fillStyle = '#111'; ctx.fillRect(bx - 4, by - 4, bw + 8, bh + 8);
      const r = rng(seed), cw = bw / n, ch = bh / Math.max(1, Math.round(n * bh / bw));
      for (let i = 0; i < n; i++) for (let j = 0; j * ch < bh - 0.5; j++) { ctx.fillStyle = pk[Math.floor(r() * 4)]; ctx.fillRect(bx + i * cw, by + j * ch, cw + 0.6, Math.min(ch, bh - j * ch) + 0.6); }
    };
    ctx.save(); ctx.translate(x, y); ctx.scale(face * (1 / Math.sqrt(sq)), sq);
    const L = s * 0.28, bw = s, bh = s * 0.5, top = -L - bh;
    // ноги: дальние темнее
    const legs = [[-bw * 0.36, 0], [bw * 0.28, Math.PI], [-bw * 0.24, Math.PI], [bw * 0.4, 0]];
    legs.forEach(([lx, ph], i) => {
      const sw = Math.sin(phase + ph) * 0.45;
      ctx.save(); ctx.translate(lx, -L); ctx.rotate(sw);
      ctx.fillStyle = '#111'; ctx.fillRect(-s * 0.08 - 4, -4, s * 0.16 + 8, L + 8);
      ctx.fillStyle = i < 2 ? '#d47a7a' : '#ec9393'; ctx.fillRect(-s * 0.08, 0, s * 0.16, L);
      ctx.fillStyle = '#7a4a3a'; ctx.fillRect(-s * 0.08, L - s * 0.05, s * 0.16, s * 0.05);
      ctx.restore();
    });
    box(-bw / 2, top, bw, bh, 11, 6);
    // хвостик
    ctx.fillStyle = '#111'; ctx.fillRect(-bw / 2 - s * 0.06 - 3, top + bh * 0.2 - 3, s * 0.06 + 6, s * 0.06 + 6);
    ctx.fillStyle = '#e58787'; ctx.fillRect(-bw / 2 - s * 0.06, top + bh * 0.2, s * 0.06, s * 0.06);
    // голова
    const hs = s * 0.5, hx = bw / 2 - hs * 0.35, hy = top - hs * 0.25;
    box(hx, hy, hs, hs, 23, 4);
    // пятачок
    const nw = hs * 0.5, nh = hs * 0.3, nx = hx + hs - nw * 0.25, ny = hy + hs * 0.5;
    ctx.fillStyle = '#111'; ctx.fillRect(nx - 4, ny - 4, nw + 8, nh + 8);
    ctx.fillStyle = '#f7b7b7'; ctx.fillRect(nx, ny, nw, nh);
    ctx.fillStyle = '#8a3f3f'; ctx.fillRect(nx + nw * 0.12, ny + nh * 0.3, nw * 0.22, nh * 0.45); ctx.fillRect(nx + nw * 0.62, ny + nh * 0.3, nw * 0.22, nh * 0.45);
    // рот жуёт
    if (chew > 0) { ctx.fillStyle = '#5a1f1f'; ctx.fillRect(nx - hs * 0.05, ny + nh + 4, nw * 0.8, hs * 0.08 * (0.4 + 0.6 * Math.abs(Math.sin(chew * 20)))); }
    // глаза
    for (const ex of [hx + hs * 0.18, hx + hs * 0.62]) {
      ctx.fillStyle = '#ffffff'; ctx.fillRect(ex, hy + hs * 0.22, hs * 0.18, hs * 0.14);
      ctx.fillStyle = '#111'; ctx.fillRect(ex + hs * 0.09, hy + hs * 0.22, hs * 0.09, hs * 0.14);
    }
    ctx.restore();
    return { snout: [x + face * (nx + nw) * (1 / Math.sqrt(sq)), y + (ny + nh / 2) * sq], top: y + top * sq };
  }
  // морковка: (x, y) — где привязана (верх), s — длина, rot — наклон, bites — сколько откушено (0..1)
  function mcCarrot(ctx, x, y, s = 70, rot = 0, bites = 0) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
    const L = s * (1 - bites * 0.8), w = s * 0.32;
    // ботва
    ctx.fillStyle = '#111'; ctx.fillRect(-w * 0.45 - 3, -s * 0.28 - 3, w * 0.9 + 6, s * 0.3 + 6);
    ctx.fillStyle = '#3cb043'; ctx.fillRect(-w * 0.45, -s * 0.28, w * 0.3, s * 0.3); ctx.fillStyle = '#2e8b35'; ctx.fillRect(-w * 0.1, -s * 0.24, w * 0.25, s * 0.26); ctx.fillStyle = '#4ccf55'; ctx.fillRect(w * 0.18, -s * 0.28, w * 0.27, s * 0.3);
    if (L > 4) {
      ctx.fillStyle = '#111'; ctx.beginPath(); ctx.moveTo(-w / 2 - 4, -2); ctx.lineTo(w / 2 + 4, -2); ctx.lineTo(w * 0.1, L + 6); ctx.lineTo(-w * 0.1, L + 6); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#ff8c1a'; ctx.beginPath(); ctx.moveTo(-w / 2, 0); ctx.lineTo(w / 2, 0); ctx.lineTo(w * 0.08, L); ctx.lineTo(-w * 0.08, L); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#d96a00'; for (let i = 1; i < 4; i++) ctx.fillRect(-w * 0.3 + i * 3, L * i / 4, w * 0.25, 3);
    }
    ctx.restore();
  }

  // желе (голубая малина): (x, y) — середина низа, w × h, t — секунды, wob — сила дрожания (0..1),
  // alpha — прозрачность (внутри может сидеть персонаж)
  function jelly(ctx, x, y, w = 300, h = 240, t = 0, wob = 0, alpha = 0.6) {
    const k = Math.sin(t * 19) * wob, sk = Math.sin(t * 15 + 1) * wob;
    ctx.save(); ctx.translate(x, y); ctx.transform(1 + 0.14 * k, 0, -0.22 * sk, 1 - 0.14 * k, 0, 0);
    const r = Math.min(w, h) * 0.22;
    const shape = () => { ctx.beginPath(); ctx.roundRect(-w / 2, -h, w, h, [r, r, r * 0.4, r * 0.4]); };
    ctx.save(); ctx.globalAlpha = alpha;
    shape(); ctx.fillStyle = '#2fc8ff'; ctx.fill();
    ctx.restore();
    ctx.save(); shape(); ctx.clip();
    ctx.globalAlpha = alpha * 0.9;
    ctx.fillStyle = '#1a8fd6'; ctx.fillRect(-w / 2, -h * 0.35, w, h * 0.35);
    ctx.globalAlpha = 0.85;
    ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.roundRect(-w * 0.38, -h * 0.9, w * 0.14, h * 0.42, 8); ctx.fill();
    ctx.beginPath(); ctx.roundRect(-w * 0.18, -h * 0.9, w * 0.06, h * 0.18, 4); ctx.fill();
    ctx.globalAlpha = 0.5;
    for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.arc(-w * 0.3 + i * w * 0.13, -h * (0.2 + 0.11 * ((i * 7) % 5)), 4 + (i % 3) * 3, 0, TAU); ctx.fillStyle = '#e8fbff'; ctx.fill(); }
    ctx.restore();
    shape(); ctx.lineWidth = 7; ctx.strokeStyle = '#0b4f7a'; ctx.stroke();
    ctx.restore();
  }
  // лужица желе: (x, y) — середина низа
  function jellyPuddle(ctx, x, y, w = 300, t = 0, wob = 0) {
    const k = 1 + Math.sin(t * 19) * wob * 0.2;
    ctx.save(); ctx.translate(x, y);
    ctx.beginPath(); ctx.ellipse(0, -w * 0.06 * k, w / 2 / k, w * 0.09 * k, 0, Math.PI, TAU); ctx.lineTo(w / 2 / k, 0); ctx.closePath();
    ctx.globalAlpha = 0.75; ctx.fillStyle = '#2fc8ff'; ctx.fill();
    ctx.globalAlpha = 1; ctx.lineWidth = 6; ctx.strokeStyle = '#0b4f7a'; ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.beginPath(); ctx.ellipse(-w * 0.18, -w * 0.09 * k, w * 0.08, w * 0.02, 0, 0, TAU); ctx.fill();
    ctx.restore();
  }

  // зонтик: (x, y) — где держат (низ ручки), s — длина, rot — наклон (0 — купол вверх, π — вверх ногами),
  // open — раскрыт (0..1), fill — сколько воды в перевёрнутом куполе (0..1), cols — цвета клиньев
  function umbrella(ctx, x, y, s = 300, rot = 0, open = 1, fill = 0, cols = ['#ffe23a', '#ff8c1a']) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
    const top = -s, R = s * 0.55 * (0.25 + 0.75 * open), H = s * 0.32 * (0.6 + 0.4 * open);
    // ручка-крючок
    ctx.lineCap = 'round';
    for (const [lw, c] of [[s * 0.05, '#111'], [s * 0.028, '#6b4520']]) {
      ctx.lineWidth = lw; ctx.strokeStyle = c; ctx.beginPath(); ctx.moveTo(0, top + H * 0.2); ctx.lineTo(0, -s * 0.06);
      ctx.arc(-s * 0.06, -s * 0.06, s * 0.06, 0, Math.PI); ctx.stroke();
    }
    // купол
    const n = 6, edge = (i) => [-R + (2 * R) * i / n, top + H];
    ctx.beginPath(); ctx.moveTo(-R, top + H);
    ctx.bezierCurveTo(-R, top - H * 0.15, R, top - H * 0.15, R, top + H);
    for (let i = n; i > 0; i--) { const [ax] = edge(i), [bx] = edge(i - 1); ctx.quadraticCurveTo((ax + bx) / 2, top + H * 0.78, bx, top + H); }
    ctx.closePath();
    ctx.lineWidth = 7; ctx.strokeStyle = '#111'; ctx.stroke();
    ctx.save(); ctx.clip();
    for (let i = 0; i < n; i++) { ctx.fillStyle = cols[i % cols.length]; ctx.beginPath(); ctx.moveTo(0, top - H * 0.3); ctx.lineTo(edge(i)[0], top + H * 1.2); ctx.lineTo(edge(i + 1)[0], top + H * 1.2); ctx.closePath(); ctx.fill(); }
    ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.beginPath(); ctx.ellipse(-R * 0.35, top + H * 0.2, R * 0.22, H * 0.3, -0.5, 0, TAU); ctx.fill();
    // вода в перевёрнутом куполе
    if (fill > 0) { const wy = top + H * 1.1 - fill * H * 1.25; ctx.fillStyle = 'rgba(88,184,239,0.9)'; ctx.fillRect(-R, top - H, 2 * R, wy - top + H); ctx.fillStyle = '#9ee7ff'; ctx.fillRect(-R, wy, 2 * R, 5); }
    ctx.restore();
    ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(0,0,0,0.35)';
    for (let i = 1; i < n; i++) { ctx.beginPath(); ctx.moveTo(0, top - H * 0.08); ctx.lineTo(edge(i)[0], top + H * 0.92); ctx.stroke(); }
    // наконечник
    ctx.fillStyle = '#111'; ctx.fillRect(-s * 0.02, top - H * 0.32, s * 0.04, H * 0.3);
    ctx.restore();
  }

  // санки: (x, y) — середина низа полозьев, w — длина, rot — наклон, face — куда загнуты полозья (вперёд)
  function sled(ctx, x, y, w = 260, rot = 0, face = 1) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(face, 1);
    const h = w * 0.26, t = w * 0.05;
    // полозья с загибом вперёд
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    for (const [lw, c] of [[t + 8, '#111'], [t, '#9aa4ad']]) {
      ctx.lineWidth = lw; ctx.strokeStyle = c;
      ctx.beginPath(); ctx.moveTo(-w / 2, -t / 2); ctx.lineTo(w * 0.38, -t / 2);
      ctx.quadraticCurveTo(w * 0.55, -t / 2, w * 0.52, -h * 0.7); ctx.quadraticCurveTo(w * 0.5, -h * 1.05, w * 0.4, -h * 0.85); ctx.stroke();
    }
    // стойки
    ctx.fillStyle = '#111';
    for (const sx of [-w * 0.36, -w * 0.05, w * 0.26]) ctx.fillRect(sx - 7, -h * 0.75, 14, h * 0.7);
    ctx.fillStyle = '#6b4520';
    for (const sx of [-w * 0.36, -w * 0.05, w * 0.26]) ctx.fillRect(sx - 3, -h * 0.72, 6, h * 0.64);
    // сиденье из досок
    ctx.fillStyle = '#111'; ctx.fillRect(-w * 0.48 - 4, -h - 4, w * 0.86 + 8, h * 0.32 + 8);
    for (let i = 0; i < 5; i++) { ctx.fillStyle = i % 2 ? '#c99a58' : '#b8894a'; ctx.fillRect(-w * 0.48 + i * w * 0.172, -h, w * 0.172 + 0.5, h * 0.32); }
    ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fillRect(-w * 0.48, -h, w * 0.86, h * 0.07);
    // верёвочка
    ctx.lineWidth = 4; ctx.strokeStyle = '#e8d6a8'; ctx.beginPath(); ctx.moveTo(w * 0.42, -h * 0.85); ctx.quadraticCurveTo(w * 0.62, -h * 0.4, w * 0.56, -h * 1.2); ctx.stroke();
    ctx.restore();
  }
  // горка-трамплин из снежных блоков: (x, ground) — низ высокого края, face — куда смотрит склон (в сторону низа)
  function snowRamp(ctx, x, ground, n = 3, s = 70, face = -1) {
    for (let i = 0; i < n; i++) for (let j = 0; j <= i; j++) snowBlock(ctx, x + face * (n - 1 - i) * s, ground - s / 2 - j * s, s, 0, i * 7 + j);
  }

  // столб из дубового бревна: (x, ground) — низ, h — высота, grow — доля выросшего из земли (0..1)
  function logPost(ctx, x, ground, h = 380, w = 56, grow = 1) {
    if (grow <= 0) return;
    ctx.save(); ctx.beginPath(); ctx.rect(x - w, ground - h - 40, 2 * w, h + 40); ctx.clip();
    ctx.translate(x, ground + h * (1 - grow));
    const r = rng(17), u = w / 4;
    ctx.fillStyle = '#111'; ctx.fillRect(-w / 2 - 4, -h - 4, w + 8, h + 8);
    for (let j = 0; j * u < h; j++) for (let i = 0; i < 4; i++) { const v = r(); ctx.fillStyle = v < 0.3 ? '#5a3d1e' : v < 0.75 ? '#6e4b26' : '#7d5830'; ctx.fillRect(-w / 2 + i * u, -h + j * u, u + 0.6, Math.min(u, h - j * u) + 0.6); }
    ctx.fillStyle = '#b8894a'; ctx.fillRect(-w / 2, -h, w, u); ctx.fillStyle = '#9a6e36'; ctx.fillRect(-w / 4, -h + u * 0.25, w / 2, u * 0.5);
    ctx.restore();
  }
  // гамак: полотно в полоску по точкам pts (сверху вниз — по краю), верёвки от якорей a, b до концов полотна
  function hammock(ctx, a, b, pts, cols = ['#e8262e', '#ffffff', '#2f7de1']) {
    ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const p0 = pts[0], p1 = pts[pts.length - 1];
    for (const [lw, c] of [[7, '#111'], [3.5, '#e8d6a8']]) {
      ctx.lineWidth = lw; ctx.strokeStyle = c;
      if (a) { ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(p0[0], p0[1]); ctx.stroke(); }
      if (b) { ctx.beginPath(); ctx.moveTo(b[0], b[1]); ctx.lineTo(p1[0], p1[1]); ctx.stroke(); }
    }
    const path = () => { ctx.beginPath(); ctx.moveTo(p0[0], p0[1]); for (let i = 1; i < pts.length - 1; i++) { const mx = (pts[i][0] + pts[i + 1][0]) / 2, my = (pts[i][1] + pts[i + 1][1]) / 2; ctx.quadraticCurveTo(pts[i][0], pts[i][1], mx, my); } ctx.lineTo(p1[0], p1[1]); };
    path(); ctx.lineWidth = 46; ctx.strokeStyle = '#111'; ctx.stroke();
    path(); ctx.lineWidth = 38; ctx.strokeStyle = cols[1]; ctx.stroke();
    path(); ctx.lineWidth = 26; ctx.strokeStyle = cols[2]; ctx.stroke();
    path(); ctx.lineWidth = 12; ctx.strokeStyle = cols[0]; ctx.stroke();
    ctx.restore();
  }
  // гамак, обёрнутый вокруг (кокон-«буррито»): центр (x, y), w × h, rot
  function hammockWrap(ctx, x, y, w = 330, h = 200, rot = 0, cols = ['#e8262e', '#ffffff', '#2f7de1']) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
    ctx.beginPath(); ctx.ellipse(0, 0, w / 2, h / 2, 0, 0, TAU);
    ctx.lineWidth = 7; ctx.strokeStyle = '#111'; ctx.stroke();
    ctx.save(); ctx.clip();
    const n = 7;
    for (let i = 0; i < n; i++) { ctx.fillStyle = cols[i % 3]; ctx.fillRect(-w / 2 + i * w / n, -h / 2, w / n + 1, h); }
    ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.fillRect(-w / 2, h * 0.15, w, h * 0.35);
    ctx.restore();
    ctx.restore();
  }
  // гамак наброшен сверху (покрывалом): (x, y) — макушка, w — ширина, h — сколько свисает
  function hammockSheet(ctx, x, y, w = 320, h = 380, t = 0, cols = ['#e8262e', '#ffffff', '#2f7de1']) {
    ctx.save(); ctx.translate(x, y);
    ctx.beginPath();
    ctx.moveTo(-w * 0.5, h * 0.8);
    ctx.quadraticCurveTo(-w * 0.55, -h * 0.12, 0, -h * 0.12);
    ctx.quadraticCurveTo(w * 0.55, -h * 0.12, w * 0.5, h * 0.8);
    for (let i = 8; i >= 0; i--) ctx.lineTo(-w * 0.5 + w * i / 8, h * (0.82 + 0.04 * Math.sin(i * 1.7 + t * 6)));
    ctx.closePath();
    ctx.lineWidth = 7; ctx.strokeStyle = '#111'; ctx.stroke();
    ctx.save(); ctx.clip();
    for (let i = 0; i < 9; i++) { ctx.fillStyle = cols[i % 3]; ctx.fillRect(-w * 0.6 + i * w * 0.14, -h, w * 0.14 + 1, h * 2); }
    ctx.restore();
    // кисточки-верёвки
    ctx.lineWidth = 4; ctx.strokeStyle = '#e8d6a8';
    for (const sx of [-1, 1]) { ctx.beginPath(); ctx.moveTo(sx * w * 0.5, h * 0.8); ctx.lineTo(sx * w * 0.56, h * 0.98); ctx.stroke(); }
    ctx.restore();
  }
  // гамак свёрнут в рулон: центр (x, y), длина L, rot
  function hammockRoll(ctx, x, y, L = 200, rot = 0, cols = ['#e8262e', '#ffffff', '#2f7de1']) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
    ctx.fillStyle = '#111'; ctx.beginPath(); ctx.roundRect(-L / 2 - 5, -32, L + 10, 64, 26); ctx.fill();
    ctx.save(); ctx.beginPath(); ctx.roundRect(-L / 2, -27, L, 54, 22); ctx.clip();
    for (let i = 0; i < 6; i++) { ctx.fillStyle = cols[i % 3]; ctx.fillRect(-L / 2 + i * L / 6, -30, L / 6 + 1, 60); }
    ctx.restore();
    ctx.restore();
  }

  // пузырь из жвачки (любого цвета): центр (x, y), радиус r
  function gumBubble(ctx, x, y, r, col = '#3aa0ff', line = '#0d4f8a') {
    if (r <= 1) return;
    ctx.save();
    ctx.beginPath(); ctx.arc(x, y, r, 0, TAU);
    ctx.globalAlpha = 0.9; ctx.fillStyle = col; ctx.fill(); ctx.globalAlpha = 1;
    ctx.lineWidth = Math.max(3, r * 0.03); ctx.strokeStyle = line; ctx.stroke();
    ctx.beginPath(); ctx.arc(x, y, r * 0.72, Math.PI * 1.1, Math.PI * 1.45);
    ctx.lineWidth = Math.max(3, r * 0.08); ctx.lineCap = 'round'; ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.stroke();
    ctx.beginPath(); ctx.arc(x - r * 0.18, y - r * 0.62, r * 0.06, 0, TAU); ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.fill();
    ctx.restore();
  }
  // пачка жвачки: центр (x, y), ширина s
  function gumPack(ctx, x, y, s = 150, rot = 0) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
    const w = s, h = s * 0.42;
    ctx.fillStyle = '#111'; ctx.fillRect(-w / 2 - 5, -h / 2 - 5, w + 10, h + 10);
    ctx.fillStyle = '#3aa0ff'; ctx.fillRect(-w / 2, -h / 2, w, h);
    ctx.fillStyle = '#ffffff'; ctx.fillRect(-w / 2, -h * 0.15, w, h * 0.3);
    ctx.fillStyle = '#0d4f8a'; for (let i = 0; i < 5; i++) ctx.fillRect(-w * 0.4 + i * w * 0.18, -h * 0.08, w * 0.1, h * 0.16);
    ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(-w / 2, -h / 2, w, h * 0.15);
    ctx.restore();
  }

  // ветряная мельница: (x, y) — середина основания, s — масштаб (башня 360·s), ang — поворот крыльев (по часовой)
  function windmill(ctx, x, y, s = 1, ang = 0) {
    ctx.save(); ctx.translate(x, y);
    const H = 360 * s, wb = 200 * s, wt = 130 * s, hy = -H - 20 * s, L = 300 * s;
    // башня из досок
    ctx.beginPath(); ctx.moveTo(-wb / 2, 0); ctx.lineTo(-wt / 2, -H); ctx.lineTo(wt / 2, -H); ctx.lineTo(wb / 2, 0); ctx.closePath();
    ctx.lineWidth = 8; ctx.strokeStyle = '#111'; ctx.stroke();
    ctx.save(); ctx.clip();
    for (let j = 0; j * 30 * s < H; j++) { ctx.fillStyle = j % 2 ? '#c99a58' : '#b8894a'; ctx.fillRect(-wb, -(j + 1) * 30 * s, 2 * wb, 30 * s + 1); ctx.fillStyle = 'rgba(90,55,20,0.4)'; ctx.fillRect(-wb, -(j + 1) * 30 * s, 2 * wb, 3); }
    ctx.restore();
    // дверь и окошко
    ctx.fillStyle = '#111'; ctx.fillRect(-32 * s - 4, -100 * s - 4, 64 * s + 8, 100 * s + 4);
    ctx.fillStyle = '#6b4520'; ctx.fillRect(-32 * s, -100 * s, 64 * s, 100 * s);
    ctx.fillStyle = '#4a2f14'; ctx.fillRect(-2 * s, -100 * s, 4 * s, 100 * s);
    ctx.fillStyle = '#111'; ctx.fillRect(-22 * s - 4, -230 * s - 4, 44 * s + 8, 44 * s + 8);
    ctx.fillStyle = '#7fd3ff'; ctx.fillRect(-22 * s, -230 * s, 44 * s, 44 * s);
    ctx.fillStyle = '#111'; ctx.fillRect(-2 * s, -230 * s, 4 * s, 44 * s); ctx.fillRect(-22 * s, -210 * s, 44 * s, 4 * s);
    // крыша
    ctx.beginPath(); ctx.moveTo(-wt / 2 - 22 * s, -H + 6 * s); ctx.lineTo(0, -H - 90 * s); ctx.lineTo(wt / 2 + 22 * s, -H + 6 * s); ctx.closePath();
    ctx.fillStyle = '#c0392b'; ctx.fill(); ctx.lineWidth = 8; ctx.strokeStyle = '#111'; ctx.stroke();
    ctx.fillStyle = '#e0533f'; ctx.beginPath(); ctx.moveTo(-wt / 2 - 10 * s, -H); ctx.lineTo(0, -H - 76 * s); ctx.lineTo(-wt * 0.1, -H); ctx.closePath(); ctx.fill();
    // крылья
    for (let i = 0; i < 4; i++) {
      const a = ang + i * Math.PI / 2;
      ctx.save(); ctx.translate(0, hy); ctx.rotate(a);
      ctx.fillStyle = '#111'; ctx.fillRect(-4, -10 * s - 4, L + 8, 20 * s + 8);
      ctx.fillStyle = '#6b4520'; ctx.fillRect(0, -10 * s, L, 20 * s);
      // парус в решётке
      const sw = 74 * s, x0 = L * 0.26;
      ctx.fillStyle = '#111'; ctx.fillRect(x0 - 4, 10 * s - 4, L - x0 + 4, sw + 8);
      ctx.fillStyle = '#f4ecd8'; ctx.fillRect(x0, 10 * s, L - x0 - 4, sw);
      ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.fillRect(x0, 10 * s + sw * 0.6, L - x0 - 4, sw * 0.4);
      ctx.fillStyle = '#8a5a2b';
      for (let k = 0; k <= 4; k++) ctx.fillRect(x0 + (L - x0 - 10) * k / 4, 10 * s, 5 * s, sw);
      ctx.fillRect(x0, 10 * s + sw / 2 - 2 * s, L - x0 - 4, 4 * s);
      ctx.restore();
    }
    ctx.beginPath(); ctx.arc(0, hy, 26 * s, 0, TAU); ctx.fillStyle = '#3a2410'; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = '#111'; ctx.stroke();
    ctx.beginPath(); ctx.arc(0, hy, 9 * s, 0, TAU); ctx.fillStyle = '#9a9a9a'; ctx.fill();
    ctx.restore();
    return [x, y + hy];
  }

  // овца из майнкрафта: (x, y) — середина низа, s — длина тела, face — куда смотрит, phase — шаг ног,
  // wool — шерсть (0 — острижена, 1 — пушистая, >1 — ещё пышнее), chew — жуёт, sq — сплющивание, eat — голова к траве (0..1)
  function mcSheep(ctx, x, y, s = 300, face = 1, phase = 0, wool = 1, chew = 0, sq = 1, eat = 0, col = null) {
    const W = ['#f4f4f4', '#ffffff', '#e6e6e6', '#ececec'], K = ['#e8c9a8', '#dcb894', '#f0d6b8', '#d6ae88'];
    const box = (bx, by, bw, bh, pal, seed, n = 6) => {
      ctx.fillStyle = '#111'; ctx.fillRect(bx - 4, by - 4, bw + 8, bh + 8);
      const r = rng(seed), cw = bw / n, rows = Math.max(1, Math.round(n * bh / bw)), ch = bh / rows;
      for (let i = 0; i < n; i++) for (let j = 0; j < rows; j++) { ctx.fillStyle = pal[Math.floor(r() * pal.length)]; ctx.fillRect(bx + i * cw, by + j * ch, cw + 0.6, ch + 0.6); }
    };
    const wk = Math.max(0, wool), cols = col ? [col, col, col, col] : W;
    ctx.save(); ctx.translate(x, y); ctx.scale(face / Math.sqrt(sq), sq);
    const L = s * 0.3, bw = s * (0.8 + 0.2 * Math.min(1.3, wk)), bh = s * (0.36 + 0.2 * Math.min(1.3, wk));
    // ноги
    [[-bw * 0.34, 0, 1], [bw * 0.26, Math.PI, 1], [-bw * 0.22, Math.PI, 0], [bw * 0.38, 0, 0]].forEach(([lx, ph, far]) => {
      const sw = Math.sin(phase + ph) * 0.45;
      ctx.save(); ctx.translate(lx, -L); ctx.rotate(sw);
      ctx.fillStyle = '#111'; ctx.fillRect(-s * 0.07 - 4, -4, s * 0.14 + 8, L + 8);
      ctx.fillStyle = far ? '#c9a888' : K[0]; ctx.fillRect(-s * 0.07, 0, s * 0.14, L);
      if (wk > 0.3) { ctx.fillStyle = far ? '#d8d8d8' : '#f4f4f4'; ctx.fillRect(-s * 0.07, 0, s * 0.14, L * 0.45); }
      ctx.restore();
    });
    // тело
    const top = -L - bh;
    box(-bw / 2, top, bw, bh, wk > 0.05 ? cols : K, 31, 7);
    if (wk > 0.05) { ctx.fillStyle = 'rgba(0,0,0,0.07)'; ctx.fillRect(-bw / 2, top + bh * 0.7, bw, bh * 0.3); }
    // голова (опускается к траве)
    const hs = s * 0.36, hx = bw / 2 - hs * 0.2 + eat * hs * 0.1, hy = E.lerp(top - hs * 0.35, -L - hs * 0.5, eat);
    ctx.save(); ctx.translate(hx + hs / 2, hy + hs / 2); ctx.rotate(eat * 0.3); ctx.translate(-hs / 2, -hs / 2);
    box(0, 0, hs, hs, K, 47, 4);
    if (wk > 0.05) { ctx.fillStyle = '#111'; ctx.fillRect(-4, -4, hs * 0.6 + 4, hs * 0.3 + 4); ctx.fillStyle = cols[0]; ctx.fillRect(0, 0, hs * 0.6, hs * 0.26); }
    for (const ex of [hs * 0.22, hs * 0.66]) { ctx.fillStyle = '#ffffff'; ctx.fillRect(ex, hs * 0.36, hs * 0.16, hs * 0.13); ctx.fillStyle = '#111'; ctx.fillRect(ex + hs * 0.08, hs * 0.36, hs * 0.08, hs * 0.13); }
    ctx.fillStyle = '#e8a0a0'; ctx.fillRect(hs * 0.38, hs * 0.62, hs * 0.26, hs * 0.12);
    ctx.fillStyle = '#5a1f1f'; ctx.fillRect(hs * 0.36, hs * 0.8, hs * 0.3, hs * 0.07 * (chew > 0 ? 0.4 + 0.8 * Math.abs(Math.sin(chew * 20)) : 0.6));
    ctx.restore();
    ctx.restore();
    return { top: y + top * sq, head: [x + face * (hx + hs / 2) / Math.sqrt(sq), y + (hy + hs / 2) * sq] };
  }
  // ножницы из майнкрафта: (x, y) — ось, s — длина, rot — направление лезвий, open — раскрыты (0..1)
  function shears(ctx, x, y, s = 120, rot = 0, open = 0) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
    const a = 0.06 + open * 0.3;
    for (const sg of [-1, 1]) {
      ctx.save(); ctx.rotate(sg * a);
      ctx.fillStyle = '#111'; ctx.beginPath(); ctx.moveTo(-s * 0.45, -s * 0.09); ctx.lineTo(0, -s * 0.07); ctx.lineTo(s * 0.62, sg * s * 0.02); ctx.lineTo(0, s * 0.07); ctx.lineTo(-s * 0.45, s * 0.09); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#d8d8d8'; ctx.beginPath(); ctx.moveTo(0, -s * 0.045); ctx.lineTo(s * 0.56, sg * s * 0.015); ctx.lineTo(0, s * 0.045); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#ffffff'; ctx.fillRect(s * 0.06, -s * 0.03, s * 0.26, s * 0.018);
      ctx.fillStyle = '#5a5a5a'; ctx.fillRect(-s * 0.42, -s * 0.06, s * 0.36, s * 0.12);
      ctx.fillStyle = '#8a8a8a'; ctx.fillRect(-s * 0.42, -s * 0.06, s * 0.36, s * 0.035);
      ctx.restore();
    }
    ctx.beginPath(); ctx.arc(0, 0, s * 0.06, 0, TAU); ctx.fillStyle = '#3a3a3a'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = '#111'; ctx.stroke();
    ctx.restore();
  }

  // кальмар из майнкрафта: (x, y) — середина тела, s — ширина тела, rot — наклон (0 — щупальца вниз),
  // sq — сжатие (меньше 1 — сплющен), t — секунды (щупальца шевелятся), glow — светящийся (бирюзовый)
  function mcSquid(ctx, x, y, s = 170, rot = 0, sq = 1, t = 0, glow = false) {
    const P = glow ? ['#2fb9b0', '#27a39b', '#3fd2c8', '#1f8c86'] : ['#24466e', '#1d3a5c', '#2d5482', '#173050'];
    const r = rng(glow ? 9 : 5);
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(1 / Math.sqrt(sq), sq);
    const w = s, h = s * 1.25, u = w / 8;
    // щупальца (8 штук) — снизу тела
    for (let i = 0; i < 8; i++) {
      const tx = -w / 2 + (i + 0.5) * w / 8, L = s * (0.7 + 0.12 * ((i * 5) % 3)), sw = Math.sin(t * 7 + i * 1.3) * 0.18;
      ctx.save(); ctx.translate(tx, h / 2 - 2); ctx.rotate(sw);
      ctx.fillStyle = '#111'; ctx.fillRect(-u * 0.42 - 3, -2, u * 0.84 + 6, L + 5);
      ctx.fillStyle = P[i % 2 ? 1 : 3]; ctx.fillRect(-u * 0.42, 0, u * 0.84, L);
      ctx.fillStyle = glow ? '#8ff5ec' : '#3a6ea3'; ctx.fillRect(-u * 0.42, L * 0.2, u * 0.25, L * 0.6);
      ctx.restore();
    }
    // тело
    ctx.fillStyle = '#111'; ctx.fillRect(-w / 2 - 5, -h / 2 - 5, w + 10, h + 10);
    for (let i = 0; i < 8; i++) for (let j = 0; j < 10; j++) { ctx.fillStyle = P[Math.floor(r() * 4)]; ctx.fillRect(-w / 2 + i * u, -h / 2 + j * h / 10, u + 0.6, h / 10 + 0.6); }
    ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fillRect(-w / 2, -h / 2, w, h * 0.12);
    // глаза и рот
    for (const ex of [-w * 0.36, w * 0.16]) {
      ctx.fillStyle = '#ffffff'; ctx.fillRect(ex, h * 0.04, u * 1.6, u * 1.2);
      ctx.fillStyle = '#111'; ctx.fillRect(ex + (ex < 0 ? u * 0.8 : 0), h * 0.04, u * 0.8, u * 1.2);
    }
    ctx.fillStyle = glow ? '#0f5a55' : '#0c1d33'; ctx.fillRect(-u * 1.2, h * 0.3, u * 2.4, u * 0.9);
    ctx.restore();
  }
  // лужа чернил: (x, y) — середина низа, w — ширина
  function inkPuddle(ctx, x, y, w = 300) {
    if (w <= 2) return;
    ctx.save(); ctx.translate(x, y);
    ctx.beginPath(); ctx.ellipse(0, -w * 0.04, w / 2, w * 0.09, 0, 0, TAU);
    ctx.fillStyle = '#16161e'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = '#000'; ctx.stroke();
    ctx.fillStyle = 'rgba(160,170,220,0.5)'; ctx.beginPath(); ctx.ellipse(-w * 0.16, -w * 0.07, w * 0.12, w * 0.02, 0, 0, TAU); ctx.fill();
    ctx.restore();
  }

  // слайм из майнкрафта: (x, y) — середина низа, s — размер куба, sq — сплющивание (меньше 1 — сплющен),
  // look — куда смотрят глаза (−1..1), alpha — прозрачность оболочки, core — рисовать ли ядро
  function mcSlime(ctx, x, y, s = 240, sq = 1, look = 0, alpha = 0.72, core = true, mouth = 0) {
    const w = s / Math.sqrt(sq), h = s * sq;
    ctx.save(); ctx.translate(x, y);
    const cw = w * 0.62, ch = h * 0.62, u = cw / 8;
    if (core) {
      ctx.fillStyle = '#3f9b2c'; ctx.fillRect(-cw / 2, -h / 2 - ch / 2, cw, ch);
      ctx.fillStyle = '#4fb636'; ctx.fillRect(-cw / 2, -h / 2 - ch / 2, cw, ch * 0.2);
    }
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#7ed957'; ctx.fillRect(-w / 2, -h, w, h);
    ctx.globalAlpha = Math.min(1, alpha + 0.1);
    ctx.fillStyle = '#a9ef86'; ctx.fillRect(-w / 2, -h, w, h * 0.12); ctx.fillRect(-w / 2, -h, w * 0.1, h);
    ctx.fillStyle = 'rgba(30,90,20,0.35)'; ctx.fillRect(-w / 2, -h * 0.14, w, h * 0.14);
    ctx.globalAlpha = 1;
    ctx.fillStyle = 'rgba(255,255,255,0.75)'; ctx.fillRect(-w * 0.36, -h * 0.86, w * 0.12, h * 0.07); ctx.fillRect(-w * 0.36, -h * 0.75, w * 0.05, h * 0.12);
    if (core) {                                                    // лицо — поверх оболочки
      ctx.fillStyle = '#163310';
      for (const ex of [-cw * 0.3, cw * 0.12]) ctx.fillRect(ex + look * u * 0.6, -h / 2 - ch * 0.18, u * 1.4, u * 1.4);
      ctx.fillRect(-u * 0.6 + look * u * 0.4, -h / 2 + ch * 0.16, u * (1.2 + mouth), u * (0.7 + mouth * 1.3));
    }
    ctx.lineWidth = 6; ctx.strokeStyle = '#1f5c12'; ctx.strokeRect(-w / 2, -h, w, h);
    ctx.restore();
  }
  // брызги слизи: life 0..1
  function slimeBurst(ctx, x, y, life, size = 1, seed = 4) {
    if (life < 0 || life > 1) return;
    const r = rng(seed);
    ctx.save(); ctx.globalAlpha = Math.min(1, (1 - life) * 2);
    for (let i = 0; i < 14; i++) {
      const a = -Math.PI * (0.05 + 0.9 * r()), v = (180 + 260 * r()) * size, sz = (16 + 18 * r()) * size * (1 - 0.4 * life);
      const px = x + Math.cos(a) * v * life, py = y + Math.sin(a) * v * life + 420 * life * life;
      ctx.fillStyle = '#7ed957'; ctx.fillRect(px - sz / 2, py - sz / 2, sz, sz);
      ctx.lineWidth = 3; ctx.strokeStyle = '#1f5c12'; ctx.strokeRect(px - sz / 2, py - sz / 2, sz, sz);
    }
    ctx.restore();
  }

  // корова из майнкрафта: (x, y) — середина низа, s — длина тела, face, phase — шаг ног, chew, sq, moo — рот открыт (0..1)
  function mcCow(ctx, x, y, s = 320, face = 1, phase = 0, chew = 0, sq = 1, moo = 0) {
    const BR = ['#4a3020', '#3e2818', '#56382a'], WH = ['#f2f2f2', '#e2e2e2', '#ffffff'];
    const r = rng(77);
    ctx.save(); ctx.translate(x, y); ctx.scale(face / Math.sqrt(sq), sq);
    const L = s * 0.32, bw = s, bh = s * 0.5, top = -L - bh;
    [[-bw * 0.36, 0, 1], [bw * 0.28, Math.PI, 1], [-bw * 0.24, Math.PI, 0], [bw * 0.4, 0, 0]].forEach(([lx, ph, far]) => {
      ctx.save(); ctx.translate(lx, -L); ctx.rotate(Math.sin(phase + ph) * 0.45);
      ctx.fillStyle = '#111'; ctx.fillRect(-s * 0.075 - 4, -4, s * 0.15 + 8, L + 8);
      ctx.fillStyle = far ? '#2e1e12' : '#4a3020'; ctx.fillRect(-s * 0.075, 0, s * 0.15, L);
      ctx.fillStyle = far ? '#bdbdbd' : '#e2e2e2'; ctx.fillRect(-s * 0.075, L * 0.55, s * 0.15, L * 0.3);
      ctx.fillStyle = '#2a2a2a'; ctx.fillRect(-s * 0.075, L - s * 0.04, s * 0.15, s * 0.04);
      ctx.restore();
    });
    // вымя
    ctx.fillStyle = '#111'; ctx.fillRect(-bw * 0.12 - 4, -L - 4, bw * 0.22 + 8, s * 0.09 + 8);
    ctx.fillStyle = '#f1a3b8'; ctx.fillRect(-bw * 0.12, -L, bw * 0.22, s * 0.09);
    ctx.fillStyle = '#e07f99'; for (let i = 0; i < 4; i++) ctx.fillRect(-bw * 0.11 + i * bw * 0.055, -L + s * 0.09, bw * 0.025, s * 0.03);
    // тело с пятнами
    ctx.fillStyle = '#111'; ctx.fillRect(-bw / 2 - 4, top - 4, bw + 8, bh + 8);
    const n = 8, cw = bw / n, rows = 4, ch = bh / rows;
    for (let i = 0; i < n; i++) for (let j = 0; j < rows; j++) {
      const white = ((i * 3 + j * 5) % 7 === 0) || ((i === 2 || i === 3) && j > 0 && j < 3) || (i === 6 && j === 2);
      ctx.fillStyle = (white ? WH : BR)[Math.floor(r() * 3)]; ctx.fillRect(-bw / 2 + i * cw, top + j * ch, cw + 0.6, ch + 0.6);
    }
    // голова
    const hs = s * 0.38, hx = bw / 2 - hs * 0.25, hy = top - hs * 0.3;
    ctx.fillStyle = '#d8d8d8'; ctx.fillRect(hx + hs * 0.02, hy - hs * 0.2, hs * 0.14, hs * 0.22); ctx.fillRect(hx + hs * 0.84, hy - hs * 0.2, hs * 0.14, hs * 0.22);   // рога
    ctx.strokeStyle = '#111'; ctx.lineWidth = 3; ctx.strokeRect(hx + hs * 0.02, hy - hs * 0.2, hs * 0.14, hs * 0.22); ctx.strokeRect(hx + hs * 0.84, hy - hs * 0.2, hs * 0.14, hs * 0.22);
    ctx.fillStyle = '#111'; ctx.fillRect(hx - 4, hy - 4, hs + 8, hs + 8);
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { ctx.fillStyle = (i === 1 && j < 3) || (i === 2 && j === 0) ? WH[(i + j) % 3] : BR[(i * 2 + j) % 3]; ctx.fillRect(hx + i * hs / 4, hy + j * hs / 4, hs / 4 + 0.6, hs / 4 + 0.6); }
    // морда
    const mw = hs * 0.62, mh = hs * 0.32 + moo * hs * 0.12, mx = hx + hs - mw * 0.35, my = hy + hs * 0.58;
    ctx.fillStyle = '#111'; ctx.fillRect(mx - 4, my - 4, mw + 8, mh + 8);
    ctx.fillStyle = '#d9d9d9'; ctx.fillRect(mx, my, mw, mh);
    ctx.fillStyle = '#3a3a3a'; ctx.fillRect(mx + mw * 0.12, my + mh * 0.18, mw * 0.18, mh * 0.3); ctx.fillRect(mx + mw * 0.66, my + mh * 0.18, mw * 0.18, mh * 0.3);
    if (moo > 0 || chew > 0) { ctx.fillStyle = '#5a1f1f'; ctx.fillRect(mx + mw * 0.2, my + mh * 0.62, mw * 0.6, mh * 0.3 * (moo > 0 ? 1 : 0.4 + 0.6 * Math.abs(Math.sin(chew * 20)))); }
    for (const ex of [hx + hs * 0.14, hx + hs * 0.6]) { ctx.fillStyle = '#ffffff'; ctx.fillRect(ex, hy + hs * 0.3, hs * 0.18, hs * 0.14); ctx.fillStyle = '#111'; ctx.fillRect(ex + hs * 0.09, hy + hs * 0.3, hs * 0.09, hs * 0.14); }
    ctx.restore();
  }
  // железное ведро: (x, y) — середина низа, s — высота, rot — наклон вокруг низа, milk — сколько молока (0..1), flip — вверх дном
  function mcBucket(ctx, x, y, s = 110, rot = 0, milk = 0) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
    const wb = s * 0.8, wt = s * 1.05;
    ctx.beginPath(); ctx.moveTo(-wb / 2, 0); ctx.lineTo(wb / 2, 0); ctx.lineTo(wt / 2, -s); ctx.lineTo(-wt / 2, -s); ctx.closePath();
    ctx.fillStyle = '#9aa0a6'; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = '#111'; ctx.stroke();
    ctx.save(); ctx.clip();
    ctx.fillStyle = '#c4c9ce'; ctx.fillRect(-wt / 2, -s, wt * 0.35, s); ctx.fillStyle = '#6e747a'; ctx.fillRect(wt * 0.2, -s, wt * 0.3, s);
    ctx.fillStyle = '#5c6268'; ctx.fillRect(-wt / 2, -s * 0.72, wt, s * 0.07); ctx.fillRect(-wt / 2, -s * 0.22, wt, s * 0.07);
    ctx.restore();
    // ободок и молоко
    ctx.fillStyle = '#111'; ctx.fillRect(-wt / 2 - 4, -s - 7, wt + 8, 12);
    ctx.fillStyle = milk > 0 ? '#fbfbf6' : '#3a3f44'; ctx.fillRect(-wt / 2 + 3, -s - 4, wt - 6, 6);
    // ручка
    ctx.lineWidth = 5; ctx.strokeStyle = '#111'; ctx.beginPath(); ctx.arc(0, -s, wt * 0.48, Math.PI * 1.05, Math.PI * 1.95); ctx.stroke();
    ctx.restore();
  }

  // иглобрюх из майнкрафта: центр (x, y), s — размер в сдутом виде, puff — раздут (0..1), face, rot, t — секунды (плавники)
  function mcPuffer(ctx, x, y, s = 90, puff = 0, face = 1, rot = 0, t = 0) {
    const k = 1 + puff * 1.6, w = s * (1.3 + puff * 0.4) * k / 1.3, h = s * (0.8 + puff * 0.7) * k / 1.3;
    const Y = ['#ffd21f', '#f7c20c', '#ffe25a', '#e8b000'], r = rng(13);
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(face, 1);
    // хвост
    const tw = Math.sin(t * 14) * 0.3;
    ctx.save(); ctx.translate(-w / 2, 0); ctx.rotate(tw);
    ctx.fillStyle = '#111'; ctx.fillRect(-s * 0.32 - 4, -s * 0.24 - 4, s * 0.32 + 8, s * 0.48 + 8);
    ctx.fillStyle = '#3f8bd9'; ctx.fillRect(-s * 0.32, -s * 0.24, s * 0.32, s * 0.48);
    ctx.fillStyle = '#ffd21f'; ctx.fillRect(-s * 0.14, -s * 0.1, s * 0.14, s * 0.2);
    ctx.restore();
    // иглы
    if (puff > 0.2) {
      const n = 16, sp = s * 0.45 * puff;
      ctx.lineCap = 'butt';
      for (let i = 0; i < n; i++) {
        const a = i / n * TAU, cx = Math.cos(a), cy = Math.sin(a);
        const ex = Math.sign(cx) * Math.min(Math.abs(cx) * w * 0.75, w / 2), ey = Math.sign(cy) * Math.min(Math.abs(cy) * h * 0.75, h / 2);
        for (const [lw, c] of [[9, '#111'], [5, '#f2f2f2']]) { ctx.lineWidth = lw; ctx.strokeStyle = c; ctx.beginPath(); ctx.moveTo(ex, ey); ctx.lineTo(ex + cx * sp, ey + cy * sp); ctx.stroke(); }
      }
    }
    // тело
    ctx.fillStyle = '#111'; ctx.fillRect(-w / 2 - 4, -h / 2 - 4, w + 8, h + 8);
    const n = 6, cw = w / n, rows = 4, ch = h / rows;
    for (let i = 0; i < n; i++) for (let j = 0; j < rows; j++) { ctx.fillStyle = Y[Math.floor(r() * 4)]; ctx.fillRect(-w / 2 + i * cw, -h / 2 + j * ch, cw + 0.6, ch + 0.6); }
    ctx.fillStyle = '#f2f2f2'; ctx.fillRect(-w / 2, h * 0.18, w, h * 0.32);
    ctx.fillStyle = '#3f8bd9'; ctx.fillRect(-w * 0.1, -h / 2, w * 0.35, h * 0.12);
    // плавник
    const fw = Math.sin(t * 18) * 0.4;
    ctx.save(); ctx.translate(w * 0.05, h * 0.05); ctx.rotate(0.3 + fw);
    ctx.fillStyle = '#111'; ctx.fillRect(-4, -4, s * 0.22 + 8, s * 0.14 + 8); ctx.fillStyle = '#3f8bd9'; ctx.fillRect(0, 0, s * 0.22, s * 0.14);
    ctx.restore();
    // глаз и рот
    const eu = s * 0.14 * (1 + puff * 0.5);
    ctx.fillStyle = '#ffffff'; ctx.fillRect(w * 0.22, -h * 0.28, eu * 1.4, eu * 1.4);
    ctx.fillStyle = '#111'; ctx.fillRect(w * 0.22 + eu * 0.7, -h * 0.28 + eu * 0.2, eu * 0.6, eu * 0.9);
    ctx.fillStyle = '#e04a7a'; ctx.fillRect(w / 2 - eu * 0.6, h * 0.02, eu * 0.6, eu * (0.4 + puff * 0.5));
    ctx.restore();
  }

  // курица из майнкрафта: (x, y) — середина низа, s — высота, face, phase — шаг ног, flap — взмах крыльев (−1..1),
  // sq — сплющивание, peck — клюёт (0..1)
  function mcChicken(ctx, x, y, s = 220, face = 1, phase = 0, flap = 0, sq = 1, peck = 0) {
    const W = ['#f7f7f7', '#ffffff', '#e9e9e9'], r = rng(29);
    ctx.save(); ctx.translate(x, y); ctx.scale(face / Math.sqrt(sq), sq);
    const L = s * 0.24, bw = s * 0.62, bh = s * 0.42, top = -L - bh;
    // ноги
    for (const [lx, ph] of [[-bw * 0.15, 0], [bw * 0.12, Math.PI]]) {
      ctx.save(); ctx.translate(lx, -L); ctx.rotate(Math.sin(phase + ph) * 0.4);
      ctx.fillStyle = '#111'; ctx.fillRect(-s * 0.03 - 3, -3, s * 0.06 + 6, L + 6);
      ctx.fillStyle = '#f2a20c'; ctx.fillRect(-s * 0.03, 0, s * 0.06, L);
      ctx.fillRect(-s * 0.06, L - s * 0.03, s * 0.14, s * 0.03);
      ctx.restore();
    }
    // тело
    ctx.fillStyle = '#111'; ctx.fillRect(-bw / 2 - 4, top - 4, bw + 8, bh + 8);
    for (let i = 0; i < 5; i++) for (let j = 0; j < 4; j++) { ctx.fillStyle = W[Math.floor(r() * 3)]; ctx.fillRect(-bw / 2 + i * bw / 5, top + j * bh / 4, bw / 5 + 0.6, bh / 4 + 0.6); }
    // крыло
    ctx.save(); ctx.translate(-bw * 0.05, top + bh * 0.2); ctx.rotate(-flap * 0.9);
    ctx.fillStyle = '#111'; ctx.fillRect(-bw * 0.28 - 4, -4, bw * 0.44 + 8, bh * 0.55 + 8);
    ctx.fillStyle = '#e2e2e2'; ctx.fillRect(-bw * 0.28, 0, bw * 0.44, bh * 0.55);
    ctx.restore();
    // голова
    const hs = s * 0.3, hx = bw / 2 - hs * 0.75, hy = top - hs * 0.85 + peck * hs * 0.6;
    ctx.save(); ctx.translate(hx + hs / 2, hy + hs); ctx.rotate(peck * 0.6); ctx.translate(-hs / 2, -hs);
    ctx.fillStyle = '#111'; ctx.fillRect(-4, -4, hs + 8, hs * 1.15 + 8);
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, hs, hs * 1.15);
    ctx.fillStyle = '#111'; ctx.fillRect(hs * 0.55, hs * 0.25, hs * 0.16, hs * 0.16);
    ctx.fillStyle = '#111'; ctx.fillRect(hs - 3, hs * 0.38, hs * 0.32 + 6, hs * 0.2 + 6);
    ctx.fillStyle = '#f2a20c'; ctx.fillRect(hs, hs * 0.41, hs * 0.32, hs * 0.2);
    ctx.fillStyle = '#e8262e'; ctx.fillRect(hs * 0.82, hs * 0.62, hs * 0.18, hs * 0.26);
    ctx.restore();
    ctx.restore();
  }
  // разбитое яйцо: желток с белком — клякса; (x, y) — центр, s — размер
  function yolk(ctx, x, y, s = 120, seed = 3) {
    gumSplat(ctx, x, y, s, seed, '#fffaf0', '#c9bfa8');
    ctx.save(); ctx.beginPath(); ctx.arc(x + s * 0.04, y - s * 0.04, s * 0.2, 0, TAU);
    ctx.fillStyle = '#ffb81f'; ctx.fill(); ctx.lineWidth = Math.max(3, s * 0.025); ctx.strokeStyle = '#b06a00'; ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.beginPath(); ctx.arc(x - s * 0.03, y - s * 0.1, s * 0.05, 0, TAU); ctx.fill();
    ctx.restore();
  }

  // нотный блок из майнкрафта: (x, y) — середина низа, s — сторона, sq — сплющивание (удар), glow — подсветка (0..1)
  function noteBlock(ctx, x, y, s = 200, sq = 1, glow = 0) {
    const w = s / Math.sqrt(sq), h = s * sq, r = rng(41), u = w / 8;
    ctx.save(); ctx.translate(x, y);
    ctx.fillStyle = '#111'; ctx.fillRect(-w / 2 - 5, -h - 5, w + 10, h + 10);
    const P = ['#6b4423', '#5a3a1e', '#7a5030', '#4e321a'];
    for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) { ctx.fillStyle = P[Math.floor(r() * 4)]; ctx.fillRect(-w / 2 + i * u, -h + j * h / 8, u + 0.6, h / 8 + 0.6); }
    // нота на передней грани
    ctx.fillStyle = '#1a1008';
    ctx.fillRect(-u * 1.6, -h * 0.3, u * 1.6, h * 0.13); ctx.fillRect(-u * 0.2, -h * 0.78, u * 0.6, h * 0.58);
    ctx.fillRect(-u * 0.2, -h * 0.78, u * 2, h * 0.11); ctx.fillRect(u * 1.2, -h * 0.72, u * 0.6, h * 0.14);
    if (glow > 0) { ctx.globalAlpha = glow * 0.55; ctx.fillStyle = '#fff6a0'; ctx.fillRect(-w / 2, -h, w, h); ctx.globalAlpha = 1; }
    ctx.restore();
  }
  // ноты разлетаются из точки: life 0..1, dir — общий наклон (рад, 0 — вверх), cols — цвета нот
  function noteBurst(ctx, x, y, life, size = 1, seed = 3, dir = 0, spread = 1.3) {
    if (life < 0 || life > 1) return;
    const r = rng(seed), C = ['#e8262e', '#2f7de1', '#25c516', '#ffb81f', '#b83ad6'];
    for (let i = 0; i < 9; i++) {
      const a = dir - Math.PI / 2 + (r() - 0.5) * spread * 2, v = (220 + 280 * r()) * size;
      note(ctx, x + Math.cos(a) * v * life, y + Math.sin(a) * v * life + Math.sin(life * 9 + i) * 12, (0.9 + r() * 0.8) * size, Math.min(1, (1 - life) * 3), r() < 0.4, C[i % C.length]);
    }
  }

  // огромный красный гриб из майнкрафта: (x, y) — низ ножки, s — ширина шляпки, press — шляпку вдавили (0..1, пружинит),
  // grow — вырастает из земли (0..1), tilt — качается (рад)
  function hugeMushroom(ctx, x, y, s = 420, press = 0, grow = 1, tilt = 0) {
    if (grow <= 0) return;
    const H = s * 0.95 * grow, sw = s * 0.26, ch = s * 0.34 * (1 - press * 0.35), cw = s * (1 + press * 0.12);
    const r = rng(23);
    ctx.save(); ctx.translate(x, y); ctx.rotate(tilt);
    const stemH = Math.max(0, H - ch * 0.6) * (1 - press * 0.25);
    // ножка
    ctx.fillStyle = '#111'; ctx.fillRect(-sw / 2 - 5, -stemH - 5, sw + 10, stemH + 5);
    for (let j = 0; j * sw / 3 < stemH; j++) for (let i = 0; i < 3; i++) { const v = r(); ctx.fillStyle = v < 0.3 ? '#e2dccb' : v < 0.7 ? '#f2eee2' : '#d6cfba'; ctx.fillRect(-sw / 2 + i * sw / 3, -stemH + j * sw / 3, sw / 3 + 0.6, Math.min(sw / 3, stemH - j * sw / 3) + 0.6); }
    // шляпка
    const cy = -stemH - ch * 0.75;
    ctx.fillStyle = '#111'; ctx.fillRect(-cw / 2 - 6, cy - 6, cw + 12, ch + 12);
    ctx.fillRect(-cw * 0.36 - 6, cy - ch * 0.35 - 6, cw * 0.72 + 12, ch * 0.35 + 12);
    ctx.fillStyle = '#d6202a'; ctx.fillRect(-cw / 2, cy, cw, ch); ctx.fillRect(-cw * 0.36, cy - ch * 0.35, cw * 0.72, ch * 0.36);
    ctx.fillStyle = '#b3141e'; ctx.fillRect(-cw / 2, cy + ch * 0.72, cw, ch * 0.28);
    ctx.fillStyle = '#f04450'; ctx.fillRect(-cw * 0.36, cy - ch * 0.35, cw * 0.72, ch * 0.1);
    ctx.fillStyle = '#ffffff';
    for (const [dx, dy, k] of [[-0.36, 0.15, 1], [-0.08, -0.22, 0.9], [0.22, 0.12, 1.1], [0.4, -0.05, 0.7], [-0.22, 0.45, 0.7], [0.05, 0.42, 0.8]]) {
      const q = s * 0.06 * k; ctx.fillRect(dx * cw - q, cy + dy * ch + ch * 0.2 - q * 0.8, q * 2, q * 1.6);
    }
    ctx.restore();
    return y - stemH - ch * 0.75 - ch * 0.35;   // верх шляпки (без наклона)
  }
  // облачко спор: life 0..1
  function spores(ctx, x, y, life, size = 1, seed = 2, dir = 1) {
    if (life < 0 || life > 1) return;
    const r = rng(seed);
    ctx.save();
    for (let i = 0; i < 26; i++) {
      const a = (r() - 0.5) * 1.6 + (dir > 0 ? 0 : Math.PI), v = (120 + 260 * r()) * size, rr = (4 + 6 * r()) * size;
      const px = x + Math.cos(a) * v * life, py = y + Math.sin(a) * v * life * 0.7 + 60 * life * life;
      ctx.globalAlpha = Math.min(1, (1 - life) * 2) * 0.9;
      ctx.beginPath(); ctx.arc(px, py, rr, 0, TAU); ctx.fillStyle = i % 3 ? '#fff3c4' : '#ffd1d6'; ctx.fill();
      ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(120,80,40,0.6)'; ctx.stroke();
    }
    ctx.restore();
  }

  // бочка из майнкрафта сбоку: (x, y) — середина низа (стоя), s — высота, rot — наклон вокруг низа, lid — крышка открыта (0..1),
  // flip — вверх дном (бочку перевернули — накрыли сверху)
  function mcBarrel(ctx, x, y, s = 230, rot = 0, lid = 0, flip = false) {
    const w = s * 0.82, r = rng(57);
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
    ctx.fillStyle = '#111'; ctx.beginPath(); ctx.roundRect(-w / 2 - 5, -s - 5, w + 10, s + 10, 18); ctx.fill();
    ctx.save(); ctx.beginPath(); ctx.roundRect(-w / 2, -s, w, s, 14); ctx.clip();
    const n = 6;
    for (let i = 0; i < n; i++) { ctx.fillStyle = ['#8a5a2b', '#9c6a35', '#7a4d22'][i % 3]; ctx.fillRect(-w / 2 + i * w / n, -s, w / n + 1, s); ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(-w / 2 + (i + 1) * w / n - 3, -s, 3, s); }
    for (let k = 0; k < 10; k++) { ctx.fillStyle = 'rgba(60,35,12,0.35)'; ctx.fillRect(-w / 2 + r() * w, -s + r() * s, w * 0.08, 3); }
    // железные обручи
    for (const by of [0.12, 0.88]) { ctx.fillStyle = '#5c6268'; ctx.fillRect(-w / 2, -s * by - s * 0.05, w, s * 0.1); ctx.fillStyle = '#8a9096'; ctx.fillRect(-w / 2, -s * by - s * 0.05, w, s * 0.025); }
    ctx.restore();
    // крышка
    if (lid > 0) {
      ctx.save(); ctx.translate(-w / 2, -s); ctx.rotate(-lid * 1.9);
      ctx.fillStyle = '#111'; ctx.fillRect(-4, -s * 0.09 - 4, w + 8, s * 0.09 + 8);
      ctx.fillStyle = '#6b4520'; ctx.fillRect(0, -s * 0.09, w, s * 0.09);
      ctx.restore();
      ctx.fillStyle = '#2a1a0a'; ctx.fillRect(-w / 2 + 6, -s - 2, w - 12, 8);
    }
    ctx.restore();
  }
  // бочка на боку — вид с торца (круг из досок): центр (x, y), r — радиус, rot — поворот при качении
  function mcBarrelEnd(ctx, x, y, r = 110, rot = 0) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
    ctx.beginPath(); ctx.arc(0, 0, r + 5, 0, TAU); ctx.fillStyle = '#111'; ctx.fill();
    ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fillStyle = '#5c6268'; ctx.fill();
    ctx.beginPath(); ctx.arc(0, 0, r * 0.86, 0, TAU); ctx.save(); ctx.clip();
    for (let i = -4; i < 4; i++) { ctx.fillStyle = ['#8a5a2b', '#9c6a35', '#7a4d22'][(i + 4) % 3]; ctx.fillRect(i * r * 0.25, -r, r * 0.25 + 1, 2 * r); ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect((i + 1) * r * 0.25 - 3, -r, 3, 2 * r); }
    ctx.fillStyle = '#6b4520'; ctx.fillRect(-r * 0.12, -r * 0.12, r * 0.24, r * 0.24);
    ctx.restore();
    ctx.restore();
  }

  // лягушка из майнкрафта: (x, y) — середина низа, s — длина тела, face, squat — присела (0..1) / вытянулась (<0),
  // mouth — рот открыт (0..1); возвращает точку рта
  function mcFrog(ctx, x, y, s = 200, face = 1, squat = 0, mouth = 0) {
    const G = ['#d98a3a', '#c97a2c', '#e69b4a', '#b86c22'], r = rng(61);
    ctx.save(); ctx.translate(x, y); ctx.scale(face, 1);
    const k = 1 - squat * 0.25, bw = s, bh = s * 0.42 * k, L = s * 0.14 * (1 - squat * 0.6) + (squat < 0 ? -squat * s * 0.3 : 0);
    // задние лапы
    const box = (bx, by, w, h, c) => { ctx.fillStyle = '#111'; ctx.fillRect(bx - 4, by - 4, w + 8, h + 8); ctx.fillStyle = c; ctx.fillRect(bx, by, w, h); };
    box(-bw * 0.52, -L - bh * 0.35, bw * 0.3, bh * 0.35 + L, '#b86c22');
    box(-bw * 0.6, -s * 0.06, bw * 0.4, s * 0.06, '#a85e1a');
    box(bw * 0.18, -L, bw * 0.12, L, '#b86c22'); box(bw * 0.14, -s * 0.05, bw * 0.24, s * 0.05, '#a85e1a');
    // тело
    const top = -L - bh;
    ctx.fillStyle = '#111'; ctx.fillRect(-bw / 2 - 4, top - 4, bw + 8, bh + 8);
    for (let i = 0; i < 6; i++) for (let j = 0; j < 3; j++) { ctx.fillStyle = G[Math.floor(r() * 4)]; ctx.fillRect(-bw / 2 + i * bw / 6, top + j * bh / 3, bw / 6 + 0.6, bh / 3 + 0.6); }
    ctx.fillStyle = '#f2d6a2'; ctx.fillRect(-bw / 2, top + bh * 0.7, bw, bh * 0.3);
    // рот (нижняя челюсть открывается)
    const mo = mouth * bh * 0.5;
    if (mouth > 0) { ctx.fillStyle = '#111'; ctx.fillRect(bw * 0.05, top + bh * 0.5, bw * 0.45 + 4, mo + 4); ctx.fillStyle = '#8a1c2c'; ctx.fillRect(bw * 0.08, top + bh * 0.52, bw * 0.4, mo); }
    ctx.fillStyle = '#111'; ctx.fillRect(bw * 0.05, top + bh * 0.48 + mo, bw * 0.45 + 2, 4);
    // глаза на макушке
    for (const ex of [bw * 0.06, bw * 0.32]) {
      ctx.fillStyle = '#111'; ctx.fillRect(ex - 4, top - bh * 0.32 - 4, bw * 0.16 + 8, bh * 0.36 + 8);
      ctx.fillStyle = '#e69b4a'; ctx.fillRect(ex, top - bh * 0.32, bw * 0.16, bh * 0.36);
      ctx.fillStyle = '#ffffff'; ctx.fillRect(ex + bw * 0.02, top - bh * 0.26, bw * 0.12, bh * 0.2);
      ctx.fillStyle = '#111'; ctx.fillRect(ex + bw * 0.07, top - bh * 0.24, bw * 0.06, bh * 0.16);
    }
    ctx.restore();
    return [x + face * bw * 0.48, y + top + bh * 0.5];
  }
  // язык: толстая розовая лента от a до b с липким кончиком
  function frogTongue(ctx, a, b, w = 22) {
    ctx.save(); ctx.lineCap = 'round';
    for (const [lw, c] of [[w + 8, '#111'], [w, '#e8507a'], [w * 0.35, '#ff8fb0']]) { ctx.lineWidth = lw; ctx.strokeStyle = c; ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); }
    ctx.beginPath(); ctx.arc(b[0], b[1], w * 0.9, 0, TAU); ctx.fillStyle = '#e8507a'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = '#111'; ctx.stroke();
    ctx.restore();
  }

  // «вжух» — удар прошёл мимо: маленькое облачко
  function whoosh(ctx, x, y, life) {
    if (life < 0 || life > 1) return;
    for (let i = 0; i < 3; i++) {
      puff(ctx, x + (i - 1) * 26 * (1 + life), y + (i === 1 ? -14 : 6), 18 + 16 * ease(life), 0.85 * (1 - life), '#ffffff', '#a8a8a8');
    }
  }

  return { rng, background, mcBackground, limb, note, waterBalloon, basket, waterSplash, boomerang, flower, bubbleWand, soapBubble, bubblePop, snowball, snowPile, snowCap, snowSplat, snowBurst, slimeBlock, tomato, gardenBed, tomatoBush, tnt, fuseSparks, boom, soot, balloon, balloonPop, cactus, paintBucket, paintBrush, mustache, paintHole, paintSplash, waterJet, cobble, cloud, shadow, spark, dust, smoke, flash, rays, vein, steam, sweat, stars, twinkle, whoosh, puff,
    heart, hearts, wind, banana, giftBox, suck, drool, tree, apple, bubble, gumSplat, rainCloud, rain, lightning, puddle, seesaw,
    mudPit, mudSplash, rope, cake, crown, lollipop, tears, ball, pillow, feathers, bee, hive, table, pie, mcAppleTree, pumpkinBlock, blockBurst, mcChest, iceCream, scoopCap, iceBlock, frost, magicBeam, rails, grassSteps, minecart, kite, kiteString, popcorn, popcornPile, popBucket, cornCob, sunRay, pickaxe, grassBlock, pit, chili, chiliBush, fireBreath, flame, bigLeaf, pond, fish, fishingRod, fishLine, feather, sleepBubble, jumpCord, ropeHandle, marshmallow, mallowBag, slingshotY, slingBand, honeyPot, honeyCap, egg, chick, horseshoeMagnet, magnetWaves, anvil, coilSpring, rocket, rocketTrail, fireworkBurst, iceRink, iceSpray, deskFan, fanWind, melonBlock, melonHelmet, melonSlice, melonSeed, melonSplash, potion, potionBurst, effectSwirls, portal, fluff, cottonCandy, fluffBurst, mcBell, bellStand, soundRings, lemon, juiceSplash, sourLines, sandBlock, toyArrow, suctionMark, plunger, donut, donutRing, pizza, pizzaSlice, cheeseString, enderPearl, teleportPuff, cobweb, webWrap, webBall, webString, mcBed, snowBlock, snowGolem, yarnBall, yarnThread, yarnWrap, hayBale, hayBurst, hayStuck, berryBush, berry, prickle, mcCake, creamPuddle, piston, woodCrate, mcStick, mcCookie, plank, vacuum, vacHose, vacNozzle, airLines, rollingPin, dough, doughSheet, extinguisher, foamPile, foamJet, mcPig, mcCarrot, jelly, jellyPuddle, umbrella, sled, snowRamp, logPost, hammock, hammockWrap, hammockSheet, hammockRoll, gumBubble, gumPack, windmill, mcSheep, shears, mcSquid, inkPuddle, mcSlime, slimeBurst, mcCow, mcBucket, mcPuffer, mcChicken, yolk, noteBlock, noteBurst, hugeMushroom, spores, mcBarrel, mcBarrelEnd, mcFrog, frogTongue };
})();
