// Ролик 23 (бывш. 35): Лягушка — Розовая (слева) против Радужного (справа), 25 с, 24 кадра/с. Драка без ударов:
// лягушка из майнкрафта: длинный липкий язык хватает и тянет, лягушка прыгает на головы.
// В начале — считалка «3, 2, 1, FIGHT». Музыка превращения — один раз. Фон — плитки: лазурная стена, лимонный пол, подушечки.
//
//   0–2.2 с   считалка: шарик-Розовая и радужный шарик неподвижно стоят друг напротив друга
//   2.2–4 с   с неба прыгает лягушка; Радужный тычет её — язык выстреливает, прилипает к Розовой и
//             подтаскивает её — лягушка её облизывает
//   4–5.2 с   Розовая «растёт» под музыку — Радужный влюблён
//   5.3–9 с   влюблённый Радужный скачет к ней — она наводит лягушку — язык хватает его, раскручивает и
//             отпускает — улетает
//   9–13.2 с  Радужный «растёт», подкидывает лягушку — та садится Розовой на голову, отталкивается
//             и прыгает — Розовая падает — «пуф»
//   13.2–17 с шарик-Розовая прыгает лягушке на спину — та с перепугу скачет и плюхается Радужному на лицо —
//             он падает — «пуф»
//   17–21 с   Розовая «растёт» снова; лягушка языком хватает шарика-Радужного и упрыгивает с ним за край
//   21–25 с   Розовая в центре, руки вверх
'use strict';

const ST = Stage({
  name: '23 Розовая vs Радужный',
  frames: 600,
  intro: 'countdown-321',
  cast: {
    pink: { small: ['girl-verity-small', { bodyHeight: 300 }], big: ['girl-verity-big', { height: 730, splitFeet: true }],
      pivot: 337, voice: 1.35, vAngle: 50, lie: 55, color: '#ff4fc8', moods: { angry: 'angry theeth', grin: 'theeth smile', big: 'theeth smile' } },
    rb: { small: ['skeleton-verity-small', { scale: 0.455, recolor: 'rainbow' }], big: ['all-verity-color', { height: 730 }],
      pivot: 325, voice: 0.85, lie: 55, color: '#ff7a3a', moods: { angry: 'angry theeth', grin: 'happy with theeth', big: 'theeth smile', love: 'happy - spittle' } },
  },
  order: ['rb', 'pink'],
  background: { theme: 'tiles', seed: 1023, wall: '#2b8ff0', floor: '#fff27a', motif: 'pillows', sky: ['#3a99f0', '#d4efff'] },
  clouds: [[150, 80, 2.4, 0, 12], [700, 220, 1.8, 1, 16], [1150, 70, 2.6, 2, 10], [1720, 250, 1.5, 0, 18]],
});
const { FPS, NF, GROUND, C, key, move, ev, sfx, hop, tumble, laugh, tremble, transform, shrink, stance, walk,
  slip, fallBack, victory, chuckle, hand, toRig, statesAt, target } = ST;
const P = (v, f, S) => (typeof v === 'function' ? v(f, S) : typeof v === 'string' ? target(v, S) : v);
ST.parts.mid = (ch, st) => { const h = ch.point(st, 'head'), f = ch.point(st, 'face'); return [(h[0] + f[0]) / 2, (h[1] + f[1]) / 2]; };

// ------------------------------------------------------------------ лягушка, язык
const FS = 400;
const FROG = [];          // {f0, at:[x,y], face} | {f0, f1, a, b, arc, face, ease} | {f0, hands: who, face} | {f0, on: who, face}
const SQUAT = [];         // [f0, f1, k] — присела / вытянулась
const MOUTH = [];         // [f0, f1]
const TONGUE = [];        // {f0, f1, to, out, back} — язык: out кадров летит, держит, back кадров назад
const LICK = [];          // {who, f0, f1}
const CROAK = [];
function segAt(segs, f) { let c = null; for (const s of segs) if (f >= s.f0) c = s; return c && !c.gone ? c : null; }
const handsMid = (who, S) => { const h = C[who].big.point(S[who].st, 'handF'), g = C[who].big.point(S[who].st, 'handB'); return [(h[0] + g[0]) / 2, Math.max(h[1], g[1])]; };
function frogAt(f, S) {
  const c = segAt(FROG, f);
  if (!c) return null;
  let sq = 0; for (const [a, b, k] of SQUAT) if (f >= a && f < b) sq = k * Math.sin(Math.PI * (f - a) / (b - a));
  const mo = MOUTH.some(([a, b]) => f >= a && f < b) || TONGUE.some((t) => f >= t.f0 && f < t.f1) ? 1 : 0;
  if (c.at) return { x: c.at[0], y: c.at[1] ?? GROUND, face: c.face, sq, mo };
  if (c.hands) { if (S[c.hands].p.form !== 'big') return null; const m = handsMid(c.hands, S); return { x: m[0] + (c.dx || 0), y: m[1] + FS * 0.22, face: c.face, sq, mo }; }
  if (c.on) { const t = target(`${c.on}:face`, S); return { x: t[0] - 20, y: t[1] + FS * 0.32, face: c.face, sq, mo }; }
  const u = E.clamp((f - c.f0) / (c.f1 - c.f0), 0, 1), e = c.ease ? E.EASE[c.ease](u) : u;
  const a = P(c.a, c.f0, statesAt(c.f0)), b = P(c.b, f, S);
  return { x: E.lerp(a[0], b[0], e), y: E.lerp(a[1] ?? GROUND, b[1] ?? GROUND, e) - Math.sin(Math.PI * u) * (c.arc || 0), face: c.face, sq: c.arc ? -0.8 * Math.sin(Math.PI * u) : sq, mo };
}
const frogPt = (f) => { const q = frogAt(f, statesAt(f)); return [q.x, q.y]; };
const mouthOf = (q) => { const bh = FS * 0.42 * (1 - q.sq * 0.25), L = FS * 0.14 * (1 - q.sq * 0.6) + (q.sq < 0 ? -q.sq * FS * 0.3 : 0); return [q.x + q.face * FS * 0.48, q.y - L - bh * 0.5]; };
function frogHop(f0, f1, a, b, arc, face) {
  FROG.push({ f0, f1, a, b, arc, face }, { f0: f1, at: Array.isArray(b) ? b : null, face });
  SQUAT.push([f0 - 4, f0, 0.8], [f1, f1 + 6, 0.6]);
  sfx('spring', f0, { x: 960, gain: 0.5, pitch: 1.3 }); sfx('squish', f1, { x: 960, gain: 0.5, pitch: 1.2 });
}
function croak(f, gain = 0.7) { sfx('baa', f, { x: 960, gain, pitch: 0.55, dur: 8 }); sfx('burp', f + 2, { x: 960, gain: gain * 0.5 }); }
function tongue(f0, out, hold, back, to) { TONGUE.push({ f0, f1: f0 + out + hold + back, out, hold, back, to }); sfx('flick', f0, { x: 960, gain: 0.8 }); sfx('whoosh', f0, { x: 960, dur: out, gain: 0.5 }); sfx('squish', f0 + out, { x: 960, gain: 0.7 }); }
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

const PX0 = 470, RX0 = 1450, GO = 54;
// ================================================================== 0–2.2 с: считалка, оба стоят
key('pink', 0, { form: 'small', x: PX0, y: GROUND, face: 1, look: 1, eyes: 'normal', mouth: 'smile normal', sx: 1, sy: 1, rot: 0, pivot: 0, alpha: 1 }, 0);
key('rb', 0, { form: 'small', x: RX0, y: GROUND, face: -1, look: 1, eyes: 'normal', mouth: 'smile normal', sx: 1, sy: 1, rot: 0, pivot: 0, alpha: 1 }, 0);

const BIG = () => {
  // ---- 2.2–4 с: лягушка прыгает с неба — Радужный тычет её — язык подтаскивает Розовую — облизывает
  const FX1 = 1080;
  frogHop(GO, GO + 12, [2100, GROUND - 400], [FX1], 160, -1);
  croak(GO + 14, 0.7);
  key('pink', GO + 3, { mouth: 'puzzlement' }, 0); key('rb', GO + 3, { mouth: 'puzzlement' }, 0);
  key('rb', GO + 10, { mouth: 'happy with theeth', eyes: 'angry' }, 0);
  sfx('ref:grin-eee', GO + 10, { who: 'rb', gain: 0.4, pitch: 0.9 });
  const POKE = GO + 20;
  hopTo('rb', GO + 12, POKE, RX0, GROUND, FX1 + 330, GROUND, 60);
  key('rb', POKE + 1, { sx: 0.82, sy: 1.18 }, 1); key('rb', POKE + 5, { sx: 1, sy: 1 }, 3);
  sfx('bonk', POKE + 1, { x: FX1, gain: 0.5, pitch: 1.4 }); SQUAT.push([POKE, POKE + 6, -0.4]);
  const T1 = POKE + 4, PULL = T1 + 8;
  tongue(T1, 7, 1, 12, 'pink:mid');
  key('pink', T1 + 7, { mouth: 'puzzlement', eyes: 'sad', sx: 1.2, sy: 0.86 }, 1);
  sfx('scared', T1 + 8, { who: 'pink', gain: 0.6 });
  // тащит Розовую к лягушке
  const PX1 = FX1 - 420;
  move('pink', PULL, { x: PX0, y: GROUND }); move('pink', PULL + 12, { x: PX1, y: GROUND - 40 }, 'in2'); move('pink', PULL + 14, { y: GROUND }, 'in2');
  key('pink', PULL + 12, { sx: 1.25, sy: 0.8 }, 1); key('pink', PULL + 16, { sx: 1, sy: 1 }, 3);
  sfx('slide', PULL, { who: 'pink', gain: 0.5, pitch: 1.3 });
  // облизывает
  const LK = PULL + 16;
  tongue(LK, 3, 4, 3, (f, S) => { const t = target('pink:top', S); return [t[0], t[1] + 60]; });
  LICK.push({ who: 'pink', f0: LK + 3, f1: 0 });
  sfx('lick', LK + 3, { who: 'pink', gain: 0.9 });
  key('pink', LK + 3, { sx: 0.88, sy: 1.12 }, 2); key('pink', LK + 8, { sx: 1, sy: 1 }, 3);
  key('rb', T1 + 6, { mouth: 'happy with theeth', eyes: 'normal' }, 0);
  sfx('ref:laugh', LK + 4, { who: 'rb', gain: 0.85, pitch: 0.9 });
  laugh('rb', LK + 6, LK + 16);

  // ---- 4–5.2 с: Розовая «растёт» — Радужный влюблён
  const PX = 640;
  key('pink', LK + 8, { eyes: 'angry', mouth: 'angry theeth' }, 0);
  const PB = transform('pink', LK + 10, PX1, PX, 1, { style: 'grow', love: 'rb', loveDur: 56 });
  LICK[0].f1 = PB - 3;
  key('pink', PB, stance('pink', PX, 1), 0);
  key('pink', PB + 4, { mouth: 'theeth smile', eyes: 'normal' }, 0);
  // лягушка отпрыгивает назад
  const FX2 = 1230;
  frogHop(PB - 10, PB + 2, [FX1], [FX2], 80, -1);
  const RX1 = 1500;
  hopTo('rb', PB - 8, PB + 2, FX1 + 330, GROUND, RX1, GROUND, 60);

  // ---- 5.3–9 с: влюблённый Радужный скачет к ней — она наводит лягушку — язык хватает, раскручивает, бросает
  const GR = PB + 8;
  walk('pink', PB + 2, PX, 900, 2, 7, 1);
  key('pink', GR + 10 - 5, { lean: 26, hip: [0, toRig('pink', 170)], head: 6 }, 5);
  key('pink', GR + 10, { hitF: 1, hitB: 1, hitFto: [FX2 + 60, GROUND - 100], hitBto: [FX2 - 60, GROUND - 100] }, 4);
  FROG.push({ f0: GR + 10, hands: 'pink', face: 1, dx: 60 }, { f0: GR + 18, hands: 'pink', face: 1, dx: 230 });
  croak(GR + 11, 0.6);
  key('pink', GR + 20, { ...stance('pink', 900, 1), hitF: 0, hitB: 0, handF: hand('pink', 'F', 0.95, 0.2), handB: hand('pink', 'B', 0.85, 0.15), mouth: 'theeth smile', eyes: 'angry' }, 8);
  const RX2 = 1420;
  hopTo('rb', GR + 14, GR + 22, RX1, GROUND, RX2, GROUND, 60);
  ev('hearts', { who: 'rb', f0: GR + 22, f1: GR + 40, snd: false });
  sfx('kiss', GR + 26, { who: 'rb', gain: 0.6 });
  const T2 = GR + 30, GOT = T2 + 6;
  tongue(T2, 6, 30, 6, 'rb:body');
  key('rb', GOT, { mouth: 'puzzlement', eyes: 'sad', sx: 1.2, sy: 0.85 }, 1);
  // раскручивает над головой
  LATE.push(() => {
    for (let g = GOT; g <= GOT + 30; g++) {
      const q = frogAt(g, ST.stateAt(g)), m = mouthOf(q), a = -Math.PI / 2 + (g - GOT) * 0.42, R = 300;
      move('rb', g, { x: m[0] + 120 + Math.cos(a) * R, y: m[1] + Math.sin(a) * R * 0.6 + 170 }, 'lin');
    }
  });
  TONGUE[TONGUE.length - 1].to = (f, S) => target('rb:body', S);
  key('rb', GOT + 2, { pivot: ST.CAST.rb.pivot }, 0);
  move('rb', GOT, { rot: 0 }); move('rb', GOT + 30, { rot: -720 }, 'lin');
  sfx('whirr', GOT, { x: 1000, dur: 30, gain: 0.6 }); sfx('scared', GOT + 2, { who: 'rb', gain: 0.8 });
  key('pink', GOT + 2, { handF: hand('pink', 'F', 0.95, 0.1), handB: hand('pink', 'B', 0.85, 0.05), lean: -4 }, 6);
  sfx('ref:laugh', GOT + 6, { who: 'pink', gain: 0.85, pitch: 1.35 });
  // отпускает — улетает
  const REL = GOT + 31, LND = REL + 18, RX3 = 1660;
  LATE.push(() => {
    const p = ST.stateAt(REL).rb.p;
    move('rb', REL, { x: p.x, y: p.y, rot: -720 }); move('rb', REL + 7, { y: GROUND - 640 }, 'out2'); move('rb', LND, { x: RX3, y: GROUND, rot: -1080 }, 'in2');
  });
  key('rb', LND + 1, { rot: 0, pivot: 0 }, 0); move('rb', LND + 1, { rot: 0 });
  key('rb', LND, { sx: 1.3, sy: 0.75 }, 1); key('rb', LND + 5, { sx: 1, sy: 1 }, 4);
  sfx('whoosh', REL, { who: 'rb', dur: 16, gain: 0.6 }); sfx('fall', LND, { who: 'rb', gain: 0.8 });
  ev('stars', { who: 'rb', f0: LND + 2, f1: LND + 18 });
  key('pink', REL + 4, { ...stance('pink', 900, 1), handF: hand('pink', 'F', 0.95, 0.2), handB: hand('pink', 'B', 0.85, 0.15) }, 6);
  chuckle('pink', REL + 4, LND + 10, { mouth: 'happy with theeth' });
  // ставит лягушку
  const PUT = LND + 4, FX3 = 1130;
  key('pink', PUT, { lean: 18, hip: [0, toRig('pink', 120)], handF: hand('pink', 'F', 0.9, 0.3), handB: hand('pink', 'B', 0.8, 0.3) }, 6);
  FROG.push({ f0: PUT + 6, f1: PUT + 10, a: (f, S) => frogPt(PUT + 5), b: [FX3], face: -1, ease: 'in2' }, { f0: PUT + 10, at: [FX3], face: -1 });
  croak(PUT + 12, 0.5);
  key('pink', PUT + 14, { ...stance('pink', 900, 1), lean: 0, hip: [0, 0] }, 8);

  // ---- 9–13.2 с: Радужный «растёт», подкидывает лягушку — та садится Розовой на голову — прыжок — Розовая падает
  key('rb', LND + 12, { eyes: 'angry', mouth: 'angry theeth' }, 0);
  const RX = 1560, RB = transform('rb', LND + 14, RX3, RX, -1, { style: 'grow' });
  key('rb', RB, stance('rb', RX, -1), 0);
  key('rb', RB + 4, { mouth: 'theeth smile', eyes: 'angry' }, 0);
  key('pink', RB - 2, { mouth: 'puzzlement', eyes: 'sad' }, 0);
  const RX4 = 1400;
  walk('rb', RB + 2, RX, RX4, 1, 9, -1);
  const PK = RB + 12;
  key('rb', PK - 5, { lean: 28, hip: [0, toRig('rb', 180)], head: 6 }, 5);
  key('rb', PK, { hitF: 1, hitB: 1, hitFto: [FX3 + 60, GROUND - 100], hitBto: [FX3 - 40, GROUND - 100] }, 4);
  FROG.push({ f0: PK, hands: 'rb', face: -1, dx: -40 });
  croak(PK + 1, 0.6);
  key('rb', PK + 8, { ...stance('rb', RX4, -1), hitF: 0, hitB: 0, handF: hand('rb', 'F', 0.3, -0.95), handB: hand('rb', 'B', 0.2, -0.95) }, 8);
  const TOSS = PK + 14, ONH = TOSS + 12;
  key('rb', TOSS, { handF: hand('rb', 'F', 0.95, -0.4), handB: hand('rb', 'B', 0.85, -0.4), lean: 14 }, 3, 'in2');
  sfx('swing', TOSS - 2, { who: 'rb', gain: 0.8 });
  FROG.push({ f0: TOSS, f1: ONH, a: (f, S) => frogPt(TOSS - 1), b: (f, S) => { const t = target('pink:face', S); return [t[0] - 20, t[1] + FS * 0.32]; }, arc: 160, face: -1 }, { f0: ONH, on: 'pink', face: -1 });
  sfx('squish', ONH, { who: 'pink', gain: 0.8 }); croak(ONH + 2, 0.8);
  SQUAT.push([ONH, ONH + 6, 0.6]);
  key('pink', ONH, { head: -10, lean: -6, mouth: 'puzzlement', eyes: 'sad', hip: [0, toRig('pink', 40)], handF: hand('pink', 'F', 0.5, -0.9), handB: hand('pink', 'B', 0.3, -0.9) }, 2); key('pink', ONH + 6, { hip: [0, 0] }, 4);
  sfx('scared', ONH + 4, { who: 'pink', gain: 0.7 });
  key('rb', TOSS + 8, { ...stance('rb', RX4, -1), lean: 0, mouth: 'happy with theeth', eyes: 'normal' }, 6);
  sfx('ref:laugh', ONH + 2, { who: 'rb', gain: 0.85, pitch: 0.75 });
  chuckle('rb', ONH + 2, ONH + 50, { mouth: 'happy with theeth' });
  // лягушка ёрзает, облизывает ей макушку, отталкивается — Розовая падает
  tongue(ONH + 8, 3, 3, 3, (f, S) => target('pink:mid', S)); sfx('lick', ONH + 11, { who: 'pink', gain: 0.8 });
  const JMP = ONH + 22, FX4 = 1120;
  SQUAT.push([JMP - 6, JMP, 0.9]);
  FROG.push({ f0: JMP, f1: JMP + 16, a: (f, S) => frogPt(JMP - 1), b: [FX4], arc: 260, face: 1 }, { f0: JMP + 16, at: [FX4], face: -1 });
  sfx('spring', JMP, { x: 900, gain: 0.8 });
  key('pink', JMP, { hip: [0, toRig('pink', 80)], lean: 10 }, 2);
  const FB = fallBack('pink', JMP + 2, 900, 1, { n: 14, stars: 26 });
  const PBX = 560;
  const psm = shrink('pink', FB + 6, PBX, 1, { mouth: 'puzzlement', eyes: 'sad', smoke: 420 });
  key('pink', psm, { lean: 0, head: 0, hip: [0, 0], legF: null, legB: null, zB: null, rot: 0 }, 0);
  move('pink', psm, { x: PBX, y: GROUND, rot: 0 });
  LICK.push({ who: 'pink', f0: psm, f1: psm + 30 });
  ev('stars', { who: 'pink', f0: psm + 4, f1: psm + 14, snd: false });

  // ---- 13.2–17 с: шарик-Розовая прыгает лягушке на спину — та скачет и плюхается Радужному на лицо — «пуф»
  key('pink', psm + 6, { eyes: 'angry', mouth: 'theeth smile', face: -1 }, 0);
  const ONB = psm + 18, BACKY = GROUND - FS * 0.56 + 8;
  hopTo('pink', psm + 8, ONB, PBX, GROUND, FX4 + 20, BACKY, 140, { land: false });
  key('pink', ONB, { sx: 1.3, sy: 0.75, face: -1 }, 1); key('pink', ONB + 4, { sx: 1, sy: 1 }, 3);
  croak(ONB + 1, 1.0); SQUAT.push([ONB, ONB + 6, 0.5]);
  const J1 = ONB + 8, J2 = J1 + 14, HIT = J2 + 14;
  frogHop(J1, J2, [FX4], [700], 120, -1);
  FROG.push({ f0: J2 + 1, f1: HIT, a: [700], b: (f, S) => { const t = target('rb:body', S); return [t[0] - 60, t[1] + FS * 0.3]; }, arc: 120, face: 1 }, { f0: HIT, f1: HIT + 14, a: (f, S) => { const t = target('rb:body', statesAt(HIT)); return [t[0] - 60, t[1] + FS * 0.3]; }, b: [1150], arc: 60, face: 1 }, { f0: HIT + 14, at: [1150], face: 1 });
  SQUAT.push([J2 - 4, J2 + 1, 0.8]); sfx('spring', J2 + 1, { x: 800, gain: 0.7 });
  LATE.push(() => { for (let g = ONB + 1; g <= J2; g++) { const q = frogAt(g, ST.stateAt(g)); move('pink', g, { x: q.x - q.face * 20, y: q.y - FS * 0.56 * (1 - q.sq * 0.25) + 8 }, 'lin'); } });
  sfx('scared', J1 + 2, { x: 600, gain: 0.5, pitch: 1.4 });
  key('rb', HIT - 8, { look: 1, mouth: 'puzzlement', eyes: 'sad' }, 0);
  sfx('slam', HIT, { who: 'rb', gain: 1.0 }); sfx('squish', HIT, { who: 'rb', gain: 0.8 }); ev('shake', { f: HIT, amp: 14, n: 8 });
  LICK.push({ who: 'rb', f0: HIT, f1: 0, s: 230 });
  key('rb', HIT, { lean: -18, head: -18, handF: hand('rb', 'F', 0.4, -0.7), handB: hand('rb', 'B', -0.4, -0.6) }, 2);
  LATE.push(() => { const p = ST.stateAt(J2).pink.p; hopTo('pink', J2 + 1, J2 + 13, p.x, p.y, 480, GROUND, 120); });
  key('pink', HIT + 2, { mouth: 'happy with theeth', eyes: 'normal' }, 0);
  sfx('ref:laugh', HIT + 4, { who: 'pink', gain: 0.85, pitch: 1.35 });
  laugh('pink', HIT + 6, HIT + 20);
  const FB2 = fallBack('rb', HIT + 4, RX4, -1, { n: 14, stars: 24 });
  const RBX = 1560;
  const rsm = shrink('rb', FB2 + 6, RBX, -1, { mouth: 'puzzlement', eyes: 'sad', smoke: 420 });
  key('rb', rsm, { lean: 0, head: 0, hip: [0, 0], legF: null, legB: null, zB: null, rot: 0 }, 0);
  move('rb', rsm, { x: RBX, y: GROUND, rot: 0 });
  LICK[LICK.length - 1].f1 = rsm; LICK.push({ who: 'rb', f0: rsm, f1: 0, s: 140 });
  ev('stars', { who: 'rb', f0: rsm + 4, f1: rsm + 14, snd: false });

  // ---- 17–21 с: Розовая «растёт» снова; лягушка языком хватает шарика-Радужного и упрыгивает за край
  const PX3 = 560, PB2 = transform('pink', HIT + 22, 480, PX3, 1, { style: 'grow' });
  key('pink', PB2, stance('pink', PX3, 1), 0);
  key('pink', PB2 + 4, { mouth: 'happy with theeth', eyes: 'normal' }, 0);
  const FX5 = 1250;
  frogHop(rsm + 6, rsm + 16, [1200], [FX5], 60, 1);
  const T3 = rsm + 20;
  tongue(T3, 5, 3, 6, 'rb:body');
  key('rb', T3 + 5, { mouth: 'puzzlement', eyes: 'sad', sx: 1.2, sy: 0.85 }, 1);
  sfx('scared', T3 + 6, { who: 'rb', gain: 0.8 });
  LATE.push(() => { for (let g = T3 + 8; g <= T3 + 14; g++) { const q = frogAt(g, ST.stateAt(g)), m = mouthOf(q), u = (g - T3 - 8) / 6; move('rb', g, { x: E.lerp(RBX, m[0] + 30, u), y: E.lerp(GROUND, m[1] + 40, u) }, 'lin'); } });
  const HOLD = T3 + 14;
  MOUTH.push([HOLD, NF]);
  let fx = FX5, g = HOLD + 2;
  for (let k = 0; k < 3; k++) { const nx = fx + 330; frogHop(g, g + 12, [fx], [nx], 160, 1); fx = nx; g += 13; }
  LATE.push(() => { for (let h = HOLD; h <= g; h++) { const q = frogAt(h, ST.stateAt(h)); if (!q) continue; const m = mouthOf(q); move('rb', h, { x: m[0] + 30, y: m[1] + 40 }, 'lin'); } });
  croak(HOLD + 1, 0.6);
  sfx('ref:laugh', HOLD + 4, { who: 'pink', gain: 0.85, pitch: 1.35 });
  chuckle('pink', HOLD + 4, HOLD + 26, { mouth: 'happy with theeth' });

  // ---- 21–25 с: в центр, руки вверх
  const WIN = victory('pink', HOLD + 28, PX3, { n: 9, stride: 90 });
  for (const fn of LATE) fn();
  window.T = { POKE, T1, PULL, LK, PB, GR, T2, GOT, REL, LND, RB, TOSS, ONH, JMP, FB, psm, ONB, HIT, rsm, PB2, T3, HOLD, WIN };
};

// ------------------------------------------------------------------ рисование
const frogFront = (f) => { const c = segAt(FROG, f); return c && (c.hands || c.on || c.f1); };
function drawFrog(ctx, f, S) {
  const q = frogAt(f, S);
  if (!q) return;
  FX.mcFrog(ctx, q.x, q.y, FS, q.face, q.sq, q.mo);
  for (const t of TONGUE) {
    if (f < t.f0 || f >= t.f1) continue;
    const m = mouthOf(q), to = P(t.to, f, S), d = f - t.f0;
    const k = d < t.out ? d / t.out : d < t.out + t.hold ? 1 : 1 - (d - t.out - t.hold) / t.back;
    FX.frogTongue(ctx, m, [E.lerp(m[0], to[0], k), E.lerp(m[1], to[1], k)], 20);
  }
}
ST.hooks.beforeChars.push((ctx, f, S, CAM) => { ctx.setTransform(...CAM); if (!frogFront(f)) drawFrog(ctx, f, S); });
ST.hooks.afterChars.push((ctx, f, S, CAM) => {
  ctx.setTransform(...CAM);
  if (frogFront(f)) drawFrog(ctx, f, S);
  for (const l of LICK) {
    if (f < l.f0 || (l.f1 && f >= l.f1)) continue;
    const p = target(`${l.who}:mid`, S);
    FX.gumSplat(ctx, p[0], p[1], (l.s || 150) * Math.min(1, (f - l.f0 + 2) / 3), l.f0, 'rgba(255,160,200,0.75)', '#c2507a');
  }
});

ST.start(BIG);
