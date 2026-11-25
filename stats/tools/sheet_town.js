// Contact sheet of the SCHOOL sets (scenes/sets_town.js) -> concept/sets_town.png
// Usage:
//   node tools/sheet_town.js                      all tiles -> concept/sets_town.png (3 columns, 640x360 tiles)
//   node tools/sheet_town.js --only hall,gym      just those tiles (by key prefix)
//   node tools/sheet_town.js --full DIR           also write every tile as a full 1920x1080 PNG into DIR
//   node tools/sheet_town.js --noref              no hero on the FLOOR lines (default: the hero, s .5, stands on each one)
//   node tools/sheet_town.js --out FILE --t 2.3   output file / time
// Prints per-tile element counts, JS build time and browser render time (minus an empty-frame baseline).
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const S = require('../rig/svg');
const { openRenderer } = require('./render');
const X = require('../scenes/sets_town');

const args = process.argv.slice(2);
const arg = (k) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : null; };
const ONLY = arg('--only') ? arg('--only').split(',') : null;
const FULL = arg('--full');
const REF = !args.includes('--noref');
const OUT = arg('--out') || path.join(__dirname, '..', 'concept', 'sets_town.png');
const T0 = Number(arg('--t') || 2.3);

// the hero (YOU) for scale: s .5 ~ 475 px tall
const R6 = require('../rig/r6');
const hero = R6.makeDraw(R6.makeDesign({ col: { jacket: '#D8262E', jacketShade: '#B01D24', shirt: '#F2D04A', shirtShade: '#D9B73A', pants: '#1F3B2A', pantsShade: '#162C1F' } }));
const line = (y) => `<path d="M-6000 ${y} L9000 ${y}" stroke="#FF2E63" stroke-width="3" stroke-dasharray="14 10" opacity="0.8"/>`;
const ref = (x, y, s = 0.5, pose = {}) => (REF ? hero({ x, y, s, shade: true, shadow: true, ...pose }) + line(y) : '');
const R1 = (p, pose = {}) => (REF && p ? hero({ x: p.x, y: p.y, s: p.s || 0.5, shade: true, shadow: true, ...pose }) : '');
const box = (x, y, w, h) => `<rect x="${x - w / 2}" y="${y - h / 2}" width="${w}" height="${h}" fill="none" stroke="#FF2E63" stroke-width="4" stroke-dasharray="12 8"/>`;
const mark = (p, txt = '') => `<circle cx="${p.x}" cy="${p.y}" r="10" fill="#FF2E63" stroke="#fff" stroke-width="3"/>` + (txt ? `<text x="${p.x}" y="${p.y - 18}" font-family="Fredoka" font-weight="700" font-size="26" fill="#FF2E63" text-anchor="middle" stroke="#fff" stroke-width="5" paint-order="stroke">${txt}</text>` : '');
const V = (cam, svg) => (svg ? `<g transform="${X.camTf(cam, 1)}">${svg}</g>` : '');
const quad4 = (svgs) => svgs.map((v, i) => `<svg x="${(i % 2) * 960}" y="${Math.floor(i / 2) * 540}" width="960" height="540" viewBox="0 0 1920 1080">${v}</svg>`).join('') + '<path d="M960 0 V1080 M0 540 H1920" stroke="#000" stroke-width="6"/>';
const SP = X.SPOTS;
const H = SP.hallway, C = SP.classroom, GY = SP.gym, F = SP.gym.fair, CA = SP.cafeteria, EX = SP.schoolExterior, M = SP.mirror;
const plate = (p) => (REF ? box(p.x, p.y - 950 * p.s - 70, 240, 70) : '');   // where a stat plate floats

const TILES = [
  ['hall_side', 'hallway · side · crowd .8 · main + back lines · plate boxes', (t) => X.hallway.compose(t, {}, { crowd: 0.8 }, R1(H.krumpDoor) , ref(560, 960) + plate({ x: 560, y: 960, s: 0.5 }) + R1({ x: 1560, y: 1050, s: H.lines.front.s }, { face: 'happy' }) + line(850))],
  ['hall_krump', 'hallway · cams.krump · doorOpen 1 (krumpDoor) + krumpOut', (t) => X.hallway.compose(t, H.cams.krump, { doorOpen: 1, crowd: 0.5 }, R1(H.krumpDoor, { face: 'angry' }), R1(H.krumpOut, { face: 'scared', view: 'side' }))],
  ['hall_pan', 'hallway · windows / trophy / restroom open / cams.long', (t) => quad4([X.hallway.compose(t, H.cams.windows, { crowd: 0.6 }, H.bench.seats.map((p) => R1(p)).join(''), ''), X.hallway.compose(t, H.cams.trophy, { crowd: 0.6 }, '', ref(2300, 960)), X.hallway.compose(t, H.cams.restroom, { restroomOpen: 1 }, R1(H.restroomDoor), ''), X.hallway(t, H.cams.long, { crowd: 1 })])],
  ['hall_scatter', 'hallway · crowd 1 · scatter 1 (Tank walks the main line)', (t) => X.hallway.compose(t, { x: 600, y: 0, zoom: 1 }, { crowd: 1, scatter: 1 }, '', ref(1500, 960, 0.56, { face: 'angry' }))],
  ['hall_deep', 'hallway · view deep · crowd .9 · tankMid, krumpDoor open + krumpOut', (t) => X.hallway.compose(t, H.cams.deep, { view: 'deep', crowd: 0.9, doorOpen: 1 }, '', R1(H.deep.krumpOut, { face: 'angry' }) + R1(H.deep.tankMid, { face: 'angry' }) + R1(H.deep.tankEnd) + line(H.deep.tankEnd.y))],
  ['hall_deep2', 'hallway · deep · scatter 1 · cams.deepPush · maxRun', (t) => X.hallway.compose(t, H.cams.deepPush, { view: 'deep', crowd: 1, scatter: 1 }, '', R1(H.deep.maxRun[0], { face: 'excited' }) + R1(H.deep.tankMid, { face: 'angry' }))],
  ['mirror', 'mirror · over the shoulder · reflection clipped · ??? spot', (t) => { const r = M.reflection; return X.mirror.compose(t, {}, [REF ? `<g clip-path="url(#${M.clip})"><g transform="translate(${2 * r.x} 0) scale(-1 1)">${hero({ x: r.x, y: r.y, s: r.s, face: 'confused' })}</g></g>` : ''], R1(M.hero, { view: 'back' })) + mark(M.qmarks, '???'); }],
  ['mirror_face', 'mirror · view face (camera = the mirror) · flicker', (t) => X.mirror.compose(t, { view: 'face', flicker: 1 }, R1(M.face.hero, { face: 'shocked' })) + mark(M.face.qmarks, '???')],
  ['class', 'classroom · all seats (frontRows order) + teacher behind her desk', (t) => X.classroom.compose(t, {}, [C.rows[0].map((p) => R1(p)).join(''), C.rows[1].map((p, i) => R1(p, { face: i === 3 ? 'nervous' : 'neutral' })).join('') + R1(C.teacher, { face: 'angry' }), C.rows[2].map((p) => R1(p, { face: 'happy' })).join('')], line(C.heroDesk.y))],
  ['class_quiz', 'classroom · quiz · cams.heroDesk (hero + Benji) · quizPaper', (t) => X.classroom.compose(t, { quiz: true }, ['', C.rows[1].map((p) => R1(p)).join(''), R1(C.heroDesk, { face: 'scared' }) + R1(C.benjiDesk, { face: 'nervous' })], mark(C.quizPaper), C.cams.heroDesk)],
  ['class_smart', 'classroom · cams.smart · smart seats + outside (bench, bg space)', (t) => X.classroom.compose(t, { outside: REF ? hero({ x: C.outside.x, y: C.outside.y, s: C.outside.s, face: 'sad' }) : '' }, ['', '', C.smartTable.seats.map((p) => R1(p, { face: 'smug' })).join('')], '', C.cams.smart)],
  ['class_teacher', 'classroom · cams.teacher · board [SCIENCE FAIR…] · teacherFront', (t) => X.classroom.compose(t, { board: ['SCIENCE FAIR', 'PARTNERS:', 'CHOOSE WISELY.'] }, ['', R1(C.teacher, { face: 'angry' })], R1(C.teacherFront, { armR: 100 }), C.cams.teacher)],
  ['gym', 'gym · dodgeball teams A (flip) / B + coach', (t) => X.gym.compose(t, {}, '', GY.teamA.map((p) => R1(p, { view: 'side', flip: true })).join('') + GY.teamB.filter((p, i) => i !== 2).map((p) => R1(p, { view: 'side' })).join('') + ref(GY.hero.x, GY.hero.y, GY.hero.s, { face: 'determined' }) + R1(GY.coach))],
  ['gym_pick', 'gym · lineup + captain · scoreboard VICTORY · cheer · balls scatter', (t) => X.gym.compose(t, { scoreboard: 'VICTORY!', cheer: 1, balls: 'scatter' }, '', GY.lineup.map((p) => R1(p)).join('') + R1(GY.captain, { view: 'side', armR: 90 }) + line(GY.lineup[0].y))],
  ['gym_fair', 'gym · fair · potato table (hero + Benji), smart kids, judge, parents', (t) => X.gym.compose(t, { fair: true }, [F.backKids.map((p) => R1(p)).join(''), R1(F.heroFair, { face: 'happy' }) + R1(F.benjiFair, { face: 'excited' }) + F.smartKids.slice(0, 2).map((p) => R1(p, { face: 'smug' })).join('')], R1(F.judge) + line(F.judge.y))],
  ['gym_fair2', 'gym · fair · cams.potato · bulb .7 · ribbon potato', (t) => X.gym.compose(t, { fair: true, bulb: 0.7, ribbon: 'potato' }, ['', R1(F.heroFair, { face: 'joy' }) + R1(F.benjiFair, { face: 'excited' })], '', F && GY.cams.potato)],
  ['caf', 'cafeteria · seats (hero + Benji front), lunch lady, line, tankStop', (t) => X.cafeteria.compose(t, {}, [CA.seats.back.map((p) => R1(p)).join(''), R1(CA.benjiSeat, { face: 'happy' }) + R1(CA.heroSeat, { face: 'happy' }), R1(CA.lunchLady, { face: 'smug' })], CA.line.slice(0, 2).map((p) => R1(p, { view: 'side', flip: true })).join('') + ref(CA.tankStop.x, CA.tankStop.y, 0.56, { face: 'angry' }))],
  ['caf_quiet', 'cafeteria · quiet 1 · cams.tank (Tank at tankStop)', (t) => X.cafeteria.compose(t, { quiet: 1 }, ['', R1(CA.benjiSeat, { face: 'scared' }) + R1(CA.heroSeat, { face: 'nervous' }), ''], ref(CA.tankStop.x, CA.tankStop.y, 0.56, { face: 'sad' }), CA.cams.tank)],
  ['caf_food', 'cafeteria · cams.food / tray / meat / line (tooltip spots)', (t) => quad4([X.cafeteria.compose(t, {}, ['', '', R1(CA.lunchLady)], Object.values(CA.food).map((p) => mark(p)).join(''), CA.cams.food), X.cafeteria.compose(t, {}, ['', R1(CA.heroSeat, { face: 'yuck' })], ['pizza', 'broccoli', 'meat'].map((k) => mark(CA.tray[k])).join(''), CA.cams.tray), X.cafeteria.compose(t, {}, ['', '', R1(CA.lunchLady, { face: 'smug' })], mark(CA.food.meat, '???'), CA.cams.meat), X.cafeteria.compose(t, {}, ['', '', R1(CA.lunchLady)], CA.line.map((p) => R1(p, { view: 'side', flip: true })).join(''), CA.cams.line)])],
  ['ext', 'schoolExterior · morning · front cam · crowd .7', (t) => X.schoolExterior.compose(t, EX.cams.front, {}, '', ref(700, 960) + R1(EX.door))],
  ['ext_wide', 'schoolExterior · cams.establish', (t) => X.schoolExterior(t, EX.cams.establish, { crowd: 1 })],
  ['ext_quad', 'schoolExterior · door / marquee / bus / day sidewalk', (t) => quad4([X.schoolExterior.compose(t, EX.cams.door, {}, '', R1(EX.door)), X.schoolExterior(t, EX.cams.marquee, { marquee: ['SCIENCE FAIR', 'TONIGHT 6 PM'] }), X.schoolExterior.compose(t, EX.cams.bus, {}, '', R1(EX.busDoor)), X.schoolExterior.compose(t, EX.cams.sidewalk, { time: 'day' }, '', ref(900, 960, 0.5, { view: 'side' }))])],
];

(async () => {
  const tiles = TILES.filter(([k]) => !ONLY || ONLY.some((o) => k.startsWith(o)));
  const r = await openRenderer(1920, 1080, { staticDefs: X.DEFS + require('../rig/style').DEFS });
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sheet-town-'));
  if (FULL) fs.mkdirSync(FULL, { recursive: true });
  const timeIt = async (svg) => { const ts = []; for (let i = 0; i < 5; i++) { const b = Date.now(); await r.render(svg, 'jpeg'); ts.push(Date.now() - b); } return ts.sort((x, y) => x - y)[2]; };
  const base = await timeIt('<rect width="1920" height="1080" fill="#888"/>');
  const files = [];
  console.log('tile'.padEnd(16), 'elems'.padStart(6), 'js ms'.padStart(7), 'svg ms'.padStart(8), 'total'.padStart(7));
  for (const [key, label, fn] of tiles) {
    S.resetIds();
    const a = Date.now();
    let svg = '';
    for (let i = 0; i < 3; i++) svg = fn(T0);
    const js = (Date.now() - a) / 3;
    const n = (svg.match(/<[a-zA-Z]/g) || []).length;
    const rt = Math.max(0, Math.round((await timeIt(svg)) - base));
    console.log(key.padEnd(16), String(n).padStart(6), js.toFixed(1).padStart(7), String(rt).padStart(8), (js + rt).toFixed(0).padStart(7));
    if (FULL) fs.writeFileSync(path.join(FULL, key + '.png'), await r.render(svg));
    const lab = `<rect x="0" y="0" width="1920" height="86" fill="#000" opacity="0.62"/><text x="24" y="62" font-family="Fredoka" font-weight="700" font-size="50" fill="#FFE14D">${label}</text>`;
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
