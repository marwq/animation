// Ролик 18: Корона — Розовая против Жёлтой (и Лорд), 25 с, 24 кадра/с, звуковые эффекты без музыки,
// по стилю «animal hospital long» (docs/animal_hospital_long.md).
//
//   0–4 с     шарик-Розовая (слева) и шарик-Жёлтая (справа) смотрят друг на друга
//   4–5 с     с неба падает корона; Жёлтая сразу становится большой
//   5.5–7.5 с Жёлтая поднимает корону и надевает
//   8–10 с    шарик-Розовая с разгона бьёт её головой по голени — корона слетает и падает
//             Розовой на голову, Жёлтая скачет на одной ноге
//   10–13 с   Жёлтая топает — мимо; Розовая становится большой, прискакавший шарик-Лорд влюблён
//   13.5–16 с пощёчина Жёлтой — Розовая ныряет; ответная пощёчина — Жёлтая кружится и падает
//   16.5–19 с Лорд подпрыгивает и срывает корону — пинок, Лорд улетает за кадр, корона
//             по дуге возвращается Розовой на голову
//   19.5–25 с Розовая в короне в центре, руки вверх
'use strict';

const ST = Stage({
  name: 'v18-crown',
  cast: {
    pink: { small: ['girl-verity-small', { bodyHeight: 300 }], big: ['girl-verity-big', { height: 730, splitFeet: true }],
      pivot: 337, voice: 1.35, vAngle: 50, moods: { angry: 'sad', grin: 'theeth smile', big: 'smile normal' } },
    yel: { small: ['girl-verity-small', { bodyHeight: 300, recolor: 'yellow' }],
      big: ['verity-big-girl', { height: 730, splitFeet: true, recolor: 'yellow' }], pivot: 337, voice: 1.45, vAngle: 50,
      lie: 60, moods: { angry: 'sad', grin: 'theeth smile', big: 'smile normal' } },
    lord: { small: ['lord-verity-small', { bodyHeight: 300 }], pivot: 337, voice: 1.0 },
  },
  order: ['yel', 'pink', 'lord'],
  background: { sky: ['#4ca6f2', '#b0d0f5', '#f7e1d2'], seed: 229 },
  clouds: [[110, 120, 1.0, 2, 24], [500, 60, 1.1, 1, 29], [900, 200, 0.8, 0, 20], [1320, 90, 1.2, 2, 26],
    [1720, 210, 0.9, 1, 31], [1050, 300, 0.7, 0, 22]],
});
const { GROUND, C, key, move, ev, sfx, hop, tumble, laugh, tremble, transform, love, stance, walk, turn,
  strike, kick, dodge, duck, recoil, fallBack, getUp, flyOff, victory, chuckle, spinAround, stomp, hand, toRig,
  statesAt, stateAt, target } = ST;

ST.parts.shin = (ch, st) => {
  const L = ch.leg.F, b = ch.bones;
  const k = E.apply(st.G, E.apply(st.W[L[0]], b[L[1]].base)), a = E.apply(st.G, E.apply(st.W[L[1]], b[L[2]].base));
  return [E.lerp(k[0], a[0], 0.55), E.lerp(k[1], a[1], 0.55)];
};

// ------------------------------------------------------------------ корона
// сегменты: {f0, f1, a, b, arc, spin} — летит; {f0, on: кто} — на голове; {f0, hand: кто} — в руке
const CR = [];
const CW = 110;
const onHead = (who, S) => { const t = target(`${who}:top`, S); return [t[0], t[1] + (S[who].p.form === 'big' ? 34 : 30)]; };
const crownAt = (f, S) => {
  let cur = null;
  for (const c of CR) if (f >= c.f0) cur = c;
  if (!cur) return null;
  if (cur.on) { const p = onHead(cur.on, S); return { x: p[0], y: p[1], rot: E.rad(S[cur.on].p.rot || 0) }; }
  if (cur.hand) { const h = C[cur.hand].big.point(S[cur.hand].st, 'handF'); return { x: h[0], y: h[1] + 10, rot: 0 }; }
  const u = cur.f1 > cur.f0 ? E.clamp((f - cur.f0) / (cur.f1 - cur.f0), 0, 1) : 1;
  const a = typeof cur.a === 'function' ? cur.a() : cur.a, b = typeof cur.b === 'function' ? cur.b(f, S) : cur.b;
  return { x: E.lerp(a[0], b[0], u), y: E.lerp(a[1], b[1], E.EASE[cur.ease || 'lin'](u)) - (cur.arc ? Math.sin(Math.PI * u) * cur.arc : 0),
    rot: (cur.spin || 0) * u };
};

const CX = 945;            // корона упала здесь
// ================================================================== 0–4 с: стойка
key('pink', 0, { form: 'small', x: 560, y: GROUND, face: 1, look: 1, eyes: 'angry', mouth: 'smile normal', sx: 1, sy: 1, rot: 0 }, 0);
key('yel', 0, { form: 'small', x: 1360, y: GROUND, face: -1, look: 1, eyes: 'angry', mouth: 'theeth smile', sx: 1, sy: 1, rot: 0 }, 0);
key('lord', 0, { form: 'small', x: -220, y: GROUND, face: 1, look: 1, eyes: 'normal', mouth: 'smile normal', sx: 1, sy: 1, rot: 0 }, 0);

// ================================================================== 4–5 с: корона с неба; Жёлтая большая
CR.push({ f0: 96, f1: 110, a: [CX, -120], b: [CX, GROUND], ease: 'in2', spin: Math.PI * 2 });
CR.push({ f0: 110, f1: 110, a: [CX, GROUND], b: [CX, GROUND] });
sfx('whoosh', 96, { x: CX, dur: 14, gain: 0.4 });
sfx('land', 110, { x: CX, gain: 0.5 });
ev('twinkle', { f: 112, at: [CX, GROUND - 60], n: 18, size: 50 });
key('pink', 112, { mouth: 'puzzlement' }, 0);
key('yel', 112, { mouth: 'puzzlement' }, 0);
const YX = 1260;
const YB = transform('yel', 116, 1360, YX, -1, { fast: true });
// шарик-Розовая скачет к короне, но поздно
hop('pink', 120, 132, 560, 680, 60);
key('pink', 136, { mouth: 'sad', eyes: 'angry' }, 0);

// ================================================================== 8–10 с: удар головой по голени
const DASH = 196, HB = 202;

const BIG = () => {
  const Y = C.yel.big, P = C.pink.big;
  key('yel', YB, stance('yel', YX, -1), 0);
  key('yel', YB + 4, { mouth: 'theeth smile', eyes: 'normal' }, 0);
  // ---- подходит, поднимает корону, надевает
  const Y1 = 1095;
  walk('yel', YB + 6, YX, Y1, 2, 9, -1);
  const PICK = YB + 34;
  key('yel', PICK - 8, { lean: 30, hip: [0, toRig('yel', 130)], head: 10 }, 8);
  key('yel', PICK, { hitF: 1, hitFto: [CX, GROUND - 40], hitFfix: PICK }, 4);
  CR.push({ f0: PICK, hand: 'yel' });
  sfx('sparkle', PICK, { who: 'yel' });
  key('yel', PICK + 10, { ...stance('yel', Y1, -1), hitF: 0, handF: hand('yel', 'F', 0.35, -0.85), zF: 'front' }, 10);
  const PUT = PICK + 22;
  key('yel', PUT, { handF: hand('yel', 'F', 0.05, -1) }, 8);
  CR.push({ f0: PUT, on: 'yel' });
  sfx('pop', PUT, { who: 'yel', gain: 0.6 });
  key('yel', PUT + 8, { ...stance('yel', Y1, -1), zF: null, mouth: 'happy with theeth' }, 6);
  chuckle('yel', PUT + 6, DASH - 2, { mouth: 'happy with theeth' });
  // ---- шарик-Розовая разгоняется и бьёт головой по голени
  const shin = ST.target('yel:shin', stateAt(HB));
  const PX0 = 680, PXH = shin[0] - 150;
  key('pink', DASH - 10, { sx: 1.24, sy: 0.78, eyes: 'angry', mouth: 'angry theeth' }, 6);
  tremble('pink', DASH - 10, DASH, PX0, 3);
  key('pink', DASH + 2, { sx: 0.8, sy: 1.18 }, 2);
  move('pink', DASH, { x: PX0, y: GROUND });
  move('pink', HB, { x: PXH }, 'in2');
  key('pink', HB, { sx: 0.76, sy: 1.2 }, 1);
  ev('spark', { f: HB, at: 'yel:shin', r: 60, snd: 'bonk', swing: false });
  ev('shake', { f: HB, amp: 12, n: 10 });
  move('pink', HB + 8, { x: PXH - 120, y: GROUND - 50 }, 'out2');
  move('pink', HB + 14, { x: PXH - 160, y: GROUND }, 'in2');
  key('pink', HB + 6, { sx: 1, sy: 1 }, 4);
  // корона слетает и падает Розовой на голову
  const LANDC = HB + 26;
  const c0 = onHead('yel', stateAt(HB));
  CR.push({ f0: HB, f1: LANDC, a: c0, b: (f, S) => onHead('pink', S), arc: 260, spin: -Math.PI * 4 });
  sfx('whoosh', HB, { x: c0[0], dur: LANDC - HB, gain: 0.5 });
  CR.push({ f0: LANDC, on: 'pink' });
  sfx('pop', LANDC, { who: 'pink' });
  key('pink', LANDC, { sx: 1.15, sy: 0.88 }, 1);
  key('pink', LANDC + 4, { sx: 1, sy: 1, mouth: 'theeth smile', eyes: 'normal' }, 4);
  laugh('pink', LANDC + 6, LANDC + 30);
  // Жёлтая скачет на одной ноге
  key('yel', HB + 1, { legFfk: 1, legF: [40, -100, 0], mouth: 'puzzlement', eyes: 'sad', lean: 14, head: 6,
    handF: hand('yel', 'F', 0.55, 0.75), handB: hand('yel', 'B', 0.75, 0.7), zB: 'front' }, 3, 'out');
  const HOPS = 3, HX = 45;
  for (let i = 0; i < HOPS; i++) {
    const f = HB + 4 + i * 8, x = Y1 + HX * (i + 1);
    move('yel', f, { y: GROUND });
    move('yel', f + 4, { y: GROUND - 45, x: Y1 + HX * (i + 0.5) }, 'out2');
    move('yel', f + 8, { y: GROUND, x }, 'in2');
    sfx('hurt', f + 1, { who: 'yel', gain: 0.55, pitch: 1.3 + i * 0.07 });
    ev('dust', { f: f + 8, x, r: 18, n: 2, snd: 'land' });
  }
  const Y2 = Y1 + HX * HOPS;
  key('yel', HB + 4 + HOPS * 8 + 6, { ...stance('yel', Y2, -1), zB: null, mouth: 'angry theeth', eyes: 'angry' }, 6);
  ev('vein', { who: 'yel', f0: HB + 34, f1: HB + 52 });
  ev('steam', { who: 'yel', f0: HB + 36, f1: HB + 52 });
  sfx('anger', HB + 34, { who: 'yel', dur: 18, gain: 0.7 });
  // ---- топает — шарик отпрыгивает
  const PS = PXH - 160;
  const ST1 = 262;
  stomp('yel', ST1, Y2, PS + 250, -1);
  hop('pink', ST1 + 4, ST1 + 16, PS, PS - 110, 90);
  const P2 = PS - 110;
  key('pink', ST1 + 20, { mouth: 'theeth smile' }, 0);
  // ---- Розовая становится большой; шарик-Лорд прискакал и влюбился
  const PB = transform('pink', ST1 + 26, P2, P2, 1, { love: 'lord', loveDur: 130 });
  hop('lord', 296, 308, -220, -20, 60);
  hop('lord', 312, 324, -20, 150, 60);
  key('pink', PB, stance('pink', P2, 1), 0);
  key('pink', PB + 8, { mouth: 'theeth smile', eyes: 'angry' }, 0);
  key('yel', PB, { mouth: 'puzzlement', eyes: 'sad' }, 0);
  ev('sweat', { who: 'yel', f0: PB + 2, f1: PB + 22 });
  // ---- пощёчина Жёлтой — нырок; ответная — кружится; пинок — улетает за кадр
  const Y3 = P2 + 290;
  walk('yel', PB + 14, PS + 250, Y3, 2, 9, -1);
  const SL1 = PB + 40;
  key('yel', SL1 - 10, { mouth: 'angry theeth', eyes: 'angry' }, 0);
  key('yel', SL1 - 4, { handF: hand('yel', 'F', -0.6, -0.3), lean: -8 }, 6);
  key('yel', SL1, { handF: hand('yel', 'F', 1, -0.6), lean: 12 }, 4, 'in2');
  sfx('swing', SL1 - 5, { who: 'yel' });
  ev('whoosh', { f: SL1 + 1, at: [P2 + 40, 200] });
  key('yel', SL1 + 4, { mouth: 'puzzlement' }, 0);
  key('yel', SL1 + 12, stance('yel', Y3, -1, { mouth: 'puzzlement' }), 6);
  duck('pink', SL1 - 3, SL1 + 4, P2, 1, 240);
  const SL2 = SL1 + 18;
  strike('pink', SL2, 'yel:cheek', { snd: 'slap', back: [-0.5, -0.3], to: [1, -0.3], x: P2, face: 1, lean: 14 });
  const g = spinAround('yel', SL2 + 1, Y3, -1, { n: 6, stars: 30 });
  const P3 = P2 + 90, K1 = g + 14;
  walk('pink', g, P2, P3, 1, 9, 1);
  kick('pink', K1, 'yel:body', { x: P3, face: 1, hard: true });
  flyOff('yel', K1 + 1, K1 + 28, [Y3, GROUND], [2260, -260], { turns: 3 });
  // ---- Лорд подпрыгивает и срывает корону
  const SN = K1 + 22, LAND_L = SN + 14, LX = 330;
  const cc = onHead('pink', stateAt(SN));
  key('lord', SN - 10, { sx: 1.24, sy: 0.78 }, 6);
  move('lord', SN - 6, { x: 150, y: GROUND });
  key('lord', SN - 4, { sx: 0.84, sy: 1.18 }, 2);
  move('lord', SN, { x: cc[0] - 60, y: cc[1] + 300 }, 'out2');
  key('lord', SN, { sx: 1, sy: 1, mouth: 'happy with theeth' }, 3);
  move('lord', LAND_L, { x: LX, y: GROUND }, 'in2');
  key('lord', LAND_L, { sx: 1.22, sy: 0.8 }, 1);
  key('lord', LAND_L + 6, { sx: 1, sy: 1 }, 5);
  sfx('jump', SN - 4, { who: 'lord', gain: 0.6 });
  CR.push({ f0: SN, on: 'lord' });
  sfx('pop', SN, { who: 'lord' });
  ev('dust', { f: LAND_L, x: LX, r: 30, n: 4, snd: 'land' });
  laugh('lord', LAND_L + 4, LAND_L + 22);
  key('pink', SN + 2, { mouth: 'puzzlement', head: -4 }, 3);
  turn('pink', SN + 8, -1, P3);
  key('pink', SN + 12, { mouth: 'angry theeth', eyes: 'angry', head: 0 }, 3);
  // ---- пинок по Лорду — корона по дуге возвращается
  const P4 = LX + 265, KK = LAND_L + 24;
  walk('pink', SN + 14, P3, P4, 2, 8, -1);
  kick('pink', KK, 'lord:body', { x: P4, face: -1, hard: true });
  tumble('lord', KK + 1, KK + 28, LX, -320, 380, -3, {});
  key('lord', KK + 1, { eyes: 'sad', mouth: 'puzzlement' }, 0);
  const cl = onHead('lord', stateAt(KK));
  CR.push({ f0: KK, f1: KK + 22, a: cl, b: (f, S) => onHead('pink', S), arc: 240, spin: Math.PI * 4 });
  sfx('whoosh', KK, { x: LX, dur: 22, gain: 0.5 });
  CR.push({ f0: KK + 22, on: 'pink' });
  sfx('pop', KK + 22, { who: 'pink' });
  key('pink', KK + 22, { head: 4, mouth: 'happy with theeth', eyes: 'normal' }, 2);
  key('pink', KK + 26, { head: 0 }, 3);
  ev('twinkle', { f: KK + 26, at: [130, 140], n: 22, size: 56 });
  victory('pink', KK + 28, P4, { face: 1, n: 8, stride: 120 });
};

ST.hooks.afterChars.push((ctx, f, S, CAM) => {
  const c = crownAt(f, S);
  if (!c) return;
  ctx.setTransform(...CAM);
  FX.crown(ctx, c.x, c.y, CW, c.rot);
});

ST.start(BIG);
