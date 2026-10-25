// Ролик 11 (серия по образцу): Тыквы — Лорд против Жёлтой, 25 с, 24 кадра/с. Плотно, как у HugyTi: шляпа-
// бумеранг, магия, превращения туда и обратно. Музыка превращения — присланная, ~4 с с затиханием.
// Фон «майнкрафт», тема «сад» (яблони, тыквы, забор); на переднем плане блочная яблоня.
//
//   0–1.8 с   шарик-Лорд (слева) и шарик-Жёлтая (справа) под яблоней
//   1.8–3.4 с Лорд запускает шляпу бумерангом — она бьёт по кроне и возвращается; три яблока по макушке Жёлтой
//   3.6–4.8 с Жёлтая «растёт» под музыку — Лорд влюблён, скачет к ней
//   5.5–8 с   она колдует: с неба падает тыква-фонарь и накрывает Лорда; тыква вслепую прыгает
//   8–9.4 с   Лорд «растёт» прямо в тыкве — тыква разлетается на кусочки
//   9.5–12 с  большой Лорд тяжело дышит и поёт ей; она подбирает яблоко и кидает ему в открытый рот — глотает
//   13–17 с   злой Лорд снимает шляпу и достаёт из неё огромную тыкву — толкает: тыква катится и расплющивает
//             Жёлтую, бьётся о яблоню; яблоко ей на макушку — пуф, она снова маленькая
//   17.6–19 с Жёлтая «растёт» снова — Лорд опять влюблён
//   19–21.5 с она колдует: под Лордом вырастает тыква и поднимает его; щелчок пальцами — тыква пружинит и
//             запускает Лорда в небо
//   21.5–25 с Жёлтая в центре, руки вверх
'use strict';

const ST = Stage({
  name: 'mc11-pumpkins',
  cast: {
    lord: { small: ['lord-verity-small', { bodyHeight: 300 }], big: ['lord-verity-big', { height: 730 }], pivot: 337,
      voice: 1.0, lie: 55, color: '#ffe23a', ouch: ['ref:hit-ow', 1.0, 0.9] },
    yel: { small: ['girl-verity-small', { bodyHeight: 300, recolor: 'yellow' }],
      big: ['verity-big-girl', { height: 730, splitFeet: true, recolor: 'yellow' }], pivot: 337, voice: 1.45, vAngle: 50,
      color: '#ffe23a', moods: { angry: 'angry theeth', grin: 'theeth smile', big: 'theeth smile' } },
  },
  order: ['lord', 'yel'],
  background: { theme: 'orchard', seed: 111, sunX: 330, sunY: 140 },
  clouds: [[100, 80, 2.4, 0, 12], [640, 200, 1.8, 1, 16], [1120, 60, 2.6, 2, 10], [1500, 240, 1.6, 0, 18], [380, 300, 1.4, 1, 14]],
});
const { FPS, NF, GROUND, C, key, move, ev, sfx, hop, laugh, tremble, transform, shrink, love, stance,
  flyOff, victory, chuckle, hand, toRig, statesAt, stateAt, target } = ST;

// поля шляпы большого Лорда (за них он берёт шляпу)
ST.parts.brim = (ch, st) => {
  const c = ch.point(st, 'hat'), l = ch.layers.find((x) => x.name === 'hat');
  return [c[0], c[1] + (l.bbox[3] - l.bbox[1]) * ch.scale * 0.5 - 10];
};
const P = (v, f, S) => (typeof v === 'function' ? v(f, S) : typeof v === 'string' ? target(v, S) : v);
const keyed = (ks, f) => {                         // [[кадр, значение], ...] -> значение в кадре f (плавно)
  if (typeof ks === 'number') return ks;
  if (f <= ks[0][0]) return ks[0][1];
  for (let i = 1; i < ks.length; i++) {
    if (f < ks[i][0]) { const u = E.EASE.io((f - ks[i - 1][0]) / (ks[i][0] - ks[i - 1][0])); return E.lerp(ks[i - 1][1], ks[i][1], u); }
  }
  return ks[ks.length - 1][1];
};
// предмет по отрезкам: {f0, at} | {f0, f1, a, b, arc, spin, ease} | {f0, hand: 'yel'} | {f0, gone}
function segAt(segs, f, S) {
  let cur = null;
  for (const c of segs) if (f >= c.f0) cur = c;
  if (!cur || cur.gone) return null;
  if (cur.at) { const p = P(cur.at, f, S); return { x: p[0], y: p[1], rot: cur.rot || 0, ground: cur.ground }; }
  if (cur.hand) { const h = C[cur.hand].big.point(S[cur.hand].st, 'handB'); return { x: h[0], y: h[1] - 22, rot: 0 }; }
  const u = E.clamp((f - cur.f0) / (cur.f1 - cur.f0), 0, 1), a = P(cur.a, cur.f0, statesAt(cur.f0)), b = P(cur.b, f, S);
  const v = E.EASE[cur.ease || 'lin'](u);
  return { x: E.lerp(a[0], b[0], u), y: E.lerp(a[1], b[1], v) - Math.sin(Math.PI * u) * (cur.arc || 0), rot: (cur.spin || 0) * u };
}

// ------------------------------------------------------------------ яблоня, яблоки, шляпа, тыквы
const TX = 1760, TBOT = GROUND - 440;              // ствол яблони, низ кроны
const SHAKES = [];                                 // {f0, f1, amp}
const treeShake = (f) => SHAKES.reduce((s, k) => (f < k.f0 || f > k.f1 ? s : s + k.amp * Math.sin((f - k.f0) * 1.5) * (1 - (f - k.f0) / (k.f1 - k.f0))), 0);
const HANG = [[-40, -36], [70, -30], [150, -112], [-20, -196], [120, -236], [-170, -178], [200, -40]];   // висят всегда
const APPLES = [];                                 // {segs}
const HAT = [];                                    // шляпа Лорда: {f0, head} | {f0, f1, a, b, arc, spin} | {f0, hand: 'F', rot}
const PUMPS = [];                                  // тыквы: E.Track с x, y (низ), s, rot, sq, alpha; behind — позади героев
const BURSTS = [];                                 // {f, at, seed, size, n}
const NOTES = [];                                  // [f0, f1] — нотки, пока Лорд поёт
const pump = (behind = false) => { const tr = new E.Track(); tr.add(0, { x: 0, y: GROUND, s: 0, rot: 0, sq: 1, alpha: 0 }, 'io', 0); PUMPS.push({ tr, behind }); return tr; };
const pk = (tr, f, props, n = null, ease = 'io') => tr.add(f, props, ease, n);

const LS = 480, YS = 1560;
// ================================================================== 0–1.8 с: стойка
key('lord', 0, { form: 'small', x: LS, y: GROUND, face: 1, look: 1, eyes: 'normal', mouth: 'smile normal', sx: 1, sy: 1, rot: 0, pivot: 0, alpha: 1 }, 0);
key('yel', 0, { form: 'small', x: YS, y: GROUND, face: -1, look: 1, eyes: 'normal', mouth: 'smile normal', sx: 1, sy: 1, rot: 0, pivot: 0, alpha: 1 }, 0);
HAT.push({ f0: 0, head: true });

const BIG = () => {
  // ---- 1.8–3.4 с: шляпа-бумеранг по кроне — три яблока Жёлтой по макушке
  const HT = 40;
  key('lord', HT, { mouth: 'happy with theeth', eyes: 'angry' }, 0);
  sfx('ref:grin-eee', HT, { who: 'lord', gain: 0.45, pitch: 1.1 });
  key('lord', HT + 6, { rot: -14, pivot: 150, sx: 1.08, sy: 0.93 }, 5);          // замах — откинулся
  const TH = HT + 8;
  key('lord', TH, { rot: 12, sx: 0.94, sy: 1.06 }, 2, 'in2');
  key('lord', TH + 8, { rot: 0, sx: 1, sy: 1 }, 6);
  const CAN = [TX - 170, TBOT - 110];
  HAT.push({ f0: TH, f1: TH + 13, a: 'lord:hat', b: CAN, arc: 80, spin: Math.PI * 6 });
  sfx('whoosh', TH, { who: 'lord', dur: 12, gain: 0.6 });
  const BONK = TH + 13;
  sfx('bonk', BONK, { at: CAN, gain: 0.8 });
  sfx('brush', BONK + 1, { at: CAN, gain: 0.7 });
  SHAKES.push({ f0: BONK, f1: BONK + 28, amp: 16 });
  HAT.push({ f0: BONK, f1: BONK + 16, a: CAN, b: 'lord:hat', arc: 70, spin: Math.PI * 6 });
  HAT.push({ f0: BONK + 16, head: true });
  sfx('whoosh', BONK + 2, { who: 'lord', dur: 12, gain: 0.5 });
  sfx('pop', BONK + 16, { who: 'lord', gain: 0.6 });
  key('lord', BONK + 16, { sx: 1.1, sy: 0.9 }, 1);
  key('lord', BONK + 21, { sx: 1, sy: 1 }, 4);
  const FALL = [[BONK + 3, -205, -48, 1265], [BONK + 8, -140, 18, 1190], [BONK + 13, -60, 18, 1120]];
  FALL.forEach(([f, dx, dy, rx], i) => {
    const hit = f + 7;
    const top = (ff, S) => { const t = target('yel:top', S); return [t[0] + (i - 1) * 26, t[1] - 20]; };
    APPLES.push({ segs: [
      { f0: 0, at: (ff) => [TX + treeShake(ff) + dx, TBOT + dy] },
      { f0: f, f1: hit, a: [TX + dx, TBOT + dy], b: top, ease: 'in2', spin: 0.8 },
      { f0: hit, f1: hit + 14, a: top, b: [rx, GROUND - 24], arc: 130, spin: -6 },
      { f0: hit + 14, at: [rx, GROUND - 24], ground: true }] });
    sfx('bonk', hit, { who: 'yel', gain: 0.85 });
    sfx('land', hit + 14, { x: rx, gain: 0.3 });
    key('yel', hit, { sx: 1.2, sy: 0.82, mouth: 'puzzlement', eyes: 'sad' }, 1);
    key('yel', hit + 4, { sx: 1, sy: 1 }, 4);
    if (i === 0) sfx('ref:grunt', hit + 2, { who: 'yel', gain: 0.6, pitch: 1.5 });
  });
  const LAST = FALL[2][0] + 7;
  ev('stars', { who: 'yel', f0: LAST + 2, f1: LAST + 30 });
  key('lord', BONK + 20, { mouth: 'happy with theeth', eyes: 'normal' }, 0);
  sfx('ref:laugh', BONK + 20, { who: 'lord', gain: 0.85, pitch: 1.0 });
  laugh('lord', BONK + 20, BONK + 38);

  // ---- 3.6–4.8 с: Жёлтая «растёт» — Лорд влюблён и скачет к ней
  const YX = 1400, YG = LAST + 6;
  key('yel', LAST + 3, { eyes: 'angry', mouth: 'angry theeth' }, 0);
  const YB = transform('yel', YG, YS, YX, -1, { style: 'grow', love: 'lord', loveDur: 70 });
  key('yel', YB, stance('yel', YX, -1), 0);
  key('yel', YB + 6, { mouth: 'theeth smile', eyes: 'normal' }, 0);
  const LX1 = 960;
  hop('lord', YB + 8, YB + 20, LS, 720, 90);
  hop('lord', YB + 24, YB + 36, 720, LX1, 90);

  // ---- 5.5–8 с: колдует — с неба тыква накрывает Лорда; тыква вслепую прыгает
  const PT = YB + 30;
  key('yel', PT - 6, { handF: hand('yel', 'F', 0.95, -0.35), mouth: 'happy with theeth', eyes: 'angry' }, 6);
  const hf = C.yel.big.point(stateAt(PT).yel.st, 'handF');
  ev('twinkle', { f: PT, at: hf, n: 16, size: 40 });
  sfx('sparkle', PT, { who: 'yel', gain: 0.7 });
  ev('twinkle', { f: PT + 2, at: [LX1, 140], n: 20, size: 60 });
  const T1 = pump(), PS = 380, DROP = PT + 12;
  pk(T1, PT + 2, { x: LX1, y: -40, s: PS, rot: 0.35, sq: 1, alpha: 1 }, 0);
  pk(T1, DROP, { y: GROUND, rot: 0 }, null, 'in2');
  sfx('whoosh', PT + 3, { x: LX1, dur: 9, gain: 0.6 });
  key('lord', DROP, { alpha: 0 }, 0);
  sfx('slam', DROP, { x: LX1, gain: 1.0 });
  ev('dust', { f: DROP, x: LX1, r: 60, n: 7 });
  ev('shake', { f: DROP, amp: 12, n: 8 });
  pk(T1, DROP + 1, { sq: 0.8 }, 1);
  pk(T1, DROP + 5, { sq: 1.08 }, 4);
  pk(T1, DROP + 9, { sq: 1 }, 4);
  sfx('ref:grunt', DROP + 4, { who: 'lord', gain: 0.45, pitch: 0.7 });
  key('yel', DROP + 4, { ...stance('yel', YX, -1), mouth: 'happy with theeth', eyes: 'normal' }, 8);
  sfx('ref:laugh', DROP + 8, { who: 'yel', gain: 0.85, pitch: 1.45 });
  chuckle('yel', DROP + 8, DROP + 30, { mouth: 'happy with theeth' });
  // прыжки вслепую — влево
  let px = LX1;
  for (const [j, dx] of [[DROP + 12, -80], [DROP + 24, -80]]) {
    pk(T1, j, { x: px, y: GROUND, sq: 0.86, rot: 0 }, 3);
    pk(T1, j + 3, { sq: 1.1 }, 3);
    pk(T1, j + 5, { y: GROUND - 80, rot: -0.12 }, 5, 'out2');
    pk(T1, j + 7, { sq: 1 }, 4);
    pk(T1, j + 10, { x: px + dx, y: GROUND, sq: 1, rot: 0 }, 5, 'in2');
    pk(T1, j + 11, { sq: 0.86 }, 1);
    pk(T1, j + 15, { sq: 1 }, 4);
    sfx('jump', j + 1, { x: px, gain: 0.4 });
    sfx('land', j + 10, { x: px + dx, gain: 0.6 });
    sfx('ref:grunt', j + 4, { who: 'lord', gain: 0.4, pitch: 0.75 });
    px += dx;
  }
  move('lord', DROP + 12, { x: LX1 });
  move('lord', DROP + 34, { x: px });

  // ---- 8–9.4 с: Лорд «растёт» прямо в тыкве — тыква разлетается
  const LT = DROP + 38, LX = 760;
  for (let f = LT + 1; f < LT + 8; f++) pk(T1, f, { x: px + (f % 2 ? 7 : -7) }, 1, 'lin');
  const LB = transform('lord', LT, px, LX, 1, { style: 'grow' });
  const BUR = LT + 8;
  key('lord', BUR, { alpha: 1 }, 0);
  pk(T1, BUR, { alpha: 0 }, 0);
  BURSTS.push({ f: BUR, at: [px, GROUND - 190], seed: 5, size: 66, n: 18 });
  sfx('crunch', BUR, { x: px, gain: 1.0 });
  sfx('poof', BUR, { x: px, gain: 0.6 });
  ev('shake', { f: BUR, amp: 10, n: 6 });
  key('yel', LB - 4, { mouth: 'puzzlement', eyes: 'sad' }, 0);
  ev('sweat', { who: 'yel', f0: LB, f1: LB + 24 });

  // ---- 9.5–12 с: дышит и поёт ей — она кидает яблоко ему в рот
  key('lord', LB, stance('lord', LX, 1), 0);
  key('lord', LB + 4, { mouth: 'happy - spittle', eyes: 'normal' }, 0);
  const BR = LB + 6;                                       // вдохи в записи: 0, .6 с
  sfx('ref:lord-breath', BR, { who: 'lord', gain: 1.9, dur: 30, fade: 0.25 });
  for (const t of [0.02, 0.6]) {
    const f = BR + Math.round(t * FPS);
    key('lord', f + 3, { lean: -13, head: -11, hip: [0, toRig('lord', 4)] }, 3);
    key('lord', f + 11, { lean: -5, head: -4, hip: [0, toRig('lord', 14)] }, 8);
  }
  const SING = BR + 30;
  love('lord', LB + 6, SING + 24, { mouth: false });
  key('lord', SING - 5, { lean: 6, head: -4, hip: [0, toRig('lord', 8)], handF: hand('lord', 'F', 0.95, -0.3), mouth: 'happy open mouth' }, 6);
  sfx('ref:lord-sing', SING, { who: 'lord', gain: 1.4 });
  NOTES.push([SING, SING + 20]);
  key('lord', SING + 8, { head: 4 }, 6);
  key('lord', SING + 16, { head: -4 }, 6);
  const A0 = APPLES[0], AX = FALL[0][3];
  const PICK = SING - 8;
  key('yel', PICK - 8, { lean: 26, hip: [0, toRig('yel', 120)], head: 10, mouth: 'angry theeth', eyes: 'angry' }, 8);
  key('yel', PICK, { hitB: 1, hitBto: [AX, GROUND - 30], hitBfix: PICK }, 6);
  A0.segs.push({ f0: PICK, hand: 'yel' });
  sfx('pop', PICK, { who: 'yel', gain: 0.4 });
  key('yel', PICK + 10, { ...stance('yel', YX, -1), hitB: 0, handB: hand('yel', 'B', -0.5, -0.75), mouth: 'angry theeth', eyes: 'angry' }, 10);
  const THR = PICK + 24, GULP = THR + 9;
  key('yel', THR, { handB: hand('yel', 'B', 0.95, -0.4), lean: 12 }, 4, 'in2');
  key('yel', THR + 12, { ...stance('yel', YX, -1), mouth: 'happy with theeth', eyes: 'normal' }, 10);
  sfx('swing', THR - 3, { who: 'yel', gain: 0.8 });
  A0.segs.push({ f0: THR, f1: GULP, a: (f, S) => { const h = C.yel.big.point(S.yel.st, 'handB'); return [h[0], h[1] - 22]; }, b: 'lord:lips', arc: 60, spin: 7 });
  A0.segs.push({ f0: GULP, gone: true });
  key('lord', GULP, { mouth: 'puzzlement', eyes: 'sad', sx: 0.94, sy: 1.06, lean: -4, head: -8 }, 1);
  sfx('gulp', GULP + 3, { who: 'lord', gain: 1.0 });
  key('lord', GULP + 6, { sx: 1, sy: 1 }, 4);
  ev('sweat', { who: 'lord', f0: GULP + 4, f1: GULP + 26 });
  for (const c of [GULP + 12, GULP + 18]) {                // кашляет
    key('lord', c, { lean: 14, head: 10 }, 2);
    key('lord', c + 4, { lean: 2, head: 0 }, 3);
    sfx('ref:grunt', c, { who: 'lord', gain: 0.6, pitch: 0.85 });
  }
  sfx('ref:laugh', GULP + 6, { who: 'yel', gain: 0.85, pitch: 1.45 });
  chuckle('yel', GULP + 6, GULP + 26, { mouth: 'happy with theeth' });

  // ---- 13–17 с: шляпа-фокус — огромная тыква катится и расплющивает Жёлтую
  const MH = GULP + 20;
  ev('vein', { who: 'lord', f0: MH - 4, f1: MH + 14 });
  key('lord', MH, { ...stance('lord', LX, 1), mouth: 'angry theeth', eyes: 'angry' }, 6);
  const TAKE = MH + 8;
  key('lord', TAKE, { hitF: 1, hitFto: 'lord:brim', hitFfix: TAKE }, 6);
  sfx('pop', TAKE, { who: 'lord', gain: 0.4 });
  HAT.push({ f0: TAKE, hand: 'F', rot: [[TAKE, 0], [TAKE + 10, Math.PI]] });
  key('lord', TAKE + 10, { hitF: 0, handF: hand('lord', 'F', 0.85, 0.05), mouth: 'happy with theeth' }, 10);
  key('lord', TAKE + 10, { handB: hand('lord', 'B', 0.15, -0.95) }, 6);       // колдует: рука вверх — и вниз
  key('lord', TAKE + 16, { handB: hand('lord', 'B', -0.1, -0.85) }, 3, 'in2');
  key('lord', TAKE + 24, { handB: stance('lord', LX, 1).handB }, 6);
  const EM = TAKE + 16, op = C.lord.big.point(stateAt(EM).lord.st, 'handF');
  ev('twinkle', { f: EM - 4, at: [op[0], op[1] - 30], n: 16, size: 44 });
  sfx('sparkle', EM - 4, { who: 'lord', gain: 0.7 });
  const T2 = pump(), GS = 290, GX = LX + 330;
  pk(T2, EM, { x: op[0], y: op[1] - 4, s: 30, rot: 0, sq: 1, alpha: 1 }, 0);
  pk(T2, EM + 10, { s: GS, y: op[1] - 30 }, 10, 'out');
  pk(T2, EM + 13, { y: op[1] - 160, x: (op[0] + GX) / 2, rot: 0.6 }, 3, 'out2');
  pk(T2, EM + 20, { y: GROUND, x: GX, rot: 0 }, 7, 'in2');
  pk(T2, EM + 21, { sq: 0.82 }, 1);
  pk(T2, EM + 25, { sq: 1.06 }, 4);
  pk(T2, EM + 29, { sq: 1 }, 4);
  sfx('poof', EM, { who: 'lord', gain: 0.7 });
  sfx('grow', EM + 1, { who: 'lord', gain: 0.8 });
  sfx('slam', EM + 20, { x: GX, gain: 0.9 });
  ev('dust', { f: EM + 20, x: GX, r: 50, n: 6 });
  ev('shake', { f: EM + 20, amp: 10, n: 6 });
  key('yel', EM + 4, { mouth: 'puzzlement', eyes: 'sad' }, 0);
  // шляпу обратно на голову
  const PUT = EM + 22;
  key('lord', PUT, { hitF: 1, hitFto: 'lord:brim' }, 6);
  HAT.push({ f0: PUT - 6, hand: 'F', rot: [[PUT - 6, Math.PI], [PUT, 0]] });
  HAT.push({ f0: PUT + 1, head: true });
  key('lord', PUT + 8, { hitF: 0, handF: stance('lord', LX, 1).handF, handB: stance('lord', LX, 1).handB }, 6);
  // толкает тыкву — катится к ней
  const POKE = PUT + 10;
  key('lord', POKE, { hitF: 1, hitFto: [GX - GS / 2, GROUND - GS * 0.85], hitFfix: POKE, lean: 14 }, 5, 'in2');
  key('lord', POKE + 10, { hitF: 0, lean: 0, ...stance('lord', LX, 1), mouth: 'happy with theeth' }, 8);
  sfx('slap', POKE, { x: GX - GS / 2, gain: 0.5 });
  const R0 = POKE + 1, FLAT = R0 + 11, TRUNK = R0 + 20, RX = TX - 33 - GS / 2;
  pk(T2, R0, { x: GX, rot: 0, y: GROUND }, 0);
  pk(T2, FLAT - 2, { y: GROUND }, null);
  pk(T2, FLAT + 3, { y: GROUND - 230 }, 5, 'out2');
  pk(T2, TRUNK - 2, { y: GROUND }, null, 'in2');
  pk(T2, TRUNK, { x: RX, rot: Math.PI * 2 }, null, 'lin');
  sfx('creak', R0, { x: GX, dur: 18, gain: 0.5 });
  key('yel', FLAT - 3, { mouth: 'puzzlement', eyes: 'sad', handF: hand('yel', 'F', 0.6, -0.5), handB: hand('yel', 'B', 0.6, -0.6) }, 3);
  key('yel', FLAT, { sx: 2.0, sy: 0.35, rot: 0, pivot: 0 }, 1);
  sfx('squish', FLAT, { who: 'yel', gain: 1.0 });
  sfx('ref:hit-ow', FLAT + 2, { who: 'yel', gain: 0.7, pitch: 1.45 });
  ev('shake', { f: FLAT, amp: 8, n: 6 });
  // бьётся о яблоню и разлетается; яблоко ей на макушку
  pk(T2, TRUNK, { alpha: 0 }, 0);
  BURSTS.push({ f: TRUNK, at: [RX + 40, GROUND - GS / 2], seed: 9, size: 58, n: 16 });
  sfx('crunch', TRUNK, { x: RX, gain: 1.0 });
  sfx('bonk', TRUNK, { x: TX, gain: 0.7 });
  SHAKES.push({ f0: TRUNK, f1: TRUNK + 30, amp: 20 });
  const A4 = TRUNK + 4, hit4 = A4 + 7, flatTop = (f, S) => { const t = target('yel:top', S); return [t[0] - 30, t[1] - 18]; };
  APPLES.push({ segs: [
    { f0: 0, at: (ff) => [TX + treeShake(ff) - 230, TBOT - 120] },
    { f0: A4, f1: hit4, a: [TX - 230, TBOT - 120], b: flatTop, ease: 'in2', spin: 1 },
    { f0: hit4, f1: hit4 + 14, a: flatTop, b: [1030, GROUND - 24], arc: 150, spin: -6 },
    { f0: hit4 + 14, at: [1030, GROUND - 24], ground: true }] });
  sfx('bonk', hit4, { who: 'yel', gain: 0.85 });
  key('yel', hit4, { sx: 2.3, sy: 0.3 }, 1);
  key('yel', hit4 + 4, { sx: 2.0, sy: 0.35 }, 3);
  ev('stars', { who: 'yel', f0: hit4 + 2, f1: hit4 + 22 });
  key('lord', FLAT + 4, { mouth: 'happy with theeth', eyes: 'normal' }, 0);
  sfx('ref:laugh', FLAT + 6, { who: 'lord', gain: 0.85, pitch: 0.95 });
  chuckle('lord', FLAT + 6, FLAT + 34, { mouth: 'happy with theeth' });
  // пуф — снова маленькая
  const SHR = hit4 + 10, YS2 = 1420;
  const sm = shrink('yel', SHR, YS2, -1, { mouth: 'angry theeth', eyes: 'angry', smoke: 340 });
  key('yel', sm, { lean: 0, head: 0, hip: [0, 0] }, 0);

  // ---- 17.6–19 с: Жёлтая «растёт» снова — Лорд опять влюблён
  ev('vein', { who: 'yel', f0: sm + 4, f1: sm + 14 });
  const YX2 = 1300, RG = sm + 8;
  const YB2 = transform('yel', RG, YS2, YX2, -1, { style: 'grow', love: 'lord', loveDur: 22 });
  key('yel', YB2, stance('yel', YX2, -1), 0);
  key('yel', YB2 + 6, { mouth: 'theeth smile', eyes: 'normal' }, 0);
  key('lord', YB2 + 2, { ...stance('lord', LX, 1), mouth: 'happy - spittle', eyes: 'normal' }, 6);

  // ---- 19–21.5 с: искры под Лордом — щелчок пальцами — из земли выскакивает тыква и запускает его в небо
  const MG = YB2 + 14;
  key('yel', MG - 6, { handF: hand('yel', 'F', 0.9, 0.15), mouth: 'happy with theeth', eyes: 'angry' }, 6);
  sfx('sparkle', MG, { who: 'yel', gain: 0.7 });
  for (let i = 0; i < 3; i++) ev('twinkle', { f: MG + i * 3, at: [LX - 130 + i * 130, GROUND - 16], n: 12, size: 36 });
  key('lord', MG + 4, { mouth: 'puzzlement', eyes: 'sad', head: 14, lean: 6 }, 4);
  ev('sweat', { who: 'lord', f0: MG + 6, f1: MG + 22 });
  const SNAP = MG + 12, POP = SNAP + 2, LS3 = 300;
  key('yel', SNAP - 4, { handF: hand('yel', 'F', 0.75, -0.75) }, 4);
  sfx('flick', SNAP, { who: 'yel', gain: 1.0 });
  const T3 = pump(true);
  pk(T3, POP, { x: LX, y: GROUND, s: 0, rot: 0, sq: 1, alpha: 1 }, 0);
  pk(T3, POP + 4, { s: LS3, sq: 1.25 }, 4, 'out');
  pk(T3, POP + 8, { sq: 0.85 }, 4);
  pk(T3, POP + 12, { sq: 1 }, 4);
  move('lord', POP, { y: GROUND });
  move('lord', POP + 4, { y: GROUND - LS3 * 1.25 }, 'out');
  sfx('spring', POP, { x: LX, gain: 1.0 });
  sfx('boing', POP + 2, { x: LX, gain: 0.6 });
  ev('dust', { f: POP, x: LX, r: 50, n: 6 });
  const LAUNCH = POP + 4;
  flyOff('lord', LAUNCH, LAUNCH + 24, [LX, GROUND - LS3 * 1.25], [-300, -420], { turns: 3 });
  pk(T3, LAUNCH + 20, { alpha: 0 }, 0);
  BURSTS.push({ f: LAUNCH + 20, at: [LX, GROUND - LS3 / 2], seed: 13, size: 66, n: 18 });
  sfx('crunch', LAUNCH + 20, { x: LX, gain: 0.9 });
  key('yel', SNAP + 6, { ...stance('yel', YX2, -1), mouth: 'happy with theeth', eyes: 'normal' }, 8);
  sfx('ref:laugh', SNAP + 10, { who: 'yel', gain: 0.85, pitch: 1.45 });
  chuckle('yel', SNAP + 10, SNAP + 22, { mouth: 'happy with theeth' });
  const WIN = victory('yel', SNAP + 22, YX2, { n: 9, stride: 110 });
  window.T = { BONK, YB, DROP, LT, LB, SING, GULP, TAKE, EM, FLAT, SHR, YB2, SNAP, LAUNCH, WIN };
};

// шляпа Лорда: на голове, в полёте или в руке (тогда слой шляпы скрыт)
function hatAt(f, S) {
  let cur = null;
  for (const c of HAT) if (f >= c.f0) cur = c;
  if (!cur || cur.head) return null;
  if (cur.hand) { const h = C.lord.big.point(S.lord.st, 'hand' + cur.hand); return { x: h[0], y: h[1], rot: keyed(cur.rot, f), hand: true }; }
  const u = E.clamp((f - cur.f0) / (cur.f1 - cur.f0), 0, 1), a = P(cur.a, cur.f0, statesAt(cur.f0)), b = P(cur.b, f, S);
  return { x: E.lerp(a[0], b[0], u), y: E.lerp(a[1], b[1], u) - Math.sin(Math.PI * u) * (cur.arc || 0), rot: (cur.spin || 0) * u };
}
ST.hooks.drawPose = (who, p, f) => {
  if (who !== 'lord' || !hatAt(f, statesAt(f))) return p;
  return { ...p, hide: [...(p.hide || []), 'hat'] };
};
function drawHat(ctx, f, S) {
  const h = hatAt(f, S);
  if (!h) return;
  const L = C.lord[S.lord.p.form === 'big' ? 'big' : 'small'], l = L.layers.find((x) => x.name === 'hat');
  const sc = L.scale, w = (l.bbox[2] - l.bbox[0]) * sc, hh = (l.bbox[3] - l.bbox[1]) * sc;
  ctx.save(); ctx.translate(h.x, h.y); ctx.rotate(h.rot);
  if (h.hand) ctx.drawImage(l.img.canvas, -w / 2, -hh + 10, w, hh);          // держит за поля
  else { ctx.scale(1, 0.8 + 0.2 * Math.abs(Math.cos(h.rot))); ctx.drawImage(l.img.canvas, -w / 2, -hh / 2, w, hh); }
  ctx.restore();
}
function drawPump(ctx, f, tr) {
  const p = tr.sample(f, {});
  if (!(p.alpha > 0) || p.s < 2) return;
  FX.pumpkinBlock(ctx, p.x, p.y, p.s, p.rot, true, p.sq);
}
function drawApple(ctx, f, S, A, ground) {
  const a = segAt(A.segs, f, S);
  if (!a || !!a.ground !== ground) return;
  FX.apple(ctx, a.x, a.y, 26, a.rot);
}

ST.hooks.beforeChars.push((ctx, f, S, CAM) => {
  ctx.setTransform(...CAM);
  const sh = treeShake(f);
  FX.mcAppleTree(ctx, TX, GROUND, sh, HANG, { seed: 11 });
  for (const A of APPLES) { if (f < A.segs[1].f0) { const a = segAt(A.segs, f, S); FX.apple(ctx, a.x, a.y, 26, 0); } }   // ещё висят
  for (const A of APPLES) drawApple(ctx, f, S, A, true);
  for (const q of PUMPS) if (q.behind) drawPump(ctx, f, q.tr);
});
ST.hooks.afterChars.push((ctx, f, S, CAM) => {
  ctx.setTransform(...CAM);
  for (const A of APPLES) { if (f >= A.segs[1].f0) drawApple(ctx, f, S, A, false); }
  for (const q of PUMPS) if (!q.behind) drawPump(ctx, f, q.tr);
  drawHat(ctx, f, S);
  for (const b of BURSTS) FX.blockBurst(ctx, b.at[0], b.at[1], (f - b.f) / 20, b.seed, undefined, b.n, b.size, 1, GROUND);
  // нотки, пока поёт
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
