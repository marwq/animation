// Ролик 39: Пчёлы — Розовая (слева) против Лорда (справа), 25 с, 24 кадра/с. Драка без ударов:
// улей и рой пчёл: пчёлы летят на мёд и на песню, кружат вокруг головы, садятся «бородой» на лицо.
// В начале — считалка «3, 2, 1, FIGHT». Музыка превращения — один раз. Фон — саванна.
//
//   0–2.2 с   считалка: шарик-Розовая и шарик-Лорд неподвижно стоят друг напротив друга
//   2.2–4.4 с с неба падает улей; Лорд прыгает на него — вылетает рой — пчёлы кружат вокруг Розовой, она мечется
//   4.4–5.6 с Розовая «растёт» под музыку — пчёлы разлетаются, Лорд влюблён
//   5.7–9.5 с выливает мёд на влюблённого Лорда — рой летит на него — он удирает кругами, спотыкается
//   9.5–13.4 с Лорд «растёт» и поёт — пчёлы садятся Розовой на лицо «бородой» — она мечется, падает — «пуф»
//   13.4–17 с шарик-Розовая подбрасывает улей — он надевается Лорду на голову — рой у него перед лицом —
//             он падает — «пуф»
//   17–21 с   Розовая «растёт» снова — рой гонит шарика-Лорда за край
//   21–25 с   Розовая в центре, руки вверх; пчела садится ей на руку
'use strict';

const ST = Stage({
  name: '39 Розовая vs Лорд',
  frames: 600,
  intro: 'countdown-321',
  cast: {
    pink: { small: ['girl-verity-small', { bodyHeight: 300 }], big: ['girl-verity-big', { height: 730, splitFeet: true }],
      pivot: 337, voice: 1.35, vAngle: 50, lie: 55, color: '#ff4fc8', moods: { angry: 'angry theeth', grin: 'theeth smile', big: 'theeth smile' } },
    lord: { small: ['lord-verity-small', { bodyHeight: 300 }], big: ['lord-verity-big', { height: 730 }], pivot: 337,
      voice: 1.0, lie: 55, color: '#ffe23a', ouch: ['ref:hit-ow', 1.0, 0.9] },
  },
  order: ['lord', 'pink'],
  background: { theme: 'savanna', seed: 1039, sunX: 1500, sunY: 130 },
  clouds: [[150, 80, 2.4, 0, 12], [700, 220, 1.8, 1, 16], [1150, 70, 2.6, 2, 10], [1720, 250, 1.5, 0, 18]],
});
const { FPS, NF, GROUND, C, key, move, ev, sfx, hop, tumble, laugh, tremble, transform, shrink, stance, walk,
  slip, fallBack, victory, chuckle, hand, toRig, statesAt, target } = ST;
const P = (v, f, S) => (typeof v === 'function' ? v(f, S) : typeof v === 'string' ? target(v, S) : v);
ST.parts.mid = (ch, st) => { const h = ch.point(st, 'head'), f = ch.point(st, 'face'); return [(h[0] + f[0]) / 2, (h[1] + f[1]) / 2]; };

// ------------------------------------------------------------------ улей, рой, мёд
const HS = 150, NB = 9;
const HIVE = [];          // {f0, at:[x,y], rot} | {f0, f1, a, b, arc, spin} | {f0, on: who}
const SW = [];            // ключи роя: {f, at: spec, r} — центр и радиус; между ключами — плавно
const OUCH = [];          // {f, at}
const HONEY = [];         // {who, f0, f1}
const POT = [];           // {f0, hand: who, rot} | {f0, f1, a, b, arc} | {f0, gone}
function segAt(segs, f) { let c = null; for (const s of segs) if (f >= s.f0) c = s; return c && !c.gone ? c : null; }
function hiveAt(f, S) {
  const c = segAt(HIVE, f);
  if (!c) return null;
  if (c.at) return { x: c.at[0], y: c.at[1], rot: typeof c.rot === 'function' ? c.rot(f) : c.rot || 0 };
  if (c.on) { const t = target(`${c.on}:top`, S); return { x: t[0], y: t[1] + 10, rot: 0 }; }
  const u = E.clamp((f - c.f0) / (c.f1 - c.f0), 0, 1), e = c.ease ? E.EASE[c.ease](u) : u, a = P(c.a, c.f0, statesAt(c.f0)), b = P(c.b, f, S);
  return { x: E.lerp(a[0], b[0], e), y: E.lerp(a[1], b[1], e) - Math.sin(Math.PI * u) * (c.arc || 0), rot: u * (c.spin || 0) };
}
const hivePt = (f) => { const h = hiveAt(f, statesAt(f)); return [h.x, h.y]; };
function swarmAt(f, S) {
  if (!SW.length || f < SW[0].f) return null;
  let i = 0; while (i < SW.length - 1 && f >= SW[i + 1].f) i++;
  const k0 = SW[i];
  if (k0.gone) return null;
  const p0 = P(k0.at, f, S);
  if (i === SW.length - 1) return { c: p0, r: k0.r, tight: k0.tight };
  const k1 = SW[i + 1], u = E.EASE.io((f - k0.f) / (k1.f - k0.f));
  if (k1.gone) return { c: p0, r: k0.r, tight: k0.tight };
  const p1 = P(k1.at, f, S);
  return { c: [E.lerp(p0[0], p1[0], u), E.lerp(p0[1], p1[1], u) - Math.sin(Math.PI * u) * 60], r: E.lerp(k0.r, k1.r, u), tight: u > 0.7 ? k1.tight : k0.tight };
}
function swarm(f, at, r = 110, o = {}) { SW.push({ f, at, r, ...o }); }
function buzz(f, n, gain = 0.6) { sfx('buzz', f, { x: 960, dur: n, gain }); }
function ouch(who, f) { OUCH.push({ f, at: (g, S) => target(`${who}:mid`, S) }); sfx('hurt', f, { who, gain: 0.8 }); }
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
const LATE = [];

const PX0 = 470, LX0 = 1450, MX = 960, GO = 54;
// ================================================================== 0–2.2 с: считалка, оба стоят
key('pink', 0, { form: 'small', x: PX0, y: GROUND, face: 1, look: 1, eyes: 'normal', mouth: 'smile normal', sx: 1, sy: 1, rot: 0, pivot: 0, alpha: 1 }, 0);
key('lord', 0, { form: 'small', x: LX0, y: GROUND, face: -1, look: 1, eyes: 'normal', mouth: 'smile normal', sx: 1, sy: 1, rot: 0, pivot: 0, alpha: 1 }, 0);

const BIG = () => {
  // ---- 2.2–4.4 с: улей падает — Лорд прыгает на него — рой — пчёлы кружат вокруг Розовой
  const HY = GROUND - HS * 0.55;
  HIVE.push({ f0: GO, f1: GO + 8, a: [MX, -200], b: [MX, HY], ease: 'in2' }, { f0: GO + 8, at: [MX, HY], rot: (f) => Math.sin((f - GO - 8) * 0.8) * 0.12 * Math.exp(-(f - GO - 8) / 8) });
  sfx('whoosh', GO, { x: MX, dur: 8, gain: 0.5 }); sfx('land', GO + 8, { x: MX, gain: 0.7, pitch: 0.8 }); ev('dust', { f: GO + 8, x: MX, r: 60, n: 5, snd: false });
  buzz(GO + 9, 10, 0.3);
  key('pink', GO + 3, { mouth: 'puzzlement' }, 0); key('lord', GO + 3, { mouth: 'puzzlement' }, 0);
  key('lord', GO + 10, { mouth: 'happy with theeth', eyes: 'angry' }, 0);
  const ON = GO + 22;
  hopTo('lord', GO + 12, ON, LX0, GROUND, MX + 10, HY - HS * 0.45, 140, { land: false });
  key('lord', ON, { sx: 1.3, sy: 0.75 }, 1); key('lord', ON + 4, { sx: 1, sy: 1 }, 3);
  sfx('squish', ON, { x: MX, gain: 0.6 });
  HIVE.push({ f0: ON, at: [MX, HY], rot: (f) => Math.sin((f - ON) * 1.2) * 0.2 * Math.exp(-(f - ON) / 10) });
  swarm(ON, [MX, HY - 40], 30); swarm(ON + 8, [MX, HY - 160], 140);
  buzz(ON, 40, 0.8);
  const LX1 = 1250;
  hopTo('lord', ON + 6, ON + 16, MX + 10, HY - HS * 0.45, LX1, GROUND, 100);
  key('lord', ON + 16, { mouth: 'happy with theeth', eyes: 'normal' }, 0);
  sfx('ref:laugh', ON + 16, { who: 'lord', gain: 0.85 });
  laugh('lord', ON + 18, ON + 36);
  // рой — к Розовой
  const AT1 = ON + 20;
  swarm(AT1, (f, S) => target('pink:mid', S), 120);
  key('pink', AT1 - 2, { mouth: 'puzzlement', eyes: 'sad' }, 0);
  sfx('scared', AT1, { who: 'pink', gain: 0.8 });
  let x = PX0;
  for (let i = 0; i < 3; i++) { const a = AT1 + 2 + i * 8, nx = i % 2 ? x + 120 : x - 120; hopTo('pink', a, a + 7, x, GROUND, nx, GROUND, 110, { prep: 1, snd: false }); x = nx; }
  ouch('pink', AT1 + 8); ouch('pink', AT1 + 18);

  // ---- 4.4–5.6 с: Розовая «растёт» — пчёлы разлетаются — Лорд влюблён
  const PX = 520;
  key('pink', AT1 + 24, { eyes: 'angry', mouth: 'angry theeth' }, 0);
  const PB = transform('pink', AT1 + 26, x, PX, 1, { style: 'grow', love: 'lord', loveDur: 60 });
  swarm(PB - 4, (f, S) => target('pink:mid', S), 120); swarm(PB + 4, [MX, HY - 60], 60, { tight: true });
  key('pink', PB, stance('pink', PX, 1), 0);
  key('pink', PB + 4, { mouth: 'theeth smile', eyes: 'normal' }, 0);

  // ---- 5.7–9.5 с: мёд на влюблённого Лорда — рой на него — убегает кругами — спотыкается
  const LX2 = 1060;
  hopTo('lord', PB + 4, PB + 14, LX1, GROUND, LX2, GROUND, 70);
  ev('hearts', { who: 'lord', f0: PB + 14, f1: PB + 40, snd: false });
  ev('smoke', { f: PB + 4, who: 'pink', size: 180, dx: 140, y: GROUND - 420 }); sfx('pop', PB + 6, { who: 'pink', gain: 0.5 });
  POT.push({ f0: PB + 6, hand: 'pink', rot: 0 });
  key('pink', PB + 6, { handF: hand('pink', 'F', 0.8, -0.3) }, 4);
  const PX1 = 760;
  walk('pink', PB + 8, PX, PX1, 2, 8, 1);
  const POUR = PB + 26;
  key('pink', POUR - 4, { handF: hand('pink', 'F', 0.95, -0.55), lean: 12, mouth: 'theeth smile', eyes: 'angry' }, 4);
  POT.push({ f0: POUR, hand: 'pink', rot: 2.2 });
  sfx('drip', POUR + 2, { who: 'lord', gain: 0.8 }); sfx('squish', POUR + 6, { who: 'lord', gain: 0.7 });
  HONEY.push({ who: 'lord', f0: POUR + 4, f1: 0 });
  key('lord', POUR + 6, { mouth: 'puzzlement', eyes: 'sad' }, 0);
  key('pink', POUR + 10, { ...stance('pink', PX1, 1), mouth: 'happy with theeth', eyes: 'normal' }, 6);
  POT.push({ f0: POUR + 10, hand: 'pink', rot: 0 }, { f0: POUR + 24, gone: true });
  // рой летит на мёд
  const AT2 = POUR + 12;
  swarm(AT2, (f, S) => target('lord:top', S), 110);
  buzz(AT2 - 4, 50, 0.8);
  sfx('scared', AT2, { who: 'lord', gain: 0.8 });
  x = LX2;
  const RUN = [[1350, 140], [1600, 160], [1300, 120], [1550, 140]];
  RUN.forEach(([nx, h], i) => { const a = AT2 + 2 + i * 9; hopTo('lord', a, a + 8, x, GROUND, nx, GROUND, h, { prep: 1, snd: false }); key('lord', a, { face: nx > x ? 1 : -1 }, 0); x = nx; });
  ouch('lord', AT2 + 10); ouch('lord', AT2 + 28);
  const TRIP = AT2 + 40, LX3 = 1500;
  tumble('lord', TRIP, TRIP + 14, x, LX3, 140, 1, { stars: 18 });
  sfx('ref:laugh', AT2 + 6, { who: 'pink', gain: 0.85, pitch: 1.35 });
  chuckle('pink', AT2 + 6, TRIP + 14, { mouth: 'happy with theeth' });

  // ---- 9.5–13.4 с: Лорд «растёт» и поёт — пчёлы «бородой» на лицо Розовой — падает — «пуф»
  const LX = 1460;
  key('lord', TRIP + 16, { eyes: 'angry', mouth: 'angry theeth', face: -1 }, 0);
  const LB = transform('lord', TRIP + 18, LX3, LX, -1, { style: 'grow' });
  HONEY[0].f1 = LB - 4;
  swarm(LB - 6, (f, S) => target('lord:top', S), 120); swarm(LB + 2, [1300, GROUND - 600], 160);
  key('lord', LB, stance('lord', LX, -1), 0);
  key('lord', LB + 4, { mouth: 'theeth smile', eyes: 'angry' }, 0);
  key('pink', LB - 2, { mouth: 'puzzlement', eyes: 'sad' }, 0);
  const SING = LB + 8;
  key('lord', SING, { mouth: 'happy with theeth', eyes: 'normal', head: -8, handF: hand('lord', 'F', 0.6, -0.5), handB: hand('lord', 'B', -0.6, -0.5) }, 4);
  sfx('ref:lord-sing', SING, { who: 'lord', gain: 1.3 });
  for (let k = 0; k < 4; k++) ev('twinkle', { f: SING + k * 6, at: [1360 + k * 30, GROUND - 640 - k * 20], n: 10, size: 30 });
  const BEARD = SING + 22;
  swarm(BEARD - 10, [1100, GROUND - 640], 140); swarm(BEARD, (f, S) => { const t = target('pink:mid', S); return [t[0] + 10, t[1] + 40]; }, 70, { tight: true });
  buzz(BEARD - 8, 40, 0.9);
  key('pink', BEARD, { handF: hand('pink', 'F', 0.5, -0.85), handB: hand('pink', 'B', 0.3, -0.85), lean: -8, mouth: 'puzzlement', eyes: 'sad' }, 3);
  sfx('scared', BEARD + 2, { who: 'pink', gain: 0.8 });
  tremble('pink', BEARD + 2, BEARD + 22, PX1, 6);
  ouch('pink', BEARD + 6); ouch('pink', BEARD + 16);
  chuckle('lord', BEARD + 4, BEARD + 46, { mouth: 'happy with theeth' });
  const FB = fallBack('pink', BEARD + 24, PX1, 1, { n: 14, stars: 26 });
  const PBX = 560;
  const psm = shrink('pink', FB + 6, PBX, 1, { mouth: 'puzzlement', eyes: 'sad', smoke: 420 });
  key('pink', psm, { lean: 0, head: 0, hip: [0, 0], legF: null, legB: null, zB: null, rot: 0 }, 0);
  move('pink', psm, { x: PBX, y: GROUND, rot: 0 });
  swarm(FB + 2, (f, S) => target('pink:mid', S), 80); swarm(psm + 2, [MX, HY - 60], 60, { tight: true });
  ev('stars', { who: 'pink', f0: psm + 4, f1: psm + 14, snd: false });

  // ---- 13.4–17 с: шарик-Розовая подбрасывает улей Лорду на голову — рой у его лица — «пуф»
  const LX4 = 1180;
  walk('lord', FB + 8, LX, LX4, 2, 8, -1);
  key('pink', psm + 6, { eyes: 'angry', mouth: 'theeth smile' }, 0);
  const KB = psm + 18;
  hopTo('pink', psm + 8, KB, PBX, GROUND, MX - 110, GROUND, 80);
  key('pink', KB + 1, { sx: 0.85, sy: 1.2 }, 1); key('pink', KB + 5, { sx: 1, sy: 1 }, 3);
  sfx('bonk', KB + 1, { x: MX, gain: 0.7 });
  const ONH = KB + 14;
  HIVE.push({ f0: KB + 1, f1: ONH, a: [MX, HY], b: (f, S) => { const t = target('lord:top', S); return [t[0], t[1] + 10]; }, arc: 220, spin: 4 }, { f0: ONH, on: 'lord' });
  sfx('whoosh', KB + 2, { x: 1100, dur: 12, gain: 0.5 });
  swarm(KB + 1, [MX, HY - 60], 60); swarm(ONH, (f, S) => target('lord:mid', S), 110);
  buzz(ONH - 2, 40, 0.9);
  sfx('bonk', ONH, { who: 'lord', gain: 0.8, pitch: 0.8 });
  key('lord', ONH, { mouth: 'puzzlement', eyes: 'sad', handF: hand('lord', 'F', 0.5, -0.9), handB: hand('lord', 'B', 0.3, -0.9), lean: -6 }, 3);
  sfx('scared', ONH + 2, { who: 'lord', gain: 0.8 });
  tremble('lord', ONH + 2, ONH + 20, LX4, 6);
  ouch('lord', ONH + 6); ouch('lord', ONH + 14);
  key('pink', KB + 6, { mouth: 'happy with theeth', eyes: 'normal' }, 0);
  sfx('ref:laugh', ONH + 4, { who: 'pink', gain: 0.85, pitch: 1.35 });
  laugh('pink', ONH + 6, ONH + 22);
  const FB2 = fallBack('lord', ONH + 22, LX4, -1, { n: 14, stars: 24 });
  HIVE.push({ f0: FB2, f1: FB2 + 12, a: (f, S) => hivePt(FB2 - 1), b: [1600, GROUND - HS * 0.55], arc: 100, spin: 3 }, { f0: FB2 + 12, at: [1600, GROUND - HS * 0.55], rot: 0.2 });
  const LBX = 1350;
  const lsm = shrink('lord', FB2 + 6, LBX, -1, { mouth: 'puzzlement', eyes: 'sad', smoke: 420 });
  key('lord', lsm, { lean: 0, head: 0, hip: [0, 0], legF: null, legB: null, zB: null, rot: 0 }, 0);
  move('lord', lsm, { x: LBX, y: GROUND, rot: 0 });
  ev('stars', { who: 'lord', f0: lsm + 4, f1: lsm + 14, snd: false });
  swarm(lsm + 2, (f, S) => target('lord:mid', S), 100);

  // ---- 17–21 с: Розовая «растёт» снова — рой гонит шарика-Лорда за край
  const PX2 = MX - 60, PB2 = transform('pink', ONH + 24, MX - 110, PX2, 1, { style: 'grow' });
  key('pink', PB2, stance('pink', PX2, 1), 0);
  key('pink', PB2 + 4, { mouth: 'happy with theeth', eyes: 'normal' }, 0);
  key('lord', lsm + 6, { face: 1, mouth: 'puzzlement', eyes: 'sad' }, 0);
  sfx('scared', lsm + 8, { who: 'lord', gain: 0.8 });
  let lx = LBX;
  for (let k = 0; k < 3; k++) { const a = lsm + 10 + k * 9, nx = lx + 330; hop('lord', a, a + 8, lx, nx, 100, { prep: 1 }); lx = nx; }
  swarm(lsm + 10, (f, S) => target('lord:mid', S), 100); swarm(lsm + 40, [2300, GROUND - 300], 120);
  buzz(lsm + 8, 30, 0.7);
  sfx('ref:laugh', PB2 + 6, { who: 'pink', gain: 0.85, pitch: 1.35 });
  chuckle('pink', PB2 + 6, PB2 + 26, { mouth: 'happy with theeth' });
  // рой развернул его обратно: шарик-Лорд мчится справа налево мимо Розовой и за левый край
  const BK = lsm + 46;
  key('lord', BK - 2, { face: -1, mouth: 'puzzlement', eyes: 'sad' }, 0);
  move('lord', BK - 2, { x: 2150, y: GROUND });
  lx = 2150;
  for (let k = 0; k < 6; k++) { const a = BK + k * 8, nx = lx - 400; hop('lord', a, a + 7, lx, nx, 90, { prep: 1 }); lx = nx; }
  sfx('scared', BK + 2, { who: 'lord', gain: 0.8 });
  const behind = (f, S) => { const t = target('lord:mid', S); return [t[0] + 140, t[1] - 30]; };
  swarm(BK + 4, behind, 100); swarm(BK + 46, behind, 100); swarm(BK + 54, [-450, GROUND - 300], 120); swarm(BK + 56, [-450, GROUND - 300], 120, { gone: true });
  buzz(BK, 48, 0.7);
  key('pink', BK + 10, { mouth: 'puzzlement', eyes: 'normal' }, 2);
  key('pink', BK + 24, { mouth: 'happy with theeth' }, 0);
  sfx('ref:laugh', BK + 24, { who: 'pink', gain: 0.85, pitch: 1.35 });
  laugh('pink', BK + 24, BK + 44);

  // ---- 22–25 с: в центр, руки вверх
  const WIN = victory('pink', Math.max(PB2 + 26, BK + 48), PX2, { n: 9, stride: 80 });
  SW.sort((a, b) => a.f - b.f);
  for (const fn of LATE) fn();
  window.T = { ON, AT1, PB, POUR, AT2, TRIP, LB, SING, BEARD, FB, psm, KB, ONH, FB2, lsm, PB2, BK, WIN };
};

// ------------------------------------------------------------------ рисование
const t0 = (f) => f / FPS;
ST.hooks.beforeChars.push((ctx, f, S, CAM) => {
  ctx.setTransform(...CAM);
  const c = segAt(HIVE, f);
  if (c && !c.on && !c.f1) { const h = hiveAt(f, S); FX.hive(ctx, h.x, h.y, HS, h.rot); }
});
ST.hooks.afterChars.push((ctx, f, S, CAM) => {
  ctx.setTransform(...CAM);
  const c = segAt(HIVE, f);
  if (c && (c.on || c.f1)) { const h = hiveAt(f, S); FX.hive(ctx, h.x, h.y, HS, h.rot); }
  for (const h of HONEY) {
    if (f < h.f0 || (h.f1 && f >= h.f1)) continue;
    const t = target(`${h.who}:top`, S);
    FX.honeyCap(ctx, t[0], t[1] + 30, 170, Math.min(1, (f - h.f0 + 2) / 10), 1);
  }
  const pc = segAt(POT, f);
  if (pc && pc.hand && S[pc.hand].p.form === 'big') { const hh = C[pc.hand].big.point(S[pc.hand].st, 'handF'); FX.honeyPot(ctx, hh[0], hh[1] + 40, 110, pc.rot, pc.rot < 1); }
  if (pc && pc.rot > 1) {
    const hh = C.pink.big.point(S.pink.st, 'handF'), t = target('lord:top', S);
    ctx.save(); ctx.lineCap = 'round'; ctx.lineWidth = 18; ctx.strokeStyle = 'rgba(255,176,24,0.9)';
    ctx.beginPath(); ctx.moveTo(hh[0] + 50, hh[1] + 20); ctx.quadraticCurveTo((hh[0] + t[0]) / 2, hh[1], t[0], t[1] + 20); ctx.stroke(); ctx.restore();
  }
  const sw = swarmAt(f, S);
  if (sw) {
    const r = FX.rng(7);
    for (let i = 0; i < NB; i++) {
      const ph = r() * Math.PI * 2, sp = 0.18 + r() * 0.12, rr = sw.r * (sw.tight ? 0.55 + 0.45 * r() : 0.6 + 0.6 * r());
      const a = ph + f * sp * (i % 2 ? 1 : -1);
      const x = sw.c[0] + Math.cos(a) * rr, y = sw.c[1] + Math.sin(a * 1.3) * rr * 0.6;
      FX.bee(ctx, x, y, 1.6, t0(f) + i, Math.cos(a + Math.PI / 2) * (i % 2 ? 1 : -1) > 0 ? 1 : -1);
    }
  }
  for (const o of OUCH) { const at = P(o.at, o.f, statesAt(o.f)); FX.prickle(ctx, at[0], at[1], (f - o.f) / 12, 0.8); }
});

ST.start(BIG);
