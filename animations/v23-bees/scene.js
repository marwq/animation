// Ролик 23: Пчёлы — Радужный против Толстого (и Розовая), 25 с, 24 кадра/с, звуковые эффекты без музыки,
// по стилю «animal hospital long» (docs/animal_hospital_long.md).
//
//   0–4 с     радужный шарик-Скелет (слева, под деревом с ульем) и Толстый (справа) смотрят друг на друга
//   4–5 с     Радужный сразу становится большим
//   5–7.5 с   срывает улей и облизывает мёд — из улья вылетает рой
//   7.5–9.5 с удирает, пчела жалит в зад — подпрыгивает; бросает улей — улей садится Толстому на голову
//   9.5–12.5 с пчёлы жалят Толстого, он раздувается, злится и пузом сбивает Радужного с ног
//   12.5–16 с прискакала шарик-Розовая и стала большой — оба влюбились, пчёлы встают сердечком вокруг неё
//   17–20 с   оба лезут к ней — она натравливает пчёл на Радужного и пинает Толстого — тот катится
//             в Радужного, оба улетают за кадр
//   21–25 с   Розовая в центре, руки вверх, пчёлы сердечком
'use strict';

const ST = Stage({
  name: 'v23-bees',
  cast: {
    rb: { small: ['skeleton-verity-small', { scale: 0.455, recolor: 'rainbow' }], big: ['all-verity-color', { height: 730 }],
      pivot: 325, voice: 0.85, lie: 55, moods: { big: 'theeth smile' } },
    fat: { small: ['fat-verity-small', { bodyHeight: 450 }], pivot: 508, voice: 0.75, moods: { love: 'happy' } },
    pink: { small: ['girl-verity-small', { bodyHeight: 300 }], big: ['girl-verity-big', { height: 730, splitFeet: true }],
      pivot: 337, voice: 1.35, vAngle: 50, moods: { angry: 'sad', grin: 'theeth smile', big: 'smile normal' } },
  },
  order: ['rb', 'fat', 'pink'],
  background: { sky: ['#4ea6ef', '#b5d3f4', '#f4e2cc'], seed: 273 },
  clouds: [[130, 70, 1.1, 0, 24], [560, 190, 0.8, 2, 29], [1030, 90, 1.0, 1, 21], [1440, 200, 0.9, 0, 27],
    [1790, 60, 1.2, 2, 23], [860, 310, 0.7, 1, 30]],
});
const { FPS, NF, GROUND, C, key, move, ev, sfx, hop, tumble, laugh, tremble, transform, love, stance, walk, turn,
  strike, kick, dodge, duck, recoil, fallBack, getUp, flyOff, victory, chuckle, hand, toRig, statesAt, stateAt, target } = ST;

// зад (таз сзади) — сюда жалят
ST.parts.butt = (ch, st, p) => {
  const l = ch.layers.find((x) => x.name === 'hip');
  const c = E.apply(ch.layerMatrix(st, 'hip'), [(l.bbox[0] + l.bbox[2]) / 2, (l.bbox[1] + l.bbox[3]) / 2]);
  return [c[0] - (p.face || 1) * ch.width * 0.16, c[1]];
};
// точки на контуре Толстого (k > 0 — со стороны взгляда)
const fatEdge = (k, hf) => (ch, st) => {
  const b = ch.layers.find((l) => l.name === 'body').bbox;
  return E.apply(ch.layerMatrix(st, 'body'), [(b[0] + b[2]) / 2 + k * (b[2] - b[0]), b[3] - hf * (b[3] - b[1])]);
};
ST.parts.belly = fatEdge(0.47, 0.3);

// ------------------------------------------------------------------ дерево и улей
const TX = 760, HX0 = TX + 150, HY0 = GROUND - 300, HS = 110;
// сегменты улья: {f0, hang} — висит на ветке; {f0, hand: кто} — в ближней руке; {f0, f1, a, b, arc, spin} — летит;
// {f0, on: кто} — сидит на макушке
const HV = [{ f0: 0, hang: true }];
const P = (v, f, S) => (typeof v === 'function' ? v(f, S) : v);
const hiveAt = (f, S) => {
  let cur = null;
  for (const c of HV) if (f >= c.f0) cur = c;
  const t = f / FPS;
  if (cur.hang) return { x: HX0 + Math.sin(t * 2.2) * 3, y: HY0, rot: Math.sin(t * 2.2) * 0.04, hang: true };
  if (cur.hand) { const h = C[cur.hand].big.point(S[cur.hand].st, 'handB'); return { x: h[0], y: h[1] + 42, rot: 0, hand: cur.hand }; }
  if (cur.on) { const tp = target(`${cur.on}:top`, S); return { x: tp[0], y: tp[1] - 52, rot: 0 }; }
  const u = cur.f1 > cur.f0 ? E.clamp((f - cur.f0) / (cur.f1 - cur.f0), 0, 1) : 1;
  const a = P(cur.a, cur.f0, statesAt(cur.f0)), b = P(cur.b, f, S);
  return { x: E.lerp(a[0], b[0], u), y: E.lerp(a[1], b[1], u) - Math.sin(Math.PI * u) * (cur.arc || 0), rot: (cur.spin || 0) * u };
};
const hivePt = (f, S) => { const h = hiveAt(f, S); return [h.x, h.y]; };

// ------------------------------------------------------------------ рой
// сегменты: {f0, at: точка | 'кто:часть' | fn, r: размах, lag: отставание} или {f0, heart: кто};
// до выпуска (REL) у улья кружат три пчелы
const NB = 18, REL = 176;
const SW = [{ f0: 0, at: hivePt, r: 90, lag: 0 }];
const BEES = [];
{ const r = FX.rng(23); for (let i = 0; i < NB; i++) BEES.push({ R: 0.45 + 0.55 * r(), w: 2.4 + 2.2 * r(), ph: r() * Math.PI * 2, s: 2.0 + 0.6 * r() }); }
const resolve = (seg, f) => {
  const g = Math.max(0, f - (seg.lag || 0)), S = statesAt(g);
  return typeof seg.at === 'string' ? target(seg.at, S) : P(seg.at, g, S);
};
const heartPos = (who, i, S) => {
  const h = target(`${who}:head`, S), u = (i / NB) * Math.PI * 2;
  const hx = 16 * Math.sin(u) ** 3, hy = -(13 * Math.cos(u) - 5 * Math.cos(2 * u) - 2 * Math.cos(3 * u) - Math.cos(4 * u));
  const side = (S[who].p.face || 1) * 230;                         // сердечко рядом с головой, не на лице
  return [h[0] + side + hx * 6.5, h[1] - 10 + hy * 6.5];
};
// где пчела i в кадре f (и куда смотрит)
function beeAt(i, f, S) {
  let k = 0;
  for (let j = 0; j < SW.length; j++) if (f >= SW[j].f0) k = j;
  const b = BEES[i], t = f / FPS;
  const orbit = (seg, g) => {
    if (seg.heart) { const p = heartPos(seg.heart, i, statesAt(g)); return [p[0] + Math.cos(t * b.w + b.ph) * 8, p[1] + Math.sin(t * b.w * 1.3 + b.ph) * 8]; }
    const c = resolve(seg, g), R = seg.r * b.R;
    return [c[0] + Math.cos(t * b.w + b.ph) * R, c[1] + Math.sin(t * b.w * 1.6 + b.ph) * R * 0.6];
  };
  let p = orbit(SW[k], f);
  const u = (f - SW[k].f0) / 14;
  if (k > 0 && u < 1) { const q = orbit(SW[k - 1], f), e = E.EASE.io(Math.max(0, u)); p = [E.lerp(q[0], p[0], e), E.lerp(q[1], p[1], e)]; }
  // вылет из летка: по очереди
  if (f >= REL && f < REL + 14 + i) {
    const v = E.clamp((f - REL - i * 0.6) / 10, 0, 1), h = hivePt(REL, statesAt(REL));
    p = [E.lerp(h[0] + 6, p[0], v), E.lerp(h[1] + 40, p[1], v)];
  }
  // жало: одна пчела бросается в точку
  for (const s of STINGS) {
    const v = (f - (s.f - 6)) / 6, w = (s.f + 6 - f) / 6;
    if (i === s.bee && v > 0 && w > 0) { const q = target(s.at, statesAt(s.f)), e = Math.min(1, v, w); p = [E.lerp(p[0], q[0], e), E.lerp(p[1], q[1], e)]; }
  }
  const dx = -Math.sin(t * b.w + b.ph);
  return { x: p[0], y: p[1], dir: dx >= 0 ? 1 : -1, s: b.s, visible: f >= REL || i < 3 };
}
const STINGS = [];
function sting(who, f, part, bee, o = {}) {
  STINGS.push({ f, at: `${who}:${part}`, bee });
  ev('spark', { f, at: `${who}:${part}`, r: o.r || 34, snd: 'flick', swing: false });
}

const RS = 560, FS = 1360;
// ================================================================== 0–4 с: стойка
key('rb', 0, { form: 'small', x: RS, y: GROUND, face: 1, look: 1, eyes: 'angry', mouth: 'theeth smile', sx: 1, sy: 1, rot: 0 }, 0);
key('fat', 0, { form: 'small', x: FS, y: GROUND, face: -1, look: 1, eyes: 'angry', mouth: 'theeth smile', sx: 1, sy: 1, rot: 0 }, 0);
key('pink', 0, { form: 'small', x: 2160, y: GROUND, face: -1, look: 1, eyes: 'normal', mouth: 'smile normal', sx: 1, sy: 1, rot: 0 }, 0);
sfx('buzz', 0, { x: HX0, dur: REL, gain: 0.12 });

// ================================================================== 4–5 с: Радужный большой
const RX0 = 600;
const RB = transform('rb', 96, RS, RX0, 1, { fast: true });
key('fat', RB, { mouth: 'puzzlement', eyes: 'sad' }, 0);
ev('sweat', { who: 'fat', f0: RB + 2, f1: RB + 26 });

// ================================================================== 12.5–16 с: Розовая
hop('pink', 300, 312, 2160, 1940, 70);
hop('pink', 316, 328, 1940, 1740, 70);
const PX = 1740;
const PB = transform('pink', 334, 1740, PX, -1, { love: ['fat', 'rb'], loveDur: 70 });

const BIG = () => {
  key('rb', RB, stance('rb', RX0, 1), 0);
  key('rb', RB + 4, { mouth: 'happy with theeth', eyes: 'normal' }, 0);

  // ---- срывает улей, облизывает мёд
  const RX1 = 720, GRAB = 148;
  walk('rb', 122, RX0, RX1, 1, 10, 1);
  key('rb', GRAB - 8, { handB: hand('rb', 'B', 0.6, -0.4), mouth: 'happy - spittle' }, 8);
  key('rb', GRAB, { hitB: 1, hitBto: [HX0, HY0 - 42], hitBfix: GRAB }, 4);
  HV.push({ f0: GRAB, hand: 'rb' });
  sfx('pop', GRAB + 2, { x: HX0, gain: 0.7 });
  key('rb', GRAB + 10, { hitB: 0, handB: hand('rb', 'B', 0.75, -0.05) }, 8);
  for (const f of [162, 171]) {
    key('rb', f - 3, { head: 12, lean: 6, mouth: 'happy - spittle' }, 3);
    key('rb', f + 3, { head: 0, lean: 0, mouth: 'happy open mouth' }, 3);
    sfx('lick', f, { who: 'rb', gain: 0.8 });
  }
  // ---- рой вылетает
  SW.push({ f0: REL, at: 'rb:head', r: 190, lag: 3 });
  sfx('buzz', REL, { who: 'rb', dur: 130, gain: 0.55 });
  key('rb', REL + 2, { mouth: 'puzzlement', eyes: 'sad', head: -6 }, 2);
  ev('sweat', { who: 'rb', f0: REL + 2, f1: REL + 20 });
  sfx('scared', REL + 4, { who: 'rb', gain: 0.8 });

  // ---- удирает; жало в зад — подпрыгивает
  const RX2 = 960, RUN = REL + 10;
  walk('rb', RUN, RX1, RX2, 4, 6, 1);
  key('rb', RUN, { lean: 10, handF: hand('rb', 'F', 0.6, -0.5) }, 4);
  SW.push({ f0: RUN, at: 'rb:butt', r: 140, lag: 5 });
  const ST1 = RUN + 25;
  sting('rb', ST1, 'butt', 0);
  key('rb', ST1 + 1, { legFfk: 1, legBfk: 1, legF: [-20, 60], legB: [30, 40], lean: -6, head: -12, mouth: 'puzzlement',
    handF: hand('rb', 'F', -0.5, 0.35) }, 2);
  move('rb', ST1 + 1, { y: GROUND });
  move('rb', ST1 + 7, { y: GROUND - 80 }, 'out2');
  move('rb', ST1 + 13, { y: GROUND }, 'in2');
  key('rb', ST1 + 12, { ...C.rb.big.feet(RX2, 1), legFfk: 1, legBfk: 1 }, 0);
  key('rb', ST1 + 15, { ...stance('rb', RX2, 1), handB: hand('rb', 'B', 0.75, -0.05), mouth: 'puzzlement' }, 4);
  ev('dust', { f: ST1 + 13, x: RX2, r: 30, n: 4, snd: 'land' });
  // ---- бросает улей — Толстому на голову
  const TH = ST1 + 22, LANDH = TH + 16;
  key('rb', TH - 6, { handB: hand('rb', 'B', -0.6, -0.6), lean: -8 }, 6);
  key('rb', TH, { handB: hand('rb', 'B', 0.9, -0.5), lean: 12 }, 4, 'in2');
  key('rb', TH + 12, { ...stance('rb', RX2, 1), mouth: 'happy with theeth', eyes: 'normal' }, 8);
  sfx('swing', TH - 4, { who: 'rb', gain: 0.8 });
  const h0 = hivePt(TH, stateAt(TH));
  HV.push({ f0: TH, f1: LANDH, a: h0, b: (f, S) => { const t = target('fat:top', S); return [t[0], t[1] - 52]; }, arc: 160, spin: Math.PI * 2 });
  HV.push({ f0: LANDH, on: 'fat' });
  sfx('whoosh', TH, { x: h0[0], dur: 14, gain: 0.5 });
  sfx('bonk', LANDH, { who: 'fat', gain: 0.8 });
  key('fat', LANDH, { sx: 1.12, sy: 0.88 }, 1);
  key('fat', LANDH + 5, { sx: 1, sy: 1 }, 4);
  SW.push({ f0: TH + 4, at: hivePt, r: 200, lag: 6 });
  chuckle('rb', TH + 14, TH + 34, { mouth: 'happy with theeth' });
  // ---- пчёлы жалят Толстого — раздувается, злится
  const ST2 = LANDH + 12, ST3 = ST2 + 10;
  key('fat', LANDH + 2, { mouth: 'puzzlement', eyes: 'sad' }, 0);
  sting('fat', ST2, 'belly', 1);
  key('fat', ST2 + 1, { sx: 1.1, sy: 1.06 }, 2, 'out');
  sting('fat', ST3, 'top', 2);
  key('fat', ST3 + 1, { sx: 1.18, sy: 1.1 }, 2, 'out');
  const MAD = ST3 + 6;
  key('fat', MAD, { mouth: 'theeth smile', eyes: 'angry' }, 0);
  ev('vein', { who: 'fat', f0: MAD, f1: MAD + 22 });
  ev('steam', { who: 'fat', f0: MAD + 2, f1: MAD + 22 });
  sfx('anger', MAD, { who: 'fat', dur: 22, gain: 0.8 });
  tremble('fat', MAD + 4, MAD + 16, FS, 3);
  // ---- пузом с разбегу — Радужный на спину
  const BUMP = MAD + 30, FX1 = 1250;
  key('fat', BUMP - 10, { sx: 1.32, sy: 0.84 }, 6);
  move('fat', BUMP - 8, { x: FS, y: GROUND });
  key('fat', BUMP - 6, { sx: 1.05, sy: 1.12 }, 2);
  move('fat', BUMP - 2, { x: (FS + FX1) / 2, y: GROUND - 60 }, 'out2');
  move('fat', BUMP, { x: FX1, y: GROUND }, 'in2');
  key('fat', BUMP, { sx: 1.02, sy: 1.14 }, 1);
  key('fat', BUMP + 4, { sx: 1.18, sy: 1.1 }, 4);
  sfx('jump', BUMP - 6, { who: 'fat', gain: 0.6 });
  ev('spark', { f: BUMP, at: 'rb:body', r: 70, snd: 'boing', swing: false });
  ev('shake', { f: BUMP, amp: 18, n: 12 });
  ev('zoom', { f: BUMP, n: 12, k: 0.06, at: 'rb:body' });
  const RX3 = 890;                                 // лёжа голова не за краем
  fallBack('rb', BUMP + 1, RX2, 1, { n: 16, stars: 60 });
  move('rb', BUMP + 14, { x: RX3 }, 'out2');
  key('fat', BUMP + 10, { mouth: 'happy', eyes: 'normal' }, 0);
  const FX2 = 1270;
  hop('fat', BUMP + 12, BUMP + 24, FX1, FX2, 50);
  laugh('fat', BUMP + 28, BUMP + 50);

  // ---- Розовая большая — оба влюблены; рой встаёт сердечком вокруг неё
  key('pink', PB, stance('pink', PX, -1), 0);
  key('pink', PB + 8, { mouth: 'theeth smile', eyes: 'normal' }, 0);
  key('fat', PB, { sx: 0.3 }, 2);
  key('fat', PB + 2, { face: 1 }, 0);
  key('fat', PB + 4, { sx: 1, sy: 1 }, 2);
  SW.push({ f0: PB + 10, heart: 'pink' });
  sfx('buzz', PB + 10, { who: 'pink', dur: 60, gain: 0.25 });
  sfx('sparkle', PB + 24, { who: 'pink', gain: 0.6 });
  key('pink', PB + 24, { mouth: 'happy with theeth' }, 0);

  // ---- оба лезут к ней
  const UP = PB + 30, RX4 = RX3;
  getUp('rb', UP, RX3, 1, { n: 14, mouth: 'happy - spittle' });
  key('rb', UP + 14, { eyes: 'normal' }, 0);
  love('rb', UP + 14, UP + 60, { snd: false });
  key('rb', UP + 18, { handF: hand('rb', 'F', 0.6, -0.55), handB: hand('rb', 'B', 0.55, -0.6), lean: 6, mouth: 'happy - spittle' }, 8);   // руки к ней
  const FX3 = 1330;
  hop('fat', UP + 20, UP + 32, FX2, FX3, 60);
  // ---- натравливает пчёл: Радужный удирает за кадр
  const SIC = UP + 44;
  key('pink', SIC - 6, { mouth: 'angry theeth', eyes: 'angry' }, 0);
  key('pink', SIC, { handB: hand('pink', 'B', 0.95, -0.25), lean: 6 }, 5);
  key('pink', SIC + 14, stance('pink', PX, -1), 8);
  SW.push({ f0: SIC, at: 'rb:butt', r: 150, lag: 5 });
  sfx('buzz', SIC, { who: 'rb', dur: 50, gain: 0.6 });
  key('rb', SIC + 8, { mouth: 'puzzlement', eyes: 'sad' }, 0);
  sfx('scared', SIC + 8, { who: 'rb', gain: 0.9 });
  key('rb', SIC + 10, { handF: hand('rb', 'F', -0.4, 0.4), handB: hand('rb', 'B', -0.3, 0.45), lean: 10, head: -8 }, 3);   // за зад
  sting('rb', SIC + 12, 'butt', 3);
  // ---- пинком Толстого — он катится в Радужного, оба улетают за кадр, улей слетает
  const KK = SIC + 18;
  key('fat', KK - 8, { mouth: 'puzzlement', eyes: 'sad' }, 0);
  kick('pink', KK, 'fat:belly', { x: PX, face: -1, hard: true });
  tumble('fat', KK + 1, KK + 26, FX3, -480, 180, -3, {});
  const HIT = KK + 5;
  ev('spark', { f: HIT, at: 'rb:body', r: 80, snd: 'boing', swing: false });
  ev('shake', { f: HIT, amp: 18, n: 12 });
  flyOff('rb', HIT + 1, HIT + 26, [RX4, GROUND], [-420, -320], { turns: 2 });
  ev('twinkle', { f: KK + 24, at: [110, 330], n: 22, size: 56 });
  HV.push({ f0: KK + 1, f1: KK + 22, a: hivePt(KK + 1, stateAt(KK + 1)), b: [-200, 120], arc: 260, spin: -Math.PI * 3 });
  // ---- пчёлы возвращаются сердечком; победа
  SW.push({ f0: KK + 40, heart: 'pink' });
  sfx('buzz', KK + 40, { who: 'pink', dur: NF - KK - 40, gain: 0.2 });
  key('pink', KK + 8, { mouth: 'happy with theeth', eyes: 'normal' }, 0);
  victory('pink', KK + 14, PX, { n: 9, stride: 140 });
};

ST.hooks.beforeChars.push((ctx, f, S, CAM) => {
  ctx.setTransform(...CAM);
  FX.tree(ctx, TX, GROUND, 0, []);
  const h = hiveAt(f, S);
  if (h.hang) {
    ctx.beginPath(); ctx.moveTo(HX0, HY0 - 110); ctx.lineTo(h.x, h.y - 50);
    ctx.lineWidth = 5; ctx.strokeStyle = '#5e3a17'; ctx.stroke();
    FX.hive(ctx, h.x, h.y, HS, h.rot);
  }
});
ST.hooks.afterChars.push((ctx, f, S, CAM) => {
  const h = hiveAt(f, S);
  ctx.setTransform(...CAM);
  if (!h.hang) {
    FX.hive(ctx, h.x, h.y, HS, h.rot);
    if (h.hand) { const { ch, st, p } = S[h.hand]; ch.draw(ctx, { ...st, p: { ...p, only: 'B' } }, CAM); ctx.setTransform(...CAM); }
  }
  for (let i = 0; i < NB; i++) {
    const b = beeAt(i, f, S);
    if (b.visible) FX.bee(ctx, b.x, b.y, b.s, f / FPS + i, b.dir);
  }
});

ST.start(BIG);
