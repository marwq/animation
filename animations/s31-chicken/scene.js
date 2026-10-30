// Ролик 19 (бывш. 31): Курица — Розовая (слева) против Малыша (справа), 25 с, 24 кадра/с. Драка без ударов:
// курица из майнкрафта с перепугу несёт яйца — они летят и разбиваются; на курице можно летать.
// В начале — считалка «3, 2, 1, FIGHT». Музыка превращения — один раз. Фон — плитки: голубая стена, салатовый пол, точки.
//
//   0–2.2 с   считалка: шарик-Розовая и шарик-Малыш неподвижно стоят друг напротив друга
//   2.2–4 с   с неба слетает курица; Малыш пугает её «бу!» — она с перепугу стреляет яйцами в Розовую
//   4.1–5.3 с Розовая «растёт» под музыку — Малыш влюблён
//   5.4–9 с   берёт курицу, как яйцемёт, — влюблённый Малыш летит к ней на пропеллере — яйца ему в лицо
//   9–13 с    Малыш «растёт», сажает курицу ей на голову и пугает — курица мечется, яйца бьются под ногами —
//             Розовая скользит по желткам — «пуф»
//   13–17 с   шарик-Розовая садится верхом на курицу, летит над Малышом и «бомбит» его яйцом — желток в
//             глаза, вслепую спотыкается — «пуф»
//   17–21 с   Розовая «растёт» снова; шарик-Малыш удирает на пропеллере, курица гонится за ним и клюёт
//   21–25 с   Розовая в центре, руки вверх
'use strict';

const ST = Stage({
  name: '19 Розовая vs Малыш',
  frames: 600,
  intro: 'countdown-321',
  cast: {
    pink: { small: ['girl-verity-small', { bodyHeight: 300 }], big: ['girl-verity-big', { height: 730, splitFeet: true }],
      pivot: 337, voice: 1.35, vAngle: 50, lie: 55, color: '#ff4fc8', moods: { angry: 'angry theeth', grin: 'theeth smile', big: 'theeth smile' } },
    baby: { small: ['child-verity-pink', { bodyHeight: 300, spin: { layer: 'hat', cut: 122, axis: 389 } }],
      big: ['child-verity-big', { height: 730, spin: { layer: 'hat', cut: 106, axis: 330 } }], pivot: 338, voice: 1.25,
      lie: 60, color: '#ffd9b8', moods: { angry: ' 2', grin: ' 2', big: 'theeth smile', love: ' 1' } },
  },
  order: ['baby', 'pink'],
  background: { theme: 'tiles', seed: 1019, wall: '#16b6dc', floor: '#b6ea5c', motif: 'dots', sky: ['#3f98ee', '#d0ecff'] },
  clouds: [[150, 80, 2.4, 0, 12], [700, 220, 1.8, 1, 16], [1150, 70, 2.6, 2, 10], [1720, 250, 1.5, 0, 18]],
});
const { FPS, NF, GROUND, C, key, move, ev, sfx, hop, tumble, laugh, tremble, transform, shrink, stance, walk,
  slip, fallBack, victory, chuckle, hand, statesAt, target } = ST;
const P = (v, f, S) => (typeof v === 'function' ? v(f, S) : typeof v === 'string' ? target(v, S) : v);
ST.parts.mouth = (ch, st, p) => (p.form === 'big' ? ST.parts.lips(ch, st) : E.apply(ch.eyeMatrix(st, ' 2'), [315, 740]));
ST.parts.mid = (ch, st) => { const h = ch.point(st, 'head'), f = ch.point(st, 'face'); return [(h[0] + f[0]) / 2, (h[1] + f[1]) / 2]; };
function propeller(who, f0, f1, rps = 7, o = {}) {
  key(who, f0, { spin: 0, spinBlur: 0 }, 0);
  key(who, f0 + 8, { spinBlur: 1 }, 8);
  move(who, f1, { spin: rps * (f1 - f0) / 24 }, 'lin');
  key(who, f1, { spinBlur: 0 }, 6);
  key(who, f1 + 1, { spin: 0 }, 0);
  if (o.snd !== false) sfx('whirr', f0, { who, dur: f1 - f0, gain: o.gain ?? 0.4 });
}

// ------------------------------------------------------------------ курица, яйца, желтки
const HS = 320;
const HEN = [];           // {f0, at:[x,y], face} | {f0, f1, a, b, arc, face, run, fly, ease} | {f0, hands: who, face, dx, dy} | {f0, head: who, face} | {f0, path, face}
const FLAP = [];          // [f0, f1]
const PECK = [];          // [f0, f1]
const EGGS = [];          // {f0, f1, a, b, arc, spin}
const YOLK = [];          // {who, part, f0, f1, s, seed}
const PUD = [];           // {f0, f1, x, w}
const FEATH = [];         // {f, at}
function segAt(segs, f) { let c = null; for (const s of segs) if (f >= s.f0) c = s; return c && !c.gone ? c : null; }
const handsMid = (who, S) => { const h = C[who].big.point(S[who].st, 'handF'), g = C[who].big.point(S[who].st, 'handB'); return [(h[0] + g[0]) / 2, Math.max(h[1], g[1])]; };
function henAt(f, S) {
  const c = segAt(HEN, f);
  if (!c) return null;
  const fl = FLAP.some(([a, b]) => f >= a && f < b) ? Math.sin(f * 1.6) : 0;
  const pk = PECK.some(([a, b]) => f >= a && f < b) ? Math.max(0, Math.sin(f * 1.1)) : 0;
  const base = { face: c.face, flap: fl, peck: pk, phase: 0 };
  if (c.at) return { ...base, x: c.at[0], y: c.at[1] ?? GROUND };
  if (c.hands) { if (S[c.hands].p.form !== 'big') return null; const m = handsMid(c.hands, S); return { ...base, x: m[0] + (c.dx || 0), y: m[1] + (c.dy ?? 110) }; }
  if (c.head) { const t = target(`${c.head}:face`, S); return { ...base, x: t[0] - 20, y: t[1] + HS * 0.42, flap: fl || Math.sin(f * 1.6) }; }
  const u = E.clamp((f - c.f0) / (c.f1 - c.f0), 0, 1), e = c.ease ? E.EASE[c.ease](u) : u;
  const a = P(c.a, c.f0, statesAt(c.f0)), b = P(c.b, f, S);
  return { ...base, x: E.lerp(a[0], b[0], e), y: E.lerp(a[1] ?? GROUND, b[1] ?? GROUND, e) - Math.sin(Math.PI * u) * (c.arc || 0),
    phase: c.run ? f * 1.1 : 0, flap: c.fly ? Math.sin(f * 1.6) : fl };
}
const henPt = (f) => { const h = henAt(f, statesAt(f)); return [h.x, h.y]; };
const henRear = (f, S) => { const h = henAt(f, S); return [h.x - h.face * HS * 0.34, h.y - HS * 0.42]; };
const henBack = (f, S) => { const h = henAt(f, S); return [h.x - h.face * HS * 0.06, h.y - HS * 0.66 + 8]; };
function layEgg(f, to, n = 10, arc = 80) {
  EGGS.push({ f0: f, f1: f + n, a: (g, S) => henRear(f, statesAt(f)), b: to, arc, spin: 6 });
  sfx('pop', f, { x: 960, gain: 0.7, pitch: 1.2 }); sfx('whoosh', f + 1, { x: 960, dur: n, gain: 0.35 }); sfx('crunch', f + n, { x: 960, gain: 0.7 }); sfx('squish', f + n, { x: 960, gain: 0.6 });
}
function cluck(f, gain = 0.8) { sfx('baa', f, { x: 960, gain, pitch: 2.6, dur: 6 }); sfx('baa', f + 5, { x: 960, gain: gain * 0.8, pitch: 2.9, dur: 5 }); }
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

const PX0 = 470, BX0 = 1450, MX = 960, GO = 54;
// ================================================================== 0–2.2 с: считалка, оба стоят
key('pink', 0, { form: 'small', x: PX0, y: GROUND, face: 1, look: 1, eyes: 'normal', mouth: 'smile normal', sx: 1, sy: 1, rot: 0, pivot: 0, alpha: 1 }, 0);
key('baby', 0, { form: 'small', x: BX0, y: GROUND, face: -1, look: 1, eyes: 'normal', mouth: ' 6', sx: 1, sy: 1, rot: 0, pivot: 0, alpha: 1 }, 0);

const BIG = () => {
  // ---- 2.2–4 с: курица слетает с неба — Малыш пугает «бу!» — яйца в Розовую
  HEN.push({ f0: GO, f1: GO + 14, a: [1400, -250], b: [MX, GROUND], face: 1, fly: true, ease: 'out2' }, { f0: GO + 14, at: [MX], face: 1 });
  FLAP.push([GO, GO + 16]); sfx('gust', GO, { x: MX, dur: 14, gain: 0.5 }); cluck(GO + 12, 0.7);
  PECK.push([GO + 18, GO + 30]);
  key('pink', GO + 3, { mouth: 'puzzlement' }, 0); key('baby', GO + 3, { mouth: ' 5' }, 0);
  key('baby', GO + 8, { mouth: ' 2', eyes: 'angry' }, 0);
  const BX1 = 1200;
  hopTo('baby', GO + 9, GO + 18, BX0, GROUND, BX1, GROUND, 70);
  const BOO = GO + 22;
  key('baby', BOO - 3, { sx: 0.9, sy: 1.1 }, 3); key('baby', BOO, { sx: 1.3, sy: 1.3, mouth: ' 5' }, 2); key('baby', BOO + 6, { sx: 1, sy: 1 }, 4);
  sfx('ref:grin-hit', BOO, { who: 'baby', gain: 1.0 });
  HEN.push({ f0: BOO + 1, f1: BOO + 9, a: [MX], b: [MX - 20, GROUND - 60], arc: 60, face: 1 }, { f0: BOO + 9, f1: BOO + 14, a: [MX - 20, GROUND - 60], b: [MX - 20], face: 1 }, { f0: BOO + 14, at: [MX - 20], face: 1 });
  FLAP.push([BOO + 1, BOO + 30]); cluck(BOO + 2, 1.0); FEATH.push({ f: BOO + 2, at: [MX, GROUND - 160] });
  const E1 = BOO + 4;
  layEgg(E1, 'pink:mid', 10, 60); layEgg(E1 + 5, 'pink:top', 10, 90); layEgg(E1 + 10, 'pink:body', 10, 50);
  YOLK.push({ who: 'pink', part: 'mid', f0: E1 + 10, f1: 0, s: 130, seed: 3 }, { who: 'pink', part: 'top', f0: E1 + 15, f1: 0, s: 110, seed: 5 }, { who: 'pink', part: 'body', f0: E1 + 20, f1: 0, s: 110, seed: 7 });
  for (const f of [E1 + 10, E1 + 15, E1 + 20]) { key('pink', f, { sx: 1.18, sy: 0.86, mouth: 'puzzlement', eyes: 'sad' }, 1); key('pink', f + 3, { sx: 1, sy: 1 }, 2); }
  sfx('hurt', E1 + 11, { who: 'pink', gain: 0.8 });
  key('baby', BOO + 8, { mouth: ' 1', eyes: 'normal' }, 0);
  sfx('ref:laugh', BOO + 10, { who: 'baby', gain: 0.85, pitch: 1.3 });
  laugh('baby', BOO + 12, BOO + 34);

  // ---- 4.1–5.3 с: Розовая «растёт» — желтки слетают, Малыш влюблён
  const PX = 520;
  key('pink', E1 + 16, { eyes: 'angry', mouth: 'angry theeth' }, 0);
  const PB = transform('pink', E1 + 18, PX0, PX, 1, { style: 'grow', love: 'baby', loveDur: 60 });
  for (const y of YOLK) y.f1 = PB - 3;
  key('pink', PB, stance('pink', PX, 1), 0);
  key('pink', PB + 4, { mouth: 'theeth smile', eyes: 'normal' }, 0);

  // ---- 5.4–9 с: курица — яйцемёт — влюблённый Малыш летит к ней — яйца ему в лицо
  const PX1 = 620;
  walk('pink', PB + 1, PX, PX1, 1, 8, 1);
  const GR = PB + 12;
  key('pink', GR - 5, { lean: 26, hip: [0, ST.toRig('pink', 170)], head: 6, mouth: 'theeth smile', eyes: 'angry' }, 5);
  key('pink', GR, { hitF: 1, hitB: 1, hitFto: [MX + 20, GROUND - 120], hitBto: [MX - 80, GROUND - 120] }, 4);
  HEN.push({ f0: GR, hands: 'pink', face: -1, dx: 90, dy: 110 });
  FLAP.push([GR, GR + 10]); cluck(GR + 1, 0.8);
  key('pink', GR + 10, { ...stance('pink', PX1, 1), hitF: 0, hitB: 0, handF: hand('pink', 'F', 0.95, -0.1), handB: hand('pink', 'B', 0.85, -0.15), lean: -4 }, 10);
  // Малыш летит к ней
  const FLY0 = PB + 6, FLY1 = GR + 22;
  propeller('baby', FLY0, FLY1 + 30, 9);
  ev('hearts', { who: 'baby', f0: FLY0, f1: FLY1 + 6, snd: false });
  move('baby', FLY0, { x: BX1, y: GROUND }); move('baby', FLY0 + 14, { x: 1200, y: GROUND - 260 }, 'out2');
  move('baby', FLY1, { x: 1060, y: GROUND - 280 }, 'io');
  sfx('kiss', FLY1 - 6, { who: 'baby', gain: 0.6 });
  // три яйца: от первого увернулся (поднялся), два — в лицо
  const S1 = GR + 14;
  for (let i = 0; i < 3; i++) {
    const f = S1 + i * 7;
    key('pink', f - 2, { handF: hand('pink', 'F', 0.9, -0.05), handB: hand('pink', 'B', 0.92, -0.1) }, 2); key('pink', f + 1, { handF: hand('pink', 'F', 0.95, -0.1), handB: hand('pink', 'B', 0.85, -0.15) }, 2);
    cluck(f, 0.7);
  }
  layEgg(S1, [1400, GROUND - 600], 12, 40);
  move('baby', S1 + 4, { x: 1080, y: GROUND - 420 }, 'out2'); move('baby', S1 + 10, { x: 1080, y: GROUND - 300 }, 'in2');
  layEgg(S1 + 7, 'baby:mid', 9, 30); layEgg(S1 + 14, 'baby:mid', 9, 30);
  YOLK.push({ who: 'baby', part: 'mid', f0: S1 + 16, f1: 0, s: 150, seed: 9 }, { who: 'baby', part: 'top', f0: S1 + 23, f1: 0, s: 120, seed: 11 });
  key('baby', S1 + 16, { mouth: ' 5', eyes: 'sad', sx: 1.15, sy: 0.88 }, 1); key('baby', S1 + 20, { sx: 1, sy: 1 }, 3);
  // падает вниз — боинг
  const BXL = 1260, BFALL = S1 + 30;
  move('baby', S1 + 24, { x: 1080, y: GROUND - 300 }); move('baby', BFALL, { x: BXL, y: GROUND }, 'in2');
  key('baby', BFALL, { sx: 1.35, sy: 0.7 }, 1); key('baby', BFALL + 5, { sx: 1, sy: 1 }, 4);
  sfx('fall', BFALL, { who: 'baby', gain: 0.8 }); ev('stars', { who: 'baby', f0: BFALL + 2, f1: BFALL + 20 });
  key('pink', S1 + 18, { mouth: 'happy with theeth', eyes: 'normal' }, 0);
  sfx('ref:laugh', S1 + 18, { who: 'pink', gain: 0.85, pitch: 1.35 });
  chuckle('pink', S1 + 18, BFALL + 10, { mouth: 'happy with theeth' });
  // ставит курицу
  const PUT = BFALL + 6, HX2 = PX1 + 240;
  key('pink', PUT, { lean: 18, hip: [0, ST.toRig('pink', 120)], handF: hand('pink', 'F', 0.9, 0.3), handB: hand('pink', 'B', 0.8, 0.3) }, 6);
  HEN.push({ f0: PUT + 6, f1: PUT + 10, a: (f, S) => henPt(PUT + 5), b: [HX2], face: 1, ease: 'in2' }, { f0: PUT + 10, at: [HX2], face: 1 });
  cluck(PUT + 10, 0.6);
  key('pink', PUT + 14, { ...stance('pink', PX1, 1), lean: 0, hip: [0, 0] }, 8);
  PECK.push([PUT + 12, PUT + 40]);

  // ---- 9–13 с: Малыш «растёт», сажает курицу ей на голову и пугает — яйца под ноги — скользит — «пуф»
  key('baby', BFALL + 4, { eyes: 'angry', mouth: ' 2' }, 0);
  const BX = 1350, BB = transform('baby', BFALL + 6, BXL, BX, -1, { style: 'grow' });
  for (const y of YOLK) if (y.who === 'baby') y.f1 = BB - 3;
  key('baby', BB, stance('baby', BX, -1), 0);
  key('baby', BB + 4, { mouth: 'theeth smile', eyes: 'angry' }, 0);
  key('pink', BB - 2, { mouth: 'puzzlement', eyes: 'sad' }, 0);
  const BX2 = 1100;
  walk('baby', BB + 2, BX, BX2, 2, 7, -1);
  const GR2 = BB + 17;
  key('baby', GR2 - 5, { lean: 26, hip: [0, ST.toRig('baby', 170)], head: 6 }, 5);
  key('baby', GR2, { hitF: 1, hitB: 1, hitFto: [HX2 + 60, GROUND - 120], hitBto: [HX2 - 30, GROUND - 120] }, 4);
  HEN.push({ f0: GR2, hands: 'baby', face: -1, dx: -40, dy: 110 });
  cluck(GR2 + 1, 0.8); FLAP.push([GR2, GR2 + 8]);
  key('baby', GR2 + 8, { ...stance('baby', BX2, -1), hitF: 0, hitB: 0, handF: hand('baby', 'F', 0.3, -0.95), handB: hand('baby', 'B', 0.2, -0.95) }, 8);
  const TH = GR2 + 10, ONH = TH + 9;
  key('baby', TH, { handF: hand('baby', 'F', 0.95, -0.35), handB: hand('baby', 'B', 0.85, -0.35), lean: 14 }, 3, 'in2');
  sfx('swing', TH - 2, { who: 'baby', gain: 0.8 });
  HEN.push({ f0: TH, f1: ONH, a: (f, S) => henPt(TH - 1), b: (f, S) => { const t = target('pink:face', S); return [t[0] - 20, t[1] + HS * 0.42]; }, arc: 160, face: -1, fly: true }, { f0: ONH, head: 'pink', face: -1 });
  sfx('land', ONH, { who: 'pink', gain: 0.6 }); cluck(ONH, 0.8);
  key('pink', ONH, { handF: hand('pink', 'F', 0.5, -0.95), handB: hand('pink', 'B', 0.3, -0.95), mouth: 'puzzlement', eyes: 'sad', head: -6 }, 3);
  key('baby', TH + 10, { ...stance('baby', BX2, -1), lean: 0, mouth: 'happy with theeth' }, 6);
  // «бу!» — курица мечется у неё на голове, яйца бьются под ногами
  const BOO2 = ONH + 8;
  key('baby', BOO2 - 4, { lean: -8, head: -6 }, 4); key('baby', BOO2, { lean: 12, head: 10, mouth: 'theeth smile', eyes: 'angry' }, 2);
  sfx('ref:grin-hit', BOO2, { who: 'baby', gain: 1.0 });
  FLAP.push([BOO2, BOO2 + 30]); cluck(BOO2 + 1, 1.0); cluck(BOO2 + 14, 0.9); FEATH.push({ f: BOO2 + 2, at: [PX1, GROUND - 760] });
  for (let i = 0; i < 3; i++) { const f = BOO2 + 4 + i * 6; layEgg(f, [PX1 + 40 + (i - 1) * 70, GROUND - 10], 8, 30); }
  PUD.push({ f0: BOO2 + 12, f1: 0, x: PX1 + 40, w: 330 });
  tremble('pink', BOO2 + 2, BOO2 + 22, PX1, 5);
  sfx('ref:laugh', BOO2 + 6, { who: 'baby', gain: 0.85, pitch: 1.2 });
  chuckle('baby', BOO2 + 6, BOO2 + 50, { mouth: 'happy with theeth' });
  const SL = BOO2 + 20;
  const LIE = slip('pink', SL, PX1, 1, { n: 12, stars: 24 });
  HEN.push({ f0: SL + 2, f1: SL + 18, a: (f, S) => henPt(SL + 1), b: [1500, GROUND], arc: 200, face: 1, fly: true }, { f0: SL + 18, at: [1500], face: -1 });
  sfx('gust', SL + 2, { x: 1100, dur: 16, gain: 0.5 });
  const PBX = 380;
  const psm = shrink('pink', LIE + 6, PBX, 1, { mouth: 'puzzlement', eyes: 'sad', smoke: 420 });
  key('pink', psm, { lean: 0, head: 0, hip: [0, 0], legF: null, legB: null, zB: null, rot: 0 }, 0);
  move('pink', psm, { x: PBX, y: GROUND, rot: 0 });
  YOLK.push({ who: 'pink', part: 'mid', f0: psm, f1: psm + 24, s: 110, seed: 13 });
  ev('stars', { who: 'pink', f0: psm + 4, f1: psm + 14, snd: false });

  // ---- 13–17 с: шарик-Розовая верхом на курице — летит над Малышом — яйцо ему на голову — «пуф»
  key('pink', psm + 6, { eyes: 'angry', mouth: 'theeth smile' }, 0);
  const HX3 = 760;
  HEN.push({ f0: psm, f1: psm + 18, a: [1500], b: [HX3], face: -1, run: true }, { f0: psm + 18, at: [HX3], face: 1 });
  for (let f = psm + 2; f < psm + 18; f += 5) sfx('step', f, { x: 1100, gain: 0.35, pitch: 1.4 });
  const ON = psm + 22;
  LATE.push(() => { const b = henBack(ON, ST.stateAt(ON)); hopTo('pink', psm + 10, ON, PBX, GROUND, b[0], b[1], 120, { land: false }); });
  key('pink', ON, { sx: 1.3, sy: 0.75 }, 1); key('pink', ON + 4, { sx: 1, sy: 1 }, 3);
  cluck(ON, 0.9);
  const F0 = ON + 3, OVER = F0 + 16, BXH = BX2;
  const HOV = [BXH - 300, GROUND - 250];
  HEN.push({ f0: F0, f1: OVER, a: [HX3], b: HOV, face: 1, fly: true, ease: 'io' }, { f0: OVER, f1: OVER + 24, a: HOV, b: HOV, face: -1, fly: true });
  sfx('gust', F0, { x: 1000, dur: 50, gain: 0.6 });
  const RID = { who: 'pink', f0: ON + 1, f1: OVER + 40 };
  key('baby', OVER - 6, { look: 1, head: -4, mouth: 'puzzlement', eyes: 'normal' }, 4);
  const DROP = OVER + 3;
  EGGS.push({ f0: DROP, f1: DROP + 9, a: (g, S) => henRear(DROP, statesAt(DROP)), b: 'baby:mid', arc: 30, spin: 3, big: true });
  sfx('pop', DROP, { x: BXH, gain: 0.7 }); sfx('whoosh', DROP + 1, { x: BXH, dur: 8, gain: 0.4 }); sfx('crunch', DROP + 9, { who: 'baby', gain: 1.0 }); sfx('squish', DROP + 9, { who: 'baby', gain: 0.8 });
  YOLK.push({ who: 'baby', part: 'mid', f0: DROP + 9, f1: 0, s: 230, seed: 15 });
  key('baby', DROP + 9, { lean: -14, head: -14, mouth: 'puzzlement', eyes: 'sad', handF: hand('baby', 'F', 0.4, -0.8), handB: hand('baby', 'B', 0.2, -0.8) }, 2);
  key('pink', DROP + 6, { mouth: 'happy with theeth', eyes: 'normal' }, 0);
  sfx('ref:laugh', DROP + 8, { who: 'pink', gain: 0.85, pitch: 1.35 });
  // вслепую шагает в лужу из желтков — падает
  walk('baby', DROP + 11, BX2, PX1 + 70, 3, 8, -1, false);
  const SL2 = DROP + 36;
  const LIE2 = slip('baby', SL2, PX1 + 70, -1, { n: 12, stars: 24 });
  const BBX = 860;
  const bsm = shrink('baby', LIE2 + 6, BBX, -1, { mouth: ' 5', eyes: 'sad', smoke: 420 });
  key('baby', bsm, { lean: 0, head: 0, hip: [0, 0], legF: null, legB: null, zB: null, rot: 0 }, 0);
  move('baby', bsm, { x: BBX, y: GROUND, rot: 0 });
  YOLK[YOLK.length - 1].f1 = bsm; YOLK.push({ who: 'baby', part: 'mid', f0: bsm, f1: 0, s: 130, seed: 17 });
  ev('stars', { who: 'baby', f0: bsm + 4, f1: bsm + 14, snd: false });
  // курица садится, Розовая спрыгивает
  const LANDH = OVER + 24, HX4 = 1400;
  HEN.push({ f0: LANDH, f1: LANDH + 14, a: HOV, b: [HX4], face: 1, fly: true }, { f0: LANDH + 14, at: [HX4], face: -1 });
  RID.f1 = LANDH + 12;
  const PL = 1500;
  LATE.push(() => { const b = henBack(LANDH + 14, ST.stateAt(LANDH + 14)); hopTo('pink', LANDH + 14, LANDH + 26, b[0], b[1], PL, GROUND, 100); });

  // ---- 17–21 с: Розовая «растёт» снова; шарик-Малыш удирает на пропеллере, курица гонится и клюёт
  const PB2 = transform('pink', LANDH + 28, PL, PL - 40, -1, { style: 'grow' });
  key('pink', PB2, stance('pink', PL - 40, -1), 0);
  key('pink', PB2 + 4, { mouth: 'happy with theeth', eyes: 'normal' }, 0);
  const ESC = bsm + 6;
  key('baby', ESC, { face: -1, mouth: ' 5', eyes: 'sad' }, 0);
  sfx('scared', ESC + 2, { who: 'baby', gain: 0.7 });
  propeller('baby', ESC, ESC + 50, 10);
  move('baby', ESC + 2, { x: BBX, y: GROUND }); move('baby', ESC + 18, { x: 600, y: GROUND - 260 }, 'io'); move('baby', ESC + 50, { x: -300, y: GROUND - 380 }, 'in');
  HEN.push({ f0: ESC + 14, f1: ESC + 56, a: [HX4], b: [-400, GROUND - 300], face: -1, fly: true, ease: 'in' });
  FLAP.push([ESC + 14, ESC + 56]); PECK.push([ESC + 20, ESC + 56]);
  cluck(ESC + 16, 1.0); cluck(ESC + 32, 0.9);
  for (let f = ESC + 26; f < ESC + 50; f += 8) { sfx('bonk', f, { who: 'baby', gain: 0.4, pitch: 1.5 }); sfx('hurt', f + 1, { who: 'baby', gain: 0.4 }); }
  chuckle('pink', PB2 + 4, PB2 + 26, { mouth: 'happy with theeth' });
  sfx('ref:laugh', PB2 + 8, { who: 'pink', gain: 0.85, pitch: 1.35 });

  // ---- 21–25 с: в центр, руки вверх
  const WIN = victory('pink', Math.max(PB2 + 24, ESC + 34), PL - 40, { n: 9, stride: 90 });
  HEN.sort((a, b) => a.f0 - b.f0);
  for (const fn of LATE) fn();
  for (let f = RID.f0; f <= RID.f1; f++) { const b = henBack(f, ST.stateAt(f)); move('pink', f, { x: b[0], y: b[1] }, 'lin'); }
  window.T = { BOO, E1, PB, GR, S1, BFALL, BB, ONH, BOO2, SL, psm, ON, OVER, DROP, SL2, bsm, LANDH, PB2, ESC, WIN };
};

// ------------------------------------------------------------------ рисование
const henFront = (f) => { const c = segAt(HEN, f); return c && (c.hands || c.head || c.f1); };
function drawHen(ctx, f, S) { const h = henAt(f, S); if (h) FX.mcChicken(ctx, h.x, h.y, HS, h.face, h.phase, h.flap, 1, h.peck); }
ST.hooks.beforeChars.push((ctx, f, S, CAM) => {
  ctx.setTransform(...CAM);
  for (const p of PUD) if (f >= p.f0 && (!p.f1 || f < p.f1)) { ctx.save(); ctx.translate(p.x, GROUND + 6); ctx.scale(1, 0.3); FX.yolk(ctx, 0, 0, p.w * Math.min(1, (f - p.f0 + 2) / 8), 21); ctx.restore(); }
  if (!henFront(f)) drawHen(ctx, f, S);
});
ST.hooks.afterChars.push((ctx, f, S, CAM) => {
  ctx.setTransform(...CAM);
  if (henFront(f)) drawHen(ctx, f, S);
  for (const e of EGGS) {
    const u = (f - e.f0) / (e.f1 - e.f0);
    if (u < 0 || u >= 1) continue;
    const a = P(e.a, e.f0, statesAt(e.f0)), b = P(e.b, e.f1, statesAt(e.f1));
    FX.egg(ctx, E.lerp(a[0], b[0], u), E.lerp(a[1], b[1], u) - Math.sin(Math.PI * u) * e.arc, e.big ? 110 : 70, u * e.spin);
  }
  for (const y of YOLK) {
    if (f < y.f0 || (y.f1 && f >= y.f1)) continue;
    const p = target(`${y.who}:${y.part}`, S);
    FX.yolk(ctx, p[0], p[1], y.s * Math.min(1, (f - y.f0 + 2) / 3), y.seed);
  }
  for (const fe of FEATH) FX.feathers(ctx, fe.at[0], fe.at[1], (f - fe.f) / FPS, fe.f, 14, 0.8);
});

ST.start(BIG);
