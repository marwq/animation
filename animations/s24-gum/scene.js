// Серия 2, ролик 24: Жвачка — Розовая (слева) против Толстого (справа), 22 с, 24 кадра/с. Драка без ударов:
// синяя жвачка: огромный пузырь поднимает в воздух, лопается и облепляет, приклеивает к земле.
// Музыка превращения — один раз. Фон — у озера (озеро не в середине).
//
//   0–2 с     шарик-Розовая и Толстый неподвижно стоят друг напротив друга, середина пустая
//   2–4 с     с неба падает пачка жвачки; Толстый глотает её, надувает огромный пузырь — пузырь поднимает его,
//             он плывёт к Розовой, пузырь лопается — Толстый падает ей на голову
//   4.1–5.3 с Розовая «растёт» под музыку — жвачка с лица слетает, Толстый влюблён
//   5.4–9 с   влюблённый Толстый скачет к ней — она надувает пузырь ему в лицо, он целует пузырь — бах! —
//             Толстый весь в жвачке, прилип к земле, рвётся и пружинит назад
//   9–12.8 с  Толстый вырывается, надувает пузырь больше неё — она тыкает пальцем — бах! — жвачка на лице,
//             вслепую шагает, нога прилипает — падает — «пуф»
//   12.8–16 с шарик-Розовая надувает пузырь, взлетает, пузырь лопается — она падает на Толстого — он прилип,
//             жвачка-резинка выстреливает его за край
//   16–22 с   Розовая «растёт» и в центре, руки вверх
'use strict';

const ST = Stage({
  name: '24 Розовая vs Толстый',
  frames: 528,
  cast: {
    pink: { small: ['girl-verity-small', { bodyHeight: 300 }], big: ['girl-verity-big', { height: 730, splitFeet: true }],
      pivot: 337, voice: 1.35, vAngle: 50, lie: 55, color: '#ff4fc8', moods: { angry: 'angry theeth', grin: 'theeth smile', big: 'theeth smile' } },
    fat: { small: ['fat-verity-small', { bodyHeight: 450 }], pivot: 508, voice: 0.75, moods: { love: 'happy' } },
  },
  order: ['fat', 'pink'],
  background: { theme: 'lakeside', seed: 1024, sunX: 1500, sunY: 130 },
  clouds: [[150, 80, 2.4, 0, 12], [700, 220, 1.8, 1, 16], [1150, 70, 2.6, 2, 10], [1720, 250, 1.5, 0, 18]],
});
const { FPS, NF, GROUND, C, key, move, ev, sfx, hop, laugh, tremble, transform, shrink, stance, walk,
  fallBack, victory, chuckle, hand, statesAt, target } = ST;
const P = (v, f, S) => (typeof v === 'function' ? v(f, S) : typeof v === 'string' ? target(v, S) : v);
const FATMOUTH = (ch, st) => E.apply(ch.eyeMatrix(st, 'puzzlement'), [611, 456]);
ST.parts.fmouth = FATMOUTH;
function fatOpen(f, k, n, extra = {}) { key('fat', f - n, { mouth: 'puzzlement' }, 0); key('fat', f, { mouthK: k, ...extra }, n, 'out'); }

// ------------------------------------------------------------------ жвачка
const GC = '#3aa0ff', GL = '#0d4f8a';
const PACK = [];          // {f0, at} | {f0, f1, a, b, k0, k1, ease, spin} | {f0, gone}
const BUB = [];           // {who, part, f0, f1, r0, r1, ang, pop}
const SPL = [];           // {who, part, f0, f1, s, seed, dy}
const PUD = [];           // {f0, f1, x, w}
const STR = [];           // {f0, f1, a: [x, y], who, part}
const POPS = [];          // {f, at, r}
function segAt(segs, f) { let c = null; for (const s of segs) if (f >= s.f0) c = s; return c && !c.gone ? c : null; }
function bubAt(b, f, S) {
  if (f < b.f0 || f >= b.pop) return null;
  const u = E.EASE.out2(E.clamp((f - b.f0) / (b.f1 - b.f0), 0, 1)), r = E.lerp(b.r0, b.r1, u) * (1 + 0.02 * Math.sin(f * 0.8));
  const m = target(`${b.who}:${b.part}`, S);
  return { x: m[0] + Math.cos(b.ang) * r * 0.92, y: m[1] + Math.sin(b.ang) * r * 0.92, r };
}
function blow(who, part, f0, f1, r1, ang, pop, o = {}) {
  const b = { who, part, f0, f1, r0: 8, r1, ang, pop };
  BUB.push(b);
  sfx('inflate', f0, { who, dur: f1 - f0, gain: 0.7 });
  sfx('burst', pop, { who, gain: 1.0 }); sfx('pop', pop, { who, gain: 0.8 });
  ev('shake', { f: pop, amp: o.shake ?? 10, n: 8 });
  LATE.push(() => { const k = bubAt(b, pop - 1, ST.stateAt(pop - 1)); POPS.push({ f: pop, at: [k.x, k.y], r: k.r }); });
  return b;
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
const LATE = [];

const PX0 = 560, FX0 = 1360, KX = 1000;
// ================================================================== 0–2 с: неподвижная стойка
key('pink', 0, { form: 'small', x: PX0, y: GROUND, face: 1, look: 1, eyes: 'normal', mouth: 'smile normal', sx: 1, sy: 1, rot: 0, pivot: 0, alpha: 1 }, 0);
key('fat', 0, { form: 'small', x: FX0, y: GROUND, face: -1, look: 1, eyes: 'normal', mouth: 'smile normal', sx: 1, sy: 1, rot: 0, pivot: 0, mouthK: 1 }, 0);

const BIG = () => {
  // ---- 2–4 с: пачка жвачки — Толстый глотает — пузырь поднимает его — лопается — падает на Розовую
  PACK.push({ f0: 48, f1: 55, a: [KX, -150], b: [KX, GROUND - 32], ease: 'in2' }, { f0: 55, at: [KX, GROUND - 32] });
  sfx('whoosh', 48, { x: KX, dur: 7, gain: 0.5 }); sfx('land', 55, { x: KX, gain: 0.5, pitch: 1.2 });
  key('pink', 50, { mouth: 'puzzlement' }, 0); key('fat', 50, { mouth: 'puzzlement' }, 0);
  key('fat', 56, { mouth: 'theeth smile', eyes: 'angry' }, 0);
  sfx('ref:grin-eee', 56, { who: 'fat', gain: 0.4, pitch: 0.8 });
  const FX1 = 1180;
  hop('fat', 57, 64, FX0, FX1, 80);
  const SU = 66, GU = 71;
  fatOpen(SU, 1.9, 2);
  PACK.push({ f0: SU, f1: GU, a: [KX, GROUND - 32], b: 'fat:fmouth', k0: 1, k1: 0.3, ease: 'in2', spin: 3 }, { f0: GU, gone: true });
  sfx('suck', SU, { who: 'fat', dur: 6, gain: 0.7 }); sfx('gulp', GU, { who: 'fat', gain: 0.8 });
  key('fat', GU, { mouthK: 1, mouth: 'theeth smile' }, 2);
  for (let f = GU + 2; f < 78; f += 4) { key('fat', f, { sx: 1.05, sy: 0.95 }, 2); key('fat', f + 2, { sx: 0.97, sy: 1.03 }, 2); sfx('chomp', f, { who: 'fat', gain: 0.4 }); }
  // надувает — пузырь поднимает
  const B0 = 78, B1 = 92, POP1 = 110;
  key('fat', B0, { mouth: 'puzzlement', sx: 1, sy: 1, eyes: 'normal' }, 2);
  blow('fat', 'fmouth', B0, B1, 230, -1.95, POP1);
  move('fat', B1 - 4, { x: FX1, y: GROUND }); move('fat', POP1, { x: PX0 + 40, y: GROUND - 300 }, 'io');
  for (let f = B1; f < POP1; f += 6) key('fat', f, { rot: f % 12 < 6 ? 5 : -5, pivot: ST.CAST.fat.pivot }, 5);
  sfx('whoosh', B1, { who: 'fat', dur: 18, gain: 0.4 });
  key('pink', B1 + 4, { look: 1, mouth: 'puzzlement', eyes: 'sad' }, 0);
  key('fat', B1 + 4, { mouth: 'happy', eyes: 'normal' }, 0);
  sfx('ref:laugh', B1 + 6, { who: 'fat', gain: 0.7, pitch: 0.75 });
  // лопнул — падает на Розовую
  SPL.push({ who: 'fat', part: 'face', f0: POP1, f1: POP1 + 40, s: 220, seed: 3 });
  key('fat', POP1, { rot: 0, mouth: 'puzzlement', eyes: 'sad' }, 0);
  const HIT = POP1 + 8;
  move('fat', HIT, { x: PX0 + 30, y: GROUND - 115 }, 'in2');
  key('pink', HIT, { sx: 1.75, sy: 0.42 }, 1);
  key('fat', HIT, { sx: 1.45, sy: 0.75 }, 1);
  sfx('slam', HIT, { who: 'pink', gain: 1.0 }); sfx('squish', HIT, { who: 'pink', gain: 0.8 });
  ev('shake', { f: HIT, amp: 16, n: 10 }); ev('dust', { f: HIT, x: PX0, r: 70, n: 8, snd: false });
  SPL.push({ who: 'pink', part: 'face', f0: HIT, f1: 0, s: 170, seed: 5 });
  const FX2 = 1150;
  move('fat', HIT + 1, { x: PX0 + 30, y: GROUND - 115 });
  move('fat', HIT + 6, { y: GROUND - 300 }, 'out2');
  move('fat', HIT + 13, { y: GROUND }, 'in2');
  move('fat', HIT + 13, { x: FX2 }, 'lin');
  key('fat', HIT + 4, { sx: 0.9, sy: 1.12 }, 3);
  key('fat', HIT + 13, { sx: 1.25, sy: 0.82 }, 1); key('fat', HIT + 18, { sx: 1, sy: 1 }, 4);
  sfx('land', HIT + 13, { who: 'fat', gain: 0.7 });
  key('pink', HIT + 14, { sx: 1, sy: 1 }, 5, 'out'); sfx('boing', HIT + 14, { who: 'pink', gain: 0.6 });
  key('fat', HIT + 13, { mouth: 'happy', eyes: 'normal' }, 0);
  sfx('ref:laugh', HIT + 14, { who: 'fat', gain: 0.85, pitch: 0.75 });
  laugh('fat', HIT + 16, HIT + 30);

  // ---- 4.1–5.3 с: Розовая «растёт» — жвачка слетает, Толстый влюблён
  const PX = 600;
  key('pink', HIT + 12, { eyes: 'angry', mouth: 'angry theeth' }, 0);
  const PB = transform('pink', HIT + 13, PX0, PX, 1, { style: 'grow', love: 'fat', loveDur: 56 });
  SPL[1].f1 = PB - 2; POPS.push({ f: PB - 2, at: [PX0, GROUND - 200], r: 90 });
  key('pink', PB, stance('pink', PX, 1), 0);
  key('pink', PB + 4, { mouth: 'theeth smile', eyes: 'angry' }, 0);

  // ---- 5.4–9 с: Толстый скачет к ней — она надувает пузырь ему в лицо — он целует — бах! — прилип
  const FX3 = 1040;
  hop('fat', PB + 4, PB + 12, FX2, 1100, 70); hop('fat', PB + 12, PB + 20, 1100, FX3, 70);
  ev('hearts', { who: 'fat', f0: PB + 18, f1: PB + 48, snd: false });
  for (let f = PB + 6; f < PB + 18; f += 4) { key('pink', f, { head: f % 8 < 4 ? 5 : -3 }, 2); sfx('chomp', f, { who: 'pink', gain: 0.35 }); }
  key('pink', PB + 18, { head: 0, mouth: 'puzzlement' }, 2);
  const KB = PB + 20, KB1 = KB + 16, POP2 = KB1 + 8;
  blow('pink', 'lips', KB, KB1, 215, 0.05, POP2, { shake: 14 });
  key('fat', KB1 - 2, { sx: 0.92, sy: 1.08, mouth: 'happy' }, 3);
  sfx('kiss', KB1 + 2, { who: 'fat', gain: 0.8 });
  // бах — Толстый в жвачке
  SPL.push({ who: 'fat', part: 'body', f0: POP2, f1: 0, s: 400, seed: 7 });
  SPL.push({ who: 'pink', part: 'lips', f0: POP2, f1: POP2 + 20, s: 120, seed: 9 });
  key('fat', POP2, { mouth: 'puzzlement', eyes: 'sad', sx: 1.12, sy: 0.9 }, 1); key('fat', POP2 + 4, { sx: 1, sy: 1 }, 3);
  key('pink', POP2 + 4, { mouth: 'happy with theeth', eyes: 'normal' }, 0);
  sfx('ref:laugh', POP2 + 6, { who: 'pink', gain: 0.85, pitch: 1.35 });
  chuckle('pink', POP2 + 6, POP2 + 40, { mouth: 'happy with theeth' });
  // рвётся вправо — резинка тянет назад (дважды)
  STR.push({ f0: POP2 + 6, f1: POP2 + 34, a: [FX3, GROUND - 4], who: 'fat', part: 'body' });
  for (const [f, dx, h] of [[POP2 + 5, 200, 160], [POP2 + 18, 260, 200]]) {
    move('fat', f, { x: FX3, y: GROUND }); move('fat', f + 5, { x: FX3 + dx, y: GROUND - h }, 'out2'); move('fat', f + 11, { x: FX3, y: GROUND }, 'in2');
    key('fat', f + 11, { sx: 1.3, sy: 0.75 }, 1); key('fat', f + 14, { sx: 1, sy: 1 }, 3);
    sfx('jump', f, { who: 'fat', gain: 0.5 }); sfx('boing', f + 6, { who: 'fat', gain: 0.6 }); sfx('squish', f + 11, { who: 'fat', gain: 0.6 });
  }
  key('fat', POP2 + 6, { face: 1 }, 0);

  // ---- 9–12.8 с: Толстый вырывается — надувает огромный пузырь — она тыкает — бах! — на лице — падает — «пуф»
  const FREE = POP2 + 32;
  SPL[2].f1 = FREE; POPS.push({ f: FREE, at: [FX3, GROUND - 220], r: 200 });
  sfx('burst', FREE, { who: 'fat', gain: 0.8 });
  key('fat', FREE, { face: -1, mouth: 'theeth smile', eyes: 'angry' }, 0);
  hop('fat', FREE + 1, FREE + 9, FX3, FX3 + 60, 70);
  const FX4 = FX3 + 60;
  const GB = FREE + 10, GB1 = GB + 18, POKE = GB1 + 5;
  key('fat', GB, { mouth: 'puzzlement', eyes: 'normal' }, 2);
  blow('fat', 'fmouth', GB, GB1, 330, -2.45, POKE, { shake: 16 });
  sfx('ref:grin-eee', GB + 2, { who: 'pink', gain: 0.3, pitch: 1.3 });
  key('pink', GB1 - 4, { mouth: 'puzzlement', eyes: 'normal', lean: -6 }, 4);
  key('pink', POKE - 3, { handF: hand('pink', 'F', 0.95, -0.25), lean: 6, mouth: 'theeth smile', eyes: 'angry' }, 3, 'in2');
  sfx('flick', POKE - 1, { who: 'pink', gain: 0.6 });
  SPL.push({ who: 'pink', part: 'face', f0: POKE, f1: 0, s: 260, seed: 11 });
  PUD.push({ f0: POKE + 6, f1: 0, x: PX + 160, w: 260 });
  sfx('squish', POKE + 6, { x: PX + 160, gain: 0.6 });
  key('pink', POKE + 1, { lean: -14, head: -14, mouth: 'puzzlement', eyes: 'sad', handF: hand('pink', 'F', 0.4, -0.75), handB: hand('pink', 'B', 0.2, -0.75) }, 2);
  key('fat', POKE + 2, { mouth: 'happy', eyes: 'normal' }, 0);
  sfx('ref:laugh', POKE + 4, { who: 'fat', gain: 0.85, pitch: 0.75 });
  const FX5 = 1440;
  hop('fat', POKE + 4, POKE + 13, FX4, FX5, 90);
  laugh('fat', POKE + 16, POKE + 40);
  // шагает вслепую — нога в жвачке — падает вперёд
  walk('pink', POKE + 6, PX, PX + 100, 1, 10, 1, false);
  STR.push({ f0: POKE + 16, f1: POKE + 30, a: [PX + 160, GROUND - 4], who: 'pink', part: 'body', foot: true });
  const FB = fallBack('pink', POKE + 18, PX + 100, 1, { forward: true, n: 14, stars: 24 });
  sfx('scared', POKE + 18, { who: 'pink', gain: 0.6 });
  const PBX = 780;
  const psm = shrink('pink', FB + 6, PBX, 1, { mouth: 'puzzlement', eyes: 'sad', smoke: 420 });
  key('pink', psm, { lean: 0, head: 0, hip: [0, 0], legF: null, legB: null, zB: null, rot: 0 }, 0);
  move('pink', psm, { x: PBX, y: GROUND, rot: 0 });
  SPL[SPL.length - 1].f1 = psm;
  SPL.push({ who: 'pink', part: 'face', f0: psm, f1: psm + 20, s: 130, seed: 13 });
  ev('stars', { who: 'pink', f0: psm + 4, f1: psm + 14, snd: false });

  // ---- 12.8–16 с: шарик-Розовая надувает пузырь — взлетает — лопается — падает на Толстого — резинка выстреливает его
  key('pink', psm + 4, { eyes: 'angry', mouth: 'angry theeth' }, 0);
  const PB0 = psm + 8, PB1 = PB0 + 12, POP3 = PB1 + 14;
  blow('pink', 'face', PB0, PB1, 150, -Math.PI / 2, POP3);
  move('pink', PB1 - 4, { x: PBX, y: GROUND }); move('pink', POP3, { x: FX5 + 20, y: GROUND - 430 }, 'io');
  sfx('whoosh', PB1, { who: 'pink', dur: 14, gain: 0.4 });
  key('fat', PB1 + 4, { look: 1, mouth: 'puzzlement', eyes: 'sad' }, 0);
  const DROP = POP3 + 8;
  move('pink', DROP, { x: FX5 + 20, y: GROUND - 140 }, 'in2');
  key('fat', DROP, { sx: 1.8, sy: 0.45 }, 1);
  key('pink', DROP, { sx: 1.3, sy: 0.75, mouth: 'theeth smile' }, 1);
  sfx('slam', DROP, { who: 'fat', gain: 1.0 }); sfx('squish', DROP, { who: 'fat', gain: 0.8 });
  ev('shake', { f: DROP, amp: 16, n: 10 }); ev('dust', { f: DROP, x: FX5, r: 80, n: 8, snd: false });
  SPL.push({ who: 'fat', part: 'body', f0: DROP, f1: 0, s: 360, seed: 15, dy: 40 });
  const PX6 = 1100;
  hopTo('pink', DROP + 2, DROP + 14, FX5 + 20, GROUND - 140, PX6, GROUND, 150);
  key('pink', DROP + 14, { mouth: 'happy with theeth', eyes: 'normal' }, 0);
  sfx('ref:laugh', DROP + 14, { who: 'pink', gain: 0.85, pitch: 1.35 });
  laugh('pink', DROP + 16, DROP + 20);
  // Толстый поднимается — жвачка-резинка тянет — выстреливает за край
  const UP = DROP + 12, SNAP = UP + 10;
  key('fat', UP, { sx: 1, sy: 1 }, 4, 'out'); sfx('boing', UP, { who: 'fat', gain: 0.6 });
  STR.push({ f0: UP, f1: SNAP, a: [FX5, GROUND - 4], who: 'fat', part: 'body' });
  move('fat', UP, { x: FX5, y: GROUND }); move('fat', SNAP, { x: FX5 - 60, y: GROUND - 300 }, 'out2');
  key('fat', UP + 2, { sx: 0.8, sy: 1.25 }, 6);
  sfx('creak', UP, { who: 'fat', dur: 10, gain: 0.6 });
  move('fat', SNAP + 1, { x: FX5 - 60, y: GROUND - 300 });
  move('fat', SNAP + 4, { y: GROUND - 60 }, 'in2');
  key('fat', SNAP + 4, { sx: 1.4, sy: 0.7, pivot: ST.CAST.fat.pivot }, 1);
  sfx('spring', SNAP + 4, { who: 'fat', gain: 0.9 });
  move('fat', SNAP + 5, { x: FX5 - 60, y: GROUND - 60, rot: 0 });
  move('fat', SNAP + 20, { x: 2300, rot: 720 }, 'lin'); move('fat', SNAP + 20, { y: -300 }, 'out2');
  key('fat', SNAP + 8, { sx: 1, sy: 1 }, 3);
  sfx('whoosh', SNAP + 5, { who: 'fat', dur: 14, gain: 0.7 }); sfx('scared', SNAP + 6, { who: 'fat', gain: 0.8 });
  ev('twinkle', { f: SNAP + 18, at: [1800, 110], n: 22, size: 56 });

  // ---- Розовая «растёт» — в центр
  const PB2 = transform('pink', DROP + 18, PX6, PX6 - 40, 1, { style: 'grow' });
  key('pink', PB2, stance('pink', PX6 - 40, 1), 0);
  key('pink', PB2 + 4, { mouth: 'happy with theeth' }, 0);
  const WIN = victory('pink', PB2 + 6, PX6 - 40, { n: 9, stride: 95 });
  for (const fn of LATE) fn();
  window.T = { GU, B0, POP1, HIT, PB, KB, POP2, FREE, GB, POKE, FB, psm, PB0, POP3, DROP, SNAP, PB2, WIN };
};

// ------------------------------------------------------------------ рисование
function packAt(f, S) {
  const c = segAt(PACK, f);
  if (!c) return null;
  if (c.at) return { x: c.at[0], y: c.at[1], k: 1, rot: 0 };
  const u = E.clamp((f - c.f0) / (c.f1 - c.f0), 0, 1), e = c.ease ? E.EASE[c.ease](u) : u, a = P(c.a, c.f0, statesAt(c.f0)), b = P(c.b, f, S);
  return { x: E.lerp(a[0], b[0], e), y: E.lerp(a[1], b[1], e), k: E.lerp(c.k0 ?? 1, c.k1 ?? 1, u), rot: u * (c.spin || 0) };
}
ST.hooks.beforeChars.push((ctx, f, S, CAM) => {
  ctx.setTransform(...CAM);
  for (const p of PUD) if (f >= p.f0 && (!p.f1 || f < p.f1)) { ctx.save(); ctx.translate(p.x, GROUND + 4); ctx.scale(1, 0.25); FX.gumSplat(ctx, 0, 0, p.w * Math.min(1, (f - p.f0 + 2) / 6), 21, GC, GL); ctx.restore(); }
  const k = packAt(f, S);
  if (k) FX.gumPack(ctx, k.x, k.y, 150 * k.k, k.rot);
});
ST.hooks.afterChars.push((ctx, f, S, CAM) => {
  ctx.setTransform(...CAM);
  for (const s of STR) {
    if (f < s.f0 || f >= s.f1) continue;
    const t = target(`${s.who}:${s.part}`, S), b = s.foot ? [t[0], GROUND - 20] : [t[0], t[1] + 60];
    ctx.save(); ctx.lineCap = 'round';
    for (const [lw, c] of [[22, GL], [14, GC]]) { ctx.lineWidth = lw; ctx.strokeStyle = c; ctx.beginPath(); ctx.moveTo(s.a[0], s.a[1]); ctx.quadraticCurveTo((s.a[0] + b[0]) / 2 + 10, (s.a[1] + b[1]) / 2, b[0], b[1]); ctx.stroke(); }
    ctx.restore();
  }
  for (const s of SPL) {
    if (f < s.f0 || (s.f1 && f >= s.f1)) continue;
    const t = target(`${s.who}:${s.part}`, S);
    FX.gumSplat(ctx, t[0], t[1] + (s.dy || 0), s.s * Math.min(1, (f - s.f0 + 2) / 3), s.seed, GC, GL);
  }
  for (const b of BUB) { const k = bubAt(b, f, S); if (k) FX.gumBubble(ctx, k.x, k.y, k.r, GC, GL); }
  for (const p of POPS) {
    const u = (f - p.f) / 14;
    if (u < 0 || u > 1) continue;
    const r = FX.rng(p.f + 9);
    for (let i = 0; i < 12; i++) {
      const a = i / 12 * Math.PI * 2 + r() * 0.4, d = p.r * (0.6 + 0.8 * E.EASE.out2(u));
      FX.gumSplat(ctx, p.at[0] + Math.cos(a) * d, p.at[1] + Math.sin(a) * d + 200 * u * u, p.r * 0.32 * (1 - 0.5 * u), i + p.f, GC, GL);
    }
  }
});

ST.start(BIG);
