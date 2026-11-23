// SC 05 · MOM IN THE ARENA (295.63 … 366.11). The hero ditches the family in the plaza ("Practice jumping!") and runs to
// the Battle Arena; Mom (the grey default avatar) follows, "just watching" (split-screen: real Mom on the couch | avatar);
// a player bonks her → her slow-motion reflex combo (dodge, triple hit, CRIT, TRIPLE COMBO!, the player flies out of the
// arena into a twinkle star, his sword sticks in the sand); "Muscle memory."; the truth: the camera pushes into the
// ARCADE QUEEN photo on the living-room wall → a 1998 VHS tape of teen Mom winning the state arcade finals → it freezes
// into a polaroid that flies back onto the wall; "I retired. For you."; TEN MINUTES LATER the leaderboard roll #500 →
// #50 → #1 while her avatar upgrades (grey → pot lid + sword → golden armour); the caring KO montage ("Nice try,
// honey!" / "Sit up straight!" / "Did you eat breakfast?"), a hundred KOs, water bottles for everyone; DarkBlade's
// challenge → one flick → he flies out ("Good game! Don't forget to stretch!"); Noodle: "YOUR MOM IS A LEGEND!";
// "…I'm the legend." → real Mom sips her tea, perfectly calm.
'use strict';

const K = require('./kit');
const G = require('./gameui');
const R = require('./respawn');
const GS = require('./sets_game');
const X = require('../rig/extras');
const CAST = require('../rig/cast');
const AC = require('./acting');
const E = require('./s05_env');
const { S, f, clamp, lerp, ease, seg, bump, hash, ol, ln, T, TF, camKeys, view, actor } = K;
const { L } = K.V;
const { tf, TS, TFS, pop, sc, shakeAll, boing, whip, smash, zoomLines, streaks, letterbox, panel, panelTag, room, FROG } = E;
const camAt = GS.camAt, toScr = GS.toScreen;
const AS = GS.SPOTS.arena, arS = AS.sAt;
const PZ = GS.SPOTS.plaza, pzS = PZ.sAt;

const A = Array.from({ length: 16 }, (_, i) => L('05.' + i));
const T0 = K.V.scene('SC 05').start, END = K.V.scene('SC 06').start;     // == main.js RANGES for SC 05
const w = (i, word, n = 0) => A[i].word(word, n).t0;
const w1 = (i, word, n = 0) => A[i].word(word, n).t1;

// ================================================================= the cut list (all from the voice)
const CUT = {};
CUT.tree = T0;
CUT.jump = w(0, 'Practice') - 0.12;
CUT.run = w(0, "I'll") - 0.1;
CUT.arena = A[1].a;
CUT.relax = w(1, 'nobody') - 0.12;
CUT.momIn = w(1, 'But') - 0.08;
CUT.split = A[2].a - 0.18;
CUT.sneak = A[3].a - 0.05;
CUT.glare = w1(3, 'sword') - 0.45;
CUT.slow = w(3, 'And') - 0.1;
CUT.hits = w(3, 'hit', 1) - 0.18;
const tH1 = w(3, 'hit', 1), tH3 = w1(3, 'back') + 0.05, tH2 = (tH1 + tH3) / 2;
const tFly = tH3 + 0.14;
CUT.fly = tH3 + 0.32;
CUT.stick = tFly + 1.45;
CUT.how = A[4].a - 0.1;
CUT.muscle = A[5].a - 0.1;
CUT.truth = A[6].a - 0.05;
CUT.vhs1 = w(6, 'In') - 0.12;
CUT.vhs2 = w(6, 'your') - 0.1;
CUT.vhs3 = w(6, 'champion') - 0.4;
CUT.photo = A[6].b + 0.05;
CUT.queen = A[7].a - 0.45;
CUT.retired = w(7, 'retired') - 0.3;
CUT.forYou = w(7, 'For') - 0.1;
CUT.later = A[8].a - 0.05;
CUT.board = w(8, 'later') - 0.02;
CUT.pose = A[8].b - 0.05;
CUT.nice = A[9].a - 0.45;
CUT.sit = w(9, 'Sit') - 0.32;
CUT.bfast = w(9, 'Did') - 0.32;
CUT.hundred = A[10].a - 0.05;
CUT.hydra = w(10, 'And') - 0.15;
CUT.dark = A[10].b + 0.12;
CUT.now = w(11, 'Right') - 0.08;
CUT.okay = A[12].a - 0.1;
CUT.duel = A[12].b + 0.05;
const tPunch = A[13].a - 1.15;                                  // the flick: DarkBlade's twinkle lands on "Good game!"
CUT.stretch = w(13, "Don't") - 0.1;
CUT.legend = A[14].a - 0.1;
CUT.me = A[15].a - 0.12;
CUT.tea = A[15].b + 0.12;
{
  const ks = Object.keys(CUT);
  for (let i = 1; i < ks.length; i++) if (CUT[ks[i]] < CUT[ks[i - 1]] + 0.2) CUT[ks[i]] = CUT[ks[i - 1]] + 0.2;
}
// beats inside shots
const tOut = T0 + 0.1;                                          // the hero bursts out of the tree
const tHood = w(0, 'You') - 0.05;                               // pulls the hood off
const tHitMom = w(3, 'hit');                                    // the sneak attack on Mom
const tSwing2 = w(3, 'And');                                    // the attacker's second (slow) swing she dodges
const tStick = CUT.stick + 0.28;                                // his sword sticks in the sand
const tGlint = w(6, 'truth');
const tRoll0 = CUT.board + 0.05, tRoll1 = lerp(CUT.board, w1(8, 'one'), 0.5), tOne = w1(8, 'one');
const tNice = w(9, 'Nice'), tTap = w(9, 'Sit') + 0.02, tStraight = w(9, 'straight'), tTopple = w1(9, 'straight') + 0.05, tBowl = w(9, 'breakfast');
const KO0 = A[10].a + 0.1, KO1 = w1(10, 'players');
const tHydra = w(10, 'hydrated');
const tCharge = CUT.duel + 0.32;

// ================================================================= small shared helpers
const you = (t, p, a = {}) => actor('you', t, { nametag: 'YOU', crown: true, ...p }, a);
const momG = (t, p, a = {}) => actor('momAvatar', t, { armor: 0, t, ...p }, a);
const momA = (t, p, a = {}) => actor('momAvatar', t, { armor: 1, t, ...p }, a);
const ply = (i, t, p) => actor('player', t, { i, t, ...p });
const MOM_H = 906, GOLD_H = 1192, YOU_H = 946;
// screen-space chat bubble over a world point (wx, wy = the head top) seen through cam
function bubbleAt(t, cam, wx, wy, lineId, o = {}) {
  const p = toScr(cam, wx, wy);
  return G.chatBubble({ x: p.x + (o.dx || 0), y: p.y - (o.gap ?? 28), t, s: o.s ?? 1, tail: o.tail ?? 0, user: o.user, caps: o.caps, col: o.col, size: o.size, ...G.chatLine(t, lineId, o), ...(o.k !== undefined ? { k: o.k } : {}) });
}
function arenaShot(t, cam, o = {}, chars = '', over = '', behind = '') {
  const Ly = GS.arena.layers(t, cam, { crowd: o.crowd ?? 1, cheer: o.cheer ?? 0.25, signs: o.signs, board: o.board, near: o.near, flash: o.flash });
  return Ly.bg + (behind ? view(cam, behind) : '') + Ly.mid + view(cam, chars) + Ly.front + (over ? view(cam, over) : '') + Ly.fg + Ly.light;
}
function plazaShot(t, cam, behind = '', chars = '', over = '', frontTf = null) {
  const Ly = GS.plaza.layers(t, cam, { time: 'day' });
  return Ly.bg + Ly.mid + (behind ? view(cam, behind) : '') + (frontTf ? S.g(Ly.front, frontTf) : Ly.front) + view(cam, chars + over) + Ly.fg + Ly.light;
}
const dim = (k, col = '#1A0B2E') => (k > 0 ? S.rect(0, 0, 1920, 1080, 0, { fill: col, opacity: f(k) }) : '');
const coolTint = (k) => (k > 0 ? S.rect(0, 0, 1920, 1080, 0, { fill: '#5AA8FF', opacity: f(0.12 * k) }) + S.rect(0, 0, 1920, 1080, 0, { fill: '#0A1040', opacity: f(0.12 * k) }) : '');
// sparring pairs in the background of the ring (players with swords trading blows)
function sparring(t, pairs) {
  let o = '', fx = '';
  pairs.forEach(([x, y, i, j], n) => {
    const s = arS(y), ph = t * 5 + n * 1.7, a = Math.sin(ph), b = Math.sin(ph + Math.PI);
    o += ply(i, t, { x: x - 85 * s / 0.3, y, s, turn: 0.6, sword: true, armR: 90 + 60 * a, face: 'determined', nametag: false });
    o += ply(j, t, { x: x + 85 * s / 0.3, y, s, turn: -0.6, sword: 'steel', armR: 90 + 60 * b, face: 'angry', nametag: false });
    const age = ((ph / (Math.PI * 2)) % 1) * 1.0;
    fx += G.slash({ x, y: y - 520 * s, age: age * 0.9, angle: -30, s: s * 1.6, col: '#FFFFFF' });
  });
  return o + fx;
}
const FAMILY = { dad: { x: -170, y: 930 }, mom: { x: 40, y: 915 }, gran: { x: 230, y: 935 } };

// ================================================================= SHOTS
// ---- 1. "Okay! You guys... stay here!" — the hero bursts out of the hiding tree, hood off, palms out at the family
function shTree(t) {
  const cam = camKeys(t, [[CUT.tree, camAt(-560, 650, 1.32)], [tOut + 0.4, camAt(-520, 650, 1.26)], [w(0, 'stay') - 0.05, camAt(-260, 640, 0.98)], [CUT.jump, camAt(-240, 640, 1.02)]]);
  const u = ease.outBack(seg(t, tOut, tOut + 0.38));
  const hx = lerp(-620, -460, u), hy = lerp(962, 958, u), hs = pzS(960);
  const stay = seg(t, w(0, 'stay') - 0.1, w(0, 'stay') + 0.1), you_ = seg(t, w(0, 'You'), w(0, 'You') + 0.15);
  const pose = {
    x: hx, y: hy, s: hs, turn: 0.45, hood: t < tHood, ...boing(t, tOut + 0.3, 0.2),
    armL: t < w(0, 'You') ? 150 * bump(t, tOut, w(0, 'You')) : lerp(20, 62 + 8 * Math.sin(t * 14), stay),
    armR: t < w(0, 'You') ? 150 * bump(t, tOut, w(0, 'You')) : lerp(lerp(20, 82, you_), 62 + 8 * Math.sin(t * 14 + 1), stay),
    face: { name: 'nervous', fx: ['sweat'] },
  };
  const hero = you(t, pose, { arms: false });
  let fam = '';
  const ds = pzS(FAMILY.dad.y), ms = pzS(FAMILY.mom.y), gs = pzS(FAMILY.gran.y);
  fam += actor('dadAvatar', t, { x: FAMILY.dad.x, y: FAMILY.dad.y, s: ds, turn: -0.4, armR: 120 * seg(t, w(0, 'here'), w(0, 'here') + 0.2), face: 'happy' });
  fam += momG(t, { x: FAMILY.mom.x, y: FAMILY.mom.y, s: ms, turn: -0.4, armR: 140 + 20 * Math.sin(t * 9), face: 'happy' });
  fam += actor('grandmaAvatar', t, { x: FAMILY.gran.x, y: FAMILY.gran.y, s: gs, turn: -0.4, face: 'happy', headRot: 6 * Math.sin(t * 3) });
  let fx = '';
  if (t >= tHood && t < tHood + 0.4) fx += K.C.burst(hx, hy - 900 * hs, seg(t, tHood, tHood + 0.4), '#FFFFFF');
  if (t >= tOut && t < tOut + 0.4) fx += K.C.burst(hx - 60, hy - 500 * hs, seg(t, tOut, tOut + 0.4), '#7CFF6B');
  const behind = t < tOut + 0.16 ? hero : '';
  const rustle = 1 - seg(t, tOut + 0.1, tOut + 0.4);
  const frontTf = rustle > 0 ? `translate(${f(7 * rustle * Math.sin(t * 60))} ${f(3 * rustle * Math.sin(t * 47))})` : null;
  return plazaShot(t, cam, behind, fam + (behind ? '' : hero), fx, frontTf);
}

// ---- 2. "Practice jumping!" — Mom and Granny hop high, the hot dog manages 6 px
function shJump(t) {
  const tJ = w(0, 'jumping');
  const cam = shakeAll(camKeys(t, [[CUT.jump, camAt(-120, 700, 1.5)], [CUT.run, camAt(-140, 700, 1.58)]]), t, [[tJ + 0.05, 0.25, 6]]);
  const ds = pzS(FAMILY.dad.y), ms = pzS(FAMILY.mom.y), gs = pzS(FAMILY.gran.y);
  const crouch = seg(t, CUT.jump + 0.1, tJ - 0.05) * (1 - seg(t, tJ, tJ + 0.12));
  const dadLift = 7 * bump(t, tJ, tJ + 0.22);
  const dad = actor('dadAvatar', t, { x: FAMILY.dad.x, y: FAMILY.dad.y, s: ds, turn: -0.15, kneeL: 40 * crouch, kneeR: 40 * crouch, legL: -20 * crouch, legR: -20 * crouch, bodyY: 34 * crouch, lift: dadLift, armL: 30 + 40 * crouch, armR: 30 + 40 * crouch, face: t > tJ + 0.25 ? { name: 'confused', fx: ['question'] } : 'determined' });
  const mLift = 190 * bump(t, tJ - 0.02, tJ + 0.5), gLift = 150 * bump(t, tJ + 0.06, tJ + 0.56);
  const mom = momG(t, { x: FAMILY.mom.x, y: FAMILY.mom.y, s: ms, lift: mLift, armL: 150 * (mLift > 5 ? 1 : 0.2), armR: 150 * (mLift > 5 ? 1 : 0.2), face: 'joy', ...boing(t, tJ + 0.48, 0.18) });
  const gran = actor('grandmaAvatar', t, { x: FAMILY.gran.x, y: FAMILY.gran.y, s: gs, lift: gLift, coins: gLift > 10 ? 0.8 : 0, face: 'joy', ...boing(t, tJ + 0.56, 0.18) });
  let fx = '';
  fx += K.bang('boing.', FAMILY.dad.x + 120, FAMILY.dad.y - 60, pop(t, tJ + 0.1, 0.2) * (1 - seg(t, tJ + 0.7, tJ + 0.9)), 50, -8, '#FFFFFF');
  if (t > tJ + 0.25) fx += G.keycap({ x: FAMILY.dad.x, y: FAMILY.dad.y - 1240 * ds - 120, w: 260, h: 74, label: 'SPACE?', size: 34, k: seg(t, tJ + 0.25, tJ + 0.45), t });
  return plazaShot(t, cam, '', dad + mom + gran, fx);
}

// ---- 3. "I'll be in the arena!" — sprint off to the left past the tree; the family waves
function shRun(t) {
  const u = ease.in(seg(t, CUT.run + 0.05, CUT.arena));
  const hx = lerp(-460, -1500, u), hy = 975, hs = pzS(hy);
  const cam = camKeys(t, [[CUT.run, camAt(-420, 640, 1.05)], [CUT.arena, camAt(-980, 640, 1.08)]]);
  const hero = you(t, { x: hx, y: hy, s: hs, view: 'side', ...AC.run((t - CUT.run) * 19, 1.1), lean: -8 }, { arms: false });
  let fam = '';
  const wave = (ph) => 140 + 25 * Math.sin(t * 12 + ph);
  fam += actor('dadAvatar', t, { x: FAMILY.dad.x, y: FAMILY.dad.y, s: pzS(FAMILY.dad.y), turn: -0.5, armR: wave(0), face: 'happy' });
  fam += momG(t, { x: FAMILY.mom.x, y: FAMILY.mom.y, s: pzS(FAMILY.mom.y), turn: -0.5, armR: wave(1), face: 'happy' });
  fam += actor('grandmaAvatar', t, { x: FAMILY.gran.x, y: FAMILY.gran.y, s: pzS(FAMILY.gran.y), turn: -0.5, face: 'happy' });
  let fx = '';
  for (let k = 0; k < 6; k++) { const t0 = CUT.run + 0.1 + k * 0.2; fx += K.C.dust(lerp(-460, -1500, ease.in(seg(t0, CUT.run + 0.05, CUT.arena))) + 40, hy, t0, t); }
  let o = plazaShot(t, cam, '', fam + hero, fx);
  o += streaks(t, 300, 900, 10, 3, '#FFFFFF', 0.35 * u, 2600, 1);
  return o + whip(t, CUT.arena, -1);
}

// ---- 4. "You ran to the Battle Arena," — he sprints in, skids to a stop in the middle of the ring
function shArena(t) {
  const tStop = CUT.arena + 1.45;
  const cam = camKeys(t, [[CUT.arena, { x: -260, y: -40, zoom: 0.86 }], [tStop, camAt(880, 640, 1.06)], [CUT.relax, camAt(900, 640, 1.1)]]);
  const u = ease.out(seg(t, CUT.arena, tStop));
  const hx = lerp(-200, 940, u), hy = 880, hs = arS(hy);
  const running = t < tStop - 0.08;
  const hero = running ? you(t, { x: hx, y: hy, s: hs, view: 'side', flip: true, ...AC.run((t - CUT.arena) * 18, 1.1 - 0.6 * u), lean: 6 }, { arms: false })
    : you(t, { x: hx, y: hy, s: hs, face: { name: 'happy', eyes: { type: 'closed' } }, armL: 20, armR: 20, ...boing(t, tStop, 0.18) }, { arms: false });
  const bg = sparring(t, [[600, 770, 4, 8], [1330, 760, 6, 12]]);
  let fx = K.C.dust(hx - 40, hy, tStop - 0.15, t) + K.C.dust(hx - 80, hy, tStop - 0.05, t);
  return arenaShot(t, cam, { cheer: 0.3 }, bg + hero, fx) + whip(t, CUT.arena, -1);
}

// ---- 5. "...where nobody could embarrass you." — relief, a big stretch, then the LVL 99 pose with the gold sword
function shRelax(t) {
  const tPose = w(1, 'embarrass') - 0.05;
  const cam = shakeAll(camKeys(t, [[CUT.relax, camAt(940, 640, 1.3)], [tPose, camAt(940, 630, 1.42)], [tPose + 0.12, camAt(940, 610, 1.58)], [CUT.momIn, camAt(940, 610, 1.62)]]), t, [[tPose, 0.3, 10]]);
  const hs = arS(880);
  const stretch = bump(t, w(1, 'nobody') - 0.05, tPose);
  const posed = t >= tPose;
  const hero = you(t, {
    x: 940, y: 880, s: hs, sword: posed ? 'gold' : false, swordGlow: posed ? 0.6 + 0.4 * Math.sin(t * 8) : 0,
    armL: posed ? 24 : 20 + 145 * stretch, armR: posed ? 150 : 20 + 145 * stretch, lean: posed ? -3 : 0,
    face: posed ? { name: 'smug', fx: ['sparkles'] } : { name: 'happy', eyes: { type: 'closed' } }, ...boing(t, tPose, 0.16),
  }, { arms: false });
  const bg = sparring(t, [[560, 770, 4, 8], [1360, 760, 6, 12]]);
  let fx = K.C.burst(940, 880 - 1000 * hs, seg(t, tPose, tPose + 0.5), '#FFE14D');
  return arenaShot(t, cam, { cheer: 0.3 + 0.6 * seg(t, tPose, tPose + 0.3), signs: posed ? ['YOU!', 'LVL 99', 'LEGEND'] : undefined, board: ['YOU', 'LEGEND'] }, bg + hero, fx) + smash(t, tPose, 0.1, 0.4);
}

// ---- 6. "But Mom followed you." — eyes closed, humming… Mom pops in behind him with a wave; his eyes snap open
function shMomIn(t) {
  const tMom = w(1, 'Mom'), tSnap = w(1, 'followed');
  const hx = 1180, hy = 880, hs = arS(hy);
  const cam = shakeAll(camKeys(t, [[CUT.momIn, camAt(880, 640, 1.22)], [tSnap - 0.02, camAt(900, 640, 1.26)], [tSnap + 0.08, camAt(1180, 560, 2.05)], [A[1].b + 0.1, camAt(1180, 560, 2.1)], [A[1].b + 0.55, camAt(830, 640, 1.22)], [CUT.split, camAt(810, 640, 1.26)]], ease.out), t, [[tSnap, 0.3, 12]]);
  const walk = seg(t, A[1].b + 0.2, CUT.split);
  const mx = lerp(470, 700, walk), my = lerp(770, 820, walk), ms = arS(my);
  let chars = '';
  if (t >= tMom) chars += momG(t, { x: mx, y: my, s: ms, ...AC.walkFront(t * 9, walk > 0 && walk < 1 ? 1 : 0), armR: 150 + 20 * Math.sin(t * 11), face: 'happy', ...boing(t, tMom, 0.25) }, { arms: false });
  const open = t >= tSnap;
  const turn = lerp(0, -0.75, ease.inOut(seg(t, A[1].b + 0.15, CUT.split - 0.3)));
  chars += you(t, {
    x: hx, y: hy, s: hs, turn, armL: open ? 30 : 160, armR: open ? 30 : 160, bodyY: open ? 0 : 4 * Math.sin(t * 6),
    face: open ? { name: t > A[1].b + 0.15 ? 'scared' : 'shocked', fx: ['sweat'] } : { name: 'happy', eyes: { type: 'closed' } }, ...boing(t, tSnap, 0.2),
  }, { arms: false });
  let over = '';
  if (t >= tMom) {
    over += K.C.burst(mx, my - 500 * ms, seg(t, tMom, tMom + 0.45), '#FF5FA8');
    over += G.emoteHearts({ x: mx + 60, y: my - 950 * ms, age: t - tMom, n: 6, s: 0.6, life: 1.4 });
  }
  if (!open) over += K.C.musicNotes(t, hx + 70, hy - 1020 * hs);
  let o = arenaShot(t, cam, { cheer: 0.2 }, chars, over);
  o += zoomLines(960, 420, bump(t, tSnap, tSnap + 0.7), t, '#FFFFFF', 22, 420);
  return o + smash(t, tSnap, 0.1, 0.5);
}

// ---- 7. MOM: "Don't mind me, sweetie. I'm just watching." — split: real Mom on the couch | her grey avatar at the ring
function shSplit(t) {
  const sipS = t > w(2, 'watching') - 0.1 && t < A[2].b + 0.6;
  const roomIn = room(t, camAt(1320, 560, 1.95), { mom: { mugUp: sipS }, momAct: { face: 'happy', arms: !sipS }, you: false, dad: false });
  const cam = camKeys(t, [[CUT.split, camAt(1060, 660, 1.36)], [CUT.sneak, camAt(1060, 650, 1.44)]]);
  let chars = '';
  // the hero (back to the ring) slowly face-palms while Mom waves at him
  const palm = ease.inOut(seg(t, A[2].a + 0.6, A[2].a + 1.3));
  chars += you(t, { x: 1270, y: 820, s: arS(820), turn: -0.3, armR: lerp(20, 165, palm), armL: 20, headRot: 10 * palm, face: { name: palm > 0.5 ? 'deadpan' : 'nervous', fx: ['sweat'] }, nametag: false }, { arms: false });
  chars += momG(t, { x: 930, y: 900, s: arS(900), turn: 0.2, armR: 120 + 20 * Math.sin(t * 9), face: { name: 'happy', mouth: 'smile' }, nametag: false }, { arms: false });
  let gameIn = arenaShot(t, cam, { cheer: 0.25 }, chars);
  gameIn += G.nametag({ who: 'mom', ...(() => { const p = toScr(cam, 930, 900 - MOM_H * arS(900)); return { x: p.x, y: p.y - 30 }; })(), s: 0.9, t });
  gameIn += bubbleAt(t, cam, 930, 900 - MOM_H * arS(900), '05.2', { gap: 96, s: 0.95, tail: -0.55, hold: 1.0 });
  const k0 = seg(t, CUT.split, CUT.split + 0.3), k1 = seg(t, CUT.split + 0.1, CUT.split + 0.4);
  let o = S.rect(0, 0, 1920, 1080, 0, { fill: '#1E2A44' }) + S.path(Array.from({ length: 16 }, (_, i) => `M${i * 160 - 400} 1080 L${i * 160 + 200} 0`).join(' '), ln(40, '#24345A'));
  o += panel(36, 36, 912, 900, roomIn, { k: k0, dx: 0, dy: -40 }) + panel(972, 36, 912, 900, gameIn, { k: k1, dy: -40 });
  o += (k0 > 0.6 ? panelTag(60, 60, 'REAL LIFE', '#FF8A2B') : '') + (k1 > 0.6 ? panelTag(996, 60, 'CUBE CITY', '#17C3B2') : '');
  return o;
}

// ---- 8. "Then someone hit Mom with a sword." — a player tiptoes up behind her and BONK
function shSneak(t) {
  const cam = shakeAll(camKeys(t, [[CUT.sneak, camAt(640, 640, 1.32)], [CUT.glare, camAt(680, 630, 1.42)]]), t, [[tHitMom, 0.3, 14]]);
  const mx = 720, my = 900, ms = arS(my);
  const hitK = bump(t, tHitMom, tHitMom + 0.5);
  const after = t > tHitMom + 0.5;
  let chars = '';
  chars += you(t, { x: 1150, y: 800, s: arS(800), turn: -0.5, sword: 'gold', armR: 60, face: t > tHitMom ? { name: 'shocked', fx: ['exclaim'] } : 'neutral' }, { arms: false });
  chars += ply(16, t, { x: 1420, y: 770, s: arS(770), turn: -0.4, face: t > tHitMom ? { name: 'shocked', mouth: 'O' } : 'neutral', nametag: false });
  chars += momG(t, { x: mx, y: my, s: ms, turn: 0.55, rot: -9 * hitK, headRot: 18 * hitK, face: t > tHitMom ? (after ? 'deadpan' : 'oof') : 'happy', armL: 14 + 30 * hitK, armR: 14 + 30 * hitK }, { arms: false });
  // the attacker: tiptoe in from the left (side view, facing right), raise, swing
  const ax = lerp(260, 500, ease.inOut(seg(t, CUT.sneak + 0.05, tHitMom - 0.4)));
  const raise = seg(t, tHitMom - 0.42, tHitMom - 0.08), swing = seg(t, tHitMom - 0.08, tHitMom + 0.05);
  const armR = t < tHitMom - 0.08 ? lerp(40, 175, raise) : lerp(175, 50, ease.in(swing));
  const tiptoe = t < tHitMom - 0.4 ? AC.walk((t - CUT.sneak) * 7, 1.2) : {};
  chars += ply(11, t, { x: ax, y: my, s: ms, view: 'side', flip: true, sword: true, ...tiptoe, armL: armR, armR: tiptoe.armR ?? 30, face: after ? 'smug' : 'sneaky', nametag: false, bodyY: (tiptoe.bodyY || 0) - 10 });
  const hx = mx - 30, hy = my - MOM_H * ms + 40;
  let fx = G.slash({ x: hx, y: hy + 20, age: t - tHitMom + 0.06, angle: 200, s: 0.9 }) + G.hitSpark({ x: hx, y: hy, age: t - tHitMom, text: 'BONK!', s: 0.9 }) + G.damageNumber({ x: hx + 90, y: hy - 30, age: t - tHitMom - 0.05, value: -10, s: 0.85 });
  return arenaShot(t, cam, { cheer: 0.25 }, chars, fx);
}

// ---- 9. (…with a sword.) — close-up: the glasses glint, the smile is gone
function shGlare(t) {
  const mx = 720, my = 900, ms = arS(my);
  const cam = camKeys(t, [[CUT.glare, camAt(720, 600, 2.25)], [CUT.slow, camAt(720, 590, 2.75)]], ease.inOut);
  const mom = momG(t, { x: mx, y: my, s: ms, turn: lerp(0.55, -0.25, ease.inOut(seg(t, CUT.glare, CUT.glare + 0.45))), face: { name: 'determined', eyes: { look: [-0.6, 0] } }, nametag: false, volume: false }, { arms: false });
  let o = arenaShot(t, cam, { cheer: 0 }, mom);
  o += dim(0.25 * seg(t, CUT.glare, CUT.glare + 0.3), '#2A0A30');
  // the glint across both lenses
  const g = seg(t, CUT.glare + 0.35, CUT.glare + 0.7);
  if (g > 0 && g < 1) {
    const p = toScr(cam, mx, my - 690 * ms);
    o += K.F.sparkle(p.x - 120 + 260 * g, p.y - 20, 60 * Math.sin(g * Math.PI)) + K.F.sparkle(p.x - 40 + 200 * g, p.y + 10, 34 * Math.sin(g * Math.PI));
  }
  o += zoomLines(960, 520, 0.8 * seg(t, CUT.glare + 0.2, CUT.glare + 0.5), t, '#FFFFFF', 24, 520);
  return o + letterbox(seg(t, CUT.slow - 0.35, CUT.slow));
}

// ---- 10. "And Mom..." — SLOW MOTION: the second swing; she bends back under it (afterimages)
function shSlow(t) {
  const cam = camKeys(t, [[CUT.slow, camAt(600, 650, 1.45)], [CUT.hits, camAt(640, 640, 1.58)]], ease.linear);
  const my = 900, ms = arS(my);
  const sw = seg(t, tSwing2 - 0.05, tSwing2 + 0.75);
  const dodge = ease.inOut(seg(t, tSwing2 + 0.05, tSwing2 + 0.5)) * (1 - ease.inOut(seg(t, CUT.hits - 0.15, CUT.hits)));
  const mom = (tt, d) => momG(tt, { x: 720 + 30 * d, y: my, s: ms, view: 'side', lean: 42 * d, bodyY: 30 * d, kneeL: 30 * d, kneeR: 30 * d, legL: 10 * d, legR: -14 * d, armL: -40 * d, armR: 60 * d, face: 'determined', nametag: false }, { arms: false });
  let chars = '';
  chars += ply(11, t, { x: 470, y: my, s: ms, view: 'side', flip: true, sword: true, armL: lerp(170, 20, ease.inOut(sw)), armR: 30, lean: 10 * sw, face: 'angry', nametag: false });
  // afterimages of Mom (ghosts at earlier dodge values)
  for (const [lag, op] of [[0.18, 0.18], [0.09, 0.3]]) {
    const d2 = ease.inOut(seg(t - lag, tSwing2 + 0.05, tSwing2 + 0.5));
    if (Math.abs(d2 - dodge) > 0.04) chars += S.g(mom(t, d2), null, { opacity: f(op) });
  }
  chars += mom(t, dodge);
  let fx = G.slash({ x: 690, y: my - 640 * ms, age: (t - tSwing2) * 0.35, angle: -100, s: 1.1, col: '#BFF6FF', r: 220 });
  let o = arenaShot(t, cam, { cheer: 0 }, chars, fx);
  o += coolTint(1) + streaks(t * 0.25, 120, 960, 12, 7, '#FFFFFF', 0.25, 2600, 1);
  const rp = ((t - CUT.slow) * 1.2) % 1;
  o += S.circle(960, 540, 200 + 900 * rp, { fill: 'none', stroke: '#FFFFFF', 'stroke-width': f(10 * (1 - rp)), opacity: f(0.35 * (1 - rp)) });
  return o + letterbox(1);
}

// ---- 11. "...hit back." — the triple combo: one, two, CRIT (TRIPLE COMBO!)
function shHits(t) {
  const my = 900, ms = arS(my);
  const cam = shakeAll(camKeys(t, [[CUT.hits, camAt(620, 640, 1.62)], [tH3, camAt(640, 620, 1.72)], [CUT.fly, camAt(640, 620, 1.8)]], ease.out), t, [[tH1, 0.2, 10], [tH2, 0.2, 12], [tH3, 0.45, 26]]);
  const p1 = bump(t, tH1 - 0.06, tH1 + 0.2), p2 = bump(t, tH2 - 0.06, tH2 + 0.2), p3 = seg(t, tH3 - 0.08, tH3 + 0.02);
  const mom = momG(t, { x: 720 - 40 * p1 - 40 * p2, y: my, s: ms, view: 'side', armR: t < tH3 - 0.08 ? 20 + 75 * p1 : lerp(20, 170, p3), armL: 20 + 80 * p2, lean: 10 * (p1 + p2) - 8 * p3, lift: 40 * p3, face: { name: 'determined' }, nametag: false }, { arms: false });
  const rec = (k) => seg(t, k, k + 0.12);
  const ax = 470 - 26 * rec(tH1) - 26 * rec(tH2);
  const att = ply(11, t, { x: ax, y: my, s: ms, view: 'side', flip: true, sword: true, armR: 30, rot: -10 * (rec(tH1) - rec(tH1 + 0.3)) - 12 * (rec(tH2) - rec(tH2 + 0.3)), lift: 30 * rec(tH3), face: t > tH1 ? 'oof' : 'shocked', nametag: false });
  const hx = 560, hy = my - 620 * ms;
  let fx = '';
  fx += G.slash({ x: hx, y: hy, age: t - tH1, angle: 170, s: 0.8 }) + G.hitSpark({ x: hx, y: hy, age: t - tH1 - 0.05, s: 0.8, text: 'POW!' }) + G.damageNumber({ x: hx - 40, y: hy - 90, age: t - tH1 - 0.08, value: -25, s: 0.85 });
  fx += G.slash({ x: hx, y: hy + 40, age: t - tH2, angle: 10, dir: -1, s: 0.8, col: '#FFD23F' }) + G.hitSpark({ x: hx, y: hy + 40, age: t - tH2 - 0.05, s: 0.8, seed: 3 }) + G.damageNumber({ x: hx - 70, y: hy - 60, age: t - tH2 - 0.08, value: -40, s: 0.85, seed: 2 });
  fx += G.slash({ x: hx + 10, y: hy - 30, age: t - tH3, angle: 120, s: 1.1, col: '#FF8A2B', r: 220 }) + G.hitSpark({ x: hx, y: hy - 40, age: t - tH3 - 0.03, s: 1.2, seed: 5 }) + G.damageNumber({ x: hx - 120, y: hy - 230, age: t - tH3 - 0.06, value: -999, crit: true, s: 1.0, seed: 4 });
  let o = arenaShot(t, cam, { cheer: 0 }, att + mom, fx);
  const slowK = 1 - seg(t, tH3, tH3 + 0.15);
  o += coolTint(slowK) + letterbox(slowK);
  o += G.comboText({ x: 1220, y: 250, k: seg(t, tH3, tH3 + 0.4), t, count: 3, s: 0.66 });
  return o + smash(t, tH3, 0.12, 0.85);
}

// ---- 12. (K.O.) — wide: he rockets out of the arena into a twinkle star; everyone freezes
function shFly(t) {
  const cam = camKeys(t, [[CUT.fly, { x: -40, y: -90, zoom: 0.86 }], [CUT.stick, { x: 60, y: -150, zoom: 0.9 }]], ease.out);
  const my = 900, ms = arS(my);
  let chars = '';
  const frozen = [[330, 770, 2, -0.5], [1120, 780, 5, -0.6], [1420, 830, 9, -0.8], [1600, 770, 13, -0.7]];
  frozen.forEach(([x, y, i, tu]) => { chars += ply(i, t, { x, y, s: arS(y), turn: tu, face: { name: 'shocked', mouth: 'O', fx: ['sweat'] }, armL: 20, armR: 26, nametag: false }); });
  chars += you(t, { x: 1350, y: 900, s: arS(900), turn: -0.6, face: { name: 'shocked', mouth: 'O' }, sword: 'gold', armR: 30 }, { arms: false });
  chars += momG(t, { x: 720, y: my, s: ms, view: 'side', armR: 170 - 120 * seg(t, tFly + 0.6, tFly + 1.2), lift: 40 * (1 - seg(t, tFly, tFly + 0.3)), face: 'determined', nametag: false }, { arms: false });
  const flyer = ply(11, t, { x: 0, y: 0, s: ms, face: 'dizzy', nametag: false, armL: 150, armR: 150, legL: 30, legR: -30 });
  const fx = G.knockoutFly({ x0: 470, y0: my - 40, age: t - tFly, dir: 1, svg: flyer, cy: 260 * ms / 0.5, x1: 1520, y1: 150, s: ms, arc: 60 });
  let o = arenaShot(t, cam, { cheer: 0 }, chars, fx);
  o += K.bang('K.O.!', 470, 420, pop(t, tFly + 0.05, 0.25) * (1 - seg(t, CUT.stick - 0.3, CUT.stick)), 150, -8, '#FF4B5C');
  o += G.comboText({ x: 860, y: 190, k: seg(t, tH3, tH3 + 0.4), out: seg(t, CUT.stick - 0.35, CUT.stick), t, count: 3, s: 0.6 });
  return o;
}

// ---- 13. (silence) — his sword spins down and sticks in the sand; frozen players
function shStick(t) {
  const cam = shakeAll(camAt(1150, 720, 1.65), t, [[tStick, 0.3, 12]]);
  let chars = '';
  chars += ply(5, t, { x: 1380, y: 860, s: arS(860), turn: -0.5, face: { name: 'shocked', mouth: 'O', fx: ['sweat'] }, armL: 22, armR: 24, nametag: false });
  chars += ply(9, t, { x: 900, y: 840, s: arS(840), turn: 0.5, face: { name: 'scared', fx: ['sweat2'] }, armL: 12, armR: 12, sword: t < tStick + 0.2 ? 'steel' : false, nametag: false });
  // the falling sword (spins in from the top) then sticks upright
  const u = seg(t, CUT.stick, tStick);
  const sx = lerp(1260, 1150, u), sy = lerp(80, 690, ease.in(u)), rot = t < tStick ? 720 * u + 180 : 172 + 8 * Math.exp(-(t - tStick) * 8) * Math.sin((t - tStick) * 40);
  const sword = X.goldSword({ x: sx, y: sy, s: 0.6, rot, kind: 'steel' }) + (t >= tStick ? S.ellipse(1166, 884, 46, 14, ol('#E9C987', 4)) : '');
  // the other player's sword slips from his hand and clatters
  const dropped = t >= tStick + 0.2 ? X.goldSword({ x: 860, y: lerp(720, 880, seg(t, tStick + 0.2, tStick + 0.45)), s: 0.42, rot: lerp(0, 85, seg(t, tStick + 0.2, tStick + 0.45)), kind: 'steel' }) : '';
  let fx = K.C.dust(1110, 880, tStick, t) + K.C.dust(1170, 884, tStick + 0.04, t);
  fx += K.bang('THUNK!', 900, 560, pop(t, tStick, 0.18), 70, -8, '#FFFFFF');
  return arenaShot(t, cam, { cheer: 0 }, chars + dropped + sword, fx);
}

// ---- 14. YOU: "Mom... how did you DO that?" — close-up; smash-zoom on DO
function shHow(t) {
  const tDo = w(4, 'DO');
  const hx = 1000, hy = 900, hs = arS(hy);
  const cam = shakeAll(camKeys(t, [[CUT.how, camAt(1000, 600, 2.1, 960, 470)], [tDo - 0.02, camAt(1000, 600, 2.28, 960, 470)], [tDo + 0.08, camAt(1000, 600, 2.75, 960, 450)], [CUT.muscle, camAt(1000, 600, 2.8, 960, 450)]], ease.out), t, [[tDo, 0.3, 14]]);
  const hero = you(t, { x: hx, y: hy, s: hs, turn: -0.25, volume: false, nametag: false, armL: 25 + 40 * seg(t, tDo - 0.1, tDo + 0.05), armR: 25 + 40 * seg(t, tDo - 0.1, tDo + 0.05), face: { name: 'shocked', fx: ['sweat'] } }, { energy: 1.3, arms: false });
  let o = arenaShot(t, cam, { cheer: 0 }, hero);
  o += zoomLines(960, 560, bump(t, tDo, tDo + 0.6), t, '#FFFFFF', 24, 520);
  return o + smash(t, tDo, 0.1, 0.5);
}

// ---- 15. MOM: "Oh. Muscle memory." — modest shrug, pushes her glasses up; two players bow
function shMuscle(t) {
  const mx = 820, my = 900, ms = arS(my);
  const cam = camKeys(t, [[CUT.muscle, camAt(820, 640, 1.6)], [CUT.truth, camAt(820, 630, 1.72)]]);
  const tM = w(5, 'Muscle');
  const shrug = bump(t, w(5, 'Oh') - 0.05, tM);
  const push = seg(t, tM, tM + 0.25) * (1 - seg(t, A[5].b - 0.1, A[5].b + 0.2));
  let chars = '';
  // two players bow to her (side view, facing her, bending forward)
  const bow1 = ease.inOut(seg(t, CUT.muscle + 0.1, CUT.muscle + 0.5)), bow2 = ease.inOut(seg(t, CUT.muscle + 0.3, CUT.muscle + 0.7));
  chars += ply(3, t, { x: 450, y: 820, s: arS(820), view: 'side', flip: true, lean: 38 * bow1, headRot: 12 * bow1, bodyY: 10 * bow1, face: 'amazed', armL: -20 * bow1, armR: -20 * bow1, nametag: false });
  chars += ply(14, t, { x: 1210, y: 830, s: arS(830), view: 'side', lean: -38 * bow2, headRot: -12 * bow2, bodyY: 10 * bow2, face: 'amazed', armL: -20 * bow2, armR: -20 * bow2, nametag: false });
  chars += momG(t, { x: mx, y: my, s: ms, turn: 0.1, armL: 20 + 25 * shrug, armR: lerp(20 + 25 * shrug, 158, push), headRot: -6 * shrug, face: { name: 'happy', fx: push > 0.5 ? ['blush'] : [] }, nametag: false }, { arms: false });
  let o = arenaShot(t, cam, { cheer: 0.1 }, chars, push > 0.5 ? K.F.sparkle(mx + 40, my - 700 * ms, 26 * Math.abs(Math.sin(t * 9))) : '');
  o += bubbleAt(t, cam, mx, my - MOM_H * ms, '05.5', { gap: 70, s: 1.2, tail: 0.2, hold: 1 });
  return o;
}

// ---- 16. "That's when you learned the truth." — real life: the hero turns to Mom (tea); push into the ARCADE QUEEN photo
const PHOTO = { x: 1112, y: 196 };
const LRS_YOU = E.LRS.seats.you;
function shTruth(t) {
  const cam = camKeys(t, [[CUT.truth, camAt(980, 560, 1.22)], [tGlint - 0.05, camAt(1040, 470, 1.4)], [tGlint + 0.12, camAt(PHOTO.x, PHOTO.y + 10, 2.7)], [CUT.vhs1 - 0.25, camAt(PHOTO.x, PHOTO.y, 4.2)], [CUT.vhs1, camAt(PHOTO.x, PHOTO.y, 8.5)]], ease.inOut);
  const turn = lerp(0.42, 0.85, ease.inOut(seg(t, CUT.truth + 0.1, CUT.truth + 0.8)));
  const sip = t > CUT.truth + 0.5 && t < tGlint - 0.1;
  let o = room(t, cam, { you: { turn, face: { name: 'confused', fx: ['question'] } }, mom: { mugUp: sip, face: { name: 'happy', eyes: sip ? { type: 'closed' } : undefined } } });
  const g = seg(t, tGlint, tGlint + 0.5);
  if (g > 0 && g < 1) { const p = toScr(cam, PHOTO.x + 30, PHOTO.y - 50); o += K.F.sparkle(p.x, p.y, 120 * Math.sin(g * Math.PI)); }
  o += zoomLines(960, 540, 0.7 * bump(t, tGlint, tGlint + 0.8), t, '#FFFFFF', 22, 460);
  return o + K.C.whiteFlash(seg(t, CUT.vhs1 - 0.18, CUT.vhs1)) + smash(t, tGlint + 0.05, 0.1, 0.3);
}

// ---- 17-19. 1998 — the camcorder tape: the finals, NEW RECORD!, the trophy on the stage (ARCADE QUEEN)
const KIDS_L = [[520, 905, 0, 0.36], [380, 930, 3, 0.38], [660, 925, 5, 0.37]], KIDS_R = [[1400, 905, 1, 0.36], [1540, 930, 4, 0.38], [1260, 925, 6, 0.37]];
function kidCrowd(t, list, mood, look = 0) {
  return list.map(([x, y, i, s], j) => {
    const b = Math.abs(Math.sin(t * 9 + j * 1.7));
    const pose = mood === 'cheer' ? { armL: 150 + 20 * b, armR: 140 + 20 * Math.abs(Math.sin(t * 9 + j)), lift: 26 * b, face: j % 2 ? 'excited' : 'joy' } : { armL: 14, armR: 14, face: { name: 'amazed', mouth: 'O' }, turn: look };
    return CAST.draw.humanKid(i, { x, y, s, ...pose });
  }).join('');
}
function handheld(t, cam, amp = 1) {
  return { ...cam, sx: (cam.sx || 0) + amp * (7 * Math.sin(t * 2.3) + 4 * Math.sin(t * 5.1)), sy: (cam.sy || 0) + amp * (5 * Math.sin(t * 1.9 + 1) + 3 * Math.sin(t * 4.3)), rot: 0 };
}
function vhsFrame(t, inner, mode = 'play') {
  return inner + E.tapeTint(1) + E.vhsOSD(t, { mode });
}
function shVhs1(t) {
  const cam = handheld(t, camKeys(t, [[CUT.vhs1, camAt(960, 560, 1.0)], [CUT.vhs2, camAt(960, 540, 1.12)]]));
  const Ly = E.arcade(t, cam);
  const score = Math.round(lerp(999870, 999999, ease.out(seg(t, CUT.vhs1 + 0.1, CUT.vhs2 - 0.35))));
  const mash = Math.sin(t * 34);
  let chars = E.champScreen(t, score, 1, { record: score >= 999999 });
  chars += kidCrowd(t, KIDS_L, t > CUT.vhs2 - 0.35 ? 'cheer' : 'watch', 0.5) + kidCrowd(t, KIDS_R, t > CUT.vhs2 - 0.35 ? 'cheer' : 'watch', -0.5);
  chars += actor('momTeen', t, { x: 960, y: 930, s: 0.44, view: 'back', armL: 40 + 10 * mash, armR: 40 - 10 * mash, bodyY: 3 * Math.abs(mash) }, { arms: false });
  let o = Ly.bg + Ly.mid + view(cam, chars);
  return vhsFrame(t, o) + K.C.whiteFlash(0.8 * (1 - seg(t, CUT.vhs1, CUT.vhs1 + 0.22)));
}
function shVhs2(t) {
  const tTurn = CUT.vhs2 + 0.12;
  const cam = handheld(t, camKeys(t, [[CUT.vhs2, camAt(960, 640, 1.55)], [CUT.vhs3, camAt(960, 620, 1.75)]]), 1.3);
  const Ly = E.arcade(t, cam);
  const front = t >= tTurn;
  const pump = Math.abs(Math.sin(t * 8));
  let chars = E.champScreen(t, 999999, 1, { record: true });
  chars += kidCrowd(t, KIDS_L, 'cheer') + kidCrowd(t, KIDS_R, 'cheer');
  chars += actor('momTeen', t, front ? { x: 960, y: 930, s: 0.44, armL: 30 + 120 * pump, armR: 160, lift: 20 * pump, face: { name: 'joy', fx: ['sparkles'] }, ...boing(t, tTurn, 0.2) } : { x: 960, y: 930, s: 0.44, view: 'back', armL: 50, armR: 50 }, { arms: false });
  // the ticket strip spilling out of the cabinet
  const tk = seg(t, CUT.vhs2, CUT.vhs3);
  let d = '';
  for (let i = 0; i < Math.floor(4 + 18 * tk); i++) { const u = i / 22; d += `M${f(960 - 18 + 30 * Math.sin(u * 9 + t))} ${f(720 + i * 18)}h36v14h-36Z`; }
  chars += S.path(d, ol('#FF9A3D', 3));
  let o = Ly.bg + Ly.mid + view(cam, chars);
  return vhsFrame(t, o) + whip(t, CUT.vhs2, 1, 0.08);
}
function vhs3Picture(t, lite = false) {
  const st = E.ARC.stage;
  const cam = handheld(t, camKeys(t, [[CUT.vhs3, camAt(st.x - 330, 470, 0.95)], [w(6, 'champion') + 0.2, camAt(st.x - 260, 450, 1.18)], [CUT.photo, camAt(st.x - 250, 445, 1.24)]], ease.inOut), 0.8);
  const Ly = E.arcade(t, cam);
  let chars = actor('momTeen', t, { x: st.x, y: st.top + 4, s: 0.48, trophy: 'up', face: { name: 'joy', fx: ['sparkles'] }, bodyY: 6 * Math.abs(Math.sin(t * 6)) }, { arms: false });
  const front = [[st.x - 900, 1000, 5, 0.46], [st.x - 640, 1030, 2, 0.48], [st.x - 330, 1040, 7, 0.5], [st.x + 280, 1030, 3, 0.5], [st.x + 560, 1010, 0, 0.48]];
  chars += kidCrowd(t, front, 'cheer');
  let o = Ly.bg + Ly.mid + view(cam, chars);
  // camera flashes from the crowd
  for (let i = 0; i < 4; i++) {
    const tf_ = CUT.vhs3 + 0.25 + i * 0.42 + hash(i) * 0.15, a = seg(t, tf_, tf_ + 0.25);
    if (a > 0 && a < 1) { const p = toScr(cam, st.x - 500 + hash(i * 3) * 1000, 820 + hash(i * 7) * 120); o += K.F.sparkle(p.x, p.y, 90 * (1 - a)) + S.circle(p.x, p.y, 60 * (1 - a) + 10, { fill: '#FFFFFF', opacity: f(0.8 * (1 - a)) }); }
  }
  o += G.bigTitle({ text: 'ARCADE\nQUEEN', theme: 'retro', sub: 'STATE CHAMPION 1998', k: seg(t, w(6, 'champion') - 0.05, w(6, 'champion') + 0.9), t, x: 560, y: 260, s: 0.72 });
  if (!lite) o += R.blockConfettiRain(t, { t0: w(6, 'champion') - 0.2 });
  return o;
}
function shVhs3(t) {
  return vhsFrame(t, vhs3Picture(t)) + whip(t, CUT.vhs3, 1, 0.1);
}
// ---- 20. (freeze) — PAUSE, a flash: the tape becomes a polaroid and flies back onto the living-room wall
const QCAM0 = camAt(1240, 552, 1.3, 960, 560), QCAM1 = camAt(1300, 552, 1.55, 960, 520);
function shPhoto(t) {
  const tFreeze = CUT.photo, tFlash = CUT.photo + 0.18, tFly = CUT.queen - 0.55;
  const frozen = vhs3Picture(tFreeze - 0.02, t >= CUT.photo + 0.18);
  if (t < tFlash) return vhsFrame(t, frozen, 'pause') + K.C.whiteFlash(seg(t, tFlash - 0.08, tFlash));
  const bgRoom = room(t, QCAM0, { mom: {}, momAct: { face: 'happy' } });
  const fly = ease.inOut(seg(t, tFly, CUT.queen));
  const wall = toScr(QCAM0, PHOTO.x, PHOTO.y);
  const s0 = 1.45 - 0.25 * ease.out(seg(t, tFlash, tFlash + 0.5));
  const s = lerp(s0, 0.16, fly), x = lerp(960, wall.x, fly), y = lerp(520, wall.y, fly), rot = lerp(-4, 3, fly);
  let o = bgRoom + dim(0.55 * (1 - fly), '#120820');
  o += S.g(E.polaroid(frozen + E.tapeTint(1), x, y, s, rot, { caption: "the Queen '98 ♥" }), null, { opacity: f(1 - seg(fly, 0.85, 1)) });
  return o + K.C.whiteFlash(0.9 * (1 - seg(t, tFlash, tFlash + 0.3)));
}

// ---- 21. MOM: "They called me 'The Queen.' I retired." — a little crown pops over her bun; a sip of tea
function shQueen(t) {
  const cam = camKeys(t, [[CUT.queen, QCAM0], [CUT.retired, QCAM1]]);
  const tQ = w(7, 'Queen');
  const over = E.crownPop(1338, 364, seg(t, tQ - 0.05, tQ + 0.3), t, 44);
  let o = room(t, cam, { mom: {}, momAct: { face: 'happy' }, over });
  const g = seg(t, tQ, tQ + 0.6);
  if (g > 0 && g < 1) { const p = toScr(cam, PHOTO.x, PHOTO.y); o += K.F.sparkle(p.x + 30, p.y - 40, 60 * Math.sin(g * Math.PI)); }
  return o;
}
// ---- 21b. "I retired." — close-up: real Mom takes a slow, dignified sip of tea; the glasses glint (a legend at rest)
function shRetired(t) {
  const tR = w(7, 'retired');
  const cam = camKeys(t, [[CUT.retired, camAt(1336, 560, 2.15, 960, 560)], [CUT.forYou, camAt(1336, 552, 2.4, 960, 560)]], ease.inOut);
  const sip = t > tR - 0.1 && t < w(7, 'For') - 0.35;
  let o = room(t, cam, { you: false, mom: { mugUp: sip, face: sip ? { name: 'happy', eyes: { type: 'closed' } } : undefined }, momAct: { face: 'happy', arms: !sip }, glow: 0.7 });
  const g = seg(t, w(7, 'For') - 0.45, w(7, 'For') - 0.1);
  if (g > 0 && g < 1) { const p = toScr(cam, 1300, 520); o += K.F.sparkle(p.x - 40 + 120 * g, p.y, 50 * Math.sin(g * Math.PI)); }
  return o + whip(t, CUT.retired, 1, 0.08);
}
// ---- 22. "For you." — the hero (real) at his desk: blush
function shForYou(t) {
  const cam = camKeys(t, [[CUT.forYou, camAt(1100, 552, 1.6, 960, 520)], [CUT.forYou + 0.4, camAt(640, 566, 2.0, 960, 500)], [CUT.later, camAt(630, 566, 2.1, 960, 500)]], ease.inOut);
  let o = room(t, cam, { you: { turn: 0.8, face: { name: 'cute', fx: ['blush'] } }, mom: { turn: -0.5 }, momAct: { face: 'happy' } });
  const face = toScr(cam, LRS_YOU.x, 560);
  o += G.emoteHearts({ x: 2000, y: 420, age: t - w(7, 'For') + 0.1, n: 6, s: 0.9, life: 1.3, to: [face.x + 40, face.y], spread: 120 });
  return o + whip(t, CUT.later, 1);
}

// ---- 23. "Ten minutes later..." — fast-forward in the arena + the card
function shLater(t) {
  const cam = { x: 0, y: -60, zoom: 0.82 };
  const st = K.stutterT(t, 12);
  let chars = '';
  chars += momG(st, { x: 960, y: 880, s: arS(880), armR: 90 + 60 * Math.sin(st * 20), armL: 90 - 60 * Math.sin(st * 20), turn: Math.sin(st * 13) * 0.6, nametag: false }, { arms: false });
  let fx = '';
  for (let i = 0; i < 8; i++) { const t0 = CUT.later - 0.4 + i * 0.16; fx += G.knockoutFly({ x0: 960 + (i % 2 ? 80 : -80), y0: 860, age: (st - t0) * 1.6, dir: i % 2 ? 1 : -1, s: 0.24, x1: i % 2 ? 1800 - hash(i) * 300 : 120 + hash(i) * 300, y1: 60 + hash(i * 3) * 120 }); }
  let o = arenaShot(st, cam, { cheer: 0.8 }, chars, fx);
  o += streaks(t, 100, 1000, 14, 5, '#FFFFFF', 0.35, 4000, 1) + E.ffOSD(t, 1);
  o += E.laterCard(t, seg(t, CUT.later + 0.02, CUT.later + 0.3), seg(t, CUT.board - 0.12, CUT.board));
  return o + whip(t, CUT.later, 1, 0.1);
}

// ---- 24. "...she was number one on the leaderboard." — the billboard roll #500 → #50 → #1, the avatar upgrades
const ROWS0 = [
  { rank: 46, from: 46, name: 'LavaLord', score: 124 }, { rank: 47, from: 47, name: 'PizzaKid', score: 122 }, { rank: 48, from: 48, name: 'Sk8rGirl', score: 121 },
  { rank: 49, from: 49, name: 'ToastMan', score: 119 }, { rank: 50, from: 500, name: 'MOM_OFFICIAL', score: 118, scoreFrom: 3 },
];
const ROWS1 = [
  { rank: 1, from: 50, name: 'MOM_OFFICIAL', score: 2104, scoreFrom: 118, crown: true }, { rank: 2, from: 1, name: 'YOU', score: 2001 }, { rank: 3, from: 2, name: 'xX_DarkBlade_Xx', score: 1530 },
  { rank: 4, from: 3, name: 'NoodleBoi', score: 1288 }, { rank: 5, from: 4, name: 'LavaLord', score: 990 },
];
function avatarStage(t, x, y, s) {
  // the avatar on a glowing pedestal; upgrades: grey → grey + pot lid + steel sword → golden armour
  let o = S.ellipse(x, y + 10, 230, 46, ol('#2A3A6A', 7)) + S.ellipse(x, y, 200, 36, { fill: '#5CF2E4', opacity: 0.5 });
  const D = CAST.D || {};
  if (t < tRoll1) o += momG(t, { x, y, s, face: 'happy', nametag: false });
  else if (t < tOne) {
    const pose = { x, y, s, armL: 40, armR: 60, face: 'determined', nametag: false };
    const hl = CAST.handAt(D.momAvatar, pose, -1), hr = CAST.handAt(D.momAvatar, pose, 1);
    o += momG(t, { ...pose, props: [{ svg: X.potLid({ x: hl[0] - 30, y: hl[1], s: 0.9, r: 120 }), layer: 'front' }, { svg: X.goldSword({ x: hr[0], y: hr[1], rot: 30, kind: 'steel' }), layer: 'front' }] }, { arms: false });
  } else o += momA(t, { x, y, s, armR: 150, shieldUp: true, shieldFlash: bump(t, tOne + 0.2, tOne + 0.7), swordGlow: 0.7, face: { name: 'happy', fx: ['sparkles'] }, nametag: false }, { arms: false });
  for (const tu of [tRoll1, tOne]) {
    const k = seg(t, tu - 0.05, tu + 0.45);
    if (k > 0 && k < 1) o += S.circle(x, y - 500 * s, 80 + 360 * k, { fill: '#FFFFFF', opacity: f(0.8 * (1 - k)) }) + K.C.burst(x, y - 500 * s, k, '#FFE14D');
  }
  return o;
}
function shBoard(t) {
  const ph = t < tRoll1 ? 0 : 1;
  const roll = ph ? seg(t, tRoll1, tOne) : seg(t, tRoll0, tRoll1 - 0.05);
  const camA = { x: -260, y: -400, zoom: 1.45 };
  let o = GS.arena.layers(t, camA, { cheer: 0.6 + 0.4 * seg(t, tOne, tOne + 0.3), signs: t > tOne ? ['GO MOM!', 'MOM #1'] : undefined }).bg + dim(0.5, '#10162A');
  const push = ease.inOut(seg(t, tOne + 0.1, CUT.pose));
  let g = '';
  g += avatarStage(t, 400, 930, 0.48);
  g += G.rankClimb({ x: 400, y: 190, from: ph ? 50 : 500, to: ph ? 1 : 50, roll, t, s: 0.62, name: 'MOM_OFFICIAL', k: seg(t, CUT.board, CUT.board + 0.25) });
  g += G.leaderboard({ rows: ph ? ROWS1 : ROWS0, highlight: 'MOM_OFFICIAL', roll, t, x: 1240, y: 510, s: 0.8, k: seg(t, CUT.board - 0.05, CUT.board + 0.3) });
  g += R.blockConfetti({ x: 1240, y: 300, age: t - tOne, n: 50, s: 1 });
  o += S.g(g, `translate(1240 330) scale(${f(1 + 0.12 * push)}) translate(-1240 -330)`);
  return o + smash(t, tOne, 0.12, 0.5) + K.C.whiteFlash(0.6 * (1 - seg(t, CUT.board, CUT.board + 0.15)));
}

// ---- 25. (beat) — golden MOM_OFFICIAL in the ring, shield up, the crowd goes wild
function shPose(t) {
  const cam = camKeys(t, [[CUT.pose, camAt(960, 700, 1.22)], [CUT.nice, camAt(960, 680, 1.4)]]);
  const mx = 960, my = 900, ms = arS(my);
  let chars = '';
  chars += you(t, { x: 1500, y: 860, s: arS(860), turn: -0.6, face: { name: 'shocked', mouth: 'O', fx: ['sweat'] }, armL: 16, armR: 16 }, { arms: false });
  chars += momA(t, { x: mx, y: my, s: ms, shieldUp: true, shieldFlash: bump(t, CUT.pose + 0.3, CUT.pose + 0.8), armR: 150 + 8 * Math.sin(t * 6), swordGlow: 0.8, face: { name: 'happy', fx: ['sparkles'] }, nametag: false, ...boing(t, CUT.pose + 0.05, 0.15) }, { arms: false });
  let o = arenaShot(t, cam, { cheer: 1, signs: ['GO MOM!', 'MOM #1', 'QUEEN'], board: ['MOM_OFFICIAL', '#1'] }, chars);
  const p = toScr(cam, mx, my - GOLD_H * ms);
  o += G.nametag({ who: 'mom', x: p.x, y: p.y - 30, level: 99, crown: true, t, s: 1.1, k: seg(t, CUT.pose, CUT.pose + 0.3) });
  return o + R.blockConfettiRain(t, { t0: CUT.pose - 0.5 });
}

// ---- 26-28. MOM: "Nice try, honey! / Sit up straight! / Did you eat breakfast?" — the caring KO montage
function shNice(t) {
  const cam = shakeAll(camKeys(t, [[CUT.nice, camAt(900, 640, 1.3)], [tNice + 0.2, camAt(960, 600, 1.15)], [CUT.sit, camAt(1000, 560, 1.12)]], ease.out), t, [[tNice, 0.3, 16]]);
  const mx = 720, my = 900, ms = arS(my);
  const bash = bump(t, tNice - 0.1, tNice + 0.3);
  let chars = momA(t, { x: mx, y: my, s: ms, turn: 0.55, shieldUp: bash > 0.3, armL: 30 + 80 * bash, armR: 40, lean: 6 * bash, face: { name: 'happy' }, nametag: false }, { arms: false });
  const ax = lerp(1600, 870, ease.in(seg(t, CUT.nice, tNice)));
  let fx = '';
  if (t < tNice) chars += ply(13, t, { x: ax, y: my, s: ms, view: 'side', sword: true, ...AC.run((t - CUT.nice) * 20), armL: 150, face: 'angry', nametag: false });
  else fx += G.knockoutFly({ x0: 870, y0: my - 30, age: t - tNice, dir: 1, svg: ply(13, t, { x: 0, y: 0, s: ms, face: 'dizzy', nametag: false, armL: 150, armR: 150 }), cy: 220, x1: 1560, y1: 260, s: ms, arc: 60 });
  fx += G.hitSpark({ x: 850, y: my - 560 * ms, age: t - tNice, text: 'BONK!', s: 1 }) + G.damageNumber({ x: 900, y: my - 760 * ms, age: t - tNice - 0.05, value: -50, s: 0.9 });
  let o = arenaShot(t, cam, { cheer: 0.8, signs: ['GO MOM!', 'MOM #1'] }, chars, fx);
  o += bubbleAt(t, cam, mx, my - GOLD_H * ms, '05.9', { text: 'Nice try, honey!', from: 'Nice', to: 'honey', gap: 30, s: 1.2, tail: 0.4 });
  return o + whip(t, CUT.nice, 1, 0.1);
}
function shSit(t) {
  const cam = shakeAll(camKeys(t, [[CUT.sit, camAt(900, 640, 1.42)], [CUT.bfast, camAt(920, 650, 1.5)]]), t, [[tTap, 0.2, 8], [tTopple + 0.3, 0.3, 12]]);
  const mx = 700, my = 900, ms = arS(my);
  const swing = bump(t, tTap - 0.15, tTap + 0.15);
  let chars = momA(t, { x: mx, y: my, s: ms, turn: 0.6, armR: 150 - 90 * seg(t, tTap - 0.15, tTap), armL: 30, face: { name: 'happy' }, nametag: false }, { arms: false });
  const up = seg(t, tStraight - 0.05, tStraight + 0.12);
  const fall = ease.in(seg(t, tTopple, tTopple + 0.35));
  const px = 1000, slouch = 26 * (1 - up);
  chars += ply(9, t, { x: px, y: my, s: ms, turn: -0.45, lean: slouch - 4 * up, headRot: 18 * (1 - up), rot: -84 * fall, sx: 1 - 0.04 * up * (1 - fall), sy: 1 + 0.06 * up * (1 - fall), sword: 'steel', armR: 8 + 10 * (1 - up), armL: 8, face: fall > 0.5 ? 'dizzy' : up > 0.5 ? { name: 'shocked', fx: ['sparkles'] } : 'sleepy', nametag: false });
  let fx = G.hitSpark({ x: px + 40, y: my - 640 * ms, age: t - tTap, text: 'TAP!', s: 0.7, col: '#9FE8FF' });
  fx += E.floatTag(px, my - 1080 * ms, seg(t, tStraight, tStraight + 1.0), 'POSTURE +10', '#7CFF6B', 34);
  if (fall >= 1) fx += G.koStars({ x: px - 380 * ms, y: my - 120 * ms, t, s: 0.6, k: seg(t, tTopple + 0.35, tTopple + 0.6), text: 'K.O.' });
  let o = arenaShot(t, cam, { cheer: 0.8, signs: ['GO MOM!', 'MOM #1'] }, chars, fx);
  o += bubbleAt(t, cam, mx, my - GOLD_H * ms, '05.9', { text: 'Sit up straight!', from: 'Sit', to: 'straight', pre: 0.25, gap: 30, s: 1.2, tail: 0.3, k: seg(t, tTap - 0.3, tTap) });
  return o + whip(t, CUT.sit, -1, 0.1);
}
function shBfast(t) {
  const cam = camKeys(t, [[CUT.bfast, camAt(940, 700, 1.5)], [CUT.hundred, camAt(960, 700, 1.62)]]);
  const my = 900, ms = arS(my), mx = 720;
  let chars = '';
  const thumb = seg(t, tBowl + 0.4, tBowl + 0.6);
  // the KO'd player lying on the sand (head to the right)
  chars += ply(15, t, { x: 1040, y: my - 20, s: ms, rot: 90, face: thumb > 0.5 ? { name: 'happy', eyes: { type: 'swirl' } } : 'dizzy', armR: 10 + 150 * thumb, armL: 10, nametag: false });
  chars += momA(t, { x: mx, y: my, s: ms, turn: 0.6, kneeL: 50, kneeR: 50, legL: -16, legR: -16, bodyY: 60, lean: 14, armR: 40, armL: 30, face: { name: 'happy' }, nametag: false, cape: true }, { arms: false });
  const bk = pop(t, tBowl, 0.3);
  if (bk > 0) chars += sc(X.cereal({ x: 1180, y: my - 6, s: 0.42 }), 1180, my, bk);
  let fx = G.koStars({ x: 1250, y: my - 160, t, s: 0.5, k: 1 - seg(t, tBowl + 0.3, tBowl + 0.6) });
  fx += G.emoteHearts({ x: 1180, y: my - 120, age: t - tBowl - 0.1, n: 5, s: 0.6, life: 1.2 });
  let o = arenaShot(t, cam, { cheer: 0.7, signs: ['GO MOM!', 'MOM #1'] }, chars, fx);
  o += bubbleAt(t, cam, mx, my - GOLD_H * ms + 60, '05.9', { text: 'Did you eat breakfast?', from: 'Did', to: 'breakfast', pre: 0.25, gap: 30, s: 1.2, tail: 0.3, k: seg(t, CUT.bfast, CUT.bfast + 0.3) });
  return o + whip(t, CUT.bfast, 1, 0.1);
}

// ---- 29. "She defeated a hundred players." — spin attack, a stream of noobs launched out, K.O. counter to 100
function shHundred(t) {
  const cam = camKeys(t, [[CUT.hundred, camAt(960, 600, 1.0)], [CUT.hydra, camAt(960, 590, 1.08)]]);
  const mx = 960, my = 880, ms = arS(my);
  const spin = Math.floor(t * 9) % 2;
  let chars = momA(t, { x: mx, y: my, s: ms, view: spin ? 'side' : 'front', flip: !!spin, armR: 100, armL: 60, swordGlow: 1, face: 'determined', nametag: false }, { arms: false });
  let fx = '', run = '';
  for (let i = 0; i < 34; i++) {
    const t0 = KO0 + i * ((KO1 - KO0) / 34), age = t - t0;
    const dir = i % 2 ? 1 : -1;
    // the next challengers sprint in from both sides (cheap noobs)
    if (age >= -0.7 && age < 0) {
      const u = (age + 0.7) / 0.7, rx = mx + dir * lerp(1150, 110, u), ry = my + 6 - 18 * hash(i * 2.3);
      run += K.draw.kid(1 + (i % 15), { x: rx, y: ry, s: 0.3, view: 'side', flip: dir < 0, ...AC.run(t * 24 + i), armR: 150, face: 'angry', nametag: false, sword: i % 3 === 0 });
    }
    if (age < 0 || age > 1.9) continue;
    fx += G.knockoutFly({ x0: mx + dir * 70, y0: my - 20, age, dir, s: 0.3, x1: mx + dir * (420 + hash(i) * 420), y1: 140 + hash(i * 3) * 160, arc: 40 + 60 * hash(i * 5) });
  }
  const rp = ((t * 3) % 1);
  fx += S.ellipse(mx, my - 300 * ms, 260 + 140 * rp, 90 + 50 * rp, { fill: 'none', stroke: '#FFE14D', 'stroke-width': f(14 * (1 - rp)), opacity: f(0.8 * (1 - rp)) });
  let o = arenaShot(t, cam, { cheer: 1, signs: ['GO MOM!', 'MOM #1', 'QUEEN'] }, run + chars, fx);
  const n = Math.round(lerp(1, 100, ease.inOut(seg(t, KO0, KO1))));
  o += E.pill({ x: 50, y: 90, label: 'K.O.s', value: n, rim: '#FF4B5C', col: '#FFFFFF', t, bump: seg(t, KO1, KO1 + 0.45), icon: S.circle(0, 0, 33, { fill: '#3B2A20', stroke: '#151515', 'stroke-width': 4 }) + G.sword(0, 26, 0.18, 30) });
  return o;
}

// ---- 30. "...every single one of them was hydrated." — Mom walks the bench of defeated players handing out water
const BENCH = [300, 520, 740, 960, 1180, 1400], BENCH_I = [2, 7, 10, 11, 13, 15], BENCH_Y = 860;
const benchT = (j) => lerp(CUT.hydra + 0.55, tHydra, j / (BENCH.length - 1));
function shHydra(t) {
  const cam = camKeys(t, [[CUT.hydra, camAt(560, 630, 1.28)], [tHydra + 0.2, camAt(1250, 630, 1.28)], [CUT.dark, camAt(1290, 620, 1.3)]], ease.inOut);
  const bs = arS(BENCH_Y), seatY = BENCH_Y - 306 * bs;
  let chars = '';
  chars += GS.brick(120, seatY, 1500, BENCH_Y - seatY, 24, '#B9A88C', GS.tone({}), { studs: false });
  BENCH.forEach((x, j) => {
    const i = BENCH_I[j], got = t >= benchT(j);
    const pose = { x, y: BENCH_Y, s: bs, ...FROG, armL: 10, armR: got ? 120 + 20 * Math.sin(t * 3 + j) : 14, headRot: got ? -8 : 10, face: got ? { name: 'happy', fx: ['sparkles'] } : 'dizzy', nametag: false };
    const D = CAST.playerDesign ? CAST.playerDesign(i) : null;
    const h = D ? CAST.handAt(D, pose, 1) : [180, -460];
    if (got) pose.props = [{ svg: E.waterBottle(h[0], h[1] - 40, 0.9, -20), layer: 'front' }];
    chars += ply(i, t, pose);
  });
  const mx = lerp(200, 1560, ease.inOut(seg(t, CUT.hydra + 0.1, tHydra + 0.2))), my = 935, ms = arS(my);
  chars += momA(t, { x: mx, y: my, s: ms, view: 'side', flip: true, ...AC.walk((t - CUT.hydra) * 11, 0.8), armL: 70, face: 'happy', nametag: false, props: [{ svg: E.waterBottle(-10, -330, 0.9, 10), layer: 'front' }] }, { arms: false });
  let fx = '';
  BENCH.forEach((x, j) => {
    const a = t - benchT(j);
    if (a < 0) fx += G.koStars({ x, y: BENCH_Y - 1000 * bs, t: t + j, s: 0.4, n: 3 });
    fx += G.potionPop({ x, y: BENCH_Y - 760 * bs, age: a, col: '#5CC8FF', text: '+H2O', s: 0.6, seed: j });
  });
  let o = arenaShot(t, cam, { cheer: 0.5 }, chars, fx);
  o += E.pill({ x: 1870, y: 90, anchor: 'right', label: 'HYDRATION', value: `${Math.round(100 * clamp((t - CUT.hydra - 0.4) / (tHydra - CUT.hydra - 0.4), 0, 1))}%`, rim: '#5CC8FF', col: '#BFF2FF', t, icon: S.circle(0, 0, 33, { fill: '#1E3A5A', stroke: '#151515', 'stroke-width': 4 }) + E.waterBottle(0, 2, 0.26) });
  o += G.stamp({ text: 'HYDRATED!', x: 960, y: 300, k: seg(t, tHydra, tHydra + 0.5), col: '#2F7BFF', size: 110, rot: -8 });
  return o;
}

// ---- 31. (hush) DARKBLADE: "One on one, Mom!" — he walks out of the dark gate, the clan behind, points the sword
function shDark(t) {
  const cam = camKeys(t, [[CUT.dark, camAt(960, 600, 1.38)], [CUT.now, camAt(960, 590, 1.6)]], ease.inOut);
  const walk = ease.out(seg(t, CUT.dark + 0.1, A[11].a));
  const dy = lerp(745, 845, walk), ds = arS(dy);
  let chars = '';
  for (const [x, i] of [[760, 0], [1160, 3]]) chars += actor('clan', t, { i, x, y: 740, s: arS(740), armR: 150 + 10 * Math.sin(t * 4 + i), weapon: 'axe', t });
  const point = seg(t, A[11].a - 0.1, A[11].a + 0.15);
  chars += actor('darkblade', t, { x: 960, y: dy, s: ds, ...AC.walkFront(t * 7, walk < 1 ? 1 : 0), armR: lerp(20, 110, point), armL: 14, t, nametag: false }, { arms: false });
  let o = arenaShot(t, cam, { cheer: 0 }, chars);
  o += dim(0.35, '#200614');
  const p = toScr(cam, 960, dy - 1018 * ds);
  o += G.nametag({ who: 'darkblade', x: p.x, y: p.y - 30, t, s: 1, k: seg(t, CUT.dark + 0.3, CUT.dark + 0.6) });
  o += bubbleAt(t, cam, 960, dy - 1018 * ds, '05.11', { text: 'One on one, Mom!', to: 'Mom', gap: 90, user: 'xX_DarkBlade_Xx', s: 1.2, tail: -0.2, col: '#FFE9EC' });
  return o;
}
// ---- 32. "Right now!" — smash-zoom on the visor, red eyes flare
function shNow(t) {
  const ds = arS(845), hy = 845 - 760 * ds;
  const cam = shakeAll(camKeys(t, [[CUT.now, camAt(960, hy, 2.9)], [CUT.okay, camAt(960, hy, 3.2)]]), t, [[w(11, 'now'), 0.4, 16]]);
  const db = actor('darkblade', t, { x: 960, y: 845, s: ds, armR: 110, armL: 14, t, volume: false, nametag: false }, { arms: false });
  let o = arenaShot(t, cam, { cheer: 0 }, db);
  o += dim(0.3, '#300610') + zoomLines(960, 540, 0.9, t, '#FF4B5C', 26, 430);
  o += G.chatBubble({ x: 960, y: 250, t, caps: true, user: 'xX_DarkBlade_Xx', size: 64, tail: false, ...G.chatLine(t, '05.11', { text: 'Right now!', from: 'Right', pre: 0.08 }) });
  return o + smash(t, CUT.now, 0.1, 0.6);
}
// ---- 33. MOM: "Okay, sweetie." — the sweetest little wave
function shOkay(t) {
  const mx = 900, my = 900, ms = arS(my);
  const cam = camKeys(t, [[CUT.okay, camAt(900, 600, 1.75)], [CUT.duel, camAt(900, 600, 1.85)]]);
  const mom = momA(t, { x: mx, y: my, s: ms, turn: 0.15, armR: 130 + 18 * Math.sin(t * 10), armL: 26, face: { name: 'happy', fx: ['blush'] }, nametag: false }, { arms: false });
  let o = arenaShot(t, cam, { cheer: 0.1 }, mom);
  o += bubbleAt(t, cam, mx, my - GOLD_H * ms, '05.12', { gap: 30, s: 1.2, tail: 0.2 });
  const p = toScr(cam, mx + 90, my - 980 * ms);
  o += G.emoteHearts({ x: p.x, y: p.y, age: t - A[12].a, n: 4, s: 0.8, life: 1.2 });
  return o;
}
// ---- 34. (beat) the standoff → he charges → one flick → BONK → he flies out; "Good game!" to the twinkle
function shDuel(t) {
  const cam = shakeAll(camKeys(t, [[CUT.duel, AS.cams.duel], [tPunch - 0.05, camAt(900, 640, 1.38)], [tPunch + 0.3, { x: 40, y: -120, zoom: 0.92 }], [CUT.stretch, { x: 60, y: -130, zoom: 0.94 }]], ease.out), t, [[tPunch, 0.5, 24]]);
  const my = 900, ms = arS(my), mx = 640;
  const flick = bump(t, tPunch - 0.08, tPunch + 0.35);
  const wave = t > A[13].a - 0.1;
  let chars = momA(t, { x: mx, y: my, s: ms, turn: wave ? 0.2 : 0.5, armR: wave ? 150 + 20 * Math.sin(t * 11) : 30 + 60 * flick, armL: 24, face: { name: 'happy' }, nametag: false }, { arms: false });
  const dx = lerp(1280, 790, ease.in(seg(t, tCharge, tPunch)));
  let fx = '';
  if (t < tPunch) chars += actor('darkblade', t, t < tCharge ? { x: 1280, y: my, s: ms, view: 'side', armL: 60, armR: 20, t, nametag: false } : { x: dx, y: my, s: ms, view: 'side', ...AC.run((t - tCharge) * 22), armL: 150, lean: -12, t, nametag: false }, { arms: false });
  else fx += G.knockoutFly({ x0: 790, y0: my - 40, age: t - tPunch, dir: 1, svg: actor('darkblade', t, { x: 0, y: 0, s: ms, nametag: false, stars: true, t }), cy: 210, x1: 1700, y1: 70, s: ms, arc: 120 });
  if (t > tCharge - 0.3 && t < tPunch) fx += G.tumbleweed({ x: lerp(1500, 300, seg(t, tCharge - 0.3, tPunch)), y: my - 10, s: 0.5, t });
  fx += G.hitSpark({ x: 780, y: my - 640 * ms, age: t - tPunch, text: 'BONK!', s: 1.6 }) + G.damageNumber({ x: 860, y: my - 860 * ms, age: t - tPunch - 0.05, value: -9999, crit: true, s: 1.2, seed: 7 });
  if (t < tPunch && t > tCharge) fx += streaks(t, my - 420 * ms, my - 40, 8, 11, '#FFFFFF', 0.5, 3000, 1);
  let o = arenaShot(t, cam, { cheer: t > tPunch + 0.3 ? 1 : 0, signs: t > tPunch + 0.3 ? ['GO MOM!', 'MOM #1', 'QUEEN'] : undefined }, chars, fx);
  if (t > A[13].a - 0.3) o += bubbleAt(t, cam, mx, my - GOLD_H * ms, '05.13', { text: 'Good game!', to: 'game', gap: 30, s: 1.2, tail: 0.3 });
  return o + smash(t, tPunch, 0.12, 0.85);
}
// ---- 35. "Don't forget to stretch!" — she demonstrates; two players behind copy her
function shStretch(t) {
  const mx = 900, my = 900, ms = arS(my);
  const cam = camKeys(t, [[CUT.stretch, camAt(920, 600, 1.4)], [CUT.legend, camAt(920, 590, 1.5)]]);
  const up = seg(t, CUT.stretch + 0.05, CUT.stretch + 0.35), lean = 14 * Math.sin((t - CUT.stretch) * 5) * up;
  let chars = '';
  for (const [x, i, d] of [[560, 4, 0.25], [1260, 12, 0.35]]) { const u2 = seg(t, CUT.stretch + d, CUT.stretch + d + 0.3); chars += ply(i, t, { x, y: 800, s: arS(800), armL: 10 + 160 * u2, armR: 10 + 160 * u2, lean: 14 * Math.sin((t - CUT.stretch - d) * 5) * u2, face: 'happy', nametag: false }); }
  chars += momA(t, { x: mx, y: my, s: ms, armL: 20 + 150 * up, armR: 20 + 150 * up, lean, face: { name: 'happy', eyes: { type: 'happy' } }, nametag: false, sword: false, shield: false }, { arms: false });
  let o = arenaShot(t, cam, { cheer: 0.7, signs: ['GO MOM!', 'MOM #1'] }, chars);
  o += bubbleAt(t, cam, mx, my - GOLD_H * ms, '05.13', { text: "Don't forget to stretch!", from: "Don't", gap: 30, s: 1.2, tail: 0.2, k: seg(t, CUT.stretch, CUT.stretch + 0.3) });
  return o;
}
// ---- 36. NOODLE: "YOUR MOM IS A LEGEND!" — he shakes the hero; Mom crowd-surfs behind them; confetti
function shLegend(t) {
  const tL = w(14, 'LEGEND');
  const cam = shakeAll(camKeys(t, [[CUT.legend, camAt(960, 640, 1.32)], [CUT.me, camAt(960, 630, 1.4)]]), t, [[tL, 0.45, 14]]);
  const ys = 950, s = arS(ys);
  const sh = Math.sin(t * 38);
  let chars = '';
  // Mom crowd-surfing in the back
  const lift = 140 + 20 * Math.sin(t * 7);
  for (const [x, i] of [[1300, 3], [1440, 6], [1580, 14]]) chars += ply(i, t, { x, y: 760, s: arS(760), armL: 170, armR: 170, face: 'excited', bodyY: -6 * Math.abs(Math.sin(t * 8 + x)), nametag: false });
  chars += momA(t, { x: 1440, y: 760, s: arS(760), lift, rot: 80 + 8 * Math.sin(t * 3), armL: 160, armR: 160, face: 'joy', nametag: false, shield: false });
  chars += you(t, { x: 800 + 10 * sh, y: ys, s, turn: 0.3, headRot: 10 * sh, armL: 12, armR: 12, face: { name: 'deadpan', fx: ['sweat'] }, nametag: false }, { arms: false });
  chars += actor('noodle', t, { x: 1010, y: ys, s, turn: -0.35, armL: 78 + 6 * sh, armR: 120 + 40 * Math.sin(t * 20), lean: -4, face: 'scream', nametag: false }, { energy: 1.6, arms: false });
  let o = arenaShot(t, cam, { cheer: 1, signs: ['GO MOM!', 'MOM #1', 'LEGEND'] }, chars);
  o += bubbleAt(t, cam, 1010, ys - 1158 * s, '05.14', { caps: true, user: 'NoodleBoi', gap: 30, s: 0.95, tail: 0.3 });
  o += R.blockConfettiRain(t, { t0: CUT.legend - 1 });
  return o + smash(t, tL, 0.1, 0.35);
}
// ---- 37. YOU: "...I'm the legend." — close-up, small voice; one confetti cube lands on his crown
function shMe(t) {
  const hx = 960, hy = 940, hs = arS(hy);
  const cam = camKeys(t, [[CUT.me, camAt(960, 600, 2.3)], [CUT.tea, camAt(960, 590, 2.55)]], ease.linear);
  const hero = you(t, { x: hx, y: hy, s: hs, volume: false, nametag: false, armL: 6, armR: 6, headRot: -4, face: { name: 'sad' } }, { energy: 0.3, arms: false });
  let o = arenaShot(t, cam, { cheer: 0.6, signs: ['GO MOM!', 'MOM #1'] }, hero) + dim(0.22, '#1A2040');
  // drifting confetti (screen space) + the one that lands on his crown
  let d = '';
  for (let i = 0; i < 16; i++) { const y = ((t * 90 + hash(i) * 1200) % 1300) - 100, x = hash(i * 3.3) * 1920 + 30 * Math.sin(t * 2 + i); d += `M${f(x)} ${f(y)}h22v14h-22Z`; }
  o += S.path(d, { fill: '#FFC83D', stroke: '#151515', 'stroke-width': 3, opacity: 0.8 });
  const tLand = A[15].b - 0.4, cu = seg(t, tLand - 1.2, tLand);
  const top = toScr(cam, hx, hy - 1124 * hs);
  o += S.g(S.rect(-18, -12, 36, 24, 4, ol('#FF4B5C', 4)), tf(lerp(top.x + 160, top.x + 10, cu), lerp(-60, top.y + 20, cu), 1, 200 * cu + (t > tLand ? 12 : 0)));
  return o;
}
// ---- 38. (beat) real life: Mom on the couch with her tablet, sipping tea. Perfectly calm. "+1 WIN".
function shTea(t) {
  const cam = camKeys(t, [[CUT.tea, camAt(1330, 560, 2.15)], [END, camAt(1330, 560, 2.25)]], ease.linear);
  let o = room(t, cam, { mom: { mugUp: t > CUT.tea + 0.35, face: { name: 'happy', eyes: { type: 'closed' } } }, momAct: { face: 'happy' }, glow: 0.8 });
  const p = toScr(cam, 1322, 760);
  o += E.floatTag(p.x - 70, p.y - 60, seg(t, CUT.tea + 0.35, CUT.tea + 1.5), '+1 WIN', '#3BD16F', 64);
  o += E.floatTag(p.x + 130, p.y - 30, seg(t, CUT.tea + 0.8, CUT.tea + 1.9), '+1 WIN', '#3BD16F', 64);
  o += E.floatTag(p.x - 200, p.y - 10, seg(t, CUT.tea + 1.15, CUT.tea + 2.2), 'MOM #1', '#FFC83D', 58);
  return o + whip(t, CUT.tea, -1, 0.1) + whip(t, END, 1, 0.12);
}

// ================================================================= dispatch
const SHOTS = [
  [CUT.tree, shTree], [CUT.jump, shJump], [CUT.run, shRun], [CUT.arena, shArena], [CUT.relax, shRelax], [CUT.momIn, shMomIn], [CUT.split, shSplit],
  [CUT.sneak, shSneak], [CUT.glare, shGlare], [CUT.slow, shSlow], [CUT.hits, shHits], [CUT.fly, shFly], [CUT.stick, shStick], [CUT.how, shHow], [CUT.muscle, shMuscle],
  [CUT.truth, shTruth], [CUT.vhs1, shVhs1], [CUT.vhs2, shVhs2], [CUT.vhs3, shVhs3], [CUT.photo, shPhoto], [CUT.queen, shQueen], [CUT.retired, shRetired], [CUT.forYou, shForYou],
  [CUT.later, shLater], [CUT.board, shBoard], [CUT.pose, shPose], [CUT.nice, shNice], [CUT.sit, shSit], [CUT.bfast, shBfast], [CUT.hundred, shHundred], [CUT.hydra, shHydra],
  [CUT.dark, shDark], [CUT.now, shNow], [CUT.okay, shOkay], [CUT.duel, shDuel], [CUT.stretch, shStretch], [CUT.legend, shLegend], [CUT.me, shMe], [CUT.tea, shTea],
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
  if (t >= CUT.vhs1 && t < CUT.photo + 0.18) return { grade: null, vignette: 0.75 };
  if (t >= CUT.slow && t < CUT.fly) return { grade: 'cool', vignette: 0.7 };
  if (t >= CUT.dark && t < CUT.okay) return { grade: 'warm', vignette: 0.8 };
  return { grade: 'warm', vignette: 0.45 };
}
const BEATS = { T0, END, tOut, tHood, tHitMom, tSwing2, tH1, tH2, tH3, tFly, tStick, tGlint, tRoll0, tRoll1, tOne, tNice, tTap, tStraight, tTopple, tBowl, KO0, KO1, tHydra, tCharge, tPunch, benchT: BENCH.map((_, j) => benchT(j)) };
module.exports = { scene, look, SHOTS, CUT, BEATS };
