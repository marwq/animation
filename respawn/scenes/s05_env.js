// Private helpers for SC 05 («ИДЕАЛЬНЫЙ ДЕНЬ» — the perfect day at school): transitions, split-screen panels, the hero
// on a skateboard, cheap panel backgrounds for the montages, the predicted-trajectory lines, the two-finger pinch, the
// milk jets, a pizza slice, HA-HA letters, the gold rays, the 8:00 clock stamp, the custom quiz sheet.
'use strict';

const K = require('./kit');
const { S, f, clamp, lerp, ease, seg, bump, hash, ol, ln, T, TF } = K;
const R = require('./respawn');
const SS = require('./sets_school');
const X = require('../rig/extras');
const { handAt, D } = require('../rig/cast');

const LINE = '#151515';
const W = 1920, H = 1080;
const tf = (x, y, s = 1, r = 0) => `translate(${f(x)} ${f(y)})${r ? ` rotate(${f(r)})` : ''}${s !== 1 ? ` scale(${f(s)})` : ''}`;
const TS = (txt, x, y, size, fill, extra = {}) => T(txt, x, y, size, fill, { stroke: LINE, 'stroke-width': size * 0.16, 'paint-order': 'stroke', 'stroke-linejoin': 'round', ...extra });
const TFS = (txt, x, y, size, fill, extra = {}) => TF(txt, x, y, size, fill, { stroke: LINE, 'stroke-width': size * 0.16, 'paint-order': 'stroke', 'stroke-linejoin': 'round', ...extra });
const pop = (t, t0, d = 0.28) => ease.outBack(seg(t, t0, t0 + d));
const toScr = (cam, x, y) => SS.toScreen(cam, x, y, 1);
function shakeAll(cam, t, list) {
  const c = { ...cam };
  for (const [t0, d, a] of list) { const s = K.shake(t, t0, d, a); c.sx = (c.sx || 0) + s.sx; c.sy = (c.sy || 0) + s.sy; }
  return c;
}
function clipTo(x, y, w, h, inner, r = 0) {
  const id = S.uid('s05c');
  return S.clipDef(id, S.rect(x, y, w, h, r)) + S.g(inner, null, { 'clip-path': `url(#${id})` });
}
// squash/stretch impulse after t0
function boing(t, t0, amp = 0.25, dur = 0.7) {
  const k = t - t0;
  if (k < 0 || k > dur) return { sx: 1, sy: 1 };
  const v = amp * Math.exp(-k * 7) * Math.cos(k * 20);
  return { sx: 1 - v * 0.6, sy: 1 + v };
}

// ---------------------------------------------------------------- transitions
function whip(t, tc, dir = 1, dur = 0.1) {
  const d = t - tc;
  if (Math.abs(d) > dur) return '';
  const k = 1 - Math.abs(d) / dur;
  let p = '';
  for (let i = 0; i < 16; i++) {
    const y = hash(i * 3.7) * H, len = 300 + hash(i) * 700, th = 8 + hash(i * 2.2) * 16;
    const x = ((hash(i * 5.1) * 2600 + dir * d * 16000) % 2600 + 2600) % 2600 - 400;
    p += `M${f(x)} ${f(y)}h${f(len)}v${f(th)}h${f(-len)}Z`;
  }
  return S.rect(0, 0, W, H, 0, { fill: '#FFFFFF', opacity: f(0.6 * k) }) + S.path(p, { fill: '#FFFFFF', opacity: f(0.85 * k) });
}
const smash = (t, tc, dur = 0.14, a = 0.75) => (t >= tc && t < tc + dur ? K.C.whiteFlash(a * (1 - (t - tc) / dur)) : '');
// radial zoom lines around (cx, cy) for punchlines (k 0..1)
function zoomLines(cx, cy, k, t, col = '#FFFFFF', n = 22, r0b = 380) {
  if (k <= 0) return '';
  let d = '';
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + hash(i * 3.1) * 0.2, r0 = r0b + hash(i + Math.floor(t * 12)) * 160, r1 = r0 + 600;
    const w = 10 + hash(i * 1.7) * 14;
    const ax = Math.cos(a), ay = Math.sin(a), nx = -ay * w, ny = ax * w;
    d += `M${f(cx + ax * r0)} ${f(cy + ay * r0)}L${f(cx + ax * r1 + nx)} ${f(cy + ay * r1 + ny)}L${f(cx + ax * r1 - nx)} ${f(cy + ay * r1 - ny)}Z`;
  }
  return S.path(d, { fill: col, opacity: f(0.75 * k) });
}
// horizontal speed streaks across a band (screen space), drifting with t
function streaks(t, y0, y1, n, seed, col = '#FFFFFF', op = 0.6, speed = 2600, dir = -1) {
  let d = '';
  for (let i = 0; i < n; i++) {
    const y = lerp(y0, y1, hash(i * 2.3 + seed)), len = 160 + hash(i * 5.7 + seed) * 380, th = 5 + hash(i * 1.1 + seed) * 9;
    const x = (((hash(i * 7.9 + seed) * 2600 + dir * t * speed * (0.6 + 0.8 * hash(i + seed))) % 2600) + 2600) % 2600 - 340;
    d += `M${f(x)} ${f(y)}h${f(len)}v${f(th)}h${f(-len)}Z`;
  }
  return S.path(d, { fill: col, opacity: f(op) });
}
// letterbox bars (slow-mo / cinematic), k 0..1
const letterbox = (k, h = 92) => (k > 0 ? S.rect(-10, -10, W + 20, 10 + h * k, 0, { fill: '#05070C' }) + S.rect(-10, H - h * k, W + 20, h * k + 10, 0, { fill: '#05070C' }) : '');

// ---------------------------------------------------------------- split-screen panels
// draw `inner` (authored for a full 1920x1080 frame) scaled into the screen rect (x, y, w, h); white frame + dark rim
function panel(x, y, w, h, inner, o = {}) {
  const k = o.k ?? 1;
  if (k <= 0.001) return '';
  const sc = Math.max(w / W, h / H);
  const cx = x + w / 2, cy = y + h / 2;
  const id = S.uid('s05p');
  let g = S.clipDef(id, S.rect(x, y, w, h, o.r ?? 0));
  g += S.g(S.g(inner, `translate(${f(cx)} ${f(cy)}) scale(${f(sc * (o.zoom || 1))}) translate(${f(-960 - (o.dx || 0))} ${f(-540 - (o.dy || 0))})`), null, { 'clip-path': `url(#${id})` });
  if (o.tint) g += S.rect(x, y, w, h, 0, { fill: o.tint, opacity: f(o.tintOp ?? 0.35) });
  g += S.rect(x, y, w, h, o.r ?? 0, { fill: 'none', stroke: '#FFFFFF', 'stroke-width': o.border ?? 10 });
  g += S.rect(x - 5, y - 5, w + 10, h + 10, o.r ?? 0, { fill: 'none', stroke: LINE, 'stroke-width': 4 });
  if (k < 1) {
    const e = ease.outBack(k);
    return S.g(g, `translate(${f(cx)} ${f(cy)}) scale(${f(e)}) translate(${f(-cx)} ${f(-cy)})`, { opacity: f(seg(k, 0, 0.3)) });
  }
  return g;
}
// label tag on a panel (top-left corner of the rect)
function panelTag(x, y, text, col = '#151A26', fg = '#FFFFFF', s = 1) {
  const w = (text.length * 19 + 40) * s;
  return S.g(S.rect(0, 0, w, 50 * s, 25 * s, { fill: col, opacity: 0.9, stroke: LINE, 'stroke-width': 4 }) + TF(text, w / 2, 35 * s, 28 * s, fg, { 'letter-spacing': 1 }), tf(x, y));
}

// ---------------------------------------------------------------- cheap backgrounds (full 1920x1080 frames, no camera)
// skate panel: sky, chain-link fence line, trees, concrete pad; prop: 'ramp' | 'rail' | 'trash' | 'flat'
function skateBg(prop = 'ramp', o = {}) {
  const sky = o.sky || '#8FD3FF';
  let g = S.rect(-40, -40, W + 80, 800, 0, { fill: sky }) + S.rect(-40, 420, W + 80, 380, 0, { fill: '#BFE6FF', opacity: 0.6 });
  // trees (simple blobs)
  let tr = '';
  for (let i = 0; i < 7; i++) { const x = -60 + i * 330 + hash(i * 4.4) * 80, r = 150 + hash(i * 2.1) * 60; tr += `M${f(x - r)} 640 a${f(r)} ${f(r * 0.9)} 0 1 1 ${f(2 * r)} 0 Z`; }
  g += S.path(tr, ol('#4FBF5E', 6));
  g += S.rect(-40, 560, W + 80, 190, 0, { fill: 'url(#ssChain)', opacity: 0.9 }) + S.path('M-40 560 H1960', ln(10, '#8C98AA'));
  for (let x = 40; x < W; x += 320) g += S.rect(x, 540, 18, 230, 6, ol('#9AA6B8', 4));
  g += S.rect(-40, 750, W + 80, 400, 0, { fill: '#D6DEE7' }) + S.path('M-40 752 H1960', ln(6, '#9FB0C2'));
  let cr = '';
  for (let x = -40; x < W + 80; x += 300) cr += `M${x} 752 L${x - 120} 1100 `;
  g += S.path(cr + 'M-40 900 H1960', ln(4, '#B4C0CD'));
  if (prop === 'ramp') g += SS.skateRamp(1000, 960, 380, 520, {});
  else if (prop === 'rail') g += SS.grindRail(700, 960, 600, 122);
  else if (prop === 'trash') g += SS.trashCan(1040, 960, 1.05, { dent: 0.6 });
  return g;
}
// gym panel: pale-blue block wall, teal wainscot, maple floor, a banner
function gymBg(o = {}) {
  let g = S.rect(-40, -40, W + 80, 760, 0, { fill: '#BFE0F5' });
  let bl = '';
  for (let y = 60; y < 560; y += 70) bl += `M-40 ${y} H1960 `;
  g += S.path(bl, ln(4, '#A6CBE6'));
  g += S.rect(-40, 560, W + 80, 160, 0, { fill: '#2FB3A6' }) + S.path('M-40 560 H1960', ln(8, LINE));
  g += S.rect(-40, 720, W + 80, 420, 0, { fill: '#E9B872' }) + S.path('M-40 720 H1960', ln(8, LINE));
  let pl = '';
  for (let y = 760; y < 1100; y += 46) pl += `M-40 ${y} H1960 `;
  g += S.path(pl, ln(3, '#D49E58'));
  g += S.path('M-40 930 H1960', ln(10, '#FFFFFF', 0.8));
  if (o.banner !== false) g += S.g(S.rect(-240, -60, 480, 120, 14, ol('#7A3CC8', 6)) + TS(o.banner || 'COMETS', 0, 26, 74, '#FFD23F'), tf(o.bx ?? 1420, 220, 1, -2));
  return g;
}

// ---------------------------------------------------------------- the hero + skateboard
// skateboard as a BODY-space prop under the feet (deck centre 18 below the feet: feet stand on the grip)
const boardProp = (o = {}) => ({ svg: X.skateboard({ x: o.x ?? 0, y: o.y ?? 26, s: o.s ?? 1, rot: o.rot ?? 0, flipK: o.flipK ?? 0 }), layer: o.layer || 'front' });
const BOARD_H = 94;   // body units from the hero's feet to the ground when standing on the board (wheel bottoms)
// riding stance (side view): knees bent, arms out
function rideStance(t, ph = 0, amp = 1) {
  const w = Math.sin(t * 5 + ph);
  return { legL: 16, legR: -16, kneeL: 22 + 6 * w * amp, kneeR: 22 - 6 * w * amp, armL: 70 + 10 * w * amp, armR: -40 - 8 * w * amp, bodyY: 18 + 6 * w * amp, lean: 6 };
}
// a world-space hand point for the side view (flip = facing right)
function sideHand(pose, side = 1) {
  const [hx, hy] = handAt(D.you, { view: 'side', armL: pose.armL, armR: pose.armR }, side);
  const fl = pose.flip ? -1 : 1;
  return [pose.x + fl * hx * pose.s, pose.y - (pose.lift || 0) + hy * pose.s];
}

// ---------------------------------------------------------------- props + FX
// predicted trajectory (dashed green line with chevrons and an end ring), k 0..1 draws it on, op fades
function trajectory(pts, k, op = 1, col = '#3DDC84') {
  if (k <= 0 || op <= 0) return '';
  const n = Math.max(2, Math.ceil(pts.length * clamp(k, 0, 1)));
  const P = pts.slice(0, n);
  const d = 'M' + P.map(([x, y]) => `${f(x)} ${f(y)}`).join(' L');
  let o = S.path(d, { ...ln(16, '#0C2A1A', 0.45 * op), 'stroke-dasharray': '2 30' }) + S.path(d, { ...ln(9, col, op), 'stroke-dasharray': '26 18' });
  const e = P[P.length - 1];
  if (k >= 1) o += S.circle(e[0], e[1], 26, { fill: 'none', stroke: col, 'stroke-width': 6, opacity: f(op) }) + S.circle(e[0], e[1], 7, { fill: col, opacity: f(op) });
  return o;
}
// sample a quadratic path from a -> c (control b), n points
function quadPts(a, b, c, n = 24) {
  const out = [];
  for (let i = 0; i <= n; i++) { const u = i / n, v = 1 - u; out.push([v * v * a[0] + 2 * v * u * b[0] + u * u * c[0], v * v * a[1] + 2 * v * u * b[1] + u * u * c[1]]); }
  return out;
}
const quadAt = (a, b, c, u) => { const v = 1 - u; return [v * v * a[0] + 2 * v * u * b[0] + u * u * c[0], v * v * a[1] + 2 * v * u * b[1] + u * u * c[1]]; };
// a flying dodgeball with a motion trail (screen or world coordinates), dir = travel direction angle (rad)
function ballTrail(x, y, r, ang, len, col = '#E8453C', rot = 0) {
  let o = '';
  const ax = Math.cos(ang), ay = Math.sin(ang);
  for (let i = 3; i >= 1; i--) o += S.circle(x - ax * len * i / 3, y - ay * len * i / 3, r * (1 - i * 0.18), { fill: '#FFFFFF', opacity: f(0.18 * (4 - i) / 3) });
  return o + X.dodgeball({ x, y, s: r / 62, rot, col });
}
// two white fingers pinching (front view, screen space): (x, y) = the pinch point, s = scale, rot
function pinchHand(x, y, s = 1, rot = 0, open = 0) {
  const g = 26 * open;
  let o = '';
  // palm block (the hero's white R6 hand) + two fingers
  o += S.rect(-46, 40, 92, 96, 22, ol('#FFFFFF', 7));
  o += S.g(S.rect(-14, -10, 28, 70, 13, ol('#FFFFFF', 6)), `translate(${f(-22 - g)} 0) rotate(${f(-8 - 10 * open)})`);
  o += S.g(S.rect(-14, -10, 28, 70, 13, ol('#FFFFFF', 6)), `translate(${f(22 + g)} 0) rotate(${f(8 + 10 * open)})`);
  o += S.path('M-30 112 Q0 124 30 112', ln(5, '#C9CFDA'));
  return S.g(o, tf(x, y, s, rot));
}
// milk jets from two nostrils: (x, y) = between the nostrils, k 0..1 (grow), t clock, dir +1 right / -1 left
function milkJets(x, y, k, t, s = 1, dir = 1) {
  if (k <= 0) return '';
  let o = '';
  for (const side of [-1, 1]) {
    const ox = side * 12 * s;
    const len = 260 * s * ease.out(k), drop = 140 * s * k;
    const x1 = x + ox + dir * len, y1 = y + drop;
    const cx = x + ox + dir * len * 0.5 + side * 20 * s, cy = y - 90 * s * k;
    const w = 14 * s * (0.8 + 0.2 * Math.sin(t * 30 + side));
    o += S.path(`M${f(x + ox)} ${f(y)} Q${f(cx)} ${f(cy)} ${f(x1)} ${f(y1)}`, ln(w + 8 * s, LINE)) + S.path(`M${f(x + ox)} ${f(y)} Q${f(cx)} ${f(cy)} ${f(x1)} ${f(y1)}`, ln(w, '#FFFFFF'));
    // drops
    for (let i = 0; i < 4; i++) {
      const ph = (t * 2.2 + i / 4 + side * 0.13) % 1;
      const dx = x1 + dir * ph * 120 * s, dy = y1 + ph * ph * 260 * s;
      o += S.circle(dx, dy, (9 - ph * 4) * s, ol('#FFFFFF', 3 * s));
    }
  }
  return o;
}
// pizza slice (point up by default), (x, y) = crust centre
function pizzaSlice(x, y, s = 1, rot = 0, drip = 0) {
  let o = S.path('M-70 0 Q0 -24 70 0 L6 -190 Q0 -198 -6 -190 Z', ol('#FFC84A', 6));
  o += S.path('M-60 -14 Q0 -34 60 -14 L48 -46 Q0 -62 -48 -46 Z', { fill: '#FFE08A' });
  o += S.path('M-76 4 Q0 -24 76 4 L70 -16 Q0 -42 -70 -16 Z', ol('#D9892E', 6));
  o += S.circle(-18, -80, 16, ol('#E2452F', 4)) + S.circle(22, -112, 13, ol('#E2452F', 4)) + S.circle(-4, -150, 9, ol('#E2452F', 3.5)) + S.circle(26, -64, 11, ol('#E2452F', 4));
  if (drip > 0) o += S.path(`M-30 -40 q4 ${f(30 * drip)} 8 0 M12 -30 q5 ${f(44 * drip)} 10 0`, ln(10, '#FFD84A'));
  return S.g(o, tf(x, y, s, rot));
}
// floating "HA" letters around (x, y); k fades, t drives
function haLetters(x, y, t, k = 1, n = 6, seed = 1, spread = 900, size = 70) {
  if (k <= 0) return '';
  let o = '';
  const cols = ['#FFD23F', '#FF6FB5', '#34C3FF', '#3DDC84', '#FF8A2A'];
  for (let i = 0; i < n; i++) {
    const ph = (t * 0.9 + hash(i * 3.3 + seed)) % 1;
    const px = x + (hash(i * 7.1 + seed) - 0.5) * spread + Math.sin(t * 3 + i) * 20, py = y - ph * 260 + (hash(i * 1.9) - 0.5) * 120;
    const sc = (0.7 + 0.5 * hash(i * 5.3)) * (0.6 + 0.4 * Math.min(1, ph * 5));
    o += S.g(TS(i % 3 === 0 ? 'HA!' : 'HA', 0, 0, size, cols[i % cols.length]), tf(px, py, sc, (hash(i) - 0.5) * 30), { opacity: f(k * (1 - ph * ph)) });
  }
  return o;
}
// rotating gold rays behind a hero (cheap triangles), k 0..1
function goldRays(x, y, k, t, r = 1300, n = 16) {
  if (k <= 0) return '';
  return S.g(K.rays(0, 0, n, r, '#FFE27A', f(0.32 * k), t * 14) + S.circle(0, 0, 260, { fill: '#FFF4C0', opacity: f(0.25 * k) }) + S.circle(0, 0, 160, { fill: '#FFFFFF', opacity: f(0.22 * k) }), tf(x, y));
}
// "8:00 AM" clock stamp (screen space), k pop-in
function clockStamp(x, y, k, t, text = '8:00 AM', sub = 'TIME RESET') {
  if (k <= 0.001) return '';
  const sc = ease.outBack(clamp(k, 0, 1));
  let o = S.rect(-250, -78, 500, 156, 44, { fill: '#10161F', opacity: 0.9, stroke: LINE, 'stroke-width': 7 }) + S.rect(-240, -68, 480, 136, 36, { fill: 'none', stroke: '#3DDC84', 'stroke-width': 4 });
  // clock face with a spinning-back hand
  o += S.circle(-170, 0, 48, ol('#FFFFFF', 6));
  const a = -t * 900 * (1 - seg(k, 0.6, 1)) - 90;
  o += S.path(`M-170 0 L${f(-170 + 32 * Math.cos(a * Math.PI / 180))} ${f(32 * Math.sin(a * Math.PI / 180))}`, ln(8, LINE)) + S.path('M-170 0 L-170 -24', ln(6, '#E8243C'));
  o += S.path('M-232 -30 a60 60 0 0 0 -4 54', ln(6, '#3DDC84')) + S.path('M-244 20 l8 10 l10 -8', ln(6, '#3DDC84'));
  o += T(text, 50, 26, 76, '#FFFFFF', { 'letter-spacing': 2 }) + TF(sub, 50, 58, 22, '#3DDC84', { 'letter-spacing': 4 });
  return S.g(o, tf(x, y, sc, -3));
}
// the custom quiz sheet (close-up insert): 20 questions, scan 0..1 highlights rows, answered 0..1 fills answers
const QUIZ_Q = ['48 ÷ 6 =', '7 × 9 =', '13 + 29 =', '½ of 86 =', '15% of 40 =', '3² + 4² =', '√81 =', '0.5 × 18 =', '144 ÷ 12 =', '27 − 19 =',
  '6 × 7 =', '2³ =', '99 + 1 =', '25 × 4 =', '¾ of 20 =', '11 × 11 =', '64 ÷ 8 =', '5! =', '1000 − 1 =', 'π ≈'];
const QUIZ_A = ['8', '63', '42', '43', '6', '25', '9', '9', '12', '8', '42', '8', '100', '100', '15', '121', '8', '120', '999', '3.14'];
function quizSheet(x, y, s, rot, o = {}) {
  const scan = o.scan ?? -1, ans = o.answered ?? 0, grade = o.grade || 0;
  let g = S.rect(-560, -720, 1120, 1440, 18, ol('#FFFFFF', 9)) + S.path('M-560 -600 H560', ln(4, '#FF8A9A', 0.7)) + S.path('M-470 -720 V720', ln(4, '#FF8A9A', 0.5));
  g += T('POP QUIZ', -60, -630, 92, '#2A3A6A') + TF('20 QUESTIONS · NO TALKING', -60, -585, 30, '#7A88A8', { 'letter-spacing': 3 });
  g += TF('Name:', 250, -650, 30, '#7A88A8', { 'text-anchor': 'start' }) + S.path('M340 -650 H520', ln(4, '#9AA6C0'));
  if (o.name) g += TF(o.name, 350, -656, 34, '#3A5AC8', { 'text-anchor': 'start' });
  for (let i = 0; i < 20; i++) {
    const col = i < 10 ? 0 : 1, row = i % 10;
    const qx = -440 + col * 520, qy = -500 + row * 118;
    if (scan >= 0) {
      const hk = 1 - Math.min(1, Math.abs(scan * 20 - i - 0.5) / 1.2);
      if (hk > 0) g += S.rect(qx - 20, qy - 52, 480, 76, 14, { fill: '#FFE96A', opacity: f(0.85 * hk) });
      if (scan * 20 > i + 0.8) g += S.path(`M${qx + 410} ${qy - 24} l12 14 l24 -28`, ln(7, '#3DDC84'));
    }
    g += TF(`${i + 1}.`, qx, qy, 38, '#2A3A6A', { 'text-anchor': 'start' }) + TF(QUIZ_Q[i], qx + 62, qy, 40, '#2A3140', { 'text-anchor': 'start' });
    g += S.path(`M${qx + 290} ${qy + 6} H${qx + 400}`, ln(4, '#9AA6C0'));
    const ak = clamp(ans * 20 - i, 0, 1);
    if (ak > 0) g += S.g(TF(QUIZ_A[i], 0, 0, 46, '#3A5AC8', { 'text-anchor': 'start', 'font-style': 'italic' }), tf(qx + 296, qy - 2, 0.6 + 0.4 * ak, -4), { opacity: f(ak) });
  }
  if (grade > 0) g += stamp(300, 470, grade, '100%');
  return S.g(g, tf(x, y, s, rot));
}
// red rubber stamp that slams in (k 0..1)
function stamp(x, y, k, text = '100%') {
  if (k <= 0) return '';
  const e = k < 0.3 ? lerp(2.6, 1, ease.in(k / 0.3)) : 1 + 0.06 * Math.exp(-(k - 0.3) * 10) * Math.sin((k - 0.3) * 40);
  let o = S.circle(0, 0, 190, { fill: 'none', stroke: '#E8243C', 'stroke-width': 18 }) + S.circle(0, 0, 160, { fill: 'none', stroke: '#E8243C', 'stroke-width': 6 });
  o += T(text, 0, 44, 128, '#E8243C', { transform: 'rotate(-12)' });
  for (let i = 0; i < 5; i++) o += K.F.sparkle(Math.cos(i * 1.3) * 240, Math.sin(i * 1.3) * 200, 26 * clamp((k - 0.3) * 4, 0, 1) * (1 - seg(k, 0.6, 1)));
  return S.g(o, tf(x, y, e, -10), { opacity: f(k < 0.3 ? k / 0.3 : 1) });
}
// a tiny cricket (dead silence gag) at (x, y), t chirps
function cricket(x, y, s, t) {
  const ch = Math.floor(t * 6) % 3 === 0;
  let o = S.ellipse(0, 0, 34, 16, ol('#3E8A3A', 4)) + S.circle(-36, -6, 12, ol('#4FA048', 4)) + S.circle(-40, -10, 4, { fill: LINE });
  o += S.path('M-44 -14 Q-80 -60 -40 -80 M-40 -16 Q-60 -70 -20 -84', ln(3, LINE)) + S.path('M10 6 L30 30 L44 26 M-10 8 L-20 32', ln(4, LINE));
  if (ch) o += TS('chirp', 20, -50, 30, '#FFFFFF', { 'font-style': 'italic' });
  return S.g(o, tf(x, y, s));
}
// ellipsis thought "..." over a head
function dots(x, y, k, s = 1) {
  if (k <= 0) return '';
  let o = '';
  for (let i = 0; i < 3; i++) { const kk = clamp(k * 3 - i, 0, 1); if (kk > 0) o += S.circle((i - 1) * 34, 0, 11 * ease.outBack(kk), ol('#FFFFFF', 4)); }
  return S.g(o, tf(x, y, s));
}
// little fail icons flying into the counter (end shot)
function failIcon(kind, x, y, s, rot = 0) {
  if (kind === 'board') return X.skateboard({ x, y, s: 0.3 * s, rot: rot - 20 });
  if (kind === 'quiz') return X.quizPaper({ x, y, s: 0.45 * s, rot, grade: '100%' });
  if (kind === 'ball') return X.dodgeball({ x, y, s: 0.6 * s, rot });
  if (kind === 'pizza') return pizzaSlice(x, y + 40 * s, 0.5 * s, rot + 30);
  return R.cube(x, y, 50 * s, rot, ['#F28C28', '#D8262E', '#F2D04A', '#1F3B2A'][Math.floor(hash(x) * 4)], 5);
}

module.exports = {
  LINE, W, H, tf, TS, TFS, pop, toScr, shakeAll, clipTo, boing,
  whip, smash, zoomLines, streaks, letterbox,
  panel, panelTag, skateBg, gymBg,
  boardProp, BOARD_H, rideStance, sideHand,
  trajectory, quadPts, quadAt, ballTrail, pinchHand, milkJets, pizzaSlice, haLetters, goldRays, clockStamp, quizSheet, stamp, cricket, dots, failIcon,
};
