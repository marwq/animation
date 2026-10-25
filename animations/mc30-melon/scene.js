// Ролик 30 (серия по образцу): Арбуз — Жёлтая, Толстый, Малыш и Скелет, 25 с, 24 кадра/с. Плотно, как у HugyTi:
// арбузы-блоки: проглотить целиком, обстрел семечками, корка шлемом на голову, пинок арбузом.
// Музыка превращения — присланная, ~4 с с затиханием, только при первом превращении. Фон — сад.
//
//   0–1.2 с   шарик-Жёлтая, арбуз, Толстый, арбуз, шарик-Малыш, шарик-Скелет, стопка арбузов справа
//   1.2–3.9 с Толстый глотает арбуз целиком — раздувается — строчит семечками в Скелета (Малыш взлетает на
//             пропеллере, семечки под ним) — Скелет в семечках кувырком
//   3.9–5.1 с Скелет «растёт» под музыку
//   5.2–8 с   берёт арбуз со стопки и бросает в Толстого — корка шлемом, Толстый вслепую толкает Малыша
//   8.6–9.8 с Малыш «растёт»; Толстый стряхивает корку
//   9.9–13 с  топает — последний арбуз подскакивает и надевается Скелету на голову; Скелет вслепую идёт,
//             Малыш взлетает на пропеллере, Скелет спотыкается о Толстого и падает на него — «пуф»
//   13.2–14.4 с Жёлтая «растёт» — все влюблены
//   14.6–16.3 с пинает арбуз — Малышу в лицо — «пуф»; долька летит ей в руку, она съедает её
//   16.3–18.4 с строчит семечками — Толстый, Малыш и Скелет удирают за кадр
//   18.5–25 с Жёлтая в центре, руки вверх
'use strict';

const ST = Stage({
  name: 'mc30-melon',
  cast: {
    yel: { small: ['girl-verity-small', { bodyHeight: 300, recolor: 'yellow' }],
      big: ['verity-big-girl', { height: 730, splitFeet: true, recolor: 'yellow' }], pivot: 337, voice: 1.45, vAngle: 50, lie: 55,
      color: '#ffe23a', moods: { angry: 'angry theeth', grin: 'theeth smile', big: 'theeth smile' } },
    fat: { small: ['fat-verity-small', { bodyHeight: 450 }], pivot: 508, voice: 0.75, moods: { love: 'happy' } },
    baby: { small: ['child-verity-pink', { bodyHeight: 300, spin: { layer: 'hat', cut: 122, axis: 389 } }],
      big: ['child-verity-big', { height: 730, spin: { layer: 'hat', cut: 106, axis: 330 } }], pivot: 338, voice: 1.25,
      lie: 60, color: '#ffd9b8', moods: { angry: ' 2', grin: ' 2', big: 'theeth smile' } },
    skel: { small: ['skeleton-verity-small', { scale: 0.455 }], big: ['skeleton-verity-big', { height: 730 }], pivot: 325,
      voice: 0.9, lie: 60, color: '#f3f1e6', moods: { angry: 'angry theeth', grin: 'happy with theeth', big: 'theeth smile' } },
  },
  order: ['fat', 'skel', 'baby', 'yel'],
  background: { theme: 'orchard', seed: 301, sunX: 1500, sunY: 130 },
  clouds: [[150, 80, 2.4, 0, 12], [680, 220, 1.8, 1, 16], [1120, 60, 2.6, 2, 10], [1720, 250, 1.5, 0, 18]],
});
const { FPS, NF, GROUND, C, key, move, ev, sfx, hop, tumble, laugh, tremble, transform, shrink, stance, walk, turn,
  stomp, fallBack, kick, strike, victory, chuckle, hand, toRig, statesAt, stateAt, target } = ST;

ST.parts.mouth = (ch, st) => E.apply(ch.eyeMatrix(st, 'puzzlement'), [611, 456]);     // рот Толстого
const P = (v, f, S) => (typeof v === 'function' ? v(f, S) : typeof v === 'string' ? target(v, S) : v);
function fatOpen(f, k, n, extra = {}) { key('fat', f - n, { mouth: 'puzzlement' }, 0); key('fat', f, { mouthK: k, ...extra }, n, 'out'); }
function propeller(who, f0, f1, rps = 7, o = {}) {
  key(who, f0, { spin: 0, spinBlur: 0 }, 0);
  key(who, f0 + 8, { spinBlur: 1 }, 8);
  move(who, f1, { spin: rps * (f1 - f0) / 24 }, 'lin');
  key(who, f1, { spinBlur: 0 }, 6);
  key(who, f1 + 1, { spin: 0 }, 0);
  if (o.snd !== false) sfx('whirr', f0, { who, dur: f1 - f0, gain: o.gain ?? 0.4 });
}
function flap(f0, f1, gain = 0.6) {
  for (let f = f0; f < f1; f += 6) { key('skel', f, { b_B16: -30, b_B17: 30 }, 3); key('skel', f + 3, { b_B16: 46, b_B17: -46 }, 3, 'in'); }
  key('skel', f1, { b_B16: 0, b_B17: 0 }, 4);
  sfx('gust', f0, { who: 'skel', dur: f1 - f0, gain });
}

// ------------------------------------------------------------------ арбузы, корки, семечки, брызги
const MELONS = [];        // {s, segs: [{f0, at:[x,y]} | {f0, hand, arm} | {f0, f1, a, b, arc, spin, k0, k1} | {f0, gone}]}
const melAt = (M, f, S) => {
  let cur = null;
  for (const c of M.segs) if (f >= c.f0) cur = c;
  if (!cur || cur.gone) return null;
  if (cur.at) return { x: cur.at[0], y: cur.at[1], rot: 0, k: 1 };
  if (cur.hand) {
    if (S[cur.hand].p.form !== 'big') return null;
    const h = C[cur.hand].big.point(S[cur.hand].st, 'hand' + (cur.arm || 'F'));
    return { x: h[0], y: h[1] - M.s * 0.42, rot: 0, k: 1 };
  }
  const u = E.clamp((f - cur.f0) / (cur.f1 - cur.f0), 0, 1), a = P(cur.a, cur.f0, statesAt(cur.f0)), b = P(cur.b, f, S);
  return { x: E.lerp(a[0], b[0], u), y: E.lerp(a[1], b[1], u) - Math.sin(Math.PI * u) * (cur.arc || 0), rot: u * (cur.spin || 0),
    k: E.lerp(cur.k0 ?? 1, cur.k1 ?? 1, u) };
};
const HELM = [];          // {who, f0, f1, w, dy} — корка на голове; {f0, f1, a, b, arc, w} — летит; {f0, f1, at, w} — лежит
const SPL = [];           // {f, at, size, seed}
const SEEDS = [];         // {f0, f1, from, to, arc}
const STUCK = [];         // {who, f0, f1, dx, dy, rot}
const SLICE = [];         // {f0, f1, a, b, arc, spin} | {f0, f1, hand} — долька; bite в руке
function splash(f, at, size = 1, seed = 1) {
  SPL.push({ f, at, size, seed });
  sfx('splash', f, { x: Array.isArray(at) ? at[0] : 960, gain: 0.8 });
  sfx('crunch', f, { x: Array.isArray(at) ? at[0] : 960, gain: 0.8 });
  ev('shake', { f, amp: 12, n: 8 });
}
// очередь семечек: из рта from в цель to (функция i → точка), n штук через каждые step кадров
function volley(f0, n, step, from, to, o = {}) {
  for (let i = 0; i < n; i++) {
    const f = f0 + i * step, fl = o.fl || 7;
    SEEDS.push({ f0: f, f1: f + fl, from, to: to(i), arc: o.arc ?? 20 });
    if (i % 2 === 0) sfx('spit', f, { x: o.x ?? 960, gain: 0.55 });
    if (o.hit) o.hit(i, f + fl);
  }
}

const YS = 130, ML = 290, BS = 560, FS = 900, MC = 1250, SS = 1520, STK = 1840;
const M_C = { s: 180, segs: [{ f0: 0, at: [MC, GROUND - 90] }] };
const M_L = { s: 150, segs: [{ f0: 0, at: [ML, GROUND - 75] }] };
const M_T = { s: 140, segs: [{ f0: 0, at: [STK, GROUND - 210] }] };
const M_B = { s: 140, segs: [{ f0: 0, at: [STK, GROUND - 70] }] };
MELONS.push(M_C, M_L, M_T, M_B);

// ================================================================== 0–1.2 с: стойка
key('yel', 0, { form: 'small', x: YS, y: GROUND, face: 1, look: 1, eyes: 'normal', mouth: 'smile normal', sx: 1, sy: 1, rot: 0, pivot: 0, alpha: 1 }, 0);
key('baby', 0, { form: 'small', x: BS, y: GROUND, face: 1, look: 1, eyes: 'normal', mouth: ' 6', sx: 1, sy: 1, rot: 0, pivot: 0, alpha: 1 }, 0);
key('fat', 0, { form: 'small', x: FS, y: GROUND, face: 1, look: 1, eyes: 'normal', mouth: 'happy', sx: 1, sy: 1, rot: 0, pivot: 0, mouthK: 1 }, 0);
key('skel', 0, { form: 'small', x: SS, y: GROUND, face: -1, look: 1, eyes: 'normal', mouth: 'smile normal', sx: 1, sy: 1, rot: 0, pivot: 0, alpha: 1 }, 0);

const BIG = () => {
  // Толстый облизывается на арбуз
  key('fat', 10, { mouth: 'theeth smile' }, 0);
  sfx('ref:grin-eee', 12, { who: 'fat', gain: 0.4, pitch: 0.8 });
  for (let f = 12; f < 28; f += 8) { key('fat', f + 4, { sx: 1.04, sy: 0.96 }, 3); key('fat', f + 8, { sx: 1, sy: 1 }, 3); }

  // ---- 1.2–3.9 с: глотает арбуз — раздувается — очередь семечек в Скелета
  const FX1 = 1040;
  hop('fat', 28, 40, FS, FX1, 110);
  fatOpen(42, 2.0, 4);
  const EAT0 = 42, EAT1 = 50;
  M_C.segs.push({ f0: EAT0, f1: EAT1, a: [MC, GROUND - 90], b: 'fat:mouth', arc: 70, spin: 2.5, k0: 1, k1: 0.25 });
  M_C.segs.push({ f0: EAT1, gone: true });
  sfx('whoosh', EAT0, { who: 'fat', dur: 8, gain: 0.5 });
  sfx('chomp', EAT1, { who: 'fat', gain: 1.0 });
  sfx('gulp', EAT1 + 3, { who: 'fat', gain: 1.0 });
  key('fat', EAT1, { mouthK: 1, mouth: 'smile normal' }, 1);
  key('fat', EAT1 + 4, { sx: 1.24, sy: 1.18, eyes: 'angry', mouth: 'theeth smile' }, 4, 'out');
  sfx('inflate', EAT1 + 1, { who: 'fat', dur: 5, gain: 0.6 });
  key('baby', EAT1 + 2, { mouth: ' 5', eyes: 'sad' }, 0);
  key('skel', EAT1 + 2, { mouth: 'puzzlement', eyes: 'sad' }, 0);
  // очередь семечек
  const SP0 = EAT1 + 4, NSD = 10;
  fatOpen(SP0, 1.4, 2);
  const sf = (i) => (f, S) => { const p = target('skel:face', S); return [p[0] + ((i * 37) % 60) - 30, p[1] + ((i * 23) % 50) - 25]; };
  volley(SP0, NSD, 2, 'fat:mouth', sf, { x: 1300, fl: 6, hit: (i, f) => {
    STUCK.push({ who: 'skel', f0: f, f1: 0, dx: ((i * 37) % 60) - 30, dy: ((i * 23) % 50) - 25, rot: i * 1.3 });
    if (i % 2 === 0) sfx('pop', f, { who: 'skel', gain: 0.5 });
  } });
  for (let i = 0; i < NSD; i += 2) { key('fat', SP0 + i * 2, { sx: 1.16, sy: 1.26 }, 1); key('fat', SP0 + i * 2 + 2, { sx: 1.26, sy: 1.14 }, 2); }
  key('fat', SP0 + NSD * 2 + 2, { sx: 1, sy: 1, mouthK: 1, mouth: 'happy', eyes: 'normal' }, 5);
  // Скелет в семечках — дрожит — кувырком
  const HIT0 = SP0 + 6, ROLL = SP0 + NSD * 2 + 6;
  tremble('skel', HIT0, ROLL, SS, 5);
  sfx('scared', HIT0 + 2, { who: 'skel', gain: 0.8 });
  tumble('skel', ROLL, ROLL + 12, SS, 1580, 100, 1, { stars: 14 });
  sfx('ref:laugh', ROLL + 2, { who: 'fat', gain: 0.85, pitch: 0.75 });
  laugh('fat', ROLL + 4, ROLL + 24);
  key('baby', ROLL + 2, { mouth: ' 1', eyes: 'normal' }, 0);
  sfx('ref:laugh', ROLL + 6, { who: 'baby', gain: 0.6, pitch: 1.3 });
  laugh('baby', ROLL + 6, ROLL + 26);

  // ---- 3.9–5.1 с: Скелет «растёт»
  const SX = 1580;
  key('skel', ROLL + 10, { eyes: 'angry', mouth: 'angry theeth' }, 0);
  const SB = transform('skel', ROLL + 12, 1580, SX, -1, { style: 'grow' });
  for (const s of STUCK) if (s.who === 'skel' && !s.f1) s.f1 = SB;
  key('skel', SB, stance('skel', SX, -1), 0);
  key('skel', SB + 6, { mouth: 'angry theeth', eyes: 'angry' }, 0);
  key('fat', SB - 2, { mouth: 'puzzlement', eyes: 'sad' }, 0);
  key('baby', SB - 2, { mouth: ' 5', eyes: 'sad' }, 0);

  // ---- 5.2–7.6 с: арбуз со стопки — в Толстого — корка шлемом — Толстый вслепую толкает Малыша
  const PK = SB + 6;
  turn('skel', PK - 8, 1, SX);
  key('skel', PK - 4, { lean: 18, hip: [0, toRig('skel', 60)], head: 6 }, 5);
  key('skel', PK, { hitF: 1, hitFto: [STK - 30, GROUND - 200], hitFfix: PK }, 4);
  M_T.segs.push({ f0: PK, hand: 'skel', arm: 'F' });
  sfx('pop', PK, { who: 'skel', gain: 0.5 });
  turn('skel', PK + 6, -1, SX);
  key('skel', PK + 8, { ...stance('skel', SX, -1), hitF: 0, handF: hand('skel', 'F', 0.6, -0.2), handB: hand('skel', 'B', -0.4, 0.3), mouth: 'happy with theeth', eyes: 'angry' }, 6);
  const TH = PK + 14, HITF = TH + 14;
  key('skel', TH - 3, { handF: hand('skel', 'F', -0.3, -0.4), lean: -8 }, 3);
  key('skel', TH, { handF: hand('skel', 'F', 0.9, -0.3), lean: 14 }, 3, 'in2');
  sfx('swing', TH - 2, { who: 'skel', gain: 0.9 });
  M_T.segs.push({ f0: TH, f1: HITF, a: (f, S) => { const h = C.skel.big.point(S.skel.st, 'handF'); return [h[0], h[1] - 60]; }, b: (f, S) => { const t = target('fat:top', S); return [t[0], t[1] + 30]; }, arc: 140, spin: -Math.PI * 3 });
  M_T.segs.push({ f0: HITF, gone: true });
  key('skel', TH + 10, { ...stance('skel', SX, -1), mouth: 'happy with theeth', eyes: 'normal' }, 8);
  splash(HITF, (f, S) => { const t = target('fat:top', S); return [t[0], t[1] + 40]; }, 1, 3);
  sfx('bonk', HITF, { who: 'fat', gain: 0.9 });
  HELM.push({ who: 'fat', f0: HITF, f1: 0, w: 330, dy: 150 });
  key('fat', HITF, { sx: 1.25, sy: 0.8, mouth: 'puzzlement', eyes: 'sad' }, 1); key('fat', HITF + 5, { sx: 1, sy: 1 }, 4);
  sfx('ref:laugh', HITF + 4, { who: 'skel', gain: 0.85, pitch: 0.9 });
  chuckle('skel', HITF + 4, HITF + 28, { mouth: 'happy with theeth' });
  flap(HITF + 6, HITF + 24, 0.5);
  // вслепую: шатается влево — толкает Малыша
  const BL0 = HITF + 6, BUMP = BL0 + 14, FX2 = 880;
  key('fat', BL0, { pivot: ST.CAST.fat.pivot }, 0);
  for (let f = BL0; f < BUMP; f += 6) { key('fat', f + 3, { rot: -12 }, 3); key('fat', f + 6, { rot: 12 }, 3); sfx('step', f + 3, { who: 'fat', gain: 0.4 }); }
  move('fat', BL0, { x: FX1, y: GROUND });
  move('fat', BUMP, { x: FX2 }, 'io');
  sfx('scared', BL0 + 2, { who: 'fat', gain: 0.7 });
  key('fat', BUMP, { rot: 0 }, 3);
  sfx('boing', BUMP, { who: 'baby', gain: 0.8 });
  key('baby', BUMP - 4, { mouth: ' 5', eyes: 'sad' }, 0);
  tumble('baby', BUMP, BUMP + 14, BS, 450, 160, -1, { stars: 14 });

  // ---- 8.3–9.5 с: Малыш «растёт»; Толстый стряхивает корку
  const BX = 480;
  key('baby', BUMP + 14, { eyes: 'angry', mouth: ' 2' }, 0);
  const BB = transform('baby', BUMP + 14, 450, BX, 1, { style: 'grow' });
  key('baby', BB, stance('baby', BX, 1), 0);
  key('baby', BB + 6, { mouth: 'happy with theeth', eyes: 'angry' }, 0);
  key('skel', BB - 2, { mouth: 'puzzlement', eyes: 'sad' }, 0);
  const SH = BUMP + 10, HX = 1260;
  for (let f = SH; f < SH + 12; f += 3) key('fat', f + 2, { rot: ((f - SH) / 3) % 2 ? -16 : 16 }, 2);
  key('fat', SH + 12, { rot: 0 }, 2);
  HELM[0].f1 = SH + 12;
  HELM.push({ f0: SH + 12, f1: SH + 28, a: (f, S) => { const t = target('fat:top', S); return [t[0], t[1] + 150]; }, b: [HX, GROUND], arc: 240, w: 330, spin: Math.PI * 2 });
  HELM.push({ f0: SH + 28, f1: SH + 60, at: [HX, GROUND], w: 330 });
  sfx('pop', SH + 12, { who: 'fat', gain: 0.7 });
  sfx('land', SH + 28, { x: HX, gain: 0.6 });
  key('fat', SH + 12, { mouth: 'happy', eyes: 'normal' }, 0);

  // ---- 9.6–12.4 с: топает — арбуз подскакивает на голову Скелету — вслепую — спотыкается о Толстого
  const STP = stomp('baby', BB + 4, BX, BX, 1);
  key('baby', STP + 2, { mouth: 'happy with theeth' }, 0);
  for (const [w, x] of [['fat', FX2], ['yel', YS]]) {
    move(w, STP, { x, y: GROUND }); move(w, STP + 6, { y: GROUND - 90 }, 'out2'); move(w, STP + 12, { y: GROUND }, 'in2');
    key(w, STP + 12, { sx: 1.2, sy: 0.82 }, 1); key(w, STP + 16, { sx: 1, sy: 1 }, 3);
  }
  key('yel', STP, { mouth: 'puzzlement', eyes: 'sad' }, 0);
  const MUP = STP + 1, MON = MUP + 16;
  M_B.segs.push({ f0: MUP, f1: MON, a: [STK, GROUND - 70], b: (f, S) => { const t = target('skel:head', S); return [t[0], t[1] - 40]; }, arc: 240, spin: Math.PI * 2 });
  M_B.segs.push({ f0: MON, gone: true });
  sfx('boing', MUP, { x: STK, gain: 0.7 });
  sfx('whoosh', MUP + 2, { x: STK, dur: 12, gain: 0.5 });
  splash(MON, (f, S) => target('skel:head', S), 1, 5);
  HELM.push({ who: 'skel', f0: MON, f1: 0, w: 250, dy: 'head', hdy: 28 });
  key('skel', MON, { mouth: 'puzzlement', eyes: 'sad', hip: [0, toRig('skel', 30)], head: 6, handF: hand('skel', 'F', 0.5, -0.6), handB: hand('skel', 'B', -0.3, 0.4) }, 2);
  sfx('ref:hit-ow', MON + 2, { who: 'skel', gain: 0.7 });
  sfx('ref:laugh', MON + 2, { who: 'baby', gain: 0.85, pitch: 1.3 });
  chuckle('baby', MON + 2, MON + 40, { mouth: 'happy with theeth' });
  // идёт вслепую, руки вперёд — спотыкается о Толстого и падает на него — «пуф»
  const W0 = MON + 6, NW = 3, WN = 7, X3 = 1190;
  key('skel', W0, { ...stance('skel', SX, -1), handF: hand('skel', 'F', 0.95, -0.15), handB: hand('skel', 'B', 0.85, -0.05), lean: 6, mouth: 'puzzlement' }, 4);
  walk('skel', W0, SX, X3, NW, WN, -1, false);
  sfx('scared', W0, { who: 'skel', gain: 0.6 });
  key('fat', W0 + 10, { mouth: 'puzzlement', eyes: 'sad' }, 0);
  const TRIP = W0 + NW * WN + 1;
  const LIE = fallBack('skel', TRIP, X3, -1, { forward: true, n: 12, stars: false, mouth: 'puzzlement' });
  key('fat', LIE, { sx: 1.5, sy: 0.62 }, 1);
  sfx('squish', LIE, { who: 'fat', gain: 0.9 });
  HELM[HELM.length - 1].f1 = LIE;
  HELM.push({ f0: LIE, f1: LIE + 14, a: (f, S) => target('skel:head', S), b: [1400, GROUND], arc: 160, w: 250, spin: Math.PI * 2 });
  HELM.push({ f0: LIE + 14, f1: LIE + 50, at: [1400, GROUND], w: 250 });
  const ssm = shrink('skel', LIE + 4, X3 + 60, -1, { mouth: 'puzzlement', eyes: 'sad', smoke: 420 });
  key('skel', ssm, { lean: 0, head: 0, hip: [0, 0], legF: null, legB: null, zB: null }, 0);
  move('skel', ssm, { x: X3 + 60, y: GROUND - 330, rot: 0 });
  move('skel', ssm + 10, { x: 1330, y: GROUND }, 'in2');
  key('skel', ssm + 10, { sx: 1.2, sy: 0.82 }, 1); key('skel', ssm + 14, { sx: 1, sy: 1 }, 3);
  ev('stars', { who: 'skel', f0: ssm + 12, f1: ssm + 34, snd: false });
  key('fat', ssm + 6, { sx: 1, sy: 1 }, 6, 'out');
  sfx('boing', ssm + 6, { who: 'fat', gain: 0.6 });

  // ---- 12.6–13.8 с: Жёлтая «растёт» — все влюблены
  const YX = 180;
  key('yel', LIE + 2, { eyes: 'angry', mouth: 'angry theeth' }, 0);
  ev('vein', { who: 'yel', f0: LIE + 2, f1: LIE + 12 });
  const YB = transform('yel', LIE + 4, YS, YX, 1, { style: 'grow', love: ['baby', 'fat', 'skel'], loveDur: 44 });
  key('yel', YB, stance('yel', YX, 1), 0);
  key('yel', YB + 6, { mouth: 'theeth smile', eyes: 'angry' }, 0);
  turn('baby', YB - 6, -1, BX);

  // ---- 14–15.8 с: пинок арбузом вверх — падает Малышу на голову — «пуф»; долька ей в руку — съедает
  const KK = YB + 10, HITB = KK + 20;
  kick('yel', KK, [ML + 10, GROUND - 70], { x: YX, face: 1, hard: false });
  const bt = (f, S) => { const t = target('baby:top', S); return [t[0], t[1] + 60]; };
  M_L.segs.push({ f0: KK, f1: HITB, a: [ML, GROUND - 75], b: bt, arc: 300, spin: Math.PI * 4 });
  M_L.segs.push({ f0: HITB, gone: true });
  sfx('whoosh', KK + 1, { x: 400, dur: 16, gain: 0.6 });
  key('baby', HITB - 8, { mouth: 'puzzlement', eyes: 'sad', head: -10 }, 3);
  splash(HITB, bt, 1.2, 7);
  sfx('bonk', HITB, { who: 'baby', gain: 1.0 });
  key('baby', HITB, { hip: [0, toRig('baby', 60)], head: 8, handF: hand('baby', 'F', 0.4, -0.7), handB: hand('baby', 'B', -0.4, -0.6) }, 2);
  tremble('baby', HITB + 2, HITB + 8, BX, 6);
  const bsm = shrink('baby', HITB + 8, BX, -1, { mouth: ' 5', eyes: 'sad', smoke: 420 });
  ev('stars', { who: 'baby', f0: bsm + 6, f1: bsm + 26, snd: false });
  // долька
  const SL0 = HITB + 2, SL1 = SL0 + 12, BITE = SL1 + 6;
  SLICE.push({ f0: SL0, f1: SL1, a: bt, b: (f, S) => C.yel.big.point(S.yel.st, 'handF'), arc: 160, spin: Math.PI * 4 });
  SLICE.push({ f0: SL1, hand: 'yel' });
  key('yel', SL1 - 4, { handF: hand('yel', 'F', 0.75, -0.55), mouth: 'happy with theeth', eyes: 'normal' }, 4);
  key('yel', BITE - 4, { handF: hand('yel', 'F', 0.45, -0.75), head: 6 }, 4);
  sfx('chomp', BITE, { who: 'yel', gain: 1.0 });
  key('yel', BITE, { mouth: 'happy with theeth', sx: 1.04, sy: 0.96 }, 1); key('yel', BITE + 4, { sx: 1, sy: 1 }, 3);
  SLICE.push({ f0: BITE, gone: true });
  sfx('gulp', BITE + 4, { who: 'yel', gain: 0.8 });

  // ---- 16–18 с: очередь семечек — все удирают за правый край
  const V0 = BITE + 8;
  key('yel', V0 - 2, { ...stance('yel', YX, 1), mouth: 'happy open mouth', eyes: 'angry', head: -4 }, 4);
  const tg = (who) => (i) => (f, S) => { const p = target(`${who}:body`, S); return [p[0] + ((i * 41) % 70) - 35, p[1] + ((i * 29) % 60) - 30]; };
  const RUNS = [['skel', 0, 1330], ['fat', 6, FX2], ['baby', 12, BX]];
  for (const [w, d, x] of RUNS) {
    volley(V0 + d, 4, 2, 'yel:lips', tg(w), { x, fl: 7, hit: (i, f) => { if (i % 2) sfx('pop', f, { who: w, gain: 0.5 }); } });
    const R0 = V0 + d + 9;
    key(w, R0 - 2, { mouth: w === 'baby' ? ' 5' : 'puzzlement', eyes: 'sad', face: 1 }, 0);
    sfx('scared', R0, { who: w, gain: 0.7 });
    if (w === 'baby') propeller('baby', R0, R0 + 40, 10);
    // удирает прыжками за правый край
    let px = x;
    for (let k = 0; px < 2150; k++) {
      const f = R0 + k * 8, nx = px + 360;
      const hy = w === 'baby' ? 380 : 130;
      move(w, f, { x: px, y: GROUND }); move(w, f + 4, { y: GROUND - hy }, 'out2'); move(w, f + 8, { y: GROUND }, 'in2'); move(w, f + 8, { x: nx }, 'lin');
      key(w, f + 8, { sx: 1.15, sy: 0.87 }, 1); key(w, f + 11, { sx: 1, sy: 1 }, 3);
      sfx('jump', f + 1, { who: w, gain: 0.35 });
      px = nx;
    }
  }
  sfx('ref:laugh', V0 + 30, { who: 'yel', gain: 0.85, pitch: 1.45 });
  chuckle('yel', V0 + 26, V0 + 38, { mouth: 'happy with theeth' });

  // ---- 18.5–25 с: в центр, руки вверх
  const WIN = victory('yel', V0 + 38, YX, { n: 9, stride: 120 });
  window.T = { EAT1, SP0, ROLL, SB, TH, HITF, BUMP, BB, STP, MON, TRIP, LIE, YB, KK, HITB, BITE, V0, WIN };
};

// ------------------------------------------------------------------ рисование
ST.hooks.beforeChars.push((ctx, f, S, CAM) => {
  ctx.setTransform(...CAM);
  for (const M of MELONS) { const cur = M.segs.filter((c) => f >= c.f0).pop(); if (cur && cur.at) FX.melonBlock(ctx, cur.at[0], cur.at[1] + M.s / 2, M.s); }
  for (const h of HELM) if (h.at && f >= h.f0 && f < h.f1) FX.melonHelmet(ctx, h.at[0], h.at[1], h.w, 0, Math.min(1, (h.f1 - f) / 8));
});
ST.hooks.afterChars.push((ctx, f, S, CAM) => {
  ctx.setTransform(...CAM);
  for (const s of STUCK) {
    if (f < s.f0 || (s.f1 && f >= s.f1)) continue;
    const p = target(`${s.who}:face`, S), fc = S[s.who].p.face || 1;
    FX.melonSeed(ctx, p[0] + s.dx * fc, p[1] + s.dy, s.rot, 22);
  }
  for (const h of HELM) {
    if (f < h.f0 || (h.f1 && f >= h.f1) || h.at) continue;
    if (h.who) {
      const p = h.dy === 'head' ? target(`${h.who}:head`, S) : target(`${h.who}:top`, S);
      FX.melonHelmet(ctx, p[0], p[1] + (h.dy === 'head' ? h.hdy : h.dy), h.w, E.rad(S[h.who].p.rot || 0) * (h.dy === 'head' ? 0 : 1));
    } else {
      const u = E.clamp((f - h.f0) / (h.f1 - h.f0), 0, 1), a = P(h.a, h.f0, statesAt(h.f0)), b = P(h.b, f, S);
      FX.melonHelmet(ctx, E.lerp(a[0], b[0], u), E.lerp(a[1], b[1], u) - Math.sin(Math.PI * u) * h.arc, h.w, u * (h.spin || 0));
    }
  }
  for (const M of MELONS) {
    const cur = M.segs.filter((c) => f >= c.f0).pop();
    if (!cur || cur.at) continue;
    const m = melAt(M, f, S);
    if (m) FX.melonBlock(ctx, m.x, m.y + M.s * m.k / 2, M.s * m.k, m.rot);
  }
  for (const s of SEEDS) {
    const u = (f - s.f0) / (s.f1 - s.f0);
    if (u < 0 || u > 1) continue;
    const a = P(s.from, s.f0, statesAt(s.f0)), b = P(s.to, s.f1, statesAt(s.f1));
    const x = E.lerp(a[0], b[0], u), y = E.lerp(a[1], b[1], u) - Math.sin(Math.PI * u) * s.arc;
    FX.melonSeed(ctx, x, y, Math.atan2(b[0] - a[0], -(b[1] - a[1])), 28);
  }
  for (const s of SLICE) {
    if (f < s.f0 || s.gone) continue;
    const nx = SLICE[SLICE.indexOf(s) + 1];
    if (nx && f >= nx.f0) continue;
    if (s.hand) { if (S[s.hand].p.form === 'big') { const h = C[s.hand].big.point(S[s.hand].st, 'handF'); FX.melonSlice(ctx, h[0] + 10, h[1] + 10, 130, -0.3); } continue; }
    const u = E.clamp((f - s.f0) / (s.f1 - s.f0), 0, 1), a = P(s.a, s.f0, statesAt(s.f0)), b = P(s.b, f, S);
    FX.melonSlice(ctx, E.lerp(a[0], b[0], u), E.lerp(a[1], b[1], u) - Math.sin(Math.PI * u) * s.arc, 130, u * s.spin);
  }
  for (const s of SPL) { const at = P(s.at, s.f, statesAt(s.f)); FX.melonSplash(ctx, at[0], at[1], (f - s.f) / 20, s.seed, GROUND, s.size); }
});

ST.start(BIG);
