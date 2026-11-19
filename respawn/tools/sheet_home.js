// Contact sheet of the HOME + TOWN sets (scenes/sets_home.js) -> concept/sets_home.png
// Usage:
//   node tools/sheet_home.js                      all tiles -> concept/sets_home.png (3 columns, 640x360 tiles)
//   node tools/sheet_home.js --only kitchen,town  just those tiles (by key prefix)
//   node tools/sheet_home.js --full DIR           also write every tile as a full 1920x1080 PNG into DIR
//   node tools/sheet_home.js --noref              no hero on the FLOOR lines (default: the hero, s .5 or the set's scale, stands on each)
//   node tools/sheet_home.js --out FILE --t 2.3   output file / time
// Prints per tile: elements, JS build ms and browser render ms of the SET ALONE (all layers, no hero, minus an empty-frame
// baseline; median of 5) — the budget is < 90 ms build + render.
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const S = require('../rig/svg');
const { openRenderer } = require('./render');
const X = require('../scenes/sets_home');

const args = process.argv.slice(2);
const arg = (k) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : null; };
const ONLY = arg('--only') ? arg('--only').split(',') : null;
const FULL = arg('--full');
let REF = !args.includes('--noref');
const OUT = arg('--out') || path.join(__dirname, '..', 'concept', 'sets_home.png');
const T0 = Number(arg('--t') || 2.3);

// the hero (YOU) for scale: s .5 ~ 475 px tall
const R6 = require('../rig/r6');
const hero = R6.makeDraw(R6.makeDesign({ col: { jacket: '#D8262E', jacketLine: '#B01D24', shirt: '#F2D04A', shirtShade: '#D9B73A', pants: '#1F3B2A', pantsShade: '#162C1F' } }));
let refOn = true;
const line = (y, col = '#FF2E63') => `<path d="M-400 ${y} L2400 ${y}" stroke="${col}" stroke-width="3" stroke-dasharray="14 10" opacity="0.8"/>`;
const ref = (x, y, s = 0.5, pose = {}) => (REF && refOn ? hero({ x, y, s, shade: true, shadow: true, ...pose }) + line(y) : '');
const refOnly = (x, y, s = 0.5, pose = {}) => (REF && refOn ? hero({ x, y, s, shade: true, shadow: true, ...pose }) : '');
const mark = (x, y, col = '#FF2E63') => (REF && refOn ? `<circle cx="${x}" cy="${y}" r="9" fill="none" stroke="${col}" stroke-width="4"/><path d="M${x - 16} ${y} h32 M${x} ${y - 16} v32" stroke="${col}" stroke-width="3"/>` : '');
const bgCard = (c1 = '#2A2246', c2 = '#3E3366') => `<defs><linearGradient id="sheetBg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient></defs><rect x="0" y="0" width="1920" height="1080" fill="url(#sheetBg)"/>`;
// room set with things drawn between layers: (between = behind front furniture, after = on the floor)
const L = (fn, t, o, between = '', after = '') => { const l = fn.layers(t, o); return (l.bg || '') + (l.mid || '') + between + (l.front || '') + after + (l.fg || '') + (l.light || ''); };
// camera set: things on anchors between mid and fg
const LC = (fn, t, cam, o, between = '') => { const l = fn.layers(t, cam, o); return l.bg + l.mid + between + l.fg + l.light; };
const quad4 = (svgs) => svgs.map((v, i) => `<svg x="${(i % 2) * 960}" y="${Math.floor(i / 2) * 540}" width="960" height="540" viewBox="0 0 1920 1080">${v}</svg>`).join('') + '<path d="M960 0 V1080 M0 540 H1920" stroke="#000" stroke-width="6"/>';
const three = (svgs) => svgs.map((v, i) => `<svg x="${i * 640}" y="0" width="640" height="1080" viewBox="${i * 640} 0 640 1080">${v}</svg>`).join('') + '<path d="M640 0 V1080 M1280 0 V1080" stroke="#000" stroke-width="6"/>';
const SP = X.SPOTS, FL = X.FLOOR;
const has = (k) => typeof X[k] === 'function';

const TILES = [
  ['heroRoom', 'heroRoom · day', (t) => L(X.heroRoom, t, {}, '', ref(SP.heroRoom.checkpoint.x, FL.heroRoom) + mark(SP.heroRoom.bowl.x, SP.heroRoom.bowl.y) + mark(SP.heroRoom.checkpoint.x, SP.heroRoom.checkpoint.y, '#3DFF9A'))],
  ['heroRoom_morning', 'heroRoom · morning 7:30, mess 1, door .7', (t) => L(X.heroRoom, t, { time: 'morning', mess: 1, door: 0.7 }, '', ref(SP.heroRoom.door.exit.x, SP.heroRoom.door.exit.y, SP.heroRoom.door.exit.s, { view: 'back' }) + refOnly(700, FL.heroRoom, 0.5, { face: 'sleepy' }))],
  ['heroRoom_night', 'heroRoom · night 2:00, monitor = gameScreen, hero in chair', (t) => L(X.heroRoom, t, { time: 'night', clock: '2:00', monitor: has('gameScreen') ? X.gameScreen(t, {}) : undefined }, refOnly(SP.heroRoom.chair.x, SP.heroRoom.chair.seat + 300 * SP.heroRoom.chair.s, SP.heroRoom.chair.s, { view: 'back', legL: 90, legR: 90, kneeL: 90, kneeR: 90 }))],
  ['heroRoom_storm', 'heroRoom · night storm 1 + flash .8', (t) => L(X.heroRoom, t, { time: 'night', clock: '2:00', storm: 1, flash: 0.8, monitor: has('gameScreen') ? X.gameScreen(t, { jump: 0.6 }) : undefined }, '', ref(1000, FL.heroRoom, 0.5, { face: 'scared' }))],
  ['heroRoom_green', 'heroRoom · night, greenGlow 1 (checkpoint spot)', (t) => L(X.heroRoom, t, { time: 'night', clock: '2:00', storm: 0.6, greenGlow: 1, monitor: (w, h) => `<rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" fill="#3DFF9A"/>` }, '', ref(SP.heroRoom.checkpoint.x, SP.heroRoom.checkpoint.y, 0.5, { face: 'amazed' }))],
  ['heroRoom_sleep', 'heroRoom · night, asleep (SC12), redBlink .7', (t) => L(X.heroRoom, t, { time: 'night', sleep: true, redBlink: 0.7, lights: 0.6 }, refOnly(SP.heroRoom.bed.lie.x, SP.heroRoom.bed.lie.y, SP.heroRoom.bed.lie.s, { rot: SP.heroRoom.bed.lie.rot, face: 'sleepy' }))],
  ['deskClose', 'deskClose · night, gameScreen, hands area', (t) => L(X.deskClose, t, { time: 'night', storm: 0.7, monitor: has('gameScreen') ? X.gameScreen(t, {}) : undefined }, '', mark(SP.deskClose.hands.L.x, SP.deskClose.hands.L.y) + mark(SP.deskClose.hands.R.x, SP.deskClose.hands.R.y) + mark(SP.deskClose.bowl.x, SP.deskClose.bowl.y))],
  ['deskClose_day', 'deskClose · day (SC02), lava fall', (t) => L(X.deskClose, t, { time: 'day', monitor: has('gameScreen') ? X.gameScreen(t, { fall: 0.5, stage: 412 }) : undefined }, '', mark(SP.deskClose.bowl.x, SP.deskClose.bowl.y))],
  ['deskFace', 'deskFace · night storm, hero lit by the screen', (t) => L(X.deskFace, t, { time: 'night', storm: 1 }, refOnly(SP.deskFace.hero.x, SP.deskFace.hero.seat + 306 * SP.deskFace.hero.s, SP.deskFace.hero.s, { face: 'determined', legL: 90, legR: 90, kneeL: 90, kneeR: 90 }))],
  ['deskFace_green', 'deskFace · green glow / flash', (t) => quad4([L(X.deskFace, t, { time: 'night', greenGlow: 1 }, refOnly(SP.deskFace.hero.x, SP.deskFace.hero.seat + 306 * SP.deskFace.hero.s, SP.deskFace.hero.s, { face: 'shocked' })), L(X.deskFace, t, { time: 'night', flash: 1, storm: 1 }, refOnly(SP.deskFace.hero.x, SP.deskFace.hero.seat + 306 * SP.deskFace.hero.s, SP.deskFace.hero.s, { face: 'scared' })), L(X.deskFace, t, { time: 'day' }, refOnly(SP.deskFace.hero.x, SP.deskFace.hero.seat + 306 * SP.deskFace.hero.s, SP.deskFace.hero.s, { face: 'excited' })), L(X.deskFace, t, { time: 'night', redBlink: 1 })])],
  ['gameScreen', 'gameScreen · stage 999 / jump .5 / fall .6 / win 1', (t) => bgCard() + [{}, { jump: 0.5 }, { fall: 0.6, stage: 731 }, { win: 1, jump: 1 }].map((o, i) => `<g transform="translate(${480 + (i % 2) * 960} ${270 + Math.floor(i / 2) * 540})">${X.gameScreen(t, o)(900, 506)}</g>`).join('')],
  ['gameScreen_respawn', 'gameScreen · respawn .4 / .9 · small 400x240 / tall', (t) => bgCard() + `<g transform="translate(480 300)">${X.gameScreen(t, { respawn: 0.4 })(900, 506)}</g><g transform="translate(1440 300)">${X.gameScreen(t, { respawn: 0.9 })(900, 506)}</g><g transform="translate(500 820)">${X.gameScreen(t, {})(400, 240)}</g><g transform="translate(1300 820)">${X.gameScreen(t, { stage: 1 })(700, 400)}</g>`],
  ['obbyWorld', 'obbyWorld · cam x 0 (platforms + checkpoint)', (t) => LC(X.obbyWorld, t, { x: 0 }, {}, ref(SP.obbyWorld.start.x, SP.obbyWorld.start.y, 0.4))],
  ['obbyWorld_far', 'obbyWorld · cam x 3800 zoom .8, final flag, win .6', (t) => LC(X.obbyWorld, t, { x: 3800, zoom: 0.8 }, { win: 0.6 }, X.toScreen ? '' : '')],
  ['stairs', 'stairs · morning, skate on step 1', (t) => L(X.stairs, t, { skate: true }, '', SP.stairs.steps.map((p, i) => mark(p.x, p.y, i === SP.stairs.skate.step ? '#3DFF9A' : '#FF2E63')).join('') + refOnly(SP.stairs.landing.x, SP.stairs.landing.y, SP.stairs.s) + refOnly(SP.stairs.bottom.x, SP.stairs.bottom.y, SP.stairs.s, { face: 'dizzy' }))],
  ['stairs_tumble', 'stairs · hero mid-tumble (step 6), night', (t) => L(X.stairs, t, { time: 'night' }, '', refOnly(SP.stairs.steps[6].x, SP.stairs.steps[6].y, SP.stairs.s, { rot: 70, face: 'scream' }))],
  ['kitchen', 'kitchen · morning (Dad spot behind the island, Bea seat)', (t) => L(X.kitchen, t, {}, refOnly(SP.kitchen.dad.x, SP.kitchen.dad.y, SP.kitchen.dad.s, { face: 'happy' }) + refOnly(SP.kitchen.seats[0].x, SP.kitchen.seats[0].y, SP.kitchen.seats[0].s) + refOnly(SP.kitchen.seats[1].x, SP.kitchen.seats[1].y, SP.kitchen.seats[1].s), ref(860, FL.kitchen) + mark(SP.kitchen.pan.x, SP.kitchen.pan.y) + mark(SP.kitchen.panHang.x, SP.kitchen.panHang.y, '#3DFF9A'))],
  ['kitchen_eve', 'kitchen · evening dinner, coat gone', (t) => L(X.kitchen, t, { time: 'evening', coat: false }, refOnly(SP.kitchen.seats[2].x, SP.kitchen.seats[2].y, SP.kitchen.seats[2].s, { face: 'deadpan' }), ref(1500, FL.kitchen))],
  ['kitchen_lag', 'kitchen · glitch .8 / lowGfx .5 / lowGfx 1 / frozen birds', (t) => quad4([L(X.kitchen, t, { glitch: 0.8 }), L(X.kitchen, t, { lowGfx: 0.5 }), L(X.kitchen, t, { lowGfx: 1 }), L(X.kitchen, t, { frozen: 1, freezeAt: 1.3 })])],
  ['workshop', 'workshop · day (rehearsal table spot)', (t) => L(X.workshop, t, {}, '', ref(1280, FL.workshop) + mark(SP.workshop.table.x, SP.workshop.table.top) + mark(SP.workshop.hat.x, SP.workshop.hat.y, '#3DFF9A'))],
  ['workshop_boom', 'workshop · boom .5, soot 1 (SC02)', (t) => L(X.workshop, t, { boom: 0.5, soot: 1 }, '', ref(SP.workshop.scorch.x - 80, FL.workshop, 0.5, { face: 'joy' }))],
  ['workshop_poster', 'workshop · evening, poster, string lights', (t) => L(X.workshop, t, { time: 'evening', poster: true }, '', ref(700, FL.workshop))],
  ['workshop_quiet', 'workshop · quiet (sad beat)', (t) => L(X.workshop, t, { quiet: true, poster: true }, '', ref(960, FL.workshop, 0.5, { face: 'sad' }))],
  ['street', 'street · morning, cam x 0 (house, trampoline, fence)', (t) => LC(X.street, t, { x: 0 }, {}, ref(700, FL.street, SP.street.s) + refOnly(SP.street.trampoline.x, SP.street.trampoline.y, SP.street.trampoline.s))],
  ['street_hill', 'street · cam x -1300 zoom .85 (the hill + bump)', (t) => LC(X.street, t, { x: -1300, zoom: 0.85 }, {}, X.toScreen ? '' : '')],
  ['street_bus', 'street · day, cam x 2600, bus stop + bus + dog', (t) => LC(X.street, t, { x: 2600 }, { time: 'day', bus: SP.street.busStop.x - 300, dog: { x: 2900 } }, '')],
  ['street_low', 'street · lowGfx 0 / .35 / .7 / 1', (t) => quad4([0, 0.35, 0.7, 1].map((k) => LC(X.street, t, { x: 0 }, { lowGfx: k })))],
  ['street_red', 'street · sunset / red 1 + frozen', (t) => quad4([LC(X.street, t, { x: 0 }, { time: 'sunset' }), LC(X.street, t, { x: 0 }, { red: 1, frozen: 1 }), LC(X.street, t, { x: 800, zoom: 0.8 }, { time: 'day', dog: { x: 1300, through: true } }), LC(X.street, t, { x: 2200, zoom: 1.4, y: -200 }, { red: 0.5 })])],
  ['town', 'town · day (anchors: roofs, lamps, trees, bus roof)', (t) => LC(X.town, t, { x: 0 }, {}, [...SP.town.roofs.map((a) => X.toScreen({ x: 0 }, a)), ...SP.town.lamps.map((a) => X.toScreen({ x: 0 }, a)), ...SP.town.trees.map((a) => X.toScreen({ x: 0 }, a)), X.toScreen({ x: 0 }, SP.town.busRoof)].map((p) => mark(f(p.x), f(p.y))).join('') + ref(760, SP.town.street[0].y, SP.town.street[0].s))],
  ['town_golden', 'town · golden / sunset / night / lowGfx 1', (t) => quad4([LC(X.town, t, {}, { time: 'golden' }), LC(X.town, t, {}, { time: 'sunset' }), LC(X.town, t, {}, { time: 'night' }), LC(X.town, t, {}, { lowGfx: 1 })])],
  ['town_red', 'town · red 1 (corrupted Friday, skyWindow box)', (t) => LC(X.town, t, {}, { red: 1 }, (REF && refOn ? `<rect x="${SP.town.skyWindow.x - SP.town.skyWindow.w / 2}" y="${SP.town.skyWindow.y - SP.town.skyWindow.h / 2}" width="${SP.town.skyWindow.w}" height="${SP.town.skyWindow.h}" fill="none" stroke="#FFF" stroke-width="5" stroke-dasharray="20 12"/>` : '') + ref(960, SP.town.street[0].y, SP.town.street[0].s, { face: 'scared' }))],
  ['town_colorBack', 'town · colorBack .35 / .7 from the hero (red -> golden)', (t) => quad4([LC(X.town, t, {}, { red: 1, colorBack: 0.35, colorFrom: { x: 960, y: 800 } }), LC(X.town, t, {}, { red: 1, colorBack: 0.7, colorFrom: { x: 960, y: 800 } }), LC(X.town, t, { zoom: 1.6, x: 300, y: 150 }, { time: 'golden' }), LC(X.town, t, { zoom: 0.7 }, { frozen: 1, red: 0.6 })])],
  ['props', 'props · bus / dog / skateboard / pancake / clocks / birds', (t) => bgCard('#9FD8FF', '#DDF3FF') + X.schoolBus(520, 520, 0.9) + X.schoolBus(1400, 520, 0.6, undefined, { lowK: 1, flip: true }) + X.streetDog(300, 900, 1.2, undefined, { walk: t * 6 }) + X.streetDog(620, 900, 1.2, undefined, { lowK: 1 }) + X.skateboard(900, 900, 1.4) + X.pancake(1150, 860, 1.2) + X.wallClock(1350, 820, 70, '7:30') + X.wallClock(1550, 820, 70, '2:00') + X.bird(1720, 860, 2, undefined, {}) + X.bird(1800, 760, 2, undefined, { flying: true, flap: 0.3 })],
];

(async () => {
  const tiles = TILES.filter(([k]) => !ONLY || ONLY.some((o) => k.startsWith(o)));
  const r = await openRenderer(1920, 1080, { staticDefs: X.DEFS + require('../rig/style').DEFS });
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'shsheet-'));
  if (FULL) fs.mkdirSync(FULL, { recursive: true });
  const timeIt = async (svg) => { const ts = []; for (let i = 0; i < 5; i++) { const b = Date.now(); await r.render(svg, 'jpeg'); ts.push(Date.now() - b); } return ts.sort((x, y) => x - y)[2]; };
  const base = await timeIt('<rect width="1920" height="1080" fill="#888"/>');
  const files = [];
  console.log('tile'.padEnd(22), 'elems'.padStart(6), 'js ms'.padStart(7), 'svg ms'.padStart(8), 'total'.padStart(7));
  for (const [key, label, fn] of tiles) {
    let svg;
    try {
      // timing: the set alone (no hero / marks); JS = median of 3 builds
      refOn = false;
      const js = [];
      for (let i = 0; i < 3; i++) { S.resetIds(); const a = process.hrtime.bigint(); svg = fn(T0); js.push(Number(process.hrtime.bigint() - a) / 1e6); }
      js.sort((a, b) => a - b);
      const n = (svg.match(/<[a-zA-Z]/g) || []).length;
      const rt = Math.max(0, Math.round((await timeIt(svg)) - base));
      console.log(key.padEnd(22), String(n).padStart(6), js[1].toFixed(1).padStart(7), String(rt).padStart(8), String(Math.round(js[1] + rt)).padStart(7));
      refOn = true;
      S.resetIds();
      svg = fn(T0);
    } catch (e) {
      console.log(key.padEnd(22), 'ERROR', e.message.split('\n')[0]);
      svg = bgCard('#600', '#300') + `<text x="960" y="540" font-size="60" fill="#fff" text-anchor="middle">${key}: ${String(e.message).slice(0, 60).replace(/[<&]/g, '')}</text>`;
    }
    if (FULL) fs.writeFileSync(path.join(FULL, key + '.png'), await r.render(svg));
    const lab = `<rect x="0" y="0" width="1920" height="86" fill="#000" opacity="0.62"/><text x="24" y="62" font-family="Fredoka" font-weight="700" font-size="52" fill="#FFE14D">${label.replace(/&/g, '&amp;')}</text>`;
    const p = path.join(tmp, `t${String(files.length).padStart(3, '0')}.png`);
    fs.writeFileSync(p, await r.render(svg + lab));
    files.push(p);
  }
  await r.close();
  const cols = Math.min(3, files.length), rows = Math.ceil(files.length / cols);
  const ff = ['-v', 'error', '-y'];
  for (const p of files) ff.push('-i', p);
  let fc = files.map((_, i) => `[${i}:v]scale=640:360[s${i}];`).join('');
  const pad = rows * cols - files.length;
  for (let i = 0; i < pad; i++) { ff.push('-f', 'lavfi', '-i', 'color=c=black:s=640x360'); fc += `[${files.length + i}:v]null[s${files.length + i}];`; }
  const n = rows * cols;
  if (n === 1) fc += '[s0]null';
  else fc += Array.from({ length: n }, (_, i) => `[s${i}]`).join('') + `xstack=inputs=${n}:layout=` + Array.from({ length: n }, (_, i) => `${(i % cols) * 640}_${Math.floor(i / cols) * 360}`).join('|');
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  execFileSync('ffmpeg', [...ff, '-filter_complex', fc, '-frames:v', '1', OUT]);
  fs.rmSync(tmp, { recursive: true, force: true });
  console.log('wrote', OUT);
})().catch((e) => { console.error(e); process.exit(1); });

function f(n) { return Math.round(n * 10) / 10; }
