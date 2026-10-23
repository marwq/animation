// Ролик 8: Подарок — Жёлтая против Малыша, 25 с, 24 кадра/с, звуковые эффекты без музыки,
// по стилю «animal hospital long» (docs/animal_hospital_long.md).
//
//   0–4 с     шарик-Жёлтая (слева) и шарик-Малыш (справа) смотрят друг на друга;
//             у левого края лежит подарок
//   4–5 с     Малыш сразу становится большим; Жёлтая пугается
//   5.5–8.5 с он подходит, поворачивается спиной и с прыжка садится на неё — шарик в лепёшку
//   9–11 с    Жёлтая становится большой — Малыш влюбляется
//   11–14 с   она берёт подарок и бросает ему; он открывает — перчатка на пружине в лицо,
//             он улетает на спину
//   17–20 с   встаёт злой, бежит на неё — спотыкается о подарок, падает лицом в траву
//   20–21 с   она пинает его, как мяч, — улетает за кадр, блеск
//   21–25 с   Жёлтая в центре, руки вверх
'use strict';

const ST = Stage({
  name: 'v08-baby-gift',
  cast: {
    girl: { small: ['girl-verity-small', { bodyHeight: 300, recolor: 'yellow' }],
      big: ['verity-big-girl', { height: 730, splitFeet: true, recolor: 'yellow' }], pivot: 337, voice: 1.4, vAngle: 50,
      moods: { angry: 'sad', grin: 'theeth smile', big: 'smile normal' } },
    baby: { small: ['child-verity-pink', { bodyHeight: 300, spin: { layer: 'hat', cut: 122, axis: 389 } }],
      big: ['child-verity-big', { height: 730, spin: { layer: 'hat', cut: 106, axis: 330 } }], pivot: 338, voice: 1.25,
      lie: 60, moods: { angry: ' 5', grin: ' 2', big: 'mouth' } },
  },
  order: ['baby', 'girl'],
  background: { sky: ['#58aef5', '#bad6f6', '#f1e9d6'], seed: 118 },
  clouds: [[130, 140, 1.0, 0, 22], [520, 70, 1.2, 1, 28], [980, 200, 0.8, 2, 20], [1380, 110, 1.0, 0, 25],
    [1760, 60, 1.1, 1, 30], [700, 300, 0.7, 2, 18]],
});
const { GROUND, C, key, move, ev, sfx, hop, tumble, laugh, tremble, transform, love, stance, walk, turn,
  strike, kick, dodge, duck, recoil, fallBack, getUp, slip, flyOff, victory, chuckle, hand, toRig, statesAt, stateAt } = ST;

// пропеллер: разгон / ровное вращение / остановка (обороты в секунду)
function propeller(who, f0, f1, rps = 7, o = {}) {
  key(who, f0, { spin: 0, spinBlur: 0 }, 0);
  key(who, f0 + 8, { spinBlur: 1 }, 8);
  move(who, f1, { spin: rps * (f1 - f0) / 24 }, 'lin');
  key(who, f1, { spinBlur: 0 }, 6);
  key(who, f1 + 1, { spin: 0 }, 0);
  if (o.snd !== false) sfx('whirr', f0, { who, dur: f1 - f0, gain: o.gain ?? 0.4 });
}

const GS = 560, BS = 1360;
// ================================================================== 0–4 с: стойка
key('girl', 0, { form: 'small', x: GS, y: GROUND, face: 1, look: 1, eyes: 'angry', mouth: 'smile normal', sx: 1, sy: 1, rot: 0 }, 0);
key('baby', 0, { form: 'small', x: BS, y: GROUND, face: -1, look: 1, eyes: 'angry', mouth: ' 1', sx: 1, sy: 1, rot: 0 }, 0);

// ================================================================== 4–5 с: Малыш большой
const BX = 1400;
const BB = transform('baby', 96, BS, BX, -1, { fast: true });
key('girl', BB, { mouth: 'puzzlement', eyes: 'sad' }, 0);
sfx('scared', BB + 2, { who: 'girl', gain: 0.8 });
tremble('girl', BB + 2, BB + 22, GS, 2);
ev('sweat', { who: 'girl', f0: BB + 2, f1: BB + 36 });

// ================================================================== 5.5–8.5 с: сел сверху — лепёшка
const DROP = 200, SIT = 3;            // кадр приземления на шарик, кадров до самого низа
key('girl', DROP - 1, { sx: 1, sy: 1 }, 0);
key('girl', DROP + SIT, { sx: 1.8, sy: 0.3, eyes: 'sad', mouth: 'puzzlement' }, SIT, 'in2');
key('girl', 230, { sx: 1.75, sy: 0.32 }, 26);
key('girl', 236, { sx: 0.88, sy: 1.14 }, 6, 'out');
key('girl', 242, { sx: 1, sy: 1 }, 6);
ev('stars', { who: 'girl', f0: 238, f1: 270 });
sfx('boing', 232, { who: 'girl', gain: 0.7 });

// ================================================================== 10–12.5 с: Жёлтая большая
const GX = 430;
const GB = transform('girl', 252, GS, GX, 1, { love: 'baby', loveDur: 116 });

// подарок: лежит у края -> в руке -> летит -> лежит; крышка и пружина с перчаткой
const BOX = { segs: [], lid: [], spring: null };
const BOXS = 115;
const boxAt = (f) => {
  let cur = BOX.segs[0];
  for (const sg of BOX.segs) if (f >= sg.f0) cur = sg;
  const u = cur.f1 > cur.f0 ? E.clamp((f - cur.f0) / (cur.f1 - cur.f0), 0, 1) : 1;
  const e = cur.ease ? E.EASE[cur.ease](u) : u;
  return { x: E.lerp(cur.a[0], cur.b[0], e), y: E.lerp(cur.a[1], cur.b[1], e) - (cur.arc ? Math.sin(Math.PI * u) * cur.arc : 0),
    rot: E.lerp(cur.r0 || 0, cur.r1 || 0, u), hand: cur.hand };
};
const BOX0 = [150, GROUND];
BOX.segs.push({ f0: 0, f1: 0, a: BOX0, b: BOX0 });

const BIG = () => {
  const B = C.baby.big, G = C.girl.big;
  const HIP = 263, HIPX = 37;                       // таз над стопами и впереди них (пиксели сцены)
  const sitLegs = { legFfk: 1, legBfk: 1, legF: [-85, 80, 0], legB: [-78, 75, 0] };
  key('baby', BB, stance('baby', BX, -1), 0);
  key('baby', BB + 6, { mouth: 'theeth smile' }, 0);

  // ---- подходит, разворачивается спиной и с прыжка садится на шарик
  const B0 = 840;
  walk('baby', 128, BX, B0, 5, 10, -1);
  turn('baby', 182, 1, B0);
  key('baby', 186, { mouth: 'happy with theeth' }, 0);
  key('baby', 192, { hip: [0, toRig('baby', 40)], lean: 6 }, 5);                 // присел перед прыжком
  const SX = GS - HIPX;                                                           // таз — над серединой шарика
  move('baby', 193, { x: B0, y: GROUND });
  key('baby', 194, { ...sitLegs, hip: [0, 0], lean: -6, handF: hand('baby', 'F', 0.6, -0.4), handB: hand('baby', 'B', 0.4, -0.5) }, 3);
  move('baby', 197, { x: E.lerp(B0, SX, 0.6), y: GROUND - 90 }, 'out2');
  move('baby', DROP, { x: SX, y: GROUND - (300 - HIP) }, 'in2');                 // сел на макушку
  move('baby', DROP + SIT, { y: GROUND + (HIP - 110) }, 'in2');                  // шарик сплющился — сел на траву
  sfx('jump', 194, { who: 'baby', gain: 0.6 });
  ev('dust', { f: DROP + SIT, x: GS, r: 80, n: 8, snd: 'slam' });
  ev('shake', { f: DROP + SIT, amp: 20, n: 12 });
  ev('zoom', { f: DROP + SIT, n: 12, k: 0.06, at: [GS, GROUND - 80] });
  sfx('hurt', DROP + 2, { who: 'girl' });
  key('baby', DROP + SIT + 2, { handF: hand('baby', 'F', 0.5, 0.3), handB: hand('baby', 'B', -0.2, 0.6), lean: 0 }, 4);
  chuckle('baby', DROP + 6, DROP + 26, { mouth: 'happy with theeth' });
  // встаёт и уходит вправо, смеясь; поворачивается к ней
  const B1 = 1130;
  move('baby', 228, { x: SX, y: GROUND + (HIP - 110) });
  move('baby', 236, { x: B0, y: GROUND }, 'out2');
  key('baby', 236, { ...stance('baby', B0, 1) }, 8);
  walk('baby', 240, B0, B1, 3, 10, 1);
  turn('baby', 272, -1, B1);

  // ---- Жёлтая большая; Малыш влюблён
  key('girl', GB, stance('girl', GX, 1), 0);
  key('girl', GB + 10, { mouth: 'theeth smile', eyes: 'normal' }, 0);
  key('baby', GB + 4, { mouth: 'puzzlement' }, 0);

  // ---- она берёт подарок и бросает ему
  const G1 = 290, T1 = GB + 8;
  turn('girl', T1, -1, GX);
  walk('girl', T1 + 4, GX, G1, 1, 10, -1);
  const GRAB = T1 + 24;
  key('girl', GRAB - 8, { lean: 30, hip: [0, toRig('girl', 130)], head: 10 }, 8);
  key('girl', GRAB, { hitF: 1, hitFto: [BOX0[0] + 10, BOX0[1] - BOXS * 0.72 - 6], hitFfix: GRAB }, 4);
  key('girl', GRAB + 10, { ...stance('girl', G1, -1), hitF: 0, handF: hand('girl', 'F', 0.5, 0.6) }, 10);
  BOX.segs.push({ f0: GRAB, f1: GRAB, a: BOX0, b: BOX0, hand: true });
  sfx('pop', GRAB, { x: BOX0[0], gain: 0.5 });
  turn('girl', GRAB + 12, 1, G1);
  const TOSS = GRAB + 26, LAND = TOSS + 20, BXG = 900;
  key('girl', TOSS - 6, { handF: hand('girl', 'F', -0.6, 0.4), lean: -6, mouth: 'happy with theeth' }, 6);
  key('girl', TOSS, { handF: hand('girl', 'F', 0.9, -0.5), lean: 10 }, 4, 'in2');
  key('girl', TOSS + 12, { ...stance('girl', G1, 1), mouth: 'theeth smile' }, 8);
  sfx('swing', TOSS - 4, { who: 'girl' });
  const SH = ST.stateAt(TOSS), hp = G.point(SH.girl.st, 'handF');
  BOX.segs.push({ f0: TOSS, f1: LAND, a: [hp[0], hp[1] + BOXS * 0.36], b: [BXG, GROUND], arc: 200, r0: 0, r1: 2 * Math.PI });
  ev('dust', { f: LAND, x: BXG, r: 30, n: 4, snd: 'land' });

  // ---- он открывает — перчатка в лицо
  const B2 = 1015;
  walk('baby', LAND + 4, B1, B2, 1, 10, -1);
  const OPEN = LAND + 24;
  key('baby', OPEN - 8, { lean: 28, hip: [0, toRig('baby', 60)], head: 12, mouth: 'happy - spittle' }, 8);
  key('baby', OPEN, { hitF: 1, hitFto: [BXG + 30, GROUND - BOXS * 0.72 - 10], hitFfix: OPEN }, 4);
  BOX.lid.push({ f0: OPEN, f1: OPEN + 4, to: 1 });
  const POW = OPEN + 4;
  const face = B.point(ST.stateAt(POW).baby.st, 'face');
  const top = [BXG, GROUND - BOXS * 0.72];
  BOX.spring = { f0: POW - 3, dx: face[0] - top[0], dy: face[1] - top[1] };
  sfx('spring', POW - 3, { x: BXG });
  ev('spark', { f: POW, at: face, r: 80, snd: 'punch', swing: false, victim: 'baby' });
  ev('shake', { f: POW, amp: 18, n: 12 });
  ev('zoom', { f: POW, n: 12, k: 0.07, at: face });
  // улетает назад и падает на спину
  key('baby', POW + 2, { hitF: 0 }, 0);
  const down = fallBack('baby', POW + 2, B2, -1, { n: 18, stars: 34, dur: 2 });
  move('baby', POW + 10, { y: GROUND - 60 }, 'out2');
  move('baby', POW + 20, { x: 1160 }, 'out2');                                    // голова не уходит за край
  key('girl', POW + 2, { mouth: 'happy with theeth', eyes: 'normal' }, 0);
  chuckle('girl', POW + 4, POW + 30, { mouth: 'happy with theeth' });

  // ---- встал, бежит на неё — спотыкается о подарок, лицом в траву
  const UPF = down + 26;
  const stood = getUp('baby', UPF, 1160, -1, { lift: 60 });
  const RUN = stood + 2, N = 6, STEPS = 2, B3 = 1010;
  walk('baby', RUN, 1160, B3, STEPS, N, -1, false);
  key('baby', RUN, { lean: 12, handF: hand('baby', 'F', 0.7, -0.4), handB: hand('baby', 'B', 0.5, -0.3), mouth: 'angry theeth' }, 4);
  const TRIP = RUN + STEPS * N, BP = 990, pv = BP * B.scale;
  key('baby', TRIP, { pivot: BP, rot: 0, legFfk: 1, legBfk: 1, legF: [8, 0, 0], legB: [18, 0, 0], mouth: 'puzzlement', eyes: 'sad',
    handF: hand('baby', 'F', 0.15, -0.95), handB: hand('baby', 'B', 0.05, -0.95) }, 2);              // руки вперёд над головой
  move('baby', TRIP, { x: B3 + HIPX * -1, y: GROUND + pv - (HIP + 100) });
  move('baby', TRIP + 10, { x: 860, y: GROUND + pv - 150, rot: -86 }, 'in2');
  move('baby', TRIP + 20, { x: 740 }, 'out2');                                   // проехал на животе
  sfx('scared', TRIP + 1, { who: 'baby', gain: 0.7 });
  ev('dust', { f: TRIP + 10, x: 700, r: 70, n: 8, snd: 'slam' });
  ev('dust', { f: TRIP + 18, x: 560, r: 30, n: 4, snd: false });
  ev('shake', { f: TRIP + 10, amp: 18, n: 12 });
  sfx('hurt', TRIP + 12, { who: 'baby' });
  BOX.segs.push({ f0: TRIP, f1: TRIP + 16, a: [BXG, GROUND], b: [BXG + 520, GROUND], arc: 160, r0: 0, r1: 0 });

  // ---- пинок, как по мячу — за кадр
  const KK = TRIP + 28;
  key('girl', KK - 12, { mouth: 'angry theeth', eyes: 'angry' }, 0);
  kick('girl', KK, 'baby:head', { x: G1, face: 1, hard: true });
  key('baby', KK, { pivot: BP }, 0);
  move('baby', KK, { x: 740, y: GROUND + pv - 150, rot: -86 });
  move('baby', KK + 26, { x: 2200, rot: -90 + 900 }, 'lin');
  move('baby', KK + 26, { y: -260 }, 'out2');
  sfx('whoosh', KK, { who: 'baby', dur: 26, gain: 0.7 });
  propeller('baby', KK, KK + 28, 12, { gain: 0.5 });
  ev('twinkle', { f: KK + 24, at: [1810, 110], n: 22, size: 56 });

  // ---- победа
  key('girl', KK + 12, { mouth: 'happy with theeth', eyes: 'normal' }, 0);
  victory('girl', KK + 14, G1, { n: 8, stride: 135 });
};

ST.hooks.afterChars.push((ctx, f, S, CAM) => {
  let { x, y, rot, hand: inHand } = boxAt(f);
  if (inHand) { const h = C.girl.big.point(S.girl.st, 'handF'); x = h[0]; y = h[1] + BOXS * 0.36; }
  let lid = 0;
  for (const l of BOX.lid) if (f >= l.f0) lid = E.clamp((f - l.f0) / (l.f1 - l.f0), 0, 1) * (l.to ?? 1);
  let spring = null;
  const sp = BOX.spring;
  if (sp && f >= sp.f0) {
    const k = f - sp.f0, u = E.clamp(k / 3, 0, 1);
    const wob = k > 3 ? 1 + 0.15 * Math.sin((k - 3) * 1.6) * Math.exp(-(k - 3) / 12) : 1;
    const rest = k > 20 ? 0.55 : 1;                                   // потом пружина обвисла покороче
    spring = { dx: sp.dx * u * wob * rest, dy: sp.dy * u * wob * rest };
  }
  ctx.setTransform(...CAM);
  FX.giftBox(ctx, x, y, BOXS, rot, lid, spring);
});

ST.start(BIG);
