// SC 11 · ПОСЛЕ — the next normal morning (mostly: the bathtub guy still drifts by). Gym: picked last... but Brick is
// captain now and picks YOU first. Dad: "Can you hear me now? ...I miss the sky office." Granny is still fast (pancakes,
// the bus stop, walking to the store faster than the car). Zoe checks the monitor: the password note faces the window —
// "now it says 'nice try.'" Pancake plops on the old laptop: ";size pancake 2" types itself, "Command accepted",
// "...PANCAKE." — the panel kept one admin: Pancake, a bit bigger, in a tiny golden ADMIN crown (slow push-in).
'use strict';

const K = require('./kit');
const { S, f, clamp, lerp, ease, seg, bump, hash, ol, ln, T, TF, camKeys, view, actor } = K;
const { L } = K.V;
const AC = require('./acting');
const SETS = require('./sets');
const X = require('./s05_env');
const { faceAt, tf, pop, at, shakeAll, clipTo, whip, smash, zoomLines, cmd, hero, smoke, dustPuff, bubble, bang } = X;
const { pancake } = require('../rig/cats');
const { fireTrail } = require('../rig/cast');

const A = Array.from({ length: 11 }, (_, i) => L('11.' + i));
const T0 = K.V.scene('SC 11').start;
const w = (i, word, n = 0) => A[i].word(word, n).t0;
const w1 = (i, word, n = 0) => A[i].word(word, n).t1;
const LINE_ = '#151515';
const kid = (i, pose) => K.draw.kid(i, { shade: true, shadow: true, ...pose });
const breathe = (t, ph = 0) => ({ bodyY: 3 + 3 * Math.sin(t * 4.2 + ph) });
function boing(t, t0, amp = 0.25, dur = 0.7) {
  const k = t - t0;
  if (k < 0 || k > dur) return { sx: 1, sy: 1 };
  const v = amp * Math.exp(-k * 7) * Math.cos(k * 20);
  return { sx: 1 - v * 0.6, sy: 1 + v };
}
const room = (Lr, cam, behind, chars, kbg = 0.92) => view(cam, Lr.bg, kbg) + view(cam, Lr.mid + behind + Lr.front + chars + (Lr.fg || '') + (Lr.light || ''), 1);

// ---------------------------------------------------------------- cuts
const CUT = {};
CUT.morning = T0;
CUT.pick = A[1].a - 0.1;
CUT.brick = w(1, 'Except') - 0.1;
CUT.point = w(1, 'And') - 0.12;
CUT.dad = A[2].a - 0.1;
CUT.sky = w(2, 'I') - 0.1;
CUT.granny = A[3].a - 0.1;
CUT.bus = w(3, "She's") - 0.12;
CUT.walk = w(3, 'She', 1) - 0.1;
CUT.zoe = A[4].a - 0.12;
CUT.zoe2 = A[5].a - 0.1;
CUT.you = A[6].a - 0.12;
CUT.cat = A[7].a - 0.12;
CUT.type = w(7, 'But') - 0.12;
CUT.accept = A[8].a - 0.05;
CUT.gasp = A[9].a - 0.1;
CUT.panel = A[10].a - 0.1;
CUT.crown = w(10, 'It') - 0.12;
{
  const ks = Object.keys(CUT);
  for (let i = 1; i < ks.length; i++) if (CUT[ks[i]] < CUT[ks[i - 1]] + 0.2) CUT[ks[i]] = CUT[ks[i - 1]] + 0.2;
}
const tEnter = A[7].b + 0.05;
const tAdmin = w(10, 'admin');

// ================================================================= SHOTS
// ---- 1. a normal morning... "Mostly." (tilt up: the bathtub guy is still floating)
function birds(t, x, y, s = 1) {
  let d = '';
  for (let i = 0; i < 3; i++) {
    const bx = x + i * 70 * s + ((t * 60) % 4000), by = y + Math.sin(t * 2 + i) * 10 + i * 18 * s, fl = Math.sin(t * 14 + i * 2) * 10 * s;
    d += `M${f(bx - 22 * s)} ${f(by - fl)} Q${f(bx - 10 * s)} ${f(by - 10 * s)} ${f(bx)} ${f(by)} Q${f(bx + 10 * s)} ${f(by - 10 * s)} ${f(bx + 22 * s)} ${f(by - fl)} `;
  }
  return S.path(d, ln(5 * s, LINE_));
}
function shMorning(t) {
  const Lh = SETS.houseExterior.layers(t, { time: 'morning' });
  const tMostly = w(0, 'Mostly');
  const cam = camKeys(t, [[CUT.morning, { zoom: 1.12, x: 0, y: 40 }], [tMostly - 0.15, { zoom: 1.2, x: 20, y: 40 }], [tMostly + 0.3, { zoom: 1.16, x: 60, y: -330 }], [CUT.pick, { zoom: 1.18, x: 80, y: -340 }]]);
  // you leave for school (tiny, wide shot)
  const u = seg(t, CUT.morning + 0.6, tMostly);
  const hx = lerp(760, 1060, u), hy = lerp(800, 925, Math.min(1, u * 2.2));
  let ch = hero(t, { x: hx, y: hy, s: 0.24, view: u > 0.45 ? 'side' : 'front', flip: true, ...(u > 0 && u < 1 ? (u > 0.45 ? AC.walk(t * 9) : AC.walkFront(t * 9)) : {}), face: 'happy' });
  let sky = birds(t, -200, 220, 1);
  // the bathtub guy drifts across the sky (if the city props are loaded)
  const bt = seg(t, tMostly - 0.25, CUT.pick + 1.2);
  if (X.CS && X.CS.bathtubGuy) sky += X.CS.bathtubGuy(lerp(-250, 1500, bt), 180 + 30 * Math.sin(t * 1.5), 0.42, 6 * Math.sin(t * 2), { t, face: 'happy' });
  else sky += S.g(S.rect(-90, -40, 180, 70, 30, ol('#FFFFFF', 5)) + S.circle(0, -70, 34, ol('#F5CFA8', 5)), tf(lerp(-250, 1500, bt), 180, 1.6));
  return view(cam, Lh.bg + sky, 0.85) + view(cam, Lh.mid + (Lh.front || '') + ch + (Lh.fg || '') + (Lh.light || ''), 1);
}

// ---- gym: the pick line
const PICK = [[300, 1], [420, 6], [540, 11], [660, 13]];
function shPick(t) {
  const Lg = SETS.gym.layers(t, {});
  const tPicked = w(1, 'picked'), tLast = w(1, 'last');
  const cam = camKeys(t, [[CUT.pick, { zoom: 1.45, x: -420, y: 120 }], [tPicked, { zoom: 1.5, x: -320, y: 130 }], [tLast, { zoom: 1.7, x: -150, y: 160 }], [CUT.brick, { zoom: 1.75, x: -130, y: 170 }]]);
  let ch = '';
  // kids get picked one by one and run off toward the captain (left)
  PICK.forEach(([x, i], j) => {
    const tg = tPicked - 0.5 + j * 0.28;
    const u = seg(t, tg, tg + 0.6);
    if (u >= 1) return;
    const px = lerp(x, -300, ease.in(u));
    ch += kid(i, { x: px, y: 828, s: 0.42, ...(u > 0 ? { view: 'side', ...AC.run(t * 14) } : { ...breathe(t, j) }), face: u > 0 ? 'joy' : 'happy', volume: false });
  });
  const alone = t > tLast - 0.2;
  ch += hero(t, { x: 820, y: 828, s: 0.42, headRot: alone ? -8 : 0, bodyY: alone ? 8 : 3, armL: 4, armR: 4, face: alone ? { name: 'sad', eyes: { look: [-0.6, 0.3] } } : { name: 'nervous' } });
  // a tumbleweed rolls by (picked last, again)
  if (t > tLast) { const k = seg(t, tLast, CUT.brick + 0.4); ch += SETS.tumbleweed(lerp(1300, 200, k), 840, 0.75, { rot: -k * 720 }); }
  ch += kid(3, { x: 320, y: 990, s: 0.5, view: 'back', armR: t > tPicked - 0.5 && t < tLast ? 100 : 20, ...breathe(t, 4) });
  return room(Lg, cam, '', ch);
}
// Brick's captain armband / sash (body space)
const sash = () => ({ svg: S.g(S.rect(-170, -40, 340, 80, 14, ol('#FFD21F', 7)) + T('CAPTAIN', 0, 22, 56, '#2A2246'), 'translate(0 -440) rotate(-14)'), layer: 'top' });
function shBrick(t) {
  const Lg = SETS.gym.layers(t, {});
  const tCap = w(1, 'captain');
  const u = seg(t, CUT.brick, CUT.point);
  const camBg = { zoom: 1.5, x: -200, y: -120 };
  let o = view(camBg, Lg.mid, 1);
  const step = ease.outBack(seg(t, CUT.brick, CUT.brick + 0.45));
  const b = actor('brick', t, { x: lerp(1500, 960, step), y: 1240, s: 0.86, volume: false, armL: 22, armR: 22, ...boing(t, CUT.brick + 0.4, 0.12), face: { name: 'determined' }, props: [sash()] }, { arms: false });
  o += S.g(b, `translate(960 540) scale(${f(1 + 0.06 * u)}) translate(-960 -540)`);
  if (t >= tCap) o += K.sparkles([[600, 600, 34], [1320, 560, 40], [1180, 860, 26]], t) + bang('CAPTAIN!', 1460, 220, pop(t, tCap, 0.22), 80, 8, '#FFD21F');
  return o + whip(t, CUT.brick, 1);
}
// ---- "And he picks you first." — Brick points (shy smile), whip to YOU: shock -> joy
function shPoint(t) {
  const Lg = SETS.gym.layers(t, {});
  const tPicks = w(1, 'picks'), tYou = w(1, 'you', 1), tFirst = w(1, 'first');
  const cam = camKeys(t, [[CUT.point, { zoom: 1.6, x: 400 - 960, y: 650 - 540 }], [tYou - 0.1, { zoom: 1.6, x: 430 - 960, y: 650 - 540 }], [tYou + 0.08, { zoom: 1.9, x: 1220 - 960, y: 630 - 540 }], [CUT.dad, { zoom: 2.0, x: 1220 - 960, y: 620 - 540 }]]);
  const pt = ease.outBack(seg(t, tPicks - 0.2, tPicks + 0.15));
  let ch = '';
  ch += actor('brick', t, { x: 420, y: 990, s: 0.5, volume: false, turn: 0.5, armR: lerp(-20, 88, pt), armL: -20, face: { name: 'sad', eyes: { look: [0.8, 0.1] }, fx: ['blush'], mouth: 'smallSmile' }, props: [sash()] }, { arms: false });
  const joy = t >= tFirst;
  ch += hero(t, { x: 1220, y: 990, s: 0.5, volume: false, turn: -0.3, lift: joy ? 70 * Math.abs(Math.sin((t - tFirst) * 9)) : 0, armL: joy ? 160 : 20, armR: joy ? 160 : 20, ...boing(t, tFirst, 0.2), face: joy ? { name: 'excited' } : t > tYou ? { name: 'shocked' } : { name: 'sad', eyes: { look: [-0.6, 0] } } });
  ch += kid(6, { x: 1540, y: 990, s: 0.46, volume: false, turn: -0.5, face: t > tYou ? 'shocked' : 'neutral', volume: false });
  let o = room(Lg, cam, '', ch);
  if (joy) o += K.confetti(t, tFirst, 40, 7);
  return o + whip(t, tYou, 1, 0.08);
}

// ---- Dad: "Can you hear me now?" (muted, of course)
function dadPose(t, extra = {}) {
  return actor('dad', t, { x: 640, y: 812, s: 0.5, volume: false, view: 'side', legL: 85, legR: 80, kneeL: 88, kneeR: 84, armL: 60, armR: 40, lean: 8, ...extra });
}
function shDad(t) {
  const Lr = SETS.livingRoom.layers(t, { call: true, callOpts: { muted: 1 } });
  const tNow = w(2, 'now');
  const cam = camKeys(t, [[CUT.dad, { zoom: 1.75, x: 470 - 960, y: 560 - 540 }], [CUT.sky, { zoom: 1.9, x: 470 - 960, y: 560 - 540 }]]);
  const tap = Math.max(0, Math.sin(t * 16)) * (t > A[2].a ? 1 : 0);
  const d = dadPose(t, { armR: 150 + 8 * tap, lean: 10 + 4 * tap, face: { name: 'confused' } });
  let o = room(Lr, cam, d, '');
  o += S.g(S.rect(-230, -60, 460, 120, 30, ol('#FFFFFF', 7)) + S.path('M-150 -24 L-150 24 M-170 -10 Q-150 30 -130 -10', ln(7, '#E8243C')) + S.path('M-185 -35 L-115 35', ln(8, '#E8243C')) + TF("You're muted", 40, 16, 50, '#E8243C'), tf(800, 210, pop(t, tNow, 0.25), -3));
  return o;
}
// ---- "...I miss the sky office." (he gazes out of the window; a dreamy thought bubble)
function shSky(t) {
  const Lr = SETS.livingRoom.layers(t, { call: true, callOpts: { muted: 1 }, curtains: 0.4 });
  const u = seg(t, CUT.sky, CUT.granny);
  const cam = { zoom: lerp(2.0, 2.3, ease.inOut(u)), x: 520 - 960, y: 470 - 540 };
  const d = dadPose(t, { view: 'front', turn: -0.6, armL: 20, armR: 20, headRot: -6, face: { name: 'happy', eyes: { look: [-0.9, -0.6], upper: 0.4 } } });
  let o = room(Lr, cam, d, '');
  // thought bubble with the "sky office"
  const k = pop(t, w(2, 'sky') - 0.3, 0.4);
  if (k > 0) {
    let b = S.circle(230, 150, 16, ol('#FFFFFF', 5)) + S.circle(190, 100, 26, ol('#FFFFFF', 5));
    b += S.path('M-160 -40 Q-200 -140 -90 -150 Q-40 -230 60 -180 Q160 -220 190 -120 Q270 -60 190 20 Q160 90 60 60 Q-20 110 -90 50 Q-200 50 -160 -40 Z', ol('#DDF4FF', 7));
    b += SETS.cloud(-90, -60, 0.35) + SETS.cloud(60, -10, 0.3);
    b += S.g(actor('dad', t, { x: 0, y: 0, s: 0.12, view: 'side', flip: true, rot: -70, armL: 160, armR: 150, legL: 10, legR: -10, face: { name: 'joy' }, shadow: false, volume: false }), `translate(${f(20 + 8 * Math.sin(t * 2))} ${f(-30 + 6 * Math.sin(t * 3))})`);
    o += S.g(b, tf(560, 330, k * 1.25));
  }
  return o;
}

// ---- Granny is still fast: the kitchen pancake blur
const st0 = SETS.SPOTS.kitchen.stove;
function shGranny(t) {
  const tFast = w(3, 'fast');
  const n = Math.round(lerp(20, 180, seg(t, CUT.granny, CUT.bus)));
  const Lk = SETS.kitchen.layers(t, { pancakes: n, wind: 0.5, notes: 0.3 });
  const cam = camKeys(t, [[CUT.granny, { zoom: 1.85, x: st0.x - 960 + 60, y: 640 - 540 }], [CUT.bus, { zoom: 2.0, x: st0.x - 960 + 60, y: 630 - 540 }]]);
  const st = SETS.SPOTS.kitchen.stove;
  const wink = t >= tFast;
  let g = '';
  // blurred arms: ghost copies
  for (let k = 0; k < 3; k++) {
    const a = 60 + 80 * Math.sin(t * 40 + k * 2.1);
    const pose = { x: st.x, y: st.y, s: st.s, volume: false, fast: true, armL: a, armR: 140 - a * 0.6, turn: wink ? 0.3 : 0, face: wink ? { name: 'smug', eyes: { type: 'happy' } } : { name: 'determined' } };
    g += k === 0 ? actor('granny', t, pose, { arms: false }) : S.g(actor('granny', t, { ...pose, shadow: false, volume: false }), null, { opacity: 0.25 });
  }
  // pancakes flying from the pan to the stack
  let fly = '';
  const pan = SETS.SPOTS.kitchen.pan, stack = SETS.SPOTS.kitchen.stack;
  for (let i = 0; i < 5; i++) {
    const ph = (t * 3.2 + i / 5) % 1;
    const x = lerp(pan.x, stack.x, ph), y = lerp(pan.y, stack.top(n), ph) - 260 * Math.sin(ph * Math.PI);
    fly += S.ellipse(x, y, 40, 10 + 6 * Math.abs(Math.sin(ph * 12)), ol('#F4B85E', 4));
  }
  const trail = fireTrail({ pts: [[st.x - 110, st.y - 20], [st.x - 300, st.y - 60], [st.x - 520, st.y - 20], [st.x - 760, st.y - 70]], w: 50, t, alpha: 0.8 });
  let o = room(Lk, cam, '', trail + g + fly);
  o += bang('ZOOM!', 1380, 260, pop(t, tFast, 0.2), 100, 8, '#FF8A2E');
  return o;
}
// ---- "She's never been late again." (the bus stop: she's already there, knitting)
function busStop(x, y) {
  let o = S.rect(x - 8, y - 380, 16, 380, 4, ol('#5A6070', 5)) + S.g(S.circle(0, 0, 60, ol('#3E8FE0', 7)) + T('BUS', 0, 16, 44, '#FFFFFF'), tf(x, y - 400));
  o += S.rect(x + 60, y - 120, 300, 22, 6, ol('#C98A52', 5)) + S.rect(x + 60, y - 180, 300, 22, 6, ol('#C98A52', 5)) + S.path(`M${x + 80} ${y - 98} L${x + 76} ${y} M${x + 340} ${y - 98} L${x + 344} ${y}`, ln(9, '#5A6070'));
  return o;
}
function shBus(t) {
  const tLate = w(3, 'late');
  const cam = camKeys(t, [[CUT.bus, { zoom: 1.32, x: 1180 - 960, y: 770 - 540 }], [CUT.walk, { zoom: 1.4, x: 1220 - 960, y: 770 - 540 }]]);
  const Ls = SETS.street.layers(t, cam, { time: 'morning', pigeon: false });
  const bu = ease.out(seg(t, CUT.bus, tLate + 0.1));
  const bx = lerp(-500, 780, bu);
  let ch = busStop(1260, 945);
  // Granny sitting on the bench, knitting; taps her wristwatch on "late"
  const tap = t > tLate ? Math.max(0, Math.sin((t - tLate) * 14)) : 0;
  ch += actor('granny', t, { x: 1450, y: 945, s: 0.42, view: 'side', legL: 82, legR: 78, kneeL: 86, kneeR: 82, bodyY: 0, armL: 50 + 10 * Math.sin(t * 12), armR: t > tLate ? 80 + 10 * tap : 45 + 10 * Math.sin(t * 12 + 1), face: t > tLate ? { name: 'smug', eyes: { look: [-0.8, 0] } } : { name: 'happy', eyes: { type: 'closed' } } }, { arms: false });
  ch += S.circle(1380, 740, 18, ol('#FF8FC4', 4)) + S.path('M1366 730 L1340 700 M1394 730 L1420 704', ln(4, '#C9CED8'));
  ch += smoke(1600, 930, t, { n: 4, s: 0.8, seed: 2, rise: 160, op: 0.5 });
  ch += fireTrail({ pts: [[1560, 935], [1800, 938], [2200, 936]], w: 30 * (1 - seg(t, CUT.bus, CUT.walk)), t });
  // the bus pulls in
  const bus = X.CS && X.CS.bus ? X.CS.bus(bx, 1050, 0.95, 0, { t, passengers: true }) : S.g(S.rect(-300, -250, 600, 206, 38, ol('#FFB52E', 6)), tf(bx, 1030, 0.62));
  ch += bus;
  if (bu > 0.92) ch += bubble(bx + 240, 700, '?!', pop(t, tLate + 0.1, 0.2), { size: 50, w: 110, tx: -10, ty: 80 });
  return Ls.bg + Ls.mid + view(cam, ch, 1) + Ls.fg;
}
// ---- "She also walks to the store... faster than the car." (tracking shot)
function grocery(x, y) {
  let o = S.rect(x - 300, y - 420, 600, 420, 6, ol('#FFF4E0', 7)) + S.path(`M${x - 330} ${y - 420} L${x + 330} ${y - 420} L${x + 300} ${y - 330} L${x - 300} ${y - 330} Z`, ol('#3FA650', 6));
  for (let i = 0; i < 6; i++) o += S.path(`M${x - 300 + i * 100} ${y - 330} Q${x - 250 + i * 100} ${y - 300} ${x - 200 + i * 100} ${y - 330} Z`, ol(i % 2 ? '#FFFFFF' : '#3FA650', 4));
  o += S.rect(x - 220, y - 500, 440, 80, 12, ol('#E8243C', 6)) + T('GROCERY', x, y - 444, 56, '#FFFFFF');
  o += S.rect(x - 250, y - 290, 220, 180, 6, ol('#BFE6FF', 5)) + S.rect(x + 40, y - 290, 120, 290, 6, ol('#8ED8E6', 5)) + S.circle(x + 140, y - 140, 7, { fill: LINE_ });
  return o;
}
function shWalk(t) {
  const tStore = w(3, 'store'), tFaster = w(3, 'faster'), tCar = w(3, 'car');
  const t0 = CUT.walk, t1 = CUT.zoe;
  const gx = 400 + (t - t0) * 1500;                          // Granny: very fast (but walking)
  const carV = t < tFaster ? 1500 : lerp(1500, 700, seg(t, tFaster, tFaster + 0.5));
  const carX = 380 + (Math.min(t, tFaster) - t0) * 1500 + Math.max(0, t - tFaster) * carV * 0.85;
  const storeX = 400 + (t1 - t0) * 1500 + 420;
  const cam = { zoom: 1.32, x: gx - 960 + 160, y: 190 };
  const Ls = SETS.street.layers(t, cam, { time: 'morning', pigeon: false });
  let ch = grocery(storeX, 945);
  ch += fireTrail({ pts: [[gx - 30, 935], [gx - 300, 938], [gx - 700, 934], [gx - 1100, 937]], w: 46, t });
  const waving = t > tFaster;
  ch += actor('granny', t, { x: gx, y: 940, s: 0.42, fast: true, view: 'side', flip: true, ...AC.walk(t * 30, 1.1), armL: waving ? 150 + 20 * Math.sin(t * 14) : AC.walk(t * 30).armL, lean: 6, face: waving ? { name: 'happy', eyes: { look: [0.9, 0.4] } } : { name: 'happy' } }, { arms: false });
  ch += K.C.speedLines(gx - 700, gx - 250, 760, 6, 5, '#FFFFFF', 260);
  const car = X.CS && X.CS.car ? X.CS.car(carX, 1062, 2.9, { col: '#5A8BFF' }) : S.g(S.rect(-60, -60, 124, 50, 14, ol('#5A8BFF', 4)), tf(carX, 1035, 2.6));
  ch += car;
  if (t > tFaster) ch += bubble(carX + 60, 800, '?!', pop(t, tFaster + 0.3, 0.2), { size: 50, w: 110, tx: -10, ty: 90 });
  return Ls.bg + Ls.mid + view(cam, ch, 1) + Ls.fg + bang('WHOOSH', 1500, 260, pop(t, tCar, 0.2), 80, 8, '#FF8A2E');
}

// ---- hero room: Zoe checks the monitor
const ROOM = SETS.SPOTS.heroRoom;
const roomL = (t, extra = {}) => SETS.heroRoom.layers(t, { time: 'day', note: ['nice try.'], ...extra });
function shZoe(t) {
  const Lr = roomL(t);
  const cam = camKeys(t, [[CUT.zoe, { zoom: 1.5, x: 930 - 960, y: 650 - 540 }], [CUT.zoe2, { zoom: 1.62, x: 900 - 960, y: 640 - 540 }]]);
  let ch = '';
  ch += actor('zoe', t, { x: 1030, y: 990, s: 0.56, volume: false, view: 'side', lean: 16, headRot: 6, armL: 60, armR: 50, face: { name: 'confused', eyes: { look: [-0.8, 0.2], upper: 0.35 } } }, { arms: false });
  ch += hero(t, { x: 1380, y: 990, s: 0.55, volume: false, turn: -0.4, armL: -24, armR: -24, ...breathe(t), face: { name: 'smug', eyes: { look: [-0.7, 0] } } });
  return room(Lr, cam, '', ch);
}
function shZoe2(t) {
  const Lr = roomL(t);
  const tWin = w(5, 'window');
  const u = seg(t, CUT.zoe2, CUT.you);
  const camBg = { zoom: 1.9, x: 700 - 960, y: 520 - 540 };
  let o = view(camBg, Lr.bg, 0.92) + view(camBg, Lr.mid, 1);
  const z = 1 + 0.05 * u;
  const thumb = ease.outBack(seg(t, w(5, 'facing') - 0.2, w(5, 'facing') + 0.2));
  o += S.g(actor('zoe', t, { x: 1100, y: faceAt(470, 1.05, 0.95), s: 1.05, volume: false, turn: -0.2, armR: 20, armL: lerp(10, 75, thumb), face: { name: 'deadpan', eyes: { look: [-0.2, 0], upper: 0.45 } } }, { arms: false, energy: 0.5 }), `translate(960 540) scale(${f(z)}) translate(-960 -540)`);
  return o + (t > tWin ? bang('...', 420, 300, pop(t, tWin + 0.1, 0.2), 90, 0, '#FFFFFF') : '');
}
// ---- "Yeah. But now it says 'nice try.'" — proud; smash-zoom onto the note
function shYou(t) {
  const Lr = roomL(t);
  const tNice = w(6, 'nice');
  if (t < tNice - 0.04) {
    const camBg = { zoom: 1.8, x: 1200 - 960, y: 500 - 540 };
    let o = view(camBg, Lr.bg, 0.92) + view(camBg, Lr.mid, 1);
    const u = seg(t, CUT.you, tNice);
    o += S.g(hero(t, { x: 900, y: faceAt(470, 1.05), s: 1.05, volume: false, armL: -26, armR: -26, lean: -3, ...breathe(t), face: { name: 'smug', fx: ['sparkles'] } }, { arms: false }), `translate(960 540) scale(${f(1 + 0.05 * u)}) translate(-960 -540)`);
    return o;
  }
  const n = ROOM.note;
  const cam = camKeys(t, [[tNice - 0.04, { zoom: 6.2, x: n.x - 960, y: n.y - 540 }], [CUT.cat, { zoom: 6.8, x: n.x - 960, y: n.y - 540 }]]);
  let o = room(Lr, cam, '', '');
  o += K.sparkles([[620, 360, 50], [1300, 330, 60], [1320, 760, 36], [600, 740, 40]], t) + zoomLines(960, 540, 0.8 * (1 - seg(t, tNice + 0.3, tNice + 0.8)), t, '#FFE14D');
  return o + smash(t, tNice - 0.04, 0.14, 0.7);
}

// ---- Pancake: walks along the bed and plops onto the old laptop
const LAP = ROOM.laptop.bed;                       // { x 1390, y 724, s .34, screen }
const lapScr = (t, typed, lines, glow) => SETS.adminScreen(t, { typed, lines, cursor: true, title: 'ADMIN PANEL v1.0' });
function shCat(t) {
  const tSits = w(7, 'sits'), tKey = w(7, 'keyboard');
  const plop = t >= tSits;
  const typed = plop ? 'jjjjkkkk;;;;;;;;;'.slice(0, Math.round(seg(t, tSits + 0.1, tKey + 0.4) * 17)) : '';
  const Lr = roomL(t, { laptop: plop ? lapScr(t, typed, ['Admin panel loaded.', 'Welcome... you.']) : undefined, laptopOff: !plop, glow: plop ? 0.4 : 0 });
  const cam = shakeAll(camKeys(t, [[CUT.cat, { zoom: 2.5, x: 1560 - 960, y: 640 - 540 }], [tSits, { zoom: 2.6, x: 1440 - 960, y: 640 - 540 }], [CUT.type, { zoom: 2.75, x: 1420 - 960, y: 640 - 540 }]]), t, [[tSits + 0.12, 0.25, 6]]);
  let cat;
  if (!plop) {
    const u = seg(t, CUT.cat, tSits - 0.2);
    const cx = lerp(1720, 1420, u);
    const jump = bump(t, tSits - 0.25, tSits + 0.05);
    cat = pancake({ x: cx - 40 * jump, y: 716 - 70 * jump, s: 0.42, t, pose: 'walk', mood: 'smug' });
  } else {
    const b = boing(t, tSits, 0.3);
    cat = S.g(pancake({ x: 0, y: 0, s: 0.38, t, pose: 'loaf', keyboard: false, mood: 'lazy', blink: 0 }), `translate(${LAP.x} ${LAP.y - 30}) scale(${f(b.sx)} ${f(b.sy)})`);
  }
  let fx = plop ? bang('CLACK!', 1600, 520, pop(t, tSits + 0.05, 0.2) * (1 - seg(t, tSits + 0.6, tSits + 0.8)), 50, 8, '#FFFFFF') : '';
  return room(Lr, cam, '', cat + fx);
}
// ---- close-up: the screen types ";size pancake 2" by itself
function bigLaptop(t, typed, glow, catPose = {}) {
  let o = SETS.laptop(960, 965, 1.55, lapScr(t, typed, ['Admin panel loaded.', 'Welcome... you.', 'Warning: keyboard occupied']), { glow, t });
  o += pancake({ x: 960, y: 935, s: 1.25, t, pose: 'loaf', keyboard: false, mood: 'lazy', ...catPose });
  return o;
}
function shType(t) {
  const Lr = roomL(t, { laptop: lapScr(t, '', []), glow: 0.4 });
  const camBg = { zoom: 2.6, x: 1420 - 960, y: 560 - 540 };
  let o = view(camBg, Lr.bg, 0.92) + view(camBg, Lr.mid + Lr.front, 1) + S.rect(0, 0, 1920, 1080, 0, { fill: '#2A1A10', opacity: 0.35 });
  const prog = K.typeProgress(t, A[7], 'now', 'does');
  const text = ';size pancake 2';
  const typed = text.slice(0, Math.round(prog * text.length));
  const u = seg(t, CUT.type, CUT.accept);
  const eye = t > w(7, 'does') ? { mood: 'smug', look: [0.5, 0.2] } : { mood: 'lazy' };
  o += S.g(bigLaptop(t, typed, 0.4 + 0.6 * prog, eye), `translate(960 600) scale(${f(1 + 0.1 * ease.inOut(u))}) translate(-960 -600)`);
  o += cmd(t, 960, 120, text, prog, tEnter, { s: 1.5, user: 'pancake', tIn: w(7, 'now') - 0.1 });
  return o;
}
// ---- "Command accepted." — POP: Pancake grows (size 2)
function catGrow(t) {
  const g = ease.outBack(seg(t, tEnter + 0.12, tEnter + 0.5));
  return { s: lerp(0.38, 0.62, g), g };
}
function shAccept(t) {
  const Lr = roomL(t, { laptop: lapScr(t, ';size pancake 2', ['Command accepted.']), glow: 1 });
  const cam = shakeAll({ zoom: 2.3, x: 1400 - 960, y: 600 - 540 }, t, [[tEnter + 0.4, 0.35, 12]]);
  const { s, g } = catGrow(t);
  const b = boing(t, tEnter + 0.45, 0.28);
  let cat = S.g(pancake({ x: 0, y: 0, s, t, pose: g > 0.5 ? 'sit' : 'loaf', keyboard: false, mood: g > 0.5 ? 'surprised' : 'lazy' }), `translate(${LAP.x} ${LAP.y - 30}) scale(${f(b.sx)} ${f(b.sy)})`);
  cat += K.commandBurst(LAP.x, LAP.y - 100, t - tEnter, '#3DFF9A', 220);
  let o = room(Lr, cam, '', cat);
  o += K.accepted(960, 170, pop(t, A[8].a, 0.3), 1.25);
  o += cmd(t, 960, 330, ';size pancake 2', 1, tEnter, { s: 1.0, user: 'pancake' });
  return o + smash(t, tEnter + 0.45, 0.12, 0.5);
}
// ---- "...PANCAKE." (whispered, horrified)
function shGasp(t) {
  const Lr = roomL(t);
  const camBg = { zoom: 2.0, x: 400 - 960, y: 450 - 540 };
  let o = view(camBg, Lr.bg, 0.92) + view(camBg, Lr.mid, 1);
  const u = seg(t, CUT.gasp, CUT.panel);
  o += S.g(hero(t, { x: 960, y: faceAt(500, 1.1), s: 1.1, volume: false, armL: 150, armR: 150, bodyY: 4 * Math.sin(t * 40), face: { name: 'shocked', fx: ['sweat2'] } }, { arms: false }), `translate(960 540) scale(${f(1 + 0.08 * u)}) translate(-960 -540)`);
  return o + zoomLines(960, 500, 0.5, t, '#FFFFFF');
}
// ---- "The panel didn't keep one command." (two-shot: the bigger, smug cat on the squashed laptop)
function shPanel(t) {
  const Lr = roomL(t, { laptop: lapScr(t, '', ['Command accepted.', 'Admin: pancake']), glow: 0.6 });
  const u = seg(t, CUT.panel, CUT.crown);
  const cam = { zoom: lerp(1.45, 1.6, ease.inOut(u)), x: 1300 - 960, y: 620 - 540 };
  let ch = S.g(pancake({ x: 0, y: 0, s: 0.62, t, pose: 'sit', mood: 'smug', blink: bump(t, CUT.panel + 1.4, CUT.panel + 1.6) }), `translate(${LAP.x} ${LAP.y - 30})`);
  ch += hero(t, { x: 1020, y: 990, s: 0.52, volume: false, turn: 0.4, armL: 9, armR: 9, ...breathe(t), face: { name: 'shocked', eyes: { look: [0.8, -0.2] } } });
  return room(Lr, cam, '', ch);
}
// ---- "It kept one admin." — the tiny golden ADMIN crown; slow push-in on the crown until the end
function shCrown(t) {
  const Lr = roomL(t, { laptop: lapScr(t, '', ['Admin: pancake']), glow: 0.5 });
  const end = K.V.scene('SC 12').start;
  const u = seg(t, CUT.crown, end);
  const camBg = { zoom: 3.0, x: 1390 - 960, y: 560 - 540 };
  let o = view(camBg, Lr.bg, 0.92) + view(camBg, Lr.mid + Lr.front, 1) + S.rect(0, 0, 1920, 1080, 0, { fill: '#FFB347', opacity: 0.12 });
  o += K.rays(960, 420, 16, 1400, '#FFE9A8', 0.12 + 0.1 * seg(t, tAdmin, tAdmin + 0.5), t * 6);
  // the cat (crown pops on "admin"); slow push toward the crown
  const crown = t >= tAdmin;
  const ck = ease.outBack(seg(t, tAdmin, tAdmin + 0.35));
  const blink = Math.max(bump(t, tAdmin + 1.1, tAdmin + 1.45), bump(t, tAdmin + 2.35, tAdmin + 2.75));
  const cs = 2.4;
  const catSvg = pancake({ x: 960, y: 1240, s: cs, t, pose: 'sit', mood: 'smug', crown: false, blink: blink * 0.99, look: [0.1, 0] });
  // crown drawn separately so it can drop in: head centre ≈ (960, 1240 - (222*1.14 + 84)*0.68*s)
  const headY = 1240 - 222 * 0.68 * cs * 1.0;
  const crownY = headY - 84 * 0.68 * cs * 1.14 * 1.0;
  let crownSvg = '';
  if (crown) {
    const drop = (1 - ck) * -220;
    crownSvg = S.g(require('../rig/cats').tinyCrown(0, 0, 9 / Math.pow(cs, 0.35)), `translate(960 ${f(crownY + drop)}) scale(${f(0.68 * cs * 1.14 * (0.6 + 0.4 * clamp(ck, 0, 1.2)))})`);
    crownSvg += K.sparkles([[960 - 150, crownY - 90, 30 * bump(t, tAdmin + 0.2, tAdmin + 1.2)], [960 + 170, crownY - 60, 36 * bump(t, tAdmin + 0.3, tAdmin + 1.4)], [960 + 40, crownY - 170, 24 * bump(t, tAdmin + 0.5, tAdmin + 1.6)]], t);
  }
  const z = 1 + 0.55 * ease.inOut(u);
  const pivot = crownY + 60;
  o += S.g(catSvg + crownSvg, `translate(960 ${f(pivot - 90 * ease.inOut(u))}) scale(${f(z)}) translate(-960 ${f(-pivot)})`);
  if (crown) o += smash(t, tAdmin, 0.12, 0.45);
  return o;
}

// ================================================================= dispatch
const SHOTS = [
  [CUT.morning, shMorning], [CUT.pick, shPick], [CUT.brick, shBrick], [CUT.point, shPoint], [CUT.dad, shDad], [CUT.sky, shSky],
  [CUT.granny, shGranny], [CUT.bus, shBus], [CUT.walk, shWalk], [CUT.zoe, shZoe], [CUT.zoe2, shZoe2], [CUT.you, shYou],
  [CUT.cat, shCat], [CUT.type, shType], [CUT.accept, shAccept], [CUT.gasp, shGasp], [CUT.panel, shPanel], [CUT.crown, shCrown],
].sort((a, b) => a[0] - b[0]);
const WHIPS = [CUT.dad, CUT.granny, CUT.zoe];
function shotAt(t) {
  let i = SHOTS.length - 1;
  while (i > 0 && t < SHOTS[i][0]) i--;
  return i;
}
function scene(t) {
  let o = SHOTS[shotAt(t)][1](t);
  for (const tc of WHIPS) if (Math.abs(t - tc) < 0.1) o += whip(t, tc, 1);
  return o;
}
function look(t) {
  if (t >= CUT.crown) return { grade: 'warm', vignette: 0.9 };
  if (t >= CUT.pick && t < CUT.dad) return { grade: null, vignette: 0.55 };
  return { grade: 'warm', vignette: 0.6 };
}

module.exports = { scene, look, SHOTS, CUT };
