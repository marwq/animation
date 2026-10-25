// Ролик 25 (серия по образцу): Магнит — Лорд, Жёлтая и Радужный, 25 с, 24 кадра/с. Плотно, как у HugyTi:
// магнит притягивает всё железное, а кто стоит на пути — получает: ведро на голову, наковальня сверху.
// Музыка превращения — присланная, ~4 с с затиханием, только при первом превращении. Фон — саванна.
//
//   0–1.8 с   ведро, шарик-Лорд, шарик-Жёлтая, радужный шарик с магнитом во рту, наковальня справа
//   1.8–3.5 с Радужный включает магнит — ведро летит и надевается Лорду на голову, Лорда тащит по траве
//   3.6–4.8 с Лорд «растёт» под музыку — ведро слетает
//   5–7.2 с   отнимает магнит — наковальня летит дугой и падает на Радужного — он в лепёшку
//   7.2–8.4 с магнитом тянет ведро — Жёлтая на пути, ведро ей на голову
//   8.5–9.8 с Жёлтая «растёт» — Лорд влюблён
//   10–13.2 с Лорд на коленях дарит ей магнит — она поднимает наковальню с Радужного, крутит над головой —
//             и роняет Лорду на голову — «пуф», Лорд снова шарик
//   13.3–14.6 с Радужный отлипает и «растёт» — тоже влюблён
//   15–19 с   она тянет ведро — оно надевается Радужному на голову; бросает магнит за кадр — Радужного
//             в ведре и наковальню с шариком-Лордом утаскивает следом
//   19–25 с   Жёлтая в центре, руки вверх
'use strict';

const ST = Stage({
  name: 'mc25-magnet',
  cast: {
    lord: { small: ['lord-verity-small', { bodyHeight: 300 }], big: ['lord-verity-big', { height: 730 }], pivot: 337,
      voice: 1.0, lie: 55, color: '#ffe23a', ouch: ['ref:hit-ow', 1.0, 0.9] },
    yel: { small: ['girl-verity-small', { bodyHeight: 300, recolor: 'yellow' }],
      big: ['verity-big-girl', { height: 730, splitFeet: true, recolor: 'yellow' }], pivot: 337, voice: 1.45, vAngle: 50,
      color: '#ffe23a', moods: { angry: 'angry theeth', grin: 'theeth smile', big: 'theeth smile' } },
    rb: { small: ['skeleton-verity-small', { scale: 0.455, recolor: 'rainbow' }], big: ['all-verity-color', { height: 730 }],
      pivot: 325, voice: 0.85, lie: 55, color: '#ff7a3a', moods: { angry: 'angry theeth', grin: 'happy with theeth', big: 'theeth smile', love: 'happy - spittle' } },
  },
  order: ['lord', 'yel', 'rb'],
  background: { theme: 'savanna', seed: 251, sunX: 960, sunY: 130 },
  clouds: [[120, 80, 2.4, 0, 12], [640, 210, 1.8, 1, 16], [1250, 60, 2.6, 2, 10], [1700, 250, 1.6, 0, 18]],
});
const { FPS, NF, GROUND, C, key, move, ev, sfx, hop, tumble, laugh, tremble, transform, shrink, love, stance, walk, turn,
  victory, chuckle, hand, toRig, statesAt, stateAt, target } = ST;

ST.parts.mouth = (ch, st, p) => {
  const name = ch.layers.some((l) => l.name === p.mouth) ? p.mouth : 'smile normal', l = ch.layers.find((x) => x.name === name);
  return E.apply(ch.eyeMatrix(st, name), [(l.bbox[0] + l.bbox[2]) / 2, (l.bbox[1] + l.bbox[3]) / 2]);
};
const P = (v, f, S) => (typeof v === 'function' ? v(f, S) : typeof v === 'string' ? target(v, S) : v);

// ------------------------------------------------------------------ магнит, ведро, наковальня
const MS = 120;                                     // длина магнита
const MAG = [];                                     // {f0, mouth} | {f0, hand, arm} | {f0, at, aim} | {f0, f1, a, b, arc, r0, r1}; aim: число | цель
const ON = [];                                      // магнит «включён»: [f0, f1]
function magAt(f, S) {
  let cur = null;
  for (const c of MAG) if (f >= c.f0) cur = c;
  if (!cur) return null;
  let g;
  if (cur.mouth) { const m = target(`${cur.mouth}:mouth`, S); g = [m[0] - 30, m[1] + 4]; }
  else if (cur.hand) { if (S[cur.hand].p.form !== 'big') return null; g = C[cur.hand].big.point(S[cur.hand].st, 'hand' + (cur.arm || 'F')); }
  else if (cur.at) g = cur.at;
  else {
    const u = E.clamp((f - cur.f0) / (cur.f1 - cur.f0), 0, 1), a = P(cur.a, cur.f0, statesAt(cur.f0)), b = P(cur.b, f, S);
    return { g: [E.lerp(a[0], b[0], u), E.lerp(a[1], b[1], u) - Math.sin(Math.PI * u) * (cur.arc || 0)], aim: E.lerp(cur.r0, cur.r1, u) };
  }
  let aim = cur.aim ?? 0;
  if (typeof aim !== 'number') { const t = P(aim, f, S); aim = Math.atan2(t[1] - g[1], t[0] - g[0]); }
  return { g, aim };
}
const poleOf = (m) => [m.g[0] + Math.cos(m.aim) * MS * 0.82, m.g[1] + Math.sin(m.aim) * MS * 0.82];
function segAt(segs, f, S) {
  let cur = null;
  for (const c of segs) if (f >= c.f0) cur = c;
  if (!cur || cur.gone) return null;
  if (cur.at) { const p = P(cur.at, f, S); return { x: p[0], y: p[1], rot: cur.rot || 0, front: cur.front }; }
  if (cur.head) { const t = target(`${cur.head}:top`, S); return { x: t[0], y: t[1] + (cur.dy || 0), rot: Math.PI, front: true }; }
  if (cur.orbit) {                                   // крутится над головой
    const c = P(cur.orbit, f, S), a = (f - cur.f0) * 0.45;
    return { x: c[0] + Math.cos(a) * 170, y: c[1] + 70 + Math.sin(a) * 50, rot: a, front: true };
  }
  const u = E.clamp((f - cur.f0) / (cur.f1 - cur.f0), 0, 1), a = P(cur.a, cur.f0, statesAt(cur.f0)), b = P(cur.b, f, S);
  return { x: E.lerp(a[0], b[0], u), y: E.lerp(a[1], b[1], E.EASE[cur.ease || 'lin'](u)) - Math.sin(Math.PI * u) * (cur.arc || 0), rot: E.lerp(cur.r0 || 0, cur.r1 || 0, u), front: true };
}
const BUCKET = [], ANVIL = [];
const BK = 110, AS = 180;
const clang = (f, who) => { sfx('bonk', f, { who, gain: 0.9 }); sfx('pop', f, { who, gain: 0.5, pitch: 1.6 }); ev('stars', { who, f0: f + 2, f1: f + 18, snd: false }); };
const pull = (f0, f1) => { ON.push([f0, f1]); sfx('whirr', f0, { x: 960, dur: f1 - f0, gain: 0.45, pitch: 1.8 }); sfx('zap', f0, { x: 960, gain: 0.35 }); };

const LS = 420, YS = 1260, RS = 1560, B0 = [210, GROUND + 2], A0 = [1770, GROUND + 2];
// ================================================================== 0–1.8 с: стойка
key('lord', 0, { form: 'small', x: LS, y: GROUND, face: 1, look: 1, eyes: 'normal', mouth: 'smile normal', sx: 1, sy: 1, rot: 0, pivot: 0, alpha: 1 }, 0);
key('yel', 0, { form: 'small', x: YS, y: GROUND, face: -1, look: 1, eyes: 'normal', mouth: 'smile normal', sx: 1, sy: 1, rot: 0, pivot: 0, alpha: 1 }, 0);
key('rb', 0, { form: 'small', x: RS, y: GROUND, face: -1, look: 1, eyes: 'normal', mouth: 'smile normal', sx: 1, sy: 1, rot: 0, pivot: 0, alpha: 1 }, 0);
MAG.push({ f0: 0, mouth: 'rb', aim: Math.PI });
BUCKET.push({ f0: 0, at: B0, rot: 0 });
ANVIL.push({ f0: 0, at: A0, rot: 0 });

const BIG = () => {
  // ---- 1.8–3.5 с: магнит — ведро на голову Лорду, Лорда тащит
  key('rb', 36, { mouth: 'happy with theeth', eyes: 'angry' }, 0);
  sfx('ref:grin-eee', 36, { who: 'rb', gain: 0.45, pitch: 1.15 });
  pull(40, 76);
  const HIT = 52, ltop = (f, S) => { const t = target('lord:top', S); return [t[0], t[1] + 38]; };
  BUCKET.push({ f0: 42, f1: HIT, a: B0, b: ltop, arc: 90, r0: 0, r1: Math.PI });
  BUCKET.push({ f0: HIT, head: 'lord', dy: 38 });
  sfx('whoosh', 42, { x: 300, dur: 10, gain: 0.5 });
  clang(HIT, 'lord');
  key('lord', HIT, { sx: 1.2, sy: 0.84, mouth: 'puzzlement', eyes: 'sad' }, 1);
  key('lord', HIT + 4, { sx: 1, sy: 1 }, 3);
  const L1 = 690, DR = HIT + 6, STOP = 76;
  move('lord', DR, { x: LS, y: GROUND, rot: 0 });
  key('lord', DR, { pivot: 150 }, 0);
  move('lord', STOP, { x: L1, rot: 14 }, 'in');
  key('lord', STOP + 4, { rot: 0 }, 4);
  sfx('slide', DR, { who: 'lord', gain: 0.7 });
  sfx('ref:grunt', DR + 4, { who: 'lord', gain: 0.5, pitch: 1.2 });
  key('yel', HIT + 4, { mouth: 'happy with theeth' }, 0);
  laugh('yel', HIT + 6, HIT + 22);
  sfx('ref:laugh', HIT + 6, { who: 'rb', gain: 0.8, pitch: 1.2 });

  // ---- 3.6–4.8 с: Лорд «растёт» — ведро слетает
  const LX = 600;
  key('lord', STOP + 2, { eyes: 'angry', mouth: 'angry theeth' }, 0);
  const LB = transform('lord', STOP + 4, L1, LX, 1, { style: 'grow' });
  const B1 = [1480, GROUND + 2];
  BUCKET.push({ f0: LB, f1: LB + 18, a: ltop, b: B1, arc: 320, r0: Math.PI, r1: Math.PI * 4 });
  BUCKET.push({ f0: LB + 18, at: B1, rot: 0 });
  sfx('pop', LB, { who: 'lord', gain: 0.8 });
  sfx('land', LB + 18, { x: B1[0], gain: 0.5 });
  key('lord', LB, stance('lord', LX, 1), 0);
  key('lord', LB + 4, { mouth: 'angry theeth', eyes: 'angry' }, 0);
  sfx('ref:lord-breath', LB + 4, { who: 'lord', gain: 1.8, dur: 14, fade: 0.15 });
  key('lord', LB + 7, { lean: -12, head: -10, hip: [0, toRig('lord', 4)] }, 3);
  key('lord', LB + 15, { lean: 0, head: 0, hip: [0, toRig('lord', 8)] }, 8);
  // Радужный скачет к нему дразниться
  const R1 = 860;
  key('rb', LB - 6, { mouth: 'happy with theeth', eyes: 'normal' }, 0);
  hop('rb', LB - 4, LB + 10, RS, 1060, 260);
  hop('rb', LB + 12, LB + 22, 1060, R1, 80);
  key('rb', LB + 24, { face: -1 }, 0);
  for (let i = 0; i < 3; i++) { key('rb', LB + 24 + i * 5, { rot: i % 2 ? -10 : 10, pivot: 150 }, 3); }
  sfx('ref:laugh', LB + 24, { who: 'rb', gain: 0.8, pitch: 1.2 });

  // ---- 5–7.2 с: отнимает магнит — наковальня дугой падает на Радужного
  const K = C.lord.big, SN = LB + 40;
  key('rb', SN - 2, { rot: 0 }, 2);
  key('lord', SN - 6, { lean: 14, hip: [0, toRig('lord', 60)] }, 6);
  key('lord', SN, { hitF: 1, hitFto: (() => { const m = target('rb:mouth', stateAt(SN)); return [m[0] - 30, m[1]]; })(), hitFfix: SN }, 5, 'in2');
  MAG.push({ f0: SN, hand: 'lord', arm: 'F', aim: 0 });
  sfx('whoosh', SN, { who: 'lord', dur: 5, gain: 0.5 });
  key('rb', SN + 1, { mouth: 'puzzlement', eyes: 'sad', sx: 0.9, sy: 1.1 }, 1);
  key('rb', SN + 5, { sx: 1, sy: 1 }, 3);
  const AIM = SN + 10;
  key('lord', AIM, { ...stance('lord', LX, 1), hitF: 0, handF: hand('lord', 'F', 0.95, -0.35), mouth: 'happy with theeth', eyes: 'angry' }, 8);
  MAG.push({ f0: AIM, hand: 'lord', arm: 'F', aim: -0.25 });
  pull(AIM + 2, AIM + 22);
  const AF = AIM + 6, ADROP = AF + 16, rbAt = (f, S) => { const b = target('rb:body', S); return [b[0], GROUND + 2]; };
  ANVIL.push({ f0: AF, f1: ADROP, a: A0, b: rbAt, arc: 420, r0: 0, r1: -Math.PI * 2, ease: 'io' });
  const onRb = (f, S) => [R1, target('rb:top', S)[1] + 8];
  ANVIL.push({ f0: ADROP, at: onRb, rot: 0, front: true });
  sfx('whoosh', AF, { x: 1400, dur: 14, gain: 0.7 });
  key('yel', AF + 4, { mouth: 'puzzlement', eyes: 'sad', sy: 0.85, sx: 1.1 }, 3);   // пригнулась
  key('yel', AF + 12, { sy: 1, sx: 1 }, 4);
  key('rb', ADROP - 6, { head: -10, mouth: 'puzzlement', eyes: 'sad' }, 4);
  key('rb', ADROP, { sx: 1.35, sy: 0.55, rot: 0 }, 1);
  sfx('slam', ADROP, { who: 'rb', gain: 1.0 });
  sfx('squish', ADROP, { who: 'rb', gain: 0.9 });
  ev('shake', { f: ADROP, amp: 14, n: 8 });
  ev('dust', { f: ADROP, x: R1, r: 60, n: 7 });
  sfx('ref:hit-ow', ADROP + 2, { who: 'rb', gain: 0.8, pitch: 1.3 });
  key('lord', ADROP + 2, { mouth: 'happy with theeth', eyes: 'normal' }, 0);
  sfx('ref:laugh', ADROP + 4, { who: 'lord', gain: 0.85, pitch: 0.95 });
  chuckle('lord', ADROP + 4, ADROP + 20, { mouth: 'happy with theeth' });

  // ---- 7.2–8.4 с: магнитом тянет ведро — Жёлтая на пути
  const AIM2 = ADROP + 14, BH = AIM2 + 12, ytop = (f, S) => { const t = target('yel:top', S); return [t[0], t[1] + 38]; };
  key('lord', AIM2 - 4, { handF: hand('lord', 'F', 0.95, -0.15), mouth: 'happy with theeth', eyes: 'angry' }, 4);
  MAG.push({ f0: AIM2 - 4, hand: 'lord', arm: 'F', aim: 0.02 });
  pull(AIM2, AIM2 + 14);
  BUCKET.push({ f0: AIM2 + 2, f1: BH, a: B1, b: ytop, arc: 60, r0: 0, r1: Math.PI });
  BUCKET.push({ f0: BH, head: 'yel', dy: 38 });
  clang(BH, 'yel');
  key('yel', BH, { sx: 1.2, sy: 0.84, mouth: 'puzzlement', eyes: 'sad' }, 1);
  key('yel', BH + 4, { sx: 1, sy: 1 }, 3);
  for (const [f, dx] of [[BH + 5, -24], [BH + 10, 20]]) { move('yel', f, { x: YS + dx }, 'io'); key('yel', f, { rot: dx > 0 ? 8 : -8, pivot: 150 }, 4); }
  sfx('ref:grunt', BH + 3, { who: 'yel', gain: 0.6, pitch: 1.5 });
  sfx('ref:laugh', BH + 4, { who: 'lord', gain: 0.85, pitch: 0.95 });
  chuckle('lord', BH + 4, BH + 18, { mouth: 'happy with theeth' });

  // ---- 8.5–9.8 с: Жёлтая «растёт» — Лорд влюблён
  const YX = 1250;
  key('yel', BH + 14, { rot: 0, eyes: 'angry', mouth: 'angry theeth' }, 2);
  move('yel', BH + 14, { x: YS });
  const YB = transform('yel', BH + 14, YS, YX, -1, { style: 'grow', love: 'lord', loveDur: 56 });
  const B2 = [260, GROUND + 2];
  BUCKET.push({ f0: YB, f1: YB + 20, a: ytop, b: B2, arc: 360, r0: Math.PI, r1: Math.PI * 4 });
  BUCKET.push({ f0: YB + 20, at: B2, rot: 0 });
  sfx('pop', YB, { who: 'yel', gain: 0.8 });
  sfx('land', YB + 20, { x: B2[0], gain: 0.5 });
  key('yel', YB, stance('yel', YX, -1), 0);
  key('yel', YB + 6, { mouth: 'theeth smile', eyes: 'normal' }, 0);

  // ---- 10–13.2 с: Лорд на коленях дарит магнит — наковальня над её головой — Лорду на голову
  const LX2 = LX, KY = C.yel.big;
  const KN = YB + 18;
  key('lord', KN, { hip: [0, toRig('lord', 120)], lean: 18, head: 6, handF: hand('lord', 'F', 1.0, -0.15), mouth: 'happy - spittle' }, 6);
  MAG.push({ f0: KN - 2, hand: 'lord', arm: 'F', aim: -Math.PI / 2 });
  const YX2 = 1160;
  walk('yel', YB + 8, YX, YX2, 1, 10, -1);
  const TK = KN + 10;
  key('yel', TK, { hitF: 1, hitFto: (() => K.point(stateAt(TK).lord.st, 'handF'))(), hitFfix: TK }, 6);
  MAG.push({ f0: TK, hand: 'yel', arm: 'F', aim: -Math.PI / 2 });
  sfx('pop', TK, { who: 'yel', gain: 0.5 });
  key('yel', TK + 8, { ...stance('yel', YX2, -1), hitF: 0, handF: hand('yel', 'F', 0.8, -0.5), mouth: 'happy with theeth', eyes: 'angry' }, 6);
  MAG.push({ f0: TK + 8, hand: 'yel', arm: 'F', aim: [R1, GROUND - 60] });
  // наковальня поднимается с Радужного — он отлипает
  const LIFT = TK + 14, ORB = LIFT + 12, DROP2 = ORB + 22, LHIT = DROP2 + 10;
  pull(LIFT, DROP2);
  const over = (f, S) => { const t = target('yel:top', S); return [t[0], t[1]]; };
  ANVIL.push({ f0: LIFT, f1: ORB, a: () => onRb(LIFT, statesAt(LIFT)), b: (f, S) => { const c = over(f, S); return [c[0] + 170, c[1] + 70]; }, arc: 80, r0: 0, r1: 1.2 });
  ANVIL.push({ f0: ORB, orbit: over });
  sfx('whoosh', LIFT, { x: R1, dur: 10, gain: 0.6 });
  key('yel', LIFT, { handF: hand('yel', 'F', 0.2, -1.0) }, 6);
  MAG.push({ f0: LIFT + 4, hand: 'yel', arm: 'F', aim: -Math.PI / 2 });
  key('rb', LIFT + 2, { sx: 1.25, sy: 0.85 }, 3, 'out');
  key('rb', LIFT + 6, { sx: 0.92, sy: 1.1 }, 3);
  key('rb', LIFT + 10, { sx: 1, sy: 1, head: 0, mouth: 'puzzlement' }, 3);
  sfx('boing', LIFT + 2, { who: 'rb', gain: 0.6 });
  ev('stars', { who: 'rb', f0: LIFT + 6, f1: LIFT + 30, snd: false });
  sfx('whirr', ORB, { who: 'yel', dur: DROP2 - ORB, gain: 0.5 });
  key('lord', ORB, { mouth: 'puzzlement', eyes: 'sad', hip: [0, toRig('lord', 8)], lean: 0, head: -10 }, 6);
  ev('sweat', { who: 'lord', f0: ORB + 4, f1: LHIT });
  // роняет ему на голову
  key('yel', DROP2 - 2, { handF: hand('yel', 'F', 0.95, 0.1), lean: 10 }, 4, 'in2');
  const lt = (f, S) => { const t = target('lord:top', S); return [t[0], t[1] + 40]; };
  ANVIL.push({ f0: DROP2, f1: LHIT, a: () => { const o = segAt([{ f0: ORB, orbit: over }], DROP2, statesAt(DROP2)); return [o.x, o.y]; }, b: lt, arc: 60, r0: 0, r1: Math.PI * 2, ease: 'in2' });
  const AL = [290, GROUND + 2], LB2 = 430;
  ANVIL.push({ f0: LHIT, f1: LHIT + 12, a: lt, b: AL, arc: 160, r0: 0, r1: -0.3 });
  ANVIL.push({ f0: LHIT + 12, at: AL, rot: 0 });
  sfx('bonk', LHIT, { who: 'lord', gain: 1.0 });
  sfx('slam', LHIT, { who: 'lord', gain: 0.6 });
  ev('shake', { f: LHIT, amp: 12, n: 8 });
  const sm = shrink('lord', LHIT + 2, LX2, 1, { mouth: 'puzzlement', eyes: 'sad', smoke: 400 });
  key('lord', sm, { lean: 0, head: 0, hip: [0, 0] }, 0);
  hop('lord', sm + 6, sm + 16, LX2, LB2, 90);
  ev('stars', { who: 'lord', f0: sm + 18, f1: sm + 50, snd: false });
  key('yel', LHIT + 2, { ...stance('yel', YX2, -1), handF: hand('yel', 'F', 0.6, -0.3), mouth: 'happy with theeth', eyes: 'normal', lean: 0 }, 6);
  MAG.push({ f0: LHIT + 2, hand: 'yel', arm: 'F', aim: 0 });
  sfx('ref:laugh', LHIT + 4, { who: 'yel', gain: 0.85, pitch: 1.45 });
  chuckle('yel', LHIT + 4, LHIT + 22, { mouth: 'happy with theeth' });

  // ---- 13.3–14.6 с: Радужный «растёт» — влюблён
  const RX = 760;
  key('rb', LHIT + 4, { eyes: 'angry', mouth: 'angry theeth' }, 0);
  ev('vein', { who: 'rb', f0: LHIT + 4, f1: LHIT + 14 });
  const RB = transform('rb', LHIT + 6, R1, RX, 1, { style: 'grow' });
  key('rb', RB, stance('rb', RX, 1), 0);
  love('rb', RB + 6, RB + 50);
  key('rb', RB + 6, { handF: hand('rb', 'F', 0.85, -0.45), handB: hand('rb', 'B', 0.7, -0.5), lean: 8 }, 6);

  // ---- 15–19 с: ведро ему на голову — магнит за кадр — всех утаскивает следом
  const AIM3 = RB + 16, BH3 = AIM3 + 12, rtop = (f, S) => { const t = target('rb:top', S); return [t[0], t[1] + 60]; };
  key('yel', AIM3 - 4, { handF: hand('yel', 'F', 0.95, -0.2), mouth: 'happy with theeth', eyes: 'angry' }, 4);
  MAG.push({ f0: AIM3 - 4, hand: 'yel', arm: 'F', aim: Math.PI });
  pull(AIM3, AIM3 + 14);
  BUCKET.push({ f0: AIM3 + 2, f1: BH3, a: B2, b: rtop, arc: 80, r0: 0, r1: Math.PI });
  BUCKET.push({ f0: BH3, head: 'rb', dy: 60 });
  clang(BH3, 'rb');
  key('rb', BH3, { mouth: 'puzzlement', eyes: 'sad', lean: 0, handF: hand('rb', 'F', 0.6, -0.4), handB: hand('rb', 'B', -0.4, -0.5) }, 2);
  for (let i = 0; i < 2; i++) { key('rb', BH3 + 4 + i * 6, { lean: i % 2 ? -8 : 8 }, 4); }
  sfx('ref:grunt', BH3 + 3, { who: 'rb', gain: 0.6, pitch: 0.9 });
  // бросает магнит через всех влево за кадр
  const THR = BH3 + 16, GONE = THR + 20;
  key('yel', THR - 6, { handF: hand('yel', 'F', -0.2, -0.9), lean: -8 }, 6);
  key('yel', THR, { handF: hand('yel', 'F', 0.95, -0.5), lean: 12 }, 4, 'in2');
  key('yel', THR + 10, { ...stance('yel', YX2, -1), mouth: 'happy with theeth', eyes: 'normal', lean: 0 }, 8);
  sfx('swing', THR - 3, { who: 'yel', gain: 0.9 });
  MAG.push({ f0: THR, f1: GONE, a: (f, S) => KY.point(S.yel.st, 'handF'), b: [-400, GROUND - 300], arc: 260, r0: Math.PI, r1: Math.PI * 5 });
  pull(THR + 4, GONE + 10);
  sfx('whoosh', THR, { who: 'yel', dur: 16, gain: 0.7 });
  // Радужного (ведро) тянет следом: сначала скользит назад, потом летит
  const KR = C.rb.big, G0 = THR + 6;
  key('rb', G0, { pivot: (KR.anchor[1] - KR.top) / 2, legFfk: 1, legBfk: 1, legF: [-30, 50], legB: [25, -40], handF: hand('rb', 'F', 0.7, -0.6), handB: hand('rb', 'B', 0.5, -0.7) }, 2);
  move('rb', G0, { x: RX, y: GROUND, rot: 0 });
  move('rb', G0 + 18, { x: -500, y: GROUND - 200, rot: -200 }, 'in');
  sfx('scared', G0 + 2, { who: 'rb', gain: 0.8 });
  // наковальню с шариком-Лордом тоже
  const AG = G0 + 4;
  ANVIL.push({ f0: AG, f1: AG + 18, a: AL, b: [-500, GROUND - 120], arc: 60, r0: 0, r1: -1.5, ease: 'in' });
  ANVIL.push({ f0: AG + 18, gone: true });
  key('lord', AG - 4, { mouth: 'puzzlement', eyes: 'sad' }, 0);
  move('lord', AG, { x: LB2, y: GROUND });
  move('lord', AG + 6, { x: LB2 - 120, y: GROUND - 130, rot: 0 }, 'out2');
  key('lord', AG + 6, { pivot: 150 }, 0);
  move('lord', AG + 22, { x: -480, y: GROUND - 260 }, 'in');
  move('lord', AG + 22, { rot: -540 }, 'lin');
  sfx('scared', AG + 6, { who: 'lord', gain: 0.7 });
  sfx('whoosh', AG + 6, { who: 'lord', dur: 14, gain: 0.6 });
  ev('twinkle', { f: AG + 18, at: [90, GROUND - 260], n: 22, size: 56 });
  sfx('ref:laugh', AG + 10, { who: 'yel', gain: 0.85, pitch: 1.45 });
  chuckle('yel', AG + 10, AG + 26, { mouth: 'happy with theeth' });
  const WIN = victory('yel', AG + 26, YX2, { n: 8, stride: 100 });
  window.T = { HIT, LB, SN, ADROP, BH, YB, TK, LIFT, LHIT, RB, BH3, THR, WIN };
};

// ------------------------------------------------------------------ рисование
const isOn = (f) => ON.some(([a, b]) => f >= a && f < b);
function drawBucket(ctx, b) { FX.paintBucket(ctx, b.x, b.y, BK, b.rot, '#b9c3cf', false); }
ST.hooks.beforeChars.push((ctx, f, S, CAM) => {
  ctx.setTransform(...CAM);
  const b = segAt(BUCKET, f, S); if (b && !b.front) drawBucket(ctx, b);
  const a = segAt(ANVIL, f, S); if (a && !a.front) FX.anvil(ctx, a.x, a.y, AS, a.rot);
});
ST.hooks.afterChars.push((ctx, f, S, CAM) => {
  ctx.setTransform(...CAM);
  const a = segAt(ANVIL, f, S); if (a && a.front) FX.anvil(ctx, a.x, a.y, AS, a.rot);
  const b = segAt(BUCKET, f, S); if (b && b.front) drawBucket(ctx, b);
  const m = magAt(f, S);
  if (m) {
    FX.horseshoeMagnet(ctx, m.g[0], m.g[1], MS, m.aim);
    if (isOn(f)) FX.magnetWaves(ctx, poleOf(m), m.aim, f / FPS, 1);
  }
});

ST.start(BIG);
