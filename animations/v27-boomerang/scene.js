// Ролик 27: Бумеранг — Скелет (новый маленький, v2) против Розовой, 25 с, 24 кадра/с. Драка мягкая:
// без ударов — пузыри, бумеранг, который возвращается хозяину по голове, чих. Превращения «рост» под
// присланную музыку (ускорена в 1.5 раза). Фон «майнкрафт», тема «закат».
//
//   0–1.8 с   шарик-Скелет (слева) и шарик-Розовая (справа)
//   2–3.6 с   Розовая выдувает пузырь — Скелет внутри, его поднимает, пузырь лопается — шлёп на траву
//   3.75–5 с  Скелет «растёт» под музыку
//   5.5–8.5 с бросает бумеранг — шарик-Розовая подпрыгивает, бумеранг возвращается Скелету по голове
//   9.4–10.6 с Розовая «растёт» под музыку — Скелет влюблён
//   11–14 с   дарит цветок — она нюхает и чихает: Скелета сдувает назад; цветок у неё в волосах
//   15.5–19 с снова бумеранг — она приседает, бумеранг опять прилетает ему по голове
//   20–24 с   она выдувает огромный пузырь — Скелета уносит в небо; Розовая в центре, руки вверх
'use strict';

const ST = Stage({
  name: 'v27-boomerang',
  cast: {
    skel: { small: ['skeleton-verity-small', { scale: 0.455 }], big: ['skeleton-verity-big', { height: 730 }], pivot: 325,
      voice: 0.9, lie: 60, color: '#f3f1e6', moods: { angry: 'angry theeth', grin: 'happy with theeth', big: 'theeth smile' } },
    pink: { small: ['girl-verity-small', { bodyHeight: 300 }], big: ['girl-verity-big', { height: 730, splitFeet: true }],
      pivot: 337, voice: 1.35, vAngle: 50, color: '#ff4fc8', moods: { angry: 'angry theeth', grin: 'theeth smile', big: 'theeth smile' } },
  },
  transformMusic: 'transform-music2',     // как было при рендере (ускоренная в 1.5 раза)
  order: ['skel', 'pink'],
  background: { theme: 'sunset', seed: 8, sunX: 1500, sunY: 190 },
  clouds: [[120, 90, 2.4, 0, 14], [690, 200, 1.8, 1, 18], [1150, 60, 2.6, 2, 12], [1620, 280, 1.6, 0, 20], [420, 320, 1.4, 1, 16]],
});
const { FPS, NF, GROUND, C, key, move, ev, sfx, hop, laugh, tremble, transform, love, stance, walk, turn,
  recoil, duck, getUp, victory, chuckle, spinAround, hand, toRig, statesAt, stateAt, target } = ST;

const P = (v, f, S) => (typeof v === 'function' ? v(f, S) : typeof v === 'string' ? target(v, S) : v);
const lerp2 = (a, b, u) => [E.lerp(a[0], b[0], u), E.lerp(a[1], b[1], u)];

// ------------------------------------------------------------------ предметы в руках и в полёте
// у каждого предмета — сегменты по кадрам: {f0, hand: кто, rot} | {f0, at: [x, y], rot} | {f0, on: кто, dx, dy, rot, s}
// | {f0, f1, path: (u, S) => [x, y], spin} | {f0, gone}
function prop(draw, size) { return { draw, size, segs: [] }; }
const BOOM = prop('boomerang', 130), FLOW = prop('flower', 120), WAND = prop('bubbleWand', 120);
const PROPS = [BOOM, FLOW, WAND];
const propAt = (o, f, S) => {
  let cur = null;
  for (const c of o.segs) if (f >= c.f0) cur = c;
  if (!cur || cur.gone) return null;
  if (cur.hand) {
    const h = C[cur.hand].big.point(S[cur.hand].st, 'handB');
    return { x: h[0], y: h[1], rot: typeof cur.rot === 'function' ? cur.rot(f) : cur.rot || 0, hand: cur.hand };
  }
  if (cur.at) return { x: cur.at[0], y: cur.at[1], rot: cur.rot || 0 };
  if (cur.on) { const t = target(`${cur.on}:top`, S); return { x: t[0] + cur.dx, y: t[1] + cur.dy, rot: cur.rot, s: cur.s }; }
  const u = E.clamp((f - cur.f0) / (cur.f1 - cur.f0), 0, 1), p = cur.path(u, S);
  return { x: p[0], y: p[1], rot: (cur.rot0 || 0) + (cur.spin || 0) * u };
};
// ключи наклона предмета в руке: [кадр, радианы]
const rotKeys = (ks) => (f) => {
  if (f <= ks[0][0]) return ks[0][1];
  for (let i = 1; i < ks.length; i++) if (f < ks[i][0]) return E.lerp(ks[i - 1][1], ks[i][1], E.EASE.io((f - ks[i - 1][0]) / (ks[i][0] - ks[i - 1][0])));
  return ks[ks.length - 1][1];
};

// бумеранг: от кулака — низом к дальней точке, потом верхом обратно хозяину в макушку
function boomerangFlight(f, f1, far, who) {
  const S0 = statesAt(f);
  const s = C[who].big.point(S0[who].st, 'handB');
  BOOM.segs.push({ f0: f, f1, spin: Math.PI * 2 * 7, path: (u, S) => {
    const head = target(`${who}:top`, S);
    if (u < 0.5) {
      const v = u / 0.5;
      return [s[0] + (far[0] - s[0]) * (1 - Math.cos(Math.PI * v)) / 2, E.lerp(s[1], far[1], Math.sin(Math.PI * v / 2))];
    }
    const w = (u - 0.5) / 0.5;
    return [far[0] + (head[0] - far[0]) * (1 - Math.cos(Math.PI * w)) / 2, E.lerp(far[1], head[1] - 20, w) - 230 * Math.sin(Math.PI * w)];
  } });
  sfx('whirr', f, { who, dur: f1 - f, gain: 0.35 });
}

// ------------------------------------------------------------------ пузыри
// {f0, f1, from, to, r0, r1} — летит и растёт; {f0, on: кто, r} — вокруг тела; {f0, pop}
const BUBS = [];
const bubAt = (b, f, S) => {
  let cur = null;
  for (const c of b) if (f >= c.f0) cur = c;
  if (!cur) return null;
  if (cur.pop) { const c = target(`${cur.who}:body`, statesAt(cur.f0)); return { pop: cur.f0, x: c[0], y: c[1] + (cur.dy || 0), r: cur.r }; }
  if (cur.on) { const c = target(`${cur.on}:body`, S); return { x: c[0], y: c[1] + (cur.dy || 0), r: cur.r }; }
  const u = E.clamp((f - cur.f0) / (cur.f1 - cur.f0), 0, 1);
  const a = P(cur.from, cur.f0, statesAt(cur.f0)), z = P(cur.to, f, S);
  const p = lerp2(a, z, E.EASE.io(u));
  return { x: p[0], y: p[1] - Math.sin(Math.PI * u) * (cur.arc || 0), r: E.lerp(cur.r0, cur.r1, u) };
};
function popBubble(b, f, who) {
  const last = b[b.length - 1];                    // место — в момент лопания (ригов ещё может не быть)
  b.push({ f0: f, pop: true, who, r: last.r, dy: last.dy });
  sfx('pop', f, { who, gain: 1.0 });
}

const SS = 560, PS = 1360;
// ================================================================== 0–1.8 с: стойка
key('skel', 0, { form: 'small', x: SS, y: GROUND, face: 1, look: 1, eyes: 'normal', mouth: 'smile normal', sx: 1, sy: 1, rot: 0 }, 0);
key('pink', 0, { form: 'small', x: PS, y: GROUND, face: -1, look: 1, eyes: 'normal', mouth: 'smile normal', sx: 1, sy: 1, rot: 0 }, 0);

// ================================================================== 2–3.6 с: пузырь — Скелета поднимает
key('pink', 36, { mouth: 'theeth smile', eyes: 'angry' }, 0);
sfx('ref:grin-eee', 36, { who: 'pink', gain: 0.5, pitch: 1.3 });
key('pink', 42, { mouth: 'puzzlement', mouthK: 1.5, sx: 1.08, sy: 0.95 }, 4);          // надула щёки
key('pink', 50, { mouthK: 1, sx: 0.96, sy: 1.04 }, 3);
key('pink', 56, { sx: 1, sy: 1, mouth: 'theeth smile' }, 4);
const B1 = [{ f0: 48, f1: 62, from: 'pink:lips', to: 'skel:body', r0: 22, r1: 200 }, { f0: 62, on: 'skel', r: 200 }];
BUBS.push(B1);
sfx('inflate', 46, { who: 'pink', dur: 16, gain: 0.5 });
key('skel', 56, { mouth: 'puzzlement', eyes: 'sad' }, 0);
move('skel', 62, { x: SS, y: GROUND });
move('skel', 72, { x: SS - 10, y: GROUND - 110 }, 'out2');
move('skel', 80, { x: SS + 10, y: GROUND - 170 }, 'io');
sfx('ref:grin-eee', 66, { who: 'pink', gain: 0.4, pitch: 1.45 });
popBubble(B1, 80, 'skel');
move('skel', 88, { x: SS, y: GROUND }, 'in2');
key('skel', 88, { sx: 1.3, sy: 0.72 }, 1);
key('skel', 94, { sx: 1, sy: 1 }, 5);
sfx('land', 88, { who: 'skel', gain: 0.8 });
sfx('hurt', 89, { who: 'skel', gain: 0.6 });
ev('stars', { who: 'skel', f0: 90, f1: 112, snd: false });
key('pink', 82, { mouth: 'happy with theeth' }, 0);
sfx('ref:laugh', 84, { who: 'pink', gain: 0.85, pitch: 1.35 });
laugh('pink', 84, 108);

// ================================================================== 3.75–5 с: Скелет «растёт»
const SX = 520;
const SB = transform('skel', 90, SS, SX, 1, { style: 'grow', love: 'pink', loveDur: 36 });

// ================================================================== 9.4–10.6 с: Розовая «растёт»
const PX = 1330;
const PB = transform('pink', 226, PS, PX, -1, { style: 'grow', love: 'skel', loveDur: 66 });

const BIG = () => {
  key('skel', SB, stance('skel', SX, 1), 0);
  key('skel', SB + 6, { mouth: 'happy with theeth', eyes: 'normal' }, 0);
  // ---- бумеранг №1: достал из-за спины, бросок — она подпрыгивает, бумеранг ему по голове
  const GET = SB + 12, T1 = SB + 32, R1 = T1 + 46;
  key('skel', GET, { handB: hand('skel', 'B', -0.55, 0.35) }, 6);
  BOOM.segs.push({ f0: GET + 6, hand: 'skel', rot: rotKeys([[GET + 6, 0.4], [T1 - 6, -0.9], [T1, 1.2]]) });
  key('skel', GET + 14, { handB: hand('skel', 'B', 0.45, -0.5), mouth: 'theeth smile' }, 8);
  key('skel', T1 - 8, { handB: hand('skel', 'B', -0.6, -0.7), lean: -10 }, 7);
  key('skel', T1, { handB: hand('skel', 'B', 0.95, -0.25), lean: 12 }, 4, 'in2');
  key('skel', T1 + 14, { ...stance('skel', SX, 1), mouth: 'happy with theeth' }, 10);
  sfx('swing', T1 - 4, { who: 'skel', gain: 0.7 });
  boomerangFlight(T1, R1, [1600, GROUND - 160], 'skel');
  hop('pink', T1 + 6, T1 + 26, PS, PS, 250);
  key('pink', T1 + 2, { mouth: 'puzzlement', eyes: 'sad' }, 0);
  key('pink', T1 + 28, { mouth: 'happy with theeth', eyes: 'normal' }, 0);
  key('skel', R1 - 10, { mouth: 'puzzlement' }, 0);
  ev('spark', { f: R1, at: 'skel:top', r: 60, snd: 'bonk', swing: false, hurt: false });
  sfx('hurt', R1 + 2, { who: 'skel', gain: 0.6 });
  key('skel', R1, { head: -14, lean: -6, hip: [0, toRig('skel', 30)], eyes: 'sad' }, 2, 'out');
  key('skel', R1 + 12, { head: 0, lean: 0, hip: [0, 8] }, 8);
  ev('stars', { who: 'skel', f0: R1 + 2, f1: R1 + 34 });
  const BX = SX + 190;
  BOOM.segs.push({ f0: R1, f1: R1 + 12, rot0: 0, spin: Math.PI * 3, path: (u, S) => {
    const t = target('skel:top', statesAt(R1));
    return [E.lerp(t[0], BX, u), E.lerp(t[1], GROUND - 18, u * u) - Math.sin(Math.PI * u) * 90];
  } });
  BOOM.segs.push({ f0: R1 + 12, at: [BX, GROUND - 18], rot: Math.PI * 3 });
  sfx('land', R1 + 12, { x: BX, gain: 0.5 });
  sfx('ref:laugh', R1 + 4, { who: 'pink', gain: 0.85, pitch: 1.35 });
  laugh('pink', R1 + 4, R1 + 26);

  // ---- Розовая большая; Скелет влюблён — цветок
  key('pink', PB, stance('pink', PX, -1), 0);
  key('pink', PB + 6, { mouth: 'theeth smile', eyes: 'normal' }, 0);
  const SX1 = 760, FL = PB + 8, PX2 = 1230;
  key('skel', FL, { handB: hand('skel', 'B', -0.55, 0.35) }, 5);
  FLOW.segs.push({ f0: FL + 6, hand: 'skel', rot: 0.25 });
  key('skel', FL + 12, { handB: hand('skel', 'B', 0.55, -0.35), mouth: 'happy - spittle' }, 8);
  walk('skel', FL + 14, SX, SX1, 3, 10, 1, false);
  const OFFER = FL + 48, TAKE = OFFER + 10;
  key('skel', OFFER, { handB: hand('skel', 'B', 0.95, -0.3), lean: 10 }, 8);
  walk('pink', OFFER - 12, PX, PX2, 1, 10, -1);                    // шагнула навстречу
  const give = C.skel.big.point(stateAt(TAKE).skel.st, 'handB');
  key('pink', TAKE, { hitB: 1, hitBto: [give[0] + 6, give[1] - 40], hitBfix: TAKE }, 7);
  FLOW.segs.push({ f0: TAKE, hand: 'pink', rot: rotKeys([[TAKE, -0.25], [TAKE + 16, -0.55]]) });
  sfx('pop', TAKE, { who: 'pink', gain: 0.4 });
  key('skel', TAKE + 6, { ...stance('skel', SX1, 1), lean: 0, mouth: 'happy - spittle' }, 8);
  // нюхает — и чихает: Скелета сдувает назад
  const SNIFF = TAKE + 14, lips = target('pink:lips', stateAt(SNIFF));
  key('pink', SNIFF, { hitB: 1, hitBto: [lips[0] + 46, lips[1] + 70], hitBfix: SNIFF, mouth: 'happy - spittle', head: 6 }, 8);
  sfx('sparkle', SNIFF + 4, { who: 'pink', gain: 0.6 });
  ev('twinkle', { f: SNIFF + 4, at: [lips[0] - 30, lips[1] - 60], n: 14, size: 34, snd: false });
  const ACH = SNIFF + 14, CHOO = ACH + 15;
  sfx('sneeze', ACH, { who: 'pink', gain: 1.0, pitch: 1.1 });
  key('pink', ACH, { head: -14, lean: -8, mouth: 'happy open mouth', eyes: 'sad' }, 10);
  key('pink', CHOO, { head: 14, lean: 12, mouth: 'puzzlement', hitB: 0, handB: hand('pink', 'B', 0.3, 0.3) }, 2, 'in2');
  key('pink', CHOO + 10, { ...stance('pink', PX2, -1), mouth: 'theeth smile', eyes: 'normal' }, 8);
  ev('wind', { f0: CHOO, f1: CHOO + 20, x0: lips[0] - 60, x1: 300, snd: false });
  sfx('gust', CHOO, { who: 'pink', dur: 18, gain: 0.7 });
  const SX2 = 560;
  recoil('skel', CHOO + 2, SX1, SX2, 1, { ret: 26, mouth: 'puzzlement' });
  key('skel', CHOO + 2, { mouth: 'puzzlement', eyes: 'sad' }, 0);
  sfx('scared', CHOO + 3, { who: 'skel', gain: 0.7 });
  // цветок — ей в волосы
  FLOW.segs.push({ f0: CHOO + 1, on: 'pink', dx: -60, dy: 70, rot: -0.5, s: 90 });
  sfx('pop', CHOO + 1, { who: 'pink', gain: 0.3 });

  // ---- бумеранг №2: поднял с травы, бросок — она приседает, бумеранг ему по голове
  const UP2 = CHOO + 34;
  key('skel', UP2 - 8, { lean: 30, hip: [0, toRig('skel', 140)], head: 10, mouth: 'theeth smile', eyes: 'angry' }, 8);
  key('skel', UP2, { hitB: 1, hitBto: [BX, GROUND - 30], hitBfix: UP2 }, 6);
  const T2 = UP2 + 26, R2 = T2 + 46;
  BOOM.segs.push({ f0: UP2, hand: 'skel', rot: rotKeys([[UP2, Math.PI * 3], [UP2 + 12, 0.4], [T2 - 6, -0.9], [T2, 1.2]]) });
  key('skel', UP2 + 12, { ...stance('skel', SX2, 1), hitB: 0, handB: hand('skel', 'B', 0.45, -0.5) }, 10);
  key('skel', T2 - 8, { handB: hand('skel', 'B', -0.6, -0.7), lean: -10 }, 7);
  key('skel', T2, { handB: hand('skel', 'B', 0.95, -0.25), lean: 12, mouth: 'happy with theeth' }, 4, 'in2');
  key('skel', T2 + 14, { ...stance('skel', SX2, 1), mouth: 'happy with theeth' }, 10);
  sfx('swing', T2 - 4, { who: 'skel', gain: 0.7 });
  boomerangFlight(T2, R2, [1600, 220], 'skel');
  key('pink', T2 + 2, { mouth: 'puzzlement' }, 0);
  duck('pink', T2 + 6, T2 + 20, PX2, -1, 240);
  key('skel', R2 - 10, { mouth: 'puzzlement' }, 0);
  ev('spark', { f: R2, at: 'skel:top', r: 60, snd: 'bonk', swing: false, hurt: false });
  sfx('hurt', R2 + 2, { who: 'skel', gain: 0.6 });
  const sp = spinAround('skel', R2 + 1, SX2, 1, { n: 4, stars: 30 });
  BOOM.segs.push({ f0: R2, f1: R2 + 12, rot0: 0, spin: Math.PI * 3, path: (u, S) => {
    const t = target('skel:top', statesAt(R2));
    return [E.lerp(t[0], SX2 - 200, u), E.lerp(t[1], GROUND - 18, u * u) - Math.sin(Math.PI * u) * 90];
  } });
  BOOM.segs.push({ f0: R2 + 12, at: [SX2 - 200, GROUND - 18], rot: Math.PI * 3 });
  sfx('land', R2 + 12, { x: SX2 - 200, gain: 0.5 });
  key('pink', R2 + 4, { mouth: 'happy with theeth', eyes: 'normal' }, 0);
  sfx('ref:laugh', R2 + 6, { who: 'pink', gain: 0.85, pitch: 1.35 });
  chuckle('pink', R2 + 6, R2 + 28, { mouth: 'happy with theeth' });

  // ---- огромный пузырь — Скелета уносит в небо
  const WG = R2 + 26, BL = WG + 22;
  key('pink', WG, { handB: hand('pink', 'B', -0.4, 0.4) }, 5);
  WAND.segs.push({ f0: WG + 5, hand: 'pink', rot: rotKeys([[WG + 5, 0], [BL - 6, -1.1]]) });
  const lp = target('pink:lips', stateAt(BL));
  key('pink', BL - 6, { hitB: 1, hitBto: [lp[0] + 29, lp[1] + 45], hitBfix: BL - 6, mouth: 'puzzlement', mouthK: 1.3 }, 8);
  const ring = (f, S) => { const h = C.pink.big.point(S.pink.st, 'handB'); return [h[0] - 89, h[1] - 45]; };
  const CAP = BL + 24;
  const B2 = [{ f0: BL, f1: BL + 8, from: ring, to: ring, r0: 18, r1: 90 },
    { f0: BL + 8, f1: CAP, from: ring, to: 'skel:body', r0: 90, r1: 480 }, { f0: CAP, on: 'skel', r: 480, dy: -40 }];
  BUBS.push(B2);
  sfx('inflate', BL, { who: 'pink', dur: 24, gain: 0.6 });
  key('pink', BL + 10, { hitB: 0, mouthK: 1, mouth: 'theeth smile', handB: hand('pink', 'B', 0.3, 0.2) }, 6);
  key('skel', CAP - 4, { mouth: 'puzzlement', eyes: 'sad' }, 0);
  const FLY = CAP + 4;
  move('skel', FLY, { x: SX2, y: GROUND });
  move('skel', FLY + 60, { x: SX2 - 520, y: GROUND - 1500 }, 'in2');
  key('skel', FLY + 2, { legFfk: 1, legBfk: 1, legF: [-15, 30], legB: [20, 25], handF: hand('skel', 'F', 0.6, -0.8),
    handB: hand('skel', 'B', 0.2, 0.5) }, 6);
  for (let f = FLY + 12; f < FLY + 56; f += 10) key('skel', f, { handF: hand('skel', 'F', (f / 10) % 2 < 1 ? 0.75 : 0.4, -0.85) }, 5);
  love('skel', FLY + 10, FLY + 60);
  sfx('whoosh', FLY + 4, { who: 'skel', dur: 30, gain: 0.4 });
  ev('twinkle', { f: FLY + 50, at: [380, 90], n: 22, size: 56 });
  victory('pink', FLY + 6, PX2, { n: 9, stride: 125 });
};

ST.hooks.afterChars.push((ctx, f, S, CAM) => {
  ctx.setTransform(...CAM);
  for (const o of PROPS) {
    const p = propAt(o, f, S);
    if (!p) continue;
    ctx.setTransform(...CAM);
    FX[o.draw](ctx, p.x, p.y, p.s || o.size, p.rot);
    if (p.hand) { const { ch, st, p: pp } = S[p.hand]; ch.draw(ctx, { ...st, p: { ...pp, only: 'B' } }, CAM); }
  }
  ctx.setTransform(...CAM);
  for (const b of BUBS) {
    const q = bubAt(b, f, S);
    if (!q) continue;
    if (q.pop !== undefined) FX.bubblePop(ctx, q.x, q.y, q.r, (f - q.pop) / 12);
    else FX.soapBubble(ctx, q.x, q.y, q.r, f / FPS);
  }
});

ST.start(BIG);
