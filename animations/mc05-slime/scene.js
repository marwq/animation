// Ролик 05 (серия по образцу): Батут из слизи — Лорд против Радужного, 25 с, 24 кадра/с. Драка мягкая —
// блок слизи как батут. Превращения «рост» под присланную музыку. Фон «майнкрафт», тема «равнина»
// (подсолнухи, забор).
//
//   0–1.8 с   шарик-Лорд (слева) и радужный шарик-Скелет (справа), посередине блок слизи
//   1.8–3.7 с Радужный прыгает на слизь — его подбрасывает, и он приземляется Лорду на голову
//   3.7–4.9 с Лорд «растёт» под музыку
//   5.3–8.3 с поднимает блок слизи и роняет Радужному на голову — тот прилип и трясётся, Лорд хохочет
//   9.8–11.7 с Радужный выскакивает и «растёт» под музыку
//   12–16 с   Радужный перебрасывает слизь Лорду за спину и пугает «бу!» — Лорд отпрыгивает назад
//             прямо на слизь, и его подбрасывает за кадр
//   17–19.5 с падает вниз головой и втыкается в землю, дрыгает ногами; выскакивает — прямо на слизь,
//             и его уносит за кадр
//   20–25 с   Радужный в центре, руки вверх
'use strict';

const ST = Stage({
  name: 'mc05-slime',
  cast: {
    lord: { small: ['lord-verity-small', { bodyHeight: 300 }], big: ['lord-verity-big', { height: 730 }], pivot: 337,
      voice: 1.0, color: '#ffe23a', ouch: ['ref:hit-ow', 1.0, 0.9] },
    rb: { small: ['skeleton-verity-small', { scale: 0.455, recolor: 'rainbow' }], big: ['all-verity-color', { height: 730 }],
      pivot: 325, voice: 0.85, color: '#ff7a3a', moods: { angry: 'angry theeth', grin: 'happy with theeth', big: 'theeth smile' } },
  },
  order: ['lord', 'rb'],
  background: { theme: 'plains', seed: 51, sunX: 380, sunY: 160 },
  clouds: [[140, 80, 2.4, 0, 14], [690, 190, 1.8, 1, 18], [1180, 60, 2.6, 2, 12], [1660, 240, 1.6, 0, 20], [420, 310, 1.4, 1, 16]],
});
const { FPS, NF, GROUND, C, key, move, ev, sfx, hop, laugh, tremble, transform, stance, walk, turn, dodge, stomp,
  flyOff, victory, chuckle, hand, toRig, statesAt, stateAt, target } = ST;

// прыжок по дуге: x — равномерно, y — вверх до вершины и вниз (from/to — опоры, h — над верхней из них)
function arc(who, f0, f1, from, to, h, o = {}) {
  const mid = Math.round(f0 + (f1 - f0) * (o.k ?? 0.5));
  move(who, f0, { x: from[0], y: from[1] });
  move(who, mid, { y: Math.min(from[1], to[1]) - h }, 'out2');
  move(who, f1, { y: to[1] }, 'in2');
  move(who, f1, { x: to[0] }, 'lin');
}

// ------------------------------------------------------------------ блок слизи
const SL = 180;                                         // сторона
// положение — ключи [кадр, x, y (низ), сглаживание, дуга]; сплющивание — [кадр, sx, sy]; поверх героев — интервалы
const SLK = [[0, 1000, GROUND + 2]], SLQ = [[0, 1, 1]], FRONT = [], STUCK = [];
const slimeKey = (f, x, y, ease = 'io', arcH = 0) => SLK.push([f, x, y, ease, arcH]);
const squash = (f, n = 6) => { SLQ.push([f, 1, 1], [f + 2, 1.25, 0.62], [f + n, 0.92, 1.1], [f + n + 4, 1, 1]); sfx('squish', f, { x: slimeAt(f).x, gain: 0.8 }); };
const interp = (ks, f, fn) => {
  const s = [...ks].sort((a, b) => a[0] - b[0]);
  if (f <= s[0][0]) return fn(s[0], s[0], 1);
  for (let i = 1; i < s.length; i++) if (f < s[i][0]) return fn(s[i - 1], s[i], (f - s[i - 1][0]) / (s[i][0] - s[i - 1][0]));
  return fn(s[s.length - 1], s[s.length - 1], 1);
};
const slimeAt = (f) => {
  const [x, y] = interp(SLK, f, (a, b, u) => {
    const e = b[3] === 'arc' ? u : E.EASE[b[3] || 'io'](u);
    return [E.lerp(a[1], b[1], b[3] === 'arc' ? u : e), E.lerp(a[2], b[2], b[3] === 'arc' ? u : e) - Math.sin(Math.PI * u) * (b[4] || 0)];
  });
  const [sx, sy] = interp(SLQ, f, (a, b, u) => [E.lerp(a[1], b[1], E.EASE.io(u)), E.lerp(a[2], b[2], E.EASE.io(u))]);
  const front = FRONT.find((r) => f >= r[0] && f < r[1]);
  return { x, y, sx, sy, front: !!front, alpha: front ? front[2] : 1, arm: front ? front[3] : null };
};
// большой держит слизь двумя руками: дальняя (F) — за дальний бок, ближняя (B) — за ближний
const grips = (cx, cy, face) => ({ F: [cx + face * SL * 0.5, cy - SL * 0.05], B: [cx - face * SL * 0.42, cy + SL * 0.2] });

const LS = 560, RS = 1360;
// ================================================================== 0–1.8 с: стойка
key('lord', 0, { form: 'small', x: LS, y: GROUND, face: 1, look: 1, eyes: 'normal', mouth: 'smile normal', sx: 1, sy: 1, rot: 0 }, 0);
key('rb', 0, { form: 'small', x: RS, y: GROUND, face: -1, look: 1, eyes: 'normal', mouth: 'smile normal', sx: 1, sy: 1, rot: 0, pivot: 0 }, 0);

const LX = 560;
const BIG = () => {
  // ---- 1.8–3.7 с: Радужный на слизь — и Лорду на голову
  key('rb', 42, { eyes: 'angry', mouth: 'happy with theeth' }, 0);
  sfx('ref:grin-eee', 42, { who: 'rb', gain: 0.5, pitch: 1.2 });
  const J0 = 46, ON = 58, S0 = 1000, TOP = [S0, GROUND - SL + 4];
  key('rb', J0 - 4, { sx: 1.2, sy: 0.82 }, 4);
  key('rb', J0 + 2, { sx: 0.86, sy: 1.16 }, 2);
  arc('rb', J0, ON, [RS, GROUND], TOP, 110);
  sfx('ref:fwip', J0 + 1, { who: 'rb', gain: 0.7 });
  key('rb', ON, { sx: 1.3, sy: 0.7 }, 1);
  squash(ON);
  sfx('boing', ON + 2, { x: S0, gain: 0.9 });
  const lt = target('lord:top', stateAt(1));
  const HIT = ON + 20;
  key('rb', ON + 3, { sx: 0.82, sy: 1.22 }, 2);
  key('rb', ON + 9, { sx: 1, sy: 1, rot: 0, pivot: 150 }, 4);
  arc('rb', ON + 2, HIT, TOP, [LS + 20, lt[1] + 10], 140);
  move('rb', HIT, { rot: -360 }, 'lin');
  key('rb', HIT + 1, { rot: 0 }, 0);
  key('rb', HIT, { sx: 1.25, sy: 0.75 }, 1);
  key('lord', HIT, { sx: 1, sy: 1 }, 0);
  key('lord', HIT + 2, { sx: 1.35, sy: 0.62, mouth: 'puzzlement', eyes: 'sad' }, 2, 'out');
  key('lord', HIT + 9, { sx: 0.94, sy: 1.06 }, 6);
  key('lord', HIT + 13, { sx: 1, sy: 1 }, 4);
  ev('spark', { f: HIT, at: 'lord:top', r: 60, snd: 'boing', swing: false });
  ev('shake', { f: HIT, amp: 12, n: 10 });
  ev('stars', { who: 'lord', f0: HIT + 4, f1: HIT + 22, snd: false });
  const RB1 = 1160;
  arc('rb', HIT + 1, HIT + 15, [LS + 20, lt[1] + 10], [RB1, GROUND], 160);
  key('rb', HIT + 4, { sx: 1, sy: 1 }, 3);
  key('rb', HIT + 13, { sx: 1.2, sy: 0.82 }, 1);
  key('rb', HIT + 17, { sx: 1, sy: 1, mouth: 'happy with theeth', eyes: 'normal' }, 4);
  sfx('land', HIT + 13, { who: 'rb', gain: 0.5 });
  sfx('ref:laugh', HIT + 15, { who: 'rb', gain: 0.8, pitch: 1.35 });
  laugh('rb', HIT + 15, HIT + 30);

  // ---- 3.7–4.9 с: Лорд «растёт»
  const LB = transform('lord', HIT + 12, LS, LX, 1, { style: 'grow' });
  key('rb', LB - 2, { mouth: 'puzzlement', eyes: 'sad' }, 0);
  ev('sweat', { who: 'rb', f0: LB, f1: LB + 24 });
  sfx('scared', LB + 1, { who: 'rb', gain: 0.7 });
  const RB2 = 1300;
  hop('rb', LB + 4, LB + 16, RB1, RB2, 80);
  key('lord', LB, stance('lord', LX, 1), 0);
  key('lord', LB + 6, { mouth: 'happy with theeth', eyes: 'angry' }, 0);

  // ---- 5.3–8.3 с: поднимает слизь и роняет на Радужного
  const L1 = 840;
  walk('lord', LB + 8, LX, L1, 2, 10, 1);
  const GR = LB + 36, UP = GR + 10, HI = UP + 10, TH = HI + 10, LAND = TH + 16;
  key('lord', GR - 8, { lean: 26, hip: [0, toRig('lord', 110)], head: 10 }, 8);
  let g = grips(S0, GROUND - SL / 2, 1);
  key('lord', GR, { hitF: 1, hitFto: g.F, hitB: 1, hitBto: g.B }, 6);
  sfx('squish', GR, { x: S0, gain: 0.5 });
  const C1 = [L1 + 140, GROUND - 330], C2 = [L1 + 150, GROUND - 515];
  slimeKey(GR, S0, GROUND + 2);
  slimeKey(UP, C1[0], C1[1] + SL / 2);
  slimeKey(HI, C2[0], C2[1] + SL / 2);
  FRONT.push([GR, TH, 1, 'B']);
  g = grips(...C1, 1);
  key('lord', UP, { hitFto: g.F, hitBto: g.B, lean: -4, hip: [0, toRig('lord', 20)], head: 0 }, 8);
  g = grips(...C2, 1);
  key('lord', HI, { hitFto: g.F, hitBto: g.B, lean: -10, head: -8 }, 8);
  sfx('ref:grunt', UP, { who: 'lord', gain: 0.8, pitch: 0.95 });
  key('lord', TH, { hitF: 0, hitB: 0, handF: hand('lord', 'F', 0.95, -0.45), handB: hand('lord', 'B', 0.95, -0.35), lean: 12, head: 0 }, 4, 'in2');
  key('lord', TH + 14, stance('lord', L1, 1, { mouth: 'happy with theeth' }), 10);
  sfx('swing', TH - 3, { who: 'lord', gain: 0.8 });
  const head = target('rb:top', stateAt(LAND));
  slimeKey(LAND, RB2, head[1] + 30, 'arc', 160);
  sfx('whoosh', TH, { x: 1100, dur: 14, gain: 0.5 });
  key('rb', TH + 4, { mouth: 'puzzlement', eyes: 'sad' }, 0);
  // прилип: слизь на голове, трясётся вместе с ним
  FRONT.push([LAND, LAND + 46, 1, null]);
  key('rb', LAND, { sx: 1, sy: 1 }, 0);
  key('rb', LAND + 2, { sx: 1.2, sy: 0.8 }, 2, 'out');
  key('rb', LAND + 8, { sx: 1.06, sy: 0.94 }, 5);
  squash(LAND, 8);
  sfx('boing', LAND + 1, { x: RB2, gain: 0.6 });
  sfx('hurt', LAND + 3, { who: 'rb', gain: 0.6 });
  for (let f = LAND + 14; f < LAND + 40; f += 6) SLQ.push([f, 1.06, 0.95], [f + 3, 0.96, 1.05]);
  SLQ.push([LAND + 42, 1, 1]);
  slimeKey(LAND + 44, RB2, head[1] + 30);
  tremble('rb', LAND + 4, LAND + 40, RB2, 4);
  sfx('squish', LAND + 16, { x: RB2, gain: 0.5 });
  sfx('squish', LAND + 30, { x: RB2, gain: 0.5 });
  key('lord', LAND + 2, { mouth: 'happy with theeth', eyes: 'normal' }, 0);
  sfx('ref:laugh', LAND + 4, { who: 'lord', gain: 0.85, pitch: 0.9 });
  chuckle('lord', LAND + 4, LAND + 32, { mouth: 'happy with theeth' });

  // ---- 9.8–11.7 с: выскакивает и «растёт»
  const POP = LAND + 46, RB3 = 1500;
  squash(POP, 6);
  slimeKey(POP + 10, RB2 - 40, GROUND + 2, 'in2');                // слизь падает с головы на траву
  sfx('squish', POP + 10, { x: RB2, gain: 0.6 });
  sfx('pop', POP, { who: 'rb', gain: 1.0 });
  key('rb', POP, { sx: 0.8, sy: 1.25, mouth: 'angry theeth', eyes: 'angry' }, 2);
  arc('rb', POP, POP + 14, [RB2, GROUND], [RB3, GROUND], 220);
  key('rb', POP + 14, { sx: 1.2, sy: 0.82 }, 1);
  key('rb', POP + 18, { sx: 1, sy: 1 }, 4);
  sfx('land', POP + 14, { who: 'rb', gain: 0.5 });
  const RX = 1500;
  const RB = transform('rb', POP + 18, RB3, RX, -1, { style: 'grow' });
  key('rb', RB, stance('rb', RX, -1), 0);
  key('rb', RB + 6, { mouth: 'theeth smile', eyes: 'angry' }, 0);
  key('lord', RB - 2, { mouth: 'puzzlement', eyes: 'sad' }, 0);
  ev('sweat', { who: 'lord', f0: RB, f1: RB + 22 });

  // ---- 12–16 с: перебрасывает слизь Лорду за спину и пугает «бу!» — Лорд отпрыгивает прямо на слизь
  const R1 = 1440, SX1 = RB2 - 40;
  walk('rb', RB + 8, RX, R1, 1, 10, -1);
  const G2 = RB + 26, UP2 = G2 + 10, HI2 = UP2 + 8, TH2 = HI2 + 8, LAND2 = TH2 + 22, BEHIND = 600;
  key('rb', G2 - 8, { lean: 26, hip: [0, toRig('rb', 110)], head: 10, mouth: 'happy with theeth' }, 8);
  g = grips(SX1, GROUND - SL / 2, -1);
  key('rb', G2, { hitF: 1, hitFto: g.F, hitB: 1, hitBto: g.B }, 6);
  sfx('squish', G2, { x: SX1, gain: 0.5 });
  const D1 = [R1 - 140, GROUND - 330], D2 = [R1 - 150, GROUND - 515];
  slimeKey(G2, SX1, GROUND + 2);
  slimeKey(UP2, D1[0], D1[1] + SL / 2);
  slimeKey(HI2, D2[0], D2[1] + SL / 2);
  FRONT.push([G2, TH2, 1, 'B']);
  g = grips(...D1, -1);
  key('rb', UP2, { hitFto: g.F, hitBto: g.B, lean: -4, hip: [0, toRig('rb', 20)], head: 0 }, 8);
  g = grips(...D2, -1);
  key('rb', HI2, { hitFto: g.F, hitBto: g.B, lean: -10, head: -8 }, 7);
  key('rb', TH2, { hitF: 0, hitB: 0, handF: hand('rb', 'F', 0.95, -0.7), handB: hand('rb', 'B', 0.95, -0.6), lean: 10, head: -4 }, 4, 'in2');
  key('rb', TH2 + 14, stance('rb', R1, -1, { mouth: 'happy with theeth' }), 10);
  sfx('swing', TH2 - 3, { who: 'rb', gain: 0.8 });
  slimeKey(LAND2, BEHIND, GROUND + 2, 'arc', 400);
  sfx('whoosh', TH2, { x: 900, dur: 20, gain: 0.5 });
  squash(LAND2, 6);
  key('lord', TH2 + 2, { head: -16, mouth: 'puzzlement', eyes: 'normal' }, 6);           // смотрит вверх
  key('lord', LAND2, { head: 0 }, 6);
  // «бу!» — прыжок вперёд, руки вверх
  const BOO = LAND2 + 8, R2 = 1270;
  stomp('rb', BOO, R1, R2, -1, { h: 36 });
  key('rb', BOO + 10, { handF: hand('rb', 'F', 0.5, -0.9), handB: hand('rb', 'B', 0.4, -0.95), mouth: 'happy open mouth', lean: 12 }, 3);
  key('rb', BOO + 26, stance('rb', R2, -1, { mouth: 'happy with theeth' }), 8);
  sfx('ref:grunt', BOO + 8, { who: 'rb', gain: 1.0, pitch: 0.8 });
  sfx('scared', BOO + 12, { who: 'lord', gain: 0.9 });
  ev('sweat', { who: 'lord', f0: BOO + 12, f1: BOO + 26 });
  // отпрыгнул назад — прямо на слизь — и его подбрасывает за кадр
  const JB = BOO + 14, ONS = JB + 10, STAND = [BEHIND, GROUND - SL + 6];
  key('lord', JB - 2, { hip: [0, toRig('lord', 30)], mouth: 'puzzlement', eyes: 'sad' }, 2);
  key('lord', JB, { legFfk: 1, legBfk: 1, legF: [12, -24], legB: [-14, 26], lean: -14, head: -6 }, 3);
  arc('lord', JB, ONS, [L1, GROUND], STAND, 60);
  sfx('jump', JB + 1, { who: 'lord', gain: 0.5 });
  const flail = { legFfk: 1, legBfk: 1, legF: [-30, 40], legB: [25, 35], handF: hand('lord', 'F', 0.3, -0.95), handB: hand('lord', 'B', -0.3, -0.9),
    mouth: 'puzzlement', eyes: 'sad', lean: 0, head: -6, hip: [0, 0] };
  key('lord', ONS, { ...C.lord.big.feet(BEHIND, 1), hip: [0, toRig('lord', 40)] }, 2);
  squash(ONS, 6);
  sfx('boing', ONS + 1, { x: BEHIND, gain: 1.0 });
  key('lord', ONS + 3, flail, 3);
  move('lord', ONS + 2, { x: BEHIND, y: STAND[1] });
  move('lord', ONS + 18, { y: -1400 }, 'in');
  sfx('whoosh', ONS + 2, { who: 'lord', dur: 16, gain: 0.6 });
  sfx('ref:hit-ow', ONS + 4, { who: 'lord', gain: 0.8, pitch: 1.1 });
  key('rb', ONS + 6, { mouth: 'happy with theeth', eyes: 'normal' }, 0);
  sfx('ref:laugh', ONS + 8, { who: 'rb', gain: 0.85, pitch: 1.2 });
  chuckle('rb', ONS + 8, ONS + 40, { mouth: 'happy with theeth' });

  // ---- 17–19.5 с: падает вниз головой — втыкается в землю, дрыгает ногами
  const K = C.lord.big, PV = (K.anchor[1] - K.top) / 2, pv = PV * K.scale, HX = 900;
  const FALL = ONS + 30, BANG = FALL + 10;
  key('lord', FALL - 1, { pivot: PV, rot: 180, legFfk: 1, legBfk: 1, legF: [-10, 30], legB: [15, 20], head: 0,
    handF: hand('lord', 'F', 0.1, -0.95), handB: hand('lord', 'B', 0, -0.95) }, 0);
  move('lord', FALL, { x: HX, y: -600 });
  move('lord', BANG, { x: HX, y: GROUND + 120 - K.height + 2 * pv }, 'in2');
  STUCK.push([BANG, BANG + 36, HX]);
  sfx('whoosh', FALL - 4, { who: 'lord', dur: 14, gain: 0.8 });
  ev('dust', { f: BANG, x: HX, r: 90, n: 8, snd: 'slam' });
  ev('shake', { f: BANG, amp: 24, n: 16 });
  ev('zoom', { f: BANG, n: 14, k: 0.07, at: [HX, GROUND - 200] });
  sfx('ref:hit-ow', BANG + 2, { who: 'lord', gain: 0.8, pitch: 0.8 });
  for (let f = BANG + 4; f < BANG + 30; f += 6) key('lord', f, { legF: (f / 6) % 2 ? [-40, 70] : [10, 10], legB: (f / 6) % 2 ? [10, 10] : [-40, 70] }, 3);
  // ---- выскакивает — прямо на слизь — и улетает за кадр
  const POP2 = BANG + 32, ONS2 = POP2 + 16;
  move('lord', POP2, { x: HX, y: GROUND + 120 - K.height + 2 * pv, rot: 180 });
  move('lord', POP2 + 9, { y: GROUND - 520 }, 'out2');
  move('lord', ONS2, { x: BEHIND, y: STAND[1] }, 'in2');
  move('lord', POP2, { x: HX });
  move('lord', ONS2, { x: BEHIND }, 'lin');
  move('lord', ONS2 - 4, { rot: 360 }, 'io');
  key('lord', ONS2 - 3, { pivot: 0, rot: 0, ...flail }, 0);
  sfx('pop', POP2, { who: 'lord', gain: 1.0 });
  ev('dust', { f: POP2, x: HX, r: 50, n: 6, snd: false });
  sfx('scared', POP2 + 2, { who: 'lord', gain: 0.8 });
  squash(ONS2, 6);
  sfx('boing', ONS2 + 1, { x: BEHIND, gain: 1.0 });
  flyOff('lord', ONS2 + 2, ONS2 + 26, STAND, [-420, -320], { turns: 2 });
  key('rb', POP2 + 4, { mouth: 'happy with theeth', eyes: 'normal' }, 0);
  sfx('ref:laugh', ONS2 + 6, { who: 'rb', gain: 0.85, pitch: 1.2 });
  victory('rb', ONS2 + 10, R2, { n: 9, stride: 110 });
  window.T = { LB, RB, BOO, ONS, BANG, ONS2 };
};

ST.hooks.beforeChars.push((ctx, f, S, CAM) => {
  const s = slimeAt(f);
  if (s.front) return;
  ctx.setTransform(...CAM);
  FX.slimeBlock(ctx, s.x, s.y, SL, s.sx, s.sy);
});
ST.hooks.afterChars.push((ctx, f, S, CAM) => {
  for (const [f0, f1, x] of STUCK) {                // голова «под землёй»: поверх кусок фона и холмик
    if (f < f0 || f >= f1) continue;
    ctx.setTransform(...CAM);
    ST.bgPatch(ctx, x - 190, GROUND + 6, 380, 220);
    for (const [dx, r] of [[-80, 30], [-35, 40], [15, 38], [62, 30]]) FX.puff(ctx, x + dx, GROUND + 4, r, 1, '#8b5a2b', '#4a2a10');
  }
  const s = slimeAt(f);
  if (!s.front) return;
  ctx.setTransform(...CAM);
  FX.slimeBlock(ctx, s.x, s.y, SL, s.sx, s.sy, s.alpha);
  if (s.arm) {                                     // ближняя рука того, кто держит, — поверх блока
    const who = ['lord', 'rb'].find((w) => S[w].p.form === 'big' && S[w].p.hitB > 0.5);
    if (who) { const { ch, st, p } = S[who]; ch.draw(ctx, { ...st, p: { ...p, only: 'B' } }, CAM); }
  }
});

ST.start(BIG);
