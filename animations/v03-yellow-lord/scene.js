// Ролик 3: Жёлтая девочка против Лорда — драка 25 с, 24 кадра/с, звуковые эффекты без музыки,
// по стилю «animal hospital long» (docs/animal_hospital_long.md).
//
//   0–4 с     шарик-Лорд (слева) и шарик-Жёлтая (справа) неподвижно смотрят друг на друга
//   4–5 с     Жёлтая решает — и становится большой; шарик-Лорд влюбляется
//   5.5–9 с   влюблённый скачет к ней с сердечками — она щелчком отправляет его кувырком назад
//   10–12 с   Лорд злится и становится большим, Жёлтая ставит руки в боки
//   12.5–15 с Лорд бьёт — она ныряет, удар мимо; её пощёчина — Лорд отъезжает
//   15.5–18 с Лорд бросает шляпу — Жёлтая ловит её и надевает себе
//   18–21 с   Лорд без шляпы бежит отобрать — пинок, улетает за кадр, блеск
//   21–25 с   Жёлтая в шляпе Лорда в центре, лицом к зрителю, руки вверх
'use strict';

const ST = Stage({
  name: 'v03-yellow-lord',
  cast: {
    lord: { small: ['lord-verity-small', { bodyHeight: 300 }], big: ['lord-verity-big', { height: 730 }], pivot: 337,
      voice: 1.0 },
    girl: { small: ['girl-verity-small', { bodyHeight: 300, recolor: 'yellow' }],
      big: ['verity-big-girl', { height: 730, splitFeet: true, recolor: 'yellow' }], pivot: 337, voice: 1.4, vAngle: 50,
      moods: { angry: 'sad', grin: 'theeth smile', big: 'smile normal' } },
  },
  order: ['lord', 'girl'],
  background: { sky: ['#3a95ec', '#a6c8f2', '#f5e8c8'], seed: 63 },
  clouds: [[120, 80, 1.1, 2, 22], [560, 190, 0.9, 0, 28], [990, 110, 1.0, 1, 19], [1390, 60, 1.2, 0, 25],
    [1760, 210, 0.8, 2, 31], [800, 300, 0.7, 1, 24]],
});
const { GROUND, C, key, move, ev, sfx, hop, tumble, laugh, tremble, transform, love, stance, walk, turn,
  strike, kick, dodge, duck, recoil, flyOff, victory, hand, toRig, statesAt, stateAt } = ST;

// ================================================================== 0–4 с: стойка
key('lord', 0, { form: 'small', x: 560, y: GROUND, face: 1, look: 1, eyes: 'angry', mouth: 'theeth smile', sx: 1, sy: 1, rot: 0 }, 0);
key('girl', 0, { form: 'small', x: 1360, y: GROUND, face: -1, look: 1, eyes: 'angry', mouth: 'smile normal', sx: 1, sy: 1, rot: 0 }, 0);

// ================================================================== 4–5 с: Жёлтая сразу большая, Лорд влюбился
const GX = 1400;
const GB = transform('girl', 96, 1360, GX, -1, { fast: true, love: 'lord', loveDur: 104 });
key('lord', GB, { mouth: 'puzzlement', eyes: 'normal' }, 0);

// ================================================================== 5.5–9 с: скачет к ней — щелчок
hop('lord', 136, 148, 560, 760, 90);
hop('lord', 154, 166, 760, 940, 90);
hop('lord', 172, 184, 940, 1050, 70);
for (let f = 188; f < 204; f += 4) key('lord', f, { rot: (f / 4) % 2 ? -6 : 6 }, 2);
key('lord', 204, { rot: 0 }, 2);
const FL = 212;                               // щелчок
tumble('lord', FL + 1, FL + 36, 1050, 470, 380, -3, { stars: 30, hurt: true });
key('lord', FL + 1, { eyes: 'sad', mouth: 'puzzlement' }, 0);

// ================================================================== 10–12 с: Лорд большой
const LX = 520;
const LB = transform('lord', 252, 470, LX, 1);

const BIG = () => {
  const G = C.girl.big;
  key('girl', GB, stance('girl', GX, -1), 0);
  key('girl', GB + 8, { mouth: 'mini smile', eyes: 'normal' }, 0);
  // наклоняется к влюблённому шарику и щёлкает его по лбу
  key('girl', FL - 10, { hip: [0, toRig('girl', 110)], lean: 30, head: 14, mouth: 'theeth smile',
    handF: hand('girl', 'F', 0.2, 0.3) }, 8);
  key('girl', FL - 3, { handF: hand('girl', 'F', 0.1, 0.5), zF: 'front' }, 3);
  key('girl', FL, { handF: hand('girl', 'F', 0.9, 0.4), hitF: 1, hitFto: 'lord:face', hitFfix: FL }, 2, 'in2');
  key('girl', FL + 4, { hitF: 0 }, 3);
  key('girl', FL + 14, { ...stance('girl', GX, -1), zF: null, mouth: 'happy with theeth' }, 10);
  ev('spark', { f: FL, at: 'lord:face', r: 50, snd: 'flick', hurt: false, swing: false });
  ev('shake', { f: FL, amp: 8, n: 6 });
  for (let f = FL + 26; f < FL + 44; f += 6) key('girl', f, { head: (f / 6) % 2 ? 6 : -4 }, 3);
  key('girl', FL + 46, { head: 0 }, 3);

  // ---- Лорд большой; Жёлтая усмехается
  key('lord', LB, stance('lord', LX, 1), 0);
  key('lord', LB + 6, { mouth: 'angry theeth' }, 0);
  key('girl', LB + 4, { mouth: 'theeth smile', eyes: 'angry', head: -4 }, 4);

  // ---- удар Лорда — она ныряет, «вжух» над головой
  const L1 = 960, P1 = 352;
  walk('lord', LB + 10, LX, L1, 4, 8, 1);
  key('lord', P1 - 4, { handF: hand('lord', 'F', -0.7, 0.2), lean: -8, hip: [0, 50] }, 6);
  key('lord', P1, { handF: hand('lord', 'F', 1, -0.05), lean: 16, hip: [10, 70], mouth: 'angry theeth' }, 4, 'in2');
  sfx('swing', P1 - 5, { who: 'lord' });
  ev('whoosh', { f: P1 + 1, at: [GX - 90, 300] });
  key('lord', P1 + 4, { mouth: 'puzzlement' }, 0);
  key('lord', P1 + 14, stance('lord', L1, 1, { mouth: 'puzzlement' }), 8);
  duck('girl', P1 - 2, P1 + 6, GX, -1, 240);

  // ---- её пощёчина — Лорд отъезжает назад
  const S1 = 378, L2 = 790;
  key('girl', S1 - 8, { eyes: 'angry', mouth: 'angry theeth' }, 0);
  strike('girl', S1, 'lord:cheek', { x: GX, face: -1, snd: 'slap', back: [-0.5, -0.3], to: [1, -0.25] });
  recoil('lord', S1 + 1, L1, L2, 1, { ret: 18 });

  // ---- Лорд снимает шляпу и бросает — Жёлтая ловит и надевает
  HAT.take = 404; HAT.release = 416; HAT.catch = 428; HAT.put = 446;
  key('lord', HAT.take - 6, { handF: [122, -483], mouth: 'angry theeth' }, 6);
  key('lord', HAT.release - 4, { handF: [-271, -592], lean: -6 }, 6);                 // замах шляпой над головой
  key('lord', HAT.release, { handF: [489, -266], lean: 12 }, 4, 'in2');
  sfx('swing', HAT.release - 4, { who: 'lord' });
  sfx('whoosh', HAT.release, { who: 'lord', dur: HAT.catch - HAT.release, gain: 0.6 });
  key('lord', HAT.release + 10, stance('lord', L2, 1, { mouth: 'theeth smile' }), 8);
  // ловит над головой ближней к нему рукой и надевает
  key('girl', HAT.catch - 4, { handF: hand('girl', 'F', 0.55, -0.85), zF: 'front', mouth: 'puzzlement', lean: 0 }, 5);
  key('girl', HAT.catch + 2, { handF: hand('girl', 'F', 0.5, -0.9) }, 2);
  sfx('pop', HAT.catch, { who: 'girl', gain: 0.8 });
  key('girl', HAT.put, { handF: hand('girl', 'F', -0.05, -1), mouth: 'theeth smile' }, 10);
  key('girl', HAT.put + 10, { ...stance('girl', GX, -1), zF: null, mouth: 'happy with theeth' }, 8);
  sfx('pop', HAT.put, { who: 'girl', gain: 0.6 });
  // Лорд: шок, пот — злость
  key('lord', HAT.catch + 2, { mouth: 'puzzlement', head: -6 }, 3);
  ev('sweat', { who: 'lord', f0: HAT.catch + 4, f1: HAT.catch + 30 });
  sfx('scared', HAT.catch + 4, { who: 'lord', gain: 0.7 });
  key('lord', HAT.put + 6, { head: 0, mouth: 'angry theeth', eyes: 'angry' }, 3);
  ev('vein', { who: 'lord', f0: HAT.put + 4, f1: HAT.put + 22 });
  sfx('anger', HAT.put + 4, { who: 'lord', dur: 18, gain: 0.7 });

  // ---- Лорд бежит отобрать — пинок, улетает за кадр
  const L3 = 1060, KK = 488;
  walk('lord', 470, L2, L3, 2, 7, 1, false);
  key('lord', 472, { lean: 10, handF: hand('lord', 'F', 0.9, -0.1), handB: hand('lord', 'B', 0.6, 0.1) }, 4);
  kick('girl', KK, 'lord:body', { x: GX, face: -1, hard: true });
  flyOff('lord', KK + 1, KK + 30, [L3, GROUND], [-260, -280], { turns: 3 });

  key('girl', KK + 12, { mouth: 'happy with theeth', eyes: 'normal' }, 0);

  // ---- победа Жёлтой в шляпе Лорда
  victory('girl', 504, GX);
};

const HAT = {};
const lerpM = (A, B, u) => A.map((v, i) => v + (B[i] - v) * u);
// шляпа Лорда: на голове -> в руке -> летит, кувыркаясь, -> в руке у Жёлтой -> на её голове
function hatMatrix(f) {
  const L = C.lord.big, G = C.girl.big, hat = L.layers.find((l) => l.name === 'hat');
  const hc = [(hat.bbox[0] + hat.bbox[2]) / 2, (hat.bbox[1] + hat.bbox[3]) / 2];
  const hb = [hc[0], hat.bbox[3] - 30];                                  // низ тульи
  const onLord = (g) => L.layerMatrix(statesAt(g).lord.st, 'hat');
  const lordHand = (g) => {
    const hand0 = L.point(statesAt(HAT.take).lord.st, 'handF'), M0 = onLord(HAT.take), c0 = E.apply(M0, hc);
    const hand = L.point(statesAt(g).lord.st, 'handF');
    const k = E.EASE.io(E.clamp((g - HAT.take) / 6, 0, 1));
    const off = [E.lerp(c0[0] - hand0[0], -20, k), E.lerp(c0[1] - hand0[1], -35, k)];
    return E.mul(E.T(hand[0] + off[0] - c0[0], hand[1] + off[1] - c0[1]), M0);
  };
  if (f < HAT.release) return f <= HAT.take ? onLord(f) : lordHand(f);
  const M1 = lordHand(HAT.release), c1 = E.apply(M1, hc);
  const girlHand = (g) => G.point(statesAt(g).girl.st, 'handF');
  const catchP = girlHand(HAT.catch);
  const spin = (a, c) => E.mul(E.T(c[0], c[1]), E.mul(E.R(a), E.mul(E.T(-c1[0], -c1[1]), M1)));
  if (f <= HAT.catch) {
    const u = (f - HAT.release) / (HAT.catch - HAT.release);
    return spin(-2 * Math.PI * 2 * u, [E.lerp(c1[0], catchP[0], u), E.lerp(c1[1], catchP[1] - 40, u) - Math.sin(Math.PI * u) * 120]);
  }
  const Mc = spin(-4 * Math.PI, [catchP[0], catchP[1] - 40]);
  const inHand = (g) => { const h = girlHand(g); return E.mul(E.T(h[0] - catchP[0], h[1] - catchP[1]), Mc); };
  // на голове: зеркально (она смотрит влево), низ тульи — на макушке, дальше едет с головой
  const Hput = G.layerMatrix(statesAt(HAT.put).girl.st, 'head');
  const top = G.point(statesAt(HAT.put).girl.st, 'top');
  const M0 = onLord(HAT.take), b0 = E.apply(M0, hb);
  const Mput = E.mul(E.T(top[0], top[1] + 40), E.mul(E.S(-1, 1), E.mul(E.T(-b0[0], -b0[1]), M0)));
  const onGirl = (g) => E.mul(G.layerMatrix(statesAt(g).girl.st, 'head'), E.mul(E.inv(Hput), Mput));
  if (f < HAT.put - 6) return inHand(f);
  if (f < HAT.put) return lerpM(inHand(f), onGirl(f), E.EASE.io((f - HAT.put + 6) / 6));
  return onGirl(f);
}
ST.hooks.drawPose = (who, p, f) =>
  (who === 'lord' && p.form === 'big' && HAT.take && f >= HAT.take ? { ...p, hide: [...(p.hide || []), 'hat'] } : p);
ST.hooks.afterChars.push((ctx, f, S, CAM) => {
  if (!HAT.take || f < HAT.take) return;
  if (f >= 600) return;
  const hat = C.lord.big.layers.find((l) => l.name === 'hat');
  ctx.setTransform(...E.mul(CAM, hatMatrix(f)));
  ctx.drawImage(hat.img.canvas, hat.img.x, hat.img.y, hat.img.w, hat.img.h);
});

ST.start(BIG);
