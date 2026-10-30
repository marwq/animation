// Ролик 22 (бывш. 34): Бочка — Жёлтая (слева) против Малыша (справа), 25 с, 24 кадра/с. Драка без ударов:
// деревянная бочка из майнкрафта: в ней прячутся, её катают, ею накрывают, на ней бегут, как на бревне.
// В начале — считалка «3, 2, 1, FIGHT». Музыка превращения — один раз. Фон — плитки: пурпурная стена, светло-зелёный пол, ромбы.
//
//   0–2.2 с   считалка: шарик-Жёлтая и шарик-Малыш неподвижно стоят друг напротив друга
//   2.2–4 с   с неба падает бочка; Малыш на пропеллере ныряет в неё — бочка подкрадывается к Жёлтой, крышка
//             отлетает — «БУ!» — Жёлтая от испуга подпрыгивает и шлёпается
//   4–5.2 с   Жёлтая «растёт» под музыку — Малыш влюблён
//   5.3–9.3 с накрывает влюблённого Малыша бочкой — бочка бродит вслепую; кладёт её набок и катит —
//             бочка укатывается и возвращается — Малыш вылезает весь закрученный
//   9.3–13.4 с Малыш «растёт», катит бочку ей в ноги — она перепрыгивает, бочка отскакивает обратно и
//             подсекает её — падает — «пуф»
//   13.4–17 с шарик-Жёлтая катит бочку изнутри — Малыш наступает на неё и бежит на месте, как на бревне, —
//             падает — «пуф»
//   17–21 с   Жёлтая «растёт» снова; шарик-Малыш прячется в бочку — она закрывает крышку и катит бочку за край
//   21–25 с   Жёлтая в центре, руки вверх
'use strict';

const ST = Stage({
  name: '22 Жёлтая vs Малыш',
  frames: 600,
  intro: 'countdown-321',
  cast: {
    yel: { small: ['girl-verity-small', { bodyHeight: 300, recolor: 'yellow' }],
      big: ['verity-big-girl', { height: 730, splitFeet: true, recolor: 'yellow' }], pivot: 337, voice: 1.45, vAngle: 50, lie: 55,
      color: '#ffe23a', moods: { angry: 'angry theeth', grin: 'theeth smile', big: 'theeth smile' } },
    baby: { small: ['child-verity-pink', { bodyHeight: 300, spin: { layer: 'hat', cut: 122, axis: 389 } }],
      big: ['child-verity-big', { height: 730, spin: { layer: 'hat', cut: 106, axis: 330 } }], pivot: 338, voice: 1.25,
      lie: 60, color: '#ffd9b8', moods: { angry: ' 2', grin: ' 2', big: 'theeth smile', love: ' 1' } },
  },
  order: ['baby', 'yel'],
  background: { theme: 'tiles', seed: 1022, wall: '#a24fd6', floor: '#a8f08a', motif: 'diamonds', sky: ['#51acf8', '#d9f2ff'] },
  clouds: [[150, 80, 2.4, 0, 12], [700, 220, 1.8, 1, 16], [1150, 70, 2.6, 2, 10], [1720, 250, 1.5, 0, 18]],
});
const { FPS, NF, GROUND, C, key, move, ev, sfx, hop, tumble, laugh, tremble, transform, shrink, stance, walk, stomp,
  slip, fallBack, victory, chuckle, hand, toRig, statesAt, target } = ST;
const P = (v, f, S) => (typeof v === 'function' ? v(f, S) : typeof v === 'string' ? target(v, S) : v);
ST.parts.mouth = (ch, st, p) => (p.form === 'big' ? ST.parts.lips(ch, st) : E.apply(ch.eyeMatrix(st, ' 2'), [315, 740]));
function propeller(who, f0, f1, rps = 7, o = {}) {
  key(who, f0, { spin: 0, spinBlur: 0 }, 0);
  key(who, f0 + 8, { spinBlur: 1 }, 8);
  move(who, f1, { spin: rps * (f1 - f0) / 24 }, 'lin');
  key(who, f1, { spinBlur: 0 }, 6);
  key(who, f1 + 1, { spin: 0 }, 0);
  if (o.snd !== false) sfx('whirr', f0, { who, dur: f1 - f0, gain: o.gain ?? 0.4 });
}

// ------------------------------------------------------------------ бочка
const BS = 360, BR = BS * 0.41;
// стоит: {f0, up:[x], rot, lid} | летит стоя: {f0, f1, a, b, arc, rot0, rot1, ease} | в руках: {f0, hands: who}
// катится набок: {f0, f1, roll: [x0, x1], ease} | лежит набок: {f0, side:[x]}
const BAR = [];
const INSIDE = [];        // {who, f0, f1} — шарик в бочке (не виден)
const LID = [];           // [f, открыта 0..1]
function segAt(segs, f) { let c = null; for (const s of segs) if (f >= s.f0) c = s; return c && !c.gone ? c : null; }
const lerpKeys = (ks, f) => { for (let i = 0; i < ks.length; i++) if (f < ks[i][0]) { if (!i) return ks[0][1]; const [a, x] = ks[i - 1], [b, y] = ks[i]; return E.lerp(x, y, (f - a) / (b - a)); } return ks.length ? ks[ks.length - 1][1] : 0; };
function barAt(f, S) {
  const c = segAt(BAR, f);
  if (!c) return null;
  const lid = lerpKeys(LID, f);
  if (c.up) return { mode: 'up', x: c.up[0], y: c.up[1] ?? GROUND, rot: c.rot || 0, lid, wob: c.wob };
  if (c.hands) { if (S[c.hands].p.form !== 'big') return null; const h = C[c.hands].big.point(S[c.hands].st, 'handF'), g = C[c.hands].big.point(S[c.hands].st, 'handB'); return { mode: 'up', x: (h[0] + g[0]) / 2, y: Math.max(h[1], g[1]) + BS * 0.12, rot: 0, lid }; }
  if (c.side) return { mode: 'side', x: c.side[0], y: GROUND - BR, rot: c.spin0 || 0 };
  if (c.roll) {
    const u = E.clamp((f - c.f0) / (c.f1 - c.f0), 0, 1), e = c.ease ? E.EASE[c.ease](u) : u, x = E.lerp(c.roll[0], c.roll[1], e);
    return { mode: 'side', x, y: GROUND - BR - (c.bump ? Math.abs(Math.sin(u * Math.PI * c.bump)) * 30 : 0), rot: x / BR };
  }
  const u = E.clamp((f - c.f0) / (c.f1 - c.f0), 0, 1), e = c.ease ? E.EASE[c.ease](u) : u;
  const a = P(c.a, c.f0, statesAt(c.f0)), b = P(c.b, f, S);
  return { mode: 'up', x: E.lerp(a[0], b[0], e), y: E.lerp(a[1] ?? GROUND, b[1] ?? GROUND, e) - Math.sin(Math.PI * u) * (c.arc || 0), rot: E.lerp(c.rot0 || 0, c.rot1 || 0, e), lid };
}
const barPt = (f) => { const b = barAt(f, statesAt(f)); return [b.x, b.y]; };
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
  if (o.snd !== false) sfx('jump', f0 + 2, { who, gain: 0.55 });
}
// бочка ковыляет (шагает, покачиваясь) от x0 к x1
function waddle(f0, n, x0, x1, steps = 4) {
  for (let i = 0; i < steps; i++) {
    const a = f0 + i * n / steps, b = a + n / steps, xa = E.lerp(x0, x1, i / steps), xb = E.lerp(x0, x1, (i + 1) / steps);
    BAR.push({ f0: a, f1: b, a: [xa], b: [xb], arc: 40, rot0: (i % 2 ? 0.12 : -0.12), rot1: (i % 2 ? -0.12 : 0.12) });
    sfx('bonk', b, { x: xb, gain: 0.35, pitch: 0.8 });
  }
  BAR.push({ f0: f0 + n, up: [x1], rot: 0 });
}
const LATE = [];

const YX0 = 470, BX0 = 1450, MX = 960, GO = 54;
// ================================================================== 0–2.2 с: считалка, оба стоят
key('yel', 0, { form: 'small', x: YX0, y: GROUND, face: 1, look: 1, eyes: 'normal', mouth: 'smile normal', sx: 1, sy: 1, rot: 0, pivot: 0, alpha: 1 }, 0);
key('baby', 0, { form: 'small', x: BX0, y: GROUND, face: -1, look: 1, eyes: 'normal', mouth: ' 6', sx: 1, sy: 1, rot: 0, pivot: 0, alpha: 1 }, 0);

const BIG = () => {
  // ---- 2.2–4 с: бочка с неба — Малыш ныряет в неё — подкрадывается — «БУ!»
  BAR.push({ f0: GO, f1: GO + 7, a: [1150, -300], b: [1150], ease: 'in2' }, { f0: GO + 7, up: [1150] });
  LID.push([0, 0]);
  sfx('whoosh', GO, { x: 1150, dur: 7, gain: 0.5 }); sfx('slam', GO + 7, { x: 1150, gain: 0.7 }); ev('dust', { f: GO + 7, x: 1150, r: 80, n: 6, snd: false });
  key('yel', GO + 3, { mouth: 'puzzlement' }, 0); key('baby', GO + 3, { mouth: ' 5' }, 0);
  key('baby', GO + 8, { mouth: ' 2', eyes: 'angry' }, 0);
  LID.push([GO + 8, 0], [GO + 12, 1]); sfx('creak', GO + 8, { x: 1150, gain: 0.5 });
  const IN = GO + 22;
  propeller('baby', GO + 9, IN, 8);
  move('baby', GO + 10, { x: BX0, y: GROUND }); move('baby', GO + 16, { x: 1300, y: GROUND - BS - 260 }, 'out2'); move('baby', IN, { x: 1150, y: GROUND - BS * 0.6 }, 'in2');
  INSIDE.push({ who: 'baby', f0: IN, f1: 0 });
  LID.push([IN + 1, 1], [IN + 4, 0]); sfx('bonk', IN + 4, { x: 1150, gain: 0.6 });
  // подкрадывается
  const BX1 = YX0 + 250;
  waddle(IN + 6, 18, 1150, BX1, 3);
  key('yel', IN + 8, { mouth: 'puzzlement', eyes: 'normal', look: 1 }, 0);
  const BOO = IN + 28;
  LID.push([BOO - 1, 0], [BOO + 2, 1]);
  sfx('pop', BOO, { x: BX1, gain: 0.8 }); sfx('ref:grin-hit', BOO + 1, { who: 'yel', gain: 1.0 });
  INSIDE[0].f1 = BOO;
  key('baby', BOO, { pivot: 0, rot: 0, sx: 1, sy: 1, mouth: ' 2', eyes: 'angry' }, 0);
  move('baby', BOO, { x: BX1, y: GROUND - BS * 0.6 }); move('baby', BOO + 4, { y: GROUND - BS - 90 }, 'out2');
  key('baby', BOO + 4, { sx: 1.25, sy: 1.25 }, 2);
  key('yel', BOO + 1, { mouth: 'puzzlement', eyes: 'sad', sx: 0.8, sy: 1.25 }, 1);
  move('yel', BOO + 1, { x: YX0, y: GROUND }); move('yel', BOO + 8, { y: GROUND - 300 }, 'out2'); move('yel', BOO + 15, { x: YX0 - 40, y: GROUND }, 'in2');
  key('yel', BOO + 15, { sx: 1.6, sy: 0.55 }, 1); key('yel', BOO + 22, { sx: 1, sy: 1 }, 6, 'out');
  sfx('scared', BOO + 2, { who: 'yel', gain: 0.8 }); sfx('slam', BOO + 15, { who: 'yel', gain: 0.7 });
  ev('stars', { who: 'yel', f0: BOO + 15, f1: BOO + 28 });
  const BX2 = 1250;
  hopTo('baby', BOO + 6, BOO + 18, BX1, GROUND - BS - 90, BX2, GROUND, 80);
  key('baby', BOO + 6, { sx: 1, sy: 1, mouth: ' 1', eyes: 'normal' }, 2);
  sfx('ref:laugh', BOO + 18, { who: 'baby', gain: 0.85, pitch: 1.3 });
  laugh('baby', BOO + 20, BOO + 30);
  LID.push([BOO + 20, 1], [BOO + 24, 0]);

  // ---- 4–5.2 с: Жёлтая «растёт» — Малыш влюблён
  const YX = 430;
  key('yel', BOO + 20, { eyes: 'angry', mouth: 'angry theeth' }, 0);
  const YB = transform('yel', BOO + 21, YX0 - 40, YX, 1, { style: 'grow', love: 'baby', loveDur: 56 });
  key('yel', YB, stance('yel', YX, 1), 0);
  key('yel', YB + 4, { mouth: 'theeth smile', eyes: 'normal' }, 0);

  // ---- 5.3–9 с: накрывает влюблённого Малыша бочкой — бочка бродит вслепую к ней — набок — катит — возвращается
  const BX3 = 1000;
  hopTo('baby', YB + 4, YB + 14, BX2, GROUND, BX3, GROUND, 70);
  ev('hearts', { who: 'baby', f0: YB + 14, f1: YB + 36, snd: false });
  const GR = YB + 6;
  key('yel', GR - 5, { lean: 26, hip: [0, toRig('yel', 160)], head: 6 }, 5);
  key('yel', GR, { hitF: 1, hitB: 1, hitFto: [BX1 + 70, GROUND - 160], hitBto: [BX1 - 70, GROUND - 160] }, 4);
  BAR.push({ f0: GR, hands: 'yel' });
  sfx('pop', GR, { who: 'yel', gain: 0.4 });
  key('yel', GR + 8, { ...stance('yel', YX, 1), hitF: 0, hitB: 0, handF: hand('yel', 'F', 0.3, -0.95), handB: hand('yel', 'B', 0.2, -0.95) }, 8);
  const PUT = GR + 16, COV = PUT + 10;
  key('yel', PUT, { handF: hand('yel', 'F', 0.95, -0.2), handB: hand('yel', 'B', 0.85, -0.2), lean: 14 }, 4, 'in2');
  BAR.push({ f0: PUT, f1: COV, a: (f, S) => barPt(PUT - 1), b: [BX3], arc: 140, rot0: 0, rot1: Math.PI * 2 }, { f0: COV, up: [BX3] });
  sfx('whoosh', PUT, { x: 800, dur: 10, gain: 0.5 }); sfx('slam', COV, { x: BX3, gain: 0.8 });
  INSIDE.push({ who: 'baby', f0: COV, f1: 0 });
  key('yel', PUT + 10, { ...stance('yel', YX, 1), mouth: 'happy with theeth', eyes: 'normal' }, 6);
  sfx('ref:laugh', COV + 2, { who: 'yel', gain: 0.85, pitch: 1.45 });
  chuckle('yel', COV + 2, COV + 20, { mouth: 'happy with theeth' });
  // бродит вслепую — прямо к ней
  const BW = 700;
  waddle(COV + 4, 18, BX3, BW, 3);
  sfx('scared', COV + 6, { x: 900, gain: 0.5, pitch: 1.3 });
  const TIP = COV + 24;
  key('yel', TIP - 4, { lean: 24, hip: [0, toRig('yel', 120)], hitF: 1, hitFto: [BW - 90, GROUND - 200] }, 4);
  BAR.push({ f0: TIP, f1: TIP + 6, a: [BW], b: [BW], rot0: 0, rot1: Math.PI / 2 }, { f0: TIP + 6, side: [BW + 30], spin0: 0 });
  sfx('bonk', TIP + 6, { x: BW, gain: 0.7 });
  const PUSH = TIP + 9;
  key('yel', PUSH, { hitFto: [BW - 60, GROUND - BR], lean: 30 }, 3, 'in2');
  key('yel', PUSH + 6, { hitF: 0, ...stance('yel', YX, 1), mouth: 'happy with theeth' }, 6);
  sfx('slide', PUSH, { x: 1300, gain: 0.6, pitch: 0.8 });
  const EDGE = PUSH + 16, RET = EDGE + 20;
  BAR.push({ f0: PUSH, f1: EDGE, roll: [BW + 30, 1800], ease: 'out2' }, { f0: EDGE, f1: RET, roll: [1800, 1180], ease: 'io' }, { f0: RET, side: [1180], spin0: 1180 / BR });
  sfx('bonk', EDGE, { x: 1800, gain: 0.7 }); sfx('slide', EDGE + 2, { x: 1500, gain: 0.5, pitch: 0.8 });
  // Малыш вылезает весь закрученный
  const OUT = RET + 3;
  INSIDE[1].f1 = OUT;
  key('baby', OUT, { pivot: ST.CAST.baby.pivot, rot: 0, mouth: ' 5', eyes: 'sad', sx: 1, sy: 1 }, 0);
  move('baby', OUT, { x: 1180 + 150, y: GROUND - 40, rot: 0 }); move('baby', OUT + 10, { x: 1330, y: GROUND, rot: 360 }, 'out2');
  key('baby', OUT + 11, { rot: 0, pivot: 0 }, 0);
  ev('stars', { who: 'baby', f0: OUT + 2, f1: OUT + 20 });
  sfx('dizzy', OUT + 2, { who: 'baby', dur: 16, gain: 0.6 });
  key('baby', OUT + 11, { rot: 12, pivot: ST.CAST.baby.pivot }, 2); key('baby', OUT + 14, { rot: -12 }, 3); key('baby', OUT + 17, { rot: 0 }, 2);

  // ---- 9–13 с: Малыш «растёт», катит бочку ей в ноги — перепрыгивает — бочка отскакивает — подсекает
  key('baby', OUT + 16, { eyes: 'angry', mouth: ' 2' }, 0);
  const BX = 1450, BB = transform('baby', OUT + 18, 1330, BX, -1, { style: 'grow' });
  key('baby', BB, stance('baby', BX, -1), 0);
  key('baby', BB + 4, { mouth: 'theeth smile', eyes: 'angry' }, 0);
  key('yel', BB - 2, { mouth: 'puzzlement', eyes: 'sad' }, 0);
  const BX4 = 1340;
  walk('baby', BB + 2, BX, BX4, 1, 9, -1);
  const SHV = BB + 14;
  key('baby', SHV - 4, { lean: 26, hip: [0, toRig('baby', 160)], hitF: 1, hitFto: [1180 + 70, GROUND - BR] }, 4);
  key('baby', SHV, { hitFto: [1180 + 30, GROUND - BR], lean: 32 }, 2, 'in2');
  key('baby', SHV + 6, { hitF: 0, ...stance('baby', BX4, -1), mouth: 'happy with theeth' }, 6);
  sfx('swing', SHV, { who: 'baby', gain: 0.7 }); sfx('slide', SHV, { x: 1000, gain: 0.7, pitch: 0.9 });
  const YJ = 760;
  walk('yel', BB + 4, YX, YJ, 2, 8, 1);
  const JMP = SHV + 8, WALL = SHV + 20, BACK = WALL + 14;
  BAR.push({ f0: SHV, f1: WALL, roll: [1180, 150], ease: 'in' }, { f0: WALL, f1: BACK, roll: [150, YJ], ease: 'out2' });
  key('yel', JMP - 4, { hip: [0, toRig('yel', 90)], mouth: 'puzzlement', eyes: 'sad' }, 4);
  move('yel', JMP, { x: YJ, y: GROUND }); move('yel', JMP + 5, { y: GROUND - 220 }, 'out2'); move('yel', JMP + 10, { y: GROUND }, 'in2');
  key('yel', JMP, { legFfk: 1, legBfk: 1, legF: [-40, 80, 0], legB: [20, 80, 0], hip: [0, 0] }, 2);
  key('yel', JMP + 10, { legFfk: 0, legBfk: 0, legF: null, legB: null, ...stance('yel', YJ, 1) }, 3);
  sfx('jump', JMP, { who: 'yel', gain: 0.6 }); sfx('land', JMP + 10, { who: 'yel', gain: 0.5 });
  key('yel', JMP + 12, { mouth: 'happy with theeth', eyes: 'normal' }, 0);
  sfx('ref:laugh', JMP + 12, { who: 'yel', gain: 0.6, pitch: 1.45 });
  sfx('bonk', WALL, { x: 150, gain: 0.7 });
  const TRIP = BACK - 3;
  const FB = fallBack('yel', TRIP, YJ, 1, { n: 14, stars: 26 });
  sfx('bonk', TRIP, { who: 'yel', gain: 0.8 });
  BAR.push({ f0: BACK, f1: BACK + 10, roll: [YJ, YJ + 100], ease: 'out2' }, { f0: BACK + 10, side: [YJ + 100], spin0: (YJ + 100) / BR });
  sfx('ref:laugh', TRIP + 4, { who: 'baby', gain: 0.85, pitch: 1.2 });
  chuckle('baby', TRIP + 4, TRIP + 36, { mouth: 'happy with theeth' });
  const YBX = 640;
  const ysm = shrink('yel', FB + 6, YBX, 1, { mouth: 'puzzlement', eyes: 'sad', smoke: 420 });
  key('yel', ysm, { lean: 0, head: 0, hip: [0, 0], legF: null, legB: null, zB: null, rot: 0 }, 0);
  move('yel', ysm, { x: YBX, y: GROUND, rot: 0 });
  ev('stars', { who: 'yel', f0: ysm + 4, f1: ysm + 14, snd: false });

  // ---- 13–16.5 с: шарик-Жёлтая катит бочку изнутри — Малыш наступает и бежит на месте — падает — «пуф»
  key('yel', ysm + 4, { eyes: 'angry', mouth: 'theeth smile' }, 0);
  const BXS = YJ + 100, INB = ysm + 14;
  hopTo('yel', ysm + 6, INB, YBX, GROUND, BXS - 40, GROUND - BR, 100, { land: false });
  INSIDE.push({ who: 'yel', f0: INB, f1: 0 });
  sfx('bonk', INB, { x: BXS, gain: 0.5 });
  const RL = INB + 4, UNDER = RL + 12;
  BAR.push({ f0: RL, f1: UNDER, roll: [BXS, BX4 - 40], ease: 'in2' });
  sfx('slide', RL, { x: 1200, gain: 0.6, pitch: 0.9 });
  key('baby', UNDER - 6, { mouth: 'puzzlement', eyes: 'sad', head: 0, lean: 0 }, 2);
  // бочка — под ноги: ноги вылетают вверх, падает на спину
  const LOG1 = UNDER;
  const FB2 = fallBack('baby', UNDER, BX4, -1, { forward: true, n: 14, stars: 24 });
  sfx('bonk', UNDER, { who: 'baby', gain: 0.8 });
  const BXE = 1620;
  BAR.push({ f0: LOG1, f1: LOG1 + 16, roll: [BX4 - 40, BXE], ease: 'out2' }, { f0: LOG1 + 16, side: [BXE], spin0: BXE / BR });
  INSIDE[2].f1 = LOG1 + 16;
  key('yel', LOG1 + 16, { sx: 1, sy: 1, rot: 0, pivot: 0, mouth: 'happy with theeth', eyes: 'normal' }, 0);
  move('yel', LOG1 + 16, { x: BXE - 140, y: GROUND - 40 }); move('yel', LOG1 + 24, { y: GROUND - 420 }, 'out2'); move('yel', LOG1 + 32, { x: 480, y: GROUND }, 'in2'); move('yel', LOG1 + 32, { x: 480 }, 'lin');
  sfx('pop', LOG1 + 16, { x: 600, gain: 0.6 });
  sfx('ref:laugh', LOG1 + 32, { who: 'yel', gain: 0.85, pitch: 1.45 });
  key('yel', LOG1 + 32, { sx: 1.25, sy: 0.8 }, 1); key('yel', LOG1 + 36, { sx: 1, sy: 1 }, 3); sfx('land', LOG1 + 32, { who: 'yel', gain: 0.5 });
  sfx('jump', LOG1 + 17, { who: 'yel', gain: 0.5 });
  const BBX = 1000;
  const bsm = shrink('baby', FB2 + 6, BBX, -1, { mouth: ' 5', eyes: 'sad', smoke: 420 });
  key('baby', bsm, { lean: 0, head: 0, hip: [0, 0], legF: null, legB: null, zB: null, rot: 0, legFfk: 0, legBfk: 0 }, 0);
  move('baby', bsm, { x: BBX, y: GROUND, rot: 0 });
  ev('stars', { who: 'baby', f0: bsm + 4, f1: bsm + 14, snd: false });

  // ---- 16.5–21 с: Жёлтая «растёт» снова; шарик-Малыш прячется на бочке — она топает — бочка укатывается с ним за край
  const YX2 = 560, YB2 = transform('yel', LOG1 + 36, 480, YX2, 1, { style: 'grow' });
  key('yel', YB2, stance('yel', YX2, 1), 0);
  key('yel', YB2 + 4, { mouth: 'theeth smile', eyes: 'angry' }, 0);
  key('baby', bsm + 6, { face: 1, mouth: ' 5', eyes: 'sad' }, 0);
  sfx('scared', YB2 + 2, { who: 'baby', gain: 0.7 });
  const HOPON = YB2 + 4;
  LATE.push(() => { hopTo('baby', HOPON, HOPON + 12, BBX, GROUND, BXE, GROUND - 2 * BR + 8, 160, { land: false }); });
  key('baby', HOPON + 12, { sx: 1.25, sy: 0.8 }, 1); key('baby', HOPON + 16, { sx: 1, sy: 1 }, 3);
  const TAP = HOPON + 18;
  stomp('yel', TAP, YX2, YX2, 1, { n: 10, h: 70 });
  const ROLL = TAP + 10, GONE = ROLL + 30;
  BAR.push({ f0: ROLL, f1: GONE, roll: [BXE, 2500], ease: 'in2' });
  sfx('slide', ROLL, { x: 1700, gain: 0.7, pitch: 0.8 }); sfx('scared', ROLL + 2, { who: 'baby', gain: 0.8 });
  LATE.push(() => { for (let g = HOPON + 13; g <= GONE; g++) { const q = barAt(g, ST.stateAt(g)); move('baby', g, { x: q.x, y: q.y - BR + 8 }, 'lin'); } });
  for (let g = ROLL; g < GONE; g += 6) { key('baby', g, { rot: 14, pivot: ST.CAST.baby.pivot }, 3); key('baby', g + 3, { rot: -14 }, 3); }
  key('yel', ROLL + 8, { mouth: 'happy with theeth', eyes: 'normal' }, 0);
  sfx('ref:laugh', ROLL + 8, { who: 'yel', gain: 0.85, pitch: 1.45 });
  chuckle('yel', ROLL + 8, ROLL + 22, { mouth: 'happy with theeth' });

  // ---- 21–25 с: в центр, руки вверх
  const WIN = victory('yel', ROLL + 22, YX2, { n: 9, stride: 130 });
  for (const fn of LATE) fn();
  window.T = { IN, BOO, YB, GR, COV, TIP, PUSH, RET, OUT, BB, SHV, TRIP, ysm, INB, LOG1, bsm, YB2, TAP, HOPON, WIN };
};

// ------------------------------------------------------------------ рисование
const hidden = (who, f) => INSIDE.some((s) => s.who === who && f >= s.f0 && (!s.f1 || f < s.f1));
ST.hooks.drawPose = (who, p, f) => (hidden(who, f) ? { ...p, alpha: 0 } : p);
function drawBar(ctx, f, S) {
  const b = barAt(f, S);
  if (!b) return;
  if (b.mode === 'side') FX.mcBarrelEnd(ctx, b.x, b.y, BR, b.rot);
  else FX.mcBarrel(ctx, b.x, b.y, BS, b.rot, b.lid);
}
const barFront = (f) => { const c = segAt(BAR, f); return c && (c.hands || (c.f1 && c.arc && c.arc > 50)); };
ST.hooks.beforeChars.push((ctx, f, S, CAM) => { ctx.setTransform(...CAM); if (!barFront(f)) drawBar(ctx, f, S); });
ST.hooks.afterChars.push((ctx, f, S, CAM) => { ctx.setTransform(...CAM); if (barFront(f)) drawBar(ctx, f, S); });

ST.start(BIG);
