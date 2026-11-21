// Contact sheet of the shared HOME + SCHOOL sets (scenes/sets.js) -> concept/sets_home.png
// Usage:
//   node tools/sets_sheet.js                      all tiles -> concept/sets_home.png (3 columns, 640x360 tiles)
//   node tools/sets_sheet.js --only kitchen,gym   just those tiles (by key prefix)
//   node tools/sets_sheet.js --full DIR           also write every tile as a full 1920x1080 PNG into DIR
//   node tools/sets_sheet.js --noref              no hero on the FLOOR lines (default: the hero, s .5, stands on each one)
//   node tools/sets_sheet.js --out FILE --t 2.3   output file / time
// Prints per-tile element counts, JS build time and browser render time (minus an empty-frame baseline).
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const S = require('../rig/svg');
const { openRenderer } = require('./render');
const X = require('../scenes/sets');

const args = process.argv.slice(2);
const arg = (k) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : null; };
const ONLY = arg('--only') ? arg('--only').split(',') : null;
const FULL = arg('--full');
const REF = !args.includes('--noref');
const OUT = arg('--out') || path.join(__dirname, '..', 'concept', 'sets_home.png');
const T0 = Number(arg('--t') || 2.3);

// the hero (YOU) for scale: s .5 ~ 475 px tall
const R6 = require('../rig/r6');
const hero = R6.makeDraw(R6.makeDesign({ col: { jacket: '#D8262E', jacketShade: '#B01D24', shirt: '#F2D04A', shirtShade: '#D9B73A', pants: '#1F3B2A', pantsShade: '#162C1F' } }));
const ref = (x, y, s = 0.5, pose = {}) => (REF ? hero({ x, y, s, shade: true, shadow: true, ...pose }) + `<path d="M0 ${y} L1920 ${y}" stroke="#FF2E63" stroke-width="3" stroke-dasharray="14 10" opacity="0.8"/>` : '');
const refOnly = (x, y, s = 0.5, pose = {}) => (REF ? hero({ x, y, s, shade: true, shadow: true, ...pose }) : '');
const bgCard = (c1 = '#2A2246', c2 = '#3E3366') => `<defs><linearGradient id="sheetBg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient></defs><rect x="0" y="0" width="1920" height="1080" fill="url(#sheetBg)"/>`;
const L = (fn, t, o, between = '', after = '') => { const l = fn.layers(t, o); return (l.bg || '') + (l.mid || '') + between + (l.front || '') + after + (l.fg || '') + (l.light || ''); };
const SP = X.SPOTS;
// four full frames in a 2x2 grid (nested <svg> clips each one)
const quad4 = (svgs) => svgs.map((v, i) => `<svg x="${(i % 2) * 960}" y="${Math.floor(i / 2) * 540}" width="960" height="540" viewBox="0 0 1920 1080">${v}</svg>`).join('') + '<path d="M960 0 V1080 M0 540 H1920" stroke="#000" stroke-width="6"/>';

const TILES = [
  ['heroRoom', 'heroRoom · day', (t) => L(X.heroRoom, t, {}, '', ref(760, X.FLOOR.heroRoom))],
  ['heroRoom_eve', 'heroRoom · evening, notes .6, laptop on desk', (t) => L(X.heroRoom, t, { time: 'evening', notes: 0.6, laptopAt: 'desk', laptopOff: true }, '', ref(1240, X.FLOOR.heroRoom, 0.5, { face: 'nervous' }))],
  ['heroRoom_night', 'heroRoom · night, laptop on bed, asleep, dust', (t) => L(X.heroRoom, t, { time: 'night', laptop: X.adminScreen(t, {}), floatDust: 1 }, refOnly(SP.heroRoom.bed.lie.x, SP.heroRoom.bed.lie.y, 0.5, { rot: 90, face: 'sleepy' }))],
  ['heroRoom_bonk', 'heroRoom · ceiling bonk line (night), bonk .3', (t) => L(X.heroRoom, t, { time: 'night', bonk: 0.3, laptop: X.adminScreen(t, { lines: ['Admin panel loaded.', 'Welcome... you.', ';fly me', 'Command accepted.'] }) }, '', ref(1400, SP.heroRoom.ceiling.heroFeet, 0.5, { face: 'oof', armL: 150, armR: 150 }))],
  ['kitchen', 'kitchen · day, one pancake', (t) => L(X.kitchen, t, {}, '', ref(SP.kitchen.stove.x, X.FLOOR.kitchen))],
  ['kitchen_speed', 'kitchen · pancakes 400, wind 1, notes 1', (t) => L(X.kitchen, t, { pancakes: 400, wind: 1, notes: 1 }, '', ref(700, X.FLOOR.kitchen, 0.5, { face: 'shocked', lean: 8 }))],
  ['kitchen_fridge', 'kitchen · fridge open .65, hero inside, pancakes 120', (t) => L(X.kitchen, t, { fridgeOpen: 0.65, pancakes: 120, time: 'evening' }, refOnly(SP.kitchen.fridge.inside.x, SP.kitchen.fridge.inside.y, SP.kitchen.fridge.inside.s), ref(1000, X.FLOOR.kitchen))],
  ['kitchen_fridge2', 'kitchen · fridge open 1, notes .4, night', (t) => L(X.kitchen, t, { fridgeOpen: 1, notes: 0.4, time: 'night' })],
  ['fridgeInside', 'fridgeInside · hero squeezed in', (t) => L(X.fridgeInside, t, {}, refOnly(SP.fridgeInside.hero.x, SP.fridgeInside.hero.y, 0.5, { face: 'happy' }))],
  ['fridgeInside_dark', 'fridgeInside · dark .85, cake .6', (t) => L(X.fridgeInside, t, { dark: 0.85, cake: 0.6 }, refOnly(SP.fridgeInside.hero.x, SP.fridgeInside.hero.y, 0.5, { face: 'smug' }))],
  ['livingRoom', 'livingRoom · day, call', (t) => L(X.livingRoom, t, {}, refOnly(SP.livingRoom.couch.seats[1].x, SP.livingRoom.couch.seats[1].y, 0.5), ref(560, X.FLOOR.livingRoom))],
  ['livingRoom_eve', 'livingRoom · evening, curtains 1, lying on couch', (t) => L(X.livingRoom, t, { time: 'evening', curtains: 1, call: false }, refOnly(SP.livingRoom.couch.lie.x, SP.livingRoom.couch.lie.y, 0.5, { rot: -90, face: 'sleepy' }))],
  ['livingRoom_night', 'livingRoom · night, tv, dad chair spot', (t) => L(X.livingRoom, t, { time: 'night', callOpts: { muted: 1 } }, refOnly(SP.livingRoom.dadChair.x, SP.livingRoom.dadChair.feet, 0.5, { view: 'side' }))],
  ['videoCall', 'videoCall · bored+muted / amazed+sky / small', (t) => bgCard('#33415E', '#22293D') + X.videoCall(560, 400, 960, 600, t, { muted: 1 }) + X.videoCall(1440, 640, 800, 500, t, { bossFace: 'amazed', mouth: 0.7, selfSky: true }) + X.videoCall(420, 900, 420, 260, t, { bossFace: 'confused' })],
  ['houseExterior', 'houseExterior · day (hero s .3 on the sidewalk)', (t) => X.houseExterior(t, {}) + ref(1000, X.FLOOR.houseExterior, 0.3) + refOnly(SP.houseExterior.door.x + 90, SP.houseExterior.door.y, SP.houseExterior.door.s)],
  ['houseExterior_lift', 'houseExterior · lift .7, tail, splash .35, evening', (t) => L(X.houseExterior, t, { lift: 0.7, tail: true, splash: 0.35, time: 'evening' })],
  ['houseExterior_night', 'houseExterior · night + house props', (t) => X.houseExterior(t, { time: 'night' }) + X.house(1500, 640, 0.3, { uprooted: 1, tilt: -8 })],
  ['street', 'street · morning, cam x 0, pigeon steal', (t) => X.street(t, { x: 0 }, { pigeon: { x: 1250, state: 'steal' } }) + ref(800, X.FLOOR.street)],
  ['street_far', 'street · cam x 2600 zoom 1.2, pigeon fly', (t) => X.street(t, { x: 2600, zoom: 1.2 }, { pigeon: { x: 3800, state: 'fly', lift: 160 } })],
  ['serverStreet', 'serverStreet · sign (cam x 0)', (t) => X.serverStreet(t, { x: 0 }) + ref(760, X.FLOOR.serverStreet, 0.5, { face: 'confused' })],
  ['serverStreet_sale', 'serverStreet · cam x 1900 (sale ahead) + sign close-up', (t) => X.serverStreet(t, { x: 1900 }) + X.streetSign(1700, 1500, 1.6, t, { flicker: 1 })],
  ['garageSale', 'garageSale · old man spot + hero', (t) => L(X.garageSale, t, {}, refOnly(SP.garageSale.oldman.x, SP.garageSale.oldman.y, SP.garageSale.oldman.s), ref(SP.garageSale.hero.x, X.FLOOR.garageSale))],
  ['garageSale_gone', 'garageSale · gone .3 / .6 / .85 / 1 + tumbleweed', (t) => quad4([L(X.garageSale, t, { gone: 0.3 }), L(X.garageSale, t, { gone: 0.6 }), L(X.garageSale, t, { gone: 0.85 }), L(X.garageSale, t, { gone: 1, tumble: 0.4 })])],
  ['cafeteria', 'cafeteria · line + lunch lady + seats', (t) => L(X.cafeteria, t, {}, refOnly(SP.cafeteria.lunchLady.x, SP.cafeteria.lunchLady.y, 0.5) + refOnly(SP.cafeteria.seats[1].x, SP.cafeteria.seats[1].y, SP.cafeteria.seats[1].s), ref(SP.cafeteria.line[0].x, SP.cafeteria.line[0].y, 0.5, { view: 'side', flip: true }) + refOnly(SP.cafeteria.line[1].x, SP.cafeteria.line[1].y, 0.5, { view: 'side', flip: true }))],
  ['cafeteria_jail', 'cafeteria · jail cage dropping (.55) / landed', (t) => L(X.cafeteria, t, {}, '', X.cage(1250, 990, 0.9, t, { part: 'back', drop: 1 }) + refOnly(1250, 990, 0.5, { face: 'angry' }) + X.cage(1250, 990, 0.9, t, { part: 'front', drop: 0.86 }) + X.cage(500, 990, 0.7, t, { drop: 0.55 }))],
  ['gym', 'gym · pick line + captain', (t) => L(X.gym, t, {}, SP.gym.pickLine.map((p, i) => i === 7 ? refOnly(p.x, p.y, p.s, { face: 'sad' }) : '').join(''), ref(SP.gym.captains[1].x, SP.gym.captains[1].y))],
  ['gym_mile', 'gym · scoreboard MILE 0:00.3', (t) => L(X.gym, t, { scoreboard: 'MILE 0:00.3' }, '', ref(960, X.FLOOR.gym, 0.5, { face: 'excited' }))],
  ['hallway', 'hallway · cam x 0', (t) => X.hallway(t, { x: 0 }) + ref(760, X.FLOOR.hallway) + refOnly(1200, 900, 0.42)],
  ['hallway_far', 'hallway · cam x 1800 zoom .9, door open', (t) => X.hallway(t, { x: 1800, zoom: 0.9 }, { doorOpen: 2 })],
  ['principalOffice', 'principalOffice · principal spot, hole 1', (t) => L(X.principalOffice, t, { hole: 1 }, refOnly(SP.principalOffice.principal.x, SP.principalOffice.principal.y, 0.5), ref(1360, X.FLOOR.principalOffice, 0.5, { face: 'nervous' }))],
  ['principalOffice_floor', 'principalOffice · hole .45 (cracks), floorHole 1', (t) => L(X.principalOffice, t, { hole: 0.45, floorHole: 1 })],
  ['classroom', 'classroom · math test, seats', (t) => L(X.classroom, t, {}, SP.classroom.seats.map((p) => refOnly(p.x, p.y, p.s)).join(''), ref(960, X.FLOOR.classroom, 0.5, { view: 'side' }))],
  ['schoolyard', 'schoolyard · dawn + Brick cage spot', (t) => L(X.schoolyard, t, {}, '', X.cage(SP.schoolyard.cage.x, SP.schoolyard.cage.y, SP.schoolyard.cage.s, t, { part: 'back' }) + refOnly(SP.schoolyard.cage.x, SP.schoolyard.cage.y, 0.5, { face: 'sad' }) + X.cage(SP.schoolyard.cage.x, SP.schoolyard.cage.y, SP.schoolyard.cage.s, t, { part: 'front' }) + ref(600, X.FLOOR.schoolyard))],
  ['schoolyard_sunset', 'schoolyard · sunset, gold cage vanish .5', (t) => L(X.schoolyard, t, { time: 'sunset' }) + X.cage(1150, 940, 0.9, t, { theme: 'gold', vanish: 0.5 })],
  ['cage', 'cage · green / gold, drop sequence', (t) => bgCard() + [0.3, 0.6, 0.72, 0.8, 1].map((d, i) => X.cage(220 + i * 370, 980, 0.5, t, { drop: d, theme: i % 2 ? 'gold' : 'green' })).join('')],
  ['newsStudio', 'newsStudio · calm + anchor + ticker', (t) => L(X.newsStudio, t, { ticker: 'THE CITY IS FLYING · GRANDMAS BREAKING THE SOUND BARRIER · A GIANT CAT IS SITTING ON THE MAYOR' }, refOnly(SP.newsStudio.anchor.x, SP.newsStudio.anchor.y, SP.newsStudio.anchor.s))],
  ['newsStudio_chaos', 'newsStudio · chaos 1 (paw on the glass)', (t) => L(X.newsStudio, t, { chaos: 1, ticker: 'BREAKING: WHO IS DOING THIS?' }, refOnly(SP.newsStudio.anchor.x, SP.newsStudio.anchor.y, SP.newsStudio.anchor.s, { face: 'scared' }))],
  ['laptop', 'laptop · open+glow / closed / back / admin help', (t) => bgCard() + X.laptop(470, 760, 1.05, X.adminScreen(t, { typed: ';help' }), { glow: 1, t }) + X.laptop(1150, 980, 0.62, '', { lid: 0, t }) + X.laptop(1560, 600, 0.62, '', { back: true, glow: 0.8, t }) + X.laptop(1150, 640, 0.55, X.adminScreen(t, { commands: true, battery: 3 }), { t })],
];

(async () => {
  const tiles = TILES.filter(([k]) => !ONLY || ONLY.some((o) => k.startsWith(o)));
  const r = await openRenderer(1920, 1080, { staticDefs: X.DEFS + require('../rig/style').DEFS });
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sets-'));
  if (FULL) fs.mkdirSync(FULL, { recursive: true });
  const timeIt = async (svg) => { const ts = []; for (let i = 0; i < 5; i++) { const b = Date.now(); await r.render(svg, 'jpeg'); ts.push(Date.now() - b); } return ts.sort((x, y) => x - y)[2]; };
  const base = await timeIt('<rect width="1920" height="1080" fill="#888"/>');
  const files = [];
  console.log('tile'.padEnd(24), 'elems'.padStart(6), 'js ms'.padStart(7), 'svg ms'.padStart(8));
  for (const [key, label, fn] of tiles) {
    S.resetIds();
    const a = Date.now();
    const svg = fn(T0);
    const js = Date.now() - a;
    const n = (svg.match(/<[a-zA-Z]/g) || []).length;
    const rt = await timeIt(svg);
    console.log(key.padEnd(24), String(n).padStart(6), String(js).padStart(7), String(Math.max(0, Math.round(rt - base))).padStart(8));
    if (FULL) fs.writeFileSync(path.join(FULL, key + '.png'), await r.render(svg));
    const lab = `<rect x="0" y="0" width="1920" height="86" fill="#000" opacity="0.62"/><text x="24" y="62" font-family="Fredoka" font-weight="700" font-size="52" fill="#FFE14D">${label}</text>`;
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
