// Надписи поверх кадра: крупный блок глубины сверху слева (место, число, сравнение, что дальше),
// шкала пути справа, подписи по центру, затемнения на входе, на выходе и сквозь перекрытия.
import { CAPTIONS, COMPARE, MILESTONES, TITLE, DURATION } from './timeline.js';
import { smooth, window01 } from './util.js';

const $ = (id) => document.getElementById(id);
const EARTH = 12742000; // диаметр Земли, м: шкала справа — от Нью-Йорка до другой стороны

// Логарифмическая шкала: первые метры тоже заметно двигают точку
const scale = (m) => Math.log10(1 + m) / Math.log10(1 + EARTH);
const TICKS = [
  [0, 'NEW YORK'],
  [10, 'subway'],
  [4000, 'deepest mine'],
  [12262, 'deepest hole'],
  [35000, 'mantle'],
  [2900000, 'core'],
  [6371000, 'centre'],
  [EARTH, '?'],
];

export function buildHud() {
  const bar = $('bar');
  for (const [m, label] of TICKS) {
    const tick = document.createElement('div');
    tick.className = 'tick';
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

export function updateHud(t, depth, underground, through = 0) {
  $('place').textContent = underground ? 'BELOW TIMES SQUARE · NEW YORK' : 'TIMES SQUARE · NEW YORK';
  const [num, unit] = formatDepth(depth);
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
