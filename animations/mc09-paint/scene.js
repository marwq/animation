// Ролик 09 (серия по образцу): Краска — Радужный против Жёлтой, 25 с, 24 кадра/с. Плотно, как у HugyTi:
// много событий подряд, магия кистью, превращения туда и обратно. Музыка превращения — присланная, в обычном
// темпе, ~4 с с плавным затиханием. Фон «майнкрафт», тема «берёзы».
//
//   0–1.8 с   радужный шарик-Скелет (слева, рядом ведро красной краски) и шарик-Жёлтая (справа)
//   1.8–3.7 с Радужный прыгает на край ведра — ведро катапультой летит и надевается Жёлтой на голову
//   3.7–4.8 с она сбрасывает ведро и «растёт» под музыку — Радужный влюблён, скачет к ней
//   5.5–8 с   она поднимает огромную кисть и рисует ему чёрные усы — смеётся
//   8–9.3 с   Радужный «растёт» под музыку
//   9.5–12.5 с выхватывает кисть и красит её — Жёлтая становится радужной, смотрит на руки
//   12.5–14.5 с отбирает кисть и рисует на траве дыру — Радужный шагает и проваливается
//   14.5–18.5 с рисует дыру в небе — он падает оттуда обратно в яму, снова и снова; она стирает яму —
//             он шлёпается на траву на спину
//   19–21.5 с он сжимается в шарик; она перекрашивает его в серый — он плачет и укатывается
//   21.5–25 с Жёлтая стряхивает радугу и в центре поднимает руки
'use strict';

const ST = Stage({
  name: 'mc09-paint',
  cast: {
    rb: { small: ['skeleton-verity-small', { scale: 0.455, recolor: 'rainbow' }], big: ['all-verity-color', { height: 730 }],
      alt: { grey: ['skeleton-verity-small', { scale: 0.455 }] },
      pivot: 325, voice: 0.85, lie: 55, color: '#ff7a3a', moods: { angry: 'angry theeth', grin: 'happy with theeth', big: 'theeth smile' } },
    yel: { small: ['girl-verity-small', { bodyHeight: 300, recolor: 'yellow' }],
      big: ['verity-big-girl', { height: 730, splitFeet: true, recolor: 'yellow' }],
      alt: { rainbow: ['verity-big-girl', { height: 730, splitFeet: true, recolor: 'rainbowAll' }] },
      pivot: 337, voice: 1.45, vAngle: 50, color: '#ffe23a', moods: { angry: 'angry theeth', grin: 'theeth smile', big: 'theeth smile' } },
  },
  order: ['rb', 'yel'],
  background: { theme: 'birch', seed: 91, sunX: 420, sunY: 150 },
  clouds: [[90, 70, 2.4, 0, 9], [560, 230, 1.8, 1, 8], [1500, 60, 2.6, 2, 7], [1760, 260, 1.6, 0, 9]],
});
const { FPS, NF, GROUND, C, key, move, ev, sfx, hop, tumble, laugh, tremble, transform, shrink, love, stance, walk, turn,
  fallBack, dodge, victory, chuckle, hand, toRig, statesAt, stateAt, target } = ST;

// над ртом шарика (середина верхнего края текущего рта)
ST.parts.mlip = (ch, st, p) => {
  const name = ch.layers.some((l) => l.name === p.mouth) ? p.mouth : 'smile normal', l = ch.layers.find((x) => x.name === name);
  return E.apply(ch.eyeMatrix(st, name), [(l.bbox[0] + l.bbox[2]) / 2, l.bbox[1] + (l.bbox[3] - l.bbox[1]) * 0.05]);
};
const P = (v, f, S) => (typeof v === 'function' ? v(f, S) : typeof v === 'string' ? target(v, S) : v);
const dirOf = (r) => [Math.sin(r), -Math.cos(r)];
const rotKeys = (ks) => (f) => {
  if (f <= ks[0][0]) return ks[0][1];
  for (let i = 1; i < ks.length; i++) if (f < ks[i][0]) return E.lerp(ks[i - 1][1], ks[i][1], E.EASE.io((f - ks[i - 1][0]) / (ks[i][0] - ks[i - 1][0])));
  return ks[ks.length - 1][1];
};

// ------------------------------------------------------------------ ведро, кисть, следы краски
const BK = 150, BKH = 96 * BK / 110;                    // ведро: ширина, высота
const BUCKET = [];                                       // {f0, at, rot} | {f0, f1, a, b, arc, r0, r1} | {f0, on, rot}
const bucketAt = (f, S) => {
  let cur = null;
  for (const c of BUCKET) if (f >= c.f0) cur = c;
  if (cur.at) return { x: cur.at[0], y: cur.at[1], rot: cur.rot || 0, full: cur.full };
  if (cur.on) { const t = target(`${cur.on}:top`, S); return { x: t[0], y: t[1] - BKH + 46, rot: Math.PI, full: false }; }
  const u = E.clamp((f - cur.f0) / (cur.f1 - cur.f0), 0, 1), a = P(cur.a, cur.f0, statesAt(cur.f0)), b = P(cur.b, f, S);
  return { x: E.lerp(a[0], b[0], u), y: E.lerp(a[1], b[1], u) - Math.sin(Math.PI * u) * (cur.arc || 0), rot: E.lerp(cur.r0, cur.r1, u), full: cur.full };
};
const BR = 200, TIP = 192;                               // кисть: длина, от кулака до кончика
const BRUSH = [];                                        // {f0, at, rot} | {f0, hand: кто, rot: fn}
const brushAt = (f, S) => {
  let cur = null;
  for (const c of BRUSH) if (f >= c.f0) cur = c;
  if (cur.at) return { x: cur.at[0], y: cur.at[1], rot: cur.rot };
  const h = C[cur.hand].big.point(S[cur.hand].st, 'handB');
  return { x: h[0], y: h[1], rot: cur.rot(f), hand: cur.hand };
};
const gripFor = (tip, r) => { const d = dirOf(r); return [tip[0] - TIP * d[0], tip[1] - TIP * d[1]]; };
const SPLASH = [];                                       // {f, at, cols, size}
const DRIPS = [];                                        // краска на теле: {who, part, f0, f1, s, seed, col, dy}
// мазок кистью: кончик от a до b за n кадров (рука ведёт кисть), наклон r
function stroke(who, f, a, b, r, n = 6, o = {}) {
  key(who, f, { hitB: 1, hitBto: gripFor(a, r), hitBfix: f, ...(o.pose || {}) }, o.lead ?? 4);
  key(who, f + n, { hitB: 1, hitBto: gripFor(b, r), hitBfix: f + n }, n, 'io');
  sfx('brush', f, { who, gain: 0.8 });
}

// ------------------------------------------------------------------ дыры
const HX = 1140, AY = 170, HW = 250;                     // яма в траве и дыра в небе — одна колонка
const GHOLE = { paint: [1e9, 1e9], wipe: [1e9, 1e9] }, AHOLE = { paint: [1e9, 1e9], fade: [1e9, 1e9] };
const CLIP = [];                                         // [f0, f1] — когда Радужный «в дырах»

const RS = 560, YS = 1360, BKX = 880;
// ================================================================== 0–1.8 с: стойка
key('rb', 0, { form: 'small', x: RS, y: GROUND, face: 1, look: 1, eyes: 'normal', mouth: 'smile normal', sx: 1, sy: 1, rot: 0, pivot: 0, skin: '' }, 0);
key('yel', 0, { form: 'small', x: YS, y: GROUND, face: -1, look: 1, eyes: 'normal', mouth: 'smile normal', sx: 1, sy: 1, rot: 0, skin: '' }, 0);
BUCKET.push({ f0: 0, at: [BKX, GROUND + 2], rot: 0, full: true });

const BIG = () => {
  // ---- 1.8–3.7 с: прыжок на край ведра — ведро на голову Жёлтой
  key('rb', 40, { eyes: 'angry', mouth: 'happy with theeth' }, 0);
  sfx('ref:grin-eee', 40, { who: 'rb', gain: 0.5, pitch: 1.2 });
  const J = 44, ON = 56, LAND = 72;
  hop('rb', J, ON, RS, BKX - 120, 150);
  sfx('ref:fwip', J + 2, { who: 'rb', gain: 0.7 });
  BUCKET.push({ f0: ON, f1: LAND, a: [BKX, GROUND + 2], b: (f, S) => { const t = target('yel:top', S); return [t[0], t[1] - BKH + 46]; },
    arc: 360, r0: 0, r1: Math.PI, full: true });
  BUCKET.push({ f0: LAND, on: 'yel' });
  sfx('boing', ON, { x: BKX, gain: 0.8 });
  sfx('whoosh', ON + 1, { x: 1100, dur: 14, gain: 0.5 });
  SPLASH.push({ f: ON + 2, at: [BKX, GROUND - BKH], cols: ['#e8262e'], size: 0.8 });
  hop('rb', ON + 2, ON + 14, BKX - 120, RS, 90);
  // ведро на голове: краска течёт, качается вслепую
  sfx('splash', LAND, { who: 'yel', gain: 1.0 });
  sfx('ref:grunt', LAND + 3, { who: 'yel', gain: 0.6, pitch: 1.4 });
  key('yel', LAND, { sx: 1.3, sy: 0.75, mouth: 'puzzlement', eyes: 'sad' }, 1);
  key('yel', LAND + 5, { sx: 1, sy: 1 }, 4);
  DRIPS.push({ who: 'yel', part: 'body', f0: LAND, f1: 116, s: 200, seed: 3, col: '#e8262e', dy: -20 });
  for (const [f, dx] of [[LAND + 5, -24], [LAND + 10, 18], [LAND + 15, -14]]) {
    move('yel', f, { x: YS + dx }, 'io');
    key('yel', f, { rot: dx > 0 ? 8 : -8, pivot: 150 }, 4);
  }
  key('rb', ON + 16, { mouth: 'happy with theeth', eyes: 'normal' }, 0);
  sfx('ref:laugh', ON + 18, { who: 'rb', gain: 0.85, pitch: 1.3 });
  laugh('rb', ON + 18, ON + 36);
  // сбрасывает ведро — и «растёт»
  const OFF = LAND + 16;
  key('yel', OFF, { rot: 0, sx: 0.85, sy: 1.18 }, 3);
  move('yel', OFF, { x: YS });
  BUCKET.push({ f0: OFF, f1: OFF + 16, a: (f, S) => { const t = target('yel:top', S); return [t[0], t[1] - BKH + 46]; }, b: [1720, GROUND + 2 - BKH],
    arc: 220, r0: Math.PI, r1: Math.PI * 3, full: false });
  BUCKET.push({ f0: OFF + 16, at: [1720, GROUND + 2 - BKH], rot: Math.PI * 3, full: false });   // вверх дном на траве, пустое
  sfx('pop', OFF, { who: 'yel', gain: 0.8 });
  sfx('land', OFF + 16, { x: 1720, gain: 0.6 });
  const YX = 1420;
  const YB = transform('yel', OFF + 2, YS, YX, -1, { style: 'grow', love: 'rb', loveDur: 70 });
  key('yel', YB, { ...stance('yel', YX, -1), rot: 0 }, 0);
  key('yel', YB + 6, { mouth: 'theeth smile', eyes: 'normal' }, 0);
  // влюблённый Радужный скачет к ней
  const R1 = 820, R2 = 1040;
  hop('rb', YB + 2, YB + 14, RS, R1, 70);
  hop('rb', YB + 18, YB + 30, R1, R2, 70);

  // ---- 5.5–8 с: кисть с травы — усы ему
  BRUSH.push({ f0: 0, at: [YX - 200, GROUND - 14], rot: -Math.PI / 2 });
  const PICK = YB + 16;
  key('yel', PICK - 8, { lean: 26, hip: [0, toRig('yel', 120)], head: 10 }, 8);
  key('yel', PICK, { hitB: 1, hitBto: [YX - 200, GROUND - 20], hitBfix: PICK }, 6);
  const R_M = -Math.PI * 0.62;                                        // кисть влево-вниз — к его лицу
  BRUSH.push({ f0: PICK, hand: 'yel', rot: rotKeys([[PICK, -Math.PI / 2], [PICK + 12, -0.35], [YB + 34, -0.35], [YB + 39, R_M]]) });
  sfx('pop', PICK, { who: 'yel', gain: 0.4 });
  key('yel', PICK + 12, { ...stance('yel', YX, -1), hitB: 0, handB: hand('yel', 'B', 0.4, -0.3), mouth: 'happy with theeth' }, 10);
  const lip = (f) => { const p = target('rb:mlip', stateAt(f)); return [p[0], p[1] - 4]; };
  const M0 = YB + 40, m = lip(M0);
  key('yel', M0 - 6, { lean: 14, hip: [0, toRig('yel', 60)], head: 6 }, 6);
  stroke('yel', M0, [m[0], m[1]], [m[0] - 44, m[1] + 4], R_M, 5);
  stroke('yel', M0 + 9, [m[0], m[1]], [m[0] + 44, m[1] + 4], R_M, 5, { lead: 3 });
  stroke('yel', M0 + 18, [m[0] - 48, m[1]], [m[0] + 48, m[1]], R_M, 6, { lead: 3 });
  MUST.f = [M0, M0 + 9, M0 + 18, M0 + 24];
  key('rb', M0 - 4, { mouth: 'puzzlement', eyes: 'normal' }, 0);
  key('yel', M0 + 30, { ...stance('yel', YX, -1), hitB: 0, handB: hand('yel', 'B', 0.4, -0.3), lean: 0, head: 0, mouth: 'happy with theeth' }, 8);
  sfx('ref:laugh', M0 + 30, { who: 'yel', gain: 0.85, pitch: 1.45 });
  chuckle('yel', M0 + 30, M0 + 52, { mouth: 'happy with theeth' });
  key('rb', M0 + 32, { eyes: 'sad' }, 0);
  // ---- 8–9.3 с: Радужный «растёт» — усы слетают
  const RX = 960;
  ev('vein', { who: 'rb', f0: M0 + 32, f1: M0 + 42 });
  const RB = transform('rb', M0 + 36, R2, RX, 1, { style: 'grow' });
  MUST.end = RB;
  key('rb', RB, stance('rb', RX, 1), 0);
  key('rb', RB + 6, { mouth: 'angry theeth', eyes: 'angry' }, 0);
  key('yel', RB - 2, { mouth: 'puzzlement', eyes: 'sad' }, 0);
  ev('sweat', { who: 'yel', f0: RB, f1: RB + 22 });

  // ---- 9.5–12.5 с: выхватывает кисть и красит её в радугу
  const RX1 = 1090;
  walk('rb', RB + 6, RX, RX1, 1, 9, 1);
  const SN = RB + 16;
  const yh = C.yel.big.point(stateAt(SN).yel.st, 'handB');
  key('rb', SN - 4, { handB: hand('rb', 'B', 0.6, -0.2) }, 4);
  key('rb', SN, { hitB: 1, hitBto: yh, hitBfix: SN }, 4, 'in2');
  BRUSH.push({ f0: SN, hand: 'rb', rot: rotKeys([[SN, -0.35], [SN + 8, 0.4], [SN + 16, 1.45]]) });
  sfx('whoosh', SN, { who: 'rb', dur: 6, gain: 0.5 });
  key('yel', SN + 1, { handB: hand('yel', 'B', 0.5, 0.2), mouth: 'puzzlement' }, 3);
  key('rb', SN + 10, { hitB: 0, handB: hand('rb', 'B', 0.3, -0.4), mouth: 'happy with theeth' }, 6);
  const P1 = SN + 16, body = target('yel:body', stateAt(P1));
  stroke('rb', P1, [body[0] - 30, body[1] - 120], [body[0] - 30, body[1] + 60], 1.45, 6);
  stroke('rb', P1 + 10, [body[0] - 20, body[1] + 40], [body[0] - 20, body[1] - 140], 1.45, 6, { lead: 3 });
  const RAIN = P1 + 13;
  key('yel', RAIN, { skin: 'rainbow' }, 0);
  SPLASH.push({ f: RAIN, at: [body[0] - 20, body[1] - 40], cols: ['#ff2a3a', '#ffb000', '#ffe500', '#2ed14a', '#2aa0ff', '#8a4dff'], size: 1.4 });
  sfx('splash', RAIN, { who: 'yel', gain: 0.9 });
  sfx('sparkle', RAIN + 2, { who: 'yel', gain: 0.6 });
  key('rb', P1 + 22, { hitB: 0, handB: hand('rb', 'B', 0.3, -0.4) }, 6);
  // смотрит на руки — в ужасе
  key('yel', RAIN + 4, { handF: hand('yel', 'F', 0.7, -0.35), handB: hand('yel', 'B', 0.7, -0.25), head: 10, mouth: 'puzzlement', eyes: 'sad' }, 6);
  sfx('scared', RAIN + 6, { who: 'yel', gain: 0.8 });
  key('rb', RAIN + 4, { mouth: 'happy with theeth', eyes: 'normal' }, 0);
  sfx('ref:laugh', RAIN + 6, { who: 'rb', gain: 0.85, pitch: 1.0 });
  chuckle('rb', RAIN + 6, RAIN + 28, { mouth: 'happy with theeth' });

  // ---- 12.5–14.5 с: отбирает кисть — яма в траве
  const MAD = RAIN + 18;
  key('yel', MAD, { ...stance('yel', YX, -1), head: 0, mouth: 'angry theeth', eyes: 'angry' }, 6);
  ev('vein', { who: 'yel', f0: MAD, f1: MAD + 16 });
  sfx('anger', MAD, { who: 'yel', dur: 14, gain: 0.6 });
  const SB = MAD + 14;
  const rh = C.rb.big.point(stateAt(SB).rb.st, 'handB');
  key('yel', SB - 4, { handB: hand('yel', 'B', 0.6, -0.2) }, 4);
  key('yel', SB, { hitB: 1, hitBto: rh, hitBfix: SB }, 4, 'in2');
  const R_G = -Math.PI * 0.86;                                        // кисть вниз-влево — к траве
  BRUSH.push({ f0: SB, hand: 'yel', rot: rotKeys([[SB, 1.45], [SB + 10, -0.35], [SB + 16, R_G]]) });
  key('rb', SB + 1, { handB: hand('rb', 'B', 0.2, 0.4), mouth: 'puzzlement' }, 3);
  sfx('whoosh', SB, { who: 'yel', dur: 6, gain: 0.5 });
  const RX2 = 880;
  dodge('rb', SB + 4, RX1, RX2, 1, { h: 40 });                       // отпрыгнул от кисти
  const YX1 = 1330;
  key('yel', SB + 10, { hitB: 0, handB: hand('yel', 'B', 0.4, -0.3) }, 6);
  walk('yel', SB + 10, YX, YX1, 1, 9, -1, false);
  const G0 = SB + 30;                                                 // после шага (у walk свой ключ таза)
  key('yel', G0 - 6, { lean: 30, hip: [0, toRig('yel', 170)], head: 10 }, 6);
  stroke('yel', G0, [HX + HW / 2 - 20, GROUND - 4], [HX - HW / 2 + 40, GROUND - 4], R_G, 10);
  stroke('yel', G0 + 12, [HX - HW / 2 + 50, GROUND + 6], [HX + HW / 2 - 30, GROUND + 6], R_G, 8, { lead: 2 });
  GHOLE.paint = [G0, G0 + 20];
  key('yel', G0 + 24, { ...stance('yel', YX1, -1), hitB: 0, handB: hand('yel', 'B', 0.4, -0.3), lean: 0, head: 0, mouth: 'theeth smile' }, 8);
  // он смеётся, шагает — и проваливается
  key('rb', G0 + 4, { mouth: 'happy with theeth', eyes: 'normal' }, 0);
  chuckle('rb', G0 + 4, G0 + 20, { mouth: 'happy with theeth' });
  const STEP = G0 + 22, DROP = STEP + 16;
  walk('rb', STEP, RX2, HX, 2, 8, 1);
  key('rb', STEP, { handF: hand('rb', 'F', 0.8, -0.3), mouth: 'happy - spittle' }, 6);   // тянется к кисти
  const flail = { legFfk: 1, legBfk: 1, legF: [-8, 12], legB: [10, -8], handF: hand('rb', 'F', 0.25, -0.95), handB: hand('rb', 'B', -0.25, -0.95),
    mouth: 'puzzlement', eyes: 'sad', lean: 0, head: -6, hip: [0, 0] };
  key('rb', DROP, flail, 2);
  move('rb', DROP, { x: HX, y: GROUND });
  move('rb', DROP + 10, { y: GROUND + 820 }, 'in2');
  CLIP.push([DROP, 9999]);
  sfx('fallhole', DROP, { x: HX, gain: 0.9 });
  sfx('scared', DROP + 1, { who: 'rb', gain: 0.8 });

  // ---- 14.5–18.5 с: дыра в небе — падает по кругу
  const A0 = DROP + 12, R_A = -0.55;
  key('yel', A0 - 4, { lean: -6, head: -12 }, 4);
  stroke('yel', A0, [HX + HW / 2 - 10, AY], [HX - HW / 2 + 40, AY], R_A, 8);
  stroke('yel', A0 + 10, [HX - HW / 2 + 50, AY + 8], [HX + HW / 2 - 20, AY + 8], R_A, 6, { lead: 2 });
  AHOLE.paint = [A0, A0 + 16];
  key('yel', A0 + 20, { ...stance('yel', YX1, -1), hitB: 0, handB: hand('yel', 'B', 0.4, -0.3), lean: 0, head: 0, mouth: 'happy with theeth' }, 8);
  const loop = (f, n = 14) => {
    move('rb', f, { x: HX, y: AY });
    move('rb', f + n, { y: GROUND + 820 }, 'in');
    sfx('whoosh', f + 2, { who: 'rb', dur: n - 2, gain: 0.6 });
    sfx('fallhole', f + n - 8, { x: HX, gain: 0.5 });
    return f + n;
  };
  const L1 = A0 + 18;
  move('rb', L1 - 1, { x: HX, y: GROUND + 820 });
  const e1 = loop(L1);
  sfx('ref:laugh', L1 + 4, { who: 'yel', gain: 0.85, pitch: 1.45 });
  chuckle('yel', L1 + 4, L1 + 40, { mouth: 'happy with theeth' });
  const e2 = loop(e1 + 4);
  // стирает яму — он шлёпается на траву
  const W0 = e2 + 2;
  key('yel', W0 - 4, { lean: 34, hip: [0, toRig('yel', 190)], head: 10, mouth: 'theeth smile' }, 6);
  stroke('yel', W0, [HX - HW / 2 + 50, GROUND - 4], [HX + HW / 2 - 20, GROUND - 4], R_G, 8);
  GHOLE.wipe = [W0, W0 + 10];
  key('yel', W0 + 14, { ...stance('yel', YX1, -1), hitB: 0, handB: hand('yel', 'B', 0.4, -0.3), lean: 0, head: 0 }, 8);
  const F3 = W0 + 12, SLAM = F3 + 12;
  move('rb', F3 - 1, { x: HX, y: GROUND + 820 });
  move('rb', F3, { x: HX, y: AY });
  move('rb', SLAM, { y: GROUND }, 'in');
  CLIP[0][1] = SLAM;
  AHOLE.fade = [SLAM, SLAM + 16];
  sfx('whoosh', F3 + 2, { who: 'rb', dur: 10, gain: 0.6 });
  ev('dust', { f: SLAM, x: HX, r: 70, n: 8, snd: 'slam' });
  ev('shake', { f: SLAM, amp: 20, n: 14 });
  sfx('ref:hit-ow', SLAM + 2, { who: 'rb', gain: 0.8, pitch: 0.85 });
  const down = fallBack('rb', SLAM + 1, HX, 1, { n: 12, stars: 40 });

  // ---- 19–21.5 с: сжимается в шарик — его перекрашивают в серый
  const SH = down + 8, SMX = HX - 140;
  key('rb', SH, { rot: -90 }, 0);
  const sm = shrink('rb', SH, SMX, 1, { mouth: 'puzzlement', eyes: 'sad' });
  key('rb', sm, { legFfk: 0, legBfk: 0 }, 0);
  ev('stars', { who: 'rb', f0: sm + 4, f1: sm + 26, snd: false });
  const YX2 = 1280;
  walk('yel', SH + 4, YX1, YX2, 1, 9, -1);
  const G1 = sm + 10, gb = target('rb:body', stateAt(G1));
  key('yel', G1 - 6, { lean: 22, hip: [0, toRig('yel', 120)], head: 8, mouth: 'happy with theeth' }, 6);
  stroke('yel', G1, [gb[0] + 60, gb[1] - 80], [gb[0] + 60, gb[1] + 60], R_G, 5);
  stroke('yel', G1 + 8, [gb[0] - 20, gb[1] + 60], [gb[0] - 20, gb[1] - 80], R_G, 5, { lead: 2 });
  const GREY = G1 + 11;
  key('rb', GREY, { skin: 'grey' }, 0);
  SPLASH.push({ f: GREY, at: gb, cols: ['#9aa0a8', '#c4c9cf', '#6d737b'], size: 1.1 });
  sfx('splash', GREY, { who: 'rb', gain: 0.8 });
  key('yel', G1 + 18, { ...stance('yel', YX2, -1), hitB: 0, handB: hand('yel', 'B', 0.4, -0.3), lean: 0, head: 0 }, 8);
  // смотрит на себя — плачет — укатывается
  key('rb', GREY + 4, { mouth: 'sad', eyes: 'sad' }, 0);
  ev('tears', { who: 'rb', f0: GREY + 6, f1: GREY + 40 });
  hop('rb', GREY + 22, GREY + 32, SMX, SMX - 260, 60);
  tumble('rb', GREY + 34, GREY + 56, SMX - 260, -340, 140, -2, {});
  // стряхивает радугу — и в центре
  const SHAKE = GREY + 18;
  for (let i = 0; i < 5; i++) key('yel', SHAKE + i * 2, { rot: i % 2 ? -5 : 5, pivot: 300 }, 2, 'lin');
  key('yel', SHAKE + 10, { rot: 0 }, 2);
  key('yel', SHAKE + 6, { skin: '' }, 0);
  SPLASH.push({ f: SHAKE + 6, at: target('yel:body', stateAt(SHAKE + 6)), cols: ['#ff2a3a', '#ffb000', '#ffe500', '#2ed14a', '#2aa0ff', '#8a4dff'], size: 1.6 });
  sfx('splash', SHAKE + 6, { who: 'yel', gain: 0.7 });
  key('yel', SHAKE + 12, { mouth: 'happy with theeth', eyes: 'normal' }, 0);
  BRUSH.push({ f0: SHAKE + 12, f1: 0, at: null });
  victory('yel', SHAKE + 14, YX2, { n: 9, stride: 130 });
  window.T = { YB, M0, RB, RAIN, G0, DROP, L1, SLAM, sm, GREY, SHAKE };
};
const MUST = { f: [1e9, 1e9, 1e9, 1e9], end: 1e9 };

// Радужный «в дырах»: прячем часть ниже травы в колонке ямы и выше дыры в небе
ST.hooks.clip = (ctx, who, f, S) => {
  if (who !== 'rb' || !CLIP.some(([a, b]) => f >= a && f < b)) return false;
  ctx.beginPath();
  ctx.rect(-500, -500, 2920, 2080);
  ctx.rect(HX - HW / 2 - 40, GROUND, HW + 80, 1500);
  if (f >= AHOLE.paint[0]) ctx.rect(HX - HW / 2 - 40, -1500, HW + 80, 1500 + AY);
  return true;
};

ST.hooks.beforeChars.push((ctx, f, S, CAM) => {
  ctx.setTransform(...CAM);
  const gu = f < GHOLE.paint[0] ? 0 : f < GHOLE.wipe[0] ? Math.min(1, (f - GHOLE.paint[0]) / (GHOLE.paint[1] - GHOLE.paint[0]))
    : Math.max(0, 1 - (f - GHOLE.wipe[0]) / (GHOLE.wipe[1] - GHOLE.wipe[0]));
  if (gu > 0) FX.paintHole(ctx, HX, GROUND - 2, HW * (f >= GHOLE.wipe[0] ? gu : 1), f >= GHOLE.wipe[0] ? 1 : gu, 4);
  const au = f < AHOLE.paint[0] ? 0 : Math.min(1, (f - AHOLE.paint[0]) / (AHOLE.paint[1] - AHOLE.paint[0])) * (f >= AHOLE.fade[0] ? Math.max(0, 1 - (f - AHOLE.fade[0]) / 16) : 1);
  if (au > 0) { ctx.globalAlpha = f >= AHOLE.fade[0] ? au : 1; FX.paintHole(ctx, HX, AY, HW, f >= AHOLE.fade[0] ? 1 : au, 7); ctx.globalAlpha = 1; }
  const b = bucketAt(f, S);
  if (!BUCKET.filter((c) => f >= c.f0).pop().on && b.y > GROUND - 10) FX.paintBucket(ctx, b.x, b.y, BK, b.rot, '#e8262e', b.full !== false && f < 60);
});
ST.hooks.afterChars.push((ctx, f, S, CAM) => {
  ctx.setTransform(...CAM);
  // передний край ямы и низ дыры в небе — поверх Радужного, пока он в них
  if (CLIP.some(([a, b]) => f >= a && f < b)) {
    if (f < GHOLE.wipe[0] + 6) { ctx.save(); ctx.beginPath(); ctx.rect(HX - HW, GROUND - 2, HW * 2, 100); ctx.clip(); FX.paintHole(ctx, HX, GROUND - 2, HW, 1, 4); ctx.restore(); }
    if (f >= AHOLE.paint[1]) { ctx.save(); ctx.beginPath(); ctx.rect(HX - HW, AY - 100, HW * 2, 100); ctx.clip(); FX.paintHole(ctx, HX, AY, HW, 1, 7); ctx.restore(); }
  }
  for (const d of DRIPS) {
    if (f < d.f0 || f > d.f1) continue;
    const p = target(`${d.who}:${d.part}`, S);
    FX.gumSplat(ctx, p[0], p[1] + d.dy, d.s * Math.min(1, (f - d.f0 + 2) / 4), d.seed, d.col, '#5a0a0a');
  }
  // усы на шарике
  if (f >= MUST.f[0] && f < MUST.end) {
    const part = f < MUST.f[1] ? (f - MUST.f[0]) / 5 : f < MUST.f[2] ? 1 + (f - MUST.f[1]) / 5 : 2 + Math.min(1, (f - MUST.f[2]) / 6);
    const p = target('rb:mlip', S);
    FX.mustache(ctx, p[0], p[1] - 4, 120, Math.min(3, part), S.rb.p.face || 1);
  }
  const b = bucketAt(f, S);
  const onHead = BUCKET.filter((c) => f >= c.f0).pop().on;
  if (onHead || b.y <= GROUND - 10) FX.paintBucket(ctx, b.x, b.y, BK, b.rot, '#e8262e', b.full !== false && !onHead);
  const br = BRUSH.filter((c) => f >= c.f0).pop();
  if (br && (br.at || br.hand)) {
    const q = brushAt(f, S);
    ctx.setTransform(...CAM);
    FX.paintBrush(ctx, q.x, q.y, BR, q.rot, f >= MUST.f[0] && f < (window.T ? window.T.RAIN : 1e9) ? '#151515' : '#ff3a8a');
    if (q.hand) { const { ch, st, p } = S[q.hand]; ((p.skin && C[q.hand].alt && C[q.hand].alt[p.skin]) || ch).draw(ctx, { ...st, p: { ...p, only: 'B' } }, CAM); }
  }
  ctx.setTransform(...CAM);
  for (const s of SPLASH) FX.paintSplash(ctx, ...P(s.at, s.f, statesAt(s.f)), (f - s.f) / 18, s.cols, s.size, s.f);
});

ST.start(BIG);
