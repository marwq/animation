// «What If Earth Spun Faster and Faster?» — вид от первого лица с вершины Чимборасо. Время ускорено, и Земля
// при этом крутится всё быстрее: Солнце пролетает по небу всё чаще, звёзды тянутся в дуги.
import * as THREE from 'three';
import { buildBody, drawGauge, poseBody } from './body.js';
import { buildHud, updateHud } from './hud.js';
import { buildSky, skyDir, updateSky } from './sky.js';
import { buildSummit, updateSummit } from './summit.js';
import { buildFx, updateFx } from './fx.js';
import { buildPlanet, updatePlanet } from './planet.js';
import { MOON, buildDebris, buildMoonSurface, buildMoons, buildRoche, moonCenter, moonDir, updateDebris, updateMoons } from './space.js';
import {
  APPROACH_START, CAM3_START, FLOAT_AT, JUMPS, LAND_AT, LAT, LOOK3, LOOK_MOON, RING, approachH, cam3, groundShift, heroAlt, moonA, balance, bodyYaw, cloudAt, seaAt, shakeAt, check, dayLength, floatW, headPitch, headYaw, radiusAt, shield, solarHours, speedAt, tauAt, timelapse, weightAt,
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

// место посадки на новой луне: Земля над горизонтом на ~35°, подлёт — со стороны, где герой в 762 с
const LAND = (() => {
  const C0 = new THREE.Vector3(0, -8.588e6, 0);
  const M0 = moonCenter(C0);
  const [rk, ik, lk] = cam3(APPROACH_START);
  const P0 = new THREE.Vector3(Math.sin(lk * DEG) * Math.cos(ik * DEG), Math.cos(lk * DEG) * Math.cos(ik * DEG), -Math.sin(ik * DEG)).multiplyScalar(rk * 1000).add(C0);
  const e = C0.clone().sub(M0).normalize(); // на Землю
  const d0 = P0.clone().sub(M0).normalize();
  // Солнце в космосе неподвижно (см. story.py SUN_FREEZE)
  const sunW = skyDir(-0.3 * DEG, ((solarHours(520) - 12) / 24) * Math.PI * 2, LAT * DEG);
  // «верх» места посадки — между направлением на Землю и осью колец (тогда кольцо и экватор Земли лежат
  // поперёк неба), с поворотом к Солнцу, пока Солнце не поднимется хотя бы на 25°
  // «верх» места посадки — между направлением на Землю и осью колец: кольцо и экватор Земли лежат поперёк неба
  const N = new THREE.Vector3(0, 0, -1);
  const n = e.clone().multiplyScalar(Math.cos(55 * DEG)).add(N.clone().multiplyScalar(Math.sin(55 * DEG))).normalize();
  // Солнце в космосе: на 23° над плоскостью колец (как в солнцестояние), сбоку от Земли — Земля освещена
  // наполовину с небольшим, над местом посадки Солнце низко (длинные тени)
  const tt = N.clone().cross(e).normalize();
  const dl = 23.4 * DEG;
  const cf = 0.1 / Math.cos(dl);
  const sunSpace = e.clone().negate().multiplyScalar(cf).add(tt.multiplyScalar(Math.sqrt(1 - cf * cf))).multiplyScalar(Math.cos(dl)).add(N.clone().multiplyScalar(Math.sin(dl))).normalize();
  // старая Луна: с места посадки — левее Земли и ниже, над горизонтом (направление от центра Земли почти то же)
  const fwd = e.clone().sub(n.clone().multiplyScalar(e.dot(n))).normalize();
  const right = fwd.clone().cross(n);
  // с той стороны от Земли, где Луна освещена почти полностью (Солнце за спиной у смотрящего на неё)
  const om = (sg) => fwd.clone().multiplyScalar(Math.cos(62 * DEG) * Math.cos(16 * DEG)).add(right.clone().multiplyScalar(sg * Math.sin(62 * DEG) * Math.cos(16 * DEG))).add(n.clone().multiplyScalar(Math.sin(16 * DEG))).normalize();
  const oldMoon = om(1).dot(sunSpace) < om(-1).dot(sunSpace) ? om(1) : om(-1);
  return { n, d0, e, sunW, sunSpace, oldMoon };
})();
const moons = buildMoons(LAND.n);
const surface = buildMoonSurface(MOON.R);
surface.group.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), LAND.n);
const roche = buildRoche(1.9e7);
scene.add(sky.group, pivot, planet.group, debris.group, moons.group, surface.group, roche.group);

// взгляд в космосе: направление на цель и «верх» (от Земли, а когда смотрим на Землю — на север)
const NORTH = new THREE.Vector3(0, 0, -1);
const _m = new THREE.Matrix4();
let t_now = 0;
function lookTarget(name, eye, C, lonRad) {
  switch (name) {
    case 'planet': return C.clone();
    case 'ring': return new THREE.Vector3(Math.sin(lonRad), Math.cos(lonRad), 0).multiplyScalar(1.5e7).add(C);
    case 'moon': return moonCenter(C, new THREE.Vector3(), moonA(t_now));
    case 'moonlets': return moonCenter(C, new THREE.Vector3(), moonA(t_now)).multiplyScalar(0.7).add(C.clone().multiplyScalar(0.3));
    case 'roche': return new THREE.Vector3(Math.sin(lonRad + 0.5), Math.cos(lonRad + 0.5), 0).multiplyScalar(1.9e7).add(C);
    case 'oldmoon': return LAND.oldMoon.clone().multiplyScalar(3.844e8).add(C);
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
// на луне: тело стоит (верх — от центра луны), взгляд на цель — поворотом головы и корпуса
function moonLookAngles(name, eye, C, M) {
  const up = LAND.n;
  const fwd = LAND.e.clone().sub(up.clone().multiplyScalar(LAND.e.dot(up))).normalize(); // к Земле по горизонту
  const right = fwd.clone().cross(up);
  let dir;
  switch (name) {
    case 'earth': dir = C.clone().sub(eye).normalize(); break;
    case 'ring': dir = new THREE.Vector3(0.0, 0.0, 0.0).add(C).add(new THREE.Vector3(0, 1.3e7, 0)).sub(eye).normalize(); break;
    case 'oldmoon': dir = LAND.oldMoon.clone().multiplyScalar(3.844e8).add(C).sub(eye).normalize(); break;
    case 'ground': dir = fwd.clone().multiplyScalar(0.8).add(up.clone().multiplyScalar(-0.6)).normalize(); break;
    default: dir = fwd.clone();
  }
  const yaw = Math.atan2(-dir.dot(right), dir.dot(fwd)) / DEG; // + влево
  const pitch = Math.asin(clamp(dir.dot(up), -1, 1)) / DEG;
  return { yaw, pitch, fwd, up, right };
}
function moonLook(t, eye, C, M) {
  let i = LOOK_MOON.findIndex(([a]) => t < a);
  if (i === -1) i = LOOK_MOON.length;
  const cur = LOOK_MOON[Math.max(0, i - 1)];
  const a0 = moonLookAngles(cur[2], eye, C, M);
  let yaw = a0.yaw + cur[3];
  let pitch = a0.pitch + cur[4];
  if (i > 0 && i < LOOK_MOON.length && t > cur[1]) {
    const nxt = LOOK_MOON[i];
    const a1 = moonLookAngles(nxt[2], eye, C, M);
    const u = smooth((t - cur[1]) / (nxt[0] - cur[1]));
    let dy = a1.yaw + nxt[3] - yaw;
    dy = ((dy + 540) % 360) - 180;
    yaw += dy * u;
    pitch += (a1.pitch + nxt[4] - pitch) * u;
  }
  return { yaw, pitch, frame: a0 };
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
const grainMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.07, transparent: true, opacity: 0, depthWrite: false });
const grains = new THREE.Points(grainGeo, grainMat);
grains.frustumCulled = false;
local.add(grains);
const GR = (() => {
  const r = rng(404);
  return Array.from({ length: GRAINS }, () => ({ a: r() * Math.PI * 2, d: 0.4 + r() ** 1.5 * 20, ph: r(), sp: 0.5 + r(), wob: r() * 6 }));
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

const TAU500 = tauAt(500);
const MOON0 = 62 * DEG; // элонгация Луны в начале: молодая Луна вечером; растёт на 12,19° в сутки (по времени, не по вращению)

window.renderAt = (t) => {
  const tau = tauAt(t);
  const P = dayLength(t);
  const k = timelapse(t);
  const solar = solarHours(t);
  const Hsun = ((solar - 12) / 24) * Math.PI * 2;
  const tauSky = Math.min(tau, TAU500); // в космосе небо не вращается (при годах в секунду звёзды бы мелькали)
  const sidereal = Hsun + (tauSky / 24 / 365.25) * Math.PI * 2 + 2.1;
  const elong = MOON0 + (tauSky / 24) * 12.19 * DEG;
  const rate = (k / P) * Math.PI * 2; // рад неба за секунду ролика

  // герой: корпус, голова (сплайн + пружина + живое покачивание), позы рук
  // землетрясение: корпус качается (низкие частоты), голова дрожит (высокие)
  const sh = shakeAt(t);
  const jig = (f, ph) => Math.sin(t * f + ph) * 0.6 + Math.sin(t * f * 1.73 + ph * 2.1) * 0.4;
  body.root.position.set(sh * 0.05 * jig(17, 0.3), sh * 0.03 * jig(23, 1.1) + jumpY(t) + heroAlt(t), sh * 0.05 * jig(19, 2.2));
  if (t > 512 && t < CAM3_START) {
    // столкновения в кольце понемногу выводят героя из его плоскости (к северу)
    const inc = 1.5 * DEG * smooth((t - 512) / 28);
    const rr = radiusAt(t) * 1000 + heroAlt(t);
    body.root.position.y = rr * Math.cos(inc) - radiusAt(t) * 1000;
    body.root.position.z = -rr * Math.sin(inc);
  }
  body.root.rotation.set(0, bodyYaw(t) * DEG, sh * 0.02 * jig(11, 0.7));
  const yaw = headYaw(t);
  const yawVel = (headYaw(t + 0.02) - headYaw(t - 0.02)) / 0.04;
  const breath = Math.sin((t / BREATH) * Math.PI * 2);
  const pitch = headPitch(t) + 0.45 * breath;
  const roll = clamp(-yawVel * 0.035, -2.5, 2.5) + 0.3 * drift(t, 0.31, 0.83, 1.7);
  body.neck.rotation.set((pitch + 0.5 * drift(t, 0.43, 1.07, 2.3) + sh * 1.6 * jig(31, 0.5)) * DEG, (yaw + 0.6 * drift(t, 0.37, 0.91, 1.9) + sh * 1.2 * jig(27, 1.9)) * DEG, (roll + sh * 1.4 * jig(29, 2.7)) * DEG);
  body.neck.position.y = 1.52 + 0.006 * breath;
  // в невесомости корпус поворачивается вслед за взглядом (как у парашютиста): смотришь вниз — лежишь
  // на животе, и собственная куртка не закрывает Землю; шея поворачивается лишь немного
  const wFloat = smooth((t - FLOAT_AT) / 2.5);
  if (wFloat > 0) {
    const ny = body.neck.rotation.y;
    const nx = body.neck.rotation.x;
    const qDes = body.root.quaternion.clone().multiply(body.neck.quaternion);
    const lim = (v, a, b) => v + (clamp(v, a, b) - v) * wFloat;
    body.neck.rotation.set(lim(nx, -28 * DEG, 18 * DEG), lim(ny, -45 * DEG, 45 * DEG), body.neck.rotation.z);
    const qRoot = qDes.multiply(body.neck.quaternion.clone().invert());
    body.root.quaternion.slerp(qRoot, wFloat);
  }
  // космос: герой на орбите по ключам cam3, взгляд — на цель (плавно сменяет управление головой). У луны все
  // координаты сдвигаются так, чтобы место посадки было в начале (точность float32 рядом с камерой)
  t_now = t;
  const Rm0 = radiusAt(t) * 1000;
  const C00 = new THREE.Vector3(0, -Rm0, 0);
  const M00 = moonCenter(C00, new THREE.Vector3(), moonA(t));
  const LANDP = M00.clone().add(LAND.n.clone().multiplyScalar(MOON.R));
  const O = t >= APPROACH_START ? LANDP : new THREE.Vector3();
  const C = C00.clone().sub(O);
  const Mc = M00.clone().sub(O);
  let lonRad = 0;
  if (t >= CAM3_START) {
    const [rk, ik, lk] = cam3(t);
    lonRad = lk * DEG;
    const ir = ik * DEG;
    body.root.position.set(Math.sin(lonRad) * Math.cos(ir), Math.cos(lonRad) * Math.cos(ir), -Math.sin(ir)).multiplyScalar(rk * 1000).add(C);
  }
  if (t >= APPROACH_START) {
    // подлёт: от точки на орбите — к месту посадки, по высоте над поверхностью луны
    const [rk, ik, lk] = cam3(APPROACH_START);
    const P0 = new THREE.Vector3(Math.sin(lk * DEG) * Math.cos(ik * DEG), Math.cos(lk * DEG) * Math.cos(ik * DEG), -Math.sin(ik * DEG)).multiplyScalar(rk * 1000).add(C);
    const h0 = P0.distanceTo(Mc) - MOON.R;
    const sc = lerp(h0 / approachH(APPROACH_START), 1, smooth((t - APPROACH_START) / 22));
    const dir = LAND.d0.clone().lerp(LAND.n, smooth((t - APPROACH_START) / 30)).normalize();
    body.root.position.copy(dir.multiplyScalar(MOON.R + approachH(t) * sc)).add(Mc);
  }
  const wSpace = smooth((t - (CAM3_START - 2)) / 8);
  if (wSpace > 0) {
    body.root.updateMatrixWorld(true);
    const qNeck = body.neck.quaternion.clone();
    const qCamSummit = body.root.quaternion.clone().multiply(qNeck);
    const eye0 = body.root.position.clone().add(new THREE.Vector3(0, 1.6, 0));
    const qSpace = spaceQuat(t, eye0, C, lonRad);
    if (qSpace) {
      let qCam = qCamSummit.slerp(qSpace, wSpace);
      // посадка: тело встаёт на ноги (верх — от центра луны), смотрим по ключам LOOK_MOON
      const wLand = smooth((t - (LAND_AT - 5)) / 5);
      if (wLand > 0) {
        const eye1 = body.root.position.clone().add(LAND.n.clone().multiplyScalar(1.6));
        const lk = moonLook(t, eye1, C, Mc);
        const f = lk.frame;
        const qBody = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(f.right, f.up, f.fwd.clone().negate()));
        const qN = new THREE.Quaternion().setFromEuler(new THREE.Euler((lk.pitch + 0.4 * Math.sin(t * 0.5)) * DEG, lk.yaw * DEG, 0, 'YXZ'));
        qCam = qCam.slerp(qBody.clone().multiply(qN), wLand);
        if (wLand >= 1) {
          body.root.quaternion.copy(qBody);
          body.neck.quaternion.copy(qN);
        } else {
          body.root.quaternion.copy(qCam.clone().multiply(qNeck.clone().invert()));
        }
      } else {
        body.root.quaternion.copy(qCam.multiply(qNeck.invert()));
      }
    }
  }
  poseBody(body, t, { balance: balance(t), check: check(t), shield: shield(t), float: floatW(t) * (1 - smooth((t - LAND_AT + 1.5) / 2.5)), tread: 0 });
  const weight = t >= LAND_AT - 0.3 ? 7.8 * smooth((t - LAND_AT + 0.3) / 0.6) : weightAt(t);
  drawGauge(body, weight);
  camera.updateMatrixWorld(true);
  const eye = camera.getWorldPosition(new THREE.Vector3());

  // после отрыва: поверхность уезжает на восток, воздух под героем редеет
  const Rm = radiusAt(t) * 1000;
  const hAlt = t >= CAM3_START ? body.root.position.distanceTo(C) - Rm : heroAlt(t);
  const air = 1 - smooth((hAlt - 12000) / 50000);
  pivot.position.set(0, -Rm, 0);
  local.position.set(0, Rm, 0);
  pivot.rotation.z = -groundShift(t);
  if (t > FLOAT_AT && camera.far < 1e9) {
    camera.far = 2e9;
    camera.updateProjectionMatrix();
  }

  // небо и свет
  // в космосе Солнце плавно переходит в положение, выбранное для сцен у кольца и на луне
  const sunOv = t > 505 ? LAND.sunW.clone().lerp(LAND.sunSpace, smooth((t - 505) / 35)).normalize() : null;
  const sk = updateSky(sky, eye, Hsun, sidereal, elong, LAT * DEG, rate * air * (t > 488 ? 1 - smooth((t - 488.2) / 12) : 1), air, sunOv);
  const sy = sk.sun.y;
  const col = skyColors(sy);
  const alt = Math.asin(clamp(sy, -1, 1));
  sun.position.copy(sk.sun).multiplyScalar(100).add(body.root.position);
  sun.target.position.copy(body.root.position);
  sun.intensity = t > 505 ? 3.3 : 2.8 * smooth((alt + 0.01) / 0.07); // в космосе высота над «горизонтом вершины» не важна
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

  updateSummit(summit, t, { sun: sk.sun, sunColor: sun.color.clone().multiplyScalar(smooth((alt + 0.02) / 0.06)), horizon: col.hor, zenith: col.zen, tau, seaLevel: seaAt(t), bands: smooth((t - 240) / 35), cover: cloudAt(t) + 0.08 * Math.sin(tau * 0.21) });

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
    grainMat.opacity = Math.min(1, 1.2 * lift);
    grainMat.color.setRGB(1, 1, 1).multiplyScalar(0.35 + 0.65 * (col.day + 0.4 * col.twi));
  }

  const fxs = updateFx(fx, t, { sun: sk.sun, light: col.day + 0.3 * col.twi, ash: ASH });
  renderer.toneMappingExposure += fxs.flash * (0.15 + 0.5 * col.night);

  // пар изо рта
  const phase = (t % BREATH) / BREATH;
  puffs.forEach((p, i) => {
    const age = (((t - i * BREATH) % (BREATH * 3)) + BREATH * 3) % (BREATH * 3) / BREATH; // 0…3 — какой по счёту выдох
    const a = age < 1.4 ? age / 1.4 : 9;
    const show = a <= 1 && t < FLOAT_AT + 1.5; // в невесомости облачко пара перед глазами мешает
    p.visible = show;
    if (show) {
      p.position.set(0.02 * Math.sin(i * 2.1), -0.12 + 0.08 * a, -0.32 - 0.45 * a);
      p.scale.setScalar(0.08 + 0.38 * a);
      p.material.opacity = 0.2 * Math.sin(Math.PI * Math.min(1, a * 1.3)) * (0.6 + 0.4 * col.day);
    }
  });
  void phase;

  // разглядываем старую Луну: взгляд «сосредотачивается» (поле зрения сужается)
  const focus = (smooth((t - 827.2) / 1.6) * (1 - smooth((t - 833.4) / 1.6))) + (smooth((t - 879) / 1.6) * (1 - smooth((t - 889) / 1.6)));
  const fov = 76 - 34 * focus;
  if (Math.abs(camera.fov - fov) > 1e-3) {
    camera.fov = fov;
    camera.updateProjectionMatrix();
  }
  let row2 = null;
  if (t >= LAND_AT) row2 = ['EARTH DISTANCE', `${Math.round(moonA(t) / 1000).toLocaleString('en-US')} km`];
  else if (t >= APPROACH_START + 4) {
    const hm = body.root.position.distanceTo(Mc) - MOON.R;
    row2 = ['TO THE SURFACE', hm > 2000 ? `${Math.round(hm / 1000).toLocaleString('en-US')} km` : `${Math.max(0, Math.round(hm)).toLocaleString('en-US')} m`];
  }
  const place = t >= LAND_AT - 1 ? 'NEW MOON' : t > 479 ? 'IN ORBIT' : 'CHIMBORAZO · ECUADOR';
  updateHud(t, { day: P, weight, speed: speedAt(t), k, sea: seaAt(t), alt: hAlt / 1000, place, row2 });
  // Земля целиком (после отрыва от вершины; для проверки — всегда, если задана свободная камера)
  const R = Rm;
  const a = R - 3000 * (1 - smooth((hAlt - 3e5) / 6e5)); // пока внизу подробная местность, шар чуть ниже её
  // кольцо: растёт до предела Роша, потом расползается за него и рвётся на комки, внутреннее редеет; в конце исчезает
  const rg = RING;
  const ringGrow = smooth((t - rg.grow[0]) / (rg.grow[1] - rg.grow[0]));
  const ringSpread = smooth((t - rg.spread[0]) / (rg.spread[1] - rg.spread[0]));
  const ringFade = smooth((t - rg.fade[0]) / (rg.fade[1] - rg.fade[0]));
  const ringGone = smooth((t - rg.gone[0]) / (rg.gone[1] - rg.gone[0]));
  const roR = 1.9e7;
  updatePlanet(planet, {
    visible: !!window.__cam || t > FLOAT_AT, center: C, R, a, c: Math.min(6.357e6, 6.357e6 - 0.22 * (R - 6.378e6)), cusp: Math.max(0, (R - 7.6e6) / 1.1e6) * 0.06,
    spin: -11.2 * DEG + groundShift(t), sun: sk.sun, time: t, bands: smooth((t - 240) / 200), cloud: 0.5,
    ringIn: R * 1.004, ringOut: R * 1.03 + (roR - R * 1.03) * ringGrow + 0.9e7 * ringSpread * (1 - ringFade * 0.6),
    ringDense: window.__cam?.ring ?? 0.85 * ringGrow * (1 - 0.55 * ringFade) * (1 - ringGone),
    clump: ringSpread, roche: roR, moonDir: t > 505 ? LAND.oldMoon : sk.moon, atmo: 1,
  });
  roche.group.position.copy(C);
  const rocheOn = smooth((t - 617) / 2) * (1 - smooth((t - 661) / 3));
  roche.group.visible = rocheOn > 0.01;
  roche.line.material.opacity = 0.75 * rocheOn;
  roche.label.material.opacity = rocheOn;
  if (roche.group.visible) {
    const lp = new THREE.Vector3(Math.sin(lonRad + 0.62), Math.cos(lonRad + 0.62), 0).multiplyScalar(roR);
    roche.label.position.copy(lp).add(new THREE.Vector3(0, 0, -6e5));
    const dl = roche.label.getWorldPosition(new THREE.Vector3()).distanceTo(eye);
    roche.label.scale.set(dl * 0.09, dl * 0.017, 1);
  }
  // местность вершины растворяется, когда герой выше 300–900 км
  const fadeLocal = 1 - smooth((hAlt - 3e5) / 6e5);
  local.visible = fadeLocal > 0.01;
  updateDebris(debris, t, eye, smooth((t - 466) / 10) * (1 - smooth((t - 600) / 40)) + 0.8 * smooth((t - 670) / 20) * (1 - smooth((t - 770) / 15)), 0.3 + 0.7 * smooth((sk.sun.y + 0.1) / 0.2));
  updateMoons(moons, t, C, smooth((t - 698) / 60), smooth((t - 650) / 12) * (1 - smooth((t - 770) / 10)), Mc);
  // поверхность новой луны рядом с местом посадки
  surface.group.position.copy(LANDP).sub(O);
  surface.group.visible = t >= APPROACH_START && approachH(t) < 6e4;
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
