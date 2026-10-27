// Серия 2, ролик 22: Санки — Жёлтая (слева) против Скелета (справа), 22 с, 24 кадра/с. Драка без ударов:
// ледяная дорожка, санки, сугроб и горка-трамплин из снежных блоков.
// Музыка превращения — один раз. Фон — тайга.
//
//   0–2 с     шарик-Жёлтая и шарик-Скелет неподвижно стоят друг напротив друга, середина пустая
//   2–3.6 с   по траве разбегается лёд, с неба падают санки; Скелет садится в санки и крыльями разгоняется — сбивает Жёлтую
//   4–5.2 с   Жёлтая «растёт» под музыку — Скелет влюблён
//   5.4–7.5 с толкает санки с влюблённым Скелетом — они врезаются в сугроб, Скелет улетает в снег
//   7.6–9 с   Скелет «растёт» — сугроб разлетается, блоки складываются в горку
//   9.4–11.8 с пускает санки по льду ей под ноги — она падает — «пуф»
//   11.8–14 с шарик-Жёлтая в санках разгоняется, с горки — в полёт — прямо Скелету на голову — он падает — «пуф»
//   14.6–22 с Жёлтая «растёт» и в центре, руки вверх
'use strict';

const ST = Stage({
  name: '22 Жёлтая vs Скелет',
  frames: 528,
  cast: {
    yel: { small: ['girl-verity-small', { bodyHeight: 300, recolor: 'yellow' }],
      big: ['verity-big-girl', { height: 730, splitFeet: true, recolor: 'yellow' }], pivot: 337, voice: 1.45, vAngle: 50, lie: 55,
      color: '#ffe23a', moods: { angry: 'angry theeth', grin: 'theeth smile', big: 'theeth smile' } },
    skel: { small: ['skeleton-verity-small', { scale: 0.455 }], big: ['skeleton-verity-big', { height: 730 }], pivot: 325,
      voice: 0.9, lie: 60, color: '#f3f1e6', moods: { angry: 'angry theeth', grin: 'happy with theeth', big: 'theeth smile' } },
  },
  order: ['skel', 'yel'],
  background: { theme: 'taiga', seed: 1022, sunX: 1500, sunY: 130 },
  clouds: [[150, 80, 2.4, 0, 12], [700, 220, 1.8, 1, 16], [1150, 70, 2.6, 2, 10], [1720, 250, 1.5, 0, 18]],
});
const { FPS, NF, GROUND, C, key, move, ev, sfx, hop, tumble, laugh, transform, shrink, stance, walk,
  slip, fallBack, victory, chuckle, hand, statesAt, target } = ST;
const P = (v, f, S) => (typeof v === 'function' ? v(f, S) : typeof v === 'string' ? target(v, S) : v);
function flap(f0, f1, gain = 0.6) {
  for (let f = f0; f < f1; f += 6) { key('skel', f, { b_B16: -30, b_B17: 30 }, 3); key('skel', f + 3, { b_B16: 46, b_B17: -46 }, 3, 'in'); }
  key('skel', f1, { b_B16: 0, b_B17: 0 }, 4);
  sfx('gust', f0, { who: 'skel', dur: f1 - f0, gain });
}

// ------------------------------------------------------------------ лёд, санки, сугроб, горка
const SW = 300, SEAT = 78, PK = 1.7;
const ICE = { f0: 48, x0: 340, x1: 1800 };
const SLED = [];          // {f0, at:[x,y], rot, face} | {f0, f1, a, b, ease, arc, rot0, rot1, face} | {f0, hands: who, face}
const PILE = { f0: 50, f1: 1e9, x: 1700, w: 260, rows: 4 };
const RAMP = { f0: 1e9, x: 1150, s: 70 };
const FLYB = [];          // летящие снежные блоки: {f0, f1, a, b, arc, i}
const BURST = [];         // {f, at, size}
const RIDE = [];          // {who, f0, f1}
function segAt(segs, f) { let c = null; for (const s of segs) if (f >= s.f0) c = s; return c && !c.gone ? c : null; }
function sledAt(f, S) {
  const c = segAt(SLED, f);
  if (!c) return null;
  if (c.at) return { x: c.at[0], y: c.at[1] ?? GROUND, rot: c.rot || 0, face: c.face };
  if (c.hands) {
    if (S[c.hands].p.form !== 'big') return null;
    const h = C[c.hands].big.point(S[c.hands].st, 'handF'), g = C[c.hands].big.point(S[c.hands].st, 'handB');
    return { x: (h[0] + g[0]) / 2, y: Math.max(h[1], g[1]) + 50, rot: 0, face: c.face };
  }
  const u = E.clamp((f - c.f0) / (c.f1 - c.f0), 0, 1), e = c.ease ? E.EASE[c.ease](u) : u;
  const a = P(c.a, c.f0, statesAt(c.f0)), b = P(c.b, f, S);
  return { x: E.lerp(a[0], b[0], e), y: E.lerp(a[1], b[1], e) - Math.sin(Math.PI * u) * (c.arc || 0), rot: E.lerp(c.rot0 || 0, c.rot1 || 0, e), face: c.face };
}
const sledPt = (f) => { const s = sledAt(f, statesAt(f)); return [s.x, s.y]; };
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
const rampBlocks = () => { const out = []; for (let i = 0; i < 3; i++) for (let j = 0; j <= i; j++) out.push([RAMP.x - (2 - i) * RAMP.s, GROUND - RAMP.s / 2 - j * RAMP.s]); return out; };

const YX0 = 560, SX0 = 1360;
// ================================================================== 0–2 с: неподвижная стойка
key('yel', 0, { form: 'small', x: YX0, y: GROUND, face: 1, look: 1, eyes: 'normal', mouth: 'smile normal', sx: 1, sy: 1, rot: 0, pivot: 0, alpha: 1 }, 0);
key('skel', 0, { form: 'small', x: SX0, y: GROUND, face: -1, look: 1, eyes: 'normal', mouth: 'smile normal', sx: 1, sy: 1, rot: 0, pivot: 0, alpha: 1 }, 0);

const BIG = () => {
  // ---- 2–3.6 с: лёд, санки с неба, сугроб; Скелет в санках сбивает Жёлтую
  sfx('crunch', 48, { x: 960, gain: 0.5 }); sfx('twinkle', 50, { x: 960, gain: 0.5 });
  ev('smoke', { f: 50, who: 'skel', size: 320, dx: PILE.x - SX0, y: GROUND - 90 }); sfx('poof', 50, { x: PILE.x, gain: 0.5 });
  const SLX = 1130;
  SLED.push({ f0: 50, f1: 57, a: [SLX, -150], b: [SLX, GROUND], ease: 'in2', face: -1 }, { f0: 57, at: [SLX, GROUND], face: -1 });
  sfx('whoosh', 50, { x: SLX, dur: 7, gain: 0.5 }); sfx('bonk', 57, { x: SLX, gain: 0.6, pitch: 0.8 });
  key('yel', 52, { mouth: 'puzzlement' }, 0); key('skel', 52, { mouth: 'puzzlement' }, 0);
  key('skel', 58, { mouth: 'happy with theeth', eyes: 'angry' }, 0);
  sfx('ref:grin-eee', 58, { who: 'skel', gain: 0.4 });
  const IN = 68;
  flap(58, IN, 0.5);
  move('skel', 59, { x: SX0, y: GROUND }); move('skel', 63, { x: 1250, y: GROUND - 200 }, 'out2'); move('skel', IN, { x: SLX, y: GROUND - SEAT }, 'in2');
  key('skel', IN, { sx: 1.25, sy: 0.8 }, 1); key('skel', IN + 4, { sx: 1, sy: 1 }, 3);
  sfx('land', IN, { who: 'skel', gain: 0.5 });
  // крыльями — вперёд
  const GO = IN + 4, HIT = GO + 12, SLX1 = 930;
  flap(GO - 2, HIT + 2, 0.7);
  SLED.push({ f0: GO, f1: HIT, a: [SLX, GROUND], b: [SLX1, GROUND], ease: 'in2', face: -1 }, { f0: HIT, f1: HIT + 6, a: [SLX1, GROUND], b: [SLX1 - 30, GROUND], ease: 'out2', face: -1 }, { f0: HIT + 6, at: [SLX1 - 30, GROUND], face: -1 });
  RIDE.push({ who: 'skel', f0: IN + 1, f1: HIT + 30 });
  sfx('slide', GO, { x: 950, gain: 0.6, pitch: 0.9 });
  key('yel', HIT - 6, { mouth: 'puzzlement', eyes: 'sad' }, 0);
  tumble('yel', HIT, HIT + 16, YX0, 300, 200, -1, { stars: 18, hurt: false });
  sfx('bonk', HIT, { who: 'yel', gain: 0.9 });
  key('skel', HIT + 2, { mouth: 'happy with theeth', eyes: 'normal' }, 0);
  sfx('ref:laugh', HIT + 2, { who: 'skel', gain: 0.85 });
  laugh('skel', HIT + 4, HIT + 20);

  // ---- 4–5.2 с: Жёлтая «растёт» — Скелет влюблён
  const YX = 360;
  key('yel', HIT + 14, { eyes: 'angry', mouth: 'angry theeth' }, 0);
  const YB = transform('yel', HIT + 16, 300, YX, 1, { style: 'grow', love: 'skel', loveDur: 52 });
  key('yel', YB, stance('yel', YX, 1), 0);
  key('yel', YB + 4, { mouth: 'theeth smile', eyes: 'normal' }, 0);

  // ---- 5.4–7.5 с: толкает санки — сугроб — Скелет в снег
  const YX1 = 620;
  walk('yel', YB + 4, YX, YX1, 2, 8, 1);
  const PUSH = YB + 24, BACK = SLX1 - 30 - SW * 0.48;
  key('yel', PUSH - 5, { lean: 30, hip: [0, ST.toRig('yel', 130)], head: 8, mouth: 'theeth smile', eyes: 'angry' }, 5);
  key('yel', PUSH, { hitF: 1, hitB: 1, hitFto: [BACK + 10, GROUND - 60], hitBto: [BACK - 10, GROUND - 40], hitFfix: PUSH, hitBfix: PUSH }, 3, 'in2');
  sfx('swing', PUSH - 2, { who: 'yel', gain: 0.8 });
  const CR = PUSH + 16, SLX2 = PILE.x - PILE.w / 2 * PK - SW * 0.42;
  SLED.push({ f0: PUSH, f1: CR, a: [SLX1 - 30, GROUND], b: [SLX2, GROUND], ease: 'in', face: -1 }, { f0: CR, at: [SLX2, GROUND], face: -1, rot: 0 });
  RIDE[0].f1 = CR;
  sfx('slide', PUSH, { x: 1200, gain: 0.7, pitch: 1.1 });
  key('yel', PUSH + 8, { ...stance('yel', YX1, 1), hitF: 0, hitB: 0, mouth: 'happy with theeth', eyes: 'normal' }, 8);
  key('skel', PUSH + 4, { mouth: 'puzzlement', eyes: 'sad' }, 0);
  // врезались — Скелет летит в сугроб
  sfx('slam', CR, { x: PILE.x, gain: 0.9 }); ev('shake', { f: CR, amp: 14, n: 8 });
  key('skel', CR, { pivot: ST.CAST.skel.pivot }, 0);
  move('skel', CR, { x: SLX2, y: GROUND - SEAT, rot: 0 });
  move('skel', CR + 5, { y: GROUND - 260 }, 'out2');
  move('skel', CR + 10, { x: PILE.x, y: GROUND - 60 }, 'in2');
  move('skel', CR + 10, { rot: -360 }, 'lin');
  key('skel', CR + 10, { alpha: 0, rot: 0, pivot: 0 }, 0);
  sfx('scared', CR + 1, { who: 'skel', gain: 0.6 });
  sfx('snowhit', CR + 10, { x: PILE.x, gain: 1.0 }); BURST.push({ f: CR + 10, at: [PILE.x, GROUND - 120], size: 1 });
  sfx('ref:laugh', CR + 12, { who: 'yel', gain: 0.85, pitch: 1.45 });
  chuckle('yel', CR + 12, CR + 34, { mouth: 'happy with theeth' });
  // сугроб дрожит
  const SHAKE = [CR + 18, CR + 30];

  // ---- 7.6–9 с: Скелет «растёт» — сугроб разлетается, блоки — в горку
  const OUT = CR + 30;
  PILE.f1 = OUT; PILE.shake = SHAKE;
  BURST.push({ f: OUT, at: [PILE.x, GROUND - 150], size: 1.6 });
  sfx('explode', OUT, { x: PILE.x, gain: 0.5 }); sfx('snowhit', OUT, { x: PILE.x, gain: 0.9 });
  ev('shake', { f: OUT, amp: 14, n: 8 });
  key('skel', OUT, { alpha: 1, x: PILE.x, y: GROUND, eyes: 'angry', mouth: 'angry theeth', sx: 1, sy: 1, rot: 0, pivot: 0 }, 0);
  move('skel', CR + 11, { rot: 0 });
  move('skel', OUT, { x: PILE.x, y: GROUND, rot: 0 });
  rampBlocks().forEach((b, i) => FLYB.push({ f0: OUT + i, f1: OUT + 14 + i * 2, a: [PILE.x + (i % 3 - 1) * 60, GROUND - 120], b, arc: 240, i }));
  RAMP.f0 = OUT + 14 + 10;
  for (let i = 0; i < 6; i++) sfx('land', OUT + 14 + i * 2, { x: RAMP.x, gain: 0.35, pitch: 1.1 });
  const SX = 1580;
  const SB = transform('skel', OUT + 2, PILE.x, SX, -1, { style: 'grow' });
  key('skel', SB, stance('skel', SX, -1), 0);
  key('skel', SB + 4, { mouth: 'theeth smile', eyes: 'angry' }, 0);
  key('yel', SB - 2, { mouth: 'puzzlement', eyes: 'sad' }, 0);

  // ---- 9.4–11.8 с: пускает санки ей под ноги — падает — «пуф»
  const GR = SB + 8;
  key('skel', GR - 5, { lean: 26, hip: [0, ST.toRig('skel', 160)], head: 6 }, 5);
  key('skel', GR, { hitF: 1, hitFto: [SLX2 + SW * 0.3, GROUND - 60], hitFfix: GR }, 4);
  sfx('pop', GR, { who: 'skel', gain: 0.4 });
  const SEND = GR + 6, FEET = SEND + 15, SLX3 = 420;
  key('skel', SEND, { ...stance('skel', SX, -1), hitF: 0, lean: 12, handF: hand('skel', 'F', 0.95, 0.4) }, 4, 'in2');
  const LANDS = SEND + 10;
  SLED.push({ f0: GR, f1: SEND, a: [SLX2, GROUND], b: [SLX2 - 40, GROUND], face: -1 },
    { f0: SEND, f1: LANDS, a: [SLX2 - 40, GROUND], b: [860, GROUND], arc: 300, rot0: 0, rot1: -Math.PI * 2, face: -1 },
    { f0: LANDS, f1: FEET, a: [860, GROUND], b: [YX1 + 40, GROUND], face: -1 }, { f0: FEET, f1: FEET + 10, a: [YX1 + 40, GROUND], b: [SLX3, GROUND], ease: 'out2', face: -1 },
    { f0: FEET + 10, at: [SLX3, GROUND], face: -1 });
  sfx('swing', SEND - 2, { who: 'skel', gain: 0.7 }); sfx('whoosh', SEND, { x: 1100, dur: 10, gain: 0.6 }); sfx('bonk', LANDS, { x: 860, gain: 0.5, pitch: 0.8 }); sfx('slide', LANDS, { x: 800, gain: 0.7, pitch: 1.0 });
  key('skel', SEND + 8, { ...stance('skel', SX, -1), mouth: 'happy with theeth', eyes: 'normal' }, 8);
  const LIE = slip('yel', FEET, YX1, 1, { n: 12, stars: 26 });
  sfx('bonk', FEET, { who: 'yel', gain: 0.7 });
  sfx('ref:laugh', FEET + 4, { who: 'skel', gain: 0.85, pitch: 0.75 });
  chuckle('skel', FEET + 4, FEET + 40, { mouth: 'happy with theeth' });
  const YBX = 640;
  const ysm = shrink('yel', LIE + 8, YBX, 1, { mouth: 'puzzlement', eyes: 'sad', smoke: 420 });
  key('yel', ysm, { lean: 0, head: 0, hip: [0, 0], legF: null, legB: null, zB: null, rot: 0 }, 0);
  move('yel', ysm, { x: YBX, y: GROUND, rot: 0 });
  ev('stars', { who: 'yel', f0: ysm + 4, f1: ysm + 14, snd: false });

  // ---- 11.8–14 с: шарик-Жёлтая в санках — с горки — Скелету на голову
  key('yel', ysm + 6, { eyes: 'angry', mouth: 'angry theeth' }, 0);
  const SIT = ysm + 16;
  hopTo('yel', ysm + 8, SIT, YBX, GROUND, SLX3, GROUND - SEAT, 120, { land: false });
  key('yel', SIT, { sx: 1.3, sy: 0.75 }, 1); key('yel', SIT + 4, { sx: 1, sy: 1 }, 3);
  sfx('land', SIT, { who: 'yel', gain: 0.5 });
  SLED.push({ f0: SIT, at: [SLX3, GROUND], face: 1 });
  key('yel', SIT + 2, { mouth: 'theeth smile', eyes: 'angry' }, 0);
  for (let f = SIT + 3; f < SIT + 9; f += 3) key('yel', f, { sx: f % 6 ? 1.12 : 0.92, sy: f % 6 ? 0.9 : 1.08 }, 2);
  const G2 = SIT + 8, UP0 = G2 + 14, LAUNCH = UP0 + 6, RX0 = RAMP.x - 2.5 * RAMP.s, TOPY = GROUND - 3 * RAMP.s;
  SLED.push({ f0: G2, f1: UP0, a: [SLX3, GROUND], b: [RX0, GROUND], ease: 'in2', face: 1 },
    { f0: UP0, f1: LAUNCH, a: [RX0, GROUND], b: [RAMP.x + 20, TOPY], rot0: -0.5, rot1: -0.6, face: 1 },
    { f0: LAUNCH, f1: LAUNCH + 12, a: [RAMP.x + 20, TOPY], b: [1360, GROUND], arc: 120, rot0: -0.6, rot1: 0, face: 1 }, { f0: LAUNCH + 12, at: [1360, GROUND], rot: 0, face: 1 });
  sfx('slide', G2, { x: 900, gain: 0.7, pitch: 1.2 }); sfx('whoosh', LAUNCH, { x: RAMP.x, dur: 12, gain: 0.6 }); sfx('bonk', LAUNCH + 12, { x: 1360, gain: 0.5, pitch: 0.8 });
  RIDE.push({ who: 'yel', f0: SIT + 1, f1: LAUNCH });
  const HEAD = LAUNCH + 12;
  move('yel', LAUNCH, { x: RAMP.x + 20, y: TOPY - SEAT });
  move('yel', LAUNCH + 6, { y: TOPY - SEAT - 220 }, 'out2');
  LATE.push(() => { const t = target('skel:face', ST.stateAt(HEAD)); move('yel', HEAD, { x: t[0], y: t[1] + 150 }, 'in2'); move('yel', LAUNCH + 6, { x: E.lerp(RAMP.x + 20, t[0], 0.6) }, 'lin'); });
  key('skel', HEAD - 6, { look: 1, head: -6, mouth: 'puzzlement', eyes: 'sad' }, 4);
  key('yel', HEAD, { sx: 1.3, sy: 0.75 }, 1);
  sfx('bonk', HEAD, { who: 'skel', gain: 1.0 }); sfx('slam', HEAD, { who: 'skel', gain: 0.5 });
  ev('shake', { f: HEAD, amp: 16, n: 10 });
  const FB = fallBack('skel', HEAD + 2, SX, -1, { n: 14, stars: 24 });
  const YX4 = 840;
  LATE.push(() => { const t = target('skel:face', ST.stateAt(HEAD)); hopTo('yel', HEAD + 2, HEAD + 16, t[0], t[1] + 150, YX4, GROUND, 80); });
  key('yel', HEAD + 16, { mouth: 'happy with theeth', eyes: 'normal' }, 0);
  sfx('ref:laugh', HEAD + 16, { who: 'yel', gain: 0.85, pitch: 1.45 });
  laugh('yel', HEAD + 18, HEAD + 26);
  const SBX = 1480;
  const ssm = shrink('skel', FB + 6, SBX, -1, { mouth: 'puzzlement', eyes: 'sad', smoke: 420 });
  key('skel', ssm, { lean: 0, head: 0, hip: [0, 0], legF: null, legB: null, zB: null, rot: 0 }, 0);
  move('skel', ssm, { x: SBX, y: GROUND, rot: 0 });
  ev('stars', { who: 'skel', f0: ssm + 4, f1: ssm + 14, snd: false });
  // улетает, хлопая крыльями
  flap(ssm + 10, ssm + 40, 0.6);
  key('skel', ssm + 10, { face: 1 }, 0);
  move('skel', ssm + 12, { x: SBX, y: GROUND }); move('skel', ssm + 40, { x: 2150, y: -200 }, 'in2');
  sfx('scared', ssm + 12, { who: 'skel', gain: 0.6 });

  // ---- Жёлтая «растёт» — в центр
  const YB2 = transform('yel', HEAD + 22, YX4, YX4 + 20, 1, { style: 'grow' });
  key('yel', YB2, stance('yel', YX4 + 20, 1), 0);
  key('yel', YB2 + 4, { mouth: 'happy with theeth' }, 0);
  const WIN = victory('yel', YB2 + 6, YX4 + 20, { n: 9, stride: 75 });
  // всадники
  for (const r of RIDE) for (let f = r.f0; f <= r.f1; f++) { const s = sledAt(f, ST.stateAt(f)); move(r.who, f, { x: s.x, y: s.y - SEAT + Math.sin(s.rot) * 0 }, 'lin'); }
  for (const fn of LATE) fn();
  window.T = { IN, HIT, YB, PUSH, CR, OUT, SB, GR, SEND, FEET, ysm, SIT, G2, LAUNCH, HEAD, FB, ssm, YB2, WIN };
};
const LATE = [];

// ------------------------------------------------------------------ рисование
ST.hooks.beforeChars.push((ctx, f, S, CAM) => {
  ctx.setTransform(...CAM);
  if (f >= ICE.f0) { const u = E.EASE.out2(E.clamp((f - ICE.f0) / 12, 0, 1)), c = (ICE.x0 + ICE.x1) / 2, h = (ICE.x1 - ICE.x0) / 2 * u; FX.iceRink(ctx, c - h, c + h, GROUND + 2, 0, f / FPS); }
  if (f >= RAMP.f0) FX.snowRamp(ctx, RAMP.x, GROUND + 2, 3, RAMP.s, -1);
  const s = sledAt(f, S);
  if (s) FX.sled(ctx, s.x, s.y, SW, s.rot, s.face);
});
ST.hooks.afterChars.push((ctx, f, S, CAM) => {
  ctx.setTransform(...CAM);
  if (f >= PILE.f0 && f < PILE.f1) {
    const g = E.EASE.out2(E.clamp((f - PILE.f0) / 6, 0, 1));
    const jit = PILE.shake && f >= PILE.shake[0] && f < PILE.shake[1] ? Math.sin(f * 2.3) * 6 : 0;
    ctx.save(); ctx.translate(PILE.x + jit, GROUND + 2); ctx.scale(g * PK, g * PK); FX.snowPile(ctx, 0, 0, PILE.w, PILE.rows, 3); ctx.restore();
  }
  for (const b of FLYB) {
    const u = (f - b.f0) / (b.f1 - b.f0);
    if (u < 0 || u >= 1) continue;
    FX.snowBlock(ctx, E.lerp(b.a[0], b.b[0], u), E.lerp(b.a[1], b.b[1], u) - Math.sin(Math.PI * u) * b.arc, RAMP.s, u * 6, b.i);
  }
  for (const b of BURST) FX.snowBurst(ctx, b.at[0], b.at[1], (f - b.f) / 20, b.size, b.f);
});

ST.start(BIG);
