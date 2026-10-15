// Глубже километра: «пузырь» видимости радиусом R едет вместе с героем — все координаты от камеры,
// поэтому тысячи километров не съедают точность. Стенку рисует шейдер: слои пород плавно сменяют друг
// друга по пройденному пути, раскалённая порода светится цветом нагретого тела, внешнее ядро — текущий
// жидкий металл, внутреннее — грани кристаллов железа. В центре Земли — маленькая сферическая полость.
// Скорость падения огромная; текстура скользит не быстрее VMAX, дальше — смаз и цифры на экране.
import * as THREE from 'three';
import { canvasTexture, rng, smooth } from './util.js';
import { CENTER, DURATION, EARTH, LAYERS, depthAt, temperatureAt } from './timeline.js';
import { PX, R, TH, TILE, TW, blotches, gneissCanvas, speckle, texturePair, tintAt } from './rock.js';
import { FAULT, HOLE_GLSL, KIMBERLITE, SIGHTS, SLAB, buildSights, faultNormal, holeUniforms, inAnyHole, thetaOf, updateSights } from './sights.js';

export const HANDOFF = 180; // с этой секунды стенки рисует deep.js (до неё — rock.js в мировых координатах)
const HALF_LEN = 70; // длина трубы вверх и вниз от глаз, м
// м/с: быстрее текстура не скользит. На стыке с rock.js — как там (36 м/с), потом спокойнее, чтобы
// породу было видно; скорость падения показывают цифры и звук
// Рядом с тем, что стоит разглядеть (sights.js), стенка ненадолго замедляется
const vcap = (t) => {
  let v = 10 + 28 * (1 - smooth((t - HANDOFF) / 16));
  for (const sg of SIGHTS) {
    if (!sg.win) continue;
    const w = smooth((t - sg.win[0]) / 1.4) * (1 - smooth((t - sg.win[1] + 1.4) / 1.4));
    v += (Math.min(v, sg.slow) - v) * w;
  }
  return v;
};
const CAVITY_R = 4.5;
// смаз текстуры при обычной скорости стенки (10 м/с) — под него заранее смазаны копии текстур
const LB = (10 / 60 / TILE) * 0.6 - 0.0015;

// Копия текстуры, смазанная по вертикали прямоугольным окном LB (точно, с повтором через край)
function blurredCopy(tex) {
  const src = tex.image;
  const w = src.width;
  const h = src.height;
  const data = src.getContext('2d').getImageData(0, 0, w, h).data;
  const n = Math.max(1, Math.round(LB * h));
  const half = Math.floor(n / 2);
  const out = new Uint8ClampedArray(data.length);
  const sum = new Float64Array(4);
  for (let x = 0; x < w; x++) {
    sum.fill(0);
    for (let k = -half; k < n - half; k++) {
      const i = ((((k % h) + h) % h) * w + x) * 4;
      for (let c = 0; c < 4; c++) sum[c] += data[i + c];
    }
    for (let y = 0; y < h; y++) {
      const o = (y * w + x) * 4;
      for (let c = 0; c < 4; c++) out[o + c] = sum[c] / n;
      const add = ((((y + n - half) % h) + h) % h) * w + x;
      const rem = ((((y - half) % h) + h) % h) * w + x;
      for (let c = 0; c < 4; c++) sum[c] += data[add * 4 + c] - data[rem * 4 + c];
    }
  }
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  c.getContext('2d').putImageData(new ImageData(out, w, h), 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = tex.colorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = tex.anisotropy;
  return t;
}
const HALF = EARTH / 2;

// --- текстуры слоёв: бесшовные, ширина = окружность пузыря, высота = TILE м ----------------------------

// рисовать с повтором через края, чтобы швов не было
function wrapped(ctx, w, h, x, y, rad, draw) {
  for (const dx of [-w, 0, w]) {
    if (x + dx < -rad || x + dx > w + rad) continue;
    for (const dy of [-h, 0, h]) {
      if (y + dy < -rad || y + dy > h + rad) continue;
      draw(x + dx, y + dy);
    }
  }
}

// зернистая порода: многоугольные зёрна разных минералов
function grains(ctx, w, h, r, n, palette, size) {
  for (let i = 0; i < n; i++) {
    const x = r() * w;
    const y = r() * h;
    const rad = (size[0] + r() * (size[1] - size[0])) * PX;
    const color = palette[Math.floor(r() * palette.length)];
    const sides = 5 + Math.floor(r() * 3);
    const rot = r() * 6.3;
    const stretch = 0.6 + r() * 0.8;
    wrapped(ctx, w, h, x, y, rad, (cx, cy) => {
      ctx.beginPath();
      for (let k = 0; k < sides; k++) {
        const a = rot + (k / sides) * Math.PI * 2;
        const rr = rad * (0.75 + 0.25 * Math.sin(k * 2.3 + rot));
        ctx.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr * stretch);
      }
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();
    });
  }
}

function bands(ctx, w, h, r, n, colors, A, phase, thick) {
  for (let k = 0; k < n; k++) {
    const y0 = r() * h;
    const th = (thick[0] + r() * (thick[1] - thick[0])) * PX;
    const color = colors[Math.floor(r() * colors.length)];
    for (const dy of [-h, 0, h]) {
      ctx.beginPath();
      for (let x = 0; x <= w; x += 8) ctx.lineTo(x, y0 + dy + A * PX * Math.sin((2 * Math.PI * x) / w + phase) + 6 * Math.sin((2 * Math.PI * 5 * x) / w + k));
      for (let x = w; x >= 0; x -= 8) ctx.lineTo(x, y0 + th + dy + A * PX * Math.sin((2 * Math.PI * x) / w + phase) + 6 * Math.sin((2 * Math.PI * 5 * x) / w + k + 0.6));
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();
    }
  }
}

// Мелкое зерно поверх слоя: 16 повторов по кругу (~1,2 м), 8 — на TILE по высоте. Вблизи порода
// зернистая, а не гладкая заливка; на скорости зерно уходит в смаз
function detailCanvas(ctx, w, h) {
  const r = rng(909);
  ctx.fillStyle = 'rgb(128,128,128)';
  ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 9000; i++) {
    const x = r() * w;
    const y = r() * h;
    const rad = 0.8 + r() * r() * 4.5;
    const v = Math.round(128 + (r() - 0.5) * 120);
    const sides = 5 + Math.floor(r() * 3);
    const rot = r() * 6.3;
    wrapped(ctx, w, h, x, y, rad, (cx, cy) => {
      ctx.beginPath();
      for (let k = 0; k < sides; k++) {
        const a = rot + (k / sides) * Math.PI * 2;
        ctx.lineTo(cx + Math.cos(a) * rad * (0.7 + 0.3 * Math.sin(k * 1.7 + rot)), cy + Math.sin(a) * rad * 0.8);
      }
      ctx.closePath();
      ctx.fillStyle = `rgba(${v},${v},${v},0.55)`;
      ctx.fill();
    });
  }
  // волосяные трещинки
  ctx.lineWidth = 0.8;
  for (let i = 0; i < 26; i++) {
    let x = r() * w;
    let y = r() * h;
    let a = r() * 6.3;
    ctx.strokeStyle = 'rgba(40,40,40,0.5)';
    ctx.beginPath();
    ctx.moveTo(x, y);
    for (let k = 0; k < 14; k++) {
      a += (r() - 0.5) * 0.9;
      x += Math.cos(a) * 6;
      y += Math.sin(a) * 6;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
}

const CANVAS = {
  gneiss: gneissCanvas(5, true), // та же раскладка, что у rock.js (бесшовный стык), но зёрна круглые
  // Порода вблизи — сплошь зёрна минералов (плотная мозаика), полосы и пятна — лёгкие оттенки поверх
  // гранит: розово-серый, крупные кристаллы полевого шпата, серый кварц, чёрная слюда
  granite: (ctx, w, h) => {
    const r = rng(101);
    ctx.fillStyle = '#a8968e';
    ctx.fillRect(0, 0, w, h);
    grains(ctx, w, h, r, 26000, ['#d9a493', '#e6b6a4', '#c48e7e', '#b3aaa4', '#9a948f', '#efe6dd', '#c9b8ae'], [0.02, 0.05]);
    grains(ctx, w, h, r, 9000, ['#1d1a1a', '#2c2726', '#3a3433'], [0.008, 0.022]);
    blotches(ctx, w, h, r, 24, ['rgba(70,58,54,0.25)', 'rgba(230,210,200,0.2)'], [120, 380]);
    speckle(ctx, w, h, r, 9000, ['rgba(20,18,18,0.5)', 'rgba(255,245,235,0.35)'], [1.2, 3], true);
  },
  // гранулит: плотная порода нижней коры — серые зёрна пироксена и плагиоклаза, полосы, красные гранаты
  granulite: (ctx, w, h) => {
    const r = rng(102);
    ctx.fillStyle = '#5e615d';
    ctx.fillRect(0, 0, w, h);
    grains(ctx, w, h, r, 28000, ['#6c6f69', '#4a4c4a', '#8a8b84', '#a9a79c', '#3c3e3c', '#77786f'], [0.018, 0.045]);
    bands(ctx, w, h, r, 30, ['rgba(26,28,28,0.38)', 'rgba(190,186,174,0.3)', 'rgba(80,82,78,0.3)'], 1.4, 1.2, [0.06, 0.4]);
    grains(ctx, w, h, r, 2600, ['#8e1f2a', '#a32a34', '#7a1822', '#b13a3c'], [0.01, 0.024]);
    speckle(ctx, w, h, r, 8000, ['rgba(12,12,12,0.5)', 'rgba(230,226,214,0.35)'], [1, 2.6], true);
  },
  // перидотит: оливково-зелёные зёрна оливина, бурый пироксен, чёрная шпинель
  peridotite: (ctx, w, h) => {
    const r = rng(103);
    ctx.fillStyle = '#5f7f3c';
    ctx.fillRect(0, 0, w, h);
    grains(ctx, w, h, r, 28000, ['#7a9e48', '#8fb456', '#5c8236', '#a3c062', '#6a8a3e', '#7f9a46', '#4f6e30'], [0.018, 0.05]);
    grains(ctx, w, h, r, 7000, ['#6e5a34', '#80683c', '#5a4a2c'], [0.015, 0.035]);
    bands(ctx, w, h, r, 10, ['rgba(100,76,44,0.3)', 'rgba(160,185,90,0.25)'], 1.8, 2.2, [0.08, 0.35]);
    grains(ctx, w, h, r, 3500, ['#121a10', '#1f2a1a', '#2a2418'], [0.006, 0.018]);
    speckle(ctx, w, h, r, 7000, ['rgba(10,14,8,0.45)', 'rgba(220,235,170,0.3)'], [1, 2.4], true);
  },
  // вадслеит: сине-зелёный, плотные кристаллы
  wadsleyite: (ctx, w, h) => {
    const r = rng(104);
    ctx.fillStyle = '#3a7a75';
    ctx.fillRect(0, 0, w, h);
    grains(ctx, w, h, r, 28000, ['#459690', '#58ada4', '#337a74', '#6dbfb4', '#3c8a82', '#2a6660'], [0.018, 0.05]);
    bands(ctx, w, h, r, 12, ['rgba(20,60,60,0.3)', 'rgba(130,200,190,0.22)'], 1.6, 0.8, [0.08, 0.3]);
    grains(ctx, w, h, r, 2800, ['#0c2422', '#163432'], [0.006, 0.016]);
    speckle(ctx, w, h, r, 7000, ['rgba(6,20,20,0.4)', 'rgba(200,250,240,0.3)'], [1, 2.4], true);
  },
  // рингвудит: насыщенно-синий с фиолетовым, блестит
  ringwoodite: (ctx, w, h) => {
    const r = rng(105);
    ctx.fillStyle = '#2a4aa6';
    ctx.fillRect(0, 0, w, h);
    grains(ctx, w, h, r, 28000, ['#3458c0', '#4a6ee0', '#283f96', '#6a52c0', '#4a80f0', '#2c3488', '#5a5ad0'], [0.018, 0.05]);
    bands(ctx, w, h, r, 12, ['rgba(80,40,160,0.28)', 'rgba(90,150,240,0.22)'], 1.6, 2.6, [0.08, 0.3]);
    grains(ctx, w, h, r, 2800, ['#0a0c30', '#141850'], [0.006, 0.016]);
    speckle(ctx, w, h, r, 9000, ['rgba(8,8,30,0.4)', 'rgba(210,220,255,0.4)'], [1, 2.4], true);
  },
  // нижняя мантия: янтарный бриджманит, гнёзда тёмного ферропериклаза, полосы течения
  bridgmanite: (ctx, w, h) => {
    const r = rng(106);
    ctx.fillStyle = '#8e6236';
    ctx.fillRect(0, 0, w, h);
    grains(ctx, w, h, r, 28000, ['#a87440', '#bd8a50', '#8a5c30', '#cf9c5c', '#7a5028', '#b07e48'], [0.018, 0.05]);
    grains(ctx, w, h, r, 6000, ['#2a1c14', '#3a281c', '#4a3424'], [0.01, 0.03]);
    bands(ctx, w, h, r, 16, ['rgba(60,36,18,0.32)', 'rgba(220,170,110,0.22)'], 2.6, 0.4, [0.1, 0.5]);
    speckle(ctx, w, h, r, 7000, ['rgba(20,10,4,0.45)', 'rgba(255,220,170,0.3)'], [1, 2.4], true);
  },
  // D″: тёмный, пятнистый, с яркими пятнами частичного плавления
  dpp: (ctx, w, h) => {
    const r = rng(107);
    ctx.fillStyle = '#3a2a22';
    ctx.fillRect(0, 0, w, h);
    grains(ctx, w, h, r, 26000, ['#5a4030', '#2e201a', '#6c4c38', '#3a2a22', '#4a3428', '#7a5a44'], [0.018, 0.05]);
    blotches(ctx, w, h, r, 40, ['rgba(20,12,10,0.4)', 'rgba(110,60,30,0.3)'], [60, 240]);
    blotches(ctx, w, h, r, 30, ['rgba(255,190,110,0.7)'], [18, 64]);
    speckle(ctx, w, h, r, 6000, ['rgba(10,6,4,0.45)', 'rgba(255,200,140,0.3)'], [1, 2.4], true);
  },
  // жидкий металл — «яркость» для шейдера: медленный мраморный узор (сам цвет даёт шейдер)
  liquid: (ctx, w, h) => {
    const r = rng(108);
    ctx.fillStyle = '#606060';
    ctx.fillRect(0, 0, w, h);
    for (let k = 0; k < 160; k++) {
      const y0 = r() * h;
      const amp = (0.4 + r() * 1.6) * PX;
      const cyc = 1 + Math.floor(r() * 4);
      const ph = r() * 6.3;
      const lw = 8 + r() * 60;
      const v = Math.floor(30 + r() * 220);
      for (const dy of [-h, 0, h]) {
        ctx.beginPath();
        for (let x = 0; x <= w; x += 8) ctx.lineTo(x, y0 + dy + amp * Math.sin((2 * Math.PI * cyc * x) / w + ph) + 30 * Math.sin((2 * Math.PI * (cyc * 3 + 2) * x) / w + ph * 2));
        ctx.strokeStyle = `rgba(${v},${v},${v},0.35)`;
        ctx.lineWidth = lw;
        ctx.stroke();
      }
    }
  },
  // кристаллы железа: многоугольные грани разной яркости с тёмными швами
  crystal: (ctx, w, h) => {
    const r = rng(109);
    ctx.fillStyle = '#1c1c1c';
    ctx.fillRect(0, 0, w, h);
    // ячейки Вороного с повтором по краям; точки разложены по корзинам, чтобы искать только соседей
    const N = 2400;
    const B = 96;
    const bw = Math.ceil(w / B);
    const bh = Math.ceil(h / B);
    const buckets = Array.from({ length: bw * bh }, () => []);
    for (let i = 0; i < N; i++) {
      const p = [r() * w, r() * h, 125 + r() * 130]; // грани светлее швов (швы ≤ 0,35 яркости)
      buckets[Math.floor(p[1] / B) * bw + Math.floor(p[0] / B)].push(p);
    }
    const img = ctx.getImageData(0, 0, w, h);
    for (let y = 0; y < h; y += 2) {
      for (let x = 0; x < w; x += 2) {
        let best = 1e9;
        let second = 1e9;
        let v = 0;
        const bx = Math.floor(x / B);
        const by = Math.floor(y / B);
        for (let oy = -1; oy <= 1; oy++) {
          for (let ox = -1; ox <= 1; ox++) {
            const cell = buckets[(((by + oy) % bh) + bh) % bh * bw + ((((bx + ox) % bw) + bw) % bw)];
            for (const [px, py, val] of cell) {
              let dx = Math.abs(x - px);
              let dy = Math.abs(y - py);
              if (dx > w / 2) dx = w - dx;
              if (dy > h / 2) dy = h - dy;
              const d = dx * dx + dy * dy;
              if (d < best) {
                second = best;
                best = d;
                v = val;
              } else if (d < second) second = d;
            }
          }
        }
        const edge = Math.sqrt(second) - Math.sqrt(best) < 1.6 ? 0.3 : 1;
        const shade = Math.round(v * edge * (0.9 + 0.1 * Math.sin(x * 0.05 + y * 0.03)));
        for (const [ox, oy] of [[0, 0], [1, 0], [0, 1], [1, 1]]) {
          const i = ((y + oy) * w + x + ox) * 4;
          img.data[i] = img.data[i + 1] = img.data[i + 2] = shade;
          img.data[i + 3] = 255;
        }
      }
    }
    ctx.putImageData(img, 0, 0);
  },
  // габбро: тёмно-зелёно-серое, белые лейсты плагиоклаза, полосчатость кумулата
  gabbro: (ctx, w, h) => {
    const r = rng(110);
    ctx.fillStyle = '#5a645c';
    ctx.fillRect(0, 0, w, h);
    bands(ctx, w, h, r, 26, ['rgba(26,30,26,0.55)', 'rgba(170,176,165,0.4)'], 0.3, 0.4, [0.06, 0.4]);
    for (let i = 0; i < 9000; i++) {
      const x = r() * w;
      const y = r() * h;
      const len = (0.01 + r() * 0.025) * PX;
      const a = r() * 6.3;
      ctx.strokeStyle = r() < 0.55 ? 'rgba(214,214,204,0.85)' : 'rgba(20,24,20,0.85)';
      ctx.lineWidth = 2 + r() * 2;
      wrapped(ctx, w, h, x, y, len, (cx, cy) => {
        ctx.beginPath();
        ctx.moveTo(cx - Math.cos(a) * len, cy - Math.sin(a) * len);
        ctx.lineTo(cx + Math.cos(a) * len, cy + Math.sin(a) * len);
        ctx.stroke();
      });
    }
  },
  // параллельные дайки: вертикальные листы базальта с тёмными закалёнными краями
  dikes: (ctx, w, h) => {
    const r = rng(111);
    ctx.fillStyle = '#4d4945';
    ctx.fillRect(0, 0, w, h);
    let x = 0;
    while (x < w) {
      const wd = (0.25 + r() * 0.9) * PX;
      const tone = Math.floor(68 + r() * 30); // базальт тёмный, но на экране должен читаться
      ctx.fillStyle = `rgb(${tone},${tone - 2},${tone - 4})`;
      ctx.fillRect(x, 0, wd, h);
      ctx.fillStyle = 'rgba(12,12,12,0.85)';
      ctx.fillRect(x, 0, 3, h);
      ctx.fillRect(x + wd - 3, 0, 3, h);
      x += wd;
    }
    speckle(ctx, w, h, r, 20000, ['rgba(0,0,0,0.35)', 'rgba(140,140,130,0.25)'], [1, 3], true);
    // поперечные трещины
    for (let i = 0; i < 260; i++) {
      const y = r() * h;
      const x0 = r() * w;
      ctx.fillStyle = 'rgba(10,10,10,0.5)';
      ctx.fillRect(x0, y, (0.1 + r() * 0.5) * PX, 2);
    }
  },
  // подушечная лава: округлые подушки с тёмной стекловатой коркой и радиальными трещинами
  pillows: (ctx, w, h) => {
    const r = rng(112);
    ctx.fillStyle = '#3a3633';
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 520; i++) {
      const x = r() * w;
      const y = r() * h;
      const rx = (0.25 + r() * 0.45) * PX;
      const ry = rx * (0.55 + r() * 0.3);
      const tone = Math.floor(84 + r() * 34);
      wrapped(ctx, w, h, x, y, rx, (cx, cy) => {
        ctx.beginPath();
        ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
        ctx.fillStyle = '#1c1a18';
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(cx, cy - ry * 0.08, rx * 0.86, ry * 0.8, 0, 0, Math.PI * 2);
        ctx.fillStyle = `rgb(${tone},${tone - 4},${tone - 8})`;
        ctx.fill();
        ctx.strokeStyle = 'rgba(15,15,15,0.7)';
        ctx.lineWidth = 2;
        for (let k = 0; k < 6; k++) {
          const a = (k / 6) * Math.PI * 2 + i;
          ctx.beginPath();
          ctx.moveTo(cx + Math.cos(a) * rx * 0.3, cy + Math.sin(a) * ry * 0.3);
          ctx.lineTo(cx + Math.cos(a) * rx * 0.82, cy + Math.sin(a) * ry * 0.75);
          ctx.stroke();
        }
      });
    }
  },
  // осадок: светлый ил из крошечных раковин, тонкая слоистость
  sediment: (ctx, w, h) => {
    const r = rng(113);
    ctx.fillStyle = '#d6cfbc';
    ctx.fillRect(0, 0, w, h);
    bands(ctx, w, h, r, 60, ['rgba(160,150,128,0.25)', 'rgba(240,236,222,0.3)', 'rgba(130,120,100,0.18)'], 0.05, 0.2, [0.01, 0.08]);
    speckle(ctx, w, h, r, 30000, ['rgba(250,248,240,0.7)', 'rgba(120,110,95,0.35)'], [1, 2.5], true);
  },
};

// Свойства слоёв: какая текстура, оттенок, жидкость или кристаллы, блёстки
const LAYER = {
  gneiss: { tint: [1, 1, 1] },
  granite: { tint: [1, 1, 1] },
  granulite: { tint: [1, 1, 1] },
  peridotite: { tint: [1, 1, 1] },
  wadsleyite: { tint: [1, 1, 1] },
  ringwoodite: { tint: [1, 1, 1] },
  bridgmanite: { tint: [1, 1, 1] },
  dpp: { tint: [1, 1, 1] },
  liquid: { tint: [1, 1, 1], liquid: 1 },
  crystal: { tint: [1, 1, 1], crystal: 1 },
  gabbro: { tint: [1, 1, 1] },
  dikes: { tint: [1, 1, 1] },
  pillows: { tint: [1, 1, 1] },
  sediment: { tint: [1, 1, 1] },
  water: { tint: [1, 1, 1] },
};

// Цвет нагретого тела (°C → линейный RGB), приближение по Таннеру Хелланду
export function blackbody(celsius) {
  const k = (celsius + 273) / 100;
  let r;
  let g;
  let b;
  if (k <= 66) {
    r = 255;
    g = 99.47 * Math.log(k) - 161.12;
    b = k <= 19 ? 0 : 138.52 * Math.log(k - 10) - 305.04;
  } else {
    r = 329.7 * Math.pow(k - 60, -0.1332);
    g = 288.12 * Math.pow(k - 60, -0.0755);
    b = 255;
  }
  const c = new THREE.Color(Math.min(255, Math.max(0, r)) / 255, Math.min(255, Math.max(0, g)) / 255, Math.min(255, Math.max(0, b)) / 255);
  return c.convertSRGBToLinear();
}

// Насколько светится порода: тусклое красное свечение с ~500 °C, вишнёвое к 800, оранжевое к 1 300,
// дальше — ярче до белого каления в ядре
export const glowOf = (c) => 0.22 * smooth((c - 470) / 120) + 0.8 * smooth((c - 600) / 900) + 0.6 * smooth((c - 2500) / 2500);

// --- шейдер стенки ----------------------------------------------------------------

const NOISE = `
uniform sampler2D uMapB, uMapAv, uMapBv;
uniform float uLB;
uniform float uMix, uOff, uBlur, uGlow, uLiquid, uCrystal, uTime, uFlow, uVarW, uWY;
uniform vec3 uTintA, uTintB, uGlowCol;
uniform vec4 uCav;
uniform float uTopCut; // выше этой высоты (м от глаз) трубы нет: там уже морское дно
uniform sampler2D uDetail;
uniform float uDetW, uSoft;
uniform float uFaultY, uFaultW, uFaultShift, uFaultOn;
uniform vec3 uFaultN;
uniform vec4 uKimb; // угол, полуширина (рад), верх и низ столба (м от глаз)
uniform vec3 uSlabN;
uniform vec3 uSlab; // высота плоскости на оси, полуширина, вкл
float faultShift = 0.0; // ниже плоскости разлома слои сдвинуты (и цвет, и рельеф)
varying vec3 vLocal;
${HOLE_GLSL}
// Смаз по вертикали: у каждой текстуры есть заранее смазанная копия (на обычную скорость стенки, uLB).
// Медленнее — смесь резкой и смазанной, быстрее — несколько выборок смазанной. Обычно это одна выборка
vec4 sampleLayer(sampler2D s, sampler2D b, vec2 uv) {
  if (uBlur < 0.0005) return texture(s, uv, uSoft);
  if (uBlur < uLB * 0.97) return mix(texture(s, uv, uSoft), texture(b, uv, uSoft), uBlur / uLB);
  float bias = clamp(uBlur * 60.0, uSoft, 2.5);
  if (uBlur < uLB * 1.03) return texture(b, uv, bias);
  float extra = uBlur - uLB;
  int taps = int(clamp(ceil(extra / uLB) + 1.0, 2.0, 8.0));
  vec4 c = vec4(0.0);
  for (int i = 0; i < taps; i++) {
    float o = (float(i) / float(taps - 1) - 0.5) * extra;
    c += texture(b, uv + vec2(0.0, o), bias);
  }
  return c / float(taps);
}
vec3 liquidRamp(float v) {
  vec3 a = vec3(0.42, 0.06, 0.01);
  vec3 b = vec3(1.0, 0.36, 0.05);
  vec3 c = vec3(1.0, 0.78, 0.32);
  vec3 d = vec3(1.0, 0.97, 0.88);
  return v < 0.4 ? mix(a, b, v / 0.4) : v < 0.75 ? mix(b, c, (v - 0.4) / 0.35) : mix(c, d, (v - 0.75) / 0.25);
}
`;

function wallMaterial(textures) {
  const u = {
    uMapB: { value: textures.gneiss },
    uMapAv: { value: textures.gneiss_v },
    uMapBv: { value: textures.gneiss_v },
    uLB: { value: LB },
    uMix: { value: 0 },
    uOff: { value: 0 },
    uBlur: { value: 0 },
    uGlow: { value: 0 },
    uLiquid: { value: 0 },
    uCrystal: { value: 0 },
    uTime: { value: 0 },
    uFlow: { value: 0 },
    uVarW: { value: 1 },
    uWY: { value: 0 },
    uTintA: { value: new THREE.Vector3(1, 1, 1) },
    uTintB: { value: new THREE.Vector3(1, 1, 1) },
    uGlowCol: { value: new THREE.Vector3(0, 0, 0) },
    uCav: { value: new THREE.Vector4(0, 9999, 0, 0) },
    uTopCut: { value: 1e6 },
    uDetail: { value: null },
    uDetW: { value: 0 },
    uSoft: { value: 0 },
    uFaultY: { value: -9999 },
    uFaultW: { value: FAULT.width },
    uFaultShift: { value: FAULT.shift },
    uFaultOn: { value: 0 },
    uFaultN: { value: faultNormal(FAULT) },
    uKimb: { value: new THREE.Vector4(thetaOf(KIMBERLITE.yaw), KIMBERLITE.half, -9999, -9999) },
    uSlabN: { value: faultNormal(SLAB) },
    uSlab: { value: new THREE.Vector3(-9999, SLAB.width, 0) },
    ...holeUniforms(),
  };
  const m = new THREE.MeshStandardMaterial({ map: textures.gneiss, bumpMap: textures.gneiss, bumpScale: 1.6, roughness: 0.85, metalness: 0, side: THREE.BackSide });
  m.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, u);
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vLocal;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvLocal = position;');
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\n' + NOISE)
      .replace(
        '#include <map_fragment>',
        `
  if (distance(vLocal, uCav.xyz) < uCav.w) discard; // полость в центре Земли
  if (inHole(vLocal)) discard; // то, что встречается в стенке (sights.js)
  if (vLocal.y > uTopCut) discard;
  float fd = dot(vLocal - vec3(0.0, uFaultY, 0.0), uFaultN);
  faultShift = fd < 0.0 ? uFaultShift * uFaultOn : 0.0;
  vec2 uv = vMapUv + vec2(0.0, uOff + faultShift);
  // вне смены слоя второй слой не читаем: это половина работы шейдера
  vec4 cA = vec4(0.0);
  vec4 cB = vec4(0.0);
  if (uMix < 0.999) cA = sampleLayer(map, uMapAv, uv);
  if (uMix > 0.001) cB = sampleLayer(uMapB, uMapBv, uv);
  vec3 base = mix(cA.rgb * uTintA, cB.rgb * uTintB, uMix);
  // та же неравномерность тона, что у стенки rock.js (для бесшовного стыка), со временем гаснет
  if (uVarW > 0.001) {
    float th = atan(vLocal.x, vLocal.z);
    float wy = uWY + vLocal.y;
    float n = 0.9 + 0.1 * sin(wy * 0.37 + th * 2.0) * sin(wy * 0.11 + 1.3) + 0.06 * sin(wy * 1.9 + th * 5.0);
    base *= mix(1.0, n, uVarW);
  }
  if (uDetW > 0.001) {
    float det = texture(uDetail, vec2(vMapUv.x * 16.0, uv.y * 8.0), log2(1.0 + uBlur * 1024.0)).r;
    base *= mix(1.0, 0.5 + det, uDetW);
  }
  if (uFaultOn > 0.5) {
    // разлом: полоса раздробленной породы (обломки тех же слоёв в тёмной перетёртой массе), по краям — гладкие плоскости
    float band = 1.0 - smoothstep(uFaultW - 0.035, uFaultW + 0.035, abs(fd));
    float frag = texture(uDetail, vec2(vMapUv.x * 4.0, uv.y * 2.0 + fd * 0.5)).r;
    float fine = texture(uDetail, vec2(vMapUv.x * 22.0, uv.y * 11.0)).r;
    vec3 clay = vec3(0.44, 0.4, 0.36) * (0.6 + 0.8 * fine);
    vec3 clast = mix(vec3(0.2, 0.18, 0.17), vec3(0.85, 0.82, 0.78), step(0.5, fract(frag * 7.0)));
    vec3 gouge = mix(clay, clast, smoothstep(0.56, 0.6, frag) + smoothstep(0.44, 0.4, frag));
    base = mix(base, gouge, band);
    float edge = exp(-pow((abs(fd) - uFaultW) / 0.025, 2.0));
    base *= 1.0 - 0.75 * edge;
  }
  // кимберлит: столб сине-серой брекчии с округлыми светлыми обломками (ксенолитами)
  float kimbK = 0.0;
  if (uKimb.z > uKimb.w) {
    float kth = atan(vLocal.x, vLocal.z);
    float dth = abs(mod(kth - uKimb.x + 3.14159265, 6.2831853) - 3.14159265);
    float kk = (1.0 - smoothstep(uKimb.y - 0.07, uKimb.y + 0.07, dth)) * smoothstep(uKimb.w - 2.0, uKimb.w, vLocal.y) * (1.0 - smoothstep(uKimb.z, uKimb.z + 2.0, vLocal.y));
    if (kk > 0.001) {
      float kf = texture(uDetail, vec2(vMapUv.x * 6.0, uv.y * 3.0)).r;
      float kfine = texture(uDetail, vec2(vMapUv.x * 20.0, uv.y * 10.0)).r;
      vec3 kimb = vec3(0.2, 0.27, 0.3) * (0.75 + 0.5 * kfine);
      kimb = mix(kimb, vec3(0.62, 0.62, 0.56), smoothstep(0.6, 0.64, kf));
      kimb = mix(kimb, vec3(0.3, 0.42, 0.2), smoothstep(0.38, 0.34, kf)); // зелёные обломки перидотита
      base = mix(base, kimb, kk);
      kimbK = kk;
    }
  }
  // плита: холодная (светится слабее) и тёмная полоса базальта и габбро бывшего океанского дна
  float slabK = 0.0;
  if (uSlab.z > 0.5) {
    float sd = dot(vLocal - vec3(0.0, uSlab.x, 0.0), uSlabN);
    slabK = 1.0 - smoothstep(uSlab.y - 0.3, uSlab.y + 0.3, abs(sd));
    float layered = 0.5 + 0.5 * sin(sd * 9.0);
    base = mix(base, mix(vec3(0.1, 0.12, 0.14), vec3(0.24, 0.25, 0.25), layered) * (0.8 + 0.4 * texture(uDetail, vec2(vMapUv.x * 12.0, uv.y * 6.0)).r), slabK * 0.95);
  }
  float lum = dot(base, vec3(0.3, 0.5, 0.2));
  // жидкое железо: два слоя узора текут навстречу, яркость → цвет
  float liq = 0.0;
  if (uLiquid > 0.001) {
    vec2 q = vMapUv * vec2(1.0, 0.7);
    float a = texture2D(map, q + vec2(uTime * 0.013, uFlow * 0.9 + uOff * 0.6)).r;
    float b = texture2D(map, q * vec2(2.0, 1.6) + vec2(-uTime * 0.021, uFlow * 1.7 + uOff * 0.4 + a * 0.15)).r;
    liq = clamp(a * 0.65 + b * 0.55 - 0.12, 0.0, 1.0);
    base = mix(base, liquidRamp(liq) * 0.55, uLiquid);
  }
  // кристаллы железа: грани разной яркости
  // кристаллы железа во внутреннем ядре: золотые грани, раскалённые добела швы, грани чуть мерцают от жара
  float cry = 0.0;
  float seam = 0.0;
  vec3 cryCol = vec3(0.0);
  if (uCrystal > 0.001) {
    cry = mix(cA.r, cB.r, uMix);
    seam = 1.0 - smoothstep(0.08, 0.17, cry); // значения линейные (текстура в sRGB): швы ≤ 0,07, грани ≥ 0,2
    float flick = 0.88 + 0.12 * sin(uTime * (1.3 + cry * 2.7) + cry * 41.0);
    cryCol = mix(vec3(0.82, 0.46, 0.16), vec3(1.0, 0.88, 0.6), smoothstep(0.2, 1.0, cry)) * flick;
    base = mix(base, cryCol * (1.0 - 0.6 * seam), uCrystal);
  }
  diffuseColor.rgb *= base;
  // раскалённая порода светится сильнее всего по трещинам и швам между зёрнами — сами минералы
  // сохраняют цвет (зелёный оливин, синий рингвудит)
  float dark = 1.0 - clamp(sqrt(lum) * 1.6, 0.0, 1.0); // яркость «на глаз», а не линейная
  float glowPat = 0.12 + 1.1 * dark * dark * dark;
  vec3 glowAdd = uGlowCol * uGlow * glowPat * 0.75 * (1.0 - uLiquid) * (1.0 - uCrystal) * (1.0 - 0.9 * slabK) * (1.0 - 0.6 * kimbK);
  glowAdd += liquidRamp(liq) * (0.9 + 1.6 * liq) * uLiquid * uGlow;
  glowAdd += (cryCol * (0.32 + 0.6 * cry * cry) + vec3(1.0, 0.42, 0.08) * 2.4 * seam) * uCrystal * uGlow * 0.8;
`
      )
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\ntotalEmissiveRadiance += glowAdd;')
      // рельеф едет вместе с текстурой
      .replace('#include <bumpmap_pars_fragment>', THREE.ShaderChunk.bumpmap_pars_fragment.replaceAll('texture2D( bumpMap, vBumpMapUv', 'texture2D( bumpMap, vBumpMapUv + vec2(0.0, uOff + faultShift)'));
  };
  return { material: m, uniforms: u };
}

// Труба вокруг камеры (как стенка rock.js: x = R sin θ, z = R cos θ), v — в метрах / TILE
function tubeGeometry() {
  const segs = 48;
  const rows = HALF_LEN * 2;
  const pos = [];
  const nor = [];
  const uv = [];
  for (let y = 0; y <= rows; y++) {
    for (let x = 0; x <= segs; x++) {
      const th = (x / segs) * Math.PI * 2;
      const yy = HALF_LEN - (y / rows) * HALF_LEN * 2;
      pos.push(R * Math.sin(th), yy, R * Math.cos(th));
      nor.push(Math.sin(th), 0, Math.cos(th));
      uv.push(x / segs, yy / TILE);
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
  geo.setIndex(idx);
  return geo;
}

// --- путь: где мы в слоях и как далеко скользнула текстура -----------------------------------------

const DIR_FLIP = CENTER[1]; // после невесомости стенки едут вниз — подъём
const STEP = 1 / 240;
const T_END = DURATION + 1;
const P = new Float64Array(Math.ceil((T_END - HANDOFF) / STEP) + 2);
{
  let p = 0;
  for (let i = 0; i < P.length; i++) {
    P[i] = p;
    const t = HANDOFF + i * STEP;
    const v = (depthAt(t + 0.02) - depthAt(t - 0.02)) / 0.04;
    p += Math.min(Math.abs(v), vcap(t)) * (t < DIR_FLIP ? 1 : -1) * STEP;
  }
}
// Визуальный сдвиг стенок (м) от момента передачи: растёт, пока падаем, убывает, когда поднимаемся
export function slideAt(t) {
  const x = Math.min(P.length - 2, Math.max(0, (t - HANDOFF) / STEP));
  const i = Math.floor(x);
  return P[i] + (P[i + 1] - P[i]) * (x - i);
}
const P_CENTER = slideAt((CENTER[0] + CENTER[1]) / 2);

// когда путь пересекает границы слоёв (для смешивания по времени, а не по метрам)
const BOUNDS = LAYERS.slice(1).map(([s0, name], i) => {
  let lo = HANDOFF;
  let hi = T_END;
  for (let k = 0; k < 60; k++) {
    const mid = (lo + hi) / 2;
    if (depthAt(mid) < s0) lo = mid;
    else hi = mid;
  }
  return { t: hi, from: LAYERS[i][1], to: name };
});

function layerState(t, s) {
  let cur = LAYERS[0][1];
  for (const [s0, name] of LAYERS) if (s >= s0) cur = name;
  // ближайшая граница по времени: смешиваем в окне ±W с
  const W = 1.6;
  for (const b of BOUNDS) {
    if (Math.abs(t - b.t) < W) return { a: b.from, b: b.to, mix: smooth((t - b.t + W) / (2 * W)) };
  }
  return { a: cur, b: cur, mix: 0 };
}

// --- сборка ---------------------------------------------------------------------

export function buildDeep() {
  const group = new THREE.Group();
  const textures = {};
  for (const name of Object.keys(CANVAS)) {
    textures[name] = texturePair(CANVAS[name]).map;
    textures[name + '_v'] = blurredCopy(textures[name]);
  }
  textures.detail = canvasTexture(512, 512, detailCanvas);
  textures.detail.wrapS = textures.detail.wrapT = THREE.RepeatWrapping;
  textures.detail.colorSpace = THREE.NoColorSpace; // множитель около 1, без гамма-перевода
  textures.detail.needsUpdate = true;
  textures.water = textures.sediment;
  textures.water_v = textures.sediment_v;
  const { material, uniforms } = wallMaterial(textures);
  uniforms.uDetail.value = textures.detail;
  const tube = new THREE.Mesh(tubeGeometry(), material);
  tube.frustumCulled = false;
  group.add(tube);

  // полость в центре Земли — сфера из тех же кристаллов, с отверстиями под трубу сверху и снизу
  const cav = wallMaterial(textures);
  cav.material.onBeforeCompile = ((orig) => (shader) => {
    orig(shader);
    shader.fragmentShader = shader.fragmentShader.replace('if (distance(vLocal, uCav.xyz) < uCav.w) discard;', 'if (vLocal.x * vLocal.x + vLocal.z * vLocal.z < ' + (R * R).toFixed(3) + ') discard;');
  })(cav.material.onBeforeCompile);
  cav.material.map = textures.crystal;
  cav.material.bumpMap = textures.crystal;
  cav.material.bumpScale = 0.8;
  cav.uniforms.uDetail.value = textures.detail;
  cav.uniforms.uMapB.value = textures.crystal;
  cav.uniforms.uMapAv.value = textures.crystal_v;
  cav.uniforms.uMapBv.value = textures.crystal_v;
  cav.uniforms.uCrystal.value = 1;
  cav.uniforms.uVarW.value = 0;
  const sphere = new THREE.SphereGeometry(CAVITY_R, 64, 48);
  // развёртка сферы: u — по кругу, v — по высоте (как у трубы)
  const sp = sphere.attributes.position;
  const suv = sphere.attributes.uv;
  for (let i = 0; i < sp.count; i++) suv.setXY(i, (Math.atan2(sp.getX(i), sp.getZ(i)) / (Math.PI * 2) + 1) % 1, sp.getY(i) / TILE);
  const cavity = new THREE.Mesh(sphere, cav.material);
  cavity.visible = false;
  group.add(cavity);

  // блёстки (слюда, грани кристаллов) и угольки (капли расплава, искры в жидком металле) — на стенке
  const sr = rng(201);
  const mkPoints = (n, size, color, additive) => {
    const base = [];
    for (let i = 0; i < n; i++) base.push({ th: sr() * Math.PI * 2, y: (sr() - 0.5) * HALF_LEN * 2, ph: sr() });
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(n * 3), 3));
    const mat = new THREE.PointsMaterial({ color, size, transparent: true, depthWrite: false, blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending });
    const pts = new THREE.Points(geo, mat);
    pts.frustumCulled = false;
    group.add(pts);
    return { pts, base, geo, mat };
  };
  const sparkles = mkPoints(5000, 0.02, 0xe6ecf5, false);
  const embers = mkPoints(1400, 0.06, 0xffa040, true);

  // «пыль скорости»: короткие светлые штрихи у стенок, летят быстрее стенки — видно, что падаем быстро
  const streakN = 220;
  const streakPos = new Float32Array(streakN * 6);
  const streakBase = Array.from({ length: streakN }, () => ({ th: sr() * Math.PI * 2, rr: R - 0.15 - sr() * 0.5, y: (sr() - 0.5) * HALF_LEN * 2, len: 0.6 + sr() * 1.6, ph: sr() }));
  const streakGeo = new THREE.BufferGeometry();
  streakGeo.setAttribute('position', new THREE.BufferAttribute(streakPos, 3));
  const streakMat = new THREE.LineBasicMaterial({ color: 0xfff4e6, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending });
  const streaks = new THREE.LineSegments(streakGeo, streakMat);
  streaks.frustumCulled = false;
  group.add(streaks);

  // алмазы: октаэдры в стенке на глубине 140–210 км
  const dia = new THREE.InstancedMesh(new THREE.OctahedronGeometry(1, 0), new THREE.MeshStandardMaterial({ color: 0xf2f6ff, roughness: 0.05, metalness: 0.4, emissive: 0x334455, flatShading: true }), 260);
  dia.frustumCulled = false;
  const diaBase = Array.from({ length: 260 }, () => ({ th: sr() * Math.PI * 2, y: (sr() - 0.5) * HALF_LEN * 2, size: 0.012 + sr() * 0.02, rx: sr() * 6, ry: sr() * 6 }));
  group.add(dia);

  const sights = buildSights(textures);
  group.add(sights.group);

  return { group, tube, uniforms, textures, cavity, cavU: cav.uniforms, sparkles, embers, dia, diaBase, streaks, streakBase, streakGeo, streakMat, sights };
}

const m4 = new THREE.Matrix4();
const q4 = new THREE.Quaternion();
const e4 = new THREE.Euler();
const one = new THREE.Vector3();

// t — время, s — пройденный путь (м), camY — высота камеры в мире; возвращает свет и туман для main.js
export function updateDeep(d, t, s, cam, topCut = 1e6) {
  d.group.position.copy(cam);
  const slide = slideAt(t);
  const yVis = cam.y - slide; // «мировая» высота камеры для текстуры: как в rock.js
  const u = d.uniforms;
  u.uTopCut.value = topCut;
  const st = layerState(t, s);
  const A = LAYER[st.a];
  const B = LAYER[st.b];
  u.uMapB.value = d.textures[st.b];
  u.uMapAv.value = d.textures[st.a + '_v'];
  u.uMapBv.value = d.textures[st.b + '_v'];
  d.tube.material.map = d.textures[st.a];
  u.uMix.value = st.mix;
  u.uOff.value = ((yVis / TILE) % 1 + 1) % 1;
  u.uWY.value = yVis % 6283.185; // для неравномерности тона (период общий у синусов не нужен — она гаснет)
  const settle = smooth((t - HANDOFF) / 12);
  u.uVarW.value = 1 - settle;
  u.uTintA.value.set(...A.tint);
  u.uTintB.value.set(...B.tint);
  const speed = Math.abs((depthAt(t + 0.05) - depthAt(t - 0.05)) / 0.1);
  const vis = Math.min(speed, vcap(t));
  u.uBlur.value = Math.min(0.12, Math.max(0, (vis / 60 / TILE) * (1.2 - 0.6 * smooth((t - HANDOFF) / 16)) - 0.0015));
  u.uLiquid.value = (A.liquid || 0) * (1 - st.mix) + (B.liquid || 0) * st.mix;
  u.uCrystal.value = (A.crystal || 0) * (1 - st.mix) + (B.crystal || 0) * st.mix;
  // вблизи: мягче квадратные крапинки, мелкое зерно и рельеф; на скорости рельеф гаснет, зерно уходит в смаз
  u.uSoft.value = 0.6 * settle;
  // зерно и рельеф видны только вблизи и медленно; на обычной скорости их не считаем вовсе
  u.uDetW.value = 0.5 * settle * (1 - smooth(u.uBlur.value / 0.008));
  const bumpK = 1.6 * Math.abs(1 - 2 * st.mix) * (1 - u.uLiquid.value) * (1 - 0.6 * u.uCrystal.value) * (1 - settle * smooth(u.uBlur.value / 0.007));
  const wantBump = bumpK > 0.002;
  if (wantBump !== !!d.tube.material.bumpMap) d.tube.material.needsUpdate = true;
  d.tube.material.bumpMap = wantBump ? d.textures[st.mix < 0.5 ? st.a : st.b] : null;
  d.tube.material.bumpScale = bumpK;
  u.uTime.value = t;
  u.uFlow.value = t * 0.02;
  const T = temperatureAt(s);
  const glow = glowOf(T);
  const gc = blackbody(T);
  u.uGlowCol.value.set(gc.r, gc.g, gc.b);
  u.uGlow.value = glow;
  // полость в центре: подходит снизу, пока падаем, и уходит вниз, когда поднимаемся
  const cy = slide - P_CENTER;
  const near = Math.abs(cy) < HALF_LEN + CAVITY_R;
  d.cavity.visible = near;
  u.uCav.value.set(0, near ? cy : 9999, 0, near ? CAVITY_R : 0);
  if (near) {
    d.cavity.position.set(0, cy, 0);
    const cu = d.cavU;
    cu.uOff.value = 0;
    cu.uGlowCol.value.copy(u.uGlowCol.value);
    cu.uGlow.value = glow;
    cu.uBlur.value = u.uBlur.value;
  }
  updateSights(d.sights, t, (t0) => slide - slideAt(t0), cam, u);
  // разлом: пока плоскость в пределах трубы — рисует шейдер; когда ушла выше — сдвиг слоёв остаётся навсегда
  const fy = slide - slideAt(FAULT.t);
  const faultPassed = t > FAULT.t && fy >= 80;
  u.uFaultOn.value = t < CENTER[0] && Math.abs(fy) < 80 ? 1 : 0;
  u.uFaultY.value = fy;
  if (faultPassed) u.uOff.value = (u.uOff.value + FAULT.shift) % 1;
  const ky = slide - slideAt(KIMBERLITE.t);
  const kOn = t < CENTER[0] && Math.abs(ky) < KIMBERLITE.length / 2 + 75;
  u.uKimb.value.z = kOn ? ky + KIMBERLITE.length / 2 : -9999;
  u.uKimb.value.w = kOn ? ky - KIMBERLITE.length / 2 : -9999;
  const sy = slide - slideAt(SLAB.t);
  u.uSlab.value.x = sy;
  u.uSlab.value.z = t < CENTER[0] && Math.abs(sy) < 80 ? 1 : 0;
  // блёстки и угольки едут вместе со стенкой
  const isCrust = ['gneiss', 'granite', 'granulite', 'gabbro', 'dikes', 'pillows', 'sediment'].includes(st.mix < 0.5 ? st.a : st.b);
  const moveWall = (P, keep) => {
    const arr = P.geo.attributes.position.array;
    P.base.forEach((p, i) => {
      let y = p.y + slide;
      y = ((((y + HALF_LEN) % (2 * HALF_LEN)) + 2 * HALF_LEN) % (2 * HALF_LEN)) - HALF_LEN;
      const rr = R - 0.012;
      const x = rr * Math.sin(p.th);
      const z = rr * Math.cos(p.th);
      const visible = keep(p, y) && y < topCut && !inAnyHole(u, x, y, z);
      arr[i * 3] = x;
      arr[i * 3 + 1] = visible ? y : 9999;
      arr[i * 3 + 2] = z;
    });
    P.geo.attributes.position.needsUpdate = true;
  };
  const sparkleOn = isCrust ? 1 : st.a === 'crystal' || st.b === 'crystal' ? 0.6 : 0.25;
  d.sparkles.mat.opacity = sparkleOn;
  d.sparkles.mat.size = 0.02 * (1 - 0.5 * smooth(vis / 40));
  moveWall(d.sparkles, (p) => p.ph < sparkleOn);
  // угольки: капли расплава в астеносфере (100–250 км), искры в жидком ядре, пятна в D″
  const melt = smooth((s - 95000) / 15000) * (1 - smooth((s - 240000) / 30000));
  const coreSparks = u.uLiquid.value;
  const dppSpots = st.a === 'dpp' || st.b === 'dpp' ? 0.6 : 0;
  const emberOn = Math.max(melt * 0.7, coreSparks, dppSpots) * (s > HALF ? (EARTH - s > 90000 ? 1 : 0) : 1);
  d.embers.mat.opacity = emberOn;
  d.embers.mat.color.setRGB(1, coreSparks > 0.5 ? 0.85 : 0.55, coreSparks > 0.5 ? 0.55 : 0.2);
  d.embers.mat.size = 0.05 + 0.05 * coreSparks;
  moveWall(d.embers, (p) => p.ph < emberOn);
  // пыль скорости: видна, когда падаем быстрее, чем скользит стенка
  const fast = smooth((speed - 20) / 200);
  d.streakMat.opacity = 0.32 * fast;
  if (fast > 0.01) {
    const arr = d.streakGeo.attributes.position.array;
    const flow = t * 55 * (t < DIR_FLIP ? 1 : -1);
    d.streakBase.forEach((p, i) => {
      let y = p.y + flow;
      y = ((((y + HALF_LEN) % (2 * HALF_LEN)) + 2 * HALF_LEN) % (2 * HALF_LEN)) - HALF_LEN;
      const x = p.rr * Math.sin(p.th);
      const z = p.rr * Math.cos(p.th);
      const yy = y < topCut - p.len ? y : 9999;
      arr.set([x, yy, z, x, yy - p.len * (t < DIR_FLIP ? 1 : -1), z], i * 6);
    });
    d.streakGeo.attributes.position.needsUpdate = true;
  }
  // алмазы
  const diamonds = s < HALF ? smooth((s - 140000) / 8000) * (1 - smooth((s - 205000) / 8000)) : 0;
  d.dia.visible = diamonds > 0.01;
  if (d.dia.visible) {
    d.diaBase.forEach((p, i) => {
      let y = p.y + slide;
      y = ((((y + HALF_LEN) % (2 * HALF_LEN)) + 2 * HALF_LEN) % (2 * HALF_LEN)) - HALF_LEN;
      const sz = p.size * diamonds;
      const rr = R - sz * 0.4;
      q4.setFromEuler(e4.set(p.rx + t * 0.0, p.ry, 0));
      m4.compose(one.set(rr * Math.sin(p.th), y, rr * Math.cos(p.th)), q4, new THREE.Vector3(sz, sz, sz));
      d.dia.setMatrixAt(i, m4);
    });
    d.dia.instanceMatrix.needsUpdate = true;
  }
  return { T, glow, glowColor: gc, layer: st, speed, crystal: u.uCrystal.value, liquid: u.uLiquid.value };
}

export { tintAt, TW, TH };
