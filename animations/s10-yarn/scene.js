// Серия 2, ролик 10: Клубок шерсти — Розовая (слева) против Лорда (справа), 22 с, 24 кадра/с. Драка без ударов:
// клубок обматывает, нитка-лассо, раскрутить как юлу, связать ноги, укатить клубком.
// Музыка превращения — один раз. Фон — равнина с подсолнухами.
//
//   0–2 с     шарик-Розовая и шарик-Лорд неподвижно стоят друг напротив друга, середина пустая
//   2–4 с     с неба падает клубок; Лорд толкает его — клубок катится вокруг Розовой и обматывает её
//   4–5.2 с   Розовая «растёт» под музыку — нитки рвутся — Лорд влюблён
//   5.4–8 с   бросает клубок в Лорда — он обмотан как мумия, катится и стукается
//   8–9.3 с   Лорд «растёт» — нитки рвутся
//   9.5–12.6 с нитка-лассо вокруг её талии — дёргает — Розовая крутится юлой — падает — «пуф»
//   12.7–16 с шарик-Розовая с ниткой во рту бегает вокруг его ног — ноги связаны — падает — «пуф»
//   16–22 с   Розовая «растёт», пинком укатывает Лорда-клубок за край; в центре, руки вверх
'use strict';

const ST = Stage({
  name: '10 Розовая vs Лорд',
  frames: 528,
  cast: {
    pink: { small: ['girl-verity-small', { bodyHeight: 300 }], big: ['girl-verity-big', { height: 730, splitFeet: true }],
      pivot: 337, voice: 1.35, vAngle: 50, lie: 55, color: '#ff4fc8', moods: { angry: 'angry theeth', grin: 'theeth smile', big: 'theeth smile' } },
    lord: { small: ['lord-verity-small', { bodyHeight: 300 }], big: ['lord-verity-big', { height: 730 }], pivot: 337,
      voice: 1.0, lie: 55, color: '#ffe23a', ouch: ['ref:hit-ow', 1.0, 0.9] },
  },
  order: ['lord', 'pink'],
  background: { theme: 'plains', seed: 1010, sunX: 1500, sunY: 130 },
  clouds: [[150, 80, 2.4, 0, 12], [700, 220, 1.8, 1, 16], [1150, 70, 2.6, 2, 10], [1720, 250, 1.5, 0, 18]],
});
const { FPS, NF, GROUND, C, key, move, ev, sfx, hop, tumble, laugh, tremble, transform, shrink, love, stance, walk, turn,
  kick, fallBack, victory, chuckle, hand, toRig, statesAt, stateAt, target } = ST;
const P = (v, f, S) => (typeof v === 'function' ? v(f, S) : typeof v === 'string' ? target(v, S) : v);

// ------------------------------------------------------------------ клубок, нитки, обмотка
const YC = '#3aa0ff', YD = '#1d5fa8', YR = 66;
const BALL = [];          // {f0, f1, path: (u) => [x, y], r0, r1, spin} | {f0, at, r} | {f0, hand} | {f0, gone}
const THREADS = [];       // {f0, f1, pts: (f, S) => [...]}
const WRAP = [];          // {who, f0, f1, k0, k1, n, part, w, h, dy}
const SNAP = [];          // {f, at}
const SPIN = [];          // {who, f0, f1}
function ballAt(f, S) {
  let c = null;
  for (const s of BALL) if (f >= s.f0) c = s;
  if (!c || c.gone) return null;
  if (c.at) return { x: c.at[0], y: c.at[1], r: c.r || YR, rot: c.rot || 0 };
  if (c.hand) { if (S[c.hand].p.form !== 'big') return null; const h = C[c.hand].big.point(S[c.hand].st, 'handF'); return { x: h[0], y: h[1] - 20, r: c.r || YR, rot: 0 }; }
  const u = E.clamp((f - c.f0) / (c.f1 - c.f0), 0, 1), p = c.path(u, f, S);
  return { x: p[0], y: p[1], r: E.lerp(c.r0 ?? YR, c.r1 ?? YR, u), rot: u * (c.spin || 0) };
}
const arc = (a, b, h) => (u, f, S) => { const A = P(a, f, S), B = P(b, f, S); return [E.lerp(A[0], B[0], u), E.lerp(A[1], B[1], u) - Math.sin(Math.PI * u) * h]; };
function snap(f, at) { SNAP.push({ f, at }); sfx('pop', f, { x: 960, gain: 0.8 }); sfx('crunch', f + 1, { x: 960, gain: 0.4 }); }

const PX0 = 560, LX0 = 1360;
// ================================================================== 0–2 с: неподвижная стойка
key('pink', 0, { form: 'small', x: PX0, y: GROUND, face: 1, look: 1, eyes: 'normal', mouth: 'smile normal', sx: 1, sy: 1, rot: 0, pivot: 0, alpha: 1 }, 0);
key('lord', 0, { form: 'small', x: LX0, y: GROUND, face: -1, look: 1, eyes: 'normal', mouth: 'smile normal', sx: 1, sy: 1, rot: 0, pivot: 0, alpha: 1 }, 0);

const BIG = () => {
  // ---- 2–4 с: клубок с неба — Лорд толкает — клубок обматывает Розовую
  const BX = 1060, BY = GROUND - YR;
  BALL.push({ f0: 48, f1: 58, path: arc([BX, -150], [BX, BY], 0), spin: 2 }, { f0: 58, at: [BX, BY] });
  sfx('whoosh', 48, { x: BX, dur: 10, gain: 0.5 }); sfx('boing', 58, { x: BX, gain: 0.7 });
  key('pink', 52, { mouth: 'puzzlement' }, 0); key('lord', 52, { mouth: 'puzzlement' }, 0);
  key('lord', 60, { mouth: 'happy with theeth', eyes: 'angry' }, 0);
  const PUSH = 72;
  hop('lord', 62, PUSH, LX0, BX + YR + 130, 90);
  sfx('bonk', PUSH, { x: BX, gain: 0.6 });
  // катится к Розовой и кругом (орбита) — нитка тянется от места толчка
  const R0 = PUSH, R1 = R0 + 9, OR = 150, NO = 2, OT = 7, R2 = R1 + NO * OT;
  BALL.push({ f0: R0, f1: R1, path: arc([BX, BY], [PX0 + OR, BY], 0), spin: -6, r1: YR * 0.85 });
  BALL.push({ f0: R1, f1: R2, path: (u) => { const a = u * NO * Math.PI * 2; return [PX0 + Math.cos(a) * OR, BY - 60 - Math.sin(a) * 40 + Math.abs(Math.sin(a)) * 30]; }, spin: -12, r0: YR * 0.85, r1: YR * 0.55 });
  BALL.push({ f0: R2, at: [PX0 + OR, BY + 14], r: YR * 0.55 });
  sfx('whirr', R0, { x: 800, dur: R2 - R0, gain: 0.6 });
  THREADS.push({ f0: R0, f1: 0, pts: (f, S) => { const b = ballAt(f, S); return b ? [[BX + 20, GROUND - 4], [ (BX + b.x) / 2, GROUND - 2], [b.x, b.y + b.r * 0.6]] : []; } });
  WRAP.push({ who: 'pink', f0: R1, f1: 0, k0: 0, k1: 1, kf: R2, n: 6, part: 'body', w: 300, h: 260, dy: 10 });
  key('pink', R1, { mouth: 'puzzlement', eyes: 'sad' }, 0);
  tremble('pink', R1, R2 + 14, PX0, 4);
  sfx('scared', R1 + 2, { who: 'pink', gain: 0.7 });
  sfx('ref:laugh', R2, { who: 'lord', gain: 0.85, pitch: 1.0 });
  laugh('lord', R2, R2 + 20);

  // ---- 4–5.2 с: Розовая «растёт» — нитки рвутся — Лорд влюблён
  const PX = 600;
  key('pink', R2 + 2, { eyes: 'angry', mouth: 'angry theeth' }, 0);
  const PB = transform('pink', R2 + 4, PX0, PX, 1, { style: 'grow', love: 'lord', loveDur: 36 });
  WRAP[0].f1 = PB - 4; THREADS[0].f1 = PB - 4;
  snap(PB - 4, [PX0, GROUND - 150]);
  key('pink', PB, stance('pink', PX, 1), 0);
  key('pink', PB + 6, { mouth: 'theeth smile', eyes: 'angry' }, 0);

  // ---- 5.4–8 с: клубок в Лорда — он обмотан как мумия — катится и стукается
  const LX1 = 1150;
  hop('lord', PB + 2, PB + 12, BX + YR + 130, LX1, 80);
  const GR = PB + 8;
  key('pink', GR - 5, { lean: 20, hip: [0, toRig('pink', 140)], head: 6 }, 5);
  key('pink', GR, { hitF: 1, hitFto: [PX0 + OR, GROUND - 40], hitFfix: GR }, 4);
  BALL.push({ f0: GR, hand: 'pink', r: YR });
  sfx('pop', GR, { who: 'pink', gain: 0.5 });
  const TH = GR + 10, HIT = TH + 9;
  key('pink', TH - 5, { hitF: 0, lean: -6, hip: [0, toRig('pink', 8)], head: 0, handF: hand('pink', 'F', -0.4, -0.6) }, 5);
  key('pink', TH, { handF: hand('pink', 'F', 0.95, -0.2), lean: 12 }, 3, 'in2');
  key('pink', TH + 8, { ...stance('pink', PX, 1), mouth: 'happy with theeth', eyes: 'angry' }, 8);
  sfx('swing', TH - 2, { who: 'pink', gain: 0.9 });
  BALL.push({ f0: TH, f1: HIT, path: arc((f, S) => { const h = C.pink.big.point(statesAt(TH).pink.st, 'handF'); return [h[0], h[1] - 20]; }, (f, S) => target('lord:body', S), 90), spin: 8 });
  // вокруг Лорда — обмотка
  const W1 = HIT + 10;
  BALL.push({ f0: HIT, f1: W1, path: (u, f, S) => { const b = target('lord:body', S), a = u * 2 * Math.PI * 2; return [b[0] + Math.cos(a) * 170, b[1] - Math.sin(a) * 40]; }, spin: 14, r0: YR, r1: YR * 0.4 });
  BALL.push({ f0: W1, gone: true });
  WRAP.push({ who: 'lord', f0: HIT, f1: 0, k0: 0, k1: 1, kf: W1, n: 7, part: 'body', w: 300, h: 290, dy: 0 });
  sfx('bonk', HIT, { who: 'lord', gain: 0.7 }); sfx('whirr', HIT, { who: 'lord', dur: 12, gain: 0.6 });
  key('lord', HIT, { mouth: 'puzzlement', eyes: 'sad', pivot: ST.CAST.lord.pivot }, 0);
  tremble('lord', HIT, W1, LX1, 4);
  // катится и стукается
  const RL = W1 + 2, BUMP = RL + 12, LX2 = 1600;
  move('lord', RL, { x: LX1, y: GROUND, rot: 0 }); move('lord', BUMP, { x: LX2, rot: 540 }, 'in');
  sfx('whirr', RL, { who: 'lord', dur: 16, gain: 0.6 });
  key('lord', BUMP, { sx: 0.75, sy: 1.25, rot: 540 }, 1); key('lord', BUMP + 1, { rot: 0 }, 0); key('lord', BUMP + 5, { sx: 1, sy: 1 }, 4);
  move('lord', BUMP + 1, { x: LX2, rot: 0 }); move('lord', BUMP + 8, { x: LX2 - 80 }, 'out');
  sfx('bonk', BUMP, { who: 'lord', gain: 1.0 }); ev('stars', { who: 'lord', f0: BUMP + 2, f1: BUMP + 22 });
  ev('shake', { f: BUMP, amp: 10, n: 8 });
  sfx('ref:laugh', BUMP + 2, { who: 'pink', gain: 0.85, pitch: 1.35 });
  chuckle('pink', BUMP + 2, BUMP + 16, { mouth: 'happy with theeth' });

  // ---- 8–9.3 с: Лорд «растёт» — нитки рвутся
  const LX = 1450;
  key('lord', BUMP + 8, { eyes: 'angry', mouth: 'angry theeth' }, 0);
  const LB = transform('lord', BUMP + 10, LX2 - 80, LX, -1, { style: 'grow' });
  WRAP[1].f1 = LB - 4;
  snap(LB - 4, [LX2 - 80, GROUND - 150]);
  // хвост нитки остаётся на траве
  const TAIL = [[LX - 120, GROUND - 4], [LX - 300, GROUND - 2], [LX - 420, GROUND - 6]];
  THREADS.push({ f0: LB - 4, f1: 0, pts: () => TAIL });
  key('lord', LB, stance('lord', LX, -1), 0);
  key('lord', LB + 6, { mouth: 'angry theeth', eyes: 'angry' }, 0);
  key('pink', LB - 2, { mouth: 'puzzlement', eyes: 'sad' }, 0);

  // ---- 9.5–12.6 с: лассо вокруг талии — дёргает — юла — «пуф»
  const PK = LB + 4;
  key('lord', PK - 5, { lean: 20, hip: [0, toRig('lord', 140)], head: 6 }, 5);
  key('lord', PK, { hitF: 1, hitFto: TAIL[2], hitFfix: PK }, 4);
  THREADS[1].f1 = PK;
  const handL = (f, S) => C.lord.big.point(S.lord.st, 'handF');
  THREADS.push({ f0: PK, f1: 0, pts: (f, S) => { const h = handL(f, S); return [[h[0], h[1]], [h[0] - 60, h[1] + 120], [h[0] - 140, GROUND - 6]]; } });
  sfx('pop', PK, { who: 'lord', gain: 0.5 });
  // крутит лассо над головой и бросает
  const SW0 = PK + 6, SW1 = SW0 + 10, LAS = SW1 + 7;
  key('lord', SW0, { hitF: 0, lean: 0, hip: [0, toRig('lord', 8)], head: -4, handF: hand('lord', 'F', 0.3, -0.95), mouth: 'happy with theeth', eyes: 'angry' }, 5);
  THREADS[2].f1 = SW0;
  THREADS.push({ f0: SW0, f1: SW1, pts: (f, S) => { const h = handL(f, S), a = (f - SW0) * 0.9, c = [h[0] + Math.cos(a) * 30, h[1] - 60]; const pts = [[h[0], h[1]]]; for (let i = 0; i <= 10; i++) { const b = i / 10 * Math.PI * 2; pts.push([c[0] + Math.cos(b + a) * 110, c[1] + Math.sin(b + a) * 30]); } return pts; } });
  sfx('whirr', SW0, { who: 'lord', dur: SW1 - SW0, gain: 0.6 });
  key('lord', SW1, { handF: hand('lord', 'F', 0.95, -0.25), lean: 10 }, 3, 'in2');
  sfx('swing', SW1 - 2, { who: 'lord', gain: 0.9 }); sfx('whoosh', SW1, { x: 1000, dur: 8, gain: 0.6 });
  const waist = (f, S) => { const b = target('pink:body', S); return [b[0], b[1] + 70]; };
  THREADS.push({ f0: SW1, f1: LAS, pts: (f, S) => { const h = handL(f, S), w = waist(f, S), u = (f - SW1) / (LAS - SW1); return [[h[0], h[1]], [E.lerp(h[0], w[0], u * 0.5), E.lerp(h[1], w[1], u * 0.5) - 80], [E.lerp(h[0], w[0], u), E.lerp(h[1], w[1], u)]]; } });
  WRAP.push({ who: 'pink', f0: LAS, f1: 0, k0: 1, k1: 1, kf: LAS, n: 3, part: 'body', w: 230, h: 110, dy: 80 });
  THREADS.push({ f0: LAS, f1: 0, pts: (f, S) => { const h = handL(f, S), w = waist(f, S); return [[h[0], h[1]], [(h[0] + w[0]) / 2, (h[1] + w[1]) / 2 + 30], [w[0] + 100, w[1]]]; } });
  sfx('pop', LAS, { who: 'pink', gain: 0.6 });
  key('pink', LAS, { mouth: 'puzzlement', eyes: 'sad' }, 0);
  // дёргает — юла
  const YANK = LAS + 6, TOP0 = YANK + 2, TOP1 = TOP0 + 20;
  key('lord', YANK - 4, { handF: hand('lord', 'F', 0.9, -0.2), lean: 6 }, 4);
  key('lord', YANK, { handF: hand('lord', 'F', -0.5, -0.3), lean: -16, hip: [0, toRig('lord', 40)] }, 2, 'in2');
  key('lord', YANK + 8, { ...stance('lord', LX, -1), mouth: 'happy with theeth', eyes: 'normal' }, 8);
  sfx('swing', YANK - 1, { who: 'lord', gain: 1.0 });
  WRAP[2].f1 = TOP0 + 8; THREADS[THREADS.length - 1].f1 = YANK + 2;
  THREADS.push({ f0: YANK + 2, f1: YANK + 14, pts: (f, S) => { const h = handL(f, S), u = (f - YANK - 2) / 12; return [[h[0], h[1]], [h[0] - 200, h[1] + 100 + u * 200], [h[0] - 420 + u * 200, GROUND - 6]]; } });
  SPIN.push({ who: 'pink', f0: TOP0, f1: TOP1 });
  key('pink', TOP0, { legFfk: 1, legBfk: 1, legF: [0, 5], legB: [0, 5], hip: [0, toRig('pink', 4)], handF: hand('pink', 'F', 0.9, -0.2), handB: hand('pink', 'B', -0.9, -0.2), mouth: 'puzzlement', eyes: 'sad' }, 2);
  for (let i = 0; i < 10; i++) key('pink', TOP0 + 1 + i * 2, { face: i % 2 ? 1 : -1 }, 1);
  move('pink', TOP0, { x: PX }); move('pink', TOP1, { x: PX + 80 }, 'io');
  sfx('whirr', TOP0, { who: 'pink', dur: TOP1 - TOP0, gain: 0.9 }); sfx('scared', TOP0 + 2, { who: 'pink', gain: 0.8 });
  key('pink', TOP1, { ...stance('pink', PX + 80, 1), head: -8 }, 3);
  ev('stars', { who: 'pink', f0: TOP1, f1: TOP1 + 24 });
  const LIE = fallBack('pink', TOP1 + 2, PX + 80, 1, { n: 12, stars: false });
  const psm = shrink('pink', LIE + 4, PX + 80, 1, { mouth: 'puzzlement', eyes: 'sad', smoke: 420 });
  key('pink', psm, { lean: 0, head: 0, hip: [0, 0], legF: null, legB: null, zB: null, rot: 0, face: 1 }, 0);
  move('pink', psm, { x: PX + 80, y: GROUND, rot: 0 });
  ev('stars', { who: 'pink', f0: psm + 4, f1: psm + 20, snd: false });
  sfx('ref:laugh', TOP0 + 8, { who: 'lord', gain: 0.85, pitch: 0.95 });
  chuckle('lord', TOP0 + 8, TOP1 + 8, { mouth: 'happy with theeth' });
  // нитка с руки — на траву
  const TAIL2 = [[LX - 100, GROUND - 4], [LX - 300, GROUND - 3], [LX - 520, GROUND - 6]];
  THREADS.push({ f0: YANK + 14, f1: 0, pts: () => TAIL2 });

  // ---- 12.7–16 с: шарик-Розовая с ниткой во рту — вокруг его ног — связан — падает — «пуф»
  key('pink', psm + 4, { eyes: 'angry', mouth: 'theeth smile' }, 0);
  const G0 = psm + 6;
  hop('pink', G0, G0 + 10, PX + 80, LX - 520, 70);
  THREADS[THREADS.length - 1].f1 = G0 + 10;
  const mouthP = (f, S) => { const b = target('pink:body', S); return [b[0] + 60, b[1] + 40]; };
  const legs = (f, S) => [S.lord.p.x, GROUND - 120];
  const RUN0 = G0 + 11, RUN1 = RUN0 + 26, CIRC = 3;
  move('pink', RUN0, { x: LX - 520, y: GROUND }); move('pink', RUN0 + 8, { x: LX - 200 }, 'in');
  for (let f = RUN0 + 8; f <= RUN1; f++) {
    const u = (f - RUN0 - 8) / (RUN1 - RUN0 - 8), a = Math.PI + u * CIRC * 2 * Math.PI;
    key('pink', f, { x: LX + Math.cos(a) * 220, y: GROUND - Math.abs(Math.sin(a * 2)) * 30, z: Math.sin(a) < 0 ? -1 : 1, face: Math.sin(a) < 0 ? 1 : -1 }, 1, 'lin');
  }
  sfx('whirr', RUN0, { who: 'pink', dur: RUN1 - RUN0, gain: 0.7 });
  THREADS.push({ f0: G0 + 10, f1: 0, pts: (f, S) => { const m = mouthP(f, S); return [[LX - 520, GROUND - 6], [(LX - 520 + m[0]) / 2, GROUND - 8], m]; } });
  WRAP.push({ who: 'lord', f0: RUN0 + 12, f1: 0, k0: 0, k1: 1, kf: RUN1, n: 6, part: 'legs', w: 230, h: 260, dy: 0 });
  key('lord', RUN0 + 4, { mouth: 'puzzlement', eyes: 'sad', look: 1 }, 0);
  for (let f = RUN0 + 6; f < RUN1; f += 6) key('lord', f + 3, { head: (f / 6) % 2 ? -10 : 10 }, 3);
  key('pink', RUN1 + 1, { z: 0, face: -1 }, 0);
  hop('pink', RUN1 + 1, RUN1 + 13, LX - 220, 600, 160);
  // делает шаг — ноги связаны — падает вперёд
  const TR = RUN1 + 4;
  key('lord', TR, { lean: 18, head: 8, handF: hand('lord', 'F', 0.8, -0.5), handB: hand('lord', 'B', 0.6, -0.4) }, 4);
  sfx('scared', TR, { who: 'lord', gain: 0.8 });
  const LIE2 = fallBack('lord', TR + 4, LX, -1, { n: 12, stars: false, forward: true });
  const lsm = shrink('lord', LIE2 + 6, LX - 200, -1, { mouth: 'puzzlement', eyes: 'sad', smoke: 420 });
  key('lord', lsm, { lean: 0, head: 0, hip: [0, 0], legF: null, legB: null, zB: null, rot: 0 }, 0);
  move('lord', lsm, { x: LX - 200, y: GROUND, rot: 0 });
  WRAP[WRAP.length - 1].f1 = lsm;
  WRAP.push({ who: 'lord', f0: lsm, f1: 0, k0: 1, k1: 1, kf: lsm, n: 7, part: 'body', w: 300, h: 290, dy: 0 });
  THREADS[THREADS.length - 1].f1 = RUN1 + 1;
  ev('stars', { who: 'lord', f0: lsm + 4, f1: lsm + 20, snd: false });
  sfx('ref:laugh', LIE2 + 2, { who: 'pink', gain: 0.85, pitch: 1.35 });
  laugh('pink', LIE2 + 2, LIE2 + 8);

  // ---- 16–22 с: Розовая «растёт», пинком укатывает Лорда-клубок; в центр
  const PX2 = 600;
  const PB2 = transform('pink', LIE2 + 8, PX2, PX2, 1, { style: 'grow' });
  key('pink', PB2, stance('pink', PX2, 1), 0);
  walk('pink', PB2 + 2, PX2, LX - 360, 3, 8, 1);
  const KK = PB2 + 28;
  kick('pink', KK, [LX - 260, GROUND - 120], { x: LX - 360, face: 1, hard: false });
  key('lord', KK, { pivot: ST.CAST.lord.pivot }, 0);
  move('lord', KK, { x: LX - 200, y: GROUND, rot: 0 }); move('lord', KK + 20, { x: 2300, rot: 1200 }, 'out');
  sfx('whirr', KK, { who: 'lord', dur: 18, gain: 0.7 }); sfx('scared', KK + 2, { who: 'lord', gain: 0.8 });
  ev('twinkle', { f: KK + 16, at: [1830, GROUND - 160], n: 20, size: 56 });
  sfx('ref:laugh', KK + 6, { who: 'pink', gain: 0.85, pitch: 1.35 });
  key('pink', KK + 10, { mouth: 'happy with theeth', eyes: 'normal' }, 0);
  const WIN = victory('pink', KK + 18, LX - 360, { n: 9, stride: 110 });
  window.T = { PUSH, R2, PB, HIT, BUMP, LB, LAS, TOP0, LIE, psm, RUN1, LIE2, lsm, PB2, KK, WIN };
};

// ------------------------------------------------------------------ рисование
ST.hooks.beforeChars.push((ctx, f, S, CAM) => {
  ctx.setTransform(...CAM);
  for (const t of THREADS) if (f >= t.f0 && (!t.f1 || f < t.f1)) { const pts = t.pts(f, S); if (pts.length && pts[pts.length - 1][1] > GROUND - 40 && pts[0][1] > GROUND - 40) FX.yarnThread(ctx, pts, YC, 5); }
});
ST.hooks.afterChars.push((ctx, f, S, CAM) => {
  ctx.setTransform(...CAM);
  for (const t of THREADS) if (f >= t.f0 && (!t.f1 || f < t.f1)) { const pts = t.pts(f, S); if (pts.length && !(pts[pts.length - 1][1] > GROUND - 40 && pts[0][1] > GROUND - 40)) FX.yarnThread(ctx, pts, YC, 5); }
  for (const w of WRAP) {
    if (f < w.f0 || (w.f1 && f >= w.f1)) continue;
    const k = w.kf > w.f0 ? E.lerp(w.k0, w.k1, E.clamp((f - w.f0) / (w.kf - w.f0), 0, 1)) : w.k1;
    const big = S[w.who].p.form === 'big';
    let c;
    if (w.part === 'legs') c = [S[w.who].p.x, GROUND - 120];
    else c = target(`${w.who}:${w.part}`, S);
    const rot = E.rad(S[w.who].p.rot || 0);
    ctx.save(); ctx.translate(c[0], c[1] + w.dy); ctx.rotate(big ? 0 : rot);
    FX.yarnWrap(ctx, 0, 0, w.w * (big && w.part !== 'legs' ? 1 : 1), w.h, w.n, k, YC);
    ctx.restore();
  }
  const b = ballAt(f, S);
  if (b) FX.yarnBall(ctx, b.x, b.y, b.r, b.rot, YC, 3, YD);
  for (const s of SNAP) FX.blockBurst(ctx, s.at[0], s.at[1], (f - s.f) / 18, s.f, [YC, YD, '#9fd2ff'], 14, 18, 0.9, GROUND);
  for (const s of SPIN) {
    if (f < s.f0 || f >= s.f1) continue;
    const b = target(`${s.who}:body`, S);
    ctx.save(); ctx.lineCap = 'round'; ctx.lineWidth = 6; ctx.strokeStyle = 'rgba(255,255,255,0.85)';
    for (let i = 0; i < 3; i++) { const yy = b[1] - 120 + i * 140, a0 = (f - s.f0) * 0.8 + i; ctx.beginPath(); ctx.ellipse(b[0], yy, 200, 34, 0, a0, a0 + 2.2); ctx.stroke(); }
    ctx.restore();
  }
});

ST.start(BIG);
