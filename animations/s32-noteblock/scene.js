// Ролик 20 (бывш. 32): Нотный блок — Жёлтая (слева) против Розовой (справа), 25 с, 24 кадра/с. Драка без ударов:
// нотный блок из майнкрафта: на каждый прыжок — «дзынь», ноты летят и заставляют плясать того, в кого попали.
// В начале — считалка «3, 2, 1, FIGHT». Музыка превращения — один раз. Фон — плитки: сине-фиолетовая стена, аквамариновый пол, квадратики.
//
//   0–2.2 с   считалка: шарик-Жёлтая и шарик-Розовая неподвижно стоят друг напротив друга
//   2.2–4.2 с с неба падает нотный блок; Жёлтая прыгает на него — до-ре-ми — ноты летят в Розовую,
//             и она скачет под музыку, всё выше, и шлёпается
//   4.2–5.4 с Розовая «растёт» под музыку
//   5.5–9 с   топает по блоку — «БУМ» — басовая нота сдувает шарика-Жёлтую, второй «БУМ» — кувырком
//   9–13.5 с  Жёлтая «растёт», играет на блоке, как на барабане, — ноты летят в Розовую, она пляшет всё
//             быстрее, кружится — падает — «пуф»
//   13.5–17 с шарик-Розовая скачет по блоку — до-ре-ми-ФА — огромная нота Жёлтой в лицо — падает — «пуф»
//   17–21 с   Розовая «растёт» снова, стучит по блоку — ноты гонят шарика-Жёлтую за край
//   21–25 с   Розовая в центре, руки вверх
'use strict';

const ST = Stage({
  name: '20 Жёлтая vs Розовая',
  frames: 600,
  intro: 'countdown-321',
  cast: {
    yel: { small: ['girl-verity-small', { bodyHeight: 300, recolor: 'yellow' }],
      big: ['verity-big-girl', { height: 730, splitFeet: true, recolor: 'yellow' }], pivot: 337, voice: 1.45, vAngle: 50, lie: 55,
      color: '#ffe23a', moods: { angry: 'angry theeth', grin: 'theeth smile', big: 'theeth smile' } },
    pink: { small: ['girl-verity-small', { bodyHeight: 300 }], big: ['girl-verity-big', { height: 730, splitFeet: true }],
      pivot: 337, voice: 1.35, vAngle: 50, lie: 55, color: '#ff4fc8', moods: { angry: 'angry theeth', grin: 'theeth smile', big: 'theeth smile' } },
  },
  order: ['yel', 'pink'],
  background: { theme: 'tiles', seed: 1020, wall: '#5a5ff0', floor: '#82ecd9', motif: 'squares', sky: ['#4aa3f4', '#d8f1ff'] },
  clouds: [[150, 80, 2.4, 0, 12], [700, 220, 1.8, 1, 16], [1150, 70, 2.6, 2, 10], [1720, 250, 1.5, 0, 18]],
});
const { FPS, NF, GROUND, C, key, move, ev, sfx, hop, tumble, laugh, tremble, transform, shrink, stance, walk, turn,
  slip, fallBack, victory, chuckle, hand, toRig, statesAt, target } = ST;
const P = (v, f, S) => (typeof v === 'function' ? v(f, S) : typeof v === 'string' ? target(v, S) : v);

// ------------------------------------------------------------------ нотный блок, ноты
const NS = 250;
const BLK = { f0: 1e9, x: 960, seg: [] };   // seg: {f0, at:[x]} | {f0, f1, a, b, arc} | {f0, hands: who}
const HITS = [];          // [f] — блок «ударили»: сплющился и подсветился
const BURST = [];         // {f, at, size, dir, spread}
const STREAM = [];        // {f0, f1, a, b, size, arc} — ноты летят цепочкой
const SCALE = [1, 1.122, 1.26, 1.335, 1.498, 1.682, 1.888, 2];
function segAt(segs, f) { let c = null; for (const s of segs) if (f >= s.f0) c = s; return c && !c.gone ? c : null; }
function blockAt(f, S) {
  const c = segAt(BLK.seg, f);
  if (!c) return null;
  let sq = 1, glow = 0;
  for (const g of HITS) if (f >= g && f < g + 8) { sq = Math.min(sq, 1 - 0.22 * Math.sin(Math.PI * (f - g) / 8)); glow = Math.max(glow, 1 - (f - g) / 8); }
  if (c.at) return { x: c.at[0], y: c.at[1] ?? GROUND, sq, glow };
  if (c.hands) { if (S[c.hands].p.form !== 'big') return null; const h = C[c.hands].big.point(S[c.hands].st, 'handF'), g = C[c.hands].big.point(S[c.hands].st, 'handB'); return { x: (h[0] + g[0]) / 2, y: Math.max(h[1], g[1]) + NS * 0.6, sq, glow }; }
  const u = E.clamp((f - c.f0) / (c.f1 - c.f0), 0, 1), e = c.ease ? E.EASE[c.ease](u) : u;
  const a = P(c.a, c.f0, statesAt(c.f0)), b = P(c.b, f, S);
  return { x: E.lerp(a[0], b[0], e), y: E.lerp(a[1] ?? GROUND, b[1] ?? GROUND, e) - Math.sin(Math.PI * u) * (c.arc || 0), sq, glow };
}
const blockTop = (f) => { const b = blockAt(f, statesAt(f)); return [b.x, b.y - NS * b.sq]; };
function ding(f, k = 0, o = {}) {
  HITS.push(f);
  sfx('note', f, { x: 960, gain: o.gain ?? 0.9, pitch: o.pitch ?? SCALE[k % 8] * (k >= 8 ? 2 : 1) });
  if (o.burst !== false) BURST.push({ f, at: o.at || ((g, S) => blockTop(f)), size: (o.size || 0.9) * 1.5, dir: o.dir ?? 0, spread: o.spread ?? 1.0 });
}
function boom(f, o = {}) {
  HITS.push(f);
  sfx('note', f, { x: 960, gain: 1.0, pitch: 0.5 }); sfx('slam', f, { x: 960, gain: 0.6 }); sfx('gust', f, { x: 960, dur: 14, gain: 0.6 });
  ev('shake', { f, amp: 14, n: 8 });
  BURST.push({ f, at: (g, S) => blockTop(f), size: o.size || 1.8, dir: o.dir ?? -1.2, spread: 0.5 });
}
function notesTo(f0, f1, a, b, size = 1, arc = 80) { STREAM.push({ f0, f1, a, b, size, arc }); }
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
  if (o.snd !== false) sfx('jump', f0 + 2, { who, gain: 0.55 });
}
// большой пляшет: руки вверх-вниз, наклоны, приседания; n — кадров на такт
function dance(who, f0, f1, n = 6) {
  for (let f = f0, i = 0; f < f1; f += n, i++) {
    const s = i % 2 ? 1 : -1;
    key(who, f, { lean: 10 * s, head: -8 * s, hip: [0, toRig(who, i % 2 ? 50 : 10)], handF: hand(who, 'F', 0.55 * s, -0.85), handB: hand(who, 'B', -0.6 * s, s > 0 ? 0.3 : -0.9),
      mouth: 'happy with theeth', eyes: 'sad' }, Math.min(4, n - 1));
  }
}
const LATE = [];

const YX0 = 470, PX0 = 1450, MX = 960, GO = 54;
// ================================================================== 0–2.2 с: считалка, обе стоят
key('yel', 0, { form: 'small', x: YX0, y: GROUND, face: 1, look: 1, eyes: 'normal', mouth: 'smile normal', sx: 1, sy: 1, rot: 0, pivot: 0, alpha: 1 }, 0);
key('pink', 0, { form: 'small', x: PX0, y: GROUND, face: -1, look: 1, eyes: 'normal', mouth: 'smile normal', sx: 1, sy: 1, rot: 0, pivot: 0, alpha: 1 }, 0);

const BIG = () => {
  // ---- 2.2–4.2 с: нотный блок с неба — Жёлтая прыгает — до-ре-ми — Розовая скачет под музыку
  BLK.seg.push({ f0: GO, f1: GO + 8, a: [MX, -250], b: [MX, GROUND], ease: 'in2' }, { f0: GO + 8, at: [MX] });
  sfx('whoosh', GO, { x: MX, dur: 8, gain: 0.5 }); sfx('slam', GO + 8, { x: MX, gain: 0.7 }); ding(GO + 8, 0, { gain: 0.6, burst: false });
  ev('dust', { f: GO + 8, x: MX, r: 90, n: 6, snd: false });
  key('yel', GO + 3, { mouth: 'puzzlement' }, 0); key('pink', GO + 3, { mouth: 'puzzlement' }, 0);
  key('yel', GO + 12, { mouth: 'theeth smile', eyes: 'angry' }, 0);
  sfx('ref:grin-eee', GO + 12, { who: 'yel', gain: 0.4, pitch: 1.45 });
  const TOPY = GROUND - NS + 6, J1 = GO + 22;
  hopTo('yel', GO + 13, J1, YX0, GROUND, MX - 10, TOPY, 150, { land: false });
  // три прыжка на блоке — до, ми, соль; ноты летят в Розовую, она подскакивает в такт — всё выше
  const JS = [J1, J1 + 9, J1 + 18];
  JS.forEach((f, i) => {
    key('yel', f, { sx: 1.3, sy: 0.75 }, 1);
    ding(f, i * 2, { dir: 0.7, spread: 0.4 });
    notesTo(f, f + 8, (g, S) => blockTop(f), 'pink:top', 1.5, 60);
    if (i < 2) hopTo('yel', f + 1, f + 9, MX - 10, TOPY, MX - 10, TOPY, 70, { land: false, snd: false });
    const h = 110 + i * 110;
    key('pink', f + 8, { pivot: ST.CAST.pink.pivot, mouth: 'happy with theeth', eyes: 'sad' }, 0);
    move('pink', f + 8, { x: PX0, y: GROUND, rot: 0 }); move('pink', f + 12, { y: GROUND - h, rot: i % 2 ? -25 : 25 }, 'out2'); move('pink', f + 17, { y: GROUND, rot: 0 }, 'in2');
    key('pink', f + 17, { sx: 1.25, sy: 0.8 }, 1); key('pink', f + 19, { sx: 1, sy: 1 }, 2);
    sfx('boing', f + 17, { who: 'pink', gain: 0.5, pitch: 1 + i * 0.15 });
  });
  const LST = JS[2] + 17;
  key('pink', LST, { sx: 1.4, sy: 0.7, mouth: 'puzzlement', eyes: 'sad', pivot: 0 }, 1); key('pink', LST + 6, { sx: 1, sy: 1 }, 4);
  ev('stars', { who: 'pink', f0: LST + 2, f1: LST + 18 });
  const YX1 = 620;
  hopTo('yel', JS[2] + 1, JS[2] + 13, MX - 10, TOPY, YX1, GROUND, 120);
  key('yel', JS[2] + 13, { mouth: 'happy with theeth', eyes: 'normal' }, 0);
  sfx('ref:laugh', JS[2] + 13, { who: 'yel', gain: 0.85, pitch: 1.45 });
  laugh('yel', JS[2] + 15, JS[2] + 35);

  // ---- 4.2–5.4 с: Розовая «растёт»
  const PX = 1420;
  key('pink', LST + 10, { eyes: 'angry', mouth: 'angry theeth' }, 0);
  const PB = transform('pink', LST + 12, PX0, PX, -1, { style: 'grow' });
  key('pink', PB, stance('pink', PX, -1), 0);
  key('pink', PB + 4, { mouth: 'theeth smile', eyes: 'angry' }, 0);
  key('yel', PB - 2, { mouth: 'puzzlement', eyes: 'sad' }, 0);

  // ---- 5.5–9 с: топает по блоку — «БУМ» — сдувает Жёлтую; второй «БУМ» — кувырком
  const PX1 = MX + 230;
  walk('pink', PB + 4, PX, PX1, 2, 8, -1);
  const ST1 = PB + 26;
  key('pink', ST1 - 6, { legFfk: 1, legF: [-70, 60, 0], lean: -6, hip: [0, 0], handF: hand('pink', 'F', 0.5, -0.6), handB: hand('pink', 'B', -0.5, -0.5) }, 6);
  key('pink', ST1, { legF: [-30, 10, 0], lean: 8 }, 2, 'in2');
  boom(ST1);
  key('pink', ST1 + 8, { ...stance('pink', PX1, -1), legFfk: 0, legF: null }, 6);
  // Жёлтую сдувает назад, скользит
  key('yel', ST1 + 1, { sx: 0.8, sy: 1.15, mouth: 'puzzlement', eyes: 'sad' }, 1);
  move('yel', ST1 + 1, { x: YX1, y: GROUND }); move('yel', ST1 + 10, { x: 440 }, 'out2');
  key('yel', ST1 + 10, { sx: 1, sy: 1 }, 4);
  sfx('slide', ST1 + 1, { who: 'yel', gain: 0.5 });
  key('pink', ST1 + 10, { mouth: 'happy with theeth', eyes: 'normal' }, 0);
  sfx('ref:laugh', ST1 + 10, { who: 'pink', gain: 0.85, pitch: 1.35 });
  const ST2 = ST1 + 26;
  key('yel', ST2 - 12, { eyes: 'angry', mouth: 'angry theeth' }, 0);
  hopTo('yel', ST2 - 10, ST2 - 2, 440, GROUND, 560, GROUND, 60);
  key('pink', ST2 - 6, { legFfk: 1, legF: [-70, 60, 0], lean: -6, mouth: 'theeth smile', eyes: 'angry' }, 6);
  key('pink', ST2, { legF: [-30, 10, 0], lean: 8 }, 2, 'in2');
  boom(ST2, { size: 2.2 });
  key('pink', ST2 + 8, { ...stance('pink', PX1, -1), legFfk: 0, legF: null }, 6);
  const YX2 = 260;
  tumble('yel', ST2 + 1, ST2 + 19, 560, YX2, 260, -1.5, { stars: 18 });
  sfx('scared', ST2 + 2, { who: 'yel', gain: 0.7 });
  chuckle('pink', ST2 + 8, ST2 + 22, { mouth: 'happy with theeth' });
  const PXD = PX1;

  // ---- 9–13.5 с: Жёлтая «растёт», играет на блоке, как на барабане — Розовая пляшет — «пуф»
  key('yel', ST2 + 22, { eyes: 'angry', mouth: 'angry theeth' }, 0);
  const YX = 420, YB = transform('yel', ST2 + 24, YX2, YX, 1, { style: 'grow' });
  key('yel', YB, stance('yel', YX, 1), 0);
  key('yel', YB + 4, { mouth: 'theeth smile', eyes: 'angry' }, 0);
  key('pink', YB - 2, { mouth: 'puzzlement', eyes: 'sad' }, 0);
  const YX3 = MX - 230;
  walk('yel', YB + 4, YX, YX3, 2, 9, 1);
  // барабанит обеими руками
  const DR = YB + 24, BEATS = 8;
  key('yel', DR - 4, { lean: 22, hip: [0, toRig('yel', 120)], head: 10, mouth: 'happy with theeth', eyes: 'angry' }, 4);
  for (let i = 0; i < BEATS; i++) {
    const f = DR + i * 5, side = i % 2 ? 'B' : 'F', other = i % 2 ? 'F' : 'B';
    key('yel', f - 2, { ['hand' + side]: hand('yel', side, 0.75, -0.2), ['hand' + other]: hand('yel', other, 0.75, 0.2) }, 2);
    key('yel', f, { ['hand' + side]: hand('yel', side, 0.85, 0.35) }, 2, 'in2');
    ding(f, [0, 2, 4, 2, 5, 4, 7, 7][i], { dir: 0.9, spread: 0.35, size: 0.7 });
    notesTo(f, f + 7, (g, S) => blockTop(f), 'pink:body', 1.3, 50);
  }
  const DE = DR + BEATS * 5;
  key('yel', DE + 2, { ...stance('yel', YX3, 1), lean: 0, hip: [0, 0], head: 0 }, 6);
  // отходит от блока: разворот — два шага — разворот
  const YX4 = 620;
  turn('yel', DE + 8, -1, YX3); walk('yel', DE + 11, YX3, YX4, 2, 8, -1); turn('yel', DE + 28, 1, YX4);
  // Розовая пляшет, всё быстрее — кружится — падает
  dance('pink', DR + 7, DR + 25, 6);
  dance('pink', DR + 25, DE + 2, 4);
  sfx('ref:laugh', DR + 10, { who: 'yel', gain: 0.85, pitch: 1.45 });
  const SPIN = DE + 4;
  ST.spinAround('pink', SPIN, PXD, -1, { n: 4 });
  sfx('dizzy', SPIN, { who: 'pink', dur: 22, gain: 0.6 });
  const FB = fallBack('pink', SPIN + 20, PXD, -1, { n: 14, stars: 24 });
  chuckle('yel', DE + 6, FB + 10, { mouth: 'happy with theeth' });
  const PBX = 1560;
  const psm = shrink('pink', FB + 6, PBX, -1, { mouth: 'puzzlement', eyes: 'sad', smoke: 420 });
  key('pink', psm, { lean: 0, head: 0, hip: [0, 0], legF: null, legB: null, zB: null, rot: 0 }, 0);
  move('pink', psm, { x: PBX, y: GROUND, rot: 0 });
  ev('stars', { who: 'pink', f0: psm + 4, f1: psm + 14, snd: false });

  // ---- 13.5–17 с: шарик-Розовая скачет по блоку — до-ре-ми-ФА — огромная нота Жёлтой в лицо
  key('pink', psm + 6, { eyes: 'angry', mouth: 'theeth smile' }, 0);
  const J2 = psm + 18;
  hopTo('pink', psm + 8, J2, PBX, GROUND, MX + 10, TOPY, 150, { land: false });
  const J2S = [J2, J2 + 8, J2 + 16];
  J2S.forEach((f, i) => {
    key('pink', f, { sx: 1.3, sy: 0.75 }, 1);
    ding(f, i * 2 + 1, { dir: -0.6, spread: 0.5 });
    hopTo('pink', f + 1, f + 8, MX + 10, TOPY, MX + 10, TOPY, 60 + i * 30, { land: false, snd: false });
  });
  const BIGN = J2S[2] + 8;
  key('pink', BIGN, { sx: 1.45, sy: 0.65 }, 1);
  HITS.push(BIGN); sfx('note', BIGN, { x: 960, gain: 1.0, pitch: 0.75 }); sfx('note', BIGN, { x: 960, gain: 0.7, pitch: 1.5 }); ev('shake', { f: BIGN, amp: 12, n: 8 });
  const HIT = BIGN + 9;
  STREAM.push({ f0: BIGN, f1: HIT, a: (g, S) => blockTop(BIGN), b: 'yel:face', size: 5, arc: 40, one: true });
  sfx('whoosh', BIGN + 1, { x: 900, dur: 8, gain: 0.6 }); sfx('bonk', HIT, { who: 'yel', gain: 1.0 });
  ev('stars', { who: 'yel', f0: HIT + 1, f1: HIT + 20, snd: false });
  key('yel', HIT, { lean: -18, head: -18, mouth: 'puzzlement', eyes: 'sad', handF: hand('yel', 'F', 0.4, -0.7), handB: hand('yel', 'B', -0.4, -0.6) }, 2);
  const FB2 = fallBack('yel', HIT + 4, YX4, 1, { n: 14, stars: 24 });
  hopTo('pink', BIGN + 1, BIGN + 13, MX + 10, TOPY, 1300, GROUND, 110);
  key('pink', BIGN + 13, { mouth: 'happy with theeth', eyes: 'normal' }, 0);
  sfx('ref:laugh', BIGN + 13, { who: 'pink', gain: 0.85, pitch: 1.35 });
  laugh('pink', BIGN + 15, BIGN + 19);
  const YBX = 500;
  const ysm = shrink('yel', FB2 + 6, YBX, 1, { mouth: 'puzzlement', eyes: 'sad', smoke: 420 });
  key('yel', ysm, { lean: 0, head: 0, hip: [0, 0], legF: null, legB: null, zB: null, rot: 0 }, 0);
  move('yel', ysm, { x: YBX, y: GROUND, rot: 0 });
  ev('stars', { who: 'yel', f0: ysm + 4, f1: ysm + 14, snd: false });

  // ---- 17–21 с: Розовая «растёт» снова, стучит по блоку — ноты гонят шарика-Жёлтую за край
  const PX2 = 1260, PB2 = transform('pink', BIGN + 18, 1300, PX2, -1, { style: 'grow' });
  key('pink', PB2, stance('pink', PX2, -1), 0);
  key('pink', PB2 + 4, { mouth: 'theeth smile', eyes: 'angry' }, 0);
  const TP = PB2 + 8;
  key('pink', TP - 4, { lean: 22, hip: [0, toRig('pink', 100)], head: 6 }, 4);
  key('yel', ysm + 6, { face: -1, mouth: 'puzzlement', eyes: 'sad' }, 0);
  sfx('scared', TP + 2, { who: 'yel', gain: 0.6 });
  let yx = YBX;
  for (let i = 0; i < 3; i++) {
    const f = TP + i * 8;
    key('pink', f - 2, { handF: hand('pink', 'F', 0.75, -0.2) }, 2); key('pink', f, { handF: hand('pink', 'F', 0.85, 0.35) }, 2, 'in2');
    ding(f, [4, 5, 7][i], { dir: -1.0, spread: 0.3, size: 0.8 });
    notesTo(f, f + 8, (g, S) => blockTop(f), 'yel:top', 1.4, 60);
    const nx = yx - (i === 2 ? 600 : 260); hop('yel', f + 8, f + 15, yx, nx, 90 + i * 20, { prep: 1 }); yx = nx;
  }
  key('pink', TP + 26, { ...stance('pink', PX2, -1), lean: 0, hip: [0, 0], head: 0, mouth: 'happy with theeth', eyes: 'normal' }, 6);
  sfx('ref:laugh', TP + 26, { who: 'pink', gain: 0.85, pitch: 1.35 });

  // ---- 21–25 с: в центр, руки вверх (обходит блок — он отъезжает)
  BLK.seg.push({ f0: TP + 28, f1: TP + 38, a: [MX], b: [1650], arc: 60 }, { f0: TP + 38, at: [1650] });
  sfx('swing', TP + 28, { who: 'pink', gain: 0.5 }); ding(TP + 38, 0, { gain: 0.5, size: 0.6 });
  key('pink', TP + 28, { hitF: 1, hitFto: [MX + 90, GROUND - 120], hitFfix: TP + 28 }, 3); key('pink', TP + 34, { hitF: 0 }, 4);
  const WIN = victory('pink', TP + 36, PX2, { n: 9, stride: 100 });
  for (const fn of LATE) fn();
  window.T = { J1, LST, PB, ST1, ST2, YB, DR, DE, SPIN, FB, psm, J2, BIGN, HIT, ysm, PB2, TP, WIN };
};

// ------------------------------------------------------------------ рисование
const NC = ['#e8262e', '#2f7de1', '#25c516', '#ffb81f', '#b83ad6'];
ST.hooks.beforeChars.push((ctx, f, S, CAM) => {
  ctx.setTransform(...CAM);
  const b = blockAt(f, S);
  if (b) FX.noteBlock(ctx, b.x, b.y, NS, b.sq, b.glow);
});
ST.hooks.afterChars.push((ctx, f, S, CAM) => {
  ctx.setTransform(...CAM);
  for (const s of STREAM) {
    const u = (f - s.f0) / (s.f1 - s.f0);
    if (u < 0 || u >= 1) continue;
    const a = P(s.a, s.f0, statesAt(s.f0)), b = P(s.b, f, S);
    const n = s.one ? 1 : 3;
    for (let i = 0; i < n; i++) {
      const k = E.clamp(u - i * 0.12, 0, 1);
      if (k <= 0) continue;
      FX.note(ctx, E.lerp(a[0], b[0], k), E.lerp(a[1], b[1], k) - Math.sin(Math.PI * k) * s.arc, s.size * (s.one ? 1 : 1.2), 1, i % 2 === 1, NC[(s.f0 + i) % NC.length]);
    }
  }
  for (const r of BURST) { const at = P(r.at, r.f, statesAt(r.f)); FX.noteBurst(ctx, at[0], at[1], (f - r.f) / 20, r.size, r.f, r.dir, r.spread); }
});

ST.start(BIG);
