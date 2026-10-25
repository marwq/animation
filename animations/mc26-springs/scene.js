// Ролик 26 (серия по образцу): Пружины — Малыш, Розовая и Толстый, 25 с, 24 кадра/с. Плотно, как у HugyTi:
// пружина-батут: прыжки по головам, Толстый-попрыгунчик, которого нельзя остановить.
// Музыка превращения — присланная, ~4 с с затиханием, только при первом превращении. Фон — тёмный лес.
//
//   0–1.8 с   шарик-Малыш, пружина, шарик-Розовая, шарик-Толстый
//   1.8–3.6 с Малыш прыгает на пружину — boing! — по головам Розовой и Толстого и вниз
//   3.7–4.9 с Розовая «растёт» под музыку — Малыш и Толстый влюблены
//   5–8.5 с   она бросает пружину Толстому под попу — Толстый-попрыгунчик скачет и садится на Малыша — лепёшка;
//             скачет дальше и не может остановиться
//   8–9.3 с   Малыш отлипает и «растёт»
//   9.5–11.8 с прижимает прыгающего Толстого к земле и отпускает — Толстого запускает Розовой на голову —
//             «пуф», она шарик
//   11.8–13 с Розовая «растёт» снова — Малыш опять влюблён
//   13–19 с   Малыш идёт к ней с объятиями — она бросает пружину ему под ноги — boing! — он улетает в небо;
//             щелчком отправляет Толстого кубарем за кадр
//   19–25 с   Розовая в центре, руки вверх
'use strict';

const ST = Stage({
  name: 'mc26-springs',
  cast: {
    baby: { small: ['child-verity-pink', { bodyHeight: 300, spin: { layer: 'hat', cut: 122, axis: 389 } }],
      big: ['child-verity-big', { height: 730, spin: { layer: 'hat', cut: 106, axis: 330 } }], pivot: 338, voice: 1.25,
      lie: 60, color: '#ffd9b8', moods: { angry: ' 2', grin: ' 2', big: 'theeth smile', love: ' 1' } },
    pink: { small: ['girl-verity-small', { bodyHeight: 300 }], big: ['girl-verity-big', { height: 730, splitFeet: true }],
      pivot: 337, voice: 1.35, vAngle: 50, color: '#ff4fc8', moods: { angry: 'angry theeth', grin: 'theeth smile', big: 'theeth smile' } },
    fat: { small: ['fat-verity-small', { bodyHeight: 450 }], pivot: 508, voice: 0.75, moods: { love: 'happy' } },
  },
  order: ['baby', 'pink', 'fat'],
  background: { theme: 'darkforest', seed: 261, sunX: 420, sunY: 140 },
  clouds: [[120, 80, 2.4, 0, 12], [700, 210, 1.8, 1, 16], [1250, 60, 2.6, 2, 10], [1700, 250, 1.6, 0, 18]],
});
const { FPS, NF, GROUND, C, key, move, ev, sfx, hop, tumble, laugh, tremble, transform, shrink, love, stance, walk, turn,
  flyOff, victory, chuckle, hand, toRig, statesAt, stateAt, target } = ST;

const P = (v, f, S) => (typeof v === 'function' ? v(f, S) : typeof v === 'string' ? target(v, S) : v);

// ------------------------------------------------------------------ пружина
const SW = 118, SL0 = 124;                            // ширина, длина в покое
const SPL = new E.Track();                          // L — длина пружины
const sl = (f, L, n = 2, ease = 'io') => SPL.add(f, { L }, ease, n);
sl(0, SL0, 0);
const SPR = [];                                     // {f0, at: [x]} | {f0, under: 'fat'} | {f0, hand, arm} | {f0, f1, a, b, arc, r0, r1}
function springAt(f, S) {
  let cur = null;
  for (const c of SPR) if (f >= c.f0) cur = c;
  if (!cur) return null;
  const L = SPL.sample(f, {}).L;
  if (cur.at) return { x: cur.at[0], y: GROUND + 4, L, rot: 0 };
  if (cur.under) { const p = S[cur.under].p; return { x: p.x, y: p.y + L, L, rot: 0 }; }
  if (cur.hand) { if (S[cur.hand].p.form !== 'big') return null; const h = C[cur.hand].big.point(S[cur.hand].st, 'hand' + (cur.arm || 'F')); return { x: h[0], y: h[1] + 50, L: SL0, rot: 0 }; }
  const u = E.clamp((f - cur.f0) / (cur.f1 - cur.f0), 0, 1), a = P(cur.a, cur.f0, statesAt(cur.f0)), b = P(cur.b, f, S);
  return { x: E.lerp(a[0], b[0], u), y: E.lerp(a[1], b[1], u) - Math.sin(Math.PI * u) * (cur.arc || 0), L: SL0, rot: E.lerp(cur.r0 || 0, cur.r1 || 0, u) };
}
// прыжок шарика по дуге: от a к b (опора), пик над выше из двух на h
function arc(who, f0, f1, a, b, h, o = {}) {
  move(who, f0, { x: a[0], y: a[1] });
  move(who, Math.round((f0 + f1) / 2), { x: (a[0] + b[0]) / 2, y: Math.min(a[1], b[1]) - h }, 'out2');
  move(who, f1, { x: b[0], y: b[1] }, 'in2');
  if (o.spin) { move(who, f0, { rot: 0 }); move(who, f1, { rot: o.spin }, 'lin'); key(who, f1 + 1, { rot: 0 }, 0); }
}
const squash = (who, f, k = 1) => { key(who, f, { sx: 1 + 0.28 * k, sy: 1 - 0.24 * k }, 1); key(who, f + 3, { sx: 1 - 0.08 * k, sy: 1 + 0.1 * k }, 3); key(who, f + 7, { sx: 1, sy: 1 }, 4); };
// Толстый-попрыгунчик: толчок в f0 из x0 (сжатая пружина), приземление в f1 на x1
function pogo(f0, f1, x0, x1, h) {
  sl(f0, 58, 2); sl(f0 + 3, 150, 3, 'out'); sl(f0 + 8, SL0, 4); sl(f1 - 1, SL0, 0); sl(f1, 58, 1);
  move('fat', f0, { x: x0, y: GROUND - 58 });
  move('fat', Math.round((f0 + f1) / 2), { x: (x0 + x1) / 2, y: GROUND - SL0 - h }, 'out2');
  move('fat', f1, { x: x1, y: GROUND - 58 }, 'in2');
  key('fat', f0, { sx: 1.16, sy: 0.88 }, 1); key('fat', f0 + 3, { sx: 0.9, sy: 1.12 }, 3); key('fat', f0 + 8, { sx: 1, sy: 1 }, 4);
  key('fat', f1, { sx: 1.16, sy: 0.88 }, 2);
  sfx('spring', f0, { who: 'fat', gain: 0.8 });
}

const BS = 420, SX0 = 700, PS = 1050, FS = 1450;
// ================================================================== 0–1.8 с: стойка
key('baby', 0, { form: 'small', x: BS, y: GROUND, face: 1, look: 1, eyes: 'normal', mouth: ' 6', sx: 1, sy: 1, rot: 0, pivot: 0, alpha: 1 }, 0);
key('pink', 0, { form: 'small', x: PS, y: GROUND, face: -1, look: 1, eyes: 'normal', mouth: 'smile normal', sx: 1, sy: 1, rot: 0, pivot: 0, alpha: 1 }, 0);
key('fat', 0, { form: 'small', x: FS, y: GROUND, face: -1, look: 1, eyes: 'normal', mouth: 'smile normal', sx: 1, sy: 1, rot: 0, pivot: 0, mouthK: 1 }, 0);
SPR.push({ f0: 0, at: [SX0] });

const BIG = () => {
  // ---- 1.8–3.6 с: Малыш на пружину — по головам Розовой и Толстого
  key('baby', 36, { eyes: 'angry', mouth: ' 2' }, 0);
  sfx('ref:grin-eee', 36, { who: 'baby', gain: 0.45, pitch: 1.3 });
  const ON = 48;
  key('baby', 38, { sx: 1.2, sy: 0.82 }, 2); key('baby', 40, { sx: 0.88, sy: 1.14 }, 2);
  arc('baby', 40, ON, [BS, GROUND], [SX0, GROUND - SL0], 120);
  sfx('jump', 40, { who: 'baby', gain: 0.5 });
  sl(ON, 52, 2); sl(ON + 3, 150, 3, 'out'); sl(ON + 8, SL0, 4);
  move('baby', ON + 1, { y: GROUND - 52 }, 'in2');
  squash('baby', ON, 1);
  sfx('spring', ON + 2, { x: SX0, gain: 1.0 });
  const pt = (who, f) => [target(`${who}:top`, stateAt(f))[0], target(`${who}:top`, stateAt(f))[1] + 4];
  const H1 = ON + 12, H2 = H1 + 12, DOWN = H2 + 14, BX0 = 1680;
  arc('baby', ON + 3, H1, [SX0, GROUND - 52], pt('pink', H1), 260, { spin: 360 });
  squash('pink', H1, 1); squash('baby', H1, 0.7);
  sfx('bonk', H1, { who: 'pink', gain: 0.8 }); sfx('boing', H1 + 1, { who: 'pink', gain: 0.6 });
  key('pink', H1, { mouth: 'puzzlement', eyes: 'sad' }, 0);
  arc('baby', H1 + 1, H2, pt('pink', H1), pt('fat', H2), 200, { spin: 360 });
  squash('fat', H2, 1); squash('baby', H2, 0.7);
  sfx('bonk', H2, { who: 'fat', gain: 0.8 }); sfx('boing', H2 + 1, { who: 'fat', gain: 0.6 });
  key('fat', H2, { mouth: 'puzzlement', eyes: 'sad' }, 0);
  arc('baby', H2 + 1, DOWN, pt('fat', H2), [BX0, GROUND], 160, { spin: 360 });
  squash('baby', DOWN, 1);
  sfx('land', DOWN, { who: 'baby', gain: 0.6 });
  key('baby', DOWN + 2, { mouth: ' 1', eyes: 'normal', face: -1 }, 0);
  sfx('ref:laugh', DOWN + 3, { who: 'baby', gain: 0.85, pitch: 1.3 });
  laugh('baby', DOWN + 4, DOWN + 18);
  ev('stars', { who: 'pink', f0: H1 + 2, f1: H1 + 26, snd: false });
  ev('stars', { who: 'fat', f0: H2 + 2, f1: H2 + 26, snd: false });

  // ---- 3.7–4.9 с: Розовая «растёт» — Малыш и Толстый влюблены
  const PX = 1000;
  key('pink', DOWN - 2, { mouth: 'angry theeth', eyes: 'angry' }, 0);
  const PB = transform('pink', DOWN, PS, PX, -1, { style: 'grow', love: ['baby', 'fat'], loveDur: 50 });
  key('pink', PB, stance('pink', PX, -1), 0);
  key('pink', PB + 6, { mouth: 'theeth smile', eyes: 'normal' }, 0);

  // ---- 5–8.5 с: пружину — Толстому под попу; Толстый-попрыгунчик садится на Малыша
  const K = C.pink.big, PK = PB + 10;
  key('pink', PK - 8, { lean: 22, hip: [0, toRig('pink', 110)], head: 8 }, 8);
  key('pink', PK, { hitB: 1, hitBto: [SX0, GROUND - SL0 * 0.6], hitBfix: PK }, 6);
  SPR.push({ f0: PK, hand: 'pink', arm: 'B' });
  sfx('pop', PK, { who: 'pink', gain: 0.5 });
  key('pink', PK + 10, { ...stance('pink', PX, -1), hitB: 0, handB: hand('pink', 'B', 0.3, -0.5), mouth: 'happy with theeth', eyes: 'angry' }, 8);
  turn('pink', PK + 12, 1, PX);
  const TH = PK + 20, UNDER = TH + 12;
  key('pink', TH - 4, { handB: hand('pink', 'B', -0.5, -0.6) }, 4);
  key('pink', TH, { handB: hand('pink', 'B', 0.95, 0.1), lean: 10 }, 4, 'in2');
  key('pink', TH + 10, { ...stance('pink', PX, 1), mouth: 'happy with theeth', eyes: 'normal' }, 8);
  sfx('swing', TH - 3, { who: 'pink', gain: 0.8 });
  SPR.push({ f0: TH, f1: UNDER, a: (f, S) => { const h = K.point(S.pink.st, 'handB'); return [h[0], h[1] + 50]; }, b: [FS, GROUND + 4], arc: 120, r0: 0, r1: Math.PI * 2 });
  // Толстый подпрыгнул от неожиданности — и сел на пружину
  key('fat', UNDER - 6, { sx: 1.2, sy: 0.84, mouth: 'puzzlement', eyes: 'sad' }, 2);
  move('fat', UNDER - 4, { x: FS, y: GROUND });
  move('fat', UNDER + 2, { y: GROUND - 260 }, 'out2');
  move('fat', UNDER + 8, { y: GROUND - 58 }, 'in2');
  key('fat', UNDER - 2, { sx: 0.9, sy: 1.12 }, 2);
  sfx('scared', UNDER - 4, { who: 'fat', gain: 0.7, pitch: 0.8 });
  SPR.push({ f0: UNDER, at: [FS] });
  SPR.push({ f0: UNDER + 7, under: 'fat' });
  sl(UNDER + 6, SL0, 0); sl(UNDER + 8, 58, 2);
  // скачет вправо — садится на Малыша
  const P0 = UNDER + 8, SIT = P0 + 14;
  const bt = target('baby:top', stateAt(1))[1] - GROUND;
  pogo(P0, SIT, FS, BX0, 160);
  move('fat', SIT, { x: BX0, y: GROUND + bt * 0.45 - SL0 }, 'in2');
  key('baby', SIT, { sx: 1.45, sy: 0.5, mouth: ' 5', eyes: 'sad' }, 1);
  sfx('squish', SIT, { who: 'baby', gain: 0.9 });
  sfx('ref:hit-ow', SIT + 2, { who: 'baby', gain: 0.8, pitch: 1.3 });
  ev('shake', { f: SIT, amp: 10, n: 6 });
  // и дальше — назад, прыг-скок на месте, не остановиться
  const FX2 = 1400;
  let t = SIT + 4, x = BX0;
  const hops = [[FX2, 140], [FX2 - 60, 120], [FX2 + 40, 130], [FX2 - 40, 120], [FX2, 140], [FX2 - 20, 120]];
  const FHOP = [];
  for (const [nx, h] of hops) { pogo(t, t + 14, x, nx, h); FHOP.push(t); x = nx; t += 14; }
  key('fat', SIT + 6, { mouth: 'puzzlement', eyes: 'sad' }, 0);
  for (let i = 0; i < 3; i++) sfx('scared', SIT + 8 + i * 28, { who: 'fat', gain: 0.5, pitch: 0.8 });
  key('pink', SIT + 2, { mouth: 'happy with theeth' }, 0);
  sfx('ref:laugh', SIT + 4, { who: 'pink', gain: 0.85, pitch: 1.35 });
  chuckle('pink', SIT + 4, SIT + 24, { mouth: 'happy with theeth' });

  // ---- 8–9.3 с: Малыш отлипает и «растёт»
  key('baby', SIT + 8, { sx: 1.1, sy: 0.9 }, 4, 'out');
  key('baby', SIT + 12, { sx: 1, sy: 1, mouth: ' 2', eyes: 'angry' }, 3);
  sfx('boing', SIT + 8, { who: 'baby', gain: 0.6 });
  const BX = 1720, BB = transform('baby', SIT + 14, BX0, BX, -1, { style: 'grow' });
  key('baby', BB, stance('baby', BX, -1), 0);
  key('baby', BB + 6, { mouth: 'happy with theeth', eyes: 'angry' }, 0);

  // ---- 9.5–11.8 с: прижимает прыгающего Толстого — отпускает — Толстый Розовой на голову
  const KB = C.baby.big, BX1 = 1660;
  walk('baby', BB + 4, BX, BX1, 1, 9, -1);
  // поймать в момент приземления: продолжить прыжки до нажима
  const PR = t;                                              // последний прыжок кончился в t
  sl(PR, 58, 1);
  key('baby', PR - 6, { lean: 18, hip: [0, toRig('baby', 70)], handF: hand('baby', 'F', 0.9, -0.1) }, 6);
  key('baby', PR, { hitF: 1, hitFto: (() => { const p = target('fat:top', stateAt(PR)); return [p[0], p[1] + 10]; })(), hitFfix: PR }, 3);
  move('fat', PR, { x, y: GROUND - 58 });
  move('fat', PR + 8, { y: GROUND - 32 }, 'in');
  sl(PR + 8, 32, 8, 'in');
  key('fat', PR + 8, { sx: 1.25, sy: 0.8 }, 8);
  key('baby', PR + 8, { hip: [0, toRig('baby', 110)], lean: 24 }, 8);
  sfx('creak', PR, { who: 'fat', dur: 8, gain: 0.6 });
  const REL = PR + 10, HIT = REL + 16;
  key('baby', REL, { hitF: 0, handF: hand('baby', 'F', 0.6, -0.8), lean: -6, hip: [0, 8], mouth: 'happy with theeth' }, 3);
  key('baby', REL + 10, { ...stance('baby', BX1, -1), mouth: 'happy with theeth', eyes: 'normal' }, 8);
  sl(REL, 32, 0); sl(REL + 3, 170, 3, 'out'); sl(REL + 10, SL0, 6);
  sfx('spring', REL, { who: 'fat', gain: 1.1 });
  sfx('whoosh', REL + 1, { who: 'fat', dur: 14, gain: 0.7 });
  const ptop = (f, S) => { const p = target('pink:face', S); return [p[0] + 200, p[1] + 230]; };   // в лицо
  move('fat', REL, { x, y: GROUND - 32 });
  move('fat', REL + 8, { x: (x + PX) / 2 + 100, y: 330 }, 'out2');
  move('fat', HIT, { x: ptop(HIT, stateAt(HIT))[0], y: ptop(HIT, stateAt(HIT))[1] }, 'in2');
  move('fat', REL, { rot: 0 }); key('fat', REL, { pivot: 225 }, 0);
  move('fat', HIT, { rot: -360 }, 'lin'); key('fat', HIT + 1, { rot: 0, pivot: 0 }, 0);
  sfx('bonk', HIT, { who: 'pink', gain: 1.0 });
  sfx('slam', HIT, { who: 'pink', gain: 0.6 });
  ev('shake', { f: HIT, amp: 12, n: 8 });
  key('pink', HIT, { mouth: 'puzzlement', eyes: 'sad', head: -14, lean: -8 }, 1);
  const sm = shrink('pink', HIT + 2, PX, 1, { mouth: 'puzzlement', eyes: 'sad', smoke: 400 });
  key('pink', sm, { lean: 0, head: 0, hip: [0, 0] }, 0);
  ev('stars', { who: 'pink', f0: sm + 2, f1: sm + 26, snd: false });
  // Толстый отскакивает с её головы и приземляется слева, пружина под ним — затихает
  const FL = HIT + 14, FX3 = 640;
  move('fat', HIT + 2, { x: ptop(HIT, stateAt(HIT))[0], y: ptop(HIT, stateAt(HIT))[1] });
  move('fat', HIT + 8, { x: (PX + FX3) / 2, y: 380 }, 'out2');
  move('fat', FL, { x: FX3, y: GROUND - 58 }, 'in2');
  sl(FL, 58, 2);
  sfx('spring', FL, { who: 'fat', gain: 0.6 });
  pogo(FL, FL + 10, FX3, FX3, 60);
  pogo(FL + 10, FL + 18, FX3, FX3, 25);
  sl(FL + 20, SL0, 3);
  move('fat', FL + 20, { x: FX3, y: GROUND - SL0 });
  key('fat', FL + 20, { sx: 1, sy: 1, mouth: 'puzzlement', eyes: 'sad' }, 3);
  ev('stars', { who: 'fat', f0: FL + 18, f1: FL + 44, snd: false });
  sfx('ref:laugh', HIT + 6, { who: 'baby', gain: 0.85, pitch: 1.25 });
  chuckle('baby', HIT + 6, HIT + 26, { mouth: 'happy with theeth' });

  // ---- 11.8–13 с: Розовая «растёт» снова — Малыш влюблён
  key('pink', sm + 6, { eyes: 'angry', mouth: 'angry theeth' }, 0);
  ev('vein', { who: 'pink', f0: sm + 6, f1: sm + 16 });
  const PB2 = transform('pink', sm + 8, PX, PX, 1, { style: 'grow', love: 'baby', loveDur: 50 });
  key('pink', PB2, stance('pink', PX, 1), 0);
  key('pink', PB2 + 6, { mouth: 'happy with theeth', eyes: 'angry' }, 0);

  // ---- 13–19 с: Малыш идёт обниматься — пружина под ноги — улетает; Толстого щелчком за кадр
  const WK = PB2 + 8, BX2 = 1260;
  walk('baby', WK, BX1, BX2, 4, 9, -1);
  key('baby', WK, { handF: hand('baby', 'F', 0.85, -0.45), handB: hand('baby', 'B', 0.75, -0.5), mouth: 'happy - spittle', lean: 6 }, 6);
  // пружина из-под Толстого
  turn('pink', PB2 + 4, -1, PX);
  const GP = PB2 + 12;
  key('pink', GP - 8, { lean: 22, hip: [0, toRig('pink', 100)], head: 8 }, 8);
  key('pink', GP, { hitB: 1, hitBto: [FX3 + 40, GROUND - 60], hitBfix: GP }, 6);
  SPR.push({ f0: GP, hand: 'pink', arm: 'B' });
  sfx('pop', GP, { who: 'pink', gain: 0.5 });
  move('fat', GP, { x: FX3, y: GROUND - SL0 });
  move('fat', GP + 6, { y: GROUND }, 'in2');
  key('fat', GP + 6, { sx: 1.2, sy: 0.84 }, 1); key('fat', GP + 10, { sx: 1, sy: 1 }, 3);
  sfx('land', GP + 6, { who: 'fat', gain: 0.6 });
  key('pink', GP + 10, { ...stance('pink', PX, -1), hitB: 0, handB: hand('pink', 'B', 0.2, -0.5) }, 8);
  turn('pink', GP + 14, 1, PX);
  // бросок под ноги Малышу (он как раз шагает сюда)
  const TH2 = GP + 22, STEP = WK + 36, SP2 = [BX2 - 40, GROUND + 4];
  key('pink', TH2 - 4, { handB: hand('pink', 'B', -0.5, -0.6) }, 4);
  key('pink', TH2, { handB: hand('pink', 'B', 0.95, 0.2), lean: 10, mouth: 'happy with theeth', eyes: 'normal' }, 4, 'in2');
  key('pink', TH2 + 10, { ...stance('pink', PX, 1) }, 8);
  sfx('swing', TH2 - 3, { who: 'pink', gain: 0.8 });
  SPR.push({ f0: TH2, f1: TH2 + 10, a: (f, S) => { const h = K.point(S.pink.st, 'handB'); return [h[0], h[1] + 50]; }, b: SP2, arc: 80, r0: 0, r1: Math.PI * 2 });
  SPR.push({ f0: TH2 + 10, at: [SP2[0]] });
  const BOING = Math.max(STEP + 2, TH2 + 14);
  sl(BOING, 52, 3); sl(BOING + 4, 170, 3, 'out'); sl(BOING + 12, SL0, 6);
  sfx('spring', BOING + 2, { who: 'baby', gain: 1.2 });
  key('baby', BOING, { mouth: 'puzzlement', eyes: 'sad' }, 0);
  flyOff('baby', BOING + 3, BOING + 26, [BX2, GROUND], [2300, -400], { turns: 3 });
  ev('twinkle', { f: BOING + 24, at: [1820, 110], n: 22, size: 60 });
  key('pink', BOING + 4, { mouth: 'happy with theeth', eyes: 'normal' }, 0);
  sfx('ref:laugh', BOING + 6, { who: 'pink', gain: 0.85, pitch: 1.35 });
  chuckle('pink', BOING + 6, BOING + 22, { mouth: 'happy with theeth' });
  // щелчок — Толстый кубарем за кадр
  turn('pink', BOING + 22, -1, PX);
  const FLK = BOING + 32;
  walk('pink', BOING + 24, PX, 880, 1, 8, -1);
  key('pink', FLK - 4, { handF: hand('pink', 'F', 0.95, -0.05), lean: 10 }, 4);
  key('pink', FLK + 6, { ...stance('pink', 880, -1), lean: 0 }, 6);
  sfx('flick', FLK, { who: 'fat', gain: 1.1 });
  key('fat', FLK, { mouth: 'puzzlement', eyes: 'sad' }, 0);
  tumble('fat', FLK, FLK + 18, FX3, -400, 160, -3, {});
  const WIN = victory('pink', FLK + 12, 880, { n: 6, stride: 90 });
  window.T = { ON, H1, H2, PB, UNDER, SIT, BB, PR, HIT, PB2, BOING, FLK, WIN };
};

ST.hooks.beforeChars.push((ctx, f, S, CAM) => {
  ctx.setTransform(...CAM);
  const s = springAt(f, S);
  if (s && !SPR.filter((c) => f >= c.f0).pop().hand && !SPR.filter((c) => f >= c.f0).pop().f1) FX.coilSpring(ctx, s.x, s.y, s.L, SW, s.rot);
});
ST.hooks.afterChars.push((ctx, f, S, CAM) => {
  ctx.setTransform(...CAM);
  const cur = SPR.filter((c) => f >= c.f0).pop(), s = springAt(f, S);
  if (s && (cur.hand || cur.f1)) {
    ctx.save(); ctx.translate(s.x, s.y); ctx.rotate(s.rot); FX.coilSpring(ctx, 0, s.L / 2, s.L, SW, 0); ctx.restore();
  }
});

ST.start(BIG);
