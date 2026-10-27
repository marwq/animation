// Серия 2, ролик 03: Присоски — Розовая (слева) против Скелета (справа), 22 с, 24 кадра/с. Драка без ударов:
// стрелы-присоски прилипают ко лбу и к макушке, «чпок!» — красный кружок; вантуз на лицо.
// Музыка превращения — один раз. Фон — берёзовая роща.
//
//   0–2 с     шарик-Розовая и шарик-Скелет неподвижно стоят друг напротив друга, середина пустая
//   2–3.7 с   Скелет плюётся присосками: одна прилипает Розовой ко лбу, другая на макушку — не стряхнуть
//   3.8–5 с   Розовая «растёт» под музыку (присоски так и торчат) — Скелет влюблён
//   5.2–8 с   «чпок!» — отрывает присоски и кидает: одна Скелету на глаза, он взлетает вслепую, вторая на крыло — падает
//   8.3–9.8 с Скелет «чпок» — снимает присоску и «растёт»
//   9.9–13.5 с ловит с неба вантуз, ставит Розовой на лицо, тянет — «ЧПОК!», она падает — «пуф», шарик
//   13.6–16.5 с шарик-Розовая прыгает на вантуз — он взлетает и прилипает Скелету на лицо — тот вслепую улетает
//   16.5–22 с Розовая «растёт» снова и в центре, руки вверх
'use strict';

const ST = Stage({
  name: '03 Розовая vs Скелет',
  frames: 528,
  cast: {
    pink: { small: ['girl-verity-small', { bodyHeight: 300 }], big: ['girl-verity-big', { height: 730, splitFeet: true }],
      pivot: 337, voice: 1.35, vAngle: 50, lie: 55, color: '#ff4fc8', moods: { angry: 'angry theeth', grin: 'theeth smile', big: 'theeth smile' } },
    skel: { small: ['skeleton-verity-small', { scale: 0.455 }], big: ['skeleton-verity-big', { height: 730 }], pivot: 325,
      voice: 0.9, lie: 60, color: '#f3f1e6', moods: { angry: 'angry theeth', grin: 'happy with theeth', big: 'theeth smile' } },
  },
  order: ['pink', 'skel'],
  background: { theme: 'birch', seed: 1003, sunX: 1520, sunY: 130 },
  clouds: [[150, 80, 2.4, 0, 12], [700, 220, 1.8, 1, 16], [1150, 70, 2.6, 2, 10], [1720, 250, 1.5, 0, 18]],
});
const { FPS, NF, GROUND, C, key, move, ev, sfx, hop, laugh, tremble, transform, shrink, love, stance, walk, turn,
  fallBack, flyOff, victory, chuckle, hand, toRig, statesAt, stateAt, target } = ST;
const P = (v, f, S) => (typeof v === 'function' ? v(f, S) : typeof v === 'string' ? target(v, S) : v);
function flap(f0, f1, gain = 0.6) {
  for (let f = f0; f < f1; f += 6) { key('skel', f, { b_B16: -30, b_B17: 30 }, 3); key('skel', f + 3, { b_B16: 46, b_B17: -46 }, 3, 'in'); }
  key('skel', f1, { b_B16: 0, b_B17: 0 }, 4);
  sfx('gust', f0, { who: 'skel', dur: f1 - f0, gain });
}

// ------------------------------------------------------------------ присоски, следы, вантуз
const AL = 150;
const ARW = [];           // {segs: [{f0, f1, a, b, arc, rot} | {f0, on, part, dx, dy, rot} | {f0, hand, rot} | {f0, gone}]}
const MARK = [];          // {who, part, dx, dy, f0, f1, r}
const PL = [];            // вантуз: {f0, f1, a, b, arc, r0, r1} | {f0, hand, rot} | {f0, on, part, dx, dy, rot} | {f0, at, rot}
const PLL = 250, PLS = 130, GRIP = PLS * 0.45 + PLL * 0.85;
const wob = (f, f0, k = 0.3) => Math.sin((f - f0) * 1.3) * k * Math.exp(-(f - f0) / 14);
function segAt(segs, f, S, L = AL) {
  let c = null;
  for (const s of segs) if (f >= s.f0) c = s;
  if (!c || c.gone) return null;
  const rot = typeof c.rot === 'function' ? c.rot(f) : c.rot || 0;
  if (c.on) { const p = target(`${c.on}:${c.part}`, S), fc = c.mirror ? (S[c.on].p.face || 1) : 1; return { x: p[0] + (c.dx || 0) * fc, y: p[1] + (c.dy || 0), rot: rot + wob(f, c.f0) }; }
  if (c.hand) {
    if (S[c.hand].p.form !== 'big') return null;
    const h = C[c.hand].big.point(S[c.hand].st, 'hand' + (c.arm || 'F'));
    return { x: h[0] + Math.cos(rot) * (c.grip ?? L * 0.6), y: h[1] + Math.sin(rot) * (c.grip ?? L * 0.6), rot };
  }
  if (c.at) return { x: c.at[0], y: c.at[1], rot };
  const u = E.clamp((f - c.f0) / (c.f1 - c.f0), 0, 1), e = c.ease ? E.EASE[c.ease](u) : u, a = P(c.a, c.f0, statesAt(c.f0)), b = P(c.b, f, S);
  return { x: E.lerp(a[0], b[0], e), y: E.lerp(a[1], b[1], e) - Math.sin(Math.PI * u) * (c.arc || 0), rot: c.r0 !== undefined ? E.lerp(c.r0, c.r1, u) : rot };
}
const angle = (a, b) => Math.atan2(b[1] - a[1], b[0] - a[0]);
function pop(f, who, x) { sfx('pop', f, { who, gain: 1.0, pitch: 0.8 }); sfx('boing', f + 1, { who, gain: 0.4 }); }

const PX0 = 560, SX0 = 1360;
// ================================================================== 0–2 с: неподвижная стойка
key('pink', 0, { form: 'small', x: PX0, y: GROUND, face: 1, look: 1, eyes: 'normal', mouth: 'smile normal', sx: 1, sy: 1, rot: 0, pivot: 0, alpha: 1 }, 0);
key('skel', 0, { form: 'small', x: SX0, y: GROUND, face: -1, look: 1, eyes: 'normal', mouth: 'smile normal', sx: 1, sy: 1, rot: 0, pivot: 0, alpha: 1 }, 0);

const BIG = () => {
  // ---- 2–3.7 с: Скелет плюётся присосками
  key('skel', 48, { mouth: 'happy with theeth', eyes: 'angry' }, 0);
  const S0 = stateAt(60), mouthS = (() => { const p = target('skel:face', S0); return [p[0] - 30, p[1] + 20]; })();
  const shots = [{ f: 56, part: 'face', dx: 6, dy: 0 }, { f: 72, part: 'top', dx: 30, dy: 26 }];
  const A = [];
  for (const sh of shots) {
    key('skel', sh.f - 8, { sx: 1.16, sy: 0.88 }, 6);
    key('skel', sh.f, { sx: 0.86, sy: 1.14 }, 1); key('skel', sh.f + 4, { sx: 1, sy: 1 }, 3);
    sfx('inflate', sh.f - 8, { who: 'skel', dur: 7, gain: 0.4 }); sfx('spit', sh.f, { who: 'skel', gain: 0.9 });
    const tgt = (f, S) => { const p = target(`pink:${sh.part}`, S); return [p[0] + sh.dx, p[1] + sh.dy]; };
    const hit = sh.f + 8, rot = angle(mouthS, tgt(hit, stateAt(hit)));
    const Ar = { segs: [{ f0: sh.f, f1: hit, a: mouthS, b: tgt, arc: 40, rot }, { f0: hit, on: 'pink', part: sh.part, dx: sh.dx, dy: sh.dy, rot }] };
    ARW.push(Ar); A.push(Ar);
    sfx('whoosh', sh.f + 1, { x: 960, dur: 7, gain: 0.4 });
    sfx('pop', hit, { who: 'pink', gain: 0.9 }); sfx('boing', hit + 1, { who: 'pink', gain: 0.7 });
    key('pink', hit, { sx: 1.12, sy: 0.9, mouth: 'puzzlement', eyes: 'sad' }, 1); key('pink', hit + 4, { sx: 1, sy: 1 }, 3);
    sh.hit = hit;
  }
  // пытается стряхнуть
  key('pink', 66, { pivot: ST.CAST.pink.pivot }, 0);
  for (let f = 66; f < 92; f += 6) { key('pink', f + 3, { rot: 16 }, 3); key('pink', f + 6, { rot: -16 }, 3); }
  key('pink', 92, { rot: 0 }, 3);
  sfx('scared', 68, { who: 'pink', gain: 0.6 });
  key('skel', 66, { mouth: 'happy with theeth', eyes: 'normal' }, 0);
  sfx('ref:laugh', 82, { who: 'skel', gain: 0.85, pitch: 1.0 });
  laugh('skel', 82, 104);

  // ---- 3.8–5 с: Розовая «растёт» — Скелет влюблён
  const PX = 600;
  key('pink', 92, { eyes: 'angry', mouth: 'angry theeth' }, 0);
  const PB = transform('pink', 94, PX0, PX, 1, { style: 'grow', love: 'skel', loveDur: 20 });
  key('pink', PB, stance('pink', PX, 1), 0);
  key('pink', PB + 6, { mouth: 'theeth smile', eyes: 'angry' }, 0);

  // ---- 5.2–8 с: «чпок!» — отрывает присоски и кидает в Скелета
  const throwAt = (Ar, i, P0, tgt, onPart, tdx, tdy) => {
    const arrPos = segAt(Ar.segs, P0, stateAt(P0));
    key('pink', P0 - 4, { lean: -2 }, 4);
    key('pink', P0, { hitF: 1, hitFto: [arrPos.x - Math.cos(arrPos.rot) * AL * 0.6, arrPos.y - Math.sin(arrPos.rot) * AL * 0.6], hitFfix: P0 }, 4);
    Ar.segs.push({ f0: P0, hand: 'pink', rot: -1.2 });
    pop(P0, 'pink');
    MARK.push({ who: 'pink', part: shots[i].part, dx: shots[i].dx, dy: shots[i].dy, f0: P0, f1: P0 + 120, r: 20 });
    key('pink', P0, { mouth: 'puzzlement', eyes: 'sad' }, 0);
    const T = P0 + 10, H = T + 9;
    key('pink', T - 4, { hitF: 0, handF: hand('pink', 'F', -0.4, -0.75), lean: -8, mouth: 'angry theeth', eyes: 'angry' }, 4);
    key('pink', T, { handF: hand('pink', 'F', 0.95, -0.15), lean: 12 }, 3, 'in2');
    key('pink', T + 8, { ...stance('pink', PX, 1), mouth: 'happy with theeth', eyes: 'angry' }, 8);
    sfx('swing', T - 2, { who: 'pink', gain: 0.9 });
    const from = (f, S) => { const s = segAt(Ar.segs, T - 1, statesAt(T - 1)); return [s.x, s.y]; };
    const rot = angle([PX + 200, GROUND - 600], P(tgt, H, stateAt(H)));
    Ar.segs.push({ f0: T, f1: H, a: from, b: tgt, arc: 60, rot }, { f0: H, on: 'skel', part: onPart, dx: tdx, dy: tdy, rot });
    sfx('whoosh', T + 1, { x: 960, dur: 8, gain: 0.5 });
    sfx('pop', H, { who: 'skel', gain: 0.9 }); sfx('boing', H + 1, { who: 'skel', gain: 0.6 });
    return H;
  };
  const P1 = PB + 8;
  const H1 = throwAt(A[1], 1, P1, (f, S) => { const p = target('skel:face', S); return [p[0] + 10, p[1] - 6]; }, 'face', 10, -6);
  // ослеп — взлетает и болтается
  key('skel', H1, { mouth: 'puzzlement', eyes: 'sad', pivot: ST.CAST.skel.pivot }, 0);
  sfx('scared', H1 + 2, { who: 'skel', gain: 0.8 });
  move('skel', H1, { x: SX0, y: GROUND, rot: 0 });
  move('skel', H1 + 12, { x: SX0 - 60, y: GROUND - 300 }, 'out2');
  for (let f = H1 + 2; f < H1 + 34; f += 8) { key('skel', f + 4, { rot: 18 }, 4); key('skel', f + 8, { rot: -18 }, 4); }
  move('skel', H1 + 24, { x: SX0 + 40, y: GROUND - 340 }, 'io');
  sfx('whirr', H1 + 2, { who: 'skel', dur: 24, gain: 0.4 });
  const P2 = H1 + 2;
  const H2 = throwAt(A[0], 0, P2, (f, S) => { const p = target('skel:body', S); return [p[0] + 70, p[1] - 30]; }, 'body', 70, -30);
  // присоска на крыле — падает
  const FALL = H2 + 2, LAND = FALL + 10;
  move('skel', FALL, { x: SX0 + 30, y: GROUND - 330, rot: -10 });
  move('skel', LAND, { y: GROUND, rot: 200 }, 'in2');
  key('skel', LAND + 1, { rot: 0 }, 0);
  key('skel', LAND, { sx: 1.35, sy: 0.7 }, 1); key('skel', LAND + 5, { sx: 1, sy: 1 }, 4);
  sfx('fall', LAND, { who: 'skel', gain: 0.9 }); ev('dust', { f: LAND, x: SX0 + 30, r: 40, n: 6 }); ev('shake', { f: LAND, amp: 10, n: 8 });
  ev('stars', { who: 'skel', f0: LAND + 2, f1: LAND + 24 });
  sfx('ref:laugh', LAND + 2, { who: 'pink', gain: 0.85, pitch: 1.35 });
  chuckle('pink', LAND + 2, LAND + 24, { mouth: 'happy with theeth' });

  // ---- 8.3–9.8 с: Скелет «чпок» — присоски слетают — «растёт»
  const SH = LAND + 14;
  key('skel', SH - 2, { eyes: 'angry', mouth: 'angry theeth', pivot: ST.CAST.skel.pivot }, 0);
  for (let f = SH; f < SH + 8; f += 2) key('skel', f + 1, { rot: (f - SH) % 4 ? -14 : 14 }, 1);
  key('skel', SH + 8, { rot: 0 }, 1);
  const SX = 1380;
  for (const [Ar, k] of [[A[1], 0], [A[0], 1]]) {
    const off = SH + 6 + k * 2, from = (f, S) => { const s = segAt(Ar.segs, off - 1, statesAt(off - 1)); return [s.x, s.y]; };
    Ar.segs.push({ f0: off, f1: off + 14, a: from, b: [SX0 + 260 + k * 120, GROUND - 6], arc: 160, r0: 0, r1: 6 }, { f0: off + 14, at: [SX0 + 260 + k * 120, GROUND - 6], rot: 0.15 });
    pop(off, 'skel');
  }
  MARK.push({ who: 'skel', part: 'face', dx: 10, dy: -6, f0: SH + 6, f1: SH + 40, r: 18 });
  const SB = transform('skel', SH + 12, SX0 + 30, SX, -1, { style: 'grow' });
  key('skel', SB, stance('skel', SX, -1), 0);
  key('skel', SB + 6, { mouth: 'angry theeth', eyes: 'angry' }, 0);
  key('pink', SB - 2, { mouth: 'puzzlement', eyes: 'sad' }, 0);
  for (const Ar of A) Ar.segs.push({ f0: SB + 20, gone: true });

  // ---- 9.9–13.5 с: вантуз с неба — на лицо Розовой — тянет — «ЧПОК!» — «пуф»
  const CT = SB + 14;
  key('skel', CT - 6, { handF: hand('skel', 'F', 0.5, -0.85) }, 4);
  PL.push({ f0: CT - 12, f1: CT, a: [SX - 40, -260], b: (f, S) => { const h = C.skel.big.point(S.skel.st, 'handF'); return [h[0] - 20, h[1] - GRIP]; }, r0: -Math.PI / 2 - 3, r1: -Math.PI / 2, arc: 0 });
  PL.push({ f0: CT, hand: 'skel', rot: -Math.PI / 2, grip: GRIP });
  sfx('whoosh', CT - 12, { x: SX, dur: 12, gain: 0.5 }); sfx('pop', CT, { who: 'skel', gain: 0.6 });
  key('skel', CT + 4, { handF: hand('skel', 'F', 0.6, -0.2), mouth: 'happy with theeth', eyes: 'angry' }, 6);
  PL.push({ f0: CT + 4, hand: 'skel', rot: (f) => -Math.PI / 2 - (Math.PI / 2) * E.EASE.io(E.clamp((f - CT - 4) / 6, 0, 1)), grip: GRIP });
  const SX2 = PX + 520, W0 = CT + 8;
  walk('skel', W0, SX, SX2, 2, 9, -1, false);
  const PU = W0 + 22;
  const faceP = (S) => target('pink:face', S);
  key('skel', PU - 4, { lean: 6 }, 4);
  key('skel', PU, { hitF: 1, hitFto: (() => { const p = faceP(stateAt(PU)); return [p[0] + GRIP + 6, p[1]]; })(), hitFfix: PU, lean: 10 }, 4, 'in2');
  PL.push({ f0: PU, on: 'pink', part: 'face', dx: 6, dy: 0, rot: Math.PI });
  sfx('squish', PU, { who: 'pink', gain: 1.0 }); sfx('slap', PU, { who: 'pink', gain: 0.5 });
  key('pink', PU, { mouth: 'puzzlement', eyes: 'sad', handF: hand('pink', 'F', 0.5, -0.6), handB: hand('pink', 'B', -0.4, -0.5) }, 3);
  // тянет — её тянет вперёд
  const PULL = PU + 6, POP = PULL + 18;
  key('skel', PULL, { lean: -14, hip: [0, toRig('skel', 40)], hitF: 1, hitFto: (() => { const p = faceP(stateAt(PU)); return [p[0] + GRIP + 50, p[1] + 10]; })(), hitFfix: PU }, 8);
  for (let f = PULL; f < POP; f += 3) key('skel', f + 2, { lean: (f - PULL) % 6 ? -18 : -12 }, 2);
  key('pink', PULL, { lean: 24, head: 16, hip: [0, toRig('pink', 30)] }, 10);
  move('pink', PULL, { x: PX }); move('pink', POP, { x: PX + 60 }, 'in');
  key('pink', POP - 6, { ...C.pink.big.feet(PX + 60, 1) }, 0);
  sfx('creak', PULL, { who: 'pink', dur: POP - PULL, gain: 0.6 });
  tremble('pink', PULL + 4, POP, PX + 60, 3);
  // ЧПОК!
  pop(POP, 'pink'); sfx('slam', POP, { x: 960, gain: 0.4 });
  ev('shake', { f: POP, amp: 16, n: 10 });
  MARK.push({ who: 'pink', part: 'face', dx: 6, dy: 0, f0: POP, f1: POP + 90, r: 46 });
  PL.push({ f0: POP, hand: 'skel', rot: Math.PI, grip: GRIP });
  key('skel', POP, { hitF: 0, lean: -22, head: -10, handF: hand('skel', 'F', 0.2, -0.5), mouth: 'puzzlement' }, 2);
  key('skel', POP + 10, { ...stance('skel', SX2, -1), mouth: 'happy with theeth', eyes: 'normal' }, 8);
  const SX3 = SX2 + 200;
  walk('skel', POP + 14, SX2, SX3, 2, 8, -1, false);
  const LIE = fallBack('pink', POP, PX + 60, 1, { n: 12, stars: false });
  const psm = shrink('pink', LIE + 6, PX - 140, 1, { mouth: 'puzzlement', eyes: 'sad', smoke: 420 });
  key('pink', psm, { lean: 0, head: 0, hip: [0, 0], legF: null, legB: null, zB: null, rot: 0 }, 0);
  move('pink', psm, { x: PX - 140, y: GROUND, rot: 0 });
  ev('stars', { who: 'pink', f0: psm + 4, f1: psm + 22, snd: false });
  sfx('ref:laugh', POP + 6, { who: 'skel', gain: 0.85, pitch: 1.0 });
  chuckle('skel', POP + 6, psm + 16, { mouth: 'happy with theeth' });
  // бросает вантуз — он втыкается присоской в траву
  const DR = psm + 6, PLX = 1010;
  key('skel', DR - 4, { handF: hand('skel', 'F', 0.6, -0.6) }, 4);
  key('skel', DR, { handF: hand('skel', 'F', 0.8, 0.1) }, 3);
  PL.push({ f0: DR, f1: DR + 10, a: (f, S) => { const s = segAt(PL, DR - 1, statesAt(DR - 1)); return [s.x, s.y]; }, b: [PLX, GROUND - 4], r0: Math.PI, r1: Math.PI / 2, arc: 60 });
  PL.push({ f0: DR + 10, at: [PLX, GROUND - 4], rot: Math.PI / 2 });
  sfx('squish', DR + 10, { x: PLX, gain: 0.7 });
  key('skel', DR + 6, { ...stance('skel', SX3, -1) }, 6);

  // ---- 13.6–16.5 с: шарик-Розовая прыгает на вантуз — он прилипает Скелету на лицо — улетает вслепую
  key('pink', psm + 10, { eyes: 'angry', mouth: 'angry theeth' }, 0);
  const J0 = psm + 14, J1 = J0 + 12;
  const plTop = GROUND - 4 - PLS * 0.45 - PLL;
  hop('pink', J0 - 10, J0, PX - 140, PLX - 200, 100);
  key('pink', J0 + 1, { sx: 1.2, sy: 0.82 }, 3);
  move('pink', J0 + 1, { x: PLX - 200, y: GROUND });
  move('pink', J0 + 6, { y: plTop - 220 }, 'out2');
  move('pink', J1, { x: PLX, y: plTop + 40 }, 'in2');
  key('pink', J1, { sx: 1.3, sy: 0.75 }, 1);
  sfx('jump', J0 + 2, { who: 'pink', gain: 0.6 }); sfx('bonk', J1, { x: PLX, gain: 0.7 }); sfx('spring', J1, { x: PLX, gain: 0.9 });
  const FL = J1 + 2, ON = FL + 10;
  const skFace = (f, S) => { const p = target('skel:face', S); return [p[0] - 6, p[1]]; };
  PL.push({ f0: FL, f1: ON, a: [PLX, GROUND - 4], b: skFace, r0: Math.PI / 2, r1: 0, arc: 220 });
  PL.push({ f0: ON, on: 'skel', part: 'face', dx: -6, dy: 0, rot: 0 });
  sfx('whoosh', FL, { x: 1000, dur: 10, gain: 0.6 }); sfx('squish', ON, { who: 'skel', gain: 1.0 });
  hop('pink', J1 + 2, J1 + 14, PLX, PLX - 160, 120);
  key('skel', ON, { mouth: 'puzzlement', eyes: 'sad', lean: -10, head: -10, handF: hand('skel', 'F', 0.6, -0.7), handB: hand('skel', 'B', 0.4, -0.7) }, 2);
  sfx('scared', ON + 2, { who: 'skel', gain: 0.9 });
  // шатается вслепую и улетает
  const W1 = ON + 6;
  move('skel', W1, { x: SX3, y: GROUND });
  move('skel', W1 + 14, { x: SX3 + 130 }, 'io');
  for (let f = W1; f < W1 + 14; f += 4) { key('skel', f + 2, { hip: [0, toRig('skel', 40)], lean: -16 }, 2); key('skel', f + 4, { hip: [0, toRig('skel', 10)], lean: -6 }, 2); }
  for (let f = W1; f < W1 + 14; f += 7) sfx('step', f + 4, { who: 'skel', gain: 0.5 });
  key('skel', W1 + 14, { ...C.skel.big.feet(SX3 + 130, -1) }, 14);
  flap(W1 + 6, W1 + 30, 0.8);
  const GO = W1 + 16;
  flyOff('skel', GO, GO + 26, [SX3 + 130, GROUND], [2350, -260], { turns: 1 });
  key('pink', J1 + 16, { mouth: 'happy with theeth', eyes: 'normal' }, 0);
  sfx('ref:laugh', GO + 2, { who: 'pink', gain: 0.85, pitch: 1.35 });
  laugh('pink', GO + 2, GO + 18);

  // ---- 16.5–22 с: Розовая «растёт» снова и в центр
  const PB2 = transform('pink', GO + 14, PLX - 160, PLX - 160, 1, { style: 'grow' });
  key('pink', PB2, stance('pink', PLX - 160, 1), 0);
  const WIN = victory('pink', PB2 + 4, PLX - 160, { n: 9, stride: 110 });
  window.T = { PB, H1, H2, LAND, SB, CT, PU, POP, psm, J1, ON, GO, PB2, WIN };
};

// ------------------------------------------------------------------ рисование
ST.hooks.beforeChars.push((ctx, f, S, CAM) => {
  ctx.setTransform(...CAM);
  for (const Ar of ARW) { const c = Ar.segs.filter((s) => f >= s.f0).pop(); if (c && c.at) { const a = segAt(Ar.segs, f, S); if (a) FX.toyArrow(ctx, a.x, a.y, a.rot, AL); } }
  const c = PL.filter((s) => f >= s.f0).pop();
  if (c && c.at) { const p = segAt(PL, f, S, PLL); FX.plunger(ctx, p.x, p.y, p.rot, PLL, PLS); }
});
ST.hooks.afterChars.push((ctx, f, S, CAM) => {
  ctx.setTransform(...CAM);
  for (const m of MARK) {
    if (f < m.f0 || f >= m.f1) continue;
    const p = target(`${m.who}:${m.part}`, S);
    FX.suctionMark(ctx, p[0] + m.dx, p[1] + m.dy, m.r * (S[m.who].p.form === 'big' ? 1 : 0.8), Math.min(1, (m.f1 - f) / 12));
  }
  for (const Ar of ARW) {
    const c = Ar.segs.filter((s) => f >= s.f0).pop();
    if (!c || c.at || c.gone) continue;
    const a = segAt(Ar.segs, f, S);
    if (a) FX.toyArrow(ctx, a.x, a.y, a.rot, AL);
  }
  const c = PL.filter((s) => f >= s.f0).pop();
  if (c && !c.at) { const p = segAt(PL, f, S, PLL); if (p) FX.plunger(ctx, p.x, p.y, p.rot, PLL, PLS); }
});

ST.start(BIG);
