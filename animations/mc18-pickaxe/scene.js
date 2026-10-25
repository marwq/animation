// Ролик 18 (серия по образцу): Кирка и блоки — Лорд против Розовой, 25 с, 24 кадра/с. Плотно, как у HugyTi:
// кирка-бумеранг копает ямы, блоки летают, стена от поцелуя, превращения туда и обратно. Музыка превращения —
// присланная, ~4 с с затиханием, только при первом превращении. Фон — тайга с горами.
//
//   0–1.8 с   шарик-Лорд (слева), столбик из двух блоков, шарик-Розовая (справа), у неё кирка
//   1.8–3.4 с Лорд бьёт столбик головой — верхний блок летит Розовой на макушку
//   3.6–4.8 с Розовая «растёт» под музыку — блок разлетается; Лорд влюблён
//   5–8.6 с   бросает кирку — кирка выкапывает яму под Лордом, он падает в неё; три блока — крышка сверху;
//             Лорд стучит изнутри
//   8.7–10.5 с щелчок — большой Лорд пробивает крышку, выпрыгивает и тяжело дышит
//   10.5–13 с поёт ей и шлёт воздушный поцелуй — Розовая мгновенно строит стену из блоков, сердце лопается
//   13–15 с   Лорд дует — стена падает, верхний блок по голове Розовой — «пуф», она снова шарик
//   15.2–16.4 с Розовая «растёт» снова — Лорд опять влюблён
//   16.5–20.5 с кирка подкапывает землю под Лордом — он проваливается в яму по шею; блоки засыпают яму,
//             последний — ему на макушку; он плачет
//   20.5–25 с Розовая в центре, руки вверх
'use strict';

const ST = Stage({
  name: 'mc18-pickaxe',
  cast: {
    lord: { small: ['lord-verity-small', { bodyHeight: 300 }], big: ['lord-verity-big', { height: 730 }], pivot: 337,
      voice: 1.0, lie: 55, color: '#ffe23a', ouch: ['ref:hit-ow', 1.0, 0.9] },
    pink: { small: ['girl-verity-small', { bodyHeight: 300 }], big: ['girl-verity-big', { height: 730, splitFeet: true }],
      pivot: 337, voice: 1.35, vAngle: 50, color: '#ff4fc8', moods: { angry: 'angry theeth', grin: 'theeth smile', big: 'theeth smile' } },
  },
  order: ['lord', 'pink'],
  background: { theme: 'taiga', seed: 181, sunX: 420, sunY: 140 },
  clouds: [[110, 70, 2.4, 0, 12], [700, 200, 1.8, 1, 16], [1250, 60, 2.6, 2, 10], [1700, 250, 1.6, 0, 18]],
});
const { FPS, NF, GROUND, C, key, move, ev, sfx, hop, laugh, tremble, transform, shrink, love, stance,
  victory, chuckle, hand, toRig, statesAt, stateAt, target } = ST;

const P = (v, f, S) => (typeof v === 'function' ? v(f, S) : typeof v === 'string' ? target(v, S) : v);
const keyed = (ks, f) => {
  if (typeof ks === 'number') return ks;
  if (f <= ks[0][0]) return ks[0][1];
  for (let i = 1; i < ks.length; i++) {
    if (f < ks[i][0]) { const u = E.EASE.io((f - ks[i - 1][0]) / (ks[i][0] - ks[i - 1][0])); return E.lerp(ks[i - 1][1], ks[i][1], u); }
  }
  return ks[ks.length - 1][1];
};
// предмет по отрезкам: {f0, at, rot} | {f0, f1, a, b, arc, r0, r1} | {f0, hand: who, k, rot} | {f0, gone}
function segAt(segs, f, S) {
  let cur = null;
  for (const c of segs) if (f >= c.f0) cur = c;
  if (!cur || cur.gone) return null;
  if (cur.at) { const p = P(cur.at, f, S); return { x: p[0], y: p[1], rot: keyed(cur.rot || 0, f), k: keyed(cur.k ?? 1, f) }; }
  if (cur.hand) { if (S[cur.hand].p.form !== 'big') return null; const h = C[cur.hand].big.point(S[cur.hand].st, 'hand' + (cur.arm || 'B')); return { x: h[0], y: h[1], rot: keyed(cur.rot || 0, f), hand: true }; }
  const u = E.clamp((f - cur.f0) / (cur.f1 - cur.f0), 0, 1), a = P(cur.a, cur.f0, statesAt(cur.f0)), b = P(cur.b, f, S);
  return { x: E.lerp(a[0], b[0], u), y: E.lerp(a[1], b[1], E.EASE[cur.ease || 'lin'](u)) - Math.sin(Math.PI * u) * (cur.arc || 0), rot: E.lerp(cur.r0 || 0, cur.r1 || 0, u), k: 1 };
}

// ------------------------------------------------------------------ блоки, кирка, ямы, стена
const B = 100, PK = 210;
const BLOCKS = [];                                 // {segs, size}
const block = (segs, size = B) => { const b = { segs, size }; BLOCKS.push(b); return b; };
const PICK = [];                                   // сегменты кирки
const PITS = [];                                   // {f0, f1, x0: [[f,v]], x1, d: [[f,v]]}
const FILL = [];                                   // засыпка ямы: {pit, f0, level: [[f, v]]} — v от дна (0) до поверхности (1)
const BURSTS = [];                                 // {f, at, seed, n, size}
const WALL = { x: 1060, b: 120, n: 6, pops: [], tilt: [[0, 0]], f1: 1e9 };
const NOTES = [];
const CLIPS = [];                                  // {who, f0, f1, pit}
const DIRT = ['#8a5a2b', '#6a421c', '#5fd331'];

const LS = 480, PS = 1400, ST1 = 900;              // Лорд, Розовая, столбик
// ================================================================== 0–1.8 с: стойка
key('lord', 0, { form: 'small', x: LS, y: GROUND, face: 1, look: 1, eyes: 'normal', mouth: 'smile normal', sx: 1, sy: 1, rot: 0, pivot: 0, alpha: 1 }, 0);
key('pink', 0, { form: 'small', x: PS, y: GROUND, face: -1, look: 1, eyes: 'normal', mouth: 'smile normal', sx: 1, sy: 1, rot: 0, pivot: 0, alpha: 1 }, 0);
block([{ f0: 0, at: [ST1, GROUND - B / 2] }]);
const TOPB = block([{ f0: 0, at: [ST1, GROUND - B * 1.5] }]);
PICK.push({ f0: 0, at: [1060, GROUND - 20], rot: 1.35 });

const BIG = () => {
  // ---- 1.8–3.4 с: Лорд бьёт столбик головой — верхний блок Розовой на макушку
  const L1 = 720;
  key('lord', 38, { mouth: 'happy with theeth', eyes: 'angry' }, 0);
  sfx('ref:grin-eee', 38, { who: 'lord', gain: 0.45, pitch: 1.1 });
  hop('lord', 42, 52, LS, L1, 70);
  const BUMP = 60;
  key('lord', BUMP - 4, { sx: 0.9, sy: 1.1, rot: -10, pivot: 150 }, 3);
  move('lord', BUMP - 4, { x: L1 });
  move('lord', BUMP, { x: L1 + 30 }, 'in2');
  key('lord', BUMP, { sx: 1.2, sy: 0.85, rot: 6 }, 1);
  move('lord', BUMP + 8, { x: L1 }, 'out2');
  key('lord', BUMP + 6, { sx: 1, sy: 1, rot: 0 }, 4);
  sfx('bonk', BUMP, { x: ST1, gain: 0.9 });
  const LAND = BUMP + 14, ptop = (f, S) => { const t = target('pink:top', S); return [t[0], t[1] - B / 2 + 14]; };
  TOPB.segs.push({ f0: BUMP, f1: LAND, a: [ST1, GROUND - B * 1.5], b: ptop, arc: 220, r0: 0, r1: Math.PI * 2 });
  TOPB.segs.push({ f0: LAND, at: ptop, front: true });
  sfx('whoosh', BUMP + 1, { x: ST1, dur: 12, gain: 0.6 });
  sfx('slam', LAND, { who: 'pink', gain: 0.8 });
  key('pink', LAND, { sx: 1.3, sy: 0.75, mouth: 'puzzlement', eyes: 'sad' }, 1);
  key('pink', LAND + 6, { sx: 1.1, sy: 0.9 }, 5);
  ev('stars', { who: 'pink', f0: LAND + 2, f1: LAND + 22, snd: false });
  sfx('ref:grunt', LAND + 2, { who: 'pink', gain: 0.6, pitch: 1.5 });
  key('lord', BUMP + 10, { mouth: 'happy with theeth', eyes: 'normal' }, 0);
  sfx('ref:laugh', BUMP + 12, { who: 'lord', gain: 0.85, pitch: 1.0 });
  laugh('lord', BUMP + 12, BUMP + 30);

  // ---- 3.6–4.8 с: Розовая «растёт» — блок разлетается; Лорд влюблён
  const PX = 1380;
  key('pink', LAND + 12, { eyes: 'angry', mouth: 'angry theeth', sx: 1, sy: 1 }, 2);
  const PB = transform('pink', LAND + 14, PS, PX, -1, { style: 'grow', love: 'lord', loveDur: 60 });
  TOPB.segs.push({ f0: LAND + 18, gone: true });
  BURSTS.push({ f: LAND + 18, at: [PS, GROUND - 330], seed: 3, n: 12, size: 40 });
  sfx('crunch', LAND + 18, { who: 'pink', gain: 0.8 });
  key('pink', PB, stance('pink', PX, -1), 0);
  key('pink', PB + 6, { mouth: 'theeth smile', eyes: 'normal' }, 0);

  // ---- 5–8.6 с: кирка-бумеранг — яма под Лордом; крышка из трёх блоков
  const GRAB = PB + 8, K = C.pink.big;
  key('pink', GRAB - 8, { lean: 24, hip: [0, toRig('pink', 110)], head: 8 }, 8);
  key('pink', GRAB, { hitB: 1, hitBto: [1080, GROUND - 30], hitBfix: GRAB }, 6);
  PICK.push({ f0: GRAB, hand: 'pink', rot: [[GRAB, 1.35], [GRAB + 10, 1.0]] });
  sfx('pop', GRAB, { who: 'pink', gain: 0.5 });
  key('pink', GRAB + 10, { ...stance('pink', PX, -1), hitB: 0, handB: hand('pink', 'B', -0.4, -0.8), mouth: 'happy with theeth', eyes: 'angry' }, 10);
  const TH = GRAB + 16, DIG = TH + 12, PITX = L1 - 20, HD = -2.5, GRIP = (x) => [x + 126, GROUND - 160];
  key('pink', TH, { handB: hand('pink', 'B', 0.95, -0.3), lean: 12 }, 4, 'in2');
  key('pink', TH + 12, { ...stance('pink', PX, -1), handB: hand('pink', 'B', 0.25, 0.25), lean: 0, head: 0 }, 8);
  sfx('swing', TH - 3, { who: 'pink', gain: 0.8 });
  const hb = (f, S) => K.point(S.pink.st, 'handB');
  PICK.push({ f0: TH, f1: DIG, a: hb, b: GRIP(PITX), arc: 200, r0: 1.0, r1: HD - Math.PI * 4 });
  sfx('whoosh', TH, { who: 'pink', dur: 12, gain: 0.6 });
  PICK.push({ f0: DIG, at: GRIP(PITX), rot: HD });
  sfx('crunch', DIG, { x: PITX, gain: 1.0 });
  sfx('ref:crack1', DIG + 1, { x: PITX, gain: 0.8 });
  BURSTS.push({ f: DIG, at: [PITX, GROUND - 20], seed: 7, n: 16, size: 44 });
  ev('shake', { f: DIG, amp: 10, n: 6 });
  const D1 = 250, PIT1 = { f0: DIG, x0: PITX - 150, x1: PITX + 150, d: D1 };
  PITS.push(PIT1);
  key('lord', DIG, { mouth: 'puzzlement', eyes: 'sad', sx: 0.9, sy: 1.1 }, 1);
  move('lord', DIG, { x: L1, y: GROUND });
  move('lord', DIG + 7, { x: PITX }, 'lin');
  move('lord', DIG + 7, { y: GROUND + D1 }, 'in2');
  key('lord', DIG + 7, { sx: 1.2, sy: 0.85 }, 1);
  key('lord', DIG + 11, { sx: 1, sy: 1 }, 3);
  CLIPS.push({ who: 'lord', f0: DIG, f1: 0, pit: PIT1 });
  sfx('fallhole', DIG + 1, { who: 'lord', gain: 0.8 });
  sfx('ref:grunt', DIG + 7, { who: 'lord', gain: 0.5, pitch: 1.2 });
  const BACK = DIG + 12;
  PICK.push({ f0: BACK, f1: BACK + 12, a: GRIP(PITX), b: hb, arc: 180, r0: HD, r1: 1.0 + Math.PI * 4 });
  PICK.push({ f0: BACK + 12, hand: 'pink', rot: 1.0 });
  sfx('whoosh', BACK, { who: 'pink', dur: 12, gain: 0.5 });
  sfx('pop', BACK + 12, { who: 'pink', gain: 0.4 });
  // крышка: три блока со стопки у неё за спиной, бросок одной рукой
  const LIDS = [];
  for (let i = 0; i < 3; i++) {
    const t = BACK + 16 + i * 6, at = [PITX - B + i * B, GROUND - B / 2];
    key('pink', t - 3, { handF: hand('pink', 'F', 0.3, -0.8) }, 3);
    key('pink', t, { handF: hand('pink', 'F', 0.95, -0.35) }, 3, 'in2');
    const hf = (f, S) => K.point(S.pink.st, 'handF');
    block([{ f0: t, f1: t + 10, a: hf, b: at, arc: 160, r0: 0, r1: Math.PI * 2 }, { f0: t + 10, at, front: true }]);
    sfx('swing', t - 2, { who: 'pink', gain: 0.5 });
    sfx('slam', t + 10, { x: at[0], gain: 0.7 });
    LIDS.push(BLOCKS[BLOCKS.length - 1]);
  }
  const SHUT = BACK + 16 + 12 + 10;
  key('pink', SHUT, { ...stance('pink', PX, -1), handB: hand('pink', 'B', 0.25, 0.25), mouth: 'happy with theeth', eyes: 'normal' }, 6);
  sfx('ref:laugh', SHUT + 2, { who: 'pink', gain: 0.85, pitch: 1.35 });
  chuckle('pink', SHUT + 2, SHUT + 26, { mouth: 'happy with theeth' });
  // стучит изнутри — крышка подпрыгивает
  for (let i = 0; i < 2; i++) {
    const f = SHUT + 4 + i * 7;
    LIDS.forEach((L, j) => {
      const at = L.segs[1].at;
      L.segs.push({ f0: f + (j === i ? 0 : 1), at: [at[0], at[1] - (j === 1 ? 22 : 12)], rot: (j - 1) * 0.08, front: true }, { f0: f + 3, at, front: true });
    });
    sfx('bonk', f, { x: PITX, gain: 0.6 });
    sfx('ref:grunt', f + 1, { x: PITX, gain: 0.4, pitch: 0.9 });
  }

  // ---- 8.7–10.5 с: щелчок — большой Лорд пробивает крышку и выпрыгивает
  const SN = SHUT + 20, LX = 380, KL = C.lord.big;
  sfx('slide', SN - 6, { who: 'lord', gain: 0.7 });
  ev('flash', { f: SN, at: [PITX, GROUND - 60], strength: 0.3 });
  for (const L of LIDS) L.segs.push({ f0: SN, gone: true });
  BURSTS.push({ f: SN, at: [PITX, GROUND - 60], seed: 11, n: 20, size: 50 });
  sfx('crunch', SN, { x: PITX, gain: 1.0 });
  ev('shake', { f: SN, amp: 14, n: 8 });
  const OUT = SN + 14;
  key('lord', SN, { form: 'big', x: PITX, y: GROUND + 180, face: 1, sx: 1.08, sy: 0.92, look: 1, mouth: 'happy with theeth', eyes: 'angry', rot: 0, pivot: 0,
    legFfk: 1, legBfk: 1, legF: [-30, 50], legB: [25, -40], ...KL.feet(PITX, 1), handF: hand('lord', 'F', 0.3, -0.95), handB: hand('lord', 'B', -0.3, -0.95) }, 0);
  move('lord', SN, { x: PITX, y: GROUND + 180 });
  move('lord', SN + 7, { x: (PITX + LX) / 2, y: GROUND - 260 }, 'out2');
  move('lord', OUT, { x: LX, y: GROUND }, 'in2');
  key('lord', SN + 4, { sx: 1, sy: 1 }, 4);
  key('lord', OUT, { ...stance('lord', LX, 1), sx: 1.08, sy: 0.92 }, 0);
  key('lord', OUT + 5, { sx: 1, sy: 1 }, 5);
  CLIPS[0].f1 = SN + 6;
  sfx('land', OUT, { who: 'lord', gain: 0.8 });
  ev('dust', { f: OUT, x: LX, r: 50, n: 6 });
  key('pink', SN + 2, { mouth: 'puzzlement', eyes: 'sad' }, 0);
  ev('sweat', { who: 'pink', f0: SN + 4, f1: SN + 26 });
  const BR = OUT + 4;
  sfx('ref:lord-breath', BR, { who: 'lord', gain: 1.9, dur: 24, fade: 0.2 });
  for (const t of [0.02, 0.6]) {
    const f = BR + Math.round(t * FPS);
    key('lord', f + 3, { lean: -13, head: -11, hip: [0, toRig('lord', 4)] }, 3);
    key('lord', f + 11, { lean: -5, head: -4, hip: [0, toRig('lord', 14)] }, 8);
  }
  key('lord', BR + 4, { mouth: 'happy - spittle', eyes: 'normal' }, 0);
  love('lord', BR + 4, BR + 40, { mouth: false, snd: false });

  // ---- 10.5–13 с: поёт и шлёт поцелуй — она мгновенно строит стену, сердце лопается
  const SING = BR + 24;
  key('lord', SING - 5, { lean: 6, head: -4, hip: [0, toRig('lord', 8)], handF: hand('lord', 'F', 0.95, -0.3), mouth: 'happy open mouth' }, 6);
  sfx('ref:lord-sing', SING, { who: 'lord', gain: 1.4 });
  NOTES.push([SING, SING + 18]);
  key('lord', SING + 8, { head: 4 }, 6);
  key('lord', SING + 16, { head: -4 }, 6);
  const BUILD = SING + 8;
  key('pink', BUILD - 4, { mouth: 'angry theeth', eyes: 'angry', handF: hand('pink', 'F', 0.9, -0.1) }, 4);
  for (let i = 0; i < WALL.n; i++) { WALL.pops.push(BUILD + i * 2); sfx('pop', BUILD + i * 2, { x: WALL.x, gain: 0.6 }); }
  sfx('sparkle', BUILD, { x: WALL.x, gain: 0.6 });
  const KISS = SING + 20, WHIT = KISS + 14;
  key('lord', KISS - 3, { handF: hand('lord', 'F', 0.3, -0.75), mouth: 'happy - spittle' }, 4);
  key('lord', KISS + 4, { handF: hand('lord', 'F', 0.95, -0.2) }, 4);
  sfx('kiss', KISS - 3, { who: 'lord', gain: 0.8 });
  ev('heartshot', { f0: KISS, f1: WHIT, from: 'lord:lips', to: [WALL.x - WALL.b / 2 - 10, GROUND - 600], size: 130 });
  sfx('bonk', WHIT, { x: WALL.x, gain: 0.6 });
  key('lord', WHIT + 2, { mouth: 'sad', eyes: 'sad', handF: stance('lord', LX, 1).handF, head: 6, lean: 0, hip: [0, toRig('lord', 8)] }, 6);
  key('pink', WHIT + 2, { mouth: 'happy with theeth', eyes: 'normal', handF: stance('pink', PX, -1).handF }, 6);
  sfx('ref:laugh', WHIT + 4, { who: 'pink', gain: 0.85, pitch: 1.35 });
  chuckle('pink', WHIT + 4, WHIT + 24, { mouth: 'happy with theeth' });

  // ---- 13–15 с: Лорд дует — стена падает, верхний блок по голове Розовой — «пуф»
  const MAD = WHIT + 8;
  key('lord', MAD, { mouth: 'angry theeth', eyes: 'angry', head: 0 }, 0);
  ev('vein', { who: 'lord', f0: MAD, f1: MAD + 12 });
  const INH = MAD + 7, BLOW = INH + 8;
  key('lord', INH, { lean: -12, head: -10, mouth: 'puzzlement', handF: hand('lord', 'F', 0.2, -0.3), handB: hand('lord', 'B', -0.3, -0.2) }, 8);
  sfx('suck', INH - 6, { who: 'lord', dur: 8, gain: 0.6 });
  key('lord', BLOW, { lean: 14, head: 8 }, 3, 'in2');
  key('lord', BLOW + 18, { ...stance('lord', LX, 1), mouth: 'happy with theeth', eyes: 'normal' }, 8);
  ev('wind', { f0: BLOW, f1: BLOW + 18, x0: LX + 140, x1: 1500, snd: false });
  sfx('gust', BLOW, { who: 'lord', dur: 18, gain: 1.0 });
  const HITW = BLOW + 12, TILT = 0.36;
  WALL.tilt = [[BLOW + 2, 0], [HITW, TILT]];
  sfx('creak', BLOW + 2, { x: WALL.x, dur: 10, gain: 0.6 });
  WALL.f1 = HITW + 1;
  BURSTS.push({ f: HITW, at: [WALL.x + 240, GROUND - 420], seed: 13, n: 26, size: 60 });
  sfx('crunch', HITW, { who: 'pink', gain: 1.0 });
  sfx('bonk', HITW, { who: 'pink', gain: 0.8 });
  key('pink', HITW, { mouth: 'puzzlement', eyes: 'sad', head: 10, sx: 1.04, sy: 0.96 }, 1);
  const sm = shrink('pink', HITW + 4, PX, -1, { mouth: 'puzzlement', eyes: 'sad', smoke: 380 });
  const PG = [PX - 260, GROUND - 20];                              // кирка падает на траву
  PICK.push({ f0: HITW + 4, f1: HITW + 16, a: (f, S) => K.point(stateAt(HITW + 3).pink.st, 'handB'), b: PG, arc: 140, r0: 1.0, r1: 1.35 + Math.PI * 2 });
  PICK.push({ f0: HITW + 16, at: PG, rot: 1.35 });
  sfx('land', HITW + 16, { x: PG[0], gain: 0.5 });
  key('pink', sm, { lean: 0, head: 0, hip: [0, 0] }, 0);
  ev('stars', { who: 'pink', f0: sm + 4, f1: sm + 20, snd: false });
  sfx('ref:laugh', HITW + 6, { who: 'lord', gain: 0.85, pitch: 0.95 });
  chuckle('lord', HITW + 6, HITW + 28, { mouth: 'happy with theeth' });

  // ---- 15.2–16.4 с: Розовая «растёт» снова — Лорд опять влюблён
  key('pink', sm + 6, { eyes: 'angry', mouth: 'angry theeth' }, 0);
  ev('vein', { who: 'pink', f0: sm + 6, f1: sm + 16 });
  const PB2 = transform('pink', sm + 8, PX, PX, -1, { style: 'grow', love: 'lord', loveDur: 36 });
  key('pink', PB2, { ...stance('pink', PX, -1) }, 0);
  key('pink', PB2 + 6, { mouth: 'happy with theeth', eyes: 'angry' }, 0);
  key('lord', PB2 + 4, { mouth: 'happy - spittle', eyes: 'normal' }, 0);

  // ---- 16.5–20.5 с: кирка подкапывает землю под Лордом — он по шею в яме; засыпка, блок на макушку
  PICK.push({ f0: PB2, f1: PB2 + 6, a: PG, b: hb, arc: 60, r0: 1.35, r1: 1.0 });
  PICK.push({ f0: PB2 + 6, hand: 'pink', rot: 1.0 });
  ev('twinkle', { f: PB2, at: PG, n: 12, size: 34 });
  const TH2 = PB2 + 10, DIG2 = TH2 + 12;
  key('pink', TH2 - 6, { handB: hand('pink', 'B', -0.5, -0.8) }, 6);
  key('pink', TH2, { handB: hand('pink', 'B', 0.95, -0.25), lean: 12 }, 4, 'in2');
  key('pink', TH2 + 12, { ...stance('pink', PX, -1), handB: hand('pink', 'B', 0.25, 0.25), lean: 0 }, 8);
  sfx('swing', TH2 - 3, { who: 'pink', gain: 0.8 });
  PICK.push({ f0: TH2, f1: DIG2, a: hb, b: GRIP(LX + 150), arc: 220, r0: 1.0, r1: HD - Math.PI * 4 });
  PICK.push({ f0: DIG2, at: GRIP(LX + 150), rot: HD });
  sfx('whoosh', TH2, { who: 'pink', dur: 12, gain: 0.6 });
  sfx('crunch', DIG2, { x: LX, gain: 1.0 });
  sfx('ref:crack2', DIG2 + 1, { x: LX, gain: 0.9 });
  BURSTS.push({ f: DIG2, at: [LX, GROUND - 20], seed: 17, n: 18, size: 46 });
  ev('shake', { f: DIG2, amp: 12, n: 8 });
  const D2 = 420, PIT2 = { f0: DIG2, x0: LX - 190, x1: PITX + 150, d: D2 };
  PITS.push(PIT2);
  PIT1.f1 = DIG2;
  key('lord', DIG2, { mouth: 'puzzlement', eyes: 'sad', handF: hand('lord', 'F', 0.35, -0.95), handB: hand('lord', 'B', -0.25, -0.95), head: -8 }, 2);
  move('lord', DIG2, { x: LX, y: GROUND });
  move('lord', DIG2 + 8, { y: GROUND + D2 }, 'in2');
  CLIPS.push({ who: 'lord', f0: DIG2, f1: NF, pit: PIT2 });
  sfx('fallhole', DIG2 + 1, { who: 'lord', gain: 0.9 });
  sfx('scared', DIG2 + 2, { who: 'lord', gain: 0.7 });
  key('lord', DIG2 + 8, { sx: 1.04, sy: 0.96 }, 1);
  key('lord', DIG2 + 12, { sx: 1, sy: 1 }, 3);
  const BACK2 = DIG2 + 10;
  PICK.push({ f0: BACK2, f1: BACK2 + 12, a: GRIP(LX + 150), b: hb, arc: 180, r0: HD, r1: 1.0 + Math.PI * 4 });
  PICK.push({ f0: BACK2 + 12, hand: 'pink', rot: 1.0 });
  // засыпает: три блока — уровень растёт
  const FL = { pit: PIT2, level: [[0, 0]] };
  FILL.push(FL);
  for (let i = 0; i < 3; i++) {
    const t = BACK2 + 14 + i * 7, at = [LX - 60 + i * 140, GROUND - 20];
    key('pink', t - 3, { handF: hand('pink', 'F', 0.3, -0.8) }, 3);
    key('pink', t, { handF: hand('pink', 'F', 0.95, -0.35) }, 3, 'in2');
    const hf = (f, S) => K.point(S.pink.st, 'handF');
    block([{ f0: t, f1: t + 10, a: hf, b: at, arc: 150, r0: 0, r1: Math.PI * 2 }, { f0: t + 10, gone: true }]);
    FL.level.push([t + 10, (i + 1) / 3]);
    sfx('swing', t - 2, { who: 'pink', gain: 0.5 });
    sfx('slam', t + 10, { x: at[0], gain: 0.8 });
    ev('dust', { f: t + 10, x: at[0], r: 40, n: 4 });
  }
  const FULLF = BACK2 + 14 + 14 + 10;
  key('lord', FULLF - 6, { handF: hand('lord', 'F', 0.5, 0.1), handB: hand('lord', 'B', -0.3, 0.1) }, 6);
  // последний блок — на макушку
  const T4 = FULLF + 2, ON = T4 + 10, ltop = (f, S) => { const t = target('lord:hat', S); return [t[0], t[1] - B / 2 - 20]; };
  key('pink', T4 - 3, { handF: hand('pink', 'F', 0.3, -0.8) }, 3);
  key('pink', T4, { handF: hand('pink', 'F', 0.95, -0.35) }, 3, 'in2');
  key('pink', T4 + 10, { ...stance('pink', PX, -1), handB: hand('pink', 'B', 0.25, 0.25), mouth: 'happy with theeth', eyes: 'normal' }, 8);
  block([{ f0: T4, f1: ON, a: (f, S) => K.point(S.pink.st, 'handF'), b: ltop, arc: 160, r0: 0, r1: Math.PI * 2 }, { f0: ON, at: ltop, front: true }]);
  sfx('swing', T4 - 2, { who: 'pink', gain: 0.5 });
  sfx('slam', ON, { who: 'lord', gain: 0.9 });
  sfx('ref:hit-ow', ON + 2, { who: 'lord', gain: 0.9, pitch: 1.0 });
  key('lord', ON, { sx: 1.06, sy: 0.94, mouth: 'puzzlement' }, 1);
  key('lord', ON + 4, { sx: 1, sy: 1, mouth: 'sad', eyes: 'sad' }, 3);
  ev('stars', { who: 'lord', f0: ON + 2, f1: ON + 22, snd: false });
  ev('tears', { who: 'lord', f0: ON + 10, f1: NF, snd: false });
  sfx('sob', ON + 10, { who: 'lord', dur: 44, gain: 0.6 });
  sfx('ref:laugh', ON + 4, { who: 'pink', gain: 0.85, pitch: 1.35 });
  chuckle('pink', ON + 2, ON + 12, { mouth: 'happy with theeth' });
  PICK.push({ f0: ON + 10, f1: ON + 22, a: hb, b: [1700, GROUND - 20], arc: 120, r0: 1.0, r1: -1.35 - Math.PI * 2 });
  PICK.push({ f0: ON + 22, at: [1700, GROUND - 20], rot: -1.35 });
  key('pink', ON + 8, { handB: hand('pink', 'B', 0.8, -0.4) }, 3, 'in2');
  const WIN = victory('pink', ON + 14, PX, { n: 9, stride: 110 });
  window.T = { BUMP, LAND, PB, DIG, SHUT, SN, SING, WHIT, HITW, PB2, DIG2, ON, WIN };
};

// ------------------------------------------------------------------ рисование
const pitOpen = (p, f) => f >= p.f0 && (!p.f1 || f < p.f1);
ST.hooks.clip = (ctx, who, f, S) => {
  const c = CLIPS.find((k) => k.who === who && f >= k.f0 && (!k.f1 || f < k.f1));
  if (!c) return false;
  ctx.beginPath();
  ctx.rect(-500, -500, 2920, 500 + GROUND);
  ctx.rect(c.pit.x0, GROUND - 2, c.pit.x1 - c.pit.x0, c.pit.d + 2);
  return true;
};
function drawBlocks(ctx, f, S, front) {
  for (const b of BLOCKS) {
    const p = segAt(b.segs, f, S);
    if (!p) continue;
    const cur = b.segs.filter((s) => f >= s.f0).pop(), behind = !!cur.at && !cur.front;
    if (behind === front) continue;
    FX.grassBlock(ctx, p.x, p.y, b.size, p.rot, p.k ?? 1);
  }
}
ST.hooks.beforeChars.push((ctx, f, S, CAM) => {
  ctx.setTransform(...CAM);
  for (const p of PITS) if (pitOpen(p, f)) FX.pit(ctx, p.x0, p.x1, GROUND, p.d);
  drawBlocks(ctx, f, S, false);
  // стена
  if (WALL.pops.length && f >= WALL.pops[0] && f < WALL.f1) {
    const t = keyed(WALL.tilt, f), px = WALL.x + WALL.b / 2;
    ctx.save(); ctx.translate(px, GROUND); ctx.rotate(t);
    WALL.pops.forEach((g, i) => { if (f >= g) FX.grassBlock(ctx, -WALL.b / 2, -WALL.b * (i + 0.5), WALL.b, 0, Math.min(1, (f - g + 1) / 3)); });
    ctx.restore();
  }
});
ST.hooks.afterChars.push((ctx, f, S, CAM) => {
  ctx.setTransform(...CAM);
  for (const q of FILL) {
    const v = keyed(q.level, f), p = q.pit;
    if (v <= 0 || !pitOpen(p, f)) continue;
    const h = p.d * v;
    FX.grassSteps(ctx, GROUND + p.d, [[p.x0, p.x1 - p.x0, h]], 100);
  }
  drawBlocks(ctx, f, S, true);
  const pk = segAt(PICK, f, S);
  if (pk) FX.pickaxe(ctx, pk.x, pk.y, PK, pk.rot);
  for (const b of BURSTS) FX.blockBurst(ctx, b.at[0], b.at[1], (f - b.f) / 20, b.seed, DIRT, b.n, b.size, 1, GROUND);
  for (const [n0, n1] of NOTES) {
    if (f < n0 || f > n1 + 22) continue;
    const m = target('lord:lips', S);
    for (let i = 0; i < 4; i++) {
      const u = (f - n0 - i * 6) / 22;
      if (u < 0 || u > 1) continue;
      FX.note(ctx, m[0] + 40 + u * 170 + Math.sin(u * 9 + i) * 14, m[1] - 40 - u * 160, 1.3, Math.min(1, (1 - u) * 3), i % 2 === 1,
        ['#e8207a', '#7b3cff', '#ff7a00', '#1a9be6'][i]);
    }
  }
});

ST.start(BIG);
