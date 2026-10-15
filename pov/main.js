// Тест стиля «от первого лица»: «What if you kept sinking forever?», первые 30 секунд, Таймс-сквер.
// Кадр рисует window.renderAt(t) — время задаёт рендер (pov/render.js), анимация детерминирована.
import * as THREE from 'three';
import { buildBody, drawGauge, poseBody } from './body.js';
import { buildCity, updateCity } from './nyc.js';
import { buildUnderground, updateUnderground } from './underground.js';
import { buildManhole, updateManhole } from './manhole.js';
import { buildHud, updateHud } from './hud.js';
import { MANHOLE, PLAYER, SIDEWALK, SOIL_TOP, balance, bodyYaw, check, depthAt, headPitch, headYaw, shield } from './timeline.js';
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
scene.fog = new THREE.Fog(DUSK, 220, 2900);

const hemi = new THREE.HemisphereLight(0xa9b8ff, 0x4d4038, 1.55);
const sun = new THREE.DirectionalLight(0xffc596, 1.1);
sun.position.set(600, 260, -700);
scene.add(hemi, sun);

const city = buildCity();
const under = buildUnderground();
const manhole = buildManhole();
scene.add(city.group, under.group, manhole.group);

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

window.renderAt = (t) => {
  const depth = depthAt(t);
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
  const inSoil = eye.y <= MANHOLE.water;
  const shaftK = smooth((SIDEWALK - eye.y) / (SIDEWALK - MANHOLE.crown));

  city.group.visible = eye.y > MANHOLE.crown;
  under.group.visible = inSoil;
  if (inSoil) {
    // грунт — темнота, свет от браслета и ламп тоннеля
    const top = SOIL_TOP;
    scene.fog.color.copy(DIRT);
    scene.fog.near = 1;
    scene.fog.far = eye.y < top - 4.8 && eye.y > top - 10.6 ? 80 : 18;
    scene.background = DIRT;
    hemi.intensity = 0.32;
    sun.intensity = 0;
    body.glow.intensity = 9;
    fill.intensity = 2.2;
  } else if (inSewer) {
    // коллектор: тусклые лампы в решётках, вода, туннель уходит в темноту
    scene.fog.color.copy(SEWER);
    scene.fog.near = 1.5;
    scene.fog.far = 30;
    scene.background = SEWER;
    hemi.intensity = 0.4;
    sun.intensity = 0;
    body.glow.intensity = 3;
    fill.intensity = 1.6;
  } else {
    // площадь и шахта: сумерки сверху, к низу шахты свет гаснет
    scene.fog.color.copy(DUSK);
    scene.fog.near = 220;
    scene.fog.far = 2900;
    scene.background = null;
    hemi.intensity = lerp(1.55, 0.75, inShaft ? shaftK : 0);
    sun.intensity = lerp(1.1, 0.3, inShaft ? shaftK : 0);
    body.glow.intensity = 2.5 * smooth((depth - 1.4) / 0.8);
    fill.intensity = lerp(0.9, 1.5, inShaft ? shaftK : 0);
  }

  updateCity(city, t, depth, eye);
  updateManhole(manhole, t, depth, eye);
  updateUnderground(under, t);
  updateHud(t, depth, underground);
  renderer.render(scene, camera);
};

window.renderAt(0);
window.ready = true;
