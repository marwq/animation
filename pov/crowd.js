// Люди на площади: прохожие, туристы с телефонами, сидящие на красной лестнице, очередь у тележки
// с хот-догами. Плюс голуби у ног — они взлетают, когда трескается плитка. Люди — инстансы.
import * as THREE from 'three';
import { clamp, smooth, wrap } from './util.js';

const COATS = [0x2f4a73, 0x7a2e3a, 0x3f5e3a, 0xb07a2a, 0x5a4a7a, 0x2a2a30, 0x9a9a9a, 0x6b3b2a, 0xc94f3d, 0x2f7f8a, 0xe2c25a, 0x444b57];
const SKINS = [0xf0c8a8, 0xd59d78, 0xa86f4c, 0x7a4b30, 0xe8b897];
const LEGS = [0x22252b, 0x2b3a55, 0x3a3326, 0x55555c, 0x1d2a44];
const CLEAR = 2.6; // вокруг героя никто не ходит: никто не пройдёт сквозь камеру

export function buildCrowd(r, opts) {
  const group = new THREE.Group();
  const people = [];
  // прохожие вдоль площади (вдоль Z) и поперёк (вдоль X), пути обходят героя
  for (let k = 0; k < 64; k++) {
    const along = r() < 0.72;
    let x, z;
    if (along) {
      do x = -9 + r() * 21; while (Math.abs(x) < CLEAR);
      z = -60 + r() * 100;
    } else {
      x = -9 + r() * 21;
      do z = -30 + r() * 60; while (Math.abs(z) < CLEAR + 1);
    }
    people.push({ kind: 'walk', along, x, z, dir: r() < 0.5 ? 1 : -1, speed: 1.0 + r() * 0.6, phase: r() * 7, height: 0.9 + r() * 0.18 });
  }
  // стоят и снимают на телефон (лицом к экранам)
  for (let k = 0; k < 8; k++) {
    let x, z;
    do {
      x = -8 + r() * 19;
      z = -40 + r() * 70;
    } while (Math.hypot(x, z) < CLEAR + 1.5);
    people.push({ kind: 'photo', x, z, yaw: r() * Math.PI * 2, phase: r() * 7, height: 0.9 + r() * 0.15 });
  }
  // сидят на красной лестнице
  for (let k = 0; k < 22; k++) {
    const step = Math.floor(r() * 10) + 1;
    people.push({ kind: 'sit', x: opts.steps.x - 6 + r() * 12, z: opts.steps.z + step * 1.05 - 0.2, y: opts.plaza + step * 0.4, yaw: (r() - 0.5) * 0.4, phase: r() * 7, height: 0.9 + r() * 0.15 });
  }
  // очередь у тележки
  for (let k = 0; k < 3; k++) people.push({ kind: 'photo', x: opts.cart.x + 1.2 + k * 0.7, z: opts.cart.z + 0.4 + k * 0.5, yaw: Math.PI / 2 + 0.3, phase: r() * 7, height: 0.95, still: true });
  // продавец
  people.push({ kind: 'photo', x: opts.cart.x - 0.9, z: opts.cart.z, yaw: -Math.PI / 2, phase: 1, height: 0.95, still: true });

  const n = people.length;
  const mk = (geo, n2 = n) => {
    const m = new THREE.InstancedMesh(geo, new THREE.MeshLambertMaterial({ flatShading: true }), n2);
    m.frustumCulled = false;
    group.add(m);
    return m;
  };
  const parts = {
    torso: mk(new THREE.CapsuleGeometry(0.19, 0.44, 3, 8)),
    head: mk(new THREE.IcosahedronGeometry(0.125, 1)),
    hair: mk(new THREE.IcosahedronGeometry(0.128, 1)),
    legL: mk(new THREE.BoxGeometry(0.13, 0.84, 0.15).translate(0, -0.42, 0)),
    legR: mk(new THREE.BoxGeometry(0.13, 0.84, 0.15).translate(0, -0.42, 0)),
    armL: mk(new THREE.BoxGeometry(0.09, 0.6, 0.1).translate(0, -0.3, 0)),
    armR: mk(new THREE.BoxGeometry(0.09, 0.6, 0.1).translate(0, -0.3, 0)),
  };
  const phones = new THREE.InstancedMesh(new THREE.BoxGeometry(0.075, 0.14, 0.01), new THREE.MeshBasicMaterial({ color: 0xcfe6ff }), n);
  phones.frustumCulled = false;
  group.add(phones);
  const c = new THREE.Color();
  people.forEach((p, i) => {
    const coat = COATS[Math.floor(r() * COATS.length)];
    parts.torso.setColorAt(i, c.setHex(coat));
    parts.armL.setColorAt(i, c.setHex(coat));
    parts.armR.setColorAt(i, c.setHex(coat));
    parts.head.setColorAt(i, c.setHex(SKINS[Math.floor(r() * SKINS.length)]));
    parts.hair.setColorAt(i, c.setHex([0x1a1410, 0x3b2a1a, 0x6b4a2a, 0xc9a66b, 0x2a2a2a][Math.floor(r() * 5)]));
    const leg = LEGS[Math.floor(r() * LEGS.length)];
    parts.legL.setColorAt(i, c.setHex(leg));
    parts.legR.setColorAt(i, c.setHex(leg));
  });

  // Голуби: тело, голова, два крыла
  const birds = [];
  const grey = new THREE.MeshLambertMaterial({ color: 0x9a9ca6, flatShading: true });
  const dark = new THREE.MeshLambertMaterial({ color: 0x4f535c, flatShading: true });
  for (let k = 0; k < 7; k++) {
    const b = new THREE.Group();
    const body = new THREE.Mesh(new THREE.IcosahedronGeometry(0.11, 0), grey);
    body.scale.set(0.8, 0.75, 1.35);
    b.add(body);
    const head = new THREE.Mesh(new THREE.IcosahedronGeometry(0.05, 0), dark);
    head.position.set(0, 0.08, -0.12);
    b.add(head);
    const tail = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.015, 0.1), dark);
    tail.position.set(0, 0.01, 0.15);
    tail.rotation.x = -0.25;
    b.add(tail);
    b.scale.setScalar(0.8);
    const wings = [-1, 1].map((s) => {
      const w = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.01, 0.12).translate(s * 0.1, 0, 0), dark);
      w.position.set(s * 0.05, 0.04, 0);
      b.add(w);
      return w;
    });
    const a = r() * Math.PI * 2;
    birds.push({ b, wings, x: 1.0 + r() * 2.4, z: -2.6 - r() * 3.0, yaw: a, phase: r() * 6, flyDir: new THREE.Vector3(r() - 0.3, 0, -0.6 - r()).normalize() });
    group.add(b);
  }
  return { group, people, parts, phones, birds, plaza: opts.plaza };
}

const M = new THREE.Matrix4();
const B = new THREE.Matrix4();
const L = new THREE.Matrix4();
const Q = new THREE.Quaternion();
const E = new THREE.Euler();
const V = new THREE.Vector3();
const S = new THREE.Vector3();
const POS = new THREE.Vector3();
const UP = new THREE.Vector3(0, 1, 0);

function limb(mesh, i, base, x, y, z, rx, rz = 0) {
  L.compose(V.set(x, y, z), Q.setFromEuler(E.set(rx, 0, rz)), S.set(1, 1, 1));
  M.multiplyMatrices(base, L);
  mesh.setMatrixAt(i, M);
}

export function updateCrowd(cr, t, crack) {
  const { parts, phones } = cr;
  cr.people.forEach((p, i) => {
    let x = p.x;
    let z = p.z;
    let y = cr.plaza;
    let yaw = p.yaw || 0;
    let swing = 0;
    if (p.kind === 'walk') {
      const d = p.dir * p.speed * t;
      if (p.along) z = wrap(p.z + d, -70, 45);
      else x = wrap(p.x + d, -9, 12);
      yaw = p.along ? (p.dir > 0 ? Math.PI : 0) : p.dir > 0 ? -Math.PI / 2 : Math.PI / 2;
      swing = Math.sin(t * p.speed * 3.3 + p.phase);
    }
    if (p.kind === 'sit') y = p.y;
    const h = p.height;
    B.compose(POS.set(x, y, z), Q.setFromAxisAngle(UP, yaw), S.set(h, h, h));
    const sit = p.kind === 'sit';
    const breathe = Math.sin(t * 1.3 + p.phase) * 0.01;
    limb(parts.torso, i, B, 0, (sit ? 0.82 : 1.22) + breathe, 0, 0);
    limb(parts.head, i, B, 0, (sit ? 1.36 : 1.76) + breathe, 0, 0);
    limb(parts.hair, i, B, 0, (sit ? 1.385 : 1.785) + breathe, 0.012, 0);
    if (sit) {
      limb(parts.legL, i, B, -0.1, 0.5, 0, Math.PI / 2 - 0.15);
      limb(parts.legR, i, B, 0.1, 0.5, 0, Math.PI / 2 - 0.05);
    } else {
      limb(parts.legL, i, B, -0.1, 0.88, 0, swing * 0.45);
      limb(parts.legR, i, B, 0.1, 0.88, 0, -swing * 0.45);
    }
    const photo = p.kind === 'photo' && !p.still;
    const armY = sit ? 1.05 : 1.45;
    limb(parts.armL, i, B, -0.22, armY, 0, photo ? 1.95 : -swing * 0.35, photo ? -0.55 : 0);
    limb(parts.armR, i, B, 0.22, armY, 0, photo ? 1.95 : swing * 0.35, photo ? 0.55 : 0);
    if (photo) {
      limb(phones, i, B, 0, armY + 0.24, -0.5, -0.3);
    } else {
      phones.setMatrixAt(i, M.makeScale(0, 0, 0));
    }
  });
  for (const m of [...Object.values(parts), phones]) m.instanceMatrix.needsUpdate = true;

  // Голуби клюют у ног, пока не треснет плитка; потом взлетают и уходят вверх и вперёд
  for (const b of cr.birds) {
    const fly = clamp((t - crack - 0.15 - b.phase * 0.02) / 2.6, 0, 1);
    if (fly <= 0) {
      const peck = Math.max(0, Math.sin(t * 5 + b.phase * 3)) ** 6;
      b.b.position.set(b.x, cr.plaza + 0.1, b.z);
      b.b.rotation.set(peck * 0.6, b.yaw + Math.sin(t * 0.7 + b.phase) * 0.6, 0);
      b.wings.forEach((w) => (w.rotation.z = 0));
    } else {
      const k = smooth(fly);
      const dist = 14 * fly * fly + 3 * fly;
      b.b.position.set(b.x + b.flyDir.x * dist, cr.plaza + 0.1 + 9 * k + 1.5 * fly, b.z + b.flyDir.z * dist);
      b.b.rotation.set(-0.3, Math.atan2(-b.flyDir.x, -b.flyDir.z), 0);
      const flap = Math.sin(t * 38 + b.phase) * 0.9;
      b.wings.forEach((w, s) => (w.rotation.z = (s ? -1 : 1) * flap));
    }
    b.b.visible = fly < 1;
  }
}
