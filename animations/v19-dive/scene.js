// Ролик 19: Пикирование — Скелет против Жёлтой, 25 с, 24 кадра/с, звуковые эффекты без музыки,
// по стилю «animal hospital long» (docs/animal_hospital_long.md).
//
//   0–4 с     шарик-Жёлтая (слева) и шарик-Скелет (справа) неподвижно смотрят друг на друга
//   4–5 с     Скелет сразу становится большим, взлетает на крыльях
//   7–9 с     пикирует на шарик — тот отпрыгивает, Скелет врезается лицом в траву и едет
//   10–12 с   встаёт; Жёлтая становится большой — Скелет влюблён, подлетает к ней
//   14 с      пощёчина — кувыркается в воздухе и падает на спину
//   16–18 с   злой взлетает за кадр и падает сверху бомбой — она отскакивает, он втыкается
//             головой в землю
//   19–20.5 с пинок под зад — вылетает из земли и улетает за кадр
//   20.5–25 с Жёлтая в центре, руки вверх
'use strict';

const ST = Stage({
  name: 'v19-dive',
  cast: {
    girl: { small: ['girl-verity-small', { bodyHeight: 300, recolor: 'yellow' }],
      big: ['verity-big-girl', { height: 730, splitFeet: true, recolor: 'yellow' }], pivot: 337, voice: 1.4, vAngle: 50,
      moods: { angry: 'sad', grin: 'theeth smile', big: 'smile normal' } },
    skel: { small: ['skeleton-verity-small', { scale: 0.455 }], big: ['skeleton-verity-big', { height: 730 }], pivot: 325,
      voice: 0.9, lie: 60 },
  },
  order: ['skel', 'girl'],
  background: { sky: ['#3d9eef', '#a7caf2', '#f4e0cc'], seed: 241 },
  clouds: [[160, 90, 1.0, 0, 24], [580, 200, 0.9, 1, 30], [990, 70, 1.1, 2, 21], [1400, 170, 0.8, 0, 27],
    [1790, 60, 1.0, 1, 33], [330, 300, 0.7, 2, 19]],
});
const { GROUND, C, key, move, ev, sfx, hop, tumble, laugh, tremble, transform, love, stance, walk, turn,
  strike, kick, dodge, duck, recoil, fallBack, getUp, flyOff, victory, chuckle, hand, toRig, statesAt, stateAt, target } = ST;

// взмахи крыльями f0..f1 (вниз — быстро, вверх — плавно), со звуком
function flap(f0, f1, gain = 0.5) {
  for (let f = f0; f < f1; f += 6) {
    key('skel', f, { b_B16: -30, b_B17: 30 }, 3);
    key('skel', f + 3, { b_B16: 46, b_B17: -46 }, 3, 'in');
  }
  key('skel', f1, { b_B16: 12, b_B17: -12 }, 4);
  sfx('gust', f0, { who: 'skel', dur: f1 - f0, gain });
}

// ================================================================== 0–4 с: стойка
const GS = 560;
key('girl', 0, { form: 'small', x: GS, y: GROUND, face: 1, look: 1, eyes: 'angry', mouth: 'smile normal', sx: 1, sy: 1, rot: 0 }, 0);
key('skel', 0, { form: 'small', x: 1360, y: GROUND, face: -1, look: 1, eyes: 'angry', mouth: 'theeth smile', sx: 1, sy: 1, rot: 0 }, 0);

// ================================================================== 4–5 с: Скелет большой
const SX = 1440;
const SB = transform('skel', 96, 1360, SX, -1, { fast: true });
key('girl', SB, { mouth: 'puzzlement', eyes: 'sad' }, 0);
sfx('scared', SB + 2, { who: 'girl', gain: 0.7 });
// пикирование: шарик отпрыгивает вправо
const DIVE = 178, CRASH = 192, SLIDE = 210, G1 = 1050;
hop('girl', DIVE + 2, DIVE + 26, GS, G1, 230);
key('girl', DIVE + 24, { mouth: 'happy with theeth', eyes: 'normal' }, 0);
laugh('girl', DIVE + 26, DIVE + 52);
const GX = 1000;
const GB = transform('girl', 252, G1, GX, 1, { love: 'skel', loveDur: 70 });

const BIG = () => {
  const K = C.skel.big, BP = (K.anchor[1] - K.top) / 2, pv = BP * K.scale;
  const fly = { legFfk: 1, legBfk: 1, legF: [-15, 35], legB: [10, 25] };
  key('skel', SB, stance('skel', SX, -1, { b_B16: 12, b_B17: -12 }), 0);
  key('skel', SB + 4, { mouth: 'angry theeth' }, 0);
  // ---- взлёт
  const UP = 132;
  key('skel', UP - 6, { hip: [0, toRig('skel', 60)], lean: 6 }, 6);
  key('skel', UP, { ...fly, hip: [0, 0], lean: 10, pivot: BP, rot: 0, handF: hand('skel', 'F', 0.3, 0.5), handB: hand('skel', 'B', -0.2, 0.6) }, 4);
  move('skel', UP, { x: SX, y: GROUND });
  move('skel', UP + 24, { x: 1300, y: GROUND - 90 }, 'out2');
  for (let f = UP + 24; f < DIVE - 6; f += 6) move('skel', f + 6, { y: GROUND - 90 + ((f / 6) % 2 ? -12 : 12) }, 'io');
  flap(UP, DIVE - 4, 0.5);
  sfx('jump', UP, { who: 'skel', gain: 0.5 });
  ev('dust', { f: UP + 2, x: SX, r: 40, n: 6, snd: false });
  // ---- пикирует головой вперёд на шарик — мимо — лицом в траву и едет
  key('skel', DIVE - 4, { b_B16: 70, b_B17: -70, mouth: 'angry theeth', handF: hand('skel', 'F', 0.2, -0.9), handB: hand('skel', 'B', 0.1, -0.95) }, 4);
  move('skel', DIVE, { x: 1300, y: GROUND - 90, rot: 0 });
  move('skel', DIVE + 6, { rot: -115 }, 'io');
  move('skel', CRASH, { x: 760, y: GROUND - 60 + pv, rot: -90 }, 'in2');
  move('skel', SLIDE, { x: 560 }, 'out2');
  key('skel', CRASH, { mouth: 'puzzlement', eyes: 'sad' }, 0);
  sfx('whoosh', DIVE, { who: 'skel', dur: CRASH - DIVE, gain: 0.8 });
  ev('dust', { f: CRASH, x: 760 - 330, r: 70, n: 8, snd: 'slam' });
  for (let f = CRASH + 4; f < SLIDE; f += 4) ev('dust', { f, x: E.lerp(760 - 330, 560 - 330, (f - CRASH) / (SLIDE - CRASH)), r: 26, n: 3, snd: false });
  ev('shake', { f: CRASH, amp: 18, n: 12 });
  sfx('hurt', CRASH + 2, { who: 'skel' });
  ev('stars', { who: 'skel', f0: SLIDE, f1: SLIDE + 30 });
  // ---- встаёт, поворачивается к ней
  const S1 = 560;
  key('skel', SLIDE + 2, { b_B16: 12, b_B17: -12 }, 4);
  const up = getUp('skel', SLIDE + 20, S1, -1, { forward: true, lift: 60, mouth: 'angry theeth' });
  turn('skel', up + 2, 1, S1);
  // ---- Жёлтая большая: влюблён, подлетает к ней
  key('girl', GB, stance('girl', GX, 1), 0);
  turn('girl', GB + 4, -1, GX);
  key('girl', GB + 10, { mouth: 'mini smile', eyes: 'normal' }, 0);
  const F0 = GB + 16, HOV = [GX - 380, GROUND - 60];
  key('skel', F0, { ...fly, pivot: BP, rot: 0, lean: 8, handF: hand('skel', 'F', 0.25, 0.7), handB: hand('skel', 'B', -0.2, 0.7), mouth: 'happy - spittle' }, 4);
  key('skel', 330, { lean: 18, head: 8, mouth: 'puzzlement' }, 8);                  // тянется поцеловать
  move('skel', F0, { x: S1, y: GROUND });
  move('skel', F0 + 30, { x: HOV[0], y: HOV[1] }, 'io');
  for (let f = F0 + 30; f < 340; f += 6) move('skel', f + 6, { y: HOV[1] + ((f / 6) % 2 ? -10 : 10) }, 'io');
  flap(F0, 340, 0.4);
  ST.love('skel', F0 + 2, 340, { snd: false });
  // ---- пощёчина — кувыркается в воздухе и падает на спину
  const SL = 342;
  key('girl', SL - 10, { eyes: 'angry', mouth: 'angry theeth' }, 0);
  walk('girl', SL - 22, GX, GX - 60, 1, 8, -1);
  strike('girl', SL, 'skel:cheek', { x: GX - 60, face: -1, snd: 'slap', back: [-0.5, -0.3], to: [1, -0.4], hard: true });
  key('skel', SL + 1, { mouth: 'puzzlement', eyes: 'sad' }, 0);
  move('skel', SL, { x: HOV[0], y: HOV[1], rot: 0 });
  move('skel', SL + 20, { x: 470, y: GROUND - 60 + pv, rot: -810 }, 'in2');
  key('skel', SL + 20, { legF: [0, 0, 0], legB: [0, 0, 0], handF: hand('skel', 'F', 0.1, -0.95), handB: hand('skel', 'B', -0.05, -0.95),
    zB: 'back', b_B16: 90, b_B17: -90 }, 6);
  sfx('whoosh', SL + 2, { who: 'skel', dur: 18, gain: 0.6 });
  ev('dust', { f: SL + 20, x: 470 - 300, r: 80, n: 8, snd: 'slam' });
  ev('shake', { f: SL + 20, amp: 20, n: 14 });
  ev('stars', { who: 'skel', f0: SL + 24, f1: SL + 56 });
  chuckle('girl', SL + 22, SL + 46, { mouth: 'happy with theeth' });
  walk('girl', SL + 48, GX - 60, GX + 30, 1, 10, -1);                               // шаг назад от него
  // ---- злой взлетает за кадр
  const UP2 = SL + 56;
  move('skel', UP2, { x: 470, y: GROUND - 60 + pv, rot: -810 });
  move('skel', UP2 + 12, { x: 470, y: GROUND, rot: -720 }, 'io');
  key('skel', UP2 + 12, { ...stance('skel', 470, 1), ...fly, zB: null, b_B16: 12, b_B17: -12, mouth: 'angry theeth', eyes: 'angry' }, 10);
  ev('vein', { who: 'skel', f0: UP2 + 12, f1: UP2 + 28 });
  sfx('anger', UP2 + 12, { who: 'skel', dur: 16, gain: 0.7 });
  const OFF = UP2 + 44;
  move('skel', UP2 + 22, { x: 470, y: GROUND });
  move('skel', OFF, { x: GX, y: -900 }, 'in');
  flap(UP2 + 22, OFF, 0.6);
  // ---- сверху бомбой — она отскакивает — он втыкается головой в землю
  const BOMB = OFF + 18, HIT = BOMB + 10;
  key('girl', BOMB - 10, { mouth: 'puzzlement', look: 0, head: -14 }, 4);                      // смотрит вверх
  sfx('scared', BOMB - 8, { who: 'girl', gain: 0.6 });
  dodge('girl', BOMB, GX + 30, GX + 260, -1);
  key('skel', BOMB - 1, { pivot: BP, rot: 180, b_B16: 80, b_B17: -80, handF: hand('skel', 'F', 0.1, -0.95), handB: hand('skel', 'B', 0, -0.95) }, 0);
  move('skel', BOMB, { x: GX, y: -500 });
  move('skel', HIT, { x: GX, y: GROUND + 120 - K.height + 2 * pv }, 'in2');
  sfx('whoosh', BOMB - 4, { who: 'skel', dur: 14, gain: 0.8 });
  ev('dust', { f: HIT, x: GX, r: 90, n: 8, snd: 'slam' });
  ev('shake', { f: HIT, amp: 24, n: 16 });
  ev('zoom', { f: HIT, n: 14, k: 0.07, at: [GX, GROUND - 200] });
  sfx('hurt', HIT + 2, { who: 'skel', gain: 0.6, pitch: 0.7 });
  for (let f = HIT + 4; f < HIT + 40; f += 6) key('skel', f, { legF: (f / 6) % 2 ? [-40, 70] : [10, 10], legB: (f / 6) % 2 ? [10, 10] : [-40, 70] }, 3);
  // ---- пинок под зад — вылетает и улетает
  const G2 = GX + 260, KK = HIT + 34;
  key('girl', HIT + 6, { head: 0, look: 1, mouth: 'happy with theeth' }, 4);
  walk('girl', HIT + 12, G2, GX + 200, 1, 8, -1);
  kick('girl', KK, 'skel:hip', { x: GX + 200, face: -1, hard: true });
  move('skel', KK, { x: GX, y: GROUND + 120 - K.height + 2 * pv, rot: 180 });
  move('skel', KK + 28, { x: -400, y: -300, rot: 180 + 720 }, 'out2');
  sfx('pop', KK, { who: 'skel' });
  sfx('scared', KK + 2, { who: 'skel', gain: 0.8 });
  sfx('whoosh', KK, { who: 'skel', dur: 26, gain: 0.7 });
  ev('dust', { f: KK, x: GX, r: 50, n: 6, snd: false });
  ev('twinkle', { f: KK + 26, at: [110, 120], n: 22, size: 56 });
  victory('girl', KK + 20, GX + 200, { n: 9 });
};

ST.parts.hip = (ch, st) => E.apply(ch.layerMatrix(st, 'hip'), [(ch.layers.find((l) => l.name === 'hip').bbox[0] + ch.layers.find((l) => l.name === 'hip').bbox[2]) / 2,
  (ch.layers.find((l) => l.name === 'hip').bbox[1] + ch.layers.find((l) => l.name === 'hip').bbox[3]) / 2]);

// голова «под землёй»: поверх кусок фона и холмик
ST.hooks.afterChars.push((ctx, f, S, CAM) => {
  const p = S.skel.p;
  if (p.form !== 'big' || Math.abs(((p.rot % 360) + 360) % 360 - 180) > 30 || p.y < GROUND - 300 || p.y > GROUND + 400) return;
  ctx.setTransform(...CAM);
  ST.bgPatch(ctx, p.x - 190, GROUND + 6, 380, 220);
  for (const [dx, r] of [[-80, 30], [-35, 40], [15, 38], [62, 30]]) FX.puff(ctx, p.x + dx, GROUND + 4, r, 1, '#a3622c', '#4a2a10');
});

ST.start(BIG);
