// Private helpers for SC 04 («ПОСЛЕДНИЙ ДЕНЬ») and SC 05 («ГЛЮК»): transitions, the "last day list" cards + check
// stamps, a blocky in-game crowd, simple rooms, and the montage props (piggy bank, pet shop, server browser, obby
// line, Terms of Service scroll, fishing game + Golden Fish, Dex's search maps, pixel grass).
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
const pick = (i, arr, k = 0) => arr[Math.floor(hash(i * 7.31 + k * 3.17) * arr.length) % arr.length];
// camera key that centres the world point (wx, wy) at the given zoom
const at = (wx, wy, zoom = 1) => ({ zoom, x: wx - 960, y: wy - 540 });
function shakeAll(cam, t, list) {
  for (const [t0, d, a] of list) { const s = K.shake(t, t0, d, a); cam.sx = (cam.sx || 0) + s.sx; cam.sy = (cam.sy || 0) + s.sy; }
  return cam;
}
// clip any svg to a screen-space rect
function clipTo(x, y, w, h, inner, r = 0) {
  const id = S.uid('s04c');
  return S.clipDef(id, S.rect(x, y, w, h, r)) + S.g(inner, null, { 'clip-path': `url(#${id})` });
}

// ---------------------------------------------------------------- transitions
// whip-pan: white flash + horizontal streaks around the cut time tc
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
// smash-cut flash (bright frame that decays)
const smash = (t, tc, dur = 0.14, a = 0.8) => (t >= tc && t < tc + dur ? K.C.whiteFlash(a * (1 - (t - tc) / dur)) : '');
// freeze-frame helper: holds t at each word start for `hold` s (the "lag stutter" on the Lag's syllables)
function freezeAt(t, list, hold = 0.35) {
  for (const t0 of list) if (t >= t0 && t < t0 + hold) return t0;
  return t;
}

// ---------------------------------------------------------------- the "last day list"
const PAPER = '#FFFDF4';
// green checkmark drawn on (k 0..1) with a little stamp pop. (x, y) = the box centre, size = box size
function check(x, y, size, k, col = '#2EB85C') {
  if (k <= 0) return '';
  const L1 = size * 2.2;
  const sc = 1 + 0.5 * (1 - ease.out(clamp(k * 1.6, 0, 1)));
  const d = `M${f(-size * 0.42)} ${f(-size * 0.02)} L${f(-size * 0.08)} ${f(size * 0.34)} L${f(size * 0.62)} ${f(-size * 0.62)}`;
  const st = (w, c) => ({ fill: 'none', stroke: c, 'stroke-width': w, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-dasharray': `${f(L1)} ${f(L1)}`, 'stroke-dashoffset': f(L1 * (1 - clamp(k * 1.4, 0, 1))) });
  return S.g(S.path(d, st(size * 0.34, LINE)) + S.path(d, st(size * 0.2, col)), tf(x, y, sc));
}
// red X (failed item)
function cross(x, y, size, k, col = '#E8243C') {
  if (k <= 0) return '';
  const u1 = clamp(k * 2, 0, 1), u2 = clamp(k * 2 - 1, 0, 1), r = size * 0.55;
  let o = '';
  const seg1 = (u, sx) => (u > 0 ? S.path(`M${f(-r * sx)} ${f(-r)} L${f(lerp(-r * sx, r * sx, u))} ${f(lerp(-r, r, u))}`, ln(size * 0.32, LINE)) + S.path(`M${f(-r * sx)} ${f(-r)} L${f(lerp(-r * sx, r * sx, u))} ${f(lerp(-r, r, u))}`, ln(size * 0.2, col)) : '');
  o += seg1(u1, 1) + seg1(u2, -1);
  return S.g(o, tf(x, y, 1 + 0.4 * (1 - ease.out(clamp(k * 1.5, 0, 1)))));
}
// rubber-stamp label (e.g. "DONE!"); k 0..1 = stamp-down progress
function stamp(txt, x, y, k, s = 1, rot = -12, col = '#2EB85C') {
  if (k <= 0) return '';
  const u = clamp(k, 0, 1), sc = s * (1 + 1.2 * (1 - ease.out(u)));
  const w = 70 + txt.length * 44;
  let o = S.rect(-w / 2, -58, w, 116, 18, { fill: 'none', stroke: col, 'stroke-width': 12 }) + S.rect(-w / 2 + 14, -44, w - 28, 88, 10, { fill: 'none', stroke: col, 'stroke-width': 4 });
  o += T(txt, 0, 26, 78, col);
  return S.g(o, tf(x, y, sc, rot), { opacity: f(clamp(u * 3, 0, 1) * 0.92) });
}
// the list page. (x, y) = centre. items: [{ txt, k (check 0..1), x (cross 0..1), doodle }]. opts: who, title, w, rot
function listCard(x, y, s, items, opts = {}) {
  const { title = 'LAST DAY LIST', who = '', w = 560, rot = 0, col = PAPER, inkCol = '#2A2246', size = 40 } = opts;
  const rowH = size * 2.05, top = 150;
  const h = top + items.length * rowH + 30;
  let o = S.rect(-w / 2 + 12, -h / 2 + 16, w, h, 16, { fill: '#000', opacity: 0.22 });
  o += S.rect(-w / 2, -h / 2, w, h, 14, ol(col, 6));
  let d = '';
  for (let i = 0; i <= items.length; i++) d += `M${f(-w / 2 + 18)} ${f(-h / 2 + top - 14 + i * rowH)} L${f(w / 2 - 18)} ${f(-h / 2 + top - 14 + i * rowH)} `;
  o += S.path(d, ln(3, '#A9CDF2')) + S.path(`M${f(-w / 2 + 64)} ${f(-h / 2 + 8)} L${f(-w / 2 + 64)} ${f(h / 2 - 8)}`, ln(3, '#FF9A9A'));
  // tape on top
  o += S.rect(-70, -h / 2 - 22, 140, 44, 4, { fill: '#E9EEF5', opacity: 0.85, stroke: '#B9C2CF', 'stroke-width': 3, transform: 'rotate(-4)' });
  o += T(title, 24, -h / 2 + 76, Math.min(56, (w - 120) / title.length * 1.9), inkCol);
  if (who) o += TF(who, 24, -h / 2 + 116, 28, '#E8603C');
  items.forEach((it, i) => {
    const yy = -h / 2 + top + i * rowH + rowH * 0.5 - 14;
    const bx = -w / 2 + 104;
    o += S.rect(bx - size * 0.42, yy - size * 0.42, size * 0.84, size * 0.84, 6, ol('#FFFFFF', 4));
    o += S.el('text', { x: bx + size * 0.8, y: f(yy + size * 0.36), 'font-family': 'Fredoka, sans-serif', 'font-weight': 700, 'font-size': size, fill: inkCol, 'text-anchor': 'start' }, it.txt);
    if (it.k) o += check(bx + 4, yy - 4, size * 1.2, it.k);
    if (it.x) o += cross(bx, yy, size * 1.1, it.x);
    if (it.doodle) o += S.g(it.doodle, tf(w / 2 - 70, yy));
  });
  return S.g(o, tf(x, y, s, rot));
}
// slide-in transform helper for corner inserts: from off-screen (dx, dy) with overshoot
function slideIn(t, t0, svg, dx = 700, dy = 0, dur = 0.35) {
  const u = ease.outBack(seg(t, t0, t0 + dur));
  if (u <= 0) return '';
  return S.g(svg, `translate(${f(dx * (1 - u))} ${f(dy * (1 - u))})`);
}

// ---------------------------------------------------------------- blocky in-game avatars (crowds)
const SHIRTS = ['#FF5A5A', '#3FA9FF', '#FFD21F', '#3BD16F', '#B06BFF', '#FF8A3D', '#FF6FB5', '#2EC4B6', '#F4F6FA', '#22242C'];
const PANTS = ['#2E3A55', '#3A6A9A', '#22242C', '#5A6070', '#3F72C0', '#7A553A', '#3FBF5A'];
const SKINS = ['#FFD21F', '#F2C9A0', '#C98E62', '#8D5A3B', '#FFD21F', '#F8D9C0'];
const HATS = ['none', 'cap', 'none', 'crown', 'hair', 'horns', 'hair', 'none', 'cap'];
// (x, y) = feet. pose: 'stand' | 'wait' (tap foot) | 'jump' | 'sleep' | 'run' | 'cheer' | 'fall'. grey 0..1
function bloxy(x, y, s, i, t, o = {}) {
  const pose = o.pose || 'stand';
  const g = o.grey || 0, gc = (c) => (g ? SETS.desat(c, g) : c);
  const shirt = gc(o.shirt || pick(i, SHIRTS, 1)), pants = gc(pick(i, PANTS, 2)), skin = gc(o.skin || pick(i, SKINS, 3)), hat = o.hat || pick(i, HATS, 4);
  const ph = t * (pose === 'run' ? 14 : 6) + i * 1.7;
  let aL = 6, aR = -6, lL = 0, lR = 0, bob = 0, rot = 0;
  if (pose === 'wait') { aL = 8 + 4 * Math.sin(ph * 0.5); aR = -8; lR = -10 * Math.max(0, Math.sin(ph * 1.5)); bob = Math.abs(Math.sin(ph * 0.5)) * 2; }
  if (pose === 'run') { aL = 40 * Math.sin(ph); aR = -aL; lL = -30 * Math.sin(ph); lR = -lL; bob = Math.abs(Math.sin(ph)) * 8; }
  if (pose === 'jump') { aL = 150; aR = -150; lL = 18; lR = -18; }
  if (pose === 'cheer') { aL = 150 + 20 * Math.sin(ph * 2); aR = -150 - 20 * Math.sin(ph * 2 + 1); bob = Math.abs(Math.sin(ph * 2)) * 14; }
  if (pose === 'fall') { aL = 160 + Math.sin(ph) * 25; aR = -160 - Math.cos(ph) * 25; lL = 25 + Math.sin(ph * 1.3) * 15; lR = -25; rot = Math.sin(t * 3 + i) * 16; }
  if (pose === 'sleep') { rot = -8; }
  const limb = (px, py, a, w, h, c, foot) => S.g(S.rect(-w / 2, 0, w, h, 5, ol(c, 4)) + (foot ? S.rect(-w / 2, h - 10, w, 10, 3, ol(gc('#22242C'), 3)) : ''), `translate(${px} ${py}) rotate(${f(a)})`);
  let b = limb(-10, -40, lL, 19, 40, pants, true) + limb(10, -40, lR, 19, 40, pants, true);
  b += limb(-27, -80, aL, 17, 40, i % 3 ? shirt : skin) + limb(27, -80, aR, 17, 40, i % 3 ? shirt : skin);
  b += S.rect(-20, -82, 40, 44, 6, ol(shirt, 4));
  if (i % 4 === 1) b += S.rect(-12, -74, 24, 10, 3, { fill: gc('#FFFFFF'), opacity: 0.6 });
  let hd = S.rect(-19, -34, 38, 34, 8, ol(skin, 4));
  if (pose === 'sleep') hd += S.path('M-12 -18 L-4 -18 M4 -18 L12 -18', ln(3)) + S.ellipse(0, -8, 3, 3, { fill: LINE });
  else {
    const bl = (t * 0.7 + i * 0.37) % 3.3 < 0.1;
    hd += bl ? S.path('M-11 -18 L-5 -18 M5 -18 L11 -18', ln(3)) : S.circle(-8, -18, 3.2, { fill: LINE }) + S.circle(8, -18, 3.2, { fill: LINE });
    hd += o.mouth === 'O' || pose === 'fall' ? S.ellipse(0, -8, 4.5, 5.5, { fill: LINE }) : S.path(pose === 'cheer' ? 'M-8 -11 Q0 -1 8 -11 Z' : 'M-7 -9 Q0 -3 7 -9', pose === 'cheer' ? { fill: LINE } : ln(3));
  }
  if (hat === 'cap') hd += S.path('M-21 -26 Q-21 -46 0 -46 Q21 -46 21 -26 Z', ol(gc(pick(i, SHIRTS, 9)), 3.5)) + S.rect(-4, -30, 34, 7, 3, ol(gc(pick(i, SHIRTS, 9)), 3));
  else if (hat === 'crown') hd += S.path('M-16 -32 L-18 -50 L-8 -40 L0 -54 L8 -40 L18 -50 L16 -32 Z', ol(gc('#FFD21F'), 3.5));
  else if (hat === 'hair') hd += S.path('M-21 -24 Q-24 -46 0 -46 Q24 -46 21 -24 L14 -32 L6 -26 L-4 -32 L-12 -26 Z', ol(gc(pick(i, ['#3A2A1A', '#E0A23A', '#C2452D', '#1E1A1C', '#E870A8'], 10)), 3.5));
  else if (hat === 'horns') hd += S.path('M-16 -32 L-24 -52 L-6 -34 Z M16 -32 L24 -52 L6 -34 Z', ol(gc('#FF5A5A'), 3));
  b += S.g(hd, `translate(0 ${-82 - (pose === 'sleep' ? -4 : 0)})${pose === 'sleep' ? ' rotate(14)' : ''}`);
  let out = S.g(b, `translate(0 ${f(-bob)}) rotate(${f(rot)} 0 -60)`);
  if (o.shadow !== false) out = S.ellipse(0, 2, 28, 7, { fill: '#000', opacity: 0.18 }) + out;
  if (pose === 'sleep' && o.zzz !== false) out += K.F.markText('z', 26 + ((t * 30) % 20), -130 - ((t * 40) % 40), 26, -10, '#FFFFFF');
  return S.g(out, tf(x, y, s) + (o.flip ? ' scale(-1 1)' : ''));
}

// ---------------------------------------------------------------- simple rooms (montage sets)
// wall + floor + skirting + optional window; sky: 0 day .. 1 night (for time-lapse); returns world-space svg
function room(t, o = {}) {
  const { wall = '#BFD8F2', stripe = '#AFCBEA', floor = '#C98A52', floorY = 820, win = null, sky = 0 } = o;
  let s = S.rect(-800, -600, 3520, 2280, 0, { fill: wall });
  let st = '';
  for (let x = -800; x < 2720; x += 90) st += `M${x} -600h40v${floorY + 600}h-40Z`;
  s += S.path(st, { fill: stripe, opacity: 0.55 });
  if (win) {
    const [wx, wy, ww, wh] = win;
    const dayC = ['#9FD8FF', '#FFB36B', '#1B2350'], k = clamp(sky, 0, 1);
    const skyC = k < 0.5 ? SETS.mix(dayC[0], dayC[1], k * 2) : SETS.mix(dayC[1], dayC[2], k * 2 - 1);
    s += S.rect(wx, wy, ww, wh, 8, ol(skyC, 8));
    if (k > 0.6) for (let i = 0; i < 6; i++) s += K.F.sparkle(wx + 30 + hash(i * 3) * (ww - 60), wy + 30 + hash(i * 7) * (wh - 60), 7 * (k - 0.6) * 2.5);
    else s += S.circle(wx + ww * (0.25 + 0.5 * k), wy + wh * (0.3 + 0.4 * k), 34, { fill: k < 0.4 ? '#FFF2A8' : '#FFB13B', opacity: 0.9 });
    s += S.path(`M${wx + ww / 2} ${wy} L${wx + ww / 2} ${wy + wh} M${wx} ${wy + wh / 2} L${wx + ww} ${wy + wh / 2}`, ln(10, '#FFFDF4')) + S.rect(wx, wy, ww, wh, 8, { fill: 'none', stroke: LINE, 'stroke-width': 8 });
    s += S.rect(wx - 20, wy + wh, ww + 40, 22, 6, ol('#FFFDF4', 5));
  }
  s += S.rect(-800, floorY, 3520, 900, 0, { fill: floor });
  let fl = '';
  for (let i = 0; i < 6; i++) fl += `M-800 ${floorY + 30 + i * i * 14} L2720 ${floorY + 30 + i * i * 14} `;
  s += S.path(fl, ln(3, '#000', 0.12));
  s += S.rect(-800, floorY - 22, 3520, 26, 3, ol('#FFFDF4', 5));
  return s;
}
// wall clock: hours 0..12 (fractional spins the hands); (x, y) centre
function wallClock(x, y, r, hours, col = '#FFFFFF') {
  let o = S.circle(x, y, r, ol(col, 7)) + S.circle(x, y, r * 0.82, ln(3, '#D9C8A8'));
  for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; o += S.circle(x + Math.cos(a) * r * 0.7, y + Math.sin(a) * r * 0.7, r * 0.05, { fill: '#8A7A5A' }); }
  const ha = (hours / 12) * Math.PI * 2, ma = hours * Math.PI * 2;
  o += S.path(`M${x} ${y} L${f(x + Math.sin(ha) * r * 0.42)} ${f(y - Math.cos(ha) * r * 0.42)}`, ln(r * 0.12)) + S.path(`M${x} ${y} L${f(x + Math.sin(ma) * r * 0.64)} ${f(y - Math.cos(ma) * r * 0.64)}`, ln(r * 0.08)) + S.circle(x, y, r * 0.1, { fill: '#E8603C' });
  return o;
}

// ---------------------------------------------------------------- montage props
// piggy bank (x, y) = feet centre; broken 0..1 splits it in two halves flying apart
function piggy(x, y, s = 1, rot = 0, broken = 0) {
  const body = (side) => {
    let o = '';
    const clip = side < 0 ? 'M-200 -200 L4 -200 L-10 -120 L12 -70 L-6 -20 L10 40 L-200 40 Z' : 'M200 -200 L4 -200 L-10 -120 L12 -70 L-6 -20 L10 40 L200 40 Z';
    const id = S.uid('s04pig');
    let p = S.ellipse(0, -80, 120, 92, ol('#FF9EC4', 7)) + S.ellipse(-30, -120, 50, 22, { fill: '#FFC8DE', opacity: 0.8 });
    p += S.rect(-80, -14, 34, 26, 8, ol('#FF8AB4', 6)) + S.rect(50, -14, 34, 26, 8, ol('#FF8AB4', 6));
    p += S.ellipse(-122, -82, 26, 30, ol('#FF8AB4', 6)) + S.circle(-128, -88, 5, { fill: LINE }) + S.circle(-118, -74, 5, { fill: LINE });
    p += S.path('M-70 -160 L-90 -200 L-40 -172 Z M40 -170 L56 -206 L74 -166 Z', ol('#FF8AB4', 5)) + S.circle(-70, -104, 8, { fill: LINE });
    p += S.rect(-24, -176, 48, 10, 5, { fill: LINE }) + S.path('M118 -90 q30 -10 20 14 q-10 16 6 20', ln(6));
    o += S.clipDef(id, S.path(clip)) + S.g(p, null, { 'clip-path': `url(#${id})` });
    if (broken > 0) o += S.path('M4 -200 L-10 -120 L12 -70 L-6 -20 L10 40', ln(6));
    return o;
  };
  if (broken <= 0) return S.g(body(-1) + body(1), tf(x, y, s, rot));
  const u = ease.out(broken);
  return S.g(S.g(body(-1), `translate(${f(-140 * u)} ${f(-60 * u + 200 * u * u)}) rotate(${f(-50 * u)})`) + S.g(body(1), `translate(${f(140 * u)} ${f(-40 * u + 200 * u * u)}) rotate(${f(55 * u)})`), tf(x, y, s, rot));
}
// cute pet (gold dragon pup) for the pet shop; (x, y) centre
function petPup(x, y, s = 1, t = 0, love = 0) {
  const b = Math.sin(t * 6) * 4;
  let o = S.path('M-60 30 Q-110 0 -90 -40 Q-70 0 -40 10 Z M60 30 Q110 0 90 -40 Q70 0 40 10 Z', ol('#FFB13B', 5));
  o += S.ellipse(0, 40, 64, 52, ol('#FFD21F', 6)) + S.ellipse(0, 54, 36, 26, { fill: '#FFF1B0' });
  o += S.circle(0, -30, 56, ol('#FFD21F', 6)) + S.path('M-30 -76 L-40 -110 L-12 -82 Z M30 -76 L40 -110 L12 -82 Z', ol('#FFB13B', 5));
  o += love > 0.5 ? S.path(K.F.heartPath(-20, -34, 9), { fill: '#FF4D7A' }) + S.path(K.F.heartPath(20, -34, 9), { fill: '#FF4D7A' }) : S.circle(-20, -34, 9, { fill: LINE }) + S.circle(20, -34, 9, { fill: LINE }) + S.circle(-17, -37, 3, { fill: '#FFF' }) + S.circle(23, -37, 3, { fill: '#FFF' });
  o += S.path('M-10 -12 Q0 -2 10 -12', ln(5)) + S.ellipse(-36, -18, 9, 5, { fill: '#FF9EC4' }) + S.ellipse(36, -18, 9, 5, { fill: '#FF9EC4' });
  return S.g(o, tf(x, y + b, s));
}
// pet-shop phone screen content (w x h box centred at 0,0); bought 0..1
function petShop(w, h, t, bought) {
  let o = S.rect(-w / 2, -h / 2, w, h, 0, { fill: '#2A2246' }) + S.rect(-w / 2, -h / 2, w, 70, 0, { fill: '#B06BFF' }) + TF('PET SHOP', 0, -h / 2 + 48, 34, '#FFFFFF');
  o += S.circle(0, -60, 110, { fill: '#3A2E6A' }) + K.rays(0, -60, 12, 150, '#FFE88A', 0.15 + 0.15 * bought, t * 30);
  o += petPup(0, -60, 1.05, t, bought);
  o += TF('LEGENDARY', 0, 90, 30, '#FFD21F') + TF('DRAGON PUP', 0, 130, 36, '#FFFFFF');
  if (bought < 0.5) o += S.rect(-110, 170, 220, 74, 22, ol('#3BD16F', 5)) + K.robuxText(0, 222, '25,000', 34, '#FFFFFF');
  else o += S.g(S.rect(-130, 170, 260, 74, 22, ol('#FFD21F', 5)) + TF('ADOPTED!', 0, 220, 38, '#2A2246'), tf(0, 207, ease.outBack(clamp((bought - 0.5) * 3, 0, 1))) + ' translate(0 -207)');
  return o;
}
// Roblox-ish server browser, every server FULL. scroll px; click 0..1 pulses the hovered JOIN
function serverBrowser(t, scroll, click = 0) {
  let o = S.rect(-800, -600, 3520, 2280, 0, { fill: '#1B2033' });
  o += S.rect(160, 80, 1600, 960, 30, ol('#2A3148', 8)) + S.rect(160, 80, 1600, 110, 30, { fill: '#3A4466' }) + S.rect(160, 160, 1600, 30, 0, { fill: '#3A4466' });
  o += T('SERVERS', 300, 160, 64, '#FFFFFF', { 'text-anchor': 'start' }) + TF('every game, everywhere', 640, 152, 30, '#9AA6C0', { 'text-anchor': 'start' });
  let rows = '';
  for (let i = 0; i < 12; i++) {
    const y = 230 + i * 120 - (scroll % 120);
    const n = i + Math.floor(scroll / 120);
    const hot = i === 3;
    rows += S.rect(200, y, 1520, 100, 18, { fill: hot ? '#3A4466' : '#252B40', stroke: '#151515', 'stroke-width': 4 });
    rows += TF(`Server #${(n * 7919 + 101) % 99999}`, 250, y + 62, 36, '#FFFFFF', { 'text-anchor': 'start' });
    rows += S.rect(780, y + 34, 520, 32, 16, { fill: '#151A2A' }) + S.rect(780, y + 34, 520, 32, 16, { fill: '#FF3B4E' }) + TF('50 / 50', 1040, y + 60, 26, '#FFFFFF');
    rows += S.rect(1350, y + 18, 150, 64, 18, ol('#FF3B4E', 4)) + T('FULL', 1425, y + 64, 40, '#FFFFFF');
    const jp = hot ? 1 + 0.08 * click : 1;
    rows += S.g(S.rect(-75, -32, 150, 64, 18, ol(hot && click > 0 ? '#9AA6C0' : '#3BD16F', 4)) + T('JOIN', 0, 16, 40, '#FFFFFF'), tf(1610, y + 50, jp));
  }
  o += clipTo(180, 200, 1560, 820, rows);
  return o;
}
// mouse cursor (pointer hand)
function cursor(x, y, s = 1, press = 0) {
  const d = 'M0 0 L0 64 L16 50 L28 76 L40 70 L28 46 L50 46 Z';
  return S.g(S.path(d, ol('#FFFFFF', 5)), tf(x, y + press * 6, s * (1 - 0.1 * press)));
}
// the obby: floating coloured platforms over a sky, start arch at x0. Returns world svg (no camera)
function obbyWorld(t, o = {}) {
  let w = S.rect(-2600, -900, 7800, 3000, 0, { fill: 'url(#s04obbySky)' });
  for (const [cx, cy, s] of [[200, 180, 1.2], [1100, 120, 0.9], [2100, 220, 1.4], [3100, 140, 1], [-500, 260, 1.1]]) w += K.E.cloud(cx + ((t * 12) % 300), cy, s);
  // far obby tower
  const cols = ['#FF5A5A', '#FFD21F', '#3BD16F', '#3FA9FF', '#B06BFF'];
  for (let i = 0; i < 14; i++) w += S.rect(1400 + i * 120 + Math.sin(i) * 40, 640 - i * 36, 110, 26, 6, ol(cols[i % 5], 4));
  // ground
  w += S.rect(-2600, 820, 7800, 1300, 0, { fill: '#5FCB5E' }) + S.rect(-2600, 820, 7800, 18, 0, { fill: '#A2EC8E' }) + S.rect(-2600, 838, 7800, 4, 0, { fill: LINE, opacity: 0.4 });
  let chk = '';
  for (let x = -2600; x < 4600; x += 120) chk += `M${x} 880h60v60h-60Z M${x + 60} 940h60v60h-60Z `;
  w += S.path(chk, { fill: '#4FB84F', opacity: 0.6 });
  // start arch
  const ax = o.archX ?? 2300;
  w += S.rect(ax - 260, 380, 60, 460, 8, ol('#FF5A5A', 6)) + S.rect(ax + 200, 380, 60, 460, 8, ol('#FF5A5A', 6)) + S.rect(ax - 300, 300, 600, 120, 24, ol('#FFD21F', 7)) + T('OBBY START', ax, 384, 76, '#2A2246');
  w += S.rect(ax - 200, 760, 400, 70, 10, ol('#3FA9FF', 6)) + S.rect(ax - 170, 774, 340, 14, 6, { fill: '#9FE8FF', opacity: 0.6 });
  return w;
}
// rope-barrier queue lane (zigzag) — posts + ropes from x0 to x1 at y
function queueRope(x0, x1, y, post = 220) {
  let o = '', p = '';
  for (let x = x0; x <= x1; x += post) {
    o += S.rect(x - 9, y - 90, 18, 96, 6, ol('#E3B33C', 4)) + S.ellipse(x, y + 4, 26, 8, ol('#C9A262', 3)) + S.circle(x, y - 94, 12, ol('#FFD21F', 4));
    if (x + post <= x1) p += `M${x} ${y - 80} Q${x + post / 2} ${y - 40} ${x + post} ${y - 80} `;
  }
  return S.path(p, ln(14, LINE)) + S.path(p, ln(8, '#E8243C')) + o;
}
// sign on a post: (x, y) = post foot
function signPost(x, y, txt, s = 1, rot = 0, col = '#FFFDF4', tcol = '#2A2246', size = 46) {
  const w = Math.max(260, txt.length * size * 0.56 + 60);
  let o = S.rect(-10, -300, 20, 300, 6, ol('#A86B3C', 5)) + S.rect(-w / 2, -420, w, 120, 18, ol(col, 7)) + T(txt, 0, -344, size, tcol);
  return S.g(o, tf(x, y, s, rot));
}
// computer desk with a CRT-ish monitor + printer (TOS guy); (x, y) = desk top centre
function deskPC(x, y, s = 1, t = 0, screen = '') {
  let o = S.rect(-420, 0, 840, 34, 8, ol('#B87A44', 6)) + S.rect(-400, 34, 30, 260, 6, ol('#9A6238', 5)) + S.rect(370, 34, 30, 260, 6, ol('#9A6238', 5));
  o += S.rect(-180, -330, 360, 270, 22, ol('#3A3F4E', 7)) + S.rect(-160, -310, 320, 220, 10, { fill: '#DFF0FF' }) + S.rect(-40, -60, 80, 60, 6, ol('#3A3F4E', 5));
  o += screen ? clipTo(-160, -310, 320, 220, screen) : '';
  o += S.rect(-200, -24, 400, 24, 6, ol('#E3E6EE', 4));
  return S.g(o, tf(x, y, s));
}
// Terms of Service scroll: paper strip from (x, y0) up to y1 (y1 < y0), width w; with tiny text lines
function tosScroll(x, y0, y1, w, t, o = {}) {
  const hgt = y0 - y1;
  let s = S.rect(x - w / 2, y1, w, hgt, 0, { fill: '#FFFDF4', stroke: LINE, 'stroke-width': 6 });
  let d = '';
  const step = 26;
  const off = (o.scroll || 0) % step;
  for (let y = y1 + 20 - off + step; y < y0 - 10; y += step) {
    const n = Math.floor((y + (o.scroll || 0)) / step);
    d += `M${f(x - w / 2 + 24)} ${f(y)} L${f(x + w / 2 - 24 - (hash(n) * 80))} ${f(y)} `;
  }
  s += S.path(d, ln(6, '#B9B3A3'));
  // headings every ~600 px
  for (let y = y1 + 200 - ((o.scroll || 0) % 640); y < y0 - 60; y += 640) {
    const n = Math.floor((y + (o.scroll || 0)) / 640);
    s += S.rect(x - w / 2 + 20, y - 34, w - 40, 46, 4, { fill: '#FFFDF4' }) + TF(`SECTION ${(n % 900) + 2}.${(n * 7) % 30}`, x, y, 30, '#2A2246');
  }
  return s;
}
// fishing game screen ("BOBBER BAY"), content for a w x h screen centred on (0,0). fish: golden fish visible 0..1
function fishGame(w, h, t, o = {}) {
  const { fish = 0, wink = 0, lvl = 900, jump = 0 } = o;
  let s = S.rect(-w / 2, -h / 2, w, h * 0.42, 0, { fill: '#FFB36B' }) + S.circle(w * 0.28, -h * 0.18, h * 0.12, { fill: '#FFF2A8' });
  s += S.rect(-w / 2, -h * 0.08, w, h * 0.58, 0, { fill: '#2F8FBF' }) + S.rect(-w / 2, -h * 0.08, w, h * 0.04, 0, { fill: '#7FD6F0' });
  for (let i = 0; i < 4; i++) s += S.path(`M${f(-w / 2 + ((i * w * 0.31 + t * 40) % w))} ${f(h * (0.05 + i * 0.09))} q${f(w * 0.03)} ${f(-h * 0.02)} ${f(w * 0.06)} 0`, ln(Math.max(2, w * 0.006), '#9FE8FF'));
  // dock + rod line + bobber
  s += S.rect(-w / 2, -h * 0.12, w * 0.3, h * 0.07, 2, ol('#A86B3C', Math.max(2, w * 0.006)));
  const bob = Math.sin(t * 3) * h * 0.012;
  s += S.path(`M${f(-w * 0.3)} ${f(-h * 0.45)} Q${f(-w * 0.05)} ${f(-h * 0.2)} ${f(w * 0.05)} ${f(-h * 0.05 + bob)}`, ln(Math.max(1.5, w * 0.004), '#FFFFFF'));
  s += S.circle(w * 0.05, -h * 0.05 + bob, h * 0.025, ol('#FF3B4E', Math.max(2, w * 0.005)));
  if (fish > 0) {
    const jy = -h * 0.02 - Math.sin(clamp(jump, 0, 1) * Math.PI) * h * 0.3;
    s += goldFish(w * 0.12, h * 0.2 + jy, (h / 560) * fish, t, wink);
  }
  // HUD
  const fz = Math.max(12, h * 0.07);
  s += S.rect(-w / 2 + w * 0.02, -h / 2 + h * 0.03, w * 0.36, h * 0.12, h * 0.03, { fill: '#10203A', opacity: 0.75 }) + T('BOBBER BAY', -w / 2 + w * 0.2, -h / 2 + h * 0.03 + fz * 1.15, fz, '#FFD21F');
  s += S.rect(w / 2 - w * 0.3, -h / 2 + h * 0.03, w * 0.28, h * 0.12, h * 0.03, { fill: '#10203A', opacity: 0.75 }) + T(`LVL ${lvl}`, w / 2 - w * 0.16, -h / 2 + h * 0.03 + fz * 1.15, fz, '#7CFF6B');
  return s;
}
// the Golden Fish: (x, y) centre, s ≈ 1 → 240 px long. wink 0..1
function goldFish(x, y, s = 1, t = 0, wink = 0) {
  const sw = Math.sin(t * 8) * 8;
  let o = S.path(`M90 0 L${f(140)} ${f(-46 + sw)} L${f(130)} 0 L${f(140)} ${f(46 + sw)} Z`, ol('#FFB000', 6));
  o += S.path('M-120 0 Q-60 -80 60 -40 Q110 -20 100 0 Q110 20 60 40 Q-60 80 -120 0 Z', ol('#FFD21F', 7));
  o += S.path('M-60 -54 Q-20 -96 30 -46 Z', ol('#FFB000', 5)) + S.path('M-40 -20 Q-10 0 -40 20 M-10 -26 Q20 0 -10 26 M20 -24 Q48 0 20 24', ln(5, '#FFB000'));
  o += S.path('M-90 -20 Q-60 -50 -20 -46', ln(7, '#FFF4C4'));
  o += wink > 0.5 ? S.path('M-92 -12 Q-80 -2 -68 -12', ln(6)) : S.circle(-80, -10, 11, { fill: '#FFFFFF', stroke: LINE, 'stroke-width': 4 }) + S.circle(-78, -10, 5, { fill: LINE });
  o += S.path('M-118 8 Q-108 18 -96 12', ln(5)) + K.F.sparkle(-40, -70, 16 * (0.6 + 0.4 * Math.sin(t * 7))) + K.F.sparkle(70, 50, 12 * (0.6 + 0.4 * Math.sin(t * 6 + 1)));
  return S.g(o, tf(x, y, s));
}
// tycoon screen for Mr. Fig; money counter value
function tycoon(w, h, t, money, done = 0) {
  let o = S.rect(-w / 2, -h / 2, w, h, 0, { fill: '#7ED36A' }) + S.rect(-w / 2, h * 0.1, w, h * 0.4, 0, { fill: '#5FB85A' });
  const b = (x, y, bw, bh, c) => S.rect(x, y, bw, bh, 6, ol(c, 4));
  o += b(-w * 0.42, -h * 0.05, w * 0.16, h * 0.26, '#FFD34D') + b(-w * 0.22, -h * 0.22, w * 0.18, h * 0.43, '#FF7A59') + b(0, -h * 0.12, w * 0.14, h * 0.33, '#5BC0EB') + b(w * 0.18, -h * 0.3, w * 0.2, h * 0.51, '#B06BFF');
  // conveyor + droppers
  o += S.rect(-w * 0.45, h * 0.25, w * 0.9, h * 0.06, 4, ol('#3A3F4E', 3));
  for (let i = 0; i < 6; i++) { const x = -w * 0.45 + (((t * 120 + i * 90) % (w * 0.9))); o += K.coin(x, h * 0.24, h * 0.03, 0, t * 4 + i); }
  o += S.rect(-w * 0.3, -h * 0.47, w * 0.6, h * 0.14, h * 0.04, { fill: '#10203A', opacity: 0.8 }) + T('$ ' + Math.floor(money).toLocaleString('en-US'), 0, -h * 0.36, h * 0.1, done > 0 ? '#FFD21F' : '#7CFF6B');
  if (done > 0) o += S.g(S.rect(-w * 0.4, -h * 0.13, w * 0.8, h * 0.26, h * 0.06, ol('#FFD21F', 6)) + T('TYCOON', 0, -h * 0.02, h * 0.085, '#2A2246') + T('COMPLETE!', 0, h * 0.08, h * 0.085, '#E8243C'), `scale(${f(ease.outBack(clamp(done, 0, 1)))})`);
  return o;
}
// in-game map backgrounds for Dex's search montage (full 1920x1080 world)
function gameMap(kind, t) {
  let o = '';
  if (kind === 'desert') {
    o += S.rect(-800, -600, 3520, 1400, 0, { fill: '#FFC97A' }) + S.circle(1500, 220, 110, { fill: '#FFF2A8' });
    o += S.path('M-800 700 Q200 560 900 680 T2720 640 L2720 1680 L-800 1680 Z', ol('#F2B05E', 6));
    for (const [x, s] of [[300, 1], [1300, 0.8], [1700, 1.2]]) o += S.g(S.rect(-20, -200, 40, 200, 18, ol('#3FBF5A', 6)) + S.rect(-80, -150, 30, 80, 14, ol('#3FBF5A', 5)) + S.rect(50, -170, 30, 90, 14, ol('#3FBF5A', 5)), tf(x, 760, s));
  } else if (kind === 'snow') {
    o += S.rect(-800, -600, 3520, 1400, 0, { fill: '#CFE8FF' }) + S.path('M-800 760 L200 300 L700 700 L1200 260 L1800 720 L2720 400 L2720 1680 L-800 1680 Z', ol('#FFFFFF', 6));
    for (let i = 0; i < 30; i++) o += S.circle(hash(i * 3) * 1920, ((hash(i * 7) * 1080 + t * 120) % 1080), 6, { fill: '#FFFFFF' });
  } else if (kind === 'city') {
    o += S.rect(-800, -600, 3520, 1400, 0, { fill: '#8FD3FF' });
    for (let i = 0; i < 9; i++) o += S.rect(-100 + i * 240, 300 + hash(i) * 200, 200, 900, 6, ol(['#6E7891', '#5A6070', '#8A93A6'][i % 3], 6));
    o += S.rect(-800, 800, 3520, 600, 0, { fill: '#3A3F4E' });
  } else if (kind === 'lava') {
    o += S.rect(-800, -600, 3520, 2280, 0, { fill: '#3A1A1A' }) + S.rect(-800, 760, 3520, 900, 0, { fill: '#FF5A1F' });
    for (let i = 0; i < 6; i++) o += S.rect(100 + i * 300, 700 - (i % 2) * 60, 180, 40, 8, ol('#6E5050', 5));
  } else if (kind === 'cave') {
    o += S.rect(-800, -600, 3520, 2280, 0, { fill: '#14121E' });
    o += S.path('M-800 -600 L2720 -600 L2720 120 Q1800 260 1500 120 Q1100 300 700 140 Q300 280 -800 160 Z', { fill: '#2A2638' });
    for (let i = 0; i < 9; i++) o += S.path(`M${120 + i * 210} ${150 + (i % 3) * 20} l30 ${90 + (i % 4) * 30} l30 ${-(90 + (i % 4) * 30)} Z`, ol('#3A3550', 4));
    o += S.rect(-800, 820, 3520, 900, 0, { fill: '#2A2638' });
  }
  return o;
}
// pixel grass texture close-up (blocks); (x, y) top-left, cell
function pixelGrass(x, y, cols, rows, cell, t) {
  let d1 = '', d2 = '', d3 = '';
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const h = hash(c * 13.1 + r * 7.7);
    const sq = `M${x + c * cell} ${y + r * cell}h${cell}v${cell}h${-cell}Z`;
    if (h < 0.33) d1 += sq; else if (h < 0.7) d2 += sq; else d3 += sq;
  }
  return S.path(d1, { fill: '#3FA34A' }) + S.path(d2, { fill: '#5FCB5E' }) + S.path(d3, { fill: '#86E07A' });
}

module.exports = {
  LINE, tf, TS, TFS, pop, pick, at, shakeAll, clipTo, whip, smash, freezeAt,
  check, cross, stamp, listCard, slideIn, bloxy, room, wallClock,
  piggy, petPup, petShop, serverBrowser, cursor, obbyWorld, queueRope, signPost, deskPC, tosScroll, fishGame, goldFish, tycoon, gameMap, pixelGrass,
  DEFS: `<defs><linearGradient id="s04obbySky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6EC6FF"/><stop offset="1" stop-color="#CFF0FF"/></linearGradient></defs>`,
};
