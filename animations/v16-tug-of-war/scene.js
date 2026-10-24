// Ролик 16: Канат — Розовая против Радужного, 25 с, 24 кадра/с, звуковые эффекты без музыки,
// по стилю «animal hospital long» (docs/animal_hospital_long.md).
//
//   0–4 с     шарик-Розовая (слева) и радужный шарик (справа) смотрят друг на друга;
//             между ними грязевая лужа
//   4–5 с     Радужный сразу становится большим, бросает ей конец каната
//   6–8.5 с   шарик хватает канат зубами — перетягивание, её тащит, рывок — шлёп в грязь
//   9–12.5 с  вылезает грязная, злится и становится большой — Радужный влюбляется
//   13–14.5 с она поднимает канат и дёргает — он падает лицом в грязь
//   16.5–18.5 с встаёт грязный и злой — честное перетягивание, оба упираются
//   18.5–19.5 с она отпускает канат — его отбрасывает назад за кадр, блеск
//   20–25 с   Розовая в центре, руки вверх
'use strict';

const ST = Stage({
  name: 'v16-tug-of-war',
  cast: {
    girl: { small: ['girl-verity-small', { bodyHeight: 300 }], big: ['girl-verity-big', { height: 730, splitFeet: true }],
      pivot: 337, voice: 1.35, vAngle: 50, moods: { angry: 'sad', grin: 'theeth smile', big: 'smile normal' } },
    rb: { small: ['skeleton-verity-small-v1', { scale: 0.455, recolor: 'rainbow' }], big: ['all-verity-color', { height: 730 }],
      pivot: 325, voice: 0.85, lie: 70, moods: { big: 'theeth smile' } },
  },
  order: ['rb', 'girl'],
  background: { sky: ['#4da3ef', '#acd0f4', '#f1e4cf'], seed: 207 },
  clouds: [[140, 90, 1.1, 2, 26], [580, 210, 0.8, 0, 20], [1010, 70, 1.0, 1, 30], [1420, 180, 0.9, 2, 23],
    [1800, 90, 1.1, 0, 19], [360, 300, 0.7, 1, 28]],
});
const { GROUND, C, key, move, ev, sfx, hop, tumble, laugh, tremble, transform, love, stance, walk, turn,
  strike, kick, dodge, duck, recoil, fallBack, getUp, flyOff, victory, chuckle, hand, toRig, statesAt, stateAt, target } = ST;

const PIT = 1120, PW = 330;
ST.parts.mouth = (ch, st) => E.apply(ch.eyeMatrix(st, 'angry theeth'), [386, 600]);
// грязь на персонажах и брызги
const MUD = [], SPLASH = [];
const muddy = (who, f0, f1, spots) => MUD.push({ who, f0, f1, spots });
const splash = (f, x, size = 1) => { SPLASH.push({ f, x, size }); sfx('splash', f, { x }); };

// ================================================================== 0–4 с: стойка
key('girl', 0, { form: 'small', x: 560, y: GROUND, face: 1, look: 1, eyes: 'angry', mouth: 'smile normal', sx: 1, sy: 1, rot: 0 }, 0);
key('rb', 0, { form: 'small', x: 1440, y: GROUND, face: -1, look: 1, eyes: 'angry', mouth: 'theeth smile', sx: 1, sy: 1, rot: 0 }, 0);

// ================================================================== 4–5 с: Радужный большой
const RX = 1480;
const RB = transform('rb', 96, 1440, RX, -1, { fast: true });
key('girl', RB, { mouth: 'puzzlement', eyes: 'sad' }, 0);
key('girl', 140, { mouth: 'angry theeth', eyes: 'angry' }, 0);

// ================================================================== шарик хватает канат зубами — её тащит — в грязь
const BITE = 164, T0 = 168, YANK = 198, INMUD = 214, OUT0 = 236, OUT1 = 250;
hop('girl', 148, 160, 560, 660, 60);
sfx('chomp', BITE, { who: 'girl' });
key('girl', T0, { sx: 1.12, sy: 0.9 }, 4);
move('girl', T0, { x: 660, y: GROUND });
for (let f = T0 + 2; f < YANK; f += 2) move('girl', f, { x: E.lerp(660, 820, (f - T0) / (YANK - T0)) + (f % 4 ? 3 : -3) }, 'lin');
ev('sweat', { who: 'girl', f0: T0 + 4, f1: YANK, snd: false });
sfx('creak', T0, { x: 1100, dur: YANK - T0, gain: 0.6 });
// рывок: летит в лужу
key('girl', YANK, { pivot: 337, rot: 0, sx: 0.85, sy: 1.15, eyes: 'sad', mouth: 'puzzlement' }, 2);
move('girl', YANK + 1, { x: 820, y: GROUND });
move('girl', INMUD, { x: PIT, y: GROUND + 14, rot: 360 }, 'in2');
move('girl', INMUD - 6, { y: GROUND - 180 }, 'out2');
key('girl', INMUD + 1, { rot: 0, sx: 1.3, sy: 0.72 }, 1);
key('girl', INMUD + 8, { sx: 1, sy: 1 }, 6);
sfx('whoosh', YANK, { who: 'girl', dur: INMUD - YANK, gain: 0.6 });
sfx('scared', YANK + 2, { who: 'girl', gain: 0.7 });
splash(INMUD, PIT, 1);
ev('shake', { f: INMUD, amp: 12, n: 10 });
muddy('girl', INMUD, 300, [['body', -40, 40, 150], ['body', 50, -60, 110], ['body', 10, 100, 170]]);
key('girl', INMUD + 10, { mouth: 'sad', eyes: 'sad' }, 0);
// вылезает
hop('girl', OUT0, OUT1, PIT, 760, 80);
key('girl', OUT1 + 8, { eyes: 'angry', mouth: 'angry theeth' }, 0);
// ================================================================== злится и становится большой
const GX = 680;
const GB = transform('girl', 256, 760, GX, 1, { love: 'rb', loveDur: 70 });

// канат: концы — точки на персонажах или на земле
const ROPE = [];          // [{f0, a, b, sag}] — с кадра f0
const ropeEnd = (e, f, S) => (typeof e === 'function' ? e(f, S) : typeof e === 'string' ? target(e, S) : e);

const BIG = () => {
  const R = C.rb.big, G = C.girl.big;
  key('rb', RB, stance('rb', RX, -1), 0);
  key('rb', RB + 6, { mouth: 'theeth smile' }, 0);
  // ---- бросает конец каната
  const TH = 132, LANDR = 148, END0 = [700, GROUND - 6];
  key('rb', TH - 6, { handF: hand('rb', 'F', -0.3, 0.3), handB: hand('rb', 'B', 0.4, 0.2) }, 6);
  key('rb', TH, { handF: hand('rb', 'F', 0.9, -0.4) }, 4, 'out');
  key('rb', TH + 10, { handF: hand('rb', 'F', 0.6, 0.15), handB: hand('rb', 'B', 0.5, 0.25) }, 6);
  sfx('swing', TH - 4, { who: 'rb' });
  const h0 = R.point(stateAt(TH).rb.st, 'handF');
  ROPE.push({ f0: TH, a: 'rb:handF', b: (f) => { const u = E.clamp((f - TH) / (LANDR - TH), 0, 1);
    return [E.lerp(h0[0], END0[0], u), E.lerp(h0[1], END0[1], u) - Math.sin(Math.PI * u) * 160]; }, sag: 40 });
  ROPE.push({ f0: LANDR, a: 'rb:handF', b: END0, sag: 'ground' });
  // ---- тянет: корпус назад, руки к груди
  ROPE.push({ f0: BITE, a: 'rb:handF', b: 'girl:mouth', sag: 30 });
  ROPE.push({ f0: T0, a: 'rb:handF', b: 'girl:mouth', sag: 0 });
  key('rb', T0, { lean: -16, hip: [toRig('rb', 20), toRig('rb', 30)], handF: hand('rb', 'F', 0.45, 0.2), handB: hand('rb', 'B', 0.35, 0.25),
    mouth: 'theeth smile' }, 4);
  key('rb', YANK - 4, { lean: -8 }, 4);
  key('rb', YANK, { lean: -24, handF: hand('rb', 'F', 0.1, 0.3), handB: hand('rb', 'B', 0, 0.35) }, 2, 'out');   // рывок
  sfx('swing', YANK - 2, { who: 'rb', gain: 0.6 });
  const END1 = [880, GROUND - 6];
  ROPE.push({ f0: YANK + 2, a: 'rb:handF', b: (f) => { const u = E.clamp((f - YANK - 2) / 10, 0, 1);
    const m = ST.target('girl:mouth', statesAt(YANK + 2)); return [E.lerp(m[0], END1[0], u), E.lerp(m[1], END1[1], u * u)]; }, sag: 20 });
  ROPE.push({ f0: YANK + 12, a: 'rb:handF', b: END1, sag: 'ground' });
  key('rb', YANK + 10, { ...stance('rb', RX, -1), handF: hand('rb', 'F', 0.6, 0.15) }, 8);
  chuckle('rb', INMUD + 2, INMUD + 36, { mouth: 'happy with theeth' });

  // ---- Розовая большая, он влюблён; она поднимает канат
  key('girl', GB, stance('girl', GX, 1), 0);
  key('girl', GB + 10, { mouth: 'theeth smile', eyes: 'angry' }, 0);
  const PICK = GB + 34;
  key('girl', PICK - 8, { lean: 30, hip: [0, toRig('girl', 120)], head: 10 }, 8);
  key('girl', PICK, { hitF: 1, hitFto: END1, hitFfix: PICK }, 4);
  key('girl', PICK + 10, { ...stance('girl', GX, 1), hitF: 0, handF: hand('girl', 'F', 0.6, 0.15), mouth: 'theeth smile' }, 8);
  ROPE.push({ f0: PICK, a: 'rb:handF', b: 'girl:handF', sag: 70 });
  // ---- рывок: он падает лицом в грязь
  const Y2 = PICK + 24;
  key('girl', Y2 - 6, { handF: hand('girl', 'F', 0.8, 0.05), lean: 6 }, 5);
  key('girl', Y2, { handF: hand('girl', 'F', 0.15, 0.3), lean: -14 }, 3, 'out');
  sfx('swing', Y2 - 3, { who: 'girl' });
  ROPE.push({ f0: Y2 - 4, a: 'rb:handF', b: 'girl:handF', sag: 0 });
  key('rb', Y2 + 1, { mouth: 'puzzlement', eyes: 'sad', handF: hand('rb', 'F', 0.95, -0.2), handB: hand('rb', 'B', 0.8, -0.1) }, 2);
  const down = fallBack('rb', Y2 + 2, RX, -1, { forward: true, stars: false, n: 12, lift: 70 });
  key('rb', Y2 + 2, { handF: hand('rb', 'F', 0.1, -0.95), handB: hand('rb', 'B', 0, -0.95) }, 3);
  splash(down, PIT, 1.3);
  ev('shake', { f: down, amp: 18, n: 12 });
  muddy('rb', down, 600, [['head', 0, 10, 170], ['body', 20, 0, 160], ['body', -40, 120, 130]]);
  ROPE.push({ f0: down, a: 'rb:handF', b: 'girl:handF', sag: 'ground' });
  chuckle('girl', down + 4, down + 34, { mouth: 'happy with theeth' });
  // ---- встаёт грязный и злой — честное перетягивание
  const up = getUp('rb', down + 30, RX, -1, { forward: true, n: 14, mouth: 'angry theeth' });
  ev('vein', { who: 'rb', f0: up, f1: up + 20 });
  ev('steam', { who: 'rb', f0: up + 2, f1: up + 20 });
  sfx('anger', up, { who: 'rb', dur: 20, gain: 0.7 });
  const TW0 = up + 14, TW1 = TW0 + 40;
  for (const [who, x, face] of [['girl', GX, 1], ['rb', RX, -1]]) {
    key(who, TW0, { ...stance(who, x, face), lean: -20, hip: [toRig(who, 25), toRig(who, 40)], head: -6,
      handF: hand(who, 'F', 0.5, 0.15), handB: hand(who, 'B', 0.4, 0.2), mouth: 'angry theeth', eyes: 'angry' }, 6);
    ev('sweat', { who, f0: TW0 + 4, f1: TW1, snd: false });
  }
  ROPE.push({ f0: TW0 - 2, a: 'rb:handF', b: 'girl:handF', sag: 0 });
  for (let f = TW0 + 4; f < TW1; f += 6) {                                        // туда-сюда
    const d = (f / 6) % 2 ? 14 : -14;
    move('girl', f, { x: GX + d }, 'io');
    move('rb', f, { x: RX + d }, 'io');
  }
  sfx('creak', TW0, { x: PIT, dur: TW1 - TW0, gain: 0.7 });
  // ---- она хитро отпускает — его отбрасывает назад за кадр
  const LET = TW1 + 2;
  key('girl', LET - 4, { mouth: 'theeth smile' }, 0);
  key('girl', LET, { handF: hand('girl', 'F', 0.6, -0.5), handB: hand('girl', 'B', -0.3, 0.6), lean: -4 }, 2);
  const hL = G.point(stateAt(LET).girl.st, 'handF');
  ROPE.push({ f0: LET, a: 'rb:handF', b: (f, S) => { const a = ST.target('rb:handF', S), u = E.clamp((f - LET) / 8, 0, 1);
    return [E.lerp(hL[0], a[0] - 120, u), E.lerp(hL[1], a[1] + 60, u)]; }, sag: 10 });
  flyOff('rb', LET + 1, LET + 26, [RX, GROUND], [2300, -260], { turns: 3 });
  ROPE.push({ f0: LET + 26, a: null });
  key('girl', LET + 8, { ...stance('girl', GX, 1), lean: 0, mouth: 'happy with theeth', eyes: 'normal' }, 6);
  victory('girl', LET + 16, GX);
};

ST.hooks.beforeChars.push((ctx, f) => FX.mudPit(ctx, PIT, GROUND + 6, PW, f / 24));
ST.hooks.afterChars.push((ctx, f, S, CAM) => {
  ctx.setTransform(...CAM);
  // грязь на персонажах
  for (const m of MUD) {
    if (f < m.f0 || f > m.f1) continue;
    const { ch, st, p } = S[m.who];
    if (m.who === 'girl' && p.form === 'big') continue;               // превратилась — чистая
    const k = Math.min(1, (f - m.f0 + 1) / 3);
    m.spots.forEach(([part, dx, dy, sz], i) => {
      const c = ch.point(st, part), sc = ch.scale / (p.form === 'big' ? 0.37 : 0.44);
      const a = E.rad(p.rot || 0), ox = dx * sc, oy = dy * sc;
      FX.gumSplat(ctx, c[0] + ox * Math.cos(a) - oy * Math.sin(a), c[1] + ox * Math.sin(a) + oy * Math.cos(a), sz * sc * k * 0.8,
        m.f0 + i, '#5b3a1a', '#2a170a');
    });
  }
  // канат
  let r = null;
  for (const q of ROPE) if (f >= q.f0) r = q;
  if (r && r.a) {
    const a = ropeEnd(r.a, f, S), b = ropeEnd(r.b, f, S);
    const sag = r.sag === 'ground' ? Math.max(0, GROUND - 4 - (a[1] + b[1]) / 2) * 1.9 : r.sag;
    FX.rope(ctx, a, b, sag);
  }
  for (const sp of SPLASH) FX.mudSplash(ctx, sp.x, GROUND - 10, (f - sp.f) / 22, sp.size, sp.f);
});

ST.start(BIG);
