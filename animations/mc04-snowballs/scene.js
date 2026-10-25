// Ролик 04 (серия по образцу): Снежки — Малыш против Жёлтой, 25 с, 24 кадра/с. Драка мягкая — снежки.
// Превращения «рост» под присланную музыку (1.5×, громко). Фон «майнкрафт», тема «тайга» (горы со снегом).
//
//   0–1.8 с   шарик-Малыш (слева) и шарик-Жёлтая (справа); у каждого кучка снежных блоков
//   1.8–3.3 с Малыш взлетает на пропеллере, хватает ртом снежок и роняет Жёлтой на макушку
//   3.6–4.8 с Жёлтая «растёт» под музыку — Малыш влюблён
//   5.3–7.8 с она лепит снежок и бросает — Малыш подпрыгивает, мимо; дразнится
//   7.8–10.7 с Малыш взлетает со снежком во рту и плюёт ей в лицо; она утирается
//   11–14 с   её снежок попадает в Малыша — он весь в снегу, стучит зубами, отряхивается
//   14–15.3 с Малыш «растёт» под музыку
//   15.5–18 с катает огромный снежный ком и поднимает его над собой
//   18–19.3 с её снежок попадает в ком — снег обрушивается ему на голову, он стучит зубами
//   19.4–21 с «а-а-апчхи!» — чих уносит его на пропеллере за кадр
//   21–25 с   Жёлтая в центре, руки вверх
'use strict';

const ST = Stage({
  name: 'mc04-snowballs',
  musicOnce: false,                       // музыка при каждом превращении (как было при рендере)
  cast: {
    baby: { small: ['child-verity-pink', { bodyHeight: 300, spin: { layer: 'hat', cut: 122, axis: 389 } }],
      big: ['child-verity-big', { height: 730, spin: { layer: 'hat', cut: 106, axis: 330 } }], pivot: 338, voice: 1.25,
      lie: 60, color: '#ffd9b8', moods: { angry: ' 5', grin: ' 1', big: 'theeth smile', love: ' 4' } },
    yel: { small: ['girl-verity-small', { bodyHeight: 300, recolor: 'yellow' }],
      big: ['verity-big-girl', { height: 730, splitFeet: true, recolor: 'yellow' }], pivot: 337, voice: 1.45, vAngle: 50,
      color: '#ffe23a', moods: { angry: 'angry theeth', grin: 'theeth smile', big: 'theeth smile' } },
  },
  transformMusic: 'transform-music2',     // как было при рендере (ускоренная в 1.5 раза)
  order: ['baby', 'yel'],
  background: { theme: 'taiga', seed: 41, sunX: 1520, sunY: 150 },
  clouds: [[90, 70, 2.4, 0, 14], [640, 170, 1.8, 1, 18], [1130, 50, 2.6, 2, 12], [1640, 250, 1.6, 0, 20], [400, 300, 1.4, 1, 16]],
});
const { FPS, NF, GROUND, C, key, move, ev, sfx, hop, laugh, tremble, transform, love, stance, walk, turn,
  recoil, duck, flyOff, victory, chuckle, hand, toRig, statesAt, stateAt, target } = ST;

// рот шарика-Малыша (зубы ' 2') и втулка пропеллера
const MOUTH = [315, 740];
ST.parts.mouth = (ch, st) => E.apply(ch.eyeMatrix(st, ' 2'), MOUTH);

function propeller(who, f0, f1, rps = 7, o = {}) {
  key(who, f0, { spin: 0, spinBlur: 0 }, 0);
  key(who, f0 + 8, { spinBlur: 1 }, 8);
  move(who, f1, { spin: rps * (f1 - f0) / 24 }, 'lin');
  key(who, f1, { spinBlur: 0 }, 6);
  key(who, f1 + 1, { spin: 0 }, 0);
  if (o.snd !== false) sfx('whirr', f0, { who, dur: f1 - f0, gain: o.gain ?? 0.4 });
}
function hover(who, f0, f1, y, a = 8, period = 12) {
  for (let f = f0, i = 0; f < f1; f += period / 2, i++) move(who, f + period / 2, { y: y + (i % 2 ? -a : a) }, 'io');
}

// ------------------------------------------------------------------ снег
const PILE_L = { x: 290, w: 200 }, PILE_R = { x: 1110, w: 200 }, PILE_TOP = GROUND - 3 * 40 + 8;
const R = 26;                                        // снежок
const BALLS = [];                                    // снежки: {segs}
const BURST = [];                                    // {f, at, size}
const CAPS = [];                                     // снег на макушке: {who, f0, f1, w, dy}
const SPLAT = [];                                    // снег на лице/теле: {who, part, f0, f1, s, seed}
const P = (v, f, S) => (typeof v === 'function' ? v(f, S) : typeof v === 'string' ? target(v, S) : v);
const ballAt = (B, f, S) => {
  let cur = null;
  for (const c of B.segs) if (f >= c.f0) cur = c;
  if (!cur || cur.gone) return null;
  if (cur.mouth) { const m = target(`${cur.mouth}:mouth`, S); return { x: m[0] + 6 * (S[cur.mouth].p.face || 1), y: m[1] + 8, rot: 0 }; }
  if (cur.hand) { const h = C[cur.hand].big.point(S[cur.hand].st, 'handB'); return { x: h[0], y: h[1] - R * 0.5, rot: 0, hand: cur.hand }; }
  const u = E.clamp((f - cur.f0) / (cur.f1 - cur.f0), 0, 1);
  const a = P(cur.a, cur.f0, statesAt(cur.f0)), b = P(cur.b, f, S);
  return { x: E.lerp(a[0], b[0], u), y: E.lerp(a[1], b[1], E.EASE[cur.ease || 'lin'](u)) - Math.sin(Math.PI * u) * (cur.arc || 0), rot: 6 * u };
};
function hitSnow(B, f, at, o = {}) {
  B.segs.push({ f0: f, gone: true });
  BURST.push({ f, at, size: o.size || 1 });
  sfx('snowhit', f, { at: typeof at === 'string' ? undefined : at, who: typeof at === 'string' ? at.split(':')[0] : undefined, gain: 0.9 });
}
// лепит снежок из кучи перед собой (большой): наклон, рука в кучу, выпрямился, похлопал — снежок в руке
function makeSnowball(who, f, x, face, pile) {
  const B = { segs: [] };
  BALLS.push(B);
  key(who, f - 8, { lean: 28, hip: [0, toRig(who, 130)], head: 10 }, 8);
  key(who, f, { hitB: 1, hitBto: [pile.x + face * 10, PILE_TOP + 6], hitBfix: f }, 6);
  sfx('crunch', f, { who, gain: 0.8 });
  B.segs.push({ f0: f, hand: who });
  key(who, f + 12, { ...stance(who, x, face), hitB: 0, handB: hand(who, 'B', 0.5, -0.2), handF: hand(who, 'F', 0.45, -0.25) }, 10);
  for (const k of [16, 21]) {                                     // хлопает ладонями — лепит
    key(who, f + k, { handF: hand(who, 'F', 0.5, -0.12) }, 2);
    key(who, f + k + 2, { handF: hand(who, 'F', 0.45, -0.3) }, 2);
    sfx('crunch', f + k, { who, gain: 0.5 });
  }
  return B;
}
// бросок снежка из ближней руки: замах из-за головы, полёт n кадров в цель
function toss(who, B, f, n, tgt, face, x, o = {}) {
  key(who, f - 8, { handB: hand(who, 'B', -0.55, -0.75), handF: hand(who, 'F', 0.6, -0.1), lean: -8 }, 7);
  key(who, f, { handB: hand(who, 'B', 0.9, -0.45), lean: 12, mouth: o.mouth || 'happy with theeth' }, 4, 'in2');
  key(who, f + 14, stance(who, x, face, { mouth: o.after || 'theeth smile' }), 10);
  const h = C[who].big.point(stateAt(f)[who].st, 'handB');
  B.segs.push({ f0: f, f1: f + n, a: [h[0], h[1] - R * 0.5], b: tgt, arc: o.arc ?? 90 });
  sfx('swing', f - 3, { who, gain: 0.7 });
  return f + n;
}

const BS = 560, YS = 1360;
// ================================================================== 0–1.8 с: стойка
key('baby', 0, { form: 'small', x: BS, y: GROUND, face: 1, look: 1, eyes: 'normal', mouth: ' 6', sx: 1, sy: 1, rot: 0 }, 0);
key('yel', 0, { form: 'small', x: YS, y: GROUND, face: -1, look: 1, eyes: 'normal', mouth: 'smile normal', sx: 1, sy: 1, rot: 0 }, 0);

const YX = 1300;
let YB, BB;
const BX = 470;

const BIG = () => {
  // смещение рта шарика от опоры (одинаковое, пока шарик не наклонён)
  const S0 = stateAt(1), m0 = target('baby:mouth', S0), MO = [m0[0] - BS, m0[1] - GROUND];
  const at = (mx, my) => ({ x: mx - MO[0], y: my - MO[1] });     // где опора, чтобы рот был в (mx, my)

  // ---- 1.8–3.3 с: взлёт, снежок ртом из кучи, бросок на макушку
  key('baby', 40, { eyes: 'angry', mouth: ' 1' }, 0);
  sfx('ref:grin-eee', 40, { who: 'baby', gain: 0.5, pitch: 1.3 });
  propeller('baby', 44, 104, 8);
  const pA = at(PILE_L.x + 10, PILE_TOP - 4);
  move('baby', 44, { x: BS, y: GROUND });
  move('baby', 52, { x: 470, y: GROUND - 170 }, 'out2');
  move('baby', 58, { x: pA.x, y: pA.y }, 'io');
  key('baby', 56, { mouth: ' 2' }, 0);
  key('baby', 58, { sx: 1.12, sy: 0.9 }, 2);
  key('baby', 62, { sx: 1, sy: 1 }, 3);
  sfx('chomp', 58, { who: 'baby', gain: 0.8 });
  sfx('crunch', 58, { who: 'baby', gain: 0.6 });
  const B1 = { segs: [{ f0: 58, mouth: 'baby' }] };
  BALLS.push(B1);
  const ytop = target('yel:top', stateAt(1));
  const pB = at(YS - 20, ytop[1] - 95);
  move('baby', 70, { x: pB.x, y: pB.y }, 'io');
  hover('baby', 70, 92, pB.y, 6);
  const DROP = 72, HIT1 = 78;
  key('baby', DROP, { mouth: ' 6' }, 0);
  B1.segs.push({ f0: DROP, f1: HIT1, a: (f, S) => target('baby:mouth', S), b: 'yel:top', ease: 'in2' });
  sfx('whoosh', DROP, { who: 'baby', dur: 6, gain: 0.4 });
  hitSnow(B1, HIT1, 'yel:top', { size: 0.8 });
  CAPS.push({ who: 'yel', f0: HIT1, f1: 100, w: 150, dy: 22 });
  key('yel', HIT1, { sx: 1.18, sy: 0.84, mouth: 'puzzlement', eyes: 'sad' }, 1);
  key('yel', HIT1 + 5, { sx: 1, sy: 1 }, 4);
  sfx('chatter', HIT1 + 2, { who: 'yel', dur: 10, gain: 0.7 });
  key('baby', HIT1 + 2, { mouth: ' 1', eyes: 'normal' }, 0);
  sfx('ref:laugh', HIT1 + 3, { who: 'baby', gain: 0.8, pitch: 1.5 });
  laugh('baby', HIT1 + 3, 98);
  // приземлился на место
  move('baby', 96, { x: pB.x, y: pB.y });
  move('baby', 108, { x: BS, y: GROUND }, 'in2');
  key('baby', 108, { sx: 1.2, sy: 0.82 }, 1);
  key('baby', 113, { sx: 1, sy: 1 }, 4);
  sfx('land', 108, { who: 'baby', gain: 0.5 });

  // ---- 3.6–4.8 с: Жёлтая «растёт» — Малыш влюблён
  YB = transform('yel', 86, YS, YX, -1, { style: 'grow', love: 'baby', loveDur: 62 });
  BURST.push({ f: 98, at: 'yel:top', size: 0.7 });                     // стряхнула снег
  key('yel', YB, stance('yel', YX, -1), 0);
  key('yel', YB + 6, { mouth: 'theeth smile', eyes: 'angry' }, 0);

  // ---- 5.3–7.8 с: лепит снежок, бросает — Малыш подпрыгивает
  const M1 = makeSnowball('yel', YB + 14, YX, -1, PILE_R);
  const T1 = YB + 40, L1 = T1 + 16;
  key('baby', T1 - 4, { mouth: 'puzzlement', eyes: 'sad' }, 0);
  toss('yel', M1, T1, 16, [BS + 40, GROUND - 20], -1, YX, { arc: 160 });
  hop('baby', T1 + 2, T1 + 20, BS, BS, 230);
  sfx('ref:fwip', T1 + 3, { who: 'baby', gain: 0.6 });
  hitSnow(M1, L1, [BS + 40, GROUND - 20], { size: 1 });
  key('baby', T1 + 22, { mouth: ' 1', eyes: 'normal' }, 0);
  sfx('ref:grin-eee', T1 + 22, { who: 'baby', gain: 0.5, pitch: 1.4 });
  laugh('baby', T1 + 22, T1 + 40);
  key('yel', L1 + 2, { mouth: 'puzzlement' }, 0);

  // ---- 7.8–10.7 с: со снежком во рту — плюёт ей в лицо
  const F2 = T1 + 34;
  key('baby', F2 - 4, { mouth: ' 1', eyes: 'angry' }, 0);
  propeller('baby', F2, F2 + 72, 8);
  move('baby', F2, { x: BS, y: GROUND });
  move('baby', F2 + 8, { x: 450, y: GROUND - 160 }, 'out2');
  move('baby', F2 + 14, { x: pA.x, y: pA.y }, 'io');
  key('baby', F2 + 12, { mouth: ' 2' }, 0);
  key('baby', F2 + 14, { sx: 1.12, sy: 0.9 }, 2);
  key('baby', F2 + 18, { sx: 1, sy: 1 }, 3);
  sfx('chomp', F2 + 14, { who: 'baby', gain: 0.8 });
  sfx('crunch', F2 + 14, { who: 'baby', gain: 0.6 });
  const B2 = { segs: [{ f0: F2 + 14, mouth: 'baby' }] };
  BALLS.push(B2);
  const HX = YX - 330, HY = GROUND - 400;
  move('baby', F2 + 30, { x: HX, y: HY }, 'io');
  hover('baby', F2 + 30, F2 + 50, HY, 6);
  const SPIT = F2 + 34, HIT2 = SPIT + 6;
  key('baby', SPIT - 3, { sx: 1.1, sy: 0.92 }, 2);
  key('baby', SPIT, { sx: 0.92, sy: 1.08, mouth: ' 6' }, 2);
  key('baby', SPIT + 4, { sx: 1, sy: 1 }, 3);
  sfx('spit', SPIT, { who: 'baby', gain: 0.9 });
  B2.segs.push({ f0: SPIT, f1: HIT2, a: (f, S) => target('baby:mouth', S), b: 'yel:face', arc: 20 });
  hitSnow(B2, HIT2, 'yel:face', { size: 0.9 });
  SPLAT.push({ who: 'yel', part: 'face', f0: HIT2, f1: HIT2 + 40, s: 150, seed: 4 });
  key('yel', HIT2, { lean: -14, head: -16, mouth: 'puzzlement', eyes: 'sad', hip: [toRig('yel', -10), toRig('yel', 20)] }, 2, 'out');
  key('yel', HIT2 + 10, { lean: -4, head: -4, hip: [0, 8] }, 8);
  sfx('hurt', HIT2 + 2, { who: 'yel', gain: 0.7 });
  // утирается ладонью
  const WIPE = HIT2 + 18;
  key('yel', WIPE, { hitB: 1, hitBto: 'yel:face', handF: hand('yel', 'F', 0.2, 0.5) }, 6);
  key('yel', WIPE + 6, { hitB: 0.85 }, 3);
  key('yel', WIPE + 10, { hitB: 1 }, 3);
  key('yel', WIPE + 18, { ...stance('yel', YX, -1), hitB: 0, mouth: 'angry theeth', eyes: 'angry' }, 8);
  sfx('spit', WIPE + 6, { who: 'yel', gain: 0.5 });
  ev('vein', { who: 'yel', f0: WIPE + 18, f1: WIPE + 34 });
  sfx('anger', WIPE + 18, { who: 'yel', dur: 16, gain: 0.6 });
  key('baby', HIT2 + 2, { mouth: ' 1', eyes: 'normal' }, 0);
  sfx('ref:laugh', HIT2 + 4, { who: 'baby', gain: 0.8, pitch: 1.5 });
  laugh('baby', HIT2 + 4, HIT2 + 22);
  move('baby', F2 + 58, { x: HX, y: HY });
  move('baby', F2 + 72, { x: BS, y: GROUND }, 'in2');
  key('baby', F2 + 72, { sx: 1.2, sy: 0.82 }, 1);
  key('baby', F2 + 77, { sx: 1, sy: 1 }, 4);
  sfx('land', F2 + 72, { who: 'baby', gain: 0.5 });

  // ---- 11–14 с: снежок в Малыша — весь в снегу, стучит зубами, отряхивается
  const M2 = makeSnowball('yel', WIPE + 30, YX, -1, PILE_R);
  const T2 = WIPE + 54, L2 = T2 + 14;
  key('baby', T2 - 6, { mouth: 'puzzlement', eyes: 'sad' }, 0);
  toss('yel', M2, T2, 14, 'baby:body', -1, YX, { arc: 110, mouth: 'angry theeth', after: 'happy with theeth' });
  hitSnow(M2, L2, 'baby:body', { size: 1.4 });
  CAPS.push({ who: 'baby', f0: L2, f1: L2 + 34, w: 240, dy: 64 });
  SPLAT.push({ who: 'baby', part: 'body', f0: L2, f1: L2 + 34, s: 170, seed: 9, dy: 70 });
  key('baby', L2, { sx: 1.25, sy: 0.78, eyes: 'sad', mouth: ' 2' }, 1);
  key('baby', L2 + 5, { sx: 1, sy: 1 }, 4);
  sfx('chatter', L2 + 4, { who: 'baby', dur: 22, gain: 0.8 });
  tremble('baby', L2 + 4, L2 + 26, BS, 3);
  chuckle('yel', L2 + 4, L2 + 28, { mouth: 'happy with theeth' });
  sfx('ref:laugh', L2 + 6, { who: 'yel', gain: 0.8, pitch: 1.35 });
  // отряхивается, как собачка
  const SH = L2 + 28;
  for (let i = 0; i < 6; i++) key('baby', SH + i * 2, { rot: i % 2 ? -10 : 10, pivot: 150 }, 2, 'lin');
  key('baby', SH + 12, { rot: 0 }, 2);
  BURST.push({ f: SH + 4, at: 'baby:body', size: 1.3 });
  sfx('crunch', SH + 2, { who: 'baby', gain: 0.7 });

  // ---- 14–15.3 с: Малыш «растёт»
  BB = transform('baby', SH + 12, BS, BX, 1, { style: 'grow' });
  key('baby', BB, stance('baby', BX, 1), 0);
  key('baby', BB + 6, { mouth: 'theeth smile', eyes: 'angry' }, 0);
  key('yel', BB + 2, { mouth: 'puzzlement', eyes: 'sad' }, 0);
  ev('sweat', { who: 'yel', f0: BB + 2, f1: BB + 24 });

  // ---- 15.5–18 с: катает огромный ком и поднимает
  turn('baby', BB + 8, -1, BX);
  const ROLL = BB + 20, GROWN = ROLL + 22, GR = 88;
  GIANT.f0 = ROLL;
  key('baby', ROLL - 6, { lean: 24, hip: [0, toRig('baby', 90)], head: 8, mouth: 'happy with theeth' }, 6);
  const gk = (f, cx, cy, r) => GIANT.k.push([f, cx, cy, r]);
  gk(ROLL, PILE_L.x + 40, GROUND - 40, 34);
  gk(GROWN, PILE_L.x + 50, GROUND - 95, GR);
  for (let f = ROLL; f <= GROWN; f += 7) sfx('crunch', f, { who: 'baby', gain: 0.7 });
  // дальняя рука (F, за телом) — на дальний бок кома, ближняя (B) — на ближний, снизу
  const sides = (cx, cy, r, face) => ({ F: [cx + face * r * 0.85, cy + r * 0.15], B: [cx - face * r * 0.55, cy + r * 0.35] });
  let sd = sides(PILE_L.x + 40, GROUND - 40, 34, -1);
  key('baby', ROLL, { hitF: 1, hitFto: sd.F, hitB: 1, hitBto: sd.B }, 6);
  sd = sides(PILE_L.x + 50, GROUND - 95, GR, -1);
  key('baby', GROWN, { hitFto: sd.F, hitBto: sd.B }, GROWN - ROLL, 'lin');
  // разворот с комом: ком перескакивает вперёд
  const TURN = GROWN + 4, HOLD0 = [BX + 160, GROUND - 330], HOLD1 = [BX + 172, GROUND - 545];
  turn('baby', TURN, 1, BX);
  gk(TURN, PILE_L.x + 50, GROUND - 95, GR);
  gk(TURN + 1, HOLD0[0], HOLD0[1], GR);
  sd = sides(...HOLD0, GR, 1);
  key('baby', TURN + 1, { hitFto: sd.F, hitBto: sd.B, lean: -4, hip: [0, toRig('baby', 20)], head: 0 }, 0);
  const LIFT = TURN + 14;
  gk(LIFT, HOLD1[0], HOLD1[1], GR);
  sd = sides(...HOLD1, GR, 1);
  key('baby', LIFT, { hitFto: sd.F, hitBto: sd.B, lean: -10, head: -8, mouth: 'happy with theeth' }, 10);
  sfx('ref:grunt', TURN + 4, { who: 'baby', gain: 0.8, pitch: 0.9 });
  sfx('ref:grin-eee', LIFT, { who: 'baby', gain: 0.6, pitch: 0.9 });

  // ---- 18–19.3 с: её снежок — в ком; снег обрушивается ему на голову
  const M3 = makeSnowball('yel', ROLL + 4, YX, -1, PILE_R);
  const T3 = LIFT + 6, L3 = T3 + 14;
  key('yel', T3 - 10, { mouth: 'angry theeth', eyes: 'angry' }, 0);
  toss('yel', M3, T3, 14, [HOLD1[0] + 60, HOLD1[1] + 10], -1, YX, { arc: 50, mouth: 'angry theeth', after: 'happy with theeth' });
  hitSnow(M3, L3, [HOLD1[0] + 60, HOLD1[1] + 10], { size: 0.8 });
  GIANT.f1 = L3;
  BURST.push({ f: L3, at: HOLD1, size: 2.4 }, { f: L3 + 2, at: [HOLD1[0] - 60, HOLD1[1] + 60], size: 1.8 });
  sfx('poof', L3, { who: 'baby', gain: 0.8 });
  sfx('snowhit', L3 + 2, { who: 'baby', gain: 1.0 });
  CAPS.push({ who: 'baby', f0: L3 + 2, f1: L3 + 70, w: 250, dy: 40 });
  key('baby', L3 + 1, { hitF: 0, hitB: 0, handF: hand('baby', 'F', 0.2, 0.7), handB: hand('baby', 'B', 0.1, 0.75), lean: 0, head: 0,
    mouth: 'puzzlement', eyes: 'sad', hip: [0, toRig('baby', 40)] }, 3, 'out');
  key('baby', L3 + 10, { hip: [0, 8] }, 6);
  sfx('hurt', L3 + 4, { who: 'baby', gain: 0.7 });
  sfx('chatter', L3 + 8, { who: 'baby', dur: 26, gain: 0.8 });
  tremble('baby', L3 + 8, L3 + 34, BX, 3);
  key('yel', L3 + 4, { mouth: 'happy with theeth', eyes: 'normal' }, 0);
  sfx('ref:laugh', L3 + 6, { who: 'yel', gain: 0.85, pitch: 1.35 });
  chuckle('yel', L3 + 6, L3 + 30, { mouth: 'happy with theeth' });

  // ---- 19.4–21 с: «а-а-апчхи!» — уносит на пропеллере
  const ACH = L3 + 36, CHOO = ACH + 15;
  sfx('sneeze', ACH, { who: 'baby', gain: 1.0, pitch: 0.95 });
  key('baby', ACH, { head: -14, lean: -8, mouth: 'happy open mouth', eyes: 'sad' }, 10);
  key('baby', CHOO, { head: 14, lean: 12, mouth: 'puzzlement' }, 2, 'in2');
  ev('wind', { f0: CHOO, f1: CHOO + 14, x0: BX + 120, x1: BX + 520, snd: false });
  propeller('baby', CHOO, CHOO + 30, 14, { gain: 0.6 });
  flyOff('baby', CHOO + 2, CHOO + 28, [BX, GROUND], [-420, -300], { turns: 3 });
  key('yel', CHOO + 4, { mouth: 'happy with theeth', eyes: 'normal' }, 0);
  victory('yel', CHOO + 8, YX, { n: 9, stride: 125 });
  window.T = { BB, ROLL, GROWN, TURN, LIFT, L3, CHOO };
};

// огромный ком: ключи [кадр, x, y, r]
const GIANT = { f0: 1e9, f1: 1e9, k: [] };
const giantAt = (f) => {
  if (f < GIANT.f0 || f >= GIANT.f1 || !GIANT.k.length) return null;
  const ks = GIANT.k;
  if (f <= ks[0][0]) return ks[0].slice(1);
  for (let i = 1; i < ks.length; i++) {
    if (f < ks[i][0]) {
      const u = E.EASE.io((f - ks[i - 1][0]) / (ks[i][0] - ks[i - 1][0]));
      return [1, 2, 3].map((j) => E.lerp(ks[i - 1][j], ks[i][j], u));
    }
  }
  return ks[ks.length - 1].slice(1);
};

ST.hooks.beforeChars.push((ctx, f, S, CAM) => {
  ctx.setTransform(...CAM);
  FX.snowPile(ctx, PILE_L.x, GROUND + 4, PILE_L.w, 3, 3);
  FX.snowPile(ctx, PILE_R.x, GROUND + 4, PILE_R.w, 3, 8);
});
ST.hooks.afterChars.push((ctx, f, S, CAM) => {
  ctx.setTransform(...CAM);
  for (const s of SPLAT) {
    if (f < s.f0 || f > s.f1) continue;
    const p = target(`${s.who}:${s.part}`, S), a = Math.min(1, (s.f1 - f) / 8);
    ctx.globalAlpha = Math.max(0, a);
    FX.snowSplat(ctx, p[0], p[1] - 8 + (s.dy || 0), s.s * Math.min(1, (f - s.f0 + 2) / 3), 1, s.seed);
    ctx.globalAlpha = 1;
  }
  for (const c of CAPS) {
    if (f < c.f0 || f > c.f1) continue;
    const t = target(`${c.who}:top`, S);
    FX.snowCap(ctx, t[0], t[1] + c.dy, c.w, Math.min(1, (c.f1 - f) / 6));
  }
  const g = giantAt(f);
  if (g) {
    FX.snowball(ctx, g[0], g[1], g[2], 0);
    const { ch, st, p } = S.baby;
    if (p.form === 'big') { ch.draw(ctx, { ...st, p: { ...p, only: 'B' } }, CAM); ctx.setTransform(...CAM); }
  }
  for (const B of BALLS) {
    const b = ballAt(B, f, S);
    if (!b) continue;
    ctx.setTransform(...CAM);
    FX.snowball(ctx, b.x, b.y, R, b.rot);
    if (b.hand) { const { ch, st, p } = S[b.hand]; ch.draw(ctx, { ...st, p: { ...p, only: 'B' } }, CAM); }
  }
  ctx.setTransform(...CAM);
  for (const b of BURST) {
    const u = (f - b.f) / 18;
    if (u < 0 || u > 1) continue;
    FX.snowBurst(ctx, ...P(b.at, b.f, statesAt(b.f)), u, b.size, b.f);
  }
});

ST.start(BIG);
