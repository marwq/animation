// Ролик 36: Лиса — Жёлтая (слева) против Скелета (справа), 25 с, 24 кадра/с. Драка без ударов:
// лиса из майнкрафта обожает сладкие ягоды и ныряет за ними головой вниз — куда ягода, туда и лиса.
// В начале — считалка «3, 2, 1, FIGHT». Музыка превращения — один раз. Фон — тайга.
//
//   0–2.2 с   считалка: шарик-Жёлтая и шарик-Скелет неподвижно стоят друг напротив друга
//   2.2–4 с   прибегает лиса; Скелет подкидывает ягоду Жёлтой на макушку — лиса ныряет головой прямо в Жёлтую
//   4–5.2 с   Жёлтая «растёт» под музыку — Скелет влюблён
//   5.3–9 с   она кидает ягоды на влюблённого Скелета — лиса ныряет в него раз, другой — он удирает, лиса гонится
//   9–13 с    Скелет «растёт», кладёт ягоду Жёлтой на нос — лиса прыгает ей в лицо — она падает — «пуф»
//   13–16.5 с шарик-Жёлтая катит ягоду к ноге Скелета — лиса кусает его за ногу — он скачет — падает — «пуф»
//   16.5–21 с Жёлтая «растёт» снова; лиса хватает шарика-Скелета в зубы, как ягоду, и убегает с ним за край
//   21–25 с   Жёлтая в центре, руки вверх
'use strict';

const ST = Stage({
  name: '36 Жёлтая vs Скелет',
  frames: 600,
  intro: 'countdown-321',
  cast: {
    yel: { small: ['girl-verity-small', { bodyHeight: 300, recolor: 'yellow' }],
      big: ['verity-big-girl', { height: 730, splitFeet: true, recolor: 'yellow' }], pivot: 337, voice: 1.45, vAngle: 50, lie: 55,
      color: '#ffe23a', moods: { angry: 'angry theeth', grin: 'theeth smile', big: 'theeth smile' } },
    skel: { small: ['skeleton-verity-small', { scale: 0.455 }], big: ['skeleton-verity-big', { height: 730 }], pivot: 325,
      voice: 0.9, lie: 60, color: '#f3f1e6', moods: { angry: 'angry theeth', grin: 'happy with theeth', big: 'theeth smile' } },
  },
  order: ['skel', 'yel'],
  background: { theme: 'taiga', seed: 1036, sunX: 1500, sunY: 130 },
  clouds: [[150, 80, 2.4, 0, 12], [700, 220, 1.8, 1, 16], [1150, 70, 2.6, 2, 10], [1720, 250, 1.5, 0, 18]],
});
const { FPS, NF, GROUND, C, key, move, ev, sfx, hop, tumble, laugh, tremble, transform, shrink, stance, walk,
  slip, fallBack, victory, chuckle, hand, toRig, statesAt, target } = ST;
const P = (v, f, S) => (typeof v === 'function' ? v(f, S) : typeof v === 'string' ? target(v, S) : v);
function flap(f0, f1, gain = 0.6) {
  for (let f = f0; f < f1; f += 6) { key('skel', f, { b_B16: -30, b_B17: 30 }, 3); key('skel', f + 3, { b_B16: 46, b_B17: -46 }, 3, 'in'); }
  key('skel', f1, { b_B16: 0, b_B17: 0 }, 4);
  sfx('gust', f0, { who: 'skel', dur: f1 - f0, gain });
}

// ------------------------------------------------------------------ лиса, ягоды
const XS = 430;
const FOX = [];           // {f0, at:[x], face, sit} | {f0, f1, a, b, arc, face, run, dive, ease} | {f0, hold: who, face}
const BER = [];           // {f0, f1, a, b, arc} | {f0, at} | {f0, on: who, part} — ягоды: [{segs}]
const MOUTH = [];         // {f0, f1, who} — кого держит в зубах
function segAt(segs, f) { let c = null; for (const s of segs) if (f >= s.f0) c = s; return c && !c.gone ? c : null; }
function foxAt(f, S) {
  const c = segAt(FOX, f);
  if (!c) return null;
  if (c.at) return { x: c.at[0], y: c.at[1] ?? GROUND, face: c.face, phase: 0, rot: 0, sit: c.sit || 0 };
  const u = E.clamp((f - c.f0) / (c.f1 - c.f0), 0, 1), e = c.ease ? E.EASE[c.ease](u) : u;
  const a = P(c.a, c.f0, statesAt(c.f0)), b = P(c.b, f, S);
  const x = E.lerp(a[0], b[0], e), y = E.lerp(a[1] ?? GROUND, b[1] ?? GROUND, e) - Math.sin(Math.PI * u) * (c.arc || 0);
  return { x, y, face: c.face, phase: c.run ? f * 1.0 : 0, rot: c.dive ? E.lerp(-0.5, 1.4, u) : 0, sit: 0 };
}
const foxPt = (f) => { const q = foxAt(f, statesAt(f)); return [q.x, q.y]; };
// нырок лисы головой вниз в точку (её нос — в цель)
function pounce(f0, n, from, to, face, h = 300) {
  FOX.push({ f0: f0 - 6, at: from, face, sit: 0.6 }, { f0, f1: f0 + n, a: from, b: to, arc: h, face, dive: true });
  sfx('jump', f0, { x: 960, gain: 0.6, pitch: 1.3 }); sfx('whoosh', f0 + 2, { x: 960, dur: n, gain: 0.5 });
}
function berry(segs) { const b = { segs }; BER.push(b); return b; }
function yip(f, gain = 0.6) { sfx('baa', f, { x: 960, gain, pitch: 2.2, dur: 4 }); }
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

const YX0 = 470, SX0 = 1450, GO = 54;
// ================================================================== 0–2.2 с: считалка, оба стоят
key('yel', 0, { form: 'small', x: YX0, y: GROUND, face: 1, look: 1, eyes: 'normal', mouth: 'smile normal', sx: 1, sy: 1, rot: 0, pivot: 0, alpha: 1 }, 0);
key('skel', 0, { form: 'small', x: SX0, y: GROUND, face: -1, look: 1, eyes: 'normal', mouth: 'smile normal', sx: 1, sy: 1, rot: 0, pivot: 0, alpha: 1 }, 0);

const BIG = () => {
  // ---- 2.2–4 с: прибегает лиса — Скелет подкидывает ягоду Жёлтой на макушку — лиса ныряет в Жёлтую
  const FX1 = 1000;
  FOX.push({ f0: GO, f1: GO + 12, a: [2150], b: [FX1], face: -1, run: true, ease: 'out2' }, { f0: GO + 12, at: [FX1], face: -1, sit: 1 });
  for (let f = GO + 2; f < GO + 12; f += 4) sfx('step', f, { x: 1400, gain: 0.35, pitch: 1.4 });
  yip(GO + 13, 0.6);
  key('yel', GO + 4, { mouth: 'puzzlement' }, 0); key('skel', GO + 4, { mouth: 'puzzlement' }, 0);
  key('skel', GO + 10, { mouth: 'happy with theeth', eyes: 'angry' }, 0);
  sfx('ref:grin-eee', GO + 10, { who: 'skel', gain: 0.4 });
  const TS = GO + 14, ON = TS + 10;
  key('skel', TS - 3, { sx: 1.2, sy: 0.85 }, 2); key('skel', TS, { sx: 0.88, sy: 1.12 }, 2); key('skel', TS + 4, { sx: 1, sy: 1 }, 3);
  sfx('flick', TS, { who: 'skel', gain: 0.6 });
  berry([{ f0: TS, f1: ON, a: [SX0 - 80, GROUND - 200], b: 'yel:top', arc: 220 }, { f0: ON, on: 'yel', part: 'top' }]);
  sfx('pop', ON, { who: 'yel', gain: 0.5 });
  key('yel', ON + 2, { look: 1, mouth: 'puzzlement', eyes: 'normal' }, 0);
  // лиса — нырок
  const P1 = ON + 4, HIT = P1 + 12;
  pounce(P1, 12, [FX1], (f, S) => { const t = target('yel:top', S); return [t[0] - 40, t[1] + XS * 0.62]; }, -1, 260);
  yip(P1, 0.8);
  FOX.push({ f0: HIT, f1: HIT + 12, a: (f, S) => foxPt(HIT - 1), b: [YX0 + 250], arc: 120, face: -1 }, { f0: HIT + 12, at: [YX0 + 250], face: 1, sit: 1 });
  BER[0].segs.push({ f0: HIT, gone: true });
  sfx('chomp', HIT, { who: 'yel', gain: 0.8 }); sfx('slam', HIT, { who: 'yel', gain: 0.8 });
  key('yel', HIT, { sx: 1.7, sy: 0.45, mouth: 'puzzlement', eyes: 'sad' }, 1); key('yel', HIT + 8, { sx: 1, sy: 1 }, 6, 'out');
  ev('shake', { f: HIT, amp: 12, n: 8 }); ev('stars', { who: 'yel', f0: HIT + 4, f1: HIT + 22 });
  sfx('boing', HIT + 8, { who: 'yel', gain: 0.6 });
  key('skel', HIT + 2, { mouth: 'happy with theeth', eyes: 'normal' }, 0);
  sfx('ref:laugh', HIT + 2, { who: 'skel', gain: 0.85 });
  laugh('skel', HIT + 4, HIT + 16);

  // ---- 4–5.2 с: Жёлтая «растёт» — Скелет влюблён
  const YX = 400;
  key('yel', HIT + 8, { eyes: 'angry', mouth: 'angry theeth' }, 0);
  const YB = transform('yel', HIT + 9, YX0, YX, 1, { style: 'grow', love: 'skel', loveDur: 56 });
  key('yel', YB, stance('yel', YX, 1), 0);
  key('yel', YB + 4, { mouth: 'theeth smile', eyes: 'normal' }, 0);
  // лиса отбегает в сторону и садится
  const FX2 = 760;
  FOX.push({ f0: YB - 14, f1: YB - 4, a: [YX0 + 250], b: [FX2], face: 1, run: true }, { f0: YB - 4, at: [FX2], face: 1, sit: 1 });

  // ---- 5.3–9 с: ягоды на влюблённого Скелета — лиса ныряет в него раз, другой — погоня
  const SX1 = 1250;
  hopTo('skel', YB + 2, YB + 12, SX0, GROUND, SX1, GROUND, 80);
  ev('hearts', { who: 'skel', f0: YB + 12, f1: YB + 34, snd: false });
  const T1 = YB + 16, B1 = T1 + 10;
  key('yel', T1 - 4, { handF: hand('yel', 'F', 0.1, -0.9), lean: -6, mouth: 'theeth smile', eyes: 'angry' }, 4);
  key('yel', T1, { handF: hand('yel', 'F', 0.95, -0.3), lean: 10 }, 3, 'in2');
  sfx('swing', T1 - 2, { who: 'yel', gain: 0.7 });
  berry([{ f0: T1, f1: B1, a: (f, S) => C.yel.big.point(statesAt(T1).yel.st, 'handF'), b: 'skel:top', arc: 120 }, { f0: B1, on: 'skel', part: 'top' }, { f0: B1 + 14, gone: true }]);
  key('yel', T1 + 6, { ...stance('yel', YX, 1), mouth: 'happy with theeth' }, 6);
  const P2 = B1 + 2, H2 = P2 + 12;
  pounce(P2, 12, [FX2], (f, S) => { const t = target('skel:top', S); return [t[0] - 40, t[1] + XS * 0.62]; }, 1, 200);
  yip(P2, 0.8);
  sfx('chomp', H2, { who: 'skel', gain: 0.8 }); sfx('bonk', H2, { who: 'skel', gain: 0.7 });
  key('skel', H2, { sx: 1.6, sy: 0.5, mouth: 'puzzlement', eyes: 'sad' }, 1); key('skel', H2 + 8, { sx: 1, sy: 1 }, 5, 'out');
  FOX.push({ f0: H2, f1: H2 + 10, a: (f, S) => foxPt(H2 - 1), b: [SX1 - 300], arc: 80, face: -1 }, { f0: H2 + 10, at: [SX1 - 300], face: 1, sit: 1 });
  sfx('ref:laugh', H2 + 4, { who: 'yel', gain: 0.85, pitch: 1.45 });
  chuckle('yel', H2 + 4, H2 + 30, { mouth: 'happy with theeth' });
  // вторая ягода — Скелет удирает, лиса гонится по кругу
  const T2 = H2 + 12, B2 = T2 + 10;
  key('yel', T2 - 4, { handF: hand('yel', 'F', 0.1, -0.9), lean: -6 }, 4);
  key('yel', T2, { handF: hand('yel', 'F', 0.95, -0.3), lean: 10 }, 3, 'in2');
  berry([{ f0: T2, f1: B2, a: (f, S) => C.yel.big.point(statesAt(T2).yel.st, 'handF'), b: 'skel:top', arc: 120 }, { f0: B2, on: 'skel', part: 'top' }]);
  key('yel', T2 + 6, { ...stance('yel', YX, 1), mouth: 'happy with theeth' }, 6);
  key('skel', B2 + 2, { mouth: 'puzzlement', eyes: 'sad' }, 0);
  sfx('scared', B2 + 2, { who: 'skel', gain: 0.8 });
  const CH = B2 + 4, CE = CH + 40;
  flap(CH, CE, 0.6);
  move('skel', CH, { x: SX1, y: GROUND }); move('skel', CH + 10, { x: 1550, y: GROUND - 260 }, 'io'); move('skel', CH + 22, { x: 1200, y: GROUND - 160 }, 'io'); move('skel', CH + 32, { x: 1500, y: GROUND - 200 }, 'io'); move('skel', CE, { x: 1600, y: GROUND }, 'in2');
  FOX.push({ f0: CH + 2, f1: CH + 12, a: [SX1 - 300], b: [1450], face: 1, run: true }, { f0: CH + 12, f1: CH + 24, a: [1450], b: [1050], face: -1, run: true }, { f0: CH + 24, f1: CH + 34, a: [1050], b: [1400], face: 1, run: true });
  for (let f = CH + 2; f < CH + 34; f += 4) sfx('step', f, { x: 1300, gain: 0.35, pitch: 1.4 });
  yip(CH + 6, 0.7); yip(CH + 20, 0.7);
  const P3 = CE - 2, H3 = P3 + 10;
  pounce(P3, 10, [1400], (f, S) => { const t = target('skel:top', S); return [t[0] - 40, t[1] + XS * 0.62]; }, 1, 160);
  BER[BER.length - 1].segs.push({ f0: H3, gone: true });
  sfx('chomp', H3, { who: 'skel', gain: 0.8 }); sfx('slam', H3, { who: 'skel', gain: 0.8 });
  key('skel', H3, { sx: 1.7, sy: 0.45, mouth: 'puzzlement', eyes: 'sad' }, 1); key('skel', H3 + 10, { sx: 1, sy: 1 }, 6, 'out');
  ev('stars', { who: 'skel', f0: H3 + 2, f1: H3 + 20 });
  const FX3 = 1180;
  FOX.push({ f0: H3, f1: H3 + 12, a: (f, S) => foxPt(H3 - 1), b: [FX3], arc: 100, face: -1 }, { f0: H3 + 12, at: [FX3], face: -1, sit: 1 });

  // ---- 9–13 с: Скелет «растёт», кладёт ягоду Жёлтой на нос — лиса прыгает ей в лицо — падает — «пуф»
  key('skel', H3 + 10, { eyes: 'angry', mouth: 'angry theeth' }, 0);
  const SX = 1540, SB = transform('skel', H3 + 12, 1600, SX, -1, { style: 'grow' });
  key('skel', SB, stance('skel', SX, -1), 0);
  key('skel', SB + 4, { mouth: 'theeth smile', eyes: 'angry' }, 0);
  key('yel', SB - 2, { mouth: 'puzzlement', eyes: 'sad' }, 0);
  const T4 = SB + 8, B4 = T4 + 12;
  key('skel', T4 - 4, { handF: hand('skel', 'F', 0.1, -0.9), lean: -6 }, 4);
  key('skel', T4, { handF: hand('skel', 'F', 0.95, -0.3), lean: 10 }, 3, 'in2');
  sfx('swing', T4 - 2, { who: 'skel', gain: 0.7 });
  berry([{ f0: T4, f1: B4, a: (f, S) => C.skel.big.point(statesAt(T4).skel.st, 'handF'), b: 'yel:face', arc: 100 }, { f0: B4, on: 'yel', part: 'face' }]);
  sfx('pop', B4, { who: 'yel', gain: 0.6 });
  key('skel', T4 + 8, { ...stance('skel', SX, -1), mouth: 'happy with theeth', eyes: 'normal' }, 6);
  key('yel', B4 + 2, { head: 6, mouth: 'puzzlement', eyes: 'normal' }, 3);
  yip(B4 + 4, 0.8);
  const P4 = B4 + 8, H4 = P4 + 12;
  pounce(P4, 12, [FX3], (f, S) => { const t = target('yel:face', S); return [t[0] + 40, t[1] + XS * 0.5]; }, -1, 200);
  FOX.push({ f0: H4, f1: H4 + 30, a: (f, S) => { const t = target('yel:face', S); return [t[0] + 40, t[1] + XS * 0.5]; }, b: (f, S) => { const t = target('yel:face', S); return [t[0] + 40, t[1] + XS * 0.5]; }, face: -1, dive: false });
  BER[BER.length - 1].segs.push({ f0: H4, gone: true });
  sfx('chomp', H4, { who: 'yel', gain: 0.9 }); sfx('slam', H4, { who: 'yel', gain: 0.6 });
  key('yel', H4, { lean: -16, head: -16, mouth: 'puzzlement', eyes: 'sad', handF: hand('yel', 'F', 0.5, -0.8), handB: hand('yel', 'B', 0.3, -0.8) }, 2);
  sfx('scared', H4 + 2, { who: 'yel', gain: 0.8 });
  tremble('yel', H4 + 2, H4 + 18, YX, 5);
  sfx('ref:laugh', H4 + 4, { who: 'skel', gain: 0.85, pitch: 0.8 });
  chuckle('skel', H4 + 4, H4 + 50, { mouth: 'happy with theeth' });
  const FB = fallBack('yel', H4 + 18, YX, 1, { forward: true, n: 14, stars: 26 });
  const FX4 = 280;
  FOX.push({ f0: H4 + 20, f1: H4 + 34, a: (f, S) => foxPt(H4 + 19), b: [FX4], arc: 160, face: -1 }, { f0: H4 + 34, at: [FX4], face: 1, sit: 1 });
  const YBX = 860;
  const ysm = shrink('yel', FB + 6, YBX, 1, { mouth: 'puzzlement', eyes: 'sad', smoke: 420 });
  key('yel', ysm, { lean: 0, head: 0, hip: [0, 0], legF: null, legB: null, zB: null, rot: 0 }, 0);
  move('yel', ysm, { x: YBX, y: GROUND, rot: 0 });
  ev('stars', { who: 'yel', f0: ysm + 4, f1: ysm + 14, snd: false });

  // ---- 13–16.5 с: шарик-Жёлтая катит ягоду к ноге Скелета — лиса кусает его за ногу — скачет — падает — «пуф»
  const SX2 = 1350;
  walk('skel', H4 + 30, SX, SX2, 1, 10, -1);
  key('yel', ysm + 6, { eyes: 'angry', mouth: 'theeth smile' }, 0);
  const KK = ysm + 10;
  key('yel', KK - 2, { sx: 1.2, sy: 0.85 }, 2); key('yel', KK, { sx: 0.9, sy: 1.1 }, 1); key('yel', KK + 4, { sx: 1, sy: 1 }, 3);
  sfx('flick', KK, { who: 'yel', gain: 0.6 }); sfx('slide', KK, { x: 900, gain: 0.4, pitch: 1.5 });
  const BF = KK + 14, FOOT = SX2 - 60;
  berry([{ f0: KK, f1: BF, a: [YBX + 90, GROUND - 20], b: [FOOT, GROUND - 20], arc: 0 }, { f0: BF, at: [FOOT, GROUND - 20] }]);
  yip(KK + 4, 0.8);
  const RN = KK + 6, BITE = BF + 4;
  FOX.push({ f0: RN, f1: BITE, a: [FX4], b: [FOOT - 170], face: 1, run: true, ease: 'in' }, { f0: BITE, at: [FOOT - 170], face: 1, sit: 0 });
  for (let f = RN + 2; f < BITE; f += 4) sfx('step', f, { x: 1100, gain: 0.35, pitch: 1.4 });
  BER[BER.length - 1].segs.push({ f0: BITE, gone: true });
  sfx('chomp', BITE, { who: 'skel', gain: 1.0 }); sfx('hurt', BITE + 1, { who: 'skel', gain: 1.0 });
  key('skel', BITE, { legFfk: 1, legF: [-70, 80, 0], lean: -10, head: -14, mouth: 'puzzlement', eyes: 'sad', handF: hand('skel', 'F', 0.5, -0.8), handB: hand('skel', 'B', -0.5, -0.7) }, 2);
  let sx = SX2;
  for (let i = 0; i < 2; i++) { const a = BITE + 2 + i * 9, nx = sx - 90; move('skel', a, { x: sx, y: GROUND }); move('skel', a + 4, { y: GROUND - 80 }, 'out2'); move('skel', a + 9, { x: nx, y: GROUND }, 'in2'); sfx('step', a + 9, { who: 'skel', gain: 0.5 }); sx = nx; }
  const FB2 = fallBack('skel', BITE + 20, sx, -1, { n: 14, stars: 24 });
  key('skel', BITE + 20, { legFfk: 1 }, 0);
  key('yel', BITE + 2, { mouth: 'happy with theeth', eyes: 'normal' }, 0);
  sfx('ref:laugh', BITE + 4, { who: 'yel', gain: 0.85, pitch: 1.45 });
  laugh('yel', BITE + 6, BITE + 22);
  const SBX = 1480;
  const ssm = shrink('skel', FB2 + 6, SBX, -1, { mouth: 'puzzlement', eyes: 'sad', smoke: 420 });
  key('skel', ssm, { lean: 0, head: 0, hip: [0, 0], legF: null, legB: null, zB: null, rot: 0, legFfk: 0 }, 0);
  move('skel', ssm, { x: SBX, y: GROUND, rot: 0 });
  ev('stars', { who: 'skel', f0: ssm + 4, f1: ssm + 14, snd: false });

  // ---- 16.5–21 с: Жёлтая «растёт» снова; лиса хватает шарика-Скелета в зубы и убегает за край
  const YX2 = 760, YB2 = transform('yel', BITE + 24, YBX, YX2, 1, { style: 'grow' });
  key('yel', YB2, stance('yel', YX2, 1), 0);
  key('yel', YB2 + 4, { mouth: 'happy with theeth', eyes: 'normal' }, 0);
  const GRB = ssm + 12;
  FOX.push({ f0: GRB - 8, f1: GRB, a: [FOOT - 170], b: [SBX - 250], face: 1, run: true }, { f0: GRB, at: [SBX - 250], face: 1 });
  key('skel', GRB - 4, { mouth: 'puzzlement', eyes: 'sad' }, 0);
  sfx('chomp', GRB, { who: 'skel', gain: 0.8 }); sfx('scared', GRB + 2, { who: 'skel', gain: 0.8 });
  MOUTH.push({ f0: GRB, f1: NF, who: 'skel' });
  const OFF = GRB + 8, GONE = OFF + 28;
  FOX.push({ f0: OFF, f1: GONE, a: [SBX - 250], b: [2400], face: 1, run: true, ease: 'in' });
  for (let f = OFF; f < GONE; f += 4) sfx('step', f, { x: 1700, gain: 0.35, pitch: 1.4 });
  yip(OFF + 2, 0.8);
  LATE.push(() => { for (let g = GRB; g <= GONE; g++) { const q = foxAt(g, ST.stateAt(g)); const m = FX_MOUTH(q); move('skel', g, { x: m[0] + 60, y: m[1] + 110 }, 'lin'); } });
  sfx('ref:laugh', OFF + 6, { who: 'yel', gain: 0.85, pitch: 1.45 });
  chuckle('yel', OFF + 6, OFF + 24, { mouth: 'happy with theeth' });

  // ---- 21–25 с: в центр, руки вверх
  const WIN = victory('yel', OFF + 24, YX2, { n: 9, stride: 90 });
  FOX.sort((a, b) => a.f0 - b.f0);
  for (const fn of LATE) fn();
  window.T = { ON, HIT, YB, T1, H2, CH, H3, SB, B4, H4, FB, ysm, KK, BITE, ssm, YB2, GRB, OFF, WIN };
};
// точка рта лисы (как в FX.mcFox)
function FX_MOUTH(q) {
  const s = XS, L = s * 0.2 * (1 - q.sit * 0.6), bw = s * 0.72, bh = s * 0.32, top = -L - bh, hs = s * 0.32, hx = bw / 2 - hs * 0.15, hy = top - hs * 0.45;
  return [q.x + q.face * (hx + hs * 1.38), q.y + hy + hs * 0.6];
}

// ------------------------------------------------------------------ рисование
const foxFront = (f) => { const c = segAt(FOX, f); return c && c.f1 && (c.dive || c.arc); };
function drawFox(ctx, f, S) { const q = foxAt(f, S); if (q) FX.mcFox(ctx, q.x, q.y, XS, q.face, q.phase, q.rot, 1, q.sit); }
function berryAt(b, f, S) {
  const c = segAt(b.segs, f);
  if (!c) return null;
  if (c.at) return c.at;
  if (c.on) { const t = target(`${c.on}:${c.part}`, S); return [t[0], t[1] - (c.part === 'top' ? 10 : 0)]; }
  const u = E.clamp((f - c.f0) / (c.f1 - c.f0), 0, 1), a = P(c.a, c.f0, statesAt(c.f0)), q = P(c.b, f, S);
  return [E.lerp(a[0], q[0], u), E.lerp(a[1], q[1], u) - Math.sin(Math.PI * u) * (c.arc || 0)];
}
ST.hooks.beforeChars.push((ctx, f, S, CAM) => { ctx.setTransform(...CAM); if (!foxFront(f)) drawFox(ctx, f, S); });
ST.hooks.afterChars.push((ctx, f, S, CAM) => {
  ctx.setTransform(...CAM);
  if (foxFront(f)) drawFox(ctx, f, S);
  for (const b of BER) { const p = berryAt(b, f, S); if (p) { FX.berry(ctx, p[0], p[1], 20); FX.berry(ctx, p[0] + 18, p[1] - 10, 16); } }
});

ST.start(BIG);
