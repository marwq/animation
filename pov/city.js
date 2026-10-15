// Проспект в духе Таймс-сквер в сумерках: дома с окнами, светящиеся абстрактные экраны (без брендов),
// такси, пешеходы, фонари, вход в метро. Всё низкополигональное, всё с зерном — кадр к кадру одинаково.
import * as THREE from 'three';
import { box, canvasTexture, lambert, rng, wrap } from './util.js';
import { PLAYER, SIDEWALK } from './timeline.js';

const ROAD_HALF = 8; // проезжая часть x ∈ [-8, 8]
const FRONT = 13; // фасады на x = ±13

function sky() {
  const geo = new THREE.SphereGeometry(800, 48, 24);
  const top = new THREE.Color(0x141a3e);
  const mid = new THREE.Color(0x4b4f86);
  const low = new THREE.Color(0xe9976a);
  const colors = [];
  const p = geo.attributes.position;
  const c = new THREE.Color();
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i) / 800;
    const y = p.getY(i) / 800;
    const z = p.getZ(i) / 800;
    const h = Math.max(0, y);
    c.copy(mid).lerp(top, Math.min(1, h * 1.8));
    // тёплое зарево в конце проспекта (направление -Z)
    const glow = Math.max(0, -z) ** 3 * Math.exp(-h * 9);
    c.lerp(low, Math.min(1, glow * 1.4 + Math.exp(-h * 14) * 0.35));
    colors.push(c.r, c.g, c.b);
  }
  geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  const mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, fog: false, depthWrite: false }));
  mesh.renderOrder = -1;
  return mesh;
}

function windowTexture(r, facade) {
  return canvasTexture(128, 256, (ctx, w, h) => {
    ctx.fillStyle = facade;
    ctx.fillRect(0, 0, w, h);
    const cols = 8;
    const rows = 20;
    for (let j = 0; j < rows; j++) {
      for (let i = 0; i < cols; i++) {
        const lit = r() < 0.38;
        ctx.fillStyle = lit ? (r() < 0.7 ? '#ffd38a' : '#d6e6ff') : '#18202e';
        ctx.fillRect(i * 16 + 3, j * 12.8 + 3, 10, 7.5);
      }
    }
  });
}

// Абстрактная графика для экранов: градиенты, круги, полосы — никаких логотипов и надписей
function screenTexture(r) {
  const palettes = [
    ['#ff3d8b', '#ffb238'],
    ['#2de2e6', '#3d5afe'],
    ['#ff6b35', '#f7c548'],
    ['#9b5de5', '#f15bb5'],
    ['#00f5d4', '#00bbf9'],
    ['#ef476f', '#ffd166'],
    ['#06d6a0', '#118ab2'],
  ];
  const [a, b] = palettes[Math.floor(r() * palettes.length)];
  const tex = canvasTexture(512, 256, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, a);
    g.addColorStop(1, b);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = '#ffffff';
    const kind = r();
    if (kind < 0.4) {
      for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.arc(r() * w, r() * h, 30 + r() * 90, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (kind < 0.75) {
      for (let x = -h; x < w; x += 46) {
        ctx.beginPath();
        ctx.moveTo(x, h);
        ctx.lineTo(x + h, 0);
        ctx.lineTo(x + h + 18, 0);
        ctx.lineTo(x + 18, h);
        ctx.fill();
      }
    } else {
      ctx.fillRect(w * 0.08, h * 0.25, w * 0.5, h * 0.18);
      ctx.fillRect(w * 0.08, h * 0.52, w * 0.32, h * 0.12);
    }
    // пиксельная сетка экрана
    ctx.globalAlpha = 0.12;
    ctx.fillStyle = '#000';
    for (let y = 0; y < h; y += 4) ctx.fillRect(0, y, w, 1);
    ctx.globalAlpha = 1;
  });
  tex.wrapS = THREE.RepeatWrapping;
  return tex;
}

function taxi(color) {
  const g = new THREE.Group();
  const paint = lambert(color);
  const glass = lambert(0x1c2333);
  const tyre = lambert(0x111111);
  const bodyMesh = box(1.9, 0.62, 4.4, paint);
  bodyMesh.position.y = 0.55;
  g.add(bodyMesh);
  const cabin = box(1.68, 0.56, 2.2, glass);
  cabin.position.set(0, 1.12, 0.15);
  g.add(cabin);
  const roof = box(1.7, 0.06, 2.0, paint);
  roof.position.set(0, 1.42, 0.15);
  g.add(roof);
  for (const [x, z] of [[-0.86, 1.35], [0.86, 1.35], [-0.86, -1.35], [0.86, -1.35]]) {
    const w = new THREE.Mesh(new THREE.CylinderGeometry(0.33, 0.33, 0.22, 10), tyre);
    w.rotation.z = Math.PI / 2;
    w.position.set(x, 0.33, z);
    g.add(w);
  }
  const head = new THREE.MeshBasicMaterial({ color: 0xfff2d0 });
  const tail = new THREE.MeshBasicMaterial({ color: 0xff2a2a });
  for (const x of [-0.65, 0.65]) {
    const h = box(0.32, 0.12, 0.04, head);
    h.position.set(x, 0.62, -2.21);
    g.add(h);
    const t = box(0.3, 0.1, 0.04, tail);
    t.position.set(x, 0.66, 2.21);
    g.add(t);
  }
  return g;
}

function pedestrian(r) {
  const coats = [0x3b5f8a, 0x8a3b4a, 0x4a6b3b, 0xb07a2a, 0x5a4a7a, 0x2f2f35, 0x9a9a9a, 0x6b3b2a];
  const skins = [0xf0c8a8, 0xd59d78, 0xa86f4c, 0x7a4b30];
  const g = new THREE.Group();
  const coat = lambert(coats[Math.floor(r() * coats.length)]);
  const dark = lambert(0x22252b);
  const skin = lambert(skins[Math.floor(r() * skins.length)]);
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.2, 0.45, 3, 8), coat);
  torso.position.y = 1.2;
  g.add(torso);
  const head = new THREE.Mesh(new THREE.IcosahedronGeometry(0.13, 1), skin);
  head.position.y = 1.72;
  g.add(head);
  const limbs = [];
  for (const s of [-1, 1]) {
    const hip = new THREE.Group();
    hip.position.set(0.1 * s, 0.86, 0);
    const leg = box(0.13, 0.84, 0.15, dark);
    leg.position.y = -0.42;
    hip.add(leg);
    g.add(hip);
    const sh = new THREE.Group();
    sh.position.set(0.25 * s, 1.45, 0);
    const arm = box(0.09, 0.6, 0.1, coat);
    arm.position.y = -0.3;
    sh.add(arm);
    g.add(sh);
    limbs.push({ hip, sh, s });
  }
  return { g, limbs };
}

export function buildCity() {
  const r = rng(7);
  const group = new THREE.Group();
  const skyMesh = sky();
  group.add(skyMesh);

  // Дорога — верх толстой плиты: снизу её видно как потолок, когда уходим под землю
  const slab = box(400, 1.2, 900, lambert(0x2a2b30));
  slab.position.y = -0.6;
  group.add(slab);
  const white = new THREE.MeshLambertMaterial({ color: 0xe8e6df });
  const yellow = new THREE.MeshLambertMaterial({ color: 0xf2b632 });
  for (let z = 40; z > -400; z -= 9) {
    for (const x of [-4, 4]) {
      const dash = box(0.14, 0.01, 3.2, white);
      dash.position.set(x, 0.005, z);
      group.add(dash);
    }
  }
  for (const x of [-0.15, 0.15]) {
    const line = box(0.12, 0.01, 440, yellow);
    line.position.set(x, 0.005, -180);
    group.add(line);
  }
  for (let x = -7.2; x <= 7.2; x += 1.1) {
    const stripe = box(0.6, 0.012, 4, white);
    stripe.position.set(x, 0.006, -30);
    group.add(stripe);
  }

  // Тротуары и бордюры
  const walk = lambert(0x8d8a86);
  const curbM = lambert(0xb3b0aa);
  for (const s of [-1, 1]) {
    const sw = box(FRONT - ROAD_HALF, SIDEWALK, 900, walk);
    sw.position.set(s * (ROAD_HALF + FRONT) / 2, SIDEWALK / 2, 0);
    group.add(sw);
    const curb = box(0.22, SIDEWALK + 0.01, 900, curbM);
    curb.position.set(s * (ROAD_HALF + 0.11), (SIDEWALK + 0.01) / 2, 0);
    group.add(curb);
    // стыки плитки
    for (let z = 20; z > -60; z -= 1.6) {
      const joint = box(FRONT - ROAD_HALF - 0.3, 0.004, 0.025, lambert(0x6f6c69));
      joint.position.set(s * (ROAD_HALF + FRONT) / 2, SIDEWALK + 0.002, z);
      group.add(joint);
    }
  }

  // Дома: фасады с окнами, на нижних этажах — экраны
  const facades = ['#2a2f3a', '#3a3530', '#23303a', '#4a4f57', '#31343c', '#2e2a35'].map((f) => windowTexture(r, f));
  const screens = [];
  for (const s of [-1, 1]) {
    let z = 30;
    while (z > -420) {
      const width = 14 + r() * 18;
      const height = 26 + r() * 110 * (z > -200 ? 1 : 0.6);
      const depth = 24;
      const tex = facades[Math.floor(r() * facades.length)].clone();
      tex.needsUpdate = true;
      tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(width / 14, height / 24);
      const mat = new THREE.MeshLambertMaterial({ map: tex, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 0.55 });
      const b = box(depth, height, width - 0.6, mat);
      b.position.set(s * (FRONT + depth / 2), height / 2, z - width / 2);
      group.add(b);
      // экраны на фасаде, обращённом к улице
      if (z > -260 && r() < 0.85) {
        const n = 1 + Math.floor(r() * 3);
        for (let k = 0; k < n; k++) {
          const sw = Math.min(width - 2, 7 + r() * 14);
          const sh = 4 + r() * 12;
          const tex2 = screenTexture(r);
          const mat2 = new THREE.MeshBasicMaterial({ map: tex2, color: new THREE.Color(1.25, 1.25, 1.25) });
          const panel = new THREE.Mesh(new THREE.PlaneGeometry(sw, sh), mat2);
          panel.position.set(s * (FRONT - 0.05), 5 + k * 13 + r() * 6 + sh / 2, z - width / 2 + (r() - 0.5) * (width - sw));
          panel.rotation.y = -s * Math.PI / 2;
          group.add(panel);
          screens.push({ tex: tex2, speed: (r() - 0.5) * 0.12 });
        }
      }
      // светодиодная лента по углу дома
      if (r() < 0.4) {
        const led = box(0.3, height * 0.8, 0.3, new THREE.MeshBasicMaterial({ color: r() < 0.5 ? 0x2de2e6 : 0xff3d8b }));
        led.position.set(s * (FRONT + 0.1), height * 0.4, z - 0.3);
        group.add(led);
      }
      z -= width;
    }
  }
  // Высокий дом-«остров» в конце: стопка экранов на южном фасаде
  const island = box(10, 120, 14, new THREE.MeshLambertMaterial({ map: facades[2], emissive: 0xffffff, emissiveMap: facades[2], emissiveIntensity: 0.5 }));
  island.position.set(0, 60, -250);
  group.add(island);
  for (let k = 0; k < 5; k++) {
    const tex2 = screenTexture(r);
    const panel = new THREE.Mesh(new THREE.PlaneGeometry(9, 7), new THREE.MeshBasicMaterial({ map: tex2, color: new THREE.Color(1.3, 1.3, 1.3) }));
    panel.position.set(0, 8 + k * 8.5, -242.9);
    group.add(panel);
    screens.push({ tex: tex2, speed: (r() - 0.5) * 0.12 });
  }

  // Фонари по обеим сторонам
  const pole = lambert(0x3a3d42);
  const lamp = new THREE.MeshBasicMaterial({ color: 0xffe2a8 });
  for (const s of [-1, 1]) {
    for (let z = -6; z > -300; z -= 24) {
      const p = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 7.2, 8), pole);
      p.position.set(s * (ROAD_HALF + 0.45), 3.6 + SIDEWALK, z);
      group.add(p);
      const arm = box(1.6, 0.08, 0.08, pole);
      arm.position.set(s * (ROAD_HALF - 0.3), 7.1 + SIDEWALK, z);
      group.add(arm);
      const head = box(0.6, 0.12, 0.28, lamp);
      head.position.set(s * (ROAD_HALF - 0.9), 7.0 + SIDEWALK, z);
      group.add(head);
    }
  }

  const near = new THREE.PointLight(0xffd9a0, 5, 20, 1.2);
  near.position.set(ROAD_HALF - 0.6, 6.8, -6);
  group.add(near);

  // Светофор на перекрёстке, гидрант, газетный ящик, вход в метро с зелёными фонарями
  const sig = new THREE.Group();
  const sp = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 4.2, 8), pole);
  sp.position.y = 2.1;
  sig.add(sp);
  const sb = box(0.4, 1.1, 0.35, lambert(0x2b2d31));
  sb.position.y = 4.4;
  sig.add(sb);
  const green = box(0.2, 0.2, 0.05, new THREE.MeshBasicMaterial({ color: 0x3dff8a }));
  green.position.set(0, 4.1, 0.19);
  sig.add(green);
  sig.position.set(ROAD_HALF + 0.5, SIDEWALK, -27);
  group.add(sig);

  const hydrant = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.16, 0.7, 8), lambert(0xc0282d));
  hydrant.position.set(ROAD_HALF + 0.55, SIDEWALK + 0.35, -3.2);
  group.add(hydrant);
  const news = box(0.5, 1.0, 0.45, lambert(0x2a5aa8));
  news.position.set(FRONT - 0.6, SIDEWALK + 0.5, -4.5);
  group.add(news);

  const rail = lambert(0x1d4a35);
  const entrance = new THREE.Group();
  for (const zz of [0, -4.2]) {
    const side = box(0.08, 1.0, 4.2, rail);
    side.position.set(zz === 0 ? 0 : 1.8, 0.5, -2.1);
    entrance.add(side);
  }
  for (const [x, z] of [[0, 0], [1.8, 0]]) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 2.2, 6), rail);
    post.position.set(x, 1.1, z);
    entrance.add(post);
    const globe = new THREE.Mesh(new THREE.IcosahedronGeometry(0.18, 1), new THREE.MeshBasicMaterial({ color: 0x5cff9a }));
    globe.position.set(x, 2.3, z);
    entrance.add(globe);
  }
  entrance.position.set(10.4, SIDEWALK, -13);
  group.add(entrance);

  // Машины: по две полосы в каждую сторону; первое такси обгоняет нас слева около t = 4 с
  const cars = [];
  const lanes = [
    { x: -6, dir: 1, v: 11 },
    { x: -2, dir: 1, v: 9 },
    { x: 2, dir: -1, v: 10 },
    { x: 6, dir: -1, v: 12 },
  ];
  const paints = [0xf2c12e, 0xf2c12e, 0xf2c12e, 0x9aa3ad, 0xe8e8e8, 0x27324a, 0x8e2b2b];
  for (const lane of lanes) {
    for (let k = 0; k < 9; k++) {
      const featured = lane.x === 6 && k === 0;
      const car = taxi(featured ? 0xf2c12e : paints[Math.floor(r() * paints.length)]);
      if (lane.dir === 1) car.rotation.y = Math.PI;
      group.add(car);
      cars.push({ car, lane, offset: featured ? 0 : 30 + k * 34 + r() * 10 });
    }
  }

  // Пешеходы на обоих тротуарах
  const people = [];
  for (let k = 0; k < 26; k++) {
    const p = pedestrian(r);
    const side = k % 2 ? 1 : -1;
    const x = side * (side === 1 ? 11.2 + r() * 1.3 : 9.8 + r() * 2.4);
    const dir = r() < 0.5 ? 1 : -1;
    if (dir === 1) p.g.rotation.y = Math.PI;
    group.add(p.g);
    people.push({ ...p, x, dir, speed: 1.2 + r() * 0.5, z0: -120 + r() * 150, phase: r() * 6 });
  }

  // Трещины в плитке вокруг ног: растут, пока мы проваливаемся
  const cracks = new THREE.Group();
  const crackM = new THREE.MeshBasicMaterial({ color: 0x2a2724 });
  for (let k = 0; k < 9; k++) {
    const a = (k / 9) * Math.PI * 2 + r() * 0.5;
    const len = 0.5 + r() * 0.9;
    const c = box(0.025, 0.004, len, crackM);
    c.position.set(Math.sin(a) * (0.3 + len / 2), 0, Math.cos(a) * (0.3 + len / 2));
    c.rotation.y = a;
    cracks.add(c);
  }
  const pit = new THREE.Mesh(new THREE.CircleGeometry(0.42, 20), new THREE.MeshBasicMaterial({ color: 0x3a3632, transparent: true, opacity: 0.85 }));
  pit.rotation.x = -Math.PI / 2;
  cracks.add(pit);
  cracks.position.set(PLAYER.x, SIDEWALK + 0.003, PLAYER.z - 0.05);
  group.add(cracks);

  return { group, skyMesh, screens, cars, people, cracks };
}

export function updateCity(city, t, depth, camPos) {
  city.skyMesh.position.copy(camPos);
  for (const s of city.screens) s.tex.offset.x = t * s.speed;
  for (const { car, lane, offset } of city.cars) {
    // первое такси: z = 0 ровно в t = 4 с (проносится мимо), остальные — по кругу
    const z = offset === 0 ? -lane.v * (t - 4.0) : wrap(-offset + lane.dir * lane.v * t, -320, 60);
    car.position.set(lane.x, 0, z);
  }
  for (const p of city.people) {
    const z = wrap(p.z0 + p.dir * p.speed * t, -160, 40);
    p.g.position.set(p.x, SIDEWALK, z);
    const ph = t * p.speed * 3.4 + p.phase;
    for (const l of p.limbs) {
      l.hip.rotation.x = Math.sin(ph + (l.s > 0 ? 0 : Math.PI)) * 0.45;
      l.sh.rotation.x = -Math.sin(ph + (l.s > 0 ? 0 : Math.PI)) * 0.35;
    }
  }
  const k = Math.min(1, depth / 0.45);
  city.cracks.scale.setScalar(0.2 + 0.8 * k);
  city.cracks.visible = depth > 0.01;
}
