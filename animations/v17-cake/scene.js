// Ролик 17: Торт — Скелет, Толстый и Жёлтая, 25 с, 24 кадра/с, звуковые эффекты без музыки,
// по стилю «animal hospital long» (docs/animal_hospital_long.md).
//
//   0–4 с     шарик-Скелет (слева) и Толстый (справа) смотрят друг на друга; рядом со Скелетом торт
//   4–5 с     Скелет сразу становится большим
//   5–8.5 с   Толстый пускает слюни и скачет к торту — Скелет поднимает торт над головой,
//             Толстый прыгает — мимо
//   8.5–12 с  Скелет бросает торт далеко за Толстого — тот бежит, раскрывает огромный рот и
//             проглатывает торт целиком, жуёт
//   12–14.5 с с неба падает шарик-Жёлтая и становится большой — влюбились оба
//   15–18 с   Скелет идёт обниматься, Толстый прыгает к ней с другой стороны — она приседает,
//             Толстый перелетает её и падает на Скелета; оба лежат со звёздочками
//   18.5–25 с Жёлтая в центре, руки вверх
'use strict';

const ST = Stage({
  name: 'v17-cake',
  cast: {
    skel: { small: ['skeleton-verity-small', { scale: 0.455 }], big: ['skeleton-verity-big', { height: 730 }], pivot: 325,
      voice: 0.9, lie: 60 },
    fat: { small: ['fat-verity-small', { bodyHeight: 450 }], pivot: 508, voice: 0.75, moods: { love: 'happy' } },
    girl: { small: ['girl-verity-small', { bodyHeight: 300, recolor: 'yellow' }],
      big: ['verity-big-girl', { height: 730, splitFeet: true, recolor: 'yellow' }], pivot: 337, voice: 1.4, vAngle: 50,
      moods: { angry: 'sad', grin: 'theeth smile', big: 'smile normal' } },
  },
  order: ['skel', 'girl', 'fat'],
  background: { sky: ['#48a4f0', '#aecff4', '#f6e3cc'], seed: 218 },
  clouds: [[180, 80, 1.0, 1, 24], [620, 210, 0.9, 2, 28], [1060, 60, 1.2, 0, 19], [1460, 190, 0.8, 1, 31],
    [1820, 100, 1.0, 2, 22], [400, 300, 0.7, 0, 26]],
});
const { GROUND, C, key, move, ev, sfx, hop, tumble, laugh, tremble, transform, love, stance, walk, turn,
  strike, kick, dodge, duck, recoil, fallBack, getUp, flyOff, victory, chuckle, hand, toRig, statesAt, stateAt, target } = ST;

ST.parts.mouth = (ch, st) => E.apply(ch.eyeMatrix(st, 'puzzlement'), [611, 456]);

// торт: путь [{f, at}] или в руке у Скелета (hold) — на ладони сверху
const CAKE = { segs: [], gone: 1e9 };
const CS = 150, CAKE0 = [760, GROUND];
const cakeAt = (f, S) => {
  let cur = CAKE.segs[0];
  for (const sg of CAKE.segs) if (f >= sg.f0) cur = sg;
  if (cur.hold) { const h = C.skel.big.point(S.skel.st, 'handF'); return { x: h[0], y: h[1] + 6, k: 1 }; }
  const u = cur.f1 > cur.f0 ? E.clamp((f - cur.f0) / (cur.f1 - cur.f0), 0, 1) : 1;
  const a = typeof cur.a === 'function' ? cur.a() : cur.a, b = typeof cur.b === 'function' ? cur.b(f, S) : cur.b;
  return { x: E.lerp(a[0], b[0], u), y: E.lerp(a[1], b[1], E.EASE[cur.ease || 'lin'](u)) - (cur.arc ? Math.sin(Math.PI * u) * cur.arc : 0),
    k: E.lerp(cur.k0 ?? 1, cur.k1 ?? 1, u), rot: (cur.spin || 0) * u };
};
CAKE.segs.push({ f0: 0, f1: 0, a: CAKE0, b: CAKE0 });

const FX0 = 1360;
// ================================================================== 0–4 с: стойка (Жёлтая над кадром)
key('skel', 0, { form: 'small', x: 540, y: GROUND, face: 1, look: 1, eyes: 'angry', mouth: 'theeth smile', sx: 1, sy: 1, rot: 0 }, 0);
key('fat', 0, { form: 'small', x: FX0, y: GROUND, face: -1, look: 1, eyes: 'angry', mouth: 'theeth smile', sx: 1, sy: 1, rot: 0 }, 0);
key('girl', 0, { form: 'small', x: 1100, y: -420, face: -1, look: 0, eyes: 'normal', mouth: 'smile normal', sx: 1, sy: 1, rot: 0 }, 0);

// ================================================================== 4–5 с: Скелет большой
const SX = 520;
const SB = transform('skel', 96, 540, SX, 1, { fast: true });
// Толстый видит торт: слюни, скачет к нему
key('fat', 122, { mouth: 'happy', eyes: 'normal' }, 0);
ev('drool', { f: 126, at: 'fat:mouth', dir: -1, n: 18, snd: false });
sfx('gulp', 126, { who: 'fat', gain: 0.5 });
hop('fat', 132, 144, FX0, 1180, 60, { land: 1.25, landY: 0.78 });
hop('fat', 150, 162, 1180, 1090, 60, { land: 1.25, landY: 0.78 });
// прыгает за тортом — мимо
const JMP = 174, JL = 192;
key('fat', JMP - 6, { sx: 1.3, sy: 0.72 }, 6);
move('fat', JMP, { x: 1090, y: GROUND });
key('fat', JMP + 2, { sx: 0.84, sy: 1.18 }, 2);
move('fat', JMP + 9, { x: 1060, y: GROUND - 240 }, 'out2');
move('fat', JL, { x: 1080, y: GROUND }, 'in2');
key('fat', JMP + 9, { sx: 1, sy: 1, mouth: 'puzzlement' }, 4);
key('fat', JL, { sx: 1.3, sy: 0.72 }, 1);
key('fat', JL + 6, { sx: 1, sy: 1, eyes: 'angry', mouth: 'theeth smile' }, 5);
sfx('jump', JMP + 2, { who: 'fat', gain: 0.6 });
ev('dust', { f: JL, x: 1080, r: 50, n: 6, snd: 'land' });
ev('vein', { who: 'fat', f0: JL + 2, f1: JL + 16 });
// ================================================================== бежит за брошенным тортом и глотает
const THROW = 204, CLAND = 228, FX1 = 1600;
key('fat', THROW + 4, { mouth: 'puzzlement' }, 0);
key('fat', THROW + 8, { sx: 0.3 }, 1);
key('fat', THROW + 9, { face: 1 }, 0);
key('fat', THROW + 10, { sx: 1 }, 1);
hop('fat', 214, 226, 1080, 1330, 70);
hop('fat', 230, 242, 1330, FX1, 70);
const OPEN = 248, GULP = 256;
key('fat', OPEN, { mouth: 'puzzlement', mouthK: 1 }, 0);
key('fat', OPEN + 5, { mouthK: 2.8, sx: 1.04, sy: 1.04 }, 5, 'out');
key('fat', GULP, { mouthK: 1, mouth: 'smile normal', sx: 1.24, sy: 0.92 }, 2, 'out');
sfx('gulp', GULP, { who: 'fat' });
for (let i = 0; i < 6; i++) {
  key('fat', GULP + 6 + i * 6, { mouth: i % 2 ? 'theeth smile' : 'smile normal', sy: i % 2 ? 0.94 : 0.9, sx: i % 2 ? 1.2 : 1.26 }, 3);
  if (i % 2) sfx('chomp', GULP + 6 + i * 6, { who: 'fat', gain: 0.6 });
}
key('fat', 300, { mouth: 'happy', sx: 1.22, sy: 0.94 }, 4);
// поворачивается обратно
key('fat', 304, { sx: 0.3 }, 1);
key('fat', 305, { face: -1 }, 0);
key('fat', 306, { sx: 1.22 }, 1);

// ================================================================== 12–14.5 с: Жёлтая падает с неба
const GX = 1100, FALL = 290, LANDG = 302;
move('girl', FALL, { y: -420 });
move('girl', LANDG, { y: GROUND }, 'in2');
key('girl', LANDG, { sx: 1.3, sy: 0.7 }, 1);
key('girl', LANDG + 4, { sx: 0.94, sy: 1.08 }, 4);
key('girl', LANDG + 8, { sx: 1, sy: 1 }, 4);
sfx('whoosh', FALL, { x: GX, dur: LANDG - FALL, gain: 0.5 });
ev('dust', { f: LANDG, x: GX, r: 40, n: 6, snd: 'land' });
const GB = transform('girl', 306, GX, GX, -1, { love: ['skel', 'fat'], loveDur: 96 });

// ================================================================== 15–18 с: Толстый перелетает её и падает на Скелета
const LEAP = 400, OVER = 412, HIT = 424;
key('fat', LEAP - 6, { sx: 1.35, sy: 0.7 }, 6);
move('fat', LEAP, { x: FX1, y: GROUND });
key('fat', LEAP + 2, { sx: 0.84, sy: 1.18 }, 2);
key('fat', OVER, { sx: 1, sy: 1 }, 6);
sfx('jump', LEAP + 2, { who: 'fat', gain: 0.7 });
sfx('whoosh', LEAP + 2, { who: 'fat', dur: HIT - LEAP, gain: 0.6 });

const BIG = () => {
  const K = C.skel.big, G = C.girl.big;
  key('skel', SB, stance('skel', SX, 1, { b_B16: 12, b_B17: -12 }), 0);
  key('skel', SB + 6, { mouth: 'theeth smile' }, 0);
  // ---- поднимает торт над головой
  const PICK = 140;
  key('skel', PICK - 8, { lean: 30, hip: [0, toRig('skel', 120)], head: 10 }, 8);
  key('skel', PICK, { hitF: 1, hitFto: [CAKE0[0], CAKE0[1] - 10], hitFfix: PICK }, 4);
  CAKE.segs.push({ f0: PICK, hold: true });
  key('skel', PICK + 12, { ...stance('skel', SX, 1), hitF: 0, handF: hand('skel', 'F', 0.45, -0.78), mouth: 'happy with theeth' }, 10);
  chuckle('skel', PICK + 14, PICK + 32, { mouth: 'happy with theeth' });
  // Толстый прыгает — торт уходит выше и назад
  key('skel', JMP + 2, { handF: hand('skel', 'F', -0.55, -0.72), lean: -8 }, 5);
  key('skel', JL + 4, { handF: hand('skel', 'F', 0.45, -0.78), lean: 0 }, 6);
  // ---- бросает торт далеко за Толстого
  key('skel', THROW - 6, { handF: hand('skel', 'F', -0.65, -0.65), lean: -10 }, 6);
  key('skel', THROW, { handF: hand('skel', 'F', 0.9, -0.45), lean: 12 }, 4, 'in2');
  key('skel', THROW + 12, { ...stance('skel', SX, 1, { b_B16: 12, b_B17: -12 }), mouth: 'happy with theeth' }, 10);
  sfx('swing', THROW - 4, { who: 'skel' });
  const h0 = K.point(stateAt(THROW).skel.st, 'handF');
  const cl = [FX1 + 200, GROUND];
  CAKE.segs.push({ f0: THROW, f1: CLAND, a: [h0[0], h0[1] + 6], b: cl, arc: 300, spin: 0 });
  sfx('whoosh', THROW, { x: 1100, dur: CLAND - THROW, gain: 0.5 });
  ev('dust', { f: CLAND, x: cl[0], r: 26, n: 3, snd: 'land' });
  // глотает: торт влетает в рот и пропадает
  CAKE.segs.push({ f0: OPEN + 2, f1: GULP, a: cl, b: (f, S) => { const m = ST.target('fat:mouth', S); return [m[0], m[1] + 40]; },
    ease: 'in2', k0: 1, k1: 0.25 });
  CAKE.gone = GULP;
  chuckle('skel', THROW + 14, THROW + 40, { mouth: 'happy with theeth' });

  // ---- Жёлтая большая; оба влюблены
  key('girl', GB, stance('girl', GX, -1, { look: 0 }), 0);
  key('girl', GB + 10, { mouth: 'mini smile', eyes: 'normal', look: 0 }, 0);
  key('girl', GB + 20, { look: 1 }, 3);
  key('girl', GB + 34, { look: -1 }, 3);
  key('girl', GB + 46, { look: 0 }, 3);
  // Скелет идёт обниматься
  const S1 = 790;
  walk('skel', 360, SX, S1, 4, 11, 1, false);
  key('skel', 360, { handF: hand('skel', 'F', 0.6, -0.2), handB: hand('skel', 'B', 0.5, -0.1) }, 8);
  // ---- она приседает — Толстый пролетает над ней и падает на Скелета
  duck('girl', LEAP + 2, HIT - 2, GX, -1, 260);
  const top = (f) => K.point(stateAt(f).skel.st, 'top');
  const t0 = top(HIT);
  move('fat', OVER, { x: GX, y: GROUND - 560 }, 'out2');
  move('fat', HIT, { x: t0[0], y: t0[1] + 30 }, 'in2');
  key('fat', HIT, { sx: 1.3, sy: 0.75 }, 1);
  const SLAM = fallBack('skel', HIT + 1, S1, 1, { n: 10, stars: 70, lift: 60, dur: 2 });
  move('fat', SLAM, { x: S1 - 330, y: GROUND - 60 - 80 }, 'in2');                 // сидит на нём сверху
  key('fat', SLAM, { sx: 1.35, sy: 0.72, eyes: 'sad', mouth: 'puzzlement' }, 1);
  key('fat', SLAM + 8, { sx: 1, sy: 1 }, 6);
  ev('stars', { who: 'fat', f0: SLAM + 6, f1: 600 });
  sfx('hurt', HIT + 2, { who: 'skel' });
  ev('zoom', { f: SLAM, n: 14, k: 0.07, at: [S1 - 330, GROUND - 120] });
  key('skel', HIT + 1, { b_B16: 90, b_B17: -90 }, 6);
  // ---- победа
  key('girl', HIT + 10, { mouth: 'happy with theeth', eyes: 'normal', look: 0 }, 0);
  chuckle('girl', HIT + 12, HIT + 34, { mouth: 'happy with theeth' });
  victory('girl', HIT + 36, GX, { face: -1 });
};

ST.hooks.afterChars.push((ctx, f, S, CAM) => {
  if (f >= CAKE.gone) return;
  const c = cakeAt(f, S);
  ctx.setTransform(...CAM);
  FX.cake(ctx, c.x, c.y, CS * c.k, c.rot || 0);
});

ST.start(BIG);
