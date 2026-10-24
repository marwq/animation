// Ролик 9: Обжора — Скелет против Толстого, потом Розовая, 25 с, 24 кадра/с, звуковые эффекты
// без музыки, по стилю «animal hospital long» (docs/animal_hospital_long.md).
//
//   0–4 с     шарик-Скелет (слева) и Толстый (справа) неподвижно смотрят друг на друга
//   4–5 с     Скелет сразу становится большим; Толстый пугается, потом злится
//   6–10 с    Скелет бьёт в живот — живот-батут отбрасывает его на спину; Толстый хохочет
//   10–13 с   Толстый раскрывает огромный рот и засасывает: летят трава и пыль, Скелет упирается,
//             машет крыльями, скользит — и его проглатывают; Толстый жуёт
//   13–16 с   прискакал шарик-Розовая, злится и становится большой — Толстый влюбляется
//   17–19.5 с её пинок в живот — Толстый выплёвывает Скелета вверх, тот падает на него сверху,
//             Толстый в лепёшку; Скелет в слюнях — и тоже влюбляется
//   20–25 с   Розовая в центре, руки вверх
'use strict';

const ST = Stage({
  name: 'v09-fat-glutton',
  cast: {
    skel: { small: ['skeleton-verity-small-v1', { scale: 0.455 }], big: ['skeleton-verity-big', { height: 730 }], pivot: 325,
      voice: 0.9, lie: 60 },
    fat: { small: ['fat-verity-small', { bodyHeight: 450 }], pivot: 508, voice: 0.75, moods: { love: 'happy' } },
    pink: { small: ['girl-verity-small', { bodyHeight: 300 }], big: ['girl-verity-big', { height: 730, splitFeet: true }],
      pivot: 337, voice: 1.35, vAngle: 50, moods: { angry: 'sad', grin: 'theeth smile', big: 'smile normal' } },
  },
  order: ['fat', 'skel', 'pink'],
  background: { sky: ['#3f9cee', '#a4c9f3', '#f5e0c8'], seed: 129 },
  clouds: [[110, 90, 1.1, 2, 25], [560, 200, 0.8, 0, 21], [960, 80, 1.0, 1, 29], [1390, 170, 1.2, 2, 23],
    [1790, 70, 0.9, 0, 32], [300, 300, 0.7, 1, 19]],
});
const { GROUND, C, key, move, ev, sfx, hop, tumble, laugh, tremble, transform, love, stance, walk, turn,
  strike, kick, dodge, duck, recoil, fallBack, getUp, flyOff, victory, chuckle, hand, toRig, statesAt, stateAt } = ST;

// точки на контуре Толстого со стороны взгляда (замерено по силуэту рига) и его рот
const fatEdge = (k, hf) => (ch, st) => {
  const b = ch.layers.find((l) => l.name === 'body').bbox;
  return E.apply(ch.layerMatrix(st, 'body'), [(b[0] + b[2]) / 2 + k * (b[2] - b[0]), b[3] - hf * (b[3] - b[1])]);
};
ST.parts.belly = fatEdge(0.47, 0.25);
ST.parts.side = fatEdge(0.34, 0.5);
ST.parts.mouth = (ch, st) => E.apply(ch.eyeMatrix(st, 'puzzlement'), [611, 456]);

const FX0 = 1360;
// ================================================================== 0–4 с: стойка (Розовая пока за кадром)
key('skel', 0, { form: 'small', x: 560, y: GROUND, face: 1, look: 1, eyes: 'angry', mouth: 'theeth smile', sx: 1, sy: 1, rot: 0 }, 0);
key('fat', 0, { form: 'small', x: FX0, y: GROUND, face: -1, look: 1, eyes: 'angry', mouth: 'theeth smile', sx: 1, sy: 1, rot: 0 }, 0);
key('pink', 0, { form: 'small', x: -220, y: GROUND, face: 1, look: 1, eyes: 'normal', mouth: 'smile normal', sx: 1, sy: 1, rot: 0 }, 0);

// ================================================================== 4–5 с: Скелет большой
const SX = 560;
const SB = transform('skel', 96, 560, SX, 1, { fast: true });
key('fat', SB, { mouth: 'puzzlement', eyes: 'sad' }, 0);
sfx('scared', SB + 2, { who: 'fat', gain: 0.7 });
ev('sweat', { who: 'fat', f0: SB + 2, f1: SB + 26 });
tremble('fat', SB + 2, SB + 18, FX0, 2);
key('fat', 146, { eyes: 'angry', mouth: 'theeth smile' }, 0);

// ================================================================== 6–10 с: удар в живот — батут
const PU = 180;
key('fat', PU, { sx: 1, sy: 1 }, 0);
key('fat', PU + 3, { sx: 0.86, sy: 1.08, eyes: 'normal' }, 3);
key('fat', PU + 6, { sx: 1.2, sy: 0.86 }, 3, 'out');
key('fat', PU + 10, { sx: 0.96, sy: 1.04 }, 4);
key('fat', PU + 14, { sx: 1, sy: 1, mouth: 'happy' }, 4);
sfx('boing', PU + 3, { who: 'fat' });
laugh('fat', PU + 16, PU + 50);

// ================================================================== 10–13 с: огромный рот — засасывает
const OPEN = 246, GULP = 310;
key('fat', OPEN - 6, { mouth: 'theeth smile', eyes: 'angry' }, 0);
key('fat', OPEN, { mouth: 'puzzlement', mouthK: 1, sx: 1.06, sy: 0.96 }, 0);
key('fat', OPEN + 8, { mouthK: 3.2, sx: 1.04, sy: 1.04 }, 8, 'out');
for (let f = OPEN + 12; f < GULP - 4; f += 4) key('fat', f, { sy: (f / 4) % 2 ? 1.02 : 1.06 }, 2);
ev('suck', { f0: OPEN + 6, f1: GULP, at: 'fat:mouth', x0: -40, who: 'fat' });
// проглотил: рот закрылся, живот раздулся, жуёт
key('fat', GULP, { mouthK: 1, mouth: 'smile normal', sx: 1.22, sy: 0.92 }, 3, 'out');
sfx('gulp', GULP, { who: 'fat' });
const CHEW0 = GULP + 6;
for (let i = 0; i < 9; i++) {
  const f = CHEW0 + i * 6;
  key('fat', f, { mouth: i % 2 ? 'theeth smile' : 'smile normal', sy: i % 2 ? 0.94 : 0.9, sx: i % 2 ? 1.18 : 1.24 }, 3);
  if (i % 2) sfx('chomp', f, { who: 'fat', gain: 0.6 });
}

// ================================================================== 13–16 с: Розовая прискакала и стала большой
hop('pink', 300, 312, -220, 40, 60);
hop('pink', 316, 328, 40, 260, 60);
key('pink', 330, { mouth: 'puzzlement' }, 0);
const PX = 300;
const PB = transform('pink', 336, 260, PX, 1, { love: 'fat', loveDur: 70 });

// ================================================================== 17–19.5 с: пинок — выплюнул вверх — лепёшка
const KK = 432, SPIT = 434, TOP = 452, LAND = 466;
key('fat', KK, { sx: 1.22, sy: 0.92 }, 0);
key('fat', KK + 2, { sx: 0.9, sy: 1.12, mouth: 'puzzlement', mouthK: 2.2 }, 2, 'out');
key('fat', KK + 8, { sx: 1, sy: 1, mouthK: 1, eyes: 'sad' }, 6);
ev('drool', { f: SPIT, at: 'fat:mouth', dir: -1, n: 22 });
key('fat', LAND - 1, { sx: 1, sy: 1, mouth: 'puzzlement' }, 0);
key('fat', LAND + 1, { sx: 1.8, sy: 0.3 }, 2, 'in2');
key('fat', 540, { sx: 1.75, sy: 0.32 }, 60);
ev('stars', { who: 'fat', f0: LAND + 6, f1: 560 });
sfx('hurt', LAND + 2, { who: 'fat' });

const BIG = () => {
  const K = C.skel.big;
  key('skel', SB, stance('skel', SX, 1, { b_B16: 12, b_B17: -12 }), 0);
  key('skel', SB + 6, { mouth: 'angry theeth' }, 0);
  // ---- подходит и бьёт в живот — батут отбрасывает его на спину
  const S1 = 960;
  walk('skel', 136, SX, S1, 4, 10, 1);
  strike('skel', PU, 'fat:side', { snd: 'punch', hard: false });
  key('skel', PU + 3, { hitF: 0 }, 0);
  const down = fallBack('skel', PU + 3, S1, 1, { n: 16, stars: 26, dur: 2 });
  move('skel', PU + 10, { y: GROUND - 120 }, 'out2');
  move('skel', PU + 19, { x: 890 }, 'out2');
  move('skel', PU + 19, { y: GROUND - 60 }, 'in2');
  sfx('hurt', PU + 4, { who: 'skel', gain: 0.7 });
  const up = getUp('skel', 226, 890, 1, { lift: 60 });

  // ---- засасывает: упирается, машет крыльями, скользит
  const R0 = OPEN + 4, R1 = 296;
  key('skel', R0, { ...stance('skel', 890, 1), lean: -22, head: -10, hip: [toRig('skel', -20), toRig('skel', 40)],
    mouth: 'puzzlement', eyes: 'sad', handF: hand('skel', 'F', -0.5, -0.6), handB: hand('skel', 'B', -0.8, -0.3) }, 4);
  key('skel', R1, { ...stance('skel', 1010, 1), lean: -22, head: -10, hip: [toRig('skel', -20), toRig('skel', 40)],
    handF: hand('skel', 'F', -0.5, -0.6), handB: hand('skel', 'B', -0.8, -0.3) }, R1 - R0, 'in');
  for (let f = R0 + 2; f < R1; f += 6) {
    key('skel', f, { b_B16: -30, b_B17: 30 }, 3);
    key('skel', f + 3, { b_B16: 40, b_B17: -40 }, 3, 'in');
    if ((f - R0) % 12 === 2) ev('dust', { f, x: E.lerp(890, 1010, (f - R0) / (R1 - R0)) + 40, r: 22, n: 3, snd: false });
  }
  sfx('scared', R0 + 10, { who: 'skel', gain: 0.8 });
  sfx('gust', R0 + 2, { who: 'skel', dur: R1 - R0, gain: 0.4 });
  // оторвало от земли — головой вперёд прямо в рот, уменьшается и пропадает
  const BP = (K.anchor[1] - K.top) / 2;
  const m = E.apply(C.fat.small.eyeMatrix(ST.stateAt(GULP - 2).fat.st, 'puzzlement'), [611, 456]);
  key('skel', R1 + 1, { pivot: BP, legFfk: 1, legBfk: 1, legF: [-20, 40], legB: [20, -30], z: -1,
    handF: hand('skel', 'F', 0.2, -0.9), handB: hand('skel', 'B', 0, -0.95) }, 2);
  move('skel', R1, { x: 1010, y: GROUND, rot: 0, sx: 1, sy: 1 });
  move('skel', GULP - 2, { x: m[0] - 30, y: m[1] + BP * K.scale * 0.2, rot: 90, sx: 0.2, sy: 0.2 }, 'in2');
  key('skel', GULP - 1, { alpha: 0 }, 0);
  sfx('whoosh', R1, { who: 'skel', dur: GULP - R1, gain: 0.6 });

  // ---- Розовая большая; Толстый влюбился, жуя
  key('pink', PB, stance('pink', PX, 1), 0);
  key('pink', PB + 8, { mouth: 'theeth smile', eyes: 'angry' }, 0);
  const P1 = 860;
  walk('pink', PB + 10, PX, P1, 5, 8, 1);
  kick('pink', KK, 'fat:belly', { x: P1, face: 1, hard: true });
  // выплюнул вверх: вылетает изо рта, кувыркаясь, уходит за верх кадра и падает на Толстого
  const m2 = E.apply(C.fat.small.eyeMatrix(ST.stateAt(SPIT).fat.st, 'puzzlement'), [611, 456]);
  key('skel', SPIT, { alpha: 1, z: 0, pivot: BP, mouth: 'puzzlement', eyes: 'sad', legF: [-30, 50], legB: [25, -40] }, 0);
  move('skel', SPIT, { x: m2[0], y: m2[1] + BP * K.scale * 0.3, rot: 90, sx: 0.3, sy: 0.3 });
  move('skel', SPIT + 6, { sx: 1, sy: 1 }, 'out');
  move('skel', TOP, { x: FX0 + 40, y: -60, rot: 90 + 540 }, 'out2');
  move('skel', LAND, { x: FX0 + 130, y: GROUND - 135 - 60 + BP * K.scale, rot: 90 + 720 }, 'in2');   // на спине, головой вправо
  key('skel', LAND - 6, { face: -1 }, 0);
  key('skel', LAND, { pivot: BP, legF: [0, 0, 0], legB: [0, 0, 0], handF: hand('skel', 'F', 0.1, -0.95),
    handB: hand('skel', 'B', -0.05, -0.95), zB: 'back', b_B16: 90, b_B17: -90 }, 4);
  sfx('scared', SPIT + 4, { who: 'skel', gain: 0.8 });
  sfx('whoosh', SPIT, { who: 'skel', dur: LAND - SPIT, gain: 0.6 });
  ev('dust', { f: LAND, x: FX0, r: 90, n: 8, snd: 'slam' });
  ev('shake', { f: LAND, amp: 24, n: 16 });
  ev('zoom', { f: LAND, n: 14, k: 0.08, at: [FX0, GROUND - 120] });
  ev('drool', { f: LAND, at: [FX0, GROUND - 200], dir: 1, n: 20, snd: false });
  ev('drool', { f: LAND, at: [FX0, GROUND - 200], dir: -1, n: 20, snd: false });
  // лежит на лепёшке в слюнях — увидел её и влюбился
  ST.love('skel', 486, 600, { mouth: 'happy - spittle' });
  key('pink', KK + 18, { mouth: 'happy with theeth', eyes: 'normal' }, 0);
  chuckle('pink', LAND + 4, LAND + 26, { mouth: 'happy with theeth' });
  victory('pink', 496, P1, { n: 10 });
};

ST.start(BIG);
