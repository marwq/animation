// Contact sheets of the respawn FX / game-UI kit (scenes/respawn.js).
// Usage:
//   node tools/fx_sheet.js                         every sheet -> concept/fx.png (overview) + concept/fx_<sheet>.png
//   node tools/fx_sheet.js --sheet tip,ui          only those sheets (tip | world | ui | lag | foam | motion | overview)
//   node tools/fx_sheet.js --only crumble,tip_     only tiles whose key starts with one of these (written to --out or /tmp)
//   node tools/fx_sheet.js --full DIR              also write every tile as a full 1920x1080 PNG into DIR
//   node tools/fx_sheet.js --out FILE --t 2.3      output file (with --only) / base clock time
// Prints per-tile element counts, JS build time and browser render time (minus an empty-frame baseline).
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const S = require('../rig/svg');
const { openRenderer } = require('./render');
const R = require('../scenes/respawn');
const K = require('../scenes/kit');
const AC = require('../scenes/acting');
const { f, lerp, ease, clamp } = S;

const args = process.argv.slice(2);
const arg = (k) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : null; };
const SHEETS = arg('--sheet') ? arg('--sheet').split(',') : null;
const ONLY = arg('--only') ? arg('--only').split(',') : null;
const FULL = arg('--full');
const OUT = arg('--out');
const T0 = Number(arg('--t') || 2.3);
const PERF = args.includes('--perf');
const CONCEPT = path.join(__dirname, '..', 'concept');

// ---------------------------------------------------------------- backdrops + hero
const LBL = (txt, x, y, size = 34, col = '#FFFFFF') => `<text x="${x}" y="${y}" font-family="Fredoka" font-weight="700" font-size="${size}" fill="${col}" text-anchor="middle" stroke="#151515" stroke-width="7" paint-order="stroke">${txt}</text>`;
const grad = (id, a, b) => `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs>`;
function bgRoom(floor = 900, wall = ['#F6E3C8', '#EBC9A2'], fl = '#B9875E') {
  const id = S.uid('fxbg');
  return grad(id, wall[0], wall[1]) + `<rect width="1920" height="1080" fill="url(#${id})"/>` + `<rect y="${floor - 30}" width="1920" height="${1110 - floor}" fill="${fl}"/><rect y="${floor - 30}" width="1920" height="10" fill="#151515" opacity="0.25"/>` +
    `<rect x="150" y="160" width="300" height="260" rx="14" fill="#BFE6FF" stroke="#151515" stroke-width="8"/><path d="M300 160 V420 M150 290 H450" stroke="#151515" stroke-width="7"/>`;
}
function bgStreet(floor = 900, sky = ['#7CCBFF', '#D8F1FF']) {
  const id = S.uid('fxbg');
  let o = grad(id, sky[0], sky[1]) + `<rect width="1920" height="1080" fill="url(#${id})"/>`;
  o += `<path d="M0 ${floor - 260} Q200 ${floor - 380} 420 ${floor - 280} T900 ${floor - 300} T1400 ${floor - 280} T1920 ${floor - 320} V${floor} H0Z" fill="#8FD89A"/>`;
  for (let i = 0; i < 5; i++) o += `<rect x="${120 + i * 380}" y="${floor - 330 - (i % 2) * 60}" width="220" height="${330 + (i % 2) * 60}" rx="10" fill="${['#F2B8A0', '#BFD8F2', '#F2E0A0', '#C9F2C0', '#E0C8F2'][i]}" stroke="#151515" stroke-width="7"/><path d="M${100 + i * 380} ${floor - 330 - (i % 2) * 60} L${230 + i * 380} ${floor - 430 - (i % 2) * 60} L${360 + i * 380} ${floor - 330 - (i % 2) * 60}Z" fill="#D9534F" stroke="#151515" stroke-width="7"/>`;
  o += `<rect y="${floor - 20}" width="1920" height="${1100 - floor}" fill="#9BA3AF"/><rect y="${floor - 20}" width="1920" height="14" fill="#C9CED6"/>`;
  return o;
}
function bgNight() { const id = S.uid('fxbg'); return grad(id, '#141A3C', '#2A2F66') + `<rect width="1920" height="1080" fill="url(#${id})"/>`; }
function bgStage(floor = 900) {
  const id = S.uid('fxbg');
  let o = grad(id, '#3A1E5C', '#6A2F7A') + `<rect width="1920" height="1080" fill="url(#${id})"/>`;
  o += `<path d="M0 0 H260 Q200 500 300 1080 H0Z M1920 0 H1660 Q1720 500 1620 1080 H1920Z" fill="#B5203A" stroke="#151515" stroke-width="8"/>`;
  o += `<rect y="${floor - 20}" width="1920" height="${1100 - floor}" fill="#8A5A3A"/><rect y="${floor - 20}" width="1920" height="12" fill="#151515" opacity="0.3"/>`;
  o += `<path d="M700 0 L560 ${floor} H1360 L1220 0Z" fill="#FFF4C4" opacity="0.12"/>`;
  return o;
}
function bgSunsetCity(floor = 1000) {
  const id = S.uid('fxbg');
  let o = grad(id, '#5A1030', '#FF7A4A') + `<rect width="1920" height="1080" fill="url(#${id})"/>`;
  let d = `M0 ${floor}`;
  for (let i = 0; i < 16; i++) { const x = i * 125, h = 160 + R.hash(i * 3.3) * 260; d += ` V${floor - h} H${x + 110} V${floor}`; }
  o += `<path d="${d} H1920 V1080 H0Z" fill="#2A0C1E"/>`;
  return o;
}
const hero = (t, pose = {}, act = {}) => K.actor('you', t, { s: 0.5, ...pose }, act);
const quad4 = (svgs) => svgs.map((v, i) => `<svg x="${(i % 2) * 960}" y="${Math.floor(i / 2) * 540}" width="960" height="540" viewBox="0 0 1920 1080">${v}</svg>`).join('') + '<path d="M960 0 V1080 M0 540 H1920" stroke="#000" stroke-width="6"/>';
const strip = (svgs, labels = []) => {   // n full frames side by side (each scaled to 1920/n wide, centred vertically)
  const n = svgs.length, w = 1920 / n, h = w * 9 / 16;
  return '<rect width="1920" height="1080" fill="#101420"/>' + svgs.map((v, i) => `<svg x="${i * w}" y="${540 - h / 2}" width="${w}" height="${h}" viewBox="0 0 1920 1080">${v}</svg>` + (labels[i] ? LBL(labels[i], i * w + w / 2, 540 + h / 2 + 50, 30, '#FFE14D') : '')).join('');
};
// n frames in a cols x rows grid, each cropped to viewBox vb = [x, y, w, h] (keep w/h = (1920/cols)/(1080/rows))
const cropGrid = (svgs, cols, vb, labels = []) => {
  const rows = Math.ceil(svgs.length / cols), w = 1920 / cols, h = 1080 / rows;
  return '<rect width="1920" height="1080" fill="#000"/>' + svgs.map((v, i) => `<svg x="${(i % cols) * w}" y="${Math.floor(i / cols) * h}" width="${w}" height="${h}" viewBox="${vb.join(' ')}" preserveAspectRatio="xMidYMid slice">${v}</svg>` + (labels[i] ? LBL(labels[i], (i % cols) * w + w / 2, Math.floor(i / cols) * h + h - 18, 34, '#FFE14D') : '')).join('') +
    Array.from({ length: cols - 1 }, (_, i) => `<path d="M${(i + 1) * w} 0 V1080" stroke="#000" stroke-width="6"/>`).join('') + Array.from({ length: rows - 1 }, (_, i) => `<path d="M0 ${(i + 1) * h} H1920" stroke="#000" stroke-width="6"/>`).join('');
};
const grid = (svgs, cols, labels = []) => {
  const rows = Math.ceil(svgs.length / cols), w = 1920 / cols, h = 1080 / rows;
  return '<rect width="1920" height="1080" fill="#000"/>' + svgs.map((v, i) => `<svg x="${(i % cols) * w}" y="${Math.floor(i / cols) * h}" width="${w}" height="${h}" viewBox="0 0 1920 1080">${v}</svg>` + (labels[i] ? LBL(labels[i], (i % cols) * w + w / 2, Math.floor(i / cols) * h + h - 16, 26, '#FFE14D') : '')).join('');
};

// ---------------------------------------------------------------- the standard fail -> respawn recipe (also in docs/FX.md)
// returns the frame at time t of a fail at u=0 on the street and a respawn on the pad
function seqFrame(t, u, preset = 'standard') {
  const FAIL = { x: 1260, y: 900, s: 0.5 }, SPAWN = { x: 700, y: 900, s: 0.5 };
  const q = R.respawnSeq(u, { preset, fail: { ...FAIL, dir: [0.6, -0.2] }, spawn: SPAWN, reason: 'YOU TRIPPED ON A SKATEBOARD', t });
  let o = bgStreet();
  o += R.checkpoint({ ...SPAWN, t, state: 'saved', part: 'back' });
  o += q.under;
  if (q.heroAt === 'fail') o += hero(t, { ...FAIL, face: 'scared', armL: 60, armR: 70, lean: 8 });
  if (q.heroAt === 'spawn') o += hero(t, { ...SPAWN, ...q.pose, face: 'shocked' });
  o += R.checkpoint({ ...SPAWN, t, state: 'saved', part: 'front' });
  o += q.over + q.screen;
  return o + LBL(`${preset}  u=${u.toFixed(2)}s · ${q.phase}`, 960, 1040, 64, '#FFE14D');
}

// ---------------------------------------------------------------- tiles: [key, sheet, label, fn(t)]
const TILES = [
  // ---------------- TIP
  ['tip_moods', 'tip', 'tip · moods happy / smug / suspicious / worried / sad (s 1.6)', (t) => bgNight() + ['happy', 'smug', 'suspicious', 'worried', 'sad'].map((m, i) => R.tip({ x: 240 + i * 360, y: 470, s: 1.6, t: t + i * 0.37, mood: m, talk: false, blink: 0 }) + LBL(m, 240 + i * 360, 700)).join('') +
    R.tip({ x: 520, y: 880, s: 1.1, t, mood: 'happy', talk: false, look: [-1, 0] }) + R.tip({ x: 960, y: 880, s: 1.1, t, mood: 'happy', talk: false, look: [1, -0.6], tail: 1 }) + R.tip({ x: 1400, y: 880, s: 1.1, t, mood: 'smug', talk: false, label: false, look: [0, 1] }) + LBL('look L / look R+up, tail right / no label, look down', 960, 1040, 28)],
  ['tip_talk', 'tip', 'tip · visemes X A B C D E F G H (talk:"C") + auto lip-sync from TIP lines', (t) => bgNight() + ['X', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].map((v, i) => R.tip({ x: 150 + i * 203, y: 330, s: 1.15, t: t + i * 0.2, mood: 'happy', talk: v, blink: 0 }) + LBL(v, 150 + i * 203, 470)).join('') +
    [200.2, 200.6, 201.1, 226.4, 311.2, 323.3].map((tt, i) => R.tip({ x: 220 + i * 296, y: 760, s: 1.3, t: tt }) + LBL(`t=${tt}`, 220 + i * 296, 930, 26)).join('')],
  ['tip_glitch', 'tip', 'tip · glitch .3 / .6 / 1   ·   fade .25 / .5 / .75 / .92', (t) => bgNight() + [0.3, 0.6, 1].map((g, i) => R.tip({ x: 420 + i * 540, y: 300, s: 1.5, t: t + i * 0.13, mood: 'worried', glitch: g, talk: 'C' }) + LBL(`glitch ${g}`, 420 + i * 540, 500)).join('') +
    [0.25, 0.5, 0.75, 0.92].map((fd, i) => R.tip({ x: 300 + i * 440, y: 790, s: 1.5, t, mood: 'happy', fade: fd, talk: false }) + LBL(`fade ${fd}`, 300 + i * 440, 1000)).join('')],
  ['tip_cards', 'tip', 'tipCard k .3 / .6 / 1, typewriter .55; Tip next to the hero', (t) => bgRoom() + R.tipCard(560, 170, 0.3, 'TIP: Step on the checkpoint to save your progress!', { t }) + R.tipCard(560, 380, 0.6, 'TIP: Carry the flag to move your checkpoint!', { t }) +
    R.tipCard(560, 590, 1, 'TIP: Don\'t press "Leave Game."', { t, w: 560 }) + R.tipCard(560, 800, 1, 'TIP: You can reset yourself anytime! Just open the menu!', { t, type: 0.55 }) +
    hero(t, { x: 1450, y: 900, face: 'confused' }) + R.tip({ x: 1700, y: 380, s: 1.2, t, mood: 'happy', look: [-1, 0.3], talk: 'D' })],
  // ---------------- WORLD
  ['cp_states', 'world', 'checkpoint · idle / saved / red (blinking, torn) / dead (fallen) at s .42', (t) => bgRoom(930) + ['idle', 'saved', 'red', 'dead'].map((st, i) => R.checkpoint({ x: 260 + i * 470, y: 880, s: 0.42, t, state: st }) + LBL(st, 260 + i * 470, 1010)).join('')],
  ['save_wave', 'world', 'saveWave u .15 / .45 (green wave through the room) + savedToast', (t) => quad4([0.15, 0.45].map((u) => bgRoom(930) + R.checkpoint({ x: 760, y: 880, s: 0.5, t, save: 0.3 + u, part: 'back' }) + hero(t, { x: 740, y: 880, face: 'amazed' }) + R.checkpoint({ x: 760, y: 880, s: 0.5, t, save: 0.3 + u, part: 'front' }) + R.saveWave(u, { x: 760 }) + R.savedToast(70, 980, u * 2, { t })).concat([bgRoom(930) + R.tinyFlag(960, 700, 3, t), bgNight() + R.tinyFlag(960, 700, 3, t + 0.3)]))],
  ['cp_save', 'world', 'checkpoint save .06 / .18 / .4 / .75 (flag shoots up, pulse rings, burst)', (t) => quad4([0.06, 0.18, 0.4, 0.75].map((sv) => bgRoom(930) + R.checkpoint({ x: 960, y: 880, s: 0.5, t, state: 'saved', save: sv, part: 'back' }) + hero(t, { x: 930, y: 880, face: 'amazed', armL: 30, armR: 30 }) + R.checkpoint({ x: 960, y: 880, s: 0.5, t, state: 'saved', save: sv, part: 'front' }) + LBL(`save ${sv}`, 960, 120, 60)))],
  ['flags', 'world', 'flag carried · plant .1/.2/.35/.8 · backpack flagProp · tinyFlag in a bowl', (t) => { const hd = AC.hand(40, 1); return bgStreet(920) + hero(t, { x: 260, y: 920, armR: 40, face: 'happy' }, { arms: false }) + R.flag({ x: 260 + hd[0] * 0.5, y: 920 + hd[1] * 0.5, s: 0.5, rot: 12, t, grip: 0.3 }) +
    [0.1, 0.2, 0.35, 0.8].map((p, i) => R.flag({ x: 620 + i * 230, y: 920, s: 0.42, t, plant: p, rot: -20 }) + LBL(`plant ${p}`, 620 + i * 230, 1010, 26)).join('') +
    hero(t, { x: 1560, y: 920, face: 'happy', props: [R.flagProp(t)] }) +
    `<circle cx="1820" cy="520" r="90" fill="#BFE8FF" opacity="0.7" stroke="#151515" stroke-width="7"/>` + R.tinyFlag(1820, 585, 0.9, t) + LBL('tinyFlag', 1820, 660, 24); }],
  ['crumble_strip', 'world', 'crumble age .02 / .07 / .18 / .35 / .6 / 1.0 / 1.35', (t) => bgRoom(930) + [0.02, 0.07, 0.18, 0.35, 0.6, 1.0, 1.35].map((a, i) => R.crumble({ x: 150 + i * 270, y: 900, s: 0.36, age: a, seed: 3 }) + LBL(`${a}`, 150 + i * 270, 1010, 28)).join('') + hero(t, { x: 150, y: 560, s: 0.3, face: 'scared' }) + LBL('before', 150, 600, 22)],
  ['crumble_dir', 'world', 'crumble · bike fling dir [1,-.4] floorY age .2 / .6 · ghost:1 · spread 1.5 seed 7', (t) => quad4([
    bgStreet(920) + R.crumble({ x: 600, y: 640, s: 0.5, age: 0.2, dir: [1, -0.4], floorY: 920, seed: 2 }),
    bgStreet(920) + R.crumble({ x: 600, y: 640, s: 0.5, age: 0.6, dir: [1, -0.4], floorY: 920, seed: 2 }),
    bgStreet(920) + R.crumble({ x: 960, y: 920, s: 0.5, age: 0.3, ghost: 1, seed: 4 }),
    bgStreet(920) + R.crumble({ x: 960, y: 920, s: 0.5, age: 0.28, seed: 7, spread: 1.5 }),
  ])],
  ['respawn_full', 'world', 'respawnOverlay full (digit 3 slam, reason) over a paused street', (t) => { const tt = 0.3; return bgStreet() + R.crumble({ x: 1100, y: 900, s: 0.5, age: 0.25, seed: 2 }) + R.respawnOverlay(tt, { t0: 0, dur: 1.2, reason: 'YOU FELL DOWN THE STAIRS' }); }],
  ['respawn_styles', 'world', 'respawnOverlay full late (2, ring) · banner · corner · mini', (t) => quad4([
    bgStreet() + R.respawnOverlay(0.62, { t0: 0, dur: 1.2, reason: 'SPAGHETTI INCIDENT' }),
    bgStreet() + R.respawnOverlay(0.5, { t0: 0, dur: 1.2, style: 'banner', reason: 'HIT BY A DODGEBALL' }),
    bgStreet() + hero(t, { x: 900, y: 900, face: 'oof' }) + R.respawnOverlay(0.9, { t0: 0, dur: 1.2, style: 'corner' }),
    bgStreet() + R.crumble({ x: 900, y: 900, s: 0.5, age: 0.4 }) + R.respawnOverlay(0.3, { t0: 0, dur: 1.2, style: 'mini', x: 900, y: 360 }),
  ])],
  ['respawn_pop', 'world', 'respawnPop age -.2 / -.06 / .03 / .12 / .3 / .6 (+ popPose squash, forcefield)', (t) => cropGrid([-0.2, -0.06, 0.03, 0.12, 0.3, 0.6].map((a) => {
    const pp = R.popPose(a, 0.5);
    return bgRoom(930) + R.checkpoint({ x: 960, y: 880, s: 0.5, t, part: 'back' }) + R.respawnPop({ x: 960, y: 880, s: 0.5, age: a }) + (pp.hidden ? '' : hero(t, { x: 960, y: 880, ...pp, face: 'shocked' }) + R.forcefield({ x: 960, y: 880, s: 0.5, t, k: 1 }));
  }), 3, [474, 200, 972, 820], ['age -0.2', '-0.06', '0.03', '0.12', '0.3', '0.6'])],
  ['forcefield', 'world', 'forcefield k 1 (on the pad) · k .7 · k .35 (blinking out)', (t) => bgRoom(930) + R.checkpoint({ x: 520, y: 880, s: 0.5, t, part: 'back' }) + hero(t, { x: 520, y: 880, face: 'smug' }) + R.checkpoint({ x: 520, y: 880, s: 0.5, t, part: 'front' }) + R.forcefield({ x: 520, y: 880, s: 0.5, t, k: 1 }) +
    hero(t, { x: 1100, y: 900, s: 0.42, face: 'happy' }) + R.forcefield({ x: 1100, y: 900, s: 0.42, t, k: 0.7 }) + hero(t, { x: 1560, y: 900, s: 0.42, face: 'nervous' }) + R.forcefield({ x: 1560, y: 900, s: 0.42, t: 0.1, k: 0.35 })],
  // ---------------- UI
  ['menu_open', 'ui', 'escMenu k .25 / .5 / 1 hl resume / hl reset press .25', (t) => quad4([
    bgRoom() + hero(t, { x: 1500, y: 900, face: 'amazed' }) + R.escMenu({ x: 760, y: 470, k: 0.25, t }),
    bgRoom() + hero(t, { x: 1500, y: 900, face: 'amazed' }) + R.escMenu({ x: 760, y: 470, k: 0.5, t }),
    bgRoom() + hero(t, { x: 1500, y: 900, face: 'amazed' }) + R.escMenu({ x: 760, y: 470, k: 1, t, hl: 'resume' }),
    bgRoom() + hero(t, { x: 1500, y: 900, face: 'determined' }) + R.escMenu({ x: 760, y: 470, k: 1, t, hl: 'reset', press: 0.25 }),
  ])],
  ['menu_broken', 'ui', 'escMenu hl leave · broken .15 / .5 / .82', (t) => quad4([
    bgRoom() + hero(t, { x: 1500, y: 900, face: 'nervous' }) + R.escMenu({ x: 760, y: 470, k: 1, t, hl: 'leave' }),
    bgStage() + R.escMenu({ x: 960, y: 470, t: 0.3, broken: 0.15 }),
    bgStage() + R.escMenu({ x: 960, y: 470, t, broken: 0.5 }),
    bgStage() + R.escMenu({ x: 960, y: 470, t, broken: 0.82 }),
  ])],
  ['hud', 'ui', 'counterHUD themes · rolling (roll .5 from 0) · bump .12 · savedToast k .3/.6/1, out .5', (t) => bgStreet() +
    R.counterHUD({ x: 60, y: 80, t, label: 'ATTEMPT', value: 57 }) + R.counterHUD({ x: 60, y: 200, t, label: 'ATTEMPTS TODAY:', value: 214, theme: 'gold' }) + R.counterHUD({ x: 60, y: 320, t, label: 'THURSDAY ·  VERSION', value: 412, icon: 'cal' }) +
    R.counterHUD({ x: 60, y: 440, t, label: 'FALLS:', value: 4816 }) + R.counterHUD({ x: 60, y: 560, t, label: 'RESPAWNS USED:', value: 9999, theme: 'red' }) + R.counterHUD({ x: 60, y: 680, t, label: 'LIVES:', value: '∞', theme: 'green', icon: 'heart' }) +
    R.counterHUD({ x: 560, y: 680, t, label: 'LIVES:', value: 1, theme: 'white', icon: 'heart' }) + R.lowGfxBadge(60, 800, 1, t) +
    R.counterHUD({ x: 1860, y: 80, t, label: 'ATTEMPT', value: 4816, roll: 0.5, from: 0, anchor: 'right' }) + R.counterHUD({ x: 1860, y: 200, t, label: 'ATTEMPT', value: 23, bump: 0.12, anchor: 'right' }) +
    R.savedToast(1180, 360, 0.3, { t }) + R.savedToast(1180, 480, 0.6, { t }) + R.savedToast(1180, 600, 1, { t }) + R.savedToast(1180, 720, 1, { t, out: 0.5 }) + R.savedToast(1180, 900, 1, { t, text: 'Checkpoint saved', s: 0.7 })],
  ['win_sky', 'ui', 'sysWindow red SKY-size + skyCrack (sunset city)', (t) => bgSunsetCity() + R.skyCrack({ cx: 1500, cy: 180, k: 0.8, t, s: 0.7 }) +
    R.sysWindow({ x: 900, y: 340, w: 1640, h: 560, k: 1, t, theme: 'red', title: 'WARNING', lines: ['SAVE FILE CORRUPTED', 'Respawns used: 9,999'], small: 'Too many respawns. The world may lag.' })],
  ['win_small', 'ui', 'DELETE SAVE? (hl YES press .2) · export progress .6 (green) · red glitch .6 · crt open .45', (t) => quad4([
    bgStreet() + R.sysWindow({ x: 960, y: 520, w: 1100, h: 560, t, theme: 'grey', title: 'DELETE SAVE?', icon: 'trash', lines: ['Delete the save file?', 'Everything goes back to normal.'], small: 'Respawn will be disabled forever.', buttons: ['YES', 'NO'], hl: 0, press: 0.2 }),
    bgNight() + R.sysWindow({ x: 960, y: 520, w: 1200, h: 520, t, theme: 'green', title: 'SYSTEM', icon: 'export', lines: ['FINAL CHECKPOINT REACHED', 'Exporting to real life…'], progress: 0.6 }),
    bgStreet() + R.sysWindow({ x: 960, y: 520, w: 1100, h: 480, t, theme: 'red', title: 'ERROR', icon: 'save', lines: ['SAVE FILE CORRUPTED', 'Respawns used: 9,999'], glitch: 0.6, buttons: ['OK'] }),
    bgStreet() + R.sysWindow({ x: 960, y: 520, w: 1100, h: 480, k: 0.45, open: 'crt', t, theme: 'red', title: 'WARNING', lines: ['SAVE FILE CORRUPTED'] }),
  ])],
  ['skycrack', 'ui', 'skyCrack k .08 / .3 / .6 / 1', (t) => quad4([0.08, 0.3, 0.6, 1].map((k) => bgSunsetCity() + R.skyCrack({ cx: 960, cy: 420, k, t }) + LBL(`k ${k}`, 960, 1000, 60)))],
  // ---------------- LAG + OTHER
  ['lag', 'lag', 'loadingTexture · rubberBand ghost · glitchSlices · rgbSplit · tint ghost · greyWash (right half)', (t) => {
    let o = bgStreet();
    o += R.loadingTexture(80, 470, 380, 420, t);
    const rb = R.rubberBand(0.9, { period: 1.4, a: [620, 900], b: [920, 900] });
    o += R.tint(hero(t, { x: 620, y: 900, s: 0.36 }), 'ghost', 0.35) + hero(t, { x: rb.x, y: 900, s: 0.36, view: 'side', flip: true });
    o += R.glitchSlices(hero(t, { x: 1180, y: 900, s: 0.42, face: 'scared' }), 0.31, 0.9, 3, { x: 1000, y: 400, w: 360, h: 520, maxDx: 50 });
    o += R.rgbSplit(hero(t, { x: 1480, y: 900, s: 0.42, face: 'dizzy' }), 1, { dx: 12 });
    o += R.greyWash(1, { x: 1640, w: 280 }) + R.tint(hero(t, { x: 1780, y: 900, s: 0.36, face: 'sad' }), 'ghost', 0.75);
    o += R.lowGfxBadge(80, 90, 1, t) + R.pixelDissolve({ x: 1300, y: 120, w: 260, h: 200, k: 0.45, seed: 2 });
    return o;
  }],
  ['confetti', 'lag', 'blockConfetti age .25 / .9 · ghostPop .06 / .3 · blockConfettiRain', (t) => bgStreet() + R.blockConfettiRain(t, { n: 40 }) + R.blockConfetti({ x: 420, y: 600, age: 0.25 }) + R.blockConfetti({ x: 960, y: 600, age: 0.9, seed: 8 }) +
    R.tint(hero(t, { x: 1350, y: 900, s: 0.4 }), 'ghost', 0.5) + R.ghostPop({ x: 1350, y: 900, s: 0.4, age: 0.06 }) + R.ghostPop({ x: 1700, y: 900, s: 0.4, age: 0.3, seed: 3 })],
  ['lightning_rewind', 'lag', 'lightning k .05 / .3 · rewind overlay (+ torn svg) · pixelDissolve in', (t) => quad4([
    bgNight() + R.lightning({ x0: 900, y0: -20, x1: 1100, y1: 820, k: 0.05, seed: 3 }),
    bgNight() + R.lightning({ x0: 900, y0: -20, x1: 1100, y1: 820, k: 0.3, seed: 3 }) + `<rect x="900" y="820" width="400" height="260" fill="#2A2F4A" stroke="#151515" stroke-width="8"/>`,
    R.rewind(t, 1, { svg: bgStreet() + R.crumble({ x: 960, y: 900, s: 0.5, age: 0.3 }), clock: 'MON 7:30 AM' }),
    bgNight() + R.pixelDissolve({ x: 760, y: 340, w: 400, h: 400, k: 0.6, mode: 'in', colors: ['#3DDC84', '#7CFFB2', '#FFFFFF', '#1E9F59'] }) + R.tip({ x: 960, y: 540, s: 2, t, fade: 0.55 }),
  ])],
  // ---------------- FOAM
  ['foam_fountain', 'foam', 'foamFountain age .15 / .5 / 2.0 (out of a hat) · dir 0 crown', (t) => {
    let o = bgStage();
    const hat = (x) => `<g transform="translate(${x} 820)"><ellipse cx="0" cy="70" rx="110" ry="22" fill="#151515"/><path d="M-70 70 L-62 -10 H62 L70 70Z" fill="#26263A" stroke="#151515" stroke-width="8"/><ellipse cx="0" cy="-10" rx="62" ry="16" fill="#0C0C14" stroke="#151515" stroke-width="7"/><rect x="-66" y="40" width="132" height="16" fill="#C8183A"/></g>`;
    [[0.15, 1], [0.5, 1], [2, -1], [2, 0]].forEach(([a, d], i) => { const x = 330 + i * 420; o += hat(x) + R.foamFountain({ x, y: 812, s: 0.62, t, age: a, dir: d, h: 520, floorY: 895 }) + LBL(`age ${a} dir ${d}`, x, 1040, 28); });
    return o;
  }],
  ['foam_bits', 'foam', 'foamPile · foamBlobs on a head · foamSplash · foamSnowman · foamMustache', (t) => bgStage() + R.foamPile(330, 900, 460, 170, { t }) + hero(t, { x: 820, y: 900, s: 0.45, face: 'shocked' }) + R.foamBlobs(820, 470, 1.1, 1, 2, { t }) +
    R.foamSplash(1180, 760, 0.18) + R.foamSplash(1180, 760, 0.05, { seed: 3 }) + R.foamSnowman(1460, 900, 0.95, t) + `<rect x="1610" y="530" width="220" height="220" rx="30" fill="#FFFFFF" stroke="#151515" stroke-width="8"/><circle cx="1680" cy="610" r="12" fill="#151515"/><circle cx="1760" cy="610" r="12" fill="#151515"/>` + R.foamMustache(1720, 680, 0.9, t)],
  ['foam_principal', 'foam', 'big fountain dir -1 onto a character + piles (foam disco)', (t) => bgStage() + K.actor('principal', t, { x: 520, y: 900, s: 0.5, face: 'shocked' }) + `<rect x="1180" y="770" width="150" height="120" rx="10" fill="#5A3A8A" stroke="#151515" stroke-width="8"/>` + R.foamFountain({ x: 1255, y: 760, s: 1.0, t, age: 1.6, dir: -1, h: 420, floorY: 895 }) +
    R.foamPile(560, 905, 520, 200, { t, seed: 3 }) + R.foamBlobs(520, 430, 1.3, 1, 5, { t }) + R.foamMustache(520, 600, 0.5, t) + R.foamPile(1500, 905, 380, 130, { t, seed: 9 })],
  // ---------------- MOTION (fail -> respawn time strips)
  ['seq_standard', 'motion', 'respawnSeq preset standard (1.6 s): crumble -> RESPAWNING 3·2·1 -> pop on the pad', (t) => cropGrid([0.0, 0.08, 0.2, 0.35, 0.55, 0.8, 1.05, 1.28, 1.34, 1.45, 1.7, 2.4].map((u) => seqFrame(t + u, u, 'standard')), 4, [240, 0, 1440, 1080])],
  ['seq_fast', 'motion', 'respawnSeq preset fast (0.5 s) + corner preset', (t) => cropGrid([0, 0.08, 0.2, 0.3, 0.36, 0.6, 0.1, 0.4, 0.7, 0.95, 1.05, 1.4].map((u, i) => seqFrame(t + u, u, i < 6 ? 'fast' : 'corner')), 4, [240, 0, 1440, 1080])],
];
// overview sheet (concept/fx.png): one representative tile per family
const OVERVIEW = ['tip_moods', 'tip_cards', 'cp_states', 'crumble_strip', 'respawn_full', 'respawn_pop', 'menu_open', 'hud', 'win_sky', 'win_small', 'foam_fountain', 'confetti'];

// --perf: each effect alone on a flat frame -> median browser ms (minus the empty frame) + JS ms
const PERF_LIST = [
  ['tip (talking)', (t) => R.tip({ x: 960, y: 500, s: 1.5, t: 200.6 })],
  ['tip glitch 1', (t) => R.tip({ x: 960, y: 500, s: 1.5, t, glitch: 1 })],
  ['tip fade .6', (t) => R.tip({ x: 960, y: 500, s: 1.5, t, fade: 0.6 })],
  ['tipCard', (t) => R.tipCard(960, 500, 1, 'TIP: Carry the flag to move your checkpoint!', { t })],
  ['checkpoint saved', (t) => R.checkpoint({ x: 960, y: 900, s: 0.5, t })],
  ['checkpoint save .3', (t) => R.checkpoint({ x: 960, y: 900, s: 0.5, t, save: 0.3 })],
  ['flag plant .3', (t) => R.flag({ x: 960, y: 900, s: 0.5, t, plant: 0.3 })],
  ['crumble age .3', (t) => R.crumble({ x: 960, y: 900, s: 0.5, age: 0.3 })],
  ['respawnOverlay full', (t) => R.respawnOverlay(0.5, { t0: 0, dur: 1.2, reason: 'YOU FELL DOWN THE STAIRS' })],
  ['respawnPop age .1', (t) => R.respawnPop({ x: 960, y: 900, s: 0.5, age: 0.1 })],
  ['forcefield', (t) => R.forcefield({ x: 960, y: 900, s: 0.5, t })],
  ['escMenu open hl', (t) => R.escMenu({ x: 960, y: 480, t, hl: 'reset', press: 0.3 })],
  ['escMenu broken .5', (t) => R.escMenu({ x: 960, y: 480, t, broken: 0.5 })],
  ['counterHUD rolling', (t) => R.counterHUD({ value: 4816, roll: 0.5, from: 0, t })],
  ['savedToast', (t) => R.savedToast(80, 980, 0.8, { t })],
  ['sysWindow sky-size', (t) => R.sysWindow({ x: 960, y: 340, w: 1700, h: 600, theme: 'red', title: 'WARNING', lines: ['SAVE FILE CORRUPTED', 'Respawns used: 9,999'], t })],
  ['sysWindow glitch .8', (t) => R.sysWindow({ x: 960, y: 500, w: 1000, h: 480, theme: 'grey', title: 'DELETE SAVE?', lines: ['Delete the save file?'], buttons: ['YES', 'NO'], glitch: 0.8, t: 0.31 })],
  ['skyCrack k 1', (t) => R.skyCrack({ cx: 960, cy: 400, k: 1, t })],
  ['saveWave .2', (t) => R.saveWave(0.2)],
  ['loadingTexture 600x400', (t) => R.loadingTexture(600, 300, 600, 400, t)],
  ['foamFountain', (t) => R.foamFountain({ x: 960, y: 800, s: 1, t, age: 2, dir: 1, h: 500, floorY: 1000 })],
  ['foamPile', (t) => R.foamPile(960, 1000, 600, 220, { t })],
  ['foamSnowman', (t) => R.foamSnowman(960, 1000, 1, t)],
  ['blockConfetti 80', (t) => R.blockConfetti({ x: 960, y: 540, age: 0.6, n: 80 })],
  ['blockConfettiRain 60', (t) => R.blockConfettiRain(t, { n: 60 })],
  ['lightning k .3', (t) => R.lightning({ k: 0.3 })],
  ['rewind overlay', (t) => R.rewind(t, 1, { clock: 'MON 7:30 AM' })],
  ['hero (reference)', (t) => hero(t, { x: 960, y: 900 })],
  ['rgbSplit(hero)', (t) => R.rgbSplit(hero(t, { x: 960, y: 900 }), 1, { t })],
  ['glitchSlices(hero) k .9', (t) => R.glitchSlices(hero(t, { x: 960, y: 900 }), 0.31, 0.9, 3, { x: 700, y: 400, w: 520, h: 520 })],
  ['FULL: street+pad+hero+pop+field+tip+HUD+toast', (t) => bgStreet() + R.checkpoint({ x: 700, y: 900, s: 0.5, t, part: 'back' }) + R.respawnPop({ x: 700, y: 900, s: 0.5, age: 0.15, part: 'back' }) + hero(t, { x: 700, y: 900, ...R.popPose(0.15, 0.5) }) + R.checkpoint({ x: 700, y: 900, s: 0.5, t, part: 'front' }) + R.respawnPop({ x: 700, y: 900, s: 0.5, age: 0.15, part: 'front' }) + R.forcefield({ x: 700, y: 900, s: 0.5, t }) + R.tip({ x: 1000, y: 400, s: 1.2, t: 200.6 }) + R.counterHUD({ label: 'ATTEMPT', value: 57, t }) + R.savedToast(80, 980, 1, { t })],
  ['FULL: crumble under RESPAWNING overlay', (t) => bgStreet() + R.crumble({ x: 1100, y: 900, s: 0.5, age: 0.36 }) + R.respawnOverlay(0.6, { t0: 0, dur: 1.2, reason: 'YOU FELL DOWN THE STAIRS' })],
];

(async () => {
  let defs = '';
  try { defs = require('../scenes/main').STATIC_DEFS; } catch (e) { defs = require('../rig/style').DEFS + require('../rig/style').FRAME_DEFS + R.DEFS; }
  if (!defs.includes('rspGlowG')) defs += R.DEFS;
  const r = await openRenderer(1920, 1080, { staticDefs: defs });
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'fx-'));
  if (FULL) fs.mkdirSync(FULL, { recursive: true });
  const timeIt = async (svg) => { const ts = []; for (let i = 0; i < 3; i++) { const b = Date.now(); await r.render(svg, 'jpeg'); ts.push(Date.now() - b); } return ts.sort((x, y) => x - y)[1]; };
  const base = await timeIt('<rect width="1920" height="1080" fill="#888"/>');
  if (PERF) {
    const tm = async (svg) => { const ts = []; for (let i = 0; i < 7; i++) { const b = Date.now(); await r.render(svg, 'jpeg'); ts.push(Date.now() - b); } return ts.sort((x, y) => x - y)[3]; };
    const b0 = await tm('<rect width="1920" height="1080" fill="#888"/>');
    console.log('effect'.padEnd(46), 'elems'.padStart(6), 'js ms'.padStart(7), 'svg ms'.padStart(8), '   (empty frame', b0, 'ms)');
    for (const [name, fn] of PERF_LIST) {
      S.resetIds();
      const a = process.hrtime.bigint();
      let svg = '';
      for (let i = 0; i < 20; i++) { S.resetIds(); svg = fn(T0 + i * 0.033); }
      const js = Number(process.hrtime.bigint() - a) / 20 / 1e6;
      const rt = await tm('<rect width="1920" height="1080" fill="#888"/>' + svg);
      console.log(name.padEnd(46), String((svg.match(/<[a-zA-Z]/g) || []).length).padStart(6), js.toFixed(2).padStart(7), String(Math.max(0, rt - b0)).padStart(8));
    }
    await r.close();
    return;
  }
  const png = {};
  console.log('tile'.padEnd(20), 'elems'.padStart(6), 'js ms'.padStart(7), 'svg ms'.padStart(8));
  const want = TILES.filter(([key, sheet]) => (!ONLY || ONLY.some((o) => key.startsWith(o))) && (!SHEETS || SHEETS.includes(sheet) || (SHEETS.includes('overview') && OVERVIEW.includes(key))));
  for (const [key, , label, fn] of want) {
    S.resetIds();
    const a = Date.now();
    const svg = fn(T0);
    const js = Date.now() - a;
    const n = (svg.match(/<[a-zA-Z]/g) || []).length;
    const rt = await timeIt(svg);
    console.log(key.padEnd(20), String(n).padStart(6), String(js).padStart(7), String(Math.max(0, Math.round(rt - base))).padStart(8));
    if (FULL) fs.writeFileSync(path.join(FULL, key + '.png'), await r.render(svg));
    const lab = `<rect x="0" y="0" width="1920" height="64" fill="#000" opacity="0.66"/><text x="20" y="46" font-family="Fredoka" font-weight="700" font-size="38" fill="#FFE14D">${label.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</text>`;
    const p = path.join(tmp, key + '.png');
    fs.writeFileSync(p, await r.render(svg + lab));
    png[key] = p;
  }
  await r.close();
  const sheet = (keys, out, cols, tw, th) => {
    keys = keys.filter((k) => png[k]);
    if (!keys.length) return;
    const rows = Math.ceil(keys.length / cols);
    const ff = ['-v', 'error', '-y'];
    keys.forEach((k) => ff.push('-i', png[k]));
    let fc = keys.map((_, i) => `[${i}:v]scale=${tw}:${th}[s${i}];`).join('');
    const pad = rows * cols - keys.length;
    for (let i = 0; i < pad; i++) { ff.push('-f', 'lavfi', '-i', `color=c=black:s=${tw}x${th}`); fc += `[${keys.length + i}:v]null[s${keys.length + i}];`; }
    const n = rows * cols;
    if (n === 1) fc += '[s0]null'; else fc += Array.from({ length: n }, (_, i) => `[s${i}]`).join('') + `xstack=inputs=${n}:layout=` + Array.from({ length: n }, (_, i) => `${(i % cols) * tw}_${Math.floor(i / cols) * th}`).join('|');
    fs.mkdirSync(path.dirname(out), { recursive: true });
    execFileSync('ffmpeg', [...ff, '-filter_complex', fc, '-frames:v', '1', out]);
    console.log('wrote', out);
  };
  if (ONLY) sheet(Object.keys(png), OUT || path.join(os.tmpdir(), 'fx_only.png'), Math.min(2, Object.keys(png).length), 960, 540);
  else {
    for (const sh of ['tip', 'world', 'ui', 'lag', 'foam', 'motion']) {
      if (SHEETS && !SHEETS.includes(sh)) continue;
      sheet(TILES.filter((x) => x[1] === sh).map((x) => x[0]), path.join(CONCEPT, `fx_${sh}.png`), 2, 960, 540);
    }
    if (!SHEETS || SHEETS.includes('overview')) sheet(OVERVIEW, path.join(CONCEPT, 'fx.png'), 3, 640, 360);
  }
  fs.rmSync(tmp, { recursive: true, force: true });
})().catch((e) => { console.error(e); process.exit(1); });
