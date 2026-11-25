// YouTube thumbnails (4 variants) for "What If You Could See Everyone's STATS in Real Life?", built from the video's rig, sets and HUD.
// Usage: node tools/thumbs.js [all|1|2|3|4]   -> thumbs/thumb_N.png (1920x1080) + thumb_N.jpg (1280x720)
'use strict';

const path = require('path');
const fs = require('fs');
const { execFileSync } = require('child_process');
const S = require('../rig/svg');
const F = require('../rig/face');
const STY = require('../rig/style');
const H = require('../scenes/hud');
const ST = require('../scenes/sets_town');
const FS = require('../scenes/sets_fair');
const X = require('../rig/extras');
const C = require('../rig/cast');
const { openRenderer } = require('./render');

const { draw } = C;
const OUT = path.join(__dirname, '..', 'thumbs');
const W = 1920, H_ = 1080;
const { f } = S;
const INK = '#141833';

// every static <defs> the kits need (same list as scenes/main.js, without loading the scene modules)
const optDefs = (m) => { try { return require(m).DEFS || ''; } catch (e) { if (e.code === 'MODULE_NOT_FOUND') return ''; throw e; } };
const STATIC_DEFS = STY.DEFS + STY.FRAME_DEFS + optDefs('../scenes/env') +
  ['../scenes/sets_home', '../scenes/sets_town', '../scenes/sets_fair', '../scenes/hud', '../scenes/respawn', '../scenes/gameui', '../rig/extras'].map(optDefs).join('');

// ---------------------------------------------------------------- thumbnail defs
const DEFS = `<defs>
<linearGradient id="tW" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFFFFF"/><stop offset="0.55" stop-color="#F2F6FF"/><stop offset="1" stop-color="#C9D8FF"/></linearGradient>
<linearGradient id="tY" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFF7A1"/><stop offset="0.45" stop-color="#FFD21F"/><stop offset="1" stop-color="#FF9A12"/></linearGradient>
<linearGradient id="tC" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#E6FFFF"/><stop offset="0.45" stop-color="#4FF0FF"/><stop offset="1" stop-color="#119BFF"/></linearGradient>
<linearGradient id="tG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#E4FFB0"/><stop offset="0.45" stop-color="#7BEA4F"/><stop offset="1" stop-color="#22B34A"/></linearGradient>
<linearGradient id="tR" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFD0D0"/><stop offset="0.45" stop-color="#FF4D5E"/><stop offset="1" stop-color="#C8102E"/></linearGradient>
<linearGradient id="gloss" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFFFFF" stop-opacity="0.85"/><stop offset="0.45" stop-color="#FFFFFF" stop-opacity="0"/></linearGradient>
<radialGradient id="haloCyan" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#DFFFFF" stop-opacity="0.9"/><stop offset="0.35" stop-color="#3BE8FF" stop-opacity="0.5"/><stop offset="1" stop-color="#1188FF" stop-opacity="0"/></radialGradient>
<radialGradient id="haloWhite" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#FFFFFF" stop-opacity="0.95"/><stop offset="0.4" stop-color="#FFF6C8" stop-opacity="0.55"/><stop offset="1" stop-color="#FFF6C8" stop-opacity="0"/></radialGradient>
<radialGradient id="haloRed" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#FFE0E0" stop-opacity="0.95"/><stop offset="0.35" stop-color="#FF4D5E" stop-opacity="0.6"/><stop offset="1" stop-color="#C8102E" stop-opacity="0"/></radialGradient>
<radialGradient id="haloWarm" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#FFF4D6" stop-opacity="0.9"/><stop offset="0.4" stop-color="#FFC46B" stop-opacity="0.45"/><stop offset="1" stop-color="#FF9A3C" stop-opacity="0"/></radialGradient>
<radialGradient id="haloGreen" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#F2FFD8" stop-opacity="0.95"/><stop offset="0.35" stop-color="#9BFF5A" stop-opacity="0.6"/><stop offset="1" stop-color="#2BD14A" stop-opacity="0"/></radialGradient>
<radialGradient id="haloBoss" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#FF4D5E" stop-opacity="0.75"/><stop offset="0.5" stop-color="#E0102E" stop-opacity="0.4"/><stop offset="1" stop-color="#8A0018" stop-opacity="0"/></radialGradient>
<radialGradient id="haloBoss2" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#FF2A48" stop-opacity="0.8"/><stop offset="0.45" stop-color="#C4001F" stop-opacity="0.45"/><stop offset="1" stop-color="#5A0012" stop-opacity="0"/></radialGradient>
<filter id="bgBlur" filterUnits="userSpaceOnUse" x="-40" y="-40" width="${W + 80}" height="${H_ + 80}"><feGaussianBlur stdDeviation="2.6"/></filter>
<filter id="bgBlur2" filterUnits="userSpaceOnUse" x="-40" y="-40" width="${W + 80}" height="${H_ + 80}"><feGaussianBlur stdDeviation="4.5"/></filter>
<linearGradient id="beam" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFF1C8" stop-opacity="0.55"/><stop offset="0.6" stop-color="#FFD98A" stop-opacity="0.22"/><stop offset="1" stop-color="#FFC46B" stop-opacity="0.06"/></linearGradient>
<radialGradient id="vigT" cx="0.5" cy="0.45" r="0.75"><stop offset="0.55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#0A0620" stop-opacity="0.55"/></radialGradient>
<radialGradient id="vigR" cx="0.55" cy="0.42" r="0.82"><stop offset="0.5" stop-color="#2A0008" stop-opacity="0"/><stop offset="1" stop-color="#2A0008" stop-opacity="0.6"/></radialGradient>
<filter id="rim" filterUnits="userSpaceOnUse" x="0" y="0" width="${W}" height="${H_}">
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
    const attrs = { x: 0, y: 0, 'font-family': 'Lilita One, sans-serif', 'font-size': size, 'text-anchor': L.anchor || 'middle', 'letter-spacing': L.ls ?? 2 };
    const at = `translate(${f(L.dx || 0)} ${f(yy)}) rotate(${f(L.rot || 0)})`;
    let g = '';
    g += S.el('text', { ...attrs, fill: '#05061A', stroke: '#05061A', 'stroke-width': size * 0.2, 'stroke-linejoin': 'round', opacity: 0.45, transform: `translate(0 ${f(depth + 16)})` }, L.t);
    for (let k = depth; k >= 1; k -= 1.5) g += S.el('text', { ...attrs, fill: INK, stroke: INK, 'stroke-width': size * 0.17, 'stroke-linejoin': 'round', transform: `translate(0 ${f(k)})` }, L.t);
    g += S.el('text', { ...attrs, fill: L.fill, stroke: INK, 'stroke-width': size * 0.17, 'stroke-linejoin': 'round', 'paint-order': 'stroke' }, L.t);
    g += S.el('text', { ...attrs, fill: 'none', stroke: '#FFFFFF', 'stroke-width': size * 0.025, opacity: 0.55, transform: 'translate(0 -3)' }, L.t);
    g += S.el('text', { ...attrs, fill: 'url(#gloss)', opacity: 0.55 }, L.t);
    o += S.g(g, at);
    yy += size * (L.gap ?? gap);
  }
  return S.g(o, `translate(${f(x)} ${f(y)}) rotate(${f(rot)})`);
}
const rim = (inner) => S.g(inner, null, { filter: 'url(#rim)' });
const sparkles = (pts) => pts.map(([x, y, r, c]) => F.sparkle(x, y, r, c || '#FFFFFF')).join('');
const halo = (x, y, rx, ry, id, op = 1) => S.ellipse(x, y, rx, ry, { fill: `url(#${id})`, opacity: op });
const rays = (x, y, n, r, col, op, rot = 0) => H.rays(x, y, n, r, col, op, rot);
const vig = (id = 'vigT') => S.rect(0, 0, W, H_, 0, { fill: `url(#${id})` });
const head = (who, x, y, s, pose = {}) => H.overHead(who, x, y, s, 0, pose);

// glow behind a plate hung at head top (x, y) with scale s (plate centre ≈ 110 px above the pin at s 1)
const plateGlow = (x, y, s, id = 'haloCyan', op = 0.75, w = 300) => halo(x, y - 115 * s, w * s, 130 * s, id, op);

const blur = (inner, id = 'bgBlur') => S.g(inner, null, { filter: `url(#${id})` });
// motion arcs around the quest arrow's ground ring (it is spinning)
function spinArcs(x, y, s, t) {
  let o = '';
  [[0, 1], [180, 0.8]].forEach(([a0, op]) => {
    for (let j = 0; j < 4; j++) {
      const a1 = (a0 + 18 + j * 9) * Math.PI / 180, a2 = (a0 + 78 + j * 9) * Math.PI / 180, rx = (172 + j * 5) * s, ry = (62 + j * 2) * s;
      o += S.path(`M${f(x + Math.cos(a1) * rx)} ${f(y + Math.sin(a1) * ry)}A${f(rx)} ${f(ry)} 0 0 1 ${f(x + Math.cos(a2) * rx)} ${f(y + Math.sin(a2) * ry)}`,
        { fill: 'none', stroke: j % 2 ? '#FFFFFF' : '#FFD21F', 'stroke-width': f((9 - j * 2) * s), 'stroke-linecap': 'round', opacity: f(op * (1 - j * 0.2)) });
    }
  });
  return o;
}

// ---------------------------------------------------------------- 1: I CAN SEE STATS?! — the hallway, a plate over everyone, the hero's "???"
function thumb1() {
  const t = 2.2;
  let o = DEFS;
  o += blur(ST.hallway(t, ST.SPOTS.hallway.cams.wide, { crowd: 0.7, banner: 'GO OWLS!' }), 'bgBlur');
  o += S.rect(0, 0, W, H_, 0, { fill: '#0A1A3A', opacity: 0.22 });
  o += rays(1320, 260, 22, 1700, '#BFF8FF', 0.13, 4);
  // the cast behind the hero
  const krump = { x: 1110, y: 1150, s: 0.6 }, tank = { x: 1645, y: 1175, s: 0.62 };
  const kK = head('teacher', krump.x, krump.y, krump.s), kT = head('tank', tank.x, tank.y, tank.s);
  o += plateGlow(kK.x, kK.y, 1.35, 'haloBoss', 0.9) + plateGlow(kT.x, kT.y + 30, 1.3, 'haloCyan', 0.8);
  // little plates over the students in the back line
  o += H.miniPlate({ x: 1354, y: 836 - 900 * 0.44 - 4, name: 'KYLE', level: 12, hp: 0.72, s: 1.0, t });
  o += H.miniPlate({ x: 882, y: 855 - 900 * 0.45 - 4, name: 'ZOE', level: 31, hp: 0.9, s: 0.85, t: t + 1 });
  o += draw.teacher({ ...krump, glare: true, shade: true, shadow: false, face: { name: 'angry', mouth: 'frown' } });
  o += draw.tank({ ...tank, shade: true, shadow: false, face: { name: 'neutral' } });
  o += H.plateFor('teacher', { ...kK, s: 1.35, t: 0.6 });
  o += H.plateFor('tank', { ...kT, s: 1.3, t: 0.62 });
  // the hero, huge, amazed
  const yp = { x: 470, y: 1650, s: 1.2 };
  const you = draw.you({ ...yp, armL: 150, armR: 150, headRot: -4, shade: true, shadow: false,
    face: { name: 'amazed', mouth: 'O', eyes: { look: [0.45, -0.25] }, fx: ['sparkles'] } });
  o += rim(you);
  const hh = head('you', yp.x, yp.y, yp.s);
  o += H.heroPlate({ x: hh.x + 30, y: hh.y - 4, s: 1.2, t: 0.3 });
  o += vig();
  o += bigText([{ t: 'I CAN SEE', size: 124, fill: 'url(#tW)', gap: 1.18 }, { t: 'STATS?!', size: 200, fill: 'url(#tC)' }], 460, 150, { rot: -4 });
  return o;
}

// ---------------------------------------------------------------- 2: LV 99 TEACHER?! — Mrs. Krump towers with the FINAL BOSS plate
function thumb2() {
  const t = 1.4;
  let o = DEFS;
  o += blur(ST.classroom(t, { board: [' '] }), 'bgBlur');
  o += S.rect(0, 0, W, H_, 0, { fill: '#10000E', opacity: 0.66 });
  const kr = { x: 1330, y: 1440, s: 0.84 };
  const kh = head('teacher', kr.x, kr.y, kr.s);
  o += rays(kr.x, 520, 24, 1500, '#FF2E4D', 0.13, 2);
  o += halo(kr.x, 560, 760, 700, 'haloBoss2', 1);
  o += plateGlow(kh.x, kh.y + 10, 1.5, 'haloBoss', 1);
  o += draw.teacher({ ...kr, flip: true, glare: true, pointer: true, pointerRot: 80, shade: true, shadow: false, face: { name: 'angry', mouth: 'frown' } });
  o += H.plateFor('teacher', { ...kh, s: 1.5, lift: 24, t: 0.6 });
  const you = draw.you({ x: 400, y: 1660, s: 1.12, armL: 120, armR: 120, bendL: 60, bendR: 60, headRot: 6, shade: true, shadow: false,
    face: { name: 'scared', mouth: 'O', eyes: { pupil: 0.3 }, fx: ['sweat', 'sweat2'] } });
  o += vig('vigR');
  o += rim(you);
  o += bigText([{ t: 'LV 99', size: 200, fill: 'url(#tR)' }, { t: 'TEACHER?!', size: 140, fill: 'url(#tW)' }], 470, 200, { rot: -4, gap: 0.92 });
  return o;
}

// ---------------------------------------------------------------- 3: HE HAS 3 HP?! — Tank in the cafeteria, the hero offers his sandwich
function thumb3() {
  const t = 0.5;
  let o = DEFS;
  o += blur(ST.cafeteria(t, { quiet: 0.1 }), 'bgBlur2');
  o += S.rect(0, 0, W, H_, 0, { fill: '#160A26', opacity: 0.5 });
  o += S.path('M1150 -20L1550 -20L1960 1100L740 1100Z', { fill: 'url(#beam)', opacity: 0.45 }) + S.path('M1200 -20L1500 -20L1860 1100L840 1100Z', { fill: 'url(#beam)', opacity: 0.7 });
  o += halo(1340, 620, 640, 620, 'haloWarm', 0.9);
  const tk = { x: 1350, y: 1300, s: 0.78 };
  const th = head('tank', tk.x, tk.y, tk.s);
  o += plateGlow(th.x, th.y + 40, 1.55, 'haloBoss', 0.9, 330);
  o += draw.tank({ ...tk, shade: true, shadow: false, face: { name: 'sad', mouth: 'frown' } });
  o += H.plateFor('tank', { ...th, s: 1.55, t: 0.62 });
  const yp = { x: 420, y: 1640, s: 1.1, armL: 15, armR: 128, headRot: 4, shade: true, shadow: false,
    face: { name: 'sad', mouth: 'o', eyes: { pupil: 1.4, sparkle: true, look: [0.5, -0.3] } } };
  const [hx, hy] = C.handPos('you', yp, 1);
  let you = draw.you(yp);
  you += X.sandwich({ x: hx + 85, y: hy - 45, s: 1.15, rot: -12 });
  o += rim(you);
  o += sparkles([[hx + 230, hy - 140, 22], [hx + 10, hy - 170, 16], [hx + 250, hy + 30, 14]]);
  o += vig();
  o += bigText([{ t: 'HE HAS', size: 140, fill: 'url(#tW)' }, { t: '3 HP?!', size: 210, fill: 'url(#tR)' }], 470, 160, { rot: -4, gap: 1.0 });
  return o;
}

// the SC08 overload, hand-placed so it reads at phone size: big outlined numbers, little LV chips, plates slammed onto faces
const num = (x, y, txt, size, col, rot = 0) => S.g(H.TL(txt, 0, size * 0.35, size, col,
  { stroke: '#020C16', 'stroke-width': f(Math.max(4, size * 0.13)), 'stroke-linejoin': 'round', 'paint-order': 'stroke' }), `translate(${f(x)} ${f(y)}) rotate(${f(rot)})`);
function chip(x, y, txt, size, col = '#3BE8FF', rot = 0, th = 'cyan') {
  const w = txt.length * size * 0.52 + 34, h = size + 22;   // Lilita digits ≈ 0.52 em
  return S.g(H.panel(-w / 2, -h / 2, w, h, th, { c: 8, br: 10, scan: false, shadow: false, edge: 4 }) + H.TL(txt, 0, size * 0.36, size, col), `translate(${f(x)} ${f(y)}) rotate(${f(rot)})`);
}
function faceSlam(x, y, r, lvl, j, rot) {
  const pw = r * 2.5, ph = r * 1.45, red = j === 2;
  let p = S.path(H.cham(-pw / 2, -ph / 2, pw, ph, r * 0.2), { fill: '#061624', 'fill-opacity': 0.96, stroke: '#020C16', 'stroke-width': 5 });
  p += S.path(H.cham(-pw / 2 + 4, -ph / 2 + 4, pw - 8, ph - 8, r * 0.18), { fill: 'none', stroke: red ? '#FF4D66' : '#3BE8FF', 'stroke-width': 3 });
  p += H.TL(`LV ${lvl}`, 0, r * 0.12, r * 0.62, '#FFFFFF');
  p += H.segBar(-pw / 2 + r * 0.25, r * 0.3, pw - r * 0.5, r * 0.18, 0.2 + 0.7 * ((lvl * 37) % 100) / 100, red ? '#FF3355' : '#3DFF8F', { cell: r * 0.22 });
  return S.g(p, `translate(${f(x)} ${f(y)}) rotate(${f(rot)})`);
}

// ---------------------------------------------------------------- 4: WHERE'S MAX?! — the fair, the numbers flood, Max on the dinosaur
function thumb4() {
  const t = 3.0, wob = 0.3;
  let o = DEFS;
  const cam = FS.camAt(4300, 60, 0.55);
  const opt = { time: 'dusk', crowd: 1, packed: 0.6, wobble: wob };
  const L = FS.fair.layers(t, cam, opt);
  o += L.bg + L.mid + L.front;
  const seat = FS.SPOTS.fair.dino.seat(t, wob);
  const ms = FS.toScreen(cam, seat.x, seat.hip, 1);
  o += halo(ms.x, ms.y, 95, 95, 'haloGreen', 0.85);
  o += S.g(draw.max(FS.seatPose({ ...seat, pose: FS.SIT }, 0.56, { rot: seat.rot, face: 'excited', shade: true, shadow: false })), FS.camTf(cam, 1));
  o += L.crowd + L.fg + L.light;
  o += S.rect(0, 0, W, H_, 0, { fill: '#0A0620', opacity: 0.12 });
  // plates slammed onto faces in the crowd (left + right of the quest arrow)
  [[828, 880, 0.23, 12, 0], [986, 880, 0.26, 40, 1], [1765, 880, 0.28, 8, 2], [1825, 925, 0.33, 57, 0], [1596, 920, 0.31, 23, 1], [1714, 960, 0.3, 31, 0]]
    .forEach(([x, y, sc, lvl, j], i) => { o += faceSlam(x, y + 150 * sc, 150 * sc + 8, lvl, j, (i % 2 ? 1 : -1) * (5 + i * 2)); });
  // little LV chips over the back rows
  [[1134, 820, 'LV 19'], [1464, 790, 'LV 3'], [1628, 790, 'LV 45'], [1860, 800, 'LV 9']].forEach(([x, y, tx], i) => { o += chip(x, y, tx, 24, i % 2 ? '#FFD21F' : '#3BE8FF', (i % 3 - 1) * 4); });
  // the swarm of numbers above the crowd
  o += num(900, 520, 'LV 12', 70, '#3BE8FF', -6) + num(1480, 470, 'HP 80/100', 48, '#3DFF8F', 4) + num(1790, 560, '999', 74, '#FF4D66', 8) +
    num(1130, 640, 'LV 40', 64, '#FFD21F', -3) + num(1600, 680, 'INT 95', 54, '#FFFFFF', -5) +
    num(1820, 380, 'LV 27', 58, '#7FF4FF', -4) + num(1380, 600, '-12', 60, '#FF4D66', 0) + num(1020, 430, 'STR 44', 42, '#FFFFFF', 5);
  o += chip(1260, 520, 'LV 8', 40, '#FFFFFF', -4) + chip(1700, 420, '88%', 34, '#FFD21F', 6, 'warn');
  // the hero covers his ears
  const you = draw.you({ x: 470, y: 1660, s: 1.2, armL: 100, armR: 100, bendL: 100, bendR: 100, headRot: -5, shade: true, shadow: false,
    face: { name: 'scream', mouth: 'scream', eyes: { pupil: 0.35 }, fx: ['sweat', 'sweat2'] } });
  o += rim(you);
  o += spinArcs(1260, 880, 1.35, t);
  o += H.questArrow({ x: 1260, y: 880, t, glitch: 0.15, s: 1.35, label: 'FIND MAX', dist: '??? m' });
  o += vig();
  o += bigText([{ t: "WHERE'S", size: 140, fill: 'url(#tW)' }, { t: 'MAX?!', size: 220, fill: 'url(#tG)' }], 470, 165, { rot: -4, gap: 1.0 });
  return o;
}

const ALL = { 1: thumb1, 2: thumb2, 3: thumb3, 4: thumb4 };

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const which = process.argv[2] && process.argv[2] !== 'all' ? process.argv[2].split(',') : Object.keys(ALL);
  const r = await openRenderer(W, H_, { staticDefs: STATIC_DEFS });
  for (const k of which) {
    S.resetIds();
    const png = path.join(OUT, `thumb_${k}.png`);
    fs.writeFileSync(png, await r.render(ALL[k]()));
    const jpg = path.join(OUT, `thumb_${k}.jpg`);
    execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', png, '-vf', 'scale=1280:720:flags=lanczos', '-q:v', '2', jpg]);
    console.log('wrote', png, jpg, `${(fs.statSync(jpg).size / 1024).toFixed(0)} KB`);
  }
  await r.close();
}
if (require.main === module) main().catch((e) => { console.error(e); process.exit(1); });
module.exports = { ALL };
