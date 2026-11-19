// Non-rig characters and props for "What If You Could RESPAWN in Real Life?": Gary the goldfish, his fishbowl,
// and every prop the script needs (pancakes, the BOOK OF FAILS, magic hat, flasks, skateboard, dodgeballs,
// lunch tray, spaghetti, birthday cake, trophy, Bea's sign, rocket sneakers, mic stand, bowling pins, bicycle...).
//
// Conventions (see docs/CAST.md):
//  * Every function is pure and returns an SVG string. Props take either positional (x, y, s, rot, opts) or one object
//    ({ x, y, s, rot, ...opts }) — both forms work everywhere.
//  * Props are authored in the hero's BODY units (hero ≈ 955 tall at s 1): pass the same s as the actor holding them,
//    or use them directly inside a rig pose's `props` (body space, s 1).
//  * Gary and the fishbowl are authored for medium shots (Gary ≈ 290 long at s 1, bowl 600 wide at s 1) and take
//    `line` (stroke width in local units) so they can match the hero's line weight at any size.
//  * Static gradients live in DEFS (ids prefixed `ex`); scenes/main.js loads them automatically.
'use strict';

const S = require('./svg');
const C = require('./palette');
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
// union of circles with ONE outline: [[x, y, r], ...]
function puffs(circles, fill, w = 6, lineCol = LINE) {
  const ring = (x, y, r) => `M${f(x - r)} ${f(y)} a${f(r)} ${f(r)} 0 1 0 ${f(2 * r)} 0 a${f(r)} ${f(r)} 0 1 0 ${f(-2 * r)} 0 Z`;
  return S.path(circles.map(([x, y, r]) => ring(x, y, r + w / 2)).join(' '), { fill: lineCol }) + S.path(circles.map(([x, y, r]) => ring(x, y, Math.max(0.5, r - w / 2))).join(' '), { fill });
}
// argument normaliser: fn(x, y, s, rot, opts) or fn({ x, y, s, rot, ...opts })
function A(args, names = ['x', 'y', 's', 'rot'], defs = {}) {
  const o = { x: 0, y: 0, s: 1, rot: 0, ...defs };
  if (args.length === 1 && args[0] && typeof args[0] === 'object') return { ...o, ...args[0] };
  names.forEach((n, i) => { if (args[i] !== undefined && typeof args[i] !== 'object') o[n] = args[i]; });
  for (const a of args) if (a && typeof a === 'object') Object.assign(o, a);
  return o;
}
const place = (o, inner) => (inner ? S.g(inner, `translate(${f(o.x)} ${f(o.y)})${o.rot ? ` rotate(${f(o.rot)})` : ''}${o.s !== 1 ? ` scale(${f(o.s)})` : ''}`) : '');

const DEFS = `<defs>
<linearGradient id="exWater" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9FE6F2"/><stop offset="1" stop-color="#4FB5D6"/></linearGradient>
<linearGradient id="exGold" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#FFE27A"/><stop offset="0.45" stop-color="#FFC531"/><stop offset="1" stop-color="#E39B12"/></linearGradient>
</defs>`;

// ====================================================================== FOAM (elephant toothpaste)
// a cluster of foam puffs; centre (x, y); k 0..1 grows it; seed varies the shape; drip adds hanging drips.
function foam(...args) {
  const o = A(args, ['x', 'y', 's', 'rot'], { k: 1, seed: 1, r: 60, n: 7, drip: 0, col: '#FFFFFF', shadeCol: '#D3E4F2', w: 6 });
  const k = clamp(o.k, 0, 1);
  if (k <= 0.01) return '';
  const cs = [];
  for (let i = 0; i < o.n; i++) {
    const a = hash(o.seed * 7.3 + i * 1.91) * Math.PI * 2, d = o.r * 0.9 * Math.sqrt(hash(o.seed * 3.1 + i * 5.7));
    cs.push([Math.cos(a) * d * 1.3, Math.sin(a) * d * 0.7, o.r * (0.45 + 0.45 * hash(o.seed + i * 2.3)) * k]);
  }
  cs.push([0, 0, o.r * 0.8 * k]);
  let s = '';
  if (o.drip > 0) {
    let d = '';
    for (let i = 0; i < 3; i++) {
      const x = (hash(o.seed * 11 + i) - 0.5) * o.r * 1.8, L = o.r * (0.5 + hash(o.seed * 5 + i)) * o.drip * k, w = o.r * 0.16 * k;
      d += `M${f(x - w)} 0 L${f(x - w)} ${f(L)} a${f(w)} ${f(w)} 0 0 0 ${f(2 * w)} 0 L${f(x + w)} 0 Z `;
    }
    s += S.path(d, ol(o.col, o.w));
  }
  s += puffs(cs, o.col, o.w);
  s += S.path(cs.filter((_, i) => i % 2 === 0).map(([x, y, r]) => `M${f(x - r * 0.55)} ${f(y + r * 0.35)} Q${f(x)} ${f(y + r * 0.75)} ${f(x + r * 0.6)} ${f(y + r * 0.3)}`).join(' '), ln(o.w * 0.9, o.shadeCol));
  s += S.path(cs.filter((_, i) => i % 3 === 1).map(([x, y, r]) => `M${f(x - r * 0.45)} ${f(y - r * 0.25)} Q${f(x - r * 0.2)} ${f(y - r * 0.55)} ${f(x + r * 0.15)} ${f(y - r * 0.55)}`).join(' '), ln(o.w * 0.8, '#FFFFFF'));
  for (let i = 0; i < 3; i++) { const c = cs[(i * 3 + 1) % cs.length]; s += S.circle(c[0] + c[2] * 0.3, c[1] - c[2] * 0.1, Math.max(1, c[2] * 0.12), { fill: 'none', stroke: '#B9D4E8', 'stroke-width': o.w * 0.5 }); }
  return place(o, s);
}

// ====================================================================== KITCHEN: spatula, pancakes, plate
// pancake(x, y, s, rot, flip): golden pancake, 150 wide. flip 0..1 = one full flip (0 = lying flat, seen from slightly above).
function pancake(...args) {
  const o = A(args, ['x', 'y', 's', 'rot', 'flip'], { flip: 0, burnt: false, butter: false, w: 5 });
  const R = 75, th = 20;
  const ang = 0.3 + (o.flip || 0) * Math.PI * 2;
  const ry = R * Math.sin(ang), cy = Math.cos(ang);
  const top = ry >= 0;
  const face = o.burnt ? '#7A4A26' : top ? '#F2B64A' : '#D9902E';
  const rim = o.burnt ? '#5A3418' : '#E39C38';
  const ary = Math.max(2, Math.abs(ry));
  let s = '';
  const dy = th * cy;
  // rim (cylinder side): from the face ellipse to the offset ellipse
  s += S.path(`M${-R} 0 A${R} ${f(ary)} 0 0 ${top ? 0 : 1} ${R} 0 L${R} ${f(dy)} A${R} ${f(ary)} 0 0 ${top ? 1 : 0} ${-R} ${f(dy)} Z`, ol(rim, o.w));
  s += S.ellipse(0, 0, R, ary, ol(face, o.w));
  if (ary > 8) {
    const k = ary / R;
    s += S.ellipse(-8, -ary * 0.1, R * 0.62, ary * 0.55, { fill: o.burnt ? '#8A5A30' : top ? '#F8CC6C' : '#E8A848', opacity: 0.9 });
    let dots = '';
    for (let i = 0; i < 7; i++) { const a = i * 2.39, r = 0.25 + 0.55 * hash(i + 3); dots += `M${f(Math.cos(a) * R * r - 3)} ${f(Math.sin(a) * ary * r)} a3 ${f(Math.max(0.6, 3 * k))} 0 1 0 6 0 a3 ${f(Math.max(0.6, 3 * k))} 0 1 0 -6 0 Z `; }
    s += S.path(dots, { fill: o.burnt ? '#3A2010' : '#C98424', opacity: 0.75 });
    if (o.butter && top) s += S.path(`M-16 ${f(-ary * 0.3 - 8)} l30 0 l6 ${f(10 * k + 4)} l-30 0 Z`, ol('#FFE58A', 3.5));
  }
  return place(o, s);
}
// stack of n pancakes on a plate (bottom centre at x, y), butter + syrup
function pancakeStack(...args) {
  const o = A(args, ['x', 'y', 's', 'rot'], { n: 5, syrup: true, butter: true, plate: true });
  let s = o.plate ? plateSvg() : '';
  for (let i = 0; i < o.n; i++) s += S.g(pancake({ x: (hash(i * 3.3) - 0.5) * 10, y: -24 - i * 21, flip: 0 }), null);
  const ty = -24 - (o.n - 1) * 21;
  if (o.syrup) s += S.path(`M-60 ${ty - 6} Q-30 ${ty - 30} 10 ${ty - 22} Q60 ${ty - 20} 58 ${ty - 4} L62 ${ty + 30} Q66 ${ty + 44} 56 ${ty + 44} Q48 ${ty + 44} 50 ${ty + 26} L46 ${ty + 8} Q0 ${ty + 14} -40 ${ty + 6} L-44 ${ty + 22} Q-46 ${ty + 32} -54 ${ty + 30} Q-62 ${ty + 28} -60 ${ty + 14} Z`, ol('#B8601A', 4.5)) +
    S.path(`M-30 ${ty - 18} Q0 ${ty - 26} 30 ${ty - 18}`, ln(5, '#E8964A'));
  if (o.butter) s += S.path(`M-20 ${ty - 34} l38 -4 l6 14 l-38 4 Z`, ol('#FFE58A', 4)) + S.path(`M-14 ${ty - 30} l24 -3`, ln(3, '#FFFFFF'));
  return place(o, s);
}
function plateSvg() {
  return S.ellipse(0, -6, 122, 30, ol('#FFFFFF', 5)) + S.ellipse(0, -10, 86, 18, { fill: '#E8EDF4' }) + S.path('M-100 -14 Q-60 -32 -10 -34', ln(4, '#FFFFFF'));
}
function plate(...args) { const o = A(args); return place(o, plateSvg()); }
// spatula held at the grip (x, y); rot 0 = blade up. opts: pancake (true | 'burnt'), edge (blade seen edge-on)
function spatula(...args) {
  const o = A(args, ['x', 'y', 's', 'rot'], { pancake: false, edge: false, col: '#2E2E36' });
  let s = S.rect(-15, -150, 30, 220, 12, ol(o.col, 5)) + S.circle(0, 46, 7, { fill: '#C9CED8' }) + S.path('M-6 -138 L-6 30', ln(5, '#FFFFFF33'));
  s += S.rect(-7, -200, 14, 56, 4, ol('#B9C0CC', 4.5));
  if (o.edge) {
    s += S.path('M-10 -200 L-20 -330 L4 -332 L10 -200 Z', ol('#C9D0DA', 5));
  } else {
    s += S.path(poly([[-26, -196], [26, -196], [56, -330], [-56, -330]], 14), ol('#C9D0DA', 5));
    s += S.path('M-22 -224 L-30 -306 M0 -224 L0 -308 M22 -224 L30 -306', ln(8, '#8E96A6')) + S.path('M-44 -320 L-26 -210', ln(4, '#FFFFFF'));
  }
  if (o.pancake) s += S.g(pancake({ y: -18, burnt: o.pancake === 'burnt' }), `translate(0 -332) rotate(${f(-o.rot)})`);
  return place(o, s);
}
// wooden spoon / cereal spoon (Bea): grip at (x, y), rot 0 = bowl up
function spoon(...args) {
  const o = A(args, ['x', 'y', 's', 'rot'], { col: '#DDE2EA', full: false });
  let s = S.rect(-9, -110, 18, 170, 9, ol(o.col, 4.5)) + S.ellipse(0, -150, 30, 44, ol(o.col, 5)) + S.ellipse(-4, -156, 18, 28, { fill: '#B9C0CC' });
  if (o.full) s += S.ellipse(0, -160, 24, 16, ol('#F4E3B8', 3.5));
  s += S.path('M-14 -176 Q-18 -150 -10 -128', ln(4, '#FFFFFF'));
  return place(o, s);
}

// ====================================================================== THE BOOK OF FAILS
// bookOfFails(x, y, s, rot, { open, vol: 1|2, title, pages: [leftLines, rightLines], scorch })
// closed: 200x250 composition book seen from the front (centre x, y); open: 400x250 spread.
function bookOfFails(...args) {
  const o = A(args, ['x', 'y', 's', 'rot'], { open: false, vol: 1, title: null, pages: null });
  const v2 = o.vol === 2;
  const cover = v2 ? '#D8262E' : '#2F6FB0', coverShade = v2 ? '#B01D24' : '#24578C';
  let s = '';
  if (!o.open) {
    // page block on the right side
    s += S.path(poly([[-96, -122], [106, -116], [112, 122], [-96, 128]], 10), ol('#F4EEDC', 5));
    s += S.path('M100 -100 L104 110 M92 -108 L96 116', ln(2.5, '#C9BFA4'));
    // tabs sticking out
    const tabs = v2 ? [['#3BD16F', -70]] : [['#FFD23F', -84], ['#FF6FA8', -30], ['#3BD16F', 20], ['#6FD3FF', 70]];
    for (const [c, y] of tabs) s += S.rect(98, y, 26, 26, 5, ol(c, 3.5));
    s += S.path(poly([[-104, -128], [96, -128], [96, 126], [-104, 126]], 14), ol(cover, 6));
    s += S.rect(-104, -128, 34, 254, 0, { fill: coverShade }) + S.path('M-70 -126 L-70 124', ln(4));
    // white tape label with marker lettering
    s += S.path(poly([[-58, -86], [84, -92], [86, -6], [-56, 0]], 4), ol('#FFFDF4', 4));
    const t1 = o.title || 'BOOK OF';
    s += S.g(T(t1, 14, -54, 30, '#1E1E2A') + T('FAILS', 14, -14, 42, v2 ? '#D8262E' : '#E8453C'), 'rotate(-2.5 14 -40)');
    if (v2) s += S.rect(-30, 24, 96, 40, 10, ol('#FFD23F', 4)) + T('VOL. 2', 18, 53, 28, '#1E1E2A');
    else {
      // scorch mark + burnt corner + tape + sticker: the book has been through things
      s += S.path('M96 70 L96 126 L40 126 Q56 112 64 100 Q74 108 80 92 Q90 96 96 70 Z', ol('#3A2A22', 4)) + S.ellipse(70, 106, 22, 10, { fill: '#1A120E', opacity: 0.5 });
      s += S.path(poly([[-60, 64], [8, 52], [12, 76], [-56, 88]], 2), { fill: '#FFF2B0', opacity: 0.85, stroke: LINE, 'stroke-width': 2.5 });
      s += S.g(S.path(C_STAR, ol('#FFD23F', 3.5)), 'translate(44 30) scale(0.9)');
      s += S.path('M-46 104 q14 -10 26 0 q12 10 24 0', ln(4, '#1A120E', 0.4));
    }
    s += S.path('M-62 -118 L84 -118', ln(4, '#FFFFFF55'));
  } else {
    s += S.path(poly([[-200, -118], [0, -108], [200, -118], [206, 126], [0, 134], [-206, 126]], 10), ol(cover, 6));
    s += S.path(poly([[-190, -110], [0, -100], [0, 122], [-192, 116]], 6), ol('#FFFDF4', 4)) + S.path(poly([[0, -100], [190, -110], [192, 116], [0, 122]], 6), ol('#FFFDF4', 4));
    let lines = '';
    for (let y = -70; y <= 100; y += 24) lines += `M-176 ${y} L-16 ${y + 4} M16 ${y + 4} L176 ${y} `;
    s += S.path(lines, ln(2.5, '#9FC4E8')) + S.path('M-150 -100 L-150 118', ln(2.5, '#F2A0A8'));
    s += S.path('M0 -100 L0 122', ln(5, '#C9BFA4'));
    const pages = o.pages || (v2 ? [['FAIL #1:', 'Talent show'], ['LESSON:', 'totally', 'worth it!']] : [['FAIL #312', 'Rocket', 'sneakers'], ['LESSON:', 'never wear', 'them indoors!!']]);
    const hand = (txt, x, y, size, col) => TF(txt, x, y, size, col, { 'text-anchor': 'start' });
    pages[0].forEach((t, i) => { s += hand(t, -168, -56 + i * 30, i ? 23 : 27, i ? '#2A3A6A' : '#E8453C'); });
    pages[1].forEach((t, i) => { s += hand(t, 24, -56 + i * 30, i ? 21 : 25, i ? '#2A3A6A' : '#3A8A3A'); });
    if (!v2) {
      // doodle: rocket sneaker + scribbled explosion
      s += S.g(S.path('M-40 0 L40 0 L40 -22 Q10 -30 -10 -22 L-40 -22 Z', ol('#FF8A3D', 3)) + S.path('M40 -12 l26 -8 l0 16 Z', ol('#FFD23F', 3)), 'translate(-120 84) scale(0.8)');
      s += S.path(C_STAR, { fill: 'none', stroke: '#E8453C', 'stroke-width': 3, transform: 'translate(-44 86) scale(0.8)' });
      s += S.circle(150, 82, 22, { fill: 'none', stroke: '#3BD16F', 'stroke-width': 4 }) + S.path('M140 82 l8 8 l14 -16', ln(4, '#3BD16F'));
    } else s += S.path('M30 50 l100 0', ln(3, '#2A3A6A', 0.4));
    s += S.rect(186, -80, 22, 30, 4, ol('#FFD23F', 3));
  }
  return place(o, s);
}
const C_STAR = 'M0 -26 L7 -8 L26 -8 L11 4 L17 23 L0 12 L-17 23 L-11 4 L-26 -8 L-7 -8 Z';

// ====================================================================== SCIENCE MAGIC: top hat, flasks, tray
// topHat(x, y, s, rot, { mouth: 'up'|'down'|'side', foam: 0..1, t })
// 'up'   : held upside down, opening on top — (x, y) = centre of the opening
// 'down' : worn/standing normally — (x, y) = centre of the brim
// 'side' : lying on its side, opening facing screen-right — (x, y) = centre of the opening
function topHat(...args) {
  const o = A(args, ['x', 'y', 's', 'rot'], { mouth: 'up', foam: 0, t: 0, band: '#D8262E' });
  const hat = '#26222E', hatHi = '#4A4458';
  let s = '';
  const body = (dir) => {
    // crown from the brim (y=0) toward dir (-1 up, +1 down)
    const h = 190 * dir;
    let b = S.path(`M-76 0 L-70 ${h} Q0 ${h + 16 * dir} 70 ${h} L76 0 Z`, ol(hat, 6));
    b += S.path(`M-74 ${34 * dir} L74 ${34 * dir} L75 ${60 * dir} L-75 ${60 * dir} Z`, ol(o.band, 4.5));
    b += S.path(`M-54 ${80 * dir} L-50 ${h - 10 * dir}`, ln(10, hatHi));
    b += S.path(F_SPARK(46, 120 * dir, 14), { fill: '#FFD23F', stroke: LINE, 'stroke-width': 3 });
    return b;
  };
  if (o.mouth === 'side') {
    s += S.g(body(-1) + S.ellipse(0, 0, 112, 26, ol(hat, 6)) + S.ellipse(0, 0, 76, 16, { fill: '#0E0C12' }), 'rotate(90)');
    if (o.foam > 0) s += foam({ x: 40, y: 0, r: 70, k: o.foam, seed: 3, n: 8 });
  } else if (o.mouth === 'down') {
    s += body(-1) + S.path('M-112 0 Q-120 18 -96 22 Q0 38 96 22 Q120 18 112 0 Q0 -22 -112 0 Z', ol(hat, 6)) + S.path('M-92 8 Q0 22 92 8', ln(4, hatHi));
  } else {
    s += body(1);
    s += S.ellipse(0, 0, 114, 28, ol(hat, 6)) + S.ellipse(0, 2, 78, 17, { fill: '#0E0C12' }) + S.path('M-96 -8 Q0 -28 96 -8', ln(4, hatHi));
    if (o.foam > 0) s += foam({ x: 0, y: -40 * o.foam, r: 80, k: o.foam, seed: 5, n: 9 });
  }
  return place(o, s);
}
const F_SPARK = (x, y, r) => `M${f(x)} ${f(y - r)} Q${f(x + r * 0.2)} ${f(y - r * 0.2)} ${f(x + r)} ${f(y)} Q${f(x + r * 0.2)} ${f(y + r * 0.2)} ${f(x)} ${f(y + r)} Q${f(x - r * 0.2)} ${f(y + r * 0.2)} ${f(x - r)} ${f(y)} Q${f(x - r * 0.2)} ${f(y - r * 0.2)} ${f(x)} ${f(y - r)} Z`;
// flask(x, y, s, rot, { col, fill 0..1, kind: 'erlenmeyer'|'beaker'|'round'|'tube', bubbles, t }) — (x, y) = bottom centre
function flask(...args) {
  const o = A(args, ['x', 'y', 's', 'rot'], { col: '#3BD16F', fill: 0.6, kind: 'erlenmeyer', bubbles: true, t: 0, glow: false });
  let d, top, bot = 0, wAt;
  if (o.kind === 'beaker') { d = poly([[-56, -150], [56, -150], [54, 0], [-54, 0]], 8); top = -150; wAt = () => 54; }
  else if (o.kind === 'tube') { d = 'M-18 -190 L18 -190 L18 -20 A18 18 0 0 1 -18 -20 Z'; top = -190; wAt = () => 18; }
  else if (o.kind === 'round') { d = 'M-16 -200 L16 -200 L16 -120 A62 62 0 1 1 -16 -120 Z'; top = -200; wAt = (y) => (y < -120 ? 16 : 62); }
  else { d = poly([[-17, -190], [17, -190], [17, -120], [64, -8], [56, 0], [-56, 0], [-64, -8], [-17, -120]], 10); top = -190; wAt = (y) => (y < -120 ? 17 : 17 + (64 - 17) * clamp((y + 120) / 112, 0, 1)); }
  const lvl = lerp(bot - 4, top + 30, clamp(o.fill, 0, 1));
  let inner = S.rect(-80, -260, 160, 270, 0, { fill: '#E6F6FF', opacity: 0.5 });
  if (o.fill > 0) {
    inner += S.rect(-80, lvl, 160, 280, 0, { fill: o.col });
    inner += S.rect(-80, lvl, 160, 14, 0, { fill: '#FFFFFF', opacity: 0.35 });
    if (o.bubbles) {
      let b = '';
      for (let i = 0; i < 5; i++) {
        const u = (o.t * (0.6 + 0.3 * hash(i)) + hash(i * 3)) % 1;
        const y = lerp(-8, lvl + 10, u), x = (hash(i * 7) - 0.5) * wAt(y) * 1.2;
        if (y > lvl) b += `M${f(x - 6)} ${f(y)} a6 6 0 1 0 12 0 a6 6 0 1 0 -12 0 Z `;
      }
      if (b) inner += S.path(b, { fill: '#FFFFFF', opacity: 0.6 });
    }
  }
  inner += S.path(`M${-wAt(-40) + 16} -34 L${-wAt(-100) + 12} -100`, ln(8, '#FFFFFF', 0.85));
  let s = '';
  if (o.glow && o.fill > 0) s += S.circle(0, (lvl + bot) / 2, 110, { fill: o.col, opacity: 0.18 });
  s += clipped(d, 'none', inner, 6);
  s += S.rect(-24, top - 8, 48, 16, 6, ol('#E6F6FF', 4.5));
  return place(o, s);
}
// tray with three flasks (carried by YOU on stage); (x, y) = tray centre; tilt (deg) tips the flasks
function flaskTray(...args) {
  const o = A(args, ['x', 'y', 's', 'rot'], { cols: ['#3BD16F', '#FF6FA8', '#FFD23F'], fill: [0.7, 0.55, 0.65], tilt: 0, t: 0 });
  let s = '';
  o.cols.forEach((c, i) => { const x = -100 + i * 100; s += flask({ x, y: -6, s: 0.72, rot: o.tilt * (0.6 + 0.3 * i), col: c, fill: o.fill[i] ?? 0.6, kind: i === 1 ? 'round' : 'erlenmeyer', t: o.t + i }); });
  s += S.path('M-170 -8 L170 -8 L156 14 L-156 14 Z', ol('#B9C0CC', 5)) + S.path('M-160 -2 L160 -2', ln(4, '#FFFFFF88'));
  return place(o, s);
}

// ====================================================================== SCHOOL: skateboard, dodgeball, ball bin, tray, spaghetti, quiz
// skateboard(x, y, s, rot, { flipK 0..1, deck, graphic }) — side view, (x, y) = deck centre; wheels touch y + 52.
// flipK = kickflip rotation around the long axis (0 / 1 = wheels down, 0.5 = upside down).
function skateboard(...args) {
  const o = A(args, ['x', 'y', 's', 'rot'], { flipK: 0, deck: '#2EC4B6', graphic: '#FFD23F', grip: '#2A2A33', wheel: '#FFF4D6' });
  const ph = (o.flipK || 0) * Math.PI * 2;
  const sn = Math.sin(ph), cs = Math.cos(ph);
  const Lh = 220, w = 112, th = 16;
  const hh = Math.max(th / 2, (w / 2) * Math.abs(sn) + (th / 2) * Math.abs(cs));
  const up = -cs; // tails curl toward the deck's top side
  const tailUp = 30 * up;
  const deckD = `M${-Lh} ${f(-hh + tailUp)} Q${-Lh + 60} ${f(-hh)} ${-Lh + 90} ${f(-hh)} L${Lh - 90} ${f(-hh)} Q${Lh - 60} ${f(-hh)} ${Lh} ${f(-hh + tailUp)} L${Lh} ${f(hh + tailUp)} Q${Lh - 60} ${f(hh)} ${Lh - 90} ${f(hh)} L${-Lh + 90} ${f(hh)} Q${-Lh + 60} ${f(hh)} ${-Lh} ${f(hh + tailUp)} Z`;
  const showBottom = sn > 0.08, showTop = sn < -0.08;
  const wheels = () => {
    let w2 = '';
    const off = 34 * cs + 4 * Math.sign(cs || 1);
    for (const x of [-130, 130]) {
      w2 += S.path(`M${x - 26} ${f(hh * Math.sign(cs || 1) * 0.4)} L${x + 26} ${f(hh * Math.sign(cs || 1) * 0.4)} L${x + 10} ${f(off)} L${x - 10} ${f(off)} Z`, ol('#B9C0CC', 4));
      w2 += S.ellipse(x - 18, off + 6 * cs, 20, 20 * Math.max(0.35, Math.abs(cs)), ol(o.wheel, 4)) + S.ellipse(x + 18, off + 6 * cs, 20, 20 * Math.max(0.35, Math.abs(cs)), ol(o.wheel, 4));
    }
    return w2;
  };
  let s = '';
  if (!showBottom) s += wheels();
  let inner = '';
  if (showBottom) {
    inner += S.path(`M-40 ${-hh} L-10 0 L-36 0 L10 ${hh} L-4 6 L22 6 L-6 ${-hh} Z`, { fill: o.graphic, stroke: LINE, 'stroke-width': 3 });
    inner += S.path(`M${-Lh + 40} ${-hh * 0.6} L${-Lh + 120} ${-hh * 0.6} M${Lh - 120} ${hh * 0.6} L${Lh - 40} ${hh * 0.6}`, ln(5, '#FFFFFF88'));
  } else if (showTop) {
    let sp = '';
    for (let i = 0; i < 24; i++) sp += `M${f((hash(i) - 0.5) * 2 * Lh * 0.9)} ${f((hash(i * 3) - 0.5) * 2 * hh * 0.8)} l3 0 `;
    inner += S.path(sp, ln(3, '#55556A'));
  } else inner += S.rect(-Lh - 10, -hh - 40, 2 * Lh + 20, hh + 40, 0, { fill: o.grip }) + S.path(`M${-Lh + 60} ${f(hh * 0.4)} L${Lh - 60} ${f(hh * 0.4)}`, ln(3, '#FFFFFF66'));
  s += clipped(deckD, showTop ? o.grip : o.deck, inner, 5.5);
  if (showBottom) s += wheels();
  return place(o, s);
}
// dodgeball(x, y, s, rot, { col, squash 0..1 (impact squash along x), r }) — centre
function dodgeball(...args) {
  const o = A(args, ['x', 'y', 's', 'rot'], { col: '#E8453C', squash: 0, r: 62, shine: true });
  const r = o.r, sq = clamp(o.squash, 0, 0.6);
  const shadeCol = { '#E8453C': '#B8302A', '#3B82F6': '#2A62C0', '#FFD23F': '#E0A81A', '#3BD16F': '#2A9A50' }[o.col] || '#00000033';
  let inner = S.circle(r * 0.35, r * 0.4, r * 0.95, { fill: shadeCol, opacity: 0.55 });
  let dots = '';
  for (let i = 0; i < 16; i++) { const a = i * 2.4, d = r * 0.85 * Math.sqrt(hash(i + 2)); dots += `M${f(Math.cos(a) * d - 3)} ${f(Math.sin(a) * d)} a3 3 0 1 0 6 0 a3 3 0 1 0 -6 0 Z `; }
  inner += S.path(dots, { fill: '#000', opacity: 0.12 });
  inner += S.path(`M${-r} ${f(-r * 0.1)} Q0 ${f(r * 0.35)} ${r} ${f(-r * 0.1)}`, ln(4, '#00000044'));
  if (o.shine) inner += S.path(`M${f(-r * 0.6)} ${f(-r * 0.25)} Q${f(-r * 0.5)} ${f(-r * 0.6)} ${f(-r * 0.15)} ${f(-r * 0.7)}`, ln(r * 0.12, '#FFFFFF', 0.8));
  const id = cid('db');
  const s = S.clipDef(id, S.circle(0, 0, r)) + S.circle(0, 0, r, { fill: o.col }) + S.g(inner, null, { 'clip-path': `url(#${id})` }) + S.circle(0, 0, r, ol('none', 6));
  return place(o, sq ? S.g(s, `scale(${f(1 - sq)} ${f(1 + sq * 0.6)})`) : s);
}
const BALL_COLS = ['#E8453C', '#3B82F6', '#FFD23F', '#3BD16F', '#FF8A3D', '#E8453C', '#B06BFF'];
// gym ball cart. ballBin(...) draws the whole cart; ballBin.layers(...) -> { back, front } so a character can sit inside.
// (x, y) = floor centre; fill 0..1 how full; spill: number of balls bouncing on top.
function ballBinLayers(...args) {
  const o = A(args, ['x', 'y', 's', 'rot'], { fill: 1, t: 0, seed: 2 });
  const W = 230, top = -420, bot = -90;
  let back = S.path(poly([[-W, top], [W, top], [W - 16, bot], [-W + 16, bot]], 8), { fill: '#2C3442', opacity: 0.9, stroke: LINE, 'stroke-width': 6 });
  let grid = '';
  for (let x = -W + 40; x < W; x += 46) grid += `M${x} ${top + 6} L${x * 0.95} ${bot - 4} `;
  for (let y = top + 50; y < bot; y += 50) grid += `M${-W + 8} ${y} L${W - 8} ${y} `;
  back += S.path(grid, ln(4, '#5A6478'));
  // balls inside (behind a character)
  const lvl = lerp(bot, top - 40, clamp(o.fill, 0, 1));
  for (let i = 0; i < 14; i++) {
    const x = -W + 50 + ((i * 67) % (2 * W - 100)), y = lvl + 30 + (i % 3) * 46;
    if (y < bot) back += dodgeball({ x, y, r: 56, col: BALL_COLS[(i + o.seed) % BALL_COLS.length], shine: false });
  }
  let front = '';
  for (let i = 0; i < 6; i++) {
    const x = -W + 60 + i * 74 + (hash(i + o.seed) - 0.5) * 20, y = lvl - 14 + (hash(i * 3 + o.seed) - 0.5) * 34;
    front += dodgeball({ x, y, r: 58, col: BALL_COLS[(i * 2 + o.seed) % BALL_COLS.length] });
  }
  let fg = S.path(poly([[-W, top + 150], [W, top + 150], [W - 16, bot], [-W + 16, bot]], 8), { fill: 'none', stroke: LINE, 'stroke-width': 6 });
  let fgrid = '';
  for (let x = -W + 40; x < W; x += 46) fgrid += `M${x} ${top + 150} L${x * 0.95} ${bot} `;
  for (let y = top + 200; y < bot; y += 50) fgrid += `M${-W + 8} ${y} L${W - 8} ${y} `;
  fg += S.path(fgrid, ln(10, LINE)) + S.path(fgrid, ln(5, '#9AA4B8'));
  fg += S.rect(-W - 10, top + 140, 2 * W + 20, 22, 8, ol('#C9CED8', 5)) + S.rect(-W + 4, bot - 6, 2 * W - 8, 20, 6, ol('#C9CED8', 5));
  for (const x of [-W + 30, W - 30]) fg += S.rect(x - 7, bot + 10, 14, 50, 4, ol('#8E96A6', 4)) + S.circle(x, -26, 26, ol('#2A2A33', 5)) + S.circle(x, -26, 9, { fill: '#8E96A6' });
  front = front + fg;
  return { back: place(o, back), front: place(o, front) };
}
function ballBin(...args) { const l = ballBinLayers(...args); return l.back + l.front; }
ballBin.layers = ballBinLayers;
// cafeteria lunch tray seen from the front-above (held level); (x, y) = centre. spaghetti: 0..1 (0 = empty plate), milk: true/false
function lunchTray(...args) {
  const o = A(args, ['x', 'y', 's', 'rot'], { spaghetti: 1, milk: true, apple: true, col: '#7FB8E8' });
  let s = S.path('M-200 -40 L200 -40 L220 34 L-220 34 Z', ol(o.col, 6)) + S.path('M-220 34 L220 34 L220 48 L-220 48 Z', ol('#5A92C4', 5));
  s += S.path('M-180 -30 L-30 -30 L-26 22 L-192 22 Z', { fill: '#6AA4D8' }) + S.path('M0 -30 L170 -30 L184 22 L4 22 Z', { fill: '#6AA4D8' });
  s += S.ellipse(-110, -4, 76, 22, ol('#FFFFFF', 4.5));
  if (o.spaghetti > 0) s += spaghetti({ x: -110, y: -12, s: 0.8 * (0.5 + 0.5 * o.spaghetti), mode: 'plate' });
  if (o.milk) s += S.path('M60 10 L60 -70 L76 -92 L108 -92 L124 -70 L124 10 Z', ol('#FFFFFF', 4.5)) + S.path('M60 -70 L124 -70', ln(4)) + S.rect(66, -50, 52, 34, 4, { fill: '#3B82F6' }) + TF('MILK', 92, -26, 17, '#FFFFFF');
  if (o.apple) s += S.circle(158, -12, 26, ol('#E8453C', 4.5)) + S.path('M158 -36 q2 -12 8 -16', ln(4)) + S.path('M146 -22 q-2 8 4 14', ln(4, '#FFFFFF88'));
  return place(o, s);
}
// spaghetti(x, y, s, rot, { mode: 'plate'|'fly'|'splat'|'drape', k 0..1 (spread), t, seed, meatballs })
// plate: a heap (centre); fly: a flying clump spreading with k; splat: on a surface (y = surface); drape: strands hanging down from y (for heads/shoulders)
function spaghetti(...args) {
  const o = A(args, ['x', 'y', 's', 'rot'], { mode: 'plate', k: 0.5, t: 0, seed: 1, meatballs: 2, sauce: true, w: 5 });
  const pasta = '#F4D27A', sauce = '#D8402E';
  let d = '';
  let s = '';
  const R = (i, k) => hash(o.seed * 13.7 + i * 3.1 + k);
  if (o.mode === 'plate') {
    for (let i = 0; i < 9; i++) { const y = -10 - R(i, 1) * 34, x = (R(i, 2) - 0.5) * 80; d += `M${f(x - 40)} ${f(y + 10)} q20 -26 40 -6 q20 20 40 -4 `; }
    s += S.ellipse(0, -14, 64, 28, { fill: pasta, stroke: LINE, 'stroke-width': o.w });
    s += S.path(d, ln(o.w * 0.6, '#E0B856'));
    if (o.sauce) s += S.path('M-34 -30 Q-10 -52 22 -40 Q40 -30 24 -18 Q-6 -10 -30 -18 Z', ol(sauce, 4));
    for (let i = 0; i < o.meatballs; i++) s += S.circle(-14 + i * 26, -32 + i * 6, 13, ol('#8A4A2A', 4)) + S.circle(-18 + i * 26, -36 + i * 6, 3.5, { fill: '#B86A40' });
    return place(o, s);
  }
  if (o.mode === 'drape') {
    // hanging strands from a line (width 200) + a little heap on top
    for (let i = 0; i < 9; i++) {
      const x = -100 + i * 25 + (R(i, 1) - 0.5) * 14, L = 60 + R(i, 2) * 140 * o.k;
      const sw = 10 + R(i, 3) * 10;
      d += `M${f(x)} 0 q${f(sw)} ${f(L * 0.3)} 0 ${f(L * 0.6)} q${f(-sw)} ${f(L * 0.25)} ${f(sw * 0.4)} ${f(L * 0.4)} `;
    }
    s += S.path(d, ln(o.w * 2 + 1.2 * o.w, LINE)) + S.path(d, ln(o.w * 1.6, pasta));
    let heap = '';
    for (let i = 0; i < 6; i++) heap += `M${f(-90 + i * 34)} ${f(-6)} q16 -22 34 -2 `;
    s += S.ellipse(0, -8, 110, 22, ol(pasta, o.w)) + S.path(heap, ln(o.w * 0.6, '#E0B856'));
    if (o.sauce) s += S.path('M-60 -20 Q-20 -40 30 -24 Q60 -14 40 0 L46 30 Q48 40 40 40 Q32 40 34 26 L30 4 Q-20 8 -54 -2 Z', ol(sauce, 4));
    for (let i = 0; i < o.meatballs; i++) s += S.circle(-30 + i * 48, -22 - i * 4, 15, ol('#8A4A2A', 4));
    return place(o, s);
  }
  const k = clamp(o.k, 0, 1);
  const n = o.mode === 'splat' ? 10 : 8;
  for (let i = 0; i < n; i++) {
    const a = o.mode === 'splat' ? Math.PI + R(i, 1) * Math.PI : R(i, 1) * Math.PI * 2;
    const dist = (20 + 120 * R(i, 2)) * (o.mode === 'splat' ? 1 : 0.3 + k);
    const cx = Math.cos(a) * dist, cy = Math.sin(a) * dist * (o.mode === 'splat' ? 0.35 : 0.8);
    const L = 40 + 50 * R(i, 3), wob = Math.sin(o.t * 9 + i) * 10;
    d += `M${f(cx - L)} ${f(cy)} q${f(L * 0.5)} ${f(-24 + wob)} ${f(L)} 0 q${f(L * 0.5)} ${f(24 - wob)} ${f(L)} 0 `;
  }
  if (o.mode === 'splat') s += S.path('M-130 0 Q-120 -40 -60 -36 Q-30 -70 20 -50 Q70 -66 100 -34 Q150 -30 140 0 Z', ol(sauce, 5));
  else if (o.sauce) for (let i = 0; i < 6; i++) { const a = R(i, 7) * 6.28, dd = 30 + 110 * k * R(i, 8); s += S.circle(Math.cos(a) * dd, Math.sin(a) * dd, 8 + 8 * R(i, 9), ol(sauce, 3.5)); }
  s += S.path(d, ln(o.w * 2.4, LINE)) + S.path(d, ln(o.w * 1.4, pasta));
  for (let i = 0; i < o.meatballs; i++) { const a = R(i, 5) * 6.28, dd = (o.mode === 'splat' ? 50 : 60 * (0.3 + k)) * R(i, 6); s += S.circle(Math.cos(a) * dd, Math.sin(a) * dd * 0.5 - (o.mode === 'splat' ? 20 : 0), 15, ol('#8A4A2A', 4)); }
  return place(o, s);
}
// pop-quiz sheet, (x, y) = centre; grade: '100%' | 'A+' | null; title
function quizPaper(...args) {
  const o = A(args, ['x', 'y', 's', 'rot'], { grade: null, title: 'POP QUIZ', lines: 8, name: '' });
  let s = S.path('M-100 -130 L80 -130 L100 -110 L100 130 L-100 130 Z', ol('#FFFFFF', 5)) + S.path('M80 -130 L80 -110 L100 -110', ol('#E4E8F0', 3.5));
  s += T(o.title, -6, -92, 30, '#2A3A6A');
  if (o.name) s += TF(o.name, -60, -60, 16, '#3A5AC8', { 'text-anchor': 'start' });
  let d = '';
  for (let i = 0; i < o.lines; i++) { const y = -46 + i * 22; d += `M-80 ${y} L-70 ${y} M-56 ${y} L${f(20 + hash(i) * 50)} ${y} `; }
  s += S.path(d, ln(4, '#9AA6C0'));
  if (o.grade) s += S.circle(48, 70, 42, { fill: '#FFFFFF', stroke: '#E8243C', 'stroke-width': 6 }) + T(o.grade, 48, 82, o.grade.length > 3 ? 28 : 36, '#E8243C', { transform: 'rotate(-10 48 70)' });
  return place(o, s);
}
// a stack of quiz papers (Mr. Fig); (x, y) = centre
function paperStack(...args) {
  const o = A(args, ['x', 'y', 's', 'rot'], { n: 6 });
  let s = '';
  for (let i = o.n - 1; i >= 0; i--) s += S.path(poly([[-110, -76], [110, -80], [112, 70], [-108, 74]], 4), { ...ol('#FFFFFF', 4), transform: `translate(${f((hash(i) - 0.5) * 10)} ${f(-i * 6)}) rotate(${f((hash(i * 3) - 0.5) * 5)})` });
  s += T('POP QUIZ', 0, -30, 30, '#2A3A6A');
  let d = '';
  for (let i = 0; i < 4; i++) d += `M-80 ${f(-2 + i * 20)} L${f(30 + hash(i) * 50)} ${f(-2 + i * 20)} `;
  s += S.path(d, ln(4, '#9AA6C0'));
  return place(o, s);
}
// whiteboard marker, grip at (x, y), rot 0 = tip up
function marker(...args) {
  const o = A(args, ['x', 'y', 's', 'rot'], { col: '#2E6BE0', cap: true });
  let s = S.rect(-15, -90, 30, 160, 10, ol('#F4F6FA', 4.5)) + S.rect(-15, 40, 30, 30, 8, ol(o.col, 4.5));
  s += o.cap ? S.rect(-17, -140, 34, 64, 12, ol(o.col, 4.5)) + S.rect(14, -134, 8, 44, 3, ol(o.col, 3)) : S.path('M-12 -90 L-8 -116 L8 -116 L12 -90 Z', ol(o.col, 4));
  s += S.rect(-15, -40, 30, 26, 0, { fill: o.col, opacity: 0.85 });
  return place(o, s);
}

// ====================================================================== BIRTHDAY CAKE (YOU respawns inside it)
// birthdayCake({ x, y, s, smash 0..1, text, candles, t }) — (x, y) = bottom centre of the cake board.
// birthdayCake.layers(...) -> { back, front }: draw a character between them to have him burst out of the top.
function birthdayCakeLayers(...args) {
  const o = A(args, ['x', 'y', 's', 'rot'], { smash: 0, text: 'HAPPY BDAY MR. FIG', candles: 5, t: 0 });
  const k = clamp(o.smash, 0, 1);
  const sponge = '#F7E1B5', frost = '#FFF4F8', pink = '#FF8FC0', drip = '#FF6FA8';
  const W1 = 250, H1 = 190, W2 = 170, H2 = 150;
  let back = S.ellipse(0, -10, W1 + 50, 30, ol('#E8EDF4', 6));
  let front = '';
  const words = o.text.split(' ');
  const mid = Math.ceil(words.length / 2);
  const l1 = words.slice(0, mid).join(' '), l2 = words.slice(mid).join(' ');
  if (k < 0.05) {
    // intact: two tiers + candles
    back += S.path(poly([[-W1, -20 - H1], [W1, -20 - H1], [W1, -20], [-W1, -20]], 20), ol(pink, 6));
    back += S.path(`M${-W1} ${-20 - H1 + 20} ` + Array.from({ length: 9 }, (_, i) => { const x = -W1 + (i + 0.5) * (2 * W1 / 9); return `L${f(x - 14)} ${-20 - H1 + 20} Q${f(x)} ${f(-20 - H1 + 60 + 20 * hash(i))} ${f(x + 14)} ${-20 - H1 + 20}`; }).join(' ') + ` L${W1} ${-20 - H1 + 20} L${W1} ${-20 - H1 + 8} L${-W1} ${-20 - H1 + 8} Z`, ol(frost, 5));
    back += T(l1, 0, -20 - H1 + 104, 50, '#2EC4B6', { stroke: '#FFFFFF', 'stroke-width': 10, 'paint-order': 'stroke' }) + T(l2, 0, -20 - H1 + 160, 46, '#7A4FD6', { stroke: '#FFFFFF', 'stroke-width': 10, 'paint-order': 'stroke' });
    const y2 = -20 - H1;
    back += S.path(poly([[-W2, y2 - H2], [W2, y2 - H2], [W2, y2], [-W2, y2]], 18), ol(frost, 6));
    back += S.path(`M${-W2} ${y2 - H2 + 16} ` + Array.from({ length: 7 }, (_, i) => { const x = -W2 + (i + 0.5) * (2 * W2 / 7); return `L${f(x - 12)} ${y2 - H2 + 16} Q${f(x)} ${f(y2 - H2 + 56 + 18 * hash(i + 4))} ${f(x + 12)} ${y2 - H2 + 16}`; }).join(' ') + ` L${W2} ${y2 - H2 + 16} L${W2} ${y2 - H2 + 4} L${-W2} ${y2 - H2 + 4} Z`, ol(drip, 5));
    let spr = '';
    for (let i = 0; i < 26; i++) { const x = (hash(i) - 0.5) * 2 * (W2 - 20), y = y2 - H2 + 70 + hash(i * 3) * (H2 - 90); spr += `M${f(x)} ${f(y)} l${f(8 * Math.cos(i))} ${f(8 * Math.sin(i))} `; }
    back += S.path(spr, ln(6, '#3BD16F')) + S.path(spr.replace(/l(-?[\d.]+) (-?[\d.]+)/g, (m, a, b) => `l${f(-b)} ${f(a)}`), ln(6, '#FFD23F'));
    for (let i = 0; i < o.candles; i++) {
      const x = -W2 + 40 + i * ((2 * W2 - 80) / Math.max(1, o.candles - 1)), y = y2 - H2;
      back += S.rect(x - 9, y - 80, 18, 82, 5, ol(['#6FD3FF', '#FFD23F', '#FF6FA8', '#3BD16F', '#B06BFF'][i % 5], 4));
      const fl = 1 + 0.15 * Math.sin(o.t * 20 + i * 2);
      back += S.path(`M${f(x)} ${f(y - 120 * fl + 20)} Q${f(x + 14)} ${f(y - 96)} ${f(x)} ${f(y - 82)} Q${f(x - 14)} ${f(y - 96)} ${f(x)} ${f(y - 120 * fl + 20)} Z`, ol('#FFB020', 3.5)) + S.ellipse(x, y - 92, 4, 8, { fill: '#FFF2A0' });
    }
    return { back: place(o, back), front: place(o, front) };
  }
  // smashed: the top tier is gone, the base tier is broken open; the front wall keeps the text
  const jag = (y0, amp, n, seed) => Array.from({ length: n + 1 }, (_, i) => [-W1 + (2 * W1 * i) / n, y0 - amp * (i % 2 ? 0.2 + hash(i + seed) : 0.9 + 0.3 * hash(i * 2 + seed))]);
  const topY = -20 - H1 + 40 * k;
  const backEdge = jag(topY - 30, 40, 8, 1);
  back += S.path('M' + backEdge.map(P).join(' L') + ` L${W1} -20 L${-W1} -20 Z`, ol(sponge, 6));
  back += S.path('M' + backEdge.map(P).join(' L'), ln(16, pink));
  back += S.path(`M${-W1 + 30} ${topY + 40} L${W1 - 30} ${topY + 40}`, ln(10, '#FFB8D6'));
  const frontEdge = jag(topY + 60, 50, 10, 7);
  let fw = S.path('M' + frontEdge.map(P).join(' L') + ` L${W1} -20 L${-W1} -20 Z`, { fill: pink });
  fw += S.path('M' + frontEdge.map(P).join(' L'), ln(22, sponge)) + S.path('M' + frontEdge.map(P).join(' L'), ln(8, '#FFF4E0'));
  fw += S.path('M' + frontEdge.map(P).join(' L') + ` L${W1} -20 L${-W1} -20 Z`, ol('none', 6));
  fw += T(l1, -6, -84, 44, '#2EC4B6', { stroke: '#FFFFFF', 'stroke-width': 9, 'paint-order': 'stroke', transform: 'rotate(-3 0 -84)' });
  fw += T(l2, 10, -36, 40, '#7A4FD6', { stroke: '#FFFFFF', 'stroke-width': 9, 'paint-order': 'stroke' });
  front += fw;
  // flying chunks + frosting splats
  let chunks = '';
  for (let i = 0; i < 9; i++) {
    const a = -Math.PI * (0.15 + 0.7 * hash(i * 5)), dist = 120 + 380 * k * hash(i * 9 + 1);
    const x = Math.cos(a) * dist * 1.2, y = topY - 40 + Math.sin(a) * dist + 300 * k * k * hash(i);
    const r = 14 + 18 * hash(i * 2);
    chunks += S.g(S.path(poly([[-r, -r * 0.7], [r, -r * 0.8], [r * 0.9, r * 0.7], [-r * 1.1, r * 0.6]], 5), ol(i % 3 ? sponge : frost, 4)) + S.path(`M${-r} ${-r * 0.7} L${r} ${-r * 0.8}`, ln(7, pink)), `translate(${f(x)} ${f(y)}) rotate(${f(k * 300 * (hash(i) - 0.5))})`);
  }
  front += chunks;
  return { back: place(o, back), front: place(o, front) };
}
function birthdayCake(...args) { const l = birthdayCakeLayers(...args); return l.back + l.front; }
birthdayCake.layers = birthdayCakeLayers;

// ====================================================================== TALENT SHOW
// trophy({ x, y, s, rot, text }) — small golden cup on a base with a plaque; (x, y) = bottom centre
function trophy(...args) {
  const o = A(args, ['x', 'y', 's', 'rot'], { text: 'MOST UNFORGETTABLE ACT', shine: 1 });
  let s = S.path(poly([[-116, -110], [116, -110], [124, 0], [-124, 0]], 10), ol('#7A4A2A', 6));
  s += S.path(poly([[-102, -100], [102, -100], [104, -10], [-104, -10]], 5), ol('#F4E3B8', 4));
  const words = o.text.split(' ');
  const lines = words.length >= 3 ? [words[0], words.slice(1, -1).join(' '), words[words.length - 1]] : words;
  lines.forEach((wd, i) => { s += T(wd, 0, -76 + i * 28 + (3 - lines.length) * 14, wd.length > 9 ? 22 : 24, '#5A3418'); });
  s += S.path('M-34 -110 L34 -110 L24 -136 L-24 -136 Z', ol('#E39B12', 5)) + S.rect(-12, -150, 24, 20, 4, ol('#FFC531', 5));
  // handles
  s += S.path('M-74 -260 Q-140 -262 -126 -204 Q-112 -170 -56 -176', ln(20, LINE)) + S.path('M-74 -260 Q-140 -262 -126 -204 Q-112 -170 -56 -176', ln(10, '#FFC531'));
  s += S.path('M74 -260 Q140 -262 126 -204 Q112 -170 56 -176', ln(20, LINE)) + S.path('M74 -260 Q140 -262 126 -204 Q112 -170 56 -176', ln(10, '#FFC531'));
  s += S.path('M-92 -290 L92 -290 Q88 -180 0 -146 Q-88 -180 -92 -290 Z', ol('url(#exGold)', 6));
  s += S.ellipse(0, -290, 92, 18, ol('#FFE27A', 5)) + S.path(F_SPARK(0, -224, 26), ol('#FFF6C0', 3.5));
  s += S.path('M-62 -270 Q-58 -210 -30 -180', ln(9, '#FFFFFF', 0.8));
  if (o.shine) s += S.path(F_SPARK(70, -320, 18), { fill: '#FFFFFF', opacity: f(o.shine) }) + S.path(F_SPARK(-100, -150, 12), { fill: '#FFFFFF', opacity: f(o.shine * 0.8) });
  return place(o, s);
}
// Bea's hand-made sign "GO MUSHROOM!" with a crayon mushroom (a YOU-mushroom); (x, y) = centre of the board.
// stick: true adds a wooden stick below (held up like a protest sign), t wiggles the crayon a little
function goSign(...args) {
  const o = A(args, ['x', 'y', 's', 'rot'], { stick: false, text: 'GO MUSHROOM!', t: 0 });
  let s = '';
  if (o.stick) s += S.rect(-14, 80, 28, 330, 8, ol('#C98A4A', 5)) + S.path('M-4 100 L-4 390', ln(4, '#E8B070'));
  s += S.path(poly([[-200, -140], [196, -146], [204, 138], [-196, 144]], 10), ol('#FFFDF2', 6));
  s += S.path('M-200 -140 L-180 -120 M196 -146 L176 -126', ln(3, '#E4DCC4'));
  // crayon letters, each a little wobbly
  const cols = ['#E8453C', '#FF8A3D', '#2E7BD1', '#3BAA4A', '#B06BFF', '#E8453C', '#2E7BD1', '#FF6FA8', '#3BAA4A', '#FF8A3D', '#E8453C', '#2E7BD1'];
  const chars = o.text.split('');
  const line1 = o.text.split(' ')[0], rest = o.text.slice(line1.length + 1);
  const drawWord = (w, cx, cy, size, k0) => {
    let out = '';
    const step = size * (w.length > 4 ? 0.66 : 0.6);
    const x0 = cx - (w.length - 1) * step / 2;
    w.split('').forEach((ch, i) => {
      const r = (hash(i * 3 + k0) - 0.5) * 18 + Math.sin(o.t * 2 + i) * 2;
      const c = cols[(i + k0) % cols.length];
      out += T(ch, x0 + i * step, cy + (hash(i + k0) - 0.5) * 10, size, c, { stroke: c, 'stroke-width': 3, 'stroke-dasharray': '7 3', transform: `rotate(${f(r)} ${f(x0 + i * step)} ${f(cy)})` });
    });
    return out;
  };
  s += drawWord(line1, -96, -40, 100, 0) + drawWord(rest, 0, 100, 56, 4);
  void chars;
  // crayon YOU-mushroom: orange cap with a V notch, white face, big eyes, red stem-body
  const m = S.path('M108 0 Q100 -90 160 -96 Q220 -90 212 0 Q190 -10 172 4 L160 -14 L148 4 Q130 -10 108 0 Z', { fill: '#FF8A2A', stroke: '#C2551A', 'stroke-width': 4, 'stroke-dasharray': '9 3' }) +
    S.path('M128 4 L192 4 L190 60 L130 60 Z', { fill: '#FFFFFF', stroke: '#2A2A33', 'stroke-width': 3.5 }) +
    S.circle(148, 26, 10, { fill: 'none', stroke: '#2A2A33', 'stroke-width': 3.5 }) + S.circle(172, 26, 10, { fill: 'none', stroke: '#2A2A33', 'stroke-width': 3.5 }) +
    S.circle(149, 28, 3.5, { fill: '#2A2A33' }) + S.circle(173, 28, 3.5, { fill: '#2A2A33' }) + S.path('M150 46 Q160 54 170 46', { fill: 'none', stroke: '#2A2A33', 'stroke-width': 3.5 }) +
    S.path('M136 60 L184 60 L190 112 L130 112 Z', { fill: '#E8453C', stroke: '#B02E2E', 'stroke-width': 3.5, 'stroke-dasharray': '8 3' }) +
    S.path('M120 -40 l10 -8 M196 -50 l8 6 M160 -80 l0 -10', { fill: 'none', stroke: '#FFFFFF', 'stroke-width': 6, 'stroke-linecap': 'round' });
  s += S.g(m, 'translate(-46 -50) scale(0.8)');
  // hearts and a star doodle
  s += S.path('M-166 -100 c-10 -14 -30 -4 -20 10 l20 18 l20 -18 c10 -14 -10 -24 -20 -10 Z', { fill: '#FF6FA8', stroke: '#E0457E', 'stroke-width': 3 });
  s += S.path(C_STAR, { fill: '#FFD23F', stroke: '#E0A81A', 'stroke-width': 3, transform: 'translate(170 -110) scale(0.7)' });
  return place(o, s);
}

// ====================================================================== WORKSHOP: rocket sneakers
// rocketSneakers({ x, y, s, rot, flame 0..1, t, col, pair }) — side view facing screen-left; (x, y) = sole bottom centre.
// Also used on Ivy's feet (cast option rockets). pair: true draws two, slightly offset.
function rocketSneakers(...args) {
  const o = A(args, ['x', 'y', 's', 'rot'], { flame: 0, t: 0, col: '#7A4FD6', pair: false });
  const one = (dx, dim) => {
    let s = '';
    const fl = clamp(o.flame, 0, 1);
    if (fl > 0.01) {
      const L = (150 + 50 * Math.sin(o.t * 37)) * fl, w = 34 * (0.7 + 0.3 * fl);
      s += S.path(`M120 -66 Q${f(120 + L * 0.5)} ${f(-66 - w)} ${f(120 + L)} -66 Q${f(120 + L * 0.5)} ${f(-66 + w)} 120 -66 Z`, { fill: '#FF8A1F', stroke: LINE, 'stroke-width': 5 });
      s += S.path(`M120 -66 Q${f(120 + L * 0.35)} ${f(-66 - w * 0.5)} ${f(120 + L * 0.6)} -66 Q${f(120 + L * 0.35)} ${f(-66 + w * 0.5)} 120 -66 Z`, { fill: '#FFE14D' });
    }
    // rocket booster on the heel
    s += S.path('M40 -94 L112 -94 L126 -80 L126 -52 L112 -38 L40 -38 Z', ol('#C9CED8', 5)) + S.path('M60 -94 L60 -38 M92 -94 L92 -38', ln(4, '#8E96A6'));
    s += S.path('M48 -94 L30 -118 L70 -94 Z M48 -38 L30 -14 L70 -38 Z', ol('#E8453C', 4.5)) + S.rect(112, -78, 18, 24, 4, ol('#4A4458', 4));
    // the sneaker
    s += S.path(poly([[-120, -60], [-40, -70], [20, -96], [64, -96], [84, -40], [84, 0], [-128, 0], [-136, -26]], 18), ol(dim ? '#5E38B4' : o.col, 6));
    s += S.path(poly([[-136, -18], [86, -18], [86, 2], [-136, 2]], 8), ol('#FFFFFF', 5));
    s += S.path('M-60 -60 L-30 -78 M-40 -54 L-10 -74 M-20 -48 L10 -68', ln(5, '#FFFFFF'));
    return S.g(s, `translate(${f(dx)} 0)`);
  };
  return place(o, (o.pair ? S.g(one(70, true), 'translate(0 -16)') : '') + one(0, false));
}

// ====================================================================== MOM / STAGE: thermos, phone, mic, mic stand
// travel thermos, (x, y) = centre (grip)
function thermos(...args) {
  const o = A(args, ['x', 'y', 's', 'rot'], { col: '#2FB5A8' });
  let s = S.path(poly([[-38, -96], [38, -96], [42, 110], [-42, 110]], 14), ol(o.col, 5.5));
  s += S.rect(-44, -20, 88, 50, 6, ol('#E4E8F0', 4.5)) + S.path('M-30 -6 L30 -6 M-30 10 L30 10', ln(3, '#B9C0CC'));
  s += S.path(poly([[-40, -150], [40, -150], [40, -96], [-40, -96]], 10), ol('#B9C0CC', 5)) + S.rect(-20, -168, 40, 22, 6, ol('#8E96A6', 4));
  s += S.path('M-24 -80 L-26 96', ln(8, '#FFFFFF', 0.5)) + S.path('M-12 -60 c-8 -10 -20 -2 -14 8 l14 12 l14 -12 c6 -10 -6 -18 -14 -8 Z', { fill: '#FF6FA8', stroke: LINE, 'stroke-width': 3 });
  return place(o, s);
}
// smartphone in a hand, (x, y) = centre. face: 'back' (we see the case + camera) | 'screen'; rec: red REC dot on the screen
function phone(...args) {
  const o = A(args, ['x', 'y', 's', 'rot'], { face: 'back', col: '#FF6FA8', rec: true, t: 0, screen: '' });
  let s = S.rect(-48, -92, 96, 184, 18, ol(o.face === 'back' ? o.col : '#20232E', 5.5));
  if (o.face === 'back') {
    s += S.rect(-36, -80, 40, 40, 10, ol('#20232E', 4)) + S.circle(-25, -69, 8, { fill: '#5A6478' }) + S.circle(-25, -50, 6, { fill: '#5A6478' }) + S.circle(-7, -69, 5, { fill: '#FFF2A0' });
    s += S.path('M30 -70 L30 70', ln(6, '#FFFFFF', 0.4));
  } else {
    const id = cid('ph');
    s += S.clipDef(id, S.rect(-40, -82, 80, 164, 10)) + S.g(S.rect(-40, -82, 80, 164, 0, { fill: '#1A2236' }) + o.screen + (o.rec ? S.circle(-24, -66, 7, { fill: '#FF3B4E', opacity: Math.floor(o.t * 2) % 2 ? 0.4 : 1 }) + TF('REC', 6, -60, 15, '#FFFFFF') : ''), null, { 'clip-path': `url(#${id})` });
  }
  return place(o, s);
}
// handheld microphone (Principal), grip at (x, y), rot 0 = head up
function handMic(...args) {
  const o = A(args, ['x', 'y', 's', 'rot'], { col: '#2A2A33' });
  let s = S.path('M-18 -40 L18 -40 L12 110 L-12 110 Z', ol(o.col, 5)) + S.rect(-22, -54, 44, 18, 5, ol('#B9C0CC', 4));
  s += S.circle(0, -90, 42, ol('#9AA4B4', 5));
  let mesh = '';
  for (let i = -2; i <= 2; i++) mesh += `M${i * 14} -128 L${i * 14} -52 M-38 ${-90 + i * 14} L38 ${-90 + i * 14} `;
  const id = cid('mic');
  s += S.clipDef(id, S.circle(0, -90, 39)) + S.g(S.path(mesh, ln(3, '#6E7787')), null, { 'clip-path': `url(#${id})` }) + S.path('M-24 -112 Q-14 -124 0 -126', ln(6, '#FFFFFF', 0.8));
  return place(o, s);
}
// stage mic stand. (x, y) = centre of the base on the floor. cable: [[x, y], ...] path in LOCAL units from the base outward
// (default: a loop across the stage floor to the right). tripped 0..1 tips the stand over to screen-right.
function micStand(...args) {
  const o = A(args, ['x', 'y', 's', 'rot'], { cable: null, tripped: 0, h: 620, t: 0 });
  const tr = clamp(o.tripped, 0, 1);
  const cable = o.cable || [[0, -10], [80, 6], [200, 10], [320, 2], [440, 12], [560, 6]];
  let s = '';
  let d = `M${P(cable[0])}`;
  for (let i = 1; i < cable.length; i++) { const p0 = cable[i - 1], p1 = cable[i]; d += ` Q${P(p0)} ${f((p0[0] + p1[0]) / 2)} ${f((p0[1] + p1[1]) / 2)}`; }
  d += ` L${P(cable[cable.length - 1])}`;
  s += S.path(d, ln(14, LINE)) + S.path(d, ln(7, '#3A3A48'));
  let st = S.ellipse(0, -8, 90, 18, ol('#2A2A33', 5)) + S.rect(-10, -o.h, 20, o.h - 10, 6, ol('#4A4A58', 4.5)) + S.rect(-14, -o.h * 0.55, 28, 26, 6, ol('#2A2A33', 4));
  st += S.path(`M0 ${-o.h} L-60 ${-o.h - 40}`, ln(16, LINE)) + S.path(`M0 ${-o.h} L-60 ${-o.h - 40}`, ln(8, '#4A4A58'));
  st += S.g(handMic({ s: 0.8 }), `translate(-70 ${-o.h - 40}) rotate(-60)`);
  s += S.g(st, `rotate(${f(70 * tr * tr)} 60 0)`);
  return place(o, s);
}
// juggling pin / bowling pin, (x, y) = centre, rot spins it
function bowlingPin(...args) {
  const o = A(args, ['x', 'y', 's', 'rot'], { col: '#FFFFFF', stripe: '#E8453C', sparkle: false });
  const d = 'M0 -86 C18 -86 20 -66 14 -50 C8 -36 10 -28 22 -6 C38 22 34 66 20 78 C10 86 -10 86 -20 78 C-34 66 -38 22 -22 -6 C-10 -28 -8 -36 -14 -50 C-20 -66 -18 -86 0 -86 Z';
  let inner = S.rect(-40, -44, 80, 9, 0, { fill: o.stripe }) + S.rect(-40, -30, 80, 9, 0, { fill: o.stripe }) + S.path('M-10 -76 Q-14 -60 -8 -48 M-18 4 Q-26 36 -16 66', ln(6, '#FFFFFF', 0.9)) + S.rect(6, -90, 40, 190, 0, { fill: '#000', opacity: 0.07 });
  let s = clipped(d, o.col, inner, 5);
  if (o.sparkle) s += S.path(F_SPARK(16, 30, 9), { fill: '#FFF6C0' });
  return place(o, s);
}
// bicycle, side view facing screen-left; (x, y) = ground point under the frame centre; wheelSpin = radians; flip mirrors
function bicycle(...args) {
  const o = A(args, ['x', 'y', 's', 'rot'], { wheelSpin: 0, col: '#2E7BD1', flip: false, bars: 0 });
  const R = 130, wx = 230;
  const wheel = (cx) => {
    let w = S.circle(cx, -R, R, { fill: 'none', stroke: LINE, 'stroke-width': 22 }) + S.circle(cx, -R, R, { fill: 'none', stroke: '#3A3A44', 'stroke-width': 13 });
    let sp = '';
    for (let i = 0; i < 6; i++) { const a = o.wheelSpin + (i * Math.PI) / 6; sp += `M${f(cx + Math.cos(a) * (R - 10))} ${f(-R + Math.sin(a) * (R - 10))} L${f(cx - Math.cos(a) * (R - 10))} ${f(-R - Math.sin(a) * (R - 10))} `; }
    w += S.path(sp, ln(3.5, '#9AA4B4')) + S.circle(cx, -R, 14, ol('#C9CED8', 4));
    return w;
  };
  let s = wheel(-wx) + wheel(wx);
  const seat = [70, -340], head = [-150, -330], crank = [20, -R];
  const frame = `M${wx} ${-R} L${P(crank)} L${P(seat)} L${wx} ${-R} M${P(crank)} L${P(head)} L${P(seat)} M${P(head)} L${-wx} ${-R}`;
  s += S.path(frame, ln(26, LINE)) + S.path(frame, ln(16, o.col));
  s += S.circle(crank[0], crank[1], 26, ol('#C9CED8', 5)) + S.path(`M${crank[0]} ${crank[1]} l${f(40 * Math.cos(o.wheelSpin * 0.6))} ${f(40 * Math.sin(o.wheelSpin * 0.6))}`, ln(10, LINE)) + S.rect(crank[0] + 40 * Math.cos(o.wheelSpin * 0.6) - 22, crank[1] + 40 * Math.sin(o.wheelSpin * 0.6) - 6, 44, 12, 4, ol('#2A2A33', 3));
  s += S.path(`M${P(seat)} l-6 -36`, ln(12, LINE)) + S.path(poly([[seat[0] - 60, seat[1] - 54], [seat[0] + 40, seat[1] - 50], [seat[0] + 36, seat[1] - 30], [seat[0] - 56, seat[1] - 34]], 12), ol('#2A2A33', 5));
  const bar = S.path(`M${P(head)} l-10 -60 l-50 -6 M${f(head[0] - 10)} ${f(head[1] - 60)} l40 -10`, ln(22, LINE)) + S.path(`M${P(head)} l-10 -60 l-50 -6 M${f(head[0] - 10)} ${f(head[1] - 60)} l40 -10`, ln(12, '#C9CED8')) + S.rect(head[0] - 82, head[1] - 76, 34, 20, 8, ol('#2A2A33', 4));
  s += S.g(bar, o.bars ? `rotate(${f(o.bars)} ${P(head)})` : null);
  return place(o, o.flip ? S.g(s, 'scale(-1 1)') : s);
}

// ====================================================================== BACKPACK + CHECKPOINT FLAG
// the checkpoint flag (a small one, e.g. sticking out of the backpack or planted in Gary's gravel).
// (x, y) = foot of the pole; h = pole height; glow 0..1; t waves the cloth. Scenes with the big checkpoint pad use scenes/respawn.js.
// (colours follow scenes/respawn.js's checkpoint: use R.flag()/R.tinyFlag() there for the full animated version)
function checkpointFlag(...args) {
  const o = A(args, ['x', 'y', 's', 'rot'], { h: 300, glow: 1, t: 0, col: '#2FD37A', w: 6 });
  const h = o.h;
  let s = '';
  if (o.glow > 0) s += S.circle(30, -h + 40, 90, { fill: o.col, opacity: f(0.18 * o.glow) }) + S.circle(30, -h + 40, 50, { fill: o.col, opacity: f(0.22 * o.glow) });
  s += S.rect(-7, -h - 6, 14, h + 6, 6, ol('#EEF2F8', o.w * 0.8));
  const wv = Math.sin(o.t * 5) * 10;
  const cloth = `M6 ${-h} Q50 ${f(-h - 12 + wv)} 100 ${f(-h + 4)} Q86 ${f(-h + 40 - wv)} 104 ${f(-h + 80)} Q54 ${f(-h + 66 + wv)} 6 ${f(-h + 84)} Z`;
  const cid2 = cid('cf');
  let chk = '';
  for (let r = 0; r < 4; r++) for (let c = r % 2; c < 2; c += 2) chk += `M${6 + c * 18} ${-h + r * 21} h18 v21 h-18 Z `;
  s += S.clipDef(cid2, S.path(cloth)) + S.path(cloth, { fill: o.col }) + S.g(S.path(chk, { fill: '#FFFFFF' }) + S.path(`M40 ${f(-h + 18)} Q62 ${f(-h + 10 + wv)} 88 ${f(-h + 18)}`, ln(o.w, '#B6FFD6')), null, { 'clip-path': `url(#${cid2})` }) + S.path(cloth, ol('none', o.w));
  s += S.circle(0, -h - 10, 12, ol('#FFD21F', o.w * 0.7));
  return place(o, s);
}
// the school backpack. view: 'flat' (on its own, front of the bag to camera), 'back' (worn, seen from behind),
// 'side' (worn, profile facing screen-left: bag sticks out to the right), 'front' (worn, seen from the front: only the
// parts that show around the torso — use backpackWorn() for the split layers). flag: true adds the checkpoint flag.
const BP = { body: '#3B82F6', shade: '#2A62C0', pocket: '#FFD23F', trim: '#1E3A8A' };
function bagFront(col = BP) {
  let s = S.path(poly([[-110, -280], [110, -280], [122, 0], [-122, 0]], 50), ol(col.body, 6));
  s += S.path(poly([[-84, -110], [84, -110], [90, -14], [-90, -14]], 22), ol(col.pocket, 5)) + S.path('M-70 -94 L70 -94', { fill: 'none', stroke: col.trim, 'stroke-width': 4, 'stroke-dasharray': '6 5' });
  s += S.path('M-96 -230 Q0 -270 96 -230', ln(5, col.trim)) + S.rect(-10, -246, 20, 30, 6, ol('#C9CED8', 3.5));
  s += S.path('M-84 -240 L-90 -140', ln(10, '#FFFFFF', 0.35)) + S.rect(-110, -40, 232, 40, 0, { fill: '#000', opacity: 0.08 });
  s += S.path('M-30 -296 Q0 -330 30 -296', ln(16, LINE)) + S.path('M-30 -296 Q0 -330 30 -296', ln(8, col.trim));
  s += S.circle(56, -60, 18, ol('#FF6FA8', 3.5)) + S.path('M48 -62 l6 6 l12 -12', ln(4, '#FFFFFF'));
  return s;
}
function backpack(...args) {
  const o = A(args, ['x', 'y', 's', 'rot'], { flag: false, t: 0, col: BP });
  let s = '';
  if (o.flag) s += checkpointFlag({ x: 40, y: -240, h: 300, t: o.t, glow: o.flag === true ? 1 : o.flag });
  s += bagFront(o.col);
  return place(o, s);
}
// worn backpack in BODY space for the rig (front/back/side view) -> { back, mid, top } layers. Used by cast.js (YOU's backpack option).
function backpackWorn(view = 'front', { flag = false, t = 0, col = BP, flagSvg = null } = {}) {
  const g = flag === true || flag === 'flag' ? 1 : +flag || 1;
  const fl = (h) => (flag ? (flagSvg != null ? flagSvg : checkpointFlag({ x: 0, y: 0, h, t, glow: g })) : '');
  if (view === 'back') {
    // the pole rises from the bag in front of the back of the head: 'top' layer
    return { back: '', mid: S.g(bagFront(col), 'translate(0 -300) scale(0.82)'), top: flag ? S.g(fl(640), 'translate(150 -500) rotate(6)') : '' };
  }
  if (view === 'side') {
    let bag = S.path(poly([[60, -520], [170, -500], [190, -330], [64, -320]], 34), ol(col.body, 6)) + S.path(poly([[150, -470], [206, -450], [212, -360], [160, -350]], 18), ol(col.pocket, 5));
    bag += S.path('M66 -500 L40 -330', ln(22, LINE)) + S.path('M66 -500 L40 -330', ln(12, col.trim));
    return { back: '', mid: (flag ? S.g(fl(600), 'translate(200 -470) rotate(10)') : '') + bag };
  }
  // front: the bag peeks out around the torso (back layer); straps over the shoulders (mid layer)
  let back = (flag ? S.g(fl(660), 'translate(176 -430) rotate(8)') : '') + S.path(poly([[-128, -540], [128, -540], [136, -330], [-136, -330]], 40), ol(col.body, 6));
  let mid = '';
  for (const sx of [-1, 1]) {
    const d = `M${sx * 52} -534 Q${sx * 66} -440 ${sx * 70} -360`;
    mid += S.path(d, ln(30, LINE)) + S.path(d, ln(20, col.trim)) + S.rect(sx * 70 - 14, -440, 28, 16, 4, ol('#C9CED8', 3));
  }
  return { back, mid };
}

// ====================================================================== GARY THE GOLDFISH
// gary({ x, y, s, t, look: [x, y], blink 0..1, turn: 'side'|'front'|'tail' (or yaw in degrees: 0 front, 90 facing
// screen-right, -90 facing left, 180 tail to camera), flip, glowEyes 0..1, mouth: 'o'|'line'|'open', line, lids })
// (x, y) = body centre. Body ≈ 170 long, 140 tall at s 1 (≈ 290 incl. tail). He is chubby, orange, and deeply unimpressed.
function gary(...args) {
  const o = A(args, ['x', 'y', 's', 'rot'], { t: 0, look: [0, 0], blink: 0, turn: 'side', yaw: null, flip: false, glowEyes: 0, mouth: 'o', line: 6, lids: 0.46, bubble: 0 });
  let yaw = o.yaw != null ? o.yaw : typeof o.turn === 'number' ? o.turn : { side: 90, front: 0, tail: 180 }[o.turn] ?? 90;
  if (o.flip) yaw = -yaw;
  const th = (yaw * Math.PI) / 180, sn = Math.sin(th), cs = Math.cos(th);
  const w = o.line;
  const a = 85, b = 66, c = 70; // half length, half width, half height
  const body = '#FF8A1F', bodyShade = '#E86A10', belly = '#FFC864', fin = '#FFB547', finLine = '#E8781C';
  const proj = (fw, lat, up) => [fw * sn + lat * cs, -up, fw * cs - lat * sn];
  const rx = Math.sqrt((a * sn) ** 2 + (b * cs) ** 2);
  const swim = Math.sin(o.t * 3.2);
  // tail fan in the body's vertical plane (cheated wider when edge-on so it always reads)
  const finSn = Math.sign(sn || 1) * Math.max(Math.abs(sn), 0.3);
  const finPt = (fw, up) => [fw * finSn, -up];
  const tb = -a * 0.7;
  // tail: a profile fan that narrows to edge-on as Gary turns toward/away from the camera, then opens into a
  // butterfly fantail (two broad lobes) in the front and tail views
  const spread = clamp((Math.abs(cs) - 0.5) / 0.4, 0, 1);
  const sway = swim * 26;
  const tail = () => {
    if (spread < 0.5) {
      const wk = 1 - spread * 2;
      const tp = (fw, up, lat = 0) => [tb * sn + (fw - tb) * sn * wk + lat * cs, -up];
      const pts = [[tb, 24], [tb - 70, 78], [tb - 128, 96], [tb - 112, 40], [tb - 96, 0], [tb - 112, -40], [tb - 128, -96], [tb - 70, -78], [tb, -24]];
      const q = pts.map(([fw, up], i) => tp(fw, up, sway * (i ? Math.min(1, -(fw - tb) / 120) : 0) * Math.abs(cs) * 1.4));
      const d = `M${P(q[0])} Q${P(q[1])} ${P(q[2])} Q${P(q[3])} ${P(q[4])} Q${P(q[5])} ${P(q[6])} Q${P(q[7])} ${P(q[8])} Z`;
      let rays = '';
      for (const up of [60, 30, 0, -30, -60]) rays += `M${P(tp(tb - 6, up * 0.3))} L${P(tp(tb - 100, up * 1.2))} `;
      return S.path(d, ol(fin, w)) + S.path(rays, ln(w * 0.6, finLine)) + S.path(d, ol('none', w));
    }
    const xs = (spread - 0.5) * 2;
    const lobe = 'M0 -16 Q58 -100 134 -70 Q162 -16 124 26 Q64 44 0 20 Z';
    const rays = 'M8 0 L118 -60 M8 2 L134 -18 M8 6 L114 18';
    const one = S.path(lobe, ol(fin, w)) + S.path(rays, ln(w * 0.6, finLine)) + S.path(lobe, ol('none', w));
    return S.g(one + S.g(one, 'scale(-1 1)'), `translate(${f(tb * sn)} -6) rotate(${f(swim * 7)}) scale(${f(Math.max(0.05, xs))} 1)`);
  };
  const dorsal = () => {
    const pts = [[a * 0.35, c * 0.86], [a * 0.05, c + 64], [-a * 0.45, c + 50], [-a * 0.62, c * 0.62]].map(([fw, up]) => finPt(fw, up));
    return S.path(`M${P(pts[0])} Q${P(pts[1])} ${P(pts[2])} L${P(pts[3])} Z`, ol(fin, w)) + S.path(`M${P(finPt(0, c + 4))} L${P(finPt(-a * 0.1, c + 46))} M${P(finPt(-a * 0.3, c * 0.9))} L${P(finPt(-a * 0.36, c + 38))}`, ln(w * 0.6, finLine));
  };
  const lower = () => {
    const pts = [[-a * 0.25, -c * 0.85], [-a * 0.55, -c - 40], [-a * 0.72, -c * 0.6]].map(([fw, up]) => finPt(fw, up));
    return S.path(`M${P(pts[0])} Q${P(pts[1])} ${P(pts[2])} Z`, ol(fin, w));
  };
  const pect = (sideL) => {
    const [x, y, z] = proj(a * 0.15, sideL * b * 0.9, -c * 0.35);
    const flap = 0.6 + 0.4 * Math.sin(o.t * 6 + sideL);
    const dir = Math.sign((sn * 0.3 + cs * sideL) || sideL);
    const d = `M${f(x)} ${f(y - 10)} Q${f(x + dir * 52 * flap)} ${f(y - 4)} ${f(x + dir * 40 * flap)} ${f(y + 36)} Q${f(x + dir * 14)} ${f(y + 24)} ${f(x)} ${f(y + 10)} Z`;
    return { z, svg: S.path(d, ol(fin, w * 0.9)) };
  };
  const behind = cs > -0.1; // facing camera-ish: tail and fins behind the body
  let s = '';
  if (behind) s += tail() + dorsal() + lower();
  const pL = pect(-1), pR = pect(1);
  for (const p of [pL, pR]) if (p.z < 0) s += p.svg;
  // body
  let inner = S.ellipse(0, c * 0.55, rx * 1.1, c * 0.62, { fill: belly });
  inner += S.ellipse(rx * 0.25, c * 0.1, rx * 0.95, c * 1.05, { fill: bodyShade, opacity: 0.35, transform: `translate(${f(rx * 0.35)} ${f(c * 0.3)})` });
  // scales: a few arcs on the visible flank
  let sc = '';
  for (const [fw, up] of [[-10, 20], [20, -10], [-40, -12], [-40, 30], [10, 40], [-70, 10]]) {
    const [x, y, z] = proj(fw, -Math.sign(sn || 1) * b * 0.7, up);
    if (z > -5 && Math.abs(sn) > 0.3) sc += `M${f(x - 12)} ${f(y - 6)} Q${f(x)} ${f(y + 8)} ${f(x + 12)} ${f(y - 6)} `;
  }
  if (sc) inner += S.path(sc, ln(w * 0.6, '#FFB15A'));
  inner += S.path(`M${f(-rx * 0.62)} ${f(-c * 0.38)} Q${f(-rx * 0.35)} ${f(-c * 0.82)} ${f(rx * 0.05)} ${f(-c * 0.86)}`, ln(w * 2.4, '#FFFFFF', 0.55));
  let bodyD = `M${f(-rx)} 0 A${f(rx)} ${c} 0 1 0 ${f(rx)} 0 A${f(rx)} ${c} 0 1 0 ${f(-rx)} 0 Z`;
  s += clipped(bodyD, body, inner, w);
  // eyes: big flat discs, deadpan lids
  const glow = clamp(o.glowEyes, 0, 1);
  const eyes = [];
  for (const sideL of [-1, 1]) {
    const nrm = [0.38, sideL * 0.92];
    const nz = nrm[0] * cs - nrm[1] * sn;
    if (nz < -0.18) continue;
    const [x, y] = proj(a * 0.5, sideL * b * 0.66, c * 0.2);
    const R = 30, k = Math.max(0.3, Math.min(1, Math.abs(nz) * 1.25 + 0.1));
    eyes.push({ x, y, R, k, z: nz });
  }
  for (const e of eyes) {
    const ex = e.x, ey = e.y, erx = e.R * e.k, ery = e.R;
    let eo = '';
    if (glow > 0) eo += S.circle(ex, ey, e.R * 2.4, { fill: '#5BFF8A', opacity: f(0.18 * glow) }) + S.circle(ex, ey, e.R * 1.6, { fill: '#5BFF8A', opacity: f(0.25 * glow) });
    const id = cid('ge');
    const lid = clamp(o.lids + (1 - o.lids) * clamp(o.blink, 0, 1), 0, 1);
    const yl = ey - ery + 2 * ery * lid;
    eo += S.clipDef(id, S.ellipse(ex, ey, erx, ery));
    let ei = S.ellipse(ex, ey, erx, ery, { fill: glow > 0.5 ? '#D8FFE2' : '#FFFFFF' });
    const lx = clamp(o.look[0], -1, 1), ly = clamp(o.look[1], -1, 1);
    const pr = e.R * 0.36;
    const px = ex + lx * erx * 0.5 + (Math.abs(sn) > 0.5 ? Math.sign(sn) * erx * 0.15 : 0), py = ey + 6 + ly * ery * 0.35;
    ei += S.ellipse(px, py, pr * e.k * (glow > 0.5 ? 0.9 : 1), pr, { fill: glow > 0 ? (glow > 0.5 ? '#20C850' : LINE) : LINE });
    if (glow > 0.3) ei += S.ellipse(px, py, pr * e.k * 0.5, pr * 0.5, { fill: '#B8FFC8' });
    ei += S.circle(px - pr * 0.35, py - pr * 0.4, pr * 0.28, { fill: '#FFFFFF' });
    ei += S.rect(ex - erx - 4, ey - ery - 4, 2 * erx + 8, yl - (ey - ery) + 4, 0, { fill: body });
    ei += S.path(`M${f(ex - erx - 4)} ${f(yl)} L${f(ex + erx + 4)} ${f(yl)}`, ln(w, LINE));
    eo += S.g(ei, null, { 'clip-path': `url(#${id})` }) + S.ellipse(ex, ey, erx, ery, ol('none', w));
    s += eo;
  }
  // mouth at the front tip
  const [mx, my, mz] = proj(a * 0.97, 0, -c * 0.12);
  if (mz > -a * 0.4) {
    const mk = Math.abs(cs) > 0.6 ? 1 : 0.7;
    if (o.mouth === 'line') s += S.path(`M${f(mx - 14 * mk)} ${f(my)} L${f(mx + 14 * mk)} ${f(my)}`, ln(w * 1.1));
    else if (o.mouth === 'open') s += S.ellipse(mx, my, 14 * mk, 16, ol('#7A1E2E', w * 0.9)) + S.ellipse(mx, my + 4, 9 * mk, 7, { fill: '#E8607A' });
    else s += S.ellipse(mx, my, 13 * mk, 12, ol('#FF6A3A', w)) + S.ellipse(mx, my, 6 * mk, 5.5, { fill: '#7A1E2E' });
  }
  for (const p of [pL, pR]) if (p.z >= 0) s += p.svg;
  if (!behind) s += dorsal() + lower() + tail();
  if (o.bubble > 0) { const bk = clamp(o.bubble, 0, 1); s += S.circle(mx + Math.sign(sn || 1) * 20, my - 40 * bk, 10 + 8 * bk, { fill: '#DFF6FF', opacity: 0.7, stroke: LINE, 'stroke-width': w * 0.6 }); }
  return place(o, s);
}

// ====================================================================== THE FISHBOWL
// fishbowl({ x, y, s, t, gary: {...}|false, flag 0..1, inside: svg, bubbles, plant, line, garyFront })
// (x, y) = bottom centre (where it stands on the desk); 600 wide, ~490 tall at s 1. Inside coordinates (for `inside` and gary):
// the bowl's local space: centre of the sphere at (0, -270), radius 300, gravel top ≈ y -40, water surface ≈ y -435.
// fishbowl.layers(opts) -> { back, front } so a tiny hero (or anything) can be drawn between the water and the glass.
// fishbowl.LOCAL = { cx, cy, R, gravelY, waterY } for placing things inside (multiply by s and add x, y).
const BOWL = { R: 300, cy: -270, gravelY: -44, waterY: -435 };
function fishbowlLayers(...args) {
  const o = A(args, ['x', 'y', 's', 'rot'], { t: 0, gary: {}, flag: 0, flagSvg: null, inside: '', bubbles: true, plant: true, line: 7, garyFront: false, water: true });
  const { R, cy } = BOWL, w = o.line;
  const yTop = cy - Math.sqrt(R * R - 208 * 208);
  const shell = `M-208 ${f(yTop)} A${R} ${R} 0 1 0 208 ${f(yTop)} Z`;
  const shellId = cid('bw');
  let back = S.clipDef(shellId, S.path(shell));
  let inner = S.rect(-R, yTop - 10, 2 * R, R * 2, 0, { fill: '#EAF8FF', opacity: 0.35 });
  if (o.water) {
    inner += S.rect(-R, BOWL.waterY, 2 * R, 2 * R, 0, { fill: 'url(#exWater)', opacity: 0.75 });
    inner += S.ellipse(0, BOWL.waterY, 280, 24, { fill: '#C8F2FA', opacity: 0.8 });
  }
  // gravel
  let gr = '';
  const cols = ['#FF8FC0', '#6FD3FF', '#FFD23F', '#B9F27A', '#FFFFFF', '#B06BFF'];
  const gv = {};
  for (let i = 0; i < 60; i++) {
    const x = -260 + (i * 37) % 520 + (hash(i) - 0.5) * 20, y = BOWL.gravelY + 8 + hash(i * 3) * 40, r = 11 + hash(i * 5) * 6;
    const c = cols[i % cols.length];
    gv[c] = (gv[c] || '') + `M${f(x - r)} ${f(y)} a${f(r)} ${f(r * 0.8)} 0 1 0 ${f(2 * r)} 0 a${f(r)} ${f(r * 0.8)} 0 1 0 ${f(-2 * r)} 0 Z `;
  }
  inner += S.path(`M${-R} ${BOWL.gravelY} Q0 ${BOWL.gravelY - 26} ${R} ${BOWL.gravelY} L${R} 40 L${-R} 40 Z`, { fill: '#E9C98E' });
  for (const [c, d] of Object.entries(gv)) gr += S.path(d, { fill: c, stroke: LINE, 'stroke-width': w * 0.45 });
  inner += gr;
  // plant
  if (o.plant) {
    let fr = '';
    for (let i = 0; i < 5; i++) {
      const x0 = 120 + i * 18, h = 150 + 60 * hash(i), sw = Math.sin(o.t * 1.6 + i) * 18;
      fr += `M${x0} ${BOWL.gravelY + 8} Q${f(x0 - 30 + sw)} ${f(BOWL.gravelY - h * 0.5)} ${f(x0 + sw * 1.6 - 10 + i * 6)} ${f(BOWL.gravelY - h)} `;
    }
    inner += S.path(fr, ln(w * 3.2, LINE)) + S.path(fr, ln(w * 2, '#3BAA4A')) + S.path(fr, ln(w * 0.6, '#8AE07A'));
  }
  // the tiny checkpoint flag on the gravel
  if (o.flagSvg) inner += S.g(o.flagSvg, `translate(-120 ${BOWL.gravelY + 14})`);
  else if (o.flag > 0) inner += checkpointFlag({ x: -120, y: BOWL.gravelY + 14, s: 0.45, h: 200, glow: o.flag, t: o.t, w: w * 0.9 / 0.45 * 0.5 });
  back += S.g(inner, null, { 'clip-path': `url(#${shellId})` });
  back += S.path(shell, { fill: 'none', stroke: '#BFE6F5', 'stroke-width': w * 3, opacity: 0.35 });
  let gfish = '';
  if (o.gary) { const gs = o.gary.s || 0.62; gfish = gary({ x: -40, y: -230, s: 0.62, t: o.t, line: (w * 0.85) / gs, ...o.gary }); }
  if (gfish && !o.garyFront) back += S.g(gfish, null, { 'clip-path': `url(#${shellId})` });
  let front = '';
  if (gfish && o.garyFront) front += gfish;
  if (o.bubbles) {
    let bb = '';
    for (let i = 0; i < 7; i++) {
      const u = (o.t * (0.18 + 0.1 * hash(i)) + hash(i * 3)) % 1;
      const yy = lerp(BOWL.gravelY - 20, BOWL.waterY + 20, u), xx = -150 + hash(i * 7) * 300 + Math.sin(o.t * 2 + i) * 10, r = 6 + 8 * hash(i * 11);
      bb += S.circle(xx, yy, r, { fill: '#FFFFFF', 'fill-opacity': 0.35, stroke: '#FFFFFF', 'stroke-width': w * 0.5, opacity: 0.85 });
    }
    front += bb;
  }
  // glass: reflections, rim, outline
  front += S.path(`M-236 ${cy - 80} A250 250 0 0 1 -120 ${cy - 220}`, ln(w * 3, '#FFFFFF', 0.75)) + S.path(`M-250 ${cy + 10} A250 250 0 0 1 -246 ${cy - 40}`, ln(w * 3, '#FFFFFF', 0.6));
  front += S.path(`M200 ${cy + 150} A260 260 0 0 0 262 ${cy + 40}`, ln(w * 2, '#FFFFFF', 0.45));
  if (o.water) front += S.path(`M-236 ${BOWL.waterY + 10} Q0 ${BOWL.waterY + 32} 236 ${BOWL.waterY + 10}`, ln(w * 0.8, '#FFFFFF', 0.8));
  front += S.path(shell, ol('none', w));
  front += S.ellipse(0, yTop, 208, 30, { fill: 'none', stroke: LINE, 'stroke-width': w * 3.2 }) + S.ellipse(0, yTop, 208, 30, { fill: 'none', stroke: '#DDF4FF', 'stroke-width': w * 1.6 });
  front += S.ellipse(0, -2, 150, 16, ol('#CDEFFB', w * 0.8));
  return { back: place(o, back), front: place(o, (o.inside ? '' : '') + front), inside: place(o, o.inside || '') };
}
function fishbowl(...args) { const l = fishbowlLayers(...args); return l.back + l.inside + l.front; }
fishbowl.layers = (...args) => { const l = fishbowlLayers(...args); return { back: l.back + l.inside, front: l.front }; };
fishbowl.LOCAL = { cx: 0, cy: BOWL.cy, R: BOWL.R, gravelY: BOWL.gravelY, waterY: BOWL.waterY };

module.exports = {
  DEFS,
  gary, fishbowl,
  spatula, pancake, pancakeStack, plate, spoon,
  bookOfFails, topHat, flask, flaskTray,
  skateboard, dodgeball, ballBin, lunchTray, spaghetti, quizPaper, paperStack, marker,
  birthdayCake, trophy, goSign, rocketSneakers, thermos, phone, handMic, micStand, bowlingPin, bicycle,
  backpack, backpackWorn, checkpointFlag, foam, puffs,
};
