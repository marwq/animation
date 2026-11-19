// Private helpers for SC 03 (Checkpoint 1000) and SC 04 (the tutorial): camera keys, transitions, squash & stretch,
// the room compositor, the night exterior of the house, the hero's arms on the keyboard, thought bubbles, hops/arcs,
// the tutorial hologram panel, Tip's intro card, small FX (sparks, notes, snap, cracks).
'use strict';

const K = require('./kit');
const R = require('./respawn');
const H = require('./sets_home');
const { S, f, clamp, lerp, ease, seg, bump, hash, ol, ln, T, TF, view } = K;

const LINE = '#151515';
const W = 1920, HH = 1080;
const tf = (x, y, s = 1, r = 0) => `translate(${f(x)} ${f(y)})${r ? ` rotate(${f(r)})` : ''}${s !== 1 ? ` scale(${f(s)})` : ''}`;
const stroke = (size) => ({ stroke: LINE, 'stroke-width': size * 0.14, 'paint-order': 'stroke', 'stroke-linejoin': 'round' });
const TS = (txt, x, y, size, fill, extra = {}) => T(txt, x, y, size, fill, { ...stroke(size), ...extra });
const TFS = (txt, x, y, size, fill, extra = {}) => TF(txt, x, y, size, fill, { ...stroke(size), ...extra });
const pop = (t, t0, d = 0.28) => ease.outBack(seg(t, t0, t0 + d));
const inOut = (t, a, b, c, d) => seg(t, a, b) * (1 - seg(t, c, d));     // 0 -> 1 (a..b), hold, 1 -> 0 (c..d)
// camera key that puts world (wx, wy) at the screen centre (or at screen (sx, sy))
const at = (wx, wy, zoom = 1, sx = 960, sy = 540) => ({ zoom, x: wx - 960 - (sx - 960) / zoom, y: wy - 540 - (sy - 540) / zoom });
// world -> screen through a cam (parallax k)
function toS(cam, wx, wy, k = 1) {
  const z = 1 + ((cam.zoom ?? 1) - 1) * k;
  return [960 + (cam.sx || 0) + z * (wx - 960 - (cam.x || 0) * k), 540 + (cam.sy || 0) + z * (wy - 540 - (cam.y || 0) * k)];
}
function shakeAll(cam, t, list) {
  for (const [t0, d, a] of list) { const s = K.shake(t, t0, d, a); cam.sx = (cam.sx || 0) + s.sx; cam.sy = (cam.sy || 0) + s.sy; }
  return cam;
}
function clipRect(x, y, w, h, inner, r = 0) {
  const id = S.uid('s03c');
  return S.clipDef(id, S.rect(x, y, w, h, r)) + S.g(inner, null, { 'clip-path': `url(#${id})` });
}
function clipPoly(pts, inner) {
  const id = S.uid('s03p');
  return S.clipDef(id, S.path('M' + pts.map(([x, y]) => `${f(x)} ${f(y)}`).join(' L') + ' Z')) + S.g(inner, null, { 'clip-path': `url(#${id})` });
}

// ---------------------------------------------------------------- transitions / accents
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
  return S.rect(0, 0, W, HH, 0, { fill: '#FFFFFF', opacity: f(0.6 * k) }) + S.path(p, { fill: '#FFFFFF', opacity: f(0.85 * k) });
}
const smash = (t, tc, dur = 0.14, a = 0.8, col = '#FFFFFF') => (t >= tc && t < tc + dur ? R.flash(a * (1 - (t - tc) / dur), col) : '');
function zoomLines(cx, cy, k, col = '#FFFFFF', n = 22, seed = 1, r0b = 520) {
  if (k <= 0) return '';
  let d = '';
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + hash(i + seed) * 0.2;
    const r0 = r0b + hash(i * 3 + seed) * 260, r1 = r0 + 500 + hash(i * 7 + seed) * 400, wd = 10 + 14 * hash(i * 5 + seed);
    const ca = Math.cos(a), sa = Math.sin(a), nx = -sa * wd, ny = ca * wd;
    d += `M${f(cx + ca * r0)} ${f(cy + sa * r0)} L${f(cx + ca * r1 + nx)} ${f(cy + sa * r1 + ny)} L${f(cx + ca * r1 - nx)} ${f(cy + sa * r1 - ny)} Z `;
  }
  return S.path(d, { fill: col, opacity: f(0.8 * clamp(k, 0, 1)) });
}
// horizontal speed streaks across the frame (slow-mo / zip)
function streaks(t, k, col = '#FFFFFF', n = 14, seed = 3, dir = 1, speed = 2600) {
  if (k <= 0) return '';
  let p = '';
  for (let i = 0; i < n; i++) {
    const y = 60 + hash(i * 3.1 + seed) * 960, len = 200 + hash(i * 1.7 + seed) * 500, th = 4 + hash(i * 2.9 + seed) * 8;
    const x = ((hash(i * 5.3 + seed) * 2800 - dir * t * speed) % 2800 + 2800) % 2800 - 400;
    p += `M${f(x)} ${f(y)}h${f(len)}v${f(th)}h${f(-len)}Z`;
  }
  return S.path(p, { fill: col, opacity: f(0.5 * clamp(k, 0, 1)) });
}
const bangAt = (t, txt, x, y, t0, d = 0.6, size = 120, rot = -6, col = '#FFD21F') =>
  (t >= t0 && t < t0 + d ? K.bang(txt, x, y, seg(t, t0, t0 + 0.12) * (1 - seg(t, t0 + d - 0.15, t0 + d)), size, rot, col) : '');
// heartbeat vignette pulse (tension)
function pulseVignette(t, k, col = '#05070F') {
  if (k <= 0) return '';
  const b = Math.pow(Math.max(0, Math.sin(t * 7.5)), 6);
  const op = clamp(k, 0, 1) * (0.13 + 0.07 * b);
  let o = '';
  for (let i = 0; i < 4; i++) {
    const rx = 1080 + i * 140 - 40 * b, ry = 640 + i * 90 - 26 * b;
    o += S.path(`M-50 -50 H1970 V1130 H-50 Z M${f(960 - rx)} 540 a${f(rx)} ${f(ry)} 0 1 0 ${f(2 * rx)} 0 a${f(rx)} ${f(ry)} 0 1 0 ${f(-2 * rx)} 0 Z`, { fill: col, 'fill-rule': 'evenodd', opacity: f(op) });
  }
  return o;
}

// ---------------------------------------------------------------- squash & stretch
function squash(t, t0, amp = 0.28, dur = 0.7, freq = 22) {
  const k = t - t0;
  if (k < 0 || k > dur) return { sx: 1, sy: 1 };
  const v = -amp * Math.exp(-k * 5.5) * Math.cos(k * freq);
  return { sx: 1 - v * 0.7, sy: 1 + v };
}
const blinkK = (t, seed = 0, per = 3.4) => { const b = (t + seed * 0.37) % per; return b < 0.12 ? Math.sin((b / 0.12) * Math.PI) : 0; };
const fc = (name, t, seed = 0, extra = {}) => ({ name, blink: blinkK(t, seed), ...extra });

// hops: keys [[t, x, y, h?], ...] — parabolic arcs between keys (h = arc height of the hop arriving at that key)
// returns { x, y, i (segment), u, land (seconds since the last landing), air (bool), vx }
function hops(t, keys) {
  if (t <= keys[0][0]) return { x: keys[0][1], y: keys[0][2], i: -1, u: 0, land: 99, air: false, vx: 0 };
  for (let i = 0; i < keys.length - 1; i++) {
    const [t0, x0, y0] = keys[i], [t1, x1, y1, h = 0] = keys[i + 1];
    if (t <= t1) {
      const u = seg(t, t0, t1);
      return { x: lerp(x0, x1, u), y: lerp(y0, y1, u) - 4 * h * u * (1 - u), i, u, land: i > 0 ? t - t0 : 99, air: h > 0, vx: (x1 - x0) / Math.max(0.01, t1 - t0) };
    }
  }
  const l = keys[keys.length - 1];
  return { x: l[1], y: l[2], i: keys.length - 1, u: 1, land: t - l[0], air: false, vx: 0 };
}

// ---------------------------------------------------------------- room compositor
// a room set seen through cam: bg (parallax), mid, `behind` (inside/behind furniture), front, chars, fg, light, over
function room(setFn, t, opts, cam, parts = {}) {
  const Ly = setFn.layers(t, opts);
  return view(cam, Ly.bg, parts.bgK ?? 0.85) + view(cam, Ly.mid + (parts.behind || '') + Ly.front + (parts.chars || '') + (parts.lit || ''), 1) +
    (Ly.fg ? view(cam, Ly.fg, parts.fgK ?? 1.15) : '') + (Ly.light ? view(cam, Ly.light, 1) : '') + (parts.over ? view(cam, parts.over, 1) : '');
}

// ---------------------------------------------------------------- the house at night in the storm (street set + night grade)
// cam = street camera; o: { flash 0..1, glow 0..1 (the hero's window), green 0..1, bolt k (R.lightning k), t }
function nightHouse(t, cam, o = {}) {
  const Ly = H.street.layers(t, cam, { time: 'sunset', birds: false, leaves: false });
  const fl = clamp(o.flash || 0, 0, 1);
  let out = Ly.bg + Ly.mid;
  // night: deep blue wash over everything, lighter while the lightning flashes
  out += S.rect(-20, -20, 1960, 1120, 0, { fill: '#0A1238', opacity: f(0.66 - 0.4 * fl) });
  out += S.rect(-20, -20, 1960, 700, 0, { fill: '#1B1050', opacity: f(0.25 * (1 - fl)) });
  // lit windows (the hero's gable window glows monitor-blue / green)
  const hw = H.toScreen(cam, H.SPOTS.street.house.heroWindow);
  const z = cam.zoom ?? 1;
  const gk = 0.8 + 0.2 * Math.sin(t * 9) * Math.sin(t * 3.1);
  const gc = o.green ? '#7CFFB2' : '#8FC8FF';
  out += S.rect(hw.x - 46 * z, hw.y - 48 * z, 92 * z, 96 * z, 6 * z, { fill: gc, opacity: f(0.85 * gk * (o.glow ?? 1)) });
  out += S.ellipse(hw.x, hw.y, 210 * z, 170 * z, { fill: `url(#${o.green ? 'shGlowGreen' : 'shGlowBlue'})`, opacity: f(0.9 * (o.glow ?? 1)) });
  // a warm downstairs night light
  const dw = H.toScreen(cam, { x: 1020, y: 470, k: 1 });
  out += S.rect(dw.x - 34 * z, dw.y - 34 * z, 68 * z, 68 * z, 4 * z, { fill: '#FFC76B', opacity: 0.35 });
  out += Ly.fg;
  // rain
  out += K.rain(t, 120, { col: '#9FB8FF', op: 0.45, speed: 2100, len: 60, angle: 14 });
  if (fl > 0) out += S.rect(0, 0, W, HH, 0, { fill: '#DDE8FF', opacity: f(0.35 * fl) });
  return out;
}

// ---------------------------------------------------------------- the hero's arms reaching to the keyboard (deskClose)
// two R6 block arms from the bottom edge to the hands; tap 0..1 per hand (typing), press = space-bar press on the right hand
function deskArms(t, o = {}) {
  const { typing = 1, lx = 760, ly = 905, rx = 1500, ry = 925, pressL = 0, s = 1, sleeve = '#D8262E', glow = null } = o;
  const arm = (hx, hy, side, tap) => {
    const by = 1160, bx = hx + side * 160;
    const ang = Math.atan2(hy - by, hx - bx), len = Math.hypot(hx - bx, hy - by);
    const deg = (ang * 180) / Math.PI;
    const w = 118 * s;
    let g = S.rect(0, -w / 2, len + 10, w, 16, ol(sleeve, 7));
    g += S.rect(len * 0.55, -w / 2, 18, w, 4, { fill: '#000', opacity: 0.14 });
    g += S.rect(len - 8, -w / 2 + 8, 36, w - 16, 8, ol('#F2D04A', 6));
    const hand = S.rect(len + 18, -w / 2 + 6, 96 * s, w - 12, 18, ol('#FFFFFF', 7)) + S.path(`M${f(len + 60)} ${f(-w / 2 + 16)} V${f(w / 2 - 16)}`, ln(4, '#C9CED8'));
    g += S.g(hand, `translate(${f(tap * 6)} 0)`);
    return S.g(g, `translate(${f(bx)} ${f(by)}) rotate(${f(deg)})`);
  };
  const tl = typing ? Math.max(0, Math.sin(t * 31)) * 14 * typing : 0;
  const tr_ = typing ? Math.max(0, Math.sin(t * 27 + 1.7)) * 12 * typing : 0;
  let out = arm(lx, ly + tl + 26 * pressL, -1, tl / 14) + arm(rx, ry + tr_, 1, tr_ / 12);
  if (glow) out += S.ellipse((lx + rx) / 2, 1000, 600, 120, { fill: glow, opacity: 0.12 });
  return out;
}

// ---------------------------------------------------------------- thought bubble (k pops it), inner drawn in a w x h box centred at (x, y)
function thought(x, y, w, h, k, inner, tail = [-1, 1]) {
  const kk = clamp(k, 0, 1);
  if (kk <= 0.01) return '';
  const sc = ease.outBack(kk);
  let b = '';
  const n = 12, rx = w / 2, ry = h / 2;
  let d = '';
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2, r = 0.16 * Math.min(w, h) * (1 + 0.25 * hash(i * 2.7));
    d += `M${f(Math.cos(a) * rx * 0.86 - r)} ${f(Math.sin(a) * ry * 0.86)}a${f(r)} ${f(r)} 0 1 0 ${f(2 * r)} 0a${f(r)} ${f(r)} 0 1 0 ${f(-2 * r)} 0Z`;
  }
  d += `M${f(-rx * 0.9)} 0a${f(rx * 0.9)} ${f(ry * 0.9)} 0 1 0 ${f(rx * 1.8)} 0a${f(rx * 0.9)} ${f(ry * 0.9)} 0 1 0 ${f(-rx * 1.8)} 0Z`;
  b += S.path(d, { fill: '#FFFFFF', stroke: LINE, 'stroke-width': 14 });
  b += S.path(d, { fill: '#FFFFFF' });
  const id = S.uid('s03th');
  b += S.clipDef(id, S.ellipse(0, 0, rx * 0.88, ry * 0.86)) + S.g(inner, null, { 'clip-path': `url(#${id})` });
  // trailing dots
  for (let i = 0; i < 3; i++) {
    const u = 0.62 + i * 0.22;
    b += S.circle(tail[0] * rx * u, ry * (0.82 + i * 0.32) * tail[1], 26 - i * 7, ol('#FFFFFF', 7));
  }
  return S.g(b, `translate(${f(x)} ${f(y)}) scale(${f(sc)})`);
}

// ---------------------------------------------------------------- electric sparks / arcs (lightning hit, the humming PC)
function sparks(x, y, r, t, k = 1, seed = 1, col = '#BFF6FF') {
  if (k <= 0) return '';
  const step = Math.floor(t * 20);
  let d = '';
  for (let i = 0; i < 4; i++) {
    if (hash(step * 1.3 + i * 7.1 + seed) > 0.7 * k + 0.2) continue;
    const a = hash(step * 2.7 + i * 3.3 + seed) * Math.PI * 2;
    let px = x + Math.cos(a) * r * 0.3, py = y + Math.sin(a) * r * 0.3;
    d += `M${f(px)} ${f(py)}`;
    for (let j = 1; j <= 4; j++) {
      const rr = r * (0.3 + 0.7 * (j / 4));
      px = x + Math.cos(a + (hash(step + i * 11 + j * 3.1 + seed) - 0.5) * 0.9) * rr;
      py = y + Math.sin(a + (hash(step + i * 13 + j * 5.7 + seed) - 0.5) * 0.9) * rr;
      d += ` L${f(px)} ${f(py)}`;
    }
  }
  if (!d) return '';
  return S.path(d, { fill: 'none', stroke: col, 'stroke-width': 12, 'stroke-linejoin': 'round', opacity: f(0.5 * k) }) + S.path(d, { fill: 'none', stroke: '#FFFFFF', 'stroke-width': 4, 'stroke-linejoin': 'round', opacity: f(k) });
}

// ---------------------------------------------------------------- the empty game chat box (SC03 "nobody laughed")
function chatBox(x, y, k, t, lines = [], o = {}) {
  const kk = clamp(k, 0, 1);
  if (kk <= 0.01) return '';
  const { w = 520, h = 300 } = o;
  let c = S.rect(0, 0, w, h, 22, { fill: '#0E1022', opacity: 0.82, stroke: '#FFFFFF', 'stroke-width': 4 });
  c += S.rect(0, 0, w, 56, 22, { fill: '#2A2D5A' }) + S.rect(0, 34, w, 22, 0, { fill: '#2A2D5A' });
  c += TF('CHAT', 24, 40, 30, '#FFFFFF', { 'text-anchor': 'start', 'letter-spacing': 3 }) + S.circle(w - 150, 29, 8, { fill: '#7E8596' }) + TF('0 online', w - 134, 39, 24, '#B9BFCB', { 'text-anchor': 'start' });
  lines.forEach((l, i) => { c += TF(l[0], 24, 104 + i * 44, 28, l[1] || '#B9BFCB', { 'text-anchor': 'start', 'font-style': 'italic' }); });
  // blinking caret in the input line
  c += S.rect(14, h - 64, w - 28, 48, 14, { fill: '#1C1F3A', stroke: '#4A5080', 'stroke-width': 3 });
  if (Math.floor(t * 2.5) % 2) c += S.rect(32, h - 52, 4, 26, 2, { fill: '#FFFFFF' });
  return S.g(c, `translate(${f(x)} ${f(y)}) scale(${f(ease.outBack(kk))})`);
}

// ---------------------------------------------------------------- tutorial hologram panel (Tip's diagrams in SC04)
// screen-space dashed yellow frame with a header; inner is drawn in the panel's local box (0,0)-(w,h)
function holoPanel(x, y, w, h, k, title, inner, t) {
  const kk = clamp(k, 0, 1);
  if (kk <= 0.01) return '';
  const sx = ease.outBack(seg(kk, 0, 0.6)), sy = ease.outBack(seg(kk, 0.15, 1));
  let c = S.rect(8, 14, w, h, 30, { fill: '#000', opacity: 0.22 });
  c += S.rect(0, 0, w, h, 30, { fill: '#FFF8D6', stroke: LINE, 'stroke-width': 8 });
  c += clipRect(0, 0, w, h, inner, 30);
  c += S.rect(10, 10, w - 20, h - 20, 22, { fill: 'none', stroke: '#F2A516', 'stroke-width': 5, 'stroke-dasharray': '22 14', 'stroke-dashoffset': f(-t * 60) });
  const tw = 40 + title.length * 22;
  c += S.rect(w / 2 - tw / 2, -30, tw, 60, 22, ol('#FF8A1F', 7)) + T(title, w / 2, 14, 40, '#FFFFFF', stroke(40));
  return S.g(c, `translate(${f(x - (w / 2) * sx)} ${f(y - (h / 2) * sy)}) scale(${f(sx)} ${f(sy)})`);
}

// tiny flat "diagram" hero (orange bowl cut, white face, red jacket, green legs) for the tutorial panels; side view facing right
function miniHero(x, y, s = 1, o = {}) {
  const { ph = 0, walk = 0, rot = 0, arm = 0, face = 'happy' } = o;
  const lg = Math.sin(ph) * 26 * walk;
  let g = '';
  g += S.rect(-16, -70, 20, 70, 6, { ...ol('#1F3B2A', 5), transform: `rotate(${f(lg)} -6 -70)` });
  g += S.rect(-4, -70, 20, 70, 6, { ...ol('#1F3B2A', 5), transform: `rotate(${f(-lg)} 6 -70)` });
  g += S.rect(-30, -150, 60, 84, 10, ol('#D8262E', 5)) + S.rect(-8, -150, 18, 84, 0, { fill: '#F2D04A' });
  g += S.rect(-8, -146, 18, 70, 6, { ...ol('#D8262E', 5), transform: `rotate(${f(-20 - arm + lg * 0.5)} 0 -140)` });
  g += S.rect(-34, -230, 72, 74, 14, ol('#FFFFFF', 5));
  g += S.path('M-40 -196 Q-44 -246 2 -248 Q46 -246 42 -200 L42 -186 L14 -186 L14 -206 L-20 -206 L-40 -186 Z', ol('#F28C28', 5));
  if (face === 'x') g += S.path('M10 -190 l14 14 m0 -14 l-14 14', ln(5));
  else g += S.circle(18, -184, 8, { fill: '#FFFFFF', stroke: LINE, 'stroke-width': 4 }) + S.circle(20, -184, 3.5, { fill: LINE });
  g += S.path(face === 'sad' || face === 'x' ? 'M8 -166 Q18 -172 28 -166' : 'M8 -170 Q18 -160 28 -170', ln(4));
  return S.g(g, `translate(${f(x)} ${f(y)}) rotate(${f(rot)}) scale(${f(s)})`);
}

// ---------------------------------------------------------------- Tip's "character intro" card
function introCard(t, t0, tSub, tip, o = {}) {
  const u = t - t0;
  let c = S.rect(-20, -20, 1960, 1120, 0, { fill: '#2A1660' });
  c += S.g(K.rays(0, 0, 16, 1900, '#FFD43B', 0.14, t * 18), 'translate(620 560)');
  // diagonal stripe band
  const bx = lerp(2400, 0, ease.out(seg(u, 0, 0.3)));
  c += S.path(`M${f(1000 + bx)} -40 L${f(2000 + bx)} -40 L${f(1700 + bx)} 1120 L${f(700 + bx)} 1120 Z`, { fill: '#FF8A1F', stroke: LINE, 'stroke-width': 10 });
  c += S.path(`M${f(1080 + bx)} -40 L${f(1130 + bx)} -40 L${f(830 + bx)} 1120 L${f(780 + bx)} 1120 Z`, { fill: '#FFD43B' });
  c += S.g(K.rays(0, 0, 10, 520, '#FFFFFF', 0.25, -t * 40), 'translate(620 560)');
  c += tip;
  // name
  const nk = pop(t, t0 + 0.12, 0.35);
  if (nk > 0.01) c += S.g(T('TIP', 8, 14, 330, '#8A3A00') + T('TIP', 0, 0, 330, '#FFFFFF', stroke(330)), `translate(${f(1380)} ${f(520)}) rotate(-6) scale(${f(nk)})`);
  const sk = pop(t, tSub, 0.3);
  if (sk > 0.01) {
    c += S.g(S.rect(-300, -54, 600, 108, 54, ol('#3DDC84', 9)) + T('YOUR TUTORIAL!', 0, 26, 64, '#FFFFFF', stroke(64)), `translate(1390 690) rotate(-6) scale(${f(sk)})`);
  }
  const stk = pop(t, t0 + 0.4, 0.3);
  if (stk > 0.01) {
    let st = S.rect(-300, -40, 600, 80, 24, { fill: '#140A33', opacity: 0.78 });
    st += TF('CLASS: POP-UP', -276, 14, 32, '#FFE14D', { 'text-anchor': 'start' });
    let sd = '';
    for (let i = 0; i < 5; i++) if (u > 0.55 + i * 0.07) sd += R.star5(50 + i * 48, 0, 20);
    if (sd) st += S.path(sd, ol('#FFD43B', 4));
    c += S.g(st, `translate(1390 230) rotate(-6) scale(${f(stk)})`);
  }
  return c;
}

// ---------------------------------------------------------------- music notes for the opera (bigger, wobbly)
function operaNotes(t, x, y, k = 1, seed = 1) {
  if (k <= 0) return '';
  let o = '';
  for (let i = 0; i < 5; i++) {
    const ph = (t * 0.9 + i / 5 + seed * 0.13) % 1;
    const nx = x + Math.sin((ph * 2 + i) * 5) * 60 + (i - 2) * 90 * ph, ny = y - ph * 420;
    const col = ['#FFE14D', '#FF6FB5', '#34C3FF', '#9CE07A', '#FF8A1F'][i];
    const g = S.ellipse(0, 0, 26, 19, { fill: col, stroke: LINE, 'stroke-width': 7, transform: 'rotate(-20)' }) +
      S.path(i % 2 ? 'M22 -6 L22 -88 L56 -72' : 'M22 -6 L22 -88 M22 -88 L70 -96 L70 -14', { fill: 'none', stroke: LINE, 'stroke-width': 9, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }) +
      (i % 2 ? '' : S.ellipse(48, -8, 22, 16, { fill: col, stroke: LINE, 'stroke-width': 7, transform: 'rotate(-20 48 -8)' }));
    o += S.g(g, `translate(${f(nx)} ${f(ny)}) rotate(${f(Math.sin(t * 6 + i) * 14)}) scale(${f((1 - ph * 0.3) * k)})`, { opacity: f(Math.min(1, (1 - ph) * 3) * Math.min(1, ph * 8)) });
  }
  return o;
}
// window glass crack (the high note)
function glassCrack(x, y, r, k, seed = 1) {
  if (k <= 0) return '';
  let d = '';
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + hash(i + seed) * 0.5;
    let px = x, py = y;
    d += `M${f(px)} ${f(py)}`;
    const L = r * (0.5 + 0.5 * hash(i * 3 + seed)) * ease.out(clamp(k, 0, 1));
    for (let j = 1; j <= 3; j++) {
      px = x + Math.cos(a + (hash(i * 7 + j) - 0.5) * 0.5) * L * (j / 3);
      py = y + Math.sin(a + (hash(i * 5 + j) - 0.5) * 0.5) * L * (j / 3);
      d += ` L${f(px)} ${f(py)}`;
    }
  }
  const rr = r * 0.32 * ease.out(clamp(k, 0, 1));
  d += `M${f(x - rr)} ${f(y)} L${f(x)} ${f(y - rr * 0.8)} L${f(x + rr)} ${f(y + rr * 0.2)} L${f(x + rr * 0.2)} ${f(y + rr)} Z`;
  return S.path(d, { fill: 'none', stroke: '#FFFFFF', 'stroke-width': 6, 'stroke-linejoin': 'round' }) + S.path(d, { fill: 'none', stroke: '#6A8AA8', 'stroke-width': 2.5, 'stroke-linejoin': 'round' });
}
// finger-snap spark (k 0..1 over ~0.35 s)
function snapFx(x, y, k, s = 1) {
  if (k <= 0 || k >= 1) return '';
  const e = ease.out(k);
  let d = '';
  for (let i = 0; i < 6; i++) {
    const a = -Math.PI / 2 + (i - 2.5) * 0.45, r0 = (30 + 40 * e) * s, r1 = r0 + 50 * (1 - k) * s;
    d += `M${f(x + Math.cos(a) * r0)} ${f(y + Math.sin(a) * r0)} L${f(x + Math.cos(a) * r1)} ${f(y + Math.sin(a) * r1)}`;
  }
  return S.path(d, ln(10 * s * (1 - k) + 2, '#FFFFFF')) + S.path(d, ln(4 * s, '#FFE14D', 1 - k)) + S.circle(x, y, (20 + 60 * e) * s, { fill: 'none', stroke: '#FFFFFF', 'stroke-width': f(8 * (1 - k) * s), opacity: f(1 - k) });
}
// a hand-drawn glowing marker line (Tip drawing in the air): pts, k = how much is drawn
function airLine(pts, k, col = '#FFE14D', w = 10, dash = null) {
  if (k <= 0 || pts.length < 2) return '';
  const lens = [];
  let tot = 0;
  for (let i = 1; i < pts.length; i++) { const l = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); lens.push(l); tot += l; }
  let rem = tot * clamp(k, 0, 1), d = `M${f(pts[0][0])} ${f(pts[0][1])}`, end = pts[0];
  for (let i = 1; i < pts.length && rem > 0; i++) {
    const u = Math.min(1, rem / lens[i - 1]);
    end = [lerp(pts[i - 1][0], pts[i][0], u), lerp(pts[i - 1][1], pts[i][1], u)];
    d += ` L${f(end[0])} ${f(end[1])}`;
    rem -= lens[i - 1];
  }
  const extra = dash ? { 'stroke-dasharray': dash } : {};
  return S.path(d, { ...ln(w + 10, col, 0.3), ...extra }) + S.path(d, { ...ln(w, col), ...extra }) + S.path(d, { ...ln(w * 0.35, '#FFFFFF'), ...extra }) + (k < 1 ? S.circle(end[0], end[1], w * 0.9, { fill: '#FFFFFF' }) : '');
}
// a bouncing pointer arrow (screen space), pointing down at (x, y)
function pointer(x, y, k, t, col = '#FFD43B', s = 1) {
  if (k <= 0.01) return '';
  const b = Math.abs(Math.sin(t * 7)) * 26;
  const g = S.path('M-34 -150 H34 V-74 H70 L0 0 L-70 -74 H-34 Z', ol(col, 8));
  return S.g(g, `translate(${f(x)} ${f(y - b * s)}) scale(${f(s * ease.outBack(clamp(k, 0, 1)))})`);
}
// a rubber stamp word (slams in)
function stamp(txt, x, y, k, size = 90, rot = -12, col = '#FF3B4E') {
  if (k <= 0.01) return '';
  const sc = k < 0.35 ? lerp(2.4, 1, ease.in(k / 0.35)) : 1 + 0.04 * Math.sin((k - 0.35) * 30) * Math.exp(-(k - 0.35) * 8);
  const w = txt.length * size * 0.62 + 60;
  const g = S.rect(-w / 2, -size * 0.75, w, size * 1.3, 18, { fill: 'none', stroke: col, 'stroke-width': 10 }) + T(txt, 0, size * 0.36, size, col);
  return S.g(g, `translate(${f(x)} ${f(y)}) rotate(${f(rot)}) scale(${f(sc)})`, { opacity: f(Math.min(1, k * 4) * 0.95) });
}

module.exports = {
  LINE, tf, TS, TFS, stroke, pop, inOut, at, toS, shakeAll, clipRect, clipPoly,
  whip, smash, zoomLines, streaks, bangAt, pulseVignette,
  squash, blinkK, fc, hops,
  room, nightHouse, deskArms, thought, sparks, chatBox, holoPanel, miniHero, introCard, operaNotes, glassCrack, snapFx, airLine, pointer, stamp,
};
