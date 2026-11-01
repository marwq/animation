// Inside Steal an Egg: the game map (sky, far bases, the conveyor belt, grass), player bases,
// Rocky the pet rock, rule cards, loading screen, leaderboard, forcefield, rain cloud.
'use strict';

const S = require('../rig/svg');
const F = require('../rig/face');
const E = require('./env');
const { egg, secretEgg } = require('../rig/props');
const { f, clamp, lerp, ease } = S;
const LINE = '#151515';
const ol = (fill, w = 6) => ({ fill, stroke: LINE, 'stroke-width': w, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' });
const ln = (w, c = LINE, op) => ({ fill: 'none', stroke: c, 'stroke-width': w, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', ...(op !== undefined ? { opacity: op } : {}) });
const R = (x, y, w, h, r = 0, a = {}) => S.rect(x, y, w, h, r, a);
const T = (s, x, y, size, fill, extra = {}) => S.el('text', { x, y, 'font-family': 'Lilita One, sans-serif', 'font-size': size, fill, 'text-anchor': 'middle', ...extra }, s);
const FT = (s, x, y, size, fill, extra = {}) => S.el('text', { x, y, 'font-family': 'Fredoka, sans-serif', 'font-weight': 700, 'font-size': size, fill, 'text-anchor': 'middle', ...extra }, s);
const hash = (n) => { const v = Math.sin(n * 127.1 + 311.7) * 43758.5453; return v - Math.floor(v); };

const RARS = ['common', 'rare', 'common', 'epic', 'common', 'legendary', 'rare', 'common'];
const PRICE = { common: '$10', rare: '$5,000', epic: '$50K', legendary: '$1M', mythic: '$10M' };
const PCOL = { common: '#C9CED8', rare: '#34C3FF', epic: '#B06BFF', legendary: '#FFC52E', mythic: '#FF6FB5' };

function tagBubble(x, y, label, col, s = 1) {
  const w = Math.max(110, label.length * 26 + 40);
  return S.g(R(-w / 2, -34, w, 62, 18, ol('#1F2233', 4)) + R(-w / 2 + 5, -29, w - 10, 8, 4, { fill: col }) + T(label, 0, 16, 38, col === '#C9CED8' ? '#FFFFFF' : col) + S.path('M-10 28 L0 42 L10 28 Z', ol('#1F2233', 4)), `translate(${f(x)} ${f(y)}) scale(${f(s)})`);
}

// ---------------------------------------------------------------- the map
// opts: beltOff (px), secretX (belt-space x of the ??? egg), tags (show prices), highlight (rarity to pop)
function eggMap(cam, t, opts = {}) {
  let sky = R(-600, -800, 3120, 2600, 0, { fill: 'url(#skyDay)' });
  let far = E.sun(1640, 170, 110, t);
  const wrap = (x) => ((((x + 600) % 3200) + 3200) % 3200) - 600;
  for (const [cx, cy, cs] of [[-200, 120, 0.9], [500, 60, 0.7], [1150, 180, 0.8], [1900, 90, 1.0]]) far += E.cloud(wrap(cx + t * 16), cy, cs);
  // far ring of bases on hills
  let ring = S.path('M-1400 620 Q-600 520 200 600 T1800 590 T3400 600 T5000 590 T6600 600 L6600 900 L-1400 900 Z', { fill: '#86D98A' });
  const cols = ['#FF6FB5', '#FFB000', '#34C3FF', '#B06BFF', '#3BD16F', '#FF5A5A'];
  for (let i = 0; i < 16; i++) {
    const bx = -1200 + i * 480, by = 590 + Math.sin(i) * 14, c = cols[i % 6];
    ring += R(bx - 120, by - 20, 240, 40, 8, ol(c, 4)) + R(bx - 120, by - 20, 240, 10, 5, { fill: '#FFFFFF', opacity: 0.35 });
    for (let j = 0; j < 5; j++) ring += R(bx - 112 + j * 52, by - 52, 10, 34, 3, ol('#FFFFFF', 3));
    ring += egg({ x: bx - 40, y: by - 44, size: 40, rarity: RARS[(i * 3) % 8], glow: false }) + egg({ x: bx + 30, y: by - 40, size: 34, rarity: RARS[(i * 5) % 8], glow: false });
  }
  ring += R(-1400, 600, 8000, 120, 0, { fill: 'url(#hazeDay)', opacity: 0.6 });
  // conveyor belt
  const off = opts.beltOff || 0;
  let belt = R(-1400, 640, 8000, 60, 0, ol('#3A3F52', 6));
  for (let x = -1400; x < 6600; x += 80) belt += R(x + (off % 80), 646, 36, 48, 4, { fill: '#2C3040' });
  belt += R(-1400, 700, 8000, 56, 0, ol('#262A38', 6)) + R(-1400, 630, 8000, 14, 6, ol('#FFC52E', 5));
  for (let x = -1380; x < 6600; x += 140) belt += S.circle(x, 728, 18, ol('#7A8090', 4)) + S.path(`M${x - 12} 728 L${x + 12} 728`, { stroke: '#3A3F52', 'stroke-width': 5, transform: `rotate(${f(off * 2)} ${x} 728)` });
  if (!opts.noBeltEggs) {
    const span = 300, n = 26;
    for (let i = 0; i < n; i++) {
      const x = ((i * span + off) % (span * n)) - 1300;
      if (opts.secretX !== undefined && Math.abs(x - opts.secretX) < 150) continue;
      const r = RARS[i % 8];
      const pop = opts.highlight === r ? 1.25 : 1;
      belt += egg({ x, y: 590, size: 88 * pop, rarity: r, glow: r !== 'common', wobble: Math.sin(t * 6 + i) * 3 });
      if (opts.tags) belt += tagBubble(x, 490, PRICE[r], PCOL[r], 0.9 * (opts.highlight === r ? 1.3 : 1));
    }
  }
  if (opts.secretX !== undefined) belt += secretEgg({ x: opts.secretX, y: 586, size: 96, t });
  let ground = R(-1400, 760, 8000, 900, 0, { fill: '#5BCB5E' }) + R(-1400, 760, 8000, 900, 0, { fill: 'url(#studs)' }) + S.path('M-1400 760 L6600 760', ln(5, '#3E9E3E'));
  return {
    bg: sky + E.layer(far, cam, 0.05) + E.layer(ring, cam, 0.3) + E.layer(belt, cam, 0.6),
    ground: E.layer(ground, cam, 1),
  };
}

// ---------------------------------------------------------------- bases (ground layer, world coords)
// o: { x0, x1, col, owner, sign, locked, doorSide: 'right'|'left', pedestals: [svg|null], gold, unlockedBlink }
function base(o, t) {
  const { x0, x1 } = o;
  const col = o.col || '#FF8FC8';
  const floorTop = 880, floorBot = 1110;
  let g = '';
  // back fence
  for (let x = x0 + 20; x < x1; x += 70) g += R(x, 790, 18, 100, 4, ol(o.gold ? '#FFD34D' : '#FFFFFF', 4));
  g += R(x0, 800, x1 - x0, 16, 6, ol(o.gold ? '#FFD34D' : '#FFFFFF', 4)) + R(x0, 846, x1 - x0, 16, 6, ol(o.gold ? '#FFD34D' : '#FFFFFF', 4));
  // floor
  g += R(x0, floorTop, x1 - x0, floorBot - floorTop, 10, ol(col, 7));
  g += R(x0, floorTop, x1 - x0, floorBot - floorTop, 10, { fill: 'url(#studs)' });
  g += R(x0 + 8, floorTop + 6, x1 - x0 - 16, 14, 7, { fill: '#FFFFFF', opacity: 0.35 });
  if (o.gold) for (let i = 0; i < 6; i++) g += F.sparkle(x0 + 100 + hash(i) * (x1 - x0 - 200), floorTop + 40 + hash(i * 3) * 150, 14 + 10 * Math.abs(Math.sin(t * 3 + i)), '#FFFFFF');
  g += R(x0, floorBot - 8, x1 - x0, 40, 8, ol(o.gold ? '#E09A00' : '#00000033', 5));
  // pedestals
  const peds = o.pedestals || [];
  const n = Math.max(peds.length, o.pedCount || 0);
  for (let i = 0; i < n; i++) {
    const px = x0 + ((i + 1) * (x1 - x0)) / (n + 1);
    const py = 940;
    g += R(px - 56, py - 40, 112, 50, 10, ol(o.gold ? '#FFC52E' : '#E6EAF2', 5)) + R(px - 66, py - 52, 132, 20, 8, ol(o.gold ? '#FFE27A' : '#FFFFFF', 5));
    if (peds[i]) g += S.g(peds[i], `translate(${f(px)} ${py - 52})`);
  }
  // sign
  if (o.sign) {
    const sx = o.doorSide === 'left' ? x0 - 120 : x1 + 120;
    g += R(sx - 10, 760, 20, 240, 4, ol('#8A5A33', 5));
    const w = Math.max(320, o.sign.length * 34 + 60);
    g += S.g(R(-w / 2, -70, w, 120, 18, ol(o.gold ? '#FFC52E' : '#FFFFFF', 7)) + T(o.sign, 0, 18, 64, o.gold ? '#7A4B00' : '#1F2233'), `translate(${sx} 700) rotate(${o.doorSide === 'left' ? 3 : -3})`);
  }
  // laser door
  const dx = o.doorSide === 'left' ? x0 : x1;
  g += R(dx - 18, 700, 36, 400, 8, ol('#2C2F4A', 5)) + S.circle(dx, 720, 14, ol(o.locked ? '#FF2D55' : '#5CFF7A', 4));
  if (o.locked) for (let i = 0; i < 4; i++) { const y = 760 + i * 80; g += S.path(`M${dx} ${y} L${dx} ${y + 50}`, ln(16, '#FF2D55', 0.3)) + S.path(`M${dx} ${y} L${dx} ${y + 50}`, ln(6, '#FF6A84')); }
  // lock button + label
  if (o.lockPanel !== false) {
    const lx = o.doorSide === 'left' ? x0 + 120 : x1 - 120;
    const blink = o.unlockedBlink && Math.floor(t * 4) % 2;
    g += R(lx - 70, 1040, 140, 40, 12, ol(o.locked ? '#3BD16F' : blink ? '#FF2D55' : '#B9283F', 5));
    g += S.g(R(-26, -6, 52, 40, 8, ol('#FFE14D', 5)) + S.path(o.locked ? 'M-16 -6 L-16 -26 Q0 -44 16 -26 L16 -6' : 'M-16 -6 L-16 -26 Q0 -44 16 -26', ln(8)), `translate(${lx} 990)`);
    if (o.lockLabel) g += FT(o.locked ? 'LOCKED' : 'UNLOCKED', lx, 1150, 40, o.locked ? '#3BD16F' : '#FF2D55', { stroke: LINE, 'stroke-width': 8, 'paint-order': 'stroke' });
  }
  return g;
}

// ---------------------------------------------------------------- Rocky
function rocky({ x = 0, y = 0, s = 1, t = 0, blink = 0, walk = 0, face = 'happy', look = 0, sparkle = false } = {}) {
  const st = walk ? Math.sin(t * 16) : 0;
  let o = S.ellipse(0, 4, 70, 12, { fill: '#000', opacity: 0.18 });
  for (const sx of [-1, 1]) o += R(sx * 30 - 10, -40 - (sx * st > 0 ? 10 * walk : 0), 20, 42, 6, ol('#8A8F9C', 5)) + R(sx * 30 - 18, -6 - (sx * st > 0 ? 10 * walk : 0), 34, 14, 6, ol('#6B7080', 4));
  const body = 'M-74 -50 L-60 -128 L-12 -158 L48 -150 L82 -96 L78 -46 L30 -30 L-40 -30 Z';
  o += S.path(body, ol('#A9AEBB', 6)) + S.path('M-50 -120 L-14 -146 L30 -140', ln(8, '#C9CED8')) + S.path('M40 -60 L70 -80 M-60 -60 L-40 -46', ln(5, '#7A8090'));
  const ex = look * 8;
  for (const sx of [-1, 1]) {
    const cx = sx * 22 + ex, cy = -98;
    if (blink > 0.6) o += S.path(`M${cx - 10} ${cy} Q${cx} ${cy + 8} ${cx + 10} ${cy}`, ln(5));
    else if (face === 'love') o += S.path(F.heartPath(cx, cy, 10), ol('#FF3B5C', 3));
    else o += S.ellipse(cx, cy, 9, 13 * (1 - blink * 0.9), { fill: LINE }) + S.circle(cx - 3, cy - 5, 3, { fill: '#FFFFFF' });
  }
  o += face === 'sad' ? S.path(`M${-12 + ex} -66 Q${ex} -74 ${12 + ex} -66`, ln(5)) : S.path(`M${-12 + ex} -72 Q${ex} -62 ${12 + ex} -72`, ln(5));
  if (sparkle) o += F.sparkle(-80, -150, 18) + F.sparkle(90, -130, 14);
  return S.g(o, `translate(${f(x)} ${f(y)}) scale(${f(s)})`);
}

// ---------------------------------------------------------------- rock pile (Speedy's collection)
function rockPile(cx, base, w, h, t, rows = 9) {
  let o = '';
  for (let r = rows - 1; r >= 0; r--) {
    const k = r / rows, rw = w * (1 - k * 0.92), n = Math.max(1, Math.round(rw / 70));
    for (let i = 0; i < n; i++) {
      const id = r * 31 + i;
      const xx = cx - rw / 2 + (i + 0.5) * (rw / n) + (hash(id) - 0.5) * 20;
      const yy = base - k * h + (hash(id * 3) - 0.5) * 10;
      o += rocky({ x: xx, y: yy, s: 0.34 + 0.06 * hash(id * 7), t, blink: Math.sin(t * 2 + id * 5) > 0.97 ? 1 : 0, look: hash(id * 11) - 0.5 });
    }
  }
  return o;
}

// ---------------------------------------------------------------- loading screen
function loading(t, p, tipK = 1, shatter = 0) {
  let o = `<defs><radialGradient id="ldbg"><stop offset="0" stop-color="#7B2FFF"/><stop offset="1" stop-color="#2A0E5E"/></radialGradient></defs>`;
  o += R(0, 0, 1920, 1080, 0, { fill: 'url(#ldbg)' });
  let rays = '';
  for (let i = 0; i < 14; i++) rays += S.path('M0 0 L-70 -1200 L70 -1200 Z', { fill: '#FFFFFF', opacity: 0.06, transform: `rotate(${f(i * 25.7 + t * 15)})` });
  o += S.g(rays, 'translate(960 420)');
  for (let i = 0; i < 6; i++) o += egg({ x: 260 + i * 280, y: 760 + Math.sin(t * 2 + i) * 20, size: 90, rarity: ['common', 'rare', 'epic', 'legendary', 'mythic', 'rare'][i], glow: true, wobble: Math.sin(t * 3 + i) * 8 });
  o += S.g(egg({ x: -300, y: -10, size: 170, rarity: 'legendary', glow: true }) + T('STEAL AN EGG', 80, 40, 150, '#FFE14D', { stroke: LINE, 'stroke-width': 22, 'paint-order': 'stroke' }), 'translate(960 330) rotate(-3)');
  o += R(560, 520, 800, 40, 20, ol('#1F2233', 5)) + R(566, 526, Math.max(28, 788 * p), 28, 14, { fill: '#5CFF7A' });
  o += FT(`LOADING... ${Math.floor(p * 100)}%`, 960, 610, 40, '#FFFFFF');
  if (tipK > 0) {
    let tip = R(-520, -60, 1040, 120, 30, ol('#FFFFFF', 6)) + R(-506, -46, 92, 92, 18, { fill: '#FFC52E' }) + T('!', -460, 30, 80, '#1F2233') + FT('TIP: Always lock your base!', 50, 18, 54, '#1F2233');
    if (shatter > 0) {
      let pieces = '';
      for (let i = 0; i < 24; i++) { const a = hash(i) * Math.PI * 2, r = shatter * (300 + 600 * hash(i * 3)); pieces += R(-500 + (i % 8) * 125 + Math.cos(a) * r, -55 + Math.floor(i / 8) * 40 + Math.sin(a) * r + 600 * shatter * shatter, 120, 36, 4, { fill: i % 3 ? '#FFFFFF' : '#FFC52E', stroke: LINE, 'stroke-width': 4, opacity: f(1 - shatter), transform: `rotate(${f(shatter * 400 * (hash(i) - 0.5))})` }); }
      tip = pieces;
    }
    o += S.g(tip, `translate(960 900) scale(${f(ease.outBack(clamp(tipK, 0, 1)))})`);
  }
  return o;
}

// ---------------------------------------------------------------- rule card (top-left)
function ruleCard(n, text, k, icon = '') {
  if (k <= 0) return '';
  const x = -700 + 760 * ease.outBack(clamp(k, 0, 1));
  let o = R(0, 0, 680, 170, 30, ol('#1F2233', 6)) + R(14, 14, 142, 142, 24, { fill: ['#3BD16F', '#FF5A5A', '#FFC52E'][n - 1] }) + T(String(n), 85, 120, 110, '#FFFFFF', { stroke: LINE, 'stroke-width': 10, 'paint-order': 'stroke' });
  o += T(`RULE ${n}`, 330, 66, 48, '#FFE14D', { 'text-anchor': 'start', x: 180 }) + FT(text, 180, 128, 40, '#FFFFFF', { 'text-anchor': 'start' });
  return S.g(o + icon, `translate(${f(x)} 50)`);
}

// ---------------------------------------------------------------- money HUD (top-left) + floating money text
function moneyHud(amount, pulse = 0) {
  return S.g(R(0, 0, 380, 92, 30, ol('#1F2233', 5)) + S.circle(48, 46, 30, ol('#3BD16F', 5)) + T('$', 48, 63, 44, '#FFFFFF') + T(amount, 220, 66, 56, '#5CFF7A'), `translate(1500 40) scale(${f(1 + 0.15 * pulse)})`);
}
function floatText(txt, x, y, age, col = '#5CFF7A', size = 70) {
  if (age < 0 || age > 1.2) return '';
  const k = age / 1.2;
  return S.g(T(txt, 0, 0, size, col, { stroke: LINE, 'stroke-width': size * 0.14, 'paint-order': 'stroke' }), `translate(${f(x)} ${f(y - 120 * k)}) scale(${f(ease.outBack(Math.min(1, age * 6)))})`, { opacity: f(1 - k * k) });
}

// ---------------------------------------------------------------- forcefield, rain cloud, grass block, coin
function forcefield(x, y, s, t, k = 1) {
  if (k <= 0) return '';
  let o = S.ellipse(0, -480, 330, 560, { fill: '#7CF7FF', opacity: f(0.18 * k), stroke: '#FFFFFF', 'stroke-width': 10, 'stroke-dasharray': '30 18', transform: `rotate(${f(t * 40)} 0 -480)` });
  for (let i = 0; i < 6; i++) { const a = t * 2 + i; o += F.sparkle(Math.cos(a) * 300, -480 + Math.sin(a) * 500, 22 * k, '#FFFFFF'); }
  return S.g(o, `translate(${f(x)} ${f(y)}) scale(${f(s)})`);
}
function rainCloud(x, y, s, t) {
  let o = R(-150, -60, 300, 90, 40, ol('#7A8090', 6)) + R(-90, -110, 140, 100, 46, ol('#7A8090', 6)) + R(-140, 10, 280, 22, 10, { fill: '#5E6474' });
  for (let i = 0; i < 6; i++) { const ph = (t * 2 + i / 6) % 1; o += S.path(`M${-110 + i * 44} ${40 + ph * 160} l-8 26`, ln(6, '#8AD8FF', f(1 - ph))); }
  return S.g(o, `translate(${f(x)} ${f(y)}) scale(${f(s)})`);
}
function grassBlock(x, y, s = 1) {
  let o = R(-90, -80, 180, 100, 12, ol('#93582E', 6)) + R(-90, -110, 180, 50, 12, ol('#3FBF5A', 6));
  for (let i = 0; i < 6; i++) o += S.path(`M${-70 + i * 28} -108 l6 -26 l6 26`, ol('#3FBF5A', 4));
  return S.g(o, `translate(${f(x)} ${f(y)}) scale(${f(s)})`);
}
function cash(x, y, s = 1, rot = 0) {
  return S.g(R(-80, -40, 160, 80, 10, ol('#5CC765', 5)) + S.circle(0, 0, 24, ol('#8BE07D', 4)) + T('$', 0, 14, 40, '#2E8B3E') + T('10', -50, -10, 24, '#2E8B3E') + T('10', 52, 30, 24, '#2E8B3E'), `translate(${f(x)} ${f(y)}) rotate(${f(rot)}) scale(${f(s)})`);
}

// ---------------------------------------------------------------- leaderboard
function leaderboard(rows, k, hi = -1) {
  if (k <= 0) return '';
  let o = R(-430, -300, 860, 120 + rows.length * 96, 34, { fill: '#121628', opacity: 0.95, stroke: '#FFFFFF', 'stroke-width': 7 });
  o += T('🏆 LEADERBOARD', 0, -220, 64, '#FFE14D');
  rows.forEach(([rank, name, money, col], i) => {
    const y = -150 + i * 96;
    const isHi = i === hi;
    o += R(-400, y, 800, 80, 18, { fill: isHi ? '#FFC52E' : '#1F2233', stroke: isHi ? '#FFFFFF' : '#3A3F5E', 'stroke-width': 4 });
    o += T(rank, -330, y + 56, 46, isHi ? '#1F2233' : col || '#FFFFFF') + FT(name, -250, y + 54, 40, isHi ? '#1F2233' : '#FFFFFF', { 'text-anchor': 'start' }) + T(money, 370, y + 56, 40, isHi ? '#1F2233' : '#5CFF7A', { 'text-anchor': 'end' });
  });
  return S.g(o, `translate(960 520) scale(${f(ease.outBack(clamp(k, 0, 1)))})`);
}

// ---------------------------------------------------------------- character intro card
function introCard(name, lines, col, k, charSvg) {
  if (k <= 0) return '';
  const e = ease.out(clamp(k, 0, 1));
  let o = S.path(`M${f(-2000 + 2000 * e)} 300 L${f(1400 + 2000 * (1 - e))} 160 L${f(1500 + 2000 * (1 - e))} 560 L${f(-1900 + 2000 * e)} 700 Z`, { fill: col, stroke: LINE, 'stroke-width': 10 });
  o += charSvg || '';
  o += S.g(T(name, 0, 0, 120, '#FFFFFF', { stroke: LINE, 'stroke-width': 18, 'paint-order': 'stroke', 'text-anchor': 'start' }), `translate(${f(820 - 600 * (1 - e))} 380) rotate(-5)`);
  lines.forEach((l, i) => { o += S.g(FT(l, 0, 0, 52, '#FFE14D', { stroke: LINE, 'stroke-width': 10, 'paint-order': 'stroke', 'text-anchor': 'start' }), `translate(${f(860 - 600 * (1 - e))} ${470 + i * 70}) rotate(-5)`); });
  return o;
}

// ---------------------------------------------------------------- gaming chair (back view) for EggLord
function gamingChair(x, y, s = 1, turn = 0) {
  const w = 1 - 0.5 * Math.abs(turn);
  let o = R(-50, -60, 100, 60, 10, ol('#2B2F3A', 6)) + R(-170 * w, -360, 340 * w, 300, 60, ol('#E0283F', 8)) + R(-120 * w, -330, 240 * w, 240, 40, ol('#151521', 6)) + R(-200, -110, 400, 60, 20, ol('#E0283F', 7));
  o += S.circle(-140, 0, 20, ol('#2B2F3A', 5)) + S.circle(140, 0, 20, ol('#2B2F3A', 5)) + S.circle(0, 10, 20, ol('#2B2F3A', 5));
  return S.g(o, `translate(${f(x)} ${f(y)}) scale(${f(s)})`);
}

module.exports = { eggMap, base, rocky, rockPile, loading, ruleCard, moneyHud, floatText, forcefield, rainCloud, grassBlock, cash, leaderboard, introCard, gamingChair, tagBubble, PRICE, PCOL };
