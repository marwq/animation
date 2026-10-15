// Машины 7-й авеню: жёлтые такси с плафоном TAXI на крыше, чёрные внедорожники, седаны, городской автобус.
// Расписание движения — из scene.json (его же озвучивает audio.py). Все детали — инстансы: сотня машин
// рисуется за пару десятков вызовов.
import * as THREE from 'three';
import { canvasTexture } from './util.js';

const TAXI = 0xf7c315;
const OTHER = [0x15161a, 0x2a2d33, 0x9aa1aa, 0xe6e6e6, 0x3a4a6a, 0x6b1f22];

// Борт машины в профиль: капот, лобовое, крыша, багажник. Длина вдоль -Z (нос вперёд).
function profile(points, width) {
  const shape = new THREE.Shape(points.map(([x, y]) => new THREE.Vector2(x, y)));
  const g = new THREE.ExtrudeGeometry(shape, { depth: width, bevelEnabled: false });
  g.translate(-2.4, 0, -width / 2);
  g.rotateY(Math.PI / 2);
  return g;
}

function roofSignTexture() {
  return canvasTexture(256, 96, (ctx, w, h) => {
    ctx.fillStyle = '#fff6d8';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#141414';
    ctx.font = '700 58px "Space Grotesk", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('TAXI', w / 2, h / 2 + 4);
  });
}

export function buildFleet(scene, r) {
  const group = new THREE.Group();
  const cars = scene.traffic.map((c) => ({ ...c, yaw: 0 }));
  // на поперечных улицах машины стоят на красный: видно в просветах между домами
  for (const [x, z, yaw] of [[-34, -35, Math.PI / 2], [-41, -35, Math.PI / 2], [-48, -35, Math.PI / 2], [22, -41, -Math.PI / 2], [29, -41, -Math.PI / 2], [-36, -99, Math.PI / 2], [24, -103, -Math.PI / 2], [-36, 43, Math.PI / 2]]) {
    cars.push({ x, z0: z, v: 0, kind: r() < 0.75 ? 'taxi' : 'sedan', yaw, id: cars.length });
  }
  const sedans = cars.filter((c) => c.kind !== 'bus');
  const buses = cars.filter((c) => c.kind === 'bus');
  const taxis = sedans.filter((c) => c.kind === 'taxi');

  const lower = profile([[0, 0.3], [0, 0.78], [1.15, 0.9], [4.05, 0.95], [4.8, 0.9], [4.8, 0.3]], 1.9);
  const cabin = profile([[1.25, 0.9], [1.98, 1.4], [3.3, 1.44], [4.0, 0.95]], 1.74);
  const roof = new THREE.BoxGeometry(1.7, 0.05, 1.3);
  const wheel = new THREE.CylinderGeometry(0.34, 0.34, 0.24, 12).rotateZ(Math.PI / 2);
  const lamp = new THREE.BoxGeometry(0.34, 0.12, 0.04);
  const sign = new THREE.BoxGeometry(0.95, 0.3, 0.26);

  const paint = new THREE.MeshLambertMaterial({ flatShading: true });
  const mk = (geo, mat, n) => {
    const m = new THREE.InstancedMesh(geo, mat, n);
    m.frustumCulled = false;
    group.add(m);
    return m;
  };
  const parts = {
    lower: mk(lower, paint, sedans.length),
    cabin: mk(cabin, new THREE.MeshLambertMaterial({ color: 0x1b2230, flatShading: true }), sedans.length),
    roof: mk(roof, paint, sedans.length),
    wheels: mk(wheel, new THREE.MeshLambertMaterial({ color: 0x111111 }), sedans.length * 4),
    heads: mk(lamp, new THREE.MeshBasicMaterial({ color: 0xfff4d8 }), sedans.length * 2),
    tails: mk(lamp, new THREE.MeshBasicMaterial({ color: 0xff2320 }), sedans.length * 2),
    signs: mk(sign, new THREE.MeshBasicMaterial({ map: roofSignTexture() }), taxis.length),
  };
  const color = new THREE.Color();
  sedans.forEach((c, i) => {
    color.setHex(c.kind === 'taxi' ? TAXI : c.kind === 'suv' ? 0x141518 : OTHER[Math.floor(r() * OTHER.length)]);
    parts.lower.setColorAt(i, color);
    parts.roof.setColorAt(i, color);
  });

  // Автобус: белый с синей полосой, светящиеся окна
  const busBody = new THREE.BoxGeometry(2.55, 2.9, 12);
  const busWin = new THREE.BoxGeometry(2.6, 0.9, 10.6);
  const busStripe = new THREE.BoxGeometry(2.6, 0.3, 12.02);
  const bus = {
    body: mk(busBody, new THREE.MeshLambertMaterial({ color: 0xeef1f4 }), buses.length),
    win: mk(busWin, new THREE.MeshBasicMaterial({ color: 0xfff0c8 }), buses.length),
    stripe: mk(busStripe, new THREE.MeshLambertMaterial({ color: 0x1d4fa8 }), buses.length),
  };

  return { group, sedans, buses, taxis, parts, bus };
}

const M = new THREE.Matrix4();
const P = new THREE.Matrix4();
const Q = new THREE.Quaternion();
const V = new THREE.Vector3();
const ONE = new THREE.Vector3(1, 1, 1);
const UP = new THREE.Vector3(0, 1, 0);

function place(mesh, i, base, x, y, z, hidden) {
  P.makeTranslation(x, y, z);
  M.multiplyMatrices(base, P);
  if (hidden) M.makeScale(0, 0, 0);
  mesh.setMatrixAt(i, M);
}

export function updateFleet(f, t) {
  let ti = 0;
  f.sedans.forEach((c, i) => {
    const z = c.z0 - c.v * t;
    const hidden = z < -470 || z > 320;
    Q.setFromAxisAngle(UP, c.yaw);
    const base = new THREE.Matrix4().compose(V.set(c.x, 0, z), Q, ONE);
    place(f.parts.lower, i, base, 0, 0, 0, hidden);
    place(f.parts.cabin, i, base, 0, 0, 0, hidden);
    place(f.parts.roof, i, base, 0, 1.465, -0.2, hidden);
    [[-0.86, -1.5], [0.86, -1.5], [-0.86, 1.45], [0.86, 1.45]].forEach(([wx, wz], k) => place(f.parts.wheels, i * 4 + k, base, wx, 0.34, wz, hidden));
    [-0.62, 0.62].forEach((lx, k) => {
      place(f.parts.heads, i * 2 + k, base, lx, 0.68, -2.42, hidden);
      place(f.parts.tails, i * 2 + k, base, lx, 0.74, 2.42, hidden);
    });
    if (c.kind === 'taxi') place(f.parts.signs, ti++, base, 0, 1.64, -0.2, hidden);
  });
  f.buses.forEach((c, i) => {
    const z = c.z0 - c.v * t;
    const hidden = z < -470 || z > 320;
    const base = new THREE.Matrix4().makeTranslation(c.x, 0, z);
    place(f.bus.body, i, base, 0, 1.75, 0, hidden);
    place(f.bus.win, i, base, 0, 2.15, 0.2, hidden);
    place(f.bus.stripe, i, base, 0, 1.0, 0, hidden);
  });
  for (const m of [...Object.values(f.parts), ...Object.values(f.bus)]) m.instanceMatrix.needsUpdate = true;
}

