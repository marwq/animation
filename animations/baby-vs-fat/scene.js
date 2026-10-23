// Малыш против Толстого — драка 25 с, 24 кадра/с, по стилю «animal hospital long»
// (docs/animal_hospital_long.md).
//
//   0–4 с     шарик-Малыш (слева) и Толстый (справа) неподвижно смотрят друг на друга
//   4–8 с     Малыш скачет и бьёт головой в живот — живот пружинит, Малыш улетает кувырком
//   8–11 с    Малыш злится, ухмыляется, лучи, дым — большой розовый скелет в кепке
//   11–15 с   удар кулаком в живот — живот-батут отбрасывает Малыша назад, Толстый смеётся
//   15–17 с   Толстый приседает, прыгает и хочет сесть сверху — Малыш отскочил, Толстый
//             со всей силы шлёпается о землю, звёздочки
//   17–21 с   Малыш с замахом пинает Толстого — тот улетает за кадр, блеск
//   21–25 с   Малыш идёт в центр, поворачивается к зрителю, руки вверх
//
// Ключи, помощники движения и сборка кадра — в animations/stage.js.
'use strict';

// размеры как в образце: шарик ~300 px, Толстый ~520×450, большие ~730 px до подошв
const ST = Stage({
  name: 'baby-vs-fat',
  cast: {
    baby: { small: ['child-verity-pink', { bodyHeight: 300 }], big: ['child-verity-big', { height: 730 }], pivot: 338,
      moods: { angry: ' 5', grin: ' 2', big: 'mouth' } },
    fat: { small: ['fat-verity-small', { bodyHeight: 450 }], pivot: 508 },
  },
  order: ['fat', 'baby'],     // Малыш ближе к зрителю
  background: { sky: ['#4aa6f3', '#b2cdf4', '#f0dcc0'], seed: 23 },
  clouds: [[260, 90, 1.1, 1, 24], [760, 230, 0.8, 0, 19], [1150, 70, 1.2, 2, 28], [1560, 180, 0.9, 1, 22],
    [40, 270, 0.7, 0, 32], [1880, 300, 0.7, 2, 18]],
});
const { GROUND, C, key, move, ev, hop, tumble, laugh, tremble, transform, stance, walk } = ST;

// точки на контуре Толстого со стороны соперника (замерено по силуэту рига):
// belly — широкий низ живота (25 % высоты), side — бок на половине высоты
const fatEdge = (k, hf) => (ch, st) => {
  const b = ch.layers.find((l) => l.name === 'body').bbox;
  return E.apply(ch.layerMatrix(st, 'body'), [(b[0] + b[2]) / 2 + k * (b[2] - b[0]), b[3] - hf * (b[3] - b[1])]);
};
ST.parts.belly = fatEdge(0.47, 0.25);
ST.parts.side = fatEdge(0.34, 0.5);

const FX0 = 1360;               // Толстый стоит здесь до прыжка

// ================================================================== 0–4 с: стойка
key('baby', 0, { form: 'small', x: 560, y: GROUND, face: 1, look: 1, eyes: 'angry', mouth: ' 1', sx: 1, sy: 1, rot: 0 }, 0);
key('fat', 0, { form: 'small', x: FX0, y: GROUND, face: -1, look: 1, eyes: 'angry', mouth: 'theeth smile', sx: 1, sy: 1, rot: 0 }, 0);

// ================================================================== 4–8 с: удар головой в живот
hop('baby', 100, 112, 560, 690, 80, { dust: true });
hop('baby', 120, 132, 690, 820, 80, { dust: true });
key('baby', 136, { mouth: ' 2' }, 0);
key('baby', 140, { sx: 1.24, sy: 0.78 }, 6);                       // присел, набирает силу
tremble('baby', 140, 150, 820, 3);
key('baby', 152, { sx: 0.8, sy: 1.18 }, 2);                        // бросок головой вперёд
move('baby', 150, { x: 820, y: GROUND });
move('baby', 153, { y: GROUND - 26 }, 'out2');
move('baby', 156, { y: GROUND - 4 }, 'in2');
move('baby', 156, { x: 1006 }, 'in2');
key('baby', 156, { sx: 0.76, sy: 1.2 }, 1);                        // сплющился о живот
ev('spark', { f: 156, at: 'fat:belly', r: 66 });
ev('shake', { f: 156, amp: 12, n: 10 });
ev('zoom', { f: 156, n: 10, k: 0.05, at: 'fat:belly' });
// живот-батут: вдавился и спружинил
key('fat', 156, { sx: 1, sy: 1 }, 0);
key('fat', 158, { sx: 0.88, sy: 1.08, eyes: 'sad', mouth: 'puzzlement' }, 2);
key('fat', 161, { sx: 1.14, sy: 0.9 }, 3, 'out');
key('fat', 165, { sx: 0.96, sy: 1.04 }, 4);
key('fat', 170, { sx: 1, sy: 1, eyes: 'normal', mouth: 'happy' }, 5);
laugh('fat', 176, 214);
// Малыша отбрасывает назад кувырком
key('baby', 159, { eyes: 'sad', mouth: ' 5' }, 0);
key('baby', 163, { sx: 1, sy: 1 }, 3);
tumble('baby', 160, 188, 1006, 470, 260, -2, { stars: 30 });
key('baby', 189, { eyes: 'sad', mouth: ' 5' }, 0);

// ================================================================== 8–11 с: Малыш превращается
const BX = 520;
const BB = transform('baby', 214, 470, BX, 1);
// Толстый пугается: рот «О», дрожь, пот — потом злится
key('fat', BB, { mouth: 'puzzlement', eyes: 'sad' }, 0);
tremble('fat', BB + 2, BB + 22, FX0, 2);
ev('sweat', { who: 'fat', f0: BB + 2, f1: BB + 32 });
key('fat', BB + 34, { eyes: 'angry', mouth: 'theeth smile' }, 0);

// позы большого — после загрузки ригов (нужны размеры рук и ног)
const B1 = 875, B2 = 680, B3 = 420, B4 = 480;   // Малыш: удар кулаком, отбросило, отскочил, пинок
const FX1 = 930;                      // куда шлёпнулся Толстый
const BIG = () => {
  const b = C.baby.big;
  key('baby', BB, stance('baby', BX, 1), 0);
  key('baby', BB + 30, { mouth: 'angry theeth' }, 0);

  // ---- 12–15 с: кулак в живот — живот-батут отбрасывает Малыша назад
  walk('baby', 292, BX, B1, 3, 10, 1);
  key('baby', 330, { handF: [-420, 260], lean: -8, hip: [0, 50], hitF: 0 }, 6);               // замах: рука назад
  key('baby', 336, { handF: [300, 150], lean: 18, hip: [0, 110], hitF: 1, hitFto: 'fat:side', hitFfix: 336 }, 4, 'in2');
  ev('spark', { f: 336, at: 'fat:side', r: 64 });
  ev('shake', { f: 336, amp: 10, n: 8 });
  ev('zoom', { f: 336, n: 10, k: 0.05, at: 'fat:side' });
  key('fat', 336, { sx: 1, sy: 1 }, 0);
  key('fat', 339, { sx: 0.9, sy: 1.07, eyes: 'normal' }, 3);                                   // кулак вдавился
  key('fat', 342, { sx: 1.18, sy: 0.88 }, 3, 'out');                                            // и живот спружинил
  key('fat', 346, { sx: 0.96, sy: 1.04 }, 4);
  key('fat', 350, { sx: 1, sy: 1, mouth: 'happy' }, 4);
  laugh('fat', 352, 386);
  // Малыша отбрасывает: низкий отлёт назад, руки вверх, приземлился на ноги
  key('baby', 340, { hitF: 1 }, 0);
  key('baby', 343, { hitF: 0, legFfk: 1, legBfk: 1, legF: [20, -30], legB: [-15, 20], lean: -20, head: -8, hip: [0, 40],
    handF: [330, -470], handB: [-480, -370], mouth: 'puzzlement' }, 2, 'out');
  move('baby', 342, { x: B1, y: ST.GROUND });
  move('baby', 348, { y: ST.GROUND - 50 }, 'out2');
  move('baby', 354, { y: ST.GROUND }, 'in2');
  move('baby', 354, { x: B2 }, 'out2');
  key('baby', 352, { ...b.feet(B2, 1), legFfk: 1, legBfk: 1 }, 0);
  key('baby', 356, { legFfk: 0, legBfk: 0, hip: [0, 90], lean: -4, head: 0 }, 3);
  ev('dust', { f: 354, x: B2, r: 34, n: 5 });
  key('baby', 368, { ...stance('baby', B2, 1), mouth: 'sad' }, 10);
  key('baby', 380, { mouth: 'angry theeth' }, 0);

  // ---- 16–17.5 с: Толстый прыгает сесть сверху — Малыш отскочил, Толстый шлёпнулся
  key('fat', 388, { eyes: 'angry', mouth: 'theeth smile' }, 0);
  key('fat', 396, { sx: 1.26, sy: 0.76 }, 6);                                                   // присел низко
  tremble('fat', 394, 402, FX0, 3);
  key('fat', 404, { sx: 0.84, sy: 1.18 }, 2);                                                   // выстрелил вверх
  move('fat', 402, { x: FX0, y: ST.GROUND });
  move('fat', 411, { y: ST.GROUND - 330 }, 'out2');
  move('fat', 420, { y: ST.GROUND }, 'in');
  move('fat', 420, { x: FX1 }, 'lin');
  key('fat', 411, { sx: 1, sy: 1 }, 5);
  key('fat', 420, { sx: 1.3, sy: 0.64, eyes: 'sad', mouth: 'puzzlement' }, 1);                  // шлёпнулся со всей силы
  key('fat', 428, { sx: 1.22, sy: 0.74 }, 8);
  key('fat', 436, { sx: 0.95, sy: 1.05 }, 6);
  key('fat', 442, { sx: 1, sy: 1 }, 5);
  ev('dust', { f: 420, x: FX1, r: 70, n: 8 });
  ev('shake', { f: 420, amp: 20, n: 14 });
  ev('zoom', { f: 420, n: 14, k: 0.07, at: [FX1, ST.GROUND - 120] });
  ev('stars', { who: 'fat', f0: 426, f1: 476 });
  // уклон Малыша: испугался, присел и отскочил назад (колени вперёд)
  key('baby', 406, { mouth: 'puzzlement', lean: -6, hip: [0, 40] }, 4);
  key('baby', 410, { hip: [0, 80], lean: -10 }, 3);
  move('baby', 410, { x: B2, y: ST.GROUND });
  key('baby', 411, { legFfk: 1, legBfk: 1, legF: [12, -24], legB: [-14, 26], lean: -18, head: -8, hip: [-20, 40],
    handF: [120, 300], handB: [-160, 380] }, 2);
  move('baby', 413, { y: ST.GROUND - 40 }, 'out2');
  move('baby', 418, { y: ST.GROUND }, 'in2');
  move('baby', 418, { x: B3 }, 'out2');
  key('baby', 416, { ...b.feet(B3, 1), legFfk: 1, legBfk: 1 }, 0);
  key('baby', 420, { legFfk: 0, legBfk: 0, hip: [0, 90], lean: -4, head: 0 }, 3);
  ev('dust', { f: 418, x: B3, r: 30, n: 4 });
  key('baby', 432, { ...stance('baby', B3, 1), mouth: 'theeth smile' }, 10);

  // ---- 18.5–20.5 с: пинок — Толстый улетает за кадр
  key('baby', 434, { mouth: 'angry theeth' }, 0);
  walk('baby', 436, B3, B4, 1, 10, 1, false);                                                   // шаг к Толстому
  key('baby', 452, { legFfk: 1, legF: [62, -100], lean: -10, hip: [0, 30], kickF: 0,
    handF: [-120, 180], handB: [-260, 120] }, 6);                                              // колено вверх — замах
  key('baby', 457, { kickF: 1, kickFto: 'fat:belly', kickFfix: 457, lean: -16 }, 4, 'in2');      // пинок
  ev('spark', { f: 457, at: 'fat:belly', r: 90 });
  ev('shake', { f: 457, amp: 22, n: 14 });
  ev('zoom', { f: 457, n: 14, k: 0.1, at: 'fat:belly' });
  key('baby', 462, { kickF: 1 }, 0);
  key('baby', 468, { kickF: 0 }, 6);
  key('baby', 474, { ...stance('baby', B4, 1), mouth: 'happy with theeth' }, 6);
  key('fat', 457, { pivot: 508, sx: 1, sy: 1, eyes: 'sad', mouth: 'puzzlement' }, 0);
  move('fat', 457, { x: FX1, y: ST.GROUND, rot: 0 });
  move('fat', 492, { x: 2160, rot: 1080 }, 'lin');
  move('fat', 492, { y: -460 }, 'out2');
  ev('twinkle', { f: 490, at: [1830, 110], n: 22, size: 56 });

  // ---- 21–25 с: победитель идёт в центр, поворачивается к зрителю, руки вверх
  walk('baby', 482, B4, 960, 5, 10, 1);
  key('baby', 540, { look: 0 }, 4);
  key('baby', 547, { handF: [640, -60], handB: [-640, -60] }, 3);                  // руки через стороны
  key('baby', 550, { handF: [260, -700], handB: [-260, -700], head: -4, mouth: 'happy with theeth' }, 3);   // прямые руки буквой V
  for (const [f, x, y] of [[550, 790, 260], [558, 1130, 200], [566, 760, 470], [574, 1170, 430], [582, 960, 120],
    [590, 820, 330]]) {
    ev('twinkle', { f, at: [x, y], n: 16, size: 34 });
  }
};

ST.start(BIG);
