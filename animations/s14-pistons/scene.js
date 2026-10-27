// Серия 2, ролик 14: Поршни — Розовая (слева) против Толстого (справа), 22 с, 24 кадра/с. Драка без ударов:
// поршни из майнкрафта вырастают из земли и подбрасывают того, кто на них стоит.
// Музыка превращения — один раз. Фон — луг.
//
//   0–2 с     шарик-Розовая и Толстый неподвижно стоят друг напротив друга, середина пустая
//   2–3.7 с   из земли вырастают два поршня; Толстый запрыгивает на правый — его подбрасывает — падает на Розовую
//   4.2–5.2 с Розовая «растёт» под музыку — Толстый влюблён
//   5.5–9.7 с влюблённый Толстый прыгает на левый поршень к её лицу — она топает — поршень швыряет его в небо —
//             он падает ей на голову — падает — «пуф»
//   9.8–13.4 с шарик-Розовая на поршень — её подбрасывает — падает Толстому на голову — «растёт» снова, он опять влюблён
//   13.6–17 с Толстый на правый поршень, чтобы прыгнуть к ней, — она топает — он улетает в небо, падает на левый
//             поршень — топ — улетает за край
//   17–22 с   Розовая в центре, руки вверх
'use strict';

const ST = Stage({
  name: '14 Розовая vs Толстый',
  frames: 528,
  cast: {
    pink: { small: ['girl-verity-small', { bodyHeight: 300 }], big: ['girl-verity-big', { height: 730, splitFeet: true }],
      pivot: 337, voice: 1.35, vAngle: 50, lie: 55, color: '#ff4fc8', moods: { angry: 'angry theeth', grin: 'theeth smile', big: 'theeth smile' } },
    fat: { small: ['fat-verity-small', { bodyHeight: 450 }], pivot: 508, voice: 0.75, moods: { love: 'happy' } },
  },
  order: ['fat', 'pink'],
  background: { theme: 'meadow', seed: 1014, sunX: 1500, sunY: 130 },
  clouds: [[150, 80, 2.4, 0, 12], [700, 220, 1.8, 1, 16], [1150, 70, 2.6, 2, 10], [1720, 250, 1.5, 0, 18]],
});
const { FPS, NF, GROUND, C, key, move, ev, sfx, hop, laugh, transform, shrink, stance, walk,
  stomp, victory, chuckle, hand, statesAt, target } = ST;

// ------------------------------------------------------------------ поршни
const PS = 160;
const PIS = { A: { x: 900, up: 48, down: 0, fires: [] }, B: { x: 1300, up: 50, down: 0, fires: [] } };
const pGrow = (p, f) => (f < p.up ? 0 : p.down && f >= p.down ? 1 - E.clamp((f - p.down) / 8, 0, 1) : E.EASE.out2(E.clamp((f - p.up) / 8, 0, 1)));
function pExt(p, f) {
  let e = 0;
  for (const fe of p.fires) {
    const d = f - fe;
    if (d < 0) continue;
    e = d < 3 ? (d + 1) / 3 : d < 12 ? 1 : d < 18 ? 1 - (d - 12) / 6 : 0;
  }
  return e;
}
const TOP0 = GROUND - PS * 1.25, TOP1 = TOP0 - PS * 0.9;   // верх головы поршня: убран / выдвинут
function fire(id, f) {
  const p = PIS[id];
  p.fires.push(f);
  sfx('whoosh', f, { x: p.x, dur: 5, gain: 0.55 });
  sfx('slam', f, { x: p.x, gain: 0.55, pitch: 1.4 });
  sfx('spring', f + 1, { x: p.x, gain: 0.45 });
  sfx('slide', f + 12, { x: p.x, gain: 0.3, pitch: 1.3 });
  ev('dust', { f, x: p.x, r: 40, n: 4, snd: false });
}
function rise(id) {
  const p = PIS[id];
  sfx('slide', p.up, { x: p.x, gain: 0.6, pitch: 0.8 });
  sfx('land', p.up + 8, { x: p.x, gain: 0.6, pitch: 0.8 });
  ev('dust', { f: p.up + 2, x: p.x, r: 70, n: 7, snd: false });
  ev('shake', { f: p.up + 8, amp: 6, n: 6 });
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
  if (o.land === 'soft') { key(who, f1, { sx: 1.22, sy: 0.82 }, 1); key(who, f1 + 3, { sx: 1.1, sy: 0.9 }, 3); sfx('land', f1, { who, gain: 0.5 }); }
  else if (o.land !== false) { key(who, f1, { sx: 1.25, sy: 0.78 }, 1); key(who, f1 + 3, { sx: 0.94, sy: 1.07 }, 3); key(who, f1 + 7, { sx: 1, sy: 1 }, 4); sfx('land', f1, { who, gain: 0.5 }); }
  if (o.snd !== false) sfx('jump', f0 + 2, { who, gain: 0.55 });
}
// поршень подбрасывает того, кто на нём стоит: 3 кадра вверх с головой поршня, дальше полёт по дуге
function launch(who, id, fe, n, x1, y1, peak, o = {}) {
  const p = PIS[id];
  fire(id, fe);
  move(who, fe, { x: p.x, y: TOP0 });
  key(who, fe, { sx: 1.25, sy: 0.8 }, 1);
  move(who, fe + 3, { y: TOP1 }, 'lin');
  key(who, fe + 3, { sx: 0.8, sy: 1.25 }, 2);
  key(who, fe + 9, { sx: 1, sy: 1 }, 5);
  const f1 = fe + 3 + n;
  if (peak === null) move(who, f1, { y: y1 }, 'out2');
  else { const mid = Math.round(fe + 3 + n * (o.k || 0.45)); move(who, mid, { y: peak }, 'out2'); move(who, f1, { y: y1 }, 'in2'); }
  move(who, f1, { x: x1 }, 'lin');
  if (o.spin) { key(who, fe + 3, { pivot: ST.CAST[who].pivot }, 0); move(who, fe + 3, { rot: 0 }); move(who, f1, { rot: o.spin }, 'lin'); }
  sfx('whoosh', fe + 3, { who, dur: n * 0.7, gain: 0.5 });
  return f1;
}

const PX0 = 560, FX0 = 1360;
// ================================================================== 0–2 с: неподвижная стойка
key('pink', 0, { form: 'small', x: PX0, y: GROUND, face: 1, look: 1, eyes: 'normal', mouth: 'smile normal', sx: 1, sy: 1, rot: 0, pivot: 0, alpha: 1 }, 0);
key('fat', 0, { form: 'small', x: FX0, y: GROUND, face: -1, look: 1, eyes: 'normal', mouth: 'smile normal', sx: 1, sy: 1, rot: 0, pivot: 0 }, 0);

const BIG = () => {
  // ---- 2–3.7 с: поршни из земли — Толстый на правый — его подбрасывает — падает на Розовую
  rise('A'); rise('B');
  key('pink', 50, { mouth: 'puzzlement' }, 0); key('fat', 50, { mouth: 'puzzlement' }, 0);
  key('fat', 56, { mouth: 'theeth smile', eyes: 'angry' }, 0);
  sfx('ref:grin-eee', 56, { who: 'fat', gain: 0.4, pitch: 0.8 });
  hopTo('fat', 58, 68, FX0, GROUND, PIS.B.x, TOP0, 120, { land: 'soft' });
  const F1 = 72;
  key('pink', F1, { mouth: 'puzzlement', eyes: 'sad' }, 0);
  const LAND = launch('fat', 'B', F1, 15, PX0 + 30, GROUND - 115, GROUND - 380);
  key('fat', F1 + 4, { mouth: 'happy', eyes: 'normal' }, 0);
  sfx('ref:laugh', F1 + 4, { who: 'fat', gain: 0.7, pitch: 0.75 });
  key('pink', LAND, { sx: 1.75, sy: 0.42 }, 1);
  key('fat', LAND, { sx: 1.45, sy: 0.75 }, 1);
  sfx('slam', LAND, { who: 'pink', gain: 1.0 }); sfx('squish', LAND, { who: 'pink', gain: 0.8 });
  ev('shake', { f: LAND, amp: 16, n: 10 }); ev('dust', { f: LAND, x: PX0, r: 70, n: 8, snd: false });
  const FX2 = 1580;
  move('fat', LAND + 1, { x: PX0 + 30, y: GROUND - 115 });
  move('fat', LAND + 6, { y: GROUND - 300 }, 'out2');
  move('fat', LAND + 13, { y: GROUND }, 'in2');
  move('fat', LAND + 13, { x: FX2 }, 'lin');
  key('fat', LAND + 4, { sx: 0.9, sy: 1.12 }, 3);
  key('fat', LAND + 13, { sx: 1.25, sy: 0.82 }, 1); key('fat', LAND + 18, { sx: 1, sy: 1 }, 4);
  sfx('land', LAND + 13, { who: 'fat', gain: 0.7 });
  key('pink', LAND + 14, { sx: 1, sy: 1 }, 5, 'out'); sfx('boing', LAND + 14, { who: 'pink', gain: 0.6 });
  ev('stars', { who: 'pink', f0: LAND + 12, f1: LAND + 26 });
  key('fat', LAND + 13, { mouth: 'happy', eyes: 'normal' }, 0);
  sfx('ref:laugh', LAND + 14, { who: 'fat', gain: 0.85, pitch: 0.75 });
  laugh('fat', LAND + 16, LAND + 32);

  // ---- 4.2–5.2 с: Розовая «растёт» — Толстый влюблён
  const PX = 560;
  key('pink', LAND + 7, { eyes: 'angry', mouth: 'angry theeth' }, 0);
  const PB = transform('pink', LAND + 8, PX0, PX, 1, { style: 'grow', love: 'fat', loveDur: 52 });
  key('pink', PB, stance('pink', PX, 1), 0);
  key('pink', PB + 6, { mouth: 'theeth smile', eyes: 'normal' }, 0);

  // ---- 5.5–9.7 с: влюблённый Толстый — на левый поршень к её лицу; топ — поршень швыряет его в небо
  hopTo('fat', PB + 6, PB + 18, FX2, GROUND, PIS.A.x, TOP0, 150);
  sfx('kiss', PB + 22, { who: 'fat', gain: 0.8 });
  ev('hearts', { who: 'fat', f0: PB + 20, f1: PB + 40, snd: false });
  key('fat', PB + 20, { sx: 1.05, sy: 0.95 }, 3); key('fat', PB + 25, { sx: 0.96, sy: 1.04 }, 3); key('fat', PB + 30, { sx: 1, sy: 1 }, 3);
  key('pink', PB + 18, { mouth: 'puzzlement', head: -6, lean: -6 }, 5);
  key('pink', PB + 25, { mouth: 'theeth smile', eyes: 'angry', head: 0, lean: 0 }, 4);
  sfx('ref:grin-eee', PB + 25, { who: 'pink', gain: 0.4, pitch: 1.35 });
  const ST1 = stomp('pink', PB + 29, PX, PX, 1, { n: 10, h: 60 });
  const UP = launch('fat', 'A', ST1 + 1, 11, PX - 40, -420, null);
  key('fat', ST1 + 2, { mouth: 'puzzlement', eyes: 'sad' }, 0);
  sfx('scared', ST1 + 3, { who: 'fat', gain: 0.8 });
  // смеётся, глядя вверх
  key('pink', ST1 + 12, { mouth: 'happy with theeth', eyes: 'normal' }, 0);
  sfx('ref:laugh', ST1 + 12, { who: 'pink', gain: 0.85, pitch: 1.35 });
  chuckle('pink', ST1 + 12, ST1 + 30, { mouth: 'happy with theeth' });
  // падает обратно — ей на голову
  const DROP = UP + 8, HIT = DROP + 10;
  move('fat', DROP, { x: PX - 10, y: -420, rot: 0 });
  key('fat', DROP, { sx: 0.88, sy: 1.14, mouth: 'puzzlement', eyes: 'sad' }, 0);
  sfx('whoosh', DROP, { who: 'fat', dur: 10, gain: 0.6 });
  key('pink', HIT - 6, { head: -16, mouth: 'puzzlement', eyes: 'sad' }, 3);
  sfx('bonk', HIT, { who: 'pink', gain: 1.0 }); sfx('slam', HIT, { who: 'pink', gain: 0.6 });
  key('fat', HIT, { sx: 1.35, sy: 0.75 }, 1);
  move('fat', HIT, { y: target('pink:top', ST.stateAt(HIT - 2))[1] + 30 }, 'in2');
  // сплющило гармошкой
  key('pink', HIT + 2, { sx: 1.5, sy: 0.58, head: 0, lean: 0, mouth: 'puzzlement', eyes: 'sad' }, 2);
  key('pink', HIT + 5, { sx: 1.4, sy: 0.64 }, 3); key('pink', HIT + 8, { sx: 1.5, sy: 0.58 }, 3);
  ev('shake', { f: HIT, amp: 16, n: 10 }); ev('dust', { f: HIT, x: PX, r: 80, n: 8, snd: false });
  ev('stars', { who: 'pink', f0: HIT + 2, f1: HIT + 16, snd: false });
  sfx('squish', HIT + 1, { who: 'pink', gain: 0.8 });
  const FAL = HIT;
  const FX3 = 1580;
  move('fat', HIT + 1, { x: PX - 10 });
  move('fat', HIT + 8, { y: GROUND - 760 }, 'out2');
  move('fat', HIT + 18, { y: GROUND }, 'in2');
  move('fat', HIT + 18, { x: FX3 }, 'lin');
  key('fat', HIT + 5, { sx: 0.92, sy: 1.1 }, 3);
  key('fat', HIT + 18, { sx: 1.25, sy: 0.82 }, 1); key('fat', HIT + 23, { sx: 1, sy: 1 }, 4);
  sfx('land', HIT + 18, { who: 'fat', gain: 0.7 });
  key('fat', HIT + 18, { mouth: 'happy', eyes: 'normal' }, 0);
  sfx('ref:laugh', HIT + 20, { who: 'fat', gain: 0.85, pitch: 0.75 });
  laugh('fat', HIT + 20, HIT + 40);
  const BX = 560;
  const psm = shrink('pink', HIT + 14, BX, 1, { mouth: 'puzzlement', eyes: 'sad', smoke: 420 });
  key('pink', psm, { lean: 0, head: 0, hip: [0, 0], legF: null, legB: null, zB: null, rot: 0 }, 0);
  move('pink', psm, { x: BX, y: GROUND, rot: 0 });
  ev('stars', { who: 'pink', f0: psm + 4, f1: psm + 18, snd: false });

  // ---- 9.8–13.4 с: шарик-Розовая на поршень — подбрасывает — падает Толстому на голову
  key('pink', psm + 10, { eyes: 'angry', mouth: 'angry theeth' }, 0);
  hopTo('pink', psm + 12, psm + 24, BX, GROUND, PIS.A.x, TOP0, 150, { land: 'soft' });
  const F2 = psm + 25;
  const L2 = launch('pink', 'A', F2, 14, FX3, GROUND - 300, GROUND - 450);
  key('pink', F2 + 4, { mouth: 'theeth smile', eyes: 'angry' }, 0);
  key('fat', L2 - 8, { mouth: 'puzzlement', eyes: 'sad' }, 0);
  key('fat', L2, { sx: 1.55, sy: 0.62 }, 1);
  key('pink', L2, { sx: 1.3, sy: 0.75 }, 1);
  sfx('slam', L2, { who: 'fat', gain: 1.0 }); sfx('squish', L2, { who: 'fat', gain: 0.8 });
  ev('shake', { f: L2, amp: 14, n: 10 }); ev('dust', { f: L2, x: FX3, r: 80, n: 8, snd: false });
  const PX2 = 600;
  hopTo('pink', L2 + 2, L2 + 16, FX3, GROUND - 300, PX2, GROUND, 160);
  key('pink', L2 + 16, { mouth: 'happy with theeth', eyes: 'normal' }, 0);
  sfx('ref:laugh', L2 + 16, { who: 'pink', gain: 0.85, pitch: 1.35 });
  laugh('pink', L2 + 18, L2 + 24);
  key('fat', L2 + 16, { sx: 1, sy: 1 }, 6, 'out'); sfx('boing', L2 + 16, { who: 'fat', gain: 0.6 });
  ev('stars', { who: 'fat', f0: L2 + 4, f1: L2 + 34 });

  // ---- «растёт» снова (без музыки) — Толстый опять влюблён
  key('pink', L2 + 22, { eyes: 'angry', mouth: 'angry theeth' }, 0);
  const PB2 = transform('pink', L2 + 24, PX2, PX, 1, { style: 'grow', love: 'fat', loveDur: 36 });
  key('pink', PB2, stance('pink', PX, 1), 0);
  key('pink', PB2 + 6, { mouth: 'theeth smile', eyes: 'normal' }, 0);

  // ---- 13.6–17 с: Толстый на правый поршень — она топает — улетает в небо; падает на левый — топ — за край
  hopTo('fat', PB2 + 4, PB2 + 16, FX3, GROUND, PIS.B.x, TOP0, 120, { land: 'soft' });
  key('pink', PB2 + 12, { mouth: 'theeth smile', eyes: 'angry' }, 0);
  const ST2 = stomp('pink', PB2 + 12, PX, PX, 1, { n: 10, h: 60 });
  const UP2 = launch('fat', 'B', ST2 + 1, 12, PIS.B.x + 180, -420, null, { spin: -540 });
  key('fat', ST2 + 2, { mouth: 'puzzlement', eyes: 'sad' }, 0);
  sfx('scared', ST2 + 3, { who: 'fat', gain: 0.8 });
  key('pink', ST2 + 12, { mouth: 'happy with theeth', eyes: 'normal' }, 0);
  sfx('ref:laugh', ST2 + 12, { who: 'pink', gain: 0.85, pitch: 1.35 });
  chuckle('pink', ST2 + 12, ST2 + 28, { mouth: 'happy with theeth' });
  // падает прямо на левый поршень перед ней
  const DR2 = UP2 + 8, ON2 = DR2 + 10;
  key('fat', DR2, { rot: 0, pivot: 0, sx: 0.88, sy: 1.14 }, 0);
  move('fat', DR2, { x: PIS.A.x, y: -420, rot: 0 });
  move('fat', ON2, { y: TOP0 }, 'in2');
  sfx('whoosh', DR2, { who: 'fat', dur: 10, gain: 0.6 });
  key('fat', ON2, { sx: 1.35, sy: 0.72 }, 1); key('fat', ON2 + 4, { sx: 0.95, sy: 1.06 }, 3); key('fat', ON2 + 8, { sx: 1, sy: 1 }, 3);
  sfx('land', ON2, { who: 'fat', gain: 0.8 }); sfx('boing', ON2 + 2, { who: 'fat', gain: 0.5 });
  ev('stars', { who: 'fat', f0: ON2 + 2, f1: ON2 + 14, snd: false });
  key('pink', ON2 - 2, { mouth: 'theeth smile', eyes: 'angry', head: 0 }, 0);
  const ST3 = stomp('pink', ON2 + 2, PX, PX, 1, { n: 10, h: 60 });
  const OFF = launch('fat', 'A', ST3 + 1, 14, PIS.A.x + 900, -460, null, { spin: 720 });
  sfx('scared', ST3 + 3, { who: 'fat', gain: 0.8 });
  ev('twinkle', { f: OFF - 2, at: [1700, 90], n: 22, size: 56 });
  // поршни уходят в землю
  PIS.A.down = ST3 + 20; PIS.B.down = ST3 + 20;
  sfx('slide', ST3 + 20, { x: 980, gain: 0.5, pitch: 0.8 });
  ev('dust', { f: ST3 + 26, x: PIS.A.x, r: 50, n: 5, snd: false }); ev('dust', { f: ST3 + 26, x: PIS.B.x, r: 50, n: 5, snd: false });

  // ---- победа
  key('pink', ST3 + 14, { mouth: 'happy with theeth', eyes: 'normal' }, 0);
  sfx('ref:laugh', ST3 + 14, { who: 'pink', gain: 0.8, pitch: 1.35 });
  chuckle('pink', ST3 + 14, ST3 + 23, { mouth: 'happy with theeth' });
  const WIN = victory('pink', ST3 + 24, PX, { n: 9, stride: 120 });
  window.T = { F1, LAND, PB, ST1, HIT, FAL, psm, F2, L2, PB2, ST2, ON2, ST3, OFF, WIN };
};

// ------------------------------------------------------------------ рисование
ST.hooks.beforeChars.push((ctx, f, S, CAM) => {
  ctx.setTransform(...CAM);
  for (const p of Object.values(PIS)) FX.piston(ctx, p.x, GROUND + 2, PS, pExt(p, f), pGrow(p, f));
});

ST.start(BIG);
