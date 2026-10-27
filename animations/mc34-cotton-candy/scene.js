// Ролик 34 (серия по образцу): Сахарная вата — Жёлтая против Розовой, 22 с, 24 кадра/с. Драка без ударов:
// огромная вата на палочке — сдуть клок на соперницу, закрутить в кокон, налепить бороду; чих; сахарный заряд.
// Музыка превращения — один раз. Фон — равнина с подсолнухами.
//
//   0–2 с     шарик-Жёлтая (слева) и шарик-Розовая (справа) неподвижно стоят друг напротив друга,
//             середина пустая — автор вставит начало
//   2–4.3 с   с неба падает и втыкается в траву огромная вата на палочке; Жёлтая дует — клок ваты летит и
//             облепляет Розовую целиком; «апчхи!» — вата разлетается
//   4.3–5.6 с Розовая «растёт» под музыку
//   5.7–9.3 с берёт вату, крутит палочку вокруг Жёлтой — та в коконе на палочке, как леденец; трясёт — Жёлтая
//             улетает кувырком; втыкает вату обратно
//   9.3–10.5 с Жёлтая «растёт»
//   10.6–14 с отрывает клок ваты и лепит Розовой на лицо — та чихает так, что падает — «пуф», шарик
//   14.2–17.5 с шарик-Розовая съедает остатки ваты — сахарный заряд: носится и сбивает Жёлтую с ног —
//             у Жёлтой голова кругом, падает — «пуф»
//   17.5–22 с Розовая «растёт» и стоит в центре, руки вверх
'use strict';

const ST = Stage({
  name: 'mc34-cotton-candy',
  frames: 528,
  cast: {
    yel: { small: ['girl-verity-small', { bodyHeight: 300, recolor: 'yellow' }],
      big: ['verity-big-girl', { height: 730, splitFeet: true, recolor: 'yellow' }], pivot: 337, voice: 1.45, vAngle: 50, lie: 55,
      color: '#ffe23a', moods: { angry: 'angry theeth', grin: 'theeth smile', big: 'theeth smile' } },
    pink: { small: ['girl-verity-small', { bodyHeight: 300 }], big: ['girl-verity-big', { height: 730, splitFeet: true }],
      pivot: 337, voice: 1.35, vAngle: 50, lie: 55, color: '#ff4fc8', moods: { angry: 'angry theeth', grin: 'theeth smile', big: 'theeth smile' } },
  },
  order: ['yel', 'pink'],
  background: { theme: 'plains', seed: 341, sunX: 1500, sunY: 130 },
  clouds: [[150, 80, 2.4, 0, 12], [700, 220, 1.8, 1, 16], [1150, 70, 2.6, 2, 10], [1720, 250, 1.5, 0, 18]],
});
const { FPS, NF, GROUND, C, key, move, ev, sfx, hop, laugh, tremble, transform, shrink, stance, walk, turn,
  spinAround, fallBack, victory, chuckle, hand, toRig, statesAt, stateAt, target } = ST;
const P = (v, f, S) => (typeof v === 'function' ? v(f, S) : typeof v === 'string' ? target(v, S) : v);

// ------------------------------------------------------------------ вата
const CL = 300, CX = 960;
const CANDY = [];         // {f0, at, rot} | {f0, hand, rot} | {f0, f1, a, b, ease, rot}
const RK = [[0, 125]];    // радиус ваты по кадрам
const BLOB = [];          // {f0, f1, a, b, arc, r0, r1} | {f0, f1, on, part, r, dy} | {f0, f1, hand, r}
const BURST = [];         // {f, at, size}
const rAt = (f) => { let a = RK[0], b = null; for (const k of RK) { if (k[0] <= f) a = k; else { b = k; break; } } return b ? E.lerp(a[1], b[1], (f - a[0]) / (b[0] - a[0])) : a[1]; };
function candyAt(f, S) {
  const c = CANDY.filter((k) => f >= k.f0).pop();
  if (!c) return null;
  const rot = typeof c.rot === 'function' ? c.rot(f) : c.rot || 0;
  if (c.at) return { x: c.at[0], y: c.at[1], rot };
  if (c.hand) { const h = C[c.hand].big.point(S[c.hand].st, 'handF'); return { x: h[0] - Math.sin(rot) * 40, y: h[1] + Math.cos(rot) * 40, rot }; }
  const u = E.EASE[c.ease || 'in2'](E.clamp((f - c.f0) / (c.f1 - c.f0), 0, 1)), a = P(c.a, c.f0, statesAt(c.f0)), b = P(c.b, f, S);
  return { x: E.lerp(a[0], b[0], u), y: E.lerp(a[1], b[1], u), rot };
}
const tipAt = (f, S) => { const c = candyAt(f, S); return [c.x + Math.sin(c.rot) * (CL - 18), c.y - Math.cos(c.rot) * (CL - 18)]; };
function burst(f, at, size = 1) { BURST.push({ f, at, size }); }

// прыжок шарика из точки в точку
function hopTo(who, f0, f1, x0, y0, x1, y1, h, o = {}) {
  const mid = Math.round((f0 + f1) / 2);
  key(who, f0, { sx: 1.2, sy: 0.82 }, o.prep ?? 3);
  move(who, f0, { x: x0, y: y0 });
  key(who, f0 + 2, { sx: 0.86, sy: 1.16 }, 2);
  move(who, mid, { y: Math.min(y0, y1) - h }, 'out2');
  key(who, mid, { sx: 1, sy: 1 }, 3);
  move(who, f1, { y: y1 }, 'in2');
  move(who, f1, { x: x1 }, 'lin');
  if (o.land !== false) { key(who, f1, { sx: 1.25, sy: 0.78 }, 1); key(who, f1 + 3, { sx: 0.94, sy: 1.07 }, 3); key(who, f1 + 7, { sx: 1, sy: 1 }, 4); sfx('land', f1, { who, gain: 0.5 }); }
  sfx('jump', f0 + 2, { who, gain: 0.55 });
}

const YX0 = 560, PX0 = 1360;
// ================================================================== 0–2 с: неподвижная стойка
key('yel', 0, { form: 'small', x: YX0, y: GROUND, face: 1, look: 1, eyes: 'normal', mouth: 'smile normal', sx: 1, sy: 1, rot: 0, pivot: 0, alpha: 1 }, 0);
key('pink', 0, { form: 'small', x: PX0, y: GROUND, face: -1, look: 1, eyes: 'normal', mouth: 'smile normal', sx: 1, sy: 1, rot: 0, pivot: 0, alpha: 1 }, 0);

const BIG = () => {
  // ---- 2–4.3 с: вата с неба — Жёлтая сдувает клок на Розовую — «апчхи!»
  const D0 = 48, D1 = 58;
  CANDY.push({ f0: D0, f1: D1, a: [CX, -340], b: [CX, GROUND + 6], rot: 0 }, { f0: D1, at: [CX, GROUND + 6], rot: 0 });
  sfx('whoosh', D0, { x: CX, dur: 10, gain: 0.6 });
  sfx('boing', D1, { x: CX, gain: 0.8 }); sfx('land', D1, { x: CX, gain: 0.6 });
  ev('dust', { f: D1, x: CX, r: 30, n: 5 });
  ev('twinkle', { f: D1 + 2, at: [CX, GROUND - 320], n: 16, size: 50 });
  CANDY.push({ f0: D1 + 1, at: [CX, GROUND + 6], rot: (f) => Math.sin((f - D1) * 0.9) * 0.12 * Math.max(0, 1 - (f - D1) / 14) });
  key('yel', D0 + 4, { mouth: 'puzzlement' }, 0); key('pink', D0 + 4, { mouth: 'puzzlement' }, 0);
  key('yel', D1 + 2, { mouth: 'theeth smile', eyes: 'angry' }, 0); key('pink', D1 + 2, { mouth: 'happy with theeth' }, 0);
  const YX1 = 790;
  hopTo('yel', D1 + 2, D1 + 10, YX0, GROUND, YX1, GROUND, 110);
  const IN = D1 + 11, BL = IN + 5, FLY1 = BL + 9;
  key('yel', IN, { sx: 1.16, sy: 1.16, mouth: 'puzzlement' }, 5, 'out');
  sfx('inflate', IN, { who: 'yel', dur: 6, gain: 0.6 });
  key('yel', BL, { sx: 0.9, sy: 0.9 }, 2); key('yel', BL + 6, { sx: 1, sy: 1 }, 4);
  sfx('gust', BL, { who: 'yel', dur: 10, gain: 0.8 });
  ev('wind', { f0: BL, f1: BL + 10, x0: YX1 + 80, x1: PX0, snd: false });
  RK.push([BL, 125], [BL + 4, 80]);
  BLOB.push({ f0: BL, f1: FLY1, a: (f, S) => tipAt(f, S), b: (f, S) => target('pink:body', S), arc: 60, r0: 60, r1: 175 });
  BLOB.push({ f0: FLY1, f1: 0, on: 'pink', part: 'body', r: 175 });
  sfx('squish', FLY1, { who: 'pink', gain: 0.8 });
  key('pink', FLY1, { sx: 1.15, sy: 0.88 }, 1); key('pink', FLY1 + 4, { sx: 1, sy: 1 }, 3);
  tremble('pink', FLY1 + 2, FLY1 + 14, PX0, 4);
  sfx('ref:laugh', FLY1 + 2, { who: 'yel', gain: 0.85, pitch: 1.45 });
  key('yel', FLY1, { mouth: 'happy with theeth', eyes: 'normal' }, 0);
  laugh('yel', FLY1 + 2, FLY1 + 16);
  // «апчхи!»
  const SN = FLY1 + 12;
  key('pink', SN - 6, { sx: 0.9, sy: 1.12 }, 6);
  key('pink', SN, { sx: 1.3, sy: 0.78, pivot: ST.CAST.pink.pivot }, 1);
  move('pink', SN, { x: PX0, y: GROUND, rot: 0 });
  move('pink', SN + 6, { x: PX0 + 60, rot: 16 }, 'out');
  move('pink', SN + 12, { rot: 0 }, 'io');
  key('pink', SN + 6, { sx: 1, sy: 1 }, 4);
  sfx('sneeze', SN - 4, { who: 'pink', gain: 1.0 });
  BLOB[1].f1 = SN;
  burst(SN, (f, S) => target('pink:body', S), 1.4);
  key('pink', SN + 2, { mouth: 'angry theeth', eyes: 'angry' }, 0);

  // ---- 4.3–5.6 с: Розовая «растёт»
  const PX = 1300;
  ev('vein', { who: 'pink', f0: SN + 3, f1: SN + 12 });
  const PB = transform('pink', SN + 5, PX0 + 60, PX, -1, { style: 'grow' });
  key('pink', PB, stance('pink', PX, -1), 0);
  key('pink', PB + 6, { mouth: 'theeth smile', eyes: 'angry' }, 0);
  key('yel', PB - 2, { mouth: 'puzzlement', eyes: 'sad' }, 0);

  // ---- 5.7–9.3 с: берёт вату — кокон вокруг Жёлтой — на палочке — трясёт — кувырком
  const PX2 = 1110, W0 = PB + 4;
  walk('pink', W0, PX, PX2, 2, 8, -1);
  const GR = W0 + 17;
  key('pink', GR - 4, { lean: 14, hip: [0, toRig('pink', 60)], head: 4 }, 4);
  key('pink', GR, { hitF: 1, hitFto: [CX, GROUND - 160], hitFfix: GR }, 4);
  CANDY.push({ f0: GR, hand: 'pink', rot: 0 });
  sfx('pop', GR, { who: 'pink', gain: 0.5 });
  // крутит ватой вокруг Жёлтой
  const TW0 = GR + 6, NTW = 7, TWS = 3, yc = [YX1, GROUND - 150];
  key('yel', TW0, { mouth: 'puzzlement', eyes: 'sad' }, 0);
  for (let i = 0; i <= NTW; i++) {
    const a = i / NTW * Math.PI * 3, f = TW0 + i * TWS;
    key('pink', f, { hitF: 1, hitFto: [yc[0] + Math.cos(a) * 170 + 60, yc[1] + Math.sin(a) * 90 + 120], hitFfix: f, lean: 10, hip: [0, toRig('pink', 40)] }, TWS, 'lin');
  }
  CANDY.push({ f0: TW0, hand: 'pink', rot: (f) => -0.9 + Math.sin((f - TW0) * 0.8) * 0.5 });
  const TW1 = TW0 + NTW * TWS;
  sfx('whirr', TW0, { who: 'yel', dur: TW1 - TW0, gain: 0.7 });
  RK.push([TW0, 80], [TW1, 70]);
  BLOB.push({ f0: TW0, f1: 0, on: 'yel', part: 'body', r: (f) => 60 + 140 * E.clamp((f - TW0) / (TW1 - TW0), 0, 1), cocoon: true });
  // поднимает: Жёлтая в коконе на конце палочки
  const UP = TW1 + 8, SH0 = TW1 + 8, SH1 = SH0 + 8;
  key('pink', TW1 + 1, { hitF: 0, handF: hand('pink', 'F', 0.8, 0.05), lean: 0, hip: [0, toRig('pink', 8)], mouth: 'happy with theeth', eyes: 'angry' }, 7);
  CANDY.push({ f0: TW1, hand: 'pink', rot: (f) => -0.9 - 0.15 * E.EASE.io(E.clamp((f - TW1) / 8, 0, 1)) + (f >= SH0 && f < SH1 ? Math.sin((f - SH0) * 1.9) * 0.35 : 0) });
  sfx('whoosh', TW1 + 1, { who: 'yel', dur: 8, gain: 0.5 });
  key('yel', TW1, { pivot: ST.CAST.yel.pivot }, 0);
  for (let f = TW1 + 1; f <= SH1; f++) {
    const S = stateAt(f), t = tipAt(f, S), u = E.clamp((f - TW1) / 8, 0, 1);
    key('yel', f, { x: E.lerp(YX1, t[0], u), y: E.lerp(GROUND, t[1] + 150, u) }, 1, 'lin');
  }
  for (let f = SH0; f < SH1; f += 3) sfx('boing', f, { who: 'yel', gain: 0.35 });
  sfx('scared', UP, { who: 'yel', gain: 0.8 });
  // слетает кувырком
  const tip1 = tipAt(SH1, stateAt(SH1)), YX2 = 470, LND = SH1 + 12;
  BLOB[BLOB.length - 1].f1 = SH1;
  burst(SH1, [tip1[0], tip1[1]], 1.4);
  move('yel', SH1, { x: tip1[0], y: tip1[1] + 150, rot: 0 });
  move('yel', SH1 + 5, { y: tip1[1] + 60 }, 'out2');
  move('yel', LND, { x: YX2, y: GROUND }, 'in2');
  move('yel', LND, { rot: -540 }, 'lin'); key('yel', LND + 1, { rot: 0 }, 0);
  key('yel', LND, { sx: 1.3, sy: 0.74 }, 1); key('yel', LND + 5, { sx: 1, sy: 1 }, 4);
  sfx('whoosh', SH1, { who: 'yel', dur: 12, gain: 0.6 }); sfx('fall', LND, { who: 'yel', gain: 0.9 });
  ev('dust', { f: LND, x: YX2, r: 40, n: 6 });
  ev('stars', { who: 'yel', f0: LND + 2, f1: LND + 24 });
  sfx('ref:laugh', SH1 + 2, { who: 'pink', gain: 0.85, pitch: 1.35 });
  chuckle('pink', SH1 + 2, SH1 + 20, { mouth: 'happy with theeth' });
  // втыкает вату обратно
  const PL = SH1 + 22;
  key('pink', PL - 4, { lean: 14, hip: [0, toRig('pink', 60)] }, 4);
  key('pink', PL, { hitF: 1, hitFto: [CX, GROUND - 160], hitFfix: PL }, 4);
  CANDY.push({ f0: PL, at: [CX, GROUND + 6], rot: 0 });
  sfx('land', PL, { x: CX, gain: 0.5 });
  key('pink', PL + 8, { ...stance('pink', PX2, -1), hitF: 0, mouth: 'happy with theeth', eyes: 'normal' }, 8);

  // ---- 9.3–10.5 с: Жёлтая «растёт»
  const YX = 600;
  key('yel', LND + 8, { eyes: 'angry', mouth: 'angry theeth' }, 0);
  ev('vein', { who: 'yel', f0: LND + 8, f1: LND + 18 });
  const YB = transform('yel', LND + 10, YX2, YX, 1, { style: 'grow' });
  key('yel', YB, stance('yel', YX, 1), 0);
  key('yel', YB + 6, { mouth: 'theeth smile', eyes: 'angry' }, 0);
  key('pink', YB - 2, { mouth: 'puzzlement', eyes: 'sad' }, 0);

  // ---- 10.6–14 с: клок ваты на лицо Розовой — чих — падает — «пуф»
  const YX3 = 720, WY = YB + 4;
  walk('yel', WY, YX, YX3, 1, 9, 1);
  const TK = WY + 10;
  key('yel', TK - 4, { lean: 6 }, 4);
  key('yel', TK, { hitF: 1, hitFto: (() => { const t = tipAt(TK, stateAt(TK)); return [t[0] - 30, t[1] + 20]; })(), hitFfix: TK }, 4);
  RK.push([TK, 70], [TK + 2, 26]);
  BLOB.push({ f0: TK, f1: TK + 8, hand: 'yel', r: 80 });
  sfx('squish', TK, { who: 'yel', gain: 0.6 });
  const SL = TK + 8;
  key('yel', SL - 4, { hitF: 0, handF: hand('yel', 'F', 0.6, -0.5) }, 4);
  key('yel', SL, { hitF: 1, hitFto: 'pink:face', hitFfix: SL, lean: 12 }, 3, 'in2');
  key('yel', SL + 8, { ...stance('yel', YX3, 1), hitF: 0, mouth: 'happy with theeth', eyes: 'normal' }, 8);
  BLOB.push({ f0: SL, f1: 0, on: 'pink', part: 'face', r: 115 });
  sfx('squish', SL, { who: 'pink', gain: 1.0 }); sfx('slap', SL, { who: 'pink', gain: 0.5 });
  key('pink', SL, { lean: -10, head: -10, mouth: 'puzzlement', eyes: 'sad', handF: hand('pink', 'F', 0.5, -0.65), handB: hand('pink', 'B', -0.4, -0.5) }, 3);
  tremble('pink', SL + 2, SL + 16, PX2, 5);
  sfx('ref:laugh', SL + 4, { who: 'yel', gain: 0.85, pitch: 1.45 });
  chuckle('yel', SL + 4, SL + 24, { mouth: 'happy with theeth' });
  const SN2 = SL + 18;
  key('pink', SN2 - 8, { lean: -18, head: -16, hip: [0, toRig('pink', 20)] }, 8);
  key('pink', SN2, { lean: 16, head: 12 }, 2, 'in2');
  sfx('sneeze', SN2 - 5, { who: 'pink', gain: 1.0, pitch: 0.85 });
  BLOB[BLOB.length - 1].f1 = SN2;
  burst(SN2, (f, S) => target('pink:face', S), 1.2);
  ev('shake', { f: SN2, amp: 16, n: 10 });
  const LIE = fallBack('pink', SN2 + 3, PX2, -1, { n: 12, stars: false, mouth: 'puzzlement' });
  const psm = shrink('pink', LIE + 6, PX2 + 200, -1, { mouth: 'puzzlement', eyes: 'sad', smoke: 420 });
  key('pink', psm, { lean: 0, head: 0, hip: [0, 0], legF: null, legB: null, zB: null, rot: 0 }, 0);
  move('pink', psm, { x: PX2 + 200, y: GROUND, rot: 0 });
  ev('stars', { who: 'pink', f0: psm + 6, f1: psm + 24, snd: false });

  // ---- 14.2–17.5 с: шарик-Розовая съедает остатки ваты — сахарный заряд — носится — Жёлтая падает — «пуф»
  const PH = psm + 6, EAT = PH + 12;
  key('pink', PH - 2, { eyes: 'angry', mouth: 'theeth smile' }, 0);
  hopTo('pink', PH, PH + 10, PX2 + 200, GROUND, CX + 120, GROUND, 140);
  key('pink', EAT - 1, { mouth: 'puzzlement' }, 0);
  RK.push([EAT - 2, 26], [EAT + 2, 0]);
  sfx('chomp', EAT, { who: 'pink', gain: 1.0 }); sfx('gulp', EAT + 4, { who: 'pink', gain: 1.0 });
  key('pink', EAT, { sx: 1.2, sy: 1.15, mouth: 'happy with theeth' }, 2); key('pink', EAT + 4, { sx: 1, sy: 1 }, 3);
  CANDY.push({ f0: EAT + 4, f1: EAT + 12, a: [CX, GROUND + 6], b: [CX, GROUND + 6], rot: (f) => Math.min(1, (f - EAT - 4) / 8) * 1.5, ease: 'lin' });
  CANDY.push({ f0: EAT + 12, at: [CX, GROUND + 6], rot: 1.5 });
  sfx('land', EAT + 12, { x: CX, gain: 0.4 });
  // сахарный заряд
  const RU = EAT + 6;
  ev('vein', { who: 'pink', f0: RU, f1: RU + 14 });
  ev('steam', { who: 'pink', f0: RU, f1: RU + 14 });
  tremble('pink', RU, RU + 10, CX + 120, 9);
  sfx('powerup', RU, { who: 'pink', dur: 12, gain: 0.8 });
  // носится: бьётся в ноги Жёлтой, отскакивает, снова
  const Z = RU + 10, legs = YX3 + 60;
  key('yel', Z, { mouth: 'puzzlement', eyes: 'sad' }, 0);
  key('pink', Z, { pivot: ST.CAST.pink.pivot }, 0);
  move('pink', Z, { x: CX + 120, y: GROUND, rot: 0 });
  const path = [[Z, CX + 120], [Z + 4, legs], [Z + 9, 1500], [Z + 13, legs], [Z + 18, 1200], [Z + 22, legs + 20]];
  for (let i = 1; i < path.length; i++) {
    move('pink', path[i][0], { x: path[i][1], y: GROUND, rot: (i % 2 ? -1 : 1) * 360 * i }, 'lin');
    if (path[i][1] === legs || path[i][1] === legs + 20) { sfx('bonk', path[i][0], { who: 'yel', gain: 0.7 }); ev('spark', { f: path[i][0], at: [legs - 30, GROUND - 120], r: 50, snd: false, swing: false }); }
    sfx('whoosh', path[i - 1][0], { x: 1100, dur: 4, gain: 0.5 });
  }
  const SP = spinAround('yel', Z + 6, YX3, 1, { n: 4, stars: 20 });
  const ZE = Z + 22;
  move('pink', ZE + 10, { x: CX, y: GROUND, rot: 0 }, 'out');
  key('pink', ZE + 10, { rot: 0 }, 0);
  const LIE2 = fallBack('yel', SP + 2, YX3, 1, { n: 12, stars: false });
  const ysm = shrink('yel', LIE2 + 6, YX3 - 200, 1, { mouth: 'puzzlement', eyes: 'sad', smoke: 420 });
  key('yel', ysm, { lean: 0, head: 0, hip: [0, 0], legF: null, legB: null, zB: null, rot: 0 }, 0);
  move('yel', ysm, { x: YX3 - 200, y: GROUND, rot: 0 });
  ev('stars', { who: 'yel', f0: ysm + 6, f1: ysm + 40, snd: false });
  sfx('ref:laugh', LIE2 + 2, { who: 'pink', gain: 0.8, pitch: 1.35 });

  // ---- 17.5–22 с: Розовая «растёт» в центре, руки вверх
  laugh('pink', LIE2 + 2, LIE2 + 10);
  const PB2 = transform('pink', LIE2 + 12, CX, CX, -1, { style: 'grow' });
  key('pink', PB2, stance('pink', CX, -1), 0);
  const WIN = victory('pink', PB2 + 3, CX, { face: -1 });
  window.T = { D1, FLY1, SN, PB, GR, TW1, SH1, LND, YB, SL, SN2, psm, EAT, Z, LIE2, PB2, WIN };
};

// ------------------------------------------------------------------ рисование
ST.hooks.beforeChars.push((ctx, f, S, CAM) => {
  ctx.setTransform(...CAM);
  const c = candyAt(f, S);
  const cur = CANDY.filter((k) => f >= k.f0).pop();
  if (c && cur && !cur.hand) FX.cottonCandy(ctx, c.x, c.y, CL, rAt(f), c.rot, 3);
});
ST.hooks.afterChars.push((ctx, f, S, CAM) => {
  ctx.setTransform(...CAM);
  const c = candyAt(f, S);
  const cur = CANDY.filter((k) => f >= k.f0).pop();
  if (c && cur && cur.hand && S[cur.hand].p.form === 'big') FX.cottonCandy(ctx, c.x, c.y, CL, rAt(f), c.rot, 3);
  for (const b of BLOB) {
    if (f < b.f0 || (b.f1 && f >= b.f1)) continue;
    const r = typeof b.r === 'function' ? b.r(f) : b.r;
    if (b.on) {
      const p = target(`${b.on}:${b.part}`, S);
      FX.fluff(ctx, p[0], p[1] + (b.part === 'face' ? 10 : 0), r, b.f0, b.cocoon ? Math.min(1, (f - b.f0) / 6) : 1);
    } else if (b.hand) {
      if (S[b.hand].p.form !== 'big') continue;
      const h = C[b.hand].big.point(S[b.hand].st, 'handF');
      FX.fluff(ctx, h[0], h[1] - 20, r, b.f0);
    } else {
      const u = E.clamp((f - b.f0) / (b.f1 - b.f0), 0, 1), a = P(b.a, b.f0, statesAt(b.f0)), q = P(b.b, f, S);
      FX.fluff(ctx, E.lerp(a[0], q[0], u), E.lerp(a[1], q[1], u) - Math.sin(Math.PI * u) * b.arc, E.lerp(b.r0, b.r1, u), b.f0);
    }
  }
  for (const b of BURST) { const at = P(b.at, b.f, statesAt(b.f)); FX.fluffBurst(ctx, at[0], at[1], (f - b.f) / 22, b.size, b.f); }
});

ST.start(BIG);
