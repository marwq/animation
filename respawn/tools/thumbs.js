// YouTube thumbnails (4 variants) for "What If You Could RESPAWN in Real Life?", built from the video's rig, sets and FX.
// Usage: node tools/thumbs.js [all|1|2|3|4]   -> thumbs/thumb_N.png (1920x1080) + thumb_N.jpg (1280x720)
'use strict';

const path = require('path');
const fs = require('fs');
const { execFileSync } = require('child_process');
const S = require('../rig/svg');
const F = require('../rig/face');
const ST = require('../rig/style');
const K = require('../scenes/kit');
const R = require('../scenes/respawn');
const SH = require('../scenes/sets_home');
const SS = require('../scenes/sets_school');
const X = require('../rig/extras');
const { draw } = require('../rig/cast');
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
<linearGradient id="tR" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFD0D0"/><stop offset="0.45" stop-color="#FF4D5E"/><stop offset="1" stop-color="#C8102E"/></linearGradient>
<linearGradient id="gloss" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFFFFF" stop-opacity="0.85"/><stop offset="0.45" stop-color="#FFFFFF" stop-opacity="0"/></linearGradient>
<radialGradient id="haloGreen" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#E9FFD0" stop-opacity="0.95"/><stop offset="0.35" stop-color="#7BEA4F" stop-opacity="0.55"/><stop offset="1" stop-color="#1E9A48" stop-opacity="0"/></radialGradient>
<radialGradient id="haloWhite" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#FFFFFF" stop-opacity="0.95"/><stop offset="0.4" stop-color="#FFF6C8" stop-opacity="0.55"/><stop offset="1" stop-color="#FFF6C8" stop-opacity="0"/></radialGradient>
<radialGradient id="haloRed" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#FFE0E0" stop-opacity="0.95"/><stop offset="0.35" stop-color="#FF6B6B" stop-opacity="0.55"/><stop offset="1" stop-color="#FF2E4D" stop-opacity="0"/></radialGradient>
<radialGradient id="vigT" cx="0.5" cy="0.45" r="0.75"><stop offset="0.55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#0A0620" stop-opacity="0.55"/></radialGradient>
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
const SETDEFS = () => (SH.DEFS || '') + (SS.DEFS || '') + (R.DEFS || '') + (X.DEFS || '');

// ---------------------------------------------------------------- 1: RESPAWN IN REAL LIFE — the hero breaking into blocks next to his checkpoint
function thumb1() {
  let o = DEFS + SETDEFS();
  o += SH.street(1, { x: -900, y: -120, zoom: 1.0 }, { time: 'day' });
  o += S.rect(0, 0, W, H, 0, { fill: '#0A1A3A', opacity: 0.18 });
  o += K.rays(560, 760, 22, 1700, '#B8FF9A', 0.14, 3);
  o += S.ellipse(560, 780, 620, 560, { fill: 'url(#haloGreen)', opacity: 0.75 });
  // the checkpoint (left) with a ghostly "new" hero popping on it
  o += R.checkpoint({ x: 560, y: 1010, s: 0.62, t: 1.2, state: 'saved', save: 1, part: 'back' });
  o += R.respawnPop({ x: 560, y: 1010, s: 0.62, age: 0.12, part: 'back' });
  o += S.g(draw.you({ x: 560, y: 1010, s: 0.62, armL: 150, armR: 150, shade: true, shadow: false, face: { name: 'excited', mouth: 'bigGrin', eyes: { type: 'star' } } }), null, { opacity: 0.92 });
  o += R.forcefield({ x: 560, y: 1010, s: 0.62, t: 1.3, k: 1 });
  o += R.checkpoint({ x: 560, y: 1010, s: 0.62, t: 1.2, state: 'saved', save: 1, part: 'front' });
  o += R.respawnPop({ x: 560, y: 1010, s: 0.62, age: 0.12, part: 'front' });
  // the hero (right, big) shattering into blocks from the feet up
  const you = draw.you({ x: 1400, y: 1560, s: 1.32, armR: 120, armL: 60, headRot: 8, lean: -6, shade: true, shadow: false,
    face: { name: 'shocked', mouth: 'O', eyes: { pupil: 0.4 }, fx: ['sweat', 'sweat2'] } });
  // the body dissolves below a jagged edge: clip the hero; cubes peel off the cut and fall away (never over the face)
  let jag = 'M0 0 H1920 V900';
  for (let i = 0; i <= 12; i++) jag += ` L${1920 - i * 160} ${900 + (i % 2 ? 50 : -15) + (i % 3) * 22}`;
  jag += ' L0 900 Z';
  o += '<clipPath id="t1cut"><path d="' + jag + '"/></clipPath>';
  o += S.g(rim(you), null, { 'clip-path': 'url(#t1cut)' });
  const cols = ['#D8262E', '#B01D24', '#F2D04A', '#D9B73A', '#D8262E', '#FFFFFF', '#1F3B2A', '#D8262E', '#F2D04A'];
  const cube = (x, y, r, rot, c) => {
    const d = (dx, dy) => `${f(x + dx)} ${f(y + dy)}`;
    let g = S.path(`M${d(-r, -r)} L${d(r, -r)} L${d(r, r)} L${d(-r, r)} Z`, { fill: c, stroke: INK, 'stroke-width': 6, 'stroke-linejoin': 'round' });
    g += S.path(`M${d(-r, -r)} L${d(-r * 0.6, -r * 1.35)} L${d(r * 1.4, -r * 1.35)} L${d(r, -r)} Z`, { fill: '#FFFFFF', opacity: 0.35, stroke: INK, 'stroke-width': 5, 'stroke-linejoin': 'round' });
    return S.g(g, `rotate(${f(rot)} ${f(x)} ${f(y)})`);
  };
  for (let i = 0; i < 26; i++) {
    const u = i / 26;
    const x = 1060 + ((i * 263) % 760) + Math.sin(i * 7) * 40;
    const y = 930 + ((i * 97) % 150) - (i % 4) * 30 + (x < 1200 || x > 1650 ? -120 * ((i % 3) / 2) : 0);
    o += cube(x, y, 22 + (i % 5) * 9, (i * 37) % 90, cols[i % cols.length]);
  }
  for (const [x, y, r, rot, c] of [[1010, 760, 30, 20, '#D8262E'], [1790, 700, 26, -15, '#F2D04A'], [1860, 860, 34, 40, '#D8262E'], [960, 900, 22, 10, '#FFFFFF']]) o += cube(x, y, r, rot, c);
  o += R.counterHUD({ x: 1890, y: 70, s: 1.5, label: 'ATTEMPT', value: 9999, theme: 'red', anchor: 'right' });
  o += S.rect(0, 0, W, H, 0, { fill: 'url(#vigT)' });
  o += bigText([{ t: 'RESPAWN', size: 190, fill: 'url(#tG)' }, { t: 'IN REAL LIFE?!', size: 118, fill: 'url(#tW)', dx: 8 }], 640, 190, { rot: -4, gap: 1.0 });
  o += sparkles([[1040, 140, 36, '#E9FFD0'], [120, 460, 26, '#FFFFFF']]);
  return o;
}

// ---------------------------------------------------------------- 2: 9,999 FAILS — the corrupted town full of ghost copies
function thumb2() {
  let o = DEFS + SETDEFS();
  o += SH.town(1, { x: 0, y: 0, zoom: 1 }, { red: 1, time: 'sunset' });
  // ghost crowd: many lites behind, a few full ghosts in front
  const poses = [];
  for (let i = 0; i < 70; i++) {
    const row = i % 3;
    const x = ((i * 137.7) % 2100) - 90, y = 640 + row * 70 + (i % 5) * 6;
    poses.push({ x, y, s: 0.11 + row * 0.03, rot: ((i * 53) % 40) - 20, armL: (i * 31) % 160, armR: (i * 47) % 170, view: i % 4 === 0 ? 'side' : 'front', flip: i % 2 === 0 });
  }
  o += draw.ghostCrowd(poses, { alpha: 0.7 });
  o += S.ellipse(960, 760, 900, 520, { fill: 'url(#haloRed)', opacity: 0.55 });
  const g = (x, y, s, pose) => draw.ghost({ x, y, s, shade: true, shadow: false, alpha: 0.62, ...pose });
  o += g(330, 1080, 0.5, { rot: -24, armL: 170, armR: 120, face: { name: 'scream', mouth: 'scream' } });
  o += g(1620, 1060, 0.48, { rot: 18, armL: 90, armR: 175, face: { name: 'dizzy' } });
  o += g(560, 980, 0.34, { view: 'side', rot: 35, face: { name: 'oof' } });
  o += g(1400, 950, 0.32, { rot: -30, armL: 150, armR: 150, face: { name: 'shocked', mouth: 'O' } });
  // the hero, centre, hands on cheeks
  const you = draw.you({ x: 960, y: 1640, s: 1.28, armR: 160, armL: 160, headRot: -4, shade: true, shadow: false,
    face: { name: 'shocked', mouth: 'O', eyes: { pupil: 0.35 }, fx: ['sweat', 'sweat2'] } });
  o += rim(you);
  o += R.sysWindow({ x: 1180, y: 175, w: 1300, h: 310, k: 1, theme: 'red', title: 'WARNING', lines: ['SAVE FILE CORRUPTED'], t: 1.1, icon: 'warn' });
  o += S.rect(0, 0, W, H, 0, { fill: 'url(#vigT)' });
  o += bigText([{ t: '9,999', size: 190, fill: 'url(#tR)' }, { t: 'FAILS!', size: 150, fill: 'url(#tW)' }], 330, 470, { rot: -6, gap: 0.98 });
  return o;
}

// ---------------------------------------------------------------- 3: NO RESPAWN — the talent show, buried in foam, the menu won't open
function thumb3() {
  let o = DEFS + SETDEFS();
  o += SS.auditorium(2.4, { view: 'stage', lights: 0, spots: [{ x: 960, y: 0, w: 640 }] });
  o += R.foamFountain({ x: 1640, y: 900, s: 1.1, t: 2, age: 1.6, dir: -1, h: 760, floorY: 920 });
  o += R.foamPile(1550, 1090, 1000, 300, { t: 1, seed: 3 });
  o += draw.principal({ x: 1620, y: 1130, s: 0.56, foam: 1, armL: 35, armR: 35, shade: true, shadow: false, face: { name: 'deadpan', mouth: 'line' } });
  o += R.foamPile(1600, 1110, 700, 170, { t: 1, seed: 8 });
  const you = draw.you({ x: 860, y: 1640, s: 1.25, foam: 0, armR: 125, armL: 125, headRot: 4, shade: true, shadow: false,
    face: { name: 'scream', mouth: 'O', eyes: { pupil: 0.35 }, fx: ['sweat', 'sweat2'] } });
  o += rim(you);
  o += R.foamBlobs(700, 440, 1.3, 1, 5, { t: 0.2 });
  o += R.escMenu({ x: 330, y: 760, s: 0.62, k: 1, t: 1.7, broken: 0.75 });
  o += R.counterHUD({ x: 40, y: 70, s: 1.5, label: 'LIVES', value: 1, theme: 'red', anchor: 'left' });
  o += S.rect(0, 0, W, H, 0, { fill: 'url(#vigT)' });
  o += bigText([{ t: 'NO MORE', size: 130, fill: 'url(#tW)' }, { t: 'RESPAWNS!', size: 165, fill: 'url(#tR)' }], 1440, 190, { rot: 4, gap: 1.0 });
  return o;
}

// ---------------------------------------------------------------- 4: RESET CHARACTER — the pause menu in real life (spaghetti on the principal)
function thumb4() {
  let o = DEFS + SETDEFS();
  o += SS.cafeteria(1, {});
  o += S.rect(0, 0, W, H, 0, { fill: '#10203A', opacity: 0.25 });
  o += S.ellipse(470, 560, 640, 560, { fill: 'url(#haloWhite)', opacity: 0.55 });
  o += draw.principal({ x: 1660, y: 1160, s: 0.66, spaghetti: 1, armL: 60, armR: 110, shade: true, shadow: false,
    face: { name: 'angry', mouth: 'teeth', fx: ['anger', 'redface'] } });
  o += X.lunchTray({ x: 1420, y: 1010, s: 0.9, rot: 35, spaghetti: true });
  o += R.escMenu({ x: 470, y: 560, s: 1.15, k: 1, t: 1.3, hl: 'reset', press: 0.25 });
  const you = draw.you({ x: 1080, y: 1610, s: 1.18, armR: 30, armL: 150, headRot: -6, turn: -0.25, shade: true, shadow: false,
    face: { name: 'smug', mouth: 'grin', eyes: { look: [-0.9, -0.3] }, fx: ['sparkles'] } });
  o += rim(you);
  o += R.tip({ x: 760, y: 170, s: 1.2, t: 1.2, mood: 'worried', look: [0.5, 0.6] });
  o += S.rect(0, 0, W, H, 0, { fill: 'url(#vigT)' });
  o += bigText([{ t: 'RESET', size: 170, fill: 'url(#tY)' }, { t: 'MY LIFE?!', size: 125, fill: 'url(#tW)' }], 1500, 170, { rot: 5, gap: 1.0 });
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
