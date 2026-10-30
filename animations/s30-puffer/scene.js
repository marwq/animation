// Ролик 18 (бывш. 30): Иглобрюх — Жёлтая (слева) против Радужного (справа), 25 с, 24 кадра/с. Драка без ударов:
// рыба-иглобрюх из майнкрафта раздувается колючим шаром, когда её пугают; её надувают, как шарик.
// В начале — считалка «3, 2, 1, FIGHT». Музыка превращения — один раз. Фон — плитки: синяя стена, розовый пол, подушечки.
//
//   0–2.2 с   считалка: шарик-Жёлтая и радужный шарик неподвижно стоят друг напротив друга
//   2.2–4 с   с неба шлёпается иглобрюх; Радужный отбивает его головой — тот раздувается в полёте и
//             колется Жёлтой в макушку — «ай!»
//   4–5.2 с   Жёлтая «растёт» под музыку — Радужный влюблён
//   5.3–9 с   влюблённый Радужный тянется поцеловаться — она пугает рыбу «бу!» прямо у его лица —
//             иглобрюх раздувается — «ай-ай!», Радужный скачет
//   9–13 с    Радужный «растёт», надувает рыбу, как воздушный шарик, отпускает — она носится по небу
//             и шлёпает Жёлтую по лицу — падает — «пуф»
//   13–16.5 с шарик-Жёлтая подкатывает рыбу Радужному под ногу — раздувается — «ай!» — падает — «пуф»
//   16.5–20 с Жёлтая «растёт» снова; шарик-Радужный садится на рыбу — она раздувается и, как воздушный
//             шар, уносит его в небо
//   20–25 с   Жёлтая в центре, руки вверх
'use strict';

const ST = Stage({
  name: '18 Жёлтая vs Радужный',
  frames: 600,
  intro: 'countdown-321',
  cast: {
    yel: { small: ['girl-verity-small', { bodyHeight: 300, recolor: 'yellow' }],
      big: ['verity-big-girl', { height: 730, splitFeet: true, recolor: 'yellow' }], pivot: 337, voice: 1.45, vAngle: 50, lie: 55,
      color: '#ffe23a', moods: { angry: 'angry theeth', grin: 'theeth smile', big: 'theeth smile' } },
    rb: { small: ['skeleton-verity-small', { scale: 0.455, recolor: 'rainbow' }], big: ['all-verity-color', { height: 730 }],
      pivot: 325, voice: 0.85, lie: 55, color: '#ff7a3a', moods: { angry: 'angry theeth', grin: 'happy with theeth', big: 'theeth smile', love: 'happy - spittle' } },
  },
  order: ['rb', 'yel'],
  background: { theme: 'tiles', seed: 1018, wall: '#3a6ee0', floor: '#ffb0de', motif: 'pillows', sky: ['#55b0fa', '#dcf3ff'] },
  clouds: [[150, 80, 2.4, 0, 12], [700, 220, 1.8, 1, 16], [1150, 70, 2.6, 2, 10], [1720, 250, 1.5, 0, 18]],
});
const { FPS, NF, GROUND, C, key, move, ev, sfx, hop, tumble, laugh, tremble, transform, shrink, stance, walk,
  slip, fallBack, victory, chuckle, hand, statesAt, target } = ST;
const P = (v, f, S) => (typeof v === 'function' ? v(f, S) : typeof v === 'string' ? target(v, S) : v);

// ------------------------------------------------------------------ иглобрюх
const PS = 130;
const FISH = [];          // {f0, at:[x,y], face, rot} | {f0, f1, a, b, arc, spin, face, ease} | {f0, hand: who, dx, dy, face} | {f0, path: [[f,x,y]...]} | {f0, under: who, dy}
const PUFF = [[0, 0]];    // [кадр, раздутость]
const OUCH = [];          // {f, at, size}
const FLOP = [];          // [f0, f1] — бьётся на земле
function segAt(segs, f) { let c = null; for (const s of segs) if (f >= s.f0) c = s; return c && !c.gone ? c : null; }
const lerpKeys = (ks, f) => { for (let i = 0; i < ks.length; i++) if (f < ks[i][0]) { if (!i) return ks[0][1]; const [a, x] = ks[i - 1], [b, y] = ks[i]; return E.lerp(x, y, E.EASE.io((f - a) / (b - a))); } return ks[ks.length - 1][1]; };
const puffAt = (f) => lerpKeys(PUFF, f);
const fishR = (f) => PS * 0.5 * (1 + puffAt(f) * 1.6) * 0.9;    // половина высоты (для посадки на землю)
function fishAt(f, S) {
  const c = segAt(FISH, f);
  if (!c) return null;
  const pf = puffAt(f);
  let flop = 0; for (const [a, b] of FLOP) if (f >= a && f < b) flop = Math.abs(Math.sin((f - a) * 0.7));
  if (c.at) return { x: c.at[0], y: (c.at[1] ?? GROUND - fishR(f)) - flop * 40, face: c.face, rot: (c.rot || 0) + flop * 0.5, puff: pf };
  if (c.hand) {
    if (S[c.hand].p.form !== 'big') return null;
    const h = C[c.hand].big.point(S[c.hand].st, 'handF');
    return { x: h[0] + (c.dx || 0), y: h[1] + (c.dy || 0), face: c.face, rot: c.rot || 0, puff: pf };
  }
  if (c.under) { const p = S[c.under].p; return { x: p.x, y: p.y + (c.dy || 0) - fishR(f) * 0.2, face: c.face || 1, rot: 0, puff: pf }; }
  if (c.path) {
    const k = c.path; let i = 0; while (i < k.length - 2 && f >= k[i + 1][0]) i++;
    const u = E.clamp((f - k[i][0]) / (k[i + 1][0] - k[i][0]), 0, 1);
    const x = E.lerp(k[i][1], k[i + 1][1], u), y = E.lerp(k[i][2], k[i + 1][2], u);
    return { x, y, face: k[i + 1][1] >= k[i][1] ? 1 : -1, rot: Math.atan2(k[i + 1][2] - k[i][2], Math.abs(k[i + 1][1] - k[i][1]) + 1) * 0.6, puff: pf };
  }
  const u = E.clamp((f - c.f0) / (c.f1 - c.f0), 0, 1), e = c.ease ? E.EASE[c.ease](u) : u;
  const a = P(c.a, c.f0, statesAt(c.f0)), b = P(c.b, f, S);
  return { x: E.lerp(a[0], b[0], e), y: E.lerp(a[1], b[1], e) - Math.sin(Math.PI * u) * (c.arc || 0), face: c.face, rot: u * (c.spin || 0), puff: pf };
}
const fishPt = (f) => { const q = fishAt(f, statesAt(f)); return [q.x, q.y]; };
function inflate(f, n = 6, to = 1) { PUFF.push([f, puffAt(f)], [f + n, to]); sfx('inflate', f, { x: 960, dur: n, gain: 0.7 }); sfx('pop', f + n, { x: 960, gain: 0.5 }); }
function deflate(f, n = 10) { PUFF.push([f, puffAt(f)], [f + n, 0]); sfx('deflate', f, { x: 960, dur: n, gain: 0.6 }); }
function ouch(who, f, at, size = 1) { OUCH.push({ f, at, size }); sfx('hurt', f, { who, gain: 1.0 }); sfx('flick', f, { who, gain: 0.6 }); }
// прыжок шарика из точки в точку
function hopTo(who, f0, f1, x0, y0, x1, y1, h, o = {}) {
  const mid = Math.round((f0 + f1) / 2);
  key(who, f0, { sx: 1.2, sy: 0.82 }, o.prep ?? 3);
  move(who, f0, { x: x0, y: y0 });
  key(who, f0 + 2, { sx: 0.86, sy: 1.16 }, 2);
  move(who, mid, { y: Math.min(y0, y1) - h }, 'out2');
  key(who, mid, { sx: 1, sy: 1 }, 3);
  move(who, f1, { y: y1 }, 'in2');
  move(who, f1, { x: x1 }, 'lin');
  if (o.land !== false) { key(who, f1, { sx: 1.25, sy: 0.78 }, 1); key(who, f1 + 3, { sx: 0.94, sy: 1.07 }, 3); key(who, f1 + 7, { sx: 1, sy: 1 }, 4); sfx('land', f1, { who, gain: 0.5 }); }
  sfx('jump', f0 + 2, { who, gain: 0.55 });
}
const LATE = [];

const YX0 = 470, RX0 = 1450, GO = 54;
// ================================================================== 0–2.2 с: считалка, оба стоят
key('yel', 0, { form: 'small', x: YX0, y: GROUND, face: 1, look: 1, eyes: 'normal', mouth: 'smile normal', sx: 1, sy: 1, rot: 0, pivot: 0, alpha: 1 }, 0);
key('rb', 0, { form: 'small', x: RX0, y: GROUND, face: -1, look: 1, eyes: 'normal', mouth: 'smile normal', sx: 1, sy: 1, rot: 0, pivot: 0, alpha: 1 }, 0);

const BIG = () => {
  // ---- 2.2–4 с: иглобрюх шлёпается — Радужный отбивает его головой — колется Жёлтой в макушку
  const FX0 = 1180;
  FISH.push({ f0: GO, f1: GO + 8, a: [FX0, -150], b: [FX0, GROUND - 46], ease: 'in2', face: -1 }, { f0: GO + 8, at: [FX0], face: -1 });
  FLOP.push([GO + 8, GO + 22]);
  sfx('whoosh', GO, { x: FX0, dur: 8, gain: 0.5 }); sfx('splash', GO + 8, { x: FX0, gain: 0.6 });
  for (let f = GO + 10; f < GO + 22; f += 5) sfx('squish', f, { x: FX0, gain: 0.35, pitch: 1.4 });
  key('yel', GO + 3, { mouth: 'puzzlement' }, 0); key('rb', GO + 3, { mouth: 'puzzlement' }, 0);
  key('rb', GO + 8, { mouth: 'happy with theeth', eyes: 'angry' }, 0);
  sfx('ref:grin-eee', GO + 8, { who: 'rb', gain: 0.4, pitch: 0.9 });
  const HB = GO + 18;
  hopTo('rb', GO + 9, HB, RX0, GROUND, FX0 + 120, GROUND, 40);
  key('rb', HB, { sx: 0.8, sy: 1.22 }, 1); key('rb', HB + 4, { sx: 1, sy: 1 }, 3);
  sfx('bonk', HB, { who: 'rb', gain: 0.7 });
  const TOP = HB + 14;
  FISH.push({ f0: HB, f1: TOP, a: [FX0, GROUND - 46], b: (f, S) => { const t = target('yel:top', S); return [t[0], t[1] - fishR(f) + 20]; }, arc: 260, spin: -3, face: -1 });
  inflate(HB + 4, 8, 1);
  sfx('whoosh', HB, { x: 900, dur: 14, gain: 0.5 });
  key('yel', TOP - 6, { look: 1, mouth: 'puzzlement', eyes: 'sad' }, 0);
  ouch('yel', TOP, (f, S) => target('yel:top', S), 1.1);
  // Жёлтая подпрыгивает от укола
  key('yel', TOP, { sx: 0.8, sy: 1.25 }, 1);
  move('yel', TOP, { x: YX0, y: GROUND }); move('yel', TOP + 7, { y: GROUND - 260 }, 'out2'); move('yel', TOP + 14, { y: GROUND }, 'in2');
  key('yel', TOP + 14, { sx: 1.25, sy: 0.8 }, 1); key('yel', TOP + 18, { sx: 1, sy: 1 }, 3);
  sfx('land', TOP + 14, { who: 'yel', gain: 0.6 });
  ev('stars', { who: 'yel', f0: TOP + 14, f1: TOP + 22 });
  const FL1 = 720;
  FISH.push({ f0: TOP, f1: TOP + 12, a: (f, S) => fishPt(TOP - 1), b: [FL1, GROUND - fishR(TOP + 12)], arc: 120, spin: 2, face: 1 }, { f0: TOP + 12, at: [FL1], face: 1 });
  deflate(TOP + 14, 10);
  FLOP.push([TOP + 24, TOP + 40]);
  key('rb', HB + 8, { mouth: 'happy with theeth', eyes: 'normal' }, 0);
  sfx('ref:laugh', HB + 10, { who: 'rb', gain: 0.85, pitch: 0.9 });
  laugh('rb', HB + 12, HB + 36);

  // ---- 4–5.2 с: Жёлтая «растёт» — Радужный влюблён
  const YX = 520;
  key('yel', TOP + 10, { eyes: 'angry', mouth: 'angry theeth' }, 0);
  const YB = transform('yel', TOP + 12, YX0, YX, 1, { style: 'grow', love: 'rb', loveDur: 60 });
  key('yel', YB, stance('yel', YX, 1), 0);
  key('yel', YB + 4, { mouth: 'theeth smile', eyes: 'normal' }, 0);

  // ---- 5.3–9 с: поднимает рыбу — влюблённый Радужный тянется поцеловаться — «бу!» — раздувается — «ай-ай!»
  const GR = YB + 8;
  key('yel', GR - 5, { lean: 30, hip: [0, ST.toRig('yel', 200)], head: 8 }, 5);
  key('yel', GR, { hitF: 1, hitFto: [FL1 - 30, GROUND - 40], hitFfix: GR }, 4);
  FISH.push({ f0: GR, hand: 'yel', dx: 60, dy: 10, face: 1 });
  FISH.push({ f0: GR + 8, hand: 'yel', dx: 150, dy: 30, face: 1 });
  sfx('squish', GR, { who: 'yel', gain: 0.4 });
  key('yel', GR + 8, { ...stance('yel', YX, 1), hitF: 0, handF: hand('yel', 'F', 0.95, 0.1), mouth: 'theeth smile', eyes: 'angry' }, 8);
  const RX1 = 900;
  hopTo('rb', YB + 4, YB + 13, FX0 + 120, GROUND, 1100, GROUND, 70);
  hopTo('rb', YB + 14, YB + 23, 1100, GROUND, RX1, GROUND, 70);
  ev('hearts', { who: 'rb', f0: YB + 23, f1: YB + 50, snd: false });
  // целует — вытягивается к рыбе
  const KS = YB + 26;
  key('rb', KS, { sx: 0.88, sy: 1.15, mouth: 'happy - spittle' }, 4);
  sfx('kiss', KS + 2, { who: 'rb', gain: 0.7 });
  move('rb', KS, { x: RX1 }); move('rb', KS + 6, { x: RX1 - 30, y: GROUND - 40 }, 'out2');
  const BOO = KS + 4;
  key('yel', BOO, { head: 10, mouth: 'angry theeth' }, 2);
  sfx('ref:grin-hit', BOO, { who: 'yel', gain: 0.8 });
  inflate(BOO + 2, 5, 1);
  const PR = BOO + 6;
  ouch('rb', PR, (f, S) => target('rb:face', S), 1.1);
  key('rb', PR, { sx: 1, sy: 1, mouth: 'puzzlement', eyes: 'sad' }, 1);
  // скачет «ай-ай!»
  let rx = RX1 - 30, hf = PR;
  for (const [h, nx] of [[300, 1080], [240, 1260], [180, 1420]]) {
    hopTo('rb', hf, hf + 12, rx, hf === PR ? GROUND - 40 : GROUND, nx, GROUND, h);
    sfx('hurt', hf + 6, { who: 'rb', gain: 0.6 }); rx = nx; hf += 13;
  }
  key('yel', PR + 4, { head: 0, mouth: 'happy with theeth', eyes: 'normal' }, 4);
  sfx('ref:laugh', PR + 6, { who: 'yel', gain: 0.85, pitch: 1.45 });
  chuckle('yel', PR + 6, PR + 40, { mouth: 'happy with theeth' });
  deflate(PR + 24, 10);
  // бросает сдутую рыбу на траву
  const DROP = PR + 34, FL2 = 1100;
  key('yel', DROP - 4, { handF: hand('yel', 'F', 0.1, -0.9) }, 4);
  key('yel', DROP, { handF: hand('yel', 'F', 0.9, 0.1), lean: 8 }, 3, 'in2');
  FISH.push({ f0: DROP, f1: DROP + 12, a: (f, S) => fishPt(DROP - 1), b: [FL2, GROUND - 46], arc: 140, spin: 4, face: -1 }, { f0: DROP + 12, at: [FL2], face: -1 });
  FLOP.push([DROP + 12, DROP + 26]);
  key('yel', DROP + 8, { ...stance('yel', YX, 1), lean: 0 }, 6);

  // ---- 9–13 с: Радужный «растёт», надувает рыбу, как шарик, — отпускает — она шлёпает Жёлтую по лицу
  key('rb', PR + 34, { eyes: 'angry', mouth: 'angry theeth' }, 0);
  const RX = 1450, RB = transform('rb', PR + 36, 1420, RX, -1, { style: 'grow' });
  key('rb', RB, stance('rb', RX, -1), 0);
  key('rb', RB + 4, { mouth: 'theeth smile', eyes: 'angry' }, 0);
  key('yel', RB - 2, { mouth: 'puzzlement', eyes: 'sad' }, 0);
  const RX2 = 1280;
  walk('rb', RB + 2, RX, RX2, 1, 10, -1);
  const PK = RB + 16;
  key('rb', PK - 5, { lean: 28, hip: [0, ST.toRig('rb', 170)], head: 6 }, 5);
  key('rb', PK, { hitF: 1, hitFto: [FL2 + 20, GROUND - 40], hitFfix: PK }, 4);
  FISH.push({ f0: PK, hand: 'rb', dx: -40, dy: -30, face: -1, rot: -1.3 });
  FISH.push({ f0: PK + 8, hand: 'rb', dx: -170, dy: -20, face: -1, rot: 0 });
  key('rb', PK + 8, { ...stance('rb', RX2, -1), hitF: 0, handF: hand('rb', 'F', 0.55, -0.62), mouth: 'puzzlement', head: -6 }, 8);
  // дует
  const BL0 = PK + 12, BL1 = BL0 + 18;
  for (let i = 0; i < 3; i++) { const f = BL0 + i * 6; key('rb', f, { sx: 1.03, sy: 0.98, head: -8 }, 4); key('rb', f + 4, { sx: 1, sy: 1, head: -4 }, 4); sfx('gust', f, { who: 'rb', dur: 6, gain: 0.5 }); }
  PUFF.push([BL0, 0], [BL1, 1.35]);
  sfx('inflate', BL0, { who: 'rb', dur: BL1 - BL0, gain: 0.8 });
  key('yel', BL0 + 6, { mouth: 'puzzlement', eyes: 'normal' }, 0);
  // отпускает — рыба носится по небу и шлёпает Жёлтую
  const REL = BL1 + 3, HIT = REL + 30;
  key('rb', REL, { handF: hand('rb', 'F', 0.75, -0.75), mouth: 'happy with theeth', head: 0 }, 3);
  const P0 = [RX2 - 140, GROUND - 600];
  const ZIP = { f0: REL, path: [[REL, ...P0], [REL + 5, 1100, 260], [REL + 10, 1500, 180], [REL + 15, 1300, 420], [REL + 21, 900, 150], [REL + 26, 700, 360], [HIT, YX + 90, GROUND - 600]] };
  FISH.push(ZIP);
  LATE.push(() => { const t = target('yel:face', ST.stateAt(HIT)); ZIP.path[6] = [HIT, t[0] + 40, t[1]]; });
  PUFF.push([REL, 1.35], [HIT, 0.25]);
  sfx('deflate', REL, { x: 1100, dur: 30, gain: 0.9 }); sfx('whoosh', REL + 4, { x: 1100, dur: 28, gain: 0.5 });
  key('yel', REL + 12, { look: 1, head: -10 }, 6); key('yel', REL + 24, { head: 6 }, 6);
  sfx('slap', HIT, { who: 'yel', gain: 1.0 }); ev('shake', { f: HIT, amp: 14, n: 8 });
  ev('stars', { who: 'yel', f0: HIT + 1, f1: HIT + 20, snd: false });
  key('yel', HIT, { lean: -18, head: -18, mouth: 'puzzlement', eyes: 'sad', handF: hand('yel', 'F', 0.4, -0.7), handB: hand('yel', 'B', -0.4, -0.6) }, 2);
  const FB = fallBack('yel', HIT + 4, YX, 1, { n: 14, stars: 24 });
  const FL3 = YX + 330;
  FISH.push({ f0: HIT, f1: HIT + 14, a: (f, S) => fishPt(HIT - 1), b: [FL3, GROUND - 46], arc: 160, spin: 3, face: -1 }, { f0: HIT + 14, at: [FL3], face: -1 });
  PUFF.push([HIT + 14, 0]);
  FLOP.push([HIT + 14, HIT + 26]);
  sfx('ref:laugh', HIT + 4, { who: 'rb', gain: 0.85, pitch: 0.75 });
  chuckle('rb', HIT + 4, HIT + 44, { mouth: 'happy with theeth' });
  const YBX = 330;
  const ysm = shrink('yel', FB + 6, YBX, 1, { mouth: 'puzzlement', eyes: 'sad', smoke: 420 });
  key('yel', ysm, { lean: 0, head: 0, hip: [0, 0], legF: null, legB: null, zB: null, rot: 0 }, 0);
  move('yel', ysm, { x: YBX, y: GROUND, rot: 0 });
  ev('stars', { who: 'yel', f0: ysm + 4, f1: ysm + 14, snd: false });

  // ---- 13–16.5 с: шарик-Жёлтая подкатывает рыбу Радужному под ногу — «ай!» — падает — «пуф»
  const RX3 = 1180;
  walk('rb', ysm + 2, RX2, RX3, 1, 10, -1);
  key('yel', ysm + 3, { eyes: 'angry', mouth: 'theeth smile' }, 0);
  const NB = ysm + 14;
  hopTo('yel', ysm + 5, NB, YBX, GROUND, FL3 - 150, GROUND, 80);
  key('yel', NB + 2, { sx: 1.25, sy: 0.82 }, 2); key('yel', NB + 5, { sx: 0.9, sy: 1.1 }, 2); key('yel', NB + 9, { sx: 1, sy: 1 }, 3);
  sfx('bonk', NB + 4, { who: 'yel', gain: 0.5 });
  const FOOT = RX3 - 200, UNDER = NB + 16;
  FISH.push({ f0: NB + 4, f1: UNDER, a: [FL3, GROUND - 46], b: [FOOT, GROUND - 46], spin: -8, face: -1 }, { f0: UNDER, at: [FOOT], face: -1 });
  sfx('slide', NB + 4, { x: 1000, gain: 0.4, pitch: 1.4 });
  // наступает — рыба раздувается — «ай!»
  const STEP = UNDER + 4;
  key('rb', STEP - 4, { legFfk: 1, legF: [-40, 10, 0], lean: 4 }, 4);
  inflate(STEP, 4, 0.75);
  ouch('rb', STEP + 4, [FOOT + 80, GROUND - 120], 1.2);
  key('rb', STEP + 4, { legFfk: 1, legF: [-70, 80, 0], lean: -10, head: -14, mouth: 'puzzlement', eyes: 'sad', handF: hand('rb', 'F', 0.5, -0.8), handB: hand('rb', 'B', -0.5, -0.7) }, 2);
  move('rb', STEP + 4, { x: RX3, y: GROUND }); move('rb', STEP + 10, { y: GROUND - 160 }, 'out2'); move('rb', STEP + 16, { y: GROUND }, 'in2');
  const FB2 = fallBack('rb', STEP + 16, RX3, -1, { n: 14, stars: 24 });
  key('yel', STEP + 8, { mouth: 'happy with theeth', eyes: 'normal' }, 0);
  sfx('ref:laugh', STEP + 8, { who: 'yel', gain: 0.85, pitch: 1.45 });
  laugh('yel', STEP + 10, STEP + 22);
  const RBX = 1560;
  const rsm = shrink('rb', FB2 + 6, RBX, -1, { mouth: 'puzzlement', eyes: 'sad', smoke: 420 });
  key('rb', rsm, { lean: 0, head: 0, hip: [0, 0], legF: null, legB: null, zB: null, rot: 0, legFfk: 0 }, 0);
  move('rb', rsm, { x: RBX, y: GROUND, rot: 0 });
  ev('stars', { who: 'rb', f0: rsm + 4, f1: rsm + 14, snd: false });
  deflate(STEP + 30, 10);
  const F2 = 1330;
  FISH.push({ f0: STEP + 34, f1: STEP + 46, a: [FOOT, GROUND - 46], b: [F2, GROUND - 46], arc: 80, spin: 2, face: 1 }, { f0: STEP + 46, at: [F2], face: 1 });
  FLOP.push([STEP + 46, STEP + 60]);

  // ---- 16.5–20 с: Жёлтая «растёт» снова; шарик-Радужный садится на рыбу — она уносит его в небо
  const YX2 = FL3 - 150, YB2 = transform('yel', STEP + 24, YX2, YX2 + 40, 1, { style: 'grow' });
  key('yel', YB2, stance('yel', YX2 + 40, 1), 0);
  key('yel', YB2 + 4, { mouth: 'happy with theeth', eyes: 'normal' }, 0);
  key('rb', rsm + 6, { face: -1, mouth: 'puzzlement' }, 0);
  const SIT = rsm + 12;
  hopTo('rb', rsm + 3, SIT, RBX, GROUND, F2, GROUND - 70, 100, { land: false });
  key('rb', SIT, { sx: 1.25, sy: 0.8 }, 1); key('rb', SIT + 4, { sx: 1, sy: 1 }, 3);
  inflate(SIT + 2, 6, 1.3);
  ouch('rb', SIT + 4, [F2, GROUND - 120], 1.0);
  key('rb', SIT + 4, { mouth: 'puzzlement', eyes: 'sad' }, 0);
  const UP = SIT + 10, GONE = UP + 58;
  FISH.push({ f0: SIT, at: [F2, GROUND - fishR(SIT + 8)], face: -1 }, { f0: UP, f1: GONE, a: [F2, GROUND - 150], b: [F2 + 200, -400], face: -1, ease: 'in' });
  LATE.push(() => { for (let f = SIT + 6; f <= GONE; f++) { const q = fishAt(f, ST.stateAt(f)); move('rb', f, { x: q.x, y: q.y - fishR(f) * 0.6 }, 'lin'); } });
  for (let f = UP; f < GONE; f += 8) key('rb', f, { rot: f % 16 < 8 ? 8 : -8, pivot: ST.CAST.rb.pivot }, 4);
  sfx('scared', UP + 2, { who: 'rb', gain: 0.8 }); sfx('whoosh', UP, { x: F2, dur: 40, gain: 0.5 });
  ev('twinkle', { f: GONE - 6, at: [F2 + 180, 110], n: 22, size: 56 });
  key('yel', UP + 4, { look: 1, head: -12 }, 6);
  sfx('ref:laugh', UP + 8, { who: 'yel', gain: 0.85, pitch: 1.45 });
  chuckle('yel', UP + 8, UP + 38, { mouth: 'happy with theeth' });

  // ---- 20–25 с: в центр, руки вверх
  const WIN = victory('yel', UP + 40, YX2 + 40, { n: 9, stride: 70 });
  FISH.sort((a, b) => a.f0 - b.f0);
  for (const fn of LATE) fn();
  window.T = { HB, TOP, YB, GR, KS, PR, DROP, RB, BL0, REL, HIT, ysm, NB, STEP, rsm, YB2, SIT, UP, WIN };
};

// ------------------------------------------------------------------ рисование
const t0 = (f) => f / FPS;
const fishFront = (f) => { const c = segAt(FISH, f); return c && (c.hand || c.path || (c.f1 && c.arc)); };
function drawFish(ctx, f, S) { const q = fishAt(f, S); if (q) FX.mcPuffer(ctx, q.x, q.y, PS, Math.max(0, q.puff), q.face, q.rot, t0(f)); }
ST.hooks.beforeChars.push((ctx, f, S, CAM) => { ctx.setTransform(...CAM); if (!fishFront(f)) drawFish(ctx, f, S); });
ST.hooks.afterChars.push((ctx, f, S, CAM) => {
  ctx.setTransform(...CAM);
  if (fishFront(f)) drawFish(ctx, f, S);
  for (const o of OUCH) { const at = P(o.at, o.f, statesAt(o.f)); FX.prickle(ctx, at[0], at[1], (f - o.f) / 12, o.size); }
});

ST.start(BIG);
