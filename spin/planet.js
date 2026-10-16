// Земля целиком — для второй половины ролика, когда герой уже на орбите. Сплюснутая вращением (экватор
// вытянут почти в острый край), с полосами облаков, как у Юпитера, атмосферой по краю, кольцом из
// сброшенного с экватора вещества и старой Луной вдали. Суша — настоящая (Natural Earth, spin/assets/land.png).
//
// Система координат та же, что у вершины: начало — точка, где стоял герой, +X — восток, +Y — вверх, −Z — север;
// метры. Центр Земли — в (0, −R, 0), ось вращения смотрит на север (−Z).
import * as THREE from 'three';
import { rng } from '../pov/util.js';

const NOISE = `
float h3(vec3 p) { return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }
float n3(vec3 x) {
  vec3 i = floor(x); vec3 f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(h3(i), h3(i + vec3(1,0,0)), f.x), mix(h3(i + vec3(0,1,0)), h3(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(h3(i + vec3(0,0,1)), h3(i + vec3(1,0,1)), f.x), mix(h3(i + vec3(0,1,1)), h3(i + vec3(1,1,1)), f.x), f.y), f.z);
}
float fbm3(vec3 p) { float s = 0.0, a = 0.5; for (int i = 0; i < 5; i++) { s += a * n3(p); p *= 2.03; a *= 0.5; } return s; }
`;

// форма: сфероид a×c плюс «острый» экватор (как у тела на пределе сброса вещества)
const SHAPE = `
uniform float uA; uniform float uC; uniform float uCusp;
vec3 shape(vec3 p) {
  float cl = sqrt(max(0.0, 1.0 - p.y * p.y));        // cos широты
  float r = 1.0 / sqrt(p.y * p.y / (uC * uC) + cl * cl / (uA * uA));
  r *= 1.0 - uCusp * (1.0 - pow(cl, 12.0)); // экватор остаётся на радиусе a, остальное чуть ниже — острый край
  return p * r;
}
`;

const GLOBE_VS = `
${SHAPE}
varying vec3 vP; varying vec3 vN; varying vec3 vW;
#include <common>
#include <logdepthbuf_pars_vertex>
void main() {
  vP = normalize(position);
  vec3 q = shape(vP);
  // нормаль — по соседним точкам формы
  vec3 t1 = normalize(cross(vP, abs(vP.y) < 0.99 ? vec3(0.0, 1.0, 0.0) : vec3(1.0, 0.0, 0.0)));
  vec3 t2 = cross(vP, t1);
  vec3 qa = shape(normalize(vP + t1 * 0.002));
  vec3 qb = shape(normalize(vP + t2 * 0.002));
  vec3 n = normalize(cross(qa - q, qb - q));
  if (dot(n, vP) < 0.0) n = -n;
  vN = normalize(mat3(modelMatrix) * n);
  vec4 wp = modelMatrix * vec4(q, 1.0);
  vW = wp.xyz;
  gl_Position = projectionMatrix * viewMatrix * wp;
  #include <logdepthbuf_vertex>
}`;

const GLOBE_FS = `
uniform sampler2D uLand; uniform vec3 uSun; uniform float uSpin; uniform float uTime; uniform float uBands; uniform float uCloud;
uniform float uRingIn; uniform float uRingOut; uniform float uRing; uniform vec3 uCenter; uniform vec3 uAxis;
varying vec3 vP; varying vec3 vN; varying vec3 vW;
${NOISE}
#include <logdepthbuf_pars_fragment>
void main() {
  #include <logdepthbuf_fragment>
  float lat = asin(clamp(vP.y, -1.0, 1.0));
  float lon = atan(-vP.z, vP.x);                       // 0 — по +X, 90° — по −Z (восток против часовой)
  vec2 uv = vec2(fract((lon + 3.14159265) / 6.2831853), 0.5 + lat / 3.14159265);
  float land = texture2D(uLand, uv).r;
  float alat = abs(lat);
  // суша по широтам: тропический лес, пустыни, степи, тайга, тундра, лёд
  vec3 cTrop = vec3(0.10, 0.25, 0.09), cDes = vec3(0.62, 0.52, 0.34), cTemp = vec3(0.22, 0.32, 0.15), cTun = vec3(0.42, 0.40, 0.34);
  float nl = fbm3(vP * 9.0);
  vec3 cl = mix(cTrop, cDes, smoothstep(0.17, 0.3, alat + (nl - 0.5) * 0.18) * (1.0 - smoothstep(0.5, 0.62, alat)));
  cl = mix(cl, cTemp, smoothstep(0.55, 0.7, alat));
  cl = mix(cl, cTun, smoothstep(0.95, 1.1, alat));
  cl *= 0.8 + 0.4 * nl;
  float ice = smoothstep(1.12, 1.2, alat + (nl - 0.5) * 0.1) + (lat < -1.08 ? 1.0 : 0.0) * land;
  vec3 ocean = mix(vec3(0.02, 0.07, 0.17), vec3(0.03, 0.12, 0.22), smoothstep(0.9, 0.0, alat));
  vec3 col = mix(ocean, cl, smoothstep(0.35, 0.65, land));
  col = mix(col, vec3(0.86, 0.9, 0.95), clamp(ice, 0.0, 1.0));
  // облака: полосы вдоль широт (течения в соседних полосах — в разные стороны), мягкие, с вихрями на границах;
  // чем быстрее вращение, тем сильнее вытянуты вдоль широт
  float bandN = mix(3.0, 7.0, uBands);
  float jet = sin(lat * bandN * 2.0);
  float shift = 0.35 * jet * uBands * sin((uTime - 480.0) * 0.012); // соседние полосы смещаются друг относительно друга (ограниченно)
  vec3 cp = vec3(cos(lon + shift) * cos(lat), sin(lat), sin(lon + shift) * cos(lat));
  vec3 stretch = vec3(mix(1.0, 0.6, uBands), mix(1.0, 1.25, uBands), mix(1.0, 0.6, uBands));
  float cn = fbm3(cp * stretch * 2.4 + vec3(0.0, 0.0, uTime * 0.004));
  float swirl = fbm3(cp * 4.0 + 11.0);
  float bands = 0.5 + 0.5 * sin(lat * bandN * 2.0 + (swirl - 0.5) * 3.0);
  float cover = mix(cn, cn * 0.6 + bands * 0.45, uBands);
  float cloud = smoothstep(0.52 - 0.15 * uCloud, 0.78, cover);
  vec3 cloudCol = mix(vec3(0.95, 0.95, 0.96), mix(vec3(0.9, 0.84, 0.74), vec3(0.97, 0.97, 0.99), bands), uBands * 0.6);
  col = mix(col, cloudCol, cloud * 0.9);
  // свет: Ламберт с мягким терминатором; океан — блик
  vec3 N = normalize(vN);
  vec3 L = normalize(uSun);
  float ndl = dot(N, L);
  float lit = smoothstep(-0.08, 0.25, ndl);
  // тень кольца: луч к Солнцу пересекает плоскость экватора внутри кольца
  float shade = 1.0;
  if (uRing > 0.0) {
    float s = -dot(vW - uCenter, uAxis) / dot(L, uAxis);
    if (s > 0.0) {
      vec3 hit = vW + L * s - uCenter;
      float rr = length(hit - dot(hit, uAxis) * uAxis);
      shade = 1.0 - uRing * 0.75 * smoothstep(uRingIn, uRingIn * 1.05, rr) * (1.0 - smoothstep(uRingOut * 0.95, uRingOut, rr));
    }
  }
  vec3 V = normalize(vW - cameraPosition);
  vec3 R = reflect(V, N);
  float glint = pow(max(0.0, dot(R, L)), 60.0) * (1.0 - smoothstep(0.35, 0.65, land)) * (1.0 - cloud) * 0.8;
  vec3 c = col * (0.03 + 1.05 * lit * shade) + vec3(1.0, 0.95, 0.85) * glint * lit * shade;
  // атмосфера по краю диска
  float rim = pow(1.0 - max(0.0, dot(-V, N)), 3.0);
  c += vec3(0.35, 0.55, 1.0) * rim * 0.55 * smoothstep(-0.25, 0.35, ndl);
  gl_FragColor = vec4(c, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;

const ATMO_VS = `
${SHAPE}
varying vec3 vN; varying vec3 vW;
#include <common>
#include <logdepthbuf_pars_vertex>
void main() {
  vec3 p = normalize(position);
  vec3 q = shape(p) * 1.025;
  vN = normalize(mat3(modelMatrix) * p);
  vec4 wp = modelMatrix * vec4(q, 1.0);
  vW = wp.xyz;
  gl_Position = projectionMatrix * viewMatrix * wp;
  #include <logdepthbuf_vertex>
}`;
const ATMO_FS = `
uniform vec3 uSun; uniform float uOn;
varying vec3 vN; varying vec3 vW;
#include <logdepthbuf_pars_fragment>
void main() {
  #include <logdepthbuf_fragment>
  vec3 V = normalize(vW - cameraPosition);
  float edge = pow(1.0 - abs(dot(V, normalize(vN))), 2.5);
  float day = smoothstep(-0.3, 0.4, dot(normalize(vN), normalize(uSun)));
  vec3 c = mix(vec3(0.25, 0.45, 1.0), vec3(1.0, 0.55, 0.3), smoothstep(0.25, -0.15, dot(normalize(vN), normalize(uSun))) * 0.6);
  gl_FragColor = vec4(c * edge * day * 1.4 * uOn, edge * day * uOn);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;

// кольцо: плоский диск в плоскости экватора; плотность по радиусу — полосы и щели (шум), сквозь кольцо видно
const RING_VS = `
varying vec3 vW; varying vec2 vL;
#include <common>
#include <logdepthbuf_pars_vertex>
void main() {
  vL = position.xy;
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vW = wp.xyz;
  gl_Position = projectionMatrix * viewMatrix * wp;
  #include <logdepthbuf_vertex>
}`;
const RING_FS = `
uniform float uIn; uniform float uOut; uniform float uDense; uniform vec3 uSun; uniform vec3 uCenter; uniform float uA; uniform float uC;
uniform float uTime; uniform float uClump; uniform float uRoche;
varying vec3 vW; varying vec2 vL;
${NOISE}
#include <logdepthbuf_pars_fragment>
void main() {
  #include <logdepthbuf_fragment>
  float r = length(vL);
  if (r < uIn || r > uOut) discard;
  float x = (r - uIn) / (uOut - uIn);
  // несколько широких колец со щелями между ними, внутри — мягкая неоднородность
  float n = n3(vec3(r / 1600000.0, 0.0, 0.0)) * 0.6 + n3(vec3(r / 520000.0, 3.0, 0.0)) * 0.3 + n3(vec3(r / 180000.0, 7.0, 0.0)) * 0.1;
  float gaps = smoothstep(0.18, 0.32, n3(vec3(r / 900000.0, 13.0, 0.0)));
  float d = uDense * (0.3 + 0.7 * n) * (0.5 + 0.5 * gaps) * smoothstep(0.0, 0.08, x) * (1.0 - smoothstep(0.75, 1.0, x)) * 0.8;
  // за пределом Роша вещество слипается в комки: кольцо там рвётся на сгустки
  float ang = atan(vL.y, vL.x);
  float beyond = smoothstep(uRoche * 0.97, uRoche * 1.05, r);
  float clumps = smoothstep(0.55, 0.8, n3(vec3(ang * 9.0 + uTime * 0.02, r / 20000.0, 1.0)));
  d *= mix(1.0, mix(1.0, clumps * 1.6, uClump), beyond);
  // тень планеты на кольце: точка за планетой относительно Солнца
  vec3 L = normalize(uSun);
  vec3 p = vW - uCenter;
  float along = dot(p, L);
  vec3 perp = p - along * L;
  float shadow = along < 0.0 ? smoothstep(uA * 0.98, uA * 1.02, length(perp)) : 1.0;
  vec3 col = mix(vec3(0.72, 0.66, 0.58), vec3(0.9, 0.9, 0.92), n) * (0.06 + 0.85 * shadow);
  // кольцо светится сильнее, если смотреть против Солнца (рассеяние вперёд на мелких частицах)
  vec3 V = normalize(vW - cameraPosition);
  col *= 1.0 + 1.2 * pow(max(0.0, dot(V, L)), 6.0);
  // рядом с камерой кольцо — это отдельные обломки (их рисует space.js), плоскость там прозрачна
  float near = smoothstep(1.5e6, 5e6, length(vW - cameraPosition));
  gl_FragColor = vec4(col, clamp(d, 0.0, 0.95) * near);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;

function moonTexture() {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 256;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#9b978f';
  ctx.fillRect(0, 0, 512, 256);
  const r = rng(77);
  // моря (тёмные пятна) и кратеры
  for (let i = 0; i < 14; i++) {
    const x = r() * 512;
    const y = 50 + r() * 150;
    const g = ctx.createRadialGradient(x, y, 0, x, y, 30 + r() * 50);
    g.addColorStop(0, 'rgba(70,68,66,0.75)');
    g.addColorStop(1, 'rgba(70,68,66,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 512, 256);
  }
  for (let i = 0; i < 260; i++) {
    const x = r() * 512;
    const y = r() * 256;
    const rad = 1 + r() ** 3 * 14;
    ctx.strokeStyle = 'rgba(210,206,198,0.35)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(x, y, rad, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = 'rgba(60,58,55,0.18)';
    ctx.fill();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function buildPlanet() {
  const group = new THREE.Group(); // центр Земли
  const tilt = new THREE.Group(); // ось вращения (локальная +Y) → на север (мировая −Z)
  tilt.rotation.x = -Math.PI / 2;
  group.add(tilt);
  const spin = new THREE.Group(); // поворот вокруг оси: долгота вершины смотрит вверх
  tilt.add(spin);

  const land = new THREE.TextureLoader().load('assets/land.png');
  land.colorSpace = THREE.NoColorSpace;
  land.anisotropy = 8;
  const shapeU = { uA: { value: 6.378e6 }, uC: { value: 6.357e6 }, uCusp: { value: 0 } };
  const gu = {
    ...shapeU,
    uLand: { value: land }, uSun: { value: new THREE.Vector3(1, 0, 0) }, uSpin: { value: 0 }, uTime: { value: 0 }, uBands: { value: 0 }, uCloud: { value: 0.5 },
    uRingIn: { value: 1 }, uRingOut: { value: 1 }, uRing: { value: 0 }, uCenter: { value: new THREE.Vector3() }, uAxis: { value: new THREE.Vector3(0, 0, -1) },
  };
  const globe = new THREE.Mesh(new THREE.SphereGeometry(1, 384, 192), new THREE.ShaderMaterial({ uniforms: gu, vertexShader: GLOBE_VS, fragmentShader: GLOBE_FS }));
  globe.frustumCulled = false;
  spin.add(globe);

  const au = { ...shapeU, uSun: gu.uSun, uOn: { value: 1 } };
  const atmo = new THREE.Mesh(new THREE.SphereGeometry(1, 128, 64), new THREE.ShaderMaterial({ uniforms: au, vertexShader: ATMO_VS, fragmentShader: ATMO_FS, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  atmo.frustumCulled = false;
  spin.add(atmo);

  // кольцо — в плоскости экватора (локальная XZ у tilt → кольцо в плоскости XY своей геометрии, повернём)
  const ru = {
    uIn: { value: 7e6 }, uOut: { value: 9e6 }, uDense: { value: 0 }, uSun: gu.uSun, uCenter: gu.uCenter, uA: shapeU.uA, uC: shapeU.uC,
    uTime: gu.uTime, uClump: { value: 0 }, uRoche: { value: 1.9e7 },
  };
  const ring = new THREE.Mesh(new THREE.RingGeometry(4e6, 5e7, 720, 8), new THREE.ShaderMaterial({ uniforms: ru, vertexShader: RING_VS, fragmentShader: RING_FS, transparent: true, depthWrite: false, side: THREE.DoubleSide }));
  ring.rotation.x = Math.PI / 2; // плоскость XY геометрии → XZ у tilt (экватор)
  ring.frustumCulled = false;
  ring.renderOrder = 3;
  tilt.add(ring);

  // старая Луна: 1 737 км, на 384 000 км
  const moon = new THREE.Mesh(new THREE.SphereGeometry(1.737e6, 96, 48), new THREE.MeshStandardMaterial({ map: moonTexture(), roughness: 1, metalness: 0 }));
  group.add(moon);

  return { group, tilt, spin, globe, gu, atmo, au, ring, ru, moon };
}

// st: { R (м — расстояние от вершины до центра), a, c, cusp, spin (рад), sun, time, bands, cloud,
//       ringIn, ringOut, ringDense, clump, roche, moonDir (вектор от центра Земли), visible }
export function updatePlanet(p, st) {
  p.group.visible = st.visible;
  if (!st.visible) return;
  if (st.center) p.group.position.copy(st.center);
  else p.group.position.set(0, -st.R, 0);
  p.spin.rotation.y = st.spin;
  p.gu.uA.value = st.a;
  p.gu.uC.value = st.c;
  p.gu.uCusp.value = st.cusp;
  p.gu.uSun.value.copy(st.sun);
  p.gu.uTime.value = st.time;
  p.gu.uBands.value = st.bands;
  p.gu.uCloud.value = st.cloud;
  p.gu.uRingIn.value = st.ringIn;
  p.gu.uRingOut.value = st.ringOut;
  p.gu.uRing.value = st.ringDense > 0.01 ? Math.min(1, st.ringDense) : 0;
  p.gu.uCenter.value.copy(p.group.position);
  p.ru.uIn.value = st.ringIn;
  p.ru.uOut.value = st.ringOut;
  p.ru.uDense.value = st.ringDense;
  p.ru.uClump.value = st.clump;
  p.ru.uRoche.value = st.roche;
  p.ring.visible = st.ringDense > 0.005;
  p.au.uOn.value = st.atmo ?? 1;
  p.moon.position.copy(st.moonDir).multiplyScalar(3.844e8);
}
