// Contact sheet of the CUBE CITY game sets (scenes/sets_game.js) -> concept/sets_game.png
// Usage:
//   node tools/sheet_game.js                      all tiles -> concept/sets_game.png (3 columns, 640x360 tiles)
//   node tools/sheet_game.js --only plaza,arena   just those tiles (by key prefix)
//   node tools/sheet_game.js --full DIR           also write every tile as a full 1920x1080 PNG into DIR
//   node tools/sheet_game.js --noref              no hero / anchor marks (default: the hero YOU stands on stand lines at the set's s)
//   node tools/sheet_game.js --out FILE --t 2.3   output file / time
// Prints per tile: elements, JS build ms and browser render ms of the SET ALONE (all layers, no hero, minus an empty-frame
// baseline; median of 5) — the budget is < 90 ms build + render.
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const S = require('../rig/svg');
const { openRenderer } = require('./render');
const X = require('../scenes/sets_game');

const args = process.argv.slice(2);
const arg = (k) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : null; };
const ONLY = arg('--only') ? arg('--only').split(',') : null;
const FULL = arg('--full');
const REF = !args.includes('--noref');
const OUT = arg('--out') || path.join(__dirname, '..', 'concept', 'sets_game.png');
const T0 = Number(arg('--t') || 2.3);

// the hero (YOU) for scale: s .5 ~ 475 px tall (r6 default construction + his colours)
const R6 = require('../rig/r6');
const hero = R6.makeDraw(R6.makeDesign({ col: { jacket: '#D8262E', jacketLine: '#B01D24', shirt: '#F2D04A', shirtShade: '#D9B73A', pants: '#1F3B2A', pantsShade: '#162C1F' } }));
let refOn = true;
const on = () => REF && refOn;
const line = (y, col = '#FF2E63', x0 = -4000, x1 = 8000) => `<path d="M${x0} ${y} L${x1} ${y}" stroke="${col}" stroke-width="3" stroke-dasharray="14 10" opacity="0.8"/>`;
const H = (x, y, s, pose = {}) => (on() ? hero({ x, y, s, shade: true, shadow: true, ...pose }) : '');
const HL = (x, y, s, pose = {}) => (on() ? hero({ x, y, s, shade: true, shadow: true, ...pose }) + line(y) : '');
const mark = (x, y, col = '#FF2E63', r = 9) => (on() ? `<circle cx="${x}" cy="${y}" r="${r}" fill="none" stroke="${col}" stroke-width="4"/><path d="M${x - 16} ${y} h32 M${x} ${y - 16} v32" stroke="${col}" stroke-width="3"/>` : '');
const box = (x, y, w, h, col = '#FFFFFF') => (on() ? `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="none" stroke="${col}" stroke-width="5" stroke-dasharray="18 10"/>` : '');
const bgCard = (c1 = '#2A2246', c2 = '#3E3366') => `<defs><linearGradient id="sheetBg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient></defs><rect x="0" y="0" width="1920" height="1080" fill="url(#sheetBg)"/>`;
const V = (cam, svg, k = 1) => (svg ? `<g transform="${X.camTf(cam, k)}">${svg}</g>` : '');
// camera set with characters: behind = before L.front, floor = after L.front (both world space, k 1 unless anchors say)
const LC = (fn, t, cam, o, behind = '', floor = '') => { const l = fn.layers(t, cam, o); return l.bg + l.mid + V(cam, behind) + l.front + V(cam, floor) + l.fg + l.light; };
// room set through a camera
const LR = (fn, t, o, behind = '', floor = '', cam = {}) => fn.compose(t, o, behind, floor, cam);
const quad4 = (svgs) => svgs.map((v, i) => `<svg x="${(i % 2) * 960}" y="${Math.floor(i / 2) * 540}" width="960" height="540" viewBox="0 0 1920 1080">${v}</svg>`).join('') + '<path d="M960 0 V1080 M0 540 H1920" stroke="#000" stroke-width="6"/>';
const SP = X.SPOTS, FL = X.FLOOR;
const has = (k) => typeof X[k] === 'function';
// hero on a crowd stand line (a few copies) + line marks
const onLines = (lines, every = 700, pose = {}) => (on() ? lines.map((l, i) => { let s = line(l.y, i % 2 ? '#FFE14D' : '#FF2E63'); for (let x = l.x0 + 120 + (i * 230) % every; x < l.x1; x += every) s += hero({ x, y: l.y, s: l.s, shade: true, shadow: true, ...pose }); return s; }).join('') : '');

const TILES = [];
const tile = (key, label, fn) => TILES.push([key, label, fn]);

const at = (cam, a) => X.toScreen(cam, a);           // anchor -> screen
const markA = (cam, a, col) => { const p = at(cam, a); return mark(Math.round(p.x), Math.round(p.y), col); };
const HK = (cam, a, s, pose = {}) => (on() ? `<g transform="${X.camTf(cam, a.k ?? 1)}">${hero({ x: a.x, y: a.y, s, shade: true, shadow: true, ...pose })}</g>` : '');
const lineW = (cam, y, col) => { const p = at(cam, { x: 0, y, k: 1 }); return on() ? line(Math.round(p.y), col, 0, 1920) : ''; };

// ---------------------------------------------------------------- PLAZA
if (has('plaza')) {
  const Z = SP.plaza, c = Z.cams;
  tile('plaza', 'plaza · day · cams.spawn (4 spawn pads, CUBE CITY sign, signpost)', (t) => LC(X.plaza, t, c.spawn, { pads: [0, 0.4, 0, 0] }, '', Z.pads.map((p) => H(p.x, p.y, p.s)).join('')));
  tile('plaza_wide', 'plaza · cams.wide (fountain, bleachers, crate, wall, pool)', (t) => LC(X.plaza, t, c.wide, {}, '', H(Z.wall.dad.x, Z.wall.dad.y, Z.wall.dad.s, { view: 'side', flip: true }) + H(Z.crate.x, Z.crate.y, Z.crate.s) + H(Z.fountain.x - 380, 940, 0.4)));
  tile('plaza_wall', 'plaza · cams.wall: SPOTS.wall.dad (side, faces the wall) + start block', (t) => LC(X.plaza, t, c.wall, {}, '', H(Z.wall.dad.x, Z.wall.dad.y, Z.wall.dad.s, { view: 'side', flip: true, face: 'determined' }) + H(Z.start.x, Z.start.y, Z.start.s)));
  tile('plaza_obby', 'plaza · cams.obby: platforms, gap, water line (sinking = before front)', (t) => LC(X.plaza, t, c.obby, {}, H(Z.water.splash.x, Z.water.y + 120, 0.4, { face: 'scream', armL: 160, armR: 160 }), Z.platforms.map((p) => H(p.x, p.y, p.s)).join('') + H(Z.finish.checkpoint.x, Z.finish.checkpoint.y, 0.4)) + markA(c.obby, { x: Z.gap.mid, y: Z.gap.y }, '#3DFF9A') + lineW(c.obby, Z.water.y, '#3DFF9A'));
  tile('plaza_crowd', 'plaza · sunset · cams.crate: crate speech + stand lines + bleachers', (t) => LC(X.plaza, t, c.crate, { time: 'sunset' }, '', Z.bleachers.map((b) => H((b.x0 + b.x1) / 2, b.y, b.s)).join('') + onLines(Z.lines.slice(1), 520) + H(Z.crate.x, Z.crate.y, Z.crate.s, { armL: 150, armR: 40 })));
  tile('plaza_night', 'plaza · night · cams.spawn, pads [1, .5, 0, 0] (spawn flash)', (t) => LC(X.plaza, t, c.spawn, { time: 'night', pads: [1, 0.5, 0, 0] }, '', Z.pads.map((p) => H(p.x, p.y, p.s)).join('')));
  tile('plaza_tree', 'plaza · cams.tree: hide (drawn before L.front) + peekR', (t) => LC(X.plaza, t, c.tree, {}, H(Z.tree.hide.x, Z.tree.hide.y, Z.tree.hide.s) + H(Z.tree.peekR.x, Z.tree.peekR.y, Z.tree.peekR.s, { face: 'nervous' }), H(Z.tree.x + 520, 940, 0.4)));
  tile('plaza_sign', 'plaza · cams.sign / cams.billboard / cams.gap / cams.fountain', (t) => quad4([LC(X.plaza, t, c.sign, {}), LC(X.plaza, t, c.billboard, { time: 'night', billboard: true }), LC(X.plaza, t, c.gap, {}, '', H(Z.gap.x0 - 60, Z.gap.y, 0.4, { view: 'side', flip: true })), LC(X.plaza, t, c.fountain, {}, '', H(Z.fountain.x + 330, 960, 0.42))]));
}
// ---------------------------------------------------------------- ARENA
if (has('arena')) {
  const Z = SP.arena, c = Z.cams;
  tile('arena', 'arena · day · cheer .6 + signs · duel spots, ring edges, exit (sky)', (t) => LC(X.arena, t, c.ring, { cheer: 0.6, signs: ['GO MOM!', 'GG', 'WOW'] }, '', Z.duel.map((p, i) => H(p.x, p.y, p.s, i ? { view: 'side' } : { view: 'side', flip: true })).join('')) + markA(c.ring, Z.edge.L) + markA(c.ring, Z.edge.R) + markA(c.ring, Z.exit, '#FFE14D'));
  tile('arena_night', 'arena · night · cams.wide · cheer 1 · board text', (t) => LC(X.arena, t, c.wide, { time: 'night', cheer: 1, board: ['MOM_OFFICIAL', 'WINS: 100'] }, '', onLines(Z.lines, 620)));
  tile('arena_raid', 'arena · night · raid 1 (smashed stands, fires, rubble)', (t) => LC(X.arena, t, c.wide, { time: 'night', raid: 1 }, '', H(800, Z.floor, Z.s, { face: 'scared' })));
  tile('arena_cams', 'arena · cams.duel / .board / .stands / .sky', (t) => quad4([LC(X.arena, t, c.duel, { cheer: 0.3 }, '', H(Z.duel[0].x, Z.duel[0].y, Z.s, { view: 'side', flip: true }) + H(Z.duel[1].x, Z.duel[1].y, Z.s, { view: 'side' })), LC(X.arena, t, c.board, {}), LC(X.arena, t, c.stands, { cheer: 1, signs: ['GO MOM!'] }), LC(X.arena, t, c.sky, { time: 'sunset' })]));
}
// ---------------------------------------------------------------- TYCOON
if (has('tycoon')) {
  const Z = SP.tycoon, c = Z.cams;
  tile('tycoon', 'tycoon · cams.castle · sold 1 · roof + front spots', (t) => LC(X.tycoon, t, c.castle, { sold: 1, granny: 1 }, '', H(Z.castle.roof.x, Z.castle.roof.y, Z.castle.roof.s) + H(Z.castle.front.x + 180, Z.castle.front.y, Z.s)));
  tile('tycoon_stand', 'tycoon · granny 1 · cams.stand (behind the counter = before L.front)', (t) => LC(X.tycoon, t, c.stand, { granny: 1 }, H(Z.granny.stand.x, Z.granny.stand.y, Z.granny.stand.s), H(Z.granny.x - 330, Z.floor, Z.s)));
  tile('tycoon_stages', 'tycoon · granny 0 / 2 / 2.55 (popping in) / 3 (belt workers)', (t) => quad4([0, 2, 2.55, 3].map((g) => LC(X.tycoon, t, c.granny, { granny: g }, g === 3 ? Z.granny.belt.workers.map((p) => H(p.x, p.y, p.s)).join('') : '', H(Z.granny.x - 520, Z.floor, Z.s)))));
  tile('tycoon_sky', 'tycoon · granny 4 · cams.skyscraper (neon cookie + billboard)', (t) => LC(X.tycoon, t, c.skyscraper, { granny: 4 }, '', H(Z.granny.front.x - 400, Z.floor, Z.s)));
  tile('tycoon_top', 'tycoon · cams.top / .billboard (night) / .roof / .lava', (t) => quad4([LC(X.tycoon, t, c.top, { granny: 4 }), LC(X.tycoon, t, c.billboard, { granny: 4, time: 'night' }), LC(X.tycoon, t, c.roof, { granny: 4 }, '', H(Z.castle.roof.x, Z.castle.roof.y, Z.castle.roof.s, { armL: 150, armR: 150, face: 'joy' })), LC(X.tycoon, t, c.lava, {})]));
  tile('tycoon_smashed', 'tycoon · night · granny 3 · smashed 1 (cams.valley)', (t) => LC(X.tycoon, t, c.valley, { granny: 3, smashed: 1, time: 'night' }, '', onLines(Z.lines.slice(1, 2), 900)));
  tile('tycoon_museum', 'tycoon · sunset · castleSign COOKIE MUSEUM · granny 4 (cams.castle)', (t) => LC(X.tycoon, t, c.castle, { time: 'sunset', sold: 1, castleSign: 'COOKIE MUSEUM', granny: 4 }, '', H(Z.castle.front.x + 260, Z.castle.front.y, Z.s)));
}
// ---------------------------------------------------------------- INTERIORS
if (has('castleInterior')) {
  const Z = SP.castleInterior, c = Z.cams;
  tile('castleInterior', 'castleInterior · cams.wide (lava pool, trophy wall, throne)', (t) => LR(X.castleInterior, t, {}, '', H(Z.spots.trophies.x, Z.spots.trophies.y, 0.5) + H(Z.throne.x, Z.throne.y, Z.throne.s, Z.throne.sit), c.wide));
  tile('castleInterior_cams', 'castleInterior · cams.lava / .trophies / .throne / .tag (night)', (t) => quad4([LR(X.castleInterior, t, {}, '', H(Z.spots.lava.x, Z.spots.lava.y, 0.5, { armR: 100 }), c.lava), LR(X.castleInterior, t, {}, '', H(Z.spots.trophies.x - 40, Z.spots.trophies.y, 0.5), c.trophies), LR(X.castleInterior, t, {}, '', H(Z.throne.x, Z.throne.y, Z.throne.s, { ...Z.throne.sit, face: 'smug' }), c.throne), LR(X.castleInterior, t, { time: 'night' }, '', '', c.tag)]));
}
if (has('factoryInterior')) {
  const Z = SP.factoryInterior, c = Z.cams;
  tile('factoryInterior', 'factoryInterior · cams.wide · workers behind the belt + pose spot', (t) => LR(X.factoryInterior, t, {}, Z.workers.map((p) => H(p.x, p.y, p.s)).join(''), H(Z.pose.x, Z.pose.y, Z.pose.s), c.wide));
  tile('factoryInterior_cams', 'factoryInterior · cams.belt / .employee / .ovens / .noodle', (t) => quad4([LR(X.factoryInterior, t, {}, Z.workers.slice(0, 4).map((p) => H(p.x, p.y, p.s)).join(''), '', c.belt), LR(X.factoryInterior, t, {}, '', '', c.employee), LR(X.factoryInterior, t, { smashed: 0.6 }, '', '', c.ovens), LR(X.factoryInterior, t, {}, '', H(Z.pose.x, Z.pose.y, Z.pose.s, { armR: 150, face: 'happy' }), c.noodle)]));
}
// ---------------------------------------------------------------- TOWER
if (has('tower')) {
  const Z = SP.tower, c = Z.cams;
  tile('tower', 'tower · night · cams.base (Dad at the foot: SPOTS.tower.base)', (t) => LC(X.tower, t, c.base, {}, '', H(Z.base.x, Z.base.y, Z.base.s, { view: 'back' }) + H(Z.floors[0].x, Z.floors[0].y, 0.3)));
  tile('tower_battle', 'tower · cams.battle (battlefield stand lines + boss feet mark)', (t) => LC(X.tower, t, c.battle, {}, '', onLines(Z.lines, 700)) + markA(c.battle, Z.boss, '#FFE14D'));
  tile('tower_climb', 'tower · towerCam(5) · heroes on floors 3…7 (s .3)', (t) => { const cam = X.towerCam(5, 0.9); return LC(X.tower, t, cam, {}, '', [3, 4, 5, 6, 7].map((i) => H(Z.floors[i - 1].x, Z.floors[i - 1].y, 0.3)).join('')); });
  tile('tower_gap', 'tower · cams.finalGap · floor 99 + the edge (hang point)', (t) => LC(X.tower, t, c.finalGap, {}, '', H(Z.floors[98].x, Z.floors[98].y, 0.3, { view: 'side', flip: true })) + markA(c.finalGap, Z.finalGap.edge, '#3DFF9A'));
  tile('tower_top', 'tower · cams.top · burst .3 · crystal placeholder (crystal: true)', (t) => LC(X.tower, t, c.top, { burst: 0.3, crystal: true }, '', H(Z.top.x + 180, Z.top.y, 0.3, { armL: 150, armR: 150 })) + markA(c.top, Z.crystal, '#FFE14D'));
  tile('tower_views', 'tower · dawn 1 (top) / climb wide / full LOD (zoom .05) / moon', (t) => quad4([LC(X.tower, t, c.top, { dawn: 1 }, '', H(Z.top.x, Z.top.y, 0.3, { face: 'joy', armL: 160, armR: 160 })), LC(X.tower, t, c.climb, {}), LC(X.tower, t, c.full, {}), LC(X.tower, t, c.moon, {})]));
}
// ---------------------------------------------------------------- CITY
if (has('cityNight')) {
  const Z = SP.cityNight, c = Z.cams;
  const bossStand = (cam) => HK(cam, Z.boss, 1.0, { face: 'angry' });
  const LB = (fn, t, cam, o, boss = '', floor = '') => { const l = fn.layers(t, cam, o); return l.bg + boss + l.mid + l.front + V(cam, floor) + l.fg + l.light; };
  tile('cityNight', 'cityNight · cams.wide · boss slot (stand-in hero s 1 on the k .5 plaza)', (t) => LB(X.cityNight, t, c.wide, {}, bossStand(c.wide), H(380, Z.floor, Z.s, { view: 'back' }) + H(1540, Z.floor, Z.s, { view: 'back' })));
  tile('cityNight_boss', 'cityNight · boss 1 · cams.high', (t) => LB(X.cityNight, t, c.high, { boss: 1 }, bossStand(c.high)));
  tile('cityNight_victory', 'cityNight · boss 1 · victory .8 (dawn gold, confetti)', (t) => LB(X.cityNight, t, c.wide, { boss: 1, victory: 0.8 }, '', H(960, Z.floor, Z.s, { face: 'joy', armL: 160, armR: 160 })));
  tile('cityDay', 'cityDay · cams.wide ("this is you, a legend") · ledge stand line', (t) => LB(X.cityDay, t, c.wide, {}, '', HL(960, Z.floor, Z.s)));
  tile('city_cams', 'cityNight · cams.bossUp / .ledge / .low · cityDay sunset', (t) => quad4([LB(X.cityNight, t, c.bossUp, { boss: 0.5 }, bossStand(c.bossUp)), LB(X.cityNight, t, c.ledge, {}, '', H(960, Z.floor, Z.s, { view: 'back' })), LB(X.cityNight, t, c.low, { ledge: false }), LB(X.cityDay, t, c.wide, { time: 'sunset' })]));
}
// ---------------------------------------------------------------- AVATAR SHOP
if (has('avatarShop')) {
  const Z = SP.avatarShop, c = Z.cams;
  tile('avatarShop', 'avatarShop · cams.wide · podium spot', (t) => LR(X.avatarShop, t, {}, '', H(Z.podium.x, Z.podium.y, Z.podium.s), c.wide));
  tile('avatarShop_cams', 'avatarShop · cams.podium / .hats / .rack / .hotdog', (t) => quad4([LR(X.avatarShop, t, {}, '', H(Z.podium.x, Z.podium.y, Z.podium.s), c.podium), LR(X.avatarShop, t, {}, '', '', c.hats), LR(X.avatarShop, t, {}, '', '', c.rack), LR(X.avatarShop, t, {}, '', '', c.hotdog)]));
}
// ---------------------------------------------------------------- PROPS + perf worst cases
tile('props', 'props · cubeWeed, signBoard, obbyFlag, cubeTree kinds, miniBase kinds, fire, rubble, icons', (t) => {
  const tn = X.tone();
  let s = bgCard('#9FD8FF', '#DDF3FF');
  s += X.cubeWeed(160, 240, 2, t * 90) + X.signBoard(420, 380, 260, 110, ['HELLO', 'CUBE CITY'], tn) + X.obbyFlag(640, 380, 1, tn, t, '#4C7DFF', '7');
  s += X.cubeTree(820, 420, 0.5, tn, { kind: 'round' }) + X.cubeTree(1000, 420, 0.5, tn, { kind: 'tall' }) + X.cubeTree(1180, 420, 0.5, tn, { kind: 'blossom', col: '#FF8FC8' });
  ['mushroom', 'rocket', 'dome', 'pizza', 'ship', 'farm', 'noob'].forEach((k, i) => { s += X.miniBase(k, 150 + i * 260, 820, 0.75, tn, t); });
  s += X.fire(1500, 420, 1, t) + X.rubble(1750, 420, 220, tn, 3);
  ['swords', 'coin', 'tower', 'cookie', 'crown', 'star'].forEach((k, i) => { s += X.gameIcon(k, 120 + i * 110, 980, 1.2, tn); });
  s += X.cubeCloud(1500, 1000, 0.6, tn) + X.checkpointPad(1100, 1020, 0.5, tn, t, 'STAGE 2');
  return s;
});
tile('perf_worst', 'perf · arena night raid cheer 1 + near crowd · cams.wide', (t) => LC(X.arena, t, SP.arena ? SP.arena.cams.wide : {}, { time: 'night', raid: 0.6, crowd: 1, cheer: 1, near: true, signs: ['RUN!'] }));

(async () => {
  const tiles = TILES.filter(([k]) => !ONLY || ONLY.some((o) => k.startsWith(o)));
  const r = await openRenderer(1920, 1080, { staticDefs: X.DEFS + require('../rig/style').DEFS });
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'gssheet-'));
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
    const lab = `<rect x="0" y="0" width="1920" height="86" fill="#000" opacity="0.62"/><text x="24" y="62" font-family="Fredoka" font-weight="700" font-size="52" fill="#FFE14D">${label.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</text>`;
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
