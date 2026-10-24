// Ролик 5: Радужный скелет против Жёлтой девочки — драка 25 с, 24 кадра/с, звуковые эффекты
// без музыки, по стилю «animal hospital long» (docs/animal_hospital_long.md).
//
//   0–4 с     шарик-Жёлтая (слева) и радужный шарик-Скелет (справа) смотрят друг на друга
//   4–5 с     Радужный сразу становится большим; Жёлтая пугается
//   5.5–9 с   он хватает шарик-Жёлтую, как мяч, и бросает — она скачет по траве, звёздочки
//   9–12 с    Жёлтая злится и становится большой — Радужный влюбляется
//   12–15 с   он идёт обниматься — пощёчина, он кружится, звёздочки
//   15.5–19 с злится и бьёт — она ныряет, пинок по голени: он скачет на одной ноге,
//             она тычет пальцем — падает на спину
//   19.5–25 с Жёлтая в центре, лицом к зрителю, руки вверх
'use strict';

const ST = Stage({
  name: 'v05-rainbow-yellow',
  cast: {
    girl: { small: ['girl-verity-small', { bodyHeight: 300, recolor: 'yellow' }],
      big: ['verity-big-girl', { height: 730, splitFeet: true, recolor: 'yellow' }], pivot: 337, voice: 1.4, vAngle: 50,
      moods: { angry: 'sad', grin: 'theeth smile', big: 'smile normal' } },
    rb: { small: ['skeleton-verity-small-v1', { scale: 0.455, recolor: 'rainbow' }], big: ['all-verity-color', { height: 730 }],
      pivot: 325, voice: 0.85, moods: { big: 'theeth smile' } },
  },
  order: ['rb', 'girl'],
  background: { sky: ['#4ab0f0', '#b6daf3', '#efe6cf'], seed: 85 },
  clouds: [[100, 70, 1.2, 1, 26], [520, 210, 0.8, 2, 21], [930, 120, 1.1, 0, 31], [1330, 60, 0.9, 1, 18],
    [1710, 180, 1.0, 2, 24], [300, 300, 0.7, 0, 28]],
});
const { GROUND, C, key, move, ev, sfx, hop, tumble, laugh, tremble, transform, love, stance, walk, turn,
  strike, kick, dodge, duck, recoil, fallBack, victory, hand, toRig, statesAt, stateAt } = ST;

// ================================================================== 0–4 с: стойка
key('girl', 0, { form: 'small', x: 560, y: GROUND, face: 1, look: 1, eyes: 'angry', mouth: 'smile normal', sx: 1, sy: 1, rot: 0 }, 0);
key('rb', 0, { form: 'small', x: 1360, y: GROUND, face: -1, look: 1, eyes: 'angry', mouth: 'theeth smile', sx: 1, sy: 1, rot: 0 }, 0);

// ================================================================== 4–5 с: Радужный большой
const RX = 1300;
const RB = transform('rb', 96, 1360, RX, -1, { fast: true });
key('girl', RB, { mouth: 'puzzlement', eyes: 'sad' }, 0);
sfx('scared', RB + 2, { who: 'girl', gain: 0.8 });
tremble('girl', RB + 2, RB + 18, 560, 2);
ev('sweat', { who: 'girl', f0: RB + 2, f1: RB + 30 });

// голень передней ноги (для пинка по ноге)
ST.parts.shin = (ch, st) => {
  const L = ch.leg.F, b = ch.bones;
  const k = E.apply(st.G, E.apply(st.W[L[0]], b[L[1]].base)), a = E.apply(st.G, E.apply(st.W[L[1]], b[L[2]].base));
  return [E.lerp(k[0], a[0], 0.55), E.lerp(k[1], a[1], 0.55)];
};

const GX = 430;                                  // где Жёлтая станет большой
const R1 = 820, GRAB = 176, REL = 204, LAND = 228, BX = 240;
const GB = transform('girl', 262, BX, GX, 1, { love: 'rb', loveDur: 44 });

const BIG = () => {
  const R = C.rb.big, g = C.girl.small;
  key('rb', RB, stance('rb', RX, -1), 0);
  key('rb', RB + 6, { mouth: 'theeth smile' }, 0);

  // ---- подходит, наклоняется и хватает шарик за бантик
  walk('rb', 130, RX, R1, 4, 10, -1);
  key('rb', GRAB - 4, { lean: 34, hip: [0, toRig('rb', 120)], head: 10, handF: hand('rb', 'F', 0.6, 0.6), hitF: 0 }, 8);
  key('rb', GRAB, { hitF: 1, hitFto: 'girl:top', hitFfix: GRAB }, 4);
  key('rb', GRAB + 8, { hitF: 0, lean: 0, hip: [0, toRig('rb', 8)], head: 0, handF: hand('rb', 'F', 0.35, -0.85) }, 8);   // поднял
  key('rb', REL - 4, { handF: hand('rb', 'F', -0.55, -0.8), lean: -10 }, 6);                                     // замах назад
  key('rb', REL, { handF: hand('rb', 'F', 0.95, -0.35), lean: 12 }, 4, 'in2');                                    // бросок
  key('rb', REL + 14, stance('rb', R1, -1, { mouth: 'happy with theeth' }), 10);
  sfx('swing', REL - 4, { who: 'rb' });
  sfx('pop', GRAB, { who: 'girl', gain: 0.7 });
  key('girl', GRAB, { mouth: 'puzzlement', eyes: 'sad' }, 0);
  sfx('scared', GRAB + 2, { who: 'girl', gain: 0.8 });
  // шарик висит в руке (хват за макушку) — по кадрам за кистью
  const hang = g.height - 22;
  for (let f = GRAB + 1; f <= REL; f++) {
    const hp = R.point(ST.stateAt(f).rb.st, 'handF');
    move('girl', f, { x: hp[0], y: hp[1] + hang }, 'lin');
  }
  // летит по дуге, кувыркаясь, падает и отскакивает
  const h0 = R.point(ST.stateAt(REL).rb.st, 'handF');
  key('girl', REL, { pivot: 337, rot: 0 }, 0);
  move('girl', REL + 10, { x: E.lerp(h0[0], BX + 60, 0.55), y: h0[1] + hang - 120 }, 'out2');
  move('girl', LAND, { x: BX + 60, y: GROUND }, 'in2');
  move('girl', LAND, { rot: -720 }, 'lin');
  key('girl', LAND + 1, { rot: 0 }, 0);
  key('girl', LAND, { sx: 1.32, sy: 0.7 }, 1);
  move('girl', LAND + 6, { x: BX, y: GROUND - 60 }, 'out2');
  key('girl', LAND + 6, { sx: 0.94, sy: 1.08 }, 4);
  move('girl', LAND + 12, { y: GROUND }, 'in2');
  key('girl', LAND + 12, { sx: 1.12, sy: 0.9 }, 2);
  key('girl', LAND + 18, { sx: 1, sy: 1 }, 5);
  sfx('whoosh', REL, { who: 'girl', dur: LAND - REL, gain: 0.6 });
  ev('dust', { f: LAND, x: BX + 60, r: 36, n: 6, snd: 'fall' });
  ev('shake', { f: LAND, amp: 10, n: 8 });
  sfx('hurt', LAND + 2, { who: 'girl' });
  sfx('bounce', LAND + 6, { who: 'girl', gain: 0.5 });
  ev('stars', { who: 'girl', f0: LAND + 8, f1: 260 });
  // Радужный смеётся
  for (let f = REL + 16; f < 256; f += 6) key('rb', f, { head: (f / 6) % 2 ? 6 : -4 }, 3);
  key('rb', 258, { head: 0 }, 3);

  // ---- Жёлтая большая — Радужный влюблён, идёт обниматься
  key('girl', GB, stance('girl', GX, 1), 0);
  key('girl', GB + 10, { mouth: 'mini smile', eyes: 'normal' }, 0);
  const LOVE = GB + 4, R2 = 820, G2 = 575;
  key('rb', LOVE, { mouth: 'puzzlement' }, 0);
  ST.love('rb', LOVE + 4, 346, { mouth: 'happy - spittle' });
  walk('rb', LOVE + 8, R1, R2, 1, 12, -1, false);
  key('rb', LOVE + 8, { handF: hand('rb', 'F', 0.7, -0.2), handB: hand('rb', 'B', 0.6, -0.1) }, 8);   // руки обнять
  key('girl', 318, { eyes: 'angry', mouth: 'angry theeth' }, 0);
  walk('girl', 320, GX, G2, 1, 10, 1);                                             // шаг навстречу
  key('rb', 330, { lean: 8, head: 8 }, 6);
  // пощёчина — кружится
  const SL = 344;
  strike('girl', SL, 'rb:cheek', { x: G2, face: 1, snd: 'slap', back: [-0.5, -0.3], to: [1, -0.3] });
  key('rb', SL + 1, { legFfk: 1, legBfk: 1, lean: 0, head: -6, hip: [0, toRig('rb', 3)], mouth: 'puzzlement',
    handF: hand('rb', 'F', 0.3, 0.9), handB: hand('rb', 'B', -0.2, 0.9) }, 2);
  for (let i = 0; i < 6; i++) {
    key('rb', SL + 4 + i * 4, { face: i % 2 ? -1 : 1 }, 3);
    sfx('whoosh', SL + 3 + i * 4, { who: 'rb', dur: 4, gain: 0.35 });
  }
  key('rb', SL + 28, { ...stance('rb', R2, -1), head: -8 }, 4);
  ev('stars', { who: 'rb', f0: SL + 26, f1: SL + 60 });
  for (let f = SL + 30; f < SL + 56; f += 8) key('rb', f, { head: (f / 8) % 2 ? -8 : 4 }, 4);

  // ---- злится, бьёт — она ныряет; пинок по голени
  const PU = 404, R3 = R2;
  key('rb', 384, { head: 0, mouth: 'angry theeth' }, 4);
  ev('vein', { who: 'rb', f0: 384, f1: 400 });
  key('rb', PU - 4, { handF: hand('rb', 'F', -0.7, 0.2), lean: -8, hip: [0, toRig('rb', 18)] }, 6);
  key('rb', PU, { handF: hand('rb', 'F', 1, -0.55), lean: 12, hip: [toRig('rb', 4), toRig('rb', 20)] }, 4, 'in2');
  sfx('swing', PU - 5, { who: 'rb' });
  ev('whoosh', { f: PU + 1, at: [G2 + 20, 200] });
  key('rb', PU + 6, { mouth: 'puzzlement' }, 0);
  key('rb', PU + 12, stance('rb', R3, -1, { mouth: 'puzzlement' }), 6);
  duck('girl', PU - 3, PU + 4, G2, 1, 240);
  const KS = 420;
  kick('girl', KS, 'rb:shin', { x: G2, face: 1, hard: false, snd: 'kick' });
  // скачет на одной ноге назад, держится за голень, теряет равновесие — падает на спину
  key('rb', KS + 1, { legFfk: 1, legF: [40, -100, 0], mouth: 'puzzlement', eyes: 'sad', lean: 14, head: 6,
    handF: hand('rb', 'F', 0.55, 0.75), handB: hand('rb', 'B', 0.75, 0.7), zB: 'front' }, 3, 'out');
  const HOPS = 4, HX = 75;
  for (let i = 0; i < HOPS; i++) {
    const f = KS + 4 + i * 8, x = R3 + HX * (i + 1);
    move('rb', f, { y: ST.GROUND });
    move('rb', f + 4, { y: ST.GROUND - 50, x: R3 + HX * (i + 0.5) }, 'out2');
    move('rb', f + 8, { y: ST.GROUND, x }, 'in2');
    sfx('hurt', f + 1, { who: 'rb', gain: 0.55, pitch: 0.95 + i * 0.07 });
    ev('dust', { f: f + 8, x, r: 18, n: 2, snd: 'land' });
  }
  const RF = R3 + HX * HOPS, FALL = KS + 4 + HOPS * 8;
  key('rb', FALL - 3, { lean: -14, head: -10, handF: hand('rb', 'F', 0.6, -0.7), handB: hand('rb', 'B', -0.4, -0.8), zB: null }, 3);
  const down = fallBack('rb', FALL, RF, -1, { lift: 45, stars: 60 });
  for (const f of [down + 20, down + 50, down + 80]) { key('rb', f, { legB: [10, -14, 0] }, 2); key('rb', f + 4, { legB: [0, 0, 0] }, 3); }
  key('girl', KS + 20, { mouth: 'happy with theeth', eyes: 'normal' }, 0);
  for (let f = KS + 24; f < KS + 48; f += 6) key('girl', f, { head: (f / 6) % 2 ? 6 : -4 }, 3);
  key('girl', KS + 50, { head: 0 }, 3);

  // ---- победа
  victory('girl', 476, G2);
};

ST.start(BIG);
