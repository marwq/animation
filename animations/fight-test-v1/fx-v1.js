// Оформление в стиле «Animation Battles»: фон под Minecraft, полоски здоровья с
// портретами, вспышки ударов, пыль, звёздочки над головой.
'use strict';

const FX = (() => {
  // детерминированный «рандом», чтобы каждый рендер был одинаковым
  const rng = (seed) => () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);

  // небо + земля из блоков травы и земли (с запасом по краям для тряски камеры)
  function background(w, h, ground, margin = 60) {
    const c = document.createElement('canvas');
    c.width = w + 2 * margin; c.height = h + 2 * margin;
    const g = c.getContext('2d');
    const gy = ground + margin;
    const sky = g.createLinearGradient(0, 0, 0, gy);
    sky.addColorStop(0, '#7fb0ee'); sky.addColorStop(1, '#d4e7fb');
    g.fillStyle = sky; g.fillRect(0, 0, c.width, gy + 2);
    const B = 26, r = rng(7);
    const greens = ['#5aa437', '#6cbb40', '#7fcb4a', '#8fd655', '#4f9a33'];
    const dirt = ['#7b5230', '#8b5e36', '#6c4628', '#946640', '#5c3b22'];
    for (let x = 0; x < c.width; x += B) {
      const depth = 2 + Math.floor(r() * 2.6);
      for (let y = gy - B * 0.4, row = 0; y < c.height; y += B, row++) {
        const pal = row < depth ? greens : dirt;
        g.fillStyle = pal[Math.floor(r() * pal.length)];
        g.fillRect(x, Math.round(y), B, B);
      }
    }
    // светлая кромка травы сверху
    g.fillStyle = 'rgba(255,255,255,0.18)';
    g.fillRect(0, gy - B * 0.4, c.width, 5);
    return { canvas: c, margin };
  }

  // пиксельное облако из прямоугольников
  function cloud(ctx, x, y, s) {
    const rows = [[2, 6], [0, 10], [1, 9]];
    const u = 22 * s;
    ctx.fillStyle = 'rgba(255,255,255,0.95)';
    rows.forEach(([a, b], i) => ctx.fillRect(x + a * u, y + i * u, (b - a) * u, u + 1));
    ctx.fillStyle = 'rgba(210,225,245,0.9)';
    ctx.fillRect(x + 1 * u, y + 3 * u - 0.35 * u, 8 * u, 0.35 * u);
  }

  // портрет для полоски здоровья: голова персонажа в круге
  function portrait(ch, size, bg) {
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const g = c.getContext('2d');
    g.fillStyle = bg; g.beginPath(); g.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2); g.fill();
    g.save(); g.clip();
    const st = ch.pose({ x: 0, y: 0, facing: 1 }, { ground: 0 });
    const head = ch.layers.find((l) => l.name === 'head') || ch.layers.find((l) => l.name === 'body');
    const hb = head.bbox;
    const hw = Math.max(hb[2] - hb[0], hb[3] - hb[1]) * ch.scale;
    const k = (size * 0.9) / hw;
    const center = E.apply(st.G, [(hb[0] + hb[2]) / 2, (hb[1] + hb[3]) / 2]);
    const cam = [k, 0, 0, k, size / 2 - center[0] * k, size / 2 - center[1] * k + size * 0.06];
    ch.draw(g, st, cam);
    g.restore();
    g.setTransform(1, 0, 0, 1, 0, 0);
    return c;
  }

  // полоска здоровья: голубое — осталось, красное — потеряно (со стороны портрета)
  function hud(ctx, w, left, right) {
    const R = 78, PAD = 22, BH = 50;
    const bar = (side, hp) => {
      const x0 = side < 0 ? PAD + 2 * R - 16 : w - PAD - 2 * R + 16 - 640;
      const y = PAD + 24;
      ctx.lineWidth = 7; ctx.strokeStyle = '#111';
      ctx.beginPath(); ctx.roundRect(x0, y, 640, BH, BH / 2); ctx.fillStyle = '#e3242b'; ctx.fill();
      const fw = Math.max(0, Math.min(1, hp / 100)) * 640;
      ctx.save(); ctx.beginPath(); ctx.roundRect(x0, y, 640, BH, BH / 2); ctx.clip();
      ctx.fillStyle = '#69ccf3';
      if (side < 0) ctx.fillRect(x0 + 640 - fw, y, fw, BH); else ctx.fillRect(x0, y, fw, BH);
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.fillRect(x0, y + 6, 640, 7);
      ctx.restore();
      ctx.beginPath(); ctx.roundRect(x0, y, 640, BH, BH / 2); ctx.stroke();
    };
    const face = (side, img) => {
      const cx = side < 0 ? PAD + R : w - PAD - R, cy = PAD + R - 4;
      ctx.drawImage(img, cx - R, cy - R, 2 * R, 2 * R);
      ctx.lineWidth = 9; ctx.strokeStyle = '#111';
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.stroke();
    };
    bar(-1, left.hp); bar(1, right.hp);
    face(-1, left.img); face(1, right.img);
  }

  function star(ctx, x, y, n, r1, r2, rot = 0) {
    ctx.beginPath();
    for (let i = 0; i < 2 * n; i++) {
      const r = i % 2 ? r2 : r1, a = rot + (i * Math.PI) / n - Math.PI / 2;
      ctx.lineTo(x + r * Math.cos(a), y + r * Math.sin(a));
    }
    ctx.closePath();
  }

  // вспышка удара: жёлтая звезда с белой серединой; life 0..1
  function burst(ctx, x, y, r, life, rot) {
    if (life < 0 || life > 1) return;
    const s = life < 0.2 ? E.EASE.out(life / 0.2) * 1.15 : 1.15 - (life - 0.2) * 0.35;
    ctx.save();
    ctx.globalAlpha = life < 0.55 ? 1 : 1 - (life - 0.55) / 0.45;
    ctx.lineJoin = 'round';
    star(ctx, x, y, 11, r * s, r * s * 0.52, rot);
    ctx.fillStyle = '#ffd21f'; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = '#111'; ctx.stroke();
    star(ctx, x, y, 11, r * s * 0.55, r * s * 0.3, rot + 0.15);
    ctx.fillStyle = '#fff'; ctx.fill();
    ctx.restore();
  }

  // клубы пыли от приземления
  function dust(ctx, x, y, r, life, n = 7, seed = 1) {
    if (life < 0 || life > 1) return;
    const rr = rng(seed);
    ctx.save();
    ctx.globalAlpha = 1 - life;
    for (let i = 0; i < n; i++) {
      const dir = (i / (n - 1) - 0.5) * 2;               // -1..1: влево-вправо
      const sp = 0.6 + rr() * 0.6;
      const px = x + dir * r * 2.2 * E.EASE.out(life) * sp;
      const py = y - (10 + rr() * 30) * E.EASE.out(life) - rr() * 10;
      const pr = r * (0.35 + 0.45 * E.EASE.out(life)) * (0.7 + rr() * 0.5);
      ctx.beginPath(); ctx.arc(px, py, pr, 0, Math.PI * 2);
      ctx.fillStyle = '#efe9df'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = '#3a3530'; ctx.stroke();
    }
    ctx.restore();
  }

  // звёздочки, кружащие над головой оглушённого
  function dizzy(ctx, x, y, t, r = 60) {
    for (let i = 0; i < 3; i++) {
      const a = t * 5 + (i * 2 * Math.PI) / 3;
      const px = x + Math.cos(a) * r, py = y + Math.sin(a) * r * 0.35;
      star(ctx, px, py, 5, 17, 7.5, a);
      ctx.fillStyle = '#ffe23a'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = '#111'; ctx.lineJoin = 'round'; ctx.stroke();
    }
  }

  // «дзынь» — улетевший персонаж сверкнул в небе
  function twinkle(ctx, x, y, life) {
    if (life < 0 || life > 1) return;
    const s = Math.sin(Math.PI * life) * 46;
    ctx.save();
    star(ctx, x, y, 4, s, s * 0.22, life * 2);
    ctx.fillStyle = '#fff'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = '#111'; ctx.stroke();
    ctx.restore();
  }

  function shadow(ctx, x, y, w, alpha) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#1d3b12';
    ctx.beginPath(); ctx.ellipse(x, y, w, w * 0.16, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  return { rng, background, cloud, portrait, hud, burst, dust, dizzy, twinkle, shadow, star };
})();
