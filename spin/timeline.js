// Время и вращение Земли для ролика «What If Earth Spun Faster and Faster?». Всё считается из spin/scene.json
// так же, как в spin/story.py (оттуда же берёт моменты звук), поэтому рассветы в кадре и в звуке совпадают.
import scene from './scene.json' with { type: 'json' };
import { monotone, smooth, track } from '../pov/util.js';

export const SCENE = scene;
export const DURATION = scene.duration;
export const LAT = scene.lat;
export const CAPTIONS = scene.captions;
export const TITLE = scene.title;

const kAt = (t) => {
  const K = scene.timelapse;
  for (let i = 1; i < K.length; i++) {
    const [t0, k0] = K[i - 1];
    const [t1, k1] = K[i];
    if (t <= t1) return k0 + (k1 - k0) * smooth((t - t0) / (t1 - t0));
  }
  return K[K.length - 1][1];
};

const S = scene.spin;
// период вращения по расписанию во времени ролика (см. story.py period_at)
function periodAt(t) {
  const P = S.P0 * Math.exp(-Math.max(0, t - S.t_start) * S.rate / S.T);
  const m = S.P_min;
  return P < m + 0.6 ? m + (P - m) * smooth((P - m) / 0.6) : P;
}

// интеграл по сетке 1/240 с: часы истории, обороты относительно Солнца, длина суток
const STEP = 1 / 240;
const N = Math.ceil((DURATION + 1) / STEP) + 1;
const TAU = new Float64Array(N);
const TURNS = new Float64Array(N);
const PER = new Float64Array(N);
{
  let tau = 0;
  let turns = 0;
  for (let i = 0; i < N; i++) {
    const t = i * STEP;
    const P = periodAt(t);
    TAU[i] = tau;
    TURNS[i] = turns;
    PER[i] = P;
    const k = kAt(t);
    tau += k * STEP;
    const fz = scene.sun_freeze ? 1 - smooth((t - scene.sun_freeze[0]) / (scene.sun_freeze[1] - scene.sun_freeze[0])) : 1;
    turns += k * STEP * (1 / P - 1 / scene.year_h) * fz;
  }
}
const sample = (arr, t) => {
  const x = Math.min(N - 2, Math.max(0, t / STEP));
  const i = Math.floor(x);
  return arr[i] + (arr[i + 1] - arr[i]) * (x - i);
};

export const tauAt = (t) => sample(TAU, t); // часов истории с начала ролика
export const rotPeriod = (t) => sample(PER, t); // период вращения (относительно звёзд), ч
export const dayLength = (t) => 1 / (1 / rotPeriod(t) - 1 / scene.year_h); // солнечные сутки, ч: от рассвета до рассвета
export const timelapse = kAt; // часов истории в секунду
// местное солнечное время, ч (растёт непрерывно: 30 — это 6 утра следующего дня)
export const solarHours = (t) => scene.tau0 + 24 * sample(TURNS, t);

// вес и расстояние до центра по длине суток
const BY_P = [...scene.by_p].sort((a, b) => a[0] - b[0]);
function byP(P, col) {
  if (P <= BY_P[0][0]) return BY_P[0][col];
  for (let i = 1; i < BY_P.length; i++) {
    if (P <= BY_P[i][0]) {
      const [a, b] = [BY_P[i - 1], BY_P[i]];
      return a[col] + ((b[col] - a[col]) * (P - a[0])) / (b[0] - a[0]);
    }
  }
  return BY_P[BY_P.length - 1][col];
}
export const weightAt = (t) => byP(rotPeriod(t), 1);
export const radiusAt = (t) => byP(rotPeriod(t), 2);
// скорость вершины на восток, км/ч
export const speedAt = (t) => (2 * Math.PI * radiusAt(t) * Math.cos((LAT * Math.PI) / 180)) / rotPeriod(t);

// уровень моря у вершины относительно нынешнего, м (story.py: вода стекается к экватору, потом суша догоняет)
export const seaAt = scene.sea ? monotone(scene.sea) : () => 0;

const lin = (keys) => (t) => {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    if (t <= keys[i][0]) {
      const u = smooth((t - keys[i - 1][0]) / (keys[i][0] - keys[i - 1][0]));
      return keys[i - 1][1] + (keys[i][1] - keys[i - 1][1]) * u;
    }
  }
  return keys[keys.length - 1][1];
};
export const cloudAt = scene.cloud ? lin(scene.cloud) : () => 0.36;
export const shakeAt = scene.shake ? lin(scene.shake) : () => 0;
export const ERUPTIONS = scene.eruptions || [];
export const JUMPS = scene.jumps || [];
export const FLOAT_AT = scene.float_at ?? 1e9;
// высота героя над точкой вершины после отрыва (м): сплайн по логарифму
const altLog = scene.hero_alt ? monotone(scene.hero_alt.map(([t, a]) => [t, Math.log(a + 1)])) : () => 0;
export const heroAlt = (t) => (t <= FLOAT_AT ? 0 : Math.exp(altLog(Math.min(t, scene.hero_alt[scene.hero_alt.length - 1][0]))) - 1);
const groundLog = scene.ground ? monotone(scene.ground.map(([t, a]) => [t, Math.log(a + 1e-6)])) : () => -13.8;
const G_END = scene.ground ? scene.ground[scene.ground.length - 1] : [1e9, 0];
// после последнего ключа планета поворачивается видимо медленно (при большом ускорении времени — «стробоскоп»)
export const groundShift = (t) => {
  if (t <= FLOAT_AT) return 0;
  if (t > G_END[0]) return G_END[1] + (t - G_END[0]) * 0.11;
  return Math.exp(groundLog(t)) - 1e-6;
};
// камера в космосе: расстояние (км, по логарифму), наклон, долгота
const C3 = scene.cam3 || [[1e9, 1, 0, 0]];
const c3r = monotone(C3.map((k) => [k[0], Math.log(k[1])]));
const c3i = monotone(C3.map((k) => [k[0], k[2]]));
const c3l = monotone(C3.map((k) => [k[0], k[3]]));
export const CAM3_START = C3[0][0];
export const cam3 = (t) => {
  const tt = Math.min(t, C3[C3.length - 1][0]);
  return [Math.exp(c3r(tt)), c3i(tt), c3l(tt)];
};
export const LOOK3 = scene.look3 || [];
export const AVALANCHES = scene.avalanches || [];

export const headYaw = track(scene.head_yaw, 5.5);
export const headPitch = track(scene.head_pitch, 5.5);
export const bodyYaw = track(scene.body_yaw, 4);
export const check = track(scene.check, 7);
export const balance = track(scene.balance, 6);
export const floatW = track(scene.float, 3.5);
export const shield = track(scene.shield, 8);
export { monotone };
