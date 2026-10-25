// Ролик 12 (серия по образцу): Сундук-кусака — Малыш против Радужного, 25 с, 24 кадра/с. Плотно, как у HugyTi:
// волшебное золотое яблоко, сундук с зубами кусается, превращения туда и обратно. Музыка превращения —
// присланная, ~4 с с затиханием. Фон «майнкрафт», тема «тёмный лес».
//
//   0–1.8 с   шарик-Малыш (слева), сундук посередине, радужный шарик (справа)
//   1.8–3.9 с Радужный прыгает на сундук — крышка отбрасывает его, из сундука встаёт золотое яблоко;
//             Малыш подлетает на пропеллере, хватает яблоко ртом и глотает
//   3.9–5 с   Малыш «растёт» под музыку
//   5–9.5 с   Радужный прячется в сундук; Малыш заглядывает — из темноты глаза, сундук кусает его за руку
//   9.6–11.3 с Радужный выскакивает из сундука и «растёт» под музыку
//   11.5–14.7 с поднимает сундук и щёлкает им, наступая; сундук кусает Малыша за попу — тот подпрыгивает
//   15–18 с   Малыш дует изо всех сил — ветер вырывает сундук, он падает Радужному на голову и жуёт его;
//             «бульк!» — Радужный сжимается в шарик
//   18.3–20.5 с сундук гонится за шариком-Радужным, оба убегают за кадр
//   20.5–25 с Малыш в центре, руки вверх
'use strict';

const ST = Stage({
  name: 'mc12-chest',
  musicOnce: false,                       // музыка при каждом превращении (как было при рендере)
  cast: {
    baby: { small: ['child-verity-pink', { bodyHeight: 300, spin: { layer: 'hat', cut: 122, axis: 389 } }],
      big: ['child-verity-big', { height: 730, spin: { layer: 'hat', cut: 106, axis: 330 } }], pivot: 338, voice: 1.25,
      lie: 60, color: '#ffd9b8', moods: { angry: ' 2', grin: ' 2', big: 'theeth smile', love: ' 1' } },
    rb: { small: ['skeleton-verity-small', { scale: 0.455, recolor: 'rainbow' }], big: ['all-verity-color', { height: 730 }],
      pivot: 325, voice: 0.85, lie: 55, color: '#ff7a3a', moods: { angry: 'angry theeth', grin: 'happy with theeth', big: 'theeth smile' } },
  },
  order: ['baby', 'rb'],
  background: { theme: 'darkforest', seed: 121, sunX: 1500, sunY: 140 },
  clouds: [[120, 70, 2.4, 0, 12], [640, 200, 1.8, 1, 16], [1150, 60, 2.6, 2, 10], [1700, 250, 1.6, 0, 18], [400, 300, 1.4, 1, 14]],
});
const { FPS, NF, GROUND, C, key, move, ev, sfx, hop, tumble, laugh, transform, shrink, stance, walk, turn,
  victory, chuckle, hand, toRig, statesAt, stateAt, target } = ST;

// рот шарика-Малыша (зубы ' 2')
ST.parts.mouth = (ch, st) => E.apply(ch.eyeMatrix(st, ' 2'), [315, 740]);

function propeller(who, f0, f1, rps = 7, o = {}) {
  key(who, f0, { spin: 0, spinBlur: 0 }, 0);
  key(who, f0 + 8, { spinBlur: 1 }, 8);
  move(who, f1, { spin: rps * (f1 - f0) / 24 }, 'lin');
  key(who, f1, { spinBlur: 0 }, 6);
  key(who, f1 + 1, { spin: 0 }, 0);
  if (o.snd !== false) sfx('whirr', f0, { who, dur: f1 - f0, gain: o.gain ?? 0.4 });
}

// ------------------------------------------------------------------ сундук
const CX = 960, CS = 220;
const CT = new E.Track();                          // x, y (низ), s, lid, rot, sq, glow, eyes, look, dir
const ck = (f, props, n = null, ease = 'io') => CT.add(f, props, ease, n);
ck(0, { x: CX, y: GROUND, s: CS, lid: 0, rot: 0, sq: 1, glow: 0, eyes: 0, look: 0, dir: -1 }, 0);
const CPOS = [{ f0: 0 }];                          // где сундук: {f0} — по ключам x/y | {f0, hand: 'rb'} | {f0, head: 'rb'}
function chomp(f, open = 1, n = 3) {               // пасть: раскрыть и захлопнуть
  ck(f - n, { lid: open }, n, 'out');
  ck(f, { lid: 0 }, 2, 'in2');
  sfx('chomp', f, { x: CX, gain: 0.8 });
}
const RBHEAD = () => { const l = C.rb.big.layers.find((x) => x.name === 'head'); return (l.bbox[3] - l.bbox[1]) * C.rb.big.scale; };
function chestAt(f, S) {
  const p = CT.sample(f, {});
  let m = CPOS[0];
  for (const c of CPOS) if (f >= c.f0) m = c;
  if (m.hand) {
    const a = C.rb.big.point(S.rb.st, 'handF'), b = C.rb.big.point(S.rb.st, 'handB');
    return { ...p, x: (a[0] + b[0]) / 2, y: (a[1] + b[1]) / 2 + p.s * 0.62 };
  }
  if (m.head) { const h = target('rb:head', S); return { ...p, x: h[0], y: h[1] + RBHEAD() * 0.42 }; }
  return p;
}
// золотое яблоко
const GA = [];                                     // {f0, at} | {f0, f1, a, b} | {f0, mouth: 'baby'} | {f0, gone}
const P = (v, f, S) => (typeof v === 'function' ? v(f, S) : typeof v === 'string' ? target(v, S) : v);
function gaAt(f, S) {
  let cur = null;
  for (const c of GA) if (f >= c.f0) cur = c;
  if (!cur || cur.gone) return null;
  if (cur.at) { const p = P(cur.at, f, S); return { x: p[0], y: p[1] + Math.sin(f * 0.35) * 8 }; }
  if (cur.mouth) { const m = target(`${cur.mouth}:mouth`, S); return { x: m[0] + 10, y: m[1] - 6 }; }
  const u = E.EASE[cur.ease || 'out'](E.clamp((f - cur.f0) / (cur.f1 - cur.f0), 0, 1)), a = P(cur.a, cur.f0, statesAt(cur.f0)), b = P(cur.b, f, S);
  return { x: E.lerp(a[0], b[0], u), y: E.lerp(a[1], b[1], u) };
}

const BS = 470, RS = 1450;
// ================================================================== 0–1.8 с: стойка
key('baby', 0, { form: 'small', x: BS, y: GROUND, face: 1, look: 1, eyes: 'normal', mouth: ' 6', sx: 1, sy: 1, rot: 0, pivot: 0, alpha: 1 }, 0);
key('rb', 0, { form: 'small', x: RS, y: GROUND, face: -1, look: 1, eyes: 'normal', mouth: 'smile normal', sx: 1, sy: 1, rot: 0, pivot: 0, alpha: 1 }, 0);

const BIG = () => {
  // ---- 1.8–3.9 с: Радужный прыгает на сундук — крышка отбрасывает его; золотое яблоко; Малыш хватает его
  key('rb', 34, { mouth: 'happy with theeth', eyes: 'normal' }, 0);
  hop('rb', 36, 46, RS, 1190, 90);
  const ON = 56, TOPY = GROUND - CS * 0.88;
  key('rb', 48, { sx: 1.2, sy: 0.82 }, 3);
  move('rb', 48, { x: 1190, y: GROUND });
  key('rb', 50, { sx: 0.86, sy: 1.16 }, 2);
  move('rb', 52, { y: GROUND - 330 }, 'out2');
  move('rb', ON, { y: TOPY }, 'in2');
  move('rb', ON, { x: CX + 20 }, 'lin');
  key('rb', 52, { sx: 1, sy: 1 }, 3);
  key('rb', ON, { sx: 1.25, sy: 0.8 }, 1);
  sfx('jump', 50, { who: 'rb', gain: 0.5 });
  sfx('land', ON, { x: CX, gain: 0.6 });
  ck(ON, { sq: 0.82 }, 1);
  ck(ON + 3, { sq: 1 }, 3);
  // крышка распахивается и отбрасывает его
  const OPEN = ON + 3;
  ck(OPEN, { lid: 0 }, 0);
  ck(OPEN + 3, { lid: 1.9, glow: 1 }, 3, 'out');
  sfx('spring', OPEN, { x: CX, gain: 0.9 });
  sfx('creak', OPEN + 1, { x: CX, gain: 0.6 });
  sfx('sparkle', OPEN + 3, { x: CX, gain: 0.8 });
  tumble('rb', OPEN, OPEN + 14, CX + 20, 1260, 170, -1, { stars: 0 });
  move('rb', OPEN, { y: TOPY });
  key('rb', OPEN, { mouth: 'puzzlement', eyes: 'sad' }, 0);
  GA.push({ f0: OPEN + 3, f1: OPEN + 15, a: [CX, GROUND - CS * 0.7], b: [CX, GROUND - 360] });
  GA.push({ f0: OPEN + 15, at: [CX, GROUND - 360] });
  ev('twinkle', { f: OPEN + 8, at: [CX - 60, GROUND - 400], n: 14, size: 40 });
  ev('twinkle', { f: OPEN + 12, at: [CX + 70, GROUND - 320], n: 14, size: 40 });
  // Малыш на пропеллере
  key('baby', 40, { eyes: 'angry', mouth: ' 2' }, 0);
  const SN = OPEN + 16;
  propeller('baby', 40, SN + 20, 9);
  move('baby', 48, { x: BS, y: GROUND });
  move('baby', 58, { x: 640, y: GROUND - 160 }, 'out2');
  const S1 = stateAt(1), dMouth = target('baby:mouth', S1)[1] - GROUND, dxM = target('baby:mouth', S1)[0] - BS;
  move('baby', SN, { x: CX - dxM - 10, y: GROUND - 360 - dMouth + 6 }, 'io');
  GA.push({ f0: SN, mouth: 'baby' });
  sfx('chomp', SN, { who: 'baby', gain: 0.9 });
  key('baby', SN, { mouth: ' 2', sx: 1.1, sy: 0.92 }, 1);
  key('baby', SN + 4, { sx: 1, sy: 1 }, 3);
  const GULP = SN + 5;
  GA.push({ f0: GULP, gone: true });
  sfx('gulp', GULP, { who: 'baby', gain: 1.0 });
  key('baby', GULP, { mouth: ' 4', eyes: 'normal' }, 0);
  ck(SN + 2, { glow: 0 }, 6);
  chomp(SN + 8, 1.9, 1);                                          // пустой сундук захлопнулся
  const BX = 600, LAND = SN + 18;
  move('baby', LAND - 6, { x: 680, y: GROUND - 60 }, 'io');
  move('baby', LAND, { x: 650, y: GROUND }, 'in2');
  key('baby', LAND, { sx: 1.2, sy: 0.82 }, 1);
  key('baby', LAND + 4, { sx: 1, sy: 1 }, 3);
  sfx('land', LAND, { who: 'baby', gain: 0.5 });
  sfx('burp', LAND + 1, { who: 'baby', gain: 0.8, pitch: 1.3 });
  ev('twinkle', { f: LAND + 1, at: [650, GROUND - 330], n: 18, size: 44 });
  key('rb', SN + 2, { mouth: 'puzzlement', eyes: 'sad' }, 0);
  key('rb', LAND, { mouth: 'angry theeth', eyes: 'angry' }, 0);

  // ---- 3.9–5 с: Малыш «растёт»
  const BB = transform('baby', LAND + 2, 650, BX, 1, { style: 'grow' });
  key('baby', BB, stance('baby', BX, 1), 0);
  key('baby', BB + 6, { mouth: 'happy with theeth', eyes: 'normal' }, 0);
  key('rb', BB - 2, { mouth: 'puzzlement', eyes: 'sad' }, 0);
  ev('sweat', { who: 'rb', f0: BB, f1: BB + 20 });

  // ---- 5–9.5 с: Радужный прячется в сундук; Малыш заглядывает — укус за руку
  const H0 = BB + 6;
  key('rb', H0, { mouth: 'happy with theeth', eyes: 'angry' }, 0);
  hop('rb', H0 + 2, H0 + 12, 1260, CX + 170, 60);
  ck(H0 + 10, { lid: 1.2 }, 4, 'out');
  sfx('creak', H0 + 10, { x: CX, gain: 0.6 });
  const IN = H0 + 22;
  key('rb', H0 + 14, { sx: 1.2, sy: 0.82 }, 2);
  move('rb', H0 + 14, { x: CX + 170, y: GROUND });
  move('rb', H0 + 18, { y: GROUND - 300 }, 'out2');
  move('rb', IN, { x: CX + 10, y: GROUND - 60 }, 'in2');
  key('rb', H0 + 18, { sx: 1, sy: 1 }, 3);
  key('rb', IN, { sx: 0.55, sy: 0.55 }, 4);
  key('rb', IN + 1, { alpha: 0 }, 0);
  sfx('jump', H0 + 16, { who: 'rb', gain: 0.5 });
  chomp(IN + 3, 1.2, 1);
  ck(IN + 4, { sq: 1.15 }, 1); ck(IN + 8, { sq: 0.9 }, 3); ck(IN + 12, { sq: 1 }, 3);
  sfx('ref:laugh', IN + 8, { x: CX, gain: 0.45, pitch: 1.1 });
  key('baby', IN, { mouth: 'puzzlement', eyes: 'normal' }, 0);
  const BX1 = 740;
  walk('baby', IN + 8, BX, BX1, 2, 9, 1);
  const RE = IN + 30, lidFront = [CX - CS / 2 + 14, GROUND - CS * 0.6 - 10];
  key('baby', RE - 8, { lean: 18, hip: [0, toRig('baby', 60)], head: 8 }, 8);
  key('baby', RE, { hitF: 1, hitFto: lidFront }, 6);
  ck(RE + 2, { lid: 0.35, eyes: 1, look: -1 }, 3);
  ck(RE + 2, { eyes: 1 }, 0);
  sfx('creak', RE + 1, { x: CX, gain: 0.6 });
  key('baby', RE + 4, { mouth: 'puzzlement', eyes: 'sad' }, 0);
  key('baby', RE + 9, { hitF: 1, hitFto: [CX - CS / 2 + 60, GROUND - CS * 0.6 - 2] }, 4);   // тянется внутрь
  const BITE = RE + 12;
  chomp(BITE, 1.1, 3);
  ck(BITE, { eyes: 0 }, 0);
  sfx('ref:hit-ow', BITE + 1, { who: 'baby', gain: 0.9, pitch: 1.25 });
  ev('stars', { who: 'baby', f0: BITE + 2, f1: BITE + 14, snd: false });
  key('baby', BITE, { hitFfix: BITE, mouth: 'angry theeth', eyes: 'sad', lean: -6 }, 2);
  for (let i = 0; i < 3; i++) {                                   // тянет руку, сундук прыгает
    ck(BITE + 3 + i * 4, { y: GROUND - 12, rot: -0.06 }, 2);
    ck(BITE + 5 + i * 4, { y: GROUND, rot: 0 }, 2);
    key('baby', BITE + 3 + i * 4, { lean: -14 }, 2);
    key('baby', BITE + 5 + i * 4, { lean: -6 }, 2);
  }
  const FREE = BITE + 16;
  key('baby', FREE, { hitF: 0, handF: hand('baby', 'F', 0.35, -0.7), lean: -10, head: -6, mouth: 'sad' }, 3);
  move('baby', FREE, { x: BX1 });
  move('baby', FREE + 8, { x: BX1 - 70 }, 'out2');
  key('baby', FREE + 8, { ...stance('baby', BX1 - 70, 1), handF: hand('baby', 'F', 0.45, -0.85), head: 0, mouth: 'sad', eyes: 'sad' }, 6);
  ev('tears', { who: 'baby', f0: FREE + 2, f1: FREE + 30 });
  for (let i = 0; i < 3; i++) {                                  // трясёт укушенной рукой
    key('baby', FREE + 10 + i * 6, { handF: hand('baby', 'F', 0.6, -0.75) }, 3);
    key('baby', FREE + 13 + i * 6, { handF: hand('baby', 'F', 0.4, -0.9) }, 3);
  }
  key('baby', FREE + 30, { handF: stance('baby', BX1 - 70, 1).handF, mouth: 'puzzlement' }, 6);
  // сундук хохочет
  for (let i = 0; i < 4; i++) { ck(FREE + 4 + i * 5, { lid: 0.3, eyes: 1, look: -1 }, 2); ck(FREE + 6 + i * 5, { lid: 0.05 }, 2); }
  ck(FREE + 24, { lid: 0, eyes: 0 }, 2);
  sfx('ref:laugh', FREE + 4, { x: CX, gain: 0.6, pitch: 1.15 });

  // ---- 9.6–11.3 с: Радужный выскакивает из сундука и «растёт»
  const OUT = FREE + 30, RX = 1200;
  ck(OUT, { lid: 1.7 }, 3, 'out');
  sfx('spring', OUT, { x: CX, gain: 0.8 });
  key('rb', OUT, { alpha: 1, x: CX + 10, y: GROUND - 60, sx: 0.55, sy: 0.55, rot: 0, mouth: 'happy with theeth', eyes: 'angry' }, 0);
  move('rb', OUT, { x: CX + 10, y: GROUND - 60 });
  move('rb', OUT + 5, { y: GROUND - 280 }, 'out2');
  move('rb', OUT + 11, { x: 1230, y: GROUND }, 'in2');
  key('rb', OUT + 6, { sx: 1, sy: 1 }, 5);
  key('rb', OUT + 11, { sx: 1.2, sy: 0.82 }, 1);
  key('rb', OUT + 15, { sx: 1, sy: 1 }, 3);
  sfx('land', OUT + 11, { who: 'rb', gain: 0.5 });
  ck(OUT + 10, { lid: 0 }, 3, 'in2');
  sfx('chomp', OUT + 10, { x: CX, gain: 0.6 });
  key('baby', OUT + 2, { mouth: 'puzzlement', eyes: 'sad' }, 0);
  const RB = transform('rb', OUT + 14, 1230, RX, -1, { style: 'grow' });
  key('rb', RB, stance('rb', RX, -1), 0);
  key('rb', RB + 6, { mouth: 'happy with theeth', eyes: 'angry' }, 0);
  const BX2 = BX1 - 70;

  // ---- 11.5–14.7 с: поднимает сундук и щёлкает им — укус за попу
  const PU = RB + 10;
  key('rb', PU - 8, { lean: 24, hip: [0, toRig('rb', 110)], head: 8 }, 8);
  key('rb', PU, { hitF: 1, hitFto: [CX + 30, GROUND - CS * 0.62], hitB: 1, hitBto: [CX + CS / 2 - 10, GROUND - CS * 0.62], hitFfix: PU, hitBfix: PU }, 6);
  sfx('pop', PU, { who: 'rb', gain: 0.4 });
  const HOLD = PU + 12;
  key('rb', HOLD, { ...stance('rb', RX, -1), hitF: 0, hitB: 0, handF: hand('rb', 'F', 0.9, 0.2), handB: hand('rb', 'B', 0.75, 0.25), mouth: 'happy with theeth' }, 10);
  CPOS.push({ f0: PU, hand: 'rb' });
  ck(PU, { dir: -1 }, 0);
  const RX2 = 1010;
  walk('rb', HOLD + 2, RX, RX2, 2, 10, -1, false);
  for (const c of [HOLD + 4, HOLD + 11, HOLD + 18, HOLD + 25]) chomp(c, 1.1, 3);
  key('baby', HOLD, { mouth: 'puzzlement', eyes: 'sad', handF: hand('baby', 'F', 0.6, -0.75), handB: hand('baby', 'B', 0.25, -0.85), lean: -8 }, 6);
  sfx('scared', HOLD + 2, { who: 'baby', gain: 0.8 });
  const BX3 = 560;
  turn('baby', HOLD + 14, -1, BX2);
  walk('baby', HOLD + 16, BX2, BX3, 2, 8, -1);
  const BUTT = HOLD + 34;
  key('rb', BUTT - 4, { lean: -16, hip: [0, toRig('rb', 30)], handF: hand('rb', 'F', 1.0, 0.15), handB: hand('rb', 'B', 0.85, 0.2) }, 4, 'in2');
  chomp(BUTT, 1.3, 3);
  key('rb', BUTT + 8, { lean: 0, hip: [0, 8], handF: hand('rb', 'F', 0.9, 0.2), handB: hand('rb', 'B', 0.75, 0.25) }, 8);
  sfx('ref:hit-ow', BUTT + 1, { who: 'baby', gain: 1.0, pitch: 1.3 });
  key('baby', BUTT, { handF: hand('baby', 'F', -0.45, 0.25), handB: hand('baby', 'B', -0.4, 0.3), mouth: 'puzzlement', eyes: 'sad', head: -10, lean: 8 }, 2);
  move('baby', BUTT, { x: BX3, y: GROUND });
  move('baby', BUTT + 8, { x: BX3 - 60, y: GROUND - 110 }, 'out2');
  move('baby', BUTT + 16, { x: BX3 - 90, y: GROUND }, 'in2');
  key('baby', BUTT + 1, { legFfk: 1, legBfk: 1, legF: [-20, 40], legB: [20, -30] }, 2);
  key('baby', BUTT + 16, { ...stance('baby', BX3 - 90, -1), handF: hand('baby', 'F', -0.45, 0.25), handB: hand('baby', 'B', -0.4, 0.3), head: 0, lean: 0 }, 3);
  ev('stars', { who: 'baby', f0: BUTT + 2, f1: BUTT + 16, snd: false });
  sfx('scared', BUTT + 3, { who: 'baby', gain: 0.7 });
  ev('dust', { f: BUTT + 16, x: BX3 - 90, r: 40, n: 5, snd: 'land' });
  key('rb', BUTT + 6, { mouth: 'happy with theeth', eyes: 'normal' }, 0);
  sfx('ref:laugh', BUTT + 8, { who: 'rb', gain: 0.85, pitch: 1.0 });
  chuckle('rb', BUTT + 8, BUTT + 30, { mouth: 'happy with theeth' });
  for (let i = 0; i < 4; i++) { ck(BUTT + 8 + i * 5, { lid: 0.35 }, 2); ck(BUTT + 10 + i * 5, { lid: 0.05 }, 2); }
  ck(BUTT + 30, { lid: 0 }, 2);

  // ---- 15–18 с: Малыш дует — ветер вырывает сундук, тот падает Радужному на голову и жуёт; Радужный сжимается
  const BX4 = BX3 - 90;
  turn('baby', BUTT + 22, 1, BX4);
  key('baby', BUTT + 24, { ...stance('baby', BX4, 1), mouth: 'angry theeth', eyes: 'angry' }, 4);
  ev('vein', { who: 'baby', f0: BUTT + 24, f1: BUTT + 36 });
  const INH = BUTT + 34, BLOW = INH + 10;
  key('baby', INH, { lean: -12, head: -10, sx: 1.04, sy: 0.98, mouth: 'puzzlement', handF: hand('baby', 'F', 0.2, -0.3), handB: hand('baby', 'B', -0.3, -0.2) }, 8);
  sfx('suck', INH - 6, { who: 'baby', dur: 10, gain: 0.6 });
  key('baby', BLOW, { lean: 14, head: 8, sx: 1, sy: 1, mouth: 'puzzlement', handF: hand('baby', 'F', -0.2, 0.2), handB: hand('baby', 'B', -0.5, 0.1) }, 3, 'in2');
  key('baby', BLOW + 30, { ...stance('baby', BX4, 1), mouth: 'happy with theeth', eyes: 'angry' }, 8);
  ev('wind', { f0: BLOW, f1: BLOW + 30, x0: BX4 + 120, x1: 1900, snd: false });
  sfx('gust', BLOW, { who: 'baby', dur: 30, gain: 1.0 });
  key('rb', BLOW + 2, { mouth: 'puzzlement', eyes: 'sad', lean: -14, head: -10 }, 4);
  // сундук вырывается и летит вверх
  const RIP = BLOW + 6, FALL = RIP + 12, HEAD = FALL + 8;
  CPOS.push({ f0: RIP });
  const c0 = chestAt(RIP, stateAt(RIP));
  ck(RIP, { x: c0.x, y: c0.y, rot: 0 }, 0);
  ck(FALL, { x: RX2 + 40, y: GROUND - 900, rot: Math.PI * 2, lid: 1.5 }, 12, 'out2');
  sfx('whoosh', RIP, { x: RX2, dur: 12, gain: 0.7 });
  key('rb', RIP, { hitF: 0, hitB: 0, handF: hand('rb', 'F', 0.5, -0.5), handB: hand('rb', 'B', 0.4, -0.6) }, 4);
  key('rb', FALL - 4, { head: -16, mouth: 'puzzlement' }, 6);
  const hh = target('rb:head', stateAt(HEAD)), yH = hh[1] + RBHEAD() * 0.42;
  ck(FALL + 1, { x: RX2 + 40, y: GROUND - 900, rot: Math.PI * 2, s: CS }, 0);
  ck(HEAD, { x: hh[0], y: yH, s: 300 }, 7, 'in2');
  CPOS.push({ f0: HEAD, head: 'rb' });
  ck(HEAD, { rot: 0, lid: 1.5 }, 0);
  chomp(HEAD + 2, 1.5, 2);
  sfx('bonk', HEAD, { who: 'rb', gain: 0.8 });
  ev('shake', { f: HEAD, amp: 8, n: 6 });
  // жуёт: Радужный машет руками
  for (let i = 0; i < 3; i++) {
    const f = HEAD + 6 + i * 8;
    key('rb', f, { handF: hand('rb', 'F', 0.4, -0.95), handB: hand('rb', 'B', -0.3, -0.7), lean: 6 }, 3);
    key('rb', f + 4, { handF: hand('rb', 'F', 0.7, -0.6), handB: hand('rb', 'B', -0.1, -0.95), lean: -6 }, 3);
    chomp(f + 4, 0.35, 2);
    sfx('ref:grunt', f + 1, { who: 'rb', gain: 0.5, pitch: 0.8 });
  }
  key('baby', HEAD + 4, { mouth: 'happy with theeth', eyes: 'normal' }, 0);
  sfx('ref:laugh', HEAD + 6, { who: 'baby', gain: 0.85, pitch: 1.25 });
  chuckle('baby', HEAD + 6, HEAD + 30, { mouth: 'happy with theeth' });
  const BURP = HEAD + 32;
  sfx('burp', BURP - 2, { x: RX2, gain: 1.0, pitch: 0.8 });
  ck(BURP - 2, { lid: 0.6 }, 2);
  const sm = shrink('rb', BURP, RX2, -1, { mouth: 'puzzlement', eyes: 'sad', smoke: 380 });
  key('rb', sm, { lean: 0, head: 0, hip: [0, 0] }, 0);
  CPOS.push({ f0: sm });
  const c1 = chestAt(sm - 1, stateAt(sm - 1)), CX2 = 840;
  ck(sm, { x: c1.x, y: c1.y, s: 300, lid: 0.6, rot: 0 }, 0);
  ck(sm + 5, { y: c1.y - 160 }, 5, 'out2');
  ck(sm + 12, { y: GROUND }, 7, 'in2');
  ck(sm + 12, { x: CX2, s: CS, lid: 0, rot: -Math.PI * 2 }, 12, 'lin');
  ck(sm + 13, { sq: 0.8 }, 1); ck(sm + 17, { sq: 1.06 }, 3); ck(sm + 21, { sq: 1 }, 3);
  sfx('land', sm + 12, { x: CX2, gain: 0.8 });
  ev('stars', { who: 'rb', f0: sm + 6, f1: sm + 26 });

  // ---- 18.3–20.5 с: сундук гонится за шариком-Радужным — оба за кадр
  const CH = sm + 26;
  ck(CH, { dir: 1, eyes: 1, look: 1 }, 0);
  chomp(CH + 3, 1.1, 3);
  key('rb', CH, { mouth: 'puzzlement', eyes: 'sad' }, 0);
  ev('sweat', { who: 'rb', f0: CH, f1: CH + 40 });
  sfx('scared', CH + 2, { who: 'rb', gain: 0.8 });
  let rx = RX2, cx = CX2;
  const steps = [[CH + 6, 1300, 1150], [CH + 20, 1620, 1480], [CH + 34, 2300, 1820], [CH + 48, 2400, 2300]];
  for (const [f, rTo, cTo] of steps) {
    if (rx < 2300) hop('rb', f, f + 12, rx, rTo, 110);
    // сундук прыгает следом, щёлкая пастью
    ck(f + 2, { x: cx, y: GROUND, sq: 0.86 }, 2);
    ck(f + 8, { y: GROUND - 140, sq: 1.08, lid: 1.0 }, 6, 'out2');
    ck(f + 14, { y: GROUND, sq: 1, lid: 0 }, 6, 'in2');
    ck(f + 14, { x: cTo }, 12, 'lin');
    sfx('chomp', f + 14, { x: cTo, gain: 0.7 });
    rx = rTo; cx = cTo;
  }
  key('baby', CH + 4, { mouth: 'happy with theeth', eyes: 'normal' }, 0);
  sfx('ref:laugh', CH + 10, { who: 'baby', gain: 0.85, pitch: 1.25 });
  chuckle('baby', CH + 10, CH + 30, { mouth: 'happy with theeth' });
  const WIN = victory('baby', CH + 30, BX4, { n: 9, stride: 110 });
  window.T = { SN, LAND, BB, IN, BITE, OUT, RB, HOLD, BUTT, BLOW, HEAD, BURP, CH, WIN };
};

ST.hooks.afterChars.push((ctx, f, S, CAM) => {
  ctx.setTransform(...CAM);
  const ga = gaAt(f, S);
  if (ga) FX.apple(ctx, ga.x, ga.y, 36, Math.sin(f * 0.2) * 0.15, true);
  const c = chestAt(f, S);
  FX.mcChest(ctx, c.x, c.y, c.s, Math.max(0, c.lid), { dir: c.dir >= 0 ? 1 : -1, eyes: c.eyes > 0.5, look: c.look, glow: c.glow, rot: c.rot, sq: c.sq, t: f / FPS });
});

ST.start(BIG);
