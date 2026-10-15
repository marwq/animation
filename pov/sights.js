// Что встречается по пути в глубине: настоящие для этих мест вещи, а не макеты. Каждая «вещь» сидит в
// стенке трубы deep.js и едет вместе с ней; стенка в этом месте вырезается тем же эллипсоидом, которым
// задана форма, поэтому край выреза совпадает с краем вещи — без щелей и наложений.
//   - жеода: полость в пегматитовой жиле, выстланная кристаллами кварца и аметиста (~2,2 км);
//   - мокрая трещина: по волосяной трещине сочится вода, капли сползают по стенке (~5,6 км);
//   - разлом: полоса раздробленной породы, слои по разные стороны сдвинуты; лёгкий толчок и пыль (~6,6 км).
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { rng, smooth } from './util.js';
import { R } from './rock.js';

const DEG = Math.PI / 180;

// t — когда вещь проходит на уровне глаз; slow — до какой скорости (м/с) замедляется стенка рядом с ней;
// yaw — куда в этот момент смотрит голова (градусы, как head_yaw), axes — полуоси (по кругу, вверх, вглубь)
export const SIGHTS = [
  { name: 'geode', t: 208.4, slow: 2.6, win: [205.2, 211.4], yaw: 50, y: -0.15, axes: [0.95, 1.25, 1.05] },
  { name: 'crack', t: 251.7, slow: 2.4, win: [249.0, 254.4], yaw: -52, y: 0.1 },
  { name: 'fault', t: 258.6, slow: 3.0, win: [255.8, 261.2], yaw: 40, y: 0, dip: 34, width: 0.42, shift: 0.31 },
  { name: 'look', t: 335, slow: 1.6, win: [330.4, 339.4] }, // «Присмотрись»: первое свечение по швам зёрен
  { name: 'geode', kind: 'peridot', t: 366.2, slow: 2.6, win: [363.6, 368.8], yaw: 50, y: -0.1, axes: [0.8, 1.05, 0.9] },
  // кимберлитовая трубка: сине-серый вертикальный столб брекчии вдоль стенки (рисует шейдер трубы)
  { name: 'kimberlite', t: 424.6, yaw: 25, half: 0.55, length: 70 },
  // плита древнего океанского дна, ушедшая в мантию: широкая наклонная полоса холодной тёмной породы
  { name: 'slab', t: 506.8, slow: 3.0, win: [504.4, 509.6], yaw: 52, dip: 30, width: 0.75 },
];
export const KIMBERLITE = SIGHTS.find((sg) => sg.name === 'kimberlite');
export const SLAB = SIGHTS.find((sg) => sg.name === 'slab');
export const FAULT = SIGHTS.find((sg) => sg.name === 'fault');

// Направление взгляда при повороте головы на yaw → угол на стенке трубы (x = R sin θ, z = R cos θ)
export const thetaOf = (yaw) => (yaw * DEG) + Math.PI;

function frame(th) {
  return {
    n: new THREE.Vector3(Math.sin(th), 0, Math.cos(th)), // наружу, вглубь стенки
    tg: new THREE.Vector3(Math.cos(th), 0, -Math.sin(th)), // по кругу
  };
}

// Кристалл кварца: шестигранная призма с пирамидкой, основание в нуле, длина 1 вдоль +y
function quartzGeometry() {
  const prism = new THREE.CylinderGeometry(0.5, 0.5, 0.72, 6, 1, true);
  prism.translate(0, 0.36, 0);
  const tip = new THREE.ConeGeometry(0.5, 0.28, 6, 1, true);
  tip.translate(0, 0.72 + 0.14, 0);
  const g = mergeGeometries([prism.toNonIndexed(), tip.toNonIndexed()]);
  g.computeVertexNormals();
  return g;
}

// Материал, который не рисуется внутри трубы (там, где идёт герой): край полости совпадает со стенкой
function outsideTube(material, origin) {
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uOrigin = origin;
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vWorldP;')
      .replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\nvWorldP = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vWorldP;\nuniform vec3 uOrigin;')
      .replace('#include <clipping_planes_fragment>', `#include <clipping_planes_fragment>
  { vec3 lp = vWorldP - uOrigin; if (lp.x * lp.x + lp.z * lp.z < ${(R * R - 0.0004).toFixed(4)}) discard; }`);
  };
  return material;
}

function buildGeode(spec, textures, origin) {
  const g = new THREE.Group();
  const [a, b, c] = spec.axes;
  const th = thetaOf(spec.yaw);
  const { n, tg } = frame(th);
  // оболочка полости: эллипсоид, виден изнутри. У края — светлая корка халцедона, глубже — фиолетовая щётка
  const sphere = new THREE.SphereGeometry(1, 48, 32);
  const sp = sphere.attributes.position;
  const vc = new Float32Array(sp.count * 3);
  const peridot = spec.kind === 'peridot';
  // перидот: гнездо в перидотите — тёмная оливковая порода у края, внутри зелёные кристаллы оливина
  const rim = peridot ? new THREE.Color(0.32, 0.36, 0.2) : new THREE.Color(0.8, 0.82, 0.86);
  const mid = peridot ? new THREE.Color(0.2, 0.28, 0.1) : new THREE.Color(0.36, 0.3, 0.44);
  const back = peridot ? new THREE.Color(0.1, 0.16, 0.05) : new THREE.Color(0.16, 0.1, 0.22);
  const tmp = new THREE.Color();
  for (let i = 0; i < sp.count; i++) {
    const z = sp.getZ(i);
    // полосы агата у края: белая, серо-голубая, белая, потом фиолетовая глубина
    if (z < 0.05) tmp.copy(rim);
    else if (z < 0.09) tmp.setRGB(...(peridot ? [0.26, 0.24, 0.16] : [0.56, 0.6, 0.68]));
    else if (z < 0.12) tmp.copy(rim);
    else if (z < 0.3) tmp.copy(rim).lerp(mid, (z - 0.12) / 0.18);
    else tmp.copy(mid).lerp(back, Math.min(1, (z - 0.3) / 0.5));
    vc.set([tmp.r, tmp.g, tmp.b], i * 3);
  }
  sphere.setAttribute('color', new THREE.BufferAttribute(vc, 3));
  // в мантии порода раскалена (~700 °C): оболочка и кристаллы тускло светятся, как стенка вокруг
  const shellMat = outsideTube(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.5, metalness: 0.05, side: THREE.BackSide, emissive: peridot ? 0x3a0c02 : 0x000000 }), origin);
  const shell = new THREE.Mesh(sphere, shellMat);
  shell.scale.set(a, b, c);
  g.add(shell);

  // кристаллы растут от стенки к центру полости плотной щёткой: видны в основном острые верхушки
  const r = rng(peridot ? 78 : 77);
  const N = 1000;
  const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.14, metalness: 0.15, flatShading: true, emissive: peridot ? 0x2a1004 : 0x1c1628, side: THREE.DoubleSide });
  const crystals = new THREE.InstancedMesh(quartzGeometry(), mat, N);
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const up = new THREE.Vector3(0, 1, 0);
  const col = new THREE.Color();
  const radial = (x, z) => Math.hypot(R + z, x);
  let k = 0;
  let tries = 0;
  while (k < N && tries++ < 40000) {
    // точка на внешней половине эллипсоида: phi от дна (0) до края (pi/2), равномерно по площади
    const phi = Math.acos(1 - r() * 0.97);
    const lam = r() * Math.PI * 2;
    const p = new THREE.Vector3(a * Math.sin(phi) * Math.cos(lam), b * Math.sin(phi) * Math.sin(lam), c * Math.cos(phi));
    const deepK = Math.cos(phi); // 1 — дно, 0 — край
    if (deepK < 0.1) continue; // у самого края — корка халцедона без кристаллов
    const inward = new THREE.Vector3(-p.x / (a * a), -p.y / (b * b), -p.z / (c * c)).normalize();
    const dir = inward.add(new THREE.Vector3(r() - 0.5, r() - 0.5, r() - 0.5).multiplyScalar(0.45)).normalize();
    const len = (0.07 + r() * 0.07 + deepK * (0.06 + r() * 0.1)) * (peridot ? 0.8 : 1);
    const w = len * (peridot ? 0.6 + r() * 0.2 : 0.36 + r() * 0.12);
    // в системе полости ось z — вглубь стенки; ни основание, ни верхушка не заходят в трубу глубже 3 см
    if (radial(p.x + dir.x * len, p.z + dir.z * len) < R - 0.03) continue;
    // основание чуть утоплено в оболочку
    p.addScaledVector(dir, -0.25 * len);
    q.setFromUnitVectors(up, dir);
    m.compose(p, q, new THREE.Vector3(w, len, w));
    crystals.setMatrixAt(k, m);
    // аметист: в глубине густо-фиолетовый, ближе к краю светлее, у края — прозрачный кварц
    const h = 0.765 + (r() - 0.5) * 0.03;
    if (peridot) col.setHSL(0.2 + (r() - 0.5) * 0.04, 0.55 + 0.25 * r(), 0.32 + 0.22 * r() + 0.08 * (1 - deepK));
    else if (deepK > 0.55) col.setHSL(h, 0.5 + 0.2 * r(), 0.3 + 0.16 * r());
    else if (deepK > 0.3) col.setHSL(h, 0.32 + 0.15 * r(), 0.52 + 0.14 * r());
    else col.setHSL(0.66, 0.06, 0.8 + 0.12 * r());
    crystals.setColorAt(k, col);
    k++;
  }
  crystals.count = k;
  crystals.instanceMatrix.needsUpdate = true;
  crystals.instanceColor.needsUpdate = true;
  g.add(crystals);

  // холодный блик внутри: грани вспыхивают, когда мимо проходит свет
  const light = new THREE.PointLight(0xe6e2ff, 0, 3.5, 1.3);
  light.position.set(0.1, 0.35, peridot ? 0.2 : -0.3); // у перидота — внутри гнезда, чтобы не засвечивать стенку над ним
  g.add(light);

  // ориентация: локальные оси (по кругу, вверх, вглубь) → оси трубы
  const basis = new THREE.Matrix4().makeBasis(tg, new THREE.Vector3(0, 1, 0), n);
  g.quaternion.setFromRotationMatrix(basis);
  return { spec, group: g, light, center: n.clone().multiplyScalar(R), n, tg, axes: new THREE.Vector3(a, b, c) };
}

// Лента по стенке трубы вдоль пути [(дуга, y)] на радиусе rr; width(i) — ширина в метрах
function ribbon(path, th0, rr, width) {
  const pos = [];
  const uv = [];
  const idx = [];
  for (let i = 0; i < path.length; i++) {
    const [a0, y0] = path[Math.max(0, i - 1)];
    const [a1, y1] = path[Math.min(path.length - 1, i + 1)];
    const len = Math.hypot(a1 - a0, y1 - y0) || 1;
    const na = -(y1 - y0) / len;
    const ny = (a1 - a0) / len;
    const w = width(i, path.length) / 2;
    for (const side of [-1, 1]) {
      const a = path[i][0] + side * na * w;
      const y = path[i][1] + side * ny * w;
      const th = th0 + a / R;
      pos.push(rr * Math.sin(th), y, rr * Math.cos(th));
      uv.push(side < 0 ? 0 : 1, i / (path.length - 1));
    }
    if (i > 0) {
      const k = (i - 1) * 2;
      idx.push(k, k + 2, k + 1, k + 1, k + 2, k + 3);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

// поперёк ленты: прозрачно по краям, плотно в середине
let bellTex = null;
function bell() {
  if (bellTex) return bellTex;
  const c = document.createElement('canvas');
  c.width = 64;
  c.height = 4;
  const ctx = c.getContext('2d');
  const g = ctx.createLinearGradient(0, 0, 64, 0);
  g.addColorStop(0, 'rgba(0,0,0,1)');
  g.addColorStop(0.5, 'rgba(255,255,255,1)');
  g.addColorStop(1, 'rgba(0,0,0,1)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 4);
  bellTex = new THREE.CanvasTexture(c);
  bellTex.colorSpace = THREE.NoColorSpace;
  return bellTex;
}

function buildCrack(spec) {
  const g = new THREE.Group();
  const th0 = thetaOf(spec.yaw);
  const r = rng(515);
  // трещина: ломаная сверху вниз, ~3,4 м, чуть наискось
  const path = [];
  let a = -0.25;
  for (let y = 1.7; y >= -1.7; y -= 0.05) {
    a += (r() - 0.5) * 0.05 + 0.006;
    path.push([a, y]);
  }
  const taper = (i, n) => Math.sin((Math.PI * (i + 0.5)) / n) ** 0.6;
  const core = new THREE.Mesh(ribbon(path, th0, R - 0.003, (i, n) => (0.012 + 0.016 * r()) * taper(i, n)), new THREE.MeshStandardMaterial({ color: 0x0e0b0a, roughness: 0.9, side: THREE.DoubleSide }));
  g.add(core);
  // мокрый ореол: порода темнеет и блестит
  const wetMat = new THREE.MeshStandardMaterial({ color: 0x120e0c, roughness: 0.06, metalness: 0.1, transparent: true, alphaMap: bell(), opacity: 0.85, depthWrite: false, side: THREE.DoubleSide });
  g.add(new THREE.Mesh(ribbon(path, th0, R - 0.005, (i, n) => (0.3 + 0.12 * Math.sin(i * 0.37)) * taper(i, n)), wetMat));
  // дорожки потёков вниз от трещины
  const trails = [];
  for (let k = 0; k < 14; k++) {
    const i0 = Math.floor((0.08 + 0.84 * r()) * path.length);
    const [a0, y0] = path[i0];
    const len = 0.35 + r() * 1.1;
    const tp = [];
    for (let y = y0; y >= y0 - len; y -= 0.04) tp.push([a0 + Math.sin((y0 - y) * 3 + k) * 0.015, y]);
    g.add(new THREE.Mesh(ribbon(tp, th0, R - 0.006, (i, n) => 0.08 * (1 - (i / n) * 0.6)), wetMat));
    trails.push({ a: a0, y0, len, speed: 0.18 + r() * 0.2, ph: r() });
  }
  // капли: набухают у трещины и сползают по потёкам
  const N = 42;
  const drops = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 10, 8), new THREE.MeshStandardMaterial({ color: 0xa8b4b8, roughness: 0.04, metalness: 0.3, emissive: 0x101416 }), N);
  drops.frustumCulled = false;
  g.add(drops);
  const dropBase = Array.from({ length: N }, (_, i) => ({ trail: trails[i % trails.length], ph: (i / N) * 3.7 + r() }));
  return {
    spec, group: g, drops, dropBase, th0,
    update(t) {
      const m = new THREE.Matrix4();
      const q = new THREE.Quaternion();
      dropBase.forEach((d, i) => {
        const tr = d.trail;
        const cyc = ((t * tr.speed / tr.len + d.ph) % 1 + 1) % 1; // 0 — у трещины, 1 — конец потёка
        const swell = smooth(cyc / 0.25);
        const y = tr.y0 - tr.len * Math.max(0, (cyc - 0.25) / 0.75) ** 1.4;
        const sz = 0.016 * swell * (1 - smooth((cyc - 0.85) / 0.15));
        const th = th0 + tr.a / R;
        const rr = R - 0.006 - sz * 0.5;
        q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), th);
        m.compose(new THREE.Vector3(rr * Math.sin(th), y, rr * Math.cos(th)), q, new THREE.Vector3(sz, sz * 1.35, sz * 0.6));
        drops.setMatrixAt(i, m);
      });
      drops.instanceMatrix.needsUpdate = true;
    },
  };
}

// Разлом рисует шейдер трубы (uFault*); здесь — только пыль, которая сыплется из полосы при толчке
function buildFault(spec) {
  const g = new THREE.Group();
  const r = rng(616);
  const N = 650;
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(N * 3), 3));
  const mat = new THREE.PointsMaterial({ color: 0xa39686, size: 0.022, transparent: true, opacity: 0, depthWrite: false });
  const pts = new THREE.Points(geo, mat);
  pts.frustumCulled = false;
  g.add(pts);
  const base = Array.from({ length: N }, () => ({ th: r() * Math.PI * 2, out: 0.1 + r() * 0.9, fall: 0.2 + r() * 0.6, along: (r() - 0.5) * 2 * spec.width }));
  return {
    spec, group: g, pts, mat, base, geo,
    update(t, n) {
      const since = t - spec.t + 0.35;
      this.mat.opacity = 0.95 * smooth(since / 0.25) * (1 - smooth((since - 1.2) / 2.2));
      const arr = geo.attributes.position.array;
      base.forEach((p, i) => {
        // точка на полосе разлома у стенки: плоскость через ось трубы с нормалью n
        const hx = Math.sin(p.th);
        const hz = Math.cos(p.th);
        const yPlane = -(n.x * hx + n.z * hz) * R / n.y + p.along / n.y;
        const k = Math.max(0, since);
        const rr = R - 0.02 - p.out * 0.35 * smooth(k / 1.4);
        arr.set([rr * hx, yPlane - p.fall * k * k * 0.5, rr * hz], i * 3);
      });
      geo.attributes.position.needsUpdate = true;
    },
  };
}

// нормаль плоскости разлома: падает под углом dip поперёк взгляда — на стенке впереди полоса идёт наискось
export function faultNormal(spec) {
  const th = thetaOf(spec.yaw);
  const along = new THREE.Vector3(Math.cos(th), 0, -Math.sin(th));
  const dip = spec.dip * DEG;
  return along.multiplyScalar(Math.sin(dip)).add(new THREE.Vector3(0, Math.cos(dip), 0)).normalize();
}

// Стенка вырезается эллипсоидами (до двух одновременно): uniform-массивы для шейдера трубы
export const HOLE_GLSL = `
uniform vec3 uHoleC[2];
uniform vec3 uHoleT[2];
uniform vec3 uHoleN[2];
uniform vec3 uHoleA[2];
bool inHole(vec3 p) {
  for (int i = 0; i < 2; i++) {
    vec3 d = p - uHoleC[i];
    vec3 q = vec3(dot(d, uHoleT[i]), d.y, dot(d, uHoleN[i])) / uHoleA[i];
    if (dot(q, q) < 1.0) return true;
  }
  return false;
}
`;

export function holeUniforms() {
  const far = () => [new THREE.Vector3(0, 9999, 0), new THREE.Vector3(0, 9999, 0)];
  return {
    uHoleC: { value: far() },
    uHoleT: { value: [new THREE.Vector3(1, 0, 0), new THREE.Vector3(1, 0, 0)] },
    uHoleN: { value: [new THREE.Vector3(0, 0, 1), new THREE.Vector3(0, 0, 1)] },
    uHoleA: { value: [new THREE.Vector3(1, 1, 1), new THREE.Vector3(1, 1, 1)] },
  };
}

const FAULT_N = faultNormal(FAULT);

export function buildSights(textures) {
  const group = new THREE.Group();
  const origin = { value: new THREE.Vector3() };
  const make = { geode: (sp) => buildGeode(sp, textures, origin), crack: buildCrack, fault: buildFault };
  const items = SIGHTS.filter((spec) => make[spec.name]).map((spec) => {
    const it = make[spec.name](spec);
    group.add(it.group);
    return it;
  });
  return { group, items, origin };
}

// rel(t0) — где сейчас по высоте (м, от глаз) то место стенки, что было на уровне глаз в момент t0
export function updateSights(sg, t, rel, worldOrigin, holeU) {
  sg.origin.value.copy(worldOrigin);
  let slot = 0;
  const C = holeU.uHoleC.value;
  for (const it of sg.items) {
    const y = rel(it.spec.t) + it.spec.y;
    const near = Math.abs(y) < 40 && Math.abs(t - it.spec.t) < 40; // только на спуске
    it.group.visible = near;
    if (!near) continue;
    if (it.spec.name === 'crack') {
      it.group.position.set(0, y, 0);
      it.update(t);
      continue;
    }
    if (it.spec.name === 'fault') {
      it.group.position.set(0, y, 0);
      it.update(t, FAULT_N);
      continue;
    }
    it.group.position.copy(it.center).setY(y);
    it.light.intensity = 2.0 * smooth(1 - Math.abs(y) / 4);
    if (slot < 2) {
      C[slot].set(it.center.x, y, it.center.z);
      holeU.uHoleT.value[slot].copy(it.tg);
      holeU.uHoleN.value[slot].copy(it.n);
      holeU.uHoleA.value[slot].copy(it.axes);
      slot++;
    }
  }
  for (; slot < 2; slot++) C[slot].set(0, 9999, 0);
}

// Для блёсток на стенке: точка (на радиусе R) внутри какого-нибудь выреза?
export function inAnyHole(holeU, x, y, z) {
  for (let i = 0; i < 2; i++) {
    const c = holeU.uHoleC.value[i];
    if (c.y > 9000) continue;
    const dx = x - c.x;
    const dy = y - c.y;
    const dz = z - c.z;
    const tg = holeU.uHoleT.value[i];
    const n = holeU.uHoleN.value[i];
    const A = holeU.uHoleA.value[i];
    const u = (dx * tg.x + dz * tg.z) / A.x;
    const v = dy / A.y;
    const w = (dx * n.x + dz * n.z) / A.z;
    if (u * u + v * v + w * w < 1.05) return true;
  }
  return false;
}
