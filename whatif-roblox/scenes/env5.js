// Admin Vault interiors: the Laser Hall, the Hatchery (with teeth eggs), the Top with the hatch pad.
'use strict';

const S = require('../rig/svg');
const E = require('./env');
const { egg, secretEgg } = require('../rig/props');
const { f, clamp, lerp } = S;
const LINE = '#151515';
const ol = (fill, w = 6) => ({ fill, stroke: LINE, 'stroke-width': w, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' });
const ln = (w, c = LINE, op) => ({ fill: 'none', stroke: c, 'stroke-width': w, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', ...(op !== undefined ? { opacity: op } : {}) });
const R = (x, y, w, h, r = 0, a = {}) => S.rect(x, y, w, h, r, a);
const T = (s, x, y, size, fill, extra = {}) => S.el('text', { x, y, 'font-family': 'Lilita One, sans-serif', 'font-size': size, fill, 'text-anchor': 'middle', ...extra }, s);
const hash = (n) => { const v = Math.sin(n * 127.1 + 311.7) * 43758.5453; return v - Math.floor(v); };

// dark metal hall; floor top at y = 990 in world space; x spans -1000..6000
function hall(cam, t, opts = {}) {
  let back = R(-1400, -800, 8800, 2600, 0, { fill: opts.wall || '#1E2136' });
  for (let x = -1400; x < 7400; x += 420) back += R(x, -200, 400, 1100, 18, { fill: '#262A44', stroke: '#14162A', 'stroke-width': 6 }) + R(x + 40, 60, 320, 40, 10, { fill: opts.accent || '#FF2D55', opacity: f(0.35 + 0.25 * Math.sin(t * 4 + x)) });
  back += R(-1400, 900, 8800, 30, 0, { fill: '#FFC52E' });
  for (let x = -1400; x < 7400; x += 120) back += S.path(`M${x} 930 L${x + 60} 930 L${x + 20} 960 L${x - 40} 960 Z`, { fill: '#FFC52E', opacity: 0.85 });
  let floor = R(-1400, 990, 8800, 600, 0, { fill: '#2C3050' }) + R(-1400, 990, 8800, 600, 0, { fill: 'url(#metal)', opacity: 0.6 }) + S.path('M-1400 990 L7400 990', ln(6));
  if (opts.title) back += S.g(R(-340, -70, 680, 140, 26, ol('#151521', 7)) + T(opts.title, 0, 26, 76, opts.titleCol || '#FFC52E'), `translate(${opts.titleX || 960} 200)`);
  return { back: E.layer(back, cam, 0.85), floor: E.layer(floor, cam, 1) };
}

// sweeping laser grid for the Laser Hall (world space), returns svg
function sweepers(t, x0, x1, n = 5, speed = 1) {
  let o = '';
  for (let i = 0; i < n; i++) {
    const cx = lerp(x0, x1, (i + 0.5) / n);
    const a = Math.sin(t * speed * (1.2 + 0.3 * i) + i * 1.7) * 0.9;
    const L = 1100;
    o += E.beam(cx, 300, cx + Math.sin(a) * L, 300 + Math.cos(a) * L, 1);
    o += S.circle(cx, 300, 28, ol('#3A3F5E', 5)) + S.circle(cx, 300, 12, { fill: '#FF2D55' });
  }
  return o;
}

// an egg with teeth; open 0..1 (mouth gape), (x, y) = centre
function teethEgg({ x = 0, y = 0, size = 150, open = 0, t = 0, eyes = true } = {}) {
  const k = clamp(open, 0, 1);
  let o = '';
  const gap = size * 0.28 * k;
  const top = egg({ x: 0, y: -gap / 2, size, rarity: 'epic', glow: false });
  // bottom half mirrors the egg's lower part with a jagged clip
  const id = S.uid('te');
  const jag = [];
  for (let i = 0; i <= 8; i++) jag.push([-size * 0.5 + (i * size) / 8, (i % 2 ? -1 : 1) * size * 0.06]);
  const jagD = 'M' + jag.map(([a, b]) => `${f(a)} ${f(b)}`).join(' L');
  o += S.clipDef(id + 'b', S.path(`${jagD} L${size} ${size} L${-size} ${size} Z`));
  o += S.clipDef(id + 't', S.path(`${jagD} L${size} ${-size} L${-size} ${-size} Z`));
  // mouth interior
  if (k > 0.02) o += S.ellipse(0, 0, size * 0.34, gap / 2 + 4, { fill: '#4B1020', stroke: LINE, 'stroke-width': 5 });
  o += S.g(S.g(egg({ x: 0, y: 0, size, rarity: 'epic', glow: false }), `translate(0 ${f(gap / 2)})`), null, { 'clip-path': `url(#${id}b)` });
  o += S.g(top, null, { 'clip-path': `url(#${id}t)` });
  // teeth
  if (k > 0.02) {
    for (let i = 0; i < 4; i++) {
      const tx = -size * 0.24 + i * size * 0.16;
      o += S.path(`M${f(tx - 12)} ${f(-gap / 2)} L${f(tx)} ${f(-gap / 2 + 22)} L${f(tx + 12)} ${f(-gap / 2)} Z`, ol('#FFFFFF', 3));
      o += S.path(`M${f(tx - 4)} ${f(gap / 2)} L${f(tx + 8)} ${f(gap / 2 - 22)} L${f(tx + 20)} ${f(gap / 2)} Z`, ol('#FFFFFF', 3));
    }
  }
  if (eyes) for (const sx of [-1, 1]) o += S.path(`M${f(sx * size * 0.2 - 14)} ${f(-size * 0.22 - gap / 2)} L${f(sx * size * 0.2 + 14)} ${f(-size * 0.16 - gap / 2)}`, ln(6)) + S.circle(sx * size * 0.2, -size * 0.12 - gap / 2, 7, { fill: '#FFE14D', stroke: LINE, 'stroke-width': 3 });
  return S.g(o, `translate(${f(x)} ${f(y)})`);
}

// shelves full of eggs (world space), some purple teeth eggs that chomp
function shelves(t, x0, x1, opts = {}) {
  let o = '';
  for (let r = 0; r < 4; r++) {
    const y = 360 + r * 150;
    o += R(x0, y + 50, x1 - x0, 24, 8, ol('#8A6A3A', 5));
    for (let x = x0 + 60, i = 0; x < x1 - 40; x += 110, i++) {
      const id = r * 100 + i;
      const purple = hash(id) > 0.72;
      if (opts.realAt && opts.realAt[0] === r && opts.realAt[1] === i) { o += egg({ x, y, size: 90, rarity: 'legendary', glow: true }); continue; }
      if (purple) o += teethEgg({ x, y, size: 90, open: Math.max(0, Math.sin(t * 5 + id)) * (opts.chomp ?? 1), t });
      else o += egg({ x, y, size: 90, rarity: ['common', 'rare', 'common', 'epic'][id % 4] === 'epic' ? 'rare' : ['common', 'rare', 'common'][id % 3], glow: false });
    }
  }
  return o;
}

// the hatch pad: glowing circle on the floor with a big target
function hatchPad(x, y, t, k = 1) {
  let o = S.ellipse(x, y, 260, 60, { fill: '#7B2FFF', opacity: 0.35 + 0.15 * Math.sin(t * 5) }) + S.ellipse(x, y, 230, 50, ol('#C77DFF', 7)) + S.ellipse(x, y, 150, 32, ln(8, '#FFFFFF', 0.8)) + S.ellipse(x, y, 60, 13, { fill: '#FFFFFF' });
  for (let i = 0; i < 6; i++) { const ph = (t * 0.8 + i / 6) % 1; o += R(x - 200 + i * 70, y - 40 - ph * 300, 14, 14, 3, { fill: '#C77DFF', opacity: f(1 - ph) }); }
  o += T('HATCH PAD', x, y - 340, 64, '#C77DFF', { stroke: LINE, 'stroke-width': 10, 'paint-order': 'stroke' });
  return o;
}

module.exports = { hall, sweepers, teethEgg, shelves, hatchPad };
