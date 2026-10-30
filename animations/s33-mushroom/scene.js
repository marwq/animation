// Ролик 33: Гриб-батут — Розовая (слева) против Скелета (справа), 25 с, 24 кадра/с. Драка без ударов:
// огромный красный гриб из майнкрафта — его шляпка пружинит, как батут; если потрясти гриб — летят споры, от них чихают.
// В начале — считалка «3, 2, 1, FIGHT». Музыка превращения — один раз. Фон — грибной лес.
//
//   0–2.2 с   считалка: шарик-Розовая и шарик-Скелет неподвижно стоят друг напротив друга
//   2.2–4 с   из земли вырастает огромный гриб; Скелет прыгает на шляпку — она подбрасывает его, он падает на Розовую
//   4–5.2 с   Розовая «растёт» под музыку — Скелет влюблён
//   5.3–9.5 с влюблённый Скелет скачет на шляпке к её лицу — она вдавливает шляпку и отпускает — он улетает в небо,
//             падает обратно, скачет по шляпке и скатывается
//   9.5–13.5 с Скелет «растёт», трясёт гриб — споры летят на Розовую — апчхи, апчхи, АПЧХИ! — падает — «пуф»
//   13.5–17 с шарик-Розовая скачет на шляпке всё выше — и падает Скелету на голову — «пуф»
//   17–21 с   Розовая «растёт» снова; шарик-Скелет прыгает на шляпку, чтобы удрать, — она вдавливает и отпускает — в небо
//   21–25 с   Розовая в центре, руки вверх
'use strict';

const ST = Stage({
  name: '33 Розовая vs Скелет',
  frames: 600,
  intro: 'countdown-321',
  cast: {
    pink: { small: ['girl-verity-small', { bodyHeight: 300 }], big: ['girl-verity-big', { height: 730, splitFeet: true }],
      pivot: 337, voice: 1.35, vAngle: 50, lie: 55, color: '#ff4fc8', moods: { angry: 'angry theeth', grin: 'theeth smile', big: 'theeth smile' } },
    skel: { small: ['skeleton-verity-small', { scale: 0.455 }], big: ['skeleton-verity-big', { height: 730 }], pivot: 325,
      voice: 0.9, lie: 60, color: '#f3f1e6', moods: { angry: 'angry theeth', grin: 'happy with theeth', big: 'theeth smile' } },
  },
  order: ['skel', 'pink'],
  background: { theme: 'mushroom', seed: 1033, sunX: 1500, sunY: 130 },
  clouds: [[150, 80, 2.4, 0, 12], [700, 220, 1.8, 1, 16], [1150, 70, 2.6, 2, 10], [1720, 250, 1.5, 0, 18]],
});
const { FPS, NF, GROUND, C, key, move, ev, sfx, hop, tumble, laugh, tremble, transform, shrink, stance, walk,
  slip, fallBack, victory, chuckle, hand, toRig, statesAt, target } = ST;
const P = (v, f, S) => (typeof v === 'function' ? v(f, S) : typeof v === 'string' ? target(v, S) : v);
function flap(f0, f1, gain = 0.6) {
  for (let f = f0; f < f1; f += 6) { key('skel', f, { b_B16: -30, b_B17: 30 }, 3); key('skel', f + 3, { b_B16: 46, b_B17: -46 }, 3, 'in'); }
  key('skel', f1, { b_B16: 0, b_B17: 0 }, 4);
  sfx('gust', f0, { who: 'skel', dur: f1 - f0, gain });
}

// ------------------------------------------------------------------ гриб
const MS = 420, MX = 960, MUSH = { f0: 1e9, f1: 1e9 };
const PRESS = [];         // упругие толчки: [f, сила]
const HOLD = [];          // [f0, f1, a0, a1] — вдавили рукой (плавно a0 -> a1)
const SHAKE = [];         // [f0, f1] — гриб трясут
const SPORE = [];         // {f, at, size, dir}
function pressAt(f) {
  let p = 0;
  for (const [a, k] of PRESS) if (f >= a) p += k * Math.sin((f - a) * 0.8) * Math.exp(-(f - a) / 6);
  for (const [a, b, a0, a1] of HOLD) if (f >= a && f < b) p = Math.max(p, E.lerp(a0, a1, E.EASE.io((f - a) / (b - a))));
  return E.clamp(p, -0.25, 1);
}
const tiltAt = (f) => { let t = 0; for (const [a, b] of SHAKE) if (f >= a && f < b) t = Math.sin((f - a) * 1.3) * 0.12 * Math.min(1, (b - f) / 6); return t; };
function capTop(f) {
  const p = pressAt(f), H = MS * 0.95, ch = MS * 0.34 * (1 - p * 0.35), stemH = (H - ch * 0.6) * (1 - p * 0.25);
  return GROUND - stemH - ch * 1.1;
}
const TOP0 = GROUND - (MS * 0.95 - MS * 0.34 * 0.6) - MS * 0.34 * 1.1;
function boing(f, k = 0.8) { PRESS.push([f, k]); sfx('spring', f, { x: MX, gain: 0.8 }); sfx('boing', f + 1, { x: MX, gain: 0.6 }); }
// шарик стоит на шляпке: y привязан к прогибу (кадры f0..f1)
const ONCAP = [];         // {who, f0, f1, x}
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
// подскок на шляпке: приземлился в f (на TOP0) — подлетел на h за n кадров и снова на шляпку (или в точку to)
function bounce(who, f, n, h, x, to = null, k = 0.8) {
  boing(f, k);
  key(who, f, { sx: 1.35, sy: 0.72 }, 1); key(who, f + 3, { sx: 0.85, sy: 1.15 }, 2);
  ONCAP.push({ who, f0: f, f1: f + 3, x });
  if (to) { move(who, f + 3, { x, y: TOP0 }); move(who, f + 3 + Math.round(n * 0.45), { y: Math.min(TOP0, to[1]) - h }, 'out2'); move(who, f + 3 + n, { y: to[1] }, 'in2'); move(who, f + 3 + n, { x: to[0] }, 'lin'); }
  else { move(who, f + 3, { x, y: TOP0 }); move(who, f + 3 + Math.round(n / 2), { y: TOP0 - h }, 'out2'); move(who, f + 3 + n, { y: TOP0 }, 'in2'); }
  key(who, f + 3 + Math.round(n / 2), { sx: 1, sy: 1 }, 3);
  return f + 3 + n;
}
const LATE = [];

const PX0 = 470, SX0 = 1450, GO = 54;
// ================================================================== 0–2.2 с: считалка, оба стоят
key('pink', 0, { form: 'small', x: PX0, y: GROUND, face: 1, look: 1, eyes: 'normal', mouth: 'smile normal', sx: 1, sy: 1, rot: 0, pivot: 0, alpha: 1 }, 0);
key('skel', 0, { form: 'small', x: SX0, y: GROUND, face: -1, look: 1, eyes: 'normal', mouth: 'smile normal', sx: 1, sy: 1, rot: 0, pivot: 0, alpha: 1 }, 0);

const BIG = () => {
  // ---- 2.2–4 с: гриб вырастает — Скелет на шляпку — подбрасывает — падает на Розовую
  MUSH.f0 = GO;
  sfx('slide', GO, { x: MX, gain: 0.6, pitch: 0.7 }); sfx('pop', GO + 8, { x: MX, gain: 0.8 }); boing(GO + 9, 0.5);
  ev('dust', { f: GO + 2, x: MX, r: 90, n: 7, snd: false }); ev('shake', { f: GO + 8, amp: 8, n: 6 });
  SPORE.push({ f: GO + 9, at: [MX, TOP0 + 40], size: 0.8, dir: 0, all: true });
  key('pink', GO + 3, { mouth: 'puzzlement' }, 0); key('skel', GO + 3, { mouth: 'puzzlement' }, 0);
  key('skel', GO + 12, { mouth: 'happy with theeth', eyes: 'angry' }, 0);
  sfx('ref:grin-eee', GO + 12, { who: 'skel', gain: 0.4 });
  const ON = GO + 26;
  flap(GO + 14, ON - 2, 0.5);
  move('skel', GO + 14, { x: SX0, y: GROUND }); move('skel', GO + 21, { x: 1200, y: TOP0 - 220 }, 'out2'); move('skel', ON, { x: MX + 20, y: TOP0 }, 'in2');
  // шляпка подбрасывает — он летит на Розовую
  const LND = bounce('skel', ON, 18, 420, MX + 20, [PX0 + 10, GROUND - 120]);
  sfx('whoosh', ON + 3, { who: 'skel', dur: 16, gain: 0.5 });
  key('pink', LND - 6, { mouth: 'puzzlement', eyes: 'sad' }, 0);
  key('pink', LND, { sx: 1.75, sy: 0.42 }, 1);
  key('skel', LND, { sx: 1.25, sy: 0.82 }, 1);
  sfx('slam', LND, { who: 'pink', gain: 1.0 }); sfx('squish', LND, { who: 'pink', gain: 0.7 });
  ev('shake', { f: LND, amp: 14, n: 8 }); ev('dust', { f: LND, x: PX0, r: 70, n: 6, snd: false });
  const SX1 = 1250;
  hopTo('skel', LND + 1, LND + 15, PX0 + 10, GROUND - 120, SX1, GROUND, 260);
  key('skel', LND + 15, { mouth: 'happy with theeth', eyes: 'normal' }, 0);
  sfx('ref:laugh', LND + 15, { who: 'skel', gain: 0.85 });
  laugh('skel', LND + 17, LND + 33);
  key('pink', LND + 12, { sx: 1, sy: 1 }, 5, 'out'); sfx('boing', LND + 12, { who: 'pink', gain: 0.6 });
  ev('stars', { who: 'pink', f0: LND + 8, f1: LND + 22 });

  // ---- 4–5.2 с: Розовая «растёт» — Скелет влюблён
  const PX = 520;
  key('pink', LND + 12, { eyes: 'angry', mouth: 'angry theeth' }, 0);
  const PB = transform('pink', LND + 13, PX0, PX, 1, { style: 'grow', love: 'skel', loveDur: 60 });
  key('pink', PB, stance('pink', PX, 1), 0);
  key('pink', PB + 4, { mouth: 'theeth smile', eyes: 'normal' }, 0);

  // ---- 5.3–9.5 с: влюблённый Скелет скачет на шляпке — она вдавливает и отпускает — в небо — обратно — скатывается
  const PX1 = 640;
  walk('pink', PB + 2, PX, PX1, 1, 10, 1);
  const ON2 = PB + 14;
  hopTo('skel', PB + 4, ON2, SX1, GROUND, MX + 30, TOP0, 220, { land: false });
  ev('hearts', { who: 'skel', f0: ON2, f1: ON2 + 30, snd: false });
  let f = bounce('skel', ON2, 10, 150, MX + 30);
  sfx('kiss', f - 4, { who: 'skel', gain: 0.6 });
  // она ловит шляпку рукой и вдавливает — Скелет сидит на ней
  const DOWN = f;
  key('pink', DOWN - 6, { hitF: 1, hitFto: [MX - 120, TOP0 + 40], lean: 18, mouth: 'theeth smile', eyes: 'angry' }, 6);
  key('skel', DOWN, { sx: 1.3, sy: 0.75 }, 1); key('skel', DOWN + 4, { sx: 1, sy: 1 }, 3);
  boing(DOWN, 0.4);
  const REL = DOWN + 12;
  HOLD.push([DOWN + 1, REL, 0.3, 1]);
  LATE.push(() => { for (let g = DOWN; g <= REL; g++) move('skel', g, { x: MX + 30, y: capTop(g) }, 'lin'); });
  key('pink', REL - 2, { hitFto: [MX - 120, TOP0 + 150], lean: 26, hip: [0, toRig('pink', 60)] }, 10);
  sfx('creak', DOWN + 2, { x: MX, dur: 12, gain: 0.6 });
  key('skel', DOWN + 6, { mouth: 'puzzlement', eyes: 'sad' }, 0);
  // отпустила!
  PRESS.push([REL, 1.4]);
  sfx('spring', REL, { x: MX, gain: 1.0 }); sfx('whoosh', REL + 1, { who: 'skel', dur: 10, gain: 0.7 });
  key('pink', REL, { hitF: 0, ...stance('pink', PX1, 1), mouth: 'happy with theeth', eyes: 'normal' }, 4);
  move('skel', REL, { x: MX + 30, y: capTop(REL) }); move('skel', REL + 9, { y: -360 }, 'out');
  sfx('scared', REL + 2, { who: 'skel', gain: 0.8 });
  sfx('ref:laugh', REL + 4, { who: 'pink', gain: 0.85, pitch: 1.35 });
  chuckle('pink', REL + 4, REL + 40, { mouth: 'happy with theeth' });
  const BACK = REL + 18;
  move('skel', BACK - 9, { x: MX - 10, y: -360 }); move('skel', BACK, { y: TOP0 }, 'in2');
  sfx('whoosh', BACK - 10, { who: 'skel', dur: 10, gain: 0.6 });
  f = bounce('skel', BACK, 12, 160, MX - 10, [1280, GROUND]);
  key('skel', f, { sx: 1.25, sy: 0.8 }, 1); key('skel', f + 5, { sx: 1, sy: 1 }, 4);
  sfx('fall', f, { who: 'skel', gain: 0.8 });
  ev('stars', { who: 'skel', f0: f + 2, f1: f + 22 });
  const DZ = f;

  // ---- 9.5–13.5 с: Скелет «растёт», трясёт гриб — споры — апчхи ×3 — Розовая падает — «пуф»
  key('skel', DZ + 6, { eyes: 'angry', mouth: 'angry theeth' }, 0);
  const SX = 1440, SB = transform('skel', DZ + 8, 1280, SX, -1, { style: 'grow' });
  key('skel', SB, stance('skel', SX, -1), 0);
  key('skel', SB + 4, { mouth: 'theeth smile', eyes: 'angry' }, 0);
  key('pink', SB - 2, { mouth: 'puzzlement', eyes: 'sad' }, 0);
  const SX2 = 1230;
  walk('skel', SB + 2, SX, SX2, 2, 7, -1);
  const SH = SB + 16;
  key('skel', SH - 4, { hitF: 1, hitB: 1, hitFto: [MX + 50, GROUND - 260], hitBto: [MX + 60, GROUND - 160], lean: 14 }, 4);
  SHAKE.push([SH, SH + 24]);
  for (let g = SH; g < SH + 24; g += 5) { key('skel', g, { lean: g % 10 ? 8 : 18 }, 2); sfx('creak', g, { x: MX, gain: 0.3, pitch: 1.4 }); }
  for (let g = SH + 2; g < SH + 22; g += 6) SPORE.push({ f: g, at: [MX - 60, TOP0 + 60], size: 1.3, dir: -1 });
  sfx('gust', SH, { x: 800, dur: 22, gain: 0.5 });
  key('skel', SH + 24, { ...stance('skel', SX2, -1), hitF: 0, hitB: 0, mouth: 'happy with theeth', eyes: 'normal' }, 6);
  // апчхи ×3
  const Z = [SH + 12, SH + 25, SH + 38];
  Z.forEach((z, i) => {
    key('pink', z - 10, { lean: -10 - i * 4, head: -18, mouth: 'puzzlement', eyes: 'sad', hitF: 0 }, 9, 'out');
    sfx('sneeze', z - 9, { who: 'pink', gain: 0.8 + i * 0.1 });
    key('pink', z, { lean: 16 + i * 4, head: 14 }, 2, 'in2');
    SPORE.push({ f: z, at: (g, S) => target('pink:face', S), size: 0.6 + i * 0.3, dir: 1 });
    if (i < 2) key('pink', z + 6, { lean: 0, head: 0 }, 5);
  });
  sfx('ref:laugh', Z[0] + 4, { who: 'skel', gain: 0.85, pitch: 0.8 });
  chuckle('skel', SH + 26, Z[2] + 26, { mouth: 'happy with theeth' });
  // третий чих отбрасывает назад
  const FB = fallBack('pink', Z[2] + 2, PX1, 1, { n: 12, stars: 24 });
  const PBX = 330;
  const psm = shrink('pink', FB + 6, PBX, 1, { mouth: 'puzzlement', eyes: 'sad', smoke: 420 });
  key('pink', psm, { lean: 0, head: 0, hip: [0, 0], legF: null, legB: null, zB: null, rot: 0 }, 0);
  move('pink', psm, { x: PBX, y: GROUND, rot: 0 });
  ev('stars', { who: 'pink', f0: psm + 4, f1: psm + 14, snd: false });

  // ---- 13.5–17 с: шарик-Розовая скачет на шляпке всё выше — Скелету на голову — «пуф»
  key('pink', psm + 3, { eyes: 'angry', mouth: 'theeth smile' }, 0);
  const ON3 = psm + 14;
  hopTo('pink', psm + 5, ON3, PBX, GROUND, MX - 20, TOP0, 160, { land: false });
  f = bounce('pink', ON3, 11, 220, MX - 20);
  boing(f, 1.0);
  key('pink', f, { sx: 1.35, sy: 0.72 }, 1);
  const LAUNCH = f + 3, HEAD = LAUNCH + 16;
  ONCAP.push({ who: 'pink', f0: f, f1: LAUNCH, x: MX - 20 });
  key('skel', HEAD - 8, { look: 1, head: -10, mouth: 'puzzlement', eyes: 'sad' }, 4);
  LATE.push(() => { const t = target('skel:face', ST.stateAt(HEAD)); hopTo('pink', LAUNCH, HEAD, MX - 20, TOP0, t[0] - 70, t[1] + 150, 240, { land: false }); hopTo('pink', HEAD + 2, HEAD + 18, t[0] - 70, t[1] + 150, 600, GROUND, 160); });
  key('pink', HEAD, { sx: 1.3, sy: 0.75 }, 1);
  sfx('bonk', HEAD, { who: 'skel', gain: 1.0 }); sfx('slam', HEAD, { who: 'skel', gain: 0.5 }); ev('shake', { f: HEAD, amp: 16, n: 10 });
  const FB2 = fallBack('skel', HEAD + 2, SX2, -1, { n: 14, stars: 24 });
  key('pink', HEAD + 18, { mouth: 'happy with theeth', eyes: 'normal' }, 0);
  sfx('ref:laugh', HEAD + 18, { who: 'pink', gain: 0.85, pitch: 1.35 });
  laugh('pink', HEAD + 18, HEAD + 20);
  const SBX = 1250;
  const ssm = shrink('skel', FB2 + 6, SBX, -1, { mouth: 'puzzlement', eyes: 'sad', smoke: 420 });
  key('skel', ssm, { lean: 0, head: 0, hip: [0, 0], legF: null, legB: null, zB: null, rot: 0 }, 0);
  move('skel', ssm, { x: SBX, y: GROUND, rot: 0 });
  ev('stars', { who: 'skel', f0: ssm + 4, f1: ssm + 14, snd: false });

  // ---- 17–21 с: Розовая «растёт» снова; шарик-Скелет на шляпку — она вдавливает и отпускает — в небо
  const PX3 = 560, PB2 = transform('pink', HEAD + 22, 600, PX3, 1, { style: 'grow' });
  key('pink', PB2, stance('pink', PX3, 1), 0);
  key('pink', PB2 + 4, { mouth: 'theeth smile', eyes: 'angry' }, 0);
  key('skel', ssm + 4, { mouth: 'puzzlement', eyes: 'sad' }, 0);
  sfx('scared', ssm + 6, { who: 'skel', gain: 0.6 });
  const ON4 = ssm + 18;
  flap(ssm + 6, ON4, 0.4);
  hopTo('skel', ssm + 6, ON4, SBX, GROUND, MX + 20, TOP0, 140, { land: false });
  key('skel', ON4, { sx: 1.3, sy: 0.75 }, 1); key('skel', ON4 + 4, { sx: 1, sy: 1 }, 3);
  boing(ON4, 0.4);
  const PX4 = 640;
  walk('pink', PB2 + 4, PX3, PX4, 1, 9, 1);
  const DOWN2 = Math.max(ON4 + 6, PB2 + 20), REL2 = DOWN2 + 10;
  key('pink', DOWN2 - 6, { hitF: 1, hitFto: [MX - 120, TOP0 + 40], lean: 18, mouth: 'theeth smile', eyes: 'angry' }, 6);
  HOLD.push([DOWN2, REL2, 0.2, 1]);
  LATE.push(() => { for (let g = ON4; g <= REL2; g++) move('skel', g, { x: MX + 20, y: capTop(g) }, 'lin'); });
  key('pink', REL2 - 2, { hitFto: [MX - 120, TOP0 + 150], lean: 26, hip: [0, toRig('pink', 60)] }, 8);
  sfx('creak', DOWN2, { x: MX, dur: 10, gain: 0.6 });
  PRESS.push([REL2, 1.5]);
  sfx('spring', REL2, { x: MX, gain: 1.0 }); sfx('whoosh', REL2 + 1, { who: 'skel', dur: 14, gain: 0.8 }); sfx('scared', REL2 + 2, { who: 'skel', gain: 0.8 });
  key('pink', REL2, { hitF: 0, ...stance('pink', PX4, 1), mouth: 'happy with theeth', eyes: 'normal' }, 4);
  key('skel', REL2, { pivot: ST.CAST.skel.pivot }, 0);
  move('skel', REL2, { x: MX + 20, y: capTop(REL2), rot: 0 }); move('skel', REL2 + 14, { x: MX + 160, y: -420, rot: 720 }, 'out');
  ev('twinkle', { f: REL2 + 12, at: [MX + 150, 90], n: 22, size: 56 });
  sfx('ref:laugh', REL2 + 6, { who: 'pink', gain: 0.85, pitch: 1.35 });
  chuckle('pink', REL2 + 6, REL2 + 16, { mouth: 'happy with theeth' });

  // гриб уходит обратно в землю
  MUSH.f1 = REL2 + 14;
  sfx('slide', MUSH.f1, { x: MX, gain: 0.6, pitch: 0.7 }); ev('dust', { f: MUSH.f1 + 6, x: MX, r: 90, n: 7, snd: false });
  // ---- 21–25 с: в центр, руки вверх
  const WIN = victory('pink', REL2 + 16, PX4, { n: 9, stride: 90 });
  for (const fn of LATE) fn();
  for (const c of ONCAP) for (let g = c.f0; g <= c.f1; g++) move(c.who, g, { x: c.x, y: capTop(g) }, 'lin');
  window.T = { ON, LND, PB, ON2, DOWN, REL, BACK, DZ, SB, SH, FB, psm, ON3, LAUNCH, HEAD, ssm, PB2, ON4, REL2, WIN };
};

// ------------------------------------------------------------------ рисование
ST.hooks.beforeChars.push((ctx, f, S, CAM) => {
  ctx.setTransform(...CAM);
  if (f >= MUSH.f0) {
    const g = f >= MUSH.f1 ? 1 - E.EASE.in2(E.clamp((f - MUSH.f1) / 10, 0, 1)) : E.EASE.out2(E.clamp((f - MUSH.f0) / 9, 0, 1));
    if (g <= 0) return;
    ctx.save(); ctx.beginPath(); ctx.rect(0, -2000, 1920, GROUND + 2002); ctx.clip();
    ctx.translate(0, (1 - g) * MS * 1.1);
    FX.hugeMushroom(ctx, MX, GROUND + 2, MS, pressAt(f), 1, tiltAt(f));
    ctx.restore();
  }
});
ST.hooks.afterChars.push((ctx, f, S, CAM) => {
  ctx.setTransform(...CAM);
  for (const s of SPORE) { const at = P(s.at, s.f, statesAt(s.f)); FX.spores(ctx, at[0], at[1], (f - s.f) / 22, s.size, s.f, s.dir || 1); if (s.all) FX.spores(ctx, at[0], at[1], (f - s.f) / 22, s.size, s.f + 1, -1); }
});

ST.start(BIG);
