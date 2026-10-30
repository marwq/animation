// Ролик 16 (бывш. 28): Слайм — Жёлтая (слева) против Скелета (справа), 25 с, 24 кадра/с. Драка без ударов:
// слайм из майнкрафта: глотает шарик, разлетается на маленьких слаймов, собирается обратно, служит батутом.
// В начале — считалка «3, 2, 1, FIGHT». Музыка превращения — один раз. Фон — плитки: фиолетовая стена, мятный пол, кнопки.
//
//   0–2.2 с   считалка: шарик-Жёлтая и шарик-Скелет неподвижно стоят друг напротив друга
//   2.2–4 с   с неба прыгает большой слайм; Скелет садится на него — слайм прыгает на Жёлтую и проглатывает её
//   4.1–5.4 с Жёлтая «растёт» под музыку прямо в слайме — он разлетается на четыре маленьких, Скелет влюблён
//   5.5–9.3 с кидает маленького слайма — он залепляет Скелету глаза, тот скачет вслепую и отскакивает
//             от слаймов, как в пинболе
//   9.3–10.6 с Скелет «растёт» — слаймы собираются в большого
//   10.8–14 с большой слайм прыгает Жёлтой на голову — она вслепую спотыкается — «пуф»
//   14–17 с   шарик-Жёлтая скачет на слайме, как на батуте, всё выше — и падает Скелету на голову — «пуф»
//   17–20 с   Жёлтая «растёт» снова; слайм глотает шарик-Скелета и упрыгивает с ним за край
//   20–25 с   Жёлтая в центре, руки вверх
'use strict';

const ST = Stage({
  name: '16 Жёлтая vs Скелет',
  frames: 600,
  intro: 'countdown-321',
  cast: {
    yel: { small: ['girl-verity-small', { bodyHeight: 300, recolor: 'yellow' }],
      big: ['verity-big-girl', { height: 730, splitFeet: true, recolor: 'yellow' }], pivot: 337, voice: 1.45, vAngle: 50, lie: 55,
      color: '#ffe23a', moods: { angry: 'angry theeth', grin: 'theeth smile', big: 'theeth smile' } },
    skel: { small: ['skeleton-verity-small', { scale: 0.455 }], big: ['skeleton-verity-big', { height: 730 }], pivot: 325,
      voice: 0.9, lie: 60, color: '#f3f1e6', moods: { angry: 'angry theeth', grin: 'happy with theeth', big: 'theeth smile' } },
  },
  order: ['skel', 'yel'],
  background: { theme: 'tiles', seed: 1016, wall: '#8758ec', floor: '#7ee6b4', motif: 'studs', sky: ['#4aa6f5', '#d6f2ff'] },
  clouds: [[150, 80, 2.4, 0, 12], [700, 220, 1.8, 1, 16], [1150, 70, 2.6, 2, 10], [1720, 250, 1.5, 0, 18]],
});
const { FPS, NF, GROUND, C, key, move, ev, sfx, hop, tumble, laugh, tremble, transform, shrink, stance, walk,
  fallBack, victory, chuckle, hand, statesAt, target } = ST;
const P = (v, f, S) => (typeof v === 'function' ? v(f, S) : typeof v === 'string' ? target(v, S) : v);
function flap(f0, f1, gain = 0.6) {
  for (let f = f0; f < f1; f += 6) { key('skel', f, { b_B16: -30, b_B17: 30 }, 3); key('skel', f + 3, { b_B16: 46, b_B17: -46 }, 3, 'in'); }
  key('skel', f1, { b_B16: 0, b_B17: 0 }, 4);
  sfx('gust', f0, { who: 'skel', dur: f1 - f0, gain });
}

// ------------------------------------------------------------------ слаймы
const BS = 360, SS = 170;
const SL = { big: [], a: [], b: [], c: [], d: [] };   // {f0, at:[x], s} | {f0, f1, a, b, arc, s0, s1} | {f0, head: who, s} | {f0, gone}
const LAND = [];          // [f, id] — сплющился при приземлении
const INSIDE = [];        // {who, id, f0, f1} — кто сидит внутри слайма
const BURST = [];         // {f, at, size}
const MOUTH = [];         // [f0, f1, id] — рот открыт
function segAt(segs, f) { let c = null; for (const s of segs) if (f >= s.f0) c = s; return c && !c.gone ? c : null; }
function slimeAt(id, f, S) {
  const c = segAt(SL[id], f);
  if (!c) return null;
  let sq = 1;
  for (const [g, w] of LAND) if (w === id && f >= g - 3 && f < g + 10) sq = f < g ? 1 - 0.18 * (f - g + 3) / 3 : Math.min(sq, 1 - 0.36 * Math.sin(Math.PI * (f - g) / 10) * (1 - (f - g) / 14));
  const mouth = MOUTH.some(([a, b, w]) => w === id && f >= a && f < b) ? 1 : 0;
  if (c.at) return { x: c.at[0], y: c.at[1] ?? GROUND, s: c.s, sq, look: c.look || 0, mouth };
  if (c.head) {
    const big = S[c.head].p.form === 'big', t = target(`${c.head}:${big ? 'top' : 'face'}`, S);
    return { x: t[0], y: t[1] + c.s * (big ? 0.62 : 0.45), s: c.s, sq: sq * (1 + 0.04 * Math.sin(f * 0.9)), look: 0, mouth };
  }
  const u = E.clamp((f - c.f0) / (c.f1 - c.f0), 0, 1), e = c.ease ? E.EASE[c.ease](u) : u;
  const a = P(c.a, c.f0, statesAt(c.f0)), b = P(c.b, f, S);
  return { x: E.lerp(a[0], b[0], e), y: E.lerp(a[1] ?? GROUND, b[1] ?? GROUND, e) - Math.sin(Math.PI * u) * (c.arc || 0),
    s: E.lerp(c.s0, c.s1 ?? c.s0, u), sq: 1 + 0.12 * Math.sin(Math.PI * u), look: Math.sign((b[0] - a[0]) || 0), mouth };
}
const slimePt = (id, f) => { const q = slimeAt(id, f, statesAt(f)); return [q.x, q.y]; };
function hopSlime(id, f0, f1, a, b, arc, s, o = {}) {
  SL[id].push({ f0, f1, a, b, arc, s0: s, s1: o.s1 ?? s }, { f0: f1, at: Array.isArray(b) ? b : null, s: o.s1 ?? s });
  LAND.push([f0, id], [f1, id]);
  if (o.snd !== false) { sfx('jump', f0, { x: 960, gain: 0.4, pitch: s > 200 ? 0.7 : 1.3 }); sfx('squish', f1, { x: 960, gain: 0.55, pitch: s > 200 ? 0.8 : 1.4 }); sfx('boing', f1 + 1, { x: 960, gain: 0.4, pitch: s > 200 ? 0.8 : 1.3 }); }
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
const LATE = [];

const YX0 = 470, SX0 = 1450, GO = 54;
// ================================================================== 0–2.2 с: считалка, оба стоят
key('yel', 0, { form: 'small', x: YX0, y: GROUND, face: 1, look: 1, eyes: 'normal', mouth: 'smile normal', sx: 1, sy: 1, rot: 0, pivot: 0, alpha: 1 }, 0);
key('skel', 0, { form: 'small', x: SX0, y: GROUND, face: -1, look: 1, eyes: 'normal', mouth: 'smile normal', sx: 1, sy: 1, rot: 0, pivot: 0, alpha: 1 }, 0);

const BIG = () => {
  // ---- 2.2–4 с: большой слайм — Скелет садится на него — слайм прыгает на Жёлтую и глотает её
  const BX = 980;
  hopSlime('big', GO, GO + 12, [2200, -200], [BX, GROUND], 0, BS);
  ev('shake', { f: GO + 12, amp: 10, n: 6 }); ev('dust', { f: GO + 12, x: BX, r: 90, n: 6, snd: false });
  key('yel', GO + 4, { mouth: 'puzzlement' }, 0); key('skel', GO + 4, { mouth: 'puzzlement' }, 0);
  key('skel', GO + 14, { mouth: 'happy with theeth', eyes: 'angry' }, 0);
  sfx('ref:grin-eee', GO + 14, { who: 'skel', gain: 0.4 });
  const ON = GO + 24;
  flap(GO + 14, ON, 0.5);
  move('skel', GO + 14, { x: SX0, y: GROUND }); move('skel', GO + 19, { x: 1250, y: GROUND - 520 }, 'out2'); move('skel', ON, { x: BX, y: GROUND - BS + 30 }, 'in2');
  key('skel', ON, { sx: 1.25, sy: 0.8 }, 1); key('skel', ON + 4, { sx: 1, sy: 1 }, 3);
  LAND.push([ON, 'big']); sfx('squish', ON, { x: BX, gain: 0.7 });
  // слайм с наездником прыгает на Жёлтую
  const J0 = ON + 4, J1 = J0 + 12;
  hopSlime('big', J0, J1, [BX, GROUND], [YX0, GROUND], 120, BS);
  LATE.push(() => { for (let f = J0; f <= J1; f++) { const q = slimePt('big', f); move('skel', f, { x: q[0], y: q[1] - BS * slimeAt('big', f, ST.stateAt(f)).sq + 30 }, 'lin'); } });
  key('yel', J0 + 6, { mouth: 'puzzlement', eyes: 'sad' }, 0);
  sfx('scared', J0 + 8, { who: 'yel', gain: 0.6 });
  MOUTH.push([J1 - 4, J1 + 2, 'big']);
  INSIDE.push({ who: 'yel', id: 'big', f0: J1, f1: 0 });
  sfx('gulp', J1 + 2, { x: YX0, gain: 0.9 });
  // Скелет отскакивает с макушки
  const SX1 = 1000;
  hopTo('skel', J1 + 1, J1 + 15, YX0, GROUND - BS + 30, SX1, GROUND, 220);
  key('skel', J1 + 15, { mouth: 'happy with theeth', eyes: 'normal' }, 0);
  sfx('ref:laugh', J1 + 15, { who: 'skel', gain: 0.85 });
  laugh('skel', J1 + 17, J1 + 31);
  key('yel', J1 + 4, { sx: 0.85, sy: 0.85, mouth: 'puzzlement', eyes: 'sad' }, 3);
  for (let f = J1 + 4; f < J1 + 10; f += 6) { key('yel', f, { rot: 10, pivot: ST.CAST.yel.pivot }, 3); key('yel', f + 3, { rot: -10 }, 3); }

  // ---- 4.1–5.4 с: Жёлтая «растёт» в слайме — он разлетается на четырёх маленьких, Скелет влюблён
  const YX = 520;
  key('yel', J1 + 10, { rot: 0, sx: 1, sy: 1, eyes: 'angry', mouth: 'angry theeth' }, 2);
  const YB = transform('yel', J1 + 12, YX0, YX, 1, { style: 'grow', love: 'skel', loveDur: 56 });
  const POP = YB - 12;
  INSIDE[0].f1 = POP; SL.big.push({ f0: POP, gone: true });
  BURST.push({ f: POP, at: [YX0, GROUND - 200], size: 1.4 });
  sfx('burst', POP, { x: YX0, gain: 0.9 }); sfx('squish', POP, { x: YX0, gain: 0.8 });
  const SMX = { a: 230, b: 820, c: 1240, d: 1700 };
  ['a', 'b', 'c', 'd'].forEach((id, i) => hopSlime(id, POP, POP + 14 + i * 2, [YX0, GROUND - 120], [SMX[id], GROUND], 260 + i * 40, SS));
  key('yel', YB, stance('yel', YX, 1), 0);
  key('yel', YB + 4, { mouth: 'theeth smile', eyes: 'normal' }, 0);

  // ---- 5.5–9.3 с: кидает маленького слайма — тот залепляет Скелету глаза — пинбол
  const SX2 = 1050;
  hopTo('skel', YB + 6, YB + 14, SX1, GROUND, SX2, GROUND, 70);
  ev('hearts', { who: 'skel', f0: YB + 14, f1: YB + 40, snd: false });
  hopSlime('b', YB + 2, YB + 12, [SMX.b, GROUND], [YX + 200, GROUND], 80, SS);
  const GR = YB + 16;
  key('yel', GR - 5, { lean: 26, hip: [0, ST.toRig('yel', 160)], head: 6 }, 5);
  key('yel', GR, { hitF: 1, hitFto: [YX + 200, GROUND - 70], hitFfix: GR }, 4);
  SL.b.push({ f0: GR, f1: GR + 8, a: [YX + 200, GROUND], b: (f, S) => { const h = C.yel.big.point(S.yel.st, 'handF'); return [h[0], h[1] + SS * 0.5]; }, s0: SS });
  key('yel', GR + 8, { ...stance('yel', YX, 1), hitF: 0, handF: hand('yel', 'F', 0.1, -0.95), mouth: 'theeth smile', eyes: 'angry' }, 8);
  const TH = GR + 14, HIT = TH + 10;
  key('yel', TH, { handF: hand('yel', 'F', 0.95, -0.25), lean: 12 }, 3, 'in2');
  sfx('swing', TH - 2, { who: 'yel', gain: 0.8 });
  SL.b.push({ f0: GR + 8, f1: TH, a: (f, S) => { const h = C.yel.big.point(statesAt(GR + 8).yel.st, 'handF'); return [h[0], h[1] + SS * 0.5]; }, b: (f, S) => { const h = C.yel.big.point(S.yel.st, 'handF'); return [h[0], h[1] + SS * 0.5]; }, s0: SS },
    { f0: TH, f1: HIT, a: (f, S) => { const h = C.yel.big.point(statesAt(TH).yel.st, 'handF'); return [h[0], h[1] + SS * 0.5]; }, b: (f, S) => { const t = target('skel:face', S); return [t[0], t[1] + SS * 1.25 * 0.45]; }, arc: 120, s0: SS, s1: SS * 1.25 },
    { f0: HIT, head: 'skel', s: SS * 1.25 });
  LAND.push([HIT, 'b']); sfx('squish', HIT, { who: 'skel', gain: 1.0 }); sfx('gulp', HIT + 2, { who: 'skel', gain: 0.5 });
  key('skel', HIT, { mouth: 'puzzlement', eyes: 'sad', sx: 1.15, sy: 0.88 }, 1); key('skel', HIT + 4, { sx: 1, sy: 1 }, 3);
  key('yel', HIT + 2, { ...stance('yel', YX, 1), lean: 0, mouth: 'happy with theeth', eyes: 'normal' }, 6);
  sfx('ref:laugh', HIT + 4, { who: 'yel', gain: 0.85, pitch: 1.45 });
  chuckle('yel', HIT + 4, HIT + 60, { mouth: 'happy with theeth' });
  // вслепую — отскакивает от слаймов «c» и «d», как в пинболе
  const PB = HIT + 6;
  hopTo('skel', PB, PB + 10, SX2, GROUND, SMX.c - 150, GROUND, 120);
  LAND.push([PB + 10, 'c']); sfx('boing', PB + 10, { x: SMX.c, gain: 0.9 });
  hopTo('skel', PB + 11, PB + 23, SMX.c - 150, GROUND, SMX.d - 180, GROUND, 260);
  LAND.push([PB + 23, 'd']); sfx('boing', PB + 23, { x: SMX.d, gain: 0.9, pitch: 1.2 });
  hopTo('skel', PB + 24, PB + 38, SMX.d - 180, GROUND, 1350, GROUND, 340);
  sfx('scared', PB + 12, { who: 'skel', gain: 0.6 });
  ev('stars', { who: 'skel', f0: PB + 38, f1: PB + 54 });

  // ---- 9.3–10.6 с: Скелет «растёт» — слаймы собираются в большого
  const SX = 1480, SB = transform('skel', PB + 42, 1350, SX, -1, { style: 'grow' });
  SL.b.push({ f0: SB - 4, f1: SB + 8, a: (f, S) => { const q = slimeAt('b', SB - 5, statesAt(SB - 5)); return [q.x, q.y]; }, b: [BX, GROUND - 40], arc: 160, s0: SS * 1.25, s1: SS }, { f0: SB + 8, gone: true });
  const MX = BX;
  ['a', 'c', 'd'].forEach((id, i) => { SL[id].push({ f0: SB - 2 + i * 2, f1: SB + 8, a: [SMX[id], GROUND], b: [MX, GROUND - 40], arc: 200, s0: SS }, { f0: SB + 8, gone: true }); });
  SL.big.push({ f0: SB + 8, at: [MX, GROUND], s: BS });
  LAND.push([SB + 8, 'big']);
  BURST.push({ f: SB + 8, at: [MX, GROUND - 200], size: 0.8 });
  sfx('pop', SB + 8, { x: MX, gain: 0.9 }); sfx('squish', SB + 8, { x: MX, gain: 0.8 }); ev('twinkle', { f: SB + 9, at: [MX, GROUND - BS - 20], n: 16, size: 50 });
  key('skel', SB, stance('skel', SX, -1), 0);
  key('skel', SB + 4, { mouth: 'theeth smile', eyes: 'angry' }, 0);
  key('yel', SB - 2, { mouth: 'puzzlement', eyes: 'sad' }, 0);

  // ---- 10.8–14 с: слайм прыгает Жёлтой на голову — вслепую спотыкается — «пуф»
  const WH = SB + 12;
  key('skel', WH - 4, { handF: hand('skel', 'F', 0.8, -0.6), lean: 6 }, 4);
  sfx('flick', WH, { who: 'skel', gain: 0.7 }); sfx('ref:grin-eee', WH + 2, { who: 'skel', gain: 0.4 });
  const SJ = WH + 4, SON = SJ + 14, HS = 300;
  SL.big.push({ f0: SJ, f1: SON, a: [MX, GROUND], b: (f, S) => { const t = target('yel:top', S); return [t[0], t[1] + HS * 0.62]; }, arc: 220, s0: BS, s1: HS }, { f0: SON, head: 'yel', s: HS });
  LAND.push([SJ, 'big'], [SON, 'big']); sfx('jump', SJ, { x: MX, gain: 0.5, pitch: 0.7 }); sfx('squish', SON, { who: 'yel', gain: 1.0 });
  key('yel', SON, { handF: hand('yel', 'F', 0.5, -0.95), handB: hand('yel', 'B', 0.3, -0.95), lean: -8, mouth: 'puzzlement', eyes: 'sad' }, 3);
  key('skel', SON + 2, { ...stance('skel', SX, -1), mouth: 'happy with theeth', eyes: 'normal' }, 6);
  sfx('ref:laugh', SON + 2, { who: 'skel', gain: 0.85, pitch: 0.8 });
  chuckle('skel', SON + 2, SON + 50, { mouth: 'happy with theeth' });
  sfx('scared', SON + 4, { who: 'yel', gain: 0.6 });
  // шатается вслепую — шаг назад — спотыкается
  const TX = 600;
  walk('yel', SON + 6, YX, YX + 130, 1, 10, 1, false);
  walk('yel', SON + 18, YX + 130, 780, 1, 10, 1, false);
  const FB = fallBack('yel', SON + 30, 780, 1, { n: 14, stars: 26 });
  SL.big.push({ f0: FB - 4, f1: FB + 10, a: (f, S) => slimePt('big', FB - 5), b: [TX, GROUND], arc: 160, s0: HS, s1: BS });
  SL.big.push({ f0: FB + 10, at: [TX, GROUND], s: BS });
  LAND.push([FB + 10, 'big']); sfx('squish', FB + 10, { x: TX, gain: 0.6 });
  const YBX = 230;
  const ysm = shrink('yel', FB + 6, YBX, 1, { mouth: 'puzzlement', eyes: 'sad', smoke: 420 });
  key('yel', ysm, { lean: 0, head: 0, hip: [0, 0], legF: null, legB: null, zB: null, rot: 0 }, 0);
  move('yel', ysm, { x: YBX, y: GROUND, rot: 0 });
  ev('stars', { who: 'yel', f0: ysm + 4, f1: ysm + 14, snd: false });

  // ---- 14–17 с: шарик-Жёлтая скачет на слайме, как на батуте — всё выше — Скелету на голову
  const TOP = GROUND - BS + 20, SX3 = 1100;
  walk('skel', FB + 2, SX, SX3, 3, 9, -1);
  key('yel', ysm + 6, { eyes: 'angry', mouth: 'theeth smile' }, 0);
  let f = ysm + 10;
  hopTo('yel', f, f + 10, YBX, GROUND, TX, TOP, 60, { land: false }); f += 10;
  for (const [h, n] of [[100, 10], [150, 12]]) {
    LAND.push([f, 'big']); sfx('boing', f, { x: TX, gain: 0.8, pitch: 1.1 });
    key('yel', f, { sx: 1.3, sy: 0.75 }, 1);
    hopTo('yel', f + 1, f + n, TX, TOP, TX, TOP, h, { land: false }); f += n;
  }
  LAND.push([f, 'big']); sfx('boing', f, { x: TX, gain: 1.0, pitch: 0.9 });
  key('yel', f, { sx: 1.3, sy: 0.75 }, 1);
  const LAUNCH = f + 1, HEAD = LAUNCH + 18;
  key('skel', HEAD - 8, { look: 1, head: -10, mouth: 'puzzlement', eyes: 'sad' }, 4);
  LATE.push(() => { const t = target('skel:body', ST.stateAt(HEAD)); hopTo('yel', LAUNCH, HEAD, TX, TOP, t[0] - 130, t[1] + 150, 150, { land: false }); hopTo('yel', HEAD + 2, HEAD + 14, t[0] - 130, t[1] + 150, 900, GROUND, 60); });
  key('yel', HEAD, { sx: 1.3, sy: 0.75, mouth: 'theeth smile', eyes: 'angry' }, 1);
  sfx('bonk', HEAD, { who: 'skel', gain: 1.0 }); sfx('slam', HEAD, { who: 'skel', gain: 0.5 }); ev('shake', { f: HEAD, amp: 16, n: 10 });
  const FB2 = fallBack('skel', HEAD + 2, SX3, -1, { n: 14, stars: 24 });
  key('yel', HEAD + 16, { mouth: 'happy with theeth', eyes: 'normal' }, 0);
  sfx('ref:laugh', HEAD + 16, { who: 'yel', gain: 0.85, pitch: 1.45 });
  laugh('yel', HEAD + 18, HEAD + 26);
  const SBX = 1400;
  const ssm = shrink('skel', FB2 + 6, SBX, -1, { mouth: 'puzzlement', eyes: 'sad', smoke: 420 });
  key('skel', ssm, { lean: 0, head: 0, hip: [0, 0], legF: null, legB: null, zB: null, rot: 0 }, 0);
  move('skel', ssm, { x: SBX, y: GROUND, rot: 0 });
  ev('stars', { who: 'skel', f0: ssm + 4, f1: ssm + 14, snd: false });

  // ---- 17–20 с: Жёлтая «растёт» снова; слайм глотает шарик-Скелета и упрыгивает за край
  const YX2 = 880, YB2 = transform('yel', HEAD + 24, 900, YX2, 1, { style: 'grow' });
  key('yel', YB2, stance('yel', YX2, 1), 0);
  key('yel', YB2 + 4, { mouth: 'theeth smile', eyes: 'angry' }, 0);
  const G1 = ssm + 10, G2 = G1 + 14;
  hopSlime('big', G1, G2, [TX, GROUND], [SBX, GROUND], 420, BS);
  MOUTH.push([G2 - 4, G2 + 2, 'big']);
  key('skel', G1 + 4, { mouth: 'puzzlement', eyes: 'sad' }, 0);
  sfx('scared', G1 + 6, { who: 'skel', gain: 0.6 });
  INSIDE.push({ who: 'skel', id: 'big', f0: G2, f1: 0 });
  sfx('gulp', G2 + 2, { x: SBX, gain: 0.9 });
  let x = SBX, g = G2 + 6;
  for (let k = 0; k < 3; k++) { const nx = x + 260; hopSlime('big', g, g + 10, [x, GROUND], [nx, GROUND], 160, BS); x = nx; g += 11; }
  // возвращается и выплёвывает шарик-Скелета — тот улетает через весь луг за левый край
  const RET = g + 6, BACKX = 1560;
  hopSlime('big', RET, RET + 12, [x, GROUND], [BACKX, GROUND], 200, BS);
  const SPIT = RET + 18;
  MOUTH.push([SPIT - 3, SPIT + 4, 'big']); LAND.push([SPIT - 2, 'big']);
  INSIDE[INSIDE.length - 1].f1 = SPIT;
  sfx('spit', SPIT, { x: BACKX, gain: 1.0 }); sfx('burp', SPIT + 1, { x: BACKX, gain: 0.6 });
  key('skel', SPIT, { pivot: ST.CAST.skel.pivot, mouth: 'puzzlement', eyes: 'sad' }, 0);
  move('skel', SPIT, { x: BACKX - 100, y: GROUND - 200, rot: 0 });
  move('skel', SPIT + 12, { y: GROUND - 640 }, 'out2');
  move('skel', SPIT + 26, { x: -480, rot: -1080 }, 'lin'); move('skel', SPIT + 26, { y: GROUND - 300 }, 'in2');
  sfx('whoosh', SPIT + 1, { who: 'skel', dur: 24, gain: 0.7 }); sfx('scared', SPIT + 2, { who: 'skel', gain: 0.8 });
  ev('twinkle', { f: SPIT + 24, at: [110, GROUND - 330], n: 22, size: 56 });
  key('yel', SPIT + 6, { look: 1, head: -14, lean: -6, mouth: 'puzzlement', eyes: 'normal' }, 4);
  key('yel', SPIT + 16, { head: 4, lean: 0, mouth: 'happy with theeth' }, 6);
  sfx('ref:laugh', SPIT + 24, { who: 'yel', gain: 0.8, pitch: 1.45 });
  for (let k = 0; k < 3; k++) { const a = SPIT + 30 + k * 11; hopSlime('big', a, a + 10, [BACKX + k * 320, GROUND], [BACKX + (k + 1) * 320, GROUND], 120, BS, { snd: k === 0 }); }
  key('yel', G2 + 4, { mouth: 'happy with theeth', eyes: 'normal' }, 0);
  sfx('ref:laugh', G2 + 4, { who: 'yel', gain: 0.85, pitch: 1.45 });
  chuckle('yel', G2 + 4, G2 + 26, { mouth: 'happy with theeth' });
  LATE.push(() => { for (const s of INSIDE) for (let k = s.f0; k <= Math.min(s.f1 || NF - 1, NF - 1); k++) { const q = slimeAt(s.id, k, ST.stateAt(k)); if (!q) continue; move(s.who, k, { x: q.x, y: q.y - 24 }, 'lin'); } });

  // ---- 20–25 с: в центр, руки вверх
  const WIN = victory('yel', SPIT + 18, YX2, { n: 9, stride: 80 });
  for (const fn of LATE) fn();
  window.T = { ON, J1, POP, YB, HIT, PB, SB, SON, FB, ysm, LAUNCH, HEAD, ssm, YB2, G2, WIN };
};

// ------------------------------------------------------------------ рисование
const isInside = (id, f) => INSIDE.some((s) => s.id === id && f >= s.f0 && (!s.f1 || f < s.f1));
function drawSlime(ctx, id, f, S) { const q = slimeAt(id, f, S); if (q) FX.mcSlime(ctx, q.x, q.y, q.s, q.sq, q.look, isInside(id, f) || segAt(SL[id], f).head ? 0.55 : 0.72, !isInside(id, f) && !segAt(SL[id], f).head, q.mouth); }
const inFront = (id, f) => { const c = segAt(SL[id], f); return c && (c.head || isInside(id, f) || (c.f1 && !c.at)); };
ST.hooks.beforeChars.push((ctx, f, S, CAM) => {
  ctx.setTransform(...CAM);
  for (const id of Object.keys(SL)) if (!inFront(id, f)) drawSlime(ctx, id, f, S);
});
ST.hooks.afterChars.push((ctx, f, S, CAM) => {
  ctx.setTransform(...CAM);
  for (const id of Object.keys(SL)) if (inFront(id, f)) drawSlime(ctx, id, f, S);
  for (const b of BURST) FX.slimeBurst(ctx, b.at[0], b.at[1], (f - b.f) / 20, b.size, b.f);
});

ST.start(BIG);
