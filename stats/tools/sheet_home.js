// Contact sheet of the HOME + NEIGHBOURHOOD sets (scenes/sets_home.js) -> concept/sets_home.png
// Usage:
//   node tools/sheet_home.js                         all tiles -> concept/sets_home.png (3 columns, 640x360 tiles)
//   node tools/sheet_home.js --only kitchen,street   just those tiles (by key prefix)
//   node tools/sheet_home.js --full DIR              also write every tile as a full 1920x1080 PNG into DIR
//   node tools/sheet_home.js --noref                 no stand-ins / anchor marks
//   node tools/sheet_home.js --out FILE --t 2.3      output file / time
//   node tools/sheet_home.js --mod PATH              load the sets module from PATH instead of scenes/sets_home.js
// Prints per tile: elements, JS build ms and browser render ms of the SET ALONE (all layers, no characters, minus an
// empty-frame baseline; median of 5) — the budget is < 90 ms build + render.
// Stand-ins: YOU is the real hero rig (rig/r6, s .5 on each FLOOR line). Mom / Grandpa / Max / Biscuit / Mrs. Wells come
// from rig/cast.js when it already has them (draw.mom / draw.grandpa / draw.max / draw.biscuit), otherwise from simple r6
// look-alikes (sizes 1.04 / 1.12 / .62) and a box dog.
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const S = require('../rig/svg');
const { openRenderer } = require('./render');

const args = process.argv.slice(2);
const arg = (k) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : null; };
const ONLY = arg('--only') ? arg('--only').split(',') : null;
const FULL = arg('--full');
const REF = !args.includes('--noref');
const OUT = arg('--out') || path.join(__dirname, '..', 'concept', 'sets_home.png');
const T0 = Number(arg('--t') || 2.3);
const X = require(arg('--mod') ? path.resolve(arg('--mod')) : '../scenes/sets_home');

// ---------------------------------------------------------------- stand-ins
const R6 = require('../rig/r6');
const hero = R6.makeDraw(R6.makeDesign({ col: { jacket: '#D8262E', jacketLine: '#B01D24', shirt: '#F2D04A', shirtShade: '#D9B73A', pants: '#1F3B2A', pantsShade: '#162C1F' } }));
const look = (size, hair, col) => R6.makeDraw(R6.makeDesign({ size, hair, eyeStyle: 'dot', col }));
const FAM = {
  mom: { size: 1.04, draw: look(1.04, 'buns', { hair: '#8A3B22', hairShade: '#6A2A16', hairHi: '#B8603E', jacket: '#FF9EBB', jacketLine: '#D87A98', shirt: '#FFF6E6', shirtShade: '#EEE0C8', pants: '#4E4258', pantsShade: '#3E3448' }) },
  grandpa: { size: 1.12, draw: look(1.12, 'none', { jacket: '#C9A06A', jacketLine: '#A8804A', shirt: '#7A2E3A', shirtShade: '#5E222C', pants: '#5A6070', pantsShade: '#464C5A' }) },
  max: { size: 0.62, draw: look(0.62, 'spiky', { hair: '#6A3E22', hairShade: '#55311A', hairHi: '#8A5A36', jacket: '#5DB55A', jacketLine: '#3E8A4A', shirt: '#8FD67A', shirtShade: '#6FB85A', pants: '#5DB55A', pantsShade: '#3E8A4A' }) },
  wells: { size: 0.98, draw: look(0.98, 'buns', { hair: '#E8E8F0', hairShade: '#C9C9D8', hairHi: '#FFFFFF', jacket: '#B98AD8', jacketLine: '#9A6AB8', shirt: '#FFFFFF', shirtShade: '#E8E8F0', pants: '#7A6A9A', pantsShade: '#5E5080' }) },
};
let castDog = null;
try {
  const CAST = require('../rig/cast');
  if (CAST.NAMES && CAST.NAMES.max) for (const k of ['mom', 'grandpa', 'max']) if (CAST.draw[k]) FAM[k] = { size: (CAST.D && CAST.D[k] && CAST.D[k].dims && CAST.D[k].dims.size) || FAM[k].size, draw: CAST.draw[k] };
  if (CAST.draw.biscuit) castDog = CAST.draw.biscuit;
} catch (e) { /* cast not ready: keep the look-alikes */ }
const boxDog = (p) => `<g transform="translate(${p.x} ${p.y}) scale(${(p.s || 0.5) * 2})"><rect x="-70" y="-62" width="140" height="56" rx="26" fill="#E8A35A" stroke="#151515" stroke-width="5"/><rect x="40" y="-100" width="62" height="54" rx="18" fill="#E8A35A" stroke="#151515" stroke-width="5"/><circle cx="84" cy="-80" r="5" fill="#151515"/><path d="M-50 -6 v10 M50 -6 v10" stroke="#151515" stroke-width="10" stroke-linecap="round"/></g>`;
const dog = (p) => (castDog ? castDog(p) : boxDog(p));
let refOn = true;
const line = (y, col = '#FF2E63') => `<path d="M-400 ${y} L2400 ${y}" stroke="${col}" stroke-width="3" stroke-dasharray="14 10" opacity="0.8"/>`;
const ref = (x, y, s = 0.5, pose = {}) => (REF && refOn ? hero({ x, y, s, shade: true, shadow: true, ...pose }) + line(y) : '');
const refOnly = (x, y, s = 0.5, pose = {}) => (REF && refOn ? hero({ x, y, s, shade: true, shadow: true, ...pose }) : '');
const mark = (x, y, col = '#FF2E63') => (REF && refOn ? `<circle cx="${x}" cy="${y}" r="9" fill="none" stroke="${col}" stroke-width="4"/><path d="M${x - 16} ${y} h32 M${x} ${y - 16} v32" stroke="${col}" stroke-width="3"/>` : '');
const tip = (a, txt, col = '#3DE8FF') => (REF && refOn ? mark(a.x, a.y, col) + `<g transform="translate(${a.x} ${a.y - 40})"><rect x="-120" y="-30" width="240" height="44" rx="12" fill="#0E1A2E" opacity="0.85" stroke="${col}" stroke-width="3"/><text x="0" y="0" font-family="Fredoka" font-weight="700" font-size="26" fill="#FFFFFF" text-anchor="middle">${txt}</text></g>` : '');
const box = (b, col = '#3DFF9A') => (REF && refOn ? `<rect x="${b.cx - b.w / 2}" y="${b.cy - b.h / 2}" width="${b.w}" height="${b.h}" fill="none" stroke="${col}" stroke-width="5" stroke-dasharray="16 10"/>` : '');
// someone seated on a seat anchor (hips on spot.hip), legs hidden by the furniture front
const sit = (who, spot, pose = {}) => {
  if (!(REF && refOn)) return '';
  const p = X.seatPose(spot, who === 'you' ? 1 : FAM[who].size, { shade: true, shadow: false, ...pose });
  return who === 'you' ? hero(p) : FAM[who].draw(p);
};
const stand = (who, x, y, s, pose = {}) => (REF && refOn ? (who === 'you' ? hero : FAM[who].draw)({ x, y, s, shade: true, shadow: true, ...pose }) : '');
const bgCard = (c1 = '#2A2246', c2 = '#3E3366') => `<defs><linearGradient id="sheetBg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient></defs><rect x="0" y="0" width="1920" height="1080" fill="url(#sheetBg)"/>`;
// room set with things drawn between the layers: seated = behind the front furniture, after = on the floor
const L = (fn, t, o, seated = '', after = '') => { const l = fn.layers(t, o); return (l.bg || '') + (l.mid || '') + seated + (l.front || '') + after + (l.fg || '') + (l.light || ''); };
const LC = (fn, t, cam, o, between = '') => { const l = fn.layers(t, cam, o); return l.bg + l.mid + between + l.fg + l.light; };
const quad4 = (svgs) => svgs.map((v, i) => `<svg x="${(i % 2) * 960}" y="${Math.floor(i / 2) * 540}" width="960" height="540" viewBox="0 0 1920 1080">${v}</svg>`).join('') + '<path d="M960 0 V1080 M0 540 H1920" stroke="#000" stroke-width="6"/>';
const camG = (cam, svg) => `<g transform="${X.camTf(cam, 1)}">${svg}</g>`;
const SP = X.SPOTS, FL = X.FLOOR;
let EXR = null;
try { EXR = require('../rig/extras'); } catch (e) { EXR = null; }
const fortStandIn = (spot, k) => {
  if (!(REF && refOn)) return '';
  if (EXR && EXR.pillowFort) return EXR.pillowFort({ ...spot, k, t: T0 });
  const w = 750 * k + 120, h = 850 * k + 60;
  return `<rect x="${spot.x - w / 2}" y="${spot.y - h}" width="${w}" height="${h}" rx="30" fill="#FFE6A8" opacity="0.55" stroke="#FF2E63" stroke-width="5" stroke-dasharray="18 10"/><text x="${spot.x}" y="${spot.y - h / 2}" font-family="Lilita One" font-size="60" fill="#FF2E63" text-anchor="middle">pillowFort k ${k}</text>`;
};
const demoScreen = (label, bgc = '#2E6FD8') => (w, h) => `<rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" fill="${bgc}"/><rect x="${-w * 0.36}" y="${-h * 0.3}" width="${w * 0.72}" height="${h * 0.6}" rx="14" fill="#E9EDF3" stroke="#151515" stroke-width="5"/><rect x="${-w * 0.36}" y="${-h * 0.3}" width="${w * 0.72}" height="${h * 0.16}" rx="10" fill="#5A6478"/><text x="0" y="${h * 0.06}" font-family="Lilita One" font-size="${w * 0.07}" fill="#2A3140" text-anchor="middle">${label}</text><rect x="${-w * 0.14}" y="${h * 0.12}" width="${w * 0.28}" height="${h * 0.12}" rx="8" fill="#3BD16F" stroke="#151515" stroke-width="4"/>`;

// ---------------------------------------------------------------- tiles
const BS = SP.bedroom || {};
const bedLie = (p = {}) => (BS.bed ? refOnly(BS.bed.lie.x, BS.bed.lie.y, BS.bed.lie.s, { rot: BS.bed.lie.rot, shadow: false, face: 'sleepy', ...p }) : '');
const bedSitUp = (p = {}) => (BS.bed ? sit('you', BS.bed.sitUp, { face: 'amazed', armL: 40, armR: 40, ...p }) : '');
const inChair = (p = {}) => (BS.chair ? sit('you', BS.chair, { view: 'back', ...p }) : '');
const KS2 = SP.kitchen || {};
const kitFam = (f = {}) => (KS2.seats ? sit('max', KS2.seats.max, { face: f.max || 'excited', armL: 40 }) + sit('you', KS2.seats.you, { face: f.you || 'neutral' }) + sit('grandpa', KS2.seats.grandpa, { face: f.grandpa || 'happy', armR: 60 }) : '');
const LS2 = SP.livingRoom || {};
const SS = SP.street || {};
const TILES = [
  ['bedroom', 'bedroom · night (default): YOU in the chair (back view), title screen, glow', (t) => L(X.bedroom, t, {}, inChair())],
  ['bedroom_update', 'bedroom · night, pcScreen = UPDATE, pixels .45 (the install burst)', (t) => L(X.bedroom, t, { pcScreen: demoScreen('ACCEPT?'), pixels: 0.45 }, inChair())],
  ['bedroom_morning', 'bedroom · morning: sitUp in bed, ring .8, tooltips on bed / sock / alarm', (t) => L(X.bedroom, t, { time: 'morning', ring: 0.8, tuck: 0.6 }, bedSitUp(), tip(BS.tips.bed, 'COMFORT +50') + tip(BS.tips.sock, 'SMELL +99', '#7CFF6A') + tip(BS.tips.alarm, 'ENEMY', '#FF4D6D'))],
  ['bedroom_quad', 'bedroom · lie + tuck .9 / blackout .9 / day: mirror + bed edge / evening, chair front', (t) => quad4([
    L(X.bedroom, t, { tuck: 0.9 }, bedLie()),
    L(X.bedroom, t, { blackout: 0.9 }, inChair()),
    L(X.bedroom, t, { time: 'day', mirrorView: (w, h) => `<rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" fill="#9FD0E0"/>` + hero({ x: 0, y: h / 2 + 40, s: 0.42, face: 'confused' }) }, '', refOnly(BS.mirror.stand.x, BS.mirror.stand.y, BS.mirror.stand.s, { view: 'back' }) + sit('you', BS.bed.edge, { face: 'sleepy', armL: 20, armR: 20 }) + line(FL.bedroom)),
    L(X.bedroom, t, { time: 'evening', chair: 'front', lamp: 1 }, sit('you', BS.chair, { legL: 90, legR: 90, kneeL: 90, kneeR: 90, face: 'happy' }), ref(600, FL.bedroom))])],
  ['kitchen', 'kitchen · morning: Mom at the counter, Max / YOU / Grandpa seated, toast .35', (t) => L(X.kitchen, t, { toast: 0.35 }, kitFam(), stand('mom', KS2.counterStand.x, KS2.counterStand.y, KS2.counterStand.s, { face: 'happy', armL: 60, turn: 0.4 }) + ref(1760, FL.kitchen) + tip(KS2.toaster.tip, 'BURN 80%', '#FF4D6D'))],
  ['kitchen_mess', 'kitchen · morning, mess 1 (Max\'s cereal splash), cups 4', (t) => L(X.kitchen, t, { mess: 1, cups: 4 }, kitFam({ max: 'joy', you: 'amazed' }) + sit('mom', KS2.seats.mom, { face: 'happy' }))],
  ['kitchen_evening', 'kitchen · evening, dishes: Mom at the sink, lamp on', (t) => L(X.kitchen, t, { time: 'evening', dishes: true }, sit('grandpa', KS2.seats.grandpa, { face: 'sad' }), stand('mom', KS2.sinkStand.x, KS2.sinkStand.y, KS2.sinkStand.s, { view: 'back', armL: 50, armR: 50 }) + ref(1300, FL.kitchen, 0.5, { turn: -0.4 }))],
  ['kitchen_pancakes', 'kitchen · SC11 pancakes, cam x -260: YOU at the stove, Mom seated', (t) => camG({ x: -260 }, L(X.kitchen, t, { pancakes: true }, sit('mom', KS2.seats.mom, { face: 'happy' }), stand('you', KS2.stoveStand.x, KS2.stoveStand.y, KS2.stoveStand.s, { face: 'happy', turn: 0.5, armR: 80 })))],
  ['living', 'livingRoom · day: Grandpa in the recliner, Max on the rug, Biscuit on the bed, YOU on FLOOR', (t) => L(X.livingRoom, t, {}, LS2.seats ? sit('grandpa', LS2.seats.armchair, { face: 'happy' }) : '', (LS2.dogBed ? dog({ ...LS2.dogBed.dog }) : '') + (LS2.rugSit ? stand('max', LS2.rugSit.x, LS2.rugSit.y, LS2.rugSit.s, { face: 'excited', armR: 120 }) : '') + ref(900, FL.livingRoom) + tip({ x: SP.livingRoom.trophy.x, y: SP.livingRoom.trophy.y }, 'LEGEND', '#FFD23F'))],
  ['living_fort', 'livingRoom · day, fort .9 (cushions gone) + the fort spot (extras pillowFort k .9)', (t) => L(X.livingRoom, t, { fort: 0.9 }, '', fortStandIn(LS2.fort, 0.9) + stand('max', 1240, 1000, 0.5, { face: 'joy', armL: 150, armR: 150 }) + ref(400, FL.livingRoom))],
  ['living_evening', 'livingRoom · evening, lamps, the couch: Mom + YOU, TV on', (t) => L(X.livingRoom, t, { time: 'evening', tvScreen: demoScreen('TV', '#3A8A5A') }, sit('mom', LS2.seats.couchL, { face: 'sleepy' }) + sit('you', LS2.seats.couchM, { face: 'neutral' }) + sit('grandpa', LS2.seats.armchair, { face: 'sad' }), '')],
  ['street', 'street · day, cam x 0: Mrs. Wells at her gate + bags, the oak with the ball, YOU s .4', (t) => LC(X.street, t, {}, {}, SS.wells ? stand('wells', SS.wells.x, SS.wells.y, SS.wells.s, { face: 'happy', turn: 0.3 }) + ref(1300, FL.street, SS.s, { armR: 160, face: 'determined' }) + tip(SS.ball, 'QUEST +10 XP', '#FFD23F') : '')],
  ['street_sunset', 'street · sunset, cam x -1300: OUR HOUSE + the bakery van', (t) => LC(X.street, t, { x: -1300 }, { time: 'sunset' }, refOnly(-760 + 1300 - 1300 + 0, FL.street, SS.s))],
  ['street_quad', 'street · shop x 2800 / zoom .6 / ball false, zoom 1.6 / morning x -2600', (t) => quad4([LC(X.street, t, { x: 2800 }, {}, refOnly(3720, FL.street, SS.s)), LC(X.street, t, { zoom: 0.6, x: 300 }, {}), LC(X.street, t, { zoom: 1.6, x: 420, y: -60 }, { ball: false }), LC(X.street, t, { x: -2600 }, { time: 'morning' })])],
  ['exterior', 'houseExterior · night (the update night): YOUR window glowing blue', (t) => LC(X.houseExterior, t, {}, {}, refOnly(400, FL.houseExterior, 0.22))],
  ['exterior_update', 'houseExterior · night, update .45: flash + pixels out of the window', (t) => LC(X.houseExterior, t, {}, { update: 0.45 })],
  ['exterior_quad', 'houseExterior · morning / day zoom .6 / evening / night push-in window 2.4', (t) => quad4([LC(X.houseExterior, t, {}, { time: 'morning' }), LC(X.houseExterior, t, { zoom: 0.6 }, { time: 'day' }), LC(X.houseExterior, t, {}, { time: 'evening' }), LC(X.houseExterior, t, { zoom: 2.4, x: 210, y: -325 }, { update: 0.7 })])],
  ['cams', 'camera tips · monitor fill 4.8 / toaster 2.6 (toast .7) / the 1979 photo 3.2 / fort reveal .85 (fort 1)', (t) => quad4([
    camG({ zoom: 4.8, x: 365, y: -196 }, L(X.bedroom, t, { pcScreen: demoScreen('ACCEPT TERMS?') })),
    camG({ zoom: 2.6, x: -320, y: -60 }, L(X.kitchen, t, { toast: 0.7 })),
    camG({ zoom: 3.2, x: 612, y: -344 }, L(X.livingRoom, t, {})),
    camG({ zoom: 0.85, x: -100, y: -60 }, L(X.livingRoom, t, { fort: 1 }, '', fortStandIn(LS2.fort, 1)))])],
];

(async () => {
  const tiles = TILES.filter(([k]) => !ONLY || ONLY.some((o) => k.startsWith(o)));
  let EXD = '';
  try { EXD = require('../rig/extras').DEFS || ''; } catch (e) { EXD = ''; }
  const r = await openRenderer(1920, 1080, { staticDefs: X.DEFS + require('../rig/style').DEFS + EXD });
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'shsheet-'));
  if (FULL) fs.mkdirSync(FULL, { recursive: true });
  const timeIt = async (svg) => { const ts = []; for (let i = 0; i < 5; i++) { const b = Date.now(); await r.render(svg, 'jpeg'); ts.push(Date.now() - b); } return ts.sort((x, y) => x - y)[2]; };
  const base = await timeIt('<rect width="1920" height="1080" fill="#888"/>');
  const files = [];
  console.log('tile'.padEnd(24), 'elems'.padStart(6), 'js ms'.padStart(7), 'svg ms'.padStart(8), 'total'.padStart(7));
  for (const [key, label, fn] of tiles) {
    let svg;
    try {
      refOn = false;
      const js = [];
      for (let i = 0; i < 3; i++) { S.resetIds(); const a = process.hrtime.bigint(); svg = fn(T0); js.push(Number(process.hrtime.bigint() - a) / 1e6); }
      js.sort((a, b) => a - b);
      const n = (svg.match(/<[a-zA-Z]/g) || []).length;
      const rt = Math.max(0, Math.round((await timeIt(svg)) - base));
      console.log(key.padEnd(24), String(n).padStart(6), js[1].toFixed(1).padStart(7), String(rt).padStart(8), String(Math.round(js[1] + rt)).padStart(7));
      refOn = true;
      S.resetIds();
      svg = fn(T0);
    } catch (e) {
      console.log(key.padEnd(24), 'ERROR', e.stack.split('\n').slice(0, 3).join(' | '));
      svg = bgCard('#600', '#300') + `<text x="960" y="540" font-size="60" fill="#fff" text-anchor="middle">${key}: ${String(e.message).slice(0, 60).replace(/[<&]/g, '')}</text>`;
    }
    if (FULL) fs.writeFileSync(path.join(FULL, key + '.png'), await r.render(svg));
    const lab = `<rect x="0" y="0" width="1920" height="86" fill="#000" opacity="0.62"/><text x="24" y="62" font-family="Fredoka" font-weight="700" font-size="50" fill="#FFE14D">${label.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</text>`;
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
