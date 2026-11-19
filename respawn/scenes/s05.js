// SC 05 · ИДЕАЛЬНЫЙ ДЕНЬ — the perfect day at school (music `perfect`). The hero plants the checkpoint flag by the school
// door; the skateboard trick (ATTEMPT 1 / 2 / 23, split-screen crumble montage, ATTEMPT 57: the slow-mo kickflip, "WHOA…
// first try!", Tip: "That was not first try"); the pop quiz (reads the questions → ESC menu → RESET CHARACTER → pops on
// the flag at 8:00 → sprints through the hallway → writes every answer without looking → 100%); dodgeball (a split-screen
// memory of every hit, bullet-time dodges along predicted paths, the last ball hangs in front of his face and he takes it
// with two fingers; Coach Dee, Ivy, "Lucky guess.", Tip); the cafeteria joke (terrible → full RESPAWNING overlay → strobe
// loop TRY 2…31 → "The Survivors." → the whole room laughs, milk out of a nose) → ATTEMPTS TODAY: 214 → white flash to SC 06.
// Every respawn device is different: corner pill · pop-at-the-flag · VHS rewind · split-screen grids · ESC menu + 8:00
// stamp · memory grid · full overlay · strobe loop.
'use strict';

const K = require('./kit');
const R = require('./respawn');
const SS = require('./sets_school');
const X = require('../rig/extras');
const AC = require('./acting');
const E = require('./s05_env');
const CAST = require('../rig/cast');
const { S, f, clamp, lerp, ease, seg, bump, hash, ol, ln, T, TF, camKeys, view, actor } = K;
const { L } = K.V;
const { tf, TS, TFS, pop, toScr, shakeAll, clipTo, boing, whip, smash, zoomLines, streaks, letterbox, panel, panelTag } = E;
const SP = SS.SPOTS, camAt = SS.camAt;
const scaleAt = SP.schoolyard.scaleAt;

const A = Array.from({ length: 21 }, (_, i) => L('05.' + i));
const T0 = K.V.scene('SC 05').start, END = K.V.scene('SC 06').start;   // == main.js RANGES for SC 05
const w = (i, word, n = 0) => A[i].word(word, n).t0;
const w1 = (i, word, n = 0) => A[i].word(word, n).t1;

// ---------------------------------------------------------------- cuts and beats (all from the voice)
const CUT = {};
CUT.walk = T0;
CUT.plant = w(0, 'In') - 0.1;
CUT.skate = A[2].a - 0.12;
CUT.a1 = w(2, 'Attempt') - 0.1;
CUT.r1 = w(2, 'one') + 0.5;
CUT.a2 = w(2, 'Attempt', 1) - 0.1;
CUT.a23 = w(2, 'Attempt', 2) - 0.1;
CUT.mont = A[2].b + 0.05;
CUT.a57 = A[3].a - 0.12;
CUT.whoa = A[4].a + 0.28;
CUT.yeah = A[5].a - 0.12;
CUT.tip1 = A[6].a - 0.1;
CUT.quiz = A[7].a - 0.12;
CUT.deal = w(7, 'Twenty') - 0.1;
CUT.read = A[8].a - 0.1;
CUT.readQ = w(8, 'You') - 0.1;
CUT.menu = w(8, 'and') - 0.15;
CUT.door2 = w(8, 'reset') + 0.42;
CUT.hall = A[10].a - 0.1;
CUT.write = w(10, 'cheating') - 0.1;
CUT.grade = w(10, 'You') - 0.1;
CUT.gym = A[11].a - 0.1;
CUT.dodgeQ = A[12].a - 0.1;
CUT.memory = w(12, "You'd") - 0.1;
CUT.bullet = w(12, 'So') - 0.1;
CUT.pinch = A[12].b + 0.05;
CUT.coach = A[13].a - 0.1;
CUT.ivy = A[14].a - 0.1;
CUT.lucky = A[15].a - 0.1;
CUT.tip2 = A[16].a - 0.08;
CUT.lunch = A[17].a - 0.1;
CUT.terrible = w(17, 'It') - 0.1;
CUT.reset = w(17, 'Reset') - 0.15;
CUT.tries = w(17, 'Thirty-one') - 0.08;
CUT.joke = A[18].a - 0.1;
CUT.fan = w(18, 'fan') - 0.1;
CUT.surv = w(18, "It's", 1) - 0.1;
CUT.laugh = A[19].a - 0.08;
CUT.milk = w(19, 'Somebody') - 0.1;
CUT.best = A[20].a - 0.1;
CUT.count = w(20, 'Two') - 0.12;
// keep the cuts in order even if the real voice squeezes them (min 0.2 s per shot)
{
  const ks = Object.keys(CUT);
  for (let i = 1; i < ks.length; i++) if (CUT[ks[i]] < CUT[ks[i - 1]] + 0.2) CUT[ks[i]] = CUT[ks[i - 1]] + 0.2;
}
// beats inside shots
const tPlant = A[1].a - 0.12;                                   // the flag slams into the ground
const tF1 = Math.min(w(2, 'one') + 0.15, CUT.r1 - 0.2);           // attempt 1: crumbles in the air
const tF2 = Math.min(w(2, 'two') + 0.12, CUT.a23 - 0.6);          // attempt 2: on the rail
const tF23 = Math.min(w(2, 'twenty-three') + 0.28, CUT.mont - 0.3);   // attempt 23: into the trash can
const tLaunch = Math.max(CUT.a57 + 0.35, w(3, 'fifty-seven') - 0.05); // attempt 57 leaves the ramp
const tLand = Math.max(tLaunch + 0.6, A[4].a + 0.04);             // ... and lands on the deck
const tSnap = w(8, 'and'), tHl = w(8, 'pressed'), tPress = w(8, 'reset');
const tStamp = w(10, 'one', 1);
const tWhistle = A[11].b + 0.03;
const tReset = w(17, 'Reset');

// ---------------------------------------------------------------- small shared helpers
const kid = (i, pose) => K.draw.kid(i, { shade: true, shadow: true, volume: false, ...pose });
const you = (t, pose, act = {}) => actor('you', t, pose, act);
const MOUTHS = ['O', 'smile', 'o', 'bigGrin', 'teeth', 'o', 'grin'];
const yap = (t, name = 'talkHappy', extra = {}) => ({ name, mouth: MOUTHS[Math.floor(t * 9) % MOUTHS.length], ...extra });
const laughPose = (t, ph = 0, amp = 1) => { const b = Math.abs(Math.sin(t * 11 + ph)); return { bodyY: 10 * b * amp, headRot: 6 * Math.sin(t * 11 + ph) * amp, armL: 30 + 40 * b * amp, armR: 34 + 36 * Math.abs(Math.sin(t * 11 + ph + 0.7)) * amp }; };
const hudPos = { x: 56, y: 78 };

// ---------------------------------------------------------------- the schoolyard, the planted flag + pad
const CP = { x: 588, y: 868, s: scaleAt(868) };                 // checkpoint pad (hero's feet) by the door
const FLAG = { x: CP.x + 262 * CP.s, y: CP.y - 52 * CP.s };      // the planted flag at the pad's back-right
function yard(t, cam, opts = {}, behind = '', chars = '', over = '') {
  const Ly = SS.schoolyard.layers(t, cam, opts);
  return Ly.bg + Ly.mid + Ly.pole + (behind ? view(cam, behind) : '') + Ly.front + view(cam, chars + over) + Ly.fg + Ly.light;
}
// pad (after the plant) + planted flag; part 'back' | 'front'
function checkpointAt(t, part, o = {}) {
  let out = '';
  if (t < tPlant) return '';
  const g = ease.outBack(seg(t, tPlant, tPlant + 0.3));
  const pad = R.checkpoint({ x: CP.x, y: CP.y, s: CP.s, t, state: 'saved', save: o.save ?? seg(t, tPlant, tPlant + 1.0), pole: false, flag: false, part });
  out += g < 1 ? S.g(pad, `translate(${f(CP.x)} ${f(CP.y)}) scale(${f(Math.max(0.01, g))}) translate(${f(-CP.x)} ${f(-CP.y)})`) : pad;
  if (part === 'back') out += R.flag({ x: FLAG.x, y: FLAG.y, s: CP.s, t, plant: o.plant ?? seg(t, tPlant - 0.18, tPlant + 0.82) });
  return out;
}
// the 8 watching kids at the skate area (draw before the set's front layer)
const CROWD_I = [2, 5, 8, 11, 14, 17, 20, 23];
function crowdKids(t, mood, o = {}) {
  let out = '';
  SP.schoolyard.crowd.forEach((c, j) => {
    if (o.skip && o.skip.includes(j)) return;
    const ph = j * 1.3;
    const pose = { x: c.x, y: c.y, s: c.s, turn: o.turn ?? 0.45 };
    if (mood === 'watch') Object.assign(pose, AC.breathe(t, ph), { face: j % 3 ? 'happy' : 'neutral', armL: 9, armR: 9 });
    else if (mood === 'gasp') Object.assign(pose, { face: { name: 'shocked', mouth: 'O' }, armL: 30 + 10 * (j % 2), armR: 30 });
    else if (mood === 'wince') Object.assign(pose, { face: j % 2 ? 'oof' : 'scared', armL: 110 + 20 * Math.sin(t * 7 + ph), armR: 120, headRot: -8 });
    else if (mood === 'cheer') { const b = Math.abs(Math.sin(t * 9 + ph)); Object.assign(pose, { lift: 36 * b, armL: 150 + 20 * b, armR: 150 + 20 * Math.abs(Math.sin(t * 9 + ph + 1)), face: j % 2 ? 'excited' : 'amazed' }); }
    else if (mood === 'slow') Object.assign(pose, { face: { name: 'amazed', mouth: 'O' }, armL: 20 + 30 * (o.k || 0), armR: 20 + 30 * (o.k || 0), headRot: -6, turn: 0.6 });
    out += kid(CROWD_I[j], pose);
  });
  return out;
}

// ---------------------------------------------------------------- the skate rider
const RC = { x: 4200, y: 588, R: 380 };                          // the quarter-pipe arc (centre + radius)
const HS = 0.5, BH = E.BOARD_H * HS;
const curveAt = (th) => { const r = (th * Math.PI) / 180; return [RC.x + RC.R * Math.sin(r), RC.y + RC.R * Math.cos(r)]; };
// rider pose from the board's contact point (cx, cy) and a lean back toward the ramp (deg)
const rider = (cx, cy, rot = 0, extra = {}) => ({ x: cx, y: cy - BH, s: HS, view: 'side', flip: true, rot, rotY: E.BOARD_H, ...extra });
const boardAt = (cx, cy, rot = 0, flipK = 0) => X.skateboard({ x: cx, y: cy - 64 * HS, s: HS, rot: -rot, flipK });
const AIR = { a: curveAt(60), c: [4650, 250], b: [4730, 576] };    // launch (60°) -> apex -> the ramp deck
const DECK = { x: 4730, y: 576 };
// hero + board along: ground (x0 -> RC.x) then up the curve to 60° (u 0..1)
function rampRun(u, x0 = 3880) {
  const g = 0.35;
  if (u < g) return { c: [lerp(x0, RC.x, u / g), 968], rot: 0 };
  const th = 60 * ease.in(seg(u, g, 1));
  return { c: curveAt(th), rot: th * 0.85 };
}
function attemptHUD(t, o = {}) {
  return R.counterHUD({ x: o.x ?? hudPos.x, y: o.y ?? hudPos.y, s: o.s ?? 1, t, label: 'ATTEMPT', value: o.value, bump: o.bump, roll: o.roll, from: o.from, theme: o.theme || 'white', k: o.k ?? 1 });
}

// ================================================================= SHOTS
// ---- 1. "So you took the checkpoint to school." — walking in, the flag sticking out of the backpack glows
function shWalk(t) {
  const u = seg(t, CUT.walk, CUT.plant);
  const hx = lerp(60, 430, u), y = 884, s = scaleAt(884);
  const cam = camAt(hx + 260, 590, 1.2 + 0.06 * u);
  const tCk = w(0, 'checkpoint'), tSch = w(0, 'school');
  let bk = '';
  bk += kid(3, { x: lerp(420, 900, u), y: 760, s: scaleAt(760), view: 'side', flip: true, ...AC.walk(t * 8 + 1), face: 'happy' });
  bk += kid(9, { x: lerp(1500, 1180, u), y: 742, s: scaleAt(742), view: 'side', ...AC.walk(t * 8 + 3), face: 'neutral' });
  bk += kid(15, { x: lerp(-120, 330, u), y: 800, s: scaleAt(800), view: 'side', flip: true, ...AC.walk(t * 7.5 + 2) });
  const glow = 0.7 + 0.3 * Math.sin(t * 6) + 1.4 * bump(t, tCk - 0.05, tCk + 0.7);
  const hop = 46 * bump(t, tSch, tSch + 0.36);
  let ch = you(t, { x: hx, y, s, view: 'side', flip: true, ...AC.walk((t - T0) * 8.5), lift: hop, face: { name: 'happy', eyes: { type: hop > 10 ? 'happy' : undefined } }, backpack: 'flag', flagGlow: Math.min(1, glow), t, ...boing(t, tSch + 0.36, 0.14) }, { arms: false });
  // the flag glints on "checkpoint"
  const fx0 = hx - 200 * s * 0.95, fy0 = y - 470 * s - 600 * s - hop;
  const g = pop(t, tCk, 0.25) * (1 - seg(t, tCk + 0.5, tCk + 0.9));
  let fx = '';
  if (g > 0) fx += K.F.sparkle(fx0 + 10, fy0, 40 * g) + K.F.sparkle(fx0 + 60, fy0 + 70, 22 * g) + S.circle(fx0 + 20, fy0 + 40, 60 + 80 * seg(t, tCk, tCk + 0.5), { fill: 'none', stroke: '#7CFFB2', 'stroke-width': f(10 * (1 - seg(t, tCk, tCk + 0.5))), opacity: f(g) });
  fx += K.C.musicNotes(t, hx + 120 * s, y - 900 * s);
  return yard(t, cam, {}, bk, ch, fx) + K.C.whiteFlash(0.9 * (1 - seg(t, T0, T0 + 0.2)));
}

// ---- 2. "In your backpack." — he yanks the flag out and slams it into the ground. SYSTEM: "Checkpoint saved."
function shPlant(t) {
  const tGrab = w(0, 'backpack'), tSlam0 = tPlant - 0.18, tSave = A[1].a;
  const s = CP.s;
  const c0 = camAt(690, 610, 1.5);
  const cam = shakeAll(camKeys(t, [[CUT.plant, { ...camAt(640, 620, 1.62) }], [tSlam0, c0], [tPlant + 0.06, { ...c0, zoom: 1.58 }], [CUT.skate, camAt(700, 600, 1.4)]]), t, [[tPlant, 0.4, 22]]);
  const reach = ease.inOut(seg(t, CUT.plant + 0.05, tGrab));
  const yank = ease.outBack(seg(t, tGrab, tGrab + 0.26));
  const slam = ease.in(seg(t, tSlam0, tPlant));
  const rise = ease.out(seg(t, tPlant + 0.15, tSave + 0.1));
  const pump = bump(t, tSave - 0.05, A[1].b + 0.35);
  let armL, face = 'excited', crouch = 0, lean = 0;
  if (t < tGrab) { armL = lerp(10, 205, reach); face = { name: 'sneaky', fx: reach > 0.5 ? ['sparkles'] : [] }; }
  else if (t < tSlam0) { armL = lerp(205, 168, yank) + 4 * Math.sin(t * 9); face = { name: 'determined' }; crouch = 0.25 * seg(t, tSlam0 - 0.25, tSlam0); }
  else if (t < tPlant + 0.15) { armL = lerp(168, 52, slam); crouch = lerp(0.25, 1, slam); lean = 14 * slam; face = { name: 'determined', mouth: 'teeth' }; }
  else { armL = lerp(52, 12, rise) + 150 * pump; crouch = 1 - rise; lean = 14 * (1 - rise); face = pump > 0.2 ? { name: 'joy' } : { name: 'excited' }; }
  const pose = { x: CP.x, y: CP.y, s, view: 'side', flip: true, armL, armR: 20 - 30 * crouch, kneeL: 46 * crouch, kneeR: 40 * crouch, legL: 18 * crouch, legR: -10 * crouch, bodyY: 60 * crouch, lean, face, t, backpack: t < tGrab ? 'flag' : true, flagGlow: 1 };
  // the flag in the hand (body space) until the slam starts
  if (t >= tGrab && t < tSlam0) {
    const [hx, hy] = CAST.handAt(CAST.D.you, { view: 'side', armL }, -1);
    pose.props = [{ svg: R.flag({ x: hx, y: hy, s: 0.95, rot: -6 + 10 * (1 - yank), grip: 0.3, t, wave: 1.2 }), layer: 'front' }];
  }
  let back = checkpointAt(t, 'back');
  if (t >= tSlam0 && t < tPlant) back += R.flag({ x: FLAG.x, y: FLAG.y, s, t, plant: seg(t, tSlam0, tSlam0 + 1) });
  let ch = back + you(t, pose, { arms: false }) + checkpointAt(t, 'front');
  // yank whoosh arc + sparkles
  let fx = '';
  const wk = seg(t, tGrab - 0.02, tGrab + 0.3);
  if (wk > 0 && wk < 1) fx += S.path(`M${f(CP.x - 140)} ${f(CP.y - 520 * s)} Q${f(CP.x - 120)} ${f(CP.y - 1050 * s)} ${f(CP.x + 60)} ${f(CP.y - 1180 * s)}`, { ...ln(16, '#FFFFFF', 0.8 * (1 - wk)), 'stroke-dasharray': `${f(500 * ease.out(wk))} 900` });
  if (t >= tGrab && t < tSlam0) { const g = bump(t, tGrab + 0.1, tSlam0); fx += K.F.sparkle(CP.x + 70, CP.y - 1150 * s, 34 * g) + K.F.sparkle(CP.x + 150, CP.y - 980 * s, 20 * g); }
  fx += K.C.dust(FLAG.x - 60, FLAG.y, tPlant, t);
  fx += K.bang('THUNK!', FLAG.x + 150, FLAG.y - 300 * s, pop(t, tPlant, 0.18) * (1 - seg(t, tPlant + 0.55, tPlant + 0.75)), 56, 8, '#FFFFFF');
  if (pump > 0) fx += K.F.sparkle(CP.x + 40, CP.y - 1050 * s, 30 * pump) + K.F.sparkle(CP.x - 120, CP.y - 820 * s, 20 * pump);
  let o = yard(t, cam, {}, '', ch, fx);
  const [fsx] = toScr(cam, FLAG.x, FLAG.y);
  o += R.saveWave(seg(t, tSave - 0.05, tSave + 0.8), { x: fsx });
  o += R.savedToast(70, 880, seg(t, tSave - 0.1, tSave + 0.35), { t });
  return o;
}

// ---- 3. "Skateboard trick?" — whip-pan to the skate area; he rolls in, points at the ramp, winks at the crowd
function shSkate(t) {
  const tWhip = CUT.skate + 0.1;
  const tTrick = w(2, 'trick');
  const cam = camKeys(t, [[CUT.skate, camAt(1100, 600, 1.4)], [tWhip + 0.12, { x: 2980, y: 10, zoom: 1.06 }], [CUT.a1, { x: 3060, y: 0, zoom: 1.12 }]], ease.out);
  const u = ease.out(seg(t, CUT.skate + 0.05, tTrick + 0.2));
  const cx = lerp(3060, 3820, u);
  const wave = bump(t, tTrick - 0.1, CUT.a1);
  const pose = rider(cx, 968, 0, { ...E.rideStance(t, 0, 1 - wave), armL: lerp(70, 95, wave), face: wave > 0.2 ? { name: 'smug', eyes: { type: hash(Math.floor(t * 3)) > 0.4 ? undefined : undefined } } : 'happy', props: [E.boardProp()] });
  let ch = you(t, pose, { arms: false });
  if (u < 0.98) ch += K.C.speedLines(cx - 640, cx - 300, 968 - 200, 4, 3, '#FFFFFF', 200);
  const wink = pop(t, tTrick + 0.05, 0.2) * (1 - seg(t, tTrick + 0.6, tTrick + 0.8));
  if (wink > 0) ch += K.F.sparkle(cx + 70, 968 - 430, 30 * wink);
  const o = yard(t, cam, {}, crowdKids(t, 'watch'), ch);
  return o + whip(t, tWhip, 1, 0.16);
}

// ---- 4. ATTEMPT 1 — up the ramp, the board shoots off, he crumbles in the air. Corner RESPAWNING pill
function shA1(t) {
  const tL = tF1 - 0.3;
  const cam = shakeAll(camKeys(t, [[CUT.a1, camAt(4330, 600, 1.12)], [tF1, camAt(4420, 520, 1.18)], [CUT.r1, camAt(4440, 520, 1.22)]]), t, [[tF1, 0.3, 14]]);
  let ch = '';
  let feet;
  if (t < tL) {
    const r = rampRun(seg(t, CUT.a1, tL), 3780);
    ch += you(t, rider(r.c[0], r.c[1], r.rot, { ...E.rideStance(t), face: 'determined', props: [E.boardProp()] }), { arms: false });
    feet = r.c;
  } else {
    const x = seg(t, tL, tL + 0.9);
    const c = E.quadAt(AIR.a, AIR.c, AIR.b, x * 0.9);
    const rot = lerp(51, -20, seg(t, tL, tF1));
    // the board shoots away up-right, spinning
    const ba = t - tL;
    ch += boardAt(c[0] + 700 * ba, c[1] + 60 * ba - 900 * ba + 1600 * ba * ba, rot + 520 * ba, (ba * 2.4) % 1);
    if (t < tF1) ch += you(t, rider(c[0], c[1], rot, { armL: 160 + 20 * Math.sin(t * 30), armR: 150, legL: 30, legR: -30, kneeL: 30, kneeR: 10, face: { name: 'scream', fx: ['sweat'] } }), { arms: false });
    feet = [c[0], c[1] - BH];
  }
  if (t >= tF1) {
    const c = E.quadAt(AIR.a, AIR.c, AIR.b, seg(tF1, tL, tL + 0.9) * 0.9);
    ch += R.crumble({ x: c[0], y: c[1] - BH, s: HS, age: t - tF1, seed: 11, dir: [-0.5, -0.3], floorY: 968, spread: 1.1 });
  }
  let o = yard(t, cam, {}, crowdKids(t, t > tF1 ? 'wince' : 'watch'), ch);
  o += attemptHUD(t, { value: 1, bump: seg(t, w(2, 'one'), w(2, 'one') + 0.45), k: seg(t, CUT.a1, CUT.a1 + 0.25) });
  o += R.respawnOverlay(t, { t0: tF1 + 0.04, dur: CUT.r1 - tF1 - 0.03, style: 'corner', x: 1870, y: 86, label: 'RESPAWNING' });
  return o;
}

// ---- 5. pop! on the flag by the door — and he sprints straight back to the ramp
function shR1(t) {
  const tPop = CUT.r1 + 0.03;
  const age = t - tPop;
  const cam = camAt(720, 640, 1.32);
  let ch = checkpointAt(t, 'back', { save: 1, plant: 1 });
  ch += R.respawnPop({ x: CP.x, y: CP.y, s: CP.s, age, part: 'back' });
  const dash = ease.in(seg(age, 0.12, 0.42));
  if (age >= 0) {
    const pp = R.popPose(age, CP.s);
    const x = CP.x + 1100 * dash;
    ch += you(t, { x, y: CP.y, s: CP.s, view: dash > 0 ? 'side' : 'front', flip: true, ...(dash > 0 ? AC.run(t * 22) : {}), lean: dash > 0 ? 14 : 0, sx: pp.sx, sy: pp.sy, lift: pp.lift, face: dash > 0 ? 'determined' : { name: 'shocked' }, props: dash > 0 ? [] : [{ svg: X.skateboard({ x: 230, y: -330, s: 0.9, rot: 80 }), layer: 'front' }] }, { arms: false });
    if (dash > 0) ch += K.C.speedLines(x - 720, x - 360, CP.y - 200, 5, 7, '#FFFFFF', 240) + K.C.dust(CP.x, CP.y, tPop + 0.12, t);
  }
  ch += R.respawnPop({ x: CP.x, y: CP.y, s: CP.s, age, part: 'front' }) + checkpointAt(t, 'front', { save: 1 });
  if (age >= 0) ch += R.forcefield({ x: CP.x, y: CP.y, s: CP.s, t, k: 1 - seg(age, 0.15, 0.4) });
  let o = yard(t, cam, {}, '', ch);
  o += attemptHUD(t, { value: 1 }) + smash(t, CUT.r1, 0.1, 0.8);
  return o;
}

// ---- 6. ATTEMPT 2 — the rail: ollie, grind, slam → crumble, then a VHS rewind scrubs the blocks back (counter rolls to 23)
function shA2(t) {
  const tOl = Math.min(CUT.a2 + 0.3, tF2 - 0.4), tOn = tOl + 0.2;
  const tRw0 = tF2 + 0.3, tRw1 = CUT.a23 - 0.03;
  const cam = shakeAll(camKeys(t, [[CUT.a2, camAt(3380, 650, 1.22)], [tF2, camAt(3440, 640, 1.3)], [tRw1, camAt(3380, 650, 1.22)]]), t, [[tF2, 0.3, 16]]);
  const railY = SP.schoolyard.rail.y;
  // the rider's contact point at time tt (forward motion)
  const at = (tt) => {
    if (tt < tOl) return { c: [lerp(2900, 3230, seg(tt, CUT.a2, tOl)), 968], ph: 0 };
    if (tt < tOn) { const k = seg(tt, tOl, tOn); return { c: [lerp(3230, 3340, k), lerp(968, railY, k) - 140 * Math.sin(k * Math.PI)], ph: 1 }; }
    return { c: [lerp(3340, 3500, seg(tt, tOn, tF2)), railY], ph: 2 };
  };
  let ch = '', fx = '';
  const rk = seg(t, tRw0, tRw1);
  const rewinding = t >= tRw0 && t < tRw1;
  // rewound time: crumble age runs back from 0.3 to 0, then the ride runs backwards to the start
  let tt = t;
  if (rewinding) tt = rk < 0.55 ? tF2 + 0.3 * (1 - ease.inOut(rk / 0.55)) : lerp(tF2 - 0.001, CUT.a2, ease.inOut((rk - 0.55) / 0.45));
  if (t >= tRw1) tt = CUT.a2;
  if (tt < tF2) {
    const p = at(tt);
    const grind = p.ph === 2;
    ch += you(t, rider(p.c[0], p.c[1], grind ? -6 : 0, { ...E.rideStance(tt), armL: grind ? 110 : 70, armR: grind ? -70 : -40, face: grind ? { name: 'excited' } : 'determined', props: [E.boardProp()] }), { arms: false });
    if (grind && !rewinding) for (let i = 0; i < 4; i++) { const a = -2.6 + hash(Math.floor(t * 30) + i) * 1.2, d = 30 + 50 * hash(i + Math.floor(t * 30)); fx += S.path(`M${f(p.c[0] - 60)} ${f(railY)} l${f(Math.cos(a) * d)} ${f(Math.sin(a) * d)}`, ln(5, '#FFD23F')); }
  } else {
    const age = tt - tF2;
    ch += R.crumble({ x: 3500, y: railY - BH, s: HS, age, seed: 23, dir: [0.25, -0.9], floorY: 968 });
    // the board keeps rolling away (or back, during the rewind)
    ch += boardAt(3500 + 900 * Math.min(age, 0.6), railY + 140 * Math.min(age, 0.6) * Math.min(age, 0.6) * 4, -10 * age, 0);
    fx += K.bang('OOF!', 3560, railY - 420, pop(tt, tF2, 0.18) * (rewinding ? 1 - rk : 1 - seg(tt, tF2 + 0.5, tF2 + 0.7)), 70, -8, '#FFFFFF');
  }
  let o = yard(t, cam, {}, crowdKids(t, tt > tF2 ? 'wince' : 'watch'), ch, fx);
  if (rewinding) o += R.rewind(t, bump(t, tRw0, tRw1) * 0.9 + 0.1, { label: 'REWIND' });
  const roll = seg(t, tRw0 + 0.1, tRw1);
  o += t < tRw0 ? attemptHUD(t, { value: 2, bump: seg(t, w(2, 'two'), w(2, 'two') + 0.45) }) : attemptHUD(t, { value: 23, roll, from: 2 });
  return o + smash(t, CUT.a2, 0.08, 0.5);
}

// ---- 7. ATTEMPT 23 — over the trash can... CLANG. Blocks all over the bin, the lid flies
function shA23(t) {
  const tJ = tF23 - 0.36;
  const can = SP.schoolyard.trash;
  const cam = shakeAll(camKeys(t, [[CUT.a23, camAt(3700, 640, 1.25)], [tF23, camAt(3800, 620, 1.34)], [CUT.mont, camAt(3820, 620, 1.38)]]), t, [[tF23, 0.4, 24]]);
  let ch = '', fx = '';
  if (t < tF23) {
    let c, rot = 0, st = E.rideStance(t);
    if (t < tJ) c = [lerp(3420, 3750, seg(t, CUT.a23, tJ)), 968];
    else { const k = seg(t, tJ, tF23); c = [lerp(3750, 3860, k), 968 - 260 * Math.sin(k * Math.PI * 0.62)]; rot = -18 * k; st = { legL: 40, legR: 0, kneeL: 70, kneeR: 60, armL: 130, armR: 120 }; }
    ch += you(t, rider(c[0], c[1], rot, { ...st, face: t > tJ ? { name: 'scared', mouth: 'O' } : 'determined', props: [E.boardProp()] }), { arms: false });
  } else {
    const age = t - tF23;
    // a lid-less copy of the can over the set's can + the lid flying off
    ch += SS.trashCan(can.x, can.y, 1, { dent: 1, lid: 'off', col: '#B9C6D3' });
    const lx = can.x + 380 * age, ly = can.top - 12 - 900 * age + 1500 * age * age;
    if (ly < 1100) ch += S.g(S.ellipse(0, 0, 72, 16, ol('#B9C6D3', 6)) + S.rect(-14, -24, 28, 14, 6, ol('#8E9BAA', 4)), tf(lx, ly, 1, 700 * age));
    ch += R.crumble({ x: can.x - 20, y: can.top - 40, s: HS, age, seed: 31, dir: [0.5, -0.5], floorY: 968, spread: 1.2 });
    ch += boardAt(can.x - 240 - 400 * Math.min(age, 0.5), 968, 0, 0);
    fx += K.bang('CLANG!', can.x + 40, can.top - 330, pop(t, tF23, 0.18) * (1 - seg(t, tF23 + 0.6, tF23 + 0.8)), 96, 6, '#FFD23F');
  }
  let o = yard(t, cam, {}, crowdKids(t, t > tF23 ? 'wince' : 'watch'), ch, fx);
  o += attemptHUD(t, { value: 23, bump: seg(t, w(2, 'twenty-three'), w(2, 'twenty-three') + 0.45) });
  return o;
}

// ---- 8. the beat: split-screen montage of crumbles in every direction (2 → 4 → 9 panels), counter rolls 23 → 56
const MONT = [
  [[31, 'rail', [1, -0.3]], [38, 'ramp', [-1, -0.2]]],
  [[41, 'trash', [0.6, -0.6]], [44, 'flat', [0.1, -1]], [47, 'rail', [-0.7, -0.5]], [50, 'ramp', [1, 0]]],
  [[51, 'flat', [-1, -0.6]], [52, 'ramp', [0.8, -0.8]], [53, 'trash', [-0.4, -1]], [54, 'rail', [1, -0.1]], [55, 'flat', [0, -0.4]], [56, 'ramp', [-0.9, -0.9]], [57, 'rail', [0.5, 0]], [52, 'trash', [-1, 0]], [49, 'flat', [0.7, -1]]],
];
function montCell(t, lt, n, prop, dir, i, light) {
  let g = E.skateBg(prop);
  const crash = 0.14 + 0.03 * (i % 3);
  const cx = 820 + 260 * Math.min(lt, crash) / crash;
  if (lt < crash) g += you(t, rider(cx, 960, 0, { ...E.rideStance(t, i), face: 'determined', props: [E.boardProp()], volume: false }), { arms: false });
  else g += R.crumble({ x: cx, y: 960 - BH, s: HS, age: lt - crash, seed: 40 + i * 7 + n, dir, floorY: 960, life: 0.7, chips: !light, spread: 1.2 });
  return g;
}
function shMont(t) {
  const dur = CUT.a57 - CUT.mont, m = t - CUT.mont;
  const d1 = dur * 0.3, d2 = dur * 0.6;
  let o = S.rect(0, 0, 1920, 1080, 0, { fill: '#121624' });
  const ph = m < d1 ? 0 : m < d2 ? 1 : 2;
  const cells = MONT[ph];
  const t0 = ph === 0 ? 0 : ph === 1 ? d1 : d2;
  const cols = ph === 0 ? 2 : ph === 1 ? 2 : 3, rows = ph === 0 ? 1 : ph === 1 ? 2 : 3;
  const gap = 14, cw = (1920 - gap * (cols + 1)) / cols, chh = (1080 - gap * (rows + 1)) / rows;
  cells.forEach(([n, prop, dir], i) => {
    const c = i % cols, r = Math.floor(i / cols);
    const lt = m - t0 - i * 0.04;
    const x = gap + c * (cw + gap), y = gap + r * (chh + gap);
    const inner = lt < 0 ? E.skateBg(prop) : montCell(t, lt, n, prop, dir, i, ph === 2);
    o += panel(x, y, cw, chh, inner, { k: seg(m - t0, i * 0.04, i * 0.04 + 0.12), zoom: ph === 0 ? 1.35 : 1.5, dx: 30, dy: 140, border: ph === 2 ? 6 : 10 });
    o += panelTag(x + 16, y + 14, '#' + n, '#151A26', '#FFFFFF', ph === 2 ? 0.8 : 1);
  });
  o += attemptHUD(t, { value: 56, roll: seg(t, CUT.mont, CUT.a57 - 0.1), from: 23 });
  return o + smash(t, CUT.mont, 0.08, 0.6) + K.C.whiteFlash(0.5 * (bump(m, d1 - 0.04, d1 + 0.04) + bump(m, d2 - 0.04, d2 + 0.04)));
}

// ---- 9. ATTEMPT 57 — up the ramp and into slow motion: a perfect kickflip, landing on the deck. PERFECT!
function shA57(t) {
  const cam = shakeAll(camKeys(t, [[CUT.a57, camAt(4360, 640, 1.12)], [tLaunch, camAt(4520, 520, 1.2)], [lerp(tLaunch, tLand, 0.5), camAt(4630, 330, 1.34)], [tLand, camAt(4670, 400, 1.26)], [CUT.whoa, camAt(4680, 410, 1.3)]]), t, [[tLand, 0.35, 18]]);
  const slow = seg(t, tLaunch - 0.05, tLaunch + 0.2) * (1 - seg(t, tLand - 0.05, tLand + 0.15));
  let ch = '', fx = '';
  if (t < tLaunch) {
    const r = rampRun(seg(t, CUT.a57, tLaunch), 3920);
    ch += you(t, rider(r.c[0], r.c[1], r.rot, { ...E.rideStance(t), face: 'determined', props: [E.boardProp()] }), { arms: false });
  } else if (t < tLand) {
    const xx = seg(t, tLaunch, tLand);
    const u = xx + 0.12 * Math.sin(2 * Math.PI * xx);           // fast - slow (apex) - fast
    const c = E.quadAt(AIR.a, AIR.c, AIR.b, u);
    const rot = 51 * (1 - ease.out(seg(u, 0, 0.32)));
    const fk = ease.inOut(seg(u, 0.22, 0.78));
    const tuck = bump(u, 0.12, 0.9);
    const gap = 70 * bump(u, 0.18, 0.84);
    // afterimages of the spinning board + sparkle trail
    for (let i = 1; i <= 3; i++) {
      const uu = Math.max(0, u - i * 0.05), cc = E.quadAt(AIR.a, AIR.c, AIR.b, uu);
      fx += S.g(boardAt(cc[0], cc[1] + 70 * bump(uu, 0.18, 0.84), 51 * (1 - ease.out(seg(uu, 0, 0.32))), ease.inOut(seg(uu, 0.22, 0.78))), null, { opacity: f(0.22 / i) });
    }
    ch += boardAt(c[0], c[1] + gap, rot, fk);
    ch += you(t, rider(c[0], c[1], rot, { legL: 14 + 26 * tuck, legR: -10 - 10 * tuck, kneeL: 20 + 60 * tuck, kneeR: 20 + 60 * tuck, armL: 70 + 40 * tuck, armR: -40 - 50 * tuck, bodyY: -10 * tuck, face: { name: 'determined', fx: tuck > 0.5 ? ['sparkles'] : [] } }), { arms: false });
    fx += K.F.sparkle(c[0] - 120, c[1] - 200, 26 * tuck) + K.F.sparkle(c[0] + 150, c[1] - 360, 18 * tuck);
  } else {
    const age = t - tLand;
    ch += you(t, rider(DECK.x, DECK.y, 0, { ...E.rideStance(t, 0, 0.4), ...boing(t, tLand, 0.3), armL: 150, armR: 150, face: { name: 'joy', fx: ['sparkles'] }, props: [E.boardProp()] }), { arms: false });
    fx += K.C.dust(DECK.x - 160, DECK.y, tLand, t) + K.C.burst(DECK.x, DECK.y - 300, seg(age, 0, 0.5), '#FFE27A');
  }
  let o = yard(t, cam, {}, crowdKids(t, 'slow', { k: slow }), ch, fx);
  if (slow > 0) o += S.rect(0, 0, 1920, 1080, 0, { fill: '#2A4A8A', opacity: f(0.12 * slow) }) + streaks(t * 0.25, 120, 960, 10, 5, '#FFFFFF', 0.25 * slow, 900) + letterbox(slow, 84);
  if (slow > 0.5) o += TFS('SLOW-MO', 1780, 64 + 84 * slow - 50, 30, '#FFFFFF', { 'letter-spacing': 6, opacity: f(slow) });
  const t57 = w(3, 'fifty-seven');
  o += attemptHUD(t, { value: 57, theme: 'gold', bump: seg(t, t57, t57 + 0.45), y: hudPos.y + 84 * slow * 0.5 + (slow > 0 ? 20 : 0) });
  o += K.bang('PERFECT!', 1180, 300, pop(t, tLand, 0.22) * (1 - seg(t, CUT.whoa - 0.1, CUT.whoa)), 110, -6, '#FFD23F');
  return o + smash(t, CUT.a57, 0.08, 0.6);
}

// ---- 10. KID: "WHOA! Did you see that?! First try!" — smash cut to the crowd going wild
function shWhoa(t) {
  const tFirst = w(4, 'First');
  const cam = shakeAll(camKeys(t, [[CUT.whoa, camAt(3700, 560, 1.58)], [CUT.whoa + 0.25, camAt(3700, 580, 1.45)], [CUT.yeah, camAt(3720, 600, 1.38)]], ease.out), t, [[CUT.whoa, 0.3, 12]]);
  const KX = 3700, KY = 905;
  const jump = 70 * bump(t, CUT.whoa - 0.1, CUT.whoa + 0.35) + 50 * bump(t, tFirst, tFirst + 0.35);
  const point = t > w(4, 'Did') - 0.1 && t < tFirst - 0.1;
  let front = actor('kid', t, { i: 12, x: KX, y: KY, s: scaleAt(KY), lift: jump, armL: point ? 30 : 150, armR: point ? 95 : t >= tFirst - 0.1 ? 175 : 150, turn: point ? 0.6 : 0.1, face: { name: 'amazed', fx: ['sparkles'] } }, { arms: false, energy: 1.5 });
  // two phones filming
  let behind = crowdKids(t, 'cheer');
  for (const [px, py, r] of [[3410, 560, -8], [3960, 548, 6]]) behind += X.phone({ x: px, y: py, s: 0.42, rot: r, face: 'back', rec: true, t });
  let o = yard(t, cam, {}, behind, front);
  o += attemptHUD(t, { value: 57, theme: 'gold', s: 0.8 });
  return o + smash(t, CUT.whoa, 0.1, 0.7);
}

// ---- 11. YOU: "Yeah. First try." — on the deck, board in hand, smug sparkle
function shYeah(t) {
  const tF = w(5, 'First');
  const cam = camKeys(t, [[CUT.yeah, camAt(4700, 330, 1.55)], [CUT.tip1, camAt(4700, 300, 1.68)]]);
  const brush = bump(t, A[5].a - 0.05, tF - 0.05);
  const pose = { x: DECK.x - 30, y: DECK.y, s: HS, turn: -0.25, armL: 30 + 60 * brush, armR: t >= tF - 0.05 ? 110 : 24, face: { name: 'smug', fx: t > tF ? ['sparkles'] : [] }, props: [{ svg: X.skateboard({ x: 250, y: -170, s: 0.95, rot: -82 }), layer: 'back' }] };
  let ch = you(t, pose, { arms: false });
  const g = pop(t, tF + 0.1, 0.2) * (1 - seg(t, tF + 0.6, tF + 0.9));
  if (g > 0) ch += K.F.sparkle(DECK.x - 10, DECK.y - 300, 36 * g);
  let o = yard(t, cam, {}, '', ch);
  o += attemptHUD(t, { value: 57, theme: 'gold', s: 0.8 });
  return o;
}

// ---- 12. TIP (whispering): "TIP: That was not first try." — close: Tip at his ear, the 57 slams back in
function shTip1(t) {
  const cam = camKeys(t, [[CUT.tip1, camAt(4660, 170, 2.25)], [CUT.quiz, camAt(4640, 175, 2.4)]]);
  const tNot = w(6, 'not');
  let ch = you(t, { x: DECK.x - 30, y: DECK.y, s: HS, turn: -0.25, armL: 24, armR: 110, volume: false, face: { name: 'happy', eyes: { type: 'closed' }, fx: ['sparkles'] }, props: [{ svg: X.skateboard({ x: 250, y: -170, s: 0.95, rot: -82 }), layer: 'back' }] }, { arms: false });
  let o = yard(t, cam, {}, '', ch);
  const tin = pop(t, CUT.tip1 - 0.02, 0.3);
  o += R.tip({ x: lerp(520, 700, tin), y: 420, s: 1.7 * tin, t, look: [0.6, 0.1], tail: 1 });
  o += K.F.sparkle(560, 300, 14 * Math.abs(Math.sin(t * 5)));
  o += R.tipCard(640, 160, seg(t, A[6].a, A[6].a + 0.35), 'TIP: That was not first try.', { t, w: 720, type: seg(t, A[6].a, A[6].b) });
  o += attemptHUD(t, { x: 300, y: 760, s: 1.35, value: 57, theme: 'gold', bump: seg(t, tNot, tNot + 0.45), k: seg(t, tNot - 0.1, tNot + 0.15) });
  return o + whip(t, CUT.tip1, -1, 0.08);
}

//@@PART2
