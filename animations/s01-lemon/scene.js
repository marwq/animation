// Серия 2, ролик 01: Лимон — Розовая (слева) против Жёлтой (справа), 22 с, 24 кадра/с. Драка без ударов:
// кислый лимон — брызги сока в лицо, кислые гримасы (трясёт, щёки сводит), лимонный дождь с неба.
// Музыка превращения — один раз. Фон — сад.
//
//   0–2 с     шарик-Розовая и шарик-Жёлтая неподвижно стоят друг напротив друга, середина пустая
//   2–4 с     с неба падает лимон; Розовая прыгает на него — сок брызжет Жёлтой в лицо: кисло!
//   4–5.2 с   Жёлтая «растёт» под музыку
//   5.3–8.5 с берёт лимон и выжимает его над Розовой — та кислая, укатывается
//   8.6–9.8 с Розовая «растёт»
//   10–12 с   топает — с неба лимоны: по голове Жёлтой бум-бум, третий она ловит
//   12–14 с   кусает лимон — её сводит — плюёт соком Розовой в лицо — «пуф», Розовая шарик
//   14–16 с   шарик-Розовая прыгает на лимон у её ног — сок в лицо — Жёлтую сводит так, что «пуф»
//   16–22 с   Розовая «растёт», Жёлтая-шарик укатывается; Розовая в центре, руки вверх
'use strict';

const ST = Stage({
  name: '01 Розовая vs Жёлтая',
  frames: 528,
  cast: {
    pink: { small: ['girl-verity-small', { bodyHeight: 300 }], big: ['girl-verity-big', { height: 730, splitFeet: true }],
      pivot: 337, voice: 1.35, vAngle: 50, lie: 55, color: '#ff4fc8', moods: { angry: 'angry theeth', grin: 'theeth smile', big: 'theeth smile' } },
    yel: { small: ['girl-verity-small', { bodyHeight: 300, recolor: 'yellow' }],
      big: ['verity-big-girl', { height: 730, splitFeet: true, recolor: 'yellow' }], pivot: 337, voice: 1.45, vAngle: 50, lie: 55,
      color: '#ffe23a', moods: { angry: 'angry theeth', grin: 'theeth smile', big: 'theeth smile' } },
  },
  order: ['pink', 'yel'],
  background: { theme: 'orchard', seed: 1001, sunX: 1520, sunY: 130 },
  clouds: [[150, 80, 2.4, 0, 12], [700, 220, 1.8, 1, 16], [1150, 70, 2.6, 2, 10], [1720, 250, 1.5, 0, 18]],
});
const { FPS, NF, GROUND, C, key, move, ev, sfx, hop, laugh, tremble, transform, shrink, stance, walk, turn,
  stomp, victory, chuckle, hand, toRig, statesAt, stateAt, target } = ST;
const P = (v, f, S) => (typeof v === 'function' ? v(f, S) : typeof v === 'string' ? target(v, S) : v);
ST.parts.mouth = (ch, st, p) => {
  const name = ch.layers.some((l) => l.name === p.mouth) ? p.mouth : 'smile normal', l = ch.layers.find((x) => x.name === name);
  return E.apply(ch.eyeMatrix(st, name), [(l.bbox[0] + l.bbox[2]) / 2, (l.bbox[1] + l.bbox[3]) / 2]);
};

// ------------------------------------------------------------------ лимоны, сок, кислота
const LR = 78;
const LEM = [];           // {segs: [{f0, at, sq} | {f0, hand} | {f0, f1, a, b, arc, spin, ease} | {f0, gone}]}
const JET = [];           // {f0, f1, from, to, w, arc}
const SPL = [];           // {f, at, size}
const SOUR = [];          // {who, f0, f1}
const JUICE = ['#a87800', '#ffe12e', '#fff8b0', '#fff36a', '#c99a00'];
function lemAt(L, f, S) {
  let c = null;
  for (const s of L.segs) if (f >= s.f0) c = s;
  if (!c || c.gone) return null;
  if (c.at) { const sq = typeof c.sq === 'function' ? c.sq(f) : c.sq || 1; return { x: c.at[0], y: c.at[1] - LR * 0.72 * sq, rot: c.rot || 0, sq }; }
  if (c.hand) {
    if (S[c.hand].p.form !== 'big') return null;
    const h = C[c.hand].big.point(S[c.hand].st, 'handF'), sq = typeof c.sq === 'function' ? c.sq(f) : 1;
    return { x: h[0], y: h[1] - 30, rot: 0.3, sq };
  }
  const u = E.clamp((f - c.f0) / (c.f1 - c.f0), 0, 1), e = c.ease ? E.EASE[c.ease](u) : u, a = P(c.a, c.f0, statesAt(c.f0)), b = P(c.b, f, S);
  return { x: E.lerp(a[0], b[0], e), y: E.lerp(a[1], b[1], e) - Math.sin(Math.PI * u) * (c.arc || 0), rot: u * (c.spin || 0), sq: 1 };
}
const onGround = (x) => [x, GROUND];
function sour(who, f0, f1, x, o = {}) {
  SOUR.push({ who, f0, f1 });
  key(who, f0, { eyes: 'sad', mouth: 'puzzlement' }, 0);
  const big = stateAt(Math.max(0, f0 - 1))[who].p.form === 'big';
  if (!big) {
    for (let f = f0; f < f1 - 2; f += 4) { key(who, f + 2, { sx: 0.84, sy: 1.18 }, 2); key(who, f + 4, { sx: 0.9, sy: 1.1 }, 2); }
    key(who, f1, { sx: 1, sy: 1 }, 3);
  } else {
    key(who, f0, { lean: -8, head: -10, hip: [0, toRig(who, 40)], handF: hand(who, 'F', 0.35, -0.75), handB: hand(who, 'B', -0.25, -0.75) }, 3);
    for (let f = f0 + 2; f < f1 - 2; f += 4) key(who, f + 2, { head: (f - f0) % 8 < 4 ? -14 : -6 }, 2);
  }
  tremble(who, f0, f1, x, o.a || 5);
  ev('tears', { who, f0: f0 + 2, f1, snd: false });
  sfx('scared', f0 + 1, { who, gain: 0.7, pitch: big ? 0.9 : 1.2 });
  sfx('chatter', f0 + 3, { who, dur: f1 - f0 - 3, gain: 0.5 });
}
function squirt(f0, f1, from, to, o = {}) {
  JET.push({ f0, f1, from, to, w: o.w || 30, arc: o.arc ?? 40 });
  sfx('splash', f0, { x: 960, gain: 0.7 }); sfx('spit', f0, { x: 960, gain: 0.6 });
  SPL.push({ f: f0 + 4, at: to, size: o.size || 1 });
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

const PX0 = 560, YX0 = 1360, LX = 960;
// ================================================================== 0–2 с: неподвижная стойка
key('pink', 0, { form: 'small', x: PX0, y: GROUND, face: 1, look: 1, eyes: 'normal', mouth: 'smile normal', sx: 1, sy: 1, rot: 0, pivot: 0, alpha: 1 }, 0);
key('yel', 0, { form: 'small', x: YX0, y: GROUND, face: -1, look: 1, eyes: 'normal', mouth: 'smile normal', sx: 1, sy: 1, rot: 0, pivot: 0, alpha: 1 }, 0);

const BIG = () => {
  // ---- 2–4 с: лимон с неба — Розовая прыгает на него — сок Жёлтой в лицо
  const L0 = { segs: [] };
  LEM.push(L0);
  const D0 = 48, D1 = 58;
  L0.segs.push({ f0: D0, f1: D1, a: [LX, -120], b: [LX, GROUND - LR * 0.72], ease: 'in2', spin: 3 });
  L0.segs.push({ f0: D1, at: onGround(LX), sq: (f) => (f < D1 + 3 ? 0.7 : f < D1 + 6 ? 1.12 : 1) });
  sfx('whoosh', D0, { x: LX, dur: 10, gain: 0.5 }); sfx('boing', D1, { x: LX, gain: 0.7 });
  ev('twinkle', { f: D1 + 1, at: [LX, GROUND - 130], n: 14, size: 46 });
  key('pink', D0 + 2, { mouth: 'puzzlement' }, 0); key('yel', D0 + 2, { mouth: 'puzzlement' }, 0);
  key('pink', D1 + 2, { mouth: 'theeth smile', eyes: 'angry' }, 0);
  sfx('ref:grin-eee', D1 + 2, { who: 'pink', gain: 0.4, pitch: 1.35 });
  const ON = D1 + 14;
  hopTo('pink', D1 + 4, ON, PX0, GROUND, LX, GROUND - LR * 1.1, 200, { land: false });
  key('pink', ON, { sx: 1.25, sy: 0.8 }, 1);
  L0.segs.push({ f0: ON, at: onGround(LX), sq: (f) => (f < ON + 5 ? 0.5 : f < ON + 9 ? 1.1 : 1) });
  sfx('squish', ON, { x: LX, gain: 0.9 });
  squirt(ON, ON + 8, [LX + 50, GROUND - 40], (f, S) => target('yel:face', S), { arc: 70 });
  const PX1 = 700;
  hopTo('pink', ON + 2, ON + 12, LX, GROUND - LR * 1.1, PX1, GROUND, 120);
  sour('yel', ON + 6, ON + 26, YX0, { a: 6 });
  sfx('ref:laugh', ON + 12, { who: 'pink', gain: 0.85, pitch: 1.35 });
  key('pink', ON + 12, { mouth: 'happy with theeth', eyes: 'normal' }, 0);
  laugh('pink', ON + 14, ON + 32);

  // ---- 4–5.2 с: Жёлтая «растёт»
  const YX = 1280;
  key('yel', ON + 26, { eyes: 'angry', mouth: 'angry theeth' }, 0);
  const YB = transform('yel', ON + 27, YX0, YX, -1, { style: 'grow' });
  key('yel', YB, stance('yel', YX, -1), 0);
  key('yel', YB + 6, { mouth: 'theeth smile', eyes: 'angry' }, 0);
  key('pink', YB - 2, { mouth: 'puzzlement', eyes: 'sad' }, 0);

  // ---- 5.3–8.5 с: берёт лимон — выжимает над Розовой
  const YX2 = 1130, W0 = YB + 2;
  walk('yel', W0, YX, YX2, 1, 9, -1);
  const GR = W0 + 12;
  key('yel', GR - 5, { lean: 18, hip: [0, toRig('yel', 110)], head: 6 }, 5);
  key('yel', GR, { hitF: 1, hitFto: [LX + 10, GROUND - 60], hitFfix: GR }, 4);
  L0.segs.push({ f0: GR, hand: 'yel' });
  sfx('pop', GR, { who: 'yel', gain: 0.5 });
  const YX3 = 930, W1 = GR + 6;
  key('yel', W1, { hitF: 0, lean: 0, hip: [0, toRig('yel', 8)], head: 0, handF: hand('yel', 'F', 0.75, -0.55), mouth: 'happy with theeth', eyes: 'angry' }, 6);
  walk('yel', W1 + 2, YX2, YX3, 1, 9, -1, false);
  const SQ0 = W1 + 14, SQ1 = SQ0 + 18;
  key('yel', SQ0, { handF: hand('yel', 'F', 0.95, -0.4), lean: 8 }, 4);
  for (let f = SQ0; f < SQ1; f += 4) key('yel', f + 2, { handF: hand('yel', 'F', 0.95, (f - SQ0) % 8 < 4 ? -0.36 : -0.44) }, 2);
  L0.segs.push({ f0: SQ0, hand: 'yel', sq: (f) => (f < SQ1 ? 0.62 + 0.06 * Math.sin(f * 1.6) : 1) });
  JET.push({ f0: SQ0 + 2, f1: SQ1, from: (f, S) => { const m = lemAt(L0, f, S); return [m.x, m.y + 20]; }, to: (f, S) => { const t = target('pink:top', S); return [t[0], t[1] + 30]; }, w: 16, arc: -10 });
  sfx('squish', SQ0, { who: 'yel', gain: 0.8 }); sfx('splash', SQ0 + 2, { x: PX1, gain: 0.7 }); sfx('drip', SQ0 + 6, { x: PX1, gain: 0.7 });
  for (let f = SQ0 + 6; f < SQ1; f += 6) SPL.push({ f, at: (ff, S) => target('pink:top', S), size: 0.6 });
  sour('pink', SQ0 + 4, SQ1 + 4, PX1, { a: 6 });
  sfx('ref:laugh', SQ0 + 6, { who: 'yel', gain: 0.85, pitch: 1.45 });
  chuckle('yel', SQ0 + 6, SQ1, { mouth: 'happy with theeth' });
  // лимон — через плечо назад
  const TH = SQ1 + 4, LB = TH + 14;
  key('yel', TH - 4, { handF: hand('yel', 'F', 0.4, -0.9), lean: -6 }, 4);
  key('yel', TH, { handF: hand('yel', 'F', -0.6, -0.6), lean: -10 }, 3, 'in2');
  key('yel', TH + 8, { ...stance('yel', YX3, -1), mouth: 'happy with theeth', eyes: 'normal' }, 8);
  L0.segs.push({ f0: TH, f1: LB, a: (f, S) => { const m = lemAt(L0, TH - 1, statesAt(TH - 1)); return [m.x, m.y]; }, b: [1500, GROUND - LR * 0.72], arc: 220, spin: 6 });
  L0.segs.push({ f0: LB, at: onGround(1500) });
  sfx('whoosh', TH, { who: 'yel', dur: 12, gain: 0.5 }); sfx('land', LB, { x: 1500, gain: 0.5 });
  // Розовая укатывается
  const PX2 = 470;
  ST.tumble('pink', SQ1 + 4, SQ1 + 16, PX1, PX2, 70, -1, { stars: 16 });

  // ---- 8.6–9.8 с: Розовая «растёт»
  const PX = 500;
  key('pink', SQ1 + 18, { eyes: 'angry', mouth: 'angry theeth' }, 0);
  ev('vein', { who: 'pink', f0: SQ1 + 18, f1: SQ1 + 28 });
  const PB = transform('pink', SQ1 + 20, PX2, PX, 1, { style: 'grow' });
  key('pink', PB, stance('pink', PX, 1), 0);
  key('pink', PB + 6, { mouth: 'theeth smile', eyes: 'angry' }, 0);
  key('yel', PB - 2, { mouth: 'puzzlement', eyes: 'sad' }, 0);

  // ---- 10–12 с: топает — лимоны с неба: бум-бум, третий ловит
  const STP = stomp('pink', PB + 6, PX, PX, 1);
  key('pink', STP + 4, { mouth: 'happy with theeth', eyes: 'angry' }, 0);
  const R = [{ segs: [] }, { segs: [] }, { segs: [] }];
  LEM.push(...R);
  const top = (f, S) => { const t = target('yel:top', S); return [t[0], t[1] - LR * 0.6]; };
  const RX = [740, 1260, 0];
  for (let i = 0; i < 3; i++) {
    const h = STP + 8 + i * 7;
    R[i].segs.push({ f0: h - 9, f1: h, a: [YX3 + (i - 1) * 40, -150], b: top, ease: 'in2', spin: 4 });
    if (i < 2) {
      R[i].segs.push({ f0: h, f1: h + 12, a: top, b: [RX[i], GROUND - LR * 0.72], arc: 120, spin: 5 });
      R[i].segs.push({ f0: h + 12, at: onGround(RX[i]) });
      sfx('bonk', h, { who: 'yel', gain: 0.9 });
      SPL.push({ f: h, at: top, size: 0.7 });
      key('yel', h, { hip: [0, toRig('yel', 50)], head: 10, mouth: 'puzzlement', eyes: 'sad' }, 1);
      key('yel', h + 4, { hip: [0, toRig('yel', 10)], head: 0 }, 3);
      ev('stars', { who: 'yel', f0: h + 1, f1: h + 14, snd: false });
    }
  }
  const CT = STP + 22;
  key('yel', CT - 3, { hitF: 1, hitFto: (() => { const t = target('yel:top', stateAt(CT)); return [t[0] + 30, t[1] - 40]; })(), hitFfix: CT }, 3);
  R[2].segs.push({ f0: CT, hand: 'yel' });
  sfx('pop', CT, { who: 'yel', gain: 0.6 });
  key('yel', CT + 6, { hitF: 0, handF: hand('yel', 'F', 0.6, -0.5), mouth: 'angry theeth', eyes: 'angry' }, 6);
  sfx('ref:laugh', STP + 12, { who: 'pink', gain: 0.85, pitch: 1.35 });
  chuckle('pink', STP + 12, CT + 6, { mouth: 'happy with theeth' });

  // ---- 12–14 с: кусает лимон — сводит — плюёт соком — Розовая «пуф»
  const BI = CT + 14;
  key('yel', BI - 4, { handF: hand('yel', 'F', 0.3, -0.75), head: 6 }, 4);
  sfx('chomp', BI, { who: 'yel', gain: 1.0 });
  R[2].segs.push({ f0: BI + 2, gone: true });
  sour('yel', BI + 2, BI + 16, YX3, { a: 7 });
  const SP = BI + 18;
  key('yel', SP - 4, { lean: -10, head: -10, mouth: 'puzzlement', eyes: 'angry', sx: 1.04, sy: 0.96 }, 4);
  key('yel', SP, { lean: 12, head: 8, mouth: 'happy open mouth', sx: 1, sy: 1, handF: hand('yel', 'F', 0.5, 0.3), handB: hand('yel', 'B', -0.4, 0.3) }, 2, 'in2');
  squirt(SP, SP + 10, (f, S) => target('yel:lips', S), (f, S) => target('pink:face', S), { w: 26, arc: 40, size: 1.3 });
  key('yel', SP + 10, { ...stance('yel', YX3, -1), mouth: 'happy with theeth', eyes: 'angry' }, 8);
  sour('pink', SP + 6, SP + 20, PX, { a: 7 });
  const psm = shrink('pink', SP + 20, PX, 1, { mouth: 'puzzlement', eyes: 'sad', smoke: 420 });
  sfx('ref:laugh', SP + 12, { who: 'yel', gain: 0.85, pitch: 1.45 });
  chuckle('yel', SP + 12, SP + 32, { mouth: 'happy with theeth' });

  // ---- 14–16 с: шарик-Розовая прыгает на лимон у её ног — сок ей в лицо — «пуф»
  key('pink', psm + 6, { eyes: 'angry', mouth: 'theeth smile' }, 0);
  const H0 = psm + 8, H1 = H0 + 10, J1 = H1 + 2, J2 = J1 + 12;
  hopTo('pink', H0, H1, PX, GROUND, 600, GROUND, 90);
  const lx = RX[0];
  hopTo('pink', J1, J2, 600, GROUND, lx, GROUND - LR * 1.1, 200, { land: false });
  key('yel', J1 + 4, { mouth: 'puzzlement', eyes: 'normal', head: 8 }, 3);
  key('pink', J2, { sx: 1.25, sy: 0.8 }, 1);
  R[0].segs.push({ f0: J2, at: onGround(lx), sq: (f) => (f < J2 + 5 ? 0.5 : f < J2 + 9 ? 1.1 : 1) });
  sfx('squish', J2, { x: lx, gain: 0.9 });
  squirt(J2, J2 + 8, [lx + 60, GROUND - 50], (f, S) => target('yel:face', S), { arc: 30, w: 32, size: 1.3 });
  hopTo('pink', J2 + 2, J2 + 12, lx, GROUND - LR * 1.1, 560, GROUND, 120);
  sour('yel', J2 + 6, J2 + 22, YX3, { a: 9 });
  ev('steam', { who: 'yel', f0: J2 + 8, f1: J2 + 22 });
  const ysm = shrink('yel', J2 + 22, YX3, -1, { mouth: 'puzzlement', eyes: 'sad', smoke: 440 });
  key('pink', J2 + 14, { mouth: 'happy with theeth', eyes: 'normal' }, 0);
  sfx('ref:laugh', J2 + 16, { who: 'pink', gain: 0.85, pitch: 1.35 });
  laugh('pink', J2 + 16, ysm + 6);

  // ---- 16–22 с: шарик-Жёлтая укатывается, Розовая «растёт» и в центр
  sour('yel', ysm + 2, ysm + 14, YX3, { a: 4 });
  const RUN = ysm + 14;
  ST.tumble('yel', RUN, RUN + 14, YX3, 1520, 90, 1, { stars: 30 });
  const PB2 = transform('pink', ysm + 6, 560, 620, 1, { style: 'grow' });
  key('pink', PB2, stance('pink', 620, 1), 0);
  const WIN = victory('pink', PB2 + 4, 620, { n: 9, stride: 120 });
  window.T = { D1, ON, YB, GR, SQ0, PB, STP, CT, BI, SP, psm, J2, ysm, PB2, WIN };
};

// ------------------------------------------------------------------ рисование
ST.hooks.beforeChars.push((ctx, f, S, CAM) => {
  ctx.setTransform(...CAM);
  for (const L of LEM) { const c = L.segs.filter((s) => f >= s.f0).pop(); if (c && c.at) { const m = lemAt(L, f, S); if (m) FX.lemon(ctx, m.x, m.y, LR, m.rot, m.sq); } }
});
ST.hooks.afterChars.push((ctx, f, S, CAM) => {
  ctx.setTransform(...CAM);
  for (const L of LEM) {
    const c = L.segs.filter((s) => f >= s.f0).pop();
    if (!c || c.at || c.gone) continue;
    const m = lemAt(L, f, S);
    if (m) FX.lemon(ctx, m.x, m.y, LR, m.rot, m.sq);
  }
  for (const j of JET) {
    if (f < j.f0 || f >= j.f1 + 4) continue;
    const a = P(j.from, f, S), b = P(j.to, f, S), u = Math.min(1, (f - j.f0 + 1) / 4), al = f >= j.f1 ? 1 - (f - j.f1) / 4 : 1;
    FX.waterJet(ctx, a, b, f / FPS, j.w, u, j.arc, al, JUICE);
  }
  for (const s of SPL) { const at = P(s.at, s.f, statesAt(s.f)); FX.juiceSplash(ctx, at[0], at[1], (f - s.f) / 16, s.size, s.f); }
  for (const s of SOUR) {
    if (f < s.f0 || f >= s.f1) continue;
    const big = S[s.who].p.form === 'big', h = target(`${s.who}:head`, S);
    FX.sourLines(ctx, h[0], h[1], big ? 120 : 150, f / FPS, Math.min(1, (f - s.f0) / 3, (s.f1 - f) / 4));
  }
});

ST.start(BIG);
