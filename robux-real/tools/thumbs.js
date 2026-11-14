// YouTube thumbnails (4 variants) for "What If Robux Became Real Money?", built from the video's rig and props.
// Usage: node tools/thumbs.js [all|1|2|3|4]   -> thumbs/thumb_N.png (1920x1080) + thumb_N.jpg (1280x720)
'use strict';

const path = require('path');
const fs = require('fs');
const { execFileSync } = require('child_process');
const S = require('../rig/svg');
const F = require('../rig/face');
const ST = require('../rig/style');
const K = require('../scenes/kit');
const { draw } = require('../rig/cast');
const S01 = require('../scenes/s01');
const { openRenderer } = require('./render');

const OUT = path.join(__dirname, '..', 'thumbs');
const W = 1920, H = 1080;
const { f } = S;
const INK = '#141833';
const ol = (fill, w = 7) => ({ fill, stroke: INK, 'stroke-width': w, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' });

// ---------------------------------------------------------------- shared defs
const DEFS = `<defs>
<linearGradient id="tW" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFFFFF"/><stop offset="0.55" stop-color="#F2F6FF"/><stop offset="1" stop-color="#C9D8FF"/></linearGradient>
<linearGradient id="tY" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFF7A1"/><stop offset="0.45" stop-color="#FFD21F"/><stop offset="1" stop-color="#FF9A12"/></linearGradient>
<linearGradient id="tG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#E4FFB0"/><stop offset="0.45" stop-color="#7BEA4F"/><stop offset="1" stop-color="#22B34A"/></linearGradient>
<linearGradient id="tP" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFE0EC"/><stop offset="0.45" stop-color="#FF7AAE"/><stop offset="1" stop-color="#F0306F"/></linearGradient>
<linearGradient id="tR" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFD0D0"/><stop offset="0.45" stop-color="#FF4D5E"/><stop offset="1" stop-color="#C8102E"/></linearGradient>
<linearGradient id="gloss" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFFFFF" stop-opacity="0.85"/><stop offset="0.45" stop-color="#FFFFFF" stop-opacity="0"/></linearGradient>
<radialGradient id="halo" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#FFFFFF" stop-opacity="0.95"/><stop offset="0.35" stop-color="#FFF6C8" stop-opacity="0.6"/><stop offset="1" stop-color="#FFF6C8" stop-opacity="0"/></radialGradient>
<radialGradient id="haloGold" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#FFFBD0" stop-opacity="1"/><stop offset="0.3" stop-color="#FFD84A" stop-opacity="0.75"/><stop offset="1" stop-color="#FF9A12" stop-opacity="0"/></radialGradient>
<radialGradient id="haloRed" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#FFE0E0" stop-opacity="0.95"/><stop offset="0.35" stop-color="#FF6B6B" stop-opacity="0.55"/><stop offset="1" stop-color="#FF2E4D" stop-opacity="0"/></radialGradient>
<radialGradient id="haloGreen" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#E9FFD0" stop-opacity="0.95"/><stop offset="0.35" stop-color="#7BEA4F" stop-opacity="0.55"/><stop offset="1" stop-color="#1E9A48" stop-opacity="0"/></radialGradient>
<radialGradient id="haloPink" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#FFFFFF" stop-opacity="0.9"/><stop offset="0.4" stop-color="#FFC1D8" stop-opacity="0.55"/><stop offset="1" stop-color="#FFC1D8" stop-opacity="0"/></radialGradient>
<radialGradient id="vigT" cx="0.5" cy="0.45" r="0.75"><stop offset="0.55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#0A0620" stop-opacity="0.55"/></radialGradient>
<linearGradient id="bgGold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FF8A3D"/><stop offset="0.5" stop-color="#FFC53D"/><stop offset="1" stop-color="#FFE9A0"/></linearGradient>
<linearGradient id="bgRed" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3A0B2E"/><stop offset="0.55" stop-color="#9A1B3A"/><stop offset="1" stop-color="#E2453A"/></linearGradient>
<linearGradient id="bgStream" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#5B2BB8"/><stop offset="0.5" stop-color="#C13BC9"/><stop offset="1" stop-color="#FF7AAE"/></linearGradient>
<linearGradient id="bgNight" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0E0A2E"/><stop offset="0.6" stop-color="#2A1E6E"/><stop offset="1" stop-color="#5A2E8C"/></linearGradient>
<filter id="rim" filterUnits="userSpaceOnUse" x="0" y="0" width="${W}" height="${H}">
  <feMorphology in="SourceAlpha" operator="dilate" radius="10" result="d"/>
  <feFlood flood-color="#FFFFFF"/><feComposite in2="d" operator="in" result="w"/>
  <feGaussianBlur in="w" stdDeviation="1.2" result="ws"/>
  <feMerge><feMergeNode in="ws"/><feMergeNode in="SourceGraphic"/></feMerge>
</filter>
</defs>`;

// big 3D outlined title text
function bigText(lines, x, y, { rot = -3, gap = 0.96, depth = 12 } = {}) {
  let o = '';
  let yy = 0;
  for (const L of lines) {
    const size = L.size;
    const attrs = { x: 0, y: 0, 'font-family': 'Lilita One, sans-serif', 'font-size': size, 'text-anchor': 'middle', 'letter-spacing': L.ls ?? 2 };
    const at = `translate(${f(L.dx || 0)} ${f(yy)}) rotate(${f(L.rot || 0)})`;
    let g = '';
    g += S.el('text', { ...attrs, fill: '#05061A', stroke: '#05061A', 'stroke-width': size * 0.2, 'stroke-linejoin': 'round', opacity: 0.45, transform: `translate(0 ${f(depth + 16)})` }, L.t);
    for (let k = depth; k >= 1; k -= 1.5) g += S.el('text', { ...attrs, fill: INK, stroke: INK, 'stroke-width': size * 0.17, 'stroke-linejoin': 'round', transform: `translate(0 ${f(k)})` }, L.t);
    g += S.el('text', { ...attrs, fill: L.fill, stroke: INK, 'stroke-width': size * 0.17, 'stroke-linejoin': 'round', 'paint-order': 'stroke' }, L.t);
    g += S.el('text', { ...attrs, fill: 'none', stroke: '#FFFFFF', 'stroke-width': size * 0.025, opacity: 0.55, transform: 'translate(0 -3)' }, L.t);
    g += S.el('text', { ...attrs, fill: 'url(#gloss)', opacity: 0.55 }, L.t);
    o += S.g(g, at);
    yy += size * gap;
  }
  return S.g(o, `translate(${f(x)} ${f(y)}) rotate(${f(rot)})`);
}
const rim = (inner) => S.g(inner, null, { filter: 'url(#rim)' });
const sparkles = (pts) => pts.map(([x, y, r, c]) => F.sparkle(x, y, r, c || '#FFFFFF')).join('');
const coins = (list) => list.map(([x, y, r, rot, spin]) => K.coin(x, y, r, rot || 0, spin || 0)).join('');

// a dollar bill
function bill(x, y, s, rot) {
  let o = S.rect(-150, -70, 300, 140, 14, ol('#7DD87A', 7)) + S.rect(-128, -50, 256, 100, 10, { fill: 'none', stroke: '#2E8B4A', 'stroke-width': 5 });
  o += S.circle(0, 0, 40, ol('#BDF2B0', 5)) + K.T('$', 0, 22, 62, '#2E8B4A');
  o += K.T('1', -100, -18, 34, '#2E8B4A') + K.T('1', 100, 46, 34, '#2E8B4A');
  return S.g(o, `translate(${f(x)} ${f(y)}) rotate(${f(rot)}) scale(${f(s)})`);
}
function sandwich(x, y, s = 1, rot = 0) {
  let o = S.rect(-180, 10, 360, 46, 22, ol('#E0A15A', 6));
  let wav = 'M-188 8';
  for (let i = 0; i <= 12; i++) wav += ` Q${-188 + i * 31 + 15} ${i % 2 ? 26 : -6} ${-188 + (i + 1) * 31} 8`;
  o += S.path(wav + ' L190 22 L-188 22 Z', ol('#5CCB4A', 5));
  for (const tx of [-120, -40, 40, 120]) o += S.ellipse(tx, 6, 34, 12, ol('#FF5A5A', 4));
  o += S.path('M-170 4 L-110 4 L-140 30 Z M60 4 L130 4 L95 30 Z', ol('#FFD21F', 4));
  o += S.path('M-180 4 Q-182 -86 0 -92 Q182 -86 180 4 Z', ol('#EBB46C', 6));
  o += S.path('M-140 -40 Q-120 -74 -40 -80', { fill: 'none', stroke: '#FFE0A8', 'stroke-width': 10, 'stroke-linecap': 'round', opacity: 0.8 });
  for (let i = 0; i < 6; i++) o += S.ellipse(-110 + i * 44, -50 - (i % 2) * 14, 7, 4, { fill: '#FFF6D8' });
  return S.g(o, `translate(${f(x)} ${f(y)}) rotate(${f(rot)}) scale(${f(s)})`);
}
// a big price tag with a Robux amount
function bigTag(x, y, amount, s, rot, col = '#FFE14D') {
  let o = S.path('M-300 -90 L230 -90 L310 0 L230 90 L-300 90 Z', ol(col, 9)) + S.circle(240, 0, 18, ol('#FFFFFF', 6));
  o += K.robuxText(-40, 40, amount, 110, '#2A1640');
  return S.g(o, `translate(${f(x)} ${f(y)}) rotate(${f(rot)}) scale(${f(s)})`);
}
// rising price chart arrow
function upArrow(x0, y0, x1, y1, col) {
  const pts = [];
  for (let i = 0; i <= 8; i++) {
    const u = i / 8;
    pts.push([x0 + (x1 - x0) * u, y0 + (y1 - y0) * Math.pow(u, 1.8) + (i % 2 ? -26 : 26) * (i > 0 && i < 8)]);
  }
  const d = 'M' + pts.map(([x, y]) => `${f(x)} ${f(y)}`).join(' L');
  const [ax, ay] = pts[pts.length - 1], [bx, by] = pts[pts.length - 2];
  const a = Math.atan2(ay - by, ax - bx);
  const head = [[ax + Math.cos(a) * 70, ay + Math.sin(a) * 70], [ax + Math.cos(a + 2.2) * 70, ay + Math.sin(a + 2.2) * 70], [ax + Math.cos(a - 2.2) * 70, ay + Math.sin(a - 2.2) * 70]];
  return S.path(d, { fill: 'none', stroke: INK, 'stroke-width': 62, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }) +
    S.path(d, { fill: 'none', stroke: col, 'stroke-width': 40, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }) +
    S.path('M' + head.map(([x, y]) => `${f(x)} ${f(y)}`).join(' L') + ' Z', ol(col, 10));
}
function heart(x, y, sz, rot = 0) {
  return S.g(S.path(F.heartPath(0, 0, sz), ol('#FF5A7A', 6)) + S.path(F.heartPath(-sz * 0.25, -sz * 0.3, sz * 0.3), { fill: '#FFFFFF', opacity: 0.5 }), `translate(${f(x)} ${f(y)}) rotate(${f(rot)})`);
}

// ---------------------------------------------------------------- 1: 1 ROBUX = $1?!
function thumb1() {
  let o = DEFS + S01.DEFS;
  o += S.rect(0, 0, W, H, 0, { fill: 'url(#bgGold)' });
  o += K.rays(1180, 600, 24, 1700, '#FFFFFF', 0.16, 3);
  o += S.ellipse(1120, 620, 760, 620, { fill: 'url(#halo)' });
  // flying money
  o += bill(1500, 330, 1.1, -18) + bill(1760, 640, 1.0, 22) + bill(1150, 180, 0.8, 12) + bill(1330, 760, 0.9, -8);
  o += coins([[1640, 160, 70, 10, 0.3], [1840, 380, 54, -20, 0.8], [1250, 470, 44, 30, 0], [1820, 880, 60, 0, 1.1], [1420, 560, 36, 0, 0.5]]);
  // Ty, rich, sinking into the coin pool, arms up
  const ty = draw.ty({
    x: 640, y: 1640, s: 1.45, armR: 150, armL: 140, headRot: -5, lean: -2, shade: true, shadow: false,
    face: { name: 'rich', eyes: { type: 'robux', pupil: 2.2 }, mouth: 'bigGrin', fx: ['sparkles'] },
  });
  o += rim(ty);
  // coin pool in front
  o += S.path('M-40 900 Q300 840 640 880 Q980 920 1300 870 Q1600 830 1960 890 L1960 1120 L-40 1120 Z', { fill: 'url(#coinPile)', stroke: INK, 'stroke-width': 9 });
  o += coins([[160, 880, 54, 10, 0], [420, 860, 46, -20, 0.6], [860, 900, 50, 25, 0.2], [1080, 880, 42, 0, 1.0], [1400, 860, 52, -10, 0.4], [1700, 880, 48, 15, 0]]);
  // coins splashing up around him
  o += coins([[300, 760, 40, 0, 0.4], [980, 720, 44, 20, 0.9], [220, 600, 34, -30, 1.2], [1060, 560, 30, 0, 0.2]]);
  o += sparkles([[1250, 300, 40], [1600, 520, 30, '#FFFFFF'], [380, 420, 34, '#FFFFFF'], [980, 380, 26]]);
  o += S.rect(0, 0, W, H, 0, { fill: 'url(#vigT)' });
  o += bigText([{ t: '1 ROBUX', size: 190, fill: 'url(#tY)' }, { t: '= $1?!', size: 230, fill: 'url(#tG)', dx: 60 }], 1380, 230, { rot: -4 });
  return o;
}

// ---------------------------------------------------------------- 2: ONE SANDWICH?!
function thumb2() {
  let o = DEFS;
  o += S.rect(0, 0, W, H, 0, { fill: 'url(#bgRed)' });
  o += K.rays(1300, 560, 22, 1700, '#FFB0A0', 0.1, 0);
  // grid of a price chart
  for (let x = 0; x <= W; x += 120) o += S.path(`M${x} 0 L${x} ${H}`, { stroke: '#FFFFFF', 'stroke-width': 2, opacity: 0.08 });
  for (let y = 0; y <= H; y += 120) o += S.path(`M0 ${y} L${W} ${y}`, { stroke: '#FFFFFF', 'stroke-width': 2, opacity: 0.08 });
  o += upArrow(980, 1000, 1820, 330, '#FF3B5C');
  o += S.ellipse(1300, 640, 560, 480, { fill: 'url(#haloRed)', opacity: 0.8 });
  // the sandwich and its insane price tag
  o += rim(sandwich(1340, 850, 1.5, -6));
  o += rim(bigTag(1380, 590, '3,000,000', 0.9, 7));
  o += sparkles([[1640, 600, 34], [1040, 520, 28], [1600, 880, 26]]);
  // Ty, devastated, pointing at it
  const ty = draw.ty({
    x: 520, y: 1620, s: 1.42, armR: 92, armL: 16, headRot: 7, lean: 3, shade: true, shadow: false,
    face: { name: 'shocked', eyes: { pupil: 0.45, look: [0.75, -0.2] }, mouth: 'wail', fx: ['sweat', 'sweat2', 'tears'] },
  });
  o += rim(ty);
  o += K.grayCoin(240, 820, 44, 20, 0.4) + K.grayCoin(820, 900, 36, -10, 0.9);
  o += S.rect(0, 0, W, H, 0, { fill: 'url(#vigT)' });
  o += bigText([{ t: 'ONE', size: 170, fill: 'url(#tW)', dx: -150 }, { t: 'SANDWICH?!', size: 210, fill: 'url(#tR)' }], 1180, 190, { rot: -4 });
  return o;
}

// ---------------------------------------------------------------- 3: GRANDMA IS RICH?!
function thumb3() {
  let o = DEFS + S01.DEFS;
  o += S.rect(0, 0, W, H, 0, { fill: 'url(#bgStream)' });
  o += K.rays(640, 620, 24, 1700, '#FFFFFF', 0.12, 6);
  o += S.ellipse(660, 640, 680, 620, { fill: 'url(#haloPink)' });
  // coin mountain under grandma
  o += S.path('M60 1120 Q160 760 380 700 Q660 610 940 700 Q1160 770 1240 1120 Z', { fill: 'url(#coinPile)', stroke: INK, 'stroke-width': 9 });
  o += coins([[300, 760, 44, 0, 0.3], [560, 690, 40, 20, 0.8], [860, 720, 46, -10, 0], [1080, 860, 50, 10, 0.5], [180, 960, 48, 0, 1.0]]);
  const gm = draw.grandma({
    x: 660, y: 1500, s: 1.18, armR: 156, armL: 120, headRot: -4, shade: true, shadow: false,
    face: { name: 'joy', eyes: { type: 'star' }, mouth: 'bigGrin', fx: ['sparkles'] },
  });
  o += rim(gm);
  // stream overlay: LIVE + viewers, chat hearts
  o += S.g(S.rect(-170, -54, 340, 108, 30, ol('#FF2E4D', 8)) + K.T('LIVE', 30, 30, 84, '#FFFFFF') + S.circle(-110, 0, 22, { fill: '#FFFFFF' }), 'translate(1240 570) rotate(-6)');
  o += S.g(S.rect(-300, -66, 600, 132, 34, ol('#1A1030', 8)) + S.path('M-230 0 Q-190 -40 -150 0 Q-190 40 -230 0 Z', ol('#FFFFFF', 5)) + S.circle(-190, 0, 14, { fill: INK }) + K.T('2,000,000', 50, 34, 92, '#FFFFFF'), 'translate(1330 740) rotate(4) scale(0.85)');
  o += heart(1780, 470, 46, 12) + heart(1200, 800, 40, -12) + heart(1740, 880, 36, 6) + heart(1140, 420, 30, -8);
  // Dad, small, jaw on the floor
  const dad = draw.dad({ x: 1760, y: 1250, s: 0.6, armR: 20, armL: 20, headRot: 6, shade: true, shadow: false,
    face: { name: 'shocked', mouth: 'O', eyes: { pupil: 0.4, look: [-0.8, -0.4] }, fx: ['sweat'] } });
  o += rim(dad);
  o += sparkles([[1000, 260, 34], [300, 380, 30], [1260, 640, 24]]);
  o += S.rect(0, 0, W, H, 0, { fill: 'url(#vigT)' });
  o += bigText([{ t: 'GRANDMA', size: 180, fill: 'url(#tP)' }, { t: 'IS RICH?!', size: 210, fill: 'url(#tY)', dx: 40 }], 1380, 200, { rot: 4 });
  return o;
}

// ---------------------------------------------------------------- 4: HE TOOK 30%!!
function buildings(list, base, col, win, op) {
  let o = '';
  for (const [x, y, w] of list) {
    o += S.rect(x, y, w, base - y + 200, 6, { fill: col, stroke: '#0A0820', 'stroke-width': 6 });
    for (let wy = y + 30; wy < base + 100; wy += 54) for (let wx = x + 18; wx < x + w - 24; wx += 38) o += S.rect(wx, wy, 20, 26, 3, { fill: win, opacity: ((wx * 7 + wy * 3) % 5) > 1 ? op : 0.12 });
  }
  return o;
}
function thumb4() {
  let o = DEFS;
  o += S.rect(0, 0, W, H, 0, { fill: 'url(#bgNight)' });
  for (let i = 0; i < 40; i++) o += S.circle((i * 397) % W, (i * 211) % 520, 2 + (i % 3), { fill: '#FFFFFF', opacity: 0.5 });
  o += S.ellipse(1250, 520, 780, 700, { fill: 'url(#haloGreen)', opacity: 0.75 });
  o += K.rays(1250, 520, 24, 1700, '#9CFF7A', 0.08, 0);
  o += buildings([[700, 640, 130], [860, 700, 110], [1520, 660, 140], [1700, 610, 120], [1840, 690, 110]], 1080, '#1E1650', '#FFD86B', 0.55);
  // the GIANT thirty percent guy towering over the city, a coin held up high
  const [hx, hy] = require('../scenes/acting').hand(150, 1);
  const th = draw.thirty({
    x: 1250, y: 1230, s: 1.6, armR: 150, armL: 40, headRot: -5, lean: -2, shade: true, shadow: false,
    face: { name: 'smug', mouth: 'grin', eyes: { type: 'robux', pupil: 2 } },
    props: [{ svg: K.coin(hx + 20, hy - 120, 150, 12, 0.2), layer: 'top' }],
  });
  o += rim(th);
  // the city at his feet (in front of his legs)
  o += buildings([[0, 760, 150], [140, 820, 120], [280, 910, 160], [470, 800, 130], [620, 850, 150], [960, 860, 170], [1150, 900, 150], [1330, 840, 160], [1520, 880, 140], [1680, 800, 130], [1820, 860, 120]], 1080, '#2B2170', '#FFE08A', 0.85);
  o += coins([[1050, 860, 40, 0, 0.2], [1460, 830, 44, 20, 0.7], [1600, 980, 36, -10, 0.4]]);
  // Ty, tiny and scared on a rooftop
  const ty = draw.ty({ x: 360, y: 912, s: 0.4, armR: 70, armL: 70, lean: -6, headRot: -8, shade: true, shadow: false,
    face: { name: 'scared', mouth: 'scream', eyes: { pupil: 0.4, look: [0.9, -0.6] }, fx: ['sweat', 'sweat2'] } });
  o += rim(ty);
  // -30% stamp
  o += S.g(S.rect(-250, -100, 500, 200, 30, { fill: 'none', stroke: '#FF2E4D', 'stroke-width': 18 }) + K.T('-30%', 0, 58, 170, '#FF2E4D'), 'translate(1720 650) rotate(10) scale(0.7)');
  o += sparkles([[1500, 120, 30, '#B6FF9A'], [880, 420, 26, '#B6FF9A']]);
  o += S.rect(0, 0, W, H, 0, { fill: 'url(#vigT)' });
  o += bigText([{ t: 'HE TOOK', size: 170, fill: 'url(#tW)' }, { t: '30%!!', size: 250, fill: 'url(#tG)', dx: -20 }], 470, 200, { rot: -5, gap: 1.3 });
  return o;
}

const ALL = { 1: thumb1, 2: thumb2, 3: thumb3, 4: thumb4 };

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const which = process.argv[2] && process.argv[2] !== 'all' ? process.argv[2].split(',') : Object.keys(ALL);
  const r = await openRenderer(W, H, { staticDefs: ST.DEFS });
  for (const k of which) {
    S.resetIds();
    const png = path.join(OUT, `thumb_${k}.png`);
    fs.writeFileSync(png, await r.render(ALL[k]()));
    const jpg = path.join(OUT, `thumb_${k}.jpg`);
    execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', png, '-vf', 'scale=1280:720:flags=lanczos', '-q:v', '2', jpg]);
    console.log('wrote', png, jpg);
  }
  await r.close();
}
if (require.main === module) main().catch((e) => { console.error(e); process.exit(1); });
module.exports = { ALL };
