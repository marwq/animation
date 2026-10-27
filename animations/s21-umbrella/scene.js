// Серия 2, ролик 21: Зонтик — Розовая (слева) против Жёлтой (справа), 22 с, 24 кадра/с. Драка без ударов:
// тучка с дождём ходит за одной, у другой — зонтик; перевёрнутый зонтик — ведро воды.
// Музыка превращения — один раз. Фон — джунгли.
//
//   0–2 с     шарик-Розовая и шарик-Жёлтая неподвижно стоят друг напротив друга, середина пустая
//   2–4 с     Жёлтая наколдовывает тучку над Розовой — дождь; у Жёлтой зонтик, она смеётся
//   3.6–4.7 с Розовая «растёт» под музыку — тучка над ней поднимается
//   4.8–8.5 с отнимает зонтик, переворачивает под тучку — набирает воды — выливает на Жёлтую
//   8.5–12.4 с Жёлтая «растёт», дует — зонтик улетает, тучка бьёт Розовую молнией — сажа — падает — «пуф»
//   12.4–15.8 с шарик-Розовая прыгает на ручку перевёрнутого зонтика с водой — вода Жёлтой в лицо — поскальзывается — «пуф»;
//             тучка переходит к шарику-Жёлтой, та удирает
//   16–22 с   Розовая «растёт» и в центре, руки вверх
'use strict';

const ST = Stage({
  name: '21 Розовая vs Жёлтая',
  frames: 528,
  cast: {
    pink: { small: ['girl-verity-small', { bodyHeight: 300 }], big: ['girl-verity-big', { height: 730, splitFeet: true }],
      pivot: 337, voice: 1.35, vAngle: 50, lie: 55, color: '#ff4fc8', moods: { angry: 'angry theeth', grin: 'theeth smile', big: 'theeth smile' } },
    yel: { small: ['girl-verity-small', { bodyHeight: 300, recolor: 'yellow' }],
      big: ['verity-big-girl', { height: 730, splitFeet: true, recolor: 'yellow' }], pivot: 337, voice: 1.45, vAngle: 50, lie: 55,
      color: '#ffe23a', moods: { angry: 'angry theeth', grin: 'theeth smile', big: 'theeth smile' } },
  },
  order: ['pink', 'yel'],
  background: { theme: 'jungle', seed: 1021, sunX: 1500, sunY: 130 },
  clouds: [[150, 80, 2.4, 0, 12], [700, 220, 1.8, 1, 16], [1150, 70, 2.6, 2, 10], [1720, 250, 1.5, 0, 18]],
});
const { FPS, NF, GROUND, C, key, move, ev, sfx, hop, laugh, tremble, transform, shrink, stance, walk,
  slip, fallBack, victory, chuckle, hand, statesAt, target } = ST;
const P = (v, f, S) => (typeof v === 'function' ? v(f, S) : typeof v === 'string' ? target(v, S) : v);

// ------------------------------------------------------------------ тучка, дождь, зонтик
const US = 330;
const CL = [];            // ключи тучки: [f, x, y] (между ключами — плавно); до первого ключа тучки нет
let CL_GONE = 1e9;
const RAIN = [];          // {f0, f1, to: (f, S) => y}
const BOLT = [];          // {f, to}
const UMB = [];           // {f0, ball} | {f0, hand, rot} | {f0, at, rot} | {f0, f1, a, b, arc, rot0, rot1} | {f0, tip: [ax, f1, rot0, rot1]}
const FILL = [];          // [f, v]
const POUR = [];          // {f0, f1, b} — вода льётся из зонтика в точку
const SPL = [];           // {f, at, size}
const PUD = [];           // {f0, f1, x, w}
const SOOT = [];          // {who, f0, f1}
function cloudAt(f) {
  CL.sort((a, b) => a[0] - b[0]);
  if (!CL.length || f < CL[0][0] || f >= CL_GONE) return null;
  let i = 0; while (i < CL.length - 1 && f >= CL[i + 1][0]) i++;
  if (i === CL.length - 1) return [CL[i][1], CL[i][2] + Math.sin(f * 0.15) * 6];
  const u = E.EASE.io((f - CL[i][0]) / (CL[i + 1][0] - CL[i][0]));
  return [E.lerp(CL[i][1], CL[i + 1][1], u), E.lerp(CL[i][2], CL[i + 1][2], u) + Math.sin(f * 0.15) * 6];
}
function segAt(segs, f) { let c = null; for (const s of segs) if (f >= s.f0) c = s; return c && !c.gone ? c : null; }
const rot2 = (v, a) => [v[0] * Math.cos(a) - v[1] * Math.sin(a), v[0] * Math.sin(a) + v[1] * Math.cos(a)];
function umbAt(f, S) {
  const c = segAt(UMB, f);
  if (!c) return null;
  if (c.ball) { const p = S[c.ball].p; return { x: p.x - p.face * 50, y: p.y - 30, rot: -p.face * 0.1 }; }
  if (c.hand) { if (S[c.hand].p.form !== 'big') return null; const h = C[c.hand].big.point(S[c.hand].st, 'handF'); return { x: h[0], y: h[1], rot: typeof c.rot === 'function' ? c.rot(f) : c.rot }; }
  if (c.at) return { x: c.at[0], y: c.at[1], rot: c.rot };
  if (c.tip) {      // наклоняется вокруг купола, лежащего на земле
    const [ax, f1, r0, r1] = c.tip, u = E.EASE.in2(E.clamp((f - c.f0) / (f1 - c.f0), 0, 1)), r = E.lerp(r0, r1, u);
    const d = rot2([0, -US * 1.08], r);
    return { x: ax - d[0], y: GROUND - 6 - d[1], rot: r };
  }
  const u = E.clamp((f - c.f0) / (c.f1 - c.f0), 0, 1), e = c.ease ? E.EASE[c.ease](u) : u;
  const a = P(c.a, c.f0, statesAt(c.f0)), b = P(c.b, f, S);
  return { x: E.lerp(a[0], b[0], e), y: E.lerp(a[1], b[1], e) - Math.sin(Math.PI * u) * (c.arc || 0), rot: E.lerp(c.rot0, c.rot1, e) };
}
const umbTop = (u) => { const d = rot2([0, -US * 1.0], u.rot); return [u.x + d[0], u.y + d[1]]; };
const umbRim = (u) => { const d = rot2([0, -US * 0.72], u.rot); return [u.x + d[0], u.y + d[1]]; };
const fillAt = (f) => { let v = 0; for (let i = 0; i < FILL.length; i++) { const [a, x] = FILL[i]; if (f < a) { if (i) { const [pa, px] = FILL[i - 1]; return E.lerp(px, x, (f - pa) / (a - pa)); } return 0; } v = x; } return v; };
function rain(f0, f1, to, gain = 0.6) { RAIN.push({ f0, f1, to }); sfx('rain', f0, { x: 960, dur: f1 - f0, gain }); }
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

const PX0 = 560, YX0 = 1360;
// ================================================================== 0–2 с: неподвижная стойка
key('pink', 0, { form: 'small', x: PX0, y: GROUND, face: 1, look: 1, eyes: 'normal', mouth: 'smile normal', sx: 1, sy: 1, rot: 0, pivot: 0, alpha: 1 }, 0);
key('yel', 0, { form: 'small', x: YX0, y: GROUND, face: -1, look: 1, eyes: 'normal', mouth: 'smile normal', sx: 1, sy: 1, rot: 0, pivot: 0, alpha: 1 }, 0);

const BIG = () => {
  // ---- 2–4 с: тучка над Розовой — дождь; у Жёлтой зонтик
  key('yel', 48, { mouth: 'theeth smile', eyes: 'angry' }, 0);
  sfx('ref:grin-eee', 48, { who: 'yel', gain: 0.4, pitch: 1.45 });
  key('yel', 50, { sx: 1.1, sy: 0.9 }, 2); key('yel', 54, { sx: 1, sy: 1 }, 3);
  ev('smoke', { f: 52, who: 'pink', size: 360, y: 230, dx: 0 });
  sfx('poof', 52, { x: PX0, gain: 0.6 }); sfx('creak', 54, { x: PX0, dur: 8, gain: 0.3 });
  CL.push([54, PX0, 240]);
  const R1 = 58;
  rain(R1, 96, () => GROUND);
  key('pink', R1 + 2, { mouth: 'puzzlement', eyes: 'sad' }, 0);
  ev('wet', { who: 'pink', f0: R1 + 4, f1: 110 });
  tremble('pink', R1 + 6, 82, PX0, 3);
  sfx('sob', R1 + 8, { who: 'pink', dur: 14, gain: 0.5 });
  // зонтик Жёлтой
  ev('smoke', { f: 58, who: 'yel', size: 220, y: GROUND - 300, dx: -60 });
  sfx('pop', 60, { who: 'yel', gain: 0.7 });
  UMB.push({ f0: 60, ball: 'yel' });
  key('yel', 62, { mouth: 'happy with theeth', eyes: 'normal' }, 0);
  sfx('ref:laugh', 64, { who: 'yel', gain: 0.85, pitch: 1.45 });
  laugh('yel', 64, 86);

  // ---- 3.6–4.7 с: Розовая «растёт» — тучка поднимается
  const PX = 600;
  key('pink', 82, { eyes: 'angry', mouth: 'angry theeth' }, 0);
  const PB = transform('pink', 84, PX0, PX, 1, { style: 'grow' });
  CL.push([PB - 6, PX0, 240], [PB + 4, PX + 20, 40]);
  rain(PB, PB + 22, (f, S) => target('pink:top', S)[1] + 10, 0.5);
  key('pink', PB, stance('pink', PX, 1), 0);
  key('pink', PB + 4, { mouth: 'theeth smile', eyes: 'angry' }, 0);
  key('yel', PB - 2, { mouth: 'puzzlement', eyes: 'sad' }, 0);

  // ---- 4.8–8.5 с: отнимает зонтик — наполняет водой — выливает на Жёлтую
  const PX1 = 1150;
  walk('pink', PB + 6, PX, PX1, 3, 9, 1);
  CL.push([PB + 6, PX + 20, 40], [PB + 33, PX1 + 20, 40]);
  rain(PB + 22, PB + 33, (f, S) => target('pink:top', S)[1] + 10, 0.4);
  const GR = PB + 38;
  key('pink', GR - 5, { lean: 26, hip: [0, ST.toRig('pink', 140)], head: 6 }, 5);
  key('pink', GR, { hitF: 1, hitFto: [YX0 + 50, GROUND - 60], hitFfix: GR }, 4);
  UMB.push({ f0: GR, hand: 'pink', rot: (f) => E.lerp(0, Math.PI, E.clamp((f - GR - 4) / 8, 0, 1)) });
  sfx('pop', GR, { who: 'pink', gain: 0.5 }); sfx('swing', GR + 4, { who: 'pink', gain: 0.6 });
  key('yel', GR + 2, { mouth: 'puzzlement', eyes: 'sad', sx: 1.1, sy: 0.9 }, 2); key('yel', GR + 6, { sx: 1, sy: 1 }, 3);
  key('pink', GR + 8, { ...stance('pink', PX1, 1), hitF: 0, handF: hand('pink', 'F', 0.75, -0.1), mouth: 'theeth smile', eyes: 'angry' }, 8);
  // отступает и набирает воду из тучки
  const PX2 = 870;
  walk('pink', GR + 8, PX1, PX2, 2, 8, 1, false);
  key('pink', GR + 26, { handF: hand('pink', 'F', 0.85, -0.45) }, 4);
  const F0 = GR + 26, F1 = F0 + 22;
  CL.push([GR + 4, PX1 + 20, 40], [F0, PX2 + 230, 40]);
  rain(F0, F1, (f, S) => { const u = umbAt(f, S); return umbRim(u)[1]; }, 0.6);
  FILL.push([F0 + 4, 0], [F1, 1]);
  for (let f = F0 + 6; f < F1; f += 6) sfx('drip', f, { x: PX1, gain: 0.5 });
  key('yel', F0 + 4, { mouth: 'puzzlement', eyes: 'normal' }, 0);
  // выливает
  const PO = F1 + 10, PE = PO + 10;
  walk('pink', F1, PX2, PX1 - 60, 1, 9, 1, false);
  key('pink', PO - 4, { handF: hand('pink', 'F', 0.85, -0.5), lean: 10 }, 4);
  UMB.push({ f0: PO, hand: 'pink', rot: (f) => E.lerp(Math.PI, Math.PI * 0.42, E.EASE.out2(E.clamp((f - PO) / 6, 0, 1))) });
  FILL.push([PO + 2, 1], [PE, 0]);
  POUR.push({ f0: PO + 2, f1: PE, b: (f, S) => target('yel:top', S) });
  sfx('splash', PO + 4, { who: 'yel', gain: 1.0 }); sfx('splash', PO + 8, { who: 'yel', gain: 0.6 });
  SPL.push({ f: PO + 6, at: [YX0, GROUND - 260], size: 1.2 });
  PUD.push({ f0: PO + 6, f1: 0, x: YX0, w: 360 });
  ev('wet', { who: 'yel', f0: PO + 6, f1: PO + 50 });
  key('yel', PO + 6, { sx: 1.35, sy: 0.75, mouth: 'puzzlement', eyes: 'sad' }, 2); key('yel', PO + 12, { sx: 1, sy: 1 }, 5);
  tremble('yel', PO + 12, PO + 34, YX0, 3);
  key('pink', PE + 2, { mouth: 'happy with theeth', eyes: 'normal' }, 0);
  sfx('ref:laugh', PE + 2, { who: 'pink', gain: 0.85, pitch: 1.35 });
  chuckle('pink', PE + 2, PE + 24, { mouth: 'happy with theeth' });
  // держит зонтик сбоку
  key('pink', PE + 4, { handF: hand('pink', 'F', 0.6, 0.15), lean: 0 }, 6);
  UMB.push({ f0: PE + 4, hand: 'pink', rot: (f) => E.lerp(Math.PI * 0.42, 0.3, E.clamp((f - PE - 4) / 6, 0, 1)) });
  CL.push([PE, PX2 + 230, 40], [PE + 12, PX1 - 60, 40]);

  // ---- 8.5–12.4 с: Жёлтая «растёт», дует — зонтик улетает, молния в Розовую — «пуф»
  key('yel', PO + 30, { eyes: 'angry', mouth: 'angry theeth' }, 0);
  const YX = 1680;
  const YB = transform('yel', PO + 32, YX0, YX, -1, { style: 'grow' });
  key('yel', YB, stance('yel', YX, -1), 0);
  const BL = YB + 10;
  key('yel', BL - 6, { mouth: 'puzzlement', eyes: 'angry', lean: -10, head: -8, sx: 1.04, sy: 0.97 }, 6);
  key('yel', BL, { lean: 8, head: 6, sx: 1, sy: 1 }, 3);
  ev('wind', { f0: BL, f1: BL + 20, x0: YX - 120, x1: PX1 - 360 });
  key('pink', BL + 4, { lean: -16, head: -12, mouth: 'puzzlement', eyes: 'sad' }, 4);
  const FLY = BL + 6, ULX = 1250;
  UMB.push({ f0: FLY, f1: FLY + 16, a: (f, S) => { const u = umbAt(FLY - 1, statesAt(FLY - 1)); return [u.x, u.y]; }, b: [ULX, GROUND - 6 - US * 1.08], arc: 260, rot0: 0.3, rot1: -Math.PI * 3 },
    { f0: FLY + 16, at: [ULX, GROUND - 6 - US * 1.08], rot: Math.PI });
  sfx('whoosh', FLY, { x: PX1, dur: 14, gain: 0.6 }); sfx('land', FLY + 16, { x: ULX, gain: 0.4, pitch: 1.2 });
  key('pink', FLY + 2, { handF: hand('pink', 'F', 0.4, -0.3) }, 4);
  // молния
  const ZAP = FLY + 12;
  CL.push([FLY, PX1 - 60, 40], [ZAP - 4, PX1 - 80, 50]);
  BOLT.push({ f: ZAP, to: 'pink:top' });
  sfx('zap', ZAP, { who: 'pink', gain: 1.0 }); ev('flash', { f: ZAP, who: 'pink', strength: 0.4 }); ev('shake', { f: ZAP, amp: 14, n: 8 });
  SOOT.push({ who: 'pink', f0: ZAP + 1, f1: 0 });
  key('pink', ZAP + 1, { mouth: 'puzzlement', eyes: 'sad', lean: 0, head: 0, handF: hand('pink', 'F', 0.6, -0.9), handB: hand('pink', 'B', -0.6, -0.9) }, 1);
  tremble('pink', ZAP + 1, ZAP + 12, PX1 - 60, 6);
  key('yel', ZAP + 2, { mouth: 'happy with theeth', eyes: 'normal', lean: 0, head: 0 }, 4);
  sfx('ref:laugh', ZAP + 4, { who: 'yel', gain: 0.85, pitch: 1.45 });
  chuckle('yel', ZAP + 4, ZAP + 40, { mouth: 'happy with theeth' });
  const FB = fallBack('pink', ZAP + 12, PX1 - 60, 1, { n: 14, stars: 24 });
  const PBX = 860;
  const psm = shrink('pink', FB + 6, PBX, 1, { mouth: 'puzzlement', eyes: 'sad', smoke: 420 });
  key('pink', psm, { lean: 0, head: 0, hip: [0, 0], legF: null, legB: null, zB: null, rot: 0 }, 0);
  move('pink', psm, { x: PBX, y: GROUND, rot: 0 });
  SOOT[0].f1 = psm;
  SOOT.push({ who: 'pink', f0: psm, f1: psm + 40 });
  ev('stars', { who: 'pink', f0: psm + 4, f1: psm + 14, snd: false });
  // зонтик лежит вверх ногами — в него капает дождь
  CL.push([FB, PX1 - 80, 50], [FB + 14, ULX, 90]);
  rain(FB + 14, psm + 20, () => GROUND - 60, 0.4);
  FILL.push([FB + 14, 0], [psm + 20, 1]);

  // ---- 12.4–15.8 с: шарик-Розовая прыгает на ручку — вода Жёлтой в лицо — поскальзывается — «пуф»
  key('pink', psm + 6, { eyes: 'angry', mouth: 'angry theeth' }, 0);
  const HTOP = GROUND - 6 - US * 1.08 + 30, ON = psm + 20;
  hopTo('pink', psm + 8, ON, PBX, GROUND, ULX - 20, HTOP - 10, 140, { land: false });
  key('pink', ON, { sx: 1.35, sy: 0.72 }, 1);
  sfx('land', ON, { who: 'pink', gain: 0.6 });
  const TIP = ON + 8;
  UMB.push({ f0: ON, tip: [ULX, TIP, Math.PI, Math.PI * 1.18] });
  sfx('creak', ON, { x: ULX, dur: 8, gain: 0.5 });
  LATE.push(() => { for (let f = ON + 1; f <= TIP; f++) { const u = umbAt(f, ST.stateAt(f)); move('pink', f, { x: u.x - 20, y: u.y - 10 }, 'lin'); } });
  FILL.push([TIP, 1], [TIP + 8, 0]);
  POUR.push({ f0: TIP, f1: TIP + 8, b: (f, S) => target('yel:face', S) });
  sfx('splash', TIP + 4, { who: 'yel', gain: 1.0 });
  SPL.push({ f: TIP + 6, at: [YX - 40, GROUND - 600], size: 1.4 });
  CL.push([TIP, ULX, 90], [TIP + 10, YX - 60, 60]);
  key('yel', TIP + 6, { lean: -16, head: -16, mouth: 'puzzlement', eyes: 'sad', handF: hand('yel', 'F', 0.4, -0.7), handB: hand('yel', 'B', -0.4, -0.6) }, 2);
  ev('wet', { who: 'yel', f0: TIP + 6, f1: TIP + 40 });
  PUD.push({ f0: TIP + 6, f1: 0, x: YX - 60, w: 380 });
  // Розовую подбрасывает, она — на землю
  const PX5 = 780;
  const G2 = (() => { const d = rot2([0, -US * 1.08], Math.PI * 1.18); return [ULX - d[0] - 20, GROUND - 16 - d[1]]; })();
  hopTo('pink', TIP, TIP + 16, G2[0], G2[1], PX5, GROUND, 160);
  key('pink', TIP + 14, { mouth: 'happy with theeth', eyes: 'normal' }, 0);
  sfx('ref:laugh', TIP + 14, { who: 'pink', gain: 0.85, pitch: 1.35 });
  laugh('pink', TIP + 16, TIP + 30);
  UMB.push({ f0: TIP + 8, at: (() => { const d = rot2([0, -US * 1.08], Math.PI * 1.18); return [ULX - d[0], GROUND - 6 - d[1]]; })(), rot: Math.PI * 1.18 });
  // Жёлтая — вслепую назад, скользит по луже
  const SL = TIP + 12;
  const LIE = ST.fallBack('yel', SL, YX, -1, { forward: true, n: 14, stars: 24 });
  sfx('slide', SL, { who: 'yel', gain: 0.5, pitch: 1.2 });
  rain(TIP + 10, LIE + 16, (f, S) => target('yel:top', S)[1] + 10, 0.5);
  const YBX = 1420;
  const ysm = shrink('yel', LIE + 6, YBX, -1, { mouth: 'puzzlement', eyes: 'sad', smoke: 420 });
  key('yel', ysm, { lean: 0, head: 0, hip: [0, 0], legF: null, legB: null, zB: null, rot: 0 }, 0);
  move('yel', ysm, { x: YBX, y: GROUND, rot: 0 });
  // тучка над шариком-Жёлтой — та удирает, тучка за ней
  CL.push([LIE, YX - 60, 60], [ysm + 4, YBX, 240]);
  rain(ysm + 4, ysm + 40, () => GROUND, 0.5);
  ev('wet', { who: 'yel', f0: ysm + 4, f1: ysm + 36 });
  key('yel', ysm + 8, { face: 1, mouth: 'puzzlement', eyes: 'sad' }, 0);
  sfx('scared', ysm + 8, { who: 'yel', gain: 0.6 });
  hop('yel', ysm + 10, ysm + 18, YBX, 1700, 80, { prep: 1 }); hop('yel', ysm + 18, ysm + 26, 1700, 1980, 80, { prep: 1 }); hop('yel', ysm + 26, ysm + 34, 1980, 2260, 80, { prep: 1 });
  CL.push([ysm + 12, YBX, 240], [ysm + 40, 2300, 240]);
  CL_GONE = ysm + 46;

  // ---- Розовая «растёт» — в центр
  const PB2 = transform('pink', TIP + 30, PX5, PX5 + 20, 1, { style: 'grow' });
  SOOT[1].f1 = PB2 - 4;
  key('pink', PB2, stance('pink', PX5 + 20, 1), 0);
  key('pink', PB2 + 4, { mouth: 'happy with theeth' }, 0);
  const WIN = victory('pink', PB2 + 6, PX5 + 20, { n: 9, stride: 90 });
  for (const fn of LATE) fn();
  window.T = { R1, PB, GR, F0, PO, YB, BL, FLY, ZAP, FB, psm, ON, TIP, SL, ysm, PB2, WIN };
};
const LATE = [];

// ------------------------------------------------------------------ рисование
ST.hooks.beforeChars.push((ctx, f, S, CAM) => {
  ctx.setTransform(...CAM);
  for (const p of PUD) if (f >= p.f0 && (!p.f1 || f < p.f1)) FX.puddle(ctx, p.x, GROUND + 8, p.w * Math.min(1, (f - p.f0 + 2) / 8), 1);
  const c = segAt(UMB, f);
  if (c && (c.at || c.tip || c.ball)) { const u = umbAt(f, S); FX.umbrella(ctx, u.x, u.y, US, u.rot, 1, fillAt(f)); }
});
ST.hooks.afterChars.push((ctx, f, S, CAM) => {
  ctx.setTransform(...CAM);
  const c = segAt(UMB, f);
  if (c && !(c.at || c.tip || c.ball)) { const u = umbAt(f, S); if (u) FX.umbrella(ctx, u.x, u.y, US, u.rot, 1, fillAt(f)); }
  for (const s of SOOT) {
    if (f < s.f0 || (s.f1 && f >= s.f1)) continue;
    const p = target(`${s.who}:face`, S), big = S[s.who].p.form === 'big';
    FX.soot(ctx, p[0], p[1], big ? 200 : 170, 1, 5);
  }
  for (const p of POUR) {
    if (f < p.f0 || f >= p.f1) continue;
    const u = umbAt(f, S), a = umbRim(u), b = P(p.b, f, S), r = FX.rng(f);
    for (let i = 0; i < 14; i++) {
      const k = (i / 14 + (f - p.f0) * 0.13) % 1;
      const x = E.lerp(a[0], b[0], k) + (r() - 0.5) * 30, y = E.lerp(a[1], b[1], k) - Math.sin(Math.PI * k) * 60;
      FX.puff(ctx, x, y, 16 + 10 * r(), 0.95, '#58b8ef', '#1b5e8c');
    }
  }
  for (const s of SPL) FX.waterSplash(ctx, s.at[0], s.at[1], (f - s.f) / 18, s.size, s.f);
  const cl = cloudAt(f);
  if (cl) {
    for (const r of RAIN) if (f >= r.f0 && f < r.f1) { const y1 = P(r.to, f, S); FX.rain(ctx, cl[0], cl[1] + 40, y1, 230, f / FPS, 1, 7); FX.rain(ctx, cl[0], cl[1] + 40, y1, 230, f / FPS + 0.37, 1, 19); }
    FX.rainCloud(ctx, cl[0], cl[1], 320);
    for (const b of BOLT) { const to = target(b.to, statesAt(b.f)); FX.lightning(ctx, cl[0], cl[1] + 40, to[0], to[1], (f - b.f) / 10, b.f); }
  }
});

ST.start(BIG);
