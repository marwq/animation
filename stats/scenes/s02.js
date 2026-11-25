// SC 02 · MEET EVERYONE (43.71 … 165.10). After SC 01's rewind collapses to a point, an iris opens on the hero gaming in his
// morning bedroom (monitor POV) → SCRAPBOOK freeze "YOU"; the camera dives through the monitor into DRAGON PEAK, the hero's
// game, where everything makes sense: enemies line up with level badges (slime LV 1 → goblin LV 50), a chest spits items with
// stat tooltips, the LV 90 at the summit; "Level fifty goblin? Easy." (one slash, poof, coins — streamer facecam), "Level
// ninety dragon?" (the dragon rises, boss bar) "Run." (fire breath, the knight flees); back in the room: phew. "But real
// life?" — the monitor dies, whip to the morning kitchen chaos; thought bubbles nobody can read. The family, each with a
// scrapbook freeze-frame intro (NO stat HUD — the update hasn't happened): Mom juggling pan + phone ("runs a bakery"), the
// works-all-day triptych, the smile; "Breakfast is ready! … Probably." (smoking pan); the 300-cupcake pre-dawn time-lapse; she
// still asks about your day. Grandpa Lou + the MON/TUE/WED rerun gag, "1979!" (retro title), the sepia flashback (young Lou,
// arm-wrestling finals), the flex. Max — little brother, five, a dino-suit TORNADO (cereal everywhere), "I'm a T-rex! RAWR!".
// Biscuit, very good boy (rosette), at his desk ("GOOD BOY · ON DUTY"). "Did I tell you about seventy-nine?" / "Every day,
// Grandpa. Every. Single. Day." (three smash-zooms). School: Benji (freeze), the handshake, dodgeball to the face, 2 + 2 = 22,
// the shoelace trip, "I'm okay! … I meant to do that!", the nicest person. The cafeteria: Tank's shadow, the freeze + his
// redacted FILE ("BIG" stamp), the growling stomach, "Lunch. Now.", the turkey sandwich hand-over, Tank leaves; "One day…
// probably not today"; night, the hero at his game: "If only I knew how strong everyone REALLY was." → "Be careful what you
// wish for." — the monitor flickers, push-in; hand-off to SC 03 (the "Update available" window, same night bedroom).
'use strict';

const K = require('./kit');
const G = require('./gameui');
const SH = require('./sets_home');
const ST = require('./sets_town');
const X = require('../rig/extras');
const CAST = require('../rig/cast');
const AC = require('./acting');
const E = require('./s02_env');
const { S, f, clamp, lerp, ease, seg, bump, hash, ol, ln, T, TF, camKeys, view, actor } = K;
const { L } = K.V;
const { tf, TS, TFS, pop, scAt, op, shakeAll, boing, clipTo, dim, whip, smash, zoomLines, streaks, iris, rewindTail, crtOff,
  snapshot, snapPoint, nameCard, doodleArrow, doodleNote, thought, controller, facecam, tornado, youngLou, oldFilm, tankFile } = E;
const GM = E.GAME, GW = GM.GW;
const camAt = ST.camAt;

// ================================================================= lines + cut list (all from the voice)
const A = Array.from({ length: 10 }, (_, i) => L('02a.' + i));
const B = Array.from({ length: 13 }, (_, i) => L('02b.' + i));
const T0 = K.V.scene('SC 02').start, END = K.V.scene('SC 03').start;     // == main.js RANGES for SC 02
const wa = (i, word, n = 0) => A[i].word(word, n).t0, wa1 = (i, word, n = 0) => A[i].word(word, n).t1;
const wb = (i, word, n = 0) => B[i].word(word, n).t0, wb1 = (i, word, n = 0) => B[i].word(word, n).t1;
const wi = (l, i) => l.words[i][1];          // i-th word start (for repeated words)

const CUT = {};
CUT.open = T0;
CUT.dive = wa(0, 'Because') - 0.1;
CUT.meadow = wa(0, 'everything') - 0.12;
CUT.enemy = A[1].a - 0.08;
CUT.item = wi(A[1], 5) - 0.12;                // "Every" item
CUT.strong = wa(1, 'You') - 0.16;
CUT.goblin = A[2].a - 0.12;
CUT.dragon = wi(A[2], 4) - 0.28;              // "Level" ninety
CUT.run = wa(2, 'Run') - 0.12;
CUT.phew = A[2].b + 0.42;
CUT.real = A[3].a - 0.1;
CUT.kitchen = wi(A[3], 3) - 0.12;             // "Real" life has no numbers
CUT.think = wa(3, 'never') - 0.3;
CUT.mom = A[4].a - 0.06;
CUT.works = wi(A[4], 6) - 0.1;                // "She" works all day
CUT.smile = wa(4, 'and') - 0.12;
CUT.morning = A[5].a - 0.3;
CUT.prob = wa(5, 'Probably') - 0.4;
CUT.cupcakes = A[6].a - 0.06;
CUT.asked = wa(6, 'And') - 0.22;
CUT.lou = A[7].a - 0.06;
CUT.same = wa(7, 'Every') - 0.1;
CUT.g79 = A[8].a - 0.2;
CUT.finals = wa(8, 'The') - 0.12;
CUT.legend = wa(8, 'I') - 0.16;
CUT.max = A[9].a - 0.06;
CUT.five = wi(A[9], 5) - 0.12;                // "He's" five
CUT.tornado = wi(A[9], 7) - 0.14;             // "He's" basically a tornado
CUT.trex = B[0].a - 0.3;
CUT.rawr = wb(0, 'RAWR') - 0.14;
CUT.biscuit = B[1].a - 0.06;
CUT.good = wi(B[1], 2) - 0.12;                // "Biscuit" is a very good boy
CUT.job = wb(1, "That's") - 0.1;
CUT.again = B[2].a - 0.12;
CUT.everyday = B[3].a - 0.06;
CUT.e1 = wi(B[3], 3) - 0.08;                  // "Every." Single. Day.
CUT.e2 = wb(3, 'Single') - 0.06;
CUT.e3 = wi(B[3], 5) - 0.06;                  // "Day."
CUT.school = B[4].a - 0.14;
CUT.sports = wi(B[4], 7) - 0.16;              // "He's" bad at sports
CUT.math = wi(B[4], 11) - 0.12;               // "Bad" at math
CUT.laces = wi(B[4], 14) - 0.3;               // "Bad" at shoelaces
CUT.okay = B[5].a - 0.22;
CUT.meant = wi(B[5], 2) - 0.14;               // "I'm" okay! I meant to do that!
CUT.nice = B[6].a - 0.36;
CUT.tank = B[7].a - 0.1;
CUT.file = wb(7, 'Nobody') - 0.12;
CUT.big = wb(7, 'Except') - 0.1;
CUT.hungry = wb(7, 'And', 1) - 0.08;
CUT.lunch = B[8].a - 0.1;
CUT.now = wb(8, 'Now') - 0.08;
CUT.sure = B[9].a - 0.1;
CUT.turkey = wb(9, 'Enjoy') - 0.16;
CUT.walk = B[9].b + 0.12;
CUT.oneday = B[10].a - 0.14;
CUT.notToday = wb(10, 'Probably') - 0.22;
CUT.night = B[11].a - 0.32;
CUT.careful = B[12].a - 0.08;
{
  const ks = Object.keys(CUT);
  for (let i = 1; i < ks.length; i++) if (CUT[ks[i]] < CUT[ks[i - 1]] + 0.2) CUT[ks[i]] = CUT[ks[i - 1]] + 0.2;
}
// beats inside shots
const tYou = wa(0, 'you');                     // freeze "This is you."
const tYouOut = wa(0, 'games') - 0.05;         // unfreeze on "games."
const tE = [0, 1, 2, 4].map((i) => wi(A[1], i));          // Every enemy has a level
const tI = [5, 6, 7, 8].map((i) => wi(A[1], i));          // Every item has stats
const tStrong = wa(1, 'strong');
const tEasy = wa(2, 'Easy');
const tDragon = wa(2, 'dragon');
const tRun = wa(2, 'Run');
const tMomF = wa(4, 'Mom'), tMomOut = CUT.works - 0.02, tBakery = wa(4, 'bakery');
const tSmiles = wa(4, 'smiles');
const tProb = wa(5, 'Probably');
const tSunrise = wa(6, 'sunrise');
const tLouF = wa(7, 'Grandpa'), tLouOut = CUT.same - 0.02;
const t79 = wa(8, 'seventy-nine'), tLegend = wa(8, 'legend');
const tMaxF = wa(9, 'Max'), tMaxOut = CUT.five - 0.02, tBro = wa(9, 'brother');
const tSpin = wa(9, 'tornado') - 0.2;
const tRawr = wb(0, 'RAWR');
const tBisF = wb(1, 'Biscuit'), tGoodBoy = wb(1, 'good');
const tBenF = wb(4, 'Benji'), tBenOut = wb(4, 'friend') + 0.25, tBest = wb(4, 'best');
const tSports = wb(4, 'sports'), tMath = wb(4, 'math'), tLace = wb(4, 'shoelaces');
const tThat = wb(5, 'that');
const tTankF = wb(7, 'Tank'), tBig = wb(7, 'big'), tHungry = wb(7, 'hungry');
const tReally = wb(11, 'REALLY');
const tWish = wb(12, 'wish');

// ================================================================= shared helpers
const SPK = SH.SPOTS.kitchen, SPB = SH.SPOTS.bedroom;
const SIZE = { you: 1, mom: 1.04, grandpa: 1.1, max: 0.56, benji: 0.98, tank: 1.35 };
const seat = (name, t, spot, extra = {}, act = {}) => actor(name, t, SH.seatPose(SPK.seats[spot], SIZE[name], extra), act);
const seatPos = (name, spot) => SH.seatPose(SPK.seats[spot], SIZE[name], {});
const headTopOf = (name, pose) => CAST.headTop(name, pose);
// world point → screen through a sets_home-style cam (k 1)
const scr = (cam, x, y) => { const p = SH.toScreen(cam, { x, y }); return [p.x, p.y]; };
// kitchen shot. o: { set (kitchen opts), seated svg, chars svg (standing, after the table front), over svg (world, after light) }
function kitchenShot(t, cam, o = {}) {
  const Ly = SH.kitchen.layers(t, { time: 'morning', ...(o.set || {}) });
  let out = view(cam, Ly.bg, 0.8) + view(cam, Ly.mid, 1);
  if (o.behind) out += view(cam, o.behind, 1);
  if (o.seated) out += view(cam, o.seated, 1);
  out += view(cam, Ly.front, 1);
  if (o.chars) out += view(cam, o.chars, 1);
  out += view(cam, Ly.fg, 1.2) + view(cam, Ly.light, 1);
  if (o.over) out += view(cam, o.over, 1);
  return out;
}
function bedroomShot(t, cam, o = {}) {
  const Ly = SH.bedroom.layers(t, { time: 'morning', ...(o.set || {}) });
  let out = view(cam, Ly.bg, 0.8) + view(cam, Ly.mid, 1);
  if (o.behind) out += view(cam, o.behind, 1);
  out += view(cam, Ly.front, 1);
  if (o.chars) out += view(cam, o.chars, 1);
  out += view(cam, Ly.fg, 1.2) + view(cam, Ly.light, 1);
  if (o.over) out += view(cam, o.over, 1);
  return out;
}
// freeze helper: inside [a, b] time stands still at a (for the characters + camera), released after b
const frz = (t, a, b) => (t >= a && t < b ? a : t);
// snapshot in/out factor for a freeze [a, b] (b = release)
const snapK = (t, a, b) => (t < a ? 0 : t < b ? seg(t, a, a + 0.32) : 1 - seg(t, b, b + 0.14));
// the scrapbook intro: inner = the frozen frame; card + arrow at the target (face) point
function intro(t, inner, a, b, card, target, o = {}) {
  const k = snapK(t, a, b);
  if (k <= 0) return inner;
  const so = { rot: o.rot ?? -1.8, scale: o.scale ?? 0.84, cy: 515, dx: o.dx || 0 };
  let out = snapshot(inner, k, so);
  const ck = t < b ? seg(t, a + 0.08, a + 0.5) : 1, co = t < b ? 0 : seg(t, b, b + 0.12);
  out += nameCard({ ...card, k: ck, out: co, t });
  if (target && t < b) {
    const p = snapPoint(target[0], target[1], k, so);
    const ax = card.x + (o.ax ?? (p[0] > card.x ? 140 : -140)), ay = card.y + (o.ay ?? 70);
    out += doodleArrow(ax, ay, p[0] + (o.tx || 0), p[1] + (o.ty || 0), seg(t, a + 0.35, a + 0.75), { bend: o.bend ?? 0.25 });
  }
  return out;
}
const HERO_COL = '#D8262E';
// the hero facing the monitor, seen FROM the monitor (POV): the room behind him, the gaming chair, the controller, screen light
function chairBack(x, y, s = 1) {
  let c = S.path('M-250 520 L-270 -20 Q-270 -150 -150 -170 L150 -170 Q270 -150 270 -20 L250 520 Z', ol('#5A3E9A', 8));
  c += S.path('M-170 -110 Q0 -150 170 -110 L190 470 L-190 470 Z', { fill: '#7A5AC8' }) + S.path('M-120 -130 V470 M120 -130 V470', ln(8, '#4A2E86', 0.7));
  c += S.rect(-120, -290, 240, 130, 50, ol('#5A3E9A', 8)) + S.rect(-80, -260, 160, 70, 30, { fill: '#7A5AC8' });
  return S.g(c, tf(x, y, s));
}
function deskEdge(t, night) {
  let c = S.rect(-40, 905, 2000, 220, 0, ol(night ? '#1C1E2A' : '#2C2E3A', 7)) + S.rect(-40, 905, 2000, 14, 0, { fill: '#454860' });
  const cols = ['#FF4FB8', '#B06BFF', '#34C3FF', '#3BD16F', '#FFD21F'];
  for (let i = 0; i < 12; i++) c += S.rect(i * 170 - 20, 924, 160, 8, 4, { fill: cols[(i + Math.floor(t * 4)) % 5], opacity: 0.9 });
  // keyboard edge + mouse
  c += S.path('M280 1080 L340 960 L1120 960 L1180 1080 Z', ol('#20232E', 6)) + S.path('M1460 1080 Q1460 980 1530 976 Q1600 980 1600 1080 Z', ol('#20232E', 6));
  return c;
}
// POV: o = { time, light (colour), lk (light strength), pose (extra), act, press, rot, night }
function povShot(t, cam, o = {}) {
  const night = o.time === 'night';
  const bgCam = { x: -380, y: -150, zoom: 1.5 };
  const Ly = SH.bedroom.layers(t, { time: o.time || 'morning', pc: false, glow: 0, chair: false, sock: false });
  let w = view(bgCam, Ly.bg, 0.8) + view(bgCam, Ly.mid, 1) + view(bgCam, Ly.front, 1) + view(bgCam, Ly.light, 1);
  w += dim(night ? 0.5 : 0.2, '#0A1030');
  let c = chairBack(960, 640, 1);
  const pose = { x: 960, y: 1065, s: 0.9, volume: false, armL: 24, armR: 24, bendL: -118, bendR: -118, ...(o.pose || {}) };
  c += actor('you', t, pose, { arms: false, ...(o.act || {}) });
  const hl = CAST.handPos('you', pose, -1), hr = CAST.handPos('you', pose, 1);
  const one = (pose.armR || 0) > 90;
  c += one ? controller(hr[0] + 20, hr[1] - 30, 0.9, 18, t, false) : controller((hl[0] + hr[0]) / 2, (hl[1] + hr[1]) / 2 + 14, 1.05, o.ctrlRot || 0, t, o.press);
  c += deskEdge(t, night);
  let out = w + view(cam, c, 1);
  const flick = 0.05 * Math.sin(t * 13) + 0.04 * Math.sin(t * 29);
  out += S.rect(0, 0, 1920, 1080, 0, { fill: o.light || '#5AC8FF', opacity: f(clamp((o.lk ?? 0.12) + flick, 0, 0.6)) });
  return out;
}
const POV_FACE = [960, 1065 - 951 * 0.9 + 175];

// ================================================================= the game (DRAGON PEAK) helpers
function gameFrame(t, cam, chars = '', o = {}) {
  const Lw = GM.gameWorld(t, cam, o);
  let out = Lw.sky + Lw.far;
  if (o.behindHills) out += o.behindHills;
  out += Lw.hills + Lw.ground + view(cam, chars, 1) + Lw.fg;
  if (o.over) out += view(cam, o.over, 1);
  return out;
}
// the hero's knight avatar (no lip-sync: the real hero talks in the facecam)
function knight(t, p, face = 'determined') {
  const pose = { s: 0.5, ...p };
  const fo = typeof face === 'string' ? { name: face, mouth: face === 'scream' ? 'scream' : face === 'shocked' ? 'O' : face === 'smug' ? 'smirk' : 'line' } : face;
  return K.draw.you({ shade: true, shadow: true, ...pose, face: fo, props: [...GM.knightProps(pose), ...(p.props || [])] });
}
// facecam inner (400 x 300 local): the real hero's head, lip-synced
function camInner(t, face, o = {}) {
  let c = S.rect(0, 0, 400, 300, 0, { fill: '#2A7A86' }) + S.rect(0, 0, 400, 70, 0, { fill: '#1E3A6A' }) + S.path('M0 70 H400', ln(6, '#FF4FB8', 0.8));
  c += S.path('M40 70 v-18 h14 v18 M90 70 v-14 h10 v14 M330 70 v-20 h16 v20', ln(5, '#FFFFFF', 0.4));
  const s = 0.62;
  c += actor('you', t, { x: 190 + (o.dx || 0), y: 44 + 951 * s, s, volume: false, face, headRot: o.headRot, bodyY: o.bodyY }, { energy: 1.3 });
  if (o.light) c += S.rect(0, 0, 400, 300, 0, { fill: o.light, opacity: f(o.lk ?? 0.2) });
  return c;
}
const FC = { x: 1500, y: 150, w: 380, h: 285 };
const fcam = (t, face, k = 1, o = {}) => facecam({ ...FC, t, k, inner: camInner(t, face, o) });
// little gold coin (game) + a "+1" pop
const gcoin = (x, y, r, t) => S.g(S.ellipse(0, 0, r * Math.max(0.15, Math.abs(Math.cos(t * 5))), r, ol('#FFD21F', 4)) + S.path(`M0 ${f(-r * 0.5)} V${f(r * 0.5)}`, ln(4, '#C8901A')), tf(x, y));
// the meadow: the knight strolls right, picking up coins (also shown inside the monitor during the dive)
const MEAD = { k0: -120, k1: 560, coins: [260, 380, 500] };
function meadowCam(t) { return camAt(lerp(380, 700, ease.inOut(seg(t, CUT.meadow - 0.6, CUT.enemy))), 600, 1.05); }
function meadowFrame(t) {
  const u = seg(t, CUT.dive, CUT.enemy);
  const kx = lerp(MEAD.k0, MEAD.k1, u);
  const cam = meadowCam(t);
  let ch = '';
  let got = 0;
  for (const cx of MEAD.coins) {
    if (kx < cx - 20) ch += gcoin(cx, GW.ground - 90 - 8 * Math.sin(t * 4 + cx), 22, t);
    else { got++; const a = (kx - cx + 20) / 140; if (a < 1) ch += S.g(TS('+1', 0, 0, 44, '#FFD21F'), tf(cx, GW.ground - 120 - 80 * a), op(1 - a)); }
  }
  ch += knight(t, { x: kx, y: GW.ground, view: 'side', flip: true, ...AC.walk(t * 9), armL: 40 + 10 * Math.sin(t * 9) }, 'happy');
  return gameFrame(t, cam, ch) + GM.gameCorner(t, { coins: 120 + got });
}

// ================================================================= SHOTS
// ---- 1. "This is you." — iris opens from SC 01's point onto the hero gaming (monitor POV) → scrapbook freeze → "games." fist pump
function shOpen(t) {
  const tt = frz(t, tYou, tYouOut);
  const cam = camKeys(tt, [[CUT.open, { zoom: 1.0, y: 0 }], [tYou, { zoom: 1.05, y: -8 }], [CUT.dive, { zoom: 1.1, y: -16 }]]);
  const pump = seg(t, tYouOut, tYouOut + 0.22);
  let pose, light = '#5AC8FF', lk = 0.12;
  if (t < tYouOut) {
    pose = { headRot: 6 * Math.sin(tt * 5), lean: 3 * Math.sin(tt * 2.4), bodyY: 4 * Math.sin(tt * 11), face: { name: 'determined', mouth: 'tongue' } };
    light = Math.floor(tt * 3) % 2 ? '#5AC8FF' : '#7CFFB0';
  } else {
    const e = ease.outBack(pump);
    pose = { armL: lerp(24, 40, e), bendL: lerp(-118, -100, pump), armR: lerp(24, 150, e), bendR: lerp(-118, -10, pump), face: { name: 'joy' }, ...boing(t, tYouOut + 0.18, 0.18) };
    light = '#FFD24A'; lk = 0.12 + 0.2 * (1 - seg(t, tYouOut, tYouOut + 0.6));
  }
  const live = povShot(tt, cam, { time: 'morning', pose, light, lk, press: t < tYouOut });
  let fx = '';
  if (t >= tYouOut) fx += K.sparkles([[560, 300, 40], [1380, 260, 46], [1300, 600, 30], [620, 620, 34]], t) + K.C.burst(960, 150, seg(t, tYouOut + 0.1, tYouOut + 0.55), '#FFD24A');
  const face = scr(cam, POV_FACE[0], POV_FACE[1]);
  let o = intro(t, live + fx, tYou, tYouOut, { x: 540, y: 200, name: 'YOU', sub: 'Gamer · age 12', col: HERO_COL, rot: -5 }, face, { ty: -40, tx: -90 });
  // arrival: SC 01's rewind collapsed to one point — the iris opens from it
  const r = lerp(0, 2400, ease.in(seg(t, T0, T0 + 0.5)));
  if (r < 2300) { o += iris(960, 540, r); if (r < 60) o += S.circle(960, 540, 16 - r * 0.2, { fill: '#FFFFFF' }); }
  o += rewindTail(t, 1 - seg(t, T0, T0 + 0.4));
  return o;
}
// ---- 2. "Because in games," — over the shoulder, the camera dives INTO the monitor
function shDive(t) {
  const cam = camKeys(t, [[CUT.dive, { zoom: 1.7, x: 365, y: -100 }], [CUT.dive + 0.25, { zoom: 1.85, x: 365, y: -112 }], [CUT.meadow, { zoom: 4.8, x: 365, y: -196 }]], ease.in);
  const screen = (w, h) => SH.frameIn(meadowFrame(t), w, h);
  const hero = actor('you', t, SH.seatPose(SPB.chair, 1, { headRot: 4 * Math.sin(t * 5), lean: 2 * Math.sin(t * 3) }));
  return bedroomShot(t, cam, { set: { pcScreen: screen, glow: 0.8, glowCol: 'cyan' }, behind: hero }) + smash(t, CUT.meadow - 0.06, 0.12, 0.35);
}
// ---- 3. "…everything makes sense." — inside DRAGON PEAK: the knight strolls, coins, tidy signposts
function shMeadow(t) {
  return meadowFrame(t);
}
// ---- 4. "Every enemy has a level." — truck along the enemy line-up; a badge pops per word
const ENEMY = [
  { k: 'slime', x: 930, lv: 1, name: 'SLIME', top: 125 },
  { k: 'shroom', x: 1170, lv: 8, name: 'SHROOM', top: 200 },
  { k: 'bat', x: 1420, lv: 23, name: 'BAT', top: 230 },
  { k: 'goblin', x: 1720, lv: 50, name: 'GOBLIN', top: 420 },
];
function creature(e, t, extra = {}) {
  const fn = GM[e.k];
  return fn(e.x + (extra.dx || 0), GW.ground + (extra.dy || 0), extra.s || 1, t, { seed: e.x, ...extra });
}
function shEnemy(t) {
  const cam = camKeys(t, [[CUT.enemy, camAt(1020, 610, 1.22)], [CUT.item, camAt(1480, 600, 1.22)]], ease.inOut);
  let ch = knight(t, { x: 640, y: GW.ground, turn: 0.55, armR: 30, armL: 14 }, 'happy');
  let ui = '';
  ENEMY.forEach((e, i) => {
    const b = boing(t, tE[i], 0.25);
    ch += S.g(creature(e, t), `translate(${f(e.x)} ${f(GW.ground)}) scale(${f(b.sx)} ${f(b.sy)}) translate(${f(-e.x)} ${f(-GW.ground)})`);
    ui += GM.lvBadge(e.x, GW.ground - e.top - (e.k === 'bat' ? 0 : 0), e.lv, e.name, pop(t, tE[i] - 0.06, 0.3));
  });
  return gameFrame(t, cam, ch + ui) + GM.gameCorner(t, { coins: 123 });
}
// ---- 5. "Every item has stats." — the chest bursts open, four items fly out with parchment tooltips
const ITEMS = [
  { x: 1990, y: 470, name: 'FLAME SWORD', stat: '+25 ATK', col: '#FF8A1A' },
  { x: 2230, y: 380, name: 'STAR SHIELD', stat: '+40 DEF', col: '#5AB0FF' },
  { x: 2470, y: 380, name: 'BIG POTION', stat: '+50 HP', col: '#5CFF9D' },
  { x: 2710, y: 470, name: 'SWIFT BOOTS', stat: '+10 SPD', col: '#FFE14D' },
];
function itemSvg(i, x, y, t) {
  if (i === 0) return G.sword(x, y + 60, 0.55, 20 + 6 * Math.sin(t * 3));
  if (i === 1) return GM.shieldRound(x, y, 0.75, -6 * Math.sin(t * 2.6));
  if (i === 2) return G.potion(x, y, 0.85, 6 * Math.sin(t * 3.2), '#E8453C');
  return GM.boots(x, y + 40, 0.9, -8 + 6 * Math.sin(t * 2.8));
}
function shItem(t) {
  const CX = 2350;
  const cam = camKeys(t, [[CUT.item, camAt(CX, 600, 1.4)], [CUT.strong, camAt(CX, 560, 1.28)]], ease.out);
  const open = seg(t, tI[0] - 0.05, tI[0] + 0.3);
  let ch = GM.chest(CX, GW.ground, 1, open, t);
  ch += knight(t, { x: 1760, y: GW.ground, turn: 0.6, armR: 20 + 40 * open, armL: 16 + 40 * open, ...boing(t, tI[0], 0.2) }, open > 0 ? 'amazed' : 'happy');
  let ui = '';
  ITEMS.forEach((it, i) => {
    const t0 = tI[Math.min(3, i)] + (i === 3 ? 0.22 : 0) - 0.05;
    const u = ease.out(seg(t, t0, t0 + 0.42));
    if (u <= 0) return;
    const x = lerp(CX, it.x, u), y = lerp(GW.ground - 150, it.y, u) - 160 * Math.sin(Math.PI * u) + 10 * Math.sin(t * 3 + i) * (u >= 1 ? 1 : 0);
    ch += itemSvg(i, x, y, t);
    if (u > 0.6) ch += K.sparkles([[x + 50, y - 40, 14], [x - 46, y + 20, 10]], t + i);
    ui += GM.itemTip(x, y - 78, it.name, it.stat, it.col, pop(t, t0 + 0.28, 0.3), { s: 0.78 });
  });
  return gameFrame(t, cam, ch + ui) + GM.gameCorner(t, { coins: 123 });
}
// ---- 6. "You always know who's strong." — the badges stack into a ladder, LV 90 slams at the top; tilt up to the glowing peak
function shStrong(t) {
  const cam = camKeys(t, [[CUT.strong, camAt(1500, 600, 1.05)], [CUT.strong + 0.4, camAt(1500, 590, 1.05)], [CUT.goblin, camAt(1480, 330, 1.12)]], ease.inOut);
  const tw = [wa(1, 'You'), wa(1, 'always'), wa(1, 'know'), wa(1, "who's"), tStrong];
  let ch = '';
  for (const e of ENEMY) ch += creature(e, t);
  const danger = 0.35 * seg(t, tStrong - 0.1, tStrong + 0.4);
  let o = gameFrame(t, cam, ch, { danger });
  // the ladder (screen space): weakest at the bottom
  const lv = [...ENEMY.map((e) => [e.lv, e.name]), [90, 'DRAGON']];
  lv.forEach(([n, nm], i) => {
    const k = pop(t, tw[i] - 0.05, 0.3), y = 900 - i * 150;
    if (i < 4) o += GM.lvBadge(250, y, n, nm, k, { lift: 0, s: 0.95 });
    else o += GM.lvBadge(250, y - 20, n, nm, k, { lift: 0, s: 1.3 });
  });
  const ak = seg(t, tw[0], tStrong);
  if (ak > 0) o += S.path(`M120 ${f(870)} V${f(870 - 560 * ak)}`, ln(10, '#FFFFFF', 0.85)) + S.path(`M100 ${f(890 - 560 * ak)} L120 ${f(860 - 560 * ak)} L140 ${f(890 - 560 * ak)}`, ln(10, '#FFFFFF', 0.85));
  return o + GM.gameCorner(t, { coins: 123 }) + smash(t, tStrong, 0.12, 0.3);
}
// ---- 7. YOU: "Level fifty goblin? Easy." — it charges, one slash, -999, poof, coins (the real hero in the facecam)
function shGoblin(t) {
  const cam = shakeAll(camKeys(t, [[CUT.goblin, camAt(1640, 600, 1.32)], [tEasy, camAt(1620, 610, 1.45)], [CUT.dragon, camAt(1610, 610, 1.5)]], ease.inOut), t, [[tEasy, 0.35, 16]]);
  const gx = lerp(1950, 1700, ease.in(seg(t, CUT.goblin + 0.3, tEasy - 0.02)));
  const swing = seg(t, tEasy - 0.12, tEasy + 0.08), after = t > tEasy + 0.08;
  const kpose = { x: 1420, y: GW.ground, turn: 0.55, armL: 16, armR: after ? lerp(150, 70, seg(t, tEasy + 0.08, tEasy + 0.5)) : lerp(40, 150, ease.in(swing)), lean: 4 * swing };
  let ch = knight(t, kpose, after ? 'smug' : 'determined');
  const poof = seg(t, tEasy + 0.02, tEasy + 0.5);
  if (poof < 1) ch += GM.goblin(gx, GW.ground, 1, t, { club: t < tEasy ? 0 : 0.3, hurt: t > tEasy, poof, rot: t > tEasy ? 8 : 0 });
  let fx = '';
  fx += G.slash({ x: 1640, y: 640, age: t - tEasy + 0.06, angle: 200, s: 1.2, col: '#FFB84A' });
  fx += G.hitSpark({ x: 1700, y: 690, age: t - tEasy, s: 1.0 });
  fx += G.damageNumber({ x: 1690, y: 450, age: t - tEasy - 0.04, value: 999, crit: true, s: 1.0, seed: 3 });
  for (let i = 0; i < 7; i++) { const age = t - tEasy - 0.1; if (age < 0 || age > 1.2) continue; const a = -Math.PI / 2 + (i - 3) * 0.32, v = 520 + 80 * hash(i); fx += gcoin(1700 + Math.cos(a) * v * age, 700 + Math.sin(a) * v * age + 900 * age * age, 18, t + i); }
  const badge = GM.lvBadge(gx, GW.ground - 420, 50, 'GOBLIN', 1 - seg(t, tEasy, tEasy + 0.15));
  let o = gameFrame(t, cam, ch + badge + fx) + GM.gameCorner(t, { coins: t > tEasy + 0.6 ? 173 : 123 });
  o += fcam(t, t > tEasy ? { name: 'smug' } : { name: 'smug' }, pop(t, CUT.goblin, 0.3));
  return o;
}
// ---- 8. "Level ninety dragon?" — the ground shakes, the sky reddens, the DRAGON rises behind the hills; boss bar
function shDragon(t) {
  const cam = shakeAll(camKeys(t, [[CUT.dragon, camAt(1350, 560, 1.0)], [CUT.run, camAt(1330, 520, 0.92)]], ease.out), t, [[CUT.dragon + 0.05, 1.6, 10], [tDragon, 0.6, 18]]);
  const rise = ease.out(seg(t, CUT.dragon + 0.05, tDragon + 0.1));
  const danger = seg(t, CUT.dragon, tDragon);
  const jaw = 0.85 * bump(t, tDragon - 0.05, CUT.run + 0.3);
  const dragonSvg = S.g(GM.dragon(1300, lerp(1700, 1130, rise), 1.22, t, { jaw }), `translate(${f(cam.sx || 0)} ${f(cam.sy || 0)})`);
  const kpose = { x: 1050, y: GW.ground, turn: 0.3, armL: 14, armR: 30, headRot: -10, lean: -4 };
  let ch = knight(t, kpose, { name: 'shocked', mouth: 'O', fx: ['sweat'] });
  let o = gameFrame(t, cam, ch, { danger, behindHills: dragonSvg });
  o += GM.bossBar({ t, k: pop(t, tDragon - 0.1, 0.35), fill: seg(t, tDragon - 0.1, tDragon + 0.6) });
  o += fcam(t, { name: 'scared', fx: ['sweat'] }, 1, { light: '#FF6A3A', lk: 0.25 * danger });
  return o;
}
// ---- 9. "Run." — the knight flees left, the fire breath sweeps behind him
function shRun(t) {
  const u = seg(t, CUT.run, CUT.phew);
  const kx = lerp(1150, 280, ease.in(u));
  const cam = shakeAll(camKeys(t, [[CUT.run, camAt(1100, 560, 1.05)], [CUT.phew, camAt(620, 560, 1.12)]], ease.in), t, [[CUT.run, 1.2, 9]]);
  let ch = knight(t, { x: kx, y: GW.ground, view: 'side', ...AC.run((t - CUT.run) * 22, 1.2), lean: -14, armL: 120 }, { name: 'scream', mouth: 'scream' });
  for (let k = 0; k < 6; k++) { const t0 = CUT.run + 0.05 + k * 0.16; ch += K.C.dust(lerp(1150, 280, ease.in(seg(t0, CUT.run, CUT.phew))) + 40, GW.ground, t0, t); }
  const dragonSvg = S.g(GM.dragon(1560, 1130, 1.22, t, { jaw: 0.9 }), `translate(${f(cam.sx || 0)} ${f(cam.sy || 0)})`);
  const m = GM.dragonMouth(1560, 1130, 1.22);
  const fire = GM.fireBreath(m[0], m[1], 168, 1500, seg(t, CUT.run + 0.12, CUT.run + 0.5), t, 0.3);
  let o = gameFrame(t, cam, ch, { danger: 1, behindHills: dragonSvg + fire });
  o += GM.bossBar({ t, k: 1, fill: 1 });
  o += streaks(t, 600, 1000, 10, 3, '#FFFFFF', 0.4 * u, 2600, 1);
  o += fcam(t, { name: 'scream' }, 1, { light: '#FF6A3A', lk: 0.3, headRot: 6 * Math.sin(t * 30) });
  return o + whip(t, CUT.phew, -1, 0.1);
}
// ---- 10. (beat) back in the room: phew — orange flashes fade, he sags into the chair
function shPhew(t) {
  const cam = camKeys(t, [[CUT.phew, { zoom: 1.12, y: -14 }], [CUT.real, { zoom: 1.04, y: 0 }]]);
  const u = seg(t, CUT.phew, CUT.phew + 0.9);
  const sag = ease.out(seg(t, CUT.phew + 0.35, CUT.phew + 0.9));
  const wipe = bump(t, CUT.phew + 0.9, CUT.phew + 1.6);
  const pose = { lean: -4 * sag, bodyY: 18 * sag, headRot: -6 * sag, armR: lerp(24, 150, wipe), bendR: lerp(-118, -140, wipe), face: t < CUT.phew + 0.4 ? { name: 'scared', fx: ['sweat'] } : { name: 'happy', eyes: { type: 'closed' }, mouth: 'o', fx: ['sweat'] } };
  let o = povShot(t, cam, { time: 'morning', pose, light: u < 1 ? '#FF7A3A' : '#7CFFB0', lk: lerp(0.32, 0.1, u) });
  const p = scr(cam, 1330, 330);
  o += doodleNote('phew…', p[0], p[1], pop(t, CUT.phew + 0.55, 0.3), 58, -8);
  return o;
}
// ---- 11. "But real life?" — the monitor dies; he gets up and trudges to the door → whip
function shReal(t) {
  const tOff = wa(3, 'But'), tUp = wa(3, 'life') + 0.05;
  const cam = camKeys(t, [[CUT.real, camAt(1240, 540, 1.25)], [tUp, camAt(1300, 560, 1.15)], [CUT.kitchen, camAt(1700, 560, 1.15)]], ease.inOut);
  const offK = seg(t, tOff, tOff + 0.35);
  const screen = (w, h) => (offK < 1 ? SH.frameIn(meadowFrame(CUT.enemy - 0.05), w, h) : '') + crtOff(-w / 2, -h / 2, w, h, offK);
  let hero;
  if (t < tUp) hero = actor('you', t, SH.seatPose(SPB.chair, 1, { headRot: offK > 0.5 ? -8 : 0 }));
  const set = { pcScreen: screen, glow: 0.7 * (1 - offK), glowCol: 'cyan', chair: 'back' };
  let chars = '';
  if (t >= tUp) {
    const wk = seg(t, tUp + 0.35, CUT.kitchen);
    const x = lerp(1325, 1760, wk);
    chars = actor('you', t, wk > 0 ? { x, y: 990, s: 0.5, view: 'side', flip: true, ...AC.walk((t - tUp) * 9), face: 'sad' } : { x: 1325, y: 990, s: 0.5, face: { name: 'sad' }, ...boing(t, tUp, 0.15) }, { arms: wk <= 0 });
  }
  return bedroomShot(t, cam, { set, behind: hero || '', chars }) + whip(t, CUT.kitchen, 1, 0.12);
}

// ================================================================= the kitchen (morning) — the family
const MOMC = { x: 420, y: 800, s: 0.46 };                       // Mom at the counter
const PAN = (p) => [p.x + 119 * p.s, p.y - 519 * p.s];   // pan centre for draw.mom({ pan }) (measured)
const DOG = { x: 1640, y: 990, s: 0.46 };
// Mom juggling: pan + phone + (egg, mug, whisk orbiting above her)
function juggle(t, x, y, s) {
  let o = '';
  const items = 3;
  for (let i = 0; i < items; i++) {
    const ph = t * 4.2 + (i * Math.PI * 2) / items;
    const px = x + Math.cos(ph) * 170 * s, py = y - 1110 * s - Math.abs(Math.sin(ph)) * 200 * s;
    if (i === 0) o += S.g(S.ellipse(0, 0, 26, 34, ol('#FFF8EC', 5)), tf(px, py, s / 0.46, ph * 40));
    else if (i === 1) o += S.g(SH.mug(0, 30, 1, undefined, { col: '#FF8A7A' }), tf(px, py, s / 0.46, ph * 60));
    else o += S.g(S.path('M0 40 V-20', ln(9, '#9AA0AE')) + S.path('M0 -20 Q-26 -60 0 -90 Q26 -60 0 -20 M0 -20 Q-12 -60 0 -90 Q12 -60 0 -20', ln(5, '#C9CED8')), tf(px, py, s / 0.46, ph * 50));
  }
  return o;
}
// ---- 12. "Real life has no numbers." — the kitchen in full morning chaos; the hero walks in
function famChaos(t, o = {}) {
  const bounce = Math.abs(Math.sin(t * 9));
  let seated = seat('max', t, 'max', { lift: 26 * bounce, armL: 60 + 60 * Math.sin(t * 9), armR: 60 - 60 * Math.sin(t * 9), face: o.maxFace || 'excited' });
  seated += seat('grandpa', t, 'grandpa', { armR: 120 + 20 * Math.sin(t * 4), face: o.louFace || { name: 'talkHappy', mouth: Math.floor(t * 7) % 2 ? 'O' : 'smile' }, headRot: 5 * Math.sin(t * 3) });
  let chars = actor('mom', t, { ...MOMC, pan: true, phone: 'ear', turn: 0.15 * Math.sin(t * 2), face: o.momFace || 'happy' }) + juggle(t, MOMC.x, MOMC.y, MOMC.s);
  // Biscuit zooms back and forth in front of the table
  const dx = Math.sin(t * 1.9), dir = Math.cos(t * 1.9) > 0;
  if (o.dog !== false) chars += actor('biscuit', t, { x: 1150 + 420 * dx, y: 990, s: 0.46, pose: 'walk', flip: dir, t, face: 'happy' });
  return { seated, chars };
}
function shKitchen(t) {
  const cam = camKeys(t, [[CUT.kitchen, camAt(1060, 540, 0.98)], [CUT.think, camAt(1100, 530, 1.04)]], ease.out);
  const tStop = CUT.kitchen + 1.0;
  const { seated, chars } = famChaos(t);
  const wk = seg(t, CUT.kitchen, tStop);
  const hx = lerp(2160, 1790, ease.out(wk));
  const hero = wk < 1 ? actor('you', t, { x: hx, y: 990, s: 0.5, view: 'side', ...AC.walk((t - CUT.kitchen) * 9), face: 'neutral' }, { arms: false })
    : actor('you', t, { x: hx, y: 990, s: 0.5, turn: -0.5, face: { name: 'confused', fx: ['question'] }, armL: 10, armR: 14, ...boing(t, tStop, 0.12) });
  return kitchenShot(t, cam, { seated, chars: chars + hero }) + whip(t, CUT.kitchen, 1, 0.12);
}
// ---- 13. "You never know what anyone is thinking." — thought bubbles nobody can read (except the dog's)
function shThink(t) {
  const cam = camKeys(t, [[CUT.think, camAt(1100, 520, 1.06)], [CUT.mom, camAt(1080, 500, 1.14)]], ease.inOut);
  const { seated, chars } = famChaos(t, { momFace: 'happy', dog: false });
  const dog = actor('biscuit', t, { x: 1620, y: 992, s: 0.46, pose: 'sit', t, face: 'happy', look: [0.6, -0.2] });
  const hero = actor('you', t, { x: 1790, y: 990, s: 0.5, turn: -0.5, armR: 150, bendR: -40, armL: 10, face: { name: 'confused', fx: ['question'] } }, { arms: false });
  const tw = [wa(3, 'never'), wa(3, 'know'), wa(3, 'anyone'), wa(3, 'thinking')];
  const mx = seatPos('max', 'max'), gx = seatPos('grandpa', 'grandpa');
  const q = (s) => TS('?', 0, 30, 110 * s, '#B06BFF');
  let over = '';
  over += thought({ x: 560, y: 190, r: 92, tail: [470, 300], k: pop(t, tw[0], 0.3), t, inner: K.loadingWheel(0, 0, 36, t, '#7A8094', 9, 9), seed: 1 });
  over += thought({ x: mx.x - 120, y: 240, r: 84, tail: [mx.x - 20, 380], k: pop(t, tw[1], 0.3), t, inner: S.path('M-40 0 Q-40 -34 0 -34 Q36 -34 36 0 Q36 24 6 24 Q-18 24 -18 4 Q-18 -12 2 -12 Q14 -12 14 0', ln(9, '#5DBB4A')), seed: 2 });
  over += thought({ x: gx.x + 40, y: 210, r: 84, tail: [gx.x - 10, 340], k: pop(t, tw[2], 0.3), t, inner: q(1), seed: 3 });
  over += thought({ x: 1560, y: 650, r: 76, tail: [1620, 780], k: pop(t, tw[3], 0.3), t, inner: S.g(S.path('M-40 -8 a14 14 0 1 1 10 -16 L30 -24 a14 14 0 1 1 10 16 a14 14 0 1 1 -10 16 L-30 24 a14 14 0 1 1 -10 -16 Z', ol('#FFF6E2', 5)), 'rotate(-12)'), seed: 4 });
  return kitchenShot(t, cam, { seated, chars: chars + dog + hero, over });
}
// ---- 14. "There's Mom. She runs a bakery." — juggling pan + phone + egg + mug → scrapbook freeze (sub: "Runs a bakery")
function shMom(t) {
  const tt = frz(t, tMomF, tMomOut);
  const cam = camKeys(tt, [[CUT.mom, camAt(450, 470, 1.62)], [tMomF, camAt(430, 460, 1.8)]], ease.out);
  const { seated } = famChaos(tt);
  const chars = actor('mom', tt, { ...MOMC, pan: true, phone: 'ear', turn: 0.15 * Math.sin(tt * 2), face: 'happy', ...boing(tt, CUT.mom + 0.2, 0.1) }) + juggle(tt, MOMC.x, MOMC.y, MOMC.s);
  const live = kitchenShot(tt, cam, { seated, chars }) + whip(t, CUT.mom, -1, 0.12);
  const face = scr(cam, MOMC.x, MOMC.y - 1059 * MOMC.s + 200 * MOMC.s);
  const cupDoodle = '';
  void cupDoodle;
  return intro(t, live, tMomF, tMomOut, { x: 1420, y: 190, name: 'MOM', sub: 'Runs a bakery', col: '#E8457A', rot: 4, subK: seg(t, tBakery - 0.15, tBakery + 0.15) }, face, { ax: -150, ay: 60, tx: 70, ty: -10, bend: -0.25 });
}
// ---- 15. "She works all day…" — a triptych: sunrise van / noon phone + coffee / night, asleep standing up
function panelBg(i, t) {
  if (i === 0) return S.rect(0, 0, 640, 1080, 0, { fill: '#FFD7A8' }) + S.rect(0, 600, 640, 480, 0, { fill: '#FFB98A' }) + S.circle(500, 300, 70, ol('#FFE14D', 6)) + S.rect(0, 860, 640, 220, 0, ol('#9AA0AE', 5));
  if (i === 1) return S.rect(0, 0, 640, 1080, 0, { fill: '#9FDBFF' }) + S.circle(140, 200, 60, ol('#FFF3A0', 6)) + S.rect(0, 840, 640, 240, 0, ol('#F2C9A0', 5)) + S.rect(380, 300, 200, 150, 10, ol('#FFFFFF', 5)) + TF('ORDERS', 480, 350, 30, '#C8456A') + S.path('M410 380 h140 M410 410 h110', ln(6, '#9AA0AE'));
  return S.rect(0, 0, 640, 1080, 0, { fill: '#1E2650' }) + S.circle(470, 220, 50, { fill: '#FFF4C8', stroke: '#E8D490', 'stroke-width': 5 }) + S.circle(452, 206, 46, { fill: '#1E2650' }) + S.rect(0, 840, 640, 240, 0, ol('#3A3A5A', 5)) + S.path('M80 120 l4 10 l10 2 l-8 6 l2 10 l-8 -6 l-8 6 l2 -10 l-8 -6 l10 -2 Z M300 90 l3 7 l7 1 l-5 4 l1 7 l-6 -4 l-6 4 l1 -7 l-5 -4 l7 -1 Z', { fill: '#FFE9A8' });
}
function shWorks(t) {
  const tw = [wa(4, 'works'), wa(4, 'all'), wa(4, 'day')];
  let o = S.rect(0, 0, 1920, 1080, 0, { fill: '#EFD9B4' }) + S.rect(0, 0, 1920, 1080, 0, { fill: 'url(#s02Paper)' });
  for (let i = 0; i < 3; i++) {
    const k = ease.outBack(seg(t, tw[i] - 0.22, tw[i] + 0.12));
    if (k <= 0) continue;
    let inner = panelBg(i, t);
    const s = 0.6, mx = 320, my = 1000;
    if (i === 0) {
      inner += SH.bakeryVan(250, 900, 0.62);
      inner += actor('mom', t, { x: 430, y: my, s, ...AC.walkFront(t * 8), armL: 24, armR: 24, bendL: -60, bendR: -60, face: 'happy' }, { arms: false });
      for (let j = 0; j < 3; j++) inner += SH.cupcakeBox(430, 880 - j * 40 + 3 * Math.sin(t * 8 + j), 0.5);
    } else if (i === 1) {
      inner += actor('mom', t, { x: mx, y: my, s, phone: 'ear', coffee: true, face: { name: 'talkHappy', mouth: Math.floor(t * 8) % 2 ? 'O' : 'smile' }, headRot: 6 * Math.sin(t * 5) });
    } else {
      inner += actor('mom', t, { x: mx, y: my, s, coffee: true, asleep: true, t, headRot: 8 });
    }
    const cx = 320 + i * 640;
    const panel = clipTo(0, 0, 640, 1080, inner);
    o += S.g(panel, `translate(${f(cx)} ${f(lerp(-1100, 0, k) + 540)}) rotate(${f((1 - k) * (i - 1) * 6)}) translate(-320 -540)`);
  }
  o += S.path('M640 -10 V1090 M1280 -10 V1090', ln(18, '#FFFDF6')) + S.path('M640 -10 V1090 M1280 -10 V1090', ln(4, LINE_));
  // a clock in the corner racing through the day
  const hrs = lerp(6, 23, seg(t, CUT.works, CUT.smile));
  o += SH.wallClock(1840, 90, 58, hrs) ;
  return o + whip(t, CUT.works, 1, 0.1);
}
const LINE_ = '#151515';
// ---- 16. "…and she always smiles." — close-up: the smile (tired eyes, flour), sparkle TING on "smiles"
function shSmile(t) {
  const cam = camKeys(t, [[CUT.smile, camAt(420, 440, 2.4)], [CUT.morning, camAt(420, 430, 2.75)]], ease.linear);
  const chars = actor('mom', t, { ...MOMC, coffee: true, tired: 0.55, volume: false, face: { name: 'happy', mouth: 'bigGrin' }, ...boing(t, tSmiles, 0.08) });
  let o = kitchenShot(t, cam, { chars, seated: '' });
  const p = scr(cam, MOMC.x + 40, MOMC.y - 1059 * MOMC.s + 300 * MOMC.s);
  const k = seg(t, tSmiles - 0.05, tSmiles + 0.6);
  if (k > 0 && k < 1) o += S.g(S.path('M0 -60 L12 -12 L60 0 L12 12 L0 60 L-12 12 L-60 0 L-12 -12 Z', { fill: '#FFFFFF', stroke: '#FFD24A', 'stroke-width': 5 }), tf(p[0] + 60, p[1] - 10, ease.outBack(bump(t, tSmiles - 0.05, tSmiles + 0.6)) * 1.4, t * 120));
  if (t > tSmiles) o += K.sparkles([[p[0] - 220, p[1] - 140, 26], [p[0] + 240, p[1] - 200, 30], [p[0] + 200, p[1] + 60, 20]], t);
  return o;
}
// ---- 17. MOM: "Morning, sweetheart! Breakfast is ready!" — she swings round with the pan to the table
function seatedFamily(t, o = {}) {
  let s = '';
  if (o.max !== false) s += seat('max', t, 'max', { face: 'happy', armR: 30 + 20 * Math.sin(t * 6), ...(o.max || {}) });
  if (o.you !== false) s += seat('you', t, 'you', { armR: 40 + 30 * Math.abs(Math.sin(t * 5)), bendR: -100, face: 'neutral', ...(o.you || {}) }, o.youAct || {});
  if (o.grandpa !== false) s += seat('grandpa', t, 'grandpa', { face: 'happy', ...(o.grandpa || {}) }, o.louAct || {});
  return s;
}
function shMorning(t) {
  const cam = camKeys(t, [[CUT.morning, camAt(760, 520, 1.32)], [CUT.prob, camAt(800, 510, 1.38)]], ease.inOut);
  const turn = ease.out(seg(t, CUT.morning, A[5].a + 0.2));
  const tReady = wa(5, 'ready');
  const chars = actor('mom', t, { ...MOMC, pan: true, turn: lerp(-0.3, 0.45, turn), face: { name: 'talkHappy' }, ...boing(t, tReady, 0.12) }, { energy: 1.3 });
  const seated = seatedFamily(t, { you: { face: 'happy', armR: 30, bendR: -100 }, youAct: {} });
  return kitchenShot(t, cam, { seated, chars }) + whip(t, CUT.morning, -1, 0.1);
}
// ---- 18. "…Probably." — the pan smokes; the smile doesn't move an inch
function shProb(t) {
  const p = PAN(MOMC);
  const cam = shakeAll(camKeys(t, [[CUT.prob, camAt(p[0] - 60, p[1] - 60, 2.3)], [CUT.cupcakes, camAt(p[0] - 60, p[1] - 70, 2.42)]], ease.linear), t, [[tProb, 0.3, 6]]);
  const chars = actor('mom', t, { ...MOMC, pan: true, turn: 0.05, volume: false, face: t < tProb ? { name: 'talkHappy' } : { name: 'happy', fx: ['sweat'] } }, { energy: 0.6 });
  let o = kitchenShot(t, cam, { chars, seated: seatedFamily(t) });
  // burnt egg + smoke
  const k = seg(t, tProb - 0.15, tProb + 0.25);
  const ps = scr(cam, p[0], p[1]);
  if (k > 0) {
    o += S.ellipse(ps[0] - 30, ps[1] + 4, 60 * k, 26 * k, { fill: '#2A2420', opacity: 0.85 });
    let sm = '';
    for (let i = 0; i < 7; i++) { const u = ((t - tProb + 0.15) * 0.8 + i / 7) % 1, r = 40 + 110 * u; sm += `M${f(ps[0] + 10 + 420 * u + 40 * Math.sin(u * 6 + i) + r)} ${f(ps[1] - 30 - 380 * u)} a${f(r)} ${f(r)} 0 1 0 ${f(-2 * r)} 0 a${f(r)} ${f(r)} 0 1 0 ${f(2 * r)} 0 Z`; }
    o += S.path(sm, { fill: '#4A4A52', opacity: f(0.75 * k), stroke: LINE_, 'stroke-width': 4 });
  }
  return o + smash(t, tProb, 0.1, 0.25);
}
// ---- 19. "She baked three hundred cupcakes before sunrise." — pre-dawn time-lapse: boxes stack, the window turns to sunrise
function boxStack(n, t) {
  let o = '';
  for (let i = 0; i < n; i++) {
    const col = i % 2, row = Math.floor(i / 2);
    o += SH.cupcakeBox(1600 + col * 112 + (row % 2) * 8, 762 - row * 62, 0.84, undefined, { col: ['#FF9EBB', '#FFB8CC', '#FFC9A8'][i % 3] });
  }
  return o;
}
function shCupcakes(t) {
  const cam = camKeys(t, [[CUT.cupcakes, camAt(1000, 470, 1.04)], [tSunrise, camAt(1250, 480, 1.3)], [CUT.asked, camAt(1290, 480, 1.36)]], ease.inOut);
  const u = seg(t, CUT.cupcakes + 0.2, tSunrise - 0.1);
  const n = Math.floor(12 * u);
  const night = 1 - seg(t, tSunrise - 0.1, tSunrise + 0.5);
  const hrs = lerp(3.5, 6.2, seg(t, CUT.cupcakes, tSunrise + 0.2));
  const step = Math.floor((t - CUT.cupcakes) * 5);
  const atTower = step % 2 === 1 && t < tSunrise;
  const mx = t >= tSunrise ? 1450 : atTower ? 1460 : 520;
  let chars = '';
  const ghostX = atTower ? 520 : 1460;
  if (t < tSunrise) chars += S.g(actor('mom', t, { x: ghostX, y: 800, s: 0.46, armL: 60, armR: 60, bendL: -60, bendR: -60, face: 'determined' }), null, { opacity: 0.3 });
  const done = t >= tSunrise;
  chars += actor('mom', t, done ? { x: mx, y: 800, s: 0.46, turn: -0.3, armR: 150, bendR: -30, armL: 14, face: { name: 'happy', fx: ['sweat'] }, tired: 0.6, ...boing(t, tSunrise, 0.15) }
    : { x: mx, y: 800, s: 0.46, armL: 60, armR: 60, bendL: -60, bendR: -60, face: 'determined', lean: atTower ? 4 : -4 });
  if (!done) chars += SH.cupcakeBox(mx, 800 - 0.46 * 560, 0.7);
  chars += boxStack(n, t);
  let o = kitchenShot(t, cam, { set: { boxes: false, clock: `${Math.floor(hrs)}:${String(Math.floor((hrs % 1) * 60)).padStart(2, '0')}`, birds: !night }, chars });
  if (night > 0) o += S.rect(0, 0, 1920, 1080, 0, { fill: '#141A48', opacity: f(0.58 * night) }) + view(cam, S.ellipse(1175, 260, 260, 160, { fill: '#FFD27A', opacity: f(0.22 * night) }), 1);
  // time-lapse streaks while she zips
  if (!done) o += streaks(t, 300, 800, 6, 7, '#FFFFFF', 0.25, 3600, step % 2 ? 1 : -1);
  const sk = seg(t, tSunrise - 0.1, tSunrise + 0.4);
  if (sk > 0 && sk < 1) o += smash(t, tSunrise - 0.1, 0.4, 0.35);
  return o + whip(t, CUT.cupcakes, 1, 0.1);
}
// ---- 20. "And she still asked about your day." — she leans over the table, hand on his head; he blushes
function shAsked(t) {
  const cam = camKeys(t, [[CUT.asked, camAt(1130, 470, 1.85)], [CUT.lou, camAt(1150, 460, 2.0)]], ease.inOut);
  const lean = ease.inOut(seg(t, CUT.asked + 0.1, CUT.asked + 0.7));
  const seated = seatedFamily(t, { grandpa: false, you: { face: { name: 'happy', fx: lean > 0.8 ? ['blush'] : [] }, armR: 30, bendR: -100, headRot: -6 * lean } });
  const chars = actor('mom', t, { x: 1010, y: 770, s: 0.46, turn: 0.55, lean: 9 * lean, armR: lerp(20, 112, lean), bendR: lerp(0, -40, lean), armL: 14, tired: 0.6, face: { name: 'talkHappy', mouth: Math.floor(t * 6) % 3 ? 'smile' : 'O' } }, { arms: false });
  let o = kitchenShot(t, cam, { seated: chars + seated, chars: '' });
  const p = scr(cam, 1205, 380);
  o += G.emoteHearts({ x: p[0] + 40, y: p[1], age: t - wa(6, 'day') + 0.2, n: 5, s: 0.9, life: 1.4 });
  return o;
}
// ---- 21. "There's Grandpa Lou." — sipping from his #79 mug → freeze (sub: "Retired legend (he says)")
function louMug(t, sip) {
  const gp = seatPos('grandpa', 'grandpa');
  return SH.mug(gp.x - 100 + 10 * sip, 660 - 70 * sip, 1.2, undefined, { col: '#FFFFFF', label: '79', steam: t });
}
function shLou(t) {
  const tt = frz(t, tLouF, tLouOut);
  const cam = camKeys(tt, [[CUT.lou, camAt(1490, 490, 2.0)], [tLouF, camAt(1480, 480, 2.25)]], ease.out);
  const sip = bump(tt, CUT.lou - 0.2, tLouF + 0.4);
  const seated = seatedFamily(tt, { grandpa: { face: { name: 'happy', eyes: sip > 0.5 ? { type: 'closed' } : undefined }, armL: 20 + 60 * sip, bendL: -90 * sip, glasses: 'up' } });
  const live = kitchenShot(tt, cam, { seated, chars: louMug(tt, sip) }) + whip(t, CUT.lou, -1, 0.12);
  const gp = seatPos('grandpa', 'grandpa'), face = scr(cam, gp.x, gp.y - 982 * gp.s + 200 * gp.s);
  return intro(t, live, tLouF, tLouOut, { x: 620, y: 200, name: 'GRANDPA LOU', sub: 'Retired legend (he says)', col: '#6E8A44', rot: -4, size: 86 }, face, { ax: 200, ay: 70, tx: -110, ty: 0, bend: 0.3 });
}
// ---- 22. "Every breakfast, he tells the same story." — the rerun: MONDAY / TUESDAY / WEDNESDAY, faces flatter each time
function shSame(t) {
  const L_ = (CUT.g79 - CUT.same) / 3;
  const d = clamp(Math.floor((t - CUT.same) / L_), 0, 2), lt = (t - CUT.same) - d * L_;
  const cam = camKeys(lt, [[0, camAt(1200, 490, 1.42)], [L_, camAt(1210, 480, 1.5)]], ease.linear);
  const up = ease.outBack(seg(lt, 0.12, 0.35));
  const yf = [{ name: 'neutral' }, { name: 'deadpan' }, { name: 'deadpan', eyes: { upper: 0.6 }, fx: ['sweat'] }][d];
  const mf = [{ name: 'excited' }, { name: 'neutral' }, { name: 'sleepy' }][d];
  const seated = seatedFamily(lt + CUT.same, { max: { face: mf }, you: { face: yf, armR: 20, bendR: -100 }, grandpa: { armR: 20 + 140 * up, bendR: -20 * up, face: { name: 'talkHappy', mouth: lt > 0.3 ? (Math.floor(lt * 9) % 2 ? 'O' : 'smile') : 'smile' } } });
  let o = kitchenShot(lt + CUT.same, cam, { seated });
  const day = ['MONDAY', 'TUESDAY', 'WEDNESDAY'][d];
  const pk = ease.outBack(seg(lt, 0, 0.2));
  let cal = S.rect(-120, -90, 240, 190, 14, ol('#FFFFFF', 6)) + S.rect(-120, -90, 240, 58, 14, ol('#E8453C', 6)) + S.rect(-120, -50, 240, 18, 0, { fill: '#E8453C' }) + TF(day, 0, -48, 30, '#FFFFFF') + S.path('M-60 10 L60 10 M-60 50 L30 50', ln(8, '#D8D0C0'));
  cal += S.circle(-70, -96, 9, { fill: LINE_ }) + S.circle(70, -96, 9, { fill: LINE_ });
  o += S.g(cal, `translate(220 190) rotate(${f(-6 + 3 * d)}) scale(${f(pk)})`);
  if (d > 0 && lt < 0.12) o += K.C.whiteFlash(0.5 * (1 - lt / 0.12)) + rewindTail(t, 1 - lt / 0.12);
  return o + whip(t, CUT.same, 1, 0.1);
}
// ---- 23. GRANDPA: "Nineteen seventy-nine!" — he rises, finger to the sky; a retro 1979 slams in
const LOU_STAND = { x: 1462, y: 772, s: 0.46 };
function shG79(t) {
  const cam = camKeys(t, [[CUT.g79, camAt(1320, 470, 1.55)], [CUT.finals, camAt(1340, 450, 1.78)]], ease.out);
  const rise = ease.outBack(seg(t, CUT.g79, A[8].a + 0.15));
  const seated = seatedFamily(t, { grandpa: false, you: { face: 'deadpan', armR: 20, bendR: -100 }, max: { face: 'excited' } });
  const lou = actor('grandpa', t, { ...LOU_STAND, y: lerp(830, LOU_STAND.y, rise), armR: lerp(30, 165, rise), bendR: 0, armL: 30, face: { name: 'determined' }, glasses: 'up' }, { arms: false, energy: 1.4 });
  let o = kitchenShot(t, cam, { seated: lou + seated });
  const k = seg(t, t79 - 0.15, t79 + 0.6);
  if (k > 0) o += G.bigTitle({ text: '1979', theme: 'retro', k, t, x: 640, y: 330, size: 210, sub: 'THE FINALS', rays: true });
  return o + smash(t, t79, 0.12, 0.4) + whip(t, CUT.g79, -1, 0.1);
}
// ---- 24. "The arm wrestling finals!" — sepia flashback: young Lou vs the champ, the crowd, flashbulbs
function shFinals(t) {
  const u = seg(t, CUT.finals, CUT.legend);
  const zoom = lerp(1, 1.08, u);
  const tFin = wa(8, 'finals');
  let w = S.rect(0, 0, 1920, 1080, 0, { fill: '#3A2A4A' }) + S.rect(0, 640, 1920, 440, 0, { fill: '#5A3A2A' });
  // spotlights + banner
  w += S.path('M600 -20 L380 900 L840 900 Z M1320 -20 L1080 900 L1540 900 Z', { fill: '#FFF4D0', opacity: 0.12 });
  w += S.path('M420 70 L1500 70 L1460 120 L1500 170 L420 170 L460 120 Z', ol('#C8202A', 6)) + T('ARM WRESTLING FINALS', 960, 142, 62, '#FFE14D', { stroke: LINE_, 'stroke-width': 9, 'paint-order': 'stroke' });
  // the crowd behind (lite humans, back rows)
  let crowd = '';
  for (let i = 0; i < 12; i++) { const x = 90 + i * 158, y = 700 + 14 * (i % 2); crowd += K.draw.adult((i * 5 + 2) % 23, { x, y, s: 0.25, face: i % 3 ? 'excited' : 'shocked', armL: 140 + 20 * Math.sin(t * 9 + i), armR: 140 + 20 * Math.sin(t * 9 + i + 1), bodyY: -6 * Math.abs(Math.sin(t * 8 + i)) }); }
  w += crowd;
  // the two wrestlers + table
  const trem = 10 * Math.sin(t * 38) + 6 * Math.sin(t * 23);
  const cx = 960 + trem + lerp(0, 40, seg(t, tFin, tFin + 0.6)), cy = 630;
  w += youngLou({ x: 500, y: 1110, s: 0.54, turn: 0.6, armR: 10, armL: 8, face: { name: 'determined', mouth: 'teeth' }, lean: 8 });
  w += K.draw.adult(23, { x: 1420, y: 1110, s: 0.56, turn: -0.6, face: { name: 'angry', mouth: 'teeth' }, armL: 10, armR: 8, lean: -8 });
  w += S.rect(500, 760, 920, 56, 12, ol('#8A5A34', 7)) + S.rect(540, 816, 840, 300, 0, ol('#6E4626', 7));
  // the locked forearms (elbows on the table)
  w += S.path(`M800 768 L${f(cx - 16)} ${f(cy)}`, ln(64, LINE_)) + S.path(`M800 768 L${f(cx - 16)} ${f(cy)}`, ln(50, '#F2C29E'));
  w += S.path(`M1120 768 L${f(cx + 16)} ${f(cy)}`, ln(64, LINE_)) + S.path(`M1120 768 L${f(cx + 16)} ${f(cy)}`, ln(50, '#C98D6A'));
  w += S.circle(cx, cy - 6, 42, ol('#E0AE88', 7)) + S.path(`M${f(cx - 24)} ${f(cy - 28)} Q${f(cx)} ${f(cy - 46)} ${f(cx + 24)} ${f(cy - 28)}`, ln(6));
  w += S.path(`M${f(cx - 60)} ${f(cy - 80)} l-20 -30 M${f(cx + 60)} ${f(cy - 80)} l20 -30 M${f(cx)} ${f(cy - 96)} v-34`, ln(7, '#FFFFFF', 0.9));
  // flashbulbs on "finals!"
  for (let i = 0; i < 4; i++) { const tf_ = tFin + i * 0.16, a = t - tf_; if (a < 0 || a > 0.25) continue; const x = [300, 1640, 520, 1420][i], y = [520, 480, 760, 760][i]; w += S.circle(x, y, 120 * (1 - a / 0.25) + 20, { fill: '#FFFFFF', opacity: f(0.9 * (1 - a / 0.25)) }); }
  let o = S.g(w, `translate(960 540) scale(${f(zoom)}) translate(-960 -540)`);
  o += oldFilm(t, 1);
  o += S.g(T('1979', 0, 0, 72, '#FFF4DC', { stroke: LINE_, 'stroke-width': 8, 'paint-order': 'stroke' }), tf(1700, 1000, 1, -4), op(0.85));
  return o + smash(t, CUT.finals, 0.16, 0.6);
}
// ---- 25. "I was a legend!" — the double-biceps flex; Max copies it; the hero keeps eating
function shLegend(t) {
  const cam = camKeys(t, [[CUT.legend, camAt(1230, 470, 1.5)], [CUT.max, camAt(1240, 460, 1.58)]], ease.inOut);
  const fl = ease.outBack(seg(t, CUT.legend, CUT.legend + 0.3));
  const seated = seatedFamily(t, { grandpa: false, you: { face: 'deadpan', armR: 40 + 30 * Math.abs(Math.sin(t * 5)), bendR: -110 }, max: { armL: 96, armR: 96, bendL: 104 * fl, bendR: 104 * fl, face: { name: 'determined' } } });
  const lou = actor('grandpa', t, { ...LOU_STAND, armwrestle: 'flex', sash: true, face: { name: 'determined' }, ...boing(t, tLegend, 0.12) }, { energy: 1.2 });
  let o = kitchenShot(t, cam, { seated: lou + seated });
  if (t > tLegend - 0.05) {
    const p = scr(cam, LOU_STAND.x, LOU_STAND.y - 560 * 0.46 * 1.1);
    o += K.sparkles([[p[0] - 300, p[1] - 120, 34], [p[0] + 300, p[1] - 120, 34], [p[0] - 260, p[1] + 90, 22], [p[0] + 280, p[1] + 80, 24]], t);
    o += G.stamp({ text: 'LEGEND', x: 380, y: 190, k: seg(t, tLegend, tLegend + 0.5), col: '#D7263D', size: 90, rot: -12 });
  }
  return o + whip(t, CUT.legend, 1, 0.1);
}
// ---- 26. "There's Max. Your little brother." — the spoon catapult → freeze (sub: "Little brother")
function shMax(t) {
  const tt = frz(t, tMaxF, tMaxOut);
  const cam = camKeys(tt, [[CUT.max, camAt(870, 520, 2.1)], [tMaxF, camAt(880, 510, 2.35)]], ease.out);
  const fling = seg(tt, CUT.max + 0.05, CUT.max + 0.25);
  const seated = seatedFamily(tt, { max: { armR: lerp(20, 170, ease.outBack(fling)), bendR: 0, armL: 30, face: { name: 'excited' }, lift: 10 * Math.abs(Math.sin(tt * 8)) } });
  let cer = '';
  for (let i = 0; i < 8; i++) { const a = tt - CUT.max - 0.15; if (a < 0) continue; const vx = -250 + 500 * hash(i), vy = -700 - 300 * hash(i * 3); cer += `M${f(950 + vx * a + 10)} ${f(600 + vy * a + 900 * a * a)} a10 10 0 1 0 -20 0 a10 10 0 1 0 20 0 Z `; }
  const live = kitchenShot(tt, cam, { seated, over: cer ? S.path(cer, { fill: '#FFC93C', stroke: LINE_, 'stroke-width': 3 }) : '' }) + whip(t, CUT.max, -1, 0.12);
  const mp = seatPos('max', 'max'), face = scr(cam, mp.x, mp.y - 664 * mp.s + 160 * mp.s);
  return intro(t, live, tMaxF, tMaxOut, { x: 1420, y: 190, name: 'MAX', sub: 'Little brother', col: '#4FA83A', rot: 5, subK: seg(t, tBro - 0.15, tBro + 0.15) }, face, { ax: -120, ay: 70, tx: 70, ty: -20, bend: -0.25 });
}
// ---- 27. "He's five." — one claw-mitten up, proud (three claws: close enough)
function shFive(t) {
  const cam = camKeys(t, [[CUT.five, camAt(900, 500, 2.3)], [CUT.tornado, camAt(900, 495, 2.4)]], ease.inOut);
  const up = ease.outBack(seg(t, CUT.five, CUT.five + 0.25));
  const seated = seatedFamily(t, { max: { armR: 165 * up, bendR: 0, armL: 20, face: { name: 'cute' }, ...boing(t, CUT.five + 0.2, 0.15) } });
  let o = kitchenShot(t, cam, { seated });
  const mp = seatPos('max', 'max');
  const h = CAST.handPos('max', { ...mp, armR: 165, bendR: 0 }, 1);
  const p = scr(cam, h[0], h[1]);
  o += doodleArrow(p[0] + 300, p[1] + 40, p[0] + 60, p[1] + 10, seg(t, CUT.five + 0.35, CUT.five + 0.7), { bend: 0.25 });
  o += doodleNote('close enough', p[0] + 420, p[1] + 90, pop(t, CUT.five + 0.6, 0.3), 46, -6);
  o += K.sparkles([[p[0] - 60, p[1] - 40, 20], [p[0] + 40, p[1] - 80, 16]], t);
  return o;
}
// ---- 28. "He's basically a tornado in a dinosaur suit." — Max spins up and tears through the kitchen; cereal everywhere
function torX(t) {
  const u = seg(t, tSpin, CUT.trex - 0.25);
  return 940 + 640 * Math.sin(u * Math.PI * 2.2) * (1 - 0.3 * u);
}
function shTornado(t) {
  const cam = shakeAll(camKeys(t, [[CUT.tornado, camAt(1000, 530, 1.05)], [tSpin + 0.6, camAt(1000, 540, 0.96)], [CUT.trex, camAt(1050, 530, 1.02)]], ease.inOut), t, [[tSpin, 3.6, 5]]);
  const mess = seg(t, tSpin + 0.3, tSpin + 2.6);
  const hop = seg(t, CUT.tornado + 0.1, tSpin);
  const spin = seg(t, tSpin, tSpin + 0.35) * (1 - seg(t, CUT.trex - 0.45, CUT.trex - 0.2));
  const tx = t < tSpin ? 948 : torX(t);
  let seated = seatedFamily(t, { max: false, you: { face: { name: 'shocked', fx: ['sweat'] }, lean: mess > 0 ? -6 : 0, armR: 120, bendR: -60 }, grandpa: { face: { name: 'happy' }, armR: 150 + 10 * Math.sin(t * 6) } }, {});
  let chars = actor('mom', t, { ...MOMC, pan: true, turn: 0.3, face: 'happy' });
  // Biscuit chasing the tornado
  const bx = (t < tSpin ? 1500 : torX(t - 0.45) + 120), bdir = t > tSpin && Math.cos(seg(t - 0.45, tSpin, CUT.trex - 0.25) * Math.PI * 2.2) > 0;
  chars += actor('biscuit', t, { x: bx, y: 992, s: 0.46, pose: 'walk', flip: bdir, t, face: 'happy', ears: 0.2 });
  // Max: hops off the booster, spins into the tornado, pops out onto the table at the end
  let maxSvg = '';
  if (t < tSpin) {
    const mp = seatPos('max', 'max');
    maxSvg = hop <= 0 ? seat('max', t, 'max', { face: 'excited' }) : actor('max', t, { x: lerp(mp.x, 940, hop), y: lerp(mp.y, 990, hop) - 160 * Math.sin(Math.PI * hop), s: 0.45, face: 'excited', armL: 150, armR: 150 });
  }
  const tor = spin > 0.01 ? tornado(tx, 992, 0.5, t, spin, actor('max', t, { x: Math.sin(t * 40) * 20, y: -60, s: 0.45, turn: Math.sin(t * 45), face: { name: 'excited', mouth: 'bigGrin' }, armL: 150, armR: 150, volume: false })) : '';
  const land = seg(t, CUT.trex - 0.3, CUT.trex);
  if (land > 0 && t < CUT.trex) maxSvg = actor('max', t, { x: lerp(tx, MAX_TABLE.x, land), y: lerp(992, 690, land) - 200 * Math.sin(Math.PI * land), s: 0.45, face: 'excited', armL: 150, armR: 150 });
  const set = { mess };
  let o = kitchenShot(t, cam, { set, seated: (t < tSpin ? maxSvg : '') + seated, chars: chars + (t >= tSpin ? maxSvg : '') + tor });
  return o;
}
// ---- 29. MAX: "I'm a T-rex!" — on the table, tiny T-rex arms, chest out
const MAX_TABLE = { x: 1070, y: 700, s: 0.45 };
function shTrex(t) {
  const cam = camKeys(t, [[CUT.trex, camAt(1100, 520, 1.7)], [CUT.rawr, camAt(1090, 510, 1.9)]], ease.inOut);
  const seated = seatedFamily(t, { max: false, you: { face: { name: 'shocked', fx: ['sweat'] }, armR: 20, bendR: -100, lean: 9, turn: -0.3 }, grandpa: { face: 'joy' } });
  const max = S.ellipse(MAX_TABLE.x, MAX_TABLE.y, 70, 12, { fill: '#000', opacity: 0.18 }) + actor('max', t, { ...MAX_TABLE, armL: 20, armR: 20, bendL: -118, bendR: -118, face: { name: 'excited' }, ...boing(t, CUT.trex + 0.05, 0.25) }, { arms: false, energy: 1.4 });
  return kitchenShot(t, cam, { set: { mess: 1 }, seated, chars: max });
}
// ---- 30. "RAWR!" — smash-zoom, claws up, zoom lines; the cereal shakes off the lamp
function shRawr(t) {
  const cam = shakeAll(camKeys(t, [[CUT.rawr, camAt(1060, 480, 2.9)], [CUT.biscuit, camAt(1060, 470, 3.1)]], ease.out), t, [[tRawr, 0.6, 16]]);
  const max = actor('max', t, { ...MAX_TABLE, roar: t > tRawr - 0.1, volume: false, armL: 20, armR: 20, bendL: -118, bendR: -118, face: t > tRawr - 0.1 ? undefined : { name: 'excited' } }, { arms: false, energy: 1.6 });
  let o = kitchenShot(t, cam, { set: { mess: 1 }, seated: seatedFamily(t, { max: false, you: { face: { name: 'scared', fx: ['sweat'] }, lean: 9, turn: -0.3 } }), chars: max });
  o += zoomLines(960, 420, seg(t, tRawr - 0.05, tRawr + 0.1) * (1 - seg(t, CUT.biscuit - 0.2, CUT.biscuit)), t, '#FFFFFF', 22, 420);
  o += K.bang('RAWR!', 1420, 260, pop(t, tRawr, 0.25), 150, -10, '#7CFF6B');
  return o + smash(t, tRawr, 0.1, 0.4);
}
// ---- 31. "And Biscuit." — ears blown back by the roar, then the wag → freeze (sub: "Dog · corgi · round")
const BIS = { x: 1080, y: 992, s: 0.62 };
function shBiscuit(t) {
  const tt = frz(t, tBisF, CUT.good - 0.02);
  const cam = camKeys(tt, [[CUT.biscuit, camAt(1080, 790, 2.0)], [tBisF, camAt(1080, 800, 2.15)]], ease.out);
  const blown = 1 - seg(tt, CUT.biscuit + 0.05, CUT.biscuit + 0.4);
  const dog = actor('biscuit', tt, { ...BIS, t: tt, ears: lerp(1, 0, blown), face: blown > 0.5 ? 'shocked' : 'happy', wag: 1, rot: -6 * blown });
  const live = kitchenShot(tt, cam, { set: { mess: 1 }, chars: dog }) + whip(t, CUT.biscuit, 1, 0.1);
  const face = scr(cam, BIS.x, BIS.y - 422 * BIS.s + 120 * BIS.s);
  return intro(t, live, tBisF, CUT.good - 0.02, { x: 560, y: 200, name: 'BISCUIT', sub: 'Dog · corgi · round', col: '#E8923A', rot: -5 }, face, { ax: 190, ay: 80, tx: -100, ty: -30, bend: 0.3 });
}
// ---- 32. "Biscuit is a very good boy." — push-in, sparkles, a GOOD BOY rosette pins on
function rosette(x, y, s, k) {
  if (k <= 0) return '';
  let c = S.path('M-30 20 L-50 120 L-24 104 L-10 130 L4 30 Z M30 20 L50 120 L24 104 L10 130 L-4 30 Z', ol('#3A7AD8', 5));
  let pet = '';
  for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; pet += `M${f(Math.cos(a) * 56 + 14)} ${f(Math.sin(a) * 56)} a14 14 0 1 0 -28 0 a14 14 0 1 0 28 0 Z `; }
  c += S.path(pet, ol('#FFD21F', 5)) + S.circle(0, 0, 46, ol('#FFF4D0', 5)) + TF('GOOD', 0, -4, 22, '#C8202A') + TF('BOY', 0, 20, 22, '#C8202A');
  return S.g(c, `translate(${f(x)} ${f(y)}) scale(${f(s * ease.outBack(clamp(k, 0, 1)))}) rotate(${f(-8)})`);
}
function shGood(t) {
  const cam = camKeys(t, [[CUT.good, camAt(1080, 800, 2.5)], [CUT.job, camAt(1080, 790, 2.95)]], ease.linear);
  const dog = actor('biscuit', t, { ...BIS, t, face: 'good', wag: 1, look: [0, -0.3] });
  let o = kitchenShot(t, cam, { set: { mess: 1 }, chars: dog + rosette(BIS.x + 4, BIS.y - 150 * BIS.s, 0.62, seg(t, tGoodBoy - 0.1, tGoodBoy + 0.25)) });
  o += K.sparkles([[520, 300, 40], [1400, 260, 46], [1500, 700, 30], [420, 760, 34]], t);
  return o;
}
// ---- 33. "That's his whole job." — Biscuit at his tiny desk: "GOOD BOY · ON DUTY"
function shJob(t) {
  const cam = camKeys(t, [[CUT.job, camAt(1080, 830, 2.3)], [CUT.again, camAt(1080, 830, 2.4)]], ease.inOut);
  const nod = Math.sin((t - CUT.job) * 9) * bump(t, CUT.job + 0.3, CUT.job + 1.1);
  let dog = actor('biscuit', t, { ...BIS, t, face: 'good', wag: 0.4, rot: 4 * nod });
  dog += S.path(`M${BIS.x - 14} ${BIS.y - 158} L${BIS.x + 14} ${BIS.y - 158} L${BIS.x + 9} ${BIS.y - 100} L${BIS.x} ${BIS.y - 88} L${BIS.x - 9} ${BIS.y - 100} Z`, ol('#D7263D', 4)) + S.path(`M${BIS.x - 16} ${BIS.y - 164} L${BIS.x + 16} ${BIS.y - 164} L${BIS.x + 10} ${BIS.y - 150} L${BIS.x - 10} ${BIS.y - 150} Z`, ol('#B01D2A', 4));
  let desk = S.rect(BIS.x - 190, BIS.y - 80, 380, 90, 8, ol('#A8703A', 6)) + S.rect(BIS.x - 200, BIS.y - 94, 400, 26, 6, ol('#C9884A', 6));
  desk += S.g(S.path('M-110 -30 L110 -30 L120 20 L-120 20 Z', ol('#2A2A36', 5)) + TF('GOOD BOY', 0, 2, 26, '#FFD21F') + TF('ON DUTY', 0, 16, 11, '#FFFFFF'), tf(BIS.x - 40, BIS.y - 102, 0.9));
  desk += SH.mug(BIS.x + 140, BIS.y - 94, 0.7, undefined, { col: '#FFFFFF', label: '#1' });
  let o = kitchenShot(t, cam, { set: { mess: 1 }, chars: dog + desk });
  return o + whip(t, CUT.job, -1, 0.1);
}
// ---- 34. GRANDPA: "Did I tell you about seventy-nine?" — he leans in; Max mouths it along; the hero's face is gone
function shAgain(t) {
  const cam = camKeys(t, [[CUT.again, camAt(1250, 480, 1.55)], [CUT.everyday, camAt(1280, 470, 1.7)]], ease.inOut);
  const lean = ease.inOut(seg(t, CUT.again, CUT.again + 0.5));
  const v = K.V.viseme('GRANDPA', t);
  const seated = seatedFamily(t, {
    max: { face: { name: 'neutral', eyes: { upper: 0.5 }, mouth: v ? ({ A: 'line', B: 'smallSmile', C: 'o', D: 'O', E: 'O', F: 'o', G: 'line', H: 'smallSmile', X: 'line' }[v] || 'o') : 'line' }, headRot: 4 * Math.sin(t * 6) },
    you: { face: { name: 'deadpan' }, armR: 20, bendR: -100 },
    grandpa: { lean: -7 * lean, headRot: -6 * lean, armR: 150, bendR: -10, face: { name: 'sneaky' }, glasses: 'up' }, louAct: { arms: false, energy: 1.2 },
  });
  return kitchenShot(t, cam, { seated }) + whip(t, CUT.again, 1, 0.1);
}
// ---- 35-38. YOU: "Every day, Grandpa. Every. Single. Day." — deadpan, then three smash-zooms
function heroTable(t, cam, face, extra = {}) {
  const seated = seatedFamily(t, { you: { face, armR: 30, bendR: -110, volume: cam.zoom > 2.2 ? false : undefined, ...extra }, grandpa: { face: 'happy', lean: -6 }, max: { face: 'neutral' } }, {});
  return kitchenShot(t, cam, { seated });
}
function shEveryday(t) {
  const cam = camKeys(t, [[CUT.everyday, camAt(1260, 470, 2.05)], [CUT.e1, camAt(1240, 460, 2.2)]], ease.inOut);
  return heroTable(t, cam, { name: 'deadpan' }) + whip(t, CUT.everyday, -1, 0.08);
}
function shE(t) {
  const n = t < CUT.e2 ? 0 : t < CUT.e3 ? 1 : 2;
  const t0 = [CUT.e1, CUT.e2, CUT.e3][n];
  const z = [2.6, 3.3, 4.2][n], dx = [-20, 30, 0][n], rot = [-3, 4, 0][n];
  const cam = { ...camKeys(t, [[t0, camAt(1205 + dx, 490 + n * 6, z)], [t0 + 0.7, camAt(1205 + dx, 490 + n * 6, z * 1.04)]], ease.out) };
  let o = heroTable(t, cam, { name: 'deadpan', eyes: { upper: 0.45 + 0.12 * n } });
  if (rot) o = S.g(o, `rotate(${f(rot)} 960 540)`);
  o += zoomLines(960, 450, 0.35 + 0.2 * n, t, '#FFFFFF', 18, 480 - 40 * n);
  if (t > CUT.school - 0.3) o += K.C.pixelWipe(seg(t, CUT.school - 0.3, CUT.school), 'cover');
  return o + smash(t, t0, 0.1, 0.55);
}

// ================================================================= school
const HW = ST.SPOTS.hallway, GY = ST.SPOTS.gym, CR = ST.SPOTS.classroom, CF = ST.SPOTS.cafeteria;
function hallShot(t, cam, o, back, after) { return ST.hallway.compose(t, cam, { crowd: 0.8, ...o }, back || '', after || ''); }
// ---- 39. "At school, there's Benji." — the hallway; Benji hugs his books → freeze (sub: "Best friend") → BFF hop
function shSchool(t) {
  const tt = frz(t, tBenF, tBenOut);
  const cam = camKeys(tt, [[CUT.school, camAt(900, 600, 1.25)], [tBenF, camAt(980, 590, 1.42)], [CUT.sports, camAt(990, 585, 1.48)]], ease.inOut);
  const wk = seg(tt, CUT.school, CUT.school + 1.0);
  const hx = lerp(420, 800, ease.out(wk));
  let main = wk < 1 ? actor('you', tt, { x: hx, y: 960, s: 0.5, view: 'side', flip: true, backpack: true, ...AC.walk((tt - CUT.school) * 9), face: 'happy' }, { arms: false })
    : actor('you', tt, { x: hx, y: 960, s: 0.5, turn: 0.5, backpack: true, face: 'happy', armR: t > tBenOut ? 120 + 20 * Math.sin(t * 10) : 20 });
  main += actor('benji', tt, { x: 1160, y: 960, s: 0.5, turn: -0.45, books: true, t: tt, face: { name: 'joy' }, ...boing(tt, CUT.school + 0.7, 0.15), ...(t > tBenOut ? boing(t, tBenOut, 0.25) : {}) });
  let live = hallShot(tt, cam, { crowd: 0.7 }, '', main) + K.C.pixelWipe(seg(t, CUT.school, CUT.school + 0.4), 'reveal');
  if (t > tBenOut) {
    const p = scr(cam, 980, 460);
    live += S.g(G.heart(0, 0, 50, '#FF6FB5'), tf(p[0], p[1] - 60 * seg(t, tBenOut, tBenOut + 0.6), ease.outBack(seg(t, tBenOut, tBenOut + 0.25))));
    live += K.sparkles([[p[0] - 80, p[1] - 30, 18], [p[0] + 90, p[1] - 50, 20]], t);
  }
  const face = scr(cam, 1160, 960 - 1081 * 0.5 + 250 * 0.5);
  return intro(t, live, tBenF, tBenOut, { x: 520, y: 190, name: 'BENJI', sub: 'Best friend', col: '#7E63C9', rot: -4, subK: seg(t, tBest - 0.15, tBest + 0.15) }, face, { ax: 180, ay: 70, tx: -100, ty: 0, bend: 0.3 });
}
// ---- 40. "He's bad at sports." — gym: a dodgeball, straight to the face
function shSports(t) {
  const cam = shakeAll(camKeys(t, [[CUT.sports, camAt(640, 610, 1.5)], [CUT.math, camAt(620, 600, 1.62)]], ease.inOut), t, [[tSports, 0.35, 12]]);
  const BX = 520, BY = 960;
  const hit = t > tSports;
  const u = seg(t, tSports - 0.55, tSports);
  const ballX = hit ? BX + 40 + 600 * (t - tSports) : lerp(1700, BX + 30, u), ballY = hit ? 560 - 900 * (t - tSports) + 1800 * (t - tSports) ** 2 : lerp(470, 560, u) - 120 * Math.sin(Math.PI * u);
  const wob = hit ? Math.exp(-(t - tSports) * 3) * Math.sin((t - tSports) * 18) : 0;
  let chars = '';
  for (const [i, x] of [[2, 1350], [3, 1560]]) chars += K.draw.kid(i, { x, y: 900, s: 0.46, turn: -0.4, face: hit ? 'shocked' : 'determined', armR: i === 2 && !hit ? 120 : 30 });
  chars += actor('benji', t, { x: BX, y: BY, s: 0.52, turn: 0.4, face: hit ? { name: 'dizzy' } : { name: 'nervous' }, rot: -14 * wob, lean: hit ? -10 : 0, armL: hit ? 60 : 30, armR: hit ? 60 : 30, laces: true, t }, { arms: false });
  chars += X.ball({ x: ballX, y: ballY, s: 1.1, kind: 'dodge', spin: t * 12 });
  let fx = '';
  if (hit) fx += G.hitSpark({ x: BX + 20, y: 560, age: t - tSports, s: 1, text: 'BONK!' }) + G.koStars({ x: BX, y: 400, t, s: 0.8, k: seg(t, tSports + 0.15, tSports + 0.3), birds: false });
  return ST.gym.compose(t, { crowd: 0.8 }, '', chars + fx, cam) + whip(t, CUT.sports, 1, 0.1);
}
// ---- 41. "Bad at math." — at the board: 2 + 2 = 22, very proud; Mrs. Krump's red pen circles it
function shMath(t) {
  const cam = camKeys(t, [[CUT.math, camAt(800, 540, 1.24)], [CUT.laces, camAt(790, 530, 1.32)]], ease.inOut);
  const teach = actor('teacher', t, { x: 1180, y: 1000, s: 0.52, turn: -0.35, armR: 150, bendR: -130, face: { name: 'deadpan' }, glare: 0.6 });
  const benji = actor('benji', t, { x: 660, y: 1000, s: 0.52, turn: 0.25, armL: 125, armR: 30, face: { name: 'joy' }, t, ...boing(t, tMath, 0.12) }, { arms: false });
  let o = ST.classroom.compose(t, { board: ['MATH QUIZ', '2 + 2 = 22'], quiz: true }, ['', '', ''], benji + teach, cam);
  const k = seg(t, tMath - 0.05, tMath + 0.4);
  if (k > 0) {
    const p = scr(cam, 600, 372);
    const L_ = 760;
    o += S.ellipse(p[0], p[1], 130, 58, { fill: 'none', stroke: '#E8243A', 'stroke-width': 12, 'stroke-dasharray': `${f(L_ * k)} ${L_}`, transform: `rotate(-6 ${f(p[0])} ${f(p[1])})` });
    o += TS('?!', p[0] + 170, p[1] - 40, 90 * ease.outBack(seg(t, tMath + 0.3, tMath + 0.5)), '#E8243A');
  }
  return o + whip(t, CUT.math, -1, 0.1);
}
// ---- 42. "Bad at shoelaces." — low angle on the flopping laces; he steps on one → trip, the books fly
function benjiTrip(t, x0) {
  const tr = seg(t, tLace, tLace + 0.45);
  const walkX = lerp(x0, x0 + 520, seg(t, CUT.laces, tLace));
  if (t < tLace) return { svg: actor('benji', t, { x: walkX, y: 960, s: 0.5, view: 'side', flip: true, books: true, ...AC.walk((t - CUT.laces) * 9), face: { name: 'happy' }, t }, { arms: false }), x: walkX };
  const x = walkX + 120 * ease.out(tr);
  return { svg: actor('benji', t, { x, y: 960, s: 0.5, view: 'side', flip: true, books: 'drop', bookFall: tr, rot: 82 * ease.in(tr), lift: 40 * Math.sin(Math.PI * tr), face: { name: 'shocked' }, t }, { arms: false }), x };
}
function shLaces(t) {
  const x0 = 380;
  const fx_ = lerp(x0, x0 + 520, seg(t, CUT.laces, tLace));
  const cam = t < tLace ? camAt(fx_ + 60, 880, 2.3) : camKeys(t, [[tLace, camAt(fx_ + 60, 880, 2.3)], [tLace + 0.35, camAt(980, 760, 1.4)], [CUT.okay, camAt(990, 750, 1.38)]], ease.out);
  const b = benjiTrip(t, x0);
  let o = hallShot(t, cam, { crowd: 0.5 }, '', b.svg);
  if (t > tLace) o += smash(t, tLace, 0.1, 0.3);
  const p = scr(cam, b.x + 40, 950);
  if (t > tLace - 0.1 && t < tLace + 0.6) o += K.bang('!', p[0] + 60, p[1] - 260, pop(t, tLace - 0.05, 0.2), 120, 8, '#FFE14D');
  return o + whip(t, CUT.laces, 1, 0.1);
}
// ---- 43. BENJI: "I'm okay!" — sat down hard, books raining, dizzy, thumb up
function fallingBooks(t, t0, x, y, n = 4) {
  let o = '';
  const cols = ['#E8453C', '#3A7AD8', '#3BB84A', '#F2B84B'];
  for (let i = 0; i < n; i++) {
    const a = t - t0 - i * 0.14;
    if (a < 0) continue;
    const fy = Math.min(y, y - 700 + 1800 * a * a), landed = fy >= y;
    const bx = x + (i - 1.5) * 90;
    o += S.g(S.rect(-60, -18, 120, 36, 5, ol(cols[i % 4], 5)) + S.rect(-60, -18, 16, 36, 3, { fill: '#FFFFFF', opacity: 0.6 }), tf(bx, fy, 1, landed ? (i % 2 ? 8 : -6) : a * 600 + i * 40));
  }
  return o;
}
function shOkay(t) {
  const cam = camKeys(t, [[CUT.okay, camAt(980, 700, 1.55)], [CUT.meant, camAt(990, 690, 1.7)]], ease.out);
  const thumb = ease.outBack(seg(t, B[5].a - 0.1, B[5].a + 0.2));
  const benji = actor('benji', t, { x: 980, y: 960, s: 0.5, fallen: 'sit', freeArms: true, armR: lerp(60, 160, thumb), armL: 80, face: { name: 'dizzy' }, t }, { arms: false });
  let o = hallShot(t, cam, { crowd: 0.25 }, '', benji + fallingBooks(t, CUT.okay - 0.25, 980, 900, 3));
  o += G.koStars({ x: scr(cam, 980, 0)[0], y: scr(cam, 0, 960 - 700 * 0.5)[1], t, s: 0.9, k: 1, birds: true });
  return o;
}
// ---- 44. "I'm okay! I meant to do that!" — springs up, a book lands on his head, TA-DA; one kid claps
function shMeant(t) {
  const cam = camKeys(t, [[CUT.meant, camAt(980, 600, 1.38)], [CUT.nice, camAt(990, 600, 1.45)]], ease.inOut);
  const up = ease.outBack(seg(t, CUT.meant, CUT.meant + 0.3));
  const ta = ease.outBack(seg(t, tThat - 0.15, tThat + 0.1));
  const bookT = CUT.meant + 0.55;
  const bk = seg(t, bookT - 0.3, bookT);
  let benji = actor('benji', t, { x: 980, y: 960, s: 0.5, turn: 0.1, armL: lerp(30, 150, ta), armR: lerp(30, 150, ta), face: ta > 0.3 ? { name: 'joy' } : { name: 'talkHappy' }, t, ...boing(t, CUT.meant + 0.05, 0.2), ...(ta > 0 ? boing(t, tThat, 0.12) : {}) }, { arms: false });
  const top = 960 - 1081 * 0.5;
  const slide = seg(t, B[5].b + 0.3, CUT.nice);
  if (bk > 0) benji += S.g(S.rect(-64, -18, 128, 36, 5, ol('#3A7AD8', 5)) + S.rect(-64, -18, 16, 36, 3, { fill: '#FFFFFF', opacity: 0.6 }), tf(980 + 140 * slide, lerp(top - 500, top - 6, ease.in(bk)) + 300 * slide * slide, 1, -6 + 50 * slide));
  let back = '';
  for (const [i, x] of [[4, 1450], [6, 1640]]) back += K.draw.kid(i, { x, y: 900, s: 0.45, turn: -0.4, face: i === 4 ? 'happy' : 'neutral', armL: i === 4 && t > tThat ? 60 + 30 * Math.abs(Math.sin(t * 14)) : 10, armR: i === 4 && t > tThat ? 60 + 30 * Math.abs(Math.sin(t * 14)) : 10, bendL: i === 4 ? -100 : 0, bendR: i === 4 ? -100 : 0 });
  let o = hallShot(t, cam, { crowd: 0.5 }, back, benji);
  if (bk >= 1 && t < bookT + 0.3) { const p = scr(cam, 980, top); o += G.hitSpark({ x: p[0], y: p[1] - 10, age: t - bookT, s: 0.7 }); }
  if (ta > 0) { const p = scr(cam, 980, 600); o += K.sparkles([[p[0] - 240, p[1] - 160, 30], [p[0] + 250, p[1] - 180, 34]], t) + doodleNote('TA-DA!', p[0] + 330, p[1] - 330, pop(t, tThat, 0.25), 70, 8, '#FFE14D'); }
  return o;
}
// ---- 45. "But he's the nicest person you know." — he hands a little kid her dropped papers; warm glow, hearts
function shNice(t) {
  const cam = camKeys(t, [[CUT.nice, camAt(1060, 620, 1.48)], [CUT.tank, camAt(1060, 610, 1.6)]], ease.linear);
  const give = ease.inOut(seg(t, B[6].a, B[6].a + 0.6));
  let main = actor('you', t, { x: 700, y: 960, s: 0.5, turn: 0.45, face: { name: 'happy' }, armR: 22, bendR: -128, backpack: true });
  main += actor('benji', t, { x: 1040, y: 960, s: 0.5, turn: 0.35, lean: 8 * (1 - give * 0.5), armR: lerp(30, 75, give), bendR: lerp(0, -40, give), armL: 20, face: { name: 'joy' }, t, laces: true }, { arms: false });
  const hb = CAST.handPos('benji', { x: 1040, y: 960, s: 0.5, turn: 0.35, lean: 8 * (1 - give * 0.5), armR: lerp(30, 75, give), bendR: lerp(0, -40, give) }, 1);
  main += S.g(S.rect(-50, -36, 100, 72, 6, ol('#FFFFFF', 4)) + S.path('M-34 -14 h68 M-34 4 h56 M-34 20 h44', ln(4, '#9AA0AE')), tf(hb[0] + 14, hb[1] - 6, 0.9, -8));
  main += K.draw.kid(9, { x: 1320, y: 960, s: 0.4, turn: -0.5, face: give > 0.7 ? 'happy' : 'sad', armL: give > 0.7 ? 60 : 20 });
  let o = hallShot(t, cam, { crowd: 0.1 }, '', main);
  o += S.rect(0, 0, 1920, 1080, 0, { fill: '#FFD08A', opacity: 0.12 });
  const p = scr(cam, 1180, 520);
  o += G.emoteHearts({ x: p[0], y: p[1], age: t - B[6].a - 0.4, n: 6, s: 0.9, life: 1.6 }) + K.sparkles([[p[0] - 260, p[1] - 120, 22], [p[0] + 300, p[1] - 80, 26]], t);
  return o + whip(t, CUT.nice, 1, 0.1);
}

// ================================================================= the cafeteria — Tank
const HERO_C = { ...CF.heroSeat }, BEN_C = { ...CF.benjiSeat }, TANK_C = { x: 1080, y: 1000, s: 0.5 };
const BAG = { x: 880, y: 874 };
function cafShot(t, cam, o = {}) {
  const front = o.front || '', lane = o.lane || '';
  return ST.cafeteria.compose(t, { heroTray: false, crowd: 1, ...(o.set || {}) }, [o.back || '', front, ''], lane, cam);
}
function tableKids(t, o = {}) {
  let s = actor('benji', t, { ...BEN_C, turn: 0.35, face: o.bFace || 'happy', laces: true, t, ...(o.b || {}) }, o.bAct || {});
  s += actor('you', t, { ...HERO_C, turn: 0.3, face: o.yFace || 'happy', ...(o.y || {}) }, o.yAct || {});
  if (o.bag !== false) s += X.lunchBag({ x: BAG.x, y: BAG.y - 230 * 0.5, s: 0.5, name: 'YOU' });
  return s;
}
// ---- 46. "And then there's Tank." — a huge shadow falls over the table; he looms → freeze (sub: ███ redacted)
function shTank(t) {
  const tt = frz(t, tTankF, CUT.file - 0.02);
  const cam = camKeys(tt, [[CUT.tank, camAt(820, 740, 1.55)], [wb(7, 'then') + 0.4, camAt(900, 620, 1.3)], [tTankF, camAt(960, 590, 1.32)]], ease.inOut);
  const sh = ease.inOut(seg(tt, wb(7, 'then'), wb(7, 'then') + 0.6));
  const look = seg(tt, wb(7, 'then') + 0.2, wb(7, 'then') + 0.7);
  const front = tableKids(tt, { yFace: look > 0.5 ? { name: 'scared', fx: ['sweat'] } : 'happy', bFace: look > 0.5 ? { name: 'scared' } : 'happy', y: { headRot: -10 * look }, b: { headRot: -8 * look } });
  const tx = lerp(1700, TANK_C.x, ease.out(seg(tt, wb(7, 'then'), tTankF - 0.1)));
  const lane = actor('tank', tt, { ...TANK_C, x: tx, turn: -0.4, face: { name: 'angry' }, ...AC.walkFront(tt * 6, 1 - seg(tt, tTankF - 0.4, tTankF)) });
  let live = cafShot(tt, cam, { front, lane });
  live += S.rect(0, 0, 1920, 1080, 0, { fill: '#1A1030', opacity: f(0.32 * sh) });
  const face = scr(cam, TANK_C.x, TANK_C.y - 1237 * 0.5 + 190 * 0.5);
  return intro(t, live, tTankF, CUT.file - 0.02, { x: 520, y: 200, name: 'TANK', sub: 'Real name: unknown', col: '#3B3F4A', rot: -4, redact: seg(t, tTankF + 0.55, tTankF + 0.95) }, face, { ax: 160, ay: 70, tx: -90, ty: 0, bend: 0.3 }) + whip(t, CUT.tank, 1, 0.1);
}
// ---- 47. "Nobody knows much about Tank." — low angle; his FILE slides in, every line redacted
const tFileW = () => [wb(7, 'Nobody'), wb(7, 'knows'), wb(7, 'much'), wb(7, 'Tank', 1)];
function tankLow(t, cam, extra = {}) {
  const lane = actor('tank', t, { ...TANK_C, turn: -0.2, face: { name: 'angry' }, volume: false, ...extra });
  const front = tableKids(t, { yFace: { name: 'scared', fx: ['sweat'] }, bFace: { name: 'scared' } });
  return cafShot(t, cam, { front, lane }) + S.rect(0, 0, 1920, 1080, 0, { fill: '#1A1030', opacity: 0.3 });
}
function shFile(t) {
  const cam = camKeys(t, [[CUT.file, camAt(1260, 520, 1.5)], [CUT.big, camAt(1250, 500, 1.6)]], ease.inOut);
  const crack = Math.sin((t - CUT.file) * 10) * bump(t, CUT.file + 0.2, CUT.file + 1.2);
  let o = tankLow(t, cam, { armL: 24 + 6 * crack, armR: 24 - 6 * crack, bendL: -120, bendR: -120 });
  const ws = tFileW();
  const rows = ws.reduce((n, w0) => n + seg(t, w0 - 0.05, w0 + 0.2), 0);
  o += tankFile({ x: 1440, y: 470, t, k: pop(t, CUT.file + 0.05, 0.35), rows });
  return o;
}
// ---- 48. "Except that he's big." — tilt from the boots to the head; BIG stamped on the file
function shBig(t) {
  const cam = camKeys(t, [[CUT.big, camAt(1080, 930, 2.1)], [tBig - 0.05, camAt(1080, 520, 1.7)], [CUT.hungry, camAt(1080, 510, 1.62)]], ease.inOut);
  const gb = boing(t, tBig, 0.12);
  let o = tankLow(t, cam, { face: { name: 'angry' }, sx: gb.sx * (t > tBig ? 1.05 : 1), sy: gb.sy * (t > tBig ? 1.05 : 1) });
  o += S.g(tankFile({ x: 0, y: 0, t, k: 1, rows: 4, big: seg(t, tBig - 0.05, tBig + 0.4) }), 'translate(1610 330) scale(0.62)');
  return o + smash(t, tBig, 0.1, 0.3);
}
// ---- 49. "And he's always hungry." — the stomach growls (rumble rings); his eyes slide to the lunch bag
function shHungry(t) {
  const cam = shakeAll(camKeys(t, [[CUT.hungry, camAt(1080, 700, 2.1)], [tHungry - 0.1, camAt(1060, 640, 1.85)], [CUT.lunch, camAt(1000, 600, 1.55)]], ease.inOut), t, [[tHungry, 0.5, 8]]);
  const look = seg(t, tHungry + 0.1, tHungry + 0.4);
  let o = tankLow(t, cam, { face: { name: 'sad', eyes: { look: [lerp(0, -0.8, look), 0.6 * look] } }, armL: 20, armR: 22, bendR: -120 });
  const p = scr(cam, 1080, 1000 - 560 * 0.5 * 1.35 * 0.7);
  const r = seg(t, tHungry - 0.2, tHungry + 0.6);
  if (r > 0 && r < 1) for (let i = 0; i < 3; i++) { const q = clamp(r * 1.4 - i * 0.2, 0, 1); if (q > 0 && q < 1) o += S.ellipse(p[0], p[1], 60 + 220 * q, 30 + 110 * q, { fill: 'none', stroke: '#FFFFFF', 'stroke-width': 10 * (1 - q), opacity: f(1 - q) }); }
  o += K.bang('GRRRMBL…', p[0] + 330, p[1] - 120, pop(t, tHungry - 0.1, 0.25) * (1 - seg(t, CUT.lunch - 0.2, CUT.lunch)), 74, -6, '#FFB84A');
  return o;
}
// ---- 50. TANK: "Lunch." — he leans over the table, palm out
function shLunch(t) {
  const cam = camKeys(t, [[CUT.lunch, camAt(930, 600, 1.45)], [CUT.now, camAt(950, 590, 1.55)]], ease.inOut);
  const lean = ease.out(seg(t, CUT.lunch, B[8].a + 0.3));
  const lane = actor('tank', t, { ...TANK_C, turn: -0.4, lean: -8 * lean, armL: lerp(20, 70, lean), bendL: lerp(0, -40, lean), face: { name: 'angry' } }, { arms: false });
  const front = tableKids(t, { yFace: { name: 'scared', fx: ['sweat'] }, bFace: { name: 'scared' }, y: { headRot: -8 }, b: { headRot: -8, lean: -6 } });
  return cafShot(t, cam, { front, lane }) + S.rect(0, 0, 1920, 1080, 0, { fill: '#1A1030', opacity: 0.25 });
}
// ---- 51. "Now." — smash-zoom; the table rattles
function shNow(t) {
  const cam = shakeAll(camKeys(t, [[CUT.now, camAt(1070, 470, 2.8)], [CUT.sure, camAt(1070, 470, 3.0)]], ease.out), t, [[wb(8, 'Now'), 0.45, 14]]);
  const lane = actor('tank', t, { ...TANK_C, turn: -0.3, lean: -8, armL: 70, bendL: -40, volume: false, face: { name: 'angry', mouth: undefined } }, { arms: false });
  let o = cafShot(t, cam, { front: tableKids(t, { yFace: 'scared', bFace: 'scared' }), lane }) + S.rect(0, 0, 1920, 1080, 0, { fill: '#2A0A14', opacity: 0.3 });
  o += zoomLines(960, 420, 0.8, t, '#FFFFFF', 20, 420);
  return o + smash(t, CUT.now, 0.1, 0.5);
}
// ---- 52. YOU: "Sure. Yep." — the bag is in Tank's hand before the word is out
function shSure(t) {
  const cam = camKeys(t, [[CUT.sure, camAt(900, 640, 1.5)], [CUT.turkey, camAt(910, 630, 1.55)]], ease.inOut);
  const give = ease.outBack(seg(t, B[9].a - 0.05, B[9].a + 0.22));
  const hp = { ...HERO_C, turn: 0.45, armR: lerp(20, 95, give), bendR: lerp(-100, -10, give) };
  const front = tableKids(t, { bag: false, yFace: { name: 'happy', mouth: undefined, fx: ['sweat'] }, bFace: { name: 'scared' }, y: { armR: hp.armR, bendR: hp.bendR } , yAct: { arms: false } });
  const hh = CAST.handPos('you', hp, 1);
  const bag = X.lunchBag({ x: hh[0] + 10, y: hh[1] - 20, s: 0.5, name: 'YOU' });
  const lane = actor('tank', t, { ...TANK_C, turn: -0.4, lean: -6, armL: 70, bendL: -40, face: { name: 'neutral' } }, { arms: false });
  return cafShot(t, cam, { front: front + bag, lane }) + S.rect(0, 0, 1920, 1080, 0, { fill: '#1A1030', opacity: 0.2 });
}
// ---- 53. "Enjoy. It's turkey." — out comes the sandwich, presented like a waiter; Tank takes it, sniffs
function shTurkey(t) {
  const cam = camKeys(t, [[CUT.turkey, camAt(920, 620, 1.55)], [CUT.walk, camAt(940, 610, 1.6)]], ease.inOut);
  const pres = ease.outBack(seg(t, wb(9, 'Enjoy') - 0.1, wb(9, 'Enjoy') + 0.25));
  const take = seg(t, wb(9, 'turkey') + 0.3, wb(9, 'turkey') + 0.6);
  const hp = { ...HERO_C, turn: 0.45, armR: lerp(30, 80, pres), bendR: lerp(-100, -30, pres) };
  const front = tableKids(t, { bag: false, yFace: { name: 'happy', fx: ['sweat'] }, bFace: { name: 'scared' }, y: { armR: hp.armR, bendR: hp.bendR, armL: 100, bendL: 60 }, yAct: { arms: false } });
  const hh = CAST.handPos('you', hp, 1);
  let props = '';
  if (take < 1) props += X.sandwich({ x: lerp(hh[0] + 40, 1010, take), y: lerp(hh[1] - 40, 640, take), s: 0.72, rot: -8 + 8 * Math.sin(t * 6) });
  if (take < 1 && t > wb(9, 'Enjoy')) props += K.sparkles([[hh[0] + 120, hh[1] - 110, 18], [hh[0] - 20, hh[1] - 120, 14]], t);
  const lane = actor('tank', t, take >= 1 ? { ...TANK_C, turn: -0.4, sandwich: true, face: { name: 'confused' } } : { ...TANK_C, turn: -0.4, lunch: true, lunchName: 'YOU', face: { name: 'confused' }, headRot: -6 * bump(t, wb(9, 'turkey') - 0.3, wb(9, 'turkey') + 0.3) });
  return cafShot(t, cam, { front, lane: lane + props }) + S.rect(0, 0, 1920, 1080, 0, { fill: '#1A1030', opacity: 0.15 });
}
// ---- 54. (beat) Tank walks off with the lunch, CHOMP; they watch him go
function shWalk(t) {
  const cam = camKeys(t, [[CUT.walk, camAt(1000, 640, 1.2)], [CUT.oneday, camAt(1180, 640, 1.15)]], ease.inOut);
  const x = lerp(TANK_C.x + 60, 2100, seg(t, CUT.walk, CUT.oneday + 0.3));
  const bite = seg(t, CUT.walk + 0.5, CUT.walk + 0.7);
  const lane = actor('tank', t, { ...TANK_C, x, view: 'side', flip: true, ...AC.walk((t - CUT.walk) * 7), sandwich: true, bite: 0.4 * bite, face: { name: 'neutral' } }, { arms: false });
  const front = tableKids(t, { bag: false, yFace: { name: 'sad' }, bFace: { name: 'sad' }, y: { turn: 0.6, headRot: 4 }, b: { turn: 0.6 } });
  let o = cafShot(t, cam, { front, lane });
  if (bite > 0 && bite < 1) { const p = scr(cam, x + 60, 470); o += K.bang('CHOMP', p[0] + 80, p[1] - 30, pop(t, CUT.walk + 0.5, 0.2), 64, -8, '#FFFFFF'); }
  return o;
}
// ---- 55. BENJI (whispering): "One day, we'll stand up to him." — a determined little fist
function shOneday(t) {
  const cam = camKeys(t, [[CUT.oneday, camAt(660, 760, 2.0)], [CUT.notToday, camAt(670, 750, 2.15)]], ease.inOut);
  const fist = ease.outBack(seg(t, wb(10, 'stand') - 0.1, wb(10, 'stand') + 0.2));
  const front = tableKids(t, { bag: false, bFace: { name: 'determined' }, b: { turn: 0.55, lean: 6, armL: 150, bendL: -150, armR: lerp(20, 120, fist), bendR: lerp(0, 60, fist) }, bAct: { arms: false }, yFace: { name: 'determined' }, y: { turn: -0.2, headRot: 4 * Math.sin(t * 3) } });
  return cafShot(t, cam, { front, set: { crowd: 0.6 } });
}
// ---- 56. "Probably not today. But one day." — Tank glances back → they drop behind the table; two fists pop up
function shNotToday(t) {
  const cam = camKeys(t, [[CUT.notToday, camAt(1060, 700, 1.28)], [CUT.night, camAt(1090, 700, 1.32)]], ease.inOut);
  const glance = bump(t, wb(10, 'Probably') - 0.2, wb(10, 'today') + 0.5);
  const duck = ease.inOut(seg(t, wb(10, 'Probably'), wb(10, 'Probably') + 0.25));
  const pop1 = ease.outBack(seg(t, wb(10, 'But') - 0.05, wb(10, 'But') + 0.2)), pop2 = ease.outBack(seg(t, wb(10, 'one', 1) - 0.05, wb(10, 'one', 1) + 0.2));
  const sink = 330 * duck;
  let front = actor('benji', t, { ...BEN_C, y: BEN_C.y + sink, turn: 0.5, face: { name: 'scared' }, laces: true, t });
  front += actor('you', t, { ...HERO_C, y: HERO_C.y + sink, turn: 0.5, face: { name: 'scared', fx: ['sweat'] } });
  // fists over the table edge
  const fistSvg = (x, k) => (k > 0.01 ? S.g(S.rect(-34, -40, 68, 80, 16, ol(x < 650 ? '#B07450' : '#FFFFFF', 6)) + S.path('M-20 -14 h40 M-20 4 h40 M-20 22 h40', ln(4, '#8A5A3A', 0.6)), tf(x, 860 - 50 * k, k * 1.3)) : '');
  let fists = fistSvg(560, pop1) + fistSvg(770, pop2);
  if (pop2 > 0.5) fists += K.sparkles([[520, 700, 20], [820, 690, 22]], t);
  const tx = lerp(1560, 1900, seg(t, CUT.notToday, CUT.night - 0.3));
  const lane = actor('tank', t, glance > 0.3 ? { ...TANK_C, x: tx, turn: -0.7, sandwich: true, bite: 0.4, face: { name: 'sneaky' } } : { ...TANK_C, x: tx, view: 'side', flip: true, ...AC.walk(t * 7), sandwich: true, bite: 0.4 });
  return cafShot(t, cam, { front, lane: lane + fists }) + (t > CUT.night - 0.3 ? K.C.pixelWipe(seg(t, CUT.night - 0.3, CUT.night), 'cover', true) : '');
}
// ================================================================= night: the wish
// ---- 57. YOU: "If only I knew how strong everyone REALLY was." — night POV, blue light, the game's tidy levels on his face
function shNight(t) {
  const cam = camKeys(t, [[CUT.night, { zoom: 1.12, y: -10 }], [CUT.careful, { zoom: 1.2, y: -18 }]], ease.linear);
  const flop = ease.out(seg(t, tReally - 0.1, tReally + 0.35));
  const pose = { armL: 24, armR: 24, bendL: -118, bendR: -118, lean: -5 * flop, bodyY: 16 * flop, headRot: lerp(-4, 8, flop), face: { name: flop > 0.5 ? 'angry' : 'sad' } };
  let o = povShot(t, cam, { time: 'night', pose, light: '#4A8CFF', lk: 0.22, act: { energy: 0.9 } });
  o += K.C.pixelWipe(seg(t, CUT.night, CUT.night + 0.4), 'reveal', true);
  return o;
}
// ---- 58. NARRATOR (ominous): "Be careful what you wish for." — wide from behind; the monitor flickers; slow push in (→ SC 03)
const FLICK = [];
{ const tc = wb(12, 'careful'); FLICK.push(tc, tWish, B[12].b + 0.5, B[12].b + 1.55, B[12].b + 2.5, END - 0.42); }
function flickAt(t) { let k = 0; for (const a of FLICK) k = Math.max(k, bump(t, a - 0.02, a + 0.22)); return k; }
function nightScreen(t, fk) {
  return (w, h) => {
    const gcam = camAt(1720, 640, 1.3);
    let g = SH.frameIn(gameFrame(t, gcam, GM.goblin(1720, GW.ground, 1, t, {}) + GM.lvBadge(1720, GW.ground - 420, 50, 'GOBLIN', 1), { night: true }), w, h);
    if (fk > 0.02) {
      let st = '';
      const step = Math.floor(t * 30);
      for (let i = 0; i < 9; i++) { const yy = -h / 2 + hash(i * 3 + step) * h, hh = 4 + hash(i + step) * 18; st += `M${f(-w / 2)} ${f(yy)} h${w} v${f(hh)} h${-w} Z`; }
      g += S.path(st, { fill: '#DFF6FF', opacity: f(0.75 * fk) }) + S.rect(-w / 2, -h / 2, w, h, 0, { fill: '#0A1030', opacity: f(0.45 * fk) });
    }
    return g;
  };
}
function shCareful(t) {
  const cam = camKeys(t, [[CUT.careful, { zoom: 1.0, x: 0, y: 0 }], [B[12].b + 0.4, { zoom: 1.35, x: 180, y: -70 }], [END, { zoom: 1.85, x: 300, y: -120 }]], ease.inOut);
  const fk = flickAt(t);
  const hero = actor('you', t, SH.seatPose(SPB.chair, 1, { headRot: -4 + 3 * Math.sin(t * 0.8) }));
  let o = bedroomShot(t, cam, { set: { time: 'night', pcScreen: nightScreen(t, fk), glow: 1 - 0.7 * fk, glowCol: 'blue', led: fk < 0.5, lamp: 0 }, behind: hero });
  o += dim(0.25 * fk + 0.1 * seg(t, B[12].b, END), '#05071A');
  return o;
}

// ================================================================= dispatch
const SHOTS = [
  [CUT.open, shOpen], [CUT.dive, shDive], [CUT.meadow, shMeadow], [CUT.enemy, shEnemy], [CUT.item, shItem], [CUT.strong, shStrong],
  [CUT.goblin, shGoblin], [CUT.dragon, shDragon], [CUT.run, shRun], [CUT.phew, shPhew], [CUT.real, shReal],
  [CUT.kitchen, shKitchen], [CUT.think, shThink], [CUT.mom, shMom], [CUT.works, shWorks], [CUT.smile, shSmile], [CUT.morning, shMorning], [CUT.prob, shProb],
  [CUT.cupcakes, shCupcakes], [CUT.asked, shAsked], [CUT.lou, shLou], [CUT.same, shSame], [CUT.g79, shG79], [CUT.finals, shFinals], [CUT.legend, shLegend],
  [CUT.max, shMax], [CUT.five, shFive], [CUT.tornado, shTornado], [CUT.trex, shTrex], [CUT.rawr, shRawr], [CUT.biscuit, shBiscuit], [CUT.good, shGood], [CUT.job, shJob],
  [CUT.again, shAgain], [CUT.everyday, shEveryday], [CUT.e1, shE],
  [CUT.school, shSchool], [CUT.sports, shSports], [CUT.math, shMath], [CUT.laces, shLaces], [CUT.okay, shOkay], [CUT.meant, shMeant], [CUT.nice, shNice],
  [CUT.tank, shTank], [CUT.file, shFile], [CUT.big, shBig], [CUT.hungry, shHungry], [CUT.lunch, shLunch], [CUT.now, shNow], [CUT.sure, shSure], [CUT.turkey, shTurkey],
  [CUT.walk, shWalk], [CUT.oneday, shOneday], [CUT.notToday, shNotToday],
  [CUT.night, shNight], [CUT.careful, shCareful],
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
  if (t < CUT.dive) return { grade: 'warm', vignette: 0.55 };
  if (t >= CUT.meadow && t < CUT.phew) return { grade: null, vignette: 0.3 };
  if (t >= CUT.finals && t < CUT.legend) return { grade: null, vignette: 0.7 };
  if (t >= CUT.tank && t < CUT.night) return { grade: t < CUT.walk ? 'cool' : 'warm', vignette: 0.6 };
  if (t >= CUT.school && t < CUT.tank) return { grade: 'warm', vignette: 0.35 };
  if (t >= CUT.night) return { grade: 'night', vignette: 0.75 };
  return { grade: 'warm', vignette: 0.45 };
}
const BEATS = {
  T0, END, tYou, tYouOut, tE, tI, tStrong, tEasy, tDragon, tRun, tMomF, tMomOut, tBakery, tSmiles, tProb, tSunrise, tLouF, tLouOut, t79, tLegend,
  tMaxF, tMaxOut, tBro, tSpin, tRawr, tBisF, tGoodBoy, tBenF, tBenOut, tSports, tMath, tLace, tThat, tTankF, tBig, tHungry, tReally, tWish, FLICK,
  tStop: CUT.kitchen + 1.0, tOff: wa(3, 'But'), tUp: wa(3, 'life') + 0.05, tReady: wa(5, 'ready'), tThink: [wa(3, 'never'), wa(3, 'know'), wa(3, 'anyone'), wa(3, 'thinking')],
  tWorks: [wa(4, 'works'), wa(4, 'all'), wa(4, 'day')], tStrongW: [wa(1, 'You'), wa(1, 'always'), wa(1, 'know'), wa(1, "who's"), tStrong],
  tFileW: tFileW(), tBookHead: CUT.meant + 0.55, tStand: wb(10, 'stand'), tDuck: wb(10, 'Probably'), tFist: [wb(10, 'But'), wb(10, 'one', 1)],
  tGive: B[9].a, tEnjoy: wb(9, 'Enjoy'), tTake: wb(9, 'turkey') + 0.45, tBite: CUT.walk + 0.5, tCrack: CUT.file + 0.2, tNice: B[6].a,
};
module.exports = { scene, look, DEFS: E.DEFS, SHOTS, CUT, BEATS };
