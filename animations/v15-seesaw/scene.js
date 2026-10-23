// Ролик 15: Качели — Малыш, Толстый и Жёлтая, 25 с, 24 кадра/с, звуковые эффекты без музыки,
// по стилю «animal hospital long» (docs/animal_hospital_long.md).
//
//   0–4 с     шарик-Малыш (слева) и Толстый (справа) смотрят друг на друга; между ними качели
//   4–5 с     Малыш сразу становится большим и смеётся
//   6–8 с     Толстый запрыгивает на правый край качелей и дразнится
//   8.5–10 с  Малыш прыгает на левый край — Толстого подбрасывает в небо
//   11–12 с   Толстый падает обратно на свой край — теперь в небо летит Малыш
//   12.5–14 с Малыш падает и втыкается головой в землю, ногами дрыгает
//   14–16.5 с справа прискакала шарик-Жёлтая и стала большой — Толстый влюбился;
//             Малыш выдернул голову — и тоже влюбился
//   18–20 с   пинок по Толстому — он перелетает качели и садится на Малыша, тот в блин
//   20.5–25 с Жёлтая в центре, руки вверх
'use strict';

const ST = Stage({
  name: 'v15-seesaw',
  cast: {
    baby: { small: ['child-verity-pink', { bodyHeight: 300, spin: { layer: 'hat', cut: 122, axis: 389 } }],
      big: ['child-verity-big', { height: 730, spin: { layer: 'hat', cut: 106, axis: 330 } }], pivot: 338, voice: 1.25,
      lie: 70, moods: { angry: ' 5', grin: ' 2', big: 'mouth' } },
    fat: { small: ['fat-verity-small', { bodyHeight: 450 }], pivot: 508, voice: 0.75, moods: { love: 'happy' } },
    girl: { small: ['girl-verity-small', { bodyHeight: 300, recolor: 'yellow' }],
      big: ['verity-big-girl', { height: 730, splitFeet: true, recolor: 'yellow' }], pivot: 337, voice: 1.4, vAngle: 50,
      moods: { angry: 'sad', grin: 'theeth smile', big: 'smile normal' } },
  },
  order: ['fat', 'baby', 'girl'],
  background: { sky: ['#4aa8ee', '#b2d4f3', '#f2e6d0'], seed: 196 },
  clouds: [[240, 90, 1.0, 0, 23], [690, 200, 0.9, 1, 29], [1090, 70, 1.1, 2, 20], [1500, 170, 0.8, 0, 26],
    [1830, 60, 1.0, 1, 31], [420, 300, 0.7, 2, 18]],
});
const { GROUND, C, key, move, ev, sfx, hop, tumble, laugh, tremble, transform, love, stance, walk, turn,
  strike, kick, dodge, duck, recoil, fallBack, getUp, flyOff, victory, chuckle, hand, toRig, statesAt, stateAt, target } = ST;

// ------------------------------------------------------------------ качели
const SP = 960, PY = GROUND - 62, HALF = 330, A = Math.asin(60 / HALF);   // ось, полдоски, наклон до земли
const TH = [[0, -A]];                                     // [кадр, угол]: −A — левый край внизу
const thetaAt = (f) => {
  let a = TH[0][1];
  for (let i = 1; i < TH.length; i++) {
    const [f1, v1] = TH[i], [f0, v0] = TH[i - 1];
    if (f >= f1) a = v1;
    else if (f > f0 && v1 !== v0 && TH[i].n && f > f1 - TH[i].n) a = E.lerp(v0, v1, E.EASE.in2((f - (f1 - TH[i].n)) / TH[i].n));
  }
  return a;
};
const tilt = (f, to, n) => { const k = [f, to]; k.n = n; TH.push(k); };
const plankY = (x, f) => PY + (x - SP) * Math.tan(thetaAt(f)) - 16;   // верх доски
const ride = (who, f0, f1, x) => {                        // стоит/сидит на доске — едет вместе с ней
  for (let f = f0; f <= f1; f++) move(who, f, { x, y: plankY(x, f) }, 'lin');
};

// ================================================================== 0–4 с: стойка
key('baby', 0, { form: 'small', x: 480, y: GROUND, face: 1, look: 1, eyes: 'angry', mouth: ' 1', sx: 1, sy: 1, rot: 0 }, 0);
key('fat', 0, { form: 'small', x: 1440, y: GROUND, face: -1, look: 1, eyes: 'angry', mouth: 'theeth smile', sx: 1, sy: 1, rot: 0 }, 0);
key('girl', 0, { form: 'small', x: 2200, y: GROUND, face: -1, look: 1, eyes: 'normal', mouth: 'smile normal', sx: 1, sy: 1, rot: 0 }, 0);

// ================================================================== 4–5 с: Малыш большой
const BX = 400;
const BB = transform('baby', 96, 480, BX, 1, { fast: true });
key('fat', BB, { mouth: 'puzzlement', eyes: 'sad' }, 0);
key('fat', 140, { mouth: 'theeth smile', eyes: 'angry' }, 0);

// ================================================================== 6–8 с: Толстый на правом краю
const FXP = 1180, FL = 170;                               // где сидит на доске, кадр приземления
hop('fat', 144, 156, 1440, 1360, 50);
key('fat', 160, { sx: 1.25, sy: 0.78 }, 4);
move('fat', 162, { x: 1360, y: GROUND });
key('fat', 164, { sx: 0.86, sy: 1.14 }, 2);
move('fat', 166, { x: 1270, y: plankY(FXP, 160) - 90 }, 'out2');
move('fat', FL, { x: FXP, y: plankY(FXP, 160) }, 'in2');
key('fat', FL, { sx: 1.25, sy: 0.8 }, 1);
key('fat', FL + 6, { sx: 1, sy: 1 }, 5);
tilt(FL + 4, A, 4);                                        // правый край вниз
sfx('jump', 164, { who: 'fat', gain: 0.6 });
sfx('land', FL, { who: 'fat' });
ev('dust', { f: FL + 4, x: SP + HALF, r: 30, n: 4, snd: false });
ride('fat', FL + 1, 236, FXP);
for (let f = FL + 1; f <= 236; f++) move('fat', f, { rot: thetaAt(f) * 180 / Math.PI }, 'lin');
laugh('fat', 182, 210);

// ================================================================== 8.5–10 с: Малыш прыгает на левый край — Толстый в небо
const BJ = 236, BXP = 720;                                 // кадр прыжка на доску, где встал
tilt(BJ + 3, -A, 3);
move('fat', BJ + 2, { x: FXP, y: plankY(FXP, BJ + 2), rot: 0 });
move('fat', BJ + 20, { y: -560 }, 'out2');
key('fat', BJ + 3, { sx: 0.84, sy: 1.2, eyes: 'sad', mouth: 'puzzlement' }, 2);
key('fat', BJ + 10, { sx: 1, sy: 1 }, 6);
sfx('boing', BJ + 2, { x: SP });
sfx('whoosh', BJ + 3, { who: 'fat', dur: 16, gain: 0.7 });
sfx('scared', BJ + 4, { who: 'fat', gain: 0.8 });
ev('shake', { f: BJ, amp: 14, n: 10 });

// ================================================================== 11–12 с: Толстый падает обратно — Малыш в небо
const FD = 280;
move('fat', FD - 1, { x: FXP, y: -560 });
move('fat', FD + 8, { x: FXP, y: plankY(FXP, FD + 7) }, 'in2');
key('fat', FD + 8, { sx: 1.35, sy: 0.7 }, 1);
key('fat', FD + 14, { sx: 1, sy: 1, mouth: 'happy', eyes: 'normal' }, 5);
tilt(FD + 11, A, 3);
ride('fat', FD + 9, 456, FXP);
for (let f = FD + 9; f <= 456; f++) move('fat', f, { rot: thetaAt(f) * 180 / Math.PI }, 'lin');
sfx('whoosh', FD - 1, { who: 'fat', dur: 9, gain: 0.6 });
ev('shake', { f: FD + 8, amp: 20, n: 12 });
sfx('slam', FD + 8, { x: FXP, gain: 0.8 });
laugh('fat', FD + 24, FD + 56);

// ================================================================== Жёлтая прискакала справа и стала большой
hop('girl', 346, 358, 2200, 1900, 70);
hop('girl', 362, 374, 1900, 1680, 70);
const GX = 1660;
const GB = transform('girl', 380, 1680, GX, -1, { love: 'fat', loveDur: 70 });

const BIG = () => {
  const B = C.baby.big, BP = (B.anchor[1] - B.top) / 2;
  key('baby', BB, stance('baby', BX, 1), 0);
  chuckle('baby', BB + 4, BB + 30, { mouth: 'happy with theeth' });
  key('baby', 176, { mouth: 'angry theeth', eyes: 'angry' }, 0);
  // ---- подходит к левому краю (он поднят) и прыгает на него
  walk('baby', 196, BX, 560, 2, 10, 1);
  key('baby', BJ - 10, { hip: [0, toRig('baby', 80)], lean: 8, handF: hand('baby', 'F', 0.3, -0.6), handB: hand('baby', 'B', -0.3, -0.6) }, 6);
  move('baby', BJ - 8, { x: 560, y: GROUND });
  key('baby', BJ - 7, { legFfk: 1, legBfk: 1, legF: [-30, 60], legB: [-10, 50], hip: [0, 0] }, 3);
  move('baby', BJ - 4, { x: 640, y: plankY(BXP, BJ - 8) - 90 }, 'out2');
  move('baby', BJ, { x: BXP, y: plankY(BXP, BJ - 1) }, 'in2');
  key('baby', BJ, { legFfk: 0, legBfk: 0, hip: [0, toRig('baby', 60)], ...B.feet(BXP, 1) }, 2);
  for (let f = BJ + 1; f <= FD + 10; f++) {
    const y = plankY(BXP, f);
    move('baby', f, { x: BXP, y }, 'lin');
    key('baby', f, { footF: [B.feet(BXP, 1).footF[0], GROUND - y], footB: [B.feet(BXP, 1).footB[0], GROUND - y] }, 1, 'lin');
  }
  key('baby', BJ + 8, { hip: [0, toRig('baby', 8)], lean: 0, mouth: 'happy with theeth', head: -14 }, 6);   // смотрит вверх
  chuckle('baby', BJ + 12, FD - 6, { mouth: 'happy with theeth' });
  key('baby', FD - 4, { head: -20, mouth: 'puzzlement' }, 4);                  // ой, падает обратно
  // ---- Малыша подбрасывает
  const UP = FD + 11, TOPF = UP + 18, DIVE = UP + 40, STX = 280;
  key('baby', UP, { legFfk: 1, legBfk: 1, legF: [-25, 45], legB: [20, -30], pivot: BP, rot: 0, mouth: 'puzzlement', eyes: 'sad',
    handF: hand('baby', 'F', 0.4, -0.85), handB: hand('baby', 'B', -0.4, -0.85) }, 2);
  move('baby', UP, { x: BXP, y: plankY(BXP, UP) });
  move('baby', TOPF, { x: 520, y: -700 }, 'out2');
  move('baby', TOPF + 1, { rot: 180 }, 'io');
  // втыкается головой в землю: голова на 120 px под землёй
  const H = B.height;
  move('baby', DIVE, { x: STX, y: GROUND + 120 - H + 2 * BP * B.scale, rot: 180 }, 'in2');
  key('baby', DIVE, { legF: [-10, 10], legB: [10, -10], handF: hand('baby', 'F', 0.1, 0.9), handB: hand('baby', 'B', -0.1, 0.9) }, 4);
  sfx('whoosh', UP, { who: 'baby', dur: DIVE - UP, gain: 0.7 });
  sfx('scared', UP + 2, { who: 'baby', gain: 0.8 });
  ev('dust', { f: DIVE, x: STX, r: 70, n: 8, snd: 'slam' });
  ev('shake', { f: DIVE, amp: 18, n: 12 });
  sfx('hurt', DIVE + 2, { who: 'baby', gain: 0.6, pitch: 0.7 });
  for (let f = DIVE + 4; f < 410; f += 6) key('baby', f, { legF: (f / 6) % 2 ? [-40, 70] : [10, 10], legB: (f / 6) % 2 ? [10, 10] : [-40, 70] }, 3);   // дрыгает ногами
  // ---- выдернул голову
  const OUT = 412;
  move('baby', OUT, { x: STX, y: GROUND + 120 - H + 2 * BP * B.scale, rot: 180 });
  move('baby', OUT + 10, { y: GROUND - 120, rot: 360 }, 'out2');
  move('baby', OUT + 16, { y: GROUND }, 'in2');
  key('baby', OUT + 16, { ...stance('baby', STX, 1), pivot: 0, rot: 0, mouth: 'puzzlement', eyes: 'normal' }, 4);
  key('baby', OUT + 17, { rot: 0 }, 0);
  sfx('pop', OUT, { who: 'baby' });
  ev('dust', { f: OUT, x: STX, r: 40, n: 5, snd: false });
  ev('stars', { who: 'baby', f0: OUT + 16, f1: OUT + 40 });
  ST.love('baby', OUT + 30, 470, { mouth: 'happy - spittle' });
  walk('baby', OUT + 34, STX, 470, 2, 12, 1, false);

  // ---- Жёлтая большая; Толстый влюбился, повернулся к ней
  key('girl', GB, stance('girl', GX, -1), 0);
  key('girl', GB + 10, { mouth: 'mini smile', eyes: 'normal' }, 0);
  key('fat', GB + 12, { face: 1 }, 0);
  // ---- пинок: Толстый перелетает качели и садится на Малыша
  const G1 = 1500, KK = 456;
  walk('girl', KK - 22, GX, G1, 1, 10, -1);
  kick('girl', KK, 'fat:right', { x: G1, face: -1, hard: true });
  tilt(KK + 6, -A, 6);
  const LAND = KK + 26, BYX = 470;
  move('fat', KK, { x: FXP, y: plankY(FXP, KK), rot: thetaAt(KK) * 180 / Math.PI });
  move('fat', KK + 12, { x: E.lerp(FXP, BYX, 0.55), y: GROUND - 640 }, 'out2');
  move('fat', LAND, { x: BYX, y: GROUND - 220 }, 'in2');
  move('fat', KK + 20, { rot: -360 }, 'lin');
  key('fat', KK + 21, { rot: 0 }, 0);
  key('fat', KK + 2, { eyes: 'sad', mouth: 'puzzlement' }, 0);
  sfx('whoosh', KK + 2, { who: 'fat', dur: 24, gain: 0.7 });
  // Малыш в блин, Толстый сидит сверху
  key('baby', LAND - 2, { mouth: 'puzzlement', head: -16 }, 3);
  key('baby', LAND, { sx: 1.0, sy: 1.0 }, 0);
  key('baby', LAND + 3, { sx: 1.45, sy: 0.3 }, 3, 'in2');
  key('fat', LAND, { sx: 1.3, sy: 0.75 }, 1);
  key('fat', LAND + 8, { sx: 1, sy: 1 }, 6);
  move('fat', LAND + 3, { y: GROUND - 730 * 0.3 + 10 }, 'in2');
  ev('dust', { f: LAND + 3, x: BYX, r: 90, n: 8, snd: 'slam' });
  ev('shake', { f: LAND + 3, amp: 24, n: 16 });
  ev('zoom', { f: LAND + 3, n: 14, k: 0.07, at: [BYX, GROUND - 160] });
  sfx('hurt', LAND + 4, { who: 'baby' });
  ev('stars', { who: 'fat', f0: LAND + 8, f1: 600 });
  // ---- победа
  key('girl', KK + 16, { mouth: 'happy with theeth', eyes: 'normal' }, 0);
  victory('girl', LAND + 6, G1);
};

// правый бок Толстого (он смотрит вправо)
ST.parts.right = (ch, st) => {
  const b = ch.layers.find((l) => l.name === 'body').bbox;
  return E.apply(ch.layerMatrix(st, 'body'), [(b[0] + b[2]) / 2 + 0.47 * (b[2] - b[0]), b[3] - 0.25 * (b[3] - b[1])]);
};

ST.hooks.beforeChars.push((ctx, f) => FX.seesaw(ctx, SP, PY, HALF * 2, thetaAt(f)));
// голова Малыша «под землёй»: поверх кусок фона и холмик земли
ST.hooks.afterChars.push((ctx, f, S, CAM) => {
  const p = S.baby.p;
  if (p.form !== 'big' || Math.abs(((p.rot % 360) + 360) % 360 - 180) > 30 || p.y < GROUND - 400) return;
  ctx.setTransform(...CAM);
  ST.bgPatch(ctx, p.x - 170, GROUND + 6, 340, 220);
  for (const [dx, r] of [[-70, 30], [-30, 40], [20, 38], [65, 28]]) FX.puff(ctx, p.x + dx, GROUND + 4, r, 1, '#a3622c', '#4a2a10');
});

ST.start(BIG);
