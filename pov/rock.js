// Скала под тоннелем метро: манхэттенский сланец с гранатами, кварцевыми жилами и трещиной,
// по которой сочится вода; водовод на глубине ~185 м, ниже — смятый в складки сланец и полосчатый
// фордемский гнейс. Вокруг героя — «пузырь» видимости радиусом ROCK.void_r: стенки скользят вверх.
// На скорости текстура смазывается по вертикали, чтобы не мерцать.
import * as THREE from 'three';
import { canvasTexture, rng, smooth } from './util.js';
import { PLAYER, ROCK } from './timeline.js';

export const R = ROCK.void_r;
const T = ROCK.tunnel;
export const TILE = 9; // метров на повтор текстуры по вертикали
const REP_U = 1; // текстура обходит стенку один раз: наклонный слой на цилиндре — одна синусоида
export const TW = 2048; // ширина текстуры = длина окружности пузыря (2πR ≈ 18.8 м)
export const TH = 1024; // высота = TILE метров
export const PX = TH / TILE; // пикселей на метр

// --- текстуры: бесшовные по обеим осям --------------------------------------
// Слоистость Манхэттена падает круто; наклонная плоскость, рассечённая цилиндром, на развёртке —
// синусоида с одним периодом на всю окружность. Поэтому слои — синусоиды y = y0 + A·sin(2πx/w + φ),
// у каждой ещё своя мелкая волнистость. По вертикали всё рисуется трижды (−h, 0, +h) — без шва.

function layerPath(ctx, w, h, y0, A, phase, wig, wigPhase, dy, x0 = 0, x1 = w) {
  ctx.beginPath();
  for (let x = x0; x <= x1; x += 6) {
    const y = y0 + dy + A * Math.sin((2 * Math.PI * x) / w + phase) + wig * Math.sin((2 * Math.PI * 5 * x) / w + wigPhase) + wig * 0.5 * Math.sin((2 * Math.PI * 13 * x) / w + wigPhase * 1.7);
    if (x === x0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
}

function strokeLayer(ctx, w, h, y0, A, phase, wig, wigPhase, width, color, x0, x1) {
  for (const dy of [-h, 0, h]) {
    layerPath(ctx, w, h, y0, A, phase, wig, wigPhase, dy, x0, x1);
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.stroke();
  }
}

// round — круглые зёрна вместо квадратиков (для глубин, где стенку видно вблизи); раскладка та же
export function speckle(ctx, w, h, r, n, colors, size, round = false) {
  for (let i = 0; i < n; i++) {
    ctx.fillStyle = colors[Math.floor(r() * colors.length)];
    const s = size[0] + r() * (size[1] - size[0]);
    const x = r() * w;
    const y = r() * h;
    if (!round) {
      ctx.fillRect(x, y, s, s);
      continue;
    }
    ctx.beginPath();
    ctx.ellipse(x + s / 2, y + s / 2, s * 0.42, s * 0.3, (i * 2.39996) % Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }
}

// Крупные светлые и тёмные пятна: ломают повтор
export function blotches(ctx, w, h, r, n, colors, rad) {
  for (let k = 0; k < n; k++) {
    const x = r() * w;
    const y = r() * h;
    const rr = rad[0] + r() * (rad[1] - rad[0]);
    const color = colors[Math.floor(r() * colors.length)];
    for (const [dx, dy] of [[0, 0], [w, 0], [-w, 0], [0, h], [0, -h]]) {
      const g = ctx.createRadialGradient(x + dx, y + dy, 0, x + dx, y + dy, rr);
      g.addColorStop(0, color);
      g.addColorStop(1, color.replace(/[\d.]+\)$/, '0)'));
      ctx.fillStyle = g;
      ctx.fillRect(x + dx - rr, y + dy - rr, rr * 2, rr * 2);
    }
  }
}

// Сланец: серебристо-серый, крутая слоистость, слюда, кварцевые линзы (короткие, с утонением), ржавчина.
// folded — смят в складки: к наклону добавлены крупные изгибы
function schistCanvas(seed, folded) {
  const r = rng(seed);
  return (ctx, w, h) => {
    ctx.fillStyle = '#767c84';
    ctx.fillRect(0, 0, w, h);
    blotches(ctx, w, h, r, 26, ['rgba(40,44,50,0.35)', 'rgba(170,176,184,0.25)', 'rgba(120,100,80,0.22)'], [120, 380]);
    const A = 2.2 * PX; // наклон слоёв
    const phase = 0.6;
    const fold = folded ? 0.9 * PX : 0;
    const foldPath = (x) => fold * Math.sin((2 * Math.PI * 3 * x) / w + 1.1);
    // толстые слои чуть разного тона — сланец читается слоистым
    for (let k = 0; k < 24; k++) {
      const y0 = r() * h;
      const th = (0.1 + r() * 0.45) * PX;
      const color = r() < 0.5 ? `rgba(40, 44, 50, ${0.18 + r() * 0.2})` : `rgba(190, 196, 204, ${0.1 + r() * 0.14})`;
      for (const dy of [-h, 0, h]) {
        ctx.beginPath();
        for (let x = 0; x <= w; x += 8) ctx.lineTo(x, y0 + dy + A * Math.sin((2 * Math.PI * x) / w + phase) + foldPath(x));
        for (let x = w; x >= 0; x -= 8) ctx.lineTo(x, y0 + th + dy + A * Math.sin((2 * Math.PI * x) / w + phase) + foldPath(x));
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();
      }
    }
    for (let k = 0; k < 260; k++) {
      const tone = r();
      const color = tone < 0.4 ? `rgba(58, 62, 70, ${0.35 + r() * 0.35})` : tone < 0.82 ? `rgba(196, 202, 210, ${0.25 + r() * 0.3})` : `rgba(122, 104, 86, ${0.25 + r() * 0.2})`;
      const y0 = r() * h;
      const wig = (folded ? 6 : 2.5) + r() * 5;
      const wph = r() * 6.3;
      for (const dy of [-h, 0, h]) {
        ctx.beginPath();
        for (let x = 0; x <= w; x += 6) {
          const y = y0 + dy + A * Math.sin((2 * Math.PI * x) / w + phase) + foldPath(x) + wig * Math.sin((2 * Math.PI * 5 * x) / w + wph) + wig * 0.25 * Math.sin((2 * Math.PI * 17 * x) / w + wph * 2);
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = color;
        ctx.lineWidth = 1 + r() * 4;
        ctx.stroke();
      }
    }
    // кварцевые линзы: короткие светлые веретёна вдоль слоистости
    for (let k = 0; k < 26; k++) {
      const y0 = r() * h;
      const x0 = r() * w;
      const len = (0.4 + r() * 1.4) * PX;
      const thick = (0.02 + r() * 0.06) * PX;
      const wph = r() * 6.3;
      for (const dy of [-h, 0, h]) {
        for (let i = 0; i < 24; i++) {
          const x = x0 + (i / 23) * len;
          const xx = ((x % w) + w) % w;
          const y = y0 + dy + A * Math.sin((2 * Math.PI * x) / w + phase) + foldPath(x) + 6 * Math.sin((2 * Math.PI * 5 * x) / w + wph);
          const tk = thick * Math.sin((Math.PI * i) / 23);
          ctx.fillStyle = 'rgba(226, 223, 214, 0.9)';
          ctx.beginPath();
          ctx.ellipse(xx, y, len / 18, tk + 0.5, 0, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
    speckle(ctx, w, h, r, 22000, ['rgba(36,38,42,0.6)', 'rgba(222,226,232,0.55)', 'rgba(150,154,160,0.5)'], [1, 2.6]);
  };
}

// Гнейс: полосы розового полевого шпата, белого кварца и чёрного биотита, наклон в другую сторону;
// поперёк — светлая жила пегматита
export function gneissCanvas(seed, round = false) {
  const r = rng(seed);
  return (ctx, w, h) => {
    ctx.fillStyle = '#9a8f89';
    ctx.fillRect(0, 0, w, h);
    const bands = ['#c99c8c', '#e0d9cf', '#a69f99', '#2f2b2d', '#4a4241', '#d2a596', '#efe9e0', '#3a3436'];
    const A = 1.6 * PX;
    const phase = 2.4;
    let y = 0;
    while (y < h) {
      const th = (0.03 + r() * 0.22) * PX;
      const color = bands[Math.floor(r() * bands.length)];
      const wig = 4 + r() * 10;
      const wph = r() * 6.3;
      for (const dy of [-h, 0, h]) {
        ctx.beginPath();
        for (let x = 0; x <= w; x += 6) ctx.lineTo(x, y + dy + A * Math.sin((2 * Math.PI * x) / w + phase) + wig * Math.sin((2 * Math.PI * 4 * x) / w + wph));
        for (let x = w; x >= 0; x -= 6) ctx.lineTo(x, y + th + dy + A * Math.sin((2 * Math.PI * x) / w + phase) + wig * Math.sin((2 * Math.PI * 4 * x) / w + wph + 0.5));
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.8;
        ctx.fill();
      }
      y += th * 0.85;
    }
    ctx.globalAlpha = 1;
    // жила пегматита — крутая, поперёк полос
    for (const dy of [-h, 0, h]) {
      ctx.beginPath();
      for (let x = 0; x <= w; x += 6) ctx.lineTo(x, h * 0.3 + dy - 3.2 * PX * Math.sin((2 * Math.PI * x) / w + 0.3));
      for (let x = w; x >= 0; x -= 6) ctx.lineTo(x, h * 0.3 + 0.35 * PX + dy - 3.2 * PX * Math.sin((2 * Math.PI * x) / w + 0.3) + 10 * Math.sin(x / 40));
      ctx.closePath();
      ctx.fillStyle = 'rgba(232, 206, 196, 0.9)';
      ctx.fill();
    }
    blotches(ctx, w, h, r, 18, ['rgba(30,26,26,0.25)', 'rgba(230,210,200,0.18)'], [120, 320]);
    speckle(ctx, w, h, r, 30000, ['rgba(20,18,20,0.7)', 'rgba(240,236,228,0.6)', 'rgba(205,140,120,0.6)', 'rgba(90,84,80,0.5)'], [1.5, 4.5], round);
  };
}

function concreteCanvas(seed, joints) {
  const r = rng(seed);
  return (ctx, w, h) => {
    ctx.fillStyle = '#7b7a76';
    ctx.fillRect(0, 0, w, h);
    speckle(ctx, w, h, r, 3000, ['rgba(0,0,0,0.12)', 'rgba(255,255,255,0.1)'], [1, 3]);
    if (joints) {
      ctx.fillStyle = 'rgba(30,30,28,0.6)';
      ctx.fillRect(0, 0, 4, h);
      ctx.fillStyle = 'rgba(40,52,48,0.35)';
      ctx.fillRect(0, h * 0.75, w, h * 0.25); // нижняя часть — тёмный налёт от воды
    }
  };
}

export function texturePair(draw, w = TW, h = TH) {
  const map = canvasTexture(w, h, draw);
  map.wrapS = map.wrapT = THREE.RepeatWrapping;
  // карта рельефа — та же картинка (светлые слои выпуклые)
  const bump = new THREE.CanvasTexture(map.image);
  bump.wrapS = bump.wrapT = THREE.RepeatWrapping;
  bump.colorSpace = THREE.NoColorSpace;
  return { map, bump };
}

// Смаз по вертикали: среднее нескольких выборок текстуры вдоль v
function withBlur(material, blur) {
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uBlur = blur;
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform float uBlur;')
      .replace(
        '#include <map_fragment>',
        `#ifdef USE_MAP
  vec4 sampledDiffuseColor;
  if (uBlur < 0.0005) {
    sampledDiffuseColor = texture2D(map, vMapUv); // медленно — одна выборка, как обычно
  } else {
    sampledDiffuseColor = vec4(0.0);
    float bias = clamp(uBlur * 60.0, 0.0, 2.5);
    for (int i = 0; i < 10; i++) {
      float o = (float(i) / 9.0 - 0.5) * uBlur;
      sampledDiffuseColor += texture(map, vMapUv + vec2(0.0, o), bias);
    }
    sampledDiffuseColor /= 10.0;
  }
  diffuseColor *= sampledDiffuseColor;
#endif`
      );
  };
  return material;
}

// --- стенки «пузыря» ---------------------------------------------------------

// Цилиндр изнутри, как CylinderGeometry (x = R sin θ, z = R cos θ), но верх и низ каждой
// колонки свои: так стенка точно ложится на поверхность водовода, без щелей
function wallGeometry(top, bottom, rowH = 1.0, segs = WALL_SEGS) {
  const rows = Math.max(1, Math.ceil((Math.max(...Array.from({ length: segs + 1 }, (_, i) => top((i / segs) * Math.PI * 2))) - Math.min(...Array.from({ length: segs + 1 }, (_, i) => bottom((i / segs) * Math.PI * 2)))) / rowH));
  const pos = [];
  const nor = [];
  const uv = [];
  const col = [];
  for (let y = 0; y <= rows; y++) {
    for (let x = 0; x <= segs; x++) {
      const th = (x / segs) * Math.PI * 2;
      const yy = top(th) + (bottom(th) - top(th)) * (y / rows);
      pos.push(PLAYER.x + R * Math.sin(th), yy, PLAYER.z + R * Math.cos(th));
      nor.push(Math.sin(th), 0, Math.cos(th));
      uv.push((x / segs) * REP_U, yy / TILE);
      const [cr, cg, cb] = tintAt(yy, th);
      col.push(cr, cg, cb);
    }
  }
  const idx = [];
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < segs; x++) {
      const a = y * (segs + 1) + x;
      const b = a + segs + 1;
      idx.push(a, b, a + 1, b, b + 1, a + 1);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  geo.setIndex(idx);
  return geo;
}

// Оттенок породы по глубине: зоны чуть разного цвета (серебристая, ржавая, светлая кварцевая,
// тёмная) и медленные пятна — чтобы две минуты в скале не выглядели одинаково
const ZONES = [
  [-14, [1.0, 1.0, 1.0]],
  [-55, [1.06, 0.96, 0.86]],
  [-90, [0.9, 0.93, 0.98]],
  [-130, [1.1, 1.1, 1.08]],
  [-175, [0.95, 0.92, 0.9]],
  [-200, [0.92, 0.96, 1.04]],
  [-290, [1.08, 1.0, 0.92]],
  [-378, [1.0, 1.0, 1.0]],
  [-700, [1.06, 0.98, 0.94]],
  [-1300, [0.96, 0.94, 0.96]],
];
export function tintAt(y, th) {
  let i = 0;
  while (i < ZONES.length - 2 && y < ZONES[i + 1][0]) i++;
  const [y0, c0] = ZONES[i];
  const [y1, c1] = ZONES[i + 1];
  const k = smooth((y - y0) / (y1 - y0));
  const n = 0.9 + 0.1 * Math.sin(y * 0.37 + th * 2) * Math.sin(y * 0.11 + 1.3) + 0.06 * Math.sin(y * 1.9 + th * 5);
  return c0.map((c, j) => (c + (c1[j] - c) * k) * n);
}

// Наклонная полоса через всю стенку: жила кварца, ржавая зона, тёмная дайка, жила пегматита.
// Плоскость, рассечённая цилиндром: верх и низ полосы — синусоиды по углу
function band(y0, A, phase, width, material) {
  const segs = 128;
  const pos = [];
  const uv = [];
  const idx = [];
  for (let i = 0; i <= segs; i++) {
    const th = (i / segs) * Math.PI * 2;
    const yc = y0 + A * Math.sin(th + phase) + 0.06 * Math.sin(th * 7 + phase * 3);
    for (const s of [-1, 1]) {
      const p = onWall(th, yc + (s * width) / 2, 0.004);
      pos.push(p.x, p.y, p.z);
      uv.push(i / 16, s < 0 ? 0 : 1);
    }
    if (i < segs) idx.push(2 * i, 2 * i + 2, 2 * i + 1, 2 * i + 1, 2 * i + 2, 2 * i + 3);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  return new THREE.Mesh(geo, material);
}

// Стенка — многоугольник из WALL_SEGS граней: между вершинами грань лежит внутри окружности.
// Радиус настоящей поверхности под углом θ — от него и отступаем внутрь, иначе детали прячутся за гранью
const WALL_SEGS = 48;
function wallRadius(th) {
  const step = (Math.PI * 2) / WALL_SEGS;
  const local = (((th % step) + step) % step) - step / 2;
  return (R * Math.cos(step / 2)) / Math.cos(local);
}
// Точка на стенке пузыря (чуть внутрь): угол в той же системе, что и стенка
const onWall = (th, y, inset = 0) => {
  const r = wallRadius(th) - inset;
  return new THREE.Vector3(PLAYER.x + r * Math.sin(th), y, PLAYER.z + r * Math.cos(th));
};
const inTunnel = (y, z, pad = 0) => (y - T.y) ** 2 + z ** 2 < (T.r_out + pad) ** 2;

export function buildRock() {
  const group = new THREE.Group();
  const blur = { value: 0 };
  const r = rng(47);

  const schistA = texturePair(schistCanvas(3, false));
  const schistB = texturePair(schistCanvas(4, true));
  const gneiss = texturePair(gneissCanvas(5));
  const rockMat = ({ map, bump }) => withBlur(new THREE.MeshStandardMaterial({ map, bumpMap: bump, bumpScale: 1.6, roughness: 0.86, metalness: 0, vertexColors: true, side: THREE.BackSide }), blur);
  const mats = [rockMat(schistA), rockMat(schistB), rockMat(gneiss)];

  const above = (th) => T.y + Math.sqrt(T.r_out ** 2 - (R * Math.cos(th)) ** 2);
  const below = (th) => T.y - Math.sqrt(T.r_out ** 2 - (R * Math.cos(th)) ** 2);
  group.add(new THREE.Mesh(wallGeometry(() => ROCK.top, above), mats[0]));
  group.add(new THREE.Mesh(wallGeometry(below, () => ROCK.gneiss), mats[1]));
  group.add(new THREE.Mesh(wallGeometry(() => ROCK.gneiss, () => ROCK.bottom, 2.0), mats[2]));
  // граница сланца и гнейса — светлая кварцевая полоса
  const contact = new THREE.Mesh(new THREE.CylinderGeometry(R - 0.004, R - 0.004, 0.5, 48, 1, true), new THREE.MeshStandardMaterial({ color: 0xd8d2c6, roughness: 0.6, side: THREE.BackSide }));
  contact.position.set(PLAYER.x, ROCK.gneiss, PLAYER.z);
  group.add(contact);

  // Жилы и дайки: проходят мимо, пока погружаемся — видно и скорость, и смену породы
  const softEdge = canvasTexture(8, 64, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, 'rgba(255,255,255,0)');
    g.addColorStop(0.18, 'rgba(255,255,255,1)');
    g.addColorStop(0.82, 'rgba(255,255,255,1)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  });
  softEdge.colorSpace = THREE.NoColorSpace;
  const grainTex = canvasTexture(256, 64, (ctx, w, h) => {
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 1400; i++) {
      ctx.fillStyle = `rgba(0,0,0,${0.08 + r() * 0.3})`;
      ctx.fillRect(r() * w, r() * h, 1 + r() * 3, 1 + r() * 3);
    }
  });
  grainTex.wrapS = grainTex.wrapT = THREE.RepeatWrapping;
  const bandMat = (color, rough, opacity = 1) =>
    new THREE.MeshStandardMaterial({ color, map: grainTex, roughness: rough, alphaMap: softEdge, transparent: true, opacity, depthWrite: false, side: THREE.DoubleSide });
  const KIND = {
    quartz: bandMat(0xdcd8cd, 0.45),
    rust: bandMat(0x8a5532, 0.95, 0.7),
    dark: bandMat(0x3b3937, 0.8, 0.9),
    peg: bandMat(0xe2b4a4, 0.6),
  };
  // Глубже ~290 м падение быстрое и стенки смазаны: полосы там мягкие, без зерна и резких краёв,
  // иначе резкая полоса проскакивает по смазанной стенке чужеродной вспышкой
  const softer = canvasTexture(8, 64, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, 'rgba(255,255,255,0)');
    g.addColorStop(0.5, 'rgba(255,255,255,1)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  });
  softer.colorSpace = THREE.NoColorSpace;
  const softMat = (color, opacity) => new THREE.MeshStandardMaterial({ color, roughness: 0.8, alphaMap: softer, transparent: true, opacity, depthWrite: false, side: THREE.DoubleSide });
  const SOFT = { quartz: softMat(0xcfcac0, 0.45), rust: softMat(0x7e5236, 0.4), dark: softMat(0x2f2d2c, 0.55), peg: softMat(0xc99c8e, 0.5) };
  for (const [y0, A, ph, wdt, kind] of ROCK.bands) group.add(band(y0, A, ph, wdt, y0 < -290 ? SOFT[kind] : KIND[kind]));

  // Слюдяные блёстки
  const sp = [];
  for (let k = 0; k < 26000; k++) {
    const y = ROCK.top - Math.pow(r(), 1.6) * (ROCK.top - ROCK.bottom);
    const th = r() * Math.PI * 2;
    const p = onWall(th, y, 0.01);
    if (inTunnel(y, p.z - PLAYER.z, 0.1)) continue;
    sp.push(p.x, p.y, p.z);
  }
  const sparkGeo = new THREE.BufferGeometry();
  sparkGeo.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3));
  const sparkles = new THREE.Points(sparkGeo, new THREE.PointsMaterial({ color: 0xe6ecf5, size: 0.02 }));
  group.add(sparkles);

  // Гранаты: тёмно-красные кристаллы, гуще всего справа на глубине 22–34 м
  const G = ROCK.garnets;
  const garnetMat = new THREE.MeshStandardMaterial({ color: 0x7c1d28, roughness: 0.2, metalness: 0.15, emissive: 0x1e0306, flatShading: true });
  const dense = 480;
  const sparse = 1500;
  // гнёзда гранатов: кристаллы собраны в пятна вдоль слоёв, а не рассыпаны
  const nests = Array.from({ length: 18 }, () => ({ y: G.dense[0] + r() * (G.dense[1] - G.dense[0]), th: Math.PI * (0.55 + r() * 0.22) }));
  const garnets = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 0), garnetMat, dense + sparse);
  const m4 = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const e = new THREE.Euler();
  let n = 0;
  for (let k = 0; k < dense + sparse; k++) {
    const isDense = k < dense;
    const nest = nests[k % nests.length];
    // гнёзда — справа-впереди (θ ≈ π/2…5π/6 — там, куда смотрит герой), остальные редко по всей скале
    const y = isDense ? nest.y + (r() - 0.5) * 0.5 : G.y0 + r() * (G.y1 - G.y0);
    const th = isDense ? nest.th + ((r() - 0.5) * 0.7) / R : r() * Math.PI * 2;
    const size = isDense ? 0.012 + r() * 0.02 : 0.006 + r() * 0.01;
    const p = onWall(th, y, size * 0.35);
    if (inTunnel(y, p.z - PLAYER.z, 0.1)) continue;
    q.setFromEuler(e.set(r() * 6, r() * 6, r() * 6));
    m4.compose(p, q, new THREE.Vector3(size, size, size));
    garnets.setMatrixAt(n++, m4);
  }
  garnets.count = n;
  group.add(garnets);

  // Трещина с грунтовой водой: тёмная зигзагообразная щель, мокрый блеск вокруг, капли сползают вниз
  const F = ROCK.fracture;
  const crackTh = (y) => F.angle + 0.05 * Math.sin(y * 1.7) + 0.025 * Math.sin(y * 4.3 + 1);
  const strip = (halfWidth, inset, material) => {
    const pos = [];
    const uv = [];
    const idx = [];
    const steps = Math.round((F.y0 - F.y1) / 0.08);
    for (let i = 0; i <= steps; i++) {
      const y = F.y0 - (i / steps) * (F.y0 - F.y1);
      const th = crackTh(y);
      const wid = halfWidth * (0.6 + 0.4 * Math.sin(y * 2.9) ** 2);
      for (const s of [-1, 1]) {
        const p = onWall(th + (s * wid) / R, y, inset);
        pos.push(p.x, p.y, p.z);
        uv.push(s < 0 ? 0 : 1, i / steps);
      }
      if (i < steps) idx.push(2 * i, 2 * i + 1, 2 * i + 2, 2 * i + 1, 2 * i + 3, 2 * i + 2);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    geo.setIndex(idx);
    geo.computeVertexNormals();
    return new THREE.Mesh(geo, material);
  };
  const wetAlpha = canvasTexture(64, 4, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, w, 0);
    g.addColorStop(0, 'rgba(255,255,255,0)');
    g.addColorStop(0.5, 'rgba(255,255,255,1)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  });
  group.add(strip(0.14, 0.003, new THREE.MeshStandardMaterial({ color: 0x2c3336, roughness: 0.08, metalness: 0.0, alphaMap: wetAlpha, transparent: true, opacity: 0.5, depthWrite: false, side: THREE.DoubleSide })));
  group.add(strip(0.009, 0.005, new THREE.MeshBasicMaterial({ color: 0x141210, side: THREE.DoubleSide })));
  const dropMat = new THREE.MeshStandardMaterial({ color: 0xcfe0e6, roughness: 0.05, metalness: 0, transparent: true, opacity: 0.85 });
  const drops = [];
  for (let k = 0; k < 46; k++) {
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.011, 8, 6), dropMat);
    mesh.scale.y = 1.6;
    group.add(mesh);
    drops.push({ mesh, top: F.y0 - r() * (F.y0 - F.y1), len: 0.8 + r() * 1.2, speed: 0.25 + r() * 0.3, phase: r() });
  }

  // Водовод: снаружи — бетонная оболочка (видна сверху и снизу), внутри — кольца обделки, всё залито водой
  const outerTex = canvasTexture(256, 256, concreteCanvas(8, false));
  outerTex.wrapS = outerTex.wrapT = THREE.RepeatWrapping;
  outerTex.repeat.set(40, 6);
  const outer = new THREE.Mesh(new THREE.CylinderGeometry(T.r_out, T.r_out, 160, 72, 1, true), new THREE.MeshStandardMaterial({ map: outerTex, roughness: 0.9 }));
  outer.rotation.z = Math.PI / 2;
  outer.position.set(PLAYER.x, T.y, PLAYER.z);
  group.add(outer);
  const innerTex = canvasTexture(256, 256, concreteCanvas(9, true));
  innerTex.wrapS = innerTex.wrapT = THREE.RepeatWrapping;
  innerTex.repeat.set(1, 160 / 1.5);
  innerTex.rotation = 0;
  const innerGeo = new THREE.CylinderGeometry(T.r_in, T.r_in, 160, 72, 1, true);
  const inner = new THREE.Mesh(innerGeo, new THREE.MeshStandardMaterial({ map: innerTex, roughness: 0.75, side: THREE.BackSide, color: 0x9fb8b4 }));
  inner.rotation.z = Math.PI / 2;
  inner.position.copy(outer.position);
  group.add(inner);
  // взвесь в потоке — летит вдоль тоннеля
  const silt = [];
  const sr = rng(61);
  for (let k = 0; k < 2600; k++) {
    const a = sr() * Math.PI * 2;
    const rad = Math.sqrt(sr()) * (T.r_in - 0.1);
    silt.push({ x0: sr() * 24 - 12, y: T.y + rad * Math.sin(a), z: rad * Math.cos(a), v: 1.8 + sr() * 0.8 });
  }
  const siltGeo = new THREE.BufferGeometry();
  siltGeo.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(silt.length * 3), 3));
  const siltPts = new THREE.Points(siltGeo, new THREE.PointsMaterial({ color: 0xb8d8d0, size: 0.03, transparent: true, opacity: 0.8, depthWrite: false }));
  siltPts.frustumCulled = false;
  group.add(siltPts);

  return { group, blur, drops, crackTh, silt, siltGeo, siltPts, sparkles };
}

// speed — скорость погружения, м/с: смаз текстуры за кадр (1/60 с) в долях повтора
export function updateRock(k, t, eye, speed) {
  k.blur.value = Math.min(0.12, Math.max(0, (speed / 60 / TILE) * 1.2 - 0.0015));
  // капли сползают по трещине, каждая — по своему отрезку
  for (const d of k.drops) {
    const s = ((t * d.speed) / d.len + d.phase) % 1;
    const y = d.top - s * d.len;
    const th = k.crackTh(y) + 0.004;
    const rr = wallRadius(th) - 0.012;
    d.mesh.position.set(PLAYER.x + rr * Math.sin(th), y, PLAYER.z + rr * Math.cos(th));
    d.mesh.visible = Math.abs(y - eye.y) < 30;
  }
  // взвесь в водоводе — только когда мы внутри или рядом
  const near = Math.abs(eye.y - T.y) < T.r_in + 2;
  k.siltPts.visible = near;
  if (near) {
    const arr = k.siltGeo.attributes.position.array;
    k.silt.forEach((p, i) => {
      const x = ((((p.x0 + p.v * t) % 24) + 36) % 24) - 12;
      arr[i * 3] = PLAYER.x + x;
      arr[i * 3 + 1] = p.y;
      arr[i * 3 + 2] = PLAYER.z + p.z;
    });
    k.siltGeo.attributes.position.needsUpdate = true;
  }
  k.sparkles.material.size = 0.02 * (1 - 0.6 * smooth(speed / 20));
}
