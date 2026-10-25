// Ролик 20 (серия по образцу): Удочка — Радужный против Скелета, 25 с, 24 кадра/с. Плотно, как у HugyTi:
// пруд, удочка-лассо, рыба-пощёчина, нырки туда и обратно, превращения туда и обратно. Музыка превращения —
// присланная, ~4 с с затиханием, только при первом превращении. Фон — берег озера.
//
//   0–1.8 с   шарик-Скелет (слева), радужный шарик рыбачит у пруда — удочка во рту, поплавок качается
//   1.8–3.6 с Скелет подкрадывается и толкает его — Радужный летит в пруд, плюх! выныривает с рыбой на голове
//   3.7–4.9 с Радужный «растёт» под музыку
//   5–9 с     подбирает удочку и забрасывает — крючок цепляет шарик-Скелета, тот болтается над прудом:
//             макает его в воду дважды и забрасывает обратно на берег — Скелет мокрый
//   9–10.3 с  Скелет «растёт»
//   10.4–13.5 с машет крыльями — Радужного сдувает в пруд по пояс; выныривает с рыбой во рту и выплёвывает
//             её Скелету в лицо — шлёп! вылезает на берег
//   13.6–16 с забрасывает крючок — Скелета тащит в пруд, он упирается — плюх! под водой «пуф» — выныривает
//             шариком с рыбой на голове
//   16–19 с   Радужный вытаскивает его на леске, крутит над головой как лассо и отпускает — шарик улетает,
//             падает обратно в пруд и плавает кверху брюхом
//   19–25 с   Радужный в центре, руки вверх
'use strict';

const ST = Stage({
  name: 'mc20-fishing',
  cast: {
    skel: { small: ['skeleton-verity-small', { scale: 0.455 }], big: ['skeleton-verity-big', { height: 730 }], pivot: 325,
      voice: 0.9, lie: 60, color: '#f3f1e6', moods: { angry: 'angry theeth', grin: 'happy with theeth', big: 'theeth smile' } },
    rb: { small: ['skeleton-verity-small', { scale: 0.455, recolor: 'rainbow' }], big: ['all-verity-color', { height: 730 }],
      pivot: 325, voice: 0.85, lie: 55, color: '#ff7a3a', moods: { angry: 'angry theeth', grin: 'happy with theeth', big: 'theeth smile' } },
  },
  order: ['skel', 'rb'],
  background: { theme: 'lakeside', seed: 201, lake: [80, 640], sunX: 1480, sunY: 130 },
  clouds: [[150, 80, 2.4, 0, 12], [680, 210, 1.8, 1, 16], [1150, 60, 2.6, 2, 10], [1700, 250, 1.6, 0, 18]],
});
const { FPS, NF, GROUND, C, key, move, ev, sfx, tumble, laugh, tremble, transform, shrink, stance, walk, turn,
  victory, chuckle, hand, toRig, statesAt, stateAt, target } = ST;

// середина текущего рта (держит удочку, плюётся рыбой)
ST.parts.mouth = (ch, st, p) => {
  const name = ch.layers.some((l) => l.name === p.mouth) ? p.mouth : 'smile normal', l = ch.layers.find((x) => x.name === name);
  return E.apply(ch.eyeMatrix(st, name), [(l.bbox[0] + l.bbox[2]) / 2, (l.bbox[1] + l.bbox[3]) / 2]);
};
const P = (v, f, S) => (typeof v === 'function' ? v(f, S) : typeof v === 'string' ? target(v, S) : v);
const keyed = (ks, f) => {
  if (typeof ks === 'number') return ks;
  if (f <= ks[0][0]) return ks[0][1];
  for (let i = 1; i < ks.length; i++) {
    if (f < ks[i][0]) { const u = E.EASE.io((f - ks[i - 1][0]) / (ks[i][0] - ks[i - 1][0])); return E.lerp(ks[i - 1][1], ks[i][1], u); }
  }
  return ks[ks.length - 1][1];
};
// крылья большого Скелета: взмахи (кости B16, B17)
function flap(f0, f1, gain = 0.6) {
  for (let f = f0; f < f1; f += 6) {
    key('skel', f, { b_B16: -30, b_B17: 30 }, 3);
    key('skel', f + 3, { b_B16: 46, b_B17: -46 }, 3, 'in');
  }
  key('skel', f1, { b_B16: 0, b_B17: 0 }, 4);
  sfx('gust', f0, { who: 'skel', dur: f1 - f0, gain });
}

// ------------------------------------------------------------------ пруд, удочка, леска, рыба
const PX0 = 1180, PX1 = 1660, SURF = GROUND - 4, PD = 250;
const RL = 330;                                    // длина удилища
const ROD = [];                                    // {f0, mouth: who, a} | {f0, hand: who, arm, a} | {f0, f1, a: pt, b: pt, arc, r0, r1} | {f0, at, a}
const LINE = [];                                   // {f0, to: pt|fn|'who:part'|null, kind, len} — куда тянется леска
const FISH = [];                                   // {segs} — {f0, at} | {f0, head: who} | {f0, mouth: who} | {f0, f1, a, b, arc} | {f0, gone}
const SPLASH = [];                                 // {f, x, size}
const BUBBLES = [];                                // {f0, f1, x}
const RIPPLE = [];                                 // {f0, f1, x}
const JETS = [];                                   // струйка воды изо рта: {f0, f1, who}
function rodAt(f, S) {
  let cur = null;
  for (const c of ROD) if (f >= c.f0) cur = c;
  if (!cur) return null;
  const a = keyed(cur.a ?? 0, f);
  if (cur.mouth) { const m = target(`${cur.mouth}:mouth`, S), fc = S[cur.mouth].p.face || 1; return { g: [m[0] + fc * 55, m[1] + 6], a }; }
  if (cur.hand) {
    if (S[cur.hand].p.form !== 'big') return null;
    return { g: C[cur.hand].big.point(S[cur.hand].st, 'hand' + (cur.arm || 'F')), a };
  }
  if (cur.at) return { g: cur.at, a };
  const u = E.clamp((f - cur.f0) / (cur.f1 - cur.f0), 0, 1), A = P(cur.from, cur.f0, statesAt(cur.f0)), B = P(cur.to, f, S);
  return { g: [E.lerp(A[0], B[0], u), E.lerp(A[1], B[1], u) - Math.sin(Math.PI * u) * (cur.arc || 0)], a: E.lerp(cur.r0, cur.r1, u) };
}
const tipOf = (r) => [r.g[0] + Math.sin(r.a) * RL, r.g[1] - Math.cos(r.a) * RL];
function fishAt(F, f, S) {
  let cur = null;
  for (const c of F.segs) if (f >= c.f0) cur = c;
  if (!cur || cur.gone) return null;
  if (cur.at) return { x: cur.at[0], y: cur.at[1], rot: cur.rot || 0 };
  if (cur.head) { const t = target(`${cur.head}:top`, S); return { x: t[0], y: t[1] - 10, rot: 0.25 * (S[cur.head].p.face || 1) }; }
  if (cur.mouth) { const m = target(`${cur.mouth}:mouth`, S), fc = S[cur.mouth].p.face || 1; return { x: m[0] + fc * 30, y: m[1], rot: fc > 0 ? 0 : Math.PI }; }
  const u = E.clamp((f - cur.f0) / (cur.f1 - cur.f0), 0, 1), a = P(cur.a, cur.f0, statesAt(cur.f0)), b = P(cur.b, f, S);
  return { x: E.lerp(a[0], b[0], u), y: E.lerp(a[1], b[1], u) - Math.sin(Math.PI * u) * (cur.arc || 0), rot: (cur.spin || 0) * u };
}
function splash(f, x, size = 1, who) {
  SPLASH.push({ f, x, size });
  RIPPLE.push({ f0: f, f1: f + 30, x });
  sfx('splash', f, { x, gain: 0.9 });
}

const SS = 420, RS = 1050;
// ================================================================== 0–1.8 с: стойка
key('skel', 0, { form: 'small', x: SS, y: GROUND, face: 1, look: 1, eyes: 'normal', mouth: 'smile normal', sx: 1, sy: 1, rot: 0, pivot: 0, alpha: 1 }, 0);
key('rb', 0, { form: 'small', x: RS, y: GROUND, face: 1, look: 0, eyes: 'normal', mouth: 'smile normal', sx: 1, sy: 1, rot: 0, pivot: 0, alpha: 1 }, 0);
ROD.push({ f0: 0, mouth: 'rb', a: 0.75 });
LINE.push({ f0: 0, to: (f) => [1340, SURF - 4 + Math.sin(f * 0.25) * 4], kind: 'float' });

const BIG = () => {
  // радужный шарик покачивается, ждёт клёва
  for (let f = 6; f < 50; f += 12) { key('rb', f, { sx: 1.03, sy: 0.97 }, 6); key('rb', f + 6, { sx: 1, sy: 1 }, 6); }

  // ---- 1.8–3.6 с: Скелет подкрадывается и толкает — Радужный в пруд
  key('skel', 36, { mouth: 'happy with theeth', eyes: 'angry' }, 0);
  sfx('ref:grin-eee', 36, { who: 'skel', gain: 0.45, pitch: 1.15 });
  const S1 = 700, BUMP = 52;
  for (const [f0, x0, x1] of [[36, SS, 560], [44, 560, S1]]) {             // на цыпочках
    move('skel', f0, { x: x0, y: GROUND }); move('skel', f0 + 4, { y: GROUND - 40 }, 'out2'); move('skel', f0 + 8, { x: x1, y: GROUND }, 'in2');
    sfx('step', f0 + 8, { who: 'skel', gain: 0.3 });
  }
  key('skel', BUMP - 4, { sx: 0.9, sy: 1.1 }, 3);
  move('skel', BUMP - 2, { x: S1 });
  move('skel', BUMP, { x: RS - 290 }, 'in2');
  key('skel', BUMP, { sx: 1.25, sy: 0.82 }, 1);
  move('skel', BUMP + 10, { x: 640 }, 'out2');
  key('skel', BUMP + 6, { sx: 1, sy: 1 }, 4);
  sfx('bonk', BUMP, { who: 'rb', gain: 0.9 });
  const IN1 = BUMP + 12, DX1 = 1400;
  key('rb', BUMP, { mouth: 'puzzlement', eyes: 'sad', pivot: 150 }, 0);
  move('rb', BUMP, { x: RS, y: GROUND, rot: 0 });
  move('rb', BUMP + 6, { x: (RS + DX1) / 2, y: GROUND - 260 }, 'out2');
  move('rb', IN1, { x: DX1, y: GROUND + 60 }, 'in2');
  move('rb', IN1 + 6, { y: GROUND + 330 }, 'out2');
  move('rb', IN1, { rot: 360 }, 'lin');
  key('rb', IN1 + 1, { rot: 0 }, 0);
  sfx('scared', BUMP + 2, { who: 'rb', gain: 0.8 });
  splash(IN1, DX1, 1.2);
  // удочка улетает назад на берег
  const RG = [880, GROUND - 10];
  ROD.push({ f0: BUMP, f1: BUMP + 12, from: (f, S) => target('rb:mouth', S), to: RG, arc: 160, r0: 0.75, r1: -1.45 + Math.PI * 2 });
  ROD.push({ f0: BUMP + 12, at: RG, a: -1.45 });
  LINE.push({ f0: BUMP, to: null, kind: 'hook' });
  sfx('land', BUMP + 12, { x: RG[0], gain: 0.4 });
  BUBBLES.push({ f0: IN1 + 3, f1: IN1 + 12, x: DX1 });
  // выныривает с рыбой на голове, плюётся водой
  const UP1 = IN1 + 10;
  move('rb', UP1, { x: DX1, y: GROUND + 330 });
  move('rb', UP1 + 5, { y: GROUND + 40 }, 'out2');
  key('rb', UP1 + 5, { sx: 0.9, sy: 1.1, mouth: 'puzzlement', eyes: 'sad' }, 2);
  key('rb', UP1 + 9, { sx: 1, sy: 1 }, 3);
  splash(UP1 + 4, DX1, 0.8);
  FISH.push({ segs: [{ f0: UP1 + 4, head: 'rb' }] });
  sfx('squish', UP1 + 5, { who: 'rb', gain: 0.6 });
  JETS.push({ f0: UP1 + 8, f1: UP1 + 16, who: 'rb' });
  sfx('spit', UP1 + 8, { who: 'rb', gain: 0.7 });
  key('skel', UP1, { mouth: 'happy with theeth', eyes: 'normal' }, 0);
  sfx('ref:laugh', UP1 + 2, { who: 'skel', gain: 0.85, pitch: 1.15 });
  laugh('skel', UP1 + 2, UP1 + 24);
  // выскакивает на берег
  const OUT1 = UP1 + 10, RS2 = 1040;
  move('rb', OUT1, { x: DX1, y: GROUND + 40 });
  move('rb', OUT1 + 6, { x: (DX1 + RS2) / 2, y: GROUND - 260 }, 'out2');
  move('rb', OUT1 + 12, { x: RS2, y: GROUND }, 'in2');
  key('rb', OUT1 + 12, { sx: 1.25, sy: 0.8, face: -1 }, 1);
  key('rb', OUT1 + 16, { sx: 1, sy: 1 }, 3);
  sfx('jump', OUT1 + 1, { who: 'rb', gain: 0.5 });
  sfx('land', OUT1 + 12, { who: 'rb', gain: 0.6 });
  ev('wet', { who: 'rb', f0: OUT1 + 12, f1: OUT1 + 40 });

  // ---- 3.7–4.9 с: Радужный «растёт» — рыба слетает
  const RX = 1040;
  key('rb', OUT1 + 12, { eyes: 'angry', mouth: 'angry theeth', look: 1 }, 0);
  const RB = transform('rb', OUT1 + 12, RS2, RX, -1, { style: 'grow' });
  FISH[0].segs.push({ f0: RB - 2, f1: RB + 14, a: (f, S) => target('rb:top', S), b: [1500, SURF], arc: 220, spin: Math.PI * 3 }, { f0: RB + 14, gone: true });
  splash(RB + 14, 1500, 0.6);
  key('rb', RB, stance('rb', RX, -1), 0);
  key('rb', RB + 6, { mouth: 'happy with theeth', eyes: 'angry' }, 0);
  key('skel', RB - 2, { mouth: 'puzzlement', eyes: 'sad' }, 0);
  ev('sweat', { who: 'skel', f0: RB, f1: RB + 22 });

  // ---- 5–9 с: удочку с земли — заброс — крючок цепляет Скелета; макает его в пруд дважды
  const K = C.rb.big, PU = RB + 6;
  key('rb', PU - 8, { lean: 24, hip: [0, toRig('rb', 110)], head: 8 }, 8);
  key('rb', PU, { hitF: 1, hitFto: [RG[0] + 20, RG[1] - 10], hitFfix: PU }, 6);
  ROD.push({ f0: PU, hand: 'rb', arm: 'F', a: [[PU, -1.45], [PU + 10, 0.4]] });
  sfx('pop', PU, { who: 'rb', gain: 0.5 });
  key('rb', PU + 10, { ...stance('rb', RX, -1), hitF: 0, handF: hand('rb', 'F', 0.6, -0.3) }, 10);
  const CAST = PU + 18, HOOK = CAST + 9;
  ROD.push({ f0: PU + 12, hand: 'rb', arm: 'F', a: [[PU + 12, 0.4], [CAST - 2, 0.9], [CAST + 3, -1.0]] });
  key('rb', CAST - 4, { handF: hand('rb', 'F', 0.2, -0.8), lean: -8 }, 6);
  key('rb', CAST + 2, { handF: hand('rb', 'F', 0.9, -0.35), lean: 10 }, 4, 'in2');
  sfx('swing', CAST - 2, { who: 'rb', gain: 0.8 });
  sfx('whoosh', CAST, { who: 'rb', dur: 8, gain: 0.6 });
  const rodTip = (f, S) => tipOf(rodAt(f, S));
  LINE.push({ f0: CAST, f1: HOOK, from: rodTip, to: 'skel:top', kind: 'hook' });
  LINE.push({ f0: HOOK, to: 'skel:top', kind: 'hook' });
  sfx('flick', HOOK, { who: 'skel', gain: 0.8 });
  key('skel', HOOK, { mouth: 'puzzlement', eyes: 'sad', sx: 0.9, sy: 1.1 }, 1);
  key('skel', HOOK + 4, { sx: 1, sy: 1 }, 3);
  // разворот к пруду и подъём: Скелет болтается на леске
  turn('rb', HOOK + 4, 1, RX);
  ROD.push({ f0: HOOK + 5, hand: 'rb', arm: 'F', a: [[HOOK + 5, -0.6], [HOOK + 16, 0.9], [HOOK + 30, 1.0], [HOOK + 36, 1.15], [HOOK + 42, 0.95], [HOOK + 50, 1.15], [HOOK + 56, 0.95], [HOOK + 66, -0.9]] });
  key('rb', HOOK + 6, { handF: hand('rb', 'F', 0.7, -0.6), lean: -6, mouth: 'happy with theeth' }, 6);
  const dTop = target('skel:top', stateAt(1))[1] - GROUND;                // от опоры до макушки шарика
  const hang = (f) => { const t = rodTip(f, stateAt(f)); return [t[0], t[1] + 230 - dTop]; };
  const path = [[HOOK + 4, null], [HOOK + 16, 'h'], [HOOK + 30, 'h'], [HOOK + 36, [1330, SURF + 120]], [HOOK + 42, 'h'], [HOOK + 50, [1380, SURF + 120]], [HOOK + 56, 'h']];
  move('skel', HOOK + 4, { x: 640, y: GROUND });
  sfx('scared', HOOK + 6, { who: 'skel', gain: 0.8 });
  for (const [f, p] of path.slice(1)) { const q = p === 'h' ? hang(f) : p; move('skel', f, { x: q[0], y: q[1] }, 'io'); }
  splash(HOOK + 35, 1330, 1.0);
  splash(HOOK + 49, 1380, 1.0);
  sfx('ref:grunt', HOOK + 38, { who: 'skel', gain: 0.5, pitch: 1.4 });
  sfx('ref:laugh', HOOK + 38, { who: 'rb', gain: 0.85, pitch: 1.0 });
  // забрасывает обратно на берег
  const FL = HOOK + 57, LAND = FL + 14, SL = 380;
  LINE.push({ f0: FL, to: null, kind: 'hook' });
  key('skel', FL, { pivot: 150 }, 0);
  move('skel', FL, { rot: 0 });
  move('skel', LAND - 4, { x: SL + 60, y: GROUND - 300 }, 'out2');
  move('skel', LAND, { x: SL, y: GROUND }, 'in2');
  move('skel', LAND, { rot: -540 }, 'lin');
  key('skel', LAND + 1, { rot: 0 }, 0);
  key('skel', LAND, { sx: 1.3, sy: 0.75 }, 1);
  key('skel', LAND + 6, { sx: 1, sy: 1 }, 5);
  sfx('whoosh', FL, { who: 'skel', dur: 12, gain: 0.6 });
  sfx('squish', LAND, { who: 'skel', gain: 0.9 });
  ev('wet', { who: 'skel', f0: LAND, f1: LAND + 40 });
  ev('stars', { who: 'skel', f0: LAND + 2, f1: LAND + 20, snd: false });
  key('rb', LAND, { ...stance('rb', RX, 1), mouth: 'happy with theeth', eyes: 'normal', lean: 0 }, 6);
  chuckle('rb', LAND + 2, LAND + 20, { mouth: 'happy with theeth' });

  // ---- 9–10.3 с: Скелет «растёт»
  const SX = 470;
  key('skel', LAND + 6, { eyes: 'angry', mouth: 'angry theeth' }, 0);
  ev('vein', { who: 'skel', f0: LAND + 6, f1: LAND + 16 });
  const SB = transform('skel', LAND + 8, SL, SX, 1, { style: 'grow' });
  key('skel', SB, stance('skel', SX, 1), 0);
  key('skel', SB + 6, { mouth: 'happy with theeth', eyes: 'angry' }, 0);
  turn('rb', SB - 4, -1, RX);
  key('rb', SB - 2, { mouth: 'puzzlement', eyes: 'sad' }, 0);
  ROD.push({ f0: SB - 3, hand: 'rb', arm: 'F', a: 0.3 });

  // ---- 10.4–13.5 с: крылья — Радужного сдувает в пруд по пояс; рыба изо рта — Скелету в лицо
  flap(SB + 4, SB + 28, 0.9);
  ev('wind', { f0: SB + 6, f1: SB + 30, x0: SX + 260, x1: 1800, snd: false });
  key('skel', SB + 4, { lean: 8, mouth: 'happy open mouth' }, 4);
  key('skel', SB + 30, { lean: 0, mouth: 'happy with theeth' }, 6);
  key('rb', SB + 8, { lean: -14, head: -10, handF: hand('rb', 'F', 0.6, -0.8), handB: hand('rb', 'B', -0.4, -0.7) }, 4);
  const KR = C.rb.big, WIN1 = SB + 12, IN2 = SB + 24, RW = 1400;
  move('rb', WIN1, { x: RX, y: GROUND });
  move('rb', IN2, { x: RW, y: GROUND + 230 }, 'in2');
  key('rb', WIN1, { ...KR.feet(RX, -1) }, 0);
  key('rb', IN2, { ...KR.feet(RW, -1) }, IN2 - WIN1, 'in2');
  sfx('scared', WIN1 + 2, { who: 'rb', gain: 0.7 });
  splash(IN2, RW, 1.6);
  key('rb', IN2, { mouth: 'puzzlement', eyes: 'sad', lean: 0, head: 0, handF: hand('rb', 'F', 0.5, -0.5), handB: hand('rb', 'B', -0.3, -0.6) }, 3);
  // выныривает с рыбой во рту
  const FM = IN2 + 8;
  FISH.push({ segs: [{ f0: FM, mouth: 'rb' }] });
  key('rb', FM, { mouth: 'happy open mouth', eyes: 'normal' }, 0);
  sfx('squish', FM, { who: 'rb', gain: 0.6 });
  key('skel', IN2 + 2, { mouth: 'happy with theeth', eyes: 'normal' }, 0);
  sfx('ref:laugh', IN2 + 2, { who: 'skel', gain: 0.85, pitch: 1.0 });
  chuckle('skel', IN2 + 2, IN2 + 20, { mouth: 'happy with theeth' });
  const SPIT = FM + 10, SLAP = SPIT + 10;
  key('rb', SPIT - 4, { head: -8, lean: -6 }, 4);
  key('rb', SPIT, { head: 8, lean: 10, mouth: 'puzzlement' }, 2, 'in2');
  sfx('spit', SPIT, { who: 'rb', gain: 1.0 });
  FISH[1].segs.push({ f0: SPIT, f1: SLAP, a: (f, S) => target('rb:mouth', S), b: 'skel:face', arc: 60, spin: Math.PI * 2 });
  FISH[1].segs.push({ f0: SLAP, f1: SLAP + 16, a: 'skel:face', b: [SX - 140, GROUND - 30], arc: 120, spin: -Math.PI * 3 });
  FISH[1].segs.push({ f0: SLAP + 16, at: [SX - 140, GROUND - 30], rot: 0.2 });
  sfx('slap', SLAP, { who: 'skel', gain: 1.0 });
  sfx('squish', SLAP, { who: 'skel', gain: 0.6 });
  key('skel', SLAP, { head: -16, lean: -10, mouth: 'puzzlement', eyes: 'sad' }, 2);
  key('skel', SLAP + 10, { head: 0, lean: 0 }, 6);
  ev('stars', { who: 'skel', f0: SLAP + 2, f1: SLAP + 22, snd: false });
  ev('wet', { who: 'skel', f0: SLAP, f1: SLAP + 24 });
  // вылезает на берег
  const OUT2 = SLAP + 6, RX2 = 1780;
  key('rb', OUT2, { head: 0, lean: 0, mouth: 'happy with theeth' }, 4);
  move('rb', OUT2, { x: RW, y: GROUND + 230 });
  move('rb', OUT2 + 7, { x: (RW + RX2) / 2, y: GROUND - 160 }, 'out2');
  move('rb', OUT2 + 14, { x: RX2, y: GROUND }, 'in2');
  key('rb', OUT2, { legFfk: 1, legBfk: 1, legF: [-30, 50], legB: [25, -40] }, 2);
  key('rb', OUT2 + 14, { ...stance('rb', RX2, -1), legFfk: 0, legBfk: 0, handF: hand('rb', 'F', 0.6, -0.3) }, 3);
  sfx('land', OUT2 + 14, { who: 'rb', gain: 0.7 });
  ev('wet', { who: 'rb', f0: OUT2 + 14, f1: OUT2 + 50 });
  splash(OUT2 + 2, RW, 0.8);

  // ---- 13.6–16 с: крючок цепляет Скелета — тянет в пруд — плюх, под водой «пуф» — шарик с рыбой на голове
  const CAST2 = OUT2 + 18, HK2 = CAST2 + 9;
  ROD.push({ f0: OUT2 + 14, hand: 'rb', arm: 'F', a: [[OUT2 + 14, 0.3], [CAST2 - 2, 0.9], [CAST2 + 3, -1.0]] });
  key('rb', CAST2 - 4, { handF: hand('rb', 'F', 0.2, -0.8), lean: -8 }, 6);
  key('rb', CAST2 + 2, { handF: hand('rb', 'F', 0.9, -0.35), lean: 10, mouth: 'happy with theeth', eyes: 'angry' }, 4, 'in2');
  sfx('swing', CAST2 - 2, { who: 'rb', gain: 0.8 });
  LINE.push({ f0: CAST2, f1: HK2, from: rodTip, to: 'skel:head', kind: 'hook' });
  LINE.push({ f0: HK2, to: 'skel:head', kind: 'hook' });
  sfx('flick', HK2, { who: 'skel', gain: 0.8 });
  ROD.push({ f0: HK2 + 1, hand: 'rb', arm: 'F', a: [[HK2 + 1, -1.0], [HK2 + 26, 0.25]] });
  key('rb', HK2 + 4, { handF: hand('rb', 'F', 0.3, -0.75), lean: -14, mouth: 'happy with theeth' }, 6);
  // Скелета тянет: упирается, машет крыльями — едет к пруду
  const KS = C.skel.big, DR0 = HK2 + 4, DR1 = DR0 + 18, SPOND = 1330;
  key('skel', HK2, { mouth: 'puzzlement', eyes: 'sad', lean: -18, head: -10, hip: [toRig('skel', -20), toRig('skel', 50)] }, 4);
  flap(DR0, DR1, 0.6);
  sfx('slide', DR0, { who: 'skel', gain: 0.6 });
  move('skel', DR0, { x: SX, y: GROUND });
  move('skel', DR1, { x: PX0 - 60 }, 'in');
  key('skel', DR0, { ...KS.feet(SX, 1) }, 0);
  key('skel', DR1, { ...KS.feet(PX0 - 60, 1) }, DR1 - DR0, 'in');
  // плюх в пруд
  const IN3 = DR1 + 8;
  key('skel', DR1, { pivot: (KS.anchor[1] - KS.top) / 2, legFfk: 1, legBfk: 1, legF: [-30, 50], legB: [25, -40] }, 0);
  move('skel', DR1, { rot: 0 });
  move('skel', DR1 + 4, { x: (PX0 + SPOND) / 2, y: GROUND - 160 }, 'out2');
  move('skel', IN3, { x: SPOND, y: GROUND + 380 }, 'in2');
  move('skel', IN3, { rot: 120 }, 'lin');
  sfx('scared', DR1, { who: 'skel', gain: 0.8 });
  splash(IN3 - 3, SPOND, 1.8);
  LINE.push({ f0: IN3 - 2, to: [SPOND, SURF], kind: 'hook' });
  BUBBLES.push({ f0: IN3, f1: IN3 + 14, x: SPOND });
  const sm = shrink('skel', IN3 + 4, SPOND, 1, { mouth: 'puzzlement', eyes: 'sad', smoke: 10 });
  key('skel', sm, { lean: 0, head: 0, hip: [0, 0], y: GROUND + 330, rot: 0 }, 0);
  move('skel', sm, { x: SPOND, y: GROUND + 330, rot: 0 });
  const UP3 = sm + 8;
  move('skel', UP3, { y: GROUND + 40 }, 'out2');
  splash(UP3 - 2, SPOND, 0.8);
  FISH.push({ segs: [{ f0: UP3 - 2, head: 'skel' }] });
  JETS.push({ f0: UP3 + 2, f1: UP3 + 10, who: 'skel' });
  sfx('spit', UP3 + 2, { who: 'skel', gain: 0.7 });
  key('rb', IN3 + 2, { mouth: 'happy with theeth', eyes: 'normal', lean: 0 }, 4);
  sfx('ref:laugh', IN3 + 4, { who: 'rb', gain: 0.85, pitch: 1.0 });
  chuckle('rb', IN3 + 4, IN3 + 24, { mouth: 'happy with theeth' });

  // ---- 16–19 с: вытаскивает на леске, крутит над головой — отпускает; шарик падает в пруд кверху брюхом
  const RE = UP3 + 8;
  LINE.push({ f0: RE, f1: RE + 6, from: rodTip, to: 'skel:top', kind: 'hook' });
  LINE.push({ f0: RE + 6, to: 'skel:top', kind: 'hook' });
  const SW0 = RE + 8, SW1 = SW0 + 26;
  ROD.push({ f0: SW0 - 6, hand: 'rb', arm: 'F', a: -0.55 });
  key('rb', SW0 - 4, { handF: hand('rb', 'F', 0.55, -0.75), lean: 0 }, 4);
  key('skel', SW0 - 6, { mouth: 'puzzlement', eyes: 'sad' }, 0);
  sfx('scared', SW0, { who: 'skel', gain: 0.8 });
  sfx('whirr', SW0, { who: 'rb', dur: SW1 - SW0, gain: 0.5 });
  const dT = target('skel:top', stateAt(1))[1] - GROUND;
  for (let f = SW0; f <= SW1; f += 2) {
    const r = rodAt(f, stateAt(f)), t = tipOf(r), ang = (f - SW0) / 15 * Math.PI * 2;
    move('skel', f, { x: t[0] + Math.cos(ang) * 200, y: t[1] + Math.sin(ang) * 70 + 330 - dT }, 'lin');
  }
  move('skel', SW0 - 4, { x: SPOND, y: GROUND + 40 });
  const GO = SW1, TOPF = GO + 16, DOWN = TOPF + 16, FLOAT = 1460;
  LINE.push({ f0: GO, to: null, kind: 'hook' });
  key('skel', GO, { pivot: 150 }, 0);
  move('skel', GO, { rot: 0 });
  move('skel', TOPF, { x: 1200, y: -260 }, 'out2');
  move('skel', DOWN, { x: FLOAT, y: GROUND + 60 }, 'in2');
  FISH[2].segs.push({ f0: DOWN - 2, gone: true });
  move('skel', DOWN, { rot: 900 }, 'lin');
  sfx('whoosh', GO, { who: 'skel', dur: 16, gain: 0.7 });
  ev('twinkle', { f: TOPF - 2, at: [1220, 100], n: 18, size: 50 });
  sfx('whoosh', TOPF, { who: 'skel', dur: 14, gain: 0.5 });
  splash(DOWN - 2, FLOAT, 1.4);
  key('skel', DOWN, { rot: 180, mouth: 'puzzlement', eyes: 'sad' }, 0);
  move('skel', DOWN + 8, { y: GROUND - 30 }, 'out2');
  const BOB0 = DOWN + 18 + 9 + 12;
  for (let f = DOWN + 8; f < NF - 8; f += 16) { if (f + 8 > DOWN + 22 && f + 16 < BOB0) continue; move('skel', f + 8, { y: GROUND - 20 }, 'io'); move('skel', f + 16, { y: GROUND - 34 }, 'io'); }
  ev('stars', { who: 'skel', f0: DOWN + 10, f1: DOWN + 50, snd: false });
  key('rb', GO + 2, { handF: hand('rb', 'F', 0.6, -0.3), mouth: 'happy with theeth' }, 6);
  ROD.push({ f0: GO + 2, hand: 'rb', arm: 'F', a: [[GO + 2, -0.55], [GO + 10, -0.2]] });
  sfx('ref:laugh', DOWN + 2, { who: 'rb', gain: 0.85, pitch: 1.0 });
  chuckle('rb', DOWN + 2, DOWN + 16, { mouth: 'happy with theeth' });
  const RODG = [RX2 + 20, GROUND - 10];
  ROD.push({ f0: DOWN + 6, f1: DOWN + 14, from: (f, S) => C.rb.big.point(S.rb.st, 'handF'), to: RODG, arc: 40, r0: -0.2, r1: -1.45 });
  ROD.push({ f0: DOWN + 14, at: RODG, a: -1.45 });
  sfx('land', DOWN + 14, { x: RODG[0], gain: 0.4 });
  // большой прыжок через пруд — в центр
  const KR2 = C.rb.big, JP = DOWN + 18, STEP = JP + 9, JL = STEP + 16, RJ = 1000;
  key('rb', JP - 6, { ...stance('rb', RX2, -1), hip: [0, toRig('rb', 90)], lean: 14, handF: hand('rb', 'F', -0.5, 0.2), handB: hand('rb', 'B', -0.5, 0.2) }, 6);
  key('rb', JP, { legFfk: 1, legBfk: 1, legF: [-40, 60], legB: [30, -50], hip: [0, 0], lean: -6, handF: hand('rb', 'F', 0.85, -0.35), handB: hand('rb', 'B', -0.7, -0.4), mouth: 'happy open mouth' }, 2);
  move('rb', JP, { x: RX2, y: GROUND });
  move('rb', STEP, { x: FLOAT + 20, y: GROUND - 100 }, 'io');
  key('rb', STEP, { hip: [0, toRig('rb', 90)] }, 3);
  key('rb', STEP + 5, { hip: [0, 0] }, 4);               // прыг по шарику, как по кочке
  move('rb', STEP + 8, { x: (FLOAT + RJ) / 2, y: GROUND - 110 }, 'out2');
  move('rb', JL, { x: RJ, y: GROUND }, 'in2');
  sfx('boing', STEP, { x: FLOAT, gain: 0.9 });
  sfx('ref:grunt', STEP + 1, { who: 'skel', gain: 0.5, pitch: 1.4 });
  key('skel', STEP, { sx: 1.3, sy: 0.75 }, 1);
  key('skel', STEP + 6, { sx: 1, sy: 1 }, 5);
  move('skel', STEP, { y: GROUND - 30 });
  move('skel', STEP + 3, { y: GROUND + 40 }, 'out2');
  move('skel', STEP + 10, { y: GROUND - 30 }, 'io');
  splash(STEP + 1, FLOAT, 0.9);
  key('rb', JP, { ...KR2.feet(RX2, -1) }, 0);
  key('rb', JL, { ...KR2.feet(RJ, -1) }, JL - JP, 'io');
  key('rb', JL, { ...stance('rb', RJ, -1), sx: 1.08, sy: 0.92, legFfk: 0, legBfk: 0 }, 2);
  key('rb', JL + 5, { sx: 1, sy: 1 }, 4);
  sfx('jump', JP + 1, { who: 'rb', gain: 0.6 });
  sfx('whoosh', JP + 2, { who: 'rb', dur: 14, gain: 0.5 });
  sfx('land', JL, { who: 'rb', gain: 0.8 });
  ev('dust', { f: JL, x: RJ, r: 50, n: 6 });
  const WIN = victory('rb', JL + 6, RJ, { n: 8, stride: 90 });
  window.T = { BUMP, IN1, RB, HOOK, LAND, SB, IN2, SLAP, HK2, IN3, UP3, GO, DOWN, WIN };
};

// ------------------------------------------------------------------ рисование
ST.hooks.clip = (ctx, who, f, S) => {             // под водой не видно (в воде — во всю ширину: крылья не торчат из земли)
  ctx.beginPath();
  ctx.rect(-500, -2000, 2920, 4000);
  const p = S[who].p, inWater = p.x > PX0 - 40 && p.x < PX1 + 40 && p.y > GROUND + 20;
  if (inWater) ctx.rect(-500, SURF, 2920, 2000); else ctx.rect(PX0, SURF, PX1 - PX0, 2000);
  return true;
};
ST.hooks.beforeChars.push((ctx, f, S, CAM) => {
  ctx.setTransform(...CAM);
  FX.pond(ctx, PX0, PX1, SURF, PD, f / FPS);
  const r = rodAt(f, S);
  if (r && ROD.filter((c) => f >= c.f0).pop().at) drawRod(ctx, f, S, r);
});
function lineEnd(f, S, r) {
  let cur = null;
  for (const c of LINE) if (f >= c.f0) cur = c;
  const tip = tipOf(r);
  if (!cur || cur.to === null) return { tip, end: [tip[0], tip[1] + 90], kind: 'hook' };
  let end = P(cur.to, f, S);
  if (cur.f1 && f < cur.f1) { const u = (f - cur.f0) / (cur.f1 - cur.f0), a = P(cur.from, cur.f0, statesAt(cur.f0)); end = [E.lerp(a[0], end[0], u), E.lerp(a[1], end[1], u) - Math.sin(Math.PI * u) * 80]; }
  return { tip, end, kind: cur.kind };
}
function drawRod(ctx, f, S, r) {
  FX.fishingRod(ctx, r.g[0], r.g[1], r.a, RL);
  const { tip, end, kind } = lineEnd(f, S, r);
  FX.fishLine(ctx, tip, end, 20, kind);
}
ST.hooks.afterChars.push((ctx, f, S, CAM) => {
  ctx.setTransform(...CAM);
  for (const F of FISH) { const p = fishAt(F, f, S); if (p) FX.fish(ctx, p.x, p.y, 110, p.rot, f / FPS); }
  const r = rodAt(f, S);
  if (r && !ROD.filter((c) => f >= c.f0).pop().at) drawRod(ctx, f, S, r);
  for (const q of RIPPLE) {
    if (f < q.f0 || f > q.f1) continue;
    const u = (f - q.f0) / (q.f1 - q.f0);
    ctx.save(); ctx.globalAlpha = 1 - u; ctx.lineWidth = 4; ctx.strokeStyle = '#ffffff';
    for (const k of [0.5, 1]) { ctx.beginPath(); ctx.ellipse(q.x, SURF + 4, 40 + 150 * u * k, 8 + 14 * u * k, 0, 0, Math.PI * 2); ctx.stroke(); }
    ctx.restore();
  }
  for (const b of BUBBLES) {
    if (f < b.f0 || f > b.f1) continue;
    const rr = FX.rng(b.f0);
    for (let i = 0; i < 6; i++) {
      const u = ((f - b.f0) / 8 + rr()) % 1, x = b.x + (rr() - 0.5) * 90;
      ctx.beginPath(); ctx.arc(x, SURF + 10 - u * 30, 8 + rr() * 8, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(220,240,255,0.85)'; ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = '#2a6fd0'; ctx.stroke();
    }
  }
  for (const s of SPLASH) FX.waterSplash(ctx, s.x, SURF, (f - s.f) / 16, s.size, s.f);
  for (const j of JETS) {
    if (f < j.f0 || f > j.f1 + 4) continue;
    const m = target(`${j.who}:mouth`, S);
    FX.waterJet(ctx, m, [m[0] + 10, m[1] - 160], f / FPS, 16, Math.min(1, (f - j.f0 + 1) / 3), 0, f > j.f1 ? 1 - (f - j.f1) / 4 : 1);
  }
});

ST.start(BIG);
