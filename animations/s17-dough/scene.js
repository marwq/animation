// Серия 2, ролик 17: Тесто — Розовая (слева) против Малыша (справа), 22 с, 24 кадра/с. Драка без ударов:
// скалка и тесто: раскатать в блин, накинуть пласт теста на голову, прокатиться на скалке.
// Музыка превращения — один раз. Фон — яблоневый сад.
//
//   0–2 с     шарик-Розовая и шарик-Малыш неподвижно стоят друг напротив друга, середина пустая
//   2–4 с     с неба падает скалка; Малыш катится на ней, как на бревне, — и раскатывает Розовую в блин
//   4.1–5.3 с Розовая «растёт» под музыку — скалка отлетает, Малыш влюблён
//   5.4–9.5 с с неба падает ком теста — она ловит и накрывает им Малыша, берёт скалку и раскатывает его в лепёшку;
//             Малыш на пропеллере вылетает из теста
//   9.5–13 с  Малыш «растёт», поднимает пласт теста и накидывает ей на голову — она вслепую наступает на скалку —
//             падает — «пуф»
//   13–16 с   шарик-Розовая катится на скалке ему под ноги — он падает лицом в тесто — «пуф» и улетает
//   16–22 с   Розовая «растёт» и в центре, руки вверх
'use strict';

const ST = Stage({
  name: '17 Розовая vs Малыш',
  frames: 528,
  cast: {
    pink: { small: ['girl-verity-small', { bodyHeight: 300 }], big: ['girl-verity-big', { height: 730, splitFeet: true }],
      pivot: 337, voice: 1.35, vAngle: 50, lie: 55, color: '#ff4fc8', moods: { angry: 'angry theeth', grin: 'theeth smile', big: 'theeth smile' } },
    baby: { small: ['child-verity-pink', { bodyHeight: 300, spin: { layer: 'hat', cut: 122, axis: 389 } }],
      big: ['child-verity-big', { height: 730, spin: { layer: 'hat', cut: 106, axis: 330 } }], pivot: 338, voice: 1.25,
      lie: 60, color: '#ffd9b8', moods: { angry: ' 2', grin: ' 2', big: 'theeth smile', love: ' 1' } },
  },
  order: ['baby', 'pink'],
  background: { theme: 'orchard', seed: 1017, sunX: 1500, sunY: 130 },
  clouds: [[150, 80, 2.4, 0, 12], [700, 220, 1.8, 1, 16], [1150, 70, 2.6, 2, 10], [1720, 250, 1.5, 0, 18]],
});
const { FPS, NF, GROUND, C, key, move, ev, sfx, laugh, tremble, transform, shrink, stance, walk,
  slip, fallBack, victory, chuckle, hand, statesAt, target } = ST;
const P = (v, f, S) => (typeof v === 'function' ? v(f, S) : typeof v === 'string' ? target(v, S) : v);
ST.parts.mouth = (ch, st, p) => (p.form === 'big' ? ST.parts.lips(ch, st) : E.apply(ch.eyeMatrix(st, ' 2'), [315, 740]));
function propeller(who, f0, f1, rps = 7, o = {}) {
  key(who, f0, { spin: 0, spinBlur: 0 }, 0);
  key(who, f0 + 8, { spinBlur: 1 }, 8);
  move(who, f1, { spin: rps * (f1 - f0) / 24 }, 'lin');
  key(who, f1, { spinBlur: 0 }, 6);
  key(who, f1 + 1, { spin: 0 }, 0);
  if (o.snd !== false) sfx('whirr', f0, { who, dur: f1 - f0, gain: o.gain ?? 0.4 });
}

// ------------------------------------------------------------------ скалка и тесто
const PR = 26, PL = 280;
const PIN = [];           // {f0, at, rot, roll} | {f0, f1, a, b, arc, spin, roll: true, ease} | {f0, hands: who} | {f0, keys: [[f, x, y]]}
const DOUGH = [];         // ком/лепёшка: {f0, at:[x], r, sx, sy} | {f0, f1, a, b, arc, r} | {f0, hands} | {f0, on: who, r} | {f0, roll: x, r} | {f0, gone}
const SHEET = [];         // пласт: {f0, hands} | {f0, f1, a, b, arc} | {f0, on: who} | {f0, gone}
const BLOB = [];          // тесто на земле/на лице: {f0, f1, x, r, sx, sy} | {f0, f1, who, part, s}
function segAt(segs, f) { let c = null; for (const s of segs) if (f >= s.f0) c = s; return c && !c.gone ? c : null; }
const handsMid = (who, S) => { const h = C[who].big.point(S[who].st, 'handF'), g = C[who].big.point(S[who].st, 'handB'); return [(h[0] + g[0]) / 2, (h[1] + g[1]) / 2]; };
function fly(c, f, S) {
  const u = E.clamp((f - c.f0) / (c.f1 - c.f0), 0, 1), e = c.ease ? E.EASE[c.ease](u) : u, a = P(c.a, c.f0, statesAt(c.f0)), b = P(c.b, f, S);
  return [E.lerp(a[0], b[0], e), E.lerp(a[1], b[1], e) - Math.sin(Math.PI * u) * (c.arc || 0), u];
}
function pinAt(f, S) {
  const c = segAt(PIN, f);
  if (!c) return null;
  if (c.at) return { x: c.at[0], y: c.at[1], rot: c.rot || 0, roll: c.roll || 0 };
  if (c.hands) { if (S[c.hands].p.form !== 'big') return null; const m = handsMid(c.hands, S); return { x: m[0], y: m[1], rot: 0, roll: 0 }; }
  if (c.keys) {
    const k = c.keys; let i = 0; while (i < k.length - 2 && f >= k[i + 1][0]) i++;
    const u = E.EASE.io(E.clamp((f - k[i][0]) / (k[i + 1][0] - k[i][0]), 0, 1));
    const x = E.lerp(k[i][1], k[i + 1][1], u), y = E.lerp(k[i][2], k[i + 1][2], u);
    return { x, y, rot: 0, roll: -x / PR };
  }
  const [x, y, u] = fly(c, f, S);
  return { x, y, rot: c.roll ? 0 : u * (c.spin || 0), roll: c.roll ? -x / PR : 0 };
}
// прокатка: скалка по точкам [[f, x, y]], руки держат её за ручки
function rollKeys(who, ks) {
  PIN.push({ f0: ks[0][0], keys: ks });
  for (const [f, x, y] of ks) key(who, f, { hitF: 1, hitB: 1, hitFto: [x + 60, y - 6], hitBto: [x - 60, y - 6] }, 4, 'io');
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

const PX0 = 560, BX0 = 1360;
// ================================================================== 0–2 с: неподвижная стойка
key('pink', 0, { form: 'small', x: PX0, y: GROUND, face: 1, look: 1, eyes: 'normal', mouth: 'smile normal', sx: 1, sy: 1, rot: 0, pivot: 0, alpha: 1 }, 0);
key('baby', 0, { form: 'small', x: BX0, y: GROUND, face: -1, look: 1, eyes: 'normal', mouth: ' 6', sx: 1, sy: 1, rot: 0, pivot: 0, alpha: 1 }, 0);

const LATER = [];
const BIG = () => {
  // ---- 2–4 с: скалка с неба — Малыш катится на ней — раскатывает Розовую в блин
  const PX1 = 1150, PY = GROUND - PR;
  PIN.push({ f0: 48, f1: 54, a: [PX1, -200], b: [PX1, PY], ease: 'in2' }, { f0: 54, at: [PX1, PY] });
  sfx('whoosh', 48, { x: PX1, dur: 6, gain: 0.5 }); sfx('bonk', 54, { x: PX1, gain: 0.6, pitch: 0.8 });
  ev('dust', { f: 54, x: PX1, r: 60, n: 5, snd: false });
  key('pink', 50, { mouth: 'puzzlement' }, 0); key('baby', 50, { mouth: ' 5' }, 0);
  key('baby', 56, { mouth: ' 2', eyes: 'angry' }, 0);
  sfx('ref:grin-eee', 56, { who: 'baby', gain: 0.4, pitch: 1.2 });
  const R0 = 66, FLAT = 80, ONP = 86, PTOP = GROUND - 150;
  // запрыгивает на скалку
  key('baby', 58, { sx: 1.2, sy: 0.82 }, 3);
  move('baby', 58, { x: BX0, y: GROUND }); move('baby', 62, { y: GROUND - 160 }, 'out2'); move('baby', R0, { x: PX1, y: PY - PR }, 'in2');
  move('baby', R0, { x: PX1 }, 'lin');
  sfx('jump', 59, { who: 'baby', gain: 0.5 }); sfx('land', R0, { who: 'baby', gain: 0.5 });
  // катится
  PIN.push({ f0: R0, f1: FLAT, a: [PX1, PY], b: [PX0 + 160, PY], roll: true }, { f0: FLAT, f1: ONP, a: [PX0 + 160, PY], b: [PX0, PTOP - PR], roll: true },
    { f0: ONP, at: [PX0, PTOP - PR], roll: -PX0 / PR });
  sfx('slide', R0, { x: 900, gain: 0.5, pitch: 0.7 });
  LATER.push(() => { for (let f = R0; f <= ONP; f++) { const p = pinAt(f, ST.stateAt(f)); move('baby', f, { x: p.x, y: p.y - PR + ((f - R0) % 6 < 3 ? 0 : -8) }, 'lin'); } });
  for (let f = R0 + 2; f < ONP; f += 6) key('baby', f, { sx: f % 12 < 6 ? 0.94 : 1.06, sy: f % 12 < 6 ? 1.06 : 0.94 }, 3);
  key('pink', FLAT - 6, { mouth: 'puzzlement', eyes: 'sad' }, 0);
  key('pink', FLAT, { sx: 2.0, sy: 0.5 }, 2);
  sfx('slam', FLAT, { who: 'pink', gain: 0.9 }); sfx('squish', FLAT + 1, { who: 'pink', gain: 0.8 });
  ev('shake', { f: FLAT, amp: 12, n: 8 }); ev('dust', { f: FLAT, x: PX0, r: 80, n: 7, snd: false });
  // Малыш спрыгивает и смеётся
  const BX1 = 1180;
  key('baby', ONP, { sx: 1, sy: 1 }, 2);
  hopTo('baby', ONP + 2, ONP + 16, PX0, PTOP - 2 * PR, BX1, GROUND, 120);
  key('baby', ONP + 16, { mouth: ' 1', eyes: 'normal' }, 0);
  sfx('ref:laugh', ONP + 14, { who: 'baby', gain: 0.85, pitch: 1.3 });
  laugh('baby', ONP + 18, ONP + 34);
  // Розовая отлепляется — скалка отлетает
  const PEEL = ONP + 10, PIN1 = [790, PY];
  key('pink', PEEL, { sx: 1, sy: 1 }, 6, 'out'); sfx('boing', PEEL, { who: 'pink', gain: 0.7 });
  PIN.push({ f0: PEEL, f1: PEEL + 12, a: [PX0, PTOP - PR], b: PIN1, arc: 160, spin: Math.PI * 2 }, { f0: PEEL + 12, at: PIN1 });
  sfx('bonk', PEEL + 12, { x: PIN1[0], gain: 0.5, pitch: 0.8 });
  ev('stars', { who: 'pink', f0: PEEL + 4, f1: PEEL + 18 });

  // ---- 4.1–5.3 с: Розовая «растёт» — Малыш влюблён
  const PX = 600;
  key('pink', PEEL, { eyes: 'angry', mouth: 'angry theeth' }, 0);
  const PB = transform('pink', PEEL + 1, PX0, PX, 1, { style: 'grow', love: 'baby', loveDur: 50 });
  key('pink', PB, stance('pink', PX, 1), 0);
  key('pink', PB + 4, { mouth: 'theeth smile', eyes: 'normal' }, 0);

  // ---- 5.4–9.5 с: ком теста с неба — ловит — накрывает Малыша — скалкой раскатывает его в лепёшку
  const DR = PB + 4, CATCH = DR + 9, DRR = 100;
  key('pink', DR, { look: 1, head: -12, mouth: 'puzzlement' }, 4);
  DOUGH.push({ f0: DR, f1: CATCH, a: [PX + 220, -250], b: (f, S) => { const m = handsMid('pink', S); return [m[0], m[1] + 70]; }, ease: 'in2', r: DRR }, { f0: CATCH, hands: 'pink', dy: 70, r: DRR });
  sfx('whoosh', DR, { x: PX + 220, dur: 8, gain: 0.5 });
  key('pink', CATCH - 3, { handF: hand('pink', 'F', 0.8, 0.1), handB: hand('pink', 'B', 0.65, 0.05), head: 0, lean: 6 }, 5);
  key('pink', CATCH + 2, { hip: [0, 40] }, 2); key('pink', CATCH + 6, { hip: [0, 0] }, 4);
  sfx('squish', CATCH, { who: 'pink', gain: 0.9 });
  key('pink', CATCH + 3, { mouth: 'theeth smile', eyes: 'angry' }, 0);
  const TH = CATCH + 8, WRAP = TH + 10, DW = 175;
  key('pink', TH - 4, { handF: hand('pink', 'F', 0.2, -0.9), handB: hand('pink', 'B', 0.1, -0.9), lean: -8 }, 4);
  key('pink', TH, { handF: hand('pink', 'F', 0.95, -0.2), handB: hand('pink', 'B', 0.85, -0.2), lean: 12 }, 3, 'in2');
  sfx('swing', TH - 2, { who: 'pink', gain: 0.8 });
  DOUGH.push({ f0: TH, f1: WRAP, a: (f, S) => { const m = handsMid('pink', statesAt(TH)); return [m[0], m[1] + 70]; }, b: [BX1, GROUND], arc: 160, r: DRR },
    { f0: WRAP, on: 'baby', r: DW });
  key('baby', WRAP - 4, { mouth: ' 5', eyes: 'sad' }, 0);
  sfx('squish', WRAP, { who: 'baby', gain: 1.0 }); sfx('slam', WRAP, { who: 'baby', gain: 0.5 });
  ev('dust', { f: WRAP, x: BX1, r: 90, n: 6, snd: false });
  tremble('baby', WRAP + 2, WRAP + 24, BX1, 4);
  for (let f = WRAP + 4; f < WRAP + 24; f += 7) sfx('bonk', f, { x: BX1, gain: 0.3, pitch: 1.3 });
  // берёт скалку
  const PICK = WRAP + 4;
  key('pink', PICK - 5, { lean: 30, hip: [0, ST.toRig('pink', 180)], head: 8, handF: hand('pink', 'F', 0.7, 0.6), handB: hand('pink', 'B', 0.5, 0.6) }, 5);
  key('pink', PICK, { hitF: 1, hitB: 1, hitFto: [PIN1[0] + 60, PIN1[1]], hitBto: [PIN1[0] - 60, PIN1[1]] }, 4);
  PIN.push({ f0: PICK, hands: 'pink' });
  key('pink', PICK + 6, { ...stance('pink', PX, 1), hitF: 0, hitB: 0, handF: hand('pink', 'F', 0.7, 0.3), handB: hand('pink', 'B', 0.55, 0.3), mouth: 'theeth smile', eyes: 'angry' }, 6);
  const PX2 = 880;
  walk('pink', PICK + 6, PX, PX2, 1, 10, 1, false);
  // раскатывает: три прохода, тесто всё ниже
  const RL = PICK + 18, TOP0 = GROUND - DW * 2;
  const ks = [[RL, BX1 - 80, TOP0 - PR], [RL + 6, BX1 + 70, TOP0 + 70 - PR], [RL + 12, BX1 - 90, TOP0 + 130 - PR], [RL + 18, BX1 + 80, TOP0 + 175 - PR], [RL + 23, BX1 - 60, TOP0 + 195 - PR], [RL + 26, BX1 + 20, TOP0 + 195 - PR]];
  key('pink', RL - 4, { lean: 26, head: 10, mouth: 'happy with theeth', eyes: 'angry' }, 4);
  rollKeys('pink', ks);
  for (let i = 1; i < ks.length - 1; i++) { sfx('squish', ks[i][0] - 3, { x: BX1, gain: 0.6 }); sfx('slide', ks[i][0] - 6, { x: BX1, gain: 0.35, pitch: 1.2 }); }
  DOUGH.push({ f0: RL, roll: BX1, r: DW });
  key('baby', RL + 2, { sx: 1.3, sy: 0.75 }, 6); key('baby', RL + 12, { sx: 1.7, sy: 0.55 }, 6); key('baby', RL + 20, { sx: 2.0, sy: 0.45 }, 6);
  const DONE = RL + 27;
  key('pink', DONE, { ...stance('pink', PX2, 1), hitF: 0, hitB: 0, handF: hand('pink', 'F', 0.7, 0.3), handB: hand('pink', 'B', 0.55, 0.3) }, 6);
  sfx('ref:laugh', DONE, { who: 'pink', gain: 0.85, pitch: 1.35 });
  chuckle('pink', DONE + 2, DONE + 18, { mouth: 'happy with theeth' });
  // лепёшка лежит, Малыш на пропеллере вылетает
  DOUGH.push({ f0: DONE, at: [BX1], r: DW, sx: 2.0, sy: 0.4 });
  PIN.push({ f0: DONE, hands: 'pink' });
  const OUT = DONE + 4, BX2 = 1440, LND = OUT + 16;
  propeller('baby', OUT - 2, LND, 8);
  key('baby', OUT, { sx: 1, sy: 1, mouth: ' 5', eyes: 'sad' }, 4, 'out');
  sfx('pop', OUT, { who: 'baby', gain: 0.8 });
  move('baby', OUT, { x: BX1, y: GROUND }); move('baby', OUT + 9, { x: BX1 + 120, y: GROUND - 380 }, 'out2'); move('baby', LND, { x: BX2, y: GROUND }, 'in2');
  BLOB.push({ f0: OUT, f1: 0, who: 'baby', part: 'face', s: 120 });

  // ---- 9.5–13 с: Малыш «растёт» — поднимает пласт теста и накидывает ей на голову — она наступает на скалку
  key('baby', LND, { eyes: 'angry', mouth: ' 2' }, 0);
  const BB = transform('baby', LND + 2, BX2, BX2, -1, { style: 'grow' });
  BLOB[BLOB.length - 1].f1 = BB;
  key('baby', BB, stance('baby', BX2, -1), 0);
  key('baby', BB + 4, { mouth: 'theeth smile', eyes: 'angry' }, 0);
  key('pink', BB - 2, { mouth: 'puzzlement', eyes: 'sad' }, 0);
  const GR = BB + 8;
  key('baby', GR - 6, { lean: 30, hip: [0, ST.toRig('baby', 200)], head: 8 }, 6);
  key('baby', GR, { hitF: 1, hitB: 1, hitFto: [BX1 + 280, GROUND - 30], hitBto: [BX1 + 200, GROUND - 30] }, 4);
  DOUGH.push({ f0: GR, gone: true });
  SHEET.push({ f0: GR, hands: 'baby' });
  sfx('squish', GR, { who: 'baby', gain: 0.6 });
  key('baby', GR + 6, { ...stance('baby', BX2, -1), hitF: 0, hitB: 0, handF: hand('baby', 'F', 0.3, -0.95), handB: hand('baby', 'B', 0.2, -0.95), mouth: 'happy with theeth' }, 6);
  const TS = GR + 10, ON = TS + 9;
  key('baby', TS, { handF: hand('baby', 'F', 0.95, -0.3), handB: hand('baby', 'B', 0.85, -0.3), lean: 14 }, 3, 'in2');
  sfx('swing', TS - 2, { who: 'baby', gain: 0.8 }); sfx('whoosh', TS, { x: 1200, dur: 10, gain: 0.5 });
  SHEET.push({ f0: TS, f1: ON, a: (f, S) => handsMid('baby', statesAt(TS)), b: 'pink:top', arc: 200 }, { f0: ON, on: 'pink' });
  sfx('squish', ON, { who: 'pink', gain: 1.0 });
  key('baby', TS + 10, { ...stance('baby', BX2, -1), mouth: 'happy with theeth', eyes: 'normal' }, 8);
  sfx('ref:laugh', ON + 2, { who: 'baby', gain: 0.85, pitch: 1.2 });
  chuckle('baby', ON + 2, ON + 40, { mouth: 'happy with theeth' });
  // роняет скалку, вслепую шагает — на скалку
  const PIN2 = [PX2 + 110, PY];
  PIN.push({ f0: ON + 1, f1: ON + 8, a: (f, S) => { const p = pinAt(ON, statesAt(ON)); return [p.x, p.y]; }, b: PIN2, ease: 'in2' }, { f0: ON + 8, at: PIN2 });
  sfx('bonk', ON + 8, { x: PIN2[0], gain: 0.5, pitch: 0.8 });
  key('pink', ON + 1, { handF: hand('pink', 'F', 0.6, -0.9), handB: hand('pink', 'B', 0.4, -0.9), lean: -6, mouth: 'puzzlement', eyes: 'sad' }, 3);
  sfx('scared', ON + 3, { who: 'pink', gain: 0.6 });
  walk('pink', ON + 6, PX2, PIN2[0] - 30, 1, 10, 1, false);
  const SL = ON + 17;
  const LIE = slip('pink', SL, PIN2[0] - 30, 1, { n: 12, stars: 24 });
  PIN.push({ f0: SL, f1: SL + 12, a: PIN2, b: [PIN2[0] + 200, PY], roll: true, ease: 'out2' }, { f0: SL + 12, at: [PIN2[0] + 200, PY], roll: -(PIN2[0] + 200) / PR });
  sfx('slide', SL, { x: PIN2[0], gain: 0.5, pitch: 1.1 });
  const PBX = 640;
  const psm = shrink('pink', LIE + 6, PBX, 1, { mouth: 'puzzlement', eyes: 'sad', smoke: 420 });
  key('pink', psm, { lean: 0, head: 0, hip: [0, 0], legF: null, legB: null, zB: null, rot: 0 }, 0);
  move('pink', psm, { x: PBX, y: GROUND, rot: 0 });
  SHEET.push({ f0: SL + 2, f1: SL + 12, a: (f, S) => target('pink:top', statesAt(SL + 2)), b: [860, GROUND - 60], arc: 60 }, { f0: SL + 12, gone: true });
  BLOB.push({ f0: SL + 12, f1: 0, x: 860, r: 120, sx: 1.7, sy: 0.55 });
  sfx('squish', SL + 12, { x: 860, gain: 0.6 });
  ev('stars', { who: 'pink', f0: psm + 4, f1: psm + 16, snd: false });

  // ---- 13–16 с: шарик-Розовая катится на скалке ему под ноги — он падает лицом в тесто — «пуф»
  const PIN3 = [PIN2[0] + 200, PY];
  key('pink', psm + 4, { eyes: 'angry', mouth: 'angry theeth' }, 0);
  const UP = psm + 16;
  key('pink', psm + 6, { sx: 1.2, sy: 0.82 }, 3);
  move('pink', psm + 6, { x: PBX, y: GROUND }); move('pink', psm + 11, { y: GROUND - 180 }, 'out2'); move('pink', UP, { x: PIN3[0], y: PY - PR }, 'in2');
  move('pink', UP, { x: PIN3[0] }, 'lin');
  sfx('jump', psm + 7, { who: 'pink', gain: 0.5 }); sfx('land', UP, { who: 'pink', gain: 0.5 });
  const UNDER = UP + 12, BX3 = BX2;
  PIN.push({ f0: UP, f1: UNDER, a: PIN3, b: [BX3 - 20, PY], roll: true });
  sfx('slide', UP, { x: 1300, gain: 0.5, pitch: 0.8 });
  LATER.push(() => { for (let f = UP; f <= UNDER; f++) { const p = pinAt(f, ST.stateAt(f)); move('pink', f, { x: p.x, y: p.y - PR + ((f - UP) % 6 < 3 ? 0 : -8) }, 'lin'); } });
  key('pink', UP + 2, { mouth: 'theeth smile', eyes: 'angry' }, 0);
  // Розовая спрыгивает назад, Малыш падает вперёд — лицом в тесто
  const PX5 = 1640;
  hopTo('pink', UNDER, UNDER + 14, BX3 - 20, PY - PR, PX5, GROUND, 200);
  key('pink', UNDER + 14, { mouth: 'happy with theeth', eyes: 'normal' }, 0);
  sfx('ref:laugh', UNDER + 14, { who: 'pink', gain: 0.85, pitch: 1.35 });
  laugh('pink', UNDER + 16, UNDER + 22);
  PIN.push({ f0: UNDER, f1: UNDER + 10, a: [BX3 - 20, PY], b: [BX3 + 180, PY], roll: true }, { f0: UNDER + 10, at: [BX3 + 180, PY], roll: -(BX3 + 180) / PR });
  key('baby', UNDER - 4, { mouth: 'puzzlement', eyes: 'sad', head: 0, lean: 0 }, 3);
  const FB = fallBack('baby', UNDER, BX3, -1, { forward: true, n: 14, stars: 30 });
  sfx('squish', FB, { x: 860, gain: 1.0 });
  BLOB[BLOB.length - 1].f1 = FB + 2;
  BLOB.push({ f0: FB + 2, f1: 0, who: 'baby', part: 'face', s: 200 });
  const bsm = shrink('baby', FB + 10, BX3 - 380, -1, { mouth: ' 5', eyes: 'sad', smoke: 420 });
  key('baby', bsm, { lean: 0, head: 0, hip: [0, 0], legF: null, legB: null, zB: null, rot: 0 }, 0);
  move('baby', bsm, { x: BX3 - 380, y: GROUND, rot: 0 });
  BLOB[BLOB.length - 1].f1 = bsm; BLOB.push({ f0: bsm, f1: 0, who: 'baby', part: 'face', s: 130 });
  // улетает на пропеллере
  propeller('baby', bsm + 8, bsm + 40, 8);
  move('baby', bsm + 10, { x: BX3 - 380, y: GROUND }); move('baby', bsm + 40, { x: BX3 - 180, y: -380 }, 'in2');
  sfx('scared', bsm + 10, { who: 'baby', gain: 0.6 });

  // ---- Розовая «растёт» — в центр
  const PB2 = transform('pink', UNDER + 18, PX5, PX5 - 60, -1, { style: 'grow' });
  key('pink', PB2, stance('pink', PX5 - 60, -1), 0);
  key('pink', PB2 + 4, { mouth: 'happy with theeth' }, 0);
  const WIN = victory('pink', PB2 + 6, PX5 - 60, { n: 8, stride: 150 });
  for (const fn of LATER) fn();
  window.T = { FLAT, PB, CATCH, WRAP, PICK, RL, DONE, LND, BB, ON, SL, psm, UP, UNDER, FB, bsm, PB2, WIN };
};

// ------------------------------------------------------------------ рисование
function doughAt(f, S) {
  const c = segAt(DOUGH, f);
  if (!c) return null;
  if (c.at) return { x: c.at[0], r: c.r, sx: c.sx || 1, sy: c.sy || 1, y: GROUND };
  if (c.hands) { if (S[c.hands].p.form !== 'big') return null; const m = handsMid(c.hands, S); return { x: m[0], y: m[1] + (c.dy || 0), r: c.r, sx: 1, sy: 1 }; }
  if (c.on) { const p = S[c.on].p; return { x: p.x, y: GROUND, r: c.r, sx: 1, sy: 1 }; }
  if (c.roll !== undefined) {
    const p = pinAt(f, S), top = p ? p.y + PR : GROUND - c.r * 2, sy = E.clamp((GROUND - top) / (2 * c.r), 0.3, 1);
    return { x: c.roll, y: GROUND, r: c.r, sx: Math.min(2.0, 1 / sy), sy };
  }
  const [x, y] = fly(c, f, S);
  return { x, y, r: c.r, sx: 1, sy: 1 };
}
ST.hooks.beforeChars.push((ctx, f, S, CAM) => {
  ctx.setTransform(...CAM);
  for (const b of BLOB) if (b.x && f >= b.f0 && (!b.f1 || f < b.f1)) FX.dough(ctx, b.x, GROUND + 4, b.r, b.sx, b.sy, 5);
  const p = pinAt(f, S);
  if (p && p.y > GROUND - 60) FX.rollingPin(ctx, p.x, p.y, PL, PR, p.rot, p.roll);
});
ST.hooks.afterChars.push((ctx, f, S, CAM) => {
  ctx.setTransform(...CAM);
  const d = doughAt(f, S);
  if (d) FX.dough(ctx, d.x, d.y, d.r, d.sx, d.sy, 3);
  const p = pinAt(f, S);
  if (p && p.y <= GROUND - 60) FX.rollingPin(ctx, p.x, p.y, PL, PR, p.rot, p.roll);
  const c = segAt(SHEET, f);
  if (c) {
    let at;
    if (c.hands) { const m = handsMid(c.hands, S); FX.doughSheet(ctx, m[0], m[1] - 40, 260, 300, f / FPS); }
    else if (c.on) { at = target(`${c.on}:top`, S); FX.doughSheet(ctx, at[0], at[1] + 30, 300, 420, f / FPS); }
    else { at = fly(c, f, S); FX.doughSheet(ctx, at[0], at[1], 280, 340, f / FPS); }
  }
  for (const b of BLOB) {
    if (!b.who || f < b.f0 || (b.f1 && f >= b.f1)) continue;
    const t = target(`${b.who}:${b.part}`, S);
    FX.gumSplat(ctx, t[0], t[1], b.s, 4, '#f4dfae', '#c9a86a');
  }
});

ST.start(BIG);
