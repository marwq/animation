// Ролик 10: Два поклонника — Лорд и Скелет из-за Жёлтой, 25 с, 24 кадра/с, звуковые эффекты
// без музыки, по стилю «animal hospital long» (docs/animal_hospital_long.md).
//
//   0–4 с     шарик-Лорд (слева) и шарик-Скелет (справа) неподвижно смотрят друг на друга
//   4–6 с     между ними с неба падает шарик-Жёлтая и сразу становится большой — оба влюбились
//   6.5–9 с   оба скачут к ней обниматься — она наклоняется и щелчками отправляет обоих кувырком
//   10–12 с   оба злятся и становятся большими; снова влюблены, идут к ней с двух сторон
//   14–16 с   ссорятся через её голову: Лорд бросает шляпу Скелету в лицо
//   16.5–17.5 Скелет машет крыльями — ветер сдувает Лорда назад
//   18–21 с   Жёлтая злится: пощёчина Скелету (кружится), пинок Лорду (улетает за кадр),
//             пинок Скелету (за кадр)
//   21–25 с   Жёлтая в центре, руки вверх
'use strict';

const ST = Stage({
  name: 'v10-two-admirers',
  cast: {
    lord: { small: ['lord-verity-small', { bodyHeight: 300 }], big: ['lord-verity-big', { height: 730 }], pivot: 337,
      voice: 1.0, lie: 80 },
    skel: { small: ['skeleton-verity-small-v1', { scale: 0.455 }], big: ['skeleton-verity-big', { height: 730 }], pivot: 325,
      voice: 0.9, lie: 60 },
    girl: { small: ['girl-verity-small', { bodyHeight: 300, recolor: 'yellow' }],
      big: ['verity-big-girl', { height: 730, splitFeet: true, recolor: 'yellow' }], pivot: 337, voice: 1.4, vAngle: 50,
      moods: { angry: 'sad', grin: 'theeth smile', big: 'smile normal' } },
  },
  order: ['skel', 'lord', 'girl'],
  background: { sky: ['#47a7f0', '#aed2f4', '#f8e6d4'], seed: 141 },
  clouds: [[90, 100, 1.1, 1, 23], [480, 220, 0.8, 2, 29], [870, 70, 1.0, 0, 20], [1300, 190, 1.2, 1, 26],
    [1700, 90, 0.9, 2, 31], [1100, 300, 0.7, 0, 22]],
});
const { GROUND, C, key, move, ev, sfx, hop, tumble, laugh, tremble, transform, love, stance, walk, turn,
  strike, kick, dodge, duck, recoil, fallBack, getUp, flyOff, victory, chuckle, spinAround, hand, toRig,
  statesAt, stateAt } = ST;

const GX = 960;
const CAST_PIVOT = { lord: 337, skel: 325 };
// ================================================================== 0–4 с: стойка (Жёлтая над кадром)
key('lord', 0, { form: 'small', x: 560, y: GROUND, face: 1, look: 1, eyes: 'angry', mouth: 'theeth smile', sx: 1, sy: 1, rot: 0 }, 0);
key('skel', 0, { form: 'small', x: 1360, y: GROUND, face: -1, look: 1, eyes: 'angry', mouth: 'theeth smile', sx: 1, sy: 1, rot: 0 }, 0);
key('girl', 0, { form: 'small', x: GX, y: -400, face: 1, look: 0, eyes: 'normal', mouth: 'smile normal', sx: 1, sy: 1, rot: 0 }, 0);

// ================================================================== 4–6 с: падает с неба и сразу большая
const FALL = 96, LANDG = 108;
move('girl', FALL, { y: -400 });
move('girl', LANDG, { y: GROUND }, 'in2');
key('girl', LANDG, { sx: 1.3, sy: 0.7 }, 1);
key('girl', LANDG + 4, { sx: 0.94, sy: 1.08 }, 4);
key('girl', LANDG + 8, { sx: 1, sy: 1 }, 4);
sfx('whoosh', FALL, { x: GX, dur: LANDG - FALL, gain: 0.5 });
ev('dust', { f: LANDG, x: GX, r: 40, n: 6, snd: 'land' });
key('lord', LANDG + 2, { mouth: 'puzzlement', eyes: 'normal' }, 0);
key('skel', LANDG + 2, { mouth: 'puzzlement', eyes: 'normal' }, 0);
const GB = transform('girl', 114, GX, GX, 1, { fast: true, love: ['lord', 'skel'], loveDur: 96 });

// ================================================================== 6.5–9 с: скачут обниматься — два щелчка
hop('lord', 156, 168, 560, 745, 60);
hop('skel', 156, 168, 1360, 1220, 60);
for (const who of ['lord', 'skel']) for (let f = 172; f < 186; f += 4) key(who, f, { rot: (f / 4) % 2 ? -6 : 6 }, 2);
const FL = 190;
for (const [who, x0, x1, turns] of [['lord', 745, 470, -2], ['skel', 1220, 1450, 2]]) {
  key(who, FL, { rot: 0, eyes: 'sad', mouth: 'puzzlement' }, 2);
  tumble(who, FL + 1, FL + 30, x0, x1, 300, turns, { stars: 24, hurt: true });
}
// ================================================================== 10–12 с: оба большие
const LX = 500, SX = 1440;
const LB = transform('lord', 246, 470, LX, 1);
const SB = transform('skel', 246, 1450, SX, -1);

const BIG = () => {
  const G = C.girl.big;
  key('girl', GB, stance('girl', GX, 1, { look: 0 }), 0);
  key('girl', GB + 8, { mouth: 'mini smile', look: 0 }, 0);
  // наклоняется к влюблённым шарикам — два щелчка разом, смеётся
  key('girl', FL - 12, { lean: 12, hip: [0, toRig('girl', 150)], head: 14, mouth: 'theeth smile', look: 0,
    handF: hand('girl', 'F', 0.3, 0.5), handB: hand('girl', 'B', 0.3, 0.5), zB: 'front' }, 8);
  key('girl', FL - 3, { handF: hand('girl', 'F', 0.1, 0.6), handB: hand('girl', 'B', 0.1, 0.6) }, 3);
  key('girl', FL, { hitF: 1, hitFto: 'skel:face', hitFfix: FL, hitB: 1, hitBto: 'lord:face', hitBfix: FL }, 2, 'in2');
  key('girl', FL + 4, { hitF: 0, hitB: 0 }, 3);
  key('girl', FL + 16, { ...stance('girl', GX, 1), zB: null, look: 0, mouth: 'happy with theeth' }, 10);
  ev('spark', { f: FL, at: 'skel:face', r: 46, snd: 'flick', swing: false, hurt: false });
  ev('spark', { f: FL, at: 'lord:face', r: 46, snd: 'flick', swing: false, hurt: false });
  ev('shake', { f: FL, amp: 8, n: 6 });
  chuckle('girl', FL + 18, FL + 44, { mouth: 'happy with theeth' });
  key('girl', LB, { mouth: 'puzzlement' }, 0);

  // ---- большие, снова влюблены, идут к ней с двух сторон
  key('lord', LB, stance('lord', LX, 1), 0);
  key('skel', SB, stance('skel', SX, -1, { b_B16: 12, b_B17: -12 }), 0);
  love('lord', LB + 6, 334, { mouth: 'happy - spittle' });
  love('skel', SB + 6, 334, { mouth: 'happy - spittle' });
  key('girl', LB + 8, { mouth: 'theeth smile', eyes: 'normal' }, 0);
  const L1 = 690, S1 = 1300;
  walk('lord', LB + 12, LX, L1, 2, 12, 1, false);
  walk('skel', SB + 12, SX, S1, 2, 12, -1, false);
  key('lord', LB + 12, { handF: hand('lord', 'F', 0.8, 0.1) }, 8);              // руку к ней
  key('skel', SB + 12, { handF: hand('skel', 'F', 0.8, 0.1) }, 8);
  key('girl', 318, { look: -1 }, 3);                                             // смотрит то на одного,
  key('girl', 326, { look: 1 }, 3);                                              // то на другого
  // ---- ссорятся через её голову
  key('lord', 336, { mouth: 'angry theeth', eyes: 'angry', handF: stance('lord', L1, 1).handF, head: -6 }, 4);
  key('skel', 336, { mouth: 'angry theeth', eyes: 'angry', handF: stance('skel', S1, -1).handF, head: -6 }, 4);
  ev('vein', { who: 'lord', f0: 338, f1: 356 });
  ev('vein', { who: 'skel', f0: 338, f1: 356 });
  sfx('anger', 338, { who: 'lord', dur: 18, gain: 0.6 });
  key('girl', 338, { look: 0, mouth: 'puzzlement' }, 3);

  // ---- Лорд бросает шляпу Скелету в лицо
  HAT.take = 356; HAT.release = 368; HAT.hit = 380; HAT.ground = 398;
  key('lord', HAT.take - 6, { handF: [122, -483], head: 0 }, 6);
  key('lord', HAT.release - 4, { handF: [-271, -592], lean: -6 }, 6);
  key('lord', HAT.release, { handF: [489, -266], lean: 12 }, 4, 'in2');
  key('lord', HAT.release + 10, stance('lord', L1, 1, { mouth: 'theeth smile' }), 8);
  sfx('swing', HAT.release - 4, { who: 'lord' });
  sfx('whoosh', HAT.release, { x: GX, dur: HAT.hit - HAT.release, gain: 0.6 });
  ev('spark', { f: HAT.hit, at: 'skel:face', r: 60, snd: 'bonk', swing: false });
  key('skel', HAT.hit + 1, { head: -16, lean: -8 }, 2, 'out');
  key('skel', HAT.hit + 10, { head: 0, lean: 0 }, 8);
  ev('dust', { f: HAT.ground, x: S1 + 30, r: 22, n: 3, snd: 'land' });

  // ---- Скелет машет крыльями — ветер сдувает Лорда назад
  const G0 = 404, G1 = 440, L2 = 420;
  key('skel', G0 - 4, { lean: 8, hip: [0, toRig('skel', 30)] }, 4);
  for (let f = G0; f < G1; f += 6) {
    key('skel', f, { b_B16: -26, b_B17: 26 }, 3);
    key('skel', f + 3, { b_B16: 46, b_B17: -46 }, 3, 'in');
  }
  key('skel', G1 + 6, { lean: 0, hip: [0, toRig('skel', 8)], b_B16: 12, b_B17: -12, mouth: 'happy with theeth' }, 6);
  ev('wind', { f0: G0 + 2, f1: G1 + 4, x0: S1 - 200, x1: 60 });
  key('lord', G0 + 4, { ...stance('lord', L1, 1), lean: -24, head: -12, hip: [toRig('lord', -20), toRig('lord', 40)],
    mouth: 'puzzlement', eyes: 'sad', handF: hand('lord', 'F', -0.4, -0.7), handB: hand('lord', 'B', -0.8, -0.3) }, 4);
  key('lord', G1, { ...stance('lord', L2, 1), lean: -24, head: -12, hip: [toRig('lord', -20), toRig('lord', 40)],
    handF: hand('lord', 'F', -0.4, -0.7), handB: hand('lord', 'B', -0.8, -0.3) }, G1 - G0 - 4, 'in');
  key('lord', G1 + 10, stance('lord', L2, 1, { mouth: 'angry theeth', eyes: 'angry' }), 8);
  // её юбку и бант тоже треплет — она стоит, жмурится
  key('girl', G0 + 2, { eyes: 'sad', mouth: 'sad', lean: -4 }, 3);
  key('girl', G1 + 4, { eyes: 'angry', mouth: 'angry theeth', lean: 0 }, 3);

  // ---- Жёлтая злится: пощёчина Скелету, пинок Лорду, пинок Скелету
  ev('vein', { who: 'girl', f0: G1 + 4, f1: G1 + 24 });
  ev('steam', { who: 'girl', f0: G1 + 6, f1: G1 + 24 });
  sfx('anger', G1 + 4, { who: 'girl', dur: 20, gain: 0.7 });
  turn('girl', G1 + 18, -1, GX);                                                // глянула на Лорда
  turn('girl', G1 + 26, 1, GX);                                                 // и на Скелета
  const SL = 476, GX2 = 1085;
  walk('girl', SL - 12, GX, GX2, 1, 8, 1);                                       // шаг к Скелету
  strike('girl', SL, 'skel:cheek', { x: GX2, face: 1, snd: 'slap', back: [-0.5, -0.3], to: [1, -0.3] });
  spinAround('skel', SL + 1, S1, -1, { n: 6, stars: 30 });
  // Лорд снова идёт на неё — пинок, за кадр
  turn('girl', SL + 16, -1, GX2);
  walk('lord', SL - 6, L2, 862, 3, 8, 1);
  const K1 = 506;
  kick('girl', K1, 'lord:body', { x: GX2, face: -1, hard: true });
  flyOff('lord', K1 + 1, K1 + 28, [862, GROUND], [-300, -260], { turns: 3 });
  // и Скелету, пока у него кружится голова
  turn('girl', K1 + 20, 1, GX2);
  walk('skel', 516, S1, 1262, 1, 10, -1, false);                                  // шатаясь, шагнул к ней
  const K2 = 536;
  kick('girl', K2, 'skel:body', { x: GX2, face: 1, hard: true });
  flyOff('skel', K2 + 1, K2 + 28, [1262, GROUND], [2260, -280], { turns: 3 });
  // ---- победа
  key('girl', K2 + 14, { mouth: 'happy with theeth', eyes: 'normal' }, 0);
  victory('girl', K2 + 18, GX2);
};

const HAT = {};
// шляпа Лорда: на голове -> в руке -> летит в лицо Скелету -> падает на траву и лежит
function hatMatrix(f) {
  const L = C.lord.big, hat = L.layers.find((l) => l.name === 'hat');
  const hc = [(hat.bbox[0] + hat.bbox[2]) / 2, (hat.bbox[1] + hat.bbox[3]) / 2];
  const onLord = (g) => L.layerMatrix(statesAt(g).lord.st, 'hat');
  const lordHand = (g) => {
    const hand0 = L.point(statesAt(HAT.take).lord.st, 'handF'), M0 = onLord(HAT.take), c0 = E.apply(M0, hc);
    const h = L.point(statesAt(g).lord.st, 'handF');
    const k = E.EASE.io(E.clamp((g - HAT.take) / 6, 0, 1));
    const off = [E.lerp(c0[0] - hand0[0], -20, k), E.lerp(c0[1] - hand0[1], -35, k)];
    return E.mul(E.T(h[0] + off[0] - c0[0], h[1] + off[1] - c0[1]), M0);
  };
  if (f < HAT.release) return f <= HAT.take ? onLord(f) : lordHand(f);
  const M1 = lordHand(HAT.release), c1 = E.apply(M1, hc);
  const spin = (a, c) => E.mul(E.T(c[0], c[1]), E.mul(E.R(a), E.mul(E.T(-c1[0], -c1[1]), M1)));
  const hitP = ST.target('skel:face', statesAt(HAT.hit));
  if (f <= HAT.hit) {
    const u = (f - HAT.release) / (HAT.hit - HAT.release);
    return spin(-4 * Math.PI * u, [E.lerp(c1[0], hitP[0], u), E.lerp(c1[1], hitP[1], u) - Math.sin(Math.PI * u) * 160]);
  }
  const u = E.clamp((f - HAT.hit) / (HAT.ground - HAT.hit), 0, 1);
  const gy = GROUND - (hat.bbox[3] - hat.bbox[1]) * L.scale * 0.5 + 6;
  return spin(-4 * Math.PI - 2 * Math.PI * E.EASE.out2(u), [hitP[0] + 140 * u, E.lerp(hitP[1], gy, u * u)]);
}
ST.hooks.drawPose = (who, p, f) =>
  (who === 'lord' && p.form === 'big' && HAT.take && f >= HAT.take ? { ...p, hide: [...(p.hide || []), 'hat'] } : p);
ST.hooks.afterChars.push((ctx, f, S, CAM) => {
  if (!HAT.take || f < HAT.take) return;
  const hat = C.lord.big.layers.find((l) => l.name === 'hat');
  ctx.setTransform(...E.mul(CAM, hatMatrix(f)));
  ctx.drawImage(hat.img.canvas, hat.img.x, hat.img.y, hat.img.w, hat.img.h);
});

ST.start(BIG);
