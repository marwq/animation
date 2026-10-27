// Серия 2, ролик 20: Желе — Жёлтая (слева) против Малыша (справа), 22 с, 24 кадра/с. Драка без ударов:
// большое дрожащее желе: батут, «клетка» из желе, лужица, на которой всё подпрыгивает.
// Музыка превращения — один раз. Фон — тёмный лес.
//
//   0–2 с     шарик-Жёлтая и шарик-Малыш неподвижно стоят друг напротив друга, середина пустая
//   2–4 с     с неба падает желе; Малыш на пропеллере ныряет в него — его подбрасывает прямо Жёлтой на голову
//   3.9–5.1 с Жёлтая «растёт» под музыку — Малыш влюблён
//   5.2–9.5 с она берёт желе и накрывает им Малыша — он внутри; пропеллер поднимает его вместе с желе — желе соскальзывает
//   9.5–14 с  Малыш «растёт», кидает ей под ноги лужицу желе — она подпрыгивает, как на батуте, — падает — «пуф»
//   14–16 с   шарик-Жёлтая прыгает в лужицу — её подбрасывает, она падает Малышу на голову — «пуф», улетает
//   16–22 с   Жёлтая «растёт» и в центре, руки вверх
'use strict';

const ST = Stage({
  name: '20 Жёлтая vs Малыш',
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
  background: { theme: 'darkforest', seed: 1020, sunX: 1500, sunY: 130 },
  clouds: [[150, 80, 2.4, 0, 12], [700, 220, 1.8, 1, 16], [1150, 70, 2.6, 2, 10], [1720, 250, 1.5, 0, 18]],
});
const { FPS, NF, GROUND, C, key, move, ev, sfx, hop, laugh, tremble, transform, shrink, stance, walk,
  fallBack, victory, chuckle, hand, statesAt, target } = ST;
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

// ------------------------------------------------------------------ желе
const JW = 300, JH = 240;
const JEL = [];           // {f0, at:[x], w, h} | {f0, f1, a, b, arc, w0, w1, h0, h1} | {f0, hands, w, h} | {f0, on, w, h} | {f0, gone}
const PUD = [];           // {f0, f1, x, w}
const WOB = [];           // [f, amp]
const wobAt = (f) => { let w = 0; for (const [a, v] of WOB) if (f >= a) w += v * Math.exp(-(f - a) / 9); return Math.min(1.3, w); };
function segAt(segs, f) { let c = null; for (const s of segs) if (f >= s.f0) c = s; return c && !c.gone ? c : null; }
const handsMid = (who, S) => { const h = C[who].big.point(S[who].st, 'handF'), g = C[who].big.point(S[who].st, 'handB'); return [(h[0] + g[0]) / 2, Math.max(h[1], g[1])]; };
function jelAt(f, S) {
  const c = segAt(JEL, f);
  if (!c) return null;
  if (c.at) return { x: c.at[0], y: c.at[1] ?? GROUND, w: c.w, h: c.h };
  if (c.hands) { if (S[c.hands].p.form !== 'big') return null; const m = handsMid(c.hands, S); return { x: m[0] + (c.dx || 0), y: m[1] + (c.dy || 0), w: c.w, h: c.h }; }
  if (c.on) { const p = S[c.on].p; return { x: p.x, y: p.y + 20, w: c.w, h: c.h }; }
  const u = E.clamp((f - c.f0) / (c.f1 - c.f0), 0, 1), e = c.ease ? E.EASE[c.ease](u) : u;
  const a = P(c.a, c.f0, statesAt(c.f0)), b = P(c.b, f, S);
  return { x: E.lerp(a[0], b[0], e), y: E.lerp(a[1], b[1], e) - Math.sin(Math.PI * u) * (c.arc || 0), w: E.lerp(c.w0, c.w1 ?? c.w0, u), h: E.lerp(c.h0, c.h1 ?? c.h0, u) };
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
function boing(f, x, amp = 1) { WOB.push([f, amp]); sfx('boing', f, { x, gain: 0.8 }); sfx('squish', f, { x, gain: 0.5 }); }

const YX0 = 560, BX0 = 1360, JX = 960;
// ================================================================== 0–2 с: неподвижная стойка
key('yel', 0, { form: 'small', x: YX0, y: GROUND, face: 1, look: 1, eyes: 'normal', mouth: 'smile normal', sx: 1, sy: 1, rot: 0, pivot: 0, alpha: 1 }, 0);
key('baby', 0, { form: 'small', x: BX0, y: GROUND, face: -1, look: 1, eyes: 'normal', mouth: ' 6', sx: 1, sy: 1, rot: 0, pivot: 0, alpha: 1 }, 0);

const BIG = () => {
  // ---- 2–4 с: желе с неба — Малыш ныряет в него — его подбрасывает Жёлтой на голову
  JEL.push({ f0: 48, f1: 55, a: [JX, -260], b: [JX, GROUND], w0: JW, h0: JH, ease: 'in2' }, { f0: 55, at: [JX], w: JW, h: JH });
  sfx('whoosh', 48, { x: JX, dur: 7, gain: 0.5 }); boing(55, JX, 1); ev('dust', { f: 55, x: JX, r: 80, n: 6, snd: false });
  key('yel', 50, { mouth: 'puzzlement' }, 0); key('baby', 50, { mouth: ' 5' }, 0);
  key('baby', 56, { mouth: ' 2', eyes: 'angry' }, 0);
  sfx('ref:grin-eee', 56, { who: 'baby', gain: 0.4, pitch: 1.2 });
  const DIVE = 70;
  propeller('baby', 56, DIVE, 8);
  move('baby', 57, { x: BX0, y: GROUND }); move('baby', 64, { x: 1150, y: GROUND - 440 }, 'out2'); move('baby', DIVE, { x: JX, y: GROUND - JH + 30 }, 'in2');
  key('baby', DIVE, { sx: 1.3, sy: 0.75 }, 1);
  boing(DIVE, JX, 1.3);
  const HIT = DIVE + 13;
  key('baby', DIVE + 3, { sx: 0.85, sy: 1.18 }, 3);
  move('baby', DIVE + 1, { x: JX, y: GROUND - JH + 30 }); move('baby', DIVE + 7, { y: GROUND - 340 }, 'out2'); move('baby', HIT, { x: YX0 + 10, y: GROUND - 130 }, 'in2');
  move('baby', HIT, { x: YX0 + 10 }, 'lin');
  sfx('whoosh', DIVE + 2, { who: 'baby', dur: 10, gain: 0.5 });
  key('yel', HIT - 5, { mouth: 'puzzlement', eyes: 'sad' }, 0);
  key('yel', HIT, { sx: 1.6, sy: 0.55 }, 1);
  key('baby', HIT, { sx: 1.25, sy: 0.8 }, 1);
  sfx('slam', HIT, { who: 'yel', gain: 0.9 }); sfx('squish', HIT, { who: 'yel', gain: 0.6 });
  ev('shake', { f: HIT, amp: 12, n: 8 }); ev('dust', { f: HIT, x: YX0, r: 70, n: 6, snd: false });
  const BX1 = 1250;
  hopTo('baby', HIT + 1, HIT + 15, YX0 + 10, GROUND - 130, BX1, GROUND, 200);
  key('baby', HIT + 15, { mouth: ' 1', eyes: 'normal' }, 0);
  sfx('ref:laugh', HIT + 15, { who: 'baby', gain: 0.85, pitch: 1.3 });
  laugh('baby', HIT + 17, HIT + 31);
  key('yel', HIT + 10, { sx: 1, sy: 1 }, 5, 'out'); sfx('boing', HIT + 10, { who: 'yel', gain: 0.6 });
  ev('stars', { who: 'yel', f0: HIT + 6, f1: HIT + 20 });

  // ---- 3.9–5.1 с: Жёлтая «растёт» — Малыш влюблён
  const YX = 600;
  key('yel', HIT + 10, { eyes: 'angry', mouth: 'angry theeth' }, 0);
  const YB = transform('yel', HIT + 11, YX0, YX, 1, { style: 'grow', love: 'baby', loveDur: 56 });
  key('yel', YB, stance('yel', YX, 1), 0);
  key('yel', YB + 4, { mouth: 'theeth smile', eyes: 'normal' }, 0);

  // ---- 5.2–9.5 с: берёт желе — накрывает им Малыша — пропеллер поднимает его с желе — желе соскальзывает
  const YX1 = 760;
  walk('yel', YB + 4, YX, YX1, 1, 10, 1);
  const GRAB = YB + 18;
  key('yel', GRAB - 5, { lean: 22, hip: [0, ST.toRig('yel', 110)], head: 6 }, 5);
  key('yel', GRAB, { hitF: 1, hitB: 1, hitFto: [JX - 120, GROUND - 170], hitBto: [JX - 150, GROUND - 80] }, 4);
  JEL.push({ f0: GRAB, hands: 'yel', w: JW, h: JH, dx: 130, dy: 110 });
  boing(GRAB, JX, 0.6);
  key('yel', GRAB + 8, { ...stance('yel', YX1, 1), hitF: 0, hitB: 0, handF: hand('yel', 'F', 0.75, 0.15), handB: hand('yel', 'B', 0.6, 0.2), mouth: 'theeth smile', eyes: 'angry' }, 8);
  WOB.push([GRAB + 8, 0.5]);
  // влюблённый Малыш скачет к ней
  const BX2 = 1160;
  hopTo('baby', YB + 10, YB + 20, BX1, GROUND, BX2, GROUND, 70);
  ev('hearts', { who: 'baby', f0: YB + 20, f1: YB + 44, snd: false });
  const PUT = GRAB + 14, IN = PUT + 8;
  key('yel', PUT - 4, { handF: hand('yel', 'F', 0.35, -0.85), handB: hand('yel', 'B', 0.25, -0.85), lean: -6 }, 4);
  key('yel', PUT, { handF: hand('yel', 'F', 0.95, -0.1), handB: hand('yel', 'B', 0.85, -0.1), lean: 14 }, 3, 'in2');
  sfx('swing', PUT - 2, { who: 'yel', gain: 0.7 });
  JEL.push({ f0: PUT, f1: IN, a: (f, S) => { const j = jelAt(PUT - 1, statesAt(PUT - 1)); return [j.x, j.y]; }, b: [BX2, GROUND], arc: 120, w0: JW, w1: 340, h0: JH, h1: 380 },
    { f0: IN, on: 'baby', w: 340, h: 380 });
  boing(IN, BX2, 1.2);
  key('baby', IN - 3, { mouth: ' 5', eyes: 'sad' }, 0);
  key('yel', IN + 4, { ...stance('yel', YX1, 1), mouth: 'happy with theeth', eyes: 'normal' }, 8);
  sfx('ref:laugh', IN + 2, { who: 'yel', gain: 0.85, pitch: 1.45 });
  chuckle('yel', IN + 4, IN + 20, { mouth: 'happy with theeth' });
  for (let f = IN + 4; f < IN + 18; f += 6) { WOB.push([f, 0.35]); sfx('bonk', f, { x: BX2, gain: 0.3, pitch: 1.4 }); }
  // взлетает в желе на пропеллере
  const UP0 = IN + 12, UP1 = UP0 + 14, SLIP = UP1 + 2;
  propeller('baby', UP0 - 4, SLIP + 16, 9);
  move('baby', UP0, { x: BX2, y: GROUND }); move('baby', UP1, { x: BX2 + 120, y: GROUND - 360 }, 'io');
  for (let f = UP0 + 3; f < UP1; f += 5) WOB.push([f, 0.25]);
  const JX2 = 1480;
  JEL.push({ f0: SLIP, f1: SLIP + 10, a: (f, S) => { const j = jelAt(SLIP - 1, statesAt(SLIP - 1)); return [j.x, j.y]; }, b: [JX2, GROUND], w0: 340, w1: 340, h0: 380, h1: 380, ease: 'in2' },
    { f0: SLIP + 10, gone: true });
  PUD.push({ f0: SLIP + 10, f1: 0, x: JX2, w: 360 });
  boing(SLIP + 10, JX2, 1.2); sfx('splash', SLIP + 10, { x: JX2, gain: 0.7 });
  key('baby', SLIP + 2, { mouth: ' 1', eyes: 'normal' }, 0);
  const BX3 = 1340, DN = SLIP + 14;
  move('baby', SLIP + 8, { x: BX2 + 120, y: GROUND - 360 }); move('baby', DN, { x: BX3, y: GROUND }, 'in2');
  key('baby', DN, { sx: 1.25, sy: 0.8 }, 1); key('baby', DN + 5, { sx: 1, sy: 1 }, 4);
  sfx('land', DN, { who: 'baby', gain: 0.6 });

  // ---- 9.5–14 с: Малыш «растёт» — кидает ей под ноги лужицу желе — батут — падает — «пуф»
  key('baby', DN + 2, { eyes: 'angry', mouth: ' 2' }, 0);
  const BB = transform('baby', DN + 3, BX3, BX3, -1, { style: 'grow' });
  key('baby', BB, stance('baby', BX3, -1), 0);
  key('baby', BB + 4, { mouth: 'theeth smile', eyes: 'angry' }, 0);
  key('yel', BB - 2, { mouth: 'puzzlement', eyes: 'sad' }, 0);
  const SC = BB + 8;
  key('baby', SC - 5, { lean: 28, hip: [0, ST.toRig('baby', 180)], head: 8 }, 5);
  key('baby', SC, { hitF: 1, hitFto: [JX2 - 60, GROUND - 20], hitFfix: SC }, 4);
  PUD[0].f1 = SC;
  JEL.push({ f0: SC, hands: 'baby', w: 140, h: 110, dx: 0, dy: 60 });
  boing(SC, JX2, 0.6);
  key('baby', SC + 6, { ...stance('baby', BX3, -1), hitF: 0, handF: hand('baby', 'F', 0.1, -0.95), mouth: 'happy with theeth' }, 6);
  const TH = SC + 12, LND = TH + 10;
  key('baby', TH, { handF: hand('baby', 'F', 0.9, 0.2), lean: 14 }, 3, 'in2');
  sfx('swing', TH - 2, { who: 'baby', gain: 0.7 });
  JEL.push({ f0: TH, f1: LND, a: (f, S) => { const j = jelAt(TH - 1, statesAt(TH - 1)); return [j.x, j.y]; }, b: [YX1 + 20, GROUND], arc: 120, w0: 140, w1: 140, h0: 110, h1: 110 }, { f0: LND, gone: true });
  PUD.push({ f0: LND, f1: 0, x: YX1 + 20, w: 380 });
  boing(LND, YX1, 0.8); sfx('splash', LND, { x: YX1, gain: 0.7 });
  key('baby', TH + 8, { ...stance('baby', BX3, -1), mouth: 'happy with theeth', eyes: 'normal' }, 6);
  sfx('ref:laugh', LND + 6, { who: 'baby', gain: 0.85, pitch: 1.2 });
  chuckle('baby', LND + 6, LND + 56, { mouth: 'happy with theeth' });
  // она подпрыгивает, как на батуте
  const B1 = LND + 4;
  key('yel', B1 - 2, { mouth: 'puzzlement', eyes: 'sad', handF: hand('yel', 'F', 0.7, -0.6), handB: hand('yel', 'B', -0.7, -0.6), lean: 0, head: 0 }, 3);
  const BOUNCE = [[B1, 110, 12], [B1 + 12, 200, 16]];
  for (const [f, h, n] of BOUNCE) {
    key('yel', f, { hip: [0, ST.toRig('yel', 70)] }, 2); key('yel', f + 3, { hip: [0, 0] }, 2);
    move('yel', f, { x: YX1, y: GROUND }); move('yel', f + n / 2, { y: GROUND - h }, 'out2'); move('yel', f + n, { y: GROUND }, 'in2');
    boing(f, YX1, 0.7); sfx('scared', f + 2, { who: 'yel', gain: 0.4 });
  }
  const FL = B1 + 28;
  const FB = fallBack('yel', FL, YX1, 1, { n: 14, stars: 26 });
  const YBX = 560;
  const ysm = shrink('yel', FB + 6, YBX, 1, { mouth: 'puzzlement', eyes: 'sad', smoke: 420 });
  key('yel', ysm, { lean: 0, head: 0, hip: [0, 0], legF: null, legB: null, zB: null, rot: 0 }, 0);
  move('yel', ysm, { x: YBX, y: GROUND, rot: 0 });
  ev('stars', { who: 'yel', f0: ysm + 4, f1: ysm + 14, snd: false });

  // ---- 14–16 с: шарик-Жёлтая прыгает в лужицу — её подбрасывает — падает Малышу на голову — «пуф»
  key('yel', ysm + 6, { eyes: 'angry', mouth: 'angry theeth' }, 0);
  const INP = ysm + 16;
  hopTo('yel', ysm + 8, INP, YBX, GROUND, YX1 + 20, GROUND, 90, { land: false });
  key('yel', INP, { sx: 1.4, sy: 0.68 }, 1);
  boing(INP, YX1, 1.3);
  const TOPH = INP + 16;
  key('yel', INP + 3, { sx: 0.85, sy: 1.18, mouth: 'theeth smile' }, 3);
  move('yel', INP + 1, { x: YX1 + 20, y: GROUND }); move('yel', INP + 9, { y: GROUND - 470 }, 'out2');
  move('yel', TOPH, { x: BX3, y: GROUND - 740 + 20 }, 'in2'); move('yel', TOPH, { x: BX3 }, 'lin');
  sfx('whoosh', INP + 1, { who: 'yel', dur: 14, gain: 0.6 });
  key('baby', TOPH - 6, { look: 1, head: -16, mouth: 'puzzlement', eyes: 'sad' }, 4);
  key('baby', TOPH, { sx: 1.5, sy: 0.6, head: 0 }, 2);
  key('yel', TOPH, { sx: 1.3, sy: 0.75 }, 1);
  move('yel', TOPH + 2, { x: BX3, y: GROUND - 740 * 0.62 + 30 }, 'out');
  sfx('slam', TOPH, { who: 'baby', gain: 1.0 }); sfx('bonk', TOPH, { who: 'baby', gain: 0.6 });
  ev('shake', { f: TOPH, amp: 16, n: 10 }); ev('stars', { who: 'baby', f0: TOPH + 2, f1: TOPH + 14, snd: false });
  const bsm = shrink('baby', TOPH + 10, BX3, -1, { mouth: ' 5', eyes: 'sad', smoke: 420 });
  key('baby', bsm, { lean: 0, head: 0, hip: [0, 0], legF: null, legB: null, rot: 0 }, 0);
  const YX4 = 1150;
  hopTo('yel', TOPH + 8, TOPH + 20, BX3, GROUND - 740 * 0.62 + 30, YX4, GROUND, 40);
  key('yel', TOPH + 20, { mouth: 'happy with theeth', eyes: 'normal' }, 0);
  sfx('ref:laugh', TOPH + 20, { who: 'yel', gain: 0.85, pitch: 1.45 });
  laugh('yel', TOPH + 22, TOPH + 30);
  // Малыш улетает на пропеллере
  propeller('baby', bsm + 4, bsm + 36, 9);
  move('baby', bsm + 6, { x: BX3, y: GROUND }); move('baby', bsm + 36, { x: BX3 + 420, y: -380 }, 'in2');
  sfx('scared', bsm + 6, { who: 'baby', gain: 0.6 });

  // ---- Жёлтая «растёт» — в центр
  const YB2 = transform('yel', TOPH + 24, YX4, YX4 - 40, -1, { style: 'grow' });
  key('yel', YB2, stance('yel', YX4 - 40, -1), 0);
  key('yel', YB2 + 4, { mouth: 'happy with theeth' }, 0);
  const WIN = victory('yel', YB2 + 6, YX4 - 40, { n: 9, stride: 75 });
  window.T = { DIVE, HIT, YB, GRAB, IN, UP0, SLIP, DN, BB, SC, LND, FL, ysm, INP, TOPH, bsm, YB2, WIN };
};

// ------------------------------------------------------------------ рисование
ST.hooks.beforeChars.push((ctx, f, S, CAM) => {
  ctx.setTransform(...CAM);
  for (const p of PUD) if (f >= p.f0 && (!p.f1 || f < p.f1)) FX.jellyPuddle(ctx, p.x, GROUND + 6, p.w, f / FPS, wobAt(f));
});
ST.hooks.afterChars.push((ctx, f, S, CAM) => {
  ctx.setTransform(...CAM);
  const j = jelAt(f, S);
  if (j) FX.jelly(ctx, j.x, j.y, j.w, j.h, f / FPS, wobAt(f), 0.55);
});

ST.start(BIG);
