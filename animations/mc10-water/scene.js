// Ролик 10 (серия по образцу): Водомёт — Скелет против Толстого, 25 с, 24 кадра/с. Плотно, как у HugyTi:
// Толстый всасывает озеро и плюётся струёй, глотает Скелета; Скелет превращается дважды и затыкает ему рот.
// Музыка превращения — присланная, ~4 с с затиханием. Фон «майнкрафт», тема «озеро».
//
//   0–1.8 с   шарик-Скелет (слева) и Толстый (справа), за Толстым озеро
//   1.8–3 с   Толстый оборачивается, всасывает озеро и плюёт струёй — Скелета отбрасывает, он мокрый
//   3.5–4.7 с Скелет «растёт» под музыку
//   5–6 с     машет крыльями — Толстого катит кувырком назад
//   6–9 с     Толстый снова всасывает озеро и плюёт — взмах крыльев разворачивает струю ему же на голову,
//             он мокрый и чихает
//   10–14 с   Толстый раскрывает огромный рот и всасывает Скелета: тот упирается, сдувается в шарик и
//             залетает в рот — Толстый жуёт и выплёвывает его
//   15–16.3 с Скелет «растёт» снова под музыку
//   16.5–21 с Толстый опять всасывает — Скелет затыкает ему рот камнем; Толстого раздувает, камень
//             вылетает пробкой — Толстый, как сдутый шарик, со свистом улетает за кадр
//   21–25 с   Скелет в центре, руки и крылья вверх
'use strict';

const ST = Stage({
  name: 'mc10-water',
  cast: {
    skel: { small: ['skeleton-verity-small', { scale: 0.455 }], big: ['skeleton-verity-big', { height: 730 }], pivot: 325,
      voice: 0.9, lie: 60, color: '#f3f1e6', moods: { angry: 'angry theeth', grin: 'happy with theeth', big: 'theeth smile' } },
    fat: { small: ['fat-verity-small', { bodyHeight: 450 }], pivot: 508, voice: 0.75, moods: { love: 'happy' } },
  },
  order: ['skel', 'fat'],
  background: { theme: 'lakeside', seed: 101, lake: [1180, 700], sunX: 420, sunY: 150 },
  clouds: [[120, 80, 2.4, 0, 12], [700, 190, 1.8, 1, 16], [1240, 60, 2.6, 2, 10], [1650, 250, 1.6, 0, 18]],
});
const { FPS, NF, GROUND, C, key, move, ev, sfx, hop, tumble, laugh, tremble, transform, shrink, stance, walk, turn,
  victory, chuckle, hand, toRig, statesAt, stateAt, target } = ST;

ST.parts.mouth = (ch, st) => E.apply(ch.eyeMatrix(st, 'puzzlement'), [611, 456]);
const P = (v, f, S) => (typeof v === 'function' ? v(f, S) : typeof v === 'string' ? target(v, S) : v);

// крылья большого Скелета: взмахи (кости B16, B17)
function flap(f0, f1, gain = 0.6) {
  for (let f = f0; f < f1; f += 6) {
    key('skel', f, { b_B16: -30, b_B17: 30 }, 3);
    key('skel', f + 3, { b_B16: 46, b_B17: -46 }, 3, 'in');
  }
  key('skel', f1, { b_B16: 0, b_B17: 0 }, 4);
  sfx('gust', f0, { who: 'skel', dur: f1 - f0, gain });
}
// Толстый оборачивается (шарик — сплющиванием по x)
function fatTurn(f, face, s = 1) { key('fat', f, { sx: 0.3 }, 2); key('fat', f + 2, { face }, 0); key('fat', f + 4, { sx: s }, 2); }
// Толстый раскрывает рот: сначала форма рта, потом размер (иначе растягивается улыбка)
function fatOpen(f, k, n, extra = {}) { key('fat', f - n, { mouth: 'puzzlement' }, 0); key('fat', f, { mouthK: k, ...extra }, n, 'out'); }

// ------------------------------------------------------------------ струи, камень
const JETS = [];                    // {f0, f1, a, b, arc, w, grow}
const LAKE = [1660, GROUND - 14];
function jet(f0, f1, a, b, o = {}) { JETS.push({ f0, f1, a, b, arc: o.arc || 0, w: o.w || 34, grow: o.grow ?? 4, arcTo: o.arcTo, bTo: o.bTo, turn: o.turn }); }
const STONE = [];                   // {f0, at} | {f0, f1, a, b, arc, spin} | {f0, mouth} | {f0, gone}
const stoneAt = (f, S) => {
  let cur = null;
  for (const c of STONE) if (f >= c.f0) cur = c;
  if (!cur || cur.gone) return null;
  if (cur.at) return { x: cur.at[0], y: cur.at[1], rot: 0, ground: true };
  if (cur.hand) { const h = C.skel.big.point(S.skel.st, 'handB'); return { x: h[0], y: h[1] - 40, rot: 0, hand: true }; }
  if (cur.mouth) { const m = target('fat:mouth', S); return { x: m[0], y: m[1], rot: 0.2 }; }
  const u = E.clamp((f - cur.f0) / (cur.f1 - cur.f0), 0, 1), a = P(cur.a, cur.f0, statesAt(cur.f0)), b = P(cur.b, f, S);
  return { x: E.lerp(a[0], b[0], u), y: E.lerp(a[1], b[1], u) - Math.sin(Math.PI * u) * (cur.arc || 0), rot: (cur.spin || 0) * u };
};
const SUCKS = [];                   // всасывание: {f0, f1, x0} — пыль и трава летят в рот
const PFFT = [];                    // свист воздуха из Толстого: {f0, f1}

const SS = 560, FS = 1320;
// ================================================================== 0–1.8 с: стойка
key('skel', 0, { form: 'small', x: SS, y: GROUND, face: 1, look: 1, eyes: 'normal', mouth: 'smile normal', sx: 1, sy: 1, rot: 0, pivot: 0, alpha: 1 }, 0);
key('fat', 0, { form: 'small', x: FS, y: GROUND, face: -1, look: 1, eyes: 'normal', mouth: 'smile normal', sx: 1, sy: 1, rot: 0, pivot: 0, mouthK: 1 }, 0);

const BIG = () => {
  // ---- 1.8–3 с: всасывает озеро — плюёт в шарик-Скелета
  key('fat', 40, { mouth: 'theeth smile', eyes: 'angry' }, 0);
  sfx('ref:grin-eee', 40, { who: 'fat', gain: 0.5, pitch: 0.8 });
  fatTurn(44, 1);
  const SU = 48;
  fatOpen(SU, 2.6, 3);
  jet(SU + 2, SU + 12, LAKE, 'fat:mouth', { arc: 40, w: 30 });
  sfx('suck', SU + 2, { who: 'fat', dur: 10, gain: 0.8 });
  key('fat', SU + 12, { sx: 1.25, sy: 1.22, mouthK: 1, mouth: 'smile normal' }, 10, 'out');   // надулся водой
  sfx('gulp', SU + 12, { who: 'fat', gain: 0.8 });
  fatTurn(SU + 14, -1, 1.25);
  key('fat', SU + 18, { sx: 1.25, sy: 1.22 }, 0);
  const SP = SU + 20, HIT = SP + 4;
  fatOpen(SP, 2, 2);
  jet(SP, SP + 10, 'fat:mouth', 'skel:body', { w: 36, grow: 4 });
  key('fat', SP + 10, { sx: 1, sy: 1, mouthK: 1, mouth: 'happy' }, 6);
  sfx('splash', SP + 1, { who: 'fat', gain: 0.9 });
  sfx('whoosh', SP, { who: 'fat', dur: 8, gain: 0.5 });
  key('skel', HIT, { sx: 1.3, sy: 0.75, mouth: 'puzzlement', eyes: 'sad' }, 1);
  move('skel', HIT, { x: SS });
  move('skel', HIT + 10, { x: 400 }, 'out2');
  key('skel', HIT + 8, { sx: 1, sy: 1 }, 5);
  ev('wet', { who: 'skel', f0: HIT, f1: HIT + 40 });
  sfx('ref:grunt', HIT + 2, { who: 'skel', gain: 0.7, pitch: 1.3 });
  sfx('ref:laugh', HIT + 8, { who: 'fat', gain: 0.85, pitch: 0.75 });
  laugh('fat', HIT + 8, HIT + 24);

  // ---- 3.5–4.7 с: Скелет «растёт»
  const SX = 470;
  const SB = transform('skel', HIT + 14, 400, SX, 1, { style: 'grow' });
  key('skel', SB, stance('skel', SX, 1), 0);
  key('skel', SB + 6, { mouth: 'happy with theeth', eyes: 'angry' }, 0);
  key('fat', SB - 2, { mouth: 'puzzlement', eyes: 'sad' }, 0);
  ev('sweat', { who: 'fat', f0: SB, f1: SB + 22 });

  // ---- 5–6 с: взмах крыльев — Толстого катит назад
  const FL1 = SB + 4;
  flap(FL1, FL1 + 22, 0.9);
  ev('wind', { f0: FL1 + 2, f1: FL1 + 24, x0: SX + 260, x1: 1900, snd: false });
  const FX1 = 1490;
  tumble('fat', FL1 + 6, FL1 + 28, FS, FX1, 160, 2, { stars: 16 });
  key('fat', FL1 + 6, { mouth: 'puzzlement', eyes: 'sad' }, 0);
  key('skel', FL1 + 26, { mouth: 'happy with theeth', eyes: 'normal' }, 0);

  // ---- 6–9 с: снова озеро — струя разворачивается ему на голову
  const S2 = FL1 + 50;
  key('fat', S2 - 10, { mouth: 'theeth smile', eyes: 'angry' }, 0);
  ev('vein', { who: 'fat', f0: S2 - 10, f1: S2 + 4 });
  fatTurn(S2 - 4, 1);
  fatOpen(S2, 2.8, 3);
  jet(S2 + 2, S2 + 14, [LAKE[0] + 60, LAKE[1]], 'fat:mouth', { arc: 30, w: 32 });
  sfx('suck', S2 + 2, { who: 'fat', dur: 12, gain: 0.8 });
  key('fat', S2 + 14, { sx: 1.38, sy: 1.34, mouthK: 1, mouth: 'smile normal' }, 10, 'out');
  sfx('gulp', S2 + 14, { who: 'fat', gain: 0.8 });
  fatTurn(S2 + 16, -1, 1.38);
  key('fat', S2 + 20, { sx: 1.38, sy: 1.34 }, 0);
  const SP2 = S2 + 22;
  fatOpen(SP2, 2.2, 2);
  // струя летит к Скелету — он машет крыльями — струя гнётся назад, на самого Толстого
  JETS.push({ f0: SP2, f1: SP2 + 24, a: 'fat:mouth', b: 'skel:body', bTo: (f, S) => { const t = target('fat:top', S); return [t[0] + 30, t[1] - 10]; },
    turn: [SP2 + 6, SP2 + 14], arc: 0, arcTo: 300, w: 40, grow: 5 });
  sfx('splash', SP2 + 1, { who: 'fat', gain: 0.9 });
  flap(SP2 + 2, SP2 + 18, 0.9);
  key('skel', SP2 + 2, { lean: -6, mouth: 'happy open mouth' }, 4);
  ev('wind', { f0: SP2 + 4, f1: SP2 + 20, x0: SX + 260, x1: 1500, snd: false });
  const SOAK = SP2 + 14;
  key('fat', SOAK, { sx: 1.25, sy: 0.88, mouthK: 1, mouth: 'puzzlement', eyes: 'sad' }, 3);
  key('fat', SP2 + 26, { sx: 1, sy: 1 }, 8);
  ev('wet', { who: 'fat', f0: SOAK, f1: SOAK + 60 });
  sfx('splash', SOAK, { who: 'fat', gain: 1.0 });
  sfx('ref:hit-ow', SOAK + 2, { who: 'fat', gain: 0.7, pitch: 0.7 });
  key('skel', SOAK + 4, { mouth: 'happy with theeth', eyes: 'normal', lean: 0 }, 4);
  sfx('ref:laugh', SOAK + 6, { who: 'skel', gain: 0.85, pitch: 1.0 });
  chuckle('skel', SOAK + 6, SOAK + 30, { mouth: 'happy with theeth' });
  const ACH = SOAK + 22;
  sfx('sneeze', ACH, { who: 'fat', gain: 1.0, pitch: 0.8 });
  key('fat', ACH, { sx: 0.92, sy: 1.08, mouth: 'puzzlement' }, 10);
  key('fat', ACH + 15, { sx: 1.15, sy: 0.9 }, 2, 'in2');
  key('fat', ACH + 22, { sx: 1, sy: 1, mouth: 'theeth smile', eyes: 'angry' }, 6);
  ev('drool', { f: ACH + 15, at: 'fat:mouth', dir: -1, n: 16, snd: false });

  // ---- 10–14 с: всасывает Скелета — тот сдувается в шарик и залетает в рот
  const SK = ACH + 30, SX2 = 1030, ARR = SK + 46;
  fatOpen(SK, 3.6, 6, { sx: 1.05, sy: 0.97 });
  SUCKS.push({ f0: SK + 2, f1: ARR, x0: SX - 40 });
  sfx('suck', SK + 2, { who: 'fat', dur: ARR - SK, gain: 0.9 });
  key('skel', SK + 4, { mouth: 'puzzlement', eyes: 'sad', lean: -18, head: -10, hip: [toRig('skel', -20), toRig('skel', 50)],
    handF: hand('skel', 'F', -0.6, 0.2), handB: hand('skel', 'B', -0.7, 0.1) }, 5);
  flap(SK + 6, ARR - 6, 0.5);
  const K = C.skel.big;
  key('skel', SK + 6, { ...K.feet(SX, 1) }, 0);
  move('skel', SK + 6, { x: SX });
  move('skel', ARR - 8, { x: SX2 }, 'in2');
  key('skel', ARR - 8, { ...K.feet(SX2, 1) }, ARR - 14 - SK, 'in2');
  sfx('scared', SK + 10, { who: 'skel', gain: 0.8 });
  const SH = ARR - 8;
  const sm = shrink('skel', SH, SX2 + 60, 1, { mouth: 'puzzlement', eyes: 'sad', smoke: 300 });
  // шарик-Скелет кувырком влетает в рот
  const LIFT = sm + 6, IN = LIFT + 14, MO = target('fat:mouth', stateAt(IN));
  move('skel', LIFT, { x: SX2 + 60, y: GROUND, rot: 0 });
  key('skel', sm, { lean: 0, head: 0, hip: [0, 0], z: 1 }, 0);                         // впереди Толстого
  key('skel', LIFT, { pivot: 150 }, 0);
  move('skel', LIFT + 6, { x: (SX2 + 60 + MO[0]) / 2, y: GROUND - 260 }, 'out2');
  move('skel', IN, { x: MO[0] - 10, y: MO[1] + 120 }, 'in2');
  move('skel', IN, { rot: 400 }, 'lin');
  key('skel', IN, { sx: 0.55, sy: 0.55 }, 10);
  key('skel', IN + 1, { alpha: 0 }, 0);
  sfx('whoosh', LIFT, { who: 'skel', dur: 12, gain: 0.6 });
  sfx('scared', LIFT + 2, { who: 'skel', gain: 0.7, pitch: 1.3 });
  sfx('gulp', IN, { who: 'fat', gain: 1.0 });
  key('fat', IN, { mouthK: 1, mouth: 'smile normal', sx: 1.2, sy: 0.92 }, 3);
  for (let i = 0; i < 3; i++) {                                         // жуёт
    key('fat', IN + 4 + i * 6, { sx: 1.12, sy: 0.94, mouth: 'happy' }, 3);
    key('fat', IN + 7 + i * 6, { sx: 0.95, sy: 1.05, mouth: 'smile normal' }, 3);
    sfx('chomp', IN + 4 + i * 6, { who: 'fat', gain: 0.6 });
  }
  // выплёвывает
  const OUT = IN + 24, SX3 = 560;
  key('fat', OUT - 4, { sx: 1.1, sy: 0.95 }, 3);
  fatOpen(OUT, 2.2, 2, { sx: 0.92, sy: 1.08 });
  key('fat', OUT + 8, { mouthK: 1, sx: 1, sy: 1, mouth: 'happy' }, 5);
  sfx('spit', OUT, { who: 'fat', gain: 1.0 });
  key('skel', OUT, { alpha: 1, sx: 0.6, sy: 0.6, eyes: 'sad', mouth: 'puzzlement' }, 0);
  key('skel', OUT + 6, { sx: 1, sy: 1 }, 6);
  const MO2 = target('fat:mouth', stateAt(OUT));
  tumble('skel', OUT, OUT + 22, MO2[0] - 60, SX3, 200, -2, { stars: 26, hurt: true });
  move('skel', OUT, { y: MO2[1] + 140 });                                   // вылетает изо рта
  key('skel', OUT + 24, { z: 0 }, 0);
  ev('wet', { who: 'skel', f0: OUT + 2, f1: OUT + 30 });
  sfx('ref:laugh', OUT + 10, { who: 'fat', gain: 0.85, pitch: 0.75 });
  laugh('fat', OUT + 10, OUT + 30);

  // ---- 15–16.3 с: Скелет «растёт» снова
  const SX4 = 520;
  key('skel', OUT + 32, { eyes: 'angry', mouth: 'angry theeth' }, 0);
  ev('vein', { who: 'skel', f0: OUT + 32, f1: OUT + 44 });
  const SB2 = transform('skel', OUT + 36, SX3, SX4, 1, { style: 'grow' });
  key('skel', SB2, stance('skel', SX4, 1), 0);
  key('skel', SB2 + 6, { mouth: 'happy with theeth', eyes: 'angry' }, 0);
  key('fat', SB2, { mouth: 'puzzlement', eyes: 'sad' }, 0);

  // ---- 16.5–21 с: камень в рот — раздувает — пробкой вылетает — сдутый шарик улетает
  STONE.push({ f0: 0, at: [SX4 + 200, GROUND - 46] });
  const PK = SB2 + 14;
  key('skel', PK - 8, { lean: 26, hip: [0, toRig('skel', 120)], head: 10 }, 8);
  key('skel', PK, { hitB: 1, hitBto: [SX4 + 200, GROUND - 80], hitBfix: PK }, 6);
  STONE.push({ f0: PK, hand: true });
  sfx('pop', PK, { who: 'skel', gain: 0.4 });
  key('skel', PK + 12, { ...stance('skel', SX4, 1), hitB: 0, handB: hand('skel', 'B', 0.4, -0.3) }, 10);
  // Толстый снова раскрывает рот — тянет
  const SK2 = PK + 10;
  fatOpen(SK2, 3.4, 5, { eyes: 'angry' });
  SUCKS.push({ f0: SK2 + 2, f1: SK2 + 26, x0: SX4 - 40 });
  sfx('suck', SK2 + 2, { who: 'fat', dur: 24, gain: 0.8 });
  key('skel', SK2 + 4, { lean: -12, head: -6 }, 4);
  const TH = SK2 + 22, PLUG = TH + 12;
  key('skel', TH - 8, { handB: hand('skel', 'B', -0.55, -0.75), lean: -10 }, 7);
  key('skel', TH, { handB: hand('skel', 'B', 0.95, -0.35), lean: 14, mouth: 'happy with theeth' }, 4, 'in2');
  key('skel', TH + 14, stance('skel', SX4, 1, { mouth: 'happy with theeth' }), 10);
  sfx('swing', TH - 3, { who: 'skel', gain: 0.8 });
  STONE.push({ f0: TH, f1: PLUG, a: (f, S) => { const h = C.skel.big.point(S.skel.st, 'handB'); return [h[0], h[1] - 40]; }, b: 'fat:mouth', arc: 60, spin: Math.PI * 3 });
  STONE.push({ f0: PLUG, mouth: true });
  sfx('bonk', PLUG, { who: 'fat', gain: 0.9 });
  key('fat', PLUG, { mouthK: 1.6, eyes: 'sad' }, 2);
  // раздувается
  const BLOW = PLUG + 28;
  key('fat', PLUG + 4, { sx: 1, sy: 1 }, 0);
  key('fat', BLOW, { sx: 1.6, sy: 1.55 }, 24, 'in');
  tremble('fat', PLUG + 14, BLOW, FX1, 4);
  sfx('inflate', PLUG + 4, { who: 'fat', dur: 24, gain: 0.8 });
  ev('sweat', { who: 'fat', f0: PLUG + 6, f1: BLOW });
  key('skel', PLUG + 6, { mouth: 'happy with theeth', eyes: 'normal' }, 0);
  chuckle('skel', PLUG + 8, BLOW - 4, { mouth: 'happy with theeth' });
  // пробка вылетает — сдутый шарик носится и улетает
  STONE.push({ f0: BLOW, f1: BLOW + 20, a: 'fat:mouth', b: [1100, -200], arc: 120, spin: -Math.PI * 4 });
  sfx('pop', BLOW, { who: 'fat', gain: 1.0 });
  sfx('deflate', BLOW, { who: 'fat', dur: 40, gain: 1.0 });
  PFFT.push({ f0: BLOW, f1: BLOW + 40 });
  key('fat', BLOW, { mouth: 'puzzlement', mouthK: 1.8, pivot: 230, rot: 0 }, 0);
  const path = [[BLOW, FX1, GROUND], [BLOW + 8, 1580, GROUND - 400], [BLOW + 16, 1250, GROUND - 600], [BLOW + 24, 900, GROUND - 300],
    [BLOW + 32, 1300, GROUND - 450], [BLOW + 40, 2200, GROUND - 900]];
  for (const [f, x, y] of path) move('fat', f, { x, y }, 'io');
  move('fat', BLOW + 40, { rot: 1080 }, 'lin');
  key('fat', BLOW + 40, { sx: 1, sy: 1 }, 40);
  ev('twinkle', { f: BLOW + 38, at: [1810, 120], n: 22, size: 56 });
  key('skel', BLOW + 6, { mouth: 'happy open mouth', head: -10 }, 4);
  key('skel', BLOW + 16, { head: 0, mouth: 'happy with theeth' }, 6);
  sfx('ref:laugh', BLOW + 14, { who: 'skel', gain: 0.8, pitch: 1.0 });
  const WIN = victory('skel', BLOW + 20, SX4, { n: 8, stride: 110 });
  key('skel', WIN + 2, { b_B16: -40, b_B17: 40 }, 6);                               // крылья вверх
  window.T = { SB, SP2, SK, IN, OUT, SB2, PLUG, BLOW, WIN };
};

ST.hooks.beforeChars.push((ctx, f, S, CAM) => {     // камень на земле — позади персонажей
  const st = stoneAt(f, S);
  if (st && st.ground) { ctx.setTransform(...CAM); FX.cobble(ctx, st.x, st.y, 84, 0); }
});
ST.hooks.afterChars.push((ctx, f, S, CAM) => {
  ctx.setTransform(...CAM);
  for (const k of SUCKS) {
    if (f < k.f0 || f > k.f1) continue;
    const m = target('fat:mouth', S), fade = Math.min(1, (f - k.f0) / 6, (k.f1 - f) / 6);
    FX.suck(ctx, m[0], m[1], k.x0, GROUND, (f - k.f0) / FPS, fade, k.f0);
  }
  for (const j of JETS) {
    if (f < j.f0 || f > j.f1 + 4) continue;
    let a = P(j.a, f, S), b = P(j.b, f, S), arc = j.arc;
    if (j.turn) {
      const u = E.EASE.io(E.clamp((f - j.turn[0]) / (j.turn[1] - j.turn[0]), 0, 1)), b2 = P(j.bTo, f, S);
      b = [E.lerp(b[0], b2[0], u), E.lerp(b[1], b2[1], u)]; arc = E.lerp(j.arc, j.arcTo, u);
    }
    const grow = Math.min(1, (f - j.f0 + 1) / j.grow), fade = f > j.f1 ? 1 - (f - j.f1) / 4 : 1;
    FX.waterJet(ctx, a, b, f / FPS, j.w, grow, arc, fade);
  }
  const st = stoneAt(f, S);
  if (st && !st.ground) {
    FX.cobble(ctx, st.x, st.y, 84, st.rot);
    if (st.hand) { const { ch, st: ss, p } = S.skel; ch.draw(ctx, { ...ss, p: { ...p, only: 'B' } }, CAM); ctx.setTransform(...CAM); }
  }
  for (const q of PFFT) {                          // воздух со свистом из рта
    if (f < q.f0 || f > q.f1) continue;
    const m = target('fat:mouth', S);
    for (let i = 0; i < 4; i++) {
      const u = ((f - q.f0) / 6 + i / 4) % 1;
      FX.puff(ctx, m[0] + Math.cos(f * 0.7 + i) * 60 * u, m[1] + 60 * u, 16 + 24 * u, 0.7 * (1 - u), '#eef6ff', '#8aa4c0');
    }
  }
});

ST.start(BIG);
