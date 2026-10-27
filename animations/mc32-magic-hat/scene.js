// Ролик 32 (серия по образцу): Шляпа фокусника — Розовая против Лорда, 22 с, 24 кадра/с. Драка без ударов:
// из шляпы Лорда — пружина с тортом, наковальня, радужный луч; в конце шляпа засасывает самого Лорда.
// Музыка превращения — один раз. Фон — замок.
//
//   0–2 с     шарик-Розовая (слева) и шарик-Лорд (справа) неподвижно стоят друг напротив друга,
//             середина пустая — автор вставит начало
//   2–3.9 с   шляпа Лорда подпрыгивает, переворачивается и падает на траву — из неё на пружине торт
//             Розовой в лицо
//   3.9–5.1 с Розовая «растёт» под музыку — Лорд влюблён
//   5.2–8.3 с поднимает шляпу; влюблённый Лорд скачет к ней — она переворачивает шляпу над ним:
//             выпадает наковальня — Лорд в лепёшку
//   8.3–9.5 с Лорд «растёт»
//   9.6–12.3 с щелчок — шляпа летит ему на голову; снимает её — радужный луч: Розовая «пуф», шарик
//   12.3–15.6 с шарик-Розовая бьёт Лорда в лицо — шляпа слетает и падает ей на голову; Розовая «растёт» в шляпе
//   15.8–17.4 с снимает шляпу — Лорда засасывает в шляпу, она надевает её — шляпа дёргается
//   17.5–22 с Розовая в центре в шляпе, руки вверх
'use strict';

const ST = Stage({
  name: 'mc32-magic-hat',
  frames: 528,
  cast: {
    pink: { small: ['girl-verity-small', { bodyHeight: 300 }], big: ['girl-verity-big', { height: 730, splitFeet: true }],
      pivot: 337, voice: 1.35, vAngle: 50, lie: 55, color: '#ff4fc8', moods: { angry: 'angry theeth', grin: 'theeth smile', big: 'theeth smile' } },
    lord: { small: ['lord-verity-small', { bodyHeight: 300 }], big: ['lord-verity-big', { height: 730 }], pivot: 337,
      voice: 1.0, lie: 55, color: '#ffe23a', ouch: ['ref:hit-ow', 1.0, 0.9] },
  },
  order: ['lord', 'pink'],
  background: { theme: 'castle', seed: 321, sunX: 1500, sunY: 130 },
  clouds: [[150, 80, 2.4, 0, 12], [700, 220, 1.8, 1, 16], [1150, 70, 2.6, 2, 10], [1720, 250, 1.5, 0, 18]],
});
const { FPS, NF, GROUND, C, key, move, ev, sfx, hop, laugh, tremble, transform, shrink, stance, turn,
  victory, chuckle, hand, toRig, statesAt, stateAt, target } = ST;
const P = (v, f, S) => (typeof v === 'function' ? v(f, S) : typeof v === 'string' ? target(v, S) : v);

// ------------------------------------------------------------------ шляпа
const HAT = [{ f0: 0, on: 'lord' }];   // {on} | {f0, f1, a, b, arc, r0, r1, w0, w1} | {at, rot, w} | {hand, rot, w, dy} | {head, w}
const WIG = [];                        // [f0, f1] — шляпа дёргается (Лорд внутри)
let HW = null;
const hatImg = () => {
  if (!HW) {
    const L = C.lord.big, l = L.layers.find((x) => x.name === 'hat'), s = C.lord.small, ls = s.layers.find((x) => x.name === 'hat');
    HW = { l, asp: (l.bbox[3] - l.bbox[1]) / (l.bbox[2] - l.bbox[0]), big: (l.bbox[2] - l.bbox[0]) * L.scale, small: (ls.bbox[2] - ls.bbox[0]) * s.scale };
  }
  return HW;
};
const hatSeg = (f) => HAT.filter((h) => f >= h.f0).pop();
const hatW = (k) => (k === 'big' ? hatImg().big : k === 'small' ? hatImg().small : k);
function hatPose(f, S) {
  const h = hatSeg(f);
  if (!h || h.gone) return null;
  if (h.on) return { on: true };
  if (h.at) { const w = hatW(h.w); return { x: h.at[0], y: h.at[1] || GROUND - w * hatImg().asp / 2 + 4, rot: h.rot || 0, w }; }
  if (h.hand) {
    if (S[h.hand].p.form !== 'big') return null;
    const p = C[h.hand].big.point(S[h.hand].st, 'handF'), rot = typeof h.rot === 'function' ? h.rot(f) : h.rot || 0;
    return { x: p[0] + (h.dx || 0) * (S[h.hand].p.face || 1), y: p[1] + (h.dy || 0), rot, w: hatW(h.w) };
  }
  if (h.head) {
    const big = S[h.head].p.form === 'big', w = hatW(big ? 'big' : 'small'), t = target(`${h.head}:top`, S);
    let rot = E.rad(S[h.head].p.rot || 0) * 0;
    for (const [a, b] of WIG) if (f >= a && f < b) rot = Math.sin((f - a) * 1.6) * 0.18;
    return { x: t[0], y: t[1] - w * hatImg().asp / 2 + (big ? 34 : 26), rot, w };
  }
  const u = E.clamp((f - h.f0) / (h.f1 - h.f0), 0, 1), a = P(h.a, h.f0, statesAt(Math.max(0, h.f0 - 1))), b = P(h.b, f, S);
  return { x: E.lerp(a[0], b[0], u), y: E.lerp(a[1], b[1], u) - Math.sin(Math.PI * u) * (h.arc || 0), rot: E.lerp(h.r0 || 0, h.r1 || 0, u),
    w: E.lerp(hatW(h.w0 || 'small'), hatW(h.w1 || h.w0 || 'small'), u) };
}
// отверстие шляпы (низ полей в её системе координат)
const hatOpen = (hp) => { const hh = hp.w * hatImg().asp; return [hp.x - Math.sin(hp.rot) * hh * 0.5, hp.y + Math.cos(hp.rot) * hh * 0.5]; };
function drawHat(ctx, hp) {
  const H = hatImg(), hh = hp.w * H.asp;
  ctx.save(); ctx.translate(hp.x, hp.y); ctx.rotate(hp.rot);
  ctx.drawImage(H.l.img.canvas, -hp.w / 2, -hh / 2, hp.w, hh);
  ctx.restore();
}
ST.hooks.drawPose = (who, p, f) => (who === 'lord' && !hatSeg(f).on ? { ...p, hide: [...(p.hide || []), 'hat'] } : p);

// пружина с тортом, торт, крем на лице, наковальня, лучи
const SPR = [];           // {f0, f1, f2, f3, to} — выдвигается f0→f1, держится, убирается f2→f3
const PIE = [];           // {f0, f1, a, b, arc, spin} | {f0, at, rot} | {f0, gone}
const SPLAT = [];         // {who, f0, f1, s, seed}
const ANV = [];           // {f0, f1, a, b} | {f0, at} | {f0, gone}
const BEAM = [];          // {f0, f1, from, to}

const YX0 = 560, LX0 = 1360, HX = 900;
// ================================================================== 0–2 с: неподвижная стойка
key('pink', 0, { form: 'small', x: YX0, y: GROUND, face: 1, look: 1, eyes: 'normal', mouth: 'smile normal', sx: 1, sy: 1, rot: 0, pivot: 0, alpha: 1 }, 0);
key('lord', 0, { form: 'small', x: LX0, y: GROUND, face: -1, look: 1, eyes: 'normal', mouth: 'smile normal', sx: 1, sy: 1, rot: 0, pivot: 0, alpha: 1 }, 0);

const BIG = () => {
  // ---- 2–3.9 с: шляпа прыгает, переворачивается — пружина с тортом в лицо
  const H0 = 48, H1 = 62;
  key('lord', H0, { mouth: 'happy with theeth', eyes: 'angry', sx: 0.9, sy: 1.1 }, 2); key('lord', H0 + 4, { sx: 1, sy: 1 }, 3);
  const hy = () => GROUND - hatW('small') * hatImg().asp / 2 + 4;
  HAT.push({ f0: H0, f1: H1, a: (f, S) => target('lord:hat', S), b: (f, S) => [HX, hy()], arc: 240, r0: 0, r1: -Math.PI, w0: 'small' });
  HAT.push({ f0: H1, at: [HX, 0], rot: Math.PI, w: 'small' });
  sfx('pop', H0, { who: 'lord', gain: 0.8 });
  sfx('whoosh', H0 + 1, { who: 'lord', dur: 12, gain: 0.5 });
  ev('twinkle', { f: H0, at: [LX0, GROUND - 330], n: 16, size: 46 });
  sfx('land', H1, { x: HX, gain: 0.6 });
  ev('twinkle', { f: H1 + 2, at: [HX, GROUND - 160], n: 16, size: 50 });
  sfx('sparkle', H1 + 2, { x: HX, gain: 0.7 });
  key('pink', H1 - 4, { mouth: 'puzzlement' }, 0);
  const SP0 = H1 + 5, SP1 = SP0 + 5, SP2 = SP1 + 8, SP3 = SP2 + 8;
  SPR.push({ f0: SP0, f1: SP1, f2: SP2, f3: SP3, to: (S) => target('pink:face', S) });
  sfx('spring', SP0, { x: HX, gain: 0.9 });
  sfx('boing', SP2, { x: HX, gain: 0.6 });
  // торт в лицо
  sfx('splash', SP1, { who: 'pink', gain: 0.9 }); sfx('slap', SP1, { who: 'pink', gain: 0.7 });
  ev('shake', { f: SP1, amp: 10, n: 8 });
  SPLAT.push({ who: 'pink', f0: SP1, f1: 0, s: 150, seed: 4 });
  key('pink', SP1, { sx: 1.25, sy: 0.8, mouth: 'puzzlement', eyes: 'sad', pivot: ST.CAST.pink.pivot }, 1);
  move('pink', SP1, { x: YX0, y: GROUND, rot: 0 });
  move('pink', SP1 + 6, { x: YX0 - 60, rot: -14 }, 'out');
  move('pink', SP1 + 14, { rot: 0 }, 'io');
  key('pink', SP1 + 6, { sx: 1, sy: 1 }, 4);
  PIE.push({ f0: SP1 + 2, f1: SP1 + 12, a: (f, S) => target('pink:face', S), b: [YX0 + 40, GROUND - 10], arc: 30, spin: 3.4 });
  PIE.push({ f0: SP1 + 12, at: [YX0 + 40, GROUND - 10], rot: Math.PI });
  sfx('ref:laugh', SP1 + 4, { who: 'lord', gain: 0.85, pitch: 1.0 });
  laugh('lord', SP1 + 6, SP1 + 26);

  // ---- 3.9–5.1 с: Розовая «растёт» — Лорд влюблён
  const YX = 600;
  key('pink', SP1 + 16, { eyes: 'angry', mouth: 'angry theeth' }, 0);
  ev('vein', { who: 'pink', f0: SP1 + 16, f1: SP1 + 26 });
  const YB = transform('pink', SP1 + 18, YX0 - 60, YX, 1, { style: 'grow', love: 'lord', loveDur: 44 });
  SPLAT[0].f1 = YB;
  PIE.push({ f0: YB, gone: true });
  ev('smoke', { f: YB, who: 'pink', y: GROUND - 40, size: 160, dx: YX0 + 40 - YX });
  key('pink', YB, stance('pink', YX, 1), 0);
  key('pink', YB + 6, { mouth: 'theeth smile', eyes: 'angry' }, 0);

  // ---- 5.2–8.3 с: поднимает шляпу; влюблённый Лорд скачет к ней — наковальня из шляпы
  const PK = YB + 8;
  key('pink', PK - 6, { lean: 22, hip: [0, toRig('pink', 110)], head: 6 }, 6);
  key('pink', PK, { hitF: 1, hitFto: [HX - 10, GROUND - 60], hitFfix: PK }, 4);
  HAT.push({ f0: PK, hand: 'pink', rot: Math.PI, w: 'small', dy: -30 });
  sfx('pop', PK, { who: 'pink', gain: 0.5 });
  key('pink', PK + 8, { ...stance('pink', YX, 1), hitF: 0, handF: hand('pink', 'F', 0.7, 0.05), mouth: 'happy with theeth', eyes: 'angry' }, 8);
  const LX1 = 940;
  ST.hop('lord', PK + 2, PK + 12, LX0, 1180, 120);
  ST.hop('lord', PK + 14, PK + 24, 1180, LX1, 120);
  const OV = PK + 26, SHK = OV + 6, DROP = SHK + 6, FLAT = DROP + 6;
  const above = [LX1, target('lord:top', stateAt(1))[1] - 180];
  key('pink', OV, { handF: hand('pink', 'F', 0.98, -0.45), lean: 6 }, 6);
  for (let f = SHK; f < DROP; f += 2) key('pink', f + 1, { handF: hand('pink', 'F', 0.98, (f - SHK) % 4 ? -0.4 : -0.5) }, 1);
  sfx('creak', SHK, { who: 'pink', dur: 6, gain: 0.5 });
  // шляпа отверстием вниз: rot 0
  HAT.push({ f0: OV, hand: 'pink', rot: (f) => Math.PI * (1 - E.EASE.io(E.clamp((f - OV) / 6, 0, 1))), w: 'small', dy: 30 });
  const anvTop = (S) => { const t = target('lord:top', S); return [t[0], t[1] + 30]; };
  ANV.push({ f0: DROP, f1: FLAT, a: (f, S) => { const hp = hatPose(DROP, statesAt(DROP)); return hatOpen(hp); }, b: (f, S) => [LX1, GROUND - 105] });
  ANV.push({ f0: FLAT, at: [LX1, GROUND - 105] });
  sfx('whoosh', DROP, { x: LX1, dur: 6, gain: 0.5 });
  sfx('slam', FLAT, { who: 'lord', gain: 1.0 }); sfx('bonk', FLAT, { who: 'lord', gain: 0.8 });
  ev('shake', { f: FLAT, amp: 18, n: 12 });
  ev('dust', { f: FLAT, x: LX1, r: 60, n: 8 });
  key('lord', FLAT - 2, { mouth: 'puzzlement', eyes: 'sad' }, 0);
  key('lord', FLAT, { sx: 1.9, sy: 0.35 }, 1);
  ev('stars', { who: 'lord', f0: FLAT + 4, f1: FLAT + 30 });
  key('pink', FLAT + 4, { ...stance('pink', YX, 1), handF: hand('pink', 'F', 0.7, 0.05), mouth: 'happy with theeth', eyes: 'normal' }, 8);
  HAT.push({ f0: FLAT + 4, hand: 'pink', rot: (f) => Math.PI * E.EASE.io(E.clamp((f - FLAT - 4) / 8, 0, 1)), w: 'small', dy: -30 });
  sfx('ref:laugh', FLAT + 4, { who: 'pink', gain: 0.85, pitch: 1.35 });
  chuckle('pink', FLAT + 4, FLAT + 26, { mouth: 'happy with theeth' });

  // ---- 8.3–9.5 с: Лорд «растёт»
  const LX = 1180;
  key('lord', FLAT + 18, { eyes: 'angry', mouth: 'angry theeth' }, 0);
  ev('vein', { who: 'lord', f0: FLAT + 18, f1: FLAT + 28 });
  ANV.push({ f0: FLAT + 20, f1: FLAT + 32, a: [LX1, GROUND - 105], b: [LX1 + 260, GROUND + 200] });
  ANV.push({ f0: FLAT + 32, gone: true });
  key('lord', FLAT + 20, { sx: 1, sy: 1 }, 4, 'out');
  sfx('boing', FLAT + 20, { who: 'lord', gain: 0.6 });
  const LB = transform('lord', FLAT + 22, LX1, LX, -1, { style: 'grow' });
  key('lord', LB, stance('lord', LX, -1), 0);
  key('lord', LB + 6, { mouth: 'angry theeth', eyes: 'angry' }, 0);
  key('pink', LB - 2, { mouth: 'puzzlement', eyes: 'sad' }, 0);

  // ---- 9.6–12.3 с: щелчок — шляпа ему на голову; снимает — радужный луч — Розовая «пуф»
  const SN = LB + 4, ON = SN + 14;
  key('lord', SN - 3, { handF: hand('lord', 'F', 0.45, -0.75) }, 3);
  sfx('flick', SN, { who: 'lord', gain: 1.0 });
  ev('twinkle', { f: SN, at: C.lord.big.point(stateAt(SN).lord.st, 'handF'), n: 14, size: 44 });
  HAT.push({ f0: SN, f1: ON, a: (f, S) => { const hp = hatPose(SN - 1, statesAt(SN - 1)); return [hp.x, hp.y]; }, b: (f, S) => target('lord:hat', S), arc: 110, r0: Math.PI, r1: 2 * Math.PI, w0: 'small', w1: 'big' });
  HAT.push({ f0: ON, on: 'lord' });
  sfx('whoosh', SN + 1, { x: 900, dur: 12, gain: 0.5 });
  sfx('pop', ON, { who: 'lord', gain: 0.7 });
  key('lord', SN + 6, { ...stance('lord', LX, -1), mouth: 'happy with theeth', eyes: 'angry' }, 6);
  key('pink', SN + 4, { handF: hand('pink', 'F', 0.5, 0.2) }, 6);
  const OFFH = ON + 8, AIM = OFFH + 6, Z0 = AIM + 4, Z1 = Z0 + 14;
  key('lord', OFFH, { hitF: 1, hitFto: 'lord:hat', hitFfix: OFFH }, 6);
  HAT.push({ f0: OFFH, hand: 'lord', rot: Math.PI / 2, w: 'big', dx: 40, dy: 0 });
  key('lord', AIM, { hitF: 0, handF: hand('lord', 'F', 0.95, -0.25), lean: 6, mouth: 'theeth smile', eyes: 'angry' }, 5);
  BEAM.push({ f0: Z0, f1: Z1, to: 'pink:body' });
  sfx('zap', Z0, { who: 'pink', gain: 0.9 }); sfx('powerup', Z0, { x: 900, dur: Z1 - Z0, gain: 0.7 });
  key('pink', Z0, { lean: -10, head: -10, mouth: 'puzzlement', eyes: 'sad', handF: hand('pink', 'F', 0.4, -0.6), handB: hand('pink', 'B', -0.4, -0.6) }, 3);
  tremble('pink', Z0 + 2, Z1, YX, 6);
  const ysm = shrink('pink', Z1, YX, 1, { mouth: 'puzzlement', eyes: 'sad', smoke: 420 });
  ev('twinkle', { f: ysm, at: [YX, GROUND - 200], n: 20, size: 60 });
  const BACK = Z1 + 4;
  key('lord', BACK, { hitF: 1, hitFto: (() => { const t = target('lord:top', stateAt(BACK)); return [t[0], t[1] + 40]; })(), hitFfix: BACK, handF: hand('lord', 'F', 0.3, -0.9) }, 5);
  HAT.push({ f0: BACK + 4, on: 'lord' });
  key('lord', BACK + 10, { ...stance('lord', LX, -1), hitF: 0, mouth: 'happy with theeth', eyes: 'normal' }, 6);
  sfx('ref:laugh', BACK + 6, { who: 'lord', gain: 0.85, pitch: 0.95 });
  chuckle('lord', BACK + 6, BACK + 26, { mouth: 'happy with theeth' });

  // ---- 12.3–15.6 с: шарик-Розовая — в лицо Лорду — шляпа слетает ей на голову — «растёт» в шляпе
  key('pink', ysm + 8, { eyes: 'angry', mouth: 'angry theeth' }, 0);
  const J0 = ysm + 10, J1 = J0 + 9, FACE = J1 + 10;
  ST.hop('pink', J0, J1, YX, 900, 100);
  const lf = target('lord:face', stateAt(FACE));
  key('pink', J1 + 1, { pivot: ST.CAST.pink.pivot }, 0);
  move('pink', J1 + 1, { x: 900, y: GROUND, rot: 0 });
  move('pink', J1 + 6, { y: lf[1] + 140 }, 'out2');
  move('pink', FACE, { x: lf[0] - 120, y: lf[1] + 150 }, 'in');
  move('pink', FACE, { rot: 300 }, 'lin');
  key('pink', FACE, { sx: 0.8, sy: 1.2 }, 1);
  sfx('jump', J1 + 2, { who: 'pink', gain: 0.6 });
  sfx('bonk', FACE, { who: 'lord', gain: 1.0 }); sfx('ref:hit-ow', FACE + 2, { who: 'lord', gain: 0.8 });
  ev('shake', { f: FACE, amp: 14, n: 10 });
  key('lord', FACE, { lean: -16, head: -18, hip: [0, toRig('lord', 30)], mouth: 'puzzlement', eyes: 'sad', handF: hand('lord', 'F', 0.45, -0.6), handB: hand('lord', 'B', -0.3, 0.35) }, 2);
  ev('stars', { who: 'lord', f0: FACE + 4, f1: FACE + 40 });
  for (let k = FACE + 6; k < FACE + 36; k += 8) key('lord', k, { head: ((k - FACE) / 8) % 2 < 1 ? -16 : -4 }, 4);
  // шарик отскакивает назад, шляпа слетает и падает ей на голову
  const YX2 = 760, LND = FACE + 14;
  move('pink', FACE + 1, { x: lf[0] - 120, y: lf[1] + 150, rot: 0 });
  move('pink', FACE + 6, { y: lf[1] + 130 }, 'out2');
  move('pink', LND, { x: YX2, y: GROUND }, 'in2');
  move('pink', LND, { rot: -360 }, 'lin'); key('pink', LND + 1, { rot: 0 }, 0);
  key('pink', LND, { sx: 1.25, sy: 0.8 }, 1); key('pink', LND + 4, { sx: 1, sy: 1 }, 3);
  sfx('land', LND, { who: 'pink', gain: 0.6 });
  const HON = LND + 10;
  HAT.push({ f0: FACE + 1, f1: HON, a: (f, S) => target('lord:hat', S), b: (f, S) => { const t = target('pink:top', S); return [t[0], t[1] - hatW('small') * hatImg().asp / 2 + 26]; }, arc: 280, r0: 0, r1: -4 * Math.PI, w0: 'big', w1: 'small' });
  HAT.push({ f0: HON, head: 'pink' });
  sfx('whoosh', FACE + 2, { x: 1000, dur: 14, gain: 0.5 });
  sfx('pop', HON, { who: 'pink', gain: 0.8 });
  key('pink', HON, { sx: 1.12, sy: 0.88, mouth: 'happy with theeth', eyes: 'normal' }, 1); key('pink', HON + 4, { sx: 1, sy: 1 }, 3);
  key('lord', FACE + 40, { ...stance('lord', LX, -1), head: 0, mouth: 'angry theeth', eyes: 'angry' }, 8);
  key('pink', HON + 6, { eyes: 'angry', mouth: 'theeth smile' }, 0);
  const YB2 = transform('pink', HON + 8, YX2, YX2, 1, { style: 'grow' });
  key('pink', YB2, stance('pink', YX2, 1), 0);
  key('pink', YB2 + 6, { mouth: 'theeth smile', eyes: 'angry' }, 0);
  key('lord', YB2 - 2, { mouth: 'puzzlement', eyes: 'sad' }, 0);

  // ---- 15.8–17.4 с: снимает шляпу — Лорда засасывает внутрь — надевает, шляпа дёргается
  const TK = YB2 + 4, HOLD = TK + 6, SU0 = HOLD + 4, SU1 = SU0 + 8, IN = SU1 + 12;
  key('pink', TK, { hitF: 1, hitFto: (() => { const t = target('pink:top', stateAt(TK)); return [t[0], t[1] + 30]; })(), hitFfix: TK, handF: hand('pink', 'F', 0.3, -0.9) }, 4);
  HAT.push({ f0: TK + 2, hand: 'pink', rot: (f) => -Math.PI / 2 * E.EASE.io(E.clamp((f - TK - 2) / 6, 0, 1)), w: 'big', dx: -30, dy: 0 });
  key('pink', HOLD, { hitF: 0, handF: hand('pink', 'F', 0.95, -0.25), lean: 6, mouth: 'theeth smile', eyes: 'angry' }, 5);
  ev('twinkle', { f: SU0, at: C.pink.big.point(stateAt(SU0).pink.st, 'handF'), n: 18, size: 50 });
  sfx('sparkle', SU0, { who: 'pink', gain: 0.8 });
  sfx('suck', SU0, { x: 1000, dur: IN - SU0, gain: 0.9 });
  sfx('scared', SU0 + 2, { who: 'lord', gain: 0.9 });
  const KL = C.lord.big;
  key('lord', SU0, { lean: 20, head: 6, legFfk: 1, legBfk: 1, legF: [-30, 30], legB: [-10, 10], handF: hand('lord', 'F', 0.9, -0.3), handB: hand('lord', 'B', 0.7, -0.4), mouth: 'puzzlement', eyes: 'sad' }, 3);
  move('lord', SU0, { x: LX, y: GROUND });
  move('lord', SU1, { x: LX - 80 }, 'in');
  const mouthAt = (() => { const hp = hatPose(SU1, stateAt(SU1)); return hatOpen(hp); })();
  key('lord', SU1, { pivot: (KL.anchor[1] - KL.top) / 2, rot: 0 }, 0);
  move('lord', SU1, { x: LX - 80, y: GROUND, rot: 0 });
  move('lord', IN, { x: mouthAt[0] + 40, y: mouthAt[1] + 360 * 0.06, rot: -720 }, 'in');
  key('lord', IN, { sx: 0.06, sy: 0.06 }, IN - SU1, 'in');
  key('lord', IN + 1, { alpha: 0 }, 0);
  ev('suck', { f0: SU0, f1: IN, at: (() => mouthAt)(), x0: LX - 300 });
  sfx('pop', IN, { x: mouthAt[0], gain: 0.9 });
  // надевает
  const PUT = IN + 6;
  key('pink', IN + 2, { hitF: 1, hitFto: (() => { const t = target('pink:top', stateAt(PUT)); return [t[0], t[1] + 30]; })(), hitFfix: PUT, lean: 0, handF: hand('pink', 'F', 0.3, -0.9) }, 4);
  HAT.push({ f0: IN + 2, hand: 'pink', rot: (f) => -Math.PI / 2 + Math.PI / 2 * E.EASE.io(E.clamp((f - IN - 2) / 4, 0, 1)), w: 'big', dx: -30, dy: 0 });
  HAT.push({ f0: PUT, head: 'pink' });
  sfx('pop', PUT, { who: 'pink', gain: 0.8 });
  key('pink', PUT + 4, { ...stance('pink', YX2, 1), hitF: 0, mouth: 'happy with theeth', eyes: 'normal' }, 6);
  WIG.push([PUT + 8, PUT + 18], [PUT + 34, PUT + 42], [PUT + 70, PUT + 78]);
  for (const [a] of WIG) sfx('bonk', a, { who: 'pink', gain: 0.35, pitch: 1.6 });
  sfx('ref:laugh', PUT + 6, { who: 'pink', gain: 0.85, pitch: 1.35 });

  // ---- 17.5–22 с: в центр, руки вверх
  const WIN = victory('pink', PUT + 16, YX2, { n: 9, stride: 100 });
  window.T = { H1, SP1, YB, PK, FLAT, LB, ON, Z1, ysm, FACE, HON, YB2, IN, PUT, WIN };
};

// ------------------------------------------------------------------ рисование
ST.hooks.beforeChars.push((ctx, f, S, CAM) => {
  ctx.setTransform(...CAM);
  for (const p of PIE) if (p.at && f >= p.f0 && !PIE.some((q) => q.f0 > p.f0 && f >= q.f0)) FX.pie(ctx, p.at[0], p.at[1], 110, p.rot || 0);
});
ST.hooks.afterChars.push((ctx, f, S, CAM) => {
  ctx.setTransform(...CAM);
  const hp = hatPose(f, S);
  if (hp && !hp.on && hatSeg(f).at) {
    // пружина из шляпы
    for (const s of SPR) {
      if (f < s.f0 || f >= s.f3) continue;
      const base = hatOpen(hp), tgt = s.to(statesAt(s.f1));
      const ext = f < s.f1 ? (f - s.f0) / (s.f1 - s.f0) : f < s.f2 ? 1 : 1 - (f - s.f2) / (s.f3 - s.f2);
      const dx = tgt[0] - base[0], dy = tgt[1] - base[1], L = Math.hypot(dx, dy) - 50, rot = Math.atan2(dx, -dy);
      FX.coilSpring(ctx, base[0], base[1], Math.max(16, L * ext), 70, rot);
      if (f < s.f1 + 2) FX.pie(ctx, base[0] + Math.sin(rot) * (L * ext + 30), base[1] - Math.cos(rot) * (L * ext + 30), 110, rot);
    }
  }
});
ST.hooks.afterChars.push((ctx, f, S, CAM) => {
  ctx.setTransform(...CAM);
  for (const s of SPLAT) {
    if (f < s.f0 || (s.f1 && f >= s.f1)) continue;
    const h = target(`${s.who}:head`, S), fc = target(`${s.who}:face`, S), k = Math.min(1, (f - s.f0 + 1) / 3);
    FX.gumSplat(ctx, E.lerp(h[0], fc[0], 0.35), E.lerp(h[1], fc[1], 0.6) - 10, s.s * Math.min(1, k + 0.3), s.seed, '#fffdf5', '#bfa98a');
  }
  for (const p of PIE) {
    if (f < p.f0 || p.at || p.gone || PIE.some((q) => q.f0 > p.f0 && f >= q.f0)) continue;
    const u = E.clamp((f - p.f0) / (p.f1 - p.f0), 0, 1), a = P(p.a, p.f0, statesAt(p.f0)), b = P(p.b, f, S);
    FX.pie(ctx, E.lerp(a[0], b[0], u), E.lerp(a[1], b[1], u) - Math.sin(Math.PI * u) * p.arc, 110, u * p.spin);
  }
  for (const a of ANV) {
    if (f < a.f0 || a.gone || ANV.some((q) => q.f0 > a.f0 && f >= q.f0)) continue;
    if (a.at) { FX.anvil(ctx, a.at[0], a.at[1] + 105 * 0.62 / 2 * 0, 170); continue; }
    const u = E.clamp((f - a.f0) / (a.f1 - a.f0), 0, 1), p0 = P(a.a, a.f0, statesAt(a.f0)), p1 = P(a.b, f, S);
    FX.anvil(ctx, E.lerp(p0[0], p1[0], u), E.lerp(p0[1], p1[1], E.EASE.in2(u)), 170, u * (p1[0] > p0[0] ? 1.2 : 0));
  }
  for (const b of BEAM) {
    if (f < b.f0 || f >= b.f1) continue;
    const hp = hatPose(f, S);
    if (!hp || hp.on) continue;
    const a = hatOpen(hp), to = target(b.to, S), u = (f - b.f0) / (b.f1 - b.f0);
    FX.magicBeam(ctx, a, to, f / FPS, Math.min(1, u * 4), Math.min(1, (b.f1 - f) / 4));
  }
  const hp = hatPose(f, S);
  if (hp && !hp.on && !hatSeg(f).at) drawHat(ctx, hp);
});
ST.hooks.beforeChars.push((ctx, f, S, CAM) => {
  ctx.setTransform(...CAM);
  const hp = hatPose(f, S);
  if (hp && !hp.on && hatSeg(f).at) drawHat(ctx, hp);
});

ST.start(BIG);
