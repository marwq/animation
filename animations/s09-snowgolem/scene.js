// Серия 2, ролик 09: Снежный голем — Жёлтая (слева) против Радужного (справа), 22 с, 24 кадра/с. Драка без ударов:
// снежный голем из майнкрафта (снежные блоки + тыква) кидает снежки за того, кто надел ему голову.
// Музыка превращения — один раз. Фон — тайга.
//
//   0–2 с     шарик-Жёлтая и радужный шарик неподвижно стоят друг напротив друга, середина пустая
//   2–4 с     с неба падают два снежных блока и тыква — оживает снежный голем, кидает снежки в Жёлтую
//   4–5.3 с   Жёлтая «растёт» под музыку — Радужный влюблён
//   5.4–9 с   снимает тыкву с голема и надевает Радужному — он вслепую; пинает верхний блок — его засыпает
//             снегом, торчит только тыква
//   9–10.3 с  Радужный «растёт» из сугроба — тыква перелетает обратно на голема
//   10.4–12.6 с голем кидает снежки в Жёлтую — она в снегу, дрожит — «пуф»
//   12.7–16 с шарик-Жёлтая катит снежный ком — он сносит голема, тыква падает ей на голову;
//             щелчок — шарик-Жёлтая укатывается за край
//   16–22 с   Радужный в центре, руки вверх
'use strict';

const ST = Stage({
  name: '09 Жёлтая vs Радужный',
  frames: 528,
  cast: {
    yel: { small: ['girl-verity-small', { bodyHeight: 300, recolor: 'yellow' }],
      big: ['verity-big-girl', { height: 730, splitFeet: true, recolor: 'yellow' }], pivot: 337, voice: 1.45, vAngle: 50, lie: 55,
      color: '#ffe23a', moods: { angry: 'angry theeth', grin: 'theeth smile', big: 'theeth smile' } },
    rb: { small: ['skeleton-verity-small', { scale: 0.455, recolor: 'rainbow' }], big: ['all-verity-color', { height: 730 }],
      pivot: 325, voice: 0.85, lie: 55, color: '#ff7a3a', moods: { angry: 'angry theeth', grin: 'happy with theeth', big: 'theeth smile', love: 'happy - spittle' } },
  },
  order: ['yel', 'rb'],
  background: { theme: 'taiga', seed: 1009, sunX: 1500, sunY: 130 },
  clouds: [[150, 80, 2.4, 0, 12], [700, 220, 1.8, 1, 16], [1150, 70, 2.6, 2, 10], [1720, 250, 1.5, 0, 18]],
});
const { FPS, NF, GROUND, C, key, move, ev, sfx, hop, tumble, laugh, tremble, transform, shrink, love, stance, walk, turn,
  kick, victory, chuckle, hand, toRig, statesAt, stateAt, target } = ST;
const P = (v, f, S) => (typeof v === 'function' ? v(f, S) : typeof v === 'string' ? target(v, S) : v);

// ------------------------------------------------------------------ голем, снежки, сугроб
const GX = 960, GS = 150;
const FALLS = [];          // блоки и тыква падают: {kind, f0, f1, y1}
const G = { f0: 1e9, blocks: 2, head: true, armK: [] , gone: 1e9 };   // armK: [f, взмах]
const HEADS = [];          // тыква отдельно: {f0, f1, a, b, arc, spin} | {f0, on, dy} | {f0, golem}
const TOPB = [];           // верхний блок летит: {f0, f1, a, b, arc}
const BALLS = [];          // снежки: {f0, f1, a, b, arc}
const SNOW = [];           // снег на персонаже: {who, f0, f1, kind: 'splat'|'cap'|'body', s}
const BURST = [];          // {f, at, size}
const PILE = { f0: 1e9, f1: 1e9, x: 1180, w: 300 };
const ROLL = { f0: 1e9, f1: 1e9, x0: 0, x1: 0, r0: 30, r1: 150 };
function armAt(f) { let v = 0; for (const [a, b] of G.armK) if (f >= a && f < a + 8) v = Math.sin(Math.PI * (f - a) / 8) * b; return v; }
function throwBall(f, tgt, o = {}) {
  G.armK.push([f - 4, 1]);
  BALLS.push({ f0: f, f1: f + (o.n || 9), a: [GX + 70, GROUND - GS * 1.6], b: tgt, arc: o.arc ?? 50 });
  sfx('swing', f - 2, { x: GX, gain: 0.6 }); sfx('snowhit', f + (o.n || 9), { x: 700, gain: 0.9 });
}
const headPos = (f, S) => {
  const h = HEADS.filter((k) => f >= k.f0).pop();
  if (!h || h.golem || h.gone) return null;
  if (h.on) { const t = target(`${h.on}:top`, S); return [t[0], t[1] + h.dy]; }
  if (h.at) return h.at;
  const u = E.clamp((f - h.f0) / (h.f1 - h.f0), 0, 1), a = P(h.a, h.f0, statesAt(h.f0)), b = P(h.b, f, S);
  return [E.lerp(a[0], b[0], u), E.lerp(a[1], b[1], u) - Math.sin(Math.PI * u) * (h.arc || 0), u * (h.spin || 0)];
};
const golemHasHead = (f) => { const h = HEADS.filter((k) => f >= k.f0).pop(); return !h || !!h.golem; };

const YX0 = 560, RX0 = 1360;
// ================================================================== 0–2 с: неподвижная стойка
key('yel', 0, { form: 'small', x: YX0, y: GROUND, face: 1, look: 1, eyes: 'normal', mouth: 'smile normal', sx: 1, sy: 1, rot: 0, pivot: 0, alpha: 1 }, 0);
key('rb', 0, { form: 'small', x: RX0, y: GROUND, face: -1, look: 1, eyes: 'normal', mouth: 'smile normal', sx: 1, sy: 1, rot: 0, pivot: 0, alpha: 1 }, 0);

const BIG = () => {
  // ---- 2–4 с: блоки и тыква с неба — голем оживает — снежки в Жёлтую
  FALLS.push({ kind: 'b1', f0: 48, f1: 54, y1: GROUND - GS * 0.5 }, { kind: 'b2', f0: 52, f1: 58, y1: GROUND - GS * 1.5 }, { kind: 'h', f0: 56, f1: 62, y1: GROUND - GS * 2 });
  for (const [f, k] of [[54, 0], [58, 1], [62, 2]]) { sfx('land', f, { x: GX, gain: 0.6, pitch: 1 - k * 0.1 }); ev('dust', { f, x: GX, r: 40, n: 4, snd: false }); }
  G.f0 = 62;
  ev('twinkle', { f: 63, at: [GX, GROUND - GS * 2 - 20], n: 16, size: 50 });
  sfx('powerup', 62, { x: GX, dur: 8, gain: 0.6 }); sfx('pop', 64, { x: GX, gain: 0.6 });
  key('yel', 52, { mouth: 'puzzlement' }, 0); key('rb', 52, { mouth: 'puzzlement' }, 0);
  key('rb', 64, { mouth: 'happy with theeth', eyes: 'angry' }, 0);
  hop('rb', 64, 72, RX0, RX0, 80);
  const H1 = 70, H2 = 80;
  throwBall(H1, (f, S) => target('yel:face', S));
  throwBall(H2, (f, S) => { const t = target('yel:top', S); return [t[0], t[1] + 10]; });
  SNOW.push({ who: 'yel', f0: H1 + 9, f1: 0, kind: 'splat', s: 150 }, { who: 'yel', f0: H2 + 9, f1: 0, kind: 'cap', s: 150 });
  BURST.push({ f: H1 + 9, at: (f, S) => target('yel:face', S), size: 0.6 }, { f: H2 + 9, at: (f, S) => target('yel:top', S), size: 0.6 });
  key('yel', H1 + 9, { sx: 1.15, sy: 0.88, mouth: 'puzzlement', eyes: 'sad' }, 1); key('yel', H1 + 13, { sx: 1, sy: 1 }, 3);
  key('yel', H2 + 9, { sx: 1.2, sy: 0.84 }, 1); key('yel', H2 + 13, { sx: 1, sy: 1 }, 3);
  tremble('yel', H2 + 12, H2 + 26, YX0, 4);
  sfx('chatter', H2 + 12, { who: 'yel', dur: 14, gain: 0.6 });
  sfx('ref:laugh', H2 + 8, { who: 'rb', gain: 0.85, pitch: 1.0 });
  laugh('rb', H2 + 10, H2 + 28);

  // ---- 4–5.3 с: Жёлтая «растёт» — снег слетает — Радужный влюблён
  const YX = 600;
  key('yel', H2 + 22, { eyes: 'angry', mouth: 'angry theeth' }, 0);
  const YB = transform('yel', H2 + 24, YX0, YX, 1, { style: 'grow', love: 'rb', loveDur: 40 });
  for (const s of SNOW) s.f1 = YB - 4;
  BURST.push({ f: YB - 4, at: [YX0, GROUND - 200], size: 1.2 });
  key('yel', YB, stance('yel', YX, 1), 0);
  key('yel', YB + 6, { mouth: 'theeth smile', eyes: 'angry' }, 0);

  // ---- 5.4–9 с: тыква — Радужному на голову; пинок по верхнему блоку — Радужного засыпает
  const YX2 = 780, RX1 = 1180;
  walk('yel', YB + 2, YX, YX2, 2, 8, 1);
  hop('rb', YB + 6, YB + 16, RX0, RX1, 90);
  const GR = YB + 20, PUT = GR + 12;
  key('yel', GR - 4, { lean: 4 }, 4);
  key('yel', GR, { hitF: 1, hitFto: [GX - 20, GROUND - GS * 2.4], hitFfix: GR }, 4);
  HEADS.push({ f0: GR, f1: PUT, a: [GX, GROUND - GS * 2], b: (f, S) => { const t = target('rb:top', S); return [t[0], t[1] + 60]; }, arc: 160, spin: 0 });
  HEADS.push({ f0: PUT, on: 'rb', dy: 60 });
  sfx('pop', GR, { x: GX, gain: 0.7 }); sfx('whoosh', GR + 1, { x: 1070, dur: 10, gain: 0.5 });
  key('yel', GR + 4, { hitF: 0, handF: hand('yel', 'F', 0.85, -0.6) }, 6);
  key('yel', PUT, { handF: hand('yel', 'F', 0.7, -0.2), mouth: 'happy with theeth', eyes: 'angry' }, 6);
  sfx('bonk', PUT, { who: 'rb', gain: 0.8 });
  key('rb', PUT, { sx: 1.12, sy: 0.88, mouth: 'puzzlement', eyes: 'sad', pivot: ST.CAST.rb.pivot }, 1); key('rb', PUT + 4, { sx: 1, sy: 1 }, 3);
  for (let f = PUT + 4; f < PUT + 22; f += 6) { key('rb', f + 3, { rot: 14 }, 3); key('rb', f + 6, { rot: -14 }, 3); }
  key('rb', PUT + 22, { rot: 0 }, 3);
  sfx('scared', PUT + 3, { who: 'rb', gain: 0.7 });
  // пинок по верхнему блоку
  const KK = PUT + 14, LANDB = KK + 12;
  kick('yel', KK, [GX - 40, GROUND - GS * 1.5], { x: YX2, face: 1, hard: false });
  G.blocks = (f) => (f < KK ? 2 : 1);
  TOPB.push({ f0: KK, f1: LANDB, a: [GX, GROUND - GS * 1.5], b: (f, S) => target('rb:top', S), arc: 140 });
  BURST.push({ f: LANDB, at: [RX1, GROUND - 160], size: 1.6 });
  sfx('crunch', LANDB, { x: RX1, gain: 1.0 }); sfx('snowhit', LANDB, { x: RX1, gain: 0.9 });
  ev('shake', { f: LANDB, amp: 12, n: 8 });
  PILE.f0 = LANDB; PILE.x = RX1;
  key('rb', LANDB, { alpha: 0 }, 0);
  HEADS.push({ f0: LANDB, at: [RX1, GROUND - 200 - GS * 0.43] });
  sfx('ref:laugh', LANDB + 2, { who: 'yel', gain: 0.85, pitch: 1.45 });
  chuckle('yel', LANDB + 2, LANDB + 24, { mouth: 'happy with theeth' });
  key('yel', KK + 18, stance('yel', YX2, 1, { mouth: 'happy with theeth' }), 6);

  // ---- 9–10.3 с: Радужный «растёт» из сугроба — тыква обратно на голема
  const RX = 1300, RG = LANDB + 18;
  key('rb', RG, { alpha: 1, rot: 0, eyes: 'angry', mouth: 'angry theeth' }, 0);
  PILE.f1 = RG + 2;
  BURST.push({ f: RG + 2, at: [RX1, GROUND - 120], size: 1.6 });
  sfx('crunch', RG + 2, { x: RX1, gain: 0.8 });
  HEADS.push({ f0: RG + 2, f1: RG + 18, a: [RX1, GROUND - 200 - GS * 0.43], b: [GX, GROUND - GS], arc: 260, spin: 4 });
  HEADS.push({ f0: RG + 18, golem: true });
  sfx('pop', RG + 18, { x: GX, gain: 0.7 }); sfx('powerup', RG + 18, { x: GX, dur: 8, gain: 0.5 });
  ev('twinkle', { f: RG + 18, at: [GX, GROUND - GS - 40], n: 14, size: 44 });
  const RB = transform('rb', RG + 2, RX1, RX, -1, { style: 'grow' });
  key('rb', RB, stance('rb', RX, -1), 0);
  key('rb', RB + 6, { mouth: 'happy with theeth', eyes: 'angry' }, 0);
  key('yel', RB - 2, { mouth: 'puzzlement', eyes: 'sad' }, 0);

  // ---- 10.4–12.6 с: голем кидает снежки — Жёлтая в снегу — «пуф»
  key('rb', RB + 4, { handF: hand('rb', 'F', 0.6, -0.6), mouth: 'happy with theeth' }, 4);
  sfx('flick', RB + 6, { who: 'rb', gain: 0.8 });
  const S0 = RB + 8;
  const yb = (dx, dy) => (f, S) => { const p = target('yel:body', S); return [p[0] + dx, p[1] + dy]; };
  const shots = [[0, yb(0, -40)], [5, (f, S) => target('yel:face', S)], [10, yb(10, 120)], [15, yb(-20, 260)]];
  for (const [d, t] of shots) throwBall(S0 + d, t, { n: 7, arc: 30 });
  SNOW.push({ who: 'yel', f0: S0 + 7, f1: 0, kind: 'body', s: 260 }, { who: 'yel', f0: S0 + 12, f1: 0, kind: 'splat', s: 160 }, { who: 'yel', f0: S0 + 17, f1: 0, kind: 'cap', s: 170 }, { who: 'yel', f0: S0 + 22, f1: 0, kind: 'legs', s: 300 });
  for (const [d] of shots) BURST.push({ f: S0 + d + 7, at: yb(0, 0), size: 0.6 });
  key('yel', S0 + 8, { mouth: 'puzzlement', eyes: 'sad', handF: hand('yel', 'F', 0.2, 0.7), handB: hand('yel', 'B', -0.15, 0.7), lean: -6 }, 4);
  tremble('yel', S0 + 22, S0 + 40, YX2, 4);
  sfx('chatter', S0 + 22, { who: 'yel', dur: 18, gain: 0.7, pitch: 0.9 });
  const ysm = shrink('yel', S0 + 40, YX2, 1, { mouth: 'puzzlement', eyes: 'sad', smoke: 420 });
  for (const s of SNOW) if (!s.f1) s.f1 = ysm;
  SNOW.push({ who: 'yel', f0: ysm, f1: ysm + 16, kind: 'cap', s: 140 });
  sfx('ref:laugh', S0 + 24, { who: 'rb', gain: 0.85, pitch: 1.0 });
  chuckle('rb', S0 + 24, ysm + 10, { mouth: 'happy with theeth' });

  // ---- 12.7–16 с: шарик-Жёлтая катит снежный ком — он сносит голема — тыква ей на голову — щелчок
  key('yel', ysm + 12, { eyes: 'angry', mouth: 'angry theeth', sx: 1.1, sy: 0.9 }, 2); key('yel', ysm + 16, { sx: 1, sy: 1 }, 3);
  BURST.push({ f: ysm + 16, at: (f, S) => target('yel:top', S), size: 0.7 });
  sfx('snowhit', ysm + 16, { who: 'yel', gain: 0.6 });
  const YB0 = 420;
  hop('yel', ysm + 18, ysm + 28, YX2, YB0, 120);
  ROLL.f0 = ysm + 30; ROLL.f1 = ROLL.f0 + 28; ROLL.x0 = YB0 + 200; ROLL.x1 = GX - 60 - ROLL.r1 + 30;
  for (let f = ROLL.f0; f <= ROLL.f1; f += 2) {
    const u = (f - ROLL.f0) / (ROLL.f1 - ROLL.f0), r = E.lerp(ROLL.r0, ROLL.r1, u), x = E.lerp(ROLL.x0, ROLL.x1, E.EASE.in2(u));
    key('yel', f, { x: x - r - 150, y: GROUND, sx: (f / 2) % 2 ? 1.08 : 0.94, sy: (f / 2) % 2 ? 0.93 : 1.06 }, 2, 'lin');
  }
  sfx('slide', ROLL.f0, { x: 700, gain: 0.7, pitch: 0.7 }); sfx('crunch', ROLL.f0 + 10, { x: 700, gain: 0.4 });
  const SMASH = ROLL.f1;
  G.gone = SMASH;
  BURST.push({ f: SMASH, at: [GX, GROUND - 100], size: 2 });
  sfx('crunch', SMASH, { x: GX, gain: 1.0 }); sfx('snowhit', SMASH, { x: GX, gain: 1.0 }); ev('shake', { f: SMASH, amp: 16, n: 10 });
  HEADS.push({ f0: SMASH, f1: SMASH + 16, a: [GX, GROUND - GS], b: (f, S) => { const t = target('yel:top', S); return [t[0], t[1] + 70]; }, arc: 280, spin: 6 });
  HEADS.push({ f0: SMASH + 16, on: 'yel', dy: 70 });
  sfx('bonk', SMASH + 16, { who: 'yel', gain: 0.9 });
  key('yel', SMASH + 16, { sx: 1.15, sy: 0.88, mouth: 'puzzlement', eyes: 'sad', pivot: ST.CAST.yel.pivot }, 1); key('yel', SMASH + 20, { sx: 1, sy: 1 }, 3);
  for (let f = SMASH + 20; f < SMASH + 38; f += 6) { key('yel', f + 3, { rot: 14 }, 3); key('yel', f + 6, { rot: -14 }, 3); }
  key('yel', SMASH + 38, { rot: 0 }, 3);
  sfx('scared', SMASH + 18, { who: 'yel', gain: 0.7 });
  sfx('ref:laugh', SMASH + 4, { who: 'rb', gain: 0.85, pitch: 1.0 });
  chuckle('rb', SMASH + 4, SMASH + 22, { mouth: 'happy with theeth' });
  // Радужный подходит — щелчок
  const yx = ROLL.x1 - ROLL.r1 - 150, RX2 = yx + 280;
  walk('rb', SMASH + 6, RX, RX2, 3, 8, -1);
  const FL = SMASH + 34;
  key('rb', FL - 5, { lean: 16, hip: [0, toRig('rb', 120)], head: 6, handF: hand('rb', 'F', 0.6, 0.2) }, 5);
  key('rb', FL, { hitF: 1, hitFto: (() => { const b = target('yel:body', stateAt(FL)); return [b[0] + 60, b[1]]; })(), hitFfix: FL }, 2, 'in2');
  key('rb', FL + 8, { ...stance('rb', RX2, -1), hitF: 0, mouth: 'happy with theeth', eyes: 'normal' }, 8);
  sfx('flick', FL, { who: 'yel', gain: 1.0 });
  move('yel', FL, { x: yx, y: GROUND, rot: 0 }); move('yel', FL + 22, { x: -300, y: -200, rot: -1000 }, 'out');
  HEADS.push({ f0: FL, f1: FL + 22, a: (f, S) => headPos(FL - 1, statesAt(FL - 1)), b: [-200, -100], arc: 0, spin: -8 });
  HEADS.push({ f0: FL + 22, golem: false, gone: true });
  sfx('whoosh', FL, { who: 'yel', dur: 18, gain: 0.7 }); sfx('scared', FL + 2, { who: 'yel', gain: 0.8 });
  ev('twinkle', { f: FL + 18, at: [110, 150], n: 20, size: 56 });
  sfx('ref:laugh', FL + 4, { who: 'rb', gain: 0.85, pitch: 1.0 });

  // ---- 16–22 с: в центр, руки вверх
  const WIN = victory('rb', FL + 18, RX2, { n: 9, stride: 110 });
  window.T = { H2, YB, PUT, KK, LANDB, RB, S0, ysm, SMASH, FL, WIN };
};

// ------------------------------------------------------------------ рисование
ST.hooks.beforeChars.push((ctx, f, S, CAM) => {
  ctx.setTransform(...CAM);
  // падающие блоки (до оживления)
  for (const k of FALLS) {
    if (f < k.f0 || f >= G.f0) continue;
    const y = f < k.f1 ? E.lerp(-200, k.y1, E.EASE.in2((f - k.f0) / (k.f1 - k.f0))) : k.y1;
    if (k.kind === 'h') FX.pumpkinBlock(ctx, GX, y + GS * 0.43, GS * 0.86, 0, true); else FX.snowBlock(ctx, GX, y, k.kind === 'b1' ? GS : GS * 0.96, 0, k.kind === 'b1' ? 1 : 2);
  }
  if (f >= G.f0 && f < G.gone) {
    const b = typeof G.blocks === 'function' ? G.blocks(f) : G.blocks;
    const jig = f < G.f0 + 10 ? Math.sin((f - G.f0) * 2) * 0.06 : 0;
    FX.snowGolem(ctx, GX, GROUND, GS, { blocks: b, head: golemHasHead(f), arm: armAt(f), rot: jig });
  }
  if (f >= PILE.f0 && f < PILE.f1) FX.snowPile(ctx, PILE.x, GROUND + 4, PILE.w, 6, 7);
});
ST.hooks.afterChars.push((ctx, f, S, CAM) => {
  ctx.setTransform(...CAM);
  // голова-тыква отдельно
  const hp = headPos(f, S), hcur = HEADS.filter((k) => f >= k.f0).pop();
  if (hp && !(hcur && hcur.gone)) FX.pumpkinBlock(ctx, hp[0], hp[1] + GS * 0.43, GS * (hcur && hcur.on === 'rb' ? 1.0 : hcur && hcur.on === 'yel' ? 1.0 : 0.86), hp[2] || 0, true);
  for (const t of TOPB) {
    const u = (f - t.f0) / (t.f1 - t.f0);
    if (u < 0 || u >= 1) continue;
    const a = P(t.a, t.f0, statesAt(t.f0)), b = P(t.b, t.f1, statesAt(t.f1));
    FX.snowBlock(ctx, E.lerp(a[0], b[0], u), E.lerp(a[1], b[1], u) - Math.sin(Math.PI * u) * t.arc, GS * 0.96, u * 4, 2);
  }
  for (const s of SNOW) {
    if (f < s.f0 || (s.f1 && f >= s.f1)) continue;
    const big = S[s.who].p.form === 'big';
    if (s.kind === 'cap') { const t = target(`${s.who}:top`, S); FX.snowCap(ctx, t[0], t[1] + (big ? 30 : 24), s.s); }
    else if (s.kind === 'splat') { const p = target(`${s.who}:face`, S); FX.snowSplat(ctx, p[0], p[1], s.s, 1, s.f0); }
    else if (s.kind === 'body' && big) { const p = target(`${s.who}:body`, S); FX.snowSplat(ctx, p[0], p[1] + 20, s.s, 1, s.f0); }
    else if (s.kind === 'legs' && big) FX.snowPile(ctx, S[s.who].p.x, GROUND + 4, s.s, 5, 3);
  }
  if (f >= ROLL.f0 && f <= ROLL.f1) {
    const u = (f - ROLL.f0) / (ROLL.f1 - ROLL.f0), r = E.lerp(ROLL.r0, ROLL.r1, u), x = E.lerp(ROLL.x0, ROLL.x1, E.EASE.in2(u));
    FX.snowball(ctx, x, GROUND - r + 4, r, (x - ROLL.x0) / 80);
  }
  for (const b of BALLS) {
    const u = (f - b.f0) / (b.f1 - b.f0);
    if (u < 0 || u >= 1) continue;
    const a = P(b.a, b.f0, statesAt(b.f0)), c = P(b.b, b.f1, statesAt(b.f1));
    FX.snowball(ctx, E.lerp(a[0], c[0], u), E.lerp(a[1], c[1], u) - Math.sin(Math.PI * u) * b.arc, 26, u * 6);
  }
  for (const b of BURST) { const at = P(b.at, b.f, statesAt(b.f)); FX.snowBurst(ctx, at[0], at[1], (f - b.f) / 18, b.size, b.f); }
});

ST.start(BIG);
