// Надписи поверх кадра для ролика про вращение Земли: сверху слева — сколько длятся сутки (главное число),
// с чем их сравнить, вес и скорость земли под ногами, плашка ускорения времени; справа — шкала длины суток
// (логарифм, от 24 ч до 2 ч) с отметками планет; по центру — подписи.
import { CAPTIONS, TITLE, DURATION } from './timeline.js';
import { smooth, window01 } from '../pov/util.js';

const $ = (id) => document.getElementById(id);

const TOP = 24;
const BOTTOM = 2;
const scale = (P) => Math.log(TOP / Math.max(BOTTOM, Math.min(TOP, P))) / Math.log(TOP / BOTTOM);
// [часы, подпись, с какой секунды ролика показывать настоящую подпись (до неё — «?»)]
const TICKS = [
  [24, 'EARTH TODAY'],
  [17.2, 'URANUS'],
  [10.3, 'SATURN · JUPITER'],
  [5, 'EARLY EARTH', 'reveal'],
  [3.9, 'HAUMEA'],
  [2.25, 'FLOAT OFF'],
];
// сравнение под числом: первая строка, у которой порог больше длины суток
const COMPARE = [
  [23.5, 'A NORMAL DAY ON EARTH'],
  [17.3, 'SHORTER EVERY DAY'],
  [16.1, 'AS SHORT AS A DAY ON URANUS'],
  [10.7, 'SHORTER THAN A DAY ON NEPTUNE'],
  [9.93, 'AS SHORT AS A DAY ON SATURN'],
  [5.0, 'SHORTER THAN A DAY ON JUPITER'],
  [3.92, 'AS SHORT AS EARTH’S DAY 4.5 BILLION YEARS AGO'],
  [2.4, 'AS SHORT AS A DAY ON HAUMEA'],
  [0, 'ALMOST FAST ENOUGH TO ORBIT'],
];
export const REVEAL = 900; // с этой секунды «?» на шкале становится «EARLY EARTH»

export function buildHud(place) {
  $('place').textContent = place;
  const bar = $('bar');
  for (const [P, label, reveal] of TICKS) {
    const tick = document.createElement('div');
    tick.className = 'tick';
    tick.style.top = `${scale(P) * 100}%`;
    tick.dataset.label = label;
    tick.dataset.reveal = reveal ? '1' : '';
    tick.textContent = reveal ? '?' : label;
    bar.appendChild(tick);
  }
}

function lapseText(k) {
  const s = k * 3600; // секунд истории за секунду ролика
  if (s < 1.5) return 'REAL TIME';
  if (s < 90) return `1 s = ${Math.round(s)} s`;
  if (s < 5400) return `1 s = ${Math.round(s / 60)} min`;
  if (s < 86400 * 1.5) return `1 s = ${Math.round(s / 3600)} h`;
  const d = s / 86400;
  if (d < 6.5) return `1 s = ${Math.round(d)} days`;
  if (d < 26) return `1 s = ${Math.round(d / 7)} week${Math.round(d / 7) > 1 ? 's' : ''}`;
  if (d < 330) return `1 s = ${Math.round(d / 30.4)} month${Math.round(d / 30.4) > 1 ? 's' : ''}`;
  const y = d / 365.25;
  if (y < 1e4) return `1 s = ${Math.round(y).toLocaleString('en-US')} year${Math.round(y) > 1 ? 's' : ''}`;
  if (y < 1e6) return `1 s = ${Math.round(y / 1000).toLocaleString('en-US')},000 years`;
  return `1 s = ${Math.round(y / 1e6).toLocaleString('en-US')} million years`;
}

// state: { day (ч), weight (кг), speed (км/ч), k (ч истории в секунду), sea (м), place, alt (км над экватором) }
export function updateHud(t, st) {
  if (st.place && $('place').textContent !== st.place) $('place').textContent = st.place;
  // в космосе вторая строка — высота над экватором вместо скорости земли
  const space = st.alt != null && st.alt > 50;
  $('slbl').textContent = space ? 'ALTITUDE' : 'GROUND SPEED';
  const mins = Math.round(st.day * 60);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  $('dayh').textContent = String(h);
  $('daym').textContent = String(m).padStart(2, '0');
  $('compare').textContent = COMPARE.find(([p]) => st.day > p)?.[1] ?? COMPARE[COMPARE.length - 1][1];
  $('wval').textContent = `${st.weight.toFixed(1)} kg`;
  $('sval').textContent = space ? `${Math.round(st.alt).toLocaleString('en-US')} km` : `${Math.round(st.speed).toLocaleString('en-US')} km/h`;
  $('lval').textContent = lapseText(st.k);
  // уровень моря у вершины: строка появляется, когда вода заметно поднялась
  const sea = Math.round(st.sea / 10) * 10;
  $('seaval').textContent = `${sea >= 0 ? '+' : '−'}${Math.abs(sea).toLocaleString('en-US')} m`;
  $('searow').style.opacity = (smooth((Math.abs(st.sea) - 40) / 160) * smooth((t - 77.4) / 1.2) * (1 - smooth((t - 478) / 1.5))).toFixed(3); // с рассвета второго дня до отрыва
  $('lapse').style.opacity = smooth((st.k * 3600 - 2) / 30).toFixed(3);
  $('dot').style.top = `${scale(st.day) * 100}%`;
  for (const tick of $('bar').querySelectorAll('.tick')) {
    if (tick.dataset.reveal) tick.textContent = t >= REVEAL ? tick.dataset.label : '?';
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
  // только вход в ролик из чёрного; дальше — никаких затемнений
  $('fade').style.opacity = Math.max(1 - smooth(t / 0.8), smooth((t - (DURATION - 0.6)) / 0.6)).toFixed(3);
}
