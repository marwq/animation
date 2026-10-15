// Надписи поверх кадра: место, глубиномер со строкой «дальше», шкала пути справа, подписи, титр, затемнения.
import { CAPTIONS, MILESTONES, TITLE, DURATION, UNDER } from './timeline.js';
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

function formatDepth(d) {
  if (d < 10) return d.toFixed(2);
  if (d < 100) return d.toFixed(1);
  return Math.round(d).toLocaleString('en-US');
}

export function updateHud(t, depth, underground) {
  $('place').textContent = underground ? 'BELOW TIMES SQUARE' : 'TIMES SQUARE · NEW YORK';
  $('depth').textContent = formatDepth(depth);
  const next = MILESTONES.find(([m]) => m > depth + 0.05);
  $('next').textContent = next ? `NEXT · ${next[1]} in ${formatDepth(next[0] - depth)} m` : '';
  $('dot').style.top = `${scale(depth) * 100}%`;

  const hudIn = smooth((t - 0.6) / 0.8) * (1 - smooth((t - TITLE[0] + 0.2) / 0.6));
  $('hud').style.opacity = hudIn.toFixed(3);

  const cap = CAPTIONS.find(([a, b]) => t >= a && t <= b);
  const el = $('caption');
  if (cap) {
    el.textContent = cap[2];
    el.style.opacity = window01(t, cap[0], cap[1], 0.28).toFixed(3);
  } else {
    el.style.opacity = '0';
  }

  $('title').style.opacity = smooth((t - TITLE[0]) / 0.7).toFixed(3);
  // затемнение: вход из чёрного, короткая темнота при проходе сквозь асфальт, уход в чёрное
  const through = Math.exp(-(((t - UNDER) / 0.16) ** 2)) * 0.9;
  const fade = Math.max(1 - smooth(t / 0.8), through, smooth((t - (DURATION - 0.6)) / 0.6));
  $('fade').style.opacity = fade.toFixed(3);
}
