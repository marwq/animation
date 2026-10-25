// Ролик 15 (серия по образцу): Кактус — Толстый против Лорда, 25 с, 24 кадра/с. Плотно, как у HugyTi:
// кактус колется, Толстый становится ежом и стреляет колючками, шляпа с кактусом, кактус-батут.
// Музыка превращения — присланная, ~4 с с затиханием. Фон «майнкрафт», тема «луг».
//
//   0–1.8 с   шарик-Лорд (слева, за ним кактус), шарик-Толстый (справа)
//   1.8–3.4 с Толстый катится как шар для боулинга — Лорд отлетает на кактус, укол! подпрыгивает
//   3.5–4.7 с Лорд «растёт» под музыку и тяжело дышит
//   5.6–8 с   вырывает блок кактуса и бросает — Толстый всасывает его и глотает: колючки торчат изнутри,
//             он скачет от боли
//   8.3–10.3 с Толстый надувается и стреляет колючками — Лорду в лицо; прыгает Лорду на голову —
//             Лорд снова шарик
//   10.6–12 с Лорд «растёт» снова
//   12.3–15.5 с Толстый всасывает шляпу Лорда, жуёт и выплёвывает обратно ему на голову — внутри кактус!
//   15.8–20.5 с Лорд колдует шляпой: под Толстым вырастает кактус — укол! прыжок, снова на кактус, выше…
//             и улетает в небо
//   20.5–25 с Лорд в центре, руки вверх
'use strict';

const ST = Stage({
  name: 'mc15-cactus',
  cast: {
    lord: { small: ['lord-verity-small', { bodyHeight: 300 }], big: ['lord-verity-big', { height: 730 }], pivot: 337,
      voice: 1.0, lie: 55, color: '#ffe23a', ouch: ['ref:hit-ow', 1.0, 0.9] },
    fat: { small: ['fat-verity-small', { bodyHeight: 450 }], pivot: 508, voice: 0.75, moods: { love: 'happy' } },
  },
  order: ['lord', 'fat'],
  background: { theme: 'meadow', seed: 151, sunX: 1480, sunY: 140 },
  clouds: [[120, 80, 2.4, 0, 12], [700, 200, 1.8, 1, 16], [1150, 60, 2.6, 2, 10], [1700, 250, 1.6, 0, 18], [420, 300, 1.4, 1, 14]],
});
const { FPS, NF, GROUND, C, key, move, ev, sfx, hop, tumble, laugh, tremble, transform, shrink, stance, walk, turn,
  victory, chuckle, hand, toRig, statesAt, stateAt, target } = ST;

ST.parts.mouth = (ch, st) => E.apply(ch.eyeMatrix(st, 'puzzlement'), [611, 456]);
const P = (v, f, S) => (typeof v === 'function' ? v(f, S) : typeof v === 'string' ? target(v, S) : v);

// ------------------------------------------------------------------ кактусы, колючки, шляпа
const CB = 100;                                      // блок кактуса
const COLS = [];                                     // столбы: {x, n, f0, grow: [f, f1] | null, f1}
const BLOCKS = [];                                   // летящий блок: {segs}
const SPIKY = [];                                    // колючки торчат из Толстого: {f0, f1}
const STUCK = [];                                    // колючки воткнулись: {who, part, f0, f1, n, ang, spread, seed}
const VOLLEY = [];                                   // летят колючки: {f0, f1, from, to, n}
const HAT = [];                                      // шляпа Лорда: {f0, head} | {f0, f1, a, b, arc, spin} | {f0, mouth} | {f0, gone}
const CAPS = [];                                     // кактус в шляпе на голове: {f0, f1}
function spine(ctx, x, y, a, len = 34) {
  const c = Math.cos(a), s = Math.sin(a), w = len * 0.16;
  ctx.beginPath();
  ctx.moveTo(x - s * w, y + c * w); ctx.lineTo(x + c * len, y + s * len); ctx.lineTo(x + s * w, y - c * w); ctx.closePath();
  ctx.fillStyle = '#f2f7c8'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = '#1f3d12'; ctx.stroke();
}
function segAt(segs, f, S) {
  let cur = null;
  for (const c of segs) if (f >= c.f0) cur = c;
  if (!cur || cur.gone) return null;
  if (cur.at) return { x: cur.at[0], y: cur.at[1], rot: 0 };
  if (cur.hand) { const h = C.lord.big.point(S.lord.st, 'handB'); return { x: h[0], y: h[1] - CB * 0.4, rot: 0 }; }
  if (cur.mouth) { const m = target('fat:mouth', S); return { x: m[0], y: m[1], rot: 0.3 }; }
  const u = E.clamp((f - cur.f0) / (cur.f1 - cur.f0), 0, 1), a = P(cur.a, cur.f0, statesAt(cur.f0)), b = P(cur.b, f, S);
  return { x: E.lerp(a[0], b[0], u), y: E.lerp(a[1], b[1], u) - Math.sin(Math.PI * u) * (cur.arc || 0), rot: (cur.spin || 0) * u };
}
function hatAt(f, S) {
  let cur = null;
  for (const c of HAT) if (f >= c.f0) cur = c;
  if (!cur || cur.head) return null;
  if (cur.gone) return { gone: true };
  if (cur.hand) { const p = C.lord.big.point(S.lord.st, 'handF'); return { x: p[0], y: p[1] - 30, rot: 0, s: 1 }; }
  if (cur.mouth) { const m = target('fat:mouth', S); return { x: m[0], y: m[1], rot: 0.2, s: 0.7 }; }
  const u = E.clamp((f - cur.f0) / (cur.f1 - cur.f0), 0, 1), a = P(cur.a, cur.f0, statesAt(cur.f0)), b = P(cur.b, f, S);
  return { x: E.lerp(a[0], b[0], u), y: E.lerp(a[1], b[1], u) - Math.sin(Math.PI * u) * (cur.arc || 0), rot: (cur.spin || 0) * u, s: E.lerp(cur.s0 || 1, cur.s1 || 1, u) };
}

const LS = 470, FS = 1380, CX1 = 230;
// ================================================================== 0–1.8 с: стойка
key('lord', 0, { form: 'small', x: LS, y: GROUND, face: 1, look: 1, eyes: 'normal', mouth: 'smile normal', sx: 1, sy: 1, rot: 0, pivot: 0, alpha: 1 }, 0);
key('fat', 0, { form: 'small', x: FS, y: GROUND, face: -1, look: 1, eyes: 'normal', mouth: 'smile normal', sx: 1, sy: 1, rot: 0, pivot: 0, mouthK: 1 }, 0);
COLS.push({ x: CX1, n: 3, f0: 0 });
HAT.push({ f0: 0, head: true });

const BIG = () => {
  // ---- 1.8–3.4 с: Толстый катится шаром — Лорд отлетает на кактус, укол
  key('fat', 36, { mouth: 'theeth smile', eyes: 'angry' }, 0);
  sfx('ref:grin-eee', 36, { who: 'fat', gain: 0.5, pitch: 0.8 });
  key('fat', 40, { sx: 1.1, sy: 0.92 }, 4);
  key('fat', 44, { sx: 1, sy: 1, pivot: 508 }, 3);
  const BUMP = 56, FX1 = LS + 280;
  move('fat', 44, { x: FS, rot: 0 });
  move('fat', BUMP, { x: FX1, rot: -((FS - FX1) / (Math.PI * 450)) * 360 }, 'in');
  sfx('creak', 44, { who: 'fat', dur: 12, gain: 0.5 });
  sfx('whoosh', 46, { who: 'fat', dur: 10, gain: 0.6 });
  sfx('bonk', BUMP, { who: 'lord', gain: 0.9 });
  ev('shake', { f: BUMP, amp: 8, n: 6 });
  move('fat', BUMP + 8, { x: FX1 + 90, rot: -((FS - FX1 - 90) / (Math.PI * 450)) * 360 }, 'out2');
  // Лорд отлетает на макушку кактуса
  const TOPC = GROUND - 3 * CB, SIT = BUMP + 10;
  key('lord', BUMP, { mouth: 'puzzlement', eyes: 'sad', sx: 0.8, sy: 1.2 }, 1);
  move('lord', BUMP, { x: LS, y: GROUND });
  move('lord', SIT, { x: CX1, y: TOPC }, 'out');
  key('lord', BUMP + 4, { sx: 1, sy: 1 }, 3);
  key('lord', SIT, { sx: 1.2, sy: 0.84 }, 1);
  const PRICK = SIT + 2;
  sfx('ref:hit-ow', PRICK, { who: 'lord', gain: 1.0, pitch: 1.3 });
  sfx('pop', PRICK, { who: 'lord', gain: 0.6 });
  STUCK.push({ who: 'lord', part: 'bottom', f0: PRICK, f1: 112, n: 5, ang: Math.PI / 2, spread: 1.6, seed: 2 });
  key('lord', PRICK, { sx: 0.82, sy: 1.25, eyes: 'sad', mouth: 'puzzlement' }, 1);
  move('lord', PRICK, { x: CX1, y: TOPC });
  move('lord', PRICK + 9, { x: 330, y: GROUND - 420 }, 'out2');
  move('lord', PRICK + 18, { x: LS, y: GROUND }, 'in2');
  key('lord', PRICK + 6, { sx: 1, sy: 1 }, 4);
  key('lord', PRICK + 18, { sx: 1.25, sy: 0.8 }, 1);
  key('lord', PRICK + 22, { sx: 1, sy: 1 }, 3);
  sfx('land', PRICK + 18, { who: 'lord', gain: 0.6 });
  ev('stars', { who: 'lord', f0: PRICK + 18, f1: PRICK + 36, snd: false });
  key('fat', SIT, { mouth: 'happy', eyes: 'normal' }, 0);
  sfx('ref:laugh', SIT + 2, { who: 'fat', gain: 0.85, pitch: 0.75 });
  laugh('fat', SIT + 2, SIT + 24);
  move('fat', SIT + 6, { x: FX1 + 90 });
  move('fat', SIT + 30, { x: 1250, rot: 0 }, 'io');
  const FX2 = 1250;

  // ---- 3.5–4.7 с: Лорд «растёт» и тяжело дышит
  const LX = 600;
  key('lord', PRICK + 20, { eyes: 'angry', mouth: 'angry theeth' }, 0);
  const LB = transform('lord', PRICK + 22, LS, LX, 1, { style: 'grow' });
  STUCK[0].f1 = LB;
  key('lord', LB, stance('lord', LX, 1), 0);
  key('lord', LB + 4, { mouth: 'angry theeth', eyes: 'angry' }, 0);
  const BR = LB + 4;
  sfx('ref:lord-breath', BR, { who: 'lord', gain: 1.9, dur: 24, fade: 0.2 });
  for (const t of [0.02, 0.6]) {
    const f = BR + Math.round(t * FPS);
    key('lord', f + 3, { lean: -12, head: -10, hip: [0, toRig('lord', 4)] }, 3);
    key('lord', f + 11, { lean: -4, head: -3, hip: [0, toRig('lord', 14)] }, 8);
  }
  key('fat', LB - 2, { mouth: 'puzzlement', eyes: 'sad' }, 0);
  ev('sweat', { who: 'fat', f0: LB, f1: LB + 22 });

  // ---- 5.6–8 с: вырывает кактус и бросает — Толстый всасывает и глотает: колючки изнутри
  const T1 = LB + 26;
  turn('lord', T1, -1, LX);
  const PK = T1 + 10, BLK = [CX1, GROUND - 2.5 * CB];
  key('lord', PK - 8, { lean: 10, head: 4 }, 6);
  key('lord', PK, { hitB: 1, hitBto: [CX1, GROUND - 2.4 * CB], hitBfix: PK }, 6);
  COLS[0].top = [[PK, 3], [PK + 1, 2]];
  const B1 = { segs: [{ f0: PK, hand: true }] };
  BLOCKS.push(B1);
  sfx('pop', PK, { who: 'lord', gain: 0.6 });
  sfx('ref:grunt', PK + 2, { who: 'lord', gain: 0.5, pitch: 0.9 });
  key('lord', PK + 8, { hitB: 0, handB: hand('lord', 'B', 0.2, -0.85), lean: 0, head: 0 }, 6);
  turn('lord', PK + 12, 1, LX);
  const TH = PK + 18, IN = TH + 12;
  key('lord', TH - 6, { handB: hand('lord', 'B', -0.5, -0.8), lean: -8 }, 6);
  key('lord', TH, { handB: hand('lord', 'B', 0.95, -0.35), lean: 12, mouth: 'happy with theeth' }, 4, 'in2');
  key('lord', TH + 12, { ...stance('lord', LX, 1), mouth: 'happy with theeth', eyes: 'normal' }, 10);
  sfx('swing', TH - 3, { who: 'lord', gain: 0.8 });
  B1.segs.push({ f0: TH, f1: IN, a: (f, S) => { const h = C.lord.big.point(S.lord.st, 'handB'); return [h[0], h[1] - CB * 0.4]; }, b: 'fat:mouth', arc: 120, spin: Math.PI * 3 });
  B1.segs.push({ f0: IN, gone: true });
  key('fat', TH - 6, { mouth: 'puzzlement', mouthK: 1 }, 0);
  key('fat', TH - 2, { mouthK: 2.8, eyes: 'angry' }, 6, 'out');
  sfx('suck', TH - 2, { who: 'fat', dur: 14, gain: 0.8 });
  key('fat', IN, { mouthK: 1, mouth: 'smile normal', sx: 1.12, sy: 0.92 }, 2);
  sfx('gulp', IN, { who: 'fat', gain: 1.0 });
  key('fat', IN + 6, { sx: 1, sy: 1 }, 4);
  const OUCH = IN + 10;
  SPIKY.push({ f0: OUCH, f1: 0 });
  sfx('pop', OUCH, { who: 'fat', gain: 0.8 });
  sfx('ref:hit-ow', OUCH + 1, { who: 'fat', gain: 1.0, pitch: 0.7 });
  key('fat', OUCH, { mouth: 'puzzlement', eyes: 'sad', sx: 1.1, sy: 1.1 }, 1);
  for (let i = 0; i < 2; i++) {                                      // скачет от боли
    const j = OUCH + 2 + i * 11;
    hop('fat', j, j + 9, FX2 + (i % 2 ? 30 : -30), FX2 + (i % 2 ? -30 : 30), 110 + i * 20, { prep: 2 });
    if (i) sfx('ref:hit-ow', j + 2, { who: 'fat', gain: 0.7, pitch: 0.75 + i * 0.05 });
  }
  key('lord', OUCH + 4, { mouth: 'happy with theeth' }, 0);
  sfx('ref:laugh', OUCH + 6, { who: 'lord', gain: 0.85, pitch: 0.95 });
  chuckle('lord', OUCH + 6, OUCH + 30, { mouth: 'happy with theeth' });

  // ---- 8.3–10.3 с: надувается и стреляет колючками Лорду в лицо; прыгает ему на голову — Лорд шарик
  const PUFF = OUCH + 28, SHOT = PUFF + 10;
  key('fat', PUFF - 4, { mouth: 'theeth smile', eyes: 'angry' }, 0);
  ev('vein', { who: 'fat', f0: PUFF - 4, f1: PUFF + 10 });
  key('fat', PUFF, { x: FX2 }, 0);
  key('fat', SHOT, { sx: 1.3, sy: 1.3 }, 10, 'out');
  sfx('inflate', PUFF, { who: 'fat', dur: 10, gain: 0.7 });
  key('fat', SHOT + 2, { sx: 0.92, sy: 0.92 }, 2, 'in2');
  key('fat', SHOT + 8, { sx: 1, sy: 1, mouth: 'happy', eyes: 'normal' }, 5);
  SPIKY[0].f1 = SHOT;
  VOLLEY.push({ f0: SHOT, f1: SHOT + 8, from: 'fat:body', to: 'lord:face', n: 9 });
  for (let i = 0; i < 4; i++) sfx('flick', SHOT + i * 2, { who: 'fat', gain: 0.6 });
  const HITF = SHOT + 8;
  STUCK.push({ who: 'lord', part: 'face', f0: HITF, f1: 0, n: 7, ang: Math.PI, spread: 2.2, seed: 6, len: 40 });
  sfx('ref:hit-ow', HITF + 1, { who: 'lord', gain: 1.0, pitch: 0.95 });
  key('lord', HITF, { mouth: 'puzzlement', eyes: 'sad', lean: -10, head: -10, handF: hand('lord', 'F', 0.55, -0.85), handB: hand('lord', 'B', 0.35, -0.9) }, 2);
  tremble('lord', HITF + 2, HITF + 12, LX, 4);
  sfx('ref:laugh', HITF + 4, { who: 'fat', gain: 0.85, pitch: 0.75 });
  // прыжок на голову
  const JMP = HITF + 10, SQ = JMP + 12, ONH = JMP + 17, BALLH = 300 * 0.63;
  key('fat', JMP, { sx: 1.2, sy: 0.82 }, 3);
  move('fat', JMP, { x: FX2, y: GROUND });
  key('fat', JMP + 2, { sx: 0.88, sy: 1.14 }, 2);
  move('fat', JMP + 8, { x: (FX2 + LX) / 2 + 60, y: GROUND - 330 }, 'out2');
  move('fat', ONH, { x: LX + 30, y: GROUND - BALLH }, 'in2');
  key('fat', JMP + 8, { sx: 1, sy: 1 }, 3);
  sfx('jump', JMP + 2, { who: 'fat', gain: 0.6 });
  key('lord', SQ - 4, { hip: [0, toRig('lord', 60)], head: 10, lean: 0 }, 3);
  STUCK[1].f1 = SQ;
  const sm = shrink('lord', SQ, LX, 1, { mouth: 'puzzlement', eyes: 'sad', smoke: 420 });
  key('lord', sm, { lean: 0, head: 0, hip: [0, 0] }, 0);
  key('lord', ONH, { sx: 1.5, sy: 0.62 }, 2);                       // Толстый сел сверху
  sfx('slam', ONH, { who: 'lord', gain: 1.0 });
  sfx('squish', ONH, { who: 'lord', gain: 0.8 });
  ev('shake', { f: ONH, amp: 12, n: 8 });
  key('fat', ONH, { sx: 1.2, sy: 0.84 }, 1);
  key('fat', ONH + 4, { sx: 1, sy: 1 }, 3);
  move('fat', ONH + 6, { x: LX + 30, y: GROUND - BALLH });
  move('fat', ONH + 13, { x: 860, y: GROUND - 330 }, 'out2');
  move('fat', ONH + 20, { x: 1080, y: GROUND }, 'in2');
  key('fat', ONH + 20, { sx: 1.25, sy: 0.8 }, 1);
  key('fat', ONH + 24, { sx: 1, sy: 1 }, 3);
  sfx('jump', ONH + 6, { who: 'fat', gain: 0.5 });
  sfx('land', ONH + 20, { who: 'fat', gain: 0.7 });
  key('lord', ONH + 6, { sx: 1.5, sy: 0.62 }, 0);
  key('lord', ONH + 10, { sx: 0.9, sy: 1.1 }, 4, 'out');
  key('lord', ONH + 14, { sx: 1, sy: 1 }, 4);
  const FX3 = 1080;
  key('fat', ONH + 20, { mouth: 'happy', eyes: 'normal' }, 0);
  sfx('ref:laugh', ONH + 20, { who: 'fat', gain: 0.85, pitch: 0.75 });
  laugh('fat', ONH + 20, ONH + 38);
  ev('stars', { who: 'lord', f0: ONH + 8, f1: ONH + 24, snd: false });

  // ---- 10.6–12 с: Лорд «растёт» снова
  key('lord', ONH + 14, { eyes: 'angry', mouth: 'angry theeth' }, 0);
  ev('vein', { who: 'lord', f0: ONH + 14, f1: ONH + 24 });
  const LB2 = transform('lord', ONH + 18, LX, LX, 1, { style: 'grow' });
  key('lord', LB2, stance('lord', LX, 1), 0);
  key('lord', LB2 + 6, { mouth: 'happy with theeth', eyes: 'angry' }, 0);
  key('fat', LB2 - 2, { mouth: 'puzzlement', eyes: 'sad' }, 0);

  // ---- 12.3–15.5 с: Толстый всасывает шляпу, жуёт и выплёвывает обратно — с кактусом внутри
  const SH = LB2 + 6, HIN = SH + 14;
  key('fat', SH - 4, { mouth: 'puzzlement', mouthK: 1, eyes: 'angry' }, 0);
  key('fat', SH, { mouthK: 3.0 }, 6, 'out');
  sfx('suck', SH, { who: 'fat', dur: 16, gain: 0.9 });
  ev('suck', { f0: SH + 2, f1: HIN, at: 'fat:mouth', x0: LX + 100, snd: false });
  HAT.push({ f0: SH + 4, f1: HIN, a: 'lord:hat', b: 'fat:mouth', arc: 60, spin: -Math.PI * 4, s0: 1, s1: 0.6 });
  HAT.push({ f0: HIN, mouth: true });
  key('lord', SH + 4, { mouth: 'puzzlement', eyes: 'sad', lean: 10, head: 10, handF: hand('lord', 'F', 0.6, -0.9) }, 4);
  key('fat', HIN, { mouthK: 1, mouth: 'smile normal', sx: 1.12, sy: 0.92 }, 3);
  sfx('gulp', HIN, { who: 'fat', gain: 0.8 });
  for (let i = 0; i < 2; i++) {
    key('fat', HIN + 4 + i * 6, { sx: 1.1, sy: 0.94, mouth: 'happy' }, 3);
    key('fat', HIN + 7 + i * 6, { sx: 0.95, sy: 1.05, mouth: 'smile normal' }, 3);
    sfx('chomp', HIN + 4 + i * 6, { who: 'fat', gain: 0.6 });
  }
  // во рту рос кактус: выплёвывает шляпу ему на голову
  const SPIT = HIN + 16, LAND = SPIT + 12;
  key('fat', SPIT, { mouth: 'puzzlement', mouthK: 2.2, sx: 0.92, sy: 1.08 }, 2);
  key('fat', SPIT + 8, { mouthK: 1, sx: 1, sy: 1, mouth: 'theeth smile' }, 5);
  sfx('spit', SPIT, { who: 'fat', gain: 1.0 });
  HAT.push({ f0: SPIT, f1: LAND, a: 'fat:mouth', b: (f, S) => { const h = target('lord:hat', S); return [h[0], h[1] - 10]; }, arc: 160, spin: Math.PI * 4, s0: 0.6, s1: 1 });
  HAT.push({ f0: LAND, head: true });
  CAPS.push({ f0: LAND, f1: LAND + 34 });
  key('lord', LAND - 6, { lean: 0, head: 0, handF: stance('lord', LX, 1).handF }, 5);
  sfx('pop', LAND, { who: 'lord', gain: 0.6 });
  key('lord', LAND + 2, { mouth: 'happy with theeth' }, 0);
  const OW = LAND + 8;
  sfx('ref:hit-ow', OW, { who: 'lord', gain: 1.0, pitch: 0.95 });
  key('lord', OW, { mouth: 'puzzlement', eyes: 'sad', handF: hand('lord', 'F', 0.2, -1.0), handB: hand('lord', 'B', -0.1, -1.0) }, 2);
  move('lord', OW, { y: GROUND });
  move('lord', OW + 7, { y: GROUND - 40 }, 'out2');
  move('lord', OW + 14, { y: GROUND }, 'in2');
  key('lord', OW + 1, { legFfk: 1, legBfk: 1, legF: [-20, 40], legB: [20, -30] }, 2);
  key('lord', OW + 14, { ...stance('lord', LX, 1), handF: hand('lord', 'F', 0.2, -1.0), handB: hand('lord', 'B', -0.1, -1.0) }, 3);
  ev('dust', { f: OW + 14, x: LX, r: 40, n: 5, snd: 'land' });
  // стряхивает кактус с головы
  const SHK = OW + 18;
  key('lord', SHK, { head: -14, lean: -6 }, 3);
  key('lord', SHK + 4, { head: 14, lean: 6 }, 3);
  key('lord', SHK + 8, { ...stance('lord', LX, 1), mouth: 'angry theeth', eyes: 'angry' }, 5);
  CAPS[0].f1 = SHK + 4;
  BLOCKS.push({ segs: [{ f0: SHK + 4, f1: SHK + 20, a: (f, S) => { const h = target('lord:hat', S); return [h[0], h[1] - 60]; }, b: [300, GROUND - CB / 2], arc: 200, spin: -Math.PI * 3 }, { f0: SHK + 20, at: [300, GROUND - CB / 2] }] });
  sfx('whoosh', SHK + 4, { who: 'lord', dur: 10, gain: 0.5 });
  sfx('land', SHK + 20, { x: 300, gain: 0.5 });
  key('fat', OW + 2, { mouth: 'happy', eyes: 'normal' }, 0);
  sfx('ref:laugh', OW + 4, { who: 'fat', gain: 0.85, pitch: 0.75 });
  laugh('fat', OW + 4, OW + 26);

  // ---- 15.8–20.5 с: колдует шляпой — кактус-батут под Толстым
  const MG = SHK + 10;
  key('lord', MG - 6, { hitF: 1, hitFto: 'lord:brim' }, 6);
  key('lord', MG + 2, { hitF: 0, handF: hand('lord', 'F', 0.95, -0.2), mouth: 'happy with theeth', eyes: 'angry' }, 5);
  HAT.push({ f0: MG, f1: MG + 4, a: 'lord:hat', b: (f, S) => { const h = C.lord.big.point(S.lord.st, 'handF'); return [h[0], h[1] - 30]; }, spin: 0 });
  HAT.push({ f0: MG + 4, hand: true });
  sfx('pop', MG, { who: 'lord', gain: 0.5 });
  const WAVE = MG + 10;
  ev('twinkle', { f: WAVE, at: [FX3, GROUND - 10], n: 18, size: 50 });
  ev('twinkle', { f: WAVE + 4, at: [FX3 - 100, GROUND - 30], n: 12, size: 36 });
  sfx('sparkle', WAVE, { who: 'lord', gain: 0.8 });
  key('fat', WAVE + 2, { mouth: 'puzzlement', eyes: 'sad' }, 0);
  const G0 = WAVE + 6, G1 = G0 + 8, H = CB;
  COLS.push({ x: FX3, n: 1, f0: G0, grow: [G0, G1] });
  sfx('grow', G0, { x: FX3, gain: 0.9 });
  move('fat', G0, { x: FX3, y: GROUND });
  move('fat', G1, { y: GROUND - H }, 'out');
  // укол — прыжок — снова на кактус, выше — и в небо
  let f = G1, hgt = 130;
  for (let i = 0; i < 3; i++) {
    sfx('ref:hit-ow', f, { who: 'fat', gain: 1.0, pitch: 0.7 + i * 0.08 });
    sfx('spring', f, { who: 'fat', gain: 0.7 });
    key('fat', f, { sx: 1.2, sy: 0.82, mouth: 'puzzlement', eyes: 'sad' }, 1);
    key('fat', f + 3, { sx: 0.9, sy: 1.12 }, 3);
    move('fat', f, { x: FX3, y: GROUND - H });
    if (i < 2) {
      const up = 8 + i * 2;
      move('fat', f + up, { y: GROUND - H - hgt }, 'out2');
      move('fat', f + 2 * up, { y: GROUND - H }, 'in2');
      key('fat', f + up, { sx: 1, sy: 1 }, 4);
      ev('stars', { who: 'fat', f0: f + 2, f1: f + 2 * up, snd: false });
      f += 2 * up; hgt += 90;
    }
  }
  const FLY = f;
  move('fat', FLY + 16, { x: FX3 + 180, y: -500 }, 'out');
  move('fat', FLY, { rot: 0 });
  key('fat', FLY, { pivot: 508 }, 0);
  move('fat', FLY + 16, { rot: 540 }, 'lin');
  sfx('whoosh', FLY, { who: 'fat', dur: 14, gain: 0.7 });
  sfx('scared', FLY + 2, { who: 'fat', gain: 0.7, pitch: 0.8 });
  ev('twinkle', { f: FLY + 14, at: [FX3 + 160, 90], n: 22, size: 60 });
  key('lord', G1 + 2, { mouth: 'happy with theeth', eyes: 'normal' }, 0);
  sfx('ref:laugh', G1 + 4, { who: 'lord', gain: 0.85, pitch: 0.95 });
  chuckle('lord', G1 + 4, G1 + 30, { mouth: 'happy with theeth' });
  // шляпу обратно и в центр
  const PUT = FLY + 8;
  key('lord', PUT, { hitF: 1, hitFto: 'lord:brim' }, 6);
  HAT.push({ f0: PUT - 6, f1: PUT, a: (ff, S) => { const h = C.lord.big.point(S.lord.st, 'handF'); return [h[0], h[1] - 30]; }, b: 'lord:hat', spin: 0 });
  HAT.push({ f0: PUT + 1, head: true });
  key('lord', PUT + 8, { ...stance('lord', LX, 1), hitF: 0 }, 6);
  const WIN = victory('lord', PUT + 10, LX, { n: 9, stride: 110 });
  window.T = { BUMP, PRICK, LB, IN, SHOT, ONH, LB2, HIN, LAND, OW, G1, FLY, WIN };
};

// поля шляпы большого Лорда; низ шарика-Лорда (колючки)
ST.parts.brim = (ch, st) => {
  const c = ch.point(st, 'hat'), l = ch.layers.find((x) => x.name === 'hat');
  return [c[0], c[1] + (l.bbox[3] - l.bbox[1]) * ch.scale * 0.5 - 10];
};
ST.parts.bottom = (ch, st, p) => { const b = ch.point(st, 'body'); return [b[0] - 30, b[1] + ch.height * 0.36 * (p.sy || 1)]; };
ST.hooks.drawPose = (who, p, f) => {
  if (who !== 'lord') return p;
  const h = hatAt(f, statesAt(f));
  return h ? { ...p, hide: [...(p.hide || []), 'hat'] } : p;
};
function drawHat(ctx, f, S) {
  const h = hatAt(f, S);
  if (!h || h.gone) return;
  const L = C.lord[S.lord.p.form === 'big' ? 'big' : 'small'], l = L.layers.find((x) => x.name === 'hat');
  const sc = L.scale * (h.s || 1), w = (l.bbox[2] - l.bbox[0]) * sc, hh = (l.bbox[3] - l.bbox[1]) * sc;
  ctx.save(); ctx.translate(h.x, h.y); ctx.rotate(h.rot || 0);
  ctx.drawImage(l.img.canvas, -w / 2, -hh / 2, w, hh);
  ctx.restore();
}
function drawBlock(ctx, x, y, rot) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); FX.cactus(ctx, 0, CB / 2, 1, CB); ctx.restore();
}

ST.hooks.beforeChars.push((ctx, f, S, CAM) => {
  ctx.setTransform(...CAM);
  for (const c of COLS) {
    if (f < c.f0 || (c.f1 && f >= c.f1)) continue;
    let n = c.n;
    if (c.top) for (const [g, v] of c.top) if (f >= g) n = v;
    if (c.grow) {
      const u = E.EASE.out(E.clamp((f - c.grow[0]) / (c.grow[1] - c.grow[0]), 0, 1)), hh = n * CB * u;
      ctx.save(); ctx.beginPath(); ctx.rect(c.x - CB, GROUND - hh - 4, CB * 2, hh + 4); ctx.clip();
      FX.cactus(ctx, c.x, GROUND - n * CB + hh, n, CB);
      ctx.restore();
    } else FX.cactus(ctx, c.x, GROUND, n, CB);
  }
  for (const B of BLOCKS) { const b = segAt(B.segs, f, S); if (b && B.segs[B.segs.length - 1].at && f >= B.segs[B.segs.length - 1].f0) drawBlock(ctx, b.x, b.y, 0); }
});
ST.hooks.afterChars.push((ctx, f, S, CAM) => {
  ctx.setTransform(...CAM);
  // колючки торчат из Толстого
  for (const k of SPIKY) {
    if (f < k.f0 || (k.f1 && f >= k.f1)) continue;
    const { ch, st, p } = S.fat, c = ch.point(st, 'body'), rx = ch.width * 0.46 * (p.sx || 1), ry = ch.height * 0.46 * (p.sy || 1);
    const grow = Math.min(1, (f - k.f0 + 1) / 4);
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2 + 0.2;
      spine(ctx, c[0] + Math.cos(a) * rx * 0.96, c[1] + Math.sin(a) * ry * 0.96, a, 40 * grow);
    }
  }
  for (const s of STUCK) {
    if (f < s.f0 || (s.f1 && f >= s.f1)) continue;
    const p = target(`${s.who}:${s.part}`, S), r = FX.rng(s.seed), face = S[s.who].p.face || 1;
    for (let i = 0; i < s.n; i++) {
      const a = (face > 0 ? s.ang : Math.PI - s.ang) + (r() - 0.5) * s.spread;
      const ox = (r() - 0.5) * 70, oy = (r() - 0.5) * 50;
      spine(ctx, p[0] + ox, p[1] + oy, a + Math.PI, s.len || 34);
    }
  }
  for (const v of VOLLEY) {
    if (f < v.f0 || f > v.f1) continue;
    const a = target(v.from, S), b = target(v.to, S), r = FX.rng(v.f0);
    for (let i = 0; i < v.n; i++) {
      const d = i * 0.08, u = E.clamp((f - v.f0) / (v.f1 - v.f0) * 1.3 - d, 0, 1);
      if (u <= 0 || u >= 1) continue;
      const tx = b[0] + (r() - 0.5) * 90, ty = b[1] + (r() - 0.5) * 70;
      spine(ctx, E.lerp(a[0], tx, u), E.lerp(a[1], ty, u), Math.atan2(ty - a[1], tx - a[0]), 40);
    }
  }
  for (const B of BLOCKS) {
    const last = B.segs[B.segs.length - 1];
    if (last.at && f >= last.f0) continue;
    const b = segAt(B.segs, f, S);
    if (b) drawBlock(ctx, b.x, b.y, b.rot);
  }
  for (const c of CAPS) {
    if (f < c.f0 || f >= c.f1) continue;
    const h = target('lord:hat', S);
    drawBlock(ctx, h[0], h[1] - 60, 0);
  }
  drawHat(ctx, f, S);
});

ST.start(BIG);
