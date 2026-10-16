// Вершина Чимборасо и всё, что видно с неё: снежный купол под ногами, массив вулкана, Анды на 300 км вокруг
// (настоящие вулканы на настоящих азимутах), прибрежная низменность на западе, Амазония на востоке, кривизна
// Земли, море (его уровень потом поднимается) и море облаков ниже вершины.
// Метры; герой стоит на вершине (0, 0, 0); +X — восток, −Z — север. Высота над морем = y + 6263 + провал кривизны.
import * as THREE from 'three';
import { rng, smooth } from '../pov/util.js';

export const SUMMIT = 6263;
const R_EARTH = 6371000 / (1 - 0.13); // с поправкой на рефракцию — как видит глаз
export const drop = (d) => (d * d) / (2 * R_EARTH);

// --- шум --------------------------------------------------------------------------------------------------
function hash(x, y) {
  let h = (x * 374761393 + y * 668265263) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
function vnoise(x, y) {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const u = xf * xf * (3 - 2 * xf);
  const v = yf * yf * (3 - 2 * yf);
  const a = hash(xi, yi);
  const b = hash(xi + 1, yi);
  const c = hash(xi, yi + 1);
  const d = hash(xi + 1, yi + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
function fbm(x, y, oct = 5) {
  let s = 0;
  let a = 0.5;
  let f = 1;
  for (let i = 0; i < oct; i++) {
    s += a * (vnoise(x * f, y * f) * 2 - 1);
    f *= 2.03;
    a *= 0.5;
  }
  return s;
}

// --- вулканы: [название, высота м, расстояние км, азимут °] от Чимборасо ---------------------------------------
export const PEAKS = [
  ['Carihuairazo', 5018, 10.7, 44, 6],
  ['Tungurahua', 5023, 41.7, 90, 9],
  ['El Altar', 5319, 50, 118, 11],
  ['Sangay', 5230, 80, 138, 10],
  ['Cotopaxi', 5897, 97, 26, 12],
  ['Iliniza', 5248, 90, 7, 9],
  ['Antisana', 5753, 133, 34, 13],
  ['Cayambe', 5790, 190, 29, 14],
  ['Quilindaña', 4877, 112, 40, 8],
];
const PEAK_XY = PEAKS.map(([n, h, d, az, rb]) => ({ n, h, x: d * Math.sin(az * Math.PI / 180), y: d * Math.cos(az * Math.PI / 180), rb }));

// Высота над морем (м) в точке (x — восток, y — север), км
export function elevation(x, y) {
  const r = Math.hypot(x, y);
  // ось Анд идёт на ССВ (~20°): u — поперёк хребта (+ на восток-юго-восток), v — вдоль
  const c = Math.cos(20 * Math.PI / 180);
  const s = Math.sin(20 * Math.PI / 180);
  const u = x * c - y * s;
  const v = x * s + y * c;
  // профиль поперёк Анд: западный склон, межгорная долина, восточная кордильера, Амазония
  let base;
  if (u < -8) base = 3500 - (3450 * smooth((-u - 8) / 62)); // к западу — до прибрежной равнины (~50 м)
  else if (u < 12) base = 3500 + 200 * smooth((u + 8) / 20) * 0; // массив
  else if (u < 34) base = 3500 - 700 * smooth((u - 12) / 10) + 0 * u; // межгорная долина ~2 800 м
  else if (u < 72) base = 2800 + 1150 * smooth((u - 34) / 14); // восточная кордильера ~3 950 м
  else base = 3950 - 3700 * smooth((u - 72) / 45); // спуск в Амазонию (~250 м)
  // на юге и севере хребет чуть ниже, вдоль оси — волны (на западной кордильере и в долине)
  base += 250 * Math.sin(v / 37) * smooth((u + 40) / 30) * (1 - smooth((u - 30) / 20));
  // шероховатость: в горах сильнее
  const rough = base > 1500 ? 380 : base > 400 ? 160 : 25;
  let h = base + rough * fbm(x / 9, y / 9, 5);
  // прибрежная низменность: берег Тихого океана в ~200 км к западу; к юго-западу — залив Гуаякиль
  const coast = -205 + 18 * fbm(y / 40, 3.1, 3) + 60 * smooth((-y - 60) / 80);
  if (x < coast + 40) h = Math.min(h, 40 + (x - coast) * 3);
  // Чимборасо: купол, крутые склоны, радиальные гребни и ложбины
  if (r < 24) {
    // купол: у вершины ~4 000·r² (край снежной шапки — в 20 м, за ним склоны видны до 9° под горизонтом),
    // дальше крутые ледники, к подножию — 3 300 м
    const dd = (1000 * r * r) / (r + 0.25);
    const prof = SUMMIT - 3000 * (1 - Math.exp(-dd / 3000));
    const ang = Math.atan2(y, x);
    // купол вершины гладкий (ледяная шапка), гребни и ложбины начинаются ниже, на склонах
    const ridges = smooth((r - 0.9) / 2.2) * (1 - smooth((r - 10) / 10)) * (120 * Math.sin(ang * 9 + 2 * fbm(r / 2, ang, 2)) + 90 * fbm(x / 1.5, y / 1.5, 4))
      + (1 - smooth((r - 0.9) / 2.2)) * 6 * fbm(x / 0.25, y / 0.25, 3);
    h = Math.max(h, prof + ridges);
  }
  // соседние вулканы — конусы
  for (const p of PEAK_XY) {
    const d = Math.hypot(x - p.x, y - p.y);
    if (d < p.rb) {
      const k = d / p.rb;
      const cone = p.h - (p.h - 3600) * Math.pow(k, 0.62);
      h = Math.max(h, cone + 80 * fbm(x * 0.9, y * 0.9, 3) * k);
    }
  }
  return h;
}

// цвет склона по высоте и снегу; west/east — для разной растительности
function colorAt(h, x, y, n, out) {
  const snowLine = 4950 + 160 * n;
  if (h > snowLine) return out.setRGB(0.93, 0.95, 0.98);
  if (h > 4350) return out.setRGB(0.42 + 0.06 * n, 0.4 + 0.05 * n, 0.39); // осыпи и пепел
  if (h > 3400) return out.setRGB(0.52 + 0.06 * n, 0.5 + 0.05 * n, 0.33); // парамо: жёлтая трава
  if (h > 2300) return out.setRGB(0.36 + 0.08 * n, 0.46 + 0.06 * n, 0.27); // поля высокогорья
  if (h > 900) return out.setRGB(0.16, 0.34 + 0.05 * n, 0.18); // облачный лес
  if (x > 0) return out.setRGB(0.1, 0.28 + 0.04 * n, 0.12); // сельва
  return out.setRGB(0.3 + 0.05 * n, 0.45 + 0.05 * n, 0.22); // поля прибрежной равнины
}

// --- снег под ногами: мелкие застружины, принимает тени -----------------------------------------------------
function snowTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 512;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#eef2f8';
  ctx.fillRect(0, 0, 512, 512);
  const r = rng(61);
  // крупные мягкие пятна (неровности наста), потом мелкая зернистость и редкие искры
  const blob = (x, y, rad, col) => {
    for (const dx of [-512, 0, 512]) {
      for (const dy of [-512, 0, 512]) {
        const g = ctx.createRadialGradient(x + dx, y + dy, 0, x + dx, y + dy, rad);
        g.addColorStop(0, col);
        g.addColorStop(1, col.replace(/[\d.]+\)$/, '0)'));
        ctx.fillStyle = g;
        ctx.fillRect(x + dx - rad, y + dy - rad, rad * 2, rad * 2);
      }
    }
  };
  for (let i = 0; i < 90; i++) blob(r() * 512, r() * 512, 30 + r() * 70, r() < 0.5 ? 'rgba(196,208,228,0.22)' : 'rgba(255,255,255,0.35)');
  for (let i = 0; i < 9000; i++) {
    const v = r();
    ctx.fillStyle = v < 0.5 ? `rgba(180,195,220,${0.08 + r() * 0.12})` : `rgba(255,255,255,${0.2 + r() * 0.3})`;
    ctx.fillRect(r() * 512, r() * 512, 1 + r() * 2, 1 + r() * 2);
  }
  // ветровая рябь — едва заметная
  for (let i = 0; i < 160; i++) {
    const x = r() * 512;
    const y = r() * 512;
    ctx.strokeStyle = 'rgba(170,186,214,0.10)';
    ctx.lineWidth = 2 + r() * 3;
    const cy = -6 + r() * 12;
    const ex = 50 + r() * 50;
    const ey = r() * 8 - 4;
    for (const dx of [-512, 0, 512]) {
      for (const dy of [-512, 0, 512]) {
        ctx.beginPath();
        ctx.moveTo(x + dx, y + dy);
        ctx.quadraticCurveTo(x + dx + 30, y + dy + cy, x + dx + ex, y + dy + ey);
        ctx.stroke();
      }
    }
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 8;
  return t;
}

// полярная сетка: кольца по радиусу (от r0 до r1, с шагом, растущим наружу), sectors по кругу
function polarGrid(r0, r1, rings, sectors, height, color) {
  const pos = [];
  const col = [];
  const idx = [];
  const c = new THREE.Color();
  for (let i = 0; i <= rings; i++) {
    const rr = r0 * Math.pow(r1 / r0, i / rings);
    for (let j = 0; j <= sectors; j++) {
      const a = (j / sectors) * Math.PI * 2;
      const x = Math.cos(a) * rr;
      const z = Math.sin(a) * rr;
      const y = height(x, z, rr);
      pos.push(x, y, z);
      if (color) {
        color(x, z, y, c);
        col.push(c.r, c.g, c.b);
      }
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
  if (color) g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

// --- облака: слой ниже вершины, прозрачность из шума, едет по ветру ------------------------------------------
const CLOUD_VS = `
uniform float uBase;
varying vec2 vXZ; varying float vDist; varying vec3 vW;
#include <common>
#include <logdepthbuf_pars_vertex>
void main() {
  vec4 wp = modelMatrix * vec4(position + vec3(0.0, uBase, 0.0), 1.0);
  vXZ = position.xz;
  vDist = length(position.xz);
  vW = wp.xyz;
  gl_Position = projectionMatrix * viewMatrix * wp;
  #include <logdepthbuf_vertex>
}`;
// море облаков: прозрачность и рельеф «барашков» из шума; прямой свет Солнца по нормали рельефа, рассеянный —
// от неба, тёплое свечение в сторону Солнца на рассвете и закате, дымка вдали
const CLOUD_FS = `
uniform sampler2D uNoise; uniform vec2 uOff; uniform float uCover; uniform vec3 uSun; uniform vec3 uLit; uniform vec3 uShade;
uniform vec3 uGlow; uniform vec3 uHaze; uniform float uHazeK; uniform float uSoft; uniform float uBands; uniform float uFade;
varying vec2 vXZ; varying float vDist; varying vec3 vW;
#include <logdepthbuf_pars_fragment>
float dens(vec2 p) {
  return texture2D(uNoise, p).r * 0.6 + texture2D(uNoise, p * 3.1 + uOff * 1.7).r * 0.28 + texture2D(uNoise, p * 9.0 - uOff).r * 0.12;
}
void main() {
  #include <logdepthbuf_fragment>
  // при быстром вращении облака вытягиваются вдоль широт (восток — запад) и собираются в полосы
  vec2 p = vXZ / 42000.0 * vec2(mix(1.0, 0.55, uBands), 1.0) + uOff;
  float n = dens(p);
  n = mix(n, n * (0.55 + 0.9 * smoothstep(-0.2, 0.9, sin(vXZ.y / 23000.0 + 1.3 + 0.6 * sin(vXZ.x / 90000.0)))), uBands * 0.55);
  float a = smoothstep(1.0 - uCover - uSoft, 1.0 - uCover + uSoft, n);
  if (a < 0.01) discard;
  float e = 0.004;
  float nx = dens(p + vec2(e, 0.0));
  float nz = dens(p + vec2(0.0, e));
  vec3 N = normalize(vec3(-(nx - n) * 28.0, 1.0, -(nz - n) * 28.0));
  vec3 L = normalize(uSun + vec3(0.0, 0.06, 0.0));
  float direct = max(0.0, dot(N, L)) * smoothstep(-0.07, 0.02, uSun.y);
  float top = smoothstep(0.35, 0.95, n);
  vec3 c = uShade * (0.75 + 0.35 * top) + uLit * direct * (0.55 + 0.6 * top);
  vec3 V = normalize(vW - cameraPosition);
  vec2 sh = normalize(uSun.xz + 1e-5);
  float fwd = pow(max(0.0, dot(normalize(V.xz + 1e-5), sh)), 3.0);
  c += uGlow * fwd * (0.4 + 0.6 * top);
  float haze = 1.0 - exp(-pow(vDist * uHazeK, 2.0));
  c = mix(c, uHaze, haze * 0.8);
  gl_FragColor = vec4(c, a * (1.0 - smoothstep(180000.0, 230000.0, vDist)) * uFade);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;

function noiseTexture() {
  const S = 256;
  const c = document.createElement('canvas');
  c.width = c.height = S;
  const ctx = c.getContext('2d');
  const img = ctx.createImageData(S, S);
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      // бесшовный шум: сумма октав на торе
      let v = 0;
      let a = 0.5;
      for (let o = 0; o < 5; o++) {
        const f = 4 * 2 ** o;
        const nx = (x / S) * f;
        const ny = (y / S) * f;
        const xi = Math.floor(nx);
        const yi = Math.floor(ny);
        const xf = nx - xi;
        const yf = ny - yi;
        const u = xf * xf * (3 - 2 * xf);
        const w = yf * yf * (3 - 2 * yf);
        const hh = (i, j) => hash(((i % f) + f) % f + o * 1000, ((j % f) + f) % f);
        const n = hh(xi, yi) * (1 - u) * (1 - w) + hh(xi + 1, yi) * u * (1 - w) + hh(xi, yi + 1) * (1 - u) * w + hh(xi + 1, yi + 1) * u * w;
        v += a * n;
        a *= 0.5;
      }
      const g = Math.max(0, Math.min(255, Math.round(v * 255 * 1.03)));
      const i = (y * S + x) * 4;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = g;
      img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.NoColorSpace;
  return t;
}

export function buildSummit() {
  const group = new THREE.Group();

  // снег рядом: до 600 м, высоты — купол вершины, мелкие застружины у ног
  const near = polarGrid(0.4, 560, 76, 288, (x, z, rr) => {
    const kx = x / 1000;
    const ky = -z / 1000;
    const big = elevation(kx, ky) - SUMMIT;
    const sast = (0.12 * fbm(x / 2.2, z / 0.7, 3) * smooth(rr / 3) + 0.5 * fbm(x / 18, z / 18, 3) * smooth(rr / 30)) * (1 - smooth((rr - 300) / 200));
    return big + sast - drop(rr);
  });
  const snowMap = snowTexture();
  const uv = new Float32Array(near.attributes.position.count * 2);
  for (let i = 0; i < near.attributes.position.count; i++) {
    uv[i * 2] = near.attributes.position.getX(i) / 11;
    uv[i * 2 + 1] = near.attributes.position.getZ(i) / 11;
  }
  near.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  // текстура в двух масштабах (11 м и 2,6 м, под углом друг к другу) — повтор плитки не виден
  const snowMat = new THREE.MeshStandardMaterial({ map: snowMap, color: 0xffffff, roughness: 0.82, metalness: 0 });
  snowMat.onBeforeCompile = (sh) => {
    sh.fragmentShader = sh.fragmentShader.replace(
      '#include <map_fragment>',
      `vec4 sA = texture2D(map, vMapUv);
      vec2 uv2 = mat2(0.8, -0.6, 0.6, 0.8) * vMapUv * 4.3 + 0.37;
      vec4 sB = texture2D(map, uv2);
      diffuseColor.rgb *= sA.rgb * (0.55 + 0.45 * sB.rgb / 0.93);`
    );
  };
  const snow = new THREE.Mesh(near, snowMat);
  snow.receiveShadow = true;
  group.add(snow);
  // середина сетки (r < 0,4 м) пустая — под ботинками её не видно, но после отрыва сверху она была бы дырой
  const capGeo = new THREE.CircleGeometry(0.45, 32);
  capGeo.rotateX(-Math.PI / 2);
  const cuv = capGeo.attributes.uv;
  for (let i = 0; i < cuv.count; i++) cuv.setXY(i, capGeo.attributes.position.getX(i) / 11, capGeo.attributes.position.getZ(i) / 11);
  const cap = new THREE.Mesh(capGeo, snowMat);
  cap.position.y = near.attributes.position.getY(0) - 0.002; // на высоте внутреннего кольца сетки
  cap.receiveShadow = true;
  group.add(cap);

  // всё остальное: от 560 м (стык со снегом — те же вершины по кругу) до 320 км, цвет по высоте
  const far = polarGrid(560, 320000, 150, 288, (x, z, rr) => elevation(x / 1000, -z / 1000) - SUMMIT - drop(rr), (x, z, y, c) => {
    const h = y + SUMMIT + drop(Math.hypot(x, z));
    colorAt(h, x / 1000, -z / 1000, fbm(x / 3000, z / 3000, 3), c);
  });
  const land = new THREE.Mesh(far, new THREE.MeshLambertMaterial({ vertexColors: true }));
  group.add(land);

  // море: диск с кривизной; уровень (м над нынешним морем) задаётся каждый кадр. Свой шейдер: рябь из шума,
  // отражение неба по Френелю, солнечная дорожка, дымка вдали
  const seaGeo = polarGrid(1500, 330000, 70, 200, (x, z, rr) => -drop(rr));
  const noise = noiseTexture();
  const seaU = {
    uSea: { value: 0 }, uSun: { value: new THREE.Vector3(0, 1, 0) }, uSunCol: { value: new THREE.Color(1, 1, 1) },
    uHor: { value: new THREE.Color() }, uZen: { value: new THREE.Color() }, uDeep: { value: new THREE.Color(0.03, 0.12, 0.22) },
    uHaze: { value: new THREE.Color() }, uHazeK: { value: 1 / 220000 }, uNoise: { value: noise }, uTime: { value: 0 }, uLight: { value: 1 }, uFade: { value: 1 },
  };
  const seaMat = new THREE.ShaderMaterial({
    uniforms: seaU,
    vertexShader: `
      uniform float uSea;
      varying vec3 vW; varying float vDist;
      #include <common>
      #include <logdepthbuf_pars_vertex>
      void main() {
        vec3 p = position; p.y += uSea - ${SUMMIT}.0;
        vec4 wp = modelMatrix * vec4(p, 1.0);
        vW = wp.xyz; vDist = length(position.xz);
        gl_Position = projectionMatrix * viewMatrix * wp;
        #include <logdepthbuf_vertex>
      }`,
    fragmentShader: `
      uniform vec3 uSun; uniform vec3 uSunCol; uniform vec3 uHor; uniform vec3 uZen; uniform vec3 uDeep; uniform vec3 uHaze;
      uniform float uHazeK; uniform sampler2D uNoise; uniform float uTime; uniform float uLight; uniform float uFade;
      varying vec3 vW; varying float vDist;
      #include <logdepthbuf_pars_fragment>
      void main() {
        #include <logdepthbuf_fragment>
        vec2 p = vW.xz;
        float e = 0.002;
        vec2 q1 = p / 900.0 + vec2(uTime * 0.004, 0.0);
        vec2 q2 = p / 260.0 + vec2(0.0, -uTime * 0.006);
        float h0 = texture2D(uNoise, q1).r + 0.5 * texture2D(uNoise, q2).r;
        float hx = texture2D(uNoise, q1 + vec2(e, 0.0)).r + 0.5 * texture2D(uNoise, q2 + vec2(e, 0.0)).r;
        float hz = texture2D(uNoise, q1 + vec2(0.0, e)).r + 0.5 * texture2D(uNoise, q2 + vec2(0.0, e)).r;
        float k = 0.9 / (1.0 + vDist / 25000.0); // вдали рябь сглаживается
        vec3 N = normalize(vec3(-(hx - h0) * k, 1.0, -(hz - h0) * k));
        vec3 V = normalize(vW - cameraPosition);
        vec3 R = reflect(V, N);
        // отражение неба приглушено (вода с горы видна тёмно-синей, а не цветом неба), иначе вдали она сливается с дымкой
        float fres = 0.03 + 0.55 * pow(1.0 - max(0.0, dot(-V, N)), 5.0);
        vec3 sky = mix(uHor, uZen, pow(clamp(R.y, 0.0, 1.0), 0.5)) * 0.8;
        vec3 body = uDeep * (0.25 + 0.75 * uLight);
        vec3 c = mix(body, sky, fres);
        float spec = pow(max(0.0, dot(R, normalize(uSun))), 380.0) * 6.0 + pow(max(0.0, dot(R, normalize(uSun))), 40.0) * 0.35;
        c += uSunCol * spec * smoothstep(-0.03, 0.03, uSun.y);
        float haze = 1.0 - exp(-pow(vDist * uHazeK, 2.0));
        c = mix(c, uHaze, haze * 0.55);
        gl_FragColor = vec4(c, uFade);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
  const sea = new THREE.Mesh(seaGeo, seaMat);
  sea.frustumCulled = false;
  sea.renderOrder = 1;
  group.add(sea);

  // облака
  const cloudU = {
    uNoise: { value: noise }, uOff: { value: new THREE.Vector2() }, uCover: { value: 0.55 }, uSoft: { value: 0.08 },
    uSun: { value: new THREE.Vector3(0, 1, 0) }, uLit: { value: new THREE.Color(1, 1, 1) }, uShade: { value: new THREE.Color(0.6, 0.65, 0.75) }, uGlow: { value: new THREE.Color(0, 0, 0) },
    uHaze: { value: new THREE.Color(0.7, 0.75, 0.85) }, uHazeK: { value: 1 / 160000 }, uBase: { value: 0 }, uBands: { value: 0 }, uFade: { value: 1 },
  };
  const cloudGeo = polarGrid(1500, 240000, 70, 200, (x, z, rr) => 3900 - SUMMIT - drop(rr) + 120 * fbm(x / 4000, z / 4000, 3));
  const cloudMat = new THREE.ShaderMaterial({ uniforms: cloudU, vertexShader: CLOUD_VS, fragmentShader: CLOUD_FS, transparent: true, depthWrite: false, side: THREE.DoubleSide });
  const clouds = new THREE.Mesh(cloudGeo, cloudMat);
  clouds.frustumCulled = false;
  clouds.renderOrder = 2;
  group.add(clouds);

  return { group, snow, cap, land, sea, seaU, clouds, cloudU };
}

// растворение всей местности (после отрыва, когда герой поднимается над ней): 1 — видна, 0 — нет
export function setSummitFade(s, f) {
  const on = f < 0.999;
  for (const m of [s.snow.material, s.land.material]) {
    if (m.transparent !== on) {
      m.transparent = on;
      m.needsUpdate = true;
    }
    m.opacity = f;
    m.depthWrite = !on || f > 0.5;
  }
  if (s.sea.material.transparent !== on) {
    s.sea.material.transparent = on;
    s.sea.material.needsUpdate = true;
  }
  s.seaU.uFade.value = f;
  s.cloudU.uFade.value = f;
}

// env: { sun, horizon, zenith, dark, tau, seaLevel, cover }
export function updateSummit(s, t, env) {
  const su = s.seaU;
  su.uSea.value = env.seaLevel;
  su.uSun.value.copy(env.sun);
  su.uSunCol.value.copy(env.sunColor);
  su.uHor.value.copy(env.horizon);
  su.uZen.value.copy(env.zenith);
  su.uHaze.value.copy(env.horizon);
  su.uTime.value = t;
  su.uLight.value = smooth((env.sun.y + 0.1) / 0.3);
  // море и сухая земля под ним: суша ниже уровня моря не рисуется поверх воды (вода ближе к глазу)
  const cu = s.cloudU;
  // облака: ветер с востока несёт на запад (+ медленное «кипение» — смещение второй октавы)
  cu.uOff.value.set(env.tau * 0.018, env.tau * 0.004);
  cu.uCover.value = env.cover;
  cu.uSun.value.copy(env.sun);
  // прямой свет: белый днём, оранжевый у горизонта; рассеянный — цвета неба (в сумерках розово-сиреневый)
  const sy = env.sun.y;
  const day = smooth((sy + 0.05) / 0.25);
  const twi = smooth((sy + 0.3) / 0.25) * (1 - smooth((sy - 0.02) / 0.3));
  const warm = smooth(1 - Math.abs(sy) / 0.22);
  cu.uLit.value.setRGB(1, 0.96, 0.9).lerp(new THREE.Color(1.0, 0.55, 0.32), warm).multiplyScalar(1.05 * smooth((sy + 0.05) / 0.1));
  cu.uShade.value.setRGB(0.62, 0.68, 0.8).multiplyScalar(0.06 + 0.7 * day).lerp(new THREE.Color(0.42, 0.36, 0.5), twi * (1 - day) * 0.9);
  cu.uGlow.value.setRGB(1.0, 0.5, 0.3).multiplyScalar(0.55 * twi * (1 - 0.7 * day));
  cu.uHaze.value.copy(env.horizon);
  cu.uBase.value = Math.max(0, env.seaLevel + 900 - 3900); // облака держатся над морем
  cu.uBands.value = env.bands ?? 0;
}
