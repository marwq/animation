// Private helpers for SC 01 (cold open) and SC 12 (after + finale + end screen): text, pops, camera maths, transitions
// (whip, smash, freeze frame, zoom lines), a picture-in-picture "real life" cam, fireworks, chat-style bubbles, and the
// peaceful NIGHT CUBE CITY panorama with the giant leaderboard billboard (sets_game's cityNight is the Block King attack —
// fires everywhere — so the cold open builds its own calm night from the exported set helpers).
'use strict';

const K = require('./kit');
const GS = require('./sets_game');
const G = require('./gameui');
const { S, f, clamp, lerp, ease, seg, bump, hash, ol, ln, T, TF } = K;

const LINE = '#151515';
const W = 1920, H = 1080;
const mod = (a, n) => ((a % n) + n) % n;
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const tf = (x, y, s = 1, r = 0) => `translate(${f(x)} ${f(y)})${r ? ` rotate(${f(r)})` : ''}${s !== 1 ? ` scale(${f(s)})` : ''}`;
const TS = (txt, x, y, size, fill, extra = {}) => T(esc(txt), x, y, size, fill, { stroke: LINE, 'stroke-width': size * 0.16, 'paint-order': 'stroke', 'stroke-linejoin': 'round', ...extra });
const TFS = (txt, x, y, size, fill, extra = {}) => TF(esc(txt), x, y, size, fill, { stroke: LINE, 'stroke-width': size * 0.14, 'paint-order': 'stroke', 'stroke-linejoin': 'round', ...extra });
const pop = (t, t0, d = 0.28) => ease.outBack(seg(t, t0, t0 + d));
const at = (wx, wy, zoom = 1) => ({ zoom, x: wx - 960, y: wy - 540 });
// world point (parallax 1) -> screen
const toScr = (cam, x, y) => { const z = cam.zoom ?? 1; return [960 + (cam.sx || 0) + z * (x - 960 - (cam.x || 0)), 540 + (cam.sy || 0) + z * (y - 540 - (cam.y || 0))]; };
function shakeAll(cam, t, list) {
  for (const [t0, d, a] of list) { const s = K.shake(t, t0, d, a); cam.sx = (cam.sx || 0) + s.sx; cam.sy = (cam.sy || 0) + s.sy; }
  return cam;
}
const zoomAbout = (svg, cx, cy, z) => (Math.abs(z - 1) < 1e-4 ? svg : S.g(svg, `translate(${f(cx)} ${f(cy)}) scale(${f(z)}) translate(${f(-cx)} ${f(-cy)})`));
// squash/stretch impulse after t0 -> { sx, sy }
function boing(t, t0, amp = 0.2, dur = 0.7) {
  const k = t - t0;
  if (k < 0 || k > dur) return { sx: 1, sy: 1 };
  const v = amp * Math.exp(-k * 7) * Math.cos(k * 20);
  return { sx: 1 - v * 0.6, sy: 1 + v };
}
const blinkV = (t, seed = 0) => { const u = mod(t + seed * 0.37, 3.7); return u < 0.12 ? Math.sin((u / 0.12) * Math.PI) : 0; };

// ---------------------------------------------------------------- transitions
// whip-pan streaks + white veil around a cut at tc
function whip(t, tc, dir = 1, dur = 0.12) {
  const d = t - tc;
  if (Math.abs(d) > dur) return '';
  const k = 1 - Math.abs(d) / dur;
  let p = '';
  for (let i = 0; i < 16; i++) {
    const y = hash(i * 3.7) * H, len = 300 + hash(i) * 700, th = 8 + hash(i * 2.2) * 16;
    const x = mod(hash(i * 5.1) * 2600 + dir * d * 16000, 2600) - 400;
    p += `M${f(x)} ${f(y)}h${f(len)}v${f(th)}h${f(-len)}Z`;
  }
  return S.rect(0, 0, W, H, 0, { fill: '#FFFFFF', opacity: f(0.55 * k) }) + S.path(p, { fill: '#FFFFFF', opacity: f(0.85 * k) });
}
const smash = (t, tc, dur = 0.14, a = 0.75) => (t >= tc && t < tc + dur ? K.C.whiteFlash(a * (1 - (t - tc) / dur)) : '');
const fadeBlack = (k) => (k > 0.002 ? S.rect(0, 0, W, H, 0, { fill: '#05030F', opacity: f(clamp(k, 0, 1)) }) : '');
// radial zoom lines around (cx, cy)
function zoomLines(cx, cy, k, t, col = '#FFFFFF', n = 22, r0 = 380) {
  if (k <= 0) return '';
  let d = '';
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + hash(i * 3.1) * 0.2, rr = r0 + hash(i + Math.floor(t * 12)) * 160, r1 = rr + 700;
    const w = 10 + hash(i * 1.7) * 14;
    const ax = Math.cos(a), ay = Math.sin(a), nx = -ay * w, ny = ax * w;
    d += `M${f(cx + ax * rr)} ${f(cy + ay * rr)}L${f(cx + ax * r1 + nx)} ${f(cy + ay * r1 + ny)}L${f(cx + ax * r1 - nx)} ${f(cy + ay * r1 - ny)}Z`;
  }
  return S.path(d, { fill: col, opacity: f(0.7 * k) });
}
// horizontal speed streaks (k 0..1)
function streaks(k, seed = 1, col = '#FFFFFF', y0 = 0, y1 = H) {
  if (k <= 0.01) return '';
  let p = '';
  for (let i = 0; i < 14; i++) {
    const y = y0 + hash(i * 3.7 + seed) * (y1 - y0), len = 400 + hash(i + seed) * 900, th = 6 + hash(i * 2.2 + seed) * 14;
    const x = hash(i * 5.1 + seed) * 2400 - 300;
    p += `M${f(x)} ${f(y)}h${f(len)}v${f(th)}h${f(-len)}Z`;
  }
  return S.path(p, { fill: col, opacity: f(0.6 * k) });
}
// a still photo: the frame shrinks into a white-bordered print, tilted, on a dark ground (k 0..1)
function freezeFrame(svg, k, o = {}) {
  if (k <= 0) return svg;
  const sc = lerp(1, o.scale ?? 0.86, k), rot = lerp(0, o.rot ?? -3, k);
  let g = S.rect(-18, -18, W + 36, H + 36, 8, { fill: '#FFFFFF' }) + svg;
  if (o.tint !== false) g += S.rect(0, 0, W, H, 0, { fill: o.tintCol || '#E8D8B8', opacity: f((o.tintK ?? 0.22) * k) });
  return S.rect(0, 0, W, H, 0, { fill: o.bg || '#1A1230' }) + S.g(g, `translate(960 540) rotate(${f(rot)}) scale(${f(sc)}) translate(-960 -540)`);
}

// ---------------------------------------------------------------- picture-in-picture "REAL LIFE" cam
// inner = a full 1920x1080 frame; (vx, vy, vw) = the crop of it shown (16:9) in a w x h box at (x, y) = top-left.
function pip(inner, x, y, w, k, o = {}) {
  if (k <= 0.01) return '';
  const h = w * 9 / 16;
  const vx = o.vx ?? 0, vy = o.vy ?? 0, vw = o.vw ?? W, vh = vw * 9 / 16;
  const sc = ease.outBack(clamp(k, 0, 1));
  const cx = x + w / 2, cy = y + h / 2;
  let g = S.rect(x + 12, y + 16, w, h, 26, { fill: '#000', opacity: 0.35 });
  g += S.el('svg', { x, y, width: w, height: h, viewBox: `${f(vx)} ${f(vy)} ${f(vw)} ${f(vh)}`, preserveAspectRatio: 'xMidYMid slice' }, inner);
  g += S.rect(x, y, w, h, 26, { fill: 'none', stroke: '#FFFFFF', 'stroke-width': 14 }) + S.rect(x, y, w, h, 26, { fill: 'none', stroke: LINE, 'stroke-width': 5 });
  const lab = o.label || 'REAL LIFE';
  const lw = lab.length * 17 + 74;
  g += S.g(S.rect(0, -27, lw, 50, 18, ol(o.labelCol || '#FF4B5C', 5)) + S.circle(28, -2, 9, { fill: '#FFFFFF', opacity: f(0.55 + 0.45 * Math.sin((o.t || 0) * 8)) }) + TF(esc(lab), 48, 9, 28, '#FFFFFF', { 'text-anchor': 'start', 'letter-spacing': 1 }), tf(x + 18, y - 4, 1, -3));
  return S.g(g, `translate(${f(cx)} ${f(cy)}) scale(${f(sc)}) translate(${f(-cx)} ${f(-cy)})`, k < 0.3 ? { opacity: f(k / 0.3) } : {});
}

// ---------------------------------------------------------------- fireworks (cheap: one path per burst)
const FW_COLS = ['#FFD43B', '#FF5FA8', '#5CE1FF', '#7CFF6B', '#FFFFFF', '#FF8A2B'];
function firework(x, y, age, seed = 1, o = {}) {
  const life = o.life || 1.3;
  if (age < 0 || age > life) return '';
  const r = (o.r || 190) * ease.out(clamp(age / (life * 0.7), 0, 1)), n = o.n || 14;
  const fall = 60 * age * age;
  const col = o.col || FW_COLS[Math.floor(hash(seed * 7.7) * FW_COLS.length)];
  let d = '', dots = '';
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + hash(seed) * 2, c = Math.cos(a), s = Math.sin(a);
    const x1 = x + c * r, y1 = y + s * r + fall, x0 = x + c * r * 0.72, y0 = y + s * r * 0.72 + fall * 0.8;
    d += `M${f(x0)} ${f(y0)}L${f(x1)} ${f(y1)}`;
    dots += `M${f(x1 - 6)} ${f(y1)}a6 6 0 1 0 12 0a6 6 0 1 0 -12 0`;
  }
  const op = 1 - seg(age, life * 0.55, life);
  let g = S.path(d, { fill: 'none', stroke: col, 'stroke-width': 7, 'stroke-linecap': 'round', opacity: f(op) }) + S.path(dots, { fill: '#FFFFFF', opacity: f(op) });
  if (age < 0.14) g += S.circle(x, y, 40 * (1 - age / 0.14) + 10, { fill: '#FFFFFF', opacity: f(0.9 * (1 - age / 0.14)) });
  return g;
}
// a rising rocket trail then the burst at (x, y): t0 = burst time
function rocket(t, x, y, t0, seed = 1, o = {}) {
  let g = '';
  const up = 0.45;
  if (t > t0 - up && t < t0) {
    const u = seg(t, t0 - up, t0), yy = lerp(y + 520, y, ease.out(u));
    g += S.path(`M${f(x)} ${f(yy)} L${f(x)} ${f(yy + 90)}`, { stroke: '#FFE9A8', 'stroke-width': 8, 'stroke-linecap': 'round', opacity: 0.8 }) + S.circle(x, yy, 9, { fill: '#FFFFFF' });
  }
  return g + firework(x, y, t - t0, seed, o);
}

// ---------------------------------------------------------------- small UI bits
// a comment-section card ("Tell me in the comments!"): typed text, heart pops on `heart`
function commentCard(x, y, k, o = {}) {
  if (k <= 0.01) return '';
  const w = o.w || 760, h = 170, typed = clamp(o.typed ?? 1, 0, 1);
  const txt = o.text || 'my dad. 100%';
  const shown = txt.slice(0, Math.round(txt.length * typed));
  let g = S.rect(10, 14, w, h, 28, { fill: '#000', opacity: 0.3 }) + S.rect(0, 0, w, h, 28, ol('#FFFFFF', 7));
  g += S.circle(70, 64, 40, ol(o.avCol || '#FF8A2B', 5)) + TF('?', 70, 80, 46, '#FFFFFF');
  g += TF(esc(o.user || '@you_the_viewer'), 130, 50, 28, '#7A7F92', { 'text-anchor': 'start' });
  g += TF(esc(shown) + (typed < 1 && mod(Math.floor((o.t || 0) * 4), 2) ? '|' : ''), 130, 100, 42, '#151515', { 'text-anchor': 'start' });
  g += S.path('M136 128 H' + (w - 30), ln(4, '#E1E4EC'));
  const hk = pop(o.t || 0, o.heartAt ?? 1e9, 0.3);
  g += S.g(G.heart(0, 0, 22, '#FF4B5C', 4), tf(w - 60, 64, 0.8 + 0.6 * hk));
  if (hk > 0) g += TF('1', w - 26, 76, 30, '#FF4B5C', { 'text-anchor': 'middle' });
  g += S.rect(w - 210, 136, 160, 0.1, 0, { fill: 'none' });
  return S.g(g, `translate(${f(x)} ${f(y)}) scale(${f(ease.outBack(k))})`);
}
// rounded label pill
function pill(x, y, txt, size, fill, ink = '#FFFFFF', o = {}) {
  const w = o.w || txt.length * size * 0.58 + size * 1.2, h = size * 1.45;
  return S.g(S.rect(-w / 2 + 6, -h / 2 + 8, w, h, h * 0.4, { fill: '#000', opacity: 0.3 }) + S.rect(-w / 2, -h / 2, w, h, h * 0.4, ol(fill, o.lw || 6)) + TF(esc(txt), 0, size * 0.36, size, ink, o.stroke ? { stroke: LINE, 'stroke-width': size * 0.14, 'paint-order': 'stroke' } : {}), tf(x, y, o.s || 1, o.rot || 0));
}

// ================================================================= NIGHT CUBE CITY (calm night: no fires)
// Rows (back → front): sky k0 · moon k.02 · clouds k.06 · far skyline k.18 · landmarks + party searchlights k.3 ·
// THE LEADERBOARD BILLBOARD (o.board svg, drawn at k.38 around world (o.bx, o.by)) · mid row k.5 (lit buildings, the CUBE CITY
// plaza) · front row k.75 · rooftop ledge k1 (stand line 990, s .45).
const NC_MID = [
  [-760, 300, 340, '#B9C8FF', ''], [-430, 260, 420, '#FFC8B0', 'PETS'], [-120, 300, 300, '#B8F0D8', ''], [175, 260, 250, '#D8C2FF', 'OBBY'], [450, 250, 330, '#FFE0A0', 'PIZZA'],
  [1460, 250, 320, '#F6B6D6', 'SHOP'], [1730, 270, 250, '#A8E6FF', ''], [2040, 260, 400, '#FFC8B0', 'GAMES'], [2340, 300, 300, '#B9C8FF', ''], [2660, 280, 380, '#D8C2FF', 'PETS'],
];
const NC_FRONT = [[-380, 420, 620, '#8E7AD0'], [2300, 420, 640, '#7AC8A8'], [-900, 380, 560, '#E0A070'], [2800, 380, 600, '#8E7AD0']];
const V = (cam, svg, k) => (svg ? S.g(svg, GS.camTf(cam || {}, k)) : '');

function farArena(x, base, s, tn) {
  let o = S.path('M-300 0 L-300 -120 Q0 -170 300 -120 L300 0 Z', tn.ol('#E8C9A0', 5));
  let a = '';
  for (let i = 0; i < 9; i++) a += `M${-270 + i * 62} -30 v-54 a18 18 0 0 1 36 0 v54 Z`;
  o += S.path(a, tn.fl('#9A7A5A')) + S.rect(-310, -136, 620, 22, 6, tn.ol('#F2DBB8', 4));
  o += S.path('M-200 -136 V-200 M0 -146 V-220 M200 -136 V-200', tn.ln(5)) + S.path('M-200 -200 h40 l-10 14 l10 14 h-40 M0 -220 h44 l-10 14 l10 14 h-44 M200 -200 h40 l-10 14 l10 14 h-40', tn.ol('#FF5A5A', 3));
  return S.g(o, tf(x, base, s));
}
function farTower(x, base, s, tn, t) {
  let o = S.rect(-30, -1500, 60, 1500, 6, tn.ol('#7A5AC8', 5));
  let pl = '';
  for (let i = 0; i < 14; i++) { const yy = -120 - i * 100, xx = Math.sin(i * 1.3) * 70; pl += `M${f(xx - 50)} ${yy}h100v22h-100Z`; }
  o += S.path(pl, tn.ol('#C9A8FF', 4));
  o += S.rect(-90, -1560, 180, 40, 8, tn.ol('#C9A8FF', 5)) + S.path('M0 -1660 L34 -1600 L0 -1570 L-34 -1600 Z', tn.ol('!#7FF6FF', 4));
  o += GS.glow(0, -1610, 130 + 12 * Math.sin(t * 3), 'gsGlowCyan', 0.75);
  return S.g(o, tf(x, base, s));
}
function farSkyscraper(x, base, s, tn, t) {
  let o = S.rect(-120, -1300, 240, 1300, 6, tn.ol('#2A3478', 5)) + S.rect(-110, -1290, 220, 1280, 0, { fill: 'url(#gsGlassGrid)', opacity: 0.6 });
  o += S.rect(-140, -1330, 280, 40, 6, tn.ol('#FF8FC8', 5)) + S.circle(0, -1420, 80, tn.ol('!#FFB45A', 6)) + S.path('M-30 -1450h18v18h-18Z M14 -1430h18v18h-18Z M-12 -1400h18v18h-18Z', { fill: '#5A3018' });
  o += GS.glow(0, -1420, 220 + 16 * Math.sin(t * 2.2), 'gsGlowWarm', 0.85);
  o += S.rect(-26, -1240, 52, 900, 8, tn.ol('!#FF8FC8', 4)) + TS('GRANNY', 0, -1000, 40, '#FFFFFF', { transform: 'rotate(90 0 -1000)' });
  return S.g(o, tf(x, base, s));
}
function nightCity(t, cam, o = {}) {
  const tw = { night: 0.55 };
  const tn = GS.tone(tw);
  const hazeCol = '#2E2470';
  const tnF = GS.tone({ ...tw, haze: 0.55, hazeCol }), tnL = GS.tone({ ...tw, haze: 0.36, hazeCol }), tnM = GS.tone({ ...tw, haze: 0.16, hazeCol });
  // sky + twinkling stars
  const v0 = GS.vis(cam, 0);
  let sky = S.rect(v0.x0 - 300, v0.y0 - 300, v0.x1 - v0.x0 + 600, v0.y1 - v0.y0 + 600, 0, { fill: 'url(#gsSkyNight)' });
  sky += S.rect(v0.x0 - 300, v0.y0 - 300, v0.x1 - v0.x0 + 600, (v0.y1 - v0.y0) * 0.8 + 300, 0, { fill: 'url(#gsStars)', opacity: 0.95 });
  let tw4 = '';
  for (let i = 0; i < 14; i++) {
    const x = v0.x0 + hash(i * 4.3) * (v0.x1 - v0.x0), y = v0.y0 + hash(i * 2.9) * (v0.y1 - v0.y0) * 0.55, r = (8 + 10 * hash(i)) * (0.4 + 0.6 * Math.abs(Math.sin(t * (1.5 + hash(i * 3)) + i)));
    tw4 += `M${f(x)} ${f(y - r)}L${f(x + r * 0.25)} ${f(y - r * 0.25)}L${f(x + r)} ${f(y)}L${f(x + r * 0.25)} ${f(y + r * 0.25)}L${f(x)} ${f(y + r)}L${f(x - r * 0.25)} ${f(y + r * 0.25)}L${f(x - r)} ${f(y)}L${f(x - r * 0.25)} ${f(y - r * 0.25)}Z`;
  }
  sky += S.path(tw4, { fill: '#FFF6D0' });
  const moonL = GS.moon(o.moonX ?? 1600, o.moonY ?? 160, 82, tn);
  let cl = '';
  const vc = GS.vis(cam, 0.06);
  for (let i = Math.floor((vc.x0 - 500) / 700); i * 700 < vc.x1 + 500; i++) {
    const x = i * 700 + mod(hash(i * 2.7) * 420 + t * 10, 700), y = 110 + 200 * hash(i * 9.3), s = 0.4 + 0.35 * hash(i * 5.5);
    cl += GS.cubeCloud(x, y, s, tn, '#4E4290', i);
  }
  // far skyline
  const vf = GS.vis(cam, 0.18);
  const far = S.g(GS.skyline((vf.x0 - 300) / 0.62, (vf.x1 + 300) / 0.62, 780, tnF, 13, { lit: 0.95, hMin: 140, hVar: 300, lw: 6 }), 'translate(0 780) scale(0.62) translate(0 -780)') + S.rect(vf.x0 - 300, 770, vf.x1 - vf.x0 + 600, 600, 0, tnF.fl('#9A8AC0'));
  // landmarks + party searchlights
  let lmk = farArena(330, 620, 1.05, tnL) + farSkyscraper(1560, 760, 0.56, tnL, t) + farTower(1840, 780, 0.5, tnL, t);
  let sl = '';
  const beams = o.beams ?? 1;
  if (beams > 0) {
    const cols = ['s01BeamGold', 's01BeamPink', 's01BeamCyan', 's01BeamGold'];
    for (let i = 0; i < 4; i++) {
      const bx = -140 + i * 720, a = -Math.PI / 2 + Math.sin(t * (0.6 + 0.17 * i) + i * 1.9) * 0.5, L_ = 1600;
      sl += S.path(`M${f(bx - 16)} 900 L${f(bx + Math.cos(a - 0.06) * L_)} ${f(900 + Math.sin(a - 0.06) * L_)} L${f(bx + Math.cos(a + 0.06) * L_)} ${f(900 + Math.sin(a + 0.06) * L_)} L${f(bx + 16)} 900 Z`, { fill: `url(#${cols[i]})`, opacity: f(0.8 * beams) });
    }
  }
  // the billboard (any svg, world coords at k .38)
  const board = o.board ? V(cam, o.board, o.boardK ?? 0.38) : '';
  // mid row + plaza
  const vm = GS.vis(cam, 0.5);
  let mid = S.rect(vm.x0 - 400, 860, vm.x1 - vm.x0 + 800, 700, 0, tnM.fl('#B9B0D8'));
  mid += S.rect(600, 840, 720, 80, 10, tnM.ol('#E9DDFF', 5)) + S.rect(600, 840, 720, 80, 10, { fill: 'url(#gsTileFloor)' });
  mid += GS.letterSign('CUBE CITY', 960, 846, 56, tnM, t);
  mid += GS.fountain(1220, 880, 0.24, tnM, t, 1);
  for (const [x, w, h, col, sign] of NC_MID) {
    if (x + w < vm.x0 - 300 || x - w > vm.x1 + 300) continue;
    mid += GS.cityBuilding(x, 880, w, h, col, tnM, t, { lit: 1, seed: x, sign, signCol: GS.CANDY[mod(Math.round(x / 97), 9)] });
  }
  const vF = GS.vis(cam, 0.75);
  let fr = '';
  for (const [x, w, h, col] of NC_FRONT) {
    if (x + w < vF.x0 - 300 || x - w > vF.x1 + 300) continue;
    fr += GS.cityBuilding(x, 1100, w, h, col, tn, t, { lit: 1, seed: x * 1.3 });
  }
  // rooftop ledge (k 1)
  const v1 = GS.vis(cam, 1);
  let ledge = '';
  if (o.ledge !== false) {
    const X0 = v1.x0 - 300, X1 = v1.x1 + 300, top = 930;
    ledge += S.rect(X0, top, X1 - X0, 700, 0, tn.ol('#6A6E9A', 6)) + S.rect(X0, top, X1 - X0, 700, 0, { fill: 'url(#gsTileFloor)' });
    ledge += S.rect(X0, top - 6, X1 - X0, 22, 0, { fill: '#000', opacity: 0.18 });
    const B = GS.brickBatch(tn, { lw: 6 });
    for (let x = Math.floor(X0 / 220) * 220; x < X1; x += 220) B.add(x, 1050, 220, 80, 24, mod(x / 220, 2) ? '#8E92C0' : '#9A9ECC', 46);
    ledge += B.out();
    for (const [x, kind] of [[-500, 0], [380, 1], [1700, 0], [2500, 2]]) {
      if (x < X0 - 300 || x > X1 + 300) continue;
      if (kind === 0) ledge += GS.brick(x - 90, top - 110, 180, 110, 30, '#C9D3F2', tn, { lw: 6 }) + S.circle(x, top - 55, 40, tn.ol('#8A93A6', 5));
      else if (kind === 1) ledge += S.rect(x - 8, top - 320, 16, 320, 4, tn.ol('#5A6488', 5)) + S.circle(x, top - 326, 12, tn.ol('!#FF4D5E', 4));
      else ledge += GS.brick(x - 50, top - 80, 100, 80, 26, '#B9C6E6', tn, { lw: 5 });
    }
  }
  const sky0 = V(cam, sky, 0) + V(cam, moonL, 0.02) + V(cam, cl, 0.06) + V(cam, far, 0.18) + V(cam, sl, 0.3) + V(cam, lmk, 0.3);
  return { sky: sky0, board, row: V(cam, mid, 0.5), front: V(cam, fr, 0.75) + V(cam, ledge, 1), all() { return this.sky + this.board + this.row + this.front; } };
}

const DEFS = '<defs>' +
  ['Gold:#FFE9A0', 'Pink:#FFB8E8', 'Cyan:#B8F6FF'].map((p) => { const [n, c] = p.split(':'); return `<linearGradient id="s01Beam${n}" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="${c}" stop-opacity="0.38"/><stop offset="0.7" stop-color="${c}" stop-opacity="0.12"/><stop offset="1" stop-color="${c}" stop-opacity="0"/></linearGradient>`; }).join('') +
  '<radialGradient id="s01Spot"><stop offset="0" stop-color="#FFF6C8" stop-opacity="0.55"/><stop offset="0.6" stop-color="#FFE07A" stop-opacity="0.18"/><stop offset="1" stop-color="#FFE07A" stop-opacity="0"/></radialGradient>' +
  '<linearGradient id="s01Dark" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#0A0620" stop-opacity="0"/><stop offset="0.45" stop-color="#0A0620" stop-opacity="0.15"/><stop offset="1" stop-color="#0A0620" stop-opacity="0.6"/></linearGradient>' +
  '<linearGradient id="s01Polar" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFF9EC"/><stop offset="1" stop-color="#F2E8D2"/></linearGradient>' +
  '</defs>';

module.exports = {
  LINE, W, H, mod, esc, tf, TS, TFS, pop, at, toScr, shakeAll, zoomAbout, boing, blinkV,
  whip, smash, fadeBlack, zoomLines, streaks, freezeFrame, pip, firework, rocket, commentCard, pill,
  nightCity, V, DEFS,
};
