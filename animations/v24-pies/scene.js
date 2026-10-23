// Ролик 24: Торты — Розовая против Жёлтой (зрители — Лорд и Малыш), 25 с, 24 кадра/с, звуковые эффекты
// без музыки, по стилю «animal hospital long» (docs/animal_hospital_long.md).
//
//   0–4 с     шарик-Розовая (слева) и шарик-Жёлтая (справа) смотрят друг на друга; справа стол с двумя
//             тортами, по краям смотрят шарики Лорд и Малыш
//   4–5 с     Жёлтая сразу становится большой — Малыш влюбился
//   5–8 с     берёт торт и кидает — шарику-Розовой в лицо, крем, кувырок
//   9.5–11.5 с Розовая становится большой — Лорд влюбился
//   12–14.5 с Жёлтая кидает второй торт — Розовая ловит, пробует крем пальцем
//   14.5–15.5 с бросает обратно — Жёлтая приседает, торт летит Малышу в лицо, он ревёт
//   16–19 с   Жёлтая злая бежит с пощёчиной — Розовая ныряет, Жёлтая крутится; пинок — за кадр
//   19–25 с   Розовая в центре, руки вверх; рядом влюблённый Лорд, Малыш в креме плачет
'use strict';

const ST = Stage({
  name: 'v24-pies',
  cast: {
    lord: { small: ['lord-verity-small', { bodyHeight: 260 }], pivot: 337, voice: 1.0 },
    baby: { small: ['child-verity-pink', { bodyHeight: 260, spin: { layer: 'hat', cut: 122, axis: 389 } }], pivot: 338, voice: 1.25,
      moods: { love: ' 4' } },
    yel: { small: ['girl-verity-small', { bodyHeight: 300, recolor: 'yellow' }],
      big: ['verity-big-girl', { height: 730, splitFeet: true, recolor: 'yellow' }], pivot: 337, voice: 1.45, vAngle: 50,
      moods: { angry: 'sad', grin: 'theeth smile', big: 'smile normal' } },
    pink: { small: ['girl-verity-small', { bodyHeight: 300 }], big: ['girl-verity-big', { height: 730, splitFeet: true }],
      pivot: 337, voice: 1.35, vAngle: 50, moods: { angry: 'sad', grin: 'theeth smile', big: 'smile normal' } },
  },
  order: ['lord', 'baby', 'yel', 'pink'],
  background: { sky: ['#50a7f1', '#b9d6f5', '#f6e4cf'], seed: 284 },
  clouds: [[160, 100, 1.0, 1, 26], [600, 60, 1.2, 0, 21], [1040, 200, 0.8, 2, 30], [1460, 80, 1.1, 1, 24],
    [1820, 190, 0.9, 0, 28], [380, 300, 0.7, 2, 19]],
});
const { FPS, NF, GROUND, C, key, move, ev, sfx, hop, tumble, laugh, tremble, transform, love, stance, walk, turn,
  strike, kick, dodge, duck, recoil, fallBack, getUp, flyOff, victory, chuckle, spinAround, hand, toRig,
  statesAt, stateAt, target } = ST;

// ------------------------------------------------------------------ стол, торты, крем
const TBX = 1500, TBW = 340, TBH = 190, TOP = GROUND - TBH, PS = 165;
// сегменты торта: {f0, at: [x, y]} — стоит; {f0, hand: кто} — на ладони (рука B); {f0, f1, a, b, arc} — летит
// (rot — наклон: в полёте кремом к цели); {f0, hold: точка} — в руках; {f0, gone} — размазан по лицу
const PIES = { A: [{ f0: 0, at: [1415, TOP] }], B: [{ f0: 0, at: [1585, TOP] }] };
const P = (v, f, S) => (typeof v === 'function' ? v(f, S) : v);
const pieAt = (segs, f, S) => {
  let cur = null;
  for (const c of segs) if (f >= c.f0) cur = c;
  if (cur.gone) return null;
  if (cur.at) return { x: cur.at[0], y: cur.at[1], rot: 0 };
  if (cur.hold) { const u = E.clamp((f - cur.f0) / 8, 0, 1); return { x: cur.hold[0], y: cur.hold[1], rot: E.lerp(cur.r0 || 0, 0, u) }; }
  if (cur.hand) {
    const h = C[cur.hand].big.point(S[cur.hand].st, 'handB');
    return { x: h[0], y: h[1] - 6, rot: 0, hand: cur.hand };
  }
  const u = E.clamp((f - cur.f0) / (cur.f1 - cur.f0), 0, 1);
  const a = P(cur.a, cur.f0, statesAt(cur.f0)), b = P(cur.b, f, S);
  return { x: E.lerp(a[0], b[0], u), y: E.lerp(a[1], b[1], u) - Math.sin(Math.PI * u) * (cur.arc || 0),
    rot: E.lerp(0, cur.rot || 0, Math.min(1, u * 3)) };
};
const SPLAT = [];        // {who, f0, f1, s, seed} — крем на лице
function splat(who, f, f1, s, seed) {
  SPLAT.push({ who, f0: f, f1, s, seed });
  sfx('splash', f, { who, gain: 0.9 });
  sfx('hurt', f + 3, { who, gain: 0.8 });
  ev('shake', { f, amp: 12, n: 10 });
}
// бросок с ладони: замах, бросок в кадре f, торт летит n кадров в точку b
function throwPie(who, segs, f, n, b, face, o = {}) {
  key(who, f - 8, { handB: hand(who, 'B', -0.6, -0.7), lean: -8, hitB: 0, hitF: 0 }, 6);
  key(who, f, { handB: hand(who, 'B', 0.9, -0.45), lean: 12, mouth: o.mouth || 'happy with theeth' }, 4, 'in2');
  key(who, f + 14, { ...stance(who, o.x, face), mouth: o.after || 'theeth smile' }, 10);
  const a = C[who].big.point(stateAt(f)[who].st, 'handB');
  segs.push({ f0: f, f1: f + n, a: [a[0], a[1] - 6], b, arc: o.arc || 60, rot: face * Math.PI / 2 });
  sfx('swing', f - 4, { who, gain: 0.8 });
  sfx('whoosh', f + 2, { who, dur: n - 2, gain: 0.5 });
}

const PS0 = 560, YS0 = 1200, LS = 150, BS = 1765;
// ================================================================== 0–4 с: стойка
key('pink', 0, { form: 'small', x: PS0, y: GROUND, face: 1, look: 1, eyes: 'angry', mouth: 'theeth smile', sx: 1, sy: 1, rot: 0 }, 0);
key('yel', 0, { form: 'small', x: YS0, y: GROUND, face: -1, look: 1, eyes: 'angry', mouth: 'theeth smile', sx: 1, sy: 1, rot: 0 }, 0);
key('lord', 0, { form: 'small', x: LS, y: GROUND, face: 1, look: 1, eyes: 'normal', mouth: 'smile normal', sx: 1, sy: 1, rot: 0 }, 0);
key('baby', 0, { form: 'small', x: BS, y: GROUND, face: -1, look: 1, eyes: 'normal', mouth: ' 6', sx: 1, sy: 1, rot: 0 }, 0);

// ================================================================== 4–5 с: Жёлтая большая — Малыш влюбился
const YX0 = 1240;
const YB = transform('yel', 96, YS0, YX0, -1, { fast: true, love: 'baby', loveDur: 60 });
key('pink', YB, { mouth: 'puzzlement', eyes: 'sad' }, 0);
ev('sweat', { who: 'pink', f0: YB + 2, f1: YB + 28 });

const BIG = () => {
  key('yel', YB, stance('yel', YX0, -1), 0);
  key('yel', YB + 4, { mouth: 'happy with theeth', eyes: 'normal' }, 0);

  // ---- берёт торт и кидает шарику-Розовой в лицо
  const YX1 = 1300;
  turn('yel', YB + 4, 1, YX0);
  walk('yel', YB + 8, YX0, YX1, 1, 10, 1);
  const PICK1 = YB + 28;
  key('yel', PICK1 - 8, { lean: 22, hip: [0, toRig('yel', 90)], head: 8 }, 8);
  key('yel', PICK1, { hitB: 1, hitBto: [1415, TOP - 14], hitBfix: PICK1 }, 6);
  PIES.A.push({ f0: PICK1, hand: 'yel' });
  sfx('pop', PICK1, { who: 'yel', gain: 0.5 });
  key('yel', PICK1 + 12, { ...stance('yel', YX1, 1), hitB: 0, handB: hand('yel', 'B', 0.45, -0.55) }, 10);
  turn('yel', PICK1 + 16, -1, YX1);
  key('yel', PICK1 + 20, { handB: hand('yel', 'B', 0.45, -0.55), mouth: 'happy with theeth' }, 4);
  const TH1 = PICK1 + 36, HIT1 = TH1 + 14;
  const pface = (f, S) => target('pink:face', S);
  key('pink', TH1 - 10, { mouth: 'puzzlement', eyes: 'normal' }, 0);
  throwPie('yel', PIES.A, TH1, 14, pface, -1, { x: YX1, after: 'happy with theeth' });
  PIES.A.push({ f0: HIT1, gone: true });
  splat('pink', HIT1, HIT1 + 46, 210, 7);
  key('pink', HIT1, { sx: 1.25, sy: 0.75 }, 1);
  const PX0 = 440;
  tumble('pink', HIT1 + 1, HIT1 + 21, PS0, PX0, 120, -1, { stars: 18 });
  chuckle('yel', HIT1 + 4, HIT1 + 32, { mouth: 'happy with theeth' });

  // ---- Розовая большая — Лорд влюбился
  const PX = 480;
  const PB = transform('pink', HIT1 + 36, PX0, PX, 1, { love: 'lord', loveDur: 70 });
  sfx('drip', HIT1 + 40, { who: 'pink', gain: 0.6 });
  key('pink', PB, stance('pink', PX, 1), 0);
  key('pink', PB + 6, { mouth: 'theeth smile', eyes: 'angry' }, 0);
  key('yel', PB - 2, { mouth: 'puzzlement', eyes: 'sad' }, 0);

  // ---- второй торт: Розовая ловит и пробует крем
  const YX2 = 1420;
  turn('yel', PB + 4, 1, YX1);
  walk('yel', PB + 8, YX1, YX2, 1, 10, 1);
  const PICK2 = PB + 26;
  key('yel', PICK2 - 8, { lean: 22, hip: [0, toRig('yel', 90)], head: 8, mouth: 'angry theeth', eyes: 'angry' }, 8);
  key('yel', PICK2, { hitB: 1, hitBto: [1585, TOP - 14], hitBfix: PICK2 }, 6);
  PIES.B.push({ f0: PICK2, hand: 'yel' });
  sfx('pop', PICK2, { who: 'yel', gain: 0.5 });
  key('yel', PICK2 + 12, { ...stance('yel', YX2, 1), hitB: 0, handB: hand('yel', 'B', 0.45, -0.55) }, 10);
  turn('yel', PICK2 + 16, -1, YX2);
  const TH2 = PICK2 + 30, CATCH = TH2 + 16;
  const CP = [PX + 150, GROUND - 450];
  throwPie('yel', PIES.B, TH2, 16, [CP[0], CP[1] + 20], -1, { x: YX2, mouth: 'angry theeth', after: 'angry theeth' });
  key('pink', TH2 + 4, { mouth: 'puzzlement' }, 0);
  key('pink', CATCH, { hitF: 1, hitFto: [CP[0] - 70, CP[1] + 8], hitFfix: CATCH, hitB: 1, hitBto: [CP[0] + 66, CP[1] + 4], hitBfix: CATCH,
    lean: -6 }, 5);
  PIES.B.push({ f0: CATCH, hold: [CP[0], CP[1] + 20], r0: -Math.PI / 2 });
  sfx('pop', CATCH, { who: 'pink', gain: 0.7 });
  key('pink', CATCH + 6, { mouth: 'happy with theeth', eyes: 'normal', lean: 0 }, 4);
  // палец в крем — облизывает
  const LK = CATCH + 16;
  key('pink', LK - 6, { hitF: 1, hitFto: [CP[0] - 10, CP[1] - 20], hitFfix: LK - 6 }, 5);
  key('pink', LK, { hitF: 1, hitFto: target('pink:lips', stateAt(LK)), hitFfix: LK, mouth: 'happy - spittle' }, 5);
  key('pink', LK + 8, { hitF: 0, handF: stance('pink', PX, 1).handF, mouth: 'theeth smile' }, 6);
  sfx('lick', LK, { who: 'pink', gain: 0.8 });
  key('yel', LK, { mouth: 'puzzlement', eyes: 'sad' }, 0);
  // ---- бросок обратно — Жёлтая приседает, торт летит Малышу в лицо
  const TH3 = LK + 18, HIT3 = TH3 + 22;
  PIES.B.push({ f0: TH3 - 8, hand: 'pink' });
  key('pink', TH3 - 9, { hitB: 0, hitF: 0 }, 2);
  const bface = (f, S) => target('baby:face', S);
  throwPie('pink', PIES.B, TH3, 22, bface, 1, { x: PX, arc: 340, mouth: 'angry theeth', after: 'puzzlement' });
  PIES.B.push({ f0: HIT3, gone: true });
  duck('yel', TH3 + 2, TH3 + 18, YX2, -1, 240);
  splat('baby', HIT3, NF, 190, 11);
  key('baby', HIT3, { sx: 1.25, sy: 0.75, eyes: 'sad', mouth: ' 2' }, 1);
  tumble('baby', HIT3 + 1, HIT3 + 19, BS, BS + 15, 80, 1, {});
  ev('tears', { who: 'baby', f0: HIT3 + 28, f1: NF, s: 1.3 });
  key('pink', HIT3 + 2, { mouth: 'happy with theeth' }, 0);
  chuckle('pink', HIT3 + 4, HIT3 + 22, { mouth: 'happy with theeth' });

  // ---- Жёлтая злая бежит с пощёчиной — Розовая ныряет, Жёлтая крутится; пинок
  const MAD = HIT3 + 10, YX3 = 770;
  key('yel', MAD, { mouth: 'angry theeth', eyes: 'angry' }, 0);
  ev('vein', { who: 'yel', f0: MAD, f1: MAD + 22 });
  ev('steam', { who: 'yel', f0: MAD + 2, f1: MAD + 22 });
  sfx('anger', MAD, { who: 'yel', dur: 22, gain: 0.8 });
  const RUN = MAD + 18;
  walk('yel', RUN, YX2, YX3, 4, 6, -1, false);
  key('yel', RUN, { lean: 12, handF: hand('yel', 'F', 0.5, -0.4), handB: hand('yel', 'B', -0.4, -0.3) }, 4);
  const SL = RUN + 30, GH = target('pink:head', stateAt(SL - 12));
  key('yel', SL - 6, { handF: hand('yel', 'F', -0.6, -0.3), lean: -8 }, 5);
  key('yel', SL, { handF: hand('yel', 'F', 1, -0.6), lean: 14 }, 4, 'in2');
  sfx('swing', SL - 5, { who: 'yel' });
  ev('whoosh', { f: SL + 1, at: [GH[0] + 40, GH[1]] });
  key('pink', SL - 14, { mouth: 'puzzlement' }, 0);
  duck('pink', SL - 6, SL + 6, PX, 1, 240);
  const sp = spinAround('yel', SL + 2, YX3, -1, { n: 4, stars: 18 });
  const KK = sp + 6;
  key('pink', KK - 10, { mouth: 'angry theeth', eyes: 'angry' }, 0);
  kick('pink', KK, 'yel:body', { x: PX, face: 1, hard: true });
  flyOff('yel', KK + 1, KK + 26, [YX3, GROUND], [2300, -320], { turns: 3 });

  // ---- победа; Лорд подскакивает к ней влюблённый
  key('pink', KK + 8, { mouth: 'happy with theeth', eyes: 'normal' }, 0);
  victory('pink', KK + 14, PX, { n: 9, stride: 125 });
  hop('lord', KK + 32, KK + 44, LS, 400, 70);
  hop('lord', KK + 48, KK + 60, 400, 640, 70);
  love('lord', KK + 62, NF);
  laugh('lord', KK + 66, NF - 4);
};

ST.hooks.beforeChars.push((ctx, f, S, CAM) => {
  ctx.setTransform(...CAM);
  FX.table(ctx, TBX, GROUND, TBW, TBH);
});
ST.hooks.afterChars.push((ctx, f, S, CAM) => {
  ctx.setTransform(...CAM);
  for (const s of SPLAT) {
    if (f < s.f0 || f > s.f1) continue;
    const h = target(`${s.who}:head`, S), fc = target(`${s.who}:face`, S), k = Math.min(1, (f - s.f0 + 1) / 3, (s.f1 - f) / 8);
    const p = [E.lerp(h[0], fc[0], 0.35), E.lerp(h[1], fc[1], 0.6)];
    ctx.globalAlpha = Math.max(0, Math.min(1, (s.f1 - f) / 8));
    FX.gumSplat(ctx, p[0], p[1] - 10, s.s * Math.min(1, k + 0.3), s.seed, '#fffdf5', '#bfa98a');
    ctx.globalAlpha = 1;
  }
  for (const segs of [PIES.A, PIES.B]) {
    const p = pieAt(segs, f, S);
    if (!p) continue;
    ctx.setTransform(...CAM);
    FX.pie(ctx, p.x, p.y, PS, p.rot);
    if (p.hand) { const { ch, st, p: pp } = S[p.hand]; ch.draw(ctx, { ...st, p: { ...pp, only: 'B' } }, CAM); }
  }
});

ST.start(BIG);
