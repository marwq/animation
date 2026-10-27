// Серия 2, ролик 08: Кровать — Розовая (слева) против Жёлтой (справа), 22 с, 24 кадра/с. Драка без ударов:
// кровать из майнкрафта как батут, одеяло-фокус со скатертью, одеяло-привидение, подушка с перьями, сон.
// Музыка превращения — один раз. Фон — вишнёвый сад.
//
//   0–2 с     шарик-Розовая и шарик-Жёлтая неподвижно стоят друг напротив друга, середина пустая
//   2–4 с     с неба падает кровать; Розовая прыгает на неё как на батут — выше, выше — и на макушку Жёлтой
//   4–5.2 с   Жёлтая «растёт» под музыку
//   5.3–8.2 с Розовая дразнится, прыгая на кровати — Жёлтая сдёргивает одеяло: Розовая кувырком на траву;
//             одеяло — сверху на неё: «привидение» бегает
//   8.2–9.5 с Розовая «растёт» — одеяло слетает
//   9.6–12.3 с прыгает через кровать как с батута, хватает подушку и кидает Жёлтой в лицо — перья —
//             Жёлтая падает спиной на кровать — засыпает — «пуф», шарик спит на кровати
//   13–16.2 с Розовая прыгает на кровать — шарик-Жёлтую подбрасывает в небо — падает Розовой на голову —
//             Розовая падает — «пуф»
//   16.3–22 с Жёлтая «растёт» и в центре, руки вверх
'use strict';

const ST = Stage({
  name: '08 Розовая vs Жёлтая',
  frames: 528,
  cast: {
    pink: { small: ['girl-verity-small', { bodyHeight: 300 }], big: ['girl-verity-big', { height: 730, splitFeet: true }],
      pivot: 337, voice: 1.35, vAngle: 50, lie: 55, color: '#ff4fc8', moods: { angry: 'angry theeth', grin: 'theeth smile', big: 'theeth smile' } },
    yel: { small: ['girl-verity-small', { bodyHeight: 300, recolor: 'yellow' }],
      big: ['verity-big-girl', { height: 730, splitFeet: true, recolor: 'yellow' }], pivot: 337, voice: 1.45, vAngle: 50, lie: 55,
      color: '#ffe23a', moods: { angry: 'angry theeth', grin: 'theeth smile', big: 'theeth smile' } },
  },
  order: ['pink', 'yel'],
  background: { theme: 'cherry', seed: 1008, sunX: 1500, sunY: 130 },
  clouds: [[150, 80, 2.4, 0, 12], [700, 220, 1.8, 1, 16], [1150, 70, 2.6, 2, 10], [1720, 250, 1.5, 0, 18]],
});
const { FPS, NF, GROUND, C, key, move, ev, sfx, hop, tumble, laugh, tremble, transform, shrink, stance, walk, turn,
  fallBack, victory, chuckle, hand, toRig, statesAt, stateAt, target } = ST;
const P = (v, f, S) => (typeof v === 'function' ? v(f, S) : typeof v === 'string' ? target(v, S) : v);

// ------------------------------------------------------------------ кровать, одеяло, подушка
const BX = 960, BW = 470, BH = BW * 0.3, BLEG = BW * 0.07;
const BTOP = GROUND - BLEG - BH * 0.55;            // верх матраса
const BED = { f0: 1e9, f1: 1e9 };                   // падает с неба f0 → f1
const DIPS = [];                                    // {f, x, amp, n} — прогиб матраса
const dipAt = (f) => { let best = [0, 0.5]; for (const d of DIPS) { const u = (f - d.f) / d.n; if (u >= 0 && u <= 1) { const a = d.amp * Math.sin(Math.PI * (1 - u) * 0.5 + Math.PI / 2 * 0) * (1 - u); if (a > best[0]) best = [a, (d.x - (BX - BW / 2)) / BW]; } } return best; };
function bounce(f, x, amp = 0.8, n = 8) { DIPS.push({ f, x, amp, n }); sfx('spring', f, { x, gain: 0.6 }); sfx('boing', f + 1, { x, gain: 0.7 }); }
let BLANKET = 1, PILLOW = true;
const CLOTH = [];         // одеяло: {f0, hand} | {f0, f1, a, b, arc} | {f0, on} | {f0, at}
const PIL = [];           // подушка: {f0, hand} | {f0, f1, a, b, spin} | {f0, gone}
const FEATH = [];         // {f, at}
const SLEEP = [];         // {who, f0, f1}
const segOf = (segs, f) => segs.filter((s) => f >= s.f0).pop();
function segPos(segs, f, S) {
  const c = segOf(segs, f);
  if (!c || c.gone) return null;
  if (c.at) return { x: c.at[0], y: c.at[1], rot: c.rot || 0 };
  if (c.hand) { if (S[c.hand].p.form !== 'big') return null; const h = C[c.hand].big.point(S[c.hand].st, 'hand' + (c.arm || 'F')); return { x: h[0], y: h[1], rot: c.rot || 0 }; }
  if (c.on) { const t = target(`${c.on}:top`, S); return { x: t[0], y: t[1], rot: 0, on: c.on }; }
  const u = E.clamp((f - c.f0) / (c.f1 - c.f0), 0, 1), a = P(c.a, c.f0, statesAt(c.f0)), b = P(c.b, f, S);
  return { x: E.lerp(a[0], b[0], u), y: E.lerp(a[1], b[1], u) - Math.sin(Math.PI * u) * (c.arc || 0), rot: u * (c.spin || 0) };
}
// одеяло: в руке висит, в полёте — развевается, на шарике — «привидение»
function drawCloth(ctx, p, f, mode) {
  ctx.save(); ctx.lineJoin = 'round'; ctx.lineWidth = 5; ctx.strokeStyle = '#111';
  const wave = (k) => Math.sin(f * 0.6 + k) * 8;
  ctx.beginPath();
  if (mode === 'on') {                               // накрыт с головой: купол, волнистый низ до земли
    const w = 330, top = p.y - 30;
    ctx.moveTo(p.x - w / 2, GROUND + 4);
    ctx.bezierCurveTo(p.x - w / 2 - 10, top + 40, p.x - w * 0.35, top - 10, p.x, top - 10);
    ctx.bezierCurveTo(p.x + w * 0.35, top - 10, p.x + w / 2 + 10, top + 40, p.x + w / 2, GROUND + 4);
    for (let i = 6; i >= 0; i--) ctx.quadraticCurveTo(p.x - w / 2 + (i + 0.5) * w / 7, GROUND + 18 + wave(i), p.x - w / 2 + i * w / 7, GROUND + 4);
  } else {                                           // висит / летит: прямоугольник с волной
    const w = 240, h = mode === 'hand' ? 230 : 200;
    ctx.moveTo(p.x - w / 2, p.y);
    ctx.quadraticCurveTo(p.x, p.y - 20 + wave(0), p.x + w / 2, p.y);
    ctx.quadraticCurveTo(p.x + w / 2 + 14 + wave(1), p.y + h / 2, p.x + w / 2, p.y + h);
    for (let i = 4; i >= 1; i--) ctx.quadraticCurveTo(p.x - w / 2 + (i - 0.5) * w / 4, p.y + h + 16 + wave(i), p.x - w / 2 + (i - 1) * w / 4, p.y + h);
    ctx.quadraticCurveTo(p.x - w / 2 - 14 + wave(2), p.y + h / 2, p.x - w / 2, p.y);
  }
  ctx.closePath();
  ctx.fillStyle = '#d92a2a'; ctx.fill(); ctx.stroke();
  ctx.save(); ctx.clip();
  ctx.fillStyle = '#b01818'; for (let i = -6; i < 8; i++) ctx.fillRect(p.x + i * 40, p.y - 80, 14, 600);
  ctx.restore();
  if (mode === 'on') {                               // глазки-прорези у привидения
    for (const k of [-1, 1]) { ctx.beginPath(); ctx.ellipse(p.x + k * 40 + 20, p.y + 70, 14, 20, 0, 0, Math.PI * 2); ctx.fillStyle = '#111'; ctx.fill(); }
  }
  ctx.restore();
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
  if (o.land !== false) { key(who, f1, { sx: 1.25, sy: 0.78 }, 1); key(who, f1 + 3, { sx: 0.94, sy: 1.07 }, 3); key(who, f1 + 7, { sx: 1, sy: 1 }, 4); }
  sfx('jump', f0 + 2, { who, gain: 0.55 });
}

const PX0 = 560, YX0 = 1360;
// ================================================================== 0–2 с: неподвижная стойка
key('pink', 0, { form: 'small', x: PX0, y: GROUND, face: 1, look: 1, eyes: 'normal', mouth: 'smile normal', sx: 1, sy: 1, rot: 0, pivot: 0, alpha: 1 }, 0);
key('yel', 0, { form: 'small', x: YX0, y: GROUND, face: -1, look: 1, eyes: 'normal', mouth: 'smile normal', sx: 1, sy: 1, rot: 0, pivot: 0, alpha: 1 }, 0);

const BIG = () => {
  // ---- 2–4 с: кровать с неба — батут — на макушку Жёлтой
  BED.f0 = 48; BED.f1 = 58;
  sfx('whoosh', 48, { x: BX, dur: 10, gain: 0.5 }); sfx('slam', 58, { x: BX, gain: 0.8 });
  ev('dust', { f: 58, x: BX, r: 120, n: 8, snd: false }); ev('shake', { f: 58, amp: 10, n: 8 });
  bounce(58, BX, 0.5, 8);
  key('pink', 52, { mouth: 'puzzlement' }, 0); key('yel', 52, { mouth: 'puzzlement' }, 0);
  key('pink', 60, { mouth: 'theeth smile', eyes: 'angry' }, 0);
  const B1 = 70, B2 = 80, HIT = 93, PBX = BX - 40;
  hopTo('pink', 60, B1, PX0, GROUND, PBX, BTOP + 12, 140, { land: false });
  bounce(B1, PBX, 0.6);
  key('pink', B1, { sx: 1.3, sy: 0.75 }, 1);
  hopTo('pink', B1 + 1, B2, PBX, BTOP + 12, PBX + 30, BTOP + 12, 260, { land: false, prep: 1 });
  bounce(B2, PBX + 30, 0.9);
  key('pink', B2, { sx: 1.35, sy: 0.72, mouth: 'happy with theeth' }, 1);
  const ytop = target('yel:top', stateAt(1))[1];
  hopTo('pink', B2 + 1, HIT, PBX + 30, BTOP + 12, YX0, ytop + 40, 300, { land: false, prep: 1 });
  sfx('bonk', HIT, { who: 'yel', gain: 1.0 });
  key('yel', HIT - 3, { mouth: 'puzzlement', eyes: 'sad' }, 0);
  key('yel', HIT, { sx: 1.6, sy: 0.55 }, 1);
  key('pink', HIT, { sx: 1.25, sy: 0.8 }, 1);
  ev('shake', { f: HIT, amp: 12, n: 8 });
  const PX1 = 560;
  hopTo('pink', HIT + 1, HIT + 16, YX0, ytop + 40, PX1, GROUND, 260);
  key('yel', HIT + 4, { sx: 0.9, sy: 1.12 }, 3); key('yel', HIT + 8, { sx: 1, sy: 1 }, 3);
  ev('stars', { who: 'yel', f0: HIT + 2, f1: HIT + 24 });
  sfx('ref:laugh', HIT + 16, { who: 'pink', gain: 0.85, pitch: 1.35 });
  key('pink', HIT + 16, { mouth: 'happy with theeth', eyes: 'normal' }, 0);

  // ---- 4–5.2 с: Жёлтая «растёт»
  const YX = 1420;
  key('yel', HIT + 4, { eyes: 'angry', mouth: 'angry theeth' }, 0);
  const YB = transform('yel', HIT + 6, YX0, YX, -1, { style: 'grow' });
  key('yel', YB, stance('yel', YX, -1), 0);
  key('yel', YB + 6, { mouth: 'theeth smile', eyes: 'angry' }, 0);
  key('pink', YB - 2, { mouth: 'puzzlement', eyes: 'sad' }, 0);

  // ---- 5.3–8.2 с: Розовая прыгает на кровати — Жёлтая сдёргивает одеяло — привидение
  key('pink', YB + 4, { mouth: 'happy with theeth', eyes: 'angry' }, 0);
  const T0 = YB + 4, PBX2 = BX + 40;
  hopTo('pink', T0, T0 + 10, PX1, GROUND, PBX2, BTOP + 12, 140, { land: false });
  for (let i = 0; i < 2; i++) { const a = T0 + 10 + i * 10; bounce(a, PBX2, 0.7); key('pink', a, { sx: 1.3, sy: 0.75 }, 1); hopTo('pink', a + 1, a + 10, PBX2, BTOP + 12, PBX2, BTOP + 12, 180, { land: false, prep: 1 }); }
  sfx('ref:laugh', T0 + 12, { who: 'pink', gain: 0.7, pitch: 1.35 });
  const YX2 = BX + BW / 2 + 140;
  walk('yel', YB + 4, YX, YX2, 2, 8, -1);
  const GR = T0 + 24, YANK = GR + 5;
  key('yel', GR - 4, { lean: 18, hip: [0, toRig('yel', 120)], head: 6 }, 4);
  key('yel', GR, { hitF: 1, hitFto: [BX + BW / 2 - 10, BTOP + 4], hitFfix: GR }, 4);
  key('yel', YANK, { hitF: 0, lean: -16, hip: [0, toRig('yel', 30)], head: -6, handF: hand('yel', 'F', -0.75, 0.2), mouth: 'happy with theeth', eyes: 'angry' }, 3, 'in2');
  const BL = { f: YANK };
  BLANKET = (f) => (f < YANK ? 1 : 0);
  CLOTH.push({ f0: YANK, hand: 'yel' });
  sfx('whoosh', YANK, { x: BX, dur: 8, gain: 0.8 }); sfx('swing', YANK - 2, { who: 'yel', gain: 0.9 });
  // Розовая (в воздухе над кроватью) — кувырком с кровати на траву
  const LND = YANK + 14, PX2 = 620;
  key('pink', YANK, { pivot: ST.CAST.pink.pivot, mouth: 'puzzlement', eyes: 'sad' }, 0);
  move('pink', YANK, { x: PBX2, y: BTOP + 12, rot: 0 });
  move('pink', YANK + 6, { y: BTOP - 120 }, 'out2');
  move('pink', LND, { x: PX2, y: GROUND, rot: -720 }, 'in2');
  key('pink', LND + 1, { rot: 0 }, 0);
  key('pink', LND, { sx: 1.35, sy: 0.7 }, 1); key('pink', LND + 5, { sx: 1, sy: 1 }, 4);
  sfx('scared', YANK + 2, { who: 'pink', gain: 0.8 }); sfx('fall', LND, { who: 'pink', gain: 0.9 });
  ev('stars', { who: 'pink', f0: LND + 2, f1: LND + 16 });
  // бросает одеяло на неё
  const TH = LND + 4, ON = TH + 12;
  key('yel', TH - 4, { handF: hand('yel', 'F', -0.3, -0.9), lean: -6 }, 4);
  key('yel', TH, { handF: hand('yel', 'F', 0.9, -0.4), lean: 12 }, 3, 'in2');
  key('yel', TH + 10, { ...stance('yel', YX2, -1), mouth: 'happy with theeth', eyes: 'normal' }, 8);
  CLOTH.push({ f0: TH, f1: ON, a: (f, S) => { const h = C.yel.big.point(statesAt(TH).yel.st, 'handF'); return [h[0], h[1]]; }, b: (f, S) => { const t = target('pink:top', S); return [t[0], t[1] - 60]; }, arc: 160 });
  CLOTH.push({ f0: ON, on: 'pink' });
  sfx('whoosh', TH, { x: 900, dur: 12, gain: 0.6 }); sfx('slap', ON, { who: 'pink', gain: 0.5 });
  // привидение мечется
  sfx('scared', ON + 2, { who: 'pink', gain: 0.8 });
  const G = [[ON + 2, PX2], [ON + 9, PX2 - 90], [ON + 16, PX2 - 40]];
  for (let i = 1; i < G.length; i++) { move('pink', G[i - 1][0], { x: G[i - 1][1], y: GROUND }); move('pink', (G[i - 1][0] + G[i][0]) / 2, { y: GROUND - 40 }, 'out2'); move('pink', G[i][0], { x: G[i][1], y: GROUND }, 'in2'); sfx('step', G[i][0], { who: 'pink', gain: 0.4 }); }
  sfx('ref:laugh', ON + 4, { who: 'yel', gain: 0.85, pitch: 1.45 });
  chuckle('yel', ON + 4, ON + 18, { mouth: 'happy with theeth' });

  // ---- 8.2–9.5 с: Розовая «растёт» — одеяло слетает
  const PX = PX2 - 40;
  key('pink', ON + 16, { eyes: 'angry', mouth: 'angry theeth' }, 0);
  const PB = transform('pink', ON + 18, PX, PX - 40, 1, { style: 'grow' });
  CLOTH.push({ f0: ON + 20, f1: ON + 34, a: (f, S) => { const t = target('pink:top', statesAt(ON + 20)); return [t[0], t[1] - 60]; }, b: [-300, 200], arc: 200 }, { f0: ON + 34, gone: true });
  sfx('whoosh', ON + 20, { x: 400, dur: 14, gain: 0.5 });
  key('pink', PB, stance('pink', PX - 40, 1), 0);
  key('pink', PB + 6, { mouth: 'theeth smile', eyes: 'angry' }, 0);
  key('yel', PB - 2, { mouth: 'puzzlement', eyes: 'sad' }, 0);

  // ---- 9.6–12.3 с: прыжок через кровать, подушка в лицо — перья — Жёлтая падает на кровать — спит — «пуф»
  const KP = C.pink.big, J0 = PB + 6, ONB = J0 + 10, OVER = ONB + 14, PX3 = YX2 + 300;
  key('pink', J0 - 4, { hip: [0, toRig('pink', 80)], lean: 10 }, 4);
  key('pink', J0, { legFfk: 1, legBfk: 1, legF: [-20, 40], legB: [20, -30], hip: [0, 8], lean: 0, handF: hand('pink', 'F', 0.6, -0.7), handB: hand('pink', 'B', -0.6, -0.7) }, 3);
  move('pink', J0, { x: PX - 40, y: GROUND }); move('pink', J0 + 5, { y: GROUND - 160 }, 'out2'); move('pink', ONB, { x: BX - 60, y: BTOP + 6 }, 'in2'); move('pink', J0 + 5, { x: (PX - 40 + BX - 60) / 2 }, 'lin');
  key('pink', ONB, { ...KP.feet(BX - 60, 1), legFfk: 0, legBfk: 0, hip: [0, toRig('pink', 60)] }, 1);
  bounce(ONB, BX - 60, 1.0, 10);
  sfx('jump', J0 + 1, { who: 'pink', gain: 0.6 });
  // хватает подушку на лету
  key('pink', ONB + 2, { legFfk: 1, legBfk: 1, legF: [-20, 40], legB: [20, -30], hip: [0, 8], handF: hand('pink', 'F', -0.3, 0.5) }, 3);
  PILLOW = (f) => f < ONB + 2;
  PIL.push({ f0: ONB + 2, hand: 'pink', rot: 0.3 });
  sfx('pop', ONB + 2, { who: 'pink', gain: 0.5 });
  move('pink', ONB + 1, { x: BX - 60, y: BTOP + 6 }); move('pink', ONB + 8, { y: GROUND - 400 }, 'out2'); move('pink', OVER, { x: PX3, y: GROUND }, 'in2'); move('pink', ONB + 8, { x: (BX - 60 + PX3) / 2 }, 'lin');
  key('pink', OVER, { ...stance('pink', PX3, -1), hip: [0, toRig('pink', 70)], handF: hand('pink', 'F', 0.5, -0.4) }, 1);
  key('pink', ONB + 6, { face: -1 }, 0);
  sfx('whoosh', ONB + 1, { who: 'pink', dur: 12, gain: 0.6 }); sfx('land', OVER, { who: 'pink', gain: 0.8 }); ev('dust', { f: OVER, x: PX3, r: 60, n: 6, snd: false });
  turn('yel', OVER + 2, 1, YX2);
  key('yel', OVER + 2, { mouth: 'puzzlement', eyes: 'sad' }, 0);
  const TH2 = OVER + 6, HIT2 = TH2 + 6;
  key('pink', TH2 - 3, { ...stance('pink', PX3, -1), handF: hand('pink', 'F', -0.4, -0.7), lean: -8 }, 3);
  key('pink', TH2, { handF: hand('pink', 'F', 0.95, -0.25), lean: 12 }, 3, 'in2');
  sfx('swing', TH2 - 2, { who: 'pink', gain: 0.9 });
  PIL.push({ f0: TH2, f1: HIT2, a: (f, S) => { const h = C.pink.big.point(statesAt(TH2).pink.st, 'handF'); return [h[0], h[1]]; }, b: (f, S) => target('yel:face', S), spin: -4 });
  PIL.push({ f0: HIT2, gone: true });
  FEATH.push({ f: HIT2, at: (f, S) => target('yel:face', S) });
  sfx('slap', HIT2, { who: 'yel', gain: 0.9 }); sfx('poof', HIT2, { who: 'yel', gain: 0.6 });
  key('pink', TH2 + 8, { ...stance('pink', PX3, -1), mouth: 'happy with theeth', eyes: 'normal' }, 8);
  const LIE = fallBack('yel', HIT2 + 2, YX2, 1, { n: 14, stars: false, mouth: 'smile normal', lift: GROUND - BTOP + 50 });
  key('yel', LIE + 4, { eyes: 'sad', mouth: 'smile normal' }, 0);
  bounce(LIE, BX + 100, 0.8, 10);
  SLEEP.push({ who: 'yel', f0: LIE + 6, f1: LIE + 60 });
  sfx('sob', LIE + 6, { who: 'yel', gain: 0.25, dur: 20, pitch: 0.6 });
  sfx('ref:laugh', LIE + 4, { who: 'pink', gain: 0.85, pitch: 1.35 });
  chuckle('pink', LIE + 4, LIE + 24, { mouth: 'happy with theeth' });
  const ysm = shrink('yel', LIE + 12, BX - 110, -1, { mouth: 'smile normal', eyes: 'sad', smoke: 380 });
  key('yel', ysm, { lean: 0, head: 0, hip: [0, 0], legF: null, legB: null, zB: null, rot: 0 }, 0);
  move('yel', ysm, { x: BX - 110, y: BTOP + 14, rot: 0 });
  SLEEP[0].f1 = ysm + 40;

  // ---- 13–16.2 с: Розовая прыгает на кровать — шарика подбрасывает — ей на голову — «пуф»
  const PJ = ysm + 8, ONB2 = PJ + 12, FLY = ONB2 + 2, TOP = FLY + 12, DOWN = TOP + 10;
  key('pink', PJ - 4, { hip: [0, toRig('pink', 80)], lean: 10, mouth: 'theeth smile', eyes: 'angry' }, 4);
  key('pink', PJ, { legFfk: 1, legBfk: 1, legF: [-20, 40], legB: [20, -30], hip: [0, 8], lean: 0, handF: hand('pink', 'F', 0.6, -0.7), handB: hand('pink', 'B', -0.6, -0.7) }, 3);
  move('pink', PJ, { x: PX3, y: GROUND }); move('pink', PJ + 6, { y: GROUND - 260 }, 'out2'); move('pink', ONB2, { x: BX + 170, y: BTOP + 6 }, 'in2'); move('pink', PJ + 6, { x: (PX3 + BX + 170) / 2 }, 'lin');
  key('pink', ONB2, { ...KP.feet(BX + 170, -1), legFfk: 0, legBfk: 0, hip: [0, toRig('pink', 90)] }, 1);
  bounce(ONB2, BX + 140, 1.2, 12);
  sfx('slam', ONB2, { x: BX, gain: 0.8 });
  // шарик-Жёлтая взлетает
  key('yel', FLY, { sx: 0.8, sy: 1.25, eyes: 'normal', mouth: 'puzzlement', pivot: ST.CAST.yel.pivot }, 1);
  SLEEP[0].f1 = FLY;
  move('yel', FLY, { x: BX - 110, y: BTOP + 14, rot: 0 }); move('yel', TOP, { x: BX + 60, y: 330, rot: 360 }, 'out2');
  sfx('scared', FLY + 1, { who: 'yel', gain: 0.8 }); sfx('whoosh', FLY, { who: 'yel', dur: 10, gain: 0.6 });
  // Розовая отскакивает на землю
  key('pink', ONB2 + 4, { hip: [0, 8], mouth: 'happy with theeth', eyes: 'normal' }, 4);
  move('pink', ONB2 + 2, { x: BX + 170, y: BTOP + 6 }); move('pink', ONB2 + 6, { y: BTOP - 60 }, 'out2'); move('pink', ONB2 + 12, { x: BX + 300, y: GROUND }, 'in2');
  key('pink', ONB2 + 12, { ...stance('pink', BX + 300, -1) }, 1);
  sfx('land', ONB2 + 12, { who: 'pink', gain: 0.6 });
  key('pink', ONB2 + 14, { look: 1, head: -14, mouth: 'happy with theeth' }, 4);
  // падает ей на голову
  const ph = (f, S) => { const t = target('pink:top', S); return [t[0], t[1] + 130]; };
  const hit3 = ph(DOWN, stateAt(DOWN));
  move('yel', TOP, { x: BX + 60, y: 330 }); move('yel', DOWN, { x: hit3[0], y: hit3[1] }, 'in2'); move('yel', DOWN, { rot: 720 }, 'lin'); key('yel', DOWN + 1, { rot: 0 }, 0);
  key('yel', DOWN, { sx: 1.3, sy: 0.75, mouth: 'angry theeth', eyes: 'angry' }, 1);
  sfx('bonk', DOWN, { who: 'pink', gain: 1.0 }); ev('shake', { f: DOWN, amp: 16, n: 10 });
  key('pink', DOWN, { hip: [0, toRig('pink', 60)], head: 10, mouth: 'puzzlement', eyes: 'sad', handF: hand('pink', 'F', 0.4, -0.7), handB: hand('pink', 'B', -0.3, -0.7) }, 2);
  ev('stars', { who: 'pink', f0: DOWN + 2, f1: DOWN + 30 });
  const YX3 = BX + 560;
  hopTo('yel', DOWN + 1, DOWN + 12, hit3[0], hit3[1], YX3, GROUND, 120);
  turn('pink', DOWN + 6, 1, BX + 300);
  const LIE2 = fallBack('pink', DOWN + 9, BX + 300, 1, { n: 12, stars: false, lift: GROUND - BTOP + 50 });
  bounce(LIE2, BX, 0.8, 10);
  const psm = shrink('pink', LIE2 + 4, BX - 20, 1, { mouth: 'puzzlement', eyes: 'sad', smoke: 420 });
  key('pink', psm, { lean: 0, head: 0, hip: [0, 0], legF: null, legB: null, zB: null, rot: 0 }, 0);
  move('pink', psm, { x: BX - 20, y: BTOP + 14, rot: 0 });
  ev('stars', { who: 'pink', f0: psm + 4, f1: psm + 24, snd: false });
  sfx('ref:laugh', DOWN + 14, { who: 'yel', gain: 0.85, pitch: 1.45 });
  laugh('yel', DOWN + 13, DOWN + 16);

  // ---- 16.3–22 с: Жёлтая «растёт», прыгает на кровать — шарик-Розовую уносит за край; в центр
  const YB2 = transform('yel', DOWN + 16, YX3, YX3, -1, { style: 'grow' });
  key('yel', YB2, stance('yel', YX3, -1), 0);
  const KY = C.yel.big, YJ = YB2 + 4, YON = YJ + 10, BXJ = BX + 150;
  key('yel', YJ - 4, { hip: [0, toRig('yel', 80)], lean: 10, mouth: 'theeth smile', eyes: 'angry' }, 4);
  key('yel', YJ, { legFfk: 1, legBfk: 1, legF: [-20, 40], legB: [20, -30], hip: [0, 8], lean: 0, handF: hand('yel', 'F', 0.6, -0.7), handB: hand('yel', 'B', -0.6, -0.7) }, 3);
  move('yel', YJ, { x: YX3, y: GROUND }); move('yel', YJ + 5, { y: GROUND - 240 }, 'out2'); move('yel', YON, { x: BXJ, y: BTOP + 6 }, 'in2'); move('yel', YJ + 5, { x: (YX3 + BXJ) / 2 }, 'lin');
  key('yel', YON, { ...KY.feet(BXJ, -1), legFfk: 0, legBfk: 0, hip: [0, toRig('yel', 90)] }, 1);
  bounce(YON, BXJ, 1.3, 12);
  sfx('slam', YON, { x: BX, gain: 0.8 }); sfx('jump', YJ + 1, { who: 'yel', gain: 0.6 });
  key('pink', YON + 1, { sx: 0.8, sy: 1.25, mouth: 'puzzlement', eyes: 'sad', pivot: ST.CAST.pink.pivot }, 1);
  move('pink', YON + 1, { x: BX - 20, y: BTOP + 14, rot: 0 }); move('pink', YON + 22, { x: -260, y: -260, rot: -1080 }, 'out');
  sfx('scared', YON + 2, { who: 'pink', gain: 0.8 }); sfx('whoosh', YON + 1, { who: 'pink', dur: 18, gain: 0.7 });
  ev('twinkle', { f: YON + 18, at: [110, 140], n: 20, size: 56 });
  const YD = YON + 10, YX4 = 1240;
  move('yel', YON + 1, { x: BXJ, y: BTOP + 6 }); move('yel', YON + 5, { y: BTOP - 120 }, 'out2'); move('yel', YD, { x: YX4, y: GROUND }, 'in2');
  key('yel', YON + 2, { legFfk: 1, legBfk: 1, legF: [-20, 40], legB: [20, -30], hip: [0, 8] }, 3);
  key('yel', YD, { ...stance('yel', YX4, -1), hip: [0, toRig('yel', 60)], mouth: 'happy with theeth', eyes: 'normal' }, 1);
  key('yel', YD + 6, { ...stance('yel', YX4, -1) }, 5);
  sfx('land', YD, { who: 'yel', gain: 0.7 });
  sfx('ref:laugh', YD + 2, { who: 'yel', gain: 0.85, pitch: 1.45 });
  const WIN = victory('yel', YD + 8, YX4, { n: 9, stride: 120 });
  window.T = { B2, HIT, YB, YANK, ON, PB, ONB, HIT2, LIE, ysm, ONB2, DOWN, LIE2, psm, YB2, WIN };
};

// ------------------------------------------------------------------ рисование
ST.hooks.beforeChars.push((ctx, f, S, CAM) => {
  ctx.setTransform(...CAM);
  if (f < BED.f0) return;
  const y = f < BED.f1 ? E.lerp(-200, GROUND, E.EASE.in2((f - BED.f0) / (BED.f1 - BED.f0))) : GROUND;
  const [dip, dx] = dipAt(f);
  const bk = typeof BLANKET === 'function' ? BLANKET(f) : BLANKET, pl = typeof PILLOW === 'function' ? PILLOW(f) : PILLOW;
  FX.mcBed(ctx, BX, y, BW, dip, dx, { blanket: bk, pillow: pl });
  const c = segOf(CLOTH, f);
  if (c && c.at) drawCloth(ctx, { x: c.at[0], y: c.at[1] }, f, 'fly');
});
ST.hooks.afterChars.push((ctx, f, S, CAM) => {
  ctx.setTransform(...CAM);
  const c = segOf(CLOTH, f);
  if (c && !c.at) { const p = segPos(CLOTH, f, S); if (p) drawCloth(ctx, p, f, c.on ? 'on' : c.hand ? 'hand' : 'fly'); }
  const pp = segPos(PIL, f, S);
  if (pp) FX.pillow(ctx, pp.x, pp.y, pp.rot, 150, 98);
  for (const fe of FEATH) { const at = P(fe.at, fe.f, statesAt(fe.f)); FX.feathers(ctx, at[0], at[1], (f - fe.f) / FPS, fe.f, 22, 1.2); }
  for (const s of SLEEP) {
    if (f < s.f0 || f >= s.f1) continue;
    const big = S[s.who].p.form === 'big', n = big ? C[s.who].big.point(S[s.who].st, 'face') : target(`${s.who}:face`, S);
    const r = (big ? 40 : 26) * (0.4 + 0.6 * Math.abs(Math.sin((f - s.f0) * 0.12)));
    FX.sleepBubble(ctx, n[0] + (big ? 30 : 10), n[1] - (big ? 30 : 0), r);
  }
});

ST.start(BIG);
