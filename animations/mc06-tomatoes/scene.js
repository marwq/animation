// Ролик 06 (серия по образцу): Помидоры — Толстый против Розовой, 25 с, 24 кадра/с. Драка мягкая — помидоры.
// Превращение «рост» под присланную музыку. Фон «майнкрафт», тема «деревня» (домики, забор).
//
//   0–1.8 с   шарик-Розовая (слева, рядом грядка) и Толстый (справа, за ним куст помидоров)
//   1.8–3.7 с Толстый срывает ртом помидор с куста и плюёт им в Розовую — помидор на лице
//   3.7–4.9 с Розовая «растёт» под музыку — Толстый влюблён и подскакивает поближе
//   5.5–11 с  она кидает помидоры — Толстый ловит их ртом и съедает, облизывается
//   11.3–14.7 с вытаскивает с грядки огромный помидор — прямо Толстому в лицо, лицо в томате
//   15–18 с   Толстый вслепую скачет не туда — в куст, отскакивает, звёздочки
//   18.5–21 с снова влюблён, раскрывает рот — она кладёт туда помидор; Толстый раздувается и
//             от громкой отрыжки укатывается за кадр
//   21–25 с   Розовая в центре, руки вверх
'use strict';

const ST = Stage({
  name: 'mc06-tomatoes',
  cast: {
    fat: { small: ['fat-verity-small', { bodyHeight: 450 }], pivot: 508, voice: 0.75, moods: { love: 'happy' } },
    pink: { small: ['girl-verity-small', { bodyHeight: 300 }], big: ['girl-verity-big', { height: 730, splitFeet: true }],
      pivot: 337, voice: 1.35, vAngle: 50, color: '#ff4fc8', moods: { angry: 'angry theeth', grin: 'theeth smile', big: 'theeth smile' } },
  },
  order: ['fat', 'pink'],
  background: { theme: 'village', seed: 61, sunX: 1450, sunY: 150 },
  clouds: [[100, 80, 2.4, 0, 14], [660, 180, 1.8, 1, 18], [1150, 60, 2.6, 2, 12], [1640, 250, 1.6, 0, 20], [430, 310, 1.4, 1, 16]],
});
const { FPS, NF, GROUND, C, key, move, ev, sfx, hop, tumble, laugh, tremble, transform, love, stance, walk, turn,
  dodge, victory, chuckle, hand, toRig, statesAt, stateAt, target } = ST;

ST.parts.mouth = (ch, st) => E.apply(ch.eyeMatrix(st, 'puzzlement'), [611, 456]);

// ------------------------------------------------------------------ помидоры
const BED = { x: 270, w: 270 }, BUSH = { x: 1690, h: 240 };
const BUSH_FRUIT = [[-46, -150], [40, -118], [-30, -200], [34, -196]];
let bushGone = [];                                       // [кадр, индекс] — сорванные
const R = 26, GR = 74;                                   // помидор, огромный помидор
const TOMS = [];                                         // {r, segs}
const SPL = [];                                          // красные кляксы: {who, part, f0, f1, s, seed, dy}
const P = (v, f, S) => (typeof v === 'function' ? v(f, S) : typeof v === 'string' ? target(v, S) : v);
const tomAt = (T, f, S) => {
  let cur = null;
  for (const c of T.segs) if (f >= c.f0) cur = c;
  if (!cur || cur.gone) return null;
  if (cur.at) return { x: cur.at[0], y: cur.at[1], rot: 0, ground: true };
  if (cur.hand) { const h = C[cur.hand].big.point(S[cur.hand].st, 'handB'); return { x: h[0], y: h[1] - T.r * 0.55, rot: 0, hand: cur.hand }; }
  if (cur.keys) {
    const ks = cur.keys;
    let i = 1;
    while (i < ks.length - 1 && f >= ks[i][0]) i++;
    const a = ks[i - 1], b = ks[i], u = E.clamp((f - a[0]) / Math.max(1, b[0] - a[0]), 0, 1), e = E.EASE.io(u);
    return { x: E.lerp(a[1], b[1], e), y: E.lerp(a[2], b[2], e), rot: 0, hand: cur.held };
  }
  const u = E.clamp((f - cur.f0) / (cur.f1 - cur.f0), 0, 1);
  const a = P(cur.a, cur.f0, statesAt(cur.f0)), b = P(cur.b, f, S);
  return { x: E.lerp(a[0], b[0], u), y: E.lerp(a[1], b[1], u) - Math.sin(Math.PI * u) * (cur.arc || 0), rot: (cur.spin || 0) * u };
};
// взять помидор с грядки за спиной: поворот, наклон, рука в грядку, выпрямился, поворот обратно
function pickTomato(f, x) {
  const T = { r: R, segs: [] };
  TOMS.push(T);
  turn('pink', f, -1, x);
  key('pink', f + 4, { lean: 26, hip: [0, toRig('pink', 110)], head: 10 }, 8);
  key('pink', f + 12, { hitB: 1, hitBto: [BED.x + 40, GROUND - 40], hitBfix: f + 12 }, 6);
  T.segs.push({ f0: f + 12, hand: 'pink' });
  sfx('pop', f + 12, { who: 'pink', gain: 0.4 });
  key('pink', f + 24, { ...stance('pink', x, -1), hitB: 0, handB: hand('pink', 'B', 0.45, -0.3) }, 10);
  turn('pink', f + 26, 1, x);
  key('pink', f + 30, { handB: hand('pink', 'B', 0.45, -0.3) }, 3);
  return T;
}
// бросок из ближней руки
function toss(T, f, n, tgt, x, o = {}) {
  key('pink', f - 8, { handB: hand('pink', 'B', -0.55, -0.75), lean: -8 }, 7);
  key('pink', f, { handB: hand('pink', 'B', 0.9, -0.45), lean: 12, mouth: o.mouth || 'happy with theeth' }, 4, 'in2');
  key('pink', f + 14, stance('pink', x, 1, { mouth: o.after || 'theeth smile' }), 10);
  const h = C.pink.big.point(stateAt(f).pink.st, 'handB');
  T.segs.push({ f0: f, f1: f + n, a: [h[0], h[1] - T.r * 0.55], b: tgt, arc: o.arc ?? 80, spin: 5 });
  sfx('swing', f - 3, { who: 'pink', gain: 0.7 });
  return f + n;
}
// Толстый ловит ртом и глотает
function gulp(f, open = 2.4) {
  key('fat', f - 8, { mouth: 'puzzlement', mouthK: 1, sx: 1.05, sy: 0.97 }, 0);
  key('fat', f - 2, { mouthK: open }, 6, 'out');
  key('fat', f + 2, { mouthK: 1, mouth: 'smile normal', sx: 1.12, sy: 0.92 }, 3, 'out');
  key('fat', f + 8, { sx: 0.96, sy: 1.04 }, 5);
  key('fat', f + 14, { sx: 1, sy: 1, mouth: 'happy' }, 5);
  sfx('chomp', f, { who: 'fat', gain: 0.9 });
  sfx('gulp', f + 6, { who: 'fat', gain: 0.9 });
  sfx('lick', f + 14, { who: 'fat', gain: 0.8 });
}

const PS = 560, FS = 1360, PX = 520;
// ================================================================== 0–1.8 с: стойка
key('pink', 0, { form: 'small', x: PS, y: GROUND, face: 1, look: 1, eyes: 'normal', mouth: 'smile normal', sx: 1, sy: 1, rot: 0 }, 0);
key('fat', 0, { form: 'small', x: FS, y: GROUND, face: -1, look: 1, eyes: 'normal', mouth: 'smile normal', sx: 1, sy: 1, rot: 0, mouthK: 1 }, 0);

const BIG = () => {
  // ---- 1.8–3.7 с: срывает ртом помидор и плюёт им в Розовую
  const S1 = stateAt(1), MO = target('fat:mouth', S1)[0] - FS;       // рот почти по центру
  key('fat', 42, { mouth: 'theeth smile', eyes: 'angry' }, 0);
  sfx('ref:grin-eee', 42, { who: 'fat', gain: 0.5, pitch: 0.8 });
  key('fat', 44, { sx: 0.3 }, 1);
  key('fat', 45, { face: 1 }, 0);
  key('fat', 46, { sx: 1 }, 1);
  const fr = BUSH_FRUIT[0], FX1 = BUSH.x + fr[0] - MO - 6;
  hop('fat', 48, 60, FS, FX1, 60);
  const CH = 62;
  key('fat', CH - 4, { mouth: 'puzzlement', mouthK: 1.8 }, 3);
  key('fat', CH, { mouthK: 1, mouth: 'theeth smile', sx: 1.06, sy: 0.96 }, 2);
  bushGone.push([CH, 0]);
  sfx('chomp', CH, { who: 'fat', gain: 0.9 });
  key('fat', CH + 4, { sx: 0.3 }, 1);
  key('fat', CH + 5, { face: -1 }, 0);
  key('fat', CH + 6, { sx: 1 }, 1);
  const SP = CH + 14, HIT = SP + 10;
  key('fat', SP - 6, { sx: 1.1, sy: 0.94 }, 4);
  key('fat', SP, { sx: 0.9, sy: 1.08, mouth: 'puzzlement', mouthK: 1.4 }, 2);
  key('fat', SP + 6, { sx: 1, sy: 1, mouthK: 1, mouth: 'happy' }, 4);
  sfx('spit', SP, { who: 'fat', gain: 1.0 });
  const T0 = { r: R, segs: [{ f0: SP, f1: HIT, a: (f, S) => target('fat:mouth', S), b: 'pink:face', arc: 60, spin: 6 }, { f0: HIT, gone: true }] };
  TOMS.push(T0);
  SPL.push({ who: 'pink', part: 'face', f0: HIT, f1: 102, s: 130, seed: 3, dy: 0 });
  sfx('splash', HIT, { who: 'pink', gain: 0.9 });
  sfx('hurt', HIT + 2, { who: 'pink', gain: 0.7 });
  key('pink', HIT, { sx: 1.2, sy: 0.84, mouth: 'puzzlement', eyes: 'sad' }, 1);
  key('pink', HIT + 5, { sx: 1, sy: 1 }, 4);
  sfx('ref:laugh', HIT + 4, { who: 'fat', gain: 0.85, pitch: 0.75 });
  laugh('fat', HIT + 4, HIT + 24);

  // ---- 3.7–4.9 с: Розовая «растёт» — Толстый влюблён
  const PB = transform('pink', HIT + 6, PS, PX, 1, { style: 'grow', love: 'fat', loveDur: 70 });
  key('pink', PB, stance('pink', PX, 1), 0);
  key('pink', PB + 6, { mouth: 'theeth smile', eyes: 'normal' }, 0);
  const FX2 = 1330, FX3 = 1200;
  hop('fat', PB + 10, PB + 22, FX1, FX2, 50);
  hop('fat', PB + 28, PB + 40, FX2, FX3, 50);

  // ---- 5.5–11 с: помидоры — Толстый ловит ртом
  const PX1 = 430;
  turn('pink', PB + 12, -1, PX);
  walk('pink', PB + 16, PX, PX1, 1, 10, -1);
  const T1 = pickTomato(PB + 30, PX1);
  const TH1 = PB + 72, EAT1 = TH1 + 16;
  toss(T1, TH1, 16, 'fat:mouth', PX1, { arc: 90 });
  T1.segs.push({ f0: EAT1, gone: true });
  gulp(EAT1);
  key('pink', EAT1 + 4, { mouth: 'puzzlement' }, 0);
  const T2 = pickTomato(EAT1 + 10, PX1);
  const TH2 = EAT1 + 52, EAT2 = TH2 + 16;
  key('pink', TH2 - 10, { mouth: 'angry theeth', eyes: 'angry' }, 0);
  toss(T2, TH2, 16, 'fat:mouth', PX1, { arc: 70, mouth: 'angry theeth', after: 'puzzlement' });
  T2.segs.push({ f0: EAT2, gone: true });
  gulp(EAT2);
  love('fat', EAT2 + 16, EAT2 + 46);
  ev('vein', { who: 'pink', f0: EAT2 + 8, f1: EAT2 + 30 });
  ev('steam', { who: 'pink', f0: EAT2 + 10, f1: EAT2 + 30 });
  sfx('anger', EAT2 + 8, { who: 'pink', dur: 20, gain: 0.6 });

  // ---- 11.3–14.7 с: огромный помидор с грядки — Толстому в лицо
  const G0 = EAT2 + 22;
  turn('pink', G0, -1, PX1);
  const GT = { r: GR, segs: [] };
  TOMS.push(GT);
  const onBed = [BED.x + 20, GROUND - 34 - GR * 0.9];
  GT.segs.push({ f0: 0, at: onBed });
  const grips = (cx, cy, face) => ({ F: [cx + face * GR * 0.85, cy - GR * 0.1], B: [cx - face * GR * 0.5, cy + GR * 0.45] });
  const GRAB = G0 + 14, PULL = GRAB + 18, LIFT = PULL + 6, TURN2 = LIFT + 4, HIGH = TURN2 + 10, THG = HIGH + 8, SPLAT = THG + 16;
  key('pink', G0 + 4, { lean: 22, hip: [0, toRig('pink', 100)], head: 8 }, 8);
  let g = grips(...onBed, -1);
  key('pink', GRAB, { hitF: 1, hitFto: g.F, hitB: 1, hitBto: g.B }, 6);
  tremble('pink', GRAB + 2, PULL, PX1, 3);
  sfx('ref:grunt', GRAB + 4, { who: 'pink', gain: 0.8, pitch: 1.3 });
  sfx('creak', GRAB + 2, { who: 'pink', dur: PULL - GRAB - 2, gain: 0.5 });
  const C1 = [PX1 - 110, GROUND - 400], C2 = [PX1 + 115, GROUND - 400], C3 = [PX1 + 100, GROUND - 510];
  GT.segs.push({ f0: GRAB, keys: [[GRAB, ...onBed], [PULL, onBed[0], onBed[1] - 10], [LIFT, ...C1], [TURN2 + 1, ...C1], [TURN2 + 2, ...C2], [HIGH, ...C3]], held: 'pink' });
  sfx('pop', PULL, { who: 'pink', gain: 1.0 });
  sfx('squish', PULL + 1, { who: 'pink', gain: 0.5 });
  g = grips(...C1, -1);
  key('pink', LIFT, { hitFto: g.F, hitBto: g.B, lean: -4, hip: [0, toRig('pink', 20)], head: 0 }, 6);
  turn('pink', TURN2, 1, PX1);
  g = grips(...C2, 1);
  key('pink', TURN2 + 2, { hitFto: g.F, hitBto: g.B }, 0);
  g = grips(...C3, 1);
  key('pink', HIGH, { hitFto: g.F, hitBto: g.B, lean: -10, head: -6, mouth: 'happy with theeth', eyes: 'angry' }, 8);
  key('pink', THG, { hitF: 0, hitB: 0, handF: hand('pink', 'F', 0.95, -0.4), handB: hand('pink', 'B', 0.95, -0.3), lean: 12, head: 0 }, 4, 'in2');
  key('pink', THG + 14, stance('pink', PX1, 1, { mouth: 'happy with theeth' }), 10);
  sfx('swing', THG - 3, { who: 'pink', gain: 0.9 });
  GT.segs.push({ f0: THG, f1: SPLAT, a: C3, b: 'fat:mouth', arc: 60, spin: 2 });
  GT.segs.push({ f0: SPLAT, gone: true });
  key('fat', SPLAT - 10, { mouth: 'puzzlement', mouthK: 2.2, eyes: 'normal' }, 6, 'out');
  key('fat', SPLAT, { mouthK: 1, sx: 1.2, sy: 0.88, eyes: 'sad' }, 2);
  key('fat', SPLAT + 6, { sx: 1, sy: 1 }, 5);
  SPL.push({ who: 'fat', part: 'body', f0: SPLAT, f1: SPLAT + 86, s: 250, seed: 7, dy: -50 });
  sfx('splash', SPLAT, { who: 'fat', gain: 1.0 });
  sfx('squish', SPLAT + 1, { who: 'fat', gain: 0.8 });
  sfx('hurt', SPLAT + 3, { who: 'fat', gain: 0.8 });
  ev('shake', { f: SPLAT, amp: 12, n: 10 });
  key('pink', SPLAT + 4, { mouth: 'happy with theeth', eyes: 'normal' }, 0);
  sfx('ref:laugh', SPLAT + 6, { who: 'pink', gain: 0.85, pitch: 1.35 });
  chuckle('pink', SPLAT + 6, SPLAT + 30, { mouth: 'happy with theeth' });

  // ---- 15–18 с: вслепую скачет не туда — в куст, отскакивает
  tremble('fat', SPLAT + 6, SPLAT + 20, FX3, 4);
  key('fat', SPLAT + 20, { sx: 0.3 }, 1);
  key('fat', SPLAT + 21, { face: 1 }, 0);
  key('fat', SPLAT + 22, { sx: 1 }, 1);
  const FX4 = 1450, BUMP = SPLAT + 36;
  hop('fat', SPLAT + 24, BUMP, FX3, FX4, 70);
  ev('spark', { f: BUMP, at: [BUSH.x - 30, GROUND - 160], r: 50, snd: 'boing', swing: false });
  BUSHSHAKE.push(BUMP);
  bushGone.push([BUMP + 2, 1], [BUMP + 2, 2]);
  FALLS.push({ f: BUMP + 2, from: [BUSH.x + 40, GROUND - 118], to: [BUSH.x + 70, GROUND - 22] },
    { f: BUMP + 5, from: [BUSH.x - 30, GROUND - 200], to: [BUSH.x - 120, GROUND - 22] });
  const FX5 = 1310;
  hop('fat', BUMP + 1, BUMP + 13, FX4, FX5, 60);
  key('fat', BUMP + 2, { mouth: 'puzzlement', eyes: 'sad' }, 0);
  ev('stars', { who: 'fat', f0: BUMP + 14, f1: BUMP + 30 });
  sfx('ref:hit-ow', BUMP + 2, { who: 'fat', gain: 0.8, pitch: 0.75 });

  // ---- 18.5–21 с: снова влюблён — помидор в рот — отрыжка
  const T3 = pickTomato(SPLAT + 30, PX1);
  const SEE = BUMP + 30;
  key('fat', SEE, { sx: 0.3 }, 1);
  key('fat', SEE + 1, { face: -1 }, 0);
  key('fat', SEE + 2, { sx: 1, eyes: 'normal' }, 1);
  love('fat', SEE + 4, SEE + 40);
  const FX6 = 1100;
  hop('fat', SEE + 8, SEE + 20, FX5, FX6, 50);
  const TH3 = SEE + 20, EAT3 = TH3 + 14;
  toss(T3, TH3, 14, 'fat:mouth', PX1, { arc: 70, mouth: 'happy with theeth', after: 'happy with theeth' });
  T3.segs.push({ f0: EAT3, gone: true });
  gulp(EAT3, 2.6);
  key('fat', EAT3 + 16, { sx: 1.28, sy: 1.16, mouth: 'puzzlement', eyes: 'sad' }, 8, 'out');    // объелся — раздуло
  sfx('inflate', EAT3 + 14, { who: 'fat', dur: 10, gain: 0.6 });
  const BURP = EAT3 + 24;
  key('fat', BURP, { mouth: 'puzzlement', mouthK: 2.4, sx: 1.08, sy: 1.04 }, 3);
  sfx('burp', BURP, { who: 'fat', gain: 1.0 });
  ev('wind', { f0: BURP, f1: BURP + 16, x0: FX6 - 200, x1: 320, snd: false });
  key('pink', BURP + 2, { mouth: 'puzzlement', head: -8, lean: -6 }, 3);
  key('pink', BURP + 14, { head: 0, lean: 0 }, 6);
  key('fat', BURP + 6, { mouthK: 1, sx: 1, sy: 1 }, 4);
  tumble('fat', BURP + 4, BURP + 28, FX6, 2300, 160, 3, {});
  ev('twinkle', { f: BURP + 24, at: [1810, 330], n: 22, size: 56 });
  key('pink', BURP + 16, { mouth: 'happy with theeth', eyes: 'normal' }, 0);
  sfx('ref:laugh', BURP + 18, { who: 'pink', gain: 0.85, pitch: 1.35 });
  victory('pink', BURP + 18, PX1, { n: 8, stride: 135 });
  window.T = { PB, EAT1, EAT2, SPLAT, BUMP, BURP };
};

const BUSHSHAKE = [], FALLS = [];
ST.hooks.beforeChars.push((ctx, f, S, CAM) => {
  ctx.setTransform(...CAM);
  FX.gardenBed(ctx, BED.x, GROUND + 4, BED.w);
  const gone = new Set(bushGone.filter(([g]) => f >= g).map(([, i]) => i));
  const sh = BUSHSHAKE.reduce((a, g) => a + (f >= g && f < g + 14 ? Math.sin((f - g) * 1.8) * 6 * (1 - (f - g) / 14) : 0), 0);
  FX.tomatoBush(ctx, BUSH.x + sh, GROUND + 4, BUSH.h, BUSH_FRUIT.filter((_, i) => !gone.has(i)));
  for (const T of TOMS) {                          // лежит на грядке — позади героев
    const t = tomAt(T, f, S);
    if (t && t.ground) FX.tomato(ctx, t.x, t.y, T.r, 0);
  }
  for (const q of FALLS) {
    const u = E.clamp((f - q.f) / 10, 0, 1);
    if (f < q.f) continue;
    FX.tomato(ctx, E.lerp(q.from[0], q.to[0], u), E.lerp(q.from[1], q.to[1], u * u), R, u * 3);
  }
});
ST.hooks.afterChars.push((ctx, f, S, CAM) => {
  ctx.setTransform(...CAM);
  for (const s of SPL) {
    if (f < s.f0 || f > s.f1) continue;
    const p = target(`${s.who}:${s.part}`, S), fade = Math.min(1, (s.f1 - f) / 5);
    ctx.globalAlpha = Math.max(0, fade);
    FX.gumSplat(ctx, p[0], p[1] + (s.dy || 0) + (1 - fade) * 40, s.s * Math.min(1, (f - s.f0 + 2) / 3), s.seed, '#e8262e', '#5a0a0a');
    ctx.globalAlpha = 1;
  }
  for (const T of TOMS) {
    const t = tomAt(T, f, S);
    if (!t || t.ground) continue;
    ctx.setTransform(...CAM);
    FX.tomato(ctx, t.x, t.y, T.r, t.rot);
    if (t.hand) { const { ch, st, p } = S[t.hand]; ch.draw(ctx, { ...st, p: { ...p, only: 'B' } }, CAM); }
  }
});

ST.start(BIG);
