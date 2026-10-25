// Ролик 08 (серия по образцу): Воздушные шарики — Розовая против Малыша, 25 с, 24 кадра/с. Драка мягкая —
// воздушные шарики. Превращения «рост» под присланную музыку. Фон «майнкрафт», тема «поле цветов».
//
//   0–1.8 с   шарик-Розовая (слева, за ней связка воздушных шариков) и шарик-Малыш (справа)
//   1.8–3.4 с Малыш подлетает на пропеллере и лопает лопастями красный шарик — Розовая подпрыгивает от испуга
//   3.7–4.9 с Розовая «растёт» под музыку — Малыш влюблён
//   5.5–9 с   она дарит ему шарик — Малыш берёт нитку в зубы, и шарик поднимает его в воздух
//   9.5–11 с  она щёлкает по шарику пальцем — шарик лопается, Малыш шлёпается на траву
//   11–12.3 с Малыш «растёт» под музыку
//   12.5–17 с надувает огромный шарик и отпускает — шарик с визгом носится, Розовая приседает, шарик
//             разворачивается и шлёпает Малыша по лицу — тот падает на спину
//   17.5–21 с она привязывает к нему оставшиеся шарики — Малыша уносит в небо
//   21–25 с   Розовая в центре, руки вверх
'use strict';

const ST = Stage({
  name: 'mc08-balloons',
  musicOnce: false,                       // музыка при каждом превращении (как было при рендере)
  cast: {
    pink: { small: ['girl-verity-small', { bodyHeight: 300 }], big: ['girl-verity-big', { height: 730, splitFeet: true }],
      pivot: 337, voice: 1.35, vAngle: 50, color: '#ff4fc8', moods: { angry: 'angry theeth', grin: 'theeth smile', big: 'theeth smile' } },
    baby: { small: ['child-verity-pink', { bodyHeight: 300, spin: { layer: 'hat', cut: 122, axis: 389 } }],
      big: ['child-verity-big', { height: 730, spin: { layer: 'hat', cut: 106, axis: 330 } }], pivot: 338, voice: 1.25,
      lie: 60, color: '#ffd9b8', moods: { angry: ' 5', grin: ' 1', big: 'theeth smile', love: ' 4' } },
  },
  order: ['baby', 'pink'],
  background: { theme: 'flowerfield', seed: 81, sunX: 1500, sunY: 150 },
  clouds: [[120, 80, 2.4, 0, 14], [680, 200, 1.8, 1, 18], [1160, 60, 2.6, 2, 12], [1650, 250, 1.6, 0, 20], [420, 310, 1.4, 1, 16]],
});
const { FPS, NF, GROUND, C, key, move, ev, sfx, hop, laugh, tremble, transform, love, stance, walk, turn,
  duck, fallBack, getUp, victory, chuckle, hand, toRig, statesAt, stateAt, target } = ST;

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

// ------------------------------------------------------------------ воздушные шарики
// у каждого: цвет, длина нитки, радиус; где низ нитки: {f0, at} | {f0, hand: кто, k: 'B'} | {f0, mouth: кто};
// наклон — покачивание; лопнул — {f0, pop}
const POST = [210, GROUND - 60];                                // колышек, к которому привязана связка
const BALS = [
  { col: '#ff3b6b', len: 240, r: 58, segs: [{ f0: 0, at: POST }], sway0: 0.3 },
  { col: '#3db7ff', len: 210, r: 56, segs: [{ f0: 0, at: POST }], sway0: 0.02 },   // этот Малыш получит в подарок
  { col: '#ffd21f', len: 260, r: 58, segs: [{ f0: 0, at: POST }], sway0: -0.25 },
  { col: '#62e04a', len: 220, r: 56, segs: [{ f0: 0, at: POST }], sway0: 0.15 },
];
const POPS = [];                                                // {f, at, col}
const balAt = (B, f, S) => {
  let cur = null;
  for (const c of B.segs) if (f >= c.f0) cur = c;
  if (!cur || cur.pop) return null;
  let base;
  if (cur.at) base = cur.at;
  else if (cur.hand) base = C[cur.hand].big.point(S[cur.hand].st, 'hand' + (cur.k || 'B'));
  else if (cur.mouth) base = target(`${cur.mouth}:mouth`, S);
  const sway = (cur.sway ?? B.sway0) + Math.sin(f / FPS * 2.4 + B.len) * 0.07;
  return { x: base[0], y: base[1], sway, len: cur.len ?? B.len };
};
const topOf = (B, f) => { const b = balAt(B, f, statesAt(f)); return [b.x + Math.sin(b.sway) * b.len, b.y - Math.cos(b.sway) * b.len - B.r * 1.1]; };
function popBalloon(B, f) {
  const at = topOf(B, f);
  B.segs.push({ f0: f, pop: true });
  POPS.push({ f, at, col: B.col });
  sfx('burst', f, { at, gain: 1.0 });
  ev('shake', { f, amp: 10, n: 8 });
}
// огромный шарик Малыша: надувается у рта, потом носится сам
const GIANT = { f0: 1e9, keys: [], col: '#b46bff' };

const PS = 620, BS = 1360, PX = 600;
// ================================================================== 0–1.8 с: стойка
key('pink', 0, { form: 'small', x: PS, y: GROUND, face: 1, look: 1, eyes: 'normal', mouth: 'smile normal', sx: 1, sy: 1, rot: 0 }, 0);
key('baby', 0, { form: 'small', x: BS, y: GROUND, face: -1, look: 1, eyes: 'normal', mouth: ' 6', sx: 1, sy: 1, rot: 0, pivot: 0 }, 0);

const BIG = () => {
  // ---- 1.8–3.4 с: подлетает и лопает лопастями красный шарик
  key('baby', 40, { eyes: 'angry', mouth: ' 1' }, 0);
  sfx('ref:grin-eee', 40, { who: 'baby', gain: 0.5, pitch: 1.3 });
  propeller('baby', 44, 106, 9);
  const red = topOf(BALS[0], 60);
  const S1 = stateAt(1), hat = ST.target('baby:top', S1), dTop = hat[1] - GROUND;     // от опоры до макушки
  move('baby', 44, { x: BS, y: GROUND });
  move('baby', 56, { x: 900, y: GROUND - 300 }, 'out2');
  move('baby', 66, { x: red[0] + 10, y: red[1] - dTop + 40 }, 'io');
  const POP1 = 66;
  popBalloon(BALS[0], POP1);
  key('pink', POP1 + 1, { sx: 0.82, sy: 1.22, mouth: 'puzzlement', eyes: 'sad' }, 1);
  move('pink', POP1, { x: PS, y: GROUND });
  move('pink', POP1 + 7, { y: GROUND - 200 }, 'out2');
  move('pink', POP1 + 14, { y: GROUND }, 'in2');
  key('pink', POP1 + 14, { sx: 1.25, sy: 0.78 }, 1);
  key('pink', POP1 + 18, { sx: 1, sy: 1 }, 4);
  sfx('scared', POP1 + 2, { who: 'pink', gain: 0.9 });
  ev('sweat', { who: 'pink', f0: POP1 + 2, f1: POP1 + 24 });
  key('baby', POP1 + 2, { mouth: ' 1', eyes: 'normal' }, 0);
  sfx('ref:laugh', POP1 + 4, { who: 'baby', gain: 0.85, pitch: 1.5 });
  laugh('baby', POP1 + 4, POP1 + 22);
  move('baby', POP1 + 14, { x: 900, y: GROUND - 260 }, 'io');
  move('baby', 106, { x: 1250, y: GROUND }, 'in2');
  key('baby', 106, { sx: 1.2, sy: 0.82 }, 1);
  key('baby', 110, { sx: 1, sy: 1 }, 4);
  sfx('land', 106, { who: 'baby', gain: 0.5 });

  // ---- 3.7–4.9 с: Розовая «растёт» — Малыш влюблён
  const PB = transform('pink', 88, PS, PX, 1, { style: 'grow', love: 'baby', loveDur: 70 });
  key('pink', PB, stance('pink', PX, 1), 0);
  key('pink', PB + 6, { mouth: 'theeth smile', eyes: 'normal' }, 0);

  // ---- 5.5–9 с: дарит шарик — шарик поднимает Малыша
  const BX0 = 1250, BX1 = 1010;
  hop('baby', PB + 16, PB + 28, BX0, BX1, 50);
  turn('pink', PB + 8, -1, PX);
  const PX1 = 340, UN = PB + 30;
  walk('pink', PB + 10, PX, PX1, 1, 10, -1);
  key('pink', UN - 8, { lean: 20, hip: [0, toRig('pink', 70)], head: 6 }, 8);
  key('pink', UN, { hitB: 1, hitBto: POST, hitBfix: UN }, 6);
  BALS[1].segs.push({ f0: UN, hand: 'pink', sway: 0.5, len: 190 });
  sfx('pop', UN, { who: 'pink', gain: 0.3 });
  key('pink', UN + 12, { ...stance('pink', PX1, -1), hitB: 0, handB: hand('pink', 'B', 0.4, -0.2) }, 10);
  turn('pink', UN + 14, 1, PX1);
  const PX2 = 760;
  walk('pink', UN + 18, PX1, PX2, 3, 9, 1, false);
  key('pink', UN + 18, { handB: hand('pink', 'B', 0.4, -0.2), mouth: 'happy with theeth' }, 4);
  const GIVE = UN + 52;
  const bm = target('baby:mouth', stateAt(GIVE));
  key('pink', GIVE, { hitB: 1, hitBto: [bm[0] - 6, bm[1] + 4], hitBfix: GIVE, lean: 8 }, 8);
  key('baby', GIVE - 4, { mouth: ' 6' }, 0);
  key('baby', GIVE, { mouth: ' 2', sx: 1.06, sy: 0.95 }, 2);
  key('baby', GIVE + 4, { sx: 1, sy: 1 }, 3);
  sfx('chomp', GIVE, { who: 'baby', gain: 0.6 });
  BALS[1].segs.push({ f0: GIVE, mouth: 'baby', sway: 0.45, len: 300 });
  key('pink', GIVE + 10, { ...stance('pink', PX2, 1), hitB: 0, mouth: 'happy with theeth' }, 8);
  love('baby', GIVE + 2, GIVE + 60, { snd: false, mouth: ' 2' });
  // шарик тянет вверх
  const LIFT = GIVE + 12, HIGH = LIFT + 34;
  move('baby', LIFT, { x: BX1, y: GROUND });
  move('baby', HIGH, { x: BX1 + 50, y: GROUND - 320 }, 'io');
  hover('baby', HIGH, HIGH + 30, GROUND - 320, 10, 16);
  key('baby', LIFT, { sx: 0.95, sy: 1.06 }, 4);
  sfx('sparkle', LIFT + 4, { who: 'baby', gain: 0.6 });
  chuckle('pink', LIFT + 4, LIFT + 26, { mouth: 'happy with theeth' });

  // ---- 9.5–11 с: щелчок пальцем — шарик лопается, Малыш шлёпается
  const FL = HIGH + 14;
  const bt = topOf(BALS[1], FL);
  walk('pink', HIGH - 6, PX2, PX2 + 50, 1, 8, 1, false);
  key('pink', FL - 6, { handF: hand('pink', 'F', 0.6, -0.8), mouth: 'theeth smile', eyes: 'angry' }, 6);
  key('pink', FL, { hitF: 1, hitFto: [bt[0] - 30, bt[1] + 30], hitFfix: FL, lean: 10 }, 4, 'in2');
  key('pink', FL + 8, { ...stance('pink', PX2 + 50, 1), hitF: 0 }, 8);
  sfx('flick', FL - 1, { who: 'pink', gain: 0.9 });
  popBalloon(BALS[1], FL + 1);
  key('baby', FL + 2, { mouth: 'puzzlement' }, 0);
  const DROP = FL + 14;
  move('baby', FL + 2, { x: BX1 + 50, y: GROUND - 320 });
  move('baby', DROP, { x: BX1 + 50, y: GROUND }, 'in2');
  key('baby', DROP, { sx: 1.35, sy: 0.65, eyes: 'sad', mouth: ' 5' }, 1);
  key('baby', DROP + 6, { sx: 0.94, sy: 1.06 }, 5);
  key('baby', DROP + 10, { sx: 1, sy: 1 }, 4);
  sfx('land', DROP, { who: 'baby', gain: 0.9 });
  sfx('hurt', DROP + 2, { who: 'baby', gain: 0.8 });
  ev('stars', { who: 'baby', f0: DROP + 4, f1: DROP + 26 });
  key('pink', DROP + 2, { mouth: 'happy with theeth', eyes: 'normal' }, 0);
  sfx('ref:laugh', DROP + 4, { who: 'pink', gain: 0.85, pitch: 1.35 });

  // ---- 11–12.3 с: Малыш «растёт»
  // она отходит назад, пока он злится
  const PXB = 520;
  turn('pink', DROP + 8, -1, PX2 + 50);
  walk('pink', DROP + 10, PX2 + 50, PXB, 2, 8, -1);
  turn('pink', DROP + 30, 1, PXB);
  const BX = 1080;
  const BB = transform('baby', DROP + 6, BX1 + 40, BX, -1, { style: 'grow' });
  key('baby', BB, stance('baby', BX, -1), 0);
  key('baby', BB + 6, { mouth: 'angry theeth', eyes: 'angry' }, 0);
  key('pink', BB - 2, { mouth: 'puzzlement', eyes: 'sad' }, 0);
  ev('sweat', { who: 'pink', f0: BB, f1: BB + 22 });

  // ---- 12.5–17 с: надувает огромный шарик, отпускает — носится — по лицу ему
  const INF = BB + 10, FULL = INF + 36, LET = FULL + 6;
  key('baby', INF - 6, { handB: hand('baby', 'B', 0.55, -0.85), handF: hand('baby', 'F', 0.6, -0.8), mouth: 'theeth smile' }, 6);
  const lips = target('baby:lips', stateAt(INF));
  GIANT.f0 = INF;
  GIANT.base = [lips[0] - 14, lips[1]];
  GIANT.dir = -1;
  GIANT.r0 = 8; GIANT.r1 = 115; GIANT.full = FULL;
  for (let i = 0; i < 4; i++) {
    const f = INF + i * 9;
    key('baby', f, { mouth: 'puzzlement', mouthK: 1.4, sx: 1.04, sy: 0.98 }, 3);
    key('baby', f + 6, { mouthK: 1, sx: 1, sy: 1 }, 3);
    sfx('inflate', f, { who: 'baby', dur: 7, gain: 0.6 });
  }
  key('baby', FULL, { mouth: 'happy with theeth' }, 0);
  // отпустил — носится по кадру зигзагом
  GIANT.let = LET;
  const path = [[LET, lips[0] - 130, lips[1] - 10], [LET + 8, 880, 240], [LET + 14, 610, 250], [LET + 20, 380, 220],
    [LET + 26, 300, 150], [LET + 32, 700, 120], [LET + 38, 960, 260]];
  const DUCK = LET + 14;
  key('pink', DUCK - 8, { mouth: 'puzzlement' }, 0);
  duck('pink', DUCK - 4, DUCK + 8, PXB, 1, 240);
  const SMACK = LET + 44;
  const bface = target('baby:face', stateAt(SMACK));
  path.push([SMACK, bface[0] - 30, bface[1]]);
  GIANT.path = path; GIANT.smack = SMACK;
  key('baby', LET, { handB: hand('baby', 'B', 0.3, 0.3), handF: stance('baby', BX, -1).handF, mouth: 'happy with theeth' }, 4);
  sfx('deflate', LET, { who: 'baby', dur: SMACK - LET, gain: 0.9 });
  key('baby', SMACK - 8, { mouth: 'puzzlement', eyes: 'sad' }, 0);
  sfx('slap', SMACK, { who: 'baby', gain: 0.9 });
  sfx('ref:hit-ow', SMACK + 2, { who: 'baby', gain: 0.8, pitch: 0.85 });
  const down = fallBack('baby', SMACK + 1, BX, -1, { n: 14, stars: 50 });
  key('pink', SMACK + 4, { mouth: 'happy with theeth', eyes: 'normal' }, 0);
  sfx('ref:laugh', SMACK + 6, { who: 'pink', gain: 0.85, pitch: 1.35 });
  chuckle('pink', SMACK + 6, SMACK + 30, { mouth: 'happy with theeth' });

  // ---- 17.5–21 с: привязывает оставшиеся шарики — Малыша уносит
  turn('pink', SMACK + 8, -1, PXB);
  const PX3 = 360;
  walk('pink', SMACK + 12, PXB, PX3, 2, 8, -1);
  const UN2 = SMACK + 34;
  key('pink', UN2 - 6, { lean: 20, hip: [0, toRig('pink', 70)], head: 6 }, 6);
  key('pink', UN2, { hitB: 1, hitBto: POST, hitBfix: UN2 }, 5);
  BALS[2].segs.push({ f0: UN2, hand: 'pink', sway: -0.6, len: 180 });
  BALS[3].segs.push({ f0: UN2, hand: 'pink', sway: -0.3, len: 150 });
  sfx('pop', UN2, { who: 'pink', gain: 0.3 });
  key('pink', UN2 + 10, { ...stance('pink', PX3, -1), hitB: 0, handB: hand('pink', 'B', 0.4, -0.2) }, 8);
  turn('pink', UN2 + 12, 1, PX3);
  const PX4 = 800;
  walk('pink', UN2 + 15, PX3, PX4, 4, 6, 1, false);
  key('pink', UN2 + 15, { handB: hand('pink', 'B', 0.4, -0.2), mouth: 'happy with theeth' }, 4);
  // Малыш садится, оглушённый; она привязывает шарики к его руке
  const SIT = UN2 + 20;
  getUp('baby', SIT, BX, -1, { mouth: 'puzzlement' });
  key('baby', SIT + 14, { eyes: 'sad', head: -8 }, 4);
  const TIE = UN2 + 40;
  const bh = C.baby.big.point(stateAt(TIE).baby.st, 'handF');
  key('pink', TIE, { hitB: 1, hitBto: bh, hitBfix: TIE, lean: 6 }, 6);
  BALS[2].segs.push({ f0: TIE, hand: 'baby', k: 'F', sway: -0.35, len: 170 });
  BALS[3].segs.push({ f0: TIE, hand: 'baby', k: 'F', sway: 0.25, len: 150 });
  sfx('pop', TIE, { who: 'baby', gain: 0.4 });
  key('pink', TIE + 10, { ...stance('pink', PX4, 1), hitB: 0, mouth: 'theeth smile' }, 8);
  key('baby', TIE + 4, { handF: hand('baby', 'F', 0.55, -0.35), mouth: 'puzzlement' }, 8);
  const UP = TIE + 10, GONE = UP + 44;
  move('baby', UP, { x: BX, y: GROUND });
  move('baby', GONE, { x: BX + 120, y: -900 }, 'in');
  key('baby', UP + 4, { legFfk: 1, legBfk: 1, legF: [-20, 30], legB: [15, 25], handB: hand('baby', 'B', 0.3, 0.4) }, 6);
  for (let f = UP + 10; f < GONE; f += 8) key('baby', f, { legF: (f / 8) % 2 ? [-40, 60] : [0, 10], legB: (f / 8) % 2 ? [10, 10] : [-35, 55] }, 4);
  sfx('scared', UP + 4, { who: 'baby', gain: 0.9 });
  sfx('whoosh', UP + 10, { who: 'baby', dur: 30, gain: 0.4 });
  ev('twinkle', { f: GONE - 6, at: [BX + 100, 90], n: 22, size: 56 });
  // машет вслед и — победа
  key('pink', UP + 14, { handF: hand('pink', 'F', 0.5, -0.95), mouth: 'happy with theeth' }, 5);
  for (let f = UP + 19; f < UP + 40; f += 6) key('pink', f, { handF: hand('pink', 'F', (f / 6) % 2 ? 0.75 : 0.35, -0.9) }, 3);
  victory('pink', UP + 34, PX4, { n: 9, stride: 120 });
  window.T = { PB, GIVE, FL, BB, LET, SMACK, TIE, GONE };
};

ST.hooks.afterChars.push((ctx, f, S, CAM) => {
  ctx.setTransform(...CAM);
  // огромный шарик: надувается у рта (узелком к губам), потом носится
  if (f >= GIANT.f0 && f < (GIANT.smack ?? 1e9) + 4) {
    let x, y, r, rot = 0, sq = 1;
    if (f < GIANT.let) {
      const u = E.clamp((f - GIANT.f0) / (GIANT.full - GIANT.f0), 0, 1);
      r = E.lerp(GIANT.r0, GIANT.r1, E.EASE.out(u)) * (1 + 0.04 * Math.sin(f * 1.3));
      x = GIANT.base[0] - r * 1.1; y = GIANT.base[1]; rot = Math.PI / 2;            // лежит на боку, узелок у рта
    } else {
      const ks = GIANT.path;
      let i = 1;
      while (i < ks.length - 1 && f >= ks[i][0]) i++;
      const a = ks[i - 1], b = ks[i], u = E.clamp((f - a[0]) / (b[0] - a[0]), 0, 1);
      x = E.lerp(a[1], b[1], u); y = E.lerp(a[2], b[2], u);
      const t = E.clamp((f - GIANT.let) / (GIANT.smack - GIANT.let), 0, 1);
      r = E.lerp(GIANT.r1, 46, t);
      rot = Math.atan2(b[2] - a[2], b[1] - a[1]) + Math.PI / 2 + Math.sin(f * 0.9) * 0.4;
      sq = 1 + 0.12 * Math.sin(f * 1.7);
    }
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
    FX.balloon(ctx, 0, r * 1.15, 0, r, GIANT.col, 0, sq);
    ctx.restore();
  }
  for (const B of BALS) {
    const b = balAt(B, f, S);
    if (!b) continue;
    ctx.setTransform(...CAM);
    FX.balloon(ctx, b.x, b.y, b.len, B.r, B.col, b.sway);
  }
  for (const p of POPS) FX.balloonPop(ctx, p.at[0], p.at[1], (f - p.f) / 16, p.col, 1.2, p.f);
});
ST.hooks.beforeChars.push((ctx, f, S, CAM) => {
  ctx.setTransform(...CAM);
  ctx.beginPath(); ctx.moveTo(POST[0], GROUND + 4); ctx.lineTo(POST[0], POST[1]);
  ctx.lineWidth = 14; ctx.strokeStyle = '#2a170a'; ctx.stroke(); ctx.lineWidth = 9; ctx.strokeStyle = '#b58146'; ctx.stroke();   // колышек
});

ST.start(BIG);
