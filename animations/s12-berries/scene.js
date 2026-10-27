// Серия 2, ролик 12: Ягодный куст — Розовая (слева) против Скелета (справа), 22 с, 24 кадра/с. Драка без ударов:
// колючий куст сладких ягод из майнкрафта: ягодами плюются, в куст садятся — «ай!», колючки.
// Музыка превращения — один раз. Фон — берёзовая роща.
//
//   0–2 с     шарик-Розовая и шарик-Скелет неподвижно стоят друг напротив друга, середина пустая
//   2–4 с     из земли вырастает куст; Скелет взлетает, рвёт ягоды ртом и плюётся — пятна на Розовой;
//             она отпрыгивает — прямо в куст: «ай!» — выскакивает
//   4–5.2 с   Розовая «растёт» под музыку — Скелет влюблён
//   5.4–8 с   влюблённый Скелет подлетает с ягодой — щелчок — он в куст: «ай!», выскакивает весь в колючках
//   8–9.4 с   Скелет «растёт»
//   9.5–12.5 с поднимает куст над головой, трясёт — ягодный дождь на неё — нахлобучивает куст ей на голову: «АЙ!» — «пуф»
//   12.7–15.8 с шарик-Розовая катится сквозь куст — вся в колючках, как ёж, — прыгает Скелету на ногу:
//             «ай!» — он скачет на одной ноге — падает — «пуф»
//   16–22 с   Розовая «растёт», щелчком отправляет куст на шарика-Скелета — он улетает; в центре, руки вверх
'use strict';

const ST = Stage({
  name: '12 Розовая vs Скелет',
  frames: 528,
  cast: {
    pink: { small: ['girl-verity-small', { bodyHeight: 300 }], big: ['girl-verity-big', { height: 730, splitFeet: true }],
      pivot: 337, voice: 1.35, vAngle: 50, lie: 55, color: '#ff4fc8', moods: { angry: 'angry theeth', grin: 'theeth smile', big: 'theeth smile' } },
    skel: { small: ['skeleton-verity-small', { scale: 0.455 }], big: ['skeleton-verity-big', { height: 730 }], pivot: 325,
      voice: 0.9, lie: 60, color: '#f3f1e6', moods: { angry: 'angry theeth', grin: 'happy with theeth', big: 'theeth smile' } },
  },
  order: ['skel', 'pink'],
  background: { theme: 'birch', seed: 1012, sunX: 1500, sunY: 130 },
  clouds: [[150, 80, 2.4, 0, 12], [700, 220, 1.8, 1, 16], [1150, 70, 2.6, 2, 10], [1720, 250, 1.5, 0, 18]],
});
const { FPS, NF, GROUND, C, key, move, ev, sfx, hop, tumble, laugh, tremble, transform, shrink, love, stance, walk, turn,
  fallBack, victory, chuckle, hand, toRig, statesAt, stateAt, target } = ST;
const P = (v, f, S) => (typeof v === 'function' ? v(f, S) : typeof v === 'string' ? target(v, S) : v);
ST.parts.mouth = (ch, st, p) => {
  const name = ch.layers.some((l) => l.name === p.mouth) ? p.mouth : 'smile normal', l = ch.layers.find((x) => x.name === name);
  return l ? E.apply(ch.eyeMatrix(st, name), [(l.bbox[0] + l.bbox[2]) / 2, (l.bbox[1] + l.bbox[3]) / 2]) : ST.parts.lips(ch, st);
};
function flap(f0, f1, gain = 0.6) {
  for (let f = f0; f < f1; f += 6) { key('skel', f, { b_B16: -30, b_B17: 30 }, 3); key('skel', f + 3, { b_B16: 46, b_B17: -46 }, 3, 'in'); }
  key('skel', f1, { b_B16: 0, b_B17: 0 }, 4);
  sfx('gust', f0, { who: 'skel', dur: f1 - f0, gain });
}

// ------------------------------------------------------------------ куст, ягоды, пятна, колючки
const BX = 960, BW = 330;
const BUSH = { f0: 1e9, f1: 1e9, shakes: [] };       // shakes: [f]
const BMOVE = [];        // куст перемещается: {f0, hand} | {f0, f1, a, b, arc} | {f0, on, dy} | {f0, at}
function bushPos(f, S) {
  const c = BMOVE.filter((k) => f >= k.f0).pop();
  if (!c) return [BX, GROUND + 4];
  if (c.at) return c.at;
  if (c.hand) { if (S[c.hand].p.form !== 'big') return [BX, GROUND + 4]; const h = C[c.hand].big.point(S[c.hand].st, 'handF'), g = C[c.hand].big.point(S[c.hand].st, 'handB'); return [(h[0] + g[0]) / 2, Math.min(h[1], g[1]) + 30]; }
  if (c.on) { const t = target(`${c.on}:top`, S); return [t[0], t[1] + c.dy]; }
  const u = E.clamp((f - c.f0) / (c.f1 - c.f0), 0, 1), a = P(c.a, c.f0, statesAt(c.f0)), b = P(c.b, f, S);
  return [E.lerp(a[0], b[0], u), E.lerp(a[1], b[1], u) - Math.sin(Math.PI * u) * (c.arc || 0)];
}
const shakeAt = (f) => { let s = 0; for (const k of BUSH.shakes) { const u = f - k; if (u >= 0 && u < 16) s = Math.max(s, Math.sin(u * 1.2) * 14 * (1 - u / 16)); } return s; };
const BER = [];           // {f0, f1, a, b, arc}
const STAIN = [];         // {who, f0, f1, part, dx, dy, s, seed}
const OUCH = [];          // {f, at, size}
const SPIKY = [];         // {who, f0, f1} — колючки торчат
function ouch(f, who, at, size = 1) {
  OUCH.push({ f, at, size });
  BUSH.shakes.push(f);
  sfx('ref:hit-ow', f + 1, { who, gain: 0.8, pitch: statesAt(Math.max(0, f - 1))[who].p.form === 'big' ? 1.0 : 1.4 });
  sfx('slap', f, { who, gain: 0.4 }); sfx('crunch', f, { x: BX, gain: 0.4 });
}
function spit(f, from, to, who, part, dx = 0, dy = 0, s = 60) {
  BER.push({ f0: f, f1: f + 8, a: from, b: to, arc: 40 });
  sfx('spit', f, { x: 960, gain: 0.6 }); sfx('squish', f + 8, { who, gain: 0.5 });
  STAIN.push({ who, f0: f + 8, f1: 0, part, dx, dy, s, seed: f });
}

const PX0 = 560, SX0 = 1360;
// ================================================================== 0–2 с: неподвижная стойка
key('pink', 0, { form: 'small', x: PX0, y: GROUND, face: 1, look: 1, eyes: 'normal', mouth: 'smile normal', sx: 1, sy: 1, rot: 0, pivot: 0, alpha: 1 }, 0);
key('skel', 0, { form: 'small', x: SX0, y: GROUND, face: -1, look: 1, eyes: 'normal', mouth: 'smile normal', sx: 1, sy: 1, rot: 0, pivot: 0, alpha: 1 }, 0);

const BIG = () => {
  // ---- 2–4 с: куст растёт — Скелет плюётся ягодами — Розовая отпрыгивает в куст
  BUSH.f0 = 48; BUSH.f1 = 56;
  sfx('creak', 48, { x: BX, dur: 10, gain: 0.5 }); sfx('pop', 58, { x: BX, gain: 0.6 }); ev('dust', { f: 50, x: BX, r: 80, n: 6, snd: false });
  key('pink', 52, { mouth: 'puzzlement' }, 0); key('skel', 52, { mouth: 'puzzlement' }, 0);
  key('skel', 52, { mouth: 'happy with theeth', eyes: 'angry' }, 0);
  flap(52, 70, 0.5);
  move('skel', 52, { x: SX0, y: GROUND }); move('skel', 60, { x: BX + 60, y: GROUND - 250 }, 'out2');
  key('skel', 61, { sx: 1.12, sy: 0.9 }, 2); key('skel', 64, { sx: 1, sy: 1 }, 2);
  sfx('chomp', 61, { who: 'skel', gain: 0.6 });
  BUSH.shakes.push(61);
  move('skel', 68, { x: 1180, y: GROUND - 300 }, 'io');
  const mouth = (f, S) => target('skel:mouth', S);
  const S1 = 68, S2 = 72, S3 = 76;
  for (const [f, part, dx, dy, s] of [[S1, 'face', 0, 0, 70], [S2, 'body', -30, 50, 60], [S3, 'top', 20, 30, 60]]) {
    key('skel', f - 2, { sx: 1.1, sy: 0.92 }, 2); key('skel', f, { sx: 0.9, sy: 1.1 }, 1); key('skel', f + 3, { sx: 1, sy: 1 }, 2);
    spit(f, mouth, (ff, S) => { const p = target(`pink:${part}`, S); return [p[0] + dx, p[1] + dy]; }, 'pink', part, dx, dy, s);
    key('pink', f + 8, { sx: 1.1, sy: 0.92, mouth: 'puzzlement', eyes: 'sad' }, 1); key('pink', f + 11, { sx: 1, sy: 1 }, 2);
  }
  sfx('ref:laugh', S3 + 4, { who: 'skel', gain: 0.85, pitch: 1.0 });
  // Розовая отпрыгивает — назад, в куст? куст между ними: она прыгает вперёд-вбок, неудачно — в куст
  const J0 = S3 + 8, IN = J0 + 10;
  key('pink', J0 - 2, { eyes: 'angry', mouth: 'angry theeth' }, 0);
  hop('pink', J0, IN, PX0, BX - 40, 200);
  ouch(IN, 'pink', [BX - 40, GROUND - 120], 1);
  const OUT = IN + 2, OL = OUT + 12, PX1 = 520;
  key('pink', IN, { sx: 0.8, sy: 1.25 }, 1);
  move('pink', OUT, { x: BX - 40, y: GROUND }); move('pink', OUT + 6, { y: GROUND - 360 }, 'out2'); move('pink', OL, { x: PX1, y: GROUND }, 'in2');
  move('pink', OUT + 6, { x: (BX - 40 + PX1) / 2 }, 'lin');
  key('pink', OUT + 2, { pivot: ST.CAST.pink.pivot, rot: 0 }, 0); move('pink', OL, { rot: -360 }, 'lin'); key('pink', OL + 1, { rot: 0 }, 0);
  key('pink', OL, { sx: 1.25, sy: 0.8 }, 1); key('pink', OL + 4, { sx: 1, sy: 1 }, 3);
  SPIKY.push({ who: 'pink', f0: IN, f1: 0 });
  sfx('land', OL, { who: 'pink', gain: 0.6 });
  move('skel', OUT, { x: 1180, y: GROUND - 300 }); move('skel', OUT + 12, { x: 1300, y: GROUND }, 'io');
  key('skel', OUT + 12, { sx: 1.2, sy: 0.82 }, 1); key('skel', OUT + 16, { sx: 1, sy: 1 }, 3);
  laugh('skel', OUT + 14, OUT + 30);

  // ---- 4–5.2 с: Розовая «растёт» — Скелет влюблён
  const PX = 560;
  key('pink', OL + 1, { eyes: 'angry', mouth: 'angry theeth' }, 0);
  const PB = transform('pink', OL + 2, PX1, PX, 1, { style: 'grow', love: 'skel', loveDur: 40 });
  for (const s of STAIN) if (s.who === 'pink') s.f1 = PB;
  SPIKY[0].f1 = PB;
  key('pink', PB, stance('pink', PX, 1), 0);
  key('pink', PB + 6, { mouth: 'theeth smile', eyes: 'angry' }, 0);

  // ---- 5.4–8 с: Скелет подлетает с ягодой — щелчок — в куст
  const FL0 = PB + 4, ARR = FL0 + 16;
  flap(FL0, ARR + 4, 0.6);
  key('skel', FL0, { mouth: 'happy - spittle' }, 0);
  move('skel', FL0, { x: 1300, y: GROUND }); move('skel', FL0 + 8, { x: 1100, y: GROUND - 280 }, 'out2'); move('skel', ARR, { x: PX + 330, y: GROUND - 280 }, 'io');
  BER.push({ f0: FL0, f1: 1e9, follow: 'skel' });
  sfx('kiss', ARR, { who: 'skel', gain: 0.6 });
  const FK = ARR + 4;
  key('pink', FK - 5, { handF: hand('pink', 'F', 0.6, -0.7), lean: 4, mouth: 'theeth smile', eyes: 'angry' }, 5);
  key('pink', FK, { hitF: 1, hitFto: (() => { const b = target('skel:body', stateAt(FK)); return [b[0] - 60, b[1]]; })(), hitFfix: FK }, 2, 'in2');
  key('pink', FK + 8, { ...stance('pink', PX, 1), hitF: 0, mouth: 'happy with theeth', eyes: 'normal' }, 8);
  sfx('flick', FK, { who: 'skel', gain: 1.0 });
  BER[BER.length - 1].f1 = FK;
  const INS = FK + 10;
  key('skel', FK, { mouth: 'puzzlement', eyes: 'sad', pivot: ST.CAST.skel.pivot }, 0);
  move('skel', FK, { x: PX + 330, y: GROUND - 280, rot: 0 }); move('skel', INS, { x: BX + 30, y: GROUND - 60, rot: 400 }, 'in2');
  key('skel', INS + 1, { rot: 0 }, 0);
  ouch(INS, 'skel', [BX + 30, GROUND - 120], 1);
  key('skel', INS, { sx: 0.8, sy: 1.25 }, 1);
  const OS = INS + 2, OSL = OS + 14, SX1 = 1340;
  move('skel', OS, { x: BX + 30, y: GROUND - 60 }); move('skel', OS + 7, { y: GROUND - 400 }, 'out2'); move('skel', OSL, { x: SX1, y: GROUND }, 'in2');
  move('skel', OS + 7, { x: (BX + 30 + SX1) / 2 }, 'lin');
  key('skel', OSL, { sx: 1.25, sy: 0.8 }, 1); key('skel', OSL + 4, { sx: 1, sy: 1 }, 3);
  SPIKY.push({ who: 'skel', f0: INS, f1: 0 });
  sfx('land', OSL, { who: 'skel', gain: 0.6 });
  sfx('ref:laugh', INS + 4, { who: 'pink', gain: 0.85, pitch: 1.35 });
  chuckle('pink', INS + 4, INS + 24, { mouth: 'happy with theeth' });

  // ---- 8–9.4 с: Скелет «растёт»
  const SX = 1420;
  key('skel', OSL + 4, { eyes: 'angry', mouth: 'angry theeth' }, 0);
  ev('vein', { who: 'skel', f0: OSL + 4, f1: OSL + 14 });
  const SB = transform('skel', OSL + 6, SX1, SX, -1, { style: 'grow' });
  SPIKY[1].f1 = SB;
  key('skel', SB, stance('skel', SX, -1), 0);
  key('skel', SB + 6, { mouth: 'angry theeth', eyes: 'angry' }, 0);
  key('pink', SB - 2, { mouth: 'puzzlement', eyes: 'sad' }, 0);

  // ---- 9.5–12.5 с: берёт куст, трясёт — ягодный дождь — нахлобучивает на неё: «АЙ!» — «пуф»
  const SX2 = BX + 250, W0 = SB + 2;
  walk('skel', W0, SX, SX2, 2, 8, -1);
  const GR = W0 + 18;
  key('skel', GR - 5, { lean: 24, hip: [0, toRig('skel', 160)], head: 6 }, 5);
  key('skel', GR, { hitF: 1, hitFto: [BX + 120, GROUND - 120], hitFfix: GR }, 4);
  BMOVE.push({ f0: GR, hand: 'skel' });
  sfx('crunch', GR, { x: BX, gain: 0.6 }); ouch(GR + 1, 'skel', [BX + 120, GROUND - 120], 0.7);
  key('skel', GR + 1, { mouth: 'puzzlement', eyes: 'sad' }, 0);
  const LIFT = GR + 10;
  key('skel', LIFT, { ...stance('skel', SX2, -1), hitF: 0, handF: hand('skel', 'F', 0.55, -0.7), handB: hand('skel', 'B', 0.35, -0.7), mouth: 'happy with theeth', eyes: 'angry' }, 8);
  // трясёт — ягоды летят в неё
  const SH0 = LIFT + 2, SH1 = SH0 + 12;
  for (let f = SH0; f < SH1; f += 4) { key('skel', f + 2, { handF: hand('skel', 'F', 0.65, -0.6), handB: hand('skel', 'B', 0.45, -0.6) }, 2); key('skel', f + 4, { handF: hand('skel', 'F', 0.55, -0.7), handB: hand('skel', 'B', 0.35, -0.7) }, 2); }
  for (let i = 0; i < 7; i++) {
    const f = SH0 + i * 2, tx = PX + ((i * 53) % 160) - 80, ty = GROUND - 640 + ((i * 37) % 200);
    BER.push({ f0: f, f1: f + 10, a: (ff, S) => { const h = C.skel.big.point(S.skel.st, 'handF'); return [h[0] - 40, h[1] - 120]; }, b: [tx, ty], arc: 120 });
  }
  sfx('creak', SH0, { x: SX2, dur: SH1 - SH0, gain: 0.5 });
  for (const [d, part, dx, dy] of [[10, 'face', -10, 10], [13, 'head', 40, -40], [16, 'body', 20, -40], [19, 'body', -30, 60]]) STAIN.push({ who: 'pink', f0: SH0 + d, f1: 0, part, dx, dy, s: 70, seed: d });
  sfx('squish', SH0 + 10, { who: 'pink', gain: 0.6 }); sfx('squish', SH0 + 16, { who: 'pink', gain: 0.6 });
  key('pink', SH0 + 10, { handF: hand('pink', 'F', 0.3, -0.85), handB: hand('pink', 'B', -0.2, -0.85), mouth: 'puzzlement', eyes: 'sad', head: -6 }, 4);
  // бросает куст ей на голову
  const TH = SH1 + 4, ON = TH + 10;
  key('skel', TH - 4, { handF: hand('skel', 'F', 0.3, -0.75), handB: hand('skel', 'B', 0.1, -0.75), lean: -6 }, 4);
  key('skel', TH, { handF: hand('skel', 'F', 0.95, -0.35), handB: hand('skel', 'B', 0.8, -0.45), lean: 12 }, 3, 'in2');
  key('skel', TH + 8, { ...stance('skel', SX2, -1), mouth: 'happy with theeth', eyes: 'normal' }, 8);
  sfx('swing', TH - 2, { who: 'skel', gain: 0.9 }); sfx('whoosh', TH, { x: 800, dur: 12, gain: 0.6 });
  const headP = (f, S) => { const t = target('pink:top', S); return [t[0], t[1] + 120]; };
  BMOVE.push({ f0: TH, f1: ON, a: (f, S) => bushPos(TH - 1, statesAt(TH - 1)), b: headP, arc: 150 });
  BMOVE.push({ f0: ON, on: 'pink', dy: 120 });
  ouch(ON, 'pink', (f, S) => target('pink:head', S), 1.5);
  key('pink', ON, { hip: [0, toRig('pink', 60)], head: 10, mouth: 'puzzlement', eyes: 'sad', handF: hand('pink', 'F', 0.3, -0.9), handB: hand('pink', 'B', -0.2, -0.9) }, 2);
  // подпрыгивает — куст падает рядом — «пуф»
  const JUMP = ON + 6, PJ = PX + 200;
  BMOVE.push({ f0: JUMP, f1: JUMP + 10, a: (f, S) => bushPos(JUMP - 1, statesAt(JUMP - 1)), b: [PX - 120, GROUND + 4], arc: 60 });
  BMOVE.push({ f0: JUMP + 10, at: [PX - 120, GROUND + 4] });
  sfx('land', JUMP + 10, { x: PX - 120, gain: 0.6 });
  key('pink', JUMP, { hip: [0, 8], lean: -10, head: -14, legFfk: 1, legBfk: 1, legF: [-20, 40], legB: [20, -30], handF: hand('pink', 'F', -0.6, -0.6), handB: hand('pink', 'B', -0.7, -0.5) }, 2);
  move('pink', JUMP, { x: PX, y: GROUND }); move('pink', JUMP + 7, { x: PX + 100, y: GROUND - 320 }, 'out2'); move('pink', JUMP + 14, { x: PJ, y: GROUND }, 'in2');
  key('pink', JUMP + 14, { ...stance('pink', PJ, 1), hip: [0, toRig('pink', 60)] }, 1);
  SPIKY.push({ who: 'pink', f0: ON, f1: 0 });
  sfx('scared', JUMP, { who: 'pink', gain: 0.9 });
  const psm = shrink('pink', JUMP + 13, PJ, 1, { mouth: 'puzzlement', eyes: 'sad', smoke: 420 });
  for (const s of STAIN) if (s.who === 'pink' && !s.f1) s.f1 = psm;
  SPIKY[2].f1 = psm;
  STAIN.push({ who: 'pink', f0: psm, f1: 0, part: 'face', dx: 0, dy: 0, s: 60, seed: 99 });
  ev('stars', { who: 'pink', f0: psm + 4, f1: psm + 20, snd: false });
  sfx('ref:laugh', ON + 4, { who: 'skel', gain: 0.85, pitch: 1.0 });
  chuckle('skel', ON + 4, psm + 10, { mouth: 'happy with theeth' });

  // ---- 12.7–15.8 с: шарик-Розовая катится через куст — ёж — прыг на ногу — он на одной ноге — падает — «пуф»
  key('pink', psm + 4, { eyes: 'angry', mouth: 'angry theeth', face: -1 }, 0);
  const R0 = psm + 6, RB0 = R0 + 6, R1 = RB0 + 14;
  key('pink', R0, { pivot: ST.CAST.pink.pivot }, 0);
  move('pink', R0, { x: PJ, y: GROUND, rot: 0 }); move('pink', RB0, { x: PX - 120, rot: -300 }, 'lin');
  sfx('whirr', R0, { who: 'pink', dur: R1 - R0, gain: 0.6 }); sfx('crunch', RB0, { x: PX - 120, gain: 0.7 });
  BUSH.shakes.push(RB0);
  SPIKY.push({ who: 'pink', f0: RB0, f1: 0, hedgehog: true });
  key('pink', RB0, { face: 1 }, 0);
  move('pink', R1, { x: SX2 - 280, rot: 400 }, 'lin');
  key('pink', R1 + 1, { rot: 0 }, 0);
  const J1 = R1 + 1, FOOT = J1 + 8;
  hop('pink', J1, FOOT, SX2 - 280, SX2 - 70, 90);
  ouch(FOOT, 'skel', [SX2 - 70, GROUND - 30], 1.2);
  key('skel', FOOT, { legFfk: 1, legF: [40, -90], handF: hand('skel', 'F', 0.5, 0.6), lean: 14, mouth: 'puzzlement', eyes: 'sad' }, 3);
  hop('pink', FOOT + 1, FOOT + 12, SX2 - 70, SX2 - 360, 120);
  for (let f = FOOT + 2; f < FOOT + 18; f += 8) { move('skel', f, { y: GROUND }); move('skel', f + 4, { y: GROUND - 60 }, 'out2'); move('skel', f + 8, { y: GROUND }, 'in2'); sfx('step', f + 8, { who: 'skel', gain: 0.5 }); }
  move('skel', FOOT + 2, { x: SX2 }); move('skel', FOOT + 18, { x: SX2 - 60 }, 'lin');
  key('skel', FOOT + 18, { ...C.skel.big.feet(SX2 - 60, -1), legFfk: 1 }, 16);
  sfx('scared', FOOT + 4, { who: 'skel', gain: 0.8 });
  const LIE = fallBack('skel', FOOT + 18, SX2 - 60, -1, { n: 12, stars: false });
  const ssm = shrink('skel', LIE + 6, SX2 + 120, -1, { mouth: 'puzzlement', eyes: 'sad', smoke: 420 });
  key('skel', ssm, { lean: 0, head: 0, hip: [0, 0], legF: null, legB: null, zB: null, rot: 0, b_B16: 0, b_B17: 0 }, 0);
  move('skel', ssm, { x: SX2 + 120, y: GROUND, rot: 0 });
  ev('stars', { who: 'skel', f0: ssm + 4, f1: ssm + 30, snd: false });
  sfx('ref:laugh', FOOT + 6, { who: 'pink', gain: 0.85, pitch: 1.35 });
  laugh('pink', FOOT + 13, FOOT + 22);

  // ---- 16–22 с: Розовая «растёт», берёт куст и нахлобучивает на шарика-Скелета — он улетает; в центр
  const PX4 = SX2 - 360;
  SPIKY[3].f1 = LIE + 6;
  const PB2 = transform('pink', LIE + 4, PX4, PX4, -1, { style: 'grow' });
  key('pink', PB2, stance('pink', PX4, 1), 0);
  turn('pink', PB2 + 2, 1, PX4);
  // куст сам прыгает к ней в руку (щелчок) — и на Скелета
  const SN = PB2 + 4, ONS = SN + 14;
  key('pink', SN - 3, { handF: hand('pink', 'F', 0.5, -0.75), mouth: 'theeth smile', eyes: 'angry' }, 3);
  sfx('flick', SN, { who: 'pink', gain: 0.9 });
  BMOVE.push({ f0: SN, f1: ONS, a: [PX - 120, GROUND + 4], b: (f, S) => { const t = target('skel:top', S); return [t[0], t[1] + 140]; }, arc: 380 });
  BMOVE.push({ f0: ONS, on: 'skel', dy: 140 });
  sfx('whoosh', SN, { x: 960, dur: 14, gain: 0.6 });
  ouch(ONS, 'skel', (f, S) => target('skel:body', S), 1.2);
  SPIKY.push({ who: 'skel', f0: ONS, f1: 0, hedgehog: true });
  key('skel', ONS, { mouth: 'puzzlement', eyes: 'sad', pivot: ST.CAST.skel.pivot, sx: 1.2, sy: 0.85 }, 1);
  const GO = ONS + 4;
  move('skel', GO, { x: SX2 + 120, y: GROUND, rot: 0 }); move('skel', GO + 22, { x: 2300, y: -250, rot: 900 }, 'out');
  BMOVE.push({ f0: GO + 2, f1: GO + 14, a: (f, S) => bushPos(GO + 1, statesAt(GO + 1)), b: [SX2 + 120, GROUND + 4], arc: 80 }, { f0: GO + 14, at: [SX2 + 120, GROUND + 4] });
  sfx('scared', GO, { who: 'skel', gain: 0.9 }); sfx('whoosh', GO, { who: 'skel', dur: 18, gain: 0.7 });
  ev('twinkle', { f: GO + 18, at: [1820, 150], n: 20, size: 56 });
  sfx('ref:laugh', GO + 4, { who: 'pink', gain: 0.85, pitch: 1.35 });
  key('pink', GO + 6, { mouth: 'happy with theeth', eyes: 'normal' }, 0);
  const WIN = victory('pink', GO + 12, PX4, { n: 9, stride: 110 });
  window.T = { IN, PB, FK, INS, SB, GR, ON, psm, FOOT, LIE, ssm, PB2, ONS, WIN };
};

// ------------------------------------------------------------------ рисование
const bushFront = (f) => { const c = BMOVE.filter((k) => f >= k.f0).pop(); return c && !c.at; };
const drawBush = (ctx, f, S) => { const p = bushPos(f, S); FX.berryBush(ctx, p[0], p[1], BW, E.EASE.out(E.clamp((f - BUSH.f0) / (BUSH.f1 - BUSH.f0), 0, 1)), shakeAt(f), 1, 4); };
ST.hooks.beforeChars.push((ctx, f, S, CAM) => {
  ctx.setTransform(...CAM);
  if (f >= BUSH.f0 && !bushFront(f)) drawBush(ctx, f, S);
});
ST.hooks.afterChars.push((ctx, f, S, CAM) => {
  ctx.setTransform(...CAM);
  if (f >= BUSH.f0 && bushFront(f)) drawBush(ctx, f, S);
  for (const s of STAIN) {
    if (f < s.f0 || (s.f1 && f >= s.f1)) continue;
    const p = target(`${s.who}:${s.part}`, S), big = S[s.who].p.form === 'big';
    FX.gumSplat(ctx, p[0] + s.dx * (big ? 1 : 0.6), p[1] + s.dy * (big ? 1 : 0.4), s.s * Math.min(1, (f - s.f0 + 2) / 3) * (big ? 1 : 0.8), s.seed, '#d6182e', '#4a0610');
  }
  for (const s of SPIKY) {
    if (f < s.f0 || (s.f1 && f >= s.f1)) continue;
    const big = S[s.who].p.form === 'big', b = target(`${s.who}:body`, S), r = big ? 120 : (s.hedgehog ? 150 : 120);
    ctx.save(); ctx.lineCap = 'round';
    const n = s.hedgehog ? 22 : 9;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + s.f0, L = s.hedgehog ? 40 : 26;
      const x0 = b[0] + Math.cos(a) * r * 0.95, y0 = b[1] + Math.sin(a) * r * 0.95 * (big ? 2 : 1);
      for (const [lw, c] of [[6, '#0e3a12'], [3, '#d8e8b0']]) { ctx.lineWidth = lw; ctx.strokeStyle = c; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x0 + Math.cos(a) * L, y0 + Math.sin(a) * L); ctx.stroke(); }
    }
    ctx.restore();
  }
  for (const b of BER) {
    if (b.follow) { if (f >= b.f0 && f < b.f1 && S[b.follow].p.form !== 'big') { const m = target(`${b.follow}:mouth`, S); FX.berry(ctx, m[0] - 10, m[1] + 6, 16); } continue; }
    const u = (f - b.f0) / (b.f1 - b.f0);
    if (u < 0 || u >= 1) continue;
    const a = P(b.a, b.f0, statesAt(b.f0)), c = P(b.b, b.f1, statesAt(b.f1));
    FX.berry(ctx, E.lerp(a[0], c[0], u), E.lerp(a[1], c[1], u) - Math.sin(Math.PI * u) * b.arc, 16);
  }
  for (const o of OUCH) { const at = P(o.at, o.f, statesAt(o.f)); FX.prickle(ctx, at[0], at[1], (f - o.f) / 12, o.size); }
});

ST.start(BIG);
