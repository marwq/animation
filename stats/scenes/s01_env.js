// Private helpers for SC 01 (the cold open) and SC 12 (the finale + outro): transitions (whip, smash, zoom lines, CRT open,
// letterbox), the VHS pause / rewind OSD, screen-space plates over world anchors, cheap paper flutter, shockwave rings,
// the title card of the video, a locker door, the mystery meat's eye, the tablet settings screen, the end-card bits
// (comment box, subscribe button, end-screen slots).
'use strict';

const K = require('./kit');
const H = require('./hud');
const ST = require('./sets_town');
const { S, f, clamp, lerp, ease, seg, bump, hash, ol, ln, T, TF } = K;

const LINE = '#151515';
const W = 1920, HH = 1080;
const tf = (x, y, s = 1, r = 0) => `translate(${f(x)} ${f(y)})${r ? ` rotate(${f(r)})` : ''}${s !== 1 ? ` scale(${f(s)})` : ''}`;
const TS = (txt, x, y, size, fill, extra = {}) => T(txt, x, y, size, fill, { stroke: LINE, 'stroke-width': size * 0.16, 'paint-order': 'stroke', 'stroke-linejoin': 'round', ...extra });
const TFS = (txt, x, y, size, fill, extra = {}) => TF(txt, x, y, size, fill, { stroke: LINE, 'stroke-width': size * 0.16, 'paint-order': 'stroke', 'stroke-linejoin': 'round', ...extra });
const pop = (t, t0, d = 0.28) => ease.outBack(seg(t, t0, t0 + d));
const sc = (inner, x, y, k) => (k <= 0.001 ? '' : Math.abs(k - 1) < 1e-4 ? inner : S.g(inner, `translate(${f(x)} ${f(y)}) scale(${f(k)}) translate(${f(-x)} ${f(-y)})`));
const camAt = ST.camAt;
// world point -> screen { x, y, z }
const toScr = (cam, x, y, k = 1) => { const p = ST.toScreen(cam, x, y, k); return { x: p[0], y: p[1], z: p[2] }; };
function shakeAll(cam, t, list) {
  const c = { ...cam };
  for (const [t0, d, a] of list) { const s = K.shake(t, t0, d, a); c.sx = (c.sx || 0) + s.sx; c.sy = (c.sy || 0) + s.sy; }
  return c;
}
// squash / stretch impulse after t0 -> { sx, sy }
function boing(t, t0, amp = 0.25, dur = 0.7) {
  const k = t - t0;
  if (k < 0 || k > dur) return { sx: 1, sy: 1 };
  const v = amp * Math.exp(-k * 7) * Math.cos(k * 20);
  return { sx: 1 - v * 0.6, sy: 1 + v };
}
const dim = (k, col = '#1A0B2E') => (k > 0.002 ? S.rect(-20, -20, W + 40, HH + 40, 0, { fill: col, opacity: f(clamp(k, 0, 1)) }) : '');
// dutch angle: rotate a full-frame layer about the frame centre
const dutch = (svg, deg) => (Math.abs(deg) < 0.01 ? svg : S.g(svg, `rotate(${f(deg)} 960 540)`));

// ---------------------------------------------------------------- transitions
function whip(t, tc, dir = 1, dur = 0.12) {
  const d = t - tc;
  if (Math.abs(d) > dur) return '';
  const k = 1 - Math.abs(d) / dur;
  let p = '';
  for (let i = 0; i < 16; i++) {
    const y = hash(i * 3.7) * HH, len = 300 + hash(i) * 700, th = 8 + hash(i * 2.2) * 16;
    const x = ((hash(i * 5.1) * 2600 + dir * d * 16000) % 2600 + 2600) % 2600 - 400;
    p += `M${f(x)} ${f(y)}h${f(len)}v${f(th)}h${f(-len)}Z`;
  }
  return S.rect(0, 0, W, HH, 0, { fill: '#FFFFFF', opacity: f(0.55 * k) }) + S.path(p, { fill: '#FFFFFF', opacity: f(0.85 * k) });
}
const smash = (t, tc, dur = 0.14, a = 0.75, col = '#FFFFFF') => (t >= tc && t < tc + dur ? S.rect(0, 0, W, HH, 0, { fill: col, opacity: f(a * (1 - (t - tc) / dur)) }) : '');
function zoomLines(cx, cy, k, t, col = '#FFFFFF', n = 22, r0b = 380) {
  if (k <= 0) return '';
  let d = '';
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + hash(i * 3.1) * 0.2, r0 = r0b + hash(i + Math.floor(t * 12)) * 160, r1 = r0 + 1100;
    const w = 10 + hash(i * 1.7) * 14;
    const ax = Math.cos(a), ay = Math.sin(a), nx = -ay * w, ny = ax * w;
    d += `M${f(cx + ax * r0)} ${f(cy + ay * r0)}L${f(cx + ax * r1 + nx)} ${f(cy + ay * r1 + ny)}L${f(cx + ax * r1 - nx)} ${f(cy + ay * r1 - ny)}Z`;
  }
  return S.path(d, { fill: col, opacity: f(0.75 * k) });
}
function streaks(t, y0, y1, n, seed, col = '#FFFFFF', op = 0.6, speed = 2600, dir = -1) {
  let d = '';
  for (let i = 0; i < n; i++) {
    const y = lerp(y0, y1, hash(i * 2.3 + seed)), len = 160 + hash(i * 5.7 + seed) * 380, th = 5 + hash(i * 1.1 + seed) * 9;
    const x = (((hash(i * 7.9 + seed) * 2600 + dir * t * speed * (0.6 + 0.8 * hash(i + seed))) % 2600) + 2600) % 2600 - 340;
    d += `M${f(x)} ${f(y)}h${f(len)}v${f(th)}h${f(-len)}Z`;
  }
  return op > 0.01 ? S.path(d, { fill: col, opacity: f(op) }) : '';
}
const letterbox = (k, h = 96) => (k > 0 ? S.rect(-10, -10, W + 20, 10 + h * k, 0, { fill: '#05070C' }) + S.rect(-10, HH - h * k, W + 20, h * k + 10, 0, { fill: '#05070C' }) : '');
// CRT / eyelid open: black bars part from a bright centre line (k 0 = closed, 1 = open)
function crtOpen(k) {
  if (k >= 1) return '';
  const open = ease.out(seg(k, 0.25, 1)), line = seg(k, 0, 0.3);
  const half = 540 * open;
  let o = S.rect(-10, -10, W + 20, 540 - half + 10, 0, { fill: '#04060C' }) + S.rect(-10, 540 + half, W + 20, 540 - half + 10, 0, { fill: '#04060C' });
  const lw = W * ease.out(line);
  o += S.rect(960 - lw / 2, 540 - 3 - half, lw, 6, 3, { fill: '#BFF6FF', opacity: f(1 - open * 0.8) }) + S.rect(960 - lw / 2, 540 - 3 + half, lw, 6, 3, { fill: '#BFF6FF', opacity: f(1 - open * 0.8) });
  return o;
}
// expanding shockwave rings (age seconds)
function rings(x, y, age, col = '#FFFFFF', n = 3, r = 700, dur = 0.6) {
  let o = '';
  for (let i = 0; i < n; i++) {
    const u = (age - i * 0.09) / dur;
    if (u <= 0 || u >= 1) continue;
    o += S.circle(x, y, 40 + r * ease.out(u), { fill: 'none', stroke: col, 'stroke-width': f(26 * (1 - u)), opacity: f(0.8 * (1 - u)) });
  }
  return o;
}
// paper sheets fluttering (screen or world), from (x0, y0) along a velocity, age seconds
function papers(x0, y0, age, n = 8, seed = 1, sp = 1, s = 1) {
  if (age < 0 || age > 3) return '';
  let o = '';
  for (let i = 0; i < n; i++) {
    const a = -Math.PI / 2 + (hash(i * 3.1 + seed) - 0.5) * 2.4;
    const v = (380 + 520 * hash(i * 1.7 + seed)) * sp;
    const k = age;
    const x = x0 + Math.cos(a) * v * k * 0.8 + Math.sin(k * 5 + i) * 30;
    const y = y0 + Math.sin(a) * v * k * 0.8 + 260 * k * k;
    const r = k * (200 + 300 * hash(i * 2.9 + seed)) + i * 40;
    const fl = Math.abs(Math.cos(k * 7 + i));
    o += S.g(S.rect(-34, -44, 68, 88, 3, ol('#FFFFFF', 3)) + S.path('M-22 -24h44M-22 -8h44M-22 8h30', ln(3, '#9AB0D0')), `${tf(x, y, s, r)} scale(${f(0.35 + 0.65 * fl)} 1)`);
  }
  return o;
}

// ---------------------------------------------------------------- VHS OSD (pause / rewind)
function osd(t, kind = 'pause', k = 1) {
  if (k <= 0) return '';
  let o = '';
  const blink = Math.floor(t * 2.2) % 2 === 0;
  if (kind === 'pause') {
    if (blink) o += S.rect(96, 80, 18, 64, 2, { fill: '#FFFFFF', stroke: LINE, 'stroke-width': 4 }) + S.rect(126, 80, 18, 64, 2, { fill: '#FFFFFF', stroke: LINE, 'stroke-width': 4 });
    o += TFS('PAUSE', 168, 136, 64, '#FFFFFF', { 'text-anchor': 'start', 'letter-spacing': 4 });
  } else {
    o += S.path('M150 80 L100 112 L150 144 Z M200 80 L150 112 L200 144 Z', { fill: '#FFFFFF', stroke: LINE, 'stroke-width': 4, 'stroke-linejoin': 'round' });
    o += TFS('REWIND', 224, 136, 64, '#FFFFFF', { 'text-anchor': 'start', 'letter-spacing': 4 });
  }
  o += TFS('SP  0:00:' + String(Math.floor(kind === 'pause' ? 39 : (40 - (t % 40)))).padStart(2, '0'), 1820, 1000 - 60, 40, '#FFFFFF', { 'text-anchor': 'end', 'letter-spacing': 3 });
  return S.g(o, null, k < 1 ? { opacity: f(k) } : {});
}
// VHS tracking noise: horizontal bands + scanlines (cheap)
function tracking(t, k = 1, rewind = false) {
  if (k <= 0) return '';
  let o = '';
  let sl = '';
  for (let y = 0; y < HH; y += 6) sl += `M0 ${y}h${W}`;
  o += S.path(sl, { stroke: '#000', 'stroke-width': 2, opacity: f(0.14 * k) });
  const n = rewind ? 4 : 1;
  for (let i = 0; i < n; i++) {
    const by = ((t * (rewind ? 2600 : 300) + i * 340) % (HH + 200)) - 100;
    o += S.rect(0, by, W, rewind ? 26 : 40, 0, { fill: '#FFFFFF', opacity: f(0.16 * k) });
    let d = '';
    for (let j = 0; j < 9; j++) { const x = hash(j * 7 + i + Math.floor(t * 30)) * W; d += `M${f(x)} ${f(by + hash(j + i * 3) * 30)}h${f(60 + hash(j * 3.3) * 220)}v3h${f(-(60 + hash(j * 3.3) * 220))}Z`; }
    o += S.path(d, { fill: '#FFFFFF', opacity: f(0.6 * k) });
  }
  // bottom head-switching noise
  o += S.rect(0, HH - 18, W, 18, 0, { fill: '#000', opacity: f(0.35 * k) });
  return o;
}

// ---------------------------------------------------------------- HUD bits
// screen-space mini plates over a list of world people { x, y, s, i, kind } (head top ≈ y − 930 s for kids)
const NAMES = ['KYLE', 'PRIYA', 'ZOE', 'MARCUS', 'JAY', 'LILY', 'OMAR', 'NOAH', 'MIA', 'LEO', 'AVA', 'SAM', 'ELI', 'IVY', 'RAY', 'NIA', 'TOM', 'ANA', 'BEN', 'KIM', 'DEV', 'JO', 'MAX?', 'LOU'];
function crowdPlates(cam, list, t, kAt, o = {}) {
  let out = '';
  const sorted = list.slice().sort((a, b) => a.y - b.y);
  sorted.forEach((p, j) => {
    const id = Math.round(p.i ?? j);
    const k = kAt(id, p);
    if (k <= 0) return;
    const hTop = p.kind === 'adult' ? 1040 : 935;
    const q = toScr(cam, p.x, p.y - hTop * p.s - (p.lift || 0), o.k ?? 1);
    if (q.x < -150 || q.x > W + 150 || q.y < 40 || q.y > HH + 80) return;
    const s = clamp(p.s * q.z * (o.scale ?? 1.9), 0.38, o.max ?? 1.15);
    const name = NAMES[id % NAMES.length], lv = 2 + Math.floor(hash(id * 3.7) * 46);
    out += H.miniPlate({ x: q.x, y: q.y, s, k, t, name, level: lv, hp: 0.25 + 0.75 * hash(id * 1.9), glitch: o.glitch || 0, theme: o.theme });
  });
  return out;
}
// the tiny reticle that scans a head and finds nothing
function scanReticle(x, y, r, t, k = 1, col = '#7CF7FF') {
  if (k <= 0) return '';
  const rr = r * lerp(1.6, 1, ease.out(k));
  let d = '';
  for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) d += `M${f(x + sx * rr)} ${f(y + sy * rr * 0.4)}V${f(y + sy * rr)}H${f(x + sx * rr * 0.6)}`;
  let o = S.path(d, { fill: 'none', stroke: '#03101B', 'stroke-width': 9, opacity: f(0.6 * k), 'stroke-linecap': 'square' }) + S.path(d, { fill: 'none', stroke: col, 'stroke-width': 4.5, opacity: f(k), 'stroke-linecap': 'square' });
  const sy = y - rr + ((t * 2.2) % 1) * rr * 2;
  o += S.rect(x - rr, sy, rr * 2, 4, 2, { fill: col, opacity: f(0.6 * k) });
  return o;
}

// ---------------------------------------------------------------- SC01 props
// a full-height violet locker door that bursts open (hinge on the left at x, top y, h tall); k 0 shut … 1 swung open
function lockerDoor(x, y, w, h, k, rattle = 0, col = '#7B5BE6') {
  const sxk = Math.cos(clamp(k, 0, 1) * Math.PI * 0.62);
  let inside = S.rect(x, y, w, h, 6, ol('#2A2240', 6));
  const g = S.rect(0, 0, w, h, 6, ol(col, 6)) + S.path(`M${w * 0.25} ${h * 0.12}h${w * 0.5}M${w * 0.25} ${h * 0.18}h${w * 0.5}M${w * 0.25} ${h * 0.24}h${w * 0.5}`, ln(5, '#4A35A8')) + S.rect(w * 0.72, h * 0.48, 12, 46, 4, ol('#D9DEE8', 3));
  const rx = rattle * Math.sin(rattle > 0 ? 80 * rattle : 0) * 6;
  return inside + S.g(g, `translate(${f(x + rx)} ${f(y)}) scale(${f(sxk)} 1)`);
}
// the mystery meat's eye (it opens on "meat"); (x, y) centre, r size, k 0 shut … 1 open, look -1..1
function meatEye(x, y, r, k, look = 0, blink = 0) {
  const o = clamp(k, 0, 1) * (1 - blink);
  if (o <= 0.02) return S.path(`M${f(x - r)} ${f(y)} Q${f(x)} ${f(y + r * 0.35)} ${f(x + r)} ${f(y)}`, ln(r * 0.18, '#3A3036'));
  let s = S.ellipse(x, y, r, r * 0.82 * o, ol('#FFFFFF', r * 0.14)) + S.circle(x + look * r * 0.35, y + r * 0.05, r * 0.42 * Math.min(1, o * 1.4), { fill: '#2A1E14' }) + S.circle(x + look * r * 0.35 - r * 0.14, y - r * 0.12, r * 0.12, { fill: '#FFFFFF' });
  // veiny lid
  s += S.path(`M${f(x - r * 1.05)} ${f(y - r * 0.6 * o)} Q${f(x)} ${f(y - r * 1.25 * o)} ${f(x + r * 1.05)} ${f(y - r * 0.6 * o)}`, ln(r * 0.2, '#8A7A78'));
  return s;
}

// ---------------------------------------------------------------- the TITLE card
// title(t, k, o): 'WHAT IF YOU COULD SEE / EVERYONE'S STATS / IN REAL LIFE?' — k 0..1 slam-in, t for idle shimmer
function title(t, k, o = {}) {
  if (k <= 0) return '';
  const th = H.theme('cyan');
  const s = lerp(1.6, 1, ease.outBack(seg(k, 0, 0.55))) * (o.s || 1);
  let g = '';
  // top line
  const k1 = seg(k, 0.05, 0.45);
  g += S.g(TFS("WHAT IF YOU COULD SEE", 0, -150, 62, '#FFFFFF', { 'letter-spacing': 6 }), `translate(0 ${f(-30 * (1 - ease.out(k1)))})`, { opacity: f(k1) });
  // the main HUD panel
  const pw = 1260, ph = 190;
  g += H.panel(-pw / 2, -110, pw, ph, th, { c: 30, br: 40, scan: true });
  g += H.sheen(-pw / 2 + 8, -104, pw - 16, ph - 12, t, 2.6, 3);
  // LV badge
  g += S.path(H.para(-pw / 2 + 34, -82, 170, 72, 16), { fill: th.badge, stroke: th.edge, 'stroke-width': 5 }) + TF('LV', -pw / 2 + 60, -36, 26, th.badgeTx, { 'text-anchor': 'start' }) + T(String(o.lv ?? '???'), -pw / 2 + 108, -26, 58, th.badgeTx, { 'text-anchor': 'start' });
  g += T("EVERYONE'S STATS", 92, 30, 132, '#FFFFFF', { stroke: th.edge, 'stroke-width': 18, 'paint-order': 'stroke', 'stroke-linejoin': 'round' });
  // bar
  const bk = seg(k, 0.45, 0.95);
  g += H.segBar(-pw / 2 + 40, 52, pw - 80, 18, bk, '#3DFF8F', { th, t, cell: 22 });
  // bottom line
  const k3 = ease.outBack(seg(k, 0.35, 0.75));
  if (k3 > 0) g += S.g(TS('IN REAL LIFE?', 0, 0, 104, '#FFD21F', { 'letter-spacing': 3 }), `translate(0 ${f(206)}) scale(${f(k3)}) rotate(${f(-3 * k3)})`);
  // sparkles + question marks
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + t * 0.6, r = 700 + 40 * Math.sin(t * 2 + i);
    const kk = seg(k, 0.5 + i * 0.05, 0.7 + i * 0.05);
    if (kk > 0) g += T('?', Math.cos(a) * r, Math.sin(a) * r * 0.42 + 30, 70, '#7CF7FF', { opacity: f(0.55 * kk), stroke: th.edge, 'stroke-width': 8, 'paint-order': 'stroke' });
  }
  return S.g(g, `translate(${f(o.x ?? 960)} ${f(o.y ?? 500)}) scale(${f(s)})`);
}
// dark HUD background: ink blue, grid, rays (cheap)
function hudBg(t, o = {}) {
  let g = S.rect(-20, -20, W + 40, HH + 40, 0, { fill: o.col || '#0B1630' });
  g += K.rays(960, o.cy ?? 520, 18, 1500, o.ray || '#1C3A6A', 0.55, t * 6);
  let d = '';
  const off = (t * 40) % 80;
  for (let x = -80; x < W + 80; x += 80) d += `M${f(x + off)} 0V${HH}`;
  for (let y = 0; y < HH + 80; y += 80) d += `M0 ${f(y + off * 0.5)}H${W}`;
  g += S.path(d, ln(2, '#3BE8FF', 0.12));
  return g;
}

module.exports = {
  LINE, tf, TS, TFS, pop, sc, camAt, toScr, shakeAll, boing, dim, dutch,
  whip, smash, zoomLines, streaks, letterbox, crtOpen, rings, papers, osd, tracking,
  crowdPlates, scanReticle, lockerDoor, meatEye, title, hudBg, NAMES,
};
