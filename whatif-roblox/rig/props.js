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

module.exports = { egg, bouquet, RARITY };
