// SC 05 · ШКОЛА — the laptop goes to school: Brick cuts the lunch line -> ";jail Brick" (the cage slams down), ";tp me to the
// front of the line" (the lunch lady jumps), the mile run -> ";speed me" (sonic boom, the coach's whistle melts, 0:00.3, the
// shoes do not survive), the math test -> ";noclip me" (through the chalkboard... into Principal Pratt's office), "Noclip me
// AWAY!" (through the floor), the hallway: everybody wants a command (montage, the KID: fly / GIANT / BOTH), Zoe warns about
// the logs, "Nobody reads the logs." — a dark room, a wrinkled hand stops the scrolling log, the eyes glint.
'use strict';

const K = require('./kit');
const { S, f, clamp, lerp, ease, seg, bump, hash, ol, ln, T, TF, camKeys, view, actor } = K;
const { L } = K.V;
const AC = require('./acting');
const SETS = require('./sets');
const X = require('./s05_env');
const { faceAt, tf, TS, TFS, pop, at, toScr, shakeAll, clipTo, whip, smash, zoomLines, cmd, typeBetween, hero, heroSocks, ghost, scanShimmer, smoke, dustPuff, bubble, bang } = X;
const { fireTrail } = require('../rig/cast');

const A = Array.from({ length: 21 }, (_, i) => L('05.' + i));
const T0 = K.V.scene('SC 05').start;
const w = (i, word, n = 0) => A[i].word(word, n).t0;
const w1 = (i, word, n = 0) => A[i].word(word, n).t1;
const kid = (i, pose) => K.draw.kid(i, { shade: true, shadow: true, ...pose });

// ---------------------------------------------------------------- cuts and beats (all from the voice)
const CUT = {};
CUT.yard = T0;
CUT.line = A[1].a - 0.32;
CUT.low = w(1, 'Lunch') - 0.12;
CUT.jail = A[2].a - 0.12;
const tJail = A[2].b + 0.02;
CUT.cage = tJail + 0.06;
const tCage = w(3, 'CAGE');
CUT.stare = A[4].a - 0.1;
const tCouldnt = w(4, "couldn't");
CUT.tp = A[5].a - 0.15;
const tTp = A[5].b + 0.02;
CUT.gym = w(6, 'The') - 0.15;
CUT.speed = A[7].a - 0.12;
const tSpeed = A[7].b + 0.02;
CUT.boom = tSpeed + 0.04;
CUT.score = w(8, 'zero') - 0.1;
const tThree = w(8, 'three');
CUT.shoes = w(8, 'Your') - 0.15;
CUT.coach = A[9].a - 0.12;
CUT.socks = w(9, 'Also') - 0.15;
CUT.cls = A[10].a - 0.1;
CUT.nclip = A[11].a - 0.12;
const tNoclip = A[11].b + 0.02;
CUT.walk = A[12].a - 0.05;
CUT.office = w(12, 'It') - 0.1;
CUT.pratt = A[13].a - 0.12;
CUT.two = w(13, 'Did') - 0.12;
CUT.no = A[14].a - 0.1;
const tAway = A[14].b + 0.02;
CUT.fall = tAway + 0.04;
CUT.pop = w(15, 'you') - 0.12;
CUT.wanted = A[16].a - 0.1;
CUT.yes = w(16, 'And') - 0.1;
CUT.fly = w(16, 'To') - 0.08;
CUT.split = w(16, 'everybody', 1) + 0.18;
CUT.kid1 = A[17].a - 0.1;
CUT.kid2 = w(17, 'No') - 0.08;
CUT.kid3 = w(17, 'No', 1) - 0.1;
CUT.zoe = w(18, 'Please') - 0.15;
CUT.logs = w(18, 'The') - 0.1;
CUT.zoe2 = w(18, 'Somebody') - 0.12;
CUT.relax = A[19].a - 0.12;
CUT.dark = A[20].a - 0.1;
CUT.eyes = w(20, 'the') - 0.06;
// keep the cuts in order even if the real voice squeezes them (min 0.2 s per shot)
{
  const ks = Object.keys(CUT);
  for (let i = 1; i < ks.length; i++) if (CUT[ks[i]] < CUT[ks[i - 1]] + 0.2) CUT[ks[i]] = CUT[ks[i - 1]] + 0.2;
}
// a few command beats
const tFlyKid = w(17, 'No') - 0.16, tGiant = w1(17, 'GIANT') + 0.02, tBoth = A[17].b + 0.02;

// compose a room set: L = set.layers(...)
const room = (Lr, cam, behind, chars, kbg = 0.92) => view(cam, Lr.bg, kbg) + view(cam, Lr.mid + behind + Lr.front + chars + (Lr.fg || '') + (Lr.light || ''), 1);
const breathe = (t, ph = 0) => ({ bodyY: 3 + 3 * Math.sin(t * 4.2 + ph) });
// fast typing arms (front view)
const typing = (t, on = 1, base = 22) => ({ armL: base + (on ? Math.sin(t * 38) * 5 : 0), armR: base + (on ? Math.sin(t * 41 + 1.3) * 5 : 0) });
// squash/stretch impulse after t0
function boing(t, t0, amp = 0.25, dur = 0.7) {
  const k = t - t0;
  if (k < 0 || k > dur) return { sx: 1, sy: 1 };
  const v = amp * Math.exp(-k * 7) * Math.cos(k * 20);
  return { sx: 1 - v * 0.6, sy: 1 + v };
}

// ================================================================= SHOTS
// ---- 1. the schoolyard: you walk in with the laptop (turn to camera on "laptop")
function shYard(t) {
  const Ly = SETS.schoolyard.layers(t, { time: 'day' });
  const tLap = w(0, 'laptop');
  const tStop = tLap - 0.25;
  const wu = seg(t, CUT.yard, tStop);
  const hx = lerp(-160, 900, wu);
  const u = ease.inOut(seg(t, CUT.yard + 0.25, tLap - 0.05));
  const cam = { zoom: lerp(1.42, 1.5, u), x: lerp(40, hx - 900, u), y: lerp(-250, 110, u) };
  let ch = '';
  // two kids heading for the doors
  ch += kid(3, { x: lerp(1560, 1180, seg(t, CUT.yard, CUT.line)), y: 880, s: 0.3, view: 'side', ...AC.walk(t * 8), face: 'happy' });
  ch += kid(12, { x: lerp(1820, 1430, seg(t, CUT.yard, CUT.line)), y: 905, s: 0.32, view: 'side', ...AC.walk(t * 8 + 2), face: 'neutral', volume: false });
  if (t < tStop) {
    ch += hero(t, { x: hx, y: 960, s: 0.5, view: 'side', flip: true, ...AC.walk((t - CUT.yard) * 8.5), face: 'happy' }, {}, { mode: 'under', glow: 0.3 });
  } else {
    const k = ease.outBack(seg(t, tStop, tStop + 0.3));
    ch += hero(t, { x: hx, y: 960, s: 0.5, turn: 0.35, armL: lerp(0, 14, k), armR: lerp(0, 14, k), lift: 26 * bump(t, tStop, tStop + 0.3), face: { name: 'sneaky', eyes: { look: [0.6, 0] } } }, {}, { mode: 'back', glow: 0.6 + 0.4 * bump(t, tLap, tLap + 0.5), y: -250 - 30 * k });
    const g = pop(t, tLap + 0.05, 0.25) * (1 - seg(t, tLap + 0.6, tLap + 0.9));
    if (g > 0) ch += SETS.sparkle(hx + 70, 960 - 320, 34 * g, '#9DFFC8') + SETS.sparkle(hx - 60, 960 - 380, 22 * g, '#FFFFFF');
  }
  return view(cam, Ly.bg, 0.6) + view(cam, Ly.mid + ch + Ly.light, 1);
}

// ---- cafeteria cast placement
const CAFE = { kidB: 1720, brick: 1380, hero0: 1120, hero1: 900, back1: 720, back2: 540, lady: 1800 };
const cafeLayers = (t) => SETS.cafeteria.layers(t, {});
function lady(t, pose = {}) { return X.lunchLady(t, { x: CAFE.lady, y: 890, s: 0.5, turn: -0.3, armR: 40, volume: false, ...breathe(t, 1), ...pose }); }
const brickCage = (t, part, drop = 1, x = CAFE.brick) => SETS.cage(x, 990, 1.25, t, { drop, part });

// ---- 2. the lunch line: Brick barges in ("Move, noob.")
function shLine(t) {
  const Lc = cafeLayers(t);
  const tMove = w(1, 'Move');
  const bu = ease.out(seg(t, CUT.line, tMove));
  const bx = lerp(520, CAFE.brick, bu);
  const shove = seg(t, tMove - 0.12, tMove + 0.15);
  const hx = lerp(CAFE.hero0, CAFE.hero1, ease.out(shove));
  const cam = shakeAll(camKeys(t, [[CUT.line, { zoom: 1.18, x: 160, y: 60 }], [CUT.low, { zoom: 1.26, x: 200, y: 70 }]]), t, [[tMove, 0.3, 14]]);
  let ch = '';
  ch += kid(1, { volume: false, x: CAFE.back2, y: 990, s: 0.42, view: 'side', flip: true, ...breathe(t, 2), face: 'neutral' });
  ch += kid(13, { volume: false, x: CAFE.back1, y: 990, s: 0.42, view: 'side', flip: true, ...breathe(t, 3), face: bu > 0.5 ? 'shocked' : 'neutral' });
  ch += kid(4, { volume: false, x: CAFE.kidB, y: 990, s: 0.42, view: 'side', flip: true, ...breathe(t, 4), face: 'happy' });
  const hit = t >= tMove - 0.1;
  ch += hero(t, { x: hx, y: 990, s: 0.5, view: 'side', flip: true, lean: hit ? -10 * (1 - seg(t, tMove + 0.2, tMove + 0.7)) : 0, ...boing(t, tMove - 0.05, 0.18), face: hit ? 'scared' : 'happy' }, {}, { mode: 'under', glow: 0.3 });
  const walking = t < tMove;
  ch += actor('brick', t, { x: bx, y: 990, s: 0.5, view: 'side', flip: walking, ...(walking ? AC.walk((t - CUT.line) * 14, 1.3) : { armL: 20, armR: 10 }), lean: walking ? 8 : -6, ...boing(t, tMove, 0.14), face: 'smug' }, { energy: 1.2 });
  let fx = '';
  if (walking) fx += K.C.speedLines(bx - 520, bx - 220, 700, 5, 3, '#FFFFFF', 340);
  fx += dustPuff(bx, 990, t - tMove, 0.8);
  fx += bang('SHOVE!', hx - 40, 520, pop(t, tMove, 0.2) * (1 - seg(t, tMove + 0.6, tMove + 0.8)), 70, -10, '#FFFFFF');
  return room(Lc, cam, lady(t, { face: 'neutral' }), ch + fx);
}

// ---- 3. low angle: Brick looms ("Lunch money.")
function shLow(t) {
  const Lc = cafeLayers(t);
  const u = seg(t, CUT.low, CUT.jail);
  const camBg = { zoom: 1.7, x: 300, y: -260 + 30 * u };
  let o = view(camBg, Lc.bg, 0.9) + view(camBg, Lc.mid + Lc.front, 1);
  const tMoney = w(1, 'money');
  o += S.g(actor('brick', t, { x: 1180, y: 1430, s: 1.0, volume: false, armR: lerp(30, 72, ease.outBack(seg(t, CUT.low + 0.1, tMoney))), armL: 14, lean: -4, headRot: -6, face: 'smug' }, { energy: 0.8, arms: false }), `translate(960 540) scale(${f(1 + 0.05 * u)}) translate(-960 -540)`);
  // the hero's head from behind (over the shoulder)
  o += hero(t, { x: 420, y: 1640, s: 1.0, view: 'back', headRot: -4, volume: false });
  return o;
}

// ---- 4. close: "Jail... Brick." (the command types, ENTER)
function shJail(t) {
  const Lc = cafeLayers(t);
  const u = seg(t, CUT.jail, CUT.cage);
  const camBg = { zoom: 1.9, x: 330, y: 10 };
  let o = view(camBg, Lc.bg, 0.9) + view(camBg, Lc.mid + Lc.front + actor('brick', t, { x: 1360, y: 990, s: 0.5, view: 'side', face: 'smug', volume: false }), 1);
  o += S.rect(0, 0, 1920, 1080, 0, { fill: '#0B2A1C', opacity: 0.25 });
  const z = 1 + 0.08 * ease.inOut(u) + 0.05 * bump(t, tJail, tJail + 0.25);
  let h = hero(t, { x: 960, y: faceAt(500, 1.15), s: 1.15, volume: false, ...typing(t, t < tJail, 14), face: { name: 'smug', eyes: { look: [-0.3, 0.2] } } }, {}, { mode: 'back', glow: 1, y: -300, s: 0.62 });
  o += S.g(h, `translate(960 540) scale(${f(z)}) translate(-960 -540)`);
  o += zoomLines(960, 520, 0.8 * bump(t, tJail, tJail + 0.3), t, '#9DFFC8');
  o += cmd(t, 960, 130, ';jail Brick', K.typeProgress(t, A[2], 'Jail', 'Brick'), tJail, { s: 1.9, tIn: CUT.jail });
  return o;
}

// ---- 5. wide: the cage slams down ("Hey! Who put a CAGE on me?!") — smash-zoom on CAGE
function shCage(t) {
  const Lc = cafeLayers(t);
  const drop = seg(t, tJail, tJail + 0.46);
  const tLand = tJail + 0.46 * 0.7;
  const tHey = w(3, 'Hey');
  const wide = { zoom: 1.08, x: 260, y: 30 };
  const close = { zoom: 2.4, ...{ x: CAFE.brick - 960, y: 470 - 540 } };
  const cam = shakeAll(camKeys(t, [[CUT.cage, wide], [tCage - 0.07, { ...wide, zoom: 1.12 }], [tCage, close], [CUT.stare, { ...close, zoom: 2.55 }]]), t, [[tLand, 0.45, 26], [tCage, 0.35, 12]]);
  const landed = t >= tLand;
  let ch = '';
  ch += kid(1, { volume: false, x: CAFE.back2, y: 990, s: 0.42, view: 'side', flip: true, face: landed ? 'shocked' : 'neutral', lift: 40 * bump(t, tLand, tLand + 0.35) });
  ch += kid(13, { volume: false, x: CAFE.back1, y: 990, s: 0.42, turn: 0.3, face: landed ? 'amazed' : 'neutral', ...breathe(t, 3) });
  ch += kid(4, { volume: false, x: CAFE.kidB + 30 * ease.out(seg(t, tLand, tLand + 0.3)), y: 990, s: 0.42, turn: -0.4, face: landed ? 'scared' : 'happy', lift: 70 * bump(t, tLand, tLand + 0.4), armL: landed ? 120 : 9, armR: landed ? 120 : 9 });
  ch += hero(t, { x: CAFE.hero1, y: 990, s: 0.5, turn: 0.4, ...breathe(t), face: landed ? { name: 'smug', eyes: { look: [0.7, 0] } } : 'sneaky' }, {}, { mode: 'back', glow: 0.8 });
  // Brick in the cage
  let bp;
  if (!landed) bp = { view: 'side', face: 'smug', armL: 20, armR: 10 };
  else {
    const grab = t >= w(3, 'Who');
    const shakeB = grab ? Math.sin(t * 40) * 7 : 0;
    bp = { turn: 0, lift: 90 * bump(t, tHey - 0.05, tHey + 0.35), armL: grab ? 150 : 120, armR: grab ? 150 : 120, x: CAFE.brick + shakeB, face: t >= tCage - 0.1 ? 'angry' : 'shocked' };
  }
  const brick = actor('brick', t, { x: CAFE.brick, y: 990, s: 0.5, ...bp, ...(landed ? { volume: false } : {}) }, { arms: false, energy: 1.4 });
  ch += brickCage(t, 'back', drop) + brick + brickCage(t, 'front', drop);
  let fx = K.commandBurst(CAFE.brick, 560, t - tJail, '#3DFF9A', 260);
  fx += bang('SLAM!', CAFE.brick + 260, 300, pop(t, tLand, 0.2) * (1 - seg(t, tLand + 0.7, tLand + 0.9)), 110, 8, '#7DFFB8');
  return room(Lc, cam, lady(t, { face: landed ? 'scream' : 'neutral', lift: 60 * bump(t, tLand, tLand + 0.5), armL: landed ? 150 : 9 }), ch + fx) + smash(t, tLand, 0.12, 0.5) + smash(t, tCage, 0.12, 0.7);
}

// ---- 6. everybody stares; smash-zoom on "couldn't move"
function shStare(t) {
  const Lc = cafeLayers(t);
  const tFirst = w(4, 'first'), tEver = w(4, 'ever'), tMove = w(4, 'move');
  const med = { zoom: 1.18, x: 300, y: 10 }, close = { zoom: 2.7, x: CAFE.brick - 960 + 10, y: 480 - 540 };
  const cam = shakeAll(camKeys(t, [[CUT.stare, med], [tCouldnt - 0.07, { ...med, zoom: 1.45, x: 360 }], [tCouldnt, close], [CUT.tp, { ...close, zoom: 2.85 }]]), t, [[tCouldnt, 0.3, 10]]);
  let ch = '';
  const laugh = Math.abs(Math.sin(t * 9));
  ch += kid(5, { volume: false, x: 780, y: 990, s: 0.44, turn: 0.5, armR: 70, armL: 60, props: [{ svg: X.phoneProp(-30, -440, 1.2, 0, Math.max(bump(t, tFirst, tFirst + 0.18), bump(t, tEver, tEver + 0.18))), layer: 'front' }], face: 'happy', ...breathe(t, 5) });
  ch += kid(3, { volume: false, x: 950, y: 990, s: 0.44, turn: 0.4, armR: 80 + 6 * Math.sin(t * 12), armL: 20, bodyY: 6 * laugh, face: 'joy' });
  ch += kid(4, { volume: false, x: 1760, y: 990, s: 0.42, turn: -0.5, face: 'joy', bodyY: 5 * laugh, armL: 30, armR: 40 });
  const strain = t >= tCouldnt;
  const give = seg(t, tMove + 0.15, tMove + 0.5);
  const bp = strain
    ? { armL: lerp(120, 40, give), armR: lerp(120, 40, give), bodyY: give > 0 ? 18 * give : 8 * Math.abs(Math.sin(t * 30)), x: CAFE.brick + (give > 0 ? 0 : Math.sin(t * 50) * 5), face: give > 0 ? { name: 'sad', fx: ['sweat'] } : { name: 'angry', fx: ['redface', 'sweat'], mouth: 'teeth' } }
    : { armL: -24, armR: -24, face: { name: 'angry', eyes: { look: [-0.5, 0.2] } }, ...breathe(t, 7) };
  ch += brickCage(t, 'back') + actor('brick', t, { x: CAFE.brick, y: 990, s: 0.5, ...bp, volume: false }) + brickCage(t, 'front');
  const fx = strain && give === 0 ? bang('NNNGH!', CAFE.brick + 170, 360, pop(t, tCouldnt + 0.05, 0.2), 64, 10, '#FFFFFF') : '';
  return room(Lc, cam, lady(t, { face: 'happy', armL: 30 }), ch + fx) + smash(t, tCouldnt, 0.12, 0.6);
}

// ---- 7. ";tp me to the front of the line": pan along the line, ENTER, pop! (the lunch lady jumps)
function shTp(t) {
  const Lc = cafeLayers(t);
  const tMe = w1(5, 'me'), tLine = w(5, 'line');
  const cam = camKeys(t, [[CUT.tp, { zoom: 1.3, x: CAFE.hero1 - 960 + 140, y: 60 }], [tMe, { zoom: 1.3, x: CAFE.hero1 - 960 + 160, y: 60 }], [tLine, { zoom: 1.18, x: 1700 - 960, y: 10 }], [CUT.gym, { zoom: 1.2, x: 1710 - 960, y: 10 }]]);
  shakeAll(cam, t, [[tTp + 0.05, 0.4, 14]]);
  const gone = t >= tTp;
  let ch = '';
  ch += kid(13, { volume: false, x: CAFE.back1, y: 990, s: 0.42, view: 'side', flip: true, ...breathe(t, 3) });
  const typingNow = t < tTp;
  if (!gone) ch += hero(t, { x: CAFE.hero1, y: 990, s: 0.5, turn: 0.25, ...typing(t, typingNow, 12), face: 'smug' }, {}, { mode: 'back', glow: 1 });
  else {
    const k = seg(t, tTp, tTp + 0.15);
    if (k < 1) ch += S.g(hero(t, { x: CAFE.hero1, y: 990, s: 0.5, sx: 1 - k, sy: 1 + k * 0.6, face: 'smug' }, {}, { mode: 'back', glow: 1 }), null, { opacity: f(1 - k) });
  }
  ch += brickCage(t, 'back') + actor('brick', t, { x: CAFE.brick, y: 990, s: 0.5, volume: false, armL: -24, armR: -24, face: { name: 'angry', eyes: { look: [lerp(-0.6, 0.7, seg(t, tMe, tLine)), 0] } }, ...breathe(t, 7) }) + brickCage(t, 'front');
  ch += kid(4, { volume: false, x: CAFE.kidB, y: 990, s: 0.42, view: gone ? 'front' : 'side', flip: true, turn: 0.4, face: gone ? 'shocked' : 'happy', ...breathe(t, 4) });
  // arrival at the front
  const ax = 1880;
  if (t >= tTp + 0.06) {
    const k = ease.outBack(seg(t, tTp + 0.06, tTp + 0.32));
    ch += hero(t, { x: ax, y: 990, s: 0.5 * Math.max(0.05, k), turn: -0.3, face: 'smug', armL: 14, armR: 14 }, {}, { mode: 'back', glow: 1 });
  }
  let fx = K.commandBurst(CAFE.hero1, 700, t - tTp, '#3DFF9A', 200) + K.commandBurst(ax, 700, t - tTp - 0.06, '#3DFF9A', 240);
  if (t > tTp && t < tTp + 0.6) fx += SETS.sparkle(ax - 80, 620, 30 * bump(t, tTp + 0.1, tTp + 0.5), '#9DFFC8') + SETS.sparkle(ax + 90, 520, 22 * bump(t, tTp + 0.15, tTp + 0.55));
  fx += bang('EEK!', 1580, 300, pop(t, tTp + 0.18, 0.2), 90, -8, '#FF8FB8');
  const jump = bump(t, tTp + 0.12, tTp + 0.7);
  const lady_ = lady(t, { lift: 120 * jump, ...boing(t, tTp + 0.12, 0.25), face: t > tTp + 0.1 ? 'scream' : 'happy', armL: t > tTp + 0.1 ? 160 : 9, armR: t > tTp + 0.1 ? 165 : 40, ladleRot: 200 * jump });
  let o = room(Lc, cam, lady_, ch + fx);
  o += cmd(t, 960, 120, ';tp me to front of line', K.typeProgress(t, A[5], 'Teleport', 'line'), tTp, { s: 1.35, tIn: CUT.tp });
  return o;
}

// ---- gym helpers
const GYM = { coach: 270, lane: 892, runners: [560, 720, 880, 1040, 1200], hero: 880 };
const gymL = (t, board = 'MILE 0:00.0') => SETS.gym.layers(t, { scoreboard: board });
const RUN_KIDS = [6, 11, -1, 8, 15];
function runners(t, opts = {}) {
  let o = '';
  GYM.runners.forEach((x, i) => {
    const ki = RUN_KIDS[i];
    if (ki < 0) return;
    const blown = opts.blown ? opts.blown : 0;
    const p = { x: x + 40 * blown, y: GYM.lane, s: 0.4, view: 'side', flip: true, bodyY: 34 * (1 - blown), lean: 22 * (1 - blown) - 50 * blown, armL: -30, armR: 40, legL: 30, legR: -20, kneeL: 60, kneeR: 40, lift: 120 * bump(blown, 0, 1), rot: -40 * blown, face: blown > 0 ? 'dizzy' : 'determined', volume: i % 2 ? false : undefined };
    o += kid(ki, p);
  });
  return o;
}
function coachP(t, pose = {}, act = {}) { return actor('coach', t, { x: GYM.coach, y: 990, s: 0.52, turn: 0.5, ...pose }, act); }

// ---- 8. gym wide: "The mile run." (the whistle)
function shGym(t) {
  const Lg = gymL(t);
  const tRun = w(6, 'run');
  const cam = camKeys(t, [[CUT.gym, { zoom: 1.22, x: -380, y: 50 }], [CUT.speed, { zoom: 1.3, x: -60, y: 90 }]]);
  let ch = runners(t);
  ch += hero(t, { x: GYM.hero, y: GYM.lane, s: 0.42, view: 'side', flip: true, bodyY: 34, lean: 22, armL: -30, armR: 40, legL: 30, legR: -20, kneeL: 60, kneeR: 40, face: 'sneaky' }, {}, { mode: 'under', glow: 0.4, s: 0.32 });
  const blow = t >= tRun - 0.1;
  ch += coachP(t, { whistle: blow ? 'mouth' : undefined, armR: blow ? 140 : 20, armL: 10, face: blow ? { name: 'determined', fx: ['redface'] } : 'determined', sy: blow ? 1.03 : 1 });
  const fx = bang('TWEEET!', GYM.coach + 220, 420, pop(t, tRun, 0.2), 90, -8, '#FFFFFF');
  return room(Lg, cam, '', ch + fx);
}

// ---- 9. close: "Speed me." (whisper; the laptop on the track)
function shSpeed(t) {
  const Lg = gymL(t);
  const cam = camKeys(t, [[CUT.speed, { zoom: 2.3, x: GYM.hero - 960 + 60, y: 740 - 540 }], [CUT.boom, { zoom: 2.45, x: GYM.hero - 960 + 70, y: 740 - 540 }]]);
  let ch = kid(8, { x: GYM.hero + 210, y: GYM.lane, s: 0.4, volume: false, view: 'side', flip: true, bodyY: 34, lean: 22, armL: -30, armR: 40, legL: 30, legR: -20, kneeL: 60, kneeR: 40, face: 'determined' });
  ch += hero(t, { x: GYM.hero, y: GYM.lane, s: 0.42, volume: false, view: 'side', flip: true, bodyY: 34, lean: 26, armL: -40, armR: 70 + Math.sin(t * 40) * 6, legL: 30, legR: -20, kneeL: 60, kneeR: 40, face: { name: 'sneaky', eyes: { look: [0.8, 0.5] } } });
  ch += SETS.laptop(GYM.hero + 120, GYM.lane + 4, 0.22, SETS.adminScreen(t, { typed: ';speed me'.slice(0, Math.round(K.typeProgress(t, A[7], 'Speed', 'me') * 9)) }), { glow: 1, t });
  let o = room(Lg, cam, '', ch);
  o += zoomLines(960, 540, 0.7 * bump(t, tSpeed, tSpeed + 0.25), t, '#FFE7A0');
  o += cmd(t, 960, 110, ';speed me', K.typeProgress(t, A[7], 'Speed', 'me'), tSpeed, { s: 1.5, tIn: CUT.speed });
  return o;
}

// the track ellipse (perspective) — the hero laps it
const TRACK = { cx: 960, cy: 905, rx: 840, ry: 62 };
const trackPt = (th) => [TRACK.cx + Math.cos(th) * TRACK.rx, TRACK.cy + Math.sin(th) * TRACK.ry];
// ---- 10. SONIC BOOM: the streak laps the gym, the whistle melts, he skids to a stop
function shBoom(t) {
  const Lg = gymL(t);
  const age = t - tSpeed;
  const cam = shakeAll({ zoom: 1.04, x: -20, y: 30 }, t, [[tSpeed + 0.02, 0.7, 30]]);
  const runU = seg(t, tSpeed + 0.05, tSpeed + 0.6);
  const LAPS = 4;
  const th0 = Math.PI * 0.62;
  const th = th0 - runU * LAPS * Math.PI * 2;
  const done = runU >= 1;
  const tStop = tSpeed + 0.6;
  let far = '', near = '', ch = '';
  // fire trail: split into far (behind the runners) and near halves
  const trailK = 1 - seg(t, tStop + 0.2, tStop + 1.6);
  if (runU > 0 && trailK > 0) {
    const tail = Math.min(runU * LAPS * Math.PI * 2, Math.PI * 1.6) + (done ? Math.PI * 0.4 : 0);
    const N = 18;
    let run = [], side = null;
    const flush = () => { if (run.length > 1) { const tr = fireTrail({ pts: run, w: 70 * trailK, t }); if (side === 'far') far += tr; else near += tr; } run = []; };
    for (let i = 0; i <= N; i++) {
      const a = th + (tail * i) / N;
      const p = trackPt(a);
      const sd = Math.sin(a) < 0 ? 'far' : 'near';
      if (side && sd !== side) { run.push(p); flush(); }
      side = sd;
      run.push(p);
    }
    flush();
  }
  // runners blown over by the boom
  const blown = ease.out(seg(t, tSpeed + 0.03, tSpeed + 0.4));
  ch += runners(t, { blown });
  // the hero: a blur while running, then skids to a stop at the right
  const stopX = 1560;
  if (!done) {
    const p = trackPt(th);
    const ghostN = 2;
    for (let g = ghostN; g >= 0; g--) {
      const q = trackPt(th + g * 0.14);
      ch += S.g(hero(t, { x: q[0], y: q[1], s: 0.42, volume: g === 0 ? undefined : false, view: 'side', flip: Math.cos(th) > 0 ? false : true, ...AC.run(t * 60, 1.2), lean: 20, face: 'excited' }), null, { opacity: f(g === 0 ? 1 : 0.18) });
    }
    ch += K.C.speedLines(p[0] - 300, p[0] + 300, p[1] - 160, 4, 7, '#FFFFFF', 200);
  } else {
    const k = ease.out(seg(t, tStop, tStop + 0.35));
    const sx = lerp(stopX + 160, stopX, k);
    ch += hero(t, { x: sx, y: 910, s: 0.42, view: 'side', flip: true, lean: -18 * (1 - k), bodyY: 10, ...boing(t, tStop + 0.3, 0.2), face: { name: 'excited', fx: ['sparkles'] } }, {}, { mode: 'under', glow: 0.4, s: 0.32 });
    ch += dustPuff(sx + 60, 912, t - tStop, 0.8) + smoke(sx + 30, 900, t, { n: 5, s: 0.8, seed: 3 }) + smoke(sx - 20, 905, t + 0.3, { n: 4, s: 0.7, seed: 6 });
  }
  // the coach: stunned, his whistle melts
  const melt = seg(t, tSpeed + 0.1, tSpeed + 1.0);
  const hy = -604;
  ch += coachP(t, { face: { name: 'shocked', mouth: 'o' }, lean: -10 * blown, armL: 30 + 40 * blown, armR: 30 + 40 * blown, props: [{ svg: X.meltWhistle(-30, hy, 1.2, melt, t), layer: 'top' }] });
  // shockwave ring + BOOM
  let fx = '';
  if (age < 0.7) { const u = age / 0.7; fx += S.ellipse(GYM.hero, 820, 1600 * ease.out(u), 380 * ease.out(u), { fill: 'none', stroke: '#FFFFFF', 'stroke-width': f(40 * (1 - u)), opacity: f(1 - u) }); }
  fx += K.commandBurst(GYM.hero, 760, age, '#FFE14D', 240);
  fx += bang('BOOM!', 980, 380, pop(t, tSpeed + 0.02, 0.18) * (1 - seg(t, tSpeed + 0.9, tSpeed + 1.1)), 190, -6, '#FFD21F');
  const lap = Math.min(LAPS, Math.floor(runU * LAPS) + 1);
  let hud = '';
  if (runU > 0) hud = S.g(S.rect(-150, -46, 300, 92, 24, { fill: '#10131C', opacity: 0.85, stroke: '#FFE14D', 'stroke-width': 5 }) + T(`LAP ${lap}/4`, 0, 22, 60, '#FFE14D'), tf(250, 190, pop(t, tSpeed + 0.05, 0.15)));
  return view(cam, Lg.mid + far + ch + near + fx, 1) + hud + smash(t, tSpeed + 0.02, 0.16, 0.85);
}

// ---- 11. the scoreboard: 0:00.3 (smash-zoom on "three")
function shScore(t) {
  const board = t >= tThree ? 'MILE 0:00.3' : (Math.floor(t * 20) % 2 ? 'MILE 0:00.0' : 'MILE 0:00.0');
  const Lg = gymL(t, board);
  const a = { zoom: 2.5, x: 1580 - 960, y: 395 - 540 }, b = { zoom: 3.3, x: 1580 - 960, y: 385 - 540 };
  const cam = shakeAll(camKeys(t, [[CUT.score, { ...a, zoom: 2.35 }], [tThree - 0.07, a], [tThree, b], [CUT.shoes, { ...b, zoom: 3.4 }]]), t, [[tThree, 0.35, 12]]);
  let o = room(Lg, cam, '', '');
  o += zoomLines(960, 540, 0.9 * (t >= tThree ? 1 - seg(t, tThree + 0.4, tThree + 0.8) : 0), t, '#FFE14D');
  if (t >= tThree) o += K.sparkles([[420, 300, 44], [1500, 280, 54], [1560, 800, 34], [360, 790, 38]], t) + S.g(S.rect(-300, -50, 600, 100, 24, ol('#FFD21F', 7)) + T('NEW RECORD!', 0, 26, 66, '#2A2246'), tf(960, 150, pop(t, tThree + 0.15, 0.25), -3));
  return o + smash(t, tThree, 0.14, 0.75);
}

// ---- 12. close-up: the shoes do not survive (they crumble to ash, socks remain, toes wiggle)
function shShoes(t) {
  const tSh = w(8, 'shoes'), tDid = w(8, 'did'), tNot = w(8, 'not'), tSurv = w(8, 'survive');
  const u = seg(t, CUT.shoes, CUT.coach);
  let o = S.rect(-100, -100, 2120, 1280, 0, { fill: 'url(#setsGymFloor)' }) + S.rect(-100, -100, 2120, 1280, 0, { fill: '#C98A45' });
  // close floor: big planks + painted red track band
  let pl = '';
  for (let i = 0; i < 6; i++) pl += `M-100 ${180 + i * i * 34 + i * 60} H2020 `;
  o += S.path(pl, ln(5, '#A86B30', 0.7)) + S.rect(-100, 560, 2120, 340, 0, { fill: '#D9573A', opacity: 0.9 }) + S.path('M-100 560 H2020 M-100 900 H2020', ln(14, '#FFFFFF'));
  o += S.rect(-100, -100, 2120, 220, 0, { fill: '#2A4A86' }) + S.path('M-100 120 H2020', ln(8, LINE_));
  const burn = seg(t, tSh, tNot), crumble = seg(t, tNot, tSurv + 0.1), wig = t > tSurv ? Math.sin((t - tSurv) * 18) : 0;
  const z = 1 + 0.06 * u;
  let legs = '';
  for (const [lx, side] of [[700, -1], [1220, 1]]) {
    // pants
    legs += S.path(`M${lx - 150} -120 L${lx + 150} -120 L${lx + 160} 600 L${lx - 160} 600 Z`, ol('#1F3B2A', 8)) + S.path(`M${lx + side * 90} -100 L${lx + side * 96} 590`, ln(6, '#162C1F'));
    // sock (always under the shoe)
    let sock = S.path(`M${lx - 130} 590 L${lx + 130} 590 L${lx + 150} 760 Q${lx + 150} 830 ${lx + 60} 840 L${lx - 60} 840 Q${lx - 150} 830 ${lx - 150} 760 Z`, ol('#F4F2F8', 8));
    sock += S.path(`M${lx - 146} 770 Q${lx} 800 ${lx + 146} 770 L${lx + 140} 800 Q${lx + 80} 842 ${lx} 842 Q${lx - 80} 842 ${lx - 140} 800 Z`, { fill: '#BDB7CF' });
    sock += S.path(`M${lx - 128} 620 H${lx + 128} M${lx - 128} 640 H${lx + 128}`, ln(5, '#D2CEDF'));
    // the big toe through a hole (wiggles)
    sock += S.ellipse(lx + side * 60, 815 - 6 * wig, 30, 22, ol('#F6CFB0', 6)) + S.path(`M${lx + side * 60 - 32} 800 Q${lx + side * 60} 780 ${lx + side * 60 + 32} 800`, ln(5, LINE_));
    legs += sock;
    // the sneaker over it: glowing, then crumbling
    if (crumble < 1) {
      const up = SETS.mix('#FFFFFF', '#2A2328', burn), cap = SETS.mix('#EEF0F6', '#1E181C', burn), sole = SETS.mix('#D9D6E2', '#141014', burn);
      let shoe = S.path(`M${lx - 170} 600 Q${lx - 182} 556 ${lx - 120} 556 L${lx + 120} 556 Q${lx + 182} 556 ${lx + 170} 600 L${lx + 194} 800 Q${lx + 196} 872 ${lx + 120} 876 L${lx - 120} 876 Q${lx - 196} 872 ${lx - 194} 800 Z`, ol(up, 8));
      shoe += S.path(`M${lx - 72} 560 L${lx + 72} 560 L${lx + 64} 712 L${lx - 64} 712 Z`, ol(SETS.mix('#F6F6FA', '#3A3036', burn), 5));
      shoe += S.path(`M${lx - 60} 590 L${lx + 60} 620 M${lx + 60} 590 L${lx - 60} 620 M${lx - 60} 640 L${lx + 60} 670 M${lx + 60} 640 L${lx - 60} 670`, ln(7, SETS.mix('#9AA0B4', '#4A3A3A', burn)));
      shoe += S.path(`M${lx - 182} 790 Q${lx} 700 ${lx + 182} 790 L${lx + 190} 836 Q${lx} 872 ${lx - 190} 836 Z`, ol(cap, 6));
      shoe += S.path(`M${lx - 176} 690 Q${lx - 150} 760 ${lx - 96} 772 M${lx + 176} 690 Q${lx + 150} 760 ${lx + 96} 772`, ln(12, SETS.mix('#FF5A5A', '#3A2A2A', burn)));
      shoe += S.path(`M${lx - 204} 846 Q${lx} 900 ${lx + 204} 846 L${lx + 200} 884 Q${lx} 930 ${lx - 200} 884 Z`, ol(sole, 6));
      if (burn > 0) shoe += S.path(`M${lx - 150} 640 l40 30 l-20 40 l50 30 M${lx + 40} 600 l-20 50 l40 30 l-10 60 M${lx + 150} 720 l-40 30 l20 50 M${lx - 90} 820 l30 -20 l40 20`, ln(8, '#FF8A2E', burn));
      const cr = crumble;
      legs += S.g(shoe, `translate(0 ${f(140 * cr * cr)})`, { opacity: f(1 - cr) });
      for (let i = 0; i < 10 && cr > 0; i++) {
        const fx_ = lx + (hash(i + side) - 0.5) * 380, fy = 620 + hash(i * 3 + side) * 230 + cr * (200 + 300 * hash(i * 5));
        legs += S.rect(fx_, fy, 30, 20, 4, { fill: '#2A2328', opacity: f(1 - cr * 0.7), transform: `rotate(${f(cr * 300 * (hash(i) - 0.5))} ${f(fx_)} ${f(fy)})` });
      }
    }
    if (burn > 0) legs += smoke(lx + side * 120, 640, t, { n: 6, s: 2.4, seed: side + 3, rise: 520, op: 0.4 + 0.45 * burn, col: '#DAD8E2', drift: side * 120 });
  }
  o += S.g(legs, `translate(960 540) scale(${f(z)}) translate(-960 -540)`);
  o += bang('FWOOSH', 1500, 300, pop(t, tSh, 0.2) * (1 - seg(t, tDid, tDid + 0.2)), 80, 8, '#FF8A2E');
  o += bang('*crumble*', 960, 330, pop(t, tNot, 0.2) * (1 - seg(t, tSurv + 0.3, tSurv + 0.5)), 64, -4, '#FFFFFF');
  return o;
}
const LINE_ = '#151515';

// ---- 13. Coach Hale: "That's... a new world record." (melted whistle, stopwatch)
function shCoach(t) {
  const Lg = gymL(t, 'MILE 0:00.3');
  const u = seg(t, CUT.coach, CUT.socks);
  const tRec = w(9, 'record');
  const camBg = { zoom: 2.0, x: -500, y: -40 };
  let o = view(camBg, Lg.mid, 1);
  const z = 1 + 0.07 * ease.inOut(u);
  const cx = 860, cy = faceAt(470, 1.0, 1.12);
  const c = actor('coach', t, { x: cx, y: cy, s: 1.0, volume: false, turn: 0.15, armR: 112, armL: 12, face: { name: 'shocked', mouth: 'o', eyes: { pupil: 0.45 } }, props: [{ svg: X.meltWhistle(-30, -604, 1.2, 1, t), layer: 'top' }, { svg: X.stopwatch(350, -690, 0.9, '0:00.3', -10 + 4 * Math.sin(t * 20) * bump(t, tRec, tRec + 0.4)), layer: 'front' }] }, { arms: false, energy: 0.6 });
  o += S.g(c, `translate(960 540) scale(${f(z)}) translate(-960 -540)`);
  if (t >= tRec) o += K.sparkles([[1400, 330, 40], [1520, 470, 26], [1300, 520, 22]], t) + bang('WORLD RECORD!', 1420, 170, pop(t, tRec, 0.22), 70, 6, '#7CFF6B');
  return o;
}

// ---- 14. "Also... where are your shoes?" — the hero in socks, two burnt soles smoking behind him (+ the silent beat)
function shSocks(t) {
  const Lg = gymL(t, 'MILE 0:00.3');
  const tShoes = w(9, 'shoes'), end = CUT.cls;
  const cam = camKeys(t, [[CUT.socks, { zoom: 1.32, x: -60, y: 90 }], [tShoes + 0.2, { zoom: 1.4, x: 10, y: 110 }], [end, { zoom: 1.85, x: 220, y: 260 }]]);
  const look = t >= tShoes;
  let ch = '';
  ch += X.burntSole(1310, 965, 0.9, t, 1) + X.burntSole(1440, 975, 0.9, t + 0.4, 2);
  ch += actor('coach', t, { x: 660, y: 990, s: 0.55, volume: false, turn: 0.6, lean: 10, headRot: 8, armL: 20, armR: 40, face: { name: 'confused', eyes: { look: [0.5, 0.7] } }, props: [{ svg: X.meltWhistle(-30, -604, 1.2, 1, t), layer: 'top' }] });
  const wig = look ? Math.abs(Math.sin((t - tShoes) * 10)) : 0;
  ch += heroSocks(t, { x: 1080, y: 990, s: 0.5, volume: false, turn: -0.3, bodyY: 6 * wig, headRot: look ? 10 * (1 - seg(t, tShoes + 0.6, tShoes + 1.0)) : 0, face: look ? { name: 'nervous', fx: ['sweat'], eyes: { look: t < tShoes + 0.6 ? [0, 0.9] : [-0.5, 0] } } : { name: 'happy', fx: ['sparkles'] } }, {}, { mode: 'under', glow: 0.3 });
  ch += smoke(1060, 985, t, { n: 4, s: 0.6, seed: 9, rise: 160, op: 0.5 }) + smoke(1110, 985, t + 0.4, { n: 4, s: 0.6, seed: 11, rise: 160, op: 0.5 });
  return room(Lg, cam, '', ch);
}

// ---- classroom helpers
const SEATS = [[400, 860, 0.4, 1], [760, 860, 0.4, 2], [1120, 860, 0.4, 14], [1480, 860, 0.4, 6], [220, 960, 0.48, 3], [580, 960, 0.48, 10], [1300, 960, 0.48, 5], [1660, 960, 0.48, 12]];
function classKids(t, mode = 0, heroX = 940) {
  let o = '';
  for (const [x, y, s, i] of SEATS) {
    const watch = mode > 0;
    const lookX = clamp((heroX - x) / 500, -1, 1);
    o += kid(i, { x, y, s, turn: watch ? clamp((heroX - x) / 900, -0.7, 0.7) : 0, armL: watch ? 9 : 34 + 3 * Math.sin(t * 13 + i), armR: watch ? 9 : 30 + 4 * Math.sin(t * 11 + i), headRot: watch ? 0 : 6, face: watch ? { name: mode > 1 ? 'shocked' : 'amazed', eyes: { look: [lookX, -0.2] } } : { name: 'determined', eyes: { look: [0, 0.8] } }, volume: false, ...breathe(t, i) });
  }
  return o;
}
// ---- 15. "Math test. You didn't study."
function shClass(t) {
  const Lr = SETS.classroom.layers(t, {});
  const tStudy = w(10, 'study');
  const cam = camKeys(t, [[CUT.cls, { zoom: 1.02, x: 0, y: 0 }], [w(10, 'You') - 0.1, { zoom: 1.08, x: 0, y: 10 }], [tStudy, { zoom: 1.75, x: -20, y: 70 }], [CUT.nclip, { zoom: 1.85, x: -20, y: 80 }]]);
  const panic = t >= tStudy;
  const h = hero(t, { x: 940, y: 960, s: 0.48, armL: 30, armR: 34 + 4 * Math.sin(t * 30), headRot: panic ? -4 : 3, face: panic ? { name: 'scared', fx: ['sweat2'], eyes: { look: [0, 0.6] } } : { name: 'nervous', eyes: { look: [0, 0.8] } } });
  let o = room(Lr, cam, classKids(t) + h, '');
  if (panic) o += view(cam, bang('?!', 1060, 430, pop(t, tStudy, 0.2), 80, 10, '#FFD21F'), 1);
  return o;
}
// ---- 16. "Noclip... me." (close, sneaky; ENTER -> ghost)
function shNoclip(t) {
  const Lr = SETS.classroom.layers(t, {});
  const cam = camKeys(t, [[CUT.nclip, { zoom: 2.35, x: -20, y: 100 }], [CUT.walk, { zoom: 2.5, x: -20, y: 100 }]]);
  const gk = seg(t, tNoclip, tNoclip + 0.3);
  let h = hero(t, { x: 940, y: 960, s: 0.48, volume: false, ...typing(t, t < tNoclip, 12), headRot: 4, face: gk > 0 ? { name: 'amazed', eyes: { look: [0, 0.4] } } : { name: 'sneaky', eyes: { look: [0.6, 0.1] } } }, {}, { mode: 'back', glow: 1, y: -330, s: 0.5 });
  const lap = '';
  h = X.ghost(h, gk, t, 14);
  let o = view(cam, Lr.bg, 0.92) + view(cam, Lr.mid + classKids(t) + h + lap + Lr.front + X.scanShimmer(800, 520, 280, 440, t, gk) + K.commandBurst(940, 700, t - tNoclip, '#7CF7FF', 140), 1);
  o += cmd(t, 960, 110, ';noclip me', K.typeProgress(t, A[11], 'Noclip', 'me'), tNoclip, { s: 1.5, tIn: CUT.nclip });
  return o;
}
// ---- 17. "Noclip lets you walk through walls." — the ghost walks into the chalkboard
function shWalk(t) {
  const Lr = SETS.classroom.layers(t, {});
  const tWalls = w(12, 'walls');
  const t0 = A[12].a + 0.25, t1 = tWalls - 0.05;
  const u = seg(t, t0, t1);
  const rise = seg(t, CUT.walk, t0);
  const hx = lerp(940, 980, u), hy = lerp(960, 805, ease.inOut(u)), hs = lerp(0.48, 0.38, u);
  const into = seg(t, tWalls - 0.05, tWalls + 0.35);
  const cam = camKeys(t, [[CUT.walk, { zoom: 1.12, x: 0, y: 30 }], [CUT.office, { zoom: 1.22, x: 10, y: 0 }]]);
  let h = '';
  if (into < 1) {
    const p = u > 0 ? { view: 'back', ...AC.walkFront((t - t0) * 9, 1) } : { view: 'front', armL: 20, armR: 20 };
    h = hero(t, { x: hx, y: hy, s: hs, volume: false, lift: 40 * rise * (1 - u), sx: 1 - 0.5 * into, sy: 1 + 0.1 * into, ...p, face: 'happy' }, {}, u > 0 ? null : { mode: 'back', glow: 0.8 });
    h = S.g(X.ghost(h, 1, t, 12), null, { opacity: f(1 - into) });
  }
  // ripples on the board
  let fx = '';
  if (t > tWalls - 0.1) for (let i = 0; i < 3; i++) { const a = t - tWalls - i * 0.18; if (a > 0 && a < 0.8) { const k = a / 0.8; fx += S.ellipse(985, 560, 60 + 260 * k, 40 + 170 * k, { fill: 'none', stroke: '#7CF7FF', 'stroke-width': f(12 * (1 - k)), opacity: f(1 - k) }); } }
  fx += X.scanShimmer(hx - 120, hy - 420, 240, 420, t, 1 - into);
  const glow = into < 1 ? SETS.glowSpot(hx, hy - 230, 300, 'setsGlowBlue', 0.9 * (1 - into)) : '';
  const mode = t > t0 + 0.4 ? (t > tWalls ? 2 : 1) : 0;
  return view(cam, Lr.bg, 0.92) + view(cam, Lr.mid + fx + classKids(t, mode, hx) + Lr.front + glow + h, 1);
}
// ---- 18. "It does NOT let you choose which wall." — Principal Pratt's office: the wall cracks, out steps the hero
const OFF = { hx: 1360, wallY: 792, floorY: 940 };
function pratt(t, pose = {}, act = {}) { return actor('principal', t, { x: 700, y: 900, s: 0.5, t, steam: 1, volume: false, ...pose }, act); }
function shOffice(t) {
  const tDoes = w(12, 'does'), tNot = w(12, 'NOT'), tChoose = w(12, 'choose'), tWhich = w(12, 'which'), tWall = w(12, 'wall');
  const hole = t < tNot ? 0.25 * seg(t, tDoes, tNot) : 0.25 + 0.75 * seg(t, tNot, tNot + 0.3);
  const Lo = SETS.principalOffice.layers(t, { hole });
  const cam = shakeAll(camKeys(t, [[CUT.office, { zoom: 1.05, x: 60, y: 20 }], [CUT.pratt, { zoom: 1.14, x: 80, y: 30 }]]), t, [[tNot, 0.35, 16]]);
  const step = ease.inOut(seg(t, tChoose - 0.15, tWall));
  const gk = 1 - seg(t, tWhich, tWhich + 0.35);
  let h = '';
  if (hole > 0.3) {
    const flick = gk > 0 && gk < 1 ? (Math.floor(t * 24) % 2 ? 1 : 0.2) : gk;
    const p = step > 0 && step < 1 ? AC.walkFront((t - tChoose) * 10, 1) : { armL: 14, armR: 14 };
    h = hero(t, { x: OFF.hx, y: lerp(OFF.wallY, OFF.floorY, step), s: lerp(0.44, 0.5, step), ...(flick > 0 ? { volume: false } : {}), ...p, face: step >= 1 ? { name: 'nervous', eyes: { look: [-0.8, 0] } } : 'happy' }, {}, { mode: 'back', glow: 0.7 });
    h = X.ghost(h, flick, t, 10);
  }
  const up = seg(t, tWall - 0.3, tWall + 0.2);
  const pr = pratt(t, { armL: 60, headRot: -6 * up, turn: 0.2, face: { name: 'deadpan', eyes: { look: [lerp(0, 0.8, up), lerp(0.7, 0, up)], upper: 0.3 } } }, { arms: false });
  let fx = X.debris(OFF.hx, 600, t, tNot, 8, 0.8, 4) + dustPuff(OFF.hx, OFF.wallY + 10, t - tNot, 0.9) + bang('CRACK!', OFF.hx + 260, 330, pop(t, tNot, 0.2) * (1 - seg(t, tNot + 0.7, tNot + 0.9)), 80, 8, '#FFFFFF');
  return view(cam, Lo.bg, 0.92) + view(cam, Lo.mid + pr + Lo.front + h + fx + Lo.light, 1);
}
// ---- 19. "Young man." (Pratt close, deadpan, lowers the mug)
function shPratt(t) {
  const Lo = SETS.principalOffice.layers(t, { hole: 1 });
  const u = seg(t, CUT.pratt, CUT.two);
  const cam = { zoom: lerp(2.1, 2.3, ease.inOut(u)), x: 720 - 960, y: 470 - 540 };
  const pr = pratt(t, { armL: 60, headRot: lerp(-4, 3, ease.inOut(seg(t, CUT.pratt, w(13, 'man')))), turn: 0.15, face: { name: 'deadpan', eyes: { look: [0.6, 0], upper: 0.35 } } }, { arms: false, energy: 0.4 });
  return view(cam, Lo.bg, 0.92) + view(cam, Lo.mid + pr + Lo.front, 1);
}
// ---- 20. "Did you just walk through my wall?" (two-shot; he points at the hero-shaped hole)
function shTwo(t) {
  const Lo = SETS.principalOffice.layers(t, { hole: 1 });
  const tWall = w(13, 'wall');
  const cam = camKeys(t, [[CUT.two, { zoom: 1.12, x: 70, y: 40 }], [tWall - 0.1, { zoom: 1.2, x: 110, y: 40 }], [tWall + 0.12, { zoom: 1.75, x: OFF.hx - 960, y: 600 - 540 }], [CUT.no, { zoom: 1.8, x: OFF.hx - 960, y: 600 - 540 }]]);
  const pt = ease.outBack(seg(t, w(13, 'Did'), w(13, 'Did') + 0.4));
  const pr = pratt(t, { armL: 60, armR: lerp(9, 80, pt), turn: 0.25, face: { name: 'deadpan', eyes: { look: [0.8, 0], upper: 0.3 } } }, { arms: false, energy: 0.4 });
  const h = hero(t, { x: OFF.hx, y: OFF.floorY, s: 0.5, volume: false, turn: -0.4, ...breathe(t), bodyY: 4 + 3 * Math.sin(t * 30), face: { name: 'scared', fx: ['sweat2'], eyes: { look: [-0.7, 0] } } }, {}, { mode: 'back', glow: 0.6 });
  return view(cam, Lo.bg, 0.92) + view(cam, Lo.mid + pr + Lo.front + h, 1) + smash(t, tWall + 0.02, 0.1, 0.4);
}
// ---- 21. "...No? Noclip... me... AWAY!"
function shNo(t) {
  const Lo = SETS.principalOffice.layers(t, { hole: 1 });
  const tNc = w(14, 'Noclip'), tAwayW = w(14, 'AWAY');
  const camBg = { zoom: 2.0, x: OFF.hx - 960 - 40, y: 520 - 540 };
  let o = view(camBg, Lo.bg, 0.92) + view(camBg, Lo.mid, 1);
  const panic = t >= tNc - 0.1;
  const scream = t >= tAwayW - 0.05;
  const shrug = !panic ? bump(t, A[14].a, A[14].a + 0.8) : 0;
  const face = scream ? { name: 'scream' } : panic ? { name: 'scared', fx: ['sweat2'] } : { name: 'nervous', fx: ['sweat'], eyes: { look: [-0.6, 0] } };
  const z = 1 + 0.08 * seg(t, tNc, tAway) + 0.06 * bump(t, tAway, tAway + 0.2);
  const pose = panic ? { ...typing(t, t < tAway, 16), bodyY: 6 * Math.abs(Math.sin(t * 22)) } : { armL: 20 + 40 * shrug, armR: 20 + 40 * shrug, headRot: -8 * shrug };
  const h = hero(t, { x: 960, y: faceAt(470, 1.15), s: 1.15, volume: false, ...pose, face }, { energy: 1.5 }, panic ? { mode: 'back', glow: 1, y: -300, s: 0.62 } : null);
  o += S.g(h, `translate(960 ${scream ? 540 + Math.sin(t * 60) * 6 : 540}) scale(${f(z)}) translate(-960 -540)`);
  o += zoomLines(960, 500, (scream ? 0.8 : 0) + 0.5 * bump(t, tAway, tAway + 0.3), t, '#7CF7FF');
  if (panic) o += cmd(t, 960, 120, ';noclip me AWAY', K.typeProgress(t, A[14], 'Noclip', 'AWAY'), tAway, { s: 1.35, tIn: tNc - 0.15 });
  return o;
}
// ---- 22. through the floor: a hero-shaped hole remains; Pratt sips his coffee ("By lunch...")
function shFall(t) {
  const Lo = SETS.principalOffice.layers(t, { hole: 1 });
  const cam = shakeAll(camKeys(t, [[CUT.fall, { zoom: 1.12, x: 90, y: 70 }], [CUT.pop, { zoom: 1.18, x: 100, y: 80 }]]), t, [[tAway + 0.1, 0.35, 16]]);
  const u = seg(t, tAway + 0.02, tAway + 0.28);
  let h = '';
  if (u < 1) {
    const hh = hero(t, { x: OFF.hx, y: OFF.floorY + 900 * ease.in(u), s: 0.5, volume: false, sx: 1 - 0.25 * u, sy: 1 + 0.45 * u, armL: 170, armR: 170, face: 'scream' }, {}, { mode: 'back', glow: 1 });
    h = clipTo(-800, -800, 3600, 800 + OFF.floorY, X.ghost(hh, 0.6, t, 10));
  }
  const hole = X.floorHeroHole(OFF.hx, OFF.floorY + 4, 0.44, seg(t, tAway + 0.04, tAway + 0.2), 0.36);
  const tLunch = w(15, 'lunch');
  const sip = bump(t, tLunch - 0.1, CUT.pop + 0.4);
  const pr = pratt(t, { armL: lerp(60, 100, sip), turn: lerp(0.4, 0.15, sip), headRot: -8 * sip, face: { name: 'deadpan', eyes: { look: [0.8, 0.6 * (1 - sip)], upper: 0.4 } } }, { arms: false });
  const fx = K.commandBurst(OFF.hx, 760, t - tAway, '#7CF7FF', 200) + dustPuff(OFF.hx, OFF.floorY, t - tAway - 0.1, 1.1) + bang('FWOOP!', OFF.hx + 240, 520, pop(t, tAway + 0.05, 0.18) * (1 - seg(t, tAway + 0.6, tAway + 0.8)), 80, -8, '#7CF7FF');
  return view(cam, Lo.bg, 0.92) + view(cam, Lo.mid + hole + pr + Lo.front + h + fx, 1);
}

// ---- hallway helpers
const hallL = (t, cam) => SETS.hallway.layers(t, cam, {});
const hall = (t, cam, chars) => { const Lh = hallL(t, cam); return Lh.mid + view(cam, chars, 1) + Lh.fg; };
const CROWD = [[820, 905, 0.4, 6, true], [1100, 905, 0.4, 15, true], [560, 930, 0.44, 2], [1360, 930, 0.44, 11], [380, 950, 0.46, 9], [1540, 950, 0.46, 14], [720, 995, 0.52, 13], [1200, 998, 0.52, 3]];
// ---- 23. "...you were the most popular kid in school." (mobbed in the hallway, BADGE)
function shPop(t) {
  const tPop = w(15, 'popular'), tKid = w(15, 'kid');
  const cam = camKeys(t, [[CUT.pop, { zoom: 1.55, x: 0, y: 70 }], [CUT.wanted, { zoom: 1.02, x: 0, y: 30 }]], ease.out);
  let ch = '';
  CROWD.forEach(([x, y, s, i, far], j) => {
    if (y > 960) return;
    const hop = Math.abs(Math.sin(t * 7 + j * 1.3));
    ch += kid(i, { x, y, s, turn: clamp((960 - x) / 700, -0.7, 0.7), lift: 30 * hop, armL: 140 + 20 * Math.sin(t * 9 + j), armR: 150 + 20 * Math.sin(t * 8 + j), face: j % 2 ? 'excited' : 'joy', volume: false });
  });
  ch += hero(t, { x: 960, y: 960, s: 0.5, armR: 150 + 15 * Math.sin(t * 10), armL: 14, lift: 10 * bump(t, tPop, tPop + 0.3), face: { name: 'joy', fx: ['sparkles'] } }, {}, { mode: 'under', glow: 0.5 });
  CROWD.forEach(([x, y, s, i], j) => {
    if (y <= 960) return;
    ch += kid(i, { x, y, s, volume: false, view: 'back', lift: 20 * Math.abs(Math.sin(t * 7 + j)), armL: 150 + 20 * Math.sin(t * 9 + j), armR: 150 });
  });
  ch += bubble(560, 450, 'MAKE ME FLY!', pop(t, CUT.pop + 0.3, 0.25), { size: 34, tx: 0, ty: 120 });
  ch += bubble(1380, 460, 'JAIL MY BROTHER!', pop(t, tKid - 0.2, 0.25), { size: 34, tx: -20, ty: 120 });
  let o = hall(t, cam, ch);
  o += K.badge(960, 190, 'MOST POPULAR', 'BADGE EARNED!', pop(t, tPop, 0.35), t);
  return o;
}
// ---- 24. "Everybody wanted a command." (faces pushing into the lens, bubbles on the words)
function shWanted(t) {
  const camBg = { zoom: 1.7, x: 0, y: -60 };
  const tE = w(16, 'Everybody'), tW = w(16, 'wanted'), tA = w(16, 'a'), tC = w(16, 'command');
  let ch = '';
  const push = (j) => Math.sin(t * 6 + j) * 10;
  ch += kid(12, { x: 680 + push(1), y: 930, s: 0.62, turn: 0.4, armL: 120, armR: 160, face: 'excited', volume: false });
  ch += kid(10, { x: 1260 + push(2), y: 940, s: 0.62, turn: -0.4, armL: 160, armR: 120, face: 'joy', volume: false });
  ch += kid(9, { x: 380 + push(3), y: 1170, s: 0.85, turn: 0.5, armR: 150, armL: 60, face: 'excited', volume: false });
  ch += kid(14, { x: 1540 + push(4), y: 1190, s: 0.85, turn: -0.5, armL: 150, armR: 60, face: 'joy', volume: false });
  ch += kid(5, { x: 960 + push(5), y: 1290, s: 0.95, armL: 120 + 10 * Math.sin(t * 10), armR: 130, face: { name: 'excited' }, volume: false });
  let o = hall(t, camBg, '') + S.g(ch, `translate(960 540) scale(${f(1 + 0.05 * seg(t, CUT.wanted, CUT.yes))}) translate(-960 -540)`);
  o += bubble(420, 240, 'FLY ME!', pop(t, tE, 0.22), { size: 50, tx: -20, ty: 140, rot: -6 });
  o += bubble(1480, 230, 'SPEED ME!', pop(t, tW, 0.22), { size: 50, tx: 30, ty: 150, rot: 5 });
  o += bubble(760, 120, 'MAKE ME TALL!', pop(t, tA, 0.22), { size: 44, tx: -40, ty: 120, rot: 3 });
  o += bubble(1180, 400, 'JAIL MY BROTHER!', pop(t, tC, 0.22), { size: 46, tx: 0, ty: 110, rot: -4, col: '#FFF4B0' });
  return o;
}
// ---- 25. "And you said yes." (typing like a pianist; the commands stack up)
const YES_CMDS = [';fly Maya', ';size Leo head 5', ';speed Sam', ';jail Max', ';fly Ava', ';size Noah 3'];
function shYes(t) {
  const camBg = { zoom: 1.5, x: 0, y: 0 };
  const tYes = w(16, 'yes');
  let o = hall(t, camBg, '');
  const z = 1 + 0.06 * seg(t, CUT.yes, CUT.fly);
  o += S.g(hero(t, { x: 960, y: faceAt(450, 1.0), s: 1.0, volume: false, ...typing(t, 1, 18), armL: 18 + Math.sin(t * 50) * 9, armR: 18 + Math.sin(t * 47 + 1) * 9, bodyY: 4 * Math.abs(Math.sin(t * 25)), face: { name: 'joy' } }, {}, { mode: 'back', glow: 1, y: -300, s: 0.6 }), `translate(960 540) scale(${f(z)}) translate(-960 -540)`);
  const t0 = CUT.yes + 0.12, step = Math.max(0.12, (CUT.fly - 0.1 - t0) / YES_CMDS.length);
  YES_CMDS.forEach((c, i) => {
    const ti = t0 + i * step;
    if (t < ti) return;
    const n = Math.floor((t - ti) / step);
    const left = i % 2 === 0;
    const y = 800 - Math.floor(i / 2) * 140;
    const x = left ? 370 : 1550;
    o += cmd(t, x, y, c, typeBetween(t, ti, ti + step * 0.7), ti + step * 0.75, { s: 1.05, tIn: ti });
  });
  o += bang('YES!', 960, 200, pop(t, tYes, 0.2), 150, -6, '#7CFF6B');
  return o;
}
// ---- 26. "To everybody." (montage 1: kids fly down the hallway)
function shFly(t) {
  const u = seg(t, CUT.fly, CUT.split);
  const cam = { zoom: 1.0, x: 200 * u, y: 20 };
  let ch = '';
  const flyer = (i, y, x0, x1, dir, ph) => {
    const x = lerp(x0, x1, seg(t, CUT.fly - 0.1, CUT.split + 0.1));
    return K.C.speedLines(dir > 0 ? x - 520 : x + 120, dir > 0 ? x - 200 : x + 440, y - 120, 4, i, '#FFFFFF', 160) + kid(i, { x, y, s: 0.42, view: 'side', flip: dir > 0, rot: dir > 0 ? -78 : 78, armL: 175, armR: 165, legL: -6, legR: 6, shadow: false, face: 'excited', headY: 3 * Math.sin(t * 20 + ph) });
  };
  ch += flyer(2, 620, -300, 2400, 1, 0) + flyer(9, 420, 2500, -200, -1, 1) + flyer(14, 800, -500, 2300, 1, 2);
  ch += hero(t, { x: 960 + 200 * u, y: 980, s: 0.5, turn: 0.2, ...typing(t, 1, 16), face: 'joy' }, {}, { mode: 'back', glow: 1 });
  return hall(t, cam, ch) + whip(t, CUT.fly, 1);
}
// ---- 27. montage 2 (split screen): a giant head bonks the lockers | a little brother in a mini cage
function shSplit(t) {
  const u = seg(t, CUT.split, CUT.kid1);
  // left: giant head
  const camL = { zoom: 1.45, x: -300, y: 90 };
  let left = hall(t, camL, '');
  const bonk = Math.abs(Math.sin((t - CUT.split) * 7));
  const kx = 700, ky = 1010;
  const body = kid(5, { x: kx, y: ky, s: 0.62, volume: false, turn: 0.3, armL: 40, armR: 60, rot: -6 * bonk, face: { name: 'dizzy' } });
  const big = 1.9;
  // the head: the same kid scaled up, clipped to the head (body y < -560)
  const head = clipTo(kx - 900, -1000, 1800, ky - 560 * 0.62 * 0.88 + 30 + 1000, S.g(kid(5, { x: kx, y: ky, s: 0.62, volume: false, turn: 0.3, rot: -6 * bonk, face: { name: 'dizzy', fx: ['sparkles'] }, shadow: false }), `translate(${f(kx)} ${f(ky - 520 * 0.62 * 0.88)}) scale(${f(big)}) translate(${f(-kx)} ${f(-(ky - 520 * 0.62 * 0.88))})`));
  left += body + head + bang('BONK!', 260, 360, pop(t, CUT.split + 0.15, 0.2), 80, -10, '#FFFFFF');
  // right: mini cage
  const camR = { zoom: 1.75, x: 1460 - 960 - 60, y: 820 - 540 };
  let right = hall(t, camR, '');
  const cx = 1460, cy = 1000;
  right += kid(10, { x: 1180, y: cy, s: 0.55, volume: false, turn: 0.4, armR: 150, armL: 20, face: { name: 'smug', fx: ['sparkles'] } });
  right += SETS.cage(cx, cy, 0.6, t, { part: 'back', drop: clamp(0.62 + u * 3, 0, 1) }) + kid(0, { x: cx, y: cy, s: 0.32, volume: false, armL: 130, armR: 130, bodyY: 4 * Math.sin(t * 30), face: { name: 'angry', fx: ['anger'] } }) + SETS.cage(cx, cy, 0.6, t, { part: 'front', drop: clamp(0.62 + u * 3, 0, 1) });
  let o = clipTo(-10, -10, 970, 1100, left) + clipTo(960, -10, 980, 1100, right);
  o += S.path('M955 -20 L965 -20 L965 1100 L955 1100 Z', { fill: '#FFFFFF' }) + S.path('M940 -20 L980 -20 L980 1100 L940 1100 Z', { fill: 'none', stroke: LINE_, 'stroke-width': 8 });
  return o + whip(t, CUT.split, -1);
}
// ---- KID helpers
const KID_I = 7;
function theKid(t, pose = {}, act = {}) { return actor('kid', t, { i: KID_I, shade: true, shadow: true, ...pose }, act); }
// ---- 28. KID: "Make me fly!" -> ;fly kid -> up he goes
function shKid1(t) {
  const cam = { zoom: 1.32, x: 30, y: 140 };
  const tFly = w(17, 'fly');
  const up = ease.out(seg(t, tFlyKid + 0.04, tFlyKid + 0.5));
  let ch = '';
  ch += theKid(t, { x: 720, y: 980, s: 0.6, turn: 0.3, lift: 40 * Math.abs(Math.sin(t * 9)) * (1 - up) + 230 * up, ...boing(t, tFlyKid + 0.04, 0.3), armL: 150, armR: 150, face: up > 0 ? { name: 'excited' } : { name: 'excited' } }, { energy: 1.5, arms: false });
  ch += hero(t, { x: 1230, y: 980, s: 0.52, turn: -0.3, ...typing(t, t > tFly && t < tFlyKid, 14), face: { name: 'smug', eyes: { look: [-0.6, 0] } } }, {}, { mode: 'back', glow: 1 });
  ch += K.commandBurst(720, 700 - 230 * up, t - tFlyKid, '#3DFF9A', 200);
  let o = hall(t, cam, ch);
  o += cmd(t, 1330, 140, ';fly kid', typeBetween(t, w1(17, 'fly'), tFlyKid - 0.04), tFlyKid, { s: 1.3, tIn: w1(17, 'fly') - 0.1 });
  return o;
}
// ---- 29. KID (floating): "No, wait, make me GIANT!" -> ;size kid 10 -> he grows, bonks the ceiling
function shKid2(t) {
  const g = ease.outBack(seg(t, tGiant + 0.03, tGiant + 0.4));
  const cam = camKeys(t, [[CUT.kid2, { zoom: 1.35, x: -230, y: 0 }], [tGiant, { zoom: 1.4, x: -230, y: -10 }], [tGiant + 0.35, { zoom: 0.92, x: -150, y: -20 }], [CUT.kid3, { zoom: 0.9, x: -150, y: -20 }]], ease.out);
  shakeAll(cam, t, [[tGiant + 0.3, 0.4, 20]]);
  const s = lerp(0.6, 1.25, g);
  const lift = lerp(230, 0, clamp(g, 0, 1));
  const kh = 900 * s;                                 // approx. height of the kid
  const sq = clamp((980 - lift - 60) / kh, 0.75, 1);   // squashed under the ceiling (y 60)
  const no = t < w(17, 'make', 1);
  const wave = no ? Math.sin(t * 16) : 0;
  let ch = '';
  ch += theKid(t, { x: 720, y: 980, s, volume: g > 0.05 ? false : undefined, lift: lift + 10 * Math.sin(t * 3), sy: sq, sx: 1 + (1 - sq) * 0.6, armL: no ? 110 + 30 * wave : 160, armR: no ? 110 - 30 * wave : 160, headRot: no ? 10 * wave : 0, face: g > 0.2 ? { name: 'excited' } : undefined }, { energy: 1.5, arms: false });
  ch += hero(t, { x: 1230, y: 980, s: 0.52, turn: -0.3, ...typing(t, t > w(17, 'make', 1) && t < tGiant, 14), face: g > 0.1 ? { name: 'shocked', eyes: { look: [-0.4, -0.8] } } : { name: 'smug', eyes: { look: [-0.6, -0.6] } } }, {}, { mode: 'back', glow: 1 });
  ch += K.commandBurst(720, 400, t - tGiant, '#3DFF9A', 320);
  if (g > 0.6) ch += X.debris(720, 70, t, tGiant + 0.3, 8, 1.2, 5) + bang('BONK!', 1060, 160, pop(t, tGiant + 0.3, 0.2), 110, 8, '#FFFFFF');
  let o = hall(t, cam, ch);
  o += cmd(t, 1380, 140, ';size kid 10', typeBetween(t, w(17, 'make', 1), tGiant - 0.04), tGiant, { s: 1.3, tIn: w(17, 'make', 1) - 0.1 });
  return o + smash(t, tGiant + 0.05, 0.12, 0.6);
}
// ---- 30. KID (giant): "No, wait, BOTH!" -> ;fly kid -> CRASH through the ceiling
function shKid3(t) {
  const cam = shakeAll({ zoom: 0.86, x: -120, y: -40 }, t, [[tBoth + 0.05, 0.6, 26]]);
  const up = ease.in(seg(t, tBoth + 0.04, tBoth + 0.4));
  const s = 1.25, kh = 900 * s;
  const sq = up > 0 ? 1 + 0.15 * up : clamp((980 - 60) / kh, 0.75, 1);
  const no = t < w(17, 'BOTH');
  const wave = no ? Math.sin(t * 16) : 0;
  let ch = '';
  if (up < 1) ch += theKid(t, { x: 720, y: 980, s, volume: false, lift: 1700 * up, sy: sq, sx: up > 0 ? 0.9 : 1 + (1 - sq) * 0.6, armL: no ? 100 + 30 * wave : 175, armR: no ? 100 - 30 * wave : 175, headRot: no ? 8 * wave : 0 }, { energy: 1.4, arms: false });
  ch += hero(t, { x: 1240, y: 980, s: 0.52, turn: -0.3, ...typing(t, t > w(17, 'BOTH') - 0.1 && t < tBoth, 14), face: up > 0 ? { name: 'scream' } : { name: 'nervous', fx: ['sweat'], eyes: { look: [-0.4, -0.8] } } }, {}, { mode: 'back', glow: 1 });
  // the hole in the ceiling
  if (up > 0.3) ch += S.path('M420 -200 L470 40 L560 10 L620 60 L700 20 L800 70 L880 30 L990 50 L1010 -200 Z', { fill: '#7FC4FF', stroke: LINE_, 'stroke-width': 8 }) + SETS.cloud(560, -120, 0.6);
  ch += X.debris(720, 40, t, tBoth + 0.12, 12, 1.4, 9) + K.commandBurst(720, 500, t - tBoth, '#3DFF9A', 360);
  let o = hall(t, cam, ch);
  o += bang('CRASH!', 620, 300, pop(t, tBoth + 0.15, 0.2), 170, -6, '#FFD21F');
  o += cmd(t, 1400, 140, ';fly kid', typeBetween(t, w(17, 'BOTH'), tBoth - 0.03), tBoth, { s: 1.3, tIn: w(17, 'BOTH') - 0.12 });
  return o + smash(t, tBoth + 0.06, 0.14, 0.7);
}
// ---- 31. Zoe: "Stop. Please." (dust falling)
function shZoe(t) {
  const camBg = { zoom: 1.8, x: -150, y: 40 };
  let o = hall(t, camBg, X.debris(1200, -100, t, CUT.zoe - 0.6, 6, 1.1, 13));
  const u = seg(t, CUT.zoe, CUT.logs);
  o += S.g(actor('zoe', t, { x: 900, y: faceAt(480, 1.1, 0.95), s: 1.1, volume: false, armL: 110 + 10 * Math.sin(t * 6), armR: 120, turn: 0.15, face: { name: 'scared', fx: ['sweat'] } }, { arms: false }), `translate(960 540) scale(${f(1 + 0.05 * u)}) translate(-960 -540)`);
  return o;
}
// ---- 32. "The logs." (insert: the admin log scrolls — every command is saved)
const LOG = [';fly me', ';speed Granny', ';size Pancake 10', ';fly Dad', ';god me', ';jail Brick', ';tp me to front of line', ';speed me', ';noclip me', ';noclip me AWAY', ';fly Maya', ';size Leo head 5', ';jail Max', ';fly kid', ';size kid 10', ';fly kid'];
function shLogs(t) {
  const u = seg(t, CUT.logs, CUT.zoe2);
  const n = Math.round(lerp(10, LOG.length, ease.out(u)));
  const scr = SETS.adminScreen(t, { lines: LOG.slice(0, n), title: 'ADMIN LOG', cursor: true });
  let o = S.rect(0, 0, 1920, 1080, 0, { fill: '#2A2722' });
  o += SETS.laptop(960, 1490, 3.25 + 0.12 * u, scr, { glow: 0.6, t });
  // Zoe's finger tapping the screen
  const tap = 0.5 + 0.5 * Math.sin(t * 14);
  o += S.g(X.oldHand(0, 0, 1, 0).replace(/#F2D2BC/g, '#D9A27A').replace(/#D9B096/g, '#C48A62').replace(/#8E949F/g, '#FF8A2A').replace(/#757B86/g, '#E26F14'), tf(lerp(2300, 1380, ease.out(seg(t, CUT.logs, CUT.logs + 0.3))), 690 + 8 * tap, 1.3, 196));
  o += S.g(S.rect(-170, -40, 340, 80, 20, { fill: '#2A0C12', stroke: '#FF3B4E', 'stroke-width': 5 }) + S.circle(-120, 0, 14, { fill: Math.floor(t * 3) % 2 ? '#FF3B4E' : '#5A1A20' }) + T('LOGGED', 20, 18, 50, '#FF3B4E'), tf(1560, 140, pop(t, w(18, 'logs'), 0.2), -4));
  return o;
}
// ---- 33. "Somebody is going to notice." (two-shot; the giant kid's sneakers kick from the ceiling hole)
function shZoe2(t) {
  const cam = camKeys(t, [[CUT.zoe2, { zoom: 1.0, x: -10, y: -50 }], [CUT.relax, { zoom: 1.08, x: -10, y: -40 }]]);
  let ch = '';
  // the ceiling hole + dangling sneakers
  ch += S.path('M640 -300 L680 50 L760 20 L820 60 L900 30 L980 70 L1060 40 L1110 -300 Z', { fill: '#7FC4FF', stroke: LINE_, 'stroke-width': 8 });
  const kick = Math.sin(t * 9);
  for (const [lx, ph] of [[820, 0], [960, 2]]) ch += S.g(S.rect(-50, -260, 100, 380, 20, ol('#3A6A9A', 8)) + S.rect(-70, 110, 150, 70, 26, ol('#FFFFFF', 8)) + S.rect(-70, 150, 150, 30, 12, ol('#FF5A5A', 6)), tf(lx, 30, 1, 10 * Math.sin(t * 9 + ph)));
  ch += X.debris(880, 60, t, CUT.zoe2 - 0.4, 5, 0.8, 21);
  ch += actor('zoe', t, { x: 700, y: 980, s: 0.58, turn: 0.4, laptop: 'closed', face: { name: 'scared', eyes: { look: [0.8, 0] } } }, { arms: false });
  ch += hero(t, { x: 1230, y: 980, s: 0.55, turn: -0.4, armL: 30 + 10 * kick * 0, armR: 50, headRot: 6, face: { name: 'smug', eyes: { look: [-0.8, 0] } } }, {}, { mode: 'under', glow: 0.4 });
  return hall(t, cam, ch);
}
// ---- 34. "Zoe. Relax. Nobody reads the logs." (he laughs, leans on a locker; push-in to cocky)
function shRelax(t) {
  const tNobody = w(19, 'Nobody'), tLogs = w(19, 'logs');
  const cam = camKeys(t, [[CUT.relax, { zoom: 1.6, x: 60, y: 90 }], [tNobody - 0.05, { zoom: 1.65, x: 80, y: 90 }], [tNobody + 0.3, { zoom: 2.3, x: 230, y: 30 }], [CUT.dark, { zoom: 2.45, x: 230, y: 20 }]]);
  let ch = '';
  ch += actor('zoe', t, { x: 660, y: 980, s: 0.58, volume: false, turn: 0.5, armL: -20, armR: -20, face: { name: 'deadpan', eyes: { look: [0.8, 0], upper: 0.4 } } }, { arms: false });
  const laughing = t < tNobody;
  ch += hero(t, { x: 1180, y: 980, s: 0.58, volume: false, lean: -8, turn: -0.2, armR: laughing ? 60 + 20 * Math.sin(t * 10) : 120, armL: 14, bodyY: laughing ? 6 * Math.abs(Math.sin(t * 12)) : 0, face: laughing ? { name: 'joy' } : { name: 'smug', fx: t > tLogs ? ['sparkles'] : [] } }, { arms: false }, { mode: 'under', glow: 0.5 });
  return hall(t, cam, ch);
}
// ---- 35. the dark room: the log scrolls, a wrinkled hand stops it; then the eyes glint
const LOG_DARK = [';fly me', ';speed Granny', ';size Pancake 10', ';fly Dad', ';god me', ';jail Brick', ';tp me to front of line', ';speed me', ';noclip me', ';noclip me AWAY', ';fly Maya', ';size Leo head 5', ';jail Max', ';fly kid', ';size kid 10', ';fly kid'];
function shDark(t) {
  const tReads = w(20, 'reads');
  const stopT = tReads + 0.25;
  const scrollT = Math.min(t, stopT);
  const n = 4 + Math.floor((scrollT - CUT.dark) * 9);
  const lines = [];
  for (let i = 0; i < n; i++) lines.push(LOG_DARK[i % LOG_DARK.length]);
  const cam = { zoom: lerp(2.25, 2.45, seg(t, CUT.dark, CUT.eyes)), x: 0, y: -150 };
  let o = '';
  if (X.CS && X.CS.serverRoom) {
    const Ls = X.CS.serverRoom(t, cam, { logs: lines, logTitle: 'ADMIN LOG — user: you', lamp: 0, steam: false });
    o += Ls.bg + (Ls.mid || '') + (Ls.fg || '');
    const [sx0, sy0] = toScr(cam, 682, 182), [sx1, sy1] = toScr(cam, 682 + 556, 182 + 350);
    o += X.darkAround(sx0, sy0, sx1 - sx0, sy1 - sy0, 0.9, 160);
  } else {
    // fallback: a lone CRT in the dark
    o += S.rect(0, 0, 1920, 1080, 0, { fill: '#05040A' }) + S.rect(330, 120, 1260, 840, 40, ol('#3A3236', 10));
    o += S.g(SETS.adminScreen(t, { lines, title: 'ADMIN LOG — user: you' })(1160, 740), 'translate(960 540)');
  }
  // the hand: enters on "reads", stops the scroll
  const hk = ease.out(seg(t, tReads - 0.15, stopT));
  if (hk > 0) o += X.oldHand(lerp(2150, 1120, hk), lerp(1350, 700, hk), 1.6, 212, seg(t, stopT, stopT + 0.4));
  return o + S.rect(0, 0, 1920, 1080, 0, { fill: '#000', opacity: f(0.25 * seg(t, CUT.eyes - 0.15, CUT.eyes)) });
}
function shEyes(t) {
  const tLogs = w(20, 'logs');
  const u = seg(t, CUT.eyes, CUT.eyes + 1.4);
  let o = S.rect(0, 0, 1920, 1080, 0, { fill: '#030208' });
  const z = 1 + 0.08 * u;
  let g = '';
  // a faint band of screen light across the eyes
  g += S.rect(-200, 430, 2320, 220, 0, { fill: '#FFB347', opacity: 0.05 }) + S.rect(-200, 480, 2320, 120, 0, { fill: '#FFB347', opacity: 0.06 });
  // bushy brows + beard top (barely lit) — a hint, nothing more
  g += S.path('M560 420 Q700 360 860 410 Q760 420 700 450 Q640 440 560 470 Z M1360 420 Q1220 360 1060 410 Q1160 420 1220 450 Q1280 440 1360 470 Z', { fill: '#5A5866', opacity: 0.55 });
  g += S.path('M520 900 Q960 760 1400 900 Q1300 1000 960 1080 Q620 1000 520 900 Z', { fill: '#2A2830', opacity: 0.6 });
  for (const ex of [740, 1180]) {
    g += S.ellipse(ex, 540, 110, 44, { fill: '#1A1612', stroke: '#3A2E22', 'stroke-width': 4 });
    g += S.ellipse(ex + 10, 540, 40, 40, { fill: '#C98A2E', opacity: 0.8 }) + S.circle(ex + 10, 540, 16, { fill: '#000' });
    g += S.path(`M${ex - 112} ${540 - 6} Q${ex} ${540 - 70} ${ex + 112} ${540 - 6}`, { fill: '#030208' });
  }
  const gl = pop(t, tLogs, 0.25) * (1 - seg(t, tLogs + 0.6, tLogs + 1.2) * 0.4);
  if (gl > 0) g += SETS.sparkle(735, 520, 46 * gl, '#FFFFFF', 3) + SETS.sparkle(1175, 520, 46 * gl, '#FFFFFF', 3);
  o += S.g(g, `translate(960 540) scale(${f(z)}) translate(-960 -540)`);
  return o;
}

// ================================================================= dispatch
const SHOTS = [
  [CUT.yard, shYard], [CUT.line, shLine], [CUT.low, shLow], [CUT.jail, shJail], [CUT.cage, shCage], [CUT.stare, shStare], [CUT.tp, shTp],
  [CUT.gym, shGym], [CUT.speed, shSpeed], [CUT.boom, shBoom], [CUT.score, shScore], [CUT.shoes, shShoes], [CUT.coach, shCoach], [CUT.socks, shSocks],
  [CUT.cls, shClass], [CUT.nclip, shNoclip], [CUT.walk, shWalk], [CUT.office, shOffice], [CUT.pratt, shPratt], [CUT.two, shTwo], [CUT.no, shNo], [CUT.fall, shFall],
  [CUT.pop, shPop], [CUT.wanted, shWanted], [CUT.yes, shYes], [CUT.fly, shFly], [CUT.split, shSplit], [CUT.kid1, shKid1], [CUT.kid2, shKid2], [CUT.kid3, shKid3],
  [CUT.zoe, shZoe], [CUT.logs, shLogs], [CUT.zoe2, shZoe2], [CUT.relax, shRelax], [CUT.dark, shDark], [CUT.eyes, shEyes],
].sort((a, b) => a[0] - b[0]);
const WHIPS = [CUT.line, CUT.gym, CUT.cls, CUT.pop, CUT.wanted, CUT.zoe];
function shotAt(t) {
  let i = SHOTS.length - 1;
  while (i > 0 && t < SHOTS[i][0]) i--;
  return i;
}
function scene(t) {
  let o = SHOTS[shotAt(t)][1](t);
  for (const tc of WHIPS) if (Math.abs(t - tc) < 0.1) o += whip(t, tc, 1);
  return o;
}
function look(t) {
  if (t >= CUT.dark) return { grade: 'night', vignette: 1 };
  if (t >= CUT.office && t < CUT.pop) return { grade: 'warm', vignette: 0.6 };
  if (t >= CUT.boom && t < CUT.score) return { grade: 'warm', vignette: 0.5 };
  return { grade: null, vignette: 0.55 };
}

module.exports = { scene, look, SHOTS, CUT };
