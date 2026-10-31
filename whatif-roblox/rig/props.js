// Props: Steal-an-Egg style eggs, Robux coin, simple UI bits.
'use strict';

const S = require('./svg');
const C = require('./palette');
const { f } = S;

const RARITY = {
  common:    { base: '#FFF4DE', spot: '#E9D3A8', glow: null },
  rare:      { base: '#7FD0FF', spot: '#3E9BE0', glow: '#7FD0FF' },
  epic:      { base: '#C68BFF', spot: '#8E4BE0', glow: '#C68BFF' },
  legendary: { base: '#FFD54A', spot: '#F09A00', glow: '#FFE27A' },
  mythic:    { base: '#FF6FB5', spot: '#FFB3DA', glow: '#FF9BD0' },
};

function eggPoints(rx, ry, n = 64) {
  const p = [];
  for (let i = 0; i < n; i++) {
    const t = (i / n) * Math.PI * 2;
    const x = rx * Math.sin(t) * (1 - 0.16 * Math.cos(t));
    const y = -ry * Math.cos(t);
    p.push([x, y]);
  }
  return p;
}

// Egg centred at (x,y); size = height.
function egg({ x = 0, y = 0, size = 200, rarity = 'legendary', rot = 0, glow = true, wobble = 0 } = {}) {
  const R = RARITY[rarity] || RARITY.common;
  const ry = size / 2, rx = ry * 0.74;
  const pts = eggPoints(rx, ry);
  const d = 'M' + pts.map(([a, b]) => `${f(a)} ${f(b)}`).join(' L') + ' Z';
  const id = S.uid('egg');
  let o = '';
  if (glow && R.glow) {
    const gid = S.uid('eg');
    o += S.el('radialGradient', { id: gid }, `<stop offset="0" stop-color="${R.glow}" stop-opacity="0.85"/><stop offset="1" stop-color="${R.glow}" stop-opacity="0"/>`);
    o += S.circle(0, 0, size * 0.95, { fill: `url(#${gid})` });
  }
  let inner = S.path(d, { fill: R.base });
  inner += S.ellipse(-rx * 0.35, -ry * 0.25, rx * 0.22, ry * 0.15, { fill: R.spot });
  inner += S.ellipse(rx * 0.42, ry * 0.15, rx * 0.18, ry * 0.12, { fill: R.spot });
  inner += S.ellipse(-rx * 0.15, ry * 0.5, rx * 0.16, ry * 0.1, { fill: R.spot });
  inner += S.ellipse(rx * 0.2, -ry * 0.62, rx * 0.13, ry * 0.08, { fill: R.spot });
  // zigzag band
  let z = `M${f(-rx * 1.3)} ${f(ry * 0.05)}`;
  for (let i = 0; i <= 8; i++) z += ` L${f(-rx * 1.3 + (i * rx * 2.6) / 8)} ${f(ry * 0.05 + (i % 2 ? -ry * 0.12 : 0))}`;
  inner += S.path(z, { fill: 'none', stroke: R.spot, 'stroke-width': size * 0.06, 'stroke-linejoin': 'round' });
  inner += S.rect(rx * 0.25, -ry, rx * 1.2, ry * 2.2, 0, { fill: '#000', opacity: 0.1, transform: `rotate(-8)` });
  inner += S.ellipse(-rx * 0.42, -ry * 0.45, rx * 0.13, ry * 0.22, { fill: '#fff', opacity: 0.8, transform: `rotate(18 ${f(-rx * 0.42)} ${f(-ry * 0.45)})` });
  o += S.clipDef(id, S.path(d));
  o += S.g(inner, null, { 'clip-path': `url(#${id})` });
  o += S.path(d, { fill: 'none', stroke: C.line, 'stroke-width': Math.max(5, size * 0.035), 'stroke-linejoin': 'round' });
  return S.g(o, `translate(${f(x)} ${f(y)}) rotate(${f(rot + wobble)})`);
}

// Bouquet held at its grip point (x,y); size = overall height.
function bouquet({ x = 0, y = 0, size = 260, rot = 0 } = {}) {
  const k = size / 260;
  let o = '';
  // stems + leaves
  o += S.path('M-6 -10 L-30 -150 M2 -10 L4 -160 M8 -10 L40 -146', { fill: 'none', stroke: '#2E8B3E', 'stroke-width': 8, 'stroke-linecap': 'round' });
  const leaf = (lx, ly, a) => S.ellipse(lx, ly, 26, 11, { fill: '#3FB34F', stroke: C.line, 'stroke-width': 5, transform: `rotate(${a} ${lx} ${ly})` });
  o += leaf(-58, -150, -35) + leaf(64, -146, 30) + leaf(-20, -205, -70);
  // flowers
  const rose = (fx, fy, r, c, dark) =>
    S.circle(fx, fy, r, { fill: c, stroke: C.line, 'stroke-width': 5 }) +
    S.path(`M${f(fx - r * 0.45)} ${f(fy)} Q${f(fx)} ${f(fy - r * 0.6)} ${f(fx + r * 0.45)} ${f(fy)} Q${f(fx)} ${f(fy + r * 0.45)} ${f(fx - r * 0.2)} ${f(fy - r * 0.05)}`,
      { fill: 'none', stroke: dark, 'stroke-width': 4.5, 'stroke-linecap': 'round' });
  o += rose(-46, -176, 30, '#FF5A7A', '#C2304F') + rose(42, -180, 30, '#FF5A7A', '#C2304F') + rose(0, -214, 34, '#E8243C', '#9E1428');
  o += rose(-14, -166, 24, '#FFFFFF', '#C9CAD3') + rose(30, -226, 22, '#FFD1DC', '#E58AA0');
  // wrapping cone
  o += S.path('M-92 -150 L92 -150 L14 30 L-14 30 Z', { fill: '#FFB3C7', stroke: C.line, 'stroke-width': 6, 'stroke-linejoin': 'round' });
  o += S.path('M-92 -150 L-40 -110 L0 -150 L40 -110 L92 -150', { fill: 'none', stroke: '#F27FA0', 'stroke-width': 5, 'stroke-linejoin': 'round' });
  o += S.path('M-30 -20 Q0 -4 30 -20 L22 6 Q0 14 -22 6 Z', { fill: '#E8243C', stroke: C.line, 'stroke-width': 5, 'stroke-linejoin': 'round' });
  return S.g(o, `translate(${f(x)} ${f(y)}) rotate(${f(rot)}) scale(${f(k)})`);
}

const hash = (n) => { const v = Math.sin(n * 127.1 + 311.7) * 43758.5453; return v - Math.floor(v); };

// The glitchy "???" Secret Egg. t drives the pixel flicker and RGB glitch.
function secretEgg({ x = 0, y = 0, size = 200, t = 0, rot = 0, glow = true } = {}) {
  const ry = size / 2, rx = ry * 0.74;
  const d = 'M' + eggPoints(rx, ry).map(([a, b]) => `${f(a)} ${f(b)}`).join(' L') + ' Z';
  let o = '';
  if (glow) {
    const gid = S.uid('sg');
    o += S.el('radialGradient', { id: gid }, '<stop offset="0" stop-color="#C77DFF" stop-opacity="0.9"/><stop offset="0.5" stop-color="#7B2FFF" stop-opacity="0.35"/><stop offset="1" stop-color="#7B2FFF" stop-opacity="0"/>');
    o += S.circle(0, 0, size * (1.05 + 0.06 * Math.sin(t * 6)), { fill: `url(#${gid})` });
  }
  const id = S.uid('se');
  const cols = ['#00F0FF', '#FF3DF2', '#FFE600', '#7CFF4F'];
  const k = Math.floor(t * 12);
  const cell = size * 0.1;
  let inner = S.path(d, { fill: '#2A1352' });
  inner += S.ellipse(0, ry * 0.35, rx * 0.9, ry * 0.5, { fill: '#4B1F8C', opacity: 0.8 });
  for (let i = 0; i < 30; i++) {
    const px = (hash(i * 3 + 1) - 0.5) * rx * 2.1, py = (hash(i * 5 + 2) - 0.5) * ry * 2.1;
    inner += S.rect(px, py, cell, cell, 2, { fill: cols[(i + k) % 4], opacity: f(0.25 + 0.6 * hash(i + k * 31)) });
  }
  inner += S.el('text', { x: 0, y: size * 0.11, 'font-family': 'Lilita One, sans-serif', 'font-size': size * 0.32, fill: '#FFFFFF', stroke: '#151515', 'stroke-width': size * 0.03, 'paint-order': 'stroke', 'text-anchor': 'middle' }, '???');
  inner += S.ellipse(-rx * 0.42, -ry * 0.48, rx * 0.12, ry * 0.2, { fill: '#fff', opacity: 0.75, transform: `rotate(18 ${f(-rx * 0.42)} ${f(-ry * 0.48)})` });
  o += S.clipDef(id, S.path(d)) + S.g(inner, null, { 'clip-path': `url(#${id})` });
  o += S.path(d, { fill: 'none', stroke: C.line, 'stroke-width': Math.max(5, size * 0.035), 'stroke-linejoin': 'round' });
  if (hash(k * 7.3) > 0.72) {
    const dx = size * (0.03 + 0.04 * hash(k));
    o += S.path(d, { fill: 'none', stroke: '#00F0FF', 'stroke-width': size * 0.03, opacity: 0.85, transform: `translate(${f(dx)} 0)` });
    o += S.path(d, { fill: 'none', stroke: '#FF3DF2', 'stroke-width': size * 0.03, opacity: 0.85, transform: `translate(${f(-dx)} 0)` });
  }
  return S.g(o, `translate(${f(x)} ${f(y)}) rotate(${f(rot)})`);
}

// Tablet seen from the back, held by two blocky hands. (x, y) = centre; on = screen light spill.
function tablet({ x = 0, y = 0, s = 1, rot = 0, on = true, glow = '#A8E8FF' } = {}) {
  let o = '';
  if (on) o += S.path('M-170 -128 L170 -128 L250 -330 L-250 -330 Z', { fill: glow, opacity: 0.18 });
  o += S.rect(-180, -130, 360, 250, 30, { fill: '#2B2F3A', stroke: C.line, 'stroke-width': 7 });
  o += S.rect(-166, -116, 332, 18, 9, { fill: '#3D4250' });
  if (on) o += S.rect(-170, -136, 340, 9, 4, { fill: glow, opacity: 0.9 });
  o += S.circle(0, -96, 7, { fill: '#151515' });
  o += S.g(egg({ x: 0, y: 0, size: 96, rarity: 'legendary', glow: false }), 'rotate(-10)');
  for (const sx of [-1, 1]) o += S.rect(sx * 170 - 34, 40, 68, 76, 18, { fill: '#FFFFFF', stroke: C.line, 'stroke-width': 7 }) + S.rect(sx * 170 - 34, 92, 68, 24, 10, { fill: '#1E2331', stroke: C.line, 'stroke-width': 6 });
  return S.g(o, `translate(${f(x)} ${f(y)}) rotate(${f(rot)}) scale(${f(s)})`);
}

// ---- kitchen props (all centred at their natural pivot)
function pancake({ x = 0, y = 0, s = 1, rot = 0, bite = false } = {}) {
  let o = S.ellipse(0, 10, 92, 30, { fill: '#C9853F', stroke: C.line, 'stroke-width': 6 });
  o += S.ellipse(0, 0, 92, 30, { fill: '#F2B65A', stroke: C.line, 'stroke-width': 6 });
  o += S.ellipse(-18, -4, 40, 12, { fill: '#FFD98A', opacity: 0.8 });
  o += S.rect(-14, -26, 28, 22, 5, { fill: '#FFF3B0', stroke: C.line, 'stroke-width': 4 }) + S.path('M-14 -10 L14 -10', { stroke: '#F5C842', 'stroke-width': 4 });
  if (bite) o += S.circle(78, -6, 26, { fill: '#FFFFFF' });
  return S.g(o, `translate(${f(x)} ${f(y)}) rotate(${f(rot)}) scale(${f(s)})`);
}
function plate({ x = 0, y = 0, s = 1 } = {}) {
  return S.g(S.ellipse(0, 6, 150, 40, { fill: '#D9DEE8', stroke: C.line, 'stroke-width': 6 }) + S.ellipse(0, 0, 150, 40, { fill: '#FFFFFF', stroke: C.line, 'stroke-width': 6 }) + S.ellipse(0, 0, 104, 26, { fill: 'none', stroke: '#D9DEE8', 'stroke-width': 5 }), `translate(${f(x)} ${f(y)}) scale(${f(s)})`);
}
function pan({ x = 0, y = 0, s = 1, rot = 0 } = {}) {
  let o = S.rect(110, -14, 170, 28, 12, { fill: '#2B2F3A', stroke: C.line, 'stroke-width': 6 });
  o += S.ellipse(0, 0, 130, 34, { fill: '#2B2F3A', stroke: C.line, 'stroke-width': 7 }) + S.ellipse(0, -4, 108, 24, { fill: '#454B5C' });
  return S.g(o, `translate(${f(x)} ${f(y)}) rotate(${f(rot)}) scale(${f(s)})`);
}
function spatula({ x = 0, y = 0, s = 1, rot = 0 } = {}) {
  const o = S.rect(-10, -170, 20, 170, 6, { fill: '#8A5A33', stroke: C.line, 'stroke-width': 5 }) + S.rect(-40, -250, 80, 90, 12, { fill: '#C9CED8', stroke: C.line, 'stroke-width': 6 }) +
    S.path('M-18 -235 L-18 -175 M0 -235 L0 -175 M18 -235 L18 -175', { stroke: '#8A92A6', 'stroke-width': 5 });
  return S.g(o, `translate(${f(x)} ${f(y)}) rotate(${f(rot)}) scale(${f(s)})`);
}
// apron for the torso 'mid' layer (front view, character space)
function apron() {
  return S.path('M-62 -480 L62 -480 L80 -300 L-80 -300 Z', { fill: '#FFFFFF', stroke: C.line, 'stroke-width': 6, 'stroke-linejoin': 'round' }) +
    S.path('M-62 -480 L-96 -530 M62 -480 L96 -530', { stroke: '#FFFFFF', 'stroke-width': 10 }) +
    S.path(F_heart(0, -400, 22), { fill: '#FF6FB5', stroke: C.line, 'stroke-width': 4 }) + S.rect(-60, -350, 120, 30, 8, { fill: '#FFD1E3', stroke: C.line, 'stroke-width': 4 });
}
function F_heart(cx, cy, s) {
  return `M${f(cx)} ${f(cy + s * 0.9)} C${f(cx - s * 1.5)} ${f(cy - s * 0.1)} ${f(cx - s * 0.9)} ${f(cy - s * 1.25)} ${f(cx)} ${f(cy - s * 0.45)} C${f(cx + s * 0.9)} ${f(cy - s * 1.25)} ${f(cx + s * 1.5)} ${f(cy - s * 0.1)} ${f(cx)} ${f(cy + s * 0.9)} Z`;
}

module.exports = { egg, bouquet, secretEgg, tablet, pancake, plate, pan, spatula, apron, RARITY };
