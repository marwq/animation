// Скелет против Лорда — драка 25 с, 24 кадра/с, по стилю «animal hospital long»
// (docs/animal_hospital_long.md).
//
//   0–4 с     оба маленькие (шарики), неподвижно смотрят друг на друга
//   4–8 с     шарик-Лорд скачет и бьёт головой, шарик-Скелет улетает кувырком, звёздочки
//   8–11 с    Скелет злится (жилка, пар), ухмыляется, лучи, дым — большой крылатый скелет
//   11–14 с   Скелет подходит и шлёпает шарик-Лорда, тот улетает
//   14–17 с   Лорд злится и превращается в большого
//   17–21 с   удар Скелета мимо (Лорд отскочил), шляпа-бумеранг Лорда по лицу Скелета
//   21–23 с   апперкот — Скелет улетает за кадр, блеск
//   23–25 с   Лорд в центре, лицом к зрителю, руки вверх
//
// Время — в кадрах. key(кто, кадр, {свойства}, n) — поза-на-позу: прежняя поза держится
// и меняется за последние n кадров до кадра. move(...) — непрерывное движение от
// прошлого ключа (дуги прыжков, полёты). Свойства позы — см. animations/engine.js.
'use strict';

const FPS = 24, NF = 600, W = 1920, H = 1080, GROUND = 816, EDGE = 757;
window.SCENE = { fps: FPS, duration: NF / FPS, width: W, height: H, name: 'skeleton-vs-lord' };
const F = (f) => f / FPS;

// ------------------------------------------------------------------ персонажи
// размеры как в образце: шарик ~300 px, большие ~730 px от верха шляпы/черепа до подошв
const CAST = {
  lord: { small: ['lord-verity-small', { bodyHeight: 300 }], big: ['lord-verity-big', { height: 730 }], pivot: 337 },
  skel: { small: ['skeleton-verity-small', { scale: 0.455 }], big: ['skeleton-verity-big', { height: 730 }], pivot: 325 },
};
const TR = { lord: new E.Track(), skel: new E.Track() };
const key = (who, f, props, n = 4, ease = 'io') => TR[who].add(F(f), props, ease, n === null ? null : F(n));
const move = (who, f, props, ease = 'io') => TR[who].add(F(f), props, ease, null);
const C = {};   // C.lord.small, C.lord.big ...

// ------------------------------------------------------------------ события эффектов
const FX_EV = { spark: [], shake: [], zoom: [], dust: [], smoke: [], flash: [], rays: [], vein: [], steam: [],
  sweat: [], stars: [], twinkle: [], whoosh: [] };
const ev = (kind, o) => FX_EV[kind].push(o);

// ------------------------------------------------------------------ помощники движения
// шарик: прыжок с подготовкой (сквош), отрывом (вытягивание) и приземлением
function hop(who, f0, f1, x0, x1, h, o = {}) {
  const mid = Math.round((f0 + f1) / 2);
  key(who, f0, { sx: 1.2, sy: 0.82 }, o.prep ?? 4);
  move(who, f0, { x: x0, y: GROUND });
  key(who, f0 + 2, { sx: 0.86, sy: 1.16 }, 2);
  move(who, mid, { y: GROUND - h }, 'out2');
  key(who, mid, { sx: 1, sy: 1 }, 3);
  move(who, f1, { y: GROUND }, 'in2');
  move(who, f1, { x: x1 }, 'lin');
  key(who, f1, { sx: o.land || 1.22, sy: o.landY || 0.8 }, 1);
  key(who, f1 + 3, { sx: 0.95, sy: 1.06 }, 3);
  key(who, f1 + 7, { sx: 1, sy: 1 }, 4);
  if (o.dust) ev('dust', { f: f1, x: x1, r: 30, n: 4 });
}

// шарик: отлёт кувырком по дуге (вращение вокруг центра), приземление, отскок, звёздочки
function tumble(who, f0, f1, x0, x1, h, turns, o = {}) {
  const mid = Math.round(f0 + (f1 - f0) * 0.42);
  key(who, f0, { pivot: CAST[who].pivot }, 0);
  move(who, f0, { x: x0, y: GROUND, rot: 0 });
  move(who, mid, { y: GROUND - h }, 'out2');
  move(who, f1, { y: GROUND }, 'in2');
  move(who, f1, { x: x1 }, 'out2');
  move(who, f1, { rot: 360 * turns }, 'lin');
  key(who, f1 + 1, { rot: 0 }, 0);
  key(who, f1, { sx: 1.32, sy: 0.7 }, 1);
  move(who, f1 + 5, { y: GROUND - 45 }, 'out2');
  key(who, f1 + 5, { sx: 0.94, sy: 1.08 }, 4);
  move(who, f1 + 10, { y: GROUND }, 'in2');
  key(who, f1 + 10, { sx: 1.12, sy: 0.9 }, 2);
  key(who, f1 + 16, { sx: 1, sy: 1 }, 5);
  ev('dust', { f: f1, x: x1, r: 36, n: 6 });
  ev('shake', { f: f1, amp: 8, n: 8 });
  if (o.stars) ev('stars', { who, f0: f1 + 4, f1: f1 + 4 + o.stars });
}

// смех шарика: пульс 1.05×0.95 <-> 0.97×1.03 каждые 4 кадра
function laugh(who, f0, f1) {
  for (let f = f0, i = 0; f < f1; f += 4, i++) key(who, f, i % 2 ? { sx: 0.97, sy: 1.03 } : { sx: 1.05, sy: 0.95 }, 2);
  key(who, f1, { sx: 1, sy: 1 }, 3);
}

// дрожь: x вокруг x0 на ±a пикселей каждый кадр
function tremble(who, f0, f1, x0, a) {
  const r = FX.rng(f0 + 7);
  key(who, f0, { x: x0 }, 0);
  for (let f = f0 + 1; f < f1; f++) key(who, f, { x: x0 + (r() * 2 - 1) * a }, 1, 'lin');
  key(who, f1, { x: x0 }, 1, 'lin');
}

// превращение по формуле гайда: злость (жилка, пар) -> ухмылка, лучи, дрожь и рост ->
// вспышка и дым -> из дыма большая версия (0.55 -> 1.1 -> 0.96 -> 1)
function transform(who, f, x, bigX, face) {
  key(who, f, { eyes: 'angry', mouth: 'sad' }, 0);
  ev('vein', { who, f0: f + 2, f1: f + 26 });
  ev('steam', { who, f0: f + 4, f1: f + 26 });
  tremble(who, f + 4, f + 22, x, 2);
  key(who, f + 22, { mouth: 'theeth smile' }, 0);
  ev('rays', { who, f0: f + 24, f1: f + 38 });
  tremble(who, f + 24, f + 38, x, 6);
  key(who, f + 24, { sx: 1, sy: 1 }, 0);
  key(who, f + 38, { sx: 1.1, sy: 1.1 }, 14, 'lin');
  const g = f + 38;
  ev('flash', { f: g, who });
  ev('smoke', { f: g, who, size: 700, dx: (bigX - x) / 2 });
  ev('shake', { f: g, amp: 14, n: 7 });
  ev('zoom', { f: g, n: 12, k: 0.05, who });
  key(who, g + 6, { form: 'big', x: bigX, face, sx: 0.55, sy: 0.55, look: 1, mouth: 'mouth', rot: 0, pivot: 0 }, 0);
  key(who, g + 10, { sx: 1.1, sy: 1.1 }, 4, 'out');
  key(who, g + 13, { sx: 0.96, sy: 0.96 }, 3);
  key(who, g + 16, { sx: 1, sy: 1 }, 3);
  return g + 6;
}

// большой: стойка как в риге (стопы на месте, руки висят чуть вперёд)
function stance(who, x, face, extra = {}) {
  const ch = C[who].big;
  const rf = ch.handRest('F'), rb = ch.handRest('B');
  return { x, y: GROUND, face, hip: [0, 8], lean: 0, head: 0, ...ch.feet(x, face),
    handF: [rf[0] + 70, rf[1] - 60], handB: [rb[0] - 10, rb[1] - 20], legFfk: 0, legBfk: 0, ...extra };
}

// большой: ходьба. Опорная стопа стоит, задняя переносится вперёд с подъёмом
// (колено вперёд), тело ниже всего, когда ноги шире всего; руки чуть качаются.
function walk(who, f0, x0, x1, steps, n = 10, face = 1, swing = true) {
  const ch = C[who].big;
  const pos = ch.feet(x0, face);
  const rf = ch.handRest('F'), rb = ch.handRest('B');
  for (let i = 0; i < steps; i++) {
    const fs = f0 + i * n, fe = fs + n;
    const behind = face * pos.footF[0] < face * pos.footB[0] ? 'footF' : 'footB';
    const ahead = behind === 'footF' ? 'footB' : 'footF';
    const xb = x0 + (x1 - x0) * Math.min(1, (i + 2) / steps);
    let tx = ch.feet(xb, face)[behind][0];
    if (i < steps - 1 && face * (tx - pos[ahead][0]) < 50) tx = pos[ahead][0] + face * 80;
    key(who, fs, { [behind]: [pos[behind][0], 0] }, 0);
    move(who, fs + n / 2, { [behind]: [(pos[behind][0] + tx) / 2, 30] }, 'out2');
    move(who, fe, { [behind]: [tx, 0] }, 'in2');
    key(who, fs + n / 2, { hip: [0, -4] }, n / 2);
    key(who, fe, { hip: [0, 16] }, n / 2);
    if (swing) {
      const fw = behind === 'footB' ? 1 : -1;   // рука напротив ноги
      key(who, fs + n / 2, { handF: [rf[0] + 70 + fw * 70, rf[1] - 60], handB: [rb[0] - fw * 70, rb[1] - 20] }, n / 2);
    }
    pos[behind] = [tx, 0];
  }
  move(who, f0, { x: x0 });
  move(who, f0 + steps * n, { x: x1 }, 'lin');
  key(who, f0 + steps * n + 4, { hip: [0, 8] }, 4);
  if (swing) key(who, f0 + steps * n + 4, { handF: [rf[0] + 70, rf[1] - 60], handB: [rb[0] - 10, rb[1] - 20] }, 4);
}

// ================================================================== 0–4 с: стойка
// Лорд слева смотрит вправо, Скелет справа смотрит влево; оба маленькие и злые, не двигаются
key('lord', 0, { form: 'small', x: 560, y: GROUND, face: 1, look: 1, eyes: 'angry', mouth: 'theeth smile', sx: 1, sy: 1, rot: 0 }, 0);
key('skel', 0, { form: 'small', x: 1360, y: GROUND, face: -1, look: 1, eyes: 'angry', mouth: 'smile normal', sx: 1, sy: 1, rot: 0 }, 0);

// ================================================================== 4–8 с: удар головой
hop('lord', 100, 112, 560, 700, 80, { dust: true });
hop('lord', 120, 132, 700, 840, 80, { dust: true });
key('lord', 140, { sx: 1.24, sy: 0.78 }, 6);                       // присел, набирает силу
tremble('lord', 140, 150, 840, 3);
key('lord', 152, { sx: 0.8, sy: 1.18 }, 2);                        // бросок головой вперёд
move('lord', 150, { x: 840, y: GROUND });
move('lord', 153, { y: GROUND - 26 }, 'out2');
move('lord', 156, { y: GROUND - 4 }, 'in2');
move('lord', 156, { x: 1066 }, 'in2');
key('lord', 156, { sx: 0.76, sy: 1.2 }, 1);                        // сплющился о соперника
ev('spark', { f: 156, at: [1214, GROUND - 165], r: 66 });
ev('shake', { f: 156, amp: 12, n: 10 });
ev('zoom', { f: 156, n: 10, k: 0.05, at: [1214, GROUND - 165] });
key('skel', 156, { sx: 1, sy: 1 }, 0);
key('skel', 158, { sx: 0.86, sy: 1.1, eyes: 'sad', mouth: 'puzzlement' }, 2);   // живот сжался
key('skel', 160, { sx: 1.1, sy: 0.92 }, 2);
tumble('skel', 160, 186, 1360, 1590, 280, 2, { stars: 16 });
key('skel', 187, { eyes: 'sad', mouth: 'sad' }, 0);
// Лорд отскакивает назад и смеётся
move('lord', 160, { y: GROUND - 50 }, 'out2');
move('lord', 166, { y: GROUND }, 'in2');
move('lord', 166, { x: 990 }, 'out2');
key('lord', 160, { sx: 1, sy: 1 }, 4);
key('lord', 166, { sx: 1.15, sy: 0.86 }, 1);
key('lord', 171, { sx: 1, sy: 1 }, 4);
key('lord', 172, { mouth: 'happy with theeth', eyes: 'normal' }, 0);
laugh('lord', 174, 206);

// ================================================================== 8–11 с: Скелет превращается
const SKX = 1470;
const SKB = transform('skel', 206, 1590, SKX, -1);
// Лорд пугается: рот «О», дрожь, пот — потом злится
key('lord', 248, { mouth: 'puzzlement', eyes: 'sad' }, 0);
tremble('lord', 250, 270, 990, 2);
ev('sweat', { who: 'lord', f0: 250, f1: 280 });
key('lord', 280, { eyes: 'angry', mouth: 'sad' }, 0);

// ================================================================== 11–13.5 с: шлепок
ev('spark', { f: 300, at: 'lord:cheek', r: 70 });
ev('shake', { f: 300, amp: 14, n: 10 });
ev('zoom', { f: 300, n: 12, k: 0.06, at: 'lord:cheek' });
key('lord', 298, { eyes: 'angry', mouth: 'sad' }, 0);
key('lord', 301, { sx: 0.82, sy: 1.12, eyes: 'sad', mouth: 'puzzlement' }, 1);
tumble('lord', 302, 326, 990, 640, 250, -2, { stars: 22 });
key('lord', 327, { eyes: 'sad', mouth: 'sad' }, 0);

// ================================================================== 13.5–16.5 с: Лорд превращается
const LX = 640;
const LB = transform('lord', 352, 640, LX, 1);

// позы больших — после загрузки ригов (нужны размеры рук и ног)
const BIG = () => {
  // ---- Скелет большой: гордо стоит, крылья приподняты
  key('skel', SKB, stance('skel', SKX, -1, { b_B16: 12, b_B17: -12 }), 0);
  key('skel', 294, { mouth: 'angry theeth' }, 0);
  walk('skel', 270, SKX, 1325, 2, 10, -1);
  key('skel', 296, { handF: [-320, 380], lean: -8, hip: [0, 60], b_B16: 0, b_B17: 0, hitF: 0 }, 6);     // замах назад-вниз
  key('skel', 299, { over: 'F' }, 0);
  key('skel', 300, { handF: [260, 330], lean: 20, hip: [10, 140], hitF: 1, hitFto: 'lord:cheek', hitFfix: 300 }, 4, 'in2');
  key('skel', 306, { hitF: 1 }, 1);
  key('skel', 314, { hitF: 0, handF: [200, 380], lean: 10, hip: [0, 80], over: null }, 8);
  key('skel', 322, { ...stance('skel', 1325, -1), b_B16: 0, b_B17: 0, mouth: 'happy with theeth' }, 8);
  key('skel', 346, { b_B16: 12, b_B17: -12 }, 8);
  // ---- Скелет пугается превращения Лорда: крылья вниз, рот «О», пот; потом злится
  key('skel', 396, { mouth: 'puzzlement', lean: -8, head: -6, b_B16: 45, b_B17: -45 }, 6);
  ev('sweat', { who: 'skel', f0: 398, f1: 420 });
  key('skel', 418, { mouth: 'angry theeth', lean: 4, head: 0, b_B16: 12, b_B17: -12 }, 6);

  // ---- 17–19 с: Скелет бьёт, Лорд отскакивает назад — промах
  key('lord', LB, stance('lord', LX, 1), 0);
  walk('skel', 420, 1325, 1060, 2, 10, -1);
  key('skel', 446, { handF: [-200, 60], lean: -10, hip: [0, 50] }, 6);             // замах
  key('skel', 452, { handF: [420, -60], lean: 22, hip: [30, 60] }, 4, 'out');     // удар
  ev('whoosh', { f: 453, at: [LX + 70, GROUND - 600] });
  key('skel', 456, { mouth: 'puzzlement' }, 0);
  key('skel', 466, { ...stance('skel', 1060, -1), mouth: 'angry theeth', b_B16: 12, b_B17: -12 }, 10);
  // отскок: таз назад-вниз, корпус откинут, колени вперёд
  key('lord', 444, { hip: [0, 40] }, 4);
  key('lord', 448, { hip: [0, 70], lean: -6 }, 4);
  move('lord', 448, { x: LX, y: GROUND });
  key('lord', 449, { legFfk: 1, legBfk: 1, legF: [12, -24], legB: [-14, 26], lean: -18, head: -8, hip: [-20, 40],
    handF: [120, 300], handB: [-160, 380], mouth: 'puzzlement' }, 3);
  move('lord', 453, { y: GROUND - 40 }, 'out2');
  move('lord', 458, { y: GROUND }, 'in2');
  move('lord', 458, { x: LX - 160 }, 'out2');
  key('lord', 456, { ...C.lord.big.feet(LX - 160, 1), legFfk: 1, legBfk: 1 }, 0);
  key('lord', 460, { legFfk: 0, legBfk: 0, hip: [0, 90], lean: -4, head: 0 }, 3);
  ev('dust', { f: 458, x: LX - 160, r: 30, n: 4 });
  const L2 = LX - 160;
  key('lord', 468, { ...stance('lord', L2, 1), mouth: 'mouth' }, 8);

  // ---- 19.5–20.5 с: шляпа-бумеранг — дальней рукой (она за головой, лицо не закрывает)
  // берёт шляпу за правый край, заносит над головой и бросает вперёд
  key('lord', 474, { handF: [122, -483] }, 6);
  HAT.f0 = 474;
  key('lord', 480, { handF: [-271, -592], lean: -6 }, 6);                          // замах над головой
  key('lord', 484, { handF: [489, -266], lean: 12, mouth: 'theeth smile' }, 4, 'in2');
  HAT.release = 484; HAT.hit = 492; HAT.back = 506;
  key('lord', 496, { ...stance('lord', L2, 1), mouth: 'mouth' }, 8);
  key('skel', 491, { head: 0, lean: 4 }, 0);
  key('skel', 494, { head: -18, lean: -10, mouth: 'puzzlement', b_B16: 40, b_B17: -40 }, 2, 'out');
  ev('spark', { f: 492, at: 'skel:face', r: 60 });
  ev('shake', { f: 492, amp: 10, n: 8 });
  ev('stars', { who: 'skel', f0: 496, f1: 530 });
  key('skel', 504, { head: -6, lean: -4 }, 6);
  walk('skel', 500, 1060, 1110, 1, 10, -1, false);                                 // отшатнулся назад
  key('lord', 506, { head: 4 }, 2);                                                // шляпа села на место
  key('lord', 510, { head: 0, mouth: 'happy with theeth' }, 4);

  // ---- 21–22 с: апперкот
  const LX3 = 800;
  key('lord', 514, { hip: [0, 150], lean: 12, handF: [-80, 260], mouth: 'angry theeth' }, 6);    // присел, набрал силу
  tremble('lord', 514, 522, L2, 3);
  walk('lord', 522, L2, LX3, 2, 6, 1, false);
  key('lord', 532, { hip: [0, 120], lean: 14, handF: [120, 240], hitF: 0 }, 3);
  key('lord', 536, { hip: [0, 10], lean: 4, handF: [220, -380], hitF: 1, hitFto: 'skel:jaw', hitFfix: 536 }, 3, 'in2');
  key('lord', 541, { hitF: 0, handF: [320, -600] }, 5);                            // кулак уходит вверх
  key('lord', 544, { mouth: 'happy with theeth' }, 0);
  ev('spark', { f: 536, at: 'skel:jaw', r: 90 });
  ev('shake', { f: 536, amp: 20, n: 14 });
  ev('zoom', { f: 536, n: 14, k: 0.1, at: 'skel:jaw' });
  // Скелет улетает вверх-вправо, кувыркаясь, за кадр — на месте блеск
  key('skel', 536, { pivot: 880, legFfk: 1, legBfk: 1, legF: [-30, 50], legB: [25, -40], mouth: 'puzzlement',
    handF: [-150, -200], handB: [-250, -150] }, 0);
  move('skel', 536, { x: 1110, y: GROUND, rot: 0 });
  move('skel', 568, { x: 2120, rot: 1080 }, 'lin');
  move('skel', 568, { y: -420 }, 'out2');
  for (let f = 538; f < 568; f += 4) key('skel', f, { b_B16: (f / 4) % 2 ? -20 : 40, b_B17: (f / 4) % 2 ? 20 : -40 }, 2);
  ev('twinkle', { f: 566, at: [1830, 110], n: 22, size: 56 });

  // ---- 22.5–25 с: победитель идёт в центр, поворачивается к зрителю, руки вверх
  walk('lord', 548, LX3, 960, 2, 10, 1);
  key('lord', 570, { look: 0 }, 4);
  key('lord', 575, { handF: [440, -40], handB: [-440, -40] }, 3);                  // руки через стороны
  key('lord', 578, { handF: [170, -560], handB: [-170, -560], head: -4, mouth: 'happy with theeth' }, 3);
  for (const [f, x, y] of [[578, 790, 260], [584, 1130, 200], [590, 760, 470], [594, 1170, 430], [598, 960, 120]]) {
    ev('twinkle', { f, at: [x, y], n: 16, size: 34 });
  }
};
const HAT = {};

// ------------------------------------------------------------------ сборка кадра
const ctx = document.getElementById('stage').getContext('2d');
let BG;
window.READY = (async () => {
  for (const [who, c] of Object.entries(CAST)) {
    C[who] = {
      small: new E.Character(await E.loadRig(c.small[0]), c.small[1]),
      big: new E.Character(await E.loadRig(c.big[0]), c.big[1]),
    };
  }
  BIG();
  BG = FX.background(W, H, EDGE);
})();

const DEF = { x: 0, y: GROUND, face: 1, hip: [0, 0], lean: 0, head: 0, rot: 0, sx: 1, sy: 1, pivot: 0, look: 0,
  hide: [], legF: null, legB: null, hitF: 0, hitB: 0, kickF: 0, zF: null, zB: null, over: null };

function poseOf(who, f) {
  const p = TR[who].sample(F(f), { ...DEF });
  const ch = C[who][p.form || 'small'];
  if (p.form !== 'big') {   // у шарика нет рук и ног
    for (const k of Object.keys(p)) if (/^(foot|hand|leg|arm|hit|kick)/.test(k)) delete p[k];
  }
  return { p, ch };
}

function target(spec, S) {
  const [who, part] = spec.split(':');
  const { ch, st } = S[who];
  if (part === 'cheek') {                    // край лица со стороны удара — сюда ложится ладонь
    const f = ch.point(st, 'face'), h = ch.point(st, 'head');
    return [h[0] + (f[0] - h[0]) * 1.4, f[1]];
  }
  if (part === 'jaw') {
    const f = ch.point(st, 'face'), h = ch.point(st, 'head');
    return [f[0] - (f[0] - h[0]) * 0.2, f[1] + (ch.height * 0.06)];
  }
  return ch.point(st, part);
}

function evalStates(f) {
  const S = {};
  for (const who of Object.keys(TR)) {
    const { p, ch } = poseOf(who, f);
    S[who] = { ch, st: ch.pose(p, { ground: GROUND }), p };
  }
  for (const who of Object.keys(TR)) {
    const { p, ch } = S[who];
    const reach = {};
    // после кадра удара (…fix) цель замирает: рука не тянется за улетающим соперником
    for (const k of ['hitF', 'hitB', 'kickF']) {
      if (!(p[k] > 0)) continue;
      const fix = p[k + 'fix'];
      reach[k] = { at: target(p[k + 'to'], fix !== undefined && f > fix ? statesAt(fix) : S), w: p[k] };
    }
    if (Object.keys(reach).length) S[who].st = ch.pose(p, { ground: GROUND, ...reach });
  }
  return S;
}

// шляпа Лорда: в руке -> летит, кувыркаясь, в лицо Скелету -> по дуге обратно на голову
const cache = {};
const statesAt = (f) => cache[f] || (cache[f] = evalStates(f));
function hatMatrix(f) {
  const L = C.lord.big;
  const hat = L.layers.find((l) => l.name === 'hat');
  const hc = [(hat.bbox[0] + hat.bbox[2]) / 2, (hat.bbox[1] + hat.bbox[3]) / 2];
  const onHead = (g) => L.layerMatrix(statesAt(g).lord.st, 'hat');
  // в руке: в момент хвата шляпа на месте, за 6 кадров садится на кисть (держит снизу за поля)
  const inHand = (g) => {
    const hand = L.point(statesAt(g).lord.st, 'handF');
    const hand0 = L.point(statesAt(HAT.f0).lord.st, 'handF');
    const M0 = onHead(HAT.f0);
    const c0 = E.apply(M0, hc);
    const k = E.EASE.io(E.clamp((g - HAT.f0) / 6, 0, 1));
    const off = [E.lerp(c0[0] - hand0[0], -20, k), E.lerp(c0[1] - hand0[1], -35, k)];
    return E.mul(E.T(hand[0] + off[0] - c0[0], hand[1] + off[1] - c0[1]), M0);
  };
  if (f < HAT.release) return f <= HAT.f0 ? onHead(f) : inHand(f);
  const M1 = inHand(HAT.release);
  const c1 = E.apply(M1, hc);
  const hitP = target('skel:face', statesAt(HAT.hit));
  const back = onHead(HAT.back), cb = E.apply(back, hc);
  const spin = (a, c, M) => E.mul(E.T(c[0], c[1]), E.mul(E.R(a), E.mul(E.T(-c1[0], -c1[1]), M)));
  if (f <= HAT.hit) {
    const u = (f - HAT.release) / (HAT.hit - HAT.release);
    const c = [E.lerp(c1[0], hitP[0], u), E.lerp(c1[1], hitP[1], u) - Math.sin(Math.PI * u) * 60];
    return spin(-E.rad(720) * u, c, M1);
  }
  const u = Math.min(1, (f - HAT.hit) / (HAT.back - HAT.hit));
  const c = [E.lerp(hitP[0], cb[0], u), E.lerp(hitP[1], cb[1], u) - Math.sin(Math.PI * u) * 70];
  const tilt = Math.atan2(back[1], back[0]) - Math.atan2(M1[1], M1[0]);
  return spin(E.lerp(-E.rad(720), -E.rad(1440) + tilt, E.EASE.out2(u)), c, M1);
}

const CLOUDS = [[140, 70, 1.2, 0, 26], [620, 200, 0.9, 1, 20], [980, 60, 1.0, 2, 30], [1320, 150, 1.3, 0, 22],
  [1700, 250, 0.8, 1, 34], [420, 300, 0.7, 2, 18]];

window.renderFrame = (f) => {
  const t = F(f);
  const S = evalStates(f);
  // камера: стоит; трясётся и коротко наезжает на ударах
  let sx = 0, sy = 0, zk = 0, zc = [W / 2, H / 2];
  for (const s of FX_EV.shake) {
    const u = (f - s.f) / s.n;
    if (u >= 0 && u < 1) { const a = s.amp * (1 - u); sx += a * Math.sin(f * 2.7 + s.f); sy += a * Math.cos(f * 3.1 + s.f); }
  }
  for (const z of FX_EV.zoom) {
    const u = (f - z.f) / z.n;
    if (u >= 0 && u < 1) {
      zk = z.k * Math.sin(Math.PI * Math.min(1, u * 1.6)) * (u < 0.62 ? 1 : 1);
      zc = z.at ? (typeof z.at === 'string' ? target(z.at, statesAt(z.f)) : z.at) : S[z.who].ch.point(S[z.who].st, 'body');
    }
  }
  const zz = 1 + zk;
  const CAM = E.mul(E.T(sx + zc[0], sy + zc[1]), E.mul(E.S(zz, zz), E.T(-zc[0], -zc[1])));
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.setTransform(...CAM);
  ctx.drawImage(BG.canvas, -BG.margin, -BG.margin);
  for (const [x0, y, s, kind, v] of CLOUDS) {
    const span = W + 300;
    FX.cloud(ctx, ((x0 + v * t + 150) % span) - 150, y, s, kind);
  }
  // тени
  for (const who of Object.keys(S)) {
    const { ch, st, p } = S[who];
    const foot = E.apply(st.G, ch.anchor);
    const lying = Math.abs(p.rot % 360) > 45 && p.form === 'big';
    const air = Math.max(0, GROUND - foot[1]);
    const w = (p.form === 'big' ? 120 : ch.width * 0.42) * Math.max(0.35, 1 - air / 700);
    if (foot[1] > -200) FX.shadow(ctx, lying ? foot[0] : foot[0], GROUND + 6, w, 0.3 * Math.max(0.25, 1 - air / 600));
  }
  // лучи — за спиной
  for (const r of FX_EV.rays) {
    if (f < r.f0 || f > r.f1 + 6) continue;
    const { ch, st } = S[r.who];
    const c = ch.point(st, 'body');
    FX.rays(ctx, c[0], c[1], 420, Math.min(1, (f - r.f0) / (r.f1 - r.f0)) * (f > r.f1 ? 1 - (f - r.f1) / 6 : 1), t * 0.6);
  }
  // персонажи (Скелет дальше, Лорд ближе к зрителю)
  for (const who of ['skel', 'lord']) {
    const { ch, st, p } = S[who];
    const pp = who === 'lord' && p.form === 'big' && f >= (HAT.f0 || 1e9) && f < HAT.back ? { ...p, hide: [...(p.hide || []), 'hat'] } : p;
    ch.draw(ctx, { ...st, p: pp }, CAM);
  }
  // бьющая рука поверх соперника
  for (const who of Object.keys(S)) {
    const { ch, st, p } = S[who];
    if (p.over) ch.draw(ctx, { ...st, p: { ...p, only: p.over } }, CAM);
  }
  // шляпа отдельно, пока она не на голове
  if (HAT.f0 && f >= HAT.f0 && f < HAT.back) {
    const L = C.lord.big, hat = L.layers.find((l) => l.name === 'hat');
    ctx.setTransform(...E.mul(CAM, hatMatrix(f)));
    ctx.drawImage(hat.img.canvas, hat.img.x, hat.img.y, hat.img.w, hat.img.h);
  }
  ctx.setTransform(...CAM);
  // эффекты поверх
  const at = (o, g) => (typeof o.at === 'string' ? target(o.at, statesAt(g)) : o.at);
  for (const d of FX_EV.dust) FX.dust(ctx, d.x, GROUND + 4, d.r, (f - d.f) / 18, d.n, d.f);
  for (const s of FX_EV.spark) { const u = (f - s.f) / 8; if (u >= 0 && u <= 1) { const p = at(s, s.f); FX.spark(ctx, p[0], p[1], s.r, u, s.f); } }
  for (const w of FX_EV.whoosh) { const u = (f - w.f) / 14; if (u >= 0 && u <= 1) FX.whoosh(ctx, w.at[0], w.at[1], u); }
  for (const s of FX_EV.smoke) {
    const u = (f - s.f) / 40;
    if (u < 0 || u > 1) continue;
    const { ch, st } = statesAt(s.f)[s.who];   // облако стоит там, где началось превращение
    const base = E.apply(st.G, ch.anchor);
    FX.smoke(ctx, base[0] + (s.dx || 0), GROUND - 380, s.size, u, s.f);
  }
  for (const v of FX_EV.vein) {
    if (f < v.f0 || f > v.f1) continue;
    const { ch, st } = S[v.who], top = ch.point(st, 'top'), h = ch.point(st, 'head');
    const side = (st.p.face || 1);
    FX.vein(ctx, h[0] - side * ch.height * 0.22, top[1] + ch.height * 0.12, 1.4, t);
  }
  for (const v of FX_EV.steam) {
    if (f < v.f0 || f > v.f1) continue;
    const { ch, st } = S[v.who], top = ch.point(st, 'top');
    FX.steam(ctx, top[0], top[1] - 10, (f - v.f0) / FPS, 1.1);
  }
  for (const v of FX_EV.sweat) {
    if (f < v.f0 || f > v.f1) continue;
    const { ch, st } = S[v.who], h = ch.point(st, 'head');
    const side = -(st.p.face || 1);
    const u = (f - v.f0) / (v.f1 - v.f0);
    FX.sweat(ctx, h[0] + side * (ch.height * (st.p.form === 'big' ? 0.16 : 0.42)), h[1] - ch.height * 0.08 + u * 30, 1.3, Math.min(1, (v.f1 - f) / 6));
  }
  for (const v of FX_EV.stars) {
    if (f < v.f0 || f > v.f1) continue;
    const { ch, st } = S[v.who], top = ch.point(st, 'top');
    FX.stars(ctx, top[0], top[1] - 18, (f - v.f0) / FPS, st.p.form === 'big' ? 80 : 70);
  }
  for (const w of FX_EV.twinkle) FX.twinkle(ctx, w.at[0], w.at[1], (f - w.f) / (w.n || 20), w.size || 46);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  for (const fl of FX_EV.flash) {
    const u = (f - fl.f) / 4;
    if (u < 0 || u > 1) continue;
    const p = fl.at ? at(fl, fl.f) : S[fl.who].ch.point(S[fl.who].st, 'body');
    FX.flash(ctx, W, H, p[0], p[1], u, fl.strength || 0.35);
  }
};
