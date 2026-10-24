// Ролик 14: Поцелуй — Лорд, Радужный и Розовая, 25 с, 24 кадра/с, звуковые эффекты без музыки,
// по стилю «animal hospital long» (docs/animal_hospital_long.md).
//
//   0–4 с     шарик-Лорд (слева) и радужный шарик (справа) неподвижно смотрят друг на друга
//   4–5 с     Лорд сразу становится большим
//   5.5–8.5 с радужный шарик скачет на него — пинок, кувырком назад, звёздочки
//   9–11 с    Радужный злится и становится большим
//   11–12.5 с между ними с неба падает шарик-Розовая и становится большой — оба влюбились
//   13–15.5 с оба тянутся её поцеловать — она превращается обратно в шарик, и они целуют
//             друг друга; «фу!» — отпрыгивают, плюются
//   16–17.5 с шарик хохочет и снова становится большой
//   18–20 с   оба идут на неё — двойная пощёчина, оба улетают за кадр в разные стороны
//   20.5–25 с Розовая в центре, лицом к зрителю, руки вверх
'use strict';

const ST = Stage({
  name: 'v14-kiss',
  cast: {
    lord: { small: ['lord-verity-small', { bodyHeight: 300 }], big: ['lord-verity-big', { height: 730 }], pivot: 337,
      voice: 1.0, lie: 80 },
    rb: { small: ['skeleton-verity-small-v1', { scale: 0.455, recolor: 'rainbow' }], big: ['all-verity-color', { height: 730 }],
      pivot: 325, voice: 0.85, lie: 70, moods: { big: 'theeth smile' } },
    pink: { small: ['girl-verity-small', { bodyHeight: 300 }], big: ['girl-verity-big', { height: 730, splitFeet: true }],
      pivot: 337, voice: 1.35, vAngle: 50, moods: { angry: 'sad', grin: 'theeth smile', big: 'smile normal' } },
  },
  order: ['lord', 'rb', 'pink'],
  background: { sky: ['#4ea9f1', '#b1d2f4', '#f5dfd7'], seed: 185 },
  clouds: [[170, 110, 1.0, 1, 22], [610, 60, 1.2, 0, 28], [1020, 200, 0.8, 2, 19], [1420, 80, 1.0, 1, 25],
    [1790, 190, 0.9, 0, 31], [850, 300, 0.7, 2, 21]],
});
const { GROUND, C, key, move, ev, sfx, hop, tumble, laugh, tremble, transform, shrink, love, stance, walk, turn,
  strike, kick, dodge, duck, recoil, fallBack, getUp, flyOff, victory, chuckle, hand, toRig, statesAt, stateAt, target } = ST;

// бок круглого тела шарика (без крылышек) со стороны взгляда
ST.parts.ball = (ch, st, p) => {
  const b = ch.layers.find((l) => l.name === 'body').bbox, c = ch.point(st, 'body');
  return [c[0] + (p.face || 1) * (b[3] - b[1]) * 0.42 * ch.scale * (p.sx || 1), c[1]];
};

const MID = 960;
// ================================================================== 0–4 с: стойка (Розовая над кадром)
key('lord', 0, { form: 'small', x: 600, y: GROUND, face: 1, look: 1, eyes: 'angry', mouth: 'theeth smile', sx: 1, sy: 1, rot: 0 }, 0);
key('rb', 0, { form: 'small', x: 1360, y: GROUND, face: -1, look: 1, eyes: 'angry', mouth: 'theeth smile', sx: 1, sy: 1, rot: 0 }, 0);
key('pink', 0, { form: 'small', x: MID, y: -420, face: 1, look: 0, eyes: 'normal', mouth: 'smile normal', sx: 1, sy: 1, rot: 0 }, 0);

// ================================================================== 4–5 с: Лорд большой
const LX = 600;
const LB = transform('lord', 96, 600, LX, 1, { fast: true });
key('rb', LB, { mouth: 'puzzlement', eyes: 'sad' }, 0);
key('rb', 128, { mouth: 'angry theeth', eyes: 'angry' }, 0);

// ================================================================== 5.5–8.5 с: шарик скачет — пинок
hop('rb', 132, 144, 1360, 1180, 70);
hop('rb', 148, 160, 1180, 1010, 70);
hop('rb', 164, 176, 1010, 880, 60);
const KB = 182;
tumble('rb', KB + 1, KB + 30, 880, 1580, 360, 2, { stars: 24, hurt: true });

// ================================================================== 9–11 с: Радужный большой
const RX = 1560;
const RB = transform('rb', 220, 1580, RX, -1);

// ================================================================== 11–12.5 с: Розовая падает с неба и становится большой
const FALL = 266, LANDP = 278;
move('pink', FALL, { y: -420 });
move('pink', LANDP, { y: GROUND }, 'in2');
key('pink', LANDP, { sx: 1.3, sy: 0.7 }, 1);
key('pink', LANDP + 4, { sx: 0.94, sy: 1.08 }, 4);
key('pink', LANDP + 8, { sx: 1, sy: 1 }, 4);
sfx('whoosh', FALL, { x: MID, dur: LANDP - FALL, gain: 0.5 });
ev('dust', { f: LANDP, x: MID, r: 40, n: 6, snd: 'land' });
const PB = transform('pink', 284, MID, MID, 1, { fast: true, look: 0 });

const BIG = () => {
  key('lord', LB, stance('lord', LX, 1), 0);
  key('lord', LB + 6, { mouth: 'happy with theeth' }, 0);
  kick('lord', KB, 'rb:ball', { x: LX, face: 1, hard: false });
  chuckle('lord', KB + 8, KB + 34, { mouth: 'happy with theeth' });
  key('rb', RB, stance('rb', RX, -1), 0);
  key('rb', RB + 6, { mouth: 'angry theeth', eyes: 'angry' }, 0);
  key('lord', RB, { mouth: 'puzzlement' }, 0);
  ev('sweat', { who: 'lord', f0: RB + 2, f1: RB + 24 });

  // ---- Розовая большая — оба влюбились, идут к ней и тянутся целовать
  key('pink', PB, stance('pink', MID, 1, { look: 0 }), 0);
  key('pink', PB + 8, { mouth: 'mini smile', look: 0 }, 0);
  love('lord', PB + 6, 382, { mouth: 'happy - spittle' });
  love('rb', PB + 6, 382, { mouth: 'happy - spittle' });
  const L1 = 705, R1 = 1215, W0 = PB + 14;
  walk('lord', W0, LX, L1, 1, 12, 1, false);
  walk('rb', W0, RX, R1, 3, 12, -1, false);
  key('pink', W0 + 8, { look: -1 }, 3);
  key('pink', W0 + 20, { look: 1 }, 3);
  key('pink', W0 + 32, { look: 0, mouth: 'puzzlement' }, 3);
  const LEAN = W0 + 40, SHR = LEAN + 2, KISS = SHR + 16;
  for (const [who, x, face] of [['lord', L1, 1], ['rb', R1, -1]]) {
    key(who, LEAN, { mouth: 'puzzlement', lean: 12, head: 6, hip: [toRig(who, 4), toRig(who, 10)],
      handF: hand(who, 'F', 0.6, 0.1), handB: hand(who, 'B', 0.5, 0.2) }, 10);        // тянутся к ней
    key(who, KISS, { lean: 26, head: 12, hip: [toRig(who, 10), toRig(who, 20)] }, 8, 'in2');   // её нет — друг к другу
  }
  // она превращается обратно в шарик — они целуют друг друга
  shrink('pink', SHR, MID, 1, { look: 0, mouth: 'theeth smile' });
  sfx('kiss', KISS - 2, { x: MID });
  ev('hearts', { who: 'lord', f0: KISS, f1: KISS + 14, snd: false });
  ev('hearts', { who: 'rb', f0: KISS, f1: KISS + 14, snd: false });
  // «фу!» — отпрыгивают, плюются
  const EW = KISS + 16;
  for (const [who, x0, x1, face] of [['lord', L1, 560, 1], ['rb', R1, 1360, -1]]) {
    key(who, EW, { mouth: 'Throw up', eyes: 'sad', lean: -6, head: -6 }, 2);
    dodge(who, EW + 2, x0, x1, face, { mouth: 'Throw up' });
    ev('drool', { f: EW + 8, at: `${who}:lips`, dir: face, n: 18, snd: false });
    key(who, EW + 20, { handF: hand(who, 'F', 0.3, -0.6), zF: 'front', mouth: 'Throw up' }, 4);   // вытирает рот
    key(who, EW + 30, { handF: hand(who, 'F', 0.6, -0.4) }, 4);
    key(who, EW + 38, { ...stance(who, x1, face), zF: null, mouth: 'angry theeth', eyes: 'angry' }, 6);
  }
  sfx('spit', EW + 8, { who: 'lord' });
  sfx('spit', EW + 10, { who: 'rb', pitch: 0.9 });
  // шарик хохочет и снова становится большой
  key('pink', EW + 2, { mouth: 'happy with theeth', look: 0 }, 0);
  laugh('pink', EW + 4, EW + 30);
  const PB2 = transform('pink', EW + 32, MID, MID, 1, { fast: true });
  key('pink', PB2, stance('pink', MID, 1, { look: 0, mouth: 'theeth smile' }), 0);
  // ---- оба идут на неё — двойная пощёчина
  const W2 = PB2 + 6;
  walk('lord', W2, 560, L1, 1, 10, 1);
  walk('rb', W2, 1360, R1, 1, 10, -1);
  const SL = W2 + 22;
  key('pink', SL - 8, { look: 0, mouth: 'angry theeth', eyes: 'angry', handF: hand('pink', 'F', -0.3, -0.6), handB: hand('pink', 'B', 0.3, -0.6) }, 6);
  key('pink', SL, { handF: hand('pink', 'F', 0.95, -0.3), handB: hand('pink', 'B', -0.95, -0.3),
    hitF: 1, hitFto: 'rb:cheek', hitFfix: SL, hitB: 1, hitBto: 'lord:cheek', hitBfix: SL }, 4, 'in2');
  key('pink', SL + 6, { hitF: 0, hitB: 0 }, 4);
  key('pink', SL + 16, { ...stance('pink', MID, 1), look: 0, mouth: 'happy with theeth', eyes: 'normal' }, 8);
  ev('spark', { f: SL, at: 'rb:cheek', r: 70, snd: 'slap', swing: false });
  ev('spark', { f: SL, at: 'lord:cheek', r: 70, snd: 'slap', swing: false });
  sfx('swing', SL - 5, { who: 'pink' });
  ev('shake', { f: SL, amp: 18, n: 12 });
  ev('zoom', { f: SL, n: 12, k: 0.06, at: [MID, 300] });
  flyOff('lord', SL + 1, SL + 28, [L1, GROUND], [-320, -220], { turns: 3 });
  flyOff('rb', SL + 1, SL + 28, [R1, GROUND], [2240, -220], { turns: 3 });
  victory('pink', SL + 26, MID);
};

ST.start(BIG);
