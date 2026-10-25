// Ролик 28 (серия по образцу): Каток — Жёлтая, Толстый и Радужный, 25 с, 24 кадра/с. Плотно, как у HugyTi:
// лёд посреди луга: Толстый-шайба, кегли, скольжение, топот — все скользят и падают.
// Музыка превращения — присланная, ~4 с с затиханием, только при первом превращении. Фон — вишнёвый сад.
//
//   0–1.8 с   шарик-Жёлтая (слева), шарик-Толстый на льду крутится как фигурист, радужный шарик (справа)
//   1.8–4 с   Радужный разгоняется и скользит по льду — сбивает Толстого, тот шайбой летит в Жёлтую —
//             её подбрасывает, она шлёпается на лёд и кружится
//   4–5.2 с   Жёлтая «растёт» под музыку — Толстый и Радужный влюблены
//   5.4–8.6 с топает по льду — оба шарика подпрыгивают, Радужный соскальзывает за край в сугроб;
//             она катит Толстого шайбой — он сбивает Радужного кувырком
//   8.6–9.9 с Радужный «растёт»
//   10–14 с   ступает на лёд — поскользнулся, едет на одной ноге, раскинув руки — сбивает Жёлтую: она на
//             спине кружится по льду — «пуф», снова шарик
//   14.2–15.5 с Жёлтая «растёт» снова — Толстый опять влюблён
//   15.6–20 с катит Толстого как шар для боулинга — Толстый сбивает Радужного, оба кувырком за кадр
//   20–25 с   Жёлтая в центре, руки вверх
'use strict';

const ST = Stage({
  name: 'mc28-ice',
  cast: {
    yel: { small: ['girl-verity-small', { bodyHeight: 300, recolor: 'yellow' }],
      big: ['verity-big-girl', { height: 730, splitFeet: true, recolor: 'yellow' }], pivot: 337, voice: 1.45, vAngle: 50, lie: 55,
      color: '#ffe23a', moods: { angry: 'angry theeth', grin: 'theeth smile', big: 'theeth smile' } },
    fat: { small: ['fat-verity-small', { bodyHeight: 450 }], pivot: 508, voice: 0.75, moods: { love: 'happy' } },
    rb: { small: ['skeleton-verity-small', { scale: 0.455, recolor: 'rainbow' }], big: ['all-verity-color', { height: 730 }],
      pivot: 325, voice: 0.85, lie: 55, color: '#ff7a3a', moods: { angry: 'angry theeth', grin: 'happy with theeth', big: 'theeth smile', love: 'happy - spittle' } },
  },
  order: ['yel', 'fat', 'rb'],
  background: { theme: 'cherry', seed: 281, sunX: 1500, sunY: 140 },
  clouds: [[120, 80, 2.4, 0, 12], [640, 210, 1.8, 1, 16], [1100, 60, 2.6, 2, 10], [420, 300, 1.4, 1, 14]],
});
const { FPS, NF, GROUND, C, key, move, ev, sfx, hop, tumble, laugh, tremble, transform, shrink, stance, walk, turn,
  stomp, fallBack, victory, chuckle, hand, toRig, statesAt, stateAt, target } = ST;

const IX0 = 520, IX1 = 1420;                       // лёд
const SPRAY = [];                                  // {f, x, dir}
const CRACK = { f0: 1e9, f1: 1e9 };
const PILE = { x: 1640, w: 240, f0: 1e9 };          // сугроб, куда упал Радужный
// скольжение шарика по льду: x0 → x1, с вращением turns; ease 'out' — тормозит
function slide(who, f0, f1, x0, x1, turns = 1, o = {}) {
  key(who, f0, { pivot: ST.CAST[who].pivot }, 0);
  move(who, f0, { x: x0, y: GROUND, rot: 0 });
  move(who, f1, { x: x1 }, o.ease || 'out');
  move(who, f1, { rot: 360 * turns * Math.sign(x1 - x0 || 1) }, o.ease || 'out');
  key(who, f1 + 1, { rot: 0 }, 0);
  sfx('slide', f0, { who, gain: 0.7, pitch: 1.2 });
  for (let f = f0; f < f1; f += 6) SPRAY.push({ f, at: who, dir: -Math.sign(x1 - x0 || 1) });
}

const YS = 300, FS = 1000, RS = 1600;
// ================================================================== 0–1.8 с: стойка
key('yel', 0, { form: 'small', x: YS, y: GROUND, face: 1, look: 1, eyes: 'normal', mouth: 'smile normal', sx: 1, sy: 1, rot: 0, pivot: 0, alpha: 1 }, 0);
key('fat', 0, { form: 'small', x: FS, y: GROUND, face: 1, look: 1, eyes: 'normal', mouth: 'happy', sx: 1, sy: 1, rot: 0, pivot: 508, mouthK: 1 }, 0);
key('rb', 0, { form: 'small', x: RS, y: GROUND, face: -1, look: 1, eyes: 'normal', mouth: 'smile normal', sx: 1, sy: 1, rot: 0, pivot: 0, alpha: 1 }, 0);

const BIG = () => {
  // Толстый — фигурист: покачивается и кружится
  for (let f = 4; f < 40; f += 12) { key('fat', f + 6, { rot: 12 }, 6); key('fat', f + 12, { rot: -12 }, 6); }
  key('fat', 40, { rot: 0 }, 3);
  key('fat', 42, { face: -1 }, 0); key('fat', 46, { face: 1 }, 0); key('fat', 50, { face: -1 }, 0);
  sfx('sparkle', 20, { who: 'fat', gain: 0.4 });

  // ---- 1.8–4 с: Радужный скользит, сбивает Толстого — тот шайбой в Жёлтую
  key('rb', 36, { mouth: 'happy with theeth', eyes: 'angry' }, 0);
  sfx('ref:grin-eee', 36, { who: 'rb', gain: 0.45, pitch: 1.15 });
  hop('rb', 38, 46, RS, 1480, 50);
  hop('rb', 48, 56, 1480, IX1 - 20, 50);
  const HIT = 70;
  slide('rb', 56, HIT, IX1 - 20, FS + 250, 1, { ease: 'lin' });
  key('rb', 58, { mouth: 'happy open mouth' }, 0);
  sfx('bonk', HIT, { who: 'fat', gain: 0.9 });
  key('fat', HIT, { sx: 1.2, sy: 0.85, mouth: 'puzzlement', eyes: 'sad', face: 1 }, 1); key('fat', HIT + 4, { sx: 1, sy: 1 }, 3);
  move('rb', HIT, { x: FS + 250, rot: 0 });
  move('rb', HIT + 8, { x: 1320 }, 'out2');
  const PUCK = HIT + 16;
  slide('fat', HIT, PUCK, FS, YS + 250, -1, { ease: 'lin' });
  sfx('whoosh', HIT, { who: 'fat', dur: 14, gain: 0.6 });
  sfx('bonk', PUCK, { who: 'yel', gain: 0.9 });
  move('fat', PUCK + 6, { x: YS + 260 }, 'out2');
  key('fat', PUCK + 6, { rot: 0 }, 0);
  ev('stars', { who: 'fat', f0: PUCK + 4, f1: PUCK + 30, snd: false });
  // Жёлтую подбрасывает — шлёпается на лёд, кружится
  const YL = PUCK + 16, YX0 = 960;
  key('yel', PUCK, { mouth: 'puzzlement', eyes: 'sad', pivot: 337 }, 0);
  move('yel', PUCK, { x: YS, y: GROUND, rot: 0 });
  move('yel', PUCK + 8, { x: (YS + YX0) / 2, y: GROUND - 520 }, 'out2');
  move('yel', YL, { x: YX0, y: GROUND }, 'in2');
  move('yel', YL, { rot: 540 }, 'lin');
  key('yel', YL, { sx: 1.3, sy: 0.75 }, 1); key('yel', YL + 5, { sx: 1, sy: 1 }, 4);
  sfx('ref:grunt', PUCK + 2, { who: 'yel', gain: 0.6, pitch: 1.5 });
  sfx('land', YL, { who: 'yel', gain: 0.6 });
  move('yel', YL + 1, { rot: 540 });
  move('yel', YL + 8, { rot: 540 + 360 }, 'out');
  key('yel', YL + 9, { rot: 0 }, 0);
  sfx('slide', YL + 1, { who: 'yel', gain: 0.5, pitch: 1.4 });
  sfx('dizzy', YL + 2, { who: 'yel', dur: 8, gain: 0.5 });
  key('rb', HIT + 10, { mouth: 'happy with theeth', eyes: 'normal' }, 0);
  sfx('ref:laugh', HIT + 12, { who: 'rb', gain: 0.85, pitch: 1.2 });
  laugh('rb', HIT + 12, HIT + 30);

  // ---- 4–5.2 с: Жёлтая «растёт» — оба влюблены
  const YX = 960;
  key('yel', YL + 8, { eyes: 'angry', mouth: 'angry theeth' }, 0);
  const YB = transform('yel', YL + 8, YX0, YX, 1, { style: 'grow', love: ['fat', 'rb'], loveDur: 50 });
  key('yel', YB, stance('yel', YX, 1), 0);
  key('yel', YB + 6, { mouth: 'theeth smile', eyes: 'normal' }, 0);

  // ---- 5.4–8.6 с: топает — шарики подпрыгивают, Радужный соскальзывает в сугроб; Толстый-шайба
  const ST1 = YB + 10, RX0 = 1320, FX0 = YS + 260, FX1 = 1260;
  const land1 = stomp('yel', ST1, YX, YX, 1, { h: 70 });
  CRACK.f0 = land1; CRACK.f1 = land1 + 40;
  sfx('ref:crack1', land1 + 1, { x: YX, gain: 0.7 });
  hop('fat', land1, land1 + 16, FX0, FX1, 520);
  hop('rb', land1, land1 + 10, RX0, RX0 + 40, 140);
  slide('rb', land1 + 10, land1 + 22, RX0 + 40, IX1 + 30, 1, { ease: 'lin' });
  const FALL = land1 + 22, PX = PILE.x;
  move('rb', FALL, { x: IX1 + 30, y: GROUND });
  move('rb', FALL + 8, { x: PX - 20, y: GROUND - 160 }, 'out2');
  move('rb', FALL + 14, { x: PX, y: GROUND + 60 }, 'in2');
  PILE.f0 = 0;
  sfx('snowhit', FALL + 14, { who: 'rb', gain: 0.9 });
  sfx('scared', FALL + 2, { who: 'rb', gain: 0.7 });
  // выпрыгивает из сугроба весь в снегу
  move('rb', FALL + 18, { x: PX, y: GROUND + 60 });
  move('rb', FALL + 24, { x: PX - 40, y: GROUND - 120 }, 'out2');
  move('rb', FALL + 30, { x: PX - 80, y: GROUND }, 'in2');
  key('rb', FALL + 30, { sx: 1.2, sy: 0.84, mouth: 'puzzlement', eyes: 'sad' }, 1); key('rb', FALL + 34, { sx: 1, sy: 1 }, 3);
  window.CAP = { f0: FALL + 18, f1: 0 };
  sfx('chatter', FALL + 30, { who: 'rb', dur: 14, gain: 0.6 });
  key('yel', land1 + 14, { mouth: 'happy with theeth', eyes: 'normal' }, 0);
  sfx('ref:laugh', land1 + 16, { who: 'yel', gain: 0.85, pitch: 1.45 });
  chuckle('yel', land1 + 16, land1 + 34, { mouth: 'happy with theeth' });
  // Толстого шайбой — сбивает Радужного
  const KY = C.yel.big, PUSH = FALL + 34, RX1 = PX - 80;
  key('yel', PUSH - 8, { lean: 24, hip: [0, toRig('yel', 110)], head: 6 }, 8);
  key('yel', PUSH, { hitF: 1, hitFto: (() => { const b = target('fat:body', stateAt(PUSH)); return [b[0] - 180, b[1] + 40]; })(), hitFfix: PUSH, lean: 30 }, 4, 'in2');
  key('yel', PUSH + 8, { ...stance('yel', YX, 1), hitF: 0, mouth: 'happy with theeth' }, 8);
  sfx('swing', PUSH - 2, { who: 'yel', gain: 0.7 });
  const BOWL = PUSH + 22;
  slide('fat', PUSH, BOWL, FX1, RX1 - 160, 1, { ease: 'lin' });
  key('fat', PUSH, { mouth: 'happy', eyes: 'normal' }, 0);
  sfx('bonk', BOWL, { who: 'rb', gain: 1.0 });
  window.CAP.f1 = BOWL;
  tumble('rb', BOWL, BOWL + 14, RX1, 1800, 200, 2, { hurt: true, stars: 18 });
  move('fat', BOWL, { x: RX1 - 160, rot: 0 });
  move('fat', BOWL + 8, { x: RX1 - 220 }, 'out2');
  key('fat', BOWL + 2, { sx: 1.18, sy: 0.86 }, 1); key('fat', BOWL + 6, { sx: 1, sy: 1 }, 3);
  ev('stars', { who: 'fat', f0: BOWL + 2, f1: BOWL + 24, snd: false });

  // ---- 8.6–9.9 с: Радужный «растёт»
  const RX = 1700, FXa = RX1 - 220;
  key('rb', BOWL + 10, { eyes: 'angry', mouth: 'angry theeth' }, 0);
  ev('vein', { who: 'rb', f0: BOWL + 10, f1: BOWL + 20 });
  const RB = transform('rb', BOWL + 12, 1800, RX, -1, { style: 'grow' });
  key('rb', RB, stance('rb', RX, -1), 0);
  key('rb', RB + 6, { mouth: 'happy with theeth', eyes: 'angry' }, 0);
  key('yel', RB - 2, { mouth: 'puzzlement', eyes: 'sad' }, 0);
  // Толстый откатывается с дороги
  hop('fat', RB, RB + 16, FXa, 330, 380);

  // ---- 10–14 с: ступает на лёд — едет на одной ноге — сбивает Жёлтую — «пуф»
  const KR = C.rb.big, WK = RB + 4, ON = WK + 18;
  walk('rb', WK, RX, IX1 - 40, 2, 9, -1);
  key('rb', ON, { legFfk: 1, legF: [-30, 50], handF: hand('rb', 'F', 0.95, -0.4), handB: hand('rb', 'B', -0.95, -0.4), lean: -8, mouth: 'puzzlement', eyes: 'sad' }, 3);
  sfx('slide', ON, { who: 'rb', gain: 0.9 });
  sfx('scared', ON + 2, { who: 'rb', gain: 0.7 });
  const BUMP = ON + 22, RS2 = YX + 150, R3 = 1350;
  move('rb', ON, { x: IX1 - 40, y: GROUND });
  move('rb', BUMP, { x: RS2 }, 'in');
  key('rb', ON, { ...KR.feet(IX1 - 40, -1) }, 0);
  key('rb', BUMP, { ...KR.feet(RS2, -1) }, BUMP - ON, 'in');
  for (let f = ON; f < BUMP; f += 5) { key('rb', f + 3, { lean: (f / 5) % 2 ? -14 : -4 }, 3); SPRAY.push({ f, at: 'rb', dir: 1 }); }
  sfx('bonk', BUMP, { who: 'yel', gain: 0.9 });
  ev('shake', { f: BUMP, amp: 12, n: 8 });
  const LIE = fallBack('yel', BUMP, YX, 1, { n: 10, stars: false, mouth: 'puzzlement' });
  key('rb', BUMP, { lean: 6, mouth: 'happy with theeth', eyes: 'normal' }, 3);
  move('rb', BUMP + 1, { x: RS2 });
  move('rb', BUMP + 14, { x: R3 }, 'out');
  key('rb', BUMP + 1, { ...KR.feet(RS2, -1) }, 0);
  key('rb', BUMP + 14, { ...KR.feet(R3, -1), legFfk: 0, lean: 0 }, 13, 'out');
  key('rb', BUMP + 18, stance('rb', R3, -1), 4);
  // она кружится на спине по льду
  key('yel', BUMP, { z: 2 }, 0);                                          // лёжа — перед Толстым
  move('yel', LIE, { x: YX });
  move('yel', LIE + 12, { x: YX - 120 }, 'out');                         // едет на спине по льду
  for (let f = LIE; f < LIE + 12; f += 3) key('yel', f + 2, { legF: (f / 3) % 2 ? [-40, 30, 0] : [20, -20, 0] }, 2);
  sfx('slide', LIE, { who: 'yel', gain: 0.6, pitch: 1.3 });
  sfx('dizzy', LIE + 4, { who: 'yel', dur: 14, gain: 0.5 });
  sfx('ref:laugh', BUMP + 4, { who: 'rb', gain: 0.85, pitch: 1.0 });
  chuckle('rb', BUMP + 4, BUMP + 24, { mouth: 'happy with theeth' });
  const sm = shrink('yel', LIE + 12, YX - 140, 1, { mouth: 'puzzlement', eyes: 'sad', smoke: 380 });
  key('yel', sm, { lean: 0, head: 0, hip: [0, 0], rot: 0, legF: null, legB: null, zB: null, z: 0 }, 0);
  key('fat', LIE + 10, { sx: 1.12, sy: 0.9, mouth: 'puzzlement', eyes: 'sad' }, 2);   // головой в бок Толстому
  key('fat', LIE + 16, { sx: 1, sy: 1 }, 6, 'out');
  sfx('boing', LIE + 10, { who: 'fat', gain: 0.5 });
  move('yel', sm, { x: YX - 140, y: GROUND, rot: 0 });
  slide('yel', sm + 2, sm + 14, YX - 140, 700, -1);
  ev('stars', { who: 'yel', f0: sm + 6, f1: sm + 26, snd: false });

  // ---- 14.2–15.5 с: Жёлтая «растёт» снова — Толстый опять влюблён
  const YX2 = 700;
  key('yel', sm + 12, { eyes: 'angry', mouth: 'angry theeth' }, 0);
  ev('vein', { who: 'yel', f0: sm + 12, f1: sm + 22 });
  const YB2 = transform('yel', sm + 14, 700, YX2, 1, { style: 'grow', love: 'fat', loveDur: 36 });
  key('yel', YB2, stance('yel', YX2, 1), 0);
  key('yel', YB2 + 6, { mouth: 'happy with theeth', eyes: 'angry' }, 0);
  key('rb', YB2 - 2, { mouth: 'puzzlement', eyes: 'sad' }, 0);

  // ---- 15.6–20 с: Толстый — шар для боулинга — Радужный и Толстый кувырком за кадр
  hop('fat', YB2 - 10, YB2 + 6, 330, YX2 + 300, 380);
  key('fat', YB2 + 18, { mouth: 'happy', eyes: 'normal' }, 0);
  const GRB = YB2 + 12;
  key('yel', GRB - 8, { lean: 24, hip: [0, toRig('yel', 120)], head: 6 }, 8);
  key('yel', GRB, { hitF: 1, hitFto: (() => { const b = target('fat:body', stateAt(GRB)); return [b[0] - 170, b[1] + 60]; })(), hitFfix: GRB }, 6);
  // замах: шаг назад и бросок
  key('yel', GRB + 10, { hitF: 0, handF: hand('yel', 'F', -0.7, 0.3), lean: -6, hip: [0, toRig('yel', 40)], head: 0 }, 8);
  const ROLL = GRB + 16;
  key('yel', ROLL, { handF: hand('yel', 'F', 0.95, 0.2), lean: 26, hip: [0, toRig('yel', 120)] }, 4, 'in2');
  key('yel', ROLL + 12, { ...stance('yel', YX2, 1), mouth: 'happy with theeth', eyes: 'normal' }, 10);
  sfx('swing', ROLL - 3, { who: 'yel', gain: 0.9 });
  const STRIKE = ROLL + 18;
  slide('fat', ROLL, STRIKE, YX2 + 300, R3 - 200, 2, { ease: 'lin' });
  sfx('whirr', ROLL, { who: 'fat', dur: 18, gain: 0.6 });
  key('rb', STRIKE - 8, { mouth: 'puzzlement', eyes: 'sad', handF: hand('rb', 'F', 0.6, -0.6), handB: hand('rb', 'B', -0.4, -0.6) }, 4);
  sfx('bonk', STRIKE, { who: 'rb', gain: 1.0 });
  sfx('slam', STRIKE, { who: 'rb', gain: 0.6 });
  ev('shake', { f: STRIKE, amp: 16, n: 10 });
  const kb = KR;
  key('rb', STRIKE, { pivot: (kb.anchor[1] - kb.top) / 2, legFfk: 1, legBfk: 1, legF: [-30, 50], legB: [25, -40] }, 0);
  move('rb', STRIKE, { x: R3, y: GROUND, rot: 0 });
  move('rb', STRIKE + 20, { x: 2400, y: -200, rot: 900 }, 'out');
  move('fat', STRIKE, { x: R3 - 200, y: GROUND, rot: 0 });
  move('fat', STRIKE + 22, { x: 2400, y: 0, rot: 1080 }, 'out');
  sfx('whoosh', STRIKE, { who: 'rb', dur: 18, gain: 0.8 });
  sfx('scared', STRIKE + 2, { who: 'rb', gain: 0.7 });
  ev('twinkle', { f: STRIKE + 18, at: [1800, 160], n: 22, size: 60 });
  sfx('ref:laugh', STRIKE + 6, { who: 'yel', gain: 0.85, pitch: 1.45 });
  chuckle('yel', STRIKE + 6, STRIKE + 22, { mouth: 'happy with theeth' });
  const WIN = victory('yel', STRIKE + 22, YX2, { n: 9, stride: 110 });
  window.T = { HIT, PUCK, YB, land1, BOWL, RB, BUMP, sm, YB2, STRIKE, WIN };
};

ST.hooks.beforeChars.push((ctx, f, S, CAM) => {
  ctx.setTransform(...CAM);
  const cr = f >= CRACK.f0 && f < CRACK.f1 ? Math.min(1, (f - CRACK.f0) / 6) * (1 - Math.max(0, (f - CRACK.f1 + 10) / 10)) : 0;
  FX.iceRink(ctx, IX0, IX1, GROUND - 6, cr, f / FPS);
  if (f >= PILE.f0) FX.snowPile(ctx, PILE.x, GROUND + 4, PILE.w, 3);
});
ST.hooks.afterChars.push((ctx, f, S, CAM) => {
  ctx.setTransform(...CAM);
  for (const s of SPRAY) {
    const u = (f - s.f) / 10;
    if (u < 0 || u > 1) continue;
    const p = statesAt(s.f)[s.at].p;
    FX.iceSpray(ctx, p.x, GROUND - 6, u, s.dir, s.f);
  }
  const cap = window.CAP;
  if (cap && f >= cap.f0 && (!cap.f1 || f < cap.f1)) { const t = target('rb:top', S); FX.snowCap(ctx, t[0], t[1] + 14, 130); }
});

ST.start(BIG);
