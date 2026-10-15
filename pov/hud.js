// Надписи поверх кадра: крупный блок глубины сверху слева (место, число, сравнение, что дальше),
// шкала пути справа, подписи по центру, затемнения на входе, на выходе и сквозь перекрытия.
import { CAPTIONS, CENTER, COMPARE, EARTH, MILESTONES, TITLE, DURATION, temperatureAt } from './timeline.js';
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

export function buildHud() {
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

  $('title').style.opacity = TITLE ? smooth((t - TITLE[0]) / 0.7).toFixed(3) : '0';
  // затемнение: вход из чёрного, миг темноты сквозь перекрытия и воду, уход в чёрное
  const fade = Math.max(1 - smooth(t / 0.8), through, smooth((t - (DURATION - 0.6)) / 0.6));
  $('fade').style.opacity = fade.toFixed(3);
}
