// Ролик 12: Жвачка — Розовая против Малыша, 25 с, 24 кадра/с, звуковые эффекты без музыки,
// по стилю «animal hospital long» (docs/animal_hospital_long.md).
//
//   0–4 с     шарик-Розовая (слева) и шарик-Малыш (справа) неподвижно смотрят друг на друга
//   4–5 с     Малыш сразу становится большим, жуёт жвачку
//   6–8 с     надувает огромный пузырь — шарик-Розовая прыгает ему на ногу, пузырь лопается
//             ему на лицо
//   8.5–10 с  вслепую идёт вперёд, спотыкается о шарик и падает на него — шарик в лепёшку
//   10.5–13 с встаёт, отдирает жвачку; шарик-Розовая злится и становится большой — он влюблён
//   13.5–16 с подходит и надувает ей пузырь — она лопает его пальцем, жвачка снова на лице
//   16.5–20 с она жуёт и надувает свой пузырь — он прилипает к Малышу и уносит его в небо, блеск
//   20–25 с   Розовая в центре, руки вверх
'use strict';

const ST = Stage({
  name: 'v12-bubble-gum',
  cast: {
    pink: { small: ['girl-verity-small', { bodyHeight: 300 }], big: ['girl-verity-big', { height: 730, splitFeet: true }],
      pivot: 337, voice: 1.35, vAngle: 50, moods: { angry: 'sad', grin: 'theeth smile', big: 'smile normal' } },
    baby: { small: ['child-verity-pink', { bodyHeight: 300, spin: { layer: 'hat', cut: 122, axis: 389 } }],
      big: ['child-verity-big', { height: 730, spin: { layer: 'hat', cut: 106, axis: 330 } }], pivot: 338, voice: 1.25,
      lie: 70, moods: { angry: ' 5', grin: ' 2', big: 'mouth' } },
  },
  order: ['pink', 'baby'],
  background: { sky: ['#55acf3', '#b5d3f5', '#f6e1d6'], seed: 163 },
  clouds: [[200, 70, 1.1, 2, 21], [640, 190, 0.9, 1, 27], [1060, 100, 1.0, 0, 24], [1450, 230, 0.8, 2, 30],
    [1820, 80, 1.2, 1, 19], [380, 300, 0.7, 0, 26]],
});
const { GROUND, C, key, move, ev, sfx, hop, tumble, laugh, tremble, transform, love, stance, walk, turn,
  strike, kick, dodge, duck, recoil, fallBack, getUp, flyOff, victory, chuckle, hand, toRig, statesAt, stateAt, target } = ST;

// ------------------------------------------------------------------ пузыри и кляксы
// пузырь: кто надувает, кадры роста f0..f1 до радиуса r, лопнул в fPop (или прилип к stick с fStick)
const BUBBLES = [], SPLATS = [];
const bubbleAt = (b, f) => {
  if (f < b.f0) return null;
  if (b.fPop !== undefined && f >= b.fPop) return null;
  const u = E.clamp((f - b.f0) / (b.f1 - b.f0), 0, 1);
  const r = b.r * (u < 1 ? E.EASE.out2(u) : 1 + 0.03 * Math.sin((f - b.f1) * 0.7));
  const S = statesAt(f);
  const lp = target(`${b.who}:lips`, S), d = S[b.who].p.face || 1;
  const atMouth = { x: lp[0] + d * r * 0.92, y: lp[1], r };
  if (b.stick && f >= b.fStick) {                   // прилип к другому и всплыл ему над головой, как шарик
    const tp = target(`${b.stick}:top`, S), ds = S[b.stick].p.face || 1;
    const over = { x: tp[0] + ds * r * 0.25, y: tp[1] - r * 0.45, r };
    const k = E.EASE.io(E.clamp((f - b.fStick) / 8, 0, 1));
    const m0 = bubbleAt({ ...b, stick: null }, b.fStick);
    return { x: E.lerp(m0.x, over.x, k), y: E.lerp(m0.y, over.y, k), r };
  }
  return atMouth;
};
// клякса на лице who с f0; peel: отдирает рукой с f1 до f2 и бросает
const splatAt = (sp, f) => {
  if (f < sp.f0 || (sp.f3 && f > sp.f3)) return null;
  const S = statesAt(f), fc = target(`${sp.who}:face`, S);
  const s = sp.size * Math.min(1, (f - sp.f0 + 1) / 3);
  if (!sp.f1 || f < sp.f1) return { x: fc[0], y: fc[1], s };
  const h = C[sp.who].big.point(S[sp.who].st, 'handF');
  if (f < sp.f2) {
    const u = (f - sp.f1) / (sp.f2 - sp.f1);
    return { x: E.lerp(fc[0], h[0], u), y: E.lerp(fc[1], h[1], u), s: s * E.lerp(1, 0.35, u) };
  }
  const v = f - sp.f2;                              // бросил: летит по дуге и пропадает
  return { x: h[0] + 22 * v, y: h[1] - 18 * v + 1.6 * v * v, s: s * 0.35 };
};

// ================================================================== 0–4 с: стойка
key('pink', 0, { form: 'small', x: 560, y: GROUND, face: 1, look: 1, eyes: 'angry', mouth: 'smile normal', sx: 1, sy: 1, rot: 0 }, 0);
key('baby', 0, { form: 'small', x: 1360, y: GROUND, face: -1, look: 1, eyes: 'angry', mouth: ' 1', sx: 1, sy: 1, rot: 0 }, 0);

// ================================================================== 4–5 с: Малыш большой
const BX = 1250;
const BB = transform('baby', 96, 1360, BX, -1, { fast: true });
key('pink', BB, { mouth: 'puzzlement', eyes: 'sad' }, 0);
sfx('scared', BB + 2, { who: 'pink', gain: 0.7 });
key('pink', 148, { mouth: 'angry theeth', eyes: 'angry' }, 0);

// ================================================================== 6–8 с: прыжок на ногу — пузырь лопнул
hop('pink', 150, 162, 560, 760, 70);
hop('pink', 166, 178, 760, 900, 70);
const STOMP = 196, POP1 = 199;
key('pink', 182, { sx: 1.25, sy: 0.78 }, 4);
const B1 = { who: 'baby', f0: 150, f1: 190, r: 150, fPop: POP1 };
BUBBLES.push(B1);
SPLATS.push({ who: 'baby', f0: POP1, size: 230, f1: 278, f2: 288, f3: 312 });
sfx('inflate', 150, { who: 'baby', dur: 40, gain: 0.7 });
sfx('burst', POP1, { who: 'baby' });

// ================================================================== Розовая большая
const PX = 600;

const BIG = () => {
  const Bb = C.baby.big;
  key('baby', BB, stance('baby', BX, -1), 0);
  // жуёт
  for (let i = 0; i < 4; i++) {
    key('baby', 126 + i * 6, { mouth: i % 2 ? 'mouth' : 'happy with theeth' }, 2);
    if (i % 2) sfx('chomp', 126 + i * 6, { who: 'baby', gain: 0.5 });
  }
  key('baby', 150, { mouth: 'puzzlement', lean: -6, head: -6 }, 4);              // дует
  // прыжок шарика на переднюю стопу
  const foot = stateAt(STOMP).baby.p.footF[0];
  key('pink', 184, { sx: 0.86, sy: 1.14 }, 2);
  move('pink', 184, { x: 900, y: GROUND });
  move('pink', 190, { x: E.lerp(900, foot, 0.6), y: GROUND - 140 }, 'out2');
  move('pink', STOMP, { x: foot, y: GROUND - 30 }, 'in2');
  key('pink', STOMP, { sx: 1.25, sy: 0.78 }, 1);
  move('pink', STOMP + 6, { x: E.lerp(foot, 880, 0.5), y: GROUND - 110 }, 'out2');
  move('pink', STOMP + 12, { x: 880, y: GROUND }, 'in2');
  key('pink', STOMP + 8, { sx: 1, sy: 1 }, 4);
  key('pink', STOMP + 12, { sx: 1.2, sy: 0.82 }, 1);
  key('pink', STOMP + 18, { sx: 1, sy: 1, mouth: 'theeth smile' }, 5);
  sfx('jump', 186, { who: 'pink', gain: 0.5 });
  ev('spark', { f: STOMP, at: [foot, GROUND - 20], r: 50, snd: 'bonk', swing: false, victim: 'baby' });
  ev('shake', { f: STOMP, amp: 10, n: 8 });
  // «ой» — дёрнулся, пузырь на лице, руки к лицу
  key('baby', STOMP + 1, { lean: -12, head: -12, mouth: 'puzzlement', eyes: 'sad' }, 2, 'out');
  ev('shake', { f: POP1, amp: 8, n: 6 });
  key('baby', POP1 + 6, { lean: 4, head: 0, handF: hand('baby', 'F', 0.2, -0.8), handB: hand('baby', 'B', 0.15, -0.8), zF: 'front' }, 6);
  // вслепую вперёд — спотыкается о шарик и падает на него
  const B2 = 1070;
  walk('baby', 212, BX, B2, 2, 10, -1, false);
  const TRIP = 236;
  key('baby', TRIP, { zF: null }, 0);
  const down = fallBack('baby', TRIP, B2, -1, { forward: true, stars: 30, n: 12 });
  sfx('scared', TRIP + 1, { who: 'baby', gain: 0.6 });
  key('pink', down - 1, { sx: 1, sy: 1 }, 0);
  key('pink', down + 1, { sx: 1.8, sy: 0.3, eyes: 'sad', mouth: 'puzzlement' }, 2, 'in2');   // в лепёшку
  sfx('hurt', down + 2, { who: 'pink' });
  // встаёт; шарик отлипает, злится, скачет назад и превращается
  const up = getUp('baby', 256, B2, -1, { forward: true, n: 14, mouth: 'puzzlement' });
  key('pink', up, { sx: 1.75, sy: 0.32 }, up - down - 1);
  key('pink', up + 6, { sx: 0.88, sy: 1.14, eyes: 'angry', mouth: 'angry theeth' }, 6, 'out');
  key('pink', up + 10, { sx: 1, sy: 1 }, 4);
  sfx('boing', up + 2, { who: 'pink', gain: 0.6 });
  hop('pink', up + 12, up + 24, 880, 700, 80);
  const PB = transform('pink', up + 28, 700, PX, 1, { fast: true, love: 'baby', loveDur: 110 });
  // он отдирает жвачку и бросает
  key('baby', 272, { handF: hand('baby', 'F', 0.25, -0.75), zF: 'front' }, 6);
  key('baby', 288, { handF: hand('baby', 'F', 0.9, -0.5), zF: null, mouth: 'sad' }, 8);
  sfx('slap', 279, { who: 'baby', gain: 0.35 });
  sfx('whoosh', 288, { who: 'baby', dur: 10, gain: 0.4 });
  key('baby', 300, stance('baby', B2, -1, { mouth: 'sad' }), 8);
  key('baby', PB, { mouth: 'puzzlement' }, 0);

  // ---- Розовая большая; он влюблён, подходит и надувает ей пузырь
  key('pink', PB, stance('pink', PX, 1), 0);
  key('pink', PB + 10, { mouth: 'theeth smile', eyes: 'normal' }, 0);
  const B3 = 1045, W0 = PB + 12;
  walk('baby', W0, B2, B3, 2, 12, -1, false);
  const G0 = W0 + 28, G1 = G0 + 24;
  for (let i = 0; i < 2; i++) { key('baby', W0 + 24 + i * 4, { mouth: i % 2 ? 'mouth' : 'happy with theeth' }, 2); }
  key('baby', G0, { mouth: 'puzzlement' }, 0);
  const B2b = { who: 'baby', f0: G0, f1: G1, r: 120 };
  BUBBLES.push(B2b);
  sfx('inflate', G0, { who: 'baby', dur: G1 - G0, gain: 0.6 });
  // она тычет пальцем — лопнул ему на лицо
  const POKE = G1 + 10;
  B2b.fPop = POKE;
  const edge = (() => { const b = bubbleAt({ ...B2b, fPop: undefined }, POKE); return [b.x - b.r, b.y]; })();
  key('pink', POKE - 6, { handF: hand('pink', 'F', 0.3, -0.3), mouth: 'theeth smile' }, 5);
  key('pink', POKE, { handF: hand('pink', 'F', 0.9, -0.4), hitF: 1, hitFto: edge, hitFfix: POKE }, 3, 'in2');
  key('pink', POKE + 6, { hitF: 0, ...stance('pink', PX, 1), mouth: 'happy with theeth' }, 6);
  sfx('burst', POKE, { who: 'baby' });
  SPLATS.push({ who: 'baby', f0: POKE, size: 230 });
  key('baby', POKE + 1, { lean: -10, head: -10, mouth: 'puzzlement' }, 2, 'out');
  key('baby', POKE + 8, { lean: 0, head: 0 }, 6);
  ev('shake', { f: POKE, amp: 8, n: 6 });
  chuckle('pink', POKE + 6, POKE + 24, { mouth: 'happy with theeth' });

  // ---- она жуёт и надувает огромный пузырь — прилипает к нему и уносит в небо
  const C0 = POKE + 26;
  for (let i = 0; i < 4; i++) {
    key('pink', C0 + i * 5, { mouth: i % 2 ? 'smile normal' : 'happy with theeth' }, 2);
    if (i % 2) sfx('chomp', C0 + i * 5, { who: 'pink', gain: 0.5 });
  }
  const Q0 = C0 + 20, Q1 = Q0 + 30, STICK = Q1 - 4;
  key('pink', Q0, { mouth: 'puzzlement', lean: -4 }, 3);
  const BIGB = { who: 'pink', f0: Q0, f1: Q1, r: 175, stick: 'baby', fStick: STICK };
  BUBBLES.push(BIGB);
  sfx('inflate', Q0, { who: 'pink', dur: Q1 - Q0, gain: 0.7 });
  sfx('pop', STICK, { who: 'baby', gain: 0.6 });
  key('pink', STICK + 2, { mouth: 'happy with theeth', lean: 0 }, 3);
  // поднимается за пузырём, болтает ногами
  const UP = STICK + 6, GONE = UP + 40;
  key('baby', UP, { legFfk: 1, legBfk: 1, legF: [-20, 30], legB: [15, -25], mouth: 'puzzlement',
    handF: hand('baby', 'F', 0.2, -0.95), handB: hand('baby', 'B', 0.1, -0.95) }, 4);           // держится за пузырь
  for (let f = UP + 4; f < GONE; f += 6) key('baby', f, { legF: (f / 6) % 2 ? [-30, 50] : [-5, 15] }, 3);
  move('baby', UP, { x: B3, y: GROUND });
  move('baby', GONE, { x: B3 + 200, y: GROUND - 1250 }, 'in');
  sfx('whoosh', UP, { who: 'baby', dur: GONE - UP, gain: 0.6 });
  sfx('scared', UP + 2, { who: 'baby', gain: 0.7 });
  ev('twinkle', { f: GONE - 4, at: [B3 + 160, 90], n: 22, size: 56 });
  // ---- победа
  victory('pink', GONE - 6, PX);
};

ST.hooks.afterChars.push((ctx, f, S, CAM) => {
  ctx.setTransform(...CAM);
  for (const b of BUBBLES) { const q = bubbleAt(b, f); if (q) FX.bubble(ctx, q.x, q.y, q.r); }
  for (const sp of SPLATS) { const q = splatAt(sp, f); if (q) FX.gumSplat(ctx, q.x, q.y, q.s, sp.f0); }
});

ST.start(BIG);
