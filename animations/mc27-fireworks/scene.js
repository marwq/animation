// Ролик 27 (серия по образцу): Фейерверк — Скелет, Лорд и Малыш, 25 с, 24 кадра/с. Плотно, как у HugyTi:
// ракеты-шутихи цепляются, разворачиваются ветром, салют с персонажем внутри, сажа на лицах.
// Музыка превращения — присланная, ~4 с с затиханием, только при первом превращении. Фон — луг.
//
//   0–1.8 с   шарик-Скелет, шарик-Малыш, шарик-Лорд; у Лорда за спиной три ракеты
//   1.8–3.9 с Малыш на пропеллере с горящей ракетой во рту — плюёт ею в Лорда: ракета втыкается в шляпу и
//             уносит Лорда в небо — салют! Лорд падает в саже
//   4–5.2 с   Лорд «растёт» под музыку и тяжело дышит
//   5.4–8.4 с поджигает ракету и запускает в Малыша — тот подпрыгивает на пропеллере, ракета мимо — в Скелета:
//             салют, Скелет в саже, кувырком
//   8.4–9.7 с Скелет «растёт»
//   9.8–13 с  Лорд целится второй ракетой — Скелет машет крыльями: ракета в руке разворачивается и взрывается
//             у Лорда в руках — сажа, шляпа взлетает, «пуф» — Лорд снова шарик
//   13.2–14.5 с Малыш «растёт»
//   14.6–19 с  Малыш с последней ракетой целится в Скелета — взмах крыльев — ракета уходит в шарика-Лорда и
//             уносит его в небо — большой салют; Малыш улетает на пропеллере
//   19–25 с   Скелет в центре, руки и крылья вверх, в небе салюты
'use strict';

const ST = Stage({
  name: 'mc27-fireworks',
  cast: {
    skel: { small: ['skeleton-verity-small', { scale: 0.455 }], big: ['skeleton-verity-big', { height: 730 }], pivot: 325,
      voice: 0.9, lie: 60, color: '#f3f1e6', moods: { angry: 'angry theeth', grin: 'happy with theeth', big: 'theeth smile' } },
    baby: { small: ['child-verity-pink', { bodyHeight: 300, spin: { layer: 'hat', cut: 122, axis: 389 } }],
      big: ['child-verity-big', { height: 730, spin: { layer: 'hat', cut: 106, axis: 330 } }], pivot: 338, voice: 1.25,
      lie: 60, color: '#ffd9b8', moods: { angry: ' 2', grin: ' 2', big: 'theeth smile', love: ' 1' } },
    lord: { small: ['lord-verity-small', { bodyHeight: 300 }], big: ['lord-verity-big', { height: 730 }], pivot: 337,
      voice: 1.0, lie: 55, color: '#ffe23a', ouch: ['ref:hit-ow', 1.0, 0.9] },
  },
  order: ['skel', 'baby', 'lord'],
  background: { theme: 'meadow', seed: 271, sunX: 1520, sunY: 120 },
  clouds: [[120, 80, 2.4, 0, 12], [640, 210, 1.8, 1, 16], [1100, 60, 2.6, 2, 10], [420, 300, 1.4, 1, 14]],
});
const { FPS, NF, GROUND, C, key, move, ev, sfx, hop, tumble, laugh, tremble, transform, shrink, stance, walk, turn,
  flyOff, victory, chuckle, hand, toRig, statesAt, stateAt, target } = ST;

ST.parts.mouth = (ch, st) => E.apply(ch.eyeMatrix(st, ' 2'), [315, 740]);     // рот шарика-Малыша
const P = (v, f, S) => (typeof v === 'function' ? v(f, S) : typeof v === 'string' ? target(v, S) : v);
function propeller(who, f0, f1, rps = 7, o = {}) {
  key(who, f0, { spin: 0, spinBlur: 0 }, 0);
  key(who, f0 + 8, { spinBlur: 1 }, 8);
  move(who, f1, { spin: rps * (f1 - f0) / 24 }, 'lin');
  key(who, f1, { spinBlur: 0 }, 6);
  key(who, f1 + 1, { spin: 0 }, 0);
  if (o.snd !== false) sfx('whirr', f0, { who, dur: f1 - f0, gain: o.gain ?? 0.4 });
}
function flap(f0, f1, gain = 0.6) {
  for (let f = f0; f < f1; f += 6) { key('skel', f, { b_B16: -30, b_B17: 30 }, 3); key('skel', f + 3, { b_B16: 46, b_B17: -46 }, 3, 'in'); }
  key('skel', f1, { b_B16: 0, b_B17: 0 }, 4);
  sfx('gust', f0, { who: 'skel', dur: f1 - f0, gain });
}

// ------------------------------------------------------------------ ракеты, салюты, сажа
const RS = 92;
const ROCKETS = [];                                // {col, segs: [...], lit: [[f0, f1]], fly: [[f0, f1]]}
const rocketAt = (R, f, S) => {
  let cur = null;
  for (const c of R.segs) if (f >= c.f0) cur = c;
  if (!cur || cur.gone) return null;
  if (cur.at) return { x: cur.at[0], y: cur.at[1], rot: cur.rot || 0 };
  if (cur.mouth) { const m = target(`${cur.mouth}:mouth`, S); return { x: m[0] + 30, y: m[1] + 4, rot: cur.rot ?? Math.PI / 2 }; }
  if (cur.hand) {
    if (S[cur.hand].p.form !== 'big') return null;
    const h = C[cur.hand].big.point(S[cur.hand].st, 'hand' + (cur.arm || 'F')), r = typeof cur.rot === 'function' ? cur.rot(f) : cur.rot || 0;
    return { x: h[0] - Math.sin(r) * RS * 0.3, y: h[1] + Math.cos(r) * RS * 0.3, rot: r };
  }
  if (cur.stick) { const t = target(`${cur.stick}:top`, S); return { x: t[0] - 6, y: t[1] + 40, rot: cur.rot || 0 }; }
  // полёт по дуге: a -> b, нос по касательной
  const u = E.clamp((f - cur.f0) / (cur.f1 - cur.f0), 0, 1), a = P(cur.a, cur.f0, statesAt(cur.f0)), b = P(cur.b, f, S);
  const pos = (v) => [E.lerp(a[0], b[0], v), E.lerp(a[1], b[1], v) - Math.sin(Math.PI * v) * (cur.arc || 0)];
  const p = pos(u), q = pos(Math.min(1, u + 0.02)), r0 = pos(Math.max(0, u - 0.02));
  return { x: p[0], y: p[1], rot: Math.atan2(q[0] - r0[0], -(q[1] - r0[1])) };
};
const BOOMS = [];                                  // {f, at, size, cols, seed}
const SOOT = [];                                   // {who, f0, f1}
const SKYBOOMS = [];
function boom(f, at, size = 300, cols, seed = 1) {
  BOOMS.push({ f, at, size, cols: cols || ['#ff3a6a', '#ffe14d', '#3ad1ff', '#7aff5a'], seed });
  sfx('explode', f, { at: typeof at === 'string' ? undefined : at, who: typeof at === 'string' ? at.split(':')[0] : undefined, gain: 0.55 });
  sfx('sparkle', f + 3, { x: 960, gain: 0.6 });
  ev('flash', { f, at: typeof at === 'string' ? undefined : at, who: typeof at === 'string' ? at.split(':')[0] : undefined, strength: 0.4 });
  ev('shake', { f, amp: 14, n: 10 });
}
const ignite = (R, f0, f1) => { R.lit.push([f0, f1]); sfx('fuse', f0, { x: 960, dur: f1 - f0, gain: 0.5 }); };
const launch = (R, f0, f1) => { R.fly.push([f0, f1]); sfx('whoosh', f0, { x: 960, dur: f1 - f0, gain: 0.7 }); sfx('slide', f0, { x: 960, gain: 0.5, pitch: 1.4 }); };

const SS = 420, BS = 880, LS = 1360;
// ================================================================== 0–1.8 с: стойка
key('skel', 0, { form: 'small', x: SS, y: GROUND, face: 1, look: 1, eyes: 'normal', mouth: 'smile normal', sx: 1, sy: 1, rot: 0, pivot: 0, alpha: 1 }, 0);
key('baby', 0, { form: 'small', x: BS, y: GROUND, face: 1, look: 1, eyes: 'normal', mouth: ' 6', sx: 1, sy: 1, rot: 0, pivot: 0, alpha: 1 }, 0);
key('lord', 0, { form: 'small', x: LS, y: GROUND, face: -1, look: 1, eyes: 'normal', mouth: 'smile normal', sx: 1, sy: 1, rot: 0, pivot: 0, alpha: 1 }, 0);
const STAND = [[1640, '#e8262e'], [1700, '#2a8cff'], [1760, '#2ed14a'], [1820, '#b04dff']];
for (const [x, col] of STAND) ROCKETS.push({ col, segs: [{ f0: 0, at: [x, GROUND + 4], rot: 0 }], lit: [], fly: [] });
const R0 = { col: '#ff8a00', segs: [{ f0: 0, mouth: 'baby' }], lit: [], fly: [] };
ROCKETS.push(R0);

const BIG = () => {
  // ---- 1.8–3.9 с: Малыш плюёт ракетой — она в шляпе Лорда — уносит в небо — салют
  key('baby', 36, { eyes: 'angry', mouth: ' 2' }, 0);
  sfx('ref:grin-eee', 36, { who: 'baby', gain: 0.45, pitch: 1.3 });
  ignite(R0, 38, 60);
  propeller('baby', 38, 96, 9);
  move('baby', 42, { x: BS, y: GROUND });
  move('baby', 52, { x: 1000, y: GROUND - 380 }, 'out2');
  const SP = 54, STICK = SP + 8;
  key('baby', SP, { sx: 1.12, sy: 0.92 }, 1); key('baby', SP + 4, { sx: 1, sy: 1 }, 3);
  sfx('spit', SP, { who: 'baby', gain: 0.8 });
  R0.segs.push({ f0: SP, f1: STICK, a: (f, S) => { const m = target('baby:mouth', S); return [m[0] + 30, m[1] + 4]; }, b: (f, S) => { const t = target('lord:top', S); return [t[0] - 6, t[1] + 40]; }, arc: 60 });
  R0.segs.push({ f0: STICK, stick: 'lord', rot: 0 });
  sfx('pop', STICK, { who: 'lord', gain: 0.7 });
  key('lord', STICK, { mouth: 'puzzlement', eyes: 'sad', sx: 0.9, sy: 1.1 }, 1);
  launch(R0, STICK + 4, STICK + 26);
  const UP = STICK + 3, TOP = UP + 18;
  move('lord', UP, { x: LS, y: GROUND });
  move('lord', TOP, { x: LS - 120, y: 300 }, 'in');
  key('lord', UP, { pivot: 150 }, 0);
  for (let f = UP; f < TOP; f += 4) key('lord', f + 2, { rot: (f / 4) % 2 ? 10 : -10 }, 2);
  sfx('scared', UP + 2, { who: 'lord', gain: 0.8 });
  R0.segs.push({ f0: TOP, gone: true });
  boom(TOP, [LS - 120, 180], 320, ['#ff8a00', '#ffe14d', '#ff3a6a'], 3);
  SOOT.push({ who: 'lord', f0: TOP, f1: 0 });
  const LAND = TOP + 14;
  move('lord', TOP, { x: LS - 120, y: 300, rot: 0 });
  move('lord', LAND, { x: LS - 80, y: GROUND }, 'in2');
  move('lord', LAND, { rot: 360 }, 'lin');
  key('lord', LAND + 1, { rot: 0 }, 0);
  key('lord', LAND, { sx: 1.3, sy: 0.75 }, 1); key('lord', LAND + 6, { sx: 1, sy: 1 }, 5);
  sfx('fall', LAND, { who: 'lord', gain: 0.8 });
  ev('stars', { who: 'lord', f0: LAND + 2, f1: LAND + 26, snd: false });
  sfx('ref:hit-ow', LAND + 2, { who: 'lord', gain: 0.8 });
  move('baby', 66, { x: 1000, y: GROUND - 380 });
  move('baby', 84, { x: BS, y: GROUND }, 'io');
  key('baby', 84, { sx: 1.2, sy: 0.82, mouth: ' 1', eyes: 'normal' }, 1); key('baby', 88, { sx: 1, sy: 1 }, 3);
  sfx('land', 84, { who: 'baby', gain: 0.5 });
  sfx('ref:laugh', TOP + 4, { who: 'baby', gain: 0.85, pitch: 1.3 });
  laugh('baby', 86, 102);
  key('skel', TOP + 2, { mouth: 'happy with theeth' }, 0);
  laugh('skel', TOP + 4, TOP + 20);

  // ---- 4–5.2 с: Лорд «растёт» и дышит
  const L1 = LS - 80, LX = 1300;
  key('lord', LAND + 4, { eyes: 'angry', mouth: 'angry theeth' }, 0);
  const LB = transform('lord', LAND + 6, L1, LX, -1, { style: 'grow' });
  SOOT[0].f1 = LB;
  key('lord', LB, stance('lord', LX, -1), 0);
  key('lord', LB + 4, { mouth: 'angry theeth', eyes: 'angry' }, 0);
  sfx('ref:lord-breath', LB + 4, { who: 'lord', gain: 1.8, dur: 14, fade: 0.15 });
  key('lord', LB + 7, { lean: -12, head: -10, hip: [0, toRig('lord', 4)] }, 3);
  key('lord', LB + 15, { lean: 0, head: 0, hip: [0, toRig('lord', 8)] }, 8);
  key('baby', LB - 2, { mouth: ' 5', eyes: 'sad' }, 0);

  // ---- 5.4–8.4 с: ракета в Малыша — тот прыгает — ракета в Скелета: салют
  const K = C.lord.big, R1 = ROCKETS[0], PK = LB + 12;
  turn('lord', PK - 10, 1, LX);
  key('lord', PK - 6, { lean: 20, hip: [0, toRig('lord', 90)], head: 6 }, 6);
  key('lord', PK, { hitF: 1, hitFto: [STAND[0][0], GROUND - 40], hitFfix: PK }, 6);
  R1.segs.push({ f0: PK, hand: 'lord', arm: 'F', rot: 0 });
  sfx('pop', PK, { who: 'lord', gain: 0.5 });
  turn('lord', PK + 8, -1, LX);
  key('lord', PK + 10, { ...stance('lord', LX, -1), hitF: 0, handF: hand('lord', 'F', 0.75, -0.45), mouth: 'happy with theeth', eyes: 'angry' }, 6);
  const LIT = PK + 12, GO = LIT + 10, HITS = GO + 20;
  sfx('flick', LIT, { who: 'lord', gain: 0.8 });
  ignite(R1, LIT, GO);
  R1.segs.push({ f0: LIT, hand: 'lord', arm: 'F', rot: -Math.PI / 2 });
  launch(R1, GO, HITS);
  const sb = (f, S) => target('skel:body', S);
  R1.segs.push({ f0: GO, f1: HITS, a: (f, S) => { const h = K.point(S.lord.st, 'handF'); return [h[0], h[1]]; }, b: sb, arc: -30 });
  key('lord', GO + 2, { handF: hand('lord', 'F', 0.5, -0.3) }, 4);
  // Малыш подпрыгивает на пропеллере — ракета проходит под ним
  propeller('baby', GO - 4, GO + 24, 10);
  move('baby', GO - 2, { x: BS, y: GROUND });
  move('baby', GO + 8, { y: GROUND - 300 }, 'out2');
  move('baby', GO + 22, { y: GROUND }, 'in2');
  key('baby', GO + 22, { sx: 1.2, sy: 0.82 }, 1); key('baby', GO + 26, { sx: 1, sy: 1 }, 3);
  key('baby', GO + 10, { mouth: ' 1', eyes: 'normal' }, 0);
  key('skel', GO + 10, { mouth: 'puzzlement', eyes: 'sad' }, 0);
  sfx('scared', GO + 12, { who: 'skel', gain: 0.8 });
  R1.segs.push({ f0: HITS, gone: true });
  boom(HITS, 'skel:body', 280, ['#e8262e', '#ffffff', '#ffe14d'], 5);
  SOOT.push({ who: 'skel', f0: HITS, f1: 0 });
  tumble('skel', HITS, HITS + 14, SS, 320, 120, -1, { stars: 20 });
  key('skel', HITS, { mouth: 'puzzlement', eyes: 'sad' }, 0);
  key('lord', HITS + 2, { mouth: 'happy with theeth', eyes: 'normal' }, 0);
  sfx('ref:laugh', HITS + 4, { who: 'lord', gain: 0.85, pitch: 0.95 });
  chuckle('lord', HITS + 4, HITS + 24, { mouth: 'happy with theeth' });

  // ---- 8.4–9.7 с: Скелет «растёт»
  const SX = 470;
  key('skel', HITS + 16, { eyes: 'angry', mouth: 'angry theeth' }, 0);
  ev('vein', { who: 'skel', f0: HITS + 16, f1: HITS + 26 });
  const SB = transform('skel', HITS + 18, 320, SX, 1, { style: 'grow' });
  SOOT[1].f1 = SB;
  key('skel', SB, stance('skel', SX, 1), 0);
  key('skel', SB + 6, { mouth: 'happy with theeth', eyes: 'angry' }, 0);
  key('lord', SB - 2, { mouth: 'puzzlement', eyes: 'sad' }, 0);

  // ---- 9.8–13 с: Лорд целится второй ракетой — крылья — ракета разворачивается у него в руках — бум
  const R2 = ROCKETS[1], PK2 = SB + 6;
  turn('lord', PK2 - 10, 1, LX);
  key('lord', PK2 - 6, { lean: 20, hip: [0, toRig('lord', 90)], head: 6 }, 6);
  key('lord', PK2, { hitF: 1, hitFto: [STAND[1][0], GROUND - 40], hitFfix: PK2 }, 6);
  R2.segs.push({ f0: PK2, hand: 'lord', arm: 'F', rot: 0 });
  sfx('pop', PK2, { who: 'lord', gain: 0.5 });
  turn('lord', PK2 + 8, -1, LX);
  key('lord', PK2 + 10, { ...stance('lord', LX, -1), hitF: 0, handF: hand('lord', 'F', 0.75, -0.45), mouth: 'angry theeth', eyes: 'angry' }, 6);
  const LIT2 = PK2 + 12;
  sfx('flick', LIT2, { who: 'lord', gain: 0.8 });
  ignite(R2, LIT2, LIT2 + 30);
  const W0 = LIT2 + 4, W1 = W0 + 22, SPIN = [W0 + 6, W0 + 18];
  R2.segs.push({ f0: LIT2, hand: 'lord', arm: 'F', rot: (f) => -Math.PI / 2 + Math.PI * E.EASE.io(E.clamp((f - SPIN[0]) / (SPIN[1] - SPIN[0]), 0, 1)) * 1 });
  flap(W0, W1, 0.9);
  key('skel', W0, { lean: 8, mouth: 'happy open mouth' }, 4);
  key('skel', W1 + 2, { lean: 0, mouth: 'happy with theeth' }, 6);
  ev('wind', { f0: W0 + 2, f1: W1 + 2, x0: SX + 260, x1: 1800, snd: false });
  key('lord', W0 + 6, { lean: -10, head: -10, mouth: 'puzzlement', eyes: 'sad' }, 4);
  ev('sweat', { who: 'lord', f0: W0 + 8, f1: W1 + 6 });
  const BANG = LIT2 + 30;
  R2.segs.push({ f0: BANG, gone: true });
  boom(BANG, 'lord:face', 300, ['#2a8cff', '#ffffff', '#ffe14d'], 7);
  SOOT.push({ who: 'lord', f0: BANG, f1: 0 });
  key('lord', BANG, { lean: -16, head: -14, handF: hand('lord', 'F', 0.3, -0.9), handB: hand('lord', 'B', -0.3, -0.9) }, 2);
  tremble('lord', BANG + 2, BANG + 14, LX, 6);
  sfx('ref:hit-ow', BANG + 2, { who: 'lord', gain: 0.9 });
  const HAT = { f0: BANG, f1: BANG + 28 };
  window.HATFLY = HAT;
  ev('smoke', { f: BANG + 4, who: 'lord', size: 200, dx: 0, y: GROUND - 760 });
  key('skel', BANG + 2, { mouth: 'happy with theeth', eyes: 'normal' }, 0);
  sfx('ref:laugh', BANG + 4, { who: 'skel', gain: 0.85, pitch: 1.0 });
  chuckle('skel', BANG + 4, BANG + 26, { mouth: 'happy with theeth' });
  const sm = shrink('lord', BANG + 14, LX, -1, { mouth: 'puzzlement', eyes: 'sad', smoke: 400 });
  key('lord', sm, { lean: 0, head: 0, hip: [0, 0] }, 0);
  ev('stars', { who: 'lord', f0: sm + 4, f1: sm + 30, snd: false });

  // ---- 13.2–14.5 с: Малыш «растёт»
  const BX = 860;
  key('baby', sm + 2, { eyes: 'angry', mouth: ' 2' }, 0);
  ev('vein', { who: 'baby', f0: sm + 2, f1: sm + 12 });
  const BB = transform('baby', sm + 4, BS, BX, 1, { style: 'grow' });
  key('baby', BB, stance('baby', BX, 1), 0);
  key('baby', BB + 6, { mouth: 'happy with theeth', eyes: 'angry' }, 0);
  key('skel', BB - 2, { mouth: 'puzzlement', eyes: 'sad' }, 0);

  // ---- 14.6–19 с: ракета Малыша — взмах крыльев — ракета уходит в шарика-Лорда — большой салют
  const KB = C.baby.big, R3 = ROCKETS[2], BX2 = 1560;
  turn('baby', BB + 6, 1, BX);
  // перелетает через шарика-Лорда на пропеллере
  const F0 = BB + 8, F1 = F0 + 28;
  propeller('baby', F0 - 2, F1 + 4, 10);
  key('baby', F0 + 2, { legFfk: 1, legBfk: 1, legF: [-20, 40], legB: [20, -30], handF: hand('baby', 'F', 0.5, -0.6), handB: hand('baby', 'B', -0.4, -0.6), mouth: 'happy with theeth' }, 3);
  move('baby', F0, { x: BX, y: GROUND });
  move('baby', F0 + 14, { x: (BX + BX2) / 2, y: GROUND - 230 }, 'out2');
  move('baby', F1, { x: BX2, y: GROUND }, 'in2');
  key('baby', F0, { ...KB.feet(BX, 1) }, 0);
  key('baby', F1, { ...KB.feet(BX2, 1) }, F1 - F0, 'io');
  key('baby', F1, { ...stance('baby', BX2, 1), legFfk: 0, legBfk: 0, sx: 1.06, sy: 0.94 }, 2);
  key('baby', F1 + 4, { sx: 1, sy: 1 }, 3);
  sfx('land', F1, { who: 'baby', gain: 0.6 });
  const PK3 = F1 + 8;
  key('baby', PK3 - 6, { lean: 22, hip: [0, toRig('baby', 100)], head: 6 }, 6);
  // ракеты стоят у x 1640+: тянется за третьей
  move('baby', PK3 - 6, { x: BX2 });
  key('baby', PK3, { hitF: 1, hitFto: [STAND[2][0], GROUND - 40], hitFfix: PK3 }, 6);
  R3.segs.push({ f0: PK3, hand: 'baby', arm: 'F', rot: 0 });
  sfx('pop', PK3, { who: 'baby', gain: 0.5 });
  turn('baby', PK3 + 8, -1, BX2);
  key('baby', PK3 + 10, { ...stance('baby', BX2, -1), hitF: 0, handF: hand('baby', 'F', 0.75, -0.45), mouth: 'happy with theeth', eyes: 'angry' }, 6);
  const LIT3 = PK3 + 12, GO3 = LIT3 + 8;
  sfx('flick', LIT3, { who: 'baby', gain: 0.8 });
  ignite(R3, LIT3, GO3);
  R3.segs.push({ f0: LIT3, hand: 'baby', arm: 'F', rot: -Math.PI / 2 });
  key('skel', LIT3, { mouth: 'angry theeth', eyes: 'angry' }, 0);
  const W2 = GO3 - 2, W3 = W2 + 18;
  flap(W2, W3, 0.9);
  ev('wind', { f0: W2, f1: W3, x0: SX + 260, x1: 1600, snd: false });
  // ракета летит к Скелету, ветер её разворачивает — в шарика-Лорда (справа)
  const TURN = GO3 + 8, HITL = TURN + 14, LIFT = HITL + 18;
  launch(R3, GO3, HITL);
  const lp = (f, S) => { const t = target('lord:top', S); return [t[0] - 6, t[1] + 40]; };
  R3.segs.push({ f0: GO3, f1: TURN, a: (f, S) => KB.point(S.baby.st, 'handF'), b: [760, 330], arc: 40 });
  R3.segs.push({ f0: TURN, f1: HITL, a: [760, 330], b: lp, arc: 260 });
  R3.segs.push({ f0: HITL, stick: 'lord', rot: 0 });
  sfx('pop', HITL, { who: 'lord', gain: 0.8 });
  key('lord', HITL, { mouth: 'puzzlement', eyes: 'sad', sx: 0.9, sy: 1.1 }, 1);
  launch(R3, HITL + 2, LIFT);
  move('lord', HITL + 2, { x: LX, y: GROUND });
  move('lord', LIFT, { x: LX + 40, y: 260 }, 'in');
  sfx('scared', HITL + 2, { who: 'lord', gain: 0.8 });
  R3.segs.push({ f0: LIFT, gone: true });
  key('lord', LIFT, { alpha: 0 }, 0);
  SOOT[2].f1 = LIFT;
  boom(LIFT, [LX + 40, 160], 420, ['#ff3a6a', '#ffe14d', '#3ad1ff', '#7aff5a', '#b04dff'], 9);
  ev('twinkle', { f: LIFT + 6, at: [LX + 40, 160], n: 24, size: 70 });
  key('baby', GO3 + 2, { handF: hand('baby', 'F', 0.4, 0.2), mouth: 'puzzlement', eyes: 'sad' }, 4);
  // Малыш удирает на пропеллере
  const RUN = LIFT + 2;
  propeller('baby', RUN, RUN + 30, 10);
  key('baby', RUN, { legFfk: 1, legBfk: 1, legF: [-20, 40], legB: [20, -30], handF: hand('baby', 'F', 0.3, -0.9), handB: hand('baby', 'B', -0.3, -0.9) }, 3);
  move('baby', RUN, { x: BX2, y: GROUND });
  move('baby', RUN + 26, { x: 2300, y: -200 }, 'in');
  sfx('scared', RUN + 2, { who: 'baby', gain: 0.7 });
  // в небе салюты
  const SHOW = [[LIFT + 14, [520, 200], 220], [LIFT + 24, [1450, 140], 240], [LIFT + 36, [960, 120], 260], [LIFT + 50, [300, 160], 200], [LIFT + 62, [1660, 220], 220], [LIFT + 78, [1200, 110], 240], [LIFT + 94, [700, 130], 220]];
  SHOW.forEach(([f, at, s], i) => { if (f < NF - 10) { SKYBOOMS.push({ f, at, size: s, seed: 11 + i }); sfx('explode', f, { x: at[0], gain: 0.25 }); sfx('sparkle', f + 2, { x: at[0], gain: 0.4 }); } });
  sfx('ref:laugh', LIFT + 4, { who: 'skel', gain: 0.85, pitch: 1.0 });
  const WIN = victory('skel', LIFT + 10, SX, { n: 9, stride: 110 });
  key('skel', WIN + 2, { b_B16: -40, b_B17: 40 }, 6);
  window.T = { STICK, TOP, LB, GO, HITS, SB, BANG, sm, BB, GO3, LIFT, WIN };
};

// шляпа Лорда взлетает после взрыва
ST.hooks.drawPose = (who, p, f) => {
  const H = window.HATFLY;
  if (who !== 'lord' || !H || f < H.f0 || f >= H.f1 || p.form !== 'big') return p;
  return { ...p, hide: [...(p.hide || []), 'hat'] };
};
ST.hooks.beforeChars.push((ctx, f, S, CAM) => {
  ctx.setTransform(...CAM);
  for (const b of SKYBOOMS) FX.fireworkBurst(ctx, b.at[0], b.at[1], (f - b.f) / 26, b.size, ['#ff3a6a', '#ffe14d', '#3ad1ff', '#7aff5a', '#b04dff'], b.seed);
  for (const R of ROCKETS) { const cur = R.segs.filter((c) => f >= c.f0).pop(); if (cur && cur.at) FX.rocket(ctx, cur.at[0], cur.at[1], RS, cur.rot || 0, R.col); }
});
ST.hooks.afterChars.push((ctx, f, S, CAM) => {
  ctx.setTransform(...CAM);
  for (const s of SOOT) {
    if (f < s.f0 || (s.f1 && f >= s.f1)) continue;
    const p = target(`${s.who}:face`, S);
    FX.soot(ctx, p[0], p[1], S[s.who].p.form === 'big' ? 170 : 150, Math.min(1, (f - s.f0 + 1) / 3), s.f0);
  }
  for (const R of ROCKETS) {
    const cur = R.segs.filter((c) => f >= c.f0).pop();
    if (!cur || cur.at) continue;
    const r = rocketAt(R, f, S);
    if (!r) continue;
    if (R.fly.some(([a, b]) => f >= a && f < b)) FX.rocketTrail(ctx, r.x, r.y, r.rot, f / FPS, 130);
    FX.rocket(ctx, r.x, r.y, RS, r.rot, R.col);
    if (R.lit.some(([a, b]) => f >= a && f < b)) FX.fuseSparks(ctx, r.x - Math.sin(r.rot) * -6, r.y + Math.cos(r.rot) * 6, f / FPS, 0.8);
  }
  for (const b of BOOMS) { const at = P(b.at, b.f, statesAt(b.f)); FX.fireworkBurst(ctx, at[0], at[1], (f - b.f) / 22, b.size, b.cols, b.seed); }
  const H = window.HATFLY;
  if (H && f >= H.f0 && f < H.f1) {
    const u = (f - H.f0) / (H.f1 - H.f0), top = target('lord:top', S), L = C.lord.big, l = L.layers.find((x) => x.name === 'hat');
    if (S.lord.p.form === 'big') {
      ctx.save(); ctx.translate(top[0] + 200 * u, top[1] + 60 - Math.sin(Math.PI * u) * 300 + 300 * u * u); ctx.rotate(u * Math.PI * 5);
      const sc = L.scale, w = (l.bbox[2] - l.bbox[0]) * sc, hh = (l.bbox[3] - l.bbox[1]) * sc;
      ctx.drawImage(l.img.canvas, -w / 2, -hh / 2, w, hh);
      ctx.restore();
    }
  }
});

ST.start(BIG);
