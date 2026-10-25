// Ролик 29 (серия по образцу): Вентилятор — Розовая, Лорд и Радужный, 25 с, 24 кадра/с. Плотно, как у HugyTi:
// напольный вентилятор — сдувает шляпу, катит шарики, надувает шарик как воздушный, поднимает большого в небо.
// Музыка превращения — присланная, ~4 с с затиханием, только при первом превращении. Фон — джунгли.
//
//   0–1.6 с   шарик-Розовая у вентилятора, шарик-Лорд, радужный шарик
//   1.6–3.9 с Розовая прыгает на кнопку — ветер: шляпа Лорда улетает Радужному на голову, Лорда катит
//             в Радужного, оба кувырком
//   3.9–5.1 с Лорд «растёт» под музыку (без шляпы)
//   5.2–7.5 с идёт против ветра, разворачивает вентилятор на Розовую
//   7.3–9.6 с Розовую надувает как воздушный шарик — улетает, сдувается зигзагом, стукает Лорда по голове
//             и падает на кнопку — вентилятор выключен
//   9.7–10.9 с Розовая «растёт» — Лорд и Радужный влюблены
//   11–13.5 с поднимает вентилятор, включает — Лорда уносит назад, он падает на Радужного — «пуф», шарик
//   13.6–15.6 с Радужный «растёт» — шляпа слетает и возвращается Лорду
//   15.8–17.8 с вентилятор на полную вверх — Лорда катит в Радужного, обоих поднимает и уносит за кадр
//   18–25 с   Розовая в центре, руки вверх
'use strict';

const ST = Stage({
  name: 'mc29-fan',
  cast: {
    pink: { small: ['girl-verity-small', { bodyHeight: 300 }], big: ['girl-verity-big', { height: 730, splitFeet: true }],
      pivot: 337, voice: 1.35, vAngle: 50, lie: 55, color: '#ff4fc8', moods: { angry: 'angry theeth', grin: 'theeth smile', big: 'theeth smile' } },
    lord: { small: ['lord-verity-small', { bodyHeight: 300 }], big: ['lord-verity-big', { height: 730 }], pivot: 337,
      voice: 1.0, lie: 55, color: '#ffe23a', ouch: ['ref:hit-ow', 1.0, 0.9] },
    rb: { small: ['skeleton-verity-small', { scale: 0.455, recolor: 'rainbow' }], big: ['all-verity-color', { height: 730 }],
      pivot: 325, voice: 0.85, lie: 55, color: '#ff7a3a', moods: { angry: 'angry theeth', grin: 'happy with theeth', big: 'theeth smile', love: 'happy - spittle' } },
  },
  order: ['rb', 'lord', 'pink'],
  background: { theme: 'jungle', seed: 291, sunX: 1500, sunY: 130 },
  clouds: [[160, 80, 2.4, 0, 12], [700, 220, 1.8, 1, 16], [1150, 70, 2.6, 2, 10], [1750, 260, 1.5, 0, 18]],
});
const { FPS, NF, GROUND, C, key, move, ev, sfx, tumble, laugh, tremble, transform, shrink, stance, walk, turn,
  flyOff, victory, chuckle, hand, toRig, statesAt, stateAt, target } = ST;

// ------------------------------------------------------------------ вентилятор
const FS = 400, FANX = 620, HEADY = FS * 0.72;      // высота; голова над низом подставки
const FK = [{ f: 0, x: FANX, y: GROUND, face: 1, tilt: 0 }];   // ключи: {f, x, y | hold, face, tilt, ease}
const SPD = [[0, 0]];                               // скорость лопастей 0..1 (линейно между ключами)
const BTN = [];                                     // кадры нажатия кнопки
function fanKey(f, o, ease = 'io') { FK.push({ f, ...o, ease }); FK.sort((a, b) => a.f - b.f); }
function speed(f0, f1, v) { SPD.push([f0, SPD.filter((s) => s[0] <= f0).pop()[1]], [f1, v]); SPD.sort((a, b) => a[0] - b[0]); }
const spAt = (f) => {
  let a = SPD[0], b = null;
  for (const s of SPD) { if (s[0] <= f) a = s; else { b = s; break; } }
  return b ? E.lerp(a[1], b[1], (f - a[0]) / (b[0] - a[0])) : a[1];
};
const holdPos = (who, S) => { const h = C[who].big.point(S[who].st, 'handF'); return [h[0], h[1] + FS * 0.45]; };
function fanAt(f, S) {
  let i = 0;
  while (i + 1 < FK.length && FK[i + 1].f <= f) i++;
  const k0 = FK[i], k1 = FK[i + 1];
  const pos = (k) => (k.hold ? (S[k.hold].p.form === 'big' ? holdPos(k.hold, S) : [FANX, GROUND]) : [k.x, k.y]);
  const p0 = pos(k0);
  if (!k1) return { x: p0[0], y: p0[1], face: k0.face, tilt: k0.tilt };
  const u = E.EASE[k1.ease || 'io'](E.clamp((f - k0.f) / (k1.f - k0.f), 0, 1)), p1 = pos(k1);
  return { x: E.lerp(p0[0], p1[0], u), y: E.lerp(p0[1], p1[1], u), face: E.lerp(k0.face, k1.face, u), tilt: E.lerp(k0.tilt, k1.tilt, u) };
}
// кнопка: вентилятор включают и выключают нажатием, кнопка нажата, пока он работает
function fanOn(f, v = 1, n = 10) { BTN.push(f); speed(f, f + n, v); sfx('flick', f, { x: FANX, gain: 0.9 }); sfx('whirr', f, { x: FANX, dur: 40, gain: 0.35 }); }
function fanOff(f, n = 16) { BTN.push(f); speed(f, f + n, 0); sfx('flick', f, { x: FANX, gain: 0.9 }); }
function gusts(f0, f1, x, gain = 0.45) {               // гул мотора и порывы ветра на время работы
  for (let f = f0; f < f1; f += 40) { sfx('gust', f, { x, dur: Math.min(44, f1 - f), gain }); if (f > f0) sfx('whirr', f, { x: FANX, dur: Math.min(44, f1 - f), gain: 0.3 }); }
}

// ------------------------------------------------------------------ шляпа Лорда
const HAT = [{ f0: 0, on: 'lord' }];                // {f0, on} | {f0, f1, from, to, arc, spin}
const hatSeg = (f) => HAT.filter((h) => f >= h.f0).pop();
const hatOnLord = (f) => hatSeg(f).on === 'lord';

const PS = 330, LS = 1020, RS = 1540;
// ================================================================== 0–1.6 с: стойка
key('pink', 0, { form: 'small', x: PS, y: GROUND, face: 1, look: 1, eyes: 'normal', mouth: 'smile normal', sx: 1, sy: 1, rot: 0, pivot: 0, alpha: 1 }, 0);
key('lord', 0, { form: 'small', x: LS, y: GROUND, face: -1, look: 1, eyes: 'normal', mouth: 'smile normal', sx: 1, sy: 1, rot: 0, pivot: 0, alpha: 1 }, 0);
key('rb', 0, { form: 'small', x: RS, y: GROUND, face: -1, look: 1, eyes: 'normal', mouth: 'smile normal', sx: 1, sy: 1, rot: 0, pivot: 0, alpha: 1 }, 0);

// прыжок шарика из точки в точку (с подставки и на подставку)
function hopTo(who, f0, f1, x0, y0, x1, y1, h) {
  const mid = Math.round((f0 + f1) / 2);
  key(who, f0, { sx: 1.2, sy: 0.82 }, 4);
  move(who, f0, { x: x0, y: y0 });
  key(who, f0 + 2, { sx: 0.86, sy: 1.16 }, 2);
  move(who, mid, { y: Math.min(y0, y1) - h }, 'out2');
  key(who, mid, { sx: 1, sy: 1 }, 3);
  move(who, f1, { y: y1 }, 'in2');
  move(who, f1, { x: x1 }, 'lin');
  key(who, f1, { sx: 1.22, sy: 0.8 }, 1);
  key(who, f1 + 3, { sx: 0.95, sy: 1.06 }, 3);
  key(who, f1 + 7, { sx: 1, sy: 1 }, 4);
  sfx('jump', f0 + 2, { who, gain: 0.55 });
  sfx('land', f1, { who, gain: 0.5 });
}

const BIG = () => {
  // хитрая ухмылка
  key('pink', 22, { mouth: 'theeth smile', eyes: 'angry' }, 0);
  sfx('ref:grin-eee', 22, { who: 'pink', gain: 0.4, pitch: 1.35 });
  key('lord', 14, { mouth: 'happy with theeth' }, 0); key('rb', 20, { mouth: 'happy with theeth' }, 0);
  chuckle('lord', 14, 36); chuckle('rb', 20, 38);

  // ---- 1.6–3.9 с: кнопка — ветер — шляпа на Радужного — Лорда катит в Радужного
  const BX = FANX - FS * 0.17, BY = GROUND - FS * 0.085;
  hopTo('pink', 38, 48, PS, GROUND, BX, BY, 130);
  const ON = 48;
  fanOn(ON);
  hopTo('pink', 52, 62, BX, BY, 300, GROUND, 110);
  key('pink', 62, { mouth: 'happy with theeth', eyes: 'normal' }, 0);
  sfx('ref:laugh', 64, { who: 'pink', gain: 0.85, pitch: 1.35 });
  laugh('pink', 66, 92);
  // шляпа слетает и садится Радужному на голову
  const H0 = 54, H1 = 70;
  HAT.push({ f0: H0, f1: H1, from: 'lord', to: 'rb', arc: 200, spin: 2 });
  HAT.push({ f0: H1, on: 'rb' });
  sfx('pop', H0, { who: 'lord', gain: 0.6 });
  sfx('whoosh', H0 + 1, { who: 'lord', dur: 14, gain: 0.5 });
  sfx('pop', H1, { who: 'rb', gain: 0.7 });
  key('rb', H1, { mouth: 'puzzlement', eyes: 'sad', sx: 1.1, sy: 0.9 }, 1); key('rb', H1 + 4, { sx: 1, sy: 1 }, 3);
  key('lord', H0, { mouth: 'puzzlement', eyes: 'sad', pivot: ST.CAST.lord.pivot }, 0);
  // Лорда прижимает ветром — и катит
  key('lord', H0 + 2, { sx: 0.88, sy: 1.12, rot: 10 }, 4);
  tremble('lord', H0 + 4, 66, LS, 5);
  sfx('scared', 60, { who: 'lord', gain: 0.8 });
  const BUMP = 78;
  key('lord', 66, { sx: 1, sy: 1 }, 3);
  move('lord', 66, { x: LS, y: GROUND, rot: 10 });
  move('lord', BUMP, { x: 1290, rot: 380 }, 'in');
  sfx('whirr', 66, { who: 'lord', dur: 12, gain: 0.4 });
  sfx('bonk', BUMP, { who: 'rb', gain: 0.9 });
  ev('shake', { f: BUMP, amp: 10, n: 8 });
  key('lord', BUMP + 1, { rot: 20 }, 0);
  tumble('lord', BUMP, BUMP + 14, 1290, 1340, 120, 1, { stars: 14 });
  tumble('rb', BUMP + 1, BUMP + 17, RS, 1780, 170, 1.5, { stars: 18 });
  key('rb', BUMP + 1, { mouth: 'puzzlement', eyes: 'sad' }, 0);

  // ---- 3.9–5.1 с: Лорд «растёт» (без шляпы)
  const LX = 1340;
  key('lord', BUMP + 14, { eyes: 'angry', mouth: 'angry theeth' }, 0);
  const LB = transform('lord', BUMP + 16, LX, LX, -1, { style: 'grow' });
  key('lord', LB, stance('lord', LX, -1), 0);
  key('lord', LB + 6, { mouth: 'angry theeth', eyes: 'angry' }, 0);
  key('pink', LB - 2, { mouth: 'puzzlement', eyes: 'sad' }, 0);

  // ---- 5.2–7.5 с: против ветра к вентилятору — разворачивает его на Розовую
  const W0 = LB + 4, LX2 = 940, NS = 4, NW = 7, W1 = W0 + NS * NW;
  key('lord', W0, { lean: 16, head: 4, handF: hand('lord', 'F', 0.9, 0.15), handB: hand('lord', 'B', 0.7, 0.3), mouth: 'angry theeth', eyes: 'angry' }, 5);
  walk('lord', W0, LX, LX2, NS, NW, -1, false);
  ev('sweat', { who: 'lord', f0: W0 + 6, f1: W1 });
  key('pink', W0 + 6, { mouth: 'happy with theeth', eyes: 'normal' }, 0);
  const GR = W1 + 2, T0 = GR + 2, T1 = T0 + 12;
  const headPt = [FANX + 40, GROUND - HEADY];
  key('lord', GR, { lean: 8, head: 0, hitF: 1, hitFto: headPt, hitFfix: GR, handB: hand('lord', 'B', -0.45, 0.5) }, 4);
  fanKey(T0, { x: FANX, y: GROUND, face: 1, tilt: 0 });
  fanKey(T1, { x: FANX, y: GROUND, face: -1, tilt: 0 });
  sfx('creak', T0, { x: FANX, dur: 12, gain: 0.6 });
  key('lord', T1 + 2, { ...stance('lord', LX2, -1), hitF: 0, mouth: 'happy with theeth', eyes: 'angry' }, 6);
  sfx('ref:laugh', T1 + 4, { who: 'lord', gain: 0.85, pitch: 0.95 });
  chuckle('lord', T1 + 4, T1 + 22, { mouth: 'happy with theeth' });

  // ---- 7.3–9.6 с: Розовую надувает — улетает — сдувается зигзагом — по голове Лорду — на кнопку
  const IN0 = T0 + 8, IN1 = IN0 + 12, FL = IN1 + 8;
  key('pink', IN0 - 2, { mouth: 'puzzlement', eyes: 'sad', pivot: ST.CAST.pink.pivot }, 0);
  key('pink', IN1, { sx: 1.55, sy: 1.55 }, IN1 - IN0, 'out');
  sfx('inflate', IN0, { who: 'pink', dur: IN1 - IN0 + 4, gain: 0.9 });
  move('pink', IN0, { x: 300, y: GROUND, rot: 0 });
  move('pink', IN1, { x: 270, y: GROUND - 60, rot: -10 }, 'in');
  move('pink', FL, { x: 240, y: 600, rot: 8 }, 'io');
  sfx('scared', IN1 - 2, { who: 'pink', gain: 0.7 });
  // сдувается: «пффф» — зигзаг по небу, всё меньше
  const Z = [[FL, 240, 600], [FL + 5, 600, 480], [FL + 10, 260, 570], [FL + 15, 560, 450]];
  for (let i = 1; i < Z.length; i++) move('pink', Z[i][0], { x: Z[i][1], y: Z[i][2] }, 'io');
  move('pink', FL, { rot: 8 });
  const BONK = FL + 20;
  move('pink', BONK - 1, { rot: 8 + 360 * 3 }, 'lin');
  key('pink', BONK - 1, { sx: 1, sy: 1 }, BONK - 1 - FL, 'in');
  sfx('deflate', FL, { who: 'pink', dur: BONK - FL, gain: 1.0 });
  const lf = target('lord:face', stateAt(BONK)), lt = [lf[0] - 125, lf[1] + 150];   // в лицо сбоку
  move('pink', BONK, { x: lt[0], y: lt[1] }, 'in');
  key('pink', BONK, { rot: 0 }, 0);
  key('pink', BONK, { sx: 1.25, sy: 0.78 }, 1);
  sfx('bonk', BONK, { who: 'lord', gain: 1.0 });
  sfx('ref:hit-ow', BONK + 2, { who: 'lord', gain: 0.8 });
  ev('shake', { f: BONK, amp: 12, n: 8 });
  key('lord', BONK, { lean: -14, head: -14, hip: [0, toRig('lord', 30)], mouth: 'puzzlement', eyes: 'sad', handF: hand('lord', 'F', 0.45, -0.6), handB: hand('lord', 'B', -0.3, 0.35) }, 2);
  ev('stars', { who: 'lord', f0: BONK + 4, f1: BONK + 40 });
  for (let k = BONK + 6; k < BONK + 36; k += 8) key('lord', k, { head: ((k - BONK) / 8) % 2 < 1 ? -10 : 4 }, 4);
  key('lord', BONK + 14, { ...stance('lord', LX2, -1), mouth: 'puzzlement', eyes: 'sad' }, 8);
  // падает с головы Лорда на кнопку — вентилятор выключается — отскакивает
  const KN = BONK + 10;
  key('pink', BONK + 3, { sx: 0.9, sy: 1.1 }, 2);
  move('pink', BONK + 1, { x: lt[0], y: lt[1] });
  move('pink', BONK + 4, { y: lt[1] - 50 }, 'out2');
  move('pink', KN, { y: BY }, 'in2');
  move('pink', KN, { x: BX }, 'lin');
  key('pink', KN, { sx: 1.25, sy: 0.78 }, 1);
  fanOff(KN);
  gusts(ON, KN + 8, 1100);
  const LAND = KN + 12;
  hopTo('pink', KN + 2, LAND, BX, BY, 420, GROUND, 100);
  move('pink', KN + 2, { rot: 0 });
  move('pink', LAND, { rot: -360 }, 'lin');
  key('pink', LAND + 1, { rot: 0 }, 0);
  ev('stars', { who: 'pink', f0: LAND + 2, f1: LAND + 20 });
  key('pink', KN, { mouth: 'puzzlement', eyes: 'sad' }, 0);

  // ---- 9.7–10.9 с: Розовая «растёт» — оба влюблены
  const PX = 440;
  key('pink', LAND + 2, { eyes: 'angry', mouth: 'angry theeth' }, 0);
  ev('vein', { who: 'pink', f0: LAND + 2, f1: LAND + 12 });
  const PB = transform('pink', LAND + 4, 420, PX, 1, { style: 'grow', love: ['lord', 'rb'], loveDur: 40 });
  key('pink', PB, stance('pink', PX, 1), 0);
  key('pink', PB + 6, { mouth: 'theeth smile', eyes: 'angry' }, 0);

  // ---- 11–13.5 с: поднимает вентилятор, включает — Лорда уносит назад на Радужного — «пуф»
  const PK = PB + 4, pole = [FANX, GROUND - FS * 0.42];
  key('pink', PK - 6, { lean: 22, hip: [0, toRig('pink', 110)], head: 6 }, 6);
  key('pink', PK, { hitF: 1, hitFto: pole, hitFfix: PK }, 6);
  sfx('pop', PK, { who: 'pink', gain: 0.5 });
  const UP = PK + 10;
  key('pink', UP, { ...stance('pink', PX, 1), hitF: 0, handF: hand('pink', 'F', 0.75, 0.45), mouth: 'happy with theeth', eyes: 'angry' }, 10);
  fanKey(PK, { x: FANX, y: GROUND, face: -1, tilt: 0 });
  fanKey(UP, { hold: 'pink', face: 1, tilt: 0 });
  sfx('whoosh', PK + 2, { who: 'pink', dur: 8, gain: 0.5 });
  const ON2 = UP + 6;
  fanOn(ON2, 1, 8);
  sfx('flick', ON2, { who: 'pink', gain: 0.8 });
  // Лорд влюблён — его сдувает: держится, отклоняется — и улетает назад
  const BL = ON2 + 8, FLY = BL + 8, CR = FLY + 16;
  key('lord', BL, { lean: -18, head: -10, hip: [0, toRig('lord', 20)], handF: hand('lord', 'F', 0.6, -0.7), handB: hand('lord', 'B', -0.6, -0.7), mouth: 'puzzlement', eyes: 'sad' }, 4);
  tremble('lord', BL + 2, FLY, LX2, 5);
  sfx('scared', BL + 2, { who: 'lord', gain: 0.8 });
  const KL = C.lord.big;
  key('lord', FLY, { pivot: (KL.anchor[1] - KL.top) / 2, legFfk: 1, legBfk: 1, legF: [-30, 50], legB: [25, -40], handF: hand('lord', 'F', -0.3, -0.8), handB: hand('lord', 'B', -0.7, -0.5) }, 2);
  move('lord', FLY, { x: LX2, y: GROUND, rot: 0 });
  move('lord', FLY + 8, { y: GROUND - 260 }, 'out2');
  move('lord', CR, { y: GROUND }, 'in2');
  move('lord', CR, { x: 1700, rot: 360 }, 'lin');
  sfx('whoosh', FLY, { who: 'lord', dur: CR - FLY, gain: 0.7 });
  key('rb', CR - 6, { mouth: 'puzzlement', eyes: 'sad' }, 0);
  sfx('slam', CR, { who: 'rb', gain: 0.9 });
  ev('shake', { f: CR, amp: 18, n: 12 });
  key('rb', CR, { sx: 1.7, sy: 0.45 }, 1);
  key('lord', CR + 1, { rot: 0 }, 0);
  const lsm = shrink('lord', CR, 1600, -1, { mouth: 'puzzlement', eyes: 'sad', smoke: 360 });
  move('lord', lsm, { x: 1600, y: GROUND, rot: 0 });
  key('lord', lsm, { pivot: 0 }, 0);
  ST.hop('lord', lsm + 8, lsm + 20, 1600, 1260, 160);
  key('lord', lsm + 20, { mouth: 'puzzlement', eyes: 'sad' }, 0);
  ev('stars', { who: 'lord', f0: lsm + 22, f1: lsm + 44, snd: false });
  key('rb', CR + 8, { sx: 1.7, sy: 0.45 }, 0);
  key('rb', CR + 14, { sx: 1, sy: 1 }, 6, 'out');
  sfx('boing', CR + 10, { who: 'rb', gain: 0.6 });
  const OFF2 = CR + 4;
  fanOff(OFF2);
  gusts(ON2, OFF2 + 6, 1300);
  key('pink', CR + 4, { mouth: 'happy with theeth', eyes: 'normal' }, 0);
  sfx('ref:laugh', CR + 6, { who: 'pink', gain: 0.85, pitch: 1.35 });
  chuckle('pink', CR + 6, CR + 26, { mouth: 'happy with theeth' });

  // ---- 13.6–15.6 с: Радужный «растёт» — шляпа слетает и возвращается Лорду
  const RX = 1660;
  key('rb', CR + 14, { eyes: 'angry', mouth: 'angry theeth' }, 0);
  ev('vein', { who: 'rb', f0: CR + 14, f1: CR + 24 });
  const RB = transform('rb', CR + 16, 1780, RX, -1, { style: 'grow' });
  key('rb', RB, stance('rb', RX, -1), 0);
  key('rb', RB + 6, { mouth: 'happy with theeth', eyes: 'angry' }, 0);
  HAT.push({ f0: RB, f1: RB + 16, from: 'rb', to: 'lord', arc: 260, spin: -2 });
  HAT.push({ f0: RB + 16, on: 'lord' });
  sfx('pop', RB, { who: 'rb', gain: 0.6 });
  sfx('pop', RB + 16, { who: 'lord', gain: 0.7 });
  key('lord', RB + 16, { mouth: 'happy with theeth', eyes: 'normal', sx: 1.1, sy: 0.9 }, 1); key('lord', RB + 20, { sx: 1, sy: 1 }, 3);
  key('pink', RB - 2, { mouth: 'puzzlement', eyes: 'sad' }, 0);

  // ---- 15.8–17.8 с: на полную, вверх — Лорда катит в Радужного — обоих уносит за кадр
  const MX = RB + 12;
  key('pink', MX, { mouth: 'theeth smile', eyes: 'angry', handF: hand('pink', 'F', 0.85, 0.2), lean: -4 }, 6);
  fanKey(MX, { hold: 'pink', face: 1, tilt: 0 });
  fanKey(MX + 6, { hold: 'pink', face: 1, tilt: -0.35 });
  fanOn(MX, 1, 6);
  key('rb', MX + 2, { lean: 10, mouth: 'angry theeth', eyes: 'angry' }, 4);
  const ROLL = MX + 6, HITR = ROLL + 12;
  key('lord', ROLL - 2, { mouth: 'puzzlement', eyes: 'sad', pivot: ST.CAST.lord.pivot }, 0);
  move('lord', ROLL, { x: 1260, y: GROUND, rot: 0 });
  move('lord', HITR, { x: RX - 150, rot: 400 }, 'in');
  sfx('scared', ROLL, { who: 'lord', gain: 0.8 });
  sfx('bonk', HITR, { who: 'rb', gain: 0.9 });
  key('rb', HITR, { lean: -16, head: -8, mouth: 'puzzlement', eyes: 'sad' }, 2);
  const UPR = HITR + 2;
  flyOff('rb', UPR, UPR + 28, [RX, GROUND], [2350, -300], { turns: 2 });
  move('lord', HITR + 1, { x: RX - 150, y: GROUND, rot: 400 });
  move('lord', UPR + 26, { x: 2300, y: -150, rot: 1300 }, 'in');
  ev('twinkle', { f: UPR + 24, at: [1810, 140], n: 22, size: 60 });
  gusts(MX, UPR + 24, 1400, 0.6);
  const OFF3 = UPR + 24;
  fanOff(OFF3);
  sfx('ref:laugh', UPR + 6, { who: 'pink', gain: 0.85, pitch: 1.35 });
  chuckle('pink', UPR + 6, UPR + 24, { mouth: 'happy with theeth' });

  // ---- 18–25 с: ставит вентилятор — в центр, руки вверх
  const DN = OFF3;
  key('pink', DN, { lean: 16, hip: [0, toRig('pink', 80)], handF: hand('pink', 'F', 0.6, 0.7) }, 8);
  fanKey(DN, { hold: 'pink', face: 1, tilt: -0.35 });
  fanKey(DN + 8, { x: FANX + 40, y: GROUND, face: 1, tilt: 0 });
  sfx('land', DN + 8, { x: FANX, gain: 0.6 });
  key('pink', DN + 10, { ...stance('pink', PX, 1), mouth: 'happy with theeth', eyes: 'normal' }, 6);
  const WIN = victory('pink', DN + 12, PX, { n: 9, stride: 110 });
  window.T = { ON, BUMP, LB, W1, T1, FL, BONK, KN, PB, ON2, CR, RB, MX, UPR, WIN };
};

// шляпу Лорда рисуем сами, пока она не на нём
ST.hooks.drawPose = (who, p, f) => (who === 'lord' && !hatOnLord(f) ? { ...p, hide: [...(p.hide || []), 'hat'] } : p);
const hatImg = () => { const L = C.lord.small, l = L.layers.find((x) => x.name === 'hat'); return { l, s: L.scale, w: (l.bbox[2] - l.bbox[0]) * L.scale, h: (l.bbox[3] - l.bbox[1]) * L.scale }; };
const hatOn = (who, S) => {                          // центр шляпы на голове
  if (who === 'lord') { const p = target('lord:hat', S); return p; }
  const t = target(`${who}:top`, S), H = hatImg();
  return [t[0], t[1] - H.h / 2 + 30];
};
function drawHat(ctx, x, y, rot) {
  const H = hatImg();
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  ctx.drawImage(H.l.img.canvas, -H.w / 2, -H.h / 2, H.w, H.h);
  ctx.restore();
}

let ANG = null;
ST.hooks.beforeChars.push((ctx, f, S, CAM) => {
  if (!ANG) { ANG = [0]; for (let i = 1; i <= NF; i++) ANG[i] = ANG[i - 1] + spAt(i) * 0.8; }
  ctx.setTransform(...CAM);
  const F = fanAt(f, S), sp = spAt(f), on = BTN.filter((b) => b <= f).length % 2 === 1;
  FX.deskFan(ctx, F.x, F.y, FS, F.face, ANG[f] || 0, sp, { btn: on, tilt: F.tilt });
});
ST.hooks.afterChars.push((ctx, f, S, CAM) => {
  ctx.setTransform(...CAM);
  // поток ветра от головы вентилятора
  const F = fanAt(f, S), sp = spAt(f), pw = E.clamp((sp - 0.3) / 0.5, 0, 1) * E.clamp((Math.abs(F.face) - 0.3) / 0.5, 0, 1);
  if (pw > 0) {
    const dir = Math.sign(F.face), hx = F.x + dir * FS * 0.18, hy = F.y - HEADY;
    ctx.save(); ctx.translate(hx, hy); ctx.rotate(F.tilt);
    FX.fanWind(ctx, 0, 0, dir, 1500, f / FPS, pw, 260, 3);
    ctx.restore();
  }
  // шляпа
  const h = hatSeg(f);
  if (h.on && h.on !== 'lord') {
    const p = hatOn(h.on, S);
    drawHat(ctx, p[0], p[1], E.rad(S[h.on].p.rot || 0));
  } else if (h.from) {
    const u = E.clamp((f - h.f0) / (h.f1 - h.f0), 0, 1);
    const a = hatOn(h.from, statesAt(Math.max(0, h.f0 - 1))), b = hatOn(h.to, S);
    drawHat(ctx, E.lerp(a[0], b[0], u), E.lerp(a[1], b[1], u) - Math.sin(Math.PI * u) * h.arc, u * Math.PI * 2 * h.spin);
  }
});

ST.start(BIG);
