// SC 10 private helpers: the Central Bank of Robux interior (gold + dark teal, marble, vault doors, glowing coin pipes),
// obby obstacles, the Robux Printer, tiny intern sprites and the giant coin-and-calculator Thirty Percent Guy with glitch FX.
'use strict';

const K = require('./kit');
const { S, f, clamp, lerp, ease, seg, bump, hash, ol, ln, T, TF, coin, actor } = K;

const GOLD = '#FFC93C', GOLD2 = '#E0A21A', GOLD3 = '#B97A0E';
const TEAL0 = '#05191E', TEAL1 = '#0B2E35', TEAL2 = '#0F3D46', TEAL3 = '#1B5A63', TEAL4 = '#2A8A8A';
const MARBLE = '#E6F0EC', MARB2 = '#C5D8D3';

function coinTile(id) {
  const Wt = 300, Ht = 150;
  let o = '';
  for (let i = 0; i < 26; i++) {
    const x = hash(i * 3.1 + 7) * Wt, y = hash(i * 5.7 + 3) * Ht, r = 22 + hash(i * 1.3 + 2) * 12;
    for (const dx of [-Wt, 0, Wt]) for (const dy of [-Ht, 0, Ht]) {
      if (x + dx < -40 || x + dx > Wt + 40 || y + dy < -40 || y + dy > Ht + 40) continue;
      o += coin(x + dx, y + dy, r, hash(i) * 360, hash(i * 9) * 2);
    }
  }
  return `<pattern id="${id}" patternUnits="userSpaceOnUse" width="${Wt}" height="${Ht}"><rect width="${Wt}" height="${Ht}" fill="#C98A12"/>${o}</pattern>`;
}

const DEFS = `<defs>${coinTile('s10coins')}
<pattern id="s10wall" patternUnits="userSpaceOnUse" width="300" height="300"><rect width="300" height="300" fill="${TEAL1}"/>
<rect x="22" y="22" width="256" height="256" rx="14" fill="${TEAL2}" stroke="${TEAL3}" stroke-width="5"/>
<rect x="46" y="46" width="208" height="208" rx="8" fill="none" stroke="#0A3038" stroke-width="4"/>
<circle cx="150" cy="150" r="34" fill="none" stroke="#C9A23A" stroke-width="4" opacity="0.45"/><rect x="134" y="134" width="32" height="32" rx="6" fill="none" stroke="#C9A23A" stroke-width="4" opacity="0.45" transform="rotate(15 150 150)"/>
<rect x="0" y="0" width="300" height="6" fill="#071F25"/></pattern>
<pattern id="s10marble" patternUnits="userSpaceOnUse" width="400" height="200"><rect width="400" height="200" fill="${MARBLE}"/>
<path d="M0 60 Q80 40 140 90 T300 70 T400 110" fill="none" stroke="#B9CFCA" stroke-width="4"/><path d="M40 200 Q120 150 200 170 T400 140" fill="none" stroke="#CADBD7" stroke-width="3"/><path d="M220 0 Q240 40 300 50" fill="none" stroke="#B9CFCA" stroke-width="3"/></pattern>
<radialGradient id="s10glow" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#FFE98A" stop-opacity="0.7"/><stop offset="1" stop-color="#FFE98A" stop-opacity="0"/></radialGradient>
<radialGradient id="s10red" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#FF3B5C" stop-opacity="0.6"/><stop offset="1" stop-color="#FF3B5C" stop-opacity="0"/></radialGradient>
<radialGradient id="s10green" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#7CFF6B" stop-opacity="0.7"/><stop offset="1" stop-color="#7CFF6B" stop-opacity="0"/></radialGradient>
<linearGradient id="s10shaft" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFE98A" stop-opacity="0.35"/><stop offset="1" stop-color="#FFE98A" stop-opacity="0"/></linearGradient>
<linearGradient id="s10floor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0E3A42"/><stop offset="1" stop-color="#05191E"/></linearGradient>
<pattern id="s10paper" patternUnits="userSpaceOnUse" width="20" height="20"><rect width="20" height="20" fill="#FFFDF4"/><rect y="17" width="20" height="2" fill="#D7E4F2"/></pattern>
</defs>`;

// ---------------------------------------------------------------- architecture
const wall = (x0, y0, x1, y1) => S.rect(x0, y0, x1 - x0, y1 - y0, 0, { fill: 'url(#s10wall)' });
function pilaster(x, y0, y1, w = 100) {
  let o = S.rect(x - w / 2, y0, w, y1 - y0, 0, { fill: 'url(#s10marble)', stroke: '#151515', 'stroke-width': 6 });
  for (let i = 1; i < 4; i++) o += S.path(`M${f(x - w / 2 + (w * i) / 4)} ${y0 + 40} L${f(x - w / 2 + (w * i) / 4)} ${y1 - 40}`, ln(4, MARB2));
  o += S.rect(x - w / 2 - 18, y0, w + 36, 40, 8, ol(GOLD, 6)) + S.rect(x - w / 2 - 18, y1 - 40, w + 36, 40, 8, ol(GOLD, 6));
  return o;
}
function vaultDoor(x, y, r, t, spin = 0) {
  let o = S.circle(x, y, r * 1.08, ol('#0A2A30', 8)) + S.circle(x, y, r, ol('#C9A23A', 8)) + S.circle(x, y, r * 0.84, ol('#1D6A70', 6));
  for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; o += S.circle(x + Math.cos(a) * r * 0.92, y + Math.sin(a) * r * 0.92, r * 0.035, { fill: '#7A5A10' }); }
  let wheel = S.circle(0, 0, r * 0.18, ol(GOLD, 6));
  for (let i = 0; i < 3; i++) wheel += S.path(`M${f(-r * 0.5)} 0 L${f(r * 0.5)} 0`, { ...ln(r * 0.07, '#151515'), transform: `rotate(${i * 60})` }) + S.path(`M${f(-r * 0.5)} 0 L${f(r * 0.5)} 0`, { ...ln(r * 0.04, GOLD), transform: `rotate(${i * 60})` });
  for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; wheel += S.circle(Math.cos(a) * r * 0.5, Math.sin(a) * r * 0.5, r * 0.06, ol(GOLD, 4)); }
  o += S.g(wheel, `translate(${f(x)} ${f(y)}) rotate(${f(spin)})`);
  o += S.path(`M${f(x - r * 0.6)} ${f(y - r * 0.55)} Q${f(x - r * 0.2)} ${f(y - r * 0.85)} ${f(x + r * 0.3)} ${f(y - r * 0.78)}`, ln(r * 0.05, '#FFF1B0', 0.6));
  return o;
}
// glowing glass pipe with coins whooshing through it along a polyline
function coinPipe(pts, t, w = 64, speed = 600, seed = 1) {
  const d = 'M' + pts.map((p) => `${f(p[0])} ${f(p[1])}`).join(' L');
  let o = S.path(d, ln(w + 12, '#151515')) + S.path(d, ln(w, GOLD2)) + S.path(d, ln(w * 0.6, '#FFE98A')) + S.path(d, ln(w * 0.18, '#FFFFFF', 0.7));
  const lens = pts.slice(1).map((p, i) => Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]));
  const total = lens.reduce((a, b) => a + b, 0);
  const n = Math.max(2, Math.floor(total / 150));
  for (let i = 0; i < n; i++) {
    let s = ((t * speed + (i / n) * total + seed * 97) % total);
    let j = 0;
    while (j < lens.length - 1 && s > lens[j]) { s -= lens[j]; j++; }
    const u = clamp(s / lens[j], 0, 1);
    o += coin(lerp(pts[j][0], pts[j + 1][0], u), lerp(pts[j][1], pts[j + 1][1], u), w * 0.26, i * 40, t * 9 + i);
  }
  // brass joints
  for (const p of pts) o += S.rect(p[0] - w * 0.62, p[1] - w * 0.62, w * 1.24, w * 1.24, 12, ol(GOLD3, 6));
  return o;
}
// obby platform: marble block with gold trim
function platform(x, y, w, h = 56, col = MARBLE) {
  let o = S.rect(x, y + h - 6, w, 26, 6, { fill: '#000', opacity: 0.25 });
  o += S.rect(x, y, w, h, 10, { fill: col === MARBLE ? 'url(#s10marble)' : col, stroke: '#151515', 'stroke-width': 6 });
  o += S.rect(x, y, w, 16, 8, ol(GOLD, 5)) + S.rect(x + 10, y + 3, w - 20, 5, 3, { fill: '#FFF1B0' });
  return o;
}
function floorBand(x0, x1, y, h = 400) {
  return S.rect(x0, y, x1 - x0, h, 0, { fill: 'url(#s10marble)' }) + S.rect(x0, y, x1 - x0, 22, 0, { fill: GOLD, stroke: '#151515', 'stroke-width': 5 }) + S.rect(x0, y + 22, x1 - x0, 30, 0, { fill: '#000', opacity: 0.12 });
}
// the generic bank backdrop: wall pattern, pilasters, vault doors, pipes; drawn in world coords
function backdrop(t, x0, x1, y0, y1, opts = {}) {
  const { pil = 700, vault = true, pipes = true, seed = 0 } = opts;
  let o = wall(x0, y0, x1, y1);
  const s0 = Math.floor(x0 / pil) * pil;
  for (let x = s0; x < x1 + pil; x += pil) {
    const i = Math.round(x / pil) + seed;
    o += pilaster(x, y0 - 50, y1 + 50, 90);
    if (vault && i % 2 === 0) o += vaultDoor(x + pil / 2, (y0 + y1) / 2 - 60, 170, t, t * 20 + i * 30);
    else if (pipes) o += coinPipe([[x + pil / 2 - 120, y1 + 100], [x + pil / 2 - 120, (y0 + y1) / 2], [x + pil / 2 + 120, (y0 + y1) / 2 - 120], [x + pil / 2 + 120, y0 - 100]], t, 44, 500, i);
  }
  return o;
}
function lightShafts(x0, x1, y0, y1, t, n = 4) {
  let o = '';
  for (let i = 0; i < n; i++) {
    const x = lerp(x0, x1, (i + 0.5) / n) + Math.sin(t * 0.7 + i) * 20;
    o += S.path(`M${f(x - 60)} ${y0} L${f(x + 60)} ${y0} L${f(x + 260)} ${y1} L${f(x - 260)} ${y1} Z`, { fill: 'url(#s10shaft)', opacity: 0.6 });
  }
  return o;
}

// ---------------------------------------------------------------- obstacles
function fmtR(v) {
  if (v >= 1e6) return (v / 1e6).toFixed(v >= 1e7 ? 0 : 1) + 'M';
  if (v >= 1e4) return Math.round(v / 1000) + 'K';
  return Math.round(v).toLocaleString('en-US');
}
// price-tag floor tile; hot 0..1 turns it red; label = number string
function priceTile(x, y, w, label, hot = 0, drop = 0, t = 0) {
  const col = hot > 0.5 ? '#FF5A6E' : '#FFE14D';
  const dy = drop * drop * 900, rr = drop * 25;
  let o = S.path(`M0 0 L${w - 60} 0 L${w} 40 L${w - 60} 80 L0 80 Z`, ol(col, 7)) + S.circle(w - 52, 40, 12, ol('#FFFFFF', 5));
  o += S.path(`M${w - 52} 28 Q${w - 40} -40 ${w - 10} -60`, ln(5, '#7A6A4A'));
  if (label !== null) o += K.robuxText((w - 60) / 2, 62, label, 50, '#2A1640');
  if (hot > 0) o += S.path(`M${w * 0.5 - 18} -14 L${w * 0.5} -40 L${w * 0.5 + 18} -14 Z`, { ...ol('#3BD16F', 4), opacity: f(hot) });
  return S.g(o, `translate(${f(x)} ${f(y + dy)}) rotate(${f(rr)} ${w / 2} 40)`);
}
function laser(x1, y1, x2, y2, k = 1, col = '#FF2D55') {
  if (k <= 0) return '';
  const d = `M${f(x1)} ${f(y1)} L${f(x2)} ${f(y2)}`;
  return S.path(d, ln(34, col, 0.18 * k)) + S.path(d, ln(14, col, 0.5 * k)) + S.path(d, ln(5, '#FFE0E6', k));
}
function scanner(x, y, aim, t, col = '#FF2D55') {
  let o = S.rect(-40, -60, 80, 40, 10, ol('#2A3A44', 5)) + S.path('M-70 -20 L70 -20 A70 70 0 0 1 -70 -20 Z', ol('#C9D1DC', 6));
  o += S.g(S.circle(0, 0, 26, ol('#1A1A22', 5)) + S.circle(0, 0, 13, { fill: col }) + S.circle(-5, -5, 4, { fill: '#FFF' }), `translate(${f(Math.cos(aim) * 18)} ${f(10 + Math.sin(aim) * 10)})`);
  o += S.circle(0, 10, 70, { fill: 'url(#s10red)', opacity: 0.5 + 0.3 * Math.sin(t * 10) });
  return S.g(o, `translate(${f(x)} ${f(y)})`);
}
// one bill (sheet of paper) with a heading
const BILLS = ['BILL', 'DUE', 'PAY NOW', 'LATE FEE', 'TAX', 'INVOICE', 'FEE', 'OVERDUE'];
function bill(x, y, s, rotd, i) {
  const head = BILLS[i % BILLS.length];
  let o = S.rect(-80, -100, 160, 200, 8, { fill: 'url(#s10paper)', stroke: '#151515', 'stroke-width': 6 });
  o += S.rect(-80, -100, 160, 46, 8, { fill: i % 3 === 0 ? '#FF5A6E' : i % 3 === 1 ? '#FFB000' : '#7A5CFF' });
  o += T(head, 0, -66, head.length > 5 ? 26 : 34, '#FFFFFF');
  o += S.path('M-56 -20 L56 -20 M-56 6 L40 6 M-56 32 L50 32', ln(6, '#9AA6B8'));
  o += K.robuxText(0, 84, String(99 + (i * 137) % 900), 30, '#E2233B');
  return S.g(o, `translate(${f(x)} ${f(y)}) rotate(${f(rotd)}) scale(${f(s)})`);
}
function conveyor(x, y, w, t, speed = 700) {
  let o = S.rect(x, y, w, 90, 45, ol('#2A2E3A', 8));
  const off = (t * speed) % 320;
  const id = S.uid('s10belt');
  let belt = S.rect(x, y, w, 90, 0, { fill: '#3A3F4F' });
  for (let xx = x - 320 - off + 320; xx < x + w + 320; xx += 320) belt += T('DEBT', xx, y + 66, 64, '#FF3B5C', { stroke: '#151515', 'stroke-width': 8, 'paint-order': 'stroke' });
  for (let xx = x - off + 2000; xx > x - 2000 + 0; xx -= 80) if (xx > x && xx < x + w) belt += S.path(`M${f(xx)} ${y + 6} L${f(xx - 20)} ${y + 18}`, ln(4, '#5A6070'));
  o += S.clipDef(id, S.rect(x + 8, y + 8, w - 16, 74, 37)) + S.g(belt, null, { 'clip-path': `url(#${id})` });
  for (let xx = x + 45; xx < x + w; xx += 140) o += S.g(S.circle(0, 0, 30, ol('#9AA0AE', 5)) + S.path('M-20 0 L20 0 M0 -20 L0 20', ln(5)), `translate(${f(xx)} ${y + 130}) rotate(${f(-t * speed * 0.6)})`);
  o += S.rect(x, y + 100, w, 60, 10, { fill: '#1A1E28', opacity: 0.6 });
  return o;
}
function vent(x, y, w, h, open, t, rattle = 0) {
  const sh = rattle * Math.sin(t * 60) * 5;
  let o = S.rect(x - 14, y - 14, w + 28, h + 28, 12, ol('#C9A23A', 6)) + S.rect(x, y, w, h, 6, { fill: '#020A0C' });
  if (open < 1) {
    const ang = open * 110, fly = open;
    let cover = S.rect(0, 0, w, h, 6, ol('#7A8A90', 6));
    for (let i = 1; i < 6; i++) cover += S.path(`M10 ${f((h * i) / 6)} L${w - 10} ${f((h * i) / 6)}`, ln(6, '#151515'));
    o += S.g(cover, `translate(${f(x + sh + fly * 260)} ${f(y - fly * 300 + fly * fly * 600)}) rotate(${f(ang)} ${w / 2} ${h / 2})`);
  }
  return o;
}

// ---------------------------------------------------------------- the tiny interns (cheap sprites)
function intern(x, y, s, t, o = {}) {
  const { ph = t * 14 + x * 0.01, talk = 0, flip = false, arm = 0, rot = 0, run = 1, eyes = 1 } = o;
  const sw = Math.sin(ph) * run;
  const lim = (x1, y1, x2, y2, c) => S.path(`M${f(x1)} ${f(y1)} L${f(x2)} ${f(y2)}`, ln(15, '#151515')) + S.path(`M${f(x1)} ${f(y1)} L${f(x2)} ${f(y2)}`, ln(8, c));
  let g = lim(-9, -40, -9 + sw * 14, -2, '#2B2F3A') + lim(9, -40, 9 - sw * 14, -2, '#2B2F3A');
  g += S.ellipse(-9 + sw * 14, 0, 11, 6, { fill: '#151515' }) + S.ellipse(9 - sw * 14, 0, 11, 6, { fill: '#151515' });
  g += lim(-20, -66, -30 - sw * 6, -44, '#2B2F3A');
  g += S.rect(-21, -74, 42, 38, 7, ol('#2B2F3A', 4)) + S.path('M-8 -74 L0 -60 L8 -74 Z', { fill: '#FFFFFF' }) + S.path('M-3 -66 L3 -66 L4 -48 L0 -44 L-4 -48 Z', { fill: '#3FD06B' });
  // head
  g += S.path('M-24 -104 L-46 -118 L-28 -90 Z M24 -104 L46 -118 L28 -90 Z', ol('#8DCB54', 4));
  g += S.rect(-26, -122, 52, 48, 11, ol('#8DCB54', 4));
  g += S.rect(-28, -126, 56, 12, 5, ol('#9AA0A8', 4)) + S.rect(-32, -116, 64, 6, 3, { fill: '#2F8C4A' });
  if (eyes) g += S.circle(-10, -100, 4.5, { fill: '#151515' }) + S.circle(10, -100, 4.5, { fill: '#151515' }) + S.path('M-17 -108 L-4 -104 M17 -108 L4 -104', ln(4, '#3E5A1E'));
  g += S.ellipse(0, -92, 5, 7, { fill: '#6FAE3C', stroke: '#151515', 'stroke-width': 2.5 });
  g += talk > 0.1 ? S.ellipse(0, -81, 7, 3 + 5 * talk, { fill: '#5A1020', stroke: '#151515', 'stroke-width': 3 }) : S.path('M-7 -82 Q2 -78 8 -84', ln(3.5));
  // calculator arm
  g += lim(20, -66, 34, -56 - arm * 30, '#2B2F3A');
  g += S.g(S.rect(-10, -14, 20, 26, 4, ol('#3A3F55', 3)) + S.rect(-7, -11, 14, 7, 2, { fill: '#BFF5B0' }), `translate(36 ${f(-62 - arm * 30)})`);
  return S.g(g, `translate(${f(x)} ${f(y)}) rotate(${f(rot)}) scale(${f(flip ? -s : s)} ${f(s)})`);
}

// ---------------------------------------------------------------- the Robux Printer
function gear(x, y, r, a, col = GOLD) {
  let o = '';
  for (let i = 0; i < 10; i++) o += S.rect(-r * 0.16, -r * 1.18, r * 0.32, r * 0.4, 4, { ...ol(col, 5), transform: `rotate(${i * 36})` });
  o += S.circle(0, 0, r, ol(col, 6)) + S.circle(0, 0, r * 0.35, ol(GOLD3, 5));
  return S.g(o, `translate(${f(x)} ${f(y)}) rotate(${f(a)})`);
}
function printer(t, power = 1, opts = {}) {
  const { gaugeVal = 1000, fountain = 22, chute = true } = opts;
  const jig = Math.sin(t * 47) * 3 * power, jy = Math.cos(t * 39) * 2 * power;
  let o = '';
  o += coinPipe([[-500, -360], [-860, -360], [-860, -1600]], t, 70, 700, 2) + coinPipe([[500, -460], [860, -460], [860, -1600]], t, 70, 700, 5);
  o += coinPipe([[-300, -900], [-300, -1600]], t, 50, 900, 7);
  o += S.rect(-640, -60, 1280, 60, 12, ol(GOLD, 8)) + S.rect(-600, -110, 1200, 60, 12, { fill: 'url(#s10marble)', stroke: '#151515', 'stroke-width': 7 });
  let b = '';
  // pistons (left)
  for (let i = 0; i < 2; i++) {
    const py = Math.sin(t * 9 + i * 2) * 50 * power;
    b += S.rect(-600 + i * 70, -640 + py, 50, 260, 8, ol('#C9D1DC', 6)) + S.rect(-610 + i * 70, -680 + py, 70, 50, 10, ol(GOLD, 6));
  }
  // main body
  b += S.rect(-480, -720, 960, 620, 50, ol(TEAL4, 10)) + S.rect(-480, -720, 960, 90, 50, { fill: '#3AA6A6', stroke: '#151515', 'stroke-width': 10 });
  b += S.rect(-470, -170, 940, 30, 0, { fill: '#1F6B6B' });
  for (let i = 0; i < 9; i++) b += S.circle(-430 + i * 107, -680, 10, ol(GOLD, 4));
  // screen with the printing R$
  b += S.rect(-400, -600, 400, 280, 26, ol('#06222A', 8));
  const flick = (Math.floor(t * 12) % 2) * 0.15;
  b += S.g(K.coin(0, 0, 90, 0, t * 6), 'translate(-200 -470)') + S.rect(-400, -600, 400, 280, 26, { fill: '#5CF2FF', opacity: 0.08 + flick });
  b += TF('PRINTING...', -200, -340, 34, '#7CF7FF');
  // gauge
  b += S.circle(170, -480, 120, ol('#F4F7F6', 8)) + S.path('M70 -480 A100 100 0 0 1 270 -480', ln(16, '#3BD16F')) + S.path('M220 -567 A100 100 0 0 1 270 -480', ln(16, '#FF3B5C'));
  const ga = Math.PI + clamp(gaugeVal / 1000, 0, 1.06) * Math.PI + Math.sin(t * 60) * 0.05 * power;
  b += S.path(`M170 -480 L${f(170 + Math.cos(ga) * 100)} ${f(-480 + Math.sin(ga) * 100)}`, ln(10, '#151515')) + S.circle(170, -480, 14, { fill: '#151515' });
  b += T(`${Math.round(gaugeVal)}%`, 170, -400, 44, '#E2233B');
  // gears
  b += gear(380, -250, 70, t * 120) + gear(270, -210, 44, -t * 190, GOLD2) + gear(-60, -210, 50, t * 150, GOLD2);
  // warning lights
  for (let i = 0; i < 4; i++) { const on = Math.floor(t * 4 + i) % 2; b += S.circle(-330 + i * 110, -760, 22, ol(on ? (i % 2 ? '#FF3B5C' : '#FFD21F') : '#5A3A3A', 5)); if (on) b += S.circle(-330 + i * 110, -760, 60, { fill: 'url(#s10red)' }); }
  // hopper + chimney
  b += S.path('M-260 -720 L-320 -900 L60 -900 L0 -720 Z', ol('#3AA6A6', 8)) + S.rect(-340, -930, 420, 40, 12, ol(GOLD, 6));
  b += S.rect(240, -1080, 130, 360, 14, ol('#2A8A8A', 8)) + S.rect(220, -1110, 170, 50, 14, ol(GOLD, 7));
  for (let i = 0; i < 4; i++) b += S.rect(240, -1040 + i * 80, 130, 14, 0, { fill: '#1F6B6B' });
  // sign
  b += S.rect(-360, -1010, 520, 100, 24, ol('#06222A', 8)) + T('ROBUX PRINTER', -100, -942, 58, GOLD, { stroke: '#151515', 'stroke-width': 8, 'paint-order': 'stroke' });
  // front chute
  if (chute) b += S.path('M-120 -150 L120 -150 L170 -60 L-170 -60 Z', ol(GOLD2, 7));
  o += S.g(b, `translate(${f(jig)} ${f(jy)})`);
  // the coin fountain from the chimney
  for (let i = 0; i < fountain; i++) {
    const per = 1.3, ph = ((t * (0.9 + 0.3 * power) + (i / fountain) * per) % per) / per;
    const vx = (hash(i * 3.3) - 0.5) * 900, vy = -1200 - hash(i * 1.7) * 500;
    o += coin(305 + jig + vx * ph, -1110 + vy * ph + 0.5 * 2600 * ph * ph, 24 + hash(i) * 10, i * 30, t * 8 + i);
  }
  o += S.circle(300, -1150, 260, { fill: 'url(#s10glow)', opacity: 0.6 });
  return o;
}

// ---------------------------------------------------------------- the boss: a giant Thirty Percent Guy made of coins + calculators
// chest calculator, body space (torso: x -100..100, y -533..-306)
function chestCalc(display = '30%', key = -1, col = '#BFF5B0') {
  let o = S.rect(-86, -524, 172, 210, 18, ol('#3A3F55', 6)) + S.rect(-72, -510, 144, 52, 8, ol(col, 4));
  o += T(display, 62, -470, display.length > 6 ? 30 : 40, '#1A3A1A', { 'text-anchor': 'end' });
  for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) {
    const i = r * 4 + c;
    o += S.rect(-70 + c * 36, -446 + r * 42 + (i === key ? 4 : 0), 30, 34, 6, ol(c === 3 ? '#FF8A3D' : i === key ? '#FFE14D' : '#D7DCE6', 3));
  }
  return o;
}
function coinMound(w = 280, h = 380, t = 0) {
  const d = `M${-w} 40 Q${-w * 0.95} ${-h * 0.75} 0 ${-h} Q${w * 0.95} ${-h * 0.75} ${w} 40 Z`;
  let o = S.path(d, { fill: 'url(#s10coins)', stroke: '#151515', 'stroke-width': 8 });
  for (let i = 0; i < 7; i++) { const u = (i + 0.5) / 7 * 2 - 1; o += coin(u * w * 0.85, -h * (1 - u * u * 0.8) + 20, 30, i * 40, t * 2 + i); }
  return o;
}
// pose: actor pose for 'thirty'; o: { display, key, mound, orbit, calcCol }
function boss(t, pose, o = {}) {
  const { display = '30%', key = -1, mound = true, orbit = 1, calcCol = '#BFF5B0' } = o;
  const props = [];
  // coin texture over the suit + the chest calculator
  props.push({ svg: S.rect(-100, -533, 200, 227, 16, { fill: 'url(#s10coins)', stroke: '#151515', 'stroke-width': 7, opacity: 0.95 }) + chestCalc(display, key, calcCol), layer: 'mid' });
  // orbiting calculators + coins
  if (orbit > 0) {
    let back = '', front = '';
    for (let i = 0; i < 8; i++) {
      const a = t * 1.4 + (i / 8) * Math.PI * 2;
      const x = Math.cos(a) * 330, y = -620 + Math.sin(a) * 90 + Math.sin(t * 3 + i) * 20;
      const art = i % 3 === 0 ? S.g(S.rect(-30, -40, 60, 80, 8, ol('#3A3F55', 5)) + S.rect(-22, -32, 44, 18, 3, { fill: '#BFF5B0' }) + TF('30%', 0, -18, 14, '#1A3A1A'), `translate(${f(x)} ${f(y)}) rotate(${f(a * 30)})`) : coin(x, y, 30, a * 50, t * 5 + i);
      if (Math.sin(a) > 0) front += art; else back += art;
    }
    props.push({ svg: S.g(back, null, { opacity: f(orbit) }), layer: 'back' }, { svg: S.g(front, null, { opacity: f(orbit) }), layer: 'top' });
  }
  if (mound) props.push({ svg: coinMound(260, 360, t), layer: 'top' });
  return actor('thirty', t, { shadow: false, ...pose, props: [...props, ...(pose.props || [])] });
}
// flat silhouette of the boss (for RGB-split ghosts) in screen space, matching boss() at pose x,y,s
function bossGhost(pose, col, dx, dy, op = 0.6) {
  const k = pose.s * 0.7;
  const arm = (side, a) => S.rect(-34, -10, 68, 270, 14, { fill: col, transform: `translate(${side * 100} -515) scale(${side} 1) rotate(${f(-a)})` });
  let g = S.rect(-100, -540, 200, 240, 16, { fill: col }) + S.rect(-150, -900, 300, 350, 46, { fill: col });
  g += S.path('M-140 -780 L-280 -880 L-150 -650 Z M140 -780 L280 -880 L150 -650 Z', { fill: col });
  g += arm(-1, pose.armL ?? 9) + arm(1, pose.armR ?? 9) + S.path('M-260 40 Q-250 -270 0 -360 Q250 -270 260 40 Z', { fill: col });
  return S.g(g, `translate(${f(pose.x + dx)} ${f(pose.y + dy)}) scale(${f(k)}) rotate(${f(pose.lean || 0)} 0 -306)`, { opacity: f(op) });
}
// pixel cracks + missing pixels over the boss (body space → screen via pose); k 0..1
function bossCrack(t, pose, k, seed = 1) {
  if (k <= 0) return '';
  const kk = pose.s * 0.7;
  let o = '';
  const cracks = [[-40, -760, -1], [60, -430, 1], [-120, -620, -1], [100, -840, 1], [0, -250, 1]];
  cracks.forEach(([x, y, d], i) => {
    const kc = clamp(k * 1.6 - i * 0.18, 0, 1);
    if (kc <= 0) return;
    let p = `M${x} ${y}`, cx = x, cy = y;
    for (let j = 0; j < 6 * kc; j++) { cx += d * (30 + hash(i * 7 + j) * 50); cy += (hash(i * 3 + j * 5) - 0.5) * 120; p += ` L${f(cx)} ${f(cy)}`; }
    o += S.path(p, ln(18, '#151515')) + S.path(p, ln(8, '#FFFFFF'));
  });
  // missing / glitching pixels
  const cell = 46;
  for (let gy = -900; gy < 0; gy += cell) for (let gx = -280; gx < 280; gx += cell) {
    const h = hash(gx * 0.13 + gy * 0.07 + seed);
    if (h > k * 0.55) continue;
    if (gy < -560 ? Math.abs(gx) > 150 : gy < -300 ? Math.abs(gx) > 110 : Math.abs(gx) > 250) continue;
    const on = Math.floor(t * 20 + h * 10) % 3;
    o += S.rect(gx, gy, cell - 2, cell - 2, 0, { fill: on === 0 ? '#05191E' : on === 1 ? '#FF2D55' : '#5CF2FF', opacity: on === 0 ? 0.95 : 0.7 });
  }
  return S.g(o, `translate(${f(pose.x)} ${f(pose.y)}) scale(${f(kk)})`);
}
// the burst: pixels flying out from (x, y); age seconds
function pixelBurst(x, y, age, n = 60, scale = 1, seed = 3) {
  if (age < 0) return '';
  const cols = ['#8DCB54', '#2B2F3A', '#FFC93C', '#9AA0A8', '#3FD06B', '#FFFFFF', '#5CF2FF', '#FF2D55'];
  let o = '';
  for (let i = 0; i < n; i++) {
    const a = hash(i + seed) * Math.PI * 2, v = (500 + 1300 * hash(i * 3 + seed)) * scale;
    const px = x + Math.cos(a) * v * age, py = y + Math.sin(a) * v * age * 0.8 + 900 * age * age;
    if (py > 1300) continue;
    const sz = (20 + 30 * hash(i * 5)) * scale * Math.max(0.2, 1 - age * 0.6);
    o += S.rect(px - sz / 2, py - sz / 2, sz, sz, 2, { fill: cols[i % cols.length], stroke: '#151515', 'stroke-width': 3, transform: `rotate(${f(age * 400 * (hash(i) - 0.5))} ${f(px)} ${f(py)})` });
  }
  return o;
}
// confetti falling from the top across the screen (screen space)
function confettiFall(t, t0, n = 60, seed = 4) {
  const k = t - t0;
  if (k < 0) return '';
  const cols = ['#FF5A5A', '#FFD21F', '#3BD16F', '#34C3FF', '#B06BFF', '#FF6FB5'];
  let o = '';
  for (let i = 0; i < n; i++) {
    const x = hash(i * 3.7 + seed) * 2000 - 40 + Math.sin(k * 3 + i) * 40;
    const y = -60 - hash(i * 1.3 + seed) * 700 + k * (260 + 160 * hash(i * 2.1));
    if (y < -60 || y > 1140) continue;
    o += S.rect(x, y, 16, 26, 4, { fill: cols[i % cols.length], transform: `rotate(${f(k * 300 + i * 40)} ${f(x + 8)} ${f(y + 13)})` });
  }
  return o;
}

module.exports = {
  DEFS, GOLD, GOLD2, GOLD3, TEAL0, TEAL1, TEAL2, TEAL3, TEAL4, MARBLE,
  wall, pilaster, vaultDoor, coinPipe, platform, floorBand, backdrop, lightShafts,
  fmtR, priceTile, laser, scanner, bill, conveyor, vent, intern, gear, printer, chestCalc, coinMound, boss, bossGhost, bossCrack, pixelBurst, confettiFall,
};
