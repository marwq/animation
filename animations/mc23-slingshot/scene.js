// Ролик 23 (серия по образцу): Рогатка с зефиром — Радужный против Толстого, 25 с, 24 кадра/с. Плотно, как у HugyTi:
// зефирный пулемёт, зефир раздувает Толстого в воздушный шар, огромная рогатка из столбов.
// Музыка превращения — присланная, ~4 с с затиханием, только при первом превращении. Фон — поле цветов.
//
//   0–1.8 с   радужный шарик (слева), пакет зефира посередине, шарик-Толстый (справа)
//   1.8–3.5 с Толстый всасывает весь зефир из пакета и пулемётом плюётся в Радужного — тот весь в зефире
//   3.6–4.8 с Радужный «растёт» под музыку — зефир разлетается
//   5–8.3 с   стреляет из рогатки зефиром — Толстый ловит ртом и ест, толстеет; огромная зефирина —
//             Толстого раздувает в шар, он взлетает, как воздушный шар
//   8.3–10.5 с над Радужным отрыжка — Толстый сдувается и падает на него — «пуф», Радужный снова шарик
//   11–12.3 с Радужный «растёт» снова
//   12.5–19 с щелчок — из земли вырастают два столба с резинкой — огромная рогатка; зефирина в кармашек —
//             Толстый влюблён в зефир, прыгает в кармашек и ест; Радужный оттягивает кармашек с Толстым —
//             и отпускает: Толстый улетает за кадр
//   19–25 с   Радужный в центре, руки вверх
'use strict';

const ST = Stage({
  name: 'mc23-slingshot',
  cast: {
    rb: { small: ['skeleton-verity-small', { scale: 0.455, recolor: 'rainbow' }], big: ['all-verity-color', { height: 730 }],
      pivot: 325, voice: 0.85, lie: 55, color: '#ff7a3a', moods: { angry: 'angry theeth', grin: 'happy with theeth', big: 'theeth smile' } },
    fat: { small: ['fat-verity-small', { bodyHeight: 450 }], pivot: 508, voice: 0.75, moods: { love: 'happy' } },
  },
  order: ['rb', 'fat'],
  background: { theme: 'flowerfield', seed: 231, sunX: 1500, sunY: 140 },
  clouds: [[120, 80, 2.4, 0, 12], [640, 210, 1.8, 1, 16], [1100, 60, 2.6, 2, 10], [420, 300, 1.4, 1, 14]],
});
const { FPS, NF, GROUND, C, key, move, ev, sfx, hop, tumble, laugh, tremble, transform, shrink, love, stance, walk, turn,
  victory, chuckle, hand, toRig, statesAt, stateAt, target } = ST;

ST.parts.mouth = (ch, st) => E.apply(ch.eyeMatrix(st, 'puzzlement'), [611, 456]);
const P = (v, f, S) => (typeof v === 'function' ? v(f, S) : typeof v === 'string' ? target(v, S) : v);
function fatOpen(f, k, n, extra = {}) { key('fat', f - n, { mouth: 'puzzlement' }, 0); key('fat', f, { mouthK: k, ...extra }, n, 'out'); }

// ------------------------------------------------------------------ зефир, рогатки
const MALLOWS = [];                                // {segs, s, col}: {f0, at, rot} | {f0, f1, a, b, arc, r0, r1} | {f0, stick: who, off} | {f0, hand} | {f0, gone}
const mallow = (segs, s = 60, col = '#ffd6ea') => { const m = { segs, s, col }; MALLOWS.push(m); return m; };
function mallowAt(M, f, S) {
  let cur = null;
  for (const c of M.segs) if (f >= c.f0) cur = c;
  if (!cur || cur.gone) return null;
  if (cur.at) { const p = P(cur.at, f, S); return { x: p[0], y: p[1], rot: cur.rot || 0 }; }
  if (cur.stick) { const b = target(`${cur.stick}:body`, S); return { x: b[0] + cur.off[0], y: b[1] + cur.off[1], rot: cur.off[2] || 0 }; }
  if (cur.hand) { const h = C.rb.big.point(S.rb.st, 'hand' + (cur.arm || 'B')); return { x: h[0], y: h[1] - M.s * 0.3, rot: 0 }; }
  const u = E.clamp((f - cur.f0) / (cur.f1 - cur.f0), 0, 1), a = P(cur.a, cur.f0, statesAt(cur.f0)), b = P(cur.b, f, S);
  return { x: E.lerp(a[0], b[0], u), y: E.lerp(a[1], b[1], E.EASE[cur.ease || 'lin'](u)) - Math.sin(Math.PI * u) * (cur.arc || 0), rot: E.lerp(cur.r0 || 0, cur.r1 || 0, u) };
}
const BAG = { x: 960, f1: 1e9 };                   // пакет
const SLING = [];                                  // ручная рогатка: {f0, at, rot} | {f0, hand: 'F'}
const POUCH = { f0: 1e9 };                         // кармашек ручной рогатки: где он (оттянут — у руки B)
const POSTS = { f0: 1e9, x1: 1130, x2: 1430, top: GROUND - 300, pouch: [[0, [1280, GROUND - 300]]] };
const keyedPt = (ks, f) => {
  if (f <= ks[0][0]) return ks[0][1];
  for (let i = 1; i < ks.length; i++) if (f < ks[i][0]) { const u = E.EASE[ks[i][2] || 'io']((f - ks[i - 1][0]) / (ks[i][0] - ks[i - 1][0])); return [E.lerp(ks[i - 1][1][0], ks[i][1][0], u), E.lerp(ks[i - 1][1][1], ks[i][1][1], u)]; }
  return ks[ks.length - 1][1];
};

const RS = 520, FS = 1360;
// ================================================================== 0–1.8 с: стойка
key('rb', 0, { form: 'small', x: RS, y: GROUND, face: 1, look: 1, eyes: 'normal', mouth: 'smile normal', sx: 1, sy: 1, rot: 0, pivot: 0, alpha: 1 }, 0);
key('fat', 0, { form: 'small', x: FS, y: GROUND, face: -1, look: 1, eyes: 'normal', mouth: 'smile normal', sx: 1, sy: 1, rot: 0, pivot: 0, mouthK: 1 }, 0);
SLING.push({ f0: 0, at: [700, GROUND - 30], rot: -1.4 });

const BIG = () => {
  // ---- 1.8–3.5 с: всасывает зефир из пакета — пулемётом в Радужного
  key('fat', 34, { mouth: 'theeth smile', eyes: 'angry' }, 0);
  sfx('ref:grin-eee', 34, { who: 'fat', gain: 0.5, pitch: 0.8 });
  fatOpen(40, 2.8, 5);
  sfx('suck', 40, { who: 'fat', dur: 16, gain: 0.9 });
  for (let i = 0; i < 7; i++) {
    const t = 40 + i * 2;
    mallow([{ f0: t, f1: t + 8, a: [BAG.x + (i % 3 - 1) * 30, GROUND - 190], b: 'fat:mouth', arc: 40, r0: 0, r1: 4 }, { f0: t + 8, gone: true }], 46, i % 2 ? '#ffffff' : '#ffd6ea');
  }
  BAG.empty = 54;
  BAG.fly = [55, 62];                                                // и пакет туда же
  sfx('crunch', 62, { who: 'fat', gain: 0.6 });
  key('fat', 58, { mouthK: 1, mouth: 'smile normal', sx: 1.22, sy: 1.12 }, 3);
  sfx('gulp', 58, { who: 'fat', gain: 0.8 });
  key('rb', 46, { mouth: 'puzzlement', eyes: 'sad' }, 0);
  const MG = 64, N = 7;
  fatOpen(MG, 1.8, 2);
  const OFF = [[-40, -40, 0.3], [30, -70, -0.4], [50, 10, 0.5], [-50, 30, -0.2], [0, -100, 0.1], [10, 50, -0.6], [-20, -10, 0.2]];
  for (let i = 0; i < N; i++) {
    const t = MG + i * 3, hit = t + 7;
    mallow([{ f0: t, f1: hit, a: 'fat:mouth', b: (f, S) => { const b = target('rb:body', S); return [b[0] + OFF[i][0], b[1] + OFF[i][1]]; }, r0: 0, r1: 5 },
      { f0: hit, stick: 'rb', off: OFF[i] }], 46, i % 2 ? '#ffffff' : '#ffd6ea');
    key('fat', t, { sx: 1.18 - i * 0.03, sy: 1.1 - i * 0.015 }, 1);
    sfx('pop', t, { who: 'fat', gain: 0.7 });
    sfx('squish', hit, { who: 'rb', gain: 0.5 });
    key('rb', hit, { sx: 1.08, sy: 0.94 }, 1);
    key('rb', hit + 2, { sx: 1, sy: 1 }, 2);
    move('rb', hit, { x: RS - i * 6, y: GROUND });
  }
  const END = MG + N * 3 + 4;
  key('fat', END, { mouthK: 1, sx: 1, sy: 1, mouth: 'happy', eyes: 'normal' }, 5);
  sfx('ref:laugh', END + 2, { who: 'fat', gain: 0.85, pitch: 0.75 });
  laugh('fat', END + 2, END + 20);

  // ---- 3.6–4.8 с: Радужный «растёт» — зефир разлетается
  const RX = 560, R0 = RS - 36;
  key('rb', END + 2, { eyes: 'angry', mouth: 'angry theeth' }, 0);
  ev('vein', { who: 'rb', f0: END + 2, f1: END + 12 });
  const RB = transform('rb', END + 4, R0, RX, 1, { style: 'grow' });
  MALLOWS.slice(-N).forEach((m, i) => {
    const land = [RX - 260 + i * 70, GROUND - 22];
    m.segs.push({ f0: RB - 6 + i, f1: RB + 10 + i, a: (f, S) => { const b = target('rb:body', S); return [b[0] + OFF[i][0], b[1] + OFF[i][1]]; }, b: land, arc: 150, r0: 0, r1: 6, ease: 'in2' },
      { f0: RB + 10 + i, at: land, rot: 1.5 });
  });
  sfx('pop', RB - 5, { who: 'rb', gain: 0.7 });
  key('rb', RB, stance('rb', RX, 1), 0);
  key('rb', RB + 6, { mouth: 'happy with theeth', eyes: 'angry' }, 0);
  key('fat', RB - 2, { mouth: 'puzzlement', eyes: 'sad' }, 0);
  ev('sweat', { who: 'fat', f0: RB, f1: RB + 18 });

  // ---- 5–8.3 с: рогатка — Толстый ловит ртом и ест; огромная зефирина — шар, взлетает
  const K = C.rb.big, PU = RB + 10;
  key('rb', PU - 8, { lean: 24, hip: [0, toRig('rb', 110)], head: 8 }, 8);
  key('rb', PU, { hitF: 1, hitFto: [700, GROUND - 40], hitFfix: PU }, 6);
  SLING.push({ f0: PU, hand: 'F' });
  sfx('pop', PU, { who: 'rb', gain: 0.5 });
  const AIM = { ...stance('rb', RX, 1), hitF: 0, handF: hand('rb', 'F', 0.97, -0.15), handB: hand('rb', 'B', 0.7, -0.1), lean: 0, head: 0 };
  key('rb', PU + 10, AIM, 8);
  const tipsAt = (f, S) => { const h = K.point(S.rb.st, 'handF'); return [[h[0] - 10, h[1] - 120], [h[0] + 30, h[1] - 120]]; };
  let fatS = 1, t0 = PU + 12;
  const shots = [[t0, 46], [t0 + 16, 46], [t0 + 32, 46]];
  for (const [t, s] of shots) {
    const load = t, pull = t + 6, fire = t + 9, catchF = fire + 7;
    key('rb', load, { handB: hand('rb', 'B', 0.7, -0.1) }, 3);
    key('rb', pull, { handB: hand('rb', 'B', -0.4, 0.05), lean: -6 }, 6);
    key('rb', fire + 2, { handB: hand('rb', 'B', 0.55, -0.1), lean: 2 }, 2);
    POUCH[t] = [load, pull, fire];
    mallow([{ f0: load, hand: true, arm: 'B' }, { f0: fire, f1: catchF, a: (f, S) => { const h = K.point(S.rb.st, 'handB'); return [h[0], h[1]]; }, b: 'fat:mouth', arc: 40, r0: 0, r1: 4 }, { f0: catchF, gone: true }], s);
    sfx('swing', pull - 2, { who: 'rb', gain: 0.5 });
    sfx('flick', fire, { who: 'rb', gain: 0.9 });
    fatOpen(catchF - 1, 2.4, 4);
    key('fat', catchF, { mouthK: 1, mouth: 'smile normal' }, 2);
    fatS += 0.1;
    key('fat', catchF + 2, { sx: fatS * 1.06, sy: fatS * 0.95 }, 2);
    key('fat', catchF + 6, { sx: fatS, sy: fatS, mouth: 'happy', eyes: 'normal' }, 3);
    sfx('chomp', catchF, { who: 'fat', gain: 0.7 });
    sfx('gulp', catchF + 3, { who: 'fat', gain: 0.6 });
  }
  key('rb', t0 + 30, { mouth: 'puzzlement', eyes: 'normal' }, 0);
  // огромная зефирина: из пакета — в кармашек
  const GT = t0 + 50, GF = GT + 12, GC = GF + 9;
  key('rb', GT - 6, { handB: hand('rb', 'B', 0.75, -0.6), mouth: 'happy with theeth', eyes: 'angry' }, 4);
  ev('twinkle', { f: GT - 4, at: K.point(stateAt(GT - 4).rb.st, 'handB'), n: 14, size: 40 });
  sfx('grow', GT - 4, { who: 'rb', gain: 0.7 });
  key('rb', GT + 4, { handB: hand('rb', 'B', -0.4, 0.05), lean: -8 }, 8);
  key('rb', GF + 2, { handB: hand('rb', 'B', 0.55, -0.1), lean: 2 }, 2);
  POUCH[GT] = [GT - 2, GT + 4, GF];
  mallow([{ f0: GT - 4, hand: true, arm: 'B' }, { f0: GF, f1: GC, a: (f, S) => K.point(S.rb.st, 'handB'), b: 'fat:mouth', arc: 30, r0: 0, r1: 3 }, { f0: GC, gone: true }], 130);
  sfx('swing', GT + 2, { who: 'rb', gain: 0.6 });
  sfx('flick', GF, { who: 'rb', gain: 1.0 });
  fatOpen(GC - 1, 3.4, 5);
  key('fat', GC, { mouthK: 1, mouth: 'smile normal', sx: 1.4, sy: 1.2 }, 2);
  sfx('gulp', GC, { who: 'fat', gain: 1.0, pitch: 0.8 });
  sfx('inflate', GC + 2, { who: 'fat', dur: 14, gain: 0.8 });
  const BALL = GC + 14;
  key('fat', BALL, { sx: 1.45, sy: 1.45, mouth: 'puzzlement', eyes: 'sad' }, 12, 'out');
  // взлетает и плывёт к Радужному
  const FLOAT = BALL + 18;
  move('fat', BALL - 4, { x: FS, y: GROUND });
  move('fat', FLOAT, { x: RX + 120, y: GROUND - 330 }, 'io');
  for (let f = BALL; f < FLOAT; f += 8) key('fat', f + 4, { rot: ((f / 8) % 2 ? 8 : -8) }, 4);
  key('fat', FLOAT, { rot: 0 }, 4);
  sfx('whoosh', BALL, { who: 'fat', dur: 20, gain: 0.4 });
  sfx('scared', BALL + 4, { who: 'fat', gain: 0.6, pitch: 0.8 });
  key('rb', BALL, { ...AIM, handB: hand('rb', 'B', 0.4, -0.3), mouth: 'happy with theeth', eyes: 'normal' }, 6);
  sfx('ref:laugh', BALL + 2, { who: 'rb', gain: 0.85, pitch: 1.0 });
  chuckle('rb', BALL + 2, BALL + 22, { mouth: 'happy with theeth' });
  key('rb', BALL + 22, { head: -14, mouth: 'puzzlement' }, 6);       // смотрит вверх — над ним шар

  // ---- 8.3–10.5 с: отрыжка — сдувается и падает на Радужного — «пуф»
  const BURP = FLOAT + 4, LAND = BURP + 8;
  sfx('burp', BURP, { who: 'fat', gain: 1.1, pitch: 0.7 });
  fatOpen(BURP, 2.0, 2);
  key('fat', BURP + 4, { sx: 1, sy: 1, mouthK: 1 }, 4);
  ev('sweat', { who: 'rb', f0: BURP, f1: LAND });
  sfx('scared', BURP + 2, { who: 'rb', gain: 0.7 });
  key('rb', BURP + 2, { handF: hand('rb', 'F', 0.3, -0.9), handB: hand('rb', 'B', -0.2, -0.9) }, 3);
  SLING.push({ f0: BURP + 2, f1: BURP + 14, a: (f, S) => K.point(S.rb.st, 'handF'), b: [RX + 240, GROUND - 30], arc: 120, r0: 0, r1: -1.4 + Math.PI * 2 }, { f0: BURP + 14, at: [RX + 240, GROUND - 30], rot: -1.4 });
  const top = target('rb:top', stateAt(LAND));
  move('fat', FLOAT + 2, { x: RX + 120, y: GROUND - 330 });
  move('fat', LAND, { x: RX + 20, y: top[1] + 60 }, 'in2');
  sfx('slam', LAND, { who: 'rb', gain: 1.0 });
  ev('shake', { f: LAND, amp: 16, n: 10 });
  const sm = shrink('rb', LAND + 1, RX, 1, { mouth: 'puzzlement', eyes: 'sad', smoke: 420 });
  key('rb', sm, { lean: 0, head: 0, hip: [0, 0] }, 0);
  move('fat', LAND + 2, { x: RX + 20, y: top[1] + 60 });
  move('fat', LAND + 8, { y: GROUND - 300 + 40 }, 'in2');
  key('rb', sm + 2, { sx: 1.9, sy: 0.4 }, 2);                                    // расплющен под Толстым
  key('fat', LAND + 8, { sx: 1.15, sy: 0.88, mouth: 'happy', eyes: 'normal' }, 2);
  key('fat', LAND + 12, { sx: 1, sy: 1 }, 4);
  sfx('squish', LAND + 8, { who: 'rb', gain: 0.9 });
  sfx('ref:laugh', LAND + 10, { who: 'fat', gain: 0.85, pitch: 0.75 });
  laugh('fat', LAND + 10, LAND + 26);
  const OFFF = LAND + 22, FX2 = 1500;
  hop('fat', OFFF, OFFF + 14, RX + 20, FX2, 160);
  move('fat', OFFF, { x: RX + 20, y: GROUND - 260 });
  key('rb', OFFF + 2, { sx: 1, sy: 1 }, 6, 'out');
  sfx('boing', OFFF + 2, { who: 'rb', gain: 0.6 });
  ev('stars', { who: 'rb', f0: OFFF + 4, f1: OFFF + 22, snd: false });

  // ---- 11–12.3 с: Радужный «растёт» снова
  key('rb', OFFF + 10, { eyes: 'angry', mouth: 'angry theeth' }, 0);
  ev('vein', { who: 'rb', f0: OFFF + 10, f1: OFFF + 20 });
  const RB2 = transform('rb', OFFF + 12, RX, RX, 1, { style: 'grow' });
  key('rb', RB2, stance('rb', RX, 1), 0);
  key('rb', RB2 + 6, { mouth: 'happy with theeth', eyes: 'angry' }, 0);
  key('fat', RB2 - 2, { mouth: 'puzzlement', eyes: 'sad' }, 0);

  // ---- 12.5–19 с: огромная рогатка из столбов — зефир в кармашек — Толстый прыгает — выстрел
  const SN = RB2 + 8;
  key('rb', SN - 4, { handF: hand('rb', 'F', 0.75, -0.75) }, 4);
  sfx('flick', SN, { who: 'rb', gain: 1.0 });
  key('rb', SN + 6, { handF: stance('rb', RX, 1).handF }, 6);
  POSTS.f0 = SN + 2; POSTS.grow = [SN + 2, SN + 12];
  sfx('grow', SN + 2, { x: 1280, gain: 0.9 });
  for (const x of [POSTS.x1, POSTS.x2]) ev('twinkle', { f: SN + 2, at: [x, GROUND - 20], n: 14, size: 40 });
  ev('dust', { f: SN + 4, x: 1280, r: 60, n: 7 });
  // Толстый отпрыгивает правее
  hop('fat', SN + 4, SN + 14, FX2, 1700, 120);
  // зефирина в кармашек
  const PM = SN + 14, TH = PM + 10, IN = TH + 12, POUCH0 = [1280, GROUND - 300];
  key('rb', PM - 6, { lean: 22, hip: [0, toRig('rb', 100)], head: 8 }, 6);
  key('rb', PM, { hitB: 1, hitBto: [RX - 190, GROUND - 26], hitBfix: PM }, 5);
  const PMM = mallow([{ f0: 0, gone: true }, { f0: PM, hand: true, arm: 'B' }], 46);
  key('rb', PM + 8, { ...stance('rb', RX, 1), hitB: 0, handB: hand('rb', 'B', -0.5, -0.75) }, 6);
  key('rb', TH, { handB: hand('rb', 'B', 0.9, -0.5), lean: 10 }, 4, 'in2');
  key('rb', TH + 10, { ...stance('rb', RX, 1), mouth: 'happy with theeth', eyes: 'normal' }, 8);
  sfx('swing', TH - 3, { who: 'rb', gain: 0.8 });
  ev('twinkle', { f: TH + 4, at: [900, GROUND - 400], n: 16, size: 44 });
  sfx('grow', TH + 4, { x: 1000, gain: 0.7 });
  PMM.s = 46;
  PMM.segs.push({ f0: TH, f1: IN, a: (f, S) => K.point(S.rb.st, 'handB'), b: [POUCH0[0], POUCH0[1] - 70], arc: 160, r0: 0, r1: Math.PI * 2 });
  PMM.segs.push({ f0: IN, front: true, at: (f, S) => { const p = keyedPt(POSTS.pouch, f); return [p[0], p[1] - 70]; } });
  PMM.grow = [TH + 4, IN];
  sfx('boing', IN, { x: 1280, gain: 0.6 });
  // Толстый влюблён в зефир — прыгает в кармашек и ест
  const LV = IN + 4;
  love('fat', LV, LV + 30, { mouth: 'happy' });
  const JU = LV + 8, ON = JU + 12, SIT = POUCH0[1] + 40;
  hop('fat', JU, ON, 1700, POUCH0[0], 220);
  move('fat', ON, { x: POUCH0[0], y: SIT });
  POSTS.pouch = [[0, POUCH0], [ON, POUCH0], [ON + 4, [POUCH0[0], POUCH0[1] + 50]], [ON + 10, [POUCH0[0], POUCH0[1] + 34]]];
  sfx('spring', ON, { x: 1280, gain: 0.8 });
  move('fat', ON + 4, { x: POUCH0[0], y: SIT + 50 }, 'out2');
  move('fat', ON + 10, { x: POUCH0[0], y: SIT + 34 }, 'io');
  const EAT = ON + 10;
  fatOpen(EAT, 2.8, 4);
  PMM.segs.push({ f0: EAT + 2, gone: true });
  key('fat', EAT + 4, { mouthK: 1, mouth: 'smile normal' }, 2);
  for (let i = 0; i < 3; i++) {
    key('fat', EAT + 6 + i * 6, { sx: 1.1, sy: 0.94, mouth: 'happy' }, 3);
    key('fat', EAT + 9 + i * 6, { sx: 0.95, sy: 1.05, mouth: 'smile normal' }, 3);
    sfx('chomp', EAT + 6 + i * 6, { who: 'fat', gain: 0.6 });
  }
  // Радужный оттягивает кармашек с Толстым
  const WK = IN + 6, RX2 = 870;
  walk('rb', WK, RX, RX2, 3, 9, 1);
  const GR = WK + 27 + 6, PULLED = GR + 22, PB = [1010, GROUND - 230];
  const pouchNow = (f) => keyedPt(POSTS.pouch, f);
  key('rb', GR, { hitF: 1, hitFto: (() => { const p = pouchNow(GR); return [p[0] - 150, p[1] - 40]; })(), hitFfix: GR, hitB: 1, hitBto: (() => { const p = pouchNow(GR); return [p[0] - 160, p[1] + 20]; })(), hitBfix: GR }, 6);
  sfx('pop', GR, { who: 'rb', gain: 0.4 });
  POSTS.pouch.push([GR + 2, pouchNow(GR)], [PULLED, [PB[0] + 150, PB[1]], 'io']);
  move('fat', GR + 2, { x: POUCH0[0], y: SIT + 34 });
  move('fat', PULLED, { x: PB[0] + 150, y: PB[1] + 40 + 34 }, 'io');
  const KR = C.rb.big, RX3 = 700;
  key('rb', GR + 4, { hitF: 0, hitB: 0, handF: hand('rb', 'F', 0.95, -0.1), handB: hand('rb', 'B', 0.9, 0.0), lean: -16, head: -6, mouth: 'happy with theeth' }, 4);
  move('rb', GR + 4, { x: RX2 });
  move('rb', PULLED, { x: RX3 }, 'io');
  key('rb', GR + 4, { ...KR.feet(RX2, 1) }, 0);
  key('rb', PULLED, { ...KR.feet(RX3, 1, 40, 60) }, PULLED - GR - 4);
  sfx('creak', GR + 4, { x: 1100, dur: PULLED - GR - 4, gain: 0.7 });
  key('fat', GR + 10, { mouth: 'puzzlement', eyes: 'sad' }, 0);
  ev('sweat', { who: 'fat', f0: GR + 10, f1: PULLED + 6 });
  // отпускает
  const FIRE = PULLED + 6, GONE = FIRE + 30;
  key('rb', FIRE, { handF: hand('rb', 'F', 0.5, -0.3), handB: hand('rb', 'B', 0.3, -0.2), lean: 0, head: 0 }, 2);
  POSTS.pouch.push([FIRE - 1, [PB[0] + 150, PB[1]]], [FIRE + 3, [1500, GROUND - 330], 'out'], [FIRE + 7, [1240, GROUND - 290]], [FIRE + 12, [1300, GROUND - 302]], [FIRE + 18, POUCH0]);
  sfx('spring', FIRE, { x: 1280, gain: 1.1 });
  sfx('whoosh', FIRE + 1, { who: 'fat', dur: 16, gain: 0.8 });
  key('fat', FIRE, { pivot: 508, rot: 0 }, 0);
  move('fat', FIRE, { x: PB[0] + 150, y: PB[1] + 74 });
  move('fat', FIRE + 14, { x: 1700, y: 200 }, 'out');
  move('fat', GONE, { x: 2400, y: -500 }, 'in');
  move('fat', GONE, { rot: 900 }, 'lin');
  sfx('scared', FIRE + 2, { who: 'fat', gain: 0.8, pitch: 0.8 });
  ev('twinkle', { f: GONE - 4, at: [1820, 110], n: 22, size: 60 });
  ev('shake', { f: FIRE, amp: 10, n: 6 });
  key('rb', FIRE + 4, { ...stance('rb', RX3, 1), mouth: 'happy with theeth', eyes: 'normal' }, 6);
  sfx('ref:laugh', FIRE + 6, { who: 'rb', gain: 0.85, pitch: 1.0 });
  chuckle('rb', FIRE + 6, FIRE + 22, { mouth: 'happy with theeth' });
  const WIN = victory('rb', FIRE + 22, RX3, { n: 9, stride: 110 });
  window.T = { MG, END, RB, GT, GC, BALL, LAND, RB2, SN, IN, ON, GR, FIRE, WIN };
};

// ------------------------------------------------------------------ рисование
function slingAt(f, S) {
  let cur = null;
  for (const c of SLING) if (f >= c.f0) cur = c;
  if (!cur) return null;
  if (cur.at) return { x: cur.at[0], y: cur.at[1], rot: cur.rot };
  if (cur.hand) { const h = C.rb.big.point(S.rb.st, 'hand' + cur.hand); return { x: h[0], y: h[1], rot: 0.15 }; }
  const u = E.clamp((f - cur.f0) / (cur.f1 - cur.f0), 0, 1), a = P(cur.a, cur.f0, statesAt(cur.f0)), b = P(cur.b, f, S);
  return { x: E.lerp(a[0], b[0], u), y: E.lerp(a[1], b[1], u) - Math.sin(Math.PI * u) * (cur.arc || 0), rot: E.lerp(cur.r0, cur.r1, u) };
}
function drawPosts(ctx, f, front) {
  if (f < POSTS.f0) return;
  const g = E.EASE.out(E.clamp((f - POSTS.grow[0]) / (POSTS.grow[1] - POSTS.grow[0]), 0, 1)), top = GROUND - (GROUND - POSTS.top) * g;
  const p = keyedPt(POSTS.pouch, f), pouch = [p[0], Math.min(p[1], GROUND) * g + top * (1 - g)];
  if (!front) {
    for (const x of [POSTS.x1, POSTS.x2]) {
      ctx.fillStyle = '#111'; ctx.fillRect(x - 26, top - 6, 52, GROUND - top + 6);
      ctx.fillStyle = '#8a5a2b'; ctx.fillRect(x - 21, top, 42, GROUND - top);
      ctx.fillStyle = '#6a421c'; for (let y = top + 20; y < GROUND; y += 46) ctx.fillRect(x - 21, y, 42, 8);
      ctx.fillStyle = '#e8262e'; ctx.fillRect(x - 21, top, 42, 18);
    }
  } else if (g > 0.98) FX.slingBand(ctx, [[POSTS.x1, top + 10], [POSTS.x2, top + 10]], pouch, 9);
}
ST.hooks.beforeChars.push((ctx, f, S, CAM) => {
  ctx.setTransform(...CAM);
  if (!BAG.fly || f < BAG.fly[0]) FX.mallowBag(ctx, BAG.x, GROUND + 2, 170, f < (BAG.empty || 1e9) ? 4 : 0);
  else if (f < BAG.fly[1]) {                                           // пакет летит в рот и сминается
    const u = (f - BAG.fly[0]) / (BAG.fly[1] - BAG.fly[0]), m = target('fat:mouth', S), k = 1 - 0.8 * u;
    ctx.save(); ctx.translate(E.lerp(BAG.x, m[0], u), E.lerp(GROUND, m[1] + 40, u)); ctx.rotate(u * 5); ctx.scale(k, k);
    FX.mallowBag(ctx, 0, 0, 170, 0); ctx.restore();
  }
  drawPosts(ctx, f, false);
  for (const M of MALLOWS) { const cur = M.segs.filter((c) => f >= c.f0).pop(); if (cur && cur.at && !cur.front) { const m = mallowAt(M, f, S); FX.marshmallow(ctx, m.x, m.y, M.s, m.rot, M.col); } }
  const sl = slingAt(f, S);
  if (sl && SLING.filter((c) => f >= c.f0).pop().at) FX.slingshotY(ctx, sl.x, sl.y, 170, sl.rot);
});
ST.hooks.afterChars.push((ctx, f, S, CAM) => {
  ctx.setTransform(...CAM);
  drawPosts(ctx, f, true);
  const sl = slingAt(f, S), cur = SLING.filter((c) => f >= c.f0).pop();
  if (sl && !cur.at) {
    const tips = FX.slingshotY(ctx, sl.x, sl.y, 170, sl.rot);
    let pouch = [(tips[0][0] + tips[1][0]) / 2 + 4, (tips[0][1] + tips[1][1]) / 2 + 6];
    for (const k of Object.keys(POUCH)) {
      if (k === 'f0') continue;
      const [load, pull, fire] = POUCH[k];
      if (f >= load && f < fire) pouch = C.rb.big.point(S.rb.st, 'handB');
    }
    if (S.rb.p.form === 'big') FX.slingBand(ctx, tips, pouch, 5);
  }
  for (const M of MALLOWS) {
    const c = M.segs.filter((k) => f >= k.f0).pop();
    if (!c || c.gone || (c.at && !c.front)) continue;
    const m = mallowAt(M, f, S);
    if (!m) continue;
    let s = M.s;
    if (M.grow) s *= 1 + 1.8 * E.EASE.out(E.clamp((f - M.grow[0]) / (M.grow[1] - M.grow[0]), 0, 1));
    FX.marshmallow(ctx, m.x, m.y, s, m.rot, M.col);
  }
});

ST.start(BIG);
