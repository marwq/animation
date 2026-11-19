// YouTube thumbnails (4 variants) for "What If You Had ADMIN COMMANDS in Real Life?", built from the video's rig, sets and cats.
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
const SETS = require('../scenes/sets');
const CITY = require('../scenes/city');
const CATS = require('../rig/cats');
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
const T = (s, x, y, size, fill, extra = {}) => K.T(s, x, y, size, fill, extra);
const TF = (s, x, y, size, fill, extra = {}) => K.TF(s, x, y, size, fill, extra);
const sparkles = (pts) => pts.map(([x, y, r, c]) => F.sparkle(x, y, r, c || '#FFFFFF')).join('');
const coins = (list) => list.map(([x, y, r, rot, spin]) => K.coin(x, y, r, rot || 0, spin || 0)).join('');


const CAM = { zoom: 1, x: 0, y: 0 };
const cmdBar = (x, y, text, s = 1.6, theme = 'dark', user = 'you') => K.chatCommand(x, y, text, 1, { s, theme, user, cursor: false });

// ---------------------------------------------------------------- 1: ;fly DAD
function thumb1() {
  let o = DEFS + SETS.DEFS + CITY.DEFS + CATS.DEFS;
  o += '' + CITY.city(2.0, { zoom: 1.15, x: 120, y: -60 }, { time: 0.5, flying: 0.6, flyNear: false, popups: 0.4 });
  o += S.rect(0, 0, W, H, 0, { fill: '#2A0B3A', opacity: 0.18 });
  o += K.rays(1340, 360, 22, 1600, '#FFE88A', 0.12, 4);
  o += S.ellipse(1340, 380, 520, 420, { fill: 'url(#haloGold)', opacity: 0.7 });
  const dad = draw.dad({ x: 1360, y: 820, s: 0.62, armR: 170, armL: 150, rot: -18, rotY: -500, lean: 6, shade: true, shadow: false,
    face: { name: 'scream', eyes: { pupil: 0.45, look: [0.3, 0.6] }, fx: ['sweat', 'sweat2'] } });
  o += rim(dad);
  o += S.g(SETS.laptop(0, 0, 0.55, null, { glow: 0 }), 'translate(1560 540) rotate(14)');
  const you = draw.you({ x: 470, y: 1760, s: 1.35, armR: 120, armL: 40, headRot: -4, shade: true, shadow: false,
    face: { name: 'excited', eyes: { pupil: 0.5, look: [0.7, -0.6] }, mouth: 'bigGrin', fx: ['sparkles'] } });
  o += rim(you);
  o += rim(cmdBar(1060, 985, ';fly DAD', 2.1));
  o += sparkles([[1100, 220, 30], [1720, 300, 26], [980, 640, 22]]);
  o += S.rect(0, 0, W, H, 0, { fill: 'url(#vigT)' });
  o += bigText([{ t: 'ADMIN', size: 170, fill: 'url(#tY)' }, { t: 'IN REAL LIFE?!', size: 115, fill: 'url(#tW)', dx: 20 }], 540, 165, { rot: -4, gap: 1.0 });
  return o;
}

// ---------------------------------------------------------------- 2: GIANT CATS?!
function thumb2() {
  let o = DEFS + SETS.DEFS + CITY.DEFS + CATS.DEFS;
  o += '' + CITY.city(3.0, { zoom: 1, x: 0, y: -40 }, { time: 1, flying: 0.4, flyNear: false, popups: 0.7, street: false });
  o += S.rect(0, 0, W, H, 0, { fill: '#10061E', opacity: 0.2 });
  o += rim(CATS.pancake({ x: 1250, y: 1180, s: 5.2, t: 1, pose: 'sit', mood: 'happy' }));
  o += rim(CATS.cat({ x: 330, y: 1120, s: 2.4, t: 1, pose: 'sit', mood: 'smug', coat: 'calico', seed: 2 }));
  const you = draw.you({ x: 720, y: 1180, s: 0.6, armR: 160, armL: 150, headRot: 6, shade: true, shadow: false,
    face: { name: 'scared', mouth: 'scream', eyes: { pupil: 0.4, look: [0.8, -0.7] }, fx: ['sweat', 'sweat2'] } });
  o += rim(you);
  o += rim(cmdBar(700, 490, ';size all cats 100', 1.5));
  o += S.g(S.rect(-200, -70, 400, 140, 26, ol('#2A0C12', 8)) + K.T('TYPO!', 0, 26, 92, '#FF3B4E'), 'translate(1080 360) rotate(-8) scale(0.85)');
  o += sparkles([[1600, 260, 30], [200, 560, 24]]);
  o += S.rect(0, 0, W, H, 0, { fill: 'url(#vigT)' });
  o += bigText([{ t: 'GIANT', size: 180, fill: 'url(#tY)' }, { t: 'CATS?!', size: 210, fill: 'url(#tW)', dx: 30 }], 500, 175, { rot: -4, gap: 1.05 });
  return o;
}

// ---------------------------------------------------------------- 3: THE REAL ADMIN
function thumb3() {
  let o = DEFS + SETS.DEFS + CITY.DEFS + CATS.DEFS;
  o += '' + CITY.city(4.0, { zoom: 1.1, x: 0, y: -80 }, { time: 1, crack: 0.55, admin: 0.2, flying: 0.3, flyNear: false, street: false });
  o += S.rect(0, 0, W, H, 0, { fill: '#0A0620', opacity: 0.25 });
  o += S.ellipse(1250, 520, 620, 560, { fill: 'url(#halo)', opacity: 0.7 });
  o += K.rays(1250, 420, 24, 1700, '#FFF4C4', 0.14, 2);
  const admin = draw.admin({ x: 1260, y: 1640, s: 1.02, t: 2, glow: 0.8, armR: 70, armL: 20, shade: true, shadow: false, face: { name: 'angry' } });
  o += admin;
  o += rim(K.chatCommand(1280, 820, ';kick you', 1, { s: 1.6, theme: 'admin', user: 'ADMIN', cursor: false }));
  const you = draw.you({ x: 400, y: 1640, s: 1.2, armR: 30, armL: 20, headRot: 8, shade: true, shadow: false,
    face: { name: 'shocked', mouth: 'O', eyes: { pupil: 0.4, look: [0.9, -0.5] }, fx: ['sweat', 'sweat2'] } });
  o += rim(you);
  o += sparkles([[1600, 200, 36, '#FFE14D'], [860, 260, 26, '#FFE14D']]);
  o += S.rect(0, 0, W, H, 0, { fill: 'url(#vigT)' });
  o += bigText([{ t: 'THE REAL', size: 150, fill: 'url(#tW)' }, { t: 'ADMIN?!', size: 200, fill: 'url(#tY)', dx: 10 }], 470, 170, { rot: -4, gap: 1.08 });
  return o;
}

// ---------------------------------------------------------------- 4: ;jail BRICK
function thumb4() {
  let o = DEFS + SETS.DEFS + CITY.DEFS + CATS.DEFS;
  o += SETS.cafeteria(1, {});
  o += S.rect(0, 0, W, H, 0, { fill: '#10203A', opacity: 0.2 });
  o += K.rays(1260, 600, 22, 1600, '#7CFFB0', 0.12, 3);
  o += S.ellipse(1260, 620, 560, 520, { fill: 'url(#haloGreen)', opacity: 0.6 });
  o += SETS.cage(1260, 1080, 1.62, 1, { part: 'back', drop: 1 });
  o += draw.brick({ x: 1260, y: 1080, s: 0.57, armR: 150, armL: 150, headRot: -5, shade: true, shadow: false,
    face: { name: 'shocked', mouth: 'scream', eyes: { pupil: 0.5 }, fx: ['sweat', 'sweat2', 'anger'] } });
  o += SETS.cage(1260, 1080, 1.62, 1, { part: 'front', drop: 1 });
  const you = draw.you({ x: 430, y: 1720, s: 1.25, armR: 100, armL: 40, headRot: -6, shade: true, shadow: false,
    face: { name: 'smug', mouth: 'grin', eyes: { look: [0.8, -0.2] }, fx: ['sparkles'] } });
  o += rim(you);
  o += rim(cmdBar(1000, 990, ';jail BRICK', 2.0));
  o += S.rect(0, 0, W, H, 0, { fill: 'url(#vigT)' });
  o += bigText([{ t: 'JAILED', size: 170, fill: 'url(#tG)' }, { t: 'MY BULLY!', size: 130, fill: 'url(#tW)', dx: 20 }], 500, 160, { rot: -4, gap: 1.02 });
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
