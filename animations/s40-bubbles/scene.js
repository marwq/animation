// Ролик 28 (бывш. 40): Мыльные пузыри — Розовая (слева) против Жёлтой (справа), 25 с, 24 кадра/с. Драка без ударов:
// большая палочка для мыльных пузырей: пузырь захватывает соперника и поднимает в воздух, тык — «чпок» — падение.
// В начале — считалка «3, 2, 1, FIGHT». Музыка превращения — один раз. Фон — плитки: сливовая стена, оранжевый пол, подушечки.
//
//   0–2.2 с   считалка: шарик-Розовая и шарик-Жёлтая неподвижно стоят друг напротив друга
//   2.2–5 с   с неба втыкается палочка для пузырей; Розовая дует в кольцо — огромный пузырь накрывает
//             шарика-Жёлтую и поднимает её, «чпок» — Жёлтая шлёпается
//   5–6.5 с   Жёлтая «растёт» под музыку
//   6.5–10 с  выдёргивает палочку, взмах — пузырь ловит шарика-Розовую, та плывёт вверх, тык — «чпок» — падает
//   10–11.5 с Розовая «растёт»; Жёлтая втыкает палочку обратно
//   11.5–15 с Розовая хватает палочку — пузырь-шлем на голову Жёлтой, поднимает её за голову, тык — «чпок» —
//             Жёлтая падает — «пуф»
//   15–18 с   шарик-Жёлтая дует в кольцо — пузыри катятся Розовой под ноги, она наступает — скользит — «пуф»
//   18–22 с   Жёлтая «растёт» снова, взмах — пузырь уносит шарика-Розовую за край, палочку — за плечо
//   22–25 с   Жёлтая в центре, руки вверх
'use strict';

const ST = Stage({
  name: '28 Розовая vs Жёлтая',
  frames: 600,
  intro: 'countdown-321',
  cast: {
    pink: { small: ['girl-verity-small', { bodyHeight: 300 }], big: ['girl-verity-big', { height: 730, splitFeet: true }],
      pivot: 337, voice: 1.35, vAngle: 50, lie: 55, color: '#ff4fc8', moods: { angry: 'angry theeth', grin: 'theeth smile', big: 'theeth smile' } },
    yel: { small: ['girl-verity-small', { bodyHeight: 300, recolor: 'yellow' }],
      big: ['verity-big-girl', { height: 730, splitFeet: true, recolor: 'yellow' }], pivot: 337, voice: 1.45, vAngle: 50, lie: 55,
      color: '#ffe23a', moods: { angry: 'angry theeth', grin: 'theeth smile', big: 'theeth smile' } },
  },
  order: ['pink', 'yel'],
  background: { theme: 'tiles', seed: 1028, wall: '#7d33b0', floor: '#ffb35c', motif: 'pillows', sky: ['#3d9cf2', '#d3efff'] },
  clouds: [[260, 230, 1.6, 1, 14], [820, 70, 2.4, 0, 11], [1350, 200, 1.9, 2, 16], [1780, 90, 2.2, 0, 13]],
});
const { FPS, NF, GROUND, C, key, move, ev, sfx, hop, tumble, laugh, tremble, transform, shrink, stance, walk, turn,
  slip, fallBack, victory, chuckle, hand, toRig, statesAt, target } = ST;
const P = (v, f, S) => (typeof v === 'function' ? v(f, S) : typeof v === 'string' ? target(v, S) : v);

// ------------------------------------------------------------------ палочка, пузыри
const WS = 360, WK = WS / 120, GRIP = 170, RING = 100 * WK, BURY = 110;   // GRIP — хват от низа ручки; BURY — воткнута в землю на столько
const WAND = [];          // {f0, at:[x,y], rot} | {f0, f1, a, b, arc, rot0, rot1, ease} | {f0, hand: who, rot: f=>rot}
const BUBS = [];          // {keys:[{f, at, r, arc, ease}], pop}
function segAt(segs, f) { let c = null; for (const s of segs) if (f >= s.f0) c = s; return c && !c.gone ? c : null; }
// rot по ключам [[f, rot], ...]
const rk = (L) => (f) => {
  if (f <= L[0][0]) return L[0][1];
  for (let i = 0; i < L.length - 1; i++) if (f < L[i + 1][0]) return E.lerp(L[i][1], L[i + 1][1], E.EASE.io((f - L[i][0]) / (L[i + 1][0] - L[i][0])));
  return L[L.length - 1][1];
};
function wandAt(f, S) {
  const c = segAt(WAND, f);
  if (!c) return null;
  if (c.at) return { x: c.at[0], y: c.at[1], rot: c.rot || 0 };
  if (c.hand) {
    if (S[c.hand].p.form !== 'big') return null;
    const h = C[c.hand].big.point(S[c.hand].st, 'handF'), rot = c.rot(f);
    return { x: h[0] - Math.sin(rot) * GRIP, y: h[1] + Math.cos(rot) * GRIP, rot };
  }
  const u = E.clamp((f - c.f0) / (c.f1 - c.f0), 0, 1), e = c.ease ? E.EASE[c.ease](u) : u;
  const a = P(c.a, c.f0, statesAt(c.f0)), b = P(c.b, f, S);
  return { x: E.lerp(a[0], b[0], e), y: E.lerp(a[1], b[1], e) - Math.sin(Math.PI * u) * (c.arc || 0), rot: E.lerp(c.rot0 || 0, c.rot1 || 0, e) };
}
// центр кольца; d — сдвиг вдоль кольца наружу (dx), чтобы пузырь «рос» из кольца
const ringAt = (f, S, dx = 0, dy = 0) => { const w = wandAt(f, S); return [w.x + Math.sin(w.rot) * RING + dx, w.y - Math.cos(w.rot) * RING + dy]; };
const ring = (dx = 0, dy = 0) => (f, S) => ringAt(f, S, dx, dy);
function bub(keys, pop) { const b = { keys, pop }; BUBS.push(b); return b; }
function bubAt(b, f, S) {
  const K = b.keys;
  if (f < K[0].f || (b.pop != null && f >= b.pop)) return null;
  let i = 0; while (i < K.length - 1 && f >= K[i + 1].f) i++;
  const k0 = K[i], p0 = P(k0.at, f, S);
  if (i === K.length - 1) return { c: p0, r: k0.r };
  const k1 = K[i + 1], u0 = (f - k0.f) / (k1.f - k0.f), u = k1.ease === 'lin' ? u0 : E.EASE.io(u0);
  const p1 = P(k1.at, f, S);
  return { c: [E.lerp(p0[0], p1[0], u), E.lerp(p0[1], p1[1], u) - Math.sin(Math.PI * u) * (k1.arc || 0)], r: E.lerp(k0.r, k1.r, u) };
}
function popBub(b, f, gain = 0.8) { b.pop = f; sfx('pop', f, { x: 960, gain }); }
// шарик дует: щёки — пульсирует
function blow(who, f0, f1) {
  key(who, f0, { mouth: 'puzzlement', eyes: 'normal' }, 0);
  for (let f = f0, i = 0; f < f1; f += 4, i++) key(who, f, i % 2 ? { sx: 0.96, sy: 1.04 } : { sx: 1.12, sy: 0.9 }, 2);
  key(who, f1, { sx: 1, sy: 1 }, 3);
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
  if (o.snd !== false) sfx('jump', f0 + 2, { who, gain: 0.55 });
}
// шарик падает с высоты на землю
function drop(who, f, y0, n = 7) {
  move(who, f, { y: y0 }); move(who, f + n, { y: GROUND, rot: 0 }, 'in2');
  key(who, f + n, { sx: 1.4, sy: 0.66 }, 1); key(who, f + n + 4, { sx: 0.92, sy: 1.08 }, 3); key(who, f + n + 8, { sx: 1, sy: 1 }, 4);
  sfx('bonk', f + n, { who, gain: 0.8 });
  ev('stars', { who, f0: f + n + 2, f1: f + n + 20 });
}
// большой берёт палочку из земли / втыкает обратно (рука к рукоятке)
const GRIPPT = () => [960, GROUND + BURY - GRIP];
function reach(who, f, n = 5) { key(who, f, { hitF: 1, hitFto: GRIPPT(), hitFfix: f, lean: 16, hip: [0, toRig(who, 90)] }, n); }
const LATE = [];

const PX0 = 470, YX0 = 1450, MX = 960, GO = 54;
// ================================================================== 0–2.2 с: считалка, обе стоят
key('pink', 0, { form: 'small', x: PX0, y: GROUND, face: 1, look: 1, eyes: 'normal', mouth: 'smile normal', sx: 1, sy: 1, rot: 0, pivot: 0, alpha: 1 }, 0);
key('yel', 0, { form: 'small', x: YX0, y: GROUND, face: -1, look: 1, eyes: 'normal', mouth: 'smile normal', sx: 1, sy: 1, rot: 0, pivot: 0, alpha: 1 }, 0);

const BIG = () => {
  // ---- 2.2–5 с: палочка с неба — Розовая дует — пузырь накрывает Жёлтую и поднимает — «чпок»
  WAND.push({ f0: GO, f1: GO + 7, a: [MX + 60, -420], b: [MX, GROUND + BURY], ease: 'in2', rot0: 0.5, rot1: 0 }, { f0: GO + 7, at: [MX, GROUND + BURY], rot: 0 });
  sfx('whoosh', GO, { x: MX, dur: 7, gain: 0.5 }); sfx('slam', GO + 7, { x: MX, gain: 0.55 }); sfx('boing', GO + 8, { x: MX, gain: 0.4, pitch: 1.3 });
  ev('dust', { f: GO + 7, x: MX, r: 70, n: 6, snd: false });
  key('pink', GO + 3, { mouth: 'puzzlement' }, 0); key('yel', GO + 3, { mouth: 'puzzlement' }, 0);
  key('pink', GO + 8, { mouth: 'theeth smile', eyes: 'angry' }, 0);
  sfx('ref:grin-eee', GO + 8, { who: 'pink', gain: 0.4, pitch: 1.35 });
  const PX1 = 735;
  hopTo('pink', GO + 9, GO + 17, PX0, GROUND, PX1, GROUND, 90);
  const BL = GO + 19;
  blow('pink', BL, BL + 14);
  sfx('inflate', BL, { x: MX, dur: 14, gain: 0.6 });
  const B1 = bub([{ f: BL, at: ring(8), r: 8 }, { f: BL + 14, at: ring(150, -20), r: 170, ease: 'lin' }, { f: BL + 28, at: 'yel:body', r: 195, arc: 50 }], null);
  key('yel', BL + 10, { mouth: 'puzzlement', eyes: 'sad' }, 0);
  key('yel', BL + 22, { sx: 0.9, sy: 1.08 }, 3);
  const EN1 = BL + 28;
  key('yel', EN1, { sx: 1.08, sy: 0.94 }, 2); key('yel', EN1 + 4, { sx: 1, sy: 1 }, 3);
  sfx('boing', EN1, { x: YX0, gain: 0.55, pitch: 1.5 }); sfx('squish', EN1, { x: YX0, gain: 0.4 });
  move('yel', EN1 + 1, { x: YX0, y: GROUND, rot: 0 }); move('yel', EN1 + 14, { x: YX0 - 30, y: GROUND - 240, rot: -12 }, 'io');
  sfx('scared', EN1 + 3, { who: 'yel', gain: 0.6 });
  key('pink', BL + 16, { mouth: 'happy with theeth', eyes: 'normal' }, 0);
  sfx('ref:laugh', EN1 + 2, { who: 'pink', gain: 0.85, pitch: 1.35 });
  laugh('pink', EN1 + 2, EN1 + 16);
  const POP1 = EN1 + 15;
  popBub(B1, POP1, 1.0);
  drop('yel', POP1, GROUND - 240, 7);

  // ---- 5–6.5 с: Жёлтая «растёт»
  const YX = 1440;
  key('yel', POP1 + 12, { eyes: 'angry', mouth: 'angry theeth' }, 0);
  const YB = transform('yel', POP1 + 13, YX0 - 30, YX, -1, { style: 'grow' });
  key('yel', YB, stance('yel', YX, -1), 0);
  key('yel', YB + 4, { mouth: 'theeth smile', eyes: 'angry' }, 0);
  key('pink', YB - 8, { mouth: 'puzzlement', eyes: 'sad' }, 0);
  const PX2 = 560;
  hopTo('pink', YB - 4, YB + 4, PX1, GROUND, PX2, GROUND, 60);

  // ---- 6.5–10 с: выдёргивает палочку, взмах — пузырь ловит шарика-Розовую — тык — «чпок»
  const YX1 = 1160;
  walk('yel', YB + 4, YX, YX1, 2, 8, -1);
  const GR = YB + 22;
  reach('yel', GR);
  WAND.push({ f0: GR, hand: 'yel', rot: rk([[GR, 0], [GR + 8, 0.8], [GR + 13, 1.1], [GR + 18, -1.0], [GR + 26, -0.6], [GR + 34, -0.6], [GR + 42, -1.2], [GR + 46, -1.45], [GR + 54, -0.6], [GR + 60, 0]]) });
  sfx('pop', GR + 1, { who: 'yel', gain: 0.4, pitch: 0.7 });
  key('yel', GR + 6, { hitF: 0, lean: -4, hip: [0, 8], handF: hand('yel', 'F', -0.5, 0.2), handB: hand('yel', 'B', -0.3, 0.6) }, 6);
  const SW1 = GR + 13;
  key('yel', SW1 + 5, { handF: hand('yel', 'F', 0.95, -0.05), lean: 12 }, 4, 'in2');
  sfx('swing', SW1 + 1, { who: 'yel', gain: 0.6 });
  key('pink', SW1 + 2, { mouth: 'puzzlement', eyes: 'sad' }, 0);
  const EN2 = SW1 + 16;
  const B2 = bub([{ f: SW1 + 4, at: ring(-10), r: 30 }, { f: EN2, at: 'pink:body', r: 190, arc: 60 }], null);
  sfx('inflate', SW1 + 4, { x: 900, dur: 10, gain: 0.5 });
  sfx('boing', EN2, { x: PX2, gain: 0.55, pitch: 1.5 }); sfx('squish', EN2, { x: PX2, gain: 0.4 });
  key('pink', EN2, { sx: 1.08, sy: 0.94 }, 2); key('pink', EN2 + 4, { sx: 1, sy: 1 }, 3);
  sfx('scared', EN2 + 3, { who: 'pink', gain: 0.6 });
  key('yel', EN2 + 2, { ...stance('yel', YX1, -1), handF: hand('yel', 'F', 0.55, 0.05), mouth: 'happy with theeth', eyes: 'normal' }, 6);
  sfx('ref:laugh', EN2 + 4, { who: 'yel', gain: 0.85, pitch: 1.45 });
  laugh('yel', EN2 + 4, EN2 + 18);
  // тык палочкой: кольцо — в край пузыря
  const PK = GR + 46;
  key('yel', PK - 6, { handF: hand('yel', 'F', 0.45, 0.1), lean: -2 }, 4);
  key('yel', PK, { handF: hand('yel', 'F', 1.0, 0.05), lean: 14, mouth: 'theeth smile', eyes: 'angry' }, 3, 'in2');
  key('yel', PK + 10, { ...stance('yel', YX1, -1), handF: hand('yel', 'F', 0.5, 0.0), mouth: 'happy with theeth', eyes: 'normal' }, 8);
  LATE.push(() => {
    const S = ST.stateAt(PK), rp = ringAt(PK, S);
    const off = target('pink:body', ST.stateAt(EN2))[1] - GROUND;   // центр шарика над землёй
    const bx = rp[0] - 175, by = rp[1] - off;
    move('pink', EN2 + 1, { x: PX2, y: GROUND, rot: 0 }); move('pink', PK - 2, { x: bx, y: by, rot: 14 }, 'io');
    drop('pink', PK, by, 8);
    move('pink', PK + 8, { x: bx });
    window.PBX0 = bx;
  });
  popBub(B2, PK, 1.0);
  sfx('swing', PK - 3, { who: 'yel', gain: 0.4 });

  // ---- 10–11.5 с: Розовая «растёт»; Жёлтая втыкает палочку обратно
  const PL = PK + 14;
  reach('yel', PL, 5);
  WAND.push({ f0: PL, at: [MX, GROUND + BURY], rot: 0 });
  sfx('slam', PL, { x: MX, gain: 0.4 });
  key('yel', PL + 6, { ...stance('yel', YX1, -1), hitF: 0, mouth: 'happy with theeth', eyes: 'normal' }, 6);
  sfx('ref:laugh', PL + 8, { who: 'yel', gain: 0.8, pitch: 1.45 });
  chuckle('yel', PL + 8, PL + 24);
  const PX = 740;
  key('pink', PK + 13, { eyes: 'angry', mouth: 'angry theeth' }, 0);
  let PB;
  // позиция шарика известна только после LATE выше — превращение и всё дальнейшее тоже в LATE
  LATE.push(() => {
    PB = transform('pink', PK + 14, window.PBX0, PX, 1, { style: 'grow' });
    key('pink', PB, stance('pink', PX, 1), 0);
    key('pink', PB + 4, { mouth: 'theeth smile', eyes: 'angry' }, 0);
    key('yel', PB - 4, { mouth: 'puzzlement', eyes: 'sad' }, 0);
    PART2(PB);
  });
};

// ---- 11.5–25 с: (после превращения Розовой)
let TT = {};
function PART2(PB) {
  const PX = 740, YX1 = 1160;
  // ---- 11.5–15 с: Розовая хватает палочку — пузырь-шлем на голову Жёлтой — поднимает — тык — «чпок»
  const GR2 = PB + 6;
  reach('pink', GR2);
  WAND.push({ f0: GR2, hand: 'pink', rot: rk([[GR2, 0], [GR2 + 8, -0.8], [GR2 + 12, -1.1], [GR2 + 17, 0.9], [GR2 + 26, 0.5], [GR2 + 38, 0.6], [GR2 + 51, 0.9], [GR2 + 57, 0.4], [GR2 + 63, 0]]) });
  sfx('pop', GR2 + 1, { who: 'pink', gain: 0.4, pitch: 0.7 });
  key('pink', GR2 + 6, { hitF: 0, lean: -4, hip: [0, 8], handF: hand('pink', 'F', -0.5, 0.2), handB: hand('pink', 'B', -0.3, 0.6) }, 6);
  const SW2 = GR2 + 12;
  key('pink', SW2 + 5, { handF: hand('pink', 'F', 0.95, -0.6), lean: 10 }, 4, 'in2');
  sfx('swing', SW2 + 1, { who: 'pink', gain: 0.6 });
  const EN3 = SW2 + 15;
  const B3 = bub([{ f: SW2 + 4, at: ring(10), r: 26 }, { f: EN3, at: 'yel:face', r: 150, arc: 40 }], null);
  sfx('inflate', SW2 + 4, { x: 1100, dur: 10, gain: 0.5 });
  sfx('boing', EN3, { who: 'yel', gain: 0.5, pitch: 1.6 });
  key('yel', EN3, { mouth: 'puzzlement', eyes: 'sad', head: -6 }, 2);
  // поднимает за голову: ноги болтаются
  const LF = EN3 + 4;
  key('yel', LF, { legFfk: 1, legBfk: 1, legF: [10, 20, 0], legB: [-12, 30, 0], handF: hand('yel', 'F', 0.25, -0.9), handB: hand('yel', 'B', 0.15, -0.95), lean: 0 }, 6);
  move('yel', LF, { x: YX1, y: GROUND }); move('yel', LF + 18, { y: GROUND - 60 }, 'io');
  for (let i = 0; i < 4; i++) key('yel', LF + 6 + i * 4, i % 2 ? { legF: [20, 30, 0], legB: [-25, 20, 0] } : { legF: [-15, 25, 0], legB: [5, 40, 0] }, 3);
  sfx('scared', LF + 2, { who: 'yel', gain: 0.8 });
  key('pink', EN3 + 2, { ...stance('pink', PX, 1), handF: hand('pink', 'F', 0.55, 0.0), mouth: 'happy with theeth', eyes: 'normal' }, 6);
  sfx('ref:laugh', EN3 + 4, { who: 'pink', gain: 0.85, pitch: 1.35 });
  laugh('pink', EN3 + 4, EN3 + 20);
  const PK2 = LF + 20;
  key('pink', PK2 - 6, { handF: hand('pink', 'F', 0.45, -0.5), lean: -2 }, 4);
  key('pink', PK2, { handF: hand('pink', 'F', 1.0, -0.75), lean: 12, mouth: 'theeth smile', eyes: 'angry' }, 3, 'in2');
  sfx('swing', PK2 - 3, { who: 'pink', gain: 0.4 });
  popBub(B3, PK2, 1.0);
  move('yel', PK2, { y: GROUND - 60 }); move('yel', PK2 + 4, { y: GROUND }, 'in2');
  sfx('land', PK2 + 5, { who: 'yel', gain: 0.6 });
  const FB = fallBack('yel', PK2 + 5, YX1, -1, { n: 12, stars: 24 });
  const YBX = 1400;
  const ysm = shrink('yel', FB + 6, YBX, -1, { mouth: 'puzzlement', eyes: 'sad', smoke: 420 });
  key('yel', ysm, { lean: 0, head: 0, hip: [0, 0], legF: null, legB: null, legFfk: 0, legBfk: 0, zB: null, rot: 0 }, 0);
  move('yel', ysm, { x: YBX, y: GROUND, rot: 0 });
  ev('stars', { who: 'yel', f0: ysm + 4, f1: ysm + 14, snd: false });
  // Розовая втыкает палочку обратно и хохочет
  const PL2 = PK2 + 12;
  key('pink', PK2 + 8, { ...stance('pink', PX, 1), handF: hand('pink', 'F', 0.5, 0.1), lean: 0 }, 4);
  reach('pink', PL2, 5);
  WAND.push({ f0: PL2, at: [MX, GROUND + BURY], rot: 0 });
  sfx('slam', PL2, { x: MX, gain: 0.4 });
  key('pink', PL2 + 6, { ...stance('pink', PX, 1), hitF: 0, mouth: 'happy with theeth', eyes: 'normal' }, 6);
  sfx('ref:laugh', PL2 + 8, { who: 'pink', gain: 0.85, pitch: 1.35 });
  laugh('pink', PL2 + 8, PL2 + 24);

  // ---- 15–18 с: шарик-Жёлтая дует в кольцо — пузыри катятся Розовой под ноги — скользит — «пуф»
  key('yel', ysm + 6, { eyes: 'angry', mouth: 'theeth smile' }, 0);
  const YBX2 = 1200;
  hopTo('yel', ysm + 8, ysm + 16, YBX, GROUND, YBX2, GROUND, 80);
  const BL2 = ysm + 18;
  blow('yel', BL2, BL2 + 26);
  sfx('inflate', BL2, { x: MX, dur: 26, gain: 0.45 });
  const LAND = [870, 820, 930, 770, 900, 840];
  const GB = LAND.map((lx, i) => {
    const f = BL2 + i * 4, r = 56 + (i % 3) * 10;
    sfx('pop', f + 5, { x: MX, gain: 0.15, pitch: 1.8 });
    return bub([{ f, at: ring(-6), r: 6 }, { f: f + 5, at: ring(-r - 4, 4), r, ease: 'lin' }, { f: f + 18, at: [lx, GROUND - r], r, arc: 40 },
      { f: f + 60, at: [lx - 10, GROUND - r], r }], null);
  });
  key('pink', BL2 + 10, { mouth: 'happy with theeth', eyes: 'normal', head: 8 }, 4);
  chuckle('pink', BL2 + 12, BL2 + 26);
  // шагает вперёд — прямо на пузыри — скользит
  const STP = BL2 + 26, PX3 = PX + 50;
  walk('pink', STP, PX, PX3, 1, 8, 1);
  const SL = STP + 8;
  const SLE = slip('pink', SL, PX3, 1, { n: 12, stars: 24 });
  [0, 1, 3].forEach((i, k) => popBub(GB[i], SL + k * 2, 0.6));
  [2, 4, 5].forEach((i, k) => popBub(GB[i], SLE + k * 3, 0.6));
  key('yel', SL + 4, { sx: 1, sy: 1, mouth: 'happy with theeth', eyes: 'normal' }, 0);
  sfx('ref:laugh', SL + 6, { who: 'yel', gain: 0.85, pitch: 1.45 });
  laugh('yel', SL + 6, SL + 24);
  const PBX = 560;
  const psm = shrink('pink', SLE + 8, PBX, 1, { mouth: 'puzzlement', eyes: 'sad', smoke: 420 });
  key('pink', psm, { lean: 0, head: 0, hip: [0, 0], legF: null, legB: null, legFfk: 0, legBfk: 0, zB: null, rot: 0 }, 0);
  move('pink', psm, { x: PBX, y: GROUND, rot: 0 });
  ev('stars', { who: 'pink', f0: psm + 4, f1: psm + 14, snd: false });

  // ---- 18–22 с: Жёлтая «растёт» снова — взмах — пузырь уносит шарика-Розовую за край
  key('yel', psm, { eyes: 'angry', mouth: 'angry theeth' }, 0);
  const YX2 = 1170, YB2 = transform('yel', psm + 2, YBX2, YX2, -1, { style: 'grow' });
  key('yel', YB2, stance('yel', YX2, -1), 0);
  key('yel', YB2 + 4, { mouth: 'theeth smile', eyes: 'angry' }, 0);
  key('pink', YB2 - 4, { mouth: 'puzzlement', eyes: 'sad' }, 0);
  const GR3 = YB2 + 6;
  reach('yel', GR3);
  WAND.push({ f0: GR3, hand: 'yel', rot: rk([[GR3, 0], [GR3 + 6, 0.8], [GR3 + 10, 1.1], [GR3 + 15, -1.0], [GR3 + 24, -0.5]]) });
  sfx('pop', GR3 + 1, { who: 'yel', gain: 0.4, pitch: 0.7 });
  key('yel', GR3 + 6, { hitF: 0, lean: -4, hip: [0, 8], handF: hand('yel', 'F', -0.5, 0.2), handB: hand('yel', 'B', -0.3, 0.6) }, 6);
  const SW3 = GR3 + 10;
  key('yel', SW3 + 5, { handF: hand('yel', 'F', 0.95, -0.05), lean: 12 }, 4, 'in2');
  sfx('swing', SW3 + 1, { who: 'yel', gain: 0.6 });
  const EN4 = SW3 + 16;
  const B4 = bub([{ f: SW3 + 4, at: ring(-10), r: 30 }, { f: EN4, at: 'pink:body', r: 190, arc: 60 }], null);
  sfx('inflate', SW3 + 4, { x: 900, dur: 10, gain: 0.5 });
  sfx('boing', EN4, { x: PBX, gain: 0.55, pitch: 1.5 }); sfx('squish', EN4, { x: PBX, gain: 0.4 });
  key('pink', EN4, { sx: 1.08, sy: 0.94 }, 2); key('pink', EN4 + 4, { sx: 1, sy: 1 }, 3);
  sfx('scared', EN4 + 3, { who: 'pink', gain: 0.7 });
  // Жёлтая дует — пузырь с Розовой улетает вверх-влево за край
  key('yel', EN4 + 2, { ...stance('yel', YX2, -1), handF: hand('yel', 'F', 0.5, 0.05), lean: 14, head: 8, mouth: 'puzzlement', eyes: 'normal' }, 5);
  sfx('gust', EN4 + 4, { who: 'yel', dur: 18, gain: 0.6 });
  move('pink', EN4 + 1, { x: PBX, y: GROUND, rot: 0 }); move('pink', EN4 + 34, { x: -360, y: GROUND - 760, rot: -40 }, 'in2');
  key('yel', EN4 + 20, { lean: 0, head: 0, mouth: 'happy with theeth' }, 5);
  sfx('ref:laugh', EN4 + 20, { who: 'yel', gain: 0.85, pitch: 1.45 });
  // палочку — через плечо за правый край
  const TH = EN4 + 26;
  key('yel', TH - 4, { handF: hand('yel', 'F', -0.2, -0.9), lean: -8 }, 4);
  WAND.push({ f0: TH, f1: TH + 16, a: (f, S) => { const w = wandAt(TH - 1, statesAt(TH - 1)); return [w.x, w.y]; }, b: [2250, 120], arc: 260, rot0: -0.5, rot1: 7 }, { f0: TH + 16, gone: true });
  sfx('whoosh', TH, { x: 1500, dur: 14, gain: 0.5 });
  key('yel', TH + 4, { ...stance('yel', YX2, -1), mouth: 'happy with theeth', eyes: 'normal' }, 6);

  // ---- 22–25 с: в центр, руки вверх
  const WIN = victory('yel', TH + 6, YX2, { n: 9, stride: 90 });
  TT = { PB, GR2, SW2, EN3, PK2, FB, ysm, BL2, SL, SLE, psm, YB2, GR3, EN4, TH, WIN };
}

const START = () => {
  BIG();
  for (const fn of LATE) fn();
  window.T = { ...TT };
};

// ------------------------------------------------------------------ рисование
const t0 = (f) => f / FPS;
ST.hooks.beforeChars.push((ctx, f, S, CAM) => {
  ctx.setTransform(...CAM);
  const c = segAt(WAND, f);
  if (c && c.at) {
    const w = wandAt(f, S);
    ctx.save(); ctx.beginPath(); ctx.rect(-500, -500, 3000, GROUND + 512); ctx.clip();   // низ ручки — в земле
    FX.bubbleWand(ctx, w.x, w.y, WS, w.rot); ctx.restore();
  }
});
// пузырь + тонкий тёмный контур, чтобы читался на траве и небе
function drawBub(ctx, x, y, r, t) {
  FX.soapBubble(ctx, x, y, r, t);
  ctx.save(); ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.lineWidth = Math.max(2.5, r * 0.022); ctx.strokeStyle = 'rgba(40,70,150,0.55)'; ctx.stroke(); ctx.restore();
}
ST.hooks.afterChars.push((ctx, f, S, CAM) => {
  ctx.setTransform(...CAM);
  const c = segAt(WAND, f);
  if (c && !c.at) { const w = wandAt(f, S); if (w) FX.bubbleWand(ctx, w.x, w.y, WS, w.rot); }
  for (const b of BUBS) {
    const s = bubAt(b, f, S);
    if (s) drawBub(ctx, s.c[0], s.c[1], s.r, t0(f) + b.keys[0].f * 0.1);
    else if (b.pop != null && f >= b.pop && f < b.pop + 12) {
      const p = bubAt(b, b.pop - 1, statesAt(b.pop - 1));
      if (p) FX.bubblePop(ctx, p.c[0], p.c[1], p.r, (f - b.pop) / 12);
    }
  }
});

ST.start(START);
