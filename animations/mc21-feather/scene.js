// Ролик 21 (серия по образцу): Перо-щекотка — Жёлтая против Скелета, 25 с, 24 кадра/с. Плотно, как у HugyTi:
// перья из крыльев Скелета щекочут до слёз, перьевой вихрь, «пуф» от смеха, чих-ураган.
// Музыка превращения — присланная, ~4 с с затиханием, только при первом превращении. Фон — берёзовая роща.
//
//   0–1.8 с   шарик-Скелет (слева), шарик-Жёлтая (справа) спит — пузырь из носа
//   1.8–4 с   Скелет подкрадывается, выдёргивает перо из крыла и щекочет её — пузырь лопается, она хохочет
//             и катается, укатывается
//   4–5.2 с   Жёлтая «растёт» под музыку — Скелет влюблён
//   5.3–8.6 с выдёргивает перо у него из крыла — ой! — и щекочет: Скелет хохочет до слёз, катается
//   8.6–9.8 с Скелет «растёт»
//   10–13 с   машет крыльями — перьевой вихрь кружит вокруг неё, щекочет: она падает на спину и хохочет —
//             от смеха «пуф», она снова шарик
//   13–14.3 с Жёлтая «растёт» снова — Скелет опять влюблён
//   14.5–19 с поднимает перо и щекочет ему нос: а… а… АПЧХИ! — чих уносит её за кадр в облаке перьев
//   19–25 с   Скелет в центре, руки и крылья вверх
'use strict';

const ST = Stage({
  name: 'mc21-feather',
  cast: {
    skel: { small: ['skeleton-verity-small', { scale: 0.455 }], big: ['skeleton-verity-big', { height: 730 }], pivot: 325,
      voice: 0.9, lie: 60, color: '#f3f1e6', moods: { angry: 'angry theeth', grin: 'happy with theeth', big: 'theeth smile', love: 'happy - spittle' } },
    yel: { small: ['girl-verity-small', { bodyHeight: 300, recolor: 'yellow' }],
      big: ['verity-big-girl', { height: 730, splitFeet: true, recolor: 'yellow' }], pivot: 337, voice: 1.45, vAngle: 50, lie: 55,
      color: '#ffe23a', moods: { angry: 'angry theeth', grin: 'theeth smile', big: 'theeth smile' } },
  },
  order: ['skel', 'yel'],
  background: { theme: 'birch', seed: 211, sunX: 1500, sunY: 140 },
  clouds: [[120, 80, 2.4, 0, 12], [660, 210, 1.8, 1, 16], [1150, 60, 2.6, 2, 10], [1700, 250, 1.6, 0, 18]],
});
const { FPS, NF, GROUND, C, key, move, ev, sfx, hop, tumble, laugh, tremble, transform, shrink, love, stance, walk, turn,
  fallBack, getUp, flyOff, victory, chuckle, hand, toRig, statesAt, stateAt, target } = ST;

ST.parts.mouth = (ch, st, p) => {
  const name = ch.layers.some((l) => l.name === p.mouth) ? p.mouth : 'smile normal', l = ch.layers.find((x) => x.name === name);
  return E.apply(ch.eyeMatrix(st, name), [(l.bbox[0] + l.bbox[2]) / 2, (l.bbox[1] + l.bbox[3]) / 2]);
};
ST.parts.nose = (ch, st, p) => { const m = ST.parts.mouth(ch, st, p), f = ch.point(st, 'face'); return [(m[0] + f[0]) / 2, (m[1] + f[1]) / 2 - 10]; };
const P = (v, f, S) => (typeof v === 'function' ? v(f, S) : typeof v === 'string' ? target(v, S) : v);
function flap(f0, f1, gain = 0.6) {
  for (let f = f0; f < f1; f += 6) {
    key('skel', f, { b_B16: -30, b_B17: 30 }, 3);
    key('skel', f + 3, { b_B16: 46, b_B17: -46 }, 3, 'in');
  }
  key('skel', f1, { b_B16: 0, b_B17: 0 }, 4);
  sfx('gust', f0, { who: 'skel', dur: f1 - f0, gain });
}
// перекатывается от смеха (шарик): качается с боку на бок, подпрыгивает, хохочет
function rollLaugh(who, f0, f1, x, o = {}) {
  key(who, f0, { pivot: ST.CAST[who].pivot, mouth: o.mouth || 'happy with theeth', eyes: 'normal' }, 0);
  for (let f = f0, i = 0; f < f1; f += 5, i++) {
    key(who, f + 3, { rot: i % 2 ? -28 : 28 }, 3);
    if (i % 2 === 0) { move(who, f, { x, y: GROUND }); move(who, f + 3, { y: GROUND - 40 }, 'out2'); move(who, f + 5, { y: GROUND }, 'in2'); }
  }
  key(who, f1 + 3, { rot: 0 }, 3);
  for (let f = f0; f < f1 - 8; f += 16) sfx('ref:laugh', f, { who, gain: 0.8, pitch: o.pitch || 1.4 });
}

// ------------------------------------------------------------------ перья
const FEATHERS = [];                               // {segs, s, col} — {f0, at, rot} | {f0, mouth: who} | {f0, hand: who, arm} | {f0, f1, a, b, arc, r0, r1} | {f0, tickle, to}
const STORM = [];                                  // вихрь: {f0, f1, who, n}
const BUB = { who: 'yel', f0: 0, f1: 0 };          // пузырь из носа
const COLS = ['#ff7ab8', '#7ac8ff', '#ffe14d', '#9be563', '#c89bff'];
function featherAt(F, f, S) {
  let cur = null;
  for (const c of F.segs) if (f >= c.f0) cur = c;
  if (!cur || cur.gone) return null;
  if (cur.at) return { x: cur.at[0], y: cur.at[1], rot: cur.rot || 0 };
  if (cur.mouth) { const m = target(`${cur.mouth}:mouth`, S), fc = S[cur.mouth].p.face || 1; return { x: m[0] + fc * 60, y: m[1], rot: fc > 0 ? 0 : Math.PI }; }
  if (cur.hand) { const h = C[cur.hand].big.point(S[cur.hand].st, 'hand' + (cur.arm || 'F')), fc = S[cur.hand].p.face || 1; return { x: h[0] + fc * 50, y: h[1] - 10, rot: fc > 0 ? -0.3 : Math.PI + 0.3 }; }
  if (cur.tickle) {                                 // кончиком у цели, виляет
    const base = featherAt({ segs: [cur.base] }, f, S), t = target(cur.to, S), w = Math.sin(f * 1.6);
    return { x: t[0] + Math.cos(base.rot) * -40, y: t[1] + w * 22, rot: base.rot + w * 0.35 };
  }
  const u = E.clamp((f - cur.f0) / (cur.f1 - cur.f0), 0, 1), a = P(cur.a, cur.f0, statesAt(cur.f0)), b = P(cur.b, f, S);
  return { x: E.lerp(a[0], b[0], u), y: E.lerp(a[1], b[1], u) - Math.sin(Math.PI * u) * (cur.arc || 0), rot: E.lerp(cur.r0 || 0, cur.r1 || 0, u) };
}

const SS = 480, YS = 1400;
// ================================================================== 0–1.8 с: стойка (она спит)
key('skel', 0, { form: 'small', x: SS, y: GROUND, face: 1, look: 1, eyes: 'normal', mouth: 'smile normal', sx: 1, sy: 1, rot: 0, pivot: 0, alpha: 1 }, 0);
key('yel', 0, { form: 'small', x: YS, y: GROUND, face: -1, look: 0, eyes: 'sad', mouth: 'smile normal', sx: 1, sy: 1, rot: 0, pivot: 0, alpha: 1 }, 0);

const BIG = () => {
  for (let f = 0; f < 66; f += 24) { key('yel', f + 12, { sx: 1.04, sy: 0.97 }, 12); key('yel', f + 24, { sx: 1, sy: 1 }, 12); }
  sfx('buzz', 4, { who: 'yel', dur: 50, gain: 0.25 });
  BUB.f0 = 0;

  // ---- 1.8–4 с: подкрадывается, выдёргивает перо из крыла — щекочет; пузырь лопается, она хохочет
  key('skel', 36, { mouth: 'happy with theeth', eyes: 'angry' }, 0);
  sfx('ref:grin-eee', 36, { who: 'skel', gain: 0.45, pitch: 1.15 });
  const S1 = 1000;
  for (const [f0, x0, x1] of [[36, SS, 780], [44, 780, S1]]) {
    move('skel', f0, { x: x0, y: GROUND }); move('skel', f0 + 4, { y: GROUND - 40 }, 'out2'); move('skel', f0 + 8, { x: x1, y: GROUND }, 'in2');
    sfx('step', f0 + 8, { who: 'skel', gain: 0.3 });
  }
  const PL = 54;
  key('skel', PL - 2, { sx: 0.9, sy: 1.1, rot: -12, pivot: 150 }, 2);
  key('skel', PL + 3, { sx: 1, sy: 1, rot: 0 }, 3);
  sfx('pop', PL, { who: 'skel', gain: 0.6 });
  sfx('ref:grunt', PL + 1, { who: 'skel', gain: 0.4, pitch: 1.5 });
  const F1 = { s: 110, col: COLS[0], segs: [{ f0: PL, mouth: 'skel' }] };
  FEATHERS.push(F1);
  const TK = PL + 6;
  F1.segs.push({ f0: TK, tickle: true, base: { f0: 0, mouth: 'skel' }, to: 'yel:nose' });
  sfx('brush', TK, { who: 'yel', gain: 0.6 });
  sfx('brush', TK + 8, { who: 'yel', gain: 0.6 });
  key('yel', TK + 4, { sx: 0.96, sy: 1.04, mouth: 'happy - spittle' }, 3);
  const WAKE = TK + 10;
  BUB.f1 = WAKE;
  sfx('pop', WAKE, { who: 'yel', gain: 0.7 });
  key('yel', WAKE, { eyes: 'normal', look: 1, sx: 1, sy: 1 }, 0);
  rollLaugh('yel', WAKE + 2, WAKE + 16, YS, { mouth: 'happy with theeth', pitch: 1.5 });
  F1.segs.push({ f0: WAKE + 2, mouth: 'skel' });
  key('skel', WAKE + 2, { mouth: 'happy with theeth', eyes: 'normal' }, 0);
  laugh('skel', WAKE + 4, WAKE + 18);
  // укатывается вправо
  const RL = WAKE + 18, YS2 = 1540;
  key('yel', RL, { pivot: 337 }, 0);
  move('yel', RL, { x: YS, y: GROUND, rot: 0 });
  move('yel', RL + 10, { x: YS2, rot: 200 }, 'out2');
  key('yel', RL + 11, { rot: 0 }, 0);
  sfx('whoosh', RL, { who: 'yel', dur: 10, gain: 0.5 });
  key('yel', RL + 8, { mouth: 'angry theeth', eyes: 'angry' }, 0);
  ev('vein', { who: 'yel', f0: RL + 8, f1: RL + 20 });

  // ---- 4–5.2 с: Жёлтая «растёт» — Скелет влюблён
  const YX = 1380;
  const YB = transform('yel', RL + 8, YS2, YX, -1, { style: 'grow', love: 'skel', loveDur: 60 });
  key('yel', YB, stance('yel', YX, -1), 0);
  key('yel', YB + 6, { mouth: 'theeth smile', eyes: 'angry' }, 0);
  F1.segs.push({ f0: YB + 8, f1: YB + 22, a: (f, S) => target('skel:mouth', S), b: [S1 - 140, GROUND - 14], arc: 60, r0: 0, r1: 0.25 });
  F1.segs.push({ f0: YB + 22, at: [S1 - 140, GROUND - 14], rot: 0.25 });

  // ---- 5.3–8.6 с: выдёргивает перо у него из крыла — ой — щекочет: Скелет хохочет до слёз
  const YX1 = 1080, KY = C.yel.big;
  const GR = YB + 10;
  key('yel', GR - 8, { lean: 24, hip: [0, toRig('yel', 120)], head: 8 }, 8);
  const wb = target('skel:body', stateAt(GR)), wing = [wb[0] + 150, wb[1] - 40];
  key('yel', GR, { hitF: 1, hitFto: wing, hitFfix: GR }, 6);
  sfx('pop', GR + 1, { who: 'skel', gain: 0.8 });
  sfx('ref:hit-ow', GR + 2, { who: 'skel', gain: 0.9, pitch: 1.4 });
  key('skel', GR + 1, { sx: 0.85, sy: 1.18, mouth: 'puzzlement', eyes: 'sad' }, 1);
  move('skel', GR + 1, { x: S1, y: GROUND });
  move('skel', GR + 6, { y: GROUND - 160 }, 'out2');
  move('skel', GR + 12, { y: GROUND }, 'in2');
  key('skel', GR + 12, { sx: 1.2, sy: 0.82 }, 1);
  key('skel', GR + 16, { sx: 1, sy: 1 }, 3);
  const F2 = { s: 140, col: COLS[1], segs: [{ f0: GR, hand: 'yel', arm: 'F' }] };
  FEATHERS.push(F2);
  key('yel', GR + 10, { ...stance('yel', YX, -1), hitF: 0, handF: hand('yel', 'F', 0.6, -0.3), mouth: 'happy with theeth', eyes: 'normal' }, 8);
  const TK2 = GR + 18;
  key('yel', TK2 - 6, { lean: 20, hip: [0, toRig('yel', 100)], head: 6 }, 6);
  for (let i = 0; i < 5; i++) {
    const f = TK2 + i * 5;
    key('yel', f, { handF: hand('yel', 'F', 0.95, i % 2 ? 0.45 : 0.3) }, 3);
    sfx('brush', f, { who: 'skel', gain: 0.5 });
  }
  rollLaugh('skel', TK2 + 2, TK2 + 30, S1, { mouth: 'happy with theeth', pitch: 1.15 });
  ev('tears', { who: 'skel', f0: TK2 + 8, f1: TK2 + 32, snd: false });
  key('yel', TK2 + 24, { ...stance('yel', YX, -1), handF: hand('yel', 'F', 0.6, -0.3), lean: 0, head: 0 }, 8);
  sfx('ref:laugh', TK2 + 24, { who: 'yel', gain: 0.8, pitch: 1.45 });
  chuckle('yel', TK2 + 24, TK2 + 36, { mouth: 'happy with theeth' });
  // она бросает перо
  F2.segs.push({ f0: TK2 + 34, f1: TK2 + 48, a: (f, S) => KY.point(S.yel.st, 'handF'), b: [1640, GROUND - 14], arc: 80, r0: Math.PI, r1: Math.PI + 1.3 });
  F2.segs.push({ f0: TK2 + 48, at: [1640, GROUND - 14], rot: -0.3 });
  key('yel', TK2 + 34, { handF: hand('yel', 'F', -0.2, -0.3) }, 4);

  // ---- 8.6–9.8 с: Скелет «растёт»
  const SX = 560, SG = TK2 + 34;
  key('skel', SG, { eyes: 'angry', mouth: 'angry theeth', rot: 0 }, 0);
  ev('vein', { who: 'skel', f0: SG, f1: SG + 10 });
  const SB = transform('skel', SG + 2, S1, SX, 1, { style: 'grow' });
  key('skel', SB, stance('skel', SX, 1), 0);
  key('skel', SB + 6, { mouth: 'happy with theeth', eyes: 'angry' }, 0);
  key('yel', SB - 2, { mouth: 'puzzlement', eyes: 'sad', handF: stance('yel', YX, -1).handF }, 0);

  // ---- 10–13 с: перьевой вихрь — она падает на спину и хохочет; «пуф» — снова шарик
  const W0 = SB + 6, W1 = W0 + 26;
  flap(W0, W1, 0.9);
  key('skel', W0, { lean: 8, mouth: 'happy open mouth' }, 4);
  key('skel', W1 + 2, { lean: 0, mouth: 'happy with theeth' }, 6);
  ev('wind', { f0: W0 + 2, f1: W1 + 4, x0: SX + 260, x1: 1700, snd: false });
  STORM.push({ f0: W0 + 2, f1: W0 + 100, who: 'yel', n: 18, from: (S) => target('skel:body', S) });
  sfx('sparkle', W0 + 8, { who: 'yel', gain: 0.5 });
  const LAU = W0 + 12;
  walk('yel', W0, YX, YX1, 2, 8, -1, false);
  key('yel', LAU, { mouth: 'happy with theeth', eyes: 'normal', handF: hand('yel', 'F', 0.4, -0.5), handB: hand('yel', 'B', -0.3, -0.5) }, 4);
  for (let i = 0; i < 3; i++) { key('yel', LAU + 2 + i * 6, { lean: i % 2 ? -8 : 8, head: i % 2 ? -8 : 8 }, 3); }
  sfx('ref:laugh', LAU, { who: 'yel', gain: 0.85, pitch: 1.5 });
  const FB = LAU + 12, LIE = fallBack('yel', FB, YX1, -1, { mouth: 'happy with theeth', stars: false, n: 14 });
  // лёжа хохочет: ноги дрыгаются
  for (let f = LIE + 2, i = 0; f < LIE + 26; f += 4, i++) {
    key('yel', f, { legF: i % 2 ? [-40, 30, 0] : [20, -20, 0], legB: i % 2 ? [30, -30, 0] : [-30, 30, 0], mouth: i % 2 ? 'happy with theeth' : 'happy open mouth' }, 3);
  }
  for (let f = LIE; f < LIE + 24; f += 12) sfx('ref:laugh', f, { who: 'yel', gain: 0.85, pitch: 1.5 });
  key('skel', LIE + 2, { mouth: 'happy with theeth', eyes: 'normal' }, 0);
  chuckle('skel', LIE + 4, LIE + 24, { mouth: 'happy with theeth' });
  const POP = LIE + 28;
  const sm = shrink('yel', POP, YX1, -1, { mouth: 'happy with theeth', eyes: 'normal', smoke: 380 });
  key('yel', sm, { lean: 0, head: 0, hip: [0, 0], rot: 0, legF: null, legB: null, zB: null }, 0);
  move('yel', sm, { x: YX1, y: GROUND, rot: 0 });
  rollLaugh('yel', sm + 4, sm + 16, YX1, { mouth: 'happy with theeth', pitch: 1.55 });

  // ---- 13–14.3 с: Жёлтая «растёт» снова — Скелет опять влюблён
  key('yel', sm + 18, { eyes: 'angry', mouth: 'angry theeth', rot: 0 }, 0);
  ev('vein', { who: 'yel', f0: sm + 18, f1: sm + 28 });
  const YB2 = transform('yel', sm + 20, YX1, YX1, -1, { style: 'grow', love: 'skel', loveDur: 40 });
  key('yel', YB2, stance('yel', YX1, -1), 0);
  key('yel', YB2 + 6, { mouth: 'happy with theeth', eyes: 'angry' }, 0);

  // ---- 14.5–19 с: перо — щекочет ему нос — а… а… АПЧХИ! — она улетает
  const PF = [900, GROUND - 14];
  const F3 = { s: 150, col: COLS[4], segs: [{ f0: W0 + 100, at: PF, rot: 0.3 }] };
  FEATHERS.push(F3);
  const YW = 950;
  const PK = YB2 + 10;
  key('yel', PK - 8, { lean: 22, hip: [0, toRig('yel', 110)], head: 8 }, 8);
  key('yel', PK, { hitF: 1, hitFto: [PF[0] - 20, PF[1] - 10], hitFfix: PK }, 6);
  F3.segs.push({ f0: PK, hand: 'yel', arm: 'F' });
  sfx('pop', PK, { who: 'yel', gain: 0.5 });
  key('yel', PK + 10, { ...stance('yel', YX1, -1), hitF: 0, handF: hand('yel', 'F', 0.6, -0.3) }, 8);
  walk('yel', PK + 12, YX1, YW, 1, 9, -1, false);
  const TK3 = PK + 22;
  key('yel', TK3, { handF: hand('yel', 'F', 1.0, -0.45), lean: 10 }, 5);
  for (let i = 0; i < 4; i++) { key('yel', TK3 + 3 + i * 4, { handF: hand('yel', 'F', 1.0, i % 2 ? -0.38 : -0.52) }, 2); sfx('brush', TK3 + 3 + i * 4, { who: 'skel', gain: 0.5 }); }
  key('skel', TK3 + 2, { mouth: 'puzzlement', eyes: 'normal' }, 0);
  // а… а…
  const AH = TK3 + 16;
  for (const [f, l] of [[AH, -10], [AH + 10, -16]]) {
    key('skel', f, { lean: l, head: l, mouth: 'happy open mouth' }, 4);
    sfx('suck', f - 2, { who: 'skel', dur: 6, gain: 0.5 });
  }
  key('yel', AH + 4, { ...stance('yel', YW, -1), handF: hand('yel', 'F', 0.6, -0.3), lean: 0, mouth: 'puzzlement', eyes: 'sad' }, 6);
  ev('sweat', { who: 'yel', f0: AH + 6, f1: AH + 20 });
  const ACH = AH + 18;
  key('skel', ACH, { lean: 16, head: 14, mouth: 'puzzlement' }, 2, 'in2');
  key('skel', ACH + 12, { lean: 0, head: 0, mouth: 'happy with theeth' }, 8);
  sfx('sneeze', ACH, { who: 'skel', gain: 1.1, pitch: 0.85 });
  ev('wind', { f0: ACH, f1: ACH + 20, x0: SX + 200, x1: 1900, snd: false });
  ev('shake', { f: ACH, amp: 18, n: 12 });
  sfx('gust', ACH + 1, { who: 'skel', dur: 18, gain: 1.0 });
  STORM.push({ f0: ACH + 2, f1: ACH + 30, who: 'yel', n: 12, blow: true, from: (S) => target('skel:face', S) });
  F3.segs.push({ f0: ACH + 2, f1: ACH + 22, a: (f, S) => KY.point(S.yel.st, 'handF'), b: [2100, 200], arc: 100, r0: 0, r1: 6 });
  flyOff('yel', ACH + 3, ACH + 24, [YW, GROUND], [2300, -200], { turns: 2 });
  key('skel', ACH + 14, { mouth: 'happy with theeth', eyes: 'normal' }, 0);
  sfx('ref:laugh', ACH + 16, { who: 'skel', gain: 0.85, pitch: 1.0 });
  const WIN = victory('skel', ACH + 22, SX, { n: 9, stride: 110 });
  key('skel', WIN + 2, { b_B16: -40, b_B17: 40 }, 6);                     // крылья вверх
  window.T = { TK, WAKE, YB, GR, TK2, SB, LIE, POP, YB2, TK3, ACH, WIN };
};

// ------------------------------------------------------------------ рисование
ST.hooks.beforeChars.push((ctx, f, S, CAM) => {
  ctx.setTransform(...CAM);
  for (const F of FEATHERS) { const cur = F.segs.filter((c) => f >= c.f0).pop(); if (cur && cur.at) { const p = featherAt(F, f, S); FX.feather(ctx, p.x, p.y, F.s, p.rot, F.col); } }
});
ST.hooks.afterChars.push((ctx, f, S, CAM) => {
  ctx.setTransform(...CAM);
  if (f >= BUB.f0 && f < BUB.f1) {
    const n = target('yel:nose', S), r = 18 + 14 * (0.5 + 0.5 * Math.sin(f * 0.26));
    FX.sleepBubble(ctx, n[0] - 10, n[1] + 10, r);
  }
  for (const F of FEATHERS) { const cur = F.segs.filter((c) => f >= c.f0).pop(); if (cur && !cur.at) { const p = featherAt(F, f, S); if (p) FX.feather(ctx, p.x, p.y, F.s, p.rot, F.col, Math.sin(f * 0.8) * 0.3); } }
  for (const w of STORM) {
    if (f < w.f0 || f > w.f1) continue;
    const r = FX.rng(w.f0), c = target(`${w.who}:body`, S), src = w.from(statesAt(w.f0));
    for (let i = 0; i < w.n; i++) {
      const ph = r() * Math.PI * 2, sp = 0.18 + r() * 0.12, rad = 170 + r() * 120, d0 = r() * 8;
      const u = E.clamp((f - w.f0 - d0) / 12, 0, 1);                       // долетело до неё
      if (f - w.f0 < d0) continue;
      let x, y, rot;
      if (w.blow) {
        const v = (f - w.f0 - d0) / (w.f1 - w.f0);
        x = src[0] + 200 + v * 1900 + Math.sin(ph) * 120; y = src[1] - 100 + Math.cos(ph) * 220 - v * 300; rot = ph + f * 0.3;
      } else {
        const a = ph + (f - w.f0) * sp, ox = c[0] + Math.cos(a) * rad, oy = c[1] - 60 + Math.sin(a) * rad * 0.7;
        x = E.lerp(src[0], ox, E.EASE.out(u)); y = E.lerp(src[1], oy, E.EASE.out(u)); rot = a + Math.PI / 2;
        const out = f > w.f1 - 14 ? (f - (w.f1 - 14)) / 14 : 0;              // в конце осыпаются на траву
        if (out > 0) { y = E.lerp(y, GROUND - 14, out); rot = E.lerp(rot, 0.2, out); }
      }
      FX.feather(ctx, x, y, 90, rot, COLS[i % COLS.length], Math.sin(f * 0.7 + i) * 0.4);
    }
  }
});

ST.start(BIG);
