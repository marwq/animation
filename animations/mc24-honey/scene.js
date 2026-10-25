// Ролик 24 (серия по образцу): Мёд и перья — Розовая, Толстый и Скелет, 25 с, 24 кадра/с. Плотно, как у HugyTi:
// горшок мёда на голову, подушка с перьями, Толстый-курица несёт огромное яйцо, из яйца — цыплёнок.
// Музыка превращения — присланная, ~4 с с затиханием, только при первом превращении. Фон — замок и горы.
//
//   0–1.8 с   шарик-Розовая (слева, рядом подушка), шарик-Толстый у горшка мёда, шарик-Скелет (справа)
//   1.8–4 с   Толстый лижет мёд; Скелет хватает горшок ртом, перелетает и надевает его Розовой на голову
//   4–5.3 с   Розовая сбрасывает горшок и «растёт» под музыку — Толстый и Скелет оба влюблены
//   5.5–8.5 с бьёт Скелета подушкой — подушка лопается, Скелет катится в Толстого; перья липнут к медовому
//             Толстому — он курица, кудахчет
//   8.5–10.5 с Толстый-курица несёт огромное яйцо — яйцо катится и сбивает Скелета
//   10.5–11.8 с Скелет «растёт»
//   12–15 с   бросает горшок мёда Розовой на голову и машет крыльями — перья облепляют её, «пуф» — шарик
//   15.3–16.6 с Розовая стряхивает перья и «растёт» снова — Толстый опять влюблён
//   17–21 с   бросает огромное яйцо Скелету в голову — яйцо трескается, на макушке цыплёнок, клюёт его в нос —
//             Скелет убегает, цыплёнок за ним, Толстый-курица за цыплёнком
//   21–25 с   Розовая в центре, руки вверх
'use strict';

const ST = Stage({
  name: 'mc24-honey',
  cast: {
    pink: { small: ['girl-verity-small', { bodyHeight: 300 }], big: ['girl-verity-big', { height: 730, splitFeet: true }],
      pivot: 337, voice: 1.35, vAngle: 50, lie: 55, color: '#ff4fc8', moods: { angry: 'angry theeth', grin: 'theeth smile', big: 'theeth smile' } },
    fat: { small: ['fat-verity-small', { bodyHeight: 450 }], pivot: 508, voice: 0.75, moods: { love: 'happy' } },
    skel: { small: ['skeleton-verity-small', { scale: 0.455 }], big: ['skeleton-verity-big', { height: 730 }], pivot: 325,
      voice: 0.9, lie: 60, color: '#f3f1e6', moods: { angry: 'angry theeth', grin: 'happy with theeth', big: 'theeth smile', love: 'happy - spittle' } },
  },
  order: ['pink', 'fat', 'skel'],
  background: { theme: 'castle', seed: 241, sunX: 1500, sunY: 130 },
  clouds: [[120, 80, 2.4, 0, 12], [640, 210, 1.8, 1, 16], [1100, 60, 2.6, 2, 10], [420, 300, 1.4, 1, 14]],
});
const { FPS, NF, GROUND, C, key, move, ev, sfx, hop, tumble, laugh, tremble, transform, shrink, love, stance, walk, turn,
  victory, chuckle, hand, toRig, statesAt, stateAt, target } = ST;

ST.parts.mouth = (ch, st, p) => {
  if (ch === C.fat.small) return E.apply(ch.eyeMatrix(st, 'puzzlement'), [611, 456]);
  const name = ch.layers.some((l) => l.name === p.mouth) ? p.mouth : 'smile normal', l = ch.layers.find((x) => x.name === name);
  return E.apply(ch.eyeMatrix(st, name), [(l.bbox[0] + l.bbox[2]) / 2, (l.bbox[1] + l.bbox[3]) / 2]);
};
const P = (v, f, S) => (typeof v === 'function' ? v(f, S) : typeof v === 'string' ? target(v, S) : v);
const keyed = (ks, f) => {
  if (typeof ks === 'number') return ks;
  if (f <= ks[0][0]) return ks[0][1];
  for (let i = 1; i < ks.length; i++) if (f < ks[i][0]) { const u = E.EASE.io((f - ks[i - 1][0]) / (ks[i][0] - ks[i - 1][0])); return E.lerp(ks[i - 1][1], ks[i][1], u); }
  return ks[ks.length - 1][1];
};
function flap(f0, f1, gain = 0.6) {
  for (let f = f0; f < f1; f += 6) { key('skel', f, { b_B16: -30, b_B17: 30 }, 3); key('skel', f + 3, { b_B16: 46, b_B17: -46 }, 3, 'in'); }
  key('skel', f1, { b_B16: 0, b_B17: 0 }, 4);
  sfx('gust', f0, { who: 'skel', dur: f1 - f0, gain });
}
function fatOpen(f, k, n, extra = {}) { key('fat', f - n, { mouth: 'puzzlement' }, 0); key('fat', f, { mouthK: k, ...extra }, n, 'out'); }
const cluck = (f, g = 0.7) => { sfx('chatter', f, { who: 'fat', dur: 8, gain: g, pitch: 1.7 }); key('fat', f, { sx: 0.94, sy: 1.08 }, 2); key('fat', f + 3, { sx: 1.05, sy: 0.96 }, 2); key('fat', f + 6, { sx: 1, sy: 1 }, 2); };

// ------------------------------------------------------------------ предметы
function segAt(segs, f, S) {
  let cur = null;
  for (const c of segs) if (f >= c.f0) cur = c;
  if (!cur || cur.gone) return null;
  if (cur.at) { const p = P(cur.at, f, S); return { x: p[0], y: p[1], rot: keyed(cur.rot || 0, f), front: cur.front }; }
  if (cur.mouth) { const m = target(`${cur.mouth}:mouth`, S); return { x: m[0] + (cur.dx || 0), y: m[1] + (cur.dy || 0), rot: cur.rot || 0, front: true }; }
  if (cur.head) { const t = target(`${cur.head}:top`, S); return { x: t[0], y: t[1] + (cur.dy || 0), rot: cur.rot ?? Math.PI, front: true }; }
  if (cur.hand) { if (S[cur.hand].p.form !== 'big') return null; const h = C[cur.hand].big.point(S[cur.hand].st, 'hand' + (cur.arm || 'F')); return { x: h[0] + (cur.dx || 0), y: h[1] + (cur.dy || 0), rot: keyed(cur.rot || 0, f), front: true }; }
  const u = E.clamp((f - cur.f0) / (cur.f1 - cur.f0), 0, 1), a = P(cur.a, cur.f0, statesAt(cur.f0)), b = P(cur.b, f, S);
  return { x: E.lerp(a[0], b[0], u), y: E.lerp(a[1], b[1], E.EASE[cur.ease || 'lin'](u)) - Math.sin(Math.PI * u) * (cur.arc || 0), rot: E.lerp(cur.r0 || 0, cur.r1 || 0, u), front: true };
}
const POT = [];                                    // горшок мёда
const PILLOW = [];                                 // подушка
const EGG = [];                                    // яйцо
const EGGC = { crack: [[0, 0]] };
const CHICK = [];                                  // цыплёнок: {f0, head} | {f0, f1, a, b} | {f0, run: [[f, x]]}
const HONEY = [];                                  // мёд на ком-то: {who, part, f0, f1, w, drip: [[f, v]]}
const COATS = [];                                  // перья прилипли: {who, f0, f1, n, seed, size}
const BURSTS = [];                                 // перья разлетаются: {f, at, seed, n}
const YOLK = { f0: 1e9, f1: 1e9 };

const PS = 420, FS = 1250, SS = 1660, POTX = 1490;
// ================================================================== 0–1.8 с: стойка
key('pink', 0, { form: 'small', x: PS, y: GROUND, face: 1, look: 1, eyes: 'normal', mouth: 'smile normal', sx: 1, sy: 1, rot: 0, pivot: 0, alpha: 1 }, 0);
key('fat', 0, { form: 'small', x: FS, y: GROUND, face: 1, look: 1, eyes: 'normal', mouth: 'smile normal', sx: 1, sy: 1, rot: 0, pivot: 0, mouthK: 1 }, 0);
key('skel', 0, { form: 'small', x: SS, y: GROUND, face: -1, look: 1, eyes: 'normal', mouth: 'smile normal', sx: 1, sy: 1, rot: 0, pivot: 0, alpha: 1 }, 0);
POT.push({ f0: 0, at: [POTX, GROUND + 2], rot: 0 });
PILLOW.push({ f0: 0, at: [700, GROUND - 40], rot: 1.45 });

const BIG = () => {
  // ---- 1.8–4 с: Толстый лижет мёд; Скелет хватает горшок и надевает Розовой на голову
  for (const f of [38, 46]) {
    key('fat', f, { mouth: 'happy', sx: 0.95, sy: 1.05, rot: 6, pivot: 508 }, 3);
    key('fat', f + 4, { sx: 1, sy: 1, rot: 0 }, 3);
    sfx('lick', f, { who: 'fat', gain: 0.8 });
  }
  HONEY.push({ who: 'fat', part: 'mouth', f0: 42, f1: NF, w: 130, drip: [[42, 0.1], [70, 0.5]], dy: -10 });
  key('skel', 40, { mouth: 'happy with theeth', eyes: 'angry' }, 0);
  sfx('ref:grin-eee', 40, { who: 'skel', gain: 0.45, pitch: 1.15 });
  const S1 = stateAt(1), dM = [target('skel:mouth', S1)[0] - SS, target('skel:mouth', S1)[1] - GROUND];
  const GR = 48;
  hop('skel', 40, GR, SS, POTX - dM[0] + 40, 80);
  POT.push({ f0: GR, mouth: 'skel', dx: -10, dy: 100, rot: 0 });
  sfx('chomp', GR, { who: 'skel', gain: 0.6 });
  // перелетает через Толстого к Розовой
  const OV = GR + 14, DROP = OV + 2, ON = DROP + 6, SL = 820;
  move('skel', GR + 2, { x: POTX - dM[0] + 40, y: GROUND });
  move('skel', GR + 8, { x: 1000, y: GROUND - 520 }, 'out2');
  move('skel', OV, { x: PS + 40, y: GROUND - 420 }, 'io');
  sfx('whoosh', GR + 2, { who: 'skel', dur: 16, gain: 0.6 });
  key('fat', GR + 4, { mouth: 'puzzlement', eyes: 'normal' }, 0);
  const ptop = (f, S) => { const t = target('pink:top', S); return [t[0], t[1] + 40]; };
  POT.push({ f0: DROP, f1: ON, a: (f, S) => { const m = target('skel:mouth', S); return [m[0] - 10, m[1] + 100]; }, b: ptop, r0: 0, r1: Math.PI, ease: 'in2' });
  POT.push({ f0: ON, head: 'pink', dy: 40 });
  sfx('slam', ON, { who: 'pink', gain: 0.8 });
  sfx('squish', ON, { who: 'pink', gain: 0.8 });
  HONEY.push({ who: 'pink', part: 'top', f0: ON, f1: 0, w: 170, drip: [[ON, 0.1], [ON + 24, 0.9]], dy: 30 });
  key('pink', ON, { sx: 1.25, sy: 0.82, mouth: 'puzzlement', eyes: 'sad' }, 1);
  key('pink', ON + 4, { sx: 1, sy: 1 }, 3);
  move('skel', DROP + 2, { x: PS + 40, y: GROUND - 420 });
  move('skel', ON + 12, { x: SL, y: GROUND }, 'in2');
  key('skel', ON + 12, { sx: 1.2, sy: 0.82, mouth: 'happy with theeth', eyes: 'normal' }, 1);
  key('skel', ON + 16, { sx: 1, sy: 1, face: 1 }, 3);
  sfx('land', ON + 12, { who: 'skel', gain: 0.5 });
  for (const [f, dx] of [[ON + 5, -26], [ON + 10, 22]]) {   // шатается вслепую
    move('pink', f, { x: PS + dx }, 'io'); key('pink', f, { rot: dx > 0 ? 8 : -8, pivot: 150 }, 4);
  }
  sfx('ref:laugh', ON + 8, { who: 'fat', gain: 0.8, pitch: 0.75 });
  laugh('fat', ON + 8, ON + 24);
  sfx('ref:laugh', ON + 14, { who: 'skel', gain: 0.8, pitch: 1.15 });
  laugh('skel', ON + 16, ON + 30);

  // ---- 4–5.3 с: сбрасывает горшок и «растёт» — оба влюблены
  const OFF = ON + 14, PX = 520;
  key('pink', OFF, { rot: 0, sx: 0.85, sy: 1.18 }, 3);
  move('pink', OFF, { x: PS });
  const POT2 = [880, GROUND + 2];
  POT.push({ f0: OFF, f1: OFF + 14, a: (f, S) => ptop(f, S), b: POT2, arc: 200, r0: Math.PI, r1: Math.PI * 3 });
  POT.push({ f0: OFF + 14, at: POT2, rot: 0 });
  sfx('pop', OFF, { who: 'pink', gain: 0.8 });
  sfx('land', OFF + 14, { x: POT2[0], gain: 0.5 });
  key('pink', OFF + 1, { eyes: 'angry', mouth: 'angry theeth' }, 0);
  const PB = transform('pink', OFF + 2, PS, PX, 1, { style: 'grow', love: ['fat', 'skel'], loveDur: 60 });
  HONEY[1].drip.push([PB, 0.9]);
  key('pink', PB, stance('pink', PX, 1), 0);
  key('pink', PB + 6, { mouth: 'theeth smile', eyes: 'normal' }, 0);
  // влюблённый Скелет скачет к ней
  hop('skel', PB + 6, PB + 16, SL, 900, 70);

  // ---- 5.5–8.5 с: подушкой по Скелету — лопается, он катится в Толстого — перья на медовом Толстом
  const K = C.pink.big, PU = PB + 12;
  key('pink', PU - 8, { lean: 24, hip: [0, toRig('pink', 110)], head: 8 }, 8);
  key('pink', PU, { hitF: 1, hitFto: [690, GROUND - 40], hitFfix: PU }, 6);
  PILLOW.push({ f0: PU, hand: 'pink', arm: 'F', rot: [[PU, 1.45], [PU + 8, -0.4]], dy: -40 });
  sfx('pop', PU, { who: 'pink', gain: 0.5 });
  key('pink', PU + 10, { ...stance('pink', PX, 1), hitF: 0, handF: hand('pink', 'F', 0.0, -1.0), mouth: 'happy with theeth', eyes: 'angry' }, 8);
  const SW = PU + 16;
  key('pink', SW, { handF: hand('pink', 'F', 0.97, 0.1), lean: 14 }, 4, 'in2');
  key('pink', SW + 12, { ...stance('pink', PX, 1), lean: 0, head: 0 }, 8);
  sfx('swing', SW - 3, { who: 'pink', gain: 0.9 });
  PILLOW.push({ f0: SW, gone: true });
  const sk = target('skel:body', stateAt(SW));
  BURSTS.push({ f: SW, at: sk, seed: 3, n: 30 });
  sfx('pop', SW, { who: 'skel', gain: 1.0 });
  sfx('slap', SW, { who: 'skel', gain: 0.7 });
  tumble('skel', SW, SW + 12, 900, 1060, 120, 1, { hurt: true });
  key('skel', SW, { mouth: 'puzzlement', eyes: 'sad' }, 0);
  const BUMP = SW + 12;
  key('fat', BUMP, { sx: 1.2, sy: 0.86, mouth: 'puzzlement', eyes: 'sad' }, 1);
  key('fat', BUMP + 4, { sx: 1, sy: 1 }, 3);
  move('fat', BUMP, { x: FS });
  move('fat', BUMP + 8, { x: FS + 60 }, 'out2');
  sfx('bonk', BUMP, { who: 'fat', gain: 0.7 });
  BURSTS.push({ f: BUMP, at: [FS - 100, GROUND - 260], seed: 7, n: 20 });
  COATS.push({ who: 'fat', f0: BUMP + 2, f1: 0, n: 22, seed: 5, size: 70, grow: [BUMP + 2, BUMP + 12] });
  sfx('sparkle', BUMP + 4, { who: 'fat', gain: 0.5 });
  const FC = FS + 60;
  for (const f of [BUMP + 12, BUMP + 20]) cluck(f, 0.8);
  key('fat', BUMP + 14, { mouth: 'happy', eyes: 'normal' }, 0);
  key('pink', BUMP + 14, { mouth: 'happy with theeth', eyes: 'normal' }, 0);
  sfx('ref:laugh', BUMP + 16, { who: 'pink', gain: 0.85, pitch: 1.35 });
  chuckle('pink', BUMP + 16, BUMP + 28, { mouth: 'happy with theeth' });

  // ---- 8.5–10.5 с: Толстый-курица несёт огромное яйцо — катится и сбивает Скелета
  const LAY = BUMP + 28;
  key('fat', LAY - 6, { sx: 1.12, sy: 0.9, mouth: 'puzzlement' }, 4);
  move('fat', LAY - 2, { x: FC, y: GROUND });
  move('fat', LAY + 4, { x: FC + 140, y: GROUND - 260 }, 'out2');
  move('fat', LAY + 10, { x: FC + 220, y: GROUND }, 'in2');
  key('fat', LAY + 2, { sx: 0.9, sy: 1.12 }, 2);
  key('fat', LAY + 10, { sx: 1.15, sy: 0.88, mouth: 'happy' }, 1);
  key('fat', LAY + 14, { sx: 1, sy: 1 }, 3);
  sfx('pop', LAY + 2, { who: 'fat', gain: 1.0, pitch: 0.7 });
  sfx('land', LAY + 10, { who: 'fat', gain: 0.6 });
  const EGGP = [FC, GROUND - 120];
  EGG.push({ f0: LAY + 2, at: EGGP, rot: 0 });
  EGGC.grow = [LAY + 2, LAY + 8];
  cluck(LAY + 13, 0.9);
  // катится влево — сбивает шарика-Скелета
  const ROLL = LAY + 20, HIT = ROLL + 10, ESTOP = HIT + 10, EX = 820;
  EGG.push({ f0: ROLL, at: (f) => [E.lerp(FC, EX, E.EASE.out(E.clamp((f - ROLL) / (ESTOP - ROLL), 0, 1))), GROUND - 120], rot: [[ROLL, 0], [ESTOP, -2.2]] });
  sfx('creak', ROLL, { x: FC, dur: 16, gain: 0.5 });
  key('skel', ROLL, { mouth: 'puzzlement', eyes: 'sad' }, 0);
  sfx('bonk', HIT, { who: 'skel', gain: 0.9 });
  const SL2 = 1120;
  key('skel', HIT, { pivot: 150 }, 0);
  move('skel', HIT, { x: 1060, y: GROUND, rot: 0 });
  move('skel', HIT + 8, { x: 1100, y: GROUND - 300 }, 'out2');
  move('skel', HIT + 16, { x: SL2, y: GROUND }, 'in2');
  move('skel', HIT + 16, { rot: 720 }, 'lin');
  key('skel', HIT + 17, { rot: 0 }, 0);
  key('skel', HIT + 16, { sx: 1.3, sy: 0.75 }, 1);
  key('skel', HIT + 20, { sx: 1, sy: 1, face: -1 }, 4);
  sfx('fall', HIT + 16, { who: 'skel', gain: 0.8 });
  ev('stars', { who: 'skel', f0: HIT + 18, f1: HIT + 34, snd: false });
  key('pink', HIT + 4, { mouth: 'happy with theeth' }, 0);
  laugh('fat', HIT + 4, HIT + 20);

  // ---- 10.5–11.8 с: Скелет «растёт»
  const SX = 1020;
  key('skel', HIT + 18, { eyes: 'angry', mouth: 'angry theeth' }, 0);
  ev('vein', { who: 'skel', f0: HIT + 18, f1: HIT + 28 });
  const SB = transform('skel', HIT + 20, SL2, SX, -1, { style: 'grow' });
  key('skel', SB, stance('skel', SX, -1), 0);
  key('skel', SB + 6, { mouth: 'happy with theeth', eyes: 'angry' }, 0);
  key('pink', SB - 2, { mouth: 'puzzlement', eyes: 'sad' }, 0);
  ev('sweat', { who: 'pink', f0: SB, f1: SB + 20 });

  // ---- 12–15 с: горшок мёда ей на голову — крылья — перья облепляют — «пуф»
  const KS = C.skel.big, PK = SB + 6;
  key('skel', PK - 8, { lean: 24, hip: [0, toRig('skel', 110)], head: 8 }, 8);
  key('skel', PK, { hitF: 1, hitFto: [POT2[0] + 10, GROUND - 60], hitFfix: PK }, 6);
  POT.push({ f0: PK, hand: 'skel', arm: 'F', dy: 60, rot: 0 });
  sfx('pop', PK, { who: 'skel', gain: 0.5 });
  key('skel', PK + 10, { ...stance('skel', SX, -1), hitF: 0, handF: hand('skel', 'F', -0.2, -0.9) }, 8);
  const TH = PK + 15, LANDP = TH + 12;
  key('skel', TH, { handF: hand('skel', 'F', 0.95, -0.4), lean: 12 }, 4, 'in2');
  key('skel', TH + 10, { ...stance('skel', SX, -1), lean: 0, head: 0 }, 8);
  sfx('swing', TH - 3, { who: 'skel', gain: 0.8 });
  POT.push({ f0: TH, f1: LANDP, a: (f, S) => { const h = KS.point(S.skel.st, 'handF'); return [h[0], h[1] + 60]; }, b: (f, S) => { const t = target('pink:top', S); return [t[0], t[1] + 80]; }, arc: 160, r0: 0, r1: Math.PI * 3 });
  POT.push({ f0: LANDP, head: 'pink', dy: 80 });
  sfx('slam', LANDP, { who: 'pink', gain: 0.9 });
  sfx('squish', LANDP, { who: 'pink', gain: 0.9 });
  HONEY.push({ who: 'pink', part: 'top', f0: LANDP, f1: 0, w: 220, drip: [[LANDP, 0.2], [LANDP + 20, 1]], dy: 70 });
  key('pink', LANDP, { mouth: 'puzzlement', eyes: 'sad', handF: hand('pink', 'F', 0.4, -0.8), handB: hand('pink', 'B', -0.3, -0.8) }, 3);
  const W0 = LANDP + 6, W1 = W0 + 18;
  flap(W0, W1, 0.9);
  key('skel', W0, { lean: 8, mouth: 'happy open mouth' }, 4);
  ev('wind', { f0: W0, f1: W1 + 2, x0: SX - 260, x1: 200, snd: false });
  BURSTS.push({ f: W0 + 2, at: [800, GROUND - 60], seed: 11, n: 24, toward: 'pink:body' });
  COATS.push({ who: 'pink', f0: W0 + 10, f1: 0, n: 26, seed: 9, size: 80, grow: [W0 + 10, W0 + 22] });
  sfx('sparkle', W0 + 12, { who: 'pink', gain: 0.5 });
  key('skel', W1 + 2, { lean: 0, mouth: 'happy with theeth', eyes: 'normal' }, 6);
  sfx('ref:laugh', W1 + 2, { who: 'skel', gain: 0.85, pitch: 1.0 });
  chuckle('skel', W1 + 2, W1 + 20, { mouth: 'happy with theeth' });
  sfx('chatter', W1 + 4, { who: 'pink', dur: 10, gain: 0.7, pitch: 1.9 });
  const SH = W1 + 6;
  const sm = shrink('pink', SH, PX, 1, { mouth: 'puzzlement', eyes: 'sad', smoke: 400 });
  key('pink', sm, { lean: 0, head: 0, hip: [0, 0] }, 0);
  POT.push({ f0: SH, f1: SH + 14, a: ptop, b: [300, GROUND + 2], arc: 160, r0: Math.PI, r1: Math.PI * 4 }, { f0: SH + 14, at: [300, GROUND + 2], rot: 0 });
  HONEY[2].f1 = SH; HONEY[1].f1 = SH;
  COATS[1].f1 = SH + 18;
  HONEY.push({ who: 'pink', part: 'top', f0: SH, f1: SH + 22, w: 150, drip: [[SH, 0.7]], dy: 20 });
  // шарик стряхивает перья
  for (let i = 0; i < 2; i++) { key('pink', sm + 4 + i * 5, { rot: i % 2 ? -14 : 14, pivot: 150 }, 3); }
  key('pink', sm + 15, { rot: 0 }, 3);
  BURSTS.push({ f: SH + 18, at: [PX, GROUND - 160], seed: 13, n: 18 });
  sfx('brush', sm + 8, { who: 'pink', gain: 0.6 });

  // ---- 15.3–16.6 с: Розовая «растёт» снова — Толстый опять влюблён
  key('pink', sm + 18, { eyes: 'angry', mouth: 'angry theeth' }, 0);
  const PB2 = transform('pink', sm + 20, PX, PX, 1, { style: 'grow', love: 'fat', loveDur: 40 });
  key('pink', PB2, stance('pink', PX, 1), 0);
  key('pink', PB2 + 6, { mouth: 'happy with theeth', eyes: 'angry' }, 0);
  key('skel', PB2 - 2, { mouth: 'puzzlement', eyes: 'sad' }, 0);

  // ---- 17–21 с: огромное яйцо Скелету в голову — цыплёнок клюёт — все убегают
  const PE = PB2 + 6;
  key('pink', PE - 8, { lean: 24, hip: [0, toRig('pink', 100)], head: 8 }, 8);
  key('pink', PE, { hitF: 1, hitFto: [EX - 40, GROUND - 120], hitB: 1, hitBto: [EX - 120, GROUND - 160], hitFfix: PE, hitBfix: PE }, 6);
  EGG.push({ f0: PE, at: (f, S) => { const a = K.point(S.pink.st, 'handF'), b = K.point(S.pink.st, 'handB'); return [(a[0] + b[0]) / 2 + 30, (a[1] + b[1]) / 2 - 40]; }, rot: 0.3 });
  sfx('pop', PE, { who: 'pink', gain: 0.5 });
  key('pink', PE + 10, { ...stance('pink', PX, 1), hitF: 0, hitB: 0, handF: hand('pink', 'F', 0.2, -0.95), handB: hand('pink', 'B', 0.0, -0.95), lean: -6 }, 8);
  const ET = PE + 15, EH = ET + 12;
  key('pink', ET, { handF: hand('pink', 'F', 0.95, -0.4), handB: hand('pink', 'B', 0.8, -0.45), lean: 12 }, 4, 'in2');
  key('pink', ET + 10, { ...stance('pink', PX, 1), lean: 0, head: 0, mouth: 'happy with theeth', eyes: 'normal' }, 8);
  sfx('swing', ET - 3, { who: 'pink', gain: 0.9 });
  EGG.push({ f0: ET, f1: EH, a: (f, S) => { const a = K.point(S.pink.st, 'handF'), b = K.point(S.pink.st, 'handB'); return [(a[0] + b[0]) / 2 + 30, (a[1] + b[1]) / 2 - 40]; }, b: (f, S) => { const t = target('skel:top', S); return [t[0], t[1] - 60]; }, arc: 140, r0: 0.3, r1: Math.PI * 2 });
  EGG.push({ f0: EH, gone: true });
  YOLK.f0 = EH; YOLK.f1 = NF;
  sfx('crunch', EH, { who: 'skel', gain: 1.0 });
  sfx('squish', EH, { who: 'skel', gain: 0.8 });
  key('skel', EH, { mouth: 'puzzlement', eyes: 'sad', sx: 1.04, sy: 0.96 }, 1);
  key('skel', EH + 4, { sx: 1, sy: 1 }, 3);
  CHICK.push({ f0: EH + 2, head: 'skel' });
  sfx('twinkle', EH + 4, { who: 'skel', gain: 0.6 });
  // клюёт в нос
  const PECK = EH + 8;
  for (let i = 0; i < 3; i++) { CHICK.push({ f0: PECK + i * 5, head: 'skel', peck: 1 }, { f0: PECK + i * 5 + 2, head: 'skel', peck: 0 }); sfx('flick', PECK + i * 5 + 1, { who: 'skel', gain: 0.6 }); }
  sfx('ref:hit-ow', PECK + 3, { who: 'skel', gain: 0.8, pitch: 1.1 });
  key('skel', PECK + 2, { head: -10, handF: hand('skel', 'F', 0.4, -0.9), handB: hand('skel', 'B', -0.3, -0.9) }, 3);
  key('fat', PECK, { mouth: 'happy', eyes: 'normal' }, 0);
  love('fat', PECK, PECK + 20, { mouth: false, hearts: true });
  // убегает вправо, цыплёнок на голове, Толстый-курица за ними
  const RUN = PECK + 14;
  turn('skel', RUN, 1, SX);
  const KSB = C.skel.big;                                           // улетает вправо-вверх, хлопая крыльями
  key('skel', RUN + 3, { legFfk: 1, legBfk: 1, legF: [-20, 40], legB: [20, -30] }, 3);
  move('skel', RUN + 2, { x: SX, y: GROUND });
  move('skel', RUN + 26, { x: 2700, y: GROUND - 520 }, 'in');
  key('skel', RUN + 2, { ...KSB.feet(SX, 1) }, 0);
  key('skel', RUN + 26, { ...KSB.feet(2700, 1) }, 24, 'in');
  flap(RUN + 2, RUN + 26, 0.8);
  sfx('scared', RUN + 2, { who: 'skel', gain: 0.8 });
  const FR = RUN + 8;
  key('fat', FR, { face: 1 }, 0);
  hop('fat', FR, FR + 10, FC + 220, 1750, 100);
  hop('fat', FR + 12, FR + 22, 1750, 2500, 100);
  cluck(FR + 2, 0.8);
  sfx('ref:laugh', RUN + 4, { who: 'pink', gain: 0.85, pitch: 1.35 });
  chuckle('pink', RUN + 4, RUN + 24, { mouth: 'happy with theeth' });
  const WIN = victory('pink', RUN + 24, PX, { n: 9, stride: 110 });
  window.T = { ON, PB, SW, BUMP, LAY, HIT, SB, LANDP, SH, PB2, EH, RUN, WIN };
};

// ------------------------------------------------------------------ рисование
function drawCoat(ctx, f, S, c) {
  if (f < c.f0 || (c.f1 && f >= c.f1)) return;
  const { ch, st, p } = S[c.who], b = ch.point(st, 'body'), r = FX.rng(c.seed);
  const g = c.grow ? E.clamp((f - c.grow[0]) / (c.grow[1] - c.grow[0]), 0, 1) : 1, cols = ['#ffffff', '#ffffff', '#ffe9f4', '#f2f2f2'];
  const rx = (p.form === 'big' ? ch.width * 0.32 : ch.width * 0.44) * (p.sx || 1), ry = (p.form === 'big' ? ch.height * 0.36 : ch.height * 0.44) * (p.sy || 1);
  const cy = p.form === 'big' ? b[1] - ch.height * 0.05 : b[1];
  for (let i = 0; i < c.n * g; i++) {
    const a = r() * Math.PI * 2, d = 0.35 + r() * 0.65;
    FX.feather(ctx, b[0] + Math.cos(a) * rx * d, cy + Math.sin(a) * ry * d, c.size * (0.8 + r() * 0.4), a + (r() - 0.5), cols[i % 4], Math.sin(f * 0.4 + i) * 0.2);
  }
}
ST.hooks.beforeChars.push((ctx, f, S, CAM) => {
  ctx.setTransform(...CAM);
  const pt = segAt(POT, f, S); if (pt && !pt.front) FX.honeyPot(ctx, pt.x, pt.y, 130, pt.rot, f < 40);
  const pl = segAt(PILLOW, f, S); if (pl && !pl.front) FX.pillow(ctx, pl.x, pl.y, pl.rot);
  const eg = segAt(EGG, f, S);
  if (eg && !eg.front) { const g = EGGC.grow ? E.EASE.out(E.clamp((f - EGGC.grow[0]) / (EGGC.grow[1] - EGGC.grow[0]), 0, 1)) : 1; FX.egg(ctx, eg.x, eg.y + 120 * (1 - g), 240 * g, eg.rot); }
});
ST.hooks.afterChars.push((ctx, f, S, CAM) => {
  ctx.setTransform(...CAM);
  for (const c of COATS) drawCoat(ctx, f, S, c);
  for (const h of HONEY) {
    if (f < h.f0 || (h.f1 && f >= h.f1)) continue;
    const t = target(`${h.who}:${h.part}`, S);
    FX.honeyCap(ctx, t[0], t[1] + (h.dy || 0), h.w, keyed(h.drip, f));
  }
  if (f >= YOLK.f0 && f < YOLK.f1) {                 // желток и скорлупа на голове
    const t = target('skel:top', S);
    FX.honeyCap(ctx, t[0], t[1] + 30, 200, Math.min(1, (f - YOLK.f0) / 20) * 0.8);
    FX.egg(ctx, t[0] - 70, t[1] + 6, 70, -0.8, 1); FX.egg(ctx, t[0] + 80, t[1] + 4, 60, 0.9, 1);
  }
  const pt = segAt(POT, f, S); if (pt && pt.front) FX.honeyPot(ctx, pt.x, pt.y, pt.rot > 2 ? 150 : 130, pt.rot, f < 40);
  const pl = segAt(PILLOW, f, S); if (pl && pl.front) FX.pillow(ctx, pl.x, pl.y, pl.rot);
  const eg = segAt(EGG, f, S); if (eg && eg.front) FX.egg(ctx, eg.x, eg.y, 240, eg.rot);
  let ck = null; for (const c of CHICK) if (f >= c.f0) ck = c;
  if (ck) { const t = target('skel:top', S), fc = S.skel.p.face || 1; FX.chick(ctx, t[0] + fc * 10, t[1] + 10, 110, fc, f / FPS, ck.peck || 0); }
  for (const b of BURSTS) {
    const t = (f - b.f) / FPS;
    if (t < 0 || t > 2.6) continue;
    if (b.toward) {                                   // ветер несёт перья к цели
      const r = FX.rng(b.seed), to = target(b.toward, S), u = E.clamp((f - b.f) / 14, 0, 1);
      if (u >= 1) continue;
      for (let i = 0; i < b.n; i++) {
        const sx = b.at[0] + (r() - 0.5) * 500, sy = b.at[1] - r() * 200, tx = to[0] + (r() - 0.5) * 220, ty = to[1] + (r() - 0.5) * 300;
        FX.feather(ctx, E.lerp(sx, tx, u), E.lerp(sy, ty, u) - Math.sin(Math.PI * u) * 80, 80, r() * 6 + u * 4, '#ffffff', Math.sin(f + i) * 0.3);
      }
    } else FX.feathers(ctx, b.at[0], b.at[1], t, b.seed, b.n, 1.2);
  }
});

ST.start(BIG);
