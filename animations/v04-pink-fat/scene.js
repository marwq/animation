// Ролик 4: Розовая девочка против Толстого — драка 25 с, 24 кадра/с, звуковые эффекты без музыки,
// по стилю «animal hospital long» (docs/animal_hospital_long.md).
//
//   0–4 с     шарик-Девочка (слева) и Толстый (справа) неподвижно смотрят друг на друга
//   4–5 с     Толстый смеётся — Девочка становится большой; Толстый влюбляется
//   5.5–9.5 с влюблённый скачет к ней и прыгает обнять — она отскакивает, он плюхается блином
//   10–14 с   Толстый злится; её пинок в живот — живот-батут отбрасывает её назад, он хохочет
//   14.5–17 с Толстый катится на неё колесом — она шлёт воздушный поцелуй, он снова влюбляется
//             и замирает
//   17.5–19 с разбег и пинок со всей силы — Толстый улетает в небо, блеск
//   19.5–25 с Девочка в центре, лицом к зрителю, руки вверх
'use strict';

const ST = Stage({
  name: 'v04-pink-fat',
  cast: {
    girl: { small: ['girl-verity-small', { bodyHeight: 300 }], big: ['girl-verity-big', { height: 730, splitFeet: true }],
      pivot: 337, voice: 1.35, vAngle: 50, moods: { angry: 'sad', grin: 'theeth smile', big: 'smile normal' } },
    fat: { small: ['fat-verity-small', { bodyHeight: 450 }], pivot: 508, voice: 0.75, moods: { love: 'happy' } },
  },
  order: ['fat', 'girl'],
  background: { sky: ['#46a2f1', '#aecdf3', '#f7e2d0'], seed: 74 },
  clouds: [[150, 110, 1.1, 0, 24], [600, 60, 1.0, 2, 30], [1040, 200, 0.8, 1, 21], [1430, 100, 1.2, 0, 27],
    [1790, 230, 0.8, 2, 19], [880, 290, 0.7, 1, 33]],
});
const { GROUND, C, key, move, ev, sfx, hop, tumble, laugh, tremble, transform, love, blowKiss, stance, walk, turn,
  strike, kick, dodge, duck, recoil, flyOff, victory, hand, toRig, statesAt, stateAt } = ST;

// точки на контуре Толстого со стороны взгляда (замерено по силуэту рига)
const fatEdge = (k, hf) => (ch, st) => {
  const b = ch.layers.find((l) => l.name === 'body').bbox;
  return E.apply(ch.layerMatrix(st, 'body'), [(b[0] + b[2]) / 2 + k * (b[2] - b[0]), b[3] - hf * (b[3] - b[1])]);
};
ST.parts.belly = fatEdge(0.47, 0.25);
ST.parts.low = fatEdge(0.4, 0.1);

// ================================================================== 0–4 с: стойка
key('girl', 0, { form: 'small', x: 560, y: GROUND, face: 1, look: 1, eyes: 'angry', mouth: 'smile normal', sx: 1, sy: 1, rot: 0 }, 0);
key('fat', 0, { form: 'small', x: 1360, y: GROUND, face: -1, look: 1, eyes: 'angry', mouth: 'theeth smile', sx: 1, sy: 1, rot: 0 }, 0);

// ================================================================== 4–5 с: смех — она большая, он влюблён
key('fat', 96, { mouth: 'happy', eyes: 'normal' }, 0);
laugh('fat', 98, 118);
const GX = 560;
const GB = transform('girl', 96, 560, GX, 1, { fast: true, love: 'fat', loveDur: 100 });

// ================================================================== 5.5–9.5 с: прыжок обнять — блин
hop('fat', 132, 146, 1360, 1210, 60, { land: 1.25, landY: 0.78 });
hop('fat', 152, 166, 1210, 1060, 60, { land: 1.25, landY: 0.78 });
const LEAP = 178, FLOP = 200, FX1 = 840;
key('fat', LEAP - 6, { sx: 1.3, sy: 0.72 }, 6);                   // присел для прыжка
move('fat', LEAP, { x: 1060, y: GROUND });
key('fat', LEAP + 2, { sx: 0.84, sy: 1.16 }, 2);
move('fat', LEAP + 11, { x: 960, y: GROUND - 260 }, 'out2');
move('fat', FLOP, { x: FX1, y: GROUND }, 'in2');
key('fat', LEAP + 11, { sx: 1, sy: 1 }, 4);
key('fat', FLOP, { sx: 1.5, sy: 0.34, eyes: 'sad', mouth: 'puzzlement' }, 1);    // блин
key('fat', FLOP + 16, { sx: 1.46, sy: 0.36 }, 16);
key('fat', FLOP + 22, { sx: 0.9, sy: 1.12 }, 6, 'out');
key('fat', FLOP + 28, { sx: 1, sy: 1 }, 6);
sfx('jump', LEAP + 2, { who: 'fat', gain: 0.6 });
sfx('whoosh', LEAP + 4, { who: 'fat', dur: 14, gain: 0.5 });
ev('dust', { f: FLOP, x: FX1, r: 80, n: 8, snd: 'slam' });
ev('shake', { f: FLOP, amp: 22, n: 14 });
ev('zoom', { f: FLOP, n: 12, k: 0.06, at: [FX1, GROUND - 60] });
sfx('hurt', FLOP + 2, { who: 'fat' });
ev('stars', { who: 'fat', f0: FLOP + 6, f1: FLOP + 46 });
sfx('boing', FLOP + 18, { who: 'fat', gain: 0.7 });
key('fat', FLOP + 48, { eyes: 'angry', mouth: 'theeth smile' }, 0);

// ================================================================== 10–14 с: пинок в живот-батут
const KB = 262;
key('fat', KB, { sx: 1, sy: 1 }, 0);
key('fat', KB + 3, { sx: 0.86, sy: 1.08, eyes: 'normal' }, 3);                 // нога вдавилась
key('fat', KB + 6, { sx: 1.2, sy: 0.86 }, 3, 'out');                           // и живот спружинил
key('fat', KB + 10, { sx: 0.96, sy: 1.04 }, 4);
key('fat', KB + 14, { sx: 1, sy: 1, mouth: 'happy' }, 4);
sfx('boing', KB + 3, { who: 'fat' });
laugh('fat', KB + 16, KB + 40);
// отпрыгивает назад для разгона и катится на неё колесом
const RX = 1300, ROLL = 316, STOP = 346, FX2 = 780;
hop('fat', KB + 42, KB + 54, FX1, 1060, 60, { land: 1.2, landY: 0.82 });
hop('fat', KB + 56, KB + 68, 1060, RX, 60, { land: 1.2, landY: 0.82 });
key('fat', ROLL - 4, { eyes: 'angry', mouth: 'theeth smile', sx: 1.1, sy: 0.92 }, 4);
key('fat', ROLL, { pivot: 508, rot: 0, sx: 1, sy: 1 }, 2);
move('fat', ROLL, { x: RX, y: GROUND, rot: 0 });
for (let f = ROLL + 1; f <= STOP; f++) {                                       // катится: бок не уходит в землю
  const u = (f - ROLL) / (STOP - ROLL);
  move('fat', f, { x: E.lerp(RX, FX2, u), rot: -360 * u, y: GROUND - 34 * Math.abs(Math.sin(2 * Math.PI * u)) }, 'lin');
}
sfx('whoosh', ROLL, { who: 'fat', dur: STOP - ROLL, gain: 0.6 });
for (let f = ROLL + 4; f < STOP; f += 8) ev('dust', { f, x: E.lerp(RX, FX2, (f - ROLL) / (STOP - ROLL)) + 120, r: 22, n: 3, snd: false });
// ================================================================== 14.5–17 с: поцелуй — снова влюблён
love('fat', STOP, 438, { mouth: 'happy' });
key('fat', STOP + 1, { rot: 0, pivot: 0 }, 0);
key('fat', STOP, { sx: 1.18, sy: 0.86 }, 1);
key('fat', STOP + 6, { sx: 1, sy: 1 }, 5);
for (let f = STOP + 10; f < 432; f += 8) key('fat', f, { rot: (f / 8) % 2 ? -5 : 5, pivot: 0 }, 4);   // качается от любви
key('fat', 434, { rot: 0 }, 3);
// ================================================================== 17.5–19 с: пинок со всей силы — в небо
const KK = 446;
key('fat', KK, { pivot: 508, sx: 1, sy: 1, eyes: 'sad', mouth: 'puzzlement' }, 0);
move('fat', KK, { x: FX2, y: GROUND, rot: 0 });
move('fat', KK + 32, { x: 2160, rot: 1080 }, 'lin');
move('fat', KK + 32, { y: -520 }, 'out2');
sfx('scared', KK + 3, { who: 'fat', gain: 0.8 });
sfx('whoosh', KK + 2, { who: 'fat', dur: 30, gain: 0.7 });
ev('twinkle', { f: KK + 30, at: [1830, 100], n: 22, size: 56 });

const BIG = () => {
  key('girl', GB, stance('girl', GX, 1), 0);
  key('girl', GB + 8, { mouth: 'mini smile', eyes: 'normal' }, 0);
  // прыжок обнять — отскок назад
  const G1 = 300;
  dodge('girl', LEAP + 4, GX, G1, 1);
  key('girl', FLOP + 4, { mouth: 'happy with theeth', eyes: 'normal' }, 0);
  for (let f = FLOP + 6; f < FLOP + 30; f += 6) key('girl', f, { head: (f / 6) % 2 ? 6 : -4 }, 3);   // смеётся
  key('girl', FLOP + 32, { head: 0 }, 3);

  // ---- пинок в живот: живот-батут отбрасывает её назад
  const G2 = 380, G3 = 250;
  walk('girl', 236, G1, G2, 1, 10, 1);
  key('girl', 248, { eyes: 'angry', mouth: 'angry theeth' }, 0);
  kick('girl', KB, 'fat:belly', { hard: false });
  recoil('girl', KB + 6, G2, G3, 1, { ret: 26 });
  key('girl', KB + 30, { mouth: 'sad' }, 0);
  ev('vein', { who: 'girl', f0: KB + 34, f1: KB + 58 });
  sfx('anger', KB + 34, { who: 'girl', dur: 22, gain: 0.6 });
  // ---- он катится на неё — хитрая улыбка и воздушный поцелуй
  key('girl', ROLL + 4, { mouth: 'puzzlement', eyes: 'sad', head: -6 }, 3);
  key('girl', ROLL + 14, { mouth: 'theeth smile', eyes: 'angry', head: 0 }, 3);
  const KS = STOP - 12;
  key('girl', KS - 8, { handF: hand('girl', 'F', 0.25, -0.55), zF: 'front' }, 6);
  key('girl', KS, { handF: hand('girl', 'F', 0.95, -0.35), lean: 6 }, 4, 'out');
  key('girl', KS + 12, { ...stance('girl', G3, 1), zF: null, mouth: 'happy with theeth', eyes: 'normal' }, 8);
  blowKiss('girl', KS, 'fat:face', { n: 12 });
  for (let f = STOP + 8; f < STOP + 30; f += 6) key('girl', f, { head: (f / 6) % 2 ? 6 : -4 }, 3);
  key('girl', STOP + 32, { head: 0 }, 3);
  // ---- разбег назад-вперёд, дрожь — пинок со всей силы снизу
  const G4 = 170, G5 = 385;
  walk('girl', 392, G3, G4, 1, 10, 1, false);                                       // шаг назад
  key('girl', 404, { hip: [0, toRig('girl', 90)], lean: 10, eyes: 'angry', mouth: 'angry theeth' }, 6);
  tremble('girl', 406, 420, G4, 3);
  ev('sweat', { who: 'girl', f0: 406, f1: 424, snd: false });
  walk('girl', 422, G4, G5, 2, 6, 1, false);
  kick('girl', KK, 'fat:low', { hard: true, r: 110 });
  key('girl', KK + 20, { mouth: 'happy with theeth', eyes: 'normal' }, 0);
  // ---- победа
  victory('girl', 482, G5);
};

ST.start(BIG);
