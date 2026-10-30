// Ролик 25 (бывш. 37): Панда — Розовая (слева) против Толстого (справа), 25 с, 24 кадра/с. Драка без ударов:
// панда из майнкрафта обожает бамбук — садится на того, у кого он, лазит по нему, как по стволу, и громко чихает.
// В начале — считалка «3, 2, 1, FIGHT». Музыка превращения — один раз. Фон — плитки: тёмно-синяя стена, коралловый пол, квадратики.
//
//   0–2.2 с   считалка: шарик-Розовая и Толстый неподвижно стоят друг напротив друга
//   2.2–4 с   прикатывается кувырком панда; Толстый подкидывает стебель бамбука Розовой на голову — панда
//             плюхается на Розовую и жуёт бамбук
//   4–5.2 с   Розовая «растёт» под музыку — Толстый влюблён
//   5.3–9 с   щекочет панде нос бамбуком — «а-а-апчхи!» — чих сдувает влюблённого Толстого кувырком
//   9–13 с    Толстый плюёт бамбуком — стебель торчит у Розовой на макушке — панда лезет по ней, как по
//             бамбуку, — Розовая шатается и падает — «пуф»
//   13–17 с   шарик-Розовая кладёт бамбук Толстому на голову — панда катится к нему и садится сверху —
//             Толстый в лепёшку
//   17–21 с   Розовая «растёт» снова, щекочет панде нос — громадный чих уносит Толстого за край
//   21–25 с   Розовая в центре, руки вверх; панда жуёт бамбук
'use strict';

const ST = Stage({
  name: '25 Розовая vs Толстый',
  frames: 600,
  intro: 'countdown-321',
  cast: {
    pink: { small: ['girl-verity-small', { bodyHeight: 300 }], big: ['girl-verity-big', { height: 730, splitFeet: true }],
      pivot: 337, voice: 1.35, vAngle: 50, lie: 55, color: '#ff4fc8', moods: { angry: 'angry theeth', grin: 'theeth smile', big: 'theeth smile' } },
    fat: { small: ['fat-verity-small', { bodyHeight: 450 }], pivot: 508, voice: 0.75, moods: { love: 'happy' } },
  },
  order: ['fat', 'pink'],
  background: { theme: 'tiles', seed: 1025, wall: '#3550c8', floor: '#ff9f80', motif: 'squares', sky: ['#3d9df2', '#d2eeff'] },
  clouds: [[150, 80, 2.4, 0, 12], [700, 220, 1.8, 1, 16], [1150, 70, 2.6, 2, 10], [1720, 250, 1.5, 0, 18]],
});
const { FPS, NF, GROUND, C, key, move, ev, sfx, hop, tumble, laugh, tremble, transform, shrink, stance, walk,
  slip, fallBack, victory, chuckle, hand, toRig, statesAt, target } = ST;
const P = (v, f, S) => (typeof v === 'function' ? v(f, S) : typeof v === 'string' ? target(v, S) : v);
ST.parts.fmouth = (ch, st) => E.apply(ch.eyeMatrix(st, 'puzzlement'), [611, 456]);
function fatOpen(f, k, n, extra = {}) { key('fat', f - n, { mouth: 'puzzlement' }, 0); key('fat', f, { mouthK: k, ...extra }, n, 'out'); }

// ------------------------------------------------------------------ панда, бамбук
const PS = 460, BL = 280;
const PANDA = [];         // {f0, at:[x], face, sit} | {f0, f1, a, b, arc, face, run, roll, ease} | {f0, on: who, face} | {f0, path: (f) => [x, y, rot], face}
const NOSE = [];          // [f0, f1] — морщит нос
const CHEW = [];          // [f0, f1]
const BAM = [];           // стебли: [{segs: {f0, hand: who, a} | {f0, f1, a, b, arc, spin, r0} | {f0, at, rot} | {f0, on: who, rot} | {f0, mouth: who} | {f0, gone}}]
const SNEEZE = [];        // {f, at, dir, size}
function segAt(segs, f) { let c = null; for (const s of segs) if (f >= s.f0) c = s; return c && !c.gone ? c : null; }
function pandaAt(f, S) {
  const c = segAt(PANDA, f);
  if (!c) return null;
  let nose = 0; for (const [a, b] of NOSE) if (f >= a && f < b) nose = Math.min(1, (f - a) / 8);
  const base = { face: c.face, nose, sit: c.sit || 0, phase: 0, rot: 0, sq: 1 };
  if (c.at) return { ...base, x: c.at[0], y: c.at[1] ?? GROUND };
  if (c.on) { const t = target(`${c.on}:top`, S); return { ...base, x: t[0] + (c.dx || 0), y: t[1] + (c.dy ?? 30), sit: 1 }; }
  if (c.path) { const [x, y, rot] = c.path(f, S); return { ...base, x, y, rot }; }
  const u = E.clamp((f - c.f0) / (c.f1 - c.f0), 0, 1), e = c.ease ? E.EASE[c.ease](u) : u;
  const a = P(c.a, c.f0, statesAt(c.f0)), b = P(c.b, f, S);
  return { ...base, x: E.lerp(a[0], b[0], e), y: E.lerp(a[1] ?? GROUND, b[1] ?? GROUND, e) - Math.sin(Math.PI * u) * (c.arc || 0),
    phase: c.run ? f * 0.8 : 0, rot: c.roll ? -c.face * u * Math.PI * 2 * c.roll : 0 };
}
const pandaPt = (f) => { const q = pandaAt(f, statesAt(f)); return [q.x, q.y]; };
const pandaNose = (f, S) => { const q = pandaAt(f, S), hs = PS * 0.42, bw = PS * 0.78, L = PS * 0.22 * (1 - q.sit * 0.5), bh = PS * 0.46, top = -L - bh; return [q.x + q.face * (bw / 2 - hs * 0.3 + hs * 1.16), q.y + top - hs * 0.4 + hs * 0.6]; };
function bamAt(b, f, S) {
  const c = segAt(b.segs, f);
  if (!c) return null;
  if (c.at) return { x0: c.at[0], y0: c.at[1], rot: c.rot };
  if (c.hand) {
    if (S[c.hand].p.form !== 'big') return null;
    const h = C[c.hand].big.point(S[c.hand].st, 'handF');
    if (c.aim) { const t = c.aim(f, S), a = Math.atan2(t[1] - h[1], t[0] - h[0]); return { x0: h[0] - Math.cos(a) * 40, y0: h[1] - Math.sin(a) * 40, rot: a, len: Math.min(560, Math.hypot(t[0] - h[0], t[1] - h[1]) + 40) }; }
    return { x0: h[0] - Math.cos(c.a) * 40, y0: h[1] - Math.sin(c.a) * 40, rot: c.a };
  }
  if (c.on) { const t = target(`${c.on}:top`, S); return { x0: t[0], y0: t[1] + 40, rot: c.rot }; }
  if (c.mouth) { const m = target(`${c.mouth}:fmouth`, S); return { x0: m[0] + 60, y0: m[1], rot: Math.PI }; }
  const u = E.clamp((f - c.f0) / (c.f1 - c.f0), 0, 1), a = P(c.a, c.f0, statesAt(c.f0)), q = P(c.b, f, S);
  return { x0: E.lerp(a[0], q[0], u), y0: E.lerp(a[1], q[1], u) - Math.sin(Math.PI * u) * (c.arc || 0), rot: (c.r0 || 0) + u * (c.spin || 0) };
}
function bam(segs) { const b = { segs }; BAM.push(b); return b; }
function achoo(f, at, dir, size = 1) {
  NOSE.push([f - 14, f]);
  sfx('sneeze', f - 12, { x: 960, gain: 0.9 + size * 0.1, pitch: 0.8 });
  SNEEZE.push({ f, at, dir, size });
  sfx('gust', f, { x: 960, dur: 14 * size, gain: 0.8 }); ev('shake', { f, amp: 10 * size, n: 8 });
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
const LATE = [];

const PX0 = 470, FX0 = 1450, MX = 960, GO = 54;
// ================================================================== 0–2.2 с: считалка, оба стоят
key('pink', 0, { form: 'small', x: PX0, y: GROUND, face: 1, look: 1, eyes: 'normal', mouth: 'smile normal', sx: 1, sy: 1, rot: 0, pivot: 0, alpha: 1 }, 0);
key('fat', 0, { form: 'small', x: FX0, y: GROUND, face: -1, look: 1, eyes: 'normal', mouth: 'smile normal', sx: 1, sy: 1, rot: 0, pivot: 0, mouthK: 1 }, 0);

const BIG = () => {
  // ---- 2.2–4 с: панда прикатывается — Толстый подкидывает бамбук Розовой на голову — панда садится на Розовую
  const AX = 1000;
  PANDA.push({ f0: GO, f1: GO + 16, a: [2200], b: [AX], face: -1, roll: 2, ease: 'out2' }, { f0: GO + 16, at: [AX], face: -1, sit: 1 });
  sfx('slide', GO, { x: 1500, gain: 0.5, pitch: 0.7 }); sfx('land', GO + 16, { x: AX, gain: 0.6, pitch: 0.7 });
  key('pink', GO + 4, { mouth: 'puzzlement' }, 0); key('fat', GO + 4, { mouth: 'puzzlement' }, 0);
  key('fat', GO + 14, { mouth: 'theeth smile', eyes: 'angry' }, 0);
  sfx('ref:grin-eee', GO + 14, { who: 'fat', gain: 0.4, pitch: 0.8 });
  const TS = GO + 20, ON = TS + 12;
  ev('smoke', { f: TS - 4, who: 'fat', size: 200, dx: -60, y: GROUND - 300 }); sfx('pop', TS - 2, { who: 'fat', gain: 0.5 });
  key('fat', TS - 3, { sx: 1.2, sy: 0.85 }, 2); key('fat', TS, { sx: 0.88, sy: 1.12 }, 2); key('fat', TS + 4, { sx: 1, sy: 1 }, 3);
  sfx('swing', TS, { who: 'fat', gain: 0.6 });
  const B1 = bam([{ f0: TS - 2, f1: TS + 12, a: [FX0 - 80, GROUND - 300], b: 'pink:top', arc: 260, spin: -8, r0: -1.2 }, { f0: ON, on: 'pink', rot: -Math.PI / 2 - 0.2 }]);
  sfx('bonk', ON, { who: 'pink', gain: 0.6, pitch: 1.4 });
  key('pink', ON + 2, { look: 1, mouth: 'puzzlement', eyes: 'normal' }, 0);
  // панда — к Розовой и плюх!
  const JP = ON + 4, SIT = JP + 14;
  PANDA.push({ f0: JP, f1: SIT, a: [AX], b: (f, S) => { const t = target('pink:top', S); return [t[0], t[1] + 30]; }, arc: 200, face: -1 }, { f0: SIT, on: 'pink', face: -1, dy: 40 });
  sfx('jump', JP, { x: AX, gain: 0.6, pitch: 0.7 }); sfx('whoosh', JP + 2, { x: 800, dur: 12, gain: 0.5 });
  key('pink', SIT, { sx: 1.75, sy: 0.42, mouth: 'puzzlement', eyes: 'sad' }, 1);
  sfx('slam', SIT, { who: 'pink', gain: 1.0 }); sfx('squish', SIT, { who: 'pink', gain: 0.7 });
  ev('shake', { f: SIT, amp: 14, n: 8 }); ev('dust', { f: SIT, x: PX0, r: 80, n: 7, snd: false });
  B1.segs.push({ f0: SIT, gone: true });
  CHEW.push([SIT + 2, SIT + 20]); for (let f = SIT + 3; f < SIT + 20; f += 5) sfx('chomp', f, { x: PX0, gain: 0.5 });
  key('fat', SIT + 2, { mouth: 'happy', eyes: 'normal' }, 0);
  sfx('ref:laugh', SIT + 2, { who: 'fat', gain: 0.85, pitch: 0.75 });
  laugh('fat', SIT + 4, SIT + 22);
  // панда слезает
  const OFF = SIT + 20, AX2 = 820;
  PANDA.push({ f0: OFF, f1: OFF + 10, a: (f, S) => pandaPt(OFF - 1), b: [AX2], arc: 80, face: 1 }, { f0: OFF + 10, at: [AX2], face: 1, sit: 1 });
  key('pink', OFF + 2, { sx: 1, sy: 1 }, 6, 'out'); sfx('boing', OFF + 2, { who: 'pink', gain: 0.6 });
  ev('stars', { who: 'pink', f0: OFF, f1: OFF + 14 });

  // ---- 4–5.2 с: Розовая «растёт» — Толстый влюблён
  const PX = 480;
  key('pink', OFF + 6, { eyes: 'angry', mouth: 'angry theeth' }, 0);
  const PB = transform('pink', OFF + 7, PX0, PX, 1, { style: 'grow', love: 'fat', loveDur: 60 });
  key('pink', PB, stance('pink', PX, 1), 0);
  key('pink', PB + 4, { mouth: 'theeth smile', eyes: 'normal' }, 0);

  // ---- 5.3–9 с: щекочет панде нос бамбуком — «апчхи!» — чих сдувает влюблённого Толстого
  const FX1 = 1420;
  hop('fat', PB + 4, PB + 12, FX0, 1320, 60); hop('fat', PB + 12, PB + 20, 1320, FX1, 60);
  ev('hearts', { who: 'fat', f0: PB + 20, f1: PB + 50, snd: false });
  ev('smoke', { f: PB + 6, who: 'pink', size: 180, dx: 120, y: GROUND - 520 }); sfx('pop', PB + 8, { who: 'pink', gain: 0.5 });
  const B2 = bam([{ f0: PB + 8, hand: 'pink', a: -0.3 }]);
  key('pink', PB + 8, { handF: hand('pink', 'F', 0.9, -0.3) }, 4);
  // панда разворачивается к Толстому, Розовая подходит сзади
  PANDA.push({ f0: PB + 10, at: [AX2], face: 1, sit: 1 });
  const PX1 = PX;
  const TK = PB + 22;
  for (let i = 0; i < 3; i++) { const f = TK + i * 5; key('pink', f, { handF: hand('pink', 'F', 0.95, 0.25), lean: 14 }, 2); key('pink', f + 3, { handF: hand('pink', 'F', 0.85, 0.2), lean: 10 }, 2); }
  B2.segs.push({ f0: TK - 6, hand: 'pink', aim: (f, S) => pandaNose(f, S) });
  sfx('brush', TK, { x: AX2, gain: 0.5 }); sfx('brush', TK + 6, { x: AX2, gain: 0.5 });
  key('pink', TK, { mouth: 'theeth smile', eyes: 'angry' }, 0);
  const SN1 = TK + 22;
  achoo(SN1, (f, S) => pandaNose(f, S), 1, 1.3);
  key('fat', SN1 - 10, { mouth: 'puzzlement', eyes: 'sad' }, 0);
  const FX2 = 1660;
  tumble('fat', SN1 + 1, SN1 + 20, FX1, FX2, 200, -2, { stars: 20, hurt: false });
  sfx('scared', SN1 + 2, { who: 'fat', gain: 0.7 });
  key('pink', SN1 + 4, { lean: 0, mouth: 'happy with theeth', eyes: 'normal' }, 4);
  sfx('ref:laugh', SN1 + 6, { who: 'pink', gain: 0.85, pitch: 1.35 });
  chuckle('pink', SN1 + 6, SN1 + 30, { mouth: 'happy with theeth' });
  // бамбук отдаёт панде — та жуёт
  B2.segs.push({ f0: SN1 + 8, f1: SN1 + 16, a: (f, S) => { const b = bamAt(B2, SN1 + 7, statesAt(SN1 + 7)); return [b.x0, b.y0]; }, b: (f, S) => pandaNose(f, S), arc: 40, r0: 0.2, spin: 2.8 }, { f0: SN1 + 16, gone: true });
  CHEW.push([SN1 + 16, SN1 + 50]); for (let f = SN1 + 18; f < SN1 + 48; f += 6) sfx('chomp', f, { x: AX2, gain: 0.35 });

  // ---- 9–13 с: Толстый плюёт бамбуком — стебель у Розовой на макушке — панда лезет по ней — падает — «пуф»
  const SP = SN1 + 34;
  key('fat', SP - 8, { eyes: 'angry', mouth: 'theeth smile' }, 0);
  ev('smoke', { f: SP - 6, who: 'fat', size: 200, dx: -80, y: GROUND - 120 }); sfx('pop', SP - 4, { who: 'fat', gain: 0.5 });
  const B3 = bam([{ f0: SP - 4, mouth: 'fat' }]);
  fatOpen(SP, 1.9, 3);
  sfx('spit', SP, { who: 'fat', gain: 1.0 });
  const STK = SP + 14;
  B3.segs.push({ f0: SP, f1: STK, a: (f, S) => { const m = target('fat:fmouth', statesAt(SP)); return [m[0], m[1]]; }, b: 'pink:top', arc: 220, spin: 12, r0: Math.PI }, { f0: STK, on: 'pink', rot: -Math.PI / 2 });
  key('fat', SP + 4, { mouthK: 1, mouth: 'happy', eyes: 'normal' }, 3);
  sfx('bonk', STK, { who: 'pink', gain: 0.8, pitch: 1.3 });
  key('pink', STK, { head: 10, mouth: 'puzzlement', eyes: 'sad', lean: 0 }, 2);
  sfx('ref:laugh', STK + 2, { who: 'fat', gain: 0.85, pitch: 0.75 });
  laugh('fat', STK + 4, STK + 40);
  // панда лезет по Розовой
  const CL0 = STK + 8, CL1 = CL0 + 24;
  PANDA.push({ f0: CL0 - 6, at: [AX2], face: -1, sit: 0 },
    { f0: CL0, path: (f, S) => { const u = E.clamp((f - CL0) / (CL1 - CL0), 0, 1), b = target('pink:body', S), t = target('pink:top', S); return [b[0] - 30, E.lerp(GROUND + 60, t[1] + 330, u), -Math.PI / 2 + Math.sin(f * 0.7) * 0.06]; }, face: -1 });
  for (let f = CL0; f < CL1; f += 5) sfx('step', f, { who: 'pink', gain: 0.4, pitch: 0.8 });
  key('pink', CL0, { handF: hand('pink', 'F', 0.5, -0.9), handB: hand('pink', 'B', 0.3, -0.9), mouth: 'puzzlement', eyes: 'sad' }, 4);
  for (let f = CL0 + 4; f < CL1; f += 6) { key('pink', f, { lean: f % 12 < 6 ? 8 : -8 }, 3); }
  sfx('scared', CL0 + 2, { who: 'pink', gain: 0.7 });
  const FB = fallBack('pink', CL1, PX1, 1, { n: 14, stars: 26 });
  B3.segs.push({ f0: CL1, gone: true });
  PANDA.push({ f0: CL1, f1: CL1 + 14, a: (f, S) => pandaPt(CL1 - 1), b: [PX1 + 330], arc: 160, face: 1, roll: 1 }, { f0: CL1 + 14, at: [PX1 + 330], face: 1, sit: 1 });
  CHEW.push([CL1 + 14, CL1 + 40]);
  const PBX = 380;
  const psm = shrink('pink', FB + 6, PBX, 1, { mouth: 'puzzlement', eyes: 'sad', smoke: 420 });
  key('pink', psm, { lean: 0, head: 0, hip: [0, 0], legF: null, legB: null, zB: null, rot: 0 }, 0);
  move('pink', psm, { x: PBX, y: GROUND, rot: 0 });
  ev('stars', { who: 'pink', f0: psm + 4, f1: psm + 14, snd: false });

  // ---- 13–17 с: шарик-Розовая перепрыгивает Толстого и роняет бамбук ему на голову — панда катится и садится сверху
  const FX3 = 1300;
  hop('fat', STK + 30, STK + 38, FX2, FX3, 60);
  key('pink', psm + 6, { eyes: 'angry', mouth: 'theeth smile' }, 0);
  ev('smoke', { f: psm + 6, who: 'pink', size: 160, dx: 60, y: GROUND - 200 }); sfx('pop', psm + 8, { who: 'pink', gain: 0.5 });
  const B4 = bam([{ f0: psm + 8, at: [PBX + 40, GROUND - 120], rot: -1.2 }]);
  const JMP = psm + 12, OVER = JMP + 22, PX5 = 1680;
  hopTo('pink', JMP, OVER, PBX, GROUND, PX5, GROUND, 460);
  const DROPB = JMP + 14;
  B4.segs.push({ f0: JMP, f1: DROPB, a: [PBX + 40, GROUND - 120], b: (f, S) => { const p = S.pink.p; return [p.x - 20, p.y - 170]; }, r0: -1.2, spin: 0 },
    { f0: DROPB, f1: DROPB + 6, a: (f, S) => { const p = statesAt(DROPB).pink.p; return [p.x - 20, p.y - 170]; }, b: 'fat:top', r0: -1.2, spin: -0.4 }, { f0: DROPB + 6, on: 'fat', rot: -Math.PI / 2 });
  sfx('bonk', DROPB + 6, { who: 'fat', gain: 0.6, pitch: 1.3 });
  key('pink', OVER, { mouth: 'happy with theeth', eyes: 'normal', face: -1 }, 0);
  key('fat', DROPB + 6, { look: 1, mouth: 'puzzlement', eyes: 'normal' }, 0);
  const RL = DROPB + 8, PLOP = RL + 18;
  PANDA.push({ f0: RL, f1: PLOP - 8, a: [PX1 + 330], b: [FX3 - 320], face: 1, roll: 1.5 }, { f0: PLOP - 8, f1: PLOP, a: [FX3 - 320], b: (f, S) => { const t = target('fat:top', S); return [t[0], t[1] + 30]; }, arc: 120, face: 1 }, { f0: PLOP, on: 'fat', face: 1, dy: 60 });
  sfx('slide', RL, { x: 1000, gain: 0.5, pitch: 0.7 }); sfx('jump', PLOP - 8, { x: FX3, gain: 0.6, pitch: 0.7 });
  key('fat', PLOP, { sx: 2.0, sy: 0.35, mouth: 'puzzlement', eyes: 'sad' }, 2);
  sfx('slam', PLOP, { who: 'fat', gain: 1.0 }); sfx('squish', PLOP, { who: 'fat', gain: 0.8 });
  ev('shake', { f: PLOP, amp: 16, n: 10 }); ev('dust', { f: PLOP, x: FX3, r: 110, n: 8, snd: false });
  B4.segs.push({ f0: PLOP, gone: true });
  CHEW.push([PLOP + 2, PLOP + 26]); for (let f = PLOP + 3; f < PLOP + 26; f += 5) sfx('chomp', f, { x: FX3, gain: 0.5 });
  sfx('ref:laugh', PLOP + 2, { who: 'pink', gain: 0.85, pitch: 1.35 });
  laugh('pink', PLOP + 4, PLOP + 16);
  ev('stars', { who: 'fat', f0: PLOP + 6, f1: PLOP + 40, snd: false });

  // ---- 17–21 с: Розовая «растёт» снова, протягивает бамбук — панда спрыгивает к ней, Толстый пружиной улетает
  const PX2 = 1640, PB2 = transform('pink', PLOP + 14, PX5, PX2, -1, { style: 'grow' });
  key('pink', PB2, stance('pink', PX2, -1), 0);
  key('pink', PB2 + 4, { mouth: 'theeth smile', eyes: 'normal' }, 0);
  ev('smoke', { f: PB2 + 4, who: 'pink', size: 180, dx: -120, y: GROUND - 520 }); sfx('pop', PB2 + 6, { who: 'pink', gain: 0.5 });
  const B5 = bam([{ f0: PB2 + 6, hand: 'pink', a: Math.PI + 0.3 }]);
  key('pink', PB2 + 6, { handF: hand('pink', 'F', 0.9, 0.1), lean: 6 }, 6);
  const LEAP = PB2 + 18, AX4 = 1060;
  key('pink', LEAP - 2, { mouth: 'happy with theeth' }, 0);
  PANDA.push({ f0: LEAP - 6, on: 'fat', face: 1, dy: 80 }, { f0: LEAP, f1: LEAP + 12, a: (f, S) => pandaPt(LEAP - 1), b: [AX4], arc: 160, face: 1 }, { f0: LEAP + 12, at: [AX4], face: 1, sit: 1 });
  sfx('spring', LEAP, { x: FX3, gain: 1.0 }); sfx('jump', LEAP, { x: FX3, gain: 0.6, pitch: 0.7 });
  key('fat', LEAP - 6, { sx: 2.2, sy: 0.3 }, 3);
  key('fat', LEAP, { pivot: ST.CAST.fat.pivot, sx: 0.8, sy: 1.25, mouth: 'puzzlement', eyes: 'sad' }, 1);
  move('fat', LEAP, { x: FX3, y: GROUND, rot: 0 }); move('fat', LEAP + 8, { y: GROUND - 520 }, 'out2'); move('fat', LEAP + 24, { x: -350, y: GROUND - 260, rot: -900 }, 'lin');
  key('fat', LEAP + 6, { sx: 1, sy: 1 }, 4);
  sfx('scared', LEAP + 2, { who: 'fat', gain: 0.8 }); sfx('whoosh', LEAP + 2, { who: 'fat', dur: 22, gain: 0.7 });
  ev('twinkle', { f: LEAP + 22, at: [110, GROUND - 300], n: 22, size: 56 });
  B5.segs.push({ f0: LEAP + 12, f1: LEAP + 18, a: (f, S) => { const b = bamAt(B5, LEAP + 11, statesAt(LEAP + 11)); return [b.x0, b.y0]; }, b: (f, S) => pandaNose(f, S), r0: Math.PI + 0.3, spin: 0.5 }, { f0: LEAP + 18, gone: true });
  CHEW.push([LEAP + 18, NF]);
  for (let f = LEAP + 20; f < NF - 6; f += 8) sfx('chomp', f, { x: AX4, gain: 0.25 });
  key('pink', LEAP + 14, { ...stance('pink', PX2, -1), lean: 0 }, 6);
  sfx('ref:laugh', LEAP + 10, { who: 'pink', gain: 0.85, pitch: 1.35 });
  chuckle('pink', LEAP + 10, LEAP + 30, { mouth: 'happy with theeth' });
  ev('hearts', { who: 'pink', f0: LEAP + 20, f1: LEAP + 46, snd: false, part: 'top' });
  PANDA.push({ f0: LEAP + 40, f1: LEAP + 58, a: [AX4], b: [1520], face: 1, run: true }, { f0: LEAP + 58, at: [1520], face: -1, sit: 1 });
  const DOWN = PLOP, SN2 = LEAP;

  // ---- 21–25 с: в центр, руки вверх
  const WIN = victory('pink', LEAP + 30, PX2, { n: 9, stride: 110 });
  PANDA.sort((a, b) => a.f0 - b.f0);
  for (const fn of LATE) fn();
  window.T = { ON, SIT, OFF, PB, TK, SN1, SP, STK, CL0, CL1, FB, psm, JMP, OVER, PLOP, DOWN, PB2, SN2, WIN };
};

// ------------------------------------------------------------------ рисование
const pandaFront = (f) => { const c = segAt(PANDA, f); return c && (c.on || (c.f1 && c.arc)); };
function drawPanda(ctx, f, S) {
  const q = pandaAt(f, S);
  if (!q) return;
  FX.mcPanda(ctx, q.x, q.y, PS, q.face, q.phase, q.sit, 1, q.nose, q.rot);
  if (CHEW.some(([a, b]) => f >= a && f < b)) { const n = pandaNose(f, S); FX.bamboo(ctx, n[0] - q.face * 30, n[1] + 10, n[0] + q.face * (70 + Math.sin(f * 0.9) * 10), n[1] - 60, 16); }
}
ST.hooks.beforeChars.push((ctx, f, S, CAM) => { ctx.setTransform(...CAM); if (!pandaFront(f)) drawPanda(ctx, f, S); });
ST.hooks.afterChars.push((ctx, f, S, CAM) => {
  ctx.setTransform(...CAM);
  if (pandaFront(f)) drawPanda(ctx, f, S);
  for (const b of BAM) { const q = bamAt(b, f, S); if (q) { const L = q.len || BL; FX.bamboo(ctx, q.x0, q.y0, q.x0 + Math.cos(q.rot) * L, q.y0 + Math.sin(q.rot) * L, 20); } }
  for (const s of SNEEZE) {
    const u = (f - s.f) / (16 * s.size);
    if (u < 0 || u > 1) continue;
    const at = P(s.at, s.f, statesAt(s.f)), r = FX.rng(s.f);
    for (let i = 0; i < 16; i++) {
      const a = (r() - 0.5) * 0.7, v = (300 + 500 * r()) * s.size;
      FX.puff(ctx, at[0] + s.dir * Math.cos(a) * v * E.EASE.out2(u), at[1] + Math.sin(a) * v * 0.5 * u, (18 + 26 * r()) * (0.6 + u) * Math.min(1.4, s.size), (1 - u) * 0.9, '#ffffff', '#9aa4b2');
    }
    FX.wind(ctx, at[0], at[0] + s.dir * 1100 * s.size, GROUND, u, s.f);
  }
});

ST.start(BIG);
