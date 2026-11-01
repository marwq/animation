// Part 4 locations: Brookhaven't pink mansion, Fishing Simulator dock, Tower of Pain,
// the DOORS monster, the portal tunnel.
'use strict';

const S = require('../rig/svg');
const E = require('./env');
const { f, clamp, lerp } = S;
const LINE = '#151515';
const ol = (fill, w = 6) => ({ fill, stroke: LINE, 'stroke-width': w, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' });
const ln = (w, c = LINE, op) => ({ fill: 'none', stroke: c, 'stroke-width': w, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', ...(op !== undefined ? { opacity: op } : {}) });
const R = (x, y, w, h, r = 0, a = {}) => S.rect(x, y, w, h, r, a);
const T = (s, x, y, size, fill, extra = {}) => S.el('text', { x, y, 'font-family': 'Lilita One, sans-serif', 'font-size': size, fill, 'text-anchor': 'middle', ...extra }, s);
const hash = (n) => { const v = Math.sin(n * 127.1 + 311.7) * 43758.5453; return v - Math.floor(v); };

// ---------------------------------------------------------------- Brookhaven't: everything pink
function pinkMansion(t, cam, opts = {}) {
  let o = R(-400, -300, 2720, 1700, 0, { fill: '#FFD6EC' }) + E.sun(1600, 200, 100, t) + E.cloud(150, 120, 0.8, '#FFFFFF', '#FFD3E6') + E.cloud(1100, 80, 0.6, '#FFFFFF', '#FFD3E6');
  // mansion
  o += R(380, 300, 1160, 520, 16, ol('#FF8FC8', 8)) + R(380, 300, 1160, 40, 10, { fill: '#FFB3DA' });
  o += S.path('M340 310 L960 90 L1580 310 Z', ol('#E8509A', 8)) + S.circle(960, 220, 50, ol('#FFE3F2', 6));
  for (let i = 0; i < 4; i++) o += R(450 + i * 270, 380, 120, 150, 10, ol('#FFE3F2', 6)) + S.path(`M${510 + i * 270} 380 L${510 + i * 270} 530`, ln(5));
  for (let i = 0; i < 6; i++) o += R(470 + i * 190, 560, 26, 260, 8, ol('#FFFFFF', 5));
  o += R(870, 600, 180, 220, 20, ol('#C2307A', 7)) + S.circle(1020, 710, 10, ol('#FFD34D', 3));
  o += R(-400, 820, 2720, 600, 0, { fill: '#FFB3DA' }) + R(-400, 820, 2720, 600, 0, { fill: 'url(#studs)' }) + S.path('M-400 820 L2320 820', ln(6));
  // hearts floating
  for (let i = 0; i < 8; i++) { const ph = (t * 0.4 + hash(i)) % 1; o += S.path(heart(hash(i * 3) * 1920, 900 - ph * 900, 18 + 10 * hash(i)), { fill: '#FF5A9A', opacity: f(0.6 * (1 - ph)) }); }
  let w = '';
  if (opts.car) w += E.car(lerp(-400, 300, clamp(opts.car, 0, 1)), 900, '#FF6FB5', t, 1.1);
  if (opts.horse) w += horse(1560, 900, 0.95 * S.ease.outBack(clamp(opts.horse, 0, 1)), t);
  return E.layer(o + w, cam, 1);
}
function heart(cx, cy, s) {
  return `M${f(cx)} ${f(cy + s * 0.9)} C${f(cx - s * 1.5)} ${f(cy - s * 0.1)} ${f(cx - s * 0.9)} ${f(cy - s * 1.25)} ${f(cx)} ${f(cy - s * 0.45)} C${f(cx + s * 0.9)} ${f(cy - s * 1.25)} ${f(cx + s * 1.5)} ${f(cy - s * 0.1)} ${f(cx)} ${f(cy + s * 0.9)} Z`;
}

// a blocky pink horse, side view facing left, (x, y) = hooves
function horse(x, y, s, t) {
  if (s <= 0) return '';
  const bob = Math.sin(t * 5) * 4;
  let o = '';
  for (const lx of [-120, -70, 70, 120]) o += R(lx - 18, -170, 36, 170, 8, ol('#FF8FC8', 6));
  o += R(-170, -330, 340, 170, 40, ol('#FF8FC8', 7));
  o += S.path('M170 -300 Q220 -320 230 -250 Q240 -180 200 -200', ln(18, '#C2307A')); // tail
  o += S.g(R(-120, -170, 110, 170, 30, ol('#FF8FC8', 7)) + R(-220, -150, 150, 90, 30, ol('#FF8FC8', 7)) + S.path('M-110 -170 L-60 -170 L-40 -40 L-90 -40 Z', ol('#C2307A', 5)) + S.circle(-150, -120, 10, { fill: LINE }) + S.circle(-210, -90, 6, { fill: LINE }),
    `translate(-150 ${f(-300 + bob)})`);
  o += S.path('M-150 -470 L-140 -520 L-120 -470 Z', ol('#FFFFFF', 4));
  return S.g(o, `translate(${f(x)} ${f(y)}) scale(${f(s)})`);
}

// ---------------------------------------------------------------- Fishing Simulator: lake + dock at golden hour
function lakeDock(t, cam, opts = {}) {
  let o = `<defs><linearGradient id="goldSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FF9E7A"/><stop offset="0.6" stop-color="#FFD08A"/><stop offset="1" stop-color="#FFF0C2"/></linearGradient></defs>`;
  o += R(-400, -300, 2720, 1700, 0, { fill: 'url(#goldSky)' }) + E.sun(1400, 420, 140, t);
  o += E.hills ? '' : '';
  o += S.path('M-400 560 L200 470 L600 540 L1100 450 L1600 530 L2320 480 L2320 640 L-400 640 Z', { fill: '#8A6AB0', opacity: 0.6 });
  for (let i = 0; i < 9; i++) { const x = -200 + i * 280; o += S.g(R(-12, -90, 24, 90, 4, { fill: '#6B4A6A' }) + R(-60, -200, 120, 120, 20, { fill: '#7E5A90' }), `translate(${x} 640) scale(${0.8 + 0.3 * hash(i)})`); }
  // water
  o += R(-400, 640, 2720, 800, 0, { fill: '#4FB5E8' });
  for (let i = 0; i < 14; i++) o += S.path(`M${f(-200 + i * 170 + (t * 30) % 170)} ${680 + (i % 4) * 90} q40 -16 80 0`, ln(6, '#FFFFFF', 0.5));
  o += S.path('M1250 640 L1550 640 L1700 1080 L1100 1080 Z', { fill: '#FFE3A8', opacity: 0.35 }); // sun reflection
  // dock
  o += R(-400, 760, 1300, 50, 6, ol('#B57A4E', 7)) + R(-400, 806, 1300, 30, 4, { fill: '#8A5A33' });
  for (let x = -380; x < 900; x += 100) o += S.path(`M${x} 760 L${x} 806`, ln(4, '#8A5A33'));
  for (const x of [-100, 300, 700]) o += R(x, 806, 36, 200, 6, ol('#8A5A33', 6));
  // bobber
  if (opts.bobber) { const by = 700 + Math.sin(t * 3) * 6; o += S.circle(1180, by, 16, ol('#FF4D4D', 5)) + R(1166, by - 30, 28, 16, 6, ol('#FFFFFF', 4)) + S.ellipse(1180, by + 18, 50, 8, ln(4, '#FFFFFF', 0.7)); }
  return E.layer(o, cam, 1);
}

// ---------------------------------------------------------------- Tower of Pain: floating obby tower above a void
function towerOfPain(t, cam) {
  let o = `<defs><linearGradient id="painSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3A1A5E"/><stop offset="0.6" stop-color="#C2307A"/><stop offset="1" stop-color="#FF8A5B"/></linearGradient></defs>`;
  o += R(-400, -2000, 2720, 4400, 0, { fill: 'url(#painSky)' });
  for (let i = 0; i < 6; i++) o += E.cloud(-300 + i * 420 + (t * 20) % 420, 1500 + (i % 2) * 140, 1.3, '#FFB3C7', '#E58AA0');
  // floating base island
  o += R(560, 860, 800, 70, 16, ol('#5CC765', 7)) + R(600, 926, 720, 90, 10, ol('#93582E', 6)) + R(700, 1010, 520, 90, 10, ol('#7E4A25', 6)) + R(820, 1094, 280, 80, 10, ol('#6B3E1E', 6));
  // tower body with neon stripes going up forever
  o += R(800, -1800, 320, 2660, 12, ol('#2C2F4A', 8));
  for (let y = -1760; y < 840; y += 160) o += R(800, y, 320, 18, 0, { fill: ['#FF3B5C', '#FFE14D', '#34C3FF'][Math.abs(y / 160) % 3 | 0], opacity: 0.85 });
  // stairs of kill bricks and spinners
  const steps = [[1180, 760, '#3BD16F'], [1290, 620, '#FF3B5C'], [1180, 470, '#3BD16F'], [1290, 320, '#FF3B5C'], [1180, 170, '#3BD16F']];
  for (const [x, y, c] of steps) o += R(x - 70, y, 140, 30, 8, ol(c, 6));
  o += S.g(R(-160, -14, 320, 28, 10, ol('#FF3B5C', 5)), `translate(1050 390) rotate(${f(t * 160)})`);
  // the sign
  o += S.g(R(-330, -80, 660, 160, 30, ol('#151521', 8)) + T('TOWER OF PAIN', 0, 30, 92, '#FF3B5C', { stroke: '#FFFFFF', 'stroke-width': 4, 'paint-order': 'stroke' }), 'translate(960 -120) rotate(-3)');
  return E.layer(o, cam, 1);
}

// ---------------------------------------------------------------- the DOORS monster (original): tall shadow with big eyes
function monster({ x = 0, y = 0, s = 1, t = 0, run = 0, scared = true } = {}) {
  const ph = t * 26;
  let o = '';
  for (const [side, k] of [[-1, 1], [1, -1]]) o += S.g(R(-26, 0, 52, 300, 18, ol('#2A1840', 6)), `translate(${side * 60} -320) rotate(${f(run * 34 * k * Math.sin(ph))})`);
  o += S.path('M-150 -320 Q-170 -900 0 -980 Q170 -900 150 -320 Z', ol('#3A2258', 8));
  for (const [side, k] of [[-1, 1], [1, -1]]) o += S.g(R(-22, 0, 44, 330, 18, ol('#2A1840', 6)), `translate(${side * 150} -760) rotate(${f(side * (scared ? 150 : 20) + run * 20 * k * Math.sin(ph))})`);
  // eyes + mouth
  const p = scared ? 7 : 16;
  o += S.ellipse(-55, -760, 48, 62, ol('#FFFFFF', 6)) + S.ellipse(55, -760, 48, 62, ol('#FFFFFF', 6)) + S.circle(-50, -750, p, { fill: LINE }) + S.circle(60, -750, p, { fill: LINE });
  o += scared ? S.ellipse(0, -620, 50, 70, ol('#120818', 6)) : S.path('M-80 -640 L80 -640 L60 -600 L-60 -600 Z', ol('#FFFFFF', 5));
  if (scared) for (const sx of [-1, 1]) o += S.path(`M${sx * 120} -900 q${sx * 20} -30 0 -60`, ln(10, '#8AD8FF'));
  return S.g(o, `translate(${f(x)} ${f(y)}) scale(${f(s)})`);
}

// ---------------------------------------------------------------- portal tunnel: squares rushing outward
function portalTunnel(t, k = 1) {
  let o = R(0, 0, 1920, 1080, 0, { fill: '#1A0B3A' });
  const cols = ['#FF5A5A', '#FFB000', '#FFE14D', '#3BD16F', '#34C3FF', '#B06BFF', '#FF6FB5'];
  for (let i = 0; i < 14; i++) {
    const ph = (t * 1.6 + i / 14) % 1;
    const sz = 40 + Math.pow(ph, 2.2) * 2600;
    o += S.rect(960 - sz / 2, 540 - sz / 2, sz, sz, sz * 0.06, { fill: 'none', stroke: cols[i % 7], 'stroke-width': 10 + ph * 60, opacity: f(clamp(ph * 3, 0, 1) * k), transform: `rotate(${f(ph * 40 + i * 9)} 960 540)` });
  }
  for (let i = 0; i < 40; i++) {
    const ph = (t * 1.2 + hash(i)) % 1, a = hash(i * 7) * Math.PI * 2, r = ph * ph * 1300;
    const sz = 10 + 40 * ph;
    o += S.rect(960 + Math.cos(a) * r - sz / 2, 540 + Math.sin(a) * r - sz / 2, sz, sz, 4, { fill: cols[i % 7], opacity: f(ph) });
  }
  return o;
}

module.exports = { pinkMansion, horse, lakeDock, towerOfPain, monster, portalTunnel, heart };
