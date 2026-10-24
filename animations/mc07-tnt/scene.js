// Ролик 07 (серия по образцу): Динамит — Скелет против Лорда, 25 с, 24 кадра/с. Драка мягкая: мультяшные
// взрывы динамита — только сажа на лице и дым из ушей. Превращения «рост» под присланную музыку.
// Фон «майнкрафт», тема «замок» (горы со снегом).
//
//   0–1.8 с   шарик-Скелет (слева) и шарик-Лорд (справа), у Лорда за спиной блоки динамита
//   1.8–4 с   Скелет перелетает и чиркает крылом по фитилю — бум! Лорд в саже, кашляет дымом
//   4–5.2 с   Лорд «растёт» под музыку и отряхивается
//   5.5–8.5 с бросает динамит в шарик-Скелета — тот отбивает его головой обратно — бум у ног Лорда,
//             шляпа взлетает и падает обратно
//   9–10.3 с  Скелет «растёт» под музыку
//   10.8–14 с Лорд бросает ещё один — Скелет взмахом крыльев сдувает его обратно — бум, Лорд на спине
//   15–20 с   встаёт, поджигает последний — фитиль гаснет, Лорд заглядывает в него — бум прямо в лицо,
//             улетает за кадр
//   20–25 с   Скелет в центре, руки вверх
'use strict';

const ST = Stage({
  name: 'mc07-tnt',
  cast: {
    skel: { small: ['skeleton-verity-small', { scale: 0.455 }], big: ['skeleton-verity-big', { height: 730 }], pivot: 325,
      voice: 0.9, lie: 60, color: '#f3f1e6', moods: { angry: 'angry theeth', grin: 'happy with theeth', big: 'theeth smile' } },
    lord: { small: ['lord-verity-small', { bodyHeight: 300 }], big: ['lord-verity-big', { height: 730 }], pivot: 337,
      voice: 1.0, lie: 55, color: '#ffe23a', ouch: ['ref:hit-ow', 1.0, 0.9] },
  },
  transformMusic: 'transform-music2',     // как было при рендере (ускоренная в 1.5 раза)
  order: ['skel', 'lord'],
  background: { theme: 'castle', seed: 74, sunX: 640, sunY: 160 },
  clouds: [[120, 70, 2.4, 0, 14], [720, 200, 1.8, 1, 18], [1200, 60, 2.6, 2, 12], [1660, 240, 1.6, 0, 20], [420, 300, 1.4, 1, 16]],
});
const { FPS, NF, GROUND, C, key, move, ev, sfx, hop, tumble, laugh, tremble, transform, stance, walk, turn,
  dodge, fallBack, getUp, flyOff, victory, chuckle, hand, toRig, statesAt, stateAt, target } = ST;

// крылья большого Скелета: взмахи (кости B16, B17)
function flap(f0, f1, gain = 0.6) {
  for (let f = f0; f < f1; f += 6) {
    key('skel', f, { b_B16: -30, b_B17: 30 }, 3);
    key('skel', f + 3, { b_B16: 46, b_B17: -46 }, 3, 'in');
  }
  key('skel', f1, { b_B16: 12, b_B17: -12 }, 4);
  sfx('gust', f0, { who: 'skel', dur: f1 - f0, gain });
}

// ------------------------------------------------------------------ динамит
const TS = 104;                                        // сторона блока
// блоки: A — отдельно у шарика-Лорда, B, C, D — стопка за ним (D сверху)
const POS = { A: [1570, 0], B: [1700, 0], C: [1700 + TS, 0], D: [1700 + TS / 2, 1] };
const TNTS = {};                                      // {segs, fuses: [[f0, f1]]}
for (const [k, [x, row]] of Object.entries(POS)) TNTS[k] = { segs: [{ f0: 0, at: [x, GROUND + 2 - row * TS] }], fuses: [] };
const BOOMS = [];                                     // {f, at, size}
const SOOT = [];                                      // {who, part, f0, f1, w, dy}
const P = (v, f, S) => (typeof v === 'function' ? v(f, S) : typeof v === 'string' ? target(v, S) : v);
const tntAt = (T, f, S) => {
  let cur = null;
  for (const c of T.segs) if (f >= c.f0) cur = c;
  if (!cur || cur.gone) return null;
  if (cur.at) return { x: cur.at[0], y: cur.at[1], rot: 0, isAt: true };
  if (cur.hand) { const h = C[cur.hand].big.point(S[cur.hand].st, 'handB'); return { x: h[0], y: h[1] + TS * 0.5, rot: 0, hand: cur.hand }; }
  const u = E.clamp((f - cur.f0) / (cur.f1 - cur.f0), 0, 1);
  const a = P(cur.a, cur.f0, statesAt(cur.f0)), b = P(cur.b, f, S);
  return { x: E.lerp(a[0], b[0], u), y: E.lerp(a[1], b[1], E.EASE[cur.ease || 'lin'](u)) - Math.sin(Math.PI * u) * (cur.arc || 0), rot: (cur.spin || 0) * u };
};
const fusing = (T, f) => T.fuses.some(([a, b]) => f >= a && f < b);
// бум: вспышка, тряска, звук; сажа на том, кто рядом
function bang(T, f, at, o = {}) {
  T.segs.push({ f0: f, gone: true });
  BOOMS.push({ f, at, size: o.size || 230 });
  sfx('explode', f, { at, gain: 1.0 });
  ev('flash', { f, at, strength: 0.5 });
  ev('shake', { f, amp: 26, n: 18 });
  ev('zoom', { f, n: 14, k: 0.06, at });
  if (o.who) SOOT.push({ who: o.who, part: o.part || 'face', f0: f + 2, f1: o.until || f + 90, w: o.w || 170, dy: o.dy || 0 });
}
// поднять блок из стопки (большой Лорд, стопка справа за ним)
function pickTnt(f, x, k) {
  const T = TNTS[k], [px, row] = POS[k];
  turn('lord', f, 1, x);
  key('lord', f + 4, { lean: 22, hip: [0, toRig('lord', 90)], head: 8 }, 8);
  key('lord', f + 12, { hitB: 1, hitBto: [px, GROUND - row * TS - TS * 0.9], hitBfix: f + 12 }, 6);
  T.segs.push({ f0: f + 12, hand: 'lord' });
  sfx('pop', f + 12, { who: 'lord', gain: 0.4 });
  key('lord', f + 24, { ...stance('lord', x, 1), hitB: 0, handB: hand('lord', 'B', 0.4, -0.25) }, 10);
  turn('lord', f + 26, -1, x);
  key('lord', f + 30, { handB: hand('lord', 'B', 0.45, -0.3) }, 3);
  return T;
}
// поджечь спичкой: дальняя рука к фитилю — чирк
function light(T, f, o = {}) {
  key('lord', f - 6, { handF: hand('lord', 'F', 0.55, -0.55) }, 6);
  key('lord', f + 6, { handF: stance('lord', 0, -1).handF }, 6);
  sfx('flick', f, { who: 'lord', gain: 0.9 });
  T.fuses.push([f, o.until || 9999]);
  sfx('fuse', f, { who: 'lord', dur: o.dur || 40, gain: 0.6 });
}
// бросок из ближней руки
function toss(T, f, n, tgt, x, o = {}) {
  key('lord', f - 8, { handB: hand('lord', 'B', -0.55, -0.75), lean: -8 }, 7);
  key('lord', f, { handB: hand('lord', 'B', 0.9, -0.45), lean: 12, mouth: o.mouth || 'happy with theeth' }, 4, 'in2');
  key('lord', f + 14, stance('lord', x, -1, { mouth: o.after || 'theeth smile' }), 10);
  const h = C.lord.big.point(stateAt(f).lord.st, 'handB');
  T.segs.push({ f0: f, f1: f + n, a: [h[0], h[1] + TS * 0.5], b: tgt, arc: o.arc ?? 120, spin: -Math.PI * 2 });
  sfx('swing', f - 3, { who: 'lord', gain: 0.8 });
  return f + n;
}
// кашляет дымом
function cough(who, f, n = 3) {
  for (let i = 0; i < n; i++) {
    const g = f + i * 9;
    key(who, g, { sx: 1.06, sy: 0.95 }, 2);
    key(who, g + 4, { sx: 1, sy: 1 }, 3);
    sfx('ref:grunt', g, { who, gain: 0.45, pitch: 1.4 });
    PUFFS.push({ who, f: g });
  }
}
const PUFFS = [];

const SS = 560, LS = 1360;
// ================================================================== 0–1.8 с: стойка
key('skel', 0, { form: 'small', x: SS, y: GROUND, face: 1, look: 1, eyes: 'normal', mouth: 'smile normal', sx: 1, sy: 1, rot: 0, pivot: 0 }, 0);
key('lord', 0, { form: 'small', x: LS, y: GROUND, face: -1, look: 1, eyes: 'normal', mouth: 'smile normal', sx: 1, sy: 1, rot: 0, pivot: 0 }, 0);

const BIG = () => {
  // ---- 1.8–4 с: Скелет чиркает крылом по фитилю нижнего блока — бум
  const T0 = TNTS.A, AX = POS.A[0];
  key('skel', 40, { eyes: 'angry', mouth: 'happy with theeth' }, 0);
  sfx('ref:grin-eee', 40, { who: 'skel', gain: 0.5, pitch: 1.2 });
  const J = 44, OVER = 60, BACK = 72;
  key('skel', J - 4, { sx: 1.2, sy: 0.82 }, 4);
  move('skel', J, { x: SS, y: GROUND });
  move('skel', J + 8, { x: 1100, y: GROUND - 420 }, 'out2');
  move('skel', OVER, { x: AX - 40, y: GROUND - TS - 30 }, 'in2');
  key('skel', J + 2, { sx: 0.86, sy: 1.16 }, 2);
  key('skel', J + 8, { sx: 1, sy: 1 }, 3);
  sfx('ref:fwip', J + 1, { who: 'skel', gain: 0.8 });
  sfx('flick', OVER, { x: AX, gain: 1.0 });
  T0.fuses.push([OVER, OVER + 26]);
  sfx('fuse', OVER, { x: AX, dur: 26, gain: 0.6 });
  move('skel', BACK, { x: 1000, y: GROUND - 260 }, 'out2');
  move('skel', BACK + 10, { x: SS + 60, y: GROUND }, 'in2');
  key('skel', BACK + 10, { sx: 1.2, sy: 0.82 }, 1);
  key('skel', BACK + 14, { sx: 1, sy: 1 }, 4);
  key('lord', OVER + 4, { mouth: 'puzzlement' }, 0);
  key('lord', OVER + 6, { sx: 0.3 }, 1);
  key('lord', OVER + 7, { face: 1 }, 0);
  key('lord', OVER + 8, { sx: 1 }, 1);                               // оглянулся на шипение
  const B0 = OVER + 26;
  bang(T0, B0, [AX, GROUND - 60], { who: 'lord', part: 'body', until: 140, w: 290, size: 210 });
  key('lord', B0, { sx: 1.3, sy: 0.72, eyes: 'sad', mouth: 'puzzlement' }, 1);
  key('lord', B0 + 5, { sx: 1, sy: 1 }, 4);
  key('lord', B0 + 8, { sx: 0.3 }, 1);
  key('lord', B0 + 9, { face: -1 }, 0);
  key('lord', B0 + 10, { sx: 1 }, 1);
  sfx('ref:hit-ow', B0 + 3, { who: 'lord', gain: 0.8 });
  cough('lord', B0 + 10, 2);
  key('skel', B0 + 4, { mouth: 'happy with theeth' }, 0);
  sfx('ref:laugh', B0 + 6, { who: 'skel', gain: 0.85, pitch: 1.3 });
  laugh('skel', B0 + 6, B0 + 26);

  // ---- 4–5.2 с: Лорд «растёт», отряхивается
  const LX = 1470;
  const LB = transform('lord', B0 + 26, LS, LX, -1, { style: 'grow' });
  key('lord', LB, stance('lord', LX, -1), 0);
  key('lord', LB + 6, { mouth: 'angry theeth', eyes: 'angry' }, 0);
  key('skel', LB - 2, { mouth: 'puzzlement', eyes: 'sad' }, 0);
  ev('sweat', { who: 'skel', f0: LB, f1: LB + 22 });

  // ---- 5.5–8.5 с: бросок — Скелет отбивает головой — бум у ног Лорда, шляпа взлетает
  const T1 = pickTnt(LB + 8, LX, 'D');
  light(T1, LB + 44, { dur: 40 });
  const TH1 = LB + 54, HB = TH1 + 18;
  const sTop = (f, S) => { const t = target('skel:top', S); return [t[0] + 20, t[1] - TS * 0.2]; };
  toss(T1, TH1, 18, sTop, LX, { arc: 160, mouth: 'happy with theeth', after: 'puzzlement' });
  key('skel', HB - 6, { sx: 1.15, sy: 0.85, eyes: 'angry', mouth: 'angry theeth' }, 4);
  key('skel', HB, { sx: 0.82, sy: 1.22 }, 2);
  key('skel', HB + 6, { sx: 1, sy: 1 }, 4);
  move('skel', HB - 4, { x: SS + 60, y: GROUND });
  move('skel', HB, { y: GROUND - 60 }, 'out2');
  move('skel', HB + 6, { y: GROUND }, 'in2');
  sfx('bonk', HB, { who: 'skel', gain: 0.8 });
  const feetL = [LX - 70, GROUND + 2];
  T1.segs.push({ f0: HB, f1: HB + 18, a: sTop, b: feetL, arc: 180, spin: Math.PI * 3 });
  T1.fuses[0][1] = HB + 22;
  key('lord', HB + 8, { mouth: 'puzzlement', eyes: 'sad', head: 8 }, 4);
  const B1 = HB + 22;
  bang(T1, B1, [LX - 60, GROUND - 60], { who: 'lord', until: B1 + 80, w: 190, dy: 0 });
  HAT.push({ f0: B1, f1: B1 + 28 });
  key('lord', B1, { hip: [0, toRig('lord', 60)], lean: -6, eyes: 'sad', mouth: 'puzzlement', head: 0 }, 2);
  key('lord', B1 + 8, { hip: [0, 8], lean: 0 }, 6);
  sfx('ref:hit-ow', B1 + 3, { who: 'lord', gain: 0.8, pitch: 0.9 });
  sfx('whoosh', B1 + 1, { who: 'lord', dur: 14, gain: 0.5 });
  sfx('pop', B1 + 28, { who: 'lord', gain: 0.6 });
  cough('lord', B1 + 30, 2);
  key('skel', B1 + 2, { mouth: 'happy with theeth', eyes: 'normal' }, 0);
  sfx('ref:laugh', B1 + 4, { who: 'skel', gain: 0.85, pitch: 1.3 });
  laugh('skel', B1 + 4, B1 + 24);

  // ---- 9–10.3 с: Скелет «растёт»
  const SX = 520;
  const SB = transform('skel', B1 + 18, SS + 60, SX, 1, { style: 'grow' });
  key('skel', SB, stance('skel', SX, 1), 0);
  key('skel', SB + 6, { mouth: 'theeth smile', eyes: 'angry' }, 0);

  // ---- 10.8–14 с: ещё бросок — Скелет сдувает его крыльями обратно — Лорд на спине
  const T2 = pickTnt(B1 + 56, LX, 'C');
  light(T2, B1 + 92, { dur: 50 });
  const TH2 = B1 + 102, MID = TH2 + 14;
  key('lord', TH2 - 10, { mouth: 'angry theeth', eyes: 'angry' }, 0);
  const midPt = [960, GROUND - 330];
  toss(T2, TH2, 14, midPt, LX, { arc: 80, mouth: 'angry theeth', after: 'puzzlement' });
  flap(TH2 - 4, MID + 18, 0.8);
  key('skel', TH2 - 4, { lean: -6, mouth: 'happy open mouth' }, 4);
  ev('wind', { f0: TH2, f1: MID + 20, x0: SX + 200, x1: LX + 80, snd: false });
  const back = [LX - 40, GROUND - 120];
  T2.segs.push({ f0: MID, f1: MID + 14, a: midPt, b: back, arc: 60, spin: Math.PI * 4 });
  T2.fuses[0][1] = MID + 14;
  key('lord', MID + 4, { mouth: 'puzzlement', eyes: 'sad' }, 0);
  sfx('scared', MID + 4, { who: 'lord', gain: 0.8 });
  const B2 = MID + 14;
  bang(T2, B2, back, { who: 'lord', until: B2 + 120, w: 190, size: 250 });
  const down = fallBack('lord', B2 + 1, LX, -1, { n: 14, stars: 40, forward: true });   // лицом в траву — голова в кадре
  sfx('ref:hit-ow', B2 + 3, { who: 'lord', gain: 0.8, pitch: 0.9 });
  key('skel', B2 + 4, { mouth: 'happy with theeth', eyes: 'normal' }, 0);
  sfx('ref:laugh', B2 + 6, { who: 'skel', gain: 0.85, pitch: 1.0 });
  chuckle('skel', B2 + 6, B2 + 32, { mouth: 'happy with theeth' });

  // ---- 15–20 с: встаёт; фитиль последнего гаснет — заглядывает — бум в лицо, улетает
  const UP = down + 14;
  const stood = getUp('lord', UP, LX, -1, { mouth: 'angry theeth', forward: true });
  ev('steam', { who: 'lord', f0: stood, f1: stood + 24 });
  sfx('anger', stood, { who: 'lord', dur: 20, gain: 0.6 });
  const P3 = stood + 6;
  const T3 = pickTnt(P3, LX, 'B');
  const LX2 = 1300;
  walk('lord', P3 + 30, LX, LX2, 1, 10, -1);
  key('lord', P3 + 42, { handB: hand('lord', 'B', 0.55, -0.3), mouth: 'happy with theeth' }, 6);
  const L3 = P3 + 44;
  light(T3, L3, { until: L3 + 10, dur: 10 });
  sfx('poof', L3 + 10, { who: 'lord', gain: 0.3 });                // фитиль погас
  key('lord', L3 + 14, { mouth: 'puzzlement', eyes: 'normal' }, 0);
  // подносит блок к лицу и заглядывает
  const PEEK = L3 + 20;
  key('lord', PEEK, { handB: hand('lord', 'B', 0.75, -0.75), head: 10, lean: 6 }, 10);
  key('lord', PEEK + 6, { head: 14 }, 6);
  T3.fuses.push([PEEK + 8, PEEK + 18]);
  sfx('fuse', PEEK + 8, { who: 'lord', dur: 10, gain: 0.7 });
  key('lord', PEEK + 12, { mouth: 'puzzlement', eyes: 'sad' }, 0);
  const B3 = PEEK + 18;
  const h3 = C.lord.big.point(stateAt(B3).lord.st, 'handB');
  bang(T3, B3, [h3[0], h3[1] + 40], { size: 260 });
  sfx('scared', B3 + 2, { who: 'lord', gain: 0.9 });
  flyOff('lord', B3 + 1, B3 + 26, [LX2, GROUND], [2300, -320], { turns: 3 });
  SOOT.push({ who: 'lord', part: 'face', f0: B3 + 1, f1: B3 + 30, w: 190, dy: 0 });
  key('skel', B3 + 4, { mouth: 'happy with theeth', eyes: 'normal' }, 0);
  sfx('ref:laugh', B3 + 8, { who: 'skel', gain: 0.85, pitch: 1.0 });
  victory('skel', B3 + 12, SX, { n: 9, stride: 110 });
  window.T = { LB, SB, B0, B1, B2, B3 };
};

const HAT = [];                                         // шляпа взлетает: {f0, f1}
ST.hooks.drawPose = (who, p, f) => {
  if (who !== 'lord' || p.form !== 'big') return p;
  return HAT.some((h) => f >= h.f0 && f < h.f1) ? { ...p, hide: [...(p.hide || []), 'hat'] } : p;
};
// блок и искры фитиля (фитиль — над серединой верха, с учётом поворота)
function drawTnt(ctx, T, t, f) {
  const fz = fusing(T, f);
  FX.tnt(ctx, t.x, t.y, TS, fz ? (Math.sin(f * 1.6) > 0 ? 1 : 0) : 0, t.rot);
  if (fz) {
    const a = t.rot, d = TS * 0.5 + TS * 0.3;
    FX.fuseSparks(ctx, t.x + Math.sin(a) * d + Math.cos(a) * TS * 0.04, t.y - TS * 0.5 - Math.cos(a) * d, f / FPS);
  }
}
ST.hooks.beforeChars.push((ctx, f, S, CAM) => {
  ctx.setTransform(...CAM);
  for (const T of Object.values(TNTS)) { const t = tntAt(T, f, S); if (t && t.isAt) drawTnt(ctx, T, t, f); }
});
ST.hooks.afterChars.push((ctx, f, S, CAM) => {
  ctx.setTransform(...CAM);
  for (const s of SOOT) {
    if (f < s.f0 || f > s.f1) continue;
    const p = target(`${s.who}:${s.part}`, S);
    FX.soot(ctx, p[0], p[1] + s.dy, s.w, Math.min(1, (s.f1 - f) / 10), s.f0);
  }
  for (const T of Object.values(TNTS)) {
    const t = tntAt(T, f, S);
    if (!t || t.isAt) continue;
    ctx.setTransform(...CAM);
    drawTnt(ctx, T, t, f);
    if (t.hand) { const { ch, st, p } = S[t.hand]; ch.draw(ctx, { ...st, p: { ...p, only: 'B' } }, CAM); }
  }
  ctx.setTransform(...CAM);
  // шляпа Лорда взлетает и падает обратно
  for (const h of HAT) {
    if (f < h.f0 || f >= h.f1) continue;
    const u = (f - h.f0) / (h.f1 - h.f0), top = target('lord:top', S);
    ctx.save(); ctx.translate(top[0], top[1] + 60 - Math.sin(Math.PI * u) * 260); ctx.rotate(u * Math.PI * 4);
    const L = C.lord.big, l = L.layers.find((x) => x.name === 'hat');
    const sc = L.scale, w = (l.bbox[2] - l.bbox[0]) * sc, hh = (l.bbox[3] - l.bbox[1]) * sc;
    ctx.drawImage(l.img.canvas, -w / 2, -hh / 2, w, hh);
    ctx.restore();
  }
  for (const q of PUFFS) {
    const u = (f - q.f) / 16;
    if (u < 0 || u > 1) continue;
    const m = target(`${q.who}:face`, S);
    FX.puff(ctx, m[0] + (S[q.who].p.face || 1) * (20 + 50 * u), m[1] - 30 * u, 18 + 22 * u, 0.85 * (1 - u), '#6d6d6d', '#2f2f2f');
  }
  for (const b of BOOMS) FX.boom(ctx, ...P(b.at, b.f, statesAt(b.f)), b.size, (f - b.f) / 24, b.f);
});

ST.start(BIG);
