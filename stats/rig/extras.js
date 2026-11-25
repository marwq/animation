// Props for "What If You Could See Everyone's STATS in Real Life?": breakfast chaos (toaster + toast, cereal bowl, pancakes,
// coffee mug, frying pan), the alarm clock and the smelly sock, school things (sandwich, lunch bag, lunch tray, quiz paper,
// books, the pointer, the red pen), the quest montage (grocery bags, ball, paper boat, pillow fort), the science fair potato
// battery, the town fair (map, dinosaur balloon, cotton candy), Grandpa's champion sash and cane, devices (tablet, phone,
// gaming PC) — and BISCUIT, the chubby corgi (a non-rig character: X.biscuit / cast.draw.biscuit).
//
// Conventions (see docs/CAST.md):
//  * Every function is pure and returns an SVG string. Props take either positional (x, y, s, rot, opts) or one object
//    ({ x, y, s, rot, ...opts }) — both forms work everywhere.
//  * Props are authored in the hero's BODY units (hero ≈ 950 tall at s 1): pass the same s as the actor holding them
//    (screen space), or use them inside a rig pose's `props` (body space, s ≈ 1 / the character's size).
//  * Devices take `screen`: an SVG string or a function (w, h) => SVG, drawn in a local box (0, 0)-(w, h) clipped to the
//    screen (sizes in DEVICE_SCREENS). `glow` adds a soft light spill in front of the screen.
//  * Static gradients live in DEFS (ids prefixed `ex`); scenes/main.js loads them automatically.
'use strict';

const S = require('./svg');
const C = require('./palette');
const F = require('./face');
const { f, clamp, lerp } = S;

const LINE = C.line;
const ol = (fill, w = 6) => ({ fill, stroke: LINE, 'stroke-width': w, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' });
const ln = (w, col = LINE, op) => ({ fill: 'none', stroke: col, 'stroke-width': w, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', ...(op !== undefined ? { opacity: f(op) } : {}) });
const P = (p) => `${f(p[0])} ${f(p[1])}`;
const poly = (pts, r = 6) => S.roundedPath(pts, r);
const hash = (n) => { const v = Math.sin(n * 127.1 + 311.7) * 43758.5453; return v - Math.floor(v); };
const T = (s, x, y, size, fill, extra = {}) => S.el('text', { x, y, 'font-family': 'Lilita One, sans-serif', 'font-size': size, fill, 'text-anchor': 'middle', ...extra }, s);
const TF = (s, x, y, size, fill, extra = {}) => S.el('text', { x, y, 'font-family': 'Fredoka, sans-serif', 'font-weight': 700, 'font-size': size, fill, 'text-anchor': 'middle', ...extra }, s);
const cid = (p) => S.uid('ex' + p);
const clipped = (d, fill, inner, w = 6) => { const id = cid('c'); return S.clipDef(id, S.path(d)) + S.path(d, { fill }) + (inner ? S.g(inner, null, { 'clip-path': `url(#${id})` }) : '') + (w ? S.path(d, ol('none', w)) : ''); };
function puffs(circles, fill, w = 6, lineCol = LINE) {
  const ring = (x, y, r) => `M${f(x - r)} ${f(y)} a${f(r)} ${f(r)} 0 1 0 ${f(2 * r)} 0 a${f(r)} ${f(r)} 0 1 0 ${f(-2 * r)} 0 Z`;
  return S.path(circles.map(([x, y, r]) => ring(x, y, r + w / 2)).join(' '), { fill: lineCol }) + S.path(circles.map(([x, y, r]) => ring(x, y, Math.max(0.5, r - w / 2))).join(' '), { fill });
}
const band = (d, w, col, ow = 7) => S.path(d, ln(w + ow)) + S.path(d, ln(w, col));
const shade = (hex, k = 0.82) => '#' + [1, 3, 5].map((i) => Math.round(clamp(parseInt(hex.slice(i, i + 2), 16) * k, 0, 255)).toString(16).padStart(2, '0')).join('');
const dotD = (x, y, r) => `M${f(x - r)} ${f(y)} a${f(r)} ${f(r)} 0 1 0 ${f(2 * r)} 0 a${f(r)} ${f(r)} 0 1 0 ${f(-2 * r)} 0 Z `;
// argument normaliser: fn(x, y, s, rot, opts) or fn({ x, y, s, rot, ...opts })
function A(args, names = ['x', 'y', 's', 'rot'], defs = {}) {
  const o = { x: 0, y: 0, s: 1, rot: 0, ...defs };
  if (args.length === 1 && args[0] && typeof args[0] === 'object') return { ...o, ...args[0] };
  names.forEach((n, i) => { if (args[i] !== undefined && typeof args[i] !== 'object') o[n] = args[i]; });
  for (const a of args) if (a && typeof a === 'object') Object.assign(o, a);
  return o;
}
const place = (o, inner) => (inner ? S.g(inner, `translate(${f(o.x)} ${f(o.y)})${o.rot ? ` rotate(${f(o.rot)})` : ''}${o.s !== 1 ? ` scale(${f(o.s)})` : ''}`) : '');
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
// rising steam wisps (t animates), centred on x, from y up
function steam(x, y, t, k = 1, n = 3, h = 120) {
  if (k <= 0) return '';
  let d = '';
  for (let i = 0; i < n; i++) {
    const u = (t * 0.7 + i / n) % 1, xx = x + (i - (n - 1) / 2) * 30, yy = y - u * h * 0.5;
    d += `M${f(xx)} ${f(yy)} q${f(14 * Math.sin(t * 3 + i))} ${f(-h * 0.25)} 0 ${f(-h * 0.5)} q${f(-14 * Math.sin(t * 3 + i))} ${f(-h * 0.25)} 0 ${f(-h * 0.5)}`;
  }
  return S.path(d, { ...ln(12, '#FFFFFF'), opacity: f(0.75 * k) });
}
function smoke(x, y, t, k = 1, col = '#5A5560') {
  if (k <= 0) return '';
  const cs = [];
  for (let i = 0; i < 5; i++) { const u = (t * 0.5 + i / 5) % 1; cs.push([x + Math.sin(i * 2.1 + t) * 30 * u, y - u * 260 * k, (22 + 40 * u) * (0.6 + 0.4 * k)]); }
  return S.g(puffs(cs, col, 0.01, col), null, { opacity: f(0.55 * k) });
}

const DEFS = `<defs>
<linearGradient id="exScreen" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2A3F7A"/><stop offset="1" stop-color="#101A3A"/></linearGradient>
<linearGradient id="exCoffee" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8A5A2A"/><stop offset="1" stop-color="#5A3418"/></linearGradient>
</defs>`;

// ====================================================================== SCREENS / DEVICES
const DEVICE_SCREENS = { tablet: [300, 420], phone: [176, 340], gamingPC: [660, 372] };
function screenBox(x0, y0, w, h, r, screen, opts = {}) {
  const id = cid('s');
  const inner = typeof screen === 'function' ? screen(w, h) : (screen || '');
  let o = S.clipDef(id, S.rect(x0, y0, w, h, r));
  let body = S.rect(x0, y0, w, h, 0, { fill: opts.bg || 'url(#exScreen)' });
  if (!inner && opts.idle) body += opts.idle;
  body += inner ? S.g(inner, `translate(${f(x0)} ${f(y0)})`) : '';
  if (opts.off) body += S.rect(x0, y0, w, h, 0, { fill: '#0E1120', opacity: f(clamp(opts.off, 0, 1)) });
  body += S.path(`M${f(x0 + w * 0.62)} ${f(y0)} L${f(x0 + w * 0.82)} ${f(y0)} L${f(x0 + w * 0.5)} ${f(y0 + h)} L${f(x0 + w * 0.3)} ${f(y0 + h)} Z`, { fill: '#FFFFFF', opacity: 0.06 });
  o += S.g(body, null, { 'clip-path': `url(#${id})` });
  return o;
}
// idle picture for a screen without `screen`: a little game (blue sky, a dragon "LV 90", a goblin "LV 50")
function gameIdle(w, h) {
  let o = S.rect(0, 0, w, h, 0, { fill: '#5A3A8A' }) + S.rect(0, h * 0.72, w, h * 0.28, 0, { fill: '#3A8A4A' });
  o += S.circle(w * 0.82, h * 0.2, h * 0.08, { fill: '#FFE14D' });
  const tag = (x, y, t, c) => S.rect(x - h * 0.13, y - h * 0.07, h * 0.26, h * 0.1, h * 0.03, { fill: '#121426', opacity: 0.8 }) + TF(t, x, y + h * 0.01, h * 0.06, c);
  o += S.path(`M${f(w * 0.6)} ${f(h * 0.72)} q${f(w * 0.05)} ${f(-h * 0.4)} ${f(w * 0.2)} ${f(-h * 0.36)} l${f(w * 0.03)} ${f(-h * 0.06)} l${f(w * 0.02)} ${f(h * 0.1)} q${f(-w * 0.02)} ${f(h * 0.3)} ${f(w * 0.0)} ${f(h * 0.32)} Z`, ol('#E8453C', 3)) + tag(w * 0.72, h * 0.22, 'LV 90', '#FF6B6B');
  o += S.rect(w * 0.2, h * 0.55, h * 0.16, h * 0.17, h * 0.03, ol('#7FBF4A', 3)) + tag(w * 0.2 + h * 0.08, h * 0.47, 'LV 50', '#9AE86A');
  return o;
}
const spill = (x0, y0, w, h, col, k) => (k > 0 ? S.path(`M${f(x0)} ${f(y0)} L${f(x0 + w)} ${f(y0)} L${f(x0 + w + w * 0.5)} ${f(y0 + h * 2.2)} L${f(x0 - w * 0.5)} ${f(y0 + h * 2.2)} Z`, { fill: col, opacity: f(0.07 * k) }) + S.rect(x0 - 16, y0 - 16, w + 32, h + 32, 30, { fill: col, opacity: f(0.12 * k) }) : '');

// the hero's tablet (Max pokes it in the final gag). Anchor = centre. face 'screen' (300 x 420 portrait) | 'back' (dino stickers);
// landscape: true rotates it 90°; col = case colour; screen / glow / off as for every device
function tablet(...args) {
  const o = A(args, ['x', 'y', 's', 'rot'], { face: 'screen', screen: null, glow: 0, col: '#3A4A6A', landscape: false, off: 0 });
  const [sw, sh] = DEVICE_SCREENS.tablet;
  let g = S.path(poly([[-180, -250], [180, -250], [180, 250], [-180, 250]], 40), ol(o.col, 8));
  if (o.face === 'back') {
    g += S.circle(-118, -196, 20, ol('#1E2230', 5)) + S.circle(-118, -196, 8, { fill: '#4A6AB8' });
    g += S.g(S.path('M-30 20 Q-40 -30 0 -40 Q30 -60 50 -30 L60 -40 L58 -14 Q60 20 30 30 L30 60 L16 60 L16 34 L-10 34 L-10 60 L-24 60 Z', ol('#5DBB4A', 5)) + S.circle(26, -30, 5, { fill: LINE }), 'translate(20 40) rotate(-8)');
    g += S.g(S.path(F.starPath(0, 0, 34, 15), ol('#FFD23F', 5)), 'translate(-90 150) rotate(-12)');
  } else {
    g += S.rect(-166, -236, 332, 472, 30, { fill: '#1E2230' });
    g += screenBox(-sw / 2, -sh / 2, sw, sh, 12, o.screen, { idle: o.screen ? '' : gameIdle(sw, sh), off: o.off });
    g += S.circle(0, -226, 5, { fill: '#3A3F4E' });
    g += spill(-sw / 2, -sh / 2, sw, sh, '#9FD8FF', o.glow);
  }
  return place({ ...o, rot: o.rot + (o.landscape ? 90 : 0) }, g);
}
// a smartphone (Mom's: coral case with a cupcake). Anchor = centre. face 'screen' (176 x 340) | 'back'; col
function phone(...args) {
  const o = A(args, ['x', 'y', 's', 'rot'], { face: 'screen', screen: null, glow: 0, col: '#F27C6B', off: 0 });
  const [sw, sh] = DEVICE_SCREENS.phone;
  let g = S.path(poly([[-104, -196], [104, -196], [104, 196], [-104, 196]], 34), ol(o.col, 7));
  if (o.face === 'back') {
    g += S.path(poly([[-84, -178], [-30, -178], [-30, -124], [-84, -124]], 14), ol('#1E2230', 5)) + S.circle(-57, -151, 12, { fill: '#4A6AB8' });
    g += S.g(cupcakeIcon(), 'translate(10 40) scale(1.3)');
  } else {
    g += S.rect(-96, -188, 192, 376, 26, { fill: '#1E2230' });
    g += screenBox(-sw / 2, -sh / 2, sw, sh, 14, o.screen, { idle: o.screen ? '' : S.rect(0, 0, sw, sh, 0, { fill: '#FFE9D6' }) + S.g(cupcakeIcon(), `translate(${sw / 2} ${sh / 2}) scale(1.4)`) + TF('ORDERS: 300', sw / 2, sh * 0.8, 22, '#E8453C'), off: o.off });
    g += S.rect(-30, -184, 60, 12, 6, { fill: '#0B0C10' });
    g += spill(-sw / 2, -sh / 2, sw, sh, '#9FD8FF', o.glow);
  }
  return place(o, g);
}
function cupcakeIcon() {
  return S.path('M-26 0 L26 0 L18 34 L-18 34 Z', ol('#F2B45C', 4)) + S.path('M-12 2 L-8 32 M0 2 L0 32 M12 2 L8 32', ln(3, '#C98A3A')) +
    S.path('M-30 2 Q-36 -20 -14 -24 Q-10 -44 8 -40 Q26 -44 28 -22 Q40 -14 30 2 Z', ol('#FF9FC4', 4)) + S.circle(4, -46, 9, ol('#E8453C', 3.5));
}
// the hero's gaming PC: big monitor on a stand + an RGB tower to the right + a keyboard. Anchor = bottom centre of the monitor
// stand on the desk. screen 660 x 372. tower: true (default), keyboard: true, t (RGB colour cycle), glow 0..1, off 0..1
function gamingPC(...args) {
  const o = A(args, ['x', 'y', 's', 'rot'], { screen: null, glow: 0, t: 0, tower: true, keyboard: true, off: 0 });
  const [sw, sh] = DEVICE_SCREENS.gamingPC;
  const rgb = ['#FF3B6B', '#FF8A1F', '#FFE14D', '#3BD16F', '#3DF2FF', '#7A5CFF', '#FF4FD8'];
  const rc = (k) => rgb[Math.floor(((o.t * 2 + k) % rgb.length + rgb.length) % rgb.length)];
  let g = '';
  if (o.tower) {
    g += S.path(poly([[400, -470], [600, -470], [600, 0], [400, 0]], 16), ol('#1B1D26', 8));
    g += S.rect(420, -450, 120, 430, 10, { fill: '#2A2E3A', stroke: rc(0), 'stroke-width': 6 });
    for (let i = 0; i < 3; i++) { const cy = -380 + i * 130; g += S.circle(480, cy, 46, { fill: 'none', stroke: rc(i + 1), 'stroke-width': 8 }) + S.path(`M${480 - 30} ${cy} L${480 + 30} ${cy} M480 ${cy - 30} L480 ${cy + 30}`, ln(6, '#454A58')); }
    g += S.rect(560, -440, 22, 120, 6, { fill: rc(3) }) + S.circle(570, -40, 10, { fill: rc(5) });
  }
  g += S.path(poly([[-60, -40], [60, -40], [110, 0], [-110, 0]], 10), ol('#2A2E3A', 7)) + S.rect(-24, -140, 48, 104, 6, ol('#2A2E3A', 6));
  g += S.path(poly([[-360, -560], [360, -560], [360, -130], [-360, -130]], 20), ol('#1B1D26', 8));
  g += screenBox(-sw / 2, -540, sw, sh, 8, o.screen, { idle: o.screen ? '' : gameIdle(sw, sh), off: o.off });
  g += S.rect(-360, -148, 720, 12, 4, { fill: rc(2), opacity: 0.9 });
  if (o.keyboard) {
    g += S.path(poly([[-300, 10], [300, 10], [320, 60], [-320, 60]], 12), ol('#1B1D26', 7));
    let keys = '';
    for (let r = 0; r < 3; r++) for (let i = 0; i < 14; i++) keys += `M${f(-280 + i * 40 + r * 4)} ${22 + r * 12} h30 `;
    g += S.path(keys, ln(7, '#3A3F4E')) + S.path('M-290 54 L290 54', ln(4, rc(4)));
  }
  g += spill(-sw / 2, -540, sw, sh, '#9FD8FF', o.glow);
  return place(o, g);
}

// ====================================================================== BREAKFAST
// Mom's coffee mug. Anchor = centre of the mug body (handle right) · 150 × 130. steam 0..1 (needs t), col, text (default: a cupcake)
function coffeeMug(...args) {
  const o = A(args, ['x', 'y', 's', 'rot'], { steam: 1, t: 0, col: '#F27C6B', text: null, empty: false });
  let g = steam(-6, -78, o.t, o.steam, 3, 150);
  g += band('M58 -36 Q104 -36 100 6 Q96 40 54 36', 16, o.col, 8);
  g += clipped(poly([[-62, -62], [62, -62], [56, 62], [-56, 62]], 14), o.col, S.rect(30, -70, 40, 140, 0, { fill: '#000', opacity: 0.12 }) + (o.text ? T(esc(o.text), 0, 18, 38, '#FFFFFF', { stroke: LINE, 'stroke-width': 5, 'paint-order': 'stroke' }) : S.g(cupcakeIcon(), 'translate(-2 14) scale(0.8)')), 6);
  g += S.ellipse(0, -62, 62, 14, ol(shade(o.col, 0.8), 6)) + (o.empty ? '' : S.ellipse(0, -60, 50, 9, { fill: 'url(#exCoffee)' }));
  return place(o, g);
}
// a frying pan (Mom juggling). Anchor = the handle grip; the pan is to the left (−x). egg: true
function fryingPan(...args) {
  const o = A(args, ['x', 'y', 's', 'rot'], { egg: true });
  let g = band('M0 0 L-150 -6', 22, '#3A2A22', 7);
  g += S.ellipse(-280, -8, 140, 44, ol('#2A2E3A', 7)) + S.ellipse(-280, -16, 116, 30, { fill: '#454A58' });
  if (o.egg) g += S.path('M-330 -22 Q-340 -46 -300 -44 Q-280 -60 -250 -42 Q-220 -34 -240 -18 Q-280 -6 -330 -22 Z', ol('#FFFFFF', 4)) + S.ellipse(-288, -32, 18, 10, ol('#FFC21F', 3.5));
  return place(o, g);
}
// the toaster. Anchor = bottom centre on the counter · 300 × 220. pop 0..1 (toast jumps out of the slots), burn 0..1 (the toast
// goes golden -> black, red glow in the slots, smoke with t), lever down while pop < 0.05
function toaster(...args) {
  const o = A(args, ['x', 'y', 's', 'rot'], { pop: 0, burn: 0, t: 0, col: '#C9CED8' });
  const p = clamp(o.pop, 0, 1);
  let g = '';
  const lift = p < 0.5 ? S.ease.out(p / 0.5) * 300 : 300 - S.ease.inOut((p - 0.5) / 0.5) * 170;
  for (const x of [-60, 60]) g += toastBody(x, -170 - lift, o.burn, 1, x > 0 ? 6 + p * 10 : -4 - p * 8);
  g += clipped(S.roundedPath([[-150, -230], [150, -230], [160, 0], [-160, 0]], 50), o.col, S.rect(-170, -230, 70, 240, 0, { fill: '#FFFFFF', opacity: 0.35 }) + S.rect(90, -230, 80, 240, 0, { fill: '#000', opacity: 0.1 }) + S.rect(-170, -50, 340, 50, 0, { fill: '#000', opacity: 0.08 }), 7);
  for (const x of [-60, 60]) g += S.rect(x - 44, -236, 88, 22, 10, ol('#2A2E3A', 5)) + (o.burn > 0.3 ? S.rect(x - 34, -232, 68, 10, 5, { fill: '#FF5A2A', opacity: f(o.burn) }) : '');
  const lv = p < 0.05 ? -70 : -170;
  g += S.rect(150, lv - 14, 44, 28, 8, ol('#2A2E3A', 5)) + S.rect(150, -190, 10, 140, 4, { fill: '#2A2E3A' });
  g += S.circle(-90, -100, 18, ol('#E8453C', 4)) + S.path('M-90 -100 L-82 -110', ln(4, '#FFFFFF'));
  g += S.rect(-150, -6, 300, 14, 6, ol('#2A2E3A', 5));
  if (o.burn > 0.5) g += smoke(60, -270 - lift, o.t, (o.burn - 0.5) * 2);
  return place(o, g);
}
function toastBody(x, y, burnt, s = 1, rot = 0) {
  const b = clamp(burnt, 0, 1);
  const crust = b < 0.5 ? lerpHex('#C98A3A', '#5A3418', b * 2) : lerpHex('#5A3418', '#1E1A1A', (b - 0.5) * 2);
  const crumb = b < 0.5 ? lerpHex('#F2C98A', '#A86A2A', b * 2) : lerpHex('#A86A2A', '#2A2422', (b - 0.5) * 2);
  const d = 'M-62 70 L-62 -40 Q-80 -60 -66 -84 Q-40 -112 0 -100 Q40 -112 66 -84 Q80 -60 62 -40 L62 70 Z';
  let g = S.path(d, ol(crust, 6)) + S.path('M-46 60 L-46 -40 Q-60 -54 -50 -70 Q-30 -92 0 -82 Q30 -92 50 -70 Q60 -54 46 -40 L46 60 Z', { fill: crumb });
  if (b > 0.85) g += S.path('M-30 -40 l20 30 l-10 20 M20 -50 l-10 40 l20 30', ln(4, '#000', 0.6));
  return S.g(g, `translate(${f(x)} ${f(y)}) rotate(${f(rot)}) scale(${f(s)})`);
}
function lerpHex(a, b, k) { return '#' + [1, 3, 5].map((i) => Math.round(parseInt(a.slice(i, i + 2), 16) * (1 - k) + parseInt(b.slice(i, i + 2), 16) * k).toString(16).padStart(2, '0')).join(''); }
// a slice of toast. Anchor = centre · 140 × 180. burnt 0..1 (golden -> charcoal, smoke with t)
function toast(...args) {
  const o = A(args, ['x', 'y', 's', 'rot'], { burnt: 0, t: 0, smoke: true });
  return place(o, toastBody(0, 0, o.burnt) + (o.smoke && o.burnt > 0.6 ? smoke(0, -90, o.t, (o.burnt - 0.6) * 2.5) : ''));
}
// a cereal bowl. Anchor = bottom centre · 340 wide. splash 0..1 (milk crown + flying cereal rings, e.g. Max jumping in), t, col
function cerealBowl(...args) {
  const o = A(args, ['x', 'y', 's', 'rot'], { splash: 0, t: 0, col: '#4FA8E8' });
  const k = clamp(o.splash, 0, 1);
  let g = '';
  if (k > 0) {
    const crown = [];
    for (let i = 0; i <= 10; i++) { const u = i / 10, x = -170 + u * 340, h = (60 + 140 * Math.abs(Math.sin(i * 1.7))) * Math.sin(Math.min(1, k * 1.3) * Math.PI * 0.9); crown.push([x, -150 - h]); }
    g += S.path(`M-170 -150 ${crown.map((p, i) => (i % 2 ? `Q${f(p[0])} ${f(p[1] - 30)} ` : `${f(p[0])} ${f(p[1])} `)).join('')}L170 -150 Z`.replace(/Q([^ ]+) ([^ ]+) ([^ ]+) ([^ ]+) /g, 'Q$1 $2 $3 $4 '), ol('#FFFFFF', 6));
    let rings = '';
    for (let i = 0; i < 9; i++) { const a = -Math.PI * (0.15 + 0.7 * hash(i)), r = 120 + 360 * k * (0.5 + hash(i + 9)); const x = Math.cos(a) * r * 0.9, y = -150 + Math.sin(a) * r + 300 * k * k * 0.6; rings += S.g(S.circle(0, 0, 16, ol(['#FFC93C', '#FF7A4D', '#B65CFF', '#5DBB4A'][i % 4], 5)) + S.circle(0, 0, 6, { fill: '#FFFFFF' }), `translate(${f(x)} ${f(y)})`); }
    g += rings;
    for (let i = 0; i < 6; i++) { const a = -Math.PI * (0.1 + 0.8 * hash(i + 3)), r = 200 + 260 * k; g += S.circle(Math.cos(a) * r, -150 + Math.sin(a) * r * 0.8 + 200 * k * k, 10 + 8 * hash(i), ol('#FFFFFF', 4)); }
  }
  g += S.ellipse(0, -150, 170, 34, ol('#FFFFFF', 6));
  for (let i = 0; i < 8; i++) g += S.circle(-110 + i * 32, -156 + (i % 2) * 8, 13, ol(['#FFC93C', '#FF7A4D', '#B65CFF', '#5DBB4A'][i % 4], 4));
  g += clipped('M-172 -150 Q-160 -20 -60 0 L60 0 Q160 -20 172 -150 Q0 -110 -172 -150 Z', o.col, S.path('M-150 -110 Q0 -80 150 -110', ln(8, '#FFFFFF', 0.5)) + S.path(`M-120 -70 h2 M-60 -60 h2 M0 -58 h2 M60 -60 h2 M120 -70 h2`, ln(12, '#FFFFFF', 0.8)), 6);
  return place(o, g);
}
// a stack of pancakes on a plate. Anchor = bottom centre · 320 wide. n (default 4), messy 0..1 (lopsided, one burnt, syrup flood,
// a pat of butter sliding off), syrup 0..1
function pancakes(...args) {
  const o = A(args, ['x', 'y', 's', 'rot'], { n: 4, messy: 0, syrup: 1 });
  const m = clamp(o.messy, 0, 1);
  let g = S.ellipse(0, -10, 180, 34, ol('#FFFFFF', 6)) + S.ellipse(0, -16, 140, 20, { fill: '#E8ECF4' });
  for (let i = 0; i < o.n; i++) {
    const y = -30 - i * 34, dx = m * (hash(i + 1) - 0.5) * 70, rot = m * (hash(i + 4) - 0.5) * 18;
    const col = m > 0.4 && i === 1 ? '#6A3A1A' : '#E8A44A';
    g += S.g(S.ellipse(0, 0, 118 - m * 20 * hash(i), 26, ol(col, 6)) + S.path('M-100 4 Q0 22 100 4', ln(5, shade(col, 0.8))), `translate(${f(dx)} ${f(y)}) rotate(${f(rot)})`);
  }
  const top = -30 - (o.n - 1) * 34 - 18;
  if (o.syrup > 0) g += S.path(`M-70 ${top} Q0 ${top - 20} 70 ${top} L74 ${top + 40 + 60 * m} Q68 ${top + 60 + 60 * m} 62 ${top + 40 + 60 * m} L56 ${top + 14} L-20 ${top + 16} L-26 ${top + 70 + 40 * m} Q-34 ${top + 86 + 40 * m} -40 ${top + 70 + 40 * m} L-46 ${top + 12} Q-80 ${top + 8} -70 ${top} Z`, ol('#B8661E', 5));
  g += S.g(S.rect(-24, -18, 48, 30, 6, ol('#FFE58A', 5)), `translate(${f(10 + m * 60)} ${f(top - 10 + m * 10)}) rotate(${f(m * 24)})`);
  return place(o, g);
}

// ====================================================================== BEDROOM
// the alarm clock (the ENEMY). Anchor = bottom centre · 220 × 260. ring 0..1 (shakes + rings with t), time '7:00'
function alarmClock(...args) {
  const o = A(args, ['x', 'y', 's', 'rot'], { ring: 0, t: 0, time: '7:00', col: '#E8453C' });
  const r = clamp(o.ring, 0, 1);
  const sh = r * Math.sin(o.t * 60) * 7;
  let g = '';
  g += S.path('M-60 -20 L-90 0 M60 -20 L90 0', ln(16)) + S.path('M-60 -20 L-90 0 M60 -20 L90 0', ln(8, '#2A2E3A'));
  for (const sx of [-1, 1]) g += S.g(S.path('M-44 0 A44 44 0 0 1 44 0 Z', ol('#FFC93C', 6)), `translate(${sx * 66} -228) rotate(${f(sx * 30 + sh * 2)})`);
  g += S.rect(-8, -270, 16, 40, 5, ol('#2A2E3A', 5)) + S.path(`M0 -262 L${f(Math.sin(o.t * 70) * 40 * r)} -276`, ln(8, '#2A2E3A'));
  g += S.circle(0, -120, 110, ol(o.col, 8)) + S.circle(0, -120, 86, ol('#FFFFFF', 5));
  for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; g += S.path(`M${f(Math.cos(a) * 70)} ${f(-120 + Math.sin(a) * 70)} L${f(Math.cos(a) * 78)} ${f(-120 + Math.sin(a) * 78)}`, ln(i % 3 ? 4 : 7)); }
  g += S.path('M0 -120 L0 -176 M0 -120 L36 -110', ln(9)) + S.circle(0, -120, 8, { fill: LINE });
  // angry little face on the clock (it IS the enemy)
  g += S.path('M-40 -76 l22 8 M40 -76 l-22 8', ln(6)) ;
  if (r > 0.05) {
    let d = '';
    for (const sx of [-1, 1]) for (let i = 0; i < 3; i++) { const rr = 140 + i * 30; d += `M${f(sx * rr * 0.8)} ${f(-120 - rr * 0.5)} Q${f(sx * rr)} -120 ${f(sx * rr * 0.8)} ${f(-120 + rr * 0.5)} `; }
    g += S.path(d, { ...ln(8, '#151515'), opacity: f(r * (0.6 + 0.4 * Math.abs(Math.sin(o.t * 20)))) });
  }
  return place(o, S.g(g, `translate(${f(sh)} 0) rotate(${f(sh * 0.6)} 0 -120)`));
}
// a smelly sock. Anchor = centre · 260 long. smell 0..1 (green stink lines with t), col
function sock(...args) {
  const o = A(args, ['x', 'y', 's', 'rot'], { smell: 1, t: 0, col: '#FFFFFF', stripe: '#E8453C' });
  let g = clipped('M-60 -120 L40 -120 L40 30 Q40 90 100 96 Q150 100 150 130 Q150 160 100 160 L-20 160 Q-70 160 -66 100 Z', o.col,
    S.rect(-80, -120, 140, 26, 0, { fill: o.stripe }) + S.rect(-80, -82, 140, 14, 0, { fill: o.stripe }) + S.ellipse(110, 130, 40, 30, { fill: '#C9B48A', opacity: 0.6 }) + S.ellipse(-30, 130, 30, 24, { fill: '#C9B48A', opacity: 0.6 }) + S.circle(40, 40, 8, { fill: '#C9B48A', opacity: 0.7 }), 6);
  if (o.smell > 0) {
    let d = '';
    for (let i = 0; i < 3; i++) { const x = -40 + i * 60, w = Math.sin(o.t * 4 + i) * 10; d += `M${x} -140 q${f(20 + w)} -30 0 -60 q${f(-20 - w)} -30 0 -60 `; }
    g += S.path(d, { ...ln(10, '#7FCF3A'), opacity: f(0.85 * o.smell) });
  }
  return place(o, S.g(g, 'translate(-40 -20)'));
}

// ====================================================================== SCHOOL
// a sandwich half (turkey, cheese, tomato, lettuce) — the classic wedge seen from the cut side. Anchor = centre · 240 × 190.
// bite 0..1 (bites out of the right corner), ketchup: true (dripping — Tank's dad's lunch)
function sandwich(...args) {
  const o = A(args, ['x', 'y', 's', 'rot'], { bite: 0, ketchup: false });
  // top of the wedge (the bread slice seen from above) + the cut face with the layers
  let g = S.path('M-116 -20 L116 -20 L52 -116 Q40 -128 26 -118 Z', ol('#F6D08A', 6)) + S.path('M-92 -28 L94 -28 L46 -100 Z', { fill: '#FFE6B0' });
  const face = S.roundedPath([[-120, -22], [120, -22], [120, 72], [-120, 72]], 14);
  let inner = S.rect(-130, -26, 260, 28, 0, { fill: '#FFE6B0' }) + S.path('M-130 -22 L130 -22', ln(10, '#E0A85A'));
  inner += S.path('M-130 2 Q-114 -8 -98 4 Q-82 -8 -66 4 Q-50 -8 -34 4 Q-18 -8 -2 4 Q14 -8 30 4 Q46 -8 62 4 Q78 -8 94 4 Q110 -8 130 2 L130 16 L-130 16 Z', { fill: '#7FBF4A' });
  inner += S.rect(-130, 16, 260, 12, 0, { fill: '#E8453C' }) + S.rect(-130, 28, 260, 10, 0, { fill: '#FFD84A' }) + S.rect(-130, 38, 260, 12, 0, { fill: '#F2A0A0' });
  inner += S.rect(-130, 50, 260, 30, 0, { fill: '#FFE6B0' }) + S.path('M-130 70 L130 70', ln(10, '#E0A85A'));
  g += clipped(face, '#FFE6B0', inner, 6) + S.path('M-120 2 L120 2 M-120 50 L120 50', ln(3.5, LINE, 0.5));
  g += S.path('M70 28 L80 54 L92 28 Z', ol('#FFD84A', 4));
  if (o.ketchup) g += S.path('M-118 12 L118 12 L118 26 Q112 62 104 62 Q96 60 96 28 L24 28 Q20 80 10 80 Q0 80 -2 28 L-68 28 Q-72 54 -82 54 Q-92 54 -94 28 L-118 28 Z', ol('#D8261E', 4)) + S.path('M-60 -60 Q-20 -76 30 -64 Q10 -50 -20 -48 Z', ol('#D8261E', 4));
  if (o.bite > 0) {
    // a scalloped bite edge eating into the right end
    const id = cid('bt');
    const xe = 130 - 90 * clamp(o.bite, 0, 1);
    let d = `M-200 -170 L${f(xe + 40)} -170`;
    for (let i = 0; i < 4; i++) { const y0 = -170 + i * 85; d += ` L${f(xe + (i % 2) * 14)} ${f(y0 + 8)} A44 44 0 0 0 ${f(xe + ((i + 1) % 2) * 14)} ${f(y0 + 85)}`; }
    d += ` L${f(xe + 40)} 170 L-200 170 Z`;
    g = S.clipDef(id, S.path(d)) + S.g(g, null, { 'clip-path': `url(#${id})` });
  }
  return place(o, g);
}
// a brown-paper lunch bag. Anchor = the folded top (grip); hangs down 230. name (written on it), crumple 0..1, open: true (top unfolded)
function lunchBag(...args) {
  const o = A(args, ['x', 'y', 's', 'rot'], { name: '', crumple: 0, open: false });
  let g = clipped(poly([[-70, 0], [70, 0], [84, 230], [-84, 230]], 10), '#C9A26A', S.path('M-40 40 L-50 220 M40 40 L52 220', ln(4, '#A8824A')) + S.rect(-90, 200, 180, 40, 0, { fill: '#000', opacity: 0.08 }), 6);
  if (!o.open) g += S.path(poly([[-72, -40], [72, -40], [72, 20], [-72, 20]], 6), ol('#B8925A', 6)) + S.path('M-72 -10 L72 -10', ln(4, '#8A6A3A'));
  else g += S.path('M-70 0 L-60 -40 L-20 -20 L10 -46 L40 -18 L70 -40 L70 0 Z', ol('#B8925A', 5));
  if (o.name) g += TF(esc(o.name), 0, 130, 40, '#3A5AA8', { transform: 'rotate(-6 0 130)' });
  else g += S.path(F.heartPath(0, 120, 22), ol('#E8453C', 4));
  return place(o, g);
}
// a cafeteria tray. Anchor = centre · 440 × 280 (seen from a high 3/4 view). food: 'pizza'|'broccoli'|'mystery'|'soup'|'ketchup'|
// array of up to 4 of those ['pizza','broccoli','mystery','milk'] for the compartments
function lunchTray(...args) {
  const o = A(args, ['x', 'y', 's', 'rot'], { food: ['pizza', 'broccoli', 'mystery', 'milk'], t: 0 });
  const food = Array.isArray(o.food) ? o.food : [o.food];
  let g = S.path(poly([[-220, -130], [220, -130], [240, 130], [-240, 130]], 30), ol('#8FB8D8', 7)) + S.path(poly([[-200, -112], [200, -112], [216, 112], [-216, 112]], 22), { fill: '#A8CCE8' });
  const slots = [[-110, -50, 170, 110], [90, -50, 180, 110], [-110, 64, 170, 80], [90, 64, 180, 80]];
  for (const [x, y, w, h] of slots) g += S.path(poly([[x - w / 2, y - h / 2], [x + w / 2, y - h / 2], [x + w / 2, y + h / 2], [x - w / 2, y + h / 2]], 16), { fill: '#7FA8C8', stroke: '#5A88A8', 'stroke-width': 4 });
  food.slice(0, 4).forEach((k, i) => { const [x, y] = slots[i]; g += foodItem(k, x, y, o.t); });
  return place(o, g);
}
function foodItem(k, x, y, t = 0) {
  switch (k) {
    case 'pizza': return S.g(S.path('M-60 -36 L60 -36 L0 44 Z', ol('#FFC93C', 5)) + S.path('M-64 -40 L64 -40', ln(16, '#C98A3A')) + S.circle(-20, -16, 10, ol('#E8453C', 3)) + S.circle(16, -10, 9, ol('#E8453C', 3)) + S.circle(0, 14, 8, ol('#E8453C', 3)), `translate(${x} ${y})`);
    case 'broccoli': return S.g(S.rect(-8, 0, 16, 34, 4, ol('#7FBF4A', 4)) + puffs([[-20, -8, 20], [0, -22, 22], [22, -8, 20], [0, 4, 16]], '#3E9A3E', 5) + S.g(S.rect(40, 4, 14, 30, 4, ol('#7FBF4A', 4)) + puffs([[34, -2, 16], [50, -14, 18], [66, -2, 16]], '#3E9A3E', 5), 'translate(-6 4)'), `translate(${x - 20} ${y})`);
    case 'mystery': return S.g(S.path('M-60 10 Q-64 -30 -20 -34 Q0 -50 30 -34 Q66 -30 60 10 Q40 30 0 26 Q-40 30 -60 10 Z', ol('#8A7A5A', 5)) + S.circle(-20, -8, 8, { fill: '#6A9A3A' }) + S.circle(24, -14, 6, { fill: '#B85A8A' }) + S.path('M-10 4 q10 -10 20 0', ln(4, '#5A4A3A')) + S.path(`M-30 -40 q6 ${f(-14 - 4 * Math.sin(t * 3))} 0 -28 M10 -44 q6 -14 0 -28`, ln(6, '#9AB86A', 0.8)), `translate(${x} ${y})`);
    case 'soup': return S.g(S.ellipse(0, 0, 66, 34, ol('#FFFFFF', 5)) + S.ellipse(0, -4, 52, 22, { fill: '#E8A44A' }) + S.circle(-14, -6, 6, { fill: '#5DBB4A' }) + S.circle(14, 0, 5, { fill: '#E8453C' }), `translate(${x} ${y})`);
    case 'milk': return S.g(S.path('M-26 34 L-26 -20 L0 -40 L26 -20 L26 34 Z', ol('#FFFFFF', 5)) + S.rect(-26, -6, 52, 22, 0, { fill: '#4FA8E8' }) + TF('MILK', 0, 12, 14, '#FFFFFF'), `translate(${x} ${y - 10})`);
    case 'ketchup': return ketchupBottle({ x, y: y + 30, s: 0.4 });
    default: return '';
  }
}
// a ketchup bottle. Anchor = bottom centre · 120 × 300. squeeze 0..1 (a ketchup jet from the nozzle)
function ketchupBottle(...args) {
  const o = A(args, ['x', 'y', 's', 'rot'], { squeeze: 0 });
  let g = clipped('M-56 0 L-60 -200 Q-60 -240 -20 -250 L20 -250 Q60 -240 60 -200 L56 0 Z', '#D8261E', S.rect(-70, -170, 140, 90, 0, { fill: '#FFFFFF' }) + S.rect(-40, -260, 24, 260, 0, { fill: '#FFFFFF', opacity: 0.25 }), 6);
  g += TF('KETCHUP', 0, -116, 22, '#D8261E') + S.path('M-36 -150 Q0 -170 36 -150', ln(4, '#5DBB4A'));
  g += S.path('M-24 -250 L-16 -296 L16 -296 L24 -250 Z', ol('#FFFFFF', 5)) + S.path('M-6 -296 L-4 -320 L4 -320 L6 -296 Z', ol('#D8261E', 4));
  if (o.squeeze > 0) g += S.path(`M0 -322 Q${f(30 * o.squeeze)} ${f(-420 * o.squeeze)} ${f(120 * o.squeeze)} ${f(-380 * o.squeeze)}`, ln(16, '#D8261E'));
  return place(o, g);
}
// the pop quiz. Anchor = centre · 300 × 400 (portrait sheet). grade: null | 'A+' | 'F' | any short text (red, top right), title
function quizPaper(...args) {
  const o = A(args, ['x', 'y', 's', 'rot'], { grade: null, title: 'POP QUIZ', lines: 9, name: '' });
  let g = S.path(poly([[-150, -200], [150, -200], [150, 200], [-150, 200]], 8), ol('#FFFFFF', 6));
  g += S.path('M-110 -200 L-110 200', ln(3, '#FF9F9F'));
  g += T(esc(o.title), 0, -150, 40, '#2A3A6A');
  if (o.name) g += TF(esc(o.name), -40, -110, 22, '#3A5AA8', { 'text-anchor': 'start' });
  let d = '';
  for (let i = 0; i < o.lines; i++) { const y = -90 + i * 32; d += `M-96 ${y} L${f(40 + 80 * hash(i))} ${y} `; }
  g += S.path(d, ln(5, '#9AA4C0'));
  for (let i = 0; i < 4; i++) g += TF(`${i + 1}.`, -126, -84 + i * 64, 16, '#2A3A6A');
  if (o.grade) g += S.g(S.circle(0, 0, 50, { fill: 'none', stroke: '#E8231E', 'stroke-width': 7 }) + T(esc(o.grade), 0, 18, o.grade.length > 2 ? 34 : 50, '#E8231E'), 'translate(96 -150) rotate(-10)');
  return place(o, g);
}
// a stack of school books. Anchor = bottom centre · 260 wide. n (default 4), fall 0..1 (books fly apart / tumble)
function bookStack(...args) {
  const o = A(args, ['x', 'y', 's', 'rot'], { n: 4, fall: 0, t: 0 });
  const cols = ['#E8453C', '#3B82F6', '#FFC93C', '#5DBB4A', '#B65CFF', '#FF8A3D'];
  let g = '';
  for (let i = 0; i < o.n; i++) {
    const k = clamp(o.fall, 0, 1);
    const w = 240 - (i % 3) * 20, h = 46;
    const dx = (hash(i + 1) - 0.5) * 30 + k * (hash(i + 7) - 0.5) * 600, dy = -i * h - h / 2 - k * Math.sin(k * Math.PI) * (100 + 160 * hash(i)) + k * i * h;
    const rot = (hash(i + 2) - 0.5) * 8 + k * (hash(i + 5) - 0.5) * 300;
    const c = cols[i % cols.length];
    g += S.g(S.rect(-w / 2, -h / 2, w, h, 8, ol(c, 6)) + S.rect(-w / 2 + 14, -h / 2 + 6, w - 22, h - 14, 4, { fill: '#FFF8EE' }) + S.rect(-w / 2, -h / 2, 26, h, 6, ol(shade(c, 0.8), 5)), `translate(${f(dx)} ${f(dy)}) rotate(${f(rot)})`);
  }
  return place(o, g);
}
// Mrs. Krump's pointer stick. Anchor = the grip; points along −y (up) at rot 0 · 560 long; tip: rubber tip colour
function pointer(...args) {
  const o = A(args, ['x', 'y', 's', 'rot'], { len: 560, tip: '#E8453C' });
  return place(o, band(`M0 40 L0 ${-o.len}`, 14, '#C98A4A', 7) + S.path(`M-3 30 L-2 ${-o.len + 20}`, ln(4, '#E8B878')) + S.rect(-11, -o.len - 30, 22, 36, 8, ol(o.tip, 5)) + S.rect(-12, 20, 24, 50, 8, ol('#5A3A22', 5)));
}
// a fanned stack of papers (marking). Anchor = centre · 300 × 220
function paperStack(...args) {
  const o = A(args, ['x', 'y', 's', 'rot'], { n: 3, grade: 'F' });
  let g = '';
  for (let i = o.n - 1; i >= 0; i--) g += S.g(S.path(poly([[-140, -100], [140, -100], [140, 100], [-140, 100]], 6), ol('#FFFFFF', 5)) + S.path('M-110 -60 L80 -60 M-110 -26 L100 -26 M-110 8 L60 8 M-110 42 L90 42', ln(5, '#9AA4C0')), `translate(${i * 14} ${-i * 10}) rotate(${(i - 1) * 6})`);
  if (o.grade) g += S.g(T(esc(o.grade), 0, 0, 70, '#E8231E') + S.circle(0, -22, 44, { fill: 'none', stroke: '#E8231E', 'stroke-width': 6 }), 'translate(80 -30) rotate(-12)');
  return place(o, g);
}
// the red pen. Anchor = centre · 190 long along x
function redPen(...args) {
  const o = A(args, ['x', 'y', 's', 'rot'], {});
  return place(o, S.g(S.rect(-12, -70, 24, 140, 9, ol('#E23A3A', 5)) + S.rect(-12, -70, 24, 44, 9, ol('#B82626', 5)) + S.path('M-10 70 L0 96 L10 70 Z', ol('#F4E6D8', 4)), 'rotate(90)'));
}

// ====================================================================== QUESTS / TOWN
// grocery bags. Anchor = the handles (grip); the bag hangs down ≈ 300. n 1 | 2 (side by side), spill 0..1 (apples rolling out)
function groceryBags(...args) {
  const o = A(args, ['x', 'y', 's', 'rot'], { n: 1, spill: 0 });
  const bag = (dx, flip) => {
    let g = '';
    g += S.path(`M${dx - 60} 60 Q${dx - 40} -20 ${dx} -10 Q${dx + 40} -20 ${dx + 60} 60`, ln(12)) + S.path(`M${dx - 60} 60 Q${dx - 40} -20 ${dx} -10 Q${dx + 40} -20 ${dx + 60} 60`, ln(6, '#E8DCC0'));
    // contents: a baguette, a leek, apples
    g += S.g(S.rect(-20, -150, 40, 190, 18, ol('#E8B868', 5)) + S.path('M-12 -120 l20 -10 M-12 -80 l20 -10 M-12 -40 l20 -10', ln(4, '#C98A3A')), `translate(${dx - 40 * flip} 100) rotate(${-14 * flip})`);
    g += S.g(S.rect(-12, -110, 24, 150, 8, ol('#E8F4D8', 4)) + S.path('M-12 -110 Q-30 -170 -10 -200 M0 -110 Q0 -180 20 -210 M12 -110 Q30 -160 40 -180', ln(10, '#3E9A3E')), `translate(${dx + 36 * flip} 110) rotate(${12 * flip})`);
    g += clipped(poly([[dx - 90, 60], [dx + 90, 60], [dx + 100, 310], [dx - 100, 310]], 10), '#C9A26A', S.path(`M${dx - 60} 90 L${dx - 66} 300 M${dx + 60} 90 L${dx + 68} 300`, ln(4, '#A8824A')) + S.rect(dx - 110, 280, 220, 40, 0, { fill: '#000', opacity: 0.08 }), 6);
    g += S.circle(dx - 10, 60, 30, ol('#E8453C', 5)) + S.path(`M${dx - 10} 32 q4 -12 12 -14`, ln(4, '#5A3A22'));
    return g;
  };
  let g = o.n > 1 ? bag(-110, -1) + bag(110, 1) : bag(0, 1);
  if (o.spill > 0) for (let i = 0; i < 3; i++) g += S.circle(60 + i * 70 * o.spill, 300 - 20 * Math.abs(Math.sin(o.spill * 6 + i)), 26, ol(i % 2 ? '#7FBF4A' : '#E8453C', 5));
  return place(o, g);
}
// a ball. Anchor = centre · r 60. kind 'dodge' (red rubber, default) | 'soccer' | 'beach'; spin (deg)
function ball(...args) {
  const o = A(args, ['x', 'y', 's', 'rot'], { kind: 'dodge', r: 60, spin: 0 });
  const r = o.r;
  let g = '';
  if (o.kind === 'soccer') {
    g += S.circle(0, 0, r, ol('#FFFFFF', 6)) + S.g(S.path(F.starPath(0, 0, r * 0.32, r * 0.3, 5), { fill: LINE }) + S.path(`M0 ${-r * 0.3} L0 ${-r} M${r * 0.28} ${-r * 0.1} L${r * 0.95} ${-r * 0.3} M${-r * 0.28} ${-r * 0.1} L${-r * 0.95} ${-r * 0.3} M${r * 0.18} ${r * 0.25} L${r * 0.6} ${r * 0.8} M${-r * 0.18} ${r * 0.25} L${-r * 0.6} ${r * 0.8}`, ln(4)), `rotate(${o.spin})`);
  } else if (o.kind === 'beach') {
    const cols = ['#E8453C', '#FFFFFF', '#3B82F6', '#FFFFFF', '#FFC93C', '#FFFFFF'];
    let s2 = '';
    for (let i = 0; i < 6; i++) { const a0 = (i / 6) * Math.PI * 2, a1 = ((i + 1) / 6) * Math.PI * 2; s2 += S.path(`M0 0 L${f(Math.cos(a0) * r)} ${f(Math.sin(a0) * r)} A${r} ${r} 0 0 1 ${f(Math.cos(a1) * r)} ${f(Math.sin(a1) * r)} Z`, { fill: cols[i] }); }
    g += S.g(s2, `rotate(${o.spin})`) + S.circle(0, 0, r, ol('none', 6)) + S.circle(0, 0, r * 0.16, ol('#FFFFFF', 4));
  } else {
    g += S.circle(0, 0, r, ol('#E8453C', 6)) + S.g(S.path(`M${-r} 0 Q0 ${r * 0.3} ${r} 0 M0 ${-r} Q${r * 0.3} 0 0 ${r}`, ln(4, '#B82626')), `rotate(${o.spin})`);
  }
  g += S.path(`M${f(-r * 0.55)} ${f(-r * 0.3)} Q${f(-r * 0.45)} ${f(-r * 0.6)} ${f(-r * 0.15)} ${f(-r * 0.7)}`, ln(r * 0.14, '#FFFFFF', 0.7));
  return place(o, g);
}
// a paper boat (Max's quest). Anchor = bottom centre · 260 wide. col
function paperBoat(...args) {
  const o = A(args, ['x', 'y', 's', 'rot'], { col: '#FFFFFF', t: 0 });
  const bob = Math.sin(o.t * 3) * 4;
  let g = S.path('M-130 -60 L130 -60 L90 0 L-90 0 Z', ol(o.col, 6)) + S.path('M-40 -60 L0 -170 L40 -60 Z', ol(shade(o.col, 0.92), 6)) + S.path('M0 -170 L0 -60', ln(4, '#C9CED8')) + S.path('M-110 -40 L110 -40', ln(4, '#C9CED8'));
  g += S.path(F.starPath(0, -100, 14, 6), { fill: '#FFC93C' });
  return place(o, S.g(g, `translate(0 ${f(bob)}) rotate(${f(bob * 0.6)})`));
}
// THE PILLOW FORT (Max's epic quest). Anchor = bottom centre on the floor; s = the hero's scale there. k 0..1 grows it: 0 = a few
// cushions on the floor, ~0.4 a waist-high wall with a door, 1 = four rows of cushions, two broom poles, a checkered blanket roof,
// a flag on top and a "MAX'S FORT" sign. Natural size at k 1: 1500 wide × 1700 tall body units (= 750 × 850 px at s .5);
// w / h (body units) override the k-1 width / height. t waves the flag.
function pillowFort(...args) {
  const o = A(args, ['x', 'y', 's', 'rot'], { k: 1, t: 0, w: 1500, h: 1700 });
  const k = clamp(o.k, 0, 1);
  const W = o.w, H = o.h;
  const cols = ['#FF9FC4', '#7FD3FF', '#FFE07A', '#B9E68A', '#C9A8FF', '#FFB37A', '#FFFFFF', '#8FE0D0'];
  const rowH = H * 0.11, rows = [5, 5, 4, 3];
  const appear = (a0, a1) => clamp((k - a0) / (a1 - a0), 0, 1);
  let g = '';
  // poles + blanket roof (behind the top rows' fronts)
  const roof = appear(0.7, 0.9);
  const poleTop = -H * 0.8;
  if (roof > 0) {
    const pt = lerp(-rowH * 3, poleTop, roof);
    g += band(`M${-W * 0.3} ${-rowH * 3.2} L${-W * 0.3} ${pt}`, 16, '#C98A4A', 7) + band(`M${W * 0.3} ${-rowH * 3.2} L${W * 0.3} ${pt}`, 16, '#C98A4A', 7);
    const sag = pt + H * 0.08;
    const drape = `M${-W * 0.5} ${-rowH * 3.4} Q${-W * 0.42} ${pt - 10} ${-W * 0.3} ${pt - 16} Q0 ${sag} ${W * 0.3} ${pt - 16} Q${W * 0.42} ${pt - 10} ${W * 0.5} ${-rowH * 3.4} Q${W * 0.3} ${-rowH * 3.0} 0 ${-rowH * 3.2} Q${-W * 0.3} ${-rowH * 3.0} ${-W * 0.5} ${-rowH * 3.4} Z`;
    let checks = '';
    for (let x = -W * 0.6; x < W * 0.6; x += 110) checks += `M${f(x)} ${f(pt - 60)} h55 V${f(-rowH * 2.6)} h-55 Z `;
    for (let y = pt; y < -rowH * 2.6; y += 110) checks += `M${f(-W * 0.6)} ${f(y)} H${f(W * 0.6)} v55 H${f(-W * 0.6)} Z `;
    g += clipped(drape, '#5A8AD8', S.path(checks, { fill: '#3E6CC0', opacity: 0.55 }) + S.path(`M${-W * 0.44} ${pt + 30} Q${-W * 0.2} ${sag + 10} 0 ${sag - 10}`, ln(18, '#FFFFFF', 0.35)), 7);
  }
  // cushions, row by row (bottom first), a door gap in the middle of the two bottom rows
  rows.forEach((n, r) => {
    const rw = W * (1 - r * 0.14), cw = rw / n;
    for (let i = 0; i < n; i++) {
      const x = -rw / 2 + cw * (i + 0.5);
      if (r < 2 && n % 2 === 1 && i === (n - 1) / 2) continue;
      const a = appear(r * 0.17 + i * 0.025, r * 0.17 + i * 0.025 + 0.12);
      if (a <= 0) continue;
      const drop = (1 - S.ease.outBack(a)) * -280;
      g += S.g(cushion(cw * 1.04, rowH * 1.12, cols[(r * 3 + i * 5) % cols.length]), `translate(${f(x)} ${f(-rowH * (r + 0.5) + drop)}) rotate(${f((hash(r * 9 + i) - 0.5) * 8)}) scale(${f(0.6 + 0.4 * a)})`);
    }
  });
  // the door (dark inside) + a lintel cushion lying across it
  const door = appear(0.05, 0.3);
  if (door > 0) {
    const dw = W / 5 * 0.82;
    g += S.path(`M${-dw / 2} 0 L${-dw / 2} ${-rowH * 1.7} Q0 ${-rowH * 2.2} ${dw / 2} ${-rowH * 1.7} L${dw / 2} 0 Z`, { fill: '#2A1E3A', opacity: f(0.9 * door) });
    const lt = appear(0.3, 0.42);
    if (lt > 0) g += S.g(cushion(dw * 1.5, rowH * 0.8, '#FFFFFF'), `translate(0 ${f(-rowH * 2 - (1 - lt) * 200)})`);
  }
  // the sign and the flag
  const sg = appear(0.45, 0.6);
  if (sg > 0) g += S.g(S.rect(-12, -30, 24, 190, 6, ol('#C98A4A', 5)) + S.path(poly([[-150, -150], [150, -140], [146, -20], [-146, -30]], 10), ol('#D8B07A', 6)) + T("MAX'S FORT", 0, -98, 46, '#E8453C', { stroke: LINE, 'stroke-width': 5, 'paint-order': 'stroke' }) + TF('NO GROWNUPS', 0, -48, 30, '#3A2A22'), `translate(${f(W * 0.42)} ${f(-130)}) rotate(${f(6 - (1 - sg) * 30)}) scale(${f(sg)})`);
  const fl = appear(0.88, 1);
  if (fl > 0) {
    const fy = poleTop - 260 * fl, px = W * 0.3;
    const wv = Math.sin(o.t * 5) * 14;
    g += band(`M${px} ${poleTop - 10} L${px} ${fy}`, 8, '#8A8F9B', 6);
    g += S.path(`M${px} ${fy} Q${px + 90} ${fy - 14 + wv} ${px + 180} ${fy + 12} L${px + 180} ${fy + 112} Q${px + 90} ${fy + 88 + wv} ${px} ${fy + 112} Z`, ol('#FFD23F', 6)) +
      S.path(`M${px + 50} ${fy + 84} L${px + 72} ${fy + 28} L${px + 94} ${fy + 64} L${px + 118} ${fy + 24} L${px + 136} ${fy + 84} Z`, ol('#5DBB4A', 4));
  }
  // at k ≈ 0: a few cushions lying on the floor
  if (k < 0.12) for (let i = 0; i < 3; i++) g += S.g(cushion(W * 0.2, rowH, cols[i]), `translate(${(i - 1) * W * 0.24} ${-rowH * 0.45}) rotate(${(i - 1) * 8})`);
  return place(o, g);
}
function cushion(w, h, col) {
  const a = w / 2, b = h / 2, bu = Math.min(16, h * 0.14);
  const d = `M${f(-a)} ${f(-b)} Q0 ${f(-b - bu)} ${f(a)} ${f(-b)} Q${f(a + bu)} 0 ${f(a)} ${f(b)} Q0 ${f(b + bu)} ${f(-a)} ${f(b)} Q${f(-a - bu)} 0 ${f(-a)} ${f(-b)} Z`;
  let o = S.path(d, ol(col, 7));
  o += S.path(`M${f(-a + 10)} ${f(b - 8)} Q0 ${f(b + bu - 12)} ${f(a - 10)} ${f(b - 8)} Q0 ${f(b - 22)} ${f(-a + 10)} ${f(b - 8)} Z`, { fill: shade(col, 0.84) });
  o += S.path(`M${f(-a * 0.62)} ${f(-b * 0.42)} Q${f(-a * 0.1)} ${f(-b * 0.62)} ${f(a * 0.4)} ${f(-b * 0.48)}`, ln(9, '#FFFFFF', 0.55));
  o += S.path(`M${f(-a)} ${f(-b)} l12 10 M${f(a)} ${f(-b)} l-12 10 M${f(a)} ${f(b)} l-12 -10 M${f(-a)} ${f(b)} l12 -10`, ln(5, shade(col, 0.7)));
  return o + S.circle(0, 0, 7, { fill: shade(col, 0.72) });
}
// Grandpa's wooden cane. Anchor = the grip (top of the crook); the shaft goes down (+y) len 520 (cast.draw.grandpa sizes it to the floor)
function woodCane(...args) {
  const o = A(args, ['x', 'y', 's', 'rot'], { len: 520, col: '#9A6A3E' });
  return place(o, band('M-46 -4 Q-52 -60 0 -64 Q44 -62 40 -12', 22, o.col, 8) + band(`M40 -12 L40 ${o.len}`, 22, o.col, 8) + S.path(`M34 0 L34 ${o.len - 20}`, ln(6, '#C9945E')) + S.rect(28, o.len - 8, 26, 22, 6, ol('#2A2E3A', 5)));
}
// a soup ladle (the lunch lady). Anchor = the grip; the bowl is down (+y) at rot 0 · 420 long
function ladle(...args) {
  const o = A(args, ['x', 'y', 's', 'rot'], { full: true });
  return place(o, band('M0 -20 L0 300', 12, '#C9CED8', 6) + S.path('M-70 300 Q-70 400 0 400 Q70 400 70 300 Z', ol('#C9CED8', 6)) + (o.full ? S.ellipse(0, 302, 64, 14, { fill: '#8A7A5A' }) : '') + S.rect(-10, -60, 20, 60, 8, ol('#3A3F4E', 5)));
}

// ====================================================================== SCIENCE FAIR / TOWN FAIR
// the potato battery: three potatoes on a board, nails + wires, a tiny bulb that barely glows. Anchor = bottom centre · 520 wide.
// glow 0..1 (0 = off, 0.3 = "it works! kind of", 1 = proud), t flickers it
function potatoBattery(...args) {
  const o = A(args, ['x', 'y', 's', 'rot'], { glow: 0.3, t: 0, sign: true });
  const gl = clamp(o.glow, 0, 1) * (0.85 + 0.15 * Math.sin(o.t * 13) * Math.sin(o.t * 7));
  let g = S.path(poly([[-260, -40], [260, -40], [270, 0], [-270, 0]], 10), ol('#C98A4A', 6)) + S.path('M-250 -22 L250 -22', ln(4, '#A86A2A'));
  const pot = (x, y, r) => S.path(`M${x - r} ${y} Q${x - r} ${y - r * 0.9} ${x} ${y - r * 0.85} Q${x + r * 1.1} ${y - r * 0.8} ${x + r} ${y} Q${x + r * 0.9} ${y + r * 0.5} ${x} ${y + r * 0.45} Q${x - r * 1.05} ${y + r * 0.5} ${x - r} ${y} Z`, ol('#C9A060', 6)) +
    S.circle(x - r * 0.4, y - r * 0.3, 5, { fill: '#8A6A3A' }) + S.circle(x + r * 0.3, y + r * 0.1, 4, { fill: '#8A6A3A' }) + S.circle(x + r * 0.5, y - r * 0.4, 4, { fill: '#8A6A3A' });
  const xs = [-170, -20, 130];
  for (const x of xs) g += pot(x, -100, 70);
  let wires = '';
  xs.forEach((x, i) => {
    g += S.rect(x - 40, -200, 10, 80, 3, ol('#D8823A', 3)) + S.rect(x + 30, -196, 10, 76, 3, ol('#AEB6C4', 3));
    if (i < 2) wires += `M${x + 35} -196 Q${x + 75} -260 ${xs[i + 1] - 35} -200 `;
  });
  wires += `M-205 -200 Q-260 -300 -240 -330 M165 -196 Q210 -300 200 -340`;
  g += S.path(wires, ln(9, '#E8453C')) + S.path(`M-205 -200 Q-260 -300 -240 -330`, ln(5, '#3A3A48'));
  // the bulb on a little stand between the wires
  g += S.rect(-30, -330, 60, 26, 6, ol('#AEB6C4', 5)) + S.path('M-240 -330 Q-120 -340 -30 -318 M200 -340 Q100 -340 30 -318', ln(6, '#3A3A48'));
  if (gl > 0.02) g += S.circle(0, -380, 60 + 110 * gl, { fill: '#FFE58A', opacity: f(0.18 + 0.25 * gl) }) + S.circle(0, -380, 40 + 50 * gl, { fill: '#FFF4C4', opacity: f(0.3 + 0.3 * gl) });
  g += S.circle(0, -378, 44, ol(gl > 0.02 ? lerpHex('#E8EEF4', '#FFF27A', gl) : '#E8EEF4', 6)) + S.path('M-14 -350 Q-6 -396 0 -372 Q6 -396 14 -350', ln(4, gl > 0.1 ? '#FF9A1F' : '#8A8F9B'));
  if (o.sign) g += S.g(S.rect(-110, -40, 220, 64, 10, ol('#FFFFFF', 5)) + TF('POTATO POWER!', 0, 0, 24, '#3A5AA8') + S.path(F.starPath(-86, -12, 12), { fill: '#FFC93C' }), 'translate(0 70)');
  return place(o, g);
}
// the fair map. Anchor = centre · 380 × 280. fold 0..1 (0 = open, 1 = folded small), mark: true (red dotted route to the dino + X)
function fairMap(...args) {
  const o = A(args, ['x', 'y', 's', 'rot'], { fold: 0, mark: true, back: false });
  const fk = clamp(o.fold, 0, 1);
  const w = 380 * (1 - 0.6 * fk), h = 280;
  let g = '';
  const panel = (x0, x1, i) => S.path(poly([[x0, -h / 2 + (i % 2) * 6], [x1, -h / 2 + ((i + 1) % 2) * 6], [x1, h / 2 + ((i + 1) % 2) * 6], [x0, h / 2 + (i % 2) * 6]], 4), ol(i % 2 ? '#F4EBD0' : '#FFF6DE', 5));
  for (let i = 0; i < 3; i++) g += panel(-w / 2 + (i * w) / 3, -w / 2 + ((i + 1) * w) / 3, i);
  if (o.back || fk > 0.6) return place(o, g + T('FAIR MAP', 0, 12, 40 * (1 - 0.3 * fk), '#E8453C', { stroke: LINE, 'stroke-width': 5, 'paint-order': 'stroke' }));
  const sx = w / 380;
  let m = S.path('M-160 60 Q-60 20 0 80 Q80 120 160 40', ln(18, '#E8D8A8')) + S.path('M-160 60 Q-60 20 0 80 Q80 120 160 40', ln(6, '#FFFFFF'));
  m += S.circle(-110, -50, 44, { fill: 'none', stroke: '#3B82F6', 'stroke-width': 6 }) + S.path('M-110 -94 L-110 -6 M-154 -50 L-66 -50 M-141 -81 L-79 -19 M-141 -19 L-79 -81', ln(3, '#3B82F6')) + TF('WHEEL', -110, 16, 16, '#3B82F6');
  m += S.path('M10 -60 Q0 -110 40 -110 Q80 -110 70 -60 Z', ol('#FF9FC4', 4)) + S.path('M40 -60 L40 -20', ln(5, '#E8B868')) + TF('CANDY', 40, 2, 16, '#E8456A');
  m += S.g(S.path('M-30 20 Q-40 -30 0 -40 Q30 -60 50 -30 L60 -40 L58 -14 Q60 20 30 30 L30 60 L16 60 L16 34 L-10 34 L-10 60 L-24 60 Z', ol('#5DBB4A', 4)), 'translate(130 -50) scale(0.9)') + TF('DINO', 140, 18, 16, '#3E8E3E');
  m += S.path('M-60 70 a22 14 0 1 0 44 0 Z M-20 90 a22 14 0 1 0 44 0 Z', ol('#B65CFF', 4)) + TF('CUPS', -20, 124, 16, '#7A3EC0');
  if (o.mark) m += S.path('M-150 110 Q-60 120 0 60 Q60 0 120 -30', { fill: 'none', stroke: '#E8231E', 'stroke-width': 6, 'stroke-dasharray': '10 10', 'stroke-linecap': 'round' }) + S.path('M108 -60 L148 -20 M148 -60 L108 -20', ln(9, '#E8231E')) + S.circle(-150, 110, 10, ol('#FFC93C', 4));
  g += S.g(m, `scale(${f(sx)} 1)`);
  return place(o, g);
}
// the dinosaur balloon (Max). Anchor = the bottom of the string (the grip); the balloon floats `string` above (default 480). t sways
function dinoBalloon(...args) {
  const o = A(args, ['x', 'y', 's', 'rot'], { string: 480, t: 0, col: '#5DBB4A', pop: 0 });
  const sw = Math.sin(o.t * 1.6) * 30, L = o.string;
  let g = S.path(`M0 0 Q${f(sw * 0.4 - 20)} ${f(-L * 0.5)} ${f(sw)} ${f(-L)}`, ln(4, '#FFFFFF')) + S.path(`M0 0 Q${f(sw * 0.4 - 20)} ${f(-L * 0.5)} ${f(sw)} ${f(-L)}`, { ...ln(2, '#8A8F9B') });
  const head = `M-110 -40 Q-130 -150 -40 -170 Q60 -190 110 -120 Q150 -110 160 -70 Q164 -20 120 -10 Q80 0 60 20 Q0 40 -60 20 Q-100 10 -110 -40 Z`;
  const b = clipped(head, o.col, S.path('M-80 -120 Q-40 -170 20 -160', ln(18, '#FFFFFF', 0.45)) + S.path('M40 -4 Q90 -20 150 -40', ln(8, shade(o.col, 0.75))), 6) +
    S.path('M60 -6 l10 16 l10 -16 l10 14 l10 -14 l8 12', { fill: '#FFFFFF', stroke: LINE, 'stroke-width': 4, 'stroke-linejoin': 'round' }) +
    S.circle(20, -110, 22, ol('#FFFFFF', 5)) + S.circle(26, -106, 10, { fill: LINE }) + S.circle(130, -86, 6, { fill: shade(o.col, 0.6) }) +
    S.path('M-80 -150 l-10 -40 l30 20 M-30 -172 l0 -40 l26 30 M20 -178 l14 -38 l14 36', ol('#FFB43A', 5)) + S.path('M-8 32 L8 32 L4 46 L-4 46 Z', ol(shade(o.col, 0.8), 4));
  g += S.g(b, `translate(${f(sw)} ${f(-L - 40)}) rotate(${f(sw * 0.3)})`);
  return place(o, g);
}
// cotton candy on a paper cone. Anchor = the bottom of the cone (grip) · 340 tall. col (pink), bite 0..1
function cottonCandy(...args) {
  const o = A(args, ['x', 'y', 's', 'rot'], { col: '#FF9FD0', col2: '#C9B8FF', bite: 0 });
  let g = S.path('M-14 0 L14 0 L30 -150 L-30 -150 Z', ol('#FFFFFF', 5)) + S.path('M-20 -100 L24 -70 M-26 -140 L28 -110', ln(5, '#7FD3FF'));
  const cs = [[0, -240, 80], [-60, -200, 50], [60, -200, 50], [-40, -290, 50], [40, -296, 52], [0, -330, 40], [-70, -260, 40], [70, -260, 40]];
  g += puffs(cs, o.col, 6) + puffs([[-20, -250, 30], [24, -276, 26], [36, -220, 22]], o.col2, 0.01, o.col2) + S.path('M-50 -300 Q-30 -330 0 -330', ln(10, '#FFFFFF', 0.6));
  if (o.bite > 0) g += S.circle(70, -300, 40 * o.bite, { fill: 'none' });
  return place(o, g);
}
// Grandpa's champion sash, on its own (shown off / framed). Anchor = centre · 420 × 300. text, year
function championSash(...args) {
  const o = A(args, ['x', 'y', 's', 'rot'], { text: 'CHAMPION', year: '1979' });
  let g = band('M-180 -110 Q0 40 180 -110', 54, '#D8263E', 8) + S.path('M-180 -126 Q0 20 180 -126 M-180 -94 Q0 58 180 -94', ln(4, '#FFC93C'));
  g += S.g(T(esc(o.text), 0, 0, 34, '#FFE58A', { stroke: LINE, 'stroke-width': 5, 'paint-order': 'stroke' }), 'translate(0 -20)');
  g += S.path('M-40 20 L-60 130 L-30 110 L-20 140 L0 30 Z M40 20 L60 130 L30 110 L20 140 L0 30 Z', ol('#D8263E', 5));
  g += S.circle(0, 40, 54, ol('#FFC93C', 7)) + S.circle(0, 40, 40, { fill: 'none', stroke: '#E09A00', 'stroke-width': 4 }) + T(esc(o.year), 0, 52, 28, '#B8331E');
  return place(o, g);
}

// ====================================================================== BISCUIT — the chubby corgi (non-rig character)
// biscuit({ x, y, s, t, pose, look, tongue, wag, face, flip, coat, coat2, ears, rot, shadow })
//   feet on (x, y); s = the same s as the actors next to him (authored at the hero's scale: sitting he is ≈ 430 tall at s 1 to the
//   ear tips — 0.45 of the hero). pose 'sit' (front, default) | 'walk' (side view facing screen-left; flip faces right; t walks)
//   | 'beg' (up on the hind legs, front paws up) | 'sleep' (curled loaf, zzz with t).
//   look: −1..1 eye direction (x) or [x, y]; tongue: true (default in 'happy' faces) | false; wag 0..1 (butt/tail wag with t);
//   face 'happy' (default) | 'good' (the final gag's VERY good boy: closed happy eyes, blush, sparkles) | 'neutral' | 'sad' |
//   'shocked' | 'sleepy' | 'love'; ears 0..1 (1 up, 0 flopped); coat / coat2 recolour him (other dogs).
const DOG = { coat: '#E8913A', coatSh: '#C9732A', white: '#FFF8EE', whiteSh: '#EADFCC', ear: '#FFB3B3', nose: '#1E1E24', tongue: '#FF7A90' };
const DOG_K = 0.82;
function dogFace(o, c, hx, hy, view) {
  const face = o.face || 'happy';
  const lk = Array.isArray(o.look) ? o.look : [o.look || 0, 0];
  let g = '';
  const eye = (x, y, side) => {
    if (face === 'good' || face === 'sleep') return S.path(`M${f(x - 18)} ${f(y + 6)} Q${f(x)} ${f(y - 16)} ${f(x + 18)} ${f(y + 6)}`, ln(8));
    if (face === 'sleepy') return S.path(`M${f(x - 16)} ${f(y)} Q${f(x)} ${f(y + 8)} ${f(x + 16)} ${f(y)}`, ln(8));
    if (face === 'love') return S.path(F.heartPath(x, y, 16), ol('#FF3B5C', 4));
    const k = face === 'shocked' ? 0.6 : 1;
    let e = S.ellipse(x + lk[0] * 6, y + lk[1] * 5, 15 * k, 20 * k, { fill: LINE }) + S.circle(x + lk[0] * 6 - 5 * k, y + lk[1] * 5 - 8 * k, 5.5 * k, { fill: '#FFFFFF' }) + S.circle(x + lk[0] * 6 + 5 * k, y + lk[1] * 5 + 6 * k, 2.5 * k, { fill: '#FFFFFF' });
    if (face === 'sad') e += S.path(`M${f(x - 20 * side)} ${f(y - 30)} L${f(x + 12 * side)} ${f(y - 22)}`, ln(6));
    return e;
  };
  const tongue = o.tongue ?? ['happy', 'good', 'love'].includes(face);
  if (view === 'side') {
    g += eye(hx - 40, hy - 18, 1);
    g += S.path(`M${f(hx - 118)} ${f(hy + 26)} Q${f(hx - 96)} ${f(hy + 40)} ${f(hx - 70)} ${f(hy + 30)}`, ln(6));
    if (tongue) g += S.path(`M${f(hx - 92)} ${f(hy + 34)} Q${f(hx - 96)} ${f(hy + 74)} ${f(hx - 80)} ${f(hy + 74)} Q${f(hx - 66)} ${f(hy + 72)} ${f(hx - 70)} ${f(hy + 32)} Z`, ol(DOG.tongue, 4));
    g += S.ellipse(hx - 132, hy + 4, 15, 12, { fill: c.nose }) + S.circle(hx - 136, hy, 4, { fill: '#FFFFFF', opacity: 0.7 });
    if (face === 'good' || face === 'love') g += S.ellipse(hx - 34, hy + 22, 18, 9, { fill: '#FF8FA3', opacity: 0.7 });
    return g;
  }
  g += eye(hx - 46, hy - 26, -1) + eye(hx + 46, hy - 26, 1);
  // muzzle: nose + w-mouth (+ tongue)
  g += S.path(`M${f(hx - 16)} ${f(hy + 6)} Q${f(hx)} ${f(hy - 2)} ${f(hx + 16)} ${f(hy + 6)} Q${f(hx + 14)} ${f(hy + 22)} ${f(hx)} ${f(hy + 24)} Q${f(hx - 14)} ${f(hy + 22)} ${f(hx - 16)} ${f(hy + 6)} Z`, { fill: c.nose }) + S.ellipse(hx - 5, hy + 6, 5, 3, { fill: '#FFFFFF', opacity: 0.7 });
  const open = face === 'shocked';
  if (open) g += S.ellipse(hx, hy + 52, 16, 20, ol('#4B1020', 5));
  else {
    if (tongue) g += S.path(`M${f(hx - 14)} ${f(hy + 42)} Q${f(hx - 18)} ${f(hy + 84)} ${f(hx)} ${f(hy + 86)} Q${f(hx + 18)} ${f(hy + 84)} ${f(hx + 14)} ${f(hy + 42)} Z`, ol(DOG.tongue, 4)) + S.path(`M${f(hx)} ${f(hy + 48)} L${f(hx)} ${f(hy + 70)}`, ln(3, '#D84A64'));
    g += S.path(face === 'sad' ? `M${f(hx - 30)} ${f(hy + 50)} Q${f(hx - 14)} ${f(hy + 34)} ${f(hx)} ${f(hy + 26)} Q${f(hx + 14)} ${f(hy + 34)} ${f(hx + 30)} ${f(hy + 50)}` : `M${f(hx)} ${f(hy + 24)} L${f(hx)} ${f(hy + 34)} M${f(hx - 34)} ${f(hy + 30)} Q${f(hx - 16)} ${f(hy + 52)} ${f(hx)} ${f(hy + 34)} Q${f(hx + 16)} ${f(hy + 52)} ${f(hx + 34)} ${f(hy + 30)}`, ln(6));
  }
  if (face === 'good' || face === 'love' || face === 'happy') g += S.ellipse(hx - 76, hy + 12, 20, 10, { fill: '#FF8FA3', opacity: face === 'happy' ? 0.45 : 0.75 }) + S.ellipse(hx + 76, hy + 12, 20, 10, { fill: '#FF8FA3', opacity: face === 'happy' ? 0.45 : 0.75 });
  if (face === 'good') g += F.sparkle(hx - 150, hy - 120, 22) + F.sparkle(hx + 160, hy - 90, 28) + F.sparkle(hx + 130, hy + 40, 16);
  return g;
}
function dogEar(x, y, ang, c, up = 1) {
  const a = ang + (1 - up) * (ang < 0 ? -70 : 70);
  return S.g(S.path('M-34 10 Q-40 -60 -6 -112 Q10 -120 18 -104 Q40 -50 34 10 Z', ol(c.coat, 6)) + S.path('M-20 2 Q-22 -54 -2 -92 Q20 -50 20 2 Z', { fill: DOG.ear }), `translate(${f(x)} ${f(y)}) rotate(${f(a)})`);
}
function biscuit(...args) {
  const o = A(args, ['x', 'y', 's', 'rot'], { pose: 'sit', t: 0, wag: 0.6, look: 0, face: 'happy', flip: false, ears: 1, shadow: true });
  const c = { ...DOG, coat: o.coat || DOG.coat, coatSh: o.coat ? shade(o.coat, 0.84) : DOG.coatSh, white: o.coat2 || DOG.white, whiteSh: o.coat2 ? shade(o.coat2, 0.9) : DOG.whiteSh };
  const t = o.t || 0, wag = clamp(o.wag, 0, 1);
  const wig = Math.sin(t * 14) * wag;
  let g = '';
  if (o.pose === 'walk') {
    const ph = t * 7, bob = Math.abs(Math.sin(ph)) * -8 + 34;
    const leg = (x, a, front) => S.g(S.path('M-26 0 L26 0 L26 62 Q26 76 10 76 L-12 76 Q-28 76 -28 62 Z', ol(front ? c.coat : c.coatSh, 6)) + S.path('M-28 34 L26 34 L26 62 Q26 76 10 76 L-12 76 Q-28 76 -28 62 Z', ol(c.white, 6)), `translate(${x} -76) rotate(${f(a)} 0 0)`);
    g += leg(110, Math.sin(ph + Math.PI) * 24, false) + leg(-90, Math.sin(ph) * 24, false);
    g += S.g(
      clipped('M-180 -180 Q-190 -260 -120 -262 L120 -262 Q190 -262 196 -190 Q206 -120 150 -98 L-130 -98 Q-186 -104 -180 -180 Z', c.coat, S.path('M-200 -150 Q-40 -110 210 -150 L210 -80 L-200 -80 Z', { fill: c.white }) + S.path('M-150 -244 Q0 -270 150 -244', ln(14, '#FFFFFF', 0.35)), 7) +
      puffs([[196 + wig * 6, -200, 30], [210 + wig * 8, -168, 24]], c.white, 6) + S.path(`M206 -214 q${f(30 + wig * 14)} -16 ${f(40 + wig * 20)} -40`, ln(14)) + S.path(`M206 -214 q${f(30 + wig * 14)} -16 ${f(40 + wig * 20)} -40`, ln(7, c.coat)), `translate(0 ${f(bob)})`);
    g += leg(130, Math.sin(ph) * 24, true) + leg(-70, Math.sin(ph + Math.PI) * 24, true);
    // head (facing left)
    const hx = -190, hy = -290 + bob;
    g += dogEar(hx + 30, hy - 60, -8, c, o.ears) + dogEar(hx + 76, hy - 50, 18, c, o.ears);
    g += clipped(`M${hx - 100} ${hy - 10} Q${hx - 96} ${hy - 96} ${hx} ${hy - 100} Q${hx + 96} ${hy - 96} ${hx + 100} ${hy - 6} Q${hx + 96} ${hy + 76} ${hx} ${hy + 80} Q${hx - 60} ${hy + 80} ${hx - 90} ${hy + 40} Z`, c.coat,
      S.path(`M${hx - 150} ${hy + 10} Q${hx - 60} ${hy - 30} ${hx + 10} ${hy + 20} Q${hx + 30} ${hy + 90} ${hx - 60} ${hy + 100} Z`, { fill: c.white }) + S.path(`M${hx - 20} ${hy - 100} Q${hx - 40} ${hy - 40} ${hx - 70} ${hy}`, ln(26, c.white)), 7);
    g += clipped(`M${hx - 90} ${hy - 10} Q${hx - 150} ${hy - 16} ${hx - 148} ${hy + 16} Q${hx - 144} ${hy + 44} ${hx - 80} ${hy + 44} Z`, c.white, '', 6);
    g += dogFace(o, c, hx, hy, 'side');
  } else if (o.pose === 'sleep') {
    const br = Math.sin(t * 2.2) * 0.02;
    g += S.g(clipped('M-230 -10 Q-240 -150 -100 -170 L140 -170 Q240 -160 240 -70 Q240 0 180 0 L-200 0 Q-230 0 -230 -10 Z', c.coat, S.path('M-240 -40 Q0 -10 250 -40 L250 10 L-240 10 Z', { fill: c.white }) + S.path('M-120 -150 Q40 -184 180 -150', ln(16, '#FFFFFF', 0.35)), 7), `translate(0 0) scale(1 ${f(1 + br)})`);
    g += puffs([[236, -80, 30], [240, -44, 24]], c.white, 6);
    const hx = -190, hy = -90;
    g += dogEar(hx + 50, hy - 70, 40, c, 0.15) + dogEar(hx + 90, hy - 60, 60, c, 0.1);
    g += clipped(`M${hx - 90} ${hy + 30} Q${hx - 96} ${hy - 80} ${hx + 10} ${hy - 86} Q${hx + 110} ${hy - 80} ${hx + 100} ${hy + 30} Q${hx + 60} ${hy + 90} ${hx} ${hy + 88} Q${hx - 70} ${hy + 86} ${hx - 90} ${hy + 30} Z`, c.coat, S.path(`M${hx - 100} ${hy + 20} Q${hx} ${hy - 10} ${hx + 100} ${hy + 20} L${hx + 100} ${hy + 100} L${hx - 100} ${hy + 100} Z`, { fill: c.white }), 7);
    g += S.rect(hx - 110, hy + 60, 120, 40, 18, ol(c.white, 6)) + S.rect(hx - 20, hy + 64, 110, 36, 16, ol(c.white, 6));
    g += dogFace({ ...o, face: 'sleep', tongue: false }, c, hx + 4, hy + 10, 'front');
    for (let i = 0; i < 3; i++) { const u = (t * 0.5 + i / 3) % 1; g += T('Z', hx + 60 + u * 80 + i * 16, hy - 120 - u * 140, 34 + i * 14, '#FFFFFF', { stroke: LINE, 'stroke-width': 6, 'paint-order': 'stroke', opacity: f(Math.sin(u * Math.PI)) }); }
  } else {
    // 'sit' / 'beg' (front view)
    const beg = o.pose === 'beg';
    const lift = beg ? 70 : 0;
    // hind legs + butt (wiggles with wag)
    g += S.g(puffs([[-104, -50, 56], [104, -50, 56]], c.coat, 7) + S.ellipse(-112, -6, 40, 18, ol(c.white, 6)) + S.ellipse(112, -6, 40, 18, ol(c.white, 6)) + puffs([[-150 + wig * 10, -110, 22], [-160 + wig * 12, -84, 18]], c.white, 5), `rotate(${f(wig * 3)} 0 0)`);
    // body
    g += S.g(clipped(`M-120 -40 Q-140 -210 -60 -250 Q0 -270 60 -250 Q140 -210 120 -40 Q100 0 0 0 Q-100 0 -120 -40 Z`, c.coat,
      S.path('M-70 -250 Q-90 -120 -60 0 L60 0 Q90 -120 70 -250 Z', { fill: c.white }) + puffs([[-40, -170, 34], [10, -190, 36], [40, -140, 32], [-30, -110, 30], [30, -90, 28]], c.white, 0.01, c.white) + S.path('M-100 -200 Q-110 -130 -96 -60', ln(10, c.coatSh)) + S.path('M100 -200 Q110 -130 96 -60', ln(10, c.coatSh)), 7), `translate(0 ${-lift}) rotate(${f(wig * 2)} 0 ${lift})`);
    // front legs (stubby) or begging paws
    if (beg) {
      for (const sx of [-1, 1]) g += S.g(S.path('M-24 0 L24 0 L24 70 Q24 92 0 92 Q-24 92 -24 70 Z', ol(c.white, 6)) + S.path('M-10 80 L-10 90 M8 80 L8 90', ln(4)), `translate(${sx * 56} ${-250}) rotate(${sx * -150})`);
    } else {
      for (const sx of [-1, 1]) g += S.path(`M${sx * 40 - 24} -96 L${sx * 40 + 24} -96 L${sx * 44 + 30} -14 Q${sx * 46 + 32} 6 ${sx * 44 + 10} 6 L${sx * 44 - 20} 6 Q${sx * 42 - 34} 6 ${sx * 44 - 30} -14 Z`, ol(c.white, 6)) + S.path(`M${sx * 44 - 9} -6 L${sx * 44 - 9} 5 M${sx * 44 + 9} -6 L${sx * 44 + 9} 5`, ln(4));
    }
    // head
    const hx = 0, hy = -330 - lift * 1.4, tilt = beg ? -6 : Math.sin(t * 1.3) * 3;
    let h = dogEar(hx - 74, hy - 66, -24, c, o.ears) + dogEar(hx + 74, hy - 66, 24, c, o.ears);
    h += clipped(`M${hx - 128} ${hy + 10} Q${hx - 130} ${hy - 104} ${hx} ${hy - 108} Q${hx + 130} ${hy - 104} ${hx + 128} ${hy + 10} Q${hx + 120} ${hy + 92} ${hx} ${hy + 96} Q${hx - 120} ${hy + 92} ${hx - 128} ${hy + 10} Z`, c.coat,
      S.path(`M${hx - 18} ${hy - 110} Q${hx - 26} ${hy - 40} ${hx - 70} ${hy + 10} Q${hx - 110} ${hy + 60} ${hx - 90} ${hy + 110} L${hx + 90} ${hy + 110} Q${hx + 110} ${hy + 60} ${hx + 70} ${hy + 10} Q${hx + 26} ${hy - 40} ${hx + 18} ${hy - 110} Z`, { fill: c.white }) + S.path(`M${hx - 100} ${hy - 60} Q${hx - 60} ${hy - 96} ${hx - 20} ${hy - 98}`, ln(14, '#FFFFFF', 0.4)), 7);
    h += dogFace(o, c, hx, hy, 'front');
    g += S.g(h, `rotate(${f(tilt)} ${hx} ${hy + 60})`);
  }
  let out = '';
  const s = o.s * DOG_K;
  if (o.shadow) out += S.ellipse(o.x, o.y, (o.pose === 'walk' || o.pose === 'sleep' ? 240 : 170) * s, 22 * s, { fill: C.shadow });
  out += S.g(g, `translate(${f(o.x)} ${f(o.y)}) scale(${f((o.flip ? -1 : 1) * s)} ${f(s)})${o.rot ? ` rotate(${f(o.rot)})` : ''}`);
  return out;
}
// head top (ear tips) of Biscuit in body units at s 1 per pose — for HUD plates
const BISCUIT_TOP = { sit: 432, beg: 540, walk: 380, sleep: 230 };

module.exports = {
  DEFS, A, DEVICE_SCREENS, screenBox, gameIdle,
  tablet, phone, gamingPC,
  coffeeMug, fryingPan, toaster, toast, cerealBowl, pancakes, alarmClock, sock,
  sandwich, lunchBag, lunchTray, ketchupBottle, quizPaper, bookStack, pointer, paperStack, redPen,
  groceryBags, ball, paperBoat, pillowFort, woodCane, ladle,
  potatoBattery, fairMap, dinoBalloon, cottonCandy, championSash,
  biscuit, BISCUIT_TOP, DOG,
};
