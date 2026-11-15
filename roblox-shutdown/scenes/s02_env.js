// Private helpers for SC 02 + SC 03 (Juno's intro and the pop-up): camera shorthands, blueprint name cards,
// split-screen panels, whip transitions, Juno at her laptop, Grandpa's tablet, the shutdown pop-up, small props.
'use strict';

const K = require('./kit');
const SETS = require('./sets');
const A = require('./acting');
const { S, f, clamp, lerp, ease, seg, bump, hash, ol, ln, T, TF, actor } = K;
const C = K.C;

const camAt = (wx, wy, zoom = 1) => ({ zoom, x: wx - 960, y: wy - 540 });
const pop = (k) => ease.outBack(clamp(k, 0, 1));
const OUT = (w = 10) => ({ stroke: '#151515', 'stroke-width': w, 'paint-order': 'stroke', 'stroke-linejoin': 'round' });
const FULL = (fill, op) => S.rect(-800, -600, 3520, 2280, 0, { fill, ...(op !== undefined ? { opacity: f(op) } : {}) });
const tr = (x, y, s = 1, r = 0) => `translate(${f(x)} ${f(y)})${r ? ` rotate(${f(r)})` : ''}${s !== 1 ? ` scale(${f(s)})` : ''}`;

// add a shake to a camera object
function shakeCam(cam, t, t0, dur = 0.4, amp = 14) {
  const sh = K.shake(t, t0, dur, amp);
  return { ...cam, sx: (cam.sx || 0) + sh.sx, sy: (cam.sy || 0) + sh.sy };
}
// sum of several shakes
function shakes(cam, t, list) {
  let c = cam;
  for (const [t0, d, a] of list) c = shakeCam(c, t, t0, d, a);
  return c;
}

// white whip flash around a list of cut times (screen space)
function cutFlash(t, cuts, k = 0.45, w = 0.08) {
  let o = 0;
  for (const tc of cuts) if (Math.abs(t - tc) < w) o = Math.max(o, k * (1 - Math.abs(t - tc) / w));
  return o > 0 ? C.whiteFlash(o) : '';
}
// whip-pan: horizontal streaks + flash, centred on tc (dir +1 = content flies left)
function whip(t, tc, dur = 0.16) {
  const u = (t - tc) / dur;
  if (u < -1 || u > 1) return '';
  const k = 1 - Math.abs(u);
  let o = S.rect(0, 0, 1920, 1080, 0, { fill: '#FFFFFF', opacity: f(0.55 * k) });
  for (let i = 0; i < 16; i++) {
    const y = hash(i * 3.7 + Math.floor(tc * 10)) * 1080, len = 300 + hash(i * 1.9) * 900;
    const x = ((hash(i * 7.3) * 2400 - u * 1400) % 2400) - 300;
    o += S.rect(x, y, len, 8 + hash(i) * 22, 10, { fill: '#FFFFFF', opacity: f(0.7 * k) });
  }
  return o;
}

// blueprint name card (screen space). k in 0..1, out 0..1 (slides away). (x, y) = left/top of the card.
function nameCard(name, sub, k, out, t, x = 90, y = 650, col = '#2F6FD6') {
  if (k <= 0 || out >= 1) return '';
  const u = ease.outBack(clamp(k, 0, 1)), v = ease.in(clamp(out, 0, 1));
  const w = Math.max(560, name.length * 72 + 140), h = 196;
  let o = S.rect(10, 14, w, h, 18, { fill: '#000', opacity: 0.25 });
  o += S.rect(0, 0, w, h, 18, ol(col, 8));
  let grid = '';
  for (let gx = 40; gx < w; gx += 40) grid += `M${gx} 8 L${gx} ${h - 8} `;
  for (let gy = 40; gy < h; gy += 40) grid += `M8 ${gy} L${w - 8} ${gy} `;
  o += S.path(grid, ln(2, '#FFFFFF', 0.16));
  o += S.rect(14, 14, w - 28, h - 28, 10, { fill: 'none', stroke: '#FFFFFF', 'stroke-width': 3, 'stroke-dasharray': '14 9', opacity: 0.7 });
  o += T(name, 40, 112, 104, '#FFFFFF', { 'text-anchor': 'start', ...OUT(12) });
  o += TF(sub, 44, 166, 38, '#BFE0FF', { 'text-anchor': 'start' });
  // dimension line along the top
  o += S.path(`M30 -26 L${w - 30} -26 M30 -38 L30 -14 M${w - 30} -38 L${w - 30} -14`, ln(5, '#FFFFFF')) + S.path(`M30 -26 L${w - 30} -26 M30 -38 L30 -14 M${w - 30} -38 L${w - 30} -14`, ln(2.5, col));
  o += K.F.sparkle(w - 26, 18, 18 + 6 * Math.sin(t * 6));
  const dx = lerp(-w - 160, 0, u) - v * (w + 300);
  return S.g(o, `translate(${f(x + dx)} ${f(y)}) rotate(-3)`);
}

// a framed split-screen panel. inner = world svg (1920x1080 composition). Content is scaled to cover the panel and
// centred on focus [wx, wy] with an extra zoom. k = slide-in 0..1 (from: 'left'|'right'|'top'|'bottom'|'pop').
function panel(x, y, w, h, inner, k = 1, o2 = {}) {
  if (k <= 0) return '';
  const { focus = [960, 540], zoom = 1, from = 'pop', border = '#FFFFFF', rot = 0, bw = 10 } = o2;
  const id = S.uid('s02p');
  const sc = zoom * Math.max(w / 1920, h / 1080);
  const cont = S.g(inner, `translate(${f(w / 2)} ${f(h / 2)}) scale(${f(sc)}) translate(${f(-focus[0])} ${f(-focus[1])})`);
  let o = S.rect(8, 12, w, h, 16, { fill: '#000', opacity: 0.3 });
  o += S.clipDef(id, S.rect(0, 0, w, h, 14)) + S.g(S.rect(0, 0, w, h, 0, { fill: '#222' }) + cont, null, { 'clip-path': `url(#${id})` });
  o += S.rect(0, 0, w, h, 14, { fill: 'none', stroke: '#151515', 'stroke-width': bw + 8 }) + S.rect(0, 0, w, h, 14, { fill: 'none', stroke: border, 'stroke-width': bw });
  const u = ease.outBack(clamp(k, 0, 1)), e = ease.out(clamp(k, 0, 1));
  let tf;
  if (from === 'left') tf = `translate(${f(lerp(-w - 200, x, e))} ${f(y)})`;
  else if (from === 'right') tf = `translate(${f(lerp(1920 + 200, x, e))} ${f(y)})`;
  else if (from === 'top') tf = `translate(${f(x)} ${f(lerp(-h - 200, y, e))})`;
  else if (from === 'bottom') tf = `translate(${f(x)} ${f(lerp(1280, y, e))})`;
  else tf = `translate(${f(x + w / 2)} ${f(y + h / 2)}) scale(${f(u)}) translate(${f(-w / 2)} ${f(-h / 2)})`;
  return S.g(o, tf + (rot ? ` rotate(${f(rot)} ${f(w / 2)} ${f(h / 2)})` : ''));
}

// a label tag (screen space) e.g. "#1 ME"
function tag(txt, x, y, k, col = '#FFD21F', rot = -4, size = 54, txtCol = '#151515') {
  if (k <= 0) return '';
  const w = txt.length * size * 0.56 + 60;
  const o = S.rect(-w / 2, -size * 0.85, w, size * 1.3, size * 0.4, ol(col, 7)) + T(txt, 0, size * 0.33, size, txtCol);
  return S.g(o, `translate(${f(x)} ${f(y)}) rotate(${f(rot)}) scale(${f(pop(k))})`);
}

// round sticker badge (e.g. age)
function sticker(big, small, x, y, k, t, col = '#FFD21F') {
  if (k <= 0) return '';
  let o = '';
  for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; o += S.circle(Math.cos(a) * 82, Math.sin(a) * 82, 22, { fill: col, stroke: '#151515', 'stroke-width': 6 }); }
  o += S.circle(0, 0, 84, { fill: col }) + S.circle(0, 0, 66, { fill: 'none', stroke: '#FFFFFF', 'stroke-width': 5, 'stroke-dasharray': '8 8' });
  o += T(big, 0, small ? 18 : 30, small ? 76 : 90, '#151515') + (small ? TF(small, 0, 56, 24, '#151515') : '');
  return S.g(o, `translate(${f(x)} ${f(y)}) rotate(${f(10 + 6 * Math.sin(t * 4))}) scale(${f(pop(k))})`);
}

// ---------------------------------------------------------------- Juno's stool (copy of the attic one, local origin = floor centre)
function stool(x, y, s = 1, rot = 0) {
  let o = P2('M-46 -132 L-62 0 M46 -132 L62 0 M0 -128 L0 -10');
  o += S.path('M-54 -60 L54 -60', ln(12)) + S.path('M-54 -60 L54 -60', ln(5, '#B87A44'));
  o += S.ellipse(0, -130, 76, 15, ol('#2EC4B6', 5)) + S.ellipse(0, -144, 70, 20, ol('#FFD34D', 5)) + S.ellipse(-20, -150, 30, 7, { fill: '#FFF2B0' });
  return S.g(o, tr(x, y, s, rot));
}
function P2(d) { return S.path(d, ln(17)) + S.path(d, ln(9, '#B87A44')); }

// Juno seated on her stool at the laptop (side view, facing the laptop at screen-left). typing 0..1
const SEAT = { stoolX: 900, feetY: 880, x: 930, y: 902, s: 0.5 };
function junoSeated(t, o = {}) {
  const typ = o.typing ?? 1;
  const tp = Math.sin(t * 22) * 8 * typ, tp2 = Math.sin(t * 22 + 1.7) * 8 * typ;
  const pose = { x: SEAT.x, y: SEAT.y, s: SEAT.s, view: 'side', legL: 86, kneeL: 88, legR: 80, kneeR: 92, armL: 66 + tp, armR: 58 + tp2, bodyY: 0, face: o.face || 'happy', ...(o.pose || {}) };
  return actor('juno', t, pose, { arms: false, ...(o.act || {}) });
}

// ---------------------------------------------------------------- the shutdown pop-up (canonical 900x400, scaled to fit)
const POP_LINES = ['ATTENTION, PLAYERS.', 'Roblox will shut down FOREVER', 'in 24 hours.', 'Thanks for playing! :)'];
function shutPopup(w, h, k, nLines = 4, o = {}) {
  if (k <= 0) return '';
  const lines = POP_LINES.slice(0, nLines);
  const PW = 900, PH = 420;
  const sc = Math.min((w * 0.9) / PW, (h * 0.86) / PH);
  const inner = K.popup(0, 0, PW, PH, 'SYSTEM', lines, k, { size: 44, accent: o.accent || '#5A6478', icon: '!' });
  return S.g(inner, `scale(${f(sc)})`);
}
// grey dim + pop-up as a screen content function (for SETS.screens / laptop)
const popScreen = (bg, k, nLines = 4) => (w, h) => (typeof bg === 'function' ? bg(w, h) : bg || '') + (k > 0 ? S.rect(-w / 2, -h / 2, w, h, 0, { fill: '#2A2F3C', opacity: f(0.55 * clamp(k * 2, 0, 1)) }) : '') + shutPopup(w, h, k, nLines);

// ---------------------------------------------------------------- Grandpa's tablet (centre x, y; screen 380x260)
function tablet(x, y, s = 1, rot = 0, screen = '') {
  const id = S.uid('s02tab');
  let o = S.rect(-222, -160, 444, 320, 34, ol('#3A3F4E', 8)) + S.rect(-206, -144, 412, 288, 22, { fill: '#14161E' });
  o += S.clipDef(id, S.rect(-190, -130, 380, 260, 10));
  o += S.g(S.rect(-190, -130, 380, 260, 0, { fill: '#2A3550' }) + (typeof screen === 'function' ? screen(380, 260) : screen), null, { 'clip-path': `url(#${id})` });
  o += S.path('M-170 -120 L-90 -120 L-180 40 Z', { fill: '#FFFFFF', opacity: 0.08 }) + S.circle(206, 0, 6, { fill: '#5A6070' });
  return S.g(o, tr(x, y, s, rot));
}

// game frame (1920x1080) shrunk into a w x h box centred on 0,0
const gameIn = (svg) => (w, h) => SETS.frameIn(svg, w, h);

// ---------------------------------------------------------------- misc props
// big expressive "?" / "!" marks around a point
function marks(txt, x, y, t, k = 1, n = 3, col = '#FFFFFF') {
  if (k <= 0) return '';
  let o = '';
  for (let i = 0; i < n; i++) {
    const a = -Math.PI / 2 + (i - (n - 1) / 2) * 0.8;
    const r = 120 + 20 * Math.sin(t * 5 + i);
    o += K.F.markText(txt, x + Math.cos(a) * r, y + Math.sin(a) * r * 0.8, 70 + i * 6, (i - 1) * 14, col);
  }
  return S.g(o, `translate(${f(x)} ${f(y)}) scale(${f(pop(k))}) translate(${f(-x)} ${f(-y)})`);
}
// spinning dizzy stars around (x, y)
function dizzy(x, y, t, k = 1, r = 90) {
  if (k <= 0) return '';
  let o = '';
  for (let i = 0; i < 4; i++) {
    const a = t * 6 + (i / 4) * Math.PI * 2;
    o += K.F.sparkle(x + Math.cos(a) * r, y + Math.sin(a) * r * 0.32, 18 + 6 * Math.sin(t * 9 + i), i % 2 ? '#FFE14D' : '#FFFFFF');
  }
  return S.g(o, null, { opacity: f(clamp(k, 0, 1)) });
}
// soap bubble
function bubble(x, y, r, k = 1) {
  if (k <= 0) return '';
  return S.circle(x, y, r, { fill: '#BFEFFF', 'fill-opacity': 0.25, stroke: '#FFFFFF', 'stroke-width': Math.max(2, r * 0.08) }) + S.circle(x, y, r, { fill: 'none', stroke: '#B07CFF', 'stroke-width': Math.max(1.5, r * 0.04), opacity: 0.6 }) + S.ellipse(x - r * 0.38, y - r * 0.4, r * 0.18, r * 0.11, { fill: '#FFFFFF', opacity: 0.9 });
}
// a "pop" splash
function popFx(x, y, k, r = 40) {
  if (k <= 0 || k >= 1) return '';
  let o = '';
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2, r0 = r * (0.6 + k), r1 = r0 + r * 0.5 * (1 - k);
    o += S.path(`M${f(x + Math.cos(a) * r0)} ${f(y + Math.sin(a) * r0)} L${f(x + Math.cos(a) * r1)} ${f(y + Math.sin(a) * r1)}`, ln(6 * (1 - k) + 2, '#FFFFFF'));
  }
  return o + S.circle(x, y, r * (0.5 + k), { fill: 'none', stroke: '#BFEFFF', 'stroke-width': 4 * (1 - k), opacity: f(1 - k) });
}
// respawn shimmer column (world coords: feet at x, y; height h)
function respawn(x, y, h, k, t) {
  if (k <= 0 || k >= 1) return '';
  const a = Math.sin(k * Math.PI);
  let o = S.rect(x - 90, y - h, 180, h, 60, { fill: '#9FF3FF', opacity: f(0.35 * a) }) + S.rect(x - 40, y - h, 80, h, 40, { fill: '#FFFFFF', opacity: f(0.5 * a) });
  o += S.ellipse(x, y, 180 * a + 40, 34 * a + 8, { fill: 'none', stroke: '#7CF7FF', 'stroke-width': 10, opacity: f(a) });
  for (let i = 0; i < 8; i++) {
    const yy = y - ((k * 1.6 + i / 8) % 1) * h, xx = x + Math.sin(t * 7 + i * 2) * 110;
    o += K.F.sparkle(xx, yy, 22 * a, i % 2 ? '#FFFFFF' : '#7CF7FF');
  }
  return o;
}
// "DING!" elevator-bell sparkle burst (Pip's recurring gag); k 0..1
function dingFx(x, y, k, s = 1, text = true) {
  if (k <= 0 || k >= 1) return '';
  const a = Math.sin(clamp(k * 1.4, 0, 1) * Math.PI * 0.5) * (1 - clamp((k - 0.6) / 0.4, 0, 1));
  let o = K.rays(0, 0, 12, 230 * pop(k * 2), '#FFF3A8', 0.35 * a, k * 90);
  o += S.g(S.path('M-30 22 Q-30 -26 0 -28 Q30 -26 30 22 Z', ol('#FFD34D', 6)) + S.rect(-38, 20, 76, 12, 6, ol('#FFD34D', 5)) + S.circle(0, 40, 9, ol('#FFD34D', 4)) + S.path('M-14 -12 Q-10 -20 -2 -20', ln(5, '#FFF6C8')), `translate(0 -40) rotate(${f(Math.sin(k * 40) * 16 * (1 - k))})`);
  if (text) o += K.F.markText('DING!', 0, 70, 70, -6, '#FFE14D');
  o += K.F.sparkle(-120, -60, 30 * a) + K.F.sparkle(118, -90, 24 * a) + K.F.sparkle(96, 60, 18 * a);
  return S.g(o, `translate(${f(x)} ${f(y)}) scale(${f(s * pop(k * 2.5))})`, { opacity: f(clamp(a * 1.5, 0, 1)) });
}

module.exports = {
  camAt, pop, OUT, FULL, tr, shakeCam, shakes, cutFlash, whip, nameCard, panel, tag, sticker, stool, SEAT, junoSeated,
  shutPopup, popScreen, POP_LINES, tablet, gameIn, marks, dizzy, bubble, popFx, respawn, dingFx,
};
