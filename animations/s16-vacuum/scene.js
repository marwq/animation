// Серия 2, ролик 16: Пылесос — Жёлтая (слева) против Скелета (справа), 22 с, 24 кадра/с. Драка без ударов:
// пылесос из блоков: насадка присасывается к лицу, всасывает, выдувает; мешок с пылью взрывается.
// Музыка превращения — один раз. Фон — саванна.
//
//   0–2 с     шарик-Жёлтая и шарик-Скелет неподвижно стоят друг напротив друга, середина пустая
//   2–4 с     с неба падает пылесос; Скелет прилетает на него и жмёт кнопку — насадка присасывается к Жёлтой
//   4–5.1 с   Жёлтая «растёт» под музыку — насадка отлетает, Скелет влюблён
//   5.5–8 с   она берёт насадку и всасывает Скелета — он висит на насадке, она им машет — и выдувает его
//   8.4–12 с  Скелет «растёт», жмёт кнопку на полную — насадка присасывается к её лицу — «пуф»
//   12.4–16 с шарик-Жёлтая прыгает на кнопку — мешок раздувается и лопает — Скелет весь в пыли, чихает — «пуф»
//   16–22 с   Жёлтая «растёт» и в центре, руки вверх
'use strict';

const ST = Stage({
  name: '16 Жёлтая vs Скелет',
  frames: 528,
  cast: {
    yel: { small: ['girl-verity-small', { bodyHeight: 300, recolor: 'yellow' }],
      big: ['verity-big-girl', { height: 730, splitFeet: true, recolor: 'yellow' }], pivot: 337, voice: 1.45, vAngle: 50, lie: 55,
      color: '#ffe23a', moods: { angry: 'angry theeth', grin: 'theeth smile', big: 'theeth smile' } },
    skel: { small: ['skeleton-verity-small', { scale: 0.455 }], big: ['skeleton-verity-big', { height: 730 }], pivot: 325,
      voice: 0.9, lie: 60, color: '#f3f1e6', moods: { angry: 'angry theeth', grin: 'happy with theeth', big: 'theeth smile' } },
  },
  order: ['skel', 'yel'],
  background: { theme: 'savanna', seed: 1016, sunX: 1500, sunY: 130 },
  clouds: [[150, 80, 2.4, 0, 12], [700, 220, 1.8, 1, 16], [1150, 70, 2.6, 2, 10], [1720, 250, 1.5, 0, 18]],
});
const { FPS, NF, GROUND, C, key, move, ev, sfx, hop, tumble, laugh, tremble, transform, shrink, stance, walk,
  victory, chuckle, hand, statesAt, target } = ST;
const P = (v, f, S) => (typeof v === 'function' ? v(f, S) : typeof v === 'string' ? target(v, S) : v);
function flap(f0, f1, gain = 0.6) {
  for (let f = f0; f < f1; f += 6) { key('skel', f, { b_B16: -30, b_B17: 30 }, 3); key('skel', f + 3, { b_B16: 46, b_B17: -46 }, 3, 'in'); }
  key('skel', f1, { b_B16: 0, b_B17: 0 }, 4);
  sfx('gust', f0, { who: 'skel', dur: f1 - f0, gain });
}

// ------------------------------------------------------------------ пылесос
const VX = 960, VS = 200, VTOP = GROUND - 200, BTN = [VX + 65, GROUND - 214], OUT = [VX - 150, GROUND - 87];
const VAC = { f0: 1e9, f1: 1e9, on: [], inf: [1e9, 1e9], gone: 1e9 };      // on: [f0, f1, 'suck'|'blow']
const NOZ = [];           // насадка: {f0, at, rot} | {f0, f1, a, b, arc, spin, rot0, rot1} | {f0, hand, rot} | {f0, on, rot, dx, dy}
const SOOT = [];          // {who, f0, f1, part, w, dy, seed}
const CLOUD = [];         // {f, at, size, dir}
const BURST = [];         // {f, at} — пылесос разлетается блоками
const vacMode = (f) => { for (const [a, b, m] of VAC.on) if (f >= a && f < b) return m; return null; };
function vacOn(f0, f1, mode = 'suck', gain = 0.6) { VAC.on.push([f0, f1, mode]); sfx('flick', f0, { x: VX, gain: 0.6 }); sfx('whirr', f0, { x: VX, dur: f1 - f0, gain }); if (mode === 'blow') sfx('gust', f0, { x: VX, dur: f1 - f0, gain: 0.7 }); }
const inflateAt = (f) => (f < VAC.inf[0] ? 1 : f >= VAC.inf[1] ? 1 : 1 + 0.4 * E.EASE.in2((f - VAC.inf[0]) / (VAC.inf[1] - VAC.inf[0])));
function vacY(f) { if (f < VAC.f0 || f >= VAC.gone) return null; if (f >= VAC.f1) return GROUND; return E.lerp(-300, GROUND, E.EASE.in2((f - VAC.f0) / (VAC.f1 - VAC.f0))); }
function nozAt(f, S) {
  let c = null;
  for (const s of NOZ) if (f >= s.f0) c = s;
  if (!c || c.gone) return null;
  if (c.at) return { x: c.at[0], y: c.at[1], rot: c.rot };
  if (c.hand) {
    const h = S[c.hand].p.form === 'big' ? C[c.hand].big.point(S[c.hand].st, 'handF') : target(`${c.hand}:face`, S);
    const r = typeof c.rot === 'function' ? c.rot(f, S) : c.rot;
    return { x: h[0] + Math.cos(r) * 80, y: h[1] + Math.sin(r) * 80, rot: r };
  }
  if (c.on) { const t = target(c.on, S); return { x: t[0] + (c.dx || 0), y: t[1] + (c.dy || 0), rot: c.rot }; }
  const u = E.clamp((f - c.f0) / (c.f1 - c.f0), 0, 1), e = c.ease ? E.EASE[c.ease](u) : u;
  const a = P(c.a, c.f0, statesAt(c.f0)), b = P(c.b, f, S);
  return { x: E.lerp(a[0], b[0], e), y: E.lerp(a[1], b[1], e) - Math.sin(Math.PI * u) * (c.arc || 0), rot: E.lerp(c.rot0, c.rot1, e) };
}
const nozPt = (f) => { const n = nozAt(f, statesAt(f)); return [n.x, n.y]; };
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

const YX0 = 560, SX0 = 1360;
// ================================================================== 0–2 с: неподвижная стойка
key('yel', 0, { form: 'small', x: YX0, y: GROUND, face: 1, look: 1, eyes: 'normal', mouth: 'smile normal', sx: 1, sy: 1, rot: 0, pivot: 0, alpha: 1 }, 0);
key('skel', 0, { form: 'small', x: SX0, y: GROUND, face: -1, look: 1, eyes: 'normal', mouth: 'smile normal', sx: 1, sy: 1, rot: 0, pivot: 0, alpha: 1 }, 0);

const LATER = [];         // то, что надо досчитать в самом конце (позиции по готовой анимации)
const BIG = () => {
  // ---- 2–4 с: пылесос с неба — Скелет прилетает на него — кнопка — насадка присасывается к Жёлтой
  VAC.f0 = 48; VAC.f1 = 55;
  const NL = [VX - 290, GROUND - 38];                  // насадка лежит, раструбом к Жёлтой
  NOZ.push({ f0: 48, f1: 55, a: [NL[0], -300], b: NL, rot0: Math.PI, rot1: Math.PI, ease: 'in2' }, { f0: 55, at: NL, rot: Math.PI });
  sfx('whoosh', 48, { x: VX, dur: 7, gain: 0.5 }); sfx('slam', 55, { x: VX, gain: 0.7 });
  ev('dust', { f: 55, x: VX, r: 90, n: 7, snd: false }); ev('shake', { f: 55, amp: 10, n: 6 });
  key('yel', 50, { mouth: 'puzzlement' }, 0); key('skel', 50, { mouth: 'puzzlement' }, 0);
  key('skel', 56, { mouth: 'happy with theeth', eyes: 'angry' }, 0);
  sfx('ref:grin-eee', 56, { who: 'skel', gain: 0.4, pitch: 0.9 });
  flap(56, 68, 0.6);
  move('skel', 56, { x: SX0, y: GROUND }); move('skel', 62, { x: VX + 150, y: GROUND - 380 }, 'out2');
  move('skel', 68, { x: VX + 40, y: VTOP }, 'in2');
  key('skel', 68, { sx: 1.25, sy: 0.8 }, 1); key('skel', 72, { sx: 1, sy: 1 }, 4);
  sfx('land', 68, { who: 'skel', gain: 0.6 });
  const ON1 = 69;
  // присосало!
  key('yel', ON1 + 2, { mouth: 'puzzlement', eyes: 'sad' }, 0);
  sfx('scared', ON1 + 3, { who: 'yel', gain: 0.6 });
  const YX1 = 620, STK = ON1 + 11;
  move('yel', ON1 + 2, { x: YX0 }); move('yel', STK, { x: YX1 }, 'in2');
  key('yel', ON1 + 3, { sx: 1.22, sy: 0.82, rot: 8, pivot: 0 }, 4);
  NOZ.push({ f0: STK - 3, f1: STK, a: NL, b: 'yel:face', rot0: Math.PI, rot1: Math.PI }, { f0: STK, on: 'yel:face', rot: Math.PI, dx: 25 });
  sfx('pop', STK, { who: 'yel', gain: 0.9 }); sfx('squish', STK, { who: 'yel', gain: 0.6 });
  key('yel', STK, { sx: 1.3, sy: 0.78, rot: 6 }, 1);
  for (let f = STK + 3, i = 0; f < STK + 15; f += 4, i++) key('yel', f, i % 2 ? { sx: 1.18, sy: 0.86 } : { sx: 1.3, sy: 0.78 }, 2);
  tremble('yel', STK + 2, STK + 15, YX1, 4);
  key('skel', ON1 + 6, { mouth: 'happy with theeth', eyes: 'normal' }, 0);
  sfx('ref:laugh', ON1 + 6, { who: 'skel', gain: 0.85 });
  laugh('skel', ON1 + 8, ON1 + 26);

  // ---- 4–5.1 с: Жёлтая «растёт» — насадка отлетает, Скелет влюблён
  const TF = STK + 14, YX = 640;
  key('yel', TF, { sx: 1, sy: 1, rot: 0 }, 3);
  const YB = transform('yel', TF, YX1, YX, 1, { style: 'grow', love: 'skel', loveDur: 48 });
  const OFF = TF + 18, NL2 = [VX - 230, GROUND - 38];
  vacOn(ON1, OFF, 'suck', 0.55);
  NOZ.push({ f0: OFF, f1: OFF + 10, a: (f, S) => nozPt(OFF - 1), b: NL2, arc: 120, rot0: Math.PI, rot1: Math.PI * 3 }, { f0: OFF + 10, at: NL2, rot: Math.PI });
  sfx('pop', OFF, { who: 'yel', gain: 0.8 }); sfx('land', OFF + 10, { x: NL2[0], gain: 0.4, pitch: 1.3 });
  key('yel', YB, stance('yel', YX, 1), 0);
  key('yel', YB + 4, { mouth: 'theeth smile', eyes: 'normal' }, 0);

  // ---- 5.5–8 с: берёт насадку — всасывает Скелета — машет им — выдувает
  const GRAB = YB + 12;
  key('yel', GRAB - 6, { lean: 26, hip: [0, ST.toRig('yel', 170)], head: 8 }, 6);
  key('yel', GRAB, { hitF: 1, hitFto: [NL2[0] - 30, NL2[1]], hitFfix: GRAB }, 4);
  const AIM = 0.42;
  NOZ.push({ f0: GRAB, hand: 'yel', rot: (f, S) => E.lerp(Math.PI, AIM, E.clamp((f - GRAB) / 8, 0, 1)) });
  sfx('pop', GRAB, { who: 'yel', gain: 0.4 });
  key('yel', GRAB + 8, { ...stance('yel', YX, 1), hitF: 0, handF: hand('yel', 'F', 0.85, -0.35), mouth: 'theeth smile', eyes: 'angry' }, 8);
  const ON2 = GRAB + 10, SK0 = ON2 + 3, SK1 = SK0 + 8;
  vacOn(ON2, SK1 + 30, 'suck', 0.6);
  key('skel', SK0, { pivot: ST.CAST.skel.pivot, sx: 0.85, sy: 1.15 }, 2);
  move('skel', SK0, { x: VX + 40, y: VTOP });
  sfx('scared', SK0, { who: 'skel', gain: 0.7 });
  // летит к насадке и висит на ней — позиции досчитаем в конце
  const BLOW = SK1 + 30;
  LATER.push(() => {
    for (let f = SK0 + 1; f <= BLOW; f++) {
      const S = ST.stateAt(f), n = nozAt(f, S), u = E.clamp((f - SK0) / (SK1 - SK0), 0, 1);
      const tx = n.x + Math.cos(n.rot) * 135, ty = n.y + Math.sin(n.rot) * 135 + 150;
      const x = f < SK1 ? E.lerp(VX + 40, tx, E.EASE.in2(u)) : tx, y = f < SK1 ? E.lerp(VTOP, ty, E.EASE.in2(u)) : ty;
      move('skel', f, { x, y }, 'lin');
    }
  });
  sfx('pop', SK1, { who: 'skel', gain: 0.9 }); sfx('squish', SK1, { who: 'skel', gain: 0.5 });
  key('skel', SK1, { sx: 1.25, sy: 0.82, mouth: 'puzzlement', eyes: 'sad' }, 1); key('skel', SK1 + 4, { sx: 1, sy: 1 }, 3);
  // машет вверх-вниз
  [[SK1 + 5, -0.75], [SK1 + 11, -0.05], [SK1 + 17, -0.75], [SK1 + 23, -0.15], [SK1 + 28, -0.4]].forEach(([f, dy], i) => {
    key('yel', f, { handF: hand('yel', 'F', 0.85, dy), lean: i % 2 ? 8 : -2 }, 5, 'io');
    if (i < 4) sfx('whoosh', f - 3, { who: 'yel', dur: 5, gain: 0.4 });
  });
  key('yel', SK1 + 4, { mouth: 'happy with theeth', eyes: 'normal' }, 0);
  sfx('ref:laugh', SK1 + 4, { who: 'yel', gain: 0.85, pitch: 1.45 });
  chuckle('yel', SK1 + 4, BLOW, { mouth: 'happy with theeth' });
  // выдувает
  vacOn(BLOW, BLOW + 12, 'blow', 0.6);
  const SX1 = 1540, LAND1 = BLOW + 16;
  LATER.push(() => {
    const S = ST.stateAt(BLOW), n = nozAt(BLOW, S);
    const x0 = n.x + Math.cos(n.rot) * 135, y0 = n.y + Math.sin(n.rot) * 135 + 150;
    move('skel', BLOW, { x: x0, y: y0, rot: 0 });
    move('skel', BLOW + 6, { y: y0 - 120 }, 'out2');
    move('skel', LAND1, { y: GROUND }, 'in2');
    move('skel', LAND1, { x: SX1, rot: 540 }, 'out2');
    key('skel', LAND1 + 1, { rot: 0, pivot: 0 }, 0);
  });
  key('skel', LAND1, { sx: 1.3, sy: 0.72 }, 1); key('skel', LAND1 + 5, { sx: 0.95, sy: 1.06 }, 3); key('skel', LAND1 + 9, { sx: 1, sy: 1 }, 3);
  sfx('whoosh', BLOW, { who: 'skel', dur: 14, gain: 0.6 }); sfx('fall', LAND1, { who: 'skel', gain: 0.8 });
  ev('dust', { f: LAND1, x: SX1, r: 50, n: 6, snd: false });
  ev('stars', { who: 'skel', f0: LAND1 + 2, f1: LAND1 + 12 });

  // ---- 8.4–12 с: Скелет «растёт», жмёт кнопку на полную — насадка ей на лицо — «пуф»
  key('skel', LAND1 + 6, { eyes: 'angry', mouth: 'angry theeth' }, 0);
  const SB = transform('skel', LAND1 + 8, SX1, 1480, -1, { style: 'grow' });
  key('skel', SB, stance('skel', 1480, -1), 0);
  key('skel', SB + 4, { mouth: 'theeth smile', eyes: 'angry' }, 0);
  const SX2 = VX + 300;
  walk('skel', SB + 4, 1480, SX2, 2, 9, -1);
  const PRESS = SB + 28;
  key('skel', PRESS - 6, { lean: 20, hip: [0, ST.toRig('skel', 60)], head: 6 }, 6);
  key('skel', PRESS, { hitF: 1, hitFto: BTN, hitFfix: PRESS }, 4);
  key('skel', PRESS + 8, { ...stance('skel', SX2, -1), hitF: 0, mouth: 'happy with theeth', eyes: 'normal' }, 8);
  key('yel', PRESS - 8, { mouth: 'puzzlement', eyes: 'normal', head: 0, lean: 0 }, 4);
  const HIT = PRESS + 6, POOF = HIT + 26;
  vacOn(PRESS + 1, POOF + 2, 'suck', 0.8);
  NOZ.push({ f0: HIT - 4, f1: HIT, a: (f, S) => nozPt(HIT - 5), b: 'yel:face', rot0: AIM, rot1: Math.PI }, { f0: HIT, on: 'yel:face', rot: Math.PI, dx: 30 });
  sfx('pop', HIT, { who: 'yel', gain: 1.0 }); sfx('squish', HIT, { who: 'yel', gain: 0.7 });
  key('yel', HIT, { lean: 14, head: 12, mouth: 'puzzlement', eyes: 'sad', handF: hand('yel', 'F', 0.55, -0.85), handB: hand('yel', 'B', 0.45, -0.85) }, 3);
  for (let f = HIT + 4, i = 0; f < POOF - 2; f += 5, i++) key('yel', f, { lean: i % 2 ? 6 : 18, head: i % 2 ? 4 : 16, sx: i % 2 ? 1 : 0.94, sy: i % 2 ? 1 : 1.04 }, 3);
  tremble('yel', HIT + 2, POOF - 2, YX, 3);
  sfx('scared', HIT + 4, { who: 'yel', gain: 0.6 });
  key('skel', HIT + 4, { mouth: 'happy with theeth', eyes: 'normal' }, 0);
  sfx('ref:laugh', HIT + 4, { who: 'skel', gain: 0.85, pitch: 0.75 });
  chuckle('skel', HIT + 6, POOF + 16, { mouth: 'happy with theeth' });
  const YBX = 600, NL3 = [VX - 230, GROUND - 38];
  const ysm = shrink('yel', POOF, YBX, 1, { mouth: 'puzzlement', eyes: 'sad', smoke: 420 });
  key('yel', ysm, { lean: 0, head: 0, hip: [0, 0], legF: null, legB: null, rot: 0 }, 0);
  move('yel', ysm, { x: YBX, y: GROUND, rot: 0 });
  NOZ.push({ f0: POOF, f1: POOF + 10, a: (f, S) => nozPt(POOF - 1), b: NL3, arc: 100, rot0: Math.PI, rot1: Math.PI * 3 }, { f0: POOF + 10, at: NL3, rot: Math.PI });
  sfx('land', POOF + 10, { x: NL3[0], gain: 0.4, pitch: 1.3 });
  ev('stars', { who: 'yel', f0: ysm + 4, f1: ysm + 18, snd: false });

  // ---- 12.4–16 с: шарик-Жёлтая на кнопку — мешок раздувается — лопает — пыль — Скелет чихает — «пуф»
  key('yel', ysm + 10, { eyes: 'angry', mouth: 'angry theeth' }, 0);
  const UPON = ysm + 26;
  hopTo('yel', ysm + 14, UPON, YBX, GROUND, VX + 40, VTOP, 130, { land: false });
  key('yel', UPON, { sx: 1.35, sy: 0.72 }, 1); key('yel', UPON + 4, { sx: 1, sy: 1 }, 3);
  sfx('land', UPON, { who: 'yel', gain: 0.6 });
  VAC.inf = [UPON + 1, UPON + 14];
  vacOn(UPON + 1, UPON + 14, 'suck', 0.7);
  sfx('inflate', UPON + 2, { x: VX, dur: 12, gain: 0.8 });
  move('yel', UPON, { x: VX + 40, y: VTOP }); move('yel', UPON + 14, { y: GROUND - 200 * 1.4 - 10 }, 'in2');
  key('yel', UPON + 4, { mouth: 'theeth smile', eyes: 'angry' }, 0);
  key('skel', UPON + 4, { mouth: 'puzzlement', head: 8, lean: 6 }, 4);
  const BOOM = UPON + 14;
  sfx('explode', BOOM, { x: VX, gain: 0.8 }); sfx('poof', BOOM, { x: VX, gain: 0.9 });
  ev('shake', { f: BOOM, amp: 18, n: 12 }); ev('flash', { f: BOOM, who: 'skel', strength: 0.2 });
  CLOUD.push({ f: BOOM, at: [VX + 80, GROUND - 230], size: 1, dir: 1 });
  VAC.gone = BOOM; NOZ.push({ f0: BOOM, gone: true }); BURST.push({ f: BOOM, at: [VX, GROUND - 150] });
  // Жёлтую подбрасывает назад
  const YX3 = 760;
  key('yel', BOOM, { pivot: ST.CAST.yel.pivot }, 0);
  move('yel', BOOM, { x: VX + 40, y: GROUND - 290, rot: 0 });
  move('yel', BOOM + 7, { y: GROUND - 460 }, 'out2');
  move('yel', BOOM + 16, { y: GROUND }, 'in2');
  move('yel', BOOM + 16, { x: YX3, rot: -360 }, 'lin');
  key('yel', BOOM + 17, { rot: 0, pivot: 0 }, 0);
  key('yel', BOOM + 16, { sx: 1.25, sy: 0.8 }, 1); key('yel', BOOM + 21, { sx: 1, sy: 1 }, 4);
  sfx('land', BOOM + 16, { who: 'yel', gain: 0.6 });
  key('yel', BOOM + 18, { mouth: 'happy with theeth', eyes: 'normal' }, 0);
  sfx('ref:laugh', BOOM + 20, { who: 'yel', gain: 0.85, pitch: 1.45 });
  laugh('yel', BOOM + 20, BOOM + 34);
  // Скелет в пыли
  SOOT.push({ who: 'skel', f0: BOOM + 3, f1: 0, part: 'face', w: 230, dy: 10, seed: 3 }, { who: 'skel', f0: BOOM + 4, f1: 0, part: 'body', w: 300, dy: 0, seed: 5 });
  key('skel', BOOM + 2, { lean: -16, head: -14, mouth: 'puzzlement', eyes: 'sad', handF: hand('skel', 'F', 0.4, -0.7), handB: hand('skel', 'B', -0.4, -0.6) }, 2);
  key('skel', BOOM + 10, { lean: -4, head: 0, handF: hand('skel', 'F', 0.6, -0.4), handB: hand('skel', 'B', 0.2, -0.5) }, 6);
  sfx('hurt', BOOM + 4, { who: 'skel', gain: 0.7, pitch: 0.8 });
  // а-а-а-ПЧХИ!
  const SNZ = BOOM + 30;
  key('skel', SNZ - 12, { lean: -14, head: -22, mouth: 'puzzlement', eyes: 'sad' }, 10, 'out');
  sfx('sneeze', SNZ - 10, { who: 'skel', gain: 1.0 });
  key('skel', SNZ, { lean: 18, head: 18 }, 2, 'in2');
  CLOUD.push({ f: SNZ, at: (f, S) => target('skel:face', S), size: 0.45, dir: -1 });
  ev('shake', { f: SNZ, amp: 14, n: 8 });
  const ssm = shrink('skel', SNZ + 3, SX2, -1, { mouth: 'puzzlement', eyes: 'sad', smoke: 420 });
  key('skel', ssm, { lean: 0, head: 0, hip: [0, 0], legF: null, legB: null, rot: 0 }, 0);
  SOOT.push({ who: 'skel', f0: ssm, f1: 0, part: 'face', w: 150, dy: 0, seed: 7 });
  SOOT[SOOT.length - 2].f1 = ssm; SOOT[SOOT.length - 3].f1 = ssm;
  // шарик откатывается от отдачи и удирает
  const SX3 = 1640;
  tumble('skel', ssm + 1, ssm + 17, SX2, SX3, 150, 1, { stars: 14 });
  key('skel', ssm + 30, { face: 1 }, 0);
  sfx('scared', ssm + 31, { who: 'skel', gain: 0.6 });
  hop('skel', ssm + 32, ssm + 40, SX3, 1880, 80, { prep: 1 }); hop('skel', ssm + 40, ssm + 48, 1880, 2150, 80, { prep: 1 });

  // ---- Жёлтая «растёт» — в центр
  key('yel', SNZ + 4, { eyes: 'angry', mouth: 'theeth smile' }, 0);
  const YB2 = transform('yel', SNZ + 6, YX3, YX3 + 40, 1, { style: 'grow' });
  key('yel', YB2, stance('yel', YX3 + 40, 1), 0);
  key('yel', YB2 + 4, { mouth: 'happy with theeth' }, 0);
  sfx('ref:laugh', YB2 + 4, { who: 'yel', gain: 0.8, pitch: 1.45 });
  chuckle('yel', YB2 + 4, YB2 + 12, { mouth: 'happy with theeth' });
  const WIN = victory('yel', YB2 + 12, YX3 + 40, { n: 9, stride: 90 });
  for (const fn of LATER) fn();
  window.T = { STK, YB, GRAB, SK1, BLOW, SB, PRESS, HIT, POOF, UPON, BOOM, SNZ, YB2, WIN };
};

// ------------------------------------------------------------------ рисование
const T0 = (f) => f / FPS;
ST.hooks.beforeChars.push((ctx, f, S, CAM) => {
  ctx.setTransform(...CAM);
  const vy = vacY(f);
  if (vy !== null) FX.vacuum(ctx, VX, vy, VS, vacMode(f) ? 1 : 0, T0(f), inflateAt(f));
});
ST.hooks.afterChars.push((ctx, f, S, CAM) => {
  ctx.setTransform(...CAM);
  const vy = vacY(f), n = nozAt(f, S);
  if (vy !== null && n) {
    // шланг: от насадки к патрубку
    ctx.save(); ctx.translate(0, 0);
    const out = [OUT[0], OUT[1] - GROUND + vy];
    const end = [n.x - Math.cos(n.rot) * 150, n.y - Math.sin(n.rot) * 150];
    const mid1 = [E.lerp(end[0], out[0], 0.3), Math.min(GROUND - 14, Math.max(end[1], out[1]) + 120)];
    const mid2 = [E.lerp(end[0], out[0], 0.7), Math.min(GROUND - 14, Math.max(end[1], out[1]) + 90)];
    FX.vacHose(ctx, [end, mid1, mid2, out], 24);
    ctx.restore();
    FX.vacNozzle(ctx, n.x, n.y, n.rot);
    const m = vacMode(f);
    const stuck = NOZ.filter((s) => f >= s.f0).pop();
    if (m && !(stuck && stuck.on) && !(f >= window.T.SK1 && f < window.T.BLOW)) FX.airLines(ctx, n.x + Math.cos(n.rot) * 10, n.y + Math.sin(n.rot) * 10, n.rot, T0(f), m === 'suck', m === 'blow' ? 460 : 360, 3);
  }
  for (const s of SOOT) {
    if (f < s.f0 || (s.f1 && f >= s.f1)) continue;
    const p = target(`${s.who}:${s.part}`, S);
    FX.soot(ctx, p[0], p[1] + (s.dy || 0), s.w, 1, s.seed);
  }
  for (const b of BURST) FX.blockBurst(ctx, b.at[0], b.at[1], (f - b.f) / 24, b.f, ['#e8262e', '#c41d1d', '#9a9a9a', '#111111'], 18, 46, 1.2, GROUND);
  for (const c of CLOUD) {
    const u = (f - c.f) / 26;
    if (u < 0 || u > 1) continue;
    const at = P(c.at, c.f, statesAt(c.f)), r = FX.rng(c.f + 5);
    for (let i = 0; i < 16; i++) {
      const a = (r() - 0.5) * 1.6 + (c.dir > 0 ? 0 : Math.PI), v = (160 + 300 * r()) * c.size, rr = (40 + 50 * r()) * c.size * (0.6 + u);
      const x = at[0] + Math.cos(a) * v * E.EASE.out2(u), y = at[1] + Math.sin(a) * v * 0.6 * E.EASE.out2(u) - 40 * u;
      FX.puff(ctx, x, y, rr, (1 - u) * 0.95, '#b9b2a6', '#6e665a');
    }
  }
});

ST.start(BIG);
