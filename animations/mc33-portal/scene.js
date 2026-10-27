// Ролик 33 (серия по образцу): Порталы — Жёлтая против Скелета, 22 с, 24 кадра/с. Драка без ударов:
// порталы незера — прыгнул в один, выпал из другого; бесконечное падение по кругу; вход в портал маленькой —
// выход большой. Музыка превращения — один раз. Фон — тайга.
//
//   0–2 с     шарик-Жёлтая (слева) и шарик-Скелет (справа) неподвижно стоят друг напротив друга,
//             середина пустая — автор вставит начало
//   2–4.3 с   открываются портал в траве и портал в небе над Скелетом; Жёлтая прыгает в портал —
//             выпадает с неба Скелету на макушку
//   4.1–5.3 с Скелет «растёт» под музыку
//   5.5–8.8 с двигает небесный портал прямо над наземным и машет крыльями — ветер катит Жёлтую в портал:
//             она падает по кругу, всё быстрее
//   8.8–9.3 с из неба она вылетает уже большой — Скелет влюблён
//   9.6–12.6 с снимает небесный портал и кидает тарелкой ему под ноги — Скелет проваливается и падает
//             с неба позади неё — «пуф», шарик
//   12.7–14.6 с Скелет «растёт» снова и пикирует на неё — она ставит портал: он влетает и вылетает за край
//   17.5–22 с Жёлтая в центре, руки вверх
'use strict';

const ST = Stage({
  name: 'mc33-portal',
  frames: 528,
  cast: {
    yel: { small: ['girl-verity-small', { bodyHeight: 300, recolor: 'yellow' }],
      big: ['verity-big-girl', { height: 730, splitFeet: true, recolor: 'yellow' }], pivot: 337, voice: 1.45, vAngle: 50, lie: 55,
      color: '#ffe23a', moods: { angry: 'angry theeth', grin: 'theeth smile', big: 'theeth smile' } },
    skel: { small: ['skeleton-verity-small', { scale: 0.455 }], big: ['skeleton-verity-big', { height: 730 }], pivot: 325,
      voice: 0.9, lie: 60, color: '#f3f1e6', moods: { angry: 'angry theeth', grin: 'happy with theeth', big: 'theeth smile' } },
  },
  order: ['skel', 'yel'],
  background: { theme: 'taiga', seed: 331, sunX: 1520, sunY: 140 },
  clouds: [[150, 80, 2.4, 0, 12], [700, 220, 1.8, 1, 16], [1150, 70, 2.6, 2, 10], [1720, 250, 1.5, 0, 18]],
});
const { FPS, NF, GROUND, C, key, move, ev, sfx, hop, laugh, tremble, transform, shrink, love, stance, turn,
  victory, chuckle, hand, toRig, statesAt, stateAt, target } = ST;

function flap(f0, f1, gain = 0.6) {
  for (let f = f0; f < f1; f += 6) { key('skel', f, { b_B16: -30, b_B17: 30 }, 3); key('skel', f + 3, { b_B16: 46, b_B17: -46 }, 3, 'in'); }
  key('skel', f1, { b_B16: 0, b_B17: 0 }, 4);
  sfx('gust', f0, { who: 'skel', dur: f1 - f0, gain });
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

// ------------------------------------------------------------------ порталы
const FLOOR = [150, 34], WALL = [48, 230];
const PORT = [];          // {f0, f1, size: [rx, ry], keys: [{f, x, y} | {f, hand}], seed}
const CLIP = [];          // {who, f0, f1, keep: [x0, y0, x1, y1]}
function portalAt(Pt, f, S) {
  let i = 0;
  while (i + 1 < Pt.keys.length && Pt.keys[i + 1].f <= f) i++;
  const k0 = Pt.keys[i], k1 = Pt.keys[i + 1];
  const pos = (k) => (k.hand ? (S[k.hand].p.form === 'big' ? (() => { const h = C[k.hand].big.point(S[k.hand].st, 'handF'); return [h[0], h[1] - 40]; })() : [0, 0]) : [k.x, k.y]);
  const a = pos(k0);
  if (!k1 || f < k0.f) return a;
  const u = E.EASE[k1.ease || 'io'](E.clamp((f - k0.f) / (k1.f - k0.f), 0, 1)), b = pos(k1);
  return [E.lerp(a[0], b[0], u), E.lerp(a[1], b[1], u) - Math.sin(Math.PI * u) * (k1.arc || 0)];
}
function openSnd(f, x) { sfx('zap', f, { x, gain: 0.8 }); sfx('powerup', f, { x, dur: 8, gain: 0.6 }); sfx('sparkle', f + 3, { x, gain: 0.6 }); }
ST.hooks.clip = (ctx, who, f) => {
  const c = CLIP.find((k) => k.who === who && f >= k.f0 && f < k.f1);
  if (!c) return false;
  ctx.beginPath(); ctx.rect(c.keep[0], c.keep[1], c.keep[2] - c.keep[0], c.keep[3] - c.keep[1]);
  return true;
};

const YX0 = 560, SX0 = 1360, AX = 960, BY = 70, AY = GROUND - 4;
// ================================================================== 0–2 с: неподвижная стойка
key('yel', 0, { form: 'small', x: YX0, y: GROUND, face: 1, look: 1, eyes: 'normal', mouth: 'smile normal', sx: 1, sy: 1, rot: 0, pivot: 0, alpha: 1 }, 0);
key('skel', 0, { form: 'small', x: SX0, y: GROUND, face: -1, look: 1, eyes: 'normal', mouth: 'smile normal', sx: 1, sy: 1, rot: 0, pivot: 0, alpha: 1 }, 0);

const BIG = () => {
  const ALL = [-600, -600, 2600, 2000];
  // ---- 2–4.3 с: порталы — Жёлтая прыгает в траву — падает с неба Скелету на макушку
  const A = { f0: 48, f1: 216, size: FLOOR, keys: [{ f: 0, x: AX, y: AY }], seed: 2 };
  const B = { f0: 52, f1: 300, size: FLOOR, keys: [{ f: 0, x: SX0, y: BY }], seed: 5 };
  PORT.push(A, B);
  openSnd(48, AX); openSnd(52, SX0);
  key('yel', 50, { mouth: 'puzzlement' }, 0); key('skel', 54, { mouth: 'puzzlement' }, 0);
  key('yel', 58, { mouth: 'theeth smile', eyes: 'angry' }, 0);
  hopTo('yel', 60, 70, YX0, GROUND, AX, GROUND, 120, { land: false });
  const IN0 = 70, IN1 = 76;
  move('yel', IN1, { y: GROUND + 330 }, 'in2');
  CLIP.push({ who: 'yel', f0: IN0, f1: 78, keep: [-600, -600, 2600, GROUND] });
  sfx('whoosh', IN0, { who: 'yel', dur: 6, gain: 0.6 }); sfx('zap', IN0 + 1, { x: AX, gain: 0.6 });
  const OUT = 78, BONK = 86, ytop = target('skel:top', stateAt(1))[1];
  key('yel', OUT, { x: SX0, y: BY, pivot: ST.CAST.yel.pivot, rot: 0, mouth: 'happy with theeth' }, 0);
  move('yel', BONK, { y: ytop + 40 }, 'in2');
  move('yel', BONK, { rot: 360 }, 'lin'); key('yel', BONK + 1, { rot: 0 }, 0);
  CLIP.push({ who: 'yel', f0: OUT, f1: BONK, keep: [-600, BY, 2600, 2000] });
  sfx('zap', OUT, { x: SX0, gain: 0.6 }); sfx('whoosh', OUT + 1, { x: SX0, dur: 7, gain: 0.5 });
  key('skel', BONK - 3, { mouth: 'puzzlement', eyes: 'sad' }, 0);
  key('skel', BONK, { sx: 1.5, sy: 0.6 }, 1);
  key('yel', BONK, { sx: 1.25, sy: 0.8 }, 1);
  sfx('bonk', BONK, { who: 'skel', gain: 1.0 }); sfx('boing', BONK + 1, { who: 'skel', gain: 0.6 });
  ev('shake', { f: BONK, amp: 12, n: 8 });
  ev('stars', { who: 'skel', f0: BONK + 4, f1: BONK + 28 });
  key('skel', BONK + 4, { sx: 0.9, sy: 1.12 }, 3); key('skel', BONK + 8, { sx: 1.05, sy: 0.95 }, 3); key('skel', BONK + 12, { sx: 1, sy: 1 }, 3);
  const YX1 = 1050;
  hopTo('yel', BONK + 2, BONK + 14, SX0, ytop + 40, YX1, GROUND, 60);
  sfx('ref:laugh', BONK + 14, { who: 'yel', gain: 0.85, pitch: 1.45 });
  key('yel', BONK + 14, { mouth: 'happy with theeth', eyes: 'normal' }, 0);
  laugh('yel', BONK + 16, BONK + 36);

  // ---- 4.1–5.3 с: Скелет «растёт»
  const SX = 1580;
  key('skel', BONK + 12, { eyes: 'angry', mouth: 'angry theeth' }, 0);
  ev('vein', { who: 'skel', f0: BONK + 12, f1: BONK + 22 });
  const SB = transform('skel', BONK + 14, SX0, SX, -1, { style: 'grow' });
  key('skel', SB, stance('skel', SX, -1), 0);
  key('skel', SB + 6, { mouth: 'angry theeth', eyes: 'angry' }, 0);
  key('yel', SB - 2, { mouth: 'puzzlement', eyes: 'sad' }, 0);

  // ---- 5.5–8.8 с: двигает небесный портал над наземным — ветер — падение по кругу
  const RE = SB + 4, SH = RE + 6, SH1 = SH + 12;
  key('skel', RE, { hitF: 1, hitFto: [SX0, BY + 30], hitFfix: RE, mouth: 'happy with theeth' }, 5);
  B.keys.push({ f: SH, x: SX0, y: BY }, { f: SH1, x: AX, y: BY });
  sfx('whoosh', SH, { x: 1160, dur: 12, gain: 0.6 });
  key('skel', SH + 4, { ...stance('skel', SX, -1), hitF: 0, handF: hand('skel', 'F', 0.6, -0.5), mouth: 'happy with theeth', eyes: 'angry' }, 6);
  const W0 = SH1 + 2, W1 = W0 + 18;
  flap(W0, W1, 0.9);
  ev('wind', { f0: W0, f1: W1, x0: SX - 200, x1: 700, snd: false });
  key('skel', W0, { lean: 8, mouth: 'happy open mouth' }, 4);
  key('yel', W0 + 2, { mouth: 'puzzlement', eyes: 'sad', pivot: ST.CAST.yel.pivot }, 0);
  sfx('scared', W0 + 4, { who: 'yel', gain: 0.8 });
  const R0 = W0 + 4, R1 = R0 + 10, SK0 = R1, SK1 = SK0 + 6;
  move('yel', R0, { x: YX1, y: GROUND, rot: 0 });
  move('yel', R1, { x: AX, rot: -400 }, 'in');
  move('yel', SK1, { y: GROUND + 330 }, 'in2');
  key('yel', SK1 + 1, { rot: 0 }, 0);
  CLIP.push({ who: 'yel', f0: SK0, f1: SK1 + 2, keep: [-600, -600, 2600, GROUND] });
  sfx('zap', SK0, { x: AX, gain: 0.6 });
  // круги: из неба — в траву — из неба…
  const L0 = SK1 + 2, NL = 4;
  let s = L0;
  for (let i = 0; i < NL; i++) {
    const n = 11 - i * 2;
    key('yel', s, { x: AX, y: BY, rot: i * 200 }, 0);
    move('yel', s + n - 1, { y: GROUND + 330, rot: i * 200 + 300 }, 'in2');
    CLIP.push({ who: 'yel', f0: s, f1: s + n, keep: [-600, BY, 2600, GROUND] });
    sfx('whoosh', s, { x: AX, dur: n, gain: 0.5 }); sfx('zap', s, { x: AX, gain: 0.4 });
    if (i === NL - 1) key('yel', s, { mouth: 'angry theeth', eyes: 'angry' }, 0);
    s += n;
  }
  const LEND = s;
  key('yel', L0, { mouth: 'puzzlement', eyes: 'sad' }, 0);
  sfx('scared', L0 + 2, { who: 'yel', gain: 0.7 });
  sfx('ref:laugh', L0 + 2, { who: 'skel', gain: 0.85, pitch: 0.9 });
  chuckle('skel', L0 + 2, LEND, { mouth: 'happy with theeth' });

  // ---- 8.8–9.3 с: из неба вылетает большая — Скелет влюблён
  const YX = AX, BIGO = LEND, LAND = BIGO + 10;
  key('yel', BIGO, { form: 'big', x: YX, y: BY, face: 1, rot: 0, pivot: 0, sx: 1, sy: 1, look: 1, ...C.yel.big.feet(YX, 1), legFfk: 0, legBfk: 0,
    hip: [0, 8], lean: 0, head: 0, handF: hand('yel', 'F', 0.5, -0.7), handB: hand('yel', 'B', -0.5, -0.7), mouth: 'theeth smile', eyes: 'angry' }, 0);
  move('yel', LAND, { y: GROUND }, 'in2');
  CLIP.push({ who: 'yel', f0: BIGO, f1: LAND, keep: [-600, BY, 2600, 2000] });
  A.f1 = LAND - 4;
  sfx('grow', BIGO, { who: 'yel', gain: 0.9 }); sfx('powerup', BIGO, { who: 'yel', dur: 10, gain: 0.7 });
  ev('twinkle', { f: BIGO + 2, at: [AX, BY + 60], n: 20, size: 60 });
  key('yel', LAND, { ...stance('yel', YX, 1), hip: [0, toRig('yel', 70)], sx: 1.08, sy: 0.92 }, 1);
  key('yel', LAND + 8, { ...stance('yel', YX, 1), sx: 1, sy: 1, mouth: 'theeth smile', eyes: 'angry' }, 6);
  ev('dust', { f: LAND, x: YX, r: 70, n: 8, snd: 'slam', gain: 0.9 });
  ev('shake', { f: LAND, amp: 18, n: 12 });
  key('skel', LAND - 2, { mouth: 'puzzlement', eyes: 'sad', lean: 0 }, 0);
  love('skel', LAND + 4, LAND + 44);

  // ---- 9.6–12.6 с: снимает небесный портал, кидает тарелкой под ноги Скелету — он падает с неба позади неё
  const GR = LAND + 10, TH = GR + 12, LB = TH + 12;
  key('yel', GR - 4, { hitF: 1, hitFto: [AX, BY + 30], hitFfix: GR, lean: -4 }, 4);
  B.keys.push({ f: GR - 4, x: AX, y: BY }, { f: GR, hand: 'yel' });
  sfx('pop', GR, { who: 'yel', gain: 0.6 });
  key('yel', TH - 5, { hitF: 0, handF: hand('yel', 'F', -0.5, -0.3), lean: -8 }, 5);
  key('yel', TH, { handF: hand('yel', 'F', 0.95, 0.1), lean: 14 }, 3, 'in2');
  key('yel', TH + 10, { ...stance('yel', YX, 1), mouth: 'happy with theeth', eyes: 'angry' }, 8);
  sfx('swing', TH - 2, { who: 'yel', gain: 0.9 });
  B.keys.push({ f: TH, hand: 'yel' }, { f: LB, x: SX, y: AY, ease: 'lin', arc: 120 });
  sfx('whoosh', TH, { x: 1200, dur: 12, gain: 0.6 });
  openSnd(LB, SX);
  // портал в небе позади неё
  const A2X = 470, A2 = { f0: TH + 4, f1: 0, size: FLOOR, keys: [{ f: 0, x: A2X, y: BY }], seed: 7 };
  PORT.push(A2);
  openSnd(TH + 4, A2X);
  key('yel', TH + 2, { handB: hand('yel', 'B', -0.5, -0.8) }, 3);
  ev('twinkle', { f: TH + 4, at: [A2X, BY + 40], n: 16, size: 50 });
  // проваливается
  const D0 = LB + 2, D1 = D0 + 12;
  key('skel', D0, { legFfk: 1, legBfk: 1, legF: [-20, 30], legB: [20, -30], handF: hand('skel', 'F', 0.4, -0.9), handB: hand('skel', 'B', -0.4, -0.9), mouth: 'puzzlement', eyes: 'sad', b_B16: -40, b_B17: 40 }, 3);
  move('skel', D0, { x: SX, y: GROUND });
  move('skel', D1, { y: GROUND + 780 }, 'in2');
  CLIP.push({ who: 'skel', f0: D0, f1: D1 + 2, keep: [-600, -600, 2600, GROUND] });
  sfx('scared', D0, { who: 'skel', gain: 0.9 }); sfx('whoosh', D0, { who: 'skel', dur: 12, gain: 0.6 });
  turn('yel', D0 + 4, -1, YX);
  const E0 = D1 + 2, CR = E0 + 12;
  key('skel', E0, { x: A2X, y: BY, face: 1 }, 0);
  move('skel', CR, { y: GROUND }, 'in2');
  CLIP.push({ who: 'skel', f0: E0, f1: CR, keep: [-600, BY, 2600, 2000] });
  sfx('zap', E0, { x: A2X, gain: 0.6 }); sfx('whoosh', E0, { x: A2X, dur: 12, gain: 0.6 });
  key('skel', CR, { ...stance('skel', A2X, 1), hip: [0, toRig('skel', 140)], lean: 10, head: 10, legFfk: 0, legBfk: 0, b_B16: 0, b_B17: 0, mouth: 'puzzlement', eyes: 'sad',
    handF: hand('skel', 'F', 0.3, 0.5), handB: hand('skel', 'B', -0.3, 0.5) }, 1);
  sfx('slam', CR, { who: 'skel', gain: 1.0 }); sfx('ref:hit-ow', CR + 2, { who: 'skel', gain: 0.8 });
  ev('dust', { f: CR, x: A2X, r: 70, n: 8 });
  ev('shake', { f: CR, amp: 20, n: 12 });
  ev('stars', { who: 'skel', f0: CR + 2, f1: CR + 26 });
  A2.f1 = CR + 4; B.f1 = CR + 6;
  sfx('pop', CR + 4, { x: A2X, gain: 0.5 }); sfx('pop', CR + 6, { x: SX, gain: 0.5 });
  const ssm = shrink('skel', CR + 12, A2X, 1, { mouth: 'puzzlement', eyes: 'sad', smoke: 420 });
  key('skel', ssm, { b_B16: 0, b_B17: 0 }, 0);
  key('yel', CR + 4, { mouth: 'happy with theeth', eyes: 'normal' }, 0);
  sfx('ref:laugh', CR + 6, { who: 'yel', gain: 0.85, pitch: 1.45 });
  chuckle('yel', CR + 6, CR + 28, { mouth: 'happy with theeth' });

  // ---- 12.7–17.4 с: Скелет «растёт» снова, пикирует — она ставит портал: влетает — вылетает за край
  // шарик-Скелет злится, скачет к ней — она щелчком отправляет его кувырком обратно
  const SX2 = 440, HP0 = ssm + 10, FL = HP0 + 14;
  key('skel', ssm + 8, { eyes: 'angry', mouth: 'angry theeth' }, 0);
  ev('steam', { who: 'skel', f0: ssm + 8, f1: HP0 + 10 });
  hopTo('skel', HP0, HP0 + 10, A2X, GROUND, 760, GROUND, 110);
  key('yel', FL - 6, { lean: 18, hip: [0, toRig('yel', 120)], head: 8, mouth: 'theeth smile', eyes: 'angry' }, 6);
  key('yel', FL, { hitF: 1, hitFto: (() => { const b = target('skel:body', stateAt(FL)); return [b[0] + 60, b[1]]; })(), hitFfix: FL }, 3, 'in2');
  key('yel', FL + 10, { ...stance('yel', YX, -1), hitF: 0, mouth: 'happy with theeth', eyes: 'normal' }, 8);
  sfx('flick', FL, { who: 'skel', gain: 1.0 }); sfx('bonk', FL, { who: 'skel', gain: 0.6 });
  key('skel', FL, { mouth: 'puzzlement', eyes: 'sad' }, 0);
  ST.tumble('skel', FL, FL + 14, 760, A2X, 130, -1.5, { stars: 14 });
  key('skel', FL + 18, { eyes: 'angry', mouth: 'angry theeth' }, 0);
  ev('vein', { who: 'skel', f0: FL + 18, f1: FL + 28 });
  const SB2 = transform('skel', FL + 20, A2X, SX2, 1, { style: 'grow' });
  key('skel', SB2, stance('skel', SX2, 1), 0);
  key('skel', SB2 + 4, { mouth: 'angry theeth', eyes: 'angry' }, 0);
  key('yel', SB2 - 2, { mouth: 'puzzlement', eyes: 'sad' }, 0);
  const KS = C.skel.big, UP = SB2 + 6, DV0 = UP + 14, DV1 = DV0 + 8, DV2 = DV1 + 10;
  flap(UP, DV1, 0.9);
  key('skel', UP, { pivot: (KS.anchor[1] - KS.top) / 2, legFfk: 1, legBfk: 1, legF: [-10, 30], legB: [10, -20] }, 3);
  move('skel', UP, { x: SX2, y: GROUND, rot: 0 });
  move('skel', DV0, { x: SX2 - 40, y: GROUND - 60, rot: 70 }, 'out2');
  // она ставит портал между ними и второй — у правого края
  const BX2 = 760, EX = 1840, CY = GROUND - 400;
  const PB2 = { f0: UP + 6, f1: DV1 + 10, size: WALL, keys: [{ f: 0, x: BX2, y: CY }], seed: 9, wall: true };
  const PA2 = { f0: UP + 8, f1: DV2 + 8, size: WALL, keys: [{ f: 0, x: EX, y: CY }], seed: 11, wall: true };
  PORT.push(PB2, PA2);
  key('yel', UP + 2, { handF: hand('yel', 'F', 0.9, -0.3), mouth: 'theeth smile', eyes: 'angry' }, 4);
  openSnd(UP + 6, BX2); openSnd(UP + 8, EX);
  ev('twinkle', { f: UP + 6, at: [BX2, CY - 200], n: 16, size: 50 });
  // пике: голова (вправо) входит в портал на x = BX2, выходит у правого края
  const half = 0.47 * 730 * Math.sin(E.rad(70));
  key('skel', DV0, { mouth: 'angry theeth', eyes: 'angry', handF: hand('skel', 'F', 0.95, 0.1), handB: hand('skel', 'B', 0.9, 0.2) }, 3);
  move('skel', DV0, { x: BX2 - half - 60, y: GROUND - 20, rot: 70 });
  move('skel', DV1 - 1, { x: BX2 + half + 20, y: GROUND - 20 }, 'in');
  CLIP.push({ who: 'skel', f0: DV0, f1: DV1, keep: [-600, -600, BX2, 2000] });
  key('skel', DV1, { x: EX - half - 20 }, 0);
  move('skel', DV2, { x: 2500, y: GROUND - 120 }, 'out');
  key('skel', DV1, { mouth: 'puzzlement', eyes: 'sad' }, 0);
  CLIP.push({ who: 'skel', f0: DV1, f1: DV2 + 1, keep: [EX, -600, 2600, 2000] });
  sfx('whoosh', DV0, { who: 'skel', dur: 8, gain: 0.8 }); sfx('zap', DV0 + 3, { x: BX2, gain: 0.7 });
  sfx('zap', DV1, { x: EX, gain: 0.7 }); sfx('scared', DV1, { x: EX, gain: 0.8 });
  ev('twinkle', { f: DV2 - 2, at: [1860, CY - 150], n: 22, size: 60 });
  key('skel', DV2 + 1, { alpha: 0 }, 0);
  sfx('ref:laugh', DV1 + 4, { who: 'yel', gain: 0.85, pitch: 1.45 });
  chuckle('yel', DV1 + 4, DV1 + 30, { mouth: 'happy with theeth' });

  // ---- 17.4–22 с: в центр, руки вверх
  const WIN = victory('yel', DV1 + 32, YX, { face: 1 });
  window.T = { BONK, SB, SH1, L0, BIGO, LAND, LB, CR, ssm, SB2, DV0, DV1, WIN };
};

// ------------------------------------------------------------------ рисование
const drawPortals = (ctx, f, S, wall) => {
  for (const Pt of PORT) {
    if (!!Pt.wall !== wall || f < Pt.f0 || (Pt.f1 && f >= Pt.f1 + 8)) continue;
    const k = Math.min(1, (f - Pt.f0) / 8) * (Pt.f1 && f >= Pt.f1 ? 1 - (f - Pt.f1) / 8 : 1);
    const p = portalAt(Pt, f, S);
    FX.portal(ctx, p[0], p[1], Pt.size[0], Pt.size[1], f / FPS, E.EASE.out(E.clamp(k, 0, 1)), Pt.seed);
  }
};
ST.hooks.beforeChars.push((ctx, f, S, CAM) => { ctx.setTransform(...CAM); drawPortals(ctx, f, S, false); });
ST.hooks.afterChars.push((ctx, f, S, CAM) => { ctx.setTransform(...CAM); drawPortals(ctx, f, S, true); });

ST.start(BIG);
