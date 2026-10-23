// Лорд против Малыша — драка 25 с, 24 кадра/с, со звуковыми эффектами (без музыки),
// по стилю «animal hospital long» (docs/animal_hospital_long.md).
//
//   0–4 с     шарик-Лорд (слева) и шарик-Малыш (справа) неподвижно смотрят друг на друга
//   4–5 с     Лорд сразу превращается в большого; Малыш пугается
//   5–9 с     Лорд подходит, наклоняется и смеётся над малышом — тот раскручивает пропеллер,
//             взлетает и зубами срывает с Лорда шляпу, улетает с ней
//   9–12 с    погоня: Лорд хватает — мимо, прыгает — мимо, Малыш дразнится
//   12–14.5 с Лорд прихлопывает Малыша сверху — тот в лепёшку, шляпа по дуге на голову Лорду
//   14.5–16.5 Малыш злится и превращается в большого (розовый скелет в кепке)
//   17.5–20 с Малыш летит на Лорда головой вперёд — Лорд ныряет вниз, Малыш врезается в траву
//   20.5–22.5 Лорд раскручивает Малышу пропеллер — того уносит в небо, блеск
//   22.5–25 с Лорд в центре, лицом к зрителю, руки вверх
//
// Ключи, помощники движения, звук и сборка кадра — в animations/stage.js.
'use strict';

// размеры как в образце: шарик ~300 px, большие ~730 px от верха шляпы/кепки до подошв
const ST = Stage({
  name: 'lord-vs-baby',
  cast: {
    lord: { small: ['lord-verity-small', { bodyHeight: 300 }], big: ['lord-verity-big', { height: 730 }], pivot: 337,
      voice: 1.0 },
    baby: { small: ['child-verity-pink', { bodyHeight: 300, spin: { layer: 'hat', cut: 122, axis: 389 } }],
      big: ['child-verity-big', { height: 730, spin: { layer: 'hat', cut: 106, axis: 330 } }], pivot: 338, voice: 1.3,
      moods: { angry: ' 5', grin: ' 2', big: 'mouth' } },
  },
  order: ['lord', 'baby'],     // Малыш ближе к зрителю (летает перед Лордом)
  background: { sky: ['#4fb0f2', '#b9dcf5', '#e4f1dc'], seed: 41 },
  clouds: [[200, 80, 1.1, 0, 23], [700, 190, 0.9, 2, 29], [1130, 110, 1.2, 1, 19], [1520, 230, 0.8, 0, 26],
    [1820, 70, 1.0, 2, 33], [460, 300, 0.7, 1, 21]],
});
const { GROUND, C, key, move, ev, sfx, hop, tumble, laugh, tremble, transform, stance, walk, statesAt, target } = ST;

// рот шарика-Малыша (зубы ' 2'): здесь он держит шляпу
const mouthOf = (S) => E.apply(C.baby.small.eyeMatrix(S.baby.st, ' 2'), [315, 740]);
ST.parts.mouth = (ch, st) => E.apply(ch.eyeMatrix(st, ' 2'), [315, 740]);
ST.parts.prop = (ch, st) => {               // втулка пропеллера
  const l = ch.layers.find((x) => x.name === 'hat spin');
  return E.apply(ch.layerMatrix(st, 'hat spin'), [l.spinAxis, (l.bbox[1] + l.bbox[3]) / 2]);
};

// большой: испуганный отскок назад (корпус откинут, колени вперёд, приземлился на ноги)
function hopBack(who, f, x0, x1, face) {
  const ch = C[who].big;
  key(who, f, { hip: [0, 40] }, 3);
  move(who, f, { x: x0, y: GROUND });
  key(who, f + 1, { legFfk: 1, legBfk: 1, legF: [12, -24], legB: [-14, 26], lean: -14, head: -6, hip: [-20, 40] }, 3);
  move(who, f + 5, { y: GROUND - 40 }, 'out2');
  move(who, f + 10, { y: GROUND }, 'in2');
  move(who, f + 10, { x: x1 }, 'out2');
  key(who, f + 8, { ...ch.feet(x1, face), legFfk: 1, legBfk: 1 }, 0);
  key(who, f + 12, { legFfk: 0, legBfk: 0, hip: [0, 90], lean: -4, head: 0 }, 3);
  key(who, f + 22, { ...stance(who, x1, face) }, 10);
  ev('dust', { f: f + 10, x: x1, r: 30, n: 4, snd: 'land' });
  sfx('jump', f + 2, { who, gain: 0.5 });
}

// пропеллер: разгон / ровное вращение / остановка (обороты в секунду)
function propeller(who, f0, f1, rps = 6, o = {}) {
  const t0 = f0 / 24, t1 = f1 / 24;
  key(who, f0, { spin: 0, spinBlur: 0 }, 0);
  key(who, f0 + 8, { spinBlur: rps > 4 ? 1 : 0 }, 8);
  move(who, f1, { spin: rps * (t1 - t0) }, 'lin');
  key(who, f1, { spinBlur: 0 }, 6);
  key(who, f1 + 1, { spin: 0 }, 0);
  if (o.snd !== false) sfx('whirr', f0, { who, dur: f1 - f0, gain: o.gain ?? 0.4 });
}
// парит в воздухе: лёгкое покачивание ±a пикселей вокруг y
function hover(who, f0, f1, y, a = 8, period = 12) {
  for (let f = f0, i = 0; f < f1; f += period / 2, i++) move(who, f + period / 2, { y: y + (i % 2 ? -a : a) }, 'io');
}

const LS = 560, BS = 1360;           // стойка

// ================================================================== 0–4 с: стойка
key('lord', 0, { form: 'small', x: LS, y: GROUND, face: 1, look: 1, eyes: 'angry', mouth: 'theeth smile', sx: 1, sy: 1, rot: 0 }, 0);
key('baby', 0, { form: 'small', x: BS, y: GROUND, face: -1, look: 1, eyes: 'angry', mouth: ' 1', sx: 1, sy: 1, rot: 0 }, 0);

// ================================================================== 4–5 с: Лорд сразу большой
const LX = 620;
const LB = transform('lord', 96, LS, LX, 1, { fast: true });
key('baby', LB, { mouth: ' 5', eyes: 'sad' }, 0);
sfx('scared', LB + 2, { who: 'baby', gain: 0.8 });
tremble('baby', LB + 2, LB + 18, BS, 2);
ev('sweat', { who: 'baby', f0: LB + 2, f1: LB + 32 });

// ================================================================== 5–9 с: шляпа в зубах
const HAT = { f0: 168, steal: 200, drop: 296, land: 318 };
const BRIM = [655, 262];                       // правый край полей шляпы Лорда (пиксели рига)
key('baby', 176, { eyes: 'angry', mouth: ' 2' }, 0);
propeller('baby', 182, 296, 7);
const HOV = [1520, GROUND - 250];              // где Малыш парит со шляпой
const SW = [1540, GROUND - 270];               // где его прихлопнут

// ================================================================== 14.5–16.5 с: Малыш превращается
const BX = 1650;
const BB = transform('baby', 346, 1600, BX, -1);

// позы больших — после загрузки ригов
const BIG = () => {
  const L = C.lord.big;
  key('lord', LB, stance('lord', LX, 1), 0);
  key('lord', LB + 6, { mouth: 'happy with theeth' }, 0);

  // ---- Лорд подходит, снимает шляпу и дразнит ею Малыша, как тореадор
  const L1 = 900;
  walk('lord', 130, LX, L1, 3, 10, 1);
  key('lord', HAT.f0, { handF: [122, -483] }, 6);                                 // дальняя рука к шляпе
  key('lord', 176, { handF: [470, 230], lean: 12, hip: [0, 40] }, 8);              // вытянул шляпу к Малышу
  for (const [f, d] of [[182, -40], [188, 20], [194, -30], [199, 0]]) key('lord', f, { handF: [470, 230 + d] }, 3);
  // Малыш поднимается к шляпе и кусает правый край полей
  const S0 = ST.stateAt(HAT.steal);
  const brim = hatInHand(S0, HAT.steal, BRIM);
  const mouth0 = E.apply(C.baby.small.eyeMatrix(S0.baby.st, ' 2'), [315, 740]);
  const bx = BS + (brim[0] - mouth0[0]), by = GROUND + (brim[1] - mouth0[1]);
  move('baby', 188, { x: BS, y: GROUND });
  move('baby', HAT.steal, { x: bx, y: by }, 'io');
  sfx('chomp', HAT.steal, { who: 'baby' });
  move('baby', 214, { x: HOV[0], y: HOV[1] }, 'out2');
  hover('baby', 214, 250, HOV[1], 8);
  // Лорд: рука пустая — «а где шляпа?», хватается за голову, злится
  key('lord', HAT.steal + 2, { mouth: 'puzzlement', handF: [480, 240] }, 0);
  key('lord', 208, { lean: 0, hip: [0, 8], handF: [40, -520] }, 8);                // рука на макушку
  key('lord', 222, { mouth: 'angry theeth' }, 0);
  key('lord', 226, { handF: stance('lord', L1, 1).handF }, 6);

  // ---- 9–12 с: погоня — хватает мимо, Малыш дразнится
  const L2 = 1120, L3 = 1260;
  walk('lord', 228, L1, L2, 2, 10, 1);
  key('lord', 252, { handF: [-180, 260], lean: -6, hip: [0, 40] }, 4);             // замах
  key('lord', 258, { handF: [500, 230], lean: 14, hip: [10, 60] }, 4, 'in2');       // хватает — а он уже выше
  ev('whoosh', { f: 258, at: [HOV[0] - 60, HOV[1] - 150] });
  key('lord', 266, { mouth: 'puzzlement' }, 0);
  key('lord', 274, { ...stance('lord', L2, 1), mouth: 'angry theeth' }, 10);
  move('baby', 250, { x: HOV[0], y: HOV[1] });
  move('baby', 256, { x: HOV[0] + 200, y: HOV[1] - 150 }, 'out2');                  // упорхнул вверх и вбок
  hover('baby', 256, 284, HOV[1] - 150, 8);
  key('baby', 262, { eyes: 'normal' }, 0);
  laugh('baby', 264, 286);
  move('baby', 292, { x: SW[0], y: SW[1] }, 'io');                                  // вернулся — дразнит
  // прихлопнут: шляпа вылетает изо рта, Малыш в лепёшку, потом отлипает
  key('baby', HAT.drop, { eyes: 'sad', mouth: ' 5' }, 0);
  move('baby', HAT.drop, { x: SW[0], y: SW[1] });
  move('baby', 302, { x: SW[0] + 80, y: GROUND }, 'in2');                           // вниз и чуть вправо
  key('baby', 300, { sx: 0.9, sy: 1.1 }, 3);
  key('baby', 302, { sx: 1.6, sy: 0.32 }, 1);
  key('baby', 316, { sx: 1.55, sy: 0.34 }, 14);
  key('baby', 321, { sx: 0.86, sy: 1.16 }, 4, 'out');
  key('baby', 327, { sx: 1, sy: 1 }, 5);
  ev('dust', { f: 302, x: SW[0] + 80, r: 60, n: 8, snd: 'fall' });
  sfx('boing', 316, { who: 'baby', gain: 0.8 });
  ev('stars', { who: 'baby', f0: 324, f1: 346 });

  // ---- 12–14.5 с: прихлопнул сверху
  key('lord', 280, { hip: [0, 150], lean: 6, handF: [-60, -540] }, 6);             // присел, рука вверх-назад
  tremble('lord', 282, 288, L2, 3);
  move('lord', 288, { x: L2, y: GROUND });
  move('lord', 294, { x: L3, y: GROUND - 90 }, 'out2');                             // низкий прыжок
  move('lord', 302, { y: GROUND }, 'in2');
  key('lord', 288, { legFfk: 1, legBfk: 1, legF: [10, -20], legB: [-12, 22], hip: [0, 40] }, 4);
  key('lord', HAT.drop, { handF: [420, 120], handB: [-220, 300], lean: 6, hitF: 1, hitFto: 'baby:top', hitFfix: HAT.drop },
    4, 'in2');
  key('lord', 300, { hitF: 0 }, 4);
  key('lord', 302, { ...L.feet(L3, 1), legFfk: 0, legBfk: 0, hip: [0, 90] }, 0);
  ev('dust', { f: 302, x: L3, r: 30, n: 4, snd: 'land' });
  key('lord', 312, { ...stance('lord', L3, 1), mouth: 'puzzlement' }, 10);
  ev('spark', { f: HAT.drop, at: 'baby:top', r: 70, snd: 'slap' });
  ev('shake', { f: 302, amp: 14, n: 10 });
  ev('zoom', { f: 302, n: 12, k: 0.06, at: [HOV[0], GROUND - 60] });
  // шляпа по дуге садится Лорду на голову
  key('lord', HAT.land, { head: 4 }, 2);
  sfx('pop', HAT.land, { who: 'lord', gain: 0.7 });
  key('lord', 324, { head: 0, mouth: 'happy with theeth' }, 4);
  for (let f = 330; f < 350; f += 6) key('lord', f, { head: (f / 6) % 2 ? 5 : -3 }, 3);   // смеётся
  key('lord', 352, { head: 0 }, 3);

  // ---- 14.5–16.5 с: Малыш злится и становится большим; Лорд пугается
  key('lord', BB, { mouth: 'puzzlement', head: -4 }, 0);
  ev('sweat', { who: 'lord', f0: BB + 2, f1: BB + 26 });
  sfx('scared', BB + 2, { who: 'lord', gain: 0.7 });
  const L5 = 1140;
  hopBack('lord', BB + 4, L3, L5, 1);                                              // испуганно отскочил назад
  key('lord', BB + 30, { mouth: 'theeth smile' }, 0);
  const B = C.baby.big, BP = 990;                // BP — середина роста большого Малыша (пиксели рига)
  key('baby', BB, stance('baby', BX, -1), 0);
  key('baby', BB + 8, { mouth: 'angry theeth' }, 0);

  // ---- 17.5–20 с: летит головой вперёд — Лорд ныряет вниз — Малыш врезается в траву
  const FLY = 426, PASS = 446, CRASH = 462, CX = 560;
  propeller('baby', 420, CRASH, 8);
  key('baby', FLY - 4, { hip: [0, 90], lean: 10, handF: [-140, 300], handB: [-220, 260] }, 4);   // присел перед взлётом
  key('baby', FLY, { pivot: BP, rot: 0, legFfk: 1, legBfk: 1, legF: [-10, 20], legB: [12, -20] }, 0);
  move('baby', FLY, { x: BX, y: GROUND });
  move('baby', FLY + 12, { x: BX - 120, y: GROUND - 240 }, 'out2');               // взлёт и наклон вперёд
  move('baby', FLY + 12, { rot: -86 }, 'io');
  key('baby', FLY + 10, { hip: [0, 0], lean: 0, handF: [80, -560], handB: [0, -540], head: -10 }, 6);   // руки вперёд над головой
  move('baby', PASS + 6, { x: CX + 80, y: GROUND - 240 }, 'lin');                 // быстро над нырнувшим Лордом
  move('baby', CRASH, { x: CX, y: GROUND + 305, rot: -94 }, 'in2');
  key('baby', CRASH + 3, { rot: -90, mouth: 'puzzlement' }, 3);
  move('baby', CRASH + 6, { x: CX - 20 }, 'out2');                                   // проехал по траве
  sfx('whoosh', PASS - 4, { x: L5, dur: 10, gain: 0.8 });
  ev('dust', { f: CRASH, x: CX - 320, r: 70, n: 8, snd: 'slam' });
  ev('dust', { f: CRASH + 4, x: CX - 160, r: 40, n: 5, snd: false });
  ev('shake', { f: CRASH, amp: 20, n: 14 });
  ev('zoom', { f: CRASH, n: 14, k: 0.07, at: [CX - 300, GROUND - 60] });
  sfx('hurt', CRASH + 2, { who: 'baby', gain: 0.9 });
  ev('stars', { who: 'baby', f0: CRASH + 6, f1: 536 });
  for (const f of [474, 484]) { key('baby', f, { legF: [-30, 40] }, 2); key('baby', f + 4, { legF: [-10, 20] }, 3); }
  // Лорд ныряет вниз на согнутых коленях — Малыш пролетает над шляпой; потом смеётся
  // нырок: таз вниз на ~250 px (пиксели рига ÷ масштаб), колени вперёд, корпус ровный
  key('lord', FLY + 8, { hip: [0, 680], lean: 0, head: -6, mouth: 'puzzlement', handF: [120, 280], handB: [-60, 300] }, 6);
  key('lord', PASS + 8, { hip: [0, 680] }, 0);
  key('lord', PASS + 16, { ...stance('lord', L5, 1), mouth: 'puzzlement' }, 8);
  key('lord', CRASH + 4, { sx: 0.3 }, 1);                                          // разворот к Малышу
  key('lord', CRASH + 5, { face: -1, ...L.feet(L5, -1), look: 1 }, 0);
  key('lord', CRASH + 6, { sx: 1, mouth: 'happy with theeth' }, 1);
  for (let f = CRASH + 10; f < 490; f += 6) key('lord', f, { head: (f / 6) % 2 ? 5 : -3 }, 3);
  key('lord', 492, { head: 0 }, 3);

  // ---- встаёт, кружится голова (стоит спиной к Лорду)
  key('baby', 494, { rot: -90 }, 0);
  move('baby', 494, { x: CX - 20, y: GROUND + 305 });
  move('baby', 508, { x: CX, y: GROUND, rot: 0 }, 'io');
  key('baby', 508, { ...stance('baby', CX, -1), legFfk: 0, legBfk: 0, hip: [0, 200], lean: -14, mouth: 'sad' }, 12);
  for (let f = 512; f < 540; f += 8) key('baby', f, { head: (f / 8) % 2 ? 10 : -10 }, 4);

  // ---- 20.5–22.5 с: Лорд подходит сзади и раскручивает пропеллер — Малыша уносит в небо
  const L4 = 805, FL = 524;
  walk('lord', 494, L5, L4, 3, 9, -1);
  key('lord', FL - 6, { handF: [-80, -420], lean: -4 }, 5);                        // рука к пропеллеру
  key('lord', FL, { handF: [260, -520], lean: 18, hitF: 1, hitFto: 'baby:prop', hitFfix: FL }, 3, 'in2');
  key('lord', FL + 3, { hitF: 0, handF: [300, -560] }, 3);
  ev('spark', { f: FL, at: 'baby:prop', r: 36, snd: 'flick', hurt: false });
  key('lord', FL + 12, { ...stance('lord', L4, -1), mouth: 'happy with theeth' }, 8);
  propeller('baby', FL, 572, 12, { gain: 0.65 });
  key('baby', FL + 2, { mouth: 'puzzlement', head: -10, lean: 0, hip: [0, 8] }, 3);
  sfx('scared', FL + 8, { who: 'baby', gain: 0.8 });
  key('baby', FL + 6, { pivot: BP, legFfk: 1, legBfk: 1, legF: [-20, 30], legB: [15, -25],
    handF: [260, -480], handB: [120, -520] }, 4);                                   // руки вверх, от Лорда
  move('baby', FL + 6, { x: CX, y: GROUND, rot: 0 });
  move('baby', 556, { x: CX - 520, y: GROUND - 1250, rot: -720 }, 'in');
  ev('twinkle', { f: 554, at: [120, 70], n: 22, size: 56 });

  // ---- 22.5–25 с: Лорд в центре, лицом к зрителю, руки вверх
  key('lord', 541, { sx: 0.3 }, 1);
  key('lord', 542, { face: 1, ...L.feet(L4, 1) }, 0);
  key('lord', 543, { sx: 1 }, 1);
  walk('lord', 544, L4, 960, 2, 10, 1);
  key('lord', 566, { look: 0 }, 4);
  key('lord', 570, { handF: [440, -40], handB: [-440, -40] }, 3);                  // руки через стороны
  key('lord', 574, { handF: [170, -560], handB: [-170, -560], head: -4, mouth: 'happy with theeth' }, 3);
  for (const [f, x, y] of [[575, 790, 260], [581, 1130, 200], [587, 760, 470], [591, 1170, 430], [596, 960, 110]]) {
    ev('twinkle', { f, at: [x, y], n: 16, size: 34 });
  }
};

// шляпа в руке Лорда (кисть держит поля снизу), точка pt шляпы на сцене
function hatInHand(S, f, pt) { return E.apply(hatHandMatrix(S, f), pt); }
function hatHandMatrix(S, f) {
  const L = C.lord.big, hat = L.layers.find((l) => l.name === 'hat');
  const hc = [(hat.bbox[0] + hat.bbox[2]) / 2, (hat.bbox[1] + hat.bbox[3]) / 2];
  const S0 = ST.stateAt(HAT.f0);
  const M0 = L.layerMatrix(S0.lord.st, 'hat');
  const c0 = E.apply(M0, hc), hand0 = L.point(S0.lord.st, 'handF');
  const hand = L.point(S.lord.st, 'handF');
  const k = E.EASE.io(E.clamp((f - HAT.f0) / 6, 0, 1));
  const off = [E.lerp(c0[0] - hand0[0], -20, k), E.lerp(c0[1] - hand0[1], -35, k)];
  return E.mul(E.T(hand[0] + off[0] - c0[0], hand[1] + off[1] - c0[1]), M0);
}
// шляпа: на голове -> в руке -> в зубах у Малыша (свисает) -> по дуге на голову
function hatMatrix(f) {
  const L = C.lord.big, hat = L.layers.find((l) => l.name === 'hat');
  const hc = [(hat.bbox[0] + hat.bbox[2]) / 2, (hat.bbox[1] + hat.bbox[3]) / 2];
  if (f < HAT.steal) return hatHandMatrix(statesAt(f), f);
  const Ms = hatHandMatrix(statesAt(HAT.steal), HAT.steal), bs = E.apply(Ms, BRIM);
  const inMouth = (g) => {
    const m = E.apply(C.baby.small.eyeMatrix(statesAt(g).baby.st, ' 2'), [315, 740]);
    const droop = -E.rad(18) * E.clamp((g - HAT.steal) / 6, 0, 1);
    return E.mul(E.T(m[0], m[1]), E.mul(E.R(droop), E.mul(E.T(-bs[0], -bs[1]), Ms)));
  };
  if (f < HAT.drop) return inMouth(f);
  const M1 = inMouth(HAT.drop), c1 = E.apply(M1, hc);
  const back = L.layerMatrix(statesAt(HAT.land).lord.st, 'hat'), cb = E.apply(back, hc);
  const u = Math.min(1, (f - HAT.drop) / (HAT.land - HAT.drop));
  const c = [E.lerp(c1[0], cb[0], u), E.lerp(c1[1], cb[1], u) - Math.sin(Math.PI * u) * 160];
  const tilt = Math.atan2(back[1], back[0]) - Math.atan2(M1[1], M1[0]);
  const a = E.lerp(0, -2 * Math.PI + tilt, E.EASE.out2(u));
  return E.mul(E.T(c[0], c[1]), E.mul(E.R(a), E.mul(E.T(-c1[0], -c1[1]), M1)));
}
ST.hooks.drawPose = (who, p, f) =>
  (who === 'lord' && p.form === 'big' && f >= HAT.f0 && f < HAT.land ? { ...p, hide: [...(p.hide || []), 'hat'] } : p);
ST.hooks.afterChars.push((ctx, f, S, CAM) => {
  if (f < HAT.f0 || f >= HAT.land) return;
  const hat = C.lord.big.layers.find((l) => l.name === 'hat');
  ctx.setTransform(...E.mul(CAM, hatMatrix(f)));
  ctx.drawImage(hat.img.canvas, hat.img.x, hat.img.y, hat.img.w, hat.img.h);
});

ST.start(BIG);
