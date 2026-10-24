// Девочка против Скелета — драка 25 с, 24 кадра/с, со звуковыми эффектами (без музыки),
// по стилю «animal hospital long»
// (docs/animal_hospital_long.md). Один из бойцов становится большим уже к 5-й секунде.
//
//   0–4 с     шарик-Девочка (слева) и шарик-Скелет (справа) неподвижно смотрят друг на друга
//   4–5 с     Скелет сразу злится, ухмыляется, дым — большой крылатый скелет
//   5–8 с     Скелет машет крыльями — ветер катит Девочку назад кувырком, звёздочки
//   8–10 с    Девочка злится и превращается в большую — Скелет влюбляется (сердечки вместо глаз)
//   11–14 с   оба идут навстречу, Скелет тянется поцеловать — пощёчина, кружится, звёздочки
//   17–20 с   Скелет злится и замахивается — воздушный поцелуй, сердце в лицо, падает на спину
//   20–25 с   Девочка идёт в центр, поворачивается к зрителю, руки вверх
//
// Ключи, помощники движения, звук и сборка кадра — в animations/stage.js.
'use strict';

// размеры как в образце: шарик ~300 px, большие ~730 px от верха банта/черепа до подошв
const ST = Stage({
  name: 'girl-vs-skel',
  cast: {
    girl: { small: ['girl-verity-small', { bodyHeight: 300 }], big: ['girl-verity-big', { height: 730, splitFeet: true }],
      pivot: 337, voice: 1.25, moods: { angry: 'sad', grin: 'theeth smile', big: 'smile normal' } },
    skel: { small: ['skeleton-verity-small-v1', { scale: 0.455 }], big: ['skeleton-verity-big', { height: 730 }], pivot: 325,
      voice: 0.9 },
  },
  order: ['skel', 'girl'],    // Девочка ближе к зрителю
  background: { sky: ['#3f9ff4', '#9fc6f2', '#f6e4cf'], seed: 37 },
  clouds: [[90, 120, 1.0, 2, 21], [540, 60, 1.2, 0, 27], [1010, 210, 0.8, 1, 18], [1400, 90, 1.1, 2, 31],
    [1780, 240, 0.9, 0, 24], [300, 300, 0.7, 1, 20]],
});
const { GROUND, C, key, move, ev, sfx, hop, tumble, laugh, tremble, transform, stance, walk } = ST;

// глаза большого Скелета на слое 'eye' (центры глазниц и радиус, пиксели рига)
const SKEL_EYES = [[1081, 197, 43], [1246, 190, 36]];
// рот Девочки — откуда вылетает воздушный поцелуй
ST.parts.lips = (ch, st) => {
  const f = ch.point(st, 'face'), h = ch.point(st, 'head');
  return [h[0] + (f[0] - h[0]) * 1.3, f[1] + ch.height * 0.03];
};

// ================================================================== 0–4 с: стойка
key('girl', 0, { form: 'small', x: 560, y: GROUND, face: 1, look: 1, eyes: 'angry', mouth: 'smile normal', sx: 1, sy: 1, rot: 0 }, 0);
key('skel', 0, { form: 'small', x: 1360, y: GROUND, face: -1, look: 1, eyes: 'angry', mouth: 'theeth smile', sx: 1, sy: 1, rot: 0 }, 0);

// ================================================================== 4–5 с: Скелет сразу превращается
const SKX = 1420;
const SKB = transform('skel', 96, 1360, SKX, -1, { fast: true });
// Девочка пугается: рот «О», дрожь, пот
key('girl', SKB, { mouth: 'puzzlement', eyes: 'sad' }, 0);
sfx('scared', SKB + 2, { who: 'girl', gain: 0.8 });
tremble('girl', SKB + 2, SKB + 20, 560, 2);
ev('sweat', { who: 'girl', f0: SKB + 2, f1: SKB + 30 });

// ================================================================== 5–8 с: ветер от крыльев
// Девочка упирается, её сдвигает, потом катит назад кувырком
key('girl', 146, { sx: 1.12, sy: 0.9, eyes: 'sad', mouth: 'sad' }, 4);
move('girl', 146, { x: 560 });
move('girl', 154, { x: 520 }, 'in2');
tumble('girl', 156, 180, 520, 320, 120, -1, { stars: 32, hurt: true });
key('girl', 158, { sx: 1, sy: 1 }, 3);
key('girl', 181, { eyes: 'sad', mouth: 'sad' }, 0);

// ================================================================== 8–10 с: Девочка превращается
const GX = 430;
const GB = transform('girl', 204, 320, GX, 1);

// позы больших — после загрузки ригов
const G2 = 760, SK2 = 1140;   // где они сойдутся для пощёчины
const BIG = () => {
  const sk = C.skel.big, gl = C.girl.big;
  const flap = (f, up) => key('skel', f, up ? { b_B16: -22, b_B17: 22 } : { b_B16: 46, b_B17: -46 }, up ? 4 : 3, up ? 'io' : 'in');

  // ---- Скелет большой, смеётся над маленькой
  key('skel', SKB, stance('skel', SKX, -1, { b_B16: 12, b_B17: -12 }), 0);
  key('skel', SKB + 8, { mouth: 'theeth smile' }, 0);
  // взмахи крыльями: корпус вперёд, три сильных взмаха — ветер по земле
  key('skel', 136, { lean: 8, hip: [0, 30], mouth: 'angry theeth' }, 6);
  flap(142, true);
  for (const [f, up] of [[146, false], [150, true], [154, false], [158, true], [162, false], [166, true]]) flap(f, up);
  key('skel', 176, { lean: 0, hip: [0, 8], b_B16: 12, b_B17: -12 }, 8);
  ev('wind', { f0: 145, f1: 182, x0: SKX - 260, x1: 120 });
  key('skel', 184, { mouth: 'happy with theeth', lean: -4 }, 4);                  // смеётся
  key('skel', 200, { lean: 0 }, 6);

  // ---- Девочка большая — Скелет влюбляется
  key('girl', GB, stance('girl', GX, 1), 0);
  key('girl', GB + 12, { mouth: 'mini smile', eyes: 'normal' }, 0);
  key('skel', GB + 2, { mouth: 'puzzlement' }, 0);
  const LOVE = GB + 10;
  ev('hearteyes', { who: 'skel', f0: LOVE, f1: 348, layer: 'eye', eyes: SKEL_EYES });
  ev('hearts', { who: 'skel', f0: LOVE + 2, f1: 346, part: 'head' });
  key('skel', LOVE, { mouth: 'happy - spittle', head: 6 }, 0);
  for (let f = LOVE; f < 330; f += 6) key('skel', f, (f / 6) % 2 ? { b_B16: 2, b_B17: -2 } : { b_B16: 16, b_B17: -16 }, 3);

  // ---- навстречу: Скелет мечтательно (шаг 12 кадров), Девочка уверенно
  walk('skel', 266, SKX, SK2, 3, 12, -1, false);
  key('skel', 266, { handF: [300, 120], handB: [180, 160] }, 8);                  // руки к ней
  walk('girl', 284, GX, G2, 4, 10, 1);
  key('girl', 330, { eyes: 'angry', mouth: 'angry theeth' }, 0);

  // ---- тянется поцеловать — пощёчина
  key('skel', 332, { lean: 12, head: 10, hip: [10, 30], mouth: 'puzzlement', handF: [260, 40], handB: [160, 90] }, 8);
  key('girl', 340, { handF: [-260, 120], lean: -6, hitF: 0 }, 6);                 // замах
  key('girl', 348, { handF: [300, -200], lean: 10, hitF: 1, hitFto: 'skel:cheek', hitFfix: 348 }, 4, 'in2');
  ev('spark', { f: 348, at: 'skel:cheek', r: 70, snd: 'slap' });
  ev('shake', { f: 348, amp: 14, n: 10 });
  ev('zoom', { f: 348, n: 12, k: 0.07, at: 'skel:cheek' });
  key('girl', 352, { hitF: 1 }, 0);
  key('girl', 360, { ...stance('girl', G2, 1), hitF: 0, mouth: 'mini smile' }, 8);
  // Скелет кружится: шесть разворотов по 4 кадра, ноги как в риге
  key('skel', 349, { legFfk: 1, legBfk: 1, lean: 0, head: -6, hip: [0, 8], mouth: 'puzzlement',
    handF: [140, 420], handB: [-120, 420], b_B16: 30, b_B17: -30 }, 2);
  for (let i = 0; i < 6; i++) {
    key('skel', 352 + i * 4, { face: i % 2 ? -1 : 1 }, 3);
    sfx('whoosh', 351 + i * 4, { who: 'skel', dur: 4, gain: 0.35 });
  }
  key('skel', 378, { ...stance('skel', SK2, -1), b_B16: 30, b_B17: -30, head: -8 }, 4);
  ev('stars', { who: 'skel', f0: 376, f1: 420 });
  for (let f = 380; f < 420; f += 8) key('skel', f, { head: (f / 8) % 2 ? -8 : 4 }, 4);    // голова кругом

  // ---- Скелет злится и замахивается — воздушный поцелуй
  key('skel', 420, { head: 0, mouth: 'angry theeth', b_B16: -16, b_B17: 16 }, 4);
  key('skel', 432, { handF: [-300, 60], lean: -8, hip: [0, 50] }, 8);              // замах кулаком
  // ближняя к нему рука поднимается над телом (zF) — ладонь к губам, и поцелуй летит к нему
  key('girl', 424, { handF: [160, -290], zF: 'front', mouth: 'puzzlement' }, 6);
  key('girl', 434, { handF: [520, -330], lean: 6 }, 4, 'out');
  sfx('kiss', 431, { who: 'girl' });
  ev('heartshot', { f0: 434, f1: 446, from: 'girl:lips', to: 'skel:face', size: 130 });
  key('girl', 448, { ...stance('girl', G2, 1), zF: null, mouth: 'theeth smile' }, 8);
  // сердце в лицо: застыл, снова влюблён — и падает на спину
  ev('hearteyes', { who: 'skel', f0: 446, f1: 600, layer: 'eye', eyes: SKEL_EYES });
  sfx('pop', 446, { who: 'skel', gain: 0.6 });                                    // сердце лопнуло о лицо
  sfx('love', 448, { who: 'skel', gain: 0.8 });
  key('skel', 446, { mouth: 'happy - spittle', handF: [200, 380], lean: -4, hip: [0, 20] }, 4);
  // падает на спину: ноги прямые как в риге, руки за голову, крылья складываются вдоль тела
  key('skel', 452, { legFfk: 1, legBfk: 1, legF: [0, 0, 0], legB: [0, 0, 0], b_B16: 40, b_B17: -40,
    handF: [60, -520], handB: [-20, -500], zB: 'back' }, 6);                       // ближняя рука за головой
  key('skel', 470, { b_B16: 90, b_B17: -90 }, 10);
  key('skel', 452, { rot: 0, pivot: 0 }, 0);
  move('skel', 452, { y: GROUND });
  move('skel', 470, { rot: 90, y: GROUND - 50 }, 'in');                            // лежит на спине, не в земле
  sfx('whoosh', 456, { who: 'skel', dur: 14, gain: 0.6 });
  ev('dust', { f: 470, x: SK2 + 380, r: 80, n: 8, snd: 'slam' });
  ev('shake', { f: 470, amp: 22, n: 16 });
  ev('zoom', { f: 470, n: 14, k: 0.07, at: [SK2 + 360, GROUND - 60] });
  ev('hearts', { who: 'skel', f0: 474, f1: 600, part: 'head', snd: false });
  for (const f of [500, 540, 580]) {                                               // лёгкое подёргивание
    key('skel', f, { legF: [8, -10] }, 2);
    key('skel', f + 4, { legF: [0, 0] }, 3);
  }

  // ---- победа: в центр, лицом к зрителю, руки вверх
  walk('girl', 480, G2, 960, 2, 10, 1);
  key('girl', 512, { look: 0, eyes: 'normal' }, 4);
  key('girl', 518, { handF: [560, -60], handB: [-560, -60] }, 3);                 // руки через стороны
  // руки буквой V шире головы (у Девочки голова большая, а руки короткие)
  key('girl', 521, { handF: [520, -440], handB: [-520, -440], head: -4, mouth: 'happy with theeth' }, 3);
  for (const [f, x, y] of [[522, 790, 260], [530, 1130, 200], [538, 760, 470], [546, 1170, 430], [554, 960, 110],
    [566, 820, 330], [578, 1100, 300]]) {
    ev('twinkle', { f, at: [x, y], n: 16, size: 34 });
  }
};

ST.start(BIG);
