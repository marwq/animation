// Contact sheet of the SCHOOL sets (scenes/sets_school.js) -> concept/sets_school.png
// Usage:
//   node tools/sheet_school.js                      all tiles -> concept/sets_school.png (3 columns, 640x360 tiles)
//   node tools/sheet_school.js --only yard,gym      just those tiles (by key prefix)
//   node tools/sheet_school.js --full DIR           also write every tile as a full 1920x1080 PNG into DIR
//   node tools/sheet_school.js --noref              no hero on the FLOOR lines (default: the hero, s .5, stands on each one)
//   node tools/sheet_school.js --out FILE --t 2.3   output file / time
// Prints per-tile element counts, JS build time and browser render time (minus an empty-frame baseline).
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const S = require('../rig/svg');
const { openRenderer } = require('./render');
const X = require('../scenes/sets_school');

const args = process.argv.slice(2);
const arg = (k) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : null; };
const ONLY = arg('--only') ? arg('--only').split(',') : null;
const FULL = arg('--full');
const REF = !args.includes('--noref');
const OUT = arg('--out') || path.join(__dirname, '..', 'concept', 'sets_school.png');
const T0 = Number(arg('--t') || 2.3);

// the hero (YOU) for scale: s .5 ~ 475 px tall
const R6 = require('../rig/r6');
const hero = R6.makeDraw(R6.makeDesign({ col: { jacket: '#D8262E', jacketShade: '#B01D24', shirt: '#F2D04A', shirtShade: '#D9B73A', pants: '#1F3B2A', pantsShade: '#162C1F' } }));
const line = (y) => `<path d="M-4000 ${y} L8000 ${y}" stroke="#FF2E63" stroke-width="3" stroke-dasharray="14 10" opacity="0.8"/>`;
const ref = (x, y, s = 0.5, pose = {}) => (REF ? hero({ x, y, s, shade: true, shadow: true, ...pose }) + line(y) : '');
const refOnly = (x, y, s = 0.5, pose = {}) => (REF ? hero({ x, y, s, shade: true, shadow: true, ...pose }) : '');
const V = (cam, svg) => (svg ? `<g transform="${X.camTf(cam, 1)}">${svg}</g>` : '');
// room set: layers composited with optional characters between mid/front and front/fg
const L = (fn, t, o, between = '', after = '') => { const l = fn.layers(t, o); return (l.bg || '') + (l.mid || '') + between + (l.front || '') + after + (l.fg || '') + (l.light || '') + (l.screen || ''); };
// schoolyard: characters behind the pole (hug), behind the front layer (crowd) and on the floor line
const Y = (t, cam, o, back = '', after = '', hug = '') => { const l = X.schoolyard.layers(t, cam, o); return l.bg + l.mid + V(cam, hug) + l.pole + V(cam, back) + l.front + V(cam, after) + l.fg + l.light; };
const SP = X.SPOTS;
let EX = null; try { EX = require('../rig/extras'); } catch (e) { /* props not built yet */ }
const quad4 = (svgs) => svgs.map((v, i) => `<svg x="${(i % 2) * 960}" y="${Math.floor(i / 2) * 540}" width="960" height="540" viewBox="0 0 1920 1080">${v}</svg>`).join('') + '<path d="M960 0 V1080 M0 540 H1920" stroke="#000" stroke-width="6"/>';
const kidRow = (pts, face) => pts.map((p, i) => refOnly(p.x, p.y, p.s, { face: face || (i % 2 ? 'amazed' : 'happy') })).join('');
const Y0 = () => SP.schoolyard;

const TILES = [
  ['yard_door', 'schoolyard · day · cams.door (flag spot + door + walk)', (t) => { const c = Y0().cams.door; return Y(t, c, {}, refOnly(Y0().door.x, Y0().door.y, Y0().door.s), ref(Y0().walk.x - 300, X.FLOOR.schoolyard) + refOnly(Y0().flagSpot.x, Y0().flagSpot.y, Y0().flagSpot.s, { face: 'determined' })); }],
  ['yard_morning', 'schoolyard · morning · cams.wide', (t) => { const c = Y0().cams.wide; return Y(t, c, { time: 'morning' }, '', ref(1000, X.FLOOR.schoolyard)); }],
  ['yard_skate', 'schoolyard · cams.skate (crowd, rail, trash, ramp)', (t) => { const c = Y0().cams.skate; return Y(t, c, {}, kidRow(Y0().crowd), ref(Y0().ramp.landing.x - 300, X.FLOOR.schoolyard) + refOnly(Y0().ramp.air.x, Y0().ramp.air.y + 200, 0.5, { face: 'excited', armL: 140, armR: 140 })); }],
  ['yard_ramp', 'schoolyard · cams.ramp (lip, air)', (t) => { const c = Y0().cams.ramp; return Y(t, c, {}, '', refOnly(Y0().ramp.lip.x, Y0().ramp.lip.y, 0.5, { face: 'joy' }) + refOnly(Y0().trash.x - 160, X.FLOOR.schoolyard, 0.5, { face: 'oof', rot: -20 })); }],
  ['yard_poleTop', 'schoolyard · cams.poleTop (hero hugging the top)', (t) => { const c = Y0().cams.poleTop; return Y(t, c, { time: 'morning' }, '', '', refOnly(Y0().hug.x, Y0().hug.y, Y0().hug.s, { face: 'scared', armL: 70, armR: 70 })); }],
  ['yard_poleWide', 'schoolyard · cams.poleWide (zoom .36)', (t) => { const c = Y0().cams.poleWide; return Y(t, c, { time: 'morning' }, '', '', refOnly(Y0().hug.x, Y0().hug.y, Y0().hug.s, { face: 'scared', armL: 70, armR: 70 })); }],
  ['yard_red', 'schoolyard · red 1 · cams.red (+ skyWindow box)', (t) => { const c = Y0().cams.red; const w = Y0().skyWindow; return Y(t, c, { red: 1 }, '', ref(900, X.FLOOR.schoolyard, 0.5, { face: 'scared' })) + `<rect x="${w.x - w.w / 2}" y="${w.y - w.h / 2}" width="${w.w}" height="${w.h}" fill="none" stroke="#FFF" stroke-width="4" stroke-dasharray="20 12"/>`; }],
  ['yard_low', 'schoolyard · lowGfx 0 / .35 / .65 / 1', (t) => quad4([0, 0.35, 0.65, 1].map((k) => Y(t, Y0().cams.door, { lowGfx: k }, '', ref(700, X.FLOOR.schoolyard))))],
  ['yard_sunset', 'schoolyard · sunset · colorBack .45 (frozen 1)', (t) => Y(t, Y0().cams.door, { time: 'sunset', colorBack: 0.45, frozen: 1, colorFrom: [700, 700] }, '', ref(700, X.FLOOR.schoolyard))],
  ['yard_frozen', 'schoolyard · frozen 1 · court', (t) => Y(t, Y0().cams.court, { frozen: 1 }, '', ref(Y0().court.x + 300, X.FLOOR.schoolyard))],
  ['class', 'classroom · class view · seats by row (frontRows order) + teacher', (t) => { const l = X.classroom.layers(t, {}); const C = SP.classroom; let o = l.bg + l.mid; C.rows.forEach((row, i) => { o += row.map((p) => refOnly(p.x, p.y, p.s, { face: p.x === C.neighbour.x && i === 2 ? 'excited' : 'neutral' })).join('') + l.frontRows[i]; }); return o + ref(C.teacher.x, C.teacher.y, C.teacher.s) + l.light; }],
  ['class_quiz', 'classroom · quiz, morning · cams.heroDesk via compose() (hero sliding down)', (t) => { const c = SP.classroom.cams.heroDesk; const C = SP.classroom; return X.classroom.compose(t, { quiz: true, time: 'morning' }, ['', C.rows[1].map((p) => refOnly(p.x, p.y, p.s)).join(''), refOnly(C.heroDesk.x, C.heroDesk.y + 120, C.heroDesk.s, { face: 'nervous' }) + refOnly(C.neighbour.x, C.neighbour.y, C.neighbour.s, { face: 'excited', armR: 160 })], '', c); }],
  ['class_board', 'classroom · board view (7 × 8 = ?) teacher + fg seats', (t) => { const l = X.classroom.layers(t, { view: 'board' }); const B = SP.classroom.board; return l.bg + l.mid + refOnly(B.teacher.x, B.teacher.y, B.teacher.s, { armR: 100 }) + l.front + B.seats.map((p) => refOnly(p.x, p.y, p.s, { view: 'back' })).join('') + l.fg + line(B.teacher.y); }],
  ['class_board2', 'classroom · board [7 × 9 = ?, 64? 63!], quiz, cams.boardClose', (t) => { const c = SP.classroom.cams.boardClose; const l = X.classroom.layers(t, { view: 'board', board: ['7 × 9 = ?', '64?  63!'], quiz: true }); return V(c, l.mid + l.front + l.fg); }],
  ['hall', 'hallway · cam x 0 (talent-show poster, ROOM 104 door spot)', (t) => X.hallway.compose(t, {}, refOnly(SP.hallway.door.x, SP.hallway.door.y, SP.hallway.door.s), ref(800, X.FLOOR.hallway, 0.5, { view: 'side' }))],
  ['hall_pan', 'hallway · cam x -900 / x 1000 + doorOpen', (t) => quad4([X.hallway.compose(t, {}, '', '', SP.hallway.cams.pan[0]), X.hallway.compose(t, { doorOpen: 1 }, '', '', SP.hallway.cams.pan[1]), X.hallway.compose(t, {}, '', '', SP.hallway.cams.poster), X.hallway.compose(t, { doorOpen: 1 }, refOnly(SP.hallway.door.x, SP.hallway.door.y, SP.hallway.door.s), '', SP.hallway.cams.door)])],
  ['gym', 'gym · dodgeball lines (throwers / team / dodge) + coach', (t) => { const G_ = SP.gym; return L(X.gym, t, {}, '', G_.throwers.map((p) => refOnly(p.x, p.y, p.s, { view: 'side', flip: true })).join('') + G_.team.map((p) => refOnly(p.x, p.y, p.s, { view: 'side' })).join('') + ref(G_.dodge.x, G_.dodge.y, 0.5, { face: 'determined' }) + refOnly(G_.coachFront.x, G_.coachFront.y, G_.coachFront.s)); }],
  ['gym_slowmo', 'gym · slowmo 1 · cams.dodge + ballFace', (t) => { const c = SP.gym.cams.dodge; const l = X.gym.layers(t, { slowmo: 1, scoreboard: ['HOME', '00', 'GUEST', '12'] }); return V(c, l.mid + refOnly(SP.gym.dodge.x, SP.gym.dodge.y, 0.5, { face: 'smug', lean: -14 }) + X.floorBall(SP.gym.ballFace.x, SP.gym.ballFace.y, 30)) + l.light; }],
  ['gym_bin', 'gym · bin + coach spots (SC07), scoreboard text', (t) => { const c = SP.gym.cams.bin; const l = X.gym.layers(t, { scoreboard: 'ARE YOU A BALL?' }); const B = SP.gym.bin; const bin = EX && EX.ballBin ? EX.ballBin.layers({ x: B.x, y: B.y, s: B.s, fill: 0.8 }) : { back: `<rect x="${B.x - 110}" y="${B.y - 220}" width="220" height="220" fill="none" stroke="#FF2E63" stroke-width="4" stroke-dasharray="12 8"/>`, front: '' }; return V(c, l.mid + bin.back + refOnly(B.x, B.y - 60, B.s, { face: 'dizzy' }) + bin.front + refOnly(SP.gym.coach.x, SP.gym.coach.y, SP.gym.coach.s)) + l.light; }],
  ['caf', 'cafeteria · line, lunch lady, seats (frontRows order), lane', (t) => { const l = X.cafeteria.layers(t, {}); const C = SP.cafeteria; return l.bg + l.mid + refOnly(C.lunchLady.x, C.lunchLady.y, C.lunchLady.s) + l.frontRows[0] + C.line.map((p) => refOnly(p.x, p.y, p.s, { view: 'side' })).join('') + C.seats.back.map((p) => refOnly(p.x, p.y, p.s)).join('') + l.frontRows[1] + C.seats.front.map((p) => refOnly(p.x, p.y, p.s, { face: 'joy' })).join('') + l.frontRows[2] + ref(C.slip.x, C.slip.y, 0.5, { face: 'shocked' }) + refOnly(C.principalHit.x, C.principalHit.y, C.principalHit.s) + l.light; }],
  ['caf_table', 'cafeteria · cams.table · stage (standing on the bench)', (t) => { const c = SP.cafeteria.cams.table; const l = X.cafeteria.layers(t, { puddle: 0 }); const C = SP.cafeteria; return V(c, l.bg + l.mid + l.frontRows[0] + l.frontRows[1] + refOnly(C.stage.x, C.stage.y, C.stage.s, { face: 'joy', armL: 150 }) + refOnly(C.seats.front[2].x, C.seats.front[2].y, C.seats.front[2].s, { face: 'happy' }) + refOnly(C.seats.front[0].x, C.seats.front[0].y, C.seats.front[0].s, { face: 'happy' }) + l.frontRows[2]) + l.light; }],
  ['lounge', 'lounge · seats + cake spot + table ends', (t) => { const Lo = SP.lounge; return L(X.lounge, t, {}, Lo.seats.map((p) => refOnly(p.x, p.y, p.s, { face: 'shocked' })).join('') + refOnly(Lo.behindCake.x, Lo.behindCake.y, Lo.behindCake.s, { face: 'deadpan' }), (EX && EX.birthdayCake ? EX.birthdayCake({ x: Lo.cake.x, y: Lo.cake.y, s: Lo.cake.s, t }) : `<rect x="${Lo.cake.x - 120}" y="${Lo.cake.y - 200}" width="240" height="200" fill="none" stroke="#FF2E63" stroke-width="4" stroke-dasharray="12 8"/>`) + ref(Lo.ends[1].x, Lo.ends[1].y) + refOnly(Lo.ends[0].x, Lo.ends[0].y, 0.5)); }],
  ['aud_stage', 'auditorium · stage, house lights 1 (ivy / hero / principal at mic)', (t) => { const A = SP.auditorium.stage; return L(X.auditorium, t, { view: 'stage' }, '', refOnly(A.ivy.x, A.ivy.y, A.ivy.s, { face: 'happy' }) + ref(A.hero.x, A.hero.y, A.hero.s, { face: 'nervous' })); }],
  ['aud_show', 'auditorium · stage, lights 0, 2 spots, cheer 1, confetti .8', (t) => { const A = SP.auditorium.stage; return L(X.auditorium, t, { view: 'stage', lights: 0, spots: [A.spots.left, A.spots.right], cheer: 1, confetti: 0.8, phones: 1 }, '', refOnly(A.ivy.x, A.ivy.y, A.ivy.s, { face: 'joy', armL: 150, armR: 150 }) + refOnly(A.hero.x, A.hero.y, A.hero.s, { face: 'joy', armL: 150, armR: 150 })); }],
  ['aud_curtain', 'auditorium · curtain .25 / 0 (closed), lights .5', (t) => quad4([L(X.auditorium, t, { view: 'stage', curtain: 0.25, lights: 0.5 }), L(X.auditorium, t, { view: 'stage', curtain: 0, lights: 0.5, spots: [] }), X.auditorium(t, { view: 'stage', lights: 0, spots: [SP.auditorium.stage.spots.centre], curtain: 0.6 }), V(SP.auditorium.cams.banner, X.auditorium(t, { view: 'stage', lights: 0 }))])],
  ['aud_house', 'auditorium · house, lights 1 + family (dad / mom / bea on seat)', (t) => { const H = SP.auditorium.house; const l = X.auditorium.layers(t, { view: 'house' }); return l.mid + refOnly(H.dad.x, H.dad.y, H.dad.s, { face: 'happy' }) + refOnly(H.mom.x, H.mom.y, H.mom.s, { face: 'happy' }) + refOnly(H.bea.x, H.bea.y, H.bea.s * 0.75, { face: 'excited' }) + l.fg + l.light; }],
  ['aud_cheer', 'auditorium · house, lights 0, cheer 1, phones, wave', (t) => { const H = SP.auditorium.house; const l = X.auditorium.layers(t, { view: 'house', lights: 0, cheer: 1, phones: 1, wave: true }); return l.mid + refOnly(H.dad.x, H.dad.y, H.dad.s, { face: 'joy', armL: 160, armR: 160 }) + refOnly(H.mom.x, H.mom.y, H.mom.s, { face: 'joy' }) + refOnly(H.bea.x, H.bea.y, H.bea.s * 0.75, { face: 'excited', armL: 170, armR: 170 }) + l.fg + l.light; }],
  ['aud_gasp', 'auditorium · house, lights 0, gasp 1 · cams.family', (t) => { const H = SP.auditorium.house; const c = SP.auditorium.cams.family; const l = X.auditorium.layers(t, { view: 'house', lights: 0, gasp: 1, cam: c }); return V(c, l.mid + refOnly(H.dad.x, H.dad.y, H.dad.s, { face: 'shocked' }) + refOnly(H.mom.x, H.mom.y, H.mom.s, { face: 'shocked' }) + refOnly(H.bea.x, H.bea.y, H.bea.s * 0.75, { face: 'scared' }) + l.fg + l.light); }],
  ['aud_wings', 'auditorium · wings (hero + ivy spots, gap)', (t) => { const W_ = SP.auditorium.wings; return L(X.auditorium, t, { view: 'wings' }, '', ref(W_.hero.x, W_.hero.y, W_.hero.s, { face: 'nervous' }) + refOnly(W_.ivy.x, W_.ivy.y, W_.ivy.s, { face: 'happy' })); }],
];

(async () => {
  const tiles = TILES.filter(([k]) => !ONLY || ONLY.some((o) => k.startsWith(o)));
  const r = await openRenderer(1920, 1080, { staticDefs: X.DEFS + require('../rig/style').DEFS + ((EX && EX.DEFS) || '') });
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sheet-school-'));
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
