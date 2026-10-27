// Серия 2, ролик 05: Пицца — Жёлтая (слева) против Малыша (справа), 22 с, 24 кадра/с. Драка без ударов:
// пицца с неба, кусок на лицо, пицца-фрисби накрывает с головой, тянущийся сыр как рогатка, пицца-батут.
// Музыка превращения — один раз. Фон — деревня.
//
//   0–2 с     шарик-Жёлтая и шарик-Малыш неподвижно стоят друг напротив друга, середина пустая
//   2–4 с     с неба падает пицца; Малыш на пропеллере хватает кусок ртом и роняет Жёлтой на лицо — прилип
//   4–5.2 с   Жёлтая «растёт» под музыку — Малыш влюблён
//   5.4–8.2 с крутит пиццу на пальце и бросает фрисби — пицца накрывает Малыша, он бегает вслепую под пиццей
//   8.3–9.6 с Малыш «растёт» — пицца слетает
//   9.8–13.2 с тянет кусок у неё из руки — сыр тянется как резинка — отпускает: кусок ей в лицо — «пуф»
//   13.4–16.5 с шарик-Жёлтая прыгает на пиццу как на батут — взлетает и падает ему на голову — он падает — «пуф»
//   16.5–22 с Жёлтая «растёт» снова, щелчком отправляет шарика-Малыша за край; в центре, руки вверх
'use strict';

const ST = Stage({
  name: '05 Жёлтая vs Малыш',
  frames: 528,
  cast: {
    yel: { small: ['girl-verity-small', { bodyHeight: 300, recolor: 'yellow' }],
      big: ['verity-big-girl', { height: 730, splitFeet: true, recolor: 'yellow' }], pivot: 337, voice: 1.45, vAngle: 50, lie: 55,
      color: '#ffe23a', moods: { angry: 'angry theeth', grin: 'theeth smile', big: 'theeth smile' } },
    baby: { small: ['child-verity-pink', { bodyHeight: 300, spin: { layer: 'hat', cut: 122, axis: 389 } }],
      big: ['child-verity-big', { height: 730, spin: { layer: 'hat', cut: 106, axis: 330 } }], pivot: 338, voice: 1.25,
      lie: 60, color: '#ffd9b8', moods: { angry: ' 2', grin: ' 2', big: 'theeth smile', love: ' 1' } },
  },
  order: ['baby', 'yel'],
  background: { theme: 'village', seed: 1005, sunX: 1520, sunY: 130 },
  clouds: [[150, 80, 2.4, 0, 12], [700, 220, 1.8, 1, 16], [1150, 70, 2.6, 2, 10], [1720, 250, 1.5, 0, 18]],
});
const { FPS, NF, GROUND, C, key, move, ev, sfx, hop, laugh, tremble, transform, shrink, stance, walk, turn,
  fallBack, victory, chuckle, hand, toRig, statesAt, stateAt, target } = ST;
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

// ------------------------------------------------------------------ пицца
const PR = 170, PIZ = [];   // {f0, at, sy, rot, gone} | {f0, f1, a, b, arc, spin, sy0, sy1} | {f0, hand, spin} | {f0, on, dy}
const SL = [];              // кусок: {segs: [...] как выше, + {f0, on, part, dx, dy, rot}}
const CHEESE = [];          // {f0, f1, a, b, sag}
let GONE = 0;
const GONEK = [[0, 0]];
const goneAt = (f) => GONEK.filter((k) => k[0] <= f).pop()[1];
function segAt(segs, f, S) {
  let c = null;
  for (const s of segs) if (f >= s.f0) c = s;
  if (!c || c.gone) return null;
  const rot = typeof c.rot === 'function' ? c.rot(f) : c.rot || 0;
  if (c.at) return { x: c.at[0], y: c.at[1], rot, sy: c.sy ?? 1 };
  if (c.on) { const p = target(`${c.on}:${c.part || 'top'}`, S), fc = S[c.on].p.face || 1; return { x: p[0] + (c.dx || 0) * fc, y: p[1] + (c.dy || 0), rot: rot * (c.mirror ? fc : 1), sy: c.sy ?? 1 }; }
  if (c.hand) {
    if (S[c.hand].p.form !== 'big') return null;
    const h = C[c.hand].big.point(S[c.hand].st, 'hand' + (c.arm || 'F'));
    return { x: h[0] + (c.dx || 0), y: h[1] + (c.dy || 0), rot: c.spin ? (f - c.f0) * c.spin : rot, sy: c.sy ?? 1 };
  }
  const u = E.clamp((f - c.f0) / (c.f1 - c.f0), 0, 1), e = c.ease ? E.EASE[c.ease](u) : u, a = P(c.a, c.f0, statesAt(c.f0)), b = P(c.b, f, S);
  return { x: E.lerp(a[0], b[0], e), y: E.lerp(a[1], b[1], e) - Math.sin(Math.PI * u) * (c.arc || 0), rot: c.r0 !== undefined ? E.lerp(c.r0, c.r1, u) : u * (c.spin || 0), sy: E.lerp(c.sy0 ?? 1, c.sy1 ?? 1, u) };
}

const YX0 = 560, BX0 = 1360, PX = 960, PLY = GROUND - 22;
// ================================================================== 0–2 с: неподвижная стойка
key('yel', 0, { form: 'small', x: YX0, y: GROUND, face: 1, look: 1, eyes: 'normal', mouth: 'smile normal', sx: 1, sy: 1, rot: 0, pivot: 0, alpha: 1 }, 0);
key('baby', 0, { form: 'small', x: BX0, y: GROUND, face: -1, look: 1, eyes: 'normal', mouth: ' 6', sx: 1, sy: 1, rot: 0, pivot: 0, alpha: 1 }, 0);

const BIG = () => {
  // ---- 2–4 с: пицца с неба — Малыш хватает кусок — роняет Жёлтой на лицо
  PIZ.push({ f0: 48, f1: 58, a: [PX, -200], b: [PX, PLY], sy0: 0.5, sy1: 0.3, r0: 0, r1: 4, ease: 'in2' }, { f0: 58, at: [PX, PLY], sy: 0.3, rot: 0 });
  sfx('whoosh', 48, { x: PX, dur: 10, gain: 0.5 }); sfx('slap', 58, { x: PX, gain: 0.8 }); ev('dust', { f: 58, x: PX, r: 70, n: 6, snd: false });
  ev('twinkle', { f: 60, at: [PX, GROUND - 120], n: 14, size: 46 });
  key('yel', 52, { mouth: 'puzzlement' }, 0); key('baby', 52, { mouth: ' 5' }, 0);
  key('baby', 60, { mouth: ' 2', eyes: 'angry' }, 0);
  sfx('ref:grin-eee', 60, { who: 'baby', gain: 0.4, pitch: 1.3 });
  const F0 = 62, GRB = 70, OVER = 79, DROP = OVER + 2, HIT = DROP + 7;
  propeller('baby', F0, OVER + 22, 10);
  move('baby', F0, { x: BX0, y: GROUND });
  move('baby', GRB, { x: PX + 80, y: GROUND - 60 }, 'io');
  key('baby', GRB, { mouth: ' 1' }, 0);
  const S1 = { segs: [] };
  SL.push(S1);
  S1.segs.push({ f0: GRB, on: 'baby', part: 'mouth', dx: 10, dy: 50, rot: Math.PI });
  GONEK.push([GRB, 1]);
  sfx('chomp', GRB, { who: 'baby', gain: 0.8 });
  CHEESE.push({ f0: GRB, f1: GRB + 8, a: [PX + 40, PLY - 10], b: (f, S) => { const m = target('baby:mouth', S); return [m[0], m[1] + 20]; } });
  move('baby', OVER, { x: YX0 + 10, y: GROUND - 400 }, 'io');
  key('baby', DROP, { mouth: ' 6' }, 0);
  sfx('pop', DROP, { who: 'baby', gain: 0.5 });
  const yface = (f, S) => { const p = target('yel:face', S); return [p[0] - 10, p[1] + 50]; };
  S1.segs.push({ f0: DROP, f1: HIT, a: (f, S) => { const m = target('baby:mouth', statesAt(DROP)); return [m[0] + 10, m[1] + 50]; }, b: yface, r0: Math.PI, r1: Math.PI * 2, ease: 'in2' });
  S1.segs.push({ f0: HIT, on: 'yel', part: 'face', dx: -10, dy: 50, rot: 0 });
  sfx('slap', HIT, { who: 'yel', gain: 1.0 }); sfx('squish', HIT, { who: 'yel', gain: 0.6 });
  key('yel', HIT, { sx: 1.2, sy: 0.84, mouth: 'puzzlement', eyes: 'sad', pivot: ST.CAST.yel.pivot }, 1); key('yel', HIT + 4, { sx: 1, sy: 1 }, 3);
  for (let f = HIT + 2; f < HIT + 14; f += 6) { key('yel', f + 3, { rot: 15 }, 3); key('yel', f + 6, { rot: -15 }, 3); }
  key('yel', HIT + 14, { rot: 0 }, 3);
  sfx('scared', HIT + 4, { who: 'yel', gain: 0.6 });
  move('baby', OVER + 16, { x: BX0 - 80, y: GROUND }, 'io');
  key('baby', OVER + 16, { sx: 1.2, sy: 0.82 }, 1); key('baby', OVER + 20, { sx: 1, sy: 1 }, 3);
  sfx('ref:laugh', OVER + 16, { who: 'baby', gain: 0.85, pitch: 1.3 });
  key('baby', OVER + 16, { mouth: ' 1', eyes: 'normal' }, 0);
  laugh('baby', OVER + 18, OVER + 36);

  // ---- 4–5.2 с: Жёлтая «растёт» — Малыш влюблён — кусок слетает
  const YX = 560;
  key('yel', HIT + 12, { eyes: 'angry', mouth: 'angry theeth' }, 0);
  const YB = transform('yel', HIT + 14, YX0, YX, 1, { style: 'grow', love: 'baby', loveDur: 40 });
  S1.segs.push({ f0: YB - 4, f1: YB + 10, a: (f, S) => { const s = segAt(S1.segs, YB - 5, statesAt(YB - 5)); return [s.x, s.y]; }, b: [300, GROUND - 10], arc: 160, r0: 0, r1: -Math.PI * 2.5 });
  S1.segs.push({ f0: YB + 10, at: [300, GROUND - 10], rot: -Math.PI / 2 });
  key('yel', YB, stance('yel', YX, 1), 0);
  key('yel', YB + 6, { mouth: 'theeth smile', eyes: 'angry' }, 0);

  // ---- 5.4–8.2 с: пицца на пальце — фрисби — накрывает Малыша
  const GR = YB + 8;
  walk('yel', YB + 2, YX, 700, 1, 8, 1);
  key('yel', GR - 4, { lean: 18, hip: [0, toRig('yel', 120)], head: 6 }, 4);
  key('yel', GR, { hitF: 1, hitFto: [PX - 60, PLY], hitFfix: GR }, 4);
  PIZ.push({ f0: GR, hand: 'yel', dx: 0, dy: -18, sy: 0.3, spin: 0.5 });
  sfx('pop', GR, { who: 'yel', gain: 0.5 });
  const SPIN = GR + 8;
  key('yel', SPIN, { hitF: 0, lean: 0, hip: [0, toRig('yel', 8)], head: -4, handF: hand('yel', 'F', 0.3, -0.95), mouth: 'happy with theeth', eyes: 'angry' }, 6);
  sfx('whirr', SPIN, { who: 'yel', dur: 16, gain: 0.5 });
  const TH = SPIN + 14, LAND = TH + 12;
  key('yel', TH - 4, { handF: hand('yel', 'F', -0.4, -0.5), lean: -8 }, 4);
  key('yel', TH, { handF: hand('yel', 'F', 0.95, -0.15), lean: 12 }, 3, 'in2');
  key('yel', TH + 8, { ...stance('yel', 700, 1), mouth: 'happy with theeth', eyes: 'normal' }, 8);
  sfx('swing', TH - 2, { who: 'yel', gain: 0.9 }); sfx('whoosh', TH, { x: 1100, dur: 14, gain: 0.6 });
  const bOver = (f, S) => { const t = target('baby:top', S); return [t[0], t[1] + 10]; };
  PIZ.push({ f0: TH, f1: LAND, a: (f, S) => { const s = segAt(PIZ, TH - 1, statesAt(TH - 1)); return [s.x, s.y]; }, b: bOver, arc: 120, sy0: 0.3, sy1: 0.5, r0: 0, r1: 8 });
  PIZ.push({ f0: LAND, on: 'baby', part: 'top', dx: 0, dy: 10, sy: 0.5, rot: 0, cover: true });
  sfx('slap', LAND, { who: 'baby', gain: 1.0 }); sfx('squish', LAND, { who: 'baby', gain: 0.6 });
  key('baby', LAND, { sx: 1.25, sy: 0.8, mouth: ' 5', eyes: 'sad' }, 1); key('baby', LAND + 4, { sx: 1, sy: 1 }, 3);
  // бегает вслепую под пиццей
  const BX1 = BX0 - 80, R0 = LAND + 6;
  sfx('scared', R0, { who: 'baby', gain: 0.7 });
  const path = [[R0, BX1], [R0 + 10, BX1 + 160], [R0 + 20, BX1 - 60], [R0 + 30, BX1 + 20]];
  for (let i = 1; i < path.length; i++) {
    const [f, x] = path[i];
    move('baby', path[i - 1][0], { x: path[i - 1][1], y: GROUND }); move('baby', (path[i - 1][0] + f) / 2, { y: GROUND - 50 }, 'out2'); move('baby', f, { x, y: GROUND }, 'in2');
    key('baby', f, { sx: 1.15, sy: 0.88 }, 1); key('baby', f + 3, { sx: 1, sy: 1 }, 2);
    sfx('land', f, { who: 'baby', gain: 0.4 });
  }
  sfx('ref:laugh', R0 + 4, { who: 'yel', gain: 0.85, pitch: 1.45 });
  chuckle('yel', R0 + 4, R0 + 26, { mouth: 'happy with theeth' });

  // ---- 8.3–9.6 с: Малыш «растёт» — пицца слетает
  const BX = 1300, BG0 = R0 + 30;
  key('baby', BG0, { eyes: 'angry', mouth: ' 2' }, 0);
  const BB = transform('baby', BG0 + 2, BX1 + 20, BX, -1, { style: 'grow' });
  PIZ.push({ f0: BB - 4, f1: BB + 12, a: (f, S) => { const s = segAt(PIZ, BB - 5, statesAt(BB - 5)); return [s.x, s.y]; }, b: [900, PLY], arc: 200, sy0: 0.5, sy1: 0.3, r0: 0, r1: 5 });
  PIZ.push({ f0: BB + 12, at: [900, PLY], sy: 0.3, rot: 0 });
  sfx('slap', BB + 12, { x: 900, gain: 0.6 });
  key('baby', BB, stance('baby', BX, -1), 0);
  key('baby', BB + 6, { mouth: 'happy with theeth', eyes: 'angry' }, 0);
  key('yel', BB - 2, { mouth: 'puzzlement', eyes: 'sad' }, 0);

  // ---- 9.8–13.2 с: сырная рогатка — кусок ей в лицо — «пуф»
  // она берёт кусок, откусывает — он тянет кусок к себе
  const YX2 = 700, TK = BB + 6;
  key('yel', TK, { handF: hand('yel', 'F', 0.75, -0.2), mouth: 'happy with theeth', eyes: 'normal' }, 4);
  const S2 = { segs: [] };
  SL.push(S2);
  S2.segs.push({ f0: TK, f1: TK + 8, a: [900, PLY], b: (f, S) => C.yel.big.point(S.yel.st, 'handF'), arc: 80, r0: 0, r1: -Math.PI / 2 });
  S2.segs.push({ f0: TK + 8, hand: 'yel', rot: -Math.PI / 2 + 0.2, dx: 0, dy: 0 });
  GONEK.push([TK, 2]);
  ev('twinkle', { f: TK + 8, at: C.yel.big.point(stateAt(TK + 8).yel.st, 'handF'), n: 10, size: 36 });
  // он хватает кончик и тянет
  const PG = TK + 14, BX2 = 1120;
  walk('baby', TK, BX, BX2, 2, 7, -1);
  key('baby', PG, { hitF: 1, hitFto: (() => { const h = C.yel.big.point(stateAt(PG).yel.st, 'handF'); return [h[0] + 90, h[1] - 10]; })(), hitFfix: PG }, 4);
  key('yel', PG + 2, { mouth: 'puzzlement', eyes: 'normal' }, 0);
  const PULL = PG + 4, REL = PULL + 18;
  key('baby', REL, { hitF: 0, lean: -20, hip: [0, toRig('baby', 40)], handF: hand('baby', 'F', 0.7, -0.15), mouth: 'happy with theeth', eyes: 'angry' }, REL - PULL);
  move('baby', PULL, { x: BX2 }); move('baby', REL, { x: BX2 + 140 }, 'io');
  key('baby', REL, { ...C.baby.big.feet(BX2 + 140, -1) }, REL - PULL);
  CHEESE.push({ f0: PULL, f1: REL + 4, a: (f, S) => { const s = segAt(S2.segs, f, S); return [s.x + 60, s.y - 20]; }, b: (f, S) => C.baby.big.point(S.baby.st, 'handF'), sag: 20 });
  sfx('creak', PULL, { who: 'baby', dur: REL - PULL, gain: 0.6 });
  // отпускает — сыр сжимается — кусок ей в лицо
  sfx('boing', REL, { x: 900, gain: 1.0 }); sfx('whoosh', REL, { x: 800, dur: 5, gain: 0.5 });
  const SM = REL + 4;
  S2.segs.push({ f0: REL, f1: SM, a: (f, S) => { const s = segAt(S2.segs, REL - 1, statesAt(REL - 1)); return [s.x, s.y]; }, b: (f, S) => target('yel:face', S), r0: -Math.PI / 2, r1: -Math.PI / 2 + 0.4 });
  S2.segs.push({ f0: SM, on: 'yel', part: 'face', dx: 10, dy: 60, rot: 0.3, mirror: true });
  sfx('slap', SM, { who: 'yel', gain: 1.1 }); sfx('squish', SM, { who: 'yel', gain: 0.6 });
  ev('shake', { f: SM, amp: 14, n: 10 });
  key('yel', SM, { lean: -16, head: -14, mouth: 'puzzlement', eyes: 'sad', handF: hand('yel', 'F', 0.4, -0.7), handB: hand('yel', 'B', -0.4, -0.6) }, 2);
  tremble('yel', SM + 2, SM + 12, YX2, 6);
  const ysm = shrink('yel', SM + 12, YX2, 1, { mouth: 'puzzlement', eyes: 'sad', smoke: 420 });
  S2.segs.push({ f0: SM + 12, f1: SM + 24, a: (f, S) => { const s = segAt(S2.segs, SM + 11, statesAt(SM + 11)); return [s.x, s.y]; }, b: [520, GROUND - 10], arc: 120, r0: 0.3, r1: -Math.PI * 2.5 });
  S2.segs.push({ f0: SM + 24, at: [520, GROUND - 10], rot: -Math.PI / 2 });
  ev('stars', { who: 'yel', f0: ysm + 4, f1: ysm + 22, snd: false });
  key('baby', REL + 2, { ...stance('baby', BX2 + 140, -1) }, 8);
  sfx('ref:laugh', SM + 4, { who: 'baby', gain: 0.85, pitch: 1.2 });
  chuckle('baby', SM + 4, SM + 30, { mouth: 'happy with theeth' });

  // ---- 13.4–16.5 с: шарик-Жёлтая — пицца-батут — ему на голову — он падает — «пуф»
  key('yel', ysm + 8, { eyes: 'angry', mouth: 'angry theeth' }, 0);
  const J0 = ysm + 10, J1 = J0 + 10, J2 = J1 + 14;
  hop('yel', J0, J1, YX2, 900, 90);
  move('yel', J1, { x: 900, y: PLY - 20 });
  key('yel', J1, { sx: 1.35, sy: 0.7 }, 1);
  sfx('boing', J1, { x: 900, gain: 1.0 }); sfx('spring', J1, { x: 900, gain: 0.6 });
  PIZ.push({ f0: J1 + 2, f1: J1 + 22, a: [900, PLY], b: [-260, 300], arc: 200, sy0: 0.3, sy1: 1, r0: 0, r1: -9 }, { f0: J1 + 22, gone: true });
  sfx('whoosh', J1 + 2, { x: 600, dur: 16, gain: 0.5 });
  const bt = (f, S) => { const t = target('baby:top', S); return [t[0], t[1] + 40]; };
  move('yel', J1 + 7, { y: GROUND - 900 }, 'out2');
  const btt = bt(J2, stateAt(J2));
  move('yel', J1 + 7, { x: 1050 }, 'lin');
  move('yel', J2, { x: btt[0], y: btt[1] + 150 }, 'in2');
  key('yel', J1 + 3, { sx: 0.85, sy: 1.18 }, 3); key('yel', J1 + 8, { sx: 1, sy: 1 }, 3);
  key('yel', J2, { sx: 1.3, sy: 0.75 }, 1);
  sfx('bonk', J2, { who: 'baby', gain: 1.0 }); sfx('ref:hit-ow', J2 + 2, { who: 'baby', gain: 0.8 });
  ev('shake', { f: J2, amp: 14, n: 10 });
  key('baby', J2, { hip: [0, toRig('baby', 60)], head: 12, mouth: 'puzzlement', eyes: 'sad', handF: hand('baby', 'F', 0.4, -0.7), handB: hand('baby', 'B', -0.3, -0.7) }, 2);
  hop('yel', J2 + 1, J2 + 13, btt[0], 640, 160);
  move('yel', J2 + 1, { y: btt[1] + 150 });
  ev('stars', { who: 'baby', f0: J2 + 2, f1: J2 + 30 });
  const LIE = fallBack('baby', J2 + 10, BX2 + 140, -1, { n: 12, stars: false });
  const bsm = shrink('baby', LIE + 6, BX2 + 260, -1, { mouth: ' 5', eyes: 'sad', smoke: 420 });
  key('baby', bsm, { lean: 0, head: 0, hip: [0, 0], legF: null, legB: null, zB: null, rot: 0 }, 0);
  move('baby', bsm, { x: BX2 + 260, y: GROUND, rot: 0 });
  ev('stars', { who: 'yel', f0: J2 + 14, f1: J2 + 20, snd: false });
  key('yel', J2 + 14, { mouth: 'happy with theeth', eyes: 'normal' }, 0);

  // ---- 16.5–22 с: Жёлтая «растёт» снова — щелчок — Малыш улетает
  const YB2 = transform('yel', LIE + 2, 640, 640, 1, { style: 'grow' });
  key('yel', YB2, stance('yel', 640, 1), 0);
  const BH = YB2 + 2;
  hop('baby', BH, BH + 8, BX2 + 260, 980, 70);
  key('baby', BH + 8, { mouth: ' 2', eyes: 'angry' }, 0);
  const FL = BH + 12;
  key('yel', FL - 5, { lean: 16, hip: [0, toRig('yel', 120)], head: 6, handF: hand('yel', 'F', 0.6, 0.2) }, 5);
  key('yel', FL, { hitF: 1, hitFto: (() => { const b = target('baby:body', stateAt(FL)); return [b[0] - 60, b[1]]; })(), hitFfix: FL }, 2, 'in2');
  key('yel', FL + 8, { ...stance('yel', 640, 1), hitF: 0, mouth: 'happy with theeth', eyes: 'normal' }, 8);
  sfx('flick', FL, { who: 'baby', gain: 1.0 });
  key('baby', FL, { mouth: ' 5', eyes: 'sad', pivot: ST.CAST.baby.pivot }, 0);
  propeller('baby', FL, FL + 24, 12);
  move('baby', FL, { x: 980, y: GROUND, rot: 0 }); move('baby', FL + 22, { x: 2200, y: -200, rot: 720 }, 'out');
  sfx('whoosh', FL, { who: 'baby', dur: 18, gain: 0.7 }); sfx('scared', FL + 2, { who: 'baby', gain: 0.8 });
  ev('twinkle', { f: FL + 18, at: [1820, 150], n: 20, size: 56 });
  sfx('ref:laugh', FL + 4, { who: 'yel', gain: 0.85, pitch: 1.45 });
  const WIN = victory('yel', FL + 16, 640, { n: 9, stride: 110 });
  window.T = { HIT, YB, TH, LAND, BB, PULL, REL, SM, ysm, J2, LIE, YB2, FL, WIN };
};

// ------------------------------------------------------------------ рисование
const drawPizza = (ctx, f, S, front) => {
  const c = PIZ.filter((s) => f >= s.f0).pop();
  if (!c || (!!c.at === front)) return;
  const p = segAt(PIZ, f, S);
  if (p) FX.pizza(ctx, p.x, p.y, PR, p.rot, p.sy, goneAt(f), 2);
};
const drawSlices = (ctx, f, S, front) => {
  for (const Sl of SL) {
    const c = Sl.segs.filter((s) => f >= s.f0).pop();
    if (!c || (!!c.at === front)) continue;
    const p = segAt(Sl.segs, f, S);
    if (p) FX.pizzaSlice(ctx, p.x, p.y, 140, p.rot);
  }
};
ST.hooks.beforeChars.push((ctx, f, S, CAM) => { ctx.setTransform(...CAM); drawPizza(ctx, f, S, false); drawSlices(ctx, f, S, false); });
ST.hooks.afterChars.push((ctx, f, S, CAM) => {
  ctx.setTransform(...CAM);
  for (const ch of CHEESE) { if (f < ch.f0 || f >= ch.f1) continue; FX.cheeseString(ctx, P(ch.a, f, S), P(ch.b, f, S), ch.sag ?? 30, 12); }
  drawPizza(ctx, f, S, true); drawSlices(ctx, f, S, true);
});

ST.start(BIG);
