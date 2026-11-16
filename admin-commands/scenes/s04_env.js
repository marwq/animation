// Private helpers for SC 04 «ПРОВЕРКА КОМАНД» (testing the commands at home): transitions, split-screens, squash and
// stretch, the laptop held in the hero's hands, Granny's little car + the speedometer, the stopwatch, Zoe's icon cards,
// the server rack, the log screen and the webcam close-up.
'use strict';

const K = require('./kit');
const { S, f, clamp, lerp, ease, seg, bump, hash, ol, ln, T, TF } = K;
const SETS = require('./sets');

const LINE = '#151515';
const W = 1920, H = 1080;
const tf = (x, y, s = 1, r = 0) => `translate(${f(x)} ${f(y)})${r ? ` rotate(${f(r)})` : ''}${s !== 1 ? ` scale(${f(s)})` : ''}`;
const TS = (txt, x, y, size, fill, extra = {}) => T(txt, x, y, size, fill, { stroke: LINE, 'stroke-width': size * 0.14, 'paint-order': 'stroke', 'stroke-linejoin': 'round', ...extra });
const TFS = (txt, x, y, size, fill, extra = {}) => TF(txt, x, y, size, fill, { stroke: LINE, 'stroke-width': size * 0.14, 'paint-order': 'stroke', 'stroke-linejoin': 'round', ...extra });
const pop = (t, t0, d = 0.28) => ease.outBack(seg(t, t0, t0 + d));
// camera key that centres the world point (wx, wy) at the given zoom
const at = (wx, wy, zoom = 1) => ({ zoom, x: wx - 960, y: wy - 540 });
function shakeAll(cam, t, list) {
  for (const [t0, d, a] of list) { const s = K.shake(t, t0, d, a); cam.sx = (cam.sx || 0) + s.sx; cam.sy = (cam.sy || 0) + s.sy; }
  return cam;
}
// clip any svg to a rect / polygon (screen space)
function clipRect(x, y, w, h, inner, r = 0) {
  const id = S.uid('s04c');
  return S.clipDef(id, S.rect(x, y, w, h, r)) + S.g(inner, null, { 'clip-path': `url(#${id})` });
}
function clipPoly(pts, inner) {
  const id = S.uid('s04p');
  return S.clipDef(id, S.path('M' + pts.map(([x, y]) => `${f(x)} ${f(y)}`).join(' L') + ' Z')) + S.g(inner, null, { 'clip-path': `url(#${id})` });
}
// diagonal split-screen: a | b, the seam goes from (xTop, 0) to (xBot, 1080); k 0..1 slides the seam in from the right
function split(a, b, opts = {}) {
  const { xTop = 1010, xBot = 910, k = 1, col = '#FFFFFF' } = opts;
  const dx = (1 - ease.out(clamp(k, 0, 1))) * 1300;
  const xt = xTop + dx, xb = xBot + dx;
  let o = clipPoly([[-10, -10], [xt + 4, -10], [xb + 4, 1090], [-10, 1090]], a);
  o += clipPoly([[xt - 4, -10], [1930, -10], [1930, 1090], [xb - 4, 1090]], b);
  o += S.path(`M${f(xt)} -20 L${f(xb)} 1100`, ln(26, LINE)) + S.path(`M${f(xt)} -20 L${f(xb)} 1100`, ln(14, col));
  return o;
}

// ---------------------------------------------------------------- transitions
function whip(t, tc, dir = 1, dur = 0.1) {
  const d = t - tc;
  if (Math.abs(d) > dur) return '';
  const k = 1 - Math.abs(d) / dur;
  let o = S.rect(0, 0, W, H, 0, { fill: '#FFFFFF', opacity: f(0.6 * k) });
  let p = '';
  for (let i = 0; i < 16; i++) {
    const y = hash(i * 3.7) * H, len = 300 + hash(i) * 700, th = 8 + hash(i * 2.2) * 16;
    const x = ((hash(i * 5.1) * 2600 + dir * d * 16000) % 2600 + 2600) % 2600 - 400;
    p += `M${f(x)} ${f(y)}h${f(len)}v${f(th)}h${f(-len)}Z`;
  }
  return o + S.path(p, { fill: '#FFFFFF', opacity: f(0.85 * k) });
}
const smash = (t, tc, dur = 0.14, a = 0.8) => (t >= tc && t < tc + dur ? K.C.whiteFlash(a * (1 - (t - tc) / dur)) : '');
// coloured flash (e.g. gold for god mode)
const flashCol = (t, tc, col, dur = 0.2, a = 0.7) => (t >= tc && t < tc + dur ? S.rect(-50, -50, 2020, 1180, 0, { fill: col, opacity: f(a * (1 - (t - tc) / dur)) }) : '');
// speed lines radiating to the frame edges (smash-zoom accent)
function zoomLines(cx, cy, k, col = '#FFFFFF', n = 22, seed = 1) {
  if (k <= 0) return '';
  let d = '';
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + hash(i + seed) * 0.2;
    const r0 = 520 + hash(i * 3 + seed) * 260, r1 = r0 + 500 + hash(i * 7 + seed) * 400, wd = 10 + 14 * hash(i * 5 + seed);
    const ca = Math.cos(a), sa = Math.sin(a), nx = -sa * wd, ny = ca * wd;
    d += `M${f(cx + ca * r0)} ${f(cy + sa * r0)} L${f(cx + ca * r1 + nx)} ${f(cy + sa * r1 + ny)} L${f(cx + ca * r1 - nx)} ${f(cy + sa * r1 - ny)} Z `;
  }
  return S.path(d, { fill: col, opacity: f(0.8 * clamp(k, 0, 1)) });
}

// ---------------------------------------------------------------- squash & stretch, acting bits
// damped squash-stretch after an impact at t0 (sy < 1 = squash first); returns { sx, sy }
function squash(t, t0, amp = 0.28, dur = 0.7, freq = 22) {
  const k = t - t0;
  if (k < 0 || k > dur) return { sx: 1, sy: 1 };
  const v = -amp * Math.exp(-k * 5.5) * Math.cos(k * freq);
  return { sx: 1 - v * 0.7, sy: 1 + v };
}
// stretch tall (pop) — anticipation squash then stretch then settle
function popStretch(t, t0, amp = 0.3) {
  const k = t - t0;
  if (k < -0.12 || k > 0.8) return { sx: 1, sy: 1 };
  if (k < 0) { const u = (k + 0.12) / 0.12; return { sx: 1 + 0.18 * u, sy: 1 - 0.22 * u }; }
  const v = amp * Math.exp(-k * 6) * Math.cos(k * 18);
  return { sx: 1 - v * 0.6, sy: 1 + v };
}
// fast typing arms (front view, holding the laptop)
function typing(t, on = 1, base = 28) {
  const j = on ? Math.sin(t * 38) * 5 : 0, j2 = on ? Math.sin(t * 41 + 1.3) * 5 : 0;
  return { armL: base + j, armR: base + j2, bodyY: on ? 2 + Math.abs(Math.sin(t * 19)) * 3 : 0 };
}
const blinkK = (t, seed = 0) => { const b = (t + seed * 0.37) % 3.4; return b < 0.12 ? Math.sin((b / 0.12) * Math.PI) : 0; };
const fc = (name, t, seed = 0, extra = {}) => ({ name, blink: blinkK(t, seed), ...extra });

// the magic laptop held in front of the chest (front view, lid back towards the camera) — body-space prop
function heldLaptop(t, opts = {}) {
  const { s = 0.62, y = -232, glow = 1, rot = 0 } = opts;
  return { svg: SETS.laptop(0, y, s, '', { back: true, glow: 0, t, dust: 0.15, rot }) + (glow > 0 ? S.rect(-165, y - 236, 330, 228, 18, { fill: 'none', stroke: '#7DFFB8', 'stroke-width': 7, opacity: f(0.55 * glow) }) : ''), layer: 'front' };
}

// ---------------------------------------------------------------- the kitchen gag props
function spatula(x, y, s = 1, rot = 0) {
  let o = S.path('M0 0 L0 -150', ln(16)) + S.path('M0 0 L0 -150', ln(9, '#8A5A33'));
  o += S.path('M-34 -150 L34 -150 L28 -230 L-28 -230 Z', ol('#C9CED8', 5)) + S.path('M-14 -170 L-12 -214 M0 -170 L0 -216 M14 -170 L12 -214', ln(4, '#8A90A0'));
  return S.g(o, tf(x, y, s, rot));
}
function flatCake(x, y, s = 1, rot = 0, flipK = 1) {
  return S.g(S.ellipse(0, 0, 54, 13 * Math.max(0.15, Math.abs(flipK)), ol(flipK > 0 ? '#F4B85E' : '#E89A3C', 4)) + S.ellipse(-12, -3 * flipK, 18, 4 * Math.abs(flipK), { fill: '#FFD994', opacity: 0.8 }), tf(x, y, s, rot));
}
function cobweb(x, y, s = 1, k = 1) {
  if (k <= 0) return '';
  const d = 'M0 0 L-70 10 M0 0 L-52 46 M0 0 L-12 66 M0 0 L30 56 M-26 3 q-6 14 10 20 q12 -4 8 24 M-48 7 q-8 24 16 32 q18 2 20 24 M-60 9 q-10 30 20 44 q24 8 28 34';
  return S.g(S.path(d, ln(3, '#FFFFFF', 0.9)), tf(x, y, s * clamp(k, 0, 1)));
}
// car keys on a ring (with a pom-pom)
function carKeys(x, y, s = 1, rot = 0) {
  let o = S.circle(0, 0, 22, { fill: 'none', stroke: LINE, 'stroke-width': 9 }) + S.circle(0, 0, 22, { fill: 'none', stroke: '#C9CED8', 'stroke-width': 5 });
  o += S.g(S.path('M0 18 L0 80 L12 86 L0 92 L10 98 L0 106', ol('#FFD34D', 5)) + S.circle(0, 18, 14, ol('#FFD34D', 5)), 'rotate(-20)');
  o += S.g(S.path('M0 18 L0 70 L10 76 L0 84', ol('#C9CED8', 5)) + S.circle(0, 18, 12, ol('#C9CED8', 5)), 'rotate(30)');
  o += S.circle(-20, 30, 20, ol('#FF8FC4', 4));
  return S.g(o, tf(x, y, s, rot));
}

// ---------------------------------------------------------------- Granny's little car (side view, faces right)
// origin = ground under the middle; ~560 x 250 at s 1. opts: { t, driver: svg (drawn behind the body, shows through the
// window — draw it in car-local units), smoke 0..1 (burnout), shake, spin (wheel turns), flames 0..1, squash {sx, sy} }
function grannyCar(x, y, s = 1, opts = {}) {
  const t = opts.t || 0, smoke = opts.smoke || 0, flames = opts.flames || 0;
  const sh = opts.shake ? Math.sin(t * 60) * 3 * opts.shake : 0;
  const sq = opts.squash || { sx: 1, sy: 1 };
  let o = '';
  // exhaust smoke / burnout clouds behind (left)
  if (smoke > 0) {
    let d = '';
    for (let i = 0; i < 9; i++) {
      const u = ((t * 2.2 + i / 9) % 1);
      const r = 30 + 70 * u * (0.6 + 0.6 * hash(i));
      d += `M${f(-290 - 380 * u - r)} ${f(-40 - 120 * u * hash(i * 3) )} a${f(r)} ${f(r)} 0 1 0 ${f(2 * r)} 0 a${f(r)} ${f(r)} 0 1 0 ${f(-2 * r)} 0 Z `;
    }
    o += S.path(d, { fill: '#FFFFFF', stroke: LINE, 'stroke-width': 5, opacity: f(0.9 * smoke) });
  }
  if (flames > 0) o += S.g(require('../rig/cast').fireTrail({ x: -250, y: -60, len: 520 * flames, angle: 180, w: 120, t }), '');
  let b = '';
  if (opts.driver) b += clipRect(-130, -270, 280, 222, opts.driver);
  // body with the cabin window cut out
  const bodyD = 'M-262 -48 Q-272 -120 -206 -128 L-150 -134 Q-112 -226 -16 -230 L58 -230 Q126 -226 156 -138 L236 -128 Q284 -118 278 -48 Z';
  const winD = 'M-122 -138 Q-96 -208 -18 -212 L50 -212 Q104 -208 130 -138 Z';
  b += S.path(bodyD + ' ' + winD, { fill: '#8FD9C4', stroke: LINE, 'stroke-width': 7, 'stroke-linejoin': 'round', 'fill-rule': 'evenodd' });
  b += S.path(winD, { fill: '#CFF2FF', opacity: 0.28, stroke: LINE, 'stroke-width': 5 }) + S.path('M6 -212 L6 -138', ln(10, LINE)) + S.path('M6 -210 L6 -140', ln(5, '#8FD9C4'));
  b += S.path('M-96 -146 L-70 -200 L-52 -200 L-78 -146 Z', { fill: '#FFFFFF', opacity: 0.45 });
  b += S.path('M-250 -92 L268 -92', ln(5, '#5FB4A0')) + S.rect(-40, -126, 40, 10, 5, ol('#C9CED8', 3));
  b += S.rect(-286, -66, 70, 26, 12, ol('#E6ECF2', 5)) + S.rect(232, -66, 66, 26, 12, ol('#E6ECF2', 5));
  b += S.circle(258, -104, 18, ol('#FFF6C8', 5)) + S.rect(-270, -110, 18, 26, 6, ol('#FF5A5A', 4));
  b += S.g(TF('NANA 1', 0, 9, 18, '#2A2246'), 'translate(-252 -14)');
  // wheels
  for (const wx of [-150, 156]) {
    const sp = (opts.spin || 0) + wx;
    b += S.circle(wx, -46, 48, ol('#2A2633', 6)) + S.circle(wx, -46, 30, ol('#FFFFFF', 4)) + S.circle(wx, -46, 16, ol('#C9CED8', 4));
    b += S.path(`M${f(wx + Math.cos(sp) * 15)} ${f(-46 + Math.sin(sp) * 15)} L${f(wx - Math.cos(sp) * 15)} ${f(-46 - Math.sin(sp) * 15)}`, ln(4, '#8A90A0'));
  }
  o += S.g(b, `translate(0 ${f(sh)}) scale(${f(sq.sx)} ${f(sq.sy)})`);
  return S.g(o, tf(x, y, s));
}
// old car speedometer; val in MPH (needle pins at 120 and then breaks off), crack 0..1
function speedo(x, y, r, val, t, opts = {}) {
  const crack = opts.crack || 0;
  let o = S.circle(0, 0, r * 1.12, ol('#C9CED8', r * 0.05)) + S.circle(0, 0, r, ol('#FFF8E8', r * 0.03));
  // ticks 0..120 over -210..30 deg
  let tk = '', lab = '';
  for (let v = 0; v <= 120; v += 10) {
    const a = (-210 + (v / 120) * 240) * Math.PI / 180, big = v % 20 === 0;
    const r0 = r * (big ? 0.78 : 0.84), r1 = r * 0.93;
    tk += `M${f(Math.cos(a) * r0)} ${f(Math.sin(a) * r0)} L${f(Math.cos(a) * r1)} ${f(Math.sin(a) * r1)} `;
    if (big) lab += TF(String(v), Math.cos(a) * r * 0.62, Math.sin(a) * r * 0.62 + r * 0.06, r * 0.15, '#2A2246');
  }
  o += S.path(tk, ln(r * 0.035, LINE)) + lab;
  const red = (-210 + 200) * Math.PI / 180;
  o += S.path(`M${f(Math.cos(red) * r * 0.93)} ${f(Math.sin(red) * r * 0.93)} A${f(r * 0.93)} ${f(r * 0.93)} 0 0 1 ${f(Math.cos(30 * Math.PI / 180) * r * 0.93)} ${f(Math.sin(30 * Math.PI / 180) * r * 0.93)}`, ln(r * 0.05, '#FF3B4E'));
  o += TF('MPH', 0, -r * 0.3, r * 0.12, '#8A90A0');
  // digital readout
  const big = val > 120;
  o += S.rect(-r * 0.42, r * 0.28, r * 0.84, r * 0.3, r * 0.06, { fill: big ? '#2A0C12' : '#14182A', stroke: LINE, 'stroke-width': r * 0.025 });
  o += T(String(Math.round(val)), 0, r * 0.52, r * 0.24, big ? '#FF5A3D' : '#3DFF9A');
  // needle
  let na = -210 + (clamp(val, 0, 120) / 120) * 240;
  if (val > 120) na += Math.sin(t * 70) * 4;
  const broken = val > 380;
  if (!broken) o += S.g(S.path(`M${-r * 0.08} 0 L0 ${-r * 0.05} L${r * 0.82} 0 L0 ${r * 0.05} Z`, ol('#FF3B4E', r * 0.02)), `rotate(${f(na)})`);
  else {
    const u = clamp((val - 380) / 300, 0, 1);
    o += S.g(S.path(`M${-r * 0.08} 0 L0 ${-r * 0.05} L${r * 0.82} 0 L0 ${r * 0.05} Z`, ol('#FF3B4E', r * 0.02)), `translate(${f(r * 1.4 * u)} ${f(-r * 1.6 * u + r * 2.2 * u * u)}) rotate(${f(30 + u * 900)})`);
  }
  o += S.circle(0, 0, r * 0.09, ol('#2A2246', r * 0.02));
  if (crack > 0) {
    const c = clamp(crack, 0, 1);
    o += S.path(`M${f(r * 0.1)} ${f(-r * 0.2)} l${f(r * 0.3 * c)} ${f(-r * 0.3 * c)} l${f(r * 0.1 * c)} ${f(-r * 0.3 * c)} M${f(r * 0.1)} ${f(-r * 0.2)} l${f(-r * 0.4 * c)} ${f(-r * 0.2 * c)} l${f(-r * 0.2 * c)} ${f(-r * 0.3 * c)} M${f(r * 0.1)} ${f(-r * 0.2)} l${f(r * 0.45 * c)} ${f(r * 0.1 * c)} l${f(r * 0.3 * c)} ${f(r * 0.25 * c)}`, ln(r * 0.02, '#FFFFFF', 0.95)) + S.path(`M${f(r * 0.1)} ${f(-r * 0.2)} l${f(r * 0.3 * c)} ${f(-r * 0.3 * c)} l${f(r * 0.1 * c)} ${f(-r * 0.3 * c)} M${f(r * 0.1)} ${f(-r * 0.2)} l${f(-r * 0.4 * c)} ${f(-r * 0.2 * c)}`, ln(r * 0.008, LINE, 0.6));
  }
  o += S.path(`M${f(-r * 0.7)} ${f(-r * 0.5)} Q${f(-r * 0.3)} ${f(-r * 0.92)} ${f(r * 0.2)} ${f(-r * 0.88)}`, ln(r * 0.05, '#FFFFFF', 0.6));
  return S.g(o, tf(x, y));
}
// stopwatch (sec 0..) with a sweeping hand; label shows M:SS
function stopwatch(x, y, r, sec, s = 1, rot = 0) {
  let o = S.rect(-r * 0.18, -r * 1.32, r * 0.36, r * 0.3, r * 0.06, ol('#C9CED8', 6)) + S.rect(-r * 0.3, -r * 1.42, r * 0.6, r * 0.14, r * 0.07, ol('#FF5A5A', 6));
  o += S.circle(0, 0, r * 1.06, ol('#FF5A5A', 8)) + S.circle(0, 0, r * 0.9, ol('#FFFFFF', 5));
  let tk = '';
  for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; tk += `M${f(Math.sin(a) * r * 0.74)} ${f(-Math.cos(a) * r * 0.74)} L${f(Math.sin(a) * r * 0.84)} ${f(-Math.cos(a) * r * 0.84)} `; }
  o += S.path(tk, ln(6, LINE));
  const a = ((sec % 60) / 60) * Math.PI * 2;
  o += S.path(`M0 0 L${f(Math.sin(a) * r * 0.72)} ${f(-Math.cos(a) * r * 0.72)}`, ln(9, '#FF3B4E')) + S.circle(0, 0, 10, ol('#2A2246', 4));
  const m = Math.floor(sec / 60), ss = String(Math.floor(sec % 60)).padStart(2, '0');
  o += S.rect(-r * 0.46, r * 0.22, r * 0.92, r * 0.36, 12, ol('#14182A', 4)) + T(`${m}:${ss}`, 0, r * 0.5, r * 0.3, '#3DFF9A');
  return S.g(o, tf(x, y, s, rot));
}

// ---------------------------------------------------------------- sky / outdoors bits
function bird(x, y, s, t, ph = 0, col = '#FFFFFF') {
  const fl = Math.sin(t * 14 + ph) * 22;
  const o = S.path(`M-40 ${f(-fl)} Q-20 -10 0 0 Q20 -10 40 ${f(-fl)}`, ln(14, LINE)) + S.path(`M-40 ${f(-fl)} Q-20 -10 0 0 Q20 -10 40 ${f(-fl)}`, ln(7, col));
  return S.g(o, tf(x, y, s));
}
// a perched bird (sits on Dad's head), side view facing left
function perchBird(x, y, s, t) {
  const bob = Math.abs(Math.sin(t * 6)) * 4;
  let o = S.ellipse(0, -30 - bob, 34, 26, ol('#6FA8FF', 5)) + S.circle(-26, -56 - bob, 18, ol('#6FA8FF', 5)) + S.path(`M-42 ${-58 - bob} L-62 ${-52 - bob} L-42 ${-46 - bob} Z`, ol('#FFB13B', 3));
  o += S.circle(-30, -60 - bob, 4, { fill: LINE }) + S.path(`M10 ${-34 - bob} Q30 ${-46 - bob} 40 ${-26 - bob}`, ln(5)) + S.path('M-8 -6 L-8 4 M8 -6 L8 4', ln(4, '#FFB13B'));
  return S.g(o, tf(x, y, s));
}
// open sky panel (for Dad's "sky office"): gradient sky + drifting clouds; dy scrolls the clouds vertically
function skyPanel(t, opts = {}) {
  const { drift = 60, dy = 0, top = '#3C9BFF' } = opts;
  let o = S.rect(-800, -600, 3520, 2280, 0, { fill: 'url(#setsSkyDay)' });
  for (let i = 0; i < 8; i++) {
    const x = ((hash(i * 3.1) * 2600 + t * drift * (0.6 + hash(i))) % 2600) - 340;
    const y = 80 + hash(i * 5.7) * 900 + dy * (0.6 + 0.6 * hash(i * 2));
    o += SETS.cloud(x, y, 0.8 + hash(i * 7.3) * 1.2);
  }
  return o;
}

// ---------------------------------------------------------------- Zoe's explanation cards + the server
// a rounded chip card with an icon (drawn by fn at (0,-30)) and a label; k = pop
function iconCard(x, y, k, icon, label, col = '#3DFF9A', rot = 0) {
  if (k <= 0) return '';
  let o = S.rect(-170, -170, 340, 340, 44, ol('#141824', 8)) + S.rect(-156, -156, 312, 312, 36, { fill: 'none', stroke: col, 'stroke-width': 5, opacity: 0.8 });
  o += S.g(icon, 'translate(0 -40)');
  o += TFS(label, 0, 126, 54, col);
  return S.g(o, tf(x, y, ease.outBack(clamp(k, 0, 1)), rot));
}
// tiny blocky avatar (game character) for the cards
function blocky(x, y, s, col = '#3D8BFF', pose = 0) {
  const a = pose * 60;
  let o = S.rect(-34, -40, 30, 70, 8, ol('#2A2246', 4)) + S.rect(4, -40, 30, 70, 8, ol('#2A2246', 4));
  o += S.g(S.rect(-14, 0, 28, 80, 10, ol('#FFD8A8', 4)), `translate(-58 -120) rotate(${f(a)})`) + S.g(S.rect(-14, 0, 28, 80, 10, ol('#FFD8A8', 4)), `translate(58 -120) rotate(${f(-a)})`);
  o += S.rect(-44, -130, 88, 96, 12, ol(col, 5)) + S.rect(-36, -214, 72, 76, 16, ol('#FFD8A8', 5)) + S.circle(-14, -180, 6, { fill: LINE }) + S.circle(14, -180, 6, { fill: LINE }) + S.path('M-12 -160 Q0 -150 12 -160', ln(4));
  return S.g(o, tf(x, y, s));
}
function iconFly(t) { return S.path('M-110 -10 Q-70 -60 -30 -20 M110 -10 Q70 -60 30 -20', ln(14, '#FFFFFF')) + blocky(0, 70 + Math.sin(t * 5) * 10, 0.62, '#3D8BFF', 1.6) + S.path('M-50 90 L-70 110 M0 96 L0 120 M50 90 L70 110', ln(8, '#7CF7FF')); }
function iconTp(t) {
  const sp = t * 4;
  return S.ellipse(-60, 80, 50, 16, { fill: 'none', stroke: '#B06BFF', 'stroke-width': 10 }) + S.ellipse(60, 80, 50, 16, { fill: 'none', stroke: '#B06BFF', 'stroke-width': 10 }) +
    blocky(60, 76, 0.42, '#3D8BFF') + S.path(`M-60 40 q${f(10 * Math.sin(sp))} -30 0 -60 M-40 50 q${f(10 * Math.sin(sp + 1))} -30 0 -60 M-80 50 q${f(10 * Math.sin(sp + 2))} -30 0 -60`, ln(6, '#E6B8FF')) + S.path('M-20 20 L30 20 M18 8 L30 20 L18 32', ln(8, '#FFFFFF'));
}
function iconBan(t) {
  const sw = Math.max(0, Math.sin(t * 6)) * 40;
  return blocky(-10, 90, 0.5, '#FF8A5B') + S.g(S.rect(-70, -26, 100, 52, 10, ol('#C98A52', 5)) + S.rect(-14, 20, 18, 110, 6, ol('#8A5A33', 4)), `translate(60 -40) rotate(${f(-30 + sw)} -5 70)`) + S.circle(-10, 10, 70, { fill: 'none', stroke: '#FF3B4E', 'stroke-width': 10 }) + S.path('M-60 -40 L40 60', ln(10, '#FF3B4E'));
}
// server rack (front view); crownK drops a golden crown onto it; lights blink with t
function serverRack(x, y, s, t, crownK = 0) {
  let o = S.rect(-150, -420, 300, 420, 18, ol('#2A3042', 8)) + S.rect(-130, -400, 260, 380, 10, { fill: '#1A1E2B' });
  for (let i = 0; i < 6; i++) {
    const yy = -390 + i * 62;
    o += S.rect(-120, yy, 240, 50, 8, ol('#3A4258', 4));
    for (let j = 0; j < 4; j++) o += S.circle(-96 + j * 22, yy + 25, 6, { fill: hash(i * 7 + j + Math.floor(t * 6) * 0.3) > 0.4 ? ['#3DFF9A', '#FFB13B', '#34C3FF'][j % 3] : '#2A3042' });
    o += S.rect(10, yy + 18, 96, 14, 4, { fill: '#10131C' });
  }
  if (crownK > 0) {
    const u = ease.out(clamp(crownK, 0, 1)), cy = lerp(-900, -470, u) + (crownK > 1 ? 0 : 0);
    const bounce = crownK >= 1 ? 0 : 0;
    o += S.g(S.path('M-110 40 L-120 -60 L-60 -10 L0 -90 L60 -10 L120 -60 L110 40 Z', ol('#FFD34D', 8)) + S.rect(-118, 30, 236, 40, 10, ol('#E8B400', 6)) + TF('ADMIN', 0, 62, 30, '#3A2A10') +
      S.circle(-120, -66, 12, ol('#FF5A8A', 4)) + S.circle(0, -96, 12, ol('#34C3FF', 4)) + S.circle(120, -66, 12, ol('#3DFF9A', 4)), `translate(0 ${f(cy + bounce)}) rotate(${f((1 - u) * -25)})`);
  }
  return S.g(o, tf(x, y, s));
}

// ---------------------------------------------------------------- screens
// the admin log, full frame: lines appear at times; each gets a SAVED stamp
function logScreen(t, rows, opts = {}) {
  const { title = 'ADMIN PANEL v1.0 — COMMAND LOG', eye = 0 } = opts;
  let o = S.rect(-50, -50, 2020, 1180, 0, { fill: '#040706' }) + S.rect(-50, -50, 2020, 150, 0, { fill: '#0C1C14' }) + S.path('M-50 100 H1970', ln(4, '#3DFF9A', 0.6));
  o += S.g(S.path('M-11 5 L-13 -8 L-5 -2 L0 -11 L5 -2 L13 -8 L11 5 Z', { fill: '#FFD34D' }), 'translate(90 58) scale(2.6)') + T(title, 150, 76, 50, '#3DFF9A', { 'text-anchor': 'start', 'letter-spacing': 2 });
  rows.forEach(([txt, t0, t1], i) => {
    const k = seg(t, t0, t0 + 0.12);
    if (k <= 0) return;
    const y = 200 + i * 98;
    o += S.g(TF(String(i + 1).padStart(2, '0'), 90, 0, 40, '#1E5A3C', { 'text-anchor': 'start' }) + TF('[you]:', 170, 0, 48, '#FFB13B', { 'text-anchor': 'start' }) + TF(txt, 330, 0, 56, '#F2F7FF', { 'text-anchor': 'start' }), `translate(${f(-40 * (1 - k))} ${f(y)})`, { opacity: f(k) });
    const sk = seg(t, t1, t1 + 0.18);
    if (sk > 0) {
      const sc = 1 + 1.4 * (1 - ease.out(sk));
      o += S.g(S.rect(-110, -40, 220, 64, 12, { fill: 'none', stroke: '#3DFF9A', 'stroke-width': 7 }) + T('SAVED', 0, 12, 46, '#3DFF9A'), `translate(1560 ${f(y - 14)}) rotate(-6) scale(${f(sc)})`, { opacity: f(clamp(sk * 3, 0, 1) * 0.95) });
    }
  });
  if (eye > 0) {
    const bl = Math.floor(t * 2) % 2 ? 1 : 0.4;
    o += S.g(S.rect(-170, -40, 340, 80, 40, { fill: '#2A0C12', stroke: '#FF3B4E', 'stroke-width': 5 }) + S.path('M-120 0 Q-90 -30 -60 0 Q-90 30 -120 0 Z', ol('#FFFFFF', 4)) + S.circle(-90, 0, 11, { fill: '#FF3B4E', opacity: f(bl) }) + TF('VIEWERS: 1', 40, 14, 38, '#FF3B4E'), `translate(1680 1010) scale(${f(ease.outBack(clamp(eye, 0, 1)))})`);
  }
  o += S.rect(-50, -50, 2020, 1180, 0, { fill: 'url(#setsScan)', opacity: 0.5 });
  return o;
}
// extreme close-up of the laptop's webcam in the bezel; led 0..1 turns the light on
function webcam(t, led = 0) {
  let o = S.rect(-50, -50, 2020, 1180, 0, { fill: '#B3AA8E' }) + S.rect(-50, 380, 2020, 760, 0, { fill: '#2A2722' }) + S.path('M-50 380 H1970', ln(10, LINE));
  o += S.rect(-50, 1000, 2020, 200, 0, { fill: '#050807' }) + S.rect(-50, 1000, 2020, 200, 0, { fill: '#3DFF9A', opacity: 0.12 });
  o += S.rect(-50, -50, 2020, 430, 0, { fill: 'url(#setsDust)', opacity: 0.6 });
  o += S.circle(960, 640, 150, ol('#141416', 12)) + S.circle(960, 640, 100, { fill: '#0A0A0E', stroke: '#2E3140', 'stroke-width': 10 }) + S.circle(960, 640, 50, { fill: '#1C2240' }) + S.circle(925, 605, 26, { fill: '#FFFFFF', opacity: 0.35 }) + S.circle(990, 670, 10, { fill: '#FFFFFF', opacity: 0.2 });
  if (led > 0) o += SETS.glowSpot(1230, 640, 160, 'setsGlowGreen', led) + S.circle(1230, 640, 26, { fill: '#3DFF9A', stroke: LINE, 'stroke-width': 6, opacity: f(clamp(led * 1.5, 0.15, 1)) });
  else o += S.circle(1230, 640, 26, { fill: '#2E3A30', stroke: LINE, 'stroke-width': 6 });
  return o;
}
// a cosy panel for Zoe answering the phone (purple room, posters)
function zoeRoom(t) {
  let o = S.rect(-800, -600, 3520, 2280, 0, { fill: '#6A4FC8' }) + S.rect(-800, 790, 3520, 900, 0, { fill: '#4A3A8A' }) + S.path('M-800 790 H2720', ln(6, LINE, 0.7));
  for (let i = 0; i < 18; i++) o += S.circle(hash(i * 3.3) * 1920, hash(i * 7.1) * 760, 3 + hash(i) * 4, { fill: '#FFFFFF', opacity: 0.25 });
  o += S.g(S.rect(-110, -150, 220, 300, 10, ol('#141824', 6)) + T('</>', 0, 10, 90, '#3DFF9A') + TF('HACK THE', 0, 80, 26, '#FFFFFF') + TF('PLANET', 0, 112, 26, '#FFD34D'), 'translate(1400 330) rotate(4)');
  o += S.g(S.rect(-90, -90, 180, 180, 10, ol('#FFD34D', 6)) + T('01', 0, 20, 80, '#2A2246'), 'translate(420 300) rotate(-6)');
  return o;
}

module.exports = {
  tf, TS, TFS, pop, at, shakeAll, clipRect, clipPoly, split, whip, smash, flashCol, zoomLines, squash, popStretch, typing, blinkK, fc,
  heldLaptop, spatula, flatCake, cobweb, carKeys, grannyCar, speedo, stopwatch, bird, perchBird, skyPanel,
  iconCard, blocky, iconFly, iconTp, iconBan, serverRack, logScreen, webcam, zoeRoom,
};
