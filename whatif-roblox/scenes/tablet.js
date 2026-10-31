// The tablet screen: a Steal-an-Egg style game UI drawn full-frame inside a tablet bezel.
// tabletScreen(t, opts) -> svg (screen space 1920x1080)
'use strict';

const S = require('../rig/svg');
const F = require('../rig/face');
const { egg, secretEgg } = require('../rig/props');
const { drawHero } = require('../rig/hero');
const { f, ease, clamp, lerp } = S;

const LINE = '#151515';
const ol = (fill, w = 6) => ({ fill, stroke: LINE, 'stroke-width': w, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' });
const R = (x, y, w, h, r = 0, a = {}) => S.rect(x, y, w, h, r, a);
const txt = (s, x, y, size, fill, extra = {}) => S.el('text', { x, y, 'font-family': 'Fredoka, sans-serif', 'font-weight': 700, 'font-size': size, fill, 'text-anchor': 'middle', ...extra }, s);
const lil = (s, x, y, size, fill, extra = {}) => S.el('text', { x, y, 'font-family': 'Lilita One, sans-serif', 'font-size': size, fill, 'text-anchor': 'middle', ...extra }, s);
const hash = (n) => { const v = Math.sin(n * 127.1 + 311.7) * 43758.5453; return v - Math.floor(v); };

const SX0 = 70, SY0 = 50, SX1 = 1850, SY1 = 1030; // visible screen area
const BELT_Y = 650;

const RAR = [
  { r: 'common', price: '$10', col: '#C9CED8' }, { r: 'rare', price: '$5,000', col: '#34C3FF' },
  { r: 'epic', price: '$50K', col: '#B06BFF' }, { r: 'legendary', price: '$1M', col: '#FFC52E' },
];

function priceTag(x, y, label, col, s = 1, sub = '') {
  const w = Math.max(150, label.length * 30 + 50);
  let o = R(-w / 2, -40, w, 74, 22, ol('#1F2233', 5)) + R(-w / 2 + 6, -34, w - 12, 10, 5, { fill: col, opacity: 0.9 });
  o += lil(label, 0, 20, 44, col === '#C9CED8' ? '#FFFFFF' : col);
  if (sub) o += txt(sub, 0, -54, 30, '#FFFFFF', { stroke: LINE, 'stroke-width': 6, 'paint-order': 'stroke' });
  o += S.path('M-12 34 L0 50 L12 34 Z', ol('#1F2233', 5));
  return S.g(o, `translate(${f(x)} ${f(y)}) scale(${f(s)})`);
}

function gameWorld(t, o) {
  let g = '';
  g += `<defs><linearGradient id="gsky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6FD0FF"/><stop offset="1" stop-color="#D9F6FF"/></linearGradient></defs>`;
  g += R(SX0, SY0, SX1 - SX0, SY1 - SY0, 0, { fill: 'url(#gsky)' });
  // distant bases (colourful platforms with fences + egg piles)
  const bases = [[160, '#FF6FB5'], [520, '#3BD16F'], [880, '#FFB000'], [1240, '#3B8BFF'], [1600, '#B06BFF']];
  for (const [bx, col] of bases) {
    g += R(bx - 130, 470, 260, 60, 10, ol(col, 5)) + R(bx - 130, 470, 260, 14, 7, { fill: '#fff', opacity: 0.3 });
    for (let i = 0; i < 6; i++) g += R(bx - 126 + i * 50, 430, 14, 44, 3, ol('#FFFFFF', 4));
    g += R(bx - 130, 438, 260, 10, 4, ol('#FFFFFF', 4));
    g += S.g(egg({ x: bx - 40, y: 440, size: 60, rarity: 'rare', glow: false }) + egg({ x: bx + 30, y: 444, size: 52, rarity: 'common', glow: false }), '');
  }
  g += R(SX0, 530, SX1 - SX0, 520, 0, { fill: '#5BCB5E' }) + R(SX0, 530, SX1 - SX0, 520, 0, { fill: 'url(#studs)' });
  // conveyor belt
  const off = o.beltOffset || 0;
  g += R(SX0 - 10, BELT_Y, SX1 - SX0 + 20, 70, 0, ol('#3A3F52', 6));
  let stripes = '';
  for (let x = SX0 - 200; x < SX1 + 200; x += 90) stripes += R(x - (off % 90), BELT_Y + 6, 40, 58, 4, { fill: '#2C3040' });
  g += S.g(stripes, null, { 'clip-path': 'url(#beltClip)' }) + S.clipDef('beltClip', R(SX0, BELT_Y + 4, SX1 - SX0, 62));
  g += R(SX0 - 10, BELT_Y + 70, SX1 - SX0 + 20, 70, 0, ol('#262A38', 6));
  for (let x = SX0 + 40; x < SX1; x += 130) {
    g += S.circle(x, BELT_Y + 105, 24, ol('#7A8090', 5)) + S.path(`M${x - 16} ${BELT_Y + 105} L${x + 16} ${BELT_Y + 105}`, { stroke: '#3A3F52', 'stroke-width': 6, transform: `rotate(${f(-off * 2)} ${x} ${BELT_Y + 105})` });
  }
  g += R(SX0 - 10, BELT_Y - 8, SX1 - SX0 + 20, 14, 6, ol('#FFC52E', 5));
  for (let x = SX0; x < SX1; x += 80) g += S.path(`M${x} ${BELT_Y + 140} L${x + 40} ${BELT_Y + 140} L${x + 20} ${BELT_Y + 160} L${x - 20} ${BELT_Y + 160} Z`, { fill: '#FFC52E' });
  // eggs on the belt
  const span = 340, n = 7;
  if (!o.hideEggs) {
    for (let i = 0; i < n; i++) {
      let x = ((i * span - off) % (span * n) + span * n) % (span * n) + SX0 - 100;
      const rr = RAR[(i * 3 + 1) % 4];
      if (o.secretX !== undefined && Math.abs(x - o.secretX) < 200) continue;
      g += egg({ x, y: BELT_Y - 70, size: 150, rarity: rr.r, glow: rr.r !== 'common', wobble: Math.sin(t * 6 + i) * 3 });
      g += priceTag(x, BELT_Y - 210, rr.price, rr.col, 0.85);
    }
  }
  if (o.secretX !== undefined) {
    const sx = o.secretX;
    g += secretEgg({ x: sx, y: BELT_Y - 76, size: 160, t, rot: Math.sin(t * 9) * 4 });
    const q = o.qMarks ?? 3;
    g += priceTag(sx, BELT_Y - 222, '$' + '?'.repeat(Math.max(1, q)).padEnd(3, ' '), '#B06BFF', 0.95 * (1 + 0.08 * (o.tagPop || 0)), 'SECRET EGG');
  }
  // the player's avatar watching the belt
  if (!o.noAvatar) g += drawHero({ x: 330, y: 960, s: 0.24, turn: 0.4, face: o.avatarFace || 'happy', nametag: 'Guest_0200' });
  return g;
}

function topUI(t, o) {
  let u = '';
  u += R(110, 80, 330, 84, 30, ol('#1F2233', 5)) + S.circle(160, 122, 28, ol('#3BD16F', 5)) + lil('$', 160, 138, 40, '#FFFFFF') + lil(o.money || '$12,480', 300, 140, 50, '#5CFF7A');
  u += S.g(egg({ x: -170, y: 0, size: 74, rarity: 'legendary', glow: false }) + lil('STEAL AN EGG', 30, 26, 74, '#FFE14D', { stroke: LINE, 'stroke-width': 12, 'paint-order': 'stroke' }), 'translate(960 118) rotate(-2)');
  const rk = o.roundPop || 0;
  u += S.g(R(-150, -42, 300, 84, 30, ol('#1F2233', 5)) + lil(o.round || 'ROUND 39', 0, 18, 46, '#FFFFFF'), `translate(1650 122) scale(${f(1 + 0.25 * rk)})`);
  return u;
}

function dialogPanel(k, w, h, cy, inner) {
  if (k <= 0) return '';
  const s = ease.outBack(clamp(k, 0, 1));
  let o = R(-w / 2, -h / 2, w, h, 34, { fill: '#1F2233', stroke: '#FFFFFF', 'stroke-width': 6, opacity: 0.97 });
  o += inner;
  return S.g(o, `translate(960 ${cy}) scale(${f(s)})`);
}

function button(x, y, w, h, label, col, press = 0) {
  const s = 1 - 0.1 * press;
  return S.g(R(-w / 2, -h / 2 + 8, w, h, 22, { fill: '#000', opacity: 0.3 }) + R(-w / 2, -h / 2, w, h, 22, ol(col, 5)) + R(-w / 2 + 10, -h / 2 + 8, w - 20, 12, 6, { fill: '#fff', opacity: 0.35 }) +
    lil(label, 0, 18, 50, '#FFFFFF', { stroke: LINE, 'stroke-width': 8, 'paint-order': 'stroke' }), `translate(${f(x)} ${f(y + press * 6)}) scale(${f(s)})`);
}

function tap(x, y, k) {
  if (k <= 0 || k >= 1) return '';
  return S.circle(x, y, 30 + 110 * k, { fill: 'none', stroke: '#FFFFFF', 'stroke-width': 14 * (1 - k), opacity: f(1 - k) }) + S.circle(x, y, 34 * (1 - k * 0.5), { fill: '#FFFFFF', opacity: f(0.6 * (1 - k)) });
}

const KEY_ROWS = ['QWERTYUIOP', 'ASDFGHJKL', '^ZXCVBNM<'];
function keyboard(o) {
  const kb = o.keyboard;
  if (!kb) return '';
  let g = R(SX0, 600, SX1 - SX0, SY1 - 600, 0, { fill: '#C9CFDB' }) + R(SX0, 600, SX1 - SX0, 8, 0, { fill: '#AEB5C4' });
  const kw = 150, kh = 110, gap = 18;
  KEY_ROWS.forEach((row, r) => {
    const rowW = row.length * kw + (row.length - 1) * gap;
    const x0 = 960 - rowW / 2;
    [...row].forEach((ch, i) => {
      const x = x0 + i * (kw + gap), y = 640 + r * (kh + gap);
      const pressed = kb.press === ch;
      const caps = ch === '^' && kb.caps;
      const fill = pressed ? '#3B8BFF' : caps ? '#FFE14D' : '#FFFFFF';
      g += R(x, y + 6, kw, kh, 18, { fill: '#8A92A6' }) + R(x, y + (pressed ? 6 : 0), kw, kh, 18, { fill, stroke: LINE, 'stroke-width': 4 });
      const label = ch === '^' ? '⇧' : ch === '<' ? '⌫' : (kb.caps ? ch : ch.toLowerCase());
      if (ch === '^') g += S.path(`M${x + kw / 2} ${y + 28 + (pressed ? 6 : 0)} L${x + kw / 2 + 30} ${y + 62} L${x + kw / 2 + 14} ${y + 62} L${x + kw / 2 + 14} ${y + 86} L${x + kw / 2 - 14} ${y + 86} L${x + kw / 2 - 14} ${y + 62} L${x + kw / 2 - 30} ${y + 62} Z`, ol(caps ? '#151515' : '#FFFFFF', 4));
      else if (ch === '<') g += S.path(`M${x + 40} ${y + 55} L${x + 70} ${y + 30} L${x + 115} ${y + 30} L${x + 115} ${y + 80} L${x + 70} ${y + 80} Z`, ol('#FFFFFF', 4));
      else g += txt(label, x + kw / 2, y + 74 + (pressed ? 6 : 0), 58, pressed ? '#FFFFFF' : '#1F2233');
      if (caps) g += S.circle(x + kw - 22, y + 20, 8, { fill: '#3BD16F', stroke: LINE, 'stroke-width': 3 });
      if (pressed) g += S.g(R(-60, -150, 120, 130, 22, ol('#FFFFFF', 4)) + txt(label, 0, -60, 80, '#1F2233'), `translate(${x + kw / 2} ${y})`);
    });
  });
  g += R(960 - 420, 640 + 3 * (kh + gap), 840, kh, 18, { fill: '#FFFFFF', stroke: LINE, 'stroke-width': 4 });
  return g;
}

function hatchView(t, o) {
  const h = o.hatch;
  let g = `<defs><radialGradient id="hbg"><stop offset="0" stop-color="#7B2FFF"/><stop offset="1" stop-color="#1A0B3A"/></radialGradient></defs>`;
  g += R(SX0, SY0, SX1 - SX0, SY1 - SY0, 0, { fill: 'url(#hbg)' });
  let rays = '';
  for (let i = 0; i < 16; i++) rays += S.path('M0 0 L-60 -900 L60 -900 Z', { fill: '#FFFFFF', opacity: 0.07, transform: `rotate(${f(i * 22.5 + t * 30)})` });
  g += S.g(rays, 'translate(960 560)');
  g += lil('HATCHING...', 960, 190, 90, '#FFE14D', { stroke: LINE, 'stroke-width': 14, 'paint-order': 'stroke' });
  const shake = (h.shake || 0) * Math.sin(t * 70) * 10;
  let e = secretEgg({ x: 0, y: 0, size: 520, t, rot: shake });
  // cracks
  const c = clamp(h.crack || 0, 0, 1);
  if (c > 0) {
    const pts = [[0, -230], [-30, -170], [20, -120], [-40, -60], [10, 0], [-20, 60]];
    const n = Math.max(2, Math.ceil(pts.length * c));
    const d = 'M' + pts.slice(0, n).map((p) => `${p[0]} ${p[1]}`).join(' L');
    e += S.path(d, { fill: 'none', stroke: '#FFFFFF', 'stroke-width': 26, 'stroke-linejoin': 'round', opacity: 0.9 }) + S.path(d, { fill: 'none', stroke: '#151515', 'stroke-width': 10, 'stroke-linejoin': 'round' });
    if (c > 0.5) e += S.path('M-30 -170 L-110 -150 M20 -120 L110 -100 M-40 -60 L-130 -40', { fill: 'none', stroke: '#151515', 'stroke-width': 9, 'stroke-linecap': 'round' });
    // light through the cracks
    e += S.path(d, { fill: 'none', stroke: '#FFF3B0', 'stroke-width': 6, opacity: f(0.5 + 0.5 * Math.sin(t * 30)) });
  }
  g += S.g(e, `translate(960 600) rotate(${f(shake * 0.4)})`);
  return g;
}

function bezel() {
  const inner = S.roundedPath([[SX0, SY0], [SX1, SY0], [SX1, SY1], [SX0, SY1]], 34);
  let o = S.path(`M-20 -20 L1940 -20 L1940 1100 L-20 1100 Z ${inner}`, { fill: '#1C1E26', 'fill-rule': 'evenodd' });
  o += S.path(inner, { fill: 'none', stroke: '#0E0F14', 'stroke-width': 8 });
  o += S.circle(960, 26, 9, { fill: '#33384A' });
  return o;
}

function tabletScreen(t, o = {}) {
  let g = o.hatch ? hatchView(t, o) : gameWorld(t, o) + topUI(t, o);
  if (o.dim) g += R(SX0, SY0, SX1 - SX0, SY1 - SY0, 0, { fill: '#12061F', opacity: f(o.dim) });
  // buy dialog
  if (o.buy) {
    const b = o.buy;
    let inner = lil('SECRET EGG', 0, -190, 64, '#FFFFFF') + S.g(secretEgg({ x: 0, y: -40, size: 190, t }), '');
    inner += lil('FREE!', 0, 120, 84, '#5CFF7A', { stroke: LINE, 'stroke-width': 12, 'paint-order': 'stroke', transform: `scale(${f(1 + 0.1 * (b.free || 0))})` });
    inner += button(-150, 230, 240, 96, 'BUY', '#3BD16F', b.press || 0) + button(150, 230, 240, 96, 'NO', '#8A92A6', 0);
    g += dialogPanel(b.k, 640, 600, 560, inner);
    g += tap(810, 790, b.tap || 0);
  }
  if (o.purchased) g += S.g(R(-360, -70, 720, 140, 40, ol('#3BD16F', 7)) + lil('PURCHASED!', 0, 28, 84, '#FFFFFF', { stroke: LINE, 'stroke-width': 10, 'paint-order': 'stroke' }), `translate(960 560) scale(${f(ease.outBack(clamp(o.purchased, 0, 1)))})`);
  // username dialog + keyboard
  if (o.user) {
    const u = o.user;
    let inner = txt('BEFORE HATCHING...', 0, -120, 40, '#9AA3BC') + lil('ENTER YOUR USERNAME', 0, -50, 70, '#FFFFFF');
    inner += R(-380, 0, 760, 110, 22, ol('#FFFFFF', 5));
    inner += txt(u.text || '', 0, 82, 80, '#1F2233');
    const tw = (u.text || '').length * 50;
    if (u.caret) inner += R(tw / 2 + 8, 22, 8, 70, 3, { fill: '#3B8BFF' });
    if (!u.text) inner += txt('Username', 0, 78, 56, '#B9C0CF');
    inner += button(0, 200, 220, 86, 'OK', '#3BD16F', u.ok || 0);
    g += dialogPanel(u.k, 900, 520, 340, inner);
    if (u.okTap) g += tap(960, 548, u.okTap);
  }
  g += keyboard(o);
  if (o.glitch) {
    for (let i = 0; i < 8; i++) {
      const y = SY0 + hash(i * 3 + Math.floor(t * 24)) * (SY1 - SY0), h = 10 + hash(i * 7 + Math.floor(t * 24)) * 50;
      g += R(SX0, y, SX1 - SX0, h, 0, { fill: ['#00F0FF', '#FF3DF2', '#FFFFFF', '#7B2FFF'][i % 4], opacity: f(o.glitch * 0.45) });
    }
  }
  if (o.vignette) g += R(SX0, SY0, SX1 - SX0, SY1 - SY0, 0, { fill: 'url(#evilVig)', opacity: f(o.vignette) });
  let out = `<defs><radialGradient id="evilVig" cx="0.5" cy="0.5" r="0.7"><stop offset="0.35" stop-color="#2A0050" stop-opacity="0"/><stop offset="1" stop-color="#14002A" stop-opacity="0.95"/></radialGradient></defs>`;
  out += S.g(g, null, { 'clip-path': 'url(#scrClip)' }) + S.clipDef('scrClip', S.path(S.roundedPath([[SX0, SY0], [SX1, SY0], [SX1, SY1], [SX0, SY1]], 34)));
  // screen glare
  out += S.path(`M${SX0} ${SY0 + 300} L${SX0 + 420} ${SY0} L${SX0 + 560} ${SY0} L${SX0} ${SY0 + 420} Z`, { fill: '#FFFFFF', opacity: 0.06 });
  out += bezel();
  return out;
}

module.exports = { tabletScreen, BELT_Y };
