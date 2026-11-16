// SC 04 · ПРОВЕРКА КОМАНД — the morning after: the hero tests the admin commands at home.
//   1  morning, laptop ready                     5  the fridge: couch → hallway → ;tp → INSIDE the fridge (nom nom)
//   2  Granny: one pancake / 40 min → ;speed     6  Dad's meeting → ;fly Dad → sky office → ;unfly → the pool
//      → 400 pancakes, keys, the car, 900 MPH,   7  ;god me → Mom's sticky notes bounce (ping, ping)
//      ;unspeed                                  8  Zoe in four minutes: real admin panel, LOGS, "boss of real life?",
//   3  Pancake: ;size 10 → the house on his back,   the webcam LED, "What could possibly go wrong?" — famous last words
//      MEOW, the street sways → ;size 1
// Every cut and hit is placed on the voice (L(id).a/.b, .word()); nothing is timed in absolute seconds.
'use strict';

const K = require('./kit');
const { S, f, clamp, lerp, ease, seg, bump, hash, ol, ln, T, TF, camKeys, view, actor } = K;
const { L } = K.V;
const C = K.C;
const SETS = require('./sets');
const CAST = require('../rig/cast');
const { pancake } = require('../rig/cats');
const AC = require('./acting');
const X = require('./s04_env');
const { tf, TS, TFS, pop, at, shakeAll, clipRect, split, whip, smash, flashCol, zoomLines, squash, popStretch, typing, fc, heldLaptop } = X;
const { FLOOR, SPOTS } = SETS;

const A = Array.from({ length: 28 }, (_, i) => L('04.' + i));
const SC = K.V.scene('SC 04');
const T0 = SC.start, END = K.V.scene('SC 05').start;
const w = (i, word, n = 0) => A[i].word(word, n).t0;
const w1 = (i, word, n = 0) => A[i].word(word, n).t1;

// ---------------------------------------------------------------- cuts (all from the voice)
const c01 = T0;                                   // exterior, morning
const c02 = w(0, 'you') - 0.1;                    // hero + laptop: "you start testing"
const c03 = A[1].a - 0.1;                         // Granny, one pancake
const c04 = w(1, 'For') - 0.1;                    // 40 minutes (stopwatch, cobweb)
const c05 = A[2].a - 0.12;                        // ;speed Granny
const tSpeedE = A[2].b + 0.04;
const c06 = A[2].b + 0.12;                        // the blur
const c07 = w(3, 'four') - 0.1;                   // the stack hits the ceiling
const tHundred = w(3, 'hundred') + 0.25;
const c08 = w(3, 'sweetie') - 0.12;               // Granny close
const c09 = w(3, 'Want') - 0.1;                   // keys! "I'll drive!"
const c10 = A[4].a - 0.1;                         // Granny in the car
const c11 = w(4, 'At') - 0.1;                     // speedometer
const c12 = A[5].a - 0.1;                         // ;unspeed Granny
const tUnspeedE = w(5, 'granny', 1);
const c13 = tUnspeedE + 0.06;                     // the car stops dead
const c14 = w(6, 'the') - 0.1;                    // Pancake eats a pancake
const c15 = A[7].a - 0.1;                         // ;size Pancake 10
const tSizeE = A[7].b + 0.04;
const c16 = A[7].b + 0.12;                        // he grows
const c17 = w(8, 'Ten', 1) - 0.1;                 // exterior: the house on his back, MEOW
const tMeow = w(8, 'VERY');
const c18 = A[8].b + 0.15;                        // the yawn sways the street
const c19 = A[9].a - 0.1;                         // ;size Pancake 1
const tOneE = w1(9, 'ONE');
const c20 = tOneE + 0.1;                          // shrink, the house drops back
const c21 = A[10].a + 0.15;                       // couch: hungry
const c22 = w(10, 'But') - 0.1;                   // the fridge is SO far
const c23 = A[11].a - 0.1;                        // ;tp me to the fridge
const tTpE = A[11].b + 0.04;
const c24 = A[11].b + 0.24;                       // inside the fridge
const c25 = w(12, 'Not') - 0.1;                   // closed fridge, nom nom
const c26 = A[13].a - 0.1;                        // Dad's very important meeting
const c27 = A[14].a - 0.12;                       // split: Dad / call (muted)
const c28 = A[15].a - 0.1;                        // ;fly Dad
const tFlyE = A[15].b + 0.04;
const c29 = A[15].b + 0.12;                       // Dad floats out of the window
const c30 = w(16, 'outside') - 0.1;               // split: call / Dad above the tree
const c31 = A[17].a - 0.1;                        // the sky office
const c32 = w(17, 'Can') - 0.15;                  // can you hear me now (sky)
const c33 = A[18].a - 0.1;                        // boss: Yes! Perfectly!
const c34 = w(18, 'First') - 0.12;                // three years! + ;unfly Dad
const tUnflyE = lerp(w(18, 'years'), A[18].b, 0.5);
const c35 = tUnflyE + 0.08;                       // splash
const tSplash = c35 + 0.3;
const c36 = Math.max(A[19].a + 0.3, tSplash + 0.42); // ;god me
const tGodE = A[19].b + 0.04;
const c37 = w(20, "won't") - 0.1;                 // Mom + notes: ping, ping
const c39 = A[21].a + 0.15;                       // calling Zoe
const c40 = w(21, 'She') - 0.1;                   // four minutes
const c41 = A[22].a - 0.1;                        // Zoe stunned
const c42 = w(22, 'Like') - 0.1;                  // couch: a REAL one
const c43 = A[23].a - 0.1;                        // Zoe explains
const c44 = w(23, 'Fly') - 0.1;                   // Fly / Teleport / Ban
const c45 = w(23, "They're") - 0.1;               // boss of the server
const c46 = A[24].a - 0.1;                        // "boss... of real life?"
const c47 = A[25].a - 0.1;                        // Zoe: logs
const c48 = w(25, 'Every') - 0.12;                // the log screen
const c49 = w(25, 'Somebody') - 0.1;              // the webcam LED
const c50 = A[26].a - 0.1;                        // "What could possibly go wrong?"
const c51 = A[27].a - 0.1;                        // famous last words

// ---------------------------------------------------------------- small helpers
const LINE = '#151515';
const GOLD = '#FFD34D';
const you = (t, pose, act) => actor('you', t, pose, act);
// world -> screen through a cam
function toS(cam, wx, wy) {
  const z = cam.zoom ?? 1;
  return [960 + (cam.sx || 0) + z * (wx - 960 - (cam.x || 0)), 540 + (cam.sy || 0) + z * (wy - 540 - (cam.y || 0))];
}
// cam that puts world (wx, wy) at screen (sx, sy)
const atS = (wx, wy, zoom, sx = 960, sy = 540) => ({ zoom, x: wx - 960 - (sx - 960) / zoom, y: wy - 540 - (sy - 540) / zoom });
// hand position (world) of a rig pose; Z = design size; side +1 = armR (front) / the near arm (side view: armL)
function handW(p, Z = 1, side = 1, sx = 100) {
  const view_ = p.view || 'front';
  const a = (side < 0 ? p.armL : p.armR) ?? 9;
  const r = (a * Math.PI) / 180;
  let hx, hy;
  if (view_ === 'side') { hx = 4 - 250 * Math.sin(r); hy = -505 + 250 * Math.cos(r); }
  else { hx = side * (sx + 252 * Math.sin(r)); hy = -515 + 252 * Math.cos(r); }
  hy += p.bodyY || 0;
  const fs = p.flip ? -1 : 1, k = p.s * Z;
  return [p.x + fs * hx * k, p.y - (p.lift || 0) + hy * k];
}
// a room set seen through cam: bg (parallax), mid, `behind` (inside/behind furniture), front, chars, fg, light
function room(setFn, t, opts, cam, parts = {}) {
  const Ly = setFn.layers(t, opts);
  return view(cam, Ly.bg, parts.bgK ?? 0.85) + view(cam, Ly.mid + (parts.patch || '') + (parts.behind || '') + Ly.front + (parts.chars || ''), 1) +
    (Ly.fg ? view(cam, Ly.fg, parts.fgK ?? 1) : '') + (parts.over ? view(cam, parts.over, 1) : '') + (Ly.light ? view(cam, Ly.light, 1) : '');
}
// enter flash value for K.chatCommand
const enterK = (t, tE, d = 0.42) => (t >= tE && t < tE + d ? Math.max(0.001, seg(t, tE, tE + d)) : 0);
// a chat command bar in screen space, popping in at t0
function cmd(t, x, y, text, prog, tE, opts = {}) {
  const k = opts.t0 !== undefined ? ease.outBack(seg(t, opts.t0, opts.t0 + 0.22)) : 1;
  if (k <= 0.01) return '';
  const s = (opts.s || 1.3) * k;
  let o = K.chatCommand(x, y, text, prog, { t, enter: enterK(t, tE), s, theme: opts.theme || 'dark', user: 'you' });
  // extra ENTER hammering: an expanding green ring around the bar
  const bw = Math.max(360, 70 + 6 * 15 + text.length * 16.5 + 60);
  if (opts.extraE) for (const e of opts.extraE) {
    if (t < e || t > e + 0.3) continue;
    const u = seg(t, e, e + 0.3);
    o += S.g(S.rect(-bw / 2, -44, bw, 84, 22, { fill: '#3DFF9A', opacity: f(0.4 * (1 - u)) }) + S.rect(-bw / 2 - 18 * u, -44 - 18 * u, bw + 36 * u, 84 + 36 * u, 30, { fill: 'none', stroke: '#3DFF9A', 'stroke-width': 7, opacity: f(1 - u) }), `translate(${f(x)} ${f(y)}) scale(${f(s)})`);
  }
  if (opts.ok && t > tE) o += K.accepted(x, y + 110 * s, seg(t, tE + 0.06, tE + 0.3), 0.62 * s);
  return o;
}
// ENTER key tap mark (little "ENTER!" pop)
const enterPop = (t, tE, x, y, s = 1) => (t >= tE && t < tE + 0.45 ? K.bang('ENTER!', x, y, seg(t, tE, tE + 0.12) * (1 - seg(t, tE + 0.32, tE + 0.45)), 64 * s, -8, '#3DFF9A') : '');
const bangAt = (t, txt, x, y, t0, d = 0.6, size = 120, rot = -6, col = '#FFD21F') => (t >= t0 && t < t0 + d ? K.bang(txt, x, y, seg(t, t0, t0 + 0.12) * (1 - seg(t, t0 + d - 0.15, t0 + d)), size, rot, col) : '');
// pixel scatter of the hero (teleport out / in); k 0..1
function pixels(x, y, s, k, seed = 1, inward = false) {
  if (k <= 0 || k >= 1) return '';
  const cols = ['#B84B02', '#D8262E', '#F2D04A', '#1F3B2A', '#FFFFFF', '#3DFF9A'];
  let o = '';
  for (let i = 0; i < 40; i++) {
    const bx = (hash(i * 3.1 + seed) - 0.5) * 300, by = -hash(i * 7.3 + seed) * 900;
    const u = inward ? 1 - k : k;
    const px = x + (bx + (hash(i * 5.5) - 0.5) * 600 * u) * s, py = y + (by - 500 * u * hash(i * 2.2)) * s;
    o += S.rect(px - 22 * s, py - 22 * s, 44 * s, 44 * s, 4 * s, { fill: cols[i % cols.length], stroke: LINE, 'stroke-width': 3 * s, opacity: f(1 - u * 0.8) });
  }
  return o;
}

// ================================================================= SHOTS
// ---- 1. morning: the house, the laptop glowing in your window
function sh01(t) {
  const cam = camKeys(t, [[c01, at(860, 560, 1.0)], [c02, at(640, 430, 1.32)]], ease.inOut);
  const Ly = SETS.houseExterior.layers(t, { time: 'morning' });
  const yw = SPOTS.houseExterior.yourWindow;
  let o = view(cam, Ly.bg, 0.6) + view(cam, Ly.mid + Ly.front + SETS.glowSpot(yw.x, yw.y, 170, 'setsGlowGreen', 0.75 + 0.25 * Math.sin(t * 6)), 1);
  for (let i = 0; i < 3; i++) o += view(cam, X.bird(lerp(-100, 2100, ((t - c01) * 0.18 + i * 0.13) % 1), 160 + i * 50 + Math.sin(t * 2 + i) * 10, 0.6, t, i), 0.7);
  return o;
}
// ---- 2. you + the laptop: "you start testing"
const HK = { x: 1480, y: 990, s: 0.5 };          // the hero's spot in the kitchen (in front of the fridge)
function sh02(t) {
  const cam = camKeys(t, [[c02, at(1470, 712, 1.95)], [c03, at(1475, 695, 2.2)]], ease.out);
  const tT = w(0, 'testing');
  const raise = bump(t, tT - 0.15, tT + 0.5);
  const p = { ...HK, turn: -0.15, face: fc(t > tT - 0.1 ? 'smug' : 'sneaky', t, 2, { fx: t > tT ? ['sparkles'] : [] }), armL: 28 - 4 * raise, armR: 28 - 4 * raise, lift: 18 * raise, props: [heldLaptop(t, { y: -232 - 60 * raise })] };
  let o = room(SETS.kitchen, t, { panCake: true }, cam, { chars: SETS.glowSpot(HK.x, 760, 260, 'setsGlowGreen', 0.6) + you(t, p) });
  o += cmd(t, 560, 300, ';', 0, 1e9, { t0: tT - 0.05, s: 1.45 });
  return o;
}
// ---- 3. Granny making ONE pancake, very slowly
const GR = { x: 905, y: 950, s: 0.55, view: 'side' };    // Granny at the stove, facing the pan (left)
const PAN = SPOTS.kitchen.pan;
function grannyCook(t, u, extra = {}) {
  // u 0..1 = how far the (slow) flip has got
  const p = { ...GR, armL: 128 + 10 * u, armR: 30, face: fc('sleepy', t, 5, { name: 'happy', eyes: { upper: 0.55 } }), headRot: -4, ...extra };
  const hnd = handW(p, 0.86, -1);
  const tip = [PAN.x + 10, PAN.y - 8 - 22 * u];
  const dx = tip[0] - hnd[0], dy = tip[1] - hnd[1];
  const rot = (Math.atan2(dx, -dy) * 180) / Math.PI, len = Math.hypot(dx, dy);
  const sp = X.spatula(hnd[0], hnd[1], len / 230, rot);
  const cake = X.flatCake(PAN.x, PAN.y - 6 - 22 * u, 0.9, -10 * u, 1 - 1.2 * u);
  return { svg: actor('granny', t, p, { arms: false }) + sp + cake, hand: hnd };
}
function sh03(t) {
  const cam = camKeys(t, [[c03, at(930, 620, 1.42)], [c04, at(880, 600, 1.62)]], ease.linear);
  const u = seg(t, c03, c04 + 1.5) * 0.25;
  const g = grannyCook(t, u);
  const hero = you(t, { ...HK, x: 1430, turn: -0.6, face: fc('deadpan', t, 1, { eyes: { look: [-0.9, 0.1], upper: 0.5 } }), armL: 28, armR: 28, props: [heldLaptop(t)] });
  let o = room(SETS.kitchen, t, { panCake: false }, cam, { chars: g.svg + hero });
  // the slow-motion "SLOW" ticker
  o += S.g(S.rect(-150, -40, 300, 80, 40, { fill: '#000', opacity: 0.45 }) + TF('SPEED: 0.0001x', 0, 14, 36, '#FFFFFF'), `translate(310 150) scale(${f(pop(t, c03 + 0.5, 0.3))})`);
  return o;
}
// ---- 4. "For forty minutes": close on the pan, cobweb, stopwatch
function sh04(t) {
  const cam = camKeys(t, [[c04, at(820, 560, 3.0)], [c05, at(810, 555, 3.4)]], ease.linear);
  const u = 0.25 + seg(t, c04, c05) * 0.08;
  const g = grannyCook(t, u, { face: { name: 'sleepy', blink: 0, eyes: { upper: 0.7 } } });
  let o = room(SETS.kitchen, t, { panCake: false }, cam, { chars: g.svg, over: X.cobweb(g.hand[0] - 4, g.hand[1] - 10, 0.5, seg(t, c04 + 0.2, w1(1, 'minutes'))) + X.cobweb(PAN.x - 40, PAN.y - 30, 0.4, seg(t, c04 + 0.5, w1(1, 'minutes'))) });
  const sec = 2400 * ease.inOut(seg(t, c04 + 0.05, w1(1, 'minutes')));
  o += X.stopwatch(1560, 360, 150, sec, ease.outBack(seg(t, c04, c04 + 0.25)), 8);
  o += bangAt(t, '40 MIN!', 1560, 640, w1(1, 'minutes') - 0.1, 0.8, 90, -6, '#FF5A3D');
  return o;
}
// ---- 5. ;speed Granny (whisper)
function sh05(t) {
  const cam = camKeys(t, [[c05, at(1440, 712, 2.05)], [c06, at(1430, 695, 2.3)]], ease.out);
  const ty = t < tSpeedE + 0.05;
  const p = { ...HK, turn: -0.55, ...typing(t, ty), face: t > tSpeedE ? fc('smug', t, 2) : undefined, props: [heldLaptop(t)] };
  let o = room(SETS.kitchen, t, { panCake: true }, cam, { chars: SETS.glowSpot(HK.x, 760, 260, 'setsGlowGreen', 0.6) + you(t, p, { arms: false }) });
  o += cmd(t, 560, 290, ';speed Granny', K.typeProgress(t, A[2]), tSpeedE, { s: 1.5 });
  o += enterPop(t, tSpeedE, 560, 440, 1.2);
  return o;
}
// ---- 6. SPEED: the blur, wind, pancakes everywhere
const LOOP = (u) => [930 + 560 * Math.cos(u * Math.PI * 2), 900 + 70 * Math.sin(u * Math.PI * 2)];
const nCakes = (t) => 400 * ease.inOut(seg(t, c06 + 0.25, tHundred));
function blurGranny(t, t0, opts = {}) {
  // Granny as a speeding blur running loops around the kitchen
  const age = t - t0;
  const u = age * 2.6 + 0.25;
  let o = '';
  const pts = [];
  for (let i = 0; i < 9; i++) pts.push(LOOP(u - i * 0.035));
  pts.forEach((p, i) => { pts[i] = [p[0], p[1] - 210]; });
  o += CAST.fireTrail({ pts, w: 150, t, alpha: 0.95 });
  const [gx, gy] = LOOP(u);
  const dir = -Math.sin(u * Math.PI * 2) > 0 ? 1 : -1;
  const g = (k, du) => { const [x, y] = LOOP(u - du); return S.g(actor('granny', t, { x, y, s: 0.55, view: 'side', flip: dir > 0, fast: true, lean: -14 * dir, ...AC.run(t * 40, 1.2), face: { name: 'joy' } }), null, k < 1 ? { opacity: f(k) } : undefined); };
  o += g(0.3, 0.06) + g(1, 0);
  return { svg: o, x: gx, y: gy };
}
function sh06(t) {
  const cam = camKeys(t, [[c06, at(960, 540, 1.25)], [c06 + 0.25, at(960, 520, 1.05)], [c07, at(990, 500, 1.0)]], ease.out);
  shakeAll(cam, t, [[c06, 0.35, 22], [c06 + 0.3, 1.6, 8]]);
  const go = t > c06 + 0.22;
  let chars = '';
  if (!go) {
    const sq = popStretch(t, c06 + 0.1, 0.35);
    chars += grannyCook(t, 0.3, { face: { name: 'shocked' }, ...sq, fast: t > c06 + 0.12 }).svg;
  } else chars += blurGranny(t, c06 + 0.22).svg;
  // pancakes flying from the pan to the stack
  const n = nCakes(t), top = SPOTS.kitchen.stack.top(n);
  if (go) for (let i = 0; i < 5; i++) {
    const ph = ((t - c06) * 3.2 + i / 5) % 1;
    chars += X.flatCake(lerp(PAN.x, SPOTS.kitchen.stack.x, ph), lerp(PAN.y, top, ph) - Math.sin(ph * Math.PI) * 260, 0.9, ph * 720 + i * 40, Math.cos(ph * 9));
  }
  chars += you(t, { ...HK, x: 1560, face: { name: 'shocked' }, lean: -6, armL: 28, armR: 28, props: [heldLaptop(t)] }, { arms: false });
  let o = room(SETS.kitchen, t, { pancakes: n, wind: go ? 1 : 0, panCake: false }, cam, { chars, over: K.commandBurst(GR.x - 30, 760, t - tSpeedE, '#3DFF9A', 220) });
  o += bangAt(t, 'WHOOSH!', 520, 230, c06 + 0.3, 1.2, 130, -8, '#FF8A1F');
  return o;
}
// ---- 7. the stack climbs to the ceiling: 400 pancakes
function sh07(t) {
  const n = nCakes(t), top = SPOTS.kitchen.stack.top(n);
  const camY = clamp(top + 120, 300, 560);
  const cam = camKeys(t, [[c07, at(1150, 560, 1.7)], [c07 + 0.05, at(1150, 560, 1.7)]]);
  cam.y = camY - 540;
  shakeAll(cam, t, [[tHundred - 0.05, 0.5, 26]]);
  let chars = '';
  for (let i = 0; i < 5; i++) {
    const ph = ((t - c06) * 3.2 + i / 5) % 1;
    chars += X.flatCake(lerp(PAN.x, SPOTS.kitchen.stack.x, ph), lerp(PAN.y, top, ph) - Math.sin(ph * Math.PI) * 220, 0.9, ph * 720 + i * 40, Math.cos(ph * 9));
  }
  // Granny's blur streaks past
  chars += CAST.fireTrail({ x: 600 + ((t - c07) * 2600) % 1600, y: top + 160, len: 700, angle: 180, w: 120, t });
  let o = room(SETS.kitchen, t, { pancakes: n, wind: 1, panCake: false }, cam, { chars });
  // counter
  const cnt = Math.round(n);
  o += S.g(S.rect(-200, -54, 400, 108, 30, ol('#141824', 7)) + T(`${cnt}`, -40, 30, 76, cnt >= 400 ? '#FFD34D' : '#FFFFFF') + X.flatCake(120, 0, 0.9, -10), `translate(300 190) scale(${f(1 + 0.25 * bump(t, tHundred - 0.05, tHundred + 0.25))})`);
  o += bangAt(t, 'CLONK!', 1300, 200, tHundred - 0.05, 0.7, 120, 8, '#FFD21F');
  return o;
}
// ---- 8. "sweetie!" — Granny close, hair blown back
function sh08(t) {
  const cam = camKeys(t, [[c08, at(930, 600, 2.6)], [c09, at(930, 590, 2.9)]], ease.out);
  const jit = Math.sin(t * 70) * 5;
  const g = actor('granny', t, { x: 930 + jit, y: 990, s: 0.55, fast: true, armL: 160, armR: 40, headRot: 6 * Math.sin(t * 9), face: { name: 'excited' } }, { arms: false });
  const hnd = handW({ x: 930 + jit, y: 990, s: 0.55, armL: 160 }, 0.86, -1);
  let o = room(SETS.kitchen, t, { pancakes: 400, wind: 0.35, panCake: false }, cam, { chars: CAST.fireTrail({ x: 1000, y: 820, len: 900, angle: 10, w: 160, t, alpha: 0.5 }) + g + X.spatula(hnd[0], hnd[1], 0.6, -20 + 10 * Math.sin(t * 30)) });
  o += K.sparkles([[600, 300, 34], [1350, 260, 26], [1300, 700, 22]], t);
  return o;
}
// ---- 9. "Want to go to the store? I'll drive!" — she zips from spot to spot with her car keys
function sh09(t) {
  const tW = w(3, 'Want'), tS = w(3, 'store'), tI = w(3, "I'll");
  const cam = camKeys(t, [[c09, at(1420, 620, 1.45)], [tI, at(1450, 640, 1.55)], [c10, at(1430, 650, 1.75)]], ease.inOut);
  const spots = [[1800, 990, 0.55], [1160, 990, 0.55], [1290, 1050, 0.66]];
  const ts = [c09, tS - 0.05, tI - 0.05];
  let i = 0;
  while (i < 2 && t >= ts[i + 1]) i++;
  const [gx, gy, gs] = spots[i];
  let chars = '';
  if (i > 0 && t < ts[i] + 0.22) {
    const [px, py] = spots[i - 1], k = seg(t, ts[i], ts[i] + 0.22);
    chars += CAST.fireTrail({ pts: [[gx, gy - 220], [lerp(gx, px, 0.5), lerp(gy, py, 0.5) - 260], [px, py - 220]], w: 150, t, alpha: 1 - k });
  }
  const sq = i > 0 ? squash(t, ts[i], 0.25) : { sx: 1, sy: 1 };
  const jingle = Math.sin(t * 30) * 18;
  const gp = { x: gx, y: gy, s: gs, fast: true, armR: 150 + jingle * 0.4, armL: 20, turn: i === 0 ? 0.2 : -0.1, face: { name: i === 2 ? 'excited' : 'joy' }, ...sq };
  const hnd = handW(gp, 0.86, 1);
  const g = actor('granny', t, gp, { arms: false }) + X.carKeys(hnd[0] + 10, hnd[1] - 20, gs * 1.1, jingle);
  const scared = t > tI;
  const hero = you(t, { ...HK, x: 1560, turn: -0.4, lean: scared ? 8 : 0, face: { name: scared ? 'scared' : 'shocked', fx: scared ? ['sweat'] : [] }, armL: 28, armR: 28, props: [heldLaptop(t)] }, { arms: false });
  let o = room(SETS.kitchen, t, { pancakes: 400, panCake: false, wind: 0.15 }, cam, { chars: (i === 2 ? hero + g : g + hero) });
  if (t > tW && t < tW + 0.5) o += bangAt(t, 'JINGLE!', 1500, 230, tW, 0.6, 90, -6, '#FFD21F');
  o += bangAt(t, 'VROOM?', 760, 260, tI + 0.05, 0.9, 110, 8, '#FF5A3D');
  return o;
}
// ---- 10. Granny behind the wheel
const CAR = { x: 1000, y: 1062, s: 0.9 };
function carDriver(t, face, fast = true) {
  // Granny (side view facing right) drawn in car-local units: her head sits in the window
  return actor('granny', t, { x: 70, y: 72, s: 0.32, turn: 0.6, fast, armL: 40, armR: 40, face, shadow: false }, { arms: false });
}
function sh10(t) {
  const cam = camKeys(t, [[c10, at(1080, 880, 1.45)], [c11, at(1060, 900, 1.7)]], ease.inOut);
  shakeAll(cam, t, [[c10, 2.5, 4]]);
  const Ly = SETS.houseExterior.layers(t, { time: 'morning' });
  const rev = 0.5 + 0.5 * Math.sin(t * 9);
  const drv = carDriver(t, { name: 'determined', mouth: 'grin' });
  let w_ = Ly.mid + Ly.front;
  w_ += X.grannyCar(CAR.x, CAR.y, CAR.s, { t, driver: drv, smoke: 0.4 + 0.4 * rev, shake: 1 });
  w_ += you(t, { x: 1560, y: 945, s: 0.3, face: { name: 'scared', fx: ['sweat'] }, turn: -0.5, armL: 28, armR: 28, props: [heldLaptop(t)] }, { arms: false });
  let o = view(cam, Ly.bg, 0.6) + view(cam, w_, 1);
  o += bangAt(t, 'VRRRM!', 640, 300, c10 + 0.2, 1.0, 110, -8, '#FF8A1F') + bangAt(t, 'VRRRRRM!!', 1300, 240, c10 + 1.0, 1.0, 120, 6, '#FF5A3D');
  return o;
}
// ---- 11. the speedometer: 900 MPH
function sh11(t) {
  const tN = w(4, 'nine'), tH = w(4, 'hour');
  const v = t < tN ? lerp(0, 120, ease.in(seg(t, c11, tN))) : lerp(120, 900, ease.inOut(seg(t, tN, tH)));
  const cam = camKeys(t, [[c11, { zoom: 1.0, x: 0, y: 0 }], [tH - 0.05, { zoom: 1.12, x: 0, y: 0 }], [tH + 0.05, { zoom: 1.45, x: 0, y: -20 }]], ease.out);
  shakeAll(cam, t, [[tN, 2, 6 + 10 * seg(t, tN, tH)], [tH, 0.6, 30]]);
  let w_ = S.rect(-400, -400, 2720, 1880, 0, { fill: '#5FB4A0' }) + S.rect(-400, 860, 2720, 600, 0, { fill: '#3E8A78' }) + S.path('M-400 860 H2320', ln(10, LINE));
  w_ += S.rect(-400, 120, 2720, 30, 0, { fill: '#C9CED8' }) + S.path('M-400 120 H2320 M-400 150 H2320', ln(5, LINE));
  w_ += X.speedo(960, 520, 330, v, t, { crack: seg(t, tH - 0.05, tH + 0.2) });
  // fuel + temp mini gauges
  for (const [gx, lab, val] of [[420, 'FUEL', 0.2], [1500, 'TEMP', 0.4 + 0.6 * seg(t, tN, tH)]]) {
    const a = (-150 + 120 * val) * Math.PI / 180;
    w_ += S.circle(gx, 560, 120, ol('#FFF8E8', 8)) + TF(lab, gx, 620, 30, '#8A90A0') + S.path(`M${gx} 560 L${f(gx + Math.cos(a) * 90)} ${f(560 + Math.sin(a) * 90)}`, ln(10, '#FF3B4E')) + S.circle(gx, 560, 14, { fill: LINE });
  }
  // steering wheel (bottom) + Granny's gloved hands
  w_ += S.path('M300 1300 Q960 760 1620 1300', ln(80, LINE)) + S.path('M300 1300 Q960 760 1620 1300', ln(60, '#2E3A5A'));
  w_ += S.circle(560, 1080, 50, ol('#FFFFFF', 6)) + S.circle(1360, 1080, 50, ol('#FFFFFF', 6));
  let o = view(cam, w_, 1);
  if (t > tH - 0.05) o += zoomLines(960, 520, 1 - seg(t, tH + 0.4, tH + 0.9), '#FFFFFF', 24, 3);
  o += bangAt(t, '900 MPH', 960, 220, tH - 0.03, 1.3, 140, -6, '#FF3B4E');
  o += smash(t, tH - 0.03, 0.14, 0.7);
  return o;
}
// ---- 12. ;unspeed Granny! (panic)
const HX = { x: 1300, y: 1078, s: 0.62 };       // the hero on the street (close-ups outside)
function sh12(t) {
  const cam = camKeys(t, [[c12, at(1120, 760, 1.55)], [c13, at(1170, 760, 1.85)]], ease.out);
  shakeAll(cam, t, [[c12, 2.5, 5]]);
  const Ly = SETS.houseExterior.layers(t, { time: 'morning' });
  const e2 = w(5, 'unspeed', 1);
  let w_ = Ly.mid + Ly.front;
  w_ += X.grannyCar(CAR.x - 330, CAR.y, CAR.s, { t, driver: carDriver(t, { name: 'joy' }), smoke: 1, flames: 0.6, shake: 1.5, spin: t * 30 });
  w_ += you(t, { ...HX, turn: -0.3, ...typing(t, 1), face: { name: 'scared', fx: ['sweat2'] }, props: [heldLaptop(t)] }, { arms: false, energy: 1.6 });
  let o = view(cam, Ly.bg, 0.6) + view(cam, w_, 1);
  o += cmd(t, 1240, 230, ';unspeed Granny', K.typeProgress(t, A[5], 0, 1), w1(5, 'granny'), { s: 1.5, extraE: [e2, tUnspeedE - 0.1] });
  o += enterPop(t, w1(5, 'granny'), 1250, 390, 1) + enterPop(t, e2, 1500, 400, 1.1) + enterPop(t, tUnspeedE - 0.1, 1000, 410, 1.2);
  return o;
}
// ---- 13. the car stops dead
function sh13(t) {
  const cam = camKeys(t, [[c13, at(1060, 860, 1.22)], [c14, at(1060, 850, 1.3)]], ease.out);
  shakeAll(cam, t, [[c13 + 0.05, 0.35, 18]]);
  const Ly = SETS.houseExterior.layers(t, { time: 'morning' });
  const sq = squash(t, c13 + 0.04, 0.3, 0.8);
  const calm = t > c13 + 0.15;
  let w_ = Ly.mid + Ly.front;
  w_ += X.grannyCar(CAR.x - 120, CAR.y, CAR.s, { t, driver: carDriver(t, calm ? { name: 'happy', eyes: { upper: 0.5 } } : { name: 'joy' }, !calm), smoke: 1 - seg(t, c13, c13 + 0.6), flames: calm ? 0 : 0.6, squash: sq });
  w_ += K.commandBurst(CAR.x - 120, CAR.y - 120, t - c13, '#3DFF9A', 260);
  w_ += you(t, { x: 1560, y: 950, s: 0.32, turn: -0.4, face: { name: calm ? 'happy' : 'scream', fx: calm ? ['sweat'] : [] }, armL: 28, armR: 28, props: [heldLaptop(t)], bodyY: calm ? 10 : 0 }, { arms: false });
  let o = view(cam, Ly.bg, 0.6) + view(cam, w_, 1);
  o += bangAt(t, 'SCREEECH!', 720, 330, c13, 0.7, 120, -6, '#FFFFFF');
  o += bangAt(t, 'putt... putt...', 1000, 420, c13 + 0.55, 1.0, 64, 4, '#C9CED8');
  return o;
}

// ---- 14. "Next... the cat." — Pancake on the table, finishing a pancake
const PT = { x: 380, y: SPOTS.kitchen.table.top + 2, s: 0.5 };   // Pancake on the breakfast table
function catEating(t, extra = {}) {
  const chew = Math.floor(t * 8) % 2;
  return pancake({ ...PT, t, pose: 'sit', mood: 'lazy', mouth: chew ? 'open' : 'w', ...extra }) +
    X.flatCake(PT.x + 2, PT.y - 30, 1.15, -8 + 4 * Math.sin(t * 16), 1) + S.circle(PT.x + 54, PT.y - 40, 16, { fill: '#F7E6CC' }) + S.circle(PT.x + 38, PT.y - 46, 12, { fill: '#F7E6CC' });
}
function sh14(t) {
  const cam = camKeys(t, [[c14, at(400, 700, 2.4)], [c15, at(390, 690, 2.6)]], ease.out);
  let o = room(SETS.kitchen, t, { pancakes: 400, panCake: false }, cam, { chars: catEating(t) });
  o += bangAt(t, 'nom', 1250, 330, c14 + 0.1, 0.6, 80, 8, '#FFFFFF') + bangAt(t, 'nom', 1450, 450, c14 + 0.35, 0.5, 70, -6, '#FFFFFF');
  return o;
}
// ---- 15. ;size Pancake 10
function sh15(t) {
  const cam = camKeys(t, [[c15, at(660, 650, 1.4)], [c16, at(640, 640, 1.52)]], ease.inOut);
  const tTen = w(7, 'ten');
  const prog = (14 * K.typeProgress(t, A[7], 'Size', 'Pancake') + 2 * K.typeProgress(t, A[7], 'ten', 'ten')) / 16;
  const sus = t > w1(7, 'Pancake');
  const cat = sus ? pancake({ ...PT, t, pose: 'sit', mood: 'smug', look: [0.9, 0], blink: 0 }) : catEating(t);
  const hp = { x: 900, y: 1000, s: 0.58, turn: -0.6, ...typing(t, t < tSizeE), face: t > tTen ? fc('sneaky', t, 3) : undefined, props: [heldLaptop(t)] };
  let o = room(SETS.kitchen, t, { pancakes: 400, panCake: false }, cam, { chars: cat + you(t, hp, { arms: false }) });
  o += cmd(t, 1340, 220, ';size Pancake 10', prog, tSizeE, { s: 1.45 });
  o += enterPop(t, tSizeE, 1360, 370, 1.1);
  if (sus) o += bangAt(t, '?', 470, 330, w1(7, 'Pancake') + 0.05, 1.5, 120, 10, '#FFFFFF');
  return o;
}
// ---- 16. he grows (inside the kitchen)
function sh16(t) {
  const g = ease.inOut(seg(t, c16 + 0.1, c16 + 0.75));
  const wob = squash(t, c16 + 0.75, 0.12, 0.7, 16);
  const cs = lerp(0.5, 5.4, g);
  const cam = camKeys(t, [[c16, at(700, 620, 1.3)], [c16 + 0.7, at(900, 520, 0.92)], [c17, at(910, 520, 0.9)]], ease.out);
  shakeAll(cam, t, [[c16, 0.3, 14], [c16 + 0.6, 1.2, 22]]);
  const cx = lerp(PT.x, 930, g), cy = lerp(PT.y, 1200, g);
  let chars = pancake({ x: cx, y: cy, s: cs * wob.sy, t, pose: 'sit', mood: g < 0.5 ? 'surprised' : 'smug', look: [0, -0.2] });
  const squish = seg(t, c16 + 0.45, c16 + 0.75);
  chars += you(t, { x: 1720, y: 990, s: 0.5, sx: 1 - 0.45 * squish, sy: 1 + 0.1 * squish, face: { name: 'oof', fx: ['sweat2'] }, armL: 60, armR: 28, props: [heldLaptop(t)] }, { arms: false });
  const over = K.commandBurst(PT.x, PT.y - 100, t - tSizeE, '#3DFF9A', 220);
  let o = room(SETS.kitchen, t, { pancakes: 400, panCake: false }, cam, { chars, over });
  // ceiling cracks once his ears hit it
  const crack = seg(t, c16 + 0.55, c16 + 0.8);
  if (crack > 0) o += view(cam, S.path(`M700 80 l${f(-80 * crack)} ${f(60 * crack)} l-40 30 M700 80 l${f(90 * crack)} ${f(40 * crack)} l30 50 M1180 80 l${f(-60 * crack)} ${f(70 * crack)} M1180 80 l${f(70 * crack)} ${f(40 * crack)}`, ln(8, LINE)), 1);
  o += bangAt(t, 'BOING!', 520, 240, c16 + 0.15, 0.6, 120, -8, '#3DFF9A') + bangAt(t, 'CRUNCH!', 1350, 200, c16 + 0.6, 0.9, 120, 8, '#FFD21F');
  return o;
}
// ---- 17. exterior: the house rides on his back — MEOW
const GC = { x: 760, y: 965 };                   // the giant cat's ground spot (under the house)
const catSize = (t) => lerp(1.6, 3.0, ease.outBack(seg(t, c17 - 0.1, c17 + 0.35)));
function giant(t, extra = {}) {
  // the giant Pancake (walk pose, faces left) carrying the house; returns svg
  const cs = extra.s || catSize(t);
  const backTop = GC.y - 147 * cs;
  const tilt = (extra.tilt || 0) + 4 + Math.sin(t * 1.6) * 2;
  let o = pancake({ x: GC.x + 60, y: GC.y, s: cs, t: c17 + (t - c17) * 0.15, pose: 'walk', mood: extra.mood || 'smug', mouth: extra.mouth, blink: extra.blink || 0, look: extra.look || [-0.2, 0.2] });
  o += SETS.house(GC.x + 40, backTop + 70, 0.85, { uprooted: 1, tilt, notes: true });
  return o;
}
function headPos(cs) { return [GC.x + 60 - 196 * cs, GC.y - 120 * cs]; }
function sh17(t) {
  const cam = camKeys(t, [[c17, at(860, 520, 0.8)], [tMeow, at(820, 470, 0.86)], [c18, at(800, 480, 0.8)]], ease.out);
  shakeAll(cam, t, [[c17, 0.5, 18], [tMeow, 1.0, 46]]);
  const Ly = SETS.houseExterior.layers(t, { house: false, lift: 1 });
  const meow = t > tMeow - 0.03 && t < tMeow + 0.75;
  const cs = catSize(t);
  let w_ = Ly.mid + giant(t, { mouth: meow ? 'meow' : undefined, mood: meow ? 'happy' : 'smug' });
  // the meow shock rings
  if (t > tMeow) {
    const [hx, hy] = headPos(cs);
    for (let i = 0; i < 3; i++) {
      const u = seg(t, tMeow + i * 0.12, tMeow + 0.7 + i * 0.12);
      if (u > 0 && u < 1) w_ += S.circle(hx, hy, 120 + 1300 * u, { fill: 'none', stroke: '#FFFFFF', 'stroke-width': f(30 * (1 - u)), opacity: f(0.9 * (1 - u)) });
    }
  }
  const lean = t > tMeow ? -10 * Math.exp(-(t - tMeow) * 2.5) * Math.cos((t - tMeow) * 12) : 0;
  let o = S.g(view(cam, Ly.bg, 0.6) + view(cam, w_, 1), `rotate(${f(lean * 0.3)} 960 1000)`);
  for (let i = 0; i < 4; i++) if (t > tMeow) o += X.bird(300 + i * 380 + (t - tMeow) * 300, 400 - (t - tMeow) * 500 - i * 40, 0.8, t, i);
  o += bangAt(t, 'MEOW!!!', 960, 330, tMeow, 0.95, 230, -6, '#FFFFFF');
  o += bangAt(t, 'WEE-OO WEE-OO', 1500, 640, tMeow + 0.25, 0.9, 60, 6, '#FF5A5A');
  return o;
}
// ---- 18. the yawn: the whole street sways
function sh18(t) {
  const cam = camKeys(t, [[c18, at(900, 560, 0.86)], [c19, at(920, 600, 0.95)]], ease.inOut);
  const Ly = SETS.houseExterior.layers(t, { house: false, lift: 1 });
  const yawn = bump(t, c18 + 0.1, c19 - 0.05);
  const sway = Math.sin((t - c18) * 4.2) * 6 * yawn;
  let w_ = Ly.mid + giant(t, { s: 3.0, mouth: yawn > 0.25 ? 'o' : undefined, blink: yawn > 0.25 ? 1 : 0, mood: 'lazy', tilt: sway * 1.4 });
  w_ += you(t, { x: 1420, y: 950, s: 0.32, turn: -0.5, rot: -sway * 0.8, face: { name: 'scared', eyes: { look: [-0.6, -0.8] }, fx: ['sweat'] }, armL: 28, armR: 28, props: [heldLaptop(t)] }, { arms: false });
  let o = S.g(view(cam, Ly.bg, 0.6) + view(cam, w_, 1), `rotate(${f(sway)} 900 1150)`);
  o += bangAt(t, 'Y A W N', 600, 250, c18 + 0.2, 1.1, 120, -4, '#FFFFFF');
  o += bangAt(t, 'CREEEAK', 1450, 300, c18 + 0.55, 0.8, 80, 8, '#C9CED8');
  return o;
}
// ---- 19. ;size Pancake 1! ONE!
function sh19(t) {
  const cam = camKeys(t, [[c19, at(1150, 720, 1.5)], [c20, at(1180, 740, 1.7)]], ease.out);
  shakeAll(cam, t, [[c19, 2, 6]]);
  const Ly = SETS.houseExterior.layers(t, { house: false, lift: 1 });
  let w_ = Ly.mid + giant(t, { s: 3.0, mood: 'smug' });
  w_ += you(t, { ...HX, turn: -0.3, ...typing(t, 1), face: { name: 'scared', fx: ['sweat2'] }, props: [heldLaptop(t)] }, { arms: false, energy: 1.6 });
  let o = view(cam, Ly.bg, 0.6) + view(cam, w_, 1);
  o += cmd(t, 1240, 230, ';size Pancake 1', K.typeProgress(t, A[9], 'Size', 'ONE'), tOneE, { s: 1.5, extraE: [w(9, 'ONE', 1)] });
  o += enterPop(t, tOneE, 1300, 390, 1.2);
  return o;
}
// ---- 20. poof — normal size; the house drops back into its hole
function sh20(t) {
  const cam = camKeys(t, [[c20, at(860, 560, 0.86)], [c21, at(860, 560, 0.9)]], ease.out);
  const tThud = c20 + 0.36;
  shakeAll(cam, t, [[tThud, 0.45, 34]]);
  const Ly = SETS.houseExterior.layers(t, { house: false, lift: 1 });
  const sh = ease.in(seg(t, c20, c20 + 0.18));
  const cs = lerp(3.0, 0.32, sh);
  const fall = ease.in(seg(t, c20 + 0.12, tThud));
  const hy = lerp(GC.y - 147 * 3.0 + 70, 800, fall);
  const sq = squash(t, tThud, 0.16, 0.6, 20);
  let w_ = Ly.mid;
  w_ += pancake({ x: GC.x + 260, y: 960, s: cs, t, pose: sh < 1 ? 'walk' : 'sit', mood: sh < 1 ? 'surprised' : 'lazy' });
  w_ += S.g(SETS.house(760, hy, 0.85, { uprooted: 1 - fall, tilt: 4 * (1 - fall) }), `translate(760 800) scale(${f(sq.sx)} ${f(sq.sy)}) translate(-760 -800)`);
  w_ += K.commandBurst(GC.x - 200, GC.y - 300, t - tOneE, '#3DFF9A', 300);
  if (t > tThud) w_ += C.dust(400, 790, tThud, t) + C.dust(980, 790, tThud + 0.03, t);
  let o = view(cam, Ly.bg, 0.6) + view(cam, w_, 1);
  o += bangAt(t, 'POOF!', 1300, 380, c20 + 0.02, 0.5, 110, 8, '#FFFFFF') + bangAt(t, 'THUD!', 760, 260, tThud, 0.5, 170, -6, '#FFD21F');
  return o;
}
// ---- 21. the couch: "Then you got hungry" — Pancake flops onto the keyboard
const SEAT = { ...SPOTS.livingRoom.couch.seats[1], s: 0.5 };   // you, slouched on the couch
const LAP = { x: SEAT.x + 6, y: 792, s: 0.3 };                  // the laptop on your lap
function couchHero(t, opts = {}) {
  // returns { behind (the hero, before layers.front), chars (laptop + cat, after layers.front) }
  let behind = '', chars = '';
  if (opts.hero !== false) behind += you(t, { ...SEAT, bodyY: 14, lean: -3, headRot: opts.headRot ?? -5, turn: opts.turn || 0, armL: 16, armR: opts.armR ?? 18, face: opts.face || fc('deadpan', t, 4, { eyes: { upper: 0.5, look: [0, 0.5] } }) }, { arms: false, energy: 0.4 });
  const ly = LAP.y + (opts.lapDrop || 0);
  if (opts.laptop !== false) chars += SETS.laptop(LAP.x, ly, LAP.s, SETS.adminScreen(t, { lines: opts.lines, typed: opts.typed || '' }), { t, dust: 0, glow: 0.6 });
  if (opts.cat) chars += pancake({ x: LAP.x + (opts.catDx || 0), y: ly - 18 - (opts.catLift || 0), s: 0.34 * (opts.catSy || 1), t, pose: 'loaf', keyboard: false, mood: opts.catMood || 'lazy', blink: opts.catBlink || 0 });
  return { behind, chars };
}
function sh21(t) {
  const cam = camKeys(t, [[c21, at(1030, 640, 1.75)], [c22, at(1035, 630, 1.95)]], ease.out);
  const drop = seg(t, c21, c21 + 0.28);
  const land = c21 + 0.28;
  const sq = squash(t, land, 0.3, 0.6);
  const tH = w(10, 'hungry');
  const growl = bump(t, tH - 0.05, tH + 0.6);
  const ch = couchHero(t, { cat: true, catLift: 600 * (1 - ease.in(drop)), catSy: sq.sy, catMood: drop < 1 ? 'surprised' : 'lazy', face: growl > 0.2 ? { name: 'sad', eyes: { look: [0, 0.8] }, fx: ['sweat'] } : t > land ? { name: 'oof' } : undefined, lapDrop: 10 * bump(t, land, land + 0.2) });
  let o = room(SETS.livingRoom, t, { call: false }, cam, ch);
  if (growl > 0) o += view(cam, S.path(`M1090 ${f(735)} q14 -12 28 0 t28 0 t28 0 M1094 755 q14 -12 28 0 t28 0`, ln(5, LINE, growl)), 1);
  o += bangAt(t, 'FLOMP', 700, 300, land, 0.6, 100, -6, '#FFFFFF');
  o += bangAt(t, 'GRRRUMBLE', 1420, 330, tH - 0.05, 0.9, 84, 6, '#FFD21F');
  return o;
}
// ---- 22. but the fridge was SO far away — down the endless hallway
function sh22(t) {
  const tF = w(10, 'fridge'), tSo = w(10, 'SO');
  const ff = SPOTS.livingRoom.fridgeFar;
  const cam = camKeys(t, [[c22, at(1300, 600, 1.3)], [tF - 0.1, at(1480, 560, 1.5)], [tF + 0.15, at(ff.x, ff.y + 30, 3.4)], [tSo, at(ff.x, ff.y + 10, 4.2)], [c23, at(ff.x, ff.y, 6.2)]], ease.inOut);
  const look = t > tF - 0.3;
  const ch = couchHero(t, { cat: true, turn: 0.55, headRot: 2, face: { name: look ? 'sad' : 'deadpan', eyes: { look: [1, -0.2], upper: 0.35 } } });
  let o = room(SETS.livingRoom, t, { call: false }, cam, ch);
  const k = seg(t, tSo - 0.1, tSo + 0.2);
  if (k > 0) {
    const [sx, sy] = toS(cam, ff.x, ff.y - 26);
    o += S.g(S.path('M0 -40 L0 -110', ln(10, LINE)) + S.rect(-160, -190, 320, 90, 16, ol('#FFE45C', 7)) + T('FRIDGE: 2.4 MI', 0, -130, 40, '#2A2246') + S.path('M-20 -100 L0 -60 L20 -100', ol('#FFE45C', 6)), `translate(${f(sx)} ${f(sy)}) scale(${f(ease.outBack(k))})`);
  }
  o += zoomLines(960, 540, bump(t, tSo - 0.1, c23), '#FFFFFF', 22, 5);
  return o;
}
// ---- 23. ;tp me to the fridge (lazy) — and he's gone
function sh23(t) {
  const cam = camKeys(t, [[c23, at(1030, 600, 2.0)], [c24, at(1030, 590, 2.2)]], ease.out);
  const gone = t > tTpE + 0.05;
  const out = seg(t, tTpE, tTpE + 0.3);
  const typed = ';tp me to the fridge'.slice(0, Math.round(K.typeProgress(t, A[11]) * 20));
  const ch = couchHero(t, {
    hero: !gone, cat: true, typed, armR: gone ? 18 : 22 + 6 * Math.sin(t * 16), catMood: gone ? 'surprised' : 'lazy', catBlink: gone ? 0 : 0.5,
    lapDrop: gone ? 30 * ease.outBack(seg(t, tTpE + 0.05, tTpE + 0.3)) : 0,
    lines: gone ? [';tp me to the fridge', 'Teleporting...'] : undefined,
    face: fc('sleepy', t, 4, { name: 'deadpan', eyes: { upper: 0.62, look: [0.1, 0.7] } }),
  });
  let o = room(SETS.livingRoom, t, { call: false }, cam, { ...ch, over: K.commandBurst(SEAT.x, 640, t - tTpE, '#B06BFF', 240) + pixels(SEAT.x, SEAT.y - 10, 0.42, out, 3) });
  o += cmd(t, 620, 200, ';tp me to the fridge', K.typeProgress(t, A[11]), tTpE, { s: 1.3 });
  o += bangAt(t, 'BLIP!', 1350, 300, tTpE + 0.02, 0.5, 120, 8, '#B06BFF');
  return o;
}
// ---- 24. INSIDE the fridge (the door closes, the light goes off)
function sh24(t) {
  const tDoor = c24 + 0.55;
  const dark = 0.8 * seg(t, tDoor, tDoor + 0.08);
  const cam = camKeys(t, [[c24, at(960, 640, 1.15)], [tDoor, at(960, 660, 1.25)], [c25, at(960, 700, 1.45)]], ease.out);
  shakeAll(cam, t, [[tDoor, 0.3, 16]]);
  const Ly = SETS.fridgeInside.layers(t, { dark, cake: 0 });
  const H0 = SPOTS.fridgeInside.hero;
  const inK = seg(t, c24, c24 + 0.2);
  const ps = popStretch(t, c24 + 0.2, 0.3);
  let chars = '';
  if (inK >= 1) chars += you(t, { ...H0, ...ps, armL: 12, armR: 12, face: t < tDoor ? { name: 'confused', eyes: { look: [Math.sin(t * 5), 0] } } : undefined }, { arms: false, energy: 0.5 });
  chars += pixels(H0.x, H0.y, 0.5, inK, 5, true);
  let o = view(cam, Ly.mid + chars + Ly.front + Ly.light, 1);
  if (dark > 0.5) o += view(cam, S.path('M1748 80 L1748 980', ln(6, '#BFEFFF', 0.8)), 1);
  o += bangAt(t, 'SLAM!', 1500, 260, tDoor, 0.6, 120, 8, '#FFFFFF');
  if (t < tDoor) o += K.sparkles([[700, 500, 30], [1220, 420, 24], [960, 300, 20]], t);
  return o;
}
// ---- 25. the closed fridge: muffled... then chewing
function sh25(t) {
  const cam = camKeys(t, [[c25, at(1470, 450, 1.18)], [c26, at(1480, 440, 1.32)]], ease.linear);
  const wd = A[12].words.filter((x) => x[1] >= c25 - 0.05);
  let wob = 0;
  for (const x of wd) wob += bump(t, x[1], x[1] + 0.25);
  const chews = [A[12].b + 0.15, A[12].b + 0.45, A[12].b + 0.75];
  for (const c of chews) wob += 0.6 * bump(t, c, c + 0.2);
  cam.sx = Math.sin(t * 50) * 3 * wob;
  // Pancake wanders in and stares at the fridge
  // Pancake on top of the fridge, peering down at the noises
  const nomK = t > A[12].b + 0.1;
  const peer = ease.inOut(seg(t, A[12].b + 0.05, A[12].b + 0.4));
  const cat = pancake({ x: 1440, y: SPOTS.kitchen.fridge.top + 4, s: 0.44, t, pose: nomK ? 'paw' : 'loaf', keyboard: false, mood: nomK ? 'surprised' : 'lazy', look: [-0.3, 0.9], rot: -12 * peer, blink: nomK ? 0 : 0.6 });
  let o = room(SETS.kitchen, t, { pancakes: 400, panCake: false }, cam, { chars: cat });
  // muffled speech squiggles leaking out of the door seal
  const sp = K.V.talking('YOU', t);
  if (sp) {
    const j = Math.sin(t * 30) * 6;
    o += view(cam, S.path(`M1660 ${380 + j} q30 -20 60 0 q30 20 60 0 M1664 ${460 - j} q36 -24 72 0 q36 24 72 0 M1660 ${540 + j} q30 -20 60 0 q30 20 60 0`, ln(9, LINE, 0.75)), 1);
  }
  chews.forEach((c, i) => { o += bangAt(t, i === 2 ? 'NOM NOM' : 'nom', [1250, 1650, 1450][i], [300, 360, 200][i], c, 0.55, [70, 80, 100][i], [-8, 8, -4][i], '#FFB3CF'); });
  // crumbs falling out of the door seal
  for (let i = 0; i < 6; i++) {
    const t0 = chews[0] + i * 0.12;
    if (t < t0) continue;
    const u = t - t0;
    o += view(cam, S.rect(1330 + hash(i) * 260 - 8 - u * 30, 800 + 900 * u * u, 14, 10, 3, ol('#F7D9A8', 3)), 1);
  }
  return o;
}

// ---- 26. "And Dad. Dad was in a very important meeting." — tie and headset... and duck pyjamas
const DADP = { x: SPOTS.livingRoom.dadChair.x, y: SPOTS.livingRoom.dadChair.feet, s: 0.5, view: 'side', legL: 90, kneeL: 90, legR: 85, kneeR: 85, bodyY: 126, armL: 62, armR: 50 };
const bossMouth = (t) => { const v = K.V.viseme('BOSS', t); return !v || v === 'X' ? 0 : v === 'A' ? 0.2 : 0.75; };
const callO = (t, o = {}) => ({ title: 'VERY Important Meeting', timer: '58:03', mouth: bossMouth(t), ...o });
function sh26(t) {
  const tImp = w(13, 'important'), tMeet = w(13, 'meeting');
  const cam = camKeys(t, [[c26, at(600, 470, 2.6)], [tImp - 0.25, at(610, 500, 2.6)], [tImp + 0.15, at(640, 760, 2.4)], [tMeet + 0.05, at(640, 770, 2.4)], [tMeet + 0.3, at(560, 560, 1.45)], [c27, at(560, 560, 1.5)]], ease.inOut);
  const nod = Math.sin(t * 5) * 3;
  const dad = actor('dad', t, { ...DADP, headRot: nod, armL: 62 + 6 * Math.sin(t * 14), face: fc('nervous', t, 7, { eyes: { look: [-1, 0.2] } }) }, { arms: false });
  let o = room(SETS.livingRoom, t, { callOpts: callO(t, { muted: 1 }) }, cam, { chars: dad });
  const k = pop(t, w(13, 'very'), 0.3);
  if (k > 0) o += S.g(S.rect(-330, -50, 660, 100, 18, ol('#2E3A5A', 6)) + S.rect(-330, -50, 26, 100, 10, { fill: '#FF3B4E' }) + TF('VERY IMPORTANT MEETING', 14, 14, 40, '#FFFFFF'), `translate(1380 180) scale(${f(k)})`);
  if (t > tImp) o += bangAt(t, 'quack', 1300, 760, tImp + 0.2, 0.7, 70, 8, '#FFE45C');
  return o;
}
// ---- 27. split: Dad leaning into the laptop | the call: "You're muted"
function sh27(t) {
  const sirs = [w(14, 'Sir'), w(14, 'Sir', 1), w(14, 'can', 1)];
  let lean = 0;
  for (const s_ of sirs) lean += 0.4 * bump(t, s_ - 0.1, s_ + 0.6);
  lean = Math.min(1, lean + 0.25 * seg(t, c27, c28));
  const cam = camKeys(t, [[c27, atS(560, 520, 2.1, 470, 540)], [c28, atS(540, 520, 2.4, 470, 540)]], ease.inOut);
  const dad = actor('dad', t, { ...DADP, lean: -12 * lean, headRot: -8 * lean, armR: 165, armL: 60 + 5 * Math.sin(t * 12) }, { arms: false, energy: 1.2 });
  const left = room(SETS.livingRoom, t, { callOpts: callO(t, { muted: 1 }) }, cam, { chars: dad });
  let mut = 0;
  for (const s_ of [A[14].a, ...sirs]) if (t >= s_) mut = seg(t, s_, s_ + 0.25);
  const right = S.rect(900, 0, 1020, 1080, 0, { fill: '#22293D' }) + SETS.videoCall(1440, 500, 860, 560, t, callO(t, { muted: mut, bossFace: 'bored' }));
  let o = split(left, right, { xTop: 960, xBot: 900, k: seg(t, c27, c27 + 0.3) });
  return o;
}
// ---- 28. you, sneaking behind the couch: ;fly Dad
function sh28(t) {
  const cam = camKeys(t, [[c28, at(1180, 620, 2.0)], [c29, at(1190, 610, 2.25)]], ease.out);
  const hp = { x: 1210, y: 905, s: 0.5, turn: -0.65, bodyY: 30, ...typing(t, t < tFlyE), face: t > tFlyE ? fc('sneaky', t, 2, { mouth: 'grin' }) : undefined, props: [heldLaptop(t)] };
  let o = room(SETS.livingRoom, t, { callOpts: callO(t, { muted: 1 }) }, cam, { behind: you(t, hp, { arms: false }) });
  o += cmd(t, 560, 230, ';fly Dad', K.typeProgress(t, A[15]), tFlyE, { s: 1.5 });
  o += enterPop(t, tFlyE, 560, 380, 1.1);
  return o;
}
// Dad's own laptop, held at his chest (front view, lid back to camera) — body-space prop
const dadLap = (open = 1) => ({ svg: S.g(S.rect(-205, -470, 410, 200, 16, ol('#C9D1DD', 7)) + S.circle(0, -372, 22, { fill: '#AEB7C4' }) + S.rect(-215, -282, 430, 18, 8, ol('#A9B1BE', 5)) + S.rect(-180, -456, 70, 10, 5, { fill: '#FFFFFF', opacity: 0.5 }), ''), layer: 'front' });
// living-room clean plate over the desk laptop (once Dad has taken it): window, wall, rail, sill, curtain, desk top
function deskPatch(t, Ly) {
  const Wn = SPOTS.livingRoom.window;
  const hole = `M${Wn.x0} ${Wn.y0} V${Wn.y1} H${Wn.x1} V${Wn.y0} Z`;
  let o = Ly.bg;
  o += S.path(`M300 380 H720 V720 H300 Z ${hole}`, { fill: 'url(#setsLRWall)', 'fill-rule': 'evenodd' }) + S.path(`M300 380 H720 V720 H300 Z ${hole}`, { fill: 'url(#setsLRLat)', 'fill-rule': 'evenodd' });
  o += S.rect(300, 600, 420, 190, 0, { fill: '#E08E66' }) + S.path('M274 622 h122 v148 h-122 Z M424 622 h122 v148 h-122 Z M574 622 h122 v148 h-122 Z', { fill: 'none', stroke: '#F2A57E', 'stroke-width': 5 });
  o += S.rect(-760, 590, 3440, 18, 4, ol('#FFF4E6', 4));
  o += S.path(`M${Wn.x0 - 22} ${Wn.y0 - 22} H${Wn.x1 + 22} V${Wn.y1 + 6} H${Wn.x0 - 22} Z ${hole}`, { fill: '#FFF8EE', 'fill-rule': 'evenodd', stroke: LINE, 'stroke-width': 6 });
  o += S.rect(Wn.x0 - 34, Wn.y1 + 2, Wn.x1 - Wn.x0 + 68, 22, 6, ol('#FFF8EE', 5));
  { const cx = Wn.x1 + 20, d = -1, bil = Math.sin(t * 1.6 + cx) * 8;
    o += S.path(`M${cx - 40} ${Wn.y0 - 44} L${cx + 40} ${Wn.y0 - 44} Q${f(cx + 30 + bil * 0.6)} ${Wn.y0 + 200} ${f(cx + 36 * d + bil)} ${Wn.y1 + 60} L${f(cx - 36 * d + bil * 0.8)} ${Wn.y1 + 66} Q${f(cx - 30 + bil * 0.3)} ${Wn.y0 + 200} ${cx - 40} ${Wn.y0 - 44} Z`, { fill: '#FFFFFF', opacity: 0.72, stroke: '#D9C6B8', 'stroke-width': 3 }); }
  o += S.rect(74, 658, 492, 14, 4, ol('#C98A52', 4)) + S.rect(70, 670, 500, 20, 5, ol('#A86B3C', 5));
  o += S.path('M276 660 l70 -6 l6 -14 l-70 6 Z', ol('#FFFFFF', 3)) + S.path('M280 646 l70 -4 l4 -12 l-70 4 Z', ol('#F4F6FF', 3));
  return X.clipRect(334, 448, 264, 236, o);
}
// ---- 29. Dad floats up out of his chair and out of the open window (clutching the laptop)
function dadFloat(t, x, y, s, extra = {}) {
  const flail = Math.sin(t * 9);
  return actor('dad', t, { x, y, s, legL: 8 + 10 * flail, legR: -6 - 10 * flail, kneeL: 30, kneeR: 20, armL: 22, armR: 22, props: [dadLap()], shadow: false, ...extra }, { arms: false, ...(extra.act || {}) });
}
function sh29(t) {
  const cam = camKeys(t, [[c29, at(560, 560, 1.4)], [c30, at(470, 470, 1.45)]], ease.inOut);
  shakeAll(cam, t, [[c29, 0.3, 12]]);
  const u = ease.inOut(seg(t, c29 + 0.15, c30 - 0.05));
  const Wn = SPOTS.livingRoom.window;
  const x = lerp(DADP.x - 30, Wn.exit.x, u), y = lerp(DADP.y - 20, 470, u) - 60 * Math.sin(u * Math.PI), s = lerp(0.5, 0.3, ease.in(u));
  const ps = popStretch(t, c29 + 0.06, 0.3);
  const dad = dadFloat(t, x, y, s, { ...ps, rot: 8 * Math.sin(t * 4), face: { name: 'scream', fx: ['sweat2'] } });
  const outside = u > 0.72;
  const Ly = SETS.livingRoom.layers(t, { callOpts: callO(t, { muted: 1 }) });
  let o = view(cam, Ly.bg + (outside ? dad : ''), 1) + view(cam, Ly.mid + deskPatch(t, Ly) + Ly.front + (outside ? '' : dad) + K.commandBurst(DADP.x - 30, 560, t - tFlyE, '#7CF7FF', 260), 1);
  o += bangAt(t, 'WHOA-OA-OA!', 1250, 250, c29 + 0.15, 1.2, 100, -6, '#7CF7FF');
  return o;
}
// ---- 30. split: the call (confused boss, Dave's tile = sky) | Dad above the tree
const DSKY = { x: 300, y: 150, s: 0.24 };      // Dad above the big front-yard tree (houseExterior)
function sh30(t) {
  const tTree = w(16, 'tree');
  const left = S.rect(-20, 0, 1000, 1080, 0, { fill: '#22293D' }) + SETS.videoCall(470, 470, 900, 600, t, callO(t, { bossFace: 'confused', selfSky: true }));
  const cam = camKeys(t, [[c30, atS(300, 230, 1.6, 1440, 560)], [tTree - 0.1, atS(300, 210, 1.75, 1440, 560)], [tTree + 0.12, atS(300, 120, 2.6, 1440, 520)], [c31, atS(300, 120, 2.7, 1440, 520)]], ease.inOut);
  const Ly = SETS.houseExterior.layers(t, { time: 'day' });
  const bob = Math.sin(t * 2) * 8;
  const dad = dadFloat(t, DSKY.x + Math.sin(t * 0.7) * 10, DSKY.y + bob, DSKY.s, { face: { name: 'scared', eyes: { look: [0, 0.8] }, fx: ['sweat'] }, rot: 4 * Math.sin(t * 1.3) });
  const birdS = X.bird(DSKY.x + 160 * Math.cos(t * 2.5), DSKY.y - 160 + 40 * Math.sin(t * 2.5), 0.45, t, 1, '#6FA8FF');
  const right = view(cam, Ly.bg, 0.6) + view(cam, Ly.mid + Ly.front + dad + birdS, 1);
  let o = split(left, right, { xTop: 1000, xBot: 920 });
  o += bangAt(t, 'TREE?!', 1500, 820, tTree, 0.8, 100, 6, '#3BD16F');
  return o;
}
// ---- 31. the sky office
function sh31(t) {
  const tWork = w(17, 'working'), tSky = w(17, 'sky');
  const cam = camKeys(t, [[c31, at(960, 560, 1.0)], [tSky - 0.1, at(960, 545, 1.06)], [tSky + 0.1, at(940, 560, 1.22)], [c32, at(940, 560, 1.26)]], ease.inOut);
  const pretend = t > tWork - 0.1;
  let w_ = X.skyPanel(t, { drift: 50 });
  w_ += SETS.tree(960, 2050, 3.2, { sway: Math.sin(t) * 2 });
  w_ += X.bird(lerp(-200, 2200, seg(t, c31, c32)), 300, 0.8, t, 0);
  const bob = Math.sin(t * 2) * 12;
  const raise = bump(t, tSky - 0.1, tSky + 0.6);
  w_ += dadFloat(t, 960, 985 + bob - 30 * raise, 0.66, {
    face: pretend ? { name: 'happy', eyes: { look: [0.6, -0.2] }, fx: ['sweat'] } : { name: 'scared', fx: ['sweat2'] },
    headRot: pretend ? 6 : 0, armL: 22 + 10 * raise, armR: 22 + 10 * raise, rot: 2 * Math.sin(t * 1.4),
  });
  let o = view(cam, w_, 1);
  const k = pop(t, tSky - 0.05, 0.3);
  if (k > 0) o += S.g(S.path('M-260 40 C-300 40 -300 -20 -250 -24 C-250 -84 -170 -96 -140 -60 C-120 -120 -10 -124 0 -64 C40 -100 130 -84 120 -30 C180 -30 190 40 140 40 Z', ol('#FFFFFF', 8)) + T('SKY OFFICE', -70, 14, 64, '#2E3A5A') + S.path('M-70 40 L-70 140', ln(10, LINE)), `translate(1500 260) scale(${f(k)}) rotate(4)`);
  return o;
}
// ---- 32. "Can you hear me now?" — a bird lands on his head
function sh32(t) {
  const cam = camKeys(t, [[c32, at(660, 360, 1.2)], [c33, at(740, 330, 1.3)]], ease.inOut);
  const Ly = SETS.houseExterior.layers(t, { time: 'day' });
  const dx = lerp(560, 760, seg(t, c32, c33)), dy = 430 + Math.sin(t * 2) * 8;
  const lean = bump(t, w(17, 'hear') - 0.2, A[17].b + 0.3);
  const ds = 0.34;
  const dad = dadFloat(t, dx, dy, ds, { lean: -8 * lean, headRot: -10 * lean, face: { name: 'happy', eyes: { look: [0, 0.6] } } });
  const land = seg(t, c32 + 0.1, c32 + 0.6);
  const top = [dx - 4, dy - 1040 * ds * 0.98 + 18 * lean];
  const bird = land < 1 ? X.bird(lerp(1200, top[0], ease.out(land)), lerp(120, top[1] - 20, ease.out(land)), 0.5, t, 2, '#6FA8FF') : X.perchBird(top[0], top[1], 0.55, t);
  let o = view(cam, Ly.bg, 0.6) + view(cam, Ly.mid + Ly.front + dad + bird, 1);
  o += bangAt(t, 'tweet', top[0] * 1.2 - 200, 220, c32 + 0.65, 0.6, 60, 8, '#FFFFFF');
  return o;
}
// ---- 33. the boss: "Yes! Perfectly!"
const VC = { x: 960, y: 510, w: 1720, h: 980 };
function bars(x, y, k, n = 5) {
  if (k <= 0) return '';
  let o = S.rect(-250, -70, 500, 140, 30, ol('#0E241A', 7));
  for (let i = 0; i < n; i++) o += S.rect(-200 + i * 36, 30 - (i + 1) * 18, 24, (i + 1) * 18, 4, { fill: '#3DFF9A' });
  o += TF('PERFECT!', 90, 18, 46, '#3DFF9A');
  return S.g(o, `translate(${f(x)} ${f(y)}) scale(${f(ease.outBack(clamp(k, 0, 1)))})`);
}
function sh33(t) {
  const tP = w(18, 'Perfectly');
  const cam = camKeys(t, [[c33, at(960, 540, 1.0)], [tP - 0.05, at(900, 520, 1.1)], [tP + 0.05, at(735, 470, 1.55)], [c34, at(735, 470, 1.62)]], ease.out);
  let o = S.rect(-50, -50, 2020, 1180, 0, { fill: '#22293D' }) + view(cam, SETS.videoCall(VC.x, VC.y, VC.w, VC.h, t, callO(t, { bossFace: 'amazed', selfSky: true })), 1);
  o += bars(1500, 220, seg(t, tP, tP + 0.3));
  o += smash(t, tP, 0.12, 0.6) + (t > tP ? zoomLines(960, 540, 1 - seg(t, tP + 0.1, tP + 0.6), '#FFFFFF', 22, 9) : '');
  o += K.confetti(t, tP + 0.05, 40, 4);
  return o;
}
// ---- 34. split: the boss in tears of joy | you, typing ;unfly Dad
const tearBoss = (t) => (w_, h_) => {
  const kb = Math.max(w_ / 400, h_ / 300);
  let tr = '';
  for (const sx of [-1, 1]) {
    tr += S.path(`M${sx * 40} -14 Q${sx * 50} 20 ${sx * 46} 60`, ln(9, '#7FD4FF'));
    for (let i = 0; i < 2; i++) { const ph = (t * 1.8 + i * 0.5) % 1; tr += S.ellipse(sx * (48 + 6 * ph), 60 + ph * 90, 7, 10, ol('#7FD4FF', 2.5)); }
  }
  return SETS.bossBust(t, { bossFace: 'amazed', mouth: bossMouth(t) })(w_, h_) + S.g(tr, `translate(0 ${f(h_ * 0.06)}) scale(${f(kb)})`);
};
function sh34(t) {
  const camL = camKeys(t, [[c34, atS(735, 470, 1.35, 480, 520)], [c35, atS(735, 460, 1.5, 480, 520)]], ease.out);
  const left = S.rect(-50, -50, 1100, 1180, 0, { fill: '#22293D' }) + view(camL, SETS.videoCall(VC.x, VC.y, VC.w, VC.h, t, callO(t, { bossFace: 'amazed', selfSky: true, boss: tearBoss(t) })), 1);
  const camR = camKeys(t, [[c34, atS(1250, 700, 1.7, 1440, 470)], [c35, atS(1250, 690, 1.9, 1440, 470)]], ease.out);
  const hp = { x: 1250, y: 990, s: 0.5, turn: -0.3, ...typing(t, t < tUnflyE), face: fc('sneaky', t, 2, { mouth: 'grin' }), props: [heldLaptop(t)] };
  const right = room(SETS.livingRoom, t, { callOpts: callO(t) }, camR, { chars: you(t, hp, { arms: false }) });
  let o = split(left, right, { xTop: 1010, xBot: 930, k: seg(t, c34, c34 + 0.25) });
  o += cmd(t, 1400, 860, ';unfly Dad', K.typeProgress(t, A[18], 'time', 'years'), tUnflyE, { s: 1.4 });
  o += enterPop(t, tUnflyE, 1660, 760, 1);
  return o;
}
// ---- 35. ...SPLOOSH: the neighbour's pool
function bigSplash(x, y, u) {
  if (u <= 0 || u >= 1) return '';
  const hgt = 380 * Math.sin(Math.min(1, u * 1.6) * Math.PI) * (1 - u * 0.4);
  let o = S.path(`M${x - 130} ${y} Q${x - 110} ${f(y - hgt * 0.6)} ${x - 60} ${f(y - hgt * 0.75)} Q${x - 30} ${f(y - hgt)} ${x} ${f(y - hgt * 0.85)} Q${x + 40} ${f(y - hgt * 1.05)} ${x + 70} ${f(y - hgt * 0.7)} Q${x + 120} ${f(y - hgt * 0.55)} ${x + 140} ${y} Z`, { fill: '#DDF6FF', stroke: LINE, 'stroke-width': 6, opacity: f(1 - u * 0.5) });
  for (let i = 0; i < 12; i++) {
    const a = -Math.PI * (0.12 + 0.76 * hash(i * 2.9)), v = 500 + 500 * hash(i * 5.3);
    const dx = Math.cos(a) * v * u, dy = Math.sin(a) * v * u + 1400 * u * u;
    o += S.circle(x + dx, y + dy, 16 * (1 - u * 0.5), ol('#BFF0FF', 4));
  }
  return o;
}
function sh35(t) {
  const P_ = SPOTS.houseExterior.pool;
  const cam = camKeys(t, [[c35, at(1420, 560, 1.0)], [tSplash - 0.05, at(1480, 620, 1.12)], [tSplash + 0.05, at(1560, 640, 1.5)], [c36, at(1560, 640, 1.56)]], ease.out);
  shakeAll(cam, t, [[tSplash, 0.4, 22]]);
  const sp = seg(t, tSplash, tSplash + 0.6);
  const Ly = SETS.houseExterior.layers(t, { splash: sp > 0 ? Math.max(0.001, sp) : 0 });
  const fall = ease.in(seg(t, c35 + 0.06, tSplash));
  let w_ = Ly.mid + Ly.front;
  if (t < tSplash) w_ += dadFloat(t, P_.splashX, lerp(470, P_.y + 10, fall), 0.3, { face: { name: 'scream' }, sy: 1 + 0.25 * fall, sx: 1 - 0.12 * fall, armL: 150, armR: 150, props: [] }) + K.commandBurst(P_.splashX, 330, t - tUnflyE, '#7CF7FF', 200);
  else {
    const up = ease.outBack(seg(t, tSplash + 0.15, tSplash + 0.4));
    if (up > 0) w_ += S.g(S.rect(-14, -10, 28, 80, 8, ol('#F2D3B8', 4)) + S.rect(-80, -104, 160, 100, 12, ol('#C9D1DD', 5)) + S.circle(0, -54, 12, { fill: '#AEB7C4' }), `translate(${P_.splashX} ${f(P_.y + 10 - 50 * up)})`);
    w_ += bigSplash(P_.splashX, P_.y, sp);
  }
  let o = view(cam, Ly.bg, 0.6) + view(cam, w_, 1);
  o += bangAt(t, 'SPLOOSH!', 1250, 280, tSplash, 0.8, 160, -6, '#7FD4FF');
  return o;
}
// ---- 36. ;god me — golden aura
const HL = { x: 1150, y: 990, s: 0.55 };        // you, standing in the living room
function aura(t, x, y, k, s = 1) {
  if (k <= 0) return '';
  return SETS.glowSpot(x, y, 380 * s * k, 'setsGlowGold', 0.95 * k) + S.g(K.rays(0, 0, 16, 420 * s, '#FFD34D', 0.32 * k, t * 30), `translate(${f(x)} ${f(y)})`);
}
function goldOutline(t, k) { return k > 0 ? { fx: ['sparkles'] } : {}; }
function sh36(t) {
  const cam = camKeys(t, [[c36, at(1150, 720, 1.8)], [tGodE, at(1150, 700, 1.9)], [tGodE + 0.1, at(1150, 660, 1.5)], [c37, at(1150, 650, 1.45)]], ease.out);
  shakeAll(cam, t, [[tGodE, 0.35, 14]]);
  const k = ease.out(seg(t, tGodE, tGodE + 0.35));
  const ps = popStretch(t, tGodE + 0.03, 0.32);
  const hp = { ...HL, ...ps, ...(k > 0 ? { armL: 40, armR: 40 } : typing(t, 1)), face: k > 0 ? { name: 'smug', fx: ['sparkles'] } : undefined, props: [heldLaptop(t)], lift: 20 * k };
  const chars = aura(t, HL.x, HL.y - 280, k) + you(t, hp, { arms: false });
  let o = room(SETS.livingRoom, t, { callOpts: callO(t) }, cam, { patch: deskPatch(t, SETS.livingRoom.layers(t, {})), chars, bgK: 1 });
  // a note flies in from the right and pings off
  const t1 = A[20].a + 0.05;
  o += view(cam, noteFly(t, t1, [1560, 640], [HL.x + 50, HL.y - 175], [900, -900], 0), 1);
  o += cmd(t, 560, 240, ';god me', K.typeProgress(t, A[19]), tGodE, { s: 1.5 });
  o += flashCol(t, tGodE, '#FFE88A', 0.22, 0.75);
  if (k > 0) o += S.g(S.rect(-180, -36, 360, 72, 36, ol('#3A2A10', 6)) + TF('GOD MODE: ON', 0, 13, 36, GOLD), `translate(1300 170) scale(${f(ease.outBack(k))})`);
  o += bangAt(t, 'PING!', 1420, 380, t1 + 0.14, 0.45, 90, 8, '#FFFFFF');
  return o;
}
// a sticky note thrown from p0 that hits p1 at t0 + 0.14 and bounces off with velocity v (or sticks: stickAt)
function noteFly(t, t0, p0, p1, v, i, stick = null) {
  const a = t - t0;
  if (a < 0) return '';
  const txt = ['MILK!', 'FEED\nCAT', 'WHY', 'NO', 'SOCKS?', 'STOP'][i % 6];
  const col = ['#FFE45C', '#FF9EC4', '#9FF0A8', '#FFE45C', '#9FE0FF', '#FFE45C'][i % 6];
  const hitT = 0.14;
  let x, y, r;
  if (a < hitT) { const u = a / hitT; x = lerp(p0[0], p1[0], u); y = lerp(p0[1], p1[1], u) - 40 * Math.sin(u * Math.PI); r = -10; }
  else if (stick && a > hitT + stick.after) { x = stick.at[0]; y = stick.at[1]; r = stick.rot || -8; }
  else { const b = a - hitT; x = p1[0] + v[0] * b; y = p1[1] + v[1] * b + 1800 * b * b; r = b * 900 + i * 30; if (stick) { const u = clamp(b / stick.after, 0, 1); x = lerp(p1[0], stick.at[0], u); y = lerp(p1[1], stick.at[1], u) - 160 * Math.sin(u * Math.PI); r = u * 360 + (stick.rot || -8); } }
  if (y > 1500) return '';
  return SETS.stickyNote(x, y, r, txt, { w: 74, col, size: 14 }) + (a >= hitT && a < hitT + 0.18 ? S.circle(p1[0], p1[1], 30 + 200 * (a - hitT), { fill: 'none', stroke: GOLD, 'stroke-width': 10, opacity: f(1 - (a - hitT) / 0.18) }) : '');
}
// ---- 37. Mom: "Why... won't my sticky notes stick?" — ping, ping, ping... and one sticks to HER
const MOMP = { x: 1480, y: 990, s: 0.52 };
function sh37(t) {
  const tS = w(20, 'sticky'), tN = w(20, 'notes'), tSt = w(20, 'stick');
  const cam = camKeys(t, [[c37, at(1290, 640, 1.35)], [tSt - 0.1, at(1300, 600, 1.6)], [c39, at(1330, 560, 1.75)]], ease.inOut);
  const throws = [c37 + 0.05, tS - 0.1, tN - 0.05, tSt - 0.3];
  let arm = 20;
  for (const th of throws) arm += 70 * bump(t, th - 0.12, th + 0.2);
  const mp = { ...MOMP, turn: -0.55, notes: true, armL: Math.min(100, arm), armR: 50 };
  const hand = handW(mp, 1.06, -1);
  const stuck = t > tSt + 0.06;
  const momFace = stuck ? { name: 'confused', eyes: { look: [0, -1] } } : undefined;
  let notes = '';
  const chest = [HL.x + 40, HL.y - 175];
  const forehead = [MOMP.x - 24, MOMP.y - 1097 * 0.52 * 0.8];
  throws.forEach((th, i) => {
    const last = i === throws.length - 1;
    notes += noteFly(t, th, hand, chest, last ? [0, 0] : [[-500, -1100], [-900, -700], [-200, -1300]][i % 3], i + 1, last ? { at: forehead, after: 0.22, rot: 6 } : null);
  });
  const k = 1;
  const hp = { ...HL, armL: 40, armR: 40, face: { name: 'smug', eyes: { look: [0.8, 0] }, fx: ['sparkles'] }, props: [heldLaptop(t)], lift: 20 + 6 * Math.sin(t * 3) };
  const chars = aura(t, HL.x, HL.y - 300, k) + you(t, hp, { arms: false }) + actor('mom', t, { ...mp, face: momFace }, { arms: false }) + notes;
  let o = room(SETS.livingRoom, t, { callOpts: callO(t) }, cam, { patch: deskPatch(t, SETS.livingRoom.layers(t, {})), chars, bgK: 1 });
  throws.slice(0, 3).forEach((th, i) => { o += bangAt(t, 'PING!', [700, 1500, 900][i], [260, 300, 220][i], th + 0.14, 0.45, 100, [8, -8, 4][i], '#FFFFFF'); });
  o += bangAt(t, 'thwap', 1560, 250, tSt + 0.06, 0.6, 90, -6, '#FFE45C');
  return o;
}

// ---- 39. split: you call Zoe | Zoe picks up
function phoneAt(t, p, Z = 1, side = 1, s = 0.13) {
  const h = handW(p, Z, side);
  return K.phone(h[0] - side * 10, h[1] + 20, s * (p.s / 0.5), side * 12, S.rect(-150, -280, 300, 560, 0, { fill: '#3DDC84' }) + T('ZOE', 0, -40, 70, '#FFFFFF') + S.circle(0, 120, 60, ol('#FF3B4E', 6)));
}
function sh39(t) {
  const tCalled = w(21, 'called'), tZoe = w(21, 'Zoe');
  const ringK = bump(t, c39, tZoe + 0.1);
  const camL = camKeys(t, [[c39, atS(1150, 640, 1.9, 480, 520)], [c40, atS(1150, 630, 2.05, 480, 520)]], ease.out);
  const hp = { ...HL, armL: 30, armR: 158, face: { name: 'excited', eyes: { look: [0.8, 0] } }, props: [], lift: 10 * (1 - seg(t, c39, c40)) };
  const left = room(SETS.livingRoom, t, { callOpts: callO(t) }, camL, { patch: deskPatch(t, SETS.livingRoom.layers(t, {})), bgK: 1, chars: aura(t, HL.x, HL.y - 300, 1 - seg(t, c39, c40)) + you(t, hp, { arms: false }) + phoneAt(t, hp) });
  const pick = t > tCalled;
  const lift_ = ease.out(seg(t, tCalled - 0.1, tCalled + 0.25));
  const zp = { x: 1450, y: 1160, s: 0.78, turn: -0.2, armL: lerp(70, 158, lift_), armR: 20, face: pick ? { name: 'confused' } : { name: 'neutral', eyes: { look: [-0.6, 0.3] } } };
  const right = X.zoeRoom(t) + actor('zoe', t, zp, { arms: false }) + S.g(phoneAt(t, zp, 0.95, -1, 0.12), pick ? '' : `rotate(${f(6 * Math.sin(t * 60))} 1300 640)`);
  let o = split(left, right, { xTop: 1000, xBot: 920, k: seg(t, c39, c39 + 0.25) });
  if (ringK > 0 && !pick) o += bangAt(t, 'RING RING!', 1500, 260, c39 + 0.05, 0.7, 90, 6, '#3DDC84');
  return o;
}
// ---- 40. "She was there in four minutes." — the stopwatch, then Zoe skids in
function sh40(t) {
  const tMin = w(21, 'minutes');
  const cam = camKeys(t, [[c40, at(1420, 660, 1.3)], [tMin, at(1440, 650, 1.38)], [c41, at(1460, 640, 1.48)]], ease.inOut);
  shakeAll(cam, t, [[tMin, 0.3, 12]]);
  const arrive = seg(t, tMin - 0.3, tMin);
  const zx = lerp(2250, 1580, ease.out(arrive));
  const pant = t > tMin;
  let zoe = '';
  if (arrive > 0) zoe = actor('zoe', t, pant ? { x: zx, y: 990, s: 0.52, lean: 14, bodyY: 18 + 8 * Math.abs(Math.sin(t * 9)), armL: 14, armR: 14, face: { name: 'nervous', fx: ['sweat', 'sweat2'] }, laptop: 'closed' } : { x: zx, y: 990, s: 0.52, view: 'side', ...AC.run(t * 30, 1.2), lean: -12, face: { name: 'determined' } }, { arms: false });
  const tap = Math.max(0, Math.sin(t * 14)) * 10;
  const hp = { x: 1180, y: 990, s: 0.52, turn: 0.55, legR: tap, armL: 40, armR: 40, face: pant ? { name: 'happy', eyes: { look: [1, 0] } } : { name: 'deadpan', eyes: { look: [1, 0], upper: 0.4 } }, props: [heldLaptop(t)] };
  let o = room(SETS.livingRoom, t, { callOpts: callO(t) }, cam, { patch: deskPatch(t, SETS.livingRoom.layers(t, {})), bgK: 1, chars: you(t, hp, { arms: false }) + zoe + (pant ? C.dust(1600, 980, tMin, t) : '') });
  const sec = 240 * ease.inOut(seg(t, c40 + 0.15, tMin));
  o += X.stopwatch(330, 330, 150, sec, ease.outBack(seg(t, c40, c40 + 0.25)), -6);
  o += bangAt(t, 'SKRRRT!', 1450, 300, tMin - 0.05, 0.7, 110, 6, '#FFFFFF');
  return o;
}
// ---- 41. Zoe, stunned, lit green by the screen
function sh41(t) {
  const cam = camKeys(t, [[c41, at(1000, 650, 2.15)], [c42, at(1000, 640, 2.4)]], ease.linear);
  const zp = { x: 1000, y: 1000, s: 0.52, armL: 14, armR: 14, face: t < w(22, 'admin') ? { name: 'shocked', eyes: { look: [0, 0.7] } } : undefined };
  const glow = SETS.glowSpot(1000, 560, 260, 'setsGlowGreen', 0.55 + 0.1 * Math.sin(t * 7));
  let code = '';
  for (let i = 0; i < 8; i++) { const ph = (t * 0.4 + i / 8) % 1; code += TF(['01', ';fly', '10', ';god', 'ADMIN', '{}', ';tp', '1'][i], 820 + hash(i * 3.3) * 360, 820 - ph * 420, 18, '#7DFFB8', { opacity: f(0.8 * Math.sin(ph * Math.PI)) }); }
  const lap = SETS.laptop(1000, 1000, 0.62, '', { back: true, glow: 0, t, dust: 0.1 });
  let o = room(SETS.livingRoom, t, { callOpts: callO(t) }, cam, { patch: deskPatch(t, SETS.livingRoom.layers(t, {})), bgK: 1, chars: actor('zoe', t, zp, { arms: false, energy: 0.6 }) + glow + code + lap });
  return o;
}
// ---- 42. the couch: "Like, a REAL one. For... real life."
const ZS = { x: 820, y: SPOTS.livingRoom.couch.seats[0].y, s: 0.5 };
const YS = { x: 1190, y: SPOTS.livingRoom.couch.seats[2].y, s: 0.5 };
function couchPair(t, opts = {}) {
  let o = actor('zoe', t, { ...ZS, turn: opts.zTurn ?? 0.55, bodyY: 10, armL: 18, armR: 30, face: opts.zFace }, { arms: false, energy: opts.zEnergy ?? 1 });
  o += you(t, { ...YS, turn: opts.yTurn ?? -0.5, bodyY: 10, lean: opts.yLean || 0, armL: opts.yArms ?? 18, armR: opts.yArms ?? 18, face: opts.yFace }, { arms: false });
  return o;
}
const TABLE_LAP = (t, extra = {}) => SETS.laptop(1010, 922, 0.34, SETS.adminScreen(t, { lines: extra.lines || ['Admin panel loaded.', 'Welcome... you.', ';god me', 'Command accepted.'] }), { t, dust: 0, glow: 0.7 });
function sh42(t) {
  const tR = w(22, 'REAL', 1);
  const cam = camKeys(t, [[c42, at(1000, 660, 1.3)], [tR - 0.06, at(990, 650, 1.4)], [tR + 0.04, at(830, 560, 2.5)], [c43, at(840, 570, 2.35)]], ease.out);
  shakeAll(cam, t, [[tR, 0.3, 10]]);
  let o = room(SETS.livingRoom, t, { callOpts: callO(t) }, cam, { patch: deskPatch(t, SETS.livingRoom.layers(t, {})), bgK: 1, behind: couchPair(t, { yFace: { name: 'nervous', eyes: { look: [-1, 0] } } }), chars: TABLE_LAP(t) });
  o += smash(t, tR, 0.12, 0.6) + (t > tR ? zoomLines(960, 540, 1 - seg(t, tR + 0.05, tR + 0.5), '#FFFFFF', 22, 11) : '');
  return o;
}
// ---- 43. Zoe explains (fast), her sticker laptop shows a game
const gameScreen = (t) => S.rect(-110, -70, 220, 140, 0, { fill: '#6FC8FF' }) + S.rect(-110, 30, 220, 40, 0, { fill: '#3BD16F' }) + X.blocky(0, 34 + Math.sin(t * 6) * 4, 0.42, '#3D8BFF', 1) + S.rect(-36, -64, 72, 22, 6, { fill: '#FFD34D' }) + TF('ADMIN', 0, -47, 15, '#3A2A10');
function sh43(t) {
  const cam = camKeys(t, [[c43, at(900, 640, 1.75)], [c44, at(930, 620, 1.95)]], ease.inOut);
  const zp = { x: 900, y: 1000, s: 0.55, turn: 0.1, laptop: 'screen', laptopScreen: gameScreen(t) };
  let o = room(SETS.livingRoom, t, { callOpts: callO(t) }, cam, { patch: deskPatch(t, SETS.livingRoom.layers(t, {})), bgK: 1, chars: actor('zoe', t, zp, { energy: 1.6 }) });
  o += bangAt(t, 'ANYTHING!', 1450, 260, w(23, 'anything'), 0.9, 100, 6, '#B98CFF');
  return o;
}
// ---- 44. Fly. Teleport. Ban people.
function sh44(t) {
  const tF = w(23, 'Fly'), tT = w(23, 'Teleport'), tB = w(23, 'Ban');
  let o = S.rect(-50, -50, 2020, 1180, 0, { fill: '#2A2246' });
  let d = '';
  for (let x = -40; x < 1960; x += 80) d += `M${x} -20 V1100 `;
  for (let y = 0; y < 1100; y += 80) d += `M-20 ${y} H1940 `;
  o += S.path(d, ln(2, '#3E3366')) + TS('ADMINS CAN:', 960, 150, 80, '#FFFFFF');
  for (const [x, t0, ic, lab, col, r] of [[400, tF, X.iconFly(t), 'FLY', '#7CF7FF', -4], [960, tT, X.iconTp(t), 'TELEPORT', '#E6B8FF', 2], [1520, tB, X.iconBan(t), 'BAN', '#FF8A8A', 5]]) {
    o += S.g(X.iconCard(0, 0, seg(t, t0 - 0.05, t0 + 0.25), ic, lab, col, r), `translate(${x} 540) scale(1.4)`);
  }
  return o;
}
// ---- 45. "the boss of the server" — a crown drops onto the server
function sh45(t) {
  const tBoss = w(23, 'boss'), tSrv = w(23, 'server');
  const cam = camKeys(t, [[c45, at(960, 560, 1.0)], [tBoss, at(1080, 560, 1.1)], [c46, at(1120, 520, 1.2)]], ease.inOut);
  shakeAll(cam, t, [[tBoss + 0.2, 0.3, 12]]);
  let w_ = S.rect(-400, -400, 2720, 1880, 0, { fill: '#18213A' }) + S.rect(-400, 900, 2720, 600, 0, { fill: '#10162A' }) + S.path('M-400 900 H2320', ln(6, '#2E3A5A'));
  for (let i = 0; i < 4; i++) w_ += X.serverRack(260 + i * 520 - (i > 1 ? 0 : 0), 900, 0.7, t + i).replace(/^/, '') ;
  w_ += S.rect(-400, -400, 2720, 1880, 0, { fill: '#18213A', opacity: 0.55 });
  w_ += X.serverRack(1260, 920, 1.2, t, seg(t, tBoss - 0.25, tBoss + 0.05) + (t > tBoss + 0.05 ? 1 : 0));
  w_ += actor('zoe', t, { x: 560, y: 1000, s: 0.55, turn: 0.4, armR: 95, armL: 14, face: t > tBoss ? { name: 'deadpan' } : undefined }, { arms: false });
  let o = view(cam, w_, 1);
  if (t > tBoss) o += K.sparkles([[1250, 260, 40], [1420, 330, 30], [1080, 330, 26]], t);
  o += bangAt(t, 'BOSS', 1600, 200, tBoss + 0.05, 1.0, 110, 8, GOLD);
  return o;
}
// ---- 46. "So I'm the boss... of real life?"
function crownOver(x, y, s, k, t) {
  if (k <= 0) return '';
  return S.g(K.rays(0, 0, 14, 260, '#FFE88A', 0.35, t * 40) + S.path('M-110 40 L-120 -60 L-60 -10 L0 -90 L60 -10 L120 -60 L110 40 Z', ol(GOLD, 8)) + S.rect(-118, 30, 236, 40, 10, ol('#E8B400', 6)) + TF('ADMIN', 0, 62, 30, '#3A2A10'), `translate(${f(x)} ${f(y)}) scale(${f(s * ease.outBack(clamp(k, 0, 1)))}) rotate(${f(-8 + 4 * Math.sin(t * 3))})`);
}
function sh46(t) {
  const tReal = w(24, 'real'), tLife = w(24, 'life');
  const cam = camKeys(t, [[c46, at(1150, 700, 1.7)], [tReal, at(1150, 640, 1.95)], [tLife + 0.05, at(1150, 590, 2.35)], [c47, at(1150, 590, 2.42)]], ease.out);
  const dream = seg(t, tReal - 0.05, tReal + 0.25);
  const hp = { ...HL, armL: 28, armR: 28, face: dream > 0 ? { name: 'excited', fx: ['sparkles'] } : { name: 'confused', eyes: { look: [0.6, -0.6] } }, props: [heldLaptop(t)], lift: 10 * dream };
  let o = room(SETS.livingRoom, t, { callOpts: callO(t) }, cam, { patch: deskPatch(t, SETS.livingRoom.layers(t, {})), bgK: 1, chars: aura(t, HL.x, HL.y - 320, 0.8 * dream) + you(t, hp, { arms: false }) + crownOver(HL.x, HL.y - 545 - 12 * Math.sin(t * 3), 0.36, dream, t) });
  o += smash(t, tLife, 0.12, 0.5);
  return o;
}
// ---- 47. Zoe: "Listen to me. Admin panels have logs." (over your shoulder)
function sh47(t) {
  const tLogs = w(25, 'logs');
  const cam = camKeys(t, [[c47, at(1000, 640, 1.6)], [tLogs - 0.06, at(1050, 610, 1.75)], [tLogs + 0.04, at(1120, 560, 2.4)], [c48, at(1120, 560, 2.45)]], ease.out);
  const zp = { x: 1180, y: 1000, s: 0.52, turn: -0.3, armR: 14, armL: t > w(25, 'Listen') && t < tLogs ? 90 : 20, face: { name: 'determined', eyes: { look: [-0.6, 0] } } };
  const hero = you(t, { x: 640, y: 1260, s: 0.62, view: 'back', armL: 20, armR: 20 }, { arms: false });
  let o = room(SETS.livingRoom, t, { callOpts: callO(t) }, cam, { patch: deskPatch(t, SETS.livingRoom.layers(t, {})), bgK: 1, chars: actor('zoe', t, zp, { arms: false, energy: 1.2 }) + hero });
  o += bangAt(t, 'LOGS.', 1450, 230, tLogs + 0.05, 0.9, 110, -4, '#FF5A5A');
  return o;
}
// ---- 48. every command gets saved
const LOGROWS = [';speed Granny', ';unspeed Granny', ';size Pancake 10', ';size Pancake 1', ';tp me to the fridge', ';fly Dad', ';unfly Dad', ';god me'];
function sh48(t) {
  const tSaved = w(25, 'saved'), tGets = w(25, 'gets');
  const rows = LOGROWS.map((r, i) => [r, c48 + 0.05 + i * (tGets - c48) / 8, tSaved + i * 0.06]);
  const cam = camKeys(t, [[c48, { zoom: 1.0, x: 0, y: 0 }], [c49, { zoom: 1.06, x: 20, y: 25 }]], ease.linear);
  return view(cam, X.logScreen(t, rows), 1);
}
// ---- 49. "Somebody, somewhere... can see what you type." — the webcam light
function sh49(t) {
  const tSee = w(25, 'see'), tType = w(25, 'type');
  const led = seg(t, tSee - 0.05, tSee + 0.1);
  const cam = camKeys(t, [[c49, at(960, 600, 1.0)], [tType - 0.1, at(1000, 620, 1.25)], [tType + 0.1, at(1180, 640, 2.2)], [c50, at(1190, 640, 2.3)]], ease.inOut);
  let o = view(cam, X.webcam(t, led), 1);
  o += S.rect(-50, -50, 2020, 1180, 0, { fill: '#05070F', opacity: f(0.25 * (1 - led)) });
  return o;
}
// ---- 50. "Relax. What could possibly go wrong?" — Pancake on the keyboard (again)
function sh50(t) {
  const cam = camKeys(t, [[c50, at(1000, 660, 1.35)], [c51, at(1040, 640, 1.55)]], ease.linear);
  const relax = seg(t, c50, w(26, 'Relax') + 0.3);
  const behind = couchPair(t, { yArms: lerp(18, 168, ease.out(relax)), yLean: -6 * relax, yTurn: -0.1, yFace: { name: 'smug' }, zTurn: 0.6, zEnergy: 0.3, zFace: { name: 'deadpan', eyes: { look: [1, 0], upper: 0.55 } } });
  const cat = pancake({ x: 1010, y: 904, s: 0.34, t, pose: 'loaf', keyboard: false, mood: 'smug' });
  let o = room(SETS.livingRoom, t, { callOpts: callO(t) }, cam, { patch: deskPatch(t, SETS.livingRoom.layers(t, {})), bgK: 1, behind, chars: TABLE_LAP(t, { lines: ['Admin panel loaded.', ';god me', 'Command accepted.', 'jjjjjjjjjjjj'] }) + cat });
  return o;
}
// ---- 51. "Famous last words." — the house at dusk, thunder
function sh51(t) {
  const tW = w(27, 'words');
  const cam = camKeys(t, [[c51, at(700, 470, 1.5)], [END, at(900, 520, 0.95)]], ease.inOut);
  shakeAll(cam, t, [[tW + 0.05, 0.6, 12]]);
  const Ly = SETS.houseExterior.layers(t, { time: 'evening' });
  let o = view(cam, Ly.bg, 0.6) + view(cam, Ly.mid + Ly.front, 1) + view(cam, Ly.light, 1);
  const dk = seg(t, c51, END);
  o += S.rect(-50, -50, 2020, 1180, 0, { fill: 'url(#s04Storm)', opacity: f(0.35 + 0.5 * dk) });
  if (t > tW && t < tW + 0.35) o += S.path('M1380 -20 L1300 180 L1360 190 L1250 420 L1330 430 L1200 700', { fill: 'none', stroke: '#FFFFFF', 'stroke-width': 14, 'stroke-linejoin': 'round', opacity: f(1 - seg(t, tW, tW + 0.35)) });
  o += smash(t, tW, 0.16, 0.85);
  o += S.rect(-50, -50, 2020, 1180, 0, { fill: '#05030F', opacity: f(seg(t, END - 0.4, END)) });
  return o;
}

// ================================================================= router
const SHOTS = [
  [c01, sh01], [c02, sh02], [c03, sh03], [c04, sh04], [c05, sh05], [c06, sh06], [c07, sh07], [c08, sh08], [c09, sh09], [c10, sh10],
  [c11, sh11], [c12, sh12], [c13, sh13], [c14, sh14], [c15, sh15], [c16, sh16], [c17, sh17], [c18, sh18], [c19, sh19], [c20, sh20],
  [c21, sh21], [c22, sh22], [c23, sh23], [c24, sh24], [c25, sh25], [c26, sh26], [c27, sh27], [c28, sh28], [c29, sh29], [c30, sh30],
  [c31, sh31], [c32, sh32], [c33, sh33], [c34, sh34], [c35, sh35], [c36, sh36], [c37, sh37], [c39, sh39], [c40, sh40],
  [c41, sh41], [c42, sh42], [c43, sh43], [c44, sh44], [c45, sh45], [c46, sh46], [c47, sh47], [c48, sh48], [c49, sh49], [c50, sh50],
  [c51, sh51],
];
const WHIPS = [[c03, 1], [c10, -1], [c14, 1], [c21, -1], [c26, 1], [c36, -1], [c39, 1], [c44, -1], [c45, 1]];
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
  if (t >= c49 && t < c50) return { grade: 'cool', vignette: 1 };
  if (t >= c51) return { grade: 'cool', vignette: 1 };
  if (t >= c48 && t < c49) return { grade: null, vignette: 0.8 };
  if (t >= c44 && t < c46) return { grade: null, vignette: 0.6 };
  if (t >= c11 && t < c12) return { grade: null, vignette: 0.5 };
  return { grade: 'warm', vignette: 0.6 };
}
const DEFS = `<defs><linearGradient id="s04Storm" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1A0F3A" stop-opacity="0.95"/><stop offset="0.55" stop-color="#2A1A5A" stop-opacity="0.45"/><stop offset="1" stop-color="#2A1A5A" stop-opacity="0.1"/></linearGradient></defs>`;
module.exports = { scene, look, DEFS, SHOTS };
