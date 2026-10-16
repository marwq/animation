// Небо над вершиной: цвет по высоте Солнца (день, сумерки с тенью Земли и поясом Венеры, ночь), солнечный
// диск, Луна с фазой, звёзды и Млечный Путь. Небо вращается вокруг полюса мира — на экваторе полюса лежат
// на горизонте, звёзды встают вертикально. Когда Земля крутится быстрее, звёзды тянутся в дуги (трек за
// «выдержку» кадра), и по длине треков видно, как растёт скорость.
// Система координат: +X — восток, +Y — вверх, −Z — север.
import * as THREE from 'three';
import { rng, smooth } from '../pov/util.js';

const DEG = Math.PI / 180;

// направление на светило: склонение dec, часовой угол H (рад), широта lat (рад)
export function skyDir(dec, H, lat, out = new THREE.Vector3()) {
  const e = -Math.cos(dec) * Math.sin(H);
  const n = Math.sin(dec) * Math.cos(lat) - Math.cos(dec) * Math.cos(H) * Math.sin(lat);
  const u = Math.sin(dec) * Math.sin(lat) + Math.cos(dec) * Math.cos(H) * Math.cos(lat);
  return out.set(e, u, -n);
}

const SKY_VS = `
varying vec3 vDir;
void main() { vDir = position; vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0); gl_Position = p.xyww; }`;
const SKY_FS = `
uniform vec3 uSun; uniform vec3 uMoon; uniform float uMoonLit; uniform float uAir;
varying vec3 vDir;
void main() {
  vec3 d = normalize(vDir);
  float h = d.y;
  float sunAlt = uSun.y;
  float day = smoothstep(-0.1, 0.12, sunAlt);
  float twi = smoothstep(-0.32, -0.02, sunAlt) * (1.0 - smoothstep(0.02, 0.3, sunAlt));
  float night = 1.0 - smoothstep(-0.3, -0.06, sunAlt);
  float cosS = dot(d, normalize(uSun));
  vec3 sunH = normalize(vec3(uSun.x, 0.0, uSun.z) + 1e-5);
  float toward = dot(normalize(vec3(d.x, 0.0, d.z) + 1e-5), sunH); // −1…1: в сторону Солнца по азимуту
  float up = clamp(h, 0.0, 1.0);
  // день: на высоте 6 км небо тёмно-синее, у горизонта — бледное
  vec3 dayZen = vec3(0.10, 0.27, 0.66);
  vec3 dayHor = vec3(0.62, 0.74, 0.88);
  vec3 col = mix(dayHor, dayZen, pow(up, 0.42)) * day;
  // сумерки: тёплое зарево со стороны Солнца, тень Земли и пояс Венеры — с противоположной
  vec3 glow = mix(vec3(1.0, 0.45, 0.18), vec3(1.0, 0.76, 0.42), smoothstep(-0.05, 0.08, sunAlt));
  float sunSide = pow(max(toward, 0.0), 2.0);
  float antiSide = pow(max(-toward, 0.0), 1.5);
  vec3 twiZen = vec3(0.08, 0.12, 0.30);
  vec3 tw = mix(vec3(0.30, 0.28, 0.42), twiZen, pow(up, 0.5));
  tw += glow * sunSide * exp(-up * 5.0) * 1.1;
  float belt = exp(-pow((h - 0.12) / 0.06, 2.0)) * antiSide; // пояс Венеры
  float shadow = (1.0 - smoothstep(0.0, 0.1, h)) * antiSide;  // тень Земли
  tw += vec3(0.55, 0.32, 0.42) * belt * 0.7;
  tw = mix(tw, vec3(0.10, 0.12, 0.24), shadow * 0.7);
  col = mix(col, tw, twi);
  // ночь
  vec3 ni = mix(vec3(0.028, 0.035, 0.07), vec3(0.006, 0.009, 0.022), pow(up, 0.6));
  col = mix(col, ni, night);
  // над атмосферой небо чёрное в любое время суток
  col *= uAir;
  // ореол вокруг Солнца и диск
  float aboveH = smoothstep(-0.02, 0.01, h);
  col += vec3(1.0, 0.85, 0.62) * pow(max(cosS, 0.0), 24.0) * 0.55 * smoothstep(-0.15, 0.02, sunAlt) * (0.15 + 0.85 * uAir);
  col += vec3(1.0, 0.92, 0.75) * pow(max(cosS, 0.0), 600.0) * 1.6 * smoothstep(-0.05, 0.02, sunAlt);
  col += vec3(1.0, 0.97, 0.9) * smoothstep(0.99985, 0.99992, cosS) * 9.0 * mix(1.0, aboveH, uAir);
  // ореол Луны ночью
  float cosM = dot(d, normalize(uMoon));
  col += vec3(0.6, 0.7, 0.9) * pow(max(cosM, 0.0), 80.0) * 0.18 * uMoonLit * night;
  // ниже горизонта — цвет дымки (там всё равно земля и облака)
  col = mix(col, col * 0.7, smoothstep(0.0, -0.08, h) * uAir);
  gl_FragColor = vec4(col, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;

export function buildSky() {
  const group = new THREE.Group();
  const uniforms = { uSun: { value: new THREE.Vector3(0, 1, 0) }, uMoon: { value: new THREE.Vector3(0, 1, 0) }, uMoonLit: { value: 0.5 }, uAir: { value: 1 } };
  const dome = new THREE.Mesh(new THREE.SphereGeometry(1000, 48, 24), new THREE.ShaderMaterial({ uniforms, vertexShader: SKY_VS, fragmentShader: SKY_FS, side: THREE.BackSide, depthWrite: false, depthTest: false, fog: false }));
  dome.renderOrder = -10;
  dome.frustumCulled = false;
  group.add(dome);

  // звёзды: в экваториальных координатах (склонение, прямое восхождение); каждая — короткий отрезок
  const r = rng(404);
  const STARS = 2600;
  const stars = [];
  // плоскость Галактики: наклонена к экватору на ~63°; вдоль неё звёзды гуще
  const galPole = new THREE.Vector3(Math.cos(27.1 * DEG) * Math.cos(192.9 * DEG), Math.sin(27.1 * DEG), Math.cos(27.1 * DEG) * Math.sin(192.9 * DEG));
  while (stars.length < STARS) {
    const z = r() * 2 - 1;
    const a = r() * Math.PI * 2;
    const v = new THREE.Vector3(Math.sqrt(1 - z * z) * Math.cos(a), z, Math.sqrt(1 - z * z) * Math.sin(a));
    const gal = Math.abs(v.dot(galPole));
    if (r() > 0.35 + 0.65 * Math.exp(-gal * gal * 40)) continue; // гуще у плоскости Галактики
    const mag = Math.pow(r(), 3.2); // много тусклых, мало ярких
    stars.push({ dec: Math.asin(v.y), ra: Math.atan2(v.z, v.x), b: 0.25 + 0.75 * mag });
  }
  const pos = new Float32Array(STARS * 6);
  const col = new Float32Array(STARS * 6);
  stars.forEach((s, i) => {
    const tint = r();
    const c = tint < 0.15 ? [1.0, 0.85, 0.7] : tint < 0.3 ? [0.75, 0.85, 1.0] : [1, 1, 1];
    for (let k = 0; k < 2; k++) col.set(c.map((x) => x * s.b * (k ? 0.15 : 1)), i * 6 + k * 3);
  });
  const sg = new THREE.BufferGeometry();
  sg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  sg.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const starMat = new THREE.LineBasicMaterial({ vertexColors: true, transparent: false, opacity: 0, depthWrite: false, depthTest: false, fog: false, blending: THREE.AdditiveBlending });
  const starLines = new THREE.LineSegments(sg, starMat);
  starLines.frustumCulled = false;
  starLines.renderOrder = -9; // не прозрачные: рисуются до земли, и земля их закрывает (сложение цвета остаётся)
  group.add(starLines);
  // яркие звёзды ещё и точками (отрезок нулевой длины не виден)
  const pg = new THREE.BufferGeometry();
  const ppos = new Float32Array(STARS * 3);
  const pcol = new Float32Array(STARS * 3);
  stars.forEach((s, i) => pcol.set([s.b, s.b, s.b * 1.02].map((x) => x * x), i * 3));
  pg.setAttribute('position', new THREE.BufferAttribute(ppos, 3));
  pg.setAttribute('color', new THREE.BufferAttribute(pcol, 3));
  const pointMat = new THREE.PointsMaterial({ vertexColors: true, size: 2.2, sizeAttenuation: false, transparent: false, opacity: 0, depthWrite: false, depthTest: false, fog: false, blending: THREE.AdditiveBlending });
  const starPts = new THREE.Points(pg, pointMat);
  starPts.frustumCulled = false;
  starPts.renderOrder = -9;
  group.add(starPts);

  // Луна: шар, освещённый с направления на Солнце (фаза получается сама); свой шейдер, чтобы свет сцены её не трогал
  const moonMat = new THREE.ShaderMaterial({
    uniforms: { uSun: { value: new THREE.Vector3(0, 1, 0) } },
    vertexShader: 'varying vec3 vN; varying vec3 vP; void main() { vN = normalize(mat3(modelMatrix) * normal); vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `uniform vec3 uSun; varying vec3 vN; varying vec3 vP;
      void main() {
        float lit = smoothstep(-0.05, 0.25, dot(vN, normalize(uSun)));
        float mare = 0.82 + 0.18 * sin(vP.x * 1.7 + 1.0) * sin(vP.y * 2.1 - 0.4) * sin(vP.z * 1.3 + 2.0);
        vec3 c = vec3(0.86, 0.84, 0.8) * mare * (0.03 + 0.97 * lit);
        gl_FragColor = vec4(c, 1.0);
        #include <colorspace_fragment>
      }`,
    depthWrite: false,
    fog: false,
  });
  const moon = new THREE.Mesh(new THREE.SphereGeometry(4.4, 32, 24), moonMat);
  moon.renderOrder = -8;
  group.add(moon);

  return { group, uniforms, stars, sg, starMat, starPts, pg, pointMat, moon, moonMat };
}

// solar — часовой угол Солнца (рад, растёт), sidereal — поворот звёздного неба (рад), elong — элонгация Луны,
// lat — широта (рад), rate — скорость вращения неба (рад за секунду ролика): длина треков
export function updateSky(s, cam, solarH, siderealA, elongation, lat, rate, air = 1) {
  s.group.position.copy(cam);
  s.uniforms.uAir.value = air;
  const sun = skyDir(-0.3 * DEG, solarH, lat);
  const moonDir = skyDir(1.5 * DEG, solarH - elongation, lat);
  s.uniforms.uSun.value.copy(sun);
  s.uniforms.uMoon.value.copy(moonDir);
  const phase = (1 - Math.cos(elongation)) / 2;
  s.uniforms.uMoonLit.value = phase;
  // звёзды: видно, когда Солнце ниже −6°; днём выключены
  const dark = Math.max(1 - smooth((sun.y + 0.14) / 0.12), 1 - air);
  s.starMat.opacity = dark;
  s.pointMat.opacity = dark * smooth(1 - rate / 0.25); // на большой скорости — только треки
  if (dark > 0.01) {
    const arr = s.sg.attributes.position.array;
    const parr = s.pg.attributes.position.array;
    const trail = Math.min(0.6, rate / 30); // рад за «выдержку» 1/30 с
    const v = new THREE.Vector3();
    s.stars.forEach((st, i) => {
      const H = siderealA - st.ra;
      skyDir(st.dec, H, lat, v).multiplyScalar(900);
      arr[i * 6] = v.x;
      arr[i * 6 + 1] = v.y;
      arr[i * 6 + 2] = v.z;
      parr.set([v.x, v.y, v.z], i * 3);
      skyDir(st.dec, H - trail, lat, v).multiplyScalar(900);
      arr[i * 6 + 3] = v.x;
      arr[i * 6 + 4] = v.y;
      arr[i * 6 + 5] = v.z;
    });
    s.sg.attributes.position.needsUpdate = true;
    s.pg.attributes.position.needsUpdate = true;
  }
  // Луна на расстоянии 600 (угловой размер ~0,5°… чуть крупнее для читаемости — как кажется глазу)
  s.moon.position.copy(moonDir).multiplyScalar(560);
  s.moonMat.uniforms.uSun.value.copy(sun);
  s.moon.visible = moonDir.y > -0.05 && air > 0.5; // в космосе Луна — настоящий шар (planet.js)
  return { sun, moon: moonDir, dark };
}
