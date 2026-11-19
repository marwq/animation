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
const tF1 = w(2, 'one') + 0.15;                                 // attempt 1: crumbles in the air
const tF2w = w(2, 'two') + 0.12;                                // attempt 2: on the rail
const tF23w = w(2, 'twenty-three') + 0.28;                      // attempt 23: into the trash can
const CUT = {};
CUT.walk = T0;
CUT.plant = w(0, 'In') - 0.1;
CUT.skate = A[2].a - 0.12;
CUT.a1 = w(2, 'Attempt') - 0.1;
CUT.r1 = tF1 + 0.36;
CUT.a2 = w(2, 'Attempt', 1) - 0.45;
CUT.a23 = w(2, 'Attempt', 2) - 0.1;
CUT.mont = Math.min(tF23w + 0.75, A[3].a - 1.0);
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
CUT.hall = Math.max(CUT.door2 + 0.95, A[8].b + 0.3);
CUT.write = w(9, "That's") - 0.15;
CUT.done = A[10].a - 0.08;
CUT.grade = w(10, 'You') - 0.1;
CUT.gym = A[11].a - 0.1;
CUT.dodgeQ = A[12].a - 0.1;
CUT.memory = w(12, "You'd") - 0.1;
CUT.bullet = w(12, 'So') - 0.1;
CUT.pinch = lerp(A[12].b, A[13].a, 0.42);
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
CUT.laugh2 = Math.min(w1(19, 'nose') + 0.08, A[20].a - 0.5);
CUT.best = A[20].a - 0.1;
CUT.count = w(20, 'Two') - 0.12;
// keep the cuts in order even if the real voice squeezes them (min 0.2 s per shot)
{
  const ks = Object.keys(CUT);
  for (let i = 1; i < ks.length; i++) if (CUT[ks[i]] < CUT[ks[i - 1]] + 0.2) CUT[ks[i]] = CUT[ks[i - 1]] + 0.2;
}
// beats inside shots
const tPlant = A[1].a - 0.12;                                   // the flag slams into the ground
const tF2 = Math.min(tF2w, CUT.a23 - 0.6);
const tF23 = Math.min(tF23w, CUT.mont - 0.3);
const tLaunch = Math.max(CUT.a57 + 0.35, w(3, 'fifty-seven') - 0.05); // attempt 57 leaves the ramp
const tLand = Math.max(tLaunch + 0.6, A[4].a + 0.04);             // ... and lands on the deck (slow motion between)
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
const AIR = { a: curveAt(60), c: [4650, 140], b: [4730, 576] };    // launch (60°) -> apex -> the ramp deck
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
  return yard(t, cam, {}, bk, ch, fx) + K.C.whiteFlash(0.7 * (1 - seg(t, T0, T0 + 0.16))) + whip(t, T0, 1, 0.12);
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
  if (t < tGrab) { armL = lerp(10, -150, reach); face = { name: 'sneaky', fx: reach > 0.5 ? ['sparkles'] : [] }; }
  else if (t < tSlam0) { armL = lerp(210, 168, yank) + 4 * Math.sin(t * 9); face = { name: 'determined' }; crouch = 0.25 * seg(t, tSlam0 - 0.25, tSlam0); }
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
  const tPop = CUT.r1 + 0.04, age = t - tPop;
  const tDash = tPop + Math.max(0.35, CUT.a2 - tPop - 0.42);
  const dash = ease.in(seg(t, tDash, tDash + 0.36));
  const cam = camKeys(t, [[CUT.r1, camAt(700, 640, 1.3)], [tDash, camAt(680, 620, 1.42)]]);
  let ch = checkpointAt(t, 'back', { save: 1, plant: 1 });
  ch += R.respawnPop({ x: CP.x, y: CP.y, s: CP.s, age, part: 'back' });
  if (age >= 0) {
    const pp = R.popPose(age, CP.s);
    const x = CP.x + 1100 * dash;
    const grin = age > 0.45;
    ch += you(t, { x, y: CP.y, s: CP.s, view: dash > 0 ? 'side' : 'front', flip: true, ...(dash > 0 ? AC.run(t * 22) : { turn: -0.15, armL: 9, armR: 30 }), lean: dash > 0 ? 14 : 0, sx: pp.sx, sy: pp.sy, lift: pp.lift, face: dash > 0 ? 'determined' : grin ? { name: 'determined', mouth: 'grin', eyes: { look: [0, 0.1] } } : { name: 'shocked' }, props: dash > 0 ? [{ svg: X.skateboard({ x: -150, y: -330, s: 0.9, rot: -70 }), layer: 'front' }] : [{ svg: X.skateboard({ x: 230, y: -330, s: 0.9, rot: 80 }), layer: 'front' }] }, { arms: false });
    if (dash > 0) ch += K.C.speedLines(x - 720, x - 360, CP.y - 200, 5, 7, '#FFFFFF', 240) + K.C.dust(CP.x, CP.y, tDash, t);
  }
  ch += R.respawnPop({ x: CP.x, y: CP.y, s: CP.s, age, part: 'front' }) + checkpointAt(t, 'front', { save: 1 });
  if (age >= 0) ch += R.forcefield({ x: CP.x, y: CP.y, s: CP.s, t, k: 1 - seg(t, tDash - 0.3, tDash + 0.1) });
  let o = yard(t, cam, {}, '', ch);
  o += K.bang('AGAIN!', 1180, 300, pop(t, tPop + 0.45, 0.2) * (1 - seg(t, tDash + 0.1, tDash + 0.3)), 90, -8, '#FFD23F');
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
  o += t < tRw0 ? attemptHUD(t, { value: 2, bump: seg(t, w(2, 'two'), w(2, 'two') + 0.45) }) : attemptHUD(t, { value: 23, roll, from: 2, y: hudPos.y + 122 * (ease.inOut(seg(t, tRw0, tRw0 + 0.18)) - ease.inOut(seg(t, tRw1 - 0.18, tRw1))) });
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
  const xx = seg(t, tLaunch, tLand);
  const u = xx + 0.12 * Math.sin(2 * Math.PI * xx);              // fast - slow (apex) - fast
  const P1 = 0.3, P2 = 0.58, P3 = 0.8;                          // angle changes inside the slow motion
  const tAt = (p) => lerp(tLaunch, tLand, p);
  const phase = t < tLaunch ? 0 : xx < P1 ? 1 : xx < P2 ? 2 : xx < P3 ? 3 : 4;
  const slow = seg(t, tLaunch - 0.05, tLaunch + 0.2) * (1 - seg(t, tLand - 0.05, tLand + 0.15));
  const c = E.quadAt(AIR.a, AIR.c, AIR.b, u);
  const rot = 51 * (1 - ease.out(seg(u, 0, 0.32)));
  const fk = ease.inOut(seg(u, 0.24, 0.72));
  const tuck = bump(u, 0.12, 0.9);
  const gap = 70 * bump(u, 0.18, 0.84);
  let cam;
  if (phase <= 1) cam = camKeys(t, [[CUT.a57, camAt(4360, 640, 1.12)], [tLaunch, camAt(4520, 500, 1.15)], [tAt(P1), camAt(4610, 300, 1.2)]]);
  else if (phase === 2) cam = camAt(c[0] + 10, c[1] - 220 + gap * 0.3, lerp(1.3, 1.45, seg(xx, P1, P2)));
  else if (phase === 3) cam = camAt(3680, 570, lerp(1.4, 1.52, seg(xx, P2, P3)));
  else cam = shakeAll(camKeys(t, [[tAt(P3), camAt(4640, 300, 1.12)], [tLand, camAt(4670, 380, 1.2)], [CUT.whoa, camAt(4680, 390, 1.26)]]), t, [[tLand, 0.35, 18]]);
  let ch = '', fx = '', behind = '';
  if (phase === 0) {
    const r = rampRun(seg(t, CUT.a57, tLaunch), 3920);
    ch += you(t, rider(r.c[0], r.c[1], r.rot, { ...E.rideStance(t), face: 'determined', props: [E.boardProp()] }), { arms: false });
  } else if (phase === 3) {
    // slow-motion crowd insert: mouths opening, a juice box slipping out of a hand
    behind = crowdKids(t, 'slow', { k: seg(xx, P2, P3) });
    const jk = seg(xx, P2, P3);
    fx += S.g(S.rect(-22, -34, 44, 68, 6, ol('#FF8A2A', 5)) + S.rect(-14, -20, 28, 18, 3, { fill: '#FFE27A' }) + S.path('M8 -34 L14 -60', ln(6, '#FFFFFF')), tf(3640, 640 + 120 * jk * jk, 1, 40 * jk));
  } else if (phase < 4) {
    for (let i = 1; i <= 3; i++) {
      const uu = Math.max(0, u - i * 0.04), cc = E.quadAt(AIR.a, AIR.c, AIR.b, uu);
      fx += S.g(boardAt(cc[0], cc[1] + 70 * bump(uu, 0.18, 0.84), 51 * (1 - ease.out(seg(uu, 0, 0.32))), ease.inOut(seg(uu, 0.24, 0.72))), null, { opacity: f(0.22 / i) });
    }
    ch += boardAt(c[0], c[1] + gap, rot, fk);
    ch += you(t, rider(c[0], c[1], rot, { legL: 14 + 26 * tuck, legR: -10 - 10 * tuck, kneeL: 20 + 60 * tuck, kneeR: 20 + 60 * tuck, armL: 70 + 40 * tuck, armR: -40 - 50 * tuck, bodyY: -10 * tuck, volume: phase === 2 ? false : undefined, face: { name: 'determined', fx: tuck > 0.5 ? ['sparkles'] : [] } }), { arms: false });
    fx += K.F.sparkle(c[0] - 120, c[1] - 200, 26 * tuck) + K.F.sparkle(c[0] + 150, c[1] - 360, 18 * tuck);
    if (phase === 2) {
      fx += K.F.sparkle(c[0] + 120, c[1] + gap - 30, 20 * Math.abs(Math.sin(t * 4))) + K.F.sparkle(c[0] - 140, c[1] + gap + 10, 14 * Math.abs(Math.sin(t * 5 + 1)));
      const by = c[1] + gap - 32;
      fx += S.path(`M${f(c[0] - 150)} ${f(by - 40)} A150 60 0 0 1 ${f(c[0] + 150)} ${f(by - 40)} M${f(c[0] + 160)} ${f(by + 20)} A160 60 0 0 1 ${f(c[0] - 160)} ${f(by + 20)}`, ln(7, '#FFFFFF', 0.7));
    }
    if (phase === 1) behind = crowdKids(t, 'slow', { k: 0 });
  } else {
    const age = t - tLand;
    if (age < 0) {
      ch += boardAt(c[0], c[1] + gap, rot, fk);
      ch += you(t, rider(c[0], c[1], rot, { legL: 14, legR: -10, kneeL: 30, kneeR: 30, armL: 90, armR: -60, face: 'determined' }), { arms: false });
    } else {
      ch += you(t, rider(DECK.x, DECK.y, 0, { ...E.rideStance(t, 0, 0.4), ...boing(t, tLand, 0.3), armL: 150, armR: 150, face: { name: 'joy', fx: ['sparkles'] }, props: [E.boardProp()] }), { arms: false });
      fx += K.C.dust(DECK.x - 160, DECK.y, tLand, t) + K.C.burst(DECK.x + 40, DECK.y - 560, seg(age, 0, 0.5), '#FFE27A');
    }
    behind = crowdKids(t, t > tLand ? 'cheer' : 'slow', { k: 1 });
  }
  if (phase === 0) behind = crowdKids(t, 'watch');
  let o = yard(t, cam, {}, behind, ch, fx);
  if (slow > 0) o += S.rect(0, 0, 1920, 1080, 0, { fill: '#2A4A8A', opacity: f(0.12 * slow) }) + streaks(t * 0.25, 120, 960, 10, 5, '#FFFFFF', 0.25 * slow, 900) + letterbox(slow, 84);
  if (slow > 0.5) o += TFS('SLOW-MO', 1780, 64 + 84 * slow - 50, 30, '#FFFFFF', { 'letter-spacing': 6, opacity: f(slow) });
  const t57 = w(3, 'fifty-seven');
  o += attemptHUD(t, { value: 57, theme: 'gold', bump: seg(t, t57, t57 + 0.45), y: hudPos.y + (slow > 0 ? 84 * slow * 0.5 + 20 : 0) });
  o += K.bang('PERFECT!', 1460, 250, pop(t, tLand, 0.22) * (1 - seg(t, CUT.whoa - 0.1, CUT.whoa)), 110, -6, '#FFD23F');
  return o + smash(t, CUT.a57, 0.08, 0.6) + smash(t, tAt(P1), 0.06, 0.35) + smash(t, tAt(P2), 0.06, 0.35) + smash(t, tAt(P3), 0.06, 0.35);
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
  for (const [px, py, r] of [[3420, 450, -10], [3990, 440, 8]]) behind += X.phone({ x: px, y: py, s: 0.42, rot: r, face: 'back', rec: true, t });
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
  if (g > 0) ch += K.F.sparkle(DECK.x + 40, DECK.y - 330, 20 * g);
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

// ================================================================= THE POP QUIZ
const CLASS_I = [[31, 32, 33, 34, 35], [36, 37, 38, 39, 40], [41, 42, -1, 44, 45]];
const HD = SP.classroom.heroDesk;
// kids per row (back -> front), faceOf(r, c, i) -> face, poseOf(r, c, i) -> extra pose
function classKids(t, faceOf, poseOf) {
  return SP.classroom.rows.map((row, r) => row.map((seat, c) => {
    const i = CLASS_I[r][c];
    if (i < 0) return '';
    return kid(i, { x: seat.x, y: seat.y, s: seat.s, turn: clamp((960 - seat.x) / 2400, -0.4, 0.4), ...AC.breathe(t, i), face: faceOf ? faceOf(r, c, i) : 'neutral', ...(poseOf ? poseOf(r, c, i) : {}) });
  }).join(''));
}
// classroom 'class' view composed by hand: B[r] = what sits behind desk row r (back -> front), after = the FLOOR line
function classRoom(t, cam, opts, B, after = '') {
  const Lc = SS.classroom.layers(t, opts);
  const rows = Lc.frontRows || [Lc.front || ''];
  let wv = Lc.mid;
  rows.forEach((r, i) => { wv += (B[i] || '') + r; });
  wv += after + (Lc.fg || '') + (Lc.light || '');
  return { svg: view(cam, Lc.bg, 0.6) + view(cam, wv, 1), rows };
}
const TEACH = SP.classroom.teacher;
function mrFig(t, pose = {}) {
  return actor('teacher', t, { x: TEACH.x, y: TEACH.y, s: TEACH.s, turn: 0.35, papers: true, armL: 34, armR: 14, ...pose }, { arms: false, energy: 0.6 });
}
// a quiz paper lying flat on a desk top (seen from the front: squashed)
const flatPaper = (x, y, s, rot = 0) => S.g(X.quizPaper({ x: 0, y: 0, s: 1, rot }), `translate(${f(x)} ${f(y)}) scale(${f(s)} ${f(s * 0.38)})`);
// a yellow pencil, (x, y) = grip, rot (deg; 0 = tip down)
function pencil(x, y, s = 1, rot = 0) {
  const o = S.rect(-9, -120, 18, 120, 4, ol('#FFC83A', 4)) + S.rect(-9, -140, 18, 22, 4, ol('#FF8FA8', 4)) + S.rect(-10, -124, 20, 8, 1, { fill: '#B9C0CC' }) + S.path('M-9 0 L0 26 L9 0 Z', ol('#F2D4A8', 4)) + S.path('M-3 16 L0 26 L3 16 Z', { fill: LINE_ });
  return S.g(o, tf(x, y, s, rot));
}
const LINE_ = '#151515';

// ---- 13. TEACHER: "Pop quiz." — Mr. Fig, bored, lifts the stack
function shQuiz(t) {
  const cam = camKeys(t, [[CUT.quiz, camAt(360, 700, 1.38)], [CUT.deal, camAt(330, 690, 1.52)]]);
  const lift = ease.outBack(seg(t, w(7, 'quiz') - 0.15, w(7, 'quiz') + 0.2));
  const B = classKids(t, (r, c) => (c < 2 ? 'neutral' : 'neutral'));
  const W_ = classRoom(t, cam, {}, B, mrFig(t, { armL: 34 + 36 * lift, face: { name: 'deadpan' } }));
  return W_.svg + whip(t, CUT.quiz, 1, 0.12);
}

// ---- 14. "Twenty questions. No talking." — papers fly to every desk; the class gulps; you lean back
function shDeal(t) {
  const cam = camKeys(t, [[CUT.deal, { x: 0, y: 10, zoom: 1.02 }], [CUT.read, { x: 0, y: 0, zoom: 1.08 }]]);
  const tNo = w(7, 'No');
  const fig = { x: TEACH.x, y: TEACH.y, s: TEACH.s, turn: 0.35, armL: 70, armR: 14 };
  const [hx, hy] = CAST.handAt(CAST.D.teacher, fig, -1);
  const src = [TEACH.x - hx * TEACH.s * -1, TEACH.y + hy * TEACH.s];
  // flights: every desk (back -> front)
  const papers = [[], [], []], flying = [];
  let n = 0;
  SP.classroom.rows.forEach((row, r) => row.forEach((seat, c) => {
    if (seat.x < 0 || seat.x > 1920) return;
    const t0 = CUT.deal + 0.08 + n * 0.055, dur = 0.42;
    n++;
    const k = seg(t, t0, t0 + dur);
    const dst = [seat.x + 20, seat.desk - 4];
    if (k >= 1) papers[r].push(flatPaper(dst[0], dst[1], seat.s * 0.75, (hash(n) - 0.5) * 20));
    else if (k > 0) {
      const e = ease.out(k);
      const p = [lerp(src[0], dst[0], e), lerp(src[1], dst[1], e) - 260 * Math.sin(Math.PI * e)];
      flying.push(S.g(X.quizPaper({ x: 0, y: 0, s: lerp(0.5, seat.s * 0.75, e), rot: 720 * k + n * 40 }), `translate(${f(p[0])} ${f(p[1])}) scale(1 ${f(lerp(1, 0.38, ease.in(k)))})`));
    }
  }));
  const landed = (r, c) => t > CUT.deal + 0.08 + (r * 5 + c) * 0.055 + 0.42;
  const B = classKids(t, (r, c, i) => (landed(r, c) ? (i % 3 === 0 ? { name: 'scared', fx: ['sweat'] } : i % 3 === 1 ? { name: 'nervous', fx: ['sweat2'] } : 'shocked') : 'neutral'),
    (r, c, i) => (landed(r, c) ? { bodyY: 6 * bump(t, CUT.deal + 0.5 + (r * 5 + c) * 0.055, CUT.deal + 0.9 + (r * 5 + c) * 0.055) } : {}));
  const relax = ease.inOut(seg(t, CUT.deal + 0.6, CUT.deal + 1.2));
  B[2] += you(t, { x: HD.x, y: HD.y, s: HD.s, armL: lerp(9, 128, relax), armR: lerp(9, 128, relax), lean: -4 * relax, face: { name: 'smug', eyes: { type: relax > 0.6 ? 'closed' : undefined } } }, { arms: false });
  B[1] += papers[0].join('');
  B[2] += papers[1].join('');
  const shush = t > tNo - 0.1;
  const W_ = classRoom(t, cam, {}, B, papers[2].join('') + mrFig(t, { armL: 70 - 20 * seg(t, CUT.deal + 1, CUT.deal + 1.3), armR: shush ? 120 : 14, face: 'deadpan' }) + flying.join(''));
  let o = W_.svg;
  o += K.bang('SHH.', 420, 300, pop(t, tNo, 0.2) * (1 - seg(t, CUT.read - 0.2, CUT.read)), 70, -6, '#FFFFFF');
  return o;
}

// ---- 15. "A pop quiz? No problem." — close at the desk: knuckle crack, lean back, smug
function shNoProb(t) {
  const tNoP = w(8, 'No');
  const cam = camKeys(t, [[CUT.read, camAt(960, 770, 1.6)], [CUT.readQ, camAt(960, 740, 1.75)]]);
  const crack = t < tNoP - 0.1;
  const sh = crack ? 6 * Math.sin(t * 40) * bump(t, CUT.read + 0.1, tNoP - 0.1) : 0;
  const back = ease.outBack(seg(t, tNoP - 0.1, tNoP + 0.25));
  const pose = crack ? { armL: 62 + sh, armR: 62 - sh, face: { name: 'determined' } } : { armL: lerp(62, 130, back), armR: lerp(62, 130, back), lean: -4 * back, face: { name: 'smug', fx: back > 0.8 ? ['sparkles'] : [] } };
  const B = classKids(t, (r, c) => (r === 2 && c === 3 ? { name: 'nervous', fx: ['sweat2'] } : r === 1 ? 'scared' : 'nervous'));
  B[2] += you(t, { x: HD.x, y: HD.y, s: HD.s, ...pose }, { arms: false });
  let o = classRoom(t, cam, { quiz: true }, B).svg;
  if (crack) { const cr = bump(t, CUT.read + 0.25, CUT.read + 0.5) + bump(t, CUT.read + 0.6, CUT.read + 0.85); o += K.bang('CRACK', 1220, 520, cr, 54, 8, '#FFFFFF'); }
  return o;
}

// ---- 16. "You read all the questions..." — insert: the sheet, rows light up as his eyes race down; READ 0 → 20
function shRead(t) {
  const scan = seg(t, w(8, 'read'), w(8, 'questions') + 0.5);
  const done = seg(t, w(8, 'questions') + 0.5, w(8, 'questions') + 0.85);
  const u = seg(t, CUT.readQ, CUT.menu);
  let o = S.rect(0, 0, 1920, 1080, 0, { fill: '#BFEBDD' }) + S.rect(0, 0, 1920, 120, 0, { fill: '#A8DCCB' });
  o += S.rect(0, 760, 1920, 400, 0, { fill: '#D9A66A' }) + S.path('M0 760 H1920', ln(8, LINE_)) + S.path('M0 840 H1920 M0 940 H1920', ln(4, '#C08A52', 0.7));
  const row = Math.min(19, Math.floor(scan * 20));
  const ly = lerp(-0.55, 0.6, (row % 10) / 9), lx = row < 10 ? -1 : -0.55;
  o += you(t, { x: 1520, y: 1590, s: 1.18, volume: false, turn: -0.35, headRot: -3 + 2 * Math.sin(t * 14) * (scan > 0 && scan < 1 ? 1 : 0), face: { name: done > 0 ? 'smug' : 'determined', eyes: { look: done > 0 ? [0.2, 0] : [lx, ly] } } }, { arms: false });
  o += E.quizSheet(700 + 20 * u, 590, 0.62 + 0.02 * u, -3, { scan: scan > 0 ? scan : -1, name: 'YOU' });
  o += R.counterHUD({ x: 1880, y: 80, anchor: 'right', t, label: 'QUESTIONS READ:', value: 20, roll: scan, from: 0, theme: 'green', icon: 'check', bump: seg(t, w(8, 'questions') + 0.5, w(8, 'questions') + 0.95) });
  o += R.savedToast(1880, 200, done, { text: 'Answers memorized', anchor: 'right', t, s: 0.85 });
  return o + smash(t, CUT.readQ, 0.1, 0.5);
}

// ---- 17. "and then you pressed reset." — finger snap, the world pauses grey, ESC menu → RESET CHARACTER → crumble on the desk
function shMenu(t) {
  const tC = tPress + 0.22;
  const cam = camKeys(t, [[CUT.menu, camAt(960, 760, 1.7)], [tSnap + 0.1, camAt(1080, 700, 1.55)], [CUT.door2, camAt(1080, 700, 1.6)]], ease.out);
  const grey = seg(t, tSnap, tSnap + 0.3);
  const up = ease.outBack(seg(t, tSnap - 0.15, tSnap + 0.05));
  const B = classKids(t, (r, c) => (r === 2 && c === 3 ? { name: 'nervous', fx: ['sweat2'] } : 'nervous'));
  const heroSvg = t < tC ? you(t, { x: HD.x, y: HD.y, s: HD.s, armL: 20, armR: lerp(30, 150, up), face: { name: t > tHl ? 'sneaky' : 'smug', eyes: { look: [0.8, -0.2] } } }, { arms: false }) : '';
  const W_ = classRoom(t, cam, { quiz: true }, [B[0], B[1], B[2] + heroSvg]);
  let o = W_.svg;
  if (grey > 0) {
    o += R.greyWash(grey);
    // the player is not paused: his seat stays in colour
    o += view(cam, clipTo(HD.x - 270, 420, 540, 700, heroSvg + W_.rows[2]));
  }
  if (t >= tC) o += view(cam, R.crumble({ x: HD.x, y: HD.y, s: HD.s, age: t - tC, seed: 61, dir: [0, -0.5], floorY: 860 }));
  // snap FX at the raised hand
  const [hx, hy] = AC.hand(150, 1);
  const [sx, sy] = toScr(cam, HD.x + hx * HD.s, HD.y + hy * HD.s);
  const sn = seg(t, tSnap, tSnap + 0.35);
  if (sn > 0 && sn < 1) o += S.circle(sx, sy, 30 + 120 * ease.out(sn), { fill: 'none', stroke: '#FFFFFF', 'stroke-width': f(14 * (1 - sn)), opacity: f(1 - sn) }) + K.bang('SNAP!', sx + 40, sy - 90, pop(t, tSnap, 0.15) * (1 - sn), 60, 10, '#FFFFFF');
  const mk = seg(t, tSnap + 0.05, tSnap + 0.75) * (1 - seg(t, tPress + 0.25, tPress + 0.42));
  o += R.escMenu({ x: 1380, y: 460, s: 0.78, k: mk, hl: t >= tHl ? 'reset' : t >= tSnap + 0.6 ? 'resume' : null, press: seg(t, tPress, tPress + 0.4), t });
  return o + K.C.whiteFlash(0.9 * seg(t, CUT.door2 - 0.08, CUT.door2));
}

// ---- 18. pop on the flag at 8:00 AM. TIP: "That's... cheating." — he grins and sprints for the doors
function shDoor2(t) {
  const tPop = CUT.door2 + 0.05, age = t - tPop;
  const tRun = tPop + Math.min(0.5, (CUT.hall - tPop) * 0.45);
  const cam = camKeys(t, [[CUT.door2, camAt(760, 600, 1.3)], [tRun, camAt(780, 590, 1.36)], [CUT.hall, camAt(860, 560, 1.3)]]);
  let ch = checkpointAt(t, 'back', { save: 1, plant: 1 }) + R.respawnPop({ x: CP.x, y: CP.y, s: CP.s, age, part: 'back' });
  const run = ease.inOut(seg(t, tRun, Math.min(tRun + 0.7, CUT.hall - 0.02)));
  if (age >= 0 && run < 1) {
    const pp = R.popPose(age, CP.s);
    const y = lerp(CP.y, 700, run), x = lerp(CP.x, 1060, run);
    const s = run > 0 ? scaleAt(y) : CP.s;
    if (run <= 0) ch += you(t, { x: CP.x, y: CP.y, s, sx: pp.sx, sy: pp.sy, lift: pp.lift, turn: 0.3, armL: 9, armR: 30, face: { name: 'smug', eyes: { look: [0.7, -0.4] } } }, { arms: false });
    else ch += you(t, { x, y, s, view: 'side', flip: true, ...AC.run(t * 20), lean: 12, face: 'excited', backpack: true }, { arms: false }) + K.C.dust(CP.x + 20, CP.y, tRun, t);
  }
  ch += R.respawnPop({ x: CP.x, y: CP.y, s: CP.s, age, part: 'front' }) + checkpointAt(t, 'front', { save: 1 });
  if (age >= 0 && run <= 0) ch += R.forcefield({ x: CP.x, y: CP.y, s: CP.s, t, k: 1 - seg(age, 0.6, 1.3) });
  let o = yard(t, cam, { clock: '8:00' }, kid(9, { x: 1150, y: 720, s: scaleAt(720), turn: -0.3, face: run > 0.5 ? 'shocked' : 'neutral' }), ch);
  o += E.clockStamp(1580, 150, seg(t, tPop + 0.12, tPop + 0.45) * (1 - seg(t, CUT.hall - 0.2, CUT.hall)), t);
  return o + K.C.whiteFlash(0.9 * (1 - seg(t, CUT.door2, CUT.door2 + 0.18)));
}

// ---- 19. "It was one hundred percent cheating." — the hallway sprint into ROOM 104
function shHall(t) {
  const tIn = CUT.write - Math.min(0.28, (CUT.write - CUT.hall) * 0.25);
  const u = seg(t, CUT.hall, tIn);
  const hx = lerp(-760, 1560, ease.inOut(u));
  const into = seg(t, tIn, CUT.write);
  const cam = { x: clamp(hx - 760, -1100, 900), y: 20, zoom: 1.06 };
  let ch = '';
  // two kids at the lockers spin as he blasts past
  for (const [kx, i] of [[160, 51], [880, 52]]) {
    const tp = CUT.hall + ((kx + 760) / 2320) * (tIn - CUT.hall);
    const hit = seg(t, tp - 0.05, tp + 0.4);
    ch += kid(i, { x: kx, y: 760, s: 0.37, turn: hit > 0 ? Math.sin(hit * 12) : 0.2, rot: 6 * Math.sin(hit * 12) * (1 - hit), face: hit > 0 ? 'dizzy' : 'neutral', lift: 20 * bump(hit, 0, 0.5) });
    if (hit > 0 && hit < 1) for (let j = 0; j < 3; j++) ch += S.g(X.quizPaper({ x: 0, y: 0, s: 0.3, rot: 0 }), tf(kx + 60 + 200 * hit * (j + 1) * 0.6, 520 - 160 * hit + 260 * hit * hit * (j * 0.4 + 0.6), 1, 300 * hit * (j + 1)));
  }
  const y = lerp(960, 760, ease.in(into)), s = lerp(0.5, 0.37, into);
  if (into < 1) ch += you(t, { x: hx + 90 * into, y, s, view: 'side', flip: true, ...AC.run(t * 24), lean: 16, face: 'excited' }, { arms: false }) + K.C.speedLines(hx - 760, hx - 320, y - 240, 6, 9, '#FFFFFF', 300);
  // Tip struggles to keep up
  const lag = 340 + 80 * Math.sin(t * 3);
  ch += R.tip({ x: hx - lag, y: 470 + 16 * Math.sin(t * 9), s: 0.95, t, mood: 'suspicious', look: [1, 0.1], tail: 1 }) + K.C.speedLines(hx - lag - 420, hx - lag - 160, 470, 3, 13, '#FFE27A', 90);
  let o = SS.hallway.compose(t, { doorOpen: seg(t, tIn - 0.3, tIn) }, '', ch, cam);
  return o + whip(t, CUT.hall, 1, 0.1);
}

// ---- 20. writes every answer without looking — eyes closed, the pencil a blur, ANSWERS 0 → 20
function shWrite(t) {
  const cam = camKeys(t, [[CUT.write, camAt(1040, 720, 1.72)], [CUT.done, camAt(1060, 700, 1.86)]]);
  const sc = Math.sin(t * 70);
  const armR = 82 + 6 * sc;
  const [px, py] = AC.hand(armR, 1);
  const pose = { x: HD.x, y: HD.y, s: HD.s, armR, armL: 20, turn: 0.1, headRot: 2 * Math.sin(t * 9), face: { name: 'smug', eyes: { type: 'closed' }, fx: ['sparkles'] }, props: [{ svg: pencil(px + 10 * sc, py + 6, 1.1, -30 + 12 * sc), layer: 'front' }] };
  const B = classKids(t, (r, c) => (r === 2 && c === 3 ? { name: 'shocked', mouth: 'O' } : r === 1 ? 'confused' : 'neutral'), (r, c) => (r === 2 && c === 3 ? { turn: -0.5 } : {}));
  B[2] += you(t, pose, { arms: false });
  let fx = '';
  const hxw = HD.x + px * HD.s, hyw = HD.y + py * HD.s;
  for (let i = 0; i < 5; i++) { const a = hash(Math.floor(t * 24) + i * 3.3) * 6.28, d = 60 + 40 * hash(i + Math.floor(t * 24)); fx += S.path(`M${f(hxw + Math.cos(a) * 30)} ${f(hyw + 30 + Math.sin(a) * 16)} l${f(Math.cos(a) * d)} ${f(Math.sin(a) * d * 0.5)}`, ln(5, '#FFFFFF', 0.8)); }
  fx += S.path(`M${f(hxw - 80)} ${f(hyw - 40)} q40 -30 80 0 t80 0`, ln(6, '#FFFFFF', 0.6 * Math.abs(sc)));
  // Tip hovers by the desk, squinting
  const tin = pop(t, CUT.write + 0.05, 0.3);
  fx += R.tip({ x: 1300, y: 560 + 10 * Math.sin(t * 4), s: 0.7 * tin, t, mood: 'suspicious', look: [-1, 0.3], tail: -1 });
  let o = classRoom(t, cam, { quiz: true }, B, fx).svg;
  o += R.counterHUD({ x: 1880, y: 80, anchor: 'right', t, label: 'ANSWERS:', value: 20, roll: seg(t, CUT.write + 0.1, CUT.done - 0.3), from: 0, theme: 'gold', icon: 'star' });
  o += R.tipCard(560, 170, seg(t, A[9].a, A[9].a + 0.3), "TIP: That's... cheating.", { t, w: 560, type: seg(t, A[9].a, A[9].b) });
  o += K.bang('SCRIBBLE!', 1500, 860, pop(t, CUT.write + 0.05, 0.2) * (1 - seg(t, CUT.write + 0.8, CUT.write + 1)), 64, -8, '#FFFFFF');
  return o;
}

// ---- 20b. "It was one hundred percent cheating." — DONE! The class stares; the CHEATING meter hits 100%
function shDone(t) {
  const tOne = w(10, 'one'), tPc = w1(10, 'percent'), tCh = w(10, 'cheating');
  const cam = camKeys(t, [[CUT.done, { x: 0, y: 0, zoom: 1.03 }], [CUT.grade, { x: 30, y: -20, zoom: 1.14 }]]);
  const up = ease.outBack(seg(t, CUT.done, CUT.done + 0.35));
  const armR = 165;
  const [hx, hy] = AC.hand(armR, 1);
  const B = classKids(t, (r, c) => ({ name: 'shocked', mouth: 'O', eyes: { look: [clamp((960 - SP.classroom.rows[r][c].x) / 700, -1, 1), 0.1] } }), (r, c) => ({ turn: clamp((960 - SP.classroom.rows[r][c].x) / 1400, -0.6, 0.6) }));
  B[2] += you(t, { x: HD.x, y: HD.y, s: HD.s, lift: 150 * up, armR, armL: 30, face: { name: 'smug', fx: ['sparkles'] }, props: [{ svg: X.quizPaper({ x: hx + 10, y: hy - 120, s: 1.05, rot: 8 }), layer: 'front' }] }, { arms: false });
  const figFace = t > tCh ? { name: 'confused', eyes: { look: [1, 0] } } : { name: 'deadpan', eyes: { look: [1, 0] } };
  let o = classRoom(t, cam, { quiz: true }, B, mrFig(t, { armL: 34, face: figFace })).svg;
  o += K.bang('DONE!', 1300, 250, pop(t, CUT.done + 0.15, 0.2), 90, 8, '#FFFFFF');
  // the cheat-o-meter
  const roll = seg(t, tOne, tPc);
  o += R.counterHUD({ x: 960, y: 92, anchor: 'center', s: 1.1, t, label: 'CHEATING:', value: roll >= 1 ? '100%' : 100, roll: roll < 1 ? roll : undefined, from: 0, theme: 'red', icon: 'warn', bump: seg(t, tCh, tCh + 0.45), k: seg(t, tOne - 0.25, tOne) });
  return o + smash(t, CUT.done, 0.08, 0.4);
}
// ---- 21. "You got one hundred percent." — the sheet, every answer filled; the 100% stamp SLAMS
function shGrade(t) {
  const u = seg(t, CUT.grade, CUT.gym);
  const k = seg(t, tStamp - 0.08, tStamp + 0.5);
  const tPct = w(10, 'percent', 1);
  let o = S.rect(0, 0, 1920, 1080, 0, { fill: '#D9A66A' }) + S.path('M0 180 H1920 M0 420 H1920 M0 700 H1920 M0 900 H1920', ln(5, '#C08A52', 0.6));
  o += K.rays(960, 560, 18, 1400, '#FFE27A', f(0.25 * seg(t, tStamp, tStamp + 0.3)), t * 10);
  o += you(t, { x: 250, y: 1620, s: 1.12, volume: false, turn: 0.45, face: { name: 'smug', eyes: { look: [0.6, -0.3] }, fx: k > 0.3 ? ['sparkles'] : [] } }, { arms: false });
  let sheet = E.quizSheet(1020, 560, 0.66 + 0.05 * ease.out(u), -6 + 2 * u, { answered: 1, grade: k, name: 'YOU' });
  const sh = K.shake(t, tStamp, 0.35, 26);
  o += S.g(sheet, `translate(${f(sh.sx)} ${f(sh.sy)})`);
  o += K.confetti(t, tPct, 50, 5);
  o += K.bang('100%!', 1600, 300, pop(t, tPct, 0.2), 120, 8, '#FFD23F');
  return o + smash(t, CUT.grade, 0.1, 0.6) + smash(t, tStamp, 0.08, 0.5);
}

// ================================================================= DODGEBALL
const G = SP.gym;
const DZ = G.dodge;                                              // the hero's spot (1480, 960) s .5
const gymRoom = (t, cam, opts, chars) => SS.gym.compose(t, opts, '', chars, cam);
const THR_I = [61, 62, 63];
const THR = G.throwers.map((p, j) => ({ ...p, x: p.x + 130 + 20 * j }));   // shifted right: Coach Dee stands in the left foreground
// the left team: k(j) = throw progress (-1 = no ball / idle, 0 = ball up, 1 = thrown)
function throwers(t, kOf) {
  return THR.map((p, j) => {
    const k = kOf ? kOf(j) : -1;
    const armL = k < 0 ? 30 : k === 0 ? 165 : lerp(165, 30, ease.out(clamp(k, 0, 1)));
    const pose = { x: p.x, y: p.y, s: p.s, view: 'side', flip: true, armL, armR: -30, lean: k > 0 ? 10 * bump(k, 0, 1) : 0, face: k >= 0 ? 'determined' : 'happy' };
    if (k >= 0 && k < 0.25) { const [hx, hy] = CAST.handAt(CAST.D.you, { view: 'side', armL }, -1); pose.props = [{ svg: X.dodgeball({ x: hx, y: hy - 50, s: 0.9 }), layer: 'front' }]; }
    return kid(THR_I[j], pose);
  }).join('');
}
const coachP = (t, pose = {}, act = {}) => actor('coach', t, { x: G.coachFront.x - 60, y: G.coachFront.y + 10, s: G.coachFront.s, turn: 0.4, t, ...pose }, { energy: 1.4, ...act });
const ivyP = (t, pose = {}, act = {}) => actor('ivy', t, { s: 0.48, t, ...pose }, act);
// the hero holding the last ball between two fingers (front view, right arm up)
function heroPinch(t, pose = {}, armR = 128) {
  const [hx, hy] = AC.hand(armR, 1);
  const rot = 180 - armR;
  const props = [{ svg: E.pinchHand(hx, hy - 10, 0.42, rot * 0.6) + X.dodgeball({ x: hx + 8, y: hy - 70, s: 0.9, rot: t * 20 }), layer: 'front' }];
  return you(t, { x: DZ.x, y: DZ.y, s: DZ.s, armR, armL: 14, ...pose, props }, { arms: false });
}

// ---- 22. COACH: "Dodgeball! Let's GO!" — close on Coach Dee, then the whistle and a whip out to the court
function shCoach1(t) {
  const tGo = w(11, 'GO');
  const cam = shakeAll(camKeys(t, [[CUT.gym, camAt(260, 620, 1.5)], [tGo - 0.04, camAt(250, 610, 1.62)], [tGo + 0.25, { x: 0, y: 0, zoom: 1.0 }], [CUT.dodgeQ, { x: 10, y: 0, zoom: 1.03 }]], ease.inOut), t, [[tWhistle, 0.35, 10]]);
  const blow = t >= tWhistle && t < tWhistle + 0.5;
  let ch = throwers(t, () => (t > tGo ? 0 : -1));
  ch += ivyP(t, { x: G.team[0].x, y: G.team[0].y, s: G.team[0].s, turn: -0.3, armL: 20, armR: 20, face: 'determined' }, { arms: false });
  ch += kid(64, { x: G.team[1].x, y: G.team[1].y, s: G.team[1].s, turn: -0.4, face: 'scared' });
  ch += you(t, { x: DZ.x, y: DZ.y, s: DZ.s, turn: -0.3, armL: 150 + 10 * Math.sin(t * 3), armR: 150, lean: 6 * Math.sin(t * 3), face: { name: 'smug', eyes: { type: 'closed' } } }, { arms: false });
  ch += coachP(t, { whistle: blow ? 'mouth' : 'chest', armR: blow ? 30 : undefined, armL: t > tGo - 0.1 && !blow ? 150 : undefined, face: blow ? { name: 'determined', mouth: 'o' } : undefined }, { arms: !(t > tGo - 0.1) });
  let o = gymRoom(t, cam, {}, ch);
  o += K.bang('TWEEEET!', 520, 260, pop(t, tWhistle, 0.18) * (1 - seg(t, tWhistle + 0.5, tWhistle + 0.65)), 80, -8, '#FFFFFF');
  return o + whip(t, CUT.gym, 1, 0.1);
}

// ---- 23. "Dodgeball?" — the left team fires; you yawn
function shDodgeQ(t) {
  const cam = camKeys(t, [[CUT.dodgeQ, camAt(980, 620, 1.12)], [CUT.memory, camAt(1060, 620, 1.2)]]);
  const tT = A[12].a;
  const kOf = (j) => (t < tT + j * 0.08 ? 0 : seg(t, tT + j * 0.08, tT + j * 0.08 + 0.25));
  let ch = throwers(t, kOf);
  ch += you(t, { x: DZ.x, y: DZ.y, s: DZ.s, turn: -0.35, armL: 20, armR: 160, face: { name: 'sleepy', mouth: 'yawn' } }, { arms: false });
  // balls on their way
  THR.forEach((p, j) => {
    const a = t - (tT + j * 0.08 + 0.06);
    if (a <= 0) return;
    const x0 = p.x + 140, y0 = p.y - 560 * p.s, x = x0 + 1500 * a, y = y0 - 120 * a + 60 * j * a;
    ch += E.ballTrail(x, y, 30, -0.05, 140, ['#E8453C', '#3B82F6', '#FFD23F'][j], a * 600);
  });
  return gymRoom(t, cam, {}, ch);
}

// ---- 24. "You'd already been hit by every single ball." — memory replay: one hit full-frame, then a 3×2 grid of hits
const MEM = [
  { label: 'ATTEMPT 3 · FACE', by: -780, from: -1, dir: [0.9, -0.3], col: '#E8453C' },
  { label: 'ATTEMPT 7 · BELLY', by: -420, from: -1, dir: [1, -0.1], col: '#3B82F6' },
  { label: 'ATTEMPT 12 · HEAD', by: -830, from: 1, dir: [-0.8, -0.4], col: '#FFD23F' },
  { label: 'ATTEMPT 15 · KNEES', by: -170, from: -1, dir: [0.5, -0.7], col: '#3BD16F' },
  { label: 'ATTEMPT 19 · BOUNCE', by: -900, from: 0, dir: [0.1, 0.1], col: '#E8453C' },
  { label: 'ATTEMPT 26 · BOTH', by: -600, from: -1, dir: [-0.2, -0.9], col: '#3B82F6' },
];
function memCell(t, lt, m, i, hit = 0.3) {
  let g = E.gymBg({ banner: i % 2 ? 'CHAMPS' : 'COMETS', bx: i % 2 ? 420 : 1420 });
  const hx = 1000, hy = 960, s = 0.5;
  if (lt < hit) {
    const k = clamp(lt / hit, 0, 1);
    g += you(t, { x: hx, y: hy, s, turn: -0.2 * (m.from || 0.5), face: k > 0.5 ? { name: 'scared', eyes: { look: [m.from, 0] } } : 'happy', volume: false }, { arms: false });
    const bx = m.from === 0 ? hx : hx + m.from * (900 * (1 - k) + 60), by = m.from === 0 ? lerp(-100, hy + m.by * s, k) : hy + m.by * s;
    g += E.ballTrail(bx, by, 31, m.from === 0 ? Math.PI / 2 : m.from < 0 ? 0 : Math.PI, 160, m.col);
    if (i === 5) g += E.ballTrail(hx - 900 * (1 - k) - 60, hy - 170 * s, 31, 0, 160, '#FFD23F');
  } else {
    const age = lt - hit;
    g += R.crumble({ x: hx, y: hy, s, age, seed: 70 + i * 5, dir: m.dir, floorY: hy, chips: false, life: 1.2, spread: 0.75 });
    const bk = Math.min(age, 1);
    g += X.dodgeball({ x: hx - (m.from || 0.3) * 500 * bk, y: hy + m.by * s - 600 * bk + 1200 * bk * bk, s: 0.5, col: m.col, squash: 0.5 * (1 - seg(age, 0, 0.12)) });
    g += K.bang('BONK!', hx + 230, hy - 700 * s, pop(lt, hit, 0.15) * (1 - seg(age, 0.45, 0.6)), 90, -8, '#FFFFFF');
  }
  return g;
}
function shMemory(t) {
  const tHit = w(12, 'hit');
  const apps = [CUT.memory, w(12, 'by'), w(12, 'every'), w(12, 'single'), w(12, 'ball'), w(12, 'ball') + 0.3];
  const hit0 = Math.max(0.3, tHit - CUT.memory);
  const shrink = ease.inOut(seg(t, tHit + 0.3, tHit + 0.65));
  const cw = 600, chh = 338, gx = 24, x0 = (1920 - (3 * cw + 2 * gx)) / 2, y0 = 168;
  let o = S.rect(0, 0, 1920, 1080, 0, { fill: '#1A1626' }) + S.rect(0, 0, 1920, 1080, 0, { fill: 'url(#rspScan)', opacity: 0.4 });
  MEM.forEach((m, i) => {
    const c = i % 3, r = Math.floor(i / 3);
    let x = x0 + c * (cw + gx), y = y0 + r * (chh + gx), wd = cw, ht = chh, k = seg(t, apps[i] - 0.05, apps[i] + 0.1);
    if (i === 0) { x = lerp(0, x, shrink); y = lerp(0, y, shrink); wd = lerp(1920, cw, shrink); ht = lerp(1080, chh, shrink); k = 1; }
    if (k <= 0) return;
    // every replay loops like a GIF (1.6 s period) once it has played
    const hit = i === 0 ? hit0 : 0.3;
    let lt = t - apps[i];
    const period = hit + 1.15;
    if (lt > period) lt = (lt - period) % (0.3 + 1.15) + (0.3 - hit);
    const zoom = lerp(1.25, 1.6, i === 0 ? shrink : 1), dy = lerp(80, 190, i === 0 ? shrink : 1);
    o += panel(x, y, wd, ht, memCell(t, lt, m, i, hit), { k, zoom, dx: 40, dy, tint: '#6B5A3A', tintOp: 0.16, border: i === 0 && shrink < 0.5 ? 0 : 8 });
    if (i > 0 || shrink > 0.5) o += panelTag(x + 12, y + 12, m.label, '#2A1A10', '#FFE2B0', 0.75);
  });
  // REPLAY header + the green "every ball memorized" note at the end
  o += S.g(S.rect(-250, -36, 500, 72, 36, { fill: '#10131C', opacity: 0.9, stroke: LINE_, 'stroke-width': 5 }) + S.path('M-210 -16 L-210 16 L-182 0 Z', { fill: '#FF5A6A', opacity: Math.floor(t * 3) % 2 ? 1 : 0.4 }) + TF('REPLAY · EVERY HIT', 20, 12, 34, '#FFFFFF', { 'letter-spacing': 3 }), tf(960, 86, ease.outBack(seg(t, CUT.memory + 0.05, CUT.memory + 0.35))));
  o += R.savedToast(1880, 880, seg(t, w(12, 'ball') + 0.55, w(12, 'ball') + 0.9), { text: 'Every ball memorized', anchor: 'right', t, s: 0.8 });
  return o + smash(t, CUT.memory, 0.1, 0.6) + R.flash(0.4 * bump(t, tHit + 0.28, tHit + 0.4), '#FFFFFF');
}

// ---- 25. "So you knew where every single ball was going." — bullet time: predicted paths, four impossible dodges
const DODGES = (() => {
  const d = [w(12, 'knew'), w(12, 'single', 1), w(12, 'going'), lerp(A[12].b, CUT.pinch, 0.5)];
  return [
    { t: d[0], balls: [540], pose: { rot: 42, rotY: 0, kneeL: 50, kneeR: 40, legL: 30, legR: -20, armL: 150, armR: 170 } },
    { t: d[1], balls: [880], pose: { lift: 210, kneeL: 95, kneeR: 95, legL: 60, legR: 45, armL: 160, armR: 175 } },
    { t: d[2], balls: [690], pose: { rot: 74, rotY: 0, kneeL: 85, kneeR: 75, legL: 40, legR: 20, armL: 205, armR: 215 } },
    { t: d[3], balls: [560, 905], pose: { rot: -90, rotY: -470, lift: 40, armL: 180, armR: 180, legL: 0, legR: 0, kneeL: 0, kneeR: 0 } },
  ];
})();
const BALL_V = 560;
function dodgePose(t) {
  const base = { rot: 0, rotY: -470, lift: 0, kneeL: 18, kneeR: 18, legL: 8, legR: -8, armL: 30, armR: -20 };
  const out = { ...base };
  for (const D_ of DODGES) {
    const e = ease.inOut(seg(t, D_.t - 0.4, D_.t - 0.12)) * (1 - ease.inOut(seg(t, D_.t + 0.22, D_.t + 0.48)));
    if (e <= 0) continue;
    for (const k of Object.keys(D_.pose)) out[k] = lerp(out[k] ?? base[k] ?? 0, D_.pose[k], e);
  }
  return out;
}
function shBullet(t) {
  const u = seg(t, CUT.bullet, CUT.pinch);
  // two angles: front-left, then (after the 2nd dodge) a lower, wider angle from the right
  const tCut = (DODGES[1].t + DODGES[2].t) / 2 + 0.1;
  const cam = t < tCut ? camKeys(t, [[CUT.bullet, camAt(1500, 660, 1.3)], [tCut, camAt(1540, 640, 1.42)]]) : camKeys(t, [[tCut, camAt(1700, 680, 1.22)], [CUT.pinch, camAt(1660, 670, 1.34)]]);
  let ch = '';
  // predicted trajectories first (on the floor/wall), then the balls
  const cols = ['#E8453C', '#3B82F6', '#FFD23F', '#3BD16F', '#E8453C'];
  let paths = '', balls = '';
  DODGES.forEach((D_, i) => D_.balls.forEach((by, j) => {
    const xAt = (tt) => DZ.x + (tt - D_.t) * BALL_V * (j ? 1.1 : 1);
    const pts = [];
    for (let q = 0; q <= 16; q++) { const x = lerp(700, 2300, q / 16); pts.push([x, by + 40 * Math.pow((x - DZ.x) / 900, 2)]); }
    const pk = seg(t, D_.t - 1.25, D_.t - 0.85), po = 1 - seg(t, D_.t + 0.25, D_.t + 0.6);
    paths += E.trajectory(pts, pk, po * 0.9);
    const bx = xAt(t);
    if (bx > 600 && bx < 2400) balls += E.ballTrail(bx, by + 40 * Math.pow((bx - DZ.x) / 900, 2), 31, 0, 220, cols[(i + j) % cols.length], (t - D_.t) * 90);
  }));
  const p = dodgePose(t);
  ch += you(t, { x: DZ.x, y: DZ.y, s: DZ.s, view: 'side', ...p, face: { name: 'smug', eyes: { upper: 0.35 } } }, { arms: false });
  let o = gymRoom(t, cam, { slowmo: 1, scoreboard: ['HOME', '00', 'GUEST', '00'] }, paths + ch + balls);
  o += letterbox(1, 70) + TFS('BULLET TIME', 1780, 54, 28, '#7CF7FF', { 'letter-spacing': 6 });
  return o + smash(t, CUT.bullet, 0.12, 0.6) + smash(t, tCut, 0.06, 0.35);
}

// ---- 26. ⏱ the last ball hangs in front of his face — he takes it with two fingers, without looking
function shPinch(t) {
  const tP = CUT.pinch + Math.min(0.9, (CUT.coach - CUT.pinch) * 0.6);
  const cam = camKeys(t, [[CUT.pinch, camAt(1440, 600, 2.1)], [CUT.coach, camAt(1420, 590, 2.35)]]);
  const up = ease.inOut(seg(t, CUT.pinch + 0.15, tP));
  const armL = lerp(14, 140, up);
  const [hx, hy] = AC.hand(armL, -1);
  const hand = [DZ.x + hx * DZ.s, DZ.y + hy * DZ.s];
  const target = [hand[0], hand[1] - 62];
  const bu = ease.out(seg(t, CUT.pinch, tP));
  const bx = lerp(1060, target[0], bu), by = lerp(575, target[1], bu);
  let ch = you(t, { x: DZ.x, y: DZ.y, s: DZ.s, turn: -0.12, armL, armR: 14, face: { name: 'smug', eyes: { look: [0.35, 0.15], upper: 0.4 } } }, { arms: false });
  ch += E.pinchHand(hand[0], hand[1] - 6, 0.38, -(180 - armL) * 0.15 - 4, t < tP ? 1 - up * 0.7 : 0);
  ch += X.dodgeball({ x: bx, y: by, s: 0.5, rot: 30 * (t - CUT.pinch), squash: 0.15 * bump(t, tP, tP + 0.2) });
  if (t < tP) ch += S.path(`M${f(bx - 60)} ${f(by - 10)} h-120 M${f(bx - 58)} ${f(by + 12)} h-80`, ln(5, '#FFFFFF', 0.6 * (1 - bu)));
  const g = pop(t, tP, 0.2) * (1 - seg(t, tP + 0.5, tP + 0.8));
  if (g > 0) ch += K.F.sparkle(target[0] + 50, target[1] - 40, 22 * g) + K.F.sparkle(target[0] - 40, target[1] - 60, 14 * g);
  let o = gymRoom(t, cam, { slowmo: 1, scoreboard: ['HOME', '00', 'GUEST', '00'] }, ch);
  o += letterbox(1, 70);
  const [sx, sy] = toScr(cam, target[0], target[1]);
  o += K.bang('*ting*', sx + 150, sy - 110, g, 54, -6, '#FFFFFF');
  return o;
}

// ---- 27. COACH: "Kid... where have you BEEN all my life?!" — time snaps back; Coach Dee is in love
function shCoach2(t) {
  const tBeen = w(13, 'BEEN');
  const cam = shakeAll(camKeys(t, [[CUT.coach, { x: 40, y: 20, zoom: 1.08 }], [tBeen - 0.06, { x: 40, y: 20, zoom: 1.14 }], [tBeen + 0.05, camAt(620, 520, 1.9)], [CUT.ivy, camAt(620, 515, 1.98)]], ease.out), t, [[CUT.coach, 0.3, 10], [tBeen, 0.3, 12]]);
  let ch = '';
  // the other balls slam into the wall behind him as time snaps back
  for (let i = 0; i < 3; i++) {
    const a = t - CUT.coach - i * 0.07;
    if (a < 0) continue;
    const x = Math.min(1880, 1100 + 2400 * a), y = 520 + i * 120 + (x >= 1880 ? 600 * (a - 0.32) * (a - 0.32) * 6 : 0);
    ch += X.dodgeball({ x: x >= 1880 ? 1880 - 300 * Math.max(0, a - 0.32) : x, y: Math.min(y, 930), s: 0.5, col: ['#E8453C', '#3B82F6', '#FFD23F'][i], squash: x >= 1880 ? 0.4 * (1 - seg(a, 0.32, 0.45)) : 0 });
  }
  ch += heroPinch(t, { turn: -0.25, face: { name: 'smug', fx: ['sparkles'] } });
  const love = t >= tBeen - 0.05;
  ch += actor('coach', t, { x: 600, y: 1050, s: 0.6, turn: 0.45, t, whistle: t < A[13].a ? 'mouth' : 'chest', armL: love ? 120 : 40, armR: love ? 120 : 30, face: love ? { name: 'love', fx: ['hearts', 'sparkles'] } : { name: 'shocked', fx: ['sweat'] }, lift: love ? 10 * Math.abs(Math.sin(t * 8)) : 0 }, { arms: false, energy: 1.6 });
  let o = gymRoom(t, cam, {}, ch);
  o += zoomLines(960, 420, bump(t, tBeen, tBeen + 0.5), t, '#FFFFFF', 22, 330);
  return o + smash(t, CUT.coach, 0.08, 0.5);
}

// ---- 28. IVY: "How did you know it was coming? You didn't even look!" — goggles down, finger pointed
function shIvy(t) {
  const tYou = w(14, 'You'), tDidnt = w(14, "didn't");
  const cam = camKeys(t, [[CUT.ivy, camAt(1380, 640, 1.42)], [tYou - 0.1, camAt(1370, 630, 1.48)], [tYou + 0.15, camAt(1260, 560, 1.78)], [CUT.lucky, camAt(1260, 555, 1.84)]], ease.out);
  const walk = ease.inOut(seg(t, CUT.ivy, CUT.ivy + 0.8));
  const pointK = ease.outBack(seg(t, tDidnt - 0.1, tDidnt + 0.15));
  let ch = ivyP(t, { x: lerp(1080, 1200, walk), y: 965, s: 0.5, turn: 0.5, goggles: t >= tYou ? 'down' : 'up', armR: lerp(16, 86, pointK), armL: 20, ...(walk < 1 ? AC.walkFront(t * 8, 0.6) : {}), face: t >= tYou ? { name: 'angry', eyes: { look: [0.8, 0] } } : { name: 'sneaky', eyes: { look: [0.8, 0] } } }, { arms: false, energy: 1.2 });
  ch += heroPinch(t, { x: 1580, turn: -0.45, face: { name: 'nervous', eyes: { look: [-0.7, 0] }, fx: t > tYou ? ['sweat'] : [] } });
  return gymRoom(t, cam, {}, ch);
}

// ---- 29. YOU: "Lucky guess." — shrug, the ball spins on one finger
function shLucky(t) {
  const cam = camKeys(t, [[CUT.lucky, camAt(1600, 560, 1.95)], [CUT.tip2, camAt(1600, 550, 2.05)]]);
  const armR = 162;
  const [hx, hy] = AC.hand(armR, 1);
  const props = [{ svg: S.rect(hx - 8, hy - 50, 16, 50, 8, ol('#FFFFFF', 5)) + X.dodgeball({ x: hx, y: hy - 112, s: 1, rot: t * 900 }) + S.path(`M${f(hx - 90)} ${f(hy - 112)} a90 26 0 0 0 180 0`, ln(5, '#FFFFFF', 0.6)), layer: 'front' }];
  const ch = you(t, { x: 1600, y: DZ.y, s: DZ.s, turn: -0.2, armR, armL: 38 + 8 * Math.sin(t * 4), headRot: 6, props, face: { name: 'smug', eyes: { upper: 0.3 } } }, { arms: false });
  return gymRoom(t, cam, {}, ch) + smash(t, CUT.lucky, 0.08, 0.4);
}

// ---- 30. TIP (whispering, to us): "TIP: It was not a lucky guess."
function shTip2(t) {
  const cam = camAt(1380, 640, 1.42);
  let ch = ivyP(t, { x: 1200, y: 965, s: 0.5, turn: 0.5, goggles: 'down', armR: 30, armL: 20, face: { name: 'sneaky', eyes: { look: [0.8, 0] } } }, { arms: false });
  const armR = 162, [hx, hy] = AC.hand(armR, 1);
  ch += you(t, { x: 1600, y: DZ.y, s: DZ.s, turn: -0.2, armR, armL: 30, props: [{ svg: X.dodgeball({ x: hx, y: hy - 112, s: 1, rot: t * 900 }), layer: 'front' }], face: { name: 'smug' } }, { arms: false });
  let o = gymRoom(t, cam, {}, ch) + S.rect(0, 0, 1920, 1080, 0, { fill: '#10131C', opacity: 0.32 });
  const tin = pop(t, CUT.tip2, 0.3);
  o += R.tip({ x: lerp(250, 520, tin), y: 520, s: 2.7 * tin, t, look: [0.15, 0.1], tail: 1 });
  o += R.tipCard(1250, 170, seg(t, A[16].a, A[16].a + 0.3), 'TIP: It was not a lucky guess.', { t, w: 660, type: seg(t, A[16].a, A[16].b) });
  return o + whip(t, CUT.tip2, -1, 0.08);
}

// ================================================================= THE CAFETERIA
const CF = SP.cafeteria;
const STAGE = CF.stage, SEAT = CF.heroSeat;
const FRONT_I = { 1330: 71, 2420: 72 }, BACK_I = [73, 74, 75, 76, 77];
const MILK_X = 1330, MILK_LIFT = 50;   // the milk kid sits up (leaning in / laughing) so his face clears the table
// back-table kids + front-table kids (without the hero / Ivy), mood per kid
function cafeKids(t, mood, o = {}) {
  const face = (i, ph) => {
    if (mood === 'listen') return i % 2 ? 'happy' : 'neutral';
    if (mood === 'dead') return i % 3 === 0 ? 'deadpan' : i % 3 === 1 ? { name: 'neutral', eyes: { upper: 0.5 } } : 'confused';
    if (mood === 'lean') return i % 2 ? { name: 'happy', eyes: { look: [0.4, 0] } } : 'excited';
    if (mood === 'laugh' || mood === 'cheer') return { name: 'joy', fx: i % 2 ? ['tears'] : [] };
    return 'neutral';
  };
  const pose = (i, ph) => {
    if (mood === 'laugh') return laughPose(t, ph);
    if (mood === 'cheer') { const b = Math.abs(Math.sin(t * 9 + ph)); return { armL: 150 + 20 * b, armR: 150 + 20 * Math.abs(Math.sin(t * 9 + ph + 1)), bodyY: -8 * b }; }
    if (mood === 'lean') return { lean: 0, headY: 6, ...AC.breathe(t, ph) };
    return AC.breathe(t, ph);
  };
  let back = '';
  CF.seats.back.forEach((p, j) => {
    const i = BACK_I[j];
    if (o.skipBack && o.skipBack.includes(j)) return;
    back += kid(i, { x: p.x, y: p.y, s: p.s, turn: clamp((1720 - p.x) / 1600, -0.5, 0.5), face: face(i, j), ...pose(i, j * 1.7) });
  });
  let front = '';
  for (const x of [MILK_X, 2420]) {
    if (o.skipFront && o.skipFront.includes(x)) continue;
    const i = FRONT_I[x];
    const extra = o.front && o.front[x] ? o.front[x] : {};
    front += kid(i, { x, y: 1004, s: 0.45, turn: x < 1720 ? 0.45 : -0.45, face: face(i, x), ...pose(i, x * 0.01), ...extra });
  }
  return { back, front };
}
const ivyCafe = (t, pose = {}, act = {}) => actor('ivy', t, { x: 2060, y: 1004, s: 0.45, turn: -0.4, t, ...pose }, act);
const lunchLady = (t, pose = {}) => K.draw.adult(5, { x: CF.lunchLady.x, y: CF.lunchLady.y, s: CF.lunchLady.s, turn: 0.3, shade: true, shadow: false, volume: false, ...pose });
function cafe(t, cam, opts, rows, after = '') {
  return SS.cafeteria.compose(t, { menu: ['PIZZA DAY!', 'PEPPERONI · CHEESE', 'SALAD BAR · FRUIT CUP', 'MILK · JUICE'], ...opts }, rows, after, cam);
}
// a milk carton with a bendy straw, (x, y) = bottom centre
function milkCarton(x, y, s = 1, rot = 0, straw = null) {
  let o = S.path('M-40 0 L-40 -110 L0 -150 L40 -110 L40 0 Z', ol('#FFFFFF', 6)) + S.path('M-40 -110 L40 -110', ln(5, LINE_)) + S.rect(-36, -86, 72, 40, 6, { fill: '#3B82F6' }) + TF('MILK', 0, -58, 22, '#FFFFFF');
  if (straw) o += S.path(`M14 -128 L14 -170 Q14 -190 ${f(straw[0])} ${f(straw[1])}`, ln(14, LINE_)) + S.path(`M14 -128 L14 -170 Q14 -190 ${f(straw[0])} ${f(straw[1])}`, ln(8, '#FF6FB5'));
  return S.g(o, tf(x, y, s, rot));
}

// ---- 31. "At lunch, you told a joke." — at the table, hands flying, everybody listening
function shLunch(t) {
  const cam = camKeys(t, [[CUT.lunch, camAt(1720, 730, 1.72)], [CUT.terrible, camAt(1720, 715, 1.84)]]);
  const g = Math.sin(t * 5);
  const K_ = cafeKids(t, 'listen');
  const hero = you(t, { x: SEAT.x, y: SEAT.y, s: SEAT.s, armL: 110 + 40 * g, armR: 115 - 40 * Math.sin(t * 5 + 1.3), headRot: 5 * g, bodyY: 4 * Math.abs(g), face: yap(t, 'excited') }, { arms: false });
  const ivy = ivyCafe(t, { face: 'happy', armL: 14, armR: 14 }, { arms: false });
  return cafe(t, cam, {}, [lunchLady(t), K_.back, K_.front + hero + ivy]) + whip(t, CUT.lunch, 1, 0.1);
}

// ---- 32. "It was terrible." — dead silence: blank stares, a cricket on the table, the grin freezes
function shTerrible(t) {
  const u = seg(t, CUT.terrible, CUT.reset);
  const cam = camKeys(t, [[CUT.terrible, camAt(1720, 705, 1.9)], [CUT.reset, camAt(1720, 650, 2.35)]], (x) => x);
  const K_ = cafeKids(t, 'dead');
  const hero = you(t, { x: SEAT.x, y: SEAT.y, s: SEAT.s, armL: 105, armR: 100, face: { name: 'nervous', mouth: 'grin', fx: u > 0.3 ? ['sweat', 'sweat2'] : ['sweat'] } }, { arms: false });
  const ivy = ivyCafe(t, { face: { name: 'deadpan', eyes: { look: [-0.8, 0] } }, armL: 14, armR: 14 }, { arms: false });
  let after = E.cricket(1490, 812, 1.0, t);
  for (const [x, y, d] of [[1560, 500, 0.3], [1880, 500, 0.15], [2060, 440, 0.5], [1330, 575, 0.2]]) after += E.dots(x, y, seg(u, d, d + 0.3), 0.9);
  return cafe(t, cam, {}, [lunchLady(t), K_.back, K_.front + hero + ivy], after);
}

// ---- 33. "Reset." — snap. He crumbles in his seat. FULL overlay: RESPAWNING 3·2·1 — JOKE: TERRIBLE
function shReset(t) {
  const tC = tReset + 0.06;
  const cam = camAt(1720, 680, 2.0);
  const K_ = cafeKids(t, 'dead');
  const up = ease.outBack(seg(t, CUT.reset, tReset));
  const hero = t < tC ? you(t, { x: SEAT.x, y: SEAT.y, s: SEAT.s, armL: 100, armR: lerp(100, 155, up), face: { name: 'determined', fx: ['sweat'] } }, { arms: false }) : '';
  const ivy = ivyCafe(t, { face: 'deadpan', armL: 14, armR: 14 }, { arms: false });
  let after = t >= tC ? R.crumble({ x: SEAT.x, y: SEAT.y, s: SEAT.s, age: Math.min(t - tC, 0.34), seed: 91, dir: [0, -0.4], floorY: 820 }) : '';
  let o = cafe(t, cam, {}, [lunchLady(t), K_.back, K_.front + hero + ivy], after);
  o += R.respawnOverlay(t, { t0: tC + 0.04, dur: Math.max(0.5, CUT.tries - tC - 0.04), style: 'full', reason: 'JOKE: TERRIBLE', label: 'RESPAWNING' });
  return o;
}

// ---- 34. "Thirty-one tries later..." — the strobe loop: TRY 2 … 31, every try a new pose and a new kind of silence
const TRY_POSES = [
  { armL: 150, armR: 100, face: 'excited' }, { armL: 100, armR: 140, face: 'smug' }, { armL: 125, armR: 125, face: 'joy' },
  { armL: 100, armR: 165, face: 'determined' }, { armL: 145, armR: 145, face: 'nervous' }, { armL: 110, armR: 100, face: 'happy' },
];
const TRY_FACES = ['deadpan', 'sleepy', 'confused', 'yuck', 'neutral', 'sad', 'dizzy'];
function shTries(t) {
  const end = CUT.joke - 0.3;
  const k = seg(t, CUT.tries, end);
  // accelerating tries: n(k) ease-in from 2 to 31
  const n = t >= end ? 31 : 2 + Math.floor(29 * ease.in(k));
  const tN = t >= end ? end : CUT.tries + (end - CUT.tries) * Math.sqrt((n - 2) / 29);
  const jx = (hash(n * 3.1) - 0.5) * 60, jy = (hash(n * 7.7) - 0.5) * 30;
  const cam = camAt(1720 + jx, 715 + jy, 1.82 + 0.12 * hash(n));
  const P = TRY_POSES[n % TRY_POSES.length];
  const backF = cafeKids(t, 'dead');
  // re-face the kids per try
  const kids = cafeKids(t, 'none');
  const fOf = (i) => TRY_FACES[Math.floor(hash(i * 1.3 + n * 5.1) * TRY_FACES.length)];
  let back = '', front = '';
  CF.seats.back.forEach((p, j) => { back += kid(BACK_I[j], { x: p.x, y: p.y, s: p.s, turn: clamp((1720 - p.x) / 1600, -0.5, 0.5), face: n === 31 ? 'excited' : fOf(BACK_I[j]) }); });
  for (const x of [MILK_X, 2420]) front += kid(FRONT_I[x], { x, y: 1004, s: 0.45, turn: x < 1720 ? 0.45 : -0.45, face: n === 31 ? 'happy' : fOf(FRONT_I[x]) });
  const hero = you(t, { x: SEAT.x, y: SEAT.y, s: SEAT.s, armL: P.armL, armR: P.armR, face: yap(t, P.face) }, { arms: false });
  const ivy = ivyCafe(t, { face: n === 31 ? 'happy' : fOf(99), armL: 14, armR: 14 }, { arms: false });
  let o = cafe(t, cam, {}, [lunchLady(t), back, front + hero + ivy]);
  const fl = 1 - seg(t, tN, tN + 0.06);
  if (t < end) o += K.C.whiteFlash(0.55 * fl) + (fl > 0.3 ? R.flash(0.12, '#7E8596') : '');
  o += R.counterHUD({ x: 960, y: 110, anchor: 'center', s: 1.25, t, label: 'TRY', value: n, theme: n === 31 ? 'gold' : 'white', bump: n === 31 ? seg(t, end, end + 0.45) : seg(t, tN, tN + 0.25) });
  return o;
}

// ---- 35. YOU: "...and that's why the cafeteria pizza has its own fan club." — on the bench, pizza in hand
function shJoke(t) {
  const tPz = w(18, 'pizza');
  const cam = camKeys(t, [[CUT.joke, camAt(1720, 650, 1.5)], [CUT.fan, camAt(1720, 610, 1.7)]]);
  const raise = ease.outBack(seg(t, tPz - 0.2, tPz + 0.15));
  const armR = lerp(70, 150, raise);
  const [hx, hy] = AC.hand(armR, 1);
  const hero = you(t, { x: STAGE.x, y: STAGE.y, s: STAGE.s, armR, props: [{ svg: E.pizzaSlice(hx, hy + 30, 0.9, 180 - armR + 10), layer: 'front' }] }, { energy: 1.3, arms: false });
  const K_ = cafeKids(t, 'lean');
  const ivy = ivyCafe(t, { face: { name: 'happy', eyes: { look: [-0.6, -0.4] } }, armL: 14, armR: 14 }, { arms: false });
  let after = '';
  const g = pop(t, tPz, 0.2) * (1 - seg(t, tPz + 0.5, tPz + 0.8));
  if (g > 0) after += K.F.sparkle(STAGE.x + hx * STAGE.s + 30, STAGE.y + hy * STAGE.s - 60, 30 * g);
  return cafe(t, cam, {}, [lunchLady(t), K_.back, K_.front + ivy + hero], after) + smash(t, CUT.joke, 0.1, 0.6);
}
// ---- 36. "...fan club." — reaction: the table leans in; the milk kid sips through a bendy straw (setup)
function shFan(t) {
  const cam = camKeys(t, [[CUT.fan, camAt(1410, 690, 1.95)], [CUT.surv, camAt(1395, 690, 2.08)]]);
  const K_ = cafeKids(t, 'lean', { skipFront: [MILK_X] });
  const sip = Math.sin(t * 10) * 3;
  const milkKid = kid(FRONT_I[MILK_X], { x: MILK_X, y: 1004 - MILK_LIFT, s: 0.45, turn: 0.45, armR: 52, armL: 14, face: { name: 'amazed', mouth: 'o', eyes: { look: [0.9, -0.3] } } });
  const carton = milkCarton(MILK_X + 150, 880 + sip, 0.55, -6, [-70, -400]);
  return cafe(t, cam, {}, [lunchLady(t), K_.back, K_.front + milkKid], carton);
}

// ---- 37. "It's called 'The Survivors.'" — close, the pause, arms wide: THE SURVIVORS
function shSurv(t) {
  const tS = w(18, 'Survivors');
  const cam = shakeAll(camKeys(t, [[CUT.surv, camAt(1720, 540, 1.95)], [tS - 0.05, camAt(1720, 540, 2.02)], [tS + 0.08, camAt(1720, 520, 2.3)], [CUT.laugh, camAt(1720, 520, 2.34)]], ease.out), t, [[tS, 0.3, 10]]);
  const wide = ease.outBack(seg(t, tS - 0.1, tS + 0.15));
  const finger = t < tS - 0.1 && t > w(18, 'called') - 0.1;
  const armR = wide > 0 ? lerp(150, 115, wide) : finger ? 165 : 70;
  const [hx, hy] = AC.hand(armR, 1);
  const hero = you(t, { x: STAGE.x, y: STAGE.y, s: STAGE.s, armL: lerp(20, 115, wide), armR, volume: false, props: [{ svg: E.pizzaSlice(hx, hy + 30, 0.9, 180 - armR + 10, wide), layer: 'front' }], face: wide > 0.3 ? { name: 'smug', fx: ['sparkles'] } : { name: 'sneaky' } }, { arms: false, energy: 1.2 });
  const K_ = cafeKids(t, 'lean');
  let o = cafe(t, cam, {}, [lunchLady(t), K_.back, K_.front + hero]);
  const tk = pop(t, tS, 0.25);
  if (tk > 0) o += S.g(S.rect(-420, -70, 840, 140, 26, ol('#2A1640', 8)) + S.rect(-406, -56, 812, 112, 18, { fill: 'none', stroke: '#FFD23F', 'stroke-width': 5 }) + TS('THE SURVIVORS', 0, 34, 92, '#FFD23F'), tf(960, 170, tk, -3));
  o += K.bang('BA-DUM TSS!', 1500, 830, pop(t, tS + 0.35, 0.2), 60, 6, '#FFFFFF');
  return o;
}

// ---- 38. "The whole cafeteria laughed." — wide: everyone howling, a kid falls off the bench, the lunch lady too
function shLaugh(t) {
  const cam = shakeAll(camKeys(t, [[CUT.laugh, { x: 500, y: -30, zoom: 0.96 }], [CUT.milk, { x: 470, y: -40, zoom: 0.9 }]]), t, [[CUT.laugh, 0.5, 14]]);
  const fall = ease.in(seg(t, CUT.laugh + 0.5, CUT.laugh + 1.1));
  const K_ = cafeKids(t, 'laugh', { front: { 2420: { rot: 85 * fall, x: 2420 + 140 * fall, lift: -40 * fall, legL: 60 * fall, legR: 40 * fall } } });
  const hero = you(t, { x: STAGE.x, y: STAGE.y, s: STAGE.s, armL: 160, armR: 160, face: { name: 'joy', fx: ['sparkles'] }, ...laughPose(t, 0.4, 0.6) }, { arms: false });
  const ivy = ivyCafe(t, { face: { name: 'joy', fx: ['tears'] }, ...laughPose(t, 2.1) }, { arms: false });
  // the lunch line laughs too
  let line = '';
  CF.line.slice(0, 2).forEach((p, j) => { line += kid(81 + j, { x: p.x, y: p.y, s: p.s, turn: 0.5, face: { name: 'joy' }, ...laughPose(t, j * 2.3) }); });
  let o = cafe(t, cam, {}, [lunchLady(t, { face: { name: 'joy' }, ...laughPose(t, 1.1, 0.7) }), K_.back + line, K_.front + ivy + hero]);
  o += E.haLetters(960, 380, t, 1, 9, 3, 1700, 80);
  return o + smash(t, CUT.laugh, 0.1, 0.6);
}

// ---- 39. "Somebody laughed milk out of their nose." — close: the milk kid. PFFFT.
function shMilk(t) {
  const tM = w(19, 'milk'), tN = w(19, 'nose');
  const cam = shakeAll(camKeys(t, [[CUT.milk, camAt(1380, 650, 1.95)], [tM, camAt(1360, 640, 2.05)], [tN, camAt(1360, 640, 2.08)], [tN + 0.12, camAt(1350, 630, 2.35)], [CUT.laugh2, camAt(1350, 630, 2.4)]], ease.out), t, [[tM, 0.3, 10], [tN, 0.3, 12]]);
  const K_ = cafeKids(t, 'laugh', { skipFront: [MILK_X] });
  const lp = laughPose(t, 0.3, 1.2);
  const head = { x: MILK_X, y: 1004 - lp.bodyY * 0.45 };
  const milkKid = kid(FRONT_I[MILK_X], { x: MILK_X, y: 1004 - MILK_LIFT, s: 0.45, turn: 0.35, ...lp, armR: 52, face: { name: 'joy', fx: ['tears', 'blush'] } });
  const carton = milkCarton(MILK_X + 150, 880, 0.55, -6);
  const jk = seg(t, tM - 0.05, tM + 0.5);
  // nostrils ≈ between the eyes and the mouth of a seated kid (s .45)
  const jets = E.milkJets(MILK_X + 16, head.y - MILK_LIFT - 0.45 * 590, jk, t, 0.6, 1);
  let o = cafe(t, cam, {}, [lunchLady(t), K_.back, K_.front + milkKid], carton + jets);
  o += K.bang('PFFFT!', 1250, 300, pop(t, tN, 0.18), 100, -8, '#FFFFFF');
  return o + smash(t, CUT.milk, 0.08, 0.5);
}

// ---- 39b. (laughter beat) — wider: the milk still arcing, the whole table howling, the hero basking
function shLaugh2(t) {
  const cam = shakeAll(camKeys(t, [[CUT.laugh2, camAt(1560, 640, 1.18)], [CUT.best, camAt(1580, 630, 1.24)]]), t, [[CUT.laugh2, 0.3, 8]]);
  const K_ = cafeKids(t, 'laugh', { skipFront: [MILK_X] });
  const lp = laughPose(t, 0.3, 1.2);
  const milkKid = kid(FRONT_I[MILK_X], { x: MILK_X, y: 1004 - MILK_LIFT, s: 0.45, turn: 0.35, ...lp, armR: 52, face: { name: 'joy', fx: ['tears', 'blush'] } });
  const jets = E.milkJets(MILK_X + 16, 1004 - MILK_LIFT - lp.bodyY * 0.45 - 0.45 * 590, 1, t, 0.6, 1);
  const hero = you(t, { x: STAGE.x, y: STAGE.y, s: STAGE.s, armL: 150, armR: 150, face: { name: 'joy', fx: ['sparkles'] }, ...laughPose(t, 0.4, 0.5) }, { arms: false });
  const ivy = ivyCafe(t, { face: { name: 'joy', fx: ['tears'] }, ...laughPose(t, 2.1) }, { arms: false });
  let o = cafe(t, cam, {}, [lunchLady(t, { face: { name: 'joy' } }), K_.back, K_.front + milkKid + ivy + hero], milkCarton(MILK_X + 150, 880, 0.55, -6) + jets);
  o += E.haLetters(960, 360, t, 1, 7, 9, 1600, 76);
  return o;
}

// ---- 40. YOU: "This is the best day of my LIFE!" — golden rays, arms up, smash-zoom on LIFE
function shBest(t) {
  const tLife = w(20, 'LIFE');
  const cam = shakeAll(camKeys(t, [[CUT.best, camAt(1720, 600, 1.45)], [tLife - 0.06, camAt(1720, 590, 1.55)], [tLife + 0.06, camAt(1720, 560, 1.95)], [CUT.count, camAt(1720, 560, 2.0)]], ease.out), t, [[tLife, 0.4, 14]]);
  const K_ = cafeKids(t, 'cheer');
  const glow = seg(t, CUT.best, CUT.best + 0.5);
  const rays = E.goldRays(STAGE.x, STAGE.y - 300, glow, t, 1300);
  const hero = you(t, { x: STAGE.x, y: STAGE.y, s: STAGE.s, armL: 145, armR: 145, lift: 20 * Math.abs(Math.sin(t * 6)), face: { name: 'excited', fx: ['sparkles'] } }, { energy: 1.5, arms: false });
  const ivy = ivyCafe(t, { face: 'joy', armL: 150, armR: 150, bodyY: -6 * Math.abs(Math.sin(t * 9)) }, { arms: false });
  let o = cafe(t, cam, {}, [lunchLady(t), K_.back + rays, K_.front + ivy + hero], K.C.burst(STAGE.x, STAGE.y - 400, seg(t, tLife, tLife + 0.5), '#FFE27A'));
  o += zoomLines(960, 420, bump(t, tLife, tLife + 0.6), t, '#FFE27A', 22, 360);
  return o;
}

// ---- 41. "Two hundred and fourteen times in a row!" — pull back; ATTEMPTS TODAY rolls to 214; every fail of the day flies in
const ICONS = ['board', 'cube', 'quiz', 'ball', 'cube', 'board', 'pizza', 'ball', 'cube', 'quiz'];
function shCount(t) {
  const tTwo = w(20, 'Two'), tFt = w1(20, 'fourteen');
  const cam = camKeys(t, [[CUT.count, camAt(1720, 560, 2.0)], [CUT.count + 0.7, camAt(1660, 600, 1.12)], [END, camAt(1660, 590, 1.18)]], ease.inOut);
  const K_ = cafeKids(t, 'cheer');
  const rays = E.goldRays(STAGE.x, STAGE.y - 300, 1, t, 1500);
  const hero = you(t, { x: STAGE.x, y: STAGE.y, s: STAGE.s, armL: 145, armR: 145, lift: 16 * Math.abs(Math.sin(t * 6)), face: { name: 'joy', fx: ['sparkles'] } }, { energy: 1.4, arms: false });
  const ivy = ivyCafe(t, { face: 'joy', armL: 150, armR: 150 }, { arms: false });
  let o = cafe(t, cam, {}, [lunchLady(t, { face: 'happy' }), K_.back + rays, K_.front + ivy + hero]);
  // the counter + flying fail icons
  const out = seg(t, END - 0.32, END);
  const cs = 1.25 * (1 + 1.6 * ease.in(out));
  const roll = seg(t, tTwo, tFt);
  ICONS.forEach((kind, i) => {
    const a = lerp(tTwo - 0.1, tFt - 0.15, i / (ICONS.length - 1));
    const k = seg(t, a, a + 0.55);
    if (k <= 0 || k >= 1) return;
    const sx0 = hash(i * 3.3) > 0.5 ? -120 : 2040, sy0 = 300 + hash(i * 5.1) * 600;
    const e = ease.in(k);
    o += E.failIcon(kind, lerp(sx0, 960, e), lerp(sy0, 170, e) - 160 * Math.sin(Math.PI * k), 1.2 * (1 - 0.6 * e), 400 * k * (i % 2 ? 1 : -1));
    if (k > 0.85) o += K.F.sparkle(960 + (hash(i) - 0.5) * 200, 170, 26 * bump(k, 0.85, 1));
  });
  o += R.counterHUD({ x: 960, y: 170 + 30 * out, anchor: 'center', s: cs, t, label: 'ATTEMPTS TODAY:', value: 214, roll, from: 0, theme: 'gold', k: seg(t, CUT.count, CUT.count + 0.3), bump: seg(t, tFt, tFt + 0.45) + (t > A[20].b ? seg(t, A[20].b, A[20].b + 0.45) : 0) });
  return o + K.C.whiteFlash(0.92 * ease.in(out));
}

// ================================================================= dispatch
const SHOTS = [
  [CUT.walk, shWalk], [CUT.plant, shPlant], [CUT.skate, shSkate], [CUT.a1, shA1], [CUT.r1, shR1], [CUT.a2, shA2], [CUT.a23, shA23], [CUT.mont, shMont],
  [CUT.a57, shA57], [CUT.whoa, shWhoa], [CUT.yeah, shYeah], [CUT.tip1, shTip1],
  [CUT.quiz, shQuiz], [CUT.deal, shDeal], [CUT.read, shNoProb], [CUT.readQ, shRead], [CUT.menu, shMenu], [CUT.door2, shDoor2], [CUT.hall, shHall], [CUT.write, shWrite], [CUT.done, shDone], [CUT.grade, shGrade],
  [CUT.gym, shCoach1], [CUT.dodgeQ, shDodgeQ], [CUT.memory, shMemory], [CUT.bullet, shBullet], [CUT.pinch, shPinch], [CUT.coach, shCoach2], [CUT.ivy, shIvy], [CUT.lucky, shLucky], [CUT.tip2, shTip2],
  [CUT.lunch, shLunch], [CUT.terrible, shTerrible], [CUT.reset, shReset], [CUT.tries, shTries], [CUT.joke, shJoke], [CUT.fan, shFan], [CUT.surv, shSurv], [CUT.laugh, shLaugh], [CUT.milk, shMilk], [CUT.laugh2, shLaugh2], [CUT.best, shBest], [CUT.count, shCount],
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
  if (t >= CUT.bullet && t < CUT.coach) return { grade: 'cool', vignette: 0.6 };
  if (t >= CUT.memory && t < CUT.bullet) return { grade: null, vignette: 0.5 };
  if (t >= CUT.mont && t < CUT.a57) return { grade: null, vignette: 0.3 };
  return { grade: 'warm', vignette: 0.45 };
}

module.exports = { scene, look, SHOTS, CUT };
