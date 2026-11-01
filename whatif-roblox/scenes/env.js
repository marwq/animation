// Backgrounds (environments) for the video. Every environment is split into depth layers;
// camTf(cam, k) gives a layer's transform so that zoom and pan get parallax for free:
//   k = 0 sky (static) ... k = 1 the ground the characters stand on ... k > 1 foreground.
'use strict';

const S = require('../rig/svg');
const { egg, secretEgg } = require('../rig/props');
const { f } = S;

const LINE = '#151515';
const ol = (fill, w = 6) => ({ fill, stroke: LINE, 'stroke-width': w, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' });
const ln = (w, c = LINE, op) => ({ fill: 'none', stroke: c, 'stroke-width': w, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', ...(op !== undefined ? { opacity: op } : {}) });
const R = (x, y, w, h, r = 0, a = {}) => S.rect(x, y, w, h, r, a);
const T = (txt, x, y, size, fill, extra = {}) => S.el('text', { x, y, 'font-family': 'Lilita One, sans-serif', 'font-size': size, fill, 'text-anchor': 'middle', ...extra }, txt);

function rng(seed) { let s = (seed >>> 0) || 1; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }

// ---------------------------------------------------------------- camera
function camTf(cam = {}, k = 1) {
  const z = 1 + ((cam.zoom ?? 1) - 1) * k;
  const fx = cam.fx ?? 960, fy = cam.fy ?? 540;
  const x = (cam.x || 0) * k, y = (cam.y || 0) * k;
  return `translate(${f(fx + (cam.sx || 0))} ${f(fy + (cam.sy || 0))}) scale(${f(z)}) translate(${f(-fx - x)} ${f(-fy - y)})`;
}
const layer = (svg, cam, k, extra) => S.g(svg, camTf(cam, k), extra);

// ---------------------------------------------------------------- shared defs (fixed ids)
const DEFS = `<defs>
<pattern id="studs" width="56" height="32" patternUnits="userSpaceOnUse"><ellipse cx="28" cy="19" rx="14" ry="6.5" fill="#000" opacity="0.08"/><ellipse cx="28" cy="15.5" rx="14" ry="6.5" fill="#fff" opacity="0.2"/></pattern>
<pattern id="studsSm" width="34" height="20" patternUnits="userSpaceOnUse"><ellipse cx="17" cy="12" rx="8.5" ry="4" fill="#000" opacity="0.08"/><ellipse cx="17" cy="10" rx="8.5" ry="4" fill="#fff" opacity="0.22"/></pattern>
<pattern id="wallStripes" width="80" height="80" patternUnits="userSpaceOnUse"><rect width="40" height="80" fill="#fff" opacity="0.12"/></pattern>
<pattern id="quilt" width="90" height="90" patternUnits="userSpaceOnUse"><rect width="45" height="45" fill="#fff" opacity="0.14"/><rect x="45" y="45" width="45" height="45" fill="#fff" opacity="0.14"/></pattern>
<pattern id="planks" width="240" height="60" patternUnits="userSpaceOnUse"><rect width="240" height="60" fill="none" stroke="#A9703F" stroke-width="4"/><line x1="120" y1="0" x2="120" y2="30" stroke="#A9703F" stroke-width="4"/></pattern>
<pattern id="tiles" width="120" height="60" patternUnits="userSpaceOnUse"><rect width="120" height="60" fill="#F6DDB0"/><rect x="0" y="0" width="60" height="30" fill="#EFCB91"/><rect x="60" y="30" width="60" height="30" fill="#EFCB91"/><rect width="120" height="60" fill="none" stroke="#D9A867" stroke-width="3"/></pattern>
<pattern id="metal" width="140" height="70" patternUnits="userSpaceOnUse"><rect width="140" height="70" fill="none" stroke="#1C1F33" stroke-width="4"/><circle cx="12" cy="12" r="4" fill="#4A5078"/><circle cx="128" cy="58" r="4" fill="#4A5078"/></pattern>
<linearGradient id="skyDay" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2E96FF"/><stop offset="0.55" stop-color="#6FCBFF"/><stop offset="1" stop-color="#DDF5FF"/></linearGradient>
<linearGradient id="skyMorning" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8FB8FF"/><stop offset="0.45" stop-color="#FF9EC4"/><stop offset="1" stop-color="#FFD98A"/></linearGradient>
<linearGradient id="skyPlaza" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4A72FF"/><stop offset="0.55" stop-color="#A88CFF"/><stop offset="1" stop-color="#FFD0EC"/></linearGradient>
<linearGradient id="skyVault" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#120C33"/><stop offset="0.42" stop-color="#3D1A6E"/><stop offset="0.75" stop-color="#A3307E"/><stop offset="1" stop-color="#FF7759"/></linearGradient>
<linearGradient id="skyNight" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0A1040"/><stop offset="1" stop-color="#2B3A8C"/></linearGradient>
<pattern id="bathTiles" width="90" height="90" patternUnits="userSpaceOnUse"><rect width="90" height="90" fill="#C6F0FF"/><rect x="3" y="3" width="84" height="84" rx="10" fill="#D9F6FF"/></pattern>
<pattern id="backsplash" width="60" height="60" patternUnits="userSpaceOnUse"><rect width="60" height="60" fill="#FFFFFF"/><rect width="30" height="30" fill="#BFF0E0"/><rect x="30" y="30" width="30" height="30" fill="#BFF0E0"/></pattern>
<pattern id="kitchenFloor" width="140" height="70" patternUnits="userSpaceOnUse"><rect width="140" height="70" fill="#FFE3EE"/><rect width="70" height="35" fill="#FFC7DC"/><rect x="70" y="35" width="70" height="35" fill="#FFC7DC"/></pattern>
<pattern id="wood" width="400" height="60" patternUnits="userSpaceOnUse"><rect width="400" height="60" fill="#D9945A"/><path d="M0 30 Q100 20 200 32 T400 28" fill="none" stroke="#C47F45" stroke-width="4"/><line x1="0" y1="59" x2="400" y2="59" stroke="#B5703A" stroke-width="3"/></pattern>
<linearGradient id="wallGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#86CBF2"/><stop offset="1" stop-color="#C2EAFF"/></linearGradient>
<linearGradient id="beam" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFF6D8" stop-opacity="0.5"/><stop offset="1" stop-color="#FFF6D8" stop-opacity="0"/></linearGradient>
<linearGradient id="hazeDay" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#DDF5FF" stop-opacity="0"/><stop offset="1" stop-color="#DDF5FF" stop-opacity="0.75"/></linearGradient>
<radialGradient id="sunGlow"><stop offset="0" stop-color="#FFF8C4" stop-opacity="0.95"/><stop offset="0.4" stop-color="#FFE98A" stop-opacity="0.45"/><stop offset="1" stop-color="#FFE98A" stop-opacity="0"/></radialGradient>
<radialGradient id="softWhite"><stop offset="0" stop-color="#FFFFFF" stop-opacity="0.95"/><stop offset="1" stop-color="#FFFFFF" stop-opacity="0"/></radialGradient>
<radialGradient id="redGlow"><stop offset="0" stop-color="#FF4D6D" stop-opacity="0.9"/><stop offset="1" stop-color="#FF4D6D" stop-opacity="0"/></radialGradient>
<radialGradient id="vignette" cx="0.5" cy="0.5" r="0.75"><stop offset="0.6" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#0B1030" stop-opacity="0.3"/></radialGradient>
<filter id="blurBg" x="-5%" y="-5%" width="110%" height="110%"><feGaussianBlur stdDeviation="7"/></filter>
<filter id="whip" x="-20%" y="-5%" width="140%" height="110%"><feGaussianBlur stdDeviation="40 0"/></filter>
</defs>`;

// ---------------------------------------------------------------- small pieces
function sun(x, y, size, t) {
  let o = S.circle(x, y, size * 2.7, { fill: 'url(#sunGlow)' });
  let rays = '';
  for (let i = 0; i < 12; i++) {
    rays += S.path(`M0 0 L${f(-size * 0.28)} ${f(-size * 3.4)} L${f(size * 0.28)} ${f(-size * 3.4)} Z`, { fill: '#FFFDE8', opacity: 0.2, transform: `rotate(${f((i / 12) * 360 + t * 8)})` });
  }
  o += S.g(rays, `translate(${f(x)} ${f(y)})`);
  o += R(x - size / 2, y - size / 2, size, size, size * 0.16, { fill: '#FFE55C', stroke: '#F5B800', 'stroke-width': 7 });
  o += R(x - size / 2 + 14, y - size / 2 + 14, size * 0.38, size * 0.18, 8, { fill: '#FFF8C8' });
  return o;
}

function cloud(x, y, s = 1, tint = '#FFFFFF', shade = '#D2ECFF') {
  const b = R(0, 44, 320, 76, 38, { fill: tint }) + R(50, 0, 130, 110, 46, { fill: tint }) + R(150, 18, 120, 96, 44, { fill: tint }) + R(-30, 66, 120, 54, 27, { fill: tint });
  return S.g(b + R(-26, 100, 342, 20, 10, { fill: shade }), `translate(${f(x)} ${f(y)}) scale(${f(s)})`);
}

function island(x, y, s, t, seed = 0) {
  const bob = Math.sin(t * 1.3 + seed) * 7;
  let o = '';
  o += R(-34, 118, 68, 40, 8, ol('#7E4A25', 5)) + R(-72, 78, 144, 50, 8, ol('#93582E', 5)) + R(-108, 34, 216, 56, 8, ol('#A86B3C', 5));
  o += R(-120, 0, 240, 42, 12, ol('#5CC765', 5)) + R(-114, 4, 228, 12, 6, { fill: '#8BE07D' });
  o += R(-12, -74, 24, 78, 4, ol('#8A5A33', 4)) + R(-56, -160, 112, 94, 20, ol('#3FBF5A', 5)) + R(-44, -150, 46, 16, 8, { fill: '#8BE88A' });
  o += S.g(egg({ x: 70, y: -26, size: 46, rarity: ['rare', 'epic', 'legendary'][seed % 3], glow: false }), '');
  return S.g(o, `translate(${f(x)} ${f(y + bob)}) scale(${f(s)})`);
}

function obby(x, y, t) {
  const cols = ['#FF5A5A', '#FFB000', '#3BD16F', '#3B8BFF', '#B06BFF'];
  let o = '';
  for (let i = 0; i < 5; i++) {
    const bx = x + i * 120, by = y - i * 46 + Math.sin(t * 1.6 + i) * 5;
    o += R(bx, by, 92, 30, 8, ol(cols[i], 4)) + R(bx + 4, by + 3, 84, 8, 4, { fill: '#fff', opacity: 0.35 });
  }
  return o;
}

function bird(x, y, s, t, ph = 0) {
  const fl = Math.sin(t * 15 + ph);
  let o = S.path(`M-6 -2 L-30 ${f(-4 - 20 * fl)} L-12 6 Z M6 -2 L30 ${f(-4 - 20 * fl)} L12 6 Z`, ol('#FFFFFF', 3));
  o += R(-14, -8, 28, 18, 6, ol('#FFFFFF', 3)) + S.path('M14 -2 L24 1 L14 4 Z', { fill: '#FFB000' });
  return S.g(o, `translate(${f(x)} ${f(y)}) scale(${f(s)})`);
}

function win(x, y, w, h) {
  let o = R(x, y, w, h, 6, ol('#BDEBFF', 5));
  o += S.path(`M${f(x + w * 0.14)} ${f(y + h * 0.86)} L${f(x + w * 0.52)} ${f(y + h * 0.14)} L${f(x + w * 0.72)} ${f(y + h * 0.14)} L${f(x + w * 0.34)} ${f(y + h * 0.86)} Z`, { fill: '#fff', opacity: 0.65 });
  o += S.path(`M${f(x + w / 2)} ${f(y)} L${f(x + w / 2)} ${f(y + h)} M${f(x)} ${f(y + h / 2)} L${f(x + w)} ${f(y + h / 2)}`, ln(4));
  return o;
}

const HOUSE_COLS = [['#FFB4C8', '#E8506E', '#7A3B52'], ['#FFE38A', '#F28A2E', '#7A4B2A'], ['#B9F0D2', '#2FA37A', '#2F6B5A'], ['#C9D6FF', '#4A63E8', '#33407A'], ['#FFD1A6', '#C8553D', '#6B3A2A'], ['#E8C8FF', '#8A4FD8', '#4E2E7A']];

function house(x, base, w, h, ci, flat) {
  const [wall, roof, door] = HOUSE_COLS[ci % HOUSE_COLS.length];
  const top = base - h;
  let o = '';
  if (!flat) o += R(x + w * 0.68, top - h * 0.44, w * 0.13, h * 0.44, 4, ol('#B85C4A', 5)) + R(x + w * 0.655, top - h * 0.48, w * 0.16, 18, 4, ol('#8E4434', 5));
  o += R(x, top, w, h, 8, ol(wall));
  o += R(x + w - 24, top + 5, 18, h - 10, 4, { fill: '#000', opacity: 0.07 });
  if (flat) {
    o += R(x - 14, top - 32, w + 28, 38, 8, ol(roof)) + R(x - 8, top - 28, w + 16, 9, 4, { fill: '#fff', opacity: 0.3 });
  } else {
    const peak = top - h * 0.58;
    o += S.path(`M${f(x - 26)} ${f(top + 10)} L${f(x + w / 2)} ${f(peak)} L${f(x + w + 26)} ${f(top + 10)} Z`, ol(roof));
    o += S.path(`M${f(x + w / 2 - 6)} ${f(peak + 20)} L${f(x + 10)} ${f(top + 2)}`, ln(7, '#fff', 0.3));
    o += S.circle(x + w / 2, peak + h * 0.28, h * 0.08, ol('#BDEBFF', 4));
  }
  const ww = w * 0.24, wh = h * 0.28, wy = top + h * 0.18;
  o += win(x + w * 0.1, wy, ww, wh) + win(x + w * 0.66, wy, ww, wh);
  o += R(x + w * 0.08, wy + wh + 2, ww + w * 0.04, 16, 4, ol('#8A5A33', 4)) + S.circle(x + w * 0.14, wy + wh - 2, 7, ol('#FF6FB5', 3)) + S.circle(x + w * 0.24, wy + wh - 4, 7, ol('#FFE14D', 3));
  const dw = w * 0.22, dh = h * 0.46, dx = x + w * 0.39;
  o += R(dx, base - dh, dw, dh, 8, ol(door, 5)) + S.circle(dx + dw * 0.78, base - dh * 0.45, 5, { fill: '#FFD34D', stroke: LINE, 'stroke-width': 2.5 });
  o += R(dx - 10, base - 8, dw + 20, 12, 4, ol('#D9DEE8', 4));
  return o;
}

function tree(x, base, s, g = 0) {
  const G = [['#3FBF5A', '#2E9C47', '#8BE88A'], ['#2FAE6E', '#228A55', '#7FE8B4'], ['#7BCB3A', '#5DA42A', '#C2F27E']][g % 3];
  let o = R(-18, -162, 36, 164, 6, ol('#8A5A33', 6)) + R(-12, -150, 10, 140, 4, { fill: '#A8743F' });
  o += R(-72, -402, 144, 112, 24, ol(G[0], 6));
  o += R(-110, -330, 220, 190, 30, ol(G[0], 6));
  o += R(-100, -184, 200, 36, 16, { fill: G[1] });
  o += R(-94, -314, 92, 28, 14, { fill: G[2] }) + R(-58, -388, 60, 22, 11, { fill: G[2] });
  return S.g(o, `translate(${f(x)} ${f(base)}) scale(${f(s)})`);
}

function bush(x, base, s, c = '#3FBF5A') {
  const o = R(-90, -70, 100, 74, 30, ol(c, 6)) + R(-20, -96, 110, 100, 36, ol(c, 6)) + R(60, -62, 80, 66, 28, ol(c, 6)) + R(-4, -84, 44, 16, 8, { fill: '#fff', opacity: 0.3 });
  return S.g(o, `translate(${f(x)} ${f(base)}) scale(${f(s)})`);
}

function flowers(x, base, s, seed) {
  const r = rng(seed); let o = '';
  const cols = ['#FF5A7A', '#FFE14D', '#FFFFFF', '#B06BFF', '#FF9F1C'];
  for (let i = 0; i < 5; i++) {
    const fx = i * 34 + r() * 10, h = 40 + r() * 40;
    o += S.path(`M${f(fx)} 0 L${f(fx)} ${f(-h)}`, ln(5, '#2E9C47'));
    o += R(fx - 13, -h - 13, 26, 26, 7, ol(cols[(i + seed) % 5], 4)) + R(fx - 5, -h - 5, 10, 10, 3, { fill: '#FFB000' });
  }
  return S.g(o, `translate(${f(x)} ${f(base)}) scale(${f(s)})`);
}

function lamp(x, base, s = 1, on = false) {
  let o = R(-9, -330, 18, 332, 4, ol('#2E3550', 5)) + R(-24, -16, 48, 18, 4, ol('#2E3550', 5));
  o += R(-36, -380, 72, 54, 12, ol('#2E3550', 5)) + R(-26, -334, 52, 12, 4, { fill: on ? '#FFE88A' : '#FFF4C8' });
  return S.g(o, `translate(${f(x)} ${f(base)}) scale(${f(s)})`);
}

function car(x, base, color, t, s = 1, flip = false) {
  let o = '';
  o += S.ellipse(0, 4, 170, 14, { fill: '#000', opacity: 0.18 });
  o += S.path('M-96 -112 L-62 -176 L74 -176 L116 -112 Z', ol(color, 7));
  o += S.path('M-76 -118 L-52 -164 L2 -164 L2 -118 Z', ol('#BDEBFF', 5)) + S.path('M14 -118 L14 -164 L66 -164 L94 -118 Z', ol('#BDEBFF', 5));
  o += S.path('M-60 -122 L-40 -160 L-28 -160 L-48 -122 Z', { fill: '#fff', opacity: 0.6 });
  o += R(-160, -120, 320, 86, 24, ol(color, 7)) + R(-150, -112, 300, 14, 7, { fill: '#fff', opacity: 0.3 });
  o += R(132, -98, 24, 18, 6, ol('#FFE88A', 4)) + R(-158, -98, 18, 16, 5, ol('#FF5A5A', 4));
  o += R(-20, -88, 40, 8, 4, { fill: '#000', opacity: 0.2 });
  for (const wx of [-92, 92]) {
    o += S.circle(wx, -30, 36, ol('#23262F', 7)) + S.circle(wx, -30, 15, { fill: '#C9CED8' });
    o += S.path(`M${wx - 12} -30 L${wx + 12} -30`, { stroke: '#7A8090', 'stroke-width': 5, transform: `rotate(${f(t * 900)} ${wx} -30)` });
  }
  return S.g(o, `translate(${f(x)} ${f(base)}) scale(${f(flip ? -s : s)} ${f(s)})`);
}

function skyline(x0, x1, base, col, winCol, seed) {
  const r = rng(seed); let o = ''; let x = x0;
  while (x < x1) {
    const w = 90 + r() * 120, h = 110 + r() * 240;
    o += R(x, base - h, w, h + 300, 6, { fill: col });
    for (let yy = base - h + 26; yy < base - 24; yy += 44) for (let xx = x + 16; xx < x + w - 26; xx += 36) if (r() > 0.45) o += R(xx, yy, 14, 18, 3, { fill: winCol });
    if (r() > 0.6) o += R(x + w / 2 - 3, base - h - 44, 6, 44, 2, { fill: col });
    x += w + 8 + r() * 26;
  }
  return o;
}

function hills(x0, x1, base, col, hi, seed) {
  const r = rng(seed); let pts = [[x0, base + 400], [x0, base]]; let x = x0;
  while (x < x1) { const w = 140 + r() * 200, h = 30 + r() * 110; pts.push([x, base - h], [x + w, base - h]); x += w; }
  pts.push([x1, base], [x1, base + 400]);
  let o = S.path('M' + pts.map((p) => `${f(p[0])} ${f(p[1])}`).join(' L') + ' Z', { fill: col });
  for (let i = 2; i < pts.length - 2; i += 2) o += R(pts[i][0], pts[i][1], pts[i + 1][0] - pts[i][0], 12, 0, { fill: hi });
  return o;
}

// ---------------------------------------------------------------- TOWN
const TOWN_X0 = -1400, TOWN_X1 = 5400;
const TOWN = (() => {
  const r = rng(7); const houses = []; let x = -1100;
  let i = 0;
  while (x < TOWN_X1 - 400) {
    const w = 230 + r() * 80, h = 170 + r() * 70;
    houses.push({ x, w, h, ci: i % 6, flat: r() > 0.7, tree: r() > 0.35, tg: Math.floor(r() * 3) });
    x += w + 90 + r() * 70; i++;
  }
  return { houses };
})();

function townLayers(cam, t, opts = {}) {
  const sky = R(-600, -600, 3120, 2280, 0, { fill: 'url(#skyDay)' });
  const far = sun(1500, 200, 130, t);
  let clouds = '';
  for (const [cx, cy, cs] of [[-300, 140, 0.9], [300, 90, 1.1], [900, 230, 0.7], [1500, 120, 0.85], [2200, 180, 1.0], [2900, 100, 0.8], [3600, 200, 0.9]]) clouds += cloud((((cx + t * 18 + 600) % 4600) + 4600) % 4600 - 600, cy, cs);
  let sky2 = '';
  sky2 += island(260, 300, 0.55, t, 0) + island(1280, 220, 0.42, t, 1) + island(2400, 300, 0.5, t, 2) + island(3400, 240, 0.45, t, 3);
  sky2 += obby(560, 360, t) + obby(2900, 380, t);
  let birds = '';
  for (let i = 0; i < 4; i++) birds += bird(((t * 160 + i * 230) % 2600) - 400, 300 + i * 26 + Math.sin(t * 2 + i) * 10, 0.9, t, i);
  const city = skyline(TOWN_X0, TOWN_X1, 650, '#B9B4F2', '#E3E0FF', 3);
  const hill = hills(TOWN_X0, TOWN_X1, 700, '#7FD77A', '#9BE594', 5) + R(TOWN_X0, 640, TOWN_X1 - TOWN_X0, 120, 0, { fill: 'url(#hazeDay)' });
  let row = R(TOWN_X0, 690, TOWN_X1 - TOWN_X0, 120, 0, { fill: '#67CF62' }) + R(TOWN_X0, 690, TOWN_X1 - TOWN_X0, 120, 0, { fill: 'url(#studsSm)' });
  for (const hs of TOWN.houses) {
    if (hs.tree) row += tree(hs.x - 45, 712, 0.62, hs.tg);
    row += house(hs.x, 712, hs.w, hs.h, hs.ci, hs.flat);
    row += bush(hs.x + hs.w - 10, 722, 0.45, ['#3FBF5A', '#2FAE6E', '#7BCB3A'][hs.ci % 3]);
  }
  // street
  let st = '';
  const W = TOWN_X1 - TOWN_X0;
  st += R(TOWN_X0, 758, W, 46, 0, { fill: '#E6EAF2' }) + R(TOWN_X0, 758, W, 46, 0, { fill: 'url(#studsSm)' });
  st += R(TOWN_X0, 804, W, 12, 0, { fill: '#C3CAD8' });
  st += R(TOWN_X0, 816, W, 128, 0, { fill: '#7D879D' }) + R(TOWN_X0, 816, W, 128, 0, { fill: 'url(#studs)' });
  for (let x = TOWN_X0; x < TOWN_X1; x += 170) st += R(x, 874, 96, 12, 6, { fill: '#FFE066' });
  st += R(TOWN_X0, 944, W, 12, 0, { fill: '#C3CAD8' });
  st += R(TOWN_X0, 956, W, 50, 0, { fill: '#E6EAF2' }) + R(TOWN_X0, 956, W, 50, 0, { fill: 'url(#studsSm)' });
  st += R(TOWN_X0, 1006, W, 500, 0, { fill: '#5BCB5E' }) + R(TOWN_X0, 1006, W, 500, 0, { fill: 'url(#studs)' });
  st += S.path(`M${TOWN_X0} 758 L${TOWN_X1} 758 M${TOWN_X0} 816 L${TOWN_X1} 816 M${TOWN_X0} 944 L${TOWN_X1} 944 M${TOWN_X0} 1006 L${TOWN_X1} 1006`, ln(4, '#4B5468', 0.45));
  for (let x = TOWN_X0 + 300; x < TOWN_X1; x += 1100) st += lamp(x, 990, 0.85);
  // foreground
  let fg = '';
  for (let x = TOWN_X0; x < TOWN_X1; x += 520) fg += bush(x, 1150, 0.9, x % 3 ? '#3FBF5A' : '#2FAE6E') + flowers(x + 230, 1120, 1.1, x);

  const bg = sky + layer(far, cam, 0.03) + layer(clouds, cam, 0.08) + layer(sky2 + birds, cam, 0.14) + layer(city, cam, 0.25) + layer(hill, cam, 0.42) + layer(row, cam, 0.8);
  return { bg, street: layer(st, cam, 1), fg: opts.noFg ? '' : layer(fg, cam, 1.25) };
}

// ---------------------------------------------------------------- BEDROOM
function bedroomLayers(cam, t, opts = {}) {
  const ring = opts.ring || 0; // 0..1 alarm ringing intensity
  let back = R(-400, -300, 2720, 1180, 0, { fill: 'url(#wallGrad)' }) + R(-400, -300, 2720, 1180, 0, { fill: 'url(#wallStripes)' });
  // window
  back += R(110, 150, 470, 440, 14, ol('#FFFFFF', 8));
  if (opts.night) {
    back += R(132, 172, 426, 396, 6, { fill: 'url(#skyNight)' });
    let st = '';
    const rr = rng(5);
    for (let i = 0; i < 26; i++) st += R(140 + rr() * 410, 180 + rr() * 260, 5, 5, 1, { fill: '#fff', opacity: f(0.4 + 0.5 * Math.abs(Math.sin(t * 2 + i))) });
    back += S.g(st + S.circle(460, 270, 70, { fill: 'url(#softWhite)', opacity: 0.3 }) + R(420, 230, 80, 80, 12, { fill: '#FFF3D6' }) +
      cloud(170, 330, 0.45, '#3A4A9C', '#2E3B80') + skyline(132, 560, 568, '#1B2260', '#FFE38A', 11), null, { 'clip-path': 'url(#winClip)' });
  } else {
    back += R(132, 172, 426, 396, 6, { fill: 'url(#skyMorning)' });
    back += S.g(sun(440, 470, 100, t) + cloud(170, 260, 0.55, '#FFF4FA', '#FFD3E6') + cloud(360, 350, 0.4, '#FFF4FA', '#FFD3E6') +
      skyline(132, 560, 568, '#B66FA6', '#FFD7EE', 11), null, { 'clip-path': 'url(#winClip)' });
  }
  back += S.clipDef('winClip', R(132, 172, 426, 396, 6));
  back += S.path('M345 172 L345 568 M132 370 L558 370', ln(12, '#FFFFFF')) + R(110, 150, 470, 440, 14, ln(6));
  back += R(90, 584, 510, 30, 8, ol('#FFFFFF', 6));
  // curtains + rod
  back += R(60, 116, 570, 14, 7, ol('#8A5A33', 5));
  const sway = Math.sin(t * 1.4) * 4;
  for (const [cx, dir] of [[96, 1], [594, -1]]) {
    back += S.path(`M${cx - 44} 124 L${cx + 44} 124 L${cx + 44 + dir * sway} 640 Q${cx} 660 ${cx - 44 + dir * sway} 640 Z`, ol('#FF8A5B', 6));
    back += S.path(`M${cx - 15} 132 L${cx - 15 + dir * sway} 636 M${cx + 15} 132 L${cx + 15 + dir * sway} 640`, ln(4, '#E0663A'));
  }
  // light beam
  if (!opts.night) back += S.path('M140 170 L560 170 L1180 1080 L520 1080 Z', { fill: 'url(#beam)', opacity: 0.6 });
  // poster
  const poster = R(0, 0, 250, 330, 10, ol('#7B3FE4', 6)) + R(14, 14, 222, 302, 6, { fill: '#9D5CFF' }) +
    S.g(egg({ x: 125, y: 150, size: 150, rarity: 'legendary', glow: false }), '') +
    T('STEAL', 125, 262, 46, '#FFE14D', { stroke: LINE, 'stroke-width': 7, 'paint-order': 'stroke' }) +
    T('AN EGG', 125, 304, 40, '#FFFFFF', { stroke: LINE, 'stroke-width': 7, 'paint-order': 'stroke' }) +
    R(100, -12, 50, 22, 3, { fill: '#FFF3B0', opacity: 0.9, transform: 'rotate(-6 125 0)' });
  back += S.g(poster, 'translate(1490 140) rotate(4)');
  // potted plant on the nightstand
  back += R(1632, 600, 50, 60, 8, ol('#E8704A', 5)) + R(1640, 540, 16, 66, 6, ol('#3FBF5A', 4)) + R(1658, 520, 16, 86, 6, ol('#2FAE6E', 4)) + R(1622, 560, 16, 50, 6, ol('#7BCB3A', 4));
  // floor
  back += R(-400, 870, 2720, 500, 0, { fill: '#D49A62' }) + R(-400, 870, 2720, 500, 0, { fill: 'url(#planks)' }) + R(-400, 870, 2720, 500, 0, { fill: 'url(#studs)' });
  back += R(-400, 852, 2720, 26, 0, ol('#FFFFFF', 5));
  // nightstand + alarm clock
  back += R(1440, 660, 250, 230, 12, ol('#C98A5B', 7)) + R(1468, 712, 194, 70, 10, ol('#B57A4E', 5)) + S.circle(1565, 747, 8, ol('#FFD34D', 3));
  const shake = ring ? Math.sin(t * 90) * 7 * ring : 0;
  let clock = S.circle(-52, -66, 22, ol('#FFD34D', 5)) + S.circle(52, -66, 22, ol('#FFD34D', 5)) + S.path('M-40 6 L-52 22 M40 6 L52 22', ln(8));
  clock += R(-76, -60, 152, 92, 22, ol('#FF5A5A', 7)) + R(-58, -44, 116, 54, 10, { fill: '#1B1F2B' });
  if (opts.loading !== undefined) {
    const p = S.clamp(opts.loading, 0, 1);
    clock += R(-50, -36, 100, 16, 8, { fill: '#2C3448' }) + R(-50, -36, Math.max(16, 100 * p), 16, 8, { fill: '#5CFF7A' });
    clock += S.el('text', { x: 0, y: 4, 'font-family': 'Fredoka, sans-serif', 'font-weight': 700, 'font-size': 18, fill: '#5CFF7A', 'text-anchor': 'middle' }, opts.loadText || 'LOADING...');
  } else {
    clock += S.el('text', { x: 0, y: -2, 'font-family': 'Fredoka, sans-serif', 'font-weight': 700, 'font-size': 40, fill: opts.clockCol || (ring ? '#FF6B6B' : '#5CFF7A'), 'text-anchor': 'middle' }, opts.clock || '7:00');
  }
  back += S.g(clock, `translate(1565 ${f(640 - Math.abs(shake) * 0.6)}) rotate(${f(shake)})`);
  // bed (behind the sleeper)
  back += R(500, 300, 80, 600, 22, ol('#8A5A3A', 7)) + R(1340, 300, 80, 600, 22, ol('#8A5A3A', 7));
  back += R(540, 340, 840, 540, 34, ol('#9B6A45', 7)) + R(586, 382, 748, 190, 24, { fill: '#B5845C' }) + R(600, 392, 300, 22, 11, { fill: '#fff', opacity: 0.18 });
  back += R(690, 480, 540, 210, 76, ol('#FFFFFF', 7)) + R(712, 640, 496, 36, 18, { fill: '#E3E6F0' });
  // blanket (in front of the sleeper)
  let front = R(470, 758, 980, 460, 48, ol('#4C7DFF', 7)) + R(470, 758, 980, 460, 48, { fill: 'url(#quilt)' });
  front += R(470, 734, 980, 84, 40, ol('#FFFFFF', 7)) + R(500, 790, 920, 18, 9, { fill: '#E3E6F0' });
  front += S.path('M620 860 Q660 1000 640 1100 M1300 860 Q1270 1000 1290 1100', ln(5, '#355FD6'));
  return { back: layer(back, cam, 1), front: layer(front, cam, 1) };
}

// ---------------------------------------------------------------- PORTAL PLAZA
const PORTALS = [
  { x: 210, base: 690, w: 190, h: 270, col: '#FF5A5A', name: 'TOWER OF PAIN', icon: 'tower' },
  { x: 560, base: 700, w: 210, h: 300, col: '#FF6FB5', name: "BROOKHAVEN'T", icon: 'house' },
  { x: 960, base: 710, w: 240, h: 330, col: '#34C3FF', name: 'NATURAL DISASTERS', icon: 'tornado' },
  { x: 1360, base: 700, w: 210, h: 300, col: '#3BD16F', name: 'ADOPT ME MAYBE', icon: 'paw' },
  { x: 1710, base: 690, w: 190, h: 270, col: '#9D5CFF', name: 'STEAL AN EGG', icon: 'egg', glitch: true },
];

function icon(kind, x, y, s, col) {
  const g = (inner) => S.g(inner, `translate(${f(x)} ${f(y)}) scale(${f(s)})`);
  switch (kind) {
    case 'tower': return g(R(-14, -30, 28, 60, 4, ol(col, 4)) + R(-22, -40, 44, 14, 4, ol(col, 4)) + R(-6, -12, 12, 14, 3, { fill: LINE }));
    case 'house': return g(S.path('M-26 0 L0 -26 L26 0 Z', ol(col, 4)) + R(-18, -2, 36, 28, 4, ol('#FFF', 4)));
    case 'tornado': return g(S.path('M-28 -26 L28 -26 M-20 -12 L20 -12 M-12 2 L14 2 M-4 16 L8 16 M0 28 L2 28', ln(7, col)));
    case 'paw': return g(S.circle(0, 8, 14, ol(col, 4)) + S.circle(-16, -10, 7, ol(col, 3)) + S.circle(0, -18, 7, ol(col, 3)) + S.circle(16, -10, 7, ol(col, 3)));
    case 'egg': return g(S.ellipse(0, 0, 18, 24, ol(col, 4)) + S.path('M-12 2 L-4 -4 L4 4 L12 -2', ln(3, '#fff')));
    default: return '';
  }
}

function portal(P, t, flash = 0) {
  const { x, base, w, h, col } = P;
  const arch = (ww, hh) => `M${f(x - ww / 2)} ${f(base)} L${f(x - ww / 2)} ${f(base - hh + ww / 2)} A${f(ww / 2)} ${f(ww / 2)} 0 0 1 ${f(x + ww / 2)} ${f(base - hh + ww / 2)} L${f(x + ww / 2)} ${f(base)} Z`;
  const cy = base - h * 0.45;
  const flick = P.glitch ? (Math.sin(t * 37) > 0.75 ? 0.45 : 1) : 1;
  let o = S.circle(x, cy, w * 1.05, { fill: col, opacity: 0.18 * flick + flash * 0.3 }) + S.circle(x, cy, w * 0.75, { fill: col, opacity: 0.18 * flick + flash * 0.3 });
  o += S.path(arch(w + 64, h + 34), ol('#4B4F6B', 7));
  for (let i = 0; i < 7; i++) {
    const a = Math.PI + (i / 6) * Math.PI;
    const rx = x + Math.cos(a) * (w / 2 + 16), ry = base - h + w / 2 + Math.sin(a) * (w / 2 + 16);
    o += R(rx - 13, ry - 13, 26, 26, 5, ol(i === 3 ? '#FFC52E' : '#6B7092', 4));
  }
  const id = S.uid('pt');
  o += S.clipDef(id, S.path(arch(w, h)));
  let sw = S.path(arch(w, h), { fill: col });
  sw += S.circle(x, cy, w * 0.75, { fill: 'url(#softWhite)', opacity: 0.85 * flick });
  let arms = '';
  const rr = w * 0.9;
  for (let k = 0; k < 6; k++) arms += S.path(`M0 0 C${f(rr * 0.3)} ${f(-rr * 0.12)} ${f(rr * 0.62)} ${f(rr * 0.12)} ${f(rr)} ${f(-rr * 0.28)}`, { ...ln(16, '#FFFFFF', 0.45), transform: `rotate(${k * 60})` });
  sw += S.g(arms, `translate(${f(x)} ${f(cy)}) rotate(${f(t * 160 * (P.glitch ? -1 : 1))})`);
  for (let k = 0; k < 6; k++) {
    const ph = (t * 0.7 + k / 6) % 1;
    sw += R(x - w * 0.35 + ((k * 53) % 100) / 100 * w * 0.7, base - ph * h, 10, 10, 2, { fill: '#fff', opacity: 0.8 * (1 - ph) });
  }
  if (P.glitch && Math.sin(t * 23) > 0.6) sw += R(x - w / 2, cy - 30 + Math.sin(t * 50) * 60, w, 18, 0, { fill: '#00F0FF', opacity: 0.6 });
  o += S.g(sw, null, { 'clip-path': `url(#${id})` }) + S.path(arch(w, h), ln(6));
  if (flash) o += S.path(arch(w, h), { fill: '#fff', opacity: flash * 0.6 });
  if (!P.name) return o;
  // sign
  const sw2 = Math.max(w + 70, P.name.length * 19 + 80), sy = base - h - 120;
  let sign = R(x - sw2 / 2, sy, sw2, 74, 16, ol('#FFFFFF', 6)) + R(x - sw2 / 2 + 6, sy + 6, 62, 62, 12, { fill: col });
  sign += icon(P.icon, x - sw2 / 2 + 37, sy + 37, 0.9, '#FFFFFF');
  sign += S.el('text', { x: x + 30, y: sy + 48, 'font-family': 'Lilita One, sans-serif', 'font-size': 30, fill: '#1d2433', 'text-anchor': 'middle' }, P.name);
  sign += S.path(`M${f(x - sw2 / 2 + 30)} ${f(sy + 74)} L${f(x - sw2 / 2 + 30)} ${f(base - h - 20)} M${f(x + sw2 / 2 - 30)} ${f(sy + 74)} L${f(x + sw2 / 2 - 30)} ${f(base - h - 20)}`, ln(6));
  if (P.glitch) {
    const g1 = Math.sin(t * 29) > 0.7 ? 5 : 0;
    o += S.g(sign, `translate(${g1} 0)`, { opacity: flick });
    if (g1) o += S.g(sign, 'translate(-7 0)', { opacity: 0.35 });
  } else o += sign;
  return o;
}

function plazaLayers(cam, t, opts = {}) {
  const flash = opts.flash || 0;
  const sky = R(-600, -600, 3120, 2280, 0, { fill: 'url(#skyPlaza)' });
  const wrap = (x) => ((((x + 500) % 2900) + 2900) % 2900) - 500;
  const far = sun(1560, 300, 110, t) + cloud(wrap(100 + t * 14), 150, 0.9, '#FFF4FF', '#E7D2FF') + cloud(wrap(1100 + t * 14), 90, 0.7, '#FFF4FF', '#E7D2FF') + cloud(wrap(1800 + t * 14), 220, 0.6, '#FFF4FF', '#E7D2FF');
  const mid = island(330, 250, 0.45, t, 1) + island(1620, 180, 0.38, t, 2) + skyline(-600, 2600, 600, '#B79BEA', '#EDE2FF', 21) + hills(-600, 2600, 640, '#C9A9F0', '#DBC2FA', 9);
  // bunting
  let bunt = '';
  const cols = ['#FF5A5A', '#FFE14D', '#3BD16F', '#34C3FF', '#B06BFF'];
  for (const [x0, x1] of [[-100, 960], [960, 2020]]) {
    const pts = []; for (let i = 0; i <= 14; i++) { const u = i / 14; pts.push([x0 + (x1 - x0) * u, 40 + Math.sin(u * Math.PI) * 90]); }
    bunt += S.pline(pts, ln(4, '#4B4F6B'));
    for (let i = 0; i < 14; i++) { const [px, py] = pts[i]; const sway = Math.sin(t * 3 + i) * 3; bunt += S.path(`M${f(px + 8)} ${f(py + 4)} L${f(px + 62)} ${f(py + 8)} L${f(px + 36 + sway)} ${f(py + 56)} Z`, ol(cols[i % 5], 4)); }
  }
  let floor = R(-600, 640, 3120, 900, 0, { fill: 'url(#tiles)' }) + R(-600, 640, 3120, 70, 0, { fill: '#B9A6E8', opacity: 0.35 });
  floor += S.ellipse(960, 930, 860, 150, ln(22, '#FF8A5B', 0.7)) + S.ellipse(960, 930, 600, 100, ln(14, '#FFC52E', 0.7));
  floor += S.path('M-600 640 L2520 640', ln(5, '#7A6AB0', 0.5));
  let ps = '';
  if (opts.many) { // a distant crowd of extra portals: "hundreds"
    const cols = ['#FF5A5A', '#FFB000', '#3BD16F', '#34C3FF', '#B06BFF', '#FF6FB5'];
    for (let i = 0; i < 18; i++) ps += S.g(portal({ x: -200 + i * 140, base: 640, w: 70, h: 100, col: cols[i % 6], name: '', icon: '' }, t + i), '');
  }
  for (const P of PORTALS) ps += portal(P, t, flash);
  ps += bush(-40, 720, 0.6, '#2FAE6E') + bush(1960, 720, 0.6, '#2FAE6E');
  return {
    bg: sky + layer(far, cam, 0.05) + layer(mid, cam, 0.2) + layer(floor, cam, 1) + layer(ps, cam, 0.75) + layer(bunt, cam, 1.1),
  };
}

// ---------------------------------------------------------------- ADMIN VAULT
function vaultLayers(cam, t, opts = {}) {
  const sky = R(-600, -600, 3120, 2280, 0, { fill: 'url(#skyVault)' });
  let stars = '';
  const r = rng(99);
  for (let i = 0; i < 90; i++) { const x = r() * 2200 - 140, y = r() * 520, s = 3 + r() * 5; stars += R(x, y, s, s, 1, { fill: '#FFFFFF', opacity: f(0.35 + 0.6 * Math.abs(Math.sin(t * 2 + i))) }); }
  stars += S.circle(260, 170, 120, { fill: 'url(#softWhite)', opacity: 0.35 }) + R(205, 115, 110, 110, 16, { fill: '#FFF0D6' }) + R(225, 135, 30, 22, 6, { fill: '#E9D3B0' }) + R(270, 180, 24, 18, 6, { fill: '#E9D3B0' });
  let rocks = '';
  for (const [x, y, s] of [[120, 520, 0.5], [1750, 470, 0.6], [1420, 600, 0.35]]) rocks += S.g(R(-120, 0, 240, 40, 10, { fill: '#3A2466' }) + R(-90, 36, 180, 50, 8, { fill: '#2E1C52' }) + R(-40, 82, 80, 40, 8, { fill: '#24163F' }), `translate(${x} ${f(y + Math.sin(t + x) * 6)}) scale(${s})`);
  const cloudBand = (y, col, hi, k, sp) => {
    let o = '';
    for (let i = -2; i < 12; i++) { const x = ((i * 260 + t * sp) % 3400) - 700; o += R(x, y - (i % 3) * 22, 300, 400, 90, { fill: col }) + R(x + 40, y - (i % 3) * 22 + 10, 140, 16, 8, { fill: hi, opacity: 0.6 }); }
    return o;
  };
  const sea1 = cloudBand(760, '#6D3A99', '#B57BD6', 0.15, 12), sea2 = cloudBand(830, '#A24C9E', '#E59AD0', 0.3, 22), sea3 = cloudBand(900, '#E0739A', '#FFC0D0', 0.5, 34);
  // tower
  let tw = '';
  tw += R(700, 310, 520, 560, 24, ol('#2C2F4A', 8)) + R(700, 310, 520, 560, 24, { fill: 'url(#metal)', opacity: 0.6 });
  tw += R(650, 270, 620, 70, 18, ol('#3A3E5C', 8)) + R(650, 270, 620, 14, 7, { fill: '#FFC52E' });
  tw += S.circle(960, 530, 150, ol('#3A3E5C', 8)) + S.circle(960, 530, 112, ol('#FFC52E', 7)) + S.circle(960, 530, 40, ol('#3A3E5C', 6));
  for (let i = 0; i < 6; i++) tw += S.path(`M960 530 L${f(960 + Math.cos(i * Math.PI / 3 + t * 0.6) * 108)} ${f(530 + Math.sin(i * Math.PI / 3 + t * 0.6) * 108)}`, ln(10, '#3A3E5C'));
  tw += R(730, 700, 460, 18, 9, { fill: '#FF2D55', opacity: 0.55 + 0.35 * Math.sin(t * 8) }) + R(730, 760, 460, 18, 9, { fill: '#FF2D55', opacity: 0.55 + 0.35 * Math.sin(t * 8 + 1) });
  tw += R(780, 200, 360, 64, 14, ol('#151521', 6)) + T('ADMIN VAULT', 960, 246, 44, '#FFC52E');
  // pedestal + secret egg (front of the tower door)
  tw += R(880, 390, 160, 30, 8, ol('#FFC52E', 5));
  if (opts.eggOnPedestal !== false) tw += secretEgg({ x: 960, y: 310 + Math.sin(t * 2.4) * 10, size: 150, t });
  else tw += S.ellipse(960, 386, 70, 16, { fill: '#C77DFF', opacity: 0.45 + 0.2 * Math.sin(t * 6) }) + S.path('M900 386 L920 300 M960 386 L960 280 M1020 386 L1000 300', ln(6, '#C77DFF', 0.5));
  // laser pillars
  let lz = '';
  const beams = (ex, ey, a0, swing, sp) => {
    let o = '';
    const a = a0 + Math.sin(t * sp) * swing;
    const x2 = ex + Math.cos(a) * 2600, y2 = ey + Math.sin(a) * 2600;
    o += S.path(`M${f(ex)} ${f(ey)} L${f(x2)} ${f(y2)}`, ln(30, '#FF2D55', 0.25)) + S.path(`M${f(ex)} ${f(ey)} L${f(x2)} ${f(y2)}`, ln(10, '#FF6A84')) + S.path(`M${f(ex)} ${f(ey)} L${f(x2)} ${f(y2)}`, ln(3, '#FFFFFF'));
    return o;
  };
  lz += beams(300, 560, 0.15, 0.22, 2.2) + beams(1620, 560, Math.PI - 0.2, 0.25, 1.8) + beams(300, 700, -0.05, 0.12, 3.1);
  for (const px of [300, 1620]) lz += R(px - 50, 520, 100, 420, 14, ol('#2C2F4A', 7)) + R(px - 50, 520, 100, 420, 14, { fill: 'url(#metal)', opacity: 0.5 }) + S.circle(px, 560, 26, ol('#FF2D55', 5)) + S.circle(px, 700, 22, ol('#FF2D55', 5)) + S.circle(px, 560, 60, { fill: 'url(#redGlow)' });
  // platform (k = 1)
  let pf = R(-500, 930, 2920, 600, 0, { fill: '#262A40' }) + R(-500, 930, 2920, 600, 0, { fill: 'url(#metal)', opacity: 0.6 });
  pf += R(-500, 912, 2920, 44, 0, ol('#3A3F5E', 6)) + R(-500, 912, 2920, 44, 0, { fill: 'url(#studsSm)' }) + R(-500, 908, 2920, 10, 0, { fill: '#FFC52E' });
  for (let x = -500; x < 2420; x += 120) pf += S.path(`M${x} 956 L${x + 60} 956 L${x + 20} 996 L${x - 40} 996 Z`, { fill: '#FFC52E', opacity: 0.85 });
  pf += R(-500, 990, 2920, 10, 0, { fill: '#FF2D55', opacity: 0.6 + 0.3 * Math.sin(t * 9) });
  return {
    bg: sky + layer(stars, cam, 0.02) + layer(rocks, cam, 0.1) + layer(sea1, cam, 0.15) + layer(sea2, cam, 0.3) + layer(tw, cam, 0.6) + layer(sea3, cam, 0.5) + layer(lz, cam, 0.85),
    platform: layer(pf, cam, 1),
  };
}

// close shot of the platform's front edge with the void + cloud sea below (for hanging)
function vaultHangLayers(cam, t, edgeY = 452) {
  const sky = R(-600, -600, 3120, 2280, 0, { fill: 'url(#skyVault)' });
  const cloudBand = (y, col, hi, sp) => {
    let o = '';
    for (let i = -2; i < 12; i++) { const x = ((i * 260 + t * sp) % 3400) - 700; o += R(x, y - (i % 3) * 22, 300, 500, 90, { fill: col }) + R(x + 40, y - (i % 3) * 22 + 10, 140, 16, 8, { fill: hi, opacity: 0.6 }); }
    return o;
  };
  let stars = '';
  const r = rng(77);
  for (let i = 0; i < 40; i++) { const x = r() * 2200 - 140, y = 700 + r() * 200; stars += R(x, y, 4, 4, 1, { fill: '#FFFFFF', opacity: f(0.3 + 0.5 * Math.abs(Math.sin(t * 2 + i))) }); }
  const far = cloudBand(930, '#6D3A99', '#B57BD6', 10) + cloudBand(1000, '#A24C9E', '#E59AD0', 18) + cloudBand(1060, '#E0739A', '#FFC0D0', 30);
  let pf = R(-500, edgeY - 120, 2920, 120, 0, { fill: '#3A3F5E' }) + R(-500, edgeY - 120, 2920, 120, 0, { fill: 'url(#studs)' });
  pf += R(-500, edgeY - 10, 2920, 14, 0, { fill: '#FFC52E' });
  pf += R(-500, edgeY, 2920, 330, 0, { fill: '#262A40' }) + R(-500, edgeY, 2920, 330, 0, { fill: 'url(#metal)', opacity: 0.6 });
  for (let x = -500; x < 2420; x += 120) pf += S.path(`M${x} ${edgeY + 4} L${x + 60} ${edgeY + 4} L${x + 20} ${edgeY + 50} L${x - 40} ${edgeY + 50} Z`, { fill: '#FFC52E', opacity: 0.85 });
  pf += R(-500, edgeY + 120, 2920, 10, 0, { fill: '#FF2D55', opacity: 0.6 + 0.3 * Math.sin(t * 9) });
  pf += R(-500, edgeY + 300, 2920, 30, 0, { fill: '#15172A' }) + S.path(`M-500 ${edgeY} L2420 ${edgeY} M-500 ${edgeY + 330} L2420 ${edgeY + 330}`, ln(7));
  return { bg: sky + layer(stars + far, cam, 0.2), platform: layer(pf, cam, 1) };
}

function beam(x1, y1, x2, y2, k = 1) {
  return S.path(`M${f(x1)} ${f(y1)} L${f(x2)} ${f(y2)}`, ln(36, '#FF2D55', 0.25 * k)) + S.path(`M${f(x1)} ${f(y1)} L${f(x2)} ${f(y2)}`, ln(12, '#FF6A84', k)) + S.path(`M${f(x1)} ${f(y1)} L${f(x2)} ${f(y2)}`, ln(4, '#FFFFFF', k));
}

// ---------------------------------------------------------------- BATHROOM (mirror)
const MIRROR = { x: 560, y: 110, w: 800, h: 640 };
function bathroomLayers(cam, t) {
  const M = MIRROR;
  let back = R(-400, -300, 2720, 1500, 0, { fill: 'url(#bathTiles)' }) + R(-400, 760, 2720, 600, 0, { fill: '#7FD0E8' });
  // towel bar + towel
  back += R(1500, 300, 260, 16, 8, ol('#C9CED8', 5)) + S.path('M1530 312 L1730 312 L1720 620 Q1630 640 1540 620 Z', ol('#FF8FB0', 6)) + S.path('M1545 560 L1715 560 M1545 585 L1715 585', ln(6, '#FFFFFF'));
  // shelf with a plant + rubber duck
  back += R(150, 420, 260, 20, 8, ol('#FFFFFF', 5)) + R(180, 360, 60, 60, 10, ol('#FF8A5B', 5)) + R(196, 300, 14, 64, 6, ol('#3FBF5A', 4)) + R(214, 320, 14, 44, 6, ol('#2FAE6E', 4));
  back += S.g(R(-40, -50, 80, 60, 26, ol('#FFE14D', 5)) + R(10, -82, 50, 46, 20, ol('#FFE14D', 5)) + S.path('M58 -62 L80 -56 L58 -48 Z', ol('#FF9F1C', 3)) + S.circle(40, -66, 5, { fill: '#151515' }), 'translate(330 420)');
  // bulbs above the mirror
  for (let i = 0; i < 5; i++) back += S.circle(M.x + 80 + i * 160, M.y - 30, 34, { fill: 'url(#sunGlow)', opacity: 0.7 }) + S.circle(M.x + 80 + i * 160, M.y - 30, 18, ol('#FFF4C8', 4));
  const glass = R(M.x, M.y, M.w, M.h, 26, { fill: '#E8FBFF' }) + R(M.x, M.y + M.h * 0.62, M.w, M.h * 0.38, 0, { fill: '#C6F0FF' }) +
    S.path(`M${M.x + 60} ${M.y} L${M.x + 200} ${M.y} L${M.x + 20} ${M.y + 240} L${M.x} ${M.y + 240} L${M.x} ${M.y + 80} Z`, { fill: '#FFFFFF', opacity: 0.55 });
  const frame = R(M.x - 26, M.y - 26, M.w + 52, M.h + 52, 40, { fill: 'none', stroke: '#151515', 'stroke-width': 7 }) +
    R(M.x - 20, M.y - 20, M.w + 40, M.h + 40, 36, { fill: 'none', stroke: '#FFFFFF', 'stroke-width': 26 }) + R(M.x, M.y, M.w, M.h, 26, ln(6)) +
    S.path(`M${M.x + M.w - 160} ${M.y + M.h} L${M.x + M.w - 40} ${M.y + 360} L${M.x + M.w - 10} ${M.y + 360} L${M.x + M.w - 120} ${M.y + M.h} Z`, { fill: '#FFFFFF', opacity: 0.35 });
  // counter + sink (in front)
  let front = R(400, 770, 1120, 400, 0, ol('#FFFFFF', 7)) + R(400, 770, 1120, 36, 10, ol('#EEF2F8', 6));
  front += S.ellipse(960, 790, 200, 26, ol('#D9E2EE', 6)) + S.path('M940 790 L940 720 Q940 690 980 690 L1010 690', ln(22, '#151515')) + S.path('M940 790 L940 720 Q940 690 980 690 L1010 690', ln(12, '#C9CED8'));
  front += R(1160, 690, 70, 84, 14, ol('#34C3FF', 5)) + R(1176, 600, 14, 96, 6, ol('#FF5A5A', 4)) + R(1196, 620, 14, 76, 6, ol('#3BD16F', 4));
  front += R(700, 730, 90, 46, 14, ol('#FF8FB0', 5)) + R(420, 900, 1080, 14, 7, { fill: '#000', opacity: 0.08 });
  return { back: layer(back, cam, 1), glass: layer(glass, cam, 1), frame: layer(frame, cam, 1), front: layer(front, cam, 1), clip: R(M.x, M.y, M.w, M.h, 26, { transform: camTf(cam, 1) }) };
}

// ---------------------------------------------------------------- KITCHEN
function kitchenLayers(cam, t, opts = {}) {
  let back = R(-400, -300, 2720, 1500, 0, { fill: '#FFE7A8' }) + R(-400, -300, 2720, 1500, 0, { fill: 'url(#wallStripes)', opacity: 0.6 });
  // doorway on the left
  back += R(70, 230, 320, 600, 10, ol('#C98B55', 8)) + R(96, 256, 268, 574, 6, { fill: '#B9E3FF' }) + R(96, 256, 268, 574, 6, { fill: 'url(#wallStripes)' }) + S.path('M96 760 L364 760', ln(5, '#8EC5EA'));
  // window + sun
  back += S.clipDef('kwin', R(1070, 150, 380, 260, 8));
  back += R(1070, 150, 380, 260, 8, { fill: 'url(#skyDay)' }) + S.g(sun(1340, 230, 70, t) + cloud(1090, 250, 0.4) + hills(1060, 1460, 400, '#7FD77A', '#9BE594', 3), null, { 'clip-path': 'url(#kwin)' });
  back += S.path('M1260 150 L1260 410 M1070 280 L1450 280', ln(10, '#FFFFFF')) + R(1060, 140, 400, 280, 12, { fill: 'none', stroke: '#FFFFFF', 'stroke-width': 16 }) + R(1050, 130, 420, 300, 14, ln(6));
  back += S.path('M1050 130 Q1110 300 1060 440 L1010 440 Q1040 300 1000 130 Z', ol('#FF8A5B', 5)) + S.path('M1470 130 Q1410 300 1460 440 L1510 440 Q1480 300 1520 130 Z', ol('#FF8A5B', 5));
  // upper cabinets
  for (const [x, w] of [[460, 280], [740, 280]]) back += R(x, 150, w - 10, 230, 14, ol('#8FE0C8', 6)) + R(x + 18, 170, w - 46, 190, 10, { fill: '#A8EBD6' }) + S.circle(x + w - 40, 330, 9, ol('#FFD34D', 3));
  // wall clock
  back += S.circle(1650, 160, 56, ol('#FFFFFF', 6)) + S.path(`M1650 160 L1650 122 M1650 160 L${f(1650 + Math.cos(t) * 30)} ${f(160 + Math.sin(t) * 30)}`, ln(6));
  // backsplash, counter, lower cabinets, stove
  back += R(430, 400, 1060, 250, 0, { fill: 'url(#backsplash)' }) + S.path('M430 400 L1490 400', ln(5));
  back += R(430, 640, 1060, 36, 10, ol('#C98B55', 6)) + R(440, 676, 1040, 160, 8, ol('#8FE0C8', 6));
  for (let x = 460; x < 1470; x += 210) back += R(x, 692, 190, 126, 10, { fill: '#A8EBD6' }) + S.circle(x + 95, 712, 8, ol('#FFD34D', 3));
  back += R(690, 600, 320, 50, 8, ol('#FFFFFF', 6)) + S.ellipse(780, 604, 70, 12, { fill: opts.burner ? '#FF6A3D' : '#2B2F3A' }) + S.ellipse(920, 604, 70, 12, { fill: '#2B2F3A' });
  // fridge
  back += R(1530, 230, 260, 600, 26, ol('#FFFFFF', 7)) + S.path('M1530 440 L1790 440', ln(6)) + R(1550, 300, 14, 100, 7, ol('#C9CED8', 4)) + R(1550, 470, 14, 140, 7, ol('#C9CED8', 4));
  back += R(1610, 270, 60, 60, 10, ol('#FF6FB5', 4)) + S.circle(1720, 520, 26, ol('#FFE14D', 4)) + R(1620, 600, 70, 50, 8, ol('#34C3FF', 4));
  // floor
  back += R(-400, 830, 2720, 600, 0, { fill: 'url(#kitchenFloor)' }) + S.path('M-400 830 L2320 830', ln(6));
  return { back: layer(back, cam, 1) };
}

function vaultLaserFront(cam, t, a) {
  // a sweeping beam in front of the characters (angle a in radians from the right emitter)
  const ex = 1960, ey = 160;
  const x2 = ex - Math.cos(a) * 3000, y2 = ey + Math.sin(a) * 3000;
  const b = S.path(`M${ex} ${ey} L${f(x2)} ${f(y2)}`, ln(40, '#FF2D55', 0.25)) + S.path(`M${ex} ${ey} L${f(x2)} ${f(y2)}`, ln(14, '#FF6A84')) + S.path(`M${ex} ${ey} L${f(x2)} ${f(y2)}`, ln(4, '#FFFFFF'));
  return layer(b, cam, 1);
}

function timerHud(sec, pulse = 0) {
  const s = 1 + pulse * 0.12;
  let o = R(-170, -64, 340, 128, 26, { fill: '#1A0F2E', opacity: 0.88, stroke: '#FF3B5C', 'stroke-width': 6 });
  o += S.el('text', { x: 0, y: -74, 'font-family': 'Fredoka, sans-serif', 'font-weight': 700, 'font-size': 30, fill: '#FFFFFF', 'text-anchor': 'middle', stroke: LINE, 'stroke-width': 6, 'paint-order': 'stroke' }, 'VAULT CLOSING');
  o += S.el('text', { x: 0, y: 34, 'font-family': 'Lilita One, sans-serif', 'font-size': 96, fill: '#FF3B5C', 'text-anchor': 'middle' }, `00:${String(sec).padStart(2, '0')}`);
  return S.g(o, `translate(1670 132) scale(${f(s * 0.85)})`);
}

module.exports = { portal, DEFS, camTf, layer, townLayers, bedroomLayers, bathroomLayers, kitchenLayers, MIRROR, plazaLayers, vaultLayers, vaultHangLayers, beam, vaultLaserFront, timerHud, cloud, sun, car, bird, bush, flowers, PORTALS };
