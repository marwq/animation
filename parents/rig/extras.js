// Props for "What If Your PARENTS Joined Your Roblox Server?": the family's devices (Dad's ancient laptop, Mom's tablet,
// Granny's phone, the hero's gaming PC — all can show game footage on their screens), mugs and tea, cookies, coin bags,
// swords, potions, knitting, the blanket, breakfast cereal, the family photo, and the avatars' hand props
// (pot-lid shield, golden cane, rolling pin, computer mouse, the ARCADE QUEEN 1998 trophy, clan axes...).
//
// Conventions (see docs/CAST.md):
//  * Every function is pure and returns an SVG string. Props take either positional (x, y, s, rot, opts) or one object
//    ({ x, y, s, rot, ...opts }) — both forms work everywhere.
//  * Props are authored in the hero's BODY units (hero ≈ 950 tall at s 1): pass the same s as the actor holding them,
//    or use them directly inside a rig pose's `props` (body space, s ≈ 1).
//  * Devices take `screen`: an SVG string or a function (w, h) => SVG, drawn in a local box (0, 0)-(w, h) clipped to
//    the screen (sizes in docs/CAST.md and DEVICE_SCREENS below). `glow` adds a soft light spill in front of the screen.
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

const DEFS = `<defs>
<linearGradient id="exGold" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#FFE27A"/><stop offset="0.45" stop-color="#FFC531"/><stop offset="1" stop-color="#E39B12"/></linearGradient>
<linearGradient id="exScreen" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2A3F7A"/><stop offset="1" stop-color="#101A3A"/></linearGradient>
<linearGradient id="exTea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#C98A4A"/><stop offset="1" stop-color="#9A5A26"/></linearGradient>
</defs>`;

// ====================================================================== SCREENS
// draws `screen` (svg or fn(w, h)) into a w x h box at (x0, y0), clipped to a rounded rect
const DEVICE_SCREENS = { laptopOld: [520, 330], tablet: [300, 420], phone: [176, 340], gamingPC: [660, 372] };
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
// idle "game on the screen" placeholder: blue sky, green cubes, a sun (used when no screen is given)
function cubeIdle(w, h) {
  let o = S.rect(0, 0, w, h, 0, { fill: '#7FD3FF' }) + S.circle(w * 0.82, h * 0.22, h * 0.1, { fill: '#FFE14D' });
  o += S.rect(0, h * 0.7, w, h * 0.3, 0, { fill: '#5DBB4A' });
  for (let i = 0; i < 5; i++) { const s = h * (0.12 + 0.06 * hash(i)); o += S.rect(w * (0.08 + i * 0.19), h * 0.7 - s, s, s, s * 0.12, { fill: ['#FF8A3D', '#B65CFF', '#3B82F6', '#FFD23F', '#E8453C'][i], stroke: LINE, 'stroke-width': 3 }); }
  return o;
}
// soft light spill in front of a screen (no gradients: two translucent shapes)
const spill = (x0, y0, w, h, col, k) => (k > 0 ? S.path(`M${f(x0)} ${f(y0)} L${f(x0 + w)} ${f(y0)} L${f(x0 + w + w * 0.5)} ${f(y0 + h * 2.2)} L${f(x0 - w * 0.5)} ${f(y0 + h * 2.2)} Z`, { fill: col, opacity: f(0.07 * k) }) + S.rect(x0 - 16, y0 - 16, w + 32, h + 32, 30, { fill: col, opacity: f(0.12 * k) }) : '');

// ====================================================================== DEVICES
// Dad's ancient laptop: chunky grey, thick bezel, a "#1 DAD" sticker on the lid, a sticky key. Anchor = bottom centre of the base.
// face 'screen' (we see the screen; screen box 520 x 330) | 'lid' (we see the back of the lid with the sticker) | 'side'
// open 0..1 (lid angle, 'side' view only), glow 0..1, sticker text, off 0..1 (screen dimmed)
function laptopOld(...args) {
  const o = A(args, ['x', 'y', 's', 'rot'], { face: 'screen', screen: null, glow: 0, sticker: '#1 DAD', open: 1, off: 0, col: '#9AA0AE', t: 0 });
  const [sw, sh] = DEVICE_SCREENS.laptopOld;
  const c = o.col, cs = '#7A808E';
  let g = '';
  if (o.face === 'side') {
    const a = -lerp(0, 105, clamp(o.open, 0, 1));
    g += S.path(poly([[-300, -30], [300, -30], [310, 0], [-310, 0]], 8), ol(c, 7)) + S.rect(-280, -26, 140, 8, 3, { fill: cs });
    g += S.g(S.path(poly([[0, -8], [400, -8], [400, 18], [0, 18]], 8), ol(c, 7)) + S.rect(30, -2, 340, 8, 3, { fill: cs }), `translate(-300 -30) rotate(${f(a)})`);
    return place(o, g);
  }
  if (o.face === 'lid') {
    g += S.path(poly([[-310, -24], [310, -24], [324, 0], [-324, 0]], 8), ol(cs, 7));
    g += S.path(poly([[-290, -440], [290, -440], [296, -22], [-296, -22]], 22), ol(c, 8));
    g += S.path('M-270 -420 Q-200 -428 -120 -424', ln(10, '#FFFFFF', 0.35));
    // a vintage logo + the sticker + a strip of tape
    g += S.circle(0, -240, 40, ol('#C9CED8', 5)) + S.path('M-14 -260 Q0 -290 14 -260 Q30 -230 0 -210 Q-30 -230 -14 -260 Z', { fill: cs });
    g += S.g(S.path(F.starPath(0, 0, 70, 46, 10), ol('#FFD23F', 6)) + T(esc(o.sticker), 0, 13, 36, '#E8453C', { stroke: '#FFFFFF', 'stroke-width': 6, 'paint-order': 'stroke' }), 'translate(150 -340) rotate(14)');
    g += S.g(S.rect(-56, -14, 112, 28, 4, { fill: '#F4E8C0', opacity: 0.85, stroke: LINE, 'stroke-width': 3 }), 'translate(-180 -110) rotate(-24)');
    g += spill(-290, -440, 580, 0, '#9FD8FF', o.glow);
    return place(o, g);
  }
  // facing us: the base with the keyboard foreshortened, the open screen
  g += S.path(poly([[-330, -40], [330, -40], [356, 0], [-356, 0]], 10), ol(cs, 7));
  let keys = '';
  for (let r = 0; r < 3; r++) for (let i = 0; i < 12; i++) keys += `M${f(-290 + i * 49 + r * 6)} ${-34 + r * 10} h40 `;
  g += S.path(keys, ln(6, '#5A606E'));
  g += S.rect(-60, -10, 120, 8, 3, { fill: '#5A606E' });
  g += S.path(poly([[-300, -460], [300, -460], [306, -38], [-306, -38]], 24), ol(c, 8));
  g += screenBox(-sw / 2, -440, sw, sh, 8, o.screen, { idle: o.screen ? '' : cubeIdle(sw, sh), off: o.off });
  g += S.rect(-sw / 2, -440, sw, sh, 8, { fill: 'none', stroke: LINE, 'stroke-width': 6 });
  g += S.circle(0, -452, 5, { fill: '#3A3F4E' }) + T('DELL-O', 0, -64, 26, '#5A606E');
  g += S.g(S.path(F.starPath(0, 0, 36, 24, 10), ol('#FFD23F', 4)) + T('#1', 0, 7, 20, '#E8453C'), 'translate(250 -76) rotate(10)');
  g += spill(-sw / 2, -440, sw, sh, '#9FD8FF', o.glow);
  return place(o, g);
}
// Mom's tablet in a teal case. Anchor = centre. face 'screen' (screen 300 x 420, portrait) | 'back'; landscape: true rotates it 90°
function tablet(...args) {
  const o = A(args, ['x', 'y', 's', 'rot'], { face: 'screen', screen: null, glow: 0, col: '#3FB8A8', landscape: false, off: 0 });
  const [sw, sh] = DEVICE_SCREENS.tablet;
  let g = '';
  if (o.face === 'back') {
    g += S.path(poly([[-180, -250], [180, -250], [180, 250], [-180, 250]], 40), ol(o.col, 8));
    g += S.path(poly([[-160, -230], [160, -230], [160, 230], [-160, 230]], 30), { fill: 'none', stroke: '#FFFFFF', 'stroke-width': 4, 'stroke-dasharray': '10 8', opacity: 0.6 });
    g += S.circle(-118, -196, 20, ol('#1E2230', 5)) + S.circle(-118, -196, 8, { fill: '#4A6AB8' });
    g += S.g(S.path('M-40 -22 Q-20 -32 0 -22 Q20 -32 40 -22 L40 26 Q20 16 0 26 Q-20 16 -40 26 Z', ol('#FFFFFF', 4)) + S.path('M0 -22 L0 26', ln(3)), 'translate(40 60) rotate(-6)');
    g += TF('LIBRARY', 40, 130, 26, '#FFFFFF', { stroke: LINE, 'stroke-width': 4, 'paint-order': 'stroke' });
  } else {
    g += S.path(poly([[-180, -250], [180, -250], [180, 250], [-180, 250]], 40), ol(o.col, 8));
    g += S.rect(-166, -236, 332, 472, 30, { fill: '#1E2230' });
    g += screenBox(-sw / 2, -sh / 2, sw, sh, 12, o.screen, { idle: o.screen ? '' : cubeIdle(sw, sh), off: o.off });
    g += S.circle(0, -226, 5, { fill: '#3A3F4E' });
    g += spill(-sw / 2, -sh / 2, sw, sh, '#9FD8FF', o.glow);
  }
  return place({ ...o, rot: o.rot + (o.landscape ? 90 : 0) }, g);
}
// a smartphone. Anchor = centre. face 'screen' (screen 176 x 340) | 'back'. style 'granny' (flowery case + pop socket) | 'plain'
function phone(...args) {
  const o = A(args, ['x', 'y', 's', 'rot'], { face: 'screen', screen: null, glow: 0, style: 'granny', col: '#FF9FC4', off: 0 });
  const [sw, sh] = DEVICE_SCREENS.phone;
  const granny = o.style === 'granny';
  let g = '';
  if (o.face === 'back') {
    g += S.path(poly([[-104, -196], [104, -196], [104, 196], [-104, 196]], 34), ol(granny ? o.col : '#2A2E3A', 7));
    if (granny) {
      for (const [x, y, r, c] of [[-50, -100, 26, '#FFFFFF'], [40, -10, 30, '#FFE14D'], [-40, 90, 24, '#FFFFFF'], [56, 120, 20, '#FF6FA8']]) {
        let fl = '';
        for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI * 2; fl += `M${f(x + Math.cos(a) * r * 0.6 - r * 0.45)} ${f(y + Math.sin(a) * r * 0.6)} a${f(r * 0.45)} ${f(r * 0.45)} 0 1 0 ${f(r * 0.9)} 0 a${f(r * 0.45)} ${f(r * 0.45)} 0 1 0 ${f(-r * 0.9)} 0 Z `; }
        g += S.path(fl, { fill: c, stroke: LINE, 'stroke-width': 3 }) + S.circle(x, y, r * 0.3, { fill: '#FFC93C' });
      }
      g += S.circle(0, 30, 34, ol('#B98AE0', 5)) + S.circle(0, 30, 20, { fill: '#D9B8FF' });
    }
    g += S.path(poly([[-84, -178], [-30, -178], [-30, -124], [-84, -124]], 14), ol('#1E2230', 5)) + S.circle(-57, -151, 12, { fill: '#4A6AB8' });
  } else {
    g += S.path(poly([[-104, -196], [104, -196], [104, 196], [-104, 196]], 34), ol(granny ? o.col : '#2A2E3A', 7));
    g += S.rect(-96, -188, 192, 376, 26, { fill: '#1E2230' });
    g += screenBox(-sw / 2, -sh / 2, sw, sh, 14, o.screen, { idle: o.screen ? '' : cubeIdle(sw, sh), off: o.off });
    g += S.rect(-30, -184, 60, 12, 6, { fill: '#0B0C10' });
    g += spill(-sw / 2, -sh / 2, sw, sh, '#9FD8FF', o.glow);
  }
  return place(o, g);
}
// the hero's gaming PC: big monitor on a stand + an RGB tower to the right + a keyboard. Anchor = bottom centre of the monitor
// stand on the desk. screen 660 x 372. tower: true (default), keyboard: true, t (RGB colour cycle), glow 0..1
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
  g += screenBox(-sw / 2, -540, sw, sh, 8, o.screen, { idle: o.screen ? '' : cubeIdle(sw, sh), off: o.off });
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

// ====================================================================== KITCHEN / LIVING ROOM
// a mug: anchor = centre of the mug body (handle on the right). text '#1 MOM' (default), steam 0..1 (needs t), col
function teaMug(...args) {
  const o = A(args, ['x', 'y', 's', 'rot'], { text: '#1 MOM', steam: 1, t: 0, col: '#FFFFFF', ink: '#E8456A', tea: true });
  let g = '';
  if (o.steam > 0) for (let i = 0; i < 2; i++) { const ph = o.t * 1.6 + i * 1.7; const y0 = -72 - ((ph * 40) % 40); g += S.path(`M${-14 + i * 28} ${f(y0)} q14 -18 0 -36 q-14 -18 0 -36`, { ...ln(9, '#FFFFFF', 0.6 * o.steam) }); }
  g += S.path('M48 -34 Q96 -34 96 4 Q96 40 48 40', ln(30)) + S.path('M48 -34 Q96 -34 96 4 Q96 40 48 40', ln(17, o.col));
  g += S.path(poly([[-56, -60], [56, -60], [52, 62], [-52, 62]], 16), ol(o.col, 7));
  if (o.tea) g += S.ellipse(0, -60, 52, 10, { fill: '#9A5A26', stroke: LINE, 'stroke-width': 5 });
  g += S.path('M-40 -36 L-40 40', ln(10, '#FFFFFF', 0.5));
  if (o.text) {
    const parts = String(o.text).split(' ');
    if (parts.length > 1 && parts[0].length <= 3) g += T(esc(parts[0]), -4, -6, 40, o.ink) + T(esc(parts.slice(1).join(' ')), -2, 36, 36, o.ink);
    else g += T(esc(o.text), 0, 16, 36, o.ink);
    g += S.path(F.heartPath(26, -26, 9), ol(o.ink, 2.5));
  }
  return place(o, g);
}
// a dainty tea cup on a saucer: anchor = centre of the saucer
function teaCup(...args) {
  const o = A(args, ['x', 'y', 's', 'rot'], { steam: 1, t: 0, col: '#FFFFFF', trim: '#7FB0E8', saucer: true });
  let g = '';
  if (o.saucer) g += S.ellipse(0, 0, 96, 22, ol(o.col, 6)) + S.ellipse(0, -2, 60, 10, { fill: 'none', stroke: o.trim, 'stroke-width': 4 });
  if (o.steam > 0) for (let i = 0; i < 2; i++) { const ph = o.t * 1.6 + i * 1.7; const y0 = -96 - ((ph * 30) % 30); g += S.path(`M${-12 + i * 24} ${f(y0)} q12 -16 0 -32 q-12 -16 0 -32`, ln(8, '#FFFFFF', 0.6 * o.steam)); }
  g += S.path('M44 -66 Q86 -66 80 -36 Q74 -10 40 -16', ln(24)) + S.path('M44 -66 Q86 -66 80 -36 Q74 -10 40 -16', ln(12, o.col));
  g += S.path('M-60 -76 L60 -76 Q56 -10 0 -6 Q-56 -10 -60 -76 Z', ol(o.col, 6)) + S.ellipse(0, -76, 60, 12, { fill: 'url(#exTea)', stroke: LINE, 'stroke-width': 5 });
  g += S.path('M-48 -50 Q0 -30 48 -50', ln(5, o.trim)) + S.circle(0, -36, 7, { fill: '#FF8FB0' });
  return place(o, g);
}
// a chocolate-chip cookie: anchor = centre, r 40 at s 1. bite 0..1 (bites taken)
function cookie(...args) {
  const o = A(args, ['x', 'y', 's', 'rot'], { bite: 0, r: 40, glow: 0 });
  const r = o.r;
  let g = '';
  if (o.glow > 0) g += S.circle(0, 0, r * 1.6, { fill: '#FFE58A', opacity: f(0.3 * o.glow) });
  if (o.bite > 0) {
    // bitten outline: the rim pulled in where it falls inside a bite circle
    const br = r * 0.42;
    const bites = [[r * 0.8, -r * 0.5], [r * 0.98, 0], [r * 0.72, r * 0.56]].slice(0, Math.ceil(clamp(o.bite, 0, 1) * 3));
    const pts = [];
    for (let i = 0; i < 64; i++) {
      const a = (i / 64) * Math.PI * 2, u = [Math.cos(a), Math.sin(a)];
      let tt = r;
      for (const b of bites) {
        const ub = u[0] * b[0] + u[1] * b[1], disc = br * br - (b[0] * b[0] + b[1] * b[1] - ub * ub);
        if (disc > 0) { const t0 = ub - Math.sqrt(disc), t1 = ub + Math.sqrt(disc); if (t1 > 0 && t0 < tt && r > t0) tt = Math.min(tt, Math.max(0, t0)); }
      }
      pts.push([u[0] * tt, u[1] * tt]);
    }
    const d = 'M' + pts.map(P).join(' L') + ' Z';
    return place(o, g + clipped(d, '#E2A55A', cookieBody(r, false), Math.max(3, r * 0.12)));
  }
  return place(o, g + cookieBody(r));
}
function cookieBody(r, rim = true) {
  let g = (rim ? S.circle(0, 0, r, ol('#E2A55A', Math.max(3, r * 0.12))) : '') + S.circle(-r * 0.12, -r * 0.14, r * 0.72, { fill: '#EDB86C' });
  for (const [dx, dy, rr] of [[-0.42, -0.3, 0.15], [0.3, -0.42, 0.12], [0.38, 0.2, 0.16], [-0.2, 0.38, 0.14], [0.02, -0.04, 0.12], [-0.5, 0.12, 0.1]]) g += S.circle(dx * r, dy * r, rr * r, { fill: '#6A3A1E' });
  return g;
}
// a baking tray of cookies: anchor = tray centre, 360 wide. n cookies (8), rot tilts
function cookieTray(...args) {
  const o = A(args, ['x', 'y', 's', 'rot'], { n: 8, steam: 0, t: 0 });
  let g = S.path(poly([[-180, -26], [180, -26], [196, 18], [-196, 18]], 10), ol('#C9CED8', 7)) + S.path('M-170 -10 L170 -10', ln(5, '#E8ECF2'));
  for (let i = 0; i < o.n; i++) { const col = i % 4, row = Math.floor(i / 4); g += S.g(cookieBody(34), `translate(${-126 + col * 84 + row * 20} ${-34 - row * 26}) scale(1 0.62)`); }
  if (o.steam) for (let i = 0; i < 3; i++) g += S.path(`M${-80 + i * 80} ${f(-70 - ((o.t * 40 + i * 13) % 30))} q12 -16 0 -32 q-12 -16 0 -32`, ln(8, '#FFFFFF', 0.55));
  return place(o, g);
}
// a money bag ($): anchor = the tied neck (the grip). coins 0..1 spills a few coins out of the top
function coinBag(...args) {
  const o = A(args, ['x', 'y', 's', 'rot'], { coins: 0, col: '#C9A06A', sign: '$' });
  let g = S.path('M-40 6 Q-150 60 -140 170 Q-130 260 0 262 Q130 260 140 170 Q150 60 40 6 Z', ol(o.col, 7));
  g += S.path('M-110 120 Q-120 200 -60 236', ln(12, '#E8C898'));
  g += S.path('M-46 6 Q-60 -30 -30 -40 Q0 -20 30 -40 Q60 -30 46 6 Z', ol(o.col, 6)) + band('M-48 6 Q0 22 48 6', 8, '#E8453C', 6);
  g += T(esc(o.sign), 0, 196, 120, '#FFC93C', { stroke: LINE, 'stroke-width': 10, 'paint-order': 'stroke', 'stroke-linejoin': 'round' });
  if (o.coins > 0) for (let i = 0; i < 3; i++) g += S.g(S.ellipse(0, 0, 26, 26, ol('#FFC93C', 5)) + S.ellipse(0, 0, 16, 16, { fill: 'none', stroke: '#E09A00', 'stroke-width': 4 }), `translate(${-30 + i * 30} ${f(-50 - 30 * o.coins * (i % 2 ? 1.4 : 1))}) scale(${f(0.6 + 0.4 * o.coins)})`);
  return place(o, g);
}
// a sword: anchor = the grip (between the fists), blade points up (-y) at rot 0. kind 'gold' (Granny's swords) | 'steel' | 'dark'
function goldSword(...args) {
  const o = A(args, ['x', 'y', 's', 'rot'], { kind: 'gold', glow: 0, len: 380 });
  const K = { gold: ['#FFD54A', '#FFF2B0', '#E09A00', '#E8453C'], steel: ['#D8E0EA', '#FFFFFF', '#9AA6B8', '#3B82F6'], dark: ['#2A2A33', '#5A5A6A', '#16161C', '#FF2E4A'] }[o.kind] || [];
  const L1 = o.len;
  let g = '';
  if (o.glow > 0) g += S.path(`M-40 -60 L0 ${-L1 - 60} L40 -60 Z`, { fill: K[3], opacity: f(0.25 * o.glow) });
  g += S.path(`M-26 -50 L-26 ${-L1 + 40} L0 ${-L1} L26 ${-L1 + 40} L26 -50 Z`, ol(K[0], 6)) + S.path(`M0 -56 L0 ${-L1 + 20}`, ln(6, K[2])) + S.path(`M-14 -70 L-14 ${-L1 + 50}`, ln(6, K[1]));
  if (o.kind === 'dark') g += S.path(`M26 ${-L1 * 0.5} l18 -20 l0 40 Z M-26 ${-L1 * 0.7} l-18 -20 l0 40 Z`, ol(K[0], 4)) + S.path(`M20 -60 L20 ${-L1 + 46}`, ln(4, K[3]));
  g += S.path(poly([[-80, -64], [80, -64], [70, -38], [-70, -38]], 10), ol(o.kind === 'steel' ? '#E8453C' : K[0], 6)) + S.circle(0, -51, 10, ol(K[3], 3.5));
  g += S.rect(-14, -40, 28, 86, 8, ol(o.kind === 'dark' ? '#16161C' : '#8A4A22', 5)) + S.path('M-14 -20 L14 -10 M-14 4 L14 14', ln(4, '#00000055')) + S.circle(0, 54, 16, ol(K[0], 5));
  return place(o, g);
}
// a potion bottle: anchor = centre of the round flask. col (liquid), glow 0..1, label '+'
function potion(...args) {
  const o = A(args, ['x', 'y', 's', 'rot'], { col: '#FF3B6B', glow: 0, label: '+', t: 0 });
  let g = '';
  if (o.glow > 0) g += S.circle(0, 0, 110, { fill: o.col, opacity: f(0.18 * o.glow) });
  g += S.rect(-24, -110, 48, 56, 8, ol('#DDF4FF', 6)) + S.rect(-30, -136, 60, 30, 8, ol('#A86B45', 6));
  const id = cid('po');
  const body = 'M-24 -60 Q-80 -40 -80 10 Q-80 70 0 72 Q80 70 80 10 Q80 -40 24 -60 Z';
  const lv = -10 + 4 * Math.sin(o.t * 4);
  g += S.clipDef(id, S.path(body)) + S.path(body, { fill: '#DDF4FF', opacity: 0.6 }) + S.g(S.rect(-90, lv, 180, 100, 0, { fill: o.col }) + S.ellipse(-30, 20, 10, 10, { fill: '#FFFFFF', opacity: 0.6 }) + S.ellipse(20, 40, 6, 6, { fill: '#FFFFFF', opacity: 0.6 }), null, { 'clip-path': `url(#${id})` }) + S.path(body, ol('none', 6));
  g += S.path('M-56 -20 Q-66 10 -54 36', ln(9, '#FFFFFF', 0.8));
  if (o.label) g += S.circle(0, 18, 22, ol('#FFFFFF', 4)) + T(esc(o.label), 0, 32, 38, o.col);
  return place(o, g);
}
// knitting: yarn ball + two needles with a knitted swatch hanging from them. Anchor = centre between the needles (held at the hands).
// ball: [dx, dy] of the yarn ball relative to the anchor (default below-right, on the lap), col
function knittingYarn(...args) {
  const o = A(args, ['x', 'y', 's', 'rot'], { col: '#E8456A', col2: '#FFB3CF', ball: [150, 230], needles: true, swatch: 1 });
  const [bx, by] = o.ball;
  let g = '';
  g += S.path(`M30 30 Q${f(bx * 0.6)} ${f(by * 0.2)} ${f(bx - 30)} ${f(by - 20)}`, ln(5, o.col));
  g += S.circle(bx, by, 62, ol(o.col, 6)) + S.path(`M${bx - 50} ${by - 20} Q${bx} ${by - 60} ${bx + 46} ${by - 26} M${bx - 56} ${by + 10} Q${bx} ${by - 30} ${bx + 56} ${by + 6} M${bx - 40} ${by + 40} Q${bx + 10} ${by + 10} ${bx + 50} ${by + 34} M${bx - 10} ${by - 60} Q${bx - 40} ${by} ${bx - 6} ${by + 60}`, ln(4, o.col2));
  if (o.swatch > 0) {
    const h = 120 * o.swatch;
    g += S.path(poly([[-70, 0], [70, 0], [64, h], [-64, h]], 10), ol(o.col2, 6));
    let st = '';
    for (let r = 0; r < h - 10; r += 20) for (let i = -54; i < 54; i += 20) st += `M${i} ${r + 10} l8 10 l8 -10 `;
    g += S.path(st, ln(3.5, o.col)) + S.rect(-70, h - 20, 140, 20, 6, { fill: o.col });
  }
  if (o.needles) for (const [a, b] of [[[-130, 30], [110, -60]], [[130, 30], [-110, -60]]]) g += band(`M${P(a)} L${P(b)}`, 8, '#C9CED8', 6) + S.circle(a[0], a[1], 12, ol('#FFC93C', 4));
  return place(o, g);
}
// a cosy quilted blanket draped over a sleeping person: anchor = top centre (under the chin), w x h at s 1 (default 420 x 520)
function blanket(...args) {
  const o = A(args, ['x', 'y', 's', 'rot'], { w: 420, h: 520, col: '#E9B44C', col2: '#E8607A', col3: '#5FA8D8', t: 0, wave: 0 });
  const w = o.w, h = o.h;
  const wv = (i) => Math.sin(o.t * 1.5 + i) * 6 * o.wave;
  const d = `M${-w / 2} 10 Q${-w / 4} ${-12 + wv(1)} 0 0 Q${w / 4} ${-12 + wv(2)} ${w / 2} 10 Q${w / 2 + 30} ${h * 0.5} ${w / 2 + 10} ${h} Q${w / 4} ${h + 26} 0 ${h + 10} Q${-w / 4} ${h + 26} ${-w / 2 - 10} ${h} Q${-w / 2 - 30} ${h * 0.5} ${-w / 2} 10 Z`;
  let inner = '';
  const cols = [o.col, o.col2, o.col3, '#FFF4E2'];
  const cw = w / 4, chh = h / 5;
  for (let r = 0; r < 6; r++) for (let c = 0; c < 6; c++) inner += S.rect(-w / 2 - 30 + c * cw, -20 + r * chh, cw, chh, 0, { fill: cols[(r + c * 2) % 4] });
  let st = '';
  for (let c = 1; c < 5; c++) st += `M${f(-w / 2 - 30 + c * cw)} -20 L${f(-w / 2 - 30 + c * cw)} ${h + 40} `;
  for (let r = 1; r < 6; r++) st += `M${-w} ${f(-20 + r * chh)} L${w} ${f(-20 + r * chh)} `;
  inner += S.path(st, { fill: 'none', stroke: '#FFFFFF', 'stroke-width': 4, 'stroke-dasharray': '10 8', opacity: 0.8 });
  inner += S.path(`M${-w * 0.2} 40 Q${-w * 0.25} ${h * 0.5} ${-w * 0.15} ${h} M${w * 0.22} 30 Q${w * 0.3} ${h * 0.6} ${w * 0.18} ${h}`, ln(14, '#000', 0.12));
  inner += S.rect(-w, -30, 2 * w, 44, 0, { fill: '#FFF4E2' }) + S.path(`M${-w} 14 L${w} 14`, ln(4));
  return place(o, clipped(d, o.col, inner, 7));
}
// breakfast: a bowl of cereal with a spoon. Anchor = bottom centre of the bowl. spoon: true (spoon raised above the bowl with one
// flake on it), fall 0..1: the flake slides off the spoon and drops back into the bowl (the "cereal falls" beat), spoonY offset
function cereal(...args) {
  const o = A(args, ['x', 'y', 's', 'rot'], { spoon: true, fall: 0, col: '#4FA8E8', milk: true, spoonY: 0 });
  const flake = (x, y, r, a, c = '#F2B84A') => S.g(S.path('M-16 -10 Q0 -20 16 -10 Q22 4 10 12 Q-4 18 -16 8 Q-22 -2 -16 -10 Z', ol(c, 3.5)) + S.path('M-8 -4 l10 2', ln(3, '#C98424')), `translate(${f(x)} ${f(y)}) rotate(${f(a)}) scale(${f(r)})`);
  let g = '';
  // bowl back rim, cereal heap, milk, front
  g += S.ellipse(0, -150, 170, 40, ol(o.col, 7));
  g += S.ellipse(0, -146, 150, 30, { fill: '#FFFFFF' });
  for (let i = 0; i < 14; i++) g += flake(-120 + (i % 7) * 40 + (i > 6 ? 18 : 0), -158 + (i > 6 ? 10 : 0) + hash(i) * 8, 1.1, hash(i * 3) * 180, ['#F2B84A', '#FF8A5C', '#FFD86B'][i % 3]);
  g += S.path('M-170 -150 Q-160 -10 -60 0 L60 0 Q160 -10 170 -150 Q0 -100 -170 -150 Z', ol(o.col, 7));
  g += S.path('M-140 -110 Q-130 -40 -80 -20', ln(12, '#FFFFFF', 0.5));
  for (let i = 0; i < 5; i++) g += S.circle(-90 + i * 45, -70, 9, { fill: '#FFFFFF', opacity: 0.6 });
  if (o.spoon) {
    const sy = -330 + o.spoonY;
    g += band(`M150 ${sy + 160} L30 ${sy + 20}`, 14, '#C9CED8', 6);
    g += S.ellipse(10, sy, 56, 30, ol('#C9CED8', 6)) + S.ellipse(10, sy - 4, 40, 18, { fill: '#FFFFFF' });
    const u = clamp(o.fall, 0, 1);
    const fy = sy - 10 + u * u * (-150 - (sy - 10)) + Math.sin(u * Math.PI) * -30, fx = 10 + u * 10;
    if (u < 1) g += flake(fx, fy, 1.4, u * 220);
    if (u > 0.95) g += S.path('M-20 -168 q10 -20 20 0 q10 -20 20 0', ln(5, '#FFFFFF'));
  }
  return place(o, g);
}
// the framed family photo on the wall: anchor = centre, 300 x 240. title text under the photo ('FAMILY')
function familyPhoto(...args) {
  const o = A(args, ['x', 'y', 's', 'rot'], { title: '', frame: '#8A5A30', bg: '#BFE3F2', crooked: 0 });
  let g = S.path(poly([[-160, -130], [160, -130], [160, 130], [-160, 130]], 10), ol(o.frame, 8)) + S.rect(-130, -100, 260, 200, 6, { fill: o.bg, stroke: LINE, 'stroke-width': 5 });
  g += S.rect(-130, 40, 260, 60, 0, { fill: '#9FD49A' });
  // the family as simple heads + shoulders: Dad (moustache), Mom (bun), Granny (curls), YOU (orange bob)
  const fig = (x, y, sk, top, hairFn, sc = 1) => S.g(S.rect(-34, 0, 68, 70, 14, ol(top, 4)) + S.rect(-28, -66, 56, 64, 14, ol(sk, 4)) + hairFn() + S.circle(-11, -36, 4, { fill: LINE }) + S.circle(11, -36, 4, { fill: LINE }) + S.path('M-10 -18 Q0 -10 10 -18', ln(3.5)), `translate(${x} ${y}) scale(${sc})`);
  g += fig(-86, 30, '#F4CDAE', '#D9A13A', () => S.path('M-24 -66 Q0 -84 24 -66', ln(10, '#6B4E3A')) + S.path('M-16 -24 Q0 -30 16 -24 Q8 -16 0 -20 Q-8 -16 -16 -24 Z', ol('#6B4E3A', 3)), 1.05);
  g += fig(-26, 36, '#F6D5BC', '#6FAE9C', () => S.circle(0, -80, 14, ol('#8A3B22', 3.5)) + S.path('M-30 -40 Q-32 -70 0 -72 Q32 -70 30 -40 Q20 -60 0 -58 Q-20 -60 -30 -40 Z', ol('#8A3B22', 3.5)));
  g += fig(36, 42, '#F8DCCB', '#E992B4', () => puffs([[-22, -66, 14], [0, -74, 15], [22, -66, 14]], '#F4F2F8', 3.5), 0.92);
  g += fig(92, 50, '#FFFFFF', '#D8262E', () => S.path('M-34 -40 L-30 -72 Q0 -86 30 -72 L34 -40 L22 -46 L16 -60 L0 -54 L-16 -60 L-22 -46 Z', ol('#B84B02', 3.5)), 0.8);
  g += S.path('M-110 -80 L-60 -80', ln(8, '#FFFFFF', 0.5));
  if (o.title) g += S.rect(-80, 136, 160, 36, 8, ol('#F4E8C0', 4)) + TF(esc(o.title), 0, 162, 24, '#5A3A1E');
  return place({ ...o, rot: o.rot + o.crooked }, g);
}

// ====================================================================== HAND PROPS FOR THE CAST
// a computer mouse held like a phone: anchor = grip centre; cord 0..1 dangles the cable
function computerMouse(...args) {
  const o = A(args, ['x', 'y', 's', 'rot'], { cord: 1, col: '#E8ECF2', t: 0 });
  let g = '';
  if (o.cord > 0) g += S.path(`M0 -70 Q${f(-40 + 10 * Math.sin(o.t * 3))} -170 ${f(30 * o.cord)} ${f(-120 + 260 * o.cord)}`, ln(8, '#2A2E3A'));
  g += S.path('M-46 -40 Q-50 -80 0 -82 Q50 -80 46 -40 L44 50 Q40 82 0 84 Q-40 82 -44 50 Z', ol(o.col, 6)) + S.path('M0 -82 L0 -24 M-46 -24 Q0 -16 46 -24', ln(4)) + S.rect(-7, -64, 14, 26, 6, ol('#9AA6B8', 3));
  g += S.path('M-30 -60 Q-34 0 -26 50', ln(8, '#FFFFFF', 0.7));
  return place(o, g);
}
// MOM_OFFICIAL's shield: a big silver pot lid with a knob. anchor = centre, r 120. dent 0..1 adds dents/sparkle
function potLid(...args) {
  const o = A(args, ['x', 'y', 's', 'rot'], { r: 120, dent: 0, flash: 0 });
  const r = o.r;
  let g = S.circle(0, 0, r + 10, ol('#9AA6B8', 7)) + S.circle(0, 0, r - 6, { fill: '#D8E0EA' }) + S.circle(0, 0, r * 0.62, { fill: 'none', stroke: '#B8C2D0', 'stroke-width': 6 });
  g += S.path(`M${f(-r * 0.7)} ${f(-r * 0.3)} Q${f(-r * 0.6)} ${f(-r * 0.7)} ${f(-r * 0.2)} ${f(-r * 0.78)}`, ln(12, '#FFFFFF', 0.9));
  g += S.rect(-r * 0.32, -r * 0.16, r * 0.64, r * 0.32, r * 0.14, ol('#2A2E3A', 6)) + S.rect(-r * 0.2, -r * 0.1, r * 0.2, r * 0.07, 3, { fill: '#5A606E' });
  g += S.circle(r * 0.55, -r * 0.4, 6, { fill: '#5A606E' });
  if (o.dent) g += S.path(`M${f(r * 0.3)} ${f(r * 0.4)} q10 -8 20 0 M${f(-r * 0.5)} ${f(r * 0.3)} q8 -8 16 0`, ln(4, '#8A93A6'));
  if (o.flash > 0) g += S.path(F.starPath(-r * 0.4, -r * 0.4, 40 * o.flash, 10 * o.flash, 4), { fill: '#FFFFFF' });
  return place(o, g);
}
// GrannyGoodies' golden cane: anchor = the grip (top of the hook), the shaft goes down (+y) len 560
function cane(...args) {
  const o = A(args, ['x', 'y', 's', 'rot'], { len: 560, col: '#FFC93C' });
  let g = band(`M-50 -10 Q-56 -70 0 -72 Q50 -70 46 -16`, 22, o.col, 8) + band(`M46 -16 L46 ${o.len}`, 22, o.col, 8);
  g += S.path(`M40 0 L40 ${o.len - 20}`, ln(6, '#FFF2B0')) + S.rect(32, o.len - 10, 28, 22, 6, ol('#2A2E3A', 5));
  g += S.circle(-50, -6, 16, ol('#B65CFF', 5)) + S.path(F.starPath(-50, -6, 8), { fill: '#FFFFFF' });
  for (const y of [120, 250, 380]) g += S.path(`M30 ${y} L62 ${y - 10}`, ln(5, '#E09A00'));
  return place(o, g);
}
// a rolling pin: anchor = centre, 360 long horizontal at rot 0. flour 0..1
function rollingPin(...args) {
  const o = A(args, ['x', 'y', 's', 'rot'], { flour: 0 });
  let g = S.rect(-210, -14, 50, 28, 10, ol('#A86B45', 5)) + S.rect(160, -14, 50, 28, 10, ol('#A86B45', 5));
  g += S.rect(-160, -40, 320, 80, 30, ol('#E8C48A', 6)) + S.path('M-140 -20 L140 -20', ln(8, '#FFF0D0')) + S.path('M-100 -40 L-100 40 M0 -40 L0 40 M100 -40 L100 40', ln(3, '#C9A06A'));
  if (o.flour) g += S.path('M-120 20 q10 -10 20 0 M-40 26 q10 -10 20 0 M60 22 q10 -10 20 0', ln(7, '#FFFFFF', 0.8 * o.flour));
  return place(o, g);
}
// the ARCADE QUEEN 1998 trophy (teen Mom): anchor = bottom centre, ≈ 560 tall at s 1. text lines
function arcadeTrophy(...args) {
  const o = A(args, ['x', 'y', 's', 'rot'], { text: ['ARCADE', 'QUEEN', '1998'], shine: 1, t: 0 });
  let g = '';
  g += S.path(poly([[-150, -110], [150, -110], [170, 0], [-170, 0]], 10), ol('#5A2E8A', 7)) + S.rect(-120, -96, 240, 76, 10, ol('#FFC93C', 5));
  g += TF(esc(o.text[0] || ''), 0, -66, 30, '#5A2E8A') + TF(esc(`${o.text[1] || ''} ${o.text[2] || ''}`), 0, -32, 30, '#5A2E8A');
  g += S.path(poly([[-80, -170], [80, -170], [104, -110], [-104, -110]], 8), ol('#FFC93C', 7));
  g += S.rect(-24, -290, 48, 126, 10, ol('#FFC93C', 6));
  for (const sx of [-1, 1]) g += band(`M${sx * 150} -470 Q${sx * 250} -470 ${sx * 236} -380 Q${sx * 220 - sx * 10} -320 ${sx * 120} -330`, 18, '#FFC93C', 8);
  g += S.path('M-170 -560 L170 -560 Q170 -320 0 -290 Q-170 -320 -170 -560 Z', ol('url(#exGold)', 8));
  g += S.path('M-130 -530 Q-120 -400 -60 -340', ln(16, '#FFF2B0', 0.9)) + S.ellipse(0, -560, 170, 26, ol('#FFE27A', 7));
  // a pixel joystick emblem
  g += S.circle(0, -440, 52, ol('#5A2E8A', 6)) + S.rect(-30, -428, 60, 22, 6, ol('#E8456A', 4)) + S.rect(-6, -478, 12, 52, 5, ol('#2A2E3A', 3)) + S.circle(0, -482, 16, ol('#E8456A', 4));
  if (o.shine) for (const [x, y, r] of [[-120, -600, 22], [140, -520, 16], [60, -620, 12]]) g += S.path(F.starPath(x, y, r * (0.7 + 0.3 * Math.sin(o.t * 5 + x)), r * 0.25, 4), { fill: '#FFFFFF', stroke: LINE, 'stroke-width': 3 });
  return place(o, g);
}
// the clan's battle axe: anchor = grip, head up
function axe(...args) {
  const o = A(args, ['x', 'y', 's', 'rot'], { col: '#5A5E6A', edge: '#C9CED8', glow: '#B65CFF' });
  let g = S.rect(-12, -360, 24, 420, 8, ol('#2A2A33', 5));
  g += S.path('M10 -340 Q120 -380 130 -260 Q120 -160 10 -200 Z', ol(o.col, 6)) + S.path('M110 -350 Q140 -270 112 -180', ln(10, o.edge)) + S.path('M-10 -330 Q-70 -320 -76 -270 Q-70 -230 -10 -230 Z', ol(o.col, 5));
  g += S.circle(0, -276, 12, ol(o.glow, 4));
  return place(o, g);
}
// an MVP medal on a ribbon: anchor = medal centre
function mvpMedal(...args) {
  const o = A(args, ['x', 'y', 's', 'rot'], { text: 'MVP' });
  let g = S.path('M-60 -150 L-14 -40 L14 -40 L60 -150 L34 -150 L0 -70 L-34 -150 Z', ol('#E8453C', 5));
  g += S.circle(0, 0, 56, ol('#FFC93C', 7)) + S.circle(0, 0, 42, { fill: 'none', stroke: '#E09A00', 'stroke-width': 5 }) + T(esc(o.text), 0, 14, 38, '#FFFFFF', { stroke: '#B06A00', 'stroke-width': 7, 'paint-order': 'stroke' });
  return place(o, g);
}
// Granny's GG cookie sign / employee frame: a framed picture with a title. anchor = centre, 320 x 360
function employeeFrame(...args) {
  const o = A(args, ['x', 'y', 's', 'rot'], { title: 'EMPLOYEE OF THE MONTH', name: 'NoodleBoi', inner: null });
  let g = S.path(poly([[-170, -200], [170, -200], [170, 200], [-170, 200]], 12), ol('#FFC93C', 9)) + S.rect(-140, -130, 280, 250, 8, { fill: '#BFE3F2', stroke: LINE, 'stroke-width': 5 });
  const ws = String(o.title).split(' ');
  g += TF(esc(ws.slice(0, Math.ceil(ws.length / 2)).join(' ')), 0, -170, 26, '#5A3200') + TF(esc(ws.slice(Math.ceil(ws.length / 2)).join(' ')), 0, -140, 26, '#5A3200');
  if (o.inner) g += S.g(o.inner, 'translate(0 120)');
  g += S.rect(-110, 130, 220, 46, 10, ol('#FFFFFF', 5)) + TF(esc(o.name), 0, 162, 30, '#2A1640');
  return place(o, g);
}

module.exports = {
  DEFS, A, DEVICE_SCREENS, screenBox, cubeIdle,
  laptopOld, tablet, phone, gamingPC,
  teaMug, teaCup, cookie, cookieTray, coinBag, goldSword, potion, knittingYarn, blanket, cereal, familyPhoto,
  computerMouse, potLid, cane, rollingPin, arcadeTrophy, axe, mvpMedal, employeeFrame,
};
