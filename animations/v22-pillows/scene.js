// Ролик 22: Подушки — Скелет против Жёлтой, 25 с, 24 кадра/с, звуковые эффекты без музыки,
// по стилю «animal hospital long» (docs/animal_hospital_long.md).
//
//   0–4 с     шарик-Жёлтая (слева) и шарик-Скелет (справа) смотрят друг на друга, на траве две подушки
//   4–5 с     Скелет сразу становится большим
//   5–8.5 с   поднимает подушку и лупит ею шарик-Жёлтую — перья, она кувырком отлетает
//   9.5–11.5 с Жёлтая становится большой — Скелет влюбился
//   12–16 с   берёт вторую подушку: бац — он кружится; бац — отлетает назад, перья кругом
//   16.5–19 с злой, замахивается — она ныряет, он промахивается и крутится сам
//   20–21 с   она обрушивает подушку ему на голову — подушка лопается, туча перьев; пинок — за кадр
//   21.5–25 с Жёлтая в центре, руки вверх, перья падают
'use strict';

const ST = Stage({
  name: 'v22-pillows',
  cast: {
    skel: { small: ['skeleton-verity-small-v1', { scale: 0.455 }], big: ['skeleton-verity-big', { height: 730 }], pivot: 325,
      voice: 0.9, lie: 60 },
    girl: { small: ['girl-verity-small', { bodyHeight: 300, recolor: 'yellow' }],
      big: ['verity-big-girl', { height: 730, splitFeet: true, recolor: 'yellow' }], pivot: 337, voice: 1.4, vAngle: 50,
      moods: { angry: 'sad', grin: 'theeth smile', big: 'smile normal' } },
  },
  order: ['skel', 'girl'],
  background: { sky: ['#4fa9f1', '#b7d5f4', '#f5e5d1'], seed: 262 },
  clouds: [[150, 80, 1.1, 2, 27], [580, 200, 0.8, 0, 22], [1000, 70, 1.0, 1, 30], [1420, 180, 1.2, 0, 24],
    [1800, 90, 0.9, 2, 19], [360, 300, 0.7, 1, 26]],
});
const { GROUND, C, key, move, ev, sfx, hop, tumble, laugh, tremble, transform, love, stance, walk, turn,
  strike, kick, dodge, duck, recoil, fallBack, getUp, flyOff, victory, chuckle, spinAround, hand, toRig,
  statesAt, stateAt, target } = ST;

// ------------------------------------------------------------------ подушки
// сегменты: {f0, ground: [x, y, rot]} — лежит; {f0, hand: кто} — в ближней руке (B); {f0, gone} — лопнула
// наклон в руке — ключи rot: [кадр, радианы, сглаживание]; 0 — подушка вверх от кулака
const PL = 190, PW = 124, GRIPD = 14, KL = 0.85, LIE = GROUND - PW * KL / 2 - 2;
const P1 = { segs: [], rot: [] }, P2 = { segs: [], rot: [] };
const rotAt = (keys, f) => {
  if (!keys.length) return 0;
  const ks = [...keys].sort((a, b) => a[0] - b[0]);
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
const pillowAt = (P, f, S) => {
  let cur = null;
  for (const c of P.segs) if (f >= c.f0) cur = c;
  if (!cur || cur.gone) return null;
  if (cur.ground) return { x: cur.ground[0], y: cur.ground[1], rot: cur.ground[2], k: KL };
  const h = C[cur.hand].big.point(S[cur.hand].st, 'handB'), r = rotAt(P.rot, f), d = dirOf(r);
  return { x: h[0] - GRIPD * d[0], y: h[1] - GRIPD * d[1], rot: r, k: Math.min(1, KL + (f - cur.f0) * 0.03), hand: cur.hand };
};
// кулак, при котором точка подушки на 0.7 длины попадёт в T
const gripFor = (T, r) => { const d = dirOf(r), s = PL * 0.7 - GRIPD; return [T[0] - s * d[0], T[1] - s * d[1]]; };
// поднять с травы: рука — в край подушки
function pick(who, P, f, x, face) {
  const g = P.segs[P.segs.length - 1].ground, d = dirOf(g[2]);
  key(who, f - 8, { lean: 30, hip: [0, toRig(who, 140)], head: 10 }, 8);
  key(who, f, { hitB: 1, hitBto: [g[0] + GRIPD * d[0], g[1] + GRIPD * d[1]], hitBfix: f }, 6);
  P.segs.push({ f0: f, hand: who });
  P.rot.push([f, g[2]]);
  sfx('pop', f, { who, gain: 0.4 });
  key(who, f + 12, { ...stance(who, x, face), hitB: 0, handB: hand(who, 'B', -0.2, -0.5) }, 10);
  P.rot.push([f + 12, -1.2 * face]);               // на плечо, назад
}
// удар подушкой: замах к f-5, в кадре f точка подушки в T; o.r — наклон при ударе
const FEATH = [], SMACKS = [];
function smack(who, P, f, T, face, o = {}) {
  const r = o.r ?? 1.1 * face;
  key(who, f - 6, { handB: hand(who, 'B', ...(o.back || [-0.55, -0.8])), lean: -8, hip: [0, toRig(who, 18)], hitB: 0 }, o.wind || 6);
  P.rot.push([f - 7, rotAt(P.rot, f - 7)], [f - 4, o.rb ?? -0.7 * face]);
  key(who, f, { handB: hand(who, 'B', 0.9, -0.1), hitB: 1, hitBto: gripFor(T, r), hitBfix: f, lean: o.lean ?? 14,
    hip: [toRig(who, 6), toRig(who, 30)], mouth: o.mouth || 'angry theeth' }, 4, 'in2');
  P.rot.push([f, r, 'in2'], [f + 4, r]);
  key(who, f + 4, { hitB: 1 }, 0);
  key(who, f + 9, { hitB: 0, handB: hand(who, 'B', 0.6, 0.2) }, 5);
  P.rot.push([f + 10, 0.6 * face]);
  if (o.x !== undefined) { key(who, f + 18, stance(who, o.x, face, { handB: hand(who, 'B', -0.2, -0.5) }), 8); P.rot.push([f + 18, -1.2 * face]); }
  sfx('swing', f - 5, { who, gain: 0.8 });
  SMACKS.push({ who, f, grip: gripFor(T, r) });
  if (o.miss) return;
  sfx('poof', f, { at: T, gain: 0.8 });
  sfx('slap', f, { at: T, gain: 0.5 });
  if (o.victim) sfx('hurt', f + 2, { who: o.victim, gain: 0.9 });
  ev('shake', { f, amp: o.hard ? 18 : 10, n: o.hard ? 12 : 8 });
  if (o.hard) ev('zoom', { f, n: 12, k: 0.06, at: T });
  FEATH.push({ f, at: T, n: o.n || 16, size: 1.5 * (o.size || 1) });
}

const GS = 560, SS = 1360;
// ================================================================== 0–4 с: стойка, подушки на траве
key('girl', 0, { form: 'small', x: GS, y: GROUND, face: 1, look: 1, eyes: 'angry', mouth: 'theeth smile', sx: 1, sy: 1, rot: 0 }, 0);
key('skel', 0, { form: 'small', x: SS, y: GROUND, face: -1, look: 1, eyes: 'angry', mouth: 'theeth smile', sx: 1, sy: 1, rot: 0 }, 0);
P1.segs.push({ f0: 0, ground: [300, LIE, -Math.PI / 2] });         // слева, тянется влево от края у x = 300
P2.segs.push({ f0: 0, ground: [1170, LIE, -Math.PI / 2] });        // посередине, край у руки справа

// ================================================================== 4–5 с: Скелет большой
const SX0 = 1400;
const SB = transform('skel', 96, SS, SX0, -1, { fast: true });
key('girl', SB, { mouth: 'puzzlement', eyes: 'sad' }, 0);
ev('sweat', { who: 'girl', f0: SB + 2, f1: SB + 30 });

const BIG = () => {
  key('skel', SB, stance('skel', SX0, -1), 0);
  key('skel', SB + 4, { mouth: 'happy with theeth', eyes: 'normal' }, 0);

  // ---- поднимает подушку и лупит шарик-Жёлтую
  const SX1 = 1290, SX2 = 790;
  walk('skel', 122, SX0, SX1, 1, 10, -1);
  pick('skel', P2, 146, SX1, -1);
  walk('skel', 162, SX1, SX2, 4, 9, -1, false);
  const S1 = 206, T1 = [GS + 15, GROUND - 255];
  key('girl', S1 - 14, { mouth: 'puzzlement', eyes: 'sad' }, 0);
  smack('skel', P2, S1, T1, -1, { r: -2.2, rb: 0.6, x: SX2, mouth: 'happy with theeth', victim: 'girl', n: 18 });
  key('girl', S1, { sx: 1.25, sy: 0.72 }, 1);
  const GX0 = 470;
  tumble('girl', S1 + 2, S1 + 22, GS, GX0, 150, -2, { stars: 30 });
  chuckle('skel', S1 + 8, S1 + 32, { mouth: 'happy with theeth' });

  // ---- Жёлтая большая — Скелет влюблён
  const GB = transform('girl', S1 + 38, GX0, GX0, 1, { love: 'skel', loveDur: 66 });
  key('girl', GB, stance('girl', GX0, 1), 0);
  key('girl', GB + 6, { mouth: 'theeth smile', eyes: 'angry' }, 0);
  key('skel', GB + 20, { handB: hand('skel', 'B', 0.3, 0.55) }, 10);             // подушка повисла
  P2.rot.push([GB + 20, -2.6]);

  // ---- берёт вторую подушку
  const GX1 = 430;
  turn('girl', GB + 8, -1, GX0);
  walk('girl', GB + 12, GX0, GX1, 1, 8, -1);
  pick('girl', P1, GB + 30, GX1, -1);
  turn('girl', GB + 44, 1, GX1);
  P1.rot.push([GB + 46, -1.2]);
  const GX2 = 485;                      // от Скелета (крылья!) на 305 — тела не перекрываются
  walk('girl', GB + 48, GX1, GX2, 1, 10, 1, false);
  // бац — кружится; бац — на спину
  const S2 = GB + 66;
  const headAt = (f) => target('skel:head', stateAt(f));
  smack('girl', P1, S2, headAt(S2), 1, { r: 1.2, lean: 26, hard: true, victim: 'skel', n: 20 });
  const sp = spinAround('skel', S2 + 1, SX2, -1, { n: 5, stars: 20 });
  P2.rot.push([S2 + 1, -2.6], [S2 + 10, -3.0], [sp, -2.6]);
  const S3 = sp + 6;
  key('skel', S3 - 6, { mouth: 'puzzlement', eyes: 'sad' }, 0);
  smack('girl', P1, S3, headAt(S3), 1, { r: 1.2, lean: 26, hard: true, victim: 'skel', n: 22, x: GX2 });
  // отлетает назад на ногах, злится, возвращается
  const SX3 = SX2 + 110;
  recoil('skel', S3 + 1, SX2, SX3, -1, {});
  P2.rot.push([S3 + 1, -2.6], [S3 + 12, -2.9], [S3 + 22, 1.2]);
  key('skel', S3 + 22, { handB: hand('skel', 'B', -0.2, -0.5) }, 8);
  key('girl', S3 + 10, { mouth: 'happy with theeth', eyes: 'normal' }, 0);
  chuckle('girl', S3 + 12, S3 + 30, { mouth: 'happy with theeth' });
  const stood = S3 + 22;
  ev('vein', { who: 'skel', f0: stood - 6, f1: stood + 14 });
  ev('steam', { who: 'skel', f0: stood - 4, f1: stood + 14 });
  sfx('anger', stood - 6, { who: 'skel', dur: 20, gain: 0.7 });
  walk('skel', stood + 2, SX3, SX2, 1, 10, -1, false);
  // замах — она ныряет, он крутится сам
  const S4 = stood + 24, GH = target('girl:head', stateAt(stood + 10));
  key('girl', S4 - 14, { mouth: 'puzzlement' }, 0);
  duck('girl', S4 - 6, S4 + 6, GX2, 1, 230);
  smack('skel', P2, S4, [GH[0] + 40, GH[1]], -1, { r: -1.6, rb: 0.7, miss: true });
  ev('whoosh', { f: S4 + 1, at: [GH[0], GH[1] - 30] });
  const sp2 = spinAround('skel', S4 + 3, SX2, -1, { n: 4, stars: 18 });
  P2.rot.push([S4 + 10, -2.4], [sp2, -2.6]);
  key('skel', sp2, { handB: hand('skel', 'B', 0.3, 0.55) }, 4);

  // ---- подушкой сверху по голове — лопается; пинок за кадр
  const S5 = sp2 + 12;
  key('girl', S5 - 16, { mouth: 'angry theeth', eyes: 'angry' }, 0);
  // прыжок вперёд — сверху подушкой по макушке
  move('girl', S5 - 8, { x: GX2, y: GROUND });
  move('girl', S5, { x: GX2 + 20, y: GROUND - 80 }, 'out2');
  move('girl', S5 + 8, { x: GX2 + 30, y: GROUND }, 'in2');
  key('girl', S5 - 7, { legFfk: 1, legBfk: 1, legF: [40, -70], legB: [10, -60] }, 3);
  key('girl', S5 + 7, { ...C.girl.big.feet(GX2 + 30, 1), legFfk: 1, legBfk: 1 }, 0);
  key('girl', S5 + 9, { legFfk: 0, legBfk: 0, hip: [0, toRig('girl', 40)] }, 2);
  sfx('jump', S5 - 7, { who: 'girl', gain: 0.6 });
  ev('dust', { f: S5 + 8, x: GX2 + 30, r: 40, n: 5, snd: 'land' });
  const hd = target('skel:head', stateAt(S5));                     // сбоку по макушке
  smack('girl', P1, S5, [hd[0] - 35, hd[1] - 35], 1, { r: 1.6, back: [0.05, -1], rb: -0.4, wind: 8, lean: 22, hard: true,
    victim: 'skel', n: 44, size: 1.25 });
  P1.segs.push({ f0: S5 + 2, gone: true });
  sfx('burst', S5 + 1, { who: 'girl', gain: 0.8 });
  key('girl', S5 + 14, { ...stance('girl', GX2 + 30, 1) }, 6);
  const GX3 = GX2 + 110;
  walk('girl', S5 + 16, GX2 + 30, GX3, 1, 8, 1);
  key('skel', S5, { sx: 1.08, sy: 0.82, mouth: 'puzzlement', eyes: 'sad' }, 2, 'out');
  key('skel', S5 + 6, { sx: 1, sy: 1 }, 5);
  ev('stars', { who: 'skel', f0: S5 + 4, f1: S5 + 22 });
  const KK = S5 + 32;
  kick('girl', KK, 'skel:body', { x: GX3, face: 1, hard: true });
  flyOff('skel', KK + 1, KK + 26, [SX2, GROUND], [2300, -320], { turns: 3 });
  key('girl', KK + 8, { mouth: 'happy with theeth', eyes: 'normal' }, 0);
  victory('girl', KK + 14, GX3, { n: 9, stride: 125 });
  window.SMACKS = SMACKS;
};

// лежащие подушки — позади всех, в руках — впереди (кулак поверх подушки)
ST.hooks.beforeChars.push((ctx, f, S, CAM) => {
  for (const P of [P1, P2]) {
    const p = pillowAt(P, f, S);
    if (p && !p.hand) { ctx.setTransform(...CAM); FX.pillow(ctx, p.x, p.y, p.rot, PL, PW, p.k); }
  }
});
ST.hooks.afterChars.push((ctx, f, S, CAM) => {
  for (const P of [P1, P2]) {
    const p = pillowAt(P, f, S);
    if (!p || !p.hand) continue;
    ctx.setTransform(...CAM);
    FX.pillow(ctx, p.x, p.y, p.rot, PL, PW, p.k);
    const { ch, st, p: pp } = S[p.hand];
    ch.draw(ctx, { ...st, p: { ...pp, only: 'B' } }, CAM);
  }
  ctx.setTransform(...CAM);
  for (const q of FEATH) FX.feathers(ctx, q.at[0], q.at[1], (f - q.f) / 24, q.f, q.n, q.size);
});

ST.start(BIG);
