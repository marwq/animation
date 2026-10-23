// Скелет против Лорда — драка 25 с, 24 кадра/с, по стилю «animal hospital long»
// (docs/animal_hospital_long.md).
//
//   0–4 с     оба маленькие (шарики), неподвижно смотрят друг на друга
//   4–8 с     шарик-Лорд скачет и бьёт головой, шарик-Скелет улетает кувырком, звёздочки
//   8–11 с    Скелет злится (жилка, пар), ухмыляется, лучи, дым — большой крылатый скелет
//   11–14 с   Скелет подходит и шлёпает шарик-Лорда, тот улетает
//   14–17 с   Лорд злится и превращается в большого
//   17–21 с   удар Скелета мимо (Лорд отскочил), шляпа-бумеранг Лорда по лицу Скелета
//   21–23 с   апперкот — Скелет улетает за кадр, блеск
//   23–25 с   Лорд в центре, лицом к зрителю, руки вверх
//
// Ключи, помощники движения и сборка кадра — в animations/stage.js.
'use strict';

// размеры как в образце: шарик ~300 px, большие ~730 px от верха шляпы/черепа до подошв
const ST = Stage({
  name: 'skeleton-vs-lord',
  cast: {
    lord: { small: ['lord-verity-small', { bodyHeight: 300 }], big: ['lord-verity-big', { height: 730 }], pivot: 337 },
    skel: { small: ['skeleton-verity-small', { scale: 0.455 }], big: ['skeleton-verity-big', { height: 730 }], pivot: 325 },
  },
  order: ['skel', 'lord'],   // Скелет дальше, Лорд ближе к зрителю
});
const { GROUND, C, key, move, ev, hop, tumble, laugh, tremble, transform, stance, walk, target, statesAt } = ST;

// ================================================================== 0–4 с: стойка
// Лорд слева смотрит вправо, Скелет справа смотрит влево; оба маленькие и злые, не двигаются
key('lord', 0, { form: 'small', x: 560, y: GROUND, face: 1, look: 1, eyes: 'angry', mouth: 'theeth smile', sx: 1, sy: 1, rot: 0 }, 0);
key('skel', 0, { form: 'small', x: 1360, y: GROUND, face: -1, look: 1, eyes: 'angry', mouth: 'smile normal', sx: 1, sy: 1, rot: 0 }, 0);

// ================================================================== 4–8 с: удар головой
hop('lord', 100, 112, 560, 700, 80, { dust: true });
hop('lord', 120, 132, 700, 840, 80, { dust: true });
key('lord', 140, { sx: 1.24, sy: 0.78 }, 6);                       // присел, набирает силу
tremble('lord', 140, 150, 840, 3);
key('lord', 152, { sx: 0.8, sy: 1.18 }, 2);                        // бросок головой вперёд
move('lord', 150, { x: 840, y: GROUND });
move('lord', 153, { y: GROUND - 26 }, 'out2');
move('lord', 156, { y: GROUND - 4 }, 'in2');
move('lord', 156, { x: 1066 }, 'in2');
key('lord', 156, { sx: 0.76, sy: 1.2 }, 1);                        // сплющился о соперника
ev('spark', { f: 156, at: [1214, GROUND - 165], r: 66 });
ev('shake', { f: 156, amp: 12, n: 10 });
ev('zoom', { f: 156, n: 10, k: 0.05, at: [1214, GROUND - 165] });
key('skel', 156, { sx: 1, sy: 1 }, 0);
key('skel', 158, { sx: 0.86, sy: 1.1, eyes: 'sad', mouth: 'puzzlement' }, 2);   // живот сжался
key('skel', 160, { sx: 1.1, sy: 0.92 }, 2);
tumble('skel', 160, 186, 1360, 1590, 280, 2, { stars: 16 });
key('skel', 187, { eyes: 'sad', mouth: 'sad' }, 0);
// Лорд отскакивает назад и смеётся
move('lord', 160, { y: GROUND - 50 }, 'out2');
move('lord', 166, { y: GROUND }, 'in2');
move('lord', 166, { x: 990 }, 'out2');
key('lord', 160, { sx: 1, sy: 1 }, 4);
key('lord', 166, { sx: 1.15, sy: 0.86 }, 1);
key('lord', 171, { sx: 1, sy: 1 }, 4);
key('lord', 172, { mouth: 'happy with theeth', eyes: 'normal' }, 0);
laugh('lord', 174, 206);

// ================================================================== 8–11 с: Скелет превращается
const SKX = 1470;
const SKB = transform('skel', 206, 1590, SKX, -1);
// Лорд пугается: рот «О», дрожь, пот — потом злится
key('lord', 248, { mouth: 'puzzlement', eyes: 'sad' }, 0);
tremble('lord', 250, 270, 990, 2);
ev('sweat', { who: 'lord', f0: 250, f1: 280 });
key('lord', 280, { eyes: 'angry', mouth: 'sad' }, 0);

// ================================================================== 11–13.5 с: шлепок
ev('spark', { f: 300, at: 'lord:cheek', r: 70 });
ev('shake', { f: 300, amp: 14, n: 10 });
ev('zoom', { f: 300, n: 12, k: 0.06, at: 'lord:cheek' });
key('lord', 298, { eyes: 'angry', mouth: 'sad' }, 0);
key('lord', 301, { sx: 0.82, sy: 1.12, eyes: 'sad', mouth: 'puzzlement' }, 1);
tumble('lord', 302, 326, 990, 640, 250, -2, { stars: 22 });
key('lord', 327, { eyes: 'sad', mouth: 'sad' }, 0);

// ================================================================== 13.5–16.5 с: Лорд превращается
const LX = 640;
const LB = transform('lord', 352, 640, LX, 1);

// позы больших — после загрузки ригов (нужны размеры рук и ног)
const BIG = () => {
  // ---- Скелет большой: гордо стоит, крылья приподняты
  key('skel', SKB, stance('skel', SKX, -1, { b_B16: 12, b_B17: -12 }), 0);
  key('skel', 294, { mouth: 'angry theeth' }, 0);
  walk('skel', 270, SKX, 1325, 2, 10, -1);
  key('skel', 296, { handF: [-320, 380], lean: -8, hip: [0, 60], b_B16: 0, b_B17: 0, hitF: 0 }, 6);     // замах назад-вниз
  key('skel', 299, { over: 'F' }, 0);
  key('skel', 300, { handF: [260, 330], lean: 20, hip: [10, 140], hitF: 1, hitFto: 'lord:cheek', hitFfix: 300 }, 4, 'in2');
  key('skel', 306, { hitF: 1 }, 1);
  key('skel', 314, { hitF: 0, handF: [200, 380], lean: 10, hip: [0, 80], over: null }, 8);
  key('skel', 322, { ...stance('skel', 1325, -1), b_B16: 0, b_B17: 0, mouth: 'happy with theeth' }, 8);
  key('skel', 346, { b_B16: 12, b_B17: -12 }, 8);
  // ---- Скелет пугается превращения Лорда: крылья вниз, рот «О», пот; потом злится
  key('skel', 396, { mouth: 'puzzlement', lean: -8, head: -6, b_B16: 45, b_B17: -45 }, 6);
  ev('sweat', { who: 'skel', f0: 398, f1: 420 });
  key('skel', 418, { mouth: 'angry theeth', lean: 4, head: 0, b_B16: 12, b_B17: -12 }, 6);

  // ---- 17–19 с: Скелет бьёт, Лорд отскакивает назад — промах
  key('lord', LB, stance('lord', LX, 1), 0);
  walk('skel', 420, 1325, 1060, 2, 10, -1);
  key('skel', 446, { handF: [-200, 60], lean: -10, hip: [0, 50] }, 6);             // замах
  key('skel', 452, { handF: [420, -60], lean: 22, hip: [30, 60] }, 4, 'out');     // удар
  ev('whoosh', { f: 453, at: [LX + 70, GROUND - 600] });
  key('skel', 456, { mouth: 'puzzlement' }, 0);
  key('skel', 466, { ...stance('skel', 1060, -1), mouth: 'angry theeth', b_B16: 12, b_B17: -12 }, 10);
  // отскок: таз назад-вниз, корпус откинут, колени вперёд
  key('lord', 444, { hip: [0, 40] }, 4);
  key('lord', 448, { hip: [0, 70], lean: -6 }, 4);
  move('lord', 448, { x: LX, y: GROUND });
  key('lord', 449, { legFfk: 1, legBfk: 1, legF: [12, -24], legB: [-14, 26], lean: -18, head: -8, hip: [-20, 40],
    handF: [120, 300], handB: [-160, 380], mouth: 'puzzlement' }, 3);
  move('lord', 453, { y: GROUND - 40 }, 'out2');
  move('lord', 458, { y: GROUND }, 'in2');
  move('lord', 458, { x: LX - 160 }, 'out2');
  key('lord', 456, { ...C.lord.big.feet(LX - 160, 1), legFfk: 1, legBfk: 1 }, 0);
  key('lord', 460, { legFfk: 0, legBfk: 0, hip: [0, 90], lean: -4, head: 0 }, 3);
  ev('dust', { f: 458, x: LX - 160, r: 30, n: 4 });
  const L2 = LX - 160;
  key('lord', 468, { ...stance('lord', L2, 1), mouth: 'mouth' }, 8);

  // ---- 19.5–20.5 с: шляпа-бумеранг — дальней рукой (она за головой, лицо не закрывает)
  // берёт шляпу за правый край, заносит над головой и бросает вперёд
  key('lord', 474, { handF: [122, -483] }, 6);
  HAT.f0 = 474;
  key('lord', 480, { handF: [-271, -592], lean: -6 }, 6);                          // замах над головой
  key('lord', 484, { handF: [489, -266], lean: 12, mouth: 'theeth smile' }, 4, 'in2');
  HAT.release = 484; HAT.hit = 492; HAT.back = 506;
  key('lord', 496, { ...stance('lord', L2, 1), mouth: 'mouth' }, 8);
  key('skel', 491, { head: 0, lean: 4 }, 0);
  key('skel', 494, { head: -18, lean: -10, mouth: 'puzzlement', b_B16: 40, b_B17: -40 }, 2, 'out');
  ev('spark', { f: 492, at: 'skel:face', r: 60 });
  ev('shake', { f: 492, amp: 10, n: 8 });
  ev('stars', { who: 'skel', f0: 496, f1: 530 });
  key('skel', 504, { head: -6, lean: -4 }, 6);
  walk('skel', 500, 1060, 1110, 1, 10, -1, false);                                 // отшатнулся назад
  key('lord', 506, { head: 4 }, 2);                                                // шляпа села на место
  key('lord', 510, { head: 0, mouth: 'happy with theeth' }, 4);

  // ---- 21–22 с: апперкот
  const LX3 = 800;
  key('lord', 514, { hip: [0, 150], lean: 12, handF: [-80, 260], mouth: 'angry theeth' }, 6);    // присел, набрал силу
  tremble('lord', 514, 522, L2, 3);
  walk('lord', 522, L2, LX3, 2, 6, 1, false);
  key('lord', 532, { hip: [0, 120], lean: 14, handF: [120, 240], hitF: 0 }, 3);
  key('lord', 536, { hip: [0, 10], lean: 4, handF: [220, -380], hitF: 1, hitFto: 'skel:jaw', hitFfix: 536 }, 3, 'in2');
  key('lord', 541, { hitF: 0, handF: [320, -600] }, 5);                            // кулак уходит вверх
  key('lord', 544, { mouth: 'happy with theeth' }, 0);
  ev('spark', { f: 536, at: 'skel:jaw', r: 90 });
  ev('shake', { f: 536, amp: 20, n: 14 });
  ev('zoom', { f: 536, n: 14, k: 0.1, at: 'skel:jaw' });
  // Скелет улетает вверх-вправо, кувыркаясь, за кадр — на месте блеск
  key('skel', 536, { pivot: 880, legFfk: 1, legBfk: 1, legF: [-30, 50], legB: [25, -40], mouth: 'puzzlement',
    handF: [-150, -200], handB: [-250, -150] }, 0);
  move('skel', 536, { x: 1110, y: GROUND, rot: 0 });
  move('skel', 568, { x: 2120, rot: 1080 }, 'lin');
  move('skel', 568, { y: -420 }, 'out2');
  for (let f = 538; f < 568; f += 4) key('skel', f, { b_B16: (f / 4) % 2 ? -20 : 40, b_B17: (f / 4) % 2 ? 20 : -40 }, 2);
  ev('twinkle', { f: 566, at: [1830, 110], n: 22, size: 56 });

  // ---- 22.5–25 с: победитель идёт в центр, поворачивается к зрителю, руки вверх
  walk('lord', 548, LX3, 960, 2, 10, 1);
  key('lord', 570, { look: 0 }, 4);
  key('lord', 575, { handF: [440, -40], handB: [-440, -40] }, 3);                  // руки через стороны
  key('lord', 578, { handF: [170, -560], handB: [-170, -560], head: -4, mouth: 'happy with theeth' }, 3);
  for (const [f, x, y] of [[578, 790, 260], [584, 1130, 200], [590, 760, 470], [594, 1170, 430], [598, 960, 120]]) {
    ev('twinkle', { f, at: [x, y], n: 16, size: 34 });
  }
};
const HAT = {};

// шляпа Лорда: в руке -> летит, кувыркаясь, в лицо Скелету -> по дуге обратно на голову
function hatMatrix(f) {
  const L = C.lord.big;
  const hat = L.layers.find((l) => l.name === 'hat');
  const hc = [(hat.bbox[0] + hat.bbox[2]) / 2, (hat.bbox[1] + hat.bbox[3]) / 2];
  const onHead = (g) => L.layerMatrix(statesAt(g).lord.st, 'hat');
  // в руке: в момент хвата шляпа на месте, за 6 кадров садится на кисть (держит снизу за поля)
  const inHand = (g) => {
    const hand = L.point(statesAt(g).lord.st, 'handF');
    const hand0 = L.point(statesAt(HAT.f0).lord.st, 'handF');
    const M0 = onHead(HAT.f0);
    const c0 = E.apply(M0, hc);
    const k = E.EASE.io(E.clamp((g - HAT.f0) / 6, 0, 1));
    const off = [E.lerp(c0[0] - hand0[0], -20, k), E.lerp(c0[1] - hand0[1], -35, k)];
    return E.mul(E.T(hand[0] + off[0] - c0[0], hand[1] + off[1] - c0[1]), M0);
  };
  if (f < HAT.release) return f <= HAT.f0 ? onHead(f) : inHand(f);
  const M1 = inHand(HAT.release);
  const c1 = E.apply(M1, hc);
  const hitP = target('skel:face', statesAt(HAT.hit));
  const back = onHead(HAT.back), cb = E.apply(back, hc);
  const spin = (a, c, M) => E.mul(E.T(c[0], c[1]), E.mul(E.R(a), E.mul(E.T(-c1[0], -c1[1]), M)));
  if (f <= HAT.hit) {
    const u = (f - HAT.release) / (HAT.hit - HAT.release);
    const c = [E.lerp(c1[0], hitP[0], u), E.lerp(c1[1], hitP[1], u) - Math.sin(Math.PI * u) * 60];
    return spin(-E.rad(720) * u, c, M1);
  }
  const u = Math.min(1, (f - HAT.hit) / (HAT.back - HAT.hit));
  const c = [E.lerp(hitP[0], cb[0], u), E.lerp(hitP[1], cb[1], u) - Math.sin(Math.PI * u) * 70];
  const tilt = Math.atan2(back[1], back[0]) - Math.atan2(M1[1], M1[0]);
  return spin(E.lerp(-E.rad(720), -E.rad(1440) + tilt, E.EASE.out2(u)), c, M1);
}

// пока шляпа не на голове, она рисуется отдельно, поверх всех
ST.hooks.drawPose = (who, p, f) =>
  (who === 'lord' && p.form === 'big' && f >= (HAT.f0 || 1e9) && f < HAT.back ? { ...p, hide: [...(p.hide || []), 'hat'] } : p);
ST.hooks.afterChars.push((ctx, f, S, CAM) => {
  if (!HAT.f0 || f < HAT.f0 || f >= HAT.back) return;
  const L = C.lord.big, hat = L.layers.find((l) => l.name === 'hat');
  ctx.setTransform(...E.mul(CAM, hatMatrix(f)));
  ctx.drawImage(hat.img.canvas, hat.img.x, hat.img.y, hat.img.w, hat.img.h);
});

ST.start(BIG);
