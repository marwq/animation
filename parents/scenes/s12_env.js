// Private helpers for SC 12: the BLOCK KING'S CASTLE (dark lilac stone, purple stepped roofs, crown banners, a glowing purple
// core window, a stone crown on the keep, an iron portcullis) that turns into Granny's COOKIE MUSEUM (museum 0..1: pink GG
// banners, warm windows, a cookie window, the gate opens on a red carpet + velvet ropes, the plaque changes), a giant cookie
// that lands on the keep, the stone crown that pops off, a water bottle prop, a clipped round portrait for toasts.
// Drawn in Tycoon Valley on the mushroom plot (x -2700…-1650) — it covers the plot's mushroom house.
'use strict';

const K = require('./kit');
const GS = require('./sets_game');
const G = require('./gameui');
const { S, f, clamp, lerp, ease, seg, hash, ol, ln, T, TF } = K;

const LINE = '#151515';
const tf = (x, y, s = 1, r = 0) => `translate(${f(x)} ${f(y)})${r ? ` rotate(${f(r)})` : ''}${s !== 1 ? ` scale(${f(s)})` : ''}`;
const R = (x, y, w, h, r = 0, a = {}) => S.rect(f(x), f(y), f(Math.max(0, w)), f(Math.max(0, h)), r, a);
const P = (d, a = {}) => (d ? S.path(d, a) : '');
const mixHex = (a, b, k) => {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16)), pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return '#' + pa.map((v, i) => Math.round(lerp(v, pb[i], clamp(k, 0, 1))).toString(16).padStart(2, '0')).join('');
};

// where the castle stands (world, k 1, Tycoon Valley)
const BK = { x: -2175, base: 760, front: { x: -1845, y: 930, s: 0.4 }, gate: { x: -2175, y: 760 }, keepTop: 760 - 470, cam: GS.camAt(-2175, 540, 0.92) };

// a stepped purple roof (3 bricks) + a pennant
function roofTower(cx, w, top, tn, t, col, flagCol, flagIcon) {
  let r = GS.brick(cx - w * 0.42, top - 90, w * 0.84, 46, 18, col, tn, { lw: 5, studs: 36 }) + GS.brick(cx - w * 0.28, top - 150, w * 0.56, 44, 16, col, tn, { lw: 5, studs: 34 }) + GS.brick(cx - w * 0.14, top - 204, w * 0.28, 40, 14, col, tn, { lw: 5 });
  const wv = Math.sin(t * 5 + cx) * 6;
  r += R(cx - 4, top - 330, 8, 130, 3, tn.ol('#E8EEF8', 3)) + P(`M${f(cx + 4)} ${f(top - 326)} Q${f(cx + 40)} ${f(top - 330 + wv)} ${f(cx + 84)} ${f(top - 318)} L${f(cx + 84)} ${f(top - 266)} Q${f(cx + 40)} ${f(top - 276 - wv)} ${f(cx + 4)} ${f(top - 272)} Z`, tn.ol(flagCol, 4));
  r += S.g(flagIcon, tf(cx + 44, top - 298, 1));
  return r;
}
const crownIcon = (s = 1) => S.g(P('M-20 8 L-22 -10 L-10 0 L0 -14 L10 0 L22 -10 L20 8 Z', { fill: '#FFD43B', stroke: LINE, 'stroke-width': 3, 'stroke-linejoin': 'round' }), `scale(${f(s)})`);
const cookieIcon = (s = 1) => S.g(S.circle(0, 0, 15, { fill: '#E0A35A', stroke: LINE, 'stroke-width': 3 }) + P('M-7 -6h5v5h-5Z M3 -2h5v5h-5Z M-3 5h5v5h-5Z', { fill: '#5A3018' }), `scale(${f(s)})`);

// the Block King's stone crown on the keep (k 1 = on; pops off with `pop` 0..1: flies up-left spinning)
function stoneCrown(x, y, tn, t, pop = 0) {
  if (pop >= 1) return '';
  let g = '';
  const B = GS.brickBatch(tn, { lw: 6 });
  B.add(-170, -40, 340, 70, 22, '#9A92C2', 0);
  for (const dx of [-170, -60, 50]) B.add(dx, -150, 110, 110, 20, '#A79FD0', 0);
  g += B.out();
  g += P('M-170 -150 L-115 -230 L-60 -150 M-60 -150 L-5 -250 L50 -150 M50 -150 L105 -230 L160 -150', { fill: 'none' });
  for (const [dx, h] of [[-115, -230], [-5, -250], [105, -230]]) g += P(`M${dx - 55} -148 L${dx} ${h} L${dx + 55} -148 Z`, tn.ol('#B3ABDA', 6));
  for (const [dx, col] of [[-115, '#C77DFF'], [-5, '#FF5FD2'], [105, '#C77DFF']]) g += P(`M${dx} -196 l18 22 l-18 22 l-18 -22 Z`, { fill: col, stroke: LINE, 'stroke-width': 4 });
  g += GS.glow(-5, -170, 120 + 10 * Math.sin(t * 3), 'gsGlowPurple', 0.5);
  const u = ease.in(clamp(pop, 0, 1));
  return S.g(g, `translate(${f(x - 900 * u)} ${f(y - 700 * u + 900 * u * u)}) rotate(${f(-200 * u)}) scale(${f(1 - 0.4 * u)})`);
}

// the castle. o: { museum 0..1, crownPop 0..1, gateOpen 0..1, t, sign: override text }
function bkCastle(tn, t, o = {}) {
  const X = BK.x, B = BK.base, mu = clamp(o.museum || 0, 0, 1);
  const stone = mixHex('#9088B8', '#C8BEDF', mu * 0.5), stoneD = mixHex('#6C6494', '#A99CC8', mu * 0.5), roof = mixHex('#6A3AB8', '#FF7FB8', mu);
  const flagCol = mixHex('#7A3AD8', '#FF8FC8', mu);
  const icon = mu < 0.5 ? crownIcon(0.9) : cookieIcon(1.1);
  let s = '';
  const merlons = (x0, x1, y, h = 34) => { const B2 = GS.brickBatch(tn, { lw: 5 }); const n = Math.max(2, Math.round((x1 - x0) / 56)); const w = (x1 - x0) / n; for (let i = 0; i < n; i += 2) B2.add(x0 + i * w, y - h, w, h, 14, stone, 30); return B2.out(); };
  const wall = (x0, x1, top, col = stone) => R(x0, top, x1 - x0, B - top, 4, tn.ol(col, 6)) + R(x0 + 3, top + 3, x1 - x0 - 6, B - top - 6, 0, { fill: 'url(#gsBrickBig)' }) + R(x0 + 3, B - 22, x1 - x0 - 6, 18, 0, tn.fl('#4A4270', 0.5));
  const winCol = mu < 0.5 ? '!#C77DFF' : '!#FFD27A';
  const tower = (x0, x1, top) => {
    let r = wall(x0, x1, top, stoneD) + R(x0 - 12, top - 14, x1 - x0 + 24, 22, 5, tn.ol(stone, 5)) + merlons(x0 - 12, x1 + 12, top - 14);
    r += roofTower((x0 + x1) / 2, x1 - x0, top, tn, t, roof, flagCol, icon);
    const cx = (x0 + x1) / 2;
    r += R(cx - 12, top + 60, 24, 70, 10, tn.ol(winCol, 3)) + R(cx - 12, top + 200, 24, 70, 10, tn.ol(winCol, 3));
    return r;
  };
  // a stone plinth along the foot (also hides the mushroom house that stands on this plot)
  s += R(X - 640, B - 30, 1280, 64, 8, tn.ol(stoneD, 6));
  // curtain walls with spikes (the Block King liked spikes)
  s += wall(X - 600, X - 380, B - 210) + merlons(X - 600, X - 380, B - 210) + wall(X + 380, X + 600, B - 210) + merlons(X + 380, X + 600, B - 210);
  s += tower(X - 390, X - 200, B - 580) + tower(X + 200, X + 390, B - 580);
  // the keep
  const KT = B - 470;
  s += wall(X - 210, X + 210, KT, stone) + R(X - 222, KT - 14, 444, 24, 5, tn.ol(stoneD, 5)) + merlons(X - 222, X + 222, KT - 14);
  // the core window: a glowing purple crystal (museum: a cookie in a round window)
  const wy = KT + 105;
  s += S.circle(X, wy, 80, tn.ol(mu < 0.5 ? '#2A1A4A' : '!#FFF0C8', 8));
  if (mu < 0.5) {
    s += P(`M${X} ${wy - 64} L${X + 40} ${wy} L${X} ${wy + 64} L${X - 40} ${wy} Z`, { fill: '#C77DFF', stroke: LINE, 'stroke-width': 5 }) + P(`M${X} ${wy - 64} L${X + 12} ${wy} L${X} ${wy + 64}`, { fill: 'none', stroke: '#F0D8FF', 'stroke-width': 4 });
    s += GS.glow(X, wy, 170 + 12 * Math.sin(t * 4), 'gsGlowPurple', 0.75 * (1 - mu * 2));
  } else {
    s += S.circle(X, wy, 62, { fill: '#E0A35A', stroke: LINE, 'stroke-width': 5 }) + P(`M${X - 28} ${wy - 26}h20v20h-20Z M${X + 10} ${wy - 6}h20v20h-20Z M${X - 12} ${wy + 20}h18v18h-18Z`, { fill: '#5A3018' });
    s += GS.glow(X, wy, 170, 'gsGlowWarm', 0.5 * (mu - 0.5) * 2);
  }
  s += P(`M${X - 80} ${wy} H${X + 80} M${X} ${wy - 80} V${wy + 80}`, { fill: 'none', stroke: LINE, 'stroke-width': 6, opacity: mu < 0.5 ? 0.0 : 0.6 });
  // banners hanging from the keep's top (crown -> cookie)
  for (const bx of [X - 150, X + 150]) {
    s += P(`M${bx - 40} ${KT + 10} H${bx + 40} V${KT + 170} L${bx} ${KT + 144} L${bx - 40} ${KT + 170} Z`, tn.ol(flagCol, 5)) + R(bx - 48, KT + 2, 96, 16, 5, tn.ol('#FFD43B', 4)) + S.g(icon, tf(bx, KT + 80, 1.3));
  }
  // the gate: an iron portcullis (lifts with gateOpen / museum) in a dark arch
  const gOpen = clamp(Math.max(o.gateOpen || 0, mu), 0, 1);
  const gD = `M${X - 100} ${B} V${B - 116} A100 100 0 0 1 ${X + 100} ${B - 116} V${B} Z`;
  s += P(gD, tn.ol(mu < 0.5 ? '#1E1630' : '#FFE9C8', 7));
  if (mu >= 0.5) s += P(`M${X - 70} ${B} L${X - 40} ${B - 150} H${X + 40} L${X + 70} ${B} Z`, tn.fl('#E8505A'));
  const py = -200 * ease.inOut(gOpen);
  // the portcullis slides up into the wall: only the part inside the arch is drawn
  let bars = '';
  const y0 = B - 196, y1 = B + py;
  if (y1 > y0 + 8) {
    for (let i = -3; i <= 3; i++) { const yt = Math.abs(i) === 3 ? y0 + 60 : Math.abs(i) === 2 ? y0 + 22 : y0; if (y1 > yt) bars += `M${X + i * 26} ${f(yt)} V${f(y1)} `; }
    for (const yy of [B - 150 + py, B - 80 + py]) if (yy > y0 + 30 && yy < y1) bars += `M${X - 92} ${f(yy)} H${X + 92} `;
  }
  if (bars) s += S.g(P(bars, { fill: 'none', stroke: '#3A3450', 'stroke-width': 10, 'stroke-linecap': 'round' }) + P(bars, { fill: 'none', stroke: '#8A86A0', 'stroke-width': 4 }), null, {});
  s += P(gD, { fill: 'none', stroke: LINE, 'stroke-width': 7 });
  // the plaque over the gate
  const plq = o.sign || (mu < 0.5 ? "BLOCK KING'S CASTLE" : 'COOKIE MUSEUM');
  const pw = plq.length * 27 + 70;
  s += S.g(R(-pw / 2, -44, pw, 88, 18, tn.ol(mu < 0.5 ? '#4A2A7A' : '#FF8FC8', 7)) + R(-pw / 2 + 10, -34, pw - 20, 68, 12, { fill: 'none', stroke: mu < 0.5 ? '#C77DFF' : '#FFFFFF', 'stroke-width': 4 }) + T(plq, 0, 16, 46, mu < 0.5 ? '#E9D8FF' : '#FFFFFF', { stroke: LINE, 'stroke-width': 7, 'paint-order': 'stroke' }), tf(X, B - 242, 1));
  // museum extras: velvet ropes + a red carpet in front of the gate
  if (mu > 0.5) {
    const k = (mu - 0.5) * 2;
    s += S.g(P(`M${X - 80} ${B + 4} L${X - 130} ${B + 220} H${X + 130} L${X + 80} ${B + 4} Z`, tn.ol('#E8505A', 5)), null, { opacity: f(k) });
    for (const sx of [-1, 1]) {
      let posts = '';
      for (let i = 0; i < 3; i++) posts += S.rect(X + sx * (180 + 60 * i) - 8, B + 40 + 60 * i, 16, 90, 6, tn.ol('#FFD43B', 4)) + S.circle(X + sx * (180 + 60 * i), B + 40 + 60 * i, 14, tn.ol('#FFD43B', 4));
      s += S.g(posts + P(`M${X + sx * 180} ${B + 60} Q${X + sx * 210} ${B + 120} ${X + sx * 240} ${B + 120} Q${X + sx * 270} ${B + 180} ${X + sx * 300} ${B + 180}`, { fill: 'none', stroke: '#C0182A', 'stroke-width': 10, 'stroke-linecap': 'round' }), null, { opacity: f(k) });
    }
  }
  return s;
}

// a water bottle (s 1 ≈ 140 tall), centre at (x, y)
function waterBottle(x, y, s = 1, rot = 0) {
  let g = S.rect(-34, -70, 68, 140, 18, ol('#7FD6FF', 6)) + S.rect(-34, -10, 68, 40, 0, { fill: '#FFFFFF', opacity: 0.85 }) + S.rect(-34, -10, 68, 40, 0, { fill: 'none', stroke: '#151515', 'stroke-width': 4 });
  g += TF('H2O', 0, 20, 26, '#2E7BFF') + S.rect(-20, -96, 40, 30, 8, ol('#2E7BFF', 5)) + S.rect(-22, -60, 12, 46, 6, { fill: '#FFFFFF', opacity: 0.55 });
  return S.g(g, tf(x, y, s, rot));
}

// a round portrait for a joinToast icon (100-unit circle): any svg drawn around (0,0), clipped to r 46
function roundIcon(inner, id, bg = '#FFD6EC') {
  return `<clipPath id="${id}"><circle cx="0" cy="0" r="46"/></clipPath>` + S.circle(0, 0, 46, { fill: bg }) + S.g(inner, null, { 'clip-path': `url(#${id})` });
}

module.exports = { BK, bkCastle, stoneCrown, waterBottle, roundIcon, crownIcon, cookieIcon, mixHex };
