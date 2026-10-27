// Серия 2, ролик 19: Свинка — Розовая (слева) против Лорда (справа), 22 с, 24 кадра/с. Драка без ударов:
// свинья из майнкрафта бежит за морковкой на удочке — куда морковка, туда и свинья.
// Музыка превращения — один раз. Фон — грибной лес.
//
//   0–2 с     шарик-Розовая и шарик-Лорд неподвижно стоят друг напротив друга, середина пустая
//   2–3.8 с   из облачка — свинья; Лорд садится на неё с морковкой на удочке — свинья бежит и толкает Розовую
//   3.9–5.1 с Розовая «растёт» под музыку — Лорд влюблён и сползает со свиньи, удочка падает
//   5.2–9 с   она берёт удочку и вешает морковку над Лордом — свинья прыгает за морковкой и садится на него
//   9–12.8 с  Лорд «растёт», забирает удочку и закидывает морковку ей на голову — свинья прыгает ей на голову — «пуф»
//   12.8–16 с шарик-Розовая прыгает на свинью — свинья с перепугу несётся Лорду под ноги — он падает — «пуф»
//   16–22 с   Розовая «растёт» и в центре, руки вверх
'use strict';

const ST = Stage({
  name: '19 Розовая vs Лорд',
  frames: 528,
  cast: {
    pink: { small: ['girl-verity-small', { bodyHeight: 300 }], big: ['girl-verity-big', { height: 730, splitFeet: true }],
      pivot: 337, voice: 1.35, vAngle: 50, lie: 55, color: '#ff4fc8', moods: { angry: 'angry theeth', grin: 'theeth smile', big: 'theeth smile' } },
    lord: { small: ['lord-verity-small', { bodyHeight: 300 }], big: ['lord-verity-big', { height: 730 }], pivot: 337,
      voice: 1.0, lie: 55, color: '#ffe23a', ouch: ['ref:hit-ow', 1.0, 0.9] },
  },
  order: ['lord', 'pink'],
  background: { theme: 'mushroom', seed: 1019, sunX: 1500, sunY: 130 },
  clouds: [[150, 80, 2.4, 0, 12], [700, 220, 1.8, 1, 16], [1150, 70, 2.6, 2, 10], [1720, 250, 1.5, 0, 18]],
});
const { FPS, NF, GROUND, C, key, move, ev, sfx, hop, tumble, laugh, transform, shrink, stance, walk,
  fallBack, victory, chuckle, hand, statesAt, target } = ST;
const P = (v, f, S) => (typeof v === 'function' ? v(f, S) : typeof v === 'string' ? target(v, S) : v);

// ------------------------------------------------------------------ свинья, удочка, морковка
const PS = 290, PTOP = PS * 0.78, RL = 380;
const PIG = [];           // {f0, at:[x,y], face} | {f0, f1, a, b, arc, face, run} | {f0, on: who, face, dy}
const CHEW = [];          // [f0, f1]
const ROD = [];           // {f0, rider} | {f0, hand, a} | {f0, at:[x,y], a} | {f0, f1, a:[...], b, a0, a1}
const CAR = [];           // {f0, line, len} | {f0, on, dy} | {f0, at, rot} | {f0, gone}
let BITES = [];           // [f, bites]
function segAt(segs, f) { let c = null; for (const s of segs) if (f >= s.f0) c = s; return c && !c.gone ? c : null; }
function pigAt(f, S) {
  const c = segAt(PIG, f);
  if (!c) return null;
  const chew = CHEW.some(([a, b]) => f >= a && f < b) ? f / FPS : 0;
  if (c.at) return { x: c.at[0], y: c.at[1] ?? GROUND, face: c.face, phase: 0, chew, sq: 1 };
  if (c.on) { const t = target(`${c.on}:top`, S); return { x: t[0], y: t[1] + (c.dy || 0), face: c.face, phase: 0, chew, sq: 1 }; }
  const u = E.clamp((f - c.f0) / (c.f1 - c.f0), 0, 1), e = c.ease ? E.EASE[c.ease](u) : u;
  const a = P(c.a, c.f0, statesAt(c.f0)), b = P(c.b, f, S);
  return { x: E.lerp(a[0], b[0], e), y: E.lerp(a[1], b[1], e) - Math.sin(Math.PI * u) * (c.arc || 0), face: c.face,
    phase: c.run ? f * 0.95 : 0, chew, sq: c.arc ? 1 + 0.12 * Math.sin(Math.PI * u) : 1 };
}
// удочка: хват и угол (от вертикали, по часовой)
function rodAt(f, S) {
  const c = segAt(ROD, f);
  if (!c) return null;
  if (c.rider) { const p = S[c.rider].p; return { g: [p.x + p.face * 60, p.y - 130], a: p.face * 0.95 }; }
  if (c.hand) { if (S[c.hand].p.form !== 'big') return null; return { g: C[c.hand].big.point(S[c.hand].st, 'handF'), a: typeof c.a === 'function' ? c.a(f) : c.a }; }
  if (c.at) return { g: c.at, a: c.a };
  const u = E.clamp((f - c.f0) / (c.f1 - c.f0), 0, 1), a = P(c.a, c.f0, statesAt(c.f0)), b = P(c.b, f, S);
  return { g: [E.lerp(a[0], b[0], u), E.lerp(a[1], b[1], u) - Math.sin(Math.PI * u) * (c.arc || 0)], a: E.lerp(c.a0, c.a1, u) };
}
const tipOf = (r) => [r.g[0] + Math.sin(r.a) * RL, r.g[1] - Math.cos(r.a) * RL];
function carAt(f, S) {
  const c = segAt(CAR, f);
  if (!c) return null;
  if (c.line) { const r = rodAt(f, S); if (!r) return null; const t = tipOf(r), len = typeof c.len === 'function' ? c.len(f) : c.len; return { x: t[0], y: Math.min(GROUND - 70, t[1] + len), rot: 0, tip: t }; }
  const tied = () => { const r = c.tied && rodAt(f, S); return r ? tipOf(r) : null; };
  if (c.on) { const t = target(c.on, S); return { x: t[0], y: t[1] + (c.dy || 0), rot: c.rot || 0, tip: tied() }; }
  if (c.at) return { x: c.at[0], y: c.at[1], rot: c.rot || 0, tip: null };
  const u = E.clamp((f - c.f0) / (c.f1 - c.f0), 0, 1), a = P(c.a, c.f0, statesAt(c.f0)), b = P(c.b, f, S);
  return { x: E.lerp(a[0], b[0], u), y: E.lerp(a[1], b[1], u) - Math.sin(Math.PI * u) * (c.arc || 0), rot: 0, tip: tied() };
}
const bitesAt = (f) => { let b = 0; for (const [a, v] of BITES) if (f >= a) b = v; return b; };
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
// шарик сидит на свинье: позиции по кадрам досчитываются в конце
const RIDE = [];          // {who, f0, f1, dx}
function ride(who, f0, f1, dx = 20) { RIDE.push({ who, f0, f1, dx }); }

const PX0 = 560, LX0 = 1360, PGX = 1000;
// ================================================================== 0–2 с: неподвижная стойка
key('pink', 0, { form: 'small', x: PX0, y: GROUND, face: 1, look: 1, eyes: 'normal', mouth: 'smile normal', sx: 1, sy: 1, rot: 0, pivot: 0, alpha: 1 }, 0);
key('lord', 0, { form: 'small', x: LX0, y: GROUND, face: -1, look: 1, eyes: 'normal', mouth: 'smile normal', sx: 1, sy: 1, rot: 0, pivot: 0, alpha: 1 }, 0);

const BIG = () => {
  // ---- 2–3.8 с: свинья из облачка — Лорд на свинью с морковкой — свинья толкает Розовую
  const APP = 48;
  ev('smoke', { f: APP, who: 'lord', size: 340, dx: PGX - LX0, y: GROUND - 110 });
  sfx('poof', APP, { x: PGX, gain: 0.7 }); sfx('pop', APP + 3, { x: PGX, gain: 0.6 });
  PIG.push({ f0: APP + 3, at: [PGX, GROUND], face: -1 });
  key('pink', 50, { mouth: 'puzzlement' }, 0); key('lord', 50, { mouth: 'puzzlement' }, 0);
  key('lord', 54, { mouth: 'happy with theeth', eyes: 'angry' }, 0);
  sfx('ref:grin-eee', 54, { who: 'lord', gain: 0.4 });
  const ON = 64;
  hopTo('lord', 55, ON, LX0, GROUND, PGX + 20, GROUND - PTOP, 130);
  ROD.push({ f0: ON + 1, rider: 'lord' });
  CAR.push({ f0: ON + 1, line: true, len: 210 });
  sfx('pop', ON + 1, { who: 'lord', gain: 0.6 }); ev('twinkle', { f: ON + 2, at: [PGX - 300, GROUND - 300], n: 12, size: 40 });
  // свинья бежит за морковкой
  const RUN = ON + 4, BUMP = RUN + 10, PX1 = 880;
  PIG.push({ f0: RUN, f1: BUMP, a: [PGX, GROUND], b: [PX1, GROUND], face: -1, run: true });
  ride('lord', ON, BUMP + 40);
  sfx('step', RUN + 2, { x: 950, gain: 0.4 }); sfx('step', RUN + 6, { x: 920, gain: 0.4 });
  key('pink', BUMP - 4, { mouth: 'puzzlement', eyes: 'sad' }, 0);
  tumble('pink', BUMP, BUMP + 16, PX0, 340, 160, -1, { stars: 18, hurt: false });
  sfx('bonk', BUMP, { who: 'pink', gain: 0.8 });
  PIG.push({ f0: BUMP, f1: BUMP + 4, a: [PX1, GROUND], b: [PX1 - 15, GROUND], face: -1 }, { f0: BUMP + 4, at: [PX1 - 15, GROUND], face: -1 });
  key('lord', BUMP + 2, { mouth: 'happy with theeth', eyes: 'normal' }, 0);
  sfx('ref:laugh', BUMP + 2, { who: 'lord', gain: 0.85 });
  laugh('lord', BUMP + 4, BUMP + 18);

  // ---- 3.9–5.1 с: Розовая «растёт» — Лорд влюблён, сползает со свиньи; удочка падает
  const PX = 400;
  key('pink', BUMP + 14, { eyes: 'angry', mouth: 'angry theeth' }, 0);
  const PB = transform('pink', BUMP + 18, 340, PX, 1, { style: 'grow', love: 'lord', loveDur: 56 });
  key('pink', PB, stance('pink', PX, 1), 0);
  key('pink', PB + 4, { mouth: 'theeth smile', eyes: 'normal' }, 0);
  const OFF = PB + 4, LX1 = 1160;
  RIDE[0].f1 = OFF;
  hopTo('lord', OFF, OFF + 12, PX1 - 15 + 20, GROUND - PTOP, LX1, GROUND, 60);
  const GRIP = [760, GROUND - 14];
  ROD.push({ f0: OFF, f1: OFF + 10, a: (f, S) => rodAt(OFF - 1, statesAt(OFF - 1)).g, b: GRIP, arc: 60, a0: -0.95, a1: Math.PI / 2 }, { f0: OFF + 10, at: GRIP, a: Math.PI / 2 });
  CAR.push({ f0: OFF, at: [GRIP[0] + RL * 0.5, GROUND - 120], rot: 0 }, { f0: OFF + 10, at: [GRIP[0] + RL + 10, GROUND - 40], rot: -1.4 });
  sfx('bonk', OFF + 10, { x: GRIP[0], gain: 0.4, pitch: 1.2 });
  // свинья уходит вправо
  const PX2 = 1420;
  PIG.push({ f0: OFF + 4, f1: OFF + 24, a: [PX1 - 15, GROUND], b: [PX2, GROUND], face: 1, run: true }, { f0: OFF + 24, at: [PX2, GROUND], face: -1 });

  // ---- 5.2–9 с: она берёт удочку — морковка над Лордом — свинья прыгает и садится на него
  const PX3 = 640;
  walk('pink', PB + 6, PX, PX3, 2, 9, 1);
  const PICK = PB + 26;
  key('pink', PICK - 5, { lean: 26, hip: [0, ST.toRig('pink', 160)], head: 8 }, 5);
  key('pink', PICK, { hitF: 1, hitFto: GRIP, hitFfix: PICK }, 4);
  const AIM = 1.12;
  ROD.push({ f0: PICK, hand: 'pink', a: (f) => E.lerp(Math.PI / 2, AIM, E.clamp((f - PICK) / 8, 0, 1)) });
  CAR.push({ f0: PICK, line: true, len: (f) => E.lerp(60, 250, E.clamp((f - PICK) / 10, 0, 1)) });
  key('pink', PICK + 8, { ...stance('pink', PX3, 1), hitF: 0, handF: hand('pink', 'F', 0.75, -0.2), mouth: 'theeth smile', eyes: 'angry' }, 8);
  sfx('swing', PICK + 4, { who: 'pink', gain: 0.6 });
  key('lord', PICK + 10, { look: 1, mouth: 'puzzlement' }, 0);
  // свинья видит морковку
  const SEE = PICK + 14, JMP = SEE + 10, LAND = JMP + 10;
  PIG.push({ f0: SEE, f1: JMP, a: [PX2, GROUND], b: [LX1 + 170, GROUND], face: -1, run: true });
  sfx('step', SEE + 2, { x: 1300, gain: 0.4 }); sfx('step', SEE + 6, { x: 1250, gain: 0.4 });
  PIG.push({ f0: JMP, f1: LAND, a: [LX1 + 170, GROUND], b: (f, S) => target('lord:top', S), arc: 120, face: -1 }, { f0: LAND, on: 'lord', face: -1, dy: 6 });
  sfx('jump', JMP, { x: LX1, gain: 0.6 });
  key('lord', LAND - 6, { mouth: 'puzzlement', eyes: 'sad' }, 0);
  key('lord', LAND, { sx: 1.6, sy: 0.55 }, 2);
  sfx('slam', LAND, { who: 'lord', gain: 1.0 }); sfx('squish', LAND, { who: 'lord', gain: 0.7 });
  ev('shake', { f: LAND, amp: 12, n: 8 }); ev('dust', { f: LAND, x: LX1, r: 70, n: 6, snd: false });
  CHEW.push([LAND + 2, LAND + 22]);
  BITES.push([LAND + 4, 0.5]);
  for (let f = LAND + 4; f < LAND + 22; f += 6) sfx('chomp', f, { x: LX1, gain: 0.6 });
  key('pink', LAND + 2, { mouth: 'happy with theeth', eyes: 'normal' }, 0);
  sfx('ref:laugh', LAND + 2, { who: 'pink', gain: 0.85, pitch: 1.35 });
  chuckle('pink', LAND + 2, LAND + 24, { mouth: 'happy with theeth' });
  // свинья спрыгивает, Лорд расплющенный — «боинг»
  const OFFP = LAND + 22, PX4 = 1460;
  PIG.push({ f0: OFFP, f1: OFFP + 12, a: (f, S) => { const p = pigAt(OFFP - 1, statesAt(OFFP - 1)); return [p.x, p.y]; }, b: [PX4, GROUND], arc: 90, face: -1 }, { f0: OFFP + 12, at: [PX4, GROUND], face: -1 });
  key('lord', OFFP + 4, { sx: 1, sy: 1 }, 6, 'out'); sfx('boing', OFFP + 4, { who: 'lord', gain: 0.6 });
  ev('stars', { who: 'lord', f0: OFFP + 2, f1: OFFP + 12 });

  // ---- 9–12.8 с: Лорд «растёт», забирает удочку, закидывает морковку ей на голову — свинья прыгает — «пуф»
  key('lord', OFFP + 8, { eyes: 'angry', mouth: 'angry theeth' }, 0);
  const LB = transform('lord', OFFP + 10, LX1, LX1, -1, { style: 'grow' });
  key('lord', LB, stance('lord', LX1, -1), 0);
  key('lord', LB + 4, { mouth: 'happy with theeth', eyes: 'angry' }, 0);
  key('pink', LB - 2, { mouth: 'puzzlement', eyes: 'sad' }, 0);
  // выдёргивает удочку
  const YANK = LB + 6;
  key('lord', YANK - 4, { handF: hand('lord', 'F', 0.95, -0.3), lean: 10 }, 4);
  ROD.push({ f0: YANK, f1: YANK + 6, a: (f, S) => rodAt(YANK - 1, statesAt(YANK - 1)).g, b: (f, S) => C.lord.big.point(S.lord.st, 'handF'), a0: AIM, a1: -0.6 },
    { f0: YANK + 6, hand: 'lord', a: -0.6 });
  sfx('swing', YANK, { who: 'lord', gain: 0.8 });
  key('pink', YANK + 2, { handF: hand('pink', 'F', 0.4, 0.3), lean: 8 }, 4);
  // закидывает морковку ей на макушку
  const CAST = YANK + 10, HOOK = CAST + 8;
  key('lord', CAST - 4, { handF: hand('lord', 'F', -0.2, -0.95), lean: -8 }, 4);
  key('lord', CAST, { handF: hand('lord', 'F', 0.9, -0.5), lean: 10 }, 3, 'in2');
  ROD.push({ f0: CAST, hand: 'lord', a: (f) => E.lerp(0.4, -1.05, E.clamp((f - CAST + 4) / 6, 0, 1)) });
  sfx('whoosh', CAST, { x: 900, dur: 8, gain: 0.6 });
  CAR.push({ f0: CAST, f1: HOOK, a: (f, S) => { const k = carAt(CAST - 1, statesAt(CAST - 1)); return [k.x, k.y]; }, b: (f, S) => { const t = target('pink:top', S); return [t[0], t[1] - 70]; }, arc: 160, tied: true },
    { f0: HOOK, on: 'pink:top', dy: -70, tied: true });
  sfx('pop', HOOK, { who: 'pink', gain: 0.6 });
  key('lord', HOOK + 4, { ...stance('lord', LX1, -1), handF: hand('lord', 'F', 0.85, -0.45), mouth: 'happy with theeth', eyes: 'normal' }, 6);
  ROD.push({ f0: HOOK + 4, hand: 'lord', a: -1.05 });
  // свинья — к морковке у неё на голове
  const RUN2 = HOOK + 4, J2 = RUN2 + 12, L2 = J2 + 10;
  PIG.push({ f0: RUN2, f1: J2, a: [PX4, GROUND], b: [PX3 + 300, GROUND], face: -1, run: true });
  sfx('step', RUN2 + 3, { x: 1300, gain: 0.4 }); sfx('step', RUN2 + 8, { x: 1100, gain: 0.4 });
  key('pink', RUN2 + 6, { look: 1, mouth: 'puzzlement', eyes: 'sad', handF: hand('pink', 'F', 0.6, -0.6), handB: hand('pink', 'B', 0.4, -0.5), lean: -8 }, 4);
  PIG.push({ f0: J2, f1: L2, a: [PX3 + 300, GROUND], b: (f, S) => target('pink:top', S), arc: 220, face: -1 }, { f0: L2, on: 'pink', face: -1, dy: 10 });
  sfx('jump', J2, { x: PX3 + 300, gain: 0.6 });
  key('pink', L2, { sx: 1.5, sy: 0.6, lean: 0, head: 0 }, 2);
  sfx('slam', L2, { who: 'pink', gain: 1.0 }); sfx('squish', L2, { who: 'pink', gain: 0.7 });
  ev('shake', { f: L2, amp: 16, n: 10 }); ev('dust', { f: L2, x: PX3, r: 80, n: 7, snd: false });
  CAR.push({ f0: L2, gone: true });
  CHEW.push([L2 + 2, L2 + 34]);
  for (let f = L2 + 4; f < L2 + 26; f += 6) sfx('chomp', f, { x: PX3, gain: 0.6 });
  key('lord', L2 + 2, { mouth: 'happy with theeth' }, 0);
  sfx('ref:laugh', L2 + 2, { who: 'lord', gain: 0.85 });
  chuckle('lord', L2 + 2, L2 + 40, { mouth: 'happy with theeth' });
  const PBX = 560;
  const psm = shrink('pink', L2 + 10, PBX, 1, { mouth: 'puzzlement', eyes: 'sad', smoke: 420 });
  key('pink', psm, { lean: 0, head: 0, hip: [0, 0], legF: null, legB: null, rot: 0 }, 0);
  move('pink', psm, { x: PBX, y: GROUND, rot: 0 });
  ev('stars', { who: 'pink', f0: psm + 4, f1: psm + 16, snd: false });
  const PX5 = PX3 + 150;
  PIG.push({ f0: L2 + 10, f1: L2 + 18, a: (f, S) => { const p = pigAt(L2 + 9, statesAt(L2 + 9)); return [p.x, p.y]; }, b: [PX5, GROUND], ease: 'in2', face: -1 }, { f0: L2 + 18, at: [PX5, GROUND], face: -1 });
  sfx('land', L2 + 18, { x: PX5, gain: 0.6 });

  // ---- 12.8–16 с: шарик-Розовая на свинью — свинья несётся Лорду под ноги — он падает — «пуф»
  key('pink', psm + 4, { eyes: 'angry', mouth: 'theeth smile' }, 0);
  const ON2 = psm + 18;
  hopTo('pink', psm + 6, ON2, PBX, GROUND, PX5 + 20, GROUND - PTOP, 150, { land: false });
  key('pink', ON2, { sx: 1.3, sy: 0.75 }, 1); key('pink', ON2 + 4, { sx: 1, sy: 1 }, 3);
  sfx('land', ON2, { who: 'pink', gain: 0.6 });
  // свинья с перепугу разворачивается и несётся
  PIG.push({ f0: ON2 + 2, at: [PX5, GROUND], face: 1 });
  sfx('scared', ON2 + 2, { x: PX5, gain: 0.5, pitch: 1.4 });
  const GO = ON2 + 6, CR = GO + 10;
  PIG.push({ f0: GO, f1: CR, a: [PX5, GROUND], b: [LX1 - 60, GROUND], face: 1, run: true });
  ride('pink', ON2, CR + 18, 20);
  key('pink', GO, { mouth: 'happy with theeth' }, 0);
  key('lord', CR - 6, { mouth: 'puzzlement', eyes: 'sad' }, 0);
  const FB = fallBack('lord', CR, LX1, -1, { forward: true, n: 14, stars: 30 });
  sfx('bonk', CR, { who: 'lord', gain: 0.9 });
  ROD.push({ f0: CR + 2, f1: CR + 14, a: (f, S) => rodAt(CR + 1, statesAt(CR + 1)).g, b: [LX1 - 500, GROUND - 14], arc: 140, a0: -1.05, a1: -Math.PI / 2 }, { f0: CR + 14, at: [LX1 - 500, GROUND - 14], a: -Math.PI / 2 });
  const PX6 = 1560;
  PIG.push({ f0: CR, f1: CR + 18, a: [LX1 - 60, GROUND], b: [PX6, GROUND], face: 1, run: true }, { f0: CR + 18, at: [PX6, GROUND], face: 1 });
  const LBX = LX1 - 330;
  const lsm = shrink('lord', FB + 8, LBX, -1, { mouth: 'puzzlement', eyes: 'sad', smoke: 420 });
  key('lord', lsm, { lean: 0, head: 0, hip: [0, 0], legF: null, legB: null, zB: null, rot: 0 }, 0);
  move('lord', lsm, { x: LBX, y: GROUND, rot: 0 });
  ev('stars', { who: 'lord', f0: lsm + 4, f1: lsm + 14, snd: false });
  key('lord', lsm + 12, { face: -1 }, 0);
  sfx('scared', lsm + 12, { who: 'lord', gain: 0.6 });
  let lx = LBX;
  for (let k = 0; k < 3; k++) { const a = lsm + 14 + k * 9, nx = lx - 400; hop('lord', a, a + 8, lx, nx, 90, { prep: 1 }); lx = nx; }
  // Розовая спрыгивает со свиньи
  const PX7 = 1400, DOWN = CR + 18;
  hopTo('pink', DOWN, DOWN + 12, PX6 - 20, GROUND - PTOP, PX7, GROUND, 100);
  key('pink', DOWN + 12, { mouth: 'happy with theeth', eyes: 'normal' }, 0);
  sfx('ref:laugh', DOWN + 12, { who: 'pink', gain: 0.85, pitch: 1.35 });
  laugh('pink', DOWN + 14, DOWN + 18);

  // ---- Розовая «растёт» — в центр
  const PB2 = transform('pink', DOWN + 14, PX7, PX7 - 40, -1, { style: 'grow' });
  key('pink', PB2, stance('pink', PX7 - 40, -1), 0);
  key('pink', PB2 + 4, { mouth: 'happy with theeth' }, 0);
  const WIN = victory('pink', PB2 + 6, PX7 - 40, { n: 9, stride: 130 });
  // всадники — по кадрам
  for (const r of RIDE) for (let f = r.f0; f <= r.f1; f++) { const p = pigAt(f, ST.stateAt(f)); if (!p) continue; move(r.who, f, { x: p.x - p.face * r.dx, y: p.y - PTOP * p.sq + (p.phase ? Math.abs(Math.sin(p.phase)) * -10 : 0) }, 'lin'); }
  window.T = { ON, BUMP, PB, PICK, SEE, LAND, OFFP, LB, YANK, CAST, HOOK, L2, psm, ON2, CR, FB, lsm, DOWN, PB2, WIN };
};

// ------------------------------------------------------------------ рисование
function drawRodCar(ctx, f, S) {
  const r = rodAt(f, S), c = carAt(f, S);
  if (r) { const t = FX.fishingRod(ctx, r.g[0], r.g[1], r.a, RL); if (c && c.tip) FX.fishLine(ctx, t, [c.x, c.y], 6, 'none'); }
  if (c) FX.mcCarrot(ctx, c.x, c.y, 70, c.rot, bitesAt(f));
}
ST.hooks.beforeChars.push((ctx, f, S, CAM) => {
  ctx.setTransform(...CAM);
  const c = segAt(PIG, f);
  if (c && !c.on) { const p = pigAt(f, S); FX.mcPig(ctx, p.x, p.y, PS, p.face, p.phase, p.chew, p.sq); }
});
ST.hooks.afterChars.push((ctx, f, S, CAM) => {
  ctx.setTransform(...CAM);
  const c = segAt(PIG, f);
  if (c && c.on) { const p = pigAt(f, S); FX.mcPig(ctx, p.x, p.y, PS, p.face, p.phase, p.chew, p.sq); }
  drawRodCar(ctx, f, S);
});

ST.start(BIG);
