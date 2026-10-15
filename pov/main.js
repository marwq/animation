// «What if you kept sinking forever?» от первого лица: Таймс-сквер → люк → коллектор → трубы →
// метро → сланец → водовод → гнейс → километр вниз (первые три минуты ролика).
// Кадр рисует window.renderAt(t) — время задаёт рендер (pov/render.js), анимация детерминирована.
import * as THREE from 'three';
import { buildBody, drawGauge, poseBody } from './body.js';
import { buildCity, updateCity } from './nyc.js';
import { buildUnderground, updateUnderground } from './underground.js';
import { buildManhole, updateManhole } from './manhole.js';
import { buildRock, updateRock } from './rock.js';
import { buildHud, updateHud } from './hud.js';
import { MANHOLE, PLAYER, ROCK, SIDEWALK, SLABS, SOIL_TOP, balance, bodyYaw, check, depthAt, headPitch, headYaw, shield } from './timeline.js';
import { clamp, lerp, smooth } from './util.js';

const W = 1280;
const H = 720;
const DEG = Math.PI / 180;

// Шрифты нужны до того, как рисуются таблички улиц и экраны
await Promise.all(['700 40px "Space Grotesk"', '500 40px "Space Grotesk"', '600 40px "JetBrains Mono"'].map((f) => document.fonts.load(f)));

const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('c'), antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1);
renderer.setSize(W, H, false);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.12;

const scene = new THREE.Scene();
const DUSK = new THREE.Color(0x8e86a8);
const DIRT = new THREE.Color(0x120d0a);
const SEWER = new THREE.Color(0x0b0d0b);
const STONE = new THREE.Color(0x100e0d); // в скале; глубже, где теплее, — чуть рыжее
const WARM = new THREE.Color(0x1d110c);
const WATER = new THREE.Color(0x0a2629);
scene.fog = new THREE.Fog(DUSK, 220, 2900);

const hemi = new THREE.HemisphereLight(0xa9b8ff, 0x4d4038, 1.55);
const sun = new THREE.DirectionalLight(0xffc596, 1.1);
sun.position.set(600, 260, -700);
scene.add(hemi, sun);

const city = buildCity();
const under = buildUnderground();
const manhole = buildManhole();
const rock = buildRock();
scene.add(city.group, under.group, manhole.group, rock.group);

const body = buildBody();
scene.add(body.root);
// Чуть шире обзор, чем в первом тесте: вокруг видно больше города
const camera = new THREE.PerspectiveCamera(76, W / H, 0.03, 9000);
camera.position.set(0, 0.13, -0.03); // глаза чуть выше и впереди шеи
body.neck.add(camera);
const fill = new THREE.PointLight(0xfff1e0, 0.9, 3.5, 1.2); // мягкий свет у глаз: руки и ноги не тонут в тени
camera.add(fill);

buildHud();

// Живое покачивание головы: несколько медленных синусов с некратными частотами, без рывков
const drift = (t, a, b, c) => Math.sin(t * a) * 0.6 + Math.sin(t * b + 1.3) * 0.3 + Math.sin(t * c + 2.1) * 0.1;

// Камера для проверки анатомии со стороны: спереди, сбоку, сверху, сзади-слева
const debugCam = new THREE.PerspectiveCamera(40, W / H, 0.01, 200);
const debugLight = new THREE.DirectionalLight(0xffffff, 0);
debugCam.add(debugLight);
scene.add(debugCam);
let debugView = null;

window.renderAt = (t) => {
  const depth = depthAt(t);
  const speed = (depthAt(t + 0.05) - depthAt(t - 0.05)) / 0.1;
  body.root.position.set(PLAYER.x, SIDEWALK - depth, PLAYER.z);
  body.root.rotation.y = bodyYaw(t) * DEG;

  const sway = 1 + 1.2 * smooth((depth - 0.05) / 0.5);
  const yaw = headYaw(t);
  const yawVel = (headYaw(t + 0.02) - headYaw(t - 0.02)) / 0.04 + (bodyYaw(t + 0.02) - bodyYaw(t - 0.02)) / 0.04;
  const pitch = headPitch(t) + 0.28 * Math.sin(t * 2 * Math.PI * 0.23); // дыхание
  // голова чуть наклоняется в сторону поворота, как у живого человека
  const roll = clamp(-yawVel * 0.035, -2.5, 2.5) + 0.25 * drift(t, 0.31, 0.83, 1.7) * sway;
  body.neck.rotation.set((pitch + 0.35 * drift(t, 0.43, 1.07, 2.3) * sway) * DEG, (yaw + 0.5 * drift(t, 0.37, 0.91, 1.9) * sway) * DEG, roll * DEG);
  body.neck.position.y = 1.52 + 0.005 * Math.sin(t * 2 * Math.PI * 0.23);

  poseBody(body, t, { balance: balance(t), check: check(t), shield: shield(t) });
  drawGauge(body, depth);

  camera.updateMatrixWorld(true);
  const eye = camera.getWorldPosition(new THREE.Vector3());
  const underground = eye.y < SIDEWALK - 0.02;
  // где глаза: на площади → в шахте люка (город ещё виден сверху) → в коллекторе → в грунте
  const inShaft = underground && eye.y > MANHOLE.crown;
  const inSewer = eye.y <= MANHOLE.crown && eye.y > MANHOLE.water;
  const inSoil = eye.y <= MANHOLE.water && eye.y > ROCK.top;
  const T = ROCK.tunnel;
  const inWater = Math.abs(eye.y - T.y) < T.r_in;
  const inRock = eye.y <= ROCK.top && !inWater;
  const shaftK = smooth((SIDEWALK - eye.y) / (SIDEWALK - MANHOLE.crown));

  city.group.visible = eye.y > MANHOLE.crown;
  under.group.visible = eye.y <= MANHOLE.water && eye.y > ROCK.top - 3;
  rock.group.visible = eye.y < ROCK.top + 1;
  if (inWater) {
    // в водоводе: мутная зелёная вода, видно на несколько метров
    scene.fog.color.copy(WATER);
    scene.fog.near = 0.3;
    scene.fog.far = 9;
    scene.background = WATER;
    hemi.intensity = 0.75;
    sun.intensity = 0;
    body.glow.intensity = 1.2;
    fill.intensity = 1.2;
    fill.distance = 8;
    fill.decay = 0.7;
  } else if (inRock) {
    // в скале: темнота, свет браслета; цвета породы читаются, глубже теплеет
    scene.fog.color.copy(STONE).lerp(WARM, smooth((depth - 250) / 750));
    scene.fog.near = 1.5;
    scene.fog.far = 26;
    scene.background = scene.fog.color;
    hemi.intensity = 0.42;
    sun.intensity = 0;
    body.glow.intensity = 1.2;
    fill.intensity = 1.25;
    fill.distance = 9;
    fill.decay = 0.7;
  } else if (inSoil) {
    // грунт — темнота, свет от браслета и ламп тоннеля
    const top = SOIL_TOP;
    scene.fog.color.copy(DIRT);
    scene.fog.near = 1;
    scene.fog.far = eye.y < top - 4.8 && eye.y > top - 10.6 ? 80 : 18;
    scene.background = DIRT;
    hemi.intensity = 0.32;
    sun.intensity = 0;
    body.glow.intensity = 3;
    fill.intensity = 2.2;
    fill.distance = 3.5;
    fill.decay = 1.2;
  } else if (inSewer) {
    // коллектор: тусклые лампы в решётках, вода, туннель уходит в темноту
    scene.fog.color.copy(SEWER);
    scene.fog.near = 1.5;
    scene.fog.far = 30;
    scene.background = SEWER;
    hemi.intensity = 0.4;
    sun.intensity = 0;
    body.glow.intensity = 1.5;
    fill.intensity = 1.6;
    fill.distance = 3.5;
    fill.decay = 1.2;
  } else {
    // площадь и шахта: сумерки сверху, к низу шахты свет гаснет
    scene.fog.color.copy(DUSK);
    scene.fog.near = 220;
    scene.fog.far = 2900;
    scene.background = null;
    hemi.intensity = lerp(1.55, 0.75, inShaft ? shaftK : 0);
    sun.intensity = lerp(1.1, 0.3, inShaft ? shaftK : 0);
    body.glow.intensity = 1.5 * smooth((depth - 1.4) / 0.8);
    fill.intensity = lerp(0.9, 1.5, inShaft ? shaftK : 0);
    fill.distance = 3.5;
    fill.decay = 1.2;
  }

  // сквозь сплошное перекрытие или поверхность воды глаза проходят в темноте: кадр на миг гаснет
  let through = 0;
  const margin = Math.max(0.08, Math.abs(speed) * 0.14);
  for (const [top, bottom] of SLABS) {
    const dist = eye.y > top ? eye.y - top : eye.y < bottom ? bottom - eye.y : 0;
    through = Math.max(through, 0.96 * (1 - smooth(dist / margin)));
  }

  updateCity(city, t, depth, eye);
  updateManhole(manhole, t, depth, eye);
  updateUnderground(under, t);
  if (rock.group.visible) updateRock(rock, t, eye, speed);
  updateHud(t, depth, underground, through);
  if (debugView) {
    const views = { front: [0, 1.25, -2.6], side: [2.6, 1.25, 0], top: [0.01, 3.6, -0.4], back: [-1.6, 1.9, 2.0], left: [-2.6, 1.25, -0.3], close: [0.9, 1.45, -1.1] };
    const [x, y, z] = views[debugView];
    const root = body.root.position;
    debugCam.position.set(root.x + x, root.y + y, root.z + z);
    debugCam.lookAt(root.x, root.y + (debugView === 'close' ? 1.25 : 1.0), root.z);
    debugLight.intensity = 2.2;
    const city = scene.fog.far;
    scene.fog.far = Math.max(scene.fog.far, 60);
    renderer.render(scene, debugCam);
    scene.fog.far = city;
    debugLight.intensity = 0;
    return;
  }
  renderer.render(scene, camera);
};

// Вид со стороны для проверки поз (render.js --debug): HUD прячем
window.renderDebug = (t, view) => {
  debugView = view;
  document.getElementById('hud').style.visibility = 'hidden';
  document.getElementById('caption').style.visibility = 'hidden';
  document.getElementById('fade').style.visibility = 'hidden';
  window.renderAt(t);
  debugView = null;
};

window.renderAt(0);
window.ready = true;
