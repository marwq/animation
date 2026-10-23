// Ролик 21: Мяч — Лорд против Толстого (и Розовая), 25 с, 24 кадра/с, звуковые эффекты без музыки,
// по стилю «animal hospital long» (docs/animal_hospital_long.md).
//
//   0–4 с     шарик-Лорд (слева) и Толстый (справа) смотрят друг на друга, между ними мяч
//   4–5 с     Лорд сразу становится большим
//   5.5–8 с   пинает мяч в Толстого — мяч отскакивает от пуза прямо Лорду в лицо, Лорд падает на спину
//   8–11 с    Толстый смеётся, прыгает и садится Лорду на голову — Лорд в лепёшку, звёздочки
//   10–13 с   прискакала шарик-Розовая и стала большой — оба влюбились
//   14–17.5 с Лорд хвастается: чеканит мяч коленом, головой — мяч падает Толстому на макушку и
//             отскакивает Розовой в руки
//   18.5–21 с она пинает мяч — Лорду в лицо, он падает; мяч отскакивает в Толстого, тот катится
//             к ней — пинок, Толстый улетает за кадр
//   21–25 с   Розовая в центре, руки вверх
'use strict';

const ST = Stage({
  name: 'v21-ball',
  cast: {
    lord: { small: ['lord-verity-small', { bodyHeight: 300 }], big: ['lord-verity-big', { height: 730 }], pivot: 337,
      voice: 1.0, lie: 55 },
    fat: { small: ['fat-verity-small', { bodyHeight: 450 }], pivot: 508, voice: 0.75, moods: { love: 'happy' } },
    girl: { small: ['girl-verity-small', { bodyHeight: 300 }], big: ['girl-verity-big', { height: 730, splitFeet: true }],
      pivot: 337, voice: 1.35, vAngle: 50,
      moods: { angry: 'sad', grin: 'theeth smile', big: 'smile normal' } },
  },
  order: ['lord', 'fat', 'girl'],
  background: { sky: ['#4aa8f2', '#b4d4f5', '#f3e6d0'], seed: 251 },
  clouds: [[140, 110, 1.0, 0, 23], [560, 60, 1.2, 2, 29], [990, 190, 0.8, 1, 20], [1400, 90, 1.1, 0, 26],
    [1780, 200, 0.9, 2, 31], [820, 300, 0.7, 1, 18]],
});
const { GROUND, C, key, move, ev, sfx, hop, tumble, laugh, tremble, transform, love, stance, walk, turn,
  strike, kick, dodge, duck, recoil, fallBack, getUp, flyOff, victory, chuckle, hand, toRig, statesAt, stateAt, target } = ST;

// точки на контуре Толстого (замерено по силуэту рига): k > 0 — со стороны взгляда
const fatEdge = (k, hf) => (ch, st) => {
  const b = ch.layers.find((l) => l.name === 'body').bbox;
  return E.apply(ch.layerMatrix(st, 'body'), [(b[0] + b[2]) / 2 + k * (b[2] - b[0]), b[3] - hf * (b[3] - b[1])]);
};
ST.parts.belly = fatEdge(0.47, 0.3);
ST.parts.back = fatEdge(-0.45, 0.45);
// колено передней ноги большого
ST.parts.knee = (ch, st) => {
  const L = ch.leg.F, b = ch.bones;
  return E.apply(st.G, E.apply(st.W[L[1]], b[L[1]].base));
};

// ------------------------------------------------------------------ мяч
// сегменты: {f0, f1, a, b, arc, ease, r0, r1} — летит/катится; {f0, hold: (S) => точка} — в руках
const BR = 46, BY = GROUND - BR + 4;           // радиус; центр мяча, лежащего на траве
const BL = [];
const P = (v, f, S) => (typeof v === 'function' ? v(f, S) : v);
function seg(f0, f1, a, b, o = {}) {
  const last = BL[BL.length - 1], r0 = last ? (last.r1 ?? last.r0 ?? 0) : 0;
  BL.push({ f0, f1, a, b, arc: o.arc || 0, ease: o.ease || 'lin', r0, r1: r0 + (o.spin || 0) });
}
const ballAt = (f, S) => {
  let cur = null;
  for (const c of BL) if (f >= c.f0) cur = c;
  if (cur.hold) { const p = cur.hold(S); return { x: p[0], y: p[1], rot: cur.r0 }; }
  const u = cur.f1 > cur.f0 ? E.clamp((f - cur.f0) / (cur.f1 - cur.f0), 0, 1) : 1;
  const a = P(cur.a, cur.f0, statesAt(cur.f0)), b = P(cur.b, f, S);
  return { x: E.lerp(a[0], b[0], u), y: E.lerp(a[1], b[1], E.EASE[cur.ease](u)) - Math.sin(Math.PI * u) * cur.arc,
    rot: E.lerp(cur.r0, cur.r1, u) };
};
// где мяч в кадре f (для начала следующего сегмента)
const ballPos = (f) => { const p = ballAt(f, stateAt(f)); return [p.x, p.y]; };
const rollSpin = (dx) => dx / BR;              // катится без проскальзывания

const LS = 560, FS = 1360, BX0 = 960;
// ================================================================== 0–4 с: стойка
key('lord', 0, { form: 'small', x: LS, y: GROUND, face: 1, look: 1, eyes: 'angry', mouth: 'theeth smile', sx: 1, sy: 1, rot: 0 }, 0);
key('fat', 0, { form: 'small', x: FS, y: GROUND, face: -1, look: 1, eyes: 'angry', mouth: 'theeth smile', sx: 1, sy: 1, rot: 0 }, 0);
key('girl', 0, { form: 'small', x: 2160, y: GROUND, face: -1, look: 1, eyes: 'normal', mouth: 'smile normal', sx: 1, sy: 1, rot: 0 }, 0);
BL.push({ f0: 0, f1: 0, a: [BX0, BY], b: [BX0, BY], arc: 0, ease: 'lin', r0: 0, r1: 0 });

// ================================================================== 4–5 с: Лорд большой
const LX0 = 600;
const LB = transform('lord', 96, LS, LX0, 1, { fast: true });
key('fat', LB, { mouth: 'puzzlement', eyes: 'sad' }, 0);
ev('sweat', { who: 'fat', f0: LB + 2, f1: LB + 26 });

// ================================================================== 10–13 с: Розовая
hop('girl', 240, 252, 2160, 1940, 70);
hop('girl', 256, 268, 1940, 1750, 70);
const GX = 1770;
const GB = transform('girl', 272, 1750, GX, -1, { love: ['lord', 'fat'], loveDur: 70 });

const BIG = () => {
  key('lord', LB, stance('lord', LX0, 1), 0);
  key('lord', LB + 4, { mouth: 'happy with theeth', eyes: 'normal' }, 0);

  // ---- пинает мяч — от пуза Толстого обратно в лицо
  const LX1 = 760, K1 = 150, HIT = K1 + 10, FACE = K1 + 20;
  walk('lord', 120, LX0, LX1, 2, 10, 1);
  kick('lord', K1, [BX0 - BR * 0.75, BY + BR * 0.3], { x: LX1, face: 1, snd: 'kick', r: 50 });
  const belly = (f, S) => { const p = target('fat:belly', S); return [p[0] + BR * 0.8, p[1]]; };   // Толстый смотрит влево
  seg(K1, HIT, [BX0, BY], belly, { arc: 40, spin: -6 });
  key('fat', HIT, { sx: 0.84, sy: 1.12 }, 2, 'out');
  key('fat', HIT + 4, { sx: 1.08, sy: 0.94 }, 4);
  key('fat', HIT + 8, { sx: 1, sy: 1 }, 4);
  sfx('boing', HIT, { who: 'fat', gain: 0.9 });
  const lface = (f, S) => { const p = target('lord:face', S); return [p[0] + BR * 0.8, p[1]]; };
  seg(HIT, FACE, belly, lface, { arc: 50, spin: 5 });
  ev('spark', { f: FACE, at: 'lord:face', r: 70, snd: 'bonk', swing: false });
  ev('shake', { f: FACE, amp: 16, n: 12 });
  ev('zoom', { f: FACE, n: 12, k: 0.07, at: 'lord:face' });
  const down = fallBack('lord', FACE + 1, LX1, 1, { n: 16, stars: 26 });
  const LX2 = 850;                                       // отъехал при падении — голова не за краем
  move('lord', FACE + 14, { x: LX2 }, 'out2');
  // мяч падает перед ним, подскакивает и откатывается
  const BX1 = 985;
  seg(FACE, FACE + 14, lface, [935, BY], { arc: 120, ease: 'in2', spin: 4 });
  seg(FACE + 14, FACE + 24, [935, BY], [965, BY], { arc: 45, spin: 1 });
  seg(FACE + 24, FACE + 36, [965, BY], [BX1, BY], { ease: 'out', spin: rollSpin(20) });
  sfx('bounce', FACE + 14, { x: 935, gain: 0.5 });
  sfx('bounce', FACE + 24, { x: 965, gain: 0.35 });
  key('fat', FACE + 2, { mouth: 'happy', eyes: 'normal' }, 0);
  laugh('fat', FACE + 4, FACE + 40);

  // ---- Толстый прыгает и садится Лорду на голову — лепёшка
  const UP = down + 10;                                  // 197
  getUp('lord', UP, LX2, 1, { n: 14 });
  const JMP = UP + 10, LAND = JMP + 18, SQ = LAND + 4;
  const LH = 730;                                        // рост большого Лорда
  key('fat', JMP - 6, { sx: 1.22, sy: 0.8, mouth: 'theeth smile', eyes: 'angry' }, 5);
  key('fat', JMP, { sx: 0.88, sy: 1.14, pivot: 508 }, 2);
  move('fat', JMP - 6, { x: FS, y: GROUND, rot: 0 });
  move('fat', JMP, { x: FS, y: GROUND, rot: 0 });
  move('fat', JMP + 10, { x: 1060, y: GROUND - 560 }, 'out2');
  move('fat', JMP + 10, { rot: -200 }, 'lin');
  key('fat', JMP + 8, { sx: 1, sy: 1 }, 4);
  move('fat', LAND, { x: LX2 + 10, y: GROUND - LH + 20 }, 'in2');
  move('fat', LAND, { rot: -360 }, 'lin');
  key('fat', LAND + 1, { rot: 0 }, 0);
  sfx('jump', JMP, { who: 'fat', gain: 0.7 });
  sfx('whoosh', JMP + 2, { who: 'fat', dur: 16, gain: 0.6 });
  key('lord', UP + 16, { mouth: 'puzzlement', eyes: 'sad', head: -18, look: 1 }, 4);
  ev('sweat', { who: 'lord', f0: UP + 16, f1: LAND - 2 });
  sfx('scared', UP + 17, { who: 'lord', gain: 0.8 });
  key('lord', LAND, { sx: 1, sy: 1 }, 0);
  key('lord', SQ, { sx: 1.45, sy: 0.3, head: 0 }, 4, 'in2');           // в лепёшку
  move('fat', SQ, { y: GROUND - LH * 0.3 + 20 }, 'in2');
  key('fat', SQ, { sx: 1.18, sy: 0.84 }, 3);
  key('fat', SQ + 5, { sx: 1, sy: 1, mouth: 'happy', eyes: 'normal' }, 4);
  ev('dust', { f: SQ, x: LX2, r: 90, n: 9, snd: 'slam' });
  ev('shake', { f: SQ, amp: 24, n: 16 });
  ev('zoom', { f: SQ, n: 14, k: 0.07, at: [LX2, GROUND - 260] });
  sfx('hurt', SQ + 1, { who: 'lord' });
  laugh('fat', SQ + 6, SQ + 22);
  // спрыгивает вправо; Лорд выпрямляется, звёздочки
  const OFF = SQ + 24, FX1 = 1290;
  move('fat', OFF, { x: LX2 + 10, y: GROUND - LH * 0.3 + 20 });
  key('fat', OFF, { sx: 0.9, sy: 1.1 }, 3);
  move('fat', OFF + 8, { x: 1080, y: GROUND - 360 }, 'out2');
  move('fat', OFF + 16, { x: FX1, y: GROUND }, 'in2');
  key('fat', OFF + 16, { sx: 1.2, sy: 0.82 }, 1);
  key('fat', OFF + 22, { sx: 1, sy: 1 }, 5);
  sfx('jump', OFF, { who: 'fat', gain: 0.6 });
  ev('dust', { f: OFF + 16, x: FX1, r: 40, n: 5, snd: 'land' });
  key('lord', OFF + 14, { sx: 1.45, sy: 0.3 }, 0);                      // выпрямляется, когда Толстый уже далеко
  key('lord', OFF + 19, { sx: 0.9, sy: 1.14 }, 5, 'out');
  key('lord', OFF + 24, { sx: 1, sy: 1 }, 5);
  sfx('boing', OFF + 15, { who: 'lord', gain: 0.7 });
  ev('stars', { who: 'lord', f0: OFF + 6, f1: OFF + 50 });
  for (let f = OFF + 10; f < OFF + 46; f += 8) key('lord', f, { head: ((f - OFF) / 8) % 2 < 1 ? -9 : 7 }, 4);
  key('lord', OFF + 50, { head: 0, mouth: 'angry theeth', eyes: 'angry' }, 4);
  key('fat', OFF + 24, { mouth: 'theeth smile' }, 0);

  // ---- Жёлтая большая — оба влюблены; Толстый поворачивается к ней
  key('girl', GB, stance('girl', GX, -1), 0);
  key('girl', GB + 8, { mouth: 'theeth smile', eyes: 'normal' }, 0);
  key('fat', 292, { sx: 0.3 }, 2);                                      // повернулся к ней
  key('fat', 294, { face: 1 }, 0);
  key('fat', 296, { sx: 1 }, 2);

  // ---- Лорд чеканит мяч: подброс носком, колено, колено, голова
  const FL = GB + 26, KN1 = FL + 16, KN2 = KN1 + 16, HD = KN2 + 18;
  key('lord', FL - 10, { mouth: 'happy with theeth' }, 0);
  kick('lord', FL, [BX1 - BR * 0.7, BY + BR * 0.5], { x: LX2, face: 1, snd: 'flick', r: 36, hard: false });
  const knee = (f, S) => { const k = target('lord:knee', S); return [k[0] + 10, k[1] - BR - 6]; };
  const kneeUp = (f) => {
    key('lord', f - 6, { legFfk: 1, legF: [-78, 92], lean: -4, handF: hand('lord', 'F', 0.5, 0.1), handB: hand('lord', 'B', -0.5, 0.1) }, 6);
    key('lord', f + 6, { ...stance('lord', LX2, 1), legFfk: 0 }, 6);
    sfx('bounce', f, { x: LX2 + 120, gain: 0.7 });
  };
  seg(FL, FL + 8, [BX1, BY], [LX2 + 120, GROUND - 400], { ease: 'out2', spin: -2 });
  seg(FL + 8, KN1, [LX2 + 120, GROUND - 400], knee, { ease: 'in2', spin: -1 });
  kneeUp(KN1);
  seg(KN1, KN1 + 8, knee, [LX2 + 110, GROUND - 440], { ease: 'out2', spin: -2 });
  seg(KN1 + 8, KN2, [LX2 + 110, GROUND - 440], knee, { ease: 'in2', spin: -1 });
  kneeUp(KN2);
  const head = (f, S) => { const t = target('lord:top', S); return [t[0] + 8, t[1] - BR + 6]; };
  seg(KN2, KN2 + 9, knee, [LX2 + 100, 120], { ease: 'out2', spin: -2 });
  seg(KN2 + 9, HD, [LX2 + 100, 120], head, { ease: 'in2', spin: -1 });
  key('lord', HD - 4, { hip: [0, toRig('lord', 30)], head: 6 }, 4);
  key('lord', HD, { hip: [0, 0], head: -16 }, 3, 'out');
  key('lord', HD + 8, { head: 0, hip: [0, 8] }, 6);
  sfx('bonk', HD, { who: 'lord', gain: 0.6 });
  // мяч высоко — Лорд позирует (руки вверх), а мяч падает Толстому на макушку
  const TOPF = HD + 28, CATCH = TOPF + 14;
  const ftop = (f, S) => { const t = target('fat:top', S); return [t[0], t[1] - BR + 8]; };
  seg(HD, HD + 14, head, [1160, 40], { ease: 'out2', spin: -3 });
  seg(HD + 14, TOPF, [1160, 40], ftop, { ease: 'in2', spin: -2 });
  key('lord', HD + 10, { handF: hand('lord', 'F', 0.7, -0.7), handB: hand('lord', 'B', -0.7, -0.7), mouth: 'happy with theeth', look: 0 }, 6);
  key('lord', TOPF + 2, { ...stance('lord', LX2, 1), look: 1, mouth: 'puzzlement' }, 8);
  key('fat', TOPF, { sx: 1.16, sy: 0.84, mouth: 'puzzlement', eyes: 'sad' }, 2, 'out');
  key('fat', TOPF + 4, { sx: 0.94, sy: 1.06 }, 4);
  key('fat', TOPF + 8, { sx: 1, sy: 1 }, 4);
  sfx('boing', TOPF, { who: 'fat' });
  sfx('hurt', TOPF + 2, { who: 'fat', gain: 0.8 });
  // отскок Жёлтой в руки
  const CP = [GX - 140, GROUND - 440];
  seg(TOPF, CATCH, ftop, CP, { arc: 140, spin: -3 });
  key('girl', CATCH - 6, { mouth: 'puzzlement' }, 0);
  key('girl', CATCH, { hitF: 1, hitFto: [CP[0] - BR * 0.85, CP[1] + 6], hitFfix: CATCH, hitB: 1, hitBto: [CP[0] + BR * 0.85, CP[1] + 6],
    hitBfix: CATCH }, 5);
  BL.push({ f0: CATCH, hold: () => CP, r0: BL[BL.length - 1].r1 });
  sfx('pop', CATCH, { who: 'girl', gain: 0.6 });
  key('girl', CATCH + 8, { mouth: 'angry theeth', eyes: 'angry' }, 0);

  // ---- пинок по мячу: Лорду в лицо, отскок в Толстого
  const DROP = CATCH + 16, K2 = DROP + 6, HIT2 = K2 + 10, BACK = HIT2 + 12;
  const KP = [GX - 175, GROUND - 230];
  key('girl', DROP, { hitF: 0, hitB: 0, ...stance('girl', GX, -1) }, 4);
  BL.push({ f0: DROP, f1: K2, a: CP, b: KP, arc: 0, ease: 'in2', r0: BL[BL.length - 1].r0, r1: BL[BL.length - 1].r0 - 0.5 });
  kick('girl', K2, [KP[0] + BR * 0.6, KP[1] + BR * 0.4], { x: GX, face: -1, hard: true, snd: 'kick', r: 60 });
  seg(K2, HIT2, KP, lface, { arc: 150, spin: 6 });
  key('lord', HIT2 - 8, { mouth: 'puzzlement', eyes: 'sad' }, 0);
  ev('spark', { f: HIT2, at: 'lord:face', r: 80, snd: 'bonk', swing: false });
  ev('shake', { f: HIT2, amp: 20, n: 14 });
  ev('zoom', { f: HIT2, n: 12, k: 0.08, at: 'lord:face' });
  fallBack('lord', HIT2 + 1, LX2, 1, { n: 16, stars: 60 });
  const fback = (f, S) => { const p = target('fat:back', S); return [p[0] - BR * 0.8, p[1]]; };   // Толстый смотрит вправо
  seg(HIT2, BACK, lface, fback, { arc: 60, spin: 4 });
  sfx('boing', BACK, { who: 'fat' });
  ev('spark', { f: BACK, at: 'fat:back', r: 50, snd: 'bonk', swing: false });
  seg(BACK, BACK + 18, fback, [640, -160], { arc: 60, ease: 'out2', spin: -5 });
  // Толстый катится к ней — пинок, за кадр
  const FX2 = 1460, KF = BACK + 18;
  key('fat', BACK + 1, { mouth: 'puzzlement', eyes: 'sad' }, 0);
  hop('fat', BACK + 2, KF - 2, FX1, FX2, 70);                    // толчок в спину — прыжок к ней
  kick('girl', KF, 'fat:belly', { x: GX, face: -1, hard: true });
  tumble('fat', KF + 1, KF + 26, FX2, -480, 420, -3, {});
  ev('twinkle', { f: KF + 22, at: [110, 320], n: 22, size: 56 });
  key('girl', KF + 6, { mouth: 'happy with theeth', eyes: 'normal' }, 0);
  victory('girl', KF + 10, GX, { n: 9, stride: 140 });
};

ST.hooks.afterChars.push((ctx, f, S, CAM) => {
  const b = ballAt(f, S);
  ctx.setTransform(...CAM);
  FX.ball(ctx, b.x, b.y, BR, b.rot);
});

ST.start(BIG);
