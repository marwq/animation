// Серия 2, ролик 04: Пончики — Розовая (слева) против Толстого (справа), 22 с, 24 кадра/с. Драка без ударов:
// Толстый глотает пончики и прыгает на неё; огромный пончик — спасательным кругом на Толстого, катится колесом.
// Музыка превращения — один раз. Фон — луг.
//
//   0–2 с     шарик-Розовая и Толстый неподвижно стоят друг напротив друга, середина пустая
//   2–4 с     с неба падает стопка пончиков; Толстый всасывает все три — раздувается — прыгает ей на голову
//   4–5.2 с   Розовая «растёт» под музыку — Толстый влюблён
//   5.4–7.5 с влюблённый Толстый скачет к ней, отрыгивает огромный пончик — она ловит и надевает ему на пояс
//   7.6–10 с  пинок — он катится колесом, отскакивает и катится обратно — ей под ноги — падает — «пуф»
//   10–12.4 с шарик-Розовая откусывает от пончика — «растёт» снова, Толстый влюблён опять
//   12.6–16 с поднимает Толстого над головой, крутит и бросает в небо
//   16–17.5 с Толстый падает обратно — она отступает, он прыгает мячиком и укатывается за край
//   17.5–22 с Розовая в центре, руки вверх
'use strict';

const ST = Stage({
  name: '04 Розовая vs Толстый',
  frames: 528,
  cast: {
    pink: { small: ['girl-verity-small', { bodyHeight: 300 }], big: ['girl-verity-big', { height: 730, splitFeet: true }],
      pivot: 337, voice: 1.35, vAngle: 50, lie: 55, color: '#ff4fc8', moods: { angry: 'angry theeth', grin: 'theeth smile', big: 'theeth smile' } },
    fat: { small: ['fat-verity-small', { bodyHeight: 450 }], pivot: 508, voice: 0.75, moods: { love: 'happy' } },
  },
  order: ['fat', 'pink'],
  background: { theme: 'meadow', seed: 1004, sunX: 1500, sunY: 130 },
  clouds: [[150, 80, 2.4, 0, 12], [700, 220, 1.8, 1, 16], [1150, 70, 2.6, 2, 10], [1720, 250, 1.5, 0, 18]],
});
const { FPS, NF, GROUND, C, key, move, ev, sfx, hop, laugh, tremble, transform, shrink, love, stance, walk, turn,
  kick, fallBack, victory, chuckle, hand, toRig, statesAt, stateAt, target } = ST;
const P = (v, f, S) => (typeof v === 'function' ? v(f, S) : typeof v === 'string' ? target(v, S) : v);
ST.parts.mouth = (ch, st) => E.apply(ch.eyeMatrix(st, 'puzzlement'), [611, 456]);     // рот Толстого
function fatOpen(f, k, n, extra = {}) { key('fat', f - n, { mouth: 'puzzlement' }, 0); key('fat', f, { mouthK: k, ...extra }, n, 'out'); }

// ------------------------------------------------------------------ пончики
const DN = [];            // {r, glaze, seed, segs: [{f0, at, rot} | {f0, f1, a, b, arc, spin, k0, k1, ease} | {f0, hand} | {f0, gone}]}
const RING = [];          // {f0, f1} — огромный пончик на поясе у Толстого
const CRUMB = [];         // {f, at}
function dnAt(D, f, S) {
  let c = null;
  for (const s of D.segs) if (f >= s.f0) c = s;
  if (!c || c.gone) return null;
  if (c.at) return { x: c.at[0], y: c.at[1], rot: c.rot || 0, k: c.k || 1 };
  if (c.hand) { if (S[c.hand].p.form !== 'big') return null; const h = C[c.hand].big.point(S[c.hand].st, 'handF'); return { x: h[0] + (c.dx || 0), y: h[1] + (c.dy || 0), rot: c.rot || 0, k: c.k || 1 }; }
  const u = E.clamp((f - c.f0) / (c.f1 - c.f0), 0, 1), e = c.ease ? E.EASE[c.ease](u) : u, a = P(c.a, c.f0, statesAt(c.f0)), b = P(c.b, f, S);
  return { x: E.lerp(a[0], b[0], e), y: E.lerp(a[1], b[1], e) - Math.sin(Math.PI * u) * (c.arc || 0), rot: u * (c.spin || 0), k: E.lerp(c.k0 ?? 1, c.k1 ?? 1, u) };
}

const YX0 = 560, FX0 = 1360, SX = 960;
// ================================================================== 0–2 с: неподвижная стойка
key('pink', 0, { form: 'small', x: YX0, y: GROUND, face: 1, look: 1, eyes: 'normal', mouth: 'smile normal', sx: 1, sy: 1, rot: 0, pivot: 0, alpha: 1 }, 0);
key('fat', 0, { form: 'small', x: FX0, y: GROUND, face: -1, look: 1, eyes: 'normal', mouth: 'smile normal', sx: 1, sy: 1, rot: 0, pivot: 0, mouthK: 1 }, 0);

const BIG = () => {
  // ---- 2–4 с: стопка пончиков — Толстый всасывает — раздувается — прыгает ей на голову
  const GL = ['#ff7ac8', '#8a4b22', '#ffe9a8'];
  const D = GL.map((g, i) => ({ r: 62, glaze: g, seed: i + 3, segs: [] }));
  DN.push(...D);
  const D1 = 56;
  D.forEach((d, i) => {
    const y = GROUND - 62 - i * 70;
    d.segs.push({ f0: 48 + i * 2, f1: D1 + i * 2, a: [SX, -150 - i * 140], b: [SX, y], ease: 'in2' }, { f0: D1 + i * 2, at: [SX, y] });
    sfx('land', D1 + i * 2, { x: SX, gain: 0.45, pitch: 1.2 });
  });
  key('pink', 50, { mouth: 'puzzlement' }, 0);
  key('fat', 50, { mouth: 'theeth smile', eyes: 'angry' }, 0);
  sfx('ref:grin-eee', 52, { who: 'fat', gain: 0.4, pitch: 0.8 });
  const FX1 = 1150;
  hop('fat', 58, 66, FX0, FX1, 90);
  const S0 = 66;
  fatOpen(S0, 2.1, 3);
  sfx('suck', S0, { who: 'fat', dur: 14, gain: 0.8 });
  D.slice().reverse().forEach((d, i) => {
    const a0 = S0 + i * 4, a1 = a0 + 5;
    d.segs.push({ f0: a0, f1: a1, a: [SX, GROUND - 62 - (2 - i) * 70], b: 'fat:mouth', spin: 3, k0: 1, k1: 0.3, ease: 'in2' }, { f0: a1, gone: true });
    sfx('gulp', a1, { who: 'fat', gain: 0.8 });
    key('fat', a1, { sx: 1.08 + i * 0.08, sy: 1.08 + i * 0.08 }, 2);
  });
  const FULL = S0 + 13;
  key('fat', FULL, { mouthK: 1, mouth: 'theeth smile', eyes: 'angry', sx: 1.32, sy: 1.32 }, 3);
  sfx('inflate', FULL - 4, { who: 'fat', dur: 6, gain: 0.6 });
  // прыжок на голову
  const J0 = FULL + 2, J1 = J0 + 12, ytop = target('pink:top', stateAt(1))[1];
  key('fat', J0, { sx: 1.5, sy: 1.15 }, 2);
  move('fat', J0, { x: FX1, y: GROUND });
  move('fat', J0 + 7, { y: GROUND - 380 }, 'out2');
  move('fat', J1, { x: YX0 + 30, y: GROUND - 115 }, 'in2');
  move('fat', J0 + 7, { x: (FX1 + YX0) / 2 }, 'lin');
  key('fat', J0 + 4, { sx: 1.25, sy: 1.4 }, 3);
  sfx('jump', J0 + 1, { who: 'fat', gain: 0.7 }); sfx('whoosh', J0 + 2, { who: 'fat', dur: 10, gain: 0.5 });
  key('pink', J1 - 6, { mouth: 'puzzlement', eyes: 'sad' }, 0);
  key('pink', J1, { sx: 1.75, sy: 0.42 }, 1);
  key('fat', J1, { sx: 1.55, sy: 1.1 }, 1);
  sfx('slam', J1, { who: 'pink', gain: 1.0 }); sfx('squish', J1, { who: 'pink', gain: 0.8 });
  ev('shake', { f: J1, amp: 16, n: 10 }); ev('dust', { f: J1, x: YX0, r: 70, n: 8, snd: false });
  const FX2 = 1100;
  move('fat', J1 + 1, { x: YX0 + 30, y: GROUND - 115 });
  move('fat', J1 + 6, { y: GROUND - 300 }, 'out2');
  move('fat', J1 + 13, { x: FX2, y: GROUND }, 'in2');
  move('fat', J1 + 13, { x: FX2 }, 'lin');
  key('fat', J1 + 13, { sx: 1.25, sy: 0.85 }, 1); key('fat', J1 + 18, { sx: 1, sy: 1 }, 4);
  sfx('land', J1 + 13, { who: 'fat', gain: 0.7 });
  key('pink', J1 + 16, { sx: 1, sy: 1 }, 5, 'out'); sfx('boing', J1 + 16, { who: 'pink', gain: 0.6 });
  ev('stars', { who: 'pink', f0: J1 + 14, f1: J1 + 30 });
  key('fat', J1 + 14, { mouth: 'happy', eyes: 'normal' }, 0);
  sfx('ref:laugh', J1 + 14, { who: 'fat', gain: 0.85, pitch: 0.75 });
  laugh('fat', J1 + 16, J1 + 34);

  // ---- 4–5.2 с: Розовая «растёт» — Толстый влюблён
  const YX = 560;
  key('pink', J1 + 14, { eyes: 'angry', mouth: 'angry theeth' }, 0);
  const YB = transform('pink', J1 + 15, YX0, YX, 1, { style: 'grow', love: 'fat', loveDur: 44 });
  key('pink', YB, stance('pink', YX, 1), 0);
  key('pink', YB + 6, { mouth: 'theeth smile', eyes: 'angry' }, 0);

  // ---- 5.4–7.5 с: Толстый скачет к ней — отрыжка огромным пончиком — надевает ему на пояс
  const FX3 = 900;
  hop('fat', YB + 6, YB + 14, FX2, FX3, 80);
  const BU = YB + 18;
  key('fat', BU - 6, { sx: 1.12, sy: 0.9 }, 6);
  fatOpen(BU, 1.8, 2);
  sfx('burp', BU, { who: 'fat', gain: 1.0 });
  const BIGD = { r: 120, glaze: '#ff7ac8', seed: 9, segs: [] };
  DN.push(BIGD);
  const CA = BU + 10;
  key('pink', CA - 4, { handF: hand('pink', 'F', 0.8, -0.45) }, 4);
  BIGD.segs.push({ f0: BU, f1: CA, a: 'fat:mouth', b: (f, S) => { const h = C.pink.big.point(S.pink.st, 'handF'); return [h[0], h[1] - 40]; }, arc: 150, spin: -4, k0: 0.3, k1: 1 });
  BIGD.segs.push({ f0: CA, hand: 'pink', dy: -40 });
  sfx('pop', CA, { who: 'pink', gain: 0.6 });
  key('fat', BU + 6, { mouthK: 1, mouth: 'happy' }, 3);
  key('pink', CA + 4, { mouth: 'happy with theeth', eyes: 'angry' }, 0);
  // поднимает и надевает сверху
  const UP = CA + 8, DOWN = UP + 10;
  key('pink', UP, { handF: hand('pink', 'F', 0.9, -0.7), lean: 6 }, 6);
  const ftop = (f, S) => { const t = target('fat:top', S); return [t[0], t[1] - 40]; };
  BIGD.segs.push({ f0: UP + 2, f1: DOWN, a: (f, S) => { const d = dnAt(BIGD, UP + 1, statesAt(UP + 1)); return [d.x, d.y]; }, b: ftop, arc: 80 });
  BIGD.segs.push({ f0: DOWN, gone: true });
  RING.push({ f0: DOWN, f1: 0 });
  key('pink', DOWN, { handF: hand('pink', 'F', 0.95, -0.2), lean: 12 }, 3);
  key('pink', DOWN + 8, { ...stance('pink', YX, 1), mouth: 'happy with theeth', eyes: 'normal' }, 6);
  sfx('squish', DOWN, { who: 'fat', gain: 1.0 }); sfx('boing', DOWN + 1, { who: 'fat', gain: 0.6 });
  key('fat', DOWN, { sx: 0.88, sy: 1.14, mouth: 'puzzlement', eyes: 'sad' }, 1); key('fat', DOWN + 5, { sx: 1, sy: 1 }, 4);
  sfx('scared', DOWN + 3, { who: 'fat', gain: 0.6 });

  // ---- 7.6–10 с: пинок — катится колесом — обратно — ей под ноги — падает — «пуф»
  const KK = DOWN + 9;
  kick('pink', KK, [FX3 - 140, GROUND - 160], { x: YX, face: 1, hard: false });
  key('fat', KK, { pivot: ST.CAST.fat.pivot }, 0);
  const R1 = KK + 14, R2 = R1 + 14;
  move('fat', KK, { x: FX3, y: GROUND, rot: 0 });
  move('fat', R1, { x: 1560, rot: 600 }, 'out');
  key('fat', R1, { sx: 0.8, sy: 1.2 }, 1); key('fat', R1 + 3, { sx: 1, sy: 1 }, 3);
  sfx('whirr', KK, { who: 'fat', dur: 16, gain: 0.6 });
  sfx('boing', R1, { who: 'fat', gain: 0.9 });
  move('fat', R2, { x: YX + 120, rot: 600 - 700 }, 'in');
  sfx('whirr', R1 + 1, { who: 'fat', dur: 15, gain: 0.6 });
  key('pink', R2 - 6, { mouth: 'puzzlement', eyes: 'sad' }, 0);
  sfx('bonk', R2, { who: 'pink', gain: 1.0 });
  const LIE = fallBack('pink', R2, YX, 1, { n: 12, stars: false, mouth: 'puzzlement' });
  move('fat', R2 + 1, { x: YX + 120, rot: -100 }); move('fat', R2 + 14, { x: 1420, rot: 500 }, 'out');
  key('fat', R2 + 15, { rot: 0 }, 0);
  RING[0].f1 = R2 + 2;
  const DL = { r: 120, glaze: '#ff7ac8', seed: 9, segs: [{ f0: R2 + 2, f1: R2 + 18, a: 'fat:body', b: [1010, GROUND - 120], arc: 200, spin: 5 }, { f0: R2 + 18, at: [1010, GROUND - 120], rot: 0 }] };
  DN.push(DL);
  sfx('pop', R2 + 2, { who: 'fat', gain: 0.7 }); sfx('land', R2 + 18, { x: 1010, gain: 0.6 });
  const ysm = shrink('pink', LIE + 6, YX - 120, 1, { mouth: 'puzzlement', eyes: 'sad', smoke: 420 });
  key('pink', ysm, { lean: 0, head: 0, hip: [0, 0], legF: null, legB: null, zB: null, rot: 0 }, 0);
  move('pink', ysm, { x: YX - 120, y: GROUND, rot: 0 });
  ev('stars', { who: 'pink', f0: ysm + 4, f1: ysm + 22, snd: false });
  key('fat', R2 + 12, { mouth: 'happy', eyes: 'normal' }, 0);
  sfx('ref:laugh', R2 + 12, { who: 'fat', gain: 0.85, pitch: 0.75 });
  laugh('fat', R2 + 14, R2 + 38);

  // ---- 10–12.4 с: шарик-Розовая откусывает от пончика — «растёт» снова, Толстый влюблён
  key('pink', ysm + 4, { eyes: 'angry', mouth: 'angry theeth' }, 0);
  const H0 = ysm + 6;
  hop('pink', H0, H0 + 14, YX - 120, 800, 170);
  const BI = H0 + 18;
  key('pink', BI - 2, { sx: 1.1, sy: 0.92, mouth: 'happy open mouth' }, 2);
  key('pink', BI, { sx: 0.95, sy: 1.05, mouth: 'smile normal' }, 1);
  sfx('chomp', BI, { who: 'pink', gain: 1.0 }); sfx('gulp', BI + 5, { who: 'pink', gain: 0.8 });
  CRUMB.push({ f: BI, at: [900, GROUND - 160] });
  DL.segs.push({ f0: BI, at: [1010, GROUND - 120], rot: 0, k: 1, bite: true });
  key('pink', BI + 6, { sx: 1, sy: 1, eyes: 'angry', mouth: 'theeth smile' }, 3);
  const YX2 = 800;
  const YB2 = transform('pink', BI + 6, 800, YX2, 1, { style: 'grow', love: 'fat', loveDur: 30 });
  key('pink', YB2, stance('pink', YX2, 1), 0);
  key('pink', YB2 + 6, { mouth: 'theeth smile', eyes: 'angry' }, 0);
  DL.segs.push({ f0: YB2 - 2, gone: true });
  CRUMB.push({ f: YB2 - 2, at: [1010, GROUND - 120] });

  // ---- 12.6–16 с: поднимает Толстого над головой, крутит и бросает в небо
  // Толстый влюблён скачет к ней
  hop('fat', YB2 + 2, YB2 + 12, 1420, YX2 + 300, 90);
  const GR = YB2 + 16;
  key('pink', GR - 5, { lean: 16, hip: [0, toRig('pink', 100)], head: 6 }, 5);
  key('pink', GR, { hitF: 1, hitFto: (() => { const b = target('fat:body', stateAt(GR)); return [b[0] - 40, b[1]]; })(), hitFfix: GR }, 4);
  key('fat', GR, { mouth: 'puzzlement', eyes: 'sad' }, 0);
  sfx('pop', GR, { who: 'fat', gain: 0.5 });
  // над головой: Толстый следует за рукой
  const LIFT = GR + 10, SP0 = LIFT + 2, SP1 = SP0 + 18, TH = SP1;
  key('pink', LIFT, { hitF: 0, lean: -6, hip: [0, toRig('pink', 8)], head: -4, handF: hand('pink', 'F', 0.8, -0.55), handB: hand('pink', 'B', 0.65, -0.6), mouth: 'happy with theeth', eyes: 'angry' }, 10);
  const KF = C.fat.small;
  for (let f = GR + 1; f <= TH; f++) {
    const S = stateAt(f), h = C.pink.big.point(S.pink.st, 'handF'), u = E.clamp((f - GR) / (LIFT - GR), 0, 1);
    const b0 = target('fat:body', stateAt(GR));
    const hx = E.lerp(b0[0], h[0] + 150, u), hy = E.lerp(GROUND, h[1] + 230, E.EASE.io(u));
    key('fat', f, { x: hx, y: hy }, 1, 'lin');
  }
  key('fat', SP0, { pivot: ST.CAST.fat.pivot, rot: 0 }, 0);
  move('fat', SP1, { rot: 1080 }, 'in');
  for (let f = SP0; f < SP1; f += 8) key('pink', f + 4, { head: (f - SP0) % 16 < 8 ? -10 : -2 }, 4);
  sfx('whirr', SP0, { who: 'fat', dur: SP1 - SP0, gain: 0.7 }); sfx('scared', SP0 + 2, { who: 'fat', gain: 0.8 });
  key('pink', TH, { handF: hand('pink', 'F', -0.4, -0.85), lean: -8 }, 3);
  key('pink', TH + 4, { handF: hand('pink', 'F', 0.9, -0.5), lean: 10 }, 3, 'in2');
  sfx('swing', TH + 2, { who: 'pink', gain: 0.9 });
  const UPF = TH + 18;
  move('fat', TH + 1, { rot: 1080 }); move('fat', UPF, { x: 1000, y: -420, rot: 1800 }, 'out');
  sfx('whoosh', TH + 2, { who: 'fat', dur: 18, gain: 0.7 });
  ev('twinkle', { f: UPF - 6, at: [1000, 90], n: 18, size: 50 });
  key('pink', TH + 10, { ...stance('pink', YX2, 1), mouth: 'happy with theeth', eyes: 'normal' }, 8);
  sfx('ref:laugh', TH + 8, { who: 'pink', gain: 0.85, pitch: 1.35 });
  chuckle('pink', TH + 8, TH + 28, { mouth: 'happy with theeth' });

  // ---- 16–17.5 с: падает обратно — она отступает — он мячиком укатывается за край
  const FB = UPF + 4, HIT = FB + 12;
  key('pink', FB - 2, { mouth: 'puzzlement', eyes: 'normal', head: -12 }, 3);
  sfx('scared', FB, { who: 'fat', gain: 0.8 }); sfx('whoosh', FB, { x: YX2, dur: 12, gain: 0.6 });
  move('fat', FB, { x: YX2 + 60, y: -400, rot: 0 });
  move('fat', HIT, { y: GROUND }, 'in2');
  key('pink', FB + 4, { lean: -14, head: -8 }, 3);
  move('pink', FB + 4, { x: YX2 }); move('pink', FB + 10, { x: YX2 - 220 }, 'out');
  key('pink', FB + 10, { ...C.pink.big.feet(YX2 - 220, 1) }, 6);
  key('fat', HIT, { sx: 1.6, sy: 0.55, mouth: 'puzzlement', eyes: 'sad' }, 1);
  sfx('slam', HIT, { who: 'fat', gain: 1.0 }); sfx('boing', HIT + 1, { who: 'fat', gain: 0.9 });
  ev('shake', { f: HIT, amp: 18, n: 12 }); ev('dust', { f: HIT, x: YX2 + 60, r: 70, n: 8, snd: false });
  key('fat', HIT + 4, { sx: 0.9, sy: 1.12 }, 3); key('fat', HIT + 8, { sx: 1, sy: 1 }, 3);
  let px = YX2 + 60;
  for (let k = 0; k < 5; k++) { const a = HIT + 2 + k * 8, nx = px + 340; hop('fat', a, a + 8, px, nx, 220 - k * 30, { prep: 1 }); px = nx; }
  key('pink', FB + 16, { ...stance('pink', YX2 - 220, 1), lean: 0, head: 0, mouth: 'happy with theeth', eyes: 'normal' }, 8);
  sfx('ref:laugh', HIT + 6, { who: 'pink', gain: 0.85, pitch: 1.35 });

  // ---- 17.5–22 с: в центр, руки вверх
  const WIN = victory('pink', HIT + 14, YX2 - 220, { n: 9, stride: 120 });
  window.T = { FULL, J1, YB, BU, DOWN, KK, R2, ysm, BI, YB2, GR, TH, UPF, HIT, WIN };
};

// ------------------------------------------------------------------ рисование
ST.hooks.beforeChars.push((ctx, f, S, CAM) => {
  ctx.setTransform(...CAM);
  for (const D of DN) { const c = D.segs.filter((s) => f >= s.f0).pop(); if (c && c.at) { const d = dnAt(D, f, S); if (d) { ctx.save(); if (c.bite) { ctx.beginPath(); ctx.rect(-600, -600, 3200, 2400); ctx.arc(d.x - D.r * 0.95, d.y - D.r * 0.3, D.r * 0.42, 0, Math.PI * 2); ctx.clip('evenodd'); } FX.donut(ctx, d.x, d.y, D.r * d.k, d.rot, D.glaze, D.seed); ctx.restore(); } } }
  for (const r of RING) if (f >= r.f0 && (!r.f1 || f < r.f1)) { const b = target('fat:body', S); FX.donutRing(ctx, b[0], b[1] + 40, 360, 'back', E.rad(S.fat.p.rot || 0)); }
});
ST.hooks.afterChars.push((ctx, f, S, CAM) => {
  ctx.setTransform(...CAM);
  for (const r of RING) if (f >= r.f0 && (!r.f1 || f < r.f1)) { const b = target('fat:body', S); FX.donutRing(ctx, b[0], b[1] + 40, 360, 'front', E.rad(S.fat.p.rot || 0)); }
  for (const D of DN) {
    const c = D.segs.filter((s) => f >= s.f0).pop();
    if (!c || c.at || c.gone) continue;
    const d = dnAt(D, f, S);
    if (d) FX.donut(ctx, d.x, d.y, D.r * d.k, d.rot, D.glaze, D.seed);
  }
  for (const c of CRUMB) FX.blockBurst(ctx, c.at[0], c.at[1], (f - c.f) / 16, c.f, ['#d99a4e', '#ff7ac8', '#ffffff'], 10, 22, 0.6, GROUND);
});

ST.start(BIG);
