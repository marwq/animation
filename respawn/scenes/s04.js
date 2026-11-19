// SC 04 · THE TUTORIAL — the morning after: Tip explains the rules, the first real respawn, the pause menu.
//   1  7:30, sleepy: "TIP: You can now respawn in real life!" (tip cards, a hologram diagram, a clock spinning backwards)
//   2  "Yeah, right. That's—" → Bea's skateboard → a full tumble down the stairs → blocks → RESPAWNING 3·2·1
//      "YOU FELL DOWN THE STAIRS" → pop on the pad in the forcefield → "seven-thirty AGAIN!" → "Told ya!"
//   3  second pass: a majestic step over the skateboard → he steals Dad's pancake joke → the pancake lands on Dad's head
//   4  Tip: carry the flag (hologram tutorial), reset yourself anytime → "What menu?" → the snap → the giant pause menu
//      unfolds over a frozen kitchen → "Leave Game?" → "Don't press Leave Game."
//   5  the opera test on a chair → Bea "Make it stop." → RESET CHARACTER (smash cut, fast respawn — unlike the first one)
//   6  everyone calmly eating again → Bea "weirder than normal" → the grin → out the door with the flag in his backpack
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
const { tf, TS, TFS, pop, inOut, at, toS, shakeAll, whip, smash, zoomLines, streaks, bangAt, squash, fc, hops, room } = E;

const A = Array.from({ length: 19 }, (_, i) => L('04.' + i));
const T0 = K.V.scene('SC 04').start, END = K.V.scene('SC 05').start;
const w = (i, word, n = 0) => A[i].word(word, n).t0;
const w1 = (i, word, n = 0) => A[i].word(word, n).t1;

// ---------------------------------------------------------------- cuts (all from the voice)
const d01 = T0;                                   // 7:30: pull back from the clock, he stretches, Tip pops in
const d02 = w(0, 'If') - 0.1;                     // he shuffles across the room; the hologram diagram
const d03 = w(0, 'Time') - 0.1;                   // the landing: Tip's clock spins backwards
const d04 = w(0, 'And') - 0.1;                    // "only YOU remember" — spotlight
const d05 = A[1].a - 0.08;                        // "Yeah, right. That's—"
const tSlip = w(1, "That's");                     // foot on the skateboard
const d06 = tSlip - 0.04;                         // the tumble (-> crumble -> RESPAWNING -> pop in the bedroom)
const tCrumble = lerp(A[2].a, w(2, 'three'), 0.55);
const tPop = lerp(w(2, 'one'), A[3].a, 0.45);
const d08 = w(3, 'In') - 0.1;                     // "In my room." — looking around
const d09 = w(3, 'And') - 0.1;                    // the clock: 7:30 again
const d10 = w(3, 'AGAIN') - 0.06;                 // smash zoom: AGAIN!
const d11 = A[4].a - 0.05;                        // Tip: "Told ya!"
const d12 = A[4].b + 0.02;                        // second pass: the majestic step over the skateboard
const d13 = w(5, 'go') - 0.1;                     // the kitchen: Dad's joke, the pancake flip
const tFlip = w(5, 'doctor');
const d14 = A[6].a - 0.1;                         // he says the punchline first
const d15 = w(6, 'flat') - 0.05;                  // Dad frozen; the pancake lands on his head
const tLand = A[6].b + 0.55;
const d16 = A[7].a - 0.1;                         // "How did you—"
const d17 = w(7, "That's") - 0.1;                 // "That's a BRAND NEW joke!"
const d18 = A[8].a - 0.05;                        // Tip: you can move your checkpoint
const d19 = w(8, 'Just') - 0.1;                   // the hologram tutorial: carry + plant the flag
const d20 = w(8, 'TIP', 1) - 0.1;                 // reset yourself anytime
const d21 = w(8, 'Just', 1) - 0.1;                // just open the menu
const d22 = A[9].a - 0.08;                        // "What menu?" + the snap
const tSnap = A[9].b + 0.1;
const d23 = tSnap - 0.02;                         // the giant pause menu unfolds; the world freezes
const d24 = A[11].a - 0.1;                        // "what happens if I press Leave Game?"
const d25 = A[12].a - 0.08;                       // Tip: "Don't press Leave Game."
const d26 = A[13].a - 0.1;                        // the opera test (wide)
const d27 = w(13, 'KIIING') - 0.1;                // low-angle close: belting
const d28 = w(13, 'breakfaaast') - 0.05;          // Dad frozen
const d28b = lerp(d28, A[14].a - 0.1, 0.5);       // the held note: the window cracks
const d29 = A[14].a - 0.1;                        // Bea: "Make it stop."
const tM = A[14].b + 0.05;                        // RESET CHARACTER (smash cut)
const tPress2 = tM + 0.26;
const tCr2 = tM + 0.4;                            // crumble on the chair (fast preset: pop at +0.3)
const d31 = Math.max(tCr2 + 0.8, w(15, 'remembered') - 0.1); // everyone calmly eating again
const d32 = A[16].a - 0.1;                        // Bea, suspicious
const d33 = w(16, 'Weirder') - 0.1;               // "Weirder than normal."
const d34 = A[17].a - 0.1;                        // the grin: a GOOD day
const d35 = A[18].a - 0.05;                       // "And it was." — backpack, out of the kitchen
const d36 = w(18, 'Because') - 0.1;               // out of the front door into the sun
const d37 = w(18, 'messing') - 0.1;               // a jump for joy → whip into SC 05

// ---------------------------------------------------------------- shared bits
const HR = H.SPOTS.heroRoom, CP = HR.checkpoint, ST = H.SPOTS.stairs, KS = H.SPOTS.kitchen, SR = H.SPOTS.street;
const you = (t, pose, act) => actor('you', t, pose, act);
const tipSvg = (t, x, y, s, extra = {}, sq = { sx: 1, sy: 1 }) => S.g(R.tip({ x: 0, y: 0, s, t, ...extra }), `translate(${f(x)} ${f(y)}) scale(${f(sq.sx)} ${f(sq.sy)})`);
const SLEEPY = (t, seed = 1, extra = {}) => ({ name: 'sleepy', blink: E.blinkK(t, seed, 2.2), fx: ['eyebags'], ...extra });
// the bedroom (morning) with the saved checkpoint in the rug
function bedroom(t, cam, parts = {}, opts = {}) {
  const pad = (part) => R.checkpoint({ ...CP, t, state: 'saved', part, ...(parts.pad || {}) });
  return room(H.heroRoom, t, { time: 'morning', clock: '7:30', ...opts }, cam, { behind: parts.behind, chars: pad('back') + (parts.chars || '') + pad('front'), over: parts.over });
}
const kitchenRoom = (t, cam, parts = {}, opts = {}) => room(H.kitchen, t, { time: 'morning', coat: false, ...opts }, cam, parts);
const stairsRoom = (t, cam, parts = {}, opts = {}) => room(H.stairs, t, { time: 'morning', skate: true, heroDoor: 1, ...opts }, cam, { bgK: 1, ...parts });
const STEP = ST.steps;
// family at breakfast
const dad = (t, o = {}, act = {}) => actor('dad', t, { ...KS.dad, spatula: true, ...o }, act);
const BEA = { x: KS.seats[0].x, y: KS.seats[0].y, s: KS.seats[0].s };
const bea = (t, o = {}, act = {}) => actor('bea', t, { ...BEA, spoon: true, t, ...o }, act);
const YSEAT = { x: KS.seats[1].x, y: KS.seats[1].y, s: KS.seats[1].s };
const youSeat = (t, o = {}, act = {}) => you(t, { ...YSEAT, ...o }, act);
// the opera chair (front view kitchen chair), (x, y) = floor centre; seat top at y - 220 * s / 0.5
const CHAIR = { x: 960, y: 990, s: 0.5 };
const CHAIR_SEAT = CHAIR.y - 220;
function chairProp(x, y, s = 0.5) {
  const k = s / 0.5;
  let o = '';
  o += S.rect(-118, -470, 26, 260, 8, ol('#C98A52', 6)) + S.rect(92, -470, 26, 260, 8, ol('#C98A52', 6));
  o += S.rect(-118, -470, 236, 60, 16, ol('#E0A066', 6)) + S.rect(-90, -390, 180, 22, 8, ol('#E0A066', 5));
  o += S.rect(-110, -12, 22, 12, 4, { fill: '#000', opacity: 0.15 });
  o += S.rect(-108, -210, 24, 210, 8, ol('#B97A44', 6)) + S.rect(84, -210, 24, 210, 8, ol('#B97A44', 6));
  o += S.rect(-128, -232, 256, 40, 12, ol('#E8A96C', 6)) + S.rect(-120, -226, 240, 10, 5, { fill: '#FFD7A8', opacity: 0.7 });
  return S.g(o, `translate(${f(x)} ${f(y)}) scale(${f(k)})`);
}
// backpack with the checkpoint flag (the end of the scene)
const PACK = (t) => ({ backpack: 'flag', flagSvg: R.flag({ x: 0, y: 0, s: 0.95, t, wave: 0.8 }) });

// ================================================================= SHOTS
// ---- 1. 7:30: pull back from the clock; he stretches and yawns; Tip pops in with the first card
function sh01(t) {
  const tUp = d01 + 0.15;
  const cam = camKeys(t, [[d01, at(HR.clock.x, HR.clock.y + 30, 2.8)], [d01 + 0.7, at(760, 560, 1.35)], [d02, at(760, 570, 1.45)]], ease.inOut);
  const st = bump(t, tUp, tUp + 1.6);
  const hero = you(t, { x: 640, y: 975, s: 0.5, turn: 0.2, armL: 25 + 145 * st, armR: 25 + 145 * st, lean: 0, bodyY: -10 * st, face: SLEEPY(t, 1, { mouth: st > 0.3 ? 'yawn' : 'line' }) }, { arms: false });
  const tIn = A[0].a - 0.1;
  const th = hops(t, [[tIn, 1500, 380], [tIn + 0.45, 850, 470, 60]]);
  const tip = t > tIn ? tipSvg(t, th.x, th.y + 6 * Math.sin(t * 3), 1.05, { look: [-0.6, 0.2] }, t < tIn + 0.45 ? { sx: 1.12, sy: 0.9 } : squash(t, tIn + 0.45, 0.2, 0.4)) : '';
  let o = bedroom(t, cam, { chars: hero + tip });
  o += R.tipCard(1260, 190, seg(t, A[0].a - 0.05, A[0].a + 0.3), 'TIP: You can now respawn in real life!', { t, w: 720, type: seg(t, A[0].a, w1(0, 'life')) });
  return o;
}
// ---- 2. "If you mess up, you go back to your last checkpoint." — the hologram diagram
function diagram(t) {
  // local box 0..980 x 0..360: a floor, the flag/pad on the left, mini-you walking right, trips (mess up), crumbles,
  // a looping arrow back to the flag, the pop
  const tM_ = w(0, 'mess'), tB = w(0, 'back'), tC = w(0, 'checkpoint');
  let o = S.rect(0, 0, 980, 360, 0, { fill: '#DFF6FF' }) + S.rect(0, 290, 980, 70, 0, ol('#9ED9C4', 0));
  o += S.path('M0 290 H980', ln(6));
  o += R.checkpoint({ x: 170, y: 292, s: 0.2, t, state: 'saved' });
  const walkK = seg(t, d02, tM_);
  const mx = lerp(260, 700, walkK);
  if (t < tM_) o += E.miniHero(mx, 290, 0.9, { ph: t * 12, walk: 1 });
  else if (t < tM_ + 0.25) o += E.miniHero(700 + 60 * seg(t, tM_, tM_ + 0.25), 290 - 20 * bump(t, tM_, tM_ + 0.25), 0.9, { rot: 70 * seg(t, tM_, tM_ + 0.25), face: 'x' });
  if (t >= tM_ + 0.2) o += R.crumble({ x: 760, y: 290, s: 0.2, age: t - tM_ - 0.2, seed: 3, dir: [1, -0.5], life: 2 });
  if (t > tM_ + 0.05) o += TFS('MESS UP!', 760, 90, 44, '#FF3B4E');
  // the arrow back
  const ak = seg(t, tB - 0.1, tC);
  o += E.airLine([[760, 200], [640, 70], [420, 50], [250, 90], [180, 150]], ak, '#3DDC84', 12, '26 16');
  if (ak > 0.9) o += S.path('M180 150 l-6 -42 l40 18 Z', ol('#3DDC84', 4));
  if (t > tC) {
    const pa = t - tC;
    o += R.respawnPop({ x: 170, y: 292, s: 0.2, age: pa });
    if (pa > 0) o += E.miniHero(170, 290, 0.9, { face: 'happy', arm: 60 });
    o += TFS('BACK!', 300, 150, 44, '#3DDC84');
  }
  return o;
}
function sh02(t) {
  const u = seg(t, d02 + 0.1, d03 - 0.05);
  const x = lerp(700, 1660, u);
  const cam = camKeys(t, [[d02, at(820, 600, 1.2)], [d03, at(1450, 600, 1.2)]], ease.inOut);
  const hero = you(t, { x, y: 975, s: 0.5, view: 'side', flip: true, ...AC.walk(t * 7, 0.55), lean: 8, armL: 6, armR: -6, face: SLEEPY(t, 3, { mouth: bump(t, d02 + 1.2, d02 + 2.0) > 0.2 ? 'yawn' : 'line' }) }, { arms: false });
  const tip = tipSvg(t, x + 230, 470 + 10 * Math.sin(t * 3.2), 1.05, { look: [-0.7, 0.2], tail: -1 });
  let o = bedroom(t, cam, { chars: hero + tip });
  o += E.holoPanel(960, 330, 980, 360, seg(t, d02, d02 + 0.45), 'TUTORIAL 1/3', diagram(t), t);
  return o;
}
// ---- 3. "Time goes back too." — on the landing; Tip holds a clock spinning backwards
function sh03(t) {
  const cam = camKeys(t, [[d03, at(330, 280, 1.85)], [d04, at(360, 290, 2.0)]], ease.out);
  const ex = seg(t, d03, d03 + 0.8);
  const hero = you(t, { x: lerp(300, 400, ease.out(ex)), y: ST.landing.y, s: ST.s, view: ex < 1 ? 'side' : 'front', flip: true, ...(ex < 1 ? AC.walk(t * 7, 0.5) : {}), turn: 0.3, face: SLEEPY(t, 5, { eyes: { look: [1, -0.3], upper: 0.5 } }), armL: 10, armR: 10 }, { arms: false });
  const mins = 450 - 300 * ease.inOut(seg(t, d03 + 0.2, d04 - 0.1));
  const clk = `${Math.floor(mins / 60)}:${String(Math.floor(mins % 60)).padStart(2, '0')}`;
  const cx = 560, cy = 230;
  let prop = S.g(H.wallClock(0, 0, 70, clk) + K.rays(0, 0, 12, 130, '#FFE14D', 0.25 * seg(t, d03 + 0.2, d03 + 0.5), -t * 120), `translate(${f(cx)} ${f(cy)})`);
  prop += S.g(S.path('M-40 -18 L-10 0 L-40 18 Z M-6 -18 L24 0 L-6 18 Z', ol('#FFFFFF', 4)), `translate(${f(cx)} ${f(cy + 110)}) scale(-1 1)`);
  const tip = tipSvg(t, cx + 120, cy - 40, 0.9, { look: [-0.6, 0.3] });
  let o = stairsRoom(t, cam, { chars: hero + prop + tip });
  o += R.tipCard(1400, 160, seg(t, d03, d03 + 0.3), 'TIP: Time goes back too.', { t, w: 600, type: seg(t, w(0, 'Time'), w1(0, 'too')) });
  return o;
}
// ---- 4. "And only YOU remember!" — the spotlight
function sh04(t) {
  const tY = w(0, 'YOU');
  const cam = camKeys(t, [[d04, at(380, 300, 2.0)], [tY, at(400, 300, 2.25)], [d05, at(410, 300, 2.35)]], ease.out);
  const hp = { x: 400, y: ST.landing.y, s: ST.s, turn: 0.3, face: SLEEPY(t, 5, { eyes: { look: [1, -0.3], upper: 0.45 } }), armL: 10, armR: 10 };
  const tip = tipSvg(t, 560, 230, 0.9, { look: [-1, 0.4], mood: 'happy' }, squash(t, tY, 0.15, 0.4));
  let o = stairsRoom(t, cam, { chars: you(t, hp, { arms: false }) + tip });
  const sk = seg(t, tY - 0.15, tY + 0.1);
  if (sk > 0) {
    const p = toS(cam, 400, 330);
    const r = lerp(900, 230, ease.out(sk));
    o += S.path(`M-50 -50 H1970 V1130 H-50 Z M${f(p[0] - r)} ${f(p[1])} a${f(r)} ${f(r * 1.2)} 0 1 0 ${f(2 * r)} 0 a${f(r)} ${f(r * 1.2)} 0 1 0 ${f(-2 * r)} 0 Z`, { fill: '#0A0618', 'fill-rule': 'evenodd', opacity: f(0.7 * sk) });
    o += S.path(`M${f(p[0] - 90)} -40 L${f(p[0] + 90)} -40 L${f(p[0] + r)} ${f(p[1] + r)} L${f(p[0] - r)} ${f(p[1] + r)} Z`, { fill: '#FFF6C8', opacity: f(0.18 * sk) });
  }
  o += bangAt(t, 'YOU!', 1250, 330, tY, d05 - tY + 0.1, 150, -8, '#FFE14D');
  return o;
}
// ---- 5. "Yeah, right. That's—" — waving Tip off, walking to the stairs without looking
function sh05(t) {
  const cam = camKeys(t, [[d05, at(470, 360, 1.7)], [tSlip, at(560, 400, 1.75)]], ease.inOut);
  const u = seg(t, d05, tSlip);
  const x = lerp(380, 640, u), y = t < tSlip - 0.25 ? ST.landing.y : lerp(ST.landing.y, STEP[1].y - 4, seg(t, tSlip - 0.25, tSlip));
  const wave = Math.sin(t * 14) * 30 * bump(t, d05, w(1, 'right') + 0.3);
  const hero = you(t, { x, y, s: ST.s, view: 'side', flip: true, ...AC.walk(t * 8, 0.8), armR: 90 + wave, armL: -10, headRot: -6, face: { name: 'deadpan', eyes: { look: [-1, -0.3], upper: 0.5 } } }, { arms: false });
  const tip = tipSvg(t, x - 170, 250 + 8 * Math.sin(t * 3), 0.9, { look: [0.8, 0.6], mood: t > tSlip - 0.4 ? 'worried' : 'happy' });
  return stairsRoom(t, cam, { chars: hero + tip });
}
// ---- 6. the tumble down the stairs -> crumble -> RESPAWNING 3·2·1 -> pop in the bedroom
const TUMBLE = [[tSlip, 650, STEP[1].y], [tSlip + 0.3, 830, STEP[3].y, 150], [tSlip + 0.55, STEP[6].x, STEP[6].y, 100], [tSlip + 0.8, STEP[9].x, STEP[9].y, 90], [tSlip + 1.02, 1470, ST.floor - 4, 70], [tCrumble, 1600, ST.floor, 40]];
const FAIL = { x: 1600, y: ST.floor, s: ST.s };
const SPAWN = { x: CP.x, y: CP.y, s: CP.s };
function boardAt(t) {
  const u = seg(t, tSlip, tSlip + 0.75);
  if (u <= 0) return null;
  const x = lerp(STEP[1].x, 1640, u), y = lerp(STEP[1].y, ST.floor, u) - 120 * Math.sin(u * Math.PI) - 40 * Math.abs(Math.sin(u * Math.PI * 3));
  const slide = seg(t, tSlip + 0.75, tSlip + 1.4);
  return { x: x + 80 * ease.out(slide), y: u < 1 ? y : ST.floor, rot: u < 1 ? 720 * u : 0 };
}
function sh06(t) {
  const marks = ['three', 'two', 'one'].map((wd) => w(2, wd) - tCrumble);
  const q = R.respawnSeq(t - tCrumble, {
    preset: 'standard', fail: { ...FAIL, dir: [1, -0.5], seed: 5 }, spawn: SPAWN, reason: 'YOU FELL DOWN THE STAIRS', t,
    timing: { ov: [0.22, tPop - tCrumble - 0.22, 'full'], freeze: 0.3, pop: tPop - tCrumble, conv: 0.12, field: 2.2 },
    overlay: { marks },
  });
  if (q.view === 'spawn') return spawnShot(t, q);
  // the tumble
  const tb = hops(t, TUMBLE);
  const hx = tb.x, hy = tb.y;
  const cam = camKeys(t, [[d06, at(640, 420, 1.75)], [tSlip + 0.35, at(900, 560, 1.35)], [tSlip + 0.9, at(1300, 720, 1.25)], [tCrumble, at(1450, 760, 1.3)], [tCrumble + 0.4, at(1460, 760, 1.38)]], ease.inOut);
  shakeAll(cam, t, [[tSlip + 0.3, 0.2, 10], [tSlip + 0.55, 0.2, 10], [tSlip + 0.8, 0.2, 10], [tSlip + 1.02, 0.2, 12], [tCrumble, 0.3, 22]]);
  let chars = '';
  const bd = boardAt(t);
  if (bd) chars += H.skateboard(bd.x, bd.y, ST.skate.s, bd.rot);
  if (t < tCrumble) {
    const slipK = seg(t, tSlip, tSlip + 0.25);
    const spin = 760 * ease.inOut(seg(t, tSlip + 0.1, tCrumble));
    const curl = seg(t, tSlip + 0.15, tSlip + 0.35);
    const land = tb.land < 0.12 ? { sx: 1.18, sy: 0.82 } : { sx: 1, sy: 1 };
    const pose = { x: hx, y: hy + 43 * curl - 70 * slipK * (1 - curl), s: ST.s, view: 'side', flip: true, rot: t < tSlip + 0.1 ? -30 * slipK : spin, legL: lerp(60, 100, curl), kneeL: 110 * curl, legR: lerp(-30, 90, curl), kneeR: 120 * curl, armL: lerp(160, 150, curl), armR: lerp(120, 170, curl), face: { name: curl > 0.5 ? 'dizzy' : 'scream' }, ...land };
    chars += you(t, pose, { arms: false });
  }
  let o = stairsRoom(t, cam, { chars: chars + q.under + q.over }, { skate: false });
  if (t < tSlip + 0.2) o += bangAt(t, 'WHOOPS!', 600, 250, tSlip, 0.5, 100, -10, '#FFFFFF');
  o += bangAt(t, 'BONK', 1250, 300, tSlip + 0.55, 0.3, 80, 8, '#FFE14D') + bangAt(t, 'BONK', 1450, 420, tSlip + 0.8, 0.3, 80, -6, '#FFE14D');
  o += q.screen;
  return o;
}
// the pop on the pad in the bedroom (7:30) — "I'm... back."
function spawnShot(t, q) {
  const pa = t - tPop;
  const cam = camKeys(t, [[tPop - 0.2, at(CP.x, 640, 1.25)], [d08, at(CP.x, 600, 1.5)]], ease.out);
  shakeAll(cam, t, [[tPop, 0.3, 14]]);
  const back = seg(t, w(3, "I'm") - 0.1, w(3, 'back') + 0.3);
  const hero = q.heroAt === 'spawn' ? you(t, { ...SPAWN, ...q.pose, face: { name: back > 0 ? 'shocked' : 'amazed', eyes: { look: [0, -0.2] } }, armL: 30, armR: 30 }, { arms: false }) : '';
  let o = bedroom(t, cam, { chars: q.under + hero + q.over }, { clock: '7:30' });
  o += q.screen;
  if (pa > 0.1) o += R.counterHUD({ x: 1850, y: 110, anchor: 'right', k: seg(pa, 0.1, 0.4), label: 'TIME', value: '7:30', icon: 'cal', t, bump: seg(pa, 0.15, 0.6) });
  return o;
}
// ---- 8. "In my room." — he looks around; Tip floats in
function sh08(t) {
  const cam = camKeys(t, [[d08, at(1000, 560, 1.15)], [d09, at(1040, 560, 1.22)]], ease.inOut);
  const lk = t < w(3, 'room') ? -1 : 1;
  const hero = you(t, { ...SPAWN, turn: 0.5 * lk, face: { name: 'shocked', eyes: { look: [lk, -0.2] } }, armL: 30, armR: 30, headRot: 6 * lk }, { arms: false });
  const th = hops(t, [[d08 + 0.2, 1900, 380], [d08 + 0.9, 1150, 470, 60]]);
  const tip = tipSvg(t, th.x, th.y + 6 * Math.sin(t * 3), 1.05, { look: [-0.8, 0.2], mood: 'smug' });
  return bedroom(t, cam, { chars: hero + R.forcefield({ ...SPAWN, t, k: 1 - seg(t, d08, d09) }) + tip }, { door: 1 });
}
// ---- 9. the clock: 7:30 AGAIN
function sh09(t) {
  const tS = w(3, 'seven-thirty');
  const cam = camKeys(t, [[d09, at(HR.clock.x, HR.clock.y + 20, 3.0)], [d10, at(HR.clock.x, HR.clock.y + 20, 3.4)]], ease.out);
  const clk = t < tS ? '7:31' : '7:30';
  let o = bedroom(t, cam, {}, { clock: clk });
  o += bangAt(t, '7:30', 1380, 760, tS, d10 - tS + 0.1, 150, -8, '#FFFFFF');
  if (t > tS - 0.05 && t < tS + 0.3) o += S.g(S.path('M-40 -24 L-4 0 L-40 24 Z M0 -24 L36 0 L0 24 Z', ol('#FFFFFF', 5)), `translate(560 330) scale(-1.6 1.6)`, { opacity: f(1 - seg(t, tS + 0.1, tS + 0.3)) });
  return o;
}
// ---- 10. AGAIN! — smash zoom on his face
function sh10(t) {
  const cam = camKeys(t, [[d10, at(CP.x, 520, 2.2)], [d10 + 0.12, at(CP.x, 510, 2.9)], [d11, at(CP.x, 505, 3.0)]], ease.out);
  shakeAll(cam, t, [[d10 + 0.1, 0.5, 18]]);
  const hero = you(t, { ...SPAWN, face: { name: 'scream', fx: ['exclaim'] }, armL: 150, armR: 150, volume: false }, { arms: false });
  let o = bedroom(t, cam, { chars: hero });
  o += zoomLines(960, 520, 1 - seg(t, d10 + 0.1, d11), '#FFFFFF', 22, 4, 440);
  o += smash(t, d10 + 0.08, 0.12, 0.6);
  return o;
}
// ---- 11. Tip: "Told ya!"
function sh11(t) {
  const cam = camKeys(t, [[d11, at(1120, 480, 2.2)], [d12, at(1120, 470, 2.4)]], ease.out);
  const hero = you(t, { ...SPAWN, turn: 0.4, face: { name: 'shocked', eyes: { look: [1, -0.3] } }, armL: 30, armR: 30 }, { arms: false });
  const tip = tipSvg(t, 1150, 470, 1.05, { look: [-0.7, 0.1] }, squash(t, d11 + 0.05, 0.16, 0.5));
  let o = bedroom(t, cam, { chars: hero + tip });
  o += K.sparkles([[1260, 300, 30], [1500, 420, 24]], t);
  return o;
}
// ---- 12. second pass: the majestic step over the skateboard (slow motion)
function sh12(t) {
  const u = seg(t, d12, d13);
  const sl = ease.inOut(u);
  const x = lerp(560, STEP[2].x - 10, sl), y = lerp(ST.landing.y, STEP[2].y, seg(sl, 0.55, 1)) - 60 * Math.sin(Math.PI * seg(sl, 0.1, 0.9));
  const cam = camKeys(t, [[d12, at(560, 470, 2.2)], [d13, at(680, 470, 2.35)]], ease.linear);
  const lift = Math.sin(Math.PI * seg(u, 0.05, 0.85));
  const pose = { x, y, s: ST.s, view: 'side', flip: true, legL: 95 * lift, kneeL: 25 * lift, legR: -18 * lift, armL: 120 + 30 * lift, armR: -50 * lift + 20, lean: -10 * lift, headRot: -8 * lift, face: { name: 'smug', eyes: { upper: 0.4 }, fx: ['sparkles'] } };
  let o = stairsRoom(t, cam, { chars: you(t, pose, { arms: false }) });
  const sb = toS(cam, ST.skate.x, ST.skate.y - 30);
  o += K.sparkles([[sb[0] - 140, sb[1] - 80, 30], [sb[0] + 120, sb[1] - 140, 24], [sb[0], sb[1] - 220, 34]], t);
  o += S.rect(0, 0, 1920, 1080, 0, { fill: '#FFE6A8', opacity: 0.12 });
  o += TFS('SLOW-MO', 1700, 120, 44, '#FFFFFF', { opacity: 0.9 });
  return o;
}
// ---- 13. the kitchen: "Why did the pancake go to the doctor?" — he walks in; Dad flips the pancake
function cakeUp(t) {
  // the pancake flipped high at tFlip: up and out of frame, falling back onto Dad's head at tLand
  if (t < tFlip) return null;
  if (t < tFlip + 0.6) { const u = seg(t, tFlip, tFlip + 0.6); return { x: KS.pan.x + 30 * u, y: KS.pan.y - 1300 * ease.out(u), rot: 900 * u, flip: u * 3 }; }
  if (t < tLand) { const u = seg(t, tLand - 0.4, tLand); return { x: KS.pan.x + 10, y: lerp(-900, KS.dad.y - 560, ease.in(u)), rot: 400 * (1 - u), flip: 2 * (1 - u) }; }
  return null;
}
function sh13(t) {
  const cam = camKeys(t, [[d13, at(1000, 560, 1.15)], [d14, at(900, 520, 1.3)]], ease.inOut);
  const u = seg(t, d13, d13 + 0.7);
  const hx = lerp(1780, 1150, ease.out(u));
  const hero = you(t, { x: hx, y: 990, s: 0.5, view: u < 1 ? 'side' : 'front', turn: -0.5, ...(u < 1 ? AC.walk(t * 9, 0.8) : {}), face: fc('deadpan', t, 2, { eyes: { look: [-1, 0], upper: 0.4 } }), armL: 14, armR: 14 }, { arms: false });
  const flip = bump(t, tFlip - 0.15, tFlip + 0.3);
  const dp = dad(t, { armR: 40 + 110 * flip, armL: 30, turn: 0.15, face: t > tFlip ? { name: 'proud' } : undefined }, { arms: false, energy: 1.4 });
  const c = cakeUp(t);
  const cake = c ? X.pancake(c.x, c.y, 0.5, c.rot, c.flip % 1) : '';
  let o = kitchenRoom(t, cam, { behind: dp + bea(t, { face: fc('deadpan', t, 4) }), chars: hero + cake }, { panCake: t < tFlip });
  o += bangAt(t, 'FLIP!', 640, 200, tFlip, 0.5, 90, -8, '#FFE14D');
  return o;
}
// ---- 14. "Because it was feeling a little flat." — he beats Dad to it
function sh14(t) {
  const cam = camKeys(t, [[d14, at(1120, 560, 2.1)], [d15, at(1120, 540, 2.3)]], ease.out);
  const hero = you(t, { x: 1150, y: 990, s: 0.5, turn: -0.5, face: { name: 'smug', eyes: { look: [-1, 0], upper: 0.35 } }, armL: 14, armR: 30 + 30 * bump(t, w(6, 'flat') - 0.3, d15) }, { arms: false, energy: 0.8 });
  const dp = dad(t, { turn: 0.2, face: { name: 'shocked', eyes: { look: [1, 0] } }, armR: 150, armL: 30 }, { arms: false });
  return kitchenRoom(t, cam, { behind: dp + bea(t), chars: hero }, { panCake: false });
}
// ---- 15. Dad frozen; the pancake comes down on his head
function sh15(t) {
  const cam = camKeys(t, [[d15, at(820, 470, 1.6)], [tLand, at(760, 440, 1.75)], [d16, at(760, 440, 1.8)]], ease.out);
  shakeAll(cam, t, [[tLand, 0.25, 10]]);
  const onHead = t >= tLand;
  const blink = E.blinkK(t, 1, 0.55);
  const dp = dad(t, { armR: 150, armL: 30, turn: 0.2, pancakeOnHead: onHead, face: { name: 'shocked', blink, eyes: { look: [1, 0] } }, ...(onHead ? squash(t, tLand, 0.08, 0.5) : {}) }, { arms: false });
  const c = cakeUp(t);
  const cake = c ? X.pancake(c.x, c.y, 0.5, c.rot, c.flip % 1) : '';
  const hero = you(t, { x: 1150, y: 990, s: 0.5, turn: -0.5, face: { name: 'smug', eyes: { look: [-1, -0.2], upper: 0.35 } }, armL: 14, armR: 14 }, { arms: false });
  let o = kitchenRoom(t, cam, { behind: dp + bea(t, { face: { name: 'deadpan' } }), chars: hero + cake }, { panCake: false });
  o += bangAt(t, 'FLOP.', 1150, 280, tLand, d16 - tLand + 0.05, 110, -6, '#FFE14D');
  return o;
}
// ---- 16. "How did you—"
function sh16(t) {
  const cam = camKeys(t, [[d16, at(650, 420, 2.3)], [d17, at(650, 410, 2.5)]], ease.out);
  const dp = dad(t, { pancakeOnHead: true, turn: 0.25, armR: 60, armL: 30, face: { name: 'shocked', eyes: { look: [1, 0] } }, volume: false }, { arms: false, energy: 1.2 });
  return kitchenRoom(t, cam, { behind: dp }, { panCake: false });
}
// ---- 17. "That's a BRAND NEW joke!"
function sh17(t) {
  const tB = w(7, 'BRAND');
  const cam = camKeys(t, [[d17, at(900, 520, 1.35)], [tB - 0.02, at(880, 520, 1.4)], [tB + 0.08, at(700, 420, 2.1)], [d18, at(700, 420, 2.2)]], ease.out);
  shakeAll(cam, t, [[tB + 0.05, 0.4, 14]]);
  const dp = dad(t, { pancakeOnHead: true, turn: 0.3, armR: 90 + 10 * Math.sin(t * 9), armL: 40, face: { name: 'angry' } }, { arms: false, energy: 1.6 });
  const hero = you(t, { x: 1150, y: 990, s: 0.5, turn: -0.5, face: { name: 'smug', eyes: { look: [-1, -0.2], upper: 0.35 } }, armL: 14, armR: 14 }, { arms: false });
  let o = kitchenRoom(t, cam, { behind: dp + bea(t, { face: { name: 'deadpan', eyes: { look: [-1, 0] } } }), chars: hero }, { panCake: false });
  o += bangAt(t, 'BRAND NEW?!', 1300, 250, tB + 0.05, d18 - tB, 120, -6, '#FFE14D');
  o += smash(t, tB + 0.05, 0.1, 0.5);
  return o;
}
// ---- 18. "TIP: You can move your checkpoint!" — at the table, Tip draws in the air
function sh18(t) {
  const cam = camKeys(t, [[d18, at(1380, 600, 1.55)], [d19, at(1360, 590, 1.68)]], ease.inOut);
  const chew = Math.floor(t * 7) % 2;
  const hero = youSeat(t, { face: fc('deadpan', t, 2, { mouth: chew ? 'smallSmile' : 'line', eyes: { look: [-0.6, -0.4] } }), armL: 25, armR: 25 }, { arms: false });
  const tip = tipSvg(t, 1150, 470 + 8 * Math.sin(t * 3), 1.05, { look: [0.5, 0.2] });
  // the drawing: a flag here -> dotted arrow -> a new spot (X)
  const dk = seg(t, w(8, 'move') - 0.1, w1(8, 'checkpoint'));
  let air = R.flag({ x: 1180, y: 700, s: 0.2, t, state: 'saved' });
  air += E.airLine([[1210, 640], [1300, 560], [1420, 540], [1560, 600], [1640, 690]], dk, '#FFE14D', 9, '22 14');
  if (dk > 0.95) air += S.path('M1620 670 l40 40 m0 -40 l-40 40', ln(10, '#FFE14D'));
  let o = kitchenRoom(t, cam, { behind: dad(t, {}, { energy: 0.4 }) + bea(t, { spoon: 'full' }) + hero, chars: tip + air }, {});
  o += R.tipCard(620, 170, seg(t, A[8].a - 0.05, A[8].a + 0.3), 'TIP: You can move your checkpoint!', { t, w: 760, type: seg(t, A[8].a, w1(8, 'checkpoint')) });
  return o;
}
// ---- 19. the hologram tutorial: carry the flag and plant it — wherever you want
function plantPanel(t) {
  const tC = w(8, 'carry'), tPl = w(8, 'plant'), tWh = w(8, 'wherever');
  const places = [['#BDE8FF', '#7BD36A', 'SCHOOL'], ['#FFE6A8', '#F2D38A', 'BEACH'], ['#1A1B4A', '#B9BFCB', 'THE MOON']];
  const pi = t < tWh ? -1 : Math.min(2, Math.floor((t - tWh) / 0.32));
  const [sky, gnd, lab] = pi < 0 ? ['#DFF6FF', '#9ED9C4', ''] : places[pi];
  let o = S.rect(0, 0, 1100, 520, 0, { fill: sky }) + S.rect(0, 410, 1100, 110, 0, { fill: gnd }) + S.path('M0 410 H1100', ln(6));
  if (pi === 0) o += S.rect(80, 230, 300, 180, 6, ol('#FFF0D0', 6)) + S.rect(80, 210, 300, 30, 4, ol('#2E9C9C', 5)) + S.rect(200, 320, 60, 90, 4, ol('#2E9C9C', 5));
  if (pi === 1) o += S.circle(900, 120, 60, ol('#FFD23F', 6)) + S.path('M0 470 Q200 440 400 470 T800 470 T1200 470', ln(8, '#5AB0FF'));
  if (pi === 2) { o += S.circle(880, 110, 50, ol('#4DB0FF', 6)); for (let i = 0; i < 12; i++) o += S.circle(hash(i) * 1100, hash(i * 3) * 300, 3, { fill: '#FFFFFF' }); o += S.ellipse(300, 440, 70, 16, { fill: '#9AA0AE' }); }
  if (t < tPl) {
    // mini-you walks in carrying the flag over his shoulder
    const u = seg(t, d19, tPl - 0.15);
    const x = lerp(120, 560, u);
    o += R.flag({ x: x - 10, y: 300, s: 0.32, rot: -55, t, grip: 0.3, state: 'saved' }) + E.miniHero(x, 410, 1.1, { ph: t * 12, walk: u < 1 ? 1 : 0, arm: 110 });
  } else {
    const pl = seg(t, tPl, tPl + 1.0);
    o += R.flag({ x: 640, y: 412, s: 0.32, t, plant: pi < 0 ? pl : 1, state: 'saved' }) + E.miniHero(520, 410, 1.1, { face: 'happy', arm: pi < 0 ? 60 : 140 });
    if (pi < 0) o += R.savedToast(560, 120, seg(t, tPl + 0.1, tPl + 0.4), { t, s: 0.8, anchor: 'center', size: 36 });
  }
  if (lab) o += TFS(lab, 550, 90, 64, '#FFFFFF');
  return o;
}
function sh19(t) {
  const cam = { ...at(1380, 590, 1.68) };
  const hero = youSeat(t, { face: fc('amazed', t, 2, { eyes: { look: [-0.6, -0.6] } }), armL: 25, armR: 25 }, { arms: false });
  let o = kitchenRoom(t, cam, { behind: dad(t, {}, { energy: 0.4 }) + bea(t, { spoon: 'full' }) + hero }, {});
  o += S.rect(0, 0, 1920, 1080, 0, { fill: '#1A1030', opacity: 0.45 });
  o += E.holoPanel(880, 470, 1100, 520, seg(t, d19, d19 + 0.4), 'TUTORIAL 2/3', plantPanel(t), t);
  o += tipSvg(t, 1560, 300 + 8 * Math.sin(t * 3), 1.3, { look: [-0.8, 0.3] });
  return o;
}
// ---- 20. "TIP: And you can reset yourself anytime!" — Tip demonstrates: poof, pop
function sh20(t) {
  const tR = w(8, 'reset');
  const cam = camKeys(t, [[d20, at(1360, 560, 1.85)], [d21, at(1380, 560, 1.95)]], ease.inOut);
  const chew = Math.floor(t * 7) % 2;
  const hero = youSeat(t, { face: fc('confused', t, 2, { mouth: chew ? 'smallSmile' : 'line', eyes: { look: [-0.7, -0.4] } }), armL: 25, armR: 25 }, { arms: false });
  const gone = t > tR && t < tR + 0.35;
  let tip = gone ? '' : tipSvg(t, 1170, 450 + 8 * Math.sin(t * 3), 1.05, { look: [0.5, 0.2] }, t > tR + 0.35 ? squash(t, tR + 0.35, 0.3, 0.5) : { sx: 1, sy: 1 });
  if (t > tR - 0.02 && t < tR + 0.3) tip += R.pixelDissolve({ x: 1100, y: 380, w: 140, h: 140, k: seg(t, tR, tR + 0.3), seed: 3, colors: ['#FFD43B', '#FFE98A', '#F2A516'], mode: 'out' });
  if (t > tR + 0.3 && t < tR + 0.7) tip += R.respawnPop({ x: 1170, y: 520, s: 0.18, age: t - tR - 0.35, col: '#FFE14D' });
  let o = kitchenRoom(t, cam, { behind: dad(t, {}, { energy: 0.4 }) + bea(t, { spoon: 'full' }) + hero, chars: tip }, {});
  o += R.tipCard(640, 170, seg(t, d20 + 0.05, d20 + 0.35), 'TIP: And you can reset yourself anytime!', { t, w: 860, type: seg(t, w(8, 'TIP', 1), w1(8, 'anytime')) });
  return o;
}
// ---- 21. "Just open the menu!"
function sh21(t) {
  const cam = camKeys(t, [[d21, at(1440, 560, 2.1)], [d22, at(1470, 560, 2.3)]], ease.inOut);
  const hero = youSeat(t, { face: { name: 'confused', eyes: { look: [-0.8, -0.3] }, fx: ['question'] }, armL: 25, armR: 25 }, { arms: false });
  const tip = tipSvg(t, 1250, 430 + 8 * Math.sin(t * 3), 1.0, { look: [0.6, 0.2] });
  let o = kitchenRoom(t, cam, { behind: bea(t, { spoon: 'full' }) + hero, chars: tip }, {});
  o += R.tipCard(560, 180, seg(t, d21 + 0.02, d21 + 0.3), 'TIP: Just open the menu!', { t, w: 640, type: seg(t, w(8, 'Just', 1), w1(8, 'menu')) });
  const mk = pop(t, w(8, 'menu'), 0.3);
  if (mk > 0.01) o += S.g(S.rect(-60, -60, 120, 120, 26, ol('#2A2D5A', 7)) + S.rect(-28, -32, 18, 64, 5, { fill: '#FFFFFF' }) + S.rect(10, -32, 18, 64, 5, { fill: '#FFFFFF' }), `translate(1000 180) rotate(8) scale(${f(mk)})`);
  return o;
}
// ---- 22. "What menu?" — the shrug, then the snap
function sh22(t) {
  const cam = camKeys(t, [[d22, at(1480, 560, 2.2)], [tSnap - 0.1, at(1480, 540, 2.35)], [d23, at(1480, 530, 2.45)]], ease.out);
  const shrug = bump(t, d22 + 0.05, tSnap - 0.25);
  const raise = seg(t, tSnap - 0.3, tSnap - 0.05);
  const hero = youSeat(t, { face: t < tSnap - 0.1 ? { name: 'confused', fx: ['question'] } : { name: 'smug' }, armL: 25 + 50 * shrug, armR: lerp(25 + 50 * shrug, 150, raise), bodyY: -10 * shrug }, { arms: false });
  let o = kitchenRoom(t, cam, { behind: bea(t, { spoon: 'full' }) + hero }, {});
  const hnd = AC.hand(150, 1);
  const hp = toS(cam, YSEAT.x + hnd[0] * YSEAT.s, YSEAT.y + hnd[1] * YSEAT.s);
  o += E.snapFx(hp[0], hp[1], seg(t, tSnap, tSnap + 0.35), 2);
  o += bangAt(t, 'SNAP!', hp[0] - 300, hp[1] - 60, tSnap, 0.4, 90, -10, '#FFFFFF');
  return o;
}
// ---- 23. the giant pause menu unfolds over a frozen kitchen
const MENU = { x: 1000, y: 330, s: 0.8 };
const FROZEN_CAKE = { x: KS.pan.x + 20, y: 380 };
function frozenFamily(t, tf_) {
  return dad(tf_, { armR: 150, armL: 30, turn: 0.15, face: { name: 'proud', blink: 0 } }, { arms: false, energy: 0 }) + X.pancake(FROZEN_CAKE.x, FROZEN_CAKE.y, 0.5, 20, 0.3) +
    bea(tf_, { spoon: 'full', armR: 100, face: { name: 'happy', blink: 0, mouth: 'O' } }, { arms: false });
}
function pausedKitchen(t, cam, heroSvg, menuSvg, wash = 1, extra = {}) {
  const tf_ = tSnap;   // the world stops at the snap
  const Ly = H.kitchen.layers(tf_, { time: 'morning', coat: false, panCake: false, frozen: 1, freezeAt: tf_ });
  let o = view(cam, Ly.bg, 0.85) + view(cam, Ly.mid + frozenFamily(t, tf_) + Ly.front + (extra.chars || '') + (Ly.fg || '') + Ly.light, 1);
  o += R.greyWash(0.75 * wash);
  o += view(cam, heroSvg + menuSvg, 1);
  return o;
}
function sh23(t) {
  const tPM = w(10, 'pause');
  const cam = camKeys(t, [[d23, at(1300, 520, 1.55)], [d23 + 0.8, at(1150, 520, 1.15)], [d24, at(1120, 520, 1.08)]], ease.inOut);
  const k = seg(t, d23 + 0.05, d23 + 0.8);
  const hero = youSeat(t, { face: { name: 'amazed', eyes: { look: [-0.6, -0.8] }, fx: ['sparkles'] }, armL: 25, armR: lerp(150, 30, seg(t, d23, d23 + 0.5)) }, { arms: false });
  const menu = R.escMenu({ ...MENU, k, t });
  let o = pausedKitchen(t, cam, hero, menu, seg(t, d23, d23 + 0.35));
  const mp = toS(cam, MENU.x, MENU.y);
  o += K.sparkles([[mp[0] - 330, mp[1] - 230, 34 * bump(t, tPM - 0.1, tPM + 0.6)], [mp[0] + 320, mp[1] + 220, 28 * bump(t, tPM, tPM + 0.7)]], t);
  if (k > 0 && k < 1) o += zoomLines(mp[0], mp[1], 1 - k, '#FFFFFF', 16, 6, 380);
  o += TFS('II  PAUSED', 230, 110, 46, '#FFFFFF', { opacity: f(0.9 * seg(t, d23 + 0.2, d23 + 0.5) * (Math.floor(t * 2.5) % 2 ? 1 : 0.6)) });
  return o;
}
// ---- 24. "Uh... what happens if I press 'Leave Game'?"
function sh24(t) {
  const tPr = w(11, 'press'), tLv = w(11, 'Leave');
  const cam = camKeys(t, [[d24, at(1180, 470, 1.4)], [tLv, at(1150, 470, 1.55)], [d25, at(1140, 480, 1.6)]], ease.inOut);
  const hl = t < tPr - 0.3 ? null : t < tLv - 0.05 ? 'reset' : 'leave';
  const reach = seg(t, tPr - 0.4, tLv);
  const hero = youSeat(t, { face: { name: 'nervous', eyes: { look: [-1, -0.5] }, fx: ['sweat'] }, armL: 25, armR: lerp(25, 115, ease.inOut(reach)) + 3 * Math.sin(t * 30) * reach, lean: -4 * reach }, { arms: false });
  const menu = R.escMenu({ ...MENU, k: 1, t, hl });
  return pausedKitchen(t, cam, hero, menu, 1);
}
// ---- 25. Tip: "Don't press 'Leave Game.'" — Tip slams in front of the button
function sh25(t) {
  const cam = camKeys(t, [[d25, at(1100, 420, 1.6)], [d25 + 0.12, at(1060, 420, 2.0)], [d26, at(1060, 420, 2.05)]], ease.out);
  shakeAll(cam, t, [[d25 + 0.1, 0.35, 16]]);
  const close = seg(t, d26 - 0.35, d26 - 0.05);
  const menu = R.escMenu({ ...MENU, k: 1 - close, t, hl: 'leave' });
  const ti = seg(t, d25, d25 + 0.15);
  const tx = lerp(1700, 1000, ease.outBack(ti)), ty = 420;
  const hero = youSeat(t, { face: { name: 'scared', eyes: { look: [-1, -0.4] } }, armL: 25, armR: lerp(115, 25, seg(t, d25 + 0.1, d25 + 0.4)) }, { arms: false });
  const tip = tipSvg(t, tx, ty + 6 * Math.sin(t * 20), 1.2, { look: [0.6, 0.2], mood: 'worried' }, ti < 1 ? { sx: 1.25, sy: 0.85 } : squash(t, d25 + 0.15, 0.2, 0.4));
  let o = pausedKitchen(t, cam, hero, menu + tip, 1 - close);
  o += R.tipCard(960, 820 - 0, seg(t, d25 + 0.05, d25 + 0.25) * (1 - seg(t, d26 - 0.2, d26)), 'TIP: Don\'t press "Leave Game."', { t, w: 700, accent: '#FF3B4E', type: seg(t, A[12].a, A[12].b - 0.1), rot: 2 });
  o += smash(t, d25 + 0.1, 0.1, 0.4);
  return o;
}
// ---- 26. the opera test: on a chair, a spoon for a microphone
function opera(t, extra = {}) {
  const hnd = AC.hand(extra.armR ?? 150, 1);
  return you(t, { x: CHAIR.x, y: CHAIR_SEAT, s: 0.5, armL: 110, armR: 150, face: { name: 'excited' }, props: [{ svg: X.spoon(hnd[0], hnd[1], 1.1, 150), layer: 'front' }], ...extra }, { arms: false, energy: 1.6 });
}
function sh26(t) {
  const cam = camKeys(t, [[d26, at(960, 520, 1.02)], [d27, at(960, 500, 1.12)]], ease.out);
  const breath = Math.sin(t * 3) * 6;
  const hero = opera(t, { armL: 100 + breath, armR: 150, headRot: -6 });
  const dp = dad(t, { armR: 40, armL: 30, face: { name: 'shocked', eyes: { look: [1, -0.2] }, blink: 0 } }, { arms: false, energy: 0 });
  const bp = bea(t, { face: { name: 'shocked', eyes: { look: [-1, -0.2] } }, spoon: 'full', armR: 100 }, { arms: false });
  let o = kitchenRoom(t, cam, { behind: dp + bp, chars: chairProp(CHAIR.x, CHAIR.y) + hero }, {});
  const hp = toS(cam, CHAIR.x, CHAIR_SEAT - 520);
  o += E.operaNotes(t, hp[0] + 120, hp[1], 1, 1) + E.operaNotes(t + 0.5, hp[0] - 160, hp[1] + 60, 0.8, 3);
  o += bangAt(t, 'TEST #1', 300, 150, d26 + 0.05, 1.2, 70, -6, '#FFFFFF');
  return o;
}
// ---- 27. KIIING — low angle, arms wide, a fantasy spotlight
function sh27(t) {
  const cam = camKeys(t, [[d27, at(960, 470, 1.9)], [d28, at(960, 440, 2.1)]], ease.out);
  shakeAll(cam, t, [[d27 + 0.1, d28 - d27, 4]]);
  const hero = opera(t, { armL: 135, armR: 160, headRot: -10, face: { name: 'excited', eyes: { type: 'closed' } } });
  let o = kitchenRoom(t, cam, { behind: dad(t, { armR: 40, armL: 30, face: { name: 'shocked', blink: 0 } }, { arms: false, energy: 0 }), chars: chairProp(CHAIR.x, CHAIR.y) + hero }, {});
  const hp = toS(cam, CHAIR.x, CHAIR_SEAT - 420);
  o = o + S.g(K.rays(0, 0, 16, 1400, '#FFE6A8', 0.16, t * 25), `translate(${f(hp[0])} ${f(hp[1])})`);
  o += E.operaNotes(t, hp[0] + 260, hp[1] - 80, 1.2, 2) + E.operaNotes(t + 0.4, hp[0] - 300, hp[1] - 40, 1.1, 5);
  o += bangAt(t, 'KIIING!', 1500, 250, w(13, 'KIIING') + 0.05, 0.9, 100, 8, '#FFE14D');
  return o;
}
// ---- 28. Dad frozen mid-flip; the pancake slides off the spatula; the window starts to crack
function sh28(t) {
  const cam = camKeys(t, [[d28, at(700, 400, 2.0)], [d28b, at(690, 390, 2.2)]], ease.linear);
  const slide = seg(t, d28 + 0.2, d28b);
  const dp = dad(t, { armR: lerp(110, 60, slide), armL: 30, turn: 0.25, pancake: slide < 0.6, face: { name: 'shocked', eyes: { look: [1, 0] }, blink: 0, fx: ['sweat'] } }, { arms: false, energy: 0 });
  const cake = slide >= 0.6 ? X.pancake(760, lerp(560, 640, seg(slide, 0.6, 1)), 0.5, 30 * slide, 0) : '';
  let o = kitchenRoom(t, cam, { behind: dp + cake }, { panCake: false });
  const cp_ = toS(cam, 900, 260);
  o += E.glassCrack(cp_[0], cp_[1], 260, seg(t, d28 + 0.4, d28b) * 0.6, 3);
  o += E.operaNotes(t, 1700, 900, 1, 4);
  return o;
}
// ---- 28b. the held note: the window cracks
function sh28b(t) {
  const cam = camKeys(t, [[d28b, at(900, 470, 1.25)], [d29, at(900, 450, 1.35)]], ease.out);
  shakeAll(cam, t, [[d28b, d29 - d28b, 6]]);
  const hero = opera(t, { armL: 160, armR: 165, headRot: -14, face: { name: 'excited', eyes: { type: 'closed' } } });
  const dp = dad(t, { armR: 60, armL: 30, face: { name: 'shocked', blink: 0 } }, { arms: false, energy: 0 });
  let o = kitchenRoom(t, cam, { behind: dp + X.pancake(760, 640, 0.5, 18, 0) + bea(t, { face: { name: 'scared' }, armR: 100 }, { arms: false }), chars: chairProp(CHAIR.x, CHAIR.y) + hero }, { panCake: false, birds: false });
  const cp_ = toS(cam, 900, 260);
  o += E.glassCrack(cp_[0], cp_[1], 260 * 1.25 / 2.2 * 1.6, 0.6 + 0.4 * seg(t, d28b + 0.2, d28b + 0.5), 3);
  const hp = toS(cam, CHAIR.x, CHAIR_SEAT - 520);
  o += E.operaNotes(t, hp[0] + 200, hp[1], 1.3, 6) + E.operaNotes(t + 0.3, hp[0] - 220, hp[1] + 30, 1.2, 7);
  o += bangAt(t, 'CRACK!', 520, 220, d28b + 0.2, 0.6, 110, -10, '#FFFFFF');
  return o;
}
// ---- 29. Bea: "Make it stop." — the spoon drops
function sh29(t) {
  const cam = camKeys(t, [[d29, at(BEA.x, 650, 2.7)], [tM, at(BEA.x, 645, 2.95)]], ease.linear);
  const tDrop = w(14, 'stop');
  const dropped = t > tDrop;
  const bp = bea(t, { spoon: dropped ? false : 'full', armR: dropped ? 30 : 90, face: { name: 'scared', fx: ['sweat'] }, volume: false }, { arms: false, energy: 0.4 });
  let sp = '';
  if (dropped) { const u = seg(t, tDrop, tDrop + 0.4); sp = X.spoon(BEA.x + 60, lerp(560, 760, ease.in(u)), 0.35, 200 * u); }
  return kitchenRoom(t, cam, { behind: bp + sp }, { panCake: false });
}
// ---- 30. RESET CHARACTER — a smash cut: the menu slams open, press, the blocks, back on the pad at 7:30
function sh30(t) {
  const SPAWN2 = { x: CP.x, y: CP.y, s: CP.s };
  const q = R.respawnSeq(t - tCr2, { preset: 'fast', fail: { x: CHAIR.x, y: CHAIR_SEAT, s: 0.5, dir: [0, -1], seed: 9, floorY: CHAIR.y }, spawn: SPAWN2, t });
  if (q.view === 'spawn') {
    const cam = camKeys(t, [[tCr2 + 0.25, at(CP.x + 60, 600, 1.35)], [d31, at(CP.x + 40, 580, 1.45)]], ease.out);
    const hero = q.heroAt === 'spawn' ? you(t, { ...SPAWN2, ...q.pose, face: { name: 'smug' }, armL: 25, armR: 25 }, { arms: false }) : '';
    let o = bedroom(t, cam, { chars: q.under + hero + q.over });
    o += q.screen;
    // the stamp: rewound
    o += R.counterHUD({ x: 70, y: 110, k: seg(t, tCr2 + 0.35, tCr2 + 0.6), label: 'RESET', value: '7:30', icon: 'retry', t, bump: seg(t, tCr2 + 0.4, tCr2 + 0.8) });
    o += S.g(S.path('M-40 -24 L-4 0 L-40 24 Z M0 -24 L36 0 L0 24 Z', ol('#FFFFFF', 5)), `translate(1700 200) scale(-1.4 1.4)`, { opacity: f(0.9 * (Math.floor(t * 6) % 2 ? 1 : 0.5)) });
    return o;
  }
  const cam = camKeys(t, [[tM, at(1000, 470, 1.45)], [tCr2, at(980, 470, 1.6)]], ease.out);
  shakeAll(cam, t, [[tPress2, 0.25, 14]]);
  const k = seg(t, tM, tM + 0.12);
  const menu = R.escMenu({ x: 1000, y: 300, s: 0.7, k: t < tCr2 ? k : 0, t, hl: 'reset', press: seg(t, tPress2, tPress2 + 0.3) });
  let chars = chairProp(CHAIR.x, CHAIR.y);
  if (q.heroAt === 'fail') chars += opera(t, { armL: 160, armR: 100, face: { name: 'smug' } });
  chars += q.over;
  const dp = dad(t, { armR: 60, armL: 30, face: { name: 'shocked', blink: 0 } }, { arms: false, energy: 0 });
  let o = kitchenRoom(t, cam, { behind: dp + X.pancake(760, 640, 0.5, 18, 0) + bea(t, { spoon: false, face: { name: 'scared' } }, { arms: false }), chars: chars + menu }, { panCake: false, birds: false });
  o += bangAt(t, 'RESET!', 1450, 760, tPress2, 0.4, 120, -8, '#FFE14D');
  o += q.screen;
  return o;
}
// ---- 31. "And nobody remembered a thing." — everyone calmly eating again
function sh31(t) {
  const cam = camKeys(t, [[d31, at(1000, 560, 1.0)], [d32, at(1100, 580, 1.15)]], ease.inOut);
  const sit = seg(t, d31, d31 + 0.6);
  const flip = bump(t, d31 + 0.4, d31 + 0.9);
  const dp = dad(t, { armR: 40 + 100 * flip, armL: 30, face: fc('happy', t, 1) }, { arms: false, energy: 0.5 });
  const c = t > d31 + 0.6 && t < d31 + 1.4 ? X.pancake(KS.pan.x, KS.pan.y - 260 * Math.sin(Math.PI * seg(t, d31 + 0.6, d31 + 1.4)), 0.5, 0, seg(t, d31 + 0.6, d31 + 1.4)) : '';
  const hero = youSeat(t, { face: { name: 'smug', eyes: { look: [0.2, -0.6], upper: 0.4 }, mouth: 'o' }, armL: 25, armR: 25, bodyY: 30 * (1 - ease.out(sit)) }, { arms: false });
  let o = kitchenRoom(t, cam, { behind: dp + bea(t, { spoon: 'full', armR: 40 + 50 * Math.max(0, Math.sin(t * 4)) }, { arms: false }) + hero, chars: c }, { panCake: !c });
  const hp = toS(cam, YSEAT.x + 40, YSEAT.y - 380);
  o += K.C.musicNotes(t, hp[0], hp[1]);
  return o;
}
// ---- 32. Bea, suspicious: "You're acting weird today."
function sh32(t) {
  const cam = camKeys(t, [[d32, at(BEA.x + 20, 640, 2.4)], [d33, at(BEA.x + 10, 640, 2.7)]], ease.linear);
  const bp = bea(t, { spoon: 'full', armR: 70, face: { name: 'suspicious' }, lean: 3, volume: false }, { arms: false, energy: 0.5 });
  return kitchenRoom(t, cam, { behind: bp + youSeat(t, { face: { name: 'nervous' }, armL: 25, armR: 25 }, { arms: false }) }, {});
}
// ---- 33. "Weirder than normal." — she leans in; he sweats
function sh33(t) {
  const cam = camKeys(t, [[d33, at(1400, 640, 1.9)], [d34, at(1410, 630, 2.05)]], ease.inOut);
  const lean = ease.out(seg(t, d33, d33 + 0.5));
  const bp = bea(t, { spoon: 'full', armR: 90, face: { name: 'suspicious' }, lean: 10 * lean, x: BEA.x + 20 * lean }, { arms: false, energy: 0.6 });
  const hero = youSeat(t, { face: { name: 'nervous', eyes: { look: [-1, 0.1] }, fx: ['sweat2'] }, armL: 25, armR: 25, lean: 5 }, { arms: false });
  return kitchenRoom(t, cam, { behind: bp + hero }, {});
}
// ---- 34. "Bea... I think today is gonna be a GOOD day." — the grin
function sh34(t) {
  const tG = w(17, 'GOOD');
  const cam = camKeys(t, [[d34, at(1480, 600, 1.8)], [tG - 0.05, at(1490, 570, 2.1)], [tG + 0.1, at(1490, 550, 2.45)], [d35, at(1490, 550, 2.5)]], ease.inOut);
  const back = seg(t, w(17, 'think') - 0.2, w(17, 'think') + 0.4);
  const hero = youSeat(t, { face: { name: t > tG - 0.1 ? 'joy' : 'smug' }, armL: lerp(25, 165, ease.inOut(back)), armR: lerp(25, 165, ease.inOut(back)), lean: -6 * back }, { arms: false, energy: 0.8 });
  const tip = tipSvg(t, 1230, 420 + 8 * Math.sin(t * 3), 1.0, { look: [0.6, 0.3], mood: 'happy' }, squash(t, tG, 0.2, 0.5));
  let o = kitchenRoom(t, cam, { behind: bea(t, { spoon: 'full', face: { name: 'suspicious' } }) + hero, chars: t > tG - 0.6 ? tip : '' }, {});
  const rk = seg(t, tG - 0.05, tG + 0.3);
  if (rk > 0) { const hp = toS(cam, YSEAT.x, YSEAT.y - 330); o = o + S.g(K.rays(0, 0, 14, 1100, '#FFE88A', 0.22 * rk, t * 20), `translate(${f(hp[0])} ${f(hp[1])})`) + K.sparkles([[hp[0] - 260, hp[1] - 160, 40 * rk], [hp[0] + 280, hp[1] - 80, 32 * rk]], t); }
  return o;
}
// ---- 35. "And it was." — backpack on (the flag sticking out), out of the kitchen
function sh35(t) {
  const cam = camKeys(t, [[d35, at(1200, 560, 1.05)], [d36, at(1350, 560, 1.12)]], ease.inOut);
  const tUp = d35 + 0.25, tRun = d35 + 0.75;
  const ru = seg(t, tRun, d36);
  const x = lerp(1450, 1980, ru);
  const hero = you(t, { x, y: 990, s: 0.5, view: t < tRun ? 'front' : 'side', flip: true, ...(t < tRun ? { armL: 25, armR: 140 + 20 * Math.sin(t * 16) } : AC.run(t * 16)), face: { name: 'joy' }, ...PACK(t), ...(t < tRun ? squash(t, tUp, 0.2, 0.5) : {}) }, { arms: false });
  const dp = dad(t, { armR: 120 + 20 * Math.sin(t * 12), armL: 30, face: { name: 'happy' } }, { arms: false });
  const tip = tipSvg(t, x - 190 * (t < tRun ? -1 : 1), 470 + 8 * Math.sin(t * 4), 1.0, { look: [1, 0.2], mood: 'happy' });
  return kitchenRoom(t, cam, { behind: dp + bea(t, { spoon: 'full', face: { name: 'suspicious', eyes: { look: [1, 0] } } }), chars: hero + tip }, {});
}
// ---- 36. "Because for the first time in your life..." — out of the front door into the sun
const H0 = SR.house;
const tOut = d36 + 0.2;
function streetPath(t) {
  const k = seg(t, tOut, d37 + 0.4);
  return { k, xy: k < 0.3 ? [H0.door.x, lerp(H0.door.y + 10, SR.stand, k / 0.3)] : [lerp(H0.door.x, H0.door.x + 900, (k - 0.3) / 0.7), SR.stand] };
}
function sh36(t) {
  const { k: u, xy } = streetPath(t);
  const [x, y] = xy;
  const cam = { zoom: 1.05, x: x - 960 + 120, y: -20 };
  const Ly = H.street.layers(t, cam, { time: 'morning' });
  const hero = you(t, { x, y, s: SR.s, view: u < 0.3 ? 'front' : 'side', flip: true, ...(u < 0.3 ? AC.walkFront(t * 10, 1) : AC.walk(t * 10, 1)), face: { name: 'joy' }, ...PACK(t) }, { arms: false });
  const tip = tipSvg(t, x + 150, y - 300 + 10 * Math.sin(t * 4), 0.75, { look: [-0.6, 0.3], mood: 'happy' });
  return Ly.bg + Ly.mid + view(cam, hero + tip, 1) + Ly.fg + Ly.light;
}
// ---- 37. "messing up didn't matter." — a jump for joy, then off to school
function sh37(t) {
  const tJ = w(18, 'matter') - 0.25;
  const x0 = streetPath(d37).xy[0];
  const xr = x0 + 260 * seg(t, d37, tJ) + 900 * ease.in(seg(t, tJ + 0.7, END));
  const jump = bump(t, tJ, tJ + 0.6);
  const cam = camKeys(t, [[d37, { zoom: 1.25, x: x0 - 960 + 80, y: 80 }], [tJ, { zoom: 1.35, x: x0 - 960 + 260, y: 60 }], [END, { zoom: 1.2, x: x0 - 960 + 700, y: 0 }]], ease.inOut);
  const air = t > tJ && t < tJ + 0.6;
  const pose = { x: xr, y: SR.stand, s: SR.s, lift: 220 * jump, view: air ? 'front' : 'side', flip: true, ...(air ? { armL: 160, armR: 160, legL: 30, legR: -30, kneeL: 40, kneeR: 40 } : AC.walk(t * 10, 1)), face: { name: 'joy' }, ...PACK(t), ...(t > tJ + 0.6 && t < tJ + 1.0 ? squash(t, tJ + 0.6, 0.2, 0.4) : {}) };
  const Ly = H.street.layers(t, cam, { time: 'morning' });
  const spin = seg(t, tJ, tJ + 0.5);
  const tip = tipSvg(t, xr + 160, SR.stand - 320 - 80 * jump + 10 * Math.sin(t * 4), 0.75, { look: [-0.6, 0.3], mood: 'happy' }, { sx: Math.cos(spin * Math.PI * 2) || 0.05, sy: 1 });
  let o = Ly.bg + Ly.mid + view(cam, you(t, pose, { arms: false }) + tip, 1) + Ly.fg + Ly.light;
  if (air) { const hp = toS(cam, xr, SR.stand - 300 - 220 * jump); o += K.sparkles([[hp[0] - 200, hp[1] - 60, 40], [hp[0] + 200, hp[1], 34], [hp[0], hp[1] - 220, 30]], t) + R.blockConfetti({ x: hp[0], y: hp[1], age: t - tJ, n: 30, s: 0.9, seed: 8 }); }
  return o;
}

// ================================================================= router
const SHOTS = [
  [d01, sh01], [d02, sh02], [d03, sh03], [d04, sh04], [d05, sh05], [d06, sh06], [d08, sh08], [d09, sh09], [d10, sh10], [d11, sh11],
  [d12, sh12], [d13, sh13], [d14, sh14], [d15, sh15], [d16, sh16], [d17, sh17], [d18, sh18], [d19, sh19], [d20, sh20], [d21, sh21],
  [d22, sh22], [d23, sh23], [d24, sh24], [d25, sh25], [d26, sh26], [d27, sh27], [d28, sh28], [d28b, sh28b], [d29, sh29], [tM, sh30],
  [d31, sh31], [d32, sh32], [d33, sh33], [d34, sh34], [d35, sh35], [d36, sh36], [d37, sh37],
];
const WHIPS = [[d03, 1], [d12, 1], [d13, -1], [d18, 1], [d26, -1], [d31, 1], [d36, 1], [END - 0.1, 1]];
function shotAt(t) {
  let i = SHOTS.length - 1;
  while (i > 0 && t < SHOTS[i][0]) i--;
  return i;
}
function scene(t) {
  let o = SHOTS[shotAt(t)][1](t);
  for (const [tc, d] of WHIPS) if (Math.abs(t - tc) < 0.1) o += whip(t, tc, d);
  return o;
}
function look(t) {
  if (t >= d23 && t < d26) return { grade: null, vignette: 0.6 };
  if (t >= d36) return { grade: 'warm', vignette: 0.4 };
  return { grade: 'warm', vignette: 0.7 };
}
module.exports = { scene, look, SHOTS, CUTS: { d01, d02, d03, d04, d05, tSlip, d06, tCrumble, tPop, d08, d09, d10, d11, d12, d13, tFlip, d14, d15, tLand, d16, d17, d18, d19, d20, d21, d22, tSnap, d23, d24, d25, d26, d27, d28, d28b, d29, tM, tPress2, tCr2, d31, d32, d33, d34, d35, d36, d37, END } };
