// Ролик 13 (серия по образцу): Мороженое — Розовая против Жёлтой, 25 с, 24 кадра/с. Плотно, как у HugyTi:
// ледяное дыхание, волшебный рог-рожок, превращения туда и обратно; маленький Лорд в стороне влюбляется
// в каждую, кто становится большой. Музыка превращения — присланная, ~4 с с затиханием. Фон — вишнёвый сад.
//
//   0–1.8 с   шарик-Лорд (зритель, слева), шарик-Розовая, огромный рожок мороженого, шарик-Жёлтая
//   1.8–3.7 с Жёлтая лижет мороженое; Розовая толкает рожок — шарик шоколадного падает Жёлтой на голову, она дрожит
//   3.7–4.9 с Жёлтая «растёт» под музыку — Лорд влюблён
//   5–9 с     она вытаскивает рожок, лижет — и морозным дыханием замораживает Розовую в ледяную глыбу; глыба уезжает
//   9–10.4 с  лёд трескается — Розовая «растёт» прямо в глыбе — Лорд влюблён в неё
//   10.6–13.8 с отнимает рожок и надевает Жёлтой на голову — мороженое течёт по лицу, она шатается вслепую
//   14–16 с   рожок на голове как рог единорога: радужный луч — Розовая сжимается в шарик
//   16.3–17.5 с Розовая «растёт» снова — Лорд опять влюблён
//   18–20.5 с снимает рожок, зачерпывает мороженое с головы Жёлтой, лижет — замораживает её и щелчком
//             отправляет глыбу за кадр
//   20.5–25 с Розовая в центре, руки вверх; Лорд радуется
'use strict';

const ST = Stage({
  name: 'mc13-icecream',
  musicOnce: false,                       // музыка при каждом превращении (как было при рендере)
  cast: {
    lord: { small: ['lord-verity-small', { bodyHeight: 300 }], big: ['lord-verity-big', { height: 730 }], pivot: 337, voice: 1.0, color: '#ffe23a' },
    pink: { small: ['girl-verity-small', { bodyHeight: 300 }], big: ['girl-verity-big', { height: 730, splitFeet: true }],
      pivot: 337, voice: 1.35, vAngle: 50, color: '#ff4fc8', moods: { angry: 'angry theeth', grin: 'theeth smile', big: 'theeth smile' } },
    yel: { small: ['girl-verity-small', { bodyHeight: 300, recolor: 'yellow' }],
      big: ['verity-big-girl', { height: 730, splitFeet: true, recolor: 'yellow' }], pivot: 337, voice: 1.45, vAngle: 50,
      color: '#ffe23a', moods: { angry: 'angry theeth', grin: 'theeth smile', big: 'theeth smile' } },
  },
  order: ['lord', 'pink', 'yel'],
  background: { theme: 'cherry', seed: 131, sunX: 420, sunY: 140 },
  clouds: [[120, 80, 2.4, 0, 12], [700, 200, 1.8, 1, 16], [1180, 60, 2.6, 2, 10], [1660, 250, 1.6, 0, 18], [420, 300, 1.4, 1, 14]],
});
const { FPS, NF, GROUND, C, key, move, ev, sfx, hop, laugh, tremble, transform, shrink, love, stance, walk,
  victory, chuckle, hand, toRig, statesAt, stateAt, target } = ST;

const P = (v, f, S) => (typeof v === 'function' ? v(f, S) : typeof v === 'string' ? target(v, S) : v);
const keyed = (ks, f) => {
  if (typeof ks === 'number') return ks;
  if (f <= ks[0][0]) return ks[0][1];
  for (let i = 1; i < ks.length; i++) {
    if (f < ks[i][0]) { const u = E.EASE.io((f - ks[i - 1][0]) / (ks[i][0] - ks[i - 1][0])); return E.lerp(ks[i - 1][1], ks[i][1], u); }
  }
  return ks[ks.length - 1][1];
};

// ------------------------------------------------------------------ рожок, шарики на голове, лёд, дыхание, луч
const CX = 1060, CS = 150, CH = CS * 1.35;           // рожок: ширина края, высота вафли
const CHOC = '#8a5634', HEADIN = 105;
const CONE = [];                                   // {f0, at, rot} | {f0, f1, a, b, arc, r0, r1} | {f0, hand, k, rot, dy} | {f0, head: 'yel'}
const SCOOPS = [[0, ['#ff9ec7', '#fff3d6', CHOC]]];   // [кадр, шарики]
const CAPS = [];                                   // шарик мороженого на макушке: {who, f0, f1, w, col, drip: [[f, v]]}
const ICE = [];                                    // глыбы: {f0, f1, x: fn|число, w, h, grow: [[f,v]], crack: [[f,v]]}
const FROST = [];                                  // {f0, f1, from, to}
const BEAMS = [];                                  // {f0, f1, from, to}
const BURSTS = [];
function coneAt(f, S) {
  let cur = null;
  for (const c of CONE) if (f >= c.f0) cur = c;
  if (!cur) return null;
  if (cur.at) return { x: cur.at[0], y: cur.at[1], rot: keyed(cur.rot, f) };
  if (cur.hand) {
    const h = C[cur.hand].big.point(S[cur.hand].st, 'hand' + cur.k), r = keyed(cur.rot, f), d = cur.dy === undefined ? CH * 0.45 : keyed(cur.dy, f);
    return { x: h[0] + Math.sin(r) * d, y: h[1] - Math.cos(r) * d, rot: r };
  }
  if (cur.head) { const t = target(`${cur.head}:top`, S); return { x: t[0], y: t[1] + HEADIN, rot: Math.PI }; }   // натянут до глаз
  const u = E.clamp((f - cur.f0) / (cur.f1 - cur.f0), 0, 1), a = P(cur.a, cur.f0, statesAt(cur.f0)), b = P(cur.b, f, S);
  return { x: E.lerp(a[0], b[0], u), y: E.lerp(a[1], b[1], u) - Math.sin(Math.PI * u) * (cur.arc || 0), rot: E.lerp(cur.r0 || 0, cur.r1 || 0, u) };
}
const scoopsAt = (f) => { let s = SCOOPS[0][1]; for (const [g, l] of SCOOPS) if (f >= g) s = l; return s; };
const lips = (who) => (f, S) => target(`${who}:lips`, S);

const LO = 170, PS = 560, YS = 1400;
// ================================================================== 0–1.8 с: стойка
key('lord', 0, { form: 'small', x: LO, y: GROUND, face: 1, look: 1, eyes: 'normal', mouth: 'smile normal', sx: 1, sy: 1, rot: 0, pivot: 0, alpha: 1 }, 0);
key('pink', 0, { form: 'small', x: PS, y: GROUND, face: 1, look: 1, eyes: 'normal', mouth: 'smile normal', sx: 1, sy: 1, rot: 0, pivot: 0, alpha: 1 }, 0);
key('yel', 0, { form: 'small', x: YS, y: GROUND, face: -1, look: 1, eyes: 'normal', mouth: 'smile normal', sx: 1, sy: 1, rot: 0, pivot: 0, alpha: 1 }, 0);

const BIG = () => {
  // ---- 1.8–3.7 с: Жёлтая лижет; Розовая толкает рожок — шоколадный шарик ей на голову
  const Y1 = 1215;
  key('yel', 34, { mouth: 'happy with theeth' }, 0);
  hop('yel', 36, 46, YS, Y1, 70);
  for (const f of [48, 54]) {
    key('yel', f, { mouth: 'happy - spittle', sx: 0.94, sy: 1.06, rot: -6, pivot: 150 }, 2);
    key('yel', f + 3, { sx: 1, sy: 1, rot: 0 }, 3);
    sfx('lick', f, { who: 'yel', gain: 0.8 });
  }
  key('pink', 42, { mouth: 'angry theeth', eyes: 'angry' }, 0);
  const P1 = 905;
  hop('pink', 46, 58, PS, P1, 80);
  const BUMP = 60, P2 = P1 - 40;
  key('pink', BUMP, { sx: 1.25, sy: 0.82 }, 1);
  key('pink', BUMP + 4, { sx: 1, sy: 1 }, 3);
  move('pink', BUMP, { x: P1 });
  move('pink', BUMP + 6, { x: P2 }, 'out2');
  sfx('bonk', BUMP, { x: CX, gain: 0.7 });
  const CY0 = GROUND - CH + 22;
  CONE.push({ f0: 0, at: [CX, CY0], rot: [[BUMP, 0], [BUMP + 4, 0.3], [BUMP + 10, -0.12], [BUMP + 16, 0.05], [BUMP + 22, 0]] });
  // верхний шарик слетает ей на голову
  const LAND = BUMP + 12, ytop = (f, S) => { const t = target('yel:top', S); return [t[0], t[1] + 10]; };
  SCOOPS.push([BUMP + 3, ['#ff9ec7', '#fff3d6']]);
  const flyScoop = { f0: BUMP + 3, f1: LAND, a: [CX + 30, CY0 - CS * 0.5 * (0.55 + 2 * 1.25)], b: ytop };
  CAPS.push({ who: 'yel', f0: BUMP + 3, f1: 0, fly: flyScoop, w: 150, col: CHOC, drip: [[LAND, 0], [LAND + 30, 0.8]] });
  sfx('whoosh', BUMP + 3, { x: CX, dur: 8, gain: 0.5 });
  sfx('squish', LAND, { who: 'yel', gain: 0.9 });
  key('yel', LAND, { sx: 1.25, sy: 0.8, mouth: 'puzzlement', eyes: 'sad' }, 1);
  key('yel', LAND + 4, { sx: 1, sy: 1 }, 3);
  tremble('yel', LAND + 4, LAND + 20, Y1, 4);
  sfx('chatter', LAND + 4, { who: 'yel', dur: 16, gain: 0.7 });
  key('pink', LAND + 2, { mouth: 'happy with theeth', eyes: 'normal' }, 0);
  sfx('ref:laugh', LAND + 3, { who: 'pink', gain: 0.85, pitch: 1.35 });
  laugh('pink', LAND + 3, LAND + 19);
  key('lord', LAND + 4, { mouth: 'happy with theeth' }, 0);
  laugh('lord', LAND + 4, LAND + 18);

  // ---- 3.7–4.9 с: Жёлтая «растёт» — Лорд влюблён
  const YX = 1270, K = C.yel.big;
  key('yel', LAND + 20, { eyes: 'angry', mouth: 'angry theeth' }, 0);
  const YB = transform('yel', LAND + 18, Y1, YX, -1, { style: 'grow', love: 'lord', loveDur: 56 });
  CAPS[0].f1 = YB;
  key('yel', YB, stance('yel', YX, -1), 0);
  key('yel', YB + 6, { mouth: 'theeth smile', eyes: 'normal' }, 0);
  key('pink', YB - 2, { mouth: 'puzzlement', eyes: 'sad' }, 0);
  ev('sweat', { who: 'pink', f0: YB, f1: YB + 20 });
  hop('lord', YB + 8, YB + 16, LO, LO, 40);
  hop('lord', YB + 20, YB + 28, LO, LO, 40);

  // ---- 5–9 с: вытаскивает рожок, лижет — замораживает Розовую
  const PULL = YB + 16;
  key('yel', PULL - 8, { lean: 24, hip: [0, toRig('yel', 100)], head: 8 }, 8);
  key('yel', PULL, { hitF: 1, hitFto: [CX, CY0 + CH * 0.45], hitFfix: PULL }, 6);
  CONE.push({ f0: PULL, hand: 'yel', k: 'F', rot: 0 });
  sfx('pop', PULL, { who: 'yel', gain: 0.6 });
  const LICK = PULL + 14, HOLD = hand('yel', 'F', 0.75, 0.45);
  key('yel', LICK - 4, { ...stance('yel', YX, -1), hitF: 0, handF: hand('yel', 'F', 0.45, 0.55), lean: 10, head: 10, mouth: 'happy - spittle' }, 10);
  for (const f of [LICK + 2, LICK + 9]) { key('yel', f, { head: 18, lean: 13 }, 3); key('yel', f + 4, { head: 8, lean: 9 }, 3); sfx('lick', f, { who: 'yel', gain: 0.8 }); }
  const lp = target('yel:lips', stateAt(LICK + 14));
  ev('twinkle', { f: LICK + 16, at: lp, n: 14, size: 34 });
  sfx('sparkle', LICK + 16, { who: 'yel', gain: 0.7 });
  const FB = LICK + 22, FROZE = FB + 12;
  key('yel', FB - 4, { handF: HOLD, head: -4, lean: -8, mouth: 'puzzlement' }, 6);
  key('yel', FB, { lean: 12, head: 6 }, 4);
  FROST.push({ f0: FB, f1: FB + 16, from: lips('yel'), to: (f, S) => target('pink:body', S) });
  sfx('gust', FB, { who: 'yel', dur: 16, gain: 0.8 });
  key('pink', FB + 4, { mouth: 'puzzlement', eyes: 'sad', sx: 0.94, sy: 1.06 }, 3);
  ICE.push({ f0: FROZE - 6, f1: 0, x: (f, S) => S.pink.p.x, w: 330, h: 350, grow: [[FROZE - 6, 0], [FROZE, 1]], crack: 0, seed: 3 });
  sfx('crunch', FROZE - 4, { who: 'pink', gain: 0.8 });
  sfx('snowhit', FROZE, { who: 'pink', gain: 0.8 });
  key('yel', FROZE + 4, { ...stance('yel', YX, -1), handF: HOLD, mouth: 'happy with theeth', eyes: 'normal' }, 8);
  sfx('ref:laugh', FROZE + 4, { who: 'yel', gain: 0.85, pitch: 1.45 });
  chuckle('yel', FROZE + 4, FROZE + 22, { mouth: 'happy with theeth' });
  // фу! — глыба уезжает влево
  const PUFF = FROZE + 24, PX = 540;
  key('yel', PUFF - 3, { lean: 10, mouth: 'puzzlement' }, 3);
  key('yel', PUFF + 6, { lean: 0, mouth: 'happy with theeth' }, 6);
  FROST.push({ f0: PUFF, f1: PUFF + 7, from: lips('yel'), to: (f, S) => [S.pink.p.x + 170, GROUND - 200] });
  move('pink', PUFF + 2, { x: P2 });
  move('pink', PUFF + 14, { x: PX }, 'out2');
  sfx('slide', PUFF + 2, { who: 'pink', gain: 0.8 });

  // ---- 9–10.4 с: трещины — Розовая «растёт» прямо в глыбе
  const CR = PUFF + 18;
  ICE[0].crack = [[CR, 0], [CR + 10, 1]];
  sfx('ref:crack1', CR, { who: 'pink', gain: 0.8 });
  const PB = transform('pink', CR + 4, PX, PX, 1, { style: 'grow', love: 'lord', loveDur: 50 });
  const SHAT = CR + 12;
  ICE[0].f1 = SHAT;
  BURSTS.push({ f: SHAT, at: [PX, GROUND - 180], seed: 21, cols: ['#bfe8ff', '#e8f8ff', '#8fd0ff'], size: 50, n: 18 });
  sfx('crunch', SHAT, { who: 'pink', gain: 1.0 });
  key('pink', PB, stance('pink', PX, 1), 0);
  key('pink', PB + 6, { mouth: 'angry theeth', eyes: 'angry' }, 0);
  key('yel', PB - 2, { mouth: 'puzzlement', eyes: 'sad' }, 0);
  hop('lord', PB + 8, PB + 16, LO, LO, 40);

  // ---- 10.6–13.8 с: отнимает рожок и бросает — рожок надевается ей на голову
  const PX1 = 800;
  walk('pink', PB + 6, PX, PX1, 3, 8, 1);
  const SN = PB + 34, ch0 = coneAt(SN, stateAt(SN));
  key('pink', SN - 4, { hitF: 1, hitFto: [ch0.x, ch0.y + CH * 0.45], hitFfix: SN }, 4);
  CONE.push({ f0: SN, hand: 'pink', k: 'F', rot: [[SN, 0], [SN + 10, Math.PI]] });
  sfx('whoosh', SN, { who: 'pink', dur: 6, gain: 0.5 });
  key('yel', SN + 1, { handF: hand('yel', 'F', 0.5, 0.1), mouth: 'puzzlement' }, 3);
  key('yel', SN + 8, { handF: stance('yel', YX, -1).handF }, 6);
  key('pink', SN + 6, { hitF: 0, handF: hand('pink', 'F', 0.3, -0.95), mouth: 'happy with theeth' }, 6);
  const THR = SN + 14, SLAM = THR + 10, cth = coneAt(THR, stateAt(THR));
  key('pink', THR, { handF: hand('pink', 'F', 0.95, -0.5), lean: 10 }, 4, 'in2');
  key('pink', THR + 10, { ...stance('pink', PX1, 1), mouth: 'happy with theeth', eyes: 'normal' }, 8);
  sfx('swing', THR - 3, { who: 'pink', gain: 0.8 });
  CONE.push({ f0: THR, f1: SLAM, a: [cth.x, cth.y], b: (f, S) => { const t = target('yel:top', S); return [t[0], t[1] + HEADIN]; }, arc: 140, r0: Math.PI, r1: Math.PI * 3 });
  CONE.push({ f0: SLAM, head: 'yel' });
  CAPS.push({ who: 'yel', f0: SLAM, f1: 0, w: 190, col: '#ff9ec7', drip: [[SLAM, 0.2], [SLAM + 30, 1.0]], dy: HEADIN });
  SCOOPS.push([SLAM, []]);
  sfx('squish', SLAM, { who: 'yel', gain: 1.0 });
  sfx('bonk', SLAM, { who: 'yel', gain: 0.6 });
  key('yel', SLAM, { sx: 1.08, sy: 0.92, mouth: 'puzzlement', eyes: 'sad', head: 6 }, 1);
  key('yel', SLAM + 4, { sx: 1, sy: 1 }, 3);
  sfx('ref:laugh', SLAM + 4, { who: 'pink', gain: 0.85, pitch: 1.35 });
  chuckle('pink', SLAM + 4, SLAM + 28, { mouth: 'happy with theeth' });
  key('lord', SLAM + 6, { mouth: 'happy with theeth', eyes: 'normal' }, 0);
  laugh('lord', SLAM + 6, SLAM + 22);
  // шатается вслепую
  for (let i = 0; i < 3; i++) {
    const f = SLAM + 6 + i * 8, d = i % 2 ? 1 : -1;
    key('yel', f, { lean: 10 * d, handF: hand('yel', 'F', 0.6, -0.3 + 0.2 * d), handB: hand('yel', 'B', -0.4, -0.3 - 0.2 * d) }, 5);
  }
  sfx('ref:grunt', SLAM + 8, { who: 'yel', gain: 0.6, pitch: 1.5 });

  // ---- 14–16 с: рожок как рог единорога — радужный луч, Розовая сжимается
  const HORN = SLAM + 32;
  key('yel', HORN, { ...stance('yel', YX, -1), lean: 0, mouth: 'angry theeth', eyes: 'angry' }, 6);
  ev('vein', { who: 'yel', f0: HORN, f1: HORN + 12 });
  const tip = (f, S) => { const c = coneAt(f, S); return [c.x, c.y - CH]; };
  const tp = tip(HORN + 8, stateAt(HORN + 8));
  ev('twinkle', { f: HORN + 6, at: tp, n: 18, size: 50 });
  sfx('sparkle', HORN + 6, { who: 'yel', gain: 0.8 });
  sfx('powerup', HORN + 4, { who: 'yel', dur: 10, gain: 0.6 });
  const ZAP = HORN + 14;
  key('yel', ZAP - 2, { head: -8, lean: 6 }, 3);
  BEAMS.push({ f0: ZAP, f1: ZAP + 14, from: tip, to: (f, S) => target('pink:body', S) });
  sfx('zap', ZAP, { who: 'pink', gain: 1.0 });
  key('pink', ZAP + 4, { mouth: 'puzzlement', eyes: 'sad', handF: hand('pink', 'F', 0.5, -0.6), handB: hand('pink', 'B', -0.3, -0.7) }, 3);
  tremble('pink', ZAP + 4, ZAP + 14, PX1, 5);
  const sm = shrink('pink', ZAP + 14, PX1, 1, { mouth: 'puzzlement', eyes: 'sad', smoke: 360 });
  key('pink', sm, { lean: 0, head: 0, hip: [0, 0] }, 0);
  key('yel', ZAP + 16, { head: 0, lean: 0, mouth: 'happy with theeth', eyes: 'normal' }, 4);
  sfx('ref:laugh', ZAP + 18, { who: 'yel', gain: 0.85, pitch: 1.45 });
  chuckle('yel', ZAP + 18, ZAP + 36, { mouth: 'happy with theeth' });

  // ---- 16.3–17.5 с: Розовая «растёт» снова — Лорд опять влюблён
  ev('vein', { who: 'pink', f0: sm + 4, f1: sm + 14 });
  key('pink', sm + 4, { mouth: 'angry theeth', eyes: 'angry' }, 0);
  const PB2 = transform('pink', sm + 12, PX1, PX1, 1, { style: 'grow', love: 'lord', loveDur: 40 });
  key('pink', PB2, stance('pink', PX1, 1), 0);
  key('pink', PB2 + 6, { mouth: 'happy with theeth', eyes: 'angry' }, 0);
  key('yel', PB2 - 2, { mouth: 'puzzlement', eyes: 'sad' }, 0);
  hop('lord', PB2 + 8, PB2 + 16, LO, LO, 40);

  // ---- 18–20.5 с: щелчок — рожок с мороженым слетает с её головы ей в руку; лижет — глыба, «фу!» — за кадр
  const MAG = PB2 + 8, CATCH = MAG + 12;
  key('pink', MAG - 4, { handF: hand('pink', 'F', 0.6, -0.8) }, 4);
  sfx('flick', MAG, { who: 'pink', gain: 1.0 });
  ev('twinkle', { f: MAG, at: tip(MAG, stateAt(MAG)), n: 16, size: 44 });
  sfx('sparkle', MAG + 1, { who: 'yel', gain: 0.7 });
  const cm = coneAt(MAG, stateAt(MAG));
  key('pink', CATCH - 4, { handF: hand('pink', 'F', 0.75, 0.4) }, 6);
  CONE.push({ f0: MAG, f1: CATCH, a: [cm.x, cm.y], b: (f, S) => { const h = C.pink.big.point(S.pink.st, 'handF'); return [h[0], h[1] - CH * 0.45]; }, arc: 160, r0: Math.PI, r1: Math.PI * 2 });
  CONE.push({ f0: CATCH, hand: 'pink', k: 'F', rot: 0 });
  CAPS[1].f1 = MAG;
  SCOOPS.push([MAG, ['#ff9ec7']]);
  sfx('pop', MAG, { who: 'yel', gain: 0.8 });
  key('yel', MAG + 2, { mouth: 'puzzlement', eyes: 'sad', head: -8 }, 3);
  const LK2 = CATCH + 4;
  key('pink', LK2 - 4, { handF: hand('pink', 'F', 0.45, 0.55), head: 10, lean: 10, mouth: 'happy - spittle' }, 8);
  for (const f of [LK2 + 2, LK2 + 8]) { key('pink', f, { head: 18, lean: 13 }, 3); key('pink', f + 4, { head: 8, lean: 9 }, 3); sfx('lick', f, { who: 'pink', gain: 0.8 }); }
  ev('twinkle', { f: LK2 + 12, at: target('pink:lips', stateAt(LK2 + 12)), n: 14, size: 34 });
  sfx('sparkle', LK2 + 12, { who: 'pink', gain: 0.7 });
  const FB2 = LK2 + 16, FROZE2 = FB2 + 12;
  key('pink', FB2 - 4, { handF: hand('pink', 'F', 0.75, 0.45), head: -4, lean: -8, mouth: 'puzzlement' }, 6);
  key('pink', FB2, { lean: 12, head: 6 }, 4);
  FROST.push({ f0: FB2, f1: FB2 + 16, from: lips('pink'), to: (f, S) => target('yel:body', S) });
  sfx('gust', FB2, { who: 'pink', dur: 16, gain: 0.8 });
  key('yel', FB2 + 4, { mouth: 'puzzlement', eyes: 'sad', handF: hand('yel', 'F', 0.5, -0.5), handB: hand('yel', 'B', -0.3, -0.6), lean: -6, head: 0 }, 4);
  ICE.push({ f0: FROZE2 - 6, f1: NF, x: (f, S) => S.yel.p.x, w: 470, h: 800, grow: [[FROZE2 - 6, 0], [FROZE2, 1]], crack: 0, seed: 7 });
  sfx('crunch', FROZE2 - 4, { who: 'yel', gain: 0.9 });
  key('pink', FROZE2 + 2, { lean: 0, head: 0, mouth: 'happy with theeth', eyes: 'normal' }, 6);
  // большое «фу!» — глыба уезжает вправо за кадр
  const PF = FROZE2 + 10, GO = PF + 2, OFF = GO + 20;
  key('pink', PF - 3, { lean: 12, mouth: 'puzzlement' }, 3);
  key('pink', PF + 8, { lean: 0, mouth: 'happy with theeth' }, 6);
  FROST.push({ f0: PF, f1: PF + 10, from: lips('pink'), to: (f, S) => [S.yel.p.x - 240, GROUND - 400] });
  sfx('gust', PF, { who: 'pink', dur: 10, gain: 0.8 });
  move('yel', GO, { x: YX });
  move('yel', OFF, { x: 2400 }, 'in');
  key('yel', GO, { ...K.feet(YX, -1) }, 0);
  key('yel', OFF, { ...K.feet(2400, -1) }, OFF - GO, 'in');
  sfx('slide', GO, { who: 'yel', gain: 0.9 });
  sfx('whoosh', GO + 6, { who: 'yel', dur: 12, gain: 0.6 });
  sfx('ref:laugh', PF + 8, { who: 'pink', gain: 0.85, pitch: 1.35 });
  chuckle('pink', PF + 8, PF + 24, { mouth: 'happy with theeth' });
  key('lord', PF + 10, { mouth: 'happy open mouth', eyes: 'normal' }, 0);
  hop('lord', PF + 12, PF + 22, LO, LO, 70);
  hop('lord', PF + 26, PF + 36, LO, LO, 70);
  const WIN = victory('pink', PF + 24, PX1, { n: 9, stride: 110 });
  window.T = { LAND, YB, FROZE, PB, SLAM, ZAP, PB2, MAG, FROZE2, PF, WIN };
};

// ------------------------------------------------------------------ рисование
function drawCap(ctx, f, S, c) {
  if (f < c.f0 || (c.f1 && f >= c.f1)) return;
  let x, y;
  if (c.fly && f < c.fly.f1) {
    const u = (f - c.fly.f0) / (c.fly.f1 - c.fly.f0), a = c.fly.a, b = P(c.fly.b, f, S);
    x = E.lerp(a[0], b[0], u); y = E.lerp(a[1], b[1], u) - Math.sin(Math.PI * u) * 120;
    FX.scoopCap(ctx, x, y, c.w, c.col, 0);
    return;
  }
  const t = target(`${c.who}:top`, S);
  FX.scoopCap(ctx, t[0], t[1] + (c.dy || 10), c.w, c.col, keyed(c.drip, f));
}
ST.hooks.afterChars.push((ctx, f, S, CAM) => {
  ctx.setTransform(...CAM);
  for (const c of CAPS) drawCap(ctx, f, S, c);
  const cn = coneAt(f, S);
  if (cn) FX.iceCream(ctx, cn.x, cn.y, CS, cn.rot, scoopsAt(f), 0.4);
  for (const k of ICE) {
    if (f < k.f0 || (k.f1 && f >= k.f1)) continue;
    FX.iceBlock(ctx, P(k.x, f, S), GROUND + 4, k.w, k.h, keyed(k.crack, f), keyed(k.grow, f), k.seed);
  }
  for (const q of FROST) {
    if (f < q.f0 || f > q.f1 + 6) continue;
    FX.frost(ctx, P(q.from, f, S), P(q.to, f, S), (f - q.f0) / FPS, Math.min(1, (q.f1 + 6 - f) / 6), q.f0);
  }
  for (const q of BEAMS) {
    if (f < q.f0 || f > q.f1 + 4) continue;
    FX.magicBeam(ctx, P(q.from, f, S), P(q.to, f, S), f / FPS, Math.min(1, (f - q.f0 + 1) / 4), Math.min(1, (q.f1 + 4 - f) / 4));
  }
  for (const b of BURSTS) FX.blockBurst(ctx, b.at[0], b.at[1], (f - b.f) / 20, b.seed, b.cols, b.n, b.size, 1, GROUND);
});

ST.start(BIG);
