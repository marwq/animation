// Серия 2, ролик 02: Песок — Жёлтая (слева) против Радужного (справа), 22 с, 24 кадра/с. Драка без ударов:
// песок из майнкрафта падает с неба и засыпает, из-под песка вырастают руки-лапы, песчаная колонна, блок на голову.
// Музыка превращения — один раз. Фон — саванна.
//
//   0–2 с     шарик-Жёлтая и радужный шарик неподвижно стоят друг напротив друга, середина пустая
//   2–3.5 с   Радужный подпрыгивает и бухается — с неба сыплются блоки песка и засыпают Жёлтую с головой
//   3.6–5 с   из горки песка вылезают руки-лапы — горка разлетается, Жёлтая большая (музыка), Радужный влюблён
//   5.2–8 с   она топает — песок с неба засыпает Радужного
//   8–9.2 с   из-под песка — большой Радужный
//   9.4–13 с  хлопает — песок засыпает Жёлтую по шею, он ставит ей блок на голову; она злится — песок
//             разлетается, блоки попадают в него — «пуф»
//   13.5–16.5 с шарик-Радужный удирает — на него падает блок, он сплющен, выползает и удирает за край
//   16.5–22 с Жёлтая в центре, руки вверх
'use strict';

const ST = Stage({
  name: '02 Жёлтая vs Радужный',
  frames: 528,
  cast: {
    yel: { small: ['girl-verity-small', { bodyHeight: 300, recolor: 'yellow' }],
      big: ['verity-big-girl', { height: 730, splitFeet: true, recolor: 'yellow' }], pivot: 337, voice: 1.45, vAngle: 50, lie: 55,
      color: '#ffe23a', moods: { angry: 'angry theeth', grin: 'theeth smile', big: 'theeth smile' } },
    rb: { small: ['skeleton-verity-small', { scale: 0.455, recolor: 'rainbow' }], big: ['all-verity-color', { height: 730 }],
      pivot: 325, voice: 0.85, lie: 55, color: '#ff7a3a', moods: { angry: 'angry theeth', grin: 'happy with theeth', big: 'theeth smile', love: 'happy - spittle' } },
  },
  order: ['yel', 'rb'],
  background: { theme: 'savanna', seed: 1002, sunX: 1500, sunY: 130 },
  clouds: [[150, 80, 2.4, 0, 12], [700, 220, 1.8, 1, 16], [1150, 70, 2.6, 2, 10], [1720, 250, 1.5, 0, 18]],
});
const { FPS, NF, GROUND, C, key, move, ev, sfx, hop, laugh, tremble, transform, shrink, stance, walk, turn,
  stomp, victory, chuckle, hand, toRig, statesAt, stateAt, target } = ST;
const P = (v, f, S) => (typeof v === 'function' ? v(f, S) : typeof v === 'string' ? target(v, S) : v);
const SAND = ['#f2dea0', '#e6cf8a', '#f8e9b8', '#d9bf78'];

// ------------------------------------------------------------------ блоки песка
const BL = [];            // {x, y, s, f0, f1, gone, seed, from?, fly?: {f0, f1, a, b, arc, spin}}
const BURST = [];         // {f, x, y, size}
const CLIP = [];          // {who, f0, f1} — ниже травы не видно (в песке)
ST.hooks.clip = (ctx, who, f) => {
  if (!CLIP.some((c) => c.who === who && f >= c.f0 && (!c.f1 || f < c.f1))) return false;
  ctx.beginPath(); ctx.rect(-600, -600, 3200, 600 + GROUND + 8);
  return true;
};
// засыпать песком: колонны cols × rows с центром низа в cx, блок s; падают по одному
function bury(f0, cx, cols, rows, s, step = 2, n = 7) {
  let k = 0, last = f0;
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const x = cx + (c - (cols - 1) / 2) * s, y = GROUND - s / 2 - r * s, a = f0 + k * step, b = a + n;
    BL.push({ x, y, s, f0: a, f1: b, gone: 1e9, seed: k + Math.round(cx) });
    if (k % 2 === 0) sfx('land', b, { x, gain: 0.45, pitch: 1.3 });
    sfx('crunch', b, { x, gain: 0.25 });
    k++; last = b;
  }
  ev('dust', { f: f0 + n, x: cx, r: cols * s * 0.4, n: 8, snd: false });
  return last;
}
// горка разлетается
function unbury(f, cx, size = 1.3) {
  let top = GROUND;
  for (const b of BL) if (Math.abs(b.x - cx) < 260 && b.f1 <= f && b.gone > f) { b.gone = f; top = Math.min(top, b.y); }
  BURST.push({ f, x: cx, y: (top + GROUND) / 2, size });
  sfx('crunch', f, { x: cx, gain: 0.9 }); sfx('poof', f, { x: cx, gain: 0.6 });
  ev('shake', { f, amp: 14, n: 10 });
}
function blockPos(b, f, S) {
  if (b.fly && f >= b.fly.f0) {
    const u = E.clamp((f - b.fly.f0) / (b.fly.f1 - b.fly.f0), 0, 1), a = P(b.fly.a, b.fly.f0, statesAt(b.fly.f0)), c = P(b.fly.b, f, S);
    return [E.lerp(a[0], c[0], u), E.lerp(a[1], c[1], u) - Math.sin(Math.PI * u) * (b.fly.arc || 0), u * (b.fly.spin || 0)];
  }
  const u = E.clamp((f - b.f0) / (b.f1 - b.f0), 0, 1);
  const y0 = b.from ?? -200, y = E.lerp(typeof y0 === 'function' ? y0(f, S) : y0, b.y, E.EASE.in2(u));
  return [b.x, y, 0];
}

const YX0 = 560, RX0 = 1360;
// ================================================================== 0–2 с: неподвижная стойка
key('yel', 0, { form: 'small', x: YX0, y: GROUND, face: 1, look: 1, eyes: 'normal', mouth: 'smile normal', sx: 1, sy: 1, rot: 0, pivot: 0, alpha: 1 }, 0);
key('rb', 0, { form: 'small', x: RX0, y: GROUND, face: -1, look: 1, eyes: 'normal', mouth: 'smile normal', sx: 1, sy: 1, rot: 0, pivot: 0, alpha: 1 }, 0);

const BIG = () => {
  // ---- 2–3.5 с: Радужный бухается — песок засыпает Жёлтую
  key('rb', 48, { mouth: 'happy with theeth', eyes: 'angry' }, 0);
  sfx('ref:grin-eee', 48, { who: 'rb', gain: 0.4, pitch: 1.1 });
  hop('rb', 50, 62, RX0, RX0, 220, { land: 1.45, landY: 0.62 });
  ev('shake', { f: 62, amp: 12, n: 8 }); sfx('slam', 62, { who: 'rb', gain: 0.8 });
  const B0 = 62;
  key('yel', B0 + 2, { mouth: 'puzzlement', eyes: 'sad' }, 0);
  sfx('scared', B0 + 4, { who: 'yel', gain: 0.7 });
  const BEND = bury(B0 + 2, YX0, 3, 3, 106, 2, 7);
  key('yel', BEND, { mouth: 'puzzlement', eyes: 'sad' }, 0);
  sfx('ref:laugh', BEND - 4, { who: 'rb', gain: 0.85, pitch: 1.0 });
  key('rb', BEND - 4, { mouth: 'happy with theeth', eyes: 'normal' }, 0);
  laugh('rb', BEND - 2, BEND + 26);

  // ---- 3.6–5 с: из горки — руки-лапы, горка разлетается, Жёлтая большая; Радужный влюблён
  const YX = 600;
  const YB = transform('yel', BEND + 2, YX0, YX, 1, { style: 'grow', love: 'rb', loveDur: 30 });
  unbury(YB, YX0, 1.5);
  key('yel', YB, stance('yel', YX, 1), 0);
  key('yel', YB + 6, { mouth: 'theeth smile', eyes: 'angry' }, 0);

  // влюблённый Радужный скачет к ней — щелчок, кувырком назад
  ST.hop('rb', YB + 6, YB + 16, RX0, 1180, 100);
  ST.hop('rb', YB + 18, YB + 28, 1180, 980, 100);
  const FL = YB + 32;
  key('yel', FL - 5, { lean: 16, hip: [0, toRig('yel', 120)], head: 6, handF: hand('yel', 'F', 0.6, 0.2) }, 5);
  key('yel', FL, { hitF: 1, hitFto: (() => { const b = target('rb:body', stateAt(FL)); return [b[0] - 60, b[1]]; })(), hitFfix: FL }, 2, 'in2');
  key('yel', FL + 8, { ...stance('yel', YX, 1), hitF: 0, mouth: 'happy with theeth', eyes: 'angry' }, 8);
  sfx('flick', FL, { who: 'rb', gain: 1.0 }); sfx('bonk', FL, { who: 'rb', gain: 0.5 });
  key('rb', FL, { mouth: 'puzzlement', eyes: 'sad' }, 0);
  ST.tumble('rb', FL, FL + 14, 980, RX0, 150, 1.5, { stars: 12 });

  // ---- 5.2–8 с: топает — песок засыпает Радужного
  const STP = stomp('yel', FL + 18, YX, YX, 1);
  key('yel', STP + 4, { mouth: 'happy with theeth', eyes: 'angry' }, 0);
  key('rb', STP + 2, { mouth: 'puzzlement', eyes: 'sad' }, 0);
  sfx('scared', STP + 4, { who: 'rb', gain: 0.7 });
  hop('rb', STP + 2, STP + 10, RX0, RX0 + 30, 60);
  const BEND2 = bury(STP + 4, RX0 + 30, 3, 3, 106, 2, 7);
  sfx('ref:laugh', BEND2 - 4, { who: 'yel', gain: 0.85, pitch: 1.45 });
  chuckle('yel', BEND2 - 4, BEND2 + 18, { mouth: 'happy with theeth' });

  // ---- 8–9.2 с: из-под песка — большой Радужный
  const RX = 1360;
  key('rb', BEND2 + 4, { eyes: 'angry', mouth: 'angry theeth' }, 0);
  const RB = transform('rb', BEND2 + 6, RX0 + 30, RX, -1, { style: 'grow' });
  unbury(RB, RX0 + 30, 1.5);
  key('rb', RB, stance('rb', RX, -1), 0);
  key('rb', RB + 6, { mouth: 'happy with theeth', eyes: 'angry' }, 0);
  key('yel', RB - 2, { mouth: 'puzzlement', eyes: 'sad' }, 0);

  // ---- 9.4–13 с: хлопок — Жёлтая в песке по шею — блок на голову — она злится — разлетается — «пуф»
  const CL = RB + 6;
  key('rb', CL - 4, { handF: hand('rb', 'F', 0.6, -0.5), handB: hand('rb', 'B', 0.5, -0.6) }, 4);
  key('rb', CL, { handF: hand('rb', 'F', 0.75, -0.4), handB: hand('rb', 'B', 0.7, -0.45) }, 2, 'in2');
  sfx('slap', CL, { who: 'rb', gain: 0.9 });
  ev('twinkle', { f: CL, at: C.rb.big.point(stateAt(CL).rb.st, 'handF'), n: 12, size: 40 });
  key('rb', CL + 6, { ...stance('rb', RX, -1), mouth: 'happy with theeth', eyes: 'angry' }, 6);
  key('yel', CL + 2, { handF: hand('yel', 'F', 0.08, 0.95), handB: hand('yel', 'B', -0.05, 0.95), mouth: 'puzzlement', eyes: 'sad' }, 4);
  const BEND3 = bury(CL + 3, YX, 3, 3, 112, 1, 7);
  // проседает в песок по шею
  move('yel', CL + 3, { x: YX, y: GROUND });
  move('yel', BEND3, { y: GROUND + 120 }, 'io');
  CLIP.push({ who: 'yel', f0: CL + 3, f1: 0 });
  sfx('scared', CL + 6, { who: 'yel', gain: 0.8, pitch: 0.95 });
  // идёт к ней и ставит блок на голову
  const RX2 = 1020, W0 = BEND3 + 2;
  walk('rb', W0, RX, RX2, 2, 9, -1);
  const PUT = W0 + 22;
  const headTop = () => { const t = target('yel:top', stateAt(PUT)); return t[1]; };
  key('rb', PUT - 4, { lean: 8 }, 4);
  key('rb', PUT, { hitF: 1, hitFto: (() => [YX + 30, headTop() - 70])(), hitFfix: PUT }, 5);
  const HB = { x: YX, y: 0, s: 112, f0: PUT - 10, f1: PUT, gone: 1e9, seed: 77 };
  HB.y = headTop() - 56 + 8;
  HB.fly = { f0: PUT - 10, f1: PUT, a: (f, S) => { const h = C.rb.big.point(S.rb.st, 'handF'); return [h[0], h[1] - 50]; }, b: [YX, HB.y], arc: 40 };
  BL.push(HB);
  ev('twinkle', { f: PUT - 10, at: C.rb.big.point(stateAt(PUT - 10).rb.st, 'handF'), n: 12, size: 40 });
  key('rb', PUT - 10, { handF: hand('rb', 'F', 0.6, -0.7) }, 4);
  sfx('pop', PUT, { who: 'yel', gain: 0.7 }); sfx('bonk', PUT, { who: 'yel', gain: 0.6 });
  key('rb', PUT + 6, { ...stance('rb', RX2, -1), hitF: 0, mouth: 'happy with theeth', eyes: 'normal' }, 6);
  // второй блок — сверху на первый
  const PUT2 = PUT + 16;
  key('rb', PUT2 - 8, { handF: hand('rb', 'F', 0.6, -0.8) }, 4);
  ev('twinkle', { f: PUT2 - 8, at: C.rb.big.point(stateAt(PUT2 - 8).rb.st, 'handF'), n: 12, size: 40 });
  key('rb', PUT2, { hitF: 1, hitFto: [YX + 30, HB.y - 112 - 40], hitFfix: PUT2 }, 5);
  const HB2 = { x: YX, y: HB.y - 112, s: 112, f0: PUT2 - 8, f1: PUT2, gone: 1e9, seed: 78 };
  HB2.fly = { f0: PUT2 - 8, f1: PUT2, a: (f, S) => { const h = C.rb.big.point(S.rb.st, 'handF'); return [h[0], h[1] - 50]; }, b: [YX, HB2.y], arc: 40 };
  BL.push(HB2);
  sfx('pop', PUT2, { who: 'yel', gain: 0.7 }); sfx('bonk', PUT2, { who: 'yel', gain: 0.6 });
  key('rb', PUT2 + 6, { ...stance('rb', RX2, -1), hitF: 0 }, 6);
  sfx('ref:laugh', PUT + 4, { who: 'rb', gain: 0.85, pitch: 1.0 });
  chuckle('rb', PUT + 4, PUT2 + 20, { mouth: 'happy with theeth' });
  key('yel', PUT + 2, { mouth: 'angry theeth', eyes: 'angry' }, 0);
  ev('vein', { who: 'yel', f0: PUT2 + 2, f1: PUT2 + 22 });
  ev('steam', { who: 'yel', f0: PUT2 + 6, f1: PUT2 + 24 });
  // песок дрожит и разлетается; блоки — в Радужного
  const BR = PUT2 + 24;
  for (const b of BL) if (Math.abs(b.x - YX) < 260 && b.f1 <= BR && b.gone > BR) b.shake = [PUT2 + 10, BR];
  sfx('creak', PUT2 + 10, { x: YX, dur: 14, gain: 0.6 });
  unbury(BR, YX, 1.7);
  HB.gone = BR; HB2.gone = BR;
  CLIP[CLIP.length - 1].f1 = BR + 6;
  move('yel', BR, { y: GROUND + 120 });
  move('yel', BR + 5, { y: GROUND }, 'out');
  key('yel', BR, { ...stance('yel', YX, 1), handF: hand('yel', 'F', 0.75, -0.7), handB: hand('yel', 'B', -0.7, -0.7), mouth: 'angry theeth', eyes: 'angry' }, 2);
  key('yel', BR + 10, { ...stance('yel', YX, 1), mouth: 'theeth smile', eyes: 'angry' }, 8);
  const face = (f, S) => target('rb:face', S);
  for (let i = 0; i < 3; i++) {
    const hb = BR + 6 + i * 3;
    BL.push({ x: 0, y: 0, s: 90, f0: BR, f1: BR, gone: hb, seed: 90 + i, fly: { f0: BR, f1: hb, a: [YX + 40, GROUND - 400 + i * 60], b: face, arc: 120 - i * 30, spin: 6 } });
    sfx('bonk', hb, { who: 'rb', gain: 0.8 });
    BURST.push({ f: hb, at: face, size: 0.6 });
  }
  key('rb', BR + 6, { lean: -14, head: -12, mouth: 'puzzlement', eyes: 'sad', handF: hand('rb', 'F', 0.4, -0.7), handB: hand('rb', 'B', -0.4, -0.6) }, 2);
  tremble('rb', BR + 7, BR + 16, RX2, 7);
  const rsm = shrink('rb', BR + 16, RX2, -1, { mouth: 'puzzlement', eyes: 'sad', smoke: 420 });
  ev('stars', { who: 'rb', f0: rsm + 4, f1: rsm + 24, snd: false });

  // ---- 13.5–16.5 с: шарик-Радужный удирает — блок сверху — сплющен — выползает и удирает
  const RUN = rsm + 10;
  key('rb', RUN - 2, { mouth: 'puzzlement', eyes: 'sad', face: 1 }, 0);
  hop('rb', RUN, RUN + 10, RX2, 1230, 90);
  key('yel', RUN + 2, { handF: hand('yel', 'F', 0.5, -0.8), mouth: 'theeth smile', eyes: 'angry' }, 4);
  sfx('flick', RUN + 6, { who: 'yel', gain: 0.9 });
  const DROP = RUN + 20;
  BL.push({ x: 1230, y: GROUND - 75, s: 150, f0: RUN + 12, f1: DROP, gone: DROP + 26, seed: 99 });
  key('rb', DROP, { sx: 1.9, sy: 0.32 }, 1);
  sfx('slam', DROP, { who: 'rb', gain: 0.9 }); sfx('squish', DROP, { who: 'rb', gain: 0.6 });
  ev('dust', { f: DROP, x: 1230, r: 70, n: 8, snd: false });
  key('rb', DROP + 22, { sx: 1.9, sy: 0.32 }, 0);
  BURST.push({ f: DROP + 26, x: 1230, y: GROUND - 75, size: 1.1 });
  sfx('crunch', DROP + 26, { x: 1230, gain: 0.7 });
  key('rb', DROP + 28, { sx: 1, sy: 1 }, 4, 'out');
  sfx('boing', DROP + 28, { who: 'rb', gain: 0.6 });
  key('rb', DROP + 30, { mouth: 'puzzlement', eyes: 'sad' }, 0);
  ev('stars', { who: 'rb', f0: DROP + 30, f1: DROP + 44, snd: false });
  const R2 = DROP + 34;
  sfx('scared', R2, { who: 'rb', gain: 0.8 });
  for (let k = 0; k < 3; k++) hop('rb', R2 + k * 8, R2 + k * 8 + 8, 1230 + k * 260, 1230 + (k + 1) * 260, 100, { prep: 1 });
  sfx('ref:laugh', DROP + 4, { who: 'yel', gain: 0.85, pitch: 1.45 });
  chuckle('yel', DROP + 4, DROP + 28, { mouth: 'happy with theeth' });

  // ---- 16.5–22 с: в центр, руки вверх
  const WIN = victory('yel', DROP + 30, YX, { n: 9, stride: 120 });
  window.T = { BEND, YB, STP, BEND2, RB, BEND3, PUT, BR, rsm, DROP, WIN };
};

// ------------------------------------------------------------------ рисование
ST.hooks.afterChars.push((ctx, f, S, CAM) => {
  ctx.setTransform(...CAM);
  for (const b of BL) {
    if (f < b.f0 || f >= b.gone) continue;
    const [x, y, rot] = blockPos(b, f, S);
    let dx = 0;
    if (b.shake && f >= b.shake[0] && f < b.shake[1]) dx = Math.sin(f * 2.7 + b.seed) * 6;
    FX.sandBlock(ctx, x + dx, y, b.s, rot, b.seed);
  }
  for (const b of BURST) {
    const at = b.at ? P(b.at, b.f, statesAt(b.f)) : [b.x, b.y];
    FX.blockBurst(ctx, at[0], at[1], (f - b.f) / 22, b.f, SAND, 14, 46 * b.size, b.size, GROUND);
  }
});

ST.start(BIG);
