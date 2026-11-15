// Shared toolkit for the Robux scenes: camera keys, actors with auto-acting, Robux props, particles, UI cards.
'use strict';

const S = require('../rig/svg');
const F = require('../rig/face');
const E = require('./env');
const C = require('./common');
const V = require('./vo');
const { draw, NAMES } = require('../rig/cast');
const { f, clamp, lerp, inv, ease } = S;

const W = 1920, H = 1080;
const LINE = '#151515';
const ol = (fill, w = 6) => ({ fill, stroke: LINE, 'stroke-width': w, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' });
const ln = (w, c = LINE, op) => ({ fill: 'none', stroke: c, 'stroke-width': w, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', ...(op !== undefined ? { opacity: op } : {}) });
const T = (s, x, y, size, fill, extra = {}) => S.el('text', { x, y, 'font-family': 'Lilita One, sans-serif', 'font-size': size, fill, 'text-anchor': 'middle', ...extra }, s);
const TF = (s, x, y, size, fill, extra = {}) => S.el('text', { x, y, 'font-family': 'Fredoka, sans-serif', 'font-weight': 700, 'font-size': size, fill, 'text-anchor': 'middle', ...extra }, s);
const hash = (n) => { const v = Math.sin(n * 127.1 + 311.7) * 43758.5453; return v - Math.floor(v); };
const bump = (t, a, b) => Math.sin(clamp((t - a) / (b - a), 0, 1) * Math.PI);
const seg = (t, a, b) => clamp((t - a) / (b - a), 0, 1);

// ---------------------------------------------------------------- camera
// keys: [[t, {zoom, x, y, rot}], ...]; eased between keys. Returns cam for E.camTf / E.layer.
function camKeys(t, keys, easing = ease.inOut) {
  if (t <= keys[0][0]) return { ...keys[0][1] };
  for (let i = 0; i < keys.length - 1; i++) {
    const [t0, a] = keys[i], [t1, b] = keys[i + 1];
    if (t <= t1) {
      const u = easing(seg(t, t0, t1));
      const o = {};
      for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) o[k] = lerp(a[k] ?? b[k], b[k] ?? a[k], u);
      return o;
    }
  }
  return { ...keys[keys.length - 1][1] };
}
// world-space group seen through cam (parallax k=1)
const view = (cam, inner, k = 1) => S.g(inner, E.camTf(cam, k));
function shake(t, a, dur = 0.4, amp = 14) {
  if (t < a || t > a + dur) return { sx: 0, sy: 0 };
  const k = 1 - (t - a) / dur;
  return { sx: Math.sin(t * 97) * amp * k, sy: Math.cos(t * 83) * amp * 0.7 * k };
}
const shaken = (t, a, inner, dur, amp) => { const s = shake(t, a, dur, amp); return s.sx || s.sy ? S.g(inner, `translate(${f(s.sx)} ${f(s.sy)})`) : inner; };

// ---------------------------------------------------------------- actors
// actor('ty', t, { x, y, s, ...pose }, { face, energy, arms }) — auto lip-sync/blinks/gestures from the voice timeline
const SPEAKER = { ty: 'TY', mia: 'MIA', pickle: 'PICKLE', dad: 'DAD', mom: 'MOM', grandma: 'GRANDMA', thirty: 'THIRTY', anchor: 'ANCHOR', scammer: 'SCAMMER', butler: 'BUTLER' };
function actor(name, t, pose = {}, act = {}) {
  const sp = SPEAKER[name];
  const auto = sp ? V.perform(sp, t, { seed: name.length * 3.7 + (act.seed || 0), ...act }) : {};
  const p = { shade: true, shadow: true, ...auto, ...pose };
  if (pose.face && auto.face) {
    // keep the explicit face but still lip-sync / blink
    const fo = typeof pose.face === 'string' ? { name: pose.face } : { ...pose.face };
    if (auto.face.mouth && V.talking(sp, t) && fo.mouth === undefined) fo.mouth = auto.face.mouth;
    if (auto.face.blink && fo.blink === undefined) fo.blink = auto.face.blink;
    p.face = fo;
  }
  if (name === 'scammer') p.face = { ...(p.face || {}), signOn: Math.floor(t * 5) % 3 !== 0 ? 1 : 0 };
  return draw[name](p);
}
const nameTag = (txt, x, y, col = '#FFFFFF') => S.g(S.rect(-110, -30, 220, 50, 14, { fill: '#000', opacity: 0.35 }) + TF(txt, 0, 8, 30, col), `translate(${f(x)} ${f(y)})`);

// ---------------------------------------------------------------- Robux props
// the Robux coin: gold disc with a tilted rounded-square mark
function coin(x, y, r = 40, rot = 0, spin = 0, col = '#FFC93C') {
  const sx = Math.max(0.12, Math.abs(Math.cos(spin)));
  let o = S.ellipse(0, 0, r, r, ol(col, Math.max(3, r * 0.12)));
  o += S.ellipse(0, 0, r * 0.78, r * 0.78, { fill: 'none', stroke: '#E0A21A', 'stroke-width': r * 0.08 });
  o += S.g(S.path(S.roundedPath([[-r * 0.38, -r * 0.38], [r * 0.38, -r * 0.38], [r * 0.38, r * 0.38], [-r * 0.38, r * 0.38]], r * 0.1), { fill: 'none', stroke: '#B97A0E', 'stroke-width': r * 0.13 }) +
    S.rect(-r * 0.12, -r * 0.12, r * 0.24, r * 0.24, r * 0.04, { fill: '#B97A0E' }), 'rotate(15)');
  o += S.path(`M${f(-r * 0.55)} ${f(-r * 0.35)} Q${f(-r * 0.3)} ${f(-r * 0.7)} ${f(r * 0.1)} ${f(-r * 0.72)}`, ln(r * 0.1, '#FFF4C4'));
  return S.g(o, `translate(${f(x)} ${f(y)}) rotate(${f(rot)}) scale(${f(sx)} 1)`);
}
const grayCoin = (x, y, r, rot, spin) => coin(x, y, r, rot, spin, '#9AA0AE');
// Robux mark + amount, e.g. price tags: robuxText(x, y, '5,000', size)
function robuxText(x, y, amount, size = 60, fill = '#FFFFFF', anchor = 'middle') {
  const w = (String(amount).length * 0.56 + 1.1) * size;
  const x0 = anchor === 'middle' ? x - w / 2 : x;
  return coin(x0 + size * 0.45, y - size * 0.34, size * 0.42) + T(String(amount), x0 + size * 1.0, y, size, fill, { 'text-anchor': 'start', stroke: LINE, 'stroke-width': size * 0.12, 'paint-order': 'stroke' });
}
function priceTag(x, y, amount, s = 1, rot = 0, col = '#FFE14D') {
  let o = S.path('M-120 -48 L90 -48 L130 0 L90 48 L-120 48 Z', ol(col, 6)) + S.circle(96, 0, 10, ol('#FFFFFF', 4));
  o += robuxText(-14, 22, amount, 52, '#2A1640');
  return S.g(o, `translate(${f(x)} ${f(y)}) rotate(${f(rot)}) scale(${f(s)})`);
}
// game-pass popup card (Roblox-store style, original layout)
function gamePass(x, y, title, price, s = 1, k = 1, icon = '') {
  const sc = s * ease.outBack(clamp(k, 0, 1));
  if (sc < 0.01) return '';
  let o = S.rect(-260, -170, 520, 340, 34, ol('#232A3D', 8)) + S.rect(-260, -170, 520, 70, 34, { fill: '#2E7BFF' }) + S.rect(-260, -130, 520, 30, 0, { fill: '#2E7BFF' });
  o += T('GAME PASS', 0, -122, 40, '#FFFFFF');
  o += icon || S.rect(-60, -80, 120, 100, 22, ol('#FFD21F', 5));
  o += TF(title, 0, 70, 42, '#FFFFFF');
  o += S.rect(-130, 96, 260, 58, 22, ol('#3BD16F', 5)) + robuxText(0, 140, price, 40, '#FFFFFF');
  return S.g(o, `translate(${f(x)} ${f(y)}) scale(${f(sc)})`);
}
// smartphone (held or full-screen); screen(svg) drawn inside a 300x560 screen box
function phone(x, y, s = 1, rot = 0, screen = '') {
  const id = S.uid('ph');
  let o = S.rect(-170, -320, 340, 640, 46, ol('#20232E', 8)) + S.clipDef(id, S.rect(-150, -280, 300, 560, 26));
  o += S.g(S.rect(-150, -280, 300, 560, 0, { fill: '#0E1220' }) + screen, null, { 'clip-path': `url(#${id})` });
  o += S.rect(-40, -306, 80, 12, 6, { fill: '#0B0C10' });
  return S.g(o, `translate(${f(x)} ${f(y)}) rotate(${f(rot)}) scale(${f(s)})`);
}
// TV set with news lower-third; inner(svg) is drawn in a 1600x900 screen box at (-800,-450)
function tv(x, y, s, inner, ticker = '', t = 0) {
  const id = S.uid('tv');
  let o = S.rect(-860, -510, 1720, 1020, 60, ol('#1A1A22', 14)) + S.clipDef(id, S.rect(-800, -450, 1600, 900, 20));
  let scr = S.rect(-800, -450, 1600, 900, 0, { fill: '#123' }) + inner;
  if (ticker) {
    scr += S.rect(-800, 260, 1600, 110, 0, { fill: '#D7263D' }) + S.rect(-800, 370, 1600, 80, 0, { fill: '#10162A' });
    scr += T('BREAKING NEWS', -560, 336, 64, '#FFFFFF');
    const tx = -800 + 1600 - ((t * 260) % 3200);
    scr += TF(ticker, tx, 425, 44, '#FFE14D', { 'text-anchor': 'start' });
  }
  o += S.g(scr, null, { 'clip-path': `url(#${id})` });
  o += S.rect(-800, -450, 1600, 900, 20, { fill: 'none', stroke: '#000', 'stroke-width': 6 });
  return S.g(o, `translate(${f(x)} ${f(y)}) scale(${f(s)})`);
}
// stock-style chart line from points [[0..1, 0..1]] inside a box
function chart(x, y, w, h, pts, k = 1, col = '#3BD16F', label = '') {
  const n = Math.max(2, Math.floor(pts.length * clamp(k, 0, 1)));
  const P = pts.slice(0, n).map(([u, v]) => [x + u * w, y + h - v * h]);
  let o = S.rect(x - 30, y - 30, w + 60, h + 60, 22, ol('#10162A', 6));
  for (let i = 1; i < 5; i++) o += S.path(`M${x} ${f(y + (h * i) / 5)} L${x + w} ${f(y + (h * i) / 5)}`, ln(2, '#FFFFFF', 0.12));
  o += S.path('M' + P.map(([a, b]) => `${f(a)} ${f(b)}`).join(' L'), ln(10, col));
  const e = P[P.length - 1];
  o += S.circle(e[0], e[1], 12, ol(col, 4));
  if (label) o += T(label, x + w - 20, y + 60, 72, col, { 'text-anchor': 'end', stroke: LINE, 'stroke-width': 8, 'paint-order': 'stroke' });
  return o;
}
// money counter HUD
function counter(x, y, value, s = 1, col = '#3BD16F') {
  const txt = Math.round(value).toLocaleString('en-US');
  const w = 120 + txt.length * 38;
  return S.g(S.rect(-w / 2, -50, w, 100, 30, ol('#14182A', 6)) + robuxText(0, 22, txt, 62, col), `translate(${f(x)} ${f(y)}) scale(${f(s)})`);
}

// ---------------------------------------------------------------- particles
// coins falling from the sky: deterministic per index
function coinRain(t, n = 40, opts = {}) {
  const { x0 = -100, x1 = 2020, y0 = -150, y1 = 1250, speed = 520, r = 30, gray = false, seed = 1 } = opts;
  let o = '';
  for (let i = 0; i < n; i++) {
    const h1 = hash(i * 7.1 + seed), h2 = hash(i * 3.3 + seed * 2), h3 = hash(i * 1.7 + seed * 5);
    const span = y1 - y0;
    const y = y0 + ((t * speed * (0.7 + 0.6 * h2) + h1 * span) % span);
    const x = lerp(x0, x1, h3) + Math.sin(t * 2 + i) * 20;
    o += (gray ? grayCoin : coin)(x, y, r * (0.7 + 0.6 * h2), h1 * 360, t * (4 + 6 * h1) + i);
  }
  return o;
}
// burst of coins from a point (fountain); k = time since burst start (s)
function coinBurst(x, y, k, n = 28, power = 900, r = 28, seed = 3) {
  if (k < 0) return '';
  let o = '';
  for (let i = 0; i < n; i++) {
    const a = -Math.PI / 2 + (hash(i + seed) - 0.5) * 2.0;
    const v = power * (0.5 + 0.6 * hash(i * 2 + seed));
    const px = x + Math.cos(a) * v * k, py = y + Math.sin(a) * v * k + 0.5 * 1900 * k * k;
    if (py > 1400) continue;
    o += coin(px, py, r * (0.7 + 0.6 * hash(i * 5 + seed)), i * 40, k * 10 + i);
  }
  return o;
}
function rain(t, n = 140, opts = {}) {
  const { col = '#A9C7FF', op = 0.55, speed = 1900, len = 46, angle = 12 } = opts;
  let o = '';
  const dx = Math.tan((angle * Math.PI) / 180) * len;
  for (let i = 0; i < n; i++) {
    const x = hash(i * 1.3) * 2200 - 140 + ((t * speed * Math.tan((angle * Math.PI) / 180)) % 200);
    const y = ((t * speed + hash(i * 7.7) * 1300) % 1300) - 120;
    o += S.path(`M${f(x)} ${f(y)} l${f(-dx)} ${len}`, ln(4, col, op));
  }
  return o;
}
function confetti(t, t0, n = 60, seed = 9) {
  const k = t - t0;
  if (k < 0) return '';
  const cols = ['#FF5A5A', '#FFD21F', '#3BD16F', '#34C3FF', '#B06BFF', '#FF6FB5'];
  let o = '';
  for (let i = 0; i < n; i++) {
    const a = hash(i + seed) * Math.PI * 2;
    const v = 500 + 700 * hash(i * 3 + seed);
    const x = 960 + Math.cos(a) * v * k * 0.9, y = 460 + Math.sin(a) * v * k * 0.6 + 400 * k * k;
    o += S.rect(x, y, 16, 26, 4, { fill: cols[i % cols.length], transform: `rotate(${f(k * 500 + i * 40)} ${f(x + 8)} ${f(y + 13)})` });
  }
  return o;
}
function sparkles(pts, t) {
  return pts.map(([x, y, r], i) => F.sparkle(x, y, r * (0.6 + 0.4 * Math.abs(Math.sin(t * 5 + i))))).join('');
}

// ---------------------------------------------------------------- simple sky + ground helpers
function sky(top, bottom, id) {
  return `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${top}"/><stop offset="1" stop-color="${bottom}"/></linearGradient></defs>` + S.rect(-800, -800, 3520, 2680, 0, { fill: `url(#${id})` });
}
function rays(cx, cy, n, r, col, op, rot = 0) {
  let o = '';
  for (let i = 0; i < n; i++) {
    const a0 = ((i / n) * 360 + rot) * Math.PI / 180, a1 = (((i + 0.5) / n) * 360 + rot) * Math.PI / 180;
    o += S.path(`M${cx} ${cy} L${f(cx + r * Math.cos(a0))} ${f(cy + r * Math.sin(a0))} L${f(cx + r * Math.cos(a1))} ${f(cy + r * Math.sin(a1))} Z`, { fill: col, opacity: op });
  }
  return o;
}
// big punchy on-screen word (sound-effect lettering)
function bang(txt, x, y, k, size = 120, rot = -6, col = '#FFD21F') {
  return C.sfx(txt, x, y, k, size, rot, col);
}

module.exports = {
  W, H, LINE, ol, ln, T, TF, hash, bump, seg, camKeys, view, shake, shaken, actor, nameTag, NAMES,
  coin, grayCoin, robuxText, priceTag, gamePass, phone, tv, chart, counter, coinRain, coinBurst, rain, confetti, sparkles, sky, rays, bang,
  E, C, V, S, F, f, clamp, lerp, inv, ease, draw,
};
