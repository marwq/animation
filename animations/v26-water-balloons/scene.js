// Ролик 26: Водяные шарики — Скелет против Жёлтой, 25 с, 24 кадра/с. Драка не жёсткая: без ударов,
// только шарики с водой. Как в образце: ~2 с стойки и сразу дело, превращение «рост» под музыку из образца.
// Фон «майнкрафт», тема «джунгли».
//
//   0–1.9 с   шарик-Скелет (слева) и шарик-Жёлтая (справа); у каждого корзина с шариками,
//             перед Жёлтой лежит шарик
//   1.9–4 с   Скелет прыгает на шарик — брызги на Жёлтую, она мокрая; он хохочет
//   3.75–5 с  Жёлтая «растёт» под музыку — Скелет влюблён
//   5–9 с     берёт шарик и бросает — Скелет подпрыгивает, мимо; второй — прямо в него, он мокрый, отряхивается
//   12.5–14 с Скелет «растёт» под музыку
//   14–18.5 с берёт шарик, бросает — она приседает, шарик попадает в её корзину — все шарики лопаются
//   18–19 с   она бросает в ответ — в лицо, он поскальзывается на луже и падает
//   20–25 с   встаёт, дрожит и убегает за кадр; Жёлтая в центре, руки вверх
'use strict';

const ST = Stage({
  name: 'v26-water-balloons',
  cast: {
    skel: { small: ['skeleton-verity-small', { scale: 0.455 }], big: ['skeleton-verity-big', { height: 730 }], pivot: 325,
      voice: 0.9, lie: 60, color: '#f3f1e6' },
    yel: { small: ['girl-verity-small', { bodyHeight: 300, recolor: 'yellow' }],
      big: ['verity-big-girl', { height: 730, splitFeet: true, recolor: 'yellow' }], pivot: 337, voice: 1.45, vAngle: 50,
      color: '#ffe23a', moods: { angry: 'angry theeth', grin: 'theeth smile', big: 'theeth smile' } },
  },
  order: ['skel', 'yel'],
  background: { theme: 'jungle', seed: 11, sunX: 420, sunY: 150 },
  clouds: [[160, 80, 2.4, 0, 14], [760, 190, 1.8, 1, 19], [1240, 60, 2.6, 2, 12], [1700, 240, 1.7, 0, 21], [470, 320, 1.4, 1, 17]],
});
const { FPS, NF, GROUND, C, key, move, ev, sfx, hop, tumble, laugh, tremble, transform, love, stance, walk, turn,
  dodge, duck, slip, getUp, victory, chuckle, hand, toRig, statesAt, stateAt, target } = ST;

// ------------------------------------------------------------------ шарики, корзины, лужи
const BR = 30;
const COLS = ['#ff4f6d', '#3db7ff', '#62e04a', '#b46bff', '#ff9a2e'];
// корзина: x и сколько шариков в ней с какого кадра
const BASK = { skel: { x: 300, n: [[0, 3]] }, yel: { x: 1650, n: [[0, 4]] } };
const leftIn = (b, f) => { let n = 0; for (const [f0, k] of b.n) if (f >= f0) n = k; return n; };
const BALLS = [];        // {col, segs: [{f0, at}|{f0, hand}|{f0, f1, a, b, arc, spin}|{f0, gone}]}
const SPL = [];          // брызги {f, at, size}
const PUD = [];          // лужи {f, x, w}
const P = (v, f, S) => (typeof v === 'function' ? v(f, S) : v);
const ballAt = (B, f, S) => {
  let cur = null;
  for (const c of B.segs) if (f >= c.f0) cur = c;
  if (!cur || cur.gone) return null;
  if (cur.at) return { x: cur.at[0], y: cur.at[1], rot: 0, k: 0.85 };
  if (cur.hand) { const h = C[cur.hand].big.point(S[cur.hand].st, 'handB'); return { x: h[0], y: h[1] - BR * 0.35, rot: 0, k: 1, hand: cur.hand }; }
  const u = E.clamp((f - cur.f0) / (cur.f1 - cur.f0), 0, 1);
  const a = P(cur.a, cur.f0, statesAt(cur.f0)), b = P(cur.b, f, S);
  return { x: E.lerp(a[0], b[0], u), y: E.lerp(a[1], b[1], u) - Math.sin(Math.PI * u) * (cur.arc || 0), rot: (cur.spin || 0) * u, k: 1 };
};
// лопнул: брызги, звук, лужа (если на земле)
function burst(B, f, at, o = {}) {
  B.segs.push({ f0: f, gone: true });
  SPL.push({ f, at, size: o.size || 1.2 });
  sfx('burst', f, { at, gain: 0.7 });
  sfx('splash', f, { at, gain: 0.9 });
  if (o.puddle !== false) PUD.push({ f: f + 4, x: o.px ?? at[0], w: o.pw || 170 });
}
// взять шарик из своей корзины (наклон, рука в корзину, выпрямился с шариком в руке)
function pick(who, f, x, face) {
  const b = BASK[who], n = leftIn(b, f), col = COLS[(BALLS.length * 2 + 1) % COLS.length];
  const B = { col, segs: [{ f0: f, hand: who }] };
  BALLS.push(B);
  b.n.push([f, n - 1]);
  key(who, f - 8, { lean: 30, hip: [0, toRig(who, 140)], head: 10 }, 8);
  key(who, f, { hitB: 1, hitBto: [b.x - face * 30, GROUND - 120], hitBfix: f }, 6);
  key(who, f + 12, { ...stance(who, x, face), hitB: 0, handB: hand(who, 'B', 0.45, -0.55) }, 10);
  sfx('pop', f, { who, gain: 0.35 });
  return B;
}
// бросок: замах из-за головы, шарик летит n кадров в точку (или за целью), o.arc — дуга
function toss(who, B, f, n, tgt, face, x, o = {}) {
  key(who, f - 8, { handB: hand(who, 'B', -0.55, -0.75), lean: -8 }, 7);
  key(who, f, { handB: hand(who, 'B', 0.9, -0.45), lean: 12, mouth: o.mouth || 'happy with theeth' }, 4, 'in2');
  key(who, f + 14, stance(who, x, face, { mouth: o.after || 'theeth smile' }), 10);
  const h = C[who].big.point(stateAt(f)[who].st, 'handB');
  B.segs.push({ f0: f, f1: f + n, a: [h[0], h[1] - BR * 0.35], b: tgt, arc: o.arc ?? 90, spin: face * Math.PI * 3 });
  sfx('swing', f - 3, { who, gain: 0.6 });
  sfx('whoosh', f + 1, { who, dur: n - 1, gain: 0.35 });
  return f + n;
}

const SS = 560, YS = 1400;
// ================================================================== 0–1.9 с: стойка
key('skel', 0, { form: 'small', x: SS, y: GROUND, face: 1, look: 1, eyes: 'normal', mouth: 'smile normal', sx: 1, sy: 1, rot: 0 }, 0);
key('yel', 0, { form: 'small', x: YS, y: GROUND, face: -1, look: 1, eyes: 'normal', mouth: 'smile normal', sx: 1, sy: 1, rot: 0 }, 0);
const B0 = { col: COLS[0], segs: [{ f0: 0, at: [1050, GROUND - BR * 0.85 - 4] }] };
BALLS.push(B0);

// ================================================================== 1.9–4 с: прыгнул на шарик — брызги на Жёлтую
key('skel', 40, { mouth: 'theeth smile', eyes: 'angry' }, 0);
sfx('ref:grin-eee', 40, { who: 'skel', gain: 0.5, pitch: 1.2 });
hop('skel', 46, 60, SS, 1050, 260, { prep: 5 });
sfx('ref:fwip', 47, { who: 'skel', gain: 0.8 });
burst(B0, 60, [1050, GROUND - 40], { size: 1.8, pw: 220 });
key('yel', 61, { mouth: 'puzzlement', eyes: 'sad', sx: 1.12, sy: 0.9 }, 2);
key('yel', 66, { sx: 1, sy: 1 }, 4);
ev('wet', { who: 'yel', f0: 62, f1: 112 });
sfx('hurt', 63, { who: 'yel', gain: 0.6 });
tremble('yel', 66, 88, YS, 3);
hop('skel', 66, 80, 1050, SS, 160);
key('skel', 82, { mouth: 'happy with theeth', eyes: 'normal' }, 0);
sfx('ref:laugh', 84, { who: 'skel', gain: 0.85, pitch: 1.25 });
laugh('skel', 84, 106);

// ================================================================== 3.75–5 с: Жёлтая «растёт»
const YX = 1300;
const YB = transform('yel', 90, YS, YX, -1, { style: 'grow', love: 'skel', loveDur: 64 });

// ================================================================== 12.5–14 с: Скелет «растёт»
const SX = 470;

const BIG = () => {
  key('yel', YB, stance('yel', YX, -1), 0);
  key('yel', YB + 6, { mouth: 'theeth smile', eyes: 'angry' }, 0);
  // ---- к корзине, бросок — Скелет подпрыгивает, мимо
  const Y1 = 1490;
  turn('yel', YB + 8, 1, YX);
  walk('yel', YB + 12, YX, Y1, 2, 9, 1);
  const p1 = pick('yel', YB + 38, Y1, 1);
  turn('yel', YB + 52, -1, Y1);
  sfx('ref:grunt', YB + 56, { who: 'yel', gain: 0.8, pitch: 1.3 });
  const T1 = YB + 64, L1 = toss('yel', p1, T1, 16, [SS, GROUND - BR], -1, Y1, { arc: 150 });
  key('skel', T1 - 6, { mouth: 'puzzlement', eyes: 'sad' }, 0);
  const SX0 = 480;
  hop('skel', T1 + 2, T1 + 22, SS, SX0, 240);
  sfx('ref:fwip', T1 + 3, { who: 'skel', gain: 0.7 });
  burst(p1, L1, [SS, GROUND - BR], { size: 1.1 });
  key('skel', T1 + 24, { mouth: 'happy with theeth', eyes: 'normal' }, 0);
  sfx('ref:grin-eee', T1 + 26, { who: 'skel', gain: 0.6, pitch: 1.2 });
  laugh('skel', T1 + 26, T1 + 44);
  // ---- второй — прямо в него
  turn('yel', T1 + 22, 1, Y1);
  const p2 = pick('yel', T1 + 36, Y1, 1);
  turn('yel', T1 + 50, -1, Y1);
  key('yel', T1 + 52, { mouth: 'angry theeth', eyes: 'angry' }, 0);
  const T2 = T1 + 60;
  const sbody = (f, S) => target('skel:body', S);
  const L2 = toss('yel', p2, T2, 14, sbody, -1, Y1, { arc: 110, mouth: 'angry theeth', after: 'happy with theeth' });
  burst(p2, L2, target('skel:body', stateAt(L2)), { size: 1.6, px: SX0, pw: 200 });
  key('skel', L2, { sx: 1.28, sy: 0.74, mouth: 'puzzlement', eyes: 'sad' }, 1);
  key('skel', L2 + 6, { sx: 1, sy: 1 }, 5);
  sfx('hurt', L2 + 2, { who: 'skel', gain: 0.7 });
  ev('wet', { who: 'skel', f0: L2 + 1, f1: L2 + 40 });
  chuckle('yel', L2 + 4, L2 + 26, { mouth: 'happy with theeth' });
  // отряхивается, как собачка
  const SH = L2 + 22;
  for (let i = 0; i < 6; i++) key('skel', SH + i * 2, { rot: i % 2 ? -9 : 9, pivot: 150 }, 2, 'lin');
  key('skel', SH + 12, { rot: 0 }, 2);
  SPL.push({ f: SH + 2, at: target('skel:body', stateAt(SH)), size: 0.8 });
  sfx('splash', SH, { who: 'skel', gain: 0.4 });

  // ---- Скелет «растёт»
  const SB = transform('skel', SH + 16, SX0, SX, 1, { style: 'grow' });
  key('skel', SB, stance('skel', SX, 1), 0);
  key('skel', SB + 8, { mouth: 'theeth smile', eyes: 'angry' }, 0);
  key('yel', SB + 2, { mouth: 'puzzlement', eyes: 'sad' }, 0);
  ev('sweat', { who: 'yel', f0: SB + 2, f1: SB + 26 });
  // ---- он берёт шарик, она тоже
  turn('skel', SB + 12, -1, SX);
  const q1 = pick('skel', SB + 26, SX, -1);
  turn('skel', SB + 40, 1, SX);
  const SX1 = 900;
  walk('skel', SB + 44, SX, SX1, 2, 9, 1, false);
  turn('yel', SB + 24, 1, Y1);
  const p3 = pick('yel', SB + 38, Y1, 1);
  turn('yel', SB + 52, -1, Y1);
  key('yel', SB + 56, { mouth: 'theeth smile', eyes: 'angry' }, 0);
  // ---- его бросок — она приседает, шарик в её корзину: все лопаются
  const T3 = SB + 72, L3 = T3 + 18;
  const bk = [BASK.yel.x, GROUND - 100];
  toss('skel', q1, T3, 18, bk, 1, SX1, { arc: 60, mouth: 'angry theeth', after: 'puzzlement' });
  duck('yel', T3 - 2, T3 + 14, Y1, -1, 240);
  burst(q1, L3, bk, { size: 2.2, pw: 300 });
  BASK.yel.n.push([L3, 0]);
  SPL.push({ f: L3 + 2, at: [bk[0] - 50, bk[1] + 20], size: 1.6 }, { f: L3 + 3, at: [bk[0] + 50, bk[1] + 10], size: 1.5 });
  sfx('burst', L3 + 2, { x: bk[0], gain: 0.6 });
  sfx('burst', L3 + 4, { x: bk[0], gain: 0.5 });
  key('yel', L3 + 2, { mouth: 'puzzlement', eyes: 'sad' }, 0);
  ev('wet', { who: 'yel', f0: L3 + 2, f1: L3 + 30 });
  key('skel', L3 + 2, { mouth: 'happy with theeth', eyes: 'normal' }, 0);
  chuckle('skel', L3 + 4, L3 + 26, { mouth: 'happy with theeth' });
  // ---- её ответ — в лицо; поскользнулся на луже
  const T4 = L3 + 22, L4 = T4 + 14;
  key('yel', T4 - 10, { mouth: 'angry theeth', eyes: 'angry' }, 0);
  const sface = (f, S) => target('skel:face', S);
  toss('yel', p3, T4, 14, sface, -1, Y1, { arc: 100, mouth: 'angry theeth', after: 'happy with theeth' });
  burst(p3, L4, target('skel:face', stateAt(L4)), { size: 1.7, px: SX1 + 40, pw: 260 });
  key('skel', L4, { mouth: 'puzzlement', eyes: 'sad', head: -10 }, 1);
  ev('wet', { who: 'skel', f0: L4 + 1, f1: L4 + 80 });
  const down = slip('skel', L4 + 5, SX1, 1, { stars: 30 });
  // ---- встаёт, дрожит и убегает
  const UP = down + 22;
  const stood = getUp('skel', UP, SX1, 1, { mouth: 'puzzlement' });
  key('skel', stood, { eyes: 'sad' }, 0);
  tremble('skel', stood + 1, stood + 12, SX1, 4);
  ev('sweat', { who: 'skel', f0: stood, f1: stood + 24 });
  sfx('scared', stood + 2, { who: 'skel', gain: 0.8 });
  turn('skel', stood + 8, -1, SX1);
  walk('skel', stood + 11, SX1, -420, 7, 5, -1);
  key('skel', stood + 11, { lean: 12, handF: hand('skel', 'F', 0.5, -0.6), handB: hand('skel', 'B', 0.4, -0.6) }, 4);
  key('yel', L4 + 6, { mouth: 'happy with theeth', eyes: 'normal' }, 0);
  sfx('ref:laugh', L4 + 10, { who: 'yel', gain: 0.8, pitch: 1.35 });
  chuckle('yel', L4 + 10, L4 + 34, { mouth: 'happy with theeth' });
  victory('yel', stood + 16, Y1, { n: 8, stride: 135 });
};

ST.hooks.beforeChars.push((ctx, f, S, CAM) => {
  ctx.setTransform(...CAM);
  for (const P of PUD) {
    const u = (f - P.f) / 100;
    if (u < 0) continue;
    FX.puddle(ctx, P.x, GROUND + 4, P.w * Math.min(1, (f - P.f + 1) / 6), Math.max(0, Math.min(1, (1 - u) * 3)));
  }
  for (const [who, b] of Object.entries(BASK)) {
    const n = leftIn(b, f);
    FX.basket(ctx, b.x, GROUND + 2, 170, COLS.slice(who === 'yel' ? 1 : 2, (who === 'yel' ? 1 : 2) + n));
  }
});
ST.hooks.afterChars.push((ctx, f, S, CAM) => {
  ctx.setTransform(...CAM);
  for (const B of BALLS) {
    const b = ballAt(B, f, S);
    if (!b) continue;
    ctx.setTransform(...CAM);
    FX.waterBalloon(ctx, b.x, b.y, BR, B.col, b.rot, b.k);
    if (b.hand) { const { ch, st, p } = S[b.hand]; ch.draw(ctx, { ...st, p: { ...p, only: 'B' } }, CAM); }
  }
  ctx.setTransform(...CAM);
  for (const s of SPL) FX.waterSplash(ctx, s.at[0], s.at[1], (f - s.f) / 16, s.size, s.f);
});

ST.start(BIG);
