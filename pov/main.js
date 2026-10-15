// Тест стиля «от первого лица»: «What if you kept sinking forever?», первые 25 секунд, Таймс-сквер.
// Кадр рисует window.renderAt(t) — время задаёт рендер (pov/render.js), анимация детерминирована.
import * as THREE from 'three';
import { buildBody, drawGauge, poseBody } from './body.js';
import { buildCity, updateCity } from './nyc.js';
import { buildUnderground, updateUnderground } from './underground.js';
import { buildHud, updateHud } from './hud.js';
import { PLAYER, SIDEWALK, balance, bodyYaw, check, depthAt, headPitch, headYaw, shield } from './timeline.js';
import { clamp, smooth } from './util.js';

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
scene.fog = new THREE.Fog(DUSK, 220, 2900);

const hemi = new THREE.HemisphereLight(0xa9b8ff, 0x4d4038, 1.55);
const sun = new THREE.DirectionalLight(0xffc596, 1.1);
sun.position.set(600, 260, -700);
scene.add(hemi, sun);

const city = buildCity();
const under = buildUnderground();
scene.add(city.group, under.group);

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

  // над землёй — сумерки и город; под землёй — темнота, свет от браслета и ламп тоннеля
  city.group.visible = eye.y > -1.0;
  under.group.visible = eye.y < 0.6;
  scene.fog.color.copy(underground ? DIRT : DUSK);
  scene.fog.near = underground ? 1 : 220;
  scene.fog.far = underground ? (eye.y < -4.8 && eye.y > -10.6 ? 80 : 18) : 2900;
  scene.background = underground ? DIRT : null;
  hemi.intensity = underground ? 0.32 : 1.55;
  sun.intensity = underground ? 0 : 1.1;
  body.glow.intensity = 9 * smooth((depth - 1.4) / 0.8);
  fill.intensity = underground ? 2.2 : 0.9;

  updateCity(city, t, depth, eye);
  updateUnderground(under, t);
  updateHud(t, depth, underground);
  renderer.render(scene, camera);
};

window.renderAt(0);
window.ready = true;
