// Пробная драка, 25 секунд: Лорд против Розового скелета, в середине с неба падает
// Толстяк, в конце приходит Радужный скелет.
//
// Время везде в секундах. Ключи поз: track.add(t, {свойство: значение}, ease).
// Свойства позы (см. animations/engine.js):
//   x, y           точка между стопами на сцене (y = земля, меньше — выше)
//   footF, footB   стопы: [x на сцене, высота над землёй] — стоят на месте, пока
//                  тело движется; колени сгибает IK
//   handF, handB   кисти относительно плеча (пиксели персонажа, +x — к сопернику)
//   legF, legB     углы ноги в градусах [бедро, голень, стопа]; legFfk/legBfk — вес
//                  углов против точки стопы (0 — стоит на земле, 1 — в воздухе)
//   hit*, kick*    удар: вес 0..1, цель — hitFto, hitBto, kickFto ('pink:face' и т.п.)
//   pivot          центр поворота rot: на сколько пикселей персонажа выше стоп
//   hip, lean, head, rot, sx, sy, mouth, eyes, hide, show
// F — рука/нога со стороны соперника, B — дальняя.
'use strict';

const FPS = 25, DUR = 25, W = 1920, H = 1080, GROUND = 938, SC = 0.29;
window.SCENE = { fps: FPS, duration: DUR, width: W, height: H, name: 'fight-test' };

const FACING = { lord: 1, pink: -1, fat: 1, rainbow: -1 };
const RIGS = { lord: 'lord-verity-big', pink: 'child-verity-big', fat: 'fat-verity-small', rainbow: 'all-verity-color' };
const tr = Object.fromEntries(Object.keys(RIGS).map((n) => [n, new E.Track()]));
const k = (who, t, props, ease) => tr[who].add(t, props, ease);

// стойка: стопы по бокам от x (в пикселях персонажа), кулаки у лица
const GUARD = {
  lord: { handF: [250, -70], handB: [170, -10] },
  pink: { handF: [250, -40], handB: [190, 20] },
  rainbow: { handF: [250, -40], handB: [190, 20] },
};
const feet = (who, x, wF = 130, wB = 130) => ({
  x, y: GROUND, footF: [x + FACING[who] * wF * SC, 0], footB: [x - FACING[who] * wB * SC, 0],
});

// шаги приставным шагом (вид спереди): ноги переставляются по очереди, не скользят
function shuffle(who, t0, t1, x0, x1, n, o = {}) {
  const f = FACING[who], wF = o.wF ?? 130, wB = o.wB ?? 130, lift = (o.lift ?? 90) * SC;
  const forward = Math.sign(x1 - x0) === f;
  const order = forward ? ['F', 'B'] : ['B', 'F'];
  const off = { F: f * wF * SC, B: -f * wB * SC };
  const pos = { F: x0 + off.F, B: x0 + off.B };
  k(who, t0, { x: x0, footF: [pos.F, 0], footB: [pos.B, 0], hy: 0 });
  const dt = (t1 - t0) / n;
  for (let i = 0; i < n; i++) {
    const m = order[i % 2], ts = t0 + i * dt, te = ts + dt;
    const xb = x0 + (x1 - x0) * Math.min(1, (i + 2) / n);
    const tgt = xb + off[m];
    k(who, ts, { ['foot' + m]: [pos[m], 0] });
    k(who, ts + dt * 0.5, { ['foot' + m]: [(pos[m] + tgt) / 2, lift], hy: -(o.bob ?? 25) }, 'out');
    k(who, te, { ['foot' + m]: [tgt, 0], hy: 0 }, 'in');
    pos[m] = tgt;
  }
  k(who, t1, { x: x1 }, 'lin');
}

// прыжок/полёт: ноги плавно уходят с земли на углы (fk 0 -> 1) ...
function takeoff(who, t, legs) {
  k(who, t, { legFfk: 0, legBfk: 0, legF: legs[0], legB: legs[1] });
  k(who, t + 0.08, { legFfk: 1, legBfk: 1 });
}
// ... и так же плавно встают на землю в новой точке (тянутся к ней перед касанием)
function land(who, t, x, wF = 130, wB = 130) {
  const f = feet(who, x, wF, wB);
  k(who, t - 0.12, { footF: f.footF, footB: f.footB, legFfk: 1, legBfk: 1 }, 'step');
  k(who, t, { legFfk: 0, legBfk: 0 });
}

// ------------------------------------------------------------------ события
const TEXT = [];    // {t0, t1, text, px, y, color}
const BURST = [];   // {t, at, r}
const SHAKE = [];   // {t, amp, dur}
const DUST = [];    // {t, x, r, n}
const DIZZY = [];   // {who, t0, t1}
const TWINKLE = []; // {t, x, y}
const hp = { lord: new E.Track(), pink: new E.Track() };
const cam = new E.Track();

// ================================================================== 0–3 c: отсчёт
TEXT.push({ t0: 0.15, t1: 0.75, text: '3', px: 34, y: 310 }, { t0: 0.75, t1: 1.35, text: '2', px: 34, y: 310 },
  { t0: 1.35, t1: 1.95, text: '1', px: 34, y: 310 }, { t0: 1.95, t1: 3.0, text: 'FIGHT!', px: 34, y: 310 });
hp.lord.add(0, { hp: 100 }); hp.pink.add(0, { hp: 100 });

k('lord', 0, { ...feet('lord', 560), ...GUARD.lord, hip: [0, 70], lean: 6, breath: 18, mouth: 'mouth', z: 2 });
k('pink', 0, { ...feet('pink', 1360), ...GUARD.pink, hip: [0, 60], lean: 6, breath: 18, mouth: 'mouth', z: 1 });
k('fat', 0, { x: 1035, y: -700, show: 0, z: 3, eyes: 'normal', mouth: 'smile normal' });
k('rainbow', 0, { ...feet('rainbow', 2250), ...GUARD.rainbow, show: 0, z: 4, head: 0, mouth: 'mouth', breath: 14 });

// розовый подходит на два шага, оба подпрыгивают на месте
shuffle('pink', 2.0, 2.8, 1360, 1300, 2, { lift: 70 });

// ================================================================== 3–6.4 c: серия Лорда
k('lord', 3.05, { lean: 6, hip: [0, 70], breath: 0 });
k('lord', 3.25, { lean: 20, mouth: 'angry theeth', handB: [150, 60], handF: [200, 40] });
shuffle('lord', 3.25, 3.85, 560, 1050, 4, { lift: 110, bob: 40 });
k('lord', 3.85, { lean: 14 });
// джеб передней рукой
k('lord', 3.9, { hitF: 0, hitFto: 'pink:face', ...GUARD.lord });
k('lord', 4.0, { hitF: 1, lean: 20 }, 'out');
k('lord', 4.14, { hitF: 0, lean: 12 }, 'io');
BURST.push({ t: 4.0, at: 'pink:face', r: 70 });
SHAKE.push({ t: 4.0, amp: 10, dur: 0.18 });
hp.pink.add(4.0, { hp: 100 }, 'step').add(4.15, { hp: 86 }, 'out');
// кросс дальней рукой
k('lord', 4.22, { hitB: 0, hitBto: 'pink:face' });
k('lord', 4.35, { hitB: 1, lean: 24 }, 'out');
k('lord', 4.5, { hitB: 0, lean: 10 }, 'io');
BURST.push({ t: 4.35, at: 'pink:face', r: 80 });
SHAKE.push({ t: 4.35, amp: 12, dur: 0.2 });
hp.pink.add(4.35, { hp: 86 }, 'step').add(4.5, { hp: 73 }, 'out');
// апперкот: кулак вниз, присед — и снизу в челюсть
k('lord', 4.62, { handF: [120, 330], hip: [0, 150], lean: 4, hitF: 0 });
k('lord', 4.88, { handF: [300, -380], hip: [0, 20], lean: 16, hitF: 0.75 }, 'out');
k('lord', 5.2, { handF: [180, -420], hitF: 0, hip: [0, 40], lean: 8 });
BURST.push({ t: 4.86, at: 'pink:face', r: 100 });
SHAKE.push({ t: 4.86, amp: 18, dur: 0.3 });
hp.pink.add(4.86, { hp: 73 }, 'step').add(5.05, { hp: 55 }, 'out');
// розовый: удары по голове и отлёт назад
k('pink', 3.98, { head: 0, lean: 6, mouth: 'mouth' });
k('pink', 4.02, { head: 14, lean: 0, mouth: 'puzzlement' }, 'out');
k('pink', 4.2, { head: 2, lean: 4 });
k('pink', 4.36, { head: 18, lean: -6 }, 'out');
k('pink', 4.55, { head: 4, lean: 2 });
k('pink', 4.86, { x: 1300, y: GROUND, head: 0, lean: 2, footF: [1300 - 130 * SC, 0], footB: [1300 + 130 * SC, 0] });
takeoff('pink', 4.88, [[-10, 15], [10, -15]]);
k('pink', 5.1, { x: 1430, y: GROUND - 120, head: -28, lean: -26, handF: [-120, 250], handB: [-160, 220] }, 'out');
k('pink', 5.36, { x: 1500, y: GROUND, legF: [0, 0], legB: [0, 0], hip: [0, 120], lean: -10 }, 'in');
land('pink', 5.36, 1500, 150, 110);
k('pink', 5.6, { head: 0, lean: 4, hip: [0, 80] });
// встряхнул головой и разозлился
k('pink', 5.75, { head: -10, mouth: 'angry theeth' });
k('pink', 5.9, { head: 10 });
k('pink', 6.05, { head: -8 });
k('pink', 6.2, { head: 0, ...GUARD.pink, lean: 8 });
// Лорд дразнится
k('lord', 5.4, { mouth: 'happy with theeth', breath: 22, ...GUARD.lord });

// ================================================================== 6.4–9.6 c: удар ногой в прыжке
k('pink', 6.4, { hip: [0, 80], lean: 8, ...feet('pink', 1500, 150, 110) });
k('pink', 6.75, { hip: [0, 230], lean: 18, handF: [-60, 300], handB: [-120, 260] }, 'io');
k('pink', 6.8, { footF: [1500 - 150 * SC, 0], footB: [1500 + 110 * SC, 0] });
k('pink', 6.8, { x: 1500, y: GROUND });
takeoff('pink', 6.78, [[-30, 60], [25, -50]]);
k('pink', 7.05, { x: 1360, y: GROUND - 230, hip: [0, 40], lean: -22, legF: [-80, 95], legB: [35, -70],
  handF: [80, -150], handB: [-250, 40], mouth: 'angry theeth' }, 'out');
k('pink', 7.1, { kickF: 0, kickFto: 'lord:face' });
k('pink', 7.3, { x: 1290, y: GROUND - 210, kickF: 1, lean: -30 }, 'out');
k('pink', 7.45, { kickF: 0 });
k('pink', 7.64, { x: 1250, y: GROUND, legF: [-10, 20], legB: [10, -20], lean: 4, hip: [0, 170] }, 'in');
land('pink', 7.64, 1250);
k('pink', 7.95, { hip: [0, 60], lean: 6, ...GUARD.pink }, 'out');
BURST.push({ t: 7.3, at: 'lord:face', r: 110 });
SHAKE.push({ t: 7.3, amp: 22, dur: 0.35 });
hp.lord.add(7.3, { hp: 100 }, 'step').add(7.5, { hp: 62 }, 'out');
// Лорда отбрасывает, шляпа слетает
k('lord', 7.28, { ...feet('lord', 1050), hip: [0, 40], lean: 8, head: 0, mouth: 'happy with theeth' });
k('lord', 7.33, { head: -24, lean: -18, mouth: 'puzzlement', hide: ['hat'], handF: [-60, 300], handB: [-200, 200] }, 'out');
shuffle('lord', 7.35, 7.95, 1050, 820, 3, { lift: 60, bob: 10 });
k('lord', 7.95, { lean: -10, head: -8, hip: [0, 110] });
k('lord', 8.3, { lean: 0, head: 0, hip: [0, 60], ...GUARD.lord });
// щупает голову — где шляпа?
k('lord', 8.55, { handB: [60, -470], head: 8, mouth: 'sad' });
k('lord', 9.1, { handB: [90, -440] });
k('lord', 9.45, { ...GUARD.lord, head: 0, mouth: 'angry theeth' });
k('pink', 8.3, { mouth: 'happy open mouth', breath: 30, handB: [60, 420] });
k('pink', 9.45, { mouth: 'angry theeth', breath: 14, ...GUARD.pink });
const HAT = { t: 7.33, land: [690, GROUND] };   // полёт шляпы считается в renderFrame

// ================================================================== 9.6–13.2 c: Толстяк с неба
k('lord', 9.75, { head: 0, mouth: 'angry theeth' });
k('lord', 10.0, { head: -22, mouth: 'puzzlement', handF: [180, 100], handB: [120, 160] });
k('pink', 9.75, { head: 0 });
k('pink', 10.0, { head: -22, mouth: 'puzzlement', handF: [180, 100], handB: [120, 160] });
k('fat', 10.2, { show: 1, y: -420, sx: 0.85, sy: 1.25, eyes: 'normal', mouth: 'happy' }, 'step');
k('fat', 10.8, { y: GROUND }, 'in2');
k('fat', 10.86, { sx: 1.4, sy: 0.62 }, 'out');
k('fat', 11.02, { sx: 0.88, sy: 1.14 }, 'io');
k('fat', 11.2, { sx: 1.0, sy: 1.0 }, 'io');
DUST.push({ t: 10.8, x: 1035, r: 70, n: 9 });
SHAKE.push({ t: 10.8, amp: 30, dur: 0.5 });
TEXT.push({ t0: 11.15, t1: 12.7, text: 'NEW CHALLENGER!', px: 13, y: 270, color: '#ffe23a' });
// взрывная волна раскидывает обоих
k('lord', 10.8, { ...feet('lord', 820), hip: [0, 60], lean: 0 });
takeoff('lord', 10.82, [[-20, 25], [20, -25]]);
k('lord', 11.15, { x: 690, y: GROUND - 140, lean: -25, head: -18, handF: [-200, -350], handB: [-300, -250] }, 'out');
k('lord', 11.47, { x: 600, y: GROUND, legF: [0, 0], legB: [0, 0], hip: [0, 160], lean: -6 }, 'in');
land('lord', 11.47, 600);
k('lord', 11.8, { hip: [0, 70], lean: 6, head: 0, ...GUARD.lord });
k('pink', 10.8, { ...feet('pink', 1250), hip: [0, 60], lean: 0 });
takeoff('pink', 10.82, [[-20, 25], [20, -25]]);
k('pink', 11.15, { x: 1460, y: GROUND - 140, lean: -25, head: -18, handF: [-200, -350], handB: [-300, -250] }, 'out');
k('pink', 11.47, { x: 1560, y: GROUND, legF: [0, 0], legB: [0, 0], hip: [0, 160], lean: -6 }, 'in');
land('pink', 11.47, 1560);
k('pink', 11.8, { hip: [0, 60], lean: 6, head: 0, ...GUARD.pink });
DUST.push({ t: 11.45, x: 600, r: 34, n: 5 }, { t: 11.45, x: 1560, r: 34, n: 5 });
// Толстяк хохочет и подпрыгивает
for (const [t, s] of [[11.6, 1], [12.1, 1], [12.6, 0.7]]) {
  k('fat', t, { y: GROUND, sx: 1.0, sy: 1.0, mouth: 'theeth smile' });
  k('fat', t + 0.06, { sx: 1.12, sy: 0.88 }, 'out');
  k('fat', t + 0.22, { y: GROUND - 70 * s, sx: 0.95, sy: 1.06 }, 'out');
  k('fat', t + 0.4, { y: GROUND, sx: 1.0, sy: 1.0 }, 'in');
}

// ================================================================== 13.2–16.8 c: вдвоём на Толстяка
k('lord', 13.2, { head: 0, mouth: 'angry theeth' });
k('lord', 13.4, { head: 14 });
k('lord', 13.6, { head: 0 });
k('pink', 13.2, { head: 0, mouth: 'angry theeth' });
k('pink', 13.4, { head: 14 });
k('pink', 13.6, { head: 0 });
shuffle('lord', 13.7, 14.2, 600, 735, 2, { lift: 90 });
shuffle('pink', 13.7, 14.2, 1560, 1385, 2, { lift: 90 });
k('lord', 14.2, { hip: [0, 130], lean: 18, hitF: 0, hitFto: 'fat:hitL' });
k('pink', 14.2, { hip: [0, 150], lean: 18, hitF: 0, hitFto: 'fat:hitR' });
k('lord', 14.33, { hitF: 1 }, 'out');
k('pink', 14.33, { hitF: 1 }, 'out');
k('fat', 14.3, { sx: 1.0, sy: 1.0, mouth: 'happy', eyes: 'normal' });
k('fat', 14.38, { sx: 0.74, sy: 1.25, eyes: 'angry', mouth: 'puzzlement' }, 'out');
k('fat', 14.55, { sx: 0.7, sy: 1.3 });
k('fat', 14.66, { sx: 1.5, sy: 0.72 }, 'out');
k('fat', 14.9, { sx: 0.92, sy: 1.08 }, 'io');
k('fat', 15.1, { sx: 1.0, sy: 1.0, eyes: 'normal', mouth: 'theeth smile' });
BURST.push({ t: 14.33, at: 'fat:hitL', r: 70 }, { t: 14.33, at: 'fat:hitR', r: 70 });
SHAKE.push({ t: 14.33, amp: 12, dur: 0.2 }, { t: 14.66, amp: 26, dur: 0.4 });
// «БОИНГ» — обоих отбрасывает, они падают на спину
k('lord', 14.55, { hitF: 1, ...feet('lord', 735), x: 735, y: GROUND, rot: 0 });
// pivot 1000: поворот вокруг середины тела, x/y — где была бы точка между стопами без поворота
takeoff('lord', 14.62, [[-30, 40], [30, -40]]);
k('lord', 14.72, { hitF: 0, handF: [-250, -300], handB: [-300, -200], lean: -20, head: -20 }, 'out');
k('lord', 14.66, { mouth: 'puzzlement', pivot: 1000 }, 'step');
k('lord', 15.05, { x: 560, y: GROUND - 230, rot: -60 }, 'out');
k('lord', 15.45, { x: 480, y: GROUND + 195, rot: -90, legF: [-10, 10], legB: [10, -10], lean: 0, head: 0, hip: [0, 0],
  handF: [60, 300], handB: [-60, 330], mouth: 'sad' }, 'in');
k('lord', 15.55, { y: GROUND + 175 }, 'out');
k('lord', 15.65, { y: GROUND + 195 }, 'in');
k('pink', 14.55, { hitF: 1, ...feet('pink', 1385), x: 1385, y: GROUND, rot: 0 });
takeoff('pink', 14.62, [[-30, 40], [30, -40]]);
k('pink', 14.72, { hitF: 0, handF: [-250, -300], handB: [-300, -200], lean: -20, head: -20 }, 'out');
k('pink', 14.66, { mouth: 'puzzlement', pivot: 1000 }, 'step');
k('pink', 15.05, { x: 1520, y: GROUND - 230, rot: 60 }, 'out');
k('pink', 15.45, { x: 1560, y: GROUND + 205, rot: 90, legF: [-10, 10], legB: [10, -10], lean: 0, head: 0, hip: [0, 0],
  handF: [60, 300], handB: [-60, 330], mouth: 'Throw up' }, 'in');
k('pink', 15.55, { y: GROUND + 185 }, 'out');
k('pink', 15.65, { y: GROUND + 205 }, 'in');
DUST.push({ t: 15.45, x: 480, r: 46, n: 7 }, { t: 15.45, x: 1560, r: 46, n: 7 });
SHAKE.push({ t: 15.45, amp: 16, dur: 0.3 });
hp.lord.add(14.66, { hp: 62 }, 'step').add(14.9, { hp: 14 }, 'out');
hp.pink.add(14.66, { hp: 55 }, 'step').add(14.9, { hp: 9 }, 'out');
DIZZY.push({ who: 'lord', t0: 15.7, t1: 25 }, { who: 'pink', t0: 15.7, t1: 25 });
// Толстяк празднует
for (const t of [15.4, 15.95, 16.5]) {
  k('fat', t, { y: GROUND, sx: 1.0, sy: 1.0, mouth: 'happy' });
  k('fat', t + 0.06, { sx: 1.1, sy: 0.9 }, 'out');
  k('fat', t + 0.24, { y: GROUND - 55, sx: 0.96, sy: 1.05 }, 'out');
  k('fat', t + 0.42, { y: GROUND, sx: 1.0, sy: 1.0 }, 'in');
}

// ================================================================== 16.8–20.6 c: Радужный скелет
k('rainbow', 16.7, { show: 1, ...feet('rainbow', 2250), hip: [0, 40], lean: 4 }, 'step');
shuffle('rainbow', 16.7, 18.7, 2250, 1360, 6, { lift: 100, bob: 30 });
k('rainbow', 16.7, { handF: [120, 520], handB: [160, 520] });
k('rainbow', 17.2, { handF: [200, 460], handB: [100, 560] });
k('rainbow', 17.7, { handF: [100, 560], handB: [200, 460] });
k('rainbow', 18.2, { handF: [200, 460], handB: [100, 560] });
k('rainbow', 18.7, { ...GUARD.rainbow, lean: 6, hip: [0, 60] });
k('fat', 17.0, { y: GROUND, sx: 1, sy: 1, lean: 0, eyes: 'normal', mouth: 'happy' });
k('fat', 17.6, { lean: 8, eyes: 'angry', mouth: 'puzzlement' });
k('fat', 18.4, { lean: 4, mouth: 'theeth smile' });
// замах и удар
k('rainbow', 18.85, { handF: [-260, 120], lean: -14, hip: [0, 110], mouth: 'angry theeth', hitF: 0, hitFto: 'fat:hitR' });
k('rainbow', 19.25, { lean: 22, hitF: 1, hip: [0, 60] }, 'out');
k('rainbow', 19.5, { hitF: 1 });
k('rainbow', 19.75, { hitF: 0, ...GUARD.rainbow, lean: 8 });
BURST.push({ t: 19.25, at: 'fat:hitR', r: 140 });
SHAKE.push({ t: 19.25, amp: 34, dur: 0.5 });
k('fat', 19.22, { x: 1035, y: GROUND, sx: 1, sy: 1, rot: 0, eyes: 'normal', mouth: 'theeth smile' });
k('fat', 19.3, { sx: 0.7, sy: 1.2, eyes: 'sad', mouth: 'puzzlement' }, 'out');
k('fat', 19.3, { pivot: 500 }, 'step');
k('fat', 20.3, { x: 470, y: -230, rot: -820, sx: 0.55, sy: 0.55 }, 'out');
k('fat', 20.31, { show: 0 }, 'step');
TWINKLE.push({ t: 20.35, x: 520, y: 235 });

// ================================================================== 20.6–25 c: победа
k('rainbow', 20.4, { mouth: 'happy with theeth', breath: 0 });
k('rainbow', 20.7, { handF: [150, -560], handB: [-120, -560], head: -6, lean: 0, hip: [0, 30] });
for (const t of [21.0, 21.8, 22.6, 23.4]) {
  k('rainbow', t, { y: GROUND, hip: [0, 90] });
  k('rainbow', t + 0.18, { y: GROUND - 60, hip: [0, 0], mouth: 'excited' }, 'out');
  k('rainbow', t + 0.4, { y: GROUND, hip: [0, 80], mouth: 'happy with theeth' }, 'in');
}
TEXT.push({ t0: 21.0, t1: 25.5, text: 'RAINBOW WIN!', px: 17, y: 222 });
cam.add(0, { zoom: 1, cx: 960, cy: 600 }).add(20.6, { zoom: 1, cx: 960, cy: 600 })
  .add(22.2, { zoom: 1.06, cx: 1050, cy: 560 });

// ------------------------------------------------------------------ сборка кадра
const ctx = document.getElementById('stage').getContext('2d');
let C = {}, BG, PORTRAIT = {};
window.READY = (async () => {
  for (const [n, rig] of Object.entries(RIGS)) C[n] = new E.Character(await E.loadRig(rig, SC * 1.6), { scale: SC });
  BG = FX.background(W, H, GROUND);
  PORTRAIT.lord = FX.portrait(C.lord, 132, '#fff3a6');
  PORTRAIT.pink = FX.portrait(C.pink, 132, '#ffd3cf');
})();

const DEF = { x: 0, y: GROUND, facing: 1, hip: [0, 0], lean: 0, head: 0, rot: 0, sx: 1, sy: 1, show: 1, hy: 0, breath: 0,
  hide: [], legF: null, legB: null, hitF: 0, hitB: 0, kickF: 0, pivot: 0 };

function poseOf(who, t) {
  const p = tr[who].sample(t, null, { ...DEF, facing: FACING[who] });
  if (p.y === undefined) p.y = GROUND;
  const b = p.breath ? p.breath * (0.5 - 0.5 * Math.cos(2 * Math.PI * 1.6 * t)) : 0;
  p.hip = [p.hip[0], p.hip[1] + p.hy + b];
  return p;
}

function target(spec, states) {
  const [who, part] = spec.split(':');
  const ch = C[who], st = states[who];
  if (part === 'hitL' || part === 'hitR') {   // бок Толстяка
    const c = ch.point(st, 'body');
    return [c[0] + (part === 'hitL' ? -110 : 110) * (st.p.sx || 1), c[1] - 40];
  }
  if (part === 'face') {   // ближний к сопернику край головы — туда и прилетает кулак
    const c = ch.point(st, 'head');
    const head = ch.layers.find((l) => l.name === 'head');
    return [c[0] + st.p.facing * (head.bbox[2] - head.bbox[0]) * SC * 0.3, c[1] + 10];
  }
  return ch.point(st, part);
}

function evalStates(t) {
  const ps = {}, states = {};
  for (const n of Object.keys(C)) {
    ps[n] = poseOf(n, t);
    states[n] = C[n].pose(ps[n], { ground: GROUND });
  }
  // удары: кулак/стопа к цели на сцене
  for (const n of Object.keys(C)) {
    const p = ps[n], reach = {};
    for (const [key, w] of [['hitF', p.hitF], ['hitB', p.hitB], ['kickF', p.kickF]]) {
      if (w > 0) reach[key] = { at: target(p[key + 'to'], states), w };
    }
    if (Object.keys(reach).length) states[n] = C[n].pose(p, { ground: GROUND, ...reach });
  }
  return states;
}

let HAT_M0 = null;
function hatMatrix(t) {
  // шляпа: снимается с головы в момент удара и летит по дуге, кувыркаясь
  const M0 = HAT_M0 || (HAT_M0 = C.lord.layerMatrix(evalStates(HAT.t - 0.001).lord, 'hat'));
  const hat = C.lord.layers.find((l) => l.name === 'hat');
  const c0 = E.apply(M0, [(hat.bbox[0] + hat.bbox[2]) / 2, (hat.bbox[1] + hat.bbox[3]) / 2]);
  const hh = (hat.bbox[3] - hat.bbox[1]) * SC * 0.5;
  const u = Math.min(1, (t - HAT.t) / 1.0);
  const land = [HAT.land[0], HAT.land[1] - hh];
  const x = E.lerp(c0[0], land[0], u);
  const yl = E.lerp(c0[1], land[1], u) - Math.sin(Math.PI * u) * 260;
  const bounce = t - HAT.t > 1.0 ? Math.max(0, Math.sin(Math.PI * Math.min(1, (t - HAT.t - 1.0) / 0.25))) * 18 : 0;
  // два оборота и в конце ровно на поля (минус наклон, с которым шляпа слетела)
  const tilt0 = Math.atan2(M0[1], M0[0]);
  const a = (E.rad(-720) - tilt0) * E.EASE.out(u);
  return E.mul(E.T(x, yl - bounce), E.mul(E.R(a), E.mul(E.T(-c0[0], -c0[1]), M0)));
}

window.renderFrame = (f) => {
  const t = f / FPS;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  // камера: приближение + тряска
  const cz = cam.get('zoom', t, 1), ccx = cam.get('cx', t, 960), ccy = cam.get('cy', t, 600);
  let sx = 0, sy = 0;
  for (const s of SHAKE) {
    const u = (t - s.t) / s.dur;
    if (u >= 0 && u < 1) {
      const a = s.amp * (1 - u);
      sx += a * Math.sin(t * 91 + s.t * 7); sy += a * Math.cos(t * 77 + s.t * 3);
    }
  }
  const CAM = E.mul(E.T(W / 2 + sx, 600 + sy), E.mul(E.S(cz, cz), E.T(-ccx, -ccy)));
  // фон с облаками
  ctx.setTransform(...CAM);
  ctx.drawImage(BG.canvas, -BG.margin, -BG.margin);
  for (const [x0, y, s, v] of [[120, 160, 1.2, 9], [760, 250, 0.9, 6], [1350, 140, 1.4, 11], [1700, 300, 0.8, 5]]) {
    const span = W + 600;
    FX.cloud(ctx, ((x0 + v * t + 300) % span) - 300, y, s);
  }
  const states = evalStates(t);
  // тени
  for (const n of Object.keys(C)) {
    const st = states[n], p = st.p;
    if (!p.show) continue;
    const foot = E.apply(st.G, C[n].anchor), head = C[n].point(st, 'head');
    const lying = Math.abs(p.rot) > 45 && n !== 'fat';
    const cx = lying ? (foot[0] + head[0]) / 2 : foot[0];
    const air = Math.max(0, GROUND - Math.max(foot[1], head[1]) - (lying ? 120 : 0));
    const base = lying ? Math.abs(head[0] - foot[0]) * 0.6 : C[n].width * SC * 0.4;
    FX.shadow(ctx, cx, GROUND + 6, base * Math.max(0.3, 1 - air / 900), 0.22 * Math.max(0.2, 1 - air / 700));
  }
  // персонажи по z
  const order = Object.keys(C).filter((n) => states[n].p.show).sort((a, b) => (states[a].p.z || 0) - (states[b].p.z || 0));
  for (const n of order) C[n].draw(ctx, states[n], CAM);
  // шляпа
  if (t >= HAT.t) {
    const hat = C.lord.layers.find((l) => l.name === 'hat');
    const M = E.mul(CAM, hatMatrix(t));
    ctx.setTransform(...M);
    ctx.drawImage(hat.img.canvas, hat.img.x, hat.img.y, hat.img.w, hat.img.h);
  }
  ctx.setTransform(...CAM);
  // эффекты
  for (const d of DUST) FX.dust(ctx, d.x, GROUND - 6, d.r, (t - d.t) / 0.6, d.n, Math.round(d.x));
  for (const b of BURST) {
    const life = (t - b.t) / 0.32;
    if (life >= 0 && life <= 1) {
      const at = typeof b.at === 'string' ? target(b.at, evalStates(b.t)) : b.at;
      FX.burst(ctx, at[0], at[1], b.r, life, b.t * 3);
    }
  }
  for (const d of DIZZY) {
    if (t < d.t0 || t > d.t1) continue;
    const h = C[d.who].point(states[d.who], 'head');
    FX.dizzy(ctx, h[0], h[1] - 70, t - d.t0, 55);
  }
  for (const w of TWINKLE) FX.twinkle(ctx, w.x, w.y, (t - w.t) / 0.5);
  // интерфейс и надписи — без камеры
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  FX.hud(ctx, W, { img: PORTRAIT.lord, hp: hp.lord.get('hp', t, 100) }, { img: PORTRAIT.pink, hp: hp.pink.get('hp', t, 100) });
  for (const s of TEXT) {
    if (t < s.t0 || t > s.t1) continue;
    const u = (t - s.t0) / 0.22;
    const pop = u < 1 ? 1.7 - 0.7 * E.EASE.back(u) : 1;
    const fade = Math.min(1, (s.t1 - t) / 0.15);
    ctx.save();
    ctx.globalAlpha = Math.max(0, fade);
    ctx.translate(W / 2, s.y || 420); ctx.scale(pop, pop);
    E.pixelText(ctx, s.text, 0, 0, s.px, { color: s.color });
    ctx.restore();
  }
};
