// YouTube thumbnails (4 variants) for "What If Your PARENTS Joined Your Roblox Server?", built from the video's rig, sets and UI.
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
const G = require('../scenes/gameui');
const SG = require('../scenes/sets_game');
const SH = require('../scenes/sets_house');
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
const SETDEFS = () => (SG.DEFS || '') + (SH.DEFS || '') + (R.DEFS || '') + (G.DEFS || '') + (X.DEFS || '');

// ---------------------------------------------------------------- 1: MY PARENTS JOINED MY SERVER?! — the whole family spawns behind the hero
function thumb1() {
  let o = DEFS + SETDEFS();
  o += SG.plaza(1, SG.SPOTS.plaza.cams.spawn, { time: 'day' });
  o += S.rect(0, 0, W, H, 0, { fill: '#0A1A3A', opacity: 0.12 });
  o += K.rays(1180, 620, 22, 1700, '#FFF3B0', 0.13, 3);
  // the family behind the hero
  o += draw.dadAvatar({ x: 1500, y: 1010, s: 0.6, armL: 150, armR: 150, shade: true, shadow: false, nametag: false, face: { name: 'excited', mouth: 'bigGrin' } });
  o += draw.grandmaAvatar({ x: 1820, y: 1020, s: 0.62, armR: 110, shade: true, shadow: false, nametag: false, face: { name: 'smug', mouth: 'smirk' } });
  o += draw.momAvatar({ x: 1180, y: 1030, s: 0.64, armor: 1, armR: 160, shade: true, shadow: false, nametag: false, face: { name: 'smug', mouth: 'smile' } });
  o += G.emoteHearts({ x: 1180, y: 380, age: 0.6 });
  // the hero, huge, horrified
  const you = draw.you({ x: 520, y: 1700, s: 1.3, armR: 165, armL: 165, headRot: -4, shade: true, shadow: false,
    face: { name: 'shocked', mouth: 'O', eyes: { pupil: 0.35 }, fx: ['sweat', 'sweat2'] } });
  o += rim(you);
  o += G.joinStack(10, [
    { user: 'DadBod1978', at: 0, who: 'dad', hold: 99 },
    { user: 'MOM_OFFICIAL', at: 0, who: 'mom', hold: 99 },
    { user: 'GrannyGoodies', at: 0, who: 'granny', hold: 99 },
  ], { x: 1890, y: 70, s: 1.25 });
  o += S.rect(0, 0, W, H, 0, { fill: 'url(#vigT)' });
  o += bigText([{ t: 'MY PARENTS', size: 132, fill: 'url(#tW)' }, { t: 'JOINED?!', size: 190, fill: 'url(#tY)' }], 560, 150, { rot: -4, gap: 1.02 });
  return o;
}

// ---------------------------------------------------------------- 2: MY MOM IS #1?! — golden Mom in the arena, the leaderboard
function thumb2() {
  let o = DEFS + SETDEFS();
  o += SG.arena(1, SG.SPOTS.arena.cams.wide, { time: 'day', cheer: 1 });
  o += S.rect(0, 0, W, H, 0, { fill: '#1A0A2A', opacity: 0.18 });
  o += S.ellipse(1240, 620, 640, 560, { fill: 'url(#haloWhite)', opacity: 0.55 });
  o += G.knockoutFly({ x0: 1500, y0: 560, age: 0.35, svg: draw.darkblade({ x: 0, y: 0, s: 0.3, shade: true, shadow: false, nametag: false, stars: true }) });
  o += draw.momAvatar({ x: 1150, y: 1380, s: 0.9, armor: 1, armR: 175, armL: 70, lean: 6, shade: true, shadow: false, nametag: false, face: { name: 'smug', mouth: 'smile', eyes: { type: 'closed' } } });
  o += G.slash({ x: 1350, y: 520, age: 0.08, angle: -35 });
  o += G.leaderboard({ style: 'hud', x: 1890, y: 30, s: 1.05, w: 620, rows: [
    { rank: 1, name: 'MOM_OFFICIAL', score: 2104, crown: true, who: 'mom' },
    { rank: 2, name: 'xX_DarkBlade_Xx', score: 1530, who: 'darkblade' },
    { rank: 47, name: 'YOU', score: 312, who: 'you' }], highlight: 'MOM_OFFICIAL', k: 1, t: 1 });
  const you = draw.you({ x: 380, y: 1700, s: 1.22, armR: 150, armL: 25, headRot: 6, shade: true, shadow: false,
    face: { name: 'shocked', mouth: 'O', eyes: { pupil: 0.35 }, fx: ['sweat'] } });
  o += rim(you);
  o += S.rect(0, 0, W, H, 0, { fill: 'url(#vigT)' });
  o += bigText([{ t: 'MY MOM', size: 150, fill: 'url(#tW)' }, { t: 'IS #1?!', size: 200, fill: 'url(#tY)' }], 470, 170, { rot: -5, gap: 1.0 });
  return o;
}

// ---------------------------------------------------------------- 3: JUMP, DAD! — the hot dog leaping over lava toward the crystal
function thumb3() {
  let o = DEFS + SETDEFS();
  o += SG.tower(1, SG.SPOTS.tower.cams.finalGap, { time: 'night' });
  o += S.rect(0, 0, W, H, 0, { fill: '#0A0620', opacity: 0.12 });
  o += G.crystal({ x: 1560, y: 230, s: 1.6, t: 1 });
  o += S.ellipse(1560, 230, 380, 380, { fill: 'url(#haloWhite)', opacity: 0.45 });
  o += draw.dadAvatar({ x: 1130, y: 1010, s: 0.66, rot: -14, armL: 170, armR: 175, legL: 30, legR: -20, kneeL: 40, shade: true, shadow: false, nametag: false,
    face: { name: 'determined', mouth: 'teeth', fx: ['sweat'] } });
  const you = draw.you({ x: 330, y: 1680, s: 1.12, armR: 175, armL: 160, headRot: -6, shade: true, shadow: false,
    face: { name: 'excited', mouth: 'scream', eyes: { type: 'star' } } });
  o += rim(you);
  o += G.chatBubble({ x: 1560, y: 760, s: 1.2, text: 'JUMP DAD JUMP!!!', k: 1, typed: 1, caps: true, user: 'NoodleBoi', who: 'noodle', t: 1 });
  o += S.rect(0, 0, W, H, 0, { fill: 'url(#vigT)' });
  o += bigText([{ t: 'MY DAD', size: 140, fill: 'url(#tW)' }, { t: "CAN'T JUMP!", size: 160, fill: 'url(#tR)' }], 600, 150, { rot: -4, gap: 1.0 });
  return o;
}

// ---------------------------------------------------------------- 4: GRANNY BOUGHT MY BASE — SOLD on the castle, rent 50 coins
function thumb4() {
  let o = DEFS + SETDEFS();
  o += SG.tycoon(1, SG.SPOTS.tycoon.cams.castle, { time: 'sunset', sold: 1 });
  o += S.rect(0, 0, W, H, 0, { fill: '#10203A', opacity: 0.15 });
  o += draw.grandmaAvatar({ x: 1450, y: 1150, s: 0.9, bag: true, coins: true, armR: 120, shade: true, shadow: false, nametag: false, face: { name: 'smug', mouth: 'smirk' } });
  o += G.stamp({ text: 'SOLD', k: 1, x: 1000, y: 520, s: 1.4, rot: -14 });
  o += G.coinCounter({ x: 40, y: 40, value: 12, k: 1, s: 1.4 });
  const you = draw.you({ x: 470, y: 1700, s: 1.22, armR: 160, armL: 160, headRot: 5, shade: true, shadow: false,
    face: { name: 'scream', mouth: 'O', eyes: { pupil: 0.35 }, fx: ['sweat', 'sweat2'] } });
  o += rim(you);
  o += S.rect(0, 0, W, H, 0, { fill: 'url(#vigT)' });
  o += bigText([{ t: 'GRANNY BOUGHT', size: 120, fill: 'url(#tW)' }, { t: 'MY BASE!', size: 175, fill: 'url(#tY)' }], 1330, 190, { rot: 4, gap: 1.02 });
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
