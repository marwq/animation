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

  // пиксельное облачко без обводки (белое, снизу светло-голубая полоса)
  function cloud(ctx, x, y, s, kind) {
    const u = 16 * s;
    const shapes = [
      [[2, 0, 4], [0, 1, 9]],
      [[1, 0, 3], [0, 1, 6]],
      [[0, 0, 2]],
    ];
    const rows = shapes[kind % shapes.length];
    ctx.fillStyle = '#ffffff';
    for (const [a, r, b] of rows) ctx.fillRect(x + a * u, y + r * u, b * u, u + 1);
    const last = rows[rows.length - 1];
    ctx.fillStyle = '#cfe1f6';
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

  return { rng, background, cloud, shadow, spark, dust, smoke, flash, rays, vein, steam, sweat, stars, twinkle, whoosh, puff,
    heart, hearts, wind, banana, giftBox, suck, drool, tree, apple, bubble, gumSplat, rainCloud, rain, lightning, puddle, seesaw,
    mudPit, mudSplash, rope, cake, crown, lollipop, tears, ball, pillow, feathers };
})();
