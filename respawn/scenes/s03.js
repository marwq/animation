// SC 03 · CHECKPOINT 1000 — 2 AM, a storm, the bedroom lit by the monitor.
//   1  the house in the storm → he can't sleep → "four days" (thought bubble: the talent show)
//   2  where you always go: the monitor wakes up → MEGA OBBY parkour → three months on the clock → 4,816 falls (grid)
//   3  nobody laughed (empty chat, lava) → he just respawned → "I wish real life had checkpoints"
//   4  2:00, STAGE 999, one jump left: eyes, finger, the slow-motion leap → he touches the flag AND lightning hits the house
//   5  FINAL CHECKPOINT REACHED / Exporting to real life (progress) → "to WHAT?" → the pad bursts out of the screen
//   6  Tip squeezes out of the monitor, bounces, intro card → "step on the checkpoint" → backing away → HELPFUL
//   7  the careful step → save wave + "Checkpoint saved" → Gary's slow blink → "Gary told no one" → fast-forward to 7:30
// Every cut and hit is placed on the voice (L(id).a/.b, .word()); nothing is timed in absolute seconds.
'use strict';

const K = require('./kit');
const R = require('./respawn');
const H = require('./sets_home');
const X = require('../rig/extras');
const AC = require('./acting');
const E = require('./s03_env');
const { S, f, clamp, lerp, ease, seg, bump, hash, ol, ln, T, TF, camKeys, view, actor } = K;
const { L } = K.V;
const { tf, TS, TFS, pop, at, toS, shakeAll, whip, smash, zoomLines, streaks, bangAt, squash, fc, hops, room } = E;

const A = Array.from({ length: 13 }, (_, i) => L('03.' + i));
const T0 = K.V.scene('SC 03').start, END = K.V.scene('SC 04').start;
const w = (i, word, n = 0) => A[i].word(word, n).t0;
const w1 = (i, word, n = 0) => A[i].word(word, n).t1;

// ---------------------------------------------------------------- cuts (all from the voice)
const c01 = T0;                                   // exterior: the house in the storm
const c02 = w(0, 'you') - 0.1;                    // in bed, eyes wide open
const c03 = w(0, 'The') - 0.1;                    // thought bubble: the talent show, 4 DAYS
const c04 = w(0, 'So') - 0.12;                    // he gets up, tiptoes to the desk
const c05 = w(0, 'when') - 0.1;                   // the monitor wakes him up; "scary" = thunder
const c06 = A[1].a - 0.08;                        // MEGA OBBY parkour
const c07 = w(1, "You'd") - 0.1;                  // three months (stage counter, clock spinning)
const c08 = A[2].a - 0.1;                         // the grid of falls, FALLS 4,816
const c09 = w(2, 'And', 1) - 0.1;                   // nobody laughed: lava + empty chat
const c10 = w(2, 'You') - 0.12;                   // you just... respawned
const c11 = A[3].a - 0.1;                         // "I wish real life had checkpoints"
const c12 = A[4].a - 0.08;                        // the clock: 2:00
const c13 = w(4, 'Stage') - 0.1;                  // STAGE 999
const c14 = w(4, 'One') - 0.12;                   // one jump left (the game screen)
const c15 = A[5].a - 0.05;                        // ECU eyes
const c16 = w(5, 'come', 1) - 0.15;               // the finger on SPACE
const tPress = w(5, 'come', 1) + 0.05;
const c17 = tPress + 0.18;                        // the slow-motion leap
const tYes = w(5, 'YES');                         // "YES!" == lightning
const tTouch = tYes - 0.1;                        // the avatar's hand touches the final flag
const c18 = tYes + 0.04;                          // exterior: the bolt hits the house
const tStrike = c18 + 0.05;
const c19a = tStrike + 0.55;                      // power surge in the room: flicker, sparks, green flood
const c19 = Math.max(c19a + 0.8, A[6].a - 0.15);  // frozen in the YES pose (deskFace)
const c20 = w(6, 'reached') - 0.12;               // the screen floods green + system window
const c21 = w(6, 'Exporting') - 0.1;              // big export window + progress
const c22 = A[7].a - 0.08;                        // "Exporting to WHAT?"
const c23 = w(7, 'WHAT') - 0.02;                  // the screen bulges -> the pad bursts out, loops round the room
const tBurst = Math.max(c23 + 0.3, A[7].b - 0.1);
const tPlant = tBurst + clamp((A[8].a - 0.5 - tBurst) * 0.8, 0.4, 0.85);
const c24 = Math.max(tPlant + 0.3, A[8].a - 0.35); // Tip squeezes out of the monitor and bounces
const tTipOut = c24 + 0.3;                        // Tip pops free of the screen
const c25 = w(8, "I'm") - 0.12;                   // Tip's intro card
const c26 = w(8, 'TIP', 1) - 0.12;                  // "step on the checkpoint"
const c27 = A[9].a - 0.08;                        // backing away
const c28 = A[10].a - 0.08;                       // A HELPFUL talking pop-up
const c29 = w(10, 'talking');                     // the careful step
const tStep = A[11].a - 0.1;
const c30 = tStep + 0.35;                         // saved: wave + toast
const c31 = A[11].b + 0.2;                        // Gary's slow blink
const c32 = w(12, 'Gary', 1) - 0.1;               // Gary told no one
const c33 = A[12].b + 0.06;                       // fast-forward to 7:30

// ---------------------------------------------------------------- shared bits
const HR = H.SPOTS.heroRoom, CP = HR.checkpoint, DC = H.SPOTS.deskClose, DF = H.SPOTS.deskFace, OW = H.SPOTS.obbyWorld;
// the hero is drawn flat (volume: false) in the heavy night-room shots and big close-ups (perf)
let FLAT = false;
const you = (t, pose, act) => actor('you', t, FLAT && pose.volume === undefined ? { ...pose, volume: false } : pose, act);
const DFH = { x: DF.hero.x, y: DF.hero.seat + 306 * DF.hero.s, s: DF.hero.s };   // hero in the deskFace chair
const bowlRoom = (t, gary = {}) => X.fishbowl({ x: HR.bowl.x, y: HR.bowl.y, s: HR.bowl.s, t, line: (7 * 0.5) / HR.bowl.s, gary: { yaw: -40, ...gary } });
const bowlDesk = (t, gary = {}, extra = {}) => X.fishbowl({ x: DC.bowl.x, y: DC.bowl.y, s: DC.bowl.s, t, gary: { yaw: 40, ...gary }, ...extra });
const bowlCU = (t, gary = {}) => bowlDesk(t, { x: -20, y: -250, s: 1.05, ...gary }, { bubbles: true });
const game = (t, o = {}) => H.gameScreen(t, { run: t * 14, ...o });
const greenGame = (t) => game(t, { win: 1 });
// after the export the monitor just glows green with the banner (a cheap stand-in for the full game screen)
const greenLite = (t) => (w_, h_) => S.rect(-w_ / 2, -h_ / 2, w_, h_, 0, { fill: '#3DFF9A' }) + S.rect(-w_ / 2, -h_ / 2, w_, h_ * 0.5, 0, { fill: '#9DFFCB', opacity: f(0.35 + 0.1 * Math.sin(t * 6)) }) +
  S.g(S.rect(-300, -52, 600, 104, 30, { fill: '#0E3A22', stroke: '#151515', 'stroke-width': 6 }) + T('FINAL CHECKPOINT!', 0, 20, 56, '#FFFFFF'), `scale(${f(Math.min(w_ / 1600, h_ / 900) * 1.4)})`);
// the export progress (0..1) from the SYSTEM voice
const exportP = (t) => (t < w(6, 'to') ? 0.55 * ease.out(seg(t, w(6, 'Exporting'), w(6, 'to'))) : lerp(0.55, 1, ease.inOut(seg(t, w(6, 'to'), w1(6, 'life')))));
// the hero sitting in the gaming chair, back view (heroRoom)
const chairSit = (t, extra = {}) => you(t, { x: HR.chair.x, y: HR.chair.seat + 306 * HR.chair.s, s: HR.chair.s, view: 'back', legL: 80, legR: 80, kneeL: 90, kneeR: 90, headphones: true, ...extra }, { arms: false });
// the hero's feet spot on the floor in the room (in front of the chair)
const HSTAND = { x: 1240, y: 950, s: 0.5 };
const TIPHOVER = { x: 1430, y: 505 };

// ================================================================= SHOTS
// ---- 1. the house in the storm, the gable window glowing; push in
function sh01(t) {
  const cam = camKeys(t, [[c01, at(900, 470, 0.92)], [c02, at(900, 330, 1.35)]], ease.inOut);
  const fl = Math.max(bump(t, c01 + 0.35, c01 + 0.6), 0.6 * bump(t, c01 + 0.62, c01 + 0.75));
  shakeAll(cam, t, [[c01 + 0.4, 0.5, 6]]);
  let o = E.nightHouse(t, cam, { flash: fl, glow: 0.9 });
  if (fl > 0.05) o += R.lightning({ x0: 1650, y0: -40, x1: 1900, y1: 520, seed: 4, k: seg(t, c01 + 0.33, c01 + 0.9), width: 0.8, flash: false });
  // fade in from the previous scene
  o += R.flash(0.8 * (1 - seg(t, c01, c01 + 0.25)), '#05081C');
  return o;
}
// ---- 2. in bed, eyes wide open
const LIE = HR.bed.lie;
const lieHead = (hero) => E.clipRect(60, 520, 202, 260, hero);   // the face peeking out over the blanket
function lieFace(t, look, extra = {}) {
  return { name: 'neutral', blink: E.blinkK(t, 2, 2.6), eyes: { look, upper: 0.05 }, mouth: 'line', ...extra };
}
function sh02(t) {
  const cam = camKeys(t, [[c02, at(300, 650, 2.0)], [c03, at(290, 650, 2.25)]], ease.out);
  const dart = Math.floor((t - c02) * 1.4) % 3;
  const look = [[1, 0], [1, -0.6], [0.8, 0.6]][dart];
  const hero = you(t, { ...LIE, face: lieFace(t, look) });
  const fl = bump(t, c02 + 0.7, c02 + 0.95);
  return room(H.heroRoom, t, { time: 'night', storm: 1, sleep: true, flash: fl, clock: '1:58' }, cam, { behind: hero, chars: lieHead(hero) });
}
// ---- 3. the talent show is in four days (thought bubble)
function bubbleInner(t) {
  // stage with curtains + spotlight + a tiny trembling hero; kids laughing in the front row; "4 DAYS" stamp
  let o = S.rect(-500, -300, 1000, 600, 0, { fill: '#3A1E6A' });
  o += S.path('M-500 -300 H500 V-200 Q250 -150 0 -200 Q-250 -150 -500 -200 Z', ol('#C8323C', 6));
  o += S.path('M-500 -300 L-330 -300 Q-380 0 -300 180 L-500 180 Z', ol('#E0414B', 6)) + S.path('M500 -300 L330 -300 Q380 0 300 180 L500 180 Z', ol('#E0414B', 6));
  o += S.path('M-60 -300 L-190 130 L190 130 L60 -300 Z', { fill: '#FFF6C8', opacity: 0.35 });
  o += S.rect(-500, 100, 1000, 60, 0, ol('#8A5A33', 6));
  const tr = Math.sin(t * 40) * 3;
  o += S.g(actor('you', t, { x: -40, y: 105, s: 0.24, face: { name: 'scared', fx: ['sweat2'] }, armL: 12, armR: 12, volume: false, shadow: false }, { arms: false }), `translate(${f(tr)} 0)`);
  // the front row (laughing kids)
  for (let i = 0; i < 5; i++) {
    const x = -300 + i * 150, b = Math.abs(Math.sin(t * 9 + i)) * 10;
    o += K.draw.kid(i + 3, { x, y: 400 - b, s: 0.24, face: { name: 'joy' }, armR: 110 + 20 * Math.sin(t * 12 + i), armL: 20, volume: false, shadow: false });
  }
  const sk = seg(t, w(0, 'four') - 0.05, w(0, 'four') + 0.3);
  o += TFS('TALENT SHOW · FRIDAY', 0, -150, 50, '#FFE14D');
  o += E.stamp('4 DAYS', 210, -20, sk, 84, -14, '#FF3B4E');
  return o;
}
function sh03(t) {
  const cam = camKeys(t, [[c03, at(420, 560, 1.75)], [c04, at(440, 540, 1.9)]], ease.inOut);
  const sk = seg(t, w(0, 'four') - 0.05, w(0, 'four') + 0.3);
  const look = t < c03 + 0.5 ? [1, 0] : [0.4, 0.8];
  const hero = you(t, { ...LIE, face: lieFace(t, look, { name: sk > 0 ? 'scared' : 'neutral', fx: sk > 0 ? ['sweat'] : [] }) });
  let o = room(H.heroRoom, t, { time: 'night', storm: 1, sleep: true, clock: '1:58' }, cam, { behind: hero, chars: lieHead(hero) });
  o += E.thought(1250, 390, 1040, 620, seg(t, c03 + 0.05, c03 + 0.4), S.g(bubbleInner(t), 'scale(0.84)'), [-1, 1]);
  o += bangAt(t, 'GULP', 520, 820, w(0, 'days') + 0.2, 0.8, 90, -8, '#FFFFFF');
  return o;
}
// ---- 4. so you went where you always go: tiptoe across the dark room to the desk
function sh04(t) {
  const u = seg(t, c04 + 0.15, c05 - 0.1);
  const x = lerp(560, 1120, ease.inOut(u));
  const cam = camKeys(t, [[c04, at(820, 610, 1.15)], [c05, at(1030, 600, 1.22)]], ease.inOut);
  const ph = (t - c04) * 9;
  const hero = you(t, { x, y: 975, s: 0.5, view: 'side', flip: true, ...AC.walk(ph, 0.8), lean: 6, face: fc('sneaky', t, 1, { eyes: { look: [1, 0] } }) }, { arms: false });
  const fl = bump(t, c04 + 1.1, c04 + 1.3);
  let o = room(H.heroRoom, t, { time: 'night', storm: 1, flash: fl, clock: '1:59', monitorGlow: 0 }, cam, { chars: hero });
  return o;
}
// ---- 5. the monitor wakes up and lights his face; "scary" = a thunder flash behind him
function sh05(t) {
  const tOn = c05 + 0.18, tScary = w(0, 'scary');
  const cam = camKeys(t, [[c05, at(960, 520, 1.0)], [c06, at(960, 500, 1.14)]], ease.out);
  shakeAll(cam, t, [[tScary, 0.35, 12]]);
  const on = t < tOn ? 0 : clamp((t - tOn) / 0.3, 0, 1) * (t < tOn + 0.3 ? (Math.floor(t * 30) % 2 ? 1 : 0.4) : 1);
  const fl = bump(t, tScary - 0.02, tScary + 0.25);
  const scared = t > tScary - 0.05 && t < tScary + 0.45;
  const phones = t > tScary + 0.45;
  const face = scared ? { name: 'scared', fx: ['sweat2'] } : t > tOn + 0.2 ? fc(phones ? 'happy' : 'amazed', t, 3) : fc('sleepy', t, 3, { fx: ['eyebags'] });
  const pose = { ...DFH, face, armL: 18, armR: 18, headphones: phones, lean: scared ? -4 : 0, bodyY: scared ? 14 : 0, ...(phones ? squash(t, tScary + 0.45, 0.08, 0.4) : {}) };
  const Ly = H.deskFace.layers(t, { time: 'night', storm: 1, flash: fl, glow: 'blue', glowK: on, flicker: 0.6 });
  let o = view(cam, Ly.bg, 0.8) + view(cam, Ly.mid + you(t, pose, { arms: false }) + Ly.front + Ly.light, 1);
  o += bangAt(t, 'KRAKOOM!', 520, 230, tScary, 0.6, 110, -8, '#FFFFFF');
  return o;
}
// ---- 6. MEGA OBBY — parkour along the course; "1000 STAGES"
function parkourKeys() {
  const D = c07 - c06, P = OW.platforms;
  const seq = [[0, 0, 0], [0.12, 1, 150], [0.26, 3, 210], [0.38, 4, 160], [0.5, 5, 130], [0.62, 6, 150], [0.78, 8, 230], [0.9, 9, 150], [1.04, 10, 150]];
  return seq.map(([u, pi, h]) => [c06 + u * D, P[pi].x - 30, P[pi].y, h]);
}
const PK = parkourKeys();
function sh06(t) {
  const hp = hops(t, PK);
  const cam = { zoom: 0.82, x: hp.x - 960 + 160, y: hp.y - 790 };
  const sq = hp.air ? { sx: 0.94, sy: 1.08 } : squash(t, t - hp.land, 0.22, 0.4);
  const airPose = { legL: 50, kneeL: 70, legR: -20, kneeR: 60, armL: 150, armR: 120, lean: 8 };
  const pose = { x: hp.x, y: hp.y, s: OW.s, view: 'side', flip: true, ...(hp.air ? airPose : AC.run(t * 18)), ...(hp.air ? sq : squash(t, PK[Math.max(1, hp.i)][0], 0.2, 0.35)), face: { name: 'joy' } };
  const Ly = H.obbyWorld.layers(t, cam, { stage: 997 });
  let o = Ly.bg + Ly.mid + view(cam, you(t, pose, { arms: false }), 1) + (Ly.fg || '') + (Ly.light || '');
  const tk = pop(t, w(1, 'One') - 0.05, 0.35);
  if (tk > 0.01) {
    o += S.g(K.rays(0, 0, 14, 600, '#FFE14D', 0.25, t * 30) + T('1000', 6, 16, 230, '#3A1E6A') + T('1000', 0, 0, 230, '#FFE14D', E.stroke(230)) + TS('STAGES', 0, 110, 100, '#FFFFFF'), `translate(960 210) rotate(-4) scale(${f(0.72 * tk * (1 + 0.04 * Math.sin(t * 8)))})`);
  }
  o += streaks(t, 0.6, '#FFFFFF', 10, 7, 1, 3200);
  return o;
}
// ---- 7. three months: the stage counter races, the clock spins, DAY 1 -> 92
function sh07(t) {
  const u = seg(t, c07 + 0.15, c08 - 0.3);
  const stage = Math.round(lerp(1, 998, ease.inOut(u)));
  const cam = camKeys(t, [[c07, at(980, 560, 1.0)], [c08, at(960, 520, 1.1)]], ease.inOut);
  const mins = 120 + (t - c07) * 1900;
  const clock = `${Math.floor(mins / 60) % 12 || 12}:${String(Math.floor(mins % 60)).padStart(2, '0')}`;
  const day = Math.floor(t * 3) % 2;
  const Ly = H.deskClose.layers(t, { time: 'night', storm: 0.4 + 0.6 * day, monitor: game(t, { stage }), clock });
  let o = view(cam, Ly.bg, 0.85) + view(cam, Ly.mid + bowlDesk(t, { look: [0.8, -0.4] }) + E.deskArms(t, { typing: 1 }) + Ly.light, 1);
  o += R.counterHUD({ x: 1850, y: 110, anchor: 'right', k: seg(t, c07 + 0.1, c07 + 0.4), label: 'DAY', value: Math.round(lerp(1, 92, ease.inOut(u))), t, icon: 'cal', theme: 'white', bump: seg(t, w(1, 'months'), w(1, 'months') + 0.45) });
  o += bangAt(t, '3 MONTHS', 1480, 290, w(1, 'three') - 0.05, c08 - w(1, 'three') + 0.05, 100, 6, '#FFE14D');
  return o;
}
// ---- 8. 4,816 falls: a grid of screens, every avatar falling into lava, the counter rolling
function sh08(t) {
  const tF = w(2, 'Four'), tS = w1(2, 'sixteen'), tFalls = w(2, 'falls');
  const zoom = lerp(2.9, 1, ease.inOut(seg(t, c08 + 0.1, tS - 0.3)));
  let o = S.rect(0, 0, 1920, 1080, 0, { fill: '#120B2E' });
  let g = '';
  const cw = 560, ch = 315, gx = 600, gy = 340;
  for (let i = 0; i < 9; i++) {
    const cx = 960 + ((i % 3) - 1) * gx, cy = 520 + (Math.floor(i / 3) - 1) * gy;
    const v = ((t - c08) * 1.1 + hash(i * 3.3) * 1.4) % 1.4;
    const o_ = v < 0.85 ? { fall: v / 0.85 } : { respawn: (v - 0.85) / 0.55 };
    const scr = H.gameScreen(t, { ...o_, stage: 400 + i * 61, hud: false, title: false, lava: 1 })(cw, ch);
    g += S.rect(cx - cw / 2 - 12, cy - ch / 2 - 12, cw + 24, ch + 24, 20, ol('#24262E', 8)) + S.g(scr, `translate(${f(cx)} ${f(cy)})`);
  }
  o += S.g(g, `translate(960 520) scale(${f(zoom)}) translate(-960 -520)`);
  o += S.rect(0, 0, 1920, 1080, 0, { fill: '#120B2E', opacity: f(0.35 * seg(t, tF, tF + 0.4)) });
  const roll = seg(t, tF, tS);
  const k = seg(t, tF - 0.1, tF + 0.2);
  const b = seg(t, tFalls, tFalls + 0.45);
  o += R.counterHUD({ x: 960, y: 430, k, anchor: 'center', label: 'FALLS:', value: 4816, roll, from: 0, t, bump: b, size: 110, labelSize: 46, s: 1.25 });
  o += R.counterHUD({ x: 960, y: 610, k: seg(t, tF + 0.2, tF + 0.5), anchor: 'center', label: 'RESPAWNS:', value: 4816, roll, from: 0, t, theme: 'green', bump: b, size: 90, labelSize: 40 });
  return o;
}
// ---- 9. "And nobody laughed. Nobody even remembered." — into the lava; an empty chat
function sh09(t) {
  const P = OW.platforms;
  const tJ = c09 + 0.12, tLaugh = w(2, 'laughed');
  const keys = [[c09, P[1].x - 60, P[1].y], [tJ, P[1].x + 40, P[1].y], [tLaugh, 1420, OW.lavaY - 20, 150]];
  const hp = hops(t, keys);
  const cam = camKeys(t, [[c09, at(1150, 640, 1.25)], [tLaugh, at(1300, 680, 1.25)], [c10, at(1150, 560, 0.92)]], ease.inOut);
  const Ly = H.obbyWorld.layers(t, cam, { stage: 997 });
  let w_ = '';
  if (t < tLaugh) {
    const pose = { x: hp.x, y: hp.y, s: OW.s, view: 'side', flip: true, face: { name: t > tJ + 0.25 ? 'scared' : 'determined' }, ...(t < tJ ? AC.run(t * 18) : { legL: 30, kneeL: 40, legR: -30, kneeR: 50, armL: 170, armR: 160, lean: -10 }) };
    w_ += you(t, pose, { arms: false });
  } else {
    w_ += R.crumble({ x: 1420, y: OW.lavaY - 20, s: OW.s, age: t - tLaugh, seed: 7, dir: [0.3, -1], floorY: OW.lavaY - 10, life: 1.6 });
    // lava splash
    const a = t - tLaugh;
    if (a < 0.6) w_ += R.foamSplash(1420, OW.lavaY - 10, a, { s: 0.9, n: 10, seed: 2 }).replace(/#FFFFFF/g, '#FFD23F');
  }
  let o = Ly.bg + Ly.mid + view(cam, w_, 1) + (Ly.fg || '') + (Ly.light || '');
  const ck = seg(t, tLaugh + 0.15, tLaugh + 0.45);
  const lines = t > tLaugh + 0.5 ? [['you fell into lava.', '#FF9AA6']] : [];
  o += S.g(E.chatBox(0, 0, ck, t, lines), 'translate(1180 110) scale(1.3)');
  if (t > tLaugh + 0.7) o += TF('...', 1520, 380, 70, '#7E8596');
  o += R.counterHUD({ x: 60, y: 110, k: 1, label: 'FALLS:', value: t > tLaugh + 0.1 ? 4817 : 4816, t, bump: seg(t, tLaugh + 0.1, tLaugh + 0.55), s: 0.8 });
  return o;
}
// ---- 10. "You just... respawned." — the pop on the checkpoint
function sh10(t) {
  const sp = { x: OW.checkpoints[0].x - 20, y: OW.checkpoints[0].y, s: OW.s };
  const tP = w(2, 'respawned') + 0.05, age = t - tP;
  const tGo = tP + 0.85;
  const run = hops(t, [[tGo, sp.x, sp.y], [tGo + 0.35, sp.x + 260, sp.y], [tGo + 0.75, OW.platforms[1].x, OW.platforms[1].y, 170]]);
  const cam = camKeys(t, [[c10, at(sp.x + 40, 520, 1.55)], [tGo, at(sp.x + 40, 540, 1.7)], [c11, at(sp.x + 420, 520, 1.3)]], ease.inOut);
  const Ly = H.obbyWorld.layers(t, cam, { stage: 997 });
  let w_ = R.respawnPop({ ...sp, age, part: 'back' });
  if (age >= 0) {
    const pp = R.popPose(age, sp.s);
    const ta = seg(t, tP + 0.45, tP + 0.75);
    if (t < tGo) w_ += you(t, { ...sp, sx: pp.sx, sy: pp.sy, lift: pp.lift, face: fc(ta > 0 ? 'happy' : 'amazed', t, 1), armL: 20 + 50 * ta, armR: 20 + 50 * ta, turn: 0.2 }, { arms: false });
    else w_ += you(t, { x: run.x, y: run.y, s: sp.s, view: 'side', flip: true, ...(run.air ? { legL: 50, kneeL: 70, legR: -20, kneeR: 60, armL: 150, armR: 120 } : AC.run(t * 18)), face: { name: 'determined' } }, { arms: false });
    w_ += R.forcefield({ ...sp, x: t < tGo ? sp.x : run.x, y: t < tGo ? sp.y : run.y, t, k: 1 - seg(t, tGo, c11) * 0.6 });
  }
  w_ += R.respawnPop({ ...sp, age, part: 'front' });
  let o = Ly.bg + Ly.mid + view(cam, w_, 1) + (Ly.fg || '') + (Ly.light || '');
  if (age > -0.8) o += R.respawnOverlay(t, { t0: tP - 0.75, dur: 0.75, style: 'corner', label: 'RESPAWNING', x: 1860, y: 80, flash: false });
  return o;
}
// ---- 11. "I wish real life had checkpoints." — a sigh in the monitor light
function sh11(t) {
  const cam = camKeys(t, [[c11, at(960, 470, 1.25)], [c12, at(960, 440, 1.5)]], ease.linear);
  const sigh = bump(t, A[3].a - 0.05, A[3].a + 0.6);
  const tC = w(3, 'checkpoints');
  const gk = bump(t, tC - 0.05, tC + 0.7);
  const glow = R.mix('#6FA8FF', '#3DDC84', gk);
  const pose = { ...DFH, face: { name: 'sad', eyes: { look: [-0.5, -0.7], upper: 0.2 }, fx: [] }, armL: 16, armR: 16, headphones: true, bodyY: 20 * sigh, headRot: -8 * seg(t, c11, A[3].a + 0.5) };
  const Ly = H.deskFace.layers(t, { time: 'night', storm: 1, glow, glowK: 1, flicker: 0.4 });
  let o = view(cam, Ly.bg, 0.8) + view(cam, Ly.mid + you(t, pose, { arms: false }) + Ly.front + Ly.light, 1);
  if (gk > 0.05) o += K.sparkles([[toS(cam, 900, 420)[0], toS(cam, 900, 420)[1], 26 * gk]], t);
  return o;
}
// ---- 12. "Two in the morning." — the clock ticks to 2:00, thunder in the window
function sh12(t) {
  const tM = w(4, 'morning');
  const cam = camKeys(t, [[c12, at(190, 250, 2.7)], [c13, at(220, 235, 3.0)]], ease.out);
  shakeAll(cam, t, [[tM + 0.1, 0.4, 10]]);
  const fl = bump(t, tM + 0.08, tM + 0.4);
  const Ly = H.deskClose.layers(t, { time: 'night', storm: 1, flash: fl, monitor: game(t, {}), clock: t < tM ? '1:59' : '2:00' });
  let o = view(cam, Ly.bg, 0.9) + view(cam, Ly.mid + Ly.light, 1);
  o += bangAt(t, '2:00 AM', 1450, 820, tM, c13 - tM + 0.05, 110, -6, '#FFFFFF');
  return o;
}
// ---- 13. "Stage nine hundred and ninety-nine." — push in on the screen
function sh13(t) {
  const tN = w(4, 'ninety-nine');
  const cam = camKeys(t, [[c13, at(900, 600, 1.0)], [c14, at(1000, 430, 1.45)]], ease.inOut);
  const Ly = H.deskClose.layers(t, { time: 'night', storm: 1, monitor: game(t, {}), clock: '2:00' });
  let o = view(cam, Ly.bg, 0.85) + view(cam, Ly.mid + bowlDesk(t, { look: [1, -0.5] }) + E.deskArms(t, { typing: 0.4 }) + Ly.light, 1);
  o += R.counterHUD({ x: 1850, y: 110, k: seg(t, tN - 0.6, tN - 0.3), anchor: 'right', label: 'STAGE', value: 999, theme: 'gold', icon: 'star', t, bump: seg(t, tN, tN + 0.45), size: 80 });
  return o;
}
// ---- 14. "One jump left." — the game screen full frame: from the avatar up to the golden 1000 flag
function sh14(t) {
  const tL = w(4, 'left');
  const u = ease.inOut(seg(t, c14 + 0.1, tL + 0.2));
  const zoom = lerp(1.6, 1.25, u), cx = lerp(560, 900, u), cy = lerp(690, 420, u);
  let g = S.g(H.gameScreen(t, { hud: false, title: false })(1920, 1080), 'translate(960 540)');
  // the jump arc guide
  g += E.airLine([[560, 690], [640, 560], [740, 470], [860, 430], [960, 440]], seg(t, c14 + 0.25, tL), '#FFFFFF', 8, '20 18');
  let o = S.g(g, `translate(960 540) scale(${f(zoom)}) translate(${f(-cx)} ${f(-cy)})`);
  o += bangAt(t, '1 JUMP LEFT', 1400, 860, tL - 0.05, c15 - tL + 0.1, 96, -6, '#FFE14D');
  o += E.pulseVignette(t, 0.6);
  return o;
}
// ---- 15. ECU: the eyes
function sh15(t) {
  const cam = camKeys(t, [[c15, at(960, 430, 3.3)], [c16, at(960, 430, 3.7)]], ease.linear);
  const Ly = H.deskFace.layers(t, { time: 'night', storm: 1, glow: 'blue', glowK: 1, flicker: 1 });
  const pose = { ...DFH, face: { name: 'determined', eyes: { look: [0, 0.15] }, fx: ['sweat'] }, headphones: true, armL: 16, armR: 16, volume: false };
  let o = view(cam, Ly.bg, 0.8) + view(cam, Ly.mid + you(t, pose, { arms: false }) + Ly.light, 1);
  o += E.pulseVignette(t, 1);
  return o;
}
// ---- 16. ECU: the finger on SPACE
function sh16(t) {
  // insert shot: a giant SPACE key cap, the finger (hand block) comes down from above and slams it
  const cam = camKeys(t, [[c16, at(960, 920, 3.0)], [c17, at(960, 925, 3.2)]], ease.linear);
  const pr = seg(t, tPress - 0.12, tPress) * (1 - seg(t, tPress + 0.16, tPress + 0.36));
  const hover = 1 - seg(t, c16, tPress - 0.12);
  const Ly = H.deskClose.layers(t, { time: 'night', storm: 1, monitor: game(t, {}), clock: '2:00' });
  let o = view(cam, Ly.bg, 0.85) + view(cam, Ly.mid + Ly.light, 1);
  o += S.rect(0, 0, 1920, 1080, 0, { fill: '#05070F', opacity: 0.45 });
  const ky = 760 + 22 * pr;
  let key = S.rect(-470, 30, 940, 150, 30, ol('#15171F', 10)) + S.rect(-470, -60, 940, 170, 30, ol(pr > 0.5 ? '#3D4560' : '#2E3242', 10));
  key += S.rect(-440, -46, 880, 40, 18, { fill: '#FFFFFF', opacity: 0.08 });
  key += TF('SPACE', 0, 50, 72, pr > 0.5 ? '#FFFFFF' : '#9DB0D0', { 'letter-spacing': 12 });
  key += S.rect(-470, -60, 940, 170, 30, { fill: 'none', stroke: '#7DFFD0', 'stroke-width': 6, opacity: f(0.4 + 0.6 * pr) });
  o += S.g(key, `translate(960 ${f(ky)})`);
  // the arm + hand from the upper right
  const hx = 1010 + 40 * hover, hy = ky - 100 - 260 * hover + 10 * Math.sin(t * 30) * hover;
  let arm = S.path(`M${f(hx + 120)} ${f(hy - 40)} L${f(2200)} ${f(hy - 900)} L${f(2400)} ${f(hy - 620)} L${f(hx + 170)} ${f(hy + 70)} Z`, ol('#D8262E', 10));
  arm += S.path(`M${f(hx + 90)} ${f(hy - 60)} L${f(hx + 200)} ${f(hy - 140)} L${f(hx + 260)} ${f(hy - 40)} L${f(hx + 150)} ${f(hy + 50)} Z`, ol('#F2D04A', 9));
  arm += S.rect(hx - 120, hy - 90, 260, 200, 40, ol('#FFFFFF', 10)) + S.path(`M${f(hx - 60)} ${f(hy + 100)} V${f(hy + 20)} M${f(hx + 10)} ${f(hy + 100)} V${f(hy + 30)}`, ln(6, '#C9CED8'));
  o += arm;
  if (t > tPress) {
    const k = seg(t, tPress, tPress + 0.3);
    o += S.ellipse(960, ky + 40, 500 + 500 * k, 120 + 160 * k, { fill: 'none', stroke: '#FFFFFF', 'stroke-width': f(18 * (1 - k)), opacity: f(1 - k) });
    o += zoomLines(960, ky, 1 - k, '#FFFFFF', 18, 3, 460);
  }
  o += bangAt(t, 'TAP!', 520, 330, tPress, 0.32, 110, -8, '#FFFFFF');
  o += E.pulseVignette(t, 1);
  return o;
}
// ---- 17. the slow-motion leap to the final flag; his hand touches it
const LEAP = { x0: OW.platforms[10].x, y0: OW.platforms[10].y, x1: 4935, y1: OW.final.y, h: 300 };
const leapAt = (ue) => [lerp(LEAP.x0, LEAP.x1, ue), lerp(LEAP.y0, LEAP.y1, ue) - 4 * LEAP.h * ue * (1 - ue)];
function sh17(t) {
  const u = seg(t, c17, tTouch);
  const ue = 1 - Math.pow(1 - u, 1.6);
  const [x, y] = leapAt(ue);
  const zoom = lerp(1.15, 1.45, u);
  const cam = { zoom, x: x + 160 / zoom - 960, y: y - 190 - 540 + 60 / zoom };
  const touched = t >= tTouch;
  const Ly = H.obbyWorld.layers(t, cam, { stage: 997, flag: touched ? 1 : 0.6, win: 0.6 * seg(t, tTouch, tTouch + 0.12) });
  const pose = { x, y, s: OW.s, view: 'side', flip: true, legL: 40 - 20 * u, kneeL: 30, legR: -40, kneeR: 70, armL: touched ? 175 : 120 + 50 * u, armR: 90 + 30 * u, lean: 12, face: { name: touched ? 'joy' : 'determined' } };
  let w_ = '';
  for (let i = 3; i >= 1; i--) {
    const [tx, ty] = leapAt(Math.max(0, ue - i * 0.05));
    w_ += S.g(R.tint(you(t, { ...pose, x: tx, y: ty, shadow: false, volume: false }, { arms: false }), 'white'), null, { opacity: f(0.12 * (4 - i)) });
  }
  w_ += you(t, pose, { arms: false });
  let o = Ly.bg + Ly.mid + view(cam, w_, 1) + (Ly.fg || '') + (Ly.light || '');
  o += S.rect(0, 0, 1920, 1080, 0, { fill: '#1A2A6A', opacity: f(0.18 * (1 - seg(t, tTouch, tTouch + 0.05))) });
  o += streaks(t * 0.25, 0.8, '#FFFFFF', 12, 9, 1, 2600);
  o += E.pulseVignette(t, touched ? 0.3 : 0.7);
  if (touched) {
    const k = seg(t, tTouch, c18);
    const p = toS(cam, OW.final.flag.x - 10, y - 330);
    o += K.C.burst(p[0], p[1], k, '#FFFFFF') + S.circle(p[0], p[1], 40 + 300 * ease.out(k), { fill: 'none', stroke: '#FFFFFF', 'stroke-width': f(18 * (1 - k)), opacity: f(1 - k) });
    o += R.flash(0.65 * seg(t, c18 - 0.06, c18), '#FFFFFF');
  }
  return o;
}
// ---- 18. the same instant: lightning hits the house
function sh18(t) {
  const cam = { ...at(900, 380, 1.08) };
  shakeAll(cam, t, [[tStrike, 0.5, 26]]);
  const lit = t > tStrike ? 1 - 0.7 * seg(t, tStrike, tStrike + 0.25) : 0;
  let o = E.nightHouse(t, cam, { flash: lit, green: t > tStrike + 0.05 });
  const roof = H.toScreen(cam, H.SPOTS.street.house.roofTop);
  o += R.lightning({ x0: 1240, y0: -40, x1: roof.x, y1: roof.y + 30, seed: 11, k: seg(t, tStrike, tStrike + 0.55), width: 1.6, flash: false, branches: 4 });
  if (t > tStrike) o += E.sparks(roof.x, roof.y + 20, 240, t, 1, 3) + E.sparks(roof.x, roof.y + 140, 200, t, 0.7, 8);
  o += R.flash(0.7 * (1 - seg(t, tStrike, tStrike + 0.12)) * (t > tStrike ? 1 : 0) + seg(t, c19 - 0.16, c19), '#FFFFFF');
  o += bangAt(t, 'KRA-KOOM!', 1380, 820, tStrike, c19 - tStrike, 130, -8, '#FFE14D');
  return o;
}
// ---- 19a. the power surge: the room flickers, the string lights pop, sparks, the screen floods the room with green
function sh19a(t) {
  const cam = camKeys(t, [[c19a, at(1150, 540, 1.02)], [c19, at(1290, 500, 1.38)]], ease.inOut);
  shakeAll(cam, t, [[c19a, 0.4, 16], [c19a, c19 - c19a, 4]]);
  const step = Math.floor(t * 15);
  const flick = t < c19a + 0.8 ? (hash(step * 1.7) > 0.55 ? 1 : 0) : 0;
  const green = ease.inOut(seg(t, c19a + 0.5, c19 - 0.2));
  const L_ = H.heroRoom.layers(t, { time: 'night', storm: 1, monitor: game(t, { win: green }), greenGlow: green, flash: flick * 0.6, lights: flick ? 1 : 0.2, monitorGlow: 0.6 + 0.4 * flick, clock: '2:00' });
  const hero = chairSit(t, { armL: 165 + 6 * Math.sin(t * 50), armR: 165 + 6 * Math.sin(t * 46), headRot: 4 * Math.sin(t * 40) });
  let wd = L_.mid + bowlRoom(t, { look: [0.6, -0.6], blink: 0 }) + hero + L_.front + E.clipRect(1000, 200, 420, HR.chair.seat - 190 - 200, hero) + L_.light;
  const sc = HR.monitor.screen;
  wd += E.sparks(sc.cx - 260, sc.cy - 120, 180, t, 1, 2, '#9DFFCB') + E.sparks(sc.cx + 250, sc.cy + 140, 170, t, 1, 7, '#BFF6FF') + E.sparks(1560, 760, 150, t, 0.8, 11);
  let o = view(cam, L_.bg, 0.85) + view(cam, wd, 1);
  o += R.flash(1 - seg(t, c19a, c19a + 0.3), '#FFFFFF');
  o += bangAt(t, 'BZZZT!', 1450, 250, c19a + 0.25, 0.9, 100, 8, '#9DFFCB');
  return o;
}
// ---- 19. frozen in the YES pose; the room hums green, sparks crawl over the desk
function sh19(t) {
  const cam = camKeys(t, [[c19, at(960, 500, 1.08)], [c20, at(960, 480, 1.18)]], ease.out);
  shakeAll(cam, t, [[c19, c20 - c19, 3]]);
  const down = ease.inOut(seg(t, c20 - 0.4, c20));
  const pose = { ...DFH, face: { name: t > c19 + 0.5 ? 'confused' : 'shocked', eyes: { look: [0, 0.2] }, fx: t > c19 + 0.5 ? ['question'] : ['exclaim'] }, headphones: true, armL: lerp(165, 20, down) + 3 * Math.sin(t * 50), armR: lerp(165, 20, down) + 3 * Math.sin(t * 47), lean: 0 };
  const Ly = H.deskFace.layers(t, { time: 'night', storm: 1, glow: 'green', glowK: 1, flicker: 0.8, greenGlow: 0.6 });
  let o = view(cam, Ly.bg, 0.8) + view(cam, Ly.mid + you(t, pose, { arms: false }) + Ly.front + Ly.light, 1);
  o += E.sparks(400, 900, 260, t, 0.8, 5) + E.sparks(1560, 880, 240, t, 0.8, 9);
  o += smash(t, c19, 0.12, 0.5, '#B6FFD6');
  return o;
}
// ---- 20. the screen floods green; FINAL CHECKPOINT REACHED
function sh20(t) {
  const cam = camKeys(t, [[c20, at(980, 520, 1.0)], [c21, at(1000, 450, 1.25)]], ease.inOut);
  const tR = w(6, 'reached');
  const win = seg(t, c20 - 0.4, c20 + 0.3);
  const Ly = H.deskClose.layers(t, { time: 'night', storm: 1, monitor: game(t, { win }), clock: '2:00', greenGlow: 0.8 });
  let wd = Ly.mid + bowlDesk(t, { look: [1, -0.6], blink: 0 });
  wd += Ly.light;
  wd += E.sparks(DC.screen.cx - 560, DC.screen.cy - 300, 200, t, 1, 2, '#9DFFCB') + E.sparks(DC.screen.cx + 560, DC.screen.cy + 280, 200, t, 1, 6, '#9DFFCB');
  wd += R.sysWindow({ x: DC.screen.cx, y: DC.screen.cy, w: 860, h: 360, k: seg(t, tR - 0.05, tR + 0.3), t, theme: 'green', title: 'SYSTEM', icon: 'check', lines: ['FINAL CHECKPOINT', 'REACHED'] });
  return view(cam, Ly.bg, 0.85) + view(cam, wd, 1);
}
// ---- 21. Exporting... to real life (the progress bar)
function sh21(t) {
  const cam = camKeys(t, [[c21, at(1000, 420, 1.55)], [c22, at(1000, 420, 1.75)]], ease.linear);
  shakeAll(cam, t, [[c21, c22 - c21, 3 + 6 * exportP(t)]]);
  const Ly = H.deskClose.layers(t, { time: 'night', storm: 1, monitor: greenGame(t), clock: '2:00', greenGlow: 1 });
  let o = view(cam, Ly.bg, 0.85) + view(cam, Ly.mid + Ly.light, 1);
  const p = exportP(t);
  o += R.sysWindow({ x: 960, y: 470, w: 1340, h: 600, k: seg(t, c21, c21 + 0.3), t, theme: 'green', title: 'SYSTEM', icon: 'export', lines: ['FINAL CHECKPOINT REACHED', 'Exporting to real life…'], progress: p, small: p >= 1 ? 'Export complete.' : 'Do not turn off your life.' });
  o += E.sparks(220, 200, 260, t, 0.7 + 0.3 * p, 4, '#9DFFCB') + E.sparks(1700, 860, 260, t, 0.7 + 0.3 * p, 8, '#9DFFCB');
  if (t > w1(6, 'life') - 0.05) o += R.flash(0.5 * (1 - seg(t, w1(6, 'life') - 0.05, w1(6, 'life') + 0.3)), '#9DFFCB');
  return o;
}
// ---- 22. "Exporting to WHAT?"
function sh22(t) {
  const tW = w(7, 'WHAT');
  const cam = camKeys(t, [[c22, at(960, 500, 1.15)], [tW, at(960, 470, 1.35)], [c23, at(960, 460, 1.5)]], ease.out);
  const flare = seg(t, tW - 0.2, c23);
  const pose = { ...DFH, face: t > tW - 0.05 ? { name: 'shocked', fx: ['exclaim'] } : { name: 'confused', fx: ['question'] }, headphones: true, armL: 30, armR: 30, lean: -8 * seg(t, c22, tW) };
  const Ly = H.deskFace.layers(t, { time: 'night', storm: 1, glow: 'green', glowK: 1 + flare, flicker: 0.5 + flare, greenGlow: 0.6 + 0.4 * flare });
  let o = view(cam, Ly.bg, 0.8) + view(cam, Ly.mid + you(t, pose, { arms: false }) + Ly.front + Ly.light, 1);
  o += R.flash(0.3 * flare, '#B6FFD6');
  return o;
}
// ---- 23. the pad bursts out of the screen and plants itself in the rug; he leaps out of the chair
const PADB = [[HR.monitor.screen.cx, HR.monitor.screen.cy], [700, -120], [180, 760], [CP.x, CP.y]];   // bezier: out of the screen, a loop under the ceiling, down into the rug
function padFlight(t) {
  const u = seg(t, tBurst, tPlant), v = 1 - u;
  const bz = (i) => v * v * v * PADB[0][i] + 3 * v * v * u * PADB[1][i] + 3 * v * u * u * PADB[2][i] + u * u * u * PADB[3][i];
  return { x: bz(0), y: bz(1), s: lerp(0.12, CP.s, ease.out(Math.min(1, u * 1.6))), rot: -560 * (1 - ease.out(u)), u };
}
function padSvg(t, state = 'idle', extra = {}) {
  if (t < tBurst) return { back: '', front: '' };
  if (t < tPlant) {
    const p = padFlight(t);
    let tr = '';
    for (let i = 3; i >= 1; i--) {   // green afterimages
      const q = padFlight(t - i * 0.035);
      tr += S.ellipse(q.x, q.y, 420 * q.s, 112 * q.s, { fill: '#7CFFB2', opacity: f(0.12 * (4 - i)), transform: `rotate(${f(q.rot)} ${f(q.x)} ${f(q.y)})` });
    }
    const all = R.checkpoint({ x: 0, y: 0, s: p.s, t, state: 'saved' });
    return { back: '', front: tr + S.g(all, `translate(${f(p.x)} ${f(p.y)}) rotate(${f(p.rot)})`) };
  }
  const a = t - tPlant;
  const sq = squash(t, tPlant, 0.25, 0.5);
  const o = { ...CP, t, state, ...extra };
  let back = S.g(R.checkpoint({ ...o, x: 0, y: 0, part: 'back' }), `translate(${f(CP.x)} ${f(CP.y)}) scale(${f(sq.sx)} ${f(sq.sy)})`);
  if (a < 0.6) {
    const k = a / 0.6;
    back = S.ellipse(CP.x, CP.y + 10, 200 + 700 * ease.out(k), (200 + 700 * ease.out(k)) * 0.27, { fill: 'none', stroke: '#7CFFB2', 'stroke-width': f(34 * (1 - k) + 3), opacity: f(1 - k) }) + back;
  }
  let front = S.g(R.checkpoint({ ...o, x: 0, y: 0, part: 'front' }), `translate(${f(CP.x)} ${f(CP.y)}) scale(${f(sq.sx)} ${f(sq.sy)})`);
  if (a < 0.5) front += K.C.dust(CP.x - 260, CP.y + 10, tPlant, t) + K.C.dust(CP.x + 120, CP.y + 10, tPlant + 0.03, t);
  return { back, front };
}
function sh23(t) {
  const cam = camKeys(t, [[c23, at(1150, 560, 1.12)], [tBurst, at(1100, 560, 1.05)], [tPlant, at(1000, 580, 0.98)], [tPlant + 0.15, at(1000, 590, 1.0)], [c24, at(1300, 500, 1.45)]], ease.inOut);
  shakeAll(cam, t, [[c23, tBurst - c23 + 0.1, 4 + 8 * seg(t, c23, tBurst)], [tPlant, 0.4, 24]]);
  const leap = t >= tBurst;
  const lp = hops(t, [[tBurst, 1210, 880], [tBurst + 0.32, HSTAND.x, HSTAND.y, 140]]);
  const chairX = lerp(HR.chair.x, 1500, ease.out(seg(t, tBurst, tBurst + 0.6)));
  const pad = padSvg(t);
  let chars = '';
  if (!leap) chars = chairSit(t, { headRot: 6 * Math.sin(t * 40) });
  else {
    const air = t < tBurst + 0.32;
    const p = padFlight(t);
    const duck = t < tPlant ? bump(t, tBurst + 0.32, tPlant) : 0;
    const lookP = t < tPlant ? [clamp((p.x - HSTAND.x) / 500, -1, 1), clamp((p.y - 560) / 400, -1, 1)] : [-1, 0.6];
    chars = you(t, { x: lp.x, y: lp.y, s: 0.5, turn: -0.3, face: { name: t < tPlant ? 'scream' : 'shocked', eyes: { look: lookP } }, headphones: true, armL: air ? 160 : 120 + 40 * duck, armR: air ? 150 : 110 + 40 * duck, bodyY: 60 * duck, legL: air ? 20 : 0, legR: air ? -10 : 0, kneeL: air ? 40 : 0, ...(air ? { sx: 0.92, sy: 1.1 } : squash(t, tBurst + 0.32, 0.25, 0.5)) }, { arms: false });
  }
  const behind = bowlRoom(t, { look: [0.6, -0.4], blink: 0 });
  const L_ = H.heroRoom.layers(t, { time: 'night', storm: 1, monitor: greenLite(t), greenGlow: 1, chairX, clock: '2:03' });
  // in the chair he is drawn before the chair back (front layer) so only his head shows
  let wd = L_.mid + behind + (leap ? L_.front + pad.back + chars : chars + L_.front + pad.back);
  wd += pad.front + L_.light;
  let o = view(cam, L_.bg, 0.85) + view(cam, wd, 1);
  // the screen bulges with light
  const bul = seg(t, c23, tBurst) * (1 - seg(t, tBurst, tBurst + 0.25));
  if (bul > 0) {
    const sc = toS(cam, HR.monitor.screen.cx, HR.monitor.screen.cy);
    o += S.ellipse(sc[0], sc[1], 300 + 200 * bul, 200 + 140 * bul, { fill: 'url(#shGlowGreen)', opacity: f(bul) });
    o += S.g(K.rays(0, 0, 14, 900, '#B6FFD6', 0.22 * bul, t * 90), `translate(${f(sc[0])} ${f(sc[1])})`);
  }
  if (t > tBurst && t < tPlant) {
    const p = padFlight(t);
    const sp = toS(cam, p.x, p.y);
    o += zoomLines(sp[0], sp[1], 0.5, '#B6FFD6', 14, 5, 300);
  }
  o += smash(t, tBurst, 0.12, 0.55, '#B6FFD6');
  o += bangAt(t, 'BOOM!', 640, 300, tPlant, 0.55, 140, -8, '#3DDC84');
  return o;
}
// ---- 24. Tip squeezes out of the monitor, bounces off the desk and the pad, and lands by his face
function tipPath(t) {
  return hops(t, [[tTipOut, 1355, 440], [tTipOut + 0.3, 1590, 545, 130], [tTipOut + 0.75, 1010, 820, 260], [tTipOut + 1.15, TIPHOVER.x, TIPHOVER.y, 200]]);
}
function tipSvg(t, x, y, s, extra = {}, sq = { sx: 1, sy: 1 }) {
  const tp = R.tip({ x: 0, y: 0, s, t, ...extra });
  return S.g(tp, `translate(${f(x)} ${f(y)}) scale(${f(sq.sx)} ${f(sq.sy)})`);
}
function tipIntro(t) {
  // returns { svg (world), x, y }
  const e = seg(t, c24, tTipOut);
  if (t < tTipOut) {
    const sx = lerp(0.2, 0.9, ease.outBack(e)), sy = lerp(0.05, 1.25, ease.outBack(e));
    return { svg: tipSvg(t, 1355, 455 - 30 * e, 1.05, { look: [0, 0.3] }, { sx, sy }), x: 1355, y: 440 };
  }
  const hp = tipPath(t);
  let sq = { sx: 1, sy: 1 };
  if (hp.air) sq = { sx: 0.92, sy: 1.1 };
  else if (hp.land < 0.4) sq = squash(t, t - hp.land, 0.3, 0.4, 26);
  if (hp.i >= 0 && hp.i < 3 && hp.u > 0.9) sq = { sx: 1.2, sy: 0.82 };
  const look = hp.i >= 3 ? [-0.8, 0.2] : [hp.vx > 0 ? 0.6 : -0.6, 0.3];
  return { svg: tipSvg(t, hp.x, hp.y, 1.05, { look }, sq), x: hp.x, y: hp.y };
}
function sh24(t) {
  const tRL = w(8, 'Real');
  const cam = camKeys(t, [[c24, at(1370, 470, 2.0)], [tTipOut + 0.2, at(1400, 500, 1.7)], [tTipOut + 0.75, at(1180, 600, 1.12)], [c25, at(1260, 580, 1.3)]], ease.inOut);
  const tip = tipIntro(t);
  const lookX = clamp((tip.x - HSTAND.x) / 300, -1, 1);
  const hero = you(t, { ...HSTAND, turn: 0.35, face: { name: t < tTipOut + 1.2 ? 'shocked' : 'amazed', eyes: { look: [lookX, (tip.y - 560) / 400] } }, headphones: true, armL: 30, armR: 30, lean: -4 }, { arms: false });
  const pad = padSvg(t);
  const L_ = H.heroRoom.layers(t, { time: 'night', storm: 1, monitor: greenLite(t), greenGlow: 0.8, chairX: 1500, clock: '2:03' });
  let o = view(cam, L_.bg, 0.85) + view(cam, L_.mid + bowlRoom(t, { look: [0.8, -0.2] }) + L_.front + pad.back + hero + pad.front + L_.light + tip.svg, 1);
  if (t < tTipOut + 0.4) { const sc = toS(cam, 1355, 455); o += K.C.burst(sc[0], sc[1], seg(t, tTipOut - 0.1, tTipOut + 0.3), '#FFE14D'); }
  // WELCOME TO REAL LIFE!
  const bk = seg(t, tRL - 0.1, tRL + 0.3);
  if (bk > 0) {
    const sc = toS(cam, tip.x, tip.y);
    o += R.blockConfetti({ x: sc[0], y: sc[1] - 40, age: t - tRL + 0.1, n: 36, power: 1.1, s: 1, seed: 4 });
    const wav = (i) => Math.sin(t * 7 + i * 0.7) * 10;
    let ban = '';
    const words = ['WELCOME', 'TO', 'REAL', 'LIFE!'];
    let x = -(words.reduce((a, wd) => a + R.textW(wd, 118, 'L') + 70, 0) - 70) / 2;
    words.forEach((wd, i) => {
      const wk = ease.outBack(seg(t, tRL - 0.1 + i * 0.07, tRL + 0.2 + i * 0.07));
      const ww = R.textW(wd, 118, 'L');
      if (wk > 0.01) ban += S.g(T(wd, 0, 0, 118, i >= 2 ? '#3DDC84' : '#FFE14D', E.stroke(118)), `translate(${f(x + ww / 2)} ${f(wav(i))}) scale(${f(wk)})`);
      x += ww + 70;
    });
    o += S.g(ban, 'translate(960 170) rotate(-3)');
  }
  return o;
}
// ---- 25. the intro card: TIP · YOUR TUTORIAL
function sh25(t) {
  const sq = squash(t, c25 + 0.1, 0.18, 0.6);
  const tp = tipSvg(t, 620, 600 + 14 * Math.sin(t * 5), 3.4, { look: [0.2, 0.1] }, sq);
  let o = E.introCard(t, c25, w(8, 'tutorial') - 0.05, tp);
  o += smash(t, c25, 0.12, 0.7);
  return o;
}
// ---- 26. "TIP: Step on the checkpoint to save your progress!"
function sh26(t) {
  const tT = w(8, 'TIP', 1), tC = w(8, 'checkpoint');
  const cam = camKeys(t, [[c26, at(1100, 610, 1.08)], [c27, at(1070, 640, 1.2)]], ease.inOut);
  const pad = padSvg(t);
  const lookPad = t > tC - 0.1 && t < tC + 1.2;
  const hero = you(t, { ...HSTAND, turn: lookPad ? -0.2 : 0.4, face: fc(lookPad ? 'confused' : 'nervous', t, 2, { eyes: { look: lookPad ? [-1, 0.7] : [1, -0.2] } }), headphones: true, armL: 20, armR: 20 }, { arms: false });
  const tip = tipSvg(t, TIPHOVER.x, TIPHOVER.y, 1.05, { look: t > tC - 0.2 ? [-1, 0.6] : [-0.8, 0.1] });
  const L_ = H.heroRoom.layers(t, { time: 'night', storm: 1, monitor: greenLite(t), greenGlow: 0.7, chairX: 1500, clock: '2:03' });
  let o = view(cam, L_.bg, 0.85) + view(cam, L_.mid + bowlRoom(t) + L_.front + pad.back + hero + pad.front + L_.light + tip, 1);
  o += E.pointer(toS(cam, CP.x, CP.y - 120)[0], toS(cam, CP.x, CP.y - 120)[1], seg(t, tC - 0.1, tC + 0.2), t, '#FFD43B', 0.9);
  o += R.tipCard(620, 170, seg(t, tT - 0.05, tT + 0.3), 'TIP: Step on the checkpoint to save your progress!', { t, w: 820, type: seg(t, tT, w1(8, 'progress')) });
  return o;
}
// ---- 27. "You're a... talking pop-up." — backing away (toward the pad)
const BACK0 = HSTAND.x, BACK1 = 1110;
function sh27(t) {
  const u = seg(t, c27, c28 + 0.2);
  const x = lerp(BACK0, BACK1, ease.inOut(u));
  const cam = camKeys(t, [[c27, at(1250, 640, 1.45)], [c28, at(1200, 640, 1.55)]], ease.inOut);
  const pad = padSvg(t);
  const wf = AC.walkFront(t * 11, 0.7);
  const tp = w(9, 'pop-up');
  const point = seg(t, w(9, 'talking') - 0.1, w(9, 'talking') + 0.15);
  const hero = you(t, { ...HSTAND, x, turn: 0.55, ...wf, armL: 14, armR: lerp(20, 75, point) + 4 * Math.sin(t * 40), face: { name: 'scared', eyes: { look: [1, -0.3] } }, headphones: true, lean: -5 }, { arms: false, energy: 0.6 });
  const tx = lerp(TIPHOVER.x, 1360, ease.inOut(u));
  const spin = seg(t, tp, tp + 0.4);
  const tip = tipSvg(t, tx, TIPHOVER.y + 10, 1.05, { look: [-0.7, 0.1], mood: 'happy' }, { sx: Math.cos(spin * Math.PI * 2) || 0.05, sy: 1 });
  const L_ = H.heroRoom.layers(t, { time: 'night', storm: 1, monitor: greenLite(t), greenGlow: 0.7, chairX: 1500, clock: '2:03' });
  return view(cam, L_.bg, 0.85) + view(cam, L_.mid + L_.front + pad.back + hero + pad.front + L_.light + tip, 1);
}
// ---- 28. "A HELPFUL talking pop-up!" — Tip puffs up
function sh28(t) {
  const tHf = w(10, 'HELPFUL');
  const cam = camKeys(t, [[c28, at(1330, 520, 2.4)], [c29, at(1330, 510, 2.6)]], ease.out);
  const pad = padSvg(t);
  const puff = 1 + 0.28 * bump(t, tHf - 0.05, tHf + 0.55);
  const hero = you(t, { ...HSTAND, x: BACK1, turn: 0.55, face: { name: 'deadpan', eyes: { look: [1, -0.4] } }, headphones: true, armL: 14, armR: 14 }, { arms: false });
  const tip = tipSvg(t, 1360, TIPHOVER.y + 10, 1.05 * puff, { look: [-0.5, -0.1] });
  const L_ = H.heroRoom.layers(t, { time: 'night', storm: 1, monitor: greenLite(t), greenGlow: 0.7, chairX: 1500, clock: '2:03' });
  let o = view(cam, L_.bg, 0.85) + view(cam, L_.mid + L_.front + pad.back + hero + pad.front + L_.light + tip, 1);
  o += E.stamp('HELPFUL!', 1450, 820, seg(t, tHf + 0.05, tHf + 0.5), 96, -10, '#3DDC84');
  o += K.sparkles([[600, 300, 34], [1450, 230, 28], [1300, 700, 24]], t);
  return o;
}
// ---- 29. the careful step onto the pad
function sh29(t) {
  const cam = camKeys(t, [[c29, at(1010, 895, 2.6)], [c30, at(990, 900, 2.75)]], ease.out);
  const lift = seg(t, c29 + 0.05, tStep - 0.3);
  const fwd = seg(t, tStep - 0.3, tStep);
  const x = lerp(BACK1 + 20, 1030, ease.inOut(fwd));
  const y = lerp(HSTAND.y, CP.y + 6, ease.inOut(fwd));
  const on = t >= tStep;
  const pose = { x, y, s: 0.5, view: 'side', legL: on ? 0 : 50 * lift * (1 - fwd) + 10 * fwd, kneeL: on ? 0 : 70 * lift * (1 - fwd), legR: on ? 0 : -6 * fwd, armL: on ? 30 : -20 - 10 * lift, armR: on ? 30 : 40 + 10 * lift, lean: on ? 0 : -6, face: on ? { name: 'amazed' } : { name: 'nervous', eyes: { look: [-0.5, 0.9] }, fx: ['sweat'] }, headphones: true, ...(on ? squash(t, tStep, 0.12, 0.5) : {}) };
  const save = seg(t, tStep, tStep + 1.0);
  const pad = padSvg(t, on ? 'saved' : 'idle', on ? { save } : {});
  const tip = tipSvg(t, 1230 + 10 * Math.sin(t * 3), 790 + 8 * Math.sin(t * 2.4), 0.75, { look: [-0.9, 0.9], mood: 'happy' });
  const L_ = H.heroRoom.layers(t, { time: 'night', storm: 1, monitor: greenLite(t), greenGlow: 0.7 + 0.3 * save, chairX: 1500, clock: '2:03' });
  let o = view(cam, L_.bg, 0.85) + view(cam, L_.mid + L_.front + pad.back + you(t, pose, { arms: false }) + pad.front + L_.light + tip, 1);
  if (on) o += smash(t, tStep, 0.12, 0.5, '#B6FFD6');
  return o;
}
// ---- 30. Checkpoint saved: the green wave through the room
function sh30(t) {
  const cam = camKeys(t, [[c30, at(1000, 600, 1.0)], [c31, at(990, 580, 1.08)]], ease.out);
  const save = seg(t, tStep, tStep + 1.0);
  const pad = padSvg(t, 'saved', { save });
  const hero = you(t, { x: 920, y: CP.y + 6, s: 0.5, turn: 0.1, face: fc('amazed', t, 4, { eyes: { look: [0.3, -0.6] }, fx: ['sparkles'] }), headphones: true, armL: 40, armR: 40 }, { arms: false });
  const bounce = Math.abs(Math.sin((t - c30) * 9)) * 40;
  const tip = tipSvg(t, 1330, 470 - bounce, 1.05, { look: [-0.8, 0.4], mood: 'happy' }, bounce < 4 ? { sx: 1.12, sy: 0.9 } : { sx: 1, sy: 1 });
  const L_ = H.heroRoom.layers(t, { time: 'night', storm: 1, monitor: greenLite(t), greenGlow: 1, chairX: 1500, clock: '2:03' });
  let o = view(cam, L_.bg, 0.85) + view(cam, L_.mid + bowlRoom(t, { look: [-0.6, 0.4] }) + L_.front + pad.back + hero + pad.front + L_.light + tip, 1);
  o += R.saveWave(seg(t, tStep + 0.05, tStep + 0.9), { x: toS(cam, CP.x, CP.y)[0] });
  return o;
}
// ---- 31/32. Gary saw the whole thing. Gary told no one.
function garyShot(t, cam, gOpts) {
  const Ly = H.deskClose.layers(t, { time: 'night', storm: 1, monitor: greenGame(t), clock: '2:04', greenGlow: 0.6 });
  return view(cam, Ly.bg, 0.85) + view(cam, Ly.mid + bowlCU(t, gOpts) + Ly.light, 1);
}
function sh31(t) {
  const cam = camKeys(t, [[c31, at(260, 700, 2.1)], [c32, at(245, 730, 2.45)]], ease.linear);
  const blink = bump(t, c31 + 0.25, A[12].a + 0.05);
  const tW = w(12, 'whole');
  return garyShot(t, cam, { yaw: lerp(40, 5, seg(t, c31, tW)), blink: blink > 0.95 ? 1 : blink, look: [0, 0], lids: 0.46 });
}
function sh32(t) {
  const tT = w(12, 'told'), tN = w(12, 'no');
  const cam = camKeys(t, [[c32, at(235, 735, 2.8)], [c33, at(235, 740, 3.05)]], ease.linear);
  const turn = seg(t, tT, tN + 0.35);
  let o = garyShot(t, cam, { yaw: lerp(5, -80, ease.inOut(turn)), look: [-0.3, 0], mouth: t > tN ? 'line' : undefined, bubble: seg(t, tN + 0.2, c33 + 0.2), lids: 0.55 });
  return o;
}
// ---- 33. fast-forward: the clock spins from 2 to 7:30, the night turns into morning
function sh33(t) {
  const u = seg(t, c33, END - 0.08);
  const mins = lerp(124, 450, ease.in(u));
  const clock = `${Math.floor(mins / 60)}:${String(Math.floor(mins % 60)).padStart(2, '0')}`;
  const cam = camKeys(t, [[c33, at(HR.clock.x, HR.clock.y + 20, 3.0)], [END, at(HR.clock.x, HR.clock.y + 30, 2.8)]], ease.linear);
  // night -> morning: one room at a time, tinted toward the other, swapped under a short white flash
  const mk = seg(u, 0.2, 0.95);
  let o = mk < 0.5 ? room(H.heroRoom, t, { time: 'night', clock, monitorGlow: 0 }, cam, {}) + R.flash(0.5 * mk, '#FFD9A0')
    : room(H.heroRoom, t, { time: 'morning', clock }, cam, {}) + R.flash(0.55 * (1 - mk), '#0A1238');
  o += R.flash(0.6 * (1 - Math.abs(mk - 0.5) / 0.08), '#FFFFFF');
  o += S.g(S.rect(-170, -46, 340, 92, 46, { fill: '#10131C', opacity: 0.8 }) + S.path('M-130 -22 L-96 0 L-130 22 Z M-92 -22 L-58 0 L-92 22 Z', { fill: '#FFFFFF' }) + TF(`${clock} AM`, 40, 14, 40, '#FFFFFF'), `translate(1660 110) scale(${f(pop(t, c33, 0.2))})`);
  o += streaks(t, 0.5, '#FFFFFF', 10, 2, -1, 4200);
  return o;
}

// ================================================================= router
const SHOTS = [
  [c01, sh01], [c02, sh02], [c03, sh03], [c04, sh04], [c05, sh05], [c06, sh06], [c07, sh07], [c08, sh08], [c09, sh09], [c10, sh10],
  [c11, sh11], [c12, sh12], [c13, sh13], [c14, sh14], [c15, sh15], [c16, sh16], [c17, sh17], [c18, sh18], [c19a, sh19a], [c19, sh19], [c20, sh20],
  [c21, sh21], [c22, sh22], [c23, sh23], [c24, sh24], [c25, sh25], [c26, sh26], [c27, sh27], [c28, sh28], [c29, sh29], [c30, sh30],
  [c31, sh31], [c32, sh32], [c33, sh33],
];
const WHIPS = [[c06, 1], [c09, -1], [c13, 1], [c26, -1]];
function shotAt(t) {
  let i = SHOTS.length - 1;
  while (i > 0 && t < SHOTS[i][0]) i--;
  return i;
}
const FLAT_SHOTS = new Set([sh02, sh03, sh05, sh11, sh15, sh19a, sh19, sh22, sh23, sh24, sh26, sh27, sh28, sh29, sh30]);
function scene(t) {
  const fn = SHOTS[shotAt(t)][1];
  FLAT = FLAT_SHOTS.has(fn);
  let o = fn(t);
  FLAT = false;
  for (const [tc, d] of WHIPS) if (Math.abs(t - tc) < 0.1) o += whip(t, tc, d);
  // the "Checkpoint saved" toast rides over the cut to Gary
  const tk = seg(t, A[11].a - 0.1, A[11].a + 0.35);
  if (tk > 0 && t < A[12].a + 0.6) o += R.savedToast(70, 880, tk, { t, out: seg(t, A[12].a, A[12].a + 0.4) });
  return o;
}
function look(t) {
  if (t >= c06 && t < c07) return { grade: null, vignette: 0.5 };
  if (t >= c08 && t < c09) return { grade: null, vignette: 0.7 };
  if ((t >= c09 && t < c11) || (t >= c14 && t < c15) || (t >= c17 && t < c18)) return { grade: null, vignette: 0.6 };
  if (t >= c25 && t < c26) return { grade: null, vignette: 0.4 };
  if (t >= c33) return { grade: 'warm', vignette: 0.6 };
  return { grade: 'cool', vignette: 0.9 };
}
function captionY(t) {
  return 1010;
}
module.exports = { scene, look, captionY, SHOTS, CUTS: { c01, c02, c03, c04, c05, c06, c07, c08, c09, c10, c11, c12, c13, c14, c15, c16, c17, c18, c19, c20, c21, c22, c23, c24, c25, c26, c27, c28, c29, c30, c31, c32, c33, tPress, tYes, tTouch, tStrike, c19a, tBurst, tPlant, tTipOut, tStep, END } };
