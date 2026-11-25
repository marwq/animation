// SC 06 · LEVELLING UP (386.32 … 458.04). The cafeteria: "+50 XP" flies into the bar → it fills → LEVEL UP! (he jumps up on the
// bench) → "I'm leveling UP? For being NICE?!" → he turns and sees yellow "!" quest markers over half the room → QUEST SPREE! title
// over the whole street → the montage synced to the words: carrying Mrs. Wells' groceries, the lunch-lady compliment, the ball out
// of the oak; "Nice hat, Mrs. Wells!" (STYLE +80), "Great soup, lunch lady!" (MYSTERY SOUP · ???), "Cool dog, random man!" (DOG ·
// COOL ∞) — every deed an xpPop into the bar; a 2×2 split-screen of more good deeds; the time-lapse "Level two. Level five. Level
// twenty." (MON → WED → FRI, LEVEL UP bursts); every day lunch with Tank: HP 40 → 60 → 80 while his TIRED / LONELY tags peel off
// (NEW FRIEND), "Your mom makes good sandwiches."; Grandpa's glasses quest (+1 XP — a magnified bar barely moves); Max's EPIC QUEST,
// the pillow fort to the ceiling, +100 XP → LEVEL 21; then the turn: cold wash, faces swallowed by XP chips, "helping points";
// Mrs. Wells' apples on the sidewalk, a grey "+2 XP" — "Two XP? Not worth it." He walks past.
'use strict';

const K = require('./kit');
const H = require('./hud');
const X = require('../rig/extras');
const CAST = require('../rig/cast');
const AC = require('./acting');
const ST = require('./sets_town');
const SH = require('./sets_home');
const E = require('./s05_env');
const S5 = require('./s05');
const { S, f, clamp, lerp, ease, seg, bump, hash, ol, ln, actor, camKeys } = K;
const { L } = K.V;
const { tf, TFS, pop, fade, shakeAll, boing, camAt, toScr, whip, smash, flashCol, zoomLines, streaks, letterbox, coldWash, dim, softEdge, caf, street, living, headAt, hudS, LV, STR } = E;
const { cafWorld, towerTop, HERO_X, HERO_Y, BENJI_X, TANK_Y } = S5.ENV;

const A = Array.from({ length: 16 }, (_, i) => L('06.' + i));
const T0 = K.V.scene('SC 06').start, END = K.V.scene('SC 07').start;     // == main.js RANGES for SC 06
const w = (i, word, n = 0) => A[i].word(word, n).t0;
const w1 = (i, word, n = 0) => A[i].word(word, n).t1;

// ================================================================= the cut list
const CUT = {};
CUT.plus = T0;
CUT.lvlup = w(0, 'Level') - 0.2;
CUT.nice = A[1].a - 0.08;
CUT.marks = A[1].b + 0.05;
CUT.spree = A[2].a + 0.5;
CUT.groc = A[3].a - 0.1;
CUT.lady = w(3, 'You', 1) - 0.15;
CUT.ball = w(3, 'You', 2) - 0.15;
CUT.hat = A[4].a - 0.12;
CUT.soup = w(4, 'Great') - 0.15;
CUT.dog = w(4, 'Cool') - 0.15;
CUT.grid = A[4].b + 0.1;
CUT.two = w(5, 'Level') - 0.2;
CUT.five = w(5, 'Level', 1) - 0.15;
CUT.twenty = w(5, 'Level', 2) - 0.15;
CUT.days = A[6].a - 0.1;
CUT.forty = w(6, 'Forty') - 0.25;
CUT.sixty = w(6, 'Sixty') - 0.2;
CUT.eighty = w(6, 'Eighty') - 0.2;
CUT.good = A[7].a - 0.1;
CUT.glasses = A[8].a - 0.15;
CUT.gramps = A[9].a - 0.08;
CUT.head = w(9, "They're") - 0.15;
CUT.qc = A[10].a - 0.06;
CUT.tinyxp = w(10, 'Plus') - 0.15;
CUT.easiest = A[11].a - 0.1;
CUT.max = A[12].a - 0.12;
CUT.ever = w(12, 'The') - 0.1;
CUT.build = A[13].a - 0.25;
CUT.reveal = w(13, 'complete') - 0.25;
CUT.hundred = w(13, 'Plus') - 0.2;
CUT.stare = A[13].b + 0.6;
CUT.slowly = A[14].a - 0.1;
CUT.people = w(14, 'you') - 0.1;
CUT.points = w(14, 'You', 1) - 0.15;
CUT.twoxp = A[15].a - 0.1;
CUT.walk = w(15, 'Not') - 0.1;
{
  const ks = Object.keys(CUT);
  for (let i = 1; i < ks.length; i++) if (CUT[ks[i]] < CUT[ks[i - 1]] + 0.2) CUT[ks[i]] = CUT[ks[i - 1]] + 0.2;
}
// beats
const tPop50 = w(0, 'plus') - 0.35, tLand50 = tPop50 + H.XP_FLY;
const tLvl2 = w(0, 'Level') - 0.15;
const tUp = w(1, 'UP'), tNICE = w(1, 'NICE');
const tSpree = w(2, 'spree');
const tCarried = w(3, 'carried'), tCompl = w(3, 'complimented'), tRescued = w(3, 'rescued'), tGrab = w(3, 'ball') + 0.05;
const tHat = w(4, 'hat'), tSoup = w(4, 'soup'), tDog = w(4, 'dog');
const tTwo = w(5, 'two'), tFive = w(5, 'five'), tTwenty = w(5, 'twenty');
const tForty = w(6, 'Forty'), tSixty = w(6, 'Sixty'), tEighty = w(6, 'Eighty');
const tGlassesW = w(8, 'glasses'), tHeadW = w(9, 'head'), tQC = w(10, 'complete'), tOne = w(10, 'one');
const tPillow = w(12, 'pillow'), tEVER = w(12, 'EVER');
const tEpic = w(13, 'complete'), tHundred = w(13, 'hundred');
const tPop100 = w(13, 'Plus') - 0.1, tLand100 = tPop100 + H.XP_FLY, tLvl21 = tLand100 + 0.75;
const tPoints50 = w(14, 'points') - 0.6;
const tOneSpawn = w(10, 'Plus') - 0.05;                         // the tiny +1 XP
// the deeds of the montage: [spawn time, amount] — each pop lands H.XP_FLY later
const GRID = [0, 1, 2, 3].map((i) => CUT.grid + 0.2 + i * 0.42);
const DEEDS = {
  groc: [tCarried + 0.35, 10], lady: [tCompl + 0.5, 5], ball: [w(3, 'tree') + 0.05, 20], hat: [tHat + 0.1, 5], soup: [tSoup + 0.1, 5], dog: [tDog + 0.1, 5],
  g0: [GRID[0] + 0.35, 10], g1: [GRID[1] + 0.35, 15], g2: [GRID[2] + 0.35, 20], g3: [GRID[3] + 0.35, 25],
};

// ================================================================= the hero's XP (state machine over land / set events)
const XPE = [
  { t: tLand50, add: 50 },
  { t: tLvl2, set: { level: 2, xp: 0, need: 150 } },
  ...Object.values(DEEDS).map(([t0, add]) => ({ t: t0 + H.XP_FLY, add })),
  { t: tTwo - 0.1, add: 30 },
  { t: tFive - 0.12, set: { level: 5, xp: 40, need: 200 } },
  { t: tTwenty - 0.12, set: { level: 20, xp: 59, need: 160 } },
  { t: tOneSpawn + H.XP_FLY, add: 1 },
  { t: tLand100, add: 100 },
  { t: tLvl21, set: { level: 21, xp: 0, need: 500 } },
  ...[0, 0.35, 0.7].map((d) => ({ t: tPoints50 + d + H.XP_FLY, add: 50 })),
].sort((a, b) => a.t - b.t);
function xpState(t) {
  let lv = 1, xp = 50, need = 100, from = 50, u = 1, gain = 0, lb = 0;
  for (const e of XPE) {
    if (t < e.t) break;
    if (e.set) { lv = e.set.level; xp = e.set.xp; need = e.set.need; from = xp; u = 1; lb = seg(t, e.t, e.t + 0.6); continue; }
    from = xp; xp = Math.min(need, xp + e.add); u = seg(t, e.t, e.t + 0.6); gain = seg(t, e.t, e.t + 0.45);
  }
  const shown = Math.round(lerp(from, xp, ease.out(u)));
  return { t, level: lv, value: xp / need, from: from / need, roll: u, text: `${shown} / ${need}`, gain, levelBump: lb };
}
const barTo = (t) => { const s = xpState(t); return H.xpBarAt({ value: s.from + (s.value - s.from) * ease.out(s.roll), text: s.text }); };

// ================================================================= HUD + compose
const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
function compose(t, world, o = {}) {
  let s = world + (o.fx || '') + (o.plates || '');
  if (o.cold) s += coldWash(o.cold);
  s += E.hudFrame(t, { clock: o.clock || '3:30 PM', day: o.day || 'MON', quest: o.quest, questSub: o.questSub, theme: o.theme });
  s += o.pop || '';
  s += H.xpBar(xpState(t));
  return s + (o.top || '');
}
const pops = (t, list) => list.map(([x, y, t0, amount, s]) => H.xpPop({ x, y, age: t - t0, amount, s: s || 1, to: barTo(t0 + H.XP_FLY) })).join('');
// a cast member's plate over a world pose (screen space)
function plateOver(cam, key, pose, opts) { const p = headAt(cam, key, pose); return { x: p.x, y: p.y, z: p.z }; }

// ================================================================= the street people
const STY = SH.FLOOR.street;   // 935
const heroS = 0.4;
const youSt = (t, p, a = {}) => actor('you', t, { s: heroS, y: STY, ...p }, a);
const bagsAt = (pose, key = 'you', s = 0.24) => [-1, 1].map((side) => { const h = CAST.handPos(key, pose, side); return X.groceryBags({ x: h[0], y: h[1] - 8, s }); }).join('');
const wellsPose = (extra = {}) => ({ ...STR.wells, ...extra });

// ================================================================= SHOTS
// ---- 1. "Experience plus fifty!" — the +50 XP rises off the hero and flies into the bar, which fills to the brim
function shPlus(t) {
  const cam = camKeys(t, [[CUT.plus, camAt(720, 735, 1.75)], [CUT.lvlup, camAt(730, 740, 1.95)]], ease.inOut);
  const hero = { armL: 24, armR: 24, bendL: -122, bendR: -122, turn: 0.05, face: { name: 'excited', eyes: { type: 'star' }, mouth: 'grin' }, ...boing(t, tLand50, 0.1, 0.5) };
  const o = cafWorld(t, cam, { hero, heroAct: { arms: false }, benjiPose: { face: { name: 'amazed', eyes: { look: [0.9, 0] } } }, tank: false, sandwich: false, bagOpen: true, over: towerTop(t) });
  const c = toScr(cam, HERO_X, 700);
  const pop_ = H.xpPop({ x: c.x + 260, y: c.y - 250, age: t - tPop50, amount: 50, s: 1.3, to: barTo(tLand50) });
  const fx = H.glow(960, 1050, 820, 70, '#FFD84A', 0.8 * bump(t, tLand50, tLand50 + 1.2));
  return compose(t, o, { fx, pop: pop_, clock: '12:06 PM' });
}
// ---- 2. "Level up!" — he jumps up on the bench, arms in a V, a gold column; LEVEL UP 1 → 2
function shLvlUp(t) {
  const cam = shakeAll(camKeys(t, [[CUT.lvlup, camAt(760, 600, 1.25)], [CUT.nice, camAt(760, 590, 1.32)]], ease.out), t, [[tLvl2 + 0.1, 0.35, 12]]);
  const up = ease.outBack(seg(t, CUT.lvlup, CUT.lvlup + 0.3));
  const hero = { y: lerp(HERO_Y, 950, up), lift: 70 * bump(t, CUT.lvlup + 0.05, CUT.lvlup + 0.5), armL: lerp(24, 160, up), armR: lerp(24, 160, up), bendL: 0, bendR: 0, face: { name: 'joy', eyes: { type: 'star' } } };
  const o = cafWorld(t, cam, { hero, heroAct: { arms: false }, benjiPose: { face: { name: 'shocked', mouth: 'O', eyes: { look: [0.9, -0.5] } }, lean: 8 }, tank: false, sandwich: false, bagOpen: true, over: towerTop(t) });
  const c = toScr(cam, HERO_X, 600);
  let fx = S.path(`M${f(c.x - 140)} -20 L${f(c.x + 140)} -20 L${f(c.x + 220)} 1100 L${f(c.x - 220)} 1100 Z`, { fill: '#FFE88A', opacity: f(0.28 * bump(t, CUT.lvlup, CUT.nice + 0.4)) });
  const pop_ = H.levelUp({ t, k: seg(t, tLvl2 - 0.1, tLvl2 + 1.2), from: 1, level: 2, x: 1340, y: 330, s: 0.85 });
  return compose(t, o, { fx, pop: pop_, clock: '12:06 PM' }) + smash(t, CUT.lvlup, 0.1, 0.5);
}
// ---- 3. "I'm leveling UP? For being NICE?!" — close-up, smash-zooms on UP and NICE; Benji below, baffled
function shNice(t) {
  const cam = shakeAll(camKeys(t, [[CUT.nice, camAt(760, 560, 1.7)], [tUp - 0.06, camAt(760, 560, 1.72)], [tUp + 0.1, camAt(760, 545, 2.15)], [tNICE - 0.5, camAt(700, 640, 1.45)], [tNICE - 0.06, camAt(700, 640, 1.48)], [tNICE + 0.12, camAt(760, 545, 2.4)], [CUT.marks, camAt(760, 545, 2.45)]], ease.out), t, [[tUp, 0.25, 8], [tNICE, 0.3, 12]]);
  const hero = { y: 950, armL: 150 + 15 * Math.sin(t * 9), armR: 150 + 15 * Math.sin(t * 9 + 1), face: { name: 'excited', eyes: { type: t > tNICE ? 'star' : undefined } } };
  const o = cafWorld(t, cam, { hero, heroAct: { arms: false }, benjiPose: { face: { name: 'confused', eyes: { look: [0.9, -0.6] }, fx: ['question'] } }, tank: false, sandwich: false, bagOpen: true, over: towerTop(t) });
  let fx = '';
  const p = toScr(cam, HERO_X, 600);
  if (t > tUp && t < tUp + 0.6) fx += zoomLines(p.x, p.y, 0.6 * (1 - seg(t, tUp + 0.2, tUp + 0.6)), t, '#FFE88A');
  if (t > tNICE) fx += zoomLines(p.x, p.y, 0.7 * (1 - seg(t, tNICE + 0.4, tNICE + 1.0)), t, '#FFE88A');
  const top = K.bang('NICE?!', 1400, 300, pop(t, tNICE, 0.2), 140, 8, '#FFD84A');
  return compose(t, o, { fx, clock: '12:06 PM', top }) + smash(t, tNICE + 0.02, 0.1, 0.4);
}
// people around the cafeteria who suddenly have quests (far table head tops, the lunch lady, a kid at the back table)
const MARKS = [[104, 514, '+10 XP'], [541, 514, '+5 XP'], [1730, 360, '+10 XP'], [-119, 514, '+15 XP'], [963, 514, '+5 XP'], [316, 514, '+20 XP'], [739, 514, '+5 XP']];
// ---- 4. (beat) he turns: yellow "!" markers pop up over half the room
function shMarks(t) {
  const u = ease.inOut(seg(t, CUT.marks, CUT.spree));
  const cam = { x: lerp(330, 120, u), y: -40, zoom: lerp(1.0, 0.92, u) };
  const hero = { y: 950, view: 'back', armL: 20, armR: 20 };
  const o = cafWorld(t, cam, { hero, heroAct: { arms: false }, benjiPose: { face: 'confused' }, tank: false, sandwich: false, bagOpen: true, over: towerTop(t) });
  let plates = '';
  MARKS.forEach(([x, y, r], i) => { const p = toScr(cam, x, y); plates += H.questMarker({ x: p.x, y: p.y, s: 0.95, t, k: seg(t, CUT.marks + 0.1 + i * 0.12, CUT.marks + 0.5 + i * 0.12), reward: r, seed: i }); });
  return compose(t, o, { plates, clock: '12:07 PM' });
}
// street extras with quests (for the wide SPREE shot)
const NEIGH = [[1720, 'adult', 3, '+10 XP'], [2350, 'kid', 7, '+5 XP'], [2700, 'adult', 8, '+20 XP'], [-60, 'adult', 11, '+15 XP'], [1180, 'kid', 9, '+5 XP']];
// ---- 5. "So you went on a quest spree." — wide street, markers everywhere, he sprints in; QUEST SPREE! slams on "spree"
function shSpree(t) {
  const cam = camKeys(t, [[CUT.spree, { zoom: 0.62, x: 260, y: -40 }], [CUT.groc, { zoom: 0.66, x: 320, y: -40 }]], ease.linear);
  const hx = lerp(-700, 600, seg(t, CUT.spree, CUT.groc));
  let chars = actor('neighbor', t, wellsPose({ bags: false, face: 'happy' }));
  NEIGH.forEach(([x, kind, i]) => { chars += K.draw[kind](i, { x, y: STY, s: heroS, turn: -0.3, face: 'happy' }); });
  chars += youSt(t, { x: hx, view: 'side', flip: true, ...AC.run((t - CUT.spree) * 18, 1.1), lean: 8, face: 'excited' }, { arms: false });
  let o = street(t, cam, {}, chars);
  let plates = '';
  [[STR.wells.x, 'neighbor', '+10 XP'], ...NEIGH.map(([x, kind, i, r]) => [x, kind, r, i])].forEach(([x, key, r, i], j) => {
    const p = headAt(cam, key, { x, y: STY, s: heroS, i });
    plates += H.questMarker({ x: p.x, y: p.y, s: 0.55, t, k: seg(t, CUT.spree + 0.1 + j * 0.1, CUT.spree + 0.5 + j * 0.1), reward: r, seed: j });
  });
  const pop_ = E.titleSlam({ t, k: seg(t, tSpree - 0.25, tSpree + 0.55), text: 'QUEST SPREE!', sub: 'ALL QUESTS · ALL WEEK', y: 330, s: 0.9, out: seg(t, CUT.groc - 0.25, CUT.groc) });
  return compose(t, o, { plates, pop: pop_, clock: '3:30 PM', day: 'MON' }) + whip(t, CUT.spree, 1, 0.12);
}
// ---- 6. "You carried groceries." — he hauls both bags to Mrs. Wells' gate; +10 XP
function shGroc(t) {
  const cam = camKeys(t, [[CUT.groc, camAt(760, 700, 1.45)], [CUT.lady, camAt(700, 700, 1.5)]], ease.inOut);
  const hx = lerp(1060, 700, ease.out(seg(t, CUT.groc, tCarried + 0.4)));
  const walking = t < tCarried + 0.35;
  const hp = { x: hx, turn: -0.5, ...(walking ? AC.walkFront((t - CUT.groc) * 9, 1) : {}), armL: 8, armR: 8, lean: 3 * Math.sin(t * 9), face: { name: 'happy', eyes: { look: [-0.8, 0] } } };
  let chars = actor('neighbor', t, wellsPose({ bags: false, turn: 0.4, armL: 30 + 40 * bump(t, tCarried + 0.3, tCarried + 1.2), armR: 120 + 20 * Math.sin(t * 8), face: { name: 'joy', fx: ['blush'] } }));
  chars += youSt(t, hp, { arms: false }) + bagsAt({ s: heroS, y: STY, ...hp }, 'you', 0.26);
  let o = street(t, cam, { bags: false }, chars);
  const d = DEEDS.groc, p = headAt(cam, 'neighbor', wellsPose());
  return compose(t, o, { pop: pops(t, [[p.x, p.y - 40, d[0], d[1]]]), clock: '3:42 PM', day: 'MON' }) + whip(t, CUT.groc, 1, 0.1);
}
// ---- 7. "You complimented the lunch lady." — at the counter: two thumbs up; she blushes, twirls the ladle; +5 XP
function shLady(t) {
  const cam = camKeys(t, [[CUT.lady, camAt(1640, 600, 1.5)], [CUT.ball, camAt(1660, 590, 1.6)]], ease.inOut);
  const thumbs = ease.outBack(seg(t, tCompl, tCompl + 0.3));
  const lady = actor('lunchLady', t, { ...E.CF.lunchLady, volume: false, turn: -0.4, headRot: -6 * thumbs, face: thumbs > 0.5 ? { name: 'joy', eyes: { type: 'happy' }, fx: ['blush', 'hearts'] } : 'neutral' });
  const hero = actor('you', t, { x: 1450, y: 990, s: 0.47, turn: 0.6, armL: lerp(10, 130, thumbs), armR: lerp(10, 130, thumbs), bendL: 40 * thumbs, bendR: 40 * thumbs, face: { name: 'joy', eyes: { type: 'happy' } }, volume: false }, { arms: false });
  const o = caf(t, cam, { lady, lane: hero });
  const d = DEEDS.lady, p = headAt(cam, 'lunchLady', E.CF.lunchLady);
  return compose(t, o, { pop: pops(t, [[p.x + 60, p.y - 30, d[0], d[1]]]), clock: '12:10 PM', day: 'TUE' }) + whip(t, CUT.lady, -1, 0.1);
}
// ---- 8. "You rescued a ball from a tree." — a jump, the grab, the landing, the ball to a cheering kid; +20 XP
function shBall(t) {
  const cam = camKeys(t, [[CUT.ball, camAt(1400, 690, 1.3)], [CUT.hat, camAt(1380, 700, 1.36)]], ease.inOut);
  const tJ = tGrab - 0.3, jump = bump(t, tJ, tJ + 0.6);
  const got = t > tGrab;
  const give = seg(t, tGrab + 0.6, tGrab + 0.9);
  const hp = { x: 1445, armL: lerp(20, 170, Math.min(1, jump * 2)), armR: got ? lerp(170, 60, give) : lerp(20, 170, Math.min(1, jump * 2)), lift: 125 * jump, kneeL: 30 * (1 - jump), kneeR: 30 * (1 - jump), face: got ? { name: 'joy', eyes: { type: 'happy' } } : { name: 'determined', eyes: { look: [0, -1] } } };
  let chars = K.draw.kid(6, { x: 1250, y: STY, s: heroS, turn: 0.5, armL: give > 0.5 ? 160 : 30, armR: give > 0.5 ? 160 : 60, lift: give > 0.5 ? 20 * Math.abs(Math.sin(t * 9)) : 0, face: give > 0.5 ? 'joy' : 'sad' });
  chars += youSt(t, hp, { arms: false });
  if (got) { const h = CAST.handPos('you', { y: STY, s: heroS, ...hp }, 1); chars += X.ball({ x: lerp(h[0], 1265, give), y: lerp(h[1] - 20, 690, give), s: 0.42, kind: 'soccer', spin: t * 200 }); }
  let o = street(t, cam, { ball: !got }, chars);
  const d = DEEDS.ball, p = headAt(cam, 'you', { x: 1445, y: STY, s: heroS });
  let fx = '';
  if (t > tGrab && t < tGrab + 0.4) { const b = toScr(cam, STR.ball.x, STR.ball.y); fx += H.sparkleBurst(b.x, b.y, seg(t, tGrab, tGrab + 0.4), 120, 8, '#FFFFFF', 2); }
  return compose(t, o, { fx, pop: pops(t, [[p.x, p.y - 30, d[0], d[1]]]), clock: '4:05 PM', day: 'TUE' }) + whip(t, CUT.ball, 1, 0.1);
}
// ---- 9. "Nice hat, Mrs. Wells!" — he jogs past with finger-guns; she touches the lilac cloche; tooltip STYLE +80; +5 XP
function shHat(t) {
  const cam = camKeys(t, [[CUT.hat, camAt(560, 700, 1.55)], [CUT.soup, camAt(620, 700, 1.6)]], ease.linear);
  const hx = lerp(180, 900, seg(t, CUT.hat, CUT.soup));
  const guns = ease.outBack(seg(t, tHat - 0.35, tHat - 0.05));
  const hp = { x: hx, view: 'side', flip: true, ...AC.run((t - CUT.hat) * 14, 0.7), armL: lerp(-20, 80, guns), armR: lerp(20, 70, guns), face: { name: 'happy', eyes: { type: 'happy' } } };
  const touch = seg(t, tHat, tHat + 0.3);
  let chars = actor('neighbor', t, wellsPose({ bags: false, turn: 0.3, armR: lerp(10, 165, touch), bendR: 30 * touch, face: touch > 0.5 ? { name: 'joy', fx: ['blush', 'hearts'] } : 'happy' }));
  chars += youSt(t, hp, { arms: false });
  let o = street(t, cam, { bags: false }, chars);
  const p = headAt(cam, 'neighbor', wellsPose());
  const tip = H.tooltip({ x: p.x - 10, y: p.y + 30, t, s: 0.9, k: seg(t, tHat - 0.1, tHat + 0.35), title: 'LILAC HAT', rarity: 'rare', lines: ['STYLE +80'], side: 'left', dist: 70 });
  const d = DEEDS.hat;
  return compose(t, o, { pop: tip + pops(t, [[p.x + 70, p.y - 30, d[0], d[1]]]), clock: '9:12 AM', day: 'WED' }) + whip(t, CUT.hat, 1, 0.1);
}
// ---- 10. "Great soup, lunch lady!" — a big slurp, a thumbs up (his face goes a bit green); MYSTERY SOUP · ???; +5 XP
function shSoup(t) {
  const cam = camKeys(t, [[CUT.soup, camAt(1600, 620, 1.55)], [CUT.dog, camAt(1590, 615, 1.62)]], ease.linear);
  const slurp = seg(t, CUT.soup + 0.05, tSoup - 0.1), thumb = ease.outBack(seg(t, tSoup - 0.1, tSoup + 0.2));
  const lady = actor('lunchLady', t, { ...E.CF.lunchLady, volume: false, turn: -0.4, face: { name: 'smug', fx: ['blush'] }, armL: 30 });
  const hp = { x: 1450, y: 990, s: 0.47, turn: 0.55, armL: 22, bendL: -118, armR: lerp(22, 150, thumb), bendR: lerp(-118, 40, thumb), volume: false,
    face: thumb > 0.4 ? { name: 'happy', mouth: 'wavy', eyes: { type: 'happy' }, fx: ['sweat'] } : { name: 'happy', mouth: 'o', eyes: { type: 'closed' } } };
  let hero = actor('you', t, hp, { arms: false });
  const hb = CAST.handPos('you', hp, -1);
  hero += S.g(S.ellipse(0, 0, 46, 16, ol('#FFFFFF', 4)) + S.path('M-46 0 Q-40 40 0 42 Q40 40 46 0', ol('#FFFFFF', 4)) + S.ellipse(0, 0, 38, 11, { fill: '#9A8A5A' }) + S.circle(-10, -2, 5, { fill: '#6A5A3A' }), tf(hb[0] + 10, hb[1] - 30 - 30 * slurp * (1 - thumb), 0.9));
  const o = caf(t, cam, { lady, lane: hero });
  const p = toScr(cam, hb[0] + 10, hb[1] - 40);
  const tip = H.tooltip({ x: p.x, y: p.y, t, s: 0.85, k: seg(t, tSoup - 0.2, tSoup + 0.25), title: 'MYSTERY SOUP', rarity: 'mystery', lines: ['TASTE: ???'], side: 'up', dist: 120, dx: -60 });
  const d = DEEDS.soup, lp = headAt(cam, 'lunchLady', E.CF.lunchLady);
  return compose(t, o, { pop: tip + pops(t, [[lp.x + 60, lp.y - 30, d[0], d[1]]]), clock: '12:08 PM', day: 'WED' }) + whip(t, CUT.soup, -1, 0.1);
}
// ---- 11. "Cool dog, random man!" — a man walks a dark corgi; the hero high-fives the air; DOG · COOL ∞; +5 XP
function shDog(t) {
  const cam = camKeys(t, [[CUT.dog, camAt(3300, 720, 1.4)], [CUT.grid, camAt(3240, 720, 1.45)]], ease.linear);
  const mx = lerp(3560, 3260, seg(t, CUT.dog, CUT.grid));
  const man = { x: mx, y: STY, s: heroS, view: 'side', ...AC.walk((t - CUT.dog) * 7, 0.8), armR: 40, face: t > tDog + 0.2 ? { name: 'confused', fx: ['question'] } : 'neutral' };
  let chars = X.biscuit({ x: mx - 170, y: STY, s: heroS, pose: 'walk', t, coat: '#5A4030', coat2: '#F2E6D8', face: 'happy' });
  chars += S.path(`M${f(mx - 30)} ${f(STY - 230)} Q${f(mx - 110)} ${f(STY - 100)} ${f(mx - 150)} ${f(STY - 110)}`, ln(3, '#C0303A'));
  chars += K.draw.adult(14, man);
  const hx = lerp(2900, 3100, seg(t, CUT.dog, CUT.grid));
  chars += youSt(t, { x: hx, turn: 0.5, armR: 150 + 10 * Math.sin(t * 12), armL: 20, face: { name: 'joy', eyes: { type: 'happy' } } }, { arms: false });
  let o = street(t, cam, {}, chars);
  const dp = toScr(cam, mx - 170, STY - 356 * heroS);
  const plate = H.statPlate({ x: dp.x, y: dp.y, s: 0.75, t, k: seg(t, tDog - 0.2, tDog + 0.3), name: 'DOG', level: 3, bars: [{ label: 'COOL', value: Infinity }], tags: [] });
  const d = DEEDS.dog;
  return compose(t, o, { plates: plate, pop: pops(t, [[dp.x + 160, dp.y - 60, d[0], d[1]]]), clock: '5:20 PM', day: 'WED' }) + whip(t, CUT.dog, 1, 0.1);
}
// mini-quest panels (flat backgrounds + two characters each, drawn in a 1920×1080 world)
function miniWorld(i, t) {
  const bgs = [['#BFE6FF', '#8FD07A'], ['#FFE3C2', '#C8A27A'], ['#E6D8FF', '#B9B0C8'], ['#FFD6E6', '#E8B88A']];
  const [wall, floor] = bgs[i];
  let g = S.rect(-200, -200, 2320, 1100, 0, { fill: wall }) + S.rect(-200, 880, 2320, 400, 0, { fill: floor }) + S.path('M-200 880 H2120', ln(8));
  const y = 1000, s = 0.75;
  if (i === 0) {        // folding a paper boat with Max
    g += S.rect(500, 880, 900, 30, 10, ol('#C98A52', 6));
    g += actor('max', t, { x: 1250, y, s, turn: -0.4, armL: 60, armR: 60, face: { name: 'joy', eyes: { type: 'star' } }, volume: false });
    g += actor('you', t, { x: 720, y, s, turn: 0.4, armL: 50, armR: 70, bendR: -60, face: 'happy', volume: false });
    g += X.paperBoat({ x: 980, y: 880, s: 0.9, t });
  } else if (i === 1) { // tying Benji's laces
    g += actor('benji', t, { x: 1150, y, s, turn: -0.3, face: { name: 'joy', mouth: 'grin' }, armL: 30, armR: 30, volume: false, laces: false });
    g += actor('you', t, { x: 800, y: y + 60, s, turn: 0.6, bodyY: 180, armR: 80, armL: 70, kneeL: 90, kneeR: 90, legL: 60, legR: 0, face: 'happy', volume: false });
  } else if (i === 2) { // holding the shop door
    g += S.rect(300, 280, 380, 600, 10, ol('#5A8A5A', 8)) + S.rect(330, 310, 320, 280, 6, ol('#BFE6FF', 5)) + K.T('OPEN', 490, 460, 60, '#C0303A');
    g += actor('you', t, { x: 760, y, s, turn: 0.2, armL: 100, face: 'happy', volume: false });
    g += K.draw.adult(5, { x: 1150, y, s: s * 1.05, turn: -0.5, armR: 120, face: 'joy' });
  } else {              // a treat for Biscuit
    g += X.biscuit({ x: 1150, y, s, pose: 'beg', t, face: 'love' });
    g += actor('you', t, { x: 760, y, s, turn: 0.5, armR: 70, face: { name: 'joy', eyes: { type: 'happy' } }, volume: false });
  }
  return g;
}
// ---- 12. (beat) the 2×2 split-screen montage of good deeds, XP pops raining into the bar
function shGrid(t) {
  let o = S.rect(0, 0, 1920, 1080, 0, { fill: '#2A1640' }) + K.rays(960, 520, 18, 1500, '#FFD84A', 0.08, t * 20);
  const boxes = [[70, 120, 870, 400], [980, 120, 870, 400], [70, 545, 870, 400], [980, 545, 870, 400]];
  const labels = ['+10 XP · BOAT FOR MAX', '+15 XP · LACES', '+20 XP · THE DOOR', '+25 XP · GOOD BOY'];
  boxes.forEach(([x, y, wd, ht], i) => { o += E.panelBox(x, y, wd, ht, seg(t, GRID[i] - 0.1, GRID[i] + 0.3), miniWorld(i, t), { label: labels[i], dir: i % 2 ? 1 : -1 }); });
  const list = Object.entries(DEEDS).filter(([k]) => /^g\d$/.test(k)).map(([k, [t0, a]], i) => [boxes[i][0] + boxes[i][2] / 2, boxes[i][1] + 120, t0, a]);
  return compose(t, o, { pop: pops(t, list), clock: '6:40 PM', day: 'THU' }) + whip(t, CUT.grid, 1, 0.1);
}
// the time-lapse level shots (the same street spot, MON → WED → FRI)
function levelShot(t, o) {
  const cam = camKeys(t, [[o.t0, camAt(o.cx, 640, o.z0)], [o.t1, camAt(o.cx, 640, o.z1)]], ease.out);
  let chars = youSt(t, { x: o.hx, ...o.pose }, { arms: false });
  let w_ = street(t, cam, { time: o.time }, chars);
  let pop_ = E.dayStamp({ k: seg(t, o.t0, o.t0 + 0.3), x: 230, y: 250, day: o.day, sub: o.sub, s: 0.9 });
  return { w: w_, pop: pop_, cam };
}
// ---- 13. "Level two." — MON morning, a fist pump; the bar fills to 150 / 150 (that was Monday)
function shTwo(t) {
  const fist = ease.outBack(seg(t, tTwo - 0.25, tTwo + 0.05));
  const r = levelShot(t, { t0: CUT.two, t1: CUT.five, cx: -620, z0: 1.3, z1: 1.38, hx: -620, time: 'morning', day: 'MON', sub: 'LV 2',
    pose: { armR: lerp(20, 150, fist), bendR: lerp(0, 60, fist), armL: 14, turn: 0.2, face: { name: 'joy', eyes: { type: 'happy' } }, ...boing(t, tTwo, 0.15, 0.5) } });
  const hex = ease.outBack(seg(t, tTwo - 0.1, tTwo + 0.25));
  let g = S.path(H.hexD(0, 0, 90), ol('#1E1404', 9, '#120A00')) + S.path(H.hexD(0, 0, 76), { fill: 'none', stroke: '#FFC83A', 'stroke-width': 5 }) + H.TF('LV', 0, -28, 28, '#FFD98A', { 'letter-spacing': 3 }) + H.TL('2', 0, 46, 90, '#FFFFFF', { stroke: '#120A00', 'stroke-width': 9, 'paint-order': 'stroke' });
  const pop_ = r.pop + (hex > 0 ? S.g(H.rays(0, 0, 14, 260, '#FFE88A', 0.3, t * 30, 40) + g, tf(1340, 330, hex)) : '');
  return compose(t, r.w, { pop: pop_, clock: '7:45 AM', day: 'MON' }) + whip(t, CUT.two, 1, 0.1);
}
// ---- 14. "Level five." — WED, the double-biceps flex; LEVEL UP 2 → 5
function shFive(t) {
  const flex = ease.outBack(seg(t, tFive - 0.3, tFive));
  const r = levelShot(t, { t0: CUT.five, t1: CUT.twenty, cx: 1300, z0: 1.35, z1: 1.45, hx: 1300, time: 'day', day: 'WED', sub: 'LV 5',
    pose: { armL: lerp(20, 96, flex), armR: lerp(20, 96, flex), bendL: 104 * flex, bendR: 104 * flex, face: { name: 'determined', mouth: 'grin' } } });
  const pop_ = r.pop + H.levelUp({ t, k: seg(t, tFive - 0.2, tFive + 1.1), from: 2, level: 5, x: 1300, y: 330, s: 0.75 });
  return compose(t, r.w, { pop: pop_, clock: '3:15 PM', day: 'WED' }) + smash(t, CUT.five, 0.1, 0.5);
}
// ---- 15. "Level twenty." — FRI sunset, he floats in a gold column, arms up; LEVEL UP 5 → 20; then lands and struts
function shTwenty(t) {
  const fl = ease.out(seg(t, tTwenty - 0.3, tTwenty + 0.3)) * (1 - ease.inOut(seg(t, A[5].b + 0.6, A[5].b + 1.1)));
  const strut = t > A[5].b + 1.1;
  const cam = camKeys(t, [[CUT.twenty, camAt(-200, 600, 1.15)], [A[5].b + 0.4, camAt(-200, 560, 1.0)], [CUT.days, camAt(-80, 600, 1.05)]], ease.inOut);
  const hx = strut ? lerp(-200, 40, seg(t, A[5].b + 1.1, CUT.days)) : -200;
  const pose = strut ? { x: hx, view: 'side', flip: true, ...AC.walk((t - A[5].b) * 7, 1.2), lean: -4, face: { name: 'smug' } }
    : { x: hx, lift: 120 * fl + 8 * Math.sin(t * 4) * fl, armL: 20 + 145 * fl, armR: 20 + 145 * fl, face: { name: 'joy', eyes: { type: 'star' } } };
  let chars = youSt(t, pose, { arms: false });
  let w_ = street(t, cam, { time: 'sunset' }, chars);
  const c = toScr(cam, -200, 600);
  let fx = fl > 0 ? S.path(`M${f(c.x - 120)} -20 L${f(c.x + 120)} -20 L${f(c.x + 220)} 1100 L${f(c.x - 220)} 1100 Z`, { fill: '#FFE88A', opacity: f(0.35 * fl) }) + H.glow(c.x, c.y, 300, 360, '#FFE88A', fl) : '';
  const pop_ = E.dayStamp({ k: seg(t, CUT.twenty, CUT.twenty + 0.3), x: 230, y: 250, day: 'FRI', sub: 'LV 20', s: 0.9 }) + H.levelUp({ t, k: seg(t, tTwenty - 0.2, tTwenty + 1.3), from: 5, level: 20, x: 1250, y: 330, s: 0.95, out: seg(t, tTwenty + 1.8, tTwenty + 2.2) }) + K.confetti(t, tTwenty + 0.1, 50, 4);
  return compose(t, w_, { fx, pop: pop_, clock: '6:58 PM', day: 'FRI' }) + smash(t, tTwenty, 0.12, 0.6);
}
// ---- the lunch table with Tank (days): Tank at Benji's seat, Benji further left, the hero splits his sandwich
const TANK_SEAT = { x: 540, y: HERO_Y + 20, s: 0.5 };
function tankDay(t, cam, o = {}) {
  const tank = { ...TANK_SEAT, turn: 0.3, ...(o.tank || {}), ...((cam.zoom || 1) >= 1.5 ? { volume: false } : {}) };
  const table = actor('tank', t, tank, o.tankAct || {}) + (o.food || '');
  const benji = { x: 300, face: o.benjiFace || { name: 'joy', eyes: { look: [0.9, 0] } } };
  return { svg: cafWorld(t, cam, { hero: o.hero || {}, heroAct: o.heroAct || {}, benjiPose: benji, tank: false, sandwich: false, bag: false, table, quiet: 0, clock: o.clock }), tank };
}
const HP_STEPS = [[tForty, 40, 40], [tSixty, 60, 40], [tEighty, 80, 60]];
function tankHP(t) {
  let v = 40, from = 40, u = 1;
  for (const [t0, val, fr] of HP_STEPS) if (t >= t0 - 0.15) { v = val; from = fr; u = seg(t, t0 - 0.15, t0 + 0.6); }
  return { label: 'HP', value: v, from, roll: u };
}
function tankTags(t) {
  const tired = 1 - seg(t, tSixty, tSixty + 0.4), lonely = 1 - seg(t, tEighty, tEighty + 0.4);
  const tags = [];
  if (tired > 0) tags.push({ text: 'TIRED', k: tired });
  if (lonely > 0) tags.push({ text: 'LONELY', k: lonely });
  if (t > tEighty + 0.3) tags.push({ text: 'NEW FRIEND', k: seg(t, tEighty + 0.3, tEighty + 0.7) });
  return tags;
}
const tankPlate = (t, cam, pose, s = 1, fadeK = 0) => { const p = headAt(cam, 'tank', pose); return H.plateFor('tank', { x: p.x, y: p.y, s, t, bars: [tankHP(t)], tags: tankTags(t), fade: fadeK }); };
// ---- 16. "Every day, you shared your lunch with Tank." — the three of them at the table; half a sandwich across
function shDays(t) {
  const cam = camKeys(t, [[CUT.days, camAt(560, 650, 1.2)], [CUT.forty, camAt(600, 650, 1.3)]], ease.inOut);
  const give = ease.inOut(seg(t, w(6, 'shared') - 0.2, w(6, 'shared') + 0.5));
  const hero = { turn: -0.35, armL: lerp(96, 120, give), bendL: lerp(-40, -30, give), face: { name: 'happy', eyes: { look: [-0.8, -0.3] } } };
  const tank = { turn: 0.35, armR: lerp(10, 60, give), face: { name: 'happy', mouth: 'smallSmile', eyes: { look: [0.8, 0.3] } } };
  const hpL = CAST.handPos('you', { x: HERO_X, y: HERO_Y, s: 0.5, ...hero }, -1);
  const food = X.sandwich({ x: lerp(hpL[0], 650, give), y: hpL[1] - 20, s: 0.27 }) + X.sandwich({ x: 880, y: 830, s: 0.27, rot: 4 });
  const d = tankDay(t, cam, { hero, heroAct: { arms: false }, tank, tankAct: { arms: false }, food });
  const plates = tankPlate(t, cam, d.tank, 1.05);
  return compose(t, d.svg, { plates, clock: '12:05 PM', day: 'MON' }) + whip(t, CUT.days, -1, 0.12);
}
// ---- 17–19. "Forty health. Sixty. Eighty." — jump cuts across the days: HP climbs, TIRED / LONELY peel off, NEW FRIEND
function shHP(t, day, clock, i) {
  const cam = camKeys(t, [[[CUT.forty, CUT.sixty, CUT.eighty][i], camAt(600, 620, 1.55)], [[CUT.sixty, CUT.eighty, CUT.good][i], camAt(600, 615, 1.62)]], ease.linear);
  const faces = [{ name: 'happy', mouth: 'smallSmile', eyes: { upper: 0.3 }, fx: ['eyebags'] }, { name: 'happy', mouth: 'smallSmile', eyes: { look: [0.7, 0] } }, { name: 'joy', eyes: { type: 'happy' }, fx: ['blush'] }];
  const tank = { turn: 0.3, sandwich: true, bite: 0.3, face: faces[i] };
  const hero = { turn: -0.3, face: { name: 'joy', eyes: { look: [-0.8, 0] } } };
  const d = tankDay(t, cam, { hero, tank, benjiFace: { name: ['happy', 'joy', 'excited'][i], eyes: { look: [0.9, 0] } } });
  const plates = tankPlate(t, cam, d.tank, 1.3);
  const pop_ = E.dayStamp({ k: seg(t, [CUT.forty, CUT.sixty, CUT.eighty][i], [CUT.forty, CUT.sixty, CUT.eighty][i] + 0.25), x: 1700, y: 760, day, s: 0.75, rot: 6 });
  return compose(t, d.svg, { plates, pop: pop_, clock, day }) + smash(t, [CUT.forty, CUT.sixty, CUT.eighty][i], 0.08, 0.35);
}
const shForty = (t) => shHP(t, 'TUE', '12:04 PM', 0);
const shSixty = (t) => shHP(t, 'WED', '12:06 PM', 1);
const shEighty = (t) => shHP(t, 'THU', '12:05 PM', 2);
// ---- 20. "Your mom makes good sandwiches." — Tank close, almost smiling, thumbs up
function shGood(t) {
  const cam = camKeys(t, [[CUT.good, camAt(560, 560, 2.1)], [CUT.glasses, camAt(560, 555, 2.25)]], ease.linear);
  const th = ease.outBack(seg(t, w(7, 'good') - 0.2, w(7, 'good') + 0.1));
  const tank = { turn: 0.15, sandwich: true, bite: 0.5, armL: lerp(10, 118, th), bendL: lerp(0, 74, th), face: { name: 'happy', mouth: 'smallSmile', eyes: { look: [0.6, 0] }, fx: ['blush'] } };
  const d = tankDay(t, cam, { tank, tankAct: { arms: false } });
  const plates = tankPlate(t, cam, d.tank, 1.3, 0.55);
  return compose(t, d.svg, { plates, clock: '12:07 PM', day: 'FRI' });
}
// ---- the living room (Grandpa's glasses, Max's fort)
const GP = { x: 1430, y: 1000, s: 0.5 };
const heroCouch = (extra = {}) => SH.seatPose(LV.seats.couchR, 1, extra);
function livingShot(t, cam, o = {}) {
  const NV = (cam.zoom || 1) >= 1.25 ? { volume: false } : {};      // Grandpa's filtered rig is the costliest in the cast
  const seated = o.heroSeated === false ? '' : actor('you', t, { ...heroCouch(), ...NV, ...(o.hero || {}) }, o.heroAct || {});
  const gp = o.gramps === false ? '' : actor('grandpa', t, { ...GP, ...NV, ...(o.gp || {}) }, o.gpAct || {});
  return living(t, cam, { fort: o.fort || 0, time: 'day' }, seated + (o.seated || ''), (o.behind || '') + gp + (o.standing || ''), o.over || '');
}
// ---- 21. "Has anybody seen my glasses?" — Grandpa pats his pockets, looks around; "!" + NEW QUEST: Find Grandpa's glasses
function shGlasses(t) {
  const cam = camKeys(t, [[CUT.glasses, camAt(1250, 640, 1.3)], [CUT.gramps, camAt(1290, 630, 1.4)]], ease.inOut);
  const pat = Math.sin((t - CUT.glasses) * 9);
  const gp = { turn: -0.2 + 0.5 * Math.sin((t - CUT.glasses) * 2.2), armL: 18 + 6 * pat, armR: 18 - 6 * pat, bendL: -70, bendR: -70, headRot: 8 * Math.sin((t - CUT.glasses) * 2.2), face: { name: 'angry', eyes: { look: [Math.sin((t - CUT.glasses) * 2.2), 0] } } };
  const o = livingShot(t, cam, { gp, gpAct: { arms: false }, hero: { face: { name: 'deadpan', eyes: { look: [0.9, -0.4], upper: 0.4 } } } });
  const p = headAt(cam, 'grandpa', GP);
  const plates = H.questMarker({ x: p.x, y: p.y, s: 0.7, t, k: seg(t, tGlassesW - 0.2, tGlassesW + 0.3), reward: '+1 XP' });
  const pop_ = H.questToast({ t, k: seg(t, tGlassesW, tGlassesW + 0.6), title: "Find Grandpa's glasses", reward: '+1 XP', y: 150, s: 0.8 });
  return compose(t, o, { plates, pop: pop_, clock: '6:15 PM', day: 'SAT' }) + whip(t, CUT.glasses, 1, 0.12);
}
// ---- 22. "Grandpa." — the hero on the couch, deadpan
function shGramps(t) {
  const cam = camKeys(t, [[CUT.gramps, camAt(1100, 600, 2.2)], [CUT.head, camAt(1100, 600, 2.3)]], ease.linear);
  const o = livingShot(t, cam, { hero: { face: { name: 'deadpan', eyes: { look: [0.9, -0.4], upper: 0.5 } } }, heroAct: { energy: 0.2 } });
  const pop_ = H.questToast({ t, k: 1, title: "Find Grandpa's glasses", reward: '+1 XP', y: 150, s: 0.8, out: seg(t, CUT.gramps + 0.6, CUT.gramps + 1.0) });
  return compose(t, o, { pop: pop_, clock: '6:15 PM', day: 'SAT' });
}
// ---- 23. "They're on your head." — Grandpa close: the tooltip pins the glasses on his forehead; his eyes roll up
function shHead(t) {
  const cam = camKeys(t, [[CUT.head, camAt(1430, 615, 2.1)], [CUT.qc, camAt(1430, 605, 2.3)]], ease.inOut);
  const up = seg(t, tHeadW - 0.1, tHeadW + 0.3);
  const gp = { face: { name: 'confused', eyes: { look: [0, lerp(0, -1, up)] } }, armL: 10, armR: 10 };
  const o = livingShot(t, cam, { gp, gpAct: { arms: false }, heroSeated: false });
  const p = headAt(cam, 'grandpa', GP);
  const tip = H.tipFor('glasses', { x: p.x, y: p.y + 70 * p.z / 2.1, t, s: 1.0, k: seg(t, tHeadW - 0.25, tHeadW + 0.25), side: 'right', dist: 110 });
  return compose(t, o, { pop: tip, clock: '6:16 PM', day: 'SAT' });
}
// ---- 24. "Quest complete." — he pulls them down: "Oh!"; QUEST COMPLETE toast
function shQC(t) {
  const cam = camKeys(t, [[CUT.qc, camAt(1300, 620, 1.55)], [CUT.tinyxp, camAt(1300, 615, 1.62)]], ease.linear);
  const down = t > tQC - 0.2;
  const gp = { glasses: down ? 'on' : 'up', armR: down ? lerp(150, 20, seg(t, tQC, tQC + 0.4)) : 150, bendR: 40, face: down ? { name: 'amazed', mouth: 'o' } : 'confused' };
  const o = livingShot(t, cam, { gp, gpAct: { arms: false }, hero: { face: { name: 'deadpan', eyes: { look: [0.9, -0.3], upper: 0.4 } } } });
  const pop_ = H.questToast({ t, k: seg(t, tQC - 0.3, tQC + 0.4), kind: 'complete', title: "Find Grandpa's glasses", reward: '+1 XP', y: 150, s: 0.8 });
  return compose(t, o, { pop: pop_, clock: '6:16 PM', day: 'SAT' });
}
// ---- 25. "Plus one experience." — a tiny +1 XP; then a magnifier on the bar: it moved... barely
function shTinyXP(t) {
  const cam = camAt(1300, 615, 1.62);
  const gp = { glasses: 'on', armR: 20, face: 'happy' };
  let o = livingShot(t, cam, { gp, gpAct: { arms: false }, hero: { face: 'deadpan' } });
  const st = xpState(t);
  const mag = ease.out(seg(t, tOneSpawn + 0.8, tOneSpawn + 1.15));
  let pop_ = H.xpPop({ x: 1180, y: 300, age: t - tOneSpawn, amount: 1, s: 0.6, to: barTo(tOneSpawn + H.XP_FLY) });
  if (mag > 0) {
    const Z = lerp(1, 2.6, mag), cur = st.from + (st.value - st.from) * ease.out(st.roll);
    const end = H.xpBarAt({ value: cur, text: st.text, x: 0, y: 0, w: 1640 })[0];
    pop_ += dim(0.5 * mag) + S.g(H.xpBar({ ...st, x: 0, y: 0, w: 1640 }), `translate(${f(lerp(960, 960 - end * Z, mag))} ${f(lerp(1050, 600, mag))}) scale(${f(Z)})`);
    pop_ += S.g(S.circle(0, 0, 150, { fill: 'none', stroke: '#FFFFFF', 'stroke-width': 16 }) + S.circle(0, 0, 150, { fill: 'none', stroke: LINE, 'stroke-width': 5 }) + S.path('M106 106 L210 210', ln(30, '#6A4A2A')), tf(960, 600, mag));
    pop_ += TFS('+1 XP = +0.6%', 960, 380, 64, '#FFD84A', { opacity: f(mag) });
  }
  return compose(t, o, { pop: pop_, clock: '6:16 PM', day: 'SAT' });
}
const LINE = '#151515';
// ---- 26. "Easiest quest in history." — Grandpa back in the recliner with his paper; the hero shrugs; NEW RECORD stamp
function shEasiest(t) {
  const cam = camKeys(t, [[CUT.easiest, camAt(1300, 620, 1.3)], [CUT.max, camAt(1280, 620, 1.36)]], ease.linear);
  const shrug = bump(t, CUT.easiest + 0.3, CUT.easiest + 1.3);
  const seatGP = SH.seatPose(LV.seats.armchair, 1.12, { glasses: 'on', armL: 30, armR: 30, bendL: -100, bendR: -100, face: { name: 'happy', eyes: { look: [0, 0.6] } } });
  const paper = S.g(S.rect(-130, -90, 260, 180, 6, ol('#F4F1E8', 5)) + S.path('M-110 -60 H110 M-110 -30 H40 M-110 0 H110 M-110 30 H60', ln(6, '#9AA0AE')) + K.TF('THE ARM', 0, -66, 24, '#3A3456'), tf(LV.seats.armchair.x - 6, LV.seats.armchair.hip - 120, 0.6));
  const o = livingShot(t, cam, { gramps: false, seated: actor('grandpa', t, seatGP, { arms: false }) + paper, hero: { armL: 60 + 40 * shrug, armR: 60 + 40 * shrug, bendL: 60 * shrug, bendR: 60 * shrug, headRot: 6 * shrug, face: { name: 'deadpan', eyes: { type: shrug > 0.5 ? 'closed' : undefined } } }, heroAct: { arms: false } });
  const pop_ = E.stamp({ k: seg(t, w(11, 'history') - 0.1, w(11, 'history') + 0.2), x: 1340, y: 300, text: 'NEW RECORD', sub: 'FASTEST QUEST · 2.7 S', col: '#E8333C', size: 84 });
  return compose(t, o, { pop: pop_, clock: '6:17 PM', day: 'SAT' });
}
// ---- 27. MAX: "Build me a pillow fort!" — he bursts in from the kitchen, roaring; the EPIC QUEST card
function shMax(t) {
  const cam = camKeys(t, [[CUT.max, camAt(1250, 640, 1.15)], [CUT.ever, camAt(1180, 640, 1.22)]], ease.inOut);
  const run = seg(t, CUT.max, CUT.max + 0.9);
  const mx = lerp(2150, 1330, ease.out(run));
  const mp = run < 1 ? { x: mx, y: 1000, s: 0.5, view: 'side', ...AC.run((t - CUT.max) * 18, 1), face: 'excited' } : { x: mx, y: 1000, s: 0.5, turn: -0.4, lift: 30 * Math.abs(Math.sin(t * 8)), armL: 140, armR: 140, face: 'excited' };
  const o = livingShot(t, cam, { gramps: false, seated: actor('grandpa', t, SH.seatPose(LV.seats.armchair, 1.12, { glasses: 'on', face: { name: 'amazed', eyes: { look: [0.5, 0] } } })), standing: actor('max', t, mp, { arms: run < 1 ? false : true }), hero: { face: { name: 'shocked', eyes: { look: [0.9, 0] } } } });
  const pop_ = H.pillowFort({ t, k: seg(t, tPillow - 0.15, tPillow + 0.6), x: 700, y: 330, s: 0.85 });
  return compose(t, o, { pop: pop_, clock: '6:20 PM', day: 'SAT' });
}
// ---- 28. "The biggest one EVER!" — Max close-up: RAWR on EVER (smash zoom)
function shEver(t) {
  const cam = shakeAll(camKeys(t, [[CUT.ever, camAt(1330, 760, 1.8)], [tEVER - 0.05, camAt(1330, 760, 1.85)], [tEVER + 0.12, camAt(1330, 730, 2.4)], [CUT.build, camAt(1330, 730, 2.45)]], ease.out), t, [[tEVER, 0.4, 14]]);
  const roar = t > tEVER - 0.1;
  const mp = { x: 1330, y: 1000, s: 0.5, turn: -0.2, volume: false, ...(roar ? { roar: true } : { armL: 150, armR: 150, lift: 20 * Math.abs(Math.sin(t * 9)) }), face: roar ? { name: 'angry', mouth: 'scream', eyes: { type: 'star' } } : 'excited' };
  const o = livingShot(t, cam, { gramps: false, heroSeated: false, standing: actor('max', t, mp, { arms: false }) });
  const pop_ = H.pillowFort({ t, k: 1, x: 600, y: 330, s: 0.75 }) + K.bang('RAWR!', 1450, 330, pop(t, tEVER + 0.05, 0.2), 120, -8, '#7CFF6B');
  let fx = t > tEVER ? zoomLines(960, 500, 0.7 * (1 - seg(t, tEVER + 0.3, tEVER + 0.9)), t, '#C8FFB8') : '';
  return compose(t, o, { fx, pop: pop_, clock: '6:20 PM', day: 'SAT' }) + smash(t, tEVER + 0.02, 0.1, 0.4);
}
// cushions flying in during the build
function flyingCushions(t, t0, t1) {
  let o = '';
  const cols = ['#FF9FC4', '#7FD3FF', '#FFE07A', '#B9E68A', '#C9A8FF', '#FFB37A'];
  for (let i = 0; i < 10; i++) {
    const s0 = t0 + i * (t1 - t0) / 10, u = seg(t, s0, s0 + 0.35);
    if (u <= 0 || u >= 1) continue;
    const sx = i % 2 ? 2100 : -200, sy = 400 + hash(i) * 300, ex = 600 + hash(i * 3) * 520, ey = 820 - hash(i * 5) * 400;
    const x = lerp(sx, ex, u), y = lerp(sy, ey, u) - 260 * Math.sin(u * Math.PI);
    o += S.g(S.rect(-60, -40, 120, 80, 18, ol(cols[i % cols.length], 5)) + S.path('M-40 -20 Q0 -30 40 -20', ln(3, '#FFFFFF', 0.6)), tf(x, y, 1, u * 400 * (i % 2 ? 1 : -1)));
  }
  return o;
}
// ---- 29. (build) cushions fly, the fort rises in fast-forward
function shBuild(t) {
  const cam = { zoom: 0.9, x: -90, y: -40 };
  const k = ease.inOut(seg(t, CUT.build, CUT.reveal + 0.1));
  const fortX = X.pillowFort({ ...LV.fort, k, t });
  const mp = { x: 520, y: 1000, s: 0.5, turn: 0.4, armL: 150 + 20 * Math.sin(t * 20), armR: 150 - 20 * Math.sin(t * 20), lift: 20 * Math.abs(Math.sin(t * 14)), face: 'joy' };
  const hp = { x: 1300, y: 1000, s: 0.5, turn: -0.4, armL: 90 + 70 * Math.sin(t * 16), armR: 90 - 70 * Math.sin(t * 16), face: 'determined' };
  const o = livingShot(t, cam, { fort: k, gramps: false, heroSeated: false, standing: fortX + actor('max', t, mp, { arms: false }) + actor('you', t, hp, { arms: false }), over: flyingCushions(t, CUT.build, CUT.reveal) });
  const ff = S.g(S.path('M0 -30 L40 0 L0 30 Z M44 -30 L84 0 L44 30 Z', ol('#FFFFFF', 5)) + TFS('×8', 140, 22, 60, '#FFFFFF'), tf(1420, 120, 1));
  return compose(t, o, { fx: streaks(t, 120, 900, 8, 7, '#FFFFFF', 0.25, 3000, 1), pop: ff, clock: k > 0.5 ? '7:40 PM' : '6:55 PM', day: 'SAT' });
}
// ---- 30. "Epic quest complete!" — the reveal: the fort to the ceiling; Max at the door; EPIC QUEST COMPLETE!
function shReveal(t) {
  const cam = camKeys(t, [[CUT.reveal, { zoom: 1.05, x: -60, y: 0 }], [CUT.hundred, { zoom: 0.85, x: -100, y: -60 }]], ease.out);
  const mp = { x: 860, y: 935, s: 0.47, turn: 0, armL: 160, armR: 160, lift: 18 * Math.abs(Math.sin(t * 10)), face: 'joy' };
  const hp = { x: 1360, y: 1000, s: 0.5, turn: -0.3, armL: 40, armR: 150, face: { name: 'joy', eyes: { type: 'happy' } } };
  const o = livingShot(t, cam, { fort: 1, gramps: false, heroSeated: false, seated: actor('grandpa', t, SH.seatPose(LV.seats.armchair, 1.12, { glasses: 'on', face: { name: 'amazed', mouth: 'O' } })), standing: X.pillowFort({ ...LV.fort, k: 1, t }) + actor('max', t, mp, { arms: false }) + actor('you', t, hp, { arms: false }) });
  const pop_ = H.questComplete({ t, k: seg(t, tEpic - 0.5, tEpic + 0.8), epic: true, reward: '+100 XP', y: 200, s: 0.82 });
  return compose(t, o, { pop: pop_, clock: '7:41 PM', day: 'SAT' }) + smash(t, CUT.reveal, 0.12, 0.6);
}
// ---- 31. "Plus one hundred experience!" — +100 XP into the bar → LEVEL 21; confetti; Biscuit barks
function shHundred(t) {
  const cam = camKeys(t, [[CUT.hundred, { zoom: 0.85, x: -100, y: -60 }], [CUT.stare, { zoom: 0.92, x: -40, y: -40 }]], ease.inOut);
  const mp = { x: 860, y: 935, s: 0.47, armL: 160, armR: 160, lift: 18 * Math.abs(Math.sin(t * 10)), face: 'joy' };
  const hp = { x: 1360, y: 1000, s: 0.5, turn: -0.2, armL: 160, armR: 160, lift: 30 * bump(t, tLvl21 - 0.1, tLvl21 + 0.4), face: { name: 'joy', eyes: { type: 'star' } } };
  const dog = X.biscuit({ ...LV.dogBed.dog, pose: 'beg', t, face: 'happy' });
  const o = livingShot(t, cam, { fort: 1, gramps: false, heroSeated: false, seated: actor('grandpa', t, SH.seatPose(LV.seats.armchair, 1.12, { glasses: 'on', armL: 150, armR: 150, face: 'joy' }), { arms: false }), standing: X.pillowFort({ ...LV.fort, k: 1, t }) + dog + actor('max', t, mp, { arms: false }) + actor('you', t, hp, { arms: false }) });
  let pop_ = H.xpPop({ x: 860, y: 260, age: t - tPop100, amount: 100, s: 1.5, to: barTo(tLand100) });
  pop_ += H.levelUp({ t, k: seg(t, tLvl21 - 0.1, tLvl21 + 1.2), from: 20, level: 21, x: 1300, y: 330, s: 0.8, out: seg(t, tLvl21 + 1.6, tLvl21 + 2.0) }) + K.confetti(t, tLvl21, 60, 11);
  return compose(t, o, { pop: pop_, clock: '7:41 PM', day: 'SAT' });
}
// ---- 32. (beat) the cheering fades: close on the hero staring down at his XP bar; the warmth drains out
function shStare(t) {
  const cam = camKeys(t, [[CUT.stare, camAt(1360, 610, 2.3)], [CUT.slowly, camAt(1360, 612, 2.6)]], ease.linear);
  const cold = seg(t, CUT.stare + 0.4, CUT.slowly);
  const hp = { x: 1360, y: 1000, s: 0.5, turn: 0, armL: 14, armR: 14, volume: false, face: { name: 'smug', mouth: 'smirk', eyes: { look: [0, 0.4], type: t < CUT.stare + 0.6 ? 'star' : undefined } } };
  const o = livingShot(t, cam, { fort: 1, gramps: false, heroSeated: false, standing: X.pillowFort({ ...LV.fort, k: 1, t }) + actor('you', t, hp, { arms: false }) });
  // XP numbers reflected in his eyes
  const e = toScr(cam, 1360, 1000 - 0.5 * 951 + 138);
  const k = seg(cold, 0.15, 0.5);
  const refl = k > 0 ? S.g(TFS('XP', -66 * cam.zoom / 2.3, 0, 30 * cam.zoom / 2.3, '#FFD84A') + TFS('XP', 66 * cam.zoom / 2.3, 0, 30 * cam.zoom / 2.3, '#FFD84A'), tf(e.x, e.y, 1), { opacity: f(k) }) : '';
  return compose(t, o, { fx: refl, cold: cold * 0.7, clock: '7:43 PM', day: 'SAT' }) + softEdge(cold);
}
// cold street people whose faces get swallowed by XP chips
const CROWD = [[-260, 'adult', 2, '+5'], [200, 'kid', 10, '+2'], [700, 'adult', 6, '+8'], [1150, 'adult', 9, '+3'], [1700, 'kid', 12, '+5']];
function faceChip(x, y, s, txt, k) {
  if (k <= 0) return '';
  const th = H.theme('cold'), w = 170, h = 96, u = ease.outBack(clamp(k, 0, 1));
  let g = H.panel(-w / 2, -h / 2, w, h, th, { c: 14, br: 18, op: 1.15 }) + H.TL(txt, 0, 18, 50, '#DCE8F2', { stroke: th.edge, 'stroke-width': 6, 'paint-order': 'stroke' });
  return S.g(g, tf(x, y, s * u));
}
function chipOver(cam, key, x, i, txt, k, s = 1) {
  const p = headAt(cam, key, { x, y: STY, s: heroS, i });
  return faceChip(p.x, p.y + 92 * heroS * p.z, s * p.z * 0.55, `${txt} XP`, k);
}
// ---- 33. "But slowly..." — the cold street: he walks along, eyes on the numbers
function shSlowly(t) {
  const u = seg(t, CUT.slowly, CUT.points);
  const cam = camAt(lerp(-200, 900, u), 680, 1.25);
  const hx = lerp(-400, 760, u);
  let chars = '';
  CROWD.forEach(([x, kind, i], j) => { chars += K.draw[kind](i, { x: x + 40 * Math.sin(t + j), y: STY, s: heroS, view: 'side', flip: j % 2 === 0, ...AC.walk(t * 6 + j, 0.7), face: 'neutral' }); });
  chars += youSt(t, { x: hx, view: 'side', flip: true, ...AC.walk((t - CUT.slowly) * 7, 1), face: { name: 'smug', eyes: { look: [0.6, -0.5] } } }, { arms: false });
  let o = street(t, cam, { time: 'day' }, chars);
  let plates = '';
  CROWD.forEach(([x, kind, i, r], j) => { plates += chipOver(cam, kind, x + 40 * Math.sin(t + j), i, r, seg(t, CUT.people + j * 0.25, CUT.people + 0.4 + j * 0.25), 1.1); });
  return compose(t, o, { plates, cold: 0.85, clock: '4:10 PM', day: 'MON', theme: 'cold' }) + softEdge(0.6);
}
// ---- 34. "You started helping points." — he carries a box for a man whose face is a "+50 XP" chip; the pop flies to the bar
function shPoints(t) {
  const cam = camKeys(t, [[CUT.points, camAt(2600, 680, 1.45)], [CUT.twoxp, camAt(2640, 680, 1.52)]], ease.linear);
  const hx = lerp(2450, 2600, seg(t, CUT.points, CUT.twoxp)), mx = hx + 240;
  const box = S.g(S.rect(-90, -70, 180, 140, 8, ol('#C9A26A', 6)) + S.path('M-90 -20 H90', ln(5, '#A8824A')) + K.TF('FRAGILE', 0, 30, 26, '#C0303A'), tf(hx + 125, STY - 250, 0.62));
  let chars = K.draw.adult(4, { x: mx, y: STY, s: heroS, view: 'side', ...AC.walk((t - CUT.points) * 6, 0.6), armL: 60, face: 'happy' });
  chars += youSt(t, { x: hx, view: 'side', flip: true, ...AC.walk((t - CUT.points) * 6, 0.6), armL: 70, bendL: 30, face: { name: 'smug', eyes: { look: [0.7, -0.6], type: 'star' } } }, { arms: false }) + box;
  let o = street(t, cam, { time: 'day' }, chars);
  const p = headAt(cam, 'adult', { x: mx, y: STY, s: heroS, i: 4 });
  const plates = faceChip(p.x, p.y + 92 * heroS * p.z, 0.55 * p.z, '+50 XP', 1);
  const pop_ = [0, 0.35, 0.7].map((d, j) => H.xpPop({ x: [p.x, 300, 1650][j], y: [p.y - 120, 420, 380][j], age: t - (tPoints50 + d), amount: 50, to: barTo(tPoints50 + d + H.XP_FLY), col: '#D3E4F0' })).join('');
  return compose(t, o, { plates, pop: pop_, cold: 0.85, clock: '4:25 PM', day: 'TUE', theme: 'cold' }) + softEdge(0.6);
}
// Mrs. Wells with her spilled groceries (apples on the sidewalk) + the grey +2 XP marker
const WELLS_X = 1100;
function wellsSpill(t, tilt = 0) {
  let g = actor('neighbor', t, { x: WELLS_X, y: STY - 16, s: heroS * 0.97, bags: 1, spill: 1, turn: -0.3, lean: 6, armL: 40, face: { name: 'sad', eyes: { look: [-0.8, 0.4] }, fx: ['sweat'] } });
  for (let i = 0; i < 5; i++) { const ax = WELLS_X - 140 - i * 70 - 30 * hash(i); g += S.circle(ax, STY - 14, 14, ol('#E8333C', 3.5)) + S.path(`M${ax} ${STY - 28} q3 -8 8 -10`, ln(3)); }
  return g;
}
// ---- 35. "Two XP?" — close on his face, cold; his eyes flick to the grey chip, not to her
function shTwoXP(t) {
  const cam = camKeys(t, [[CUT.twoxp, camAt(900, 640, 1.85)], [CUT.walk, camAt(905, 640, 2.0)]], ease.linear);
  const hp = { x: 760, view: 'front', turn: 0.45, armL: 10, armR: 10, volume: false, face: { name: 'deadpan', eyes: { look: [0.9, -0.7], upper: 0.35 } } };
  let chars = wellsSpill(t) + youSt(t, hp, { arms: false });
  let o = street(t, cam, { time: 'day', bags: false }, chars);
  const p = headAt(cam, 'neighbor', { x: WELLS_X, y: STY - 16, s: heroS * 0.97 });
  const plates = H.questMarker({ x: p.x, y: p.y, s: 1.0, t, reward: '+2 XP', col: '#C9D3DD' });
  return compose(t, o, { plates, cold: 1, clock: '5:02 PM', day: 'WED', theme: 'cold' }) + softEdge(0.7);
}
// ---- 36. "Not worth it." — wide and cold: he walks past without stopping, steps over an apple; she looks after him
function shWalk(t) {
  const cam = camKeys(t, [[CUT.walk, camAt(900, 700, 1.25)], [END, camAt(960, 690, 1.3)]], ease.linear);
  const hx = lerp(560, 1500, seg(t, CUT.walk - 0.6, END + 0.3));
  const step = bump(t, CUT.walk + 0.55, CUT.walk + 0.85);
  let chars = wellsSpill(t);
  chars += youSt(t, { x: hx, y: STY + 26, s: heroS * 1.03, view: 'side', flip: true, ...AC.walk((t - CUT.walk) * 7, 1), lift: 22 * step, face: { name: 'deadpan', eyes: { look: [1, 0] } } }, { arms: false });
  let o = street(t, cam, { time: 'day', bags: false }, chars);
  const p = headAt(cam, 'neighbor', { x: WELLS_X, y: STY - 16, s: heroS * 0.97 });
  const plates = H.questMarker({ x: p.x, y: p.y, s: 0.95, t, reward: '+2 XP', col: '#C9D3DD' });
  return compose(t, o, { plates, cold: 1, clock: '5:02 PM', day: 'WED', theme: 'cold' }) + softEdge(0.8) + whip(t, END, 1, 0.12);
}

// ================================================================= dispatch
const SHOTS = [
  [CUT.plus, shPlus], [CUT.lvlup, shLvlUp], [CUT.nice, shNice], [CUT.marks, shMarks], [CUT.spree, shSpree], [CUT.groc, shGroc], [CUT.lady, shLady],
  [CUT.ball, shBall], [CUT.hat, shHat], [CUT.soup, shSoup], [CUT.dog, shDog], [CUT.grid, shGrid], [CUT.two, shTwo], [CUT.five, shFive], [CUT.twenty, shTwenty],
  [CUT.days, shDays], [CUT.forty, shForty], [CUT.sixty, shSixty], [CUT.eighty, shEighty], [CUT.good, shGood], [CUT.glasses, shGlasses], [CUT.gramps, shGramps],
  [CUT.head, shHead], [CUT.qc, shQC], [CUT.tinyxp, shTinyXP], [CUT.easiest, shEasiest], [CUT.max, shMax], [CUT.ever, shEver], [CUT.build, shBuild],
  [CUT.reveal, shReveal], [CUT.hundred, shHundred], [CUT.stare, shStare], [CUT.slowly, shSlowly], [CUT.people, shSlowly], [CUT.points, shPoints],
  [CUT.twoxp, shTwoXP], [CUT.walk, shWalk],
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
  if (t >= CUT.slowly) return { grade: 'cool', vignette: 1 };
  if (t >= CUT.stare) return { grade: 'cool', vignette: lerp(0.6, 1, seg(t, CUT.stare, CUT.slowly)) };
  if (t >= CUT.twenty && t < CUT.days) return { grade: 'warm', vignette: 0.55 };
  return { grade: 'warm', vignette: 0.45 };
}
const BEATS = {
  T0, END, tPop50, tLand50, tLvl2, tUp, tNICE, tSpree, tCarried, tCompl, tRescued, tGrab, tHat, tSoup, tDog, GRID, DEEDS, tTwo, tFive, tTwenty,
  tForty, tSixty, tEighty, tGlassesW, tHeadW, tQC, tOne, tOneSpawn, tPillow, tEVER, tEpic, tHundred, tPop100, tLand100, tLvl21, tPoints50, XPE,
};
module.exports = { scene, look, SHOTS, CUT, BEATS, xpState };
