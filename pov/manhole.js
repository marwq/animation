// Люк посреди площади, шахта под ним и кирпичный коллектор.
// Герой стоит на чугунной крышке; на CRACK она лязгает и проседает, потом медленно уходит вниз
// вместе с ним: сквозь бетонный ворот и кирпичную шахту со скобами-ступенями — в коллектор,
// где по лотку течёт вода, горят лампы в решётках, из трубы в стене льётся струя, бегает крыса.
// Всё, что звучит (капли, струя, крыса, всплеск), задано в scene.json — оттуда же берёт звук.
import * as THREE from 'three';
import { canvasTexture, rng, smooth } from './util.js';
import { CRACK, MANHOLE as M, PLAYER, SIDEWALK, UNDER, depthAt } from './timeline.js';

const COLLAR = -0.35; // низ бетонного ворота под крышкой
const CONE = -1.0; // низ конуса: дальше шахта шире
const SHAFT_BOTTOM = M.crown - 0.25; // шахта чуть выступает из свода коллектора
const BENCH = -4.45; // верх полок вдоль лотка
const WALL_X = 1.3; // стены коллектора
const SPRING = -3.4; // пята свода
const G = 9.81;

// Поверхность под каплей: вода в лотке или полка
const floorAt = (x) => (Math.abs(x) < 0.62 ? M.water : BENCH);
const archAt = (x) => SPRING + 0.8 * Math.sqrt(Math.max(0, 1 - (x / WALL_X) ** 2));

// --- текстуры ---------------------------------------------------------------

// Крышка люка: надпись по кругу, вафельная решётка, два отверстия под крюк. Вторая копия — карта рельефа.
function coverTexture(bump) {
  const tex = canvasTexture(512, 512, (ctx, w) => {
    const c = w / 2;
    const r = rng(5);
    const disc = (rad, fill) => {
      ctx.fillStyle = fill;
      ctx.beginPath();
      ctx.arc(c, c, rad, 0, Math.PI * 2);
      ctx.fill();
    };
    const raised = bump ? '#d0d0d0' : '#6b6b72';
    const low = bump ? '#3a3a3a' : '#2a2a2f';
    disc(c, raised); // внешний обод, натёртый подошвами
    disc(c * 0.93, low);
    disc(c * 0.71, raised);
    disc(c * 0.67, low);
    // вафельная решётка в центре
    ctx.save();
    ctx.beginPath();
    ctx.arc(c, c, c * 0.64, 0, Math.PI * 2);
    ctx.clip();
    const cell = w * 0.058;
    for (let y = c - c; y < w; y += cell) {
      for (let x = 0; x < w; x += cell) {
        ctx.fillStyle = bump ? '#bdbdbd' : `hsl(240, 3%, ${36 + r() * 10}%)`;
        ctx.fillRect(x + cell * 0.16, y + cell * 0.16, cell * 0.68, cell * 0.68);
      }
    }
    ctx.restore();
    // надпись в поясе: сверху NEW YORK CITY, снизу SEWER
    ctx.fillStyle = raised;
    ctx.font = `700 ${Math.round(w * 0.085)}px "Space Grotesk", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const arc = (text, mid, span, top) => {
      const chars = [...text];
      chars.forEach((ch, i) => {
        const k = chars.length === 1 ? 0.5 : i / (chars.length - 1);
        const a = top ? mid - span / 2 + span * k : mid + span / 2 - span * k;
        ctx.save();
        ctx.translate(c + Math.cos(a) * c * 0.82, c + Math.sin(a) * c * 0.82);
        ctx.rotate(top ? a + Math.PI / 2 : a - Math.PI / 2);
        ctx.fillText(ch, 0, 0);
        ctx.restore();
      });
    };
    arc('NEW YORK CITY', -Math.PI / 2, 2.35, true);
    arc('SEWER', Math.PI / 2, 1.05, false);
    for (const a of [Math.PI * 0.12, Math.PI * 0.88]) {
      ctx.save();
      ctx.translate(c + Math.cos(a) * c * 0.82, c + Math.sin(a) * c * 0.82);
      ctx.rotate(a + Math.PI / 4);
      ctx.fillRect(-w * 0.012, -w * 0.012, w * 0.024, w * 0.024);
      ctx.restore();
    }
    // отверстия под крюк
    ctx.fillStyle = bump ? '#000' : '#0b0b0c';
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.ellipse(c + s * c * 0.5, c, w * 0.022, w * 0.012, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    if (!bump) {
      // ржавые крапины и потёртости
      for (let i = 0; i < 900; i++) {
        const a = r() * Math.PI * 2;
        const d = Math.sqrt(r()) * c;
        ctx.fillStyle = r() < 0.5 ? 'rgba(110, 72, 48, 0.25)' : 'rgba(150, 150, 158, 0.18)';
        ctx.fillRect(c + Math.cos(a) * d, c + Math.sin(a) * d, 2 + r() * 3, 2 + r() * 3);
      }
    }
  });
  if (bump) tex.colorSpace = THREE.NoColorSpace;
  return tex;
}

// Кирпич 1 × 1 м: тычковая перевязка, тёмный раствор, потёки и белёсые высолы
function brickTexture(seed, dark) {
  const r = rng(seed);
  const tex = canvasTexture(256, 256, (ctx, w, h) => {
    ctx.fillStyle = dark ? '#2f2a26' : '#3d3631';
    ctx.fillRect(0, 0, w, h);
    const rows = 12;
    const bh = h / rows;
    const bw = w / 4;
    const tones = dark ? ['#4a2c22', '#3f261e', '#55322a', '#3a2620', '#4e3428'] : ['#6e3b2c', '#5c3226', '#7a4532', '#4e2c22', '#69402f'];
    for (let y = 0; y < rows; y++) {
      const off = y % 2 ? bw / 2 : 0;
      for (let x = -1; x < 5; x++) {
        ctx.fillStyle = tones[Math.floor(r() * tones.length)];
        ctx.fillRect(x * bw + off + 2, y * bh + 2, bw - 4, bh - 4);
      }
    }
    for (let i = 0; i < 22; i++) {
      const x = r() * w;
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, 'rgba(10, 12, 8, 0)');
      g.addColorStop(r(), 'rgba(10, 12, 8, 0.35)');
      g.addColorStop(1, 'rgba(10, 12, 8, 0)');
      ctx.fillStyle = g;
      ctx.fillRect(x, 0, 3 + r() * 8, h);
    }
    for (let i = 0; i < 40; i++) {
      ctx.fillStyle = 'rgba(200, 196, 180, 0.12)';
      ctx.beginPath();
      ctx.arc(r() * w, r() * h, 2 + r() * 6, 0, Math.PI * 2);
      ctx.fill();
    }
  });
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

function concreteTexture(seed, base) {
  const r = rng(seed);
  const tex = canvasTexture(128, 128, (ctx, w, h) => {
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 500; i++) {
      ctx.fillStyle = `rgba(${r() < 0.5 ? '0,0,0' : '255,255,255'}, ${0.03 + r() * 0.05})`;
      ctx.fillRect(r() * w, r() * h, 1 + r() * 3, 1 + r() * 3);
    }
  });
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

// Рябь на воде: сумма синусов с целыми частотами (бесшовно), высоты → нормали
function rippleNormals() {
  const n = 128;
  const hgt = new Float32Array(n * n);
  const waves = [[3, 1, 0.5, 0], [1, 4, 0.35, 1.3], [5, -2, 0.22, 2.1], [-2, 7, 0.16, 0.4], [7, 3, 0.1, 2.8], [2, 11, 0.08, 1.7]];
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      let v = 0;
      for (const [a, b, amp, ph] of waves) v += amp * Math.sin((2 * Math.PI * (a * x + b * y)) / n + ph);
      hgt[y * n + x] = v;
    }
  }
  const tex = canvasTexture(n, n, (ctx) => {
    const img = ctx.createImageData(n, n);
    for (let y = 0; y < n; y++) {
      for (let x = 0; x < n; x++) {
        const dx = hgt[y * n + ((x + 1) % n)] - hgt[y * n + ((x + n - 1) % n)];
        const dy = hgt[((y + 1) % n) * n + x] - hgt[((y + n - 1) % n) * n + x];
        const v = new THREE.Vector3(-dx * 1.6, -dy * 1.6, 1).normalize();
        const i = (y * n + x) * 4;
        img.data[i] = (v.x * 0.5 + 0.5) * 255;
        img.data[i + 1] = (v.y * 0.5 + 0.5) * 255;
        img.data[i + 2] = (v.z * 0.5 + 0.5) * 255;
        img.data[i + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
  });
  tex.colorSpace = THREE.NoColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

function softDot(inner, outer) {
  return canvasTexture(64, 64, (ctx, w) => {
    const g = ctx.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2);
    g.addColorStop(0, inner);
    g.addColorStop(1, outer);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, w);
  });
}

function streamTexture() {
  const r = rng(9);
  const tex = canvasTexture(32, 128, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    for (let i = 0; i < 26; i++) {
      ctx.fillStyle = `rgba(235, 240, 230, ${0.25 + r() * 0.5})`;
      ctx.fillRect(r() * w, r() * h, 1 + r() * 3, 10 + r() * 40);
    }
  });
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

// --- геометрия ---------------------------------------------------------------

// Открытый цилиндр (или конус) шахты: кирпич изнутри, к низу темнее и мокрее
function shaftPiece(top, bottom, rTop, rBot, map, tileH, dark, side = THREE.BackSide) {
  const h = top - bottom;
  const geo = new THREE.CylinderGeometry(rTop, rBot, h, 44, Math.max(2, Math.round(h * 6)), true);
  const tex = map.clone();
  tex.needsUpdate = true;
  tex.repeat.set((Math.PI * (rTop + rBot)) / 1, h / tileH);
  const p = geo.attributes.position;
  const colors = [];
  for (let i = 0; i < p.count; i++) {
    const y = p.getY(i) + (top + bottom) / 2;
    const a = Math.atan2(p.getZ(i), p.getX(i));
    const k = 1 - 0.62 * smooth((SIDEWALK - y) / (SIDEWALK - SHAFT_BOTTOM)) * dark;
    const wet = 0.9 + 0.1 * Math.sin(a * 7 + y * 3.1);
    colors.push(k * wet, k * wet, k * (wet + 0.02));
  }
  geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  const mesh = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ map: tex, vertexColors: true, side }));
  mesh.position.set(PLAYER.x, (top + bottom) / 2, PLAYER.z);
  return mesh;
}

// Вытягивание профиля коллектора вдоль Z. Нормали — внутрь тоннеля, плавные по профилю.
function extrude(pts, zs, material, { skip, tile = 1, tint } = {}) {
  const acc = [0];
  for (let i = 1; i < pts.length; i++) acc.push(acc[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const nrm = pts.map((p, i) => {
    const a = pts[Math.max(0, i - 1)];
    const b = pts[Math.min(pts.length - 1, i + 1)];
    const v = new THREE.Vector3(-(b[1] - a[1]), b[0] - a[0], 0).normalize();
    const toC = new THREE.Vector3(-p[0], -3.7 - p[1], 0);
    return v.dot(toC) < 0 ? v.negate() : v;
  });
  const pos = [];
  const nor = [];
  const uv = [];
  const col = [];
  const c = new THREE.Color();
  const push = (i, z) => {
    pos.push(pts[i][0] + PLAYER.x, pts[i][1], z + PLAYER.z);
    nor.push(nrm[i].x, nrm[i].y, 0);
    uv.push(acc[i] / tile, z / tile);
    tint(c, pts[i][0], pts[i][1], z);
    col.push(c.r, c.g, c.b);
  };
  for (let j = 0; j < zs.length - 1; j++) {
    for (let i = 0; i < pts.length - 1; i++) {
      const cx = (pts[i][0] + pts[i + 1][0]) / 2;
      const cy = (pts[i][1] + pts[i + 1][1]) / 2;
      const cz = (zs[j] + zs[j + 1]) / 2;
      if (skip && skip(cx, cy, cz)) continue;
      // треугольники развёрнуты лицом внутрь тоннеля
      const quad = [[i, j], [i + 1, j], [i + 1, j + 1], [i, j], [i + 1, j + 1], [i, j + 1]];
      const a = new THREE.Vector3(pts[i][0], pts[i][1], zs[j]);
      const b = new THREE.Vector3(pts[i + 1][0], pts[i + 1][1], zs[j]);
      const d = new THREE.Vector3(pts[i][0], pts[i][1], zs[j + 1]);
      const face = b.clone().sub(a).cross(d.clone().sub(a));
      const flip = face.dot(nrm[i]) < 0;
      const order = flip ? [0, 2, 1, 3, 5, 4] : [0, 1, 2, 3, 4, 5];
      for (const k of order) push(quad[k][0], zs[quad[k][1]]);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  return new THREE.Mesh(geo, material);
}

function cageLamp(group, x, z, glowTex) {
  const y = -3.35;
  const s = Math.sign(x);
  const iron = new THREE.MeshLambertMaterial({ color: 0x2a2a2c });
  const bracket = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.03, 0.05), iron);
  bracket.position.set(PLAYER.x + x + s * 0.07, y + 0.07, PLAYER.z + z);
  group.add(bracket);
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.045, 12, 8), new THREE.MeshBasicMaterial({ color: 0xffe2b0 }));
  bulb.position.set(PLAYER.x + x, y, PLAYER.z + z);
  group.add(bulb);
  for (const ry of [0, Math.PI / 2]) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.065, 0.005, 4, 16), iron);
    ring.position.copy(bulb.position);
    ring.rotation.y = ry;
    group.add(ring);
  }
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0xffc98a, transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending }));
  glow.position.copy(bulb.position);
  glow.scale.setScalar(0.55);
  group.add(glow);
}

function buildRat() {
  const fur = new THREE.MeshLambertMaterial({ color: 0x75665a });
  const pinkM = new THREE.MeshLambertMaterial({ color: 0xb98a80 });
  const rat = new THREE.Group();
  const bodyM = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 8), fur);
  bodyM.scale.set(0.05, 0.042, 0.085);
  bodyM.position.y = 0.045;
  rat.add(bodyM);
  const head = new THREE.Mesh(new THREE.ConeGeometry(0.032, 0.08, 10), fur);
  head.rotation.x = -Math.PI / 2;
  head.position.set(0, 0.05, -0.11);
  rat.add(head);
  for (const s of [-1, 1]) {
    const ear = new THREE.Mesh(new THREE.CircleGeometry(0.014, 8), pinkM);
    ear.position.set(s * 0.022, 0.078, -0.085);
    ear.rotation.y = s * 0.4;
    rat.add(ear);
  }
  for (const s of [-1, 1]) {
    const eyeM = new THREE.Mesh(new THREE.SphereGeometry(0.006, 6, 4), new THREE.MeshBasicMaterial({ color: 0xf2efe6 }));
    eyeM.position.set(s * 0.02, 0.064, -0.112);
    rat.add(eyeM);
  }
  const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.007, 0.2, 5), pinkM);
  tail.rotation.x = Math.PI / 2 - 0.25;
  tail.position.set(0, 0.025, 0.17);
  rat.add(tail);
  return { rat, head };
}

// --- сборка -----------------------------------------------------------------

export function buildManhole() {
  const group = new THREE.Group(); // крышка, рама, шахта — видны всегда, пока глаза над водой
  const sewer = new THREE.Group(); // коллектор — только когда глаза ниже свода

  // Крышка и рама
  const coverMat = new THREE.MeshStandardMaterial({ map: coverTexture(false), bumpMap: coverTexture(true), bumpScale: 2.2, roughness: 0.58, metalness: 0.22 });
  const sideMat = new THREE.MeshStandardMaterial({ color: 0x2b2b2f, roughness: 0.7, metalness: 0.2 });
  const cover = new THREE.Mesh(new THREE.CylinderGeometry(M.radius - 0.004, M.radius - 0.004, 0.06, 64), [sideMat, coverMat, sideMat]);
  cover.rotation.y = Math.PI / 2; // надпись читается от героя: «NEW YORK CITY» впереди
  group.add(cover);
  const frame = new THREE.Mesh(new THREE.RingGeometry(M.radius, M.radius + 0.09, 64), new THREE.MeshStandardMaterial({ color: 0x3d3d42, roughness: 0.55, metalness: 0.3 }));
  frame.rotation.x = -Math.PI / 2;
  frame.position.set(PLAYER.x, SIDEWALK + 0.004, PLAYER.z);
  group.add(frame);

  // Шахта: чугунный обод и бетонный ворот, кирпичный конус, широкая кирпичная труба
  const concrete = concreteTexture(3, '#6d6a66');
  const brick = brickTexture(7, false);
  group.add(shaftPiece(SIDEWALK, SIDEWALK - 0.06, M.radius, M.radius, concreteTexture(4, '#3b3b3f'), 0.5, 0.3));
  group.add(shaftPiece(SIDEWALK - 0.06, COLLAR, M.radius, M.radius, concrete, 1, 0.6));
  group.add(shaftPiece(COLLAR, CONE, M.radius, M.shaft_radius, brick, 1, 1));
  group.add(shaftPiece(CONE, SHAFT_BOTTOM, M.shaft_radius, M.shaft_radius, brick, 1, 1, THREE.DoubleSide));

  // Скобы-ступени на дальней стене, кабели по левой, ржавый патрубок справа
  const rust = new THREE.MeshLambertMaterial({ color: 0x6b4a33 });
  const zw = PLAYER.z - M.shaft_radius;
  for (let y = CONE - 0.15; y > M.crown + 0.1; y -= 0.3) {
    const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.34, 6), rust);
    bar.rotation.z = Math.PI / 2;
    bar.position.set(PLAYER.x, y, zw + 0.13);
    group.add(bar);
    for (const s of [-1, 1]) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.013, 0.013, 0.14, 6), rust);
      leg.rotation.x = Math.PI / 2;
      leg.position.set(PLAYER.x + s * 0.17, y, zw + 0.06);
      group.add(leg);
    }
  }
  const cableM = new THREE.MeshLambertMaterial({ color: 0x141518 });
  for (let k = 0; k < 3; k++) {
    const cable = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, CONE - SHAFT_BOTTOM, 6), cableM);
    const a = Math.PI + 0.15 - k * 0.07;
    cable.position.set(PLAYER.x + Math.cos(a) * (M.shaft_radius - 0.03), (CONE + SHAFT_BOTTOM) / 2, PLAYER.z + Math.sin(a) * (M.shaft_radius - 0.03));
    group.add(cable);
  }
  for (let y = CONE - 0.2; y > SHAFT_BOTTOM; y -= 0.45) {
    const clip = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.03, 0.2), new THREE.MeshLambertMaterial({ color: 0x5a5c60 }));
    clip.position.set(PLAYER.x - M.shaft_radius + 0.04, y, PLAYER.z - 0.07);
    group.add(clip);
  }
  const [px, py, pz] = M.shaft_pipe;
  const stub = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.22, 14, 1, true), new THREE.MeshLambertMaterial({ color: 0x5e3f2b, side: THREE.DoubleSide }));
  stub.rotation.z = Math.PI / 2;
  stub.position.set(PLAYER.x + px - 0.08, py, PLAYER.z + pz);
  group.add(stub);
  const stubHole = new THREE.Mesh(new THREE.CircleGeometry(0.075, 14), new THREE.MeshBasicMaterial({ color: 0x0a0807 }));
  stubHole.rotation.y = -Math.PI / 2;
  stubHole.position.set(PLAYER.x + px - 0.15, py, PLAYER.z + pz);
  group.add(stubHole);

  // Свет сверху, из люка: холодные сумерки льются в шахту и пятном ложатся на воду коллектора
  const skyLight = new THREE.SpotLight(0x8e9ad0, 0, 9, 0.42, 0.9, 1.3);
  skyLight.position.set(PLAYER.x, SIDEWALK + 0.6, PLAYER.z);
  skyLight.target.position.set(PLAYER.x, M.water, PLAYER.z);
  group.add(skyLight, skyLight.target);

  // Пар из-под крышки: на лязге — клуб, пока крышка оседает — струйки по кругу
  const steamTex = softDot('rgba(255,255,255,0.9)', 'rgba(255,255,255,0)');
  const steam = [];
  const sr = rng(13);
  for (let k = 0; k < 12; k++) {
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: steamTex, color: 0xc4c6cc, transparent: true, depthWrite: false, opacity: 0 }));
    group.add(sp);
    steam.push({ sp, a: sr() * Math.PI * 2, phase: sr(), drift: 0.6 + sr() * 0.8 });
  }

  // --- коллектор ---
  const half = [[0, M.invert], [0.32, M.invert + 0.03], [0.52, M.invert + 0.14], [0.62, M.water], [0.66, BENCH]];
  const channel = [...half.slice(1).reverse().map(([x, y]) => [-x, y]), ...half];
  const benchR = [[0.66, BENCH], [WALL_X, BENCH]];
  const benchL = benchR.map(([x, y]) => [-x, y]).reverse();
  const arch = [];
  for (let k = 0; k <= 22; k++) {
    const th = (k / 22) * Math.PI;
    arch.push([WALL_X * Math.cos(th), SPRING + 0.8 * Math.sin(th)]);
  }
  const brickWall = [[WALL_X, BENCH], [WALL_X, -4.0], ...arch, [-WALL_X, -4.0], [-WALL_X, BENCH]];
  const zs = [];
  for (let z = 30; z > 2; z -= 2) zs.push(z);
  for (let z = 2; z > -2; z -= 0.1) zs.push(Math.round(z * 100) / 100);
  for (let z = -2; z >= -72; z -= 2) zs.push(z);
  zs.reverse();

  const grime = (c, x, y, z) => {
    const n = 0.86 + 0.14 * Math.sin(z * 0.9 + x * 2) * Math.sin(z * 0.37 + 1.1);
    const wet = y < -4.15 ? 0.55 : y < -3.9 ? 0.75 : 1;
    c.setRGB(n * wet, n * wet * (y < -4.15 ? 1.05 : 1), n * wet * 0.95);
  };
  const brickMat = new THREE.MeshLambertMaterial({ map: brickTexture(17, true), vertexColors: true, side: THREE.DoubleSide });
  brickMat.map.repeat.set(1, 1);
  sewer.add(extrude(brickWall, zs, brickMat, { tint: grime, skip: (x, y, z) => y > -3.25 && x * x + z * z < 0.7 * 0.7 }));
  const benchMat = new THREE.MeshLambertMaterial({ map: concreteTexture(21, '#5b5a52'), vertexColors: true, side: THREE.DoubleSide });
  const benchTint = (c, x, y, z) => c.setScalar(0.8 + 0.2 * Math.sin(z * 1.3 + x));
  sewer.add(extrude(benchR, zs, benchMat, { tint: benchTint }));
  sewer.add(extrude(benchL, zs, benchMat, { tint: benchTint }));
  const slime = new THREE.MeshLambertMaterial({ map: concreteTexture(22, '#2e3226'), vertexColors: true, side: THREE.DoubleSide });
  sewer.add(extrude(channel, zs, slime, { tint: (c, x, y) => c.setRGB(0.72, 0.78 + (y > M.water ? 0.06 : 0), 0.66) }));

  // Вода в лотке: мутная, течёт вперёд (к -Z), блики от ламп
  const normals = rippleNormals();
  normals.repeat.set(1.3, 100);
  const water = new THREE.Mesh(
    new THREE.PlaneGeometry(1.25, 102),
    new THREE.MeshPhongMaterial({ color: 0x2f3324, specular: 0x5d6a5e, shininess: 90, normalMap: normals, normalScale: new THREE.Vector2(0.55, 0.55), transparent: true, opacity: 0.84, side: THREE.DoubleSide })
  );
  water.rotation.x = -Math.PI / 2;
  water.position.set(PLAYER.x, M.water, PLAYER.z - 21);
  sewer.add(water);
  const floaters = [];
  const fr = rng(31);
  for (let k = 0; k < 9; k++) {
    const leaf = new THREE.Mesh(new THREE.CircleGeometry(0.03 + fr() * 0.04, 6), new THREE.MeshLambertMaterial({ color: [0x6b5a3a, 0xd8d4c4, 0x4f4a32][k % 3], side: THREE.DoubleSide }));
    leaf.rotation.x = -Math.PI / 2;
    sewer.add(leaf);
    floaters.push({ leaf, x: (fr() - 0.5) * 0.9, z0: fr() * 28, speed: 0.45 + fr() * 0.25 });
  }

  // Лампы в решётках по стенам, у ближних — настоящий свет
  const glowTex = softDot('rgba(255,255,255,1)', 'rgba(255,255,255,0)');
  for (const z of [-4.5, -16.5, -28.5, -40.5, 7.5]) cageLamp(sewer, -WALL_X + 0.08, z, glowTex);
  for (const z of [-2.2, -10.5, -22.5, -34.5, 4.0]) cageLamp(sewer, WALL_X - 0.08, z, glowTex);
  for (const [x, z, i, d] of [[-1.1, -4.5, 4, 10], [1.1, -2.2, 2.6, 6], [1.1, -10.5, 3, 12], [1.1, 4.0, 2.4, 8], [-1.1, -16.5, 3, 14]]) {
    const l = new THREE.PointLight(0xffc98a, i, d, 1.5);
    l.position.set(PLAYER.x + x, -3.35, PLAYER.z + z);
    sewer.add(l);
  }

  // Труба-выпуск в левой стене и струя из неё в лоток
  const [ix, iy, iz] = M.inlet;
  const inlet = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.2, 18, 1, true), new THREE.MeshLambertMaterial({ color: 0x4a3a2c, side: THREE.DoubleSide }));
  inlet.rotation.z = Math.PI / 2;
  inlet.position.set(PLAYER.x + ix + 0.07, iy, PLAYER.z + iz);
  sewer.add(inlet);
  const inletHole = new THREE.Mesh(new THREE.CircleGeometry(0.19, 18), new THREE.MeshBasicMaterial({ color: 0x080706 }));
  inletHole.rotation.y = Math.PI / 2;
  inletHole.position.set(PLAYER.x + ix + 0.02, iy, PLAYER.z + iz);
  sewer.add(inletHole);
  const streamTex = streamTexture();
  const sPos = [];
  const sUv = [];
  const steps = 14;
  for (let k = 0; k <= steps; k++) {
    const s = k / steps;
    const x = ix + 0.18 + 0.55 * s;
    const y = iy - 0.06 - (iy - 0.06 - M.water) * s * s;
    for (const dz of [-0.075, 0.075]) {
      sPos.push(PLAYER.x + x, y, PLAYER.z + iz + dz);
      sUv.push(dz > 0 ? 1 : 0, 1 - s * 2);
    }
  }
  const sIdx = [];
  for (let k = 0; k < steps; k++) sIdx.push(2 * k, 2 * k + 1, 2 * k + 2, 2 * k + 1, 2 * k + 3, 2 * k + 2);
  const sGeo = new THREE.BufferGeometry();
  sGeo.setAttribute('position', new THREE.Float32BufferAttribute(sPos, 3));
  sGeo.setAttribute('uv', new THREE.Float32BufferAttribute(sUv, 2));
  sGeo.setIndex(sIdx);
  const stream = new THREE.Mesh(sGeo, new THREE.MeshBasicMaterial({ map: streamTex, color: 0xd6dccd, transparent: true, opacity: 0.85, side: THREE.DoubleSide, depthWrite: false }));
  sewer.add(stream);
  const foam = new THREE.Mesh(new THREE.CircleGeometry(0.12, 16), new THREE.MeshBasicMaterial({ map: steamTex, color: 0xd8dcd0, transparent: true, opacity: 0.5, depthWrite: false }));
  foam.rotation.x = -Math.PI / 2;
  foam.position.set(PLAYER.x + ix + 0.73, M.water + 0.004, PLAYER.z + iz);
  sewer.add(foam);

  // Крыса на правой полке
  const { rat, head: ratHead } = buildRat();
  sewer.add(rat);

  // Капли со свода и круги на воде
  const dropMat = new THREE.MeshBasicMaterial({ color: 0xcfd8d0, transparent: true, opacity: 0.8 });
  const drops = M.drips.map(([x, z, period, phase]) => {
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.011, 6, 4), dropMat);
    mesh.scale.y = 1.8;
    sewer.add(mesh);
    const top = archAt(x) - 0.02;
    const fall = Math.sqrt((2 * (top - floorAt(x))) / G);
    return { mesh, x, z, period, phase, top, fall };
  });
  const ringGeo = new THREE.RingGeometry(0.9, 1.0, 40);
  const ripples = [];
  for (let k = 0; k < 16; k++) {
    const m = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ color: 0xc9d2c8, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide }));
    m.rotation.x = -Math.PI / 2;
    sewer.add(m);
    ripples.push(m);
  }
  // Капля из патрубка в шахте
  const stubDrop = new THREE.Mesh(new THREE.SphereGeometry(0.01, 6, 4), dropMat);
  group.add(stubDrop);

  group.add(sewer);
  return { group, sewer, cover, skyLight, steam, water: water.material, floaters, stream: streamTex, foam, rat, ratHead, drops, ripples, stubDrop };
}

// Когда подошвы касаются воды — по ней от тела расходятся круги
export const WATER_T = (() => {
  for (let t = CRACK; t < UNDER; t += 0.005) if (SIDEWALK - depthAt(t) < M.water) return t;
  return UNDER;
})();

export function updateManhole(m, t, depth, eye) {
  // крышка — под подошвами
  m.cover.position.set(PLAYER.x, SIDEWALK - depth - 0.03, PLAYER.z);
  m.cover.visible = SIDEWALK - depth > M.water - 0.3;
  m.skyLight.intensity = 3.2 * smooth((depth - 0.15) / 0.6);

  // пар: клуб на лязге и струйки, пока крышка в вороте; к моменту, когда голова у края, — рассеялся
  for (const s of m.steam) {
    const k = smooth((t - CRACK) / 0.15) * (1 - smooth((t - 15.2) / 0.8));
    const age = ((t - CRACK) * 0.55 + s.phase) % 1;
    const burst = Math.exp(-(t - CRACK) / 0.9);
    const rad = M.radius * (0.75 + 0.4 * age) + s.drift * age * 0.3;
    s.sp.position.set(PLAYER.x + Math.cos(s.a) * rad, SIDEWALK + 0.05 + age * (0.8 + burst * 0.9), PLAYER.z + Math.sin(s.a) * rad);
    s.sp.scale.setScalar(0.25 + age * (0.75 + burst * 0.6));
    s.sp.material.opacity = t > CRACK ? (0.2 + 0.4 * burst) * Math.sin(Math.PI * age) * k : 0;
  }

  // капля из патрубка в шахте — раз в M.stub_drip с
  const sl = (t % M.stub_drip) / M.stub_drip;
  const [px, py, pz] = M.shaft_pipe;
  m.stubDrop.position.set(PLAYER.x + px - 0.15, py - 0.09 - 0.5 * G * (sl * M.stub_drip * 0.6) ** 2, PLAYER.z + pz);
  m.stubDrop.visible = sl < 0.92;

  // коллектор: вода течёт, мусор плывёт, струя льётся
  m.sewer.visible = eye.y < M.crown + 0.6 && eye.y > M.water - 0.8; // ниже воды коллектор растворяется над головой
  if (!m.sewer.visible) return;
  m.water.normalMap.offset.y = t * 0.55;
  for (const f of m.floaters) {
    const z = 8 - ((f.z0 + t * f.speed) % 28);
    f.leaf.position.set(PLAYER.x + f.x, M.water + 0.003, PLAYER.z + z);
  }
  m.stream.offset.y = -t * 2.4;
  m.foam.scale.setScalar(1 + 0.15 * Math.sin(t * 17) + 0.1 * Math.sin(t * 29));

  // крыса: сидит, водит носом; на M.rat.run срывается и убегает вперёд по полке
  const run = Math.max(0, t - M.rat.run);
  const z = M.rat.z0 - M.rat.speed * (run - 0.12 * (1 - Math.exp(-run / 0.12)));
  const hop = run > 0 ? Math.abs(Math.sin(t * 38)) * 0.012 : 0;
  m.rat.position.set(PLAYER.x + M.rat.x, -4.45 + hop, PLAYER.z + z);
  m.rat.rotation.y = run > 0 ? 0 : 0.5 * Math.sin(t * 1.3);
  m.ratHead.rotation.z = run > 0 ? 0 : 0.2 * Math.sin(t * 11);

  // капли: висят, растут, падают; на воде — круг
  let ri = 0;
  const ripple = (x, z, age, size) => {
    if (ri >= m.ripples.length || age < 0 || age > 1) return;
    const r = m.ripples[ri++];
    r.position.set(PLAYER.x + x, M.water + 0.002, PLAYER.z + z);
    r.scale.setScalar(0.03 + size * age);
    r.material.opacity = 0.5 * (1 - age) ** 1.5;
  };
  for (const d of m.drops) {
    const local = (((t - d.phase) % d.period) + d.period) % d.period;
    const hang = d.period - d.fall;
    let y = d.top;
    if (local > hang) y = d.top - 0.5 * G * (local - hang) ** 2;
    d.mesh.position.set(PLAYER.x + d.x, y, PLAYER.z + d.z);
    d.mesh.scale.setScalar(local > hang ? 1 : 0.4 + 0.6 * (local / hang));
    d.mesh.scale.y *= local > hang ? 2.2 : 1;
    if (Math.abs(d.x) < 0.62) ripple(d.x, d.z, local / 0.9, 0.35);
  }
  // круги там, где струя бьёт в воду, и от тела, пока оно уходит в воду
  for (let k = 0; k < 2; k++) ripple(M.inlet[0] + 0.73, M.inlet[2], ((t / 0.7 + k / 2) % 1), 0.4);
  if (t > WATER_T && t < UNDER + 0.2) for (let k = 0; k < 5; k++) ripple(0, 0, ((t - WATER_T) / 1.5 + k / 5) % 1, 0.9);
  for (const r of m.ripples.slice(ri)) r.material.opacity = 0;
}
