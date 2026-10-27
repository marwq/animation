// Серия 2, ролик 18: Пена — Жёлтая (слева) против Радужного (справа), 22 с, 24 кадра/с. Драка без ударов:
// огнетушитель с пеной: засыпать пеной с головой, укатить пенным шаром, перетягивать шланг, прокатиться на нём, как на ракете.
// Музыка превращения — один раз. Фон — замок.
//
//   0–2 с     шарик-Жёлтая и радужный шарик неподвижно стоят друг напротив друга, середина пустая
//   2–3.8 с   с неба падает огнетушитель; Радужный прыгает на рычаг — Жёлтую засыпает пеной с головой
//   3.7–4.8 с Жёлтая «растёт» под музыку прямо в пене — пена разлетается, Радужный влюблён
//   5–9 с     она берёт огнетушитель и запенивает Радужного — пенный шар укатывается и лопается
//   9–13 с    Радужный «растёт», хватает шланг — перетягивание, пена на траве — она поскальзывается — «пуф»
//   13–16 с   он бросает огнетушитель; шарик-Жёлтая прыгает на рычаг — огнетушитель летит, как ракета, ему под ноги —
//             он падает лицом в пену — «пуф» и удирает
//   16–22 с   Жёлтая «растёт» и в центре, руки вверх
'use strict';

const ST = Stage({
  name: '18 Жёлтая vs Радужный',
  frames: 528,
  cast: {
    yel: { small: ['girl-verity-small', { bodyHeight: 300, recolor: 'yellow' }],
      big: ['verity-big-girl', { height: 730, splitFeet: true, recolor: 'yellow' }], pivot: 337, voice: 1.45, vAngle: 50, lie: 55,
      color: '#ffe23a', moods: { angry: 'angry theeth', grin: 'theeth smile', big: 'theeth smile' } },
    rb: { small: ['skeleton-verity-small', { scale: 0.455, recolor: 'rainbow' }], big: ['all-verity-color', { height: 730 }],
      pivot: 325, voice: 0.85, lie: 55, color: '#ff7a3a', moods: { angry: 'angry theeth', grin: 'happy with theeth', big: 'theeth smile', love: 'happy - spittle' } },
  },
  order: ['rb', 'yel'],
  background: { theme: 'castle', seed: 1018, sunX: 1500, sunY: 130 },
  clouds: [[150, 80, 2.4, 0, 12], [700, 220, 1.8, 1, 16], [1150, 70, 2.6, 2, 10], [1720, 250, 1.5, 0, 18]],
});
const { FPS, NF, GROUND, C, key, move, ev, sfx, hop, laugh, tremble, transform, shrink, stance, walk,
  slip, fallBack, victory, chuckle, hand, statesAt, target } = ST;
const P = (v, f, S) => (typeof v === 'function' ? v(f, S) : typeof v === 'string' ? target(v, S) : v);

// ------------------------------------------------------------------ огнетушитель и пена
const ES = 170;
const EXT = [];           // {f0, at:[x,y], rot, aim, lever} | {f0, f1, a, b, arc, rot0, rot1, aim0, aim1} | {f0, hand, aim, noz} | {f0, ride: [x0, x1, f1]}
const SPRAY = [];         // {f0, f1, to} — струя из раструба
const PILES = [];         // {f0, f1, who | x, w0, w1, h0, h1, n, dy}
const PUFFS = [];         // {f, at, size} — пена разлетается
function segAt(segs, f) { let c = null; for (const s of segs) if (f >= s.f0) c = s; return c && !c.gone ? c : null; }
// состояние огнетушителя: низ (x, y), наклон, куда раструб, нажат ли рычаг, где раструб (если держат за шланг)
function extAt(f, S) {
  const c = segAt(EXT, f);
  if (!c) return null;
  const lever = SPRAY.some((s) => f >= s.f0 && f < s.f1) ? 1 : 0;
  if (c.at) return { x: c.at[0], y: c.at[1], rot: c.rot || 0, aim: c.aim ?? Math.PI, lever, noz: null };
  if (c.hand) {
    if (S[c.hand].p.form !== 'big') return null;
    const h = C[c.hand].big.point(S[c.hand].st, 'handF');
    const x = h[0] + 8, y = h[1] + ES * 0.95;
    let aim = c.aim;
    if (typeof aim === 'string') { const t = target(aim, S); aim = Math.atan2(t[1] - (y - ES * 0.9), t[0] - x); }
    let noz = null;
    if (c.noz) { const g = C[c.noz].big.point(S[c.noz].st, 'handF'); noz = g; aim = Math.atan2(g[1] - (y - ES * 0.9), g[0] - x); }
    return { x, y, rot: 0, aim, lever, noz };
  }
  if (c.ride) {
    const [x0, x1, f1] = c.ride, u = E.EASE.in2(E.clamp((f - c.f0) / (f1 - c.f0), 0, 1));
    return { x: E.lerp(x0, x1, u), y: GROUND - ES * 0.21 - 2, rot: -Math.PI / 2, aim: Math.PI, lever: 1, noz: null };
  }
  const u = E.clamp((f - c.f0) / (c.f1 - c.f0), 0, 1), e = c.ease ? E.EASE[c.ease](u) : u;
  const a = P(c.a, c.f0, statesAt(c.f0)), b = P(c.b, f, S);
  return { x: E.lerp(a[0], b[0], e), y: E.lerp(a[1], b[1], e) - Math.sin(Math.PI * u) * (c.arc || 0), rot: E.lerp(c.rot0 || 0, c.rot1 || 0, e),
    aim: E.lerp(c.aim0 ?? Math.PI, c.aim1 ?? Math.PI, e), lever, noz: null };
}
function spray(f0, f1, to, gain = 0.7) { SPRAY.push({ f0, f1, to }); sfx('flick', f0, { x: 960, gain: 0.5 }); sfx('rain', f0, { x: 960, dur: f1 - f0, gain }); sfx('gust', f0, { x: 960, dur: f1 - f0, gain: 0.4 }); }
function puffs(f, at, size = 1) { PUFFS.push({ f, at, size }); sfx('poof', f, { x: 960, gain: 0.7 }); sfx('splash', f, { x: 960, gain: 0.4 }); }
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

const YX0 = 560, RX0 = 1360, EX = 960;
// ================================================================== 0–2 с: неподвижная стойка
key('yel', 0, { form: 'small', x: YX0, y: GROUND, face: 1, look: 1, eyes: 'normal', mouth: 'smile normal', sx: 1, sy: 1, rot: 0, pivot: 0, alpha: 1 }, 0);
key('rb', 0, { form: 'small', x: RX0, y: GROUND, face: -1, look: 1, eyes: 'normal', mouth: 'smile normal', sx: 1, sy: 1, rot: 0, pivot: 0, alpha: 1 }, 0);

const BIG = () => {
  // ---- 2–3.8 с: огнетушитель с неба — Радужный на рычаг — Жёлтую засыпает пеной
  EXT.push({ f0: 48, f1: 54, a: [EX, -250], b: [EX, GROUND], ease: 'in2' }, { f0: 54, at: [EX, GROUND] });
  sfx('whoosh', 48, { x: EX, dur: 6, gain: 0.5 }); sfx('bonk', 54, { x: EX, gain: 0.7, pitch: 0.7 });
  ev('dust', { f: 54, x: EX, r: 60, n: 5, snd: false });
  key('yel', 50, { mouth: 'puzzlement' }, 0); key('rb', 50, { mouth: 'puzzlement' }, 0);
  key('rb', 55, { mouth: 'happy with theeth', eyes: 'angry' }, 0);
  sfx('ref:grin-eee', 55, { who: 'rb', gain: 0.4, pitch: 0.9 });
  const ON = 66;
  hopTo('rb', 56, ON, RX0, GROUND, EX + 10, GROUND - ES * 0.98, 140, { land: false });
  key('rb', ON, { sx: 1.3, sy: 0.75 }, 1); key('rb', ON + 4, { sx: 1, sy: 1 }, 3);
  const S1 = ON + 1, E1 = S1 + 24;
  spray(S1, E1, 'yel:body');
  PILES.push({ f0: S1 + 4, f1: 0, who: 'yel', w0: 60, w1: 400, h0: 40, h1: 400, n: 16 });
  key('yel', S1 + 2, { mouth: 'puzzlement', eyes: 'sad' }, 0);
  sfx('scared', S1 + 3, { who: 'yel', gain: 0.6 });
  move('yel', S1 + 2, { x: YX0 }); move('yel', S1 + 14, { x: YX0 - 60 }, 'out2');
  key('yel', S1 + 3, { sx: 0.9, sy: 1.1 }, 3); key('yel', S1 + 8, { sx: 1, sy: 1 }, 4);
  for (let f = ON + 6; f < E1; f += 6) { key('rb', f, { sx: 1.08, sy: 0.92 }, 3); key('rb', f + 3, { sx: 0.96, sy: 1.04 }, 3); }
  key('rb', ON + 4, { mouth: 'happy with theeth', eyes: 'normal' }, 0);
  sfx('ref:laugh', ON + 6, { who: 'rb', gain: 0.85, pitch: 0.9 });

  // ---- 3.7–4.8 с: Жёлтая «растёт» в пене — пена разлетается, Радужный влюблён
  const YX = YX0 - 40, TF = E1 - 6;
  const YB = transform('yel', TF, YX0 - 60, YX, 1, { style: 'grow', love: 'rb', loveDur: 50 });
  PILES[0].f1 = TF + 21; puffs(TF + 21, [YX0 - 60, GROUND - 220], 1.2);
  key('yel', YB, stance('yel', YX, 1), 0);
  key('yel', YB + 4, { mouth: 'theeth smile', eyes: 'normal' }, 0);
  // влюблённый Радужный соскакивает
  const RX1 = 1260;
  hopTo('rb', YB + 4, YB + 14, EX + 10, GROUND - ES * 0.98, RX1, GROUND, 90);
  ev('hearts', { who: 'rb', f0: YB + 14, f1: YB + 40, snd: false });

  // ---- 5–9 с: берёт огнетушитель — запенивает Радужного — пенный шар укатывается и лопается
  const YX1 = 760;
  walk('yel', YB + 6, YX, YX1, 2, 9, 1);
  const GRAB = YB + 28;
  key('yel', GRAB - 5, { lean: 26, hip: [0, ST.toRig('yel', 120)], head: 6 }, 5);
  key('yel', GRAB, { hitF: 1, hitFto: [EX - 6, GROUND - ES * 0.9], hitFfix: GRAB }, 4);
  EXT.push({ f0: GRAB, hand: 'yel', aim: 'rb:body' });
  sfx('pop', GRAB, { who: 'yel', gain: 0.4 });
  key('yel', GRAB + 8, { ...stance('yel', YX1, 1), hitF: 0, handF: hand('yel', 'F', 0.75, 0.05), mouth: 'theeth smile', eyes: 'angry' }, 8);
  const S2 = GRAB + 12, E2 = S2 + 22;
  spray(S2, E2, 'rb:body');
  key('rb', S2 + 2, { mouth: 'puzzlement', eyes: 'sad' }, 0);
  PILES.push({ f0: S2 + 3, f1: 0, who: 'rb', w0: 60, w1: 420, h0: 40, h1: 420, n: 15 });
  key('yel', S2 + 8, { mouth: 'happy with theeth', eyes: 'normal' }, 0);
  sfx('ref:laugh', S2 + 8, { who: 'yel', gain: 0.85, pitch: 1.45 });
  chuckle('yel', S2 + 8, E2 + 20, { mouth: 'happy with theeth' });
  // последняя струя — пенный шар катится вправо
  const R0 = E2 + 2, R1 = R0 + 16, RX2 = 1620;
  spray(R0 - 2, R0 + 6, 'rb:body', 0.6);
  move('rb', R0, { x: RX1, y: GROUND }); move('rb', R1, { x: RX2 }, 'in2');
  sfx('slide', R0, { x: 1400, gain: 0.5, pitch: 0.8 });
  const POP = R1 + 2;
  PILES[1].f1 = POP; puffs(POP, [RX2, GROUND - 210], 1.2);
  key('rb', POP, { mouth: 'puzzlement', eyes: 'sad', face: -1 }, 0);
  ev('stars', { who: 'rb', f0: POP + 2, f1: POP + 16 });

  // ---- 9–13 с: Радужный «растёт», хватает шланг — перетягивание, пена на траве — она поскальзывается — «пуф»
  key('rb', POP + 10, { eyes: 'angry', mouth: 'angry theeth' }, 0);
  const RB = transform('rb', POP + 12, RX2, 1560, -1, { style: 'grow' });
  key('rb', RB, stance('rb', 1560, -1), 0);
  key('rb', RB + 4, { mouth: 'theeth smile', eyes: 'angry' }, 0);
  key('yel', RB - 4, { mouth: 'puzzlement', eyes: 'normal', handF: hand('yel', 'F', 0.6, 0.2) }, 4);
  const RX3 = 1260;
  walk('rb', RB + 4, 1560, RX3, 2, 9, -1);
  const TUG = RB + 26;
  key('rb', TUG - 4, { hitF: 1, hitFto: (() => [RX3 - 230, GROUND - 330])(), hitFfix: TUG }, 4);
  EXT.push({ f0: TUG, hand: 'yel', noz: 'rb' });
  sfx('pop', TUG, { who: 'rb', gain: 0.5 });
  key('rb', TUG + 4, { hitF: 0, handF: hand('rb', 'F', 0.7, -0.1), handB: hand('rb', 'B', 0.6, -0.15), mouth: 'theeth smile' }, 4);
  // перетягивают: качаются туда-сюда, пена летит на траву
  for (let i = 0; i < 3; i++) {
    const f = TUG + 6 + i * 6;
    key('yel', f, { lean: i % 2 ? -14 : 4, handF: hand('yel', 'F', i % 2 ? 0.85 : 0.6, 0.1) }, 4, 'io');
    key('rb', f, { lean: i % 2 ? 6 : -14, handF: hand('rb', 'F', i % 2 ? 0.55 : 0.8, -0.1) }, 4, 'io');
    sfx('swing', f - 2, { x: 960, gain: 0.5 });
  }
  key('yel', TUG + 4, { mouth: 'angry theeth', eyes: 'angry' }, 0);
  const S3 = TUG + 4, E3 = TUG + 24;
  spray(S3, E3, (f, S) => [960 + Math.sin(f * 0.5) * 120, GROUND - 10], 0.6);
  PILES.push({ f0: S3 + 2, f1: 0, x: 960, w0: 60, w1: 520, h0: 10, h1: 70, n: 10 });
  // рывок — она едет по пене — падает
  const YANK = E3;
  key('rb', YANK, { lean: -22, handF: hand('rb', 'F', 0.35, -0.1), mouth: 'happy with theeth' }, 3, 'out');
  sfx('swing', YANK - 2, { who: 'rb', gain: 0.9 });
  key('yel', YANK, { lean: 18, mouth: 'puzzlement', eyes: 'sad' }, 2);
  move('yel', YANK, { x: YX1 }); move('yel', YANK + 6, { x: 850 }, 'out2');
  sfx('slide', YANK, { who: 'yel', gain: 0.6, pitch: 1.2 });
  const SL = YANK + 6;
  const LIE = slip('yel', SL, 850, 1, { n: 12, stars: 24 });
  EXT.push({ f0: SL, hand: 'rb', aim: Math.PI * 0.6 });
  const YBX = 700;
  const ysm = shrink('yel', LIE + 6, YBX, 1, { mouth: 'puzzlement', eyes: 'sad', smoke: 420 });
  key('yel', ysm, { lean: 0, head: 0, hip: [0, 0], legF: null, legB: null, zB: null, rot: 0 }, 0);
  move('yel', ysm, { x: YBX, y: GROUND, rot: 0 });
  ev('stars', { who: 'yel', f0: ysm + 4, f1: ysm + 16, snd: false });
  key('rb', SL + 4, { lean: 0, mouth: 'happy with theeth', eyes: 'normal' }, 4);
  sfx('ref:laugh', SL + 6, { who: 'rb', gain: 0.85, pitch: 0.75 });
  chuckle('rb', SL + 6, ysm + 12, { mouth: 'happy with theeth' });

  // ---- 13–16 с: он бросает огнетушитель — шарик-Жёлтая на рычаг — ракета ему под ноги — он падает лицом в пену
  const TOSS = ysm + 8, LYX = 1000, LY = GROUND - ES * 0.21 - 2;
  key('rb', TOSS - 4, { handF: hand('rb', 'F', 0.1, -0.9) }, 4);
  key('rb', TOSS, { handF: hand('rb', 'F', 0.8, 0.3) }, 3, 'in2');
  sfx('swing', TOSS - 2, { who: 'rb', gain: 0.7 });
  EXT.push({ f0: TOSS, f1: TOSS + 10, a: (f, S) => { const e = extAt(TOSS - 1, statesAt(TOSS - 1)); return [e.x, e.y]; }, b: [LYX, LY], arc: 90, rot0: 0, rot1: -Math.PI / 2, aim0: Math.PI * 0.6, aim1: Math.PI },
    { f0: TOSS + 10, at: [LYX, LY], rot: -Math.PI / 2, aim: Math.PI });
  sfx('bonk', TOSS + 10, { x: LYX, gain: 0.6, pitch: 0.7 });
  key('rb', TOSS + 8, { ...stance('rb', RX3, -1), mouth: 'happy with theeth' }, 6);
  key('yel', ysm + 10, { eyes: 'angry', mouth: 'angry theeth' }, 0);
  const UP = TOSS + 16, TOPY = GROUND - ES * 0.42 - 4;
  hopTo('yel', TOSS + 6, UP, YBX, GROUND, LYX - 20, TOPY, 120, { land: false });
  key('yel', UP, { sx: 1.3, sy: 0.75 }, 1); key('yel', UP + 4, { sx: 1, sy: 1 }, 3);
  sfx('land', UP, { who: 'yel', gain: 0.5 });
  key('yel', UP + 3, { mouth: 'theeth smile', eyes: 'angry' }, 0);
  const GO = UP + 4, HITF = GO + 9, HX = RX3 - 40;
  EXT.push({ f0: GO, ride: [LYX, HX, HITF] });
  spray(GO, HITF + 4, (f, S) => { const e = extAt(f, S); return [e.x - 420, GROUND - 60]; }, 0.7);
  sfx('whoosh', GO, { x: 1100, dur: 9, gain: 0.7 });
  move('yel', GO, { x: LYX - 20, y: TOPY }); move('yel', HITF, { x: HX - 20 }, 'in2');
  key('rb', HITF - 6, { mouth: 'puzzlement', eyes: 'sad' }, 0);
  const FB = fallBack('rb', HITF, RX3, -1, { forward: true, n: 14, stars: 30 });
  sfx('bonk', HITF, { who: 'rb', gain: 0.9 });
  sfx('squish', FB, { x: 700, gain: 0.9 }); sfx('splash', FB, { x: 700, gain: 0.5 });
  puffs(FB, [RX3 - 520, GROUND - 60], 0.8);
  EXT.push({ f0: HITF, f1: HITF + 12, a: [HX, LY], b: [1440, LY], arc: 120, rot0: -Math.PI / 2, rot1: -Math.PI / 2 - Math.PI * 2, aim0: Math.PI, aim1: Math.PI - Math.PI * 2 },
    { f0: HITF + 12, at: [1440, LY], rot: -Math.PI / 2, aim: Math.PI });
  sfx('bonk', HITF + 12, { x: 1440, gain: 0.5, pitch: 0.7 });
  // Жёлтую подбрасывает — приземляется справа
  const YX4 = 1600;
  hopTo('yel', HITF, HITF + 16, HX - 20, TOPY, YX4, GROUND, 260);
  key('yel', HITF + 16, { mouth: 'happy with theeth', eyes: 'normal' }, 0);
  sfx('ref:laugh', HITF + 16, { who: 'yel', gain: 0.85, pitch: 1.45 });
  laugh('yel', HITF + 18, HITF + 22);
  const RBX = RX3 - 330;
  const rsm = shrink('rb', FB + 8, RBX, -1, { mouth: 'puzzlement', eyes: 'sad', smoke: 420 });
  key('rb', rsm, { lean: 0, head: 0, hip: [0, 0], legF: null, legB: null, zB: null, rot: 0 }, 0);
  move('rb', rsm, { x: RBX, y: GROUND, rot: 0 });
  PILES.push({ f0: rsm, f1: 0, who: 'rb', w0: 200, w1: 200, h0: 130, h1: 130, n: 1, dy: -150 });
  PILES[2].f1 = rsm + 40;
  // удирает влево
  key('rb', rsm + 10, { face: -1 }, 0);
  sfx('scared', rsm + 10, { who: 'rb', gain: 0.6 });
  let rx = RBX;
  for (let k = 0; k < 3; k++) { const a = rsm + 12 + k * 9, nx = rx - 430; hop('rb', a, a + 8, rx, nx, 90, { prep: 1 }); rx = nx; }

  // ---- Жёлтая «растёт» — в центр
  const YB2 = transform('yel', HITF + 20, YX4, YX4 - 40, -1, { style: 'grow' });
  key('yel', YB2, stance('yel', YX4 - 40, -1), 0);
  key('yel', YB2 + 4, { mouth: 'happy with theeth' }, 0);
  const WIN = victory('yel', YB2 + 6, YX4 - 40, { n: 8, stride: 150 });
  window.T = { ON, TF, YB, GRAB, S2, POP, RB, TUG, YANK, SL, ysm, TOSS, UP, HITF, FB, rsm, YB2, WIN };
};

// ------------------------------------------------------------------ рисование
const drawExt = (ctx, f, S) => {
  const e = extAt(f, S);
  if (!e) return null;
  return FX.extinguisher(ctx, e.x, e.y, ES, e.rot, e.aim, e.lever, e.noz);
};
ST.hooks.beforeChars.push((ctx, f, S, CAM) => {
  ctx.setTransform(...CAM);
  window._noz = null;
  for (const p of PILES) if (p.x && f >= p.f0 && (!p.f1 || f < p.f1)) {
    const u = E.EASE.out2(E.clamp((f - p.f0) / (p.n || 12), 0, 1));
    FX.foamPile(ctx, p.x, GROUND + 6, E.lerp(p.w0, p.w1, u), E.lerp(p.h0, p.h1, u), f / FPS, 9);
  }
  const c = segAt(EXT, f);
  if (c && (c.at || c.ride)) {
    const n = drawExt(ctx, f, S);
    window._noz = n;
  }
});
ST.hooks.afterChars.push((ctx, f, S, CAM) => {
  ctx.setTransform(...CAM);
  const c = segAt(EXT, f);
  let n = window._noz;
  if (c && !(c.at || c.ride)) n = drawExt(ctx, f, S);
  for (const p of PILES) {
    if (p.x || f < p.f0 || (p.f1 && f >= p.f1)) continue;
    const u = E.EASE.out2(E.clamp((f - p.f0) / (p.n || 12), 0, 1)), q = S[p.who].p;
    const h = E.lerp(p.h0, p.h1, u), y = p.dy ? target(`${p.who}:top`, S)[1] + h * 0.55 : GROUND + 6;
    FX.foamPile(ctx, q.x, y, E.lerp(p.w0, p.w1, u), h, f / FPS, 4);
  }
  for (const s of SPRAY) {
    if (f < s.f0 || f >= s.f1 || !n) continue;
    const to = P(s.to, f, S);
    FX.foamJet(ctx, n[0], n[1], to[0], to[1], f / FPS, 30, s.f0);
  }
  for (const p of PUFFS) {
    const u = (f - p.f) / 20;
    if (u < 0 || u > 1) continue;
    const r = FX.rng(p.f + 3);
    for (let i = 0; i < 18; i++) {
      const a = -Math.PI * r(), v = (180 + 260 * r()) * p.size, rr = (22 + 26 * r()) * p.size * (1 - 0.4 * u);
      FX.puff(ctx, p.at[0] + Math.cos(a) * v * E.EASE.out2(u), p.at[1] + Math.sin(a) * v * 0.7 * E.EASE.out2(u) + 200 * u * u, rr, 1 - u, '#ffffff', '#7a8a98');
    }
  }
});

ST.start(BIG);
