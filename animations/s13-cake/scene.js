// Серия 2, ролик 13: Торт — Жёлтая (слева) против Розовой (справа), 22 с, 24 кадра/с. Драка без ударов:
// торт из майнкрафта: прыжок на торт — крем в лицо, торт на голову, лужа крема — поскользнулись.
// Музыка превращения — один раз. Фон — цветочное поле.
//
//   0–2 с     шарик-Жёлтая и шарик-Розовая неподвижно стоят друг напротив друга, середина пустая
//   2–4 с     с неба падает торт; Жёлтая прыгает на него — крем фонтаном Розовой в лицо
//   4–5.2 с   Розовая «растёт» под музыку
//   5.4–8.4 с поднимает торт и надевает Жёлтой на голову — шарик в торте бродит вслепую, натыкается на её ногу
//   8.4–9.7 с Жёлтая «растёт» — торт разлетается кремом
//   9.8–13 с  кидает крем — Розовая пригнулась; второй комок — в лицо; Розовая наступает в лужу крема —
//             поскальзывается — падает — «пуф»
//   13.2–16.4 с шарик-Розовая прыгает в лужу — крем брызжет Жёлтой в глаза — она вслепую, поскальзывается — «пуф»
//   16.5–22 с Розовая «растёт» и в центре, руки вверх
'use strict';

const ST = Stage({
  name: '13 Жёлтая vs Розовая',
  frames: 528,
  cast: {
    yel: { small: ['girl-verity-small', { bodyHeight: 300, recolor: 'yellow' }],
      big: ['verity-big-girl', { height: 730, splitFeet: true, recolor: 'yellow' }], pivot: 337, voice: 1.45, vAngle: 50, lie: 55,
      color: '#ffe23a', moods: { angry: 'angry theeth', grin: 'theeth smile', big: 'theeth smile' } },
    pink: { small: ['girl-verity-small', { bodyHeight: 300 }], big: ['girl-verity-big', { height: 730, splitFeet: true }],
      pivot: 337, voice: 1.35, vAngle: 50, lie: 55, color: '#ff4fc8', moods: { angry: 'angry theeth', grin: 'theeth smile', big: 'theeth smile' } },
  },
  order: ['yel', 'pink'],
  background: { theme: 'flowerfield', seed: 1013, sunX: 1500, sunY: 130 },
  clouds: [[150, 80, 2.4, 0, 12], [700, 220, 1.8, 1, 16], [1150, 70, 2.6, 2, 10], [1720, 250, 1.5, 0, 18]],
});
const { FPS, NF, GROUND, C, key, move, ev, sfx, hop, tumble, laugh, tremble, transform, shrink, stance, walk, turn,
  slip, fallBack, duck, victory, chuckle, hand, toRig, statesAt, stateAt, target } = ST;
const P = (v, f, S) => (typeof v === 'function' ? v(f, S) : typeof v === 'string' ? target(v, S) : v);

// ------------------------------------------------------------------ торт, крем
const CS = 260, CX = 960;
const CAKE = [];          // {f0, at, sq} | {f0, f1, a, b, arc, spin, ease} | {f0, hand} | {f0, on, dy} | {f0, gone}
const BLOBS = [];         // {f0, f1, a, b, arc, r}
const SPLAT = [];         // {who, f0, f1, part, dx, dy, s, seed}
const PUD = [];           // {x, w, f0, f1}
const SPRAY = [];         // {f, at, size}
function cakeAt(f, S) {
  let c = null;
  for (const s of CAKE) if (f >= s.f0) c = s;
  if (!c || c.gone) return null;
  if (c.at) return { x: c.at[0], y: c.at[1], rot: c.rot || 0, sq: typeof c.sq === 'function' ? c.sq(f) : c.sq || 1 };
  if (c.hand) { if (S[c.hand].p.form !== 'big') return null; const h = C[c.hand].big.point(S[c.hand].st, 'handF'), g = C[c.hand].big.point(S[c.hand].st, 'handB'); return { x: (h[0] + g[0]) / 2, y: Math.min(h[1], g[1]) + 10, rot: 0, sq: 1 }; }
  if (c.on) { const t = target(`${c.on}:top`, S); return { x: t[0], y: t[1] + c.dy, rot: E.rad(S[c.on].p.rot || 0) * 0.5, sq: 1 }; }
  const u = E.clamp((f - c.f0) / (c.f1 - c.f0), 0, 1), e = c.ease ? E.EASE[c.ease](u) : u, a = P(c.a, c.f0, statesAt(c.f0)), b = P(c.b, f, S);
  return { x: E.lerp(a[0], b[0], e), y: E.lerp(a[1], b[1], e) - Math.sin(Math.PI * u) * (c.arc || 0), rot: u * (c.spin || 0), sq: 1 };
}
function spray(f, at, size = 1) { SPRAY.push({ f, at, size }); sfx('squish', f, { x: 960, gain: 0.8 }); sfx('splash', f, { x: 960, gain: 0.4 }); }
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
  // ---- 2–4 с: торт с неба — Жёлтая прыгает на него — крем Розовой в лицо
  CAKE.push({ f0: 48, f1: 58, a: [CX, -150], b: [CX, GROUND], ease: 'in2' }, { f0: 58, at: [CX, GROUND], sq: (f) => (f < 61 ? 0.82 : 1) });
  sfx('whoosh', 48, { x: CX, dur: 10, gain: 0.5 }); sfx('land', 58, { x: CX, gain: 0.7 }); ev('dust', { f: 58, x: CX, r: 90, n: 6, snd: false });
  ev('twinkle', { f: 60, at: [CX, GROUND - 160], n: 16, size: 50 });
  key('yel', 52, { mouth: 'puzzlement' }, 0); key('pink', 52, { mouth: 'puzzlement' }, 0);
  key('yel', 60, { mouth: 'theeth smile', eyes: 'angry' }, 0);
  sfx('ref:grin-eee', 60, { who: 'yel', gain: 0.4, pitch: 1.45 });
  const ON = 74, CTOP = GROUND - CS * 0.5;
  hopTo('yel', 62, ON, YX0, GROUND, CX - 20, CTOP + 12, 200, { land: false });
  key('yel', ON, { sx: 1.35, sy: 0.72 }, 1);
  CAKE.push({ f0: ON, at: [CX, GROUND], sq: (f) => (f < ON + 4 ? 0.7 : f < ON + 8 ? 1.08 : 1) });
  sfx('squish', ON, { x: CX, gain: 1.0 });
  BLOBS.push({ f0: ON, f1: ON + 9, a: [CX + 60, CTOP], b: (f, S) => target('pink:face', S), arc: 90, r: 34 });
  SPLAT.push({ who: 'pink', f0: ON + 9, f1: 0, part: 'face', dx: 0, dy: 0, s: 170, seed: 3 });
  spray(ON, [CX, CTOP], 0.8); spray(ON + 9, (f, S) => target('pink:face', S), 0.7);
  key('pink', ON + 9, { sx: 1.18, sy: 0.86, mouth: 'puzzlement', eyes: 'sad', pivot: ST.CAST.pink.pivot }, 1); key('pink', ON + 13, { sx: 1, sy: 1 }, 3);
  for (let f = ON + 12; f < ON + 26; f += 6) { key('pink', f + 3, { rot: 12 }, 3); key('pink', f + 6, { rot: -12 }, 3); }
  key('pink', ON + 26, { rot: 0 }, 3);
  const YX1 = 640;
  hopTo('yel', ON + 2, ON + 12, CX - 20, CTOP + 12, YX1, GROUND, 140);
  sfx('ref:laugh', ON + 12, { who: 'yel', gain: 0.85, pitch: 1.45 });
  key('yel', ON + 12, { mouth: 'happy with theeth', eyes: 'normal' }, 0);
  laugh('yel', ON + 14, ON + 30);

  // ---- 4–5.2 с: Розовая «растёт» — крем слетает
  const PX = 1360;
  key('pink', ON + 24, { eyes: 'angry', mouth: 'angry theeth' }, 0);
  const PB = transform('pink', ON + 26, PX0, PX, -1, { style: 'grow' });
  SPLAT[0].f1 = PB - 4; spray(PB - 4, [PX0, GROUND - 180], 1);
  key('pink', PB, stance('pink', PX, -1), 0);
  key('pink', PB + 6, { mouth: 'theeth smile', eyes: 'angry' }, 0);
  key('yel', PB - 2, { mouth: 'puzzlement', eyes: 'sad' }, 0);

  // ---- 5.4–8.4 с: поднимает торт — надевает Жёлтой на голову — шарик-торт бродит — натыкается на её ногу
  const PX2 = CX + 260;
  walk('pink', PB + 2, PX, PX2, 1, 9, -1);
  const GR = PB + 12;
  key('pink', GR - 5, { lean: 24, hip: [0, toRig('pink', 160)], head: 6 }, 5);
  key('pink', GR, { hitF: 1, hitFto: [CX + CS * 0.45, GROUND - CS * 0.3], hitFfix: GR }, 4);
  CAKE.push({ f0: GR, hand: 'pink' });
  sfx('pop', GR, { who: 'pink', gain: 0.5 });
  key('pink', GR + 8, { ...stance('pink', PX2, -1), hitF: 0, handF: hand('pink', 'F', 0.55, -0.7), handB: hand('pink', 'B', 0.35, -0.7), mouth: 'happy with theeth', eyes: 'angry' }, 8);
  const TH = GR + 16, HAT = TH + 12;
  key('pink', TH, { handF: hand('pink', 'F', 0.95, -0.35), handB: hand('pink', 'B', 0.8, -0.45), lean: 12 }, 3, 'in2');
  sfx('swing', TH - 2, { who: 'pink', gain: 0.9 }); sfx('whoosh', TH, { x: 800, dur: 12, gain: 0.5 });
  CAKE.push({ f0: TH, f1: HAT, a: (f, S) => { const c = cakeAt(TH - 1, statesAt(TH - 1)); return [c.x, c.y]; }, b: (f, S) => { const t = target('yel:top', S); return [t[0], t[1] + 110]; }, arc: 160, spin: 2 * Math.PI });
  CAKE.push({ f0: HAT, on: 'yel', dy: 110 });
  sfx('squish', HAT, { who: 'yel', gain: 1.0 }); sfx('bonk', HAT, { who: 'yel', gain: 0.5 });
  key('yel', HAT, { sx: 1.15, sy: 0.88, mouth: 'puzzlement', eyes: 'sad' }, 1); key('yel', HAT + 4, { sx: 1, sy: 1 }, 3);
  key('pink', TH + 8, { ...stance('pink', PX2, -1), mouth: 'happy with theeth', eyes: 'normal' }, 8);
  sfx('ref:laugh', HAT + 2, { who: 'pink', gain: 0.85, pitch: 1.35 });
  // бродит вслепую — тык в ногу
  sfx('scared', HAT + 4, { who: 'yel', gain: 0.6 });
  key('yel', HAT + 4, { pivot: ST.CAST.yel.pivot }, 0);
  const WAN = [[HAT + 4, YX1], [HAT + 12, YX1 - 90], [HAT + 20, YX1 + 40], [HAT + 30, PX2 - 230]];
  for (let i = 1; i < WAN.length; i++) {
    const [f, x] = WAN[i], [f0, x0] = WAN[i - 1];
    move('yel', f0, { x: x0, y: GROUND }); move('yel', (f0 + f) / 2, { y: GROUND - 50 }, 'out2'); move('yel', f, { x, y: GROUND }, 'in2');
    key('yel', f, { sx: 1.15, sy: 0.88, rot: (i % 2 ? 10 : -10) }, 1); key('yel', f + 3, { sx: 1, sy: 1, rot: 0 }, 3);
    sfx('step', f, { who: 'yel', gain: 0.4 });
  }
  const BUMP = HAT + 30;
  sfx('bonk', BUMP, { who: 'yel', gain: 0.8 });
  key('yel', BUMP, { sx: 0.82, sy: 1.18 }, 1);
  hopTo('yel', BUMP + 1, BUMP + 13, PX2 - 230, GROUND, PX2 - 520, GROUND, 110);
  ev('stars', { who: 'yel', f0: BUMP + 2, f1: BUMP + 22, snd: false });
  key('pink', BUMP, { look: 1, head: 10, mouth: 'happy with theeth' }, 3);
  chuckle('pink', BUMP + 2, BUMP + 20, { mouth: 'happy with theeth' });

  // ---- 8.4–9.7 с: Жёлтая «растёт» — торт разлетается кремом, на траве лужа
  const YX = PX2 - 600;
  key('yel', BUMP + 10, { eyes: 'angry', mouth: 'angry theeth' }, 0);
  const YB = transform('yel', BUMP + 14, PX2 - 520, YX, 1, { style: 'grow' });
  CAKE.push({ f0: YB - 6, gone: true });
  spray(YB - 6, [PX2 - 520, GROUND - 260], 1.8);
  PUD.push({ x: YX + 280, w: 300, f0: YB - 2, f1: 0 });
  SPLAT.push({ who: 'yel', f0: YB - 6, f1: YB + 30, part: 'top', dx: 0, dy: 40, s: 160, seed: 7 });
  key('yel', YB, stance('yel', YX, 1), 0);
  key('yel', YB + 6, { mouth: 'theeth smile', eyes: 'angry' }, 0);
  key('pink', YB - 2, { mouth: 'puzzlement', eyes: 'sad' }, 0);

  // ---- 9.8–13 с: комья крема — пригнулась; второй в лицо; наступает в лужу — поскальзывается — «пуф»
  const T1 = YB + 6, H1 = T1 + 8;
  key('yel', T1 - 4, { handF: hand('yel', 'F', -0.3, -0.6), lean: -6 }, 4);
  key('yel', T1, { handF: hand('yel', 'F', 0.95, -0.25), lean: 10 }, 3, 'in2');
  sfx('swing', T1 - 2, { who: 'yel', gain: 0.8 });
  duck('pink', T1 - 2, T1 + 8, PX2, -1, 240);
  BLOBS.push({ f0: T1, f1: H1 + 8, a: (f, S) => C.yel.big.point(statesAt(T1).yel.st, 'handF'), b: [PX2 + 600, GROUND - 600], arc: 20, r: 40 });
  sfx('whoosh', T1 + 2, { x: PX2, dur: 6, gain: 0.5 });
  key('pink', T1 + 10, { mouth: 'happy with theeth', eyes: 'normal' }, 0);
  sfx('ref:laugh', T1 + 10, { who: 'pink', gain: 0.6, pitch: 1.35 });
  const T2 = T1 + 16, H2 = T2 + 8;
  key('yel', T2 - 4, { handF: hand('yel', 'F', -0.3, -0.6), lean: -6 }, 4);
  key('yel', T2, { handF: hand('yel', 'F', 0.95, -0.25), lean: 10 }, 3, 'in2');
  key('yel', T2 + 8, { ...stance('yel', YX, 1), mouth: 'happy with theeth', eyes: 'normal' }, 8);
  sfx('swing', T2 - 2, { who: 'yel', gain: 0.8 });
  BLOBS.push({ f0: T2, f1: H2, a: (f, S) => C.yel.big.point(statesAt(T2).yel.st, 'handF'), b: (f, S) => target('pink:face', S), arc: 30, r: 40 });
  SPLAT.push({ who: 'pink', f0: H2, f1: 0, part: 'face', dx: 0, dy: 0, s: 170, seed: 9 });
  spray(H2, (f, S) => target('pink:face', S), 0.8);
  key('pink', H2, { lean: -14, head: -14, mouth: 'puzzlement', eyes: 'sad', handF: hand('pink', 'F', 0.4, -0.7), handB: hand('pink', 'B', -0.4, -0.6) }, 2);
  // вслепую шагает вперёд — в лужу
  const W0 = H2 + 6, PUDX = YX + 280;
  walk('pink', W0, PX2, PUDX + 60, 2, 8, -1, false);
  const SL = W0 + 16;
  const LIE = slip('pink', SL, PUDX + 60, -1, { n: 12, stars: false });
  spray(SL + 2, [PUDX, GROUND - 20], 1);
  const psm = shrink('pink', LIE + 6, PUDX + 160, -1, { mouth: 'puzzlement', eyes: 'sad', smoke: 420 });
  key('pink', psm, { lean: 0, head: 0, hip: [0, 0], legF: null, legB: null, zB: null, rot: 0 }, 0);
  move('pink', psm, { x: PUDX + 160, y: GROUND, rot: 0 });
  SPLAT[SPLAT.length - 1].f1 = psm;
  SPLAT.push({ who: 'pink', f0: psm, f1: 0, part: 'face', dx: 0, dy: 0, s: 120, seed: 11 });
  ev('stars', { who: 'pink', f0: psm + 4, f1: psm + 20, snd: false });
  sfx('ref:laugh', SL + 6, { who: 'yel', gain: 0.85, pitch: 1.45 });
  chuckle('yel', SL + 6, psm + 10, { mouth: 'happy with theeth' });

  // ---- 13.2–16.4 с: шарик-Розовая прыгает в лужу — крем Жёлтой в глаза — вслепую — поскальзывается — «пуф»
  key('pink', psm + 6, { eyes: 'angry', mouth: 'angry theeth' }, 0);
  const J0 = psm + 8, IN = J0 + 10;
  hopTo('pink', J0, IN, PUDX + 160, GROUND, PUDX, GROUND, 160, { land: false });
  key('pink', IN, { sx: 1.45, sy: 0.65 }, 1); key('pink', IN + 5, { sx: 1, sy: 1 }, 4);
  spray(IN, [PUDX, GROUND - 10], 1.4);
  BLOBS.push({ f0: IN, f1: IN + 8, a: [PUDX, GROUND - 40], b: (f, S) => target('yel:face', S), arc: 60, r: 38 });
  SPLAT.push({ who: 'yel', f0: IN + 8, f1: 0, part: 'face', dx: 0, dy: 0, s: 180, seed: 13 });
  sfx('squish', IN + 8, { who: 'yel', gain: 1.0 });
  key('yel', IN + 8, { lean: -14, head: -14, mouth: 'puzzlement', eyes: 'sad', handF: hand('yel', 'F', 0.4, -0.7), handB: hand('yel', 'B', -0.4, -0.6) }, 2);
  hopTo('pink', IN + 4, IN + 16, PUDX, GROUND, PUDX + 330, GROUND, 140);
  key('pink', IN + 16, { mouth: 'happy with theeth', eyes: 'normal' }, 0);
  sfx('ref:laugh', IN + 16, { who: 'pink', gain: 0.85, pitch: 1.35 });
  laugh('pink', IN + 18, IN + 30);
  // Жёлтая вслепую — шаг в лужу — падает
  const W1 = IN + 12;
  walk('yel', W1, YX, PUDX - 40, 1, 9, 1, false);
  const SL2 = W1 + 10;
  const LIE2 = slip('yel', SL2, PUDX - 40, 1, { n: 12, stars: false });
  spray(SL2 + 2, [PUDX, GROUND - 20], 1);
  const ysm = shrink('yel', LIE2 + 6, PUDX - 160, 1, { mouth: 'puzzlement', eyes: 'sad', smoke: 420 });
  key('yel', ysm, { lean: 0, head: 0, hip: [0, 0], legF: null, legB: null, zB: null, rot: 0 }, 0);
  move('yel', ysm, { x: PUDX - 160, y: GROUND, rot: 0 });
  SPLAT[SPLAT.length - 1].f1 = ysm;
  SPLAT.push({ who: 'yel', f0: ysm, f1: 0, part: 'face', dx: 0, dy: 0, s: 120, seed: 15 });
  ev('stars', { who: 'yel', f0: ysm + 4, f1: ysm + 40, snd: false });

  // ---- 16.5–22 с: Розовая «растёт» — в центр
  const PX4 = PUDX + 330;
  SPLAT[SPLAT.length - 3].f1 = LIE2 + 12;
  const PB2 = transform('pink', LIE2 + 10, PX4, PX4, -1, { style: 'grow' });
  key('pink', PB2, stance('pink', PX4, -1), 0);
  // шарик-Жёлтая в креме удирает влево
  key('yel', ysm + 12, { face: -1 }, 0);
  let px = PUDX - 160;
  for (let k = 0; k < 4; k++) { const a = ysm + 14 + k * 8, nx = px - 300; hop('yel', a, a + 8, px, nx, 100, { prep: 1 }); px = nx; }
  sfx('scared', ysm + 14, { who: 'yel', gain: 0.7 });
  const WIN = victory('pink', PB2 + 6, PX4, { n: 9, stride: 110 });
  window.T = { ON, PB, HAT, BUMP, YB, H2, SL, psm, IN, SL2, ysm, PB2, WIN };
};

// ------------------------------------------------------------------ рисование
ST.hooks.beforeChars.push((ctx, f, S, CAM) => {
  ctx.setTransform(...CAM);
  for (const p of PUD) if (f >= p.f0 && (!p.f1 || f < p.f1)) FX.creamPuddle(ctx, p.x, GROUND + 6, p.w * Math.min(1, (f - p.f0 + 2) / 6), 1, 5);
  const c = CAKE.filter((s) => f >= s.f0).pop();
  if (c && c.at) { const k = cakeAt(f, S); FX.mcCake(ctx, k.x, k.y, CS, k.rot, 0, k.sq); }
});
ST.hooks.afterChars.push((ctx, f, S, CAM) => {
  ctx.setTransform(...CAM);
  const c = CAKE.filter((s) => f >= s.f0).pop();
  if (c && !c.at && !c.gone) { const k = cakeAt(f, S); if (k) FX.mcCake(ctx, k.x, k.y, c.on ? CS * 1.1 : CS, k.rot, 0, k.sq); }
  for (const s of SPLAT) {
    if (f < s.f0 || (s.f1 && f >= s.f1)) continue;
    const p = target(`${s.who}:${s.part}`, S), big = S[s.who].p.form === 'big';
    FX.gumSplat(ctx, p[0] + s.dx, p[1] + s.dy, s.s * Math.min(1, (f - s.f0 + 2) / 3) * (big ? 1 : 0.85), s.seed, '#fffdf5', '#bfa98a');
  }
  for (const b of BLOBS) {
    const u = (f - b.f0) / (b.f1 - b.f0);
    if (u < 0 || u >= 1) continue;
    const a = P(b.a, b.f0, statesAt(b.f0)), q = P(b.b, b.f1, statesAt(b.f1));
    FX.gumSplat(ctx, E.lerp(a[0], q[0], u), E.lerp(a[1], q[1], u) - Math.sin(Math.PI * u) * b.arc, b.r * 2, 5, '#fffdf5', '#bfa98a');
  }
  for (const s of SPRAY) { const at = P(s.at, s.f, statesAt(s.f)); FX.blockBurst(ctx, at[0], at[1], (f - s.f) / 18, s.f, ['#ffffff', '#fff1f6', '#e8263a'], 14, 22 * s.size, s.size, GROUND); }
});

ST.start(BIG);
