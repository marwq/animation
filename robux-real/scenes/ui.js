// Roblox-style UI overlays: chapter card, hotbar, toast notification, typing bubble.
'use strict';

const S = require('../rig/svg');
const F = require('../rig/face');
const { f, ease, clamp } = S;
const LINE = '#151515';
const lil = (s, x, y, size, fill, extra = {}) => S.el('text', { x, y, 'font-family': 'Lilita One, sans-serif', 'font-size': size, fill, 'text-anchor': 'middle', ...extra }, s);
const fre = (s, x, y, size, fill, extra = {}) => S.el('text', { x, y, 'font-family': 'Fredoka, sans-serif', 'font-weight': 700, 'font-size': size, fill, 'text-anchor': 'middle', ...extra }, s);

function chapterCard(text, k, t, sub = '') {
  if (k <= 0) return '';
  const s = ease.outBack(clamp(k, 0, 1));
  let rays = '';
  for (let i = 0; i < 14; i++) rays += S.path('M0 0 L-70 -1100 L70 -1100 Z', { fill: '#FFF6C8', opacity: 0.25, transform: `rotate(${f(i * 25.7 + t * 20)})` });
  let o = S.g(rays, `translate(960 520) scale(${f(s)})`);
  o += S.g(lil(text, 0, 0, 190, '#FFE14D', { stroke: LINE, 'stroke-width': 26, 'paint-order': 'stroke', 'stroke-linejoin': 'round' }) +
    (sub ? fre(sub, 0, 80, 54, '#FFFFFF', { stroke: LINE, 'stroke-width': 10, 'paint-order': 'stroke' }) : '') +
    F.sparkle(-560, -120, 40) + F.sparkle(560, -150, 50) + F.sparkle(480, 60, 28), `translate(960 560) rotate(-4) scale(${f(s)})`);
  return o;
}

// slots: array of svg icons (or null); selected index
function hotbar(k, slots = [], selected = -1, pulse = 0) {
  if (k <= 0) return '';
  const n = 5, sz = 130, gap = 16, w = n * sz + (n - 1) * gap;
  let o = '';
  for (let i = 0; i < n; i++) {
    const x = -w / 2 + i * (sz + gap);
    const sel = i === selected;
    o += S.rect(x, 0, sz, sz, 20, { fill: '#1F2233', opacity: 0.85, stroke: sel ? '#FFFFFF' : '#5A6078', 'stroke-width': sel ? 8 : 4 });
    o += fre(String(i + 1), x + 20, 32, 26, '#FFFFFF');
    if (slots[i]) o += S.g(slots[i], `translate(${x + sz / 2} ${sz / 2 + 6}) scale(${f(1 + (sel ? pulse * 0.25 : 0))})`);
  }
  const y = 1080 + 20 - 130 * ease.out(clamp(k, 0, 1));
  return S.g(o, `translate(330 ${f(y)}) scale(0.65)`);
}

function toast(title, sub, icon, k) {
  if (k <= 0) return '';
  const x = 1920 - 40 - 620 * ease.out(clamp(k, 0, 1));
  let o = S.rect(0, 0, 600, 150, 26, { fill: '#1F2233', opacity: 0.92, stroke: '#FFFFFF', 'stroke-width': 5 });
  o += S.rect(18, 18, 114, 114, 20, { fill: '#2E3350' }) + S.g(icon || '', 'translate(75 75)');
  o += fre(title, 150, 62, 34, '#FFE14D', { 'text-anchor': 'start' }) + fre(sub, 150, 112, 40, '#FFFFFF', { 'text-anchor': 'start' });
  return S.g(o, `translate(${f(x)} 60)`);
}

// Roblox chat bubble with "..." typing dots, anchored at its tail tip
function typingBubble(x, y, t, k = 1, s = 1) {
  if (k <= 0) return '';
  let o = S.rect(-90, -110, 180, 80, 26, { fill: '#FFFFFF', stroke: LINE, 'stroke-width': 6 }) + S.path('M-20 -33 L0 0 L20 -33 Z', { fill: '#FFFFFF', stroke: LINE, 'stroke-width': 6, 'stroke-linejoin': 'round' }) + S.rect(-22, -40, 44, 12, 0, { fill: '#FFFFFF' });
  for (let i = 0; i < 3; i++) o += S.circle(-40 + i * 40, -70 - 8 * Math.max(0, Math.sin(t * 9 - i)), 12, { fill: '#8A92A6' });
  return S.g(o, `translate(${f(x)} ${f(y)}) scale(${f(s * ease.outBack(clamp(k, 0, 1)))})`);
}

module.exports = { chapterCard, hotbar, toast, typingBubble };
