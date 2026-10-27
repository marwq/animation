// Серия 2, ролик 06: Эндер-жемчуг — Розовая (слева) против Радужного (справа), 22 с, 24 кадра/с. Драка без ударов:
// эндер-жемчуг из майнкрафта: куда упал — туда переносит того, кто бросил (фиолетовые искры).
// Музыка превращения — один раз. Фон — джунгли.
//
//   0–2 с     шарик-Розовая и радужный шарик неподвижно стоят друг напротив друга, середина пустая
//   2–4 с     Радужный плюёт жемчугом за спину Розовой — исчезает и появляется позади — толкает её кувырком
//   4–5.2 с   Розовая «растёт» под музыку — Радужный влюблён
//   5.4–8 с   она бросает жемчуг высоко над ним — переносится в небо и падает на него — он в лепёшку
//   8–9.4 с   Радужный «растёт»
//   9.6–12 с  бросает жемчуг ей под ноги — появляется на её месте — она отлетает — «пуф»
//   12.2–15.8 с шарик-Розовая хватает выпавший жемчуг ртом, плюёт в небо над ним — переносится, в воздухе
//             становится большой — бух! — Радужного подбрасывает — «пуф», шарик удирает за край
//   16–22 с   Розовая в центре, руки вверх
'use strict';

const ST = Stage({
  name: '06 Розовая vs Радужный',
  frames: 528,
  cast: {
    pink: { small: ['girl-verity-small', { bodyHeight: 300 }], big: ['girl-verity-big', { height: 730, splitFeet: true }],
      pivot: 337, voice: 1.35, vAngle: 50, lie: 55, color: '#ff4fc8', moods: { angry: 'angry theeth', grin: 'theeth smile', big: 'theeth smile' } },
    rb: { small: ['skeleton-verity-small', { scale: 0.455, recolor: 'rainbow' }], big: ['all-verity-color', { height: 730 }],
      pivot: 325, voice: 0.85, lie: 55, color: '#ff7a3a', moods: { angry: 'angry theeth', grin: 'happy with theeth', big: 'theeth smile', love: 'happy - spittle' } },
  },
  order: ['rb', 'pink'],
  background: { theme: 'jungle', seed: 1006, sunX: 1500, sunY: 130 },
  clouds: [[150, 80, 2.4, 0, 12], [700, 220, 1.8, 1, 16], [1150, 70, 2.6, 2, 10], [1720, 250, 1.5, 0, 18]],
});
const { FPS, NF, GROUND, C, key, move, ev, sfx, hop, tumble, laugh, tremble, transform, shrink, stance, walk, turn,
  fallBack, victory, chuckle, hand, toRig, statesAt, stateAt, target } = ST;
const P = (v, f, S) => (typeof v === 'function' ? v(f, S) : typeof v === 'string' ? target(v, S) : v);
ST.parts.mouth = (ch, st, p) => {
  const name = ch.layers.some((l) => l.name === p.mouth) ? p.mouth : 'smile normal', l = ch.layers.find((x) => x.name === name);
  return l ? E.apply(ch.eyeMatrix(st, name), [(l.bbox[0] + l.bbox[2]) / 2, (l.bbox[1] + l.bbox[3]) / 2]) : ST.parts.lips(ch, st);
};

// ------------------------------------------------------------------ жемчуг и телепорт
const PRL = [];           // {segs: [{f0, on, part, dx, dy} | {f0, hand} | {f0, f1, a, b, arc} | {f0, at} | {f0, gone}]}
const PUFF = [];          // {f, x, y, h}
function pAt(Pr, f, S) {
  let c = null;
  for (const s of Pr.segs) if (f >= s.f0) c = s;
  if (!c || c.gone) return null;
  if (c.at) return c.at;
  if (c.on) { const p = target(`${c.on}:${c.part}`, S); return [p[0] + (c.dx || 0) * (S[c.on].p.face || 1), p[1] + (c.dy || 0)]; }
  if (c.hand) { if (S[c.hand].p.form !== 'big') return null; const h = C[c.hand].big.point(S[c.hand].st, 'handF'); return [h[0], h[1] - 20]; }
  const u = E.clamp((f - c.f0) / (c.f1 - c.f0), 0, 1), a = P(c.a, c.f0, statesAt(c.f0)), b = P(c.b, f, S);
  return [E.lerp(a[0], b[0], u), E.lerp(a[1], b[1], u) - Math.sin(Math.PI * u) * (c.arc || 0)];
}
// исчезнуть в (x0) и появиться в (x1, y1): альфа 0 на 2 кадра, фиолетовые искры
function teleport(who, f, x0, x1, y1 = GROUND, h = 300) {
  PUFF.push({ f, x: x0, y: GROUND, h }, { f: f + 2, x: x1, y: y1, h });
  key(who, f, { alpha: 0 }, 0);
  key(who, f + 2, { alpha: 1, x: x1, y: y1 }, 0);
  move(who, f + 2, { x: x1, y: y1 });
  sfx('zap', f, { x: x0, gain: 0.7 }); sfx('sparkle', f + 2, { x: x1, gain: 0.9 }); sfx('whoosh', f, { x: (x0 + x1) / 2, dur: 4, gain: 0.5 });
}

const PX0 = 560, RX0 = 1360;
// ================================================================== 0–2 с: неподвижная стойка
key('pink', 0, { form: 'small', x: PX0, y: GROUND, face: 1, look: 1, eyes: 'normal', mouth: 'smile normal', sx: 1, sy: 1, rot: 0, pivot: 0, alpha: 1 }, 0);
key('rb', 0, { form: 'small', x: RX0, y: GROUND, face: -1, look: 1, eyes: 'normal', mouth: 'smile normal', sx: 1, sy: 1, rot: 0, pivot: 0, alpha: 1 }, 0);

const BIG = () => {
  // ---- 2–4 с: жемчуг за спину Розовой — телепорт — толчок сзади
  const P1 = { segs: [] };
  PRL.push(P1);
  key('rb', 48, { mouth: 'happy with theeth', eyes: 'angry' }, 0);
  sfx('ref:grin-eee', 48, { who: 'rb', gain: 0.4, pitch: 1.1 });
  P1.segs.push({ f0: 48, on: 'rb', part: 'mouth', dx: 20, dy: 6 });
  ev('twinkle', { f: 48, at: [RX0 - 40, GROUND - 130], n: 10, size: 34 });
  const SP = 56, LP = SP + 14, LX = 200;
  key('rb', SP - 4, { sx: 1.14, sy: 0.9 }, 4); key('rb', SP, { sx: 0.88, sy: 1.12 }, 1); key('rb', SP + 4, { sx: 1, sy: 1 }, 3);
  sfx('spit', SP, { who: 'rb', gain: 0.9 });
  P1.segs.push({ f0: SP, f1: LP, a: (f, S) => { const m = target('rb:mouth', S); return [m[0] - 20, m[1]]; }, b: [LX, GROUND - 24], arc: 380 }, { f0: LP, gone: true });
  sfx('whoosh', SP + 2, { x: 900, dur: 12, gain: 0.5 }); sfx('pop', LP, { x: LX, gain: 0.7 });
  key('pink', SP + 4, { mouth: 'puzzlement', look: 1 }, 0);
  teleport('rb', LP, RX0, LX, GROUND, 260);
  key('rb', LP + 2, { face: 1 }, 0);
  key('pink', LP + 4, { face: -1 }, 0); key('pink', LP + 8, { face: 1 }, 0);
  // разгон и толчок в спину
  const PU = LP + 12;
  key('rb', PU - 4, { sx: 1.2, sy: 0.84 }, 4);
  move('rb', PU - 2, { x: LX }); move('rb', PU, { x: PX0 - 140 }, 'in');
  key('rb', PU, { sx: 0.8, sy: 1.2 }, 1); key('rb', PU + 4, { sx: 1, sy: 1 }, 3);
  sfx('bonk', PU, { who: 'pink', gain: 1.0 });
  key('pink', PU, { mouth: 'puzzlement', eyes: 'sad' }, 0);
  tumble('pink', PU, PU + 14, PX0, 820, 140, 1, { stars: 16 });
  move('rb', PU + 6, { x: PX0 - 200 }, 'out');
  key('rb', PU + 4, { mouth: 'happy with theeth', eyes: 'normal' }, 0);
  sfx('ref:laugh', PU + 6, { who: 'rb', gain: 0.85, pitch: 1.0 });
  laugh('rb', PU + 6, PU + 26);

  // ---- 4–5.2 с: Розовая «растёт» — Радужный влюблён
  const PX = 840;
  key('pink', PU + 14, { eyes: 'angry', mouth: 'angry theeth', face: -1 }, 0);
  const PB = transform('pink', PU + 16, 820, PX, -1, { style: 'grow', love: 'rb', loveDur: 40 });
  key('pink', PB, stance('pink', PX, -1), 0);
  key('pink', PB + 6, { mouth: 'theeth smile', eyes: 'angry' }, 0);

  // ---- 5.4–8 с: жемчуг высоко над ним — она в небе — падает на него
  const RX1 = 470;
  hop('rb', PB + 4, PB + 14, PX0 - 200, RX1, 90);
  const SN = PB + 10;
  key('pink', SN - 3, { handF: hand('pink', 'F', 0.45, -0.75) }, 3);
  sfx('flick', SN, { who: 'pink', gain: 0.9 });
  ev('twinkle', { f: SN, at: C.pink.big.point(stateAt(SN).pink.st, 'handF'), n: 12, size: 40 });
  const P2 = { segs: [{ f0: SN, hand: 'pink' }] };
  PRL.push(P2);
  const TH = SN + 10, TOP = TH + 12, SKY = [RX1 + 40, 150];
  key('pink', TH - 4, { handF: hand('pink', 'F', -0.3, -0.6), lean: -8 }, 4);
  key('pink', TH, { handF: hand('pink', 'F', 0.6, -0.9), lean: 4 }, 3, 'in2');
  sfx('swing', TH - 2, { who: 'pink', gain: 0.8 }); sfx('whoosh', TH, { x: 700, dur: 12, gain: 0.5 });
  P2.segs.push({ f0: TH, f1: TOP, a: (f, S) => pAt(P2, TH - 1, statesAt(TH - 1)), b: SKY, arc: 120 }, { f0: TOP, gone: true });
  key('rb', TH + 4, { look: 1, mouth: 'happy - spittle' }, 0);
  // телепорт в небо: большая висит над ним, ноги поджаты, и падает
  const AIR = GROUND - 620;
  teleport('pink', TOP, PX, RX1 + 40, AIR, 420);
  key('pink', TOP + 2, { ...C.pink.big.feet(RX1 + 40, -1), legFfk: 1, legBfk: 1, legF: [-10, 40], legB: [10, -30],
    handF: hand('pink', 'F', 0.6, -0.8), handB: hand('pink', 'B', -0.6, -0.8), lean: 0, mouth: 'theeth smile', eyes: 'angry' }, 0);
  const FALL = TOP + 4, HIT = FALL + 8;
  move('pink', FALL, { y: AIR }); move('pink', HIT, { y: GROUND }, 'in2');
  key('rb', TOP + 4, { mouth: 'puzzlement', eyes: 'sad' }, 0);
  key('rb', HIT, { sx: 2.0, sy: 0.32 }, 1);
  key('pink', HIT, { ...stance('pink', RX1 + 40, -1), legFfk: 0, legBfk: 0, hip: [0, toRig('pink', 90)], sx: 1.06, sy: 0.94 }, 1);
  key('pink', HIT + 8, { ...stance('pink', RX1 + 40, -1), hip: [0, 8], sx: 1, sy: 1, mouth: 'happy with theeth', eyes: 'angry' }, 6);
  sfx('slam', HIT, { who: 'rb', gain: 1.0 }); sfx('squish', HIT, { who: 'rb', gain: 0.9 });
  ev('shake', { f: HIT, amp: 20, n: 14 }); ev('dust', { f: HIT, x: RX1 + 40, r: 80, n: 8, snd: false });
  // отходит с лепёшки
  const PX2 = 860;
  walk('pink', HIT + 10, RX1 + 40, PX2, 2, 8, 1);
  key('rb', HIT + 26, { sx: 2.0, sy: 0.32 }, 0);
  sfx('ref:laugh', HIT + 12, { who: 'pink', gain: 0.85, pitch: 1.35 });

  // ---- 8–9.4 с: Радужный «растёт»
  const RX = 420;
  key('rb', HIT + 28, { sx: 1, sy: 1, eyes: 'angry', mouth: 'angry theeth' }, 5, 'out');
  sfx('boing', HIT + 28, { who: 'rb', gain: 0.7 });
  turn('pink', HIT + 28, -1, PX2);
  const RB = transform('rb', HIT + 32, RX1, RX, 1, { style: 'grow' });
  key('rb', RB, stance('rb', RX, 1), 0);
  key('rb', RB + 6, { mouth: 'happy with theeth', eyes: 'angry' }, 0);
  key('pink', RB - 2, { mouth: 'puzzlement', eyes: 'sad' }, 0);

  // ---- 9.6–12 с: жемчуг ей под ноги — он на её месте — она отлетает — «пуф»
  const SN2 = RB + 4;
  key('rb', SN2 - 3, { handF: hand('rb', 'F', 0.45, -0.75) }, 3);
  sfx('flick', SN2, { who: 'rb', gain: 0.9 });
  const P3 = { segs: [{ f0: SN2, hand: 'rb' }] };
  PRL.push(P3);
  const TH2 = SN2 + 10, LP2 = TH2 + 12;
  key('rb', TH2 - 4, { handF: hand('rb', 'F', -0.4, -0.5), lean: -8 }, 4);
  key('rb', TH2, { handF: hand('rb', 'F', 0.95, -0.1), lean: 12 }, 3, 'in2');
  sfx('swing', TH2 - 2, { who: 'rb', gain: 0.8 });
  P3.segs.push({ f0: TH2, f1: LP2, a: (f, S) => pAt(P3, TH2 - 1, statesAt(TH2 - 1)), b: [PX2 - 10, GROUND - 24], arc: 160 }, { f0: LP2, gone: true });
  sfx('pop', LP2, { x: PX2, gain: 0.7 });
  key('pink', LP2 - 6, { look: 1, head: 10, mouth: 'puzzlement' }, 3);
  teleport('rb', LP2, RX, PX2 - 10, GROUND, 420);
  key('rb', LP2 + 2, { ...stance('rb', PX2 - 10, 1), lean: 0, mouth: 'happy with theeth', eyes: 'angry' }, 0);
  sfx('bonk', LP2 + 2, { who: 'pink', gain: 1.0 });
  ev('shake', { f: LP2 + 2, amp: 16, n: 10 });
  // она отлетает вправо
  const KB = C.pink.big;
  key('pink', LP2 + 2, { pivot: (KB.anchor[1] - KB.top) / 2, legFfk: 1, legBfk: 1, legF: [-30, 50], legB: [25, -40], mouth: 'puzzlement', eyes: 'sad',
    handF: hand('pink', 'F', -0.3, -0.8), handB: hand('pink', 'B', -0.7, -0.5), head: -10 }, 1);
  move('pink', LP2 + 2, { x: PX2 + 120, y: GROUND, rot: 0 });
  move('pink', LP2 + 10, { x: PX2 + 360, y: GROUND - 260, rot: 200 }, 'out2');
  move('pink', LP2 + 18, { x: PX2 + 500, y: GROUND - 60, rot: 360 }, 'in2');
  sfx('whoosh', LP2 + 2, { who: 'pink', dur: 16, gain: 0.7 }); sfx('scared', LP2 + 3, { who: 'pink', gain: 0.8 });
  const psm = shrink('pink', LP2 + 18, PX2 + 500, -1, { mouth: 'puzzlement', eyes: 'sad', smoke: 420 });
  key('pink', psm, { rot: 0, pivot: 0, legF: null, legB: null, head: 0 }, 0);
  move('pink', psm, { x: PX2 + 500, y: GROUND, rot: 0 });
  ev('stars', { who: 'pink', f0: psm + 4, f1: psm + 22, snd: false });
  sfx('ref:laugh', LP2 + 8, { who: 'rb', gain: 0.85, pitch: 1.0 });
  chuckle('rb', LP2 + 8, LP2 + 32, { mouth: 'happy with theeth' });
  // у него из руки выпадает ещё жемчуг и катится
  const DR = LP2 + 16, RL = 1180;
  const P4 = { segs: [{ f0: DR, f1: DR + 16, a: (f, S) => C.rb.big.point(S.rb.st, 'handB'), b: [RL, GROUND - 24], arc: 60 }, { f0: DR + 16, at: [RL, GROUND - 24] }] };
  PRL.push(P4);
  sfx('pop', DR, { who: 'rb', gain: 0.4 }); sfx('land', DR + 16, { x: RL, gain: 0.4, pitch: 1.4 });

  // ---- 12.2–15.8 с: шарик-Розовая хватает жемчуг, плюёт в небо — в воздухе большая — бух
  key('pink', psm + 8, { eyes: 'angry', mouth: 'theeth smile' }, 0);
  const J0 = psm + 10, J1 = J0 + 10;
  hop('pink', J0, J1, PX2 + 500, RL + 70, 80);
  P4.segs.push({ f0: J1, on: 'pink', part: 'mouth', dx: 20, dy: 6 });
  sfx('chomp', J1, { who: 'pink', gain: 0.6 });
  const SP2 = J1 + 8, TOP2 = SP2 + 12, SKY2 = [PX2 + 220, 120];
  key('pink', SP2 - 4, { sx: 1.14, sy: 0.9 }, 4); key('pink', SP2, { sx: 0.88, sy: 1.12 }, 1); key('pink', SP2 + 4, { sx: 1, sy: 1 }, 3);
  sfx('spit', SP2, { who: 'pink', gain: 0.9 });
  P4.segs.push({ f0: SP2, f1: TOP2, a: (f, S) => target('pink:mouth', S), b: SKY2, arc: 80 }, { f0: TOP2, gone: true });
  key('rb', SP2 + 4, { look: 1, head: -10, mouth: 'puzzlement', eyes: 'normal' }, 4);
  teleport('pink', TOP2, RL + 70, SKY2[0], 260, 260);
  // в воздухе становится большой
  const BIGF = TOP2 + 6, AIR2 = GROUND - 650;
  ev('flash', { f: BIGF, who: 'pink', strength: 0.4 }); ev('smoke', { f: BIGF, who: 'pink', size: 260, dx: 0, y: 140 });
  sfx('grow', BIGF, { who: 'pink', gain: 0.9 }); sfx('poof', BIGF, { who: 'pink', gain: 0.8 });
  key('pink', BIGF, { form: 'big', x: SKY2[0], y: AIR2, face: -1, rot: 0, pivot: 0, sx: 1, sy: 1, look: 1, ...KB.feet(SKY2[0], -1), legFfk: 1, legBfk: 1, legF: [-10, 40], legB: [10, -30],
    hip: [0, 8], lean: 0, head: 0, handF: hand('pink', 'F', 0.6, -0.8), handB: hand('pink', 'B', -0.6, -0.8), mouth: 'theeth smile', eyes: 'angry' }, 0);
  move('pink', BIGF, { x: SKY2[0], y: AIR2 });
  const BOOM = BIGF + 10;
  move('pink', BOOM, { y: GROUND }, 'in2');
  key('pink', BOOM, { ...stance('pink', SKY2[0], -1), hip: [0, toRig('pink', 90)], legFfk: 0, legBfk: 0 }, 1);
  key('pink', BOOM + 8, { ...stance('pink', SKY2[0], -1), hip: [0, 8], mouth: 'happy with theeth', eyes: 'angry' }, 6);
  sfx('slam', BOOM, { x: SKY2[0], gain: 1.1 }); ev('shake', { f: BOOM, amp: 24, n: 16 }); ev('dust', { f: BOOM, x: SKY2[0], r: 100, n: 10, snd: false });
  // Радужного подбрасывает ударной волной — падает — «пуф»
  const KR = C.rb.big;
  key('rb', BOOM, { pivot: (KR.anchor[1] - KR.top) / 2, legFfk: 1, legBfk: 1, legF: [-30, 50], legB: [25, -40], mouth: 'puzzlement', eyes: 'sad',
    handF: hand('rb', 'F', -0.3, -0.8), handB: hand('rb', 'B', -0.7, -0.5) }, 1);
  move('rb', BOOM, { x: PX2 - 10, y: GROUND, rot: 0 });
  move('rb', BOOM + 10, { x: PX2 - 260, y: GROUND - 300, rot: -220 }, 'out2');
  move('rb', BOOM + 20, { x: PX2 - 420, y: GROUND - 60, rot: -360 }, 'in2');
  sfx('scared', BOOM + 2, { who: 'rb', gain: 0.8 });
  const rsm = shrink('rb', BOOM + 20, PX2 - 420, 1, { mouth: 'puzzlement', eyes: 'sad', smoke: 420 });
  key('rb', rsm, { rot: 0, pivot: 0, legF: null, legB: null }, 0);
  move('rb', rsm, { x: PX2 - 420, y: GROUND, rot: 0 });
  ev('stars', { who: 'rb', f0: rsm + 4, f1: rsm + 20, snd: false });
  sfx('ref:laugh', BOOM + 10, { who: 'pink', gain: 0.85, pitch: 1.35 });
  chuckle('pink', BOOM + 10, BOOM + 30, { mouth: 'happy with theeth' });
  // последний жемчуг: хочет за спину ей — а падает прямо перед ней — появляется у неё под носом — щелчок
  const P5 = { segs: [] };
  PRL.push(P5);
  key('rb', rsm + 10, { eyes: 'angry', mouth: 'angry theeth' }, 0);
  P5.segs.push({ f0: rsm + 10, on: 'rb', part: 'mouth', dx: 20, dy: 6 });
  const SP3 = rsm + 18, LP3 = SP3 + 12, FX3 = SKY2[0] - 270;
  key('rb', SP3 - 4, { sx: 1.14, sy: 0.9 }, 4); key('rb', SP3, { sx: 0.88, sy: 1.12 }, 1); key('rb', SP3 + 4, { sx: 1, sy: 1 }, 3);
  sfx('spit', SP3, { who: 'rb', gain: 0.9 });
  P5.segs.push({ f0: SP3, f1: LP3, a: (f, S) => target('rb:mouth', S), b: [FX3, GROUND - 24], arc: 150 }, { f0: LP3, gone: true });
  key('pink', SP3 + 4, { mouth: 'puzzlement', eyes: 'normal', head: 8 }, 3);
  teleport('rb', LP3, PX2 - 420, FX3, GROUND, 260);
  key('rb', LP3 + 2, { face: 1, mouth: 'puzzlement', eyes: 'sad' }, 0);
  key('rb', LP3 + 4, { sx: 0.9, sy: 1.1 }, 2); key('rb', LP3 + 8, { sx: 1, sy: 1 }, 3);
  const FL = LP3 + 12;
  key('pink', FL - 5, { lean: 16, hip: [0, toRig('pink', 120)], head: 6, handF: hand('pink', 'F', 0.6, 0.2), mouth: 'theeth smile', eyes: 'angry' }, 5);
  key('pink', FL, { hitF: 1, hitFto: (() => { const b = target('rb:body', stateAt(FL)); return [b[0] + 60, b[1]]; })(), hitFfix: FL }, 2, 'in2');
  key('pink', FL + 8, { ...stance('pink', SKY2[0], -1), hitF: 0, mouth: 'happy with theeth', eyes: 'normal' }, 8);
  sfx('flick', FL, { who: 'rb', gain: 1.0 });
  key('rb', FL, { pivot: ST.CAST.rb.pivot }, 0);
  move('rb', FL, { x: FX3, y: GROUND, rot: 0 }); move('rb', FL + 22, { x: -300, y: -150, rot: -900 }, 'out');
  sfx('whoosh', FL, { who: 'rb', dur: 18, gain: 0.7 }); sfx('scared', FL + 2, { who: 'rb', gain: 0.8 });
  ev('twinkle', { f: FL + 18, at: [110, 160], n: 20, size: 56 });
  sfx('ref:laugh', FL + 4, { who: 'pink', gain: 0.85, pitch: 1.35 });

  // ---- 16–22 с: в центр, руки вверх
  const WIN = victory('pink', FL + 20, SKY2[0], { n: 9, stride: 100 });
  window.T = { LP, PU, PB, TOP, HIT, RB, LP2, psm, TOP2, BIGF, BOOM, rsm, WIN };
};

// ------------------------------------------------------------------ рисование
ST.hooks.afterChars.push((ctx, f, S, CAM) => {
  ctx.setTransform(...CAM);
  for (const Pr of PRL) { const p = pAt(Pr, f, S); if (p) FX.enderPearl(ctx, p[0], p[1], 26, f / FPS); }
  for (const u of PUFF) FX.teleportPuff(ctx, u.x, u.y, (f - u.f) / 16, u.h, u.f);
});

ST.start(BIG);
