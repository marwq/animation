// Общие помощники сцены: случайные числа с зерном, сглаживание, ключевые кадры, текстуры из canvas.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// Детерминированный генератор (mulberry32): одна и та же сцена при каждом рендере
export function rng(seed) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
export const lerp = (a, b, k) => a + (b - a) * k;
export const smooth = (x) => {
  x = clamp(x, 0, 1);
  return x * x * (3 - 2 * x);
};
export const easeInOut = (x) => {
  x = clamp(x, 0, 1);
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
};
export const wrap = (x, a, b) => a + ((((x - a) % (b - a)) + (b - a)) % (b - a));

// Ключи [[t, v], ...]: между соседними ключами — плавный переход
export function keyed(keys, t, ease = easeInOut) {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    const [t1, v1] = keys[i];
    if (t <= t1) {
      const [t0, v0] = keys[i - 1];
      return v0 + (v1 - v0) * ease((t - t0) / (t1 - t0));
    }
  }
  return keys[keys.length - 1][1];
}

// Окно 0 → 1 → 0 с плавными краями: для подписей и затемнений
export function window01(t, a, b, ramp = 0.3) {
  return smooth((t - a) / ramp) * (1 - smooth((t - (b - ramp)) / ramp));
}

// Монотонный кубический сплайн (Фриттч — Карлсон): глубина растёт без откатов и рывков
export function monotone(points) {
  const n = points.length;
  const xs = points.map((p) => p[0]);
  const ys = points.map((p) => p[1]);
  const d = [];
  for (let i = 0; i < n - 1; i++) d.push((ys[i + 1] - ys[i]) / (xs[i + 1] - xs[i]));
  const m = new Array(n);
  m[0] = d[0];
  m[n - 1] = d[n - 2];
  for (let i = 1; i < n - 1; i++) m[i] = d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2;
  for (let i = 0; i < n - 1; i++) {
    if (d[i] === 0) {
      m[i] = m[i + 1] = 0;
      continue;
    }
    const a = m[i] / d[i];
    const b = m[i + 1] / d[i];
    const s = a * a + b * b;
    if (s > 9) {
      const k = 3 / Math.sqrt(s);
      m[i] = k * a * d[i];
      m[i + 1] = k * b * d[i];
    }
  }
  return (x) => {
    if (x <= xs[0]) return ys[0];
    if (x >= xs[n - 1]) return ys[n - 1] + m[n - 1] * (x - xs[n - 1]);
    let i = 0;
    while (x > xs[i + 1]) i++;
    const h = xs[i + 1] - xs[i];
    const t = (x - xs[i]) / h;
    const t2 = t * t;
    const t3 = t2 * t;
    return (
      (2 * t3 - 3 * t2 + 1) * ys[i] +
      (t3 - 2 * t2 + t) * h * m[i] +
      (-2 * t3 + 3 * t2) * ys[i + 1] +
      (t3 - t2) * h * m[i + 1]
    );
  };
}

export function canvasTexture(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  draw(c.getContext('2d'), w, h);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

export const lambert = (color, extra = {}) => new THREE.MeshLambertMaterial({ color, flatShading: true, ...extra });

export function box(w, h, d, material) {
  return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
}

// Плавная дорожка движения: монотонный сплайн по ключам, пропущенный через критически
// демпфированную «пружину». Скорость непрерывна, у поворотов есть естественная инерция.
export function track(keys, omega = 6, rate = 240) {
  const f = monotone(keys);
  const t0 = keys[0][0] - 1;
  const n = Math.ceil((keys[keys.length - 1][0] + 1 - t0) * rate) + 1;
  const out = new Float32Array(n);
  const dt = 1 / rate;
  let x = f(t0);
  let v = 0;
  for (let i = 0; i < n; i++) {
    v += (omega * omega * (f(t0 + i * dt) - x) - 2 * omega * v) * dt;
    x += v * dt;
    out[i] = x;
  }
  return (t) => {
    const p = clamp((t - t0) * rate, 0, n - 1);
    const i = Math.floor(p);
    return i + 1 < n ? lerp(out[i], out[i + 1], p - i) : out[n - 1];
  };
}

// Коробка, у которой развёртка в метрах: текстура окон повторяется по фасаду, а не растягивается
export function uvBox(w, h, d, tileU = 1, tileV = 1) {
  const g = new THREE.BoxGeometry(w, h, d);
  const uv = g.attributes.uv;
  const dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]]; // +x, -x, +y, -y, +z, -z
  for (let f = 0; f < 6; f++) {
    for (let k = 0; k < 4; k++) {
      const i = f * 4 + k;
      uv.setXY(i, (uv.getX(i) * dims[f][0]) / tileU, (uv.getY(i) * dims[f][1]) / tileV);
    }
  }
  return g;
}

// Склейка статичной геометрии по материалам: тысячи деталей — десяток вызовов отрисовки
export class Batch {
  constructor() {
    this.parts = new Map();
    this.m = new THREE.Matrix4();
    this.q = new THREE.Quaternion();
    this.e = new THREE.Euler();
  }
  add(geometry, material, x = 0, y = 0, z = 0, ry = 0, rx = 0, rz = 0) {
    const g = (geometry.index ? geometry.toNonIndexed() : geometry.clone());
    for (const name of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(name)) g.deleteAttribute(name);
    this.q.setFromEuler(this.e.set(rx, ry, rz));
    g.applyMatrix4(this.m.compose(new THREE.Vector3(x, y, z), this.q, new THREE.Vector3(1, 1, 1)));
    if (!this.parts.has(material)) this.parts.set(material, []);
    this.parts.get(material).push(g);
    return this;
  }
  box(w, h, d, material, x, y, z, ry = 0) {
    return this.add(new THREE.BoxGeometry(w, h, d), material, x, y, z, ry);
  }
  build(group) {
    for (const [material, list] of this.parts) group.add(new THREE.Mesh(mergeGeometries(list, false), material));
    this.parts.clear();
  }
}
