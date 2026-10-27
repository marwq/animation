// Ролик 31 (серия по образцу): Зелья — Розовая против Жёлтой, 22 с, 24 кадра/с. Драка без ударов: зелья из
// майнкрафта — пьют и бросают, превращения туда-обратно. Музыка превращения — один раз. Фон — цветочное поле.
//
//   0–2 с     шарик-Розовая (слева) и шарик-Жёлтая (справа) неподвижно стоят друг напротив друга,
//             середина пустая — автор вставит начало
//   2–4.2 с   с неба падает зелёное зелье; Розовая хватает его ртом, выпивает — прыг-скок: падает Жёлтой
//             на макушку, та сплющивается
//   4.2–5.3 с Жёлтая «растёт» под музыку
//   5.4–8.2 с щёлкает пальцами — в руке фиолетовое зелье, бросает: Розовая взлетает (левитация), барахтается
//             в воздухе — и шлёпается вниз
//   8.2–9.4 с Розовая «растёт»
//   9.6–11 с  её красное зелье — Жёлтая «пуф», снова шарик
//   11–12.6 с шарик-Жёлтая скачет и бьёт её в нос, отскакивает
//   12.7–13.9 с Жёлтая «растёт» снова
//   14–17.5 с Розовая бросает ещё зелье — Жёлтая отбивает его ладонью обратно: Розовую уносит в небо
//   17.5–22 с Жёлтая в центре, руки вверх
'use strict';

const ST = Stage({
  name: 'mc31-potions',
  frames: 528,
  cast: {
    pink: { small: ['girl-verity-small', { bodyHeight: 300 }], big: ['girl-verity-big', { height: 730, splitFeet: true }],
      pivot: 337, voice: 1.35, vAngle: 50, lie: 55, color: '#ff4fc8', moods: { angry: 'angry theeth', grin: 'theeth smile', big: 'theeth smile' } },
    yel: { small: ['girl-verity-small', { bodyHeight: 300, recolor: 'yellow' }],
      big: ['verity-big-girl', { height: 730, splitFeet: true, recolor: 'yellow' }], pivot: 337, voice: 1.45, vAngle: 50, lie: 55,
      color: '#ffe23a', moods: { angry: 'angry theeth', grin: 'theeth smile', big: 'theeth smile' } },
  },
  order: ['pink', 'yel'],
  background: { theme: 'flowerfield', seed: 311, sunX: 1520, sunY: 130 },
  clouds: [[150, 80, 2.4, 0, 12], [700, 220, 1.8, 1, 16], [1150, 70, 2.6, 2, 10], [1720, 250, 1.5, 0, 18]],
});
const { FPS, NF, GROUND, C, key, move, ev, sfx, hop, laugh, tremble, transform, shrink, stance, turn,
  victory, chuckle, hand, toRig, statesAt, stateAt, target } = ST;

ST.parts.mouth = (ch, st, p) => {
  const name = ch.layers.some((l) => l.name === p.mouth) ? p.mouth : 'smile normal', l = ch.layers.find((x) => x.name === name);
  return E.apply(ch.eyeMatrix(st, name), [(l.bbox[0] + l.bbox[2]) / 2, (l.bbox[1] + l.bbox[3]) / 2]);
};
const P = (v, f, S) => (typeof v === 'function' ? v(f, S) : typeof v === 'string' ? target(v, S) : v);

// ------------------------------------------------------------------ зелья
const GREEN = '#3ad15a', PURPLE = '#b04dff', RED = '#ff3a6a', PS = 110;
const POTS = [];          // {col, segs: [{f0, at, rot} | {f0, hand} | {f0, mouth, rot, fill} | {f0, f1, a, b, arc, spin} | {f0, gone}]}
const BURST = [];         // {f, at, col, size}
const SWIRL = [];         // {who, f0, f1, col}
const TRAIL = [];         // {f0, f1, pot} — блёстки за падающим зельем
function potAt(Pt, f, S) {
  let cur = null;
  for (const c of Pt.segs) if (f >= c.f0) cur = c;
  if (!cur || cur.gone) return null;
  if (cur.at) return { x: cur.at[0], y: cur.at[1], rot: cur.rot || 0, fill: cur.fill ?? 1 };
  if (cur.hand) {
    if (S[cur.hand].p.form !== 'big') return null;
    const h = C[cur.hand].big.point(S[cur.hand].st, 'handF');
    return { x: h[0], y: h[1] + PS * 0.35, rot: 0, fill: 1 };
  }
  if (cur.mouth) {
    const m = target(`${cur.mouth}:mouth`, S), u = cur.f1 ? E.clamp((f - cur.f0) / (cur.f1 - cur.f0), 0, 1) : 0;
    const fc = S[cur.mouth].p.face || 1, rot = fc * (cur.rot0 + (cur.rot1 - cur.rot0) * u);
    return { x: m[0] + fc * 20, y: m[1] + PS * 0.2, rot, fill: 1 - u };
  }
  const u = E.clamp((f - cur.f0) / (cur.f1 - cur.f0), 0, 1), a = P(cur.a, cur.f0, statesAt(cur.f0)), b = P(cur.b, f, S);
  const e = cur.ease ? E.EASE[cur.ease](u) : u;
  return { x: E.lerp(a[0], b[0], e), y: E.lerp(a[1], b[1], e) - Math.sin(Math.PI * u) * (cur.arc || 0), rot: u * (cur.spin || 0), fill: cur.fill ?? 1 };
}
function burst(f, at, col, who, size = 1) {
  BURST.push({ f, at, col, size });
  sfx('crunch', f, { who, gain: 0.7 });
  sfx('splash', f, { who, gain: 0.6 });
  sfx('sparkle', f + 2, { who, gain: 0.7 });
  ev('flash', { f, who, strength: 0.3 });
}
// прыжок шарика из точки в точку (в том числе на голову)
function hopTo(who, f0, f1, x0, y0, x1, y1, h, o = {}) {
  const mid = Math.round((f0 + f1) / 2);
  key(who, f0, { sx: 1.2, sy: 0.82 }, o.prep ?? 3);
  move(who, f0, { x: x0, y: y0 });
  key(who, f0 + 2, { sx: 0.86, sy: 1.16 }, 2);
  move(who, mid, { y: Math.min(y0, y1) - h }, 'out2');
  key(who, mid, { sx: 1, sy: 1 }, 3);
  move(who, f1, { y: y1 }, 'in2');
  move(who, f1, { x: x1 }, 'lin');
  key(who, f1, { sx: 1.25, sy: 0.78 }, 1);
  key(who, f1 + 3, { sx: 0.94, sy: 1.07 }, 3);
  key(who, f1 + 7, { sx: 1, sy: 1 }, 4);
  sfx('jump', f0 + 2, { who, gain: 0.55 });
  if (o.land !== false) sfx('land', f1, { who, gain: 0.5 });
}

const PX0 = 560, YX0 = 1360;
// ================================================================== 0–2 с: неподвижная стойка
key('pink', 0, { form: 'small', x: PX0, y: GROUND, face: 1, look: 1, eyes: 'normal', mouth: 'smile normal', sx: 1, sy: 1, rot: 0, pivot: 0, alpha: 1 }, 0);
key('yel', 0, { form: 'small', x: YX0, y: GROUND, face: -1, look: 1, eyes: 'normal', mouth: 'smile normal', sx: 1, sy: 1, rot: 0, pivot: 0, alpha: 1 }, 0);

const BIG = () => {
  // ---- 2–4.2 с: зелёное зелье с неба — Розовая выпивает — прыг на макушку Жёлтой
  const G1 = { col: GREEN, segs: [] };
  POTS.push(G1);
  const D0 = 48, D1 = 58;
  G1.segs.push({ f0: D0, f1: D1, a: [960, -140], b: [960, GROUND], ease: 'in2' });
  G1.segs.push({ f0: D1, at: [960, GROUND] });
  TRAIL.push({ f0: D0, f1: D1 + 6, pot: G1 });
  sfx('twinkle', D0, { x: 960, gain: 0.7 });
  sfx('pop', D1, { x: 960, gain: 0.8 });
  ev('twinkle', { f: D1, at: [960, GROUND - 60], n: 16, size: 46 });
  key('pink', D0 + 4, { mouth: 'puzzlement' }, 0); key('yel', D0 + 4, { mouth: 'puzzlement' }, 0);
  key('pink', D1 + 2, { mouth: 'theeth smile', eyes: 'angry' }, 0);
  const PX1 = 840;
  hopTo('pink', D1 + 2, D1 + 10, PX0, GROUND, PX1, GROUND, 110);
  key('yel', D1 + 6, { mouth: 'sad', eyes: 'sad' }, 0);
  const GR = D1 + 11, DR0 = GR + 3, DR1 = DR0 + 6;
  G1.segs.push({ f0: GR, f1: DR0, a: [960, GROUND], b: (f, S) => { const m = target('pink:mouth', S); return [m[0] + 20, m[1] + PS * 0.2]; }, arc: 60 });
  G1.segs.push({ f0: DR0, f1: DR1, mouth: 'pink', rot0: 0.3, rot1: 2.2 });
  sfx('pop', GR, { who: 'pink', gain: 0.6 });
  key('pink', DR0 - 1, { pivot: ST.CAST.pink.pivot, mouth: 'puzzlement', eyes: 'normal' }, 0);
  key('pink', DR0 + 3, { rot: -24 }, 3); key('pink', DR1, { rot: 0 }, 3);
  sfx('gulp', DR0 + 1, { who: 'pink', gain: 0.9 }); sfx('gulp', DR0 + 5, { who: 'pink', gain: 0.9 });
  // пустой пузырёк улетает за кадр
  G1.segs.push({ f0: DR1, f1: DR1 + 14, a: (f, S) => target('pink:mouth', S), b: [-150, 300], arc: 160, spin: -9, fill: 0 });
  G1.segs.push({ f0: DR1 + 14, gone: true });
  SWIRL.push({ who: 'pink', f0: DR1, f1: DR1 + 56, col: GREEN });
  sfx('powerup', DR1, { who: 'pink', dur: 10, gain: 0.6 });
  key('pink', DR1 + 1, { mouth: 'happy with theeth', eyes: 'angry' }, 0);
  // прыг — на макушку Жёлтой
  const B0 = DR1 + 2, B1 = B0 + 12, ytop = target('yel:top', stateAt(1))[1];
  hopTo('pink', B0, B1, PX1, GROUND, YX0, ytop + 40, 170, { land: false });
  sfx('boing', B0 + 1, { who: 'pink', gain: 0.8 });
  sfx('bonk', B1, { who: 'yel', gain: 0.9 });
  sfx('boing', B1 + 1, { who: 'yel', gain: 0.6 });
  key('yel', B1 - 3, { mouth: 'puzzlement', eyes: 'sad' }, 0);
  key('yel', B1, { sx: 1.5, sy: 0.6 }, 1);
  ev('shake', { f: B1, amp: 10, n: 8 });
  const OFF = B1 + 3, BK = OFF + 12;
  move('pink', B1 + 1, { x: YX0, y: ytop + 150 }, 'in2');
  hopTo('pink', OFF, BK, YX0, ytop + 150, 620, GROUND, 150);
  move('pink', OFF, { rot: 0 }); move('pink', BK, { rot: -360 }, 'lin'); key('pink', BK + 1, { rot: 0 }, 0);
  key('yel', OFF + 1, { sx: 0.9, sy: 1.12 }, 3); key('yel', OFF + 6, { sx: 1.06, sy: 0.94 }, 3); key('yel', OFF + 10, { sx: 1, sy: 1 }, 3);
  ev('stars', { who: 'yel', f0: OFF + 2, f1: OFF + 26 });
  hopTo('pink', BK + 2, BK + 10, 620, GROUND, 600, GROUND, 90);
  sfx('ref:laugh', BK + 2, { who: 'pink', gain: 0.85, pitch: 1.35 });
  key('pink', BK + 10, { mouth: 'happy with theeth', eyes: 'normal' }, 0);
  laugh('pink', BK + 12, BK + 30);

  // ---- 4.2–5.3 с: Жёлтая «растёт»
  const YX = 1300;
  key('yel', OFF + 6, { eyes: 'angry', mouth: 'angry theeth' }, 0);
  ev('vein', { who: 'yel', f0: OFF + 6, f1: OFF + 16 });
  const YB = transform('yel', OFF + 8, YX0, YX, -1, { style: 'grow' });
  key('yel', YB, stance('yel', YX, -1), 0);
  key('yel', YB + 6, { mouth: 'theeth smile', eyes: 'angry' }, 0);
  key('pink', YB - 2, { mouth: 'puzzlement', eyes: 'sad' }, 0);

  // ---- 5.4–8.2 с: щелчок — фиолетовое зелье — бросок — Розовая левитирует — шлёп
  const SN = YB + 6;
  key('yel', SN - 3, { handF: hand('yel', 'F', 0.45, -0.75) }, 3);
  sfx('flick', SN, { who: 'yel', gain: 1.0 });
  sfx('sparkle', SN + 1, { who: 'yel', gain: 0.7 });
  ev('twinkle', { f: SN, at: C.yel.big.point(stateAt(SN).yel.st, 'handF'), n: 16, size: 50 });
  const P2 = { col: PURPLE, segs: [{ f0: SN + 1, hand: 'yel' }] };
  POTS.push(P2);
  const TH = SN + 10, HIT = TH + 12;
  key('yel', TH - 4, { handF: hand('yel', 'F', -0.45, -0.55), lean: -8 }, 4);
  key('yel', TH, { handF: hand('yel', 'F', 0.9, -0.3), lean: 12 }, 3, 'in2');
  key('yel', TH + 10, { ...stance('yel', YX, -1), mouth: 'happy with theeth', eyes: 'normal' }, 8);
  sfx('swing', TH - 2, { who: 'yel', gain: 0.9 });
  P2.segs.push({ f0: TH, f1: HIT, a: (f, S) => { const h = C.yel.big.point(S.yel.st, 'handF'); return [h[0], h[1] + PS * 0.35]; }, b: (f, S) => { const b = target('pink:body', S); return [b[0], b[1] + 40]; }, arc: 120, spin: -8 });
  P2.segs.push({ f0: HIT, gone: true });
  burst(HIT, (f, S) => target('pink:body', S), PURPLE, 'pink');
  SWIRL.push({ who: 'pink', f0: HIT, f1: HIT + 40, col: PURPLE });
  // левитация: поднимается, барахтается
  const UP1 = HIT + 16, DROP = HIT + 30, LND = DROP + 8;
  key('pink', HIT, { mouth: 'puzzlement', eyes: 'sad', pivot: ST.CAST.pink.pivot }, 0);
  move('pink', HIT, { x: 600, y: GROUND, rot: 0 });
  move('pink', UP1, { x: 680, y: GROUND - 380 }, 'io');
  for (let f = HIT + 2; f < DROP; f += 8) { key('pink', f + 4, { rot: 16 }, 4); key('pink', f + 8, { rot: -16 }, 4); }
  move('pink', DROP, { x: 700, y: GROUND - 400 });
  sfx('inflate', HIT + 2, { who: 'pink', dur: 16, gain: 0.6 });
  sfx('scared', HIT + 6, { who: 'pink', gain: 0.8 });
  sfx('ref:laugh', HIT + 6, { who: 'yel', gain: 0.85, pitch: 1.45 });
  chuckle('yel', HIT + 6, HIT + 26, { mouth: 'happy with theeth' });
  // действие кончилось — шлёп
  ev('twinkle', { f: DROP, at: [700, GROUND - 550], n: 14, size: 40 });
  sfx('pop', DROP, { who: 'pink', gain: 0.6 });
  move('pink', LND, { x: 700, y: GROUND }, 'in2');
  key('pink', DROP, { rot: 0 }, 2);
  key('pink', LND, { sx: 1.45, sy: 0.62 }, 1); key('pink', LND + 4, { sx: 0.94, sy: 1.08 }, 3); key('pink', LND + 8, { sx: 1, sy: 1 }, 3);
  sfx('fall', LND, { who: 'pink', gain: 0.9 });
  ev('dust', { f: LND, x: 700, r: 40, n: 6 });
  ev('shake', { f: LND, amp: 10, n: 8 });
  ev('stars', { who: 'pink', f0: LND + 2, f1: LND + 22 });

  // ---- 8.2–9.4 с: Розовая «растёт»
  const PX = 660;
  key('pink', LND + 6, { eyes: 'angry', mouth: 'angry theeth' }, 0);
  ev('vein', { who: 'pink', f0: LND + 6, f1: LND + 16 });
  const PB = transform('pink', LND + 8, 700, PX, 1, { style: 'grow' });
  key('pink', PB, stance('pink', PX, 1), 0);
  key('pink', PB + 6, { mouth: 'theeth smile', eyes: 'angry' }, 0);
  key('yel', PB - 2, { mouth: 'puzzlement', eyes: 'sad' }, 0);

  // ---- 9.6–11 с: красное зелье — Жёлтая «пуф»
  const SN2 = PB + 4;
  key('pink', SN2 - 3, { handF: hand('pink', 'F', 0.45, -0.75) }, 3);
  sfx('flick', SN2, { who: 'pink', gain: 1.0 });
  sfx('sparkle', SN2 + 1, { who: 'pink', gain: 0.7 });
  ev('twinkle', { f: SN2, at: C.pink.big.point(stateAt(SN2).pink.st, 'handF'), n: 16, size: 50 });
  const P3 = { col: RED, segs: [{ f0: SN2 + 1, hand: 'pink' }] };
  POTS.push(P3);
  const TH2 = SN2 + 8, HIT2 = TH2 + 12;
  key('pink', TH2 - 4, { handF: hand('pink', 'F', -0.45, -0.55), lean: -8 }, 4);
  key('pink', TH2, { handF: hand('pink', 'F', 0.9, -0.3), lean: 12 }, 3, 'in2');
  key('pink', TH2 + 10, { ...stance('pink', PX, 1), mouth: 'happy with theeth', eyes: 'normal' }, 8);
  sfx('swing', TH2 - 2, { who: 'pink', gain: 0.9 });
  P3.segs.push({ f0: TH2, f1: HIT2, a: (f, S) => { const h = C.pink.big.point(S.pink.st, 'handF'); return [h[0], h[1] + PS * 0.35]; }, b: (f, S) => target('yel:face', S), arc: 140, spin: 8 });
  P3.segs.push({ f0: HIT2, gone: true });
  burst(HIT2, (f, S) => target('yel:face', S), RED, 'yel');
  SWIRL.push({ who: 'yel', f0: HIT2, f1: HIT2 + 24, col: RED });
  key('yel', HIT2, { lean: -14, head: -12, mouth: 'puzzlement', eyes: 'sad', handF: hand('yel', 'F', 0.4, -0.6), handB: hand('yel', 'B', -0.4, -0.5) }, 2);
  tremble('yel', HIT2 + 2, HIT2 + 8, YX, 5);
  const ysm = shrink('yel', HIT2 + 8, YX, -1, { mouth: 'puzzlement', eyes: 'sad', smoke: 420 });
  ev('twinkle', { f: ysm, at: [YX, GROUND - 200], n: 20, size: 60 });
  sfx('ref:laugh', ysm + 2, { who: 'pink', gain: 0.85, pitch: 1.35 });
  chuckle('pink', ysm + 2, ysm + 22, { mouth: 'happy with theeth' });

  // ---- 11–12.6 с: шарик-Жёлтая скачет — в нос Розовой — отскок
  key('yel', ysm + 10, { eyes: 'angry', mouth: 'angry theeth' }, 0);
  const J0 = ysm + 12, J1 = J0 + 9, NOSE = J1 + 10;
  hopTo('yel', J0, J1, YX, GROUND, 1040, GROUND, 100);
  const nose = target('pink:face', stateAt(NOSE));
  hopTo('yel', J1 + 1, NOSE, 1040, GROUND, nose[0] + 130, nose[1] + 150, 60, { land: false });
  sfx('bonk', NOSE, { who: 'pink', gain: 1.0 });
  ev('shake', { f: NOSE, amp: 12, n: 8 });
  key('pink', NOSE, { lean: -16, head: -16, hip: [0, toRig('pink', 30)], mouth: 'puzzlement', eyes: 'sad', handF: hand('pink', 'F', 0.45, -0.6), handB: hand('pink', 'B', -0.3, 0.35) }, 2);
  ev('stars', { who: 'pink', f0: NOSE + 2, f1: NOSE + 30 });
  for (let k = NOSE + 4; k < NOSE + 28; k += 8) key('pink', k, { head: ((k - NOSE) / 8) % 2 < 1 ? -14 : -4 }, 4);
  key('pink', NOSE + 30, { ...stance('pink', PX, 1), head: 0, mouth: 'angry theeth', eyes: 'angry' }, 8);
  const YX2 = 1240, BKY = NOSE + 14;
  hopTo('yel', NOSE + 2, BKY, nose[0] + 130, nose[1] + 150, YX2, GROUND, 30);
  move('yel', NOSE + 2, { rot: 0 }); key('yel', NOSE + 2, { pivot: ST.CAST.yel.pivot }, 0);
  move('yel', BKY, { rot: 360 }, 'lin'); key('yel', BKY + 1, { rot: 0 }, 0);
  key('yel', BKY, { mouth: 'happy with theeth', eyes: 'normal' }, 0);
  sfx('ref:laugh', BKY + 2, { who: 'yel', gain: 0.8, pitch: 1.45 });
  laugh('yel', BKY + 2, BKY + 8);

  // ---- 12.7–13.9 с: Жёлтая «растёт» снова
  key('yel', BKY + 8, { eyes: 'angry', mouth: 'angry theeth' }, 0);
  const YB2 = transform('yel', BKY + 10, YX2, YX2, -1, { style: 'grow' });
  key('yel', YB2, stance('yel', YX2, -1), 0);
  key('yel', YB2 + 6, { mouth: 'theeth smile', eyes: 'angry' }, 0);

  // ---- 14–17.5 с: Розовая бросает зелье — Жёлтая отбивает — Розовую уносит в небо
  const SN3 = YB2 + 4;
  key('pink', SN3 - 3, { handF: hand('pink', 'F', 0.45, -0.75), mouth: 'theeth smile', eyes: 'angry' }, 3);
  sfx('flick', SN3, { who: 'pink', gain: 1.0 });
  ev('twinkle', { f: SN3, at: C.pink.big.point(stateAt(SN3).pink.st, 'handF'), n: 16, size: 50 });
  const P4 = { col: PURPLE, segs: [{ f0: SN3 + 1, hand: 'pink' }] };
  POTS.push(P4);
  const TH3 = SN3 + 8, SW = TH3 + 10, HIT3 = SW + 12;
  key('pink', TH3 - 4, { handF: hand('pink', 'F', -0.45, -0.55), lean: -8 }, 4);
  key('pink', TH3, { handF: hand('pink', 'F', 0.9, -0.3), lean: 12 }, 3, 'in2');
  key('pink', TH3 + 8, { ...stance('pink', PX, 1), mouth: 'happy with theeth', eyes: 'angry' }, 6);
  sfx('swing', TH3 - 2, { who: 'pink', gain: 0.9 });
  const SWP = [YX2 - 230, GROUND - 520];
  P4.segs.push({ f0: TH3, f1: SW, a: (f, S) => { const h = C.pink.big.point(S.pink.st, 'handF'); return [h[0], h[1] + PS * 0.35]; }, b: SWP, arc: 90, spin: 7 });
  key('yel', SW - 5, { handF: hand('yel', 'F', -0.3, -0.7), lean: -6 }, 4);
  key('yel', SW, { hitF: 1, hitFto: [SWP[0] + 10, SWP[1] - 30], hitFfix: SW, lean: 10 }, 3, 'in2');
  key('yel', SW + 8, { ...stance('yel', YX2, -1), hitF: 0, mouth: 'happy with theeth', eyes: 'angry' }, 8);
  sfx('slap', SW, { who: 'yel', gain: 0.9 });
  ev('spark', { f: SW, at: SWP, r: 60, snd: false, swing: false });
  P4.segs.push({ f0: SW, f1: HIT3, a: SWP, b: (f, S) => target('pink:face', S), arc: 70, spin: -9 });
  P4.segs.push({ f0: HIT3, gone: true });
  key('pink', SW + 2, { mouth: 'puzzlement', eyes: 'sad' }, 0);
  burst(HIT3, (f, S) => target('pink:face', S), PURPLE, 'pink');
  SWIRL.push({ who: 'pink', f0: HIT3, f1: NF, col: PURPLE });
  // уносит вверх, барахтается
  const KP = C.pink.big, GONE = HIT3 + 44;
  key('pink', HIT3 + 2, { pivot: (KP.anchor[1] - KP.top) / 2, legFfk: 1, legBfk: 1, legF: [-20, 40], legB: [20, -30],
    handF: hand('pink', 'F', 0.5, -0.85), handB: hand('pink', 'B', -0.5, -0.85), mouth: 'puzzlement', eyes: 'sad' }, 4);
  move('pink', HIT3 + 2, { x: PX, y: GROUND, rot: 0 });
  move('pink', GONE, { x: PX + 120, y: -760 }, 'in');
  for (let f = HIT3 + 4; f < GONE; f += 10) { key('pink', f + 5, { rot: 12, legF: [-40, 50], legB: [30, -20] }, 5); key('pink', f + 10, { rot: -12, legF: [-10, 30], legB: [10, -40] }, 5); }
  sfx('inflate', HIT3 + 2, { who: 'pink', dur: 30, gain: 0.6 });
  sfx('scared', HIT3 + 4, { who: 'pink', gain: 0.9 });
  ev('twinkle', { f: GONE - 4, at: [PX + 120, 110], n: 22, size: 60 });
  sfx('ref:laugh', HIT3 + 6, { who: 'yel', gain: 0.85, pitch: 1.45 });
  chuckle('yel', HIT3 + 6, HIT3 + 26, { mouth: 'happy with theeth' });

  // ---- 17.5–22 с: в центр, руки вверх
  const WIN = victory('yel', HIT3 + 24, YX2, { n: 9, stride: 100 });
  window.T = { D1, DR1, B1, YB, HIT, LND, PB, HIT2, ysm, NOSE, YB2, SW, HIT3, GONE, WIN };
};

// ------------------------------------------------------------------ рисование
ST.hooks.beforeChars.push((ctx, f, S, CAM) => {
  ctx.setTransform(...CAM);
  for (const Pt of POTS) { const cur = Pt.segs.filter((c) => f >= c.f0).pop(); if (cur && cur.at) FX.potion(ctx, cur.at[0], cur.at[1], PS, Pt.col, cur.rot || 0, cur.fill ?? 1, f / FPS); }
});
ST.hooks.afterChars.push((ctx, f, S, CAM) => {
  ctx.setTransform(...CAM);
  for (const s of SWIRL) {
    if (f < s.f0 || f >= s.f1) continue;
    const p = target(`${s.who}:body`, S), big = S[s.who].p.form === 'big';
    FX.effectSwirls(ctx, p[0], p[1], (f - s.f0) / FPS, s.col, big ? 220 : 130, Math.min(1, (f - s.f0) / 4, (s.f1 - f) / 8), s.f0);
  }
  for (const t of TRAIL) {
    if (f < t.f0 || f >= t.f1) continue;
    const m = potAt(t.pot, Math.min(f, t.f1 - 7), S);
    if (m) for (let i = 0; i < 3; i++) FX.twinkle(ctx, m.x + (i - 1) * 30, m.y - 80 - i * 50, ((f - t.f0) / 6 + i * 0.3) % 1, 30);
  }
  for (const Pt of POTS) {
    const cur = Pt.segs.filter((c) => f >= c.f0).pop();
    if (!cur || cur.at) continue;
    const m = potAt(Pt, f, S);
    if (m) FX.potion(ctx, m.x, m.y, PS, Pt.col, m.rot, m.fill, f / FPS);
  }
  for (const b of BURST) { const at = P(b.at, b.f, statesAt(b.f)); FX.potionBurst(ctx, at[0], at[1], (f - b.f) / 20, b.col, b.f, b.size); }
});

ST.start(BIG);
