// Серия 2, ролик 23: Гамак — Розовая (слева) против Малыша (справа), 22 с, 24 кадра/с. Драка без ударов:
// гамак между двумя столбами из брёвен: батут-катапульта, рогатка, «буррито», покрывало, скатерть из-под ног.
// Музыка превращения — один раз. Фон — цветочное поле.
//
//   0–2 с     шарик-Розовая и шарик-Малыш неподвижно стоят друг напротив друга, середина пустая
//   2–4.3 с   из земли вырастают столбы с гамаком; Малыш валяется в гамаке, Розовая прыгает туда же —
//             Малыш подпрыгивает, и гамак катапультой выкидывает её
//   4.3–5.5 с Розовая «растёт» под музыку — Малыш влюблён
//   5.6–9.3 с оттягивает гамак, как рогатку, — Малыш улетает в небо, падает обратно и заворачивается «буррито», крутится
//   9.3–11 с  Малыш выкатывается и «растёт», снимает гамак и набрасывает ей на голову
//   12–13.5 с она вслепую поскальзывается — «пуф»; гамак падает на траву
//   13.5–15.8 с Малыш встаёт на гамак — шарик-Розовая тянет край зубами — он падает — «пуф», улетает
//   15.8–22 с Розовая «растёт» и в центре, руки вверх
'use strict';

const ST = Stage({
  name: '23 Розовая vs Малыш',
  frames: 528,
  cast: {
    pink: { small: ['girl-verity-small', { bodyHeight: 300 }], big: ['girl-verity-big', { height: 730, splitFeet: true }],
      pivot: 337, voice: 1.35, vAngle: 50, lie: 55, color: '#ff4fc8', moods: { angry: 'angry theeth', grin: 'theeth smile', big: 'theeth smile' } },
    baby: { small: ['child-verity-pink', { bodyHeight: 300, spin: { layer: 'hat', cut: 122, axis: 389 } }],
      big: ['child-verity-big', { height: 730, spin: { layer: 'hat', cut: 106, axis: 330 } }], pivot: 338, voice: 1.25,
      lie: 60, color: '#ffd9b8', moods: { angry: ' 2', grin: ' 2', big: 'theeth smile', love: ' 1' } },
  },
  order: ['baby', 'pink'],
  background: { theme: 'flowerfield', seed: 1023, sunX: 1500, sunY: 130 },
  clouds: [[150, 80, 2.4, 0, 12], [700, 220, 1.8, 1, 16], [1150, 70, 2.6, 2, 10], [1720, 250, 1.5, 0, 18]],
});
const { FPS, NF, GROUND, C, key, move, ev, sfx, hop, laugh, tremble, transform, shrink, stance, walk,
  slip, victory, chuckle, hand, statesAt, target } = ST;
const P = (v, f, S) => (typeof v === 'function' ? v(f, S) : typeof v === 'string' ? target(v, S) : v);
ST.parts.mouth = (ch, st, p) => (p.form === 'big' ? ST.parts.lips(ch, st) : E.apply(ch.eyeMatrix(st, ' 2'), [315, 740]));
function propeller(who, f0, f1, rps = 7, o = {}) {
  key(who, f0, { spin: 0, spinBlur: 0 }, 0);
  key(who, f0 + 8, { spinBlur: 1 }, 8);
  move(who, f1, { spin: rps * (f1 - f0) / 24 }, 'lin');
  key(who, f1, { spinBlur: 0 }, 6);
  key(who, f1 + 1, { spin: 0 }, 0);
  if (o.snd !== false) sfx('whirr', f0, { who, dur: f1 - f0, gain: o.gain ?? 0.4 });
}

// ------------------------------------------------------------------ столбы и гамак
const PA = 700, PB = 1220, PH = 420, POSTS = { f0: 48, f1: 1e9 };
const A = [PA + 20, GROUND - PH + 50], B = [PB - 20, GROUND - PH + 50], M0 = [960, GROUND - 190];
const HAM = [];           // {f0, hang} | {f0, burrito: who} | {f0, roll: who} | {f0, f1, a, b, arc} | {f0, cover: who} | {f0, f1, off: who, to} | {f0, ground: [x0, x1]} | {f0, f1, yank: [x0, x1], dx}
const MID = [];           // ключи середины гамака: [f, x, y]
const DIP = [];           // толчки: [f, amp]
function segAt(segs, f) { let c = null; for (const s of segs) if (f >= s.f0) c = s; return c && !c.gone ? c : null; }
function midAt(f) {
  let m = M0;
  if (MID.length && f >= MID[0][0]) {
    let i = 0; while (i < MID.length - 1 && f >= MID[i + 1][0]) i++;
    if (i === MID.length - 1) m = [MID[i][1], MID[i][2]];
    else { const u = E.EASE.io((f - MID[i][0]) / (MID[i + 1][0] - MID[i][0])); m = [E.lerp(MID[i][1], MID[i + 1][1], u), E.lerp(MID[i][2], MID[i + 1][2], u)]; }
  }
  let dy = 0;
  for (const [a, amp] of DIP) if (f >= a) dy += amp * Math.sin((f - a) * 0.75) * Math.exp(-(f - a) / 7);
  return [m[0], m[1] + dy];
}
const seat = (f) => { const m = midAt(f); return [m[0], m[1] + 22]; };
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
  sfx('jump', f0 + 2, { who, gain: 0.55 });
}
const SIT = [];           // {who, f0, f1, dx} — шарик сидит в гамаке
const LATE = [];

const PX0 = 560, BX0 = 1360;
// ================================================================== 0–2 с: неподвижная стойка
key('pink', 0, { form: 'small', x: PX0, y: GROUND, face: 1, look: 1, eyes: 'normal', mouth: 'smile normal', sx: 1, sy: 1, rot: 0, pivot: 0, alpha: 1 }, 0);
key('baby', 0, { form: 'small', x: BX0, y: GROUND, face: -1, look: 1, eyes: 'normal', mouth: ' 6', sx: 1, sy: 1, rot: 0, pivot: 0, alpha: 1 }, 0);

const BIG = () => {
  // ---- 2–4.3 с: столбы и гамак — Малыш в гамаке — Розовая туда же — катапульта
  sfx('slide', 48, { x: 960, gain: 0.5, pitch: 0.8 }); sfx('land', 56, { x: 960, gain: 0.5, pitch: 0.8 });
  ev('dust', { f: 50, x: PA, r: 50, n: 5, snd: false }); ev('dust', { f: 50, x: PB, r: 50, n: 5, snd: false });
  HAM.push({ f0: 55, hang: true });
  sfx('pop', 55, { x: 960, gain: 0.6 }); ev('twinkle', { f: 56, at: [960, GROUND - 200], n: 14, size: 40 });
  key('pink', 48, { mouth: 'puzzlement', eyes: 'sad' }, 0); key('baby', 48, { mouth: ' 5', eyes: 'sad' }, 0);
  hopTo('pink', 50, 58, PX0, GROUND, PX0 - 90, GROUND, 60, { prep: 2 }); hopTo('baby', 50, 58, BX0, GROUND, BX0 + 90, GROUND, 60, { prep: 2 });
  key('baby', 58, { mouth: ' 1', eyes: 'normal' }, 0);
  const IN1 = 70;
  hopTo('baby', 60, IN1, BX0 + 90, GROUND, M0[0], M0[1] + 22, 160, { land: false });
  DIP.push([IN1, 40]); sfx('boing', IN1, { x: 960, gain: 0.5 });
  SIT.push({ who: 'baby', f0: IN1, f1: 86, dx: 0 });
  key('baby', IN1, { sx: 1.25, sy: 0.8 }, 1); key('baby', IN1 + 5, { sx: 1, sy: 1 }, 4);
  for (let f = IN1 + 6; f < 84; f += 8) key('baby', f, { rot: f % 16 < 8 ? 8 : -8, pivot: ST.CAST.baby.pivot }, 4);
  sfx('ref:laugh', IN1 + 2, { who: 'baby', gain: 0.7, pitch: 1.3 });
  key('pink', 66, { mouth: 'happy - spittle', eyes: 'normal' }, 0);
  const IN2 = 82, ONY = -262;
  hopTo('pink', 72, IN2, PX0 - 90, GROUND, M0[0], M0[1] + 22 + ONY, 70, { land: false });
  DIP.push([IN2, 50]); sfx('boing', IN2, { x: 960, gain: 0.6 }); sfx('bonk', IN2, { who: 'baby', gain: 0.6 });
  key('pink', IN2, { sx: 1.25, sy: 0.8 }, 1); key('pink', IN2 + 4, { sx: 1, sy: 1 }, 3);
  key('baby', IN2, { sx: 1.3, sy: 0.75, mouth: ' 5', eyes: 'sad' }, 1); key('baby', IN2 + 4, { sx: 1, sy: 1 }, 3);
  SIT.push({ who: 'pink', f0: IN2, f1: 88, dx: 0, dy: ONY });
  // Малыш подпрыгивает — гамак выстреливает Розовую
  const BNC = 88;
  key('baby', BNC - 3, { rot: 0, mouth: ' 2', eyes: 'angry', sx: 1.2, sy: 0.85 }, 2);
  MID.push([BNC - 4, M0[0], M0[1]], [BNC, M0[0], M0[1] + 90], [BNC + 3, M0[0], M0[1] - 150], [BNC + 9, M0[0], M0[1] + 30], [BNC + 14, M0[0], M0[1]]);
  sfx('spring', BNC + 1, { x: 960, gain: 0.8 });
  const PX1 = 330, PL = BNC + 18;
  key('pink', BNC + 1, { pivot: ST.CAST.pink.pivot, mouth: 'puzzlement', eyes: 'sad' }, 0);
  move('pink', BNC + 1, { x: M0[0], y: M0[1] - 400, rot: 0 });
  move('pink', BNC + 8, { y: GROUND - 520 }, 'out2');
  move('pink', PL, { y: GROUND }, 'in2');
  move('pink', PL, { x: PX1, rot: -540 }, 'lin');
  key('pink', PL + 1, { rot: 0, pivot: 0 }, 0);
  key('pink', PL, { sx: 1.35, sy: 0.7 }, 1); key('pink', PL + 5, { sx: 1, sy: 1 }, 4);
  sfx('whoosh', BNC + 1, { who: 'pink', dur: 14, gain: 0.6 }); sfx('scared', BNC + 2, { who: 'pink', gain: 0.6 });
  sfx('fall', PL, { who: 'pink', gain: 0.9 }); ev('dust', { f: PL, x: PX1, r: 50, n: 6, snd: false });
  ev('stars', { who: 'pink', f0: PL + 2, f1: PL + 18 });
  SIT[0].f1 = BNC - 4;
  SIT.push({ who: 'baby', f0: BNC - 4, f1: 1e9, dx: 0 });
  key('baby', BNC + 4, { sx: 1, sy: 1, mouth: ' 1', eyes: 'normal' }, 4);
  sfx('ref:laugh', BNC + 6, { who: 'baby', gain: 0.85, pitch: 1.3 });
  laugh('baby', BNC + 8, BNC + 24);

  // ---- 4.3–5.5 с: Розовая «растёт» — Малыш влюблён
  const PX = 420;
  key('pink', PL + 4, { eyes: 'angry', mouth: 'angry theeth' }, 0);
  const PBg = transform('pink', PL + 6, PX1, PX, 1, { style: 'grow', love: 'baby', loveDur: 50 });
  key('pink', PBg, stance('pink', PX, 1), 0);
  key('pink', PBg + 4, { mouth: 'theeth smile', eyes: 'angry' }, 0);

  // ---- 5.6–9.3 с: рогатка — Малыш в небо — обратно — «буррито»
  const PX2 = 560;
  walk('pink', PBg + 4, PX, PX2, 2, 8, 1);
  const GR = PBg + 19, PULL = GR + 12, REL = PULL + 4;
  key('pink', GR - 4, { lean: 14, handF: hand('pink', 'F', 0.95, 0.15), handB: hand('pink', 'B', 0.85, 0.2) }, 4);
  const G1 = [M0[0] - 120, M0[1] + 10], G2 = [790, GROUND - 70];
  key('pink', GR, { hitF: 1, hitB: 1, hitFto: G1, hitBto: [G1[0] - 30, G1[1] - 10] }, 3);
  sfx('pop', GR, { who: 'pink', gain: 0.4 });
  key('pink', PULL, { lean: -10, hip: [0, ST.toRig('pink', 90)], hitFto: G2, hitBto: [G2[0] - 30, G2[1] - 10], mouth: 'theeth smile', eyes: 'angry' }, 12, 'io');
  sfx('creak', GR + 2, { x: 900, dur: 10, gain: 0.6 });
  MID.push([GR - 3, M0[0], M0[1]], [GR, G1[0] + 20, G1[1] + 10], [PULL, G2[0] + 20, G2[1] + 10], [PULL + 3, G2[0] + 20, G2[1] + 10]);
  key('baby', GR + 6, { mouth: ' 5', eyes: 'sad' }, 0);
  // отпустила!
  MID.push([REL, G2[0] + 20, G2[1] + 10], [REL + 3, M0[0] + 30, M0[1] - 260], [REL + 8, M0[0], M0[1] + 40], [REL + 13, M0[0], M0[1]]);
  key('pink', REL, { hitF: 0, hitB: 0 }, 2);
  sfx('spring', REL, { x: 900, gain: 0.9 }); sfx('swing', REL, { who: 'pink', gain: 0.6 });
  key('pink', REL + 2, { ...stance('pink', PX2, 1), lean: 0, hip: [0, 0], mouth: 'happy with theeth', eyes: 'normal' }, 6);
  SIT[SIT.length - 1].f1 = REL + 2;
  const TOP = REL + 14, BACK = TOP + 12;
  key('baby', REL + 2, { pivot: ST.CAST.baby.pivot }, 0);
  move('baby', REL + 3, { x: M0[0], y: M0[1] - 240, rot: 0 }); move('baby', TOP, { x: 990, y: -320, rot: 540 }, 'out2');
  move('baby', BACK, { x: M0[0], y: M0[1] + 40, rot: 900 }, 'in2');
  sfx('whoosh', REL + 3, { who: 'baby', dur: 10, gain: 0.6 }); sfx('scared', REL + 4, { who: 'baby', gain: 0.6 });
  sfx('ref:laugh', REL + 6, { who: 'pink', gain: 0.85, pitch: 1.35 });
  chuckle('pink', REL + 6, BACK + 30, { mouth: 'happy with theeth' });
  sfx('whoosh', TOP, { who: 'baby', dur: 10, gain: 0.5 });
  // заворачивается
  HAM.push({ f0: BACK, burrito: 'baby' });
  sfx('squish', BACK, { who: 'baby', gain: 0.8 }); sfx('boing', BACK, { who: 'baby', gain: 0.6 });
  const SP1 = BACK + 18;
  move('baby', BACK, { rot: 900 }); move('baby', SP1, { rot: 900 + 1440 }, 'out2');
  sfx('whirr', BACK + 1, { who: 'baby', dur: 16, gain: 0.5 });
  move('baby', BACK, { x: M0[0], y: M0[1] + 40 });
  ev('stars', { who: 'baby', f0: SP1 - 4, f1: SP1 + 12 });

  // ---- 9.3–11 с: Малыш выкатывается и «растёт» — снимает гамак — набрасывает ей на голову
  const BX1 = 1330, OUTB = SP1 + 4;
  HAM.push({ f0: OUTB, hang: true });
  key('baby', OUTB, { rot: 0, pivot: 0, eyes: 'angry', mouth: ' 2' }, 0);
  hopTo('baby', OUTB, OUTB + 10, M0[0], M0[1] + 40, BX1, GROUND, 100);
  DIP.push([OUTB, 30]);
  const BX = 1420;
  const BB = transform('baby', OUTB + 12, BX1, BX, -1, { style: 'grow' });
  key('baby', BB, stance('baby', BX, -1), 0);
  key('baby', BB + 4, { mouth: 'theeth smile', eyes: 'angry' }, 0);
  key('pink', BB - 2, { mouth: 'puzzlement', eyes: 'sad' }, 0);
  const UNH = BB + 6;
  key('baby', UNH - 4, { lean: 10, handF: hand('baby', 'F', 0.95, -0.5) }, 4);
  key('baby', UNH, { hitF: 1, hitFto: [B[0] + 10, B[1] + 20], hitFfix: UNH }, 3);
  HAM.push({ f0: UNH + 2, roll: 'baby' });
  sfx('pop', UNH, { who: 'baby', gain: 0.6 }); sfx('pop', UNH + 3, { x: PA, gain: 0.5 });
  key('baby', UNH + 6, { ...stance('baby', BX, -1), hitF: 0, handF: hand('baby', 'F', 0.2, -0.95), handB: hand('baby', 'B', 0.1, -0.95), mouth: 'happy with theeth' }, 6);
  const TH = UNH + 10, COV = TH + 10;
  key('baby', TH, { handF: hand('baby', 'F', 0.95, -0.3), handB: hand('baby', 'B', 0.85, -0.3), lean: 14 }, 3, 'in2');
  sfx('swing', TH - 2, { who: 'baby', gain: 0.8 }); sfx('whoosh', TH, { x: 1000, dur: 12, gain: 0.5 });
  HAM.push({ f0: TH, f1: COV, a: (f, S) => { const h = C.baby.big.point(statesAt(TH).baby.st, 'handF'); return h; }, b: 'pink:top', arc: 200 }, { f0: COV, cover: 'pink' });
  sfx('squish', COV, { who: 'pink', gain: 0.8 });
  key('baby', TH + 10, { ...stance('baby', BX, -1), mouth: 'happy with theeth', eyes: 'normal' }, 8);
  sfx('ref:laugh', COV + 2, { who: 'baby', gain: 0.85, pitch: 1.2 });
  chuckle('baby', COV + 2, COV + 36, { mouth: 'happy with theeth' });

  // ---- 12–13.5 с: вслепую — поскальзывается — «пуф»; гамак на траве
  key('pink', COV + 1, { handF: hand('pink', 'F', 0.6, -0.9), handB: hand('pink', 'B', 0.4, -0.9), lean: -6, mouth: 'puzzlement', eyes: 'sad' }, 3);
  sfx('scared', COV + 3, { who: 'pink', gain: 0.6 });
  walk('pink', COV + 4, PX2, PX2 + 130, 1, 10, 1, false);
  const SL = COV + 14;
  const LIE = slip('pink', SL, PX2 + 130, 1, { n: 12, stars: 26 });
  const GX0 = 640, GX1 = 1100;
  HAM.push({ f0: SL + 2, f1: SL + 12, off: 'pink', to: [GX0, GX1] }, { f0: SL + 12, ground: [GX0, GX1] });
  sfx('land', SL + 12, { x: 870, gain: 0.4, pitch: 1.3 });
  const PBX = 520;
  const psm = shrink('pink', LIE + 6, PBX, 1, { mouth: 'puzzlement', eyes: 'sad', smoke: 420 });
  key('pink', psm, { lean: 0, head: 0, hip: [0, 0], legF: null, legB: null, zB: null, rot: 0 }, 0);
  move('pink', psm, { x: PBX, y: GROUND, rot: 0 });
  ev('stars', { who: 'pink', f0: psm + 4, f1: psm + 14, snd: false });
  POSTS.f1 = psm + 30;

  // ---- 13.5–15.8 с: Малыш встаёт на гамак — шарик-Розовая тянет край — он падает — «пуф»
  const BX2 = 960;
  walk('baby', LIE, BX, BX2, 3, 9, -1);
  key('pink', psm + 4, { eyes: 'angry', mouth: 'angry theeth' }, 0);
  hopTo('pink', psm + 6, psm + 15, PBX, GROUND, GX0 - 110, GROUND, 80);
  const BITE = psm + 18;
  key('pink', BITE - 2, { sx: 0.9, sy: 1.1, mouth: 'happy with theeth' }, 2);
  key('pink', BITE, { sx: 1.15, sy: 0.88 }, 1);
  sfx('chomp', BITE, { who: 'pink', gain: 0.8 });
  const YANK = BITE + 6, YD = 330;
  HAM.push({ f0: YANK, f1: YANK + 8, yank: [GX0, GX1], dx: -YD }, { f0: YANK + 8, ground: [GX0 - YD, GX1 - YD] });
  hopTo('pink', YANK, YANK + 10, GX0 - 110, GROUND, GX0 - 110 - YD + 30, GROUND, 60);
  sfx('slide', YANK, { x: 900, gain: 0.8, pitch: 1.2 }); sfx('swing', YANK, { who: 'pink', gain: 0.6 });
  key('baby', YANK - 6, { mouth: 'puzzlement', eyes: 'normal', look: 1 }, 2);
  const LIE2 = slip('baby', YANK + 1, BX2, -1, { n: 12, stars: 26 });
  sfx('ref:laugh', YANK + 12, { who: 'pink', gain: 0.85, pitch: 1.35 });
  laugh('pink', YANK + 12, YANK + 16);
  const BBX = 1240;
  const bsm = shrink('baby', LIE2 + 6, BBX, -1, { mouth: ' 5', eyes: 'sad', smoke: 420 });
  key('baby', bsm, { lean: 0, head: 0, hip: [0, 0], legF: null, legB: null, zB: null, rot: 0 }, 0);
  move('baby', bsm, { x: BBX, y: GROUND, rot: 0 });
  propeller('baby', bsm + 6, bsm + 36, 9);
  move('baby', bsm + 8, { x: BBX, y: GROUND }); move('baby', bsm + 36, { x: BBX + 420, y: -380 }, 'in2');
  sfx('scared', bsm + 8, { who: 'baby', gain: 0.6 });

  // ---- Розовая «растёт» — в центр
  const PX5 = GX0 - 110 - YD + 30;
  const PB2 = transform('pink', YANK + 16, PX5, PX5 + 120, 1, { style: 'grow' });
  key('pink', PB2, stance('pink', PX5 + 120, 1), 0);
  key('pink', PB2 + 4, { mouth: 'happy with theeth' }, 0);
  const WIN = victory('pink', PB2 + 6, PX5 + 120, { n: 9, stride: 150 });
  for (const fn of LATE) fn();
  for (const s of SIT) for (let f = s.f0; f <= Math.min(s.f1, NF - 1); f++) { const p = seat(f); move(s.who, f, { x: p[0] + s.dx, y: p[1] + (s.dy || 0) }, 'lin'); }
  window.T = { IN1, IN2, BNC, PL, PBg, GR, PULL, REL, BACK, SP1, OUTB, BB, UNH, TH, COV, SL, psm, BITE, YANK, bsm, PB2, WIN };
};

// ------------------------------------------------------------------ рисование
function hangPts(f) {
  const m = midAt(f), p0 = [A[0] + 30, A[1] + 30], p2 = [B[0] - 30, B[1] + 30];
  const c = [2 * m[0] - (p0[0] + p2[0]) / 2, 2 * m[1] - (p0[1] + p2[1]) / 2];
  return [p0, c, p2];
}
ST.hooks.beforeChars.push((ctx, f, S, CAM) => {
  ctx.setTransform(...CAM);
  if (f >= POSTS.f0) {
    const g = f < POSTS.f1 ? E.EASE.out2(E.clamp((f - POSTS.f0) / 8, 0, 1)) : 1 - E.clamp((f - POSTS.f1) / 8, 0, 1);
    FX.logPost(ctx, PA, GROUND + 2, PH, 56, g); FX.logPost(ctx, PB, GROUND + 2, PH, 56, g);
  }
  const c = segAt(HAM, f);
  if (c && (c.ground || c.yank)) {
    let x0, x1;
    if (c.ground) [x0, x1] = c.ground;
    else { const u = E.EASE.in2(E.clamp((f - c.f0) / (c.f1 - c.f0), 0, 1)); x0 = c.yank[0] + c.dx * u; x1 = c.yank[1] + c.dx * u; }
    FX.hammock(ctx, null, null, [[x0, GROUND - 10], [(x0 + x1) / 2, GROUND - 16], [x1, GROUND - 10]]);
  }
});
ST.hooks.afterChars.push((ctx, f, S, CAM) => {
  ctx.setTransform(...CAM);
  const c = segAt(HAM, f);
  if (!c) return;
  if (c.hang) FX.hammock(ctx, A, B, hangPts(f));
  else if (c.burrito) {
    const p = target(`${c.burrito}:body`, S), r = E.rad(S[c.burrito].p.rot || 0);
    for (const [lw, col] of [[7, '#111'], [3.5, '#e8d6a8']]) {
      ctx.lineWidth = lw; ctx.strokeStyle = col; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(A[0], A[1]); ctx.lineTo(p[0] - 150, p[1]); ctx.moveTo(B[0], B[1]); ctx.lineTo(p[0] + 150, p[1]); ctx.stroke();
    }
    FX.hammockWrap(ctx, p[0], p[1] + 30, 330, 150, r);
  } else if (c.roll) {
    if (S[c.roll].p.form !== 'big') return;
    const h = C[c.roll].big.point(S[c.roll].st, 'handF'), g = C[c.roll].big.point(S[c.roll].st, 'handB');
    FX.hammockRoll(ctx, (h[0] + g[0]) / 2, (h[1] + g[1]) / 2, 220, 0.2);
  } else if (c.cover) {
    const t = target(`${c.cover}:top`, S);
    FX.hammockSheet(ctx, t[0], t[1] + 30, 320, 420, f / FPS);
  } else if (c.off) {
    const u = E.clamp((f - c.f0) / (c.f1 - c.f0), 0, 1), t = target(`${c.off}:top`, statesAt(c.f0));
    const x = E.lerp(t[0], (c.to[0] + c.to[1]) / 2, u), y = E.lerp(t[1] + 30, GROUND - 60, E.EASE.in2(u));
    FX.hammockSheet(ctx, x, y, E.lerp(320, c.to[1] - c.to[0], u), E.lerp(420, 60, u), f / FPS);
  } else if (c.f1 && !c.yank) {
    const u = E.clamp((f - c.f0) / (c.f1 - c.f0), 0, 1), a = P(c.a, c.f0, statesAt(c.f0)), b = P(c.b, f, S);
    FX.hammockRoll(ctx, E.lerp(a[0], b[0], u), E.lerp(a[1], b[1], u) - Math.sin(Math.PI * u) * c.arc, 220, u * 8);
  }
});

ST.start(BIG);
