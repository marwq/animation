// Ролик 14 (серия по образцу): Вагонетка — Скелет против Малыша, 25 с, 24 кадра/с. Плотно, как у HugyTi:
// рельсы с горками по краям, вагонетка взлетает и надевается на головы, превращения туда и обратно.
// Музыка превращения — присланная, ~4 с с затиханием. Фон «майнкрафт», тема «саванна».
//
//   0–1.8 с   шарик-Скелет (слева), шарик-Малыш сидит в вагонетке на рельсах
//   1.8–3.5 с Скелет дует — вагонетка с Малышом мчится вправо, взлетает с горки; Малыш падает, вагонетка
//             вверх дном надевается ему на голову
//   3.8–5 с   Малыш «растёт» — вагонетка слетает и встаёт на рельсы
//   5.3–8.3 с Малыш толкает вагонетку — она подхватывает шарик-Скелета и улетает с левой горки в небо;
//             Скелет шлёпается обратно, вагонетка падает на рельсы
//   8.3–9.7 с Скелет «растёт»
//   9.8–11.8 с машет крыльями — вагонетка мчится вправо, взлетает и надевается Малышу на голову
//   11.8–15.2 с Малыш вслепую шатается, срывает вагонетку и несёт над головой — надевает её Скелету
//   15.5–18 с «пуф» — Скелет сжимается и падает в вагонетку; злится и «растёт» снова, стоя в ней
//   18.3–19.5 с Малыш толкает вагонетку — Скелет укатывается на левую горку и улетает в небо, хлопая крыльями
//   19.5–25 с Малыш в центре, руки вверх
'use strict';

const ST = Stage({
  name: 'mc14-minecart',
  musicOnce: false,                       // музыка при каждом превращении (как было при рендере)
  cast: {
    skel: { small: ['skeleton-verity-small', { scale: 0.455 }], big: ['skeleton-verity-big', { height: 730 }], pivot: 325,
      voice: 0.9, lie: 60, color: '#f3f1e6', moods: { angry: 'angry theeth', grin: 'happy with theeth', big: 'theeth smile' } },
    baby: { small: ['child-verity-pink', { bodyHeight: 300, spin: { layer: 'hat', cut: 122, axis: 389 } }],
      big: ['child-verity-big', { height: 730, spin: { layer: 'hat', cut: 106, axis: 330 } }], pivot: 338, voice: 1.25,
      lie: 60, color: '#ffd9b8', moods: { angry: ' 2', grin: ' 2', big: 'theeth smile', love: ' 1' } },
  },
  order: ['skel', 'baby'],
  background: { theme: 'savanna', seed: 141, sunX: 960, sunY: 130 },
  clouds: [[120, 80, 2.4, 0, 12], [640, 210, 1.8, 1, 16], [1250, 70, 2.6, 2, 10], [1650, 250, 1.6, 0, 18], [380, 300, 1.4, 1, 14]],
});
const { FPS, NF, GROUND, C, key, move, ev, sfx, tumble, laugh, tremble, transform, shrink, stance, walk,
  victory, chuckle, hand, toRig, statesAt, stateAt, target } = ST;

// крылья большого Скелета: взмахи (кости B16, B17)
function flap(f0, f1, gain = 0.6) {
  for (let f = f0; f < f1; f += 6) {
    key('skel', f, { b_B16: -30, b_B17: 30 }, 3);
    key('skel', f + 3, { b_B16: 46, b_B17: -46 }, 3, 'in');
  }
  key('skel', f1, { b_B16: 0, b_B17: 0 }, 4);
  sfx('gust', f0, { who: 'skel', dur: f1 - f0, gain });
}

// ------------------------------------------------------------------ рельсы с горками, вагонетка
const RY = GROUND - 14, HY = GROUND - 224;           // верх рельса внизу и на горках
const LR1 = 140, LR0 = 400, RR0 = 1520, RR1 = 1780;   // левая горка: LR1 (верх) .. LR0 (низ); правая: RR0 .. RR1
const railY = (x) => (x < LR1 ? HY : x < LR0 ? E.lerp(HY, RY, (x - LR1) / (LR0 - LR1)) : x < RR0 ? RY : x < RR1 ? E.lerp(RY, HY, (x - RR0) / (RR1 - RR0)) : HY);
const SLOPE = Math.atan2(HY - RY, RR1 - RR0);         // −0.68 на правой горке
const slope = (x) => (x > LR1 && x < LR0 ? -SLOPE : x > RR0 && x < RR1 ? SLOPE : 0);
const CW = 240, CUP = CW * 0.1 * 2 + CW * 0.46 / 2 - 4;   // ширина вагонетки; от низа колёс до середины ящика
const CT = new E.Track();                            // x, y (низ колёс, если free), rot, free, sq
const ck = (f, props, n = null, ease = 'io') => CT.add(f, props, ease, n);
const CPOS = [{ f0: 0 }];                            // {f0} — по ключам | {f0, head: who} | {f0, hands: who}
function cartWorld(f) {
  const p = CT.sample(f, {});
  if (p.free > 0.5) return { x: p.x, y: p.y, rot: p.rot, sq: p.sq };
  return { x: p.x, y: railY(p.x), rot: slope(p.x) + p.rot, sq: p.sq };
}
const headPt = (who, S) => { const t = target(`${who}:top`, S), big = S[who].p.form === 'big'; return { x: t[0], y: t[1] + (big ? 78 : 26) }; };
const handsPt = (who, S) => {
  const a = C[who].big.point(S[who].st, 'handF'), b = C[who].big.point(S[who].st, 'handB');
  return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2 - 30];
};
function cartAt(f, S) {
  let m = CPOS[0];
  for (const c of CPOS) if (f >= c.f0) m = c;
  if (m.head) return { ...headPt(m.head, S), rot: Math.PI, sq: 1, center: true };
  if (m.fly) {
    const u = E.clamp((f - m.f0) / (m.f1 - m.f0), 0, 1), a = m.a(statesAt(m.f0)), b = m.b(S);
    return { x: E.lerp(a[0], b[0], u), y: E.lerp(a[1], b[1], u) - Math.sin(Math.PI * u) * m.arc, rot: Math.PI, sq: 1, center: true };
  }
  if (m.hands) { const h = handsPt(m.hands, S); return { x: h[0], y: h[1], rot: Math.PI, sq: 1, center: true }; }
  return cartWorld(f);
}
// едет в вагонетке: x/y по вагонетке каждый кадр (у большого и стопы)
const RIDE_S = 50;                                   // шарик: от низа колёс до опоры шарика
function ride(who, f0, f1, dy = RIDE_S, face = 1) {
  for (let f = f0; f <= f1; f++) {
    const c = cartWorld(f);
    move(who, f, { x: c.x, y: c.y - dy });
    if (stateAt(f)[who].p.form === 'big') key(who, f, { ...C[who].big.feet(c.x, face) }, 1, 'lin');
  }
}
const BURSTS = [];

const SS = 480, C0 = 1120;
// ================================================================== 0–1.8 с: стойка
ck(0, { x: C0, y: RY, rot: 0, free: 0, sq: 1 }, 0);
key('skel', 0, { form: 'small', x: SS, y: GROUND, face: 1, look: 1, eyes: 'normal', mouth: 'smile normal', sx: 1, sy: 1, rot: 0, pivot: 0, alpha: 1 }, 0);
key('baby', 0, { form: 'small', x: C0, y: RY - RIDE_S, face: -1, look: 1, eyes: 'normal', mouth: ' 4', sx: 1, sy: 1, rot: 0, pivot: 0, alpha: 1 }, 0);

const BIG = () => {
  // ---- 1.8–3.5 с: Скелет дует — вагонетка с Малышом взлетает с правой горки
  key('skel', 36, { mouth: 'happy with theeth', eyes: 'angry' }, 0);
  key('skel', 40, { sx: 1.1, sy: 0.94, mouth: 'puzzlement' }, 4);
  key('skel', 44, { sx: 0.93, sy: 1.07 }, 2);
  key('skel', 58, { sx: 1, sy: 1, mouth: 'happy with theeth' }, 6);
  ev('wind', { f0: 44, f1: 62, x0: SS + 140, x1: 1500, snd: false });
  sfx('gust', 44, { who: 'skel', dur: 16, gain: 0.8 });
  ck(46, { x: C0 }, 0);
  ck(58, { x: RR0 }, null, 'in');
  ck(62, { x: RR1 }, null, 'lin');
  sfx('creak', 46, { x: C0, dur: 14, gain: 0.5 });
  ride('baby', 46, 62);
  key('baby', 50, { mouth: ' 5', eyes: 'sad' }, 0);
  sfx('scared', 52, { who: 'baby', gain: 0.8 });
  // взлёт: вагонетка и Малыш врозь
  const L1 = 62, BL = 78, HEAD1 = 84, BX0 = 1560;
  ck(L1, { free: 1, x: RR1, y: HY, rot: SLOPE }, 0);
  ck(L1 + 10, { y: 150 }, 10, 'out2');
  const headTop = target('baby:top', stateAt(1));                       // макушка шарика над опорой
  const hY = headTop[1] - GROUND + 26;
  ck(HEAD1, { x: BX0, y: GROUND + hY - CUP, rot: -3 * Math.PI }, null, 'in2');
  ck(HEAD1, { x: BX0 }, HEAD1 - L1, 'lin');
  sfx('whoosh', L1, { x: RR1, dur: 16, gain: 0.6 });
  move('baby', L1, { x: RR1, y: HY - RIDE_S });
  move('baby', L1 + 8, { y: 230 }, 'out2');
  move('baby', BL, { y: GROUND }, 'in2');
  move('baby', BL, { x: BX0 }, 'lin');
  key('baby', L1, { pivot: 150 }, 0);
  move('baby', L1, { rot: 0 });
  move('baby', BL, { rot: -360 }, 'lin');
  key('baby', BL + 1, { rot: 0 }, 0);
  key('baby', BL, { sx: 1.25, sy: 0.8 }, 1);
  key('baby', BL + 4, { sx: 1, sy: 1 }, 3);
  sfx('land', BL, { who: 'baby', gain: 0.6 });
  ev('dust', { f: BL, x: BX0, r: 40, n: 5 });
  CPOS.push({ f0: HEAD1, head: 'baby' });
  sfx('slam', HEAD1, { who: 'baby', gain: 0.9 });
  sfx('bonk', HEAD1, { who: 'baby', gain: 0.6 });
  key('baby', HEAD1, { sx: 1.15, sy: 0.86, mouth: ' 2', eyes: 'sad' }, 1);
  key('baby', HEAD1 + 4, { sx: 1, sy: 1 }, 3);
  ev('stars', { who: 'baby', f0: HEAD1 + 2, f1: HEAD1 + 16, snd: false });
  key('skel', HEAD1 - 2, { mouth: 'happy with theeth', eyes: 'normal' }, 0);
  sfx('ref:laugh', HEAD1, { who: 'skel', gain: 0.85, pitch: 1.2 });
  laugh('skel', HEAD1, HEAD1 + 18);

  // ---- 3.8–5 с: Малыш «растёт» — вагонетка слетает и встаёт на рельсы
  const BX = 1450, BB = transform('baby', HEAD1 + 8, BX0, BX, -1, { style: 'grow' });
  key('baby', BB, stance('baby', BX, -1), 0);
  key('baby', BB + 6, { mouth: 'angry theeth', eyes: 'angry' }, 0);
  key('skel', BB - 2, { mouth: 'puzzlement', eyes: 'sad' }, 0);
  ev('sweat', { who: 'skel', f0: BB, f1: BB + 20 });
  const pre = cartAt(BB - 1, stateAt(BB - 1)), C1 = 1290, CL = BB + 14;
  CPOS.push({ f0: BB });
  ck(BB, { free: 1, x: pre.x, y: pre.y - CUP, rot: Math.PI }, 0);
  ck(BB + 7, { y: pre.y - 260 }, 7, 'out2');
  ck(CL, { y: RY, x: C1, rot: 2 * Math.PI }, 7, 'in2');
  ck(CL, { x: C1 }, 14, 'lin');
  ck(CL + 1, { free: 0, rot: 0 }, 0);
  sfx('pop', BB, { who: 'baby', gain: 0.6 });
  sfx('land', CL, { x: C1, gain: 0.7 });

  // ---- 5.3–8.3 с: толкает вагонетку — Скелет улетает с левой горки и шлёпается обратно
  const PU = CL + 8;
  key('baby', PU - 8, { lean: 22, hip: [0, toRig('baby', 90)], head: 6 }, 8);
  key('baby', PU, { hitF: 1, hitFto: [C1 + CW / 2 - 10, RY - 90], hitFfix: PU }, 6);
  key('baby', PU + 8, { ...stance('baby', BX, -1), hitF: 0, mouth: 'happy with theeth', eyes: 'normal' }, 8);
  sfx('slap', PU, { x: C1, gain: 0.5 });
  const GO = PU + 1, SCOOP = GO + Math.round(28 * (C1 - SS) / (C1 - LR0)), BOT = GO + 28, L2 = BOT + 5;
  ck(GO, { x: C1 }, 0);
  ck(BOT, { x: LR0 }, null, 'lin');
  ck(L2, { x: LR1 }, null, 'lin');
  sfx('creak', GO, { x: C1, dur: 28, gain: 0.5 });
  key('skel', SCOOP - 6, { mouth: 'puzzlement', eyes: 'sad' }, 0);
  sfx('scared', SCOOP - 4, { who: 'skel', gain: 0.8 });
  ride('skel', SCOOP, L2);
  ck(L2, { free: 1, x: LR1, y: HY, rot: -SLOPE }, 0);
  ck(L2 + 12, { x: -250, y: -420, rot: -SLOPE - 2 * Math.PI }, 12, 'out2');
  move('skel', L2 + 12, { x: -250, y: -420 - RIDE_S }, 'out2');
  sfx('whoosh', L2, { x: LR1, dur: 12, gain: 0.7 });
  ev('twinkle', { f: L2 + 10, at: [90, 110], n: 20, size: 56 });
  key('baby', SCOOP + 4, { mouth: 'happy with theeth' }, 0);
  sfx('ref:laugh', SCOOP + 6, { who: 'baby', gain: 0.85, pitch: 1.25 });
  chuckle('baby', SCOOP + 6, SCOOP + 30, { mouth: 'happy with theeth' });
  // шлёпается обратно; вагонетка падает на рельсы
  const SX = 560, FALL = L2 + 22, SL = FALL + 10;
  move('skel', FALL, { x: SX - 40, y: -320 });
  move('skel', SL, { x: SX, y: GROUND }, 'in2');
  key('skel', FALL, { pivot: 150, sx: 0.9, sy: 1.1 }, 0);
  move('skel', FALL, { rot: 0 });
  move('skel', SL, { rot: 540 }, 'lin');
  key('skel', SL + 1, { rot: 0, sx: 1.3, sy: 0.75 }, 0);
  key('skel', SL + 6, { sx: 1, sy: 1 }, 5);
  sfx('fall', SL, { who: 'skel', gain: 0.9 });
  sfx('ref:grunt', SL + 2, { who: 'skel', gain: 0.6, pitch: 1.3 });
  ev('dust', { f: SL, x: SX, r: 50, n: 6 });
  ev('shake', { f: SL, amp: 8, n: 6 });
  ev('stars', { who: 'skel', f0: SL + 2, f1: SL + 22, snd: false });
  const C2 = 800, CF = SL + 8, CD = CF + 10;
  ck(CF, { x: C2 - 30, y: -300, rot: -0.6 }, 0);
  ck(CD, { x: C2, y: RY, rot: 0 }, 10, 'in2');
  ck(CD + 1, { free: 0 }, 0);
  sfx('slam', CD, { x: C2, gain: 0.8 });
  ev('dust', { f: CD, x: C2, r: 50, n: 6 });

  // ---- 8.3–9.7 с: Скелет «растёт»
  key('skel', SL + 14, { eyes: 'angry', mouth: 'angry theeth' }, 0);
  const SB = transform('skel', SL + 18, SX, SX, 1, { style: 'grow' });
  key('skel', SB, stance('skel', SX, 1), 0);
  key('skel', SB + 6, { mouth: 'happy with theeth', eyes: 'angry' }, 0);
  key('baby', SB - 2, { mouth: 'puzzlement', eyes: 'sad' }, 0);

  // ---- 9.8–11.8 с: машет крыльями — вагонетка взлетает с правой горки и надевается Малышу на голову
  flap(SB + 4, SB + 34, 0.9);
  key('skel', SB + 4, { lean: 8, mouth: 'happy open mouth' }, 4);
  key('skel', SB + 36, { lean: 0, mouth: 'happy with theeth' }, 6);
  ev('wind', { f0: SB + 6, f1: SB + 36, x0: SX + 260, x1: 1900, snd: false });
  ck(SB + 8, { x: C2 }, 0);
  ck(SB + 22, { x: RR0 }, null, 'in');
  ck(SB + 26, { x: RR1 }, null, 'lin');
  sfx('creak', SB + 8, { x: C2, dur: 14, gain: 0.5 });
  key('baby', SB + 8, { lean: -10, head: -6, handF: hand('baby', 'F', 0.5, -0.7), handB: hand('baby', 'B', 0.2, -0.85) }, 5);
  const L3 = SB + 26, HEAD2 = L3 + 18;
  const bt = target('baby:top', stateAt(HEAD2));
  ck(L3, { free: 1, x: RR1, y: HY, rot: SLOPE }, 0);
  ck(L3 + 8, { y: 60 }, 8, 'out2');
  ck(HEAD2, { x: bt[0], y: bt[1] + 78 - CUP, rot: -3 * Math.PI }, 10, 'in2');
  ck(HEAD2, { x: bt[0] }, HEAD2 - L3, 'lin');
  sfx('whoosh', L3, { x: RR1, dur: 16, gain: 0.6 });
  CPOS.push({ f0: HEAD2, head: 'baby' });
  sfx('slam', HEAD2, { who: 'baby', gain: 1.0 });
  sfx('bonk', HEAD2, { who: 'baby', gain: 0.6 });
  ev('shake', { f: HEAD2, amp: 8, n: 6 });
  key('baby', HEAD2, { sx: 1.06, sy: 0.94, mouth: 'puzzlement', eyes: 'sad', lean: 0, head: 0 }, 1);
  key('baby', HEAD2 + 4, { sx: 1, sy: 1 }, 3);
  key('skel', HEAD2 + 2, { mouth: 'happy with theeth', eyes: 'normal' }, 0);
  sfx('ref:laugh', HEAD2 + 4, { who: 'skel', gain: 0.85, pitch: 1.0 });
  chuckle('skel', HEAD2 + 4, HEAD2 + 28, { mouth: 'happy with theeth' });

  // ---- 11.8–15.2 с: шатается вслепую, срывает вагонетку и несёт над головой — надевает её Скелету
  for (let i = 0; i < 3; i++) {
    const f = HEAD2 + 6 + i * 7, d = i % 2 ? 1 : -1;
    key('baby', f, { lean: 9 * d, handF: hand('baby', 'F', 0.75, -0.2 + 0.2 * d), handB: hand('baby', 'B', 0.6, -0.2 - 0.2 * d) }, 4);
  }
  sfx('ref:grunt', HEAD2 + 8, { who: 'baby', gain: 0.6, pitch: 1.25 });
  const OFF = HEAD2 + 30;
  key('baby', OFF - 6, { lean: 0, handF: hand('baby', 'F', 0.25, -1.0), handB: hand('baby', 'B', 0.05, -1.0) }, 6);
  CPOS.push({ f0: OFF, hands: 'baby' });
  sfx('pop', OFF, { who: 'baby', gain: 0.6 });
  key('baby', OFF + 2, { mouth: 'angry theeth', eyes: 'angry' }, 0);
  ev('vein', { who: 'baby', f0: OFF + 2, f1: OFF + 16 });
  const BX2 = 1190, WK = OFF + 8;
  walk('baby', WK, BX, BX2, 3, 9, -1, false);
  key('skel', WK + 18, { mouth: 'puzzlement', eyes: 'sad' }, 0);
  ev('sweat', { who: 'skel', f0: WK + 18, f1: WK + 44 });
  const THR = WK + 27 + 8, SLAM2 = THR + 12;
  key('baby', THR - 6, { handF: hand('baby', 'F', -0.1, -1.0), handB: hand('baby', 'B', -0.25, -0.95), lean: -8 }, 6);
  key('baby', THR, { handF: hand('baby', 'F', 0.85, -0.6), handB: hand('baby', 'B', 0.7, -0.65), lean: 12 }, 4, 'in2');
  sfx('swing', THR - 3, { who: 'baby', gain: 0.8 });
  CPOS.push({ f0: THR, f1: SLAM2, fly: true, a: (S) => handsPt('baby', S), b: (S) => { const h = headPt('skel', S); return [h.x, h.y]; }, arc: 160 });
  sfx('whoosh', THR, { who: 'baby', dur: 10, gain: 0.6 });
  CPOS.push({ f0: SLAM2, head: 'skel' });
  sfx('slam', SLAM2, { who: 'skel', gain: 1.0 });
  sfx('bonk', SLAM2, { who: 'skel', gain: 0.7 });
  ev('shake', { f: SLAM2, amp: 10, n: 6 });
  key('baby', SLAM2 + 8, { ...stance('baby', BX2, -1), mouth: 'happy with theeth', eyes: 'normal' }, 8);
  sfx('ref:laugh', SLAM2 + 6, { who: 'baby', gain: 0.85, pitch: 1.25 });
  chuckle('baby', SLAM2 + 6, SLAM2 + 26, { mouth: 'happy with theeth' });
  for (let i = 0; i < 3; i++) {                      // Скелет машет руками
    const f = SLAM2 + 2 + i * 7;
    key('skel', f, { handF: hand('skel', 'F', 0.4, -0.95), handB: hand('skel', 'B', -0.4, -0.7) }, 3);
    key('skel', f + 4, { handF: hand('skel', 'F', 0.7, -0.6), handB: hand('skel', 'B', -0.2, -0.95) }, 3);
    sfx('ref:grunt', f + 1, { who: 'skel', gain: 0.5, pitch: 0.8 });
  }

  // ---- 15.5–18 с: пуф — шарик-Скелет в вагонетке; злится и «растёт» снова, стоя в ней
  const PF = SLAM2 + 24;
  const sm = shrink('skel', PF, SX, 1, { mouth: 'puzzlement', eyes: 'sad', smoke: 380 });
  key('skel', sm, { lean: 0, head: 0, hip: [0, 0] }, 0);
  const hp = cartAt(PF - 1, stateAt(PF - 1)), CD2 = PF + 10;
  CPOS.push({ f0: PF });
  ck(PF, { free: 1, x: hp.x, y: hp.y - CUP, rot: Math.PI }, 0);
  ck(CD2, { x: SX, y: RY, rot: 2 * Math.PI }, 10, 'in2');
  ck(CD2 + 1, { free: 0, rot: 0 }, 0);
  sfx('slam', CD2, { x: SX, gain: 0.8 });
  move('skel', CD2, { x: SX, y: GROUND });
  move('skel', CD2 + 4, { y: RY - RIDE_S }, 'out2');
  ev('stars', { who: 'skel', f0: CD2 + 2, f1: CD2 + 18, snd: false });
  key('skel', CD2 + 16, { mouth: 'angry theeth', eyes: 'angry' }, 0);
  ev('vein', { who: 'skel', f0: CD2 + 16, f1: CD2 + 26 });
  const SB2 = transform('skel', CD2 + 20, SX, SX, 1, { style: 'grow' });
  key('skel', SB2, { ...stance('skel', SX, 1), y: RY - RIDE_S }, 0);
  key('skel', SB2 + 6, { mouth: 'happy with theeth', eyes: 'angry' }, 0);
  key('baby', SB2 - 2, { mouth: 'puzzlement', eyes: 'sad' }, 0);

  // ---- 18.3–19.5 с: Малыш дует изо всех сил — Скелет в вагонетке укатывается на левую горку и улетает
  const PU2 = SB2 + 10;
  key('baby', PU2 - 6, { lean: -12, head: -10, mouth: 'puzzlement', handF: hand('baby', 'F', 0.2, -0.3), handB: hand('baby', 'B', -0.3, -0.2) }, 6);
  sfx('suck', PU2 - 8, { who: 'baby', dur: 8, gain: 0.6 });
  key('baby', PU2, { lean: 14, head: 8, handF: hand('baby', 'F', -0.2, 0.2), handB: hand('baby', 'B', -0.5, 0.1) }, 3, 'in2');
  key('baby', PU2 + 20, { ...stance('baby', BX2, -1), mouth: 'happy with theeth', eyes: 'normal' }, 8);
  ev('wind', { f0: PU2, f1: PU2 + 20, x0: BX2 - 120, x1: 0, snd: false });
  sfx('gust', PU2, { who: 'baby', dur: 20, gain: 1.0 });
  const G2 = PU2 + 3, B2 = G2 + 8, L4 = B2 + 6;
  ck(G2, { x: SX }, 0);
  ck(B2, { x: LR0 }, null, 'in');
  ck(L4, { x: LR1 }, null, 'lin');
  key('skel', G2, { mouth: 'puzzlement', eyes: 'sad', handF: hand('skel', 'F', 0.3, -0.9), handB: hand('skel', 'B', -0.3, -0.9) }, 3);
  sfx('scared', G2 + 1, { who: 'skel', gain: 0.8 });
  ride('skel', G2, L4, RIDE_S, 1);
  ck(L4, { free: 1, x: LR1, y: HY, rot: -SLOPE }, 0);
  ck(L4 + 14, { x: -300, y: -500, rot: -SLOPE - 2 * Math.PI }, 14, 'out2');
  const big = C.skel.big;
  key('skel', L4, { pivot: (big.anchor[1] - big.top) / 2, legFfk: 1, legBfk: 1, legF: [-30, 50], legB: [25, -40] }, 0);
  move('skel', L4, { x: LR1, y: HY - RIDE_S, rot: 0 });
  move('skel', L4 + 16, { x: -320, y: -360 }, 'out2');
  move('skel', L4 + 16, { rot: -420 }, 'lin');
  flap(L4, L4 + 18, 0.6);
  sfx('whoosh', L4, { x: LR1, dur: 14, gain: 0.7 });
  ev('twinkle', { f: L4 + 14, at: [110, 120], n: 22, size: 60 });
  sfx('ref:laugh', L4 + 4, { who: 'baby', gain: 0.85, pitch: 1.25 });
  chuckle('baby', L4 + 4, L4 + 22, { mouth: 'happy with theeth' });
  const WIN = victory('baby', L4 + 22, BX2, { n: 9, stride: 110 });
  window.T = { HEAD1, BB, SCOOP, SL, SB, HEAD2, SLAM2, PF, SB2, L4, WIN };
};

ST.hooks.beforeChars.push((ctx, f, S, CAM) => {
  ctx.setTransform(...CAM);
  FX.grassSteps(ctx, GROUND, [[0, 220, 210], [220, 90, 140], [310, 90, 70], [1520, 90, 70], [1610, 90, 140], [1700, 260, 210]]);
  FX.rails(ctx, [[-40, HY], [LR1, HY], [LR0, RY], [RR0, RY], [RR1, HY], [1960, HY]]);
});
ST.hooks.afterChars.push((ctx, f, S, CAM) => {
  ctx.setTransform(...CAM);
  const c = cartAt(f, S);
  FX.minecart(ctx, c.x, c.y, CW, c.rot, c.sq || 1, !!c.center);
  for (const b of BURSTS) FX.blockBurst(ctx, b.at[0], b.at[1], (f - b.f) / 20, b.seed, b.cols, b.n, b.size, 1, GROUND);
});

ST.start(BIG);
