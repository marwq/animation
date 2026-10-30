// Ролик 29: Тыква (Хэллоуин) — Розовая (слева) против Скелета (справа), 25 с, 24 кадра/с. Драка без ударов:
// большая тыква-фонарь из майнкрафта: в неё можно спрятаться, подкрасться и выпрыгнуть с «БУ!»
// В начале — считалка «3, 2, 1, FIGHT». Музыка превращения — один раз. Фон — плитки: салатовая стена, фиолетовый пол, звёзды.
//
//   0–2.2 с   считалка: шарик-Розовая и шарик-Скелет неподвижно стоят друг напротив друга
//   2.2–5.4 с с неба падает тыква-фонарь; Скелет запрыгивает в неё, тыква крадётся к Розовой — «БУ!» — Розовая
//             подпрыгивает от страха и шлёпается
//   5.4–6.8 с Розовая «растёт» под музыку — Скелет влюблён
//   7–12 с    она берёт тыкву за хвостик и накрывает ею влюблённого шарика-Скелета, стучит — тыква в панике скачет,
//             опрокидывается, Скелет выкатывается
//   12–16 с   Скелет «растёт», надевает тыкву на голову, на цыпочках подкрадывается к отвернувшейся Розовой, стучит по
//             плечу — «БУ!» — она падает — «пуф»
//   16–20 с   Скелет хохочет — тыква слетает с головы; шарик-Розовая прячется в неё, Скелет наклоняется посмотреть —
//             «БУ!» — подпрыгивает от страха, падает — «пуф»
//   20–22 с   Розовая «растёт» снова; шарик-Скелет прячется в тыкву — она топает — тыква в панике ускакивает за край
//   22–25 с   Розовая в центре, руки вверх
'use strict';

const ST = Stage({
  name: '29 Розовая vs Скелет',
  frames: 600,
  intro: 'countdown-321',
  cast: {
    pink: { small: ['girl-verity-small', { bodyHeight: 300 }], big: ['girl-verity-big', { height: 730, splitFeet: true }],
      pivot: 337, voice: 1.35, vAngle: 50, lie: 55, color: '#ff4fc8', moods: { angry: 'angry theeth', grin: 'theeth smile', big: 'theeth smile' } },
    skel: { small: ['skeleton-verity-small', { scale: 0.455 }], big: ['skeleton-verity-big', { height: 730 }], pivot: 325,
      voice: 0.9, lie: 60, color: '#f3f1e6', moods: { angry: 'angry theeth', grin: 'happy with theeth', big: 'theeth smile' } },
  },
  order: ['skel', 'pink'],
  background: { theme: 'tiles', seed: 1029, wall: '#6fc22a', floor: '#b98cf7', motif: 'stars', sky: ['#3d9df2', '#d3efff'] },
  clouds: [[300, 90, 2.2, 1, 12], [900, 240, 1.6, 2, 15], [1300, 60, 2.5, 0, 10], [1750, 210, 1.7, 1, 17]],
});
const { FPS, NF, GROUND, C, key, move, ev, sfx, hop, tumble, laugh, tremble, transform, shrink, stance, walk, turn,
  slip, fallBack, victory, chuckle, hand, toRig, statesAt, target } = ST;
const P = (v, f, S) => (typeof v === 'function' ? v(f, S) : typeof v === 'string' ? target(v, S) : v);
function flap(f0, f1, gain = 0.6) {
  for (let f = f0; f < f1; f += 6) { key('skel', f, { b_B16: -30, b_B17: 30 }, 3); key('skel', f + 3, { b_B16: 46, b_B17: -46 }, 3, 'in'); }
  key('skel', f1, { b_B16: 0, b_B17: 0 }, 4);
  sfx('gust', f0, { who: 'skel', dur: f1 - f0, gain });
}

// ------------------------------------------------------------------ тыква
const PS = 330;               // сторона блока: шарик (≈300) прячется внутри целиком
const PUMP = [];              // {f0, at:[x,y], rot, over} | {f0, f1, a, b, arc, rot0, rot1, ease} | {f0, ball} | {f0, hang} | {f0, head}
const BUMP = [];              // [f, сила] — тыкву сплющило
const JIT = [];               // [f0, f1] — тыква дрожит
function segAt(segs, f) { let c = null; for (const s of segs) if (f >= s.f0) c = s; return c && !c.gone ? c : null; }
function pumpAt(f, S) {
  const c = segAt(PUMP, f);
  if (!c) return null;
  let sq = 1, dx = 0;
  for (const [g, k] of BUMP) if (f >= g && f < g + 8) sq = Math.min(sq, 1 - k * Math.sin(Math.PI * (f - g) / 8));
  for (const [a, b] of JIT) if (f >= a && f < b) dx = Math.sin(f * 2.9) * 6;
  if (c.at) return { x: c.at[0] + dx, y: c.at[1] ?? GROUND, rot: c.rot || 0, sq, over: c.over };
  if (c.ball) { const p = S[c.ball].p; return { x: p.x + dx, y: p.y, rot: (p.rot || 0) * Math.PI / 180 * 0.3, sq: sq * (p.sy || 1), over: true }; }
  if (c.hang) { if (S[c.hang].p.form !== 'big') return null; const h = C[c.hang].big.point(S[c.hang].st, 'handF'); return { x: h[0] + PS * 0.45 + dx, y: h[1] + PS * 0.5, rot: 0, sq, over: true }; }   // держит за бок
  if (c.head) { if (S[c.head].p.form !== 'big') return null; const h = target(c.head + ':head', S); return { x: h[0] + dx, y: h[1] + PS * 0.42, rot: (S[c.head].p.lean || 0) * Math.PI / 180 * 0.5, sq, over: true }; }
  const u = E.clamp((f - c.f0) / (c.f1 - c.f0), 0, 1), e = c.ease ? E.EASE[c.ease](u) : u, ex = c.easeX ? E.EASE[c.easeX](u) : e;
  const a = P(c.a, c.f0, statesAt(c.f0)), b = P(c.b, f, S);
  return { x: E.lerp(a[0], b[0], ex), y: E.lerp(a[1] ?? GROUND, b[1] ?? GROUND, e) - Math.sin(Math.PI * u) * (c.arc || 0), rot: E.lerp(c.rot0 || 0, c.rot1 || 0, e), sq: 1, over: true };
}
const pumpPt = (f) => { const p = pumpAt(f, statesAt(f)); return [p.x, p.y]; };
function thud(f, k = 0.18) { BUMP.push([f, k]); sfx('slam', f, { x: 960, gain: 0.45, pitch: 0.8 }); sfx('squish', f, { x: 960, gain: 0.3 }); }
// «БУ!»: голос и тряска
function boo(who, f, pitch = 1) {
  sfx('boo', f, { who, gain: 1.0, pitch }); ev('shake', { f: f + 1, amp: 12, n: 10 });
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
// шарик запрыгивает в тыкву сверху и прячется (alpha 0): тыква стоит в x
function hideIn(who, f0, f1, x0, x) {
  hopTo(who, f0, f1, x0, GROUND, x, GROUND, 430, { land: false });
  PUMP.push({ f0: Math.round((f0 + f1) / 2) + 1, at: [x, GROUND], over: true }, { f0: f1, ball: who });
  key(who, f1, { alpha: 0, sx: 1, sy: 1 }, 0);
  thud(f1, 0.2);
}
// шарик выскакивает из тыквы с «БУ!» — тыква улетает в b
function burstOut(who, f, x, b, o = {}) {
  key(who, f, { alpha: 1, mouth: 'angry theeth', eyes: 'angry', sx: 0.8, sy: 1.3 }, 0);
  key(who, f + 3, { sx: 1.25, sy: 1.2 }, 2); key(who, f + 8, { sx: 1, sy: 1 }, 4);
  hopTo(who, f, f + (o.n || 12), x, GROUND, o.x1 ?? x, GROUND, o.h || 160, { prep: 0, snd: false });
  const d = o.dur || 18;
  PUMP.push({ f0: f, f1: f + d, a: [x, GROUND], b, arc: o.arc || 420, rot0: 0, rot1: o.spin ?? -Math.PI * 2, easeX: o.easeX }, { f0: f + d, at: b, rot: 0 });
  sfx('whoosh', f, { x, dur: d - 4, gain: 0.5 }); thud(f + d, 0.15);
  boo(who, f + 1, o.pitch || 1);
}

const PX0 = 470, SX0 = 1450, MX = 960, GO = 54;
// ================================================================== 0–2.2 с: считалка, оба стоят
key('pink', 0, { form: 'small', x: PX0, y: GROUND, face: 1, look: 1, eyes: 'normal', mouth: 'smile normal', sx: 1, sy: 1, rot: 0, pivot: 0, alpha: 1 }, 0);
key('skel', 0, { form: 'small', x: SX0, y: GROUND, face: -1, look: 1, eyes: 'normal', mouth: 'smile normal', sx: 1, sy: 1, rot: 0, pivot: 0, alpha: 1 }, 0);

const BIG = () => {
  // ---- 2.2–5.4 с: тыква с неба — Скелет прячется в неё — тыква крадётся — «БУ!»
  PUMP.push({ f0: GO, f1: GO + 8, a: [MX + 50, -420], b: [MX, GROUND], ease: 'in2', rot0: 0.5, rot1: 0 }, { f0: GO + 8, at: [MX, GROUND] });
  sfx('whoosh', GO, { x: MX, dur: 8, gain: 0.5 }); thud(GO + 8, 0.25); ev('dust', { f: GO + 8, x: MX, r: 90, n: 6, snd: false });
  key('pink', GO + 3, { mouth: 'puzzlement' }, 0); key('skel', GO + 3, { mouth: 'puzzlement' }, 0);
  key('skel', GO + 10, { mouth: 'theeth smile', eyes: 'angry' }, 0);
  sfx('ref:grin-eee', GO + 10, { who: 'skel', gain: 0.4, pitch: 0.9 });
  flap(GO + 12, GO + 24, 0.4);
  hideIn('skel', GO + 12, GO + 24, SX0, MX);
  // крадётся: два коротких прыжка вместе с тыквой
  const X1 = 885, X2 = 810;
  hopTo('skel', GO + 30, GO + 38, MX, GROUND, X1, GROUND, 50, { snd: false });
  hopTo('skel', GO + 40, GO + 48, X1, GROUND, X2, GROUND, 50, { snd: false });
  sfx('step', GO + 38, { x: X1, gain: 0.5 }); sfx('step', GO + 48, { x: X2, gain: 0.5 });
  key('pink', GO + 32, { mouth: 'puzzlement', eyes: 'normal', sx: 0.96, sy: 1.04 }, 4);
  JIT.push([GO + 48, GO + 56]);
  const B1 = GO + 56;
  const PUX = 580;
  burstOut('skel', B1, X2, [PUX, GROUND], { h: 150, x1: 900, spin: Math.PI * 2, pitch: 0.85, dur: 16, arc: 460, easeX: 'in2' });
  flap(B1, B1 + 18, 0.5);
  // Розовая подпрыгивает от страха и шлёпается
  const PXF = 250;
  key('pink', B1 + 2, { mouth: 'puzzlement', eyes: 'sad', sx: 0.8, sy: 1.25 }, 1);
  move('pink', B1 + 1, { x: PX0, y: GROUND, rot: 0 }); move('pink', B1 + 9, { y: GROUND - 230, rot: -25 }, 'out2'); move('pink', B1 + 19, { y: GROUND, rot: 0 }, 'in2');
  move('pink', B1 + 19, { x: PXF }, 'out2');
  key('pink', B1 + 9, { sx: 1, sy: 1 }, 4);
  key('pink', B1 + 19, { sx: 1.4, sy: 0.66 }, 1); key('pink', B1 + 23, { sx: 0.92, sy: 1.08 }, 3); key('pink', B1 + 27, { sx: 1, sy: 1 }, 3);
  sfx('scared', B1 + 3, { who: 'pink', gain: 0.8 }); sfx('bonk', B1 + 19, { who: 'pink', gain: 0.6 });
  ev('stars', { who: 'pink', f0: B1 + 20, f1: B1 + 36 });
  key('skel', B1 + 14, { mouth: 'happy with theeth', eyes: 'normal' }, 0);
  sfx('ref:laugh', B1 + 14, { who: 'skel', gain: 0.85, pitch: 0.85 });
  laugh('skel', B1 + 16, B1 + 32);

  // ---- 5.4–6.8 с: Розовая «растёт» — Скелет влюблён
  const PX = 400;
  key('pink', B1 + 22, { eyes: 'angry', mouth: 'angry theeth' }, 0);
  const PB = transform('pink', B1 + 24, PXF, PX, 1, { style: 'grow', love: 'skel', loveDur: 24 });
  key('pink', PB, stance('pink', PX, 1), 0);
  key('pink', PB + 4, { mouth: 'theeth smile', eyes: 'angry' }, 0);

  // ---- 7–12 с: берёт тыкву за хвостик, накрывает влюблённого Скелета, стучит — тыква в панике, опрокидывается
  const SX1 = 640;
  const GR = PB + 12;
  key('pink', GR, { hitF: 1, hitFto: [PUX - PS * 0.45, GROUND - PS * 0.5], hitFfix: GR, lean: 10, hip: [0, toRig('pink', 40)] }, 6);
  hopTo('skel', GR + 4, GR + 13, 900, GROUND, SX1, GROUND, 120);
  flap(GR + 2, GR + 16, 0.3);
  PUMP.push({ f0: GR, f1: GR + 4, a: [PUX, GROUND], b: (f, S) => { const h = C.pink.big.point(S.pink.st, 'handF'); return [h[0] + PS * 0.45, h[1] + PS * 0.5]; } }, { f0: GR + 4, hang: 'pink' });
  sfx('pop', GR + 1, { who: 'pink', gain: 0.4, pitch: 0.7 });
  key('pink', GR + 6, { hitF: 0, lean: -4, hip: [0, 8], handF: hand('pink', 'F', 0.85, -0.75), mouth: 'happy with theeth' }, 6);
  const PL = GR + 20;
  key('pink', PL, { hitF: 1, hitFto: [SX1 - PS * 0.45, GROUND - PS * 0.5], hitFfix: PL, lean: 8 }, 6, 'in2');
  PUMP.push({ f0: PL, ball: 'skel' });
  key('skel', PL, { alpha: 0 }, 0);
  thud(PL, 0.22);
  key('pink', PL + 6, { ...stance('pink', PX, 1), hitF: 0, mouth: 'happy with theeth', eyes: 'normal' }, 6);
  sfx('ref:laugh', PL + 4, { who: 'pink', gain: 0.85, pitch: 1.35 });
  laugh('pink', PL + 6, PL + 20);
  // тук-тук
  const KN = PL + 22;
  key('pink', KN - 3, { hitF: 1, hitFto: [SX1 + 20, GROUND - PS - 30], hitFfix: KN - 3 }, 3);
  key('pink', KN, { hitFto: [SX1 + 20, GROUND - PS + 6], hitFfix: KN }, 2);
  key('pink', KN + 3, { hitFto: [SX1 + 20, GROUND - PS - 30], hitFfix: KN + 3 }, 2);
  key('pink', KN + 6, { hitFto: [SX1 + 20, GROUND - PS + 6], hitFfix: KN + 6 }, 2);
  key('pink', KN + 10, { hitF: 0 }, 4);
  sfx('bonk', KN, { x: SX1, gain: 0.45, pitch: 1.3 }); sfx('bonk', KN + 6, { x: SX1, gain: 0.45, pitch: 1.3 });
  BUMP.push([KN, 0.08], [KN + 6, 0.08]);
  JIT.push([KN + 6, KN + 14]);
  sfx('scared', KN + 8, { who: 'skel', gain: 0.6 });
  // тыква в панике скачет и опрокидывается — Скелет выкатывается
  hopTo('skel', KN + 14, KN + 22, SX1, GROUND, SX1 + 110, GROUND, 90);
  hopTo('skel', KN + 24, KN + 32, SX1 + 110, GROUND, SX1 + 190, GROUND, 120);
  const TP = KN + 33, PTX = SX1 + 260;
  PUMP.push({ f0: TP, f1: TP + 8, a: [SX1 + 190, GROUND], b: [PTX, GROUND], arc: 40, rot0: 0, rot1: Math.PI / 2, ease: 'in2' }, { f0: TP + 8, at: [PTX, GROUND], rot: Math.PI / 2 });
  thud(TP + 8, 0.12);
  key('skel', TP + 6, { alpha: 1, mouth: 'puzzlement', eyes: 'sad' }, 0);
  const SBX = PTX + 200;
  tumble('skel', TP + 6, TP + 20, SX1 + 190, SBX, 70, 1, { stars: 22 });
  sfx('dizzy', TP + 20, { who: 'skel', dur: 16, gain: 0.5 });
  chuckle('pink', TP + 4, TP + 24, { mouth: 'happy with theeth' });

  // ---- 12–16 с: Скелет «растёт», надевает тыкву, подкрадывается — тук по плечу — «БУ!» — Розовая падает — «пуф»
  key('skel', TP + 20, { eyes: 'angry', mouth: 'angry theeth' }, 0);
  const SX = SBX + 30, SB = transform('skel', TP + 22, SBX, SX, -1, { style: 'grow' });
  key('skel', SB, stance('skel', SX, -1), 0);
  key('skel', SB + 4, { mouth: 'theeth smile', eyes: 'angry' }, 0);
  // Розовая отворачивается, довольная, руки в боки
  turn('pink', SB - 8, -1, PX);
  key('pink', SB - 4, { handF: hand('pink', 'F', 0.15, 0.25), handB: hand('pink', 'B', 0.15, 0.25), mouth: 'happy with theeth', eyes: 'normal', head: -6 }, 6);
  chuckle('pink', SB, SB + 44, { mouth: 'happy with theeth' });
  // берёт тыкву и надевает на голову
  const GR2 = SB + 8;
  key('skel', GR2, { hitF: 1, hitFto: [PTX + 60, GROUND - PS * 0.7], hitFfix: GR2, lean: 16, hip: [0, toRig('skel', 60)] }, 6);
  PUMP.push({ f0: GR2, f1: GR2 + 10, a: [PTX, GROUND], b: (f, S) => { const h = target('skel:head', S); return [h[0], h[1] + PS * 0.42]; }, arc: 80, rot0: Math.PI / 2, rot1: 0 }, { f0: GR2 + 10, head: 'skel' });
  key('skel', GR2 + 6, { hitF: 0, lean: 0, hip: [0, 8], handF: hand('skel', 'F', 0.3, -0.9), handB: hand('skel', 'B', 0.2, -0.9) }, 6);
  key('skel', GR2 + 14, { ...stance('skel', SX, -1), mouth: 'theeth smile' }, 6);
  sfx('swing', GR2 + 2, { who: 'skel', gain: 0.5 }); thud(GR2 + 10, 0.1);
  // на цыпочках
  const SX2 = 730;
  walk('skel', GR2 + 14, SX, SX2, 2, 10, -1);
  key('skel', GR2 + 14, { handF: hand('skel', 'F', 0.5, -0.2), handB: hand('skel', 'B', 0.4, -0.3), lean: 8 }, 6);
  sfx('step', GR2 + 22, { who: 'skel', gain: 0.25 }); sfx('step', GR2 + 32, { who: 'skel', gain: 0.25 });
  const TAP = GR2 + 38;
  key('skel', TAP, { hitF: 1, hitFto: 'pink:body', hitFfix: TAP }, 5);
  key('skel', TAP + 5, { hitF: 0, handF: hand('skel', 'F', 0.5, -0.2) }, 4);
  sfx('bonk', TAP, { who: 'pink', gain: 0.3, pitch: 1.6 });
  turn('pink', TAP + 4, 1, PX);
  key('pink', TAP + 7, { mouth: 'puzzlement', eyes: 'normal', head: 0, handF: hand('pink', 'F', 0.3, 0.6), handB: hand('pink', 'B', -0.3, 0.6) }, 3);
  const B2 = TAP + 10;
  key('skel', B2, { handF: hand('skel', 'F', 0.6, -0.85), handB: hand('skel', 'B', 0.45, -0.9), lean: 14, mouth: 'angry theeth' }, 3);
  boo('skel', B2, 0.8);
  key('pink', B2 + 2, { mouth: 'puzzlement', eyes: 'sad', lean: -14, head: -12, handF: hand('pink', 'F', 0.35, -0.9), handB: hand('pink', 'B', 0.25, -0.95) }, 2);
  sfx('scared', B2 + 3, { who: 'pink', gain: 0.9 });
  tremble('pink', B2 + 3, B2 + 10, PX, 5);
  const FB = fallBack('pink', B2 + 10, PX, 1, { n: 14, stars: 24 });
  const PBX = 220;
  const psm = shrink('pink', FB + 6, PBX, 1, { mouth: 'puzzlement', eyes: 'sad', smoke: 420 });
  key('pink', psm, { lean: 0, head: 0, hip: [0, 0], legF: null, legB: null, legFfk: 0, legBfk: 0, zB: null, rot: 0 }, 0);
  move('pink', psm, { x: PBX, y: GROUND, rot: 0 });
  ev('stars', { who: 'pink', f0: psm + 4, f1: psm + 14, snd: false });
  // Скелет хохочет — тыква слетает с головы
  key('skel', B2 + 10, { ...stance('skel', SX2, -1), mouth: 'happy with theeth', eyes: 'normal' }, 6);
  sfx('ref:laugh', B2 + 12, { who: 'skel', gain: 0.85, pitch: 0.85 });
  laugh('skel', B2 + 14, B2 + 40);
  key('skel', B2 + 20, { lean: -10, head: -14 }, 6);
  const PDX = 560, OFF = B2 + 26;
  PUMP.push({ f0: OFF, f1: OFF + 12, a: (f, S) => { const h = target('skel:head', S); return [h[0], h[1] + PS * 0.42]; }, b: [PDX, GROUND], arc: 90, rot0: 0, rot1: -0.3, ease: 'in2' }, { f0: OFF + 12, at: [PDX, GROUND] });
  sfx('whoosh', OFF, { x: 700, dur: 10, gain: 0.4 }); thud(OFF + 12, 0.2);
  key('skel', OFF + 14, { lean: 0, head: 0, mouth: 'puzzlement', eyes: 'normal' }, 5);

  // ---- 16–20 с: шарик-Розовая прячется в тыкву — Скелет наклоняется — «БУ!» — падает — «пуф»
  key('pink', psm + 6, { eyes: 'angry', mouth: 'theeth smile' }, 0);
  const HID = Math.max(psm + 14, OFF + 16);
  hideIn('pink', HID - 12, HID, PBX, PDX);
  key('skel', HID + 2, { lean: 26, head: 16, hip: [0, toRig('skel', 90)], mouth: 'puzzlement', eyes: 'normal', handF: hand('skel', 'F', 0.35, 0.45), handB: hand('skel', 'B', 0.1, 0.5) }, 10);
  hopTo('pink', HID + 6, HID + 14, PDX, GROUND, PDX + 40, GROUND, 45, { snd: false });
  sfx('step', HID + 14, { x: PDX, gain: 0.5 });
  JIT.push([HID + 14, HID + 20]);
  const B3 = HID + 22;
  burstOut('pink', B3, PDX + 40, [1560, GROUND], { h: 330, x1: PDX + 20, n: 16, arc: 460, pitch: 1.25 });
  key('skel', B3 + 2, { mouth: 'puzzlement', eyes: 'sad', lean: -12, head: -14, hip: [0, 8], handF: hand('skel', 'F', 0.35, -0.95), handB: hand('skel', 'B', 0.2, -0.95), legFfk: 1, legBfk: 1, legF: [20, 40, 0], legB: [-10, 50, 0] }, 2);
  move('skel', B3 + 2, { x: SX2, y: GROUND }); move('skel', B3 + 9, { y: GROUND - 130 }, 'out2'); move('skel', B3 + 15, { y: GROUND }, 'in2');
  sfx('scared', B3 + 3, { who: 'skel', gain: 0.9 });
  const FB2 = fallBack('skel', B3 + 15, SX2, -1, { n: 14, stars: 24 });
  key('pink', B3 + 16, { mouth: 'happy with theeth', eyes: 'normal' }, 0);
  sfx('ref:laugh', B3 + 18, { who: 'pink', gain: 0.85, pitch: 1.35 });
  laugh('pink', B3 + 18, B3 + 28);
  const SBX2 = 1060;
  const ssm = shrink('skel', FB2 + 6, SBX2, -1, { mouth: 'puzzlement', eyes: 'sad', smoke: 420 });
  key('skel', ssm, { lean: 0, head: 0, hip: [0, 0], legF: null, legB: null, legFfk: 0, legBfk: 0, zB: null, rot: 0 }, 0);
  move('skel', ssm, { x: SBX2, y: GROUND, rot: 0 });
  ev('stars', { who: 'skel', f0: ssm + 4, f1: ssm + 14, snd: false });

  // ---- 20–22 с: Розовая «растёт» снова; шарик-Скелет прячется в тыкву — она топает — тыква ускакивает за край
  const PX2 = PDX, PB2 = transform('pink', B3 + 30, PDX + 20, PX2, 1, { style: 'grow' });
  key('pink', PB2, stance('pink', PX2, 1), 0);
  key('pink', PB2 + 4, { mouth: 'theeth smile', eyes: 'angry' }, 0);
  key('skel', ssm + 4, { face: 1, mouth: 'puzzlement', eyes: 'sad' }, 0);
  sfx('scared', ssm + 6, { who: 'skel', gain: 0.6 });
  flap(ssm + 8, ssm + 22, 0.4);
  hideIn('skel', ssm + 8, ssm + 20, SBX2, 1560);
  JIT.push([ssm + 20, PB2 + 20]);
  const SM = ST.stomp('pink', PB2 + 4, PX2, PX2 + 40, 1);
  JIT.push([SM, SM + 6]);
  let sx = 1560;
  [[SM + 4, 1760, 120], [SM + 14, 2000, 150], [SM + 24, 2350, 170]].forEach(([f, nx, h]) => { hopTo('skel', f, f + 9, sx, GROUND, nx, GROUND, h, { land: nx < 2100 }); sx = nx; });
  sfx('scared', SM + 5, { who: 'skel', gain: 0.7 });
  key('pink', SM + 6, { mouth: 'happy with theeth', eyes: 'normal' }, 0);
  sfx('ref:laugh', SM + 8, { who: 'pink', gain: 0.85, pitch: 1.35 });

  // ---- 22–25 с: в центр, руки вверх
  const WIN = victory('pink', SM + 14, PX2 + 40, { n: 9, stride: 120 });
  window.T = { B1, PB, GR, PL, KN, TP, SB, GR2, TAP, B2, FB, psm, OFF, HID, B3, FB2, ssm, PB2, SM, WIN };
};

// ------------------------------------------------------------------ рисование
function drawPump(ctx, f, S) {
  const p = pumpAt(f, S);
  if (!p) return;
  // свет из прорезей — мягкое оранжевое сияние вокруг тыквы
  const cx = p.x, cy = p.y - PS * p.sq / 2;
  const g = ctx.createRadialGradient(cx, cy, PS * 0.2, cx, cy, PS * 0.85);
  g.addColorStop(0, 'rgba(255,190,60,0.22)'); g.addColorStop(1, 'rgba(255,190,60,0)');
  ctx.fillStyle = g; ctx.fillRect(cx - PS, cy - PS, PS * 2, PS * 2);
  FX.pumpkinBlock(ctx, p.x, p.y, PS, p.rot, 'jack', p.sq);
}
ST.hooks.beforeChars.push((ctx, f, S, CAM) => {
  ctx.setTransform(...CAM);
  const p = pumpAt(f, S);
  if (p && !p.over) drawPump(ctx, f, S);
});
ST.hooks.afterChars.push((ctx, f, S, CAM) => {
  ctx.setTransform(...CAM);
  const p = pumpAt(f, S);
  if (p && p.over) drawPump(ctx, f, S);
});

ST.start(BIG);
