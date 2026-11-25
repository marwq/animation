// SC 05 · TANK (320.56 … 386.32). The cafeteria. Tank's boots stomp down the lane, his shadow falls over the hero's sandwich,
// "Level eighty." (the red BOSS plate), "A boss fight." (fighting-game boss intro card + the boss bar), "Run? Fight? Hide under
// the table?" as a game choice menu (Benji is already under the table: HIDE · TAKEN), "Lunch." (the fist on the table) — then the
// room goes quiet: a deep scan sweeps through the hero's eyes, the boss plate glitches away, HP 3/100, HUNGRY (stomach growl) ·
// TIRED (yawn) · LONELY (pull back: alone in the light), silence on Tank's face; "...He hasn't eaten all day."; the camera tilts
// up to empty air → a TINY "?" → smash-zoom; "Here. Take the whole thing." (SANDWICH +37 HP tooltip) → "...You're GIVING it to
// me?" → QUEST COMPLETE! → the HP bar jumps 3 → 40, the first bite, HUNGRY peels off; "Thanks... I guess." (shy); "Why do you always
// take people's lunch?" → the memory bubble (Dad works nights: the note on the fridge, the empty lunch bag) → "Okay? Don't tell
// anybody." → the hero zips his lips; Mom's overpacked lunch spills out of the bag; "You can have half. Every day." → FRIENDSHIP +1;
// Tank walks off looking back, Benji pops up, drops his spoon: "Did Tank just say THANKS?!"; THE RULE card: kindness = +HP for
// them, +XP for YOU (+38 XP flies into the bar: 12 → 50), star eyes on the bar.
'use strict';

const K = require('./kit');
const H = require('./hud');
const X = require('../rig/extras');
const CAST = require('../rig/cast');
const AC = require('./acting');
const SH = require('./sets_home');
const E = require('./s05_env');
const { S, f, clamp, lerp, ease, seg, bump, hash, ol, ln, actor } = K;
const { L } = K.V;
const { tf, TFS, pop, sc, fade, shakeAll, boing, camAt, toScr, whip, smash, flashCol, zoomLines, letterbox, dim, softEdge, caf, headAt, hudS } = E;

const A = Array.from({ length: 15 }, (_, i) => L('05.' + i));
const T0 = K.V.scene('SC 05').start, END = K.V.scene('SC 06').start;     // == main.js RANGES for SC 05
const w = (i, word, n = 0) => A[i].word(word, n).t0;
const w1 = (i, word, n = 0) => A[i].word(word, n).t1;

// ================================================================= the cut list (all from the voice)
const CUT = {};
CUT.stomp = T0;
CUT.gulp = w(0, 'for') - 0.12;
CUT.lv = w(0, 'Level') - 0.4;
CUT.boss = w(0, 'A') - 0.12;
CUT.menu = A[1].a - 0.2;
CUT.lunch = A[2].a - 0.22;
CUT.saw = A[3].a - 0.04;
CUT.three = w(3, 'Three') - 0.4;
CUT.hungry = w(3, 'Hungry') - 0.32;
CUT.tired = w(3, 'Tired') - 0.3;
CUT.lonely = w(3, 'Lonely') - 0.42;
CUT.alone = A[3].b + 0.55;
CUT.eaten = A[4].a - 0.12;
CUT.above = A[5].a - 0.06;
CUT.here = A[6].a - 0.16;
CUT.notHungry = w(6, "I'm") - 0.14;
CUT.giving = A[7].a - 0.12;
CUT.complete = A[8].a - 0.28;
CUT.hp = w(8, 'Plus') - 0.3;
CUT.thanks = A[9].a - 0.2;
CUT.why = A[10].a - 0.1;
CUT.dad = A[11].a - 0.1;
CUT.okay = w(11, 'Okay') - 0.2;
CUT.zip = A[11].b + 0.15;
CUT.much = A[12].a - 0.1;
CUT.half = w(12, 'You') - 0.15;
CUT.benji = A[12].b + 0.75;
CUT.rule = A[14].a - 0.06;
CUT.kind = w(14, 'Kindness') - 0.3;
CUT.xp = w(14, 'And', 1) - 0.2;
CUT.stare = A[14].b + 0.35;
{
  const ks = Object.keys(CUT);
  for (let i = 1; i < ks.length; i++) if (CUT[ks[i]] < CUT[ks[i - 1]] + 0.2) CUT[ks[i]] = CUT[ks[i - 1]] + 0.2;
}
// beats inside shots
const tArrive = w(0, 'Level') - 0.12;                 // Tank reaches the table end
const tStep0 = T0;                                    // walk start
const tBossBar = w(0, 'boss') - 0.1, tFight = w(0, 'fight');
const tRun = w(1, 'Run'), tFightW = w(1, 'Fight'), tHide = w(1, 'Hide');
const tDive = tRun + 0.35;                            // Benji dives under the table
const tSlam = A[2].a;                                 // "Lunch." — fist on the table
const tThree = w(3, 'Three'), tHungry = w(3, 'Hungry'), tTired = w(3, 'Tired'), tLonely = w(3, 'Lonely');
const tTiny = w(5, 'tiny'), tQ = w(5, 'question');
const tHere = w(6, 'Here'), tTake = w(6, 'thing') + 0.25;   // Tank takes the sandwich
const tGiving = w(7, 'GIVING');
const tComplete = w(8, 'complete'), tHealth = w(8, 'health');
const tBite = A[8].b + 0.25;
const tBubble = A[11].a + 0.2, tNobody = w(11, 'Nobody');
const tOkay = w(11, 'Okay'), tDont = w(11, "Don't");
const tPile0 = w(12, 'always') - 0.05;
const tSlide = w(12, 'half') - 0.2;
const tHeart = w1(12, 'day') + 0.12;
const tPop = CUT.benji + 0.12, tSpoon = CUT.benji + 0.45, tThanks = w(13, 'THANKS');
const tRuleCard = w(14, 'learned') - 0.25, tLine1 = w(14, 'Kindness') + 0.1, tYou = w(14, 'YOU', 1), tLine2 = w(14, 'YOU', 1) - 0.05;
const tXP = w(14, 'experience') - 0.15, tXPland = tXP + H.XP_FLY;

// ================================================================= the people
const HERO_Y = 1062, HERO_X = 760, BENJI_X = 540, TANK_Y = 1000;
const SANDWICH_S = 0.3;
// the hero sinks behind the table on "Hide under the table?" and comes back up when he "sees it"
const sink = (t) => 120 * ease.inOut(seg(t, tHide - 0.05, A[1].b + 0.2)) * (1 - ease.inOut(seg(t, CUT.saw + 0.4, CUT.saw + 1.4)));
// Benji: dives under at "Run?", peeks (glasses over the table edge) through the reveal, pops up at the end
function benjiY(t) {
  if (t < tDive) return HERO_Y;
  if (t < CUT.saw) return HERO_Y + 330 * ease.in(seg(t, tDive, tDive + 0.25));
  if (t < tPop) return HERO_Y + lerp(330, 140, ease.out(seg(t, CUT.saw + 1.2, CUT.saw + 2.2)));
  return HERO_Y + 140 * (1 - ease.outBack(seg(t, tPop, tPop + 0.35)));
}
// Tank: walks in along the lane from the right, stops at the table end
function tankX(t) { return lerp(2350, 1080, ease.out(seg(t, tStep0, tArrive))); }
function tankWalkPose(t) {
  const walking = t < tArrive - 0.05;
  if (walking) return { x: tankX(t), y: TANK_Y, s: 0.5, view: 'side', ...AC.walk((t - tStep0) * 8.5, 1.1), lean: -3, face: 'angry' };
  return { x: 1080, y: TANK_Y, s: 0.5, turn: -0.45, face: 'angry', ...boing(t, tArrive, 0.08, 0.5) };
}
const hand = (key, pose, side = 1) => CAST.handPos(key, pose, side);
function sandwichAt(pose, side = 1, s = SANDWICH_S, rot = 0) {
  const p = hand('you', pose, side);
  return X.sandwich({ x: p[0], y: p[1] - 16, s, rot });
}
const vis = (cam, x, pad = 300) => { const p = toScr(cam, x, 600); return p.x > -pad * p.z && p.x < 1920 + pad * p.z; };
function lunchLady(t, cam) { return vis(cam, 1730) ? actor('lunchLady', t, { ...E.CF.lunchLady, volume: false, turn: -0.3, face: t > CUT.saw && t < CUT.benji ? { name: 'sad', eyes: { look: [-0.7, 0] } } : 'happy' }) : ''; }
// kids queuing in the lunch line: they shrink back as Tank passes
function lineKids(t, cam) {
  if (t > CUT.saw) return '';
  let o = '';
  E.CF.line.forEach((p, i) => {
    if (!vis(cam, p.x)) return;
    const tx = tankX(t), near = clamp(1 - Math.abs(tx - p.x) / 420, 0, 1), passed = t > tStep0 && tx < p.x + 120;
    const scared = Math.max(near, passed ? 0.6 : 0);
    o += K.draw.kid(4 + i * 3, { x: p.x + (i % 2 ? 30 : -30) * scared, y: p.y - 20, s: p.s, turn: i % 2 ? 0.5 : -0.5, lean: (i % 2 ? 8 : -8) * scared, armL: 20 + 40 * scared, armR: 20 + 40 * scared, face: scared > 0.3 ? 'scared' : 'happy', shadow: true });
  });
  return o;
}
const lunchBag = (x, y, s = 0.32, open = false) => X.lunchBag({ x, y, s, open });
// the hero's lunch bag on the table (to his right)
const BAG = { x: 880, y: 760 };

// ================================================================= HUD
const XP0 = { level: 1, value: 0.12, text: '12 / 100' };
function xpOpts(t) {
  const u = seg(t, tXPland, tXPland + 0.7);
  const n = Math.round(lerp(12, 50, ease.out(u)));
  return { t, level: 1, value: 0.5, from: 0.12, roll: u, text: `${n} / 100`, gain: seg(t, tXPland, tXPland + 0.45) };
}
function hudTop(t, o = {}) {
  const quest = t > tTiny + 0.4 && t < tComplete + 0.2 ? { quest: 'HELP TANK?', questSub: 'REWARD: ???' } : {};
  return E.hudFrame(t, { clock: '12:05 PM', day: 'MON', ...quest, ...o });
}
// world → plates → frame → pop-ups → XP bar
function compose(t, world, o = {}) {
  let s = world + (o.fx || '') + (o.plates || '');
  if (o.hud !== false) s += hudTop(t, o.frame);
  s += o.pop || '';
  if (o.hud !== false) s += H.xpBar(xpOpts(t));
  return s + (o.top || '');
}
// Tank's plate: the boss version (intro) or the real one (reveal)
function bossPlate(t, cam, pose, o = {}) {
  const p = headAt(cam, 'tank', pose);
  return H.statPlate({ x: p.x, y: p.y, s: o.s ?? hudS(p.z, 0.85), t, k: o.k ?? 1, name: 'TANK', level: 80, boss: true, title: 'BOSS', bars: [], tags: [], glitch: o.glitch || 0, fade: o.fade || 0 });
}
const tagK = (t, t0) => seg(t, t0 - 0.05, t0 + 0.35);
function realPlate(t, cam, pose, o = {}) {
  const p = headAt(cam, 'tank', pose);
  const hp = o.hp || { label: 'HP', value: 3 };
  const tags = o.tags || [{ text: 'HUNGRY', k: tagK(t, tHungry) }, { text: 'TIRED', k: tagK(t, tTired) }, { text: 'LONELY', k: tagK(t, tLonely) }];
  return H.plateFor('tank', { x: p.x, y: p.y, s: o.s ?? hudS(p.z, 0.85), t, k: o.k ?? 1, bars: [hp], tags, fade: o.fade || 0 });
}
const tankHead = (cam, pose) => headAt(cam, 'tank', pose);

// standard cafeteria frame: hero + Benji at the front table, Tank in the lane, the lunch lady + line kids when in view
function cafWorld(t, cam, o = {}) {
  const NV = { volume: false };          // the vinyl volume filter costs 10–40 ms per character here: flat rigs throughout the cafeteria (consistent look, every frame < 250 ms)
  const heroP = { x: HERO_X, y: HERO_Y + sink(t), s: 0.5, turn: 0.35, ...NV, ...(o.hero || {}) };
  let table = '';
  if (o.benji !== false) table += actor('benji', t, { x: BENJI_X, y: benjiY(t), s: 0.5, turn: 0.35, ...NV, face: t < CUT.saw ? 'scared' : { name: 'shocked', eyes: { look: [0.8, -0.2] } }, ...(o.benjiPose || {}) }, { arms: !(o.benjiPose && o.benjiPose.armL !== undefined) });
  if (o.bag !== false) table += lunchBag(o.bagX ?? BAG.x, BAG.y, 0.3, o.bagOpen);
  table += actor('you', t, heroP, o.heroAct || {});
  if (o.sandwich !== false) table += sandwichAt(heroP, 1, SANDWICH_S, o.sandRot || 0);
  table += o.table || '';
  const tank = o.tank === false ? '' : actor('tank', t, { ...NV, ...(o.tank || tankWalkPose(t)) }, o.tankAct || {});
  return caf(t, cam, { quiet: o.quiet ?? quiet(t), table, lady: lunchLady(t, cam) + (o.lady || ''), lane: (o.kids === false ? '' : lineKids(t, cam)) + tank, over: o.over || '', back: o.back || '' });
}
function quiet(t) {
  if (t < CUT.saw) return 0;
  if (t < CUT.complete) return ease.inOut(seg(t, CUT.saw + 0.05, CUT.saw + 1.1));
  if (t < CUT.benji) return lerp(1, 0.55, seg(t, tComplete, tComplete + 1.2));
  return 0;
}
// hero arm presets (seated at the table): eat = sandwich at the chin, hold = at the shoulder, offer = out toward Tank
const ARMS = { eat: { armR: 150, bendR: -110 }, hold: { armR: 120, bendR: -62 }, offer: { armR: 130, bendR: -20 }, low: { armR: 96, bendR: -40 } };
const armMix = (a, b, u) => ({ armR: lerp(a.armR, b.armR, u), bendR: lerp(a.bendR, b.bendR, u) });

// ================================================================= SHOTS
// ---- 1. "Then Tank came" — low tracking shot on his boots stomping down the lane; the line kids shrink back
function shStomp(t) {
  const tx = tankX(t);
  const cam = shakeAll(camAt(tx - 160, 840, 1.75), t, [0, 1, 2, 3].map((i) => [tStep0 + 0.18 + i * (Math.PI / 8.5), 0.18, 7]));
  const tank = { x: tx, y: TANK_Y, s: 0.5, view: 'side', ...AC.walk((t - tStep0) * 8.5, 1.15), lean: -3, face: 'angry' };
  let o = cafWorld(t, cam, { tank, sandwich: false, bag: false });
  // dust puffs at each step
  let fx = '';
  for (let i = 0; i < 4; i++) { const ts = tStep0 + 0.18 + i * (Math.PI / 8.5); if (t > ts && t < ts + 0.5) { const p = toScr(cam, tankX(ts) + 40, TANK_Y); fx += K.C.dust(p.x, p.y, ts, t); } }
  return compose(t, o, { fx: fx + E.streaks(t, 760, 1000, 5, 3, '#FFFFFF', 0.12, 900, 1) }) + smash(t, CUT.stomp, 0.1, 0.5);
}
// ---- 2. "for your lunch." — the hero mid-bite freezes; the shadow falls over him; Benji trembles
function shGulp(t) {
  const cam = camKeys(t, [[CUT.gulp, camAt(700, 700, 1.75)], [CUT.lv, camAt(720, 700, 1.95)]], ease.out);
  const freeze = seg(t, w(0, 'lunch') - 0.1, w(0, 'lunch') + 0.1);
  const hero = { ...ARMS.eat, face: freeze > 0.5 ? { name: 'scared', eyes: { look: [0.9, -0.1], pupil: 0.7 }, fx: ['sweat'] } : { name: 'happy', eyes: { type: 'happy' }, mouth: 'O' }, turn: lerp(0, 0.4, freeze), ...boing(t, w(0, 'lunch'), 0.12, 0.5) };
  let o = cafWorld(t, cam, { hero, heroAct: { arms: false }, benjiPose: { face: { name: 'scared', fx: ['sweat'] }, headRot: 3 * Math.sin(t * 40) } });
  o += E.bigShadow(seg(t, CUT.gulp + 0.2, CUT.lv - 0.1), 2500, 1350);
  let fx = '';
  if (freeze > 0) fx += zoomLines(toScr(cam, HERO_X, 700).x, toScr(cam, HERO_X, 700).y, 0.5 * (1 - seg(t, w(0, 'lunch') + 0.3, w(0, 'lunch') + 0.8)) * freeze, t, '#FFFFFF', 18, 360);
  return compose(t, o, { fx });
}
// ---- 3. "Level eighty." — Tank looms at the table end; the red BOSS plate pops (vs the hero's "???")
function shLevel(t) {
  const cam = camKeys(t, [[CUT.lv, camAt(960, 590, 1.18)], [CUT.boss, camAt(990, 570, 1.34)]], ease.inOut);
  const tank = tankWalkPose(t);
  const hero = { ...ARMS.hold, face: { name: 'scared', eyes: { look: [0.9, -0.4] }, fx: ['sweat'] } };
  let o = cafWorld(t, cam, { hero, heroAct: { arms: false }, tank });
  const k = seg(t, w(0, 'Level') - 0.2, w(0, 'eighty') + 0.15);
  let plates = bossPlate(t, cam, tank, { k, s: 1.3 });
  const hp = headAt(cam, 'you', { x: HERO_X, y: HERO_Y + sink(t), s: 0.5 });
  plates += H.heroPlate({ x: hp.x, y: hp.y, s: 0.75, t, k: seg(t, CUT.lv + 0.1, CUT.lv + 0.6) });
  return compose(t, o, { plates }) + flashCol(t, w(0, 'eighty'), 0.2, '#FF3355', 0.25);
}
// ---- 4. "A boss fight." — fighting-game boss intro: freeze, red band, giant TANK, the boss bar drops in
function shBoss(t) {
  const tank = { x: 1080, y: TANK_Y, s: 0.5, turn: -0.2, armL: 40, armR: 40, bendL: 70, bendR: 70, face: { name: 'angry', mouth: 'teeth' }, volume: false };
  const cam = shakeAll(camKeys(t, [[CUT.boss, camAt(1000, 560, 1.75)], [CUT.menu, camAt(1000, 560, 1.95)]], ease.out), t, [[tFight, 0.4, 16]]);
  let o = cafWorld(t, cam, { tank, tankAct: { arms: false }, kids: false, sandwich: false, bag: false });
  o += dim(0.45, '#2A0410') + S.rect(0, 0, 1920, 1080, 0, { fill: '#FF3355', opacity: 0.12 });
  o += zoomLines(1000, 470, 0.6, t, '#FF6B80', 26, 520);
  let pop_ = E.bossCard({ k: seg(t, CUT.boss + 0.02, CUT.boss + 1.0), t, name: 'TANK', sub: 'THE LUNCH TAKER', level: 80 });
  pop_ += H.bossBar({ t, k: seg(t, tBossBar, tBossBar + 0.4), name: 'TANK', sub: 'LV 80 · BOSS FIGHT', value: 1, hit: seg(t, tFight, tFight + 0.4), y: 168 });
  pop_ += K.bang('BOSS FIGHT!', 960, 470, pop(t, tFight, 0.22), 120, -6, '#FF4D66');
  return compose(t, o, { pop: pop_ }) + letterbox(ease.out(seg(t, CUT.boss, CUT.boss + 0.2))) + smash(t, CUT.boss, 0.12, 0.7);
}
// ---- 5. "Run? Fight? Hide under the table?" — the choice menu; Benji is already under the table
function shMenu(t) {
  const cam = camKeys(t, [[CUT.menu, camAt(720, 700, 1.75, 600, 560)], [CUT.lunch, camAt(720, 720, 1.9, 600, 560)]], ease.inOut);
  const shiver = 4 * Math.sin(t * 46);
  const hero = { ...ARMS.hold, turn: 0.2 + 0.25 * Math.sin((t - CUT.menu) * 2.4), headRot: shiver * 0.5, face: { name: 'scared', mouth: 'wavy', eyes: { look: [0.8, -0.1] }, fx: ['sweat', 'sweat2'] } };
  let o = cafWorld(t, cam, { hero, heroAct: { arms: false, face: 'scared' } });
  const sel = t < tFightW - 0.05 ? 0 : t < tHide - 0.05 ? lerp(0, 1, ease.out(seg(t, tFightW - 0.05, tFightW + 0.12))) : lerp(1, 2, ease.out(seg(t, tHide - 0.05, tHide + 0.12)));
  const items = [
    { label: 'RUN', chip: 'ESCAPE: 0%', k: seg(t, tRun - 0.15, tRun + 0.2), ck: seg(t, tRun + 0.25, tRun + 0.5) },
    { label: 'FIGHT', chip: 'WIN: 0.01%', k: seg(t, tFightW - 0.15, tFightW + 0.2), ck: seg(t, tFightW + 0.25, tFightW + 0.5) },
    { label: 'HIDE UNDER TABLE', chip: 'TAKEN: BENJI', chipCol: '#FFD447', k: seg(t, tHide - 0.15, tHide + 0.2), ck: seg(t, w1(1, 'table') + 0.05, w1(1, 'table') + 0.35) },
  ];
  const pop_ = E.choiceMenu({ x: 1420, y: 280, s: 1.18, t, k: seg(t, CUT.menu, CUT.menu + 0.4), items, sel, theme: 'boss', w: 620, title: 'CHOOSE YOUR ACTION' });
  // Benji's dive (a "whoosh" puff)
  let fx = '';
  if (t > tDive && t < tDive + 0.4) { const p = toScr(cam, BENJI_X, 860); fx += K.C.burst(p.x, p.y, seg(t, tDive, tDive + 0.4), '#FFFFFF'); }
  return compose(t, o, { fx, pop: pop_ });
}
// ---- 6. "Lunch." — Tank's fist hits the table, the trays jump; low angle
function shLunch(t) {
  const cam = shakeAll(camKeys(t, [[CUT.lunch, camAt(1000, 610, 1.45)], [CUT.saw, camAt(1010, 600, 1.6)]], ease.out), t, [[tSlam + 0.05, 0.45, 18]]);
  const slam = ease.outBack(seg(t, tSlam - 0.2, tSlam + 0.05));
  const tank = { x: 1080, y: TANK_Y, s: 0.5, turn: -0.5, lean: -6 * slam, armL: lerp(20, 48, slam), bendL: lerp(0, -30, slam), armR: 14, face: { name: 'angry', mouth: 'line' } };
  const hop = 10 * bump(t, tSlam + 0.03, tSlam + 0.25);
  const hero = { ...ARMS.hold, face: { name: 'scared', eyes: { look: [0.9, -0.5], pupil: 0.6 }, fx: ['sweat'] }, lift: hop };
  let o = cafWorld(t, cam, { hero, heroAct: { arms: false }, tank, tankAct: { arms: false } });
  let fx = '';
  if (t > tSlam && t < tSlam + 0.5) { const p = toScr(cam, 905, 845); fx += K.C.burst(p.x, p.y, seg(t, tSlam, tSlam + 0.5), '#FFFFFF'); }
  fx += K.bang('THUD!', toScr(cam, 960, 760).x, toScr(cam, 960, 760).y, pop(t, tSlam + 0.02, 0.18) * (1 - seg(t, tSlam + 0.6, tSlam + 0.9)), 70, -10, '#FFFFFF');
  const plates = bossPlate(t, cam, tank, { s: 1.15 });
  return compose(t, o, { fx, plates });
}
// ---- 7. "But then you saw it." — extreme close-up on his eyes: the room goes quiet, a deep scan sweeps through
function shSaw(t) {
  const fy = 690 + sink(t);
  const cam = camKeys(t, [[CUT.saw, camAt(HERO_X, fy, 2.6)], [CUT.three, camAt(HERO_X + 10, fy - 10, 3.2)]], ease.inOut);
  const hero = { ...ARMS.low, volume: false, face: { name: 'amazed', eyes: { look: [0.85, -0.25], pupil: lerp(1, 1.25, seg(t, CUT.saw + 0.3, CUT.saw + 1.2)) } } };
  let o = cafWorld(t, cam, { hero, heroAct: { arms: false }, sandwich: false, tank: false, kids: false });
  // a cyan reticle locks on in his pupils
  const rk = seg(t, w(3, 'saw') - 0.1, w(3, 'saw') + 0.3);
  let fx = '';
  if (rk > 0) {
    const p = toScr(cam, HERO_X + 30, fy);
    const r = 150 * lerp(1.6, 1, ease.out(rk));
    fx += S.g(S.circle(0, 0, r, { fill: 'none', stroke: '#3BE8FF', 'stroke-width': 5, 'stroke-dasharray': '40 22', opacity: f(0.8 * rk) }) + S.path(`M${-r - 30} 0H${-r + 20}M${r - 20} 0H${r + 30}M0 ${-r - 30}V${-r + 20}M0 ${r - 20}V${r + 30}`, ln(5, '#3BE8FF', 0.8 * rk)), `translate(${f(p.x)} ${f(p.y)}) rotate(${f(t * 40)})`);
  }
  fx += E.scanSweep(seg(t, CUT.saw + 0.6, CUT.three + 0.1), 'DEEP SCAN...');
  return compose(t, o, { fx }) + softEdge(0.7);
}
// ---- 8. "Three health." — Tank medium close-up: the boss plate glitches away, the real one: HP 100 → 3, blinking red
function shThree(t) {
  const cam = camKeys(t, [[CUT.three, camAt(1080, 500, 1.7)], [CUT.hungry, camAt(1080, 490, 1.85)]], ease.inOut);
  const tank = { x: 1080, y: TANK_Y, s: 0.5, turn: -0.3, armL: 10, armR: 10, face: { name: 'sad', eyes: { upper: 0.35, look: [-0.3, 0.2] }, fx: ['eyebags'] }, volume: false };
  let o = cafWorld(t, cam, { tank, tankAct: { arms: false }, kids: false });
  const g = seg(t, tThree - 0.35, tThree - 0.05);
  let plates = t < tThree - 0.05 ? bossPlate(t, cam, tank, { s: 1.5, glitch: g }) : '';
  plates += realPlate(t, cam, tank, { s: 1.55, k: seg(t, tThree - 0.1, tThree + 0.35), hp: { label: 'HP', value: 3, from: 100, roll: seg(t, tThree, tThree + 0.55) } });
  let fx = '';
  if (t > tThree) fx += H.edgePulse(0, 0, 1920, 1080, 0.5 * (0.5 + 0.5 * Math.sin((t - tThree) * 7)), '#FF2E4E');
  return compose(t, o, { plates, fx }) + softEdge(0.5);
}
// ---- 9. "Hungry." — his stomach growls, a fist to the belly; HUNGRY slaps on
function shHungry(t) {
  const cam = camKeys(t, [[CUT.hungry, camAt(1080, 560, 1.45)], [CUT.tired, camAt(1070, 555, 1.55)]], ease.inOut);
  const press = ease.out(seg(t, tHungry - 0.1, tHungry + 0.3));
  const tank = { x: 1080, y: TANK_Y, s: 0.5, turn: -0.25, armL: lerp(10, 22, press), bendL: lerp(0, -112, press), armR: 10, headRot: 4 * press, face: { name: 'sad', eyes: { upper: 0.35, look: [0, 0.6] }, fx: ['eyebags'] } };
  let o = cafWorld(t, cam, { tank, tankAct: { arms: false }, kids: false });
  const belly = toScr(cam, 1080, 760);
  const fx = E.growl(belly.x, belly.y, t, bump(t, tHungry - 0.1, tHungry + 0.9), 1.7);
  const plates = realPlate(t, cam, tank, { s: 1.45 });
  return compose(t, o, { plates, fx }) + softEdge(0.5);
}
// ---- 10. "Tired." — close on his face: heavy lids, a yawn; TIRED slaps on
function shTired(t) {
  const cam = camKeys(t, [[CUT.tired, camAt(1080, 520, 2.2)], [CUT.lonely, camAt(1080, 515, 2.35)]], ease.inOut);
  const yawn = bump(t, tTired + 0.15, tTired + 1.0);
  const tank = { x: 1080, y: TANK_Y, s: 0.5, turn: -0.2, armL: 10, armR: 10, headRot: -5 * yawn, volume: false,
    face: yawn > 0.3 ? { name: 'sleepy', mouth: 'yawn', eyes: { type: 'closed' }, fx: ['eyebags'] } : { name: 'sad', eyes: { upper: 0.55 }, fx: ['eyebags'] } };
  let o = cafWorld(t, cam, { tank, tankAct: { arms: false }, kids: false });
  const plates = realPlate(t, cam, tank, { s: 1.5 });
  return compose(t, o, { plates }) + softEdge(0.6);
}
// ---- 11. "Lonely." — pull back: the whole room quiet and dim, Tank alone in a pool of light; LONELY slaps on
function shLonely(t) {
  const cam = camKeys(t, [[CUT.lonely, camAt(1080, 560, 1.35)], [CUT.alone - 0.1, { x: 220, y: -30, zoom: 0.84 }]], ease.inOut);
  const tank = { x: 1080, y: TANK_Y, s: 0.5, turn: -0.1, armL: 6, armR: 6, headRot: 4, face: { name: 'sad', eyes: { upper: 0.4, look: [0, 0.5] }, fx: ['eyebags'] } };
  let o = cafWorld(t, cam, { tank, tankAct: { arms: false }, hero: { ...ARMS.low, face: { name: 'sad', eyes: { look: [0.8, -0.2] } } }, heroAct: { arms: false } });
  const plates = realPlate(t, cam, tank, { s: lerp(1.4, 1.0, seg(t, CUT.lonely, CUT.alone)) });
  return compose(t, o, { plates }) + softEdge(0.8);
}
// ---- 12. (silence) — slow push on Tank's face; the plate fades; he glances at the sandwich and swallows
function shAlone(t) {
  const cam = camKeys(t, [[CUT.alone, camAt(1080, 500, 1.95)], [CUT.eaten, camAt(1075, 500, 2.25)]], ease.linear);
  const glance = seg(t, CUT.alone + 0.3, CUT.alone + 0.7);
  const tank = { x: 1080, y: TANK_Y, s: 0.5, turn: -0.15, armL: 8, armR: 8, headY: 4 * bump(t, CUT.alone + 0.85, CUT.alone + 1.15), volume: false, face: { name: 'sad', mouth: 'line', eyes: { upper: 0.4, look: [lerp(0, -0.75, glance), lerp(0.3, 0.6, glance)] }, fx: ['eyebags'] } };
  let o = cafWorld(t, cam, { tank, tankAct: { arms: false }, kids: false });
  const plates = realPlate(t, cam, tank, { s: 1.4, fade: seg(t, CUT.alone, CUT.alone + 0.8) });
  return compose(t, o, { plates }) + softEdge(0.8);
}
// ---- 13. "...He hasn't eaten all day." — the hero, soft; lowers the sandwich, looks up at Tank
function shEaten(t) {
  const cam = camKeys(t, [[CUT.eaten, camAt(HERO_X + 40, 700, 2.15, 840, 580)], [CUT.above, camAt(HERO_X + 40, 700, 2.4, 840, 580)]], ease.linear);
  const lower = ease.inOut(seg(t, A[4].a + 0.4, A[4].a + 1.3));
  const hero = { ...armMix(ARMS.hold, ARMS.low, lower), volume: false, face: { name: 'sad', eyes: { look: [0.75, -0.55] } } };
  let o = cafWorld(t, cam, { hero, heroAct: { arms: false, energy: 0.3 }, tank: false, kids: false });
  return compose(t, o) + softEdge(0.8);
}
// ---- 14. "And above his head... a tiny question mark." — tilt up into empty air; a TINY "?" pops; smash-zoom on it
function shAbove(t) {
  const cam = shakeAll(camKeys(t, [[CUT.above, camAt(1080, 500, 2.1)], [w(5, 'head') + 0.3, camAt(1080, 330, 2.1)], [tQ - 0.05, camAt(1080, 330, 2.1)], [tQ + 0.25, camAt(1080, 318, 4.0)], [CUT.here, camAt(1080, 316, 4.2)]], ease.inOut), t, [[tQ, 0.3, 10]]);
  const tank = { x: 1080, y: TANK_Y, s: 0.5, turn: -0.15, armL: 8, armR: 8, volume: false, face: { name: 'sad', mouth: 'line', eyes: { upper: 0.4, look: [-0.5, 0.5] }, fx: ['eyebags'] } };
  let o = cafWorld(t, cam, { tank, tankAct: { arms: false }, kids: false });
  const p = tankHead(cam, tank);
  const qk = seg(t, tTiny - 0.05, tTiny + 0.45);
  let plates = H.questMarker({ x: p.x, y: p.y, s: 0.45 * Math.pow(p.z / 2.1, 1.7), t, kind: '?', k: qk });
  let fx = '';
  if (t > tQ) fx += zoomLines(p.x, p.y - 60 * p.z / 2.1, 0.7 * (1 - seg(t, tQ + 0.3, tQ + 1.0)), t, '#FFE88A', 22, 300);
  if (t > tTiny - 0.05 && t < tTiny + 0.5) fx += H.sparkleBurst(p.x, p.y - 40, seg(t, tTiny - 0.05, tTiny + 0.5), 80, 6, '#FFF0A0', 3);
  return compose(t, o, { plates, fx }) + softEdge(0.6) + smash(t, tQ + 0.05, 0.1, 0.35);
}
// ---- 15. "Here. Take the whole thing." — he holds the sandwich out to Tank (SANDWICH +37 HP); Tank takes it
function shHere(t) {
  const cam = camKeys(t, [[CUT.here, camAt(930, 680, 1.48)], [CUT.notHungry, camAt(950, 670, 1.58)]], ease.inOut);
  const out = ease.outBack(seg(t, tHere - 0.15, tHere + 0.3));
  const took = t >= tTake;
  const hero = { ...armMix(ARMS.low, ARMS.offer, took ? 1 - seg(t, tTake, tTake + 0.4) : out), turn: 0.5, face: { name: 'happy', eyes: { look: [0.8, -0.5] } } };
  const reach = seg(t, tTake - 0.35, tTake);
  const tank = took ? { x: 1080, y: TANK_Y, s: 0.5, turn: -0.4, sandwich: true, face: { name: 'shocked', mouth: 'o', eyes: { look: [-0.5, 0.5] } } }
    : { x: 1080, y: TANK_Y, s: 0.5, turn: -0.4, armL: lerp(8, 56, reach), bendL: lerp(0, -20, reach), armR: 8, headRot: 6, face: { name: 'confused', eyes: { look: [-0.7, 0.6] }, fx: [] } };
  let o = cafWorld(t, cam, { hero, heroAct: { arms: false }, tank, tankAct: { arms: false }, sandwich: !took });
  let pop_ = '';
  if (!took) {
    const hp = hand('you', { x: HERO_X, y: HERO_Y, s: 0.5, turn: 0.5, ...hero }, 1);
    const p = toScr(cam, hp[0], hp[1] - 20);
    pop_ += H.tipFor('sandwich', { x: p.x, y: p.y, t, s: 1.0, side: 'up', dist: 250, dx: -30, k: seg(t, tHere + 0.15, tHere + 0.6) });
  }
  const p = tankHead(cam, tank);
  let plates = H.questMarker({ x: p.x, y: p.y, s: 0.5, t, kind: '?' });
  return compose(t, o, { plates, pop: pop_ });
}
// ---- 16. "I'm not that hungry." — brave smile... and his own stomach growls
function shNotHungry(t) {
  const cam = camKeys(t, [[CUT.notHungry, camAt(HERO_X, 700, 2.3)], [CUT.giving, camAt(HERO_X, 705, 2.45)]], ease.inOut);
  const tg = w(6, 'hungry');
  const hero = { ...ARMS.low, volume: false, turn: 0.3, face: t > tg + 0.1 ? { name: 'nervous', mouth: 'smile', fx: ['sweat'], eyes: { look: [-0.3, 0.5] } } : { name: 'happy', eyes: { look: [0.6, -0.4] } } };
  let o = cafWorld(t, cam, { hero, heroAct: { arms: false }, tank: false, kids: false, sandwich: false });
  const b = toScr(cam, HERO_X + 10, 812);
  const fx = E.growl(b.x, b.y, t, bump(t, tg - 0.05, tg + 1.0), 2.1);
  return compose(t, o, { fx });
}
// ---- 17. "...You're GIVING it to me?" — Tank, sandwich in hand, confused; push on "GIVING"
function shGiving(t) {
  const cam = shakeAll(camKeys(t, [[CUT.giving, camAt(1080, 590, 1.85)], [tGiving - 0.05, camAt(1080, 590, 1.9)], [tGiving + 0.15, camAt(1080, 570, 2.25)], [CUT.complete, camAt(1080, 568, 2.3)]], ease.out), t, [[tGiving, 0.25, 6]]);
  const tank = { x: 1080, y: TANK_Y, s: 0.5, turn: -0.3, sandwich: true, volume: false, face: { name: 'confused', eyes: { look: [-0.6, 0.2] }, fx: t > tGiving ? ['question'] : [] } };
  let o = cafWorld(t, cam, { tank, kids: false, sandwich: false });
  const p = tankHead(cam, tank);
  const plates = H.questMarker({ x: p.x, y: p.y, s: 0.6, t, kind: '?' });
  return compose(t, o, { plates });
}
// ---- 18. "Quest complete!" — the "?" bursts, QUEST COMPLETE! banner, the room warms up
function shComplete(t) {
  const cam = camKeys(t, [[CUT.complete, camAt(930, 560, 1.2)], [CUT.hp, camAt(940, 550, 1.28)]], ease.out);
  const tank = { x: 1080, y: TANK_Y, s: 0.5, turn: -0.35, sandwich: true, face: { name: 'shocked', eyes: { look: [-0.5, 0.3] } } };
  const hero = { ...ARMS.low, face: { name: 'happy', eyes: { look: [0.8, -0.5] } } };
  let o = cafWorld(t, cam, { tank, hero, heroAct: { arms: false }, sandwich: false });
  const p = tankHead(cam, tank);
  let plates = t < tComplete ? H.questMarker({ x: p.x, y: p.y, s: 0.5, t, kind: '?' }) : '';
  let fx = '';
  if (t >= tComplete) fx += H.sparkleBurst(p.x, p.y - 70, seg(t, tComplete, tComplete + 0.6), 170, 10, '#FFF0A0', 5) + S.circle(p.x, p.y - 70, 30 + 200 * ease.out(seg(t, tComplete, tComplete + 0.5)), { fill: 'none', stroke: '#FFD84A', 'stroke-width': f(14 * (1 - seg(t, tComplete, tComplete + 0.5))), opacity: f(1 - seg(t, tComplete, tComplete + 0.5)) });
  const pop_ = H.questComplete({ t, k: seg(t, tComplete - 0.5, tComplete + 0.8), reward: '+37 HP', y: 150, s: 0.8 });
  return compose(t, o, { plates, fx, pop: pop_ });
}
// ---- 19. "Plus thirty-seven health." — the plate is back: HP 3 → 40; the first bite; HUNGRY peels off
function shHP(t) {
  const cam = camKeys(t, [[CUT.hp, camAt(1060, 540, 1.55)], [tBite, camAt(1070, 530, 1.72)], [CUT.thanks, camAt(1075, 525, 1.8)]], ease.inOut);
  const bite = seg(t, tBite, tBite + 0.12) * 0.45;
  const chew = t > tBite + 0.15 && t < tBite + 1.6 ? Math.sin((t - tBite) * 16) : 0;
  const tank = { x: 1080, y: TANK_Y, s: 0.5, turn: -0.3, sandwich: true, bite, headY: 3 * chew, face: t > tBite ? { name: 'happy', mouth: chew > 0 ? 'smallSmile' : 'line', eyes: { type: 'closed' }, fx: ['blush'] } : { name: 'amazed', eyes: { look: [0, -0.9] } } };
  let o = cafWorld(t, cam, { tank, tankAct: { arms: false }, kids: false, sandwich: false, hero: { ...ARMS.low, face: 'happy' }, heroAct: { arms: false } });
  const hpU = seg(t, tHealth - 0.3, tHealth + 0.9);
  const peel = 1 - seg(t, tBite + 0.2, tBite + 0.6);
  const plates = realPlate(t, cam, tank, { s: 1.35, k: seg(t, CUT.hp, CUT.hp + 0.45), hp: { label: 'HP', value: 40, from: 3, roll: hpU }, tags: [{ text: 'HUNGRY', k: peel }, { text: 'TIRED', k: 1 }, { text: 'LONELY', k: 1 }] });
  const ph = tankHead(cam, tank);
  const sw = CAST.handPos('tank', tank, 1);
  const sp = toScr(cam, sw[0], sw[1] - 30);
  let fx = H.xpPop({ x: sp.x, y: sp.y, age: t - (tHealth - 1.2), text: '+37 HP', col: '#3DFF8F', to: [ph.x + 40, ph.y - 120] });
  if (t > tBite && t < tBite + 0.5) fx += K.bang('CHOMP!', sp.x + 90, sp.y - 60, pop(t, tBite, 0.15) * (1 - seg(t, tBite + 0.35, tBite + 0.5)), 56, 8, '#FFFFFF');
  return compose(t, o, { plates, fx });
}
// ---- 20. "Thanks... I guess." — shy: blush, eyes down, mouth full
function shThanks(t) {
  const cam = camKeys(t, [[CUT.thanks, camAt(1080, 510, 2.2)], [CUT.why, camAt(1080, 505, 2.35)]], ease.linear);
  const tank = { x: 1080, y: TANK_Y, s: 0.5, turn: -0.35, shy: true, sandwich: true, bite: 0.45, volume: false };
  let o = cafWorld(t, cam, { tank, kids: false, sandwich: false });
  return compose(t, o);
}
// ---- 21. "Tank? Why do you always take people's lunch?" — two-shot, careful; slow drift
function shWhy(t) {
  const cam = camKeys(t, [[CUT.why, camAt(880, 640, 1.6)], [CUT.dad, camAt(930, 630, 1.75)]], ease.inOut);
  const tank = { x: 1080, y: TANK_Y, s: 0.5, turn: -0.4, sandwich: true, bite: 0.45, face: { name: t > w(10, 'Why') ? 'sad' : 'neutral', eyes: { look: [-0.6, 0.3] } } };
  const lean = 6 * ease.inOut(seg(t, A[10].a, A[10].a + 0.5));
  const hero = { ...ARMS.low, turn: 0.5, lean: -lean, face: { name: 'happy', eyes: { look: [0.8, -0.5] } } };
  let o = cafWorld(t, cam, { tank, tankAct: { arms: false }, hero, heroAct: { arms: false }, sandwich: false });
  return compose(t, o);
}
// the night kitchen in the memory bubble (inner picture, centred on 0,0, about 600 × 420)
function memory(t, phase) {
  // a dark kitchen at night: window + moon (left), the fridge with Dad's note (right), the counter; phase 1: the empty lunch bag
  let g = S.rect(-400, -300, 800, 600, 0, { fill: '#2B3560' }) + S.rect(-400, 90, 800, 220, 0, { fill: '#1E2546' });
  g += S.rect(-300, -200, 170, 150, 8, ol('#101634', 6)) + S.circle(-240, -150, 28, { fill: '#FFF3C2' }) + S.circle(-228, -158, 24, { fill: '#101634' }) + S.path('M-215 -200 V-50 M-300 -125 H-130', ln(6));
  for (let i = 0; i < 4; i++) g += S.circle(-280 + i * 40, -90 + (i % 2) * 20, 3, { fill: '#FFF3C2' });
  g += S.rect(-400, 60, 470, 36, 6, ol('#7A6A9A', 5)) + S.rect(-400, 96, 470, 220, 0, { fill: '#4A4270' });
  g += S.rect(90, -250, 230, 470, 18, ol('#C9D3E8', 6)) + S.path('M90 -40 H320', ln(5)) + S.rect(110, -20, 14, 60, 5, { fill: '#8A93A6' }) + S.rect(110, -110, 14, 50, 5, { fill: '#8A93A6' });
  g += S.g(S.rect(-82, -66, 164, 132, 6, ol('#FFF5A8', 4)) + K.TF('WORKING', 0, -30, 24, '#3A3456') + K.TF('NIGHTS.', 0, -2, 24, '#3A3456') + K.TF('SORRY, BUD.', 0, 28, 19, '#3A3456') + K.TF('— DAD', 30, 54, 17, '#C0303A'), 'translate(205 -140) rotate(4)');
  g += S.circle(205, -204, 9, { fill: '#FF4B5C', stroke: LINE, 'stroke-width': 3 });
  g += S.circle(-40, -170, 40, ol('#FFFFFF', 5)) + S.path('M-40 -170 L-40 -198 M-40 -170 L-22 -160', ln(5)) + K.TF('7:00', -40, -112, 20, '#C9D3E8');
  if (phase === 1) {
    g += S.g(S.path('M-70 0 L70 0 L80 40 L-80 40 Z', ol('#C9A26A', 5)) + S.path('M-50 14 L50 14', ln(3, '#A8824A')), 'translate(-170 30)');
    for (let i = 0; i < 5; i++) g += S.circle(-250 + i * 26, 76 + (i % 2) * 4, 4, { fill: '#E8C88A' });
    g += K.T('?', -170, -10, 74, '#FFD84A', { stroke: LINE, 'stroke-width': 8, 'paint-order': 'stroke' });
  }
  return g;
}
const LINE = '#151515';
// ---- 22. "My dad works nights. Nobody makes me lunch." — Tank looks down; a memory bubble: the night kitchen, the note, the empty bag
function shDad(t) {
  const cam = camKeys(t, [[CUT.dad, camAt(1080, 520, 1.95, 600, 560)], [CUT.okay, camAt(1080, 520, 2.1, 600, 560)]], ease.linear);
  const tank = { x: 1080, y: TANK_Y, s: 0.5, turn: 0.15, shy: true, volume: false, face: { name: 'sad', eyes: { look: [0.3, 0.8], upper: 0.3 } } };
  let o = cafWorld(t, cam, { tank, kids: false, sandwich: false });
  const bk = seg(t, tBubble, tBubble + 0.45);
  const phase = t > tNobody - 0.15 ? 1 : 0;
  let pop_ = E.bubble(1340, 430, 720, 500, bk, memory(t, phase), [-0.9, 0.7]);
  return compose(t, o, { pop: pop_ }) + softEdge(0.7);
}
// ---- 23. "Okay? Don't tell anybody." — the gruff look is back; he leans in, eyes dart left and right
function shOkay(t) {
  const cam = shakeAll(camKeys(t, [[CUT.okay, camAt(1080, 500, 2.4)], [CUT.zip, camAt(1080, 495, 2.7)]], ease.out), t, [[tOkay, 0.25, 8]]);
  const dart = t > tDont ? Math.sign(Math.sin((t - tDont) * 7)) * 0.85 : -0.5;
  const tank = { x: 1080, y: TANK_Y, s: 0.5, turn: -0.3, lean: -5 * seg(t, tOkay - 0.1, tOkay + 0.2), volume: false, armL: 10, armR: 10,
    face: { name: 'angry', mouth: t > tDont ? 'line' : undefined, eyes: { look: [dart, -0.1] }, fx: ['blush'] } };
  let o = cafWorld(t, cam, { tank, tankAct: { arms: false }, kids: false, sandwich: false });
  return compose(t, o);
}
// ---- 24. (beat) the hero zips his lips and nods
function shZip(t) {
  const cam = camKeys(t, [[CUT.zip, camAt(HERO_X, 700, 2.25)], [CUT.much, camAt(HERO_X, 700, 2.35)]], ease.linear);
  const z = seg(t, CUT.zip + 0.15, CUT.zip + 0.75);
  const nod = 8 * bump(t, CUT.zip + 0.8, CUT.zip + 1.2);
  const hero = { armR: lerp(96, 150, bump(t, CUT.zip, CUT.zip + 1.0)), bendR: -120, armL: 10, turn: 0.15, headRot: nod * 0.3, headY: nod, volume: false, face: { name: 'happy', eyes: { type: z > 0.9 ? 'closed' : undefined, look: [0.6, -0.4] }, mouth: 'line' } };
  let o = cafWorld(t, cam, { hero, heroAct: { arms: false }, tank: false, kids: false, sandwich: false });
  const m = toScr(cam, HERO_X, 755);
  return compose(t, o, { fx: E.zipper(m.x, m.y, 150, z * (1 - seg(t, CUT.much - 0.3, CUT.much)), 1) });
}
// Mom's overpacked lunch: items pop out of the bag one by one and stack into a wobbly tower on top of it; on "half" the
// top half hops over into Tank's arms
const TOWER = ['sand', 'cup', 'sand', 'apple', 'juice', 'sand', 'cup', 'sand', 'note'];
const ITEM_H = { sand: 48, cup: 46, apple: 44, juice: 52, note: 40 };
const HALF = 4;                                        // the top four go to Tank
function towerItem(k, x, y, rot = 0) {                // (x, y) = bottom centre of the item
  if (k === 'sand') return X.sandwich({ x, y: y - 22, s: 0.27, rot });
  if (k === 'cup') return SH.cupcake(x, y, 0.4, undefined, { frost: '#FF9FC4', cherry: true });
  if (k === 'apple') return S.g(S.circle(0, -22, 22, ol('#E8333C', 4)) + S.path('M0 -44 q4 -12 10 -14', ln(4)) + S.ellipse(10, -48, 9, 5, ol('#4FAF5E', 3)), tf(x, y, 1, rot));
  if (k === 'juice') return S.g(S.rect(-18, -52, 36, 52, 5, ol('#FFB020', 4)) + S.rect(-18, -34, 36, 16, 0, { fill: '#FF7A3D' }) + S.path('M8 -52 l6 -14', ln(4, '#E8E8E8')), tf(x, y, 1, rot));
  return S.g(S.rect(-36, -40, 72, 40, 5, ol('#FFFFFF', 3)) + S.path(H.heartD(-16, -22, 9), { fill: '#FF5A7A' }) + K.TF('MOM', 10, -14, 15, '#3A3456'), tf(x, y, 1, rot));
}
const towerT = (i) => tPile0 + i * 0.17;
// tank: Tank's pose when he's holding the food (to put the top half in his hands); null = still on the tower
function towerSvg(t, tankHands = null) {
  let g = '', y = BAG.y + 8;                            // bag top
  const sway = Math.sin(t * 3.1) * clamp((t - tPile0) / 1.5, 0, 1);
  TOWER.forEach((k, i) => {
    const t0 = towerT(i), u = seg(t, t0, t0 + 0.28);
    const h = ITEM_H[k];
    if (u <= 0) { y -= h; return; }
    const hx = BAG.x + sway * i * 2.2, hy = y;
    let x = hx, yy = hy - 120 * Math.sin(u * Math.PI) * (1 - u) + 60 * (1 - u), rot = (1 - u) * 260 * (i % 2 ? 1 : -1) + sway * i * 0.8;
    if (tankHands && i >= TOWER.length - HALF) {
      const j = i - (TOWER.length - HALF), v = seg(t, tSlide + j * 0.08, tSlide + j * 0.08 + 0.4);
      const tx = tankHands[0] + (j % 2 ? 10 : -10), ty = tankHands[1] + 20 - j * 40;
      x = lerp(x, tx, ease.inOut(v)); yy = lerp(yy, ty, ease.inOut(v)) - 120 * Math.sin(v * Math.PI); rot = lerp(rot, (j % 2 ? 6 : -6), v);
    }
    g += towerItem(k, x, yy, rot);
    y -= h;
  });
  return g;
}
function towerTop(t) {
  let g = '', y = BAG.y + 8;
  const sway = Math.sin(t * 3.1);
  TOWER.slice(0, TOWER.length - HALF).forEach((k, i) => { g += towerItem(k, BAG.x + sway * i * 2.2, y, sway * i * 0.8); y -= ITEM_H[k]; });
  return g;
}
// the food in Tank's arms (top half of the tower)
function tankFood(pose) {
  const h = tankHands(pose);
  let g = '';
  TOWER.slice(TOWER.length - HALF).forEach((k, j) => { g += towerItem(k, h[0] + (j % 2 ? 10 : -10), h[1] + 20 - j * 40, j % 2 ? 6 : -6); });
  return g;
}
const tankHold = (extra = {}) => ({ x: 1080, y: TANK_Y, s: 0.5, turn: -0.35, armL: 22, armR: 22, bendL: -118, bendR: -118, ...extra });
function tankHands(pose) { const a = CAST.handPos('tank', pose, -1), b = CAST.handPos('tank', pose, 1); return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]; }
// ---- 25. "My mom always makes way too much." — he upends his lunch bag: sandwiches, cupcakes, an apple, juice, a note
function shMuch(t) {
  const cam = camKeys(t, [[CUT.much, camAt(800, 740, 1.7)], [CUT.half, camAt(790, 735, 1.85)]], ease.inOut);
  const tip = ease.out(seg(t, tPile0 - 0.3, tPile0));
  const hero = { armR: lerp(96, 14, tip), bendR: lerp(-40, 0, tip), armL: 14, turn: 0.15, face: { name: 'happy', eyes: { type: t > tPile0 + 1.2 ? 'happy' : undefined, look: [0.5, 0.4] }, fx: t > tPile0 + 1.2 ? ['blush'] : [] } };
  let o = cafWorld(t, cam, { hero, heroAct: { arms: false }, tank: false, kids: false, sandwich: false, bagOpen: true, over: towerSvg(t) });
  return compose(t, o);
}
// ---- 26. "You can have half. Every day." — he slides half of the pile to Tank; Tank's face softens; FRIENDSHIP +1
function shHalf(t) {
  const cam = camKeys(t, [[CUT.half, camAt(930, 640, 1.42)], [CUT.benji, camAt(950, 630, 1.55)]], ease.inOut);
    const soft = seg(t, w(12, 'Every') - 0.2, w(12, 'Every') + 0.4);
  const hold = ease.out(seg(t, tSlide - 0.3, tSlide));
  const tank = tankHold({ armL: lerp(10, 22, hold), armR: lerp(10, 22, hold), bendL: -118 * hold, bendR: -118 * hold, face: soft > 0.5 ? { name: 'happy', mouth: 'smallSmile', eyes: { look: [-0.6, 0.3] }, fx: ['blush'] } : { name: 'amazed', eyes: { look: [-0.5, 0.6] } } });
  const hero = { armR: lerp(96, 150, bump(t, tSlide - 0.2, tSlide + 0.6)), bendR: -60, turn: 0.45, face: { name: 'happy', eyes: { look: [0.8, -0.5] } } };
  let o = cafWorld(t, cam, { tank, tankAct: { arms: false }, hero, heroAct: { arms: false }, sandwich: false, bagOpen: true, over: towerSvg(t, tankHands(tank)) });
  const p = tankHead(cam, tank);
  const pop_ = H.friendshipPop({ x: p.x + 40, y: p.y - 60, age: t - tHeart, value: 1, s: 1.0 });
  return compose(t, o, { pop: pop_ });
}
// ---- 27. (beat) Tank walks off, looks back with a tiny wave; Benji pops up, drops his spoon: "Did Tank just say THANKS?!"
function shBenji(t) {
  const cam = shakeAll(camKeys(t, [[CUT.benji, camAt(820, 660, 1.3)], [tThanks - 0.08, camAt(800, 660, 1.42)], [tThanks + 0.12, camAt(BENJI_X + 30, 690, 2.3)], [CUT.rule, camAt(BENJI_X + 30, 690, 2.35)]], ease.out), t, [[tThanks, 0.3, 10]]);
  const walkU = seg(t, CUT.benji, CUT.benji + 2.4);
  const look = bump(t, CUT.benji + 0.55, CUT.benji + 1.5);
  const tx = lerp(1080, 1700, walkU);
  const tank = look > 0.2 ? tankHold({ x: tx, turn: -0.6, headRot: -6 * look, face: { name: 'happy', mouth: 'smallSmile', eyes: { look: [-0.8, 0] }, fx: ['blush'] } })
    : { x: tx, y: TANK_Y, s: 0.5, view: 'side', flip: true, ...AC.walk((t - CUT.benji) * 8, 1), armL: 34, bendL: 80, armR: 30, bendR: 80, face: 'happy' };
  const food = look > 0.2 ? tankFood(tank) : (() => { const h = CAST.handPos('tank', tank, -1); let g = ''; TOWER.slice(TOWER.length - HALF).forEach((k, j) => { g += towerItem(k, h[0] + 10, h[1] + 10 - j * 40, 0); }); return g; })();
  // Benji holds a spoon, then drops it
  const bp = { x: BENJI_X, y: benjiY(t), s: 0.5, turn: 0.4, armR: 110, bendR: -60, armL: 20, face: t > tThanks - 0.1 ? { name: 'amazed', mouth: 'O' } : { name: 'shocked', eyes: { look: [0.9, -0.2] } } };
  const sp = hand('benji', bp, 1);
  let spoon = '';
  const fall = seg(t, tSpoon, tSpoon + 0.35);
  const sx = sp[0] + 20 * fall, sy = lerp(sp[1], 850, ease.in(fall));
  spoon = S.g(S.path('M0 0 L0 -70', ln(9, '#C9D0DC')) + S.ellipse(0, -84, 14, 20, ol('#DDE3EC', 4)), tf(sx, sy, 0.8, lerp(-20, 160, fall)));
  let o = cafWorld(t, cam, { tank, tankAct: { arms: false }, benjiPose: bp, hero: { ...ARMS.low, turn: 0.3, face: { name: 'happy', eyes: { look: [0.8, -0.2] } } }, heroAct: { arms: false }, sandwich: false, bagOpen: true, over: spoon + towerTop(t) + food });
  let fx = '';
  if (t > tSpoon + 0.35 && t < tSpoon + 0.7) { const p = toScr(cam, sx, 850); fx += K.bang('clink', p.x + 40, p.y - 40, pop(t, tSpoon + 0.35, 0.12), 40, -8, '#FFFFFF'); }
  if (t > tThanks) fx += zoomLines(toScr(cam, BENJI_X, 690).x, toScr(cam, BENJI_X, 690).y, 0.7 * (1 - seg(t, tThanks + 0.4, tThanks + 1.1)), t);
  return compose(t, o, { fx }) + smash(t, tThanks + 0.04, 0.1, 0.45);
}
// THE RULE card (screen space, persists over the last three shots)
function rule(t) {
  return E.ruleCard({ x: 1350, y: 210, s: 0.92, t, k: seg(t, tRuleCard, tRuleCard + 0.5), out: seg(t, CUT.stare + 0.9, CUT.stare + 1.3),
    lines: [{ text: 'KINDNESS = +HP (THEM)', k: seg(t, tLine1, tLine1 + 0.4), icon: 'heart', col: '#9BFFC4', pulse: seg(t, tLine1, tLine1 + 0.4) },
      { text: '...AND +XP (YOU!)', k: seg(t, tLine2, tLine2 + 0.4), icon: 'star', col: '#FFD84A', pulse: seg(t, tLine2, tLine2 + 0.4) }] });
}
// ---- 28. "And that's when you learned the rule." — the hero, thinking; THE RULE card unfolds
function shRule(t) {
  const cam = camKeys(t, [[CUT.rule, camAt(HERO_X, 700, 2.0, 560, 600)], [CUT.kind, camAt(HERO_X, 700, 2.15, 560, 600)]], ease.inOut);
  const hero = { ...ARMS.low, turn: 0.2, volume: false, face: { name: t > tRuleCard + 0.3 ? 'amazed' : 'confused', eyes: { look: [0.8, -0.7] } } };
  let o = cafWorld(t, cam, { hero, heroAct: { arms: false }, tank: false, kids: false, sandwich: false, bagOpen: true, over: towerTop(t) });
  return compose(t, o, { pop: rule(t) });
}
// ---- 29. "Kindness gives people health." — Tank walks off toward the doors, the HP 40 bar glowing green
function shKind(t) {
  const u = seg(t, CUT.kind - 2.0, CUT.xp + 0.5);
  const tx = lerp(1500, 2450, u);
  const cam = camAt(tx - 120, 600, 1.15, 560, 560);
  const tank = { x: tx, y: TANK_Y, s: 0.5, view: 'back', ...AC.walkFront((t - CUT.kind) * 7, 1), face: 'happy' };
  let o = cafWorld(t, cam, { tank, tankAct: { arms: false }, quiet: 0 });
  const plates = realPlate(t, cam, tank, { s: 0.85, hp: { label: 'HP', value: 40, bump: bump(t, tLine1, tLine1 + 0.5) }, tags: [{ text: 'TIRED', k: 1 }, { text: 'LONELY', k: 1 }] });
  const p = tankHead(cam, tank);
  let fx = H.glow(p.x, p.y - 90, 240, 120, '#3DFF8F', 0.5 * bump(t, tLine1 - 0.1, tLine1 + 1.2));
  return compose(t, o, { plates, fx, pop: rule(t) });
}
// ---- 30. "And it gives YOU experience." — he points at himself; star eyes; +38 XP flies into the bar (12 → 50)
function shXP(t) {
  const cam = camKeys(t, [[CUT.xp, camAt(HERO_X, 700, 2.0, 560, 600)], [CUT.stare, camAt(HERO_X, 700, 2.2, 560, 600)]], ease.inOut);
  const me = ease.outBack(seg(t, tYou - 0.25, tYou + 0.05));
  const star = t > tXP;
  const hero = { armR: lerp(96, 22, me), bendR: lerp(-40, -128, me), armL: 10, turn: 0.1, volume: false, ...boing(t, tXP, 0.12, 0.6),
    face: star ? { name: 'excited', eyes: { type: 'star' } } : { name: 'amazed', eyes: { look: [0.2, -0.2] } } };
  let o = cafWorld(t, cam, { hero, heroAct: { arms: false }, tank: false, kids: false, sandwich: false, bagOpen: true, over: towerTop(t) });
  const c = toScr(cam, HERO_X, 760);
  const pop_ = rule(t) + H.xpPop({ x: c.x + 300, y: c.y - 260, age: t - tXP, amount: 38, to: H.xpBarAt({ value: 0.12, text: '12 / 100' }) });
  return compose(t, o, { pop: pop_ });
}
// ---- 31. (beat) he looks down at his XP bar — 50 / 100 — rubs his hands; Benji stares at him
function shStare(t) {
  const cam = camKeys(t, [[CUT.stare, camAt(700, 720, 1.55)], [END, camAt(720, 735, 1.75)]], ease.inOut);
  const rub = t > CUT.stare + 0.9 ? Math.sin((t - CUT.stare) * 18) : 0;
  const hero = { armL: 24 + 4 * rub, armR: 24 - 4 * rub, bendL: -122, bendR: -122, turn: 0.05, face: { name: 'excited', eyes: { type: t < CUT.stare + 0.8 ? 'star' : undefined, look: [0, 0.9] }, mouth: 'grin' } };
  const bp = { face: { name: 'confused', eyes: { look: [0.9, 0] }, fx: ['question'] } };
  let o = cafWorld(t, cam, { hero, heroAct: { arms: false }, benjiPose: bp, tank: false, sandwich: false, bagOpen: true, over: towerTop(t) });
  const fx = H.glow(960, 1050, 820, 70, '#FFD84A', 0.6 * bump(t, CUT.stare + 0.3, CUT.stare + 1.6));
  return compose(t, o, { fx, pop: rule(t) }) + whip(t, END, 1, 0.1);
}
const camKeys = K.camKeys;

// ================================================================= dispatch
const SHOTS = [
  [CUT.stomp, shStomp], [CUT.gulp, shGulp], [CUT.lv, shLevel], [CUT.boss, shBoss], [CUT.menu, shMenu], [CUT.lunch, shLunch], [CUT.saw, shSaw],
  [CUT.three, shThree], [CUT.hungry, shHungry], [CUT.tired, shTired], [CUT.lonely, shLonely], [CUT.alone, shAlone], [CUT.eaten, shEaten],
  [CUT.above, shAbove], [CUT.here, shHere], [CUT.notHungry, shNotHungry], [CUT.giving, shGiving], [CUT.complete, shComplete], [CUT.hp, shHP],
  [CUT.thanks, shThanks], [CUT.why, shWhy], [CUT.dad, shDad], [CUT.okay, shOkay], [CUT.zip, shZip], [CUT.much, shMuch], [CUT.half, shHalf],
  [CUT.benji, shBenji], [CUT.rule, shRule], [CUT.kind, shKind], [CUT.xp, shXP], [CUT.stare, shStare],
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
  if (t >= CUT.boss && t < CUT.menu) return { grade: 'warm', vignette: 0.9 };
  if (t >= CUT.saw && t < CUT.complete) return { grade: null, vignette: 1 };
  if (t >= CUT.complete && t < CUT.benji) return { grade: 'warm', vignette: 0.8 };
  return { grade: 'warm', vignette: 0.45 };
}
const BEATS = {
  T0, END, tArrive, tStep0, tBossBar, tFight, tRun, tFightW, tHide, tDive, tSlam, tThree, tHungry, tTired, tLonely, tTiny, tQ, tHere, tTake, tGiving,
  tComplete, tHealth, tBite, tBubble, tNobody, tOkay, tDont, tPile0, tSlide, tHeart, tPop, tSpoon, tThanks, tRuleCard, tLine1, tLine2, tYou, tXP, tXPland,
  steps: [0, 1, 2, 3, 4, 5, 6, 7].map((i) => tStep0 + 0.18 + i * (Math.PI / 8.5)).filter((x) => x < tArrive),
  pile: TOWER.map((_, i) => towerT(i) + 0.28),
};
// shared with s06 (the cafeteria continues into SC 06)
const ENV = { cafWorld, towerTop, towerItem, ARMS, HERO_X, HERO_Y, BENJI_X, TANK_Y, BAG, xpOpts };
module.exports = { scene, look, SHOTS, CUT, BEATS, ENV };
