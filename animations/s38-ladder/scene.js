// Ролик 26 (бывш. 38): Лестница — Жёлтая (слева) против Радужного (справа), 25 с, 24 кадра/с. Драка без ударов:
// деревянная лестница из майнкрафта: по ней лезут, ею, положенной на ящик, катапультируют, она падает, как дерево.
// В начале — считалка «3, 2, 1, FIGHT». Музыка превращения — один раз. Фон — плитки: малиновая стена, лавандовый пол, кнопки.
//
//   0–2.2 с   считалка: шарик-Жёлтая и радужный шарик неподвижно стоят друг напротив друга
//   2.2–4.6 с с неба втыкается лестница; Радужный взбирается наверх и прыгает «бомбочкой» на Жёлтую
//   4.7–5.9 с Жёлтая «растёт» под музыку — Радужный влюблён
//   6–9.5 с   кладёт лестницу на ящик — качели; влюблённый Радужный садится на нижний конец —
//             она хлопает по верхнему — Радужного подбрасывает в небо
//   9.5–13 с  Радужный «растёт», ставит лестницу и толкает — она падает, как дерево, Жёлтой на голову — «пуф»
//   13–16.5 с лестница снова на ящике: шарик-Жёлтая на нижнем конце; хохочущий Радужный наступает на верхний —
//             её подбрасывает, и она падает ему на голову — «пуф»
//   16.5–21 с Жёлтая «растёт» снова; шарик-Радужный прячется наверху поставленной лестницы — она толкает лестницу —
//             «тимбер!» — его уносит за край
//   21–25 с   Жёлтая в центре, руки вверх
'use strict';

const ST = Stage({
  name: '26 Жёлтая vs Радужный',
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
  background: { theme: 'tiles', seed: 1026, wall: '#cf4cc2', floor: '#bcc6ff', motif: 'studs', sky: ['#4fa9f6', '#d8f2ff'] },
  clouds: [[150, 80, 2.4, 0, 12], [700, 220, 1.8, 1, 16], [1150, 70, 2.6, 2, 10], [1720, 250, 1.5, 0, 18]],
});
const { FPS, NF, GROUND, C, key, move, ev, sfx, hop, tumble, laugh, tremble, transform, shrink, stance, walk,
  slip, fallBack, victory, chuckle, hand, toRig, statesAt, target } = ST;
const P = (v, f, S) => (typeof v === 'function' ? v(f, S) : typeof v === 'string' ? target(v, S) : v);

// ------------------------------------------------------------------ лестница, ящик-опора
const LL = 470, HL = LL / 2, CRS = 140, PIV = [860, GROUND - CRS - 8];
const LAD = [];           // {f0, stand: [x], rot} | {f0, f1, a:[x,y], b:[x,y], rot0, rot1, arc, ease} | {f0, hands: who} | {f0, lever: true}
const TILT = [];          // [f, δ] — наклон качелей (δ > 0 — правый конец ниже)
const CRATE = { f0: 1e9 };
function segAt(segs, f) { let c = null; for (const s of segs) if (f >= s.f0) c = s; return c && !c.gone ? c : null; }
const lerpKeys = (ks, f) => { for (let i = 0; i < ks.length; i++) if (f < ks[i][0]) { if (!i) return ks[0][1]; const [a, x] = ks[i - 1], [b, y] = ks[i]; return E.lerp(x, y, E.EASE.io((f - a) / (b - a))); } return ks.length ? ks[ks.length - 1][1] : 0; };
const tiltAt = (f) => lerpKeys(TILT, f);
const leverEnd = (f, side) => { const d = tiltAt(f); return [PIV[0] + side * HL * Math.cos(d), PIV[1] + side * HL * Math.sin(d)]; };
function ladAt(f, S) {
  const c = segAt(LAD, f);
  if (!c) return null;
  if (c.stand) { const r = typeof c.rot === 'function' ? c.rot(f) : c.rot || 0; return { x: c.stand[0], y: c.stand[1] ?? GROUND, rot: r }; }
  if (c.lever) { const l = leverEnd(f, -1), d = tiltAt(f); return { x: l[0], y: l[1], rot: Math.PI / 2 + d }; }
  if (c.hands) {
    if (S[c.hands].p.form !== 'big') return null;
    const h = C[c.hands].big.point(S[c.hands].st, 'handF'), g = C[c.hands].big.point(S[c.hands].st, 'handB');
    return { x: (h[0] + g[0]) / 2 - HL, y: Math.min(h[1], g[1]) - 10, rot: Math.PI / 2 };
  }
  const u = E.clamp((f - c.f0) / (c.f1 - c.f0), 0, 1), e = c.ease ? E.EASE[c.ease](u) : u;
  const a = P(c.a, c.f0, statesAt(c.f0)), b = P(c.b, f, S);
  return { x: E.lerp(a[0], b[0], e), y: E.lerp(a[1], b[1], e) - Math.sin(Math.PI * u) * (c.arc || 0), rot: E.lerp(c.rot0, c.rot1, e) };
}
const along = (q, k) => [q.x + Math.sin(q.rot) * LL * k, q.y - Math.cos(q.rot) * LL * k];   // точка на лестнице (0 — низ, 1 — верх)
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
const LATE = [];

const YX0 = 470, RX0 = 1450, LX = 1060, GO = 54;
// ================================================================== 0–2.2 с: считалка, оба стоят
key('yel', 0, { form: 'small', x: YX0, y: GROUND, face: 1, look: 1, eyes: 'normal', mouth: 'smile normal', sx: 1, sy: 1, rot: 0, pivot: 0, alpha: 1 }, 0);
key('rb', 0, { form: 'small', x: RX0, y: GROUND, face: -1, look: 1, eyes: 'normal', mouth: 'smile normal', sx: 1, sy: 1, rot: 0, pivot: 0, alpha: 1 }, 0);

const BIG = () => {
  // ---- 2.2–4.6 с: лестница втыкается — Радужный лезет наверх — «бомбочкой» на Жёлтую
  LAD.push({ f0: GO, f1: GO + 7, a: [LX, -600], b: [LX, GROUND], rot0: 0, rot1: 0, ease: 'in2' }, { f0: GO + 7, stand: [LX], rot: (f) => Math.sin((f - GO - 7) * 0.5) * 0.06 * Math.exp(-(f - GO - 7) / 10) });
  sfx('whoosh', GO, { x: LX, dur: 7, gain: 0.5 }); sfx('slam', GO + 7, { x: LX, gain: 0.7 }); sfx('creak', GO + 8, { x: LX, dur: 10, gain: 0.5 });
  ev('dust', { f: GO + 7, x: LX, r: 70, n: 6, snd: false });
  key('yel', GO + 3, { mouth: 'puzzlement' }, 0); key('rb', GO + 3, { mouth: 'puzzlement' }, 0);
  key('rb', GO + 10, { mouth: 'happy with theeth', eyes: 'angry' }, 0);
  sfx('ref:grin-eee', GO + 10, { who: 'rb', gain: 0.4, pitch: 0.9 });
  hopTo('rb', GO + 12, GO + 20, RX0, GROUND, LX + 20, GROUND, 60);
  let f = GO + 22;
  const RUNG = [0.28, 0.52, 0.72];
  RUNG.forEach((k, i) => {
    const y0 = i ? GROUND - LL * RUNG[i - 1] : GROUND, y1 = GROUND - LL * k;
    hopTo('rb', f, f + 5, LX + 20, y0, LX + 20, y1, 30, { land: false, snd: false, prep: 1 });
    sfx('step', f + 5, { x: LX, gain: 0.5, pitch: 1.2 }); sfx('creak', f + 5, { x: LX, gain: 0.25, dur: 4 });
    f += 6;
  });
  key('rb', f, { mouth: 'happy with theeth', eyes: 'angry' }, 0);
  sfx('ref:laugh', f, { who: 'rb', gain: 0.6, pitch: 0.9 });
  const J = f + 4, HIT = J + 14;
  key('yel', J, { look: 1, mouth: 'puzzlement', eyes: 'sad' }, 0);
  hopTo('rb', J, HIT, LX + 20, GROUND - LL * 0.72, YX0 + 10, GROUND - 120, 40, { land: false });
  key('rb', J + 6, { pivot: ST.CAST.rb.pivot }, 0); move('rb', J + 2, { rot: 0 }); move('rb', HIT, { rot: -360 }, 'lin'); key('rb', HIT + 1, { rot: 0, pivot: 0 }, 0);
  sfx('whoosh', J + 2, { who: 'rb', dur: 14, gain: 0.6 });
  key('yel', HIT, { sx: 1.75, sy: 0.42 }, 1);
  key('rb', HIT, { sx: 1.35, sy: 0.75 }, 1);
  sfx('slam', HIT, { who: 'yel', gain: 1.0 }); sfx('squish', HIT, { who: 'yel', gain: 0.7 });
  ev('shake', { f: HIT, amp: 16, n: 10 }); ev('dust', { f: HIT, x: YX0, r: 80, n: 7, snd: false });
  const RX1 = 1300;
  hopTo('rb', HIT + 1, HIT + 15, YX0 + 10, GROUND - 120, RX1, GROUND, 240);
  key('rb', HIT + 15, { mouth: 'happy with theeth', eyes: 'normal' }, 0);
  sfx('ref:laugh', HIT + 15, { who: 'rb', gain: 0.85, pitch: 0.9 });
  laugh('rb', HIT + 17, HIT + 31);
  key('yel', HIT + 8, { sx: 1, sy: 1 }, 5, 'out'); sfx('boing', HIT + 8, { who: 'yel', gain: 0.6 });
  ev('stars', { who: 'yel', f0: HIT + 8, f1: HIT + 22 });

  // ---- 4.7–5.9 с: Жёлтая «растёт» — Радужный влюблён
  const YX = 520;
  key('yel', HIT + 8, { eyes: 'angry', mouth: 'angry theeth' }, 0);
  const YB = transform('yel', HIT + 9, YX0, YX, 1, { style: 'grow', love: 'rb', loveDur: 70 });
  key('yel', YB, stance('yel', YX, 1), 0);
  key('yel', YB + 4, { mouth: 'theeth smile', eyes: 'normal' }, 0);

  // ---- 6–9.5 с: качели из лестницы и ящика — Радужный на нижний конец — хлоп — в небо
  CRATE.f0 = YB + 2;
  sfx('whoosh', YB + 2, { x: PIV[0], dur: 6, gain: 0.5 }); sfx('slam', YB + 8, { x: PIV[0], gain: 0.6 }); ev('dust', { f: YB + 8, x: PIV[0], r: 60, n: 5, snd: false });
  const YX1 = 700;
  walk('yel', YB + 4, YX, YX1, 2, 8, 1);
  const GR = YB + 18;
  key('yel', GR - 5, { lean: 18, hip: [0, toRig('yel', 80)], head: 6 }, 5);
  key('yel', GR, { hitF: 1, hitB: 1, hitFto: [LX + 20, GROUND - 300], hitBto: [LX - 20, GROUND - 260] }, 4);
  sfx('pop', GR, { who: 'yel', gain: 0.4 });
  LAD.push({ f0: GR, hands: 'yel' });
  key('yel', GR + 8, { ...stance('yel', YX1, 1), hitF: 0, hitB: 0, handF: hand('yel', 'F', 0.3, -0.95), handB: hand('yel', 'B', 0.15, -0.95) }, 8);
  const LAY = GR + 12, D0 = Math.asin(CRS / HL);
  key('yel', LAY, { handF: hand('yel', 'F', 0.85, -0.2), handB: hand('yel', 'B', 0.75, -0.2), lean: 14 }, 4, 'in2');
  LAD.push({ f0: LAY, f1: LAY + 6, a: (g, S) => { const q = ladAt(LAY - 1, statesAt(LAY - 1)); return [q.x, q.y]; }, b: (g, S) => leverEnd(LAY + 6, -1), rot0: Math.PI / 2, rot1: Math.PI / 2 + D0 }, { f0: LAY + 6, lever: true });
  TILT.push([0, D0]);
  sfx('bonk', LAY + 6, { x: PIV[0], gain: 0.6 }); sfx('creak', LAY + 6, { x: PIV[0], dur: 6, gain: 0.5 });
  key('yel', LAY + 8, { ...stance('yel', YX1, 1), lean: 0 }, 6);
  // влюблённый Радужный садится на нижний (правый) конец
  const SITX = PIV[0] + HL * Math.cos(D0) - 30, SITF = LAY + 16;
  hopTo('rb', LAY + 6, SITF, RX1, GROUND, SITX, GROUND - 20, 120, { land: false });
  key('rb', SITF, { sx: 1.25, sy: 0.8 }, 1); key('rb', SITF + 4, { sx: 1, sy: 1 }, 3);
  ev('hearts', { who: 'rb', f0: SITF, f1: SITF + 24, snd: false });
  sfx('kiss', SITF + 6, { who: 'rb', gain: 0.6 });
  // хлоп по верхнему концу
  const SLAP = SITF + 10, HI = leverEnd(SLAP - 1, -1);
  key('yel', SLAP - 6, { hitF: 1, hitFto: [HI[0], HI[1] - 160], lean: 10, mouth: 'theeth smile', eyes: 'angry' }, 6);
  key('yel', SLAP, { hitFto: [HI[0], HI[1] + 20], lean: 22 }, 2, 'in2');
  TILT.push([SLAP, D0], [SLAP + 3, -D0]);
  sfx('slam', SLAP, { x: HI[0], gain: 0.8 }); sfx('spring', SLAP + 1, { x: PIV[0], gain: 0.9 });
  key('yel', SLAP + 8, { hitF: 0, ...stance('yel', YX1, 1), lean: 0, mouth: 'happy with theeth', eyes: 'normal' }, 6);
  const RX2 = 1650, LAND = SLAP + 22;
  key('rb', SLAP + 1, { pivot: ST.CAST.rb.pivot, mouth: 'puzzlement', eyes: 'sad' }, 0);
  move('rb', SLAP + 1, { x: SITX, y: GROUND - 20, rot: 0 }); move('rb', SLAP + 12, { y: -300 }, 'out2'); move('rb', LAND, { y: GROUND }, 'in2');
  move('rb', LAND, { x: RX2, rot: 1080 }, 'lin'); key('rb', LAND + 1, { rot: 0, pivot: 0 }, 0); move('rb', LAND + 1, { rot: 0 });
  key('rb', LAND, { sx: 1.35, sy: 0.7 }, 1); key('rb', LAND + 5, { sx: 1, sy: 1 }, 4);
  sfx('scared', SLAP + 2, { who: 'rb', gain: 0.8 }); sfx('whoosh', SLAP + 2, { who: 'rb', dur: 22, gain: 0.6 }); sfx('fall', LAND, { who: 'rb', gain: 0.9 });
  ev('stars', { who: 'rb', f0: LAND + 2, f1: LAND + 10 }); ev('dust', { f: LAND, x: RX2, r: 50, n: 6, snd: false });
  sfx('ref:laugh', SLAP + 6, { who: 'yel', gain: 0.85, pitch: 1.45 });
  chuckle('yel', SLAP + 6, LAND + 10, { mouth: 'happy with theeth' });

  // ---- 9.5–13 с: Радужный «растёт», ставит лестницу — толкает — «тимбер» Жёлтой на голову — «пуф»
  key('rb', LAND + 4, { eyes: 'angry', mouth: 'angry theeth' }, 0);
  const RX = 1560, RB = transform('rb', LAND + 6, RX2, RX, -1, { style: 'grow' });
  key('rb', RB, stance('rb', RX, -1), 0);
  key('rb', RB + 4, { mouth: 'theeth smile', eyes: 'angry' }, 0);
  key('yel', RB - 2, { mouth: 'puzzlement', eyes: 'sad' }, 0);
  const RX3 = 1260;
  walk('rb', RB + 4, RX, RX3, 2, 8, -1);
  const GR2 = RB + 18, RE = leverEnd(GR2, 1);
  key('rb', GR2 - 5, { lean: 26, hip: [0, toRig('rb', 160)], head: 6 }, 5);
  key('rb', GR2, { hitF: 1, hitFto: [RE[0] + 20, RE[1] - 20], hitFfix: GR2 }, 4);
  sfx('pop', GR2, { who: 'rb', gain: 0.4 });
  // поднимает лестницу торчком (низ — у ящика справа)
  const UPR = GR2 + 8, STX = 1060, SY = GROUND - 250;
  LAD.push({ f0: GR2, f1: UPR, a: (g, S) => leverEnd(GR2, -1), b: [STX, SY], rot0: Math.PI / 2 - D0, rot1: 0, ease: 'io' }, { f0: UPR, stand: [STX, SY], rot: 0 });
  key('rb', UPR, { hitF: 1, hitB: 1, hitFto: [STX + 10, SY + 10], hitBto: [STX - 10, SY + 40] }, 6);
  sfx('creak', GR2 + 2, { x: STX, dur: 8, gain: 0.6 });
  key('rb', UPR + 6, { mouth: 'happy with theeth', eyes: 'angry' }, 0);
  // толчок — падает влево, как дерево
  const PUSH = UPR + 7, FALLEN = PUSH + 13;
  key('rb', PUSH, { hitFto: [STX - 10, SY + 10], lean: 16 }, 3, 'in2');
  const RT = -0.72;
  LAD.push({ f0: PUSH, f1: FALLEN, a: [STX, SY], b: [STX, SY], rot0: 0, rot1: RT, ease: 'in2' }, { f0: FALLEN, stand: [STX, SY], rot: RT });
  sfx('creak', PUSH, { x: STX, dur: 12, gain: 0.7 }); sfx('whoosh', PUSH + 4, { x: 900, dur: 10, gain: 0.6 });
  key('rb', FALLEN + 6, { hitF: 0, hitB: 0, ...stance('rb', RX3, -1), lean: 0, mouth: 'happy with theeth', eyes: 'normal' }, 6);
  sfx('bonk', FALLEN, { who: 'yel', gain: 1.0 }); ev('shake', { f: FALLEN, amp: 14, n: 8 });
  ev('stars', { who: 'yel', f0: FALLEN + 1, f1: FALLEN + 24, snd: false });
  key('yel', FALLEN, { lean: -16, head: -16, mouth: 'puzzlement', eyes: 'sad', handF: hand('yel', 'F', 0.4, -0.7), handB: hand('yel', 'B', -0.4, -0.6) }, 2);
  sfx('ref:laugh', FALLEN + 2, { who: 'rb', gain: 0.85, pitch: 0.75 });
  chuckle('rb', FALLEN + 2, FALLEN + 40, { mouth: 'happy with theeth' });
  const FB = fallBack('yel', FALLEN + 4, YX1, 1, { n: 14, stars: 24 });
  // лестница соскальзывает обратно на ящик
  LAD.push({ f0: FALLEN + 6, f1: FALLEN + 16, a: [STX, SY], b: (g, S) => leverEnd(FALLEN + 16, -1), rot0: RT, rot1: Math.PI / 2 - D0, arc: 60 }, { f0: FALLEN + 16, lever: true });
  TILT.push([FALLEN + 15, -D0]);
  LATE.push(() => { TILT.sort((a, b) => a[0] - b[0]); });
  sfx('bonk', FALLEN + 16, { x: PIV[0], gain: 0.5 });
  const YBX = 400;
  const ysm = shrink('yel', FB + 6, YBX, 1, { mouth: 'puzzlement', eyes: 'sad', smoke: 420 });
  key('yel', ysm, { lean: 0, head: 0, hip: [0, 0], legF: null, legB: null, zB: null, rot: 0 }, 0);
  move('yel', ysm, { x: YBX, y: GROUND, rot: 0 });
  ev('stars', { who: 'yel', f0: ysm + 4, f1: ysm + 14, snd: false });

  // ---- 13–16.5 с: шарик-Жёлтая на нижнем (левом) конце — Радужный наступает на верхний — её подбрасывает ему на голову
  const LO = leverEnd(ysm + 10, -1);
  key('yel', ysm + 6, { eyes: 'angry', mouth: 'theeth smile' }, 0);
  const SIT2 = ysm + 12;
  hopTo('yel', ysm + 6, SIT2, YBX, GROUND, LO[0] + 30, GROUND - 20, 100, { land: false });
  key('yel', SIT2, { sx: 1.25, sy: 0.8 }, 1); key('yel', SIT2 + 4, { sx: 1, sy: 1 }, 3);
  // Радужный, хохоча, идёт к качелям и наступает на верхний конец
  const HI2 = leverEnd(SIT2, 1), RX4 = HI2[0] + 140;
  walk('rb', SIT2 - 6, RX3, RX4, 1, 10, -1);
  const STEP = SIT2 + 10;
  key('rb', STEP - 6, { legFfk: 1, legF: [-60, 60, 0], lean: -4, mouth: 'happy with theeth', eyes: 'normal' }, 6);
  key('rb', STEP, { legF: [-30, 10, 0], lean: 6, hitF: 0 }, 2, 'in2');
  TILT.push([STEP, -D0], [STEP + 3, D0]);
  sfx('slam', STEP, { x: HI2[0], gain: 0.7 }); sfx('spring', STEP + 1, { x: PIV[0], gain: 0.9 });
  key('rb', STEP + 6, { legFfk: 0, legF: null, ...stance('rb', RX4, -1) }, 4);
  const HEAD = STEP + 22;
  key('yel', STEP + 1, { mouth: 'theeth smile', eyes: 'angry' }, 0);
  LATE.push(() => { const t = target('rb:face', ST.stateAt(HEAD)); hopTo('yel', STEP + 1, HEAD, LO[0] + 30, GROUND - 20, t[0] - 60, t[1] + 150, 160, { land: false }); hopTo('yel', HEAD + 2, HEAD + 14, t[0] - 60, t[1] + 150, 1000, GROUND, 60); });
  key('yel', STEP + 6, { pivot: ST.CAST.yel.pivot }, 0); move('yel', STEP + 2, { rot: 0 }); move('yel', HEAD - 2, { rot: 720 }, 'lin'); key('yel', HEAD - 1, { rot: 0, pivot: 0 }, 0);
  sfx('whoosh', STEP + 2, { who: 'yel', dur: 18, gain: 0.6 });
  key('rb', HEAD - 8, { look: 1, head: -4, mouth: 'puzzlement', eyes: 'sad' }, 4);
  key('yel', HEAD, { sx: 1.3, sy: 0.75 }, 1);
  sfx('bonk', HEAD, { who: 'rb', gain: 1.0 }); sfx('slam', HEAD, { who: 'rb', gain: 0.5 }); ev('shake', { f: HEAD, amp: 16, n: 10 });
  const FB2 = fallBack('rb', HEAD + 2, RX4, -1, { n: 14, stars: 24 });
  key('yel', HEAD + 14, { mouth: 'happy with theeth', eyes: 'normal' }, 0);
  sfx('ref:laugh', HEAD + 14, { who: 'yel', gain: 0.85, pitch: 1.45 });
  laugh('yel', HEAD + 16, HEAD + 18);
  const RBX = 1560;
  const rsm = shrink('rb', FB2 + 6, RBX, -1, { mouth: 'puzzlement', eyes: 'sad', smoke: 420 });
  key('rb', rsm, { lean: 0, head: 0, hip: [0, 0], legF: null, legB: null, zB: null, rot: 0, legFfk: 0 }, 0);
  move('rb', rsm, { x: RBX, y: GROUND, rot: 0 });
  ev('stars', { who: 'rb', f0: rsm + 4, f1: rsm + 14, snd: false });

  // ---- 16.5–21 с: Жёлтая «растёт» снова; ставит лестницу — шарик-Радужный прячется наверху — «тимбер!»
  const YX2 = 980, YB2 = transform('yel', HEAD + 16, 1000, YX2, 1, { style: 'grow' });
  key('yel', YB2, stance('yel', YX2, 1), 0);
  key('yel', YB2 + 4, { mouth: 'theeth smile', eyes: 'angry' }, 0);
  const GR3 = YB2 + 6, STX2 = 1300;
  key('yel', GR3 - 4, { lean: 16, hitF: 1, hitFto: leverEnd(GR3, 1) }, 4);
  LAD.push({ f0: GR3, f1: GR3 + 12, a: (g, S) => leverEnd(GR3, -1), b: [STX2, GROUND], rot0: Math.PI / 2 + D0, rot1: 0, arc: 120 }, { f0: GR3 + 12, stand: [STX2], rot: 0 });
  sfx('swing', GR3, { who: 'yel', gain: 0.6 }); sfx('bonk', GR3 + 12, { x: STX2, gain: 0.6 });
  key('yel', GR3 + 10, { hitF: 0, ...stance('yel', YX2, 1), mouth: 'happy with theeth' }, 6);
  CRATE.f1 = GR3 + 14; ev('smoke', { f: GR3 + 14, who: 'yel', size: 240, dx: PIV[0] - YX2, y: GROUND - 80 }); sfx('poof', GR3 + 14, { x: PIV[0], gain: 0.5 });
  // шарик-Радужный в панике лезет наверх
  key('rb', rsm + 6, { face: -1, mouth: 'puzzlement', eyes: 'sad' }, 0);
  sfx('scared', rsm + 8, { who: 'rb', gain: 0.7 });
  f = Math.max(rsm + 10, GR3 + 14);
  hopTo('rb', f, f + 8, RBX, GROUND, STX2 + 20, GROUND, 60); f += 9;
  for (const k of [0.28, 0.52, 0.72]) { const y0 = k === 0.28 ? GROUND : GROUND - LL * (k === 0.52 ? 0.28 : 0.52); hopTo('rb', f, f + 5, STX2 + 20, y0, STX2 + 20, GROUND - LL * k, 25, { land: false, snd: false, prep: 1 }); sfx('step', f + 5, { x: STX2, gain: 0.5, pitch: 1.2 }); f += 6; }
  const TOPF = f;
  key('rb', TOPF, { mouth: 'puzzlement', eyes: 'sad' }, 0);
  for (let g = TOPF; g < TOPF + 10; g += 4) { key('rb', g, { rot: 8, pivot: ST.CAST.rb.pivot }, 2); key('rb', g + 2, { rot: -8 }, 2); }
  // толчок — «тимбер!» — вправо
  const PU = TOPF + 8, GONE = PU + 16;
  key('yel', PU - 4, { lean: 14, hitF: 1, hitFto: [STX2 - 40, GROUND - 330] }, 4);
  key('yel', PU, { lean: 26, hitFto: [STX2, GROUND - 330] }, 2, 'in2');
  LAD.push({ f0: PU, f1: GONE, a: [STX2, GROUND], b: [STX2, GROUND], rot0: 0, rot1: 1.5, ease: 'in2' }, { f0: GONE, stand: [STX2], rot: 1.5 });
  sfx('creak', PU, { x: STX2, dur: 12, gain: 0.7 }); sfx('whoosh', PU + 6, { x: 1600, dur: 10, gain: 0.7 }); sfx('slam', GONE, { x: 1700, gain: 0.8 });
  LATE.push(() => { for (let g = PU; g <= PU + 10; g++) { const q = ladAt(g, ST.stateAt(g)), p = along(q, 0.72); move('rb', g, { x: p[0] + 20, y: p[1] }, 'lin'); } });
  key('rb', PU + 10, { pivot: ST.CAST.rb.pivot }, 0);
  move('rb', PU + 11, { rot: 0 }); move('rb', PU + 30, { x: 2350, y: GROUND - 520, rot: 1080 }, 'out');
  sfx('scared', PU + 8, { who: 'rb', gain: 0.9 });
  ev('twinkle', { f: PU + 24, at: [1820, GROUND - 420], n: 22, size: 56 });
  key('yel', PU + 8, { hitF: 0, ...stance('yel', YX2, 1), lean: 0, mouth: 'happy with theeth', eyes: 'normal' }, 6);
  sfx('ref:laugh', PU + 10, { who: 'yel', gain: 0.85, pitch: 1.45 });
  chuckle('yel', PU + 10, PU + 26, { mouth: 'happy with theeth' });

  // ---- 21–25 с: в центр, руки вверх
  const WIN = victory('yel', PU + 26, YX2, { n: 9, stride: 60 });
  for (const fn of LATE) fn();
  window.T = { J, HIT, YB, GR, LAY, SITF, SLAP, LAND, RB, PUSH, FALLEN, ysm, SIT2, STEP, HEAD, rsm, YB2, TOPF, PU, WIN };
};

// ------------------------------------------------------------------ рисование
ST.hooks.beforeChars.push((ctx, f, S, CAM) => {
  ctx.setTransform(...CAM);
  if (f >= CRATE.f0 && !(CRATE.f1 && f >= CRATE.f1)) {
    const u = E.EASE.in2(E.clamp((f - CRATE.f0) / 6, 0, 1));
    FX.woodCrate(ctx, PIV[0], E.lerp(-300, GROUND + 2, u), CRS, 0, 0);
  }
  const q = ladAt(f, S);
  if (q) FX.mcLadder(ctx, q.x, q.y, LL, q.rot);
});

ST.start(BIG);
