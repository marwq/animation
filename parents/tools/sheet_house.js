// Contact sheet of the REAL-LIFE HOUSE sets (scenes/sets_house.js) -> concept/sets_house.png
// Usage:
//   node tools/sheet_house.js                        all tiles -> concept/sets_house.png (3 columns, 640x360 tiles)
//   node tools/sheet_house.js --only kitchen,living  just those tiles (by key prefix)
//   node tools/sheet_house.js --full DIR             also write every tile as a full 1920x1080 PNG into DIR
//   node tools/sheet_house.js --noref                no stand-ins (default: YOU s .5 on each FLOOR line + the family on their seats)
//   node tools/sheet_house.js --out FILE --t 2.3     output file / time
//   node tools/sheet_house.js --mod PATH             load the sets module from PATH instead of scenes/sets_house.js
// Prints per tile: elements, JS build ms and browser render ms of the SET ALONE (all layers, no characters, minus an
// empty-frame baseline; median of 5) — the budget is < 90 ms build + render.
// Stand-ins: YOU is the real hero rig (rig/r6). Dad / Mom / Granny come from rig/cast.js when it already has them
// (draw.dad / draw.mom / draw.grandma of THIS video), otherwise from simple r6 look-alikes (sizes 1.12 / 1.06 / 1.0).
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
const OUT = arg('--out') || path.join(__dirname, '..', 'concept', 'sets_house.png');
const T0 = Number(arg('--t') || 2.3);
const X = require(arg('--mod') ? path.resolve(arg('--mod')) : '../scenes/sets_house');

// ---------------------------------------------------------------- stand-ins
const R6 = require('../rig/r6');
const hero = R6.makeDraw(R6.makeDesign({ col: { jacket: '#D8262E', jacketLine: '#B01D24', shirt: '#F2D04A', shirtShade: '#D9B73A', pants: '#1F3B2A', pantsShade: '#162C1F' } }));
const look = (size, hair, col) => R6.makeDraw(R6.makeDesign({ size, hair, eyeStyle: 'dot', col }));
const FAM = {
  dad: { size: 1.12, draw: look(1.12, 'quiff', { hair: '#6A3E22', hairShade: '#55311A', hairHi: '#8A5A36', jacket: '#B98A5A', jacketLine: '#9A6E42', shirt: '#EDE2CC', shirtShade: '#D8CCB2', pants: '#4A5068', pantsShade: '#3A3F55' }) },
  mom: { size: 1.06, draw: look(1.06, 'buns', { hair: '#8A3E1E', hairShade: '#6E3016', hairHi: '#A85A36', jacket: '#B07AD8', jacketLine: '#9060B8', shirt: '#FFF6E4', shirtShade: '#EEE0C8', pants: '#3A3F55', pantsShade: '#2E3246' }) },
  grandma: { size: 1.0, draw: look(1.0, 'buns', { hair: '#DCDCE6', hairShade: '#BFC0CC', hairHi: '#FFFFFF', jacket: '#7FBFA8', jacketLine: '#5E9E88', shirt: '#FFFFFF', shirtShade: '#E8E8F0', pants: '#8A6A9A', pantsShade: '#6E5480' }) },
};
try {
  const CAST = require('../rig/cast');
  if (CAST.NAMES && CAST.NAMES.grandma) for (const k of ['dad', 'mom', 'grandma']) if (CAST.draw[k]) FAM[k] = { size: (CAST.D && CAST.D[k] && CAST.D[k].dims && CAST.D[k].dims.size) || FAM[k].size, draw: CAST.draw[k] };
} catch (e) { /* cast not ready: keep the look-alikes */ }
let refOn = true;
const line = (y, col = '#FF2E63') => `<path d="M-400 ${y} L2400 ${y}" stroke="${col}" stroke-width="3" stroke-dasharray="14 10" opacity="0.8"/>`;
const ref = (x, y, s = 0.5, pose = {}) => (REF && refOn ? hero({ x, y, s, shade: true, shadow: true, ...pose }) + line(y) : '');
const refOnly = (x, y, s = 0.5, pose = {}) => (REF && refOn ? hero({ x, y, s, shade: true, shadow: true, ...pose }) : '');
const mark = (x, y, col = '#FF2E63') => (REF && refOn ? `<circle cx="${x}" cy="${y}" r="9" fill="none" stroke="${col}" stroke-width="4"/><path d="M${x - 16} ${y} h32 M${x} ${y - 16} v32" stroke="${col}" stroke-width="3"/>` : '');
const box = (b, col = '#3DFF9A') => (REF && refOn ? `<rect x="${b.cx - b.w / 2}" y="${b.cy - b.h / 2}" width="${b.w}" height="${b.h}" fill="none" stroke="${col}" stroke-width="5" stroke-dasharray="16 10"/>` : '');
// someone seated on a seat anchor (hips on spot.hip), legs hidden by the furniture front
const sit = (who, spot, pose = {}) => {
  if (!(REF && refOn)) return '';
  const p = X.seatPose(spot, who === 'you' ? 1 : FAM[who].size, { shade: true, shadow: false, ...pose });
  return who === 'you' ? hero(p) : FAM[who].draw(p);
};
const stand = (who, x, y, s, pose = {}) => (REF && refOn ? (who === 'you' ? hero : FAM[who].draw)({ x, y, s, shade: true, shadow: true, ...pose }) : '');
const bgCard = (c1 = '#2A2246', c2 = '#3E3366') => `<defs><linearGradient id="sheetBg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient></defs><rect x="0" y="0" width="1920" height="1080" fill="url(#sheetBg)"/>`;
// room set with things drawn between the layers: (seated = behind the front furniture, lap = after front, after = on the floor)
const L = (fn, t, o, seated = '', after = '', lap = '') => { const l = fn.layers(t, o); return (l.bg || '') + (l.mid || '') + seated + (l.front || '') + lap + (l.table || '') + after + (l.fg || '') + (l.light || ''); };
const LC = (fn, t, cam, o, between = '') => { const l = fn.layers(t, cam, o); return l.bg + l.mid + between + l.fg + l.light; };
const quad4 = (svgs) => svgs.map((v, i) => `<svg x="${(i % 2) * 960}" y="${Math.floor(i / 2) * 540}" width="960" height="540" viewBox="0 0 1920 1080">${v}</svg>`).join('') + '<path d="M960 0 V1080 M0 540 H1920" stroke="#000" stroke-width="6"/>';
const camG = (cam, svg) => `<g transform="${X.camTf(cam, 1)}">${svg}</g>`;
const SP = X.SPOTS, FL = X.FLOOR;
const has = (k) => typeof X[k] === 'function';

// ---------------------------------------------------------------- tiles
const KS = SP.kitchen ? SP.kitchen.seats : null;
const kitFam = (o = {}) => sit('dad', KS.dad, { face: o.dadFace || 'happy' }) + sit('mom', KS.mom, { face: 'smallSmile', armL: 30 }) + sit('grandma', KS.grandma, { face: 'happy' }) + (o.noYou ? '' : sit('you', KS.you, { face: o.youFace || 'neutral' }));
const LS = SP.livingRoom;
// stand-in devices (rig/extras.js will have the real ones): laptop lid back, tablet back, phone back
const devs = () => (REF && refOn && LS ? (() => {
  const d = LS.devices;
  let o = `<g transform="translate(${d.laptop.x} ${d.laptop.y}) scale(${d.laptop.s * 2})"><path d="M-80 0 L-70 -110 L70 -110 L80 0 Z" fill="#B9BCC4" stroke="#151515" stroke-width="5" stroke-linejoin="round"/><circle cx="0" cy="-56" r="16" fill="#F2B84B" stroke="#151515" stroke-width="3"/></g>`;
  o += `<g transform="translate(${d.tablet.x} ${d.tablet.y}) scale(${d.tablet.s * 2})"><rect x="-55" y="-40" width="110" height="80" rx="10" fill="#E86A8A" stroke="#151515" stroke-width="5"/></g>`;
  o += `<g transform="translate(${d.phone.x} ${d.phone.y}) scale(${d.phone.s * 2})"><rect x="-18" y="-34" width="36" height="68" rx="7" fill="#3A3F52" stroke="#151515" stroke-width="4"/></g>`;
  return o + box(d.pc.screen) + box({ cx: LS.tv.cx, cy: LS.tv.cy, w: LS.tv.w, h: LS.tv.h }, '#33D6FF');
})() : '');
const demoScreen = (label) => (w, h) => `<rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" fill="#4FB0F0"/><rect x="${-w / 2}" y="${h * 0.15}" width="${w}" height="${h * 0.35}" fill="#5DC85A"/><rect x="${-w * 0.2}" y="${-h * 0.1}" width="${w * 0.12}" height="${h * 0.25}" fill="#E87A3A" stroke="#151515" stroke-width="3"/><text x="0" y="${-h * 0.25}" font-family="Lilita One" font-size="${w * 0.12}" fill="#FFE14D" text-anchor="middle" stroke="#151515" stroke-width="4" paint-order="stroke">${label}</text>`;
const livFam = () => LS ? sit('you', LS.seats.you, { view: 'back' }) + sit('dad', LS.seats.dad, { face: 'confused', armL: 40, armR: 40 }) + sit('mom', LS.seats.mom, { face: 'smallSmile', armL: 30, armR: 30 }) + sit('grandma', LS.seats.grandma, { face: 'happy', armL: 100 }) : '';
const livSleep = () => LS ? sit('grandma', LS.asleep.grandma, { face: 'sleepy', rot: LS.asleep.grandma.rot }) + sit('dad', LS.asleep.dad, { face: 'sleepy', rot: LS.asleep.dad.rot }) + sit('mom', LS.asleep.mom, { face: 'sleepy', rot: LS.asleep.mom.rot }) : '';
const BS = SP.bedroom;
const bedLie = (p = {}) => (BS ? refOnly(BS.bed.lie.x, BS.bed.lie.y, BS.bed.lie.s, { view: 'back', rot: BS.bed.lie.rot, shadow: false, ...p }) : '');
const bedSit = (face = 'sad') => (BS ? sit('dad', BS.bed.sit, { face, armL: 20, armR: 30 }) : '');
const TILES = [
  ['kitchen', 'kitchen · morning, the family seated (seatPose), YOU on FLOOR', (t) => L(X.kitchen, t, {}, kitFam(), ref(1700, FL.kitchen, 0.5))],
  ['kitchen_meeting', 'kitchen · meeting (bunting + Dad\'s pie chart), presenter spot', (t) => L(X.kitchen, t, { meeting: true }, kitFam({ youFace: 'shocked' }), stand('dad', SP.kitchen.presenter.x, SP.kitchen.presenter.y, SP.kitchen.presenter.s, { face: 'excited', armR: 120 }))],
  ['kitchen_next', 'kitchen · next Saturday (SC12): YOU at the head, day', (t) => L(X.kitchen, t, { next: true, time: 'day' }, kitFam({ noYou: true }) + stand('you', SP.kitchen.head.x, SP.kitchen.head.y, SP.kitchen.head.s, { face: 'joy', armL: 150 }))],
  ['kitchen_bare', 'kitchen · set alone (no stand-ins), day, no paper/tablet', (t) => { const r = refOn; refOn = false; const s = L(X.kitchen, t, { time: 'day', paper: false, tablet: false }); refOn = r; return s; }],
  ['living', 'livingRoom · evening, the family on their seats + device spots (boxes)', (t) => L(X.livingRoom, t, {}, livFam(), '', devs())],
  ['living_night', 'livingRoom · night, glow "all", tvScreen + pcScreen = game', (t) => L(X.livingRoom, t, { time: 'night', glow: 'all', tvScreen: demoScreen('TV'), pcScreen: demoScreen('PC') }, livFam(), '', devs())],
  ['living_asleep', 'livingRoom · asleep (SC12), blanket .8, YOU covering Dad', (t) => L(X.livingRoom, t, { asleep: true, blanket: 0.8 }, livSleep(), stand('you', LS.asleep.you.x, LS.asleep.you.y, LS.asleep.you.s, { face: 'happy', armR: 60, turn: 0.4 }))],
  ['living_mess', 'livingRoom · night, mess 1, chair front (YOU face camera), tea', (t) => L(X.livingRoom, t, { time: 'night', mess: 1, chair: 'front', tea: true, glow: X.deviceGlows(['you', 'dad', 'mom']) }, sit('you', LS.seats.you, { legL: 90, legR: 90, kneeL: 90, kneeR: 90, face: 'angry' }) + sit('dad', LS.seats.dad, { face: 'shocked' }) + sit('mom', LS.seats.mom, { face: 'sad' }), stand('grandma', 1720, LS.front.y, 0.5, { face: 'sad' }))],
  ['living_quad', 'livingRoom · midnight / evening lamp 0 / night no TV / boardGame', (t) => quad4([L(X.livingRoom, t, { time: 'midnight', glow: 'all' }, livFam()), L(X.livingRoom, t, { lamp: 0, boardGame: true }), L(X.livingRoom, t, { time: 'night', tv: false, glow: X.deviceGlows(['dad']) }, livFam()), L(X.livingRoom, t, { time: 'night', tvScreen: demoScreen('VICTORY'), asleep: true })])],
  ['bedroom', 'bedroom · night, lamp 1: YOU lie facing the wall, Dad on the bed edge', (t) => L(X.bedroom, t, {}, bedLie(), '', bedSit('sad'))],
  ['bedroom_alarm', 'bedroom · alarm .9 (11 p.m. — the PC flashes red)', (t) => L(X.bedroom, t, { alarm: 0.9, clock: '11:00' }, bedLie({ rot: -80 }), '', bedSit('shocked'))],
  ['bedroom_door', 'bedroom · evening, door .9 (hall light), Dad at the door exit', (t) => L(X.bedroom, t, { time: 'evening', door: 0.9, lamp: 1 }, bedLie(), stand('dad', BS.door.exit.x, BS.door.exit.y, BS.door.exit.s, { face: 'sad', turn: -0.4 }))],
  ['bedroom_quad', 'bedroom · day / tuck 1 / alarm 1 empty / night lamp 0 + monitor', (t) => quad4([L(X.bedroom, t, { time: 'day' }, '', ref(1180, FL.bedroom, 0.5)), L(X.bedroom, t, { tuck: 1 }, bedLie()), L(X.bedroom, t, { alarm: 1 }), L(X.bedroom, t, { lamp: 0, monitor: demoScreen('CUBE CITY') })])],
  ['stairs', 'stairs · night 11 p.m., heroDoor 1 (red alarm light), YOU running down step 5', (t) => L(X.stairs, t, { heroDoor: 1 }, '', SP.stairs.steps.map((p, i) => mark(p.x, p.y, '#FF2E63')).join('') + refOnly(SP.stairs.steps[5].x, SP.stairs.steps[5].y, SP.stairs.s, { view: 'side', legL: 40, legR: -30, kneeL: 20, kneeR: 60, armL: 50, armR: -40, face: 'determined', lean: -8 }) + refOnly(SP.stairs.landing.x, SP.stairs.landing.y, SP.stairs.s, { view: 'side' }))],
  ['stairs_eve', 'stairs · evening, lights on, YOU at the bottom (FLOOR) + the arch', (t) => L(X.stairs, t, { time: 'evening' }, '', ref(SP.stairs.bottom.x + 200, FL.stairs, SP.stairs.s) + mark(SP.stairs.arch.enter.x, SP.stairs.arch.enter.y, '#3DFF9A'))],
  ['stairs_day', 'stairs · day / night tvGlow 0 + door closed', (t) => quad4([L(X.stairs, t, { time: 'day' }), L(X.stairs, t, { tvGlow: 0 }), L(X.stairs, t, { heroDoor: 0.6, heroLight: 'warm', time: 'evening' }), L(X.stairs, t, { heroDoor: 1, heroLight: 'blue' })])],
];

(async () => {
  const tiles = TILES.filter(([k]) => !ONLY || ONLY.some((o) => k.startsWith(o)));
  let EXD = '';
  try { EXD = require('../rig/extras').DEFS || ''; } catch (e) { EXD = ''; }
  const r = await openRenderer(1920, 1080, { staticDefs: X.DEFS + require('../rig/style').DEFS + EXD });
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'hssheet-'));
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
