// Серия 2, ролик 25: Мельница — Жёлтая (слева) против Розовой (справа), 22 с, 24 кадра/с. Драка без ударов:
// ветряная мельница: крылья подхватывают и катают по кругу, раскручиваются и швыряют, ветер сдувает.
// Музыка превращения — один раз. Фон — равнина.
//
//   0–2 с     шарик-Жёлтая и шарик-Розовая неподвижно стоят друг напротив друга, середина пустая
//   2–3.8 с   с неба падает мельница; Розовая прыгает на крыло — крылья раскручиваются, нижнее крыло подхватывает
//             Жёлтую и швыряет её через весь луг
//   3.9–5.1 с Жёлтая «растёт» под музыку
//   5.2–8.6 с раскручивает мельницу рукой — крыло подхватывает дразнящую Розовую, катает по кругу и швыряет вправо
//   8.6–12.6 с Розовая «растёт», дует изо всех сил — Жёлтую сдувает, она падает — «пуф»
//   12.6–16 с шарик-Жёлтая въезжает на крыле на самый верх и прыгает Розовой на голову — та падает — «пуф» и удирает
//   16–22 с   Жёлтая «растёт» и в центре, руки вверх
'use strict';

const ST = Stage({
  name: '25 Жёлтая vs Розовая',
  frames: 528,
  cast: {
    yel: { small: ['girl-verity-small', { bodyHeight: 300, recolor: 'yellow' }],
      big: ['verity-big-girl', { height: 730, splitFeet: true, recolor: 'yellow' }], pivot: 337, voice: 1.45, vAngle: 50, lie: 55,
      color: '#ffe23a', moods: { angry: 'angry theeth', grin: 'theeth smile', big: 'theeth smile' } },
    pink: { small: ['girl-verity-small', { bodyHeight: 300 }], big: ['girl-verity-big', { height: 730, splitFeet: true }],
      pivot: 337, voice: 1.35, vAngle: 50, lie: 55, color: '#ff4fc8', moods: { angry: 'angry theeth', grin: 'theeth smile', big: 'theeth smile' } },
  },
  order: ['yel', 'pink'],
  background: { theme: 'plains', seed: 1025, sunX: 1500, sunY: 130 },
  clouds: [[150, 80, 2.4, 0, 12], [700, 220, 1.8, 1, 16], [1150, 70, 2.6, 2, 10], [1720, 250, 1.5, 0, 18]],
});
const { FPS, NF, GROUND, C, key, move, ev, sfx, hop, laugh, tremble, transform, shrink, stance, walk,
  fallBack, victory, chuckle, hand, statesAt, target } = ST;

// ------------------------------------------------------------------ мельница
const MX = 960, HY = GROUND - 380, BL = 300, BR = 150;      // ось крыльев, длина крыла, радиус шарика
const MILL = { f0: 48, f1: 55, up: 1e9 };
const OM = [];            // скорость крыльев: [f, рад/кадр]
let ANG = null;
function buildAng() {
  OM.sort((a, b) => a[0] - b[0]);
  const om = (f) => {
    if (!OM.length || f < OM[0][0]) return 0;
    let i = 0; while (i < OM.length - 1 && f >= OM[i + 1][0]) i++;
    if (i === OM.length - 1) return OM[i][1];
    const u = (f - OM[i][0]) / (OM[i + 1][0] - OM[i][0]);
    return E.lerp(OM[i][1], OM[i + 1][1], u);
  };
  ANG = [0];
  for (let f = 0; f < NF + 2; f++) ANG.push(ANG[f] + om(f));
}
const TAU2 = Math.PI * 2;
const norm = (a) => ((a % TAU2) + TAU2) % TAU2;
const bladeA = (i, f) => ANG[f] + i * Math.PI / 2;
const tipAt = (i, f, k = 1) => { const a = bladeA(i, f); return [MX + Math.cos(a) * BL * k, HY + Math.sin(a) * BL * k]; };
// первый кадр после f0, когда крыло i (любое) проходит угол target (dir: +1 по часовой, −1 против)
function crossing(f0, target, dir, only = null, fmax = NF) {
  for (let f = f0; f < fmax; f++) for (let i = 0; i < 4; i++) {
    if (only !== null && i !== only) continue;
    const a = norm(bladeA(i, f) - target), b = norm(bladeA(i, f + 1) - target);
    if (dir > 0 && a > Math.PI && b < Math.PI && b < 1) return [f + 1, i];
    if (dir < 0 && a < Math.PI && b > Math.PI && a < 1) return [f + 1, i];
  }
  return [fmax, 0];
}
// шарик на конце крыла: центр шарика на кончике, крутится вместе с крылом
function rideTip(who, f0, f1, i, k = 1, spin = true) {
  key(who, f0, { pivot: ST.CAST[who].pivot }, 0);
  for (let f = f0; f <= f1; f++) { const t = tipAt(i, f, k); move(who, f, { x: t[0], y: t[1] + BR, rot: spin ? (ANG[f] - ANG[f0]) * 180 / Math.PI : 0 }, 'lin'); }
}
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
// бросок с крыла: из текущей точки по дуге на землю, кувырком
function fling(who, f, x1, n, h, turns) {
  const p = ST.stateAt(f)[who].p;
  key(who, f, { pivot: ST.CAST[who].pivot }, 0);
  move(who, f, { x: p.x, y: p.y, rot: p.rot || 0 });
  move(who, f + Math.round(n * 0.4), { y: Math.min(p.y, GROUND) - h }, 'out2');
  move(who, f + n, { y: GROUND }, 'in2');
  move(who, f + n, { x: x1, rot: (p.rot || 0) + 360 * turns }, 'lin');
  key(who, f + n + 1, { rot: 0, pivot: 0 }, 0);
  move(who, f + n + 1, { rot: 0 });
  key(who, f + n, { sx: 1.35, sy: 0.7 }, 1); key(who, f + n + 5, { sx: 0.95, sy: 1.06 }, 3); key(who, f + n + 9, { sx: 1, sy: 1 }, 3);
  sfx('whoosh', f, { who, dur: n, gain: 0.6 }); sfx('fall', f + n, { who, gain: 0.9 });
  ev('dust', { f: f + n, x: x1, r: 50, n: 6, snd: false }); ev('shake', { f: f + n, amp: 10, n: 8 });
  return f + n;
}
const WINDS = [];         // {f0, f1, x, y, rot} — струйки ветра изо рта

const YX0 = 560, PX0 = 1360;
// ================================================================== 0–2 с: неподвижная стойка
key('yel', 0, { form: 'small', x: YX0, y: GROUND, face: 1, look: 1, eyes: 'normal', mouth: 'smile normal', sx: 1, sy: 1, rot: 0, pivot: 0, alpha: 1 }, 0);
key('pink', 0, { form: 'small', x: PX0, y: GROUND, face: -1, look: 1, eyes: 'normal', mouth: 'smile normal', sx: 1, sy: 1, rot: 0, pivot: 0, alpha: 1 }, 0);

const BIG = () => {
  // ---- 2–3.8 с: мельница с неба — Розовая на крыло — крылья раскручиваются — Жёлтую подхватывает и швыряет
  sfx('whoosh', 48, { x: MX, dur: 7, gain: 0.6 }); sfx('slam', 55, { x: MX, gain: 0.9 });
  ev('dust', { f: 55, x: MX, r: 110, n: 8, snd: false }); ev('shake', { f: 55, amp: 14, n: 8 });
  key('yel', 50, { mouth: 'puzzlement' }, 0); key('pink', 50, { mouth: 'puzzlement' }, 0);
  key('pink', 56, { mouth: 'theeth smile', eyes: 'angry' }, 0);
  sfx('ref:grin-eee', 56, { who: 'pink', gain: 0.4, pitch: 1.35 });
  const ON = 64;
  hopTo('pink', 56, ON, PX0, GROUND, MX + BL - 50, HY - 14, 40, { land: false });
  key('pink', ON, { sx: 1.3, sy: 0.75 }, 1); key('pink', ON + 4, { sx: 1, sy: 1 }, 3);
  sfx('land', ON, { who: 'pink', gain: 0.6 }); sfx('creak', ON, { x: MX, dur: 8, gain: 0.6 });
  hop('yel', 57, 65, YX0, 750, 60);
  key('yel', 66, { mouth: 'puzzlement', eyes: 'normal', look: 1 }, 0);
  OM.push([ON, 0], [ON + 4, 0.16], [ON + 30, 0.16], [ON + 50, 0]);
  buildAng();
  sfx('whirr', ON + 2, { x: MX, dur: 46, gain: 0.5 });
  // Розовая скатывается с крыла
  const OFFP = ON + 3;
  LATE.push(() => { const t = tipAt(0, OFFP, 0.85); hopTo('pink', OFFP, OFFP + 10, t[0], t[1] - 14, 1330, GROUND, 80); });
  for (let f = ON + 1; f < OFFP; f++) { const t = tipAt(0, f, 0.85); move('pink', f, { x: t[0], y: t[1] - 14 }, 'lin'); }
  // нижнее крыло подхватывает Жёлтую
  const [SC, BI] = crossing(ON, 2.3, +1);
  sfx('bonk', SC, { who: 'yel', gain: 0.8 }); sfx('scared', SC + 1, { who: 'yel', gain: 0.7 });
  key('yel', SC, { mouth: 'puzzlement', eyes: 'sad' }, 0);
  const [FL] = crossing(SC + 2, 1.15 * Math.PI, +1, BI);
  rideTip('yel', SC, FL, BI);
  const YX1 = 330;
  LATE.push(() => { const L = fling('yel', FL, YX1, 16, 220, -1); ev('stars', { who: 'yel', f0: L + 4, f1: L + 22 }); window.LY = L; });
  key('pink', OFFP + 12, { mouth: 'happy with theeth', eyes: 'normal' }, 0);
  sfx('ref:laugh', OFFP + 12, { who: 'pink', gain: 0.85, pitch: 1.35 });
  laugh('pink', OFFP + 14, OFFP + 34);

  // ---- 3.9–5.1 с: Жёлтая «растёт»
  const YX = 400, TF = FL + 18;
  key('yel', TF - 2, { eyes: 'angry', mouth: 'angry theeth' }, 0);
  const YB = transform('yel', TF, YX1, YX, 1, { style: 'grow' });
  key('yel', YB, stance('yel', YX, 1), 0);
  key('yel', YB + 4, { mouth: 'theeth smile', eyes: 'angry' }, 0);
  key('pink', YB - 2, { mouth: 'puzzlement', eyes: 'sad' }, 0);

  // ---- 5.2–8.6 с: раскручивает мельницу — крыло подхватывает Розовую — катает — швыряет вправо
  const PX1 = 1170;
  key('pink', YB + 6, { mouth: 'happy with theeth', eyes: 'normal' }, 0);
  hopTo('pink', YB + 6, YB + 14, 1330, GROUND, PX1, GROUND, 60);
  sfx('ref:grin-eee', YB + 14, { who: 'pink', gain: 0.4, pitch: 1.35 });
  for (let f = YB + 16; f < YB + 30; f += 4) key('pink', f, { sx: f % 8 ? 1.06 : 0.95, sy: f % 8 ? 0.94 : 1.05 }, 2);
  const YX2 = 610;
  walk('yel', YB + 4, YX, YX2, 2, 9, 1);
  const GR = YB + 24;
  let gi = 0;
  LATE.unshift(() => {
    let best = 1e9;
    for (let i = 0; i < 4; i++) { const t = tipAt(i, GR); const d = Math.hypot(t[0] - (YX2 + 80), t[1] - (GROUND - 420)); if (d < best) { best = d; gi = i; } }
    key('yel', GR, { hitF: 1, hitFto: tipAt(gi, GR, 0.95), hitFfix: GR }, 4);
  });
  key('yel', GR - 4, { lean: 8, handF: hand('yel', 'F', 0.9, -0.5) }, 4);
  const SHOVE = GR + 4;
  key('yel', SHOVE + 3, { hitF: 0, handF: hand('yel', 'F', 0.6, 0.6), lean: 16, mouth: 'theeth smile' }, 3, 'in2');
  sfx('swing', SHOVE, { who: 'yel', gain: 0.9 });
  OM.push([SHOVE, 0], [SHOVE + 3, -0.3], [SHOVE + 60, -0.3], [SHOVE + 84, 0]);
  buildAng();
  sfx('whirr', SHOVE, { x: MX, dur: 80, gain: 0.6 });
  ev('wind', { f0: SHOVE + 2, f1: SHOVE + 40, x0: MX - 100, x1: 1800 });
  key('yel', SHOVE + 10, { ...stance('yel', YX2, 1), mouth: 'happy with theeth', eyes: 'normal' }, 8);
  const [SCP, PI] = crossing(SHOVE + 1, 0.885, -1);
  key('pink', SCP, { mouth: 'puzzlement', eyes: 'sad', sx: 1, sy: 1 }, 0);
  sfx('bonk', SCP, { who: 'pink', gain: 0.8 }); sfx('scared', SCP + 1, { who: 'pink', gain: 0.8 });
  const [FLP] = crossing(SCP + 22, 0.15, -1, PI);
  rideTip('pink', SCP, FLP, PI);
  sfx('dizzy', SCP + 4, { who: 'pink', dur: FLP - SCP, gain: 0.5 });
  sfx('ref:laugh', SCP + 4, { who: 'yel', gain: 0.85, pitch: 1.45 });
  chuckle('yel', SCP + 4, FLP + 12, { mouth: 'happy with theeth' });
  const PX2 = 1620;
  LATE.push(() => { const L = fling('pink', FLP, PX2, 14, 200, 1); ev('stars', { who: 'pink', f0: L + 2, f1: L + 22 }); });

  // ---- 8.6–12.6 с: Розовая «растёт» — дует — Жёлтую сдувает — падает — «пуф»
  const PX = 1560, PB = transform('pink', FLP + 18, PX2, PX, -1, { style: 'grow' });
  key('pink', PB, stance('pink', PX, -1), 0);
  key('pink', PB + 4, { mouth: 'theeth smile', eyes: 'angry' }, 0);
  key('yel', PB - 2, { mouth: 'puzzlement', eyes: 'sad' }, 0);
  const PX3 = 1380;
  walk('pink', PB + 4, PX, PX3, 2, 8, -1);
  const IN = PB + 22, BW = IN + 8, BE = BW + 30;
  key('pink', IN, { lean: -12, head: -10, mouth: 'puzzlement', eyes: 'angry', sx: 1.04, sy: 0.98 }, 6);
  sfx('suck', IN, { who: 'pink', dur: 8, gain: 0.5 });
  key('pink', BW, { lean: 10, head: 8, sx: 1, sy: 1 }, 3, 'in2');
  key('pink', BE, { lean: 0, head: 0 }, 6);
  WINDS.push({ f0: BW, f1: BE });
  ev('wind', { f0: BW, f1: BE + 10, x0: PX3 - 100, x1: 150 });
  sfx('gust', BW, { x: 1000, dur: BE - BW, gain: 0.9 });
  OM.push([BW, 0], [BW + 6, 0.22], [BE, 0.22], [BE + 16, 0.06]);
  buildAng();
  // Жёлтую сдувает
  key('yel', BW + 4, { lean: -24, head: -16, hip: [ST.toRig('yel', -20), ST.toRig('yel', 30)], mouth: 'puzzlement', eyes: 'sad',
    handF: hand('yel', 'F', 0.6, -0.7), handB: hand('yel', 'B', -0.6, -0.7) }, 4);
  move('yel', BW + 4, { x: YX2 }); move('yel', BW + 12, { x: 470 }, 'in');
  ev('dust', { f: BW + 8, x: 560, r: 30, n: 3, snd: false }); ev('dust', { f: BW + 14, x: 480, r: 30, n: 3, snd: false });
  sfx('slide', BW + 4, { who: 'yel', gain: 0.6 }); sfx('scared', BW + 6, { who: 'yel', gain: 0.7 });
  const FB = fallBack('yel', BW + 12, 470, 1, { n: 12, stars: 24, dur: 2 });
  const YBX = 300;
  const ysm = shrink('yel', FB + 6, YBX, 1, { mouth: 'puzzlement', eyes: 'sad', smoke: 420 });
  key('yel', ysm, { lean: 0, head: 0, hip: [0, 0], legF: null, legB: null, zB: null, rot: 0 }, 0);
  move('yel', ysm, { x: YBX, y: GROUND, rot: 0 });
  ev('stars', { who: 'yel', f0: ysm + 4, f1: ysm + 14, snd: false });
  key('pink', BE + 2, { mouth: 'happy with theeth', eyes: 'normal' }, 0);
  sfx('ref:laugh', BE + 2, { who: 'pink', gain: 0.85, pitch: 1.35 });
  chuckle('pink', BE + 2, ysm + 30, { mouth: 'happy with theeth' });

  // ---- 12.6–16 с: шарик-Жёлтая на крыле наверх — прыгает Розовой на голову — «пуф»
  key('yel', ysm + 6, { eyes: 'angry', mouth: 'theeth smile' }, 0);
  OM.push([ysm, 0.06], [ysm + 8, 0.12], [ysm + 60, 0.12], [ysm + 90, 0]);
  buildAng();
  const [CT, YI] = crossing(ysm + 18, 2.55, +1);
  const RUN = CT - 12;
  LATE.push(() => { const t = tipAt(YI, CT); hopTo('yel', RUN, CT, YBX, GROUND, t[0], t[1] + BR, 120, { land: false }); });
  sfx('land', CT, { who: 'yel', gain: 0.6 }); sfx('creak', CT, { x: MX, dur: 8, gain: 0.5 });
  const [TOP] = crossing(CT + 2, 1.22 * Math.PI, +1, YI);
  rideTip('yel', CT, TOP, YI, 1, false);
  key('pink', TOP - 6, { look: 1, head: -6, mouth: 'puzzlement', eyes: 'normal' }, 4);
  const HEAD = TOP + 12;
  LATE.push(() => {
    const t = tipAt(YI, TOP), h = target('pink:face', ST.stateAt(HEAD));
    hopTo('yel', TOP, HEAD, t[0], t[1] + BR, h[0] - 60, h[1] + BR, 40, { land: false });
    hopTo('yel', HEAD + 2, HEAD + 16, h[0] - 60, h[1] + BR, 1130, GROUND, 60);
  });
  key('yel', HEAD, { sx: 1.3, sy: 0.75 }, 1);
  sfx('bonk', HEAD, { who: 'pink', gain: 1.0 }); sfx('slam', HEAD, { who: 'pink', gain: 0.5 });
  ev('shake', { f: HEAD, amp: 16, n: 10 });
  const FB2 = fallBack('pink', HEAD + 2, PX3, -1, { n: 14, stars: 24 });
  key('yel', HEAD + 16, { mouth: 'happy with theeth', eyes: 'normal' }, 0);
  sfx('ref:laugh', HEAD + 16, { who: 'yel', gain: 0.85, pitch: 1.45 });
  laugh('yel', HEAD + 18, HEAD + 26);
  const PBX = 1560;
  const psm = shrink('pink', FB2 + 6, PBX, -1, { mouth: 'puzzlement', eyes: 'sad', smoke: 420 });
  key('pink', psm, { lean: 0, head: 0, hip: [0, 0], legF: null, legB: null, zB: null, rot: 0 }, 0);
  move('pink', psm, { x: PBX, y: GROUND, rot: 0 });
  ev('stars', { who: 'pink', f0: psm + 4, f1: psm + 14, snd: false });
  key('pink', psm + 10, { face: 1, mouth: 'puzzlement', eyes: 'sad' }, 0);
  sfx('scared', psm + 10, { who: 'pink', gain: 0.6 });
  hop('pink', psm + 12, psm + 20, PBX, 1800, 80, { prep: 1 }); hop('pink', psm + 20, psm + 28, 1800, 2100, 80, { prep: 1 });

  // мельница раскручивается и улетает, как вертолёт
  MILL.up = psm + 14;
  OM.push([MILL.up - 10, 0.12], [MILL.up + 10, 0.6]);
  sfx('whirr', MILL.up - 6, { x: MX, dur: 40, gain: 0.8 }); sfx('powerup', MILL.up, { x: MX, dur: 20, gain: 0.5 });
  ev('dust', { f: MILL.up, x: MX, r: 120, n: 8, snd: false });
  // ---- Жёлтая «растёт» — в центр
  const YB2 = transform('yel', HEAD + 22, 1130, 1110, -1, { style: 'grow' });
  key('yel', YB2, stance('yel', 1110, -1), 0);
  key('yel', YB2 + 4, { mouth: 'happy with theeth' }, 0);
  const WIN = victory('yel', YB2 + 6, 1110, { n: 9, stride: 80 });
  buildAng();
  for (const fn of LATE) fn();
  window.T = { ON, SC, FL, YB, GR, SCP, FLP, PB, BW, FB, ysm, CT, TOP, HEAD, psm, YB2, WIN };
};
const LATE = [];

// ------------------------------------------------------------------ рисование
ST.hooks.beforeChars.push((ctx, f, S, CAM) => {
  ctx.setTransform(...CAM);
  if (f < MILL.f0) return;
  let y = f < MILL.f1 ? E.lerp(-500, GROUND + 2, E.EASE.in2((f - MILL.f0) / (MILL.f1 - MILL.f0))) : GROUND + 2;
  if (f > MILL.up) y -= 1500 * E.EASE.in2(Math.min(1, (f - MILL.up) / 40));
  if (y < -900) return;
  FX.windmill(ctx, MX, y, 1, ANG ? ANG[f] : 0);
});
ST.hooks.afterChars.push((ctx, f, S, CAM) => {
  ctx.setTransform(...CAM);
  for (const w of WINDS) {
    if (f < w.f0 || f >= w.f1) continue;
    const m = target('pink:lips', S);
    FX.airLines(ctx, m[0] - 10, m[1], Math.PI + 0.25, f / FPS, false, 700, 5);
  }
});

ST.start(BIG);
