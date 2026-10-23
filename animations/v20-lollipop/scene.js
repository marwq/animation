// Ролик 20: Леденец — Радужный против Малыша (и Розовая), 25 с, 24 кадра/с, звуковые эффекты без музыки,
// по стилю «animal hospital long» (docs/animal_hospital_long.md).
//
//   0–4 с     шарик-Малыш (слева) с леденцом во рту и радужный шарик-Скелет (справа) смотрят друг на друга
//   4–5 с     Радужный сразу становится большим
//   5–8 с     подходит, выдёргивает леденец у Малыша изо рта и облизывает; Малыш ревёт ручьём
//   8–10 с    Малыш становится большим — Радужный отпрыгивает
//   10.5–12 с Малыш летит на пропеллере головой вперёд — Радужный бьёт его леденцом, как битой,
//             Малыш кувырком падает на спину
//   12–15 с   прискакал шарик-Розовая и стала большой — оба влюбились
//   15–17 с   Радужный дарит ей леденец, она облизывает; Малыш встаёт и ревнует
//   18–19 с   Малыш пинает Радужного под зад — тот улетает в небо
//   20–21 с   Малыш тянется к леденцу — Розовая бьёт им наотмашь, Малыш улетает за кадр
//   21–25 с   Розовая в центре, руки вверх, леденец в руке
'use strict';

const ST = Stage({
  name: 'v20-lollipop',
  cast: {
    baby: { small: ['child-verity-pink', { bodyHeight: 300, spin: { layer: 'hat', cut: 122, axis: 389 } }],
      big: ['child-verity-big', { height: 730, spin: { layer: 'hat', cut: 106, axis: 330 } }], pivot: 338, voice: 1.25,
      lie: 60, moods: { angry: ' 5', grin: ' 1', big: 'mouth' } },
    rb: { small: ['skeleton-verity-small', { scale: 0.455, recolor: 'rainbow' }], big: ['all-verity-color', { height: 730 }],
      pivot: 325, voice: 0.85, moods: { big: 'theeth smile' } },
    pink: { small: ['girl-verity-small', { bodyHeight: 300 }], big: ['girl-verity-big', { height: 730, splitFeet: true }],
      pivot: 337, voice: 1.35, vAngle: 50, moods: { angry: 'sad', grin: 'theeth smile', big: 'smile normal' } },
  },
  order: ['baby', 'rb', 'pink'],
  background: { sky: ['#52aaf3', '#b8d6f5', '#f4e4d0'], seed: 240 },
  clouds: [[120, 90, 1.1, 1, 25], [540, 200, 0.8, 0, 21], [930, 70, 1.2, 2, 28], [1350, 170, 0.9, 1, 19],
    [1740, 80, 1.0, 0, 30], [760, 310, 0.7, 2, 23]],
});
const { GROUND, C, key, move, ev, sfx, hop, tumble, laugh, tremble, transform, love, stance, walk, turn,
  strike, kick, dodge, duck, recoil, fallBack, getUp, flyOff, victory, chuckle, spinAround, hand, toRig,
  statesAt, stateAt, target } = ST;

// пропеллер: разгон / ровное вращение / остановка (обороты в секунду)
function propeller(who, f0, f1, rps = 7, o = {}) {
  key(who, f0, { spin: 0, spinBlur: 0 }, 0);
  key(who, f0 + 8, { spinBlur: 1 }, 8);
  move(who, f1, { spin: rps * (f1 - f0) / 24 }, 'lin');
  key(who, f1, { spinBlur: 0 }, 6);
  key(who, f1 + 1, { spin: 0 }, 0);
  if (o.snd !== false) sfx('whirr', f0, { who, dur: f1 - f0, gain: o.gain ?? 0.45 });
}

// зад (таз сзади) — сюда пинок
ST.parts.butt = (ch, st, p) => {
  const l = ch.layers.find((x) => x.name === 'hip');
  const c = E.apply(ch.layerMatrix(st, 'hip'), [(l.bbox[0] + l.bbox[2]) / 2, (l.bbox[1] + l.bbox[3]) / 2]);
  return [c[0] - (p.face || 1) * ch.width * 0.16, c[1]];
};

// ------------------------------------------------------------------ леденец
// держатель с кадра f0: {mouth: true} — во рту шарика-Малыша; {hand: кто} — в руке B (ближней)
// наклон в руке — ключи LR: [кадр, радианы, сглаживание]; 0 — конфета сверху
const LS = 130, LK = LS / 120, GRIP = 24, STICK = 112 * LK - GRIP;   // от кулака до центра конфеты
const LP = [{ f0: 0, mouth: true }], LR = [];
const MOUTH = [332, 672];                                            // уголок рта ' 6' шарика (пиксели рига)
const lrot = (f) => {
  if (!LR.length) return 0;
  const ks = [...LR].sort((a, b) => a[0] - b[0]);
  if (f <= ks[0][0]) return ks[0][1];
  for (let i = 1; i < ks.length; i++) {
    if (f < ks[i][0]) {
      const [f0, r0] = ks[i - 1], [f1, r1, e] = ks[i];
      return E.lerp(r0, r1, E.EASE[e || 'io']((f - f0) / (f1 - f0)));
    }
  }
  return ks[ks.length - 1][1];
};
const dirOf = (r) => [Math.sin(r), -Math.cos(r)];
const lpAt = (f, S) => {
  let cur = null;
  for (const c of LP) if (f >= c.f0) cur = c;
  if (cur.mouth) {
    const m = E.apply(C.baby.small.eyeMatrix(S.baby.st, ' 6'), MOUTH);
    return { x: m[0], y: m[1], rot: 0.9 * (S.baby.p.face || 1) };
  }
  const h = C[cur.hand].big.point(S[cur.hand].st, 'handB'), r = lrot(f), d = dirOf(r);
  return { x: h[0] - GRIP * d[0], y: h[1] - GRIP * d[1], rot: r, hand: cur.hand };
};
// кулак, при котором центр конфеты попадёт в точку c
const gripFor = (c, r) => { const d = dirOf(r); return [c[0] - STICK * d[0], c[1] - STICK * d[1]]; };
// облизывает: конфета у губ, палочка чуть наклонена к лицу
function lick(who, f0, f1, licks) {
  const S = stateAt(f0), face = S[who].p.face || 1, lips = target(`${who}:lips`, S);
  const r = -0.3 * face;
  LR.push([f0 - 6, lrot(f0 - 6)], [f0, r], [f1, r]);
  key(who, f0, { hitB: 1, hitBto: gripFor([lips[0] + face * 36, lips[1] - 4], r), hitBfix: f0, mouth: 'happy - spittle' }, 6);
  for (const f of licks) {
    key(who, f - 3, { head: 7, mouth: 'happy - spittle' }, 3);
    key(who, f + 3, { head: -2, mouth: 'happy open mouth' }, 3);
    sfx('lick', f, { who, gain: 0.8 });
  }
  key(who, f1, { hitB: 1, head: 0 }, 3);
}

const BS = 560, RS = 1360;
// ================================================================== 0–4 с: стойка
key('baby', 0, { form: 'small', x: BS, y: GROUND, face: 1, look: 1, eyes: 'angry', mouth: ' 6', sx: 1, sy: 1, rot: 0 }, 0);
key('rb', 0, { form: 'small', x: RS, y: GROUND, face: -1, look: 1, eyes: 'angry', mouth: 'theeth smile', sx: 1, sy: 1, rot: 0 }, 0);
key('pink', 0, { form: 'small', x: 2160, y: GROUND, face: -1, look: 1, eyes: 'normal', mouth: 'smile normal', sx: 1, sy: 1, rot: 0 }, 0);
for (const f of [30, 62]) { key('baby', f, { sx: 1.04, sy: 0.96 }, 3); key('baby', f + 6, { sx: 1, sy: 1 }, 4); }   // посасывает

// ================================================================== 4–5 с: Радужный большой
const RX0 = 1300;
const RB = transform('rb', 96, RS, RX0, -1, { fast: true });
key('baby', RB, { eyes: 'sad' }, 0);
ev('sweat', { who: 'baby', f0: RB + 2, f1: RB + 30 });

// ================================================================== 8–10 с: Малыш большой
const BX = 360;
const BB = transform('baby', 196, BS, BX, 1);

// ================================================================== 12–15 с: Розовая
hop('pink', 280, 292, 2160, 1920, 70);
hop('pink', 296, 308, 1920, 1700, 70);
const PX = 1690;
const PB = transform('pink', 314, 1700, PX, -1, { love: 'rb', loveDur: 84 });

const BIG = () => {
  const B = C.baby.big, R = C.rb.big, PV = 990 * B.scale;      // PV — середина роста большого Малыша (сцена)
  const HOLD = hand('rb', 'B', 0.65, 0.2);                    // держит леденец перед собой, ниже лица
  key('rb', RB, stance('rb', RX0, -1), 0);
  key('rb', RB + 4, { mouth: 'happy with theeth', eyes: 'normal' }, 0);

  // ---- подходит и выдёргивает леденец изо рта
  const RX1 = 870;
  walk('rb', 120, RX0, RX1, 3, 9, -1);
  const GRAB = 156;
  const S0 = stateAt(GRAB), l0 = lpAt(GRAB, S0), d0 = dirOf(l0.rot);
  const grip0 = [l0.x + d0[0] * (GRIP + 34), l0.y + d0[1] * (GRIP + 34)];
  key('rb', GRAB - 8, { lean: 30, hip: [0, toRig('rb', 150)], head: 12, handB: hand('rb', 'B', 0.6, 0.3), mouth: 'theeth smile' }, 8);
  key('rb', GRAB, { hitB: 1, hitBto: grip0, hitBfix: GRAB }, 6);
  LP.push({ f0: GRAB, hand: 'rb' });
  LR.push([GRAB, l0.rot], [GRAB + 10, 0]);
  key('rb', GRAB + 12, { ...stance('rb', RX1, -1), hitB: 0, handB: HOLD, mouth: 'happy with theeth' }, 10);
  sfx('pop', GRAB + 3, { who: 'baby', gain: 0.9 });
  // облизывает и смеётся
  lick('rb', 172, 190, [176, 186]);
  key('rb', 198, { hitB: 0, handB: HOLD }, 8);
  LR.push([198, 0]);
  chuckle('rb', 196, 216, { mouth: 'happy with theeth' });
  // Малыш ревёт ручьём
  key('baby', GRAB + 3, { mouth: ' 2', eyes: 'sad', sx: 1.12, sy: 0.9 }, 2);
  key('baby', GRAB + 8, { sx: 1, sy: 1 }, 4);
  ev('tears', { who: 'baby', f0: GRAB + 8, f1: 196, s: 1.5 });
  laugh('baby', GRAB + 10, 194);

  // ---- Малыш большой — Радужный отпрыгивает
  const RX2 = 1250;
  key('rb', BB - 6, { mouth: 'puzzlement', eyes: 'sad' }, 0);
  ev('sweat', { who: 'rb', f0: BB - 4, f1: BB + 20 });
  sfx('scared', BB - 4, { who: 'rb', gain: 0.7 });
  dodge('rb', BB - 4, RX1, RX2, -1, { h: 40 });
  key('rb', BB + 26, { handB: HOLD, mouth: 'theeth smile', eyes: 'normal' }, 8);
  key('baby', BB, stance('baby', BX, 1), 0);
  key('baby', BB + 6, { mouth: 'angry theeth', eyes: 'angry' }, 0);

  // ---- летит на пропеллере головой вперёд — леденцом, как битой
  const PROP = 254, FLY = 260, BONK = 280, CRASH = 302;
  const YF = GROUND - 140, XC = 500;
  propeller('baby', PROP, CRASH, 9);
  key('baby', FLY - 4, { hip: [0, toRig('baby', 50)], lean: 10, handF: hand('baby', 'F', -0.6, 0.6), handB: hand('baby', 'B', -0.7, 0.5) }, 4);
  key('baby', FLY, { pivot: 990, rot: 0, legFfk: 1, legBfk: 1, legF: [-10, 20], legB: [12, -20] }, 0);
  move('baby', FLY, { x: BX, y: GROUND });
  move('baby', FLY + 12, { x: 400, y: YF }, 'out2');
  move('baby', FLY + 12, { rot: 80 }, 'io');
  key('baby', FLY + 10, { hip: [0, 0], lean: 0, handF: [80, -560], handB: [0, -540], head: -10 }, 6);
  sfx('jump', FLY + 1, { who: 'baby', gain: 0.6 });
  // Радужный: замах леденцом назад-вверх, удар
  const WIND = BONK - 6;
  key('rb', WIND, { handB: hand('rb', 'B', -0.6, -0.75), lean: -8, hip: [0, toRig('rb', 18)], hitB: 0, mouth: 'angry theeth', eyes: 'angry' }, 8);
  LR.push([WIND - 8, 0], [WIND, 0.6], [BONK - 4, 0.6]);
  const RHIT = -1.45;
  LR.push([BONK, RHIT, 'in2'], [BONK + 6, RHIT]);
  key('rb', BONK, { handB: hand('rb', 'B', 0.95, -0.1), lean: 14, hip: [toRig('rb', 6), toRig('rb', 30)] }, 4, 'in2');
  // где кулак: из него — центр конфеты; Малыш влетает головой в конфету
  const SR = stateAt(BONK), fist = R.point(SR.rb.st, 'handB'), dR = dirOf(RHIT);
  const candy = [fist[0] + STICK * dR[0], fist[1] + STICK * dR[1]];
  const SB = stateAt(FLY + 12), head = B.point(SB.baby.st, 'head');      // та же поза, опора в (400, YF)
  const fb = B.faceBox, hr = (fb[3] - fb[1]) * B.scale * 0.5;
  const a = E.rad(80), want = [candy[0] - Math.sin(a) * (hr + 30), candy[1] + Math.cos(a) * (hr + 30)];
  const XB = 400 + (want[0] - head[0]), YB = YF + (want[1] - head[1]);
  move('baby', BONK, { x: XB, y: YB }, 'in2');
  move('baby', BONK, { rot: 80 });
  sfx('whoosh', BONK - 8, { who: 'baby', dur: 8, gain: 0.7 });
  ev('spark', { f: BONK, at: candy, r: 90, snd: 'bonk', swing: false, victim: 'baby' });
  sfx('swing', BONK - 5, { who: 'rb', gain: 0.8 });
  ev('shake', { f: BONK, amp: 20, n: 14 });
  ev('zoom', { f: BONK, n: 12, k: 0.08, at: candy });
  key('rb', BONK + 14, { ...stance('rb', RX2, -1), handB: HOLD, mouth: 'happy with theeth', eyes: 'normal' }, 10);
  LR.push([BONK + 14, 0]);
  chuckle('rb', BONK + 16, BONK + 40, { mouth: 'happy with theeth' });
  // Малыш кувырком назад и на спину
  key('baby', BONK + 1, { mouth: 'puzzlement', eyes: 'sad', handF: hand('baby', 'F', 0.2, -0.9), handB: hand('baby', 'B', -0.3, -0.8),
    legF: [-30, 40], legB: [20, -30] }, 2);
  move('baby', BONK + 8, { x: XB - 90, y: YB - 90 }, 'out2');
  move('baby', CRASH, { x: XC, y: GROUND + PV - 60 }, 'in2');
  move('baby', CRASH, { rot: -450 }, 'out');
  key('baby', CRASH + 1, { rot: -90 }, 0);
  key('baby', CRASH, { legF: [0, 0], legB: [0, 0], handF: hand('baby', 'F', 0.1, -0.95), handB: hand('baby', 'B', -0.05, -0.95) }, 4);
  ev('dust', { f: CRASH, x: XC - PV * 0.6, r: 80, n: 8, snd: 'slam' });
  ev('shake', { f: CRASH, amp: 22, n: 16 });
  sfx('fall', CRASH, { who: 'baby' });
  sfx('hurt', CRASH + 3, { who: 'baby' });
  ev('stars', { who: 'baby', f0: CRASH + 4, f1: PB + 2 });

  // ---- Розовая большая; Радужный влюблён, Малыш (лёжа) тоже
  key('pink', PB, stance('pink', PX, -1), 0);
  key('pink', PB + 8, { mouth: 'theeth smile', eyes: 'normal' }, 0);
  turn('rb', PB - 4, 1, RX2);
  love('baby', PB + 10, PB + 40);
  // ---- дарит ей леденец
  const RX3 = 1340;
  walk('rb', PB + 14, RX2, RX3, 1, 10, 1, false);
  const OFFER = PB + 28, TAKE = OFFER + 10;
  key('rb', OFFER, { handB: hand('rb', 'B', 0.9, -0.3), lean: 8 }, 8);
  const ST2 = stateAt(TAKE), give = R.point(ST2.rb.st, 'handB');
  key('pink', TAKE, { hitB: 1, hitBto: give, hitBfix: TAKE }, 7);
  LP.push({ f0: TAKE, hand: 'pink' });
  LR.push([TAKE, 0]);
  sfx('pop', TAKE, { who: 'pink', gain: 0.6 });
  key('pink', TAKE + 10, { hitB: 0, handB: hand('pink', 'B', 0.4, -0.7), mouth: 'happy with theeth' }, 8);
  key('rb', TAKE + 6, { ...stance('rb', RX3, 1), lean: 0 }, 10);
  lick('pink', TAKE + 18, TAKE + 40, [TAKE + 22, TAKE + 32]);
  key('pink', TAKE + 46, { hitB: 0, handB: hand('pink', 'B', -0.3, -0.85), mouth: 'theeth smile' }, 8);
  LR.push([TAKE + 46, 0.15]);

  // ---- Малыш встаёт и ревнует; пинок под зад — Радужный в небо
  const UP = PB + 30;
  move('baby', UP, { x: XC, y: GROUND + PV - 60, rot: -90 });
  move('baby', UP + 14, { x: XC, y: GROUND, rot: 0 }, 'io');
  key('baby', UP + 14, { ...stance('baby', XC, 1), legFfk: 0, legBfk: 0, mouth: 'angry theeth', eyes: 'angry' }, 12);
  key('baby', UP + 15, { pivot: 0 }, 0);
  sfx('jump', UP + 2, { who: 'baby', gain: 0.4 });
  ev('vein', { who: 'baby', f0: UP + 16, f1: UP + 40 });
  ev('steam', { who: 'baby', f0: UP + 18, f1: UP + 40 });
  sfx('anger', UP + 16, { who: 'baby', dur: 22, gain: 0.7 });
  const KX = 1000, W0 = UP + 20;
  walk('baby', W0, XC, KX, 4, 10, 1);
  const KK = W0 + 48;
  kick('baby', KK, 'rb:butt', { x: KX, face: 1, hard: true });
  // свечой вверх, руки над головой — не задевает ни Малыша, ни Розовую
  const FO = KK + 1;
  key('rb', FO, { legFfk: 1, legBfk: 1, legF: [-10, 30], legB: [15, 20], mouth: 'puzzlement', eyes: 'sad', lean: 0, head: -6,
    handF: hand('rb', 'F', 0.15, -0.97), handB: hand('rb', 'B', -0.1, -0.97) }, 2);
  move('rb', FO, { x: RX3, y: GROUND, rot: 0 });
  move('rb', FO + 16, { y: -1000 }, 'out2');
  move('rb', FO + 16, { x: RX3 + 60 }, 'lin');
  sfx('whoosh', FO, { who: 'rb', dur: 16, gain: 0.7 });
  sfx('scared', FO + 2, { who: 'rb', gain: 0.7 });
  ev('twinkle', { f: FO + 14, at: [RX3 + 60, 90], n: 22, size: 56 });
  key('pink', KK + 2, { mouth: 'puzzlement', eyes: 'sad' }, 0);
  key('pink', KK + 16, { mouth: 'angry theeth', eyes: 'angry' }, 0);
  chuckle('baby', KK + 4, KK + 20, { mouth: 'happy with theeth' });

  // ---- тянется к леденцу — наотмашь леденцом, за кадр
  const BX4 = 1260, W1 = KK + 22;
  walk('baby', W1, KX, BX4, 2, 8, 1, false);
  key('baby', W1 + 8, { handB: hand('baby', 'B', 0.85, -0.6), mouth: 'happy - spittle', eyes: 'normal' }, 6);
  const SW = W1 + 30;
  key('pink', SW - 8, { handB: hand('pink', 'B', -0.6, -0.75), lean: -8, hip: [0, toRig('pink', 18)], hitB: 0 }, 6);
  LR.push([SW - 10, 0.15], [SW - 4, 0.6]);
  const PHIT = -1.5;
  LR.push([SW, PHIT, 'in2'], [SW + 6, PHIT]);
  const SP = stateAt(SW), bf = target('baby:face', SP), pc = [bf[0] + 70, bf[1] - 10];
  key('pink', SW, { handB: hand('pink', 'B', 0.95, -0.12), hitB: 1, hitBto: gripFor(pc, PHIT), hitBfix: SW, lean: 14,
    hip: [toRig('pink', 6), toRig('pink', 30)] }, 4, 'in2');
  key('pink', SW + 5, { hitB: 1 }, 0);
  key('pink', SW + 9, { hitB: 0 }, 4);
  ev('spark', { f: SW, at: pc, r: 90, snd: 'bonk', swing: false, victim: 'baby' });
  sfx('swing', SW - 5, { who: 'pink', gain: 0.8 });
  ev('shake', { f: SW, amp: 22, n: 14 });
  ev('zoom', { f: SW, n: 12, k: 0.09, at: pc });
  flyOff('baby', SW + 1, SW + 26, [BX4, GROUND], [-420, -300], { turns: 3 });
  key('pink', SW + 12, { ...stance('pink', PX, -1), handB: hand('pink', 'B', 0.2, -0.85), mouth: 'happy with theeth', eyes: 'normal' }, 10);
  LR.push([SW + 12, 0]);
  victory('pink', SW + 14, PX, { n: 9, stride: 145 });
};

ST.hooks.afterChars.push((ctx, f, S, CAM) => {
  const l = lpAt(f, S);
  ctx.setTransform(...CAM);
  FX.lollipop(ctx, l.x, l.y, LS, l.rot);
  if (l.hand) {                                   // кулак поверх палочки
    const { ch, st, p } = S[l.hand];
    ch.draw(ctx, { ...st, p: { ...p, only: 'B' } }, CAM);
  }
});

ST.start(BIG);
