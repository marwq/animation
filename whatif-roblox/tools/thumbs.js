// YouTube thumbnails (4 variants), built from the same rig + backgrounds as the video.
// Usage: node tools/thumbs.js [all|1|2|3|4]   -> thumbs/thumb_N.png (1920x1080) + thumb_N.jpg (1280x720)
'use strict';

const path = require('path');
const fs = require('fs');
const { execFileSync } = require('child_process');
const S = require('../rig/svg');
const F = require('../rig/face');
const E = require('../scenes/env');
const { drawHero } = require('../rig/hero');
const { drawNova } = require('../rig/nova');
const cast = require('../rig/cast').draw;
const { egg, bouquet, secretEgg } = require('../rig/props');
const A = require('../scenes/acting');
const { openRenderer } = require('./render');

const OUT = path.join(__dirname, '..', 'thumbs');
const W = 1920, H = 1080;
const { f } = S;
const INK = '#141833';

// ---------------------------------------------------------------- shared defs
const DEFS = `<defs>
<linearGradient id="tW" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFFFFF"/><stop offset="0.55" stop-color="#F2F6FF"/><stop offset="1" stop-color="#C9D8FF"/></linearGradient>
<linearGradient id="tY" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFF7A1"/><stop offset="0.45" stop-color="#FFD21F"/><stop offset="1" stop-color="#FF9A12"/></linearGradient>
<linearGradient id="tG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#E4FFB0"/><stop offset="0.45" stop-color="#7BEA4F"/><stop offset="1" stop-color="#22B34A"/></linearGradient>
<linearGradient id="tP" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFE0EC"/><stop offset="0.45" stop-color="#FF7AAE"/><stop offset="1" stop-color="#F0306F"/></linearGradient>
<linearGradient id="tR" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFD0D0"/><stop offset="0.45" stop-color="#FF4D5E"/><stop offset="1" stop-color="#C8102E"/></linearGradient>
<linearGradient id="gloss" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFFFFF" stop-opacity="0.85"/><stop offset="0.45" stop-color="#FFFFFF" stop-opacity="0"/></linearGradient>
<radialGradient id="halo" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#FFFFFF" stop-opacity="0.95"/><stop offset="0.35" stop-color="#FFF6C8" stop-opacity="0.6"/><stop offset="1" stop-color="#FFF6C8" stop-opacity="0"/></radialGradient>
<radialGradient id="haloPink" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#FFFFFF" stop-opacity="0.9"/><stop offset="0.4" stop-color="#FFC1D8" stop-opacity="0.55"/><stop offset="1" stop-color="#FFC1D8" stop-opacity="0"/></radialGradient>
<radialGradient id="haloGold" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#FFFBD0" stop-opacity="1"/><stop offset="0.3" stop-color="#FFD84A" stop-opacity="0.75"/><stop offset="1" stop-color="#FF9A12" stop-opacity="0"/></radialGradient>
<radialGradient id="haloPurple" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#FFFFFF" stop-opacity="0.9"/><stop offset="0.3" stop-color="#C77DFF" stop-opacity="0.7"/><stop offset="1" stop-color="#7B2FFF" stop-opacity="0"/></radialGradient>
<radialGradient id="vigT" cx="0.5" cy="0.45" r="0.75"><stop offset="0.55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#0A0620" stop-opacity="0.55"/></radialGradient>
<linearGradient id="sunsetT" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4A2E86"/><stop offset="0.42" stop-color="#E35D86"/><stop offset="0.78" stop-color="#FFAE6B"/><stop offset="1" stop-color="#FFD98A"/></linearGradient>
<linearGradient id="vaultT" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#160B3A"/><stop offset="0.6" stop-color="#3A1670"/><stop offset="1" stop-color="#7A2A8C"/></linearGradient>
<filter id="rim" filterUnits="userSpaceOnUse" x="0" y="0" width="${W}" height="${H}">
  <feMorphology in="SourceAlpha" operator="dilate" radius="10" result="d"/>
  <feFlood flood-color="#FFFFFF"/><feComposite in2="d" operator="in" result="w"/>
  <feGaussianBlur in="w" stdDeviation="1.2" result="ws"/>
  <feMerge><feMergeNode in="ws"/><feMergeNode in="SourceGraphic"/></feMerge>
</filter>
<filter id="soft" filterUnits="userSpaceOnUse" x="0" y="0" width="${W}" height="${H}"><feGaussianBlur stdDeviation="5"/></filter>
<filter id="glowF" filterUnits="userSpaceOnUse" x="0" y="0" width="${W}" height="${H}"><feGaussianBlur stdDeviation="14"/></filter>
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
    // soft drop shadow
    g += S.el('text', { ...attrs, fill: '#05061A', stroke: '#05061A', 'stroke-width': size * 0.2, 'stroke-linejoin': 'round', opacity: 0.45, transform: `translate(0 ${f(depth + 16)})` }, L.t);
    // extrusion
    for (let k = depth; k >= 1; k -= 1.5) g += S.el('text', { ...attrs, fill: INK, stroke: INK, 'stroke-width': size * 0.17, 'stroke-linejoin': 'round', transform: `translate(0 ${f(k)})` }, L.t);
    // outline + fill
    g += S.el('text', { ...attrs, fill: L.fill, stroke: INK, 'stroke-width': size * 0.17, 'stroke-linejoin': 'round', 'paint-order': 'stroke' }, L.t);
    // inner bevel line + gloss
    g += S.el('text', { ...attrs, fill: 'none', stroke: '#FFFFFF', 'stroke-width': size * 0.025, opacity: 0.55, transform: 'translate(0 -3)' }, L.t);
    g += S.el('text', { ...attrs, fill: 'url(#gloss)', opacity: 0.55 }, L.t);
    o += S.g(g, at);
    yy += size * gap;
  }
  return S.g(o, `translate(${f(x)} ${f(y)}) rotate(${f(rot)})`);
}

// radial light rays
function rays(cx, cy, n, r, col, op, rot = 0) {
  let o = '';
  for (let i = 0; i < n; i++) {
    const a0 = ((i / n) * 360 + rot) * Math.PI / 180, a1 = (((i + 0.5) / n) * 360 + rot) * Math.PI / 180;
    o += S.path(`M${cx} ${cy} L${f(cx + r * Math.cos(a0))} ${f(cy + r * Math.sin(a0))} L${f(cx + r * Math.cos(a1))} ${f(cy + r * Math.sin(a1))} Z`, { fill: col, opacity: op });
  }
  return o;
}

// a Roblox-style brick with studs
function brick(x, y, s, rot, col, shade) {
  const w = 120, h = 80;
  let o = S.rect(-w / 2, -h / 2, w, h, 14, { fill: col, stroke: INK, 'stroke-width': 7 });
  o += S.rect(-w / 2 + 8, -h / 2 + 8, w - 16, 18, 8, { fill: '#FFFFFF', opacity: 0.35 });
  o += S.rect(-w / 2, h / 2 - 20, w, 20, 10, { fill: shade, opacity: 0.6 });
  for (const sx of [-28, 28]) o += S.ellipse(sx, -h / 2 - 2, 20, 9, { fill: col, stroke: INK, 'stroke-width': 6 }) + S.rect(sx - 20, -h / 2 - 14, 40, 12, 4, { fill: col }) + S.ellipse(sx, -h / 2 - 14, 20, 9, { fill: col, stroke: INK, 'stroke-width': 6 }) + S.ellipse(sx - 6, -h / 2 - 16, 6, 3, { fill: '#FFFFFF', opacity: 0.6 });
  return S.g(o, `translate(${f(x)} ${f(y)}) rotate(${f(rot)}) scale(${f(s)})`);
}
const BRICKS = [['#FF4D4D', '#B81F2E'], ['#3B8CFF', '#1A56C2'], ['#FFD21F', '#D99A0A'], ['#3BD16F', '#1E9A48'], ['#B66BFF', '#7B2FC0'], ['#FF8A2B', '#C4560A']];

function pixels(cx, cy, n, spread, seed, cols) {
  let o = '';
  for (let i = 0; i < n; i++) {
    const h = (k) => { const v = Math.sin((i + 1) * (12.9898 + k * 7.1) + seed * 78.233) * 43758.5453; return v - Math.floor(v); };
    const a = h(1) * Math.PI * 2, d = spread * (0.25 + 0.75 * h(2));
    const s = 14 + 30 * h(3);
    o += S.rect(cx + Math.cos(a) * d - s / 2, cy + Math.sin(a) * d - s / 2, s, s, 3, { fill: cols[i % cols.length], stroke: INK, 'stroke-width': 3, opacity: 0.95, transform: `rotate(${f(h(4) * 40 - 20)} ${f(cx + Math.cos(a) * d)} ${f(cy + Math.sin(a) * d)})` });
  }
  return o;
}

const rim = (inner) => S.g(inner, null, { filter: 'url(#rim)' });
const sparkles = (pts) => pts.map(([x, y, r, c]) => F.sparkle(x, y, r, c || '#FFFFFF')).join('');

// ---------------------------------------------------------------- 1: I WOKE UP IN ROBLOX?!
function thumb1() {
  let o = DEFS + E.DEFS;
  const cam = { zoom: 1.15, fx: 960, fy: 640 };
  const L = E.townLayers(cam, 3.2, { noFg: true });
  o += S.g(L.bg + L.street, null, { filter: 'url(#soft)' });
  o += S.rect(0, 0, W, H, 0, { fill: '#2B1D6B', opacity: 0.12 });
  o += rays(1180, 560, 22, 1500, '#FFFFFF', 0.13, 4);
  o += S.ellipse(1060, 560, 760, 620, { fill: 'url(#halo)' });
  // pixel storm out of the glitch egg (top right)
  o += pixels(1250, 460, 80, 640, 1, ['#FF4D4D', '#3B8CFF', '#FFD21F', '#3BD16F', '#B66BFF', '#FFFFFF']);
  [[1600, 860, 1.25, 18, 0], [1780, 300, 1.0, -22, 1], [280, 830, 1.1, -14, 3], [150, 330, 0.9, 20, 4], [1500, 120, 0.8, 30, 5], [420, 560, 0.75, -30, 2]].forEach(([x, y, s, r, c]) => { o += brick(x, y, s, r, BRICKS[c][0], BRICKS[c][1]); });
  // hero close-up, shocked, holding the glitchy ??? egg up
  const hx = 720, hy = 1690, hs = 1.36;
  const hr = A.hand(146, 1);
  const hero = drawHero({
    x: hx, y: hy, s: hs, armR: 146, armL: 18, headRot: -4, lean: -2, dimFar: false,
    face: { name: 'shocked', eyes: { pupil: 0.48, look: [0.55, -0.55], cross: 0 }, mouth: 'o', fx: ['sweat', 'sweat2'] },
    props: [{ svg: secretEgg({ x: hr[0] + 40, y: hr[1] - 165, size: 300, t: 1.3, rot: 12 }), layer: 'top' }],
  });
  o += rim(hero);
  o += sparkles([[1250, 260, 34], [1660, 560, 26], [420, 420, 30, '#FFE14D'], [1320, 820, 22]]);
  o += S.rect(0, 0, W, H, 0, { fill: 'url(#vigT)' });
  o += bigText([{ t: 'I WOKE UP', size: 160, fill: 'url(#tW)', dx: -40 }, { t: 'IN ROBLOX?!', size: 200, fill: 'url(#tY)' }], 640, 185, { rot: -4 });
  return o;
}

// ---------------------------------------------------------------- 2: THE $1,000,000,000 EGG
function thumb2() {
  let o = DEFS + E.DEFS;
  o += S.rect(0, 0, W, H, 0, { fill: 'url(#vaultT)' });
  o += rays(1330, 600, 26, 1700, '#FFD84A', 0.12, 0);
  // vault floor + lasers
  o += S.path('M0 930 L1920 930 L1920 1080 L0 1080 Z', { fill: '#24124A' }) + S.path('M0 930 L1920 930', { stroke: '#FFC52E', 'stroke-width': 14 });
  for (let x = -40; x < 1960; x += 120) o += S.path(`M${x} 944 L${x + 60} 944 L${x + 20} 972 L${x - 40} 972 Z`, { fill: '#FFC52E', opacity: 0.8 });
  o += E.beam(0, 180, 1920, 760, 1) + E.beam(0, 880, 1920, 260, 1) + E.beam(380, 0, 1100, 1080, 0.8) + E.beam(1920, 60, 1500, 1080, 0.8);
  o += S.ellipse(1340, 560, 640, 640, { fill: 'url(#haloGold)' });
  // the legendary egg
  o += rim(egg({ x: 1380, y: 640, size: 600, rarity: 'legendary', glow: true, rot: 8 }));
  // robux + cash flying
  for (const [x, y, r] of [[1700, 230, 62], [1760, 760, 50], [1040, 230, 44], [1840, 470, 36], [990, 860, 40]]) o += F.robuxIcon(x, y, r);
  const cash = require('../scenes/env4').cash;
  o += cash(1620, 920, 1.3, -18) + cash(1080, 120, 1.1, 22) + cash(1880, 160, 1.0, 35) + cash(980, 640, 0.9, -30);
  // hero: robux eyes, mouth open
  const hero = drawHero({
    x: 470, y: 1790, s: 1.42, armR: 70, armL: 26, headRot: 5, lean: 3, dimFar: false,
    face: { name: 'amazed', eyes: { type: 'robux', pupil: 2.3, look: [0.4, 0], cross: 0 }, mouth: 'bigGrin', fx: ['sparkles'] },
  });
  o += rim(hero);
  o += sparkles([[1100, 400, 40, '#FFE14D'], [1620, 380, 30, '#FFFFFF'], [1500, 900, 28, '#FFE14D'], [300, 420, 26]]);
  o += S.rect(0, 0, W, H, 0, { fill: 'url(#vigT)' });
  o += bigText([{ t: '$1,000,000,000', size: 170, fill: 'url(#tG)' }, { t: 'EGG?!', size: 230, fill: 'url(#tY)', dx: 180 }], 900, 190, { rot: -3 });
  return o;
}

// ---------------------------------------------------------------- 3: SHE SAID YES?!
function thumb3() {
  let o = DEFS + E.DEFS;
  o += S.rect(0, 0, W, H, 0, { fill: 'url(#sunsetT)' });
  o += rays(960, 660, 24, 1600, '#FFFFFF', 0.08, 7);
  o += S.circle(960, 690, 480, { fill: 'url(#halo)' });
  o += S.rect(860, 600, 200, 200, 20, { fill: '#FFE06B', stroke: '#F0A93A', 'stroke-width': 9 });
  for (const [x, y, w] of [[0, 700, 170], [160, 650, 130], [320, 720, 190], [540, 640, 150], [1240, 650, 160], [1420, 690, 210], [1650, 630, 130], [1790, 700, 170]]) o += S.rect(x, y, w, 500, 8, { fill: '#6E3F84', opacity: 0.8 });
  o += S.rect(-20, 930, 1960, 200, 0, { fill: '#3B2A4A' }) + S.path('M-20 930 L1940 930', { stroke: INK, 'stroke-width': 8 });
  const heart = (x, y, sz, a, rot = 0) => S.g(S.path(F.heartPath(0, 0, sz), { fill: '#FF5A7A', stroke: INK, 'stroke-width': 6 }) + S.path(F.heartPath(-sz * 0.25, -sz * 0.3, sz * 0.3), { fill: '#FFFFFF', opacity: 0.5 }), `translate(${x} ${y}) rotate(${rot})`, { opacity: a });
  o += heart(960, 380, 70, 1, -6) + heart(1090, 260, 44, 0.9, 10) + heart(830, 250, 36, 0.85, -12) + heart(1500, 520, 40, 0.8, 8) + heart(380, 500, 34, 0.75, -10) + heart(1180, 470, 26, 0.8);
  const hero = drawHero({
    x: 600, y: 1390, s: 1.08, turn: 0.55, armR: 74, armL: 8, bodyY: 10, lean: 5, headRot: 6, dimFar: false,
    face: { name: 'nervous', mouth: 'wavy', eyes: { look: [0.9, 0.05], pupil: 0.85, cross: 0, type: 'heart' }, fx: ['redface', 'steam', 'sweat'] },
    props: [{ svg: bouquet({ x: 340, y: -380, size: 330, rot: 22 }), layer: 'top' }],
  });
  const nova = drawNova({ x: 1340, y: 1390, s: 1.08, turn: -0.55, armL: 50, armR: 6, headRot: -5, dimFar: false, face: { name: 'smug', mouth: 'smirk', eyes: { upper: 0.2, tilt: -4, look: [-0.8, -0.3] }, fx: ['blush'] } });
  o += rim(hero) + rim(nova);
  // NOOB / PRO tags
  const tag = (x, y, txt, fill, rot) => S.g(S.rect(-150, -62, 300, 124, 30, { fill, stroke: INK, 'stroke-width': 9 }) + S.el('text', { x: 0, y: 30, 'font-family': 'Lilita One', 'font-size': 92, fill: '#FFFFFF', stroke: INK, 'stroke-width': 10, 'paint-order': 'stroke', 'text-anchor': 'middle' }, txt), `translate(${x} ${y}) rotate(${rot})`);
  o += tag(250, 420, 'NOOB', '#8A93A6', -8) + tag(1690, 420, 'PRO', '#FFB31A', 8);
  o += sparkles([[1250, 160, 30], [700, 160, 24], [1560, 330, 26, '#FFE14D']]);
  o += S.rect(0, 0, W, H, 0, { fill: 'url(#vigT)' });
  o += bigText([{ t: 'SHE SAID YES?!', size: 200, fill: 'url(#tP)' }], 960, 210, { rot: -2 });
  return o;
}

// ---------------------------------------------------------------- 4: 1 SECOND LEFT!
function thumb4() {
  let o = DEFS + E.DEFS;
  const VL = E.vaultHangLayers({ zoom: 1 }, 2.0, 700);
  o += VL.bg;
  o += S.rect(0, 0, W, H, 0, { fill: '#2A0B4A', opacity: 0.25 });
  o += rays(960, 640, 28, 1700, '#C77DFF', 0.12, 3);
  // lasers criss-crossing
  o += E.beam(0, 120, 1920, 980, 1) + E.beam(0, 1000, 1920, 200, 1) + E.beam(0, 520, 1920, 380, 0.9) + E.beam(300, 0, 760, 1080, 0.8) + E.beam(1700, 0, 1240, 1080, 0.8);
  // hatch pad glow
  o += S.ellipse(960, 1000, 620, 120, { fill: '#7B2FFF', opacity: 0.5 }) + S.ellipse(960, 1000, 520, 96, { fill: 'none', stroke: '#E0B3FF', 'stroke-width': 12 });
  o += S.ellipse(960, 640, 520, 520, { fill: 'url(#haloPurple)' });
  // EggLord, angry, far back
  // YOU and Nova both lunging for the egg in the middle
  const hero = drawHero({ x: 540, y: 1330, s: 1.02, turn: 0.35, armR: 104, armL: 30, lean: 8, headRot: 6, dimFar: false,
    face: { name: 'scream', eyes: { pupil: 0.5, look: [0.8, -0.3], cross: 0 }, fx: ['sweat', 'sweat2'] } });
  const nova = drawNova({ x: 1380, y: 1330, s: 1.02, turn: -0.35, armL: 104, armR: 30, lean: -8, headRot: -6, dimFar: false,
    face: { name: 'determined', eyes: { look: [-0.8, -0.3] } } });
  o += rim(hero) + rim(nova);
  o += rim(S.g(secretEgg({ x: 0, y: 0, size: 330, t: 2.2, rot: -8 }), 'translate(960 640)'));
  o += pixels(960, 640, 30, 280, 7, ['#B66BFF', '#FFFFFF', '#7CF7FF', '#FF4D8D']);
  // timer
  o += S.g(S.rect(-250, -100, 500, 200, 40, { fill: '#1A0F2E', stroke: '#FF3B5C', 'stroke-width': 12 }) + S.el('text', { x: 0, y: 58, 'font-family': 'Lilita One', 'font-size': 160, fill: '#FF3B5C', 'text-anchor': 'middle', stroke: '#2A0010', 'stroke-width': 8, 'paint-order': 'stroke' }, '00:01'), 'translate(1600 170) rotate(6)');
  o += sparkles([[700, 420, 30], [1230, 420, 30], [960, 360, 40, '#FFE14D']]);
  o += S.rect(0, 0, W, H, 0, { fill: 'url(#vigT)' });
  o += bigText([{ t: '1 SECOND', size: 190, fill: 'url(#tW)' }, { t: 'LEFT!!', size: 230, fill: 'url(#tR)', dx: 20 }], 600, 180, { rot: -5 });
  return o;
}

const ALL = { 1: thumb1, 2: thumb2, 3: thumb3, 4: thumb4 };

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const which = process.argv[2] && process.argv[2] !== 'all' ? process.argv[2].split(',') : Object.keys(ALL);
  const r = await openRenderer(W, H);
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
