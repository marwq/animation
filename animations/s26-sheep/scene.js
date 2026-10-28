// Серия 2, ролик 26: Овечка — Розовая (слева) против Скелета (справа), 27 с, 24 кадра/с. Драка без ударов:
// овца из майнкрафта и ножницы: шерсть летит и облепляет, овца отращивает шерсть, бодается, влюбляется.
// Музыка превращения — один раз. Фон — березняк.
//
//   0–2 с     шарик-Розовая и шарик-Скелет неподвижно стоят друг напротив друга, середина пустая
//   2–3.8 с   появляется овца; шарик-Скелет подлетает с ножницами — чик-чик-чик — шерсть летит на Розовую
//   3.8–5 с   Розовая в шерсти «растёт» под музыку — шерсть разлетается, Скелет влюблён
//   5–9.5 с   стриженая овца щиплет траву — шерсть отрастает; Розовая поднимает овцу и сажает на Скелета;
//             на голове у Скелета остаётся клок шерсти — овца принимает его за ягнёнка и ластится
//   9.6–14 с  Скелет «растёт», стрижёт овцу — шерсть Розовой в лицо; стриженая овца бодает её — падает — «пуф»
//   14–18.3 с шарик-Розовая прячется за овцой; Скелет стрижёт — «БУ!» — пугается, падает — «пуф»
//   18.3–22.5 с Розовая «растёт» снова — Скелет опять влюблён; она бросает в него охапку шерсти —
//             он пушистый шар, овца бодает «барашка» — укатывается за край
//   22.5–27 с овца ластится к Розовой; Розовая в центре, руки вверх
'use strict';

const ST = Stage({
  name: '26 Розовая vs Скелет',
  frames: 648,
  cast: {
    pink: { small: ['girl-verity-small', { bodyHeight: 300 }], big: ['girl-verity-big', { height: 730, splitFeet: true }],
      pivot: 337, voice: 1.35, vAngle: 50, lie: 55, color: '#ff4fc8', moods: { angry: 'angry theeth', grin: 'theeth smile', big: 'theeth smile' } },
    skel: { small: ['skeleton-verity-small', { scale: 0.455 }], big: ['skeleton-verity-big', { height: 730 }], pivot: 325,
      voice: 0.9, lie: 60, color: '#f3f1e6', moods: { angry: 'angry theeth', grin: 'happy with theeth', big: 'theeth smile' } },
  },
  order: ['skel', 'pink'],
  background: { theme: 'birch', seed: 1026, sunX: 1500, sunY: 130 },
  clouds: [[150, 80, 2.4, 0, 12], [700, 220, 1.8, 1, 16], [1150, 70, 2.6, 2, 10], [1720, 250, 1.5, 0, 18]],
});
const { FPS, NF, GROUND, C, key, move, ev, sfx, hop, laugh, tremble, transform, shrink, stance, walk, turn,
  fallBack, victory, chuckle, hand, statesAt, target } = ST;
const P = (v, f, S) => (typeof v === 'function' ? v(f, S) : typeof v === 'string' ? target(v, S) : v);
function flap(f0, f1, gain = 0.6) {
  for (let f = f0; f < f1; f += 6) { key('skel', f, { b_B16: -30, b_B17: 30 }, 3); key('skel', f + 3, { b_B16: 46, b_B17: -46 }, 3, 'in'); }
  key('skel', f1, { b_B16: 0, b_B17: 0 }, 4);
  sfx('gust', f0, { who: 'skel', dur: f1 - f0, gain });
}

// ------------------------------------------------------------------ овца, ножницы, шерсть
const SS = 380, WC = '#f8f8f8', WL = '#8a8a8a';
const SHEEP = [];         // {f0, at:[x], face} | {f0, f1, a, b, face, run, arc, ease} | {f0, hands: who, face} | {f0, on: who, face}
const WOOL = [[0, 1]];    // [f, шерсть]
const EAT = [];           // [f0, f1] — щиплет траву
const CHEW = [];          // [f0, f1]
const FRONT = [];         // [f0, f1] — овца рисуется перед персонажами
const SHE = [];           // ножницы: {f0, ball: who} | {f0, hand: who, rot} | {f0, at, rot} | {f0, f1, a, b, arc, spin}
const SNIPS = [];         // кадры щелчков
const COAT = [];          // шерсть на персонаже: {who, part, f0, f1, r: [[f, r]], dy}
const CLUMP = [];         // летящий клок: {f0, f1, a, b, arc, r}
const BURST = [];         // {f, at, size}
const SHEARTS = [];       // сердечки над овцой: [f0, f1]
function segAt(segs, f) { let c = null; for (const s of segs) if (f >= s.f0) c = s; return c && !c.gone ? c : null; }
const lerpKeys = (ks, f) => { let v = ks[0][1]; for (let i = 0; i < ks.length; i++) { if (f < ks[i][0]) { if (i) { const [a, x] = ks[i - 1], [b, y] = ks[i]; return E.lerp(x, y, (f - a) / (b - a)); } return ks[0][1]; } v = ks[i][1]; } return v; };
const handsMid = (who, S) => { const h = C[who].big.point(S[who].st, 'handF'), g = C[who].big.point(S[who].st, 'handB'); return [(h[0] + g[0]) / 2, Math.max(h[1], g[1])]; };
function sheepAt(f, S) {
  const c = segAt(SHEEP, f);
  if (!c) return null;
  const wool = lerpKeys(WOOL, f);
  let eat = 0; for (const [a, b] of EAT) if (f >= a && f < b + 4) eat = Math.min(1, (f - a) / 4, (b + 4 - f) / 4);
  const chew = (CHEW.some(([a, b]) => f >= a && f < b) || eat > 0.5) ? f / FPS : 0;
  const base = { wool, eat, chew, face: c.face, phase: 0, sq: 1 };
  if (c.at) return { ...base, x: c.at[0], y: c.at[1] ?? GROUND };
  if (c.hands) { if (S[c.hands].p.form !== 'big') return null; const m = handsMid(c.hands, S); return { ...base, x: m[0], y: m[1] + 190 }; }
  if (c.on) { const t = target(`${c.on}:top`, S); return { ...base, x: t[0], y: t[1] + 30 }; }
  const u = E.clamp((f - c.f0) / (c.f1 - c.f0), 0, 1), e = c.ease ? E.EASE[c.ease](u) : u;
  const a = P(c.a, c.f0, statesAt(c.f0)), b = P(c.b, f, S);
  return { ...base, x: E.lerp(a[0], b[0], e), y: E.lerp(a[1] ?? GROUND, b[1] ?? GROUND, e) - Math.sin(Math.PI * u) * (c.arc || 0),
    phase: c.run ? f * 0.9 : 0, sq: c.arc ? 1 + 0.1 * Math.sin(Math.PI * u) : 1 };
}
const sheepPt = (f) => { const s = sheepAt(f, statesAt(f)); return [s.x, s.y]; };
const sheepTop = (f) => { const s = sheepAt(f, statesAt(f)); return [s.x, s.y - SS * 0.3 - SS * (0.36 + 0.2 * Math.min(1.3, s.wool))]; };
function snip(f) { SNIPS.push(f); sfx('snip', f, { x: 960, gain: 0.9 }); }
function clump(f0, n, a, b, r, arc = 160) { CLUMP.push({ f0, f1: f0 + n, a, b, arc, r }); sfx('whoosh', f0, { x: 960, dur: n, gain: 0.35 }); sfx('squish', f0 + n, { x: 960, gain: 0.5 }); }
function baa(f, gain = 0.8, pitch = 1) { sfx('baa', f, { x: 960, gain, pitch }); }
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
function regrow(f0) {          // щиплет траву — шерсть отрастает
  EAT.push([f0, f0 + 14]);
  for (let f = f0 + 4; f < f0 + 14; f += 4) sfx('chomp', f, { x: 960, gain: 0.35 });
  const g = f0 + 16;
  WOOL.push([g, lerpKeys(WOOL, g)], [g + 6, 1.15], [g + 9, 1]);
  sfx('inflate', g, { x: 960, dur: 6, gain: 0.6 }); sfx('pop', g + 6, { x: 960, gain: 0.6 });
  LATE.push(() => { const t = sheepTop(g + 6); ev('twinkle', { f: g + 7, at: [t[0], t[1]], n: 14, size: 44 }); });
  return g + 9;
}
const LATE = [];

const PX0 = 560, SX0 = 1360, MX = 960;
// ================================================================== 0–2 с: неподвижная стойка
key('pink', 0, { form: 'small', x: PX0, y: GROUND, face: 1, look: 1, eyes: 'normal', mouth: 'smile normal', sx: 1, sy: 1, rot: 0, pivot: 0, alpha: 1 }, 0);
key('skel', 0, { form: 'small', x: SX0, y: GROUND, face: -1, look: 1, eyes: 'normal', mouth: 'smile normal', sx: 1, sy: 1, rot: 0, pivot: 0, alpha: 1 }, 0);

const BIG = () => {
  // ---- 2–3.8 с: овца — Скелет с ножницами — чик-чик-чик — шерсть на Розовую
  ev('smoke', { f: 48, who: 'skel', size: 380, dx: MX - SX0, y: GROUND - 150 });
  sfx('poof', 48, { x: MX, gain: 0.6 }); sfx('pop', 51, { x: MX, gain: 0.6 });
  SHEEP.push({ f0: 51, at: [MX], face: 1 });
  baa(54, 0.8);
  key('pink', 50, { mouth: 'puzzlement' }, 0); key('skel', 50, { mouth: 'puzzlement' }, 0);
  key('skel', 54, { mouth: 'happy with theeth', eyes: 'angry' }, 0);
  SHE.push({ f0: 54, ball: 'skel' });
  sfx('pop', 54, { who: 'skel', gain: 0.6 }); sfx('ref:grin-eee', 55, { who: 'skel', gain: 0.4 });
  flap(56, 92, 0.5);
  move('skel', 56, { x: SX0, y: GROUND }); move('skel', 61, { x: 1250, y: GROUND - 470 }, 'out2'); move('skel', 64, { x: 1150, y: GROUND - 390 }, 'in2');
  const SN = [66, 71, 76];
  SN.forEach((f, i) => {
    snip(f);
    WOOL.push([f, 1 - i / 3], [f + 1, 1 - (i + 1) / 3]);
    clump(f + 1, 8, (g, S) => { const t = sheepTop(f); return [t[0] + 60 - i * 60, t[1] + 30]; }, 'pink:body', 70 + i * 10);
    move('skel', f, { x: 1150 - i * 50, y: GROUND - 390 + (i % 2) * 20 }, 'io');
  });
  baa(67, 0.9, 1.1); baa(77, 0.9, 1.25);
  COAT.push({ who: 'pink', part: 'body', f0: 75, f1: 0, r: [[75, 120], [80, 175], [85, 230]] });
  key('pink', 75, { sx: 1.2, sy: 0.85, mouth: 'puzzlement', eyes: 'sad' }, 1); key('pink', 79, { sx: 1, sy: 1 }, 3);
  key('pink', 85, { sx: 1.15, sy: 0.88 }, 1); key('pink', 89, { sx: 1, sy: 1 }, 3);
  // Скелет садится, ножницы падают
  move('skel', 84, { x: 1050, y: GROUND - 380 }); move('skel', 92, { x: 1460, y: GROUND }, 'in2');
  key('skel', 92, { sx: 1.25, sy: 0.8 }, 1); key('skel', 96, { sx: 1, sy: 1 }, 3);
  sfx('land', 92, { who: 'skel', gain: 0.5 });
  const SHL = [1310, GROUND - 16];
  SHE.push({ f0: 86, f1: 94, a: (f, S) => { const p = S.skel.p; return [p.x - 120, p.y - 140]; }, b: SHL, arc: 60, spin: 4 }, { f0: 94, at: SHL, rot: 0.15 });
  sfx('bonk', 94, { x: SHL[0], gain: 0.4, pitch: 1.5 });
  key('skel', 86, { mouth: 'happy with theeth', eyes: 'normal' }, 0);
  sfx('ref:laugh', 86, { who: 'skel', gain: 0.85 });
  laugh('skel', 94, 108);

  // ---- 3.8–5 с: Розовая «растёт» в шерсти — шерсть разлетается, Скелет влюблён
  const PX = 600;
  key('pink', 88, { eyes: 'angry', mouth: 'angry theeth' }, 0);
  const PB = transform('pink', 90, PX0, PX, 1, { style: 'grow', love: 'skel', loveDur: 56 });
  COAT[0].f1 = PB - 3; BURST.push({ f: PB - 3, at: [PX0, GROUND - 200], size: 1.5 });
  sfx('poof', PB - 3, { who: 'pink', gain: 0.6 });
  key('pink', PB, stance('pink', PX, 1), 0);
  key('pink', PB + 4, { mouth: 'theeth smile', eyes: 'normal' }, 0);

  // ---- 5–9.5 с: овца щиплет траву — шерсть отрастает — Розовая сажает овцу на Скелета
  const W1 = regrow(PB + 2);
  const SX1 = 1410;
  hopTo('skel', PB + 6, PB + 14, 1460, GROUND, SX1, GROUND, 60);
  ev('hearts', { who: 'skel', f0: PB + 14, f1: PB + 40, snd: false });
  const PX1 = 700;
  walk('pink', PB + 6, PX, PX1, 1, 10, 1);
  const GR = W1 + 4;
  key('pink', GR - 5, { lean: 26, hip: [0, ST.toRig('pink', 150)], head: 8, mouth: 'theeth smile', eyes: 'angry' }, 5);
  key('pink', GR, { hitF: 1, hitB: 1, hitFto: [MX - 60, GROUND - 230], hitBto: [MX - 150, GROUND - 230] }, 4);
  SHEEP.push({ f0: GR, hands: 'pink', face: 1 });
  baa(GR + 1, 0.9, 1.15);
  key('pink', GR + 10, { ...stance('pink', PX1, 1), hitF: 0, hitB: 0, handF: hand('pink', 'F', 0.75, -0.3), handB: hand('pink', 'B', 0.6, -0.3), lean: -4 }, 10);
  const TH = GR + 16, ON = TH + 12;
  key('pink', TH, { handF: hand('pink', 'F', 0.95, -0.3), handB: hand('pink', 'B', 0.85, -0.3), lean: 14 }, 3, 'in2');
  sfx('swing', TH - 2, { who: 'pink', gain: 0.8 }); sfx('whoosh', TH, { x: 1000, dur: 12, gain: 0.5 });
  SHEEP.push({ f0: TH, f1: ON, a: (f, S) => sheepPt(TH - 1), b: (f, S) => { const t = target('skel:top', S); return [t[0], t[1] + 30]; }, arc: 200, face: 1 }, { f0: ON, on: 'skel', face: 1 });
  key('skel', ON - 4, { mouth: 'puzzlement', eyes: 'sad' }, 0);
  key('skel', ON, { sx: 1.7, sy: 0.5 }, 2);
  sfx('slam', ON, { who: 'skel', gain: 0.9 }); sfx('squish', ON, { who: 'skel', gain: 0.6 }); baa(ON + 2, 0.8);
  ev('shake', { f: ON, amp: 12, n: 8 }); ev('dust', { f: ON, x: SX1, r: 70, n: 6, snd: false });
  CHEW.push([ON + 2, ON + 20]);
  key('pink', TH + 8, { ...stance('pink', PX1, 1), lean: 0, mouth: 'happy with theeth', eyes: 'normal' }, 8);
  sfx('ref:laugh', ON + 2, { who: 'pink', gain: 0.85, pitch: 1.35 });
  chuckle('pink', ON + 2, ON + 24, { mouth: 'happy with theeth' });
  const PX2 = PX1;
  // овца спрыгивает влево — у Скелета клок шерсти на голове
  const OFF = ON + 20, SHX = 1010;
  SHEEP.push({ f0: OFF, f1: OFF + 10, a: (f, S) => sheepPt(OFF - 1), b: [SHX, GROUND], arc: 90, face: 1 }, { f0: OFF + 10, at: [SHX], face: 1 });
  sfx('land', OFF + 10, { x: SHX, gain: 0.5 });
  key('skel', OFF + 2, { sx: 1, sy: 1 }, 6, 'out'); sfx('boing', OFF + 2, { who: 'skel', gain: 0.6 });
  COAT.push({ who: 'skel', part: 'top', f0: OFF, f1: 0, r: [[OFF, 80]], dy: 30 });
  ev('stars', { who: 'skel', f0: OFF + 2, f1: OFF + 14, snd: false });
  key('skel', OFF + 12, { mouth: 'puzzlement', eyes: 'normal' }, 0);
  // ластится к «ягнёнку»
  const NZ = OFF + 14;
  for (let k = 0; k < 3; k++) { const a = NZ + k * 8; SHEEP.push({ f0: a, f1: a + 4, a: [SHX], b: [SHX + 40], face: 1 }, { f0: a + 4, f1: a + 8, a: [SHX + 40], b: [SHX], face: 1 }); }
  SHEARTS.push([NZ, NZ + 30]); sfx('love', NZ, { x: SHX, gain: 0.6 }); baa(NZ + 2, 0.7, 1.3);
  SHEEP.push({ f0: NZ + 24, at: [SHX], face: 1 });
  key('skel', NZ + 4, { sx: 1.08, sy: 0.93 }, 2); key('skel', NZ + 12, { sx: 0.95, sy: 1.05 }, 3); key('skel', NZ + 20, { sx: 1, sy: 1 }, 3);

  // ---- 9.6–14 с: Скелет «растёт», стрижёт овцу — шерсть Розовой в лицо — овца бодает — «пуф»
  key('skel', NZ + 22, { eyes: 'angry', mouth: 'angry theeth' }, 0);
  const SX = 1460, SB = transform('skel', NZ + 24, SX1, SX, -1, { style: 'grow' });
  COAT[1].f1 = SB - 2; BURST.push({ f: SB - 2, at: [SX1, GROUND - 300], size: 0.8 });
  key('skel', SB, stance('skel', SX, -1), 0);
  key('skel', SB + 4, { mouth: 'theeth smile', eyes: 'angry' }, 0);
  key('pink', SB - 2, { mouth: 'puzzlement', eyes: 'sad' }, 0);
  const PK = SB + 8;
  key('skel', PK - 5, { lean: 28, hip: [0, ST.toRig('skel', 170)], head: 6 }, 5);
  key('skel', PK, { hitF: 1, hitFto: [SHL[0] + 10, SHL[1]], hitFfix: PK }, 4);
  SHE.push({ f0: PK, hand: 'skel', rot: Math.PI });
  sfx('pop', PK, { who: 'skel', gain: 0.4 });
  key('skel', PK + 8, { ...stance('skel', SX, -1), hitF: 0, handF: hand('skel', 'F', 0.6, -0.2), mouth: 'happy with theeth' }, 8);
  const SXc = 1400;
  walk('skel', PK + 8, SX, SXc, 1, 10, -1);
  const CUT = PK + 22;
  key('skel', CUT - 4, { lean: 18, handF: hand('skel', 'F', 0.95, 0.15) }, 4);
  for (const f of [CUT, CUT + 4]) snip(f);
  WOOL.push([CUT, 1], [CUT + 5, 0]);
  baa(CUT + 2, 0.9, 1.2);
  BURST.push({ f: CUT + 2, at: [SHX + 150, GROUND - 260], size: 0.7 });
  clump(CUT + 3, 12, [SHX + 150, GROUND - 320], 'pink:face', 90, 220);
  COAT.push({ who: 'pink', part: 'face', f0: CUT + 15, f1: 0, r: [[CUT + 15, 110], [CUT + 18, 150]] });
  key('skel', CUT + 8, { ...stance('skel', SXc, -1), mouth: 'happy with theeth', eyes: 'normal' }, 8);
  sfx('ref:laugh', CUT + 16, { who: 'skel', gain: 0.85, pitch: 0.8 });
  chuckle('skel', CUT + 16, CUT + 60, { mouth: 'happy with theeth' });
  key('pink', CUT + 15, { lean: -12, head: -12, mouth: 'puzzlement', eyes: 'sad', handF: hand('pink', 'F', 0.5, -0.8), handB: hand('pink', 'B', 0.3, -0.8) }, 2);
  tremble('pink', CUT + 17, CUT + 30, PX2, 4);
  // стриженая овца сердится — бодает Розовую
  const TRN = CUT + 18, RUN = TRN + 4, BUTT = RUN + 9;
  SHEEP.push({ f0: TRN, at: [SHX], face: -1 });
  baa(TRN, 1.0, 0.8);
  SHEEP.push({ f0: TRN + 1, f1: RUN, a: [SHX], b: [SHX + 120], face: -1 },
    { f0: RUN, f1: BUTT, a: [SHX + 120], b: [PX2 + 330], face: -1, run: true, ease: 'in' }, { f0: BUTT, f1: BUTT + 6, a: [PX2 + 330], b: [PX2 + 380], face: -1 }, { f0: BUTT + 6, at: [PX2 + 380], face: -1 });
  sfx('step', RUN + 2, { x: 700, gain: 0.5 }); sfx('step', RUN + 6, { x: 650, gain: 0.5 });
  sfx('bonk', BUTT, { who: 'pink', gain: 1.0 });
  const FB = fallBack('pink', BUTT, PX2, 1, { n: 14, stars: 26 });
  const PBX = 460;
  const psm = shrink('pink', FB + 6, PBX, 1, { mouth: 'puzzlement', eyes: 'sad', smoke: 420 });
  key('pink', psm, { lean: 0, head: 0, hip: [0, 0], legF: null, legB: null, zB: null, rot: 0 }, 0);
  move('pink', psm, { x: PBX, y: GROUND, rot: 0 });
  COAT[2].f1 = psm;
  COAT.push({ who: 'pink', part: 'face', f0: psm, f1: psm + 24, r: [[psm, 90]] });
  ev('stars', { who: 'pink', f0: psm + 4, f1: psm + 16, snd: false });
  // овца — обратно, щиплет траву
  const SHX2 = 700;
  SHEEP.push({ f0: BUTT + 10, at: [PX2 + 380], face: 1 }, { f0: BUTT + 14, f1: BUTT + 26, a: [PX2 + 380], b: [SHX2], face: 1, run: true }, { f0: BUTT + 26, at: [SHX2], face: 1 });
  const W2 = regrow(BUTT + 28);

  // ---- 14–18.3 с: шарик-Розовая прячется за овцой — Скелет стрижёт — «БУ!» — пугается — «пуф»
  key('pink', psm + 8, { eyes: 'angry', mouth: 'theeth smile' }, 0);
  const HIDE = Math.max(psm + 22, W2 + 2), HX = SHX2 + 10;
  hopTo('pink', HIDE - 12, HIDE, PBX, GROUND, HX, GROUND, 120);
  FRONT.push([HIDE - 3, 0]);
  key('pink', HIDE + 4, { sy: 0.9, sx: 1.05 }, 4);
  const SX2 = 1010;
  walk('skel', HIDE + 2, SXc, SX2, 2, 9, -1);
  key('skel', HIDE + 12, { mouth: 'happy with theeth', eyes: 'normal' }, 0);
  const CUT2 = HIDE + 22;
  key('skel', CUT2 - 4, { lean: 16, handF: hand('skel', 'F', 0.95, 0.15) }, 4);
  for (const f of [CUT2, CUT2 + 4]) snip(f);
  WOOL.push([CUT2, 1], [CUT2 + 5, 0]);
  BURST.push({ f: CUT2 + 2, at: [SHX2, GROUND - 220], size: 1.1 });
  baa(CUT2 + 2, 0.9, 1.25);
  // «БУ!»
  const BOO = CUT2 + 6, FACE = BOO + 7;
  FRONT[0][1] = BOO;
  LATE.push(() => { const t = target('skel:face', ST.stateAt(FACE)); hopTo('pink', BOO, FACE, HX, GROUND, t[0] - 70, t[1] + 150, 60, { land: false }); hopTo('pink', FACE + 2, FACE + 14, t[0] - 70, t[1] + 150, 520, GROUND, 80); });
  key('pink', BOO, { mouth: 'angry theeth', eyes: 'angry', sy: 1, sx: 1 }, 0);
  sfx('ref:grin-hit', BOO + 2, { who: 'pink', gain: 1.0 });
  key('pink', FACE, { sx: 1.25, sy: 1.25 }, 2); key('pink', FACE + 4, { sx: 1, sy: 1 }, 3);
  key('skel', FACE, { lean: -20, head: -16, mouth: 'puzzlement', eyes: 'sad', handF: hand('skel', 'F', 0.5, -0.9), handB: hand('skel', 'B', -0.5, -0.9) }, 2);
  sfx('scared', FACE + 1, { who: 'skel', gain: 1.0 });
  ev('sweat', { who: 'skel', f0: FACE + 1, f1: FACE + 20 });
  tremble('skel', FACE + 2, FACE + 12, SX2, 6);
  SHE.push({ f0: FACE + 2, f1: FACE + 14, a: (f, S) => C.skel.big.point(statesAt(FACE + 1).skel.st, 'handF'), b: [SX2 - 40, GROUND - 16], arc: 160, spin: 6 }, { f0: FACE + 14, at: [SX2 - 40, GROUND - 16], rot: -0.2 });
  const FB2 = fallBack('skel', FACE + 12, SX2, -1, { n: 14, stars: 24 });
  key('pink', FACE + 14, { mouth: 'happy with theeth', eyes: 'normal' }, 0);
  sfx('ref:laugh', FACE + 14, { who: 'pink', gain: 0.85, pitch: 1.35 });
  laugh('pink', FACE + 16, FACE + 26);
  const SBX = 1300;
  const ssm = shrink('skel', FB2 + 6, SBX, -1, { mouth: 'puzzlement', eyes: 'sad', smoke: 420 });
  key('skel', ssm, { lean: 0, head: 0, hip: [0, 0], legF: null, legB: null, zB: null, rot: 0 }, 0);
  move('skel', ssm, { x: SBX, y: GROUND, rot: 0 });
  ev('stars', { who: 'skel', f0: ssm + 4, f1: ssm + 16, snd: false });
  const W3 = regrow(CUT2 + 22);

  // ---- 18.3–22.5 с: Розовая «растёт» снова — Скелет влюблён — охапка шерсти — пушистый шар — овца бодает
  const PX3 = 440, PB2 = transform('pink', FACE + 28, 520, PX3, 1, { style: 'grow', love: 'skel', loveDur: 44 });
  key('pink', PB2, stance('pink', PX3, 1), 0);
  key('pink', PB2 + 4, { mouth: 'theeth smile', eyes: 'angry' }, 0);
  const PL = Math.max(PB2 + 8, W3 + 2);
  key('pink', PL - 5, { lean: 20, hip: [0, ST.toRig('pink', 110)], head: 6 }, 5);
  key('pink', PL, { hitF: 1, hitB: 1, hitFto: [SHX2 - 90, GROUND - 300], hitBto: [SHX2 - 150, GROUND - 290] }, 4);
  WOOL.push([PL + 2, 1], [PL + 8, 0]);
  baa(PL + 3, 0.9, 1.3);
  BURST.push({ f: PL + 6, at: [SHX2, GROUND - 260], size: 0.6 });
  key('pink', PL + 8, { ...stance('pink', PX3, 1), hitF: 0, hitB: 0, handF: hand('pink', 'F', 0.45, -0.85), handB: hand('pink', 'B', 0.3, -0.85) }, 8);
  const TH2 = PL + 14, HIT2 = TH2 + 12;
  key('pink', TH2, { handF: hand('pink', 'F', 0.95, -0.3), handB: hand('pink', 'B', 0.85, -0.3), lean: 14 }, 3, 'in2');
  sfx('swing', TH2 - 2, { who: 'pink', gain: 0.8 });
  CLUMP.push({ f0: PL + 8, f1: TH2, a: (f, S) => handsMid('pink', S), b: (f, S) => handsMid('pink', S), arc: 0, r: 120, hold: true });
  clump(TH2, 12, (f, S) => handsMid('pink', statesAt(TH2)), 'skel:body', 130, 200);
  COAT.push({ who: 'skel', part: 'body', f0: HIT2, f1: 0, r: [[HIT2, 180], [HIT2 + 4, 240]] });
  key('skel', HIT2, { sx: 1.2, sy: 0.85, mouth: 'puzzlement', eyes: 'sad' }, 1); key('skel', HIT2 + 4, { sx: 1, sy: 1 }, 3);
  key('pink', TH2 + 8, { ...stance('pink', PX3, 1), lean: 0, mouth: 'happy with theeth', eyes: 'normal' }, 8);
  sfx('ref:laugh', HIT2 + 2, { who: 'pink', gain: 0.85, pitch: 1.35 });
  chuckle('pink', HIT2 + 2, HIT2 + 40, { mouth: 'happy with theeth' });
  // овца видит «барашка» — бодает
  const SEE = HIT2 + 6, GO = SEE + 6, BT = GO + 12;
  SHEEP.push({ f0: SEE, at: [SHX2], face: 1 });
  baa(SEE, 1.0, 0.85);
  SHEEP.push({ f0: SEE + 1, f1: GO, a: [SHX2], b: [SHX2 - 100], face: 1 },
    { f0: GO, f1: BT, a: [SHX2 - 100], b: [SBX - 470], face: 1, run: true, ease: 'in' }, { f0: BT, f1: BT + 6, a: [SBX - 470], b: [SBX - 520], face: 1 }, { f0: BT + 6, at: [SBX - 520], face: 1 });
  sfx('step', GO + 3, { x: 1100, gain: 0.5 }); sfx('step', GO + 8, { x: 1200, gain: 0.5 });
  sfx('bonk', BT, { who: 'skel', gain: 0.8 }); sfx('boing', BT + 1, { who: 'skel', gain: 0.8 });
  key('skel', BT, { pivot: ST.CAST.skel.pivot }, 0);
  move('skel', BT, { x: SBX, y: GROUND, rot: 0 });
  move('skel', BT + 26, { x: 2250, rot: 900 }, 'in');
  for (let k = 0; k < 3; k++) { const a = BT + k * 8; move('skel', a, { y: GROUND }); move('skel', a + 4, { y: GROUND - 70 + k * 15 }, 'out2'); move('skel', a + 8, { y: GROUND }, 'in2'); }
  sfx('scared', BT + 2, { who: 'skel', gain: 0.7 }); sfx('whoosh', BT + 2, { who: 'skel', dur: 20, gain: 0.5 });
  ev('twinkle', { f: BT + 24, at: [1820, GROUND - 150], n: 22, size: 56 });

  // ---- 22.5–27 с: овца ластится к Розовой; Розовая в центре, руки вверх
  const BACK = BT + 12, SHX3 = 470;
  SHEEP.push({ f0: BACK, at: [SBX - 520], face: -1 }, { f0: BACK + 4, f1: BACK + 26, a: [SBX - 520], b: [SHX3], face: -1, run: true }, { f0: BACK + 26, at: [SHX3], face: 1 });
  const WIN = victory('pink', BT + 6, PX3, { n: 9, stride: 130 });
  SHEARTS.push([BACK + 26, BACK + 70]); sfx('love', BACK + 26, { x: SHX3, gain: 0.6 });
  const REG = regrow(BACK + 30);
  for (let k = 0; k < 4; k++) { const a = REG + 8 + k * 12; SHEEP.push({ f0: a, f1: a + 8, a: [SHX3], b: [SHX3], arc: 60, face: 1 }, { f0: a + 8, at: [SHX3], face: 1 }); if (k % 2 === 0) baa(a + 2, 0.6, 1.3); }
  WOOL.sort((a, b) => a[0] - b[0]); SHEEP.sort((a, b) => a.f0 - b.f0); SHE.sort((a, b) => a.f0 - b.f0);
  for (const fn of LATE) fn();
  window.T = { SN0: SN[0], PB, GR, ON, NZ, SB, CUT, BUTT, psm, HIDE, CUT2, FACE, ssm, PB2, PL, HIT2, BT, WIN, REG };
};

// ------------------------------------------------------------------ рисование
const drawSheep = (ctx, f, S) => { const s = sheepAt(f, S); if (s) FX.mcSheep(ctx, s.x, s.y, SS, s.face, s.phase, s.wool, s.chew, s.sq, s.eat); return s; };
const inFront = (f) => FRONT.some(([a, b]) => f >= a && (!b || f < b)) || !!(segAt(SHEEP, f) || {}).hands || !!(segAt(SHEEP, f) || {}).on;
function shearsAt(f, S) {
  const c = segAt(SHE, f);
  if (!c) return null;
  const open = SNIPS.some((g) => f >= g - 2 && f < g) ? 1 : 0;
  if (c.ball) { if (S[c.ball].p.form !== 'small') return null; const p = S[c.ball].p; return { x: p.x + p.face * 150, y: p.y - 120, rot: p.face > 0 ? 0 : Math.PI, open }; }
  if (c.hand) { if (S[c.hand].p.form !== 'big') return null; const h = C[c.hand].big.point(S[c.hand].st, 'handF'); return { x: h[0], y: h[1], rot: c.rot, open }; }
  if (c.at) return { x: c.at[0], y: c.at[1], rot: c.rot || 0, open: 0 };
  const u = E.clamp((f - c.f0) / (c.f1 - c.f0), 0, 1), a = P(c.a, c.f0, statesAt(c.f0)), b = P(c.b, f, S);
  return { x: E.lerp(a[0], b[0], u), y: E.lerp(a[1], b[1], u) - Math.sin(Math.PI * u) * (c.arc || 0), rot: u * (c.spin || 0), open: 0 };
}
ST.hooks.beforeChars.push((ctx, f, S, CAM) => {
  ctx.setTransform(...CAM);
  if (!inFront(f)) drawSheep(ctx, f, S);
  const c = segAt(SHE, f);
  if (c && c.at) { const k = shearsAt(f, S); FX.shears(ctx, k.x, k.y, 130, k.rot, 0); }
});
ST.hooks.afterChars.push((ctx, f, S, CAM) => {
  ctx.setTransform(...CAM);
  if (inFront(f)) drawSheep(ctx, f, S);
  for (const h of SHEARTS) if (f >= h[0] && f < h[1]) { const s = sheepAt(f, S); if (s) { const t = [s.x + s.face * SS * 0.45, s.y - SS * 0.95]; FX.hearts(ctx, t[0], t[1], (f - h[0]) / FPS, Math.min(1, (h[1] - f) / 8)); } }
  const c = segAt(SHE, f);
  if (c && !c.at) { const k = shearsAt(f, S); if (k) FX.shears(ctx, k.x, k.y, 130, k.rot, k.open); }
  for (const w of COAT) {
    if (f < w.f0 || (w.f1 && f >= w.f1)) continue;
    const t = target(`${w.who}:${w.part}`, S), r = lerpKeys(w.r, f) * (1 + 0.03 * Math.sin(f * 0.7));
    FX.fluff(ctx, t[0], t[1] + (w.dy || 0), r, w.f0, 1, WC, WL);
  }
  for (const k of CLUMP) {
    const u = (f - k.f0) / (k.f1 - k.f0);
    if (u < 0 || u >= 1) continue;
    const a = P(k.a, f, S), b = P(k.b, k.hold ? f : k.f1, k.hold ? S : statesAt(k.f1));
    const a0 = k.hold ? a : P(k.a, k.f0, statesAt(k.f0));
    FX.fluff(ctx, E.lerp(a0[0], b[0], u), E.lerp(a0[1], b[1], u) - Math.sin(Math.PI * u) * k.arc, k.r, k.f0 + 3, 1, WC, WL);
  }
  for (const b of BURST) FX.fluffBurst(ctx, b.at[0], b.at[1], (f - b.f) / 20, b.size, b.f, WC, WL);
});

ST.start(BIG);
