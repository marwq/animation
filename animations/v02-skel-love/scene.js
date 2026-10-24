// Ролик 2: Скелет и Девочка — драка 25 с, 24 кадра/с, звуковые эффекты без музыки,
// по стилю «animal hospital long» (docs/animal_hospital_long.md).
//
//   0–4 с     шарик-Девочка (слева) и шарик-Скелет (справа) неподвижно смотрят друг на друга
//   4–5 с     Скелет смеётся — Девочка злится и становится большой; шарик-Скелет влюбляется
//   5.4–8.5 с влюблённый шарик скачет к ней — она пинает его, как мяч, он улетает кувырком
//   9.5–12 с  Скелет злится и превращается в большого крылатого — теперь влюбляется Девочка
//   12.5–17 с мечтательно идёт к нему и шлёт поцелуи: от первого он ныряет, от второго взлетает
//   17–18.5 с третий поцелуй он отбивает ладонью — сердце летит обратно, Девочка падает на спину
//   19–25 с   Скелет в центре, лицом к зрителю, руки и крылья вверх
'use strict';

const ST = Stage({
  name: 'v02-skel-love',
  cast: {
    girl: { small: ['girl-verity-small', { bodyHeight: 300 }], big: ['girl-verity-big', { height: 730, splitFeet: true }],
      pivot: 337, voice: 1.35, vAngle: 50, moods: { angry: 'sad', grin: 'theeth smile', big: 'smile normal' } },
    skel: { small: ['skeleton-verity-small-v1', { scale: 0.455 }], big: ['skeleton-verity-big', { height: 730 }], pivot: 325,
      voice: 0.9 },
  },
  order: ['skel', 'girl'],
  background: { sky: ['#52a8f5', '#b4cff6', '#f3dfc9'], seed: 52 },
  clouds: [[180, 100, 1.0, 1, 25], [640, 220, 0.8, 0, 20], [1050, 70, 1.2, 2, 30], [1450, 170, 0.9, 1, 23],
    [1800, 260, 0.8, 0, 18], [330, 290, 0.7, 2, 27]],
});
const { GROUND, C, key, move, ev, sfx, hop, tumble, laugh, tremble, transform, love, blowKiss, stance, walk, turn,
  strike, kick, dodge, duck, fallBack, victory, hand, toRig, statesAt, stateAt } = ST;

// бок круглого тела шарика (без крылышек) со стороны взгляда, на половине высоты
ST.parts.ball = (ch, st, p) => {
  const b = ch.layers.find((l) => l.name === 'body').bbox, c = ch.point(st, 'body');
  return [c[0] + (p.face || 1) * (b[3] - b[1]) * 0.42 * ch.scale * (p.sx || 1), c[1]];
};

// ================================================================== 0–4 с: стойка
key('girl', 0, { form: 'small', x: 560, y: GROUND, face: 1, look: 1, eyes: 'angry', mouth: 'smile normal', sx: 1, sy: 1, rot: 0 }, 0);
key('skel', 0, { form: 'small', x: 1360, y: GROUND, face: -1, look: 1, eyes: 'angry', mouth: 'theeth smile', sx: 1, sy: 1, rot: 0 }, 0);

// ================================================================== 4–5 с: смех — Девочка большая, Скелет влюбился
key('skel', 96, { mouth: 'happy with theeth', eyes: 'normal' }, 0);
laugh('skel', 98, 120);
const GX = 520;
const GB = transform('girl', 96, 560, GX, 1, { fast: true, love: 'skel', loveDur: 112 });
key('skel', GB + 2, { mouth: 'puzzlement' }, 0);

// ================================================================== 5.4–8.5 с: скачет к ней — пинок, как по мячу
hop('skel', 130, 142, 1360, 1200, 70);
hop('skel', 148, 160, 1200, 1050, 70);
hop('skel', 166, 178, 1050, 905, 60);
for (let f = 184; f < 200; f += 4) key('skel', f, { rot: (f / 4) % 2 ? -6 : 6 }, 2);   // качается от любви
key('skel', 200, { rot: 0 }, 2);
tumble('skel', 205, 240, 905, 1560, 420, 3, { stars: 40, hurt: true });
key('skel', 206, { eyes: 'sad', mouth: 'puzzlement' }, 0);

// ================================================================== 10–12 с: Скелет превращается
const SX = 1480;
const SB = transform('skel', 258, 1560, SX, -1, { love: 'girl', loveDur: 196 });

const BIG = () => {
  const g = C.girl.big;
  key('girl', GB, stance('girl', GX, 1), 0);
  key('girl', GB + 8, { mouth: 'mini smile', eyes: 'normal' }, 0);
  // смотрит вниз на влюблённого шарика, злится — пинок
  key('girl', 186, { head: 12, mouth: 'puzzlement' }, 6);
  key('girl', 196, { head: 4, eyes: 'angry', mouth: 'angry theeth' }, 4);
  kick('girl', 205, 'skel:ball', { x: GX, face: 1, snd: 'kick' });
  key('girl', 232, { head: 0, mouth: 'happy with theeth', eyes: 'normal' }, 4);
  for (let f = 236; f < 256; f += 6) key('girl', f, { head: (f / 6) % 2 ? 6 : -4 }, 3);   // смеётся
  key('girl', 258, { head: 0 }, 3);

  // ---- большой Скелет: гордо расправил крылья
  key('skel', SB, stance('skel', SX, -1, { b_B16: 12, b_B17: -12 }), 0);
  key('skel', SB + 10, { b_B16: -24, b_B17: 24, lean: -6, mouth: 'theeth smile' }, 8);
  key('skel', SB + 26, { b_B16: 12, b_B17: -12, lean: 0 }, 8);

  // ---- она мечтательно идёт к нему (медленный шаг), он смотрит с подозрением
  const G2 = 760;
  walk('girl', SB + 12, GX, G2, 2, 12, 1);
  key('skel', SB + 32, { mouth: 'puzzlement', head: -6 }, 4);

  // поцелуй 1 — Скелет ныряет вниз, сердце пролетает над ним и лопается
  const K1 = 340, K2 = 380, K3 = 418;
  key('girl', K1 - 8, { handF: hand('girl', 'F', 0.25, -0.55), zF: 'front', mouth: 'puzzlement' }, 6);
  key('girl', K1, { handF: hand('girl', 'F', 0.95, -0.4), lean: 6 }, 4, 'out');
  key('girl', K1 + 10, { ...stance('girl', G2, 1), zF: null, mouth: 'happy - spittle' }, 8);
  blowKiss('girl', K1, [SX + 90, 150], { n: 14 });
  duck('skel', K1 + 4, K1 + 18, SX, -1, 240);

  // поцелуй 2 — Скелет взлетает на крыльях, сердце проходит под ним
  key('girl', K2 - 8, { handF: hand('girl', 'F', 0.25, -0.55), zF: 'front' }, 6);
  key('girl', K2, { handF: hand('girl', 'F', 0.95, -0.2), lean: 6 }, 4, 'out');
  key('girl', K2 + 10, { ...stance('girl', G2, 1), zF: null }, 8);
  blowKiss('girl', K2, [SX + 40, 640], { n: 14 });
  move('skel', K2, { y: GROUND });
  move('skel', K2 + 8, { y: GROUND - 170 }, 'out2');
  move('skel', K2 + 22, { y: GROUND - 170 });
  move('skel', K2 + 30, { y: GROUND }, 'in2');
  key('skel', K2 + 1, { legFfk: 1, legBfk: 1, legF: [-10, 30], legB: [10, -20] }, 3);
  for (let f = K2 + 2; f < K2 + 28; f += 6) {
    key('skel', f, { b_B16: -30, b_B17: 30 }, 3);
    key('skel', f + 3, { b_B16: 40, b_B17: -40 }, 3, 'in');
  }
  sfx('gust', K2 + 2, { who: 'skel', dur: 26, gain: 0.5 });
  key('skel', K2 + 30, { ...stance('skel', SX, -1), b_B16: 12, b_B17: -12 }, 2);
  ev('dust', { f: K2 + 30, x: SX, r: 34, n: 5, snd: 'land' });

  // поцелуй 3 — Скелет ладонью отбивает сердце обратно ей в лицо
  key('girl', K3 - 8, { handF: hand('girl', 'F', 0.25, -0.55), zF: 'front' }, 6);
  key('girl', K3, { handF: hand('girl', 'F', 0.95, -0.3), lean: 6 }, 4, 'out');
  key('girl', K3 + 8, { ...stance('girl', G2, 1), zF: null }, 6);
  const BAT = K3 + 12;
  const batAt = [SX - 260, 400];
  blowKiss('girl', K3, batAt, { n: 12 });
  ev('heartshot', { f0: BAT, f1: BAT + 10, from: batAt, to: 'girl:face', size: 140, snd: false });
  sfx('heart', BAT, { x: batAt[0] });
  strike('skel', BAT, batAt, { x: SX, face: -1, snd: 'slap', hard: false, mouth: 'angry theeth', back: [-0.5, -0.4], to: [1, -0.3] });
  // сердце в лицо — падает на спину, сердечки над головой
  const HIT = BAT + 10;
  key('girl', HIT, { mouth: 'happy - spittle' }, 0);
  sfx('hurt', HIT + 2, { who: 'girl', gain: 0.8 });
  const down = fallBack('girl', HIT + 2, G2, 1, { lift: 45, stars: false });
  ev('hearts', { who: 'girl', f0: down + 2, f1: 600, part: 'head', snd: false });
  ev('hearteyes', { who: 'girl', f0: HIT, f1: 600 });
  for (const f of [down + 30, down + 70, down + 110]) { key('girl', f, { legF: [10, -14, 0] }, 2); key('girl', f + 4, { legF: [0, 0, 0] }, 3); }

  // ---- победа Скелета
  key('skel', HIT + 4, { mouth: 'happy with theeth' }, 0);
  for (let f = HIT + 8; f < HIT + 26; f += 6) key('skel', f, { head: (f / 6) % 2 ? 6 : -4 }, 3);
  const VF = HIT + 30;
  victory('skel', VF, SX);
  key('skel', VF + 52, { b_B16: -30, b_B17: 30 }, 6);
};

ST.start(BIG);
