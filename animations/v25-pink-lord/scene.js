// Ролик 25: Розовая против Лорда, 25 с, 24 кадра/с. По присланному образцу: стойка ~2 с (без «3 2 1» и
// интерфейса) — и сразу драка; превращение «рост» под ту же музыку, что в образце; Лорд превращается
// «щелчком», дышит и чуть поёт (записи из образца — sounds/ref). Фон — «майнкрафт», тема «вишня».
//
//   0–1.8 с   шарик-Лорд (слева) и шарик-Розовая (справа) смотрят друг на друга
//   1.8–4 с   Розовая дважды прыгает Лорду на голову — «ой!», он смеётся
//   4–5 с     жуткая ухмылка, из шарика вырастают руки-лапы — Розовая встаёт большой под музыку,
//             Лорд влюблён
//   6–8.5 с   влюблённый Лорд скачет к ней — пинок, кувырком, злится
//   9–13 с    Лорд «щелчком» становится большим: держит шляпу, откинулся, дышит — и поёт ей, тянет руку,
//             воздушный поцелуй — сердце лопается у неё перед лицом
//   13.5–20 с идёт обниматься — пощёчина, кружится; бьёт — она ныряет; пинает — она отпрыгивает;
//             её пинок — отлетает назад; удар — улетает за кадр
//   21–25 с   Розовая в центре, руки вверх
'use strict';

const ST = Stage({
  name: 'v25-pink-lord',
  cast: {
    lord: { small: ['lord-verity-small', { bodyHeight: 300 }], big: ['lord-verity-big', { height: 730 }], pivot: 337,
      voice: 1.0, color: '#ffe23a', ouch: ['ref:hit-ow', 1.0, 0.9] },
    pink: { small: ['girl-verity-small', { bodyHeight: 300 }], big: ['girl-verity-big', { height: 730, splitFeet: true }],
      pivot: 337, voice: 1.35, vAngle: 50, color: '#ff4fc8',
      moods: { angry: 'angry theeth', grin: 'theeth smile', big: 'theeth smile' } },
  },
  transformMusic: 'transform-music',     // как было при рендере (музыка из первого образца)
  order: ['lord', 'pink'],
  background: { theme: 'cherry', seed: 5, sunX: 1460, sunY: 170 },
  clouds: [[120, 70, 2.6, 0, 14], [700, 150, 2.0, 1, 18], [1180, 40, 2.8, 0, 12], [1640, 230, 1.8, 2, 20], [380, 300, 1.5, 1, 16]],
});
const { FPS, NF, GROUND, C, key, move, ev, sfx, hop, tumble, laugh, tremble, transform, love, blowKiss, stance, walk, turn,
  strike, kick, dodge, duck, recoil, fallBack, getUp, flyOff, victory, chuckle, spinAround, hand, toRig,
  statesAt, stateAt, target } = ST;

// поля шляпы спереди — сюда ладонь
ST.parts.brim = (ch, st, p) => {
  const l = ch.layers.find((x) => x.name === 'hat');
  const M = ch.layerMatrix(st, 'hat');
  const c = E.apply(M, [(l.bbox[0] + l.bbox[2]) / 2, l.bbox[1] * 0.35 + l.bbox[3] * 0.65]);
  return [c[0] + (p.face || 1) * (l.bbox[2] - l.bbox[0]) * ch.scale * 0.34, c[1]];
};

// прыжок шарика-Розовой сверху на голову Лорда: подготовка, «фьють», удар, отскок назад
function jumpOn(f, from, back) {
  const top = target('lord:top', stateAt(f + 9));
  key('pink', f - 4, { sx: 1.22, sy: 0.8 }, 4);
  move('pink', f, { x: from, y: GROUND });
  key('pink', f + 2, { sx: 0.84, sy: 1.18 }, 2);
  move('pink', f + 5, { x: E.lerp(from, top[0], 0.55), y: top[1] - 260 }, 'out2');
  move('pink', f + 9, { x: top[0] + 40, y: top[1] + 18 }, 'in2');
  key('pink', f + 7, { sx: 1, sy: 1 }, 3);
  key('pink', f + 9, { sx: 1.25, sy: 0.75 }, 1);
  move('pink', f + 15, { x: E.lerp(top[0], back, 0.5), y: top[1] - 140 }, 'out2');
  move('pink', f + 23, { x: back, y: GROUND }, 'in2');
  key('pink', f + 13, { sx: 1, sy: 1 }, 3);
  key('pink', f + 23, { sx: 1.2, sy: 0.82 }, 1);
  key('pink', f + 27, { sx: 1, sy: 1 }, 4);
  sfx('ref:fwip', f + 1, { who: 'pink', gain: 0.8 });
  sfx('land', f + 23, { who: 'pink', gain: 0.5 });
  // Лорд сплющился
  key('lord', f + 9, { sx: 1, sy: 1 }, 0);
  key('lord', f + 11, { sx: 1.3, sy: 0.7, mouth: 'puzzlement', eyes: 'sad' }, 2, 'out');
  key('lord', f + 17, { sx: 0.94, sy: 1.06 }, 5);
  key('lord', f + 21, { sx: 1, sy: 1 }, 4);
  ev('shake', { f: f + 9, amp: 12, n: 10 });
  ev('dust', { f: f + 10, x: 560, r: 40, n: 5, snd: false });
  return f + 9;
}
// замах мимо (соперник нырнул): кисть проходит над ним, свист, без удара
function swingMiss(who, f, pt, face, x) {
  key(who, f - 4, { handF: hand(who, 'F', -0.75, 0.25), lean: -8, hip: [0, toRig(who, 18)] }, 6);
  key(who, f, { handF: hand(who, 'F', 0.95, -0.15), hitF: 1, hitFto: pt, hitFfix: f, lean: 22, mouth: 'angry theeth' }, 4, 'in2');
  key(who, f + 6, { hitF: 0, lean: 28, head: 8 }, 5);                          // по инерции подался вперёд
  key(who, f + 18, stance(who, x, face, { mouth: 'puzzlement' }), 10);
  sfx('swing', f - 5, { who, gain: 0.9 });
  ev('whoosh', { f: f + 1, at: pt });
}

const LS = 560, PS = 1360;
// ================================================================== 0–1.8 с: стойка
key('lord', 0, { form: 'small', x: LS, y: GROUND, face: 1, look: 1, eyes: 'normal', mouth: 'smile normal', sx: 1, sy: 1, rot: 0 }, 0);
key('pink', 0, { form: 'small', x: PS, y: GROUND, face: -1, look: 1, eyes: 'normal', mouth: 'smile normal', sx: 1, sy: 1, rot: 0 }, 0);
key('pink', 36, { eyes: 'angry', mouth: 'angry theeth' }, 0);
key('lord', 38, { mouth: 'theeth smile' }, 0);

// ================================================================== 4–5 с: Розовая «растёт» под музыку
const PX = 1300;
const PB = transform('pink', 92, PS, PX, -1, { style: 'grow', love: 'lord', loveDur: 62 });
key('lord', 112, { mouth: 'puzzlement', eyes: 'sad', sx: 1, sy: 1 }, 0);
ev('sweat', { who: 'lord', f0: 112, f1: PB + 4 });
tremble('lord', 112, PB, LS, 2);

// ================================================================== 6–8.5 с: влюблённый скачет к ней — пинок
hop('lord', PB + 22, PB + 34, LS, 640, 60);
hop('lord', PB + 38, PB + 50, 640, 720, 50);
const LT = 300;                          // куда отлетел шарик-Лорд

const BIG = () => {
  const P = C.pink.big, L = C.lord.big;
  // ---- 1.8–4 с: прыжки на голову (нужны размеры ригов — поэтому здесь)
  sfx('ref:grunt', 40, { who: 'pink', gain: 0.9, pitch: 1.25 });
  const H1 = jumpOn(46, PS, 1240);
  const H2 = jumpOn(72, 1240, PS);
  ev('spark', { f: H2, at: 'lord:top', r: 60, snd: 'ref:impact', swing: false, hurt: false });
  ev('stars', { who: 'lord', f0: H2 + 4, f1: H2 + 30, snd: false });
  sfx('ref:hit-ow', H1, { who: 'lord', gain: 0.95 });
  // Лорд смеётся
  key('lord', H2 + 8, { mouth: 'happy with theeth', eyes: 'normal' }, 0);
  sfx('ref:grin-eee', H2 + 8, { who: 'lord', gain: 0.6 });
  sfx('ref:laugh', H2 + 14, { who: 'lord', gain: 0.9 });
  laugh('lord', H2 + 14, H2 + 32);

  key('pink', PB, stance('pink', PX, -1), 0);
  key('pink', PB + 10, { mouth: 'theeth smile', eyes: 'angry' }, 0);
  key('pink', PB + 14, { handF: hand('pink', 'F', 0.1, 0.55), handB: hand('pink', 'B', -0.15, 0.5) }, 6);    // руки в боки
  // ---- подходит и пинает
  const PX1 = 1030;
  walk('pink', PB + 30, PX, PX1, 3, 10, -1);
  const K1 = PB + 66;
  key('lord', K1 - 10, { mouth: 'happy - spittle' }, 0);
  kick('pink', K1, 'lord:body', { x: PX1, face: -1, hard: true, snd: 'ref:impact' });
  tumble('lord', K1 + 1, K1 + 25, 720, LT, 240, -2, { stars: 22 });
  key('lord', K1 + 1, { mouth: 'puzzlement', eyes: 'sad' }, 0);
  key('pink', K1 + 12, { mouth: 'happy with theeth', eyes: 'normal' }, 0);
  chuckle('pink', K1 + 14, K1 + 34, { mouth: 'happy with theeth' });
  // ---- злится — «щелчок»: большой, держит шляпу, откинулся и дышит
  const MAD = K1 + 48;
  key('lord', MAD, { mouth: 'angry theeth', eyes: 'angry' }, 0);
  ev('vein', { who: 'lord', f0: MAD, f1: MAD + 12 });
  tremble('lord', MAD + 2, MAD + 12, LT, 3);
  const LX = 420, LB = transform('lord', MAD + 16, LT, LX, 1, { style: 'snap' });
  const pose = (o = {}) => ({ ...stance('lord', LX, 1), lean: -9, head: -7, hitF: 1, hitFto: 'lord:brim',
    handB: hand('lord', 'B', -0.15, 0.4), mouth: 'happy with theeth', eyes: 'normal', ...o });
  key('lord', LB, pose(), 0);
  key('pink', LB + 2, { mouth: 'puzzlement' }, 0);
  const BR = LB + 6;                                       // вдохи в записи: 0, .6, 1.17, 1.75, 2.32 с
  sfx('ref:lord-breath', BR, { who: 'lord', gain: 1.0 });
  for (const t of [0.02, 0.6, 1.17, 1.75, 2.32]) {
    const f = BR + Math.round(t * FPS);
    key('lord', f + 3, { lean: -15, head: -13, hip: [0, toRig('lord', 4)] }, 3);
    key('lord', f + 11, { lean: -8, head: -6, hip: [0, toRig('lord', 14)] }, 8);
  }
  // ---- поёт ей: рука к ней, нотки; воздушный поцелуй — сердце лопается
  const SING = BR + 62;
  key('lord', SING - 4, { hitF: 0, handF: hand('lord', 'F', 0.95, -0.3), lean: 6, head: -4, mouth: 'happy open mouth' }, 6);
  sfx('ref:lord-sing', SING, { who: 'lord', gain: 1.0 });
  window.NOTES = [SING, SING + 22];
  key('lord', SING + 8, { head: 4 }, 6);
  key('lord', SING + 16, { head: -4 }, 6);
  blowKiss('lord', SING + 22, 'pink:face', { n: 14 });
  key('lord', SING + 18, { handF: hand('lord', 'F', 0.3, -0.75), mouth: 'happy - spittle' }, 4);
  key('lord', SING + 26, { handF: hand('lord', 'F', 0.95, -0.2) }, 4);
  key('pink', SING + 30, { mouth: 'angry theeth', eyes: 'angry', head: -6 }, 2);
  key('pink', SING + 38, { head: 0, handF: stance('pink', PX1, -1).handF, handB: stance('pink', PX1, -1).handB }, 6);

  // ---- идёт обниматься — пощёчина, кружится
  const LX1 = 650, W1 = SING + 40;
  walk('lord', W1, LX, LX1, 3, 9, 1, false);
  key('lord', W1, { ...stance('lord', LX, 1), handF: hand('lord', 'F', 0.85, -0.45), handB: hand('lord', 'B', 0.75, -0.5),
    mouth: 'happy - spittle', lean: 6 }, 6);
  love('lord', W1, W1 + 30, { snd: false });
  const SL = W1 + 34;
  strike('pink', SL, 'lord:cheek', { snd: 'slap', back: [-0.5, -0.3], to: [1, -0.3], x: PX1, face: -1, lean: 14 });
  const sp = spinAround('lord', SL + 1, LX1, 1, { n: 5, stars: 20 });
  // ---- бьёт — она ныряет, он мимо
  const PU = sp + 22, GH = target('pink:head', stateAt(PU - 14));
  key('lord', sp + 4, { mouth: 'angry theeth', eyes: 'angry' }, 0);
  key('pink', PU - 14, { mouth: 'puzzlement' }, 0);
  duck('pink', PU - 6, PU + 6, PX1, -1, 240);
  swingMiss('lord', PU, [GH[0] + 30, GH[1] - 10], 1, LX1);
  // ---- пинает — она отпрыгивает
  const KM = PU + 30, PX2 = 1120;
  key('lord', KM - 4, { legFfk: 1, legF: [62, -100], lean: -10, kickF: 0, mouth: 'angry theeth' }, 6);
  key('lord', KM, { kickF: 1, kickFto: [PX1 - 120, GROUND - 330], kickFfix: KM, lean: -16 }, 4, 'in2');
  key('lord', KM + 8, { kickF: 0 }, 6);
  key('lord', KM + 16, stance('lord', LX1, 1, { mouth: 'puzzlement' }), 8);
  sfx('swing', KM - 5, { who: 'lord', gain: 0.9 });
  ev('whoosh', { f: KM + 1, at: [PX1 - 140, GROUND - 330] });
  dodge('pink', KM - 6, PX1, PX2, -1, { h: 50 });
  // ---- её пинок — он отлетает назад
  const PX3 = 1010, K2 = KM + 34;
  walk('pink', KM + 18, PX2, PX3, 1, 9, -1);
  key('pink', K2 - 12, { mouth: 'angry theeth', eyes: 'angry' }, 0);
  kick('pink', K2, 'lord:body', { x: PX3, face: -1, hard: true, snd: 'ref:impact' });
  const LX2 = 560;
  recoil('lord', K2 + 1, LX1, LX2, 1, {});
  // ---- удар — за кадр
  const PX4 = 880, PF = K2 + 44;
  walk('pink', K2 + 18, PX3, PX4, 2, 9, -1);
  strike('pink', PF, 'lord:face', { snd: 'ref:impact', x: PX4, face: -1, hard: true, lean: 18 });
  flyOff('lord', PF + 1, PF + 26, [LX2, GROUND], [-420, -300], { turns: 3 });
  key('pink', PF + 10, { mouth: 'happy with theeth', eyes: 'normal' }, 0);
  victory('pink', PF + 16, PX4, { n: 9, stride: 120 });
};

// нотки над головой, пока поёт
ST.hooks.afterChars.push((ctx, f, S, CAM) => {
  if (!window.NOTES) return;
  const [n0, n1] = window.NOTES;
  if (f < n0 || f > n1 + 10) return;
  ctx.setTransform(...CAM);
  const m = target('lord:lips', S);
  for (let i = 0; i < 4; i++) {
    const u = (f - n0 - i * 6) / 22;
    if (u < 0 || u > 1) continue;
    FX.note(ctx, m[0] + 40 + u * 170 + Math.sin(u * 9 + i) * 14, m[1] - 40 - u * 160, 1.3, Math.min(1, (1 - u) * 3), i % 2 === 1,
      ['#e8207a', '#7b3cff', '#ff7a00', '#1a9be6'][i]);
  }
});

ST.start(BIG);
