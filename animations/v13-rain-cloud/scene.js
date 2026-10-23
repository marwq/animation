// Ролик 13: Тучка — Жёлтая против Скелета, 25 с, 24 кадра/с, звуковые эффекты без музыки,
// по стилю «animal hospital long» (docs/animal_hospital_long.md).
//
//   0–4 с     шарик-Жёлтая (слева) и шарик-Скелет (справа) неподвижно смотрят друг на друга
//   4–5 с     Скелет сразу становится большим
//   5.5–10 с  он приводит на верёвочке тучку и ставит её над шариком — дождь, она мокнет,
//             под ней лужа; Скелет хохочет
//   10–12.5 с Жёлтая злится и становится большой — Скелет влюбляется и выпускает верёвочку
//   12.5–15 с она ловит верёвочку, дёргает — молния в Скелета, трясётся, дымится, падает на спину
//   15–18 с   ставит тучку над лежащим — теперь дождь на него, лужа; она хохочет
//   18–25 с   Жёлтая в центре, руки вверх, а над Скелетом всё ещё дождик
'use strict';

const ST = Stage({
  name: 'v13-rain-cloud',
  cast: {
    girl: { small: ['girl-verity-small', { bodyHeight: 300, recolor: 'yellow' }],
      big: ['verity-big-girl', { height: 730, splitFeet: true, recolor: 'yellow' }], pivot: 337, voice: 1.4, vAngle: 50,
      moods: { angry: 'sad', grin: 'theeth smile', big: 'smile normal' } },
    skel: { small: ['skeleton-verity-small', { scale: 0.455 }], big: ['skeleton-verity-big', { height: 730 }], pivot: 325,
      voice: 0.9, lie: 60 },
  },
  order: ['skel', 'girl'],
  background: { sky: ['#4b9fe8', '#a5c6ee', '#eedcca'], seed: 174 },
  clouds: [[120, 60, 1.0, 2, 24], [560, 170, 0.9, 0, 30], [980, 70, 1.1, 1, 21], [1380, 200, 0.8, 2, 27],
    [1760, 110, 1.0, 0, 19], [300, 290, 0.7, 1, 32]],
});
const { GROUND, C, key, move, ev, sfx, hop, tumble, laugh, tremble, transform, love, stance, walk, turn,
  strike, kick, dodge, duck, recoil, fallBack, getUp, flyOff, victory, chuckle, hand, toRig, statesAt, stateAt, target } = ST;

// ------------------------------------------------------------------ тучка
// путь тучки: [{f, at: [x, y], ease}]; верёвочка — у кого в руке с какого кадра; дождь и молнии
const CL = { path: [], holder: [], rain: [], bolts: [], puddles: [] };
const cloudAt = (f) => {
  const P = CL.path;
  if (!P.length || f < P[0].f) return null;
  for (let k = 1; k < P.length; k++) {
    if (f < P[k].f) {
      const u = E.EASE[P[k].ease || 'io']((f - P[k - 1].f) / (P[k].f - P[k - 1].f));
      return [E.lerp(P[k - 1].at[0], P[k].at[0], u), E.lerp(P[k - 1].at[1], P[k].at[1], u) + Math.sin(f * 0.15) * 6];
    }
  }
  const a = P[P.length - 1].at;
  return [a[0], a[1] + Math.sin(f * 0.15) * 6];
};
const holderAt = (f) => { let h = null; for (const q of CL.holder) if (f >= q.f) h = q; return h; };

// ================================================================== 0–4 с: стойка
const GS = 560;
key('girl', 0, { form: 'small', x: GS, y: GROUND, face: 1, look: 1, eyes: 'angry', mouth: 'smile normal', sx: 1, sy: 1, rot: 0 }, 0);
key('skel', 0, { form: 'small', x: 1360, y: GROUND, face: -1, look: 1, eyes: 'angry', mouth: 'theeth smile', sx: 1, sy: 1, rot: 0 }, 0);

// ================================================================== 4–5 с: Скелет большой
const SX = 1400;
const SB = transform('skel', 96, 1360, SX, -1, { fast: true });
key('girl', SB, { mouth: 'puzzlement', eyes: 'sad' }, 0);
sfx('scared', SB + 2, { who: 'girl', gain: 0.7 });

// ================================================================== дождь на шарик
const R0 = 188, R1 = 262;
CL.rain.push({ f0: R0, f1: R1 });
key('girl', R0 + 4, { mouth: 'sad', eyes: 'sad', sx: 1.06, sy: 0.92 }, 6);
for (let f = R0 + 10; f < R1 - 20; f += 8) key('girl', f, { sy: (f / 8) % 2 ? 0.9 : 0.94 }, 4);   // дрожит от холода
ev('sweat', { who: 'girl', f0: R0 + 8, f1: R0 + 34, snd: false });
ev('sweat', { who: 'girl', f0: R0 + 30, f1: R0 + 56, snd: false });
CL.puddles.push({ x: GS, f0: R0 + 10, w: 280 });
sfx('rain', R0, { x: GS, dur: R1 - R0 + 10, gain: 0.6 });

// ================================================================== 10–12.5 с: Жёлтая большая
const GX = 560;
const GB = transform('girl', 236, GS, GX, 1, { love: 'skel', loveDur: 90 });

const CS = 210;                                    // ширина тучки

const BIG = () => {
  key('skel', SB, stance('skel', SX, -1, { b_B16: 12, b_B17: -12 }), 0);
  key('skel', SB + 6, { mouth: 'theeth smile' }, 0);
  // ---- тучка на верёвочке: прилетает к нему, он ведёт её перед собой к шарику
  const S1 = 1090;
  key('skel', 132, { handF: hand('skel', 'F', 0.75, -0.6) }, 6);                // рука с верёвочкой вперёд-вверх
  CL.holder.push({ f: 132, who: 'skel' });
  CL.path.push({ f: 120, at: [1900, -140] }, { f: 146, at: [SX - 330, 190], ease: 'out2' });
  sfx('whoosh', 124, { x: 1600, dur: 20, gain: 0.4 });
  walk('skel', 150, SX, S1, 4, 9, -1, false);
  CL.path.push({ f: 150, at: [SX - 330, 190] }, { f: 186, at: [GS, 250], ease: 'io' });
  key('skel', 188, { mouth: 'happy with theeth' }, 0);
  chuckle('skel', 196, 230, { mouth: 'happy with theeth' });

  // ---- Жёлтая большая; он влюбился и выпустил верёвочку — тучка всплыла между ними
  key('girl', GB, stance('girl', GX, 1), 0);
  key('girl', GB + 10, { mouth: 'theeth smile', eyes: 'angry' }, 0);
  key('skel', GB + 8, { handF: stance('skel', S1, -1).handF, mouth: 'happy - spittle' }, 6);
  CL.holder.push({ f: GB + 10, who: null });
  const MID = [790, 150];
  CL.path.push({ f: GB + 10, at: [GS, 250] }, { f: GB + 30, at: MID, ease: 'io' });
  // она ловит верёвочку
  const GRAB = GB + 30;
  key('girl', GRAB - 6, { handF: hand('girl', 'F', 0.75, -0.55), zF: 'front' }, 6);
  CL.holder.push({ f: GRAB, who: 'girl' });
  sfx('pop', GRAB, { who: 'girl', gain: 0.4 });
  // ---- дёргает — молния в Скелета
  const YANK = GRAB + 14, BOLT = YANK + 4;
  key('girl', YANK - 5, { handF: hand('girl', 'F', 0.7, -0.75), lean: -4, mouth: 'theeth smile' }, 4);
  key('girl', YANK, { handF: hand('girl', 'F', 0.75, -0.35), lean: 6 }, 3, 'in2');
  sfx('swing', YANK - 3, { who: 'girl', gain: 0.6 });
  CL.bolts.push({ f: BOLT, to: 'skel:top' });
  sfx('zap', BOLT, { who: 'skel' });
  ev('flash', { f: BOLT, at: 'skel:top', strength: 0.4 });
  ev('shake', { f: BOLT, amp: 24, n: 18 });
  ev('zoom', { f: BOLT, n: 14, k: 0.08, at: 'skel:head' });
  sfx('hurt', BOLT + 2, { who: 'skel', gain: 0.9 });
  key('skel', BOLT + 1, { handF: hand('skel', 'F', 0.6, -0.75), handB: hand('skel', 'B', -0.6, -0.75), b_B16: -40, b_B17: 40,
    mouth: 'angry theeth', eyes: 'sad', head: 0 }, 1);
  tremble('skel', BOLT + 1, BOLT + 18, S1, 7);
  ev('steam', { who: 'skel', f0: BOLT + 4, f1: BOLT + 70, snd: false });
  const down = fallBack('skel', BOLT + 20, S1, -1, { stars: 90, lift: 60 });
  key('skel', BOLT + 20, { b_B16: 90, b_B17: -90 }, 8);
  key('girl', BOLT + 4, { mouth: 'happy with theeth', eyes: 'normal' }, 0);
  // ---- ставит тучку над лежащим: дождь на него
  const G2 = 700, OVER = down + 18;
  walk('girl', down - 2, GX, G2, 2, 9, 1, false);
  const body = [S1 + 330, 420];
  CL.path.push({ f: down - 2, at: MID }, { f: OVER, at: body, ease: 'io' });
  sfx('whoosh', down, { x: 1000, dur: 18, gain: 0.4 });
  CL.rain.push({ f0: OVER + 2, f1: 600 });
  sfx('rain', OVER + 2, { x: body[0], dur: 600 - OVER - 2, gain: 0.5 });
  CL.puddles.push({ x: body[0], f0: OVER + 12, w: 340 });
  CL.holder.push({ f: OVER + 6, who: null });
  key('girl', OVER + 4, { ...stance('girl', G2, 1), zF: null }, 8);
  chuckle('girl', OVER + 10, OVER + 36, { mouth: 'happy with theeth' });
  victory('girl', OVER + 38, G2);
};

// тучка, верёвочка, дождь, молнии, лужи
ST.hooks.beforeChars.push((ctx, f) => {
  for (const p of CL.puddles) FX.puddle(ctx, p.x, GROUND + 8, p.w * Math.min(1, (f - p.f0) / 30), f >= p.f0 ? 1 : 0);
});
ST.hooks.afterChars.push((ctx, f, S, CAM) => {
  ctx.setTransform(...CAM);
  const c = cloudAt(f);
  if (!c) return;
  for (const r of CL.rain) {
    if (f < r.f0 || f > r.f1 + 8) continue;
    const a = Math.min(1, (f - r.f0) / 4, (r.f1 + 8 - f) / 8);
    FX.rain(ctx, c[0], c[1] + 40, GROUND, CS * 0.85, f / 24, a, r.f0);
  }
  const h = holderAt(f);
  if (h && h.who) {
    const hp = C[h.who].big.point(S[h.who].st, 'handF');
    ctx.beginPath(); ctx.moveTo(c[0], c[1] + 55); ctx.quadraticCurveTo((c[0] + hp[0]) / 2, (c[1] + hp[1]) / 2 + 40, hp[0], hp[1]);
    ctx.lineWidth = 3; ctx.strokeStyle = '#111'; ctx.stroke();
  } else if (h && !h.who) {                         // отпущенная верёвочка свисает
    ctx.beginPath(); ctx.moveTo(c[0], c[1] + 55); ctx.quadraticCurveTo(c[0] + 20, c[1] + 130, c[0] - 10, c[1] + 180);
    ctx.lineWidth = 3; ctx.strokeStyle = '#111'; ctx.stroke();
  }
  FX.rainCloud(ctx, c[0], c[1], CS);
  for (const b of CL.bolts) {
    const u = (f - b.f) / 10;
    if (u < 0 || u > 1) continue;
    const t = target(b.to, statesAt(b.f));
    FX.lightning(ctx, c[0], c[1] + 60, t[0], t[1], u, b.f);
  }
});

ST.start(BIG);
