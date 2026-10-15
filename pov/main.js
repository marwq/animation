// «What if you kept sinking forever?» от первого лица: Таймс-сквер → люк → коллектор → трубы →
// метро → сланец → водовод → гнейс → километр вниз (первые три минуты ролика).
// Кадр рисует window.renderAt(t) — время задаёт рендер (pov/render.js), анимация детерминирована.
import * as THREE from 'three';
import { buildBody, drawGauge, poseBody } from './body.js';
import { buildCity, updateCity } from './nyc.js';
import { buildUnderground, updateUnderground } from './underground.js';
import { buildManhole, updateManhole } from './manhole.js';
import { buildRock, updateRock } from './rock.js';
import { HANDOFF, buildDeep, updateDeep } from './deep.js';
import { FAULT } from './sights.js';
import { buildHud, updateHud } from './hud.js';
import { EARTH, MANHOLE, PLAYER, ROCK, SIDEWALK, SLABS, SOIL_TOP, balance, bodyYaw, check, depthAt, floatW, headPitch, headYaw, shield, treadW } from './timeline.js';
import { clamp, lerp, smooth } from './util.js';

const W = 1280;
const H = 720;
const DEG = Math.PI / 180;

// Шрифты нужны до того, как рисуются таблички улиц и экраны
await Promise.all(['700 40px "Space Grotesk"', '500 40px "Space Grotesk"', '600 40px "JetBrains Mono"'].map((f) => document.fonts.load(f)));

const QS = new URLSearchParams(location.search);
const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('c'), antialias: QS.get('aa') !== '0', preserveDrawingBuffer: true });
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
const WATER = new THREE.Color(0x12383a); // мутная вода водовода: зеленоватая, не чёрная
scene.fog = new THREE.Fog(DUSK, 220, 2900);

const hemi = new THREE.HemisphereLight(0xa9b8ff, 0x4d4038, 1.55);
const sun = new THREE.DirectionalLight(0xffc596, 1.1);
sun.position.set(600, 260, -700);
scene.add(hemi, sun);

const city = buildCity();
const under = buildUnderground();
const manhole = buildManhole();
const rock = buildRock();
const deep = buildDeep();
scene.add(city.group, under.group, manhole.group, rock.group, deep.group);
const HEMI_SKY = new THREE.Color(0xa9b8ff);
const HEMI_GROUND = new THREE.Color(0x4d4038);
const COOL = new THREE.Color(0xa9b8ff);
const WARMLIGHT = new THREE.Color(0xffe2c4);

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


// --- свет и туман зон выше километра ------------------------------------------------------------
const MURK = new THREE.Color(0x1b1e13); // мутная вода коллектора: глаза уходят под воду и в ил
const ENV_KEYS = ['near', 'far', 'hemi', 'sun', 'glow', 'fillI', 'fillD', 'fillDecay'];
function zoneEnv(zone, depth, shaft) {
  switch (zone) {
    case 'street':
      return { fog: DUSK, bg: null, near: 220, far: 2900, hemi: lerp(1.55, 0.75, shaft), sun: lerp(1.1, 0.3, shaft), glow: 1.5 * smooth((depth - 1.4) / 0.8), fillI: lerp(0.9, 1.5, shaft), fillD: 3.5, fillDecay: 1.2 };
    case 'sewer':
      return { fog: SEWER, bg: SEWER, near: 1.5, far: 30, hemi: 0.4, sun: 0, glow: 1.5, fillI: 1.6, fillD: 3.5, fillDecay: 1.2 };
    case 'murk':
      return { fog: MURK, bg: MURK, near: 0.05, far: 1.8, hemi: 0.45, sun: 0, glow: 1.8, fillI: 1.9, fillD: 3.5, fillDecay: 1.2 };
    case 'soil':
      return { fog: DIRT, bg: DIRT, near: 1, far: 18, hemi: 0.32, sun: 0, glow: 3, fillI: 2.2, fillD: 3.5, fillDecay: 1.2 };
    case 'tunnel': // в тоннеле метро и над ним видно далеко: лампы тоннеля
      return { fog: DIRT, bg: DIRT, near: 1, far: 80, hemi: 0.32, sun: 0, glow: 3, fillI: 2.2, fillD: 3.5, fillDecay: 1.2 };
    case 'water':
      return { fog: WATER, bg: WATER, near: 0.3, far: 10, hemi: 0.9, sun: 0, glow: 1.3, fillI: 1.3, fillD: 8, fillDecay: 0.7 };
    default: { // rock
      const c = STONE.clone().lerp(WARM, smooth((depth - 250) / 750));
      return { fog: c, bg: c, near: 1.5, far: 26, hemi: 0.42, sun: 0, glow: 1.2, fillI: 1.25, fillD: 9, fillDecay: 0.7 };
    }
  }
}
// границы зон сверху вниз: [высота, ширина перехода, зона ниже]
const WT = ROCK.tunnel;
const ZONES = [
  [MANHOLE.crown, 0.3, 'sewer'],
  [MANHOLE.water, 0.1, 'murk'],
  [MANHOLE.invert + 0.02, 0.12, 'soil'],
  [SOIL_TOP - 4.8, 0.4, 'tunnel'],
  [ROCK.top, 0.3, 'rock'],
  [WT.y + WT.r_in + 0.3, 0.7, 'water'], // вода видна сквозь растворяющуюся обделку заранее
  [WT.y - WT.r_in - 0.3, 0.7, 'rock'],
];
function blendedEnv(y, depth, shaft) {
  let upper = 'street';
  for (const [level, w, zone] of ZONES) {
    if (y > level + w) break;
    if (y >= level - w) {
      const k = smooth((level + w - y) / (2 * w));
      const a = zoneEnv(upper, depth, shaft);
      const b = zoneEnv(zone, depth, shaft);
      const out = { fog: a.fog.clone().lerp(b.fog, k), bg: k < 0.5 ? a.bg : b.bg };
      for (const key of ENV_KEYS) out[key] = lerp(a[key], b[key], k);
      if (out.bg) out.bg = out.fog;
      return out;
    }
    upper = zone;
  }
  return zoneEnv(upper, depth, shaft);
}
function applyEnv(e) {
  scene.fog.color.copy(e.fog);
  scene.fog.near = e.near;
  scene.fog.far = e.far;
  scene.background = e.bg ? scene.fog.color : null;
  hemi.intensity = e.hemi;
  sun.intensity = e.sun;
  body.glow.intensity = e.glow;
  fill.intensity = e.fillI;
  fill.distance = e.fillD;
  fill.decay = e.fillDecay;
}

// Растворение вблизи глаз: всё, кроме тела, ближе NEAR_FADE (м по оси взгляда) не рисуется, край — в точку
const NEAR_FADE = { value: 0 };
const NEAR_FAR = { value: new THREE.Vector2(0.03, 9000) };
function addNearFade(root) {
  const done = new Set();
  root.traverse((o) => {
    const mats = o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : [];
    for (const m of mats) {
      if (done.has(m)) continue;
      done.add(m);
      const prev = m.onBeforeCompile;
      m.onBeforeCompile = (shader, r) => {
        if (prev) prev.call(m, shader, r);
        shader.uniforms.uNearFade = NEAR_FADE;
        shader.uniforms.uNearFar = NEAR_FAR;
        shader.fragmentShader = shader.fragmentShader
          .replace('#include <common>', '#include <common>\nuniform float uNearFade;\nuniform vec2 uNearFar;')
          .replace('#include <clipping_planes_fragment>', `#include <clipping_planes_fragment>
  if (uNearFade > 0.0) {
    float zn = gl_FragCoord.z * 2.0 - 1.0;
    float vz = 2.0 * uNearFar.x * uNearFar.y / (uNearFar.y + uNearFar.x - zn * (uNearFar.y - uNearFar.x));
    float dn = fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(0.06711056, 0.00583715))));
    if (vz < uNearFade - 0.12 * dn) discard;
  }`);
      };
      m.needsUpdate = true;
    }
  });
}
for (const g of [city.group, under.group, manhole.group, rock.group]) addNearFade(g);

window.renderAt = (t) => {
  const depth = depthAt(t);
  const speed = (depthAt(t + 0.05) - depthAt(t - 0.05)) / 0.1;
  const deepPhase = t >= HANDOFF;
  // глубже километра тело стоит на месте, а мимо едут стенки deep.js: так не теряется точность
  body.root.position.set(PLAYER.x, SIDEWALK - (deepPhase ? depthAt(HANDOFF) : depth), PLAYER.z);
  body.root.rotation.y = bodyYaw(t) * DEG;

  const sway = 1 + 1.2 * smooth((depth - 0.05) / 0.5);
  const yaw = headYaw(t);
  const yawVel = (headYaw(t + 0.02) - headYaw(t - 0.02)) / 0.04 + (bodyYaw(t + 0.02) - bodyYaw(t - 0.02)) / 0.04;
  const pitch = headPitch(t) + 0.28 * Math.sin(t * 2 * Math.PI * 0.23); // дыхание
  // голова чуть наклоняется в сторону поворота, как у живого человека
  const roll = clamp(-yawVel * 0.035, -2.5, 2.5) + 0.25 * drift(t, 0.31, 0.83, 1.7) * sway;
  // толчок у разлома: короткая затухающая дрожь
  const q = t - FAULT.t + 0.3;
  const quake = q > 0 && q < 2.2 ? Math.exp(-q * 2.2) * smooth(q / 0.06) : 0;
  const shakeP = quake * (1.6 * Math.sin(t * 61) + 0.9 * Math.sin(t * 37 + 1));
  const shakeR = quake * (1.2 * Math.sin(t * 47 + 2) + 0.7 * Math.sin(t * 29));
  body.neck.rotation.set((pitch + shakeP + 0.35 * drift(t, 0.43, 1.07, 2.3) * sway) * DEG, (yaw + 0.5 * drift(t, 0.37, 0.91, 1.9) * sway) * DEG, (roll + shakeR) * DEG);
  body.neck.position.y = 1.52 + 0.005 * Math.sin(t * 2 * Math.PI * 0.23);

  poseBody(body, t, { balance: balance(t), check: check(t), shield: shield(t), float: floatW(t), tread: treadW(t) });
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

  city.group.visible = !deepPhase && eye.y > MANHOLE.crown;
  under.group.visible = !deepPhase && eye.y <= MANHOLE.water + 0.8 && eye.y > ROCK.top - 3;
  rock.group.visible = !deepPhase && eye.y < ROCK.top + 1.5;
  manhole.group.visible = !deepPhase;
  deep.group.visible = deepPhase;
  hemi.color.copy(HEMI_SKY);
  hemi.groundColor.copy(HEMI_GROUND);
  renderer.toneMappingExposure = 1.12;
  if (deepPhase) {
    // глубже километра: свет и туман от температуры породы — от тёмной скалы до белого каления
    const env = updateDeep(deep, t, depth, eye);
    const g = Math.min(1, env.glow);
    const gc = env.glowColor;
    const settle = smooth((t - HANDOFF) / 12); // на стыке свет точно как у rock.js, дальше — свой
    const warmK = depth < EARTH / 2 ? smooth((depth - 250) / 750) : smooth((env.T - 20) / 60);
    scene.fog.color.copy(STONE).lerp(WARM, warmK).lerp(gc.clone().multiplyScalar(0.3), Math.min(1, g * 1.2));
    scene.fog.near = 1.5;
    scene.fog.far = 26 + 10 * g;
    scene.background = scene.fog.color;
    // свет на стенках и на теле: от прохладного к тёплому, но не чисто цвета свечения — породу видно;
    // в холодной базальтовой коре на той стороне — светлее, иначе тёмный базальт тонет в черноте
    const coldCrust = depth > EARTH / 2 ? 1 - smooth((env.T - 150) / 400) : 0;
    hemi.color.copy(COOL).lerp(WARMLIGHT, 0.5 * smooth((env.T - 300) / 900)).lerp(gc, 0.12 * g);
    hemi.groundColor.copy(HEMI_GROUND).lerp(gc.clone().multiplyScalar(0.6), 0.4 * g);
    hemi.intensity = lerp(0.42, 0.8 + 0.25 * g + 0.5 * coldCrust, settle);
    sun.intensity = 0;
    body.glow.intensity = 1.2 * (1 - g);
    fill.intensity = 1.25;
    fill.distance = 9;
    fill.decay = 0.7;
    renderer.toneMappingExposure = 1.12 - 0.38 * smooth((env.T - 1500) / 3200);
  } else {
    // выше километра: свет и туман по зонам (площадь и шахта, коллектор, мутная вода, грунт, тоннель метро,
    // скала, водовод); на границах зон — плавный переход по высоте глаз, без затемнений
    applyEnv(blendedEnv(eye.y, depth, inShaft ? shaftK : 0));
  }

  // сквозь перекрытия и поверхность воды: всё, что ближе к глазам, чем NEAR_FADE, растворяется (дыра в
  // перекрытии растёт по мере приближения); кадр не гаснет
  let near = 0;
  if (!deepPhase) {
    for (const [top, bottom] of SLABS) {
      const dist = eye.y > top ? eye.y - top : eye.y < bottom ? bottom - eye.y : 0;
      near = Math.max(near, 1 - smooth((dist - 0.6) / 0.6));
    }
  }
  NEAR_FADE.value = 0.55 * near;
  const through = 0;

  if (!deepPhase) {
    updateCity(city, t, depth, eye);
    updateManhole(manhole, t, depth, eye);
    updateUnderground(under, t);
    if (rock.group.visible) updateRock(rock, t, eye, speed);
  }
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

window.__dbg = { scene, deep, body, renderer, camera, __THREE: THREE }; // для замеров (render.js не трогает)
window.renderAt(0);
window.ready = true;
