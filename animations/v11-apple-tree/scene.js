// Ролик 11: Яблоня — Радужный против Розовой, 25 с, 24 кадра/с, звуковые эффекты без музыки,
// по стилю «animal hospital long» (docs/animal_hospital_long.md).
//
//   0–4 с     радужный шарик (слева) и шарик-Розовая (справа, под яблоней) смотрят друг на друга
//   4–5 с     Радужный сразу становится большим; Розовая пугается
//   5.5–9 с   он пинает ствол — три яблока по очереди бьют Розовую по макушке, он хохочет
//   10–12 с   Розовая злится и становится большой — Радужный влюбляется
//   12–14 с   идёт обниматься — она отскакивает, он обнимает воздух
//   14.5–17 с злой пинает ствол — град яблок ему на голову, падает лицом в траву
//   17.5–19 с последним падает золотое яблоко — отскакивает ей в руку, она откусывает
//   19.5–21 с пинком по пяткам отправляет его на животе за кадр
//   21–25 с   Розовая с золотым яблоком в центре, руки вверх
'use strict';

const ST = Stage({
  name: 'v11-apple-tree',
  cast: {
    rb: { small: ['skeleton-verity-small', { scale: 0.455, recolor: 'rainbow' }], big: ['all-verity-color', { height: 730 }],
      pivot: 325, voice: 0.85, lie: 70, moods: { big: 'theeth smile' } },
    pink: { small: ['girl-verity-small', { bodyHeight: 300 }], big: ['girl-verity-big', { height: 730, splitFeet: true }],
      pivot: 337, voice: 1.35, vAngle: 50, moods: { angry: 'sad', grin: 'theeth smile', big: 'smile normal' } },
  },
  order: ['rb', 'pink'],
  background: { sky: ['#43a3f2', '#a9cff6', '#f3e2cd'], seed: 152 },
  clouds: [[150, 80, 1.0, 0, 25], [520, 200, 0.9, 2, 19], [900, 60, 1.1, 1, 29], [1500, 230, 0.8, 0, 22],
    [1800, 110, 1.0, 2, 27], [700, 300, 0.7, 1, 33]],
});
const { GROUND, C, key, move, ev, sfx, hop, tumble, laugh, tremble, transform, love, stance, walk, turn,
  strike, kick, dodge, duck, recoil, fallBack, getUp, flyOff, victory, chuckle, hand, toRig, statesAt, stateAt } = ST;

// ------------------------------------------------------------------ яблоня и яблоки
const TX = 1160, CY = GROUND - 520;
const KICKS = [];                                            // кадры пинков по стволу — крона качается
const shakeAt = (f) => KICKS.reduce((a, k) => a + (f >= k ? 0.09 * Math.exp(-(f - k) / 9) * Math.sin((f - k) * 0.95) : 0), 0);
const APPLES = [
  [150, 20], [180, -60], [100, 90],                          // три — по шарику-Розовой
  [-60, 30], [10, -150], [70, -90], [-110, 80], [-150, -40], // град — по Радужному
  [0, 40, true],                                             // золотое
  [-180, -70], [130, -150], [-40, -110],                     // остаются на дереве
].map(([dx, dy, gold]) => ({ dx, dy, gold: !!gold, path: null }));
const home = (a) => [TX + a.dx, CY + a.dy];
// путь яблока: [{f, at: [x, y] | () => [x, y], ease, arc}] — между точками плавно, после последней — там
function appleAt(a, f) {
  const P = a.path;
  if (!P || f < P[0].f) return null;
  const pt = (k) => (typeof P[k].at === 'function' ? P[k].at(f) : P[k].at);
  for (let k = 1; k < P.length; k++) {
    if (f < P[k].f) {
      const u = (f - P[k - 1].f) / (P[k].f - P[k - 1].f), e = E.EASE[P[k].ease || 'lin'](u);
      const p0 = pt(k - 1), p1 = pt(k);
      return { x: E.lerp(p0[0], p1[0], u), y: E.lerp(p0[1], p1[1], e) - (P[k].arc ? Math.sin(Math.PI * u) * P[k].arc : 0),
        rot: (f - P[0].f) * 0.25 };
    }
  }
  const p = pt(P.length - 1);
  return { x: p[0], y: p[1], rot: a.rest ?? 1.2 };
}
const R_APPLE = 26, ON_GROUND = GROUND - 20;
function drop(a, f0, fHit, hitAt, rest, fRest) {
  a.path = [{ f: f0, at: home(a) }, { f: fHit, at: hitAt, ease: 'in2' }, { f: fRest, at: [rest, ON_GROUND], arc: 90 }];
  sfx('bonk', fHit, { x: hitAt[0], gain: 0.8 });
}

// ================================================================== 0–4 с: стойка
key('rb', 0, { form: 'small', x: 560, y: GROUND, face: 1, look: 1, eyes: 'angry', mouth: 'theeth smile', sx: 1, sy: 1, rot: 0 }, 0);
key('pink', 0, { form: 'small', x: 1360, y: GROUND, face: -1, look: 1, eyes: 'angry', mouth: 'smile normal', sx: 1, sy: 1, rot: 0 }, 0);

// ================================================================== 4–5 с: Радужный большой
const RX = 560;
const RB = transform('rb', 96, 560, RX, 1, { fast: true });
key('pink', RB, { mouth: 'puzzlement', eyes: 'sad' }, 0);
sfx('scared', RB + 2, { who: 'pink', gain: 0.8 });
tremble('pink', RB + 2, RB + 18, 1360, 2);
ev('sweat', { who: 'pink', f0: RB + 2, f1: RB + 30 });

// ================================================================== 7.5–9 с: три яблока по макушке
const K1 = 180, HITS = [194, 200, 206];
KICKS.push(K1);
[0.84, 0.72, 0.58].forEach((sy, i) => {
  key('pink', HITS[i], { sx: 2 - sy, sy, eyes: 'sad', mouth: 'puzzlement' }, 1);
  key('pink', HITS[i] + 3, { sx: 1 + (1 - sy) * 0.6, sy: 1 - (1 - sy) * 0.6 }, 3);
});
key('pink', 226, { sx: 0.9, sy: 1.12 }, 6, 'out');
key('pink', 232, { sx: 1, sy: 1 }, 6);
sfx('hurt', HITS[2] + 2, { who: 'pink' });
ev('stars', { who: 'pink', f0: 212, f1: 250 });

// ================================================================== 10–12 с: Розовая большая
const PX = 1400;
const PB = transform('pink', 238, 1360, PX, -1, { love: 'rb', loveDur: 70 });

const BIG = () => {
  const P = C.pink.big, Rb = C.rb.big;
  key('rb', RB, stance('rb', RX, 1), 0);
  key('rb', RB + 6, { mouth: 'theeth smile' }, 0);
  // ---- подходит к яблоне и пинает ствол
  const R1 = 965;
  walk('rb', 136, RX, R1, 4, 9, 1);
  kick('rb', K1, [TX - 40, GROUND - 170], { x: R1, face: 1, hard: false, snd: 'kick' });
  [0, 1, 2].forEach((i) => {
    const top = ST.target('pink:top', stateAt(HITS[i]));
    drop(APPLES[i], K1 + 2 + i * 6, HITS[i], top, [1440, 1250, 1500][i], HITS[i] + 16);
  });
  chuckle('rb', 204, 234);

  // ---- Розовая большая; Радужный влюблён — идёт обниматься, она отскакивает
  key('pink', PB, stance('pink', PX, -1), 0);
  key('pink', PB + 10, { mouth: 'theeth smile', eyes: 'normal' }, 0);
  const R2 = 1090, R3 = 1230, LUNGE = 334, P2 = 1640;
  walk('rb', PB + 14, R1, R2, 2, 12, 1, false);
  key('rb', PB + 14, { handF: hand('rb', 'F', 0.8, -0.2), handB: hand('rb', 'B', 0.7, -0.1) }, 8);
  walk('rb', LUNGE - 8, R2, R3, 1, 8, 1, false);
  key('rb', LUNGE, { lean: 18, handF: hand('rb', 'F', 0.95, -0.1), handB: hand('rb', 'B', 0.9, 0) }, 4);
  key('rb', LUNGE + 6, { handF: hand('rb', 'F', 0.35, 0.05), handB: hand('rb', 'B', 0.3, 0.1), mouth: 'puzzlement' }, 4);   // обнял воздух
  sfx('whoosh', LUNGE + 2, { who: 'rb', dur: 8, gain: 0.6 });
  dodge('pink', LUNGE - 9, PX, P2, -1, { mouth: 'theeth smile' });
  key('pink', LUNGE + 18, { mouth: 'happy with theeth' }, 0);
  chuckle('pink', LUNGE + 20, LUNGE + 44, { mouth: 'happy with theeth' });

  // ---- злой разворачивается к стволу и пинает — град яблок на него
  key('rb', 352, { ...stance('rb', R3, 1), mouth: 'angry theeth', eyes: 'angry' }, 6);
  ev('vein', { who: 'rb', f0: 354, f1: 372 });
  ev('steam', { who: 'rb', f0: 356, f1: 372 });
  sfx('anger', 354, { who: 'rb', dur: 18, gain: 0.7 });
  turn('rb', 364, -1, R3);
  const K2 = 380;
  KICKS.push(K2);
  kick('rb', K2, [TX + 40, GROUND - 170], { hard: false, snd: 'kick' });
  const H = [392, 397, 402, 407, 412];
  H.forEach((fh, i) => {
    const top = ST.target('rb:top', stateAt(fh));
    drop(APPLES[3 + i], K2 + 2 + i * 4, fh, [top[0] + (i % 2 ? 12 : -12), top[1]], [1080, 1460, 1180, 1530, 1010][i], fh + 14);
    key('rb', fh + 1, { head: 14 + i * 3, mouth: 'puzzlement', eyes: 'sad' }, 1, 'out');
    key('rb', fh + 3, { head: 4 + i * 2 }, 2);
  });
  sfx('hurt', 393, { who: 'rb', gain: 0.6 });
  sfx('hurt', 403, { who: 'rb', gain: 0.7, pitch: 0.95 });
  ev('stars', { who: 'rb', f0: 398, f1: 470 });
  // падает лицом в траву
  const FALL = 416;
  const down = fallBack('rb', FALL, R3, -1, { forward: true, stars: false, lift: 70 });

  // ---- золотое яблоко: падает ему на спину, отскакивает ей в руку, она откусывает
  const G = APPLES[8], GHIT = down + 4, CATCH = GHIT + 16;
  const back = [R3 - 140, GROUND - 120];
  key('pink', CATCH - 8, { handF: hand('pink', 'F', 0.7, -0.2), mouth: 'puzzlement' }, 6);
  const handAt = (f) => { const h = P.point(statesAt(f).pink.st, 'handF'); return [h[0], h[1] - 18]; };
  G.path = [{ f: down - 10, at: home(G) }, { f: GHIT, at: back, ease: 'in2' },
    { f: CATCH, at: () => handAt(CATCH), arc: 160 }, { f: CATCH + 1, at: handAt }];
  G.rest = 0;
  sfx('bonk', GHIT, { x: back[0], gain: 0.6 });
  sfx('sparkle', CATCH, { who: 'pink' });
  const BITE = CATCH + 14;
  key('pink', BITE - 6, { handF: hand('pink', 'F', 0.25, -0.62), zF: 'front', mouth: 'happy with theeth' }, 6);   // яблоко ко рту
  sfx('chomp', BITE, { who: 'pink' });
  key('pink', BITE + 2, { mouth: 'happy - spittle' }, 0);
  key('pink', BITE + 10, { handF: hand('pink', 'F', 0.6, -0.2), zF: null, mouth: 'happy with theeth' }, 6);
  // подходит и пинает лежащего по пяткам — он уезжает на животе за кадр
  const P3 = 1430, KK = BITE + 34;
  walk('pink', BITE + 14, P2, P3, 2, 8, -1);
  kick('pink', KK, 'rb:feet', { x: P3, face: -1, hard: true, snd: 'kick' });
  move('rb', KK, { x: R3 });
  move('rb', KK + 26, { x: -900 }, 'out2');
  sfx('whoosh', KK, { who: 'rb', dur: 24, gain: 0.7 });
  sfx('scared', KK + 2, { who: 'rb', gain: 0.7 });
  for (let f = KK + 2; f < KK + 20; f += 5) ev('dust', { f, x: E.lerp(R3 - 300, -400, (f - KK) / 26), r: 30, n: 3, snd: false });
  victory('pink', KK + 18, P3, { n: 8, stride: 120 });
};

// крона и висящие яблоки — позади всех; упавшие — поверх
ST.hooks.beforeChars.push((ctx, f) => {
  FX.tree(ctx, TX, GROUND, shakeAt(f), APPLES.filter((a) => !a.path || f < a.path[0].f).map((a) => [a.dx, a.dy, a.gold]));
});
ST.hooks.afterChars.push((ctx, f, S, CAM) => {
  ctx.setTransform(...CAM);
  for (const a of APPLES) {
    const p = appleAt(a, f);
    if (p) FX.apple(ctx, p.x, p.y, R_APPLE, p.rot, a.gold);
  }
});

ST.start(BIG);
