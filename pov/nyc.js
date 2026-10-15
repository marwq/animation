// Таймс-сквер в сумерках, вид с пешеходной площади на юг.
// Слева 7-я авеню с потоком жёлтых такси, по сторонам — дома, затянутые экранами, впереди башня
// One Times Square с шаром, за спиной красная лестница, над крышами слева — Эмпайр-стейт и Крайслер.
// Улицы подписаны зелёными табличками, есть вход в метро с зелёными фонарями, паровая труба
// в оранжево-белую полоску, тележка с хот-догами, водонапорные башни и пожарные лестницы.
import * as THREE from 'three';
import { Batch, canvasTexture, lambert, rng, uvBox } from './util.js';
import { chrysler, empireState, oneTimesSquare, redSteps } from './landmarks.js';
import { buildFleet, updateFleet } from './fleet.js';
import { buildCrowd, updateCrowd } from './crowd.js';
import { CRACK, MANHOLE, PLAYER, SCENE, SIDEWALK } from './timeline.js';

// План: x — запад (+) / восток (-), z — север (+) / юг (-)
const AVE = { west: -10, east: -27 }; // проезжая часть 7-й авеню
const EAST_FRONT = -31; // фасады за авеню
const PLAZA = { west: 13 }; // площадь от авеню до западного тротуара
const WEST_FRONT = 16;
const STREETS = [
  { z: 40, name: 'W 46 St' },
  { z: -38, name: 'W 45 St' },
  { z: -96, name: 'W 44 St' },
  { z: -142, name: 'W 43 St' },
]; // поперечные улицы шириной 12 м
const STREET_W = 12;
const EYE = new THREE.Vector3(0, 1.8, 0);
const LANDMARKS = [
  { x: -430, z: -830, h: 443, keep: 0.5 }, // Эмпайр-стейт: видна верхняя половина
  { x: -385, z: -990, h: 319, keep: 0.5 }, // Крайслер
];

// Кусок площади, в котором стоит герой: верх с круглым вырезом под люк (развёртка — как у uvBox,
// чтобы плитка легла без шва), боковые грани обычные, низа нет — снизу на него смотрят из шахты.
function plazaWithHole(x0, x1, z0, z1, tile) {
  const shape = new THREE.Shape();
  shape.moveTo(x0, -z1);
  shape.lineTo(x1, -z1);
  shape.lineTo(x1, -z0);
  shape.lineTo(x0, -z0);
  shape.closePath();
  const hole = new THREE.Path();
  hole.absarc(PLAYER.x, -PLAYER.z, MANHOLE.radius, 0, Math.PI * 2, true);
  shape.holes.push(hole);
  const top = new THREE.ShapeGeometry(shape, 48);
  top.rotateX(-Math.PI / 2);
  top.translate(0, SIDEWALK, 0);
  const p = top.attributes.position;
  const uv = top.attributes.uv;
  for (let i = 0; i < p.count; i++) uv.setXY(i, (p.getX(i) - x0) / tile, (z1 - p.getZ(i)) / tile);
  const sides = uvBox(x1 - x0, SIDEWALK, z1 - z0, tile, tile).toNonIndexed();
  sides.translate((x0 + x1) / 2, SIDEWALK / 2, (z0 + z1) / 2);
  const keep = [];
  const n = sides.attributes.normal;
  for (let i = 0; i < n.count; i += 3) if (Math.abs(n.getY(i)) < 0.5) keep.push(i, i + 1, i + 2);
  const out = new THREE.BufferGeometry();
  for (const name of ['position', 'normal', 'uv']) {
    const src = sides.attributes[name];
    const arr = new Float32Array(keep.length * src.itemSize);
    keep.forEach((v, j) => {
      for (let c = 0; c < src.itemSize; c++) arr[j * src.itemSize + c] = src.array[v * src.itemSize + c];
    });
    out.setAttribute(name, new THREE.BufferAttribute(arr, src.itemSize));
  }
  return [top, out];
}

function sky() {
  const R = 4000;
  const geo = new THREE.SphereGeometry(R, 48, 24);
  const top = new THREE.Color(0x1b2556);
  const mid = new THREE.Color(0x5966a6);
  const low = new THREE.Color(0xf3a676);
  const pink = new THREE.Color(0xd98aa6);
  const c = new THREE.Color();
  const colors = [];
  const p = geo.attributes.position;
  const sun = new THREE.Vector3(0.55, 0, -0.84).normalize(); // закат на юго-западе
  for (let i = 0; i < p.count; i++) {
    const v = new THREE.Vector3(p.getX(i), p.getY(i), p.getZ(i)).divideScalar(R);
    const h = Math.max(0, v.y);
    c.copy(mid).lerp(top, Math.min(1, h * 1.6));
    const toward = Math.max(0, v.x * sun.x + v.z * sun.z);
    c.lerp(pink, Math.exp(-h * 6) * 0.45);
    c.lerp(low, Math.min(1, toward ** 2.5 * Math.exp(-h * 7) * 1.3));
    colors.push(c.r, c.g, c.b);
  }
  geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  const mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, fog: false, depthWrite: false }));
  mesh.renderOrder = -1;
  return mesh;
}

// Фасады: стекло с полосами офисов, известняк, кирпич, сталь — окна светятся по-разному
function facadeTexture(r, kind) {
  const tex = canvasTexture(128, 256, (ctx, w, h) => {
    const base = { glass: '#24304a', glass2: '#2c3540', stone: '#9c907c', brick: '#7a4636', brick2: '#5e3a30', steel: '#4a5058' }[kind];
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, w, h);
    const rows = 20;
    for (let j = 0; j < rows; j++) {
      const floorLit = r() < (kind.startsWith('glass') ? 0.55 : 0.4);
      for (let i = 0; i < 8; i++) {
        const lit = floorLit ? r() < 0.8 : r() < 0.18;
        ctx.fillStyle = lit ? (r() < 0.75 ? '#ffd796' : '#dbe8ff') : kind.startsWith('glass') ? '#16203a' : '#2a2630';
        if (kind.startsWith('glass')) ctx.fillRect(i * 16 + 1, j * 12.8 + 2, 14, 9);
        else ctx.fillRect(i * 16 + 4, j * 12.8 + 3, 8, 7.5);
      }
    }
  });
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

// Экраны: абстрактная графика и названия мест — никаких брендов
function screenPool(r) {
  const palettes = [
    ['#ff3d8b', '#ffb238'],
    ['#2de2e6', '#3d5afe'],
    ['#ff6b35', '#f7c548'],
    ['#9b5de5', '#f15bb5'],
    ['#00f5d4', '#00bbf9'],
    ['#ef476f', '#ffd166'],
    ['#06d6a0', '#118ab2'],
    ['#f72585', '#4361ee'],
  ];
  const words = ['NEW YORK', 'NYC', 'TIMES SQ', 'BROADWAY', 'MANHATTAN', 'NEW YORK CITY'];
  const pool = [];
  for (let k = 0; k < 18; k++) {
    const [a, b] = palettes[k % palettes.length];
    const word = k % 3 === 1 ? words[Math.floor(k / 3) % words.length] : null;
    const tex = canvasTexture(512, 256, (ctx, w, h) => {
      const g = ctx.createLinearGradient(0, 0, w, h);
      g.addColorStop(0, a);
      g.addColorStop(1, b);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      ctx.globalAlpha = 0.33;
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
      ctx.globalAlpha = 1;
      if (word) {
        ctx.fillStyle = '#ffffff';
        ctx.font = `700 ${word.length > 8 ? 74 : 120}px "Space Grotesk", sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = 'rgba(0,0,0,.35)';
        ctx.shadowBlur = 12;
        ctx.fillText(word, w / 2, h / 2 + 6);
      }
      ctx.globalAlpha = 0.12;
      ctx.fillStyle = '#000';
      for (let y = 0; y < h; y += 4) ctx.fillRect(0, y, w, 1);
      ctx.globalAlpha = 1;
    });
    if (!word) tex.wrapS = THREE.RepeatWrapping;
    pool.push({ tex, speed: word ? 0 : (r() - 0.5) * 0.1 });
  }
  return { pool, pick: (i) => pool[i % pool.length].tex };
}

function signTexture(text, w = 512, h = 128) {
  return canvasTexture(w, h, (ctx) => {
    ctx.fillStyle = '#0b6b3a';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 6;
    ctx.strokeRect(8, 8, w - 16, h - 16);
    ctx.fillStyle = '#ffffff';
    ctx.font = `700 ${h * 0.56}px "Space Grotesk", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, w / 2, h / 2 + 4);
  });
}

function subwaySignTexture() {
  return canvasTexture(512, 192, (ctx, w, h) => {
    ctx.fillStyle = '#111111';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#ffffff';
    ctx.font = '700 64px "Space Grotesk", sans-serif';
    ctx.textBaseline = 'middle';
    ctx.fillText('SUBWAY', 26, 52);
    const lines = [['1', '#ee352e'], ['2', '#ee352e'], ['3', '#ee352e'], ['7', '#b933ad'], ['N', '#fccc0a'], ['Q', '#fccc0a'], ['R', '#fccc0a'], ['S', '#808183']];
    lines.forEach(([l, c], i) => {
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.arc(46 + i * 56, 122, 24, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = c === '#fccc0a' ? '#111' : '#fff';
      ctx.font = '700 30px "Space Grotesk", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(l, 46 + i * 56, 124);
      ctx.textAlign = 'left';
    });
    ctx.fillStyle = '#cfcfcf';
    ctx.font = '500 22px "Space Grotesk", sans-serif';
    ctx.fillText('Times Sq – 42 St', 26, 172);
  });
}

function signalTexture(kind) {
  return canvasTexture(64, 64, (ctx, w, h) => {
    ctx.fillStyle = '#0c0c0c';
    ctx.fillRect(0, 0, w, h);
    if (kind === 'hand') {
      ctx.fillStyle = '#ff7a1a';
      ctx.fillRect(22, 26, 22, 24);
      for (let i = 0; i < 4; i++) ctx.fillRect(22 + i * 5.6, 12 + Math.abs(i - 1.5) * 2, 4.2, 16);
      ctx.fillRect(15, 32, 8, 5);
    } else {
      ctx.fillStyle = '#f2f2f2';
      ctx.beginPath();
      ctx.arc(32, 14, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(28, 21, 8, 20);
      ctx.fillRect(24, 40, 6, 18);
      ctx.fillRect(34, 40, 6, 18);
    }
  });
}

// Не даём ближним домам закрыть силуэты небоскрёбов на горизонте
function sightCap(x0, x1, z0, z1, h) {
  let cap = h;
  const az = (x, z) => Math.atan2(-(x - EYE.x), -(z - EYE.z));
  const corners = [[x0, z0], [x0, z1], [x1, z0], [x1, z1]];
  const azs = corners.map(([x, z]) => az(x, z));
  const lo = Math.min(...azs);
  const hi = Math.max(...azs);
  const near = Math.hypot(Math.max(x0 - EYE.x, 0, EYE.x - x1), Math.max(z0 - EYE.z, 0, EYE.z - z1));
  for (const L of LANDMARKS) {
    const a = az(L.x, L.z);
    const d = Math.hypot(L.x, L.z);
    const half = Math.atan(45 / d) + 0.02;
    if (a + half < lo || a - half > hi || hi - lo > Math.PI) continue;
    const elev = Math.atan((L.h * (1 - L.keep) - EYE.y) / d);
    cap = Math.min(cap, EYE.y + near * Math.tan(elev) - 1);
  }
  return Math.max(cap, 9);
}

export function buildCity() {
  const r = rng(21);
  const group = new THREE.Group();
  const skyMesh = sky();
  group.add(skyMesh);
  const screens = screenPool(r);
  const b = new Batch();

  // --- земля ------------------------------------------------------------
  const asphalt = lambert(0x2c2d33);
  // асфальт — четырьмя плитами вокруг шахты люка
  const H = MANHOLE.shaft_radius + 0.05;
  b.box(1200 - H, 1.2, 2400, asphalt, PLAYER.x - H - (1200 - H) / 2, -0.6, 0);
  b.box(1200 - H, 1.2, 2400, asphalt, PLAYER.x + H + (1200 - H) / 2, -0.6, 0);
  b.box(2 * H, 1.2, 1200 - H, asphalt, PLAYER.x, -0.6, PLAYER.z + H + (1200 - H) / 2);
  b.box(2 * H, 1.2, 1200 - H, asphalt, PLAYER.x, -0.6, PLAYER.z - H - (1200 - H) / 2);
  const paverTex = canvasTexture(256, 256, (ctx, w, h) => {
    ctx.fillStyle = '#4a4a50';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#3a3a3f';
    ctx.lineWidth = 3;
    for (let x = 0; x <= w; x += 64) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y <= h; y += 32) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
    // металлические «монетки» в покрытии площади
    ctx.fillStyle = '#b9bcc4';
    for (let i = 0; i < 14; i++) {
      ctx.beginPath();
      ctx.arc(r() * w, r() * h, 3.2, 0, Math.PI * 2);
      ctx.fill();
    }
  });
  paverTex.wrapS = paverTex.wrapT = THREE.RepeatWrapping;
  const paver = new THREE.MeshLambertMaterial({ map: paverTex });
  const walk = lambert(0x8f8c88);
  const curb = lambert(0xb5b2ac);
  // площадь и тротуары — кусками между поперечными улицами
  const cuts = [...STREETS.map((s) => s.z)].sort((a, b2) => b2 - a);
  const segs = [];
  let top = 400;
  for (const z of cuts) {
    segs.push([z + STREET_W / 2, top]);
    top = z - STREET_W / 2;
  }
  segs.push([-560, top]);
  for (const [z0, z1] of segs) {
    const len = z1 - z0;
    const zc = (z0 + z1) / 2;
    if (PLAYER.z > z0 && PLAYER.z < z1) for (const g of plazaWithHole(AVE.west, PLAZA.west, z0, z1, 4)) b.add(g, paver);
    else b.add(uvBox(PLAZA.west - AVE.west, SIDEWALK, len, 4, 4), paver, (PLAZA.west + AVE.west) / 2, SIDEWALK / 2, zc);
    b.box(WEST_FRONT - PLAZA.west, SIDEWALK, len, walk, (WEST_FRONT + PLAZA.west) / 2, SIDEWALK / 2, zc);
    b.box(AVE.east - EAST_FRONT, SIDEWALK, len, walk, (AVE.east + EAST_FRONT) / 2, SIDEWALK / 2, zc);
    for (const x of [AVE.west + 0.1, AVE.east - 0.1, PLAZA.west + 0.1]) b.box(0.22, SIDEWALK + 0.01, len, curb, x, (SIDEWALK + 0.01) / 2, zc);
  }
  // разметка: прерывистые линии между полосами, сплошные края, «зебры» на перекрёстках
  const white = new THREE.MeshLambertMaterial({ color: 0xe8e6df });
  const yellow = new THREE.MeshLambertMaterial({ color: 0xf2b632 });
  for (let z = 300; z > -520; z -= 9) for (const x of [-14, -17, -20, -23]) b.box(0.14, 0.012, 3.2, white, x, 0.006, z);
  for (const s of STREETS) {
    for (const zz of [s.z + STREET_W / 2 + 1.6, s.z - STREET_W / 2 - 1.6]) {
      for (let x = AVE.east + 0.6; x < AVE.west - 0.4; x += 1.1) b.box(0.55, 0.014, 2.6, white, x, 0.007, zz);
    }
    b.box(1200, 0.012, 0.12, yellow, 0, 0.006, s.z - 0.12);
    b.box(1200, 0.012, 0.12, yellow, 0, 0.006, s.z + 0.12);
  }

  // --- дома ---------------------------------------------------------------
  const kinds = ['glass', 'glass2', 'stone', 'brick', 'brick2', 'steel'];
  const facades = Object.fromEntries(kinds.map((k) => [k, facadeTexture(r, k)]));
  const facadeMat = Object.fromEntries(kinds.map((k) => [k, new THREE.MeshLambertMaterial({ map: facades[k], emissive: 0xffffff, emissiveMap: facades[k], emissiveIntensity: 0.62 })]));
  const rooftops = [];
  const fireEscapes = [];
  const screenSpots = [];
  const addBuilding = (x0, x1, z0, z1, h, kind, face) => {
    h = sightCap(x0, x1, z0, z1, h);
    b.add(uvBox(x1 - x0, h, z1 - z0, 14, 24), facadeMat[kind], (x0 + x1) / 2, h / 2, (z0 + z1) / 2);
    if (h < 30) rooftops.push({ x: (x0 + x1) / 2, z: (z0 + z1) / 2, h, w: x1 - x0, d: z1 - z0 });
    if (face) screenSpots.push({ x0, x1, z0, z1, h, face });
    return h;
  };
  // фронт застройки вдоль площади и авеню
  for (const [z0, z1] of segs) {
    for (const side of ['east', 'west']) {
      let z = z1;
      while (z > z0 + 4) {
        const w = Math.min(z - z0, 12 + r() * 20);
        const tall = side === 'west' || z0 < -150 || z1 > 60;
        const h = tall ? 50 + r() * 150 : 40 + r() * 90;
        const kind = h < 45 ? (r() < 0.5 ? 'brick' : 'brick2') : kinds[Math.floor(r() * kinds.length)];
        const x0 = side === 'east' ? EAST_FRONT - 28 : WEST_FRONT;
        const x1 = side === 'east' ? EAST_FRONT : WEST_FRONT + 28;
        const realH = addBuilding(x0, x1, z - w + 0.4, z, h, kind, side === 'east' ? 1 : -1);
        if (realH < 30 && side === 'east') fireEscapes.push({ x: EAST_FRONT + 0.05, z: z - w / 2, h: realH });
        z -= w;
      }
    }
  }
  // за спиной (север) — стена домов с экранами, вдали — плотный Мидтаун
  for (let x = AVE.east - 40; x < WEST_FRONT + 40; x += 18 + r() * 8) addBuilding(x, x + 17, 52, 80, 70 + r() * 130, kinds[Math.floor(r() * kinds.length)], null);
  for (let k = 0; k < 140; k++) {
    const a = r() * Math.PI * 2;
    const d = 120 + r() * 1100;
    const x = Math.sin(a) * d;
    const z = Math.cos(a) * d;
    if (x > EAST_FRONT - 30 && x < WEST_FRONT + 30) continue; // не на площади и не на авеню
    const w = 20 + r() * 30;
    addBuilding(x - w / 2, x + w / 2, z - w / 2, z + w / 2, 60 + r() * 220, kinds[Math.floor(r() * kinds.length)], null);
  }

  // Экраны на фасадах, обращённых к площади: в Таймс-сквер они закрывают нижние этажи целиком
  const screenMeshes = [];
  for (const s of screenSpots) {
    if (s.z1 < -175 || s.z0 > 70) continue;
    const x = s.face > 0 ? s.x1 + 0.06 : s.x0 - 0.06;
    const width = s.z1 - s.z0 - 0.8;
    let y = 4;
    const n = s.h < 30 ? 1 : 2 + Math.floor(r() * 2);
    for (let k = 0; k < n; k++) {
      const hgt = Math.min(s.h - y - 2, s.h < 30 ? s.h - 6 : 8 + r() * 12);
      if (hgt < 3) break;
      const panel = new THREE.Mesh(new THREE.PlaneGeometry(width, hgt), new THREE.MeshBasicMaterial({ map: screens.pick(Math.floor(r() * 18)), color: new THREE.Color(1.25, 1.25, 1.25) }));
      panel.position.set(x, y + hgt / 2, (s.z0 + s.z1) / 2);
      panel.rotation.y = s.face * Math.PI / 2;
      group.add(panel);
      screenMeshes.push(panel);
      y += hgt + 1 + r() * 4;
    }
  }

  // Водонапорные башни на крышах невысоких домов
  const wood = lambert(0x6b4a33);
  const roofCone = lambert(0x4a3527);
  const ironM = lambert(0x1c1d20);
  for (const rt of rooftops.slice(0, 10)) {
    const tx = rt.x + (r() - 0.5) * rt.w * 0.4;
    const tz = rt.z + (r() - 0.5) * rt.d * 0.4;
    b.add(new THREE.CylinderGeometry(2.4, 2.4, 4.2, 12), wood, tx, rt.h + 3.6 + 2.1, tz);
    b.add(new THREE.ConeGeometry(2.6, 1.6, 12), roofCone, tx, rt.h + 3.6 + 4.2 + 0.8, tz);
    for (const [dx, dz] of [[-1.6, -1.6], [1.6, -1.6], [-1.6, 1.6], [1.6, 1.6]]) b.box(0.18, 3.6, 0.18, ironM, tx + dx, rt.h + 1.8, tz + dz);
  }
  // Пожарные лестницы зигзагом на кирпичных фасадах
  for (const fe of fireEscapes) {
    for (let y = 5; y < fe.h - 2; y += 3.2) {
      b.box(1.1, 0.08, 4.2, ironM, fe.x + 0.55, y, fe.z);
      b.box(0.04, 0.9, 4.2, ironM, fe.x + 1.08, y + 0.45, fe.z);
      b.add(new THREE.BoxGeometry(0.6, 0.06, 3.9), ironM, fe.x + 0.5, y + 1.6, fe.z, 0, 0.72 * (Math.round(y / 3.2) % 2 ? 1 : -1));
    }
  }

  // --- достопримечательности ----------------------------------------------
  const esb = empireState();
  esb.position.set(LANDMARKS[0].x, 0, LANDMARKS[0].z);
  group.add(esb);
  const cb = chrysler();
  cb.position.set(LANDMARKS[1].x, 0, LANDMARKS[1].z);
  cb.rotation.y = 0.5;
  group.add(cb);
  const ots = oneTimesSquare(screens);
  ots.group.position.set(-1, 0, -166);
  group.add(ots.group);
  const STEPS = { x: 5.5, z: 18 };
  const steps = redSteps();
  steps.position.set(STEPS.x, SIDEWALK, STEPS.z);
  group.add(steps);

  // --- улица: таблички, светофоры, фонари, метро, пар, тележка, скамейки ---
  const poleM = lambert(0x2f3236);
  const blade = (text, x, y, z, ry) => {
    const tex = signTexture(text);
    const sign = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.36, 0.03), [poleM, poleM, poleM, poleM, new THREE.MeshLambertMaterial({ map: tex, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 0.35 }), new THREE.MeshLambertMaterial({ map: tex, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 0.35 })]);
    sign.position.set(x, y, z);
    sign.rotation.y = ry;
    group.add(sign);
  };
  const corner = (x, z, cross, ave) => {
    b.add(new THREE.CylinderGeometry(0.07, 0.08, 4.2, 8), poleM, x, SIDEWALK + 2.1, z);
    blade(cross, x, SIDEWALK + 4.0, z, Math.PI / 2); // вдоль поперечной улицы
    blade(ave, x, SIDEWALK + 3.55, z, 0); // вдоль авеню
  };
  corner(AVE.west + 0.6, -38 + STREET_W / 2 + 0.8, 'W 45 St', '7 Av');
  corner(AVE.west + 0.6, 40 - STREET_W / 2 - 0.8, 'W 46 St', 'Broadway');
  corner(PLAZA.west - 0.6, -38 + STREET_W / 2 + 0.8, 'W 45 St', 'Broadway');
  corner(AVE.west + 0.6, -96 + STREET_W / 2 + 0.8, 'W 44 St', '7 Av');
  // Светофоры на консолях над авеню и пешеходные сигналы
  const head = lambert(0xd4a20f);
  const red = new THREE.MeshBasicMaterial({ color: 0x3a0a0a });
  const greenOn = new THREE.MeshBasicMaterial({ color: 0x3dff8a });
  const handTex = signalTexture('hand');
  const walkTex = signalTexture('walk');
  for (const s of STREETS) {
    const z = s.z + STREET_W / 2 + 0.8;
    const x = AVE.west + 0.4;
    b.add(new THREE.CylinderGeometry(0.12, 0.14, 7.2, 10), poleM, x, SIDEWALK + 3.6, z);
    b.box(15, 0.18, 0.18, poleM, x - 7.5, SIDEWALK + 6.9, z);
    for (const lx of [-4.5, -9, -13.5]) {
      b.box(0.42, 1.25, 0.38, head, x + lx, SIDEWALK + 6.2, z);
      b.add(new THREE.CircleGeometry(0.12, 10), red, x + lx, SIDEWALK + 6.6, z - 0.2, Math.PI);
      b.add(new THREE.CircleGeometry(0.12, 10), greenOn, x + lx, SIDEWALK + 5.8, z - 0.2, Math.PI);
    }
    // пешеходный сигнал на столбе — к площади «рука», к авеню «человечек»
    const box2 = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.42, 0.3), [poleM, poleM, poleM, poleM, new THREE.MeshBasicMaterial({ map: walkTex }), new THREE.MeshBasicMaterial({ map: handTex })]);
    box2.position.set(x, SIDEWALK + 2.9, z - 0.25);
    group.add(box2);
  }
  // Фонари вдоль площади и авеню
  const lampM = new THREE.MeshBasicMaterial({ color: 0xffe2a8 });
  for (const x of [AVE.west + 0.5, AVE.east - 0.6, PLAZA.west - 0.4]) {
    for (let z = 34; z > -300; z -= 26) {
      if (Math.abs(z) < 4) continue;
      b.add(new THREE.CylinderGeometry(0.08, 0.1, 8, 8), poleM, x, SIDEWALK + 4, z);
      b.box(0.7, 0.14, 0.32, lampM, x + (x > 0 ? -0.4 : 0.4), SIDEWALK + 7.9, z);
    }
  }
  // Вход в метро: зелёные перила, два зелёных фонаря-шара, табличка с линиями
  const rail = lambert(0x1d4a35);
  const subway = { x: 7.2, z: -12 };
  for (const dx of [0, 2.4]) b.box(0.07, 1.0, 4.4, rail, subway.x + dx, SIDEWALK + 0.5, subway.z);
  b.box(2.4, 1.0, 0.07, rail, subway.x + 1.2, SIDEWALK + 0.5, subway.z + 2.2);
  b.box(2.3, 0.05, 4.2, lambert(0x101012), subway.x + 1.2, SIDEWALK + 0.03, subway.z);
  for (const dx of [0, 2.4]) {
    b.add(new THREE.CylinderGeometry(0.05, 0.05, 2.3, 8), rail, subway.x + dx, SIDEWALK + 1.15, subway.z - 2.2);
    b.add(new THREE.IcosahedronGeometry(0.2, 1), new THREE.MeshBasicMaterial({ color: 0x55ff99 }), subway.x + dx, SIDEWALK + 2.4, subway.z - 2.2);
  }
  const ssign = new THREE.Mesh(new THREE.PlaneGeometry(2.3, 0.86), new THREE.MeshBasicMaterial({ map: subwaySignTexture(), side: THREE.DoubleSide }));
  ssign.position.set(subway.x + 1.2, SIDEWALK + 1.6, subway.z - 2.22);
  group.add(ssign);
  // Паровая труба посреди авеню: оранжевая в белую полоску
  const stackPos = new THREE.Vector3(-15.5, 0, -24);
  for (let i = 0; i < 6; i++) {
    b.add(new THREE.CylinderGeometry(0.42 - i * 0.03, 0.45 - i * 0.03, 0.42, 14), i % 2 ? lambert(0xf4f1ea) : lambert(0xf26b1d), stackPos.x, 0.21 + i * 0.42, stackPos.z);
  }
  const steamTex = canvasTexture(64, 64, (ctx, w, h) => {
    const g = ctx.createRadialGradient(w / 2, h / 2, 2, w / 2, h / 2, w / 2);
    g.addColorStop(0, 'rgba(255,255,255,0.85)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  });
  const steam = [];
  for (let k = 0; k < 34; k++) {
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: steamTex, color: 0xb9bcc4, transparent: true, depthWrite: false, opacity: 0.3 }));
    group.add(sp);
    steam.push({ sp, phase: k / 34, drift: (r() - 0.5) * 2 });
  }
  // Тележка с хот-догами под полосатым зонтом
  const cart = { x: -7.2, z: -9 };
  const steel = lambert(0xc9ccd2);
  b.box(2.0, 1.0, 1.0, steel, cart.x, SIDEWALK + 0.75, cart.z);
  b.box(2.1, 0.05, 1.1, lambert(0x8a8d94), cart.x, SIDEWALK + 1.27, cart.z);
  for (const dx of [-0.7, 0.7]) b.add(new THREE.CylinderGeometry(0.22, 0.22, 0.08, 10), lambert(0x111111), cart.x + dx, SIDEWALK + 0.22, cart.z + 0.52, 0, Math.PI / 2);
  b.add(new THREE.CylinderGeometry(0.03, 0.03, 1.4, 6), poleM, cart.x, SIDEWALK + 1.95, cart.z);
  const umbTex = canvasTexture(256, 32, (ctx, w, h) => {
    for (let i = 0; i < 8; i++) {
      ctx.fillStyle = i % 2 ? '#f5c518' : '#1f5fb8';
      ctx.fillRect((i * w) / 8, 0, w / 8, h);
    }
  });
  const umb = new THREE.Mesh(new THREE.ConeGeometry(1.4, 0.55, 16, 1, true), new THREE.MeshLambertMaterial({ map: umbTex, side: THREE.DoubleSide }));
  umb.position.set(cart.x, SIDEWALK + 2.75, cart.z);
  group.add(umb);
  // Гранитные скамейки, тумбы вдоль авеню, зелёные урны-корзины
  const granite = lambert(0x5c5d63);
  for (const [x, z, len] of [[-4.6, -22, 9], [-4.6, 9, 7], [6.2, 6, 9], [6.2, -30, 6], [-4.6, -52, 10], [6.2, -60, 10]]) b.box(0.9, 0.45, len, granite, x, SIDEWALK + 0.225, z);
  for (let z = 34; z > -140; z -= 1.8) if (STREETS.every((s) => Math.abs(z - s.z) > STREET_W / 2 + 1)) b.add(new THREE.CylinderGeometry(0.11, 0.12, 0.9, 8), ironM, AVE.west + 0.45, SIDEWALK + 0.45, z);
  const basket = lambert(0x2f6b3b);
  for (const [x, z] of [[-8.9, -3.5], [11.8, -6], [-8.9, -33], [11.8, 14]]) b.add(new THREE.CylinderGeometry(0.33, 0.27, 0.9, 10, 1, true), basket, x, SIDEWALK + 0.45, z);

  b.build(group);

  // --- люди и машины --------------------------------------------------------
  const crowd = buildCrowd(r, { steps: STEPS, cart, plaza: SIDEWALK });
  group.add(crowd.group);
  const fleet = buildFleet(SCENE, r);
  group.add(fleet.group);

  // Цветной свет от экранов на площадь и свет фонаря рядом с героем
  const lights = [];
  for (const [x, y, z, c, i] of [[12, 14, -20, 0xff4fa0, 60], [-30, 14, -12, 0x3fd8ff, 70], [-1, 30, -150, 0xffc070, 120], [12, 12, 30, 0x9b7bff, 50]]) {
    const l = new THREE.PointLight(c, i, 70, 1.2);
    l.position.set(x, y, z);
    group.add(l);
    lights.push(l);
  }
  const near = new THREE.PointLight(0xffdcae, 8, 22, 1.1);
  near.position.set(-3, 7, -4);
  group.add(near);
  lights.push(near);

  return { group, skyMesh, screens, screenMeshes, ticker: ots.ticker, ball: ots.ball, steam, stackPos, crowd, fleet, lights: lights.map((l) => [l, l.intensity]) };
}

export function updateCity(city, t, depth, camPos) {
  city.skyMesh.position.copy(camPos);
  // цветной свет экранов не проникает в шахту люка: внизу его гасим, иначе он красит кирпич и воду
  const open = 1 - Math.min(1, Math.max(0, (SIDEWALK - camPos.y) / 0.8));
  for (const [l, i] of city.lights) l.intensity = i * open;
  for (const s of city.screens.pool) s.tex.offset.x = t * s.speed;
  city.ticker.offset.x = -t * 0.06;
  city.ball.rotation.y = t * 0.4;
  for (const s of city.steam) {
    const age = (t * 0.32 + s.phase) % 1;
    s.sp.position.set(city.stackPos.x + s.drift * age * 1.4, 2.6 + age * 7, city.stackPos.z - age * 1.2);
    s.sp.scale.setScalar(0.6 + age * 4.2);
    s.sp.material.opacity = 0.3 * Math.sin(Math.PI * age) ** 0.8;
  }
  updateFleet(city.fleet, t);
  updateCrowd(city.crowd, t, CRACK);
}
