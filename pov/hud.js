// Надписи поверх кадра: крупный блок глубины сверху слева (место, число, сравнение, что дальше),
// шкала пути справа, подписи по центру, затемнения на входе, на выходе и сквозь перекрытия.
import { CAPTIONS, CENTER, COMPARE, EARTH, MILESTONES, OCEAN, TITLE, DURATION, temperatureAt } from './timeline.js';
import { rng } from './util.js';
import { smooth, window01 } from './util.js';

const $ = (id) => document.getElementById(id);
const HALF = EARTH / 2;
const REVEAL = 774; // с этой секунды «?» внизу шкалы становится «Индийским океаном»

// Шкала пути справа: до центра — логарифм по вехам (первые метры тоже видно), после центра — зеркально
const ANCHORS = [[0, 0], [12, 0.05], [1000, 0.15], [12262, 0.24], [36000, 0.29], [660000, 0.38], [2890000, 0.44], [5150000, 0.48], [HALF, 0.5]];
function half(m) {
  const L = (x) => Math.log10(1 + x);
  for (let i = 1; i < ANCHORS.length; i++) {
    const [m0, p0] = ANCHORS[i - 1];
    const [m1, p1] = ANCHORS[i];
    if (m <= m1) return p0 + ((p1 - p0) * (L(m) - L(m0))) / (L(m1) - L(m0));
  }
  return 0.5;
}
const scale = (m) => (m <= HALF ? half(Math.max(0, m)) : 1 - half(Math.max(0, EARTH - m)));
const TICKS = [
  [0, 'NEW YORK', 0],
  [12, 'subway', 0],
  [12262, 'deepest hole', 0],
  [36000, 'mantle', 0],
  [2890000, 'core', 0],
  [HALF, 'centre', 0],
  [EARTH - 2890000, 'core', 1],
  [EARTH - 4321, 'seafloor', 1],
  [EARTH, '?', 2],
  [EARTH, 'INDIAN OCEAN', 3],
];

const DROPS = [];

// --- карта «что напротив Таймс-сквер»: упрощённые очертания материков (долгота, широта) --------------
export const LAND = [
  [[-168, 66], [-140, 70], [-95, 72], [-80, 63], [-62, 58], [-56, 52], [-66, 45], [-70, 42], [-76, 35], [-81, 31], [-80, 25], [-84, 30], [-90, 29], [-97, 26], [-97, 20], [-87, 21], [-83, 15], [-80, 9], [-78, 8], [-85, 11], [-92, 15], [-105, 20], [-112, 29], [-117, 33], [-123, 38], [-124, 48], [-135, 58], [-152, 58], [-165, 61]],
  [[-55, 60], [-44, 60], [-20, 70], [-20, 80], [-60, 82], [-70, 77], [-55, 70]],
  [[-80, 9], [-72, 12], [-60, 10], [-50, 0], [-35, -5], [-38, -13], [-40, -22], [-48, -27], [-53, -34], [-58, -38], [-65, -41], [-68, -50], [-70, -55], [-74, -50], [-73, -40], [-71, -30], [-70, -18], [-76, -14], [-81, -5], [-80, 1], [-77, 7]],
  [[-10, 36], [-9, 43], [-1, 46], [-5, 48], [1, 51], [8, 54], [5, 58], [10, 63], [18, 70], [30, 71], [42, 67], [60, 70], [70, 73], [90, 76], [110, 77], [130, 72], [150, 71], [170, 70], [180, 66], [170, 60], [160, 58], [155, 50], [142, 47], [135, 43], [130, 35], [122, 40], [121, 31], [118, 24], [110, 20], [108, 12], [105, 9], [100, 13], [98, 8], [100, 3], [103, 1], [98, 16], [92, 22], [88, 22], [80, 15], [77, 8], [73, 17], [67, 25], [57, 25], [52, 28], [48, 30], [56, 24], [59, 22], [52, 16], [44, 13], [42, 16], [35, 28], [34, 31], [36, 36], [28, 36], [26, 40], [23, 36], [20, 40], [15, 38], [12, 44], [8, 44], [3, 43], [-2, 37]],
  [[-17, 21], [-17, 15], [-12, 8], [-5, 5], [3, 6], [9, 4], [9, -1], [12, -6], [13, -12], [12, -18], [15, -27], [18, -34], [20, -35], [27, -34], [32, -29], [35, -24], [35, -18], [40, -15], [40, -10], [39, -5], [42, 0], [51, 12], [44, 11], [42, 16], [38, 19], [35, 24], [32, 31], [25, 32], [20, 31], [11, 33], [10, 37], [0, 36], [-6, 36], [-10, 30], [-13, 27]],
  [[114, -22], [114, -34], [118, -35], [124, -34], [132, -32], [138, -35], [141, -38], [147, -38], [150, -37], [153, -31], [153, -25], [146, -19], [145, -15], [142, -11], [138, -17], [136, -12], [130, -12], [125, -14], [122, -18]],
  [[-180, -72], [-120, -73], [-60, -64], [-40, -78], [0, -70], [60, -67], [120, -66], [180, -72], [180, -90], [-180, -90]],
  [[130, 31], [141, 36], [142, 41], [141, 45], [140, 40], [135, 34]],
  [[-5, 50], [1, 51], [-2, 56], [-6, 58], [-5, 54]],
  [[44, -25], [47, -25], [50, -15], [49, -12], [44, -17]],
  [[166, -46], [174, -41], [178, -38], [173, -35], [172, -41], [168, -46]],
  [[109, 1], [117, 7], [119, 1], [116, -4], [110, -3]],
  [[95, 5], [98, 4], [106, -6], [102, -5]],
  [[131, -1], [141, -3], [150, -10], [141, -9], [134, -4]],
];
const MAP = { t0: 744.6, t1: 780, w: 300, h: 150, nyc: [-73.98, 40.76], anti: [106.02, -40.76], china: [104, 35], aus: [134, -25] };
const mx = (lon) => ((lon + 180) / 360) * MAP.w;
const my = (lat) => ((90 - lat) / 180) * MAP.h;
let mapBase = null;

function drawMap(t) {
  const c = $('map');
  const ctx = c.getContext('2d');
  const W = c.width;
  const H = c.height;
  const pad = 10;
  if (!mapBase) {
    mapBase = document.createElement('canvas');
    mapBase.width = W;
    mapBase.height = H;
    const b = mapBase.getContext('2d');
    b.fillStyle = 'rgba(6,16,24,0.62)';
    b.beginPath();
    b.roundRect(0, 0, W, H, 8);
    b.fill();
    b.save();
    b.translate(pad, pad);
    b.fillStyle = 'rgba(40,90,120,0.55)'; // океан
    b.fillRect(0, 0, MAP.w, MAP.h);
    b.fillStyle = 'rgba(214,224,230,0.85)';
    for (const poly of LAND) {
      b.beginPath();
      poly.forEach(([lo, la], i) => (i ? b.lineTo(mx(lo), my(la)) : b.moveTo(mx(lo), my(la))));
      b.closePath();
      b.fill();
    }
    b.restore();
  }
  ctx.clearRect(0, 0, W, H);
  ctx.drawImage(mapBase, 0, 0);
  ctx.save();
  ctx.translate(pad, pad);
  const pin = (lon, lat, color, r, alpha) => {
    if (alpha <= 0) return;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(mx(lon), my(lat), r, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  };
  const label = (text, lon, lat, dx, dy, alpha, color = '#f4f6f8') => {
    if (alpha <= 0) return;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    ctx.font = '700 10px "Space Grotesk", sans-serif';
    ctx.fillText(text, mx(lon) + dx, my(lat) + dy);
    ctx.globalAlpha = 1;
  };
  // Нью-Йорк — всегда
  pin(...MAP.nyc, '#5ff2e8', 4, 1);
  label('NEW YORK', ...MAP.nyc, 7, -4, 1);
  // «Не Китай. Не Австралия.» — метки с крестиками
  const noK = smooth((t - 752) / 0.5) * (1 - smooth((t - 765) / 1));
  for (const [lon, lat, name] of [[...MAP.china, 'CHINA'], [...MAP.aus, 'AUSTRALIA']]) {
    pin(lon, lat, '#ff7a6a', 3.5, noK);
    if (noK > 0) {
      ctx.globalAlpha = noK;
      ctx.strokeStyle = '#ff7a6a';
      ctx.lineWidth = 2;
      const x = mx(lon);
      const y = my(lat);
      ctx.beginPath();
      ctx.moveTo(x - 6, y - 6);
      ctx.lineTo(x + 6, y + 6);
      ctx.moveTo(x + 6, y - 6);
      ctx.lineTo(x - 6, y + 6);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
    label(name, lon, lat, 8, 4, noK, '#ffb0a6');
  }
  // «У большинства мест напротив — океан»: океан на миг светлеет
  const sea = smooth((t - 767) / 0.6) * (1 - smooth((t - 772.5) / 1));
  if (sea > 0) {
    ctx.globalAlpha = 0.35 * sea * (0.6 + 0.4 * Math.sin(t * 5));
    ctx.fillStyle = '#5ff2e8';
    ctx.globalCompositeOperation = 'destination-over';
    ctx.fillRect(0, 0, MAP.w, MAP.h);
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
  }
  // ответ: точка напротив — в южной части Индийского океана
  const ans = smooth((t - 774) / 0.5);
  if (ans > 0) {
    const ring = ((t - 774) % 1.2) / 1.2;
    ctx.globalAlpha = ans * (1 - ring);
    ctx.strokeStyle = '#5ff2e8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(mx(MAP.anti[0]), my(MAP.anti[1]), 4 + ring * 12, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
  pin(...MAP.anti, '#5ff2e8', 4, ans);
  label('40.76° S · 106.01° E', ...MAP.anti, -54, 16, ans, '#5ff2e8');
  // до ответа — вопрос
  label('?', 30, -10, 0, 0, smooth((t - 745.2) / 0.6) * (1 - smooth((t - 773.6) / 0.4)), '#5ff2e8');
  ctx.restore();
}

export function buildHud() {
  // капли на объективе после выхода из воды
  const r = rng(808);
  for (let i = 0; i < 18; i++) {
    const el = document.createElement('div');
    el.className = 'drop';
    const size = 18 + r() * r() * 70;
    el.style.width = `${size}px`;
    el.style.height = `${size * (1.05 + r() * 0.2)}px`;
    $('drops').appendChild(el);
    DROPS.push({ el, x: r() * 1240, y: r() * 680, v: 8 + r() * 40 * (size / 80), size });
  }
  const bar = $('bar');
  for (const [m, label, group] of TICKS) {
    const tick = document.createElement('div');
    tick.className = 'tick';
    tick.dataset.group = group;
    tick.style.top = `${scale(m) * 100}%`;
    tick.textContent = label;
    bar.appendChild(tick);
  }
}

// Число глубины и единица: до 10 км — метры, дальше — километры
function formatDepth(d) {
  if (d >= 10000) return [(d / 1000).toLocaleString('en-US', { maximumFractionDigits: d < 100000 ? 1 : 0 }), 'km'];
  if (d < 10) return [d.toFixed(2), 'm'];
  if (d < 100) return [d.toFixed(1), 'm'];
  return [Math.round(d).toLocaleString('en-US'), 'm'];
}

function formatTemp(c) {
  return `${Math.round(c).toLocaleString('en-US')} °C`;
}

export function updateHud(t, depth, underground, through = 0) {
  // depth — пройденный путь (м). До центра это глубина; после — показываем, сколько осталось до поверхности
  const rising = depth > HALF + 1 || t > CENTER[1];
  const shown = rising ? Math.max(0, EARTH - depth) : depth;
  let place = underground ? 'BELOW TIMES SQUARE · NEW YORK' : 'TIMES SQUARE · NEW YORK';
  if (depth > 1.2e6) place = 'INSIDE THE EARTH';
  if (rising) place = t < REVEAL ? 'THE OTHER SIDE OF THE EARTH' : 'BELOW THE INDIAN OCEAN';
  if (rising && shown < 4321.5) place = 'SOUTHERN INDIAN OCEAN';
  if (rising && shown < 1) place = '40.76° S · 106.01° E';
  $('place').textContent = place;
  const [num, unit] = formatDepth(shown);
  $('depth').textContent = num;
  $('depth').nextSibling.textContent = unit;
  let cmp = COMPARE[0][1];
  for (const [m, text] of COMPARE) if (depth >= m) cmp = text;
  $('compare').textContent = cmp;
  const next = MILESTONES.find(([m]) => m > depth + 0.05);
  if (next) {
    const [n, u] = formatDepth(next[0] - depth);
    $('nextname').textContent = next[1];
    $('nextdist').textContent = `in ${n} ${u}`;
  }
  // на поверхности «дальше» уже нет
  const nextOn = next ? 1 : 0;
  $('nextname').parentElement.style.opacity = nextOn;
  $('nextdist').style.opacity = nextOn;
  $('dot').style.top = `${scale(depth) * 100}%`;
  // температура вокруг — с тех пор, как вокруг скала
  $('tval').textContent = formatTemp(temperatureAt(depth));
  $('temp').style.opacity = smooth((t - 47) / 1.5).toFixed(3);
  // метки шкалы: вторая половина — после центра, «?» → «Индийский океан» — когда это сказано
  for (const tick of $('bar').querySelectorAll('.tick')) {
    const g = +tick.dataset.group;
    const on = g === 0 ? 1 : g === 1 ? smooth((t - CENTER[1]) / 2) : g === 2 ? 1 - smooth((t - REVEAL) / 1.5) : smooth((t - REVEAL) / 1.5);
    tick.style.opacity = (0.7 * on).toFixed(3);
  }

  const hudOut = TITLE ? smooth((t - TITLE[0] + 0.2) / 0.6) : 0;
  $('hud').style.opacity = (smooth((t - 0.6) / 0.8) * (1 - hudOut)).toFixed(3);

  const cap = CAPTIONS.find(([a, b]) => t >= a && t <= b);
  const el = $('caption');
  if (cap) {
    if (el.dataset.text !== cap[2]) {
      el.dataset.text = cap[2];
      el.innerHTML = '';
      el.appendChild(document.createElement('span')).textContent = cap[2];
    }
    el.style.opacity = window01(t, cap[0], cap[1], 0.28).toFixed(3);
  } else {
    el.style.opacity = '0';
  }

  // капли: появляются, когда голова выходит из воды, сползают и высыхают
  const ds = t - OCEAN.surface;
  const dropsOn = ds > -0.05 && ds < 3.2 ? smooth((ds + 0.05) / 0.1) * (1 - smooth((ds - 1.6) / 1.6)) : 0;
  $('drops').style.opacity = dropsOn.toFixed(3);
  if (dropsOn > 0) for (const d of DROPS) d.el.style.transform = `translate(${d.x}px, ${(d.y + d.v * Math.max(0, ds) ** 1.5).toFixed(1)}px)`;
  // карта «что напротив»
  const mapOn = smooth((t - MAP.t0) / 0.8) * (1 - smooth((t - MAP.t1 + 0.8) / 0.8));
  $('map').style.opacity = mapOn.toFixed(3);
  if (mapOn > 0) drawMap(t);
  $('title').style.opacity = TITLE ? smooth((t - TITLE[0]) / 0.7).toFixed(3) : '0';
  // затемнение: вход из чёрного, миг темноты сквозь перекрытия и воду, уход в чёрное
  const fade = Math.max(1 - smooth(t / 0.8), through, smooth((t - (DURATION - 0.6)) / 0.6));
  $('fade').style.opacity = fade.toFixed(3);
}
