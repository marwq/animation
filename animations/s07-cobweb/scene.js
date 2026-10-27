// Серия 2, ролик 07: Паутина — Жёлтая (слева) против Скелета (справа), 22 с, 24 кадра/с. Драка без ударов:
// липкая паутина из майнкрафта: кокон, большая паутина в углу неба, комки паутины, прилип к лицу.
// Музыка превращения — один раз. Фон — тёмный лес.
//
//   0–2 с     шарик-Жёлтая и шарик-Скелет неподвижно стоят друг напротив друга, середина пустая
//   2–4 с     Скелет взлетает и плюёт комком паутины — Жёлтая в коконе, прилипла к траве; он садится ей на макушку
//   4–5.2 с   Жёлтая «растёт» под музыку — кокон рвётся — Скелет влюблён
//   5.4–8.2 с влюблённый Скелет подлетает — она бросает в него клок паутины — его уносит в огромную паутину в небе
//   8.2–9.6 с Скелет «растёт» в паутине — рвёт её и падает на ноги
//   9.7–12 с  машет крыльями — комки паутины: руки прилипли, ноги к траве; щелчок по носу — падает — «пуф»
//   12.2–15.4 с липкий шарик-Жёлтая прыгает и прилипает ему на лицо — он вслепую спотыкается, падает — «пуф»
//   15.5–22 с Жёлтая «растёт», заматывает шарика-Скелета в кокон и пинает за край; в центре, руки вверх
'use strict';

const ST = Stage({
  name: '07 Жёлтая vs Скелет',
  frames: 528,
  cast: {
    yel: { small: ['girl-verity-small', { bodyHeight: 300, recolor: 'yellow' }],
      big: ['verity-big-girl', { height: 730, splitFeet: true, recolor: 'yellow' }], pivot: 337, voice: 1.45, vAngle: 50, lie: 55,
      color: '#ffe23a', moods: { angry: 'angry theeth', grin: 'theeth smile', big: 'theeth smile' } },
    skel: { small: ['skeleton-verity-small', { scale: 0.455 }], big: ['skeleton-verity-big', { height: 730 }], pivot: 325,
      voice: 0.9, lie: 60, color: '#f3f1e6', moods: { angry: 'angry theeth', grin: 'happy with theeth', big: 'theeth smile' } },
  },
  order: ['skel', 'yel'],
  background: { theme: 'darkforest', seed: 1007, sunX: 1300, sunY: 130 },
  clouds: [[150, 80, 2.4, 0, 12], [700, 220, 1.8, 1, 16], [1150, 70, 2.6, 2, 10], [1720, 250, 1.5, 0, 18]],
});
const { FPS, NF, GROUND, C, key, move, ev, sfx, hop, tumble, laugh, tremble, transform, shrink, love, stance, walk, turn,
  kick, fallBack, victory, chuckle, hand, toRig, statesAt, stateAt, target } = ST;
const P = (v, f, S) => (typeof v === 'function' ? v(f, S) : typeof v === 'string' ? target(v, S) : v);
ST.parts.mouth = (ch, st, p) => {
  const name = ch.layers.some((l) => l.name === p.mouth) ? p.mouth : 'smile normal', l = ch.layers.find((x) => x.name === name);
  return l ? E.apply(ch.eyeMatrix(st, name), [(l.bbox[0] + l.bbox[2]) / 2, (l.bbox[1] + l.bbox[3]) / 2]) : ST.parts.lips(ch, st);
};
function flap(f0, f1, gain = 0.6) {
  for (let f = f0; f < f1; f += 6) { key('skel', f, { b_B16: -30, b_B17: 30 }, 3); key('skel', f + 3, { b_B16: 46, b_B17: -46 }, 3, 'in'); }
  key('skel', f1, { b_B16: 0, b_B17: 0 }, 4);
  sfx('gust', f0, { who: 'skel', dur: f1 - f0, gain });
}

// ------------------------------------------------------------------ паутина
const BALLS = [];         // {f0, f1, a, b, arc, r}
const WRAP = [];          // {who, f0, f1, part, w, h, dy}
const STR = [];           // {f0, f1, a, b, sag} — нити к траве
const SHRED = [];         // {f, at, size}
const BIGWEB = { x: 1520, y: 230, r: 250, f0: 1e9, f1: 1e9, tear: 1e9 };
const STUCK = [];         // {who, f0, f1, part, dx, dy, r} — комок на теле
function ball(f0, f1, a, b, o = {}) { BALLS.push({ f0, f1, a, b, arc: o.arc ?? 60, r: o.r || 40 }); sfx('spit', f0, { x: 960, gain: 0.7 }); sfx('whoosh', f0 + 1, { x: 960, dur: f1 - f0, gain: 0.4 }); sfx('squish', f1, { x: 960, gain: 0.8 }); }

const YX0 = 560, SX0 = 1360;
// ================================================================== 0–2 с: неподвижная стойка
key('yel', 0, { form: 'small', x: YX0, y: GROUND, face: 1, look: 1, eyes: 'normal', mouth: 'smile normal', sx: 1, sy: 1, rot: 0, pivot: 0, alpha: 1 }, 0);
key('skel', 0, { form: 'small', x: SX0, y: GROUND, face: -1, look: 1, eyes: 'normal', mouth: 'smile normal', sx: 1, sy: 1, rot: 0, pivot: 0, alpha: 1 }, 0);

const BIG = () => {
  // ---- 2–4 с: комок паутины — кокон — садится ей на макушку
  key('skel', 48, { mouth: 'happy with theeth', eyes: 'angry' }, 0);
  flap(48, 74, 0.6);
  move('skel', 48, { x: SX0, y: GROUND }); move('skel', 58, { x: SX0 - 120, y: GROUND - 280 }, 'out2');
  const SP = 60, HIT = 70;
  key('skel', SP - 3, { sx: 1.12, sy: 0.9 }, 3); key('skel', SP, { sx: 0.9, sy: 1.1 }, 1); key('skel', SP + 3, { sx: 1, sy: 1 }, 3);
  ball(SP, HIT, (f, S) => target('skel:mouth', S), (f, S) => target('yel:body', S), { arc: 40, r: 44 });
  WRAP.push({ who: 'yel', f0: HIT, f1: 0, part: 'body', w: 320, h: 320, dy: 0 });
  for (const dx of [-150, -60, 70, 160]) STR.push({ f0: HIT, f1: 0, a: (f, S) => { const b = target('yel:body', S); return [b[0] + dx * 0.7, b[1] + 60]; }, b: [YX0 + dx, GROUND + 4], sag: 0 });
  key('yel', HIT, { sx: 1.1, sy: 0.92, mouth: 'puzzlement', eyes: 'sad' }, 1); key('yel', HIT + 4, { sx: 1, sy: 1 }, 3);
  tremble('yel', HIT + 4, HIT + 34, YX0, 5);
  for (let f = HIT + 4; f < HIT + 34; f += 6) { key('yel', f + 3, { sx: 1.06, sy: 0.95 }, 3); key('yel', f + 6, { sx: 0.95, sy: 1.06 }, 3); }
  sfx('scared', HIT + 4, { who: 'yel', gain: 0.7 }); sfx('creak', HIT + 6, { who: 'yel', dur: 24, gain: 0.5 });
  // садится на макушку
  const ytop = target('yel:top', stateAt(1))[1], ON = HIT + 10;
  move('skel', HIT, { x: SX0 - 120, y: GROUND - 280 }); move('skel', ON, { x: YX0 + 10, y: ytop + 40 }, 'io');
  key('skel', ON, { sx: 1.2, sy: 0.85, mouth: 'happy with theeth', eyes: 'normal' }, 1); key('skel', ON + 4, { sx: 1, sy: 1 }, 3);
  sfx('bonk', ON, { who: 'yel', gain: 0.8 });
  for (const k of [0, 1]) { const f = ON + 4 + k * 6; move('skel', f, { y: ytop + 40 }); move('skel', f + 3, { y: ytop - 20 }, 'out2'); move('skel', f + 6, { y: ytop + 40 }, 'in2'); sfx('bounce', f + 6, { who: 'skel', gain: 0.4 }); }
  sfx('ref:laugh', ON + 2, { who: 'skel', gain: 0.85, pitch: 1.0 });
  const OFF = ON + 14;
  hop('skel', OFF, OFF + 12, YX0 + 10, 1000, 140);
  move('skel', OFF, { y: ytop + 40 });

  // ---- 4–5.2 с: Жёлтая «растёт» — кокон рвётся — Скелет влюблён
  const YX = 560;
  key('yel', HIT + 22, { eyes: 'angry', mouth: 'angry theeth' }, 0);
  const YB = transform('yel', HIT + 24, YX0, YX, 1, { style: 'grow', love: 'skel', loveDur: 44 });
  WRAP[0].f1 = YB - 6;
  for (const s of STR) s.f1 = YB - 6;
  SHRED.push({ f: YB - 6, at: [YX0, GROUND - 160], size: 1.4 });
  sfx('crunch', YB - 6, { x: YX0, gain: 0.7 });
  key('yel', YB, stance('yel', YX, 1), 0);
  key('yel', YB + 6, { mouth: 'theeth smile', eyes: 'angry' }, 0);

  // ---- 5.4–8.2 с: подлетает — клок паутины — уносит в огромную паутину в небе
  const FL0 = YB + 6, FLX = 860;
  flap(FL0, FL0 + 22, 0.6);
  move('skel', FL0, { x: 1000, y: GROUND }); move('skel', FL0 + 14, { x: FLX, y: GROUND - 300 }, 'io');
  for (let f = FL0 + 14; f < FL0 + 30; f += 8) { move('skel', f + 4, { y: GROUND - 330 }, 'io'); move('skel', f + 8, { y: GROUND - 300 }, 'io'); }
  sfx('kiss', FL0 + 16, { who: 'skel', gain: 0.6 });
  const GR = FL0 + 8;
  key('yel', GR - 4, { lean: 14, hip: [0, toRig('yel', 110)], head: 6 }, 4);
  key('yel', GR, { hitF: 1, hitFto: [YX + 60, GROUND - 40], hitFfix: GR }, 4);
  STUCK.push({ who: 'hand', f0: GR, f1: 0, r: 40 });
  sfx('squish', GR, { who: 'yel', gain: 0.5 });
  const TH = GR + 10, CATCH = TH + 8;
  key('yel', TH - 4, { hitF: 0, handF: hand('yel', 'F', -0.4, -0.6), lean: -8, head: 0, hip: [0, toRig('yel', 8)] }, 4);
  key('yel', TH, { handF: hand('yel', 'F', 0.9, -0.45), lean: 12 }, 3, 'in2');
  key('yel', TH + 8, { ...stance('yel', YX, 1), mouth: 'happy with theeth', eyes: 'angry' }, 8);
  sfx('swing', TH - 2, { who: 'yel', gain: 0.9 });
  STUCK[0].f1 = TH;
  ball(TH, CATCH, (f, S) => C.yel.big.point(S.yel.st, 'handF'), (f, S) => target('skel:body', S), { arc: 30, r: 50 });
  WRAP.push({ who: 'skel', f0: CATCH, f1: 0, part: 'body', w: 300, h: 260, dy: 0 });
  key('skel', CATCH, { mouth: 'puzzlement', eyes: 'sad', pivot: ST.CAST.skel.pivot, b_B16: 0, b_B17: 0 }, 0);
  BIGWEB.f0 = CATCH - 6;
  const WEB = CATCH + 12;
  move('skel', CATCH, { x: FLX, y: GROUND - 300, rot: 0 }); move('skel', WEB, { x: BIGWEB.x, y: BIGWEB.y + 150, rot: 360 }, 'out');
  sfx('whoosh', CATCH, { who: 'skel', dur: 12, gain: 0.7 }); sfx('scared', CATCH + 2, { who: 'skel', gain: 0.8 });
  sfx('boing', WEB, { x: BIGWEB.x, gain: 0.9 });
  key('skel', WEB, { sx: 1.2, sy: 0.85 }, 1); key('skel', WEB + 4, { sx: 1, sy: 1 }, 3);
  key('skel', WEB + 1, { rot: 0 }, 0);
  BIGWEB.bounce = WEB;
  for (let f = WEB + 6; f < WEB + 18; f += 6) { key('skel', f + 3, { rot: 10 }, 3); key('skel', f + 6, { rot: -10 }, 3); }
  sfx('ref:laugh', WEB + 2, { who: 'yel', gain: 0.85, pitch: 1.45 });
  chuckle('yel', WEB + 2, WEB + 18, { mouth: 'happy with theeth' });

  // ---- 8.2–9.6 с: Скелет «растёт» в паутине — рвёт её — падает на ноги
  const SX = 1460;
  key('skel', WEB + 16, { eyes: 'angry', mouth: 'angry theeth', rot: 0 }, 2);
  ev('vein', { who: 'skel', f0: WEB + 14, f1: WEB + 22 });
  const TEAR = WEB + 20;
  BIGWEB.tear = TEAR; WRAP[1].f1 = TEAR;
  SHRED.push({ f: TEAR, at: [BIGWEB.x, BIGWEB.y + 120], size: 1.6 });
  sfx('crunch', TEAR, { x: BIGWEB.x, gain: 0.9 });
  move('skel', TEAR, { x: BIGWEB.x, y: BIGWEB.y + 150 }); move('skel', TEAR + 10, { x: SX, y: GROUND }, 'in2');
  key('skel', TEAR + 10, { sx: 1.3, sy: 0.75 }, 1);
  sfx('fall', TEAR + 10, { who: 'skel', gain: 0.8 });
  const SB = transform('skel', TEAR + 10, SX, SX, -1, { style: 'grow' });
  key('skel', SB, stance('skel', SX, -1), 0);
  key('skel', SB + 6, { mouth: 'angry theeth', eyes: 'angry' }, 0);
  key('yel', SB - 2, { mouth: 'puzzlement', eyes: 'sad' }, 0);

  // ---- 9.7–12 с: комки паутины — она прилипла — щелчок по носу — падает — «пуф»
  const W0 = SB + 4;
  flap(W0, W0 + 24, 0.9);
  key('skel', W0, { lean: 8, mouth: 'happy open mouth' }, 4);
  const parts = [['handF', 0, 0], ['footF', 0, -10], ['footB', 0, -10], ['body', 0, 40]];
  parts.forEach(([p, dx, dy], i) => {
    const a0 = W0 + 2 + i * 5, a1 = a0 + 9;
    const tgt = (f, S) => (p === 'body' ? target('yel:body', S) : p.startsWith('hand') ? C.yel.big.point(S.yel.st, p) : (() => { const st = S.yel.st; const x = S.yel.p[p]; return [S.yel.p.x + (x ? x[0] : 0) * 0, GROUND - 20]; })());
    ball(a0, a1, (f, S) => { const w = target('skel:body', S); return [w[0] - 120, w[1] - 80 + i * 30]; }, p === 'footF' ? [YX + 50, GROUND - 24] : p === 'footB' ? [YX - 50, GROUND - 24] : tgt, { arc: 50, r: 36 });
    STUCK.push({ who: 'yel', p, f0: a1, f1: 0, r: 46, at: p === 'footF' ? [YX + 50, GROUND - 24] : p === 'footB' ? [YX - 50, GROUND - 24] : null });
  });
  const GLUE = W0 + 20;
  key('yel', W0 + 6, { handF: hand('yel', 'F', 0.2, 0.75), handB: hand('yel', 'B', -0.15, 0.75), mouth: 'puzzlement', eyes: 'sad' }, 4);
  tremble('yel', GLUE, GLUE + 22, YX, 3);
  sfx('scared', GLUE, { who: 'yel', gain: 0.7 });
  sfx('ref:laugh', GLUE, { who: 'skel', gain: 0.85, pitch: 1.0 });
  const SX2 = YX + 380;
  walk('skel', GLUE, SX, SX2, 2, 9, -1);
  const FL = GLUE + 22;
  key('skel', FL - 5, { handF: hand('skel', 'F', 0.6, -0.5), mouth: 'happy with theeth', eyes: 'angry' }, 5);
  key('skel', FL, { hitF: 1, hitFto: (() => { const p = target('yel:face', stateAt(FL)); return [p[0] + 30, p[1]]; })(), hitFfix: FL }, 2, 'in2');
  key('skel', FL + 8, { ...stance('skel', SX2, -1), hitF: 0, mouth: 'happy with theeth', eyes: 'normal' }, 8);
  sfx('flick', FL, { who: 'yel', gain: 1.0 });
  const LIE = fallBack('yel', FL + 1, YX, 1, { n: 14, stars: false, mouth: 'puzzlement' });
  for (const s of STUCK) if (s.who === 'yel' && !s.f1) s.f1 = FL + 1;
  SHRED.push({ f: FL + 1, at: [YX, GROUND - 60], size: 0.9 });
  const ysm = shrink('yel', LIE + 4, YX - 100, 1, { mouth: 'puzzlement', eyes: 'sad', smoke: 420 });
  key('yel', ysm, { lean: 0, head: 0, hip: [0, 0], legF: null, legB: null, zB: null, rot: 0 }, 0);
  move('yel', ysm, { x: YX - 100, y: GROUND, rot: 0 });
  WRAP.push({ who: 'yel', f0: ysm, f1: 0, part: 'body', w: 300, h: 300, dy: 0, light: true });
  ev('stars', { who: 'yel', f0: ysm + 4, f1: ysm + 20, snd: false });
  sfx('ref:laugh', LIE + 2, { who: 'skel', gain: 0.85, pitch: 1.0 });
  chuckle('skel', LIE + 2, ysm + 16, { mouth: 'happy with theeth' });

  // ---- 12.2–15.4 с: липкий шарик-Жёлтая — прыг на лицо — он вслепую — падает — «пуф»
  key('yel', ysm + 6, { eyes: 'angry', mouth: 'angry theeth' }, 0);
  const J0 = ysm + 8, J1 = J0 + 12;
  const fc = target('skel:face', stateAt(J1));
  key('yel', J0, { sx: 1.2, sy: 0.82 }, 3);
  move('yel', J0, { x: YX - 100, y: GROUND }); move('yel', J0 + 7, { y: fc[1] - 60 }, 'out2'); move('yel', J1, { x: fc[0] - 10, y: fc[1] + 150 }, 'in2');
  move('yel', J0 + 7, { x: (YX - 100 + fc[0]) / 2 }, 'lin');
  key('yel', J1, { sx: 1.25, sy: 0.8 }, 1); key('yel', J1 + 4, { sx: 1, sy: 1 }, 3);
  sfx('jump', J0 + 2, { who: 'yel', gain: 0.6 }); sfx('squish', J1, { who: 'skel', gain: 1.0 });
  key('skel', J1, { mouth: 'puzzlement', eyes: 'sad', lean: -12, head: -10, handF: hand('skel', 'F', 0.6, -0.75), handB: hand('skel', 'B', 0.4, -0.75) }, 2);
  // она на его лице: следует за головой
  const STAG0 = J1 + 2, STAG1 = STAG0 + 18;
  sfx('scared', STAG0, { who: 'skel', gain: 0.9 });
  move('skel', STAG0, { x: SX2 }); move('skel', STAG1, { x: SX2 + 60 }, 'io');
  for (let f = STAG0; f < STAG1; f += 6) { key('skel', f + 3, { lean: -18, head: -14 }, 3); key('skel', f + 6, { lean: -4, head: -6 }, 3); sfx('step', f + 3, { who: 'skel', gain: 0.5 }); }
  key('skel', STAG1, { ...C.skel.big.feet(SX2 + 60, -1) }, STAG1 - STAG0);
  const LIE2 = fallBack('skel', STAG1, SX2 + 60, -1, { n: 12, stars: false, mouth: 'puzzlement' });
  for (let f = J1 + 1; f <= LIE2; f++) { const p = target('skel:face', stateAt(f)); key('yel', f, { x: p[0] - 10, y: p[1] + 150 }, 1, 'lin'); }
  WRAP[2].f1 = J1;
  hop('yel', LIE2 + 1, LIE2 + 13, target('skel:face', stateAt(LIE2))[0] - 10, 760, 140);
  move('yel', LIE2 + 1, { y: target('skel:face', stateAt(LIE2))[1] + 150 });
  const ssm = shrink('skel', LIE2 + 8, SX2 + 300, -1, { mouth: 'puzzlement', eyes: 'sad', smoke: 420 });
  key('skel', ssm, { lean: 0, head: 0, hip: [0, 0], legF: null, legB: null, zB: null, rot: 0, b_B16: 0, b_B17: 0 }, 0);
  move('skel', ssm, { x: SX2 + 300, y: GROUND, rot: 0 });
  ev('stars', { who: 'skel', f0: ssm + 4, f1: ssm + 24, snd: false });

  // ---- 15.5–22 с: Жёлтая «растёт» — кокон — пинок за край
  const YX3 = 760;
  const YB2 = transform('yel', LIE2 + 10, YX3, YX3, 1, { style: 'grow' });
  key('yel', YB2, stance('yel', YX3, 1), 0);
  key('yel', YB2 + 4, { mouth: 'theeth smile', eyes: 'angry' }, 0);
  const TH2 = YB2 + 4, WR = TH2 + 8;
  key('yel', TH2 - 4, { handF: hand('yel', 'F', -0.3, -0.6), lean: -6 }, 4);
  key('yel', TH2, { handF: hand('yel', 'F', 0.9, -0.2), lean: 10 }, 3, 'in2');
  ball(TH2, WR, (f, S) => C.yel.big.point(S.yel.st, 'handF'), (f, S) => target('skel:body', S), { arc: 40, r: 50 });
  WRAP.push({ who: 'skel', f0: WR, f1: 0, part: 'body', w: 320, h: 300, dy: 0 });
  key('skel', WR, { mouth: 'puzzlement', eyes: 'sad', sx: 1.1, sy: 0.92 }, 1); key('skel', WR + 4, { sx: 1, sy: 1 }, 3);
  const KK = WR + 10;
  walk('yel', TH2 + 6, YX3, SX2 + 100, 1, 8, 1);
  kick('yel', KK, [SX2 + 220, GROUND - 120], { x: SX2 + 100, face: 1, hard: false });
  key('skel', KK, { pivot: ST.CAST.skel.pivot }, 0);
  move('skel', KK, { x: SX2 + 300, y: GROUND, rot: 0 }); move('skel', KK + 22, { x: 2300, y: -150, rot: 900 }, 'out');
  sfx('whoosh', KK, { who: 'skel', dur: 18, gain: 0.7 }); sfx('scared', KK + 2, { who: 'skel', gain: 0.8 });
  ev('twinkle', { f: KK + 18, at: [1820, 150], n: 20, size: 56 });
  sfx('ref:laugh', KK + 6, { who: 'yel', gain: 0.85, pitch: 1.45 });
  key('yel', KK + 8, { mouth: 'happy with theeth', eyes: 'normal' }, 0);
  const WIN = victory('yel', KK + 20, SX2 + 100, { n: 9, stride: 100 });
  window.T = { HIT, ON, YB, CATCH, WEB, TEAR, SB, GLUE, FL, ysm, J1, LIE2, YB2, KK, WIN };
};

// ------------------------------------------------------------------ рисование
ST.hooks.beforeChars.push((ctx, f, S, CAM) => {
  ctx.setTransform(...CAM);
  if (f >= BIGWEB.f0 && f < BIGWEB.tear) {
    const k = E.EASE.out(Math.min(1, (f - BIGWEB.f0) / 8)), b = BIGWEB.bounce && f >= BIGWEB.bounce ? Math.sin((f - BIGWEB.bounce) * 0.9) * 18 * Math.exp(-(f - BIGWEB.bounce) / 10) : 0;
    FX.cobweb(ctx, BIGWEB.x, BIGWEB.y + b, BIGWEB.r, 1, 11, 4, k);
  }
  for (const s of STR) if (f >= s.f0 && (!s.f1 || f < s.f1)) FX.webString(ctx, P(s.a, f, S), s.b, s.sag);
});
ST.hooks.afterChars.push((ctx, f, S, CAM) => {
  ctx.setTransform(...CAM);
  for (const w of WRAP) {
    if (f < w.f0 || (w.f1 && f >= w.f1)) continue;
    const p = target(`${w.who}:${w.part}`, S), big = S[w.who].p.form === 'big';
    FX.webWrap(ctx, p[0], p[1] + w.dy, w.w * (big ? 1.2 : 1), w.h * (big ? 1.4 : 1), f / FPS, w.light ? 0.6 : 1, w.f0);
  }
  for (const s of STUCK) {
    if (f < s.f0 || (s.f1 && f >= s.f1)) continue;
    let p = null;
    if (s.who === 'hand') { if (S.yel.p.form === 'big') p = C.yel.big.point(S.yel.st, 'handF'); }
    else if (s.at) p = s.at;
    else if (s.p === 'body') p = target('yel:body', S);
    else if (S.yel.p.form === 'big') p = C.yel.big.point(S.yel.st, s.p);
    if (p) FX.webBall(ctx, p[0], p[1], s.r, s.f0);
  }
  for (const b of BALLS) {
    const u = (f - b.f0) / (b.f1 - b.f0);
    if (u < 0 || u >= 1) continue;
    const a = P(b.a, b.f0, statesAt(b.f0)), c = P(b.b, b.f1, statesAt(b.f1));
    FX.webBall(ctx, E.lerp(a[0], c[0], u), E.lerp(a[1], c[1], u) - Math.sin(Math.PI * u) * b.arc, b.r, u * 6);
  }
  for (const s of SHRED) { const at = P(s.at, s.f, statesAt(s.f)); FX.blockBurst(ctx, at[0], at[1], (f - s.f) / 20, s.f, ['#ffffff', '#e6ecf5', '#c9d3e0'], 16, 26 * s.size, s.size, GROUND); }
});

ST.start(BIG);
