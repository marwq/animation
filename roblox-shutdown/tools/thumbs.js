// YouTube thumbnails (4 variants) for "What If Roblox Shut Down FOREVER?", built from the video's rig, sets and the Lag.
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
const FARM = require('../scenes/farm');
const LAG = require('../rig/lag');
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
const popupBig = (x, y, s, k = 1) => S.g(K.popup(0, 0, 900, 330, 'SYSTEM', ['Roblox will shut down', 'FOREVER in 24 hours.', 'Thanks for playing! :)'], k, { size: 44 }), `translate(${f(x)} ${f(y)}) scale(${f(s)})`);

// ---------------------------------------------------------------- 1: 24 HOURS LEFT?!
function thumb1() {
  let o = DEFS + SETS.DEFS + FARM.DEFS;
  o += SETS.earth(2.0, { night: 0.35 });
  o += S.rect(0, 0, W, H, 0, { fill: '#2A0B3A', opacity: 0.35 });
  o += K.rays(1350, 620, 24, 1700, '#FF5A6E', 0.10, 3);
  o += S.ellipse(1350, 640, 760, 560, { fill: 'url(#haloRed)', opacity: 0.6 });
  o += rim(popupBig(1340, 820, 0.88));
  o += S.g(K.timerHUD(86399, { t: 0.4, glitch: 0.35 }), 'translate(1340 500) scale(2.0) translate(-960 -64)');
  for (const [x, y, r] of [[1700, 230, 46], [1080, 960, 40], [1840, 980, 34]]) o += K.loadingWheel(x, y, r, 0.7, '#E8ECF2', 10);
  const juno = draw.juno({ x: 520, y: 1630, s: 1.32, armR: 158, armL: 152, headRot: -4, lean: -2, shade: true, shadow: false,
    face: { name: 'scream', eyes: { pupil: 0.45, look: [0.6, -0.4] }, fx: ['sweat', 'sweat2'] } });
  o += rim(juno);
  o += sparkles([[1000, 240, 30], [1780, 560, 26], [240, 380, 24]]);
  o += S.rect(0, 0, W, H, 0, { fill: 'url(#vigT)' });
  o += bigText([{ t: '24 HOURS', size: 170, fill: 'url(#tW)' }, { t: 'LEFT?!', size: 230, fill: 'url(#tR)', dx: 40 }], 1330, 175, { rot: -3, gap: 1.12 });
  return o;
}

// ---------------------------------------------------------------- 2: THE LAG IS REAL?!
function thumb2() {
  let o = DEFS + SETS.DEFS + FARM.DEFS;
  o += '' + FARM.core(3.1, CAM, { alarm: 1, timer: '00:01:00', screens: true, dots: 1, spam: true, frontRail: false });
  o += S.rect(0, 0, W, H, 0, { fill: '#1A0510', opacity: 0.35 });
  o += rim(LAG.lag({ x: 1250, y: 470, size: 2.05, t: 1.3, mouth: 'O', mood: 'hungry', glitch: 0.25 }));
  const juno = draw.juno({ x: 210, y: 1250, s: 0.82, view: 'side', flip: false, lean: 10, legL: 40, kneeL: 30, legR: -30, kneeR: 50, armL: 60, armR: -40, shade: true, shadow: false,
    face: { name: 'scream', eyes: { look: [0.9, -0.3] } } });
  const dex = draw.dex({ x: 650, y: 1290, s: 0.86, armR: 165, armL: 160, headRot: 6, shade: true, shadow: false,
    face: { name: 'scream', eyes: { pupil: 0.4, look: [0.8, -0.6] }, fx: ['sweat', 'sweat2'] } });
  o += rim(dex) + rim(juno);
  o += S.rect(0, 0, W, H, 0, { fill: 'url(#vigT)' });
  o += bigText([{ t: 'THE LAG', size: 190, fill: 'url(#tW)' }, { t: 'IS REAL?!', size: 170, fill: 'url(#tR)', dx: 20 }], 470, 180, { rot: -4, gap: 1.1 });
  return o;
}

// ---------------------------------------------------------------- 3: GRANDPA KNEW?!
function thumb3() {
  let o = DEFS + SETS.DEFS + FARM.DEFS;
  o += '' + FARM.farmExterior(2.4, { storm: 0.9, sunset: 0.45 });
  o += S.rect(0, 0, W, H, 0, { fill: '#10102A', opacity: 0.3 });
  o += S.ellipse(1240, 520, 620, 560, { fill: 'url(#haloGold)', opacity: 0.85 });
  o += K.rays(1240, 430, 22, 1500, '#FFE36B', 0.14, 5);
  const A = require('../scenes/acting');
  const [hx, hy] = A.hand(150, 1);
  const key = S.g(S.circle(0, 0, 46, ol('#FFD21F', 9)) + S.circle(0, 0, 18, { fill: '#2A1B0A' }) + S.rect(-11, 40, 22, 170, 8, ol('#FFD21F', 8)) + S.rect(8, 150, 48, 20, 6, ol('#FFD21F', 7)) + S.rect(8, 186, 36, 18, 6, ol('#FFD21F', 7)), 'rotate(-12)');
  const gpa = draw.grandpa({ x: 1250, y: 1560, s: 1.3, armR: 150, armL: 30, headRot: -5, goldKey: false, shade: true, shadow: false,
    face: { name: 'sneaky', mouth: 'smirk', eyes: { look: [-0.4, -0.2] } },
    props: [{ svg: S.g(key, `translate(${f(hx + 10)} ${f(hy - 150)}) scale(1.5)`), layer: 'top' }] });
  o += rim(gpa);
  o += sparkles([[1500, 170, 44, '#FFE14D'], [980, 260, 30, '#FFE14D'], [1640, 420, 26]]);
  const juno = draw.juno({ x: 380, y: 1330, s: 0.92, turn: 0.4, armR: 70, armL: 20, headRot: 8, shade: true, shadow: false,
    face: { name: 'shocked', mouth: 'O', eyes: { pupil: 0.45, look: [0.9, -0.3] }, fx: ['sweat'] } });
  o += rim(juno);
  o += S.rect(0, 0, W, H, 0, { fill: 'url(#vigT)' });
  o += bigText([{ t: 'GRANDPA', size: 170, fill: 'url(#tW)' }, { t: 'KNEW?!', size: 220, fill: 'url(#tY)', dx: 30 }], 520, 170, { rot: -4, gap: 1.12 });
  return o;
}

// ---------------------------------------------------------------- 4: 0 PLAYERS?!
function thumb4() {
  let o = DEFS + SETS.DEFS + FARM.DEFS;
  o += '' + FARM.farmExterior(5.0, { storm: 0, sunset: 1, grass: 1 });
  o += S.rect(0, 0, W, H, 0, { fill: '#3A1030', opacity: 0.18 });
  o += rim(S.g(FARM.worldMap(0, 0, 800, 450, 1, { dots: 0, online: 0, off: 0 }), 'translate(130 320) rotate(-6) scale(0.95)'));
  o += S.g(S.rect(-250, -78, 500, 156, 40, ol('#10131C', 8)) + TF('PLAYERS ONLINE', 0, -26, 34, '#9AA6C0') + T('0', 0, 62, 110, '#46F58C'), 'translate(520 940) rotate(-6)');
  o += K.rays(1400, 520, 20, 1400, '#FFE88A', 0.12, 2);
  o += S.ellipse(1400, 560, 520, 480, { fill: 'url(#haloGold)', opacity: 0.6 });
  o += S.g(K.badge(0, 0, 'TOUCH GRASS', 'BADGE EARNED!', 1, 0.3), 'translate(1400 300) scale(1.05)');
  const dex = draw.dex({ x: 1420, y: 1500, s: 1.0, armR: 150, armL: 40, headRot: -6, shade: true, shadow: false,
    face: { name: 'excited', eyes: { type: 'star' }, mouth: 'bigGrin', fx: ['sparkles'] } });
  o += rim(dex);
  for (let i = 0; i < 26; i++) { const x = 960 + i * 38, h = 40 + (i * 37) % 50; o += S.path(`M${x} 1080 L${x + 12} ${1080 - h} L${x + 22} 1080 Z`, { fill: i % 2 ? '#3FBF4F' : '#2E9E3E', stroke: '#151515', 'stroke-width': 4 }); }
  o += S.rect(0, 0, W, H, 0, { fill: 'url(#vigT)' });
  o += bigText([{ t: '0 PLAYERS', size: 160, fill: 'url(#tG)' }, { t: 'ONLINE?!', size: 190, fill: 'url(#tW)', dx: 30 }], 520, 165, { rot: -4, gap: 1.12 });
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
