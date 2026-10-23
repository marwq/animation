// Ролик 6: Розовая против Жёлтой — драка 25 с, 24 кадра/с, звуковые эффекты без музыки,
// по стилю «animal hospital long» (docs/animal_hospital_long.md).
//
//   0–4 с     шарик-Розовая (слева) и шарик-Жёлтая (справа) неподвижно смотрят друг на друга
//   4–5 с     Розовая сразу становится большой; Жёлтая пугается, потом дразнится и скачет к ней
//   7–9 с     Розовая дважды топает — мимо; шарик катится ей под ноги — Розовая падает на спину
//   9.5–12 с  прискакал шарик-Лорд; Жёлтая становится большой — Лорд влюбляется
//   12.5–18 с пощёчина за пощёчину, потом обе разом — обе кружатся, звёздочки
//   19–21 с   Розовая бьёт — Жёлтая ныряет и апперкотом отправляет её за кадр
//   21–25 с   Жёлтая в центре, руки вверх; влюблённый Лорд прыгает рядом
'use strict';

const ST = Stage({
  name: 'v06-pink-yellow',
  cast: {
    pink: { small: ['girl-verity-small', { bodyHeight: 300 }], big: ['girl-verity-big', { height: 730, splitFeet: true }],
      pivot: 337, voice: 1.3, vAngle: 50, moods: { angry: 'sad', grin: 'theeth smile', big: 'smile normal' } },
    yel: { small: ['girl-verity-small', { bodyHeight: 300, recolor: 'yellow' }],
      big: ['verity-big-girl', { height: 730, splitFeet: true, recolor: 'yellow' }], pivot: 337, voice: 1.45, vAngle: 50,
      moods: { angry: 'sad', grin: 'theeth smile', big: 'smile normal' } },
    lord: { small: ['lord-verity-small', { bodyHeight: 300 }], pivot: 337, voice: 1.0 },
  },
  order: ['lord', 'pink', 'yel'],
  background: { sky: ['#3d9ff2', '#a8cdf4', '#f6dccf'], seed: 96 },
  clouds: [[160, 90, 1.0, 2, 23], [580, 180, 0.9, 0, 30], [1000, 60, 1.2, 1, 20], [1420, 220, 0.8, 2, 26],
    [1800, 120, 1.0, 0, 18], [760, 300, 0.7, 1, 32]],
});
const { GROUND, C, key, move, ev, sfx, hop, tumble, laugh, tremble, transform, love, stance, walk, turn,
  strike, kick, dodge, duck, recoil, fallBack, getUp, flyOff, victory, chuckle, spinAround, stomp, hand, toRig } = ST;

// ================================================================== 0–4 с: стойка (Лорд пока за кадром)
key('pink', 0, { form: 'small', x: 560, y: GROUND, face: 1, look: 1, eyes: 'angry', mouth: 'smile normal', sx: 1, sy: 1, rot: 0 }, 0);
key('yel', 0, { form: 'small', x: 1360, y: GROUND, face: -1, look: 1, eyes: 'angry', mouth: 'theeth smile', sx: 1, sy: 1, rot: 0 }, 0);
key('lord', 0, { form: 'small', x: -200, y: GROUND, face: 1, look: 1, eyes: 'normal', mouth: 'smile normal', sx: 1, sy: 1, rot: 0 }, 0);

// ================================================================== 4–5 с: Розовая большая
const PX = 560;
const PB = transform('pink', 96, 560, PX, 1, { fast: true });
key('yel', PB, { mouth: 'puzzlement', eyes: 'sad' }, 0);
sfx('scared', PB + 2, { who: 'yel', gain: 0.7 });
ev('sweat', { who: 'yel', f0: PB + 2, f1: PB + 18 });
// дразнится и скачет к ней
key('yel', 136, { mouth: 'happy with theeth', eyes: 'normal' }, 0);
hop('yel', 138, 150, 1360, 1180, 70);
hop('yel', 152, 164, 1180, 1010, 70);
// ================================================================== 7–9 с: топ — мимо, топ — мимо, подсечка
const S1 = 170, S2 = 196, ROLL = 210, HIT = 220;
hop('yel', S1 + 2, S1 + 14, 1010, 1260, 90);                                        // отскочил от топа
hop('yel', S2 + 2, S2 + 14, 1260, 1500, 90);
// катится ей под ноги
key('yel', ROLL - 4, { sx: 1.15, sy: 0.88, eyes: 'angry', mouth: 'theeth smile' }, 4);
key('yel', ROLL, { pivot: 337, rot: 0, sx: 1, sy: 1 }, 2);
move('yel', ROLL, { x: 1500, rot: 0 });
move('yel', HIT, { x: 1390, rot: -150 }, 'lin');
sfx('whoosh', ROLL, { who: 'yel', dur: HIT - ROLL, gain: 0.5 });
move('yel', HIT + 12, { x: 1560, rot: 0 }, 'out2');                                // отскочила обратно
key('yel', HIT + 13, { rot: 0, pivot: 0 }, 0);
ev('spark', { f: HIT, at: [1300, GROUND - 120], r: 50, snd: 'bonk', victim: 'pink' });
key('yel', HIT + 16, { mouth: 'happy with theeth', eyes: 'normal' }, 0);
laugh('yel', HIT + 18, HIT + 40);

// ================================================================== 9.5–12 с: Лорд прискакал; Жёлтая большая
hop('lord', 236, 248, -200, 60, 60);
hop('lord', 250, 262, 60, 230, 60);
const YX = 1560;
const YB = transform('yel', 262, 1560, YX, -1, { love: 'lord', loveDur: 330 });

const BIG = () => {
  key('pink', PB, stance('pink', PX, 1), 0);
  key('pink', PB + 6, { mouth: 'theeth smile', eyes: 'angry' }, 0);
  walk('pink', 140, PX, 760, 2, 10, 1);
  stomp('pink', S1, 760, 980, 1);
  stomp('pink', S2, 980, 1220, 1);
  key('pink', S2 + 16, { mouth: 'puzzlement' }, 0);
  // подсечка — падает на спину
  const down = fallBack('pink', HIT + 1, 1220, 1, { lift: 45, stars: 40, n: 14 });
  const up = getUp('pink', 300, 1220, 1);

  // ---- Жёлтая большая
  key('yel', YB, stance('yel', YX, -1), 0);
  key('yel', YB + 10, { mouth: 'mini smile', eyes: 'normal' }, 0);
  ST.ev('hearts', { who: 'lord', f0: YB + 12, f1: 600, snd: false });

  // ---- пощёчина за пощёчину
  const P1 = 1290, Y1 = YX;
  walk('pink', up + 4, 1220, P1, 2, 9, 1);
  const A = 340;
  key('yel', A - 12, { lean: 7, head: 6, mouth: 'happy with theeth' }, 6);          // дразнится, наклонилась
  key('pink', A - 12, { mouth: 'angry theeth', eyes: 'angry' }, 0);
  strike('pink', A, 'yel:cheek', { x: P1, face: 1, snd: 'slap', back: [-0.5, -0.3], to: [1, -0.3], lean: 12 });
  recoil('yel', A + 2, Y1, Y1 + 70, -1, { ret: 16 });
  const B = 378;
  key('pink', B - 12, { lean: 7, head: 6, mouth: 'theeth smile' }, 6);              // теперь дразнится Розовая
  walk('yel', A + 20, Y1 + 70, Y1, 1, 10, -1);
  strike('yel', B, 'pink:cheek', { x: Y1, face: -1, snd: 'slap', back: [-0.5, -0.3], to: [1, -0.3], lean: 12 });
  recoil('pink', B + 2, P1, P1 - 70, 1, { ret: 16 });
  // обе разом
  const Cc = 414;
  walk('pink', B + 20, P1 - 70, P1, 1, 10, 1);
  key('pink', Cc - 10, { mouth: 'angry theeth', eyes: 'angry' }, 0);
  key('yel', Cc - 10, { mouth: 'angry theeth', eyes: 'angry' }, 0);
  strike('pink', Cc, 'yel:cheek', { snd: 'slap', back: [-0.5, -0.3], to: [1, -0.3], hard: false, lean: 12 });
  strike('yel', Cc, 'pink:cheek', { snd: 'slap', back: [-0.5, -0.3], to: [1, -0.3], lean: 12 });
  spinAround('pink', Cc + 2, P1, 1, { stars: 26 });
  spinAround('yel', Cc + 2, Y1, -1, { stars: 26 });

  // ---- Розовая бьёт — Жёлтая ныряет и апперкот
  const PU = 470, UP = 484;
  key('pink', PU - 4, { handF: hand('pink', 'F', -0.7, 0.2), lean: -8, hip: [0, toRig('pink', 18)], mouth: 'angry theeth' }, 6);
  key('pink', PU, { handF: hand('pink', 'F', 0.75, -0.75), lean: 10, hip: [toRig('pink', 4), toRig('pink', 10)] }, 4, 'in2');
  sfx('swing', PU - 5, { who: 'pink' });
  ev('whoosh', { f: PU + 1, at: [Y1 - 40, 150] });
  key('pink', PU + 4, { mouth: 'puzzlement' }, 0);
  key('pink', UP - 2, stance('pink', P1, 1, { mouth: 'puzzlement' }), 6);           // выпрямилась — и получила снизу
  duck('yel', PU - 3, PU + 4, Y1, -1, 240);
  strike('yel', UP, 'pink:jaw', { snd: 'punch', back: [0.2, 0.6], to: [0.6, -0.75], hard: true, r: 90, lean: 20 });
  flyOff('pink', UP + 1, UP + 30, [P1, GROUND], [-300, -320], { turns: 3 });

  // ---- победа Жёлтой; влюблённый Лорд скачет к ней
  key('yel', UP + 14, { mouth: 'happy with theeth', eyes: 'normal' }, 0);
  victory('yel', 500, Y1, { n: 9, stride: 120 });
  hop('lord', 512, 524, 230, 420, 70);
  hop('lord', 528, 540, 420, 610, 70);
  hop('lord', 544, 556, 610, 650, 50);
  for (let f = 562; f < 600; f += 8) key('lord', f, { rot: (f / 8) % 2 ? -6 : 6 }, 4);
};

ST.start(BIG);
