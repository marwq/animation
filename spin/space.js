// Космос во второй половине ролика: обломки вокруг героя (ледяные искры и камни, которые Земля сбросила с
// экватора), комки за пределом Роша, которые слипаются в луны, и новая луна, на которую герой садится.
// Координаты те же, что у вершины: центр Земли — (0, −R, 0), экватор — плоскость XY, север — −Z.
import * as THREE from 'three';
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
export function lumpyGeometry(detail, seed, rough = 0.25, craters = 0) {
  const g = new THREE.IcosahedronGeometry(1, detail);
  const p = g.attributes.position;
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
    v.multiplyScalar(h);
    p.setXYZ(i, v.x, v.y, v.z);
  }
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
  const rockGeo = lumpyGeometry(1, 31, 0.35);
  const rockMat = new THREE.MeshStandardMaterial({ color: 0x8a8279, roughness: 0.95, metalness: 0, transparent: true, opacity: 1 });
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

export function moonCenter(C, out = new THREE.Vector3()) {
  const l = (MOON.lon * Math.PI) / 180;
  const i = (MOON.incl * Math.PI) / 180;
  return out.set(Math.sin(l) * Math.cos(i), Math.cos(l) * Math.cos(i), -Math.sin(i)).multiplyScalar(MOON.a).add(C);
}

export function buildMoons() {
  const group = new THREE.Group();
  const lets = LETS.map(([a, lon, rad, merge, seed]) => {
    const mesh = new THREE.Mesh(lumpyGeometry(3, seed, 0.3, 6), new THREE.MeshStandardMaterial({ map: rockTexture(seed, 8), roughness: 1, metalness: 0 }));
    group.add(mesh);
    return { mesh, a: a * 1000, lon, rad: rad * 1000, merge, seed };
  });
  const main = new THREE.Mesh(lumpyGeometry(6, 99, 0.06, 40), new THREE.MeshStandardMaterial({ map: rockTexture(99, 40), roughness: 1, metalness: 0 }));
  group.add(main);
  return { group, lets, main };
}

// grow 0…1 — насколько выросла главная луна; clumps 0…1 — видны ли комки (появляются за пределом Роша)
export function updateMoons(m, t, C, grow, clumps) {
  m.group.visible = clumps > 0.005 || grow > 0.005;
  if (!m.group.visible) return;
  const M = moonCenter(C);
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
  const R = MOON.R * (0.25 + 0.75 * grow);
  m.main.scale.setScalar(R * grow + 1);
  m.main.visible = grow > 0.01;
  m.main.rotation.y = 0.4;
}
