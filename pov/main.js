// Тест стиля «от первого лица»: «What if you kept sinking forever?», первые 25 секунд.
// Кадр рисует window.renderAt(t) — время задаёт рендер (pov/render.js), анимация детерминирована.
import * as THREE from 'three';
import { buildBody, drawGauge, poseBody } from './body.js';
import { buildCity, updateCity } from './city.js';
import { buildUnderground, updateUnderground } from './underground.js';
import { buildHud, updateHud } from './hud.js';
import { BALANCE, CHECK, PITCH, PLAYER, SHIELD, SIDEWALK, YAW, depthAt } from './timeline.js';
import { keyed, smooth } from './util.js';

const W = 1280;
const H = 720;
const DEG = Math.PI / 180;

const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('c'), antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1);
renderer.setSize(W, H, false);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;

const scene = new THREE.Scene();
const DUSK = new THREE.Color(0x8a7f9e);
const DIRT = new THREE.Color(0x120d0a);
scene.fog = new THREE.Fog(DUSK, 60, 480);

const hemi = new THREE.HemisphereLight(0x9aa8ff, 0x3a2f2a, 1.1);
const sun = new THREE.DirectionalLight(0xffb37a, 1.3);
sun.position.set(-60, 40, -200);
scene.add(hemi, sun);

const city = buildCity();
const under = buildUnderground();
scene.add(city.group, under.group);

const body = buildBody();
scene.add(body.root);
const camera = new THREE.PerspectiveCamera(72, W / H, 0.03, 1600);
camera.position.set(0, 0.13, -0.03); // глаза чуть выше и впереди шеи
body.neck.add(camera);
const fill = new THREE.PointLight(0xfff1e0, 0.9, 3.5, 1.2); // «заполняющий» свет у глаз: руки и ноги не проваливаются в тень
camera.add(fill);

buildHud();

window.renderAt = (t) => {
  const depth = depthAt(t);
  body.root.position.set(PLAYER.x, SIDEWALK - depth, PLAYER.z);

  // голова: ключевые повороты + лёгкое «живое» покачивание, сильнее — когда проваливаемся
  const sway = 1 + 1.5 * smooth((depth - 0.05) / 0.5);
  const yaw = keyed(YAW, t) + (0.5 * Math.sin(t * 0.7) + 0.3 * Math.sin(t * 1.9 + 1)) * sway;
  const pitch = keyed(PITCH, t) + 0.4 * Math.sin(t * 0.9 + 2) * sway;
  body.neck.rotation.set(pitch * DEG, yaw * DEG, 0.25 * Math.sin(t * 0.5) * DEG * sway);
  body.neck.position.y = 1.52 + 0.008 * Math.sin(t * 1.6);

  poseBody(body, t, { balance: keyed(BALANCE, t), check: keyed(CHECK, t), shield: keyed(SHIELD, t) });
  drawGauge(body, depth);

  camera.updateMatrixWorld(true);
  const eye = camera.getWorldPosition(new THREE.Vector3());
  const underground = eye.y < SIDEWALK - 0.02;

  // над землёй — сумерки и город; под землёй — темнота, свет только от браслета и ламп тоннеля
  city.group.visible = eye.y > -1.0;
  under.group.visible = eye.y < 0.6;
  scene.fog.color.copy(underground ? DIRT : DUSK);
  scene.fog.near = underground ? 0.5 : 60;
  scene.fog.far = underground ? (eye.y < -4.8 && eye.y > -10.4 ? 70 : 12) : 480;
  scene.background = underground ? DIRT : null;
  hemi.intensity = underground ? 0.18 : 1.1;
  sun.intensity = underground ? 0 : 1.3;
  body.glow.intensity = 9 * smooth((depth - 1.4) / 0.8);
  fill.intensity = underground ? 2.0 : 0.9;

  updateCity(city, t, depth, eye);
  updateUnderground(under, t);
  updateHud(t, depth, underground);
  renderer.render(scene, camera);
};

document.fonts.ready.then(() => {
  window.renderAt(0);
  window.ready = true;
});
