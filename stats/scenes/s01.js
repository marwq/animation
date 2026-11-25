// SC 01 · COLD OPEN — EVERYONE'S STATS (0 … SC 02). The HUD blinks on in a school hallway: stat plates pop over every
// student; a sea of plates; Mrs. Krump steps out of Room 12 — LV 99 · FINAL BOSS (boss bar, glare); "Homework. On my
// desk. NOW." (the stampede, the shockwave); Tank walks down the middle, kids scatter — LV 80 but HP 3/100 blinking red,
// his stomach growls; Max bursts out of a locker and tears through the hall (CHAOS rolls 9 → 9 000 → 9 999), RAWR!; the
// lunch lady LV 50 + "SECRET SKILL: MYSTERY MEAT" (the meat opens an eye); the hero walks through everybody's plates in slow
// motion — nothing over his own head; the boys' room mirror: "???"; "Why do I get QUESTION MARKS?!" — he swats at the
// plate, it dodges; VHS PAUSE → REWIND through the whole cold open → the plates fold into one point → the title card.
'use strict';

const K = require('./kit');
const H = require('./hud');
const ST = require('./sets_town');
const AC = require('./acting');
const E = require('./s01_env');
const { S, f, clamp, lerp, ease, seg, bump, hash, ol, ln, T, TF, camKeys, view, actor } = K;
const { L } = K.V;
const { tf, TS, TFS, pop, sc, camAt, toScr, shakeAll, boing, dim, dutch, whip, smash, zoomLines, streaks, crtOpen, rings, papers, osd, tracking, crowdPlates, scanReticle, lockerDoor, meatEye } = E;

const A = Array.from({ length: 10 }, (_, i) => L('01.' + i));
const T0 = 0, END = K.V.scene('SC 02').start;                     // == main.js RANGES for SC 01
const w = (i, word, n = 0) => A[i].word(word, n).t0;
const w1 = (i, word, n = 0) => A[i].word(word, n).t1;
const HS = ST.SPOTS.hallway, DP = HS.deep, MR = ST.SPOTS.mirror, CF = ST.SPOTS.cafeteria;
const hS = HS.scaleAt;

// ================================================================= the cut list (all from the voice)
const CUT = {};
CUT.open = T0;
CUT.sea = w(0, 'stats') - 0.05;
CUT.krump = A[1].a - 0.08;
CUT.boss = w(1, 'Final') - 0.08;
CUT.homework = A[2].a - 0.15;
CUT.desk = w(2, 'On') - 0.1;
CUT.now = w(2, 'NOW') - 0.2;
CUT.tank = A[3].a - 0.05;
CUT.health = w(3, 'But') - 0.1;
CUT.locker = A[4].a - 0.25;
CUT.chaos = w(4, 'Chaos') - 0.1;
CUT.rawr = A[5].a - 0.12;
CUT.lunch = A[6].a - 0.05;
CUT.meat = w(6, 'mystery') - 0.1;
CUT.every = A[7].a - 0.1;
CUT.door = w(7, "Everybody's", 1) - 0.1;
CUT.mirror = w(7, 'except') - 0.05;
CUT.qm = A[8].a - 0.1;
CUT.why = w(8, 'Why') - 0.1;
CUT.swat = A[8].b + 0.1;
CUT.pause = A[9].a - 0.05;
CUT.rewind = w(9, "Let's") - 0.08;
CUT.title = w1(9, 'beginning') + 0.2;
{
  const ks = Object.keys(CUT);
  for (let i = 1; i < ks.length; i++) if (CUT[ks[i]] < CUT[ks[i - 1]] + 0.2) CUT[ks[i]] = CUT[ks[i - 1]] + 0.2;
}
// beats inside shots
const B = {};
B.crt = T0 + 0.32;                                               // the HUD "eyelid" is open
B.wave0 = B.crt + 0.1; B.wave1 = w(0, 'stats') - 0.4;           // plates pop over the deep-hall crowd
B.real = w(0, 'real');                                            // "in real life?" push
B.door = A[1].a + 0.05;                                           // Room 12 door swings open
B.step = w(1, 'teacher') + 0.1;                                   // Mrs. Krump steps out
B.krumpPlate = w(1, 'Level') - 0.1; B.krumpPlate1 = w1(1, 'ninety-nine');
B.bossBar = CUT.boss + 0.02; B.bossHit = w(1, 'boss');
B.flick = [A[1].b + 0.25, A[1].b + 0.55];                         // the hall lights flicker in the beat
B.hw = w(2, 'Homework');
B.run = w(2, 'On');                                               // the homework stampede
B.nowHit = w(2, 'NOW');
B.scatter = A[3].a + 0.05;
B.tankPlate = w(3, 'Level') - 0.1; B.tankPlate1 = w1(3, 'eighty');
B.health = w(3, 'health'); B.zero = w(3, 'zero');
B.growl = A[3].b + 0.35;                                          // Tank's stomach (foreshadowing SC05)
B.rattle = CUT.locker + 0.05; B.burst = w(4, 'brother');          // Max in the locker
B.maxLand = B.burst + 0.42;
B.chaos = [[w(4, 'nine'), 9], [w(4, 'thousand'), 9000], [w(4, 'hundred'), 9900], [w(4, 'ninety-nine'), 9999]];
B.maxPlate = w(4, 'Chaos') - 0.15;
B.skid = CUT.rawr - 0.02; B.rawr = A[5].a;
B.ladle = [A[6].a + 0.25, A[6].a + 1.35];
B.ladyPlate = w(6, 'Level') - 0.1; B.ladyPlate1 = w1(6, 'fifty');
B.secret = w(6, 'Secret') - 0.05;
B.meatTip = w(6, 'mystery') - 0.05; B.eye = w(6, 'meat') - 0.05;
B.lookUp = w(7, 'stats') - 0.1;                                   // he looks above his own head: nothing
B.enter = CUT.door + 0.7;                                         // pushes the restroom door
B.qPop = w(7, 'yours') - 0.15;                                    // "???" over the reflection
B.qShout = w(8, 'QUESTION');
B.swats = [CUT.swat + 0.2, CUT.swat + 0.85];                       // he swats at the plate, it dodges
B.freeze = CUT.pause;                                             // = the frozen time inside the swat shot
B.fold = CUT.title + 0.05; B.slam = CUT.title + 0.5;              // plates fold into one point → the title slams in
B.out = END - 0.16;                                               // white flash into SC 02

// ================================================================= small shared helpers
const hudF = (t, o = {}) => H.hudFrame({ t, clock: '8:05 AM', day: 'MON', ...o });
// a lite kid with an optional pose
const kid = (i, p) => K.draw.kid(i, p);
// screen plate at a world head-top point (crisp, constant size)
function plateAt(cam, who, wx, wy, o = {}) {
  const q = toScr(cam, wx, wy);
  return H.plateFor(who, { ...o, x: q.x + (o.dx || 0), y: q.y + (o.dy || 0) });
}
// chaos value at time t (rolls with the narrator's numbers)
function chaosAt(t) {
  let v = 0, prev = 0, bumpK = 0;
  for (const [t0, val] of B.chaos) {
    if (t >= t0) { const u = ease.out(seg(t, t0, t0 + 0.22)); v = lerp(prev, val, u); bumpK = Math.max(bumpK, bump(t, t0, t0 + 0.3)); }
    prev = val;
  }
  return { v: Math.round(v), bump: bumpK };
}

// ================================================================= SHOTS
// ---- 1. "What if you could see everyone's stats..." — the HUD blinks on: POV walking down the hall, plates pop in a wave
function shOpen(t) {
  const u = seg(t, CUT.open, CUT.sea);
  const cam = { ...camAt(960, 560, lerp(1.0, 1.22, ease.inOut(u))), sx: 4 * Math.sin(t * 4.3), sy: 7 * Math.sin(t * 8.6) };
  const D = DP;
  // two kids walking in the middle (one toward us, one away)
  const D1 = lerp(3.4, 2.1, u), D2 = lerp(2.5, 3.3, u);
  const k1 = D.at(D1, -230), k2 = D.at(D2, 260);
  const walkers = [
    { ...k2, i: 14, view: 'back', ...AC.walkFront(t * 7, 0.8) },
    { ...k1, i: 7, ...AC.walkFront(t * 7 + 1, 0.8), face: 'happy' },
  ];
  let chars = '';
  for (const p of walkers.sort((a, b) => a.y - b.y)) chars += kid(p.i, p);
  let o = ST.hallway.compose(t, cam, { view: 'deep', crowd: 1, scatter: 0, clock: '8:05' }, '', chars);
  // plates: the wave over everyone
  const crowd = ST.hallway.crowdAt(t, { view: 'deep', crowd: 1 }).concat(walkers.map((p) => ({ ...p, i: p.i + 100, kind: 'kid' })));
  const n = crowd.length;
  const order = crowd.map((p, j) => [-p.y + 60 * hash((p.i ?? j) * 1.37 + 2), p.i ?? j]).sort((a, b) => a[0] - b[0]).map((x) => x[1]);
  o += crowdPlates(cam, crowd, t, (id) => {
    const r = order.indexOf(id) / Math.max(1, n - 1);
    const t0 = lerp(B.wave0, B.wave1, r);
    return seg(t, t0, t0 + 0.35);
  }, { scale: 2.6, max: 1.3, big: 2 });
  o += hudF(t, { k: seg(t, B.crt - 0.05, B.crt + 0.75) });
  o += crtOpen(seg(t, CUT.open, B.crt));
  return o;
}

// ---- 2. "...in real life?" — the long hall: a sea of plates; two funny ones; push on "real life?"
function shSea(t) {
  const u = seg(t, CUT.sea, CUT.krump);
  const pr = ease.inOut(seg(t, B.real - 0.25, B.real + 0.45));
  const cam = camAt(lerp(380, 760, ease.inOut(u)), 610, lerp(0.8, 0.98, pr));
  const ys = 960, sm = 0.5;
  // walkers on the main line (rig lite kids) + the coach
  const wk = [[-300, 21, 1], [180, 5, -1], [560, 9, 1], [1320, 16, -1]];
  let chars = '';
  wk.forEach(([x0, i, dir], j) => {
    const x = x0 + dir * (t - CUT.sea) * 120;
    chars += kid(i, { x, y: j % 2 ? ys : 1010, s: j % 2 ? sm : hS(1010), view: 'side', flip: dir > 0, ...AC.walk(t * 7 + j, 0.9) });
  });
  const cx = 1250 + (t - CUT.sea) * 90;
  chars += actor('coach', t, { x: cx, y: 990, s: hS(990), view: 'side', flip: true, ...AC.walk(t * 6, 0.8) });
  let o = ST.hallway.compose(t, cam, { crowd: 1, clock: '8:05' }, '', chars);
  const crowd = ST.hallway.crowdAt(t, { crowd: 1 });
  o += crowdPlates(cam, crowd, t, (id) => seg(t, CUT.sea - 0.6 + hash(id * 2.1) * 0.9, CUT.sea - 0.2 + hash(id * 2.1) * 0.9), { scale: 1.9, max: 0.8 });
  wk.forEach(([x0, i, dir], j) => {
    if (j === 2) return;
    const x = x0 + dir * (t - CUT.sea) * 120, y = j % 2 ? ys : 1010, s = j % 2 ? sm : hS(1010);
    const q = toScr(cam, x, y - 935 * s);
    o += H.miniPlate({ x: q.x, y: q.y, s: 0.8, k: seg(t, CUT.sea + 0.05 * j, CUT.sea + 0.35 + 0.05 * j), t, name: E.NAMES[(i * 3) % E.NAMES.length], level: 3 + i, hp: 0.3 + 0.1 * j });
  });
  // the funny ones
  const x2 = 640 + (t - CUT.sea) * 120, q2 = toScr(cam, x2, 1010 - 935 * hS(1010));
  o += H.statPlate({ x: q2.x, y: q2.y, s: 0.78, t, k: seg(t, CUT.sea + 0.25, CUT.sea + 0.75), name: 'JAY', level: 8, title: 'SKILL: NAPPING', bars: [{ label: 'ENERGY', value: 4 }] });
  const qc = toScr(cam, cx, 990 - 1129 * hS(990));
  o += H.statPlate({ x: qc.x, y: qc.y, s: 0.78, t, k: seg(t, CUT.sea + 0.55, CUT.sea + 1.05), name: 'COACH', level: 41, title: 'WHISTLE: LEGENDARY', bars: [{ label: 'STR', value: 77 }] });
  o += hudF(t);
  return o;
}

// ---- 3. "Your teacher? Level ninety-nine." — Room 12's door opens; Mrs. Krump steps out; the hall freezes; her plate
function shKrump(t) {
  const cam = camKeys(t, [[CUT.krump, camAt(1160, 500, 1.3)], [CUT.boss, camAt(1230, 470, 1.46)]], ease.inOut);
  const step = ease.inOut(seg(t, B.step, B.step + 0.8));
  const kx = lerp(HS.krumpDoor.x, HS.krumpOut.x, step), ky = lerp(HS.krumpDoor.y, HS.krumpOut.y, step), ks = lerp(HS.krumpDoor.s, HS.krumpOut.s, step);
  const walking = step > 0 && step < 1;
  const krump = actor('teacher', t, { x: kx, y: ky, s: ks, pointer: true, pointerRot: 10, ...(walking ? AC.walkFront(t * 6, 0.7) : {}), face: t > B.krumpPlate ? 'determined' : 'neutral', t });
  const fr = seg(t, B.step - 0.1, B.step + 0.25);
  const kidsP = [[820, 3, 0.4], [1620, 11, -0.5], [1790, 18, -0.6]];
  let kids = '';
  kidsP.forEach(([x, i, look], j) => {
    const y = j === 0 ? 970 : 950;
    kids += kid(i, { x, y, s: hS(y), turn: look * fr, face: fr > 0.5 ? { name: 'scared', fx: j === 1 ? ['sweat'] : [] } : 'happy', armL: 10 + 40 * fr * (j === 2 ? 1 : 0), armR: 10 + 40 * fr * (j === 2 ? 1 : 0), ...boing(t, B.step + 0.1 * j, 0.15) });
  });
  let o = ST.hallway.compose(t, cam, { crowd: 0.3, scatter: 0.6 * fr, doorOpen: ease.out(seg(t, B.door, B.door + 0.45)), clock: '8:05' }, krump, kids);
  const head = H.overHead('teacher', kx, ky, ks);
  o += plateAt(cam, 'teacher', head.x, head.y, { s: 1.0, t, k: seg(t, B.krumpPlate, B.krumpPlate1 + 0.05) });
  o += hudF(t);
  return o;
}

// ---- 4. "Final boss." — smash close-up: boss bar slams in, glasses glint; the hall lights flicker in the beat
function shBoss(t) {
  const s = HS.krumpOut.s, x = HS.krumpOut.x, y = HS.krumpOut.y;
  const fy = y - 1340 * s * 0.64;
  const cam = shakeAll(camKeys(t, [[CUT.boss, camAt(x + 10, fy + 10, 2.35)], [CUT.homework, camAt(x + 10, fy, 2.7)]], ease.out), t, [[B.bossHit, 0.5, 18], [B.bossBar, 0.25, 10]]);
  const glare = bump(t, B.bossHit - 0.05, B.bossHit + 0.6) + 0.6 * bump(t, B.flick[1], B.flick[1] + 0.5);
  const krump = actor('teacher', t, { x, y, s, pointer: true, pointerRot: lerp(10, -20, seg(t, A[1].b, CUT.homework)), glare, face: glare > 0.05 ? undefined : 'determined', t, volume: false });
  let o = ST.hallway.compose(t, cam, { crowd: 0.2, scatter: 0.6, doorOpen: 1, clock: '8:05' }, krump, '');
  o += dim(0.18, '#5A0010');
  for (const ft of B.flick) if (t > ft && t < ft + 0.12) o += dim(0.45, '#05020A');
  o += H.edgePulse(0, 0, 1920, 1080, 0.5 + 0.5 * Math.sin(t * 6));
  o += H.bossBar({ t, k: seg(t, B.bossBar, B.bossBar + 0.4), value: 1, hit: seg(t, B.bossHit, B.bossHit + 0.5), y: 120, w: 1100 });
  o += hudF(t, { theme: 'boss' });
  return o + smash(t, CUT.boss, 0.12, 0.8, '#FFD0D0');
}

// ---- 5. TEACHER: "Homework." — low dutch angle: she towers, the pointer comes up at the camera
function shHomework(t) {
  const x = HS.krumpOut.x, y = HS.krumpOut.y, s = HS.krumpOut.s;
  const cam = camKeys(t, [[CUT.homework, camAt(x - 40, 650, 1.55, 960, 620)], [CUT.desk, camAt(x - 40, 630, 1.7, 960, 620)]], ease.inOut);
  const up = ease.outBack(seg(t, B.hw - 0.15, B.hw + 0.25));
  const krump = actor('teacher', t, { x, y, s, pointer: true, freeArms: true, pointerRot: lerp(26, 62, up), armR: lerp(64, 112, up), bendR: lerp(30, 12, up), face: 'determined', t }, { arms: false });
  let o = ST.hallway.compose(t, cam, { crowd: 0.2, scatter: 0.8, doorOpen: 1, clock: '8:05' }, krump, '');
  o = dutch(o, -5);
  o += H.bossBar({ t, k: 1, value: 1, y: 120, w: 1100 });
  o += hudF(t, { theme: 'boss' });
  return o;
}

// ---- 6. "On my desk." — the stampede: kids sprint past her into Room 12, homework flying; she taps her foot
function shDesk(t) {
  const cam = camKeys(t, [[CUT.desk, camAt(1180, 600, 1.05)], [CUT.now, camAt(1200, 600, 1.12)]], ease.inOut);
  const x = HS.krumpOut.x + 120, y = 960, s = 0.52;
  const krump = actor('teacher', t, { x, y, s, armL: 10, armR: 10, bendL: -105, bendR: -105, face: 'determined', headRot: -6, legR: 8 * Math.max(0, Math.sin(t * 14)), t }, { arms: false });
  let runners = '', fx = '';
  for (let j = 0; j < 6; j++) {
    const t0 = B.run - 0.35 + j * 0.22;
    const u = seg(t, t0, t0 + 1.0);
    if (u <= 0 || u >= 1) continue;
    const ry = j % 2 ? 880 : 900, rs = hS(ry);
    const rx = lerp(-80, 1150, u);
    const into = seg(u, 0.8, 1);
    runners += kid(3 + j * 4, { x: rx, y: lerp(ry, 812, into), s: lerp(rs, hS(812) * 0.95, into), view: 'side', flip: true, ...AC.run(t * 18 + j, 1), armL: 150, face: 'scared', lean: 10 });
    fx += papers(rx + 30, ry - 430 * rs, t - t0 - 0.2, 2, j * 7 + 1, 0.4, 0.6);
  }
  let o = ST.hallway.compose(t, cam, { crowd: 0.3, scatter: 0.7, doorOpen: 1, clock: '8:05' }, runners, krump + fx);
  const head = H.overHead('teacher', x, y, s);
  o += plateAt(cam, 'teacher', head.x, head.y, { s: 0.85, t, k: 1, bars: [{ label: 'PATIENCE', value: 0, blink: true }] });
  o += hudF(t, { theme: 'boss' });
  return o;
}

// ---- 7. "NOW." — extreme close-up, shockwave, the word slams
function shNow(t) {
  const x = HS.krumpOut.x, y = HS.krumpOut.y, s = HS.krumpOut.s;
  const fy = y - 1340 * s * 0.6;
  const cam = shakeAll(camKeys(t, [[CUT.now, camAt(x + 6, fy, 2.9)], [B.nowHit, camAt(x + 6, fy, 3.4)], [CUT.tank, camAt(x + 6, fy, 3.6)]], ease.out), t, [[B.nowHit, 0.6, 30]]);
  const krump = actor('teacher', t, { x, y, s, glare: t > B.nowHit ? 0.4 : 0, face: { name: 'angry' }, t, volume: false }, { arms: false });
  let o = ST.hallway.compose(t, cam, { crowd: 0, doorOpen: 1, clock: '8:05' }, krump, '');
  const age = t - B.nowHit;
  o += dim(0.12 + 0.2 * bump(t, B.nowHit, B.nowHit + 0.5), '#6A0012');
  o += rings(960, 600, age, '#FFFFFF', 3, 1100, 0.55) + zoomLines(960, 560, seg(t, B.nowHit - 0.05, B.nowHit + 0.05) * (1 - seg(t, B.nowHit + 0.5, CUT.tank)), t, '#FFFFFF', 26, 520);
  o += papers(260, 1060, age, 5, 3, 1.6, 1.2) + papers(1660, 1060, age, 5, 9, 1.6, 1.2);
  o += K.bang('NOW.', 1470, 330, pop(t, B.nowHit, 0.22), 230, 10, '#FF3B4E');
  o += hudF(t, { theme: 'boss', glitch: 0.4 * bump(t, B.nowHit, B.nowHit + 0.5) });
  return o + smash(t, B.nowHit, 0.1, 0.7);
}

// ---- 8. "The school bully? Level eighty." — the deep hall: Tank walks down the middle, kids flatten against the lockers
function shTank(t) {
  const u = seg(t, CUT.tank, CUT.health);
  const D = lerp(4.6, 2.05, u);
  const p = DP.at(D, 0);
  const K6 = 5.2;
  const stepT = (n) => CUT.tank + (Math.PI * n) / K6;
  const shakes = [];
  for (let n = 0; n < 8; n++) shakes.push([stepT(n + 0.5), 0.18, 5 + 3 * u]);
  const cam = shakeAll(camKeys(t, [[CUT.tank, camAt(960, 590, 1.3)], [CUT.health, camAt(960, 640, 1.52)]], ease.inOut), t, shakes);
  const sc0 = seg(t, B.scatter, B.scatter + 0.7);
  // two kids in the middle dive out of the way
  let chars = '';
  [[2.2, -1, 25, 0.1], [2.6, 1, 33, 0.25]].forEach(([Dk, side, i, d]) => {
    const dv = ease.inOut(seg(t, B.scatter + d, B.scatter + d + 0.45));
    const q = DP.at(Dk, lerp(side * 140, side * 690, dv));
    chars += kid(i, { ...q, lift: 90 * q.s * bump(dv, 0, 1), rot: side * 14 * bump(dv, 0, 1), face: 'scared', armL: 60 + 90 * dv, armR: 60 + 90 * dv });
  });
  chars += actor('tank', t, { ...p, ...AC.walkFront((t - CUT.tank) * K6, 1), face: 'determined', t });
  let o = ST.hallway.compose(t, cam, { view: 'deep', crowd: 1, scatter: sc0, clock: '8:05' }, '', chars);
  const head = H.overHead('tank', p.x, p.y, p.s);
  o += plateAt(cam, 'tank', head.x, head.y, { s: 0.95, t, k: seg(t, B.tankPlate, B.tankPlate1 + 0.05), tags: [] });
  o += hudF(t);
  return o;
}

// ---- 9. "But his health... is almost zero." — he stops right in front of us; push into the blinking HP bar; the growl
function shHealth(t) {
  const p = DP.tankEnd;
  const fy = p.y - 1237 * p.s;
  const tGrowl = B.growl;
  const cam = shakeAll(camKeys(t, [[CUT.health, camAt(960, fy + 240, 1.55)], [B.health, camAt(960, fy + 150, 1.85)], [B.zero + 0.3, camAt(960, fy + 120, 2.05)], [tGrowl, camAt(960, fy + 230, 1.6)], [CUT.locker, camAt(960, fy + 240, 1.55)]], ease.inOut), t, [[tGrowl, 0.5, 9]]);
  const look = seg(t, tGrowl + 0.1, tGrowl + 0.35) * (1 - seg(t, CUT.locker - 0.35, CUT.locker - 0.1));
  const tank = actor('tank', t, { ...p, face: look > 0.4 ? { name: 'confused', eyes: { look: [0, 0.8] } } : 'determined', headRot: 0, headY: 10 * look, t, volume: false });
  let o = ST.hallway.compose(t, cam, { view: 'deep', crowd: 1, scatter: 1, clock: '8:05' }, '', tank);
  o += dim(0.2 * seg(t, B.health - 0.2, B.health + 0.3) * (1 - seg(t, tGrowl, tGrowl + 0.4)), '#1A0A20');
  const head = H.overHead('tank', p.x, p.y, p.s);
  const beat = bump(t, B.zero, B.zero + 0.3) + 0.6 * bump(t, B.health, B.health + 0.3);
  o += plateAt(cam, 'tank', head.x, head.y, { s: 1.35 + 0.08 * beat, t, k: 1, tags: [], bars: [{ label: 'HP', value: 3, blink: true, bump: beat }] });
  if (t > B.zero - 0.1) o += H.edgePulse(0, 0, 1920, 1080, 0.5 * bump(t, B.zero - 0.1, B.zero + 0.9));
  // the stomach growl
  const gk = pop(t, tGrowl, 0.25) * (1 - seg(t, tGrowl + 0.9, tGrowl + 1.2));
  const belly = toScr(cam, p.x, p.y - 1237 * p.s * 0.45);
  if (gk > 0) o += S.g(TFS('grrrumble...', 0, 0, 54, '#FFE14D'), `${tf(belly.x + 250, Math.min(belly.y, 900), gk, -8)} translate(${f(4 * Math.sin(t * 60))} 0)`);
  o += hudF(t);
  return o;
}

// ---- 10. "Your little brother?" — a locker rattles … BANG, Max bursts out in his dinosaur suit
const LK = { x: 408, y: 470, w: 92, h: 330 };
function shLocker(t) {
  const cam = shakeAll(camKeys(t, [[CUT.locker, camAt(470, 650, 1.75)], [B.burst, camAt(470, 655, 1.85)], [B.maxLand, camAt(520, 700, 1.5)], [CUT.chaos, camAt(500, 710, 1.45)]], ease.inOut), t, [[B.burst, 0.35, 16]]);
  const rattle = t < B.burst ? Math.max(0, Math.sin((t - B.rattle) * 22)) * seg(t, B.rattle, B.rattle + 0.1) : 0;
  const open = ease.outBack(seg(t, B.burst, B.burst + 0.2));
  const fly = seg(t, B.burst, B.maxLand);
  const mx = lerp(LK.x + 46, 520, fly), my = lerp(LK.y + LK.h, 960, ease.in(fly)), ms = lerp(hS(800), 0.5, fly);
  const lift = 220 * bump(fly, 0, 1);
  let behind = lockerDoor(LK.x, LK.y, LK.w, LK.h, open, rattle);
  let front = '';
  const landed = t > B.maxLand;
  const max = actor('max', t, { x: mx, y: my, s: ms, lift, roar: !landed || t > B.maxLand + 0.15, rot: landed ? 0 : -20 * Math.sin(fly * Math.PI), ...boing(t, B.maxLand, 0.3), face: landed ? { name: 'excited' } : { name: 'angry', mouth: 'scream' }, t });
  if (t > B.burst - 0.02) front += max; else if (rattle > 0.3) behind += S.g(TFS('thump', 0, 0, 34, '#FFFFFF'), tf(LK.x + 46 + 70, LK.y + 110 + 30 * Math.sin(t * 9), 1, 10));
  front += papers(LK.x + 60, LK.y + 150, t - B.burst, 6, 5, 1.2, 0.5);
  const kids = kid(20, { x: 800, y: 960, s: 0.5, turn: -0.5, face: t > B.burst ? { name: 'shocked', fx: ['exclaim'] } : 'neutral', ...boing(t, B.burst + 0.05, 0.25), lean: t > B.burst ? -8 : 0 });
  let o = ST.hallway.compose(t, cam, { crowd: 0, clock: '8:05' }, behind, kids + front);
  o += K.bang('BANG!', 560, 260, pop(t, B.burst, 0.2) * (1 - seg(t, B.burst + 0.5, B.burst + 0.7)), 130, -10, '#FFD21F');
  o += hudF(t);
  return o + smash(t, B.burst, 0.08, 0.6);
}

// ---- 11. "Chaos: nine thousand, nine hundred ninety-nine." — Max tears through the hall, kids spin, CHAOS rolls up
function shChaos(t) {
  const X0 = 520, X1 = -1750;
  const u = seg(t, CUT.chaos, CUT.rawr);
  const mx = lerp(X0, X1, u), my = 965, ms = 0.5;
  const cam = camKeys(t, [[CUT.chaos, camAt(X0 - 140, 700, 1.32)], [CUT.rawr, camAt(X1 - 180, 700, 1.38)]], (x) => x);
  const tHit = (kx) => CUT.chaos + ((X0 - kx) / (X0 - X1)) * (CUT.rawr - CUT.chaos);
  let chars = '', fx = '';
  [[40, 26, 930], [-520, 31, 935], [-1080, 13, 925], [-1520, 22, 935]].forEach(([kx, i, ky], j) => {
    const h0 = tHit(kx) - 0.04;
    const a = clamp((t - h0) / 0.9, 0, 1);
    const spin = a > 0 ? 720 * ease.out(a) * (j % 2 ? 1 : -1) : 0;
    const ks = hS(ky);
    chars += kid(i, { x: kx - 80 * ease.out(a), y: ky, s: ks, lift: 160 * bump(a, 0, 0.7), rot: spin, face: a > 0 ? 'dizzy' : 'happy', armL: a > 0 ? 150 : 10, armR: a > 0 ? 150 : 10 });
    fx += papers(kx, ky - 400 * ks, t - h0, 3, i, 0.8, 0.55);
    if (a > 0 && a < 0.4) fx += K.C.burst(kx - 40, ky - 300 * ks, a * 2.5, '#FFE14D');
  });
  chars += actor('max', t, { x: mx, y: my, s: ms, view: 'side', ...AC.run((t - CUT.chaos) * 20, 1.15), lean: -14, roar: false, face: { name: 'excited', mouth: 'scream' }, t });
  for (let k = 0; k < 6; k++) { const t0 = CUT.chaos + 0.1 + k * 0.45; fx += K.C.dust(lerp(X0, X1, seg(t0, CUT.chaos, CUT.rawr)) + 50, my, t0, t); }
  let o = ST.hallway.compose(t, cam, { crowd: 0.7, clock: '8:05' }, '', chars + fx);
  o += streaks(t, 380, 980, 10, 5, '#FFFFFF', 0.35, 2600, 1);
  const head = H.overHead('max', mx, my, ms);
  const q = toScr(cam, head.x, head.y);
  const c = chaosAt(t);
  o += H.plateFor('max', { x: q.x, y: q.y, s: 1.05, t, k: seg(t, B.maxPlate, B.maxPlate + 0.45), bars: [{ label: 'CHAOS', value: c.v, max: 100, bump: c.bump }, { label: 'HP', value: Infinity }] });
  if (c.v >= 9999) o += K.bang('9999!', q.x + 300, q.y - 60, pop(t, B.chaos[3][0] + 0.3, 0.25), 80, 8, '#FF4FD8');
  o += hudF(t);
  return o;
}

// ---- 12. MAX: "RAWR!" — skids, spins to us, smash-zoom roar; the kids behind blown back
function shRawr(t) {
  const mx = -1750, my = 965, ms = 0.5;
  const fy = my - 664 * ms * 0.62;
  const cam = shakeAll(camKeys(t, [[CUT.rawr, camAt(mx, fy - 20, 2.1)], [B.rawr + 0.1, camAt(mx, fy - 10, 2.6)], [CUT.lunch, camAt(mx, fy - 10, 2.75)]], ease.out), t, [[B.rawr, 0.6, 26]]);
  const roar = t > B.rawr - 0.08;
  let behind = '';
  [[-2050, 27, 950], [-1450, 8, 955]].forEach(([kx, i, ky], j) => {
    const a = seg(t, B.rawr, B.rawr + 0.3);
    behind += kid(i, { x: kx + (j ? 1 : -1) * 60 * a, y: ky, s: hS(ky), lean: (j ? 1 : -1) * 18 * a, face: a > 0 ? { name: 'scared', fx: ['sweat'] } : 'neutral', armL: 20 + 120 * a, armR: 20 + 120 * a });
  });
  const max = actor('max', t, { x: mx, y: my, s: ms, roar, ...(roar ? { face: { name: 'angry', mouth: 'scream' } } : { view: 'side', lean: 12, face: 'excited' }), ...boing(t, B.rawr - 0.05, 0.25), t, volume: false });
  let o = ST.hallway.compose(t, cam, { crowd: 0.4, clock: '8:05' }, behind, max);
  o += zoomLines(960, 560, seg(t, B.rawr - 0.05, B.rawr + 0.1) * (1 - seg(t, A[5].b, A[5].b + 0.2)), t, '#FFFFFF', 24, 440);
  o += rings(960, 600, t - B.rawr, '#7CFF6B', 2, 1000, 0.5);
  o += K.bang('RAWR!', 1460, 640, pop(t, B.rawr + 0.05, 0.22), 190, 10, '#7CFF6B');
  const head = H.overHead('max', mx, my, ms);
  const q = toScr(cam, head.x, head.y);
  o += H.plateFor('max', { x: q.x, y: Math.max(q.y, 330), s: 1.15, t, k: 1, bars: [{ label: 'CHAOS', value: 9999, max: 100, bump: bump(t, B.rawr, B.rawr + 0.4) }, { label: 'HP', value: Infinity }] });
  o += hudF(t, { glitch: 0.5 * bump(t, B.rawr, B.rawr + 0.5) });
  return o + smash(t, B.rawr, 0.08, 0.5);
}

// ---- 13. "The lunch lady? Level fifty. Secret skill:" — she slops the meat; plate pops; the SECRET SKILL tag slaps on
function shLunch(t) {
  const cam = camKeys(t, [[CUT.lunch, camAt(1720, 470, 1.4)], [B.secret - 0.2, camAt(1730, 450, 1.52)], [CUT.meat, camAt(1740, 440, 1.62)]], ease.inOut);
  const sl = Math.max(bump(t, B.ladle[0], B.ladle[0] + 0.7), bump(t, B.ladle[1], B.ladle[1] + 0.7));
  const lady = actor('lunchLady', t, { ...CF.lunchLady, freeArms: true, armR: 40 + 60 * sl, bendR: -40 + 50 * sl, armL: 14, face: t > B.ladyPlate ? { name: 'smug' } : 'neutral', headRot: 4 * Math.sin(t * 2), t });
  let o = ST.cafeteria.compose(t, { crowd: 1, steam: true }, ['', '', lady], '', cam);
  const head = H.overHead('lunchLady', CF.lunchLady.x, CF.lunchLady.y, CF.lunchLady.s);
  o += plateAt(cam, 'lunchLady', head.x, head.y, { s: 1.35, t, k: seg(t, B.ladyPlate, B.ladyPlate1 + 0.05), title: '' });
  const hq = toScr(cam, head.x, head.y);
  o += E.chip(hq.x + 440, hq.y + 150, 'SECRET SKILL:', 'MYSTERY MEAT', seg(t, B.secret, B.secret + 0.35), t, { theme: 'error', col: '#FFD6F5', size: 44, rot: 4 });
  o += hudF(t);
  return o;
}

// ---- 14. "...mystery meat." — smash-zoom on the pan: ??? tooltip, the meat opens an EYE and looks at us
function shMeat(t) {
  const m = CF.food.meat;
  const cam = shakeAll(camKeys(t, [[CUT.meat, camAt(m.x - 60, m.y - 90, 2.7)], [CUT.every, camAt(m.x - 40, m.y - 80, 3.1)]], ease.out), t, [[B.eye, 0.25, 6]]);
  let o = ST.cafeteria.compose(t, { crowd: 1, steam: true }, ['', '', actor('lunchLady', t, { ...CF.lunchLady, face: 'smug', t })], '', cam);
  const op = ease.outBack(seg(t, B.eye, B.eye + 0.25));
  const blink = bump(t, B.eye + 0.9, B.eye + 1.05);
  const look = lerp(0, -0.6, seg(t, B.eye + 0.4, B.eye + 0.6));
  o += view(cam, meatEye(m.x + 4, m.y + 8, 20, op, look, blink), 1);
  const q = toScr(cam, m.x, m.y - 10);
  o += H.tipFor('mysteryMeat', { x: q.x + 60, y: q.y - 20, t, s: 1.6, k: seg(t, B.meatTip, B.meatTip + 0.45), side: 'right', dist: 170 });
  o += hudF(t);
  return o + smash(t, CUT.meat, 0.08, 0.4);
}

// ---- 15. "You could see everybody's stats." — slow motion: the hero walks through everyone's plates… nothing over him
const HERO_X0 = 2260;
function shEvery(t) {
  const u = seg(t, CUT.every, CUT.door);
  const tw = CUT.every + (t - CUT.every) * 0.3;                   // the world in slow motion
  const hx = HERO_X0 + 260 * u, hy = 960;
  const cam = camKeys(t, [[CUT.every, camAt(HERO_X0 + 40, 640, 1.18)], [CUT.door, camAt(HERO_X0 + 300, 600, 1.3)]], ease.inOut);
  const lookUp = seg(t, B.lookUp, B.lookUp + 0.3);
  const hero = actor('you', t, { x: hx, y: hy, s: 0.5, view: lookUp > 0.5 ? 'front' : 'side', flip: true, ...(lookUp > 0.5 ? {} : AC.walk(t * 4.5, 0.7)), face: lookUp > 0.5 ? { name: 'confused', eyes: { look: [0, -1] } } : { name: 'amazed', eyes: { look: [0.4, -0.6] } } }, { arms: false });
  const ppl = [[HERO_X0 - 420, 2, 960, 'front'], [HERO_X0 + 660, 10, 975, 'front']];
  let chars = '';
  ppl.forEach(([x, i, y, v], j) => { chars += kid(i, { x: x + (j === 2 ? (tw - CUT.every) * 80 : 0), y, s: hS(y), view: v, flip: true, ...(j === 2 ? AC.walk(tw * 6, 0.8) : {}), face: 'happy' }); });
  let o = ST.hallway.compose(tw, cam, { crowd: 1, clock: '8:06' }, '', chars + hero);
  o += crowdPlates(cam, ST.hallway.crowdAt(tw, { crowd: 1 }), t, () => 1, { scale: 2.0, max: 0.9 });
  ppl.forEach(([x, i, y], j) => {
    const xx = x + (j === 2 ? (tw - CUT.every) * 80 : 0), s = hS(y);
    const q = toScr(cam, xx, y - 935 * s);
    o += H.miniPlate({ x: q.x, y: q.y, s: 1.0, k: 1, t, name: E.NAMES[i % E.NAMES.length], level: 4 + i, hp: 0.5 + 0.1 * j });
  });
  // over the hero: nothing … the reticle searches
  const hq = toScr(cam, hx, hy - 951 * 0.5);
  o += scanReticle(hq.x, hq.y - 90, 80, t, seg(t, B.lookUp, B.lookUp + 0.3));
  if (t > B.lookUp + 0.45) o += H.TL('?', hq.x, hq.y - 70 + 6 * Math.sin(t * 6), 70, '#7CF7FF', { stroke: '#03101B', 'stroke-width': 7, 'paint-order': 'stroke', opacity: f(seg(t, B.lookUp + 0.45, B.lookUp + 0.6)) });
  o += hudF(t);
  return o;
}

// ---- 16. "Everybody's..." — he checks above his own head (reticle: NO DATA) and pushes into the BOYS room
function shDoor(t) {
  const d = HS.restroomDoor;
  const cam = camKeys(t, [[CUT.door, camAt(d.x - 120, 560, 1.45)], [CUT.mirror, camAt(d.x - 40, 560, 1.6)]], ease.inOut);
  const walk = ease.inOut(seg(t, B.enter - 0.15, CUT.mirror));
  const hx = lerp(d.x - 200, d.x, walk), hy = lerp(930, d.y + 8, walk), hs = lerp(hS(930), d.s, walk);
  const back = walk > 0.05;
  const hero = actor('you', t, { x: hx, y: hy, s: hs, view: back ? 'back' : 'front', ...(back && walk < 1 ? AC.walkFront(t * 7, 0.8) : {}), face: { name: 'confused', eyes: { look: [0.2, -1] } } }, { arms: false });
  let o = ST.hallway.compose(t, cam, { crowd: 0, restroomOpen: ease.out(seg(t, B.enter - 0.25, B.enter + 0.1)), clock: '8:06' }, hero, '');
  const hq = toScr(cam, hx, hy - 951 * hs);
  const k = seg(t, CUT.door, CUT.door + 0.25) * (1 - seg(t, B.enter - 0.1, B.enter + 0.1));
  o += scanReticle(hq.x, hq.y - 90, 84, t, k, '#FF5A7A');
  if (k > 0.5) o += H.TF('SELF-SCAN: NO DATA', hq.x + 40, hq.y - 214, 34, '#FF8AA0', { stroke: '#03101B', 'stroke-width': 7, 'paint-order': 'stroke', 'letter-spacing': 2 });
  o += hudF(t);
  return o;
}

// ---- 17. "...except yours." — the mirror over his shoulder: on "yours" the ??? pops over his reflection
function mirrorShot(t, cam, o2 = {}) {
  const r = MR.reflection;
  const lean = o2.lean || 0;
  const refl = S.g(S.g(actor('you', t, { x: r.x, y: r.y, s: r.s * (1 + lean * 0.06), face: o2.face || 'neutral', headRot: o2.headRot || 0, ...(o2.pose || {}) }, { arms: false }), `translate(${2 * r.x} 0) scale(-1 1)`), null, { 'clip-path': `url(#${MR.clip})` });
  const hero = actor('you', t, { ...MR.hero, x: MR.hero.x + 30 * lean, y: MR.hero.y - 20 * lean, s: MR.hero.s * (1 + lean * 0.05), headRot: -(o2.headRot || 0), volume: false });
  return ST.mirror.compose(t, { flicker: o2.flicker || 0 }, [refl], hero, cam);
}
function shMirror(t) {
  const cam = camKeys(t, [[CUT.mirror, { x: 0, y: 0, zoom: 1 }], [CUT.qm, camAt(1000, 470, 1.18)]], ease.inOut);
  let o = mirrorShot(t, cam, { face: t > B.qPop + 0.2 ? { name: 'confused', fx: ['question'] } : 'neutral', lean: seg(t, CUT.mirror, CUT.qm) * 0.4 });
  const q = toScr(cam, MR.qmarks.x, MR.qmarks.y + 6);
  o += H.heroPlate({ x: q.x, y: q.y, s: 1.0, t, k: seg(t, B.qPop, B.qPop + 0.45) });
  o += hudF(t);
  return o;
}

// ---- 18. YOU: "Question marks?" — push into the reflection, he leans in, squints at the plate
function shQm(t) {
  const cam = camKeys(t, [[CUT.qm, MR.cams.reflection], [CUT.why, camAt(1030, 330, 2.15)]], ease.inOut);
  let o = mirrorShot(t, cam, { face: { name: 'confused', eyes: { look: [0, -0.8] } }, lean: 0.4 + 0.6 * seg(t, CUT.qm, CUT.why), headRot: 8 * Math.sin((t - CUT.qm) * 2.2) });
  const q = toScr(cam, MR.qmarks.x, MR.qmarks.y + 6);
  o += H.heroPlate({ x: q.x, y: q.y, s: 1.0 * Math.pow(cam.zoom, 0.55), t, k: 1, reveal: 0.08 * bump(t, w(8, 'marks'), w(8, 'marks') + 0.6) });
  o += hudF(t);
  return o;
}

// ---- 19. YOU: "Why do I get QUESTION MARKS?!" — the camera IS the mirror: he yells at us; smash-zoom on QUESTION
function faceShot(t, cam, pose = {}, act = {}) {
  const fh = MR.face.hero;
  const hero = actor('you', t, { ...fh, volume: (cam.zoom || 1) > 1.3 ? false : undefined, ...pose }, act);
  return ST.mirror.compose(t, { view: 'face', flicker: 0.3 }, [hero], '', cam);
}
function shWhy(t) {
  const cam = shakeAll(camKeys(t, [[CUT.why, MR.cams.face], [B.qShout - 0.05, camAt(960, 640, 1.08)], [B.qShout + 0.08, camAt(960, 560, 1.5)], [CUT.swat, camAt(960, 560, 1.58)]], ease.out), t, [[B.qShout, 0.5, 20]]);
  const yell = seg(t, B.qShout - 0.1, B.qShout + 0.1);
  const flail = Math.sin(t * 16);
  let o = faceShot(t, cam, { armL: lerp(30, 120 + 20 * flail, yell), armR: lerp(30, 120 - 20 * flail, yell), face: yell > 0.5 ? { name: 'angry' } : { name: 'confused' }, ...boing(t, B.qShout, 0.18) }, { arms: false, energy: 1.6 });
  const fh = MR.face.hero;
  const q = toScr(cam, fh.x, fh.y - 951 * fh.s);
  o += zoomLines(960, 520, yell * (1 - seg(t, A[8].b, A[8].b + 0.2)), t, '#FFFFFF', 22, 520);
  o += H.heroPlate({ x: q.x, y: Math.max(q.y, 230), s: 0.9 * Math.pow(cam.zoom, 0.6), t, k: 1, reveal: 0.06 + 0.12 * yell });
  o += hudF(t, { glitch: 0.35 * yell });
  return o + smash(t, B.qShout, 0.08, 0.5);
}

// ---- 20. (beat) he jumps and swats at the plate — it dodges left, right … (freeze)
function shSwat(t) {
  const cam = camKeys(t, [[CUT.swat, camAt(960, 560, 1.4)], [CUT.pause, camAt(960, 600, 1.2)]], ease.inOut);
  const fh = MR.face.hero;
  const s1 = seg(t, B.swats[0], B.swats[0] + 0.35), s2 = seg(t, B.swats[1], B.swats[1] + 0.35);
  const j1 = bump(t, B.swats[0] - 0.08, B.swats[0] + 0.42), j2 = bump(t, B.swats[1] - 0.08, B.swats[1] + 0.42), j3 = ease.out(seg(t, CUT.pause - 0.32, CUT.pause - 0.04));
  const lift = 120 * Math.max(j1, j2, 0.7 * j3);
  const armR = 20 + 160 * bump(s1, 0, 1) + 130 * j3, armL = 20 + 160 * bump(s2, 0, 1) + 130 * j3;
  let o = faceShot(t, cam, { lift, armL, armR, face: j3 > 0.5 ? { name: 'scream' } : { name: lift > 20 ? 'determined' : 'angry' }, legL: -14 * j3, legR: 14 * j3, kneeL: 30 * j3, kneeR: 30 * j3, ...boing(t, B.swats[0] + 0.42, 0.2) }, { arms: false });
  const q = toScr(cam, fh.x, fh.y - 951 * fh.s);
  const dodge = -260 * bump(t, B.swats[0] + 0.02, B.swats[0] + 0.55) + 280 * bump(t, B.swats[1] + 0.02, B.swats[1] + 0.55);
  const dy = -60 * Math.max(bump(t, B.swats[0] + 0.02, B.swats[0] + 0.55), bump(t, B.swats[1] + 0.02, B.swats[1] + 0.55));
  o += H.heroPlate({ x: q.x + dodge, y: q.y + dy, s: 1.1, t, k: 1, reveal: 0.05 });
  o += S.g(TFS('nope!', 0, 0, 58, '#7CF7FF'), tf(q.x + dodge * 1.3, q.y - 220, pop(t, B.swats[0] + 0.1, 0.2) * (1 - seg(t, B.swats[0] + 0.5, B.swats[0] + 0.6)), -8));
  o += S.g(TFS('nope!', 0, 0, 58, '#7CF7FF'), tf(q.x + dodge * 1.3, q.y - 220, pop(t, B.swats[1] + 0.1, 0.2) * (1 - seg(t, B.swats[1] + 0.5, B.swats[1] + 0.6)), 8));
  o += hudF(t);
  return o;
}

// ---- 21. NARRATOR: "Okay." — VHS PAUSE on the frozen jump
function shPause(t) {
  let o = shSwat(B.freeze - 0.01);
  o = S.g(o, `translate(0 ${f(Math.floor(t * 12) % 2 ? 2 : -1)})`);
  o += dim(0.18, '#2A1E4A');
  o += tracking(t, 0.8, false) + osd(t, 'pause');
  return o;
}

// ---- 22. "Let's start from the beginning." — REWIND through the whole cold open
function shRewind(t) {
  const u = seg(t, CUT.rewind, CUT.title);
  const tr = lerp(B.freeze - 0.02, B.crt + 0.6, ease.in(u));
  let o = shotFn(tr)(tr);
  o = S.g(o, `translate(${f((hash(Math.floor(t * 30)) - 0.5) * 14)} 0)`);
  o += dim(0.1, '#2A1E4A');
  o += tracking(t, 1, true) + osd(t, 'rewind');
  return o;
}

// ---- 23. the plates fold into one point → the title card → white flash into SC 02
function shTitle(t) {
  let o = E.hudBg(t);
  const fold = ease.in(seg(t, CUT.title, B.slam));
  const cx = 960, cy = 470;
  const pl = [
    ['teacher', 380, 240], ['tank', 1540, 250], ['max', 300, 760], ['lunchLady', 1600, 780],
  ];
  pl.forEach(([who, x, y]) => {
    const k = 1 - fold;
    if (k <= 0.02) return;
    o += H.plateFor(who, { x: lerp(x, cx, fold), y: lerp(y, cy + 120, fold), s: 0.9 * (1 - 0.5 * fold), t, k, tags: who === 'tank' ? [] : undefined });
  });
  if (fold < 0.98) o += H.heroPlate({ x: lerp(960, cx, fold), y: lerp(1000, cy + 120, fold), s: 1, t, k: 1 - fold });
  const age = t - B.slam;
  if (age > -0.05 && age < 0.3) o += S.circle(cx, cy, 30 + 600 * seg(age, 0, 0.3), { fill: '#FFFFFF', opacity: f(0.8 * (1 - seg(age, 0, 0.3))) });
  o += E.title(t, seg(t, B.slam, B.slam + 0.8), { y: 470 });
  o += H.hudFrame({ t, k: 1, clock: '0:00', day: 'EP 1', minimap: false, closeX: false });
  if (age > 0) o += K.C.burst(cx, cy, seg(age, 0, 0.5), '#7CF7FF');
  o += smash(t, B.slam, 0.15, 0.85);
  // out: white flash into SC 02
  o += K.C.whiteFlash(seg(t, B.out, END));
  return o;
}

// ================================================================= dispatch
const SHOTS = [
  [CUT.open, shOpen], [CUT.sea, shSea], [CUT.krump, shKrump], [CUT.boss, shBoss], [CUT.homework, shHomework], [CUT.desk, shDesk], [CUT.now, shNow],
  [CUT.tank, shTank], [CUT.health, shHealth], [CUT.locker, shLocker], [CUT.chaos, shChaos], [CUT.rawr, shRawr], [CUT.lunch, shLunch], [CUT.meat, shMeat],
  [CUT.every, shEvery], [CUT.door, shDoor], [CUT.mirror, shMirror], [CUT.qm, shQm], [CUT.why, shWhy], [CUT.swat, shSwat], [CUT.pause, shPause],
  [CUT.rewind, shRewind], [CUT.title, shTitle],
].sort((a, b) => a[0] - b[0]);
function shotIndex(t) {
  let i = SHOTS.length - 1;
  while (i > 0 && t < SHOTS[i][0]) i--;
  return i;
}
const shotFn = (t) => SHOTS[shotIndex(t)][1];
function scene(t) {
  return shotFn(t)(t);
}
function look(t) {
  if (t >= CUT.title) return { grade: null, vignette: 0.6 };
  if (t >= CUT.pause) return { grade: 'cool', vignette: 0.7 };
  if ((t >= CUT.boss && t < CUT.homework) || (t >= CUT.now && t < CUT.tank)) return { grade: 'warm', vignette: 0.9 };
  if (t >= CUT.every && t < CUT.door) return { grade: 'cool', vignette: 0.55 };
  return { grade: 'warm', vignette: 0.4 };
}
module.exports = { scene, look, SHOTS, CUT, BEATS: B };
