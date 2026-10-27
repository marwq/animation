// Ролик 35 (серия по образцу): Колокол — Жёлтая против Малыша, 22 с, 24 кадра/с. Драка без ударов:
// колокол из деревни майнкрафта — «дзынь!» сдувает звуковой волной, колокол на голову, колокол-ловушка.
// Музыка превращения — один раз. Фон — деревня.
//
//   0–2 с     шарик-Жёлтая (слева) и шарик-Малыш (справа) неподвижно стоят друг напротив друга,
//             середина пустая — автор вставит начало
//   2–4 с     из земли вырастает стойка, на неё падает колокол; Малыш на пропеллере бьёт его головой —
//             «дзынь!» — волна: Жёлтую трясёт и катит кувырком
//   4–5.3 с   Жёлтая «растёт» под музыку — Малыш влюблён
//   5.4–9.7 с снимает колокол и надевает влюблённому Малышу на голову, щелчок — «дзынь!», его трясёт
//   9.7–10.8 с Малыш «растёт»
//   11–13 с   отбирает колокол, надевает ей на голову, стучит — «бом!» — «пуф», колокол накрывает шарик
//   13.5–17 с колокол прыгает ему на ногу, взлетает ему на голову, из-под него — большая Жёлтая; щелчок —
//             «дзы-ы-ынь!» — Малыша уносит за край
//   17–22 с   Жёлтая в центре, руки вверх
'use strict';

const ST = Stage({
  name: 'mc35-bell',
  frames: 528,
  cast: {
    yel: { small: ['girl-verity-small', { bodyHeight: 300, recolor: 'yellow' }],
      big: ['verity-big-girl', { height: 730, splitFeet: true, recolor: 'yellow' }], pivot: 337, voice: 1.45, vAngle: 50, lie: 55,
      color: '#ffe23a', moods: { angry: 'angry theeth', grin: 'theeth smile', big: 'theeth smile' } },
    baby: { small: ['child-verity-pink', { bodyHeight: 300, spin: { layer: 'hat', cut: 122, axis: 389 } }],
      big: ['child-verity-big', { height: 730, spin: { layer: 'hat', cut: 106, axis: 330 } }], pivot: 338, voice: 1.25,
      lie: 60, color: '#ffd9b8', moods: { angry: ' 2', grin: ' 2', big: 'theeth smile', love: ' 1' } },
  },
  order: ['baby', 'yel'],
  background: { theme: 'village', seed: 351, sunX: 1520, sunY: 130 },
  clouds: [[150, 80, 2.4, 0, 12], [700, 220, 1.8, 1, 16], [1150, 70, 2.6, 2, 10], [1720, 250, 1.5, 0, 18]],
});
const { FPS, NF, GROUND, C, key, move, ev, sfx, hop, laugh, tremble, transform, shrink, stance, walk, turn,
  flyOff, victory, chuckle, hand, toRig, statesAt, stateAt, target } = ST;
const P = (v, f, S) => (typeof v === 'function' ? v(f, S) : typeof v === 'string' ? target(v, S) : v);

function propeller(who, f0, f1, rps = 7, o = {}) {
  key(who, f0, { spin: 0, spinBlur: 0 }, 0);
  key(who, f0 + 8, { spinBlur: 1 }, 8);
  move(who, f1, { spin: rps * (f1 - f0) / 24 }, 'lin');
  key(who, f1, { spinBlur: 0 }, 6);
  key(who, f1 + 1, { spin: 0 }, 0);
  if (o.snd !== false) sfx('whirr', f0, { who, dur: f1 - f0, gain: o.gain ?? 0.4 });
}

// ------------------------------------------------------------------ колокол
const BS = 240, BH = BS * 0.95, SX = 960, SH = 520, SW = 380;
const STAND = { f0: 1e9, f1: 1e9, f2: 1e9, f3: 1e9 };
const BELL = [];          // {f0, stand, rot} | {f0, f1, a, b, arc, r0, r1} | {f0, hand} | {f0, head, dy} | {f0, at, jit}
const RINGS = [];         // {f, at, size, dir}
const HANG = [SX, GROUND - SH];
const swing = (f0, amp, dir = 1) => (f) => dir * amp * Math.sin((f - f0) * 0.55) * Math.exp(-(f - f0) / 22);
function bellAt(f, S) {
  const b = BELL.filter((k) => f >= k.f0).pop();
  if (!b || b.gone) return null;
  const rot = typeof b.rot === 'function' ? b.rot(f) : b.rot || 0;
  if (b.stand) return { x: HANG[0], y: HANG[1], rot };
  if (b.hand) {
    if (S[b.hand].p.form !== 'big') return null;
    const h = C[b.hand].big.point(S[b.hand].st, 'handF');
    return { x: h[0], y: h[1] - 14, rot };
  }
  if (b.head) {
    const h = target(`${b.head}:head`, S), j = b.jit && b.jit(f);
    return { x: h[0] + (j || 0), y: h[1] + b.dy - BH, rot: E.rad(S[b.head].p.rot || 0) * 0 };
  }
  if (b.at) { const j = b.jit ? b.jit(f) : [0, 0]; return { x: b.at[0] + j[0], y: b.at[1] - BH + j[1], rot, sq: j[2] || 1 }; }
  const u = E.clamp((f - b.f0) / (b.f1 - b.f0), 0, 1), a = P(b.a, b.f0, statesAt(b.f0)), c = P(b.b, f, S);
  return { x: E.lerp(a[0], c[0], u), y: E.lerp(a[1], c[1], u) - Math.sin(Math.PI * u) * (b.arc || 0), rot: E.lerp(b.r0 || 0, b.r1 || 0, u) };
}
const bellMid = (f, S) => { const b = bellAt(f, S); return [b.x - Math.sin(b.rot) * BH * 0.55, b.y + Math.cos(b.rot) * BH * 0.55]; };
function ring(f, at, size = 1, dir = 0, o = {}) {
  RINGS.push({ f, at, size, dir }, { f: f + 8, at, size, dir });
  sfx('bell', f, { x: Array.isArray(at) ? at[0] : SX, gain: o.gain ?? 0.9, dur: o.dur ?? 40, pitch: o.pitch });
}

const YX0 = 560, BX0 = 1360;
// ================================================================== 0–2 с: неподвижная стойка
key('yel', 0, { form: 'small', x: YX0, y: GROUND, face: 1, look: 1, eyes: 'normal', mouth: 'smile normal', sx: 1, sy: 1, rot: 0, pivot: 0, alpha: 1 }, 0);
key('baby', 0, { form: 'small', x: BX0, y: GROUND, face: -1, look: 1, eyes: 'normal', mouth: ' 6', sx: 1, sy: 1, rot: 0, pivot: 0, alpha: 1 }, 0);

const BIG = () => {
  // ---- 2–4 с: стойка вырастает, колокол падает на неё; Малыш бьёт головой — «дзынь!» — волна
  STAND.f0 = 48; STAND.f1 = 56;
  sfx('creak', 48, { x: SX, dur: 8, gain: 0.6 }); ev('dust', { f: 50, x: SX, r: 60, n: 8 });
  BELL.push({ f0: 56, f1: 62, a: [SX, -300], b: HANG, r0: 0, r1: 0 });
  BELL.push({ f0: 62, stand: true, rot: swing(62, 0.12) });
  ring(62, HANG.map((v, i) => v + (i ? BH * 0.6 : 0)), 0.5, 0, { gain: 0.35, dur: 24 });
  key('yel', 52, { mouth: 'puzzlement' }, 0); key('baby', 52, { mouth: ' 5' }, 0);
  key('baby', 58, { mouth: ' 2', eyes: 'angry' }, 0);
  const F0 = 60, HIT = 72;
  propeller('baby', F0, HIT + 22, 10);
  move('baby', F0, { x: BX0, y: GROUND });
  move('baby', HIT - 4, { x: 1190, y: GROUND - 300 }, 'out2');
  move('baby', HIT, { x: 1130, y: GROUND - 310 }, 'in');
  sfx('bonk', HIT, { x: 1100, gain: 0.9 });
  BELL.push({ f0: HIT, stand: true, rot: swing(HIT, -0.45) });
  ring(HIT, (f, S) => bellMid(HIT, statesAt(HIT)), 1.3, -1, { gain: 1.0, dur: 40 });
  ev('shake', { f: HIT, amp: 12, n: 10 });
  move('baby', HIT + 14, { x: 1300, y: GROUND }, 'in2');
  key('baby', HIT + 14, { sx: 1.2, sy: 0.82, mouth: ' 1', eyes: 'normal' }, 1); key('baby', HIT + 18, { sx: 1, sy: 1 }, 3);
  sfx('land', HIT + 14, { who: 'baby', gain: 0.5 });
  // Жёлтую трясёт и катит
  key('yel', HIT + 2, { mouth: 'puzzlement', eyes: 'sad' }, 0);
  tremble('yel', HIT + 2, HIT + 12, YX0, 8);
  for (let f = HIT + 2; f < HIT + 12; f += 2) key('yel', f + 1, { sx: f % 4 ? 1.06 : 0.94, sy: f % 4 ? 0.94 : 1.06 }, 1);
  ST.tumble('yel', HIT + 12, HIT + 24, YX0, 400, 110, -1, { stars: 16 });
  sfx('ref:laugh', HIT + 16, { who: 'baby', gain: 0.85, pitch: 1.3 });
  laugh('baby', HIT + 18, HIT + 36);

  // ---- 4–5.3 с: Жёлтая «растёт» — Малыш влюблён
  const YX = 440;
  key('yel', HIT + 24, { eyes: 'angry', mouth: 'angry theeth' }, 0);
  ev('vein', { who: 'yel', f0: HIT + 24, f1: HIT + 34 });
  const YB = transform('yel', HIT + 26, 400, YX, 1, { style: 'grow', love: 'baby', loveDur: 44 });
  key('yel', YB, stance('yel', YX, 1), 0);
  key('yel', YB + 6, { mouth: 'theeth smile', eyes: 'angry' }, 0);

  // ---- 5.4–9.7 с: снимает колокол, надевает влюблённому Малышу на голову, щелчок — «дзынь!»
  const YX2 = 680, W0 = YB + 2;
  walk('yel', W0, YX, YX2, 2, 8, 1);
  const GR = W0 + 17;
  key('yel', GR - 4, { lean: -4 }, 4);
  key('yel', GR, { hitF: 1, hitFto: [HANG[0] - 10, HANG[1] + 20], hitFfix: GR }, 4);
  BELL.push({ f0: GR, hand: 'yel', rot: 0 });
  sfx('pop', GR, { who: 'yel', gain: 0.6 });
  STAND.f2 = GR + 12; STAND.f3 = GR + 22;                                 // стойка уходит в землю
  sfx('creak', GR + 12, { x: SX, dur: 10, gain: 0.5 }); ev('dust', { f: GR + 20, x: SX, r: 60, n: 6, snd: false });
  key('yel', GR + 6, { hitF: 0, handF: hand('yel', 'F', 0.75, -0.6), mouth: 'happy with theeth' }, 6);
  const BX1 = 900;
  ST.hop('baby', W0 + 4, W0 + 14, 1300, 1100, 110);
  ST.hop('baby', W0 + 16, W0 + 26, 1100, BX1, 110);
  const PUT = GR + 14, ON = PUT + 6;
  key('yel', PUT, { handF: hand('yel', 'F', 0.95, -0.2), lean: 10 }, 4);
  BELL.push({ f0: PUT, f1: ON, a: (f, S) => { const b = bellAt(PUT - 1, statesAt(PUT - 1)); return [b.x, b.y]; }, b: (f, S) => { const h = target('baby:head', S); return [h[0], h[1] + 40 - BH]; }, arc: 60 });
  BELL.push({ f0: ON, head: 'baby', dy: 40 });
  sfx('bell', ON, { who: 'baby', gain: 0.4, dur: 14, pitch: 1.2 }); sfx('bonk', ON, { who: 'baby', gain: 0.6 });
  key('baby', ON, { sx: 1.15, sy: 0.87, mouth: ' 5', eyes: 'sad' }, 1); key('baby', ON + 4, { sx: 1, sy: 1 }, 3);
  key('yel', ON + 4, { ...stance('yel', YX2, 1), mouth: 'happy with theeth', eyes: 'angry' }, 8);
  // шатается вслепую
  key('baby', ON + 1, { pivot: ST.CAST.baby.pivot }, 0);
  for (let f = ON + 2; f < ON + 10; f += 4) { key('baby', f + 2, { rot: 10 }, 2); key('baby', f + 4, { rot: -10 }, 2); }
  key('baby', ON + 10, { rot: 0 }, 2);
  sfx('scared', ON + 2, { who: 'baby', gain: 0.6 });
  // щелчок
  const FL = ON + 14;
  key('yel', FL - 4, { handF: hand('yel', 'F', 0.6, -0.3), lean: 4 }, 4);
  key('yel', FL, { hitF: 1, hitFto: (() => { const h = target('baby:head', stateAt(FL)); return [h[0] - BS * 0.4, h[1] - 20]; })(), hitFfix: FL }, 2, 'in2');
  key('yel', FL + 6, { hitF: 0, ...stance('yel', YX2, 1), mouth: 'happy with theeth' }, 6);
  sfx('flick', FL, { who: 'baby', gain: 0.9 });
  ring(FL, (f, S) => target('baby:head', S), 1.0, 0, { gain: 1.0, dur: 40 });
  BELL[BELL.length - 1].jit = (f) => (f >= FL && f < FL + 18 ? Math.sin(f * 2.3) * 7 * (1 - (f - FL) / 18) : 0);
  tremble('baby', FL + 1, FL + 18, BX1, 9);
  propeller('baby', FL, FL + 18, 14, { gain: 0.3 });
  // снимает — Малыш с кругами в глазах
  const OFF = FL + 20;
  key('yel', OFF - 4, { hitF: 1, hitFto: (() => { const h = target('baby:head', stateAt(OFF)); return [h[0], h[1] + 40 - BH]; })(), hitFfix: OFF }, 4);
  BELL.push({ f0: OFF, hand: 'yel', rot: 0 });
  key('yel', OFF + 6, { hitF: 0, handF: hand('yel', 'F', 0.8, -0.62), mouth: 'happy with theeth', eyes: 'normal' }, 6);
  ev('stars', { who: 'baby', f0: OFF, f1: OFF + 30 });
  ST.hop('baby', OFF + 4, OFF + 14, BX1, 1080, 90);                       // отскакивает, голова кругом
  sfx('ref:laugh', OFF + 2, { who: 'yel', gain: 0.85, pitch: 1.45 });
  chuckle('yel', OFF + 2, OFF + 18, { mouth: 'happy with theeth' });

  // ---- 9.7–10.8 с: Малыш «растёт»
  const BX = 1080;
  key('baby', OFF + 18, { eyes: 'angry', mouth: ' 2' }, 0);
  ev('vein', { who: 'baby', f0: OFF + 18, f1: OFF + 28 });
  const BB = transform('baby', OFF + 20, 1080, BX, -1, { style: 'grow' });
  key('baby', BB, stance('baby', BX, -1), 0);
  key('baby', BB + 6, { mouth: 'happy with theeth', eyes: 'angry' }, 0);
  key('yel', BB - 2, { mouth: 'puzzlement', eyes: 'sad' }, 0);

  // ---- 11–13 с: отбирает колокол — ей на голову — «бом!» — «пуф» — колокол накрывает шарик
  const SN = BB + 6;
  key('baby', SN - 4, { lean: 10 }, 4);
  key('baby', SN, { hitF: 1, hitFto: (() => { const b = bellAt(SN, stateAt(SN)); return [b.x + 20, b.y + 10]; })(), hitFfix: SN }, 4);
  BELL.push({ f0: SN, hand: 'baby', rot: 0 });
  sfx('pop', SN, { who: 'baby', gain: 0.6 });
  key('yel', SN + 2, { handF: hand('yel', 'F', 0.4, 0.3) }, 4);
  const PUT2 = SN + 10, ON2 = PUT2 + 6;
  key('baby', SN + 6, { hitF: 0, handF: hand('baby', 'F', 0.8, -0.7), lean: 4 }, 4);
  key('baby', PUT2, { handF: hand('baby', 'F', 0.98, -0.45), lean: 12 }, 4);
  BELL.push({ f0: PUT2, f1: ON2, a: (f, S) => { const b = bellAt(PUT2 - 1, statesAt(PUT2 - 1)); return [b.x, b.y]; }, b: (f, S) => { const h = target('yel:head', S); return [h[0], h[1] + 50 - BH]; }, arc: 50 });
  BELL.push({ f0: ON2, head: 'yel', dy: 50 });
  sfx('bell', ON2, { who: 'yel', gain: 0.4, dur: 14, pitch: 1.1 }); sfx('bonk', ON2, { who: 'yel', gain: 0.6 });
  key('baby', ON2 + 4, { ...stance('baby', BX, -1), mouth: 'happy with theeth', eyes: 'angry' }, 8);
  key('yel', ON2, { mouth: 'puzzlement', eyes: 'sad', handF: hand('yel', 'F', 0.7, -0.5), handB: hand('yel', 'B', 0.5, -0.5), lean: 6 }, 4);
  tremble('yel', ON2 + 2, ON2 + 14, YX2, 4);
  sfx('scared', ON2 + 2, { who: 'yel', gain: 0.6 });
  const KN = ON2 + 16;
  key('baby', KN - 4, { handF: hand('baby', 'F', 0.5, -0.6), lean: 6 }, 4);
  key('baby', KN, { hitF: 1, hitFto: (() => { const h = target('yel:head', stateAt(KN)); return [h[0] + BS * 0.45, h[1] - 30]; })(), hitFfix: KN }, 2, 'in2');
  key('baby', KN + 6, { hitF: 0, ...stance('baby', BX, -1), mouth: 'happy with theeth' }, 6);
  sfx('slap', KN, { who: 'yel', gain: 0.6 });
  ring(KN, (f, S) => target('yel:head', S), 1.2, 0, { gain: 1.1, dur: 44, pitch: 0.75 });
  BELL[BELL.length - 1].jit = (f) => (f >= KN && f < KN + 16 ? Math.sin(f * 2.3) * 9 : 0);
  tremble('yel', KN + 1, KN + 16, YX2, 10);
  const ysm = shrink('yel', KN + 16, YX2, 1, { mouth: 'puzzlement', eyes: 'sad', smoke: 420 });
  // колокол падает и накрывает шарик
  const CV = ysm + 4;
  BELL.push({ f0: KN + 16, f1: CV, a: (f, S) => { const b = bellAt(KN + 15, statesAt(KN + 15)); return [b.x, b.y + BH]; }, b: [YX2, GROUND], r0: 0, r1: 0 });
  BELL.push({ f0: CV, at: [YX2, GROUND], rot: 0 });
  key('yel', CV, { alpha: 0 }, 0);
  sfx('bell', CV, { x: YX2, gain: 0.5, dur: 16, pitch: 0.9 }); sfx('land', CV, { x: YX2, gain: 0.7 });
  ev('dust', { f: CV, x: YX2, r: 50, n: 6 });
  sfx('ref:laugh', CV + 2, { who: 'baby', gain: 0.85, pitch: 1.25 });
  chuckle('baby', CV + 2, CV + 20, { mouth: 'happy with theeth' });

  // ---- 13.5–17 с: колокол прыгает ему на ногу — взлетает ему на голову — из-под него большая Жёлтая
  const H1 = CV + 12, H2 = H1 + 10, FOOT = BX - 130, LF = H2 + 10;
  const bj = (f) => {
    const hp = (a, b, x0, x1, h) => { const u = (f - a) / (b - a); return [E.lerp(x0, x1, u) - YX2, -Math.sin(Math.PI * u) * h]; };
    if (f >= H1 && f < H2) return hp(H1, H2, YX2, YX2 + 60, 70);
    if (f >= H2 && f < LF) return hp(H2, LF, YX2 + 60, FOOT, 160);
    if (f >= LF) return [FOOT - YX2, 0, f < LF + 3 ? 0.8 : 1];
    return [Math.sin(f * 2.1) * (f > H1 - 8 ? 4 : 0), 0];
  };
  BELL[BELL.length - 1].jit = bj;
  sfx('boing', H1, { x: YX2, gain: 0.5 }); sfx('boing', H2, { x: YX2 + 60, gain: 0.6 });
  sfx('bell', LF, { x: FOOT, gain: 0.6, dur: 14 }); sfx('ref:hit-ow', LF + 2, { who: 'baby', gain: 0.9 });
  key('baby', H2 + 2, { mouth: 'puzzlement', eyes: 'sad' }, 0);
  // прыгает на одной ноге
  key('baby', LF + 1, { legFfk: 1, legF: [40, -90], handF: hand('baby', 'F', 0.5, 0.6), lean: 14, mouth: 'puzzlement', eyes: 'sad' }, 3);
  for (let f = LF + 2; f < LF + 22; f += 8) { move('baby', f, { x: BX, y: GROUND }); move('baby', f + 4, { y: GROUND - 50 }, 'out2'); move('baby', f + 8, { y: GROUND }, 'in2'); }
  // колокол взлетает ему на голову, из-под него — Жёлтая
  const UPB = LF + 6, ONB = UPB + 12;
  BELL.push({ f0: UPB, f1: ONB, a: [FOOT, GROUND - BH], b: (f, S) => { const h = target('baby:head', S); return [h[0], h[1] + 60 - BH]; }, arc: 120, r0: 0, r1: Math.PI * 2 });
  BELL.push({ f0: ONB, head: 'baby', dy: 60 });
  sfx('whoosh', UPB, { x: FOOT, dur: 12, gain: 0.6 }); sfx('bell', ONB, { who: 'baby', gain: 0.5, dur: 16 });
  key('baby', ONB, { ...stance('baby', BX, -1), legFfk: 0, lean: 0, handF: hand('baby', 'F', 0.6, -0.6), handB: hand('baby', 'B', 0.4, -0.6), mouth: 'puzzlement' }, 3);
  tremble('baby', ONB + 2, ONB + 10, BX, 3);
  const YX3 = 720;
  key('yel', UPB, { alpha: 1, x: FOOT, y: GROUND, sx: 1, sy: 1, rot: 0, pivot: 0, mouth: 'angry theeth', eyes: 'angry' }, 0);
  move('yel', UPB, { x: FOOT, y: GROUND });
  move('yel', UPB + 8, { x: YX3 }, 'out');
  const YB2 = UPB + 10;
  key('yel', YB2, { form: 'big', ...stance('yel', YX3, 1), sx: 1.12, sy: 0.88, look: 1, mouth: 'theeth smile', eyes: 'angry', rot: 0, pivot: 0 }, 0);
  key('yel', YB2 + 4, { sx: 0.96, sy: 1.04 }, 4, 'out'); key('yel', YB2 + 8, { sx: 1, sy: 1 }, 4);
  ev('flash', { f: YB2, who: 'yel', strength: 0.3 }); ev('smoke', { f: YB2 - 2, who: 'yel', size: 240, dx: 0, y: GROUND - 120 });
  sfx('grow', YB2, { who: 'yel', gain: 0.9 }); sfx('poof', YB2, { who: 'yel', gain: 0.8 });
  // щелчок по колоколу у него на голове — «дзы-ы-ынь!» — уносит за край
  const FL2 = ONB + 14;
  key('yel', FL2 - 5, { handF: hand('yel', 'F', 0.6, -0.5), lean: 4, mouth: 'theeth smile' }, 5);
  key('yel', FL2, { hitF: 1, hitFto: (() => { const h = target('baby:head', stateAt(FL2)); return [h[0] - BS * 0.45, h[1]]; })(), hitFfix: FL2, lean: 10 }, 2, 'in2');
  key('yel', FL2 + 8, { hitF: 0, ...stance('yel', YX3, 1), mouth: 'happy with theeth', eyes: 'normal' }, 8);
  sfx('flick', FL2, { who: 'baby', gain: 1.0 });
  ring(FL2, (f, S) => target('baby:head', S), 1.8, 0, { gain: 1.2, dur: 56, pitch: 0.85 });
  ring(FL2 + 6, (f, S) => [BX, GROUND - 600], 1.8, 1, { gain: 0.6, dur: 30, pitch: 0.85 });
  BELL[BELL.length - 1].jit = (f) => (f >= FL2 ? Math.sin(f * 2.3) * 9 : 0);
  tremble('baby', FL2 + 1, FL2 + 10, BX, 10);
  ev('shake', { f: FL2, amp: 20, n: 14 });
  const GO = FL2 + 10;
  flyOff('baby', GO, GO + 24, [BX, GROUND], [2400, -250], { turns: 2 });
  propeller('baby', GO, GO + 24, 14);
  BELL.push({ f0: GO, f1: GO + 16, a: (f, S) => { const b = bellAt(GO - 1, statesAt(GO - 1)); return [b.x, b.y]; }, b: [1380, GROUND - BH], arc: 160, r0: 0, r1: 2.6 });
  BELL.push({ f0: GO + 16, at: [1380, GROUND], rot: 0, jit: (f) => [0, 0, f < GO + 19 ? 0.8 : 1] });
  sfx('bell', GO + 16, { x: 1380, gain: 0.5, dur: 20, pitch: 0.9 });
  ev('twinkle', { f: GO + 22, at: [1830, 180], n: 22, size: 60 });
  sfx('ref:laugh', GO + 4, { who: 'yel', gain: 0.85, pitch: 1.45 });
  chuckle('yel', GO + 4, GO + 18, { mouth: 'happy with theeth' });

  // ---- 17–22 с: в центр, руки вверх
  const WIN = victory('yel', GO + 20, YX3, { n: 9, stride: 120 });
  window.T = { HIT, YB, GR, ON, FL, OFF, BB, ON2, KN, ysm, LF, YB2, FL2, GO, WIN };
};

// ------------------------------------------------------------------ рисование
const drawBell = (ctx, b) => FX.mcBell(ctx, b.x, b.y, BS, b.rot, b.sq || 1);
ST.hooks.beforeChars.push((ctx, f, S, CAM) => {
  ctx.setTransform(...CAM);
  if (f >= STAND.f0 && f < STAND.f3) FX.bellStand(ctx, SX, GROUND + 4, SH + 20, SW, E.EASE.out(E.clamp((f - STAND.f0) / (STAND.f1 - STAND.f0), 0, 1)) * (1 - E.EASE.in2(E.clamp((f - STAND.f2) / (STAND.f3 - STAND.f2), 0, 1))));
  const cur = BELL.filter((k) => f >= k.f0).pop();
  if (cur && (cur.stand || (cur.f1 && cur.b === HANG))) { const b = bellAt(f, S); if (b) drawBell(ctx, b); }
});
ST.hooks.afterChars.push((ctx, f, S, CAM) => {
  ctx.setTransform(...CAM);
  const cur = BELL.filter((k) => f >= k.f0).pop();
  if (cur && !cur.stand && !(cur.f1 && cur.b === HANG)) { const b = bellAt(f, S); if (b) drawBell(ctx, b); }
  for (const r of RINGS) { const at = P(r.at, r.f, statesAt(r.f)); FX.soundRings(ctx, at[0], at[1], (f - r.f) / 22, r.size, r.dir); }
});

ST.start(BIG);
