// Ролик 17 (серия по образцу): Попкорн — Жёлтая против Толстого, 25 с, 24 кадра/с. Плотно, как у HugyTi:
// солнечный луч как магия, кукуруза лопается внутри Толстого, гора попкорна, превращения туда и обратно.
// Музыка превращения — присланная, ~4 с с затиханием, только при первом превращении. Фон — грибной лес.
//
//   0–1.8 с   шарик-Жёлтая (слева), ведёрко попкорна, шарик-Толстый (справа)
//   1.8–3.4 с Толстый всасывает весь попкорн из ведёрка и отрыгивает его Жёлтой в лицо
//   3.6–4.8 с Жёлтая «растёт» под музыку — Толстый влюблён, разинул рот
//   5–7.5 с   она бросает ему в рот початок кукурузы и наводит солнечный луч — кукуруза лопается внутри,
//             Толстого подбрасывает с каждым «поп»
//   8–10 с    злой Толстый надувается и стреляет попкорном — Жёлтую заваливает горой попкорна
//   10.3–11 с из горы — «пуф» — вылетает шарик-Жёлтая
//   11.5–12.7 с она «растёт» снова — Толстый опять влюблён
//   13–17.5 с под Толстым вырастает огромный початок, солнечный луч — БУМ! Толстый взлетает и падает в гору
//             попкорна, жуёт; идёт попкорновый дождь
//   17.5–25 с Жёлтая в центре, руки вверх
'use strict';

const ST = Stage({
  name: 'mc17-popcorn',
  cast: {
    yel: { small: ['girl-verity-small', { bodyHeight: 300, recolor: 'yellow' }],
      big: ['verity-big-girl', { height: 730, splitFeet: true, recolor: 'yellow' }], pivot: 337, voice: 1.45, vAngle: 50,
      color: '#ffe23a', moods: { angry: 'angry theeth', grin: 'theeth smile', big: 'theeth smile' } },
    fat: { small: ['fat-verity-small', { bodyHeight: 450 }], pivot: 508, voice: 0.75, moods: { love: 'happy' } },
  },
  order: ['yel', 'fat'],
  background: { theme: 'mushroom', seed: 171, sunX: 1700, sunY: 130 },
  clouds: [[120, 80, 2.4, 0, 12], [640, 210, 1.8, 1, 16], [1150, 60, 2.6, 2, 10], [420, 300, 1.4, 1, 14]],
});
const { FPS, NF, GROUND, C, key, move, ev, sfx, hop, laugh, tremble, transform, shrink, love, stance,
  victory, chuckle, hand, toRig, statesAt, stateAt, target } = ST;

ST.parts.mouth = (ch, st) => E.apply(ch.eyeMatrix(st, 'puzzlement'), [611, 456]);
const P = (v, f, S) => (typeof v === 'function' ? v(f, S) : typeof v === 'string' ? target(v, S) : v);
const keyed = (ks, f) => {
  if (typeof ks === 'number') return ks;
  if (f <= ks[0][0]) return ks[0][1];
  for (let i = 1; i < ks.length; i++) {
    if (f < ks[i][0]) { const u = E.EASE.io((f - ks[i - 1][0]) / (ks[i][0] - ks[i - 1][0])); return E.lerp(ks[i - 1][1], ks[i][1], u); }
  }
  return ks[ks.length - 1][1];
};
// Толстый раскрывает рот: сначала форма, потом размер
function fatOpen(f, k, n, extra = {}) { key('fat', f - n, { mouth: 'puzzlement' }, 0); key('fat', f, { mouthK: k, ...extra }, n, 'out'); }

// ------------------------------------------------------------------ попкорн, ведёрко, кукуруза, луч
const SUN = [1700, 130];
const BX = 930, BS = 170;
const FULL = [[0, 1]];                             // ведёрко полное (1) / пустое (0)
const STREAMS = [];                                // поток попкорна: {f0, f1, from, to, n, r, arc}
const SPRAYS = [];                                 // разлёт: {f, at, n, up, spread, r}
const STUCK = [];                                  // попкорн на ком-то: {who, f0, f1}
const PILE = { x: 600, w: 1040, h: [[0, 0]], shake: [] };
const COB1 = [];                                   // початок: {f0, at, rot} | {f0, hand} | {f0, f1, a, b, arc, spin} | {f0, gone}
const COB2 = { f0: 1e9, f1: 1e9, x: 0, len: 380, pop: [[0, 0]] };
const RAYS = [];                                   // {f0, f1, to}
const RAIN = [];                                   // {f0, f1}
function cobAt(f, S) {
  let cur = null;
  for (const c of COB1) if (f >= c.f0) cur = c;
  if (!cur || cur.gone) return null;
  if (cur.at) return { x: cur.at[0], y: cur.at[1], rot: cur.rot || 0 };
  if (cur.hand) { const h = C.yel.big.point(S.yel.st, 'handF'); return { x: h[0], y: h[1] - 10, rot: -1.2 }; }
  const u = E.clamp((f - cur.f0) / (cur.f1 - cur.f0), 0, 1), a = P(cur.a, cur.f0, statesAt(cur.f0)), b = P(cur.b, f, S);
  return { x: E.lerp(a[0], b[0], u), y: E.lerp(a[1], b[1], u) - Math.sin(Math.PI * u) * (cur.arc || 0), rot: -1.2 + (cur.spin || 0) * u };
}

const YS = 520, FS = 1320;
// ================================================================== 0–1.8 с: стойка
key('yel', 0, { form: 'small', x: YS, y: GROUND, face: 1, look: 1, eyes: 'normal', mouth: 'smile normal', sx: 1, sy: 1, rot: 0, pivot: 0, alpha: 1 }, 0);
key('fat', 0, { form: 'small', x: FS, y: GROUND, face: -1, look: 1, eyes: 'normal', mouth: 'smile normal', sx: 1, sy: 1, rot: 0, pivot: 0, mouthK: 1 }, 0);

const BIG = () => {
  // ---- 1.8–3.4 с: Толстый всасывает попкорн и отрыгивает его Жёлтой в лицо
  key('fat', 36, { mouth: 'theeth smile', eyes: 'angry' }, 0);
  sfx('ref:grin-eee', 36, { who: 'fat', gain: 0.5, pitch: 0.8 });
  fatOpen(42, 2.6, 4);
  STREAMS.push({ f0: 42, f1: 60, from: [BX, GROUND - BS * 1.25], to: 'fat:mouth', n: 22, r: 16, arc: 90 });
  sfx('suck', 42, { who: 'fat', dur: 18, gain: 0.9 });
  FULL.push([56, 0]);
  key('yel', 44, { mouth: 'puzzlement', eyes: 'sad' }, 0);
  hop('yel', 48, 58, YS, 700, 70);
  key('fat', 62, { mouthK: 1, mouth: 'smile normal', sx: 1.18, sy: 1.12 }, 3);
  sfx('gulp', 62, { who: 'fat', gain: 1.0 });
  const BURP = 72, HIT = BURP + 8;
  fatOpen(BURP, 2.0, 2, { sx: 1.08, sy: 1.04 });
  sfx('burp', BURP, { who: 'fat', gain: 1.0, pitch: 0.8 });
  STREAMS.push({ f0: BURP, f1: HIT, from: 'fat:mouth', to: 'yel:face', n: 16, r: 18, arc: 30 });
  key('fat', BURP + 10, { mouthK: 1, sx: 1, sy: 1, mouth: 'happy', eyes: 'normal' }, 6);
  key('yel', HIT, { sx: 1.25, sy: 0.82 }, 1);
  move('yel', HIT, { x: 700, y: GROUND });
  move('yel', HIT + 10, { x: 560 }, 'out2');
  key('yel', HIT + 5, { sx: 1, sy: 1 }, 4);
  sfx('squish', HIT, { who: 'yel', gain: 0.8 });
  sfx('ref:grunt', HIT + 2, { who: 'yel', gain: 0.6, pitch: 1.5 });
  STUCK.push({ who: 'yel', f0: HIT, f1: 0 });
  sfx('ref:laugh', HIT + 4, { who: 'fat', gain: 0.85, pitch: 0.75 });
  laugh('fat', HIT + 4, HIT + 22);

  // ---- 3.6–4.8 с: Жёлтая «растёт» — Толстый влюблён
  const YX = 620;
  key('yel', HIT + 8, { eyes: 'angry', mouth: 'angry theeth' }, 0);
  const YB = transform('yel', HIT + 8, 560, YX, 1, { style: 'grow', love: 'fat', loveDur: 70 });
  STUCK[0].f1 = YB;
  key('yel', YB, stance('yel', YX, 1), 0);
  key('yel', YB + 6, { mouth: 'theeth smile', eyes: 'normal' }, 0);

  // ---- 5–7.5 с: початок ему в рот — солнечный луч — кукуруза лопается внутри
  const CB0 = [790, GROUND - 26];
  COB1.push({ f0: 0, at: CB0, rot: 0.1 });
  const PICK = YB + 12;
  key('yel', PICK - 8, { lean: 24, hip: [0, toRig('yel', 110)], head: 8 }, 8);
  key('yel', PICK, { hitF: 1, hitFto: [CB0[0] - 20, CB0[1] - 10], hitFfix: PICK }, 6);
  COB1.push({ f0: PICK, hand: true });
  sfx('pop', PICK, { who: 'yel', gain: 0.4 });
  key('yel', PICK + 10, { ...stance('yel', YX, 1), hitF: 0, handF: hand('yel', 'F', -0.1, -0.9), mouth: 'happy with theeth' }, 10);
  const TH = PICK + 20, IN = TH + 12;
  key('yel', TH, { handF: hand('yel', 'F', 0.95, -0.35), lean: 10 }, 4, 'in2');
  key('yel', TH + 12, { ...stance('yel', YX, 1), lean: 0, head: 0 }, 10);
  sfx('swing', TH - 3, { who: 'yel', gain: 0.8 });
  fatOpen(TH + 2, 2.6, 6);
  COB1.push({ f0: TH, f1: IN, a: (f, S) => { const h = C.yel.big.point(S.yel.st, 'handF'); return [h[0], h[1] - 10]; }, b: 'fat:mouth', arc: 110, spin: Math.PI * 3 });
  COB1.push({ f0: IN, gone: true });
  key('fat', IN, { mouthK: 1, mouth: 'smile normal', sx: 1.12, sy: 0.92 }, 2);
  sfx('gulp', IN, { who: 'fat', gain: 1.0 });
  key('fat', IN + 5, { sx: 1, sy: 1, mouth: 'puzzlement', eyes: 'normal' }, 4);
  const SNAP = IN + 8;
  key('yel', SNAP - 4, { handF: hand('yel', 'F', 0.55, -0.9), mouth: 'happy with theeth', eyes: 'angry' }, 4);
  sfx('flick', SNAP, { who: 'yel', gain: 1.0 });
  ev('twinkle', { f: SNAP, at: C.yel.big.point(stateAt(SNAP).yel.st, 'handF'), n: 14, size: 40 });
  ev('twinkle', { f: SNAP + 2, at: SUN, n: 22, size: 70 });
  RAYS.push({ f0: SNAP + 4, f1: SNAP + 30, to: 'fat:body' });
  sfx('powerup', SNAP + 4, { x: FS, dur: 26, gain: 0.6 });
  key('yel', SNAP + 8, { handF: hand('yel', 'F', 0.6, -0.4) }, 6);
  key('fat', SNAP + 8, { mouth: 'puzzlement', eyes: 'sad' }, 0);
  ev('steam', { who: 'fat', f0: SNAP + 10, f1: SNAP + 44 });
  ev('sweat', { who: 'fat', f0: SNAP + 10, f1: SNAP + 30 });
  tremble('fat', SNAP + 10, SNAP + 22, FS, 4);
  const P0 = SNAP + 22;
  for (let i = 0; i < 6; i++) {                                    // поп! поп! — подбрасывает
    const f = P0 + i * 5;
    key('fat', f, { sx: 0.9, sy: 1.12, mouthK: 1.8 }, 1);
    key('fat', f + 3, { sx: 1.08, sy: 0.94, mouthK: 1.2 }, 2);
    move('fat', f, { x: FS, y: GROUND });
    move('fat', f + 2, { y: GROUND - 70 - i * 6 }, 'out2');
    move('fat', f + 5, { y: GROUND }, 'in2');
    SPRAYS.push({ f, at: 'fat:mouth', n: 6, up: 1, spread: 0.9, r: 16 });
    sfx('pop', f, { who: 'fat', gain: 0.9 });
  }
  key('fat', P0 + 30, { sx: 1, sy: 1, mouthK: 1 }, 3);
  key('yel', P0 + 2, { mouth: 'happy with theeth', eyes: 'normal' }, 0);
  sfx('ref:laugh', P0 + 4, { who: 'yel', gain: 0.85, pitch: 1.45 });
  chuckle('yel', P0 + 4, P0 + 28, { mouth: 'happy with theeth' });

  // ---- 8–10 с: надувается и стреляет попкорном — гора попкорна над Жёлтой
  const MAD = P0 + 32;
  key('fat', MAD, { mouth: 'theeth smile', eyes: 'angry' }, 0);
  ev('vein', { who: 'fat', f0: MAD, f1: MAD + 12 });
  key('fat', MAD + 10, { sx: 1.3, sy: 1.26 }, 10, 'out');
  sfx('inflate', MAD, { who: 'fat', dur: 10, gain: 0.7 });
  const CN = MAD + 12, BUR = CN + 18, FS2 = 1530;
  fatOpen(CN, 2.4, 2);
  STREAMS.push({ f0: CN, f1: BUR, from: 'fat:mouth', to: (f, S) => [YX + Math.sin(f * 1.7) * 160, GROUND - 400 - Math.cos(f * 1.3) * 200], n: 40, r: 20, arc: 120 });
  for (let i = 0; i < 6; i++) sfx('pop', CN + i * 3, { who: 'fat', gain: 0.6 });
  sfx('whoosh', CN, { who: 'fat', dur: 18, gain: 0.6 });
  key('fat', BUR, { sx: 1, sy: 1, mouthK: 1, mouth: 'happy', eyes: 'normal' }, 8);
  move('fat', CN, { x: FS, y: GROUND });
  move('fat', CN + 10, { x: FS2 }, 'out2');
  key('yel', CN + 2, { mouth: 'puzzlement', eyes: 'sad', handF: hand('yel', 'F', 0.6, -0.6), handB: hand('yel', 'B', -0.4, -0.6), lean: -6 }, 4);
  PILE.h.push([CN + 4, 0], [BUR + 2, 760]);
  sfx('ref:grunt', BUR - 2, { who: 'yel', gain: 0.5, pitch: 1.3 });
  sfx('ref:laugh', BUR + 2, { who: 'fat', gain: 0.85, pitch: 0.75 });
  laugh('fat', BUR + 2, BUR + 22);

  // ---- 10.3–11 с: «пуф» — из горы вылетает шарик-Жёлтая
  const SHR = BUR + 12;
  PILE.shake.push([SHR - 8, SHR + 4]);
  sfx('ref:grunt', SHR - 6, { who: 'yel', gain: 0.5, pitch: 1.4 });
  const sm = shrink('yel', SHR, YX, 1, { mouth: 'puzzlement', eyes: 'sad', smoke: 10 });
  key('yel', sm, { lean: 0, head: 0, hip: [0, 0] }, 0);
  const OUT = sm + 2, YS2 = 1150;
  key('yel', sm, { x: 850, y: GROUND - 300, alpha: 0 }, 0);
  key('yel', OUT, { x: 850, y: GROUND - 380, alpha: 1 }, 0);
  move('yel', OUT + 8, { x: 1000, y: GROUND - 480 }, 'out2');
  move('yel', OUT + 18, { x: YS2, y: GROUND }, 'in2');
  key('yel', OUT + 18, { sx: 1.25, sy: 0.8 }, 1);
  key('yel', OUT + 22, { sx: 1, sy: 1 }, 3);
  SPRAYS.push({ f: OUT, at: [850, GROUND - 560], n: 14, up: 1, spread: 0.8, r: 18 });
  PILE.h.push([OUT, 760], [OUT + 6, 700]);
  sfx('poof', OUT, { x: YX, gain: 0.6 });
  sfx('spring', OUT, { x: YX, gain: 0.7 });
  sfx('land', OUT + 18, { who: 'yel', gain: 0.6 });
  ev('stars', { who: 'yel', f0: OUT + 18, f1: OUT + 34, snd: false });

  // ---- 11.5–12.7 с: Жёлтая «растёт» снова — Толстый опять влюблён (без музыки)
  key('yel', OUT + 24, { eyes: 'angry', mouth: 'angry theeth' }, 0);
  ev('vein', { who: 'yel', f0: OUT + 24, f1: OUT + 34 });
  const YB2 = transform('yel', OUT + 26, YS2, YS2, 1, { style: 'grow', love: 'fat', loveDur: 36 });
  key('yel', YB2, stance('yel', YS2, 1), 0);
  key('yel', YB2 + 6, { mouth: 'happy with theeth', eyes: 'angry' }, 0);

  // ---- 13–17.5 с: огромный початок под Толстым — луч — БУМ! — в гору попкорна
  const MG = YB2 + 14;
  key('yel', MG - 4, { handF: hand('yel', 'F', 0.85, 0.15), mouth: 'happy with theeth' }, 4);
  sfx('flick', MG, { who: 'yel', gain: 1.0 });
  for (let i = 0; i < 3; i++) ev('twinkle', { f: MG + i * 3, at: [FS2 - 150 + i * 150, GROUND - 20], n: 12, size: 36 });
  sfx('grow', MG + 2, { x: FS2, gain: 0.9 });
  Object.assign(COB2, { f0: MG + 2, f1: 0, x: FS2, grow: [MG + 2, MG + 10] });
  move('fat', MG + 2, { x: FS2, y: GROUND });
  move('fat', MG + 10, { y: GROUND - 110 }, 'out');
  key('fat', MG + 4, { mouth: 'puzzlement', eyes: 'sad' }, 0);
  ev('sweat', { who: 'fat', f0: MG + 8, f1: MG + 40 });
  const R2 = MG + 16;
  key('yel', R2 - 4, { handF: hand('yel', 'F', 0.55, -0.9), mouth: 'happy with theeth', eyes: 'angry' }, 4);
  ev('twinkle', { f: R2, at: SUN, n: 22, size: 70 });
  RAYS.push({ f0: R2, f1: R2 + 24, to: () => [FS2 - 120, GROUND - 60] });
  sfx('powerup', R2, { x: FS2, dur: 24, gain: 0.7 });
  COB2.pop = [[R2 + 6, 0], [R2 + 24, 1]];
  ev('steam', { who: 'fat', f0: R2 + 8, f1: R2 + 26 });
  tremble('fat', R2 + 10, R2 + 24, FS2, 5);
  const BOOM = R2 + 26;
  COB2.f1 = BOOM;
  SPRAYS.push({ f: BOOM, at: [FS2, GROUND - 80], n: 46, up: 1, spread: 1.4, r: 22, big: true });
  ev('flash', { f: BOOM, at: [FS2, GROUND - 100], strength: 0.5 });
  ev('shake', { f: BOOM, amp: 24, n: 16 });
  sfx('explode', BOOM, { x: FS2, gain: 0.8 });
  for (let i = 0; i < 8; i++) sfx('pop', BOOM + 2 + i * 3, { x: FS2 - 200 + i * 60, gain: 0.7 });
  RAIN.push({ f0: BOOM + 8, f1: BOOM + 70 });
  // Толстый взлетает за кадр и падает в гору попкорна
  const UPF = BOOM + 12, DOWN = UPF + 20;
  key('fat', BOOM, { pivot: 508, mouth: 'puzzlement', eyes: 'sad', sx: 0.85, sy: 1.18 }, 1);
  move('fat', BOOM, { x: FS2, y: GROUND - 110, rot: 0 });
  move('fat', UPF, { x: 1100, y: -560 }, 'out');
  move('fat', UPF, { rot: -540 }, 'lin');
  key('fat', UPF + 1, { rot: 0, pivot: 0, sx: 1, sy: 1 }, 0);
  sfx('whoosh', BOOM, { who: 'fat', dur: 12, gain: 0.7 });
  sfx('scared', BOOM + 2, { who: 'fat', gain: 0.8, pitch: 0.8 });
  move('fat', UPF + 1, { x: PILE.x, y: -560 });
  move('fat', DOWN, { x: PILE.x, y: GROUND - 300 }, 'in2');
  sfx('whoosh', UPF + 6, { who: 'fat', dur: 12, gain: 0.5 });
  sfx('squish', DOWN, { who: 'fat', gain: 1.0 });
  SPRAYS.push({ f: DOWN, at: [PILE.x, GROUND - 560], n: 20, up: 1, spread: 1.1, r: 20 });
  PILE.h.push([DOWN, 700], [DOWN + 3, 640]);
  key('fat', DOWN, { sx: 1.2, sy: 0.85 }, 1);
  key('fat', DOWN + 5, { sx: 1, sy: 1, mouth: 'happy', eyes: 'normal' }, 4);
  // съедает всю гору — раздувается — и укатывается влево за кадр
  for (let i = 0; i < 5; i++) {
    const g = 1 + 0.06 * (i + 1);
    key('fat', DOWN + 10 + i * 8, { sx: g * 1.05, sy: g * 0.96, mouth: 'smile normal' }, 3);
    key('fat', DOWN + 14 + i * 8, { sx: g, sy: g, mouth: 'happy' }, 3);
    sfx('chomp', DOWN + 10 + i * 8, { who: 'fat', gain: 0.7 });
  }
  PILE.h.push([DOWN + 8, 640], [DOWN + 50, 0]);
  move('fat', DOWN + 8, { x: PILE.x, y: GROUND - 300 });
  move('fat', DOWN + 50, { y: GROUND }, 'io');
  sfx('burp', DOWN + 54, { who: 'fat', gain: 1.0, pitch: 0.7 });
  key('fat', DOWN + 54, { mouth: 'puzzlement', mouthK: 1.8 }, 2);
  key('fat', DOWN + 60, { mouth: 'happy', mouthK: 1, eyes: 'normal' }, 4);
  const ROLL = DOWN + 60;
  key('fat', ROLL, { pivot: 508 }, 0);
  move('fat', ROLL, { x: PILE.x, rot: 0 });
  move('fat', ROLL + 24, { x: -600, rot: -((PILE.x + 600) / (Math.PI * 675)) * 360 }, 'in');
  sfx('whoosh', ROLL + 4, { who: 'fat', dur: 18, gain: 0.6 });
  sfx('ref:laugh', ROLL + 2, { who: 'fat', gain: 0.7, pitch: 0.7 });
  key('yel', BOOM + 4, { handF: stance('yel', YS2, 1).handF, mouth: 'happy with theeth', eyes: 'normal' }, 6);
  sfx('ref:laugh', BOOM + 6, { who: 'yel', gain: 0.85, pitch: 1.45 });
  chuckle('yel', BOOM + 6, BOOM + 28, { mouth: 'happy with theeth' });
  sfx('ref:laugh', DOWN + 30, { who: 'yel', gain: 0.8, pitch: 1.45 });
  chuckle('yel', DOWN + 30, DOWN + 50, { mouth: 'happy with theeth' });
  const WIN = victory('yel', DOWN + 66, YS2, { n: 9, stride: 110 });
  window.T = { HIT, YB, IN, P0, CN, BUR, OUT, YB2, MG, BOOM, DOWN, WIN };
};

// ------------------------------------------------------------------ рисование
const pileH = (f) => keyed(PILE.h, f);
ST.hooks.beforeChars.push((ctx, f, S, CAM) => {
  ctx.setTransform(...CAM);
  if (f < (window.T ? window.T.BUR : NF)) FX.popBucket(ctx, BX, GROUND + 4, BS, keyed(FULL, f) > 0.5);   // потом — под горой, и её съели
  if (f >= COB2.f0 && (!COB2.f1 || f < COB2.f1)) {
    const g = E.EASE.out(E.clamp((f - COB2.grow[0]) / (COB2.grow[1] - COB2.grow[0]), 0, 1)), pop = keyed(COB2.pop, f);
    const jx = pop > 0 ? Math.sin(f * 2.3) * 6 * pop : 0;
    FX.cornCob(ctx, COB2.x + jx, GROUND - 55 * g, COB2.len * g, 0.05, pop);
  }
  const c = cobAt(f, S);
  if (c && COB1.find((k) => k.at) && f < COB1[1].f0) FX.cornCob(ctx, c.x, c.y, 170, c.rot);
});
ST.hooks.afterChars.push((ctx, f, S, CAM) => {
  ctx.setTransform(...CAM);
  for (const s of STUCK) {
    if (f < s.f0 || (s.f1 && f >= s.f1)) continue;
    const p = target(`${s.who}:face`, S), r = FX.rng(7);
    for (let i = 0; i < 9; i++) FX.popcorn(ctx, p[0] + (r() - 0.5) * 150, p[1] + (r() - 0.3) * 110, 17, r() * 6);
  }
  const c = cobAt(f, S);
  if (c && f >= COB1[1].f0) FX.cornCob(ctx, c.x, c.y, 170, c.rot);
  for (const q of RAYS) {
    if (f < q.f0 || f > q.f1 + 4) continue;
    FX.sunRay(ctx, SUN, P(q.to, f, S), f / FPS, Math.min(1, (f - q.f0 + 1) / 3, (q.f1 + 4 - f) / 4));
  }
  for (const q of STREAMS) {
    if (f < q.f0 || f > q.f1 + 8) continue;
    const r = FX.rng(q.f0);
    for (let i = 0; i < q.n; i++) {
      const t0 = q.f0 + (q.f1 - q.f0) * (i / q.n), u = (f - t0) / 8;
      if (u < 0 || u > 1) continue;
      const a = P(q.from, t0, statesAt(Math.round(t0))), b = P(q.to, f, S), jx = (r() - 0.5) * 80, jy = (r() - 0.5) * 60;
      FX.popcorn(ctx, E.lerp(a[0], b[0] + jx, u), E.lerp(a[1], b[1] + jy, u) - Math.sin(Math.PI * u) * q.arc, q.r, r() * 6 + u * 4);
    }
  }
  const h = pileH(f);
  if (h > 1) {
    let sx = 0;
    for (const [a, b] of PILE.shake) if (f >= a && f < b) sx = Math.sin(f * 2.1) * 10;
    FX.popcornPile(ctx, PILE.x + sx, GROUND + 6, PILE.w, h, 3);
  }
  for (const s of SPRAYS) {
    const u = (f - s.f) / 22;
    if (u < 0 || u > 1) continue;
    const a = P(s.at, s.f, statesAt(s.f)), r = FX.rng(s.f + 3);
    for (let i = 0; i < s.n; i++) {
      const ang = -Math.PI / 2 + (r() - 0.5) * 2 * s.spread, v = (s.big ? 900 : 420) * (0.5 + r() * 0.6);
      const px = a[0] + Math.cos(ang) * v * u, py = a[1] + Math.sin(ang) * v * u + 900 * u * u;
      if (py > GROUND + 10) continue;
      FX.popcorn(ctx, px, py, s.r * (0.8 + r() * 0.4), r() * 6 + u * 8);
    }
  }
  for (const q of RAIN) {
    if (f < q.f0 || f > q.f1) continue;
    const r = FX.rng(q.f0);
    for (let i = 0; i < 40; i++) {
      const x = r() * 1920, t0 = r() * (q.f1 - q.f0 - 24), y = -40 + (f - q.f0 - t0) * 38;
      if (y < -40 || y > GROUND) continue;
      FX.popcorn(ctx, x + Math.sin(f * 0.2 + i) * 10, y, 16 + r() * 6, f * 0.1 + i);
    }
  }
});

ST.start(BIG);
