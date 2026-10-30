// Ролик 27: Кальмар — Розовая (слева) против Лорда (справа), 25 с, 24 кадра/с. Драка без ударов:
// кальмар из майнкрафта брызгает чернилами, когда на него нажимают; у Лорда — светящийся кальмар.
// В начале — считалка «3, 2, 1, FIGHT». Музыка превращения — один раз. Фон — у озера.
//
//   0–2.2 с   считалка: шарик-Розовая и шарик-Лорд неподвижно стоят друг напротив друга
//   2.2–4 с   с неба плюхается кальмар; Лорд прыгает на него — чернила Розовой в лицо
//   4.1–5.3 с Розовая «растёт» под музыку — Лорд влюблён
//   5.4–9 с   берёт кальмара, как водяной пистолет, — струя чернил отбрасывает влюблённого Лорда
//   9.4–13.6 с Лорд «растёт» со светящимся кальмаром, крутит его над головой — чернильный дождь,
//             Розовая в луже поскальзывается — «пуф»
//   13.6–17 с шарик-Розовая прыгает на своего кальмара — струя Лорду в лицо — вслепую в лужу — «пуф»
//   17–21 с   Розовая «растёт» снова; шарик-Лорд садится на светящегося кальмара — тот чернильной
//             реактивной струёй уносит его за край
//   21–25 с   Розовая в центре, руки вверх
'use strict';

const ST = Stage({
  name: '27 Розовая vs Лорд',
  frames: 600,
  intro: 'countdown-321',
  cast: {
    pink: { small: ['girl-verity-small', { bodyHeight: 300 }], big: ['girl-verity-big', { height: 730, splitFeet: true }],
      pivot: 337, voice: 1.35, vAngle: 50, lie: 55, color: '#ff4fc8', moods: { angry: 'angry theeth', grin: 'theeth smile', big: 'theeth smile' } },
    lord: { small: ['lord-verity-small', { bodyHeight: 300 }], big: ['lord-verity-big', { height: 730 }], pivot: 337,
      voice: 1.0, lie: 55, color: '#ffe23a', ouch: ['ref:hit-ow', 1.0, 0.9] },
  },
  order: ['lord', 'pink'],
  background: { theme: 'lakeside', seed: 1027, sunX: 1500, sunY: 130 },
  clouds: [[150, 80, 2.4, 0, 12], [700, 220, 1.8, 1, 16], [1150, 70, 2.6, 2, 10], [1720, 250, 1.5, 0, 18]],
});
const { FPS, NF, GROUND, C, key, move, ev, sfx, hop, tumble, laugh, tremble, transform, shrink, stance, walk,
  slip, fallBack, victory, chuckle, hand, statesAt, target } = ST;
const P = (v, f, S) => (typeof v === 'function' ? v(f, S) : typeof v === 'string' ? target(v, S) : v);
ST.parts.mid = (ch, st) => { const h = ch.point(st, 'head'), f = ch.point(st, 'face'); return [(h[0] + f[0]) / 2, (h[1] + f[1]) / 2]; };

// ------------------------------------------------------------------ кальмары, чернила
const QS = 190, QH = QS * 1.25, QY = GROUND - 240;          // ширина, высота тела, центр сидящего кальмара
const SQ = { blue: [], glow: [] };   // {f0, at:[x,y], rot} | {f0, f1, a, b, arc, rot0, rot1, ease} | {f0, hold: who, rot, dx, dy} | {f0, lasso: who, a0, w} | {f0, ride: [x0, x1, f1, y]} | {f0, gone}
const SQZ = [];           // [f, кто] — сжатие
const JETS = [];          // {f0, f1, from: squid, to}
const SPL = [];           // {who, part, f0, f1, s, seed}
const PUD = [];           // {f0, f1, x, w}
const RAIN = { f0: 1e9, f1: 0, sq: 'glow' };
const SPLASH = [];        // {f, at, size}
function segAt(segs, f) { let c = null; for (const s of segs) if (f >= s.f0) c = s; return c && !c.gone ? c : null; }
function squidAt(id, f, S) {
  const c = segAt(SQ[id], f);
  if (!c) return null;
  let sq = 1;
  for (const [g, w] of SQZ) if (w === id && f >= g && f < g + 8) sq = Math.min(sq, 1 - 0.32 * Math.sin(Math.PI * (f - g) / 8));
  if (c.at) return { x: c.at[0], y: c.at[1], rot: c.rot || 0, sq };
  if (c.hold) {
    if (S[c.hold].p.form !== 'big') return null;
    const h = C[c.hold].big.point(S[c.hold].st, 'handF');
    return { x: h[0] + (c.dx || 0), y: h[1] + (c.dy || 0), rot: c.rot, sq };
  }
  if (c.lasso) {
    const h = C[c.lasso].big.point(S[c.lasso].st, 'handF'), a = c.a0 + (f - c.f0) * c.w, R = QH * 0.5 + QS * 0.8;
    return { x: h[0] + Math.cos(a) * R, y: h[1] + Math.sin(a) * R * 0.55, rot: a + Math.PI / 2, sq };
  }
  if (c.ride) {
    const [x0, x1, f1, y] = c.ride, u = E.EASE.in2(E.clamp((f - c.f0) / (f1 - c.f0), 0, 1));
    return { x: E.lerp(x0, x1, u), y: y - 80 * u, rot: -Math.PI / 2 - 0.15 * u, sq };
  }
  const u = E.clamp((f - c.f0) / (c.f1 - c.f0), 0, 1), e = c.ease ? E.EASE[c.ease](u) : u;
  const a = P(c.a, c.f0, statesAt(c.f0)), b = P(c.b, f, S);
  return { x: E.lerp(a[0], b[0], e), y: E.lerp(a[1], b[1], e) - Math.sin(Math.PI * u) * (c.arc || 0), rot: E.lerp(c.rot0 || 0, c.rot1 || 0, e), sq };
}
// откуда брызжут чернила: между щупальцами (по направлению щупалец)
const mouthOf = (q) => [q.x - Math.sin(q.rot) * (QH * 0.5 + QS * 0.35), q.y + Math.cos(q.rot) * (QH * 0.5 + QS * 0.35)];
function jet(id, f0, f1, to, gain = 0.8) {
  JETS.push({ f0, f1, id, to }); SQZ.push([f0 - 2, id]);
  sfx('spit', f0, { x: 960, gain }); sfx('splash', f0 + 1, { x: 960, gain: 0.5 }); sfx('squish', f0 - 2, { x: 960, gain: 0.6 });
}
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

const PX0 = 470, LX0 = 1450, MX = 960, GO = 54;
// ================================================================== 0–2.2 с: считалка, оба стоят
key('pink', 0, { form: 'small', x: PX0, y: GROUND, face: 1, look: 1, eyes: 'normal', mouth: 'smile normal', sx: 1, sy: 1, rot: 0, pivot: 0, alpha: 1 }, 0);
key('lord', 0, { form: 'small', x: LX0, y: GROUND, face: -1, look: 1, eyes: 'normal', mouth: 'smile normal', sx: 1, sy: 1, rot: 0, pivot: 0, alpha: 1 }, 0);

const BIG = () => {
  // ---- 2.2–4 с: кальмар плюхается с неба — Лорд прыгает на него — чернила Розовой в лицо
  SQ.blue.push({ f0: GO, f1: GO + 7, a: [MX, -300], b: [MX, QY], ease: 'in2' }, { f0: GO + 7, at: [MX, QY] });
  SQZ.push([GO + 7, 'blue']);
  sfx('whoosh', GO, { x: MX, dur: 7, gain: 0.5 }); sfx('splash', GO + 7, { x: MX, gain: 0.9 }); sfx('squish', GO + 7, { x: MX, gain: 0.7 });
  SPLASH.push({ f: GO + 7, at: [MX, GROUND - 20], size: 1.1 });
  key('pink', GO + 3, { mouth: 'puzzlement' }, 0); key('lord', GO + 3, { mouth: 'puzzlement' }, 0);
  key('lord', GO + 10, { mouth: 'happy with theeth', eyes: 'angry' }, 0);
  sfx('ref:grin-eee', GO + 10, { who: 'lord', gain: 0.4 });
  const ON = GO + 24, TOPY = QY - QH / 2 + 12;
  hopTo('lord', GO + 12, ON, LX0, GROUND, MX + 10, TOPY, 160, { land: false });
  key('lord', ON, { sx: 1.35, sy: 0.72 }, 1); key('lord', ON + 5, { sx: 1, sy: 1 }, 3);
  sfx('land', ON, { who: 'lord', gain: 0.6 });
  SQ.blue.push({ f0: ON, at: [MX, QY], rot: 0.35 });          // наклонился ртом к Розовой
  jet('blue', ON + 1, ON + 9, 'pink:face', 0.9);
  SPL.push({ who: 'pink', part: 'mid', f0: ON + 9, f1: 0, s: 190, seed: 3 });
  key('pink', ON + 9, { sx: 1.2, sy: 0.86, mouth: 'puzzlement', eyes: 'sad' }, 1); key('pink', ON + 13, { sx: 1, sy: 1 }, 3);
  sfx('hurt', ON + 10, { who: 'pink', gain: 0.8 });
  for (let f = ON + 12; f < ON + 26; f += 6) { key('pink', f + 3, { rot: 10, pivot: ST.CAST.pink.pivot }, 3); key('pink', f + 6, { rot: -10 }, 3); }
  key('pink', ON + 26, { rot: 0 }, 3);
  SQ.blue.push({ f0: ON + 10, at: [MX, QY], rot: 0 });
  const LX1 = 1250;
  hopTo('lord', ON + 6, ON + 16, MX + 10, TOPY, LX1, GROUND, 120);
  key('lord', ON + 16, { mouth: 'happy with theeth', eyes: 'normal' }, 0);
  sfx('ref:laugh', ON + 16, { who: 'lord', gain: 0.85 });
  laugh('lord', ON + 18, ON + 34);

  // ---- 4.1–5.3 с: Розовая «растёт» — чернила слетают, Лорд влюблён
  const PX = 540;
  key('pink', ON + 26, { eyes: 'angry', mouth: 'angry theeth' }, 0);
  const PB = transform('pink', ON + 28, PX0, PX, 1, { style: 'grow', love: 'lord', loveDur: 56 });
  SPL[0].f1 = PB - 3; SPLASH.push({ f: PB - 3, at: [PX0, GROUND - 200], size: 0.8, ink: true });
  key('pink', PB, stance('pink', PX, 1), 0);
  key('pink', PB + 4, { mouth: 'theeth smile', eyes: 'normal' }, 0);

  // ---- 5.4–9 с: кальмар — водяной пистолет — струя отбрасывает влюблённого Лорда
  const PX1 = 680;
  walk('pink', PB + 4, PX, PX1, 2, 9, 1);
  const GR = PB + 24;
  key('pink', GR - 5, { lean: 24, hip: [0, ST.toRig('pink', 130)], head: 6 }, 5);
  key('pink', GR, { hitF: 1, hitFto: [MX - 40, QY], hitFfix: GR }, 4);
  SQ.blue.push({ f0: GR, hold: 'pink', rot: 0, dx: 30, dy: 0 });
  sfx('squish', GR, { who: 'pink', gain: 0.5 });
  key('pink', GR + 8, { ...stance('pink', PX1, 1), hitF: 0, handF: hand('pink', 'F', 0.9, 0.15), mouth: 'theeth smile', eyes: 'angry' }, 8);
  SQ.blue.push({ f0: GR + 6, hold: 'pink', rot: -Math.PI / 2, dx: 70, dy: 0 });
  // влюблённый Лорд скачет к ней
  const LX2 = 1150;
  hopTo('lord', PB + 12, PB + 22, LX1, GROUND, LX2, GROUND, 70);
  ev('hearts', { who: 'lord', f0: PB + 22, f1: GR + 20, snd: false });
  sfx('kiss', GR + 8, { who: 'lord', gain: 0.7 });
  const SH = GR + 16;
  key('pink', SH - 3, { handF: hand('pink', 'F', 0.95, 0.2), lean: 8 }, 3);
  jet('blue', SH, SH + 8, 'lord:face', 1.0);
  SPL.push({ who: 'lord', part: 'mid', f0: SH + 7, f1: 0, s: 200, seed: 5 });
  key('lord', SH + 7, { mouth: 'puzzlement', eyes: 'sad' }, 0);
  const LX3 = 1620;
  tumble('lord', SH + 8, SH + 26, LX2, LX3, 200, 1, { stars: 18 });
  key('pink', SH + 10, { mouth: 'happy with theeth', eyes: 'normal', lean: 0 }, 4);
  sfx('ref:laugh', SH + 10, { who: 'pink', gain: 0.85, pitch: 1.35 });
  chuckle('pink', SH + 10, SH + 34, { mouth: 'happy with theeth' });

  // ---- 9.4–13.6 с: Лорд «растёт» со светящимся кальмаром — крутит над головой — чернильный дождь
  key('lord', SH + 30, { eyes: 'angry', mouth: 'angry theeth' }, 0);
  const LX = 1500, LB = transform('lord', SH + 32, LX3, LX, -1, { style: 'grow' });
  SPL[1].f1 = LB - 3; SPLASH.push({ f: LB - 3, at: [LX3, GROUND - 200], size: 0.8, ink: true });
  key('lord', LB, stance('lord', LX, -1), 0);
  key('lord', LB + 4, { mouth: 'happy with theeth', eyes: 'angry' }, 0);
  key('pink', LB - 2, { mouth: 'puzzlement', eyes: 'sad' }, 0);
  // Розовая жмёт кальмара — «пшик», чернила кончились
  const EMP = LB + 4;
  SQZ.push([EMP, 'blue']); sfx('squish', EMP, { x: PX1, gain: 0.5 }); sfx('deflate', EMP + 2, { x: PX1, dur: 8, gain: 0.4 });
  SPLASH.push({ f: EMP + 2, at: [PX1 + 330, GROUND - 330], size: 0.25, ink: true });
  key('pink', EMP + 6, { handF: hand('pink', 'F', 0.6, -0.5) }, 3); key('pink', EMP + 10, { handF: hand('pink', 'F', 0.9, -0.1) }, 3); key('pink', EMP + 14, { handF: hand('pink', 'F', 0.6, -0.5) }, 3);
  // светящийся кальмар из дыма — в руку Лорду
  ev('smoke', { f: LB + 6, who: 'lord', size: 260, dx: -150, y: GROUND - 480 });
  sfx('poof', LB + 6, { who: 'lord', gain: 0.6 });
  key('lord', LB + 6, { handF: hand('lord', 'F', 0.2, -0.95), lean: 0 }, 4);
  const L0 = LB + 10, L1 = L0 + 44;
  SQ.glow.push({ f0: LB + 9, lasso: 'lord', a0: -Math.PI / 2, w: 0.42 });
  sfx('whirr', L0, { who: 'lord', dur: L1 - L0, gain: 0.6 }); sfx('gust', L0, { who: 'lord', dur: L1 - L0, gain: 0.5 });
  sfx('ref:laugh', L0 + 2, { who: 'lord', gain: 0.85 });
  RAIN.f0 = L0 + 4; RAIN.f1 = L1;
  for (let f = L0 + 8; f < L1; f += 7) sfx('drip', f, { x: 900, gain: 0.5 });
  PUD.push({ f0: L0 + 16, f1: 0, x: PX1 + 40, w: 420, grow: 24 });
  SPL.push({ who: 'pink', part: 'face', f0: L0 + 18, f1: 0, s: 170, seed: 7 });
  key('pink', L0 + 12, { handF: hand('pink', 'F', 0.5, -0.85), handB: hand('pink', 'B', 0.3, -0.85), lean: -6, mouth: 'puzzlement', eyes: 'sad' }, 4);
  SQ.blue.push({ f0: L0 + 12, f1: L0 + 22, a: (f, S) => { const q = squidAt('blue', L0 + 11, statesAt(L0 + 11)); return [q.x, q.y]; }, b: [PX1 + 260, QY], rot0: -Math.PI / 2, rot1: 0, arc: 40 },
    { f0: L0 + 22, at: [PX1 + 260, QY] });
  sfx('squish', L0 + 22, { x: PX1 + 260, gain: 0.5 });
  tremble('pink', L0 + 20, L0 + 34, PX1, 4);
  const SL = L0 + 36;
  const LIE = slip('pink', SL, PX1, 1, { n: 12, stars: 26 });
  SPLASH.push({ f: SL + 12, at: [PX1 - 200, GROUND - 10], size: 0.7, ink: true });
  const PBX = 440;
  const psm = shrink('pink', LIE + 6, PBX, 1, { mouth: 'puzzlement', eyes: 'sad', smoke: 420 });
  key('pink', psm, { lean: 0, head: 0, hip: [0, 0], legF: null, legB: null, zB: null, rot: 0 }, 0);
  move('pink', psm, { x: PBX, y: GROUND, rot: 0 });
  SPL[SPL.length - 1].f1 = psm;
  SPL.push({ who: 'pink', part: 'mid', f0: psm, f1: psm + 30, s: 120, seed: 9 });
  ev('stars', { who: 'pink', f0: psm + 4, f1: psm + 16, snd: false });
  // Лорд перестаёт крутить, держит светящегося кальмара
  SQ.glow.push({ f0: L1, hold: 'lord', rot: 0.25, dx: -10, dy: QH / 2 + 20 });
  key('lord', L1, { handF: hand('lord', 'F', 0.65, -0.1) }, 6);
  chuckle('lord', L1, L1 + 40, { mouth: 'happy with theeth' });

  // ---- 13.6–17 с: шарик-Розовая прыгает на своего кальмара — струя Лорду в лицо — вслепую в лужу — «пуф»
  key('pink', psm + 8, { eyes: 'angry', mouth: 'theeth smile' }, 0);
  const ON2 = psm + 22, QX2 = PX1 + 260;
  hopTo('pink', psm + 10, ON2, PBX, GROUND, QX2 + 10, TOPY, 170, { land: false });
  key('pink', ON2, { sx: 1.35, sy: 0.72 }, 1); key('pink', ON2 + 5, { sx: 1, sy: 1 }, 3);
  sfx('land', ON2, { who: 'pink', gain: 0.6 });
  SQ.blue.push({ f0: ON2, at: [QX2, QY], rot: -0.45 });
  jet('blue', ON2 + 1, ON2 + 10, 'lord:face', 1.0);
  SPL.push({ who: 'lord', part: 'face', f0: ON2 + 10, f1: 0, s: 230, seed: 11 });
  key('lord', ON2 + 10, { lean: -16, head: -14, mouth: 'puzzlement', eyes: 'sad', handB: hand('lord', 'B', 0.4, -0.8) }, 2);
  sfx('hurt', ON2 + 11, { who: 'lord', gain: 0.8 });
  SQ.blue.push({ f0: ON2 + 12, at: [QX2, QY], rot: 0 });
  hopTo('pink', ON2 + 8, ON2 + 20, QX2 + 10, TOPY, 330, GROUND, 140);
  key('pink', ON2 + 20, { mouth: 'happy with theeth', eyes: 'normal' }, 0);
  sfx('ref:laugh', ON2 + 20, { who: 'pink', gain: 0.85, pitch: 1.35 });
  laugh('pink', ON2 + 22, ON2 + 40);
  // роняет светящегося кальмара, шагает вслепую — в лужу
  const GLX = 1760;
  SQ.glow.push({ f0: ON2 + 12, f1: ON2 + 20, a: (f, S) => { const q = squidAt('glow', ON2 + 11, statesAt(ON2 + 11)); return [q.x, q.y]; }, b: [GLX, QY], rot0: 0.25, rot1: 0, ease: 'in2' },
    { f0: ON2 + 20, at: [GLX, QY] });
  sfx('squish', ON2 + 20, { x: GLX, gain: 0.5 });
  PUD.push({ f0: ON2 + 12, f1: 0, x: LX - 30, w: 380, grow: 14 });
  for (let f = ON2 + 14; f < ON2 + 30; f += 6) sfx('drip', f, { who: 'lord', gain: 0.5 });
  tremble('lord', ON2 + 14, ON2 + 26, LX, 5);
  sfx('scared', ON2 + 16, { who: 'lord', gain: 0.6 });
  // ноги разъезжаются в луже — падает вперёд, лицом прямо на кальмара
  const SL2 = ON2 + 26;
  const LIE2 = fallBack('lord', SL2, LX, -1, { forward: true, n: 14, stars: 26 });
  sfx('slide', SL2, { who: 'lord', gain: 0.5, pitch: 1.2 });
  SQZ.push([LIE2, 'blue']); sfx('squish', LIE2, { x: QX2, gain: 0.8 });
  SPLASH.push({ f: LIE2, at: [QX2, QY - 80], size: 0.8, ink: true });
  const LBX = 1250;
  const lsm = shrink('lord', LIE2 + 6, LBX, -1, { mouth: 'puzzlement', eyes: 'sad', smoke: 420 });
  key('lord', lsm, { lean: 0, head: 0, hip: [0, 0], legF: null, legB: null, zB: null, rot: 0 }, 0);
  move('lord', lsm, { x: LBX, y: GROUND, rot: 0 });
  SPL[SPL.length - 1].f1 = lsm;
  SPL.push({ who: 'lord', part: 'mid', f0: lsm, f1: 0, s: 130, seed: 13 });
  ev('stars', { who: 'lord', f0: lsm + 4, f1: lsm + 14, snd: false });

  // ---- 17–21 с: Розовая «растёт» снова; шарик-Лорд — на светящегося кальмара — реактивной струёй за край
  key('pink', SL2 + 6, { eyes: 'angry', mouth: 'angry theeth' }, 0);
  const PX2 = 400, PB2 = transform('pink', SL2 + 8, 330, PX2, 1, { style: 'grow' });
  key('pink', PB2, stance('pink', PX2, 1), 0);
  key('pink', PB2 + 4, { mouth: 'theeth smile', eyes: 'angry' }, 0);
  key('lord', lsm + 8, { face: 1, mouth: 'puzzlement', eyes: 'sad' }, 0);
  sfx('scared', lsm + 10, { who: 'lord', gain: 0.6 });
  const RIDE = lsm + 22;
  hopTo('lord', lsm + 12, RIDE, LBX, GROUND, GLX, QY - QH / 2 - 60, 140, { land: false });
  key('lord', RIDE, { sx: 1.3, sy: 0.75 }, 1); key('lord', RIDE + 4, { sx: 1, sy: 1 }, 3);
  SQ.glow.push({ f0: RIDE, at: [GLX, QY], rot: 0 }, { f0: RIDE + 3, f1: RIDE + 8, a: [GLX, QY], b: [GLX, QY - 40], rot0: 0, rot1: -Math.PI / 2 });
  const FLY = RIDE + 8, AWAY = FLY + 22;
  SQ.glow.push({ f0: FLY, ride: [GLX, 2400, AWAY, QY - 40] });
  JETS.push({ f0: FLY, f1: AWAY, id: 'glow', to: (f, S) => { const q = squidAt('glow', f, S); return [q.x - 420, q.y + 40]; } });
  SQZ.push([FLY - 2, 'glow']);
  sfx('spit', FLY, { x: GLX, gain: 0.9 }); sfx('gust', FLY, { x: 1600, dur: 22, gain: 0.8 }); sfx('whoosh', FLY + 2, { x: 1700, dur: 18, gain: 0.7 });
  LATE.push(() => { for (let f = RIDE + 1; f <= AWAY; f++) { const q = squidAt('glow', f, ST.stateAt(f)); move('lord', f, { x: q.x, y: q.y - QS * 0.5 + 10 }, 'lin'); } });
  key('lord', FLY, { mouth: 'puzzlement', eyes: 'sad' }, 0);
  sfx('scared', FLY + 2, { who: 'lord', gain: 0.8 });
  ev('twinkle', { f: AWAY - 2, at: [1830, QY - 140], n: 22, size: 56 });
  key('pink', FLY + 4, { mouth: 'happy with theeth', eyes: 'normal' }, 0);
  sfx('ref:laugh', FLY + 4, { who: 'pink', gain: 0.85, pitch: 1.35 });
  chuckle('pink', FLY + 4, FLY + 22, { mouth: 'happy with theeth' });

  // ---- синий кальмар ковыляет к Розовой — она гладит его
  const QX3 = 640, CW = AWAY - 4;
  for (let k = 0; k < 4; k++) { const a = CW + k * 7, x0 = E.lerp(QX2, QX3, k / 4), x1 = E.lerp(QX2, QX3, (k + 1) / 4); SQ.blue.push({ f0: a, f1: a + 7, a: [x0, QY], b: [x1, QY], arc: 30, rot0: 0, rot1: 0 }); sfx('squish', a + 7, { x: x1, gain: 0.35 }); }
  SQ.blue.push({ f0: CW + 28, at: [QX3, QY], rot: 0 });
  const PET = CW + 30;
  key('pink', PET - 6, { lean: 22, hip: [0, ST.toRig('pink', 120)], head: 8, handF: hand('pink', 'F', 0.75, 0.45), mouth: 'happy with theeth', eyes: 'normal' }, 6);
  for (let k = 0; k < 3; k++) { key('pink', PET + k * 6, { handF: hand('pink', 'F', 0.85, 0.35) }, 3); key('pink', PET + k * 6 + 3, { handF: hand('pink', 'F', 0.65, 0.4) }, 3); }
  SQZ.push([PET, 'blue'], [PET + 12, 'blue']);
  ev('hearts', { who: 'pink', f0: PET, f1: PET + 30, snd: false, part: 'top' });
  sfx('love', PET, { who: 'pink', gain: 0.6 });
  key('pink', PET + 20, { ...stance('pink', PX2, 1), lean: 0, head: 0, hip: [0, 0] }, 8);

  // ---- в центр, руки вверх
  const WIN = victory('pink', PET + 30, PX2, { n: 9, stride: 140 });
  for (const fn of LATE) fn();
  window.T = { ON, PB, GR, SH, LB, L0, SL, psm, ON2, SL2, lsm, PB2, RIDE, FLY, WIN };
};

// ------------------------------------------------------------------ рисование
const t0 = (f) => f / FPS;
function drawSquid(ctx, id, f, S) { const q = squidAt(id, f, S); if (q) FX.mcSquid(ctx, q.x, q.y, QS, q.rot, q.sq, t0(f), id === 'glow'); }
const front = (id, f) => { const c = segAt(SQ[id], f); return c && (c.hold || c.lasso || c.ride || c.f1); };
ST.hooks.beforeChars.push((ctx, f, S, CAM) => {
  ctx.setTransform(...CAM);
  for (const p of PUD) if (f >= p.f0 && (!p.f1 || f < p.f1)) FX.inkPuddle(ctx, p.x, GROUND + 8, p.w * Math.min(1, (f - p.f0 + 2) / (p.grow || 6)));
  for (const id of ['blue', 'glow']) if (!front(id, f)) drawSquid(ctx, id, f, S);
});
ST.hooks.afterChars.push((ctx, f, S, CAM) => {
  ctx.setTransform(...CAM);
  for (const id of ['blue', 'glow']) if (front(id, f)) drawSquid(ctx, id, f, S);
  for (const j of JETS) {
    if (f < j.f0 || f >= j.f1) continue;
    const q = squidAt(j.id, f, S); if (!q) continue;
    const m = mouthOf(q), to = P(j.to, f, S);
    FX.foamJet(ctx, m[0], m[1], to[0], to[1], t0(f), 30, j.f0, '#23232e', '#000000');
  }
  // чернильный дождь из крутящегося светящегося кальмара
  if (f >= RAIN.f0) {
    for (let k = RAIN.f0; k <= Math.min(f, RAIN.f1); k += 1) {
      const d = f - k; if (d > 30) continue;
      const Sk = statesAt(k), q = squidAt(RAIN.sq, k, Sk); if (!q) continue;
      const m = mouthOf(q), r = FX.rng(k * 13 + 1);
      const vx = -20 - r() * 16, vy = -10 - r() * 8;
      const x = m[0] + vx * d, y = m[1] + vy * d + 1.4 * d * d;
      if (y > GROUND) continue;
      FX.puff(ctx, x, y, 9 + r() * 7, 1, '#23232e', '#000000');
    }
  }
  for (const s of SPL) {
    if (f < s.f0 || (s.f1 && f >= s.f1)) continue;
    const p = target(`${s.who}:${s.part}`, S);
    FX.gumSplat(ctx, p[0], p[1], s.s * Math.min(1, (f - s.f0 + 2) / 3), s.seed, '#23232e', '#000000');
  }
  for (const s of SPLASH) {
    if (s.ink) { const u = (f - s.f) / 18; if (u < 0 || u > 1) continue; const r = FX.rng(s.f); for (let i = 0; i < 12; i++) { const a = -Math.PI * r(), v = (140 + 220 * r()) * s.size; FX.puff(ctx, s.at[0] + Math.cos(a) * v * u, s.at[1] + Math.sin(a) * v * u + 260 * u * u, (14 + 10 * r()) * (1 - 0.5 * u) * Math.max(0.6, s.size), 1 - u, '#23232e', '#000'); } }
    else FX.waterSplash(ctx, s.at[0], s.at[1], (f - s.f) / 18, s.size, s.f);
  }
});

ST.start(BIG);
