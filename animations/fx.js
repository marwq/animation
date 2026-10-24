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
    }[kind];
    const th = kind === 'spruce' ? 2 : kind === 'jungle' ? 6 + Math.floor(r() * 3) : 3 + Math.floor(r() * 2);
    const cells = [];
    for (let i = 0; i < th; i++) cells.push([0, i, kind === 'birch' && r() < 0.3 ? pal.trunk[1] : pal.trunk[i % 2 ? 1 : 0]]);
    const leaf = (cx, cy) => { const v = r(); cells.push([cx, cy, pal.leaf[v < 0.55 ? 0 : v < 0.8 ? 1 : 2]]); };
    if (kind === 'spruce') {
      let y = th;
      for (const w of [2, 1, 2, 1, 1, 0, 0]) { for (let cx = -w; cx <= w; cx++) leaf(cx, y); y++; }
    } else {
      const w = kind === 'jungle' ? 3 : 2, top = th;
      for (let cy = top - 1; cy < top + 2; cy++) for (let cx = -w; cx <= w; cx++) if (!(Math.abs(cx) === w && cy === top - 1 && r() < 0.6)) leaf(cx, cy);
      for (let cx = -1; cx <= 1; cx++) leaf(cx, top + 2);
      if (r() < 0.6) leaf(0, top + 3);
      if (kind === 'cherry') for (let cx = -w - 1; cx <= w + 1; cx += 2 * w + 2) if (r() < 0.7) leaf(cx, top);   // лепестки свисают
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

  function mcBackground(w, h, edge, opts = {}) {
    const T = { ...MC_THEMES[opts.theme || 'meadow'], ...(opts.override || {}) };
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
    hills(T.hills[0], edge - 70, 230, 40, (opts.seed || 7) + 1);
    hills(T.hills[1], edge - 20, 120, 32, (opts.seed || 7) + 2);
    // деревья вдали: дальний ряд (меньше, в дымке) и ближний
    const rows = [[0.55, 17, 9 + Math.floor(r() * 3)], [0.2, 27, 5 + Math.floor(r() * 3)]];
    for (const [haze, B, n] of rows) {
      const xs = [];
      for (let i = 0; i < n; i++) xs.push(-60 + (i + 0.2 + r() * 0.6) * (w + 120) / n);
      for (const x of xs) mcTree(g, T.trees[Math.floor(r() * T.trees.length)], x, edge + 2, B, r, haze, T.sky[2]);
    }
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

  // «вжух» — удар прошёл мимо: маленькое облачко
  function whoosh(ctx, x, y, life) {
    if (life < 0 || life > 1) return;
    for (let i = 0; i < 3; i++) {
      puff(ctx, x + (i - 1) * 26 * (1 + life), y + (i === 1 ? -14 : 6), 18 + 16 * ease(life), 0.85 * (1 - life), '#ffffff', '#a8a8a8');
    }
  }

  return { rng, background, mcBackground, limb, note, waterBalloon, basket, waterSplash, boomerang, flower, bubbleWand, soapBubble, bubblePop, cloud, shadow, spark, dust, smoke, flash, rays, vein, steam, sweat, stars, twinkle, whoosh, puff,
    heart, hearts, wind, banana, giftBox, suck, drool, tree, apple, bubble, gumSplat, rainCloud, rain, lightning, puddle, seesaw,
    mudPit, mudSplash, rope, cake, crown, lollipop, tears, ball, pillow, feathers, bee, hive, table, pie };
})();
