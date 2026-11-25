// SC 04 · SCHOOL WITH STATS (242.74 … 320.56). The HUD is on all day: the school front with plates popping over every kid
// and a NEW AREA banner ("School was a whole new game."); Benji walks in (LV 4), his untied laces (SHOELACES · UNTIED), the
// SPECIAL SKILL card "FALLING DOWN", "Hey, buddy!" → the trip in slow-mo, books raining down, "I'm okay!" (HP 100 → 97,
// SKILL USED); Room 12: Mrs. Krump's FINAL BOSS plate, "My dog ate it!" → the LIE DETECTOR whips to 99 % + LIAR! and a
// MEANWHILE cutaway (the dog asleep next to the untouched homework, EATEN BY DOG: 0 %); BOSS ATTACK: POP QUIZ! → papers land,
// the DIFFICULTY roulette lands on IMPOSSIBLE; Benji's NERVOUS tag; "Is there something on my head?" — the hero stares at
// her plate, "Just your... very nice... level." → PATIENCE drops below zero; the gym: STR chips over the line-up, SORT BY
// STRENGTH ("Science. Pure science."), the picks (the quiet kid, STR 85, can't believe it), "You picked the quiet kid
// FIRST?", "He has a secret." → the wind-up (SECRET: CANNON ARM, STR overflow) and three throws, three OUTs (and Benji's
// special skill dodges a ball); VICTORY! + WIN stamps for every game, the coach speechless; the cafeteria: food tooltips
// (+20 HAPPINESS, +50 HEALTH −50 FUN), the mystery meat's "???", "Should we eat it?" / "It says QUESTION MARK." (the meat
// opens an eye); yellow quest markers drop over people, IN GAMES = REAL LIFE split, "Quests? Real life has QUESTS?"
// (hands over to SC 05: Tank comes for the hero's lunch in the same cafeteria).
'use strict';

const K = require('./kit');
const H = require('./hud');
const ST = require('./sets_town');
const X = require('../rig/extras');
const CAST = require('../rig/cast');
const AC = require('./acting');
const E = require('./s04_env');
const { S, f, clamp, lerp, ease, seg, bump, hash, ol, ln, T, TF, camKeys, view, actor } = K;
const { L } = K.V;
const { tf, TS, TFS, pop, toScr, camAt, shakeAll, boing, roll, whip, smash, zoomLines, streaks, letterbox, dim, panel, hudLayer, strChip, dmgNum, stamp, skillCard, attackCallout, flatPaper, fallingBook, dizzyStars } = E;

const SE = ST.SPOTS.schoolExterior, SC = ST.SPOTS.classroom, SG = ST.SPOTS.gym, SF = ST.SPOTS.cafeteria;
const A = Array.from({ length: 21 }, (_, i) => L('04.' + i));
const T0 = K.V.scene('SC 04').start, END = K.V.scene('SC 05').start;     // == main.js RANGES for SC 04
const w = (i, word, n = 0) => A[i].word(word, n).t0;
const w1 = (i, word, n = 0) => A[i].word(word, n).t1;

// ================================================================= the cut list (all from the voice)
const CUT = {};
CUT.ext = T0;
CUT.benjiIn = A[1].a - 0.05;
CUT.skill = w(1, 'His') - 0.15;
CUT.hey = A[2].a - 0.12;
CUT.trip = w(2, 'Whoa') - 0.12;
CUT.okay = w1(2, 'Whoa') - 0.14;
CUT.krump = A[3].a - 0.35;
CUT.dog = A[4].a - 0.25;
CUT.lie = A[5].a - 0.1;
CUT.lie99 = w(5, 'ninety-nine') - 0.35;
CUT.quiz = A[6].a - 0.2;
CUT.twenty = w(6, 'Twenty') - 0.25;
CUT.imp = A[7].a - 0.12;
CUT.bad = A[8].a - 0.15;
CUT.head = A[9].a - 0.3;
CUT.no = A[10].a - 0.1;
CUT.level = w(10, 'Just') - 0.1;
CUT.glare = w(10, 'level') - 0.1;
CUT.gym = A[11].a - 0.1;
CUT.science = w(11, 'Science') - 0.3;
CUT.pick = A[12].a - 0.12;
CUT.pick85 = w(12, 'And', 1) - 0.1;
CUT.first = A[13].a - 0.12;
CUT.secret = A[14].a - 0.15;
CUT.windup = A[14].b + 0.05;
CUT.throw = lerp(A[14].b, A[15].a, 0.42);
CUT.victory = A[15].a - 0.1;
CUT.every = w(15, 'Every') - 0.15;
CUT.coach = A[15].b + 0.05;
CUT.lunch = A[16].a - 0.1;
CUT.meat = w(16, 'The') - 0.2;
CUT.eat = A[17].a - 0.15;
CUT.qmark = A[18].a - 0.08;
CUT.qzoom = w(18, 'QUESTION') - 0.12;
CUT.marks = A[19].a - 0.05;
CUT.game = w(19, 'Like') - 0.15;
CUT.quests = A[20].a - 0.1;
CUT.real = w(20, 'Real') - 0.2;
{
  const ks = Object.keys(CUT);
  for (let i = 1; i < ks.length; i++) if (CUT[ks[i]] < CUT[ks[i - 1]] + 0.2) CUT[ks[i]] = CUT[ks[i - 1]] + 0.2;
}
const nextCut = (key) => { const ks = Object.keys(CUT); const i = ks.indexOf(key); return i + 1 < ks.length ? CUT[ks[i + 1]] : END; };

// beats inside shots
const tFour = w(1, 'four');
const tLv = w(1, 'level');
const tFallDown = w(1, 'falling'), tDown = w(1, 'down');
const tHey = w(2, 'Hey'), tBuddy = w(2, 'buddy');
const tOkay = w(2, 'okay'), tIm = w(2, "I'm");
const tLies = w(5, 'lies'), t99 = w(5, 'ninety-nine'), tPct = w(5, 'percent');
const tPopQ = w(6, 'quiz'), tQs = w(6, 'questions');
const tDiff = w(7, 'Difficulty'), tImp = w(7, 'impossible');
const tBad2 = w(8, 'bad', 1), tSounds = w(8, 'sounds');
const tYour = w(10, 'your'), tNice = w(10, 'nice'), tLevel = w(10, 'level');
const tStrength = w(11, 'strength'), tSci = w(11, 'Science'), tPure = w(11, 'Pure');
const tYou1 = w(12, 'You'), tYou2 = w(12, 'you', 1), tDef = w(12, 'definitely'), t85 = w(12, 'eighty-five');
const tFirst = w(13, 'FIRST');
const tTrust = w(14, 'Trust'), tSecret = w(14, 'secret');
const tWon = w(15, 'won');
const tWins = [w(15, 'Every'), w(15, 'single'), w(15, 'game')];
const tThrows = [0, 1, 2].map((k) => CUT.throw + 0.1 + k * 0.42);
const FLY = 0.22;
const tBenjiDodge = CUT.throw + 0.55;
const tEven = w(16, 'Even'), tLunchW = w(16, 'lunch'), tStats = w(16, 'stats');
const tMystery = w(16, 'mystery'), tSaid = w(16, 'said'), tQuestion = w(16, 'question'), tMark = w(16, 'mark');
const tQM = w(18, 'QUESTION'), tMARK = w(18, 'MARK');
const tPeople = w(19, 'people'), tLittle = w(19, 'little'), tYellow = w(19, 'yellow'), tMarks = w(19, 'marks');
const tQuests1 = w(20, 'Quests'), tQuests2 = w(20, 'QUESTS');

// ================================================================= people + small shared helpers
const you = (t, p, a = {}) => actor('you', t, p, a);
const benji = (t, p, a = {}) => actor('benji', t, { t, ...p }, a);
const kid = (i, p) => K.draw.kid(i, p);
const sAt = (cam, s) => s * (cam.zoom ?? 1);
// head-top screen point of a cast member drawn at (x, y, s) in world space seen through cam
const headScr = (cam, who, x, y, s, pose = {}) => { const h = H.overHead(who, x, y, s, 0, pose); return toScr(cam, h.x, h.y); };
const CLOCK = { ext: '8:02 AM', class: '9:15 AM', gym: '11:20 AM', caf: '12:05 PM' };

// the always-on HUD (frame + XP bar), with optional screen pop-ups between them
const hud = (t, clock, mid = '', o = {}) => hudLayer(t, clock, mid, o);

// ---------------------------------------------------------------- the school front
const EXT_NAMES = ['MIA', 'JAY', 'LEO', 'ZOE', 'SAM', 'AVA', 'MO', 'KAI', 'NOA', 'ELI', 'IVY', 'BEN'];
function extShot(t, cam, o, back, after) {
  return ST.schoolExterior.compose(t, cam, { crowd: 0.9, marquee: ['WELCOME BACK OWLS!', 'SCIENCE FAIR FRI'], ...o }, back, after);
}
// Benji's walk along the sidewalk (shots 2-4)
const benjiX = (t) => 300 + 150 * (t - CUT.benjiIn);
const BENJI_PH = 6.5, BENJI_AMP = 0.55;
const HX = 1500;                                  // the hero waits on the sidewalk

// ---------------------------------------------------------------- Room 12
// kid looks per seat (−1 dog kid, −2 hero, −3 Benji are drawn by the shots)
const CLASS_KIDS = [[11, 14, 17, 1, 22, 5], [12, 8, 13, -1, 16, 21], [-2, -3, -9, 9, 18, 20]];
function classKids(t, o = {}) {
  return SC.rows.map((row, r) => row.map((seat, j) => {
    const i = CLASS_KIDS[r][j];
    if (i < 0) return '';
    const look = o.lookX !== undefined ? clamp((o.lookX - seat.x) / 700, -1, 1) : -0.3;
    const face = typeof o.face === 'function' ? o.face(i, seat) : o.face || 'neutral';
    return kid(i, { x: seat.x, y: seat.y, s: seat.s, turn: clamp(look * 0.6, -0.6, 0.6), bodyY: 3 * Math.sin(t * 3.4 + i), face });
  }).join('') + (r === 2 ? SC.smartTable.seats.map((seat, j) => kid([2, 3, 23][j], { x: seat.x, y: seat.y, s: seat.s, turn: -0.2, face: 'neutral' })).join('') : ''));
}
// class composite: extra.row3 / row2 / row1 (drawn with each row's kids), extra.after (in front of every table)
function classShot(t, cam, o = {}, extra = {}) {
  const ks = classKids(t, o);
  const board = t >= CUT.quiz ? { board: ['POP QUIZ!', '20 QUESTIONS'] } : {};
  return ST.classroom.compose(t, { clock: '9:15', ...board, ...(o.set || {}) }, [ks[0] + (extra.row3 || ''), ks[1] + (extra.row2 || ''), ks[2] + (extra.row1 || '')], extra.after || '', cam);
}
const KR = { x: 690, y: 1180, s: 0.6 };          // Mrs. Krump at the hero's desk (shots "my head?")
const papersOnDesks = () => flatPaper(SC.quizPaper.x, SC.quizPaper.y + 4, 0.36, -3, { name: 'YOU' }) + flatPaper(SC.benjiDesk.x, SC.quizPaper.y + 6, 0.36, 4, { name: 'BENJI' });

// ---------------------------------------------------------------- the gym
const LINEUP = [
  { i: 0, name: 'KEVIN', str: 41 }, { i: 10, name: 'PRIYA', str: 72 }, { i: 1, name: 'QUIET KID', str: 85 },
  { i: 7, name: 'MARCUS', str: 63 }, { i: 19, name: 'ZOE', str: 58 }, { i: 15, name: 'TYLER', str: 33 },
];
const QK = 2, PR = 1, KV = 0;                     // line-up slots: quiet kid, Priya, Kevin
function gymShot(t, cam, o = {}, chars = '') {
  return ST.gym.compose(t, { clock: '2:00', ...o }, '', chars, cam);
}
const lineSpot = (j) => SG.lineup[j];

// ---------------------------------------------------------------- the cafeteria
function cafShot(t, cam, o = {}, rows = {}) {
  return ST.cafeteria.compose(t, { clock: '12:05', ...o }, [rows.back || '', rows.front || '', rows.lady || ''], rows.lane || '', cam);
}
const HERO_SEAT = SF.heroSeat, BENJI_SEAT = SF.benjiSeat;
// the people who get yellow quest markers (world coords; who = cast key for the head top)
const QUESTERS = [
  { who: 'kid', i: 13, x: 860, y: 920, s: 0.4, at: () => tPeople - 0.1, note: 'alone at the back table' },
  { who: 'lunchLady', x: 1730, y: 885, s: 0.47, at: () => tLittle - 0.08, note: 'the lunch lady' },
  { who: 'adult', i: 8, x: 2060, y: 1010, s: 0.5, at: () => tYellow - 0.06, note: 'the janitor' },
  { who: 'kid', i: 17, x: 1460, y: 950, s: 0.47, at: () => tMarks - 0.05, note: 'a kid in the lunch line' },
  { who: 'kid', i: 22, x: 140, y: 920, s: 0.4, at: () => tMarks + 0.3, note: 'a kid at the back table' },
];
function lunchLady(t, p = {}) { return actor('lunchLady', t, { x: SF.lunchLady.x, y: SF.lunchLady.y, s: SF.lunchLady.s, face: { name: 'smug', mouth: 'smirk' }, ...p }); }
function janitor(t, x, y, s) {
  const sw = Math.sin(t * 3.2);
  const mop = S.g(S.path('M0 0 L0 -620', ln(16, '#B07A4A')) + S.path('M0 0 L0 -620', ln(6, '#D9A774')) + S.path('M-70 0 Q-60 50 0 56 Q60 50 70 0 Z', ol('#E9E4D8', 6)) + S.path('M-50 10 l-6 40 M-20 14 l-2 42 M10 14 l2 42 M40 10 l6 40', ln(5, '#C9C2B2')), `translate(${f(x - 140 * s + sw * 40 * s)} ${f(y)}) rotate(${f(14 + sw * 8)}) scale(${f(s)})`);
  return mop + K.draw.adult(8, { x, y, s, turn: -0.4, armL: 40 + sw * 8, armR: 30, face: 'neutral' });
}
function questPeople(t, o = {}) {
  let back = '', lane = '';
  for (const q of QUESTERS) {
    if (q.who === 'lunchLady') continue;
    if (q.who === 'adult') { lane += janitor(t, q.x, q.y, q.s); continue; }
    const p = kid(q.i, { x: q.x, y: q.y, s: q.s, turn: q.i === 13 ? 0.1 : -0.3, face: q.i === 13 ? 'sad' : 'neutral', bodyY: 3 * Math.sin(t * 3 + q.i), armR: q.i === 17 ? 30 : undefined });
    if (q.y < 1000 && q.y < 940 && q.i !== 17) back += p; else lane += p;
  }
  return { back, lane };
}
// world head tops of the questers
const questTop = (q) => (q.who === 'kid' || q.who === 'adult' ? H.overHead(q.who, q.x, q.y, q.s, 0, { i: q.i }) : H.overHead(q.who, q.x, q.y, q.s));
function questMarkers(t, cam, kOf, s = 1) {
  let o = '';
  QUESTERS.forEach((q, j) => {
    const k = kOf(q, j);
    if (k <= 0) return;
    const h = questTop(q), p = toScr(cam, h.x, h.y);
    o += H.questMarker({ x: p.x, y: p.y, s: s * clamp(0.6 + 0.4 * p.z, 0.85, 1.3), t, k, seed: j * 1.7 });
  });
  return o;
}
const markerDots = (t, kOf) => {
  const base = [[0.35, -0.5, '#FFFFFF'], [0.55, 0.2, '#FFFFFF'], [-0.2, 0.5, '#FFFFFF'], [0.1, -0.15, '#FFFFFF']];
  const qd = [[-0.45, -0.35], [0.4, -0.4], [0.62, 0.05], [0.2, 0.3], [-0.6, 0.15]];
  QUESTERS.forEach((q, j) => { if (kOf(q, j) > 0.3) base.push([qd[j][0], qd[j][1], '#FFD21F']); });
  return base;
};

// ================================================================= SHOTS
// ---- 1. "School was a whole new game." — the school front; plates pop over every kid; NEW AREA DISCOVERED
function shExt(t) {
  const c0 = CUT.ext, c1 = nextCut('ext');
  const cam = camKeys(t, [[c0, { x: 0, y: -150, zoom: 0.74 }], [c1 + 0.1, camAt(990, 640, 1.1)]], ease.inOut);
  const o = { crowd: 0.9 };
  const kids = ST.schoolExterior.crowdAt(t, o);
  const u = seg(t, c0 - 0.2, c1 + 0.4);
  const hy = lerp(985, 900, u), hs = SE.scaleAt(hy), hx = 1110;
  const heroPose = { x: hx, y: hy, s: hs, view: 'back', backpack: true, ...AC.walkFront((t - c0) * 8.6, 1.2), lean: 2 };
  const hero = you(t, heroPose, { arms: false });
  let o2 = extShot(t, cam, o, '', hero);
  // a wave of mini plates over the walking kids
  let plates = '';
  kids.slice().sort((a, b) => a.x - b.x).forEach((p, j) => {
    const k = seg(t, c0 + 0.25 + j * 0.13, c0 + 0.6 + j * 0.13);
    if (k <= 0) return;
    const top = toScr(cam, p.x, p.y - 900 * p.s);
    if (top.x < -100 || top.x > 2020) return;
    plates += H.miniPlate({ x: top.x, y: top.y - 4, s: clamp(0.45 + p.s * 1.5, 0.6, 1.1) * clamp(cam.zoom, 0.75, 1.2), k, t, name: EXT_NAMES[(p.i || j) % EXT_NAMES.length], level: 2 + Math.floor(hash(p.i * 3.3 + 1) * 40), hp: 0.35 + 0.6 * hash(p.i * 1.9) });
  });
  const ht = toScr(cam, ...Object.values(H.overHead('you', hx, hy, hs, 0, { bodyY: heroPose.bodyY })));
  plates += H.heroPlate({ x: ht.x, y: ht.y, s: 0.62 * clamp(cam.zoom, 0.7, 1.2), t, k: seg(t, c0 + 0.9, c0 + 1.4) });
  o2 += plates;
  const tw = w(0, 'whole');
  const toast = H.questToast({ head: 'NEW AREA DISCOVERED', title: 'Oakhill Middle School', sub: 'RECOMMENDED LEVEL: 10+   ·   YOUR LEVEL: 1', kind: 'new', t, k: seg(t, tw - 0.3, tw + 0.35), y: 215, s: 0.92 });
  o2 += hud(t, CLOCK.ext, toast);
  return o2 + whip(t, c0, 1, 0.16);
}

// ---- 2. "Benji was level four." — Benji ambles along the sidewalk hugging his books; his plate pops; punch-in on "four"
function shBenjiIn(t) {
  const c0 = CUT.benjiIn, c1 = nextCut('benjiIn');
  const bx = benjiX(t), by = 965, bs = 0.5;
  let cam = camKeys(t, [[c0, camAt(benjiX(c0) + 300, 650, 1.1)], [c1, camAt(benjiX(c1) + 330, 640, 1.16)]], ease.inOut);
  const pk = ease.outBack(seg(t, tFour - 0.05, tFour + 0.25));
  cam = { ...cam, zoom: cam.zoom * (1 + 0.12 * pk) };
  const bp = { x: bx, y: by, s: bs, view: 'side', flip: true, books: true, ...AC.walk((t - c0) * BENJI_PH, BENJI_AMP) };
  const ben = benji(t, bp);
  const hero = you(t, { x: HX, y: 975, s: 0.505, turn: -0.5, backpack: true, face: 'happy', armR: 12 + 4 * Math.sin(t * 3) }, { arms: false });
  let o = extShot(t, cam, { crowd: 0.35 }, '', ben + hero);
  const hb = headScr(cam, 'benji', bx, by, bs, { bodyY: bp.bodyY });
  o += H.plateFor('benji', { x: hb.x, y: hb.y, s: 0.95, t, k: seg(t, tLv - 0.35, tLv + 0.25), tags: [] });
  const hh = headScr(cam, 'you', HX, 975, 0.505);
  if (hh.x < 1800) o += H.heroPlate({ x: hh.x, y: hh.y, s: 0.6, t });
  return o + hud(t, CLOCK.ext);
}

// ---- 3. "His special skill was 'falling down.'" — down at his feet: the untied laces; tilt up → the SPECIAL SKILL card
function shSkill(t) {
  const c0 = CUT.skill, c1 = nextCut('skill');
  const bx = benjiX(t), by = 965, bs = 0.5;
  const tilt0 = w(1, 'skill') + 0.15, tilt1 = tFallDown - 0.12;
  const cy = camKeys(t, [[c0, { y: 892, z: 2.4 }], [tilt0, { y: 885, z: 2.3 }], [tilt1, { y: 640, z: 1.45 }], [c1, { y: 630, z: 1.5 }]], ease.inOut);
  const cam = camAt(bx + lerp(60, 150, seg(t, tilt0, tilt1)), cy.y, cy.z);
  const bp = { x: bx, y: by, s: bs, view: 'side', flip: true, books: true, ...AC.walk((t - CUT.benjiIn) * BENJI_PH, BENJI_AMP) };
  let o = extShot(t, cam, { crowd: 0 }, '', benji(t, bp));
  // the laces tooltip, pinned to his front shoe
  const foot = toScr(cam, bx + 42, by - 14);
  o += H.tooltip({ x: foot.x, y: foot.y, t, k: seg(t, w(1, 'His') - 0.15, w(1, 'His') + 0.35), title: 'SHOELACES', rarity: 'cursed', lines: [{ label: 'STATUS: ', value: 'UNTIED', col: '#FF4D66' }, 'TRIP CHANCE 100%'], side: 'up', dist: 70, dx: 60, s: 1.05, out: seg(t, tilt1 - 0.25, tilt1 + 0.1) });
  const hb = headScr(cam, 'benji', bx, by, bs, { bodyY: bp.bodyY });
  o += H.plateFor('benji', { x: hb.x, y: hb.y, s: 0.95, t, tags: [{ text: 'CLUMSY', k: seg(t, tDown - 0.05, tDown + 0.3) }] });
  o += skillCard({ x: clamp(hb.x + 470, 700, 1500), y: hb.y + 250, s: 0.95, t, k: seg(t, tFallDown - 0.2, tDown + 0.35) });
  return o + hud(t, CLOCK.ext);
}

// ---- 4. "Hey, buddy!" — Benji turns to us, waves big with the books on one arm; the hero waves back
function shHey(t) {
  const c0 = CUT.hey, c1 = nextCut('hey');
  const u = seg(t, c0, c1);
  const bx = lerp(1000, 1110, u), by = lerp(950, 968, u), bs = 0.5;
  const cam = camKeys(t, [[c0, camAt(1290, 640, 1.16)], [c1, camAt(1280, 630, 1.24)]]);
  const wave = 150 + 22 * Math.sin(t * 15);
  const bp = { x: bx, y: by, s: bs, turn: 0.45, books: true, freeArms: true, ...AC.walkFront((t - c0) * 8.5, 0.9) };
  bp.armR = 22; bp.bendR = -116; bp.armL = lerp(30, wave, seg(t, c0, tHey + 0.1));
  const ben = benji(t, bp, { arms: false, energy: 1.2 });
  const wv = bump(t, tBuddy - 0.1, tBuddy + 1.0);
  const hero = you(t, { x: HX, y: 975, s: 0.505, turn: -0.45, backpack: true, face: 'happy', armL: 10 + 140 * Math.min(1, wv * 2) + 18 * Math.sin(t * 14) * wv }, { arms: false });
  let o = extShot(t, cam, { crowd: 0 }, '', ben + hero);
  const hb = headScr(cam, 'benji', bx, by, bs, { bodyY: bp.bodyY });
  o += H.plateFor('benji', { x: hb.x, y: hb.y, s: 0.95, t, tags: ['CLUMSY'] });
  const hh = headScr(cam, 'you', HX, 975, 0.505);
  o += H.heroPlate({ x: hh.x, y: hh.y, s: 0.6, t });
  return o + hud(t, CLOCK.ext);
}

// ---- 5. "Whoa—" — the laces catch; slow-motion dive, the books explode out of his arms
function shTrip(t) {
  const c0 = CUT.trip, c1 = nextCut('trip');
  const u = ease.out(seg(t, c0, c1 + 0.05));
  const bx = 1110 + 120 * u, by = 968, bs = 0.5;
  const cam = shakeAll(camKeys(t, [[c0, camAt(1250, 660, 1.45)], [c1, camAt(1290, 650, 1.6)]], ease.linear), t, [[c0 + 0.02, 0.25, 9]]);
  const bp = {
    x: bx, y: by, s: bs, view: 'side', flip: true,
    rot: 40 * u, lift: 70 * Math.sin(Math.min(1, u * 1.2) * Math.PI * 0.8), legL: -40 * u, legR: 30 * u, kneeL: 30, kneeR: 50 * u,
    armL: 160 + 15 * Math.sin(t * 30), armR: 130 + 25 * Math.sin(t * 27), face: { name: 'shocked', fx: ['sweat'] },
  };
  const ben = benji(t, bp, { arms: false });
  // the books burst out of his arms and hang in the air (slow-mo)
  let books = '';
  const a = t - (c0 + 0.04);
  if (a > 0) for (let i = 0; i < 5; i++) {
    const vx = (hash(i * 2.3) - 0.35) * 420, vy = -(330 + 260 * hash(i + 2.1)), g = 520;
    const x = bx + 60 + vx * a, y = by - 300 + vy * a + 0.5 * g * a * a;
    books += fallingBook(x, y, 1, i, 0.5).replace(/rotate\([^)]*\)/, `rotate(${f((hash(i + 4) - 0.5) * 520 * a + i * 30)})`);
  }
  const hero = you(t, { x: HX, y: 975, s: 0.505, turn: -0.5, armL: 70 * seg(t, c0 + 0.1, c0 + 0.4), face: { name: 'shocked' } }, { arms: false });
  let o = roll(extShot(t, cam, { crowd: 0 }, '', hero + ben + books), -3 * u);
  o += streaks(t, 250, 850, 10, 4, '#FFFFFF', 0.35, 900, -1);
  return o + hud(t, CLOCK.ext);
}

// ---- 6. "I'm okay!" — flat on his bottom, the books rain down, the last one bonks his hat; HP −3; SKILL USED
function shOkay(t) {
  const c0 = CUT.okay, c1 = nextCut('okay');
  const bx = 1200, by = 990, bs = 0.5;
  const cam = shakeAll(camKeys(t, [[c0, camAt(1300, 690, 1.32)], [c1, camAt(1310, 690, 1.42)]]), t, [[c0, 0.3, 12], [tOkay - 0.02, 0.2, 6]]);
  const thumbs = seg(t, tIm - 0.15, tIm + 0.1);
  const bp = { x: bx, y: by, s: bs, fallen: true, freeArms: true, armL: 60, bendL: 30, armR: lerp(64, 158, ease.outBack(thumbs)), bendR: lerp(30, 0, thumbs), face: t < tIm - 0.1 ? { name: 'dizzy' } : { name: 'dizzy', mouth: 'grin' }, ...boing(t, c0, 0.25) };
  const ben = benji(t, bp);
  const heroArm = seg(t, A[2].b + 0.1, A[2].b + 0.5);
  const hero = you(t, { x: HX, y: 980, s: 0.505, turn: -0.5, armL: lerp(10, 66, heroArm), face: { name: 'happy', fx: ['sweat'] } }, { arms: false });
  // books raining down around him; the last one bonks his hat on "okay!"
  const hTop = H.overHead('benji', bx, by, bs, 0, { bodyY: 250 });
  let books = '';
  const drops = [[bx - 210, by + 6, c0 - 0.2], [bx + 190, by + 10, c0 - 0.12], [bx - 120, by + 26, c0 - 0.02], [bx + 90, by + 22, c0 + 0.06]];
  drops.forEach(([x, y, t0], i) => { books += fallingBook(x, y, t - t0, i, 0.5, 760); });
  const tBonk = tOkay - 0.32;
  books += fallingBook(bx + 6, hTop.y + 26, t - tBonk, 4, 0.42, 820);
  let o = extShot(t, cam, { crowd: 0 }, '', hero + ben + books);
  const hs = toScr(cam, hTop.x, hTop.y);
  if (t > tBonk + 0.3) o += dizzyStars(hs.x, hs.y + 30, 90, t, 1.2);
  o += dmgNum(hs.x + 150, hs.y + 60, t - c0 - 0.02, '-3', '#FF4D66', 1);
  o += dmgNum(hs.x - 120, hs.y + 10, t - tBonk - 0.32, '-0', '#FFB020', 0.8);
  o += H.plateFor('benji', { x: hs.x, y: hs.y - 30, s: 0.95, t, tags: ['CLUMSY'], bars: [{ label: 'HP', value: 97, from: 100, roll: seg(t, c0 + 0.02, c0 + 0.55) }] });
  const hh = headScr(cam, 'you', HX, 980, 0.505);
  o += H.heroPlate({ x: hh.x, y: hh.y, s: 0.6, t });
  const msg = H.systemMsg({ k: seg(t, A[2].b + 0.0, A[2].b + 0.45), t, text: 'SKILL USED: FALLING DOWN', sub: 'TIMES TODAY: 7', theme: 'info', y: 150, s: 0.86 });
  return o + hud(t, CLOCK.ext, msg) + whip(t, c1, 1, 0.12);
}

// ---- 7. "Who forgot their homework?" — Room 12; Mrs. Krump by the board, FINAL BOSS plate, PATIENCE 0 %
function shKrump(t) {
  const c0 = CUT.krump, c1 = nextCut('krump');
  const cam = camKeys(t, [[c0, camAt(600, 480, 1.24)], [c1, camAt(640, 470, 1.36)]]);
  const tp = SC.teacherFront;
  const glare = bump(t, w(3, 'homework') - 0.1, w(3, 'homework') + 0.5);
  const tch = actor('teacher', t, { x: tp.x, y: tp.y, s: tp.s, t, pointer: true, pointerRot: 26 + 18 * Math.sin(t * 7), glare, turn: 0.15 }, { energy: 0.6 });
  const hero = you(t, { ...SC.heroDesk, turn: -0.4, face: { name: 'nervous' } }, { arms: false });
  const ben = benji(t, { ...SC.benjiDesk, turn: -0.5, face: { name: 'nervous', fx: ['sweat'] } }, { arms: false });
  let o = classShot(t, cam, { face: (i) => (hash(i) > 0.5 ? 'nervous' : 'neutral'), lookX: 760 }, { row1: hero + ben, after: tch });
  const ht = headScr(cam, 'teacher', tp.x, tp.y, tp.s);
  o += H.plateFor('teacher', { x: ht.x, y: ht.y, s: 1.0, t, k: seg(t, c0 + 0.05, c0 + 0.6) });
  return o + hud(t, CLOCK.class) + smash(t, c0, 0.12, 0.6);
}

// ---- 8. "My dog ate it!" — the spiky-haired kid in row 2 shoots his hand up, sweating
function shDog(t) {
  const c0 = CUT.dog, c1 = nextCut('dog');
  const dk = SC.dogKid;
  const cam = camKeys(t, [[c0, camAt(dk.x, 650, 1.72)], [c1, camAt(dk.x - 10, 640, 1.9)]]);
  const up = pop(t, c0 + 0.05, 0.3);
  const kv = actor('kid', t, { i: 0, x: dk.x, y: dk.y, s: dk.s, lift: KEV_UP * up, armR: lerp(10, 138, up) + 6 * Math.sin(t * 9), armL: 10, turn: -0.15, face: { name: 'nervous', fx: ['sweat'] } }, { arms: false, energy: 1.3 });
  const hero = you(t, { ...SC.heroDesk, volume: false, turn: 0.5, face: { name: 'neutral' }, armL: 4, armR: 4 }, { arms: false });
  const ben = benji(t, { ...SC.benjiDesk, volume: false, turn: 0.55, face: { name: 'confused' } }, { arms: false });
  let o = classShot(t, cam, { lookX: dk.x }, { row2: kv, row1: hero + ben });
  const hk = headScr(cam, 'kid', dk.x, dk.y, dk.s, { i: 0, lift: KEV_UP * up });
  o += H.miniPlate({ x: hk.x, y: hk.y, s: 1.05, k: seg(t, c0 + 0.15, c0 + 0.5), t, name: 'KEVIN', level: 9, hp: 0.64 });
  return o + hud(t, CLOCK.class);
}

const KEV_UP = 70;                                // Kevin stands up to answer
// LIE meter progress: unfolds on "lies", the needle hunts until "ninety-nine", then LOCKS
const kLie = (t) => 0.55 * seg(t, tLies - 0.25, tLies + 0.35) + 0.3 * seg(t, tLies + 0.35, t99) + 0.15 * seg(t, t99 - 0.05, t99 + 0.3);
// ---- 9. "You could see lies now." — the LIE DETECTOR unfolds over him, the needle hunts
function shLie(t) {
  const c0 = CUT.lie, c1 = nextCut('lie');
  const dk = SC.dogKid;
  const cam = camKeys(t, [[c0, camAt(dk.x, 560, 1.5)], [c1, camAt(dk.x, 580, 1.72)]], ease.linear);
  const kv = actor('kid', t, { i: 0, x: dk.x, y: dk.y, s: dk.s, lift: KEV_UP, armR: lerp(138, 20, seg(t, c0, c0 + 0.6)), armL: 10, turn: 0.25 * Math.sin(t * 2.5), face: { name: 'nervous', fx: ['sweat'], eyes: { look: [Math.sin(t * 3), 0] } } }, { arms: false });
  const ben = benji(t, { ...SC.benjiDesk, volume: false, turn: 0.55, face: { name: 'confused' } }, { arms: false });
  let o = classShot(t, cam, { lookX: dk.x }, { row2: kv, row1: ben });
  const hk = headScr(cam, 'kid', dk.x, dk.y, dk.s, { i: 0, lift: KEV_UP });
  o += H.miniPlate({ x: hk.x, y: hk.y, s: 1.05, k: 1, fade: seg(t, tLies - 0.35, tLies - 0.05), t, name: 'KEVIN', level: 9, hp: 0.64 });
  o += H.lieMeter({ x: hk.x, y: hk.y, s: 1.05, t, k: kLie(t) });
  return o + hud(t, CLOCK.class);
}

// "MEANWHILE AT KEVIN'S HOUSE": the dog asleep next to the untouched homework (full-frame content for a PiP panel)
function kevinsHouse(t, tk) {
  let o = S.rect(-20, -20, 1960, 1120, 0, { fill: '#F3D9B8' }) + S.rect(-20, 640, 1960, 460, 0, { fill: '#B98A5E' }) + S.rect(-20, 630, 1960, 24, 0, { fill: '#8A5E3A' });
  o += S.rect(160, 140, 420, 300, 14, ol('#9FD3F2', 10)) + S.path('M370 140 V440 M160 290 H580', ln(10, '#FFFFFF'));
  o += S.rect(1260, 200, 300, 220, 10, ol('#E8B25A', 8)) + T('HOME', 1410, 330, 70, '#8A5E3A');
  o += S.ellipse(1000, 900, 520, 120, { fill: '#7FA86A', stroke: E.LINE, 'stroke-width': 8 });
  o += S.g(X.quizPaper({ x: 0, y: 0, s: 1, title: 'HOMEWORK', name: 'KEVIN', lines: 9 }), `translate(1300 880) scale(1.5 0.62) rotate(-6)`);
  o += X.biscuit({ x: 820, y: 960, s: 1.5, pose: 'sleep', t, coat: '#8A5A3A', coat2: '#F2E6D6' });
  o += H.tipFor('homework', { x: 1300, y: 840, t, k: tk, s: 3.1, side: 'up', dist: 120, dx: -120 });
  return o;
}
// ---- 10. "That one was ninety-nine percent." — punch-in: LOCK at 99 %, LIAR!; MEANWHILE... the homework is fine
function shLie99(t) {
  const c0 = CUT.lie99, c1 = nextCut('lie99');
  const dk = SC.dogKid;
  const lock = t99 + 0.2;
  const cam = shakeAll(camKeys(t, [[c0, camAt(dk.x, 575, 2.1)], [c1, camAt(dk.x - 30, 575, 2.25)]], ease.linear), t, [[lock, 0.35, 12]]);
  const sink = KEV_UP * (1 - 1.5 * ease.inOut(seg(t, lock + 0.5, lock + 1.4)));
  const kv = actor('kid', t, { i: 0, x: dk.x, y: dk.y, s: dk.s, lift: sink, armR: 16, armL: 10, turn: 0.1, face: { name: t > lock ? 'shocked' : 'nervous', fx: ['sweat2'] } }, { arms: false });
  let o = classShot(t, cam, { lookX: dk.x }, { row2: kv });
  const hk = headScr(cam, 'kid', dk.x, dk.y, dk.s, { i: 0, lift: KEV_UP });
  o += H.lieMeter({ x: hk.x, y: hk.y, s: 1.2, t, k: kLie(t) });
  const ep = t > lock ? 0.5 + 0.5 * Math.sin((t - lock) * 14) : 0;
  if (ep > 0) o += H.edgePulse(0, 0, 1920, 1080, ep * (1 - seg(t, lock + 0.9, lock + 1.4)));
  const pk = seg(t, tPct - 0.4, tPct - 0.05);
  if (pk > 0) o += panel(70, 330, 760, 428, kevinsHouse(t, seg(t, tPct - 0.2, tPct + 0.25)), { k: pk, fromX: -300, label: "MEANWHILE AT KEVIN'S HOUSE", labelCol: '#FFD21F', labelFg: '#2A1A00' });
  return o + hud(t, CLOCK.class) + smash(t, c0, 0.1, 0.45);
}

// ---- 11. "Pop quiz." — close on Mrs. Krump: the boss bar drops in, papers up, the glasses glint, BOSS ATTACK: POP QUIZ!
function shQuiz(t) {
  const c0 = CUT.quiz, c1 = nextCut('quiz');
  const tp = SC.teacherFront;
  const cam = shakeAll(camKeys(t, [[c0, camAt(tp.x + 130, 560, 1.5)], [tPopQ - 0.05, camAt(tp.x + 130, 545, 1.58)], [tPopQ + 0.12, camAt(tp.x + 140, 520, 1.78)], [c1, camAt(tp.x + 140, 515, 1.84)]]), t, [[tPopQ, 0.3, 10]]);
  const glare = seg(t, tPopQ - 0.12, tPopQ + 0.05);
  const tch = actor('teacher', t, { x: tp.x, y: tp.y, s: tp.s, t, pointer: true, papers: true, glare, pointerRot: 20, turn: 0.1, volume: false }, { energy: 0.5 });
  let o = classShot(t, cam, { face: 'scared', lookX: tp.x }, { after: tch });
  o += attackCallout(1400, 640, seg(t, tPopQ - 0.08, tPopQ + 0.4), t, 'BOSS ATTACK', 'POP QUIZ!', 1.1);
  const bar = H.bossBar({ k: seg(t, c0, c0 + 0.45), t, name: 'MRS. KRUMP', sub: 'LV 99 · FINAL BOSS', value: 100, hit: bump(t, tPopQ, tPopQ + 0.35), y: 100, w: 900 });
  return o + bar + hud(t, CLOCK.class);
}

// a quiz paper flying in (thrown) and landing flat on a desk at (x, y) at tl
function flyingPaper(t, x, y, tl, from, i) {
  const u = seg(t, tl - 0.42, tl);
  if (u <= 0) return '';
  if (u >= 1) return flatPaper(x, y, 0.36, i ? 4 : -3, { name: i ? 'BENJI' : 'YOU' });
  const e = ease.inOut(u);
  const px = lerp(from[0], x, e), py = lerp(from[1], y, e) - 160 * Math.sin(u * Math.PI);
  return S.g(X.quizPaper({ x: 0, y: 0, s: 1, name: i ? 'BENJI' : 'YOU' }), `translate(${f(px)} ${f(py)}) rotate(${f((1 - e) * 540 * (i ? -1 : 1))}) scale(${f(0.36)} ${f(0.36 * lerp(1, 0.42, e))})`);
}
// ---- 12. "Twenty questions." — the papers fly in and slap down on the hero's and Benji's desk
function shTwenty(t) {
  const c0 = CUT.twenty, c1 = nextCut('twenty');
  const tl0 = tQs - 0.02, tl1 = tQs + 0.14;
  const cam = shakeAll(camKeys(t, [[c0, camAt(1100, 760, 1.55)], [c1, camAt(1100, 770, 1.68)]]), t, [[tl0, 0.18, 6], [tl1, 0.16, 5]]);
  const land = seg(t, tl0, tl0 + 0.1);
  const hero = you(t, { ...SC.heroDesk, volume: false, turn: 0.05, face: land > 0 ? { name: 'shocked', fx: ['sweat'] } : { name: 'nervous' }, ...boing(t, tl0, 0.12), armL: 6, armR: 6 }, { arms: false });
  const ben = benji(t, { ...SC.benjiDesk, volume: false, turn: -0.2, face: t > tl1 ? { name: 'nervous', fx: ['sweat'] } : { name: 'nervous' }, ...boing(t, tl1, 0.12) }, { arms: false });
  const papers = flyingPaper(t, SC.quizPaper.x, SC.quizPaper.y + 4, tl0, [600, 300], 0) + flyingPaper(t, SC.benjiDesk.x, SC.quizPaper.y + 6, tl1, [560, 260], 1);
  let o = classShot(t, cam, { face: 'nervous', lookX: 900 }, { row1: hero + ben, after: papers });
  for (const [tl, x] of [[tl0, SC.quizPaper.x], [tl1, SC.benjiDesk.x]]) {
    const p = toScr(cam, x, SC.quizPaper.y);
    if (t > tl && t < tl + 0.35) o += H.impactTicks(p.x, p.y, 160, 60, seg(t, tl, tl + 0.35), '#FFFFFF', 8);
  }
  const p0 = toScr(cam, SC.quizPaper.x, SC.quizPaper.y);
  o += stamp(430, 300, seg(t, tl1 + 0.05, tl1 + 0.35), '20 QUESTIONS', '#FF9A2E', 1.1, -6, '#2A1200');
  return o + hud(t, CLOCK.class);
}

// ---- 13. "Difficulty... impossible." — over his paper: the DIFFICULTY roulette spins, lands on IMPOSSIBLE (skull, red)
const DIFFS = ['EASY', 'NORMAL', 'HARD', 'EXPERT', 'INSANE', 'NIGHTMARE'];
function shImp(t) {
  const c0 = CUT.imp, c1 = nextCut('imp');
  const cam = shakeAll(camKeys(t, [[c0, camAt(1010, 760, 2.05)], [c1, camAt(1000, 770, 2.3)]], ease.linear), t, [[tImp, 0.4, 14]]);
  const hit = t >= tImp;
  const hero = you(t, { ...SC.heroDesk, turn: 0.05, volume: false, face: hit ? { name: 'shocked', fx: ['sweat2'], eyes: { look: [0, 0.5], pupil: 0.55 } } : { name: 'scared', fx: ['sweat'], eyes: { look: [0, 0.6] } }, armL: 6, armR: 6, headY: hit ? 6 : 0 }, { arms: false, energy: 0.4 });
  const ben = benji(t, { ...SC.benjiDesk, volume: false, turn: -0.35, face: { name: 'nervous', eyes: { look: [-0.8, 0.4] } } }, { arms: false });
  let o = classShot(t, cam, { face: 'nervous' }, { row1: hero + ben, after: papersOnDesks() });
  const pp = toScr(cam, SC.quizPaper.x + 30, SC.quizPaper.y);
  const spin = Math.floor((t - c0) * (hit ? 0 : 11));
  const val = hit ? 'IMPOSSIBLE' : t < tDiff + 0.15 ? '...' : DIFFS[spin % DIFFS.length];
  const pp2 = toScr(cam, SC.quizPaper.x - 40, SC.quizPaper.y);
  o += H.tooltip({ x: pp2.x, y: pp2.y, t, k: seg(t, c0 + 0.02, c0 + 0.45), s: 1.15 + 0.3 * ease.outBack(seg(t, tImp, tImp + 0.25)), title: 'POP QUIZ', rarity: hit ? 'boss' : 'rare', lines: [{ label: 'DIFFICULTY: ', value: val, col: hit ? '#FF3355' : '#FFD23F' }, '20 QUESTIONS'], side: 'left', dist: 110, dy: -170 });
  if (hit && t < tImp + 0.5) o += S.rect(0, 0, 1920, 1080, 0, { fill: '#FF1E3C', opacity: f(0.28 * (1 - seg(t, tImp, tImp + 0.5))) });
  if (hit) o += H.edgePulse(0, 0, 1920, 1080, 0.6 * (0.6 + 0.4 * Math.sin(t * 12)));
  return o + hud(t, CLOCK.class);
}

// ---- 14. "Is that bad? That sounds bad." — Benji leans over and whispers; NERVOUS slaps onto his plate, HP 97 → 90
function shBad(t) {
  const c0 = CUT.bad, c1 = nextCut('bad');
  const cam = camKeys(t, [[c0, camAt(1105, 690, 1.78)], [c1, camAt(1115, 690, 1.92)]], ease.linear);
  const lean = seg(t, c0, c0 + 0.4);
  const bp = { ...SC.benjiDesk, volume: false, turn: -0.6, lean: -6 * lean, headRot: -6 * lean, freeArms: true, armL: 26, bendL: -128, armR: 8, face: { name: 'nervous', fx: t > tSounds ? ['sweat'] : [] } };
  const ben = benji(t, bp, { arms: false, energy: 0.5 });
  const hero = you(t, { ...SC.heroDesk, volume: false, turn: 0.35, face: { name: 'deadpan', fx: ['sweat'], eyes: { look: [0.8, 0] } }, armL: 6, armR: 6 }, { arms: false });
  let o = classShot(t, cam, { face: 'nervous' }, { row1: hero + ben, after: papersOnDesks() });
  const hb = headScr(cam, 'benji', bp.x, bp.y, bp.s);
  o += H.plateFor('benji', { x: hb.x - 10, y: hb.y + 6, s: 0.92, t, tags: ['CLUMSY', { text: 'NERVOUS', k: seg(t, tSounds - 0.05, tSounds + 0.3) }], bars: [{ label: 'HP', value: 90, from: 97, roll: seg(t, tBad2, tBad2 + 0.55) }] });
  o += dmgNum(hb.x + 200, hb.y - 40, t - tBad2 - 0.05, '-7', '#FF4D66', 0.8);
  return o + hud(t, CLOCK.class);
}

// Mrs. Krump at the hero's desk (shots 15-18)
function krumpAtDesk(t, p = {}, a = {}) {
  return actor('teacher', t, { x: KR.x, y: KR.y, s: KR.s, t, turn: 0.5, pointer: true, pointerRot: 18, ...p }, { energy: 0.5, ...a });
}
// ---- 15. "Is there something on my head?" — she looms over his desk, touching her beehive; he stares up at her plate
function shHead(t) {
  const c0 = CUT.head, c1 = nextCut('head');
  const cam = camKeys(t, [[c0, camAt(870, 600, 1.28)], [c1, camAt(880, 606, 1.38)]], ease.linear);
  const touch = seg(t, w(9, 'something') - 0.25, w(9, 'something') + 0.15);
  const tch = krumpAtDesk(t, { lean: -4, armL: lerp(14, 150, ease.inOut(touch)), bendL: lerp(0, 120, touch), face: { name: 'deadpan' }, glare: 0.25 });
  const hero = you(t, { ...SC.heroDesk, turn: -0.45, bodyY: 18 * seg(t, c0, c0 + 0.6), face: { name: 'scared', fx: ['sweat'], eyes: { look: [-0.75, -0.95] } }, armL: 6, armR: 6 }, { arms: false });
  const ben = benji(t, { ...SC.benjiDesk, turn: -0.5, face: { name: 'scared', eyes: { look: [-0.9, -0.5] } } }, { arms: false });
  let o = classShot(t, cam, { face: 'scared', lookX: 700 }, { row1: hero + ben, after: papersOnDesks() + tch });
  const ht = headScr(cam, 'teacher', KR.x, KR.y, KR.s);
  o += H.plateFor('teacher', { x: ht.x, y: ht.y, s: 0.95, t });
  return o + hud(t, CLOCK.class);
}
// ---- 16. "No, ma'am!" — close on him: head shaking, hands waving, sweat flying
function shNo(t) {
  const c0 = CUT.no, c1 = nextCut('no');
  const cam = shakeAll(camKeys(t, [[c0, camAt(985, 700, 2.15)], [c1, camAt(985, 700, 2.3)]], ease.linear), t, [[c0, 0.2, 6]]);
  const sh = Math.sin(t * 24);
  const hero = you(t, { ...SC.heroDesk, volume: false, turn: -0.15, headRot: 12 * sh, armL: 112 + 26 * Math.sin(t * 19), armR: 112 + 26 * Math.sin(t * 19 + Math.PI), face: { name: 'scared', fx: ['sweat2'] } }, { arms: false, energy: 0.3 });
  const ben = benji(t, { ...SC.benjiDesk, volume: false, turn: -0.5, face: { name: 'nervous' } }, { arms: false });
  const o = classShot(t, cam, { face: 'scared', lookX: 700 }, { row1: hero + ben, after: papersOnDesks() });
  return o + hud(t, CLOCK.class);
}
// ---- 17. "Just your... very nice... level." — eyes flick up to her plate, a sweaty thumbs-up, a pointing finger
function shLevel(t) {
  const c0 = CUT.level, c1 = nextCut('level');
  const cam = camKeys(t, [[c0, camAt(850, 606, 1.2)], [c1, camAt(860, 606, 1.3)]], ease.linear);
  const up = bump(t, tYour - 0.05, tYour + 0.75);
  const thumbs = seg(t, tNice - 0.25, tNice + 0.05) * (1 - seg(t, tLevel - 0.2, tLevel));
  const point = seg(t, tLevel - 0.15, tLevel + 0.1);
  const hero = you(t, { ...SC.heroDesk, turn: -0.45, face: { name: thumbs > 0.3 ? 'happy' : 'nervous', fx: ['sweat'], eyes: { look: [-0.7, up > 0.3 ? -1 : -0.2] } }, armR: lerp(6, 120, ease.outBack(thumbs)), bendR: lerp(0, 90, thumbs), armL: lerp(6, 150, ease.outBack(point)), bendL: lerp(0, 30, point) }, { arms: false });
  const tch = krumpAtDesk(t, { lean: -4, face: { name: 'deadpan' }, glare: 0.4 + 0.6 * seg(t, tNice, tLevel) });
  const ben = benji(t, { ...SC.benjiDesk, turn: -0.5, face: { name: 'scared', fx: ['sweat'] } }, { arms: false });
  let o = classShot(t, cam, { face: 'scared', lookX: 700 }, { row1: hero + ben, after: papersOnDesks() + tch });
  const ht = headScr(cam, 'teacher', KR.x, KR.y, KR.s);
  o += H.plateFor('teacher', { x: ht.x, y: ht.y, s: 0.95, t });
  if (up > 0.2) o += S.path(K.F.starPath(ht.x - 150, ht.y - 130, 22 * up, 9 * up, 4), { fill: '#FFFFFF', opacity: f(up) });
  return o + hud(t, CLOCK.class);
}
// ---- 18. "...level." + beat — smash on her face: glare, anger marks; PATIENCE rolls below zero, ENRAGED
function shGlare(t) {
  const c0 = CUT.glare, c1 = nextCut('glare');
  const cam = shakeAll(camKeys(t, [[c0, camAt(KR.x + 40, 650, 2.1)], [c1, camAt(KR.x + 40, 640, 2.4)]], ease.linear), t, [[tLevel + 0.05, 0.4, 12]]);
  const tch = krumpAtDesk(t, { volume: false, turn: 0.2, lean: -3, face: { name: 'angry', mouth: 'line', fx: ['anger'] }, glare: 1 });
  let o = classShot(t, cam, { face: 'scared' }, { after: tch });
  const u = seg(t, tLevel + 0.05, tLevel + 0.8);
  const v = Math.round(-10 * ease.out(u));
  o += H.statPlate({ name: 'MRS. KRUMP', level: 99, boss: true, title: 'FINAL BOSS', x: 1450, y: 470, s: 1.2, t, lift: 20, bars: [{ label: 'PATIENCE', value: 0, text: `${v}%`, blink: true, bump: bump(t, tLevel + 0.05, tLevel + 0.4) }], tags: [{ text: 'ENRAGED', col: '#FF3355', k: seg(t, tLevel + 0.45, tLevel + 0.8) }] });
  const ep = seg(t, tLevel, tLevel + 0.2);
  if (ep > 0) o += H.edgePulse(0, 0, 1920, 1080, ep * (0.6 + 0.4 * Math.sin(t * 10)));
  return o + hud(t, CLOCK.class) + smash(t, c0, 0.1, 0.5);
}

// ---------------------------------------------------------------- the gym
const lineKid = (t, j, p = {}) => { const sp = lineSpot(j), L_ = LINEUP[j]; return kid(L_.i, { x: sp.x, y: sp.y, s: sp.s, turn: 0.15, bodyY: 3 * Math.sin(t * 3 + j), face: L_.i === 1 ? 'nervous' : 'neutral', ...p }); };
function lineChips(t, cam, kOf, pickOf = () => 0, hlOf = () => 0, s = 0.9) {
  let o = '';
  LINEUP.forEach((L_, j) => {
    const sp = lineSpot(j);
    const k = kOf(j);
    if (k <= 0) return;
    const h = headScr(cam, 'kid', sp.x + (L_.dx || 0), sp.y, sp.s, { i: L_.i });
    o += strChip({ x: h.x, y: h.y, s: s * clamp(cam.zoom, 0.8, 1.6), k, t, str: L_.str, name: L_.name, picked: pickOf(j), hl: hlOf(j) });
  });
  return o;
}
const CAPT = SG.captain;
// ---- 19. "In dodgeball, you picked your team by strength." — whistle; the line-up against the mats; STR chips wave on
function shGym(t) {
  const c0 = CUT.gym, c1 = nextCut('gym');
  const cam = camKeys(t, [[c0, { x: 0, y: -60, zoom: 0.8 }], [tStrength + 0.1, camAt(1060, 610, 1.06)], [c1, camAt(1080, 610, 1.1)]], ease.inOut);
  const blow = bump(t, c0, c0 + 0.8);
  const coach = actor('coach', t, { x: SG.coach.x, y: SG.coach.y, s: SG.coach.s, turn: 0.4, face: { name: 'neutral', mouth: blow > 0.2 ? 'O' : 'line' }, armR: 40 + 100 * blow, armL: 10 });
  let chars = coach;
  for (let j = 0; j < 6; j++) chars += lineKid(t, j);
  chars += benji(t, { x: 1840, y: 990, s: 0.52, turn: -0.3, face: 'happy' }, { arms: false });
  chars += you(t, { x: CAPT.x, y: CAPT.y, s: CAPT.s, turn: -0.4, armL: 26, bendL: 70, armR: 26, bendR: 70, face: 'smug' }, { arms: false });
  let o = gymShot(t, cam, { crowd: 0.8 }, chars);
  if (blow > 0.2) { const c = toScr(cam, SG.coach.x + 40, SG.coach.y - 820 * SG.coach.s); o += S.path(`M${f(c.x + 20)} ${f(c.y)} l60 -20 M${f(c.x + 24)} ${f(c.y + 16)} l66 4 M${f(c.x + 20)} ${f(c.y + 32)} l56 26`, ln(6, '#FFFFFF', blow)); }
  o += lineChips(t, cam, (j) => seg(t, tStrength - 0.25 + j * 0.09, tStrength + 0.15 + j * 0.09), undefined, undefined, 0.85);
  return o + hud(t, CLOCK.gym);
}
const PLAYERS = LINEUP.map((p) => ({ name: p.name, str: p.str }));
// ---- 20. "Science. Pure science." — he taps SORT BY STRENGTH in the air; the list sorts; QUIET KID 85 lands on top
function shScience(t) {
  const c0 = CUT.science, c1 = nextCut('science');
  const cam = camKeys(t, [[c0, camAt(1520, 640, 1.5)], [c1, camAt(1530, 630, 1.62)]], ease.linear);
  const press = seg(t, tSci - 0.05, tSci + 0.3);
  const tap = bump(t, tSci - 0.2, tSci + 0.25);
  const goggles = seg(t, tPure - 0.2, tPure + 0.1);
  let chars = '';
  for (let j = 3; j < 6; j++) chars += lineKid(t, j);
  chars += you(t, { x: CAPT.x - 60, y: CAPT.y, s: CAPT.s, turn: -0.35, armL: lerp(lerp(10, 92, tap), 20, goggles), bendL: lerp(0, 150, goggles), armR: 12, face: { name: 'smug', eyes: goggles > 0.5 ? { type: 'closed' } : undefined } }, { arms: false });
  let o = gymShot(t, cam, { crowd: 0.8 }, chars);
  o += dim(0.32);
  o += H.sortByStrength({ k: seg(t, c0 - 0.05, c0 + 0.5), t, players: PLAYERS, press, sort: seg(t, tSci + 0.15, tPure + 0.4), pick: 0, highlight: t > tPure + 0.4 ? 'QUIET KID' : undefined, x: 560, y: 545, s: 1.02 });
  o += stamp(1240, 250, seg(t, tPure - 0.05, tPure + 0.3), 'PURE SCIENCE', '#3BE8FF', 1.45, -6, '#03101B');
  return o + hud(t, CLOCK.gym);
}
// ---- 21. "You. And you." — he points down the line: the quiet kid (✓, looks behind himself) and Priya (✓, hops out)
function shPick(t) {
  const c0 = CUT.pick, c1 = nextCut('pick');
  const cam = camKeys(t, [[c0, camAt(1130, 610, 1.12)], [c1, camAt(1090, 610, 1.18)]], ease.linear);
  const p1 = seg(t, tYou1 - 0.05, tYou1 + 0.25), p2 = seg(t, tYou2 - 0.05, tYou2 + 0.25);
  let chars = '';
  for (let j = 0; j < 6; j++) {
    if (j === QK) chars += lineKid(t, j, { turn: lerp(0.15, -0.85, bump(t, tYou1 + 0.15, tYou2 + 0.5)), face: { name: 'confused', fx: p1 > 0.5 ? ['question'] : [] } });
    else if (j === PR) { const hop = seg(t, tYou2 + 0.05, tYou2 + 0.5); chars += lineKid(t, j, { x: lineSpot(j).x + 80 * hop, y: lineSpot(j).y + 40 * hop, lift: 50 * bump(t, tYou2 + 0.05, tYou2 + 0.45), armL: 150 * hop, armR: 150 * hop, face: hop > 0 ? 'excited' : 'neutral' }); }
    else chars += lineKid(t, j, { face: j === KV ? (p1 > 0.5 ? 'confused' : 'neutral') : 'neutral' });
  }
  const aim = t < tYou2 - 0.1 ? 4 : -2;
  chars += benji(t, { x: 1880, y: 990, s: 0.52, turn: -0.4, face: 'happy' }, { arms: false });
  chars += you(t, { x: CAPT.x, y: CAPT.y, s: CAPT.s, view: 'side', armL: 86 + aim + 6 * bump(t, tYou1, tYou1 + 0.2) + 6 * bump(t, tYou2, tYou2 + 0.2), armR: -10, lean: -3, face: 'determined' }, { arms: false });
  let o = gymShot(t, cam, { crowd: 0.8 }, chars);
  o += lineChips(t, cam, () => 1, (j) => (j === QK ? p1 : j === PR ? p2 : 0), (j) => (j === QK ? 1 : 0), 0.85);
  return o + hud(t, CLOCK.gym);
}
// ---- 22. "And definitely you, eighty-five strength." — the quiet kid points at himself ("me?"); STR 85 glows gold
function shPick85(t) {
  const c0 = CUT.pick85, c1 = nextCut('pick85');
  const sp = lineSpot(QK);
  const cam = camKeys(t, [[c0, camAt(sp.x + 40, 590, 2.2)], [c1, camAt(sp.x + 40, 585, 2.4)]], ease.linear);
  const meK = seg(t, c0 + 0.05, c0 + 0.35);
  const smile = t > t85 + 0.3;
  let chars = lineKid(t, QK, { turn: 0, armR: lerp(4, 24, meK), bendR: lerp(0, -128, meK), face: smile ? { name: 'happy', fx: ['blush'] } : { name: 'confused', fx: ['question'] } });
  chars += lineKid(t, 3, { face: 'confused' });
  let o = gymShot(t, cam, { crowd: 0.8 }, chars);
  const h = headScr(cam, 'kid', sp.x, sp.y, sp.s, { i: 1 });
  const hl = seg(t, t85 - 0.05, t85 + 0.2);
  o += H.statPlate({ name: 'QUIET KID', level: 12, x: h.x, y: h.y, s: 1.1, t, k: seg(t, tDef - 0.25, tDef + 0.3), theme: hl > 0.5 ? 'gold' : 'cyan', bars: [{ label: 'STR', value: 85, bump: bump(t, t85, t85 + 0.5) }], tags: [{ text: 'PICKED', col: '#3DFF8F', k: seg(t, t85 + 0.25, t85 + 0.55) }] });
  o += zoomLines(h.x, h.y - 120, 0.6 * bump(t, t85 - 0.05, t85 + 0.6), t, '#FFE88A', 20, 330);
  return o + hud(t, CLOCK.gym);
}
// ---- 23. KID: "You picked the quiet kid FIRST?" — Kevin (STR 41) throws his arms out; smash-zoom on "FIRST"
function shFirst(t) {
  const c0 = CUT.first, c1 = nextCut('first');
  const sp = lineSpot(KV);
  const cam = shakeAll(camKeys(t, [[c0, camAt(sp.x + 110, 590, 1.62)], [tFirst - 0.04, camAt(sp.x + 90, 585, 1.7)], [tFirst + 0.1, camAt(sp.x + 40, 560, 2.05)], [c1, camAt(sp.x + 40, 556, 2.1)]]), t, [[tFirst, 0.3, 8]]);
  let chars = lineKid(t, PR, { x: lineSpot(PR).x + 80, y: lineSpot(PR).y + 40, face: 'smug', turn: -0.3 });
  chars += lineKid(t, QK, { face: { name: 'happy', fx: ['blush'] }, turn: -0.4 });
  const flail = seg(t, tFirst - 0.2, tFirst + 0.05);
  chars += actor('kid', t, { i: 0, x: sp.x, y: sp.y, s: sp.s, turn: 0.35, armL: lerp(30, 110, flail) + 6 * Math.sin(t * 14), armR: lerp(30, 110, flail) + 6 * Math.sin(t * 14 + 1), face: { name: flail > 0.5 ? 'shocked' : 'angry' }, ...boing(t, tFirst, 0.15) }, { arms: false, energy: 1.4 });
  let o = gymShot(t, cam, { crowd: 0.8 }, chars);
  const h = headScr(cam, 'kid', sp.x, sp.y, sp.s, { i: 0 });
  o += strChip({ x: h.x, y: h.y, s: 1.2, k: 1, t, str: 41, name: 'KEVIN' });
  return o + hud(t, CLOCK.gym) + smash(t, tFirst + 0.02, 0.1, 0.35);
}
// ---- 24. "Trust me. He has a secret." — close on the hero: hand on heart, then a sly lean; HIDDEN STAT
function shSecret(t) {
  const c0 = CUT.secret, c1 = nextCut('secret');
  const cam = camKeys(t, [[c0, camAt(CAPT.x + 20, 690, 2.1)], [c1, camAt(CAPT.x, 680, 2.3)]], ease.linear);
  const sly = seg(t, tSecret - 0.35, tSecret);
  const hero = you(t, { x: CAPT.x, y: CAPT.y, s: CAPT.s, volume: false, turn: lerp(-0.15, -0.35, sly), lean: -4 * sly, armR: lerp(22, 10, sly), bendR: lerp(-128, 0, sly), armL: lerp(8, 34, sly), bendL: lerp(0, -140, sly), face: sly > 0.5 ? { name: 'sneaky' } : { name: 'smug' } }, { arms: false, energy: 0.6 });
  let o = gymShot(t, cam, { crowd: 0.8 }, lineKid(t, 5) + hero);
  o += stamp(1400, 300, seg(t, tSecret, tSecret + 0.3), 'HIDDEN STAT: ???', '#8A5CFF', 0.95, -6, '#FFFFFF');
  if (sly > 0.5) o += K.sparkles([[1190, 420, 26], [1290, 380, 18]], t);
  return o + hud(t, CLOCK.gym);
}
// the quiet kid on the court (team B, facing left) — throw arm (the near one in side view = armL)
const QKC = SG.teamB[1];
const qkHand = (pose) => { const a = (pose.armL * Math.PI) / 180, s = pose.s; return [pose.x - Math.sin(a) * 250 * s * 0.86, pose.y - (515 - Math.cos(a) * 250) * s * 0.86 - (pose.lift || 0)]; };
// ---- 25. (beat) the wind-up — low dutch close-up: SECRET: CANNON ARM, STR overflows
function shWindup(t) {
  const c0 = CUT.windup, c1 = nextCut('windup');
  const cam = camKeys(t, [[c0, camAt(QKC.x - 30, 650, 2.35)], [c1, camAt(QKC.x - 30, 640, 2.6)]], ease.linear);
  const back = seg(t, c0 + 0.1, c0 + 0.6);
  const pose = { x: QKC.x, y: QKC.y, s: QKC.s, view: 'side', armL: lerp(-20, -150, ease.inOut(back)), armR: 30, lean: -6 * back, face: { name: 'determined' } };
  let chars = kid(1, pose);
  const hp = qkHand(pose);
  chars += X.ball({ x: hp[0], y: hp[1], s: QKC.s * 0.9, kind: 'dodge', spin: t * 200 });
  let o = roll(gymShot(t, cam, { crowd: 0.8, balls: false }, chars), -5);
  o += streaks(t, 120, 960, 12, 7, '#FFFFFF', 0.3 * back, 1400, 1);
  const h = headScr(cam, 'kid', QKC.x, QKC.y, QKC.s, { i: 1 });
  o += H.statPlate({ name: 'QUIET KID', level: 12, x: h.x + 330, y: h.y + 170, s: 1.3, t, theme: 'gold', bars: [{ label: 'STR', value: 185, max: 100, from: 85, roll: seg(t, c0 + 0.45, c0 + 0.95), text: t > c0 + 0.95 ? '185' : undefined }], tags: [{ text: 'SECRET: CANNON ARM', col: '#FFD21F', k: seg(t, c0 + 0.25, c0 + 0.6) }] });
  o += letterbox(seg(t, c0, c0 + 0.2));
  return o + hud(t, CLOCK.gym);
}
// ---- 26. (beat) three throws, three OUTs; a ball at Benji — he trips, it whizzes over him: DODGE!
const shiftA = (p) => ({ ...p, x: p.x + 230 });
const TEAM_A = [{ i: 19, at: shiftA(SG.teamA[2]) }, { i: 7, at: shiftA(SG.teamA[1]) }, { i: 0, at: shiftA(SG.teamA[0]) }, { i: 15, at: shiftA(SG.teamA[3]) }];
function shThrow(t) {
  const c0 = CUT.throw, c1 = nextCut('throw');
  const hits = tThrows.map((x) => x + FLY);
  const cam = shakeAll(camKeys(t, [[c0, { x: 90, y: 20, zoom: 1.04 }], [c1, { x: 40, y: 30, zoom: 1.12 }]], ease.linear), t, hits.map((h) => [h, 0.25, 12]));
  let chars = '', fx = '';
  // team A (left, facing right)
  TEAM_A.forEach((m, j) => {
    const p = m.at, ht = j < 3 ? hits[j] : Infinity;
    const u = seg(t, ht, ht + 0.45);
    const pose = { x: p.x - 140 * ease.out(u), y: p.y, s: p.s, view: 'side', flip: true, lift: 110 * Math.sin(Math.min(1, u * 1.1) * Math.PI) * (u < 1 ? 1 : 0), rot: -70 * ease.out(u), armL: u > 0 ? 160 : 40, armR: u > 0 ? 140 : 30, face: u > 0 ? { name: 'dizzy' } : { name: 'scared' } };
    chars += kid(m.i, pose);
  });
  // team B (right, facing left)
  const thr = tThrows.reduce((a, x) => (t >= x - 0.25 ? x : a), tThrows[0]);
  const sw = seg(t, thr - 0.25, thr), fol = seg(t, thr, thr + 0.2);
  const qPose = { x: QKC.x, y: QKC.y, s: QKC.s, view: 'side', armL: t < thr ? lerp(-60, -150, sw) : lerp(-150, 120, ease.out(fol)), armR: 20, lean: t < thr ? -5 : 6 * fol, face: { name: 'determined' } };
  chars += kid(1, qPose);
  const B = SG.teamB;
  chars += kid(10, { x: B[3].x, y: B[3].y, s: B[3].s, view: 'side', armL: 150, armR: 150, face: 'excited', lift: 20 * Math.abs(Math.sin(t * 7)) });
  chars += you(t, { x: B[2].x, y: B[2].y, s: B[2].s, view: 'side', armL: 40 + 100 * bump(t, hits[0], hits[0] + 0.6), armR: 20, face: 'excited' }, { arms: false });
  const dodge = t > tBenjiDodge + 0.15;
  chars += benji(t, dodge ? { x: B[0].x, y: B[0].y, s: B[0].s, fallen: true, freeArms: true, armL: 60, armR: 150, bendL: 30, face: { name: 'dizzy', mouth: 'grin' } } : { x: B[0].x, y: B[0].y, s: B[0].s, view: 'side', face: { name: 'shocked' }, armL: 60, armR: 40 }, { arms: false });
  // balls in flight
  tThrows.forEach((t0, j) => {
    const u = seg(t, t0, t0 + FLY);
    if (u <= 0 || u >= 1) return;
    const from = qkHand({ ...qPose, armL: 60 }), to = [TEAM_A[j].at.x + 30, TEAM_A[j].at.y - 280 * TEAM_A[j].at.s];
    fx += X.ball({ x: lerp(from[0], to[0], u), y: lerp(from[1], to[1], u) - 40 * Math.sin(u * Math.PI), s: 0.5, kind: 'dodge', spin: t * 900 });
    fx += S.path(`M${f(lerp(from[0], to[0], u))} ${f(lerp(from[1], to[1], u))} l${f(140)} ${f(-8)}`, ln(10, '#FFFFFF', 0.6));
  });
  // the ball at Benji: from Tyler, over his head as he falls
  {
    const t0 = tBenjiDodge - 0.05, u = seg(t, t0, t0 + 0.45);
    if (u > 0 && u < 1) fx += X.ball({ x: lerp(TEAM_A[3].at.x + 80, B[0].x + 600, u), y: lerp(TEAM_A[3].at.y - 230, B[0].y - 300, u) - 60 * Math.sin(u * Math.PI), s: 0.45, kind: 'dodge', spin: -t * 900 });
  }
  let o = gymShot(t, cam, { crowd: 0.8, cheer: 0.6, balls: 'scatter', scoreboard: ['HOME', String(tThrows.filter((x) => t > x + FLY).length), 'GUEST', '0'] }, chars + fx);
  TEAM_A.slice(0, 3).forEach((m, j) => {
    const ht = hits[j];
    if (t < ht) return;
    const h = headScr(cam, 'kid', m.at.x - 60, m.at.y, m.at.s, { i: m.i });
    o += dmgNum(h.x, h.y - 20, t - ht, j === 2 ? 'CRIT! -85' : '-85', '#FF4D66', 0.9);
    o += stamp(h.x, h.y + 120, seg(t, ht + 0.1, ht + 0.35), 'OUT!', '#FF3355', 0.9);
    o += K.C.burst(h.x, h.y + 150, seg(t, ht, ht + 0.35), '#FFFFFF');
  });
  if (t > tBenjiDodge + 0.15) { const hb = headScr(cam, 'benji', B[0].x, B[0].y, B[0].s, { bodyY: 250 }); o += stamp(hb.x - 40, hb.y - 60, seg(t, tBenjiDodge + 0.2, tBenjiDodge + 0.45), 'DODGE!', '#3DFF8F', 0.85, 6, '#03101B'); }
  return o + hud(t, CLOCK.gym);
}
// ---- 27. "You won." — the scoreboard: VICTORY! slams on, confetti
function shVictory(t) {
  const c0 = CUT.victory, c1 = nextCut('victory');
  const vk = t >= tWon - 0.05;
  const cam = shakeAll(camKeys(t, [[c0, camAt(960, 250, 1.85)], [tWon - 0.05, camAt(960, 240, 1.9)], [tWon + 0.1, camAt(960, 235, 2.15)], [c1, camAt(960, 235, 2.2)]]), t, [[tWon, 0.3, 10]]);
  let o = gymShot(t, cam, { crowd: 0.8, cheer: 1, balls: 'scatter', scoreboard: vk ? 'VICTORY!' : ['HOME', '3', 'GUEST', '0'] });
  if (vk) o += H.rays(960, 450, 14, 1300, '#FFE88A', 0.16 * seg(t, tWon, tWon + 0.3), t * 25);
  o += S.g(K.confetti(t, tWon - 0.02, 60, 4), 'translate(0 380)');
  return o + hud(t, CLOCK.gym) + smash(t, tWon - 0.02, 0.14, 0.7);
}
// ---- 28. "Every single game." — the team celebrates on the court; a WIN stamp per word, the count climbs
function shEvery(t) {
  const c0 = CUT.every, c1 = nextCut('every');
  const cam = camKeys(t, [[c0, { x: 60, y: -20, zoom: 0.92 }], [c1, { x: 80, y: -10, zoom: 0.98 }]], ease.linear);
  const n = tWins.filter((x) => t >= x - 0.05).length;
  const B = SG.teamB;
  const jump = (ph) => 60 * Math.abs(Math.sin(t * 6.5 + ph));
  let chars = actor('coach', t, { x: SG.coach.x + 60, y: SG.coach.y, s: SG.coach.s, turn: 0.4, face: { name: 'shocked' }, armL: 20, armR: 20 });
  TEAM_A.forEach((m, j) => { chars += kid(m.i, { x: m.at.x - 100, y: m.at.y + 30, s: m.at.s, rot: j % 2 ? -88 : 0, face: 'dizzy', armL: 20, armR: 20, ...(j % 2 ? {} : { kneeL: 80, kneeR: 80, legL: 70, legR: 70, bodyY: 180 }) }); });
  chars += kid(10, { x: B[3].x, y: B[3].y, s: B[3].s, armL: 160, armR: 160, face: 'excited', lift: jump(1) });
  chars += you(t, { x: B[2].x - 120, y: B[2].y, s: B[2].s, armL: 165, armR: 165, face: 'joy', lift: jump(0.5) }, { arms: false });
  chars += kid(1, { x: B[1].x, y: B[1].y, s: B[1].s, armL: 150, armR: 150, face: { name: 'happy', fx: ['blush'] }, lift: jump(0) });
  chars += benji(t, { x: B[0].x, y: B[0].y, s: B[0].s, armL: 150, armR: 150, face: 'joy', lift: jump(2) }, { arms: false });
  let o = gymShot(t, cam, { crowd: 0.8, cheer: 1, balls: 'scatter', scoreboard: ['HOME', String([3, 5, 9, 12][n]), 'GUEST', '0'] }, chars);
  tWins.forEach((tw, j) => { o += stamp(520 + j * 440, 480, seg(t, tw - 0.05, tw + 0.25), `WIN ×${[5, 9, 12][j]}`, '#FFD21F', 1.5, -8 + j * 5, '#2A1A00'); });
  o += K.confetti(t, c0 - 0.6, 40, 11);
  return o + hud(t, CLOCK.gym);
}
// ---- 29. (beat) the coach, speechless
function shCoach(t) {
  const c0 = CUT.coach, c1 = nextCut('coach');
  const cx = SG.coach.x + 60;
  const cam = camKeys(t, [[c0, camAt(cx + 120, 560, 1.9)], [c1, camAt(cx + 120, 560, 2.1)]], ease.linear);
  const drop = seg(t, c0 + 0.15, c0 + 0.4);
  const ch = actor('coach', t, { x: cx, y: SG.coach.y, s: SG.coach.s, volume: false, turn: 0.2, headY: 6 * drop, face: { name: 'shocked', mouth: 'O' }, armL: 14, armR: 14 });
  let o = gymShot(t, cam, { crowd: 0.3, cheer: 0 }, ch);
  const h = headScr(cam, 'coach', cx, SG.coach.y, SG.coach.s);
  o += H.statPlate({ name: 'COACH', level: 41, x: h.x + 330, y: h.y + 40, s: 1.05, t, k: seg(t, c0 - 0.05, c0 + 0.4), bars: [{ label: 'HP', value: 70 }], tags: [{ text: 'SPEECHLESS', k: seg(t, c0 + 0.45, c0 + 0.75) }] });
  return o + hud(t, CLOCK.gym) + whip(t, c1, 1, 0.12);
}

// ---------------------------------------------------------------- the cafeteria
// ---- 30. "Even lunch had stats." — over the hero's shoulder at the counter: tooltips pop over the pans
function shLunch(t) {
  const c0 = CUT.lunch, c1 = nextCut('lunch');
  const cam = camKeys(t, [[c0, camAt(1650, 610, 1.42)], [c1, camAt(1700, 600, 1.5)]], ease.linear);
  const lady = lunchLady(t, { armR: 30 + 10 * Math.sin(t * 3) });
  let o = cafShot(t, cam, {}, { lady });
  const F = SF.food;
  const tip = (key, p, k, dx = 0, dist = 64) => { const q = toScr(cam, p.x, p.y - 20); return H.tipFor(key, { x: q.x, y: q.y, t, k, s: 1.0, side: 'up', dist, dx }); };
  o += tip('pizza', F.pizza, seg(t, tEven - 0.2, tEven + 0.25), -60, 70);
  o += tip('broccoli', F.broccoli, seg(t, tLunchW - 0.15, tLunchW + 0.3), 0, 230);
  o += H.tooltip({ ...(() => { const q = toScr(cam, F.potato.x, F.potato.y - 20); return { x: q.x, y: q.y }; })(), t, k: seg(t, tStats - 0.2, tStats + 0.25), s: 1.0, title: 'MASHED POTATO', rarity: 'common', lines: ['COMFORT +30'], side: 'up', dist: 70, dx: 30 });
  const hl = headScr(cam, 'lunchLady', SF.lunchLady.x, SF.lunchLady.y, SF.lunchLady.s);
  o += H.plateFor('lunchLady', { x: hl.x, y: hl.y, s: 0.8, t, k: seg(t, c0 + 0.1, c0 + 0.6) });
  return o + hud(t, CLOCK.caf) + smash(t, c0, 0.1, 0.5);
}
// a lump of mystery meat (world space) — wobble 0..1, eye 0..1 (it opens one eye)
function meatBlob(x, y, s, t, wob = 0, eye = 0, look = 0) {
  const sq = 1 + 0.08 * Math.sin(t * 17) * wob;
  let g = S.path('M-60 10 Q-64 -30 -20 -34 Q0 -50 30 -34 Q66 -30 60 10 Q40 30 0 26 Q-40 30 -60 10 Z', ol('#8A7A5A', 5)) + S.circle(-24, -10, 7, { fill: '#6A9A3A' }) + S.circle(30, -16, 5, { fill: '#B85A8A' });
  if (eye > 0) g += S.ellipse(6, -10, 16, 16 * eye, ol('#FFFFFF', 3.5)) + S.circle(6 + 6 * look, -10, 7 * eye, { fill: '#151515' });
  else g += S.path('M-10 4 q10 -10 20 0', ln(4, '#5A4A3A'));
  return S.g(g, `translate(${f(x)} ${f(y)}) scale(${f(s / sq)} ${f(s * sq)})`);
}
// ---- 31. "The mystery meat just said 'question mark.'" — the pan bubbles; the tooltip reads "???", question marks rise
function shMeat(t) {
  const c0 = CUT.meat, c1 = nextCut('meat');
  const F = SF.food.meat;
  const cam = shakeAll(camKeys(t, [[c0, camAt(F.x, 610, 2.4)], [tQuestion - 0.05, camAt(F.x, 605, 2.55)], [tQuestion + 0.1, camAt(F.x, 600, 2.9)], [c1, camAt(F.x, 600, 3.0)]]), t, [[tQuestion, 0.25, 8]]);
  const dip = bump(t, tSaid - 0.25, tSaid + 0.45);
  let o = cafShot(t, cam, {}, { lady: lunchLady(t, { armR: 30 + 30 * dip, headRot: -6 * dip }) });
  const q = toScr(cam, F.x, F.y - 30);
  o += H.tipFor('mysteryMeat', { x: q.x + 60, y: q.y, t, k: seg(t, tMystery - 0.2, tMystery + 0.3), s: 1.3, side: 'right', dist: 180, dy: -120 });
  [tQuestion, tQuestion + 0.22, tMark].forEach((t0, j) => {
    const a = t - t0;
    if (a < 0 || a > 1.6) return;
    const u = a / 1.6;
    o += S.g(TS('?', 0, 0, 120, '#B9AA8A'), `translate(${f(q.x + 230 + j * 150 + 30 * Math.sin(a * 5 + j))} ${f(q.y + 60 - 300 * ease.out(u))}) rotate(${f(-15 + j * 15)}) scale(${f(0.5 + 0.7 * ease.outBack(seg(a, 0, 0.25)))})`, { opacity: f(1 - seg(u, 0.6, 1)) });
  });
  return o + hud(t, CLOCK.caf);
}
// a spoon in a hand at (x, y) (world), with a lump of the meat
const spoon = (x, y, s, rot, t) => S.g(S.path('M0 0 L0 -170', ln(12, '#C9D0DC')) + S.path('M0 0 L0 -170', ln(5, '#EEF2F8')) + S.ellipse(0, -200, 34, 44, ol('#D9DEE8', 5)) + meatBlob(0, -214, 0.5, t), `translate(${f(x)} ${f(y)}) rotate(${f(rot)}) scale(${f(s)})`);
function benjiSpoon(t, raise, extra = {}) {
  const bp = { ...BENJI_SEAT, turn: 0.35, armR: lerp(10, 60, raise), bendR: lerp(0, 160, raise), armL: 6, ...extra };
  const hp = CAST.handPos('benji', bp, 1);
  const hx = Array.isArray(hp) ? hp[0] : hp.x, hy = Array.isArray(hp) ? hp[1] : hp.y;
  const rot = lerp(10, -42, raise), ss = bp.s * 1.1, ra = (rot * Math.PI) / 180;
  return { pose: bp, spoon: spoon(hx, hy + 6, ss, rot, t), hand: { x: hx, y: hy }, bowl: { x: hx + Math.sin(ra) * 210 * ss, y: hy + 6 - Math.cos(ra) * 210 * ss } };
}
// ---- 32. BENJI: "Should we eat it?" — at the table, a trembling spoonful halfway to his mouth
function shEat(t) {
  const c0 = CUT.eat, c1 = nextCut('eat');
  const cam = camKeys(t, [[c0, camAt(650, 740, 1.9)], [c1, camAt(645, 735, 2.0)]], ease.linear);
  const raise = seg(t, c0, c0 + 0.5);
  const bs = benjiSpoon(t, raise);
  const ben = benji(t, { ...bs.pose, volume: false, face: { name: 'nervous', eyes: { look: [0.6, -0.3] } } }, { arms: false, energy: 0.5 });
  const hero = you(t, { ...HERO_SEAT, volume: false, turn: -0.4, face: { name: 'deadpan', eyes: { look: [-0.8, 0] } }, armL: 6, armR: 6 }, { arms: false });
  let o = cafShot(t, cam, {}, { front: ben + hero });
  o += view(cam, bs.spoon);
  const q = toScr(cam, bs.bowl.x, bs.bowl.y);
  o += H.tipFor('mysteryMeat', { x: q.x, y: q.y, t, k: seg(t, c0 + 0.3, c0 + 0.7), s: 0.85, side: 'left', dist: 330, dy: 90 });
  return o + hud(t, CLOCK.caf) + smash(t, c0, 0.08, 0.3);
}
// ---- 33. YOU: "Benji. It says..." — he catches Benji's wrist and lowers the spoon
function shQmark(t) {
  const c0 = CUT.qmark, c1 = nextCut('qmark');
  const cam = camKeys(t, [[c0, camAt(650, 720, 1.95)], [c1, camAt(660, 715, 2.05)]], ease.linear);
  const lower = seg(t, w(18, 'It') - 0.1, w(18, 'says'));
  const bs = benjiSpoon(t, 1 - 0.6 * lower);
  const ben = benji(t, { ...bs.pose, volume: false, face: { name: 'confused', eyes: { look: [0.8, 0] } } }, { arms: false, energy: 0.3 });
  const grab = seg(t, c0 + 0.05, c0 + 0.35);
  const hero = you(t, { ...HERO_SEAT, volume: false, turn: -0.5, armL: lerp(6, 70, grab), bendL: lerp(0, -30, grab), face: { name: 'determined' } }, { arms: false });
  let o = cafShot(t, cam, {}, { front: ben + hero });
  o += view(cam, bs.spoon);
  return o + hud(t, CLOCK.caf);
}
// ---- 34. "...QUESTION MARK." — smash into his tray: the meat's ??? tooltip flashes; the meat opens one eye
function shQzoom(t) {
  const c0 = CUT.qzoom, c1 = nextCut('qzoom');
  const M = SF.tray.meat;
  const cam = shakeAll(camKeys(t, [[c0, camAt(M.x - 40, M.y - 10, 3.0)], [c1, camAt(M.x - 40, M.y - 16, 3.3)]], ease.linear), t, [[tQM, 0.25, 10], [tMARK, 0.25, 10]]);
  const eye = seg(t, tMARK + 0.25, tMARK + 0.4) * (1 - bump(t, tMARK + 0.9, tMARK + 1.05));
  let o = cafShot(t, cam, {}, { front: you(t, { ...HERO_SEAT, volume: false, turn: -0.2, face: { name: 'determined' } }, { arms: false }) });
  o += view(cam, meatBlob(M.x, M.y + 4, 0.62, t, 1, eye, Math.sin(t * 2)));
  const q = toScr(cam, M.x, M.y - 30);
  const fl = Math.floor(t * 8) % 2 === 0;
  o += H.tipFor('mysteryMeat', { x: q.x - 30, y: q.y, t, k: seg(t, c0 + 0.02, c0 + 0.3), s: 1.6, side: 'left', dist: 170, dy: -170, theme: t > tMARK && fl ? 'boss' : undefined });
  o += zoomLines(q.x, q.y, 0.8 * bump(t, tQM - 0.05, tMARK + 0.6), t, '#FFFFFF', 22, 420);
  return o + hud(t, CLOCK.caf) + smash(t, c0, 0.12, 0.55);
}
// ---- 35. "And above some people... there were little yellow marks." — the room: "!" markers drop onto people one by one
const markK = (t) => (q) => seg(t, q.at(), q.at() + 0.5);
function shMarks(t) {
  const c0 = CUT.marks, c1 = nextCut('marks');
  const cam = camKeys(t, [[c0, camAt(760, 600, 1.05)], [tPeople, camAt(900, 560, 0.9)], [c1, camAt(1080, 540, 0.82)]], ease.inOut);
  const qp = questPeople(t);
  const lookAround = Math.sin((t - c0) * 2.2);
  const hero = you(t, { ...HERO_SEAT, turn: 0.5 * lookAround, face: { name: 'amazed', eyes: { look: [lookAround, -0.4] } } }, { arms: false });
  const ben = benji(t, { ...BENJI_SEAT, turn: 0.3, face: 'happy', armR: 20 + 15 * Math.sin(t * 6), armL: 8 }, { arms: false });
  let o = cafShot(t, cam, {}, { back: qp.back, front: ben + hero, lady: lunchLady(t), lane: qp.lane });
  o += questMarkers(t, cam, markK(t), 1);
  return o + hud(t, CLOCK.caf, '', { dots: markerDots(t, markK(t)) });
}
// ---- 36. "Like in a game." — split: IN GAMES (a pixel villager with "!") = REAL LIFE (the lunch lady with "!")
function shGame(t) {
  const c0 = CUT.game, c1 = nextCut('game');
  let o = S.rect(-20, -20, 1960, 1120, 0, { fill: '#141A2E' });
  let stripes = '';
  for (let i = -4; i < 30; i++) stripes += `M${i * 90 + ((t * 60) % 90)} -20 l-300 1120 h40 l300 -1120 Z`;
  o += S.path(stripes, { fill: '#1D2540' });
  const kl = seg(t, c0, c0 + 0.35), kr = seg(t, c0 + 0.12, c0 + 0.47);
  o += panel(60, 190, 840, 640, E.retroGame(t, seg(t, c0 + 0.2, c0 + 0.6)), { k: kl, fromX: -400, label: 'IN GAMES', labelCol: '#3BE8FF', labelFg: '#03101B' });
  const cam = camAt(1735, 520, 2.1);
  const right = cafShot(t, cam, {}, { lady: lunchLady(t, { face: { name: 'happy' } }) }) + (() => { const h = headScr(cam, 'lunchLady', SF.lunchLady.x, SF.lunchLady.y, SF.lunchLady.s); return H.questMarker({ x: h.x, y: h.y, s: 2.0, t, k: seg(t, c0 + 0.3, c0 + 0.7) }); })();
  o += panel(1020, 190, 840, 640, right, { k: kr, fromX: 400, label: 'REAL LIFE', labelCol: '#FFD21F', labelFg: '#2A1A00' });
  const ek = ease.outBack(seg(t, c0 + 0.35, c0 + 0.6));
  if (ek > 0) o += S.g(S.rect(-46, -34, 92, 22, 8, ol('#FFD21F', 5)) + S.rect(-46, 12, 92, 22, 8, ol('#FFD21F', 5)), `translate(960 490) scale(${f(ek)})`);
  return o + hud(t, CLOCK.caf, '', { dots: markerDots(t, () => 1) });
}
// ---- 37. "Quests?" — close on him: the eyes go wide, stars; a "!" glows behind him
function shQuests(t) {
  const c0 = CUT.quests, c1 = nextCut('quests');
  const cam = camKeys(t, [[c0, camAt(780, 700, 2.15)], [c1, camAt(775, 700, 2.3)]], ease.linear);
  const star = t > tQuests1 + 0.15;
  const hero = you(t, { ...HERO_SEAT, volume: false, turn: 0.1, face: { name: 'amazed', eyes: star ? { type: 'star' } : undefined, fx: star ? ['sparkles'] : [] }, ...boing(t, tQuests1 + 0.1, 0.15) }, { arms: false, energy: 0.5 });
  const qp = questPeople(t);
  let o = cafShot(t, cam, {}, { back: qp.back, front: hero, lady: lunchLady(t), lane: qp.lane });
  o += questMarkers(t, cam, () => 1, 0.9);
  return o + hud(t, CLOCK.caf, '', { dots: markerDots(t, () => 1) }) + smash(t, c0, 0.08, 0.3);
}
// ---- 38. "Real life has QUESTS?" (+ beat) — he springs up, arms wide; markers glow all over the room (→ SC 05: Tank)
function shReal(t) {
  const c0 = CUT.real, c1 = END;
  const cam = camKeys(t, [[c0, camAt(760, 640, 1.32)], [c1, camAt(770, 650, 1.55)]], ease.linear);
  const up = seg(t, tQuests2 - 0.3, tQuests2 + 0.05);
  const after = seg(t, A[20].b + 0.15, A[20].b + 0.6);
  const look = t > A[20].b + 0.2 ? Math.sin((t - A[20].b - 0.2) * 3.2) * (1 - seg(t, END - 0.9, END - 0.5)) + 0.6 * seg(t, END - 0.9, END - 0.5) : 0;
  const armUp = ease.outBack(up) * (1 - 0.45 * after);
  const hero = you(t, { ...HERO_SEAT, lift: 40 * ease.outBack(up) * (1 - 0.5 * after), armL: lerp(10, 150, armUp), armR: lerp(10, 150, armUp), turn: 0.45 * look, face: { name: up > 0.5 ? 'excited' : 'amazed', eyes: up > 0.5 ? { type: 'star' } : undefined, fx: up > 0.5 ? ['sparkles'] : [] }, ...boing(t, tQuests2, 0.2) }, { arms: false, energy: 0.6 });
  const ben = benji(t, { ...BENJI_SEAT, turn: 0.5, face: { name: 'confused', fx: up > 0.5 ? ['question'] : [] } }, { arms: false });
  const qp = questPeople(t);
  // two more kids at the front table; their markers pop in the beat after the line
  const extra = [{ i: 5, x: 330, at: A[20].b + 0.3 }];
  let front = '';
  extra.forEach((e) => { front += kid(e.i, { x: e.x, y: HERO_SEAT.y, s: 0.5, turn: 0.2, bodyY: 3 * Math.sin(t * 3 + e.i), face: e.i === 5 ? 'sad' : 'neutral' }); });
  let o = cafShot(t, cam, {}, { back: qp.back, front: front + ben + hero, lady: lunchLady(t), lane: qp.lane });
  o += questMarkers(t, cam, () => 1, 1);
  extra.forEach((e, j) => {
    const h = headScr(cam, 'kid', e.x, HERO_SEAT.y, 0.5, { i: e.i });
    o += H.questMarker({ x: h.x, y: h.y, s: 1.0, t, k: seg(t, e.at, e.at + 0.5), seed: 9 + j });
  });
  const dots = markerDots(t, () => 1);
  extra.forEach((e, j) => { if (t > e.at + 0.2) dots.push([[-0.75, 0.45][j], [0.5, 0.7][j], '#FFD21F']); });
  return o + hud(t, CLOCK.caf, '', { dots });
}

// ================================================================= dispatch
const SHOTS = [
  [CUT.ext, shExt], [CUT.benjiIn, shBenjiIn], [CUT.skill, shSkill], [CUT.hey, shHey], [CUT.trip, shTrip], [CUT.okay, shOkay],
  [CUT.krump, shKrump], [CUT.dog, shDog], [CUT.lie, shLie], [CUT.lie99, shLie99], [CUT.quiz, shQuiz], [CUT.twenty, shTwenty], [CUT.imp, shImp],
  [CUT.bad, shBad], [CUT.head, shHead], [CUT.no, shNo], [CUT.level, shLevel], [CUT.glare, shGlare],
  [CUT.gym, shGym], [CUT.science, shScience], [CUT.pick, shPick], [CUT.pick85, shPick85], [CUT.first, shFirst], [CUT.secret, shSecret],
  [CUT.windup, shWindup], [CUT.throw, shThrow], [CUT.victory, shVictory], [CUT.every, shEvery], [CUT.coach, shCoach],
  [CUT.lunch, shLunch], [CUT.meat, shMeat], [CUT.eat, shEat], [CUT.qmark, shQmark], [CUT.qzoom, shQzoom], [CUT.marks, shMarks],
  [CUT.game, shGame], [CUT.quests, shQuests], [CUT.real, shReal],
].sort((a, b) => a[0] - b[0]);
function shotAt(t) {
  let i = SHOTS.length - 1;
  while (i > 0 && t < SHOTS[i][0]) i--;
  return i;
}
function scene(t) {
  return SHOTS[shotAt(t)][1](t);
}
function look(t) {
  if (t >= CUT.glare && t < CUT.gym) return { grade: 'warm', vignette: 0.7 };
  if (t >= CUT.windup && t < CUT.throw) return { grade: 'warm', vignette: 0.75 };
  if (t >= CUT.game && t < CUT.quests) return { grade: null, vignette: 0.3 };
  return { grade: 'warm', vignette: 0.4 };
}
const BEATS = {
  T0, END, tFour, tLv, tFallDown, tDown, tHey, tBuddy, tIm, tOkay, tLies, t99, tPct, tPopQ, tQs, tDiff, tImp, tBad2, tSounds, tYour, tNice, tLevel,
  tStrength, tSci, tPure, tYou1, tYou2, tDef, t85, tFirst, tTrust, tSecret, tThrows, FLY, tBenjiDodge, tWon, tWins, tEven, tLunchW, tStats, tMystery,
  tSaid, tQuestion, tMark, tQM, tMARK, tPeople, tLittle, tYellow, tMarks, tQuests1, tQuests2,
  tBonk: tOkay - 0.32, tLock: t99 + 0.2, quests: QUESTERS.map((q) => ({ at: q.at(), x: q.x, note: q.note })),
  benjiPh: BENJI_PH,
};
module.exports = { scene, look, SHOTS, CUT, BEATS };
