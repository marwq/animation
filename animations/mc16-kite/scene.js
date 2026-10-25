// Ролик 16 (серия по образцу): Воздушный змей — Радужный против Розовой, 25 с, 24 кадра/с. Плотно, как у HugyTi:
// змей как оружие и как громоотвод, магическая туча с молнией, превращения туда и обратно. Музыка
// превращения — присланная, ~4 с с затиханием, только при первом превращении. Фон — равнина.
//
//   0–1.8 с   радужный шарик (слева) и шарик-Розовая (справа) запускает змея — нитка во рту
//   1.8–3.5 с Радужный дует — змей пикирует Розовой на голову; она прыгает вслепую и стряхивает его
//   3.5–4.7 с Розовая «растёт» под музыку — Радужный влюблён, скачет к ней
//   5.5–8.5 с она ныряет змеем — хвост цепляет Радужного, змей уносит его вверх; рывок — Радужный летит
//             кувырком и падает на голову
//   8.7–10 с  Радужный «растёт»
//   10.2–13 с щёлкает пальцами — над змеем туча; молния бьёт в змея, искра бежит по нитке — Розовую трясёт,
//             она в саже и сжимается в шарик
//   13.2–14.4 с Розовая «растёт» снова — Радужный опять влюблён
//   14.6–20 с подбирает змея и бросает — он налипает Радужному на лицо; щелчок — туча над ним, молния в змея —
//             Радужного трясёт; Розовая дует — он улетает за кадр
//   20–25 с   Розовая в центре, руки вверх
'use strict';

const ST = Stage({
  name: 'mc16-kite',
  cast: {
    rb: { small: ['skeleton-verity-small', { scale: 0.455, recolor: 'rainbow' }], big: ['all-verity-color', { height: 730 }],
      pivot: 325, voice: 0.85, lie: 55, color: '#ff7a3a', moods: { angry: 'angry theeth', grin: 'happy with theeth', big: 'theeth smile', love: 'happy - spittle' } },
    pink: { small: ['girl-verity-small', { bodyHeight: 300 }], big: ['girl-verity-big', { height: 730, splitFeet: true }],
      pivot: 337, voice: 1.35, vAngle: 50, color: '#ff4fc8', moods: { angry: 'angry theeth', grin: 'theeth smile', big: 'theeth smile' } },
  },
  order: ['rb', 'pink'],
  background: { theme: 'plains', seed: 161, sunX: 960, sunY: 120 },
  clouds: [[110, 70, 2.4, 0, 12], [560, 220, 1.8, 1, 16], [1250, 60, 2.6, 2, 10], [1700, 260, 1.6, 0, 18]],
});
const { FPS, NF, GROUND, C, key, move, ev, sfx, hop, laugh, tremble, transform, shrink, stance, walk,
  flyOff, victory, chuckle, hand, toRig, statesAt, stateAt, target } = ST;

const P = (v, f, S) => (typeof v === 'function' ? v(f, S) : typeof v === 'string' ? target(v, S) : v);

// ------------------------------------------------------------------ змей, нитка, туча, молния, сажа
const KS = 170;                                    // высота ромба
const KT = new E.Track();                          // x, y, rot, tail — свободный полёт
const kk = (f, props, n = null, ease = 'io') => KT.add(f, props, ease, n);
const KM = [{ f0: 0 }];                            // {f0} — по ключам | {f0, head: who} | {f0, face: who} | {f0, hand: who}
const STR = [];                                    // нитка: {f0, f1, from: fn|part}
const STORM = [];                                  // туча: {f0, f1, x, y}
const BOLTS = [];                                  // молния: {f, from, to}
const SPARK = [];                                  // искра по нитке: {f0, f1}
const SOOT = [];                                   // {who, f0, f1}
function kiteAt(f, S) {
  let m = KM[0];
  for (const c of KM) if (f >= c.f0) m = c;
  if (m.head) { const t = target(`${m.head}:top`, S); return { x: t[0], y: t[1] - KS * 0.3, rot: 0.35, tail: Math.PI * 0.75 }; }
  if (m.face) { const t = target(`${m.face}:face`, S); return { x: t[0] + 10, y: t[1] + 10, rot: 0.15, tail: Math.PI * 0.6 }; }
  if (m.hand) { const h = C[m.hand].big.point(S[m.hand].st, 'handB'); return { x: h[0], y: h[1] - KS * 0.4, rot: -0.2, tail: Math.PI * 0.55 }; }
  const p = KT.sample(f, {});
  return { x: p.x + Math.sin(f * 0.13) * 10, y: p.y + Math.sin(f * 0.21) * 8, rot: p.rot + Math.sin(f * 0.17) * 0.06, tail: p.tail };
}
const kiteBottom = (k) => [k.x - Math.sin(k.rot) * KS * 0.5, k.y + Math.cos(k.rot) * KS * 0.5];

const RS = 520, PS = 1380;
// ================================================================== 0–1.8 с: стойка
kk(0, { x: 1150, y: 250, rot: 0.15, tail: Math.PI * 0.62 }, 0);
key('rb', 0, { form: 'small', x: RS, y: GROUND, face: 1, look: 1, eyes: 'normal', mouth: 'smile normal', sx: 1, sy: 1, rot: 0, pivot: 0, alpha: 1 }, 0);
key('pink', 0, { form: 'small', x: PS, y: GROUND, face: -1, look: 1, eyes: 'normal', mouth: 'happy with theeth', sx: 1, sy: 1, rot: 0, pivot: 0, alpha: 1 }, 0);
STR.push({ f0: 0, f1: 0, from: 'pink:lips' });

const BIG = () => {
  // ---- 1.8–3.5 с: Радужный дует — змей пикирует Розовой на голову
  key('rb', 38, { mouth: 'happy with theeth', eyes: 'angry' }, 0);
  key('rb', 40, { sx: 1.12, sy: 0.92, mouth: 'puzzlement' }, 5);
  sfx('suck', 38, { who: 'rb', dur: 6, gain: 0.5 });
  key('rb', 46, { sx: 0.93, sy: 1.07 }, 2);
  key('rb', 60, { sx: 1, sy: 1, mouth: 'happy with theeth' }, 6);
  ev('wind', { f0: 46, f1: 66, x0: RS + 140, x1: 1700, snd: false });
  sfx('gust', 46, { who: 'rb', dur: 18, gain: 0.8 });
  const HIT = 62;
  kk(50, { x: 1150, y: 250, rot: 0.15 }, 0);
  kk(56, { x: 1220, y: 130, rot: 0.9 }, 6, 'out2');
  const pt = target('pink:top', stateAt(HIT));
  kk(HIT, { x: pt[0], y: pt[1] - KS * 0.3, rot: 0.35, tail: Math.PI * 0.75 }, 6, 'in2');
  sfx('whoosh', 52, { x: 1200, dur: 10, gain: 0.6 });
  KM.push({ f0: HIT, head: 'pink' });
  sfx('bonk', HIT, { who: 'pink', gain: 0.9 });
  key('pink', HIT, { sx: 1.25, sy: 0.8, mouth: 'puzzlement', eyes: 'sad' }, 1);
  key('pink', HIT + 4, { sx: 1, sy: 1 }, 3);
  sfx('ref:grunt', HIT + 2, { who: 'pink', gain: 0.6, pitch: 1.5 });
  hop('pink', HIT + 6, HIT + 14, PS, PS - 60, 70);
  hop('pink', HIT + 16, HIT + 24, PS - 60, PS - 20, 70);
  const OFF = HIT + 26;
  key('pink', OFF, { sx: 0.85, sy: 1.18, rot: 0 }, 2);
  key('pink', OFF + 4, { sx: 1, sy: 1 }, 3);
  KM.push({ f0: OFF });
  const po = kiteAt(OFF - 1, stateAt(OFF - 1));
  kk(OFF, { x: po.x, y: po.y, rot: 0.35, tail: Math.PI * 0.75 }, 0);
  kk(OFF + 12, { x: 1650, y: 240, rot: -0.15, tail: Math.PI * 0.55 }, 12, 'out2');
  sfx('whoosh', OFF, { who: 'pink', dur: 10, gain: 0.5 });
  key('rb', HIT + 2, { mouth: 'happy with theeth', eyes: 'normal' }, 0);
  sfx('ref:laugh', HIT + 4, { who: 'rb', gain: 0.85, pitch: 1.1 });
  laugh('rb', HIT + 4, HIT + 22);

  // ---- 3.5–4.7 с: Розовая «растёт» — Радужный влюблён и скачет к ней
  const PX = 1360;
  key('pink', OFF + 2, { eyes: 'angry', mouth: 'angry theeth' }, 0);
  const PB = transform('pink', OFF + 2, PS - 20, PX, -1, { style: 'grow', love: 'rb', loveDur: 60 });
  STR[0].f1 = PB;
  STR.push({ f0: PB, f1: 0, from: (f, S) => C.pink.big.point(S.pink.st, 'handB') });
  key('pink', PB, { ...stance('pink', PX, -1), handB: hand('pink', 'B', -0.3, -0.5) }, 0);
  key('pink', PB + 6, { mouth: 'theeth smile', eyes: 'normal' }, 0);
  const R1 = 760, R2 = 900;
  hop('rb', PB + 8, PB + 20, RS, R1, 80);
  hop('rb', PB + 24, PB + 36, R1, R2, 80);

  // ---- 5.5–8.5 с: змей ныряет — хвост цепляет Радужного и уносит; рывок — кувырком на голову
  const DIVE = PB + 40, GRAB = DIVE + 10;
  key('pink', DIVE - 4, { handB: hand('pink', 'B', 0.4, -0.2), mouth: 'happy with theeth' }, 4);
  const rt = target('rb:top', stateAt(GRAB));
  kk(DIVE, { x: 1650, y: 240, rot: -0.15 }, 0);
  kk(GRAB, { x: rt[0] + 40, y: rt[1] - KS * 0.9, rot: -0.5, tail: Math.PI * 0.62 }, 10, 'in2');
  sfx('whoosh', DIVE, { x: 1300, dur: 10, gain: 0.6 });
  key('rb', GRAB, { mouth: 'puzzlement', eyes: 'sad' }, 0);
  sfx('scared', GRAB + 1, { who: 'rb', gain: 0.8 });
  const UP = GRAB + 22, TOPK = [900, 110];
  kk(UP, { x: TOPK[0], y: TOPK[1], rot: 0.2, tail: Math.PI * 0.5 }, 22, 'io');
  key('pink', GRAB + 4, { handB: hand('pink', 'B', -0.4, -0.7) }, 10);
  // Радужный висит под змеем
  const dTop = rt[1] - GROUND;
  for (let f = GRAB; f <= UP + 8; f++) {
    const k = kiteAt(f, stateAt(f)), sw = Math.sin((f - GRAB) * 0.4) * 14;
    move('rb', f, { x: k.x - 40 + sw, y: k.y + KS * 0.9 - dTop });
  }
  key('rb', GRAB + 2, { sx: 0.9, sy: 1.1 }, 2);
  key('rb', GRAB + 8, { sx: 1, sy: 1 }, 4);
  // рывок — летит кувырком и падает на голову
  const YANK = UP + 8, LAND = YANK + 18, RL = 640;
  key('pink', YANK - 3, { handB: hand('pink', 'B', 0.2, 0.1), lean: 10 }, 3, 'in2');
  key('pink', YANK + 8, { handB: hand('pink', 'B', -0.3, -0.6), lean: 0 }, 6);
  sfx('swing', YANK - 2, { who: 'pink', gain: 0.8 });
  kk(YANK, { x: TOPK[0], y: TOPK[1] }, 0);
  kk(YANK + 6, { x: 1150, y: 90, rot: -0.3 }, 6, 'out2');
  kk(YANK + 20, { x: 1650, y: 240, rot: -0.15, tail: Math.PI * 0.55 }, 14);
  const r0 = stateAt(YANK).rb.p;
  key('rb', YANK, { pivot: 150 }, 0);
  move('rb', YANK, { x: r0.x, y: r0.y, rot: 0 });
  move('rb', YANK + 8, { x: (r0.x + RL) / 2, y: r0.y - 120 }, 'out2');
  move('rb', LAND, { x: RL, y: GROUND }, 'in2');
  move('rb', LAND, { rot: -540 }, 'lin');
  key('rb', LAND + 1, { rot: 0 }, 0);
  key('rb', LAND, { sx: 1.35, sy: 0.72 }, 1);
  key('rb', LAND + 6, { sx: 1, sy: 1 }, 5);
  sfx('whoosh', YANK, { who: 'rb', dur: 14, gain: 0.6 });
  sfx('fall', LAND, { who: 'rb', gain: 0.9 });
  sfx('ref:hit-ow', LAND + 2, { who: 'rb', gain: 0.8, pitch: 1.2 });
  ev('dust', { f: LAND, x: RL, r: 50, n: 6 });
  ev('shake', { f: LAND, amp: 8, n: 6 });
  ev('stars', { who: 'rb', f0: LAND + 2, f1: LAND + 22, snd: false });
  key('pink', LAND, { mouth: 'happy with theeth' }, 0);
  sfx('ref:laugh', LAND + 2, { who: 'pink', gain: 0.85, pitch: 1.35 });
  chuckle('pink', LAND + 2, LAND + 24, { mouth: 'happy with theeth' });

  // ---- 8.7–10 с: Радужный «растёт»
  const RX = 640;
  key('rb', LAND + 16, { eyes: 'angry', mouth: 'angry theeth' }, 0);
  ev('vein', { who: 'rb', f0: LAND + 16, f1: LAND + 26 });
  const RB = transform('rb', LAND + 20, RL, RX, 1, { style: 'grow' });
  key('rb', RB, stance('rb', RX, 1), 0);
  key('rb', RB + 6, { mouth: 'happy with theeth', eyes: 'angry' }, 0);
  key('pink', RB - 2, { mouth: 'puzzlement', eyes: 'sad' }, 0);

  // ---- 10.2–13 с: щелчок — туча над змеем; молния — искра по нитке — Розовую трясёт, она в саже
  const SN = RB + 10;
  key('rb', SN - 4, { handF: hand('rb', 'F', 0.75, -0.75) }, 4);
  sfx('flick', SN, { who: 'rb', gain: 1.0 });
  key('rb', SN + 6, { handF: hand('rb', 'F', 0.5, -0.3) }, 6);
  const CL1 = [1650, 95];
  STORM.push({ f0: SN + 2, f1: SN + 44, x: CL1[0], y: CL1[1] });
  ev('twinkle', { f: SN + 2, at: CL1, n: 18, size: 50 });
  sfx('poof', SN + 2, { x: CL1[0], gain: 0.6 });
  sfx('rain', SN + 6, { x: CL1[0], dur: 34, gain: 0.5 });
  key('pink', SN + 6, { head: -12, mouth: 'puzzlement', eyes: 'sad' }, 6);
  const ZAP = SN + 14;
  BOLTS.push({ f: ZAP, from: [CL1[0], CL1[1] + 60], to: (f, S) => { const k = kiteAt(f, S); return [k.x, k.y]; } });
  sfx('zap', ZAP, { x: CL1[0], gain: 1.0 });
  ev('flash', { f: ZAP, at: [CL1[0], 200], strength: 0.45 });
  SPARK.push({ f0: ZAP + 3, f1: ZAP + 11 });
  const SHOCK = ZAP + 11;
  ev('flash', { f: SHOCK, who: 'pink', strength: 0.4 });
  sfx('zap', SHOCK, { who: 'pink', gain: 0.9 });
  sfx('ref:hit-ow', SHOCK + 2, { who: 'pink', gain: 0.9, pitch: 1.4 });
  key('pink', SHOCK, { head: 0, handF: hand('pink', 'F', 0.5, -0.85), handB: hand('pink', 'B', -0.4, -0.9), mouth: 'puzzlement' }, 2);
  tremble('pink', SHOCK, SHOCK + 14, PX, 8);
  SOOT.push({ who: 'pink', f0: SHOCK + 2, f1: 0 });
  key('rb', SHOCK + 2, { mouth: 'happy with theeth', eyes: 'normal' }, 0);
  sfx('ref:laugh', SHOCK + 4, { who: 'rb', gain: 0.85, pitch: 1.0 });
  chuckle('rb', SHOCK + 4, SHOCK + 30, { mouth: 'happy with theeth' });
  // сжимается в шарик; змей падает на траву
  const SM = SHOCK + 18, KG = [1560, GROUND - 40];
  const sm = shrink('pink', SM, PX, -1, { mouth: 'puzzlement', eyes: 'sad', smoke: 380 });
  key('pink', sm, { lean: 0, head: 0, hip: [0, 0] }, 0);
  STR[1].f1 = SM;
  const kd = kiteAt(SM, stateAt(SM));
  kk(SM, { x: kd.x, y: kd.y, rot: kd.rot, tail: kd.tail }, 0);
  kk(SM + 14, { x: KG[0], y: KG[1], rot: Math.PI / 2, tail: Math.PI }, 14, 'in2');
  sfx('land', SM + 14, { x: KG[0], gain: 0.5 });

  // ---- 13.2–14.4 с: Розовая «растёт» снова — Радужный опять влюблён
  key('pink', sm + 6, { eyes: 'angry', mouth: 'angry theeth' }, 0);
  ev('vein', { who: 'pink', f0: sm + 6, f1: sm + 16 });
  const PB2 = transform('pink', sm + 10, PX, PX, -1, { style: 'grow', love: 'rb', loveDur: 40 });
  SOOT[0].f1 = PB2;
  key('pink', PB2, stance('pink', PX, -1), 0);
  key('pink', PB2 + 6, { mouth: 'theeth smile', eyes: 'angry' }, 0);

  // ---- 14.6–20 с: змей на лицо Радужному; туча над ним, молния; Розовая дует — он улетает
  const PK = PB2 + 10;
  key('pink', PK - 8, { lean: 22, hip: [0, toRig('pink', 90)], head: 8 }, 8);
  key('pink', PK, { hitB: 1, hitBto: [KG[0] - 30, KG[1]], hitBfix: PK }, 6);
  KM.push({ f0: PK, hand: 'pink' });
  sfx('pop', PK, { who: 'pink', gain: 0.5 });
  key('pink', PK + 10, { ...stance('pink', PX, -1), hitB: 0, handB: hand('pink', 'B', -0.5, -0.8), mouth: 'happy with theeth' }, 10);
  const TH = PK + 22, STICK = TH + 12;
  key('pink', TH, { handB: hand('pink', 'B', 0.95, -0.4), lean: 12 }, 4, 'in2');
  key('pink', TH + 12, { ...stance('pink', PX, -1), mouth: 'happy with theeth', eyes: 'normal' }, 10);
  sfx('swing', TH - 3, { who: 'pink', gain: 0.8 });
  KM.push({ f0: TH });
  const kh = kiteAt(TH - 1, stateAt(TH - 1)), rf = target('rb:face', stateAt(STICK));
  kk(TH, { x: kh.x, y: kh.y, rot: kh.rot, tail: Math.PI * 0.2 }, 0);
  kk(TH + 6, { x: (kh.x + rf[0]) / 2, y: Math.min(kh.y, rf[1]) - 120, rot: -1.5 }, 6, 'out2');
  kk(STICK, { x: rf[0] + 10, y: rf[1] + 10, rot: 0.15, tail: Math.PI * 0.6 }, 6, 'in2');
  KM.push({ f0: STICK, face: 'rb' });
  sfx('whoosh', TH, { who: 'pink', dur: 10, gain: 0.6 });
  sfx('slap', STICK, { who: 'rb', gain: 0.8 });
  key('rb', STICK, { mouth: 'puzzlement', eyes: 'sad', lean: -8, head: -6 }, 2);
  // вслепую шарит руками
  for (let i = 0; i < 3; i++) {
    const f = STICK + 4 + i * 8, d = i % 2 ? 1 : -1;
    key('rb', f, { lean: 6 * d, handF: hand('rb', 'F', 0.85, -0.3 + 0.25 * d), handB: hand('rb', 'B', -0.3, -0.6 - 0.2 * d) }, 5);
  }
  sfx('ref:grunt', STICK + 6, { who: 'rb', gain: 0.6, pitch: 0.9 });
  const SN2 = STICK + 14;
  key('pink', SN2 - 4, { handF: hand('pink', 'F', 0.75, -0.75), mouth: 'happy with theeth' }, 4);
  sfx('flick', SN2, { who: 'pink', gain: 1.0 });
  key('pink', SN2 + 6, { handF: stance('pink', PX, -1).handF }, 6);
  const CL2 = [RX + 290, 95];
  STORM.push({ f0: SN2 + 2, f1: SN2 + 40, x: CL2[0], y: CL2[1] });
  ev('twinkle', { f: SN2 + 2, at: CL2, n: 18, size: 50 });
  sfx('poof', SN2 + 2, { x: CL2[0], gain: 0.6 });
  sfx('rain', SN2 + 6, { x: CL2[0], dur: 30, gain: 0.5 });
  const ZAP2 = SN2 + 14;
  BOLTS.push({ f: ZAP2, from: [CL2[0], CL2[1] + 60], to: (f, S) => { const k = kiteAt(f, S); return [k.x, k.y - KS * 0.3]; } });
  sfx('zap', ZAP2, { who: 'rb', gain: 1.0 });
  ev('flash', { f: ZAP2, who: 'rb', strength: 0.5 });
  sfx('ref:hit-ow', ZAP2 + 2, { who: 'rb', gain: 0.9, pitch: 0.9 });
  key('rb', ZAP2, { lean: 0, handF: hand('rb', 'F', 0.5, -0.9), handB: hand('rb', 'B', -0.4, -0.9) }, 2);
  tremble('rb', ZAP2, ZAP2 + 14, RX, 8);
  KM.push({ f0: ZAP2 + 4 });
  const kz = kiteAt(ZAP2 + 3, stateAt(ZAP2 + 3));
  kk(ZAP2 + 4, { x: kz.x, y: kz.y, rot: kz.rot, tail: kz.tail }, 0);
  kk(ZAP2 + 22, { x: 300, y: -200, rot: -2, tail: Math.PI * 0.2 }, 18, 'out');
  SOOT.push({ who: 'rb', f0: ZAP2 + 4, f1: NF });
  key('pink', ZAP2 + 4, { mouth: 'happy with theeth' }, 0);
  sfx('ref:laugh', ZAP2 + 6, { who: 'pink', gain: 0.85, pitch: 1.35 });
  chuckle('pink', ZAP2 + 6, ZAP2 + 20, { mouth: 'happy with theeth' });
  // дует — Радужный улетает за кадр
  const BL = ZAP2 + 22;
  key('pink', BL - 6, { lean: -10, head: -10, mouth: 'puzzlement', handF: hand('pink', 'F', 0.2, -0.3), handB: hand('pink', 'B', -0.3, -0.2) }, 6);
  sfx('suck', BL - 8, { who: 'pink', dur: 8, gain: 0.5 });
  key('pink', BL, { lean: 12, head: 8 }, 3, 'in2');
  key('pink', BL + 16, { ...stance('pink', PX, -1), mouth: 'happy with theeth' }, 8);
  ev('wind', { f0: BL, f1: BL + 18, x0: PX - 120, x1: 0, snd: false });
  sfx('gust', BL, { who: 'pink', dur: 18, gain: 1.0 });
  flyOff('rb', BL + 4, BL + 26, [RX, GROUND], [-380, -320], { turns: 3 });
  const WIN = victory('pink', BL + 20, PX, { n: 9, stride: 110 });
  window.T = { HIT, PB, GRAB, YANK, LAND, RB, ZAP, SM, PB2, STICK, ZAP2, BL, WIN };
};

ST.hooks.afterChars.push((ctx, f, S, CAM) => {
  ctx.setTransform(...CAM);
  for (const s of SOOT) {
    if (f < s.f0 || (s.f1 && f >= s.f1)) continue;
    const p = target(`${s.who}:face`, S);
    FX.soot(ctx, p[0], p[1], S[s.who].p.form === 'big' ? 170 : 150, 1, s.f0);
  }
  const k = kiteAt(f, S);
  for (const s of STR) {
    if (f < s.f0 || (s.f1 && f >= s.f1)) continue;
    const a = P(s.from, f, S), b = kiteBottom(k);
    let sp = -1;
    for (const q of SPARK) if (f >= q.f0 && f <= q.f1) sp = (f - q.f0) / (q.f1 - q.f0);
    FX.kiteString(ctx, a, b, 50, sp, f / FPS);
  }
  FX.kite(ctx, k.x, k.y, KS, k.rot, f / FPS, k.tail);
  for (const c of STORM) {
    if (f < c.f0 || f > c.f1 + 8) continue;
    const a = Math.min(1, (f - c.f0) / 4, (c.f1 + 8 - f) / 8);
    FX.rain(ctx, c.x, c.y + 40, GROUND, 230, f / FPS, a * 0.8, c.f0);
    ctx.save(); ctx.globalAlpha = a; FX.rainCloud(ctx, c.x, c.y, 260); ctx.restore();
  }
  for (const b of BOLTS) {
    const u = (f - b.f) / 10;
    if (u < 0 || u > 1) continue;
    const t = P(b.to, f, S);
    FX.lightning(ctx, b.from[0], b.from[1], t[0], t[1], u, b.f);
  }
});

ST.start(BIG);
