// Космос во второй половине ролика: обломки вокруг героя (ледяные искры и камни, которые Земля сбросила с
// экватора), комки за пределом Роша, которые слипаются в луны, и новая луна, на которую герой садится.
// Координаты те же, что у вершины: центр Земли — (0, −R, 0), экватор — плоскость XY, север — −Z.
import * as THREE from 'three';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import { rng, smooth } from '../pov/util.js';

// --- шум для неровных тел ---------------------------------------------------------------------------------
function hash3(x, y, z) {
  const s = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453;
  return s - Math.floor(s);
}
function vnoise3(x, y, z) {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const zi = Math.floor(z);
  const f = (v) => v * v * (3 - 2 * v);
  const u = f(x - xi);
  const v = f(y - yi);
  const w = f(z - zi);
  let s = 0;
  for (let dx = 0; dx < 2; dx++) {
    for (let dy = 0; dy < 2; dy++) {
      for (let dz = 0; dz < 2; dz++) {
        s += hash3(xi + dx, yi + dy, zi + dz) * (dx ? u : 1 - u) * (dy ? v : 1 - v) * (dz ? w : 1 - w);
      }
    }
  }
  return s;
}
function fbm3(x, y, z, oct = 4) {
  let s = 0;
  let a = 0.5;
  let f = 1;
  for (let i = 0; i < oct; i++) {
    s += a * (vnoise3(x * f, y * f, z * f) * 2 - 1);
    f *= 2.07;
    a *= 0.5;
  }
  return s;
}

// неровное тело: икосаэдр, вершины сдвинуты шумом; seed — чтобы все были разные
// вершины общие (без швов): после сдвига шумом поверхность гладкая и без трещин; цвет — в вершинах
// (тёмный и светлый реголит, иней), без текстуры и её шва
export function lumpyGeometry(detail, seed, rough = 0.25, craters = 0, flat = null, frost = 0) {
  let g = new THREE.IcosahedronGeometry(1, detail);
  g.deleteAttribute('uv');
  g.deleteAttribute('normal');
  g = mergeVertices(g);
  const p = g.attributes.position;
  const colors = new Float32Array(p.count * 3);
  const r = rng(seed);
  const cr = Array.from({ length: craters }, () => {
    const v = new THREE.Vector3(r() - 0.5, r() - 0.5, r() - 0.5).normalize();
    return { v, s: 0.05 + r() ** 2 * 0.25 };
  });
  const o = r() * 100;
  const v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i).normalize();
    let h = 1 + rough * fbm3(v.x * 1.6 + o, v.y * 1.6, v.z * 1.6, 5);
    for (const c of cr) {
      const d = v.angleTo(c.v) / c.s;
      if (d < 1.4) h += (d < 1 ? -0.06 * c.s * (1 - d * d) : 0.03 * c.s * Math.sin(((d - 1) / 0.4) * Math.PI)) * 2;
    }
    if (flat) h = 1 + (h - 1) * smooth((v.angleTo(flat) - 0.012) / 0.05); // ровная площадка, где садится герой
    const shade = 0.36 + 0.1 * fbm3(v.x * 6 + o, v.y * 6, v.z * 6, 3) + 0.25 * (h - 1);
    const ice = frost * smooth((fbm3(v.x * 3.3 + o, v.y * 3.3 + 5, v.z * 3.3, 4) - 0.05) / 0.25);
    colors[i * 3] = shade * 1.02 + ice * 0.55;
    colors[i * 3 + 1] = shade + ice * 0.58;
    colors[i * 3 + 2] = shade * 0.95 + ice * 0.62;
    v.multiplyScalar(h);
    p.setXYZ(i, v.x, v.y, v.z);
  }
  g.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  g.computeVertexNormals();
  return g;
}

function rockTexture(seed, frost) {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 256;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#5c5751';
  ctx.fillRect(0, 0, 512, 256);
  const r = rng(seed);
  for (let i = 0; i < 2600; i++) {
    const v = 60 + r() * 70;
    ctx.fillStyle = `rgba(${v},${v * 0.96},${v * 0.9},0.25)`;
    ctx.fillRect(r() * 512, r() * 256, 1 + r() * 4, 1 + r() * 4);
  }
  // иней: светлые пятна (лёд из бывших океанов)
  for (let i = 0; i < frost; i++) {
    const x = r() * 512;
    const y = r() * 256;
    const g = ctx.createRadialGradient(x, y, 0, x, y, 6 + r() * 30);
    g.addColorStop(0, 'rgba(235,240,248,0.75)');
    g.addColorStop(1, 'rgba(235,240,248,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x - 40, y - 40, 80, 80);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// --- обломки рядом с героем ----------------------------------------------------------------------------------
const SPARKS = 2600;
const ROCKS = 70;
const BOX = 140; // м: куб вокруг камеры, частицы в нём «заворачиваются»

export function buildDebris() {
  const group = new THREE.Group();
  const r = rng(808);
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(SPARKS * 3);
  const col = new Float32Array(SPARKS * 3);
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const sparks = Array.from({ length: SPARKS }, () => ({
    p: [r() * BOX, r() * BOX, r() * BOX], v: [(r() - 0.5) * 0.8, (r() - 0.5) * 0.8, (r() - 0.5) * 0.8], f: 0.5 + r() * 3, ph: r() * 6.28, b: 0.4 + r() * 0.6,
  }));
  const pts = new THREE.Points(geo, new THREE.PointsMaterial({ size: 0.09, vertexColors: true, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
  pts.frustumCulled = false;
  group.add(pts);
  const rockGeo = lumpyGeometry(2, 31, 0.35);
  rockGeo.deleteAttribute('color');
  const rockMat = new THREE.MeshStandardMaterial({ color: 0x8a8279, roughness: 0.95, metalness: 0 });
  const rocks = new THREE.InstancedMesh(rockGeo, rockMat, ROCKS);
  rocks.frustumCulled = false;
  const rk = Array.from({ length: ROCKS }, (_, i) => ({
    p: [r() * BOX, r() * BOX, r() * BOX], v: [(r() - 0.5) * 0.5, (r() - 0.5) * 0.5, (r() - 0.5) * 0.5], s: 0.04 + r() ** 3 * 1.6, ax: new THREE.Vector3(r() - 0.5, r() - 0.5, r() - 0.5).normalize(), w: (r() - 0.5) * 0.8, ice: i % 4 === 0,
  }));
  const ice = new THREE.Color(0.9, 0.94, 1.0);
  const stone = new THREE.Color(0.55, 0.51, 0.47);
  rk.forEach((k, i) => rocks.setColorAt(i, k.ice ? ice : stone));
  group.add(rocks);
  return { group, geo, sparks, pts, rocks, rk };
}

const m4 = new THREE.Matrix4();
const q = new THREE.Quaternion();
const sv = new THREE.Vector3();
const pv = new THREE.Vector3();

// density 0…1; cam — позиция камеры; light 0…1
export function updateDebris(d, t, cam, density, light) {
  d.group.visible = density > 0.005;
  if (!d.group.visible) return;
  const wrap = (x) => ((x % BOX) + BOX) % BOX - BOX / 2;
  const arr = d.geo.attributes.position.array;
  const col = d.geo.attributes.color.array;
  d.sparks.forEach((s, i) => {
    const x = wrap(s.p[0] + s.v[0] * t);
    const y = wrap(s.p[1] + s.v[1] * t);
    const z = wrap(s.p[2] + s.v[2] * t);
    arr[i * 3] = cam.x + x;
    arr[i * 3 + 1] = cam.y + y;
    arr[i * 3 + 2] = cam.z + z;
    const tw = 0.35 + 0.65 * Math.max(0, Math.sin(t * s.f + s.ph)) ** 6; // искры мерцают
    const fade = 1 - smooth((Math.hypot(x, y, z) - BOX * 0.3) / (BOX * 0.2)); // края куба не видны
    const b = s.b * tw * fade * light;
    col[i * 3] = b * 0.9;
    col[i * 3 + 1] = b * 0.95;
    col[i * 3 + 2] = b;
  });
  d.geo.attributes.position.needsUpdate = true;
  d.geo.attributes.color.needsUpdate = true;
  d.pts.material.opacity = density;
  d.rk.forEach((k, i) => {
    pv.set(cam.x + wrap(k.p[0] + k.v[0] * t), cam.y + wrap(k.p[1] + k.v[1] * t), cam.z + wrap(k.p[2] + k.v[2] * t));
    const dist = pv.distanceTo(cam);
    const s = k.s * density * (1 - smooth((dist - BOX * 0.3) / (BOX * 0.2)));
    q.setFromAxisAngle(k.ax, k.w * t);
    sv.setScalar(Math.max(1e-4, s));
    m4.compose(pv, q, sv);
    d.rocks.setMatrixAt(i, m4);
  });
  d.rocks.instanceMatrix.needsUpdate = true;
}

// --- комки и новая луна ------------------------------------------------------------------------------------
// [радиус орбиты км, долгота °, радиус км, когда сливается с главной луной (с), seed]
const LETS = [
  [21500, 34, 160, 735, 1], [26500, 52, 240, 748, 2], [23000, 47, 90, 712, 3], [29000, 38, 300, 760, 4], [24500, 28, 120, 726, 5],
  [27500, 44, 70, 704, 6], [22500, 56, 200, 754, 7], [30500, 49, 140, 742, 8], [25500, 61, 110, 720, 9], [28000, 31, 60, 698, 10],
];
export const MOON = { a: 2.45e7, lon: 41, incl: 3.5, R: 1.3e6 }; // новая луна: орбита, долгота, наклон, радиус

export function moonDir(out = new THREE.Vector3()) {
  const l = (MOON.lon * Math.PI) / 180;
  const i = (MOON.incl * Math.PI) / 180;
  return out.set(Math.sin(l) * Math.cos(i), Math.cos(l) * Math.cos(i), -Math.sin(i));
}
export function moonCenter(C, out = new THREE.Vector3(), a = MOON.a) {
  return moonDir(out).multiplyScalar(a).add(C);
}

export function buildMoons(flatDir = null) {
  const group = new THREE.Group();
  const lets = LETS.map(([a, lon, rad, merge, seed]) => {
    const mesh = new THREE.Mesh(lumpyGeometry(14, seed, 0.3, 6, null, 0.3), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, metalness: 0 }));
    group.add(mesh);
    return { mesh, a: a * 1000, lon, rad: rad * 1000, merge, seed };
  });
  const mainMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, metalness: 0 });
  // мелкая неоднородность реголита по мировым координатам (при подлёте грани шара не выглядят гладкими)
  mainMat.onBeforeCompile = (sh) => {
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vLocal;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvLocal = position;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
      varying vec3 vLocal;
      float hh(vec3 p) { return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }
      float vn(vec3 x) { vec3 i = floor(x); vec3 f = fract(x); f = f * f * (3.0 - 2.0 * f);
        return mix(mix(mix(hh(i), hh(i + vec3(1,0,0)), f.x), mix(hh(i + vec3(0,1,0)), hh(i + vec3(1,1,0)), f.x), f.y),
                   mix(mix(hh(i + vec3(0,0,1)), hh(i + vec3(1,0,1)), f.x), mix(hh(i + vec3(0,1,1)), hh(i + vec3(1,1,1)), f.x), f.y), f.z); }`)
      .replace('#include <color_fragment>', `#include <color_fragment>
      vec3 q = normalize(vLocal);
      float d = vn(q * 60.0) * 0.5 + vn(q * 240.0) * 0.3 + vn(q * 960.0) * 0.2;
      diffuseColor.rgb *= 0.7 + 0.6 * d;`);
  };
  const main = new THREE.Mesh(lumpyGeometry(56, 99, 0.018, 40, flatDir, 0.22), mainMat);
  group.add(main);
  return { group, lets, main };
}

// grow 0…1 — насколько выросла главная луна; clumps 0…1 — видны ли комки (появляются за пределом Роша)
export function updateMoons(m, t, C, grow, clumps, M = moonCenter(C)) {
  m.group.visible = clumps > 0.005 || grow > 0.005;
  if (!m.group.visible) return;
  for (const l of m.lets) {
    const lon = ((l.lon + (t - 640) * 0.02 * (24500 / (l.a / 1000)) ** 1.5) * Math.PI) / 180;
    const pos = new THREE.Vector3(Math.sin(lon), Math.cos(lon), 0).multiplyScalar(l.a).add(C);
    // перед слиянием комок по спирали подходит к луне
    const k = smooth((t - (l.merge - 14)) / 14);
    pos.lerp(M, k);
    l.mesh.position.copy(pos);
    const born = smooth((t - 650 - (l.seed % 5) * 3) / 10);
    const sc = l.rad * born * (1 - smooth((t - l.merge + 1) / 2)) * clumps;
    l.mesh.visible = sc > 10;
    l.mesh.scale.setScalar(Math.max(1, sc));
    l.mesh.rotation.set(t * 0.01 * l.seed, t * 0.013, 0);
  }
  m.main.position.copy(M);
  m.main.scale.setScalar(MOON.R * (0.12 + 0.88 * grow) * Math.min(1, grow * 4) + 1);
  m.main.visible = grow > 0.01;
}

// --- поверхность новой луны вокруг места посадки (локальная система: +Y — вверх от центра луны) -----------------
function regolithTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 512;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#8b857d';
  ctx.fillRect(0, 0, 512, 512);
  const r = rng(515);
  const tile = (fn) => { for (const dx of [-512, 0, 512]) for (const dy of [-512, 0, 512]) fn(dx, dy); };
  for (let i = 0; i < 60; i++) {
    const x = r() * 512;
    const y = r() * 512;
    const rad = 20 + r() * 70;
    const light = r() < 0.35;
    tile((dx, dy) => {
      const g = ctx.createRadialGradient(x + dx, y + dy, 0, x + dx, y + dy, rad);
      g.addColorStop(0, light ? 'rgba(232,237,244,0.6)' : 'rgba(96,91,86,0.3)');
      g.addColorStop(1, light ? 'rgba(232,237,244,0)' : 'rgba(96,91,86,0)');
      ctx.fillStyle = g;
      ctx.fillRect(x + dx - rad, y + dy - rad, rad * 2, rad * 2);
    });
  }
  for (let i = 0; i < 14000; i++) {
    const v = 80 + r() * 100;
    ctx.fillStyle = `rgba(${v},${v * 0.97},${v * 0.93},${0.25 + r() * 0.35})`;
    ctx.fillRect(r() * 512, r() * 512, 1 + r() * 2.5, 1 + r() * 2.5);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 8;
  return t;
}

export function buildMoonSurface(radius) {
  const group = new THREE.Group();
  // полярная сетка до 5 км: кривизна шара, мягкие холмы, чаши кратеров
  const rings = 90;
  const sectors = 200;
  const r0 = 0.3;
  const r1 = 5000;
  const pos = [];
  const uv = [];
  const idx = [];
  const rr = rng(616);
  const craters = Array.from({ length: 26 }, () => ({ x: (rr() - 0.5) * 7000, z: (rr() - 0.5) * 7000, s: 15 + rr() ** 2 * 420 }));
  craters.push({ x: -38, z: -95, s: 22 });
  const height = (x, z) => {
    let h = 6 * fbm3(x / 900, 0.3, z / 900, 4) + 0.6 * fbm3(x / 40, 1.7, z / 40, 3) + 0.08 * fbm3(x / 3, 2.1, z / 3, 2);
    for (const c of craters) {
      const d = Math.hypot(x - c.x, z - c.z) / c.s;
      if (d < 1.5) h += d < 1 ? -0.22 * c.s * (1 - d * d) : 0.1 * c.s * Math.sin(((d - 1) / 0.5) * Math.PI) * (1.5 - d) * 2;
    }
    // площадка посадки — ровная
    const near = Math.hypot(x, z);
    h *= smooth((near - 3) / 25);
    return h - (x * x + z * z) / (2 * radius);
  };
  for (let i = 0; i <= rings; i++) {
    const rad = r0 * Math.pow(r1 / r0, i / rings);
    for (let j = 0; j <= sectors; j++) {
      const a = (j / sectors) * Math.PI * 2;
      const x = Math.cos(a) * rad;
      const z = Math.sin(a) * rad;
      pos.push(x, height(x, z), z);
      uv.push(x / 9, z / 9);
    }
  }
  for (let i = 0; i < rings; i++) {
    for (let j = 0; j < sectors; j++) {
      const a = i * (sectors + 1) + j;
      const b = a + sectors + 1;
      idx.push(a, a + 1, b, a + 1, b + 1, b);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  const ground = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ map: regolithTexture(), roughness: 1, metalness: 0 }));
  ground.receiveShadow = true;
  group.add(ground);
  // валуны: от гальки у ног до глыб вдали
  const N = 420;
  const rockG = lumpyGeometry(2, 717, 0.35);
  rockG.deleteAttribute('color');
  const rocks = new THREE.InstancedMesh(rockG, new THREE.MeshStandardMaterial({ color: 0x7c766f, roughness: 1, metalness: 0 }), N);
  const m = new THREE.Matrix4();
  const qq = new THREE.Quaternion();
  for (let i = 0; i < N; i++) {
    const d = 1.2 + rr() ** 1.6 * 900;
    const a = rr() * Math.PI * 2;
    const x = Math.cos(a) * d;
    const z = Math.sin(a) * d;
    const s = (0.03 + rr() ** 4 * 0.9) * Math.min(4, 0.25 + d / 25); // у ног — галька, вдали — глыбы
    qq.setFromEuler(new THREE.Euler(rr() * 6, rr() * 6, rr() * 6));
    m.compose(new THREE.Vector3(x, height(x, z) + s * 0.25, z), qq, new THREE.Vector3(s, s * (0.6 + rr() * 0.5), s));
    rocks.setMatrixAt(i, m);
    rocks.setColorAt(i, new THREE.Color().setScalar(0.75 + rr() * 0.5));
  }
  rocks.castShadow = true;
  rocks.receiveShadow = true;
  group.add(rocks);
  return { group, ground, rocks, height };
}

// --- предел Роша: пунктирный круг в плоскости колец и подпись ------------------------------------------------
export function buildRoche(radius) {
  const pts = [];
  for (let i = 0; i <= 256; i++) {
    const a = (i / 256) * Math.PI * 2;
    pts.push(new THREE.Vector3(Math.sin(a) * radius, Math.cos(a) * radius, 0));
  }
  const g = new THREE.BufferGeometry().setFromPoints(pts);
  const line = new THREE.Line(g, new THREE.LineDashedMaterial({ color: 0x9ff7ef, dashSize: radius * 0.02, gapSize: radius * 0.015, transparent: true, opacity: 0, depthWrite: false }));
  line.computeLineDistances();
  line.frustumCulled = false;
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 96;
  const ctx = c.getContext('2d');
  ctx.font = '700 40px "Space Grotesk", sans-serif';
  ctx.fillStyle = '#9ff7ef';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('ROCHE LIMIT', 256, 30);
  ctx.font = '500 30px "JetBrains Mono", monospace';
  ctx.fillText('19,000 km', 256, 72);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const label = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, opacity: 0, depthTest: false, depthWrite: false }));
  label.renderOrder = 20;
  const group = new THREE.Group();
  group.add(line, label);
  return { group, line, label };
}
