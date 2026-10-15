// Другая сторона Земли: выход из морского дна на глубине 4 321 м, подъём сквозь океан к поверхности и
// рассвет над южной частью Индийского океана. Как и в deep.js, всё строится от глаз героя: начало координат
// группы — точка на поверхности моря прямо над ним, ось Y вверх, глубина — минус y.
//   дно (ил, конкреции, голотурии, офиуры) → морской снег и вспышки биолюминесценции → сифонофор →
//   кашалот → первые следы света → светящиеся анчоусы → лучи солнца → поверхность снизу → над водой:
//   волны, рассвет, альбатрос.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { EARTH, OCEAN, depthAt } from './timeline.js';
import { canvasTexture, clamp, lerp, rng, smooth } from './util.js';
import { R } from './rock.js';

export const OCEAN_T0 = OCEAN.emerge - 2.5; // с этой секунды океан уже строится (дно видно сверху трубы)
export const FLOOR = OCEAN.seafloor; // м под поверхностью
export const SURFACE_T = OCEAN.surface;
const DEG = Math.PI / 180;

// глубина глаз под поверхностью моря (м); над водой — отрицательная
export const rEye = (t) => EARTH - depthAt(t);

// направление взгляда по полному повороту (тело + голова), градусы → вектор в плоскости XZ
export const dirOf = (deg) => new THREE.Vector3(-Math.sin(deg * DEG), 0, -Math.cos(deg * DEG));

// солнце: низко над горизонтом, справа-впереди, когда герой смотрит прямо (после центра тело развёрнуто)
export const SUN_DIR = new THREE.Vector3(-0.42, 0.09, 0.9).normalize();

const wrapC = (x, h) => ((((x + h) % (2 * h)) + 2 * h) % (2 * h)) - h;
const win = (t, a, b, r) => smooth((t - a) / r) * (1 - smooth((t - (b - r)) / r));

// --- волны: сумма нескольких синусоид; та же функция и для сетки, и для покачивания глаз --------------
const WAVES = [
  [0.22, 38, 0.9, 0.0],
  [0.12, 17, 2.1, 1.3],
  [0.07, 9, -0.6, 2.2],
  [0.035, 4.3, 1.4, 0.7],
];
export function waveAt(x, z, t) {
  let h = 0;
  for (const [a, len, dirA, ph] of WAVES) {
    const k = (2 * Math.PI) / len;
    const c = Math.sqrt(9.81 / k);
    h += a * Math.sin(k * (x * Math.cos(dirA) + z * Math.sin(dirA)) - k * c * t + ph);
  }
  return h;
}

// --- текстуры ----------------------------------------------------------------------------------------

function sedimentFloorTex() {
  const tex = canvasTexture(1024, 1024, (ctx, w, h) => {
    const r = rng(701);
    ctx.fillStyle = '#b9b09a';
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 26000; i++) {
      const v = 150 + Math.floor((r() - 0.5) * 70);
      ctx.fillStyle = `rgba(${v},${v - 6},${v - 18},0.5)`;
      const s = 1 + r() * 3;
      ctx.beginPath();
      ctx.ellipse(r() * w, r() * h, s, s * 0.7, r() * 3, 0, Math.PI * 2);
      ctx.fill();
    }
    // следы ползающих животных: извилистые бороздки
    ctx.lineCap = 'round';
    for (let k = 0; k < 9; k++) {
      let x = r() * w;
      let y = r() * h;
      let a = r() * 6.3;
      ctx.strokeStyle = 'rgba(120,112,96,0.55)';
      ctx.lineWidth = 3 + r() * 3;
      ctx.beginPath();
      ctx.moveTo(x, y);
      for (let s = 0; s < 60; s++) {
        a += (r() - 0.5) * 0.5;
        x += Math.cos(a) * 8;
        y += Math.sin(a) * 8;
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  });
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

function radialTex(stops, size = 256) {
  const tex = canvasTexture(size, size, (ctx, w, h) => {
    const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    for (const [k, c] of stops) g.addColorStop(k, c);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  });
  return tex;
}

// мелкая рябь для поверхности: карта нормалей из суммы синусов
function rippleNormalTex() {
  const n = 256;
  const tex = canvasTexture(n, n, (ctx) => {
    const img = ctx.createImageData(n, n);
    const hgt = (x, y) => {
      let v = 0;
      for (const [fx, fy, ph] of [[3, 1, 0], [1, 4, 1.3], [5, -2, 2.1], [-2, 7, 0.4], [8, 3, 1.7]]) v += Math.sin(((fx * x + fy * y) / n) * Math.PI * 2 + ph) / Math.hypot(fx, fy);
      return v;
    };
    for (let y = 0; y < n; y++) {
      for (let x = 0; x < n; x++) {
        const dx = hgt(x + 1, y) - hgt(x - 1, y);
        const dy = hgt(x, y + 1) - hgt(x, y - 1);
        const v = new THREE.Vector3(-dx * 6, -dy * 6, 1).normalize();
        const i = (y * n + x) * 4;
        img.data[i] = (v.x * 0.5 + 0.5) * 255;
        img.data[i + 1] = (v.y * 0.5 + 0.5) * 255;
        img.data[i + 2] = (v.z * 0.5 + 0.5) * 255;
        img.data[i + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
  });
  tex.colorSpace = THREE.NoColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

// вертикальный луч света: ярко сверху, гаснет книзу и к краям
function rayTex() {
  const tex = canvasTexture(64, 256, (ctx, w, h) => {
    const img = ctx.createImageData(w, h);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const across = Math.sin((Math.PI * (x + 0.5)) / w) ** 2;
        const down = (1 - y / h) ** 1.6;
        const v = across * down;
        const i = (y * w + x) * 4;
        img.data[i] = img.data[i + 1] = img.data[i + 2] = 255;
        img.data[i + 3] = v * 255;
      }
    }
    ctx.putImageData(img, 0, 0);
  });
  return tex;
}

// --- дно ----------------------------------------------------------------------------------------------

function buildFloor() {
  const g = new THREE.Group();
  g.position.y = -FLOOR;
  const tex = sedimentFloorTex();
  tex.repeat.set(60, 60);
  const mat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.95, metalness: 0 });
  // дыра там, где выходит шахта
  mat.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec2 vFloorXZ;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvFloorXZ = position.xy;');
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying vec2 vFloorXZ;')
      .replace('#include <clipping_planes_fragment>', `#include <clipping_planes_fragment>\n  if (dot(vFloorXZ, vFloorXZ) < ${(R * R).toFixed(3)}) discard;`);
  };
  const plane = new THREE.Mesh(new THREE.PlaneGeometry(600, 600, 1, 1), mat);
  plane.rotation.x = -Math.PI / 2;
  g.add(plane);
  // край дыры: валик взбаламученного ила закрывает срез трубы
  const rim = new THREE.Mesh(new THREE.TorusGeometry(R + 0.12, 0.2, 10, 64), new THREE.MeshStandardMaterial({ color: 0xa79d86, roughness: 1 }));
  rim.rotation.x = Math.PI / 2;
  rim.scale.set(1, 1, 0.45);
  rim.position.y = 0.02;
  g.add(rim);

  const r = rng(702);
  const scatter = (n, rMin, rMax) => Array.from({ length: n }, () => {
    const a = r() * Math.PI * 2;
    const d = Math.sqrt(lerp(rMin * rMin, rMax * rMax, r()));
    return [Math.cos(a) * d, Math.sin(a) * d];
  });
  // железомарганцевые конкреции: тёмные бугристые комки
  const m4 = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const nod = new THREE.InstancedMesh(new THREE.DodecahedronGeometry(1, 0), new THREE.MeshStandardMaterial({ color: 0x2a221c, roughness: 0.7, flatShading: true }), 1400);
  scatter(1400, R + 0.5, 45).forEach(([x, z], i) => {
    const s = 0.03 + r() * r() * 0.1;
    q.setFromEuler(new THREE.Euler(r() * 3, r() * 3, r() * 3));
    m4.compose(new THREE.Vector3(x, s * 0.35, z), q, new THREE.Vector3(s, s * 0.6, s * 0.9));
    nod.setMatrixAt(i, m4);
  });
  g.add(nod);
  // голотурии: полупрозрачные розоватые «огурцы» на иле
  const cuc = new THREE.InstancedMesh(new THREE.CapsuleGeometry(0.06, 0.22, 4, 10), new THREE.MeshStandardMaterial({ color: 0xd99a8c, roughness: 0.4, transparent: true, opacity: 0.85 }), 9);
  scatter(9, R + 1.2, 16).forEach(([x, z], i) => {
    q.setFromEuler(new THREE.Euler(Math.PI / 2, 0, r() * 6.3));
    m4.compose(new THREE.Vector3(x, 0.05, z), q, new THREE.Vector3(1, 1 + r() * 0.6, 0.8));
    cuc.setMatrixAt(i, m4);
  });
  g.add(cuc);
  // офиуры: пять тонких изогнутых лучей
  const arms = [];
  for (let k = 0; k < 5; k++) {
    const curve = new THREE.CatmullRomCurve3([0, 0.3, 0.6, 1].map((u) => new THREE.Vector3(u * 0.16, 0, Math.sin(u * 2.4) * 0.03 * (k % 2 ? 1 : -1))));
    const arm = new THREE.TubeGeometry(curve, 8, 0.006, 4, false);
    arm.rotateY((k / 5) * Math.PI * 2);
    arms.push(arm);
  }
  arms.push(new THREE.CylinderGeometry(0.025, 0.025, 0.01, 10));
  const star = new THREE.InstancedMesh(mergeGeometries(arms.map((a) => a.toNonIndexed())), new THREE.MeshStandardMaterial({ color: 0xc9b9a6, roughness: 0.6 }), 26);
  scatter(26, R + 0.6, 14).forEach(([x, z], i) => {
    q.setFromEuler(new THREE.Euler(0, r() * 6.3, 0));
    const s = 0.8 + r() * 0.8;
    m4.compose(new THREE.Vector3(x, 0.006, z), q, new THREE.Vector3(s, s, s));
    star.setMatrixAt(i, m4);
  });
  g.add(star);
  return g;
}

// --- морской снег и вспышки ------------------------------------------------------------------------------

const SNOW_H = 12;
function buildSnow() {
  const r = rng(703);
  const N = 2600;
  const base = Array.from({ length: N }, () => ({ x: (r() - 0.5) * 2 * SNOW_H, y: (r() - 0.5) * 2 * SNOW_H, z: (r() - 0.5) * 2 * SNOW_H, sink: 0.01 + r() * 0.03, sway: r() * 6.3 }));
  const ptsGeo = new THREE.BufferGeometry();
  ptsGeo.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(N * 3), 3));
  const pts = new THREE.Points(ptsGeo, new THREE.PointsMaterial({ color: 0xe2eef4, size: 0.028, transparent: true, opacity: 0.9, depthWrite: false }));
  pts.frustumCulled = false;
  const lineGeo = new THREE.BufferGeometry();
  lineGeo.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(N * 6), 3));
  const lines = new THREE.LineSegments(lineGeo, new THREE.LineBasicMaterial({ color: 0xc8d8e2, transparent: true, opacity: 0, depthWrite: false }));
  lines.frustumCulled = false;
  return { base, pts, ptsGeo, lines, lineGeo };
}

function buildFlashes() {
  const r = rng(704);
  const N = 220;
  const pos = new Float32Array(N * 3);
  const phase = new Float32Array(N);
  const rate = new Float32Array(N);
  const base = [];
  for (let i = 0; i < N; i++) {
    base.push({ x: (r() - 0.5) * 34, y: (r() - 0.5) * 34, z: (r() - 0.5) * 34 });
    phase[i] = r() * 10;
    rate[i] = 0.15 + r() * 0.35;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('aPhase', new THREE.BufferAttribute(phase, 1));
  geo.setAttribute('aRate', new THREE.BufferAttribute(rate, 1));
  const mat = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uOn: { value: 0 } },
    vertexShader: `
      attribute float aPhase; attribute float aRate;
      uniform float uTime; varying float vA;
      void main() {
        float c = fract(uTime * aRate + aPhase);
        vA = smoothstep(0.0, 0.04, c) * (1.0 - smoothstep(0.04, 0.22, c)); // короткая вспышка и угасание
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = clamp(90.0 / -mv.z, 2.0, 22.0);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `
      uniform float uOn; varying float vA;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        float a = smoothstep(0.5, 0.0, d) * vA * uOn;
        gl_FragColor = vec4(vec3(0.35, 0.85, 1.0) * a, a);
      }`,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const pts = new THREE.Points(geo, mat);
  pts.frustumCulled = false;
  return { pts, base, geo, mat };
}

// --- сифонофор: длинная светящаяся колония (стебель, колокола, прицветники, щупальца) -------------------

const SIPH = { t: 859.6, yaw: 180 - 60, dist: 3.4, len: 30, scale: 2.2 };
function buildSiphonophore() {
  const g = new THREE.Group();
  const r = rng(705);
  const pts = [];
  for (let k = 0; k <= 12; k++) {
    const u = k / 12;
    pts.push(new THREE.Vector3((Math.sin(u * 4.1) * 0.6 + Math.sin(u * 9.3) * 0.12) / SIPH.scale, ((u - 0.5) * SIPH.len) / SIPH.scale, (Math.cos(u * 3.3) * 0.5) / SIPH.scale));
  }
  const curve = new THREE.CatmullRomCurve3(pts);
  const glowMat = new THREE.MeshStandardMaterial({ color: 0x6fd2ff, emissive: 0x2a9cff, emissiveIntensity: 1.6, transparent: true, opacity: 0.85, roughness: 0.3, depthWrite: false });
  g.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 160, 0.014, 5, false), glowMat));
  // колокола-нектофоры наверху колонии
  const bellMat = new THREE.MeshStandardMaterial({ color: 0xbfe8ff, emissive: 0x2a7cc0, emissiveIntensity: 0.6, transparent: true, opacity: 0.35, roughness: 0.15, depthWrite: false, side: THREE.DoubleSide });
  const bells = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.62), bellMat, 16);
  const m4 = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  for (let i = 0; i < 16; i++) {
    const u = 0.94 + (i / 16) * 0.06;
    const p = curve.getPointAt(Math.min(1, u));
    const side = i % 2 ? 1 : -1;
    q.setFromEuler(new THREE.Euler(0, (i * 2.4) % 6.3, side * 1.2));
    m4.compose(p.clone().add(new THREE.Vector3(side * 0.07, 0, 0)), q, new THREE.Vector3(0.07, 0.09, 0.07));
    bells.setMatrixAt(i, m4);
  }
  g.add(bells);
  // прицветники и щупальца вдоль стебля
  const bractMat = new THREE.MeshStandardMaterial({ color: 0xa8e2ff, emissive: 0x2f86e8, emissiveIntensity: 1.3, transparent: true, opacity: 0.55, roughness: 0.2, depthWrite: false });
  const NB = 220;
  const bracts = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 10, 8), bractMat, NB);
  const tent = [];
  const beads = [];
  for (let i = 0; i < NB; i++) {
    const u = (i + r() * 0.6) / NB * 0.92;
    const p = curve.getPointAt(u);
    const a = r() * 6.3;
    q.setFromEuler(new THREE.Euler(r(), a, r()));
    const s = 0.025 + r() * 0.03;
    m4.compose(p.clone().add(new THREE.Vector3(Math.cos(a) * 0.04, 0, Math.sin(a) * 0.04)), q, new THREE.Vector3(s, s * 0.5, s * 1.4));
    bracts.setMatrixAt(i, m4);
    if (i % 3 === 0) {
      const L = 0.4 + r() * 1.2;
      const dx = (r() - 0.5) * 0.3;
      const dz = (r() - 0.5) * 0.3;
      tent.push(p.x, p.y, p.z, p.x + dx, p.y - L, p.z + dz);
      for (let b = 1; b <= 5; b++) beads.push(p.x + (dx * b) / 5, p.y - (L * b) / 5, p.z + (dz * b) / 5);
    }
  }
  g.add(bracts);
  const tg = new THREE.BufferGeometry();
  tg.setAttribute('position', new THREE.Float32BufferAttribute(tent, 3));
  g.add(new THREE.LineSegments(tg, new THREE.LineBasicMaterial({ color: 0x5ab8ff, transparent: true, opacity: 0.35, depthWrite: false })));
  const bg = new THREE.BufferGeometry();
  bg.setAttribute('position', new THREE.Float32BufferAttribute(beads, 3));
  const beadMat = new THREE.PointsMaterial({ color: 0x7fe0ff, size: 0.035, transparent: true, opacity: 0.9, depthWrite: false, blending: THREE.AdditiveBlending });
  g.add(new THREE.Points(bg, beadMat));
  // бегущая волна света по стеблю: яркие точки
  const NW = 90;
  const wave = new Float32Array(NW * 3);
  for (let i = 0; i < NW; i++) wave.set(curve.getPointAt(i / NW).toArray(), i * 3);
  const wg = new THREE.BufferGeometry();
  wg.setAttribute('position', new THREE.BufferAttribute(wave, 3));
  const waveAlpha = new Float32Array(NW);
  wg.setAttribute('aA', new THREE.BufferAttribute(waveAlpha, 1));
  const wmat = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 } },
    vertexShader: `attribute float aA; uniform float uTime; varying float vA;
      void main() { vA = aA; vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_PointSize = clamp(160.0 / -mv.z, 2.0, 40.0); gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `varying float vA; void main() { float d = length(gl_PointCoord - 0.5); float a = smoothstep(0.5, 0.0, d) * vA; gl_FragColor = vec4(vec3(0.4, 0.85, 1.0) * a, a); }`,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const wpts = new THREE.Points(wg, wmat);
  wpts.frustumCulled = false;
  g.add(wpts);
  return { group: g, wg, waveAlpha, glowMat, bractMat, beadMat };
}

// --- медуза атолла: тёмно-красный колокол, по краю бежит синее кольцо света («охранная сигнализация») -------

const JELLY = { t: 854.6, t0: 851.5, t1: 860, yaw: 180 + 6, dist: 2.1 };
function buildJelly() {
  const g = new THREE.Group();
  const bell = new THREE.Mesh(new THREE.SphereGeometry(0.16, 24, 12, 0, Math.PI * 2, 0, Math.PI * 0.45), new THREE.MeshStandardMaterial({ color: 0x8a1420, emissive: 0x2a0408, roughness: 0.3, transparent: true, opacity: 0.85, side: THREE.DoubleSide }));
  bell.scale.set(1, 0.55, 1);
  g.add(bell);
  const crown = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.018, 8, 32), new THREE.MeshStandardMaterial({ color: 0x6a1018, roughness: 0.4 }));
  crown.rotation.x = Math.PI / 2;
  crown.position.y = 0.02;
  g.add(crown);
  // кольцо огоньков по краю колокола
  const N = 32;
  const pos = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) pos.set([Math.cos((i / N) * Math.PI * 2) * 0.17, 0.0, Math.sin((i / N) * Math.PI * 2) * 0.17], i * 3);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const alpha = new Float32Array(N);
  geo.setAttribute('aA', new THREE.BufferAttribute(alpha, 1));
  const mat = new THREE.ShaderMaterial({
    vertexShader: `attribute float aA; varying float vA; void main() { vA = aA; vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_PointSize = clamp(110.0 / -mv.z, 3.0, 40.0); gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `varying float vA; void main() { float d = length(gl_PointCoord - 0.5); float a = smoothstep(0.5, 0.0, d) * vA * 1.6; gl_FragColor = vec4(vec3(0.3, 0.7, 1.0) * a, a); }`,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const ring = new THREE.Points(geo, mat);
  ring.frustumCulled = false;
  g.add(ring);
  // щупальца
  const tl = [];
  for (let i = 0; i < 20; i++) {
    const a = (i / 20) * Math.PI * 2;
    tl.push(Math.cos(a) * 0.15, 0, Math.sin(a) * 0.15, Math.cos(a) * 0.2, -0.35 - (i % 3) * 0.1, Math.sin(a) * 0.2);
  }
  const tg = new THREE.BufferGeometry();
  tg.setAttribute('position', new THREE.Float32BufferAttribute(tl, 3));
  g.add(new THREE.LineSegments(tg, new THREE.LineBasicMaterial({ color: 0xb04050, transparent: true, opacity: 0.5 })));
  const light = new THREE.PointLight(0x4fa8ff, 0, 2.5, 1.5);
  g.add(light);
  return { group: g, bell, geo, alpha, light };
}

// --- кашалот --------------------------------------------------------------------------------------------

const WHALE = { t0: 867.6, t1: 879.5, yaw: 180 + 62, dist: 7.2, speed: 3.2 };
function whaleSkinTex() {
  const tex = canvasTexture(1024, 256, (ctx, w, h) => {
    const r = rng(706);
    ctx.fillStyle = '#6e737a';
    ctx.fillRect(0, 0, w, h);
    // морщины: волнистые продольные линии
    for (let i = 0; i < 110; i++) {
      const y = r() * h;
      ctx.strokeStyle = `rgba(${r() < 0.5 ? '40,42,46' : '110,114,120'},0.22)`;
      ctx.lineWidth = 1 + r() * 1.5;
      ctx.beginPath();
      for (let x = 0; x <= w; x += 16) ctx.lineTo(x, y + Math.sin(x * 0.05 + i) * 3);
      ctx.stroke();
    }
    // светлые шрамы от присосок кальмаров
    for (let i = 0; i < 22; i++) {
      ctx.strokeStyle = 'rgba(200,200,196,0.35)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(r() * w, r() * h, 2 + r() * 4, 0, Math.PI * 2);
      ctx.stroke();
    }
  });
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

function buildWhale() {
  const g = new THREE.Group();
  const L = 14.5;
  const skin = new THREE.MeshStandardMaterial({ map: whaleSkinTex(), color: 0xd0d4dc, roughness: 0.6, metalness: 0 });
  // профиль тела от хвоста (x = 0) к голове (x = L): тонкий хвостовой стебель, толстое тело, огромная голова
  const prof = [[0, 0.05], [0.06, 0.32], [0.18, 0.55], [0.32, 0.92], [0.45, 1.25], [0.6, 1.42], [0.7, 1.5], [0.82, 1.52], [0.93, 1.5], [0.975, 1.42], [0.995, 1.15], [1, 0.0]];
  const lathe = new THREE.LatheGeometry(prof.map(([u, rr]) => new THREE.Vector2(rr, u * L)), 28, 0, Math.PI * 2);
  // ось вращения — вдоль тела; голова к +X. Голова — почти прямоугольная, тело сверху горбатое
  lathe.rotateZ(-Math.PI / 2);
  const p = lathe.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i);
    let y = p.getY(i);
    let z = p.getZ(i);
    const u = x / L;
    const head = smooth((u - 0.62) / 0.12);
    const ang = Math.atan2(y, z);
    const rr = Math.hypot(y, z);
    // скругленный прямоугольник: чем больше head, тем «квадратнее» сечение
    const sq = 1 / Math.pow(Math.max(Math.abs(Math.cos(ang)), Math.abs(Math.sin(ang))), 0.75 * head);
    y = Math.sin(ang) * rr * Math.min(sq, 1.35) * (1 + 0.12 * head);
    z = Math.cos(ang) * rr * Math.min(sq, 1.35) * (0.82 - 0.06 * head);
    // хвостовой стебель сжат с боков
    if (u < 0.3) z *= lerp(0.55, 1, u / 0.3);
    p.setXYZ(i, x - L * 0.55, y, z);
  }
  lathe.computeVertexNormals();
  // перед и зад — отдельно: зад (хвост с лопастями) машет вверх-вниз вокруг шарнира
  const body = new THREE.Mesh(lathe, skin);
  g.add(body);
  // нижняя челюсть: узкая, далеко под головой
  const jaw = new THREE.Mesh(new THREE.CapsuleGeometry(0.22, 3.4, 4, 10), skin);
  jaw.rotation.z = Math.PI / 2;
  jaw.position.set(L * 0.45 - 2.0, -1.42, 0);
  g.add(jaw);
  // глаз — маленький, у угла рта
  const eye = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8), new THREE.MeshStandardMaterial({ color: 0x0b0c0e, roughness: 0.2 }));
  eye.position.set(L * 0.45 - 3.9, -0.9, 1.12);
  g.add(eye);
  const eye2 = eye.clone();
  eye2.position.z = -1.12;
  g.add(eye2);
  // грудные плавники
  const fin = new THREE.Shape();
  fin.moveTo(0, 0);
  fin.quadraticCurveTo(0.5, -0.2, 1.1, -0.15);
  fin.quadraticCurveTo(0.6, 0.15, 0, 0.18);
  const finGeo = new THREE.ExtrudeGeometry(fin, { depth: 0.06, bevelEnabled: false });
  for (const s of [1, -1]) {
    const f = new THREE.Mesh(finGeo, skin);
    f.position.set(L * 0.45 - 4.9, -1.05, s * 1.0);
    f.rotation.set(s * 0.6, s * 0.9, -0.4);
    g.add(f);
  }
  // хвостовые лопасти
  const tail = new THREE.Group();
  tail.position.set(-L * 0.55 + L * 0.18, 0, 0);
  const fl = new THREE.Shape();
  fl.moveTo(0, 0);
  fl.quadraticCurveTo(-0.6, 0.9, -1.7, 1.9);
  fl.quadraticCurveTo(-1.1, 0.8, -1.25, 0.05);
  fl.lineTo(-1.25, -0.05);
  fl.quadraticCurveTo(-1.1, -0.8, -1.7, -1.9);
  fl.quadraticCurveTo(-0.6, -0.9, 0, 0);
  const flukeGeo = new THREE.ExtrudeGeometry(fl, { depth: 0.1, bevelEnabled: true, bevelSize: 0.04, bevelThickness: 0.04, bevelSegments: 2 });
  flukeGeo.rotateX(Math.PI / 2);
  const fluke = new THREE.Mesh(flukeGeo, skin);
  fluke.position.set(-L * 0.18 + 0.2, 0, 0);
  tail.add(fluke);
  g.add(tail);
  g.scale.setScalar(1);
  return { group: g, tail, body, lathe, base: Float32Array.from(lathe.attributes.position.array), L };
}

// --- светящиеся анчоусы (миктофиды) -----------------------------------------------------------------------

const FISH = { t: 886, depth: 600, n: 150 };
function buildFish() {
  const body = new THREE.SphereGeometry(1, 10, 6);
  body.scale(0.05, 0.016, 0.012);
  const tailG = new THREE.ConeGeometry(0.012, 0.03, 4);
  tailG.rotateZ(Math.PI / 2);
  tailG.translate(-0.062, 0, 0);
  const geo = mergeGeometries([body.toNonIndexed(), tailG.toNonIndexed()]);
  geo.computeVertexNormals();
  const mesh = new THREE.InstancedMesh(geo, new THREE.MeshStandardMaterial({ color: 0x9aa6b0, roughness: 0.25, metalness: 0.6 }), FISH.n);
  mesh.frustumCulled = false;
  const r = rng(707);
  const base = Array.from({ length: FISH.n }, () => ({ a: r() * 6.3, rad: 1.2 + r() * 4.5, y: (r() - 0.5) * 4, sp: 0.4 + r() * 0.5, ph: r() * 6.3 }));
  const lights = new THREE.BufferGeometry();
  lights.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(FISH.n * 2 * 3), 3));
  const lpts = new THREE.Points(lights, new THREE.PointsMaterial({ color: 0x66e6ff, size: 0.018, transparent: true, opacity: 0.95, depthWrite: false, blending: THREE.AdditiveBlending }));
  lpts.frustumCulled = false;
  const g = new THREE.Group();
  g.add(mesh, lpts);
  return { group: g, mesh, base, lights, lpts };
}

// --- лучи солнца под водой -----------------------------------------------------------------------------------

function buildRays() {
  const g = new THREE.Group();
  const tex = rayTex();
  const r = rng(708);
  const rays = [];
  for (let i = 0; i < 18; i++) {
    const mat = new THREE.MeshBasicMaterial({ map: tex, color: 0x9fe3ff, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false });
    const m = new THREE.Mesh(new THREE.PlaneGeometry(3 + r() * 5, 90), mat);
    const a = r() * 6.3;
    const d = 3 + r() * 22;
    rays.push({ m, a, d, ph: r() * 6.3, w: 0.05 + r() * 0.1 });
    g.add(m);
  }
  return { group: g, rays };
}

// --- поверхность: снизу — светлое волнистое «зеркало», сверху — море с бликом солнца -------------------------

function buildSurface() {
  const g = new THREE.Group();
  const N = 72;
  const SIZE = 160;
  const geo = new THREE.PlaneGeometry(SIZE, SIZE, N, N);
  geo.rotateX(-Math.PI / 2);
  const normal = rippleNormalTex();
  normal.repeat.set(26, 26);
  const top = seaMaterial(normal);
  const topMesh = new THREE.Mesh(geo, top);
  topMesh.frustumCulled = false;
  g.add(topMesh);
  // дальнее море до горизонта: тот же материал, без волн
  const far = new THREE.Mesh(new THREE.RingGeometry(SIZE * 0.45, 9000, 64, 1), top);
  far.rotation.x = -Math.PI / 2;
  far.position.y = -0.05;
  g.add(far);
  // изнанка: светлое окно над головой (окно Снелла), к краям темнее, рябь бежит
  const under = new THREE.MeshBasicMaterial({ map: radialTex([[0, '#c6eef8'], [0.22, '#86d2e8'], [0.55, '#2a88a8'], [1, '#0a3a52']]), transparent: true, opacity: 1, side: THREE.BackSide, fog: false, depthWrite: false });
  const underMesh = new THREE.Mesh(new THREE.CircleGeometry(1, 64), under);
  underMesh.rotation.x = -Math.PI / 2;
  underMesh.renderOrder = -1;
  g.add(underMesh);
  const ripple = new THREE.MeshBasicMaterial({ map: normal, color: 0x9be8ff, transparent: true, opacity: 0.25, side: THREE.BackSide, fog: false, depthWrite: false, blending: THREE.AdditiveBlending });
  const rippleMesh = new THREE.Mesh(new THREE.CircleGeometry(1, 64), ripple);
  rippleMesh.rotation.x = -Math.PI / 2;
  rippleMesh.position.y = -0.01;
  g.add(rippleMesh);
  return { group: g, geo, top, topMesh, far, under, underMesh, ripple, rippleMesh, normal, base: Float32Array.from(geo.attributes.position.array) };
}

// --- небо на рассвете ---------------------------------------------------------------------------------------

// цвет неба по направлению: тот же для купола и для отражения в море
const SKY_GLSL = `
vec3 skyColor(vec3 d, vec3 sun) {
  float h = max(d.y, 0.0);
  float toward = max(dot(normalize(vec3(d.x, 0.0, d.z) + 1e-5), normalize(vec3(sun.x, 0.0, sun.z))), 0.0);
  vec3 zenith = vec3(0.16, 0.34, 0.62);
  vec3 horizon = mix(vec3(0.62, 0.7, 0.82), vec3(1.0, 0.64, 0.38), pow(toward, 3.0));
  vec3 col = mix(horizon, zenith, pow(h, 0.45));
  col += vec3(0.35, 0.12, 0.08) * pow(toward, 2.0) * exp(-h * 9.0);
  float s = max(dot(d, normalize(sun)), 0.0);
  col += vec3(1.0, 0.75, 0.45) * pow(s, 18.0) * 0.8;
  return col;
}`;

function buildSky() {
  const mat = new THREE.ShaderMaterial({
    uniforms: { uSun: { value: SUN_DIR.clone() } },
    vertexShader: 'varying vec3 vDir; void main() { vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `
      uniform vec3 uSun; varying vec3 vDir;
      ${SKY_GLSL}
      void main() {
        vec3 d = normalize(vDir);
        vec3 col = skyColor(d, uSun);
        float s = max(dot(d, normalize(uSun)), 0.0);
        col += vec3(1.0, 0.95, 0.85) * smoothstep(0.9993, 0.9997, s) * 6.0; // диск солнца
        col = mix(col, vec3(0.08, 0.2, 0.28), smoothstep(0.0, -0.02, d.y));
        gl_FragColor = vec4(col, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
  });
  const sky = new THREE.Mesh(new THREE.SphereGeometry(8000, 32, 16), mat);
  sky.renderOrder = -2;
  sky.frustumCulled = false;
  return sky;
}

// Море сверху: глубокий сине-зелёный цвет, отражение неба по Френелю, солнечная дорожка
function seaMaterial(normalTex) {
  return new THREE.ShaderMaterial({
    uniforms: { uSun: { value: SUN_DIR.clone() }, uNormal: { value: normalTex }, uTime: { value: 0 }, uCam: { value: new THREE.Vector3() } },
    vertexShader: `
      varying vec3 vW; varying vec3 vN; varying vec2 vUv2;
      void main() {
        vec4 w = modelMatrix * vec4(position, 1.0);
        vW = w.xyz; vN = normalize(mat3(modelMatrix) * normal); vUv2 = position.xz;
        gl_Position = projectionMatrix * viewMatrix * w;
      }`,
    fragmentShader: `
      uniform vec3 uSun; uniform sampler2D uNormal; uniform float uTime; uniform vec3 uCam;
      varying vec3 vW; varying vec3 vN; varying vec2 vUv2;
      ${SKY_GLSL}
      void main() {
        vec3 V = normalize(uCam - vW);
        float dist = length(uCam - vW);
        // рябь: две карты нормалей бегут навстречу; вдали рябь сглаживается
        vec3 n1 = texture2D(uNormal, vUv2 * 0.09 + vec2(uTime * 0.02, uTime * 0.013)).xyz * 2.0 - 1.0;
        vec3 n2 = texture2D(uNormal, vUv2 * 0.23 - vec2(uTime * 0.017, -uTime * 0.021)).xyz * 2.0 - 1.0;
        vec3 rip = normalize(vec3(n1.x + n2.x, 2.2, n1.y + n2.y));
        float fade = exp(-dist * 0.035); // вдали рябь не рисуем: иначе повтор текстуры виден полосами
        vec3 Ng = normalize(mix(vec3(0.0, 1.0, 0.0), vN, exp(-dist * 0.02))); // крупные волны вдали тоже сглаживаются
        vec3 N = normalize(mix(Ng, normalize(Ng + vec3(rip.x, 0.0, rip.z) * 0.6), fade));
        vec3 R = reflect(-V, N);
        R.y = abs(R.y);
        float F = 0.02 + 0.98 * pow(1.0 - max(dot(N, V), 0.0), 5.0);
        vec3 deep = vec3(0.012, 0.06, 0.085);
        vec3 col = mix(deep, skyColor(R, uSun), F);
        float sp = pow(max(dot(R, normalize(uSun)), 0.0), mix(60.0, 900.0, fade));
        col += vec3(1.0, 0.82, 0.6) * sp * mix(1.2, 5.0, fade);
        // к горизонту — дымка цвета неба у горизонта
        col = mix(col, skyColor(normalize(vec3(-V.x, 0.0, -V.z)), uSun), smoothstep(400.0, 6000.0, dist));
        gl_FragColor = vec4(col, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
}

// --- альбатрос ------------------------------------------------------------------------------------------------

function buildAlbatross() {
  const g = new THREE.Group();
  const white = new THREE.MeshStandardMaterial({ color: 0xf2f2ee, roughness: 0.6 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x2a2b2e, roughness: 0.7 });
  const body = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 8), white);
  body.scale.set(0.45, 0.13, 0.12);
  g.add(body);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 8), white);
  head.position.set(0.42, 0.03, 0);
  g.add(head);
  const beak = new THREE.Mesh(new THREE.ConeGeometry(0.025, 0.16, 6), new THREE.MeshStandardMaterial({ color: 0xe8b86a, roughness: 0.5 }));
  beak.rotation.z = -Math.PI / 2;
  beak.position.set(0.56, 0.02, 0);
  g.add(beak);
  const wings = [];
  for (const s of [1, -1]) {
    const w = new THREE.Group();
    const inner = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.02, 0.9), dark);
    inner.position.set(0, 0, s * 0.45);
    const outer = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.015, 0.95), dark);
    outer.position.set(-0.04, 0, s * 1.35);
    const under = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.01, 0.8), white);
    under.position.set(0.02, -0.012, s * 0.4);
    w.add(inner, outer, under);
    w.position.set(0.05, 0.03, s * 0.06);
    g.add(w);
    wings.push({ w, s });
  }
  const tail = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.015, 0.16), white);
  tail.position.set(-0.48, 0, 0);
  g.add(tail);
  return { group: g, wings };
}

// --- пузыри у поверхности ----------------------------------------------------------------------------------------

function buildBubbles() {
  const r = rng(709);
  const N = 90;
  const mesh = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 8, 6), new THREE.MeshStandardMaterial({ color: 0xe6fbff, roughness: 0.05, metalness: 0.3, transparent: true, opacity: 0.55, emissive: 0x1a4a58 }), N);
  mesh.frustumCulled = false;
  const base = Array.from({ length: N }, () => ({ x: (r() - 0.5) * 3, z: (r() - 0.5) * 3, y0: -r() * 4, sp: 0.8 + r() * 1.6, s: 0.004 + r() * 0.012, ph: r() * 6.3 }));
  return { mesh, base };
}

// --- сборка ---------------------------------------------------------------------------------------------------

export function buildOcean() {
  const group = new THREE.Group();
  group.visible = false;
  const floor = buildFloor();
  const snow = buildSnow();
  const flashes = buildFlashes();
  const siph = buildSiphonophore();
  const whale = buildWhale();
  const fish = buildFish();
  const rays = buildRays();
  const surface = buildSurface();
  const sky = buildSky();
  const bird = buildAlbatross();
  const bubbles = buildBubbles();
  const jelly = buildJelly();
  // всё, что «вокруг глаз» (снег, вспышки, лучи, пузыри), — в отдельной группе, которая едет с глазами
  const around = new THREE.Group();
  around.add(snow.pts, snow.lines, flashes.pts, rays.group, bubbles.mesh);
  group.add(floor, siph.group, jelly.group, whale.group, fish.group, surface.group, sky, bird.group, around);
  const sun = new THREE.DirectionalLight(0xffd2a6, 0);
  sun.position.copy(SUN_DIR).multiplyScalar(100);
  group.add(sun, sun.target);
  return { group, floor, snow, flashes, siph, jelly, whale, fish, rays, surface, sky, bird, bubbles, around, sun };
}

// Свет и туман океана по глубине глаз d (м)
function waterEnv(d) {
  const deep = new THREE.Color(0x041020); // тёмно-синяя, а не чёрная: кадр не проваливается в черноту
  const twilight = new THREE.Color(0x06324f);
  const sunlit = new THREE.Color(0x1d86ab);
  const k1 = smooth((1000 - d) / 800); // 1000 → 200 м: сумерки
  const k2 = smooth((200 - d) / 200); // 200 → 0 м: светлая вода
  const fog = deep.clone().lerp(twilight, k1).lerp(sunlit, k2);
  return {
    fog,
    near: 0.5,
    far: lerp(lerp(24, 48, k1), 80, k2),
    hemi: lerp(lerp(0.24, 0.85, k1), 1.6, k2),
    hemiSky: new THREE.Color(0x3a6a9a).lerp(new THREE.Color(0x9fdcff), k2),
    hemiGround: new THREE.Color(0x05080c).lerp(new THREE.Color(0x0b3a4c), k2),
    glow: lerp(7.5, 1.2, k1),
    sun: 1.1 * k2,
    daylight: Math.max(k1 * 0.4, k2),
  };
}

// base — опорная точка (x, z тела; y глаз), heading — полный поворот головы (градусы)
export function updateOcean(o, t, base, heading) {
  const d = rEye(t);
  const v = (rEye(t - 0.05) - rEye(t + 0.05)) / 0.1; // скорость подъёма, м/с
  o.group.visible = t >= OCEAN_T0;
  if (!o.group.visible) return null;
  const above = d < 0 || t > SURFACE_T + 0.02;
  // качка: после выхода на поверхность глаза держатся над волной, сама волна поднимает и опускает мир
  const bob = above || t > SURFACE_T - 0.6 ? waveAt(0, 0, t) * smooth((t - SURFACE_T + 0.6) / 0.6) : 0;
  o.group.position.set(base.x, base.y + d - bob, base.z);
  const eyeL = new THREE.Vector3(0, -d + bob, 0); // глаза в координатах океана
  o.around.position.copy(eyeL);

  // дно: видно, пока близко
  o.floor.visible = d > FLOOR - 120;
  // морской снег: стоит в воде и медленно тонет; мы поднимаемся — он «падает» мимо
  const snowOn = above ? 0 : 1 - 0.6 * smooth((300 - d) / 300);
  const fast = smooth((v - 15) / 60);
  {
    const s = o.snow;
    const pa = s.ptsGeo.attributes.position.array;
    const la = s.lineGeo.attributes.position.array;
    const len = clamp(v / 60, 0, 2.5) * 0.9;
    s.base.forEach((p, i) => {
      const y = wrapC(p.y - p.sink * t + d, SNOW_H);
      const x = p.x + Math.sin(t * 0.3 + p.sway) * 0.05;
      pa[i * 3] = x;
      pa[i * 3 + 1] = y;
      pa[i * 3 + 2] = p.z;
      la[i * 6] = x;
      la[i * 6 + 1] = y;
      la[i * 6 + 2] = p.z;
      la[i * 6 + 3] = x;
      la[i * 6 + 4] = y + len;
      la[i * 6 + 5] = p.z;
    });
    s.ptsGeo.attributes.position.needsUpdate = true;
    s.lineGeo.attributes.position.needsUpdate = true;
    s.pts.material.opacity = 0.9 * snowOn * (1 - fast);
    s.lines.material.opacity = 0.5 * snowOn * fast;
    s.pts.visible = snowOn > 0.01;
    s.lines.visible = snowOn * fast > 0.01;
  }
  // вспышки биолюминесценции: в темноте, чаще после «But not lifeless»
  {
    const f = o.flashes;
    const arr = f.geo.attributes.position.array;
    f.base.forEach((p, i) => {
      arr[i * 3] = p.x;
      arr[i * 3 + 1] = wrapC(p.y + d, 17);
      arr[i * 3 + 2] = p.z;
    });
    f.geo.attributes.position.needsUpdate = true;
    f.mat.uniforms.uTime.value = t;
    f.mat.uniforms.uOn.value = above ? 0 : smooth((t - 837) / 3) * (1 - smooth((300 - d) / 250)) * (0.3 + 0.7 * smooth((t - 853.5) / 2));
  }
  // сифонофор: вертикальная цепочка в стороне, мы поднимаемся вдоль неё
  {
    const sp = o.siph;
    const on = Math.abs(t - SIPH.t) < 12;
    sp.group.visible = on && !above;
    if (on) {
      const dir = dirOf(SIPH.yaw);
      sp.group.position.set(dir.x * SIPH.dist, -rEye(SIPH.t) - 1.5, dir.z * SIPH.dist);
      sp.group.rotation.set(0.25, t * 0.05, 0.18);
      sp.group.scale.setScalar(SIPH.scale);
      const n = sp.waveAlpha.length;
      for (let i = 0; i < n; i++) {
        const u = i / n;
        const wv = Math.sin((u * 7 - t * 1.6) * Math.PI * 2);
        sp.waveAlpha[i] = 0.25 + 0.75 * smooth(wv);
      }
      sp.wg.attributes.aA.needsUpdate = true;
      const pulse = 0.85 + 0.15 * Math.sin(t * 2.3);
      sp.glowMat.emissiveIntensity = 1.2 * pulse;
      sp.bractMat.emissiveIntensity = 0.9 * pulse;
    }
  }
  // медуза: висит впереди, колокол пульсирует, по краю бежит синее кольцо
  {
    const j = o.jelly;
    const on = t > JELLY.t0 - 1 && t < JELLY.t1 + 1 && !above;
    j.group.visible = on;
    if (on) {
      const f = dirOf(JELLY.yaw);
      // поднимается почти вместе с нами, чуть отставая
      // висит на своей глубине и чуть всплывает; мы зависаем рядом, потом уходим вверх
      j.group.position.set(f.x * JELLY.dist, -rEye(JELLY.t) + 0.1 + (t - JELLY.t) * 0.12, f.z * JELLY.dist);
      j.group.scale.setScalar(1.35);
      const beat = Math.sin(t * 2.4);
      j.bell.scale.set(1 + 0.08 * beat, 0.55 - 0.08 * beat, 1 + 0.08 * beat);
      const n = j.alpha.length;
      for (let i = 0; i < n; i++) j.alpha[i] = 0.15 + 0.85 * Math.max(0, Math.sin(((i / n) - t * 0.9) * Math.PI * 2)) ** 3;
      j.geo.attributes.aA.needsUpdate = true;
      j.light.intensity = 0.8 + 0.4 * Math.sin(t * 5.6);
    }
  }
  // кашалот: выплывает слева из темноты, проплывает перед нами и уходит вправо, медленно поднимаясь
  {
    const w = o.whale;
    const on = t > WHALE.t0 - 1 && t < WHALE.t1 + 1;
    w.group.visible = on && !above;
    if (on) {
      const f = dirOf(WHALE.yaw);
      const right = new THREE.Vector3(-f.z, 0, f.x);
      const k = t - (WHALE.t0 + WHALE.t1) / 2;
      const pos = f.clone().multiplyScalar(WHALE.dist).addScaledVector(right, k * WHALE.speed);
      w.group.position.set(pos.x, -rEye(t) - 0.9 + Math.sin(t * 0.5) * 0.15, pos.z);
      // голова — по направлению движения (+right); тело слегка изгибается, хвост машет вверх-вниз
      w.group.rotation.set(0, Math.atan2(-right.z, right.x), 0.04 * Math.sin(t * 0.7));
      w.tail.rotation.z = 0.22 * Math.sin(t * 2.1);
    }
  }
  // анчоусы: стайка кружит вокруг, поднимается вместе с нами, потом отстаёт
  {
    const fs = o.fish;
    const on = Math.abs(t - FISH.t) < 6 && !above;
    fs.group.visible = on;
    if (on) {
      const follow = smooth((t - 883) / 1.5) * (1 - smooth((t - 888.2) / 1.6));
      const cy = lerp(-FISH.depth, -d, follow);
      const m4 = new THREE.Matrix4();
      const q = new THREE.Quaternion();
      const la = fs.lights.attributes.position.array;
      const sc = new THREE.Vector3(1, 1, 1);
      fs.base.forEach((p, i) => {
        const a = p.a + t * p.sp;
        const x = Math.cos(a) * p.rad;
        const z = Math.sin(a) * p.rad;
        const y = cy + p.y + Math.sin(t * 1.3 + p.ph) * 0.1;
        // вдоль касательной к кругу
        q.setFromEuler(new THREE.Euler(0, -a - Math.PI / 2, 0.15 * Math.sin(t * 9 + p.ph)));
        m4.compose(new THREE.Vector3(x, y, z), q, sc);
        fs.mesh.setMatrixAt(i, m4);
        // фотофоры: две точки на брюхе
        for (let j = 0; j < 2; j++) {
          const off = new THREE.Vector3(0.02 - j * 0.035, -0.014, 0).applyQuaternion(q);
          la.set([x + off.x, y + off.y, z + off.z], (i * 2 + j) * 3);
        }
      });
      fs.mesh.instanceMatrix.needsUpdate = true;
      fs.lights.attributes.position.needsUpdate = true;
    }
  }
  // лучи солнца: видны выше ~300 м, сходятся к солнцу
  {
    const k = above ? 0 : smooth((380 - d) / 200);
    o.rays.group.visible = k > 0.01;
    if (o.rays.group.visible) {
      for (const r of o.rays.rays) {
        const a = r.a + Math.sin(t * r.w + r.ph) * 0.05;
        r.m.position.set(Math.cos(a) * r.d, 0, Math.sin(a) * r.d);
        r.m.rotation.set(0, a, 0.12 * Math.sin(r.ph)); // чуть наклонены, как лучи сквозь рябь
        r.m.material.opacity = k * (0.2 + 0.1 * Math.sin(t * 0.7 + r.ph));
      }
      // лучи заканчиваются у поверхности
      o.rays.group.position.y = Math.min(0, d - 45);
    }
  }
  // поверхность: сетка вокруг нас с волнами; изнанка — окно Снелла над головой
  {
    const s = o.surface;
    const near = d < 260 || above;
    s.group.visible = near;
    if (near) {
      const p = s.geo.attributes.position;
      for (let i = 0; i < p.count; i++) {
        const x = s.base[i * 3];
        const z = s.base[i * 3 + 2];
        p.setY(i, waveAt(x, z, t));
      }
      p.needsUpdate = true;
      s.geo.computeVertexNormals();
      s.top.uniforms.uTime.value = t;
      s.top.uniforms.uCam.value.copy(o.group.position).add(eyeL);
      const rad = Math.max(3, Math.max(0, d) * 1.13 + 2);
      s.underMesh.scale.setScalar(rad * 1.8);
      s.rippleMesh.scale.setScalar(rad * 1.8);
      const vis = smooth((180 - d) / 170);
      s.under.opacity = vis;
      s.ripple.opacity = 0.25 * vis;
      s.underMesh.visible = s.rippleMesh.visible = !above;
    }
  }
  o.sky.visible = above || d < 2;
  // альбатрос: скользит над морем справа, плавно кренясь
  {
    const b = o.bird;
    const on = above && t > 905;
    b.group.visible = on;
    if (on) {
      const u = (t - 905) / 20;
      const ang = 2.2 + u * 1.6;
      const radius = 22;
      b.group.position.set(Math.cos(ang) * radius - 6, 4.5 + Math.sin(u * 3) * 1.5, Math.sin(ang) * radius + 12);
      b.group.rotation.set(0.3 * Math.sin(u * 4), -ang - Math.PI / 2, 0.25 + 0.1 * Math.sin(u * 5));
      for (const { w, s } of b.wings) w.rotation.x = s * (0.08 + 0.05 * Math.sin(t * 1.4));
    }
  }
  // пузыри у поверхности: обгоняют нас
  {
    const bb = o.bubbles;
    const on = !above && d < 25;
    bb.mesh.visible = on;
    if (on) {
      const m4 = new THREE.Matrix4();
      const q = new THREE.Quaternion();
      bb.base.forEach((p, i) => {
        const y = ((p.y0 + t * p.sp) % 4 + 4) % 4 - 2.5;
        const s = p.s;
        m4.compose(new THREE.Vector3(p.x + Math.sin(t * 3 + p.ph) * 0.05, y, p.z - 0.6), q, new THREE.Vector3(s, s, s));
        bb.mesh.setMatrixAt(i, m4);
      });
      bb.mesh.instanceMatrix.needsUpdate = true;
    }
  }

  // свет и туман
  if (above) {
    o.sun.intensity = 1.6;
    return { above: true, fog: new THREE.Color(0xb7c9d6), near: 60, far: 4000, bg: null, hemi: 1.3, hemiSky: new THREE.Color(0xc8dcff), hemiGround: new THREE.Color(0x0f3a4e), glow: 0, sun: 1.6, d, v };
  }
  const e = waterEnv(Math.max(0, d));
  e.glow *= 1 + 1.4 * smooth((d - 4235) / 60); // у самого дна браслет светит на ил ярче: видно, откуда вынырнули
  o.sun.intensity = e.sun;
  return { above: false, ...e, bg: e.fog, d, v };
}
