// Серия 2, ролик 11: Стог сена — Жёлтая (слева) против Малыша (справа), 22 с, 24 кадра/с. Драка без ударов:
// тюки сена из майнкрафта: прыжок в стог, прятки в сене, тюк на голову, пирамида из тюков рушится.
// Музыка превращения — один раз. Фон — деревня.
//
//   0–2 с     шарик-Жёлтая и шарик-Малыш неподвижно стоят друг напротив друга, середина пустая
//   2–4 с     с неба падают три тюка сена — горкой; Малыш на пропеллере роняет тюк Жёлтой на голову — она в лепёшку
//   4–5.2 с   Жёлтая «растёт» под музыку — тюк разлетается соломой — Малыш влюблён
//   5.4–8.2 с влюблённый Малыш скачет к ней — она бросает тюк ему на голову — он в лепёшку
//   8.3–9.6 с Малыш «растёт» — тюк разлетается соломой
//   9.7–13 с  ставит пирамиду: тюк ей на голову, второй сверху — она шатается — падает — «пуф»
//   13.2–16.3 с шарик-Жёлтая прыгает на край тюка — второй тюк летит катапультой — Малышу в голову —
//             он падает — «пуф», засыпан соломой
//   16.5–22 с Жёлтая «растёт», ставит тюк на шарика-Малыша, садится на тюк — в центр, руки вверх
'use strict';

const ST = Stage({
  name: '11 Жёлтая vs Малыш',
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
  background: { theme: 'village', seed: 1011, sunX: 1500, sunY: 130 },
  clouds: [[150, 80, 2.4, 0, 12], [700, 220, 1.8, 1, 16], [1150, 70, 2.6, 2, 10], [1720, 250, 1.5, 0, 18]],
});
const { FPS, NF, GROUND, C, key, move, ev, sfx, hop, tumble, laugh, tremble, transform, shrink, love, stance, walk, turn,
  fallBack, victory, chuckle, hand, toRig, statesAt, stateAt, target } = ST;
const P = (v, f, S) => (typeof v === 'function' ? v(f, S) : typeof v === 'string' ? target(v, S) : v);
ST.parts.mouth = (ch, st, p) => (p.form === 'big' ? ST.parts.lips(ch, st) : E.apply(ch.eyeMatrix(st, ' 2'), [315, 740]));
function propeller(who, f0, f1, rps = 7, o = {}) {
  key(who, f0, { spin: 0, spinBlur: 0 }, 0);
  key(who, f0 + 8, { spinBlur: 1 }, 8);
  move(who, f1, { spin: rps * (f1 - f0) / 24 }, 'lin');
  key(who, f1, { spinBlur: 0 }, 6);
  key(who, f1 + 1, { spin: 0 }, 0);
  if (o.snd !== false) sfx('whirr', f0, { who, dur: f1 - f0, gain: o.gain ?? 0.4 });
}

// ------------------------------------------------------------------ тюки сена
const HS = 150;
const BALES = [];         // {segs: [{f0, at, rot, sq} | {f0, f1, a, b, arc, spin, ease} | {f0, hand} | {f0, on, dy} | {f0, gone}]}
const BURST = [];         // {f, at, size}
const STUCK = [];         // {who, f0, f1}
function burst(f, at, size = 1) { BURST.push({ f, at, size }); sfx('crunch', f, { x: 960, gain: 0.6 }); sfx('poof', f, { x: 960, gain: 0.4 }); }

const YX0 = 560, BX0 = 1360, SX = 1000;
// ================================================================== 0–2 с: неподвижная стойка
key('yel', 0, { form: 'small', x: YX0, y: GROUND, face: 1, look: 1, eyes: 'normal', mouth: 'smile normal', sx: 1, sy: 1, rot: 0, pivot: 0, alpha: 1 }, 0);
key('baby', 0, { form: 'small', x: BX0, y: GROUND, face: -1, look: 1, eyes: 'normal', mouth: ' 6', sx: 1, sy: 1, rot: 0, pivot: 0, alpha: 1 }, 0);

const BIG = () => {
  // ---- 2–4 с: три тюка с неба горкой — Малыш роняет верхний Жёлтой на голову
  const B = [0, 1, 2].map(() => ({ segs: [] }));
  BALES.push(...B);
  const POS = [[SX - 80, GROUND - HS / 2], [SX + 80, GROUND - HS / 2], [SX, GROUND - HS * 1.5]];
  B.forEach((b, i) => { const f0 = 48 + i * 4, f1 = f0 + 8; b.segs.push({ f0, f1, a: [POS[i][0], -200], b: POS[i], ease: 'in2' }, { f0: f1, at: POS[i], sq: (f) => (f < f1 + 3 ? 0.8 : 1) }); sfx('land', f1, { x: POS[i][0], gain: 0.6, pitch: 0.9 }); });
  ev('dust', { f: 56, x: SX, r: 120, n: 8, snd: false });
  key('yel', 50, { mouth: 'puzzlement' }, 0); key('baby', 50, { mouth: ' 5' }, 0);
  key('baby', 62, { mouth: ' 2', eyes: 'angry' }, 0);
  sfx('ref:grin-eee', 62, { who: 'baby', gain: 0.4, pitch: 1.3 });
  const F0 = 62, GR = 74, OVER = 84, DROP = OVER + 2, HIT = DROP + 8;
  propeller('baby', F0, OVER + 18, 10);
  move('baby', F0, { x: BX0, y: GROUND }); move('baby', GR, { x: SX, y: POS[2][1] - HS / 2 - 40 }, 'io');
  B[2].segs.push({ f0: GR, on: 'baby', dy: 240 + HS / 2 - 20 });
  sfx('chomp', GR, { who: 'baby', gain: 0.6 });
  const ytop = target('yel:top', stateAt(1))[1];
  move('baby', OVER, { x: YX0, y: ytop - HS - 280 }, 'io');
  key('baby', DROP, { mouth: ' 1' }, 0);
  const FLAT = GROUND - 150 - HS / 2;
  B[2].segs.push({ f0: DROP, f1: HIT, a: (f, S) => { const b = baleAt(B[2], DROP - 1, statesAt(DROP - 1)); return [b.x, b.y]; }, b: [YX0, FLAT], ease: 'in2' });
  B[2].segs.push({ f0: HIT, at: [YX0, FLAT], sq: (f) => (f < HIT + 3 ? 0.85 : 1) });
  sfx('slam', HIT, { who: 'yel', gain: 0.9 }); sfx('squish', HIT, { who: 'yel', gain: 0.6 });
  key('yel', HIT - 2, { mouth: 'puzzlement', eyes: 'sad' }, 0);
  key('yel', HIT, { sx: 1.7, sy: 0.4 }, 1);
  ev('shake', { f: HIT, amp: 14, n: 10 }); burst(HIT, [YX0, GROUND - 40], 0.8);
  move('baby', OVER + 14, { x: BX0 - 100, y: GROUND }, 'io');
  key('baby', OVER + 14, { sx: 1.2, sy: 0.82 }, 1); key('baby', OVER + 18, { sx: 1, sy: 1 }, 3);
  sfx('ref:laugh', OVER + 14, { who: 'baby', gain: 0.85, pitch: 1.3 });
  laugh('baby', OVER + 16, OVER + 34);

  // ---- 4–5.2 с: Жёлтая «растёт» — тюк разлетается соломой — Малыш влюблён
  const YX = 560;
  key('yel', HIT + 10, { eyes: 'angry', mouth: 'angry theeth' }, 0);
  const YB = transform('yel', HIT + 12, YX0, YX, 1, { style: 'grow', love: 'baby', loveDur: 44 });
  B[2].segs.push({ f0: HIT + 15, on: 'yel', dy: -HS / 2 + 14 });
  B[2].segs.push({ f0: YB - 6, gone: true });
  burst(YB - 6, [YX0, GROUND - 300], 1.6);
  STUCK.push({ who: 'yel', f0: YB - 6, f1: YB + 60 });
  key('yel', YB, stance('yel', YX, 1), 0);
  key('yel', YB + 6, { mouth: 'theeth smile', eyes: 'angry' }, 0);

  // ---- 5.4–8.2 с: влюблённый Малыш скачет — она берёт тюк и бросает ему на голову — лепёшка
  const BX1 = 1250;
  hop('baby', YB + 4, YB + 14, BX0 - 100, BX1, 90);
  key('baby', YB + 14, { mouth: 'happy - spittle' }, 0);
  const YX2 = 760;
  walk('yel', YB + 2, YX, YX2, 1, 8, 1);
  const GY = YB + 12;
  key('yel', GY - 5, { lean: 22, hip: [0, toRig('yel', 140)], head: 6 }, 5);
  key('yel', GY, { hitF: 1, hitFto: [SX - 80 - HS * 0.45, GROUND - HS * 0.6], hitFfix: GY }, 4);
  B[0].segs.push({ f0: GY + 2, f1: GY + 10, a: POS[0], b: (f, S) => { const h = C.yel.big.point(S.yel.st, 'handF'); return [h[0] + 40, h[1] - HS / 2 + 10]; } });
  B[0].segs.push({ f0: GY + 10, hand: 'yel' });
  sfx('pop', GY + 2, { who: 'yel', gain: 0.5 });
  key('yel', GY + 10, { hitF: 0, lean: -4, hip: [0, toRig('yel', 8)], head: -4, handF: hand('yel', 'F', 0.35, -0.95), handB: hand('yel', 'B', 0.15, -0.95), mouth: 'theeth smile', eyes: 'angry' }, 8);
  const TY = GY + 18, ONB = TY + 12;
  key('yel', TY, { handF: hand('yel', 'F', 0.95, -0.35), handB: hand('yel', 'B', 0.8, -0.45), lean: 12 }, 3, 'in2');
  key('yel', TY + 8, { ...stance('yel', YX2, 1), mouth: 'happy with theeth', eyes: 'normal' }, 8);
  sfx('swing', TY - 2, { who: 'yel', gain: 0.9 });
  const bTop = (f, S) => { const t = target('baby:top', S); return [t[0], t[1] - HS / 2 + 40]; };
  B[0].segs.push({ f0: TY, f1: ONB, a: (f, S) => { const b = baleAt(B[0], TY - 1, statesAt(TY - 1)); return [b.x, b.y]; }, b: bTop, arc: 160, spin: 2 * Math.PI });
  const BFLAT = GROUND - 120 - HS / 2;
  B[0].segs.push({ f0: ONB, at: [BX1, BFLAT] });
  key('baby', ONB, { sx: 1.8, sy: 0.38, mouth: ' 5', eyes: 'sad' }, 1);
  sfx('slam', ONB, { who: 'baby', gain: 0.9 }); sfx('squish', ONB, { who: 'baby', gain: 0.7 });
  ev('shake', { f: ONB, amp: 14, n: 10 }); burst(ONB, [BX1, GROUND - 40], 0.8);
  sfx('ref:laugh', ONB + 2, { who: 'yel', gain: 0.85, pitch: 1.45 });
  chuckle('yel', ONB + 2, ONB + 24, { mouth: 'happy with theeth' });
  sfx('sob', ONB + 6, { who: 'baby', dur: 14, gain: 0.4, pitch: 1.4 });

  // ---- 8.3–9.6 с: Малыш «растёт» — тюк разлетается
  const BX = 1300;
  key('baby', ONB + 16, { eyes: 'angry', mouth: ' 2' }, 0);
  const BB = transform('baby', ONB + 18, BX1, BX, -1, { style: 'grow' });
  B[0].segs.push({ f0: ONB + 21, on: 'baby', dy: -HS / 2 + 14 });
  B[0].segs.push({ f0: BB - 6, gone: true });
  burst(BB - 6, [BX1, GROUND - 300], 1.6);
  STUCK.push({ who: 'baby', f0: BB - 6, f1: BB + 50 });
  // второй тюк — с неба рядом с ним
  const B4 = B[1];
  const B3 = { segs: [{ f0: BB + 2, f1: BB + 10, a: [BX - 280, -200], b: [BX - 280, GROUND - HS / 2], ease: 'in2' }, { f0: BB + 10, at: [BX - 280, GROUND - HS / 2] }] };
  BALES.push(B3);
  ev('twinkle', { f: BB + 2, at: [BX - 280, 120], n: 14, size: 40 });
  sfx('land', BB + 10, { x: BX - 280, gain: 0.6 });
  key('baby', BB, stance('baby', BX, -1), 0);
  key('baby', BB + 6, { mouth: 'happy with theeth', eyes: 'angry' }, 0);
  key('yel', BB - 2, { mouth: 'puzzlement', eyes: 'sad' }, 0);

  // ---- 9.7–13 с: тюк ей на голову, второй сверху — шатается — падает — «пуф»
  const G1 = BB + 6;
  key('baby', G1 - 5, { lean: 22, hip: [0, toRig('baby', 160)], head: 6 }, 5);
  key('baby', G1, { hitF: 1, hitFto: [SX + 80 + HS * 0.45, GROUND - HS * 0.6], hitFfix: G1 }, 4);
  B4.segs.push({ f0: G1 + 2, f1: G1 + 10, a: POS[1], b: (f, S) => { const h = C.baby.big.point(S.baby.st, 'handF'); return [h[0] - 40, h[1] - HS / 2 + 10]; } });
  B4.segs.push({ f0: G1 + 10, hand: 'baby' });
  sfx('pop', G1 + 2, { who: 'baby', gain: 0.5 });
  key('baby', G1 + 10, { ...stance('baby', BX, -1), hitF: 0, handF: hand('baby', 'F', 0.35, -0.95), handB: hand('baby', 'B', 0.15, -0.95), mouth: 'happy with theeth', eyes: 'angry' }, 8);
  const T1 = G1 + 18, ON1 = T1 + 10;
  key('baby', T1, { handF: hand('baby', 'F', 0.95, -0.35), handB: hand('baby', 'B', 0.8, -0.45), lean: 10 }, 3, 'in2');
  sfx('swing', T1 - 2, { who: 'baby', gain: 0.9 });
  B4.segs.push({ f0: T1, f1: ON1, a: (f, S) => { const b = baleAt(B4, T1 - 1, statesAt(T1 - 1)); return [b.x, b.y]; }, b: (f, S) => { const t = target('yel:top', S); return [t[0], t[1] - HS / 2 + 30]; }, arc: 140, spin: 2 * Math.PI });
  B4.segs.push({ f0: ON1, on: 'yel', dy: -HS / 2 + 30 });
  sfx('bonk', ON1, { who: 'yel', gain: 0.9 });
  key('yel', ON1, { hip: [0, toRig('yel', 60)], head: 8, mouth: 'puzzlement', eyes: 'sad', handF: hand('yel', 'F', 0.3, -0.9), handB: hand('yel', 'B', -0.2, -0.9) }, 2);
  key('baby', T1 + 8, { ...stance('baby', BX, -1), lean: 0 }, 6);
  // второй
  const G2 = ON1 + 2;
  key('baby', G2 - 5, { lean: 22, hip: [0, toRig('baby', 160)], head: 6 }, 5);
  key('baby', G2, { hitF: 1, hitFto: [BX - 280 + HS * 0.45, GROUND - HS * 0.6], hitFfix: G2 }, 4);
  B3.segs.push({ f0: G2 + 2, f1: G2 + 8, a: [BX - 280, GROUND - HS / 2], b: (f, S) => { const h = C.baby.big.point(S.baby.st, 'handF'); return [h[0] - 40, h[1] - HS / 2 + 10]; } });
  B3.segs.push({ f0: G2 + 8, hand: 'baby' });
  key('baby', G2 + 8, { ...stance('baby', BX, -1), hitF: 0, handF: hand('baby', 'F', 0.35, -0.95), handB: hand('baby', 'B', 0.15, -0.95) }, 8);
  const T2 = G2 + 16, ON2 = T2 + 10;
  key('baby', T2, { handF: hand('baby', 'F', 0.95, -0.35), handB: hand('baby', 'B', 0.8, -0.45), lean: 10 }, 3, 'in2');
  sfx('swing', T2 - 2, { who: 'baby', gain: 0.9 });
  B3.segs.push({ f0: T2, f1: ON2, a: (f, S) => { const b = baleAt(B3, T2 - 1, statesAt(T2 - 1)); return [b.x, b.y]; }, b: (f, S) => { const t = target('yel:top', S); return [t[0], t[1] - HS * 1.5 + 30]; }, arc: 180, spin: -2 * Math.PI });
  const wob = (f) => (f >= ON2 ? Math.sin((f - ON2) * 0.5) * Math.min(40, (f - ON2) * 3) : 0);
  B3.segs.push({ f0: ON2, on: 'yel', dy: -HS * 1.5 + 30, jit: wob });
  B4.segs.push({ f0: ON2, on: 'yel', dy: -HS / 2 + 30, jit: (f) => wob(f) * 0.5 });
  sfx('bonk', ON2, { who: 'yel', gain: 0.9 });
  key('baby', T2 + 8, { ...stance('baby', BX, -1), lean: 0, mouth: 'happy with theeth', eyes: 'normal' }, 6);
  sfx('ref:laugh', ON2 + 2, { who: 'baby', gain: 0.85, pitch: 1.2 });
  chuckle('baby', ON2 + 2, ON2 + 26, { mouth: 'happy with theeth' });
  // шатается
  key('yel', ON2, { hip: [0, toRig('yel', 90)] }, 2);
  for (let f = ON2 + 2; f < ON2 + 14; f += 6) { key('yel', f + 3, { lean: 10, head: 6 }, 3); key('yel', f + 6, { lean: -10, head: -6 }, 3); sfx('creak', f, { who: 'yel', dur: 5, gain: 0.4 }); }
  const LIE = fallBack('yel', ON2 + 14, YX2, 1, { n: 12, stars: false });
  for (const b of [B3, B4]) b.segs.push({ f0: ON2 + 18, f1: ON2 + 30, a: (f, S) => { const q = baleAt(b, ON2 + 17, statesAt(ON2 + 17)); return [q.x, q.y]; }, b: [YX2 - 380 - (b === B3 ? 160 : 0), GROUND - HS / 2], arc: 120, spin: -3 }, { f0: ON2 + 30, at: [YX2 - 380 - (b === B3 ? 160 : 0), GROUND - HS / 2] });
  sfx('land', ON2 + 30, { x: 200, gain: 0.6 });
  const ysm = shrink('yel', LIE + 4, YX2 - 80, 1, { mouth: 'puzzlement', eyes: 'sad', smoke: 420 });
  key('yel', ysm, { lean: 0, head: 0, hip: [0, 0], legF: null, legB: null, zB: null, rot: 0 }, 0);
  move('yel', ysm, { x: YX2 - 80, y: GROUND, rot: 0 });
  ev('stars', { who: 'yel', f0: ysm + 4, f1: ysm + 20, snd: false });

  // ---- 13.2–16.3 с: катапульта — тюк Малышу в голову — «пуф»
  // B3 (лево, нижний) и B4 переставим: доска — нет; проще: она прыгает на тюк B4 — B3 подлетает
  key('yel', ysm + 4, { eyes: 'angry', mouth: 'angry theeth' }, 0);
  const CX = YX2 - 380, J1 = ysm + 6, J2 = J1 + 10;
  hop('yel', J1, J2, YX2 - 80, CX + 40, 160);
  move('yel', J2, { y: GROUND - HS + 6 });
  key('yel', J2, { sx: 1.3, sy: 0.75 }, 1);
  sfx('boing', J2, { x: CX, gain: 0.9 });
  const FLY = J2 + 1, BH = FLY + 14;
  const bHead = (f, S) => { const t = target('baby:top', S); return [t[0], t[1] - 20]; };
  B4.segs.push({ f0: FLY, f1: BH, a: [CX, GROUND - HS / 2], b: bHead, arc: 380, spin: 3 * Math.PI });
  B4.segs.push({ f0: BH, gone: true });
  burst(BH, bHead, 1.4);
  sfx('whoosh', FLY, { x: 900, dur: 14, gain: 0.7 }); sfx('bonk', BH, { who: 'baby', gain: 1.0 });
  key('baby', BH - 6, { look: 1, head: -10, mouth: 'puzzlement', eyes: 'sad' }, 3);
  STUCK.push({ who: 'baby', f0: BH, f1: 0 });
  ev('shake', { f: BH, amp: 14, n: 10 });
  hop('yel', J2 + 1, J2 + 12, CX + 40, CX + 260, 120);
  move('yel', J2 + 1, { y: GROUND - HS + 6 });
  const LIE2 = fallBack('baby', BH + 2, BX, -1, { n: 12, stars: false });
  const bsm = shrink('baby', LIE2 + 4, BX + 140, -1, { mouth: ' 5', eyes: 'sad', smoke: 420 });
  key('baby', bsm, { lean: 0, head: 0, hip: [0, 0], legF: null, legB: null, zB: null, rot: 0 }, 0);
  move('baby', bsm, { x: BX + 140, y: GROUND, rot: 0 });
  ev('stars', { who: 'baby', f0: bsm + 4, f1: bsm + 30, snd: false });
  sfx('ref:laugh', BH + 4, { who: 'yel', gain: 0.85, pitch: 1.45 });
  laugh('yel', J2 + 13, J2 + 16);

  // ---- 16.5–22 с: Жёлтая «растёт», ставит тюк на шарика-Малыша; в центр
  const YX3 = CX + 260;
  const YB2 = transform('yel', J2 + 16, YX3, YX3, 1, { style: 'grow' });
  key('yel', YB2, stance('yel', YX3, 1), 0);
  const GR3 = YB2 + 2;
  key('yel', GR3, { lean: 16, hip: [0, toRig('yel', 120)], hitF: 1, hitFto: [CX - 140, GROUND - HS / 2], hitFfix: GR3 }, 4);
  B3.segs.push({ f0: GR3 + 4, hand: 'yel' });
  key('yel', GR3 + 10, { hitF: 0, lean: 0, hip: [0, 8], handF: hand('yel', 'F', 0.6, -0.9), handB: hand('yel', 'B', 0.4, -0.9), mouth: 'happy with theeth', eyes: 'angry' }, 6);
  const T3 = GR3 + 12, ON3 = T3 + 10;
  key('yel', T3, { handF: hand('yel', 'F', 0.95, -0.3), handB: hand('yel', 'B', 0.8, -0.4), lean: 10 }, 3, 'in2');
  sfx('swing', T3 - 2, { who: 'yel', gain: 0.9 });
  B3.segs.push({ f0: T3, f1: ON3, a: (f, S) => { const b = baleAt(B3, T3 - 1, statesAt(T3 - 1)); return [b.x, b.y]; }, b: [BX + 140, GROUND - HS / 2], arc: 200, spin: 2 * Math.PI, ease: 'in2' });
  B3.segs.push({ f0: ON3, at: [BX + 140, GROUND - HS / 2], sq: (f) => (f < ON3 + 3 ? 0.8 : 1) });
  key('baby', ON3, { alpha: 0 }, 0);
  STUCK[STUCK.length - 1].f1 = ON3;
  sfx('slam', ON3, { x: BX + 140, gain: 0.9 }); burst(ON3, [BX + 140, GROUND - 30], 1);
  sfx('sob', ON3 + 6, { x: BX + 140, dur: 30, gain: 0.4, pitch: 1.4 });
  key('yel', T3 + 8, { ...stance('yel', YX3, 1), mouth: 'happy with theeth', eyes: 'normal' }, 8);
  sfx('ref:laugh', ON3 + 2, { who: 'yel', gain: 0.85, pitch: 1.45 });
  const WIN = victory('yel', ON3 + 6, YX3, { n: 9, stride: 110 });
  window.T = { HIT, YB, ONB, BB, ON1, ON2, LIE, ysm, BH, LIE2, YB2, ON3, WIN };
};

// ------------------------------------------------------------------ рисование
ST.hooks.afterChars.push((ctx, f, S, CAM) => {
  ctx.setTransform(...CAM);
  for (const s of STUCK) {
    if (f < s.f0 || (s.f1 && f >= s.f1)) continue;
    const t = target(`${s.who}:top`, S), big = S[s.who].p.form === 'big';
    FX.hayStuck(ctx, t[0], t[1] + (big ? 40 : 30), big ? 180 : 130, s.f0);
  }
  for (const B of BALES) { const b = baleAt(B, f, S); if (b) FX.hayBale(ctx, b.x, b.y, HS, b.rot, BALES.indexOf(B) + 2, b.sq); }
  for (const b of BURST) { const at = P(b.at, b.f, statesAt(b.f)); FX.hayBurst(ctx, at[0], at[1], (f - b.f) / 20, b.size, b.f); }
});

ST.start(BIG);
