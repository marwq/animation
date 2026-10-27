// Серия 2, ролик 15: Ловушка — Розовая (слева) против Радужного (справа), 22 с, 24 кадра/с. Драка без ударов:
// ящик из досок на палочке, под ним печенька из майнкрафта, от палочки ниточка — у Радужного в зубах.
// Музыка превращения — один раз. Фон — вишнёвый сад.
//
//   0–2 с     шарик-Розовая и радужный шарик неподвижно стоят друг напротив друга, середина пустая
//   2–4 с     Радужный ставит ловушку; Розовая прыгает за печенькой — дёрг — ящик захлопывается; он садится сверху
//   4–5.2 с   Розовая «растёт» под музыку прямо в ящике — ящик разлетается досками, Радужный влюблён
//   5.4–8.4 с с неба падает второй ящик — она ловит и накрывает влюблённого Радужного
//   8.4–12 с  Радужный «растёт» в ящике — доска летит ей в голову — она шатается, наступает на палочку — падает — «пуф»
//   12–16.6 с шарик-Розовая кусает его за палец ноги — он скачет на одной ноге, спотыкается о доску — «пуф»;
//             шарик-Радужный удирает — третий ящик с неба накрывает его
//   16.6–22 с Розовая «растёт» и в центре, руки вверх
'use strict';

const ST = Stage({
  name: '15 Розовая vs Радужный',
  frames: 528,
  cast: {
    pink: { small: ['girl-verity-small', { bodyHeight: 300 }], big: ['girl-verity-big', { height: 730, splitFeet: true }],
      pivot: 337, voice: 1.35, vAngle: 50, lie: 55, color: '#ff4fc8', moods: { angry: 'angry theeth', grin: 'theeth smile', big: 'theeth smile' } },
    rb: { small: ['skeleton-verity-small', { scale: 0.455, recolor: 'rainbow' }], big: ['all-verity-color', { height: 730 }],
      pivot: 325, voice: 0.85, lie: 55, color: '#ff7a3a', moods: { angry: 'angry theeth', grin: 'happy with theeth', big: 'theeth smile', love: 'happy - spittle' } },
  },
  order: ['pink', 'rb'],
  background: { theme: 'cherry', seed: 1015, sunX: 1500, sunY: 130 },
  clouds: [[150, 80, 2.4, 0, 12], [700, 220, 1.8, 1, 16], [1150, 70, 2.6, 2, 10], [1720, 250, 1.5, 0, 18]],
});
const { FPS, NF, GROUND, C, key, move, ev, sfx, hop, laugh, tremble, transform, shrink, stance, walk,
  slip, fallBack, victory, chuckle, hand, statesAt, target } = ST;
const P = (v, f, S) => (typeof v === 'function' ? v(f, S) : typeof v === 'string' ? target(v, S) : v);

// ------------------------------------------------------------------ ящики, палочка, печенька, доски
const CS = 340, BX = 900, TILT = -0.42;
const CX1 = BX - CS / 2 + CS * Math.cos(TILT), CY1 = GROUND + CS * Math.sin(TILT);     // приподнятый угол ящика
// сегменты: {f0, at:[x,y], rot, px} | {f0, f1, a, b, arc, spin, ease, rot0, rot1, px} | {f0, hand} | {f0, lift, x} | {f0, jit, at} | {f0, gone}
const BOXES = [[], [], []];
const STICK = [];         // палочка: центр, угол, длина 150
const COOKIE = [];        // печенька
const PLANKS = [];        // доски: [{segs}]
const BURST = [];         // {f, at}
let STRING = null;        // {f0, f1} — ниточка от палочки ко рту Радужного
function propAt(segs, f, S) {
  let c = null;
  for (const s of segs) if (f >= s.f0) c = s;
  if (!c || c.gone) return null;
  if (c.at) {
    if (c.jit && f < c.f0 + c.jit) { const r = FX.rng(f * 7 + 3); return { x: c.at[0] + (r() - 0.5) * 10, y: c.at[1], rot: (c.rot || 0) + (r() - 0.5) * 0.06, px: c.px || 0 }; }
    return { x: c.at[0], y: c.at[1], rot: c.rot || 0, px: c.px || 0 };
  }
  if (c.hand) {
    if (S[c.hand].p.form !== 'big') return null;
    const h = C[c.hand].big.point(S[c.hand].st, 'handF'), g = C[c.hand].big.point(S[c.hand].st, 'handB');
    return { x: (h[0] + g[0]) / 2 + (c.dx || 0), y: Math.max(h[1], g[1]) + (c.dy || 0), rot: 0, px: 0 };
  }
  if (c.lift) return { x: c.x, y: S[c.lift].p.y + (c.dy || 0), rot: 0, px: 0 };
  const u = E.clamp((f - c.f0) / (c.f1 - c.f0), 0, 1), e = c.ease ? E.EASE[c.ease](u) : u, a = P(c.a, c.f0, statesAt(c.f0)), b = P(c.b, f, S);
  return { x: E.lerp(a[0], b[0], e), y: E.lerp(a[1], b[1], e) - Math.sin(Math.PI * u) * (c.arc || 0),
    rot: c.rot1 !== undefined ? E.lerp(c.rot0, c.rot1, e) : u * (c.spin || 0), px: c.px || 0 };
}
const boxAt = (i, f) => propAt(BOXES[i], f, statesAt(f));
function burst(i, f, at) {
  BOXES[i].push({ f0: f, gone: true });
  BURST.push({ f, at });
  sfx('crunch', f, { x: at[0], gain: 0.9 }); sfx('explode', f, { x: at[0], gain: 0.35 });
  ev('shake', { f, amp: 12, n: 8 });
}
// шум в закрытом ящике: дрожит, глухие удары
function rattle(i, f0, f1, x) {
  BOXES[i].push({ f0, at: [x, GROUND], jit: f1 - f0 });
  for (let f = f0 + 2; f < f1; f += 7) sfx('bonk', f, { x, gain: 0.35, pitch: 0.7 });
}
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

const PX0 = 560, RX0 = 1360;
// ================================================================== 0–2 с: неподвижная стойка
key('pink', 0, { form: 'small', x: PX0, y: GROUND, face: 1, look: 1, eyes: 'normal', mouth: 'smile normal', sx: 1, sy: 1, rot: 0, pivot: 0, alpha: 1 }, 0);
key('rb', 0, { form: 'small', x: RX0, y: GROUND, face: -1, look: 1, eyes: 'normal', mouth: 'smile normal', sx: 1, sy: 1, rot: 0, pivot: 0, alpha: 1 }, 0);

const BIG = () => {
  // ---- 2–4 с: Радужный ставит ловушку — Розовая за печенькой — дёрг — ящик захлопывается
  const SET = 50;
  key('rb', 48, { mouth: 'happy with theeth', eyes: 'angry' }, 0);
  sfx('ref:grin-eee', 48, { who: 'rb', gain: 0.4, pitch: 0.9 });
  ev('smoke', { f: SET, who: 'rb', size: 320, dx: BX - RX0, y: GROUND - 120 });
  sfx('poof', SET, { x: BX, gain: 0.6 }); sfx('pop', SET + 3, { x: BX, gain: 0.6 });
  BOXES[0].push({ f0: SET + 3, at: [BX - CS / 2, GROUND], rot: TILT, px: -CS / 2 });
  STICK.push({ f0: SET + 3, at: [CX1, (GROUND + CY1) / 2], rot: -Math.PI / 2 });
  COOKIE.push({ f0: SET + 3, at: [BX + 50, GROUND - 30] });
  STRING = { f0: SET + 3, f1: 0 };
  ev('twinkle', { f: SET + 6, at: [BX + 50, GROUND - 40], n: 14, size: 40 });
  key('pink', SET + 6, { mouth: 'happy - spittle', eyes: 'normal' }, 0);
  ev('drool', { f: SET + 8, at: 'pink:lips', n: 18 });
  sfx('ref:grin-eee', SET + 8, { who: 'pink', gain: 0.3, pitch: 1.5 });
  const JMP = SET + 15, IN = JMP + 10, YANK = JMP + 6;
  hopTo('pink', JMP, IN, PX0, GROUND, BX, GROUND, 150);
  // дёрг!
  hopTo('rb', YANK, YANK + 8, RX0, GROUND, RX0 + 90, GROUND, 40);
  STRING.f1 = YANK + 4;
  sfx('flick', YANK, { who: 'rb', gain: 0.8 });
  STICK.push({ f0: YANK + 1, f1: YANK + 13, a: [CX1, (GROUND + CY1) / 2], b: [CX1 + 60, GROUND - 10], arc: 120, spin: 3 * Math.PI + Math.PI / 2 },
    { f0: YANK + 13, at: [CX1 + 60, GROUND - 10], rot: 0 });
  sfx('land', YANK + 13, { x: CX1 + 60, gain: 0.3, pitch: 1.4 });
  BOXES[0].push({ f0: YANK + 1, f1: YANK + 5, a: [BX - CS / 2, GROUND], b: [BX - CS / 2, GROUND], rot0: TILT, rot1: 0, px: -CS / 2, ease: 'in2' });
  const SHUT = YANK + 5;
  BOXES[0].push({ f0: SHUT, at: [BX, GROUND] });
  COOKIE.push({ f0: SHUT, gone: true });
  sfx('slam', SHUT, { x: BX, gain: 1.0 }); ev('shake', { f: SHUT, amp: 14, n: 8 }); ev('dust', { f: SHUT, x: BX, r: 110, n: 8, snd: false });
  rattle(0, SHUT + 4, SHUT + 20, BX);
  key('rb', SHUT + 2, { mouth: 'happy with theeth', eyes: 'normal' }, 0);
  sfx('ref:laugh', SHUT + 2, { who: 'rb', gain: 0.85, pitch: 0.9 });
  laugh('rb', SHUT + 4, SHUT + 12);
  // садится сверху
  const ON = SHUT + 16;
  hopTo('rb', SHUT + 6, ON, RX0 + 90, GROUND, BX, GROUND - CS, 120);
  key('rb', ON + 2, { mouth: 'happy with theeth' }, 0);
  laugh('rb', ON + 4, ON + 16);

  // ---- 4–5.2 с: Розовая «растёт» в ящике — ящик разлетается, Радужный влюблён
  const TF = SHUT + 18;
  key('pink', TF, { eyes: 'angry', mouth: 'angry theeth' }, 0);
  const PB = transform('pink', TF, BX, BX, 1, { style: 'grow', love: 'rb', loveDur: 50 });
  BOXES[0].push({ f0: TF + 21, lift: 'pink', x: BX });
  move('rb', TF + 21, { x: BX, y: GROUND - CS });
  move('rb', PB, { x: BX, y: GROUND - CS - 150 }, 'out2');
  burst(0, PB, [BX, GROUND - CS / 2 - 150]);
  key('pink', PB, stance('pink', BX, 1), 0);
  const RX1 = 1600;
  key('rb', PB, { pivot: ST.CAST.rb.pivot }, 0);
  move('rb', PB, { rot: 0 });
  move('rb', PB + 8, { y: GROUND - CS - 200 }, 'out2');
  move('rb', PB + 18, { y: GROUND }, 'in2');
  move('rb', PB + 18, { x: RX1, rot: 360 }, 'lin');
  key('rb', PB + 19, { rot: 0, pivot: 0 }, 0);
  key('rb', PB + 18, { sx: 1.3, sy: 0.72 }, 1); key('rb', PB + 22, { sx: 0.95, sy: 1.06 }, 3); key('rb', PB + 26, { sx: 1, sy: 1 }, 3);
  sfx('whoosh', PB, { who: 'rb', dur: 12, gain: 0.5 }); sfx('land', PB + 18, { who: 'rb', gain: 0.7 });
  ev('dust', { f: PB + 18, x: RX1, r: 40, n: 5, snd: false });
  key('pink', PB + 8, { mouth: 'theeth smile', eyes: 'normal' }, 0);
  PLANKS.push({ segs: [{ f0: PB, f1: PB + 16, a: [BX + 100, GROUND - 400], b: [1250, GROUND - 14], arc: 240, spin: 7.2 }, { f0: PB + 16, at: [1250, GROUND - 14], rot: 0.06 }] });
  sfx('land', PB + 16, { x: 1250, gain: 0.4, pitch: 1.3 });

  // ---- 5.4–8.4 с: второй ящик с неба — ловит — накрывает влюблённого Радужного
  const RX2 = 1420;
  hop('rb', PB + 24, PB + 32, RX1, RX2, 70);
  ev('hearts', { who: 'rb', f0: PB + 30, f1: PB + 56, snd: false });
  const DROP = PB + 26, CATCH = DROP + 10;
  key('pink', DROP, { look: 1, head: -14, mouth: 'puzzlement' }, 4);
  BOXES[1].push({ f0: DROP, f1: CATCH, a: [BX + 150, -CS - 20], b: (f, S) => { const h = C.pink.big.point(S.pink.st, 'handF'), g = C.pink.big.point(S.pink.st, 'handB'); return [(h[0] + g[0]) / 2 + 130, Math.max(h[1], g[1]) + 40]; }, ease: 'in2' },
    { f0: CATCH, hand: 'pink', dx: 130, dy: 40 });
  sfx('whoosh', DROP, { x: BX, dur: 10, gain: 0.5 });
  key('pink', CATCH - 2, { handF: hand('pink', 'F', 0.75, 0.65), handB: hand('pink', 'B', 0.6, 0.7), lean: 6, head: -4 }, 6);
  key('pink', CATCH + 2, { hip: [0, 40], lean: 10 }, 2); key('pink', CATCH + 7, { hip: [0, 0], lean: 4 }, 5);
  sfx('land', CATCH, { x: BX + 150, gain: 0.7, pitch: 0.8 });
  key('pink', CATCH + 4, { mouth: 'theeth smile', eyes: 'angry', head: 0 }, 0);
  sfx('ref:grin-eee', CATCH + 6, { who: 'pink', gain: 0.4, pitch: 1.35 });
  // накрывает
  const PUT = CATCH + 14, SH2 = PUT + 7;
  key('pink', PUT, { handF: hand('pink', 'F', 0.95, 0.25), handB: hand('pink', 'B', 0.85, 0.2), lean: 16, head: 6 }, 6, 'in2');
  BOXES[1].push({ f0: PUT, f1: SH2, a: (f, S) => { const b = propAt(BOXES[1], PUT - 1, statesAt(PUT - 1)); return [b.x, b.y]; }, b: [RX2, GROUND], ease: 'in2' },
    { f0: SH2, at: [RX2, GROUND] });
  key('rb', PUT + 2, { mouth: 'puzzlement' }, 0);
  sfx('swing', PUT, { who: 'pink', gain: 0.7 });
  sfx('slam', SH2, { x: RX2, gain: 1.0 }); ev('shake', { f: SH2, amp: 14, n: 8 }); ev('dust', { f: SH2, x: RX2, r: 110, n: 8, snd: false });
  key('pink', SH2 + 6, { ...stance('pink', BX, 1), mouth: 'happy with theeth', eyes: 'normal' }, 8);
  sfx('ref:laugh', SH2 + 4, { who: 'pink', gain: 0.85, pitch: 1.35 });
  chuckle('pink', SH2 + 6, SH2 + 26, { mouth: 'happy with theeth' });
  rattle(1, SH2 + 4, SH2 + 24, RX2);

  // ---- 8.4–12 с: Радужный «растёт» в ящике — доска ей в голову — шатается — наступает на палочку — падает — «пуф»
  const TF2 = SH2 + 22, RX = 1500;
  key('rb', TF2, { eyes: 'angry', mouth: 'angry theeth' }, 0);
  const RB = transform('rb', TF2, RX2, RX, -1, { style: 'grow' });
  BOXES[1].push({ f0: TF2 + 21, lift: 'rb', x: RX2 });
  burst(1, RB, [RX2, GROUND - CS / 2 - 150]);
  key('rb', RB, stance('rb', RX, -1), 0);
  key('rb', RB + 8, { mouth: 'theeth smile', eyes: 'angry' }, 0);
  key('pink', RB - 4, { mouth: 'puzzlement', eyes: 'sad' }, 0);
  const BONK = RB + 9;
  PLANKS.push({ segs: [{ f0: RB, f1: BONK, a: [RX2 - 60, GROUND - 480], b: 'pink:top', arc: 120, spin: -6.5 },
    { f0: BONK, f1: BONK + 14, a: 'pink:top', b: [BX - 260, GROUND - 14], arc: 160, spin: -5 }, { f0: BONK + 14, at: [BX - 260, GROUND - 14], rot: -0.08 }] });
  sfx('bonk', BONK, { who: 'pink', gain: 1.0 });
  ev('stars', { who: 'pink', f0: BONK + 1, f1: BONK + 30, snd: false });
  sfx('dizzy', BONK + 2, { who: 'pink', dur: 24, gain: 0.5 });
  key('pink', BONK, { lean: -18, head: -18, mouth: 'puzzlement', eyes: 'sad', handF: hand('pink', 'F', 0.5, -0.5), handB: hand('pink', 'B', -0.5, -0.4) }, 2);
  key('pink', BONK + 6, { lean: 8, head: 8 }, 6);
  sfx('ref:laugh', BONK + 2, { who: 'rb', gain: 0.85, pitch: 0.75 });
  chuckle('rb', BONK + 2, BONK + 40, { mouth: 'happy with theeth' });
  // шатаясь, шагает вперёд — нога на палочку
  const SX = CX1 + 40;
  walk('pink', BONK + 6, BX, SX, 2, 9, 1, false);
  const SL = BONK + 24;
  const LIE = slip('pink', SL, SX, 1, { n: 12, stars: 30 });
  STICK.push({ f0: SL, f1: SL + 12, a: [CX1 + 60, GROUND - 10], b: [CX1 + 320, GROUND - 10], arc: 60, spin: 4 * Math.PI }, { f0: SL + 12, at: [CX1 + 320, GROUND - 10], rot: 0 });
  const PBX = SX - 300;
  const psm = shrink('pink', LIE + 6, PBX, 1, { mouth: 'puzzlement', eyes: 'sad', smoke: 420 });
  key('pink', psm, { lean: 0, head: 0, hip: [0, 0], legF: null, legB: null, zB: null, rot: 0 }, 0);
  move('pink', psm, { x: PBX, y: GROUND, rot: 0 });
  ev('stars', { who: 'pink', f0: psm + 4, f1: psm + 16, snd: false });

  // ---- 12–16.6 с: шарик-Розовая кусает его за палец — скачет на одной ноге — спотыкается о доску — «пуф»
  key('pink', psm + 8, { eyes: 'angry', mouth: 'angry theeth' }, 0);
  const BX2 = RX - 230;
  hopTo('pink', psm + 8, psm + 20, PBX, GROUND, BX2, GROUND, 110);
  const BITE = psm + 23;
  key('pink', BITE - 3, { sx: 0.9, sy: 1.1, mouth: 'happy with theeth' }, 3);
  key('pink', BITE, { sx: 1.15, sy: 0.9 }, 1); key('pink', BITE + 4, { sx: 1, sy: 1 }, 3);
  sfx('chomp', BITE, { who: 'pink', gain: 1.0 });
  hopTo('pink', BITE + 6, BITE + 18, BX2, GROUND, 260, GROUND, 150);
  key('pink', BITE + 18, { mouth: 'happy with theeth', eyes: 'normal' }, 0);
  sfx('ref:laugh', BITE + 18, { who: 'pink', gain: 0.85, pitch: 1.35 });
  laugh('pink', BITE + 20, BITE + 40);
  // он — подпрыгивает от боли и скачет на одной ноге влево
  sfx('hurt', BITE + 1, { who: 'rb', gain: 1.0 });
  ev('sweat', { who: 'rb', f0: BITE + 2, f1: BITE + 30 });
  const HOP1 = { legFfk: 1, legBfk: 1, legF: [-60, 90, 0], legB: [0, 0, 0], handF: hand('rb', 'F', 0.6, 0.55), handB: hand('rb', 'B', 0.1, -0.85), lean: 10, head: -10, mouth: 'puzzlement', eyes: 'sad' };
  key('rb', BITE + 2, HOP1, 2);
  let x = RX;
  for (let i = 0; i < 2; i++) {
    const a = BITE + 3 + i * 9, nx = x - 90;
    move('rb', a, { x, y: GROUND }); move('rb', a + 4, { y: GROUND - 70 }, 'out2'); move('rb', a + 9, { x: nx, y: GROUND }, 'in2');
    move('rb', a + 9, { x: nx }, 'lin');
    sfx('step', a + 9, { who: 'rb', gain: 0.5 });
    x = nx;
  }
  const TRIP = BITE + 22;
  const FL = fallBack('rb', TRIP, x, -1, { forward: true, n: 14, stars: 40 });
  ev('sweat', { who: 'rb', f0: TRIP, f1: TRIP + 2 });
  // доска, о которую споткнулся: она отлетает
  PLANKS[0].segs.push({ f0: TRIP, f1: TRIP + 14, a: [1250, GROUND - 14], b: [1470, GROUND - 14], arc: 160, spin: 6.4 },
    { f0: TRIP + 14, at: [1470, GROUND - 14], rot: 0.05 });
  sfx('flick', TRIP, { x: 1250, gain: 0.6 });
  const rsm = shrink('rb', FL + 6, x - 330, -1, { mouth: 'puzzlement', eyes: 'sad', smoke: 420 });
  key('rb', rsm, { lean: 0, head: 0, hip: [0, 0], legF: null, legB: null, zB: null, rot: 0 }, 0);
  move('rb', rsm, { x: x - 330, y: GROUND, rot: 0 });
  ev('stars', { who: 'rb', f0: rsm + 4, f1: rsm + 16, snd: false });

  // ---- шарик-Радужный удирает вправо — третий ящик с неба накрывает его
  key('rb', rsm + 6, { face: 1, mouth: 'puzzlement', eyes: 'sad' }, 0);
  sfx('scared', rsm + 8, { who: 'rb', gain: 0.7 });
  let rx = x - 330;
  const TRX = 1480;
  for (let k = 0; k < 2; k++) { const a = rsm + 8 + k * 9, nx = k ? TRX : (rx + TRX) / 2; hop('rb', a, a + 8, rx, nx, 80, { prep: 1 }); rx = nx; }
  const D3 = rsm + 16, S3 = D3 + 10;
  BOXES[2].push({ f0: D3, f1: S3, a: [TRX, -CS - 30], b: [TRX, GROUND], ease: 'in2' }, { f0: S3, at: [TRX, GROUND] });
  sfx('whoosh', D3, { x: TRX, dur: 10, gain: 0.6 });
  sfx('slam', S3, { x: TRX, gain: 1.0 }); ev('shake', { f: S3, amp: 12, n: 8 }); ev('dust', { f: S3, x: TRX, r: 110, n: 8, snd: false });
  key('rb', S3, { alpha: 0 }, 0);
  rattle(2, S3 + 4, S3 + 40, TRX);

  // ---- Розовая «растёт» — в центр
  const PB2 = transform('pink', S3 - 16, 260, 340, 1, { style: 'grow' });
  key('pink', PB2, stance('pink', 340, 1), 0);
  key('pink', PB2 + 4, { mouth: 'happy with theeth' }, 0);
  sfx('ref:laugh', PB2 + 4, { who: 'pink', gain: 0.8, pitch: 1.35 });
  const WIN = victory('pink', PB2 + 8, 340, { n: 8, stride: 155 });
  window.T = { SET, IN, SHUT, PB, CATCH, SH2, RB, BONK, SL, psm, BITE, TRIP, rsm, S3, PB2, WIN };
};

// ------------------------------------------------------------------ рисование
const stickDraw = (ctx, s) => { const L = 150, c = Math.cos(s.rot) * L / 2, d = Math.sin(s.rot) * L / 2; FX.mcStick(ctx, s.x - c, s.y - d, s.x + c, s.y + d, 16); };
ST.hooks.beforeChars.push((ctx, f, S, CAM) => {
  ctx.setTransform(...CAM);
  const k = propAt(COOKIE, f, S);
  if (k) FX.mcCookie(ctx, k.x, k.y, 30, 0, 0);
  const s = propAt(STICK, f, S);
  if (s) stickDraw(ctx, s);
  for (const p of PLANKS) { const q = propAt(p.segs, f, S); if (q && q.y > GROUND - 40) FX.plank(ctx, q.x, q.y, 160, q.rot); }
});
ST.hooks.afterChars.push((ctx, f, S, CAM) => {
  ctx.setTransform(...CAM);
  for (let i = 0; i < 3; i++) { const b = propAt(BOXES[i], f, S); if (b) FX.woodCrate(ctx, b.x, b.y, CS, b.rot, b.px); }
  if (STRING && f >= STRING.f0 && f < STRING.f1) {
    const m = target('rb:face', S), a = [CX1, CY1 + 10];
    ctx.save(); ctx.lineCap = 'round';
    for (const [w, c] of [[6, '#333'], [3, '#f4f0e6']]) {
      ctx.lineWidth = w; ctx.strokeStyle = c; ctx.beginPath(); ctx.moveTo(a[0], a[1]);
      ctx.quadraticCurveTo((a[0] + m[0]) / 2, Math.max(a[1], m[1]) + 40, m[0] - 20, m[1] + 30); ctx.stroke();
    }
    ctx.restore();
  }
  for (const p of PLANKS) { const q = propAt(p.segs, f, S); if (q && q.y <= GROUND - 40) FX.plank(ctx, q.x, q.y, 160, q.rot); }
  for (const b of BURST) FX.blockBurst(ctx, b.at[0], b.at[1], (f - b.f) / 22, b.f, ['#c99a58', '#b8894a', '#6b4520'], 14, 50, 1.1, GROUND);
});

ST.start(BIG);
