// Ролик 7: Банановая кожура — Лорд против Розовой, 25 с, 24 кадра/с, звуковые эффекты без музыки,
// по стилю «animal hospital long» (docs/animal_hospital_long.md).
//
//   0–4 с     шарик-Лорд (слева) и шарик-Розовая (справа) смотрят друг на друга; между ними
//             на траве лежит банановая кожура
//   4–5 с     Лорд сразу становится большим; Розовая пугается — замечает кожуру и ухмыляется
//   6–9 с     Лорд идёт на неё — она толкает кожуру ему под ногу, он поскальзывается и падает
//   10–13 с   Лорд встаёт; Розовая становится большой — Лорд влюбляется
//   13–17 с   мечтательно идёт к ней — снова на кожуру, едет на спине прямо ей под ноги
//   17–19 с   она пинком отправляет его кувырком за кадр, блеск
//   19.5–25 с Розовая в центре, лицом к зрителю, руки вверх
'use strict';

const ST = Stage({
  name: 'v07-lord-banana',
  cast: {
    lord: { small: ['lord-verity-small', { bodyHeight: 300 }], big: ['lord-verity-big', { height: 730 }], pivot: 337,
      voice: 1.0, lie: 80 },
    pink: { small: ['girl-verity-small', { bodyHeight: 300 }], big: ['girl-verity-big', { height: 730, splitFeet: true }],
      pivot: 337, voice: 1.35, vAngle: 50, moods: { angry: 'sad', grin: 'theeth smile', big: 'smile normal' } },
  },
  order: ['lord', 'pink'],
  background: { sky: ['#4aa5f4', '#b0d1f5', '#f4e3cf'], seed: 107 },
  clouds: [[220, 120, 1.0, 1, 26], [660, 60, 1.1, 2, 21], [1080, 190, 0.8, 0, 29], [1460, 90, 1.2, 1, 24],
    [1830, 230, 0.9, 2, 19], [420, 290, 0.7, 0, 31]],
});
const { GROUND, C, key, move, ev, sfx, hop, tumble, laugh, tremble, transform, love, stance, walk, turn,
  strike, kick, dodge, duck, recoil, fallBack, getUp, slip, flyOff, victory, chuckle, hand, toRig, statesAt, stateAt } = ST;

// ================================================================== 0–4 с: стойка
key('lord', 0, { form: 'small', x: 560, y: GROUND, face: 1, look: 1, eyes: 'angry', mouth: 'theeth smile', sx: 1, sy: 1, rot: 0 }, 0);
key('pink', 0, { form: 'small', x: 1360, y: GROUND, face: -1, look: 1, eyes: 'angry', mouth: 'smile normal', sx: 1, sy: 1, rot: 0 }, 0);

// ================================================================== 4–5 с: Лорд большой
const LX = 560;
const LB = transform('lord', 96, 560, LX, 1, { fast: true });
key('pink', LB, { mouth: 'puzzlement', eyes: 'sad' }, 0);
sfx('scared', LB + 2, { who: 'pink', gain: 0.8 });
ev('sweat', { who: 'pink', f0: LB + 2, f1: LB + 24 });
tremble('pink', LB + 2, LB + 16, 1360, 2);
// заметила кожуру — ухмыльнулась, толкнула её боком
const PUSH = 172;
key('pink', 152, { eyes: 'angry', mouth: 'theeth smile' }, 0);
move('pink', PUSH - 6, { x: 1360 });
key('pink', PUSH - 6, { sx: 1.14, sy: 0.9 }, 4);
move('pink', PUSH, { x: 1290 }, 'in2');
key('pink', PUSH, { sx: 0.86, sy: 1.1 }, 3, 'out');
move('pink', PUSH + 10, { x: 1360 }, 'io');
key('pink', PUSH + 8, { sx: 1, sy: 1 }, 6);
sfx('bonk', PUSH, { who: 'pink', gain: 0.5 });

// ================================================================== Розовая большая
const PX = 1430;
const PB = transform('pink', 252, 1360, PX, -1, { love: 'lord', loveDur: 160 });

// кожура: лежит -> едет по траве -> подлетает -> снова лежит -> едет под спиной Лорда
const PEEL = { segs: [] };
const peelAt = (f) => {
  let cur = PEEL.segs[0];
  for (const sg of PEEL.segs) if (f >= sg.f0) cur = sg;
  const u = cur.f1 > cur.f0 ? E.clamp((f - cur.f0) / (cur.f1 - cur.f0), 0, 1) : 1;
  const e = cur.ease ? E.EASE[cur.ease](u) : u;
  const x = E.lerp(cur.a[0], cur.b[0], e), arc = cur.arc ? Math.sin(Math.PI * u) * cur.arc : 0;
  return { x, y: E.lerp(cur.a[1], cur.b[1], e) - arc, rot: E.lerp(cur.r0 || 0, cur.r1 || 0, u),
    follow: cur.follow };
};

const BIG = () => {
  const L = C.lord.big;
  key('lord', LB, stance('lord', LX, 1), 0);
  key('lord', LB + 6, { mouth: 'angry theeth' }, 0);
  // идёт на неё
  const L1 = 880, WALK = 140, STEPS = 4, N = 10, SL1 = WALK + STEPS * N;
  walk('lord', WALK, LX, L1, STEPS, N, 1);
  // какая стопа ступает последней — на неё и приедет кожура
  const S1 = ST.stateAt(SL1);
  const fx = Math.max(S1.lord.p.footF[0], S1.lord.p.footB[0]);
  const P0 = [1120, GROUND - 6];
  PEEL.segs.push({ f0: 0, f1: 0, a: P0, b: P0 });
  PEEL.segs.push({ f0: PUSH, f1: SL1 - 2, a: P0, b: [fx + 20, GROUND - 6], ease: 'out2', r0: 0, r1: -0.2 });
  sfx('whoosh', PUSH, { x: 1000, dur: SL1 - PUSH, gain: 0.35 });
  // поскользнулся
  const down1 = slip('lord', SL1, L1, 1, { stars: 40 });
  sfx('boing', SL1, { x: fx, gain: 0.5 });
  const P1 = [1040, GROUND - 6];
  PEEL.segs.push({ f0: SL1, f1: SL1 + 18, a: [fx + 20, GROUND - 6], b: P1, arc: 220, r0: -0.2, r1: -0.2 + 4 * Math.PI });
  // Розовая хохочет
  key('pink', SL1 + 4, { mouth: 'happy with theeth', eyes: 'normal' }, 0);
  laugh('pink', SL1 + 6, SL1 + 40);
  // встаёт, злой
  getUp('lord', 236, L1, 1, { mouth: 'angry theeth' });

  // ---- Розовая большая — Лорд влюблён, мечтательно идёт к ней (шаг 12 кадров)
  key('pink', PB, stance('pink', PX, -1), 0);
  key('pink', PB + 10, { mouth: 'mini smile', eyes: 'normal' }, 0);
  key('lord', PB + 2, { mouth: 'puzzlement' }, 0);
  const W2 = PB + 26, ST2 = 2, N2 = 12, SL2 = W2 + ST2 * N2;
  const L2 = 1000;
  walk('lord', W2, L1, L2, ST2, N2, 1);
  key('lord', W2, { handF: hand('lord', 'F', 0.6, -0.1), handB: hand('lord', 'B', 0.4, 0.1) }, 8);   // руки к ней
  const S2 = ST.stateAt(SL2);
  const fx2 = Math.max(S2.lord.p.footF[0], S2.lord.p.footB[0]);
  PEEL.segs[PEEL.segs.length - 1].b = [fx2 + 20, GROUND - 6];                       // кожура упала прямо сюда
  // снова кожура — едет на спине прямо ей под ноги
  const down2 = slip('lord', SL2, L2, 1, { stars: false, up: 40 });
  const SLIDE = down2 + 22, L3 = 1250;
  move('lord', SLIDE, { x: L3 }, 'out2');
  PEEL.segs.push({ f0: SL2, f1: SL2, a: [fx2 + 20, GROUND - 6], b: [fx2 + 20, GROUND - 6], follow: true });
  sfx('whoosh', down2, { who: 'lord', dur: 22, gain: 0.5 });
  ev('dust', { f: down2 + 8, x: 1080, r: 26, n: 3, snd: false });
  ev('dust', { f: down2 + 16, x: 1200, r: 26, n: 3, snd: false });
  key('pink', SL2 + 4, { mouth: 'puzzlement' }, 0);
  key('pink', down2 + 10, { mouth: 'angry theeth', eyes: 'angry' }, 0);

  // ---- пинок — кувырком за кадр
  const KK = SLIDE + 10;
  kick('pink', KK, 'lord:feet', { x: PX, face: -1, hard: true });
  key('lord', KK, { pivot: 0 }, 0);
  move('lord', KK, { x: L3, y: ST.GROUND - 80, rot: -90 });
  move('lord', KK + 30, { x: -320, rot: -90 - 1080 }, 'lin');
  move('lord', KK + 30, { y: -300 }, 'out2');
  sfx('whoosh', KK, { who: 'lord', dur: 30, gain: 0.7 });
  ev('twinkle', { f: KK + 28, at: [110, 110], n: 22, size: 56 });
  PEEL.segs.push({ f0: KK, f1: KK + 20, a: [L3 - 200, GROUND - 6], b: [560, GROUND - 6], arc: 200, r0: 0, r1: -6 });

  // ---- победа
  key('pink', KK + 14, { mouth: 'happy with theeth', eyes: 'normal' }, 0);
  victory('pink', KK + 22, PX);
};

// кожура рисуется у земли, позади ног (до персонажей не дотянуться — рисуем после фона)
ST.hooks.afterChars.push((ctx, f, S, CAM) => {
  if (!PEEL.segs.length) return;
  let { x, y, rot, follow } = peelAt(f);
  if (follow) {                         // едет под спиной лежащего Лорда
    const l = S.lord;
    x = E.apply(l.st.G, l.ch.anchor)[0] - C.lord.big.height * 0.35; y = ST.GROUND - 6;
  }
  ctx.setTransform(...CAM);
  FX.banana(ctx, x, y, 120, rot);
});

ST.start(BIG);
