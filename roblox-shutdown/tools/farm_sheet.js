// Contact sheet for the shared ROAD + SERVER FARM sets (scenes/farm.js).
// Usage: node tools/farm_sheet.js [filter] [--dir <folder for full-size tiles>] [--out sheet.png] [--time]
//   writes concept/sets_farm.png (3 columns of 640x360 tiles, labelled); --time prints render ms + element counts.
'use strict';
const fs = require('fs');
const path = require('path');
const S = require('../rig/svg');
const ST = require('../rig/style');
const { openRenderer } = require('./render');
const K = require('../scenes/kit');
const F = require('../scenes/farm');

const args = process.argv.slice(2);
const dirIdx = args.indexOf('--dir');
const DIR = dirIdx >= 0 ? args[dirIdx + 1] : null;
const TIME = args.includes('--time');
const outIdx = args.indexOf('--out');
const OUT = outIdx >= 0 ? args[outIdx + 1] : null;
const filter = args.find((a, i) => !a.startsWith('--') && args[i - 1] !== '--dir' && args[i - 1] !== '--out');

// scale reference: a rig character if the cast is available, else a flat silhouette
function ref(x, y, s, pose = {}) {
  try {
    const d = K.draw.dad || Object.values(K.draw)[0];
    return d({ x, y, s, shade: false, shadow: true, face: 'happy', ...pose });
  } catch (e) {
    return S.g(S.rect(-100, -540, 200, 240, 20, { fill: '#FFB000' }) + S.rect(-140, -950, 280, 380, 50, { fill: '#FFD84D' }) + S.rect(-90, -300, 180, 300, 10, { fill: '#3B7BE8' }), `translate(${x} ${y}) scale(${s})`);
  }
}
const floorLine = (y, label) => S.path(`M0 ${y} L1920 ${y}`, { stroke: '#FF00FF', 'stroke-width': 3, 'stroke-dasharray': '16 10', opacity: 0.8 }) + S.el('text', { x: 12, y: y - 8, 'font-family': 'Fredoka', 'font-weight': 700, 'font-size': 24, fill: '#FF00FF' }, label);
const cam0 = { zoom: 1, x: 0, y: 0 };
const occ = (s, face = 'happy') => ref(0, 0, s, { face, turn: 0.3 });

const TILES = [
  ['road · dawn · van driving', (t) => {
    const cam = { zoom: 1, x: 0, y: 0 };
    const L = F.desertRoad(t, cam, { time: 0.05, speed: 900 });
    const v = F.van(900, F.ROAD.near, 0.62, t, { bounce: 0.6, wheelSpin: t * 900, smoke: 0.7, dust: 0.6, lights: 0.8, windows: [occ(0.36), occ(0.36, 'excited'), ''] });
    return L.bg + L.mid + K.view(cam, v, 1) + L.fg + L.light;
  }],
  ['road · day · lag .8 (clouds, birds, truck) + cow', (t) => {
    const cam = { zoom: 1, x: 0, y: 0 };
    const L = F.desertRoad(t, cam, { time: 0.85, speed: 300, lag: 0.8 });
    const v = F.van(560, F.ROAD.near, 0.55, t, { bounce: 0.3, wheelSpin: t * 400, lagK: 0.7, windows: [occ(0.36), '', occ(0.36, 'scared')] });
    return L.bg + K.view(cam, F.cow(1500, F.ROAD.shoulderFar, 0.42, t, { load: 0.55 }), 1) + L.mid + K.view(cam, v, 1) + L.fg + L.light;
  }],
  ['cow load 0 · .3 · .6 · .8 · 1 (moo)', (t) => {
    const cam = { zoom: 1, x: 0, y: 0 };
    const L = F.desertRoad(t, cam, { time: 0.7, fg: false });
    let o = '';
    [0.1, 0.3, 0.6, 0.8, 1].forEach((k, i) => { o += F.cow(200 + i * 380, 900, 0.62, t, { load: k, moo: i === 4 ? 1 : 0 }); });
    return L.bg + L.mid + o;
  }],
  ['van front · side (clear) · truck', (t) => {
    const L = F.desertRoad(t, cam0, { time: 0.4, fg: false });
    return L.bg + L.mid + F.van(420, 960, 0.85, t, { front: true, windows: [occ(0.36), occ(0.36, 'excited')], lights: 0.5 }) + F.van(1300, 900, 0.62, t, {}) + F.truck(1500, 610, 0.4, t, {});
  }],
  ['gasStation (floor 905, cashier slot)', (t) => {
    const c = F.GAS.cashier;
    const L = F.gasStation(t, { inside: ref(c.x, c.y, c.s, { face: { name: 'neutral', mouth: 'O' } }), slushJerk: 1 });
    return L.bg + ref(1700, F.GAS.floor, 0.32) + F.van(560, 960, 0.5, t, { flip: true }) + L.fg + L.light + floorLine(F.GAS.floor, 'GAS.floor');
  }],
  ['gasStationInside (cashier between bg/fg)', (t) => {
    const c = F.GASIN.cashier;
    const L = F.gasStationInside(t, { slushJerk: 1, coffee: 1, lag: 1 });
    return L.bg + ref(c.x, c.y, c.s, { face: { name: 'neutral', mouth: 'O' } }) + L.fg + L.light + ref(1820, 1260, 0.62, { view: 'side' });
  }],
  ['vanInterior fwd (GPS, slots)', (t) => {
    const S0 = F.VANIN.fwd;
    const L = F.vanInterior(t, { gps: 'RECALCULATING...', gpsLag: 1, time: 0.3, speed: 1.5 });
    return L.bg + ref(S0.driver.x, S0.driver.y, S0.driver.s, { view: 'back' }) + ref(S0.passenger.x, S0.passenger.y, S0.passenger.s, { turn: -0.4 }) + L.fg + L.light + floorLine(S0.seatTop, 'VANIN.fwd.seatTop');
  }],
  ['vanInterior rear (bench + front seats)', (t) => {
    const S0 = F.VANIN.rear;
    const L = F.vanInterior(t, { view: 'rear', time: 0.5 });
    return L.bg + ref(S0.dex.x, S0.dex.y, S0.dex.s) + ref(S0.pip.x, S0.pip.y, S0.pip.s) + L.mid + ref(S0.driver.x, S0.driver.y, S0.driver.s) + ref(S0.passenger.x, S0.passenger.y, S0.passenger.s) + L.fg + L.light;
  }],
  ['farmExterior · storm .8 (SC 07)', (t) => {
    const L = F.farmExterior(t, { storm: 0.8, doorScreen: 'KEY EXPIRED: 1998' });
    return L.bg + ref(900, F.FARM.floor, 0.12) + ref(1000, F.FARM.floor, 0.1) + L.fg + L.light + floorLine(F.FARM.floor, 'FARM.floor');
  }],
  ['farmExterior · sunset, grass glow, no storm (SC 10)', (t) => {
    const cam = { zoom: 1.6, x: -60, y: 220 };
    const L = F.farmExterior(t, { storm: 0, sunset: 1, grass: 1, cam });
    return L.bg + K.view(cam, ref(F.FARM.grass.x + 70, F.FARM.floor, 0.18), 1) + L.fg + L.light;
  }],
  ['farmDoor · KEY EXPIRED: 1998', (t) => {
    const L = F.farmDoor(t, { doorScreen: 'KEY EXPIRED: 1998' });
    return L.bg + ref(1250, F.DOOR.floor, 0.62, { view: 'side', flip: true }) + L.fg + L.light + floorLine(F.DOOR.floor, 'DOOR.floor');
  }],
  ['rackHall (floor 900)', (t) => {
    const cam = { zoom: 1, x: 0, y: 0 };
    const L = F.rackHall(t, cam, {});
    return L.bg + L.mid + K.view(cam, ref(760, F.FLOOR.hall, 0.5) + ref(1100, F.FLOOR.hall, 0.5), 1) + L.fg + L.light + floorLine(F.FLOOR.hall, 'FLOOR.hall');
  }],
  ['rackHall · alarm 1, cam zoom 1.3', (t) => {
    const cam = { zoom: 1.3, x: 300, y: 60 };
    const L = F.rackHall(t, cam, { alarm: 1 });
    return L.bg + L.mid + K.view(cam, ref(1100, F.FLOOR.hall, 0.5), 1) + L.fg + L.light;
  }],
  ['rackHall · green wave .55', (t) => {
    const L = F.rackHall(t, cam0, { green: 1, greenWave: 0.55 });
    return L.bg + L.mid + L.fg + L.light;
  }],
  ['rackHall · lowRes .8 (lag)', (t) => {
    const L = F.rackHall(t, cam0, { lowRes: 0.8 });
    return L.bg + L.mid + L.fg + L.light;
  }],
  ['serviceElevator · doors .35 · pressed B9, up two, close', (t) => {
    const L = F.serviceElevator(t, { doors: 0.35, pressed: [F.LIFT.B9, F.LIFT.B9 - 40, 400] });
    return L.bg + ref(960, F.LIFT.floor - 10, 0.42) + L.mid + ref(1500, F.LIFT.floor + 60, 0.55, { view: 'side' }) + L.fg + L.light + floorLine(F.LIFT.floor, 'LIFT.floor');
  }],
  ['elevatorInside · muzak', (t) => {
    const L = F.elevatorInside(t, { muzak: 1, pressed: [F.LIFT.B9 % 200] });
    return L.bg + ref(760, F.LIFTIN.floor, 0.55) + ref(1160, F.LIFTIN.floor, 0.55) + L.fg + L.light + floorLine(F.LIFTIN.floor, 'LIFTIN.floor');
  }],
  ['coolingRoom (ice floor 900, breath)', (t) => {
    const L = F.coolingRoom(t, cam0, {});
    return L.bg + L.mid + ref(900, F.FLOOR.cooling, 0.5, { rot: -8 }) + F.breath(985, 590, t) + L.fg + L.light + floorLine(F.FLOOR.cooling, 'FLOOR.cooling');
  }],
  ['cableJungle (start ledge 800)', (t) => {
    const L = F.cableJungle(t, cam0, {});
    const e = F.vineEnd(0, t);
    return L.bg + L.mid + ref(250, F.JUNGLE.start.y, 0.45) + ref(e.x, e.y + 470 * 0.95, 0.45, { armL: 170, armR: 170 }) + L.fg + L.light + floorLine(F.JUNGLE.start.y, 'JUNGLE.start.y');
  }],
  ['cableJungle · obby 1 (Dex imagines)', (t) => {
    const cam = { zoom: 0.8, x: 500, y: 0 };
    const L = F.cableJungle(t, cam, { obby: 1 });
    return L.bg + L.mid + L.fg + L.light;
  }],
  ['lostAndFound (floor 920)', (t) => {
    const L = F.lostAndFound(t, cam0, {});
    return L.bg + L.mid + ref(700, F.FLOOR.lost, 0.5) + F.lostItem('bellhop', 700, F.FLOOR.lost - 480, 0.8) + L.fg + L.light + floorLine(F.FLOOR.lost, 'FLOOR.lost');
  }],
  ['archive side · greyFrom .55', (t) => {
    const cam = { zoom: 1, x: 300, y: 0 };
    const L = F.archive(t, cam, { greyFrom: 0.55 });
    return L.bg + L.mid + K.view(cam, ref(1000, F.FLOOR.archive, 0.5), 1) + L.fg + L.light;
  }],
  ['archive deep · greyFrom .55', (t) => {
    const L = F.archive(t, cam0, { view: 'deep', greyFrom: 0.55 });
    return L.bg + ref(960, 1040, 0.42, { view: 'back' }) + L.fg + L.light;
  }],
  ['gameBubble kinds · label · grey · glow', (t) => {
    let o = '<rect width="1920" height="1080" fill="#0B0F2A"/>';
    F.BUBBLE_KINDS.forEach((k, i) => { o += F.gameBubble(180 + i * 260, 330, 100, t, { kind: k, glow: 0.8, seed: i }); });
    o += F.gameBubble(520, 760, 130, t, { label: 'Bubble Island — 3 visits', glow: 1 }) + F.gameBubble(1100, 760, 130, t, { grey: 1, kind: 'obby' }) + F.gameBubble(1560, 760, 90, t, { grey: 1, kind: 'city', label: 'Old Game — 0 visits' });
    return o;
  }],
  ['core · alarm, catwalk 860 (SC 01)', (t) => {
    const cam = { zoom: 1, x: 0, y: 0 };
    const L = F.core(t, cam, { alarm: 1, timer: '00:01:00' });
    return L.bg + L.mid + K.view(cam, ref(700, F.CORE.floor, 0.5, { view: 'side', flip: true }) + ref(1000, F.CORE.floor, 0.45, { view: 'side', flip: true }), 1) + L.fg + L.light + floorLine(F.CORE.floor, 'CORE.floor');
  }],
  ['core · control wall, broadcast lit', (t) => {
    const cam = { zoom: 1, x: 2100, y: 0 };
    const L = F.core(t, cam, { alarm: 1, broadcast: 1, pressed: [42, 43, 210] });
    return L.bg + L.mid + K.view(cam, ref(F.CORE.mic.x + 40, F.CORE.floor, 0.5) + ref(F.CORE.button.x - 160, F.CORE.floor, 0.32, { armR: 120 }), 1) + L.fg + L.light;
  }],
  ['core · green (SC 11), wave .7', (t) => {
    const cam = { zoom: 0.85, x: 300, y: -60 };
    const L = F.core(t, cam, { alarm: 0, green: 1, greenWave: 0.7, timer: '00:00:01', dots: 0, spam: false });
    return L.bg + L.mid + L.fg + L.light;
  }],
  ['worldMap · dots 1 spam · dots .25 · green', (t) => {
    let o = '<rect width="1920" height="1080" fill="#0B0F2A"/>';
    o += F.worldMap(60, 60, 1100, 619, t, { dots: 1, spam: true });
    o += F.worldMap(1260, 80, 600, 338, t, { dots: 0.25 }) + F.worldMap(1260, 560, 600, 338, t, { dots: 0, green: 1 });
    return o;
  }],
];

function countEls(svg) { return (svg.match(/<(?!\/)(rect|path|circle|ellipse|text|polygon|polyline|line|use|image)\b/g) || []).length; }

(async () => {
  const tiles = TILES.filter(([name]) => !filter || name.toLowerCase().includes(filter.toLowerCase()));
  const r = await openRenderer(1920, 1080, { staticDefs: ST.DEFS + F.DEFS + E_DEFS() });
  const imgs = [];
  const tFrame = 3.3;
  if (TIME) { await r.render('<rect width="1920" height="1080" fill="#888"/>', 'jpeg'); }
  let base = 0;
  if (TIME) { const t0 = Date.now(); for (let i = 0; i < 3; i++) await r.render('<rect width="1920" height="1080" fill="#888"/>', 'jpeg'); base = (Date.now() - t0) / 3; }
  for (const [i, [name, fn]] of tiles.entries()) {
    S.resetIds();
    const g0 = process.hrtime.bigint();
    const svg = fn(tFrame);
    const gen = Number(process.hrtime.bigint() - g0) / 1e6;
    const png = await r.render(svg);
    if (TIME) {
      let best = 1e9;
      for (let k = 0; k < 3; k++) { S.resetIds(); const s2 = fn(tFrame + k * 0.1); const t0 = Date.now(); await r.render(s2, 'jpeg'); best = Math.min(best, Date.now() - t0); }
      console.log(`${String(i).padStart(2)} ${name.padEnd(48)} els ${String(countEls(svg)).padStart(5)}  gen ${gen.toFixed(1).padStart(5)}ms  render ~${(best - base).toFixed(0).padStart(4)}ms`);
    }
    if (DIR) { fs.mkdirSync(DIR, { recursive: true }); fs.writeFileSync(path.join(DIR, `farm_${String(i).padStart(2, '0')}.png`), png); }
    imgs.push([name, png]);
  }
  await r.close();
  // compose the sheet
  const cols = 3, tw = 640, th = 360, pad = 16, head = 90, lab = 34;
  const rows = Math.ceil(imgs.length / cols);
  const W = cols * tw + (cols + 1) * pad, H = head + rows * (th + lab + pad) + pad;
  let o = `<rect width="${W}" height="${H}" fill="#14182A"/>` + S.el('text', { x: W / 2, y: 60, 'font-family': 'Lilita One', 'font-size': 52, fill: '#FFD21F', 'text-anchor': 'middle' }, 'ROAD + SERVER FARM SETS — scenes/farm.js');
  imgs.forEach(([name, png], i) => {
    const x = pad + (i % cols) * (tw + pad), y = head + Math.floor(i / cols) * (th + lab + pad);
    o += S.el('image', { x, y, width: tw, height: th, href: 'data:image/png;base64,' + png.toString('base64') });
    o += S.el('text', { x: x + 6, y: y + th + 26, 'font-family': 'Fredoka', 'font-weight': 700, 'font-size': 22, fill: '#E9EDF3' }, `${i}. ${name}`);
  });
  const sh = await openRenderer(W, H);
  const out = OUT || path.join(__dirname, '..', 'concept', 'sets_farm.png');
  fs.writeFileSync(out, await sh.render(o));
  await sh.close();
  console.log('wrote', out);
})().catch((e) => { console.error(e); process.exit(1); });

function E_DEFS() { try { return require('../scenes/env').DEFS || ''; } catch (e) { return ''; } }
