// Ролик 19 (серия по образцу): Острый перец — Малыш против Лорда, 25 с, 24 кадра/с. Плотно, как у HugyTi:
// от перца краснеют и дышат огнём, лист-щит отражает огонь, превращения туда и обратно, финал — ракета.
// Музыка превращения — присланная, ~4 с с затиханием, только при первом превращении. Фон — джунгли.
//
//   0–1.8 с   шарик-Малыш (слева), куст острого перца, шарик-Лорд (справа)
//   1.8–3.8 с Малыш на пропеллере срывает ртом перец и роняет зевающему Лорду в рот — Лорд краснеет,
//             пар из ушей, огонь изо рта вверх, скачет
//   3.8–5 с   Лорд «растёт» под музыку
//   5.2–8.3 с срывает перец, съедает, краснеет и дышит огнём на Малыша — шляпа Малыша горит, он в саже;
//             пропеллер крутится быстрее и сдувает огонь
//   8.3–9.5 с Малыш «растёт»
//   9.5–12.5 с Лорд поёт ей... то есть Малышу — Малыш бросает перец ему в открытый рот: красный, огонь вверх,
//             шляпа горит, его раздувает — «пуф», Лорд снова шарик
//   12.5–13.8 с Лорд «растёт» снова
//   14–16.8 с ещё перец — огонь на Малыша — Малыш закрывается огромным листом, огонь отражается в Лорда:
//             он в саже, шляпа дымится
//   16.8–20 с Малыш на пропеллере роняет огромный перец Лорду в рот — пар свистит, Лорд улетает ракетой
//   20–25 с   Малыш в центре, руки вверх
'use strict';

const ST = Stage({
  name: 'mc19-pepper',
  cast: {
    baby: { small: ['child-verity-pink', { bodyHeight: 300, spin: { layer: 'hat', cut: 122, axis: 389 } }],
      big: ['child-verity-big', { height: 730, spin: { layer: 'hat', cut: 106, axis: 330 } }], pivot: 338, voice: 1.25,
      lie: 60, color: '#ffd9b8', moods: { angry: ' 2', grin: ' 2', big: 'theeth smile', love: ' 1' } },
    lord: { small: ['lord-verity-small', { bodyHeight: 300 }], big: ['lord-verity-big', { height: 730 }], pivot: 337,
      alt: { hot: ['lord-verity-small', { bodyHeight: 300, recolor: 'hot' }], hotBig: ['lord-verity-big', { height: 730, recolor: 'hot' }] },
      voice: 1.0, lie: 55, color: '#ffe23a', ouch: ['ref:hit-ow', 1.0, 0.9] },
  },
  order: ['baby', 'lord'],
  background: { theme: 'jungle', seed: 191, sunX: 1500, sunY: 130 },
  clouds: [[120, 80, 2.4, 0, 12], [640, 210, 1.8, 1, 16], [1100, 60, 2.6, 2, 10], [420, 300, 1.4, 1, 14]],
});
const { FPS, NF, GROUND, C, key, move, ev, sfx, hop, laugh, tremble, transform, shrink, stance, walk, turn,
  victory, chuckle, hand, toRig, statesAt, stateAt, target } = ST;

ST.parts.mouth = (ch, st) => E.apply(ch.eyeMatrix(st, ' 2'), [315, 740]);    // рот шарика-Малыша
const P = (v, f, S) => (typeof v === 'function' ? v(f, S) : typeof v === 'string' ? target(v, S) : v);
function propeller(who, f0, f1, rps = 7, o = {}) {
  key(who, f0, { spin: 0, spinBlur: 0 }, 0);
  key(who, f0 + 8, { spinBlur: 1 }, 8);
  move(who, f1, { spin: rps * (f1 - f0) / 24 }, 'lin');
  key(who, f1, { spinBlur: 0 }, 6);
  key(who, f1 + 1, { spin: 0 }, 0);
  if (o.snd !== false) sfx('whirr', f0, { who, dur: f1 - f0, gain: o.gain ?? 0.4 });
}
// предмет по отрезкам: {f0, at, rot} | {f0, f1, a, b, arc, r0, r1, ease} | {f0, hand, arm, rot} | {f0, mouth} | {f0, gone}
function segAt(segs, f, S) {
  let cur = null;
  for (const c of segs) if (f >= c.f0) cur = c;
  if (!cur || cur.gone) return null;
  if (cur.at) { const p = P(cur.at, f, S); return { x: p[0], y: p[1], rot: cur.rot || 0 }; }
  if (cur.mouth) { const m = target(`${cur.mouth}:mouth`, S); return { x: m[0] + 30, y: m[1] + 4, rot: cur.rot || 0.4 }; }
  if (cur.hand) {
    if (S[cur.hand].p.form !== 'big') return null;
    const h = C[cur.hand].big.point(S[cur.hand].st, 'hand' + (cur.arm || 'F')); return { x: h[0], y: h[1] + (cur.dy || 0), rot: cur.rot || 0 };
  }
  const u = E.clamp((f - cur.f0) / (cur.f1 - cur.f0), 0, 1), a = P(cur.a, cur.f0, statesAt(cur.f0)), b = P(cur.b, f, S);
  return { x: E.lerp(a[0], b[0], u), y: E.lerp(a[1], b[1], E.EASE[cur.ease || 'lin'](u)) - Math.sin(Math.PI * u) * (cur.arc || 0), rot: E.lerp(cur.r0 || 0, cur.r1 || 0, u) };
}

// ------------------------------------------------------------------ перцы, огонь, сажа, лист
const BX0 = 920;                                   // куст перца
const HANG = [[-100, -110, 0.9], [80, -80, 1.7], [60, -170, 1.2], [-30, -190, 2.0], [120, -140, 1.4]];
const PEPPERS = [];                                // {segs, s} — перцы, которые сорвали
const pepper = (i, segs, s = 70) => { const p = { i, segs, s }; PEPPERS.push(p); return p; };
const FIRE = [];                                   // {f0, f1, from, to, seed}
const FLAMES = [];                                 // горит: {at, f0, f1, s}
const SOOT = [];                                   // {who, f0, f1}
const LEAF = [];                                   // лист в руке Малыша
const BUSH = { gone: 1e9 };
const hangAt = (i) => [BX0 + HANG[i][0], GROUND + HANG[i][1]];

const BS = 480, LS = 1380;
// ================================================================== 0–1.8 с: стойка
key('baby', 0, { form: 'small', x: BS, y: GROUND, face: 1, look: 1, eyes: 'normal', mouth: ' 6', sx: 1, sy: 1, rot: 0, pivot: 0, alpha: 1 }, 0);
key('lord', 0, { form: 'small', x: LS, y: GROUND, face: -1, look: 1, eyes: 'normal', mouth: 'smile normal', sx: 1, sy: 1, rot: 0, pivot: 0, alpha: 1, skin: '' }, 0);

const BIG = () => {
  // ---- 1.8–3.8 с: Малыш срывает перец ртом и роняет его зевающему Лорду в рот
  key('baby', 36, { eyes: 'angry', mouth: ' 2' }, 0);
  sfx('ref:grin-eee', 36, { who: 'baby', gain: 0.45, pitch: 1.3 });
  propeller('baby', 38, 96, 9);
  const S1 = stateAt(1), dM = [target('baby:mouth', S1)[0] - BS, target('baby:mouth', S1)[1] - GROUND];
  const GRAB = 50, P0 = hangAt(2);
  move('baby', 42, { x: BS, y: GROUND });
  move('baby', GRAB, { x: P0[0] - dM[0] - 30, y: P0[1] - dM[1] - 4 }, 'io');
  const C1 = pepper(2, [{ f0: GRAB, mouth: 'baby' }]);
  sfx('chomp', GRAB, { who: 'baby', gain: 0.7 });
  key('baby', GRAB, { sx: 1.08, sy: 0.93 }, 1);
  key('baby', GRAB + 4, { sx: 1, sy: 1 }, 3);
  const OVER = GRAB + 12, DROP = OVER + 2, IN = DROP + 8;
  move('baby', OVER, { x: LS - dM[0] - 40, y: GROUND - 430 }, 'io');
  sfx('whoosh', GRAB + 2, { who: 'baby', dur: 10, gain: 0.5 });
  // Лорд зевает
  key('lord', GRAB + 2, { mouth: 'happy open mouth', sx: 0.94, sy: 1.08, eyes: 'sad' }, 6);
  sfx('ref:lord-breath', GRAB + 2, { who: 'lord', gain: 0.9, dur: 14, fade: 0.2 });
  C1.segs.push({ f0: DROP, f1: IN, a: (f, S) => { const m = target('baby:mouth', S); return [m[0] + 30, m[1] + 4]; }, b: 'lord:lips', r0: 0.4, r1: 1.6, ease: 'in2' });
  C1.segs.push({ f0: IN, gone: true });
  key('baby', DROP, { mouth: ' 1', eyes: 'normal' }, 0);
  sfx('ref:laugh', DROP + 2, { who: 'baby', gain: 0.8, pitch: 1.3 });
  key('lord', IN, { mouth: 'smile normal', sx: 1.08, sy: 0.92, eyes: 'normal' }, 2);
  sfx('gulp', IN, { who: 'lord', gain: 1.0 });
  const HOT = IN + 6;
  key('lord', HOT, { skin: 'hot', eyes: 'sad', mouth: 'puzzlement', sx: 1.1, sy: 1.1 }, 0);
  key('lord', HOT + 3, { sx: 1, sy: 1 }, 3);
  ev('steam', { who: 'lord', f0: HOT, f1: HOT + 34 });
  sfx('fuse', HOT, { who: 'lord', dur: 20, gain: 0.7 });
  sfx('ref:hit-ow', HOT + 1, { who: 'lord', gain: 1.0, pitch: 1.25 });
  const up = (dx, dy) => (f, S) => { const m = target('lord:lips', S); return [m[0] + dx, m[1] + dy]; };
  FIRE.push({ f0: HOT + 4, f1: HOT + 18, from: 'lord:lips', to: up(-30, -360), seed: 1 });
  sfx('gust', HOT + 4, { who: 'lord', dur: 14, gain: 0.8 });
  sfx('explode', HOT + 4, { who: 'lord', gain: 0.35 });
  hop('lord', HOT + 4, HOT + 12, LS, LS - 60, 110);
  // Малыш садится
  move('baby', OVER + 6, { x: LS - dM[0] - 40, y: GROUND - 430 });
  move('baby', OVER + 22, { x: 600, y: GROUND }, 'io');
  key('baby', OVER + 22, { sx: 1.2, sy: 0.82 }, 1);
  key('baby', OVER + 26, { sx: 1, sy: 1 }, 3);
  sfx('land', OVER + 22, { who: 'baby', gain: 0.5 });
  laugh('baby', OVER + 24, OVER + 38);

  // ---- 3.8–5 с: Лорд «растёт»
  const LX = 1250, LT = HOT + 14;
  key('lord', LT, { skin: '', eyes: 'angry', mouth: 'angry theeth' }, 0);
  const LB = transform('lord', LT, LS - 60, LX, -1, { style: 'grow' });
  key('lord', LB, stance('lord', LX, -1), 0);
  key('lord', LB + 6, { mouth: 'happy with theeth', eyes: 'angry' }, 0);
  key('baby', LB - 2, { mouth: ' 5', eyes: 'sad' }, 0);
  ev('sweat', { who: 'baby', f0: LB, f1: LB + 20 });

  // ---- 5.2–8.3 с: срывает перец, ест, краснеет — огонь на Малыша; шляпа горит, пропеллер сдувает огонь
  const LX1 = 1250, BXs = 600;
  const PK = LB + 10, p1 = hangAt(1);
  key('lord', PK - 8, { lean: 18, hip: [0, toRig('lord', 70)], head: 6 }, 8);
  key('lord', PK, { hitF: 1, hitFto: [p1[0] + 20, p1[1]], hitFfix: PK }, 6);
  const C2 = pepper(1, [{ f0: PK, hand: 'lord', arm: 'F', rot: 1.7 }]);
  sfx('pop', PK, { who: 'lord', gain: 0.5 });
  const EAT = PK + 12;
  key('lord', EAT - 2, { hitF: 1, hitFto: 'lord:lips', hitFfix: undefined, lean: 0, head: 0, hip: [0, toRig('lord', 8)], mouth: 'happy open mouth' }, 8);
  C2.segs.push({ f0: EAT + 1, gone: true });
  sfx('chomp', EAT, { who: 'lord', gain: 0.8 });
  sfx('gulp', EAT + 4, { who: 'lord', gain: 0.9 });
  key('lord', EAT + 4, { hitF: 0, ...stance('lord', LX1, -1), mouth: 'smile normal' }, 6);
  const HOT2 = EAT + 8;
  key('lord', HOT2, { skin: 'hotBig', eyes: 'angry', mouth: 'angry theeth' }, 0);
  ev('steam', { who: 'lord', f0: HOT2, f1: HOT2 + 40 });
  sfx('fuse', HOT2, { who: 'lord', dur: 16, gain: 0.6 });
  const FB = HOT2 + 8, HITB = FB + 6;
  key('lord', FB - 4, { lean: -10, head: -8, mouth: 'puzzlement' }, 4);
  key('lord', FB, { lean: 10, head: 6, mouth: 'happy open mouth' }, 3, 'in2');
  FIRE.push({ f0: FB, f1: FB + 16, from: 'lord:lips', to: 'baby:body', seed: 4 });
  sfx('gust', FB, { who: 'lord', dur: 16, gain: 1.0 });
  sfx('explode', FB + 2, { who: 'baby', gain: 0.4 });
  key('baby', HITB, { mouth: ' 5', eyes: 'sad', sx: 1.1, sy: 0.92 }, 2);
  SOOT.push({ who: 'baby', f0: HITB + 2, f1: 0 });
  FLAMES.push({ at: 'baby:top', f0: HITB + 2, f1: HITB + 28, s: 90 });
  sfx('ref:hit-ow', HITB + 2, { who: 'baby', gain: 1.0, pitch: 1.3 });
  sfx('fuse', HITB + 2, { who: 'baby', dur: 30, gain: 0.6 });
  key('lord', FB + 18, { lean: 0, head: 0, mouth: 'happy with theeth', eyes: 'normal', skin: '' }, 6);
  sfx('ref:laugh', FB + 20, { who: 'lord', gain: 0.85, pitch: 1.0 });
  chuckle('lord', FB + 20, FB + 44, { mouth: 'happy with theeth' });
  // носится и тушит пропеллером
  hop('baby', HITB + 4, HITB + 12, BXs, BXs - 90, 90);
  hop('baby', HITB + 14, HITB + 22, BXs - 90, BXs, 90);
  sfx('scared', HITB + 6, { who: 'baby', gain: 0.8 });
  propeller('baby', HITB + 14, HITB + 34, 14, { gain: 0.6 });
  ev('wind', { f0: HITB + 18, f1: HITB + 32, x0: BXs, x1: BXs + 500, snd: false });
  const OUT = HITB + 28;
  ev('smoke', { f: OUT, who: 'baby', size: 160, dx: 0, y: GROUND - 330 });
  sfx('poof', OUT, { who: 'baby', gain: 0.5 });
  key('baby', OUT + 2, { mouth: ' 2', eyes: 'angry' }, 0);

  // ---- 8.3–9.5 с: Малыш «растёт»
  ev('vein', { who: 'baby', f0: OUT + 2, f1: OUT + 12 });
  const BXB = 560, BB = transform('baby', OUT + 4, BXs, BXB, 1, { style: 'grow' });
  SOOT[0].f1 = BB;
  key('baby', BB, stance('baby', BXB, 1), 0);
  key('baby', BB + 6, { mouth: 'happy with theeth', eyes: 'angry' }, 0);
  key('lord', BB - 2, { mouth: 'puzzlement', eyes: 'sad' }, 0);

  // ---- 9.5–12.5 с: Лорд поёт — перец ему в рот — огонь вверх, шляпа горит, раздувает — «пуф»
  const SING = BB + 10;
  key('lord', SING - 5, { lean: 6, head: -4, hip: [0, toRig('lord', 8)], handF: hand('lord', 'F', 0.95, -0.3), mouth: 'happy open mouth', eyes: 'normal' }, 6);
  sfx('ref:lord-sing', SING, { who: 'lord', gain: 1.4 });
  window.NOTES = [SING, SING + 18];
  key('lord', SING + 8, { head: 4 }, 6);
  key('lord', SING + 16, { head: -4 }, 6);
  const PK2 = BB + 8, p0 = hangAt(0), KB = C.baby.big;
  key('baby', PK2 - 6, { lean: 18, hip: [0, toRig('baby', 60)], head: 6 }, 6);
  key('baby', PK2, { hitF: 1, hitFto: [p0[0] - 20, p0[1]], hitFfix: PK2 }, 5);
  const C3 = pepper(0, [{ f0: PK2, hand: 'baby', arm: 'F', rot: 0.9 }]);
  sfx('pop', PK2, { who: 'baby', gain: 0.5 });
  key('baby', PK2 + 8, { ...stance('baby', BXB, 1), hitF: 0, handF: hand('baby', 'F', -0.2, -0.85) }, 8);
  const TH = SING + 12, IN2 = TH + 12;
  key('baby', TH, { handF: hand('baby', 'F', 0.95, -0.35), lean: 10 }, 4, 'in2');
  key('baby', TH + 12, { ...stance('baby', BXB, 1), mouth: 'happy with theeth', eyes: 'normal' }, 10);
  sfx('swing', TH - 3, { who: 'baby', gain: 0.8 });
  C3.segs.push({ f0: TH, f1: IN2, a: (f, S) => KB.point(S.baby.st, 'handF'), b: 'lord:lips', arc: 100, r0: 0.9, r1: 0.9 + Math.PI * 3 });
  C3.segs.push({ f0: IN2, gone: true });
  key('lord', IN2, { mouth: 'puzzlement', eyes: 'sad', head: -6 }, 1);
  sfx('gulp', IN2, { who: 'lord', gain: 1.0 });
  const HOT3 = IN2 + 6;
  key('lord', HOT3, { skin: 'hotBig', lean: 0, head: -14, mouth: 'happy open mouth', handF: hand('lord', 'F', 0.3, -0.95), handB: hand('lord', 'B', -0.3, -0.95) }, 3);
  ev('steam', { who: 'lord', f0: HOT3, f1: HOT3 + 40 });
  sfx('fuse', HOT3, { who: 'lord', dur: 24, gain: 0.7 });
  FIRE.push({ f0: HOT3 + 2, f1: HOT3 + 18, from: 'lord:lips', to: up(-60, -380), seed: 7 });
  sfx('gust', HOT3 + 2, { who: 'lord', dur: 16, gain: 0.9 });
  sfx('explode', HOT3 + 2, { who: 'lord', gain: 0.35 });
  FLAMES.push({ at: 'lord:hat', f0: HOT3 + 8, f1: HOT3 + 24, s: 110 });
  sfx('ref:hit-ow', HOT3 + 10, { who: 'lord', gain: 1.0, pitch: 0.95 });
  // раздувает — «пуф»
  const INF = HOT3 + 18;
  key('lord', INF, { sx: 1.12, sy: 1.12, head: 0 }, 12, 'in');
  tremble('lord', INF - 6, INF + 6, LX1, 4);
  sfx('inflate', INF - 12, { who: 'lord', dur: 12, gain: 0.7 });
  const sm = shrink('lord', INF + 6, LX1, -1, { mouth: 'puzzlement', eyes: 'sad', smoke: 400 });
  key('lord', sm, { lean: 0, head: 0, hip: [0, 0], skin: 'hot' }, 0);
  key('lord', sm + 20, { skin: '' }, 0);
  ev('steam', { who: 'lord', f0: sm, f1: sm + 20 });
  sfx('ref:laugh', INF + 8, { who: 'baby', gain: 0.85, pitch: 1.25 });
  chuckle('baby', INF + 8, INF + 30, { mouth: 'happy with theeth' });

  // ---- 12.5–13.8 с: Лорд «растёт» снова
  key('lord', sm + 8, { eyes: 'angry', mouth: 'angry theeth' }, 0);
  ev('vein', { who: 'lord', f0: sm + 8, f1: sm + 18 });
  const LB2 = transform('lord', sm + 10, LX1, LX1, -1, { style: 'grow' });
  key('lord', LB2, stance('lord', LX1, -1), 0);
  key('lord', LB2 + 4, { mouth: 'angry theeth', eyes: 'angry' }, 0);

  // ---- 14–16.8 с: ещё перец — огонь — Малыш закрывается листом, огонь отражается в Лорда
  const PK3 = LB2 + 6, p4 = hangAt(4);
  key('lord', PK3 - 8, { lean: 22, hip: [0, toRig('lord', 90)], head: 8 }, 8);
  key('lord', PK3, { hitF: 1, hitFto: [p4[0] + 20, p4[1]], hitFfix: PK3 }, 6);
  const C4 = pepper(4, [{ f0: PK3, hand: 'lord', arm: 'F', rot: 1.4 }]);
  sfx('pop', PK3, { who: 'lord', gain: 0.5 });
  const EAT2 = PK3 + 12;
  key('lord', EAT2 - 2, { hitF: 1, hitFto: 'lord:lips', hitFfix: undefined, lean: 0, head: 0, hip: [0, toRig('lord', 8)], mouth: 'happy open mouth' }, 8);
  C4.segs.push({ f0: EAT2 + 1, gone: true });
  sfx('chomp', EAT2, { who: 'lord', gain: 0.8 });
  key('lord', EAT2 + 4, { hitF: 0, ...stance('lord', LX1, -1), mouth: 'smile normal' }, 6);
  const HOT4 = EAT2 + 8;
  key('lord', HOT4, { skin: 'hotBig', eyes: 'angry', mouth: 'angry theeth' }, 0);
  ev('steam', { who: 'lord', f0: HOT4, f1: HOT4 + 30 });
  sfx('fuse', HOT4, { who: 'lord', dur: 14, gain: 0.6 });
  // лист с земли — щит
  LEAF.push({ f0: HOT4 - 6, f1: HOT4, a: [BXB - 150, GROUND], b: (f, S) => KB.point(S.baby.st, 'handB'), r0: -0.6, r1: 0.35 });
  LEAF.push({ f0: HOT4, hand: 'baby', arm: 'B', rot: 0.35 });
  ev('twinkle', { f: HOT4 - 6, at: [BXB - 150, GROUND - 60], n: 12, size: 34 });
  sfx('whoosh', HOT4 - 6, { who: 'baby', dur: 6, gain: 0.5 });
  key('baby', HOT4 - 2, { handB: hand('baby', 'B', 0.8, -0.35), handF: hand('baby', 'F', 0.6, -0.5), mouth: 'happy with theeth', eyes: 'angry' }, 4);
  const FB2 = HOT4 + 8, REF = FB2 + 10;
  key('lord', FB2 - 4, { lean: -10, head: -8, mouth: 'puzzlement' }, 4);
  key('lord', FB2, { lean: 10, head: 6, mouth: 'happy open mouth' }, 3, 'in2');
  const leafC = (f, S) => { const h = KB.point(S.baby.st, 'handB'); return [h[0] + 60, h[1] - 170]; };
  FIRE.push({ f0: FB2, f1: REF, from: 'lord:lips', to: leafC, seed: 9 });
  sfx('gust', FB2, { who: 'lord', dur: 10, gain: 1.0 });
  FIRE.push({ f0: REF, f1: REF + 12, from: leafC, to: 'lord:face', seed: 11 });
  sfx('boing', REF, { who: 'baby', gain: 0.6 });
  sfx('gust', REF, { who: 'baby', dur: 12, gain: 0.8 });
  const BURN = REF + 8;
  sfx('explode', BURN, { who: 'lord', gain: 0.45 });
  key('lord', BURN, { skin: '', mouth: 'puzzlement', eyes: 'sad', lean: -10, head: -10 }, 2);
  SOOT.push({ who: 'lord', f0: BURN, f1: NF });
  FLAMES.push({ at: 'lord:hat', f0: BURN, f1: BURN + 20, s: 90 });
  ev('smoke', { f: BURN + 18, who: 'lord', size: 180, dx: 0, y: GROUND - 760 });
  sfx('ref:hit-ow', BURN + 2, { who: 'lord', gain: 1.0, pitch: 0.95 });
  ev('stars', { who: 'lord', f0: BURN + 4, f1: BURN + 24, snd: false });
  key('lord', BURN + 12, { ...stance('lord', LX1, -1), mouth: 'sad', eyes: 'sad' }, 8);
  key('baby', BURN + 4, { mouth: 'happy with theeth', eyes: 'normal' }, 0);
  sfx('ref:laugh', BURN + 6, { who: 'baby', gain: 0.85, pitch: 1.25 });
  chuckle('baby', BURN + 6, BURN + 24, { mouth: 'happy with theeth' });
  LEAF.push({ f0: BURN + 20, f1: BURN + 30, a: (f, S) => KB.point(S.baby.st, 'handB'), b: [BXB - 260, GROUND - 10], arc: 80, r0: 0.35, r1: -1.4 });
  LEAF.push({ f0: BURN + 30, at: [BXB - 260, GROUND - 10], rot: -1.4 });
  key('baby', BURN + 22, { ...stance('baby', BXB, 1), mouth: 'happy with theeth' }, 6);

  // ---- 16.8–20 с: огромный перец (растёт в руке) — бросок Лорду в рот — пар свистит — ракета
  const FLY = BURN + 22, p3 = hangAt(3);
  key('baby', FLY - 6, { lean: 18, hip: [0, toRig('baby', 60)], head: 6 }, 6);
  key('baby', FLY, { hitF: 1, hitFto: [p3[0] - 20, p3[1]], hitFfix: FLY }, 5);
  const C5 = pepper(3, [{ f0: FLY, hand: 'baby', arm: 'F', rot: 1.6, dy: 30 }], 70);
  sfx('pop', FLY, { who: 'baby', gain: 0.5 });
  key('baby', FLY + 8, { ...stance('baby', BXB, 1), hitF: 0, handF: hand('baby', 'F', 0.85, 0.15) }, 8);
  C5.grow = [FLY + 10, FLY + 20];
  sfx('grow', FLY + 10, { who: 'baby', gain: 0.8 });
  ev('twinkle', { f: FLY + 12, at: KB.point(stateAt(FLY + 12).baby.st, 'handF'), n: 16, size: 46 });
  key('lord', FLY + 14, { mouth: 'happy open mouth', head: -12, eyes: 'sad' }, 4);
  sfx('scared', FLY + 14, { who: 'lord', gain: 0.6 });
  const DR = FLY + 26, IN3 = DR + 12;
  key('baby', DR - 6, { handF: hand('baby', 'F', -0.7, 0.15), lean: -6 }, 6);       // замах снизу, сзади
  key('baby', DR, { handF: hand('baby', 'F', 0.95, -0.35), lean: 12 }, 4, 'in2');
  key('baby', DR + 12, { ...stance('baby', BXB, 1), mouth: 'happy with theeth', eyes: 'normal' }, 8);
  sfx('swing', DR - 3, { who: 'baby', gain: 0.9 });
  C5.segs.push({ f0: DR, f1: IN3, a: (f, S) => { const h = KB.point(S.baby.st, 'handF'); return [h[0], h[1] + 30]; }, b: 'lord:lips', arc: 120, r0: 1.6, r1: 1.6 + Math.PI * 2 });
  C5.segs.push({ f0: IN3, gone: true });
  sfx('gulp', IN3, { who: 'lord', gain: 1.0, pitch: 0.8 });
  key('lord', IN3, { mouth: 'puzzlement', sx: 1.08, sy: 0.94 }, 1);
  key('lord', IN3 + 4, { sx: 1, sy: 1 }, 3);
  const RED = IN3 + 6;
  key('lord', RED, { skin: 'hotBig', eyes: 'sad', mouth: 'Throw up', head: 0 }, 0);
  ev('steam', { who: 'lord', f0: RED, f1: RED + 30 });
  sfx('slide', RED + 2, { who: 'lord', gain: 0.8 });
  sfx('fuse', RED, { who: 'lord', dur: 24, gain: 0.8 });
  tremble('lord', RED, RED + 14, LX1, 6);
  const LAUNCH = RED + 14, KL = C.lord.big;
  key('lord', LAUNCH, { legFfk: 1, legBfk: 1, legF: [-10, 30], legB: [10, -20], handF: hand('lord', 'F', 0.2, -1.0), handB: hand('lord', 'B', -0.2, -1.0), mouth: 'puzzlement' }, 2);
  move('lord', LAUNCH, { x: LX1, y: GROUND });
  move('lord', LAUNCH + 3, { y: GROUND + 20 }, 'out');
  move('lord', LAUNCH + 22, { x: LX1 + 120, y: -900 }, 'in');
  key('lord', LAUNCH, { ...KL.feet(LX1, -1) }, 0);
  key('lord', LAUNCH + 22, { ...KL.feet(LX1 + 120, -1) }, 22, 'in');
  FIRE.push({ f0: LAUNCH, f1: LAUNCH + 22, from: (f, S) => [S.lord.p.x, S.lord.p.y - 20], to: (f, S) => [S.lord.p.x - 20, S.lord.p.y + 300], seed: 13 });
  sfx('explode', LAUNCH, { who: 'lord', gain: 0.7 });
  sfx('whoosh', LAUNCH + 2, { who: 'lord', dur: 18, gain: 0.8 });
  ev('shake', { f: LAUNCH, amp: 14, n: 10 });
  ev('dust', { f: LAUNCH, x: LX1, r: 70, n: 8 });
  ev('twinkle', { f: LAUNCH + 20, at: [LX1 + 140, 90], n: 22, size: 60 });
  BUSH.gone = LAUNCH + 3;
  sfx('poof', LAUNCH + 3, { x: BX0, gain: 0.6 });
  sfx('ref:laugh', LAUNCH + 6, { who: 'baby', gain: 0.85, pitch: 1.25 });
  chuckle('baby', LAUNCH + 6, LAUNCH + 22, { mouth: 'happy with theeth' });
  const WIN = victory('baby', LAUNCH + 22, BXB, { n: 9, stride: 110 });
  window.T = { IN, HOT, LB, FB, OUT, BB, IN2, sm, LB2, REF, IN3, LAUNCH, WIN };
};

// ------------------------------------------------------------------ рисование
const leafOnGround = (f) => { const c = LEAF.filter((k) => f >= k.f0).pop(); return !!(c && c.at); };
ST.hooks.beforeChars.push((ctx, f, S, CAM) => {
  ctx.setTransform(...CAM);
  const gone = new Set(PEPPERS.filter((p) => f >= p.segs[0].f0).map((p) => p.i));
  if (f < BUSH.gone) FX.chiliBush(ctx, BX0, GROUND, 70, HANG.filter((_, i) => !gone.has(i)), 5);
  const l = segAt(LEAF, f, S);
  if (l && leafOnGround(f)) FX.bigLeaf(ctx, l.x, l.y, 360, l.rot);
});
ST.hooks.afterChars.push((ctx, f, S, CAM) => {
  ctx.setTransform(...CAM);
  for (const s of SOOT) {
    if (f < s.f0 || (s.f1 && f >= s.f1)) continue;
    const p = target(`${s.who}:face`, S);
    FX.soot(ctx, p[0], p[1], S[s.who].p.form === 'big' ? 170 : 160, 1, s.f0);
  }
  for (const p of PEPPERS) {
    const q = segAt(p.segs, f, S);
    if (!q) continue;
    let s = p.s;
    if (p.grow) s *= 1 + 2.2 * E.EASE.out(E.clamp((f - p.grow[0]) / (p.grow[1] - p.grow[0]), 0, 1));
    FX.chili(ctx, q.x, q.y, s, q.rot);
  }
  const l = segAt(LEAF, f, S);
  if (l && !leafOnGround(f)) FX.bigLeaf(ctx, l.x, l.y, 360, l.rot);
  for (const q of FIRE) {
    if (f < q.f0 || f > q.f1 + 6) continue;
    FX.fireBreath(ctx, P(q.from, f, S), P(q.to, f, S), (f - q.f0) / FPS, Math.min(1, (f - q.f0 + 1) / 3, (q.f1 + 6 - f) / 6), q.seed);
  }
  for (const q of FLAMES) {
    if (f < q.f0 || f > q.f1) continue;
    const p = target(q.at, S);
    FX.flame(ctx, p[0], p[1] + 10, q.s, f / FPS, Math.min(1, (q.f1 - f) / 6));
  }
  if (f >= BUSH.gone && f < BUSH.gone + 40) FX.smoke(ctx, BX0, GROUND - 130, 340, (f - BUSH.gone) / 40, 3);
  if (window.NOTES) {
    const [n0, n1] = window.NOTES;
    if (f >= n0 && f <= n1 + 22) {
      const m = target('lord:lips', S);
      for (let i = 0; i < 4; i++) {
        const u = (f - n0 - i * 6) / 22;
        if (u < 0 || u > 1) continue;
        FX.note(ctx, m[0] - 40 - u * 170 + Math.sin(u * 9 + i) * 14, m[1] - 40 - u * 160, 1.3, Math.min(1, (1 - u) * 3), i % 2 === 1,
          ['#e8207a', '#7b3cff', '#ff7a00', '#1a9be6'][i]);
      }
    }
  }
});

ST.start(BIG);
