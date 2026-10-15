// Под тротуаром: стенки «шахты» вокруг героя по слоям (бетон, грунт, скала), трубы и кабели,
// прямоугольный тоннель метро с колоннами и поездом. Шахта нужна только для взгляда изнутри.
import * as THREE from 'three';
import { box, canvasTexture, lambert, rng } from './util.js';
import { PLAYER, TRAIN } from './timeline.js';

const R = 6; // радиус «шахты» вокруг героя: просторнее — видно стены, трубы и слои
export const TUNNEL = { y: -7.6, height: 4.6, width: 9, track: TRAIN.track }; // центр тоннеля по Y, путь с поездом по Z

// Стенка из грубого камня: цилиндр изнутри, вершины чуть сдвинуты, цвет по слоям
function wall(top, bottom, colorAt, r) {
  const h = top - bottom;
  const geo = new THREE.CylinderGeometry(R, R, h, 30, Math.max(2, Math.round(h / 0.7)), true);
  const p = geo.attributes.position;
  const colors = [];
  const c = new THREE.Color();
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i);
    const z = p.getZ(i);
    const y = p.getY(i) + (top + bottom) / 2;
    const k = 1 + (r() - 0.5) * 0.16;
    p.setX(i, x * k);
    p.setZ(i, z * k);
    colorAt(c, y, Math.atan2(z, x), r);
    colors.push(c.r, c.g, c.b);
  }
  geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geo.computeVertexNormals();
  const mesh = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.BackSide, flatShading: true }));
  mesh.position.set(PLAYER.x, (top + bottom) / 2, PLAYER.z);
  return mesh;
}

function tileTexture() {
  const tex = canvasTexture(256, 256, (ctx, w, h) => {
    ctx.fillStyle = '#d9d4c3';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#b9b3a0';
    for (let y = 0; y < h; y += 16) ctx.fillRect(0, y, w, 2);
    for (let y = 0; y < h; y += 16) for (let x = (y / 16) % 2 ? 16 : 0; x < w; x += 32) ctx.fillRect(x, y, 2, 16);
    // мозаичная полоса
    ctx.fillStyle = '#2e6b5a';
    ctx.fillRect(0, h * 0.38, w, 18);
    ctx.fillStyle = '#c9a23a';
    ctx.fillRect(0, h * 0.38 + 18, w, 5);
  });
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

function trainCar(r) {
  const g = new THREE.Group();
  const shell = box(15, 3.1, 2.8, lambert(0xb9bec6));
  g.add(shell);
  const windows = canvasTexture(512, 64, (ctx, w, h) => {
    ctx.fillStyle = '#2a2d33';
    ctx.fillRect(0, 0, w, h);
    for (let x = 12; x < w - 30; x += 56) {
      ctx.fillStyle = r() < 0.15 ? '#3a3d45' : '#fff1cf';
      ctx.fillRect(x, 10, 40, 40);
    }
  });
  const band = new THREE.Mesh(new THREE.PlaneGeometry(14.4, 1.0), new THREE.MeshBasicMaterial({ map: windows }));
  band.position.set(0, 0.35, 1.405);
  g.add(band);
  const stripe = box(15.02, 0.12, 2.82, new THREE.MeshBasicMaterial({ color: 0xff6a2a }));
  stripe.position.y = -0.35;
  g.add(stripe);
  return g;
}

export function buildUnderground() {
  const r = rng(11);
  const group = new THREE.Group();
  const T = TUNNEL;
  const ceiling = T.y + T.height / 2; // -5.3
  const floor = T.y - T.height / 2; // -9.9

  const concrete = (c, y) => c.setHex(0x4a4a4c).offsetHSL(0, 0, (r() - 0.5) * 0.04);
  const soil = (c, y) => c.setHex(0x6e5238).offsetHSL((r() - 0.5) * 0.02, 0, (r() - 0.5) * 0.08 + Math.sin(y * 4.1) * 0.02);
  // сланец Манхэттена: серо-голубой, с косыми светлыми прожилками кварца
  const schist = (c, y, a) => {
    c.setHex(0x8a93a0).offsetHSL(0, 0, (r() - 0.5) * 0.06);
    if (Math.sin(y * 2.6 + a * 3.0) > 0.86) c.setHex(0xbdbab0);
  };
  group.add(wall(0, -1.2, concrete, r));
  group.add(wall(-1.2, ceiling, soil, r));
  group.add(wall(floor, -220, schist, r));

  // Потолок шахты: изнанка мостовой, чтобы снизу не просвечивал город
  const cap = new THREE.Mesh(new THREE.CircleGeometry(R + 0.6, 24), lambert(0x1e1c1b));
  cap.rotation.x = Math.PI / 2;
  cap.position.set(PLAYER.x, -0.02, PLAYER.z);
  group.add(cap);

  // Камни в грунте
  for (let k = 0; k < 14; k++) {
    const a = r() * Math.PI * 2;
    const stone = new THREE.Mesh(new THREE.DodecahedronGeometry(0.12 + r() * 0.25), lambert(0x6b6258));
    stone.position.set(PLAYER.x + Math.cos(a) * (R - 0.1), -1.4 - r() * 3.6, PLAYER.z + Math.sin(a) * (R - 0.1));
    group.add(stone);
  }

  // Трубы: водопровод вдоль улицы, паропровод поперёк, связка кабелей
  const main = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 30, 14), lambert(0x7a4a2e));
  main.rotation.x = Math.PI / 2;
  main.position.set(PLAYER.x + 1.4, -1.7, PLAYER.z);
  group.add(main);
  const steam = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 30, 12), lambert(0xb8b2a6));
  steam.rotation.z = Math.PI / 2;
  steam.position.set(PLAYER.x, -2.6, PLAYER.z - 1.3);
  group.add(steam);
  for (let x = -12; x <= 12; x += 1.5) {
    const ring = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.16, 12), lambert(0xe0782f));
    ring.rotation.z = Math.PI / 2;
    ring.position.set(PLAYER.x + x, -2.6, PLAYER.z - 1.3);
    group.add(ring);
  }
  const duct = box(0.7, 0.45, 30, lambert(0x7d7b76));
  duct.position.set(PLAYER.x - 1.3, -3.4, PLAYER.z);
  group.add(duct);
  for (let k = 0; k < 5; k++) {
    const cable = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 30, 6), lambert([0x15171b, 0x2f6b3a, 0x8a1f1f, 0x2b2b2b, 0x3a4a8a][k]));
    cable.rotation.x = Math.PI / 2;
    cable.position.set(PLAYER.x - 1.55 + k * 0.12, -3.1, PLAYER.z);
    group.add(cable);
  }

  // Тоннель: коробка изнутри, плитка на стенах, тёмный потолок, балласт, рельсы, колонны
  const tiles = tileTexture();
  tiles.repeat.set(60, 1);
  const tube = box(600, T.height, T.width, new THREE.MeshLambertMaterial({ map: tiles, side: THREE.BackSide }));
  tube.position.set(PLAYER.x, T.y, PLAYER.z);
  group.add(tube);
  const ceil = box(600, 0.05, T.width - 0.02, lambert(0x2a2b2e));
  ceil.position.set(PLAYER.x, ceiling - 0.03, PLAYER.z);
  group.add(ceil);
  const ballast = box(600, 0.06, T.width - 0.02, lambert(0x3b3732));
  ballast.position.set(PLAYER.x, floor + 0.03, PLAYER.z);
  group.add(ballast);
  const steel = lambert(0x8d9097);
  for (const z of [T.track, 3.2]) {
    for (const dz of [-0.72, 0.72]) {
      const rail = box(600, 0.12, 0.08, steel);
      rail.position.set(PLAYER.x, floor + 0.12, PLAYER.z + z + dz);
      group.add(rail);
    }
  }
  const sleepers = new THREE.InstancedMesh(new THREE.BoxGeometry(0.22, 0.08, 2.0), lambert(0x4a3b2c), 2 * 120);
  const mtx = new THREE.Matrix4();
  let n = 0;
  for (const z of [T.track, 3.2]) {
    for (let x = -42; x < 42; x += 0.7) {
      mtx.makeTranslation(PLAYER.x + x, floor + 0.07, PLAYER.z + z);
      sleepers.setMatrixAt(n++, mtx);
    }
  }
  sleepers.count = n;
  group.add(sleepers);
  const column = lambert(0x1f3a30);
  for (let x = -60; x <= 60; x += 4) {
    if (Math.abs(x) < 2) continue; // не сквозь героя
    const c = box(0.26, T.height, 0.26, column);
    c.position.set(PLAYER.x + x, T.y, PLAYER.z + 0.9);
    group.add(c);
  }
  const fixture = new THREE.MeshBasicMaterial({ color: 0xfff4d6 });
  for (let x = -120; x <= 120; x += 6) {
    for (const z of [T.track, 3.2]) {
      const f = box(1.2, 0.06, 0.22, fixture);
      f.position.set(PLAYER.x + x, ceiling - 0.08, PLAYER.z + z);
      group.add(f);
    }
  }
  const lamps = [];
  for (const x of [-8, 0, 8]) {
    const l = new THREE.PointLight(0xfff0d0, 6, 16, 1.4);
    l.position.set(PLAYER.x + x, ceiling - 0.4, PLAYER.z);
    group.add(l);
    lamps.push(l);
  }

  // Поезд из трёх вагонов; фары с собственным светом
  const train = new THREE.Group();
  for (let k = 0; k < 3; k++) {
    const car = trainCar(r);
    car.position.x = -k * 15.6;
    train.add(car);
  }
  const front = box(0.06, 3.0, 2.7, lambert(0x2b2e34)); // тёмная морда — на ней видны фары
  front.position.x = 7.52;
  train.add(front);
  const headM = new THREE.MeshBasicMaterial({ color: 0xffffff });
  for (const z of [-0.8, 0.8]) {
    const h = new THREE.Mesh(new THREE.CircleGeometry(0.16, 12), headM);
    h.rotation.y = Math.PI / 2;
    h.position.set(7.56, -0.7, z);
    train.add(h);
  }
  const beam = new THREE.PointLight(0xfff6e0, 14, 30, 1.2);
  beam.position.set(9, -0.4, 0);
  train.add(beam);
  train.position.set(0, floor + 0.35 + 1.55, PLAYER.z + T.track);
  group.add(train);

  // Блёстки слюды в сланце
  const sparkleGeo = new THREE.BufferGeometry();
  const pts = [];
  for (let k = 0; k < 900; k++) {
    const a = r() * Math.PI * 2;
    pts.push(PLAYER.x + Math.cos(a) * (R - 0.15), floor - 0.3 - r() * 60, PLAYER.z + Math.sin(a) * (R - 0.15));
  }
  sparkleGeo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
  group.add(new THREE.Points(sparkleGeo, new THREE.PointsMaterial({ color: 0xdfe8ff, size: 0.035 })));

  return { group, train, lamps };
}

// Передняя кромка поезда проходит мимо героя в момент TRAIN.pass (scene.json — оттуда же звук)
export function updateUnderground(u, t) {
  u.train.position.x = PLAYER.x - 7.5 + TRAIN.speed * (t - TRAIN.pass);
}
