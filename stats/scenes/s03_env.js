// Private helpers for SC 03 · the update: transitions (whip / smash / fade), camera helpers, the HUD layer (frame + the
// hero's XP bar), the monitor close-up, the 4,812 flying terms pages + paper piles, POV eyelids, the alarm-clock VS card,
// the pillow, damage numbers, the NEW RECORD stamp, Biscuit's loading plate, soot / milk splats.
'use strict';

const K = require('./kit');
const HUD = require('./hud');
const SH = require('./sets_home');
const { S, f, clamp, lerp, ease, seg, bump, hash, T, TF } = K;

const LINE = '#151515';
const W = 1920, HH = 1080;
const tf = (x, y, s = 1, r = 0) => `translate(${f(x)} ${f(y)})${r ? ` rotate(${f(r)})` : ''}${s !== 1 ? ` scale(${f(s)})` : ''}`;
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const TS = (txt, x, y, size, fill, extra = {}) => T(esc(txt), f(x), f(y), f(size), fill, { stroke: LINE, 'stroke-width': f(size * 0.16), 'paint-order': 'stroke', 'stroke-linejoin': 'round', ...extra });
const TFS = (txt, x, y, size, fill, extra = {}) => TF(esc(txt), f(x), f(y), f(size), fill, { stroke: LINE, 'stroke-width': f(size * 0.16), 'paint-order': 'stroke', 'stroke-linejoin': 'round', ...extra });
const pop = (t, t0, d = 0.28) => ease.outBack(seg(t, t0, t0 + d));
// cam that puts world point (wx, wy) at the frame centre
const camAt = (wx, wy, zoom = 1, extra = {}) => ({ zoom, x: wx - 960, y: wy - 540, ...extra });
const toScr = (cam, x, y) => SH.toScreen(cam, { x, y });
function shakeCam(cam, t, list) {
  const c = { ...cam };
  for (const [t0, d, a] of list) { const s = K.shake(t, t0, d, a); c.sx = (c.sx || 0) + s.sx; c.sy = (c.sy || 0) + s.sy; }
  return c;
}
function clipTo(x, y, w, h, inner, r = 0) {
  const id = S.uid('s03c');
  return S.clipDef(id, S.rect(x, y, w, h, r)) + S.g(inner, null, { 'clip-path': `url(#${id})` });
}
function clipPoly(d, inner) {
  const id = S.uid('s03p');
  return S.clipDef(id, S.path(d)) + S.g(inner, null, { 'clip-path': `url(#${id})` });
}
// squash / stretch impulse after t0 -> { sx, sy }
function boing(t, t0, amp = 0.2, dur = 0.7) {
  const k = t - t0;
  if (k < 0 || k > dur) return {};
  const v = amp * Math.exp(-k * 7) * Math.cos(k * 20);
  return { sx: 1 - v * 0.6, sy: 1 + v };
}
// whip-pan streak flash centred on the cut time tc (dir = streak direction)
function whip(t, tc, dir = 1, dur = 0.1) {
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
// the closing whip (SC 03 -> SC 04): white streaks moving right, ramping to full white at tEnd
function whipOut(t, tEnd, dur = 0.15) {
  const k = seg(t, tEnd - dur, tEnd);
  if (k <= 0) return '';
  let p = '';
  for (let i = 0; i < 18; i++) {
    const y = hash(i * 3.7) * HH, len = 300 + hash(i) * 800, th = 10 + hash(i * 2.2) * 20;
    const x = ((hash(i * 5.1) * 2600 + t * 16000) % 2600 + 2600) % 2600 - 400;
    p += `M${f(x)} ${f(y)}h${f(len)}v${f(th)}h${f(-len)}Z`;
  }
  return S.path(p, { fill: '#FFFFFF', opacity: f(0.9 * Math.min(1, k * 2)) }) + S.rect(0, 0, W, HH, 0, { fill: '#FFFFFF', opacity: f(ease.in(k)) });
}
const smash = (t, tc, dur = 0.14, a = 0.75) => (t >= tc && t < tc + dur ? K.C.whiteFlash(a * (1 - (t - tc) / dur)) : '');
const tint = (col, op) => (op > 0.003 ? S.rect(-20, -20, W + 40, HH + 40, 0, { fill: col, opacity: f(clamp(op, 0, 1)) }) : '');
const fadeIn = (t, t0, dur = 0.25, col = '#000000') => tint(col, 1 - seg(t, t0, t0 + dur));
function zoomLines(cx, cy, k, t, col = '#FFFFFF', n = 22, r0b = 380) {
  if (k <= 0) return '';
  let d = '';
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + hash(i * 3.1) * 0.2, r0 = r0b + hash(i + Math.floor(t * 12)) * 160, r1 = r0 + 900;
    const w = 10 + hash(i * 1.7) * 14;
    const ax = Math.cos(a), ay = Math.sin(a), nx = -ay * w, ny = ax * w;
    d += `M${f(cx + ax * r0)} ${f(cy + ay * r0)}L${f(cx + ax * r1 + nx)} ${f(cy + ay * r1 + ny)}L${f(cx + ax * r1 - nx)} ${f(cy + ay * r1 - ny)}Z`;
  }
  return S.path(d, { fill: col, opacity: f(0.7 * k) });
}
// cheap edge darkening (4 bands)
function edgeDark(op = 0.35, col = '#050816') {
  if (op <= 0) return '';
  let o = '';
  for (let i = 0; i < 4; i++) {
    const w = 50 + i * 60, a = op * 0.22;
    o += S.rect(0, 0, W, w, 0, { fill: col, opacity: f(a) }) + S.rect(0, HH - w, W, w, 0, { fill: col, opacity: f(a) });
    o += S.rect(0, 0, w, HH, 0, { fill: col, opacity: f(a) }) + S.rect(W - w, 0, w, HH, 0, { fill: col, opacity: f(a) });
  }
  return o;
}
// 4-point twinkle star
function star4(x, y, r, rot = 0, fill = '#FFFFFF', op = 1) {
  if (r <= 0.5) return '';
  const q = r * 0.28;
  return S.path(`M0 ${f(-r)}Q${f(q)} ${f(-q)} ${f(r)} 0Q${f(q)} ${f(q)} 0 ${f(r)}Q${f(-q)} ${f(q)} ${f(-r)} 0Q${f(-q)} ${f(-q)} 0 ${f(-r)}Z`, { fill, opacity: f(op), transform: tf(x, y, 1, rot) });
}

// ---------------------------------------------------------------- the HUD layer (screen space)
// The hero's XP: LV 1, 0 / 100 until the alarm clock's +12 XP lands (B.xpLand), then 12 / 100 (SC 04 continues with 12 / 100).
function xpState(t, tLand) {
  if (t < tLand) return { value: 0, text: '0 / 100' };
  const r = seg(t, tLand, tLand + 0.7);
  return { value: 0.12, from: 0, roll: r, text: `${Math.round(12 * ease.out(r))} / 100`, gain: seg(t, tLand, tLand + 0.45) };
}
function hudLayer(t, o = {}) {
  let g = '';
  if (o.frame !== false) g += HUD.hudFrame({ t, k: o.k ?? 1, clock: o.clock || '7:00 AM', day: 'MON', glitch: o.glitch || 0, dots: o.dots });
  if (o.xp !== false) g += HUD.xpBar({ t, level: 1, k: o.xpK ?? 1, ...xpState(t, o.tLand) });
  return g;
}

// ---------------------------------------------------------------- monitor close-up (the screen fills the frame)
// inner = svg for the 1920x1080 screen; o: { t, push (scale), shake, glow, reflect }
function monitorCU(t, inner, o = {}) {
  const sc = o.push || 1, sx = o.sx || 0, sy = o.sy || 0;
  let scr = S.rect(-40, -40, W + 80, HH + 80, 0, { fill: '#120E2C' });
  scr += S.g(SH.dragonTitle(W + 80, HH + 80, t), 'translate(960 1060)');
  scr += S.rect(-40, -40, W + 80, HH + 80, 0, { fill: '#070A1C', opacity: f(o.dim ?? 0.7) });
  // faint scanlines (one pattern rect)
  scr += S.rect(-40, -40, W + 80, HH + 80, 0, { fill: 'url(#hdScanD)', opacity: 0.35 });
  scr += inner;
  // the hero's reflection in the glass (head + headset), very faint
  if (o.reflect !== false) {
    const rx = 1500, ry = 960;
    scr += S.path(`M${rx - 230} ${HH + 40}Q${rx - 240} ${ry - 60} ${rx - 150} ${ry - 150}Q${rx - 160} ${ry - 330} ${rx} ${ry - 350}Q${rx + 160} ${ry - 330} ${rx + 150} ${ry - 150}Q${rx + 240} ${ry - 60} ${rx + 230} ${HH + 40}Z`, { fill: '#9FD8FF', opacity: 0.05 });
    scr += S.path(`M${rx - 175} ${ry - 170}Q${rx} ${ry - 420} ${rx + 175} ${ry - 170}`, { fill: 'none', stroke: '#9FD8FF', 'stroke-width': 26, opacity: 0.05 });
  }
  let g = S.g(scr, `translate(${f(960 + sx)} ${f(540 + sy)}) scale(${f(sc)}) translate(-960 -540)`);
  // glass sheen
  g += S.path('M-20 -20 L700 -20 L240 1100 L-20 1100 Z', { fill: '#FFFFFF', opacity: 0.025 });
  // bezel (evenodd frame) + RGB edge
  g += S.path(`M-20 -20H1940V1100H-20Z M44 34 Q30 34 30 48 V1034 Q30 1048 44 1048 H1876 Q1890 1048 1890 1034 V48 Q1890 34 1876 34 Z`, { fill: '#17181F', 'fill-rule': 'evenodd', stroke: LINE, 'stroke-width': 6 });
  g += S.path('M44 34 H1876', { stroke: '#3A3D4C', 'stroke-width': 3 });
  const hue = ['#FF4FD8', '#8A5CFF', '#33D6FF', '#3DFF9A', '#FFB13B'];
  for (let i = 0; i < 5; i++) g += S.rect(260 + i * 290, 1060, 280, 8, 4, { fill: hue[(i + Math.floor(t * 3)) % 5], opacity: 0.8 });
  g += edgeDark(0.4);
  return g;
}

// ---------------------------------------------------------------- terms pages
// one page of the terms (centre anchored, 100 x 130 at s 1); o.page1: the readable page one (with the little X rule)
function page(x, y, s, rot, o = {}) {
  let p = S.rect(-50, -65, 100, 130, 3, { fill: '#FBFAF4', stroke: LINE, 'stroke-width': 3.5 });
  if (o.page1) {
    p += TF('TERMS &amp; CONDITIONS', 0, -48, 7.5, '#3A4A5A', { 'letter-spacing': 0.5 });
    p += TF('PAGE 1 / 4,812', 0, -38, 6, '#8A97A6');
    const ls = ['1.1 Reality HUD shows the', 'stats of everyone around you.', '1.2 To switch the HUD off,', 'press the little X in the corner.', '1.3 Stats are not the whole', 'truth. Results may vary.'];
    ls.forEach((l, i) => { p += TF(l, -42, -22 + i * 10.5 + (i > 1 ? 3 : 0) + (i > 3 ? 3 : 0), 6.3, i === 2 || i === 3 ? '#1A2430' : '#6A7886', { 'text-anchor': 'start' }); });
    for (let i = 0; i < 4; i++) p += S.rect(-42, 46 + i * 5, 84 - (i % 3) * 14, 2.2, 1, { fill: '#C9D0D8' });
  } else {
    p += S.rect(-38, -54, 50, 5, 2, { fill: '#9AA6B2' });
    for (let i = 0; i < 9; i++) p += S.rect(-38, -40 + i * 11, 76 - ((i * 7) % 5) * 8, 3.5, 1.5, { fill: '#C3CAD2' });
  }
  return S.g(p, tf(x, y, s, rot));
}
// pages blasting out of (cx, cy) toward the camera (they grow and fly past the edges); age = t - t0
function pageStorm(age, cx, cy, o = {}) {
  if (age < 0) return '';
  const n = o.n || 30, rate = o.rate || 16, life = o.life || 0.9, s0 = o.s0 || 0.3, s1 = o.s1 || 3.2, seed = o.seed || 1;
  let g = '';
  const items = [];
  for (let i = 0; i < n * 4; i++) {
    const born = i / rate;
    const u = (age - born) / life;
    if (u <= 0 || u >= 1) continue;
    const a = hash(i * 1.37 + seed) * Math.PI * 2, sp = (o.spread || 1) * (600 + 900 * hash(i * 2.11 + seed));
    const e = ease.in(u);
    items.push([u, cx + Math.cos(a) * sp * e, cy + Math.sin(a) * sp * e * 0.8, lerp(s0, s1, e * e), (hash(i * 3.3) - 0.5) * 120 + u * 300 * (hash(i) - 0.5)]);
  }
  items.sort((a, b) => a[0] - b[0]);
  for (const [, x, y, s, r] of items.slice(-n)) g += page(x, y, s, r);
  return g;
}
// pages fountaining from (sx, sy) in world space onto the floor (arcs), age = t - t0; returns { air, landed } counts
function pageFountain(age, sx, sy, o = {}) {
  if (age < 0) return '';
  const rate = o.rate || 22, n = o.n || 34, dur = o.dur || 0.9, s = o.s || 0.55, seed = o.seed || 3, stop = o.stop ?? 99;
  let g = '';
  const first = Math.max(0, Math.floor((age - dur) * rate)), last = Math.floor(Math.min(age, stop) * rate);
  for (let i = Math.max(first, last - n); i <= last; i++) {
    const born = i / rate, u = (age - born) / dur;
    if (u < 0 || u > 1) continue;
    const dx = (hash(i * 1.7 + seed) - 0.5) * 2 * (o.dx || 900), up = 250 + 300 * hash(i * 2.9 + seed);
    const x = sx + dx * u, y = sy - up * Math.sin(u * Math.PI * 0.85) + (o.drop || 600) * u * u;
    g += page(x, y, s * (0.8 + 0.4 * hash(i)), (hash(i * 4.1) - 0.5) * 80 + u * 400 * (hash(i * 5.3) - 0.5));
  }
  return g;
}
// a messy pile of paper (bottom centre x, y), h 0..1 grows it
function pilePaper(x, y, w, h, s = 1, seed = 1) {
  if (h <= 0) return '';
  let g = '';
  const rows = Math.max(1, Math.round(10 * h));
  for (let r = 0; r < rows; r++) {
    const rw = w * (1 - r / (rows + 3) * 0.7), yy = -r * 12;
    const n = Math.max(2, Math.round(rw / 70));
    for (let i = 0; i < n; i++) {
      const px = -rw / 2 + (i + 0.5) * (rw / n) + (hash(r * 7 + i + seed) - 0.5) * 30;
      g += S.g(S.rect(-46, -12, 92, 24, 2, { fill: r % 2 ? '#F4F1E6' : '#FBFAF4', stroke: LINE, 'stroke-width': 3 }) + S.rect(-36, -4, 60, 3, 1, { fill: '#C3CAD2' }), tf(px, yy, 1, (hash(r * 3 + i * 5 + seed) - 0.5) * 22));
    }
  }
  return S.g(g, tf(x, y, s));
}

// ---------------------------------------------------------------- POV eyelids: open 0..1 (0 = shut)
function eyelids(open, col = '#0B0610') {
  if (open >= 1) return '';
  const h = 560 * (1 - ease.out(clamp(open, 0, 1)));
  if (h <= 1) return '';
  return S.path(`M-20 -20H1940V${f(h)}Q960 ${f(h + 120 * (1 - open))} -20 ${f(h)}Z`, { fill: col }) +
    S.path(`M-20 1100H1940V${f(1080 - h)}Q960 ${f(1080 - h - 120 * (1 - open))} -20 ${f(1080 - h)}Z`, { fill: col });
}

// ---------------------------------------------------------------- props
// a pillow (centre), 220 x 130 at s 1
function pillow(x, y, s = 1, rot = 0, squash = 0) {
  const sx = 1 + 0.25 * squash, sy = 1 - 0.3 * squash;
  let p = S.path('M-110 -50 Q-120 -66 -96 -62 Q0 -48 96 -62 Q120 -66 110 -50 Q118 0 110 50 Q120 66 96 62 Q0 48 -96 62 Q-120 66 -110 50 Q-118 0 -110 -50 Z', { fill: '#DCEBFF', stroke: LINE, 'stroke-width': 7, 'stroke-linejoin': 'round' });
  p += S.path('M-80 -30 Q0 -22 70 -34', { fill: 'none', stroke: '#FFFFFF', 'stroke-width': 8, 'stroke-linecap': 'round', opacity: 0.8 });
  p += S.path('M-60 30 Q0 40 60 28', { fill: 'none', stroke: '#9FB8DA', 'stroke-width': 5, 'stroke-linecap': 'round' });
  return S.g(p, `${tf(x, y, s, rot)} scale(${f(sx)} ${f(sy)})`);
}
// feathers bursting (age seconds)
function feathers(x, y, age, n = 12, seed = 2) {
  if (age < 0 || age > 1.4) return '';
  let g = '';
  for (let i = 0; i < n; i++) {
    const a = hash(i + seed) * Math.PI * 2, v = 200 + 300 * hash(i * 3 + seed);
    const px = x + Math.cos(a) * v * Math.min(age, 0.4) * 2 + Math.sin(age * 6 + i) * 20, py = y + Math.sin(a) * v * Math.min(age, 0.4) * 1.5 + 120 * age * age;
    g += S.ellipse(0, 0, 18, 7, { fill: '#FFFFFF', stroke: LINE, 'stroke-width': 3, transform: tf(px, py, 1, age * 200 + i * 40) });
  }
  return S.g(g, null, { opacity: f(1 - seg(age, 0.9, 1.4)) });
}
// an angry face on an alarm clock dial (cx, cy = dial centre, r = dial radius): eyes + slanted brows
function angryBrows(cx, cy, r) {
  let g = '';
  for (const sx of [-1, 1]) {
    const ex = cx + sx * r * 0.42, ey = cy - r * 0.3;
    g += S.ellipse(ex, ey, r * 0.2, r * 0.24, { fill: '#FFFFFF', stroke: LINE, 'stroke-width': f(r * 0.07) }) + S.circle(ex - sx * r * 0.04, ey + r * 0.05, r * 0.1, { fill: LINE });
    g += S.path(`M${f(cx + sx * r * 0.72)} ${f(cy - r * 0.72)} L${f(cx + sx * r * 0.16)} ${f(cy - r * 0.46)}`, { stroke: LINE, 'stroke-width': f(r * 0.17), 'stroke-linecap': 'round' });
  }
  return g;
}
// big red damage number (game style) rising + fading; age seconds
function dmgNum(txt, x, y, age, size = 90, col = '#FF3355', sub = '') {
  if (age < 0 || age > 1.3) return '';
  const k = ease.outBack(seg(age, 0, 0.22)), op = 1 - seg(age, 0.9, 1.3);
  let g = TS(txt, 0, 0, size, col, { 'stroke-width': f(size * 0.18) });
  if (sub) g += TS(sub, 0, size * 0.62, size * 0.45, '#FFD21F');
  return S.g(g, tf(x, y - 90 * ease.out(seg(age, 0, 1.3)), Math.max(0.01, k), -6), { opacity: f(op) });
}
// gold stamp ("NEW RECORD!"): k 0..1 slams it on (big -> small, rotation settles)
function stamp(txt, x, y, k, o = {}) {
  if (k <= 0) return '';
  const size = o.size || 72, col = o.col || '#FFD21F', ink = o.ink || '#2A1600';
  const u = ease.out(clamp(k, 0, 1)), sc = lerp(2.6, 1, u), rot = lerp(-22, o.rot ?? -8, ease.outBack(clamp(k, 0, 1)));
  const w = txt.length * size * 0.56 + 70;
  let g = S.rect(-w / 2 + 8, -size * 0.75 + 10, w, size * 1.4, 18, { fill: '#000000', opacity: 0.3 });
  g += S.rect(-w / 2, -size * 0.75, w, size * 1.4, 18, { fill: col, stroke: ink, 'stroke-width': 8 });
  g += S.rect(-w / 2 + 12, -size * 0.75 + 12, w - 24, size * 1.4 - 24, 10, { fill: 'none', stroke: ink, 'stroke-width': 3, opacity: 0.6 });
  g += T(esc(txt), 0, size * 0.36, size, ink);
  if (o.stars !== false) g += star4(-w / 2 - 20, -size * 0.6, 26, 0, '#FFF6C8') + star4(w / 2 + 16, size * 0.5, 20, 20, '#FFF6C8');
  return S.g(g, tf(x, y, sc, rot), { opacity: f(Math.min(1, k * 3)) });
}
// Biscuit's stats trying to load: a plate with a spinner + a bar stuck at 99 %; k pop-in, stall 0..1 (stutter), t
function loadingPlate(x, y, k, t, o = {}) {
  if (k <= 0) return '';
  const th = HUD.theme('cyan');
  const s = (o.s || 1) * ease.outBack(clamp(k, 0, 1));
  const w = 330, h = 104, left = -w / 2, top = -h - 40;
  let g = S.path(`M0 0V-40`, { stroke: th.rim, 'stroke-width': 3 }) + S.path('M0 -7L7 0L0 7L-7 0Z', { fill: th.rim, stroke: th.edge, 'stroke-width': 2.5 });
  g += HUD.panel(left, top, w, h, th, { c: 14, br: 18 });
  g += K.loadingWheel(left + 44, top + 52, 22, o.stall ? Math.floor(t * 3) / 3 : t, th.rim, 8, 6);
  g += HUD.TL('LOADING STATS' + '.'.repeat(1 + (Math.floor(t * 3) % 3)), left + 82, top + 44, 28, th.text, { 'text-anchor': 'start' });
  const p = o.pct ?? 0.99;
  g += HUD.segBar(left + 84, top + 60, w - 120, 18, p, th.rim, { th, t, cell: 18 });
  g += HUD.TF(`${Math.round(p * 100)}%`, w / 2 - 14, top + 96, 16, '#FFD21F', { 'text-anchor': 'end' });
  return S.g(g, tf(x, y, s));
}
// soot smudges on a face (cx, cy = face centre, r = face half width), k 0..1
function soot(cx, cy, r, k) {
  if (k <= 0) return '';
  let g = '';
  [[-0.5, 0.25, 0.32], [0.45, 0.35, 0.26], [0.05, -0.55, 0.22], [-0.2, 0.6, 0.18]].forEach(([dx, dy, rr], i) => {
    g += S.ellipse(cx + dx * r, cy + dy * r, rr * r * 1.3, rr * r, { fill: '#2A2626', opacity: f(0.55 * k), transform: `rotate(${(i * 37) % 60 - 30} ${f(cx + dx * r)} ${f(cy + dy * r)})` });
  });
  return g;
}
// smoke puff (age seconds) — grey circles growing + fading
function puff(x, y, age, size = 60, n = 6, seed = 1, col = '#6A6470') {
  if (age < 0 || age > 1.4) return '';
  const u = age / 1.4;
  let d = '';
  for (let i = 0; i < n; i++) {
    const a = hash(i + seed) * Math.PI * 2, r = size * (0.5 + ease.out(u) * (0.8 + hash(i * 3 + seed)));
    const px = x + Math.cos(a) * size * 0.9 * ease.out(u), py = y + Math.sin(a) * size * 0.6 * ease.out(u) - 80 * u;
    d += `M${f(px - r)} ${f(py)}a${f(r)} ${f(r)} 0 1 0 ${f(2 * r)} 0a${f(r)} ${f(r)} 0 1 0 ${f(-2 * r)} 0Z`;
  }
  return S.path(d, { fill: col, opacity: f(0.75 * (1 - u)), stroke: LINE, 'stroke-width': 3, 'stroke-opacity': f(0.5 * (1 - u)) });
}
// milk splats (white blobs) around (x, y)
function milkSplats(x, y, k, n = 6, r = 20, seed = 4) {
  if (k <= 0) return '';
  let g = '';
  for (let i = 0; i < n; i++) {
    const a = hash(i * 2.1 + seed) * Math.PI * 2, d = r * 2 * hash(i * 3.3 + seed);
    const rr = r * (0.4 + 0.6 * hash(i * 5.7 + seed)) * ease.outBack(clamp(k, 0, 1));
    g += S.ellipse(x + Math.cos(a) * d, y + Math.sin(a) * d, rr, rr * 0.8, { fill: '#FFFDF6', stroke: '#C9C2B0', 'stroke-width': 2.5 });
  }
  return g;
}
// cereal rings (O's) scattered (x, y)
function cerealRings(x, y, r, n = 5, seed = 7, s = 1) {
  const cols = ['#FF5A5A', '#FFD21F', '#3BD16F', '#B06BFF', '#FF9A3D'];
  let g = '';
  for (let i = 0; i < n; i++) {
    const px = x + (hash(i * 1.9 + seed) - 0.5) * r * 2, py = y + (hash(i * 4.3 + seed) - 0.5) * r;
    g += S.circle(px, py, 9 * s, { fill: 'none', stroke: cols[i % 5], 'stroke-width': f(6 * s) }) + S.circle(px, py, 12 * s, { fill: 'none', stroke: LINE, 'stroke-width': 1.5, opacity: 0.5 });
  }
  return g;
}

module.exports = {
  LINE, tf, esc, TS, TFS, pop, camAt, toScr, shakeCam, clipTo, clipPoly, boing, whip, whipOut, smash, tint, fadeIn, zoomLines, edgeDark, star4,
  xpState, hudLayer, monitorCU, page, pageStorm, pageFountain, pilePaper, eyelids, pillow, feathers, angryBrows, dmgNum, stamp,
  loadingPlate, soot, puff, milkSplats, cerealRings,
};
