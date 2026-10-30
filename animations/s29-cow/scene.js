// Ролик 17 (бывш. 29): Корова — Розовая (слева) против Толстого (справа), 25 с, 24 кадра/с. Драка без ударов:
// корова из майнкрафта брызгает молоком, если на неё прыгнуть или сжать; ведро; погоня.
// В начале — считалка «3, 2, 1, FIGHT». Музыка превращения — один раз. Фон — плитки: зелёная стена, голубой пол, ромбы.
//
//   0–2.2 с   считалка: шарик-Розовая и Толстый неподвижно стоят друг напротив друга
//   2.2–4 с   с неба падает корова; Толстый прыгает ей на спину — «му-у!» — струя молока Розовой в лицо
//   3.8–5 с   Розовая «растёт» под музыку — Толстый влюблён
//   5.2–8.8 с поднимает корову, как волынку, и сжимает — молоко Толстому в лицо; влюблённый Толстый
//             раскрывает рот и пьёт — раздувается
//   8.8–12 с  Толстый выплёвывает молоко ей в лицо — она вслепую в молочную лужу — падает — «пуф»
//   12–17 с   шарик-Розовая скачет на корову — «му-у!» — корова гонится за Толстым; он спотыкается
//             о ведро — ведро ему на голову; вслепую тычется в корову — она подпрыгивает, Розовую
//             подбрасывает — корова садится на Толстого
//   17–21 с   Розовая «растёт» (без музыки), снимает корову; Толстый с ведром на голове удирает за край
//   21–25 с   Розовая в центре, руки вверх
'use strict';

const ST = Stage({
  name: '17 Розовая vs Толстый',
  frames: 600,
  intro: 'countdown-321',
  cast: {
    pink: { small: ['girl-verity-small', { bodyHeight: 300 }], big: ['girl-verity-big', { height: 730, splitFeet: true }],
      pivot: 337, voice: 1.35, vAngle: 50, lie: 55, color: '#ff4fc8', moods: { angry: 'angry theeth', grin: 'theeth smile', big: 'theeth smile' } },
    fat: { small: ['fat-verity-small', { bodyHeight: 450 }], pivot: 508, voice: 0.75, moods: { love: 'happy' } },
  },
  order: ['fat', 'pink'],
  background: { theme: 'tiles', seed: 1017, wall: '#2dbb62', floor: '#9ad4ff', motif: 'diamonds', sky: ['#3593ec', '#d2edff'] },
  clouds: [[150, 80, 2.4, 0, 12], [700, 220, 1.8, 1, 16], [1150, 70, 2.6, 2, 10], [1720, 250, 1.5, 0, 18]],
});
const { FPS, NF, GROUND, C, key, move, ev, sfx, hop, tumble, laugh, tremble, transform, shrink, stance, walk,
  slip, fallBack, victory, chuckle, hand, statesAt, target } = ST;
const P = (v, f, S) => (typeof v === 'function' ? v(f, S) : typeof v === 'string' ? target(v, S) : v);
ST.parts.fmouth = (ch, st) => E.apply(ch.eyeMatrix(st, 'puzzlement'), [611, 456]);
ST.parts.mid = (ch, st) => { const h = ch.point(st, 'head'), f = ch.point(st, 'face'); return [(h[0] + f[0]) / 2, (h[1] + f[1]) / 2]; };
function fatOpen(f, k, n, extra = {}) { key('fat', f - n, { mouth: 'puzzlement' }, 0); key('fat', f, { mouthK: k, ...extra }, n, 'out'); }

// ------------------------------------------------------------------ корова, ведро, молоко
const CS = 400, CTOP = CS * 0.82, MW = '#fbfbf4', ML = '#bdbdb2';
const COW = [];           // {f0, at:[x,y], face} | {f0, f1, a, b, arc, face, run, ease} | {f0, hands: who, face, dy}
const MOO = [];           // [f0, f1]
const CSQ = [];           // [f, сила] — сплющилась
const JETS = [];          // {f0, f1, from, to, arc}
const SPL = [];           // {who, part, f0, f1, s, seed, dy}
const PUD = [];           // {f0, f1, x, w, grow}
const BUCK = [];          // {f0, at:[x,y], rot} | {f0, f1, a, b, arc, rot0, rot1} | {f0, head: who}
const BLOB = [];          // {f0, f1, a, b, arc, r}
function segAt(segs, f) { let c = null; for (const s of segs) if (f >= s.f0) c = s; return c && !c.gone ? c : null; }
const handsMid = (who, S) => { const h = C[who].big.point(S[who].st, 'handF'), g = C[who].big.point(S[who].st, 'handB'); return [(h[0] + g[0]) / 2, Math.max(h[1], g[1])]; };
function cowAt(f, S) {
  const c = segAt(COW, f);
  if (!c) return null;
  let sq = 1;
  for (const [g, k] of CSQ) if (f >= g && f < g + 8) sq = Math.min(sq, 1 - k * Math.sin(Math.PI * (f - g) / 8));
  const moo = MOO.some(([a, b]) => f >= a && f < b) ? 1 : 0;
  const base = { face: c.face, sq, moo, phase: 0 };
  if (c.at) return { ...base, x: c.at[0], y: c.at[1] ?? GROUND };
  if (c.hands) { if (S[c.hands].p.form !== 'big') return null; const m = handsMid(c.hands, S); return { ...base, x: m[0] + (c.dx || 0), y: m[1] + (c.dy ?? 130) }; }
  const u = E.clamp((f - c.f0) / (c.f1 - c.f0), 0, 1), e = c.ease ? E.EASE[c.ease](u) : u;
  const a = P(c.a, c.f0, statesAt(c.f0)), b = P(c.b, f, S);
  return { ...base, x: E.lerp(a[0], b[0], e), y: E.lerp(a[1] ?? GROUND, b[1] ?? GROUND, e) - Math.sin(Math.PI * u) * (c.arc || 0), phase: c.run ? f * 0.9 : 0 };
}
const cowPt = (f) => { const c = cowAt(f, statesAt(f)); return [c.x, c.y]; };
const udder = (f, S) => { const c = cowAt(f, S); return [c.x, c.y - CS * 0.26 * c.sq]; };
const cowBack = (f, S) => { const c = cowAt(f, S); return [c.x - c.face * 30, c.y - CTOP * c.sq + 6]; };
function moo(f, n = 14, gain = 1) { MOO.push([f, f + n]); sfx('baa', f, { x: 960, gain, pitch: 0.42, dur: n * 1.4 }); }
function squirt(f0, f1, to, arc = 60) { JETS.push({ f0, f1, from: udder, to, arc }); sfx('spit', f0, { x: 960, gain: 0.8 }); sfx('splash', f0 + 2, { x: 960, gain: 0.5 }); }
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
const RIDE = [];          // {who, f0, f1, dx}
const LATE = [];

const PX0 = 470, FX0 = 1450, MX = 940, GO = 54;
// ================================================================== 0–2.2 с: считалка, оба стоят
key('pink', 0, { form: 'small', x: PX0, y: GROUND, face: 1, look: 1, eyes: 'normal', mouth: 'smile normal', sx: 1, sy: 1, rot: 0, pivot: 0, alpha: 1 }, 0);
key('fat', 0, { form: 'small', x: FX0, y: GROUND, face: -1, look: 1, eyes: 'normal', mouth: 'smile normal', sx: 1, sy: 1, rot: 0, pivot: 0, mouthK: 1 }, 0);

const BIG = () => {
  // ---- 2.2–4 с: корова с неба — Толстый ей на спину — «му-у!» — молоко Розовой в лицо
  COW.push({ f0: GO, f1: GO + 8, a: [MX, -300], b: [MX, GROUND], ease: 'in2', face: -1 }, { f0: GO + 8, at: [MX], face: -1 });
  CSQ.push([GO + 8, 0.25]); moo(GO + 9, 12, 0.8);
  sfx('whoosh', GO, { x: MX, dur: 8, gain: 0.5 }); sfx('slam', GO + 8, { x: MX, gain: 0.8 });
  ev('dust', { f: GO + 8, x: MX, r: 110, n: 7, snd: false }); ev('shake', { f: GO + 8, amp: 10, n: 6 });
  key('pink', GO + 3, { mouth: 'puzzlement' }, 0); key('fat', GO + 3, { mouth: 'puzzlement' }, 0);
  key('fat', GO + 10, { mouth: 'theeth smile', eyes: 'angry' }, 0);
  sfx('ref:grin-eee', GO + 10, { who: 'fat', gain: 0.4, pitch: 0.8 });
  const ON = GO + 24;
  LATE.push(() => { const b = cowBack(ON, ST.stateAt(ON)); hopTo('fat', GO + 12, ON, FX0, GROUND, b[0], b[1], 180, { land: false }); });
  key('fat', ON, { sx: 1.35, sy: 0.72 }, 1); key('fat', ON + 5, { sx: 1, sy: 1 }, 3);
  sfx('slam', ON, { x: MX, gain: 0.7 });
  CSQ.push([ON, 0.3]); moo(ON + 1, 16, 1.0);
  squirt(ON + 2, ON + 11, 'pink:mid', 40);
  SPL.push({ who: 'pink', part: 'mid', f0: ON + 11, f1: 0, s: 180, seed: 3 });
  key('pink', ON + 11, { sx: 1.2, sy: 0.86, mouth: 'puzzlement', eyes: 'sad' }, 1); key('pink', ON + 15, { sx: 1, sy: 1 }, 3);
  sfx('hurt', ON + 12, { who: 'pink', gain: 0.8 });
  key('fat', ON + 6, { mouth: 'happy', eyes: 'normal' }, 0);
  sfx('ref:laugh', ON + 8, { who: 'fat', gain: 0.85, pitch: 0.75 });
  const FX1 = 1500;
  LATE.push(() => { const b = cowBack(ON, ST.stateAt(ON)); hopTo('fat', ON + 12, ON + 26, b[0], b[1], FX1, GROUND, 120); });
  laugh('fat', ON + 28, ON + 44);

  // ---- 3.8–5 с: Розовая «растёт» — молоко слетает, Толстый влюблён
  const PX = 520;
  key('pink', ON + 14, { eyes: 'angry', mouth: 'angry theeth' }, 0);
  const PB = transform('pink', ON + 16, PX0, PX, 1, { style: 'grow', love: 'fat', loveDur: 70 });
  SPL[0].f1 = PB - 3;
  key('pink', PB, stance('pink', PX, 1), 0);
  key('pink', PB + 4, { mouth: 'theeth smile', eyes: 'normal' }, 0);

  // ---- 5.2–8.8 с: поднимает корову и сжимает, как волынку — молоко Толстому в рот, он раздувается
  const PX1 = 600;
  walk('pink', PB + 2, PX, PX1, 1, 10, 1);
  const GR = PB + 16;
  key('pink', GR - 5, { lean: 26, hip: [0, ST.toRig('pink', 160)], head: 6, mouth: 'theeth smile', eyes: 'angry' }, 5);
  key('pink', GR, { hitF: 1, hitB: 1, hitFto: [MX - 90, GROUND - 230], hitBto: [MX - 170, GROUND - 220] }, 4);
  COW.push({ f0: GR, hands: 'pink', face: 1, dy: 170, dx: 190 });
  moo(GR + 1, 10, 0.8);
  key('pink', GR + 10, { ...stance('pink', PX1, 1), hitF: 0, hitB: 0, handF: hand('pink', 'F', 0.95, -0.15), handB: hand('pink', 'B', 0.85, -0.2), lean: -4 }, 10);
  // Толстый влюблён — подскакивает ближе, раскрывает рот
  const FX2 = 1500;
  hop('fat', PB + 12, PB + 22, FX1, FX2, 60);
  ev('hearts', { who: 'fat', f0: PB + 22, f1: GR + 60, snd: false });
  const SQ0 = GR + 18;
  fatOpen(SQ0, 2.0, 4, { mouth: 'puzzlement' });
  for (let i = 0; i < 3; i++) {
    const f = SQ0 + i * 9;
    key('pink', f - 3, { handF: hand('pink', 'F', 0.85, -0.12), handB: hand('pink', 'B', 0.92, -0.17) }, 3);
    key('pink', f, { handF: hand('pink', 'F', 0.95, -0.15), handB: hand('pink', 'B', 0.85, -0.2) }, 2);
    CSQ.push([f - 2, 0.22]); moo(f - 2, 7, 0.7);
    squirt(f, f + 7, 'fat:fmouth', 70);
    sfx('gulp', f + 7, { who: 'fat', gain: 0.8 });
    key('fat', f + 7, { sx: 1.1 + i * 0.12, sy: 1.1 + i * 0.12 }, 2);
  }
  const FULL = SQ0 + 28;
  key('fat', FULL, { mouthK: 1, mouth: 'happy', sx: 1.42, sy: 1.42 }, 3);
  sfx('inflate', FULL - 6, { who: 'fat', dur: 8, gain: 0.7 });
  // опускает корову
  const DOWN = FULL + 4, CX2 = 960;
  key('pink', DOWN, { lean: 18, hip: [0, ST.toRig('pink', 120)], handF: hand('pink', 'F', 0.9, 0.1), handB: hand('pink', 'B', 0.8, 0.1) }, 6);
  COW.push({ f0: DOWN + 6, f1: DOWN + 10, a: (f, S) => cowPt(DOWN + 5), b: [CX2, GROUND], face: 1, ease: 'in2' }, { f0: DOWN + 10, at: [CX2], face: 1 });
  CSQ.push([DOWN + 10, 0.2]); sfx('land', DOWN + 10, { x: CX2, gain: 0.6 });
  key('pink', DOWN + 14, { ...stance('pink', PX1, 1), lean: 0, hip: [0, 0], mouth: 'happy with theeth', eyes: 'normal' }, 8);
  sfx('ref:laugh', DOWN + 12, { who: 'pink', gain: 0.85, pitch: 1.35 });
  chuckle('pink', DOWN + 12, DOWN + 30, { mouth: 'happy with theeth' });

  // ---- 8.8–12 с: Толстый выплёвывает молоко ей в лицо — вслепую в лужу — падает — «пуф»
  const SP = DOWN + 26;
  key('fat', SP - 6, { sx: 1.55, sy: 1.3, mouth: 'puzzlement', eyes: 'angry' }, 6);
  fatOpen(SP, 2.2, 2);
  key('fat', SP, { sx: 1.1, sy: 1.1 }, 3);
  JETS.push({ f0: SP, f1: SP + 14, from: (f, S) => target('fat:fmouth', S), to: 'pink:mid', arc: 120 });
  sfx('spit', SP, { who: 'fat', gain: 1.0 }); sfx('splash', SP + 4, { x: 900, gain: 0.7 }); sfx('gust', SP, { x: 1000, dur: 14, gain: 0.5 });
  key('fat', SP + 14, { mouthK: 1, sx: 1, sy: 1, mouth: 'happy', eyes: 'normal' }, 4);
  SPL.push({ who: 'pink', part: 'mid', f0: SP + 12, f1: 0, s: 220, seed: 5 });
  PUD.push({ f0: SP + 12, f1: 0, x: PX1 + 140, w: 380, grow: 12 });
  key('pink', SP + 12, { lean: -14, head: -14, mouth: 'puzzlement', eyes: 'sad', handF: hand('pink', 'F', 0.4, -0.75), handB: hand('pink', 'B', 0.2, -0.75) }, 2);
  sfx('hurt', SP + 13, { who: 'pink', gain: 0.8 });
  sfx('ref:laugh', SP + 16, { who: 'fat', gain: 0.85, pitch: 0.75 });
  laugh('fat', SP + 16, SP + 40);
  walk('pink', SP + 18, PX1, PX1 + 130, 1, 10, 1, false);
  const SL = SP + 30;
  const LIE = slip('pink', SL, PX1 + 130, 1, { n: 12, stars: 24 });
  sfx('splash', SL + 4, { x: PX1 + 130, gain: 0.6 });
  const PBX = 380;
  const psm = shrink('pink', LIE + 6, PBX, 1, { mouth: 'puzzlement', eyes: 'sad', smoke: 420 });
  key('pink', psm, { lean: 0, head: 0, hip: [0, 0], legF: null, legB: null, zB: null, rot: 0 }, 0);
  move('pink', psm, { x: PBX, y: GROUND, rot: 0 });
  SPL[1].f1 = psm; SPL.push({ who: 'pink', part: 'mid', f0: psm, f1: psm + 30, s: 120, seed: 7 });
  ev('stars', { who: 'pink', f0: psm + 4, f1: psm + 14, snd: false });
  // ведро из облачка — у Толстого за спиной
  const BKX = 1690;
  ev('smoke', { f: psm, who: 'fat', size: 200, dx: BKX - FX2, y: GROUND - 60 }); sfx('pop', psm + 2, { x: BKX, gain: 0.5 });
  BUCK.push({ f0: psm + 2, at: [BKX, GROUND + 4], rot: 0 });

  // ---- 12–17 с: шарик-Розовая скачет на корову — «му-у!» — погоня — ведро на голову — корова садится на Толстого
  key('pink', psm + 6, { eyes: 'angry', mouth: 'theeth smile' }, 0);
  const ON2 = psm + 18;
  LATE.push(() => { const b = cowBack(ON2, ST.stateAt(ON2)); hopTo('pink', psm + 8, ON2, PBX, GROUND, b[0], b[1], 160, { land: false }); });
  key('pink', ON2, { sx: 1.3, sy: 0.75 }, 1); key('pink', ON2 + 4, { sx: 1, sy: 1 }, 3);
  CSQ.push([ON2, 0.2]);
  COW.push({ f0: ON2, at: [CX2], face: 1 });                         // разворачивается к Толстому
  moo(ON2 + 1, 18, 1.1);
  key('fat', ON2 + 4, { mouth: 'puzzlement', eyes: 'sad', face: 1 }, 0);
  sfx('scared', ON2 + 6, { who: 'fat', gain: 0.8 });
  const RUN = ON2 + 8, CX3 = 1060;
  COW.push({ f0: RUN, f1: RUN + 18, a: [CX2], b: [CX3], face: 1, run: true }, { f0: RUN + 18, at: [CX3], face: 1 });
  for (let f = RUN + 3; f < RUN + 18; f += 5) sfx('step', f, { x: 1000, gain: 0.5 });
  RIDE.push({ who: 'pink', f0: ON2 + 1, f1: 0, dx: 0 });
  key('pink', RUN, { mouth: 'happy with theeth', eyes: 'angry' }, 0);
  // Толстый удирает — спотыкается о ведро — кувырок — ведро ему на голову
  hop('fat', RUN, RUN + 8, FX2, 1600, 60, { prep: 1 });
  const TRIP = RUN + 10, FX3 = 1450;
  tumble('fat', TRIP, TRIP + 18, 1600, FX3, 200, -1, { hurt: false });
  sfx('bonk', TRIP, { x: BKX, gain: 0.7 });
  BUCK.push({ f0: TRIP, f1: TRIP + 18, a: [BKX, GROUND + 4], b: (f, S) => { const t = target('fat:top', S); return [t[0], t[1] - 70]; }, arc: 260, rot0: 0, rot1: Math.PI * 3 }, { f0: TRIP + 18, head: 'fat' });
  sfx('bonk', TRIP + 18, { who: 'fat', gain: 0.9, pitch: 1.3 });
  key('fat', TRIP + 18, { mouth: 'puzzlement', eyes: 'sad' }, 0);
  // вслепую тычется в корову
  const BL = TRIP + 26;
  hop('fat', BL, BL + 8, FX3, FX3 - 60, 50, { prep: 1 });
  const BUMP = BL + 9;
  sfx('bonk', BUMP, { x: CX3 + 200, gain: 0.8, pitch: 1.4 });
  hop('fat', BUMP, BUMP + 8, FX3 - 60, FX3, 40, { prep: 1 });
  // корова подпрыгивает от неожиданности — Розовую подбрасывает — корова плюхается на Толстого
  moo(BUMP + 1, 14, 1.1);
  const CJ = BUMP + 4, CL = CJ + 16;
  COW.push({ f0: CJ, f1: CL, a: [CX3], b: [FX3 + 10, GROUND - 160], arc: 220, face: 1 }, { f0: CL, at: [FX3 + 10, GROUND - 160], face: 1 });
  CSQ.push([CL, 0.3]);
  RIDE[0].f1 = CJ;
  const PL = 760;
  LATE.push(() => { const b = cowBack(CJ, ST.stateAt(CJ)); hopTo('pink', CJ, CJ + 20, b[0], b[1], PL, GROUND, 110); });
  key('pink', CJ + 2, { mouth: 'puzzlement', eyes: 'sad', pivot: ST.CAST.pink.pivot }, 0);
  move('pink', CJ + 1, { rot: 0 }); move('pink', CJ + 20, { rot: -360 }, 'lin'); key('pink', CJ + 21, { rot: 0, pivot: 0 }, 0);
  sfx('whoosh', CJ + 2, { who: 'pink', dur: 18, gain: 0.6 });
  key('fat', CL, { sx: 1.7, sy: 0.4 }, 2);
  sfx('slam', CL, { who: 'fat', gain: 1.0 }); sfx('squish', CL + 1, { who: 'fat', gain: 0.8 });
  ev('shake', { f: CL, amp: 16, n: 10 }); ev('dust', { f: CL, x: FX3, r: 110, n: 8, snd: false });
  ev('stars', { who: 'fat', f0: CL + 2, f1: CL + 40 });
  moo(CL + 6, 12, 0.7);

  // ---- 17–21 с: Розовая «растёт» (без музыки), снимает корову — Толстый с ведром на голове удирает
  key('pink', CJ + 22, { eyes: 'angry', mouth: 'theeth smile' }, 0);
  const PB2 = transform('pink', CJ + 24, PL, PL + 60, 1, { style: 'grow' });
  key('pink', PB2, stance('pink', PL + 60, 1), 0);
  key('pink', PB2 + 4, { mouth: 'happy with theeth', eyes: 'normal' }, 0);
  sfx('ref:laugh', PB2 + 4, { who: 'pink', gain: 0.85, pitch: 1.35 });
  chuckle('pink', PB2 + 4, PB2 + 16, { mouth: 'happy with theeth' });
  const PX3 = 1080;
  walk('pink', PB2 + 14, PL + 60, PX3, 2, 9, 1);
  const LIFT = PB2 + 34;
  key('pink', LIFT - 5, { lean: 20, hip: [0, ST.toRig('pink', 110)], head: 6 }, 5);
  key('pink', LIFT, { hitF: 1, hitB: 1, hitFto: [FX3 + 40, GROUND - 330], hitBto: [FX3 - 60, GROUND - 320] }, 4);
  COW.push({ f0: LIFT, hands: 'pink', face: 1, dy: 170, dx: 190 });
  moo(LIFT + 1, 10, 0.7);
  key('pink', LIFT + 10, { ...stance('pink', PX3, 1), hitF: 0, hitB: 0, handF: hand('pink', 'F', 0.95, -0.2), handB: hand('pink', 'B', 0.85, -0.25), lean: -4 }, 8);
  key('fat', LIFT + 2, { sx: 1, sy: 1 }, 6, 'out'); sfx('boing', LIFT + 2, { who: 'fat', gain: 0.8 });
  sfx('scared', LIFT + 8, { who: 'fat', gain: 0.8 });
  key('fat', LIFT + 8, { face: 1 }, 0);
  let fx = FX3;
  for (let k = 0; k < 3; k++) { const a = LIFT + 10 + k * 9, nx = fx + 260; hop('fat', a, a + 8, fx, nx, 80, { prep: 1 }); fx = nx; }
  // ставит корову рядом, гладит
  const SET = LIFT + 30, CX4 = 1470;
  key('pink', SET, { lean: 16, hip: [0, ST.toRig('pink', 100)], handF: hand('pink', 'F', 0.9, 0.1), handB: hand('pink', 'B', 0.8, 0.1) }, 6);
  COW.push({ f0: SET + 6, f1: SET + 10, a: (f, S) => cowPt(SET + 5), b: [CX4, GROUND], face: -1, ease: 'in2' }, { f0: SET + 10, at: [CX4], face: -1 });
  CSQ.push([SET + 10, 0.2]); sfx('land', SET + 10, { x: CX4, gain: 0.6 }); moo(SET + 14, 12, 0.6);
  ev('hearts', { who: 'pink', f0: SET + 12, f1: SET + 40, snd: false, part: 'top' });
  key('pink', SET + 14, { ...stance('pink', PX3, 1), lean: 0, hip: [0, 0] }, 8);

  // ---- 21–25 с: в центр, руки вверх
  const WIN = victory('pink', SET + 22, PX3, { n: 9, stride: 60 });
  for (const fn of LATE) fn();
  for (const r of RIDE) for (let f = r.f0; f <= (r.f1 || NF - 1); f++) { const b = cowBack(f, ST.stateAt(f)); move(r.who, f, { x: b[0] + r.dx, y: b[1] + (r.f1 && f > r.f1 - 1 ? 0 : 0) }, 'lin'); }
  window.T = { ON, PB, GR, SQ0, DOWN, SP, SL, psm, ON2, RUN, TRIP, BUMP, CL, PB2, LIFT, SET, WIN };
};

// ------------------------------------------------------------------ рисование
const t0 = (f) => f / FPS;
function bucketAt(f, S) {
  const c = segAt(BUCK, f);
  if (!c) return null;
  if (c.at) return { x: c.at[0], y: c.at[1], rot: c.rot };
  if (c.head) { const t = target(`${c.head}:top`, S); return { x: t[0], y: t[1] - 70, rot: Math.PI }; }
  const u = E.clamp((f - c.f0) / (c.f1 - c.f0), 0, 1), a = P(c.a, c.f0, statesAt(c.f0)), b = P(c.b, f, S);
  return { x: E.lerp(a[0], b[0], u), y: E.lerp(a[1], b[1], u) - Math.sin(Math.PI * u) * (c.arc || 0), rot: E.lerp(c.rot0, c.rot1, u) };
}
const cowFront = (f) => { const c = segAt(COW, f); return c && (c.hands || (c.f1 && c.arc)); };
function drawCow(ctx, f, S) { const c = cowAt(f, S); if (c) FX.mcCow(ctx, c.x, c.y, CS, c.face, c.phase, 0, c.sq, c.moo); }
ST.hooks.beforeChars.push((ctx, f, S, CAM) => {
  ctx.setTransform(...CAM);
  for (const p of PUD) if (f >= p.f0 && (!p.f1 || f < p.f1)) FX.puddle(ctx, p.x, GROUND + 8, p.w * Math.min(1, (f - p.f0 + 2) / (p.grow || 6)), 1);
  if (!cowFront(f)) drawCow(ctx, f, S);
  const b = segAt(BUCK, f);
  if (b && b.at) { const k = bucketAt(f, S); FX.mcBucket(ctx, k.x, k.y, 110, k.rot, 0); }
});
ST.hooks.afterChars.push((ctx, f, S, CAM) => {
  ctx.setTransform(...CAM);
  if (cowFront(f)) drawCow(ctx, f, S);
  const b = segAt(BUCK, f);
  if (b && !b.at) { const k = bucketAt(f, S); FX.mcBucket(ctx, k.x, k.y, 130, k.rot, 0); }
  for (const j of JETS) {
    if (f < j.f0 || f >= j.f1) continue;
    const a = P(j.from, f, S), to = P(j.to, f, S);
    FX.foamJet(ctx, a[0], a[1], to[0], to[1], t0(f), j.arc || 40, j.f0, MW, ML);
  }
  for (const s of SPL) {
    if (f < s.f0 || (s.f1 && f >= s.f1)) continue;
    const p = target(`${s.who}:${s.part}`, S);
    FX.gumSplat(ctx, p[0], p[1] + (s.dy || 0), s.s * Math.min(1, (f - s.f0 + 2) / 3), s.seed, MW, ML);
  }
});

ST.start(BIG);
