// «What If Earth Spun Faster and Faster?» — вид от первого лица с вершины Чимборасо. Время ускорено, и Земля
// при этом крутится всё быстрее: Солнце пролетает по небу всё чаще, звёзды тянутся в дуги.
import * as THREE from 'three';
import { buildBody, drawGauge, poseBody } from './body.js';
import { buildHud, updateHud } from './hud.js';
import { buildSky, updateSky } from './sky.js';
import { buildSummit, updateSummit } from './summit.js';
import { buildFx, updateFx } from './fx.js';
import { buildPlanet, updatePlanet } from './planet.js';
import { buildDebris, buildMoons, moonCenter, updateDebris, updateMoons } from './space.js';
import {
  CAM3_START, FLOAT_AT, JUMPS, LAT, LOOK3, cam3, groundShift, heroAlt, balance, bodyYaw, cloudAt, seaAt, shakeAt, check, dayLength, floatW, headPitch, headYaw, radiusAt, shield, solarHours, speedAt, tauAt, timelapse, weightAt,
} from './timeline.js';
import { clamp, lerp, rng, smooth } from '../pov/util.js';

const W = 1280;
const H = 720;
const DEG = Math.PI / 180;
const QS = new URLSearchParams(location.search);

await Promise.all(['700 40px "Space Grotesk"', '500 40px "Space Grotesk"', '600 40px "JetBrains Mono"'].map((f) => document.fonts.load(f)));

const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('c'), antialias: true, preserveDrawingBuffer: true, logarithmicDepthBuffer: true });
renderer.setPixelRatio(parseFloat(QS.get('dpr') || '1'));
renderer.setSize(W, H, false);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x9fb4cc, 1 / 200000);

const sky = buildSky();
const summit = buildSummit();
const fx = buildFx();
const planet = buildPlanet();
// вершина и всё вокруг неё — на «шарнире» в центре Земли: после отрыва поверхность уезжает на восток
const pivot = new THREE.Group();
const local = new THREE.Group();
pivot.add(local);
local.add(summit.group, fx.group);
const debris = buildDebris();
const moons = buildMoons();
scene.add(sky.group, pivot, planet.group, debris.group, moons.group);

// взгляд в космосе: направление на цель и «верх» (от Земли, а когда смотрим на Землю — на север)
const NORTH = new THREE.Vector3(0, 0, -1);
const _m = new THREE.Matrix4();
function lookTarget(name, eye, C, lonRad) {
  switch (name) {
    case 'planet': return C.clone();
    case 'ring': return new THREE.Vector3(Math.sin(lonRad), Math.cos(lonRad), 0).multiplyScalar(1.5e7).add(C);
    case 'moon': return moonCenter(C);
    case 'oldmoon': return planet.moon.getWorldPosition(new THREE.Vector3());
    case 'out': return eye.clone().sub(C).add(eye);
    case 'along': default: return eye.clone().add(new THREE.Vector3(Math.cos(lonRad), -Math.sin(lonRad), 0).multiplyScalar(1e6));
  }
}
function lookQuat(eye, target, C, yawDeg, pitchDeg) {
  const dir = target.clone().sub(eye).normalize();
  const radial = eye.clone().sub(C).normalize();
  const up = radial.clone().lerp(NORTH, Math.abs(dir.dot(radial))).normalize();
  const q = new THREE.Quaternion().setFromRotationMatrix(_m.lookAt(eye, target, up));
  q.multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(pitchDeg * DEG, yawDeg * DEG, 0, 'YXZ')));
  return q;
}
function spaceQuat(t, eye, C, lonRad) {
  if (!LOOK3.length) return null;
  let i = LOOK3.findIndex(([a]) => t < a);
  if (i === -1) i = LOOK3.length;
  const cur = LOOK3[Math.max(0, i - 1)];
  const q0 = lookQuat(eye, lookTarget(cur[2], eye, C, lonRad), C, cur[3], cur[4]);
  if (i === 0 || i >= LOOK3.length || t <= cur[1]) return q0;
  const nxt = LOOK3[i];
  const q1 = lookQuat(eye, lookTarget(nxt[2], eye, C, lonRad), C, nxt[3], nxt[4]);
  return q0.slerp(q1, smooth((t - cur[1]) / (nxt[0] - cur[1])));
}
const ASH = new THREE.Color(0.47, 0.43, 0.4);

// свет: Солнце (с тенью от героя на снегу), небо и отражённый снегом свет, Луна ночью
const sun = new THREE.DirectionalLight(0xffffff, 0);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -3.5, right: 3.5, top: 3.5, bottom: -3.5, near: 40, far: 160 });
sun.shadow.bias = -0.0004;
sun.shadow.normalBias = 0.02;
scene.add(sun, sun.target);
const hemi = new THREE.HemisphereLight(0x9fb8e8, 0xdfe6ef, 0.8);
scene.add(hemi);
const moonLight = new THREE.DirectionalLight(0xa8bce0, 0);
scene.add(moonLight, moonLight.target);

const body = buildBody();
body.root.traverse((o) => { if (o.isMesh) o.castShadow = true; });
scene.add(body.root);
// голова в шлеме — только для тени (камера внутри неё, в кадре её не видно)
{
  const ghost = new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false });
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.125, 16, 12), ghost);
  head.position.set(0, 0.13, -0.01);
  head.scale.set(1, 1.12, 1.08);
  head.castShadow = true;
  body.neck.add(head);
  const neckM = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.12, 10), ghost);
  neckM.position.set(0, 0.0, 0);
  neckM.castShadow = true;
  body.neck.add(neckM);
}
const camera = new THREE.PerspectiveCamera(76, W / H, 0.03, 450000);
camera.position.set(0, 0.13, -0.03);
body.neck.add(camera);
const fill = new THREE.PointLight(0xfff1e0, 0.35, 3, 1.4);
camera.add(fill);

// дыхание на морозе: облачко пара каждые ~3,4 с (в реальном времени — герой живёт без ускорения)
const puffTex = (() => {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, 'rgba(255,255,255,0.9)');
  g.addColorStop(0.5, 'rgba(255,255,255,0.35)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
})();
const puffs = Array.from({ length: 3 }, () => {
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: puffTex, transparent: true, opacity: 0, depthWrite: false, fog: false }));
  camera.add(sp);
  return sp;
});
const BREATH = 3.4;

// вид на героя со стороны — проверить позы (render.js --debug)
const debugCam = new THREE.PerspectiveCamera(40, W / H, 0.01, 450000);
debugCam.add(new THREE.PointLight(0xffffff, 0.6, 12, 1.2));
scene.add(debugCam);
let debugView = null;

buildHud('CHIMBORAZO · ECUADOR');

// прыжок: присед, полёт по параболе при нынешнем тяготении, присед при приземлении
const V0 = 2.6;
function jumpY(t) {
  for (const [t0, g] of JUMPS) {
    const T = (2 * V0) / g;
    if (t < t0 - 0.35 || t > t0 + T + 0.45) continue;
    if (t < t0) return -0.13 * Math.sin((Math.PI / 2) * smooth((t - t0 + 0.35) / 0.35)) * (1 - smooth((t - t0 + 0.06) / 0.06));
    const u = t - t0;
    if (u <= T) return V0 * u - 0.5 * g * u * u;
    return -0.11 * Math.sin(Math.PI * Math.min(1, (u - T) / 0.45));
  }
  return 0;
}

// снежная крупа, которая поднимается с поверхности, когда вес почти исчез
const GRAINS = 1400;
const grainGeo = new THREE.BufferGeometry();
grainGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(GRAINS * 3), 3));
const grainMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.035, transparent: true, opacity: 0, depthWrite: false });
const grains = new THREE.Points(grainGeo, grainMat);
grains.frustumCulled = false;
local.add(grains);
const GR = (() => {
  const r = rng(404);
  return Array.from({ length: GRAINS }, () => ({ a: r() * Math.PI * 2, d: 0.6 + Math.sqrt(r()) * 24, ph: r(), sp: 0.5 + r(), wob: r() * 6 }));
})();

const drift = (t, a, b, c) => Math.sin(t * a) * 0.6 + Math.sin(t * b + 1.3) * 0.3 + Math.sin(t * c + 2.1) * 0.1;

// цвет неба у горизонта и в зените по высоте Солнца — для дымки, облаков и света неба (как в шейдере неба)
const C = (r, g, b) => new THREE.Color(r, g, b);
function skyColors(sy) {
  const day = smooth((sy + 0.1) / 0.22);
  const twi = smooth((sy + 0.32) / 0.3) * (1 - smooth((sy - 0.02) / 0.28));
  const night = 1 - smooth((sy + 0.3) / 0.24);
  const hor = C(0.62, 0.74, 0.88).multiplyScalar(day);
  hor.lerp(C(0.62, 0.46, 0.44), twi * 0.8);
  hor.lerp(C(0.03, 0.035, 0.07), night);
  const zen = C(0.1, 0.27, 0.66).multiplyScalar(day).lerp(C(0.08, 0.12, 0.3), twi).lerp(C(0.006, 0.009, 0.022), night);
  return { hor, zen, day, twi, night };
}

const MOON0 = 62 * DEG; // элонгация Луны в начале: молодая Луна вечером; растёт на 12,19° в сутки (по времени, не по вращению)

window.renderAt = (t) => {
  const tau = tauAt(t);
  const P = dayLength(t);
  const k = timelapse(t);
  const solar = solarHours(t);
  const Hsun = ((solar - 12) / 24) * Math.PI * 2;
  const sidereal = Hsun + (tau / 24 / 365.25) * Math.PI * 2 + 2.1;
  const elong = MOON0 + (tau / 24) * 12.19 * DEG;
  const rate = (k / P) * Math.PI * 2; // рад неба за секунду ролика

  // герой: корпус, голова (сплайн + пружина + живое покачивание), позы рук
  // землетрясение: корпус качается (низкие частоты), голова дрожит (высокие)
  const sh = shakeAt(t);
  const jig = (f, ph) => Math.sin(t * f + ph) * 0.6 + Math.sin(t * f * 1.73 + ph * 2.1) * 0.4;
  body.root.position.set(sh * 0.05 * jig(17, 0.3), sh * 0.03 * jig(23, 1.1) + jumpY(t) + heroAlt(t), sh * 0.05 * jig(19, 2.2));
  body.root.rotation.set(0, bodyYaw(t) * DEG, sh * 0.02 * jig(11, 0.7));
  const yaw = headYaw(t);
  const yawVel = (headYaw(t + 0.02) - headYaw(t - 0.02)) / 0.04;
  const breath = Math.sin((t / BREATH) * Math.PI * 2);
  const pitch = headPitch(t) + 0.45 * breath;
  const roll = clamp(-yawVel * 0.035, -2.5, 2.5) + 0.3 * drift(t, 0.31, 0.83, 1.7);
  body.neck.rotation.set((pitch + 0.5 * drift(t, 0.43, 1.07, 2.3) + sh * 1.6 * jig(31, 0.5)) * DEG, (yaw + 0.6 * drift(t, 0.37, 0.91, 1.9) + sh * 1.2 * jig(27, 1.9)) * DEG, (roll + sh * 1.4 * jig(29, 2.7)) * DEG);
  body.neck.position.y = 1.52 + 0.006 * breath;
  // космос: герой на орбите по ключам cam3, взгляд — на цель (плавно сменяет управление головой)
  const Rm0 = radiusAt(t) * 1000;
  const C = new THREE.Vector3(0, -Rm0, 0);
  let lonRad = 0;
  if (t >= CAM3_START) {
    const [rk, ik, lk] = cam3(t);
    lonRad = lk * DEG;
    const ir = ik * DEG;
    body.root.position.set(Math.sin(lonRad) * Math.cos(ir), Math.cos(lonRad) * Math.cos(ir), -Math.sin(ir)).multiplyScalar(rk * 1000).add(C);
  }
  const wSpace = smooth((t - (CAM3_START - 2)) / 8);
  if (wSpace > 0) {
    body.root.updateMatrixWorld(true);
    const qNeck = body.neck.quaternion.clone();
    const qCamSummit = body.root.quaternion.clone().multiply(qNeck);
    const eye0 = body.root.position.clone().add(new THREE.Vector3(0, 1.6, 0));
    const qSpace = spaceQuat(t, eye0, C, lonRad);
    if (qSpace) {
      const qCam = qCamSummit.slerp(qSpace, wSpace);
      body.root.quaternion.copy(qCam.multiply(qNeck.invert()));
    }
  }
  poseBody(body, t, { balance: balance(t), check: check(t), shield: shield(t), float: floatW(t), tread: 0 });
  const weight = weightAt(t);
  drawGauge(body, weight);
  camera.updateMatrixWorld(true);
  const eye = camera.getWorldPosition(new THREE.Vector3());

  // после отрыва: поверхность уезжает на восток, воздух под героем редеет
  const Rm = radiusAt(t) * 1000;
  const hAlt = t >= CAM3_START ? body.root.position.distanceTo(new THREE.Vector3(0, -Rm, 0)) - Rm : heroAlt(t);
  const air = 1 - smooth((hAlt - 25000) / 90000);
  pivot.position.set(0, -Rm, 0);
  local.position.set(0, Rm, 0);
  pivot.rotation.z = -groundShift(t);
  if (t > FLOAT_AT && camera.far < 1e9) {
    camera.far = 2e9;
    camera.updateProjectionMatrix();
  }

  // небо и свет
  const sk = updateSky(sky, eye, Hsun, sidereal, elong, LAT * DEG, rate * air * (t > 488 ? 1 - smooth((t - 488.2) / 12) : 1), air);
  const sy = sk.sun.y;
  const col = skyColors(sy);
  const alt = Math.asin(clamp(sy, -1, 1));
  sun.position.copy(sk.sun).multiplyScalar(100).add(body.root.position);
  sun.target.position.copy(body.root.position);
  sun.intensity = 2.8 * smooth((alt + 0.01) / 0.07);
  sun.color.setRGB(1, 0.55, 0.32).lerp(new THREE.Color(1, 0.97, 0.92), smooth(alt / 0.4));
  // свет неба: днём голубой, в сумерках — сиреневый от светлого горизонта (снег в сумерках светлее неба над ним)
  hemi.color.copy(col.zen).lerp(new THREE.Color(0.75, 0.82, 0.95), 0.35 * col.day).lerp(new THREE.Color(0.5, 0.47, 0.64), col.twi * (1 - col.day) * 0.8).multiplyScalar(1.2);
  hemi.groundColor.setRGB(0.85, 0.88, 0.93).multiplyScalar(0.15 + 0.85 * col.day).lerp(new THREE.Color(0.55, 0.45, 0.5), col.twi * (1 - col.day) * 0.6);
  hemi.intensity = 0.3 + 0.7 * col.day + 0.55 * col.twi;
  // ночью — свет звёзд и ночного неба: земля и снег еле видны, но не чёрные
  const nf = smooth((t - 60) / 10); // с 1:00 (первая минута уже снята без этого)
  hemi.color.r = Math.max(hemi.color.r, 0.07 * nf); hemi.color.g = Math.max(hemi.color.g, 0.085 * nf); hemi.color.b = Math.max(hemi.color.b, 0.15 * nf);
  hemi.groundColor.r = Math.max(hemi.groundColor.r, 0.05 * nf); hemi.groundColor.g = Math.max(hemi.groundColor.g, 0.055 * nf); hemi.groundColor.b = Math.max(hemi.groundColor.b, 0.08 * nf);
  const moonUp = smooth((sk.moon.y + 0.02) / 0.12);
  moonLight.position.copy(sk.moon).multiplyScalar(100);
  moonLight.intensity = 0.45 * ((1 - Math.cos(elong)) / 2) * moonUp * col.night;
  scene.fog.color.copy(col.hor);
  scene.fog.density = (1 / 200000) * air;
  hemi.intensity *= 0.15 + 0.85 * air;
  renderer.toneMappingExposure = (0.92 + 0.63 * col.night + 0.2 * col.twi) * air + 1.0 * (1 - air);

  updateSummit(summit, t, { sun: sk.sun, sunColor: sun.color.clone().multiplyScalar(smooth((alt + 0.02) / 0.06)), horizon: col.hor, zenith: col.zen, tau, seaLevel: seaAt(t), bands: smooth((t - 262) / 60), cover: cloudAt(t) + 0.08 * Math.sin(tau * 0.21) });

  // крупа: поднимается тем быстрее и гуще, чем меньше вес
  const lift = smooth((32 - weight) / 26);
  grains.visible = lift > 0.01;
  if (grains.visible) {
    const arr = grainGeo.attributes.position.array;
    const H = 14;
    GR.forEach((g, i) => {
      const yy = ((g.ph * H + (t - 428) * g.sp * (0.15 + 1.1 * lift)) % H + H) % H;
      const ground = -0.004 * g.d * g.d;
      arr[i * 3] = Math.cos(g.a) * g.d + 0.15 * Math.sin(t * 0.9 + g.wob);
      arr[i * 3 + 1] = ground + yy * yy / H * lift - 0.2;
      arr[i * 3 + 2] = Math.sin(g.a) * g.d + 0.15 * Math.cos(t * 0.7 + g.wob);
    });
    grainGeo.attributes.position.needsUpdate = true;
    grainMat.opacity = 0.85 * lift;
    grainMat.color.setRGB(1, 1, 1).multiplyScalar(0.35 + 0.65 * (col.day + 0.4 * col.twi));
  }

  const fxs = updateFx(fx, t, { sun: sk.sun, light: col.day + 0.3 * col.twi, ash: ASH });
  renderer.toneMappingExposure += fxs.flash * (0.15 + 0.5 * col.night);

  // пар изо рта
  const phase = (t % BREATH) / BREATH;
  puffs.forEach((p, i) => {
    const age = (((t - i * BREATH) % (BREATH * 3)) + BREATH * 3) % (BREATH * 3) / BREATH; // 0…3 — какой по счёту выдох
    const a = age < 1.4 ? age / 1.4 : 9;
    const show = a <= 1;
    p.visible = show;
    if (show) {
      p.position.set(0.02 * Math.sin(i * 2.1), -0.12 + 0.08 * a, -0.32 - 0.45 * a);
      p.scale.setScalar(0.08 + 0.38 * a);
      p.material.opacity = 0.2 * Math.sin(Math.PI * Math.min(1, a * 1.3)) * (0.6 + 0.4 * col.day);
    }
  });
  void phase;

  updateHud(t, { day: P, weight, speed: speedAt(t), k, sea: seaAt(t), alt: hAlt / 1000, place: t > 479 ? 'IN ORBIT' : 'CHIMBORAZO · ECUADOR' });
  // Земля целиком (после отрыва от вершины; для проверки — всегда, если задана свободная камера)
  const R = Rm;
  const a = R - 3000 * (1 - smooth((hAlt - 3e5) / 6e5)); // пока внизу подробная местность, шар чуть ниже её
  const ringGrow = smooth((t - 508) / 30);
  updatePlanet(planet, {
    visible: !!window.__cam || t > FLOAT_AT, R, a, c: Math.min(6.357e6, 6.357e6 - 0.22 * (R - 6.378e6)), cusp: Math.max(0, (R - 7.6e6) / 1.1e6) * 0.06,
    spin: -11.2 * DEG + groundShift(t), sun: sk.sun, time: t, bands: smooth((t - 240) / 200), cloud: 0.5,
    ringIn: R * 1.004, ringOut: R * (1.03 + 1.2 * ringGrow), ringDense: window.__cam?.ring ?? 0.85 * ringGrow,
    clump: 0, roche: 1.9e7, moonDir: sk.moon,
  });
  // местность вершины растворяется, когда герой выше 300–900 км
  const fadeLocal = 1 - smooth((hAlt - 3e5) / 6e5);
  local.visible = fadeLocal > 0.01;
  updateDebris(debris, t, eye, smooth((t - 466) / 10) * (1 - smooth((t - 600) / 40)) + 0.8 * smooth((t - 670) / 20) * (1 - smooth((t - 770) / 15)), 0.3 + 0.7 * smooth((sk.sun.y + 0.1) / 0.2));
  updateMoons(moons, t, new THREE.Vector3(0, -Rm, 0), smooth((t - 700) / 60), smooth((t - 650) / 12));
  if (window.__cam) {
    const c = window.__cam;
    debugCam.fov = c.fov || 40;
    debugCam.far = 2e9;
    debugCam.updateProjectionMatrix();
    debugCam.position.set(...c.pos);
    debugCam.lookAt(...c.look);
    for (const id of ['caption', 'fade']) document.getElementById(id).style.visibility = 'hidden';
    renderer.render(scene, debugCam);
    return;
  }
  if (debugView) {
    const views = { front: [0, 1.25, -2.6], side: [2.6, 1.25, 0], top: [0.01, 3.6, -0.4], back: [-1.6, 1.9, 2.0], close: [0.9, 1.45, -1.1] };
    const [x, y, z] = views[debugView];
    const v = new THREE.Vector3(x, y, z).applyAxisAngle(new THREE.Vector3(0, 1, 0), body.root.rotation.y);
    debugCam.position.copy(v);
    debugCam.lookAt(0, debugView === 'close' ? 1.25 : 1.0, 0);
    renderer.render(scene, debugCam);
    return;
  }
  renderer.render(scene, camera);
};

window.renderDebug = (t, view) => {
  debugView = view;
  for (const id of ['hud', 'caption', 'fade']) document.getElementById(id).style.visibility = 'hidden';
  window.renderAt(t);
  debugView = null;
};

window.__dbg = { scene, camera, body, renderer, sky, summit, __THREE: THREE };
window.renderAt(0);
window.ready = true;
