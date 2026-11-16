// Contact sheet for the shared CITY + WORLD + SERVER ROOM sets (scenes/city.js).
// Usage: node tools/city_sheet.js [filter] [--dir <folder for full-size tiles>] [--out sheet.png] [--time] [--t 3.3]
//   writes concept/sets_city.png (3 columns of 640x360 tiles, labelled); --time prints render ms + element counts.
//   Magenta dashed lines = documented floors / anchors. The hero (YOU) is drawn for scale.
'use strict';
const fs = require('fs');
const path = require('path');
const S = require('../rig/svg');
const ST = require('../rig/style');
const { openRenderer } = require('./render');
const K = require('../scenes/kit');
const C = require('../scenes/city');

const args = process.argv.slice(2);
const opt = (name) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : null; };
const DIR = opt('--dir'), OUT = opt('--out'), TIME = args.includes('--time'), T0 = Number(opt('--t') || 3.3);
const filter = args.find((a, i) => !a.startsWith('--') && !['--dir', '--out', '--t'].includes(args[i - 1]));

// the hero, for scale (s .5 ≈ 475 px tall)
const r6 = require('../rig/r6');
const HERO = r6.makeDraw(r6.makeDesign({ col: { jacket: '#D8262E', jacketShade: '#B01D24', shirt: '#F2D04A', shirtShade: '#D9B73A', pants: '#1F3B2A', pantsShade: '#162C1F' } }));
const hero = (x, y, s, pose = {}) => HERO({ x, y, s, shade: true, shadow: true, face: 'happy', ...pose });
const mark = (y, label, x0 = 0, x1 = 1920) => S.path(`M${x0} ${y} L${x1} ${y}`, { stroke: '#FF00FF', 'stroke-width': 3, 'stroke-dasharray': '16 10', opacity: 0.85 }) + S.el('text', { x: x0 + 12, y: y - 8, 'font-family': 'Fredoka', 'font-weight': 700, 'font-size': 24, fill: '#FF00FF' }, label);
const dot = (x, y, label) => S.circle(x, y, 9, { fill: 'none', stroke: '#FF00FF', 'stroke-width': 4 }) + S.el('text', { x: x + 14, y: y - 10, 'font-family': 'Fredoka', 'font-weight': 700, 'font-size': 22, fill: '#FF00FF' }, label);
const cam0 = { zoom: 1, x: 0, y: 0 };
const all = (L) => L.bg + L.mid + L.fg + L.light;

const TILES = [
  ['city · day (time 0)', (t) => all(C.city(t, cam0, { time: 0 }))],
  ['city · sunset .5 · flying 1 (fly all)', (t) => all(C.city(t, cam0, { time: 0.5, flying: 1, blimp: true }))],
  ['city · night · popups · flying (SC 01 wide)', (t) => all(C.city(t, cam0, { time: 1, flying: 0.8, popups: 1, blimp: true }))],
  ['city · anchors (tower, crane hook, stadium, water, tv, hero roof)', (t) => {
    const cam = cam0, L = C.city(t, cam, { time: 0.75 });
    const A = C.CITY, h = C.craneHook(t);
    let m = '';
    for (const [k, a] of [['tower', A.tower], ['hook', h], ['stadium', A.stadium], ['waterTower', A.waterTower], ['tv', A.tv], ['heroRoof', A.heroRoof], ['moon', A.moon]]) { const p = C.toScreen(cam, a); m += dot(p.x, p.y, k); }
    const hr = C.toScreen(cam, A.heroRoof);
    return all(L) + hero(hr.x, hr.y, 0.5 * 0.2) + m;
  }],
  ['usage: cats on CITY.tower / inStadium / CITY.roofs[3] + cage on craneHook', (t) => {
    const cats = require('../rig/cats');
    const cam = { zoom: 1.15, x: -120, y: -60 }, o = { time: 0.85, popups: 0.4 };
    const T = C.CITY.tower, St = C.CITY.stadium, h = C.craneHook(t, o);
    // things ON a mid-layer landmark: draw them with its parallax k between L.mid and L.fg; opts.inStadium sits inside the bowl
    const L = C.city(t, cam, { ...o, inStadium: cats.cat({ x: St.x, y: St.y + 26, s: 0.9, t, pose: 'sleep', coat: 'grey' }) });
    let onMid = cats.pancake({ x: T.x, y: T.y, s: 1.05, t, pose: 'sit', mood: 'smug' });
    const R0 = C.CITY.roofs[3];
    const onNear = cats.cat({ x: (R0.x0 + R0.x1) / 2 + 60, y: R0.y, s: 0.55, t, pose: 'lie', coat: 'calico' });
    const cage = S.g(S.path('M-34 0V-2Q-34 -10 0 -10Q34 -10 34 -2V0M-30 0V70M-15 0V70M0 0V70M15 0V70M30 0V70', { fill: 'none', stroke: '#151515', 'stroke-width': 4 }) + S.rect(-38, 66, 76, 10, 3, { fill: '#5A6070', stroke: '#151515', 'stroke-width': 3 }) + S.circle(0, -14, 6, { fill: 'none', stroke: '#151515', 'stroke-width': 4 }), `translate(${h.x} ${h.y + 4}) rotate(${h.rot})`);
    onMid += cage;
    return L.bg + L.mid + K.view(cam, onMid, C.CITY.tower.k) + L.fg + K.view(cam, onNear, R0.k) + L.light;
  }],
  ['city · night · crack .35 (cam zoom 1.25 pan up)', (t) => all(C.city(t, { zoom: 1.25, x: 0, y: -160 }, { time: 1, popups: 1, crack: 0.35 }))],
  ['city · night · crack 1 + skyChat (Admin)', (t) => {
    const cam = cam0, L = C.city(t, cam, { time: 1, crack: 1, flying: 0.5 });
    return L.bg + L.mid + L.fg + L.light + C.skyChat(960, 470, 1100, 380, t, { text: 'Who. Gave you. Admin?', progress: 1, glow: 1 });
  }],
  ['city · dawn 1 (SC 10) · water tower tip .7', (t) => all(C.city(t, cam0, { time: 1, dawn: 1, waterTip: 0.7 }))],
  ['city · zoom .7 (edges) · night flying', (t) => all(C.city(t, { zoom: 0.7, x: 200, y: 0 }, { time: 0.9, flying: 1, popups: 0.6 }))],
  ['city · zoom 2.2 on tower roof (cat seat)', (t) => {
    const cam = { zoom: 2.2, x: -240, y: -260 }, L = C.city(t, cam, { time: 0.6, popups: 0.5, flying: 0.4 });
    const p = C.toScreen(cam, C.CITY.tower);
    return all(L) + dot(p.x, p.y, 'CITY.tower');
  }],
  ['rooftop · sunset, flying 1 (floor 905)', (t) => {
    const cam = cam0, L = C.rooftop(t, cam, { time: 0.55, flying: 1 });
    return L.bg + L.mid + hero(960, C.ROOF.floor, 0.5, { armL: 150, armR: 150, face: 'excited' }) + L.fg + L.light + mark(C.ROOF.floor, 'ROOF.floor 905');
  }],
  ['rooftop · night, popups, crack', (t) => {
    const L = C.rooftop(t, cam0, { time: 1, popups: 1, crack: 0.8, flying: 0.6 });
    return L.bg + L.mid + hero(1000, C.ROOF.floor, 0.5, { face: 'scared' }) + L.fg + L.light;
  }],
  ['giantScale · night (ground 1000) + shadow .6', (t) => {
    const L = C.giantScale(t, cam0, { shadow: 0.6, popups: 0.4 });
    return L.bg + L.mid + hero(760, C.GIANT.ground, 1.0, { armL: 40, armR: 40, face: 'determined' }) + L.fg + L.light + mark(C.GIANT.ground, 'GIANT.ground 1000');
  }],
  ['desert (floor 905)', (t) => {
    const L = C.desert(t, cam0, {});
    return L.bg + L.mid + hero(800, C.DESERT.floor, 0.5, { face: 'shocked' }) + hero(1150, C.DESERT.floor, 0.5, { view: 'side' }) + L.fg + L.light + mark(C.DESERT.floor, 'DESERT.floor 905');
  }],
  ['island (floor 858) · shark', (t) => {
    const L = C.island(t, cam0, { shark: true });
    return L.bg + L.mid + hero(940, C.ISLAND.floor, 0.42) + hero(1170, C.ISLAND.floor, 0.42, { view: 'side' }) + L.fg + L.light + mark(C.ISLAND.floor, 'ISLAND.floor 858');
  }],
  ['mountain (floor 640)', (t) => {
    const L = C.mountain(t, cam0, {});
    return L.bg + L.mid + hero(820, C.MOUNTAIN.floor, 0.5, { face: 'scared' }) + hero(1100, C.MOUNTAIN.floor, 0.5, { view: 'side' }) + L.fg + L.light + mark(C.MOUNTAIN.floor, 'MOUNTAIN.floor 640');
  }],
  ['serverRoom (floor 960, chair, desk)', (t) => {
    const L = C.serverRoom(t, cam0, {});
    const ch = C.SERVER.chair;
    return L.bg + hero(ch.x, ch.seat, ch.s) + L.mid + hero(1260, C.SERVER.floor, 0.5, { face: 'amazed' }) + L.fg + L.light + mark(C.SERVER.floor, 'SERVER.floor 960') + mark(C.SERVER.desk.top, 'desk.top 672', 380, 1560) + dot(ch.x, ch.seat, 'chair.seat') + dot(C.SERVER.crown.x, C.SERVER.crown.y, 'crown');
  }],
  ['serverRoom · logs · green 1 · zoom 1.6', (t) => {
    const cam = { zoom: 1.6, x: 0, y: -120 };
    const L = C.serverRoom(t, cam, { green: 1, logs: ['fly me', 'speed Granny', 'size Pancake 10', 'fly Dad', 'god me', 'jail Brick', 'fly all', 'size all cats 100'] });
    return all(L);
  }],
  ['props: bus · bathtubGuy · mailman · blimp · waterTower tip', (t) => {
    let o = '<rect width="1920" height="1080" fill="#8FD0FF"/>';
    o += C.bus(420, 330, 0.9, -6, { t, wave: 1 }) + C.bathtubGuy(1250, 470, 0.42, 8, { t }) + C.mailman(1730, 560, 0.45, { t });
    o += C.blimp(420, 760, 0.8, { t }) + [0, 0.3, 0.6, 1].map((k, i) => C.waterTower(900 + i * 210, 1040, 0.62, { tip: k, t })).join('');
    o += hero(1830, 1060, 0.3);
    return o;
  }],
  ['props: crack k .2/.5/1 · serverMsg · flyer/dog/car · skyChat typing', (t) => {
    let o = '<rect width="1920" height="1080" fill="#16123E"/>';
    o += C.crack(240, 220, 200, 0.2) + C.crack(620, 220, 200, 0.5) + C.crack(1040, 230, 220, 1);
    o += C.serverMsg(1550, 120, 420, 'Physics.exe not responding', 1, { neon: 1, col: '#4FE3FF' }) + C.serverMsg(1550, 300, 360, 'Gravity: OFF', 1);
    o += C.flyer(1400, 520, 1.4, 10, { t }) + C.dog(1620, 520, 1.4, -10, { t }) + C.car(1800, 560, 1.2, { lights: 1 });
    o += C.skyChat(700, 740, 1200, 420, t, { text: 'You flew a bus. You jailed a child. You made one hundred thousand cats... GIANT.', progress: 0.62, size: 66 });
    return o;
  }],
];

function countEls(svg) { return (svg.match(/<(?!\/)(rect|path|circle|ellipse|text|polygon|polyline|line|use|image)\b/g) || []).length; }

(async () => {
  const tiles = TILES.filter(([name]) => !filter || name.toLowerCase().includes(filter.toLowerCase()));
  const r = await openRenderer(1920, 1080, { staticDefs: ST.DEFS + C.DEFS + (require('../scenes/env').DEFS || '') });
  const imgs = [];
  let base = 0;
  if (TIME) { await r.render('<rect width="1920" height="1080" fill="#888"/>', 'jpeg'); const t0 = Date.now(); for (let i = 0; i < 3; i++) await r.render('<rect width="1920" height="1080" fill="#888"/>', 'jpeg'); base = (Date.now() - t0) / 3; }
  for (const [i, [name, fn]] of tiles.entries()) {
    S.resetIds();
    const g0 = process.hrtime.bigint();
    const svg = fn(T0);
    const gen = Number(process.hrtime.bigint() - g0) / 1e6;
    const png = await r.render(svg);
    if (TIME) {
      let best = 1e9;
      for (let k = 0; k < 3; k++) { S.resetIds(); const s2 = fn(T0 + k * 0.1); const t0 = Date.now(); await r.render(s2, 'jpeg'); best = Math.min(best, Date.now() - t0); }
      console.log(`${String(i).padStart(2)} ${name.padEnd(64)} els ${String(countEls(svg)).padStart(5)}  gen ${gen.toFixed(1).padStart(5)}ms  render ~${(best - base).toFixed(0).padStart(4)}ms`);
    }
    if (DIR) { fs.mkdirSync(DIR, { recursive: true }); fs.writeFileSync(path.join(DIR, `city_${String(i).padStart(2, '0')}.png`), png); }
    imgs.push([name, png]);
  }
  await r.close();
  const cols = 3, tw = 640, th = 360, pad = 16, head = 90, lab = 34;
  const rows = Math.ceil(imgs.length / cols);
  const W = cols * tw + (cols + 1) * pad, H = head + rows * (th + lab + pad) + pad;
  let o = `<rect width="${W}" height="${H}" fill="#14182A"/>` + S.el('text', { x: W / 2, y: 60, 'font-family': 'Lilita One', 'font-size': 52, fill: '#FFD21F', 'text-anchor': 'middle' }, 'CITY + WORLD + SERVER ROOM SETS — scenes/city.js');
  imgs.forEach(([name, png], i) => {
    const x = pad + (i % cols) * (tw + pad), y = head + Math.floor(i / cols) * (th + lab + pad);
    o += S.el('image', { x, y, width: tw, height: th, href: 'data:image/png;base64,' + png.toString('base64') });
    o += S.el('text', { x: x + 6, y: y + th + 26, 'font-family': 'Fredoka', 'font-weight': 700, 'font-size': 21, fill: '#E9EDF3' }, `${i}. ${name.replace(/&/g, '&amp;').replace(/</g, '&lt;')}`);
  });
  const sh = await openRenderer(W, H);
  const out = OUT || path.join(__dirname, '..', 'concept', 'sets_city.png');
  fs.writeFileSync(out, await sh.render(o));
  await sh.close();
  console.log('wrote', out);
})().catch((e) => { console.error(e); process.exit(1); });
