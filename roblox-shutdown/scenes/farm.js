// Shared ROAD (SC 06) and SERVER FARM (SC 01, SC 07–SC 11) background sets.
//
// Conventions
// - World space = the 1920x1080 frame at the default camera ({zoom:1, x:0, y:0}).
// - Every set takes `t` (absolute seconds; only idle motion: LEDs, fans, cables, clouds) and an `opts` object.
// - Panning sets take a camera: `desertRoad(t, cam, opts)`, `rackHall`, `coolingRoom`, `cableJungle`, `lostAndFound`,
//   `archive`, `core`; the static sets accept `opts.cam`. They return a Layers object { bg, mid, fg } that is ALREADY
//   seen through that camera (every sub-layer has its own parallax inside). Compose a frame like this:
//       const L = F.rackHall(t, cam, { alarm: 1 });
//       return L.bg + L.mid + K.view(cam, myCharacters, 1) + L.fg;
//   (`'' + L` or `${L}` also works: bg + mid + fg.) Characters on the floor use parallax k = 1.
// - Props (`van`, `truck`, `cow`, `gameBubble`, `worldMap`, `lostItem`, `slushie`, …) return a plain SVG string.
// - Static <defs> live in DEFS (ids prefixed `farm`); main.js includes them for every frame.
// - Floor lines / slots are exported in FLOOR, VAN, VANIN, GAS, DOOR, LIFT, JUNGLE, CORE (see the bottom of this file).
'use strict';

const K = require('./kit');
const { S, f, clamp, lerp, ease, seg, bump, hash, ol, ln, T, TF } = K;
const E = K.E;
const LINE = '#151515';

// ---------------------------------------------------------------- tiny helpers
const R = (x, y, w, h, r = 0, a = {}) => S.rect(x, y, w, h, r, a);
const P = (d, a = {}) => S.path(d, a);
const Ci = (x, y, r, a = {}) => S.circle(x, y, r, a);
const Ell = (x, y, rx, ry, a = {}) => S.ellipse(x, y, rx, ry, a);
const G = (inner, tf, extra) => (inner ? S.g(inner, tf, extra) : '');
const rp = (pts, r = 0) => S.roundedPath(pts, r);
const poly = (pts) => 'M' + pts.map((p) => `${f(p[0])} ${f(p[1])}`).join(' L') + ' Z';
const tf = (x, y, s = 1, rot = 0) => `translate(${f(x)} ${f(y)})${rot ? ` rotate(${f(rot)})` : ''}${s !== 1 ? ` scale(${f(s)})` : ''}`;
const op = (fill, o) => ({ fill, opacity: f(clamp(o, 0, 1)) });
const outT = (txt, x, y, size, fill, sw = 8, extra = {}) => T(txt, x, y, size, fill, { stroke: LINE, 'stroke-width': sw, 'paint-order': 'stroke', 'stroke-linejoin': 'round', ...extra });
const outTF = (txt, x, y, size, fill, sw = 6, extra = {}) => TF(txt, x, y, size, fill, { stroke: LINE, 'stroke-width': sw, 'paint-order': 'stroke', 'stroke-linejoin': 'round', ...extra });
const blink = (t, rate, ph = 0) => (Math.floor(t * rate + ph) % 2 === 0 ? 1 : 0);
const rnd = (i, s = 0) => hash(i * 12.9898 + s * 78.233);

function hex2(c) { const n = parseInt(c.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
// colour mix: mix('#ff0000', '#0000ff', 0.5)
function mix(a, b, k) {
  const A = hex2(a), B = hex2(b), u = clamp(k, 0, 1);
  return '#' + A.map((v, i) => Math.round(lerp(v, B[i], u)).toString(16).padStart(2, '0')).join('');
}

// ---------------------------------------------------------------- camera / layers
// visible world rectangle of a layer with parallax k
function vis(cam, k = 1) {
  cam = cam || {};
  const z = 1 + ((cam.zoom ?? 1) - 1) * k;
  const fx = cam.fx ?? 960, fy = cam.fy ?? 540, sx = cam.sx || 0, sy = cam.sy || 0;
  const x = (cam.x || 0) * k, y = (cam.y || 0) * k;
  return { x0: fx + x - (fx + sx) / z, x1: fx + x + (1920 - fx - sx) / z, y0: fy + y - (fy + sy) / z, y1: fy + y + (1080 - fy - sy) / z, z };
}
const V = (cam, svg, k) => (svg ? S.g(svg, E.camTf(cam || {}, k)) : '');
function layers(bg = '', mid = '', fg = '') {
  const o = { bg, mid, fg };
  Object.defineProperty(o, 'toString', { value() { return this.bg + this.mid + this.fg; }, enumerable: false });
  return o;
}
// infinite strip: fn(i, x) draws slot i at layer-x; the strip scrolls by dist*k (via a transform so patterns stay glued)
function strip(cam, k, dist, period, fn) {
  const v = vis(cam, k), off = dist * k;
  const i0 = Math.floor((v.x0 + off) / period) - 1, i1 = Math.ceil((v.x1 + off) / period) + 1;
  let o = '';
  for (let i = i0; i <= i1; i++) o += fn(i, i * period);
  return G(o, `translate(${f(-off)} 0)`);
}
// a rect that always covers the visible area of a layer between y0 and y1
function band(cam, k, y0, y1, a) { const v = vis(cam, k); return R(v.x0 - 300, y0, v.x1 - v.x0 + 600, y1 - y0, 0, a); }
function fullRect(cam, k, a) { const v = vis(cam, k); return R(v.x0 - 300, v.y0 - 300, v.x1 - v.x0 + 600, v.y1 - v.y0 + 600, 0, a); }

// ---------------------------------------------------------------- shared palette
const NAVY0 = '#060B1E', NAVY1 = '#0B1433', NAVY2 = '#13204A', NAVY3 = '#1C2D63', NAVY4 = '#2A3F82';
const CYAN = '#5CE1FF', CYAN2 = '#B5F6FF', BLUE = '#2E8BFF', GREEN = '#46F58C', RED = '#FF2E4D', AMBER = '#FFB238';

// ---------------------------------------------------------------- DEFS (static)
function ledTile(id, w, h, cols, rows, cw, ch, palette, seed, density) {
  let o = '';
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) for (let j = 0; j < 3; j++) {
    const v = rnd(r * 31 + c * 7 + j * 3, seed);
    if (v > density) continue;
    const x = c * cw + cw - 46 + j * 13, y = r * ch + ch / 2;
    const col = palette[Math.floor(rnd(r + c * 5 + j, seed + 1) * palette.length)];
    o += `<circle cx="${x}" cy="${f(y)}" r="9" fill="${col}" opacity="0.28"/><circle cx="${x}" cy="${f(y)}" r="4" fill="${col}"/><circle cx="${x - 1}" cy="${f(y - 1)}" r="1.6" fill="#FFFFFF"/>`;
  }
  return `<pattern id="${id}" patternUnits="userSpaceOnUse" width="${w}" height="${h}">${o}</pattern>`;
}
function wheelTile(id) {
  let o = '';
  const wh = (cx, cy, r, op0) => { let s = ''; for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; s += `<circle cx="${f(cx + Math.cos(a) * r)}" cy="${f(cy + Math.sin(a) * r)}" r="${f(r * 0.24 * (1 - i * 0.05))}" fill="#D8DEE8" opacity="${f(op0 * (1 - i * 0.1))}"/>`; } return s; };
  o += wh(50, 50, 30, 0.9) + wh(140, 120, 22, 0.7) + wh(30, 150, 16, 0.6) + wh(150, 30, 14, 0.5);
  return `<pattern id="${id}" patternUnits="userSpaceOnUse" width="190" height="190">${o}</pattern>`;
}
function bubbleTile(id, w, h, grey, small, kinds) {
  const n = kinds.length, r = h * 0.26;
  let o = '';
  kinds.forEach((k, i) => {
    const cx = (w / n) * (i + 0.5), cy = h * 0.88 - r - 3 - (i % 2) * h * 0.04;
    o += Ci(cx, cy, r + h * 0.07, { fill: grey ? '#8C95A6' : '#7CF7FF', 'fill-opacity': grey ? 0.06 : 0.16 });
    o += G(bubbleWorld(k, r, 0, grey) + Ci(0, 0, r, { fill: 'url(#farmBubble)', stroke: grey ? '#6A7080' : '#151515', 'stroke-width': small ? 2.5 : 4 }) + Ci(0, 0, r * 0.88, { fill: 'none', stroke: grey ? '#B4BBC8' : '#C9FBFF', 'stroke-width': small ? 1.5 : 3 }) + P(`M${f(-r * 0.62)} ${f(-r * 0.3)} Q${f(-r * 0.5)} ${f(-r * 0.7)} ${f(-r * 0.08)} ${f(-r * 0.78)}`, ln(small ? 2.5 : 5, '#FFFFFF', 0.85)) + (grey ? P(`M${f(r * 0.2)} ${f(-r)} L${f(r * 0.05)} ${f(-r * 0.45)} L${f(r * 0.35)} ${f(-r * 0.2)} L${f(r * 0.15)} ${f(r * 0.2)}`, ln(small ? 2 : 3.5, '#2A2F3A')) : ''), `translate(${f(cx)} ${f(cy)})`);
  });
  o += R(0, h * 0.88, w, h * 0.12, 0, { fill: grey ? '#2C313D' : '#3A2C5A' }) + R(0, h * 0.88, w, h * 0.03, 0, { fill: grey ? '#5A6070' : '#8E6BD8' }) + R(w * 0.08, h * 0.915, w * 0.16, h * 0.06, 2, { fill: grey ? '#6A7080' : '#FFE9B0' });
  return `<pattern id="${id}" patternUnits="userSpaceOnUse" width="${w}" height="${h}">${o}</pattern>`;
}
function junkTile(id) {
  // lost & found heap texture: a dense jumble of tiny lost items on a dark purple base
  const it = [
    (x, y, r) => `<g transform="translate(${x} ${y}) rotate(${r})"><rect x="-22" y="-26" width="44" height="30" rx="6" fill="#2A2A38"/><rect x="-30" y="0" width="60" height="9" rx="4" fill="#2A2A38"/><rect x="-22" y="-10" width="44" height="7" fill="#E8504A"/></g>`,
    (x, y, r) => `<g transform="translate(${x} ${y}) rotate(${r})"><path d="M-30 30 L30 -30" stroke="#C9D6E8" stroke-width="10" stroke-linecap="round"/><path d="M-34 22 L-22 34" stroke="#8A5A33" stroke-width="10" stroke-linecap="round"/></g>`,
    (x, y, r) => `<g transform="translate(${x} ${y}) rotate(${r})"><path d="M-30 10 Q0 -30 34 -10 Q12 -4 8 12 Q-10 4 -30 10 Z" fill="#FFFFFF" stroke="#BFD3E8" stroke-width="4"/></g>`,
    (x, y, r) => `<circle cx="${x}" cy="${y}" r="15" fill="#FFC93C" stroke="#D99A1A" stroke-width="4"/>`,
    (x, y, r) => `<g transform="translate(${x} ${y}) rotate(${r})"><rect x="-22" y="-16" width="44" height="32" rx="10" fill="#FF9F1C"/><rect x="-16" y="-24" width="10" height="12" rx="3" fill="#FF9F1C"/><rect x="6" y="-24" width="10" height="12" rx="3" fill="#FF9F1C"/><circle cx="-7" cy="-2" r="3.5" fill="#151515"/><circle cx="7" cy="-2" r="3.5" fill="#151515"/></g>`,
    (x, y, r) => `<g transform="translate(${x} ${y}) rotate(${r})"><path d="M-24 14 L-24 -12 L-12 2 L0 -18 L12 2 L24 -12 L24 14 Z" fill="#FFD84D" stroke="#D9A21A" stroke-width="4"/></g>`,
    (x, y, r) => `<g transform="translate(${x} ${y}) rotate(${r})"><rect x="-14" y="-20" width="28" height="38" rx="6" fill="#46D17A"/><rect x="-18" y="-26" width="36" height="10" rx="4" fill="#2E9C57"/></g>`,
    (x, y, r) => `<g transform="translate(${x} ${y}) rotate(${r})"><path d="M-30 0 L22 0" stroke="#9AA6B8" stroke-width="12" stroke-linecap="round"/><rect x="18" y="-12" width="22" height="24" rx="4" fill="#5A6478"/></g>`,
    (x, y, r) => `<g transform="translate(${x} ${y}) rotate(${r})"><path d="M-26 16 Q-6 -26 26 -6 Q6 0 4 20 Z" fill="#B06BFF" stroke="#7A3FD0" stroke-width="4"/></g>`,
    (x, y, r) => `<g transform="translate(${x} ${y}) rotate(${r})"><rect x="-30" y="-11" width="60" height="22" rx="10" fill="#5CB8FF"/><circle cx="-18" cy="0" r="6" fill="#FFFFFF"/></g>`,
    (x, y, r) => `<g transform="translate(${x} ${y}) rotate(${r})"><path d="M-22 -22 L22 -22 L20 6 Q12 24 0 30 Q-12 24 -20 6 Z" fill="#3B8BFF" stroke="#2A5ACC" stroke-width="4"/><path d="M0 -16 L0 22 M-14 -2 L14 -2" stroke="#FFD21F" stroke-width="5"/></g>`,
    (x, y, r) => `<ellipse cx="${x}" cy="${y}" rx="16" ry="21" fill="#FF6FB5" stroke="#C94A8A" stroke-width="4"/>`,
  ];
  let o = '<rect width="380" height="320" fill="#3A2E66"/>';
  for (let i = 0; i < 26; i++) {
    const x = Math.round(25 + rnd(i, 501) * 330), y = Math.round(25 + rnd(i, 502) * 270), r = Math.round((rnd(i, 503) - 0.5) * 120);
    o += it[i % it.length](x, y, r);
  }
  return `<pattern id="${id}" patternUnits="userSpaceOnUse" width="380" height="320">${o}</pattern>`;
}
function snackTile(id) {
  const c = ['#FF5A5A', '#FFD21F', '#3BD16F', '#34C3FF', '#B06BFF', '#FF9F1C', '#FF6FB5'];
  let o = `<rect width="300" height="120" fill="#F2E3C8"/>`;
  let x = 8;
  for (let i = 0; x < 290; i++) {
    const w = 26 + rnd(i, 4) * 26, h = 40 + rnd(i, 5) * 46, col = c[i % c.length];
    if (i % 3 === 2) o += `<path d="M${f(x)} 104 L${f(x)} ${f(104 - h + 10)} Q${f(x + w / 2)} ${f(104 - h - 6)} ${f(x + w)} ${f(104 - h + 10)} L${f(x + w)} 104 Z" fill="${col}" stroke="#151515" stroke-width="3"/>`;
    else o += `<rect x="${f(x)}" y="${f(104 - h)}" width="${f(w)}" height="${f(h)}" rx="4" fill="${col}" stroke="#151515" stroke-width="3"/><rect x="${f(x + 5)}" y="${f(110 - h)}" width="${f(w - 10)}" height="${f(h * 0.3)}" rx="3" fill="#FFFFFF" opacity="0.55"/>`;
    x += w + 6;
  }
  o += `<rect y="104" width="300" height="16" fill="#C98B4A"/><rect y="104" width="300" height="4" fill="#E8B37A"/>`;
  return `<pattern id="${id}" patternUnits="userSpaceOnUse" width="300" height="120">${o}</pattern>`;
}

const DEFS = `<defs>
<linearGradient id="farmSkyDawn" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2E2F7A"/><stop offset="0.38" stop-color="#8A4E9A"/><stop offset="0.66" stop-color="#F28A72"/><stop offset="1" stop-color="#FFD08A"/></linearGradient>
<linearGradient id="farmSkyDay" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2F8CFF"/><stop offset="0.55" stop-color="#7FCBFF"/><stop offset="1" stop-color="#FFF0CC"/></linearGradient>
<linearGradient id="farmSkySunset" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3A3B8F"/><stop offset="0.4" stop-color="#C8578A"/><stop offset="0.72" stop-color="#FF9A4D"/><stop offset="1" stop-color="#FFE08A"/></linearGradient>
<linearGradient id="farmSkyStorm" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3B4256"/><stop offset="0.5" stop-color="#7A8296"/><stop offset="1" stop-color="#E8D2B0"/></linearGradient>
<radialGradient id="farmSunGlow"><stop offset="0" stop-color="#FFF6C8" stop-opacity="0.95"/><stop offset="0.35" stop-color="#FFD27A" stop-opacity="0.5"/><stop offset="1" stop-color="#FFB25A" stop-opacity="0"/></radialGradient>
<radialGradient id="farmGlowWarm"><stop offset="0" stop-color="#FFF2B8" stop-opacity="0.9"/><stop offset="1" stop-color="#FFC85A" stop-opacity="0"/></radialGradient>
<radialGradient id="farmGlowBlue"><stop offset="0" stop-color="#7CF7FF" stop-opacity="0.75"/><stop offset="0.5" stop-color="#2E8BFF" stop-opacity="0.25"/><stop offset="1" stop-color="#2E8BFF" stop-opacity="0"/></radialGradient>
<radialGradient id="farmGlowRed"><stop offset="0" stop-color="#FF6A7A" stop-opacity="0.85"/><stop offset="0.45" stop-color="#FF2E4D" stop-opacity="0.3"/><stop offset="1" stop-color="#FF2E4D" stop-opacity="0"/></radialGradient>
<radialGradient id="farmGlowGreen"><stop offset="0" stop-color="#B8FFC8" stop-opacity="0.85"/><stop offset="0.45" stop-color="#46F58C" stop-opacity="0.3"/><stop offset="1" stop-color="#46F58C" stop-opacity="0"/></radialGradient>
<radialGradient id="farmGlowWhite"><stop offset="0" stop-color="#FFFFFF" stop-opacity="0.9"/><stop offset="1" stop-color="#FFFFFF" stop-opacity="0"/></radialGradient>
<radialGradient id="farmBubble" cx="0.42" cy="0.38" r="0.62"><stop offset="0" stop-color="#FFFFFF" stop-opacity="0.04"/><stop offset="0.75" stop-color="#9FF3FF" stop-opacity="0.12"/><stop offset="1" stop-color="#C9FBFF" stop-opacity="0.55"/></radialGradient>
<radialGradient id="farmBubbleGrey" cx="0.42" cy="0.38" r="0.62"><stop offset="0" stop-color="#FFFFFF" stop-opacity="0.02"/><stop offset="0.75" stop-color="#9AA2B2" stop-opacity="0.15"/><stop offset="1" stop-color="#C8CED8" stop-opacity="0.5"/></radialGradient>
<linearGradient id="farmConeDown" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFFFFF" stop-opacity="0.5"/><stop offset="1" stop-color="#FFFFFF" stop-opacity="0"/></linearGradient>
<linearGradient id="farmConeBlue" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9FF3FF" stop-opacity="0.45"/><stop offset="1" stop-color="#5CE1FF" stop-opacity="0"/></linearGradient>
<linearGradient id="farmConeRed" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#FF4D63" stop-opacity="0.55"/><stop offset="1" stop-color="#FF2E4D" stop-opacity="0"/></linearGradient>
<linearGradient id="farmConeGreen" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#7CFFAE" stop-opacity="0.5"/><stop offset="1" stop-color="#46F58C" stop-opacity="0"/></linearGradient>
<linearGradient id="farmBeamWarm" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#FFF6C8" stop-opacity="0.45"/><stop offset="1" stop-color="#FFF6C8" stop-opacity="0"/></linearGradient>
<linearGradient id="farmFadeDown" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#03060F" stop-opacity="0"/><stop offset="1" stop-color="#03060F" stop-opacity="0.95"/></linearGradient>
<linearGradient id="farmFadeUp" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#03060F" stop-opacity="0"/><stop offset="1" stop-color="#03060F" stop-opacity="0.95"/></linearGradient>
<linearGradient id="farmReflect" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5CE1FF" stop-opacity="0.32"/><stop offset="1" stop-color="#5CE1FF" stop-opacity="0"/></linearGradient>
<linearGradient id="farmReflectG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#46F58C" stop-opacity="0.4"/><stop offset="1" stop-color="#46F58C" stop-opacity="0"/></linearGradient>
<linearGradient id="farmReflectDark" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0A1028" stop-opacity="0.75"/><stop offset="1" stop-color="#0A1028" stop-opacity="0"/></linearGradient>
<linearGradient id="farmHall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#050916"/><stop offset="0.6" stop-color="#0E1A42"/><stop offset="1" stop-color="#16285C"/></linearGradient>
<linearGradient id="farmIceWall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5E8FC8"/><stop offset="0.6" stop-color="#9CCBF0"/><stop offset="1" stop-color="#D8F2FF"/></linearGradient>
<linearGradient id="farmIceFloor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#BFEFFF"/><stop offset="1" stop-color="#7FC4EC"/></linearGradient>
<linearGradient id="farmShaft" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#14245A"/><stop offset="0.55" stop-color="#0A1232"/><stop offset="1" stop-color="#050816"/></linearGradient>
<linearGradient id="farmCoreSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#020308"/><stop offset="0.55" stop-color="#0B0F26"/><stop offset="1" stop-color="#1A0E22"/></linearGradient>
<linearGradient id="farmGlass" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#E6F8FF"/><stop offset="0.55" stop-color="#A9DDF5"/><stop offset="1" stop-color="#78B4DC"/></linearGradient>
<linearGradient id="farmSteel" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#8E9AB0"/><stop offset="0.45" stop-color="#D5DCE8"/><stop offset="1" stop-color="#9AA6BC"/></linearGradient>
<linearGradient id="farmSteelV" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#C9D2E0"/><stop offset="1" stop-color="#7D889E"/></linearGradient>
<linearGradient id="farmChrome" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFFFFF"/><stop offset="0.5" stop-color="#C9D1DE"/><stop offset="1" stop-color="#8E99AC"/></linearGradient>
<linearGradient id="farmWood" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#B97A48"/><stop offset="1" stop-color="#8E5532"/></linearGradient>
<linearGradient id="farmScreen" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0B2A4A"/><stop offset="1" stop-color="#06162C"/></linearGradient>
<pattern id="farmStrata" patternUnits="userSpaceOnUse" width="400" height="150"><path d="M0 26 Q100 16 200 28 T400 26 L400 44 Q300 52 200 42 T0 44 Z" fill="#000" opacity="0.10"/><path d="M0 86 Q100 78 200 90 T400 86 L400 96 Q300 101 200 98 T0 96 Z" fill="#FFF" opacity="0.16"/><path d="M0 118 Q100 112 200 122 T400 118 L400 134 Q300 140 200 132 T0 134 Z" fill="#000" opacity="0.07"/></pattern>
<pattern id="farmSandRip" patternUnits="userSpaceOnUse" width="260" height="90"><path d="M20 30 q24 -10 48 0 M150 70 q24 -10 48 0 M200 18 q16 -7 32 0 M60 78 q16 -7 32 0" fill="none" stroke="#7A3A1A" stroke-opacity="0.13" stroke-width="5" stroke-linecap="round"/><circle cx="120" cy="40" r="3" fill="#7A3A1A" opacity="0.15"/><circle cx="240" cy="60" r="2.5" fill="#7A3A1A" opacity="0.15"/></pattern>
<pattern id="farmAsphalt" patternUnits="userSpaceOnUse" width="180" height="70"><circle cx="20" cy="14" r="2.5" fill="#FFF" opacity="0.10"/><circle cx="90" cy="50" r="2" fill="#FFF" opacity="0.10"/><circle cx="150" cy="22" r="3" fill="#000" opacity="0.12"/><circle cx="60" cy="40" r="2" fill="#000" opacity="0.12"/><circle cx="130" cy="62" r="2" fill="#FFF" opacity="0.08"/></pattern>
<pattern id="farmLowRes" patternUnits="userSpaceOnUse" width="240" height="240"><rect x="0" y="0" width="58" height="58" rx="4" fill="#8A93A6" opacity="0.85"/><rect x="60" y="0" width="58" height="58" rx="4" fill="#A2AABB" opacity="0.6"/><rect x="180" y="0" width="58" height="58" rx="4" fill="#6E7689" opacity="0.8"/><rect x="0" y="60" width="58" height="58" rx="4" fill="#B5BCCA" opacity="0.55"/><rect x="120" y="60" width="58" height="58" rx="4" fill="#8A93A6" opacity="0.9"/><rect x="60" y="120" width="58" height="58" rx="4" fill="#6E7689" opacity="0.75"/><rect x="180" y="120" width="58" height="58" rx="4" fill="#A2AABB" opacity="0.7"/><rect x="0" y="180" width="58" height="58" rx="4" fill="#9AA2B2" opacity="0.65"/><rect x="120" y="180" width="58" height="58" rx="4" fill="#7A8296" opacity="0.85"/><rect x="180" y="180" width="58" height="58" rx="4" fill="#B5BCCA" opacity="0.5"/></pattern>
<pattern id="farmRack" patternUnits="userSpaceOnUse" width="160" height="36"><rect width="160" height="36" fill="#121A3A"/><rect x="5" y="3" width="150" height="30" rx="4" fill="#22305E"/><rect x="5" y="3" width="150" height="6" rx="3" fill="#2E3F78"/><rect x="12" y="11" width="56" height="15" rx="3" fill="#141D40"/><path d="M18 13 v11 M25 13 v11 M32 13 v11 M39 13 v11 M46 13 v11 M53 13 v11 M60 13 v11" stroke="#34457E" stroke-width="3"/><rect x="74" y="13" width="26" height="11" rx="2" fill="#0D1430"/><circle cx="114" cy="18" r="4" fill="#0D1430"/><circle cx="127" cy="18" r="4" fill="#0D1430"/><circle cx="140" cy="18" r="4" fill="#0D1430"/></pattern>
<pattern id="farmBlade" patternUnits="userSpaceOnUse" width="160" height="72"><rect width="160" height="72" fill="#121A3A"/><rect x="4" y="4" width="152" height="64" rx="4" fill="#1C2850"/><rect x="10" y="10" width="12" height="54" rx="3" fill="#2E3F78"/><rect x="26" y="10" width="12" height="54" rx="3" fill="#2E3F78"/><rect x="42" y="10" width="12" height="54" rx="3" fill="#2E3F78"/><rect x="58" y="10" width="12" height="54" rx="3" fill="#2E3F78"/><rect x="74" y="10" width="12" height="54" rx="3" fill="#2E3F78"/><rect x="90" y="10" width="12" height="54" rx="3" fill="#2E3F78"/><rect x="106" y="10" width="12" height="54" rx="3" fill="#2E3F78"/><rect x="122" y="10" width="12" height="54" rx="3" fill="#2E3F78"/><rect x="138" y="10" width="12" height="54" rx="3" fill="#2E3F78"/></pattern>
<pattern id="farmLedBlade" patternUnits="userSpaceOnUse" width="480" height="144"><circle cx="16" cy="18" r="3.5" fill="#5CE1FF"/><circle cx="48" cy="18" r="3.5" fill="#46F58C"/><circle cx="96" cy="18" r="3.5" fill="#5CE1FF"/><circle cx="128" cy="18" r="3.5" fill="#2E8BFF"/><circle cx="192" cy="90" r="3.5" fill="#5CE1FF"/><circle cx="240" cy="90" r="3.5" fill="#B5F6FF"/><circle cx="288" cy="18" r="3.5" fill="#46F58C"/><circle cx="352" cy="90" r="3.5" fill="#5CE1FF"/><circle cx="400" cy="18" r="3.5" fill="#2E8BFF"/><circle cx="448" cy="90" r="3.5" fill="#5CE1FF"/><circle cx="64" cy="90" r="3.5" fill="#5CE1FF"/><circle cx="112" cy="90" r="3.5" fill="#46F58C"/></pattern>
<pattern id="farmReflTile" patternUnits="userSpaceOnUse" width="210" height="400"><rect x="6" y="0" width="168" height="240" fill="url(#farmReflect)"/><rect x="20" y="0" width="20" height="140" fill="#FFFFFF" fill-opacity="0.05"/></pattern>
<linearGradient id="farmCyl" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#000" stop-opacity="0.7"/><stop offset="0.25" stop-color="#000" stop-opacity="0.15"/><stop offset="0.4" stop-color="#FFF" stop-opacity="0.06"/><stop offset="0.7" stop-color="#000" stop-opacity="0.2"/><stop offset="1" stop-color="#000" stop-opacity="0.75"/></linearGradient>
<linearGradient id="farmHeapShade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFFFFF" stop-opacity="0.1"/><stop offset="0.45" stop-color="#1A1440" stop-opacity="0"/><stop offset="1" stop-color="#1A1440" stop-opacity="0.6"/></linearGradient>
<pattern id="farmBoxes" patternUnits="userSpaceOnUse" width="175" height="160"><rect width="175" height="160" fill="#241E54"/><rect x="12" y="20" width="150" height="112" rx="8" fill="#7A5A44" stroke="#120E30" stroke-width="4"/><rect x="12" y="20" width="150" height="16" rx="6" fill="#8E6A50"/><rect x="40" y="52" width="94" height="34" rx="4" fill="#E9D8B8"/><rect x="0" y="134" width="175" height="18" fill="#3A3270"/><rect x="0" y="134" width="175" height="5" fill="#5A4A9A"/></pattern>
<pattern id="farmRackFar" patternUnits="userSpaceOnUse" width="70" height="24"><rect width="70" height="24" fill="#0E1636"/><rect x="3" y="2" width="64" height="20" rx="3" fill="#18244E"/><circle cx="52" cy="12" r="2.6" fill="#5CE1FF"/><circle cx="60" cy="12" r="2.6" fill="#2E8BFF" opacity="0.7"/></pattern>
${ledTile('farmLedA', 480, 180, 3, 5, 160, 36, ['#5CE1FF', '#2E8BFF', '#7CF7FF', '#46F58C'], 3, 0.55)}
${ledTile('farmLedB', 480, 180, 3, 5, 160, 36, ['#5CE1FF', '#2E8BFF', '#B5F6FF'], 9, 0.5)}
${ledTile('farmLedGA', 480, 180, 3, 5, 160, 36, ['#46F58C', '#9CFF7A', '#C8FFD8'], 5, 0.85)}
${ledTile('farmLedGB', 480, 180, 3, 5, 160, 36, ['#46F58C', '#2FD86E'], 11, 0.8)}
${ledTile('farmLedR', 480, 180, 3, 5, 160, 36, ['#FF2E4D', '#FF7A5A'], 13, 0.45)}
<pattern id="farmFloorTile" patternUnits="userSpaceOnUse" width="240" height="60"><rect width="240" height="60" fill="none" stroke="#2A3F82" stroke-opacity="0.55" stroke-width="3"/></pattern>
<pattern id="farmGrate" patternUnits="userSpaceOnUse" width="36" height="20"><rect width="36" height="20" fill="#2A2E3E"/><rect x="3" y="3" width="30" height="5" rx="2" fill="#4A5068"/><rect x="3" y="12" width="30" height="5" rx="2" fill="#3A4058"/></pattern>
<pattern id="farmTruss" patternUnits="userSpaceOnUse" width="160" height="120"><path d="M0 0 L160 0 M0 120 L160 120 M0 0 L80 120 L160 0" fill="none" stroke="#2A3048" stroke-width="12"/><circle cx="80" cy="118" r="7" fill="#3A4260"/></pattern>
<pattern id="farmHazard" patternUnits="userSpaceOnUse" width="56" height="56" patternTransform="rotate(45)"><rect width="56" height="56" fill="#FFC21F"/><rect width="28" height="56" fill="#1D1D24"/></pattern>
<pattern id="farmPanel" patternUnits="userSpaceOnUse" width="200" height="120"><rect width="200" height="120" fill="none" stroke="#000" stroke-opacity="0.18" stroke-width="4"/><circle cx="12" cy="12" r="4" fill="#FFF" opacity="0.18"/><circle cx="188" cy="12" r="4" fill="#FFF" opacity="0.18"/><circle cx="12" cy="108" r="4" fill="#000" opacity="0.2"/><circle cx="188" cy="108" r="4" fill="#000" opacity="0.2"/></pattern>
<pattern id="farmWin" patternUnits="userSpaceOnUse" width="72" height="64"><rect x="12" y="12" width="48" height="36" rx="5" fill="#59D7FF"/><rect x="12" y="12" width="48" height="12" rx="5" fill="#B5F6FF"/><rect x="12" y="42" width="48" height="6" fill="#2E8BFF"/><rect x="18" y="28" width="10" height="16" fill="#1C4FA8" opacity="0.6"/><rect x="34" y="28" width="10" height="16" fill="#1C4FA8" opacity="0.6"/></pattern>
<pattern id="farmWinB" patternUnits="userSpaceOnUse" width="216" height="192"><rect x="12" y="12" width="48" height="36" rx="5" fill="#0E2450"/><rect x="156" y="76" width="48" height="36" rx="5" fill="#0E2450"/><rect x="84" y="140" width="48" height="36" rx="5" fill="#E8FDFF"/><rect x="156" y="12" width="48" height="36" rx="5" fill="#E8FDFF" opacity="0.7"/></pattern>
<pattern id="farmWinG" patternUnits="userSpaceOnUse" width="72" height="64"><rect x="12" y="12" width="48" height="36" rx="5" fill="#6BFFA0"/><rect x="12" y="12" width="48" height="12" rx="5" fill="#D8FFE4"/><rect x="12" y="42" width="48" height="6" fill="#22B860"/></pattern>
${wheelTile('farmWheels')}
<pattern id="farmBtn" patternUnits="userSpaceOnUse" width="20" height="28"><rect width="20" height="28" fill="#B9C2D0"/><rect x="5" y="3" width="10" height="3" rx="1.5" fill="#5A6478"/><circle cx="10" cy="17" r="7" fill="#E9EDF3" stroke="#5A6478" stroke-width="2"/><circle cx="9" cy="16" r="3" fill="#FFFFFF"/></pattern>
<pattern id="farmBtnBig" patternUnits="userSpaceOnUse" width="38" height="30"><rect width="38" height="30" fill="#2A3048"/><rect x="5" y="3" width="28" height="22" rx="7" fill="#3E4766" stroke="#11131C" stroke-width="2"/><rect x="9" y="6" width="20" height="7" rx="3" fill="#5A6690"/><circle cx="32" cy="27" r="1.6" fill="#7CF7FF" opacity="0.6"/></pattern>
<pattern id="farmBtnBigG" patternUnits="userSpaceOnUse" width="38" height="30"><rect width="38" height="30" fill="#1E3A2E"/><rect x="5" y="3" width="28" height="22" rx="7" fill="#2FD86E" stroke="#11131C" stroke-width="2"/><rect x="9" y="6" width="20" height="7" rx="3" fill="#B8FFC8"/></pattern>
${bubbleTile('farmShelf', 330, 200, false, false, ['island', 'obby', 'city'])}
${bubbleTile('farmShelfB', 330, 200, false, false, ['space', 'castle', 'pet'])}
${bubbleTile('farmShelfGrey', 330, 200, true, false, ['tycoon', 'race', 'farm'])}
${bubbleTile('farmShelfSm', 165, 100, false, true, ['castle', 'island', 'space'])}
${bubbleTile('farmShelfSmGrey', 165, 100, true, true, ['obby', 'city', 'pet'])}
${junkTile('farmJunk')}
${snackTile('farmSnacks')}
<pattern id="farmFrost" patternUnits="userSpaceOnUse" width="160" height="140"><path d="M20 20 l12 0 M26 14 l0 12 M21.5 15.5 l9 9 M30.5 15.5 l-9 9" stroke="#FFFFFF" stroke-width="2.5" opacity="0.8"/><path d="M110 70 l16 0 M118 62 l0 16 M112 64 l12 12 M124 64 l-12 12" stroke="#FFFFFF" stroke-width="3" opacity="0.7"/><circle cx="70" cy="110" r="4" fill="#FFFFFF" opacity="0.7"/><circle cx="140" cy="20" r="3" fill="#FFFFFF" opacity="0.6"/><circle cx="40" cy="80" r="2.5" fill="#FFFFFF" opacity="0.6"/></pattern>
<pattern id="farmIce" patternUnits="userSpaceOnUse" width="420" height="120"><path d="M20 30 L140 22 M200 80 L380 70 M60 100 L160 96" stroke="#FFFFFF" stroke-width="5" stroke-linecap="round" opacity="0.55"/><path d="M260 30 L330 26" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" opacity="0.5"/></pattern>
<pattern id="farmDotsA" patternUnits="userSpaceOnUse" width="46" height="38"><circle cx="10" cy="10" r="4.5" fill="#FF2E4D"/><circle cx="34" cy="28" r="3.5" fill="#FF5A6E"/></pattern>
<pattern id="farmDotsB" patternUnits="userSpaceOnUse" width="34" height="30"><circle cx="24" cy="8" r="3.5" fill="#FF2E4D"/><circle cx="8" cy="22" r="4" fill="#FF6A7A"/></pattern>
<pattern id="farmDotsC" patternUnits="userSpaceOnUse" width="22" height="20"><circle cx="6" cy="6" r="3" fill="#FF2E4D"/><circle cx="17" cy="15" r="2.5" fill="#FF8A96"/></pattern>
<pattern id="farmScan" patternUnits="userSpaceOnUse" width="8" height="8"><rect width="8" height="3" fill="#000" opacity="0.18"/></pattern>
<pattern id="farmCheck" patternUnits="userSpaceOnUse" width="120" height="120"><rect width="120" height="120" fill="#C9C1B4"/><rect width="60" height="60" fill="#E9E2D6"/><rect x="60" y="60" width="60" height="60" fill="#E9E2D6"/></pattern>
<pattern id="farmWoodPanel" patternUnits="userSpaceOnUse" width="90" height="300"><rect width="90" height="300" fill="#9A5E36"/><rect x="0" width="6" height="300" fill="#7A4628"/><path d="M30 0 Q40 80 28 160 T34 300 M64 0 Q56 100 68 200 T60 300" fill="none" stroke="#B5754A" stroke-width="4"/></pattern>
<pattern id="farmUphol" patternUnits="userSpaceOnUse" width="70" height="40"><rect width="70" height="40" fill="#C9874A"/><rect x="0" width="35" height="40" fill="#D9995A"/><rect x="33" width="4" height="40" fill="#9A5E30"/></pattern>
<pattern id="farmTiles" patternUnits="userSpaceOnUse" width="100" height="100"><rect width="100" height="100" fill="#2B3A6E"/><rect x="3" y="3" width="94" height="94" rx="8" fill="#33468A"/></pattern>
</defs>`;

// ================================================================ ROAD (SC 06)
// ---------------------------------------------------------------- Betsy the van
// Van-local space (s = 1): origin on the ground, midway between the wheels; the van is ~960 x 620 px.
// Side view faces RIGHT. Windows are see-through holes: whatever you pass is drawn behind the body.
//   opts.windows[i]  SVG for slot i, drawn with the slot's feet anchor at (0,0) — draw your actor with
//                    {x:0, y:0, s:VAN.slots[i].s} (front 3/4 turn reads best). Clipped to the cabin.
//   opts.inside      extra SVG in van-local coords, drawn inside the cabin (clipped)
//   opts.bounce 0..1 suspension bounce · opts.wheelSpin degrees · opts.lagK 0..1 rubber-band ghosting
//   opts.smoke 0..1 exhaust puffs · opts.lights 0..1 headlights · opts.flip face left · opts.front front view
//   opts.mop (default true) the mop on the roof · opts.dust 0..1 road dust behind the wheels
const VAN = {
  wheels: [-285, 290], wheelR: 80, wheelY: -80,
  slots: [
    { name: 'driver', win: { x: 190, y: -535, w: 172, h: 185 }, x: 270, y: -168, s: 0.36 },
    { name: 'middle', win: { x: -95, y: -535, w: 240, h: 185 }, x: 25, y: -168, s: 0.36 },
    { name: 'rear', win: { x: -440, y: -535, w: 315, h: 185 }, x: -282, y: -168, s: 0.36 },
  ],
  frontSlots: [
    { name: 'driver', win: { x: 16, y: -560, w: 276, h: 175 }, x: 150, y: -200, s: 0.36 },
    { name: 'passenger', win: { x: -292, y: -560, w: 276, h: 175 }, x: -150, y: -200, s: 0.36 },
  ],
};
const VC = { teal: '#4FB2A6', tealSh: '#3B8F86', tealHi: '#7CD6CA', cream: '#F7E8C6', creamSh: '#E6D0A2', orange: '#F08A3C', brown: '#B9582C', chrome: '#DCE2EA', tire: '#2B2A33', int: '#2C3150', glass: '#BDEBFF' };
const VAN_BODY = [[-472, -140, 22], [-472, -560, 50], [296, -560, 46], [392, -394, 30], [476, -372, 30], [482, -140, 22]];
const VAN_UPPER = [[-472, -336, 0], [-472, -560, 50], [296, -560, 46], [392, -394, 30], [476, -372, 30], [479, -336, 0]];
const VAN_WIN = [
  [[190, -535], [281, -535], [362, -395], [362, -350], [190, -350]],
  [[-95, -535], [145, -535], [145, -350], [-95, -350]],
  [[-440, -535], [-125, -535], [-125, -350], [-440, -350]],
];
function vanWheel(x, y, r, spin, odd) {
  let o = Ci(0, 0, r, ol(VC.tire, 7)) + Ci(0, 0, r * 0.78, { fill: 'none', stroke: '#3C3A46', 'stroke-width': 6 });
  o += Ci(0, 0, r * 0.5, ol(odd ? '#F4F1EA' : VC.chrome, 5));
  if (odd) o += Ci(0, 0, r * 0.38, { fill: 'none', stroke: '#E8504A', 'stroke-width': 5 });
  let b = '';
  for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI * 2; b += Ci(Math.cos(a) * r * 0.3, Math.sin(a) * r * 0.3, r * 0.06, { fill: '#7A8090' }); }
  b += Ci(0, 0, r * 0.12, ol('#9AA3B2', 3)) + P(`M${f(-r * 0.36)} ${f(-r * 0.12)} Q${f(-r * 0.2)} ${f(-r * 0.4)} ${f(r * 0.1)} ${f(-r * 0.42)}`, ln(5, '#FFFFFF', 0.7));
  o += G(b, `rotate(${f(spin)})`);
  return G(o, `translate(${f(x)} ${f(y)})`);
}
// keep text readable when the van is flipped
const unflip = (svg, cx, cy, flip) => (flip ? G(svg, `translate(${f(cx)} ${f(cy)}) scale(-1 1) translate(${f(-cx)} ${f(-cy)})`) : svg);
function patch(x, y, w, h, rot, col) {
  let o = R(0, 0, w, h, 8, ol(col, 5)) + R(6, 6, w - 12, h - 12, 5, { fill: 'none', stroke: '#151515', 'stroke-width': 2.5, 'stroke-dasharray': '7 6', opacity: 0.55 });
  o += Ci(7, 7, 3.5, { fill: '#5A5560' }) + Ci(w - 7, 7, 3.5, { fill: '#5A5560' }) + Ci(7, h - 7, 3.5, { fill: '#5A5560' }) + Ci(w - 7, h - 7, 3.5, { fill: '#5A5560' });
  return G(o, `translate(${f(x)} ${f(y)}) rotate(${f(rot)})`);
}
function mopStrings(x, y, t, n, len, sway, dir = -1) {
  let o = '', o2 = '';
  for (let i = 0; i < n; i++) {
    const x0 = x + i * 8 * dir, sw = Math.sin(t * 5 + i * 0.9) * sway;
    const d = `M${f(x0)} ${f(y)} Q${f(x0 + dir * 8 + sw * 0.5)} ${f(y + len * 0.5)} ${f(x0 + dir * 4 + sw)} ${f(y + len * (0.85 + 0.15 * rnd(i, 3)))}`;
    o += P(d, ln(14, LINE));
    o2 += P(d, ln(8, i % 3 === 1 ? '#D9D2C2' : '#EEE8DC'));
  }
  return o + o2;
}
function vanSide(t, o) {
  const { windows = [], inside = '', bounce = 0, wheelSpin = 0, lagK = 0, smoke = 0, lights = 0, flip = false, mop = true, dust = 0 } = o;
  const by = -bounce * (5 + 5 * Math.sin(t * 17)) - bounce * 3 * Math.sin(t * 7.3);
  const pitch = bounce * 0.7 * Math.sin(t * 9.1);
  let out = Ell(0, 0, 500, 24, { fill: '#000', opacity: 0.22 });
  // dust + exhaust (behind)
  if (dust > 0) for (let i = 0; i < 7; i++) {
    const a = (t * 1.6 + i / 7) % 1;
    out += Ci(-560 - a * 420 + rnd(i) * 60, -30 - a * 90 - rnd(i, 2) * 40, (24 + a * 70) * (0.7 + 0.5 * rnd(i, 4)), op('#E9C79A', dust * 0.55 * (1 - a)));
  }
  if (smoke > 0) for (let i = 0; i < 5; i++) {
    const a = (t * 1.3 + i / 5) % 1;
    out += Ci(-505 - a * 260, -150 - a * 70 + Math.sin(t * 3 + i) * 8, 14 + a * 42, op('#ECE6DC', smoke * 0.6 * (1 - a)));
  }
  // rubber-band ghosts (flat silhouettes)
  if (lagK > 0) {
    const dx = lagK * 80 * (0.6 + 0.4 * Math.sin(t * 23));
    const silD = rp(VAN_BODY, 0);
    out += P(silD, { fill: '#2EE6FF', opacity: f(0.45 * lagK), transform: `translate(${f(-dx * 1.4)} ${f(by)})` });
    out += P(silD, { fill: '#FF2E63', opacity: f(0.38 * lagK), transform: `translate(${f(-dx * 0.6)} ${f(by - 6)})` });
    for (const wx of VAN.wheels) out += Ci(wx - dx * 1.4, -80, 80, op('#2EE6FF', 0.35 * lagK)) + Ci(wx - dx * 0.6, -80, 80, op('#FF2E63', 0.3 * lagK));
  }
  let b = '';
  // cabin interior + seats + occupants (clipped)
  const cid = S.uid('farmVan');
  let cab = R(-466, -552, 940, 420, 30, { fill: VC.int });
  cab += R(-460, -552, 930, 60, 20, { fill: '#3A4066' });
  for (const sl of VAN.slots) cab += R(sl.x - 70, -400, 140, 260, 30, { fill: '#5A3A30' }) + R(sl.x - 60, -392, 120, 20, 10, { fill: '#7A5040' });
  windows.forEach((w, i) => { if (w && VAN.slots[i]) cab += G(w, `translate(${VAN.slots[i].x} ${VAN.slots[i].y})`); });
  cab += inside;
  b += S.clipDef(cid, R(-466, -552, 940, 420, 30)) + G(cab, null, { 'clip-path': `url(#${cid})` });
  // body (window holes via evenodd)
  const holes = VAN_WIN.map((w) => rp(w, 16)).join(' ');
  b += P(rp(VAN_BODY) + ' ' + holes, { fill: VC.teal, 'fill-rule': 'evenodd' });
  b += P(rp(VAN_UPPER) + ' ' + holes, { fill: VC.cream, 'fill-rule': 'evenodd' });
  // shading: lower band, roof highlight
  b += R(-470, -205, 950, 64, 0, { fill: '#1E4A50', opacity: 0.22 }) + R(-430, -552, 700, 12, 6, { fill: '#FFFFFF', opacity: 0.45 });
  b += R(-470, -560, 26, 420, 12, { fill: '#000', opacity: 0.08 });
  // beltline stripes
  b += R(-472, -346, 952, 15, 0, { fill: VC.orange }) + R(-472, -331, 952, 10, 0, { fill: VC.brown });
  // windscreen sliver
  b += P(poly([[300, -553], [388, -401], [368, -401], [280, -553]]), { fill: VC.glass, stroke: LINE, 'stroke-width': 4 });
  // patches + rust + dent
  b += patch(-380, -300, 120, 84, -4, '#E8935B') + patch(30, -262, 96, 74, 6, '#AEB6C2');
  b += P('M-318 -168 q14 -18 30 -6 q10 10 26 2', ln(9, '#A35A2E', 0.75)) + P('M178 -170 q12 -14 28 -4', ln(8, '#A35A2E', 0.7));
  b += P('M-60 -300 q30 -20 60 0', ln(5, '#2B6E66', 0.6)) + P('M-56 -306 q26 -16 52 -2', ln(3, '#FFFFFF', 0.45));
  // door seams, handle, gas cap
  b += P('M180 -560 L180 -150 M-108 -548 L-108 -150 M160 -548 L160 -150', ln(4, '#2A5F5A', 0.75));
  b += R(318, -322, 46, 12, 6, ol(VC.chrome, 3)) + R(128, -318, 26, 10, 5, ol(VC.chrome, 3)) + Ci(-392, -390, 14, ol('#E5D0A2', 3));
  // Betsy script + bumper sticker
  b += unflip(G(outT('Betsy', 0, 0, 54, '#FFF3D6', 9), `translate(282 -222) rotate(-6) skewX(-14)`), 282, -240, flip);
  let st = R(-450, -272, 176, 52, 8, ol('#FFFFFF', 4)) + TF('I', -430, -237, 26, '#151515');
  st += P('M-406 -250 c-6 -9 -20 -4 -14 6 l14 13 l14 -13 c6 -10 -8 -15 -14 -6 Z', { fill: '#E8504A' }) + TF('MY MOP', -334, -237, 26, '#151515');
  b += unflip(st, -362, -246, flip);
  // window seals + glass glints (over the occupants)
  for (const w of VAN_WIN) {
    const [x0, y0] = w[0], x1 = w[1][0];
    b += P(rp(w, 16), { fill: VC.glass, opacity: 0.16 });
    b += P(`M${f(x0 + 24)} ${f(-372)} L${f(x0 + 70)} ${f(y0 + 14)} L${f(x0 + 100)} ${f(y0 + 14)} L${f(x0 + 54)} -372 Z`, { fill: '#FFFFFF', opacity: 0.32 });
    b += P(`M${f(Math.min(x1 - 30, x0 + 130))} -372 L${f(Math.min(x1 - 10, x0 + 160))} ${f(y0 + 40)}`, ln(8, '#FFFFFF', 0.25));
  }
  b += P(rp(VAN_BODY) + ' ' + holes, { fill: 'none', stroke: LINE, 'stroke-width': 8, 'stroke-linejoin': 'round' });
  b += P(rp(VAN_WIN[0], 16) + rp(VAN_WIN[1], 16) + rp(VAN_WIN[2], 16), { fill: 'none', stroke: '#30343E', 'stroke-width': 5 });
  // lights, bumpers, spare tyre, mirror, antenna
  b += R(-506, -440, 40, 164, 18, ol(VC.tire, 6)) + R(-500, -420, 10, 124, 5, { fill: '#4A4856' });
  b += R(-484, -268, 18, 66, 6, ol('#FF4A4A', 4)) + R(450, -214, 26, 22, 6, ol('#FFB238', 4));
  b += Ci(474, -298, 30, ol(VC.chrome, 6)) + Ci(478, -298, 18, ol(lights > 0 ? '#FFF6C8' : '#FFF0B8', 4));
  if (lights > 0) b += Ci(500, -298, 130, { fill: 'url(#farmGlowWarm)', opacity: f(lights) }) + P('M500 -312 L980 -372 L980 -214 L500 -284 Z', { fill: 'url(#farmBeamWarm)', opacity: f(lights) });
  b += R(436, -180, 76, 42, 16, ol(VC.chrome, 6)) + R(-512, -180, 80, 42, 16, ol(VC.chrome, 6)) + R(-500, -172, 40, 8, 4, { fill: '#FFFFFF', opacity: 0.8 });
  b += P('M378 -420 L404 -430', ln(7)) + R(398, -460, 30, 54, 9, ol(VC.chrome, 5));
  const asw = Math.sin(t * 6) * 10 * (0.4 + bounce);
  b += P(`M438 -372 Q${f(444 + asw * 0.4)} -470 ${f(450 + asw)} -580`, ln(5)) + Ci(450 + asw, -584, 8, ol('#FF5A5A', 3));
  // roof rack + mop
  if (mop) {
    b += R(-398, -584, 16, 28, 4, ol('#5A6070', 4)) + R(228, -584, 16, 28, 4, ol('#5A6070', 4));
    b += P('M-424 -590 L262 -590', ln(12)) + P('M-424 -590 L262 -590', ln(6, '#B9C2D0'));
    const ms = Math.sin(t * 4.5) * (6 + 14 * bounce);
    b += P('M-446 -612 L392 -606', ln(20)) + P('M-446 -612 L392 -606', ln(12, '#D59A5C')) + P('M-420 -616 L360 -611', ln(3, '#F2C08A'));
    b += Ci(394, -606, 10, ol('#E8504A', 4));
    for (const rx of [-380, -60, 236]) b += P(`M${rx - 8} -626 Q${rx} -598 ${rx + 10} -582 M${rx + 8} -626 Q${rx + 2} -600 ${rx - 6} -582`, ln(6, '#FFD21F'));
    b += R(-486, -632, 52, 42, 10, ol('#8E99AC', 5));
    b += mopStrings(-440, -600, t, 7, 120 + 10 * bounce, ms, -1);
  }
  out += G(b, `translate(0 ${f(by)}) rotate(${f(pitch)} 0 -300)`);
  // wheel arches + wheels (do not bounce)
  for (const [i, wx] of VAN.wheels.entries()) {
    out += P(`M${wx - 84} ${f(-140 + by)} A100 100 0 0 1 ${wx + 84} ${f(-140 + by)} Z`, { fill: '#1C1B24', stroke: LINE, 'stroke-width': 6 });
    out += vanWheel(wx, -80, 80, wheelSpin, i === 0);
  }
  return out;
}
const VAN_FRONT = [[-335, -135, 24], [-326, -470, 40], [-296, -592, 54], [296, -592, 54], [326, -470, 40], [335, -135, 24]];
const VAN_FRONT_UP = [[-331, -352, 0], [-326, -470, 40], [-296, -592, 54], [296, -592, 54], [326, -470, 40], [331, -352, 0]];
const VAN_PANES = [[[-280, -562], [-16, -562], [-16, -386], [-292, -386]], [[16, -562], [280, -562], [292, -386], [16, -386]]];
function vanFront(t, o) {
  const { windows = [], inside = '', bounce = 0, lagK = 0, lights = 0, mop = true } = o;
  const by = -bounce * (5 + 5 * Math.sin(t * 17));
  const roll = bounce * 1.2 * Math.sin(t * 6.3);
  let out = Ell(0, 0, 380, 26, { fill: '#000', opacity: 0.22 });
  if (lagK > 0) {
    const dx = lagK * 60 * (0.6 + 0.4 * Math.sin(t * 23));
    out += P(rp(VAN_FRONT), { fill: '#2EE6FF', opacity: f(0.45 * lagK), transform: `translate(${f(-dx)} ${f(by)})` }) + P(rp(VAN_FRONT), { fill: '#FF2E63', opacity: f(0.38 * lagK), transform: `translate(${f(dx)} ${f(by)})` });
  }
  out += R(-318, -122, 104, 122, 22, ol(VC.tire, 7)) + R(214, -122, 104, 122, 22, ol(VC.tire, 7));
  let b = '';
  const cid = S.uid('farmVanF');
  let cab = R(-300, -575, 600, 210, 20, { fill: VC.int }) + R(-290, -430, 250, 70, 20, { fill: '#5A3A30' }) + R(40, -430, 250, 70, 20, { fill: '#5A3A30' });
  windows.forEach((w, i) => { if (w && VAN.frontSlots[i]) cab += G(w, `translate(${VAN.frontSlots[i].x} ${VAN.frontSlots[i].y})`); });
  cab += inside;
  // fuzzy dice + mirror
  const sw = Math.sin(t * 3.1) * 12 * (0.3 + bounce);
  cab += R(-46, -566, 92, 24, 10, ol('#3A3F55', 4)) + P(`M-30 -544 L${f(sw * 0.6 - 38)} -500`, ln(3)) + G(R(-16, -16, 30, 30, 7, ol('#FF6FB5', 4)) + Ci(-4, -4, 3, { fill: '#151515' }) + Ci(6, 6, 3, { fill: '#151515' }), `translate(${f(sw * 0.7 - 52)} -486) rotate(${f(sw)})`) + G(R(-14, -14, 26, 26, 6, ol('#FFFFFF', 4)) + Ci(0, 0, 3, { fill: '#151515' }), `translate(${f(sw * 0.8 - 26)} -480) rotate(${f(-sw)})`);
  b += S.clipDef(cid, R(-300, -575, 600, 210, 20)) + G(cab, null, { 'clip-path': `url(#${cid})` });
  const holes = VAN_PANES.map((w) => rp(w, 22)).join(' ');
  b += P(rp(VAN_FRONT) + ' ' + holes, { fill: VC.teal, 'fill-rule': 'evenodd' }) + P(rp(VAN_FRONT_UP) + ' ' + holes, { fill: VC.cream, 'fill-rule': 'evenodd' });
  b += R(-331, -360, 662, 16, 0, { fill: VC.orange }) + R(-331, -344, 662, 10, 0, { fill: VC.brown });
  b += R(-320, -200, 640, 60, 0, { fill: '#1E4A50', opacity: 0.2 }) + R(-250, -584, 500, 12, 6, { fill: '#FFFFFF', opacity: 0.45 });
  for (const w of VAN_PANES) {
    const x0 = w[0][0];
    b += P(rp(w, 22), { fill: VC.glass, opacity: 0.16 }) + P(`M${f(x0 + 30)} -400 L${f(x0 + 90)} -548 L${f(x0 + 126)} -548 L${f(x0 + 66)} -400 Z`, { fill: '#FFFFFF', opacity: 0.3 });
  }
  b += P(rp(VAN_FRONT) + ' ' + holes, { fill: 'none', stroke: LINE, 'stroke-width': 8, 'stroke-linejoin': 'round' });
  b += P('M-280 -392 L-150 -404 M30 -392 L160 -404', ln(6, '#2A2A33'));
  // headlights, grille, signals, patch
  for (const sx of [-1, 1]) {
    b += Ci(sx * 232, -262, 52, ol(VC.chrome, 7)) + Ci(sx * 232, -262, 38, ol('#FFF4C8', 5)) + P(`M${sx * 232 - 20} -280 Q${sx * 232 - 6} -292 ${sx * 232 + 12} -288`, ln(6, '#FFFFFF', 0.9));
    b += R(sx * 232 - 26, -196, 52, 22, 8, ol('#FFB238', 4));
    if (lights > 0) b += Ci(sx * 232, -262, 150, { fill: 'url(#farmGlowWarm)', opacity: f(lights) });
  }
  b += R(-122, -306, 244, 98, 18, ol('#2B3140', 6));
  for (let i = 0; i < 4; i++) b += R(-108, -292 + i * 22, 216, 9, 4, { fill: VC.chrome });
  b += patch(-330, -226, 70, 40, -6, '#AEB6C2') + P('M296 -214 q10 -12 22 -2', ln(7, '#A35A2E', 0.75));
  b += R(-358, -182, 716, 48, 20, ol(VC.chrome, 7)) + R(-340, -176, 300, 8, 4, { fill: '#FFFFFF', opacity: 0.8 });
  b += R(-72, -176, 144, 40, 8, ol('#FFD84D', 4)) + T('BETSY', 0, -146, 30, '#2A2A33');
  b += R(-300, -174, 150, 32, 6, ol('#FFFFFF', 3)) + TF('I', -284, -150, 20, '#151515') + P('M-264 -164 c-5 -7 -16 -3 -11 5 l11 10 l11 -10 c5 -8 -6 -12 -11 -5 Z', { fill: '#E8504A' }) + TF('MY MOP', -206, -150, 20, '#151515');
  for (const sx of [-1, 1]) b += P(`M${sx * 318} -440 L${sx * 360} -446`, ln(7)) + R(sx * 372 - 22, -476, 44, 60, 10, ol(VC.chrome, 5));
  if (mop) {
    b += P('M-250 -608 L250 -608', ln(12)) + P('M-250 -608 L250 -608', ln(6, '#B9C2D0')) + R(-232, -606, 14, 18, 3, ol('#5A6070', 3)) + R(218, -606, 14, 18, 3, ol('#5A6070', 3));
    b += Ci(70, -628, 18, ol('#D59A5C', 6)) + Ci(70, -628, 8, { fill: '#B9783E' }) + P('M48 -642 Q70 -604 92 -642', ln(6, '#FFD21F'));
    const ms = Math.sin(t * 4.5) * (6 + 12 * bounce);
    b += mopStrings(60, -640, t, 5, -60, ms, 1);
  }
  out += G(b, `translate(0 ${f(by)}) rotate(${f(roll)} 0 -300)`);
  return out;
}
// van(x, y, s, t, opts) — (x, y) = ground point under the middle of the van
function van(x, y, s, t, opts = {}) {
  const inner = opts.front ? vanFront(t, opts) : vanSide(t, opts);
  return G(inner, `translate(${f(x)} ${f(y)}) scale(${f(opts.flip && !opts.front ? -s : s)} ${f(s)})`);
}

// ---------------------------------------------------------------- the rubber-banding truck (oncoming, faces LEFT)
// truck(x, y, s, t, { wheelSpin, ghost 0..1, col }) — (x, y) = ground point under the middle
function truck(x, y, s, t, opts = {}) {
  const { wheelSpin = 0, ghost = 0, col = '#3B7BE8' } = opts;
  let o = Ell(0, 0, 420, 20, { fill: '#000', opacity: 0.2 });
  if (ghost > 0) {
    const sil = R(-380, -420, 760, 320, 20, {});
    o += G(sil, `translate(${f(90 * ghost)} 0)`, { fill: '#2EE6FF', opacity: f(0.4 * ghost) }) + G(sil, `translate(${f(180 * ghost)} 0)`, { fill: '#FF2E63', opacity: f(0.3 * ghost) });
  }
  o += R(-370, -132, 740, 28, 6, ol('#2A2A33', 5));
  o += R(-110, -430, 490, 310, 18, ol('#F4F1EA', 7)) + R(-110, -230, 490, 34, 0, { fill: '#E8504A' }) + R(-104, -420, 478, 12, 6, { fill: '#FFFFFF' });
  o += T('SPEEDY', 135, -300, 74, '#E8504A', { stroke: LINE, 'stroke-width': 8, 'paint-order': 'stroke' }) + TF('FREIGHT CO.', 135, -256, 30, '#3A3F55');
  o += P(rp([[-392, -112], [-392, -250], [-340, -340], [-120, -340], [-120, -112]], 22), ol(col, 7));
  o += P(rp([[-362, -250], [-326, -312], [-222, -312], [-222, -250]], 10), ol(VC.glass, 5)) + P('M-340 -258 L-310 -304 L-292 -304 L-322 -258 Z', { fill: '#FFF', opacity: 0.6 });
  o += R(-400, -190, 40, 70, 10, ol('#C9D1DC', 5)) + Ci(-388, -214, 16, ol('#FFF4C8', 4)) + R(-206, -232, 44, 10, 5, ol('#DCE2EA', 3));
  o += R(-150, -460, 18, 130, 6, ol('#C9D1DC', 4));
  for (const wx of [-290, 140, 272]) {
    o += Ci(wx, -56, 56, ol('#2B2A33', 7)) + G(Ci(0, 0, 24, ol('#C9CED8', 4)) + P('M-16 0 L16 0 M0 -16 L0 16', ln(4, '#7A8090')), `translate(${wx} -56) rotate(${f(wheelSpin)})`);
  }
  return G(o, `translate(${f(x)} ${f(y)}) scale(${f(s)})`);
}

// ---------------------------------------------------------------- the loading cow
// cow(x, y, s, t, { load 0..1, moo 0..1, blink, flip }) — (x, y) = ground under the cow; ~500 x 420 px at s = 1.
// load: 0 = four blurry grey cubes → low-res mosaic → crisp cute blocky cow (1).
const COW = {
  body: [-170, -292, 336, 192], head: [118, -398, 156, 140], muzzle: [124, -318, 144, 72],
  legs: [[-150, -112], [-92, -112], [62, -112], [118, -112]],
};
function cowCol(x, y) {
  // colour of the crisp cow at a point (for the mosaic), or null outside
  const inR = (r, px, py) => px >= r[0] && px <= r[0] + r[2] && py >= r[1] && py <= r[1] + r[3];
  if (inR([150, -340, 22, 22], x, y) || inR([222, -340, 22, 22], x, y)) return '#151515';
  if (inR(COW.muzzle, x, y)) return '#FFB3C1';
  if (inR([140, -400, 60, 50], x, y)) return '#2A2A33';
  if (inR(COW.head, x, y)) return '#FBFBFB';
  if (inR([96, -360, 24, 26], x, y) || inR([272, -360, 24, 26], x, y)) return '#FF9FB0';
  if (inR([-110, -270, 100, 70], x, y) || inR([40, -250, 70, 60], x, y) || inR([-160, -200, 50, 50], x, y)) return '#2A2A33';
  if (inR(COW.body, x, y)) return '#FBFBFB';
  for (const [lx] of COW.legs) if (inR([lx, -112, 40, 112], x, y)) return y > -24 ? '#3A3036' : '#F0F0F0';
  if (inR([-206, -270, 24, 120], x, y)) return '#E9E9E9';
  return null;
}
function cowCrisp(t, o) {
  const { moo = 0, blink = 0 } = o;
  const tail = Math.sin(t * 2.4) * 14;
  let c = '';
  c += P(`M-166 -262 Q${f(-206 + tail * 0.3)} -230 ${f(-198 + tail)} -170`, ln(14)) + P(`M-166 -262 Q${f(-206 + tail * 0.3)} -230 ${f(-198 + tail)} -170`, ln(7, '#F0F0F0'));
  c += R(-214 + tail, -186, 30, 40, 12, ol('#2A2A33', 4));
  // far legs (darker) then body then near legs
  for (const [i, [lx]] of COW.legs.entries()) if (i % 2 === 1) c += R(lx, -120, 40, 120, 8, ol('#DADADA', 6)) + R(lx, -26, 40, 26, 6, ol('#3A3036', 5));
  c += R(-178, -300, 352, 204, 44, ol('#FBFBFB', 7));
  c += P(rp([[-112, -296], [-6, -296], [-14, -230], [-60, -206], [-110, -226]], 18), { fill: '#2A2A33' }) + P(rp([[40, -250], [108, -262], [116, -200], [56, -192]], 16), { fill: '#2A2A33' });
  c += P(rp([[-176, -200], [-120, -210], [-112, -150], [-176, -150]], 14), { fill: '#2A2A33' });
  c += R(-172, -294, 330, 16, 8, { fill: '#FFFFFF' }) + R(-170, -140, 336, 36, 18, { fill: '#000', opacity: 0.07 });
  c += R(-40, -122, 70, 30, 14, ol('#FFB3C1', 5));
  for (const [i, [lx]] of COW.legs.entries()) if (i % 2 === 0) c += R(lx, -118, 42, 118, 8, ol('#F6F6F6', 6)) + R(lx, -26, 42, 26, 6, ol('#3A3036', 5));
  // head (front-facing on the right end)
  let h = '';
  h += R(-58, -40, 34, 28, 10, ol('#FBFBFB', 5)) + R(-50, -32, 20, 14, 6, { fill: '#FF9FB0' }) + R(122, -40, 34, 28, 10, ol('#FBFBFB', 5)) + R(130, -32, 20, 14, 6, { fill: '#FF9FB0' });
  h += R(-12, -88, 22, 34, 8, ol('#FFF1C8', 5)) + R(90, -88, 22, 34, 8, ol('#FFF1C8', 5));
  h += R(-30, -64, 160, 144, 34, ol('#FBFBFB', 7)) + P(rp([[-26, -60], [30, -60], [36, -18], [-26, -8]], 16), { fill: '#2A2A33' });
  h += R(-26, -62, 120, 12, 6, { fill: '#FFFFFF' });
  const eyes = blink > 0.5 ? P('M10 -6 Q22 2 34 -6 M62 -6 Q74 2 86 -6', ln(6)) : Ci(22, -8, 13, { fill: '#151515' }) + Ci(74, -8, 13, { fill: '#151515' }) + Ci(17, -13, 5, { fill: '#FFF' }) + Ci(69, -13, 5, { fill: '#FFF' }) + Ci(26, -3, 2.5, { fill: '#FFF' }) + Ci(78, -3, 2.5, { fill: '#FFF' });
  h += eyes + Ell(4, 18, 12, 7, { fill: '#FF8FA8', opacity: 0.7 }) + Ell(94, 18, 12, 7, { fill: '#FF8FA8', opacity: 0.7 });
  h += R(-24, 14, 148, 70, 26, ol('#FFB3C1', 6)) + Ell(26, 40, 9, 12, { fill: '#B5576A' }) + Ell(74, 40, 9, 12, { fill: '#B5576A' });
  h += moo > 0.05 ? Ell(50, 68, 16, 4 + 10 * moo, { fill: '#7A2A3A', stroke: LINE, 'stroke-width': 4 }) : P('M36 66 Q50 74 64 66', ln(5));
  c += G(h, 'translate(148 -334)');
  // collar + bell
  c += P('M120 -262 Q170 -236 236 -262', ln(10, '#E8504A')) + P(rp([[160, -246], [190, -246], [198, -206], [152, -206]], 8), ol('#FFD21F', 5)) + Ci(175, -204, 5, { fill: '#151515' });
  return c;
}
function cow(x, y, s, t, opts = {}) {
  const { load = 1, flip = false } = opts;
  let o = Ell(0, 0, 230, 18, { fill: '#000', opacity: 0.18 * clamp(load * 2, 0.3, 1) });
  const jit = (Math.floor(t * 8) % 3) - 1;
  if (load < 0.25) {
    const cubes = [[-160, -290, 300, 180], [130, -396, 136, 126], [-130, -112, 72, 112], [72, -112, 72, 112]];
    for (const [i, [cx, cy, w, h]] of cubes.entries()) {
      const dx = jit * 3 * (i % 2 ? 1 : -1);
      o += R(cx - 22 + dx, cy - 22, w + 44, h + 44, 30, op('#9AA3B2', 0.16)) + R(cx - 11 + dx, cy - 11, w + 22, h + 22, 22, op('#9AA3B2', 0.28)) + R(cx + dx, cy, w, h, 16, op('#A9B1C0', 0.85));
    }
  } else if (load < 0.75) {
    const cell = load < 0.5 ? 52 : 26;
    const grey = load < 0.5 ? 0.55 : 0.1;
    for (let yy = -410; yy < 0; yy += cell) for (let xx = -220; xx < 300; xx += cell) {
      const c = cowCol(xx + cell / 2, yy + cell / 2);
      if (!c) continue;
      o += R(xx, yy, cell - 2, cell - 2, 3, { fill: mix(c, '#9AA3B2', grey) });
    }
  }
  if (load >= 0.75) {
    const k = clamp((load - 0.75) / 0.12, 0, 1);
    if (k < 1) for (let yy = -410; yy < 0; yy += 26) for (let xx = -220; xx < 300; xx += 26) {
      const c = cowCol(xx + 13, yy + 13);
      if (c && hash(xx * 0.3 + yy * 0.7) > k) o += R(xx, yy, 24, 24, 3, { fill: c, opacity: f(1 - k * 0.6) });
    }
    o += G(cowCrisp(t, opts), null, k < 1 ? { opacity: f(k) } : {});
    if (load > 0.86 && load < 1) o += K.F.sparkle(250, -420, 30 * bump(load, 0.86, 1)) + K.F.sparkle(-200, -320, 22 * bump(load, 0.88, 1));
  }
  if (load < 0.9) o += Ci(40, -500, 50, { fill: '#10131C', opacity: 0.7, stroke: '#E9EDF3', 'stroke-width': 4 }) + K.loadingWheel(40, -500, 30, t, '#E9EDF3', 8, 7);
  return G(o, `translate(${f(x)} ${f(y)}) scale(${f(flip ? -s : s)} ${f(s)})`);
}

// ---------------------------------------------------------------- desert pieces
// desert colours for time k (0 dawn … 1 day)
function desertCols(k) {
  return {
    mesa: mix('#B8708E', '#E3A882', k), mesaSh: mix('#94577A', '#CB8A66', k), mesaLn: mix('#7A4468', '#B07052', k),
    wall: mix('#C9624E', '#E2883F', k), wallHi: mix('#EE9070', '#F7B46A', k), wallSh: mix('#94404E', '#B9612E', k),
    rock: mix('#B4503E', '#D06A32', k), rockHi: mix('#E07A60', '#F09A52', k), rockSh: mix('#863848', '#A04E26', k),
    sand: mix('#E19A7C', '#F4C687', k), sandFar: mix('#D9907E', '#EDB98A', k), sandSh: mix('#C27866', '#DCA261', k),
    road: mix('#4C4558', '#5B5566', k), roadEdge: mix('#E8C8A8', '#F6E6C8', k),
    cactus: mix('#4B8C66', '#4DB35C', k), cactusSh: mix('#346A50', '#33884A', k), cactusHi: mix('#7AB88A', '#8FE07A', k),
    bush: mix('#8A8E78', '#9CB07A', k), haze: mix('#FFB89A', '#FFF1D2', k),
  };
}
function skyDesert(cam, time, t, opts = {}) {
  const { sunset = 0, storm = 0 } = opts;
  let o = fullRect(cam, 0, { fill: 'url(#farmSkyDawn)' });
  if (time > 0) o += fullRect(cam, 0, { fill: 'url(#farmSkyDay)', opacity: f(time) });
  if (sunset > 0) o += fullRect(cam, 0, { fill: 'url(#farmSkySunset)', opacity: f(sunset) });
  if (storm > 0) o += fullRect(cam, 0, { fill: 'url(#farmSkyStorm)', opacity: f(storm * 0.7) });
  // stars fade out at dawn
  const night = clamp(1 - time * 3, 0, 1) * (1 - sunset);
  if (night > 0) for (let i = 0; i < 22; i++) { const s = 4 + rnd(i) * 4; o += R(rnd(i, 1) * 2000 - 40, rnd(i, 2) * 300, s, s, 1, op('#FFF6E0', night * (0.4 + 0.5 * Math.abs(Math.sin(t * 1.7 + i))))); }
  // the sun (a soft blocky square, like the game's)
  const sx = opts.sunX ?? 1450, sy = opts.sunY ?? lerp(640, 170, ease.out(clamp(time, 0, 1))) + sunset * 420;
  const sz = 120, col = mix(mix('#FFB04A', '#FFE45C', time), '#FF9A3A', sunset);
  o += Ci(sx, sy, sz * 3.2, { fill: 'url(#farmSunGlow)', opacity: f(1 - storm * 0.6) });
  o += G(R(-sz / 2, -sz / 2, sz, sz, 26, { fill: col, stroke: mix(col, '#E07A1A', 0.5), 'stroke-width': 7 }) + R(-sz / 2 + 16, -sz / 2 + 16, 42, 20, 9, { fill: '#FFF8D8', opacity: 0.8 }), `translate(${f(sx)} ${f(sy)}) rotate(${f(Math.sin(t * 0.3) * 3)})`);
  return o;
}
function cloudShape(x, y, s, col, sh) {
  const b = R(0, 46, 330, 74, 37, { fill: col }) + R(48, 0, 136, 112, 48, { fill: col }) + R(150, 20, 124, 96, 44, { fill: col }) + R(-30, 66, 120, 54, 27, { fill: col });
  return G(b + R(-22, 104, 340, 16, 8, { fill: sh }), `translate(${f(x)} ${f(y)}) scale(${f(s)})`);
}
// grey low-res cloud that is still loading: k = loaded fraction 0..1
function lagCloud(x, y, s, k, t, seed) {
  let o = '';
  const cells = [[0, 1], [1, 0], [1, 1], [2, 0], [2, 1], [3, 1], [4, 1], [1, 2], [2, 2], [3, 2], [0, 2], [4, 2]];
  cells.forEach(([cx, cy], i) => {
    const on = hash(i * 3.1 + seed) < 0.35 + k * 0.65;
    if (!on) return;
    o += R(cx * 72, cy * 50, 68, 46, 4, { fill: hash(i + seed) > 0.5 ? '#B9C0CC' : '#9AA3B2', opacity: f(0.75 + 0.2 * hash(i * 7 + seed)) });
  });
  if (k < 0.97) o += K.loadingWheel(380, 70, 22, t + seed, '#E9EDF3', 8, 6);
  return G(o, `translate(${f(x)} ${f(y)}) scale(${f(s)})`);
}
function birdShape(x, y, s, ph, frozen) {
  const fl = frozen ? 0.6 : Math.sin(ph);
  let o = P(`M-6 -2 L-30 ${f(-4 - 20 * fl)} L-12 6 Z M6 -2 L30 ${f(-4 - 20 * fl)} L12 6 Z`, ol('#3A3044', 3)) + R(-13, -7, 26, 16, 6, ol('#3A3044', 3)) + P('M13 -2 L22 1 L13 4 Z', { fill: '#FFB000' });
  return G(o, `translate(${f(x)} ${f(y)}) scale(${f(s)})`);
}
function mesaShape(x, base, w, h, c, lw = 4) {
  const top = base - h;
  const pts = [[x, base + 40, 0], [x + w * 0.06, base - h * 0.3, 18], [x + w * 0.13, base - h * 0.86, 10], [x + w * 0.17, top, 8], [x + w * 0.8, top, 8], [x + w * 0.86, base - h * 0.82, 10], [x + w * 0.93, base - h * 0.3, 18], [x + w, base + 40, 0]];
  let o = P(rp(pts), { fill: c.mesa, stroke: c.mesaLn, 'stroke-width': lw });
  o += P(rp([[x + w * 0.06, base - h * 0.3], [x + w * 0.13, base - h * 0.86], [x + w * 0.17, top], [x + w * 0.3, top], [x + w * 0.24, base - h * 0.5], [x + w * 0.22, base + 40], [x + 6, base + 40]], 10), { fill: c.mesaSh, opacity: 0.6 });
  o += R(x + w * 0.2, top + 6, w * 0.56, 8, 4, { fill: '#FFFFFF', opacity: 0.22 });
  return o;
}
// big canyon formation (stepped cliff wall) at layer-x
function cliff(x, base, w, h, c, seed, lw = 5) {
  const r = (i) => rnd(i, seed);
  const s1 = h * (0.62 + r(1) * 0.2), s2 = h;
  const pts = [[x, base + 60, 0], [x + w * 0.03, base - s1 * 0.55, 14], [x + w * 0.08, base - s1, 10], [x + w * 0.3, base - s1, 10], [x + w * 0.34, base - s2, 10], [x + w * 0.66, base - s2, 10], [x + w * 0.7, base - s2 * (0.8 + r(2) * 0.1), 10], [x + w * 0.9, base - s2 * (0.78 + r(2) * 0.1), 10], [x + w * 0.96, base - s1 * 0.5, 14], [x + w, base + 60, 0]];
  const d = rp(pts);
  let o = P(d, ol(c.wall, lw)) + P(d, { fill: 'url(#farmStrata)' });
  // shadowed left faces
  o += P(rp([[x + w * 0.03, base - s1 * 0.55], [x + w * 0.08, base - s1], [x + w * 0.13, base - s1], [x + w * 0.1, base - s1 * 0.4], [x + w * 0.12, base + 60], [x + 4, base + 60]], 10), { fill: c.wallSh, opacity: 0.75 });
  o += P(rp([[x + w * 0.3, base - s1], [x + w * 0.34, base - s2], [x + w * 0.39, base - s2], [x + w * 0.36, base - s1 * 0.6], [x + w * 0.37, base + 60], [x + w * 0.31, base + 60]], 8), { fill: c.wallSh, opacity: 0.55 });
  // lit top ledges
  o += R(x + w * 0.09, base - s1 + 4, w * 0.2, 10, 5, { fill: c.wallHi }) + R(x + w * 0.35, base - s2 + 4, w * 0.3, 12, 6, { fill: c.wallHi });
  // cracks
  o += P(`M${f(x + w * 0.5)} ${f(base - s2 + 30)} l-14 60 l18 50 l-10 70 M${f(x + w * 0.8)} ${f(base - s2 * 0.7)} l12 50 l-14 40`, ln(4, c.wallSh, 0.8));
  return o;
}
function hoodoo(x, base, s, c) {
  let o = R(-50, -150, 100, 150, 24, ol(c.rock, 5)) + R(-38, -250, 76, 108, 22, ol(c.rock, 5)) + R(-30, -330, 60, 86, 20, ol(c.rock, 5)) + R(-62, -366, 124, 44, 16, ol(c.rockSh, 5));
  o += R(-50, -150, 30, 150, 14, { fill: c.rockSh, opacity: 0.5 }) + R(-56, -362, 100, 10, 5, { fill: c.rockHi });
  return G(o, `translate(${f(x)} ${f(base)}) scale(${f(s)})`);
}
function rockArch(x, base, s, c) {
  const d = 'M-260 40 L-250 -180 Q-240 -330 -60 -340 L80 -340 Q250 -330 260 -180 L270 40 Z M-140 40 L-140 -120 Q-130 -220 -20 -224 L40 -224 Q140 -220 146 -120 L150 40 Z';
  let o = P(d, { fill: c.rock, stroke: LINE, 'stroke-width': 5, 'fill-rule': 'evenodd' }) + P(d, { fill: 'url(#farmStrata)', 'fill-rule': 'evenodd' });
  o += P('M-250 -180 Q-240 -330 -60 -340 L-20 -340 Q-180 -320 -196 -170 L-200 40 L-256 40 Z', { fill: c.rockSh, opacity: 0.6 });
  o += P('M-60 -334 L80 -334', ln(10, c.rockHi));
  return G(o, `translate(${f(x)} ${f(base)}) scale(${f(s)})`);
}
function boulder(x, base, s, c) {
  const o = P(rp([[-90, 0], [-80, -60], [-30, -96], [40, -90], [88, -50], [96, 0]], 24), ol(c.rock, 5)) + P(rp([[-90, 0], [-80, -60], [-40, -88], [-46, -30], [-20, 0]], 16), { fill: c.rockSh, opacity: 0.55 }) + P('M-24 -84 L36 -80', ln(7, c.rockHi));
  return G(o, `translate(${f(x)} ${f(base)}) scale(${f(s)})`);
}
// saguaro cactus; flower = little pink bloom on top
function cactus(x, base, s, c, seed = 0, flower = false, sway = 0) {
  const h = 260 + rnd(seed) * 120;
  let o = '';
  const arm = (side, y, len, up) => {
    const ax = side * 26;
    return P(`M${ax} ${f(-y)} L${f(ax + side * len)} ${f(-y)} L${f(ax + side * len)} ${f(-y - up)}`, ln(52, LINE)) + P(`M${ax} ${f(-y)} L${f(ax + side * len)} ${f(-y)} L${f(ax + side * len)} ${f(-y - up)}`, ln(40, c.cactus));
  };
  o += arm(-1, h * 0.42, 48, 90 + rnd(seed, 2) * 50);
  if (rnd(seed, 3) > 0.25) o += arm(1, h * 0.58, 46, 70 + rnd(seed, 4) * 40);
  o += R(-30, -h, 60, h + 4, 30, ol(c.cactus, 6)) + R(-14, -h + 22, 8, h - 40, 4, { fill: c.cactusHi, opacity: 0.8 }) + R(8, -h + 26, 8, h - 44, 4, { fill: c.cactusSh, opacity: 0.6 });
  if (flower) o += G(Ci(0, 0, 16, ol('#FF6FB5', 4)) + Ci(0, 0, 6, { fill: '#FFE14D' }) + Ci(-16, 4, 10, ol('#FF8FC8', 3)) + Ci(16, 4, 10, ol('#FF8FC8', 3)), `translate(0 ${f(-h - 6)})`);
  return G(o, `translate(${f(x)} ${f(base)}) scale(${f(s)}) rotate(${f(sway)})`);
}
function sageBush(x, base, s, c) {
  const o = R(-60, -50, 70, 54, 24, ol(c.bush, 4)) + R(-16, -70, 76, 74, 28, ol(c.bush, 4)) + R(36, -44, 54, 48, 22, ol(c.bush, 4)) + R(-8, -62, 30, 10, 5, { fill: '#FFFFFF', opacity: 0.25 });
  return G(o, `translate(${f(x)} ${f(base)}) scale(${f(s)})`);
}
function pole(x, base, h) {
  return R(x - 9, base - h, 18, h + 4, 5, ol('#8A5A3A', 4)) + R(x - 56, base - h + 26, 112, 14, 5, ol('#8A5A3A', 4)) + Ci(x - 44, base - h + 20, 6, ol('#7CC8E0', 3)) + Ci(x + 44, base - h + 20, 6, ol('#7CC8E0', 3));
}
function roadSign(x, base, txt, sub, lag, t) {
  let o = R(x - 8, base - 230, 16, 234, 4, ol('#9AA3B2', 4)) + R(x + 60, base - 230, 16, 234, 4, ol('#9AA3B2', 4));
  o += R(x - 70, base - 330, 220, 120, 16, ol('#2F9E5A', 6)) + R(x - 60, base - 320, 200, 100, 12, { fill: 'none', stroke: '#FFFFFF', 'stroke-width': 4 });
  o += TF(txt, x + 40, base - 280, 30, '#FFFFFF') + TF(sub, x + 40, base - 240, 30, '#FFFFFF');
  if (lag > 0) o += K.pixelBlocks(x - 70, base - 330, 220, 120, t, lag, '#9AA3B2', 40, x);
  return o;
}
function tumbleweed(x, y, r, rot) {
  let o = Ci(0, 0, r, { fill: '#D9B47A', opacity: 0.55, stroke: '#7A5A30', 'stroke-width': 6 });
  o += P(`M${-r * 0.8} 0 Q0 ${-r * 1.1} ${r * 0.8} 0 Q0 ${r * 1.1} ${-r * 0.8} 0 M0 ${-r * 0.85} Q${r * 1.1} 0 0 ${r * 0.85} Q${-r * 1.1} 0 0 ${-r * 0.85}`, ln(4, '#8A6A3E'));
  o += P(`M${-r * 0.5} ${-r * 0.5} L${r * 0.5} ${r * 0.5} M${r * 0.55} ${-r * 0.45} L${-r * 0.45} ${r * 0.55}`, ln(3, '#A9844E'));
  return G(o, `translate(${f(x)} ${f(y)}) rotate(${f(rot)})`);
}
// dust puff helper for wheels/feet: (x, y) ground point, k strength 0..1
function roadDust(x, y, t, k = 1, dir = -1) {
  let o = '';
  for (let i = 0; i < 6; i++) {
    const a = (t * 1.8 + i / 6) % 1;
    o += Ci(x + dir * a * 300 + rnd(i) * 40, y - 20 - a * 70 - rnd(i, 3) * 30, (20 + a * 56) * (0.7 + 0.5 * rnd(i, 4)), op('#EAC9A0', k * 0.55 * (1 - a)));
  }
  return o;
}

// ---------------------------------------------------------------- desertRoad(t, cam, opts)
// Layers: bg = sky, clouds, birds, mesas (k .12), canyon walls (k .3), rocks (k .55), roadside poles/cacti (k .8)
//         mid = the road (k 1) + the rubber-banding truck; fg = near shoulder cacti/rocks/tufts (k 1.35)
// opts: time 0..1 (dawn → day), speed px/s (scroll), dist (px travelled; overrides speed*t), lag 0..1,
//       truck (true/false; default on when lag > .2), fg (false = no foreground), clouds (n), birds (n)
// Road lines (world y at k = 1): far lane ground ROAD.far = 845, centre dashes 885, near lane ground ROAD.near = 955.
const ROAD = { top: 780, far: 845, dash: 885, near: 955, bottom: 1000, shoulderFar: 772, landmarkPeriod: 3 * 640 };
function desertRoad(t, cam, opts = {}) {
  const { time = 0.6, speed = 0, lag = 0, fg = true, clouds = 5, birds = 4 } = opts;
  const dist = opts.dist ?? t * speed;
  const c = desertCols(time);
  let bg = '';
  bg += V(cam, skyDesert(cam, time, t, opts), 0);
  // clouds (some are low-res grey squares while lagging)
  let cl = '';
  for (let i = 0; i < clouds; i++) {
    const x = ((rnd(i, 7) * 2600 + t * (8 + i * 3) - dist * 0.03) % 2800 + 2800) % 2800 - 500, y = 90 + rnd(i, 8) * 230, s = 0.55 + rnd(i, 9) * 0.5;
    const lagged = lag > 0.15 && rnd(i, 10) < lag;
    if (lagged) {
      const k = ((t * 0.12 + rnd(i, 11)) % 1);
      cl += lagCloud(x, y, s, k, t, i);
    } else cl += cloudShape(x, y, s, mix('#FFE6E0', '#FFFFFF', time), mix('#F7B8B0', '#D6EEFF', time));
  }
  bg += V(cam, cl, 0.04);
  // birds (frozen mid-air while lagging)
  let bd = '';
  for (let i = 0; i < birds; i++) {
    const frozen = lag > 0.3 && rnd(i, 12) < lag + 0.2;
    const tt = frozen ? 3.3 + i : t;
    const x = ((rnd(i, 13) * 2200 + tt * 70 - dist * 0.08) % 2400 + 2400) % 2400 - 200, y = 200 + rnd(i, 14) * 200 + Math.sin(tt * 1.3 + i) * 14;
    bd += birdShape(x + (frozen ? Math.sin(t * 40) * 1.5 : 0), y, 0.9 + rnd(i) * 0.4, tt * 13 + i, frozen);
    if (frozen && i % 2 === 0) bd += K.loadingWheel(x + 44, y - 30, 12, t, '#FFFFFF', 8, 4);
  }
  bg += V(cam, bd, 0.1);
  // far mesas
  bg += V(cam, band(cam, 0.12, 690, 1400, { fill: c.sandFar }) + strip(cam, 0.12, dist, 1600, (i, x) => mesaShape(x + rnd(i) * 300, 700, 520 + rnd(i, 1) * 300, 90 + rnd(i, 2) * 120, c) + (rnd(i, 3) > 0.4 ? mesaShape(x + 900 + rnd(i, 4) * 200, 700, 300 + rnd(i, 5) * 200, 60 + rnd(i, 6) * 80, c) : '')), 0.12);
  // canyon walls
  bg += V(cam, band(cam, 0.3, 730, 1400, { fill: c.sandSh }) + strip(cam, 0.3, dist, 2400, (i, x) => cliff(x + rnd(i, 21) * 200, 742, 800 + rnd(i, 22) * 380, 260 + rnd(i, 23) * 180, c, i) + (rnd(i, 24) > 0.5 ? cliff(x + 1500 + rnd(i, 25) * 300, 742, 420 + rnd(i, 26) * 200, 170 + rnd(i, 27) * 110, c, i + 50) : '')), 0.3);
  if (lag > 0) bg += V(cam, strip(cam, 0.3, dist, 2400, (i, x) => (rnd(i, 28) < lag ? R(x + 300 + rnd(i, 29) * 900, 742 - 330 + rnd(i, 30) * 120, 240, 240, 0, { fill: 'url(#farmLowRes)', opacity: f(lag) }) : '')), 0.3);
  // rocks / hoodoos / arch
  bg += V(cam, band(cam, 0.55, 752, 1400, { fill: c.sand }) + band(cam, 0.55, 752, 1400, { fill: 'url(#farmSandRip)' }) + strip(cam, 0.55, dist, 1700, (i, x) => {
    const kind = Math.floor(rnd(i, 31) * 4);
    let o = '';
    if (kind === 0) o += rockArch(x + 400, 760, 0.8, c);
    else if (kind === 1) o += hoodoo(x + 300, 762, 0.9, c) + hoodoo(x + 420, 762, 0.65, c);
    else if (kind === 2) o += cliff(x + 200, 762, 420, 190, c, i + 90);
    o += boulder(x + 1100 + rnd(i, 32) * 300, 768, 0.7, c) + sageBush(x + 900, 768, 0.6, c);
    return o;
  }), 0.55);
  // roadside: poles + wires, cacti, signs
  const PP = 640;
  bg += V(cam, strip(cam, 0.8, dist, PP, (i, x) => {
    let o = '';
    const ph = Math.sin(t * 1.4 + i) * 2;
    o += P(`M${x} 528 Q${x + PP / 2} ${f(560 + ph)} ${x + PP} 528 M${x} 528 Q${x + PP / 2} ${f(575 + ph)} ${x + PP} 528`, ln(3, '#3A3044', 0.8));
    o += pole(x, 770, 250);
    if (i % 3 === 0) o += cactus(x + 330, 776, 0.62, c, i, true, Math.sin(t * 0.8 + i) * 1.2);
    else if (rnd(i, 41) > 0.35) o += cactus(x + 200 + rnd(i, 42) * 200, 776, 0.42 + rnd(i, 43) * 0.18, c, i + 7);
    if (i % 7 === 4) o += roadSign(x + 470, 776, 'SERVER FARM', '120 MI ▸', lag, t);
    o += sageBush(x + 540, 778, 0.45, c);
    return o;
  }), 0.8);
  if (lag > 0) bg += fullRect(null, 0, { fill: '#8A93A6', opacity: f(lag * 0.16) });
  // road
  let rd = band(cam, 1, ROAD.shoulderFar, ROAD.top, { fill: c.sand }) + band(cam, 1, ROAD.top, ROAD.bottom, { fill: c.road }) + band(cam, 1, ROAD.top, ROAD.bottom, { fill: 'url(#farmAsphalt)' });
  rd += band(cam, 1, ROAD.bottom, 1600, { fill: c.sand }) + band(cam, 1, ROAD.bottom, 1600, { fill: 'url(#farmSandRip)' });
  rd += band(cam, 1, ROAD.top - 4, ROAD.top + 4, { fill: c.sandSh }) + band(cam, 1, ROAD.top + 10, ROAD.top + 18, { fill: c.roadEdge, opacity: 0.9 });
  rd += band(cam, 1, ROAD.bottom - 18, ROAD.bottom - 10, { fill: c.roadEdge, opacity: 0.9 }) + band(cam, 1, ROAD.bottom, ROAD.bottom + 10, { fill: c.sandSh });
  rd += strip(cam, 1, dist, 280, (i, x) => R(x, ROAD.dash - 7, 150, 14, 7, { fill: '#FFD84D' }) + (i % 4 === 1 ? P(`M${x + 40} ${ROAD.top + 40} l60 8 l40 -6`, ln(4, '#2E2A36', 0.6)) : '') + (i % 5 === 3 ? R(x + 100, ROAD.near + 20, 90, 16, 6, { fill: '#000', opacity: 0.12 }) : ''));
  rd += strip(cam, 1, dist, 1900, (i, x) => (rnd(i, 51) > 0.4 ? tumbleweed(x + 300 + ((t * 120) % 600), ROAD.shoulderFar - 4 + Math.abs(Math.sin(t * 5 + i)) * -16, 26, t * 200) : ''));
  // the rubber-banding truck in the far lane (oncoming)
  const showTruck = opts.truck ?? lag > 0.2;
  if (showTruck) {
    const P0 = 9;
    const u = (t % P0) / P0;
    const rb = K.rubber(t % 1.7, 0.2, 0.9, 160, 3) * clamp(lag * 1.5, 0, 1);
    const tx = vis(cam, 1).x1 + 500 - u * 3600 + rb;
    rd += truck(tx, ROAD.far, 0.42, t, { wheelSpin: -t * 500, ghost: Math.abs(rb) > 1 ? 0.8 * lag : 0 });
  }
  let fgS = '';
  if (fg) {
    fgS = V(cam, strip(cam, 1.35, dist, 420, (i, x) => {
      let o = '';
      const y = 1050;
      o += P(`M${x} ${y} l12 -36 l8 30 l10 -44 l8 44 l12 -30 l6 36 Z`, ol(c.cactusSh, 4));
      if (rnd(i, 61) > 0.5) o += boulder(x + 200, y + 12, 0.55, c);
      if (i % 6 === 2) o += cactus(x + 260, 1110, 0.9, c, i + 3);
      return o;
    }), 1.35);
  }
  return layers(bg, rd, fgS);
}

// ---------------------------------------------------------------- the slushie machine
// slushie(x, y, s, t, { jerk 0..1, cup 0..1 }) — (x, y) = bottom centre; ~260 x 420 px at s = 1
function slushie(x, y, s, t, opts = {}) {
  const { jerk = 0, cup = 0.6 } = opts;
  const tt = jerk > 0 ? lerp(t, K.stutterT(t, 3), jerk) : t;
  let o = R(-130, -150, 260, 150, 18, ol('#E8504A', 7)) + R(-118, -138, 236, 40, 10, { fill: '#FFFFFF', opacity: 0.25 }) + T('SLUSH!', 0, -38, 52, '#FFFFFF', { stroke: LINE, 'stroke-width': 7, 'paint-order': 'stroke' });
  const tank = (cx, col, hi, ph) => {
    const lvl = 0.72 + Math.sin(tt * 1.2 + ph) * 0.03 + (jerk > 0 ? (hash(Math.floor(t * 3) + ph) - 0.5) * 0.08 * jerk : 0);
    let s2 = R(cx - 56, -400, 112, 250, 30, ol('#E6F6FF', 6)) + R(cx - 48, -392 + 234 * (1 - lvl), 96, 234 * lvl, 24, { fill: col });
    const a = tt * 220 + ph * 90;
    s2 += G(P('M-34 0 L34 0', ln(10, hi)) + P('M0 -34 L0 34', ln(10, hi, 0.6)), `translate(${cx} -280) rotate(${f(a)}) scale(1 0.35)`);
    s2 += R(cx - 40, -386, 16, 200, 8, { fill: '#FFFFFF', opacity: 0.45 });
    s2 += R(cx - 22, -170, 44, 26, 6, ol('#3A3F55', 4)) + R(cx - 10, -150, 20, 14, 4, ol('#3A3F55', 3));
    return s2;
  };
  o += tank(-62, '#4FB8FF', '#BDEBFF', 0) + tank(62, '#FF4D6D', '#FFC8D2', 1);
  o += R(-130, -430, 260, 40, 16, ol('#3A3F55', 6)) + Ci(-90, -410, 7, { fill: blink(t, 2) ? '#46F58C' : '#1E5A3A' });
  // cup under the left tap, filling in jerks
  if (cup > 0) {
    const fill = jerk > 0 ? Math.floor(((t * 0.4) % 1) * 4) / 4 : (t * 0.3) % 1;
    o += P('M-92 -10 L-32 -10 L-38 -86 L-86 -86 Z', ol('#FFFFFF', 5)) + P(`M-89 -14 L-35 -14 L-38 ${f(-14 - 66 * fill)} L-86 ${f(-14 - 66 * fill)} Z`, { fill: '#4FB8FF' });
    if (jerk === 0 || Math.floor(t * 3) % 2 === 0) o += R(-66, -144, 8, 58, 4, { fill: '#4FB8FF' });
  }
  return G(o, `translate(${f(x)} ${f(y)}) scale(${f(s)})`);
}

// ---------------------------------------------------------------- gasStation(t, opts) — wide exterior
// Layers (opts.cam for parallax): bg = sky/mesas/station, mid = '', fg = tumbleweed + sign post.
// Forecourt floor GAS.floor = 905 (characters / the van ground). Through the shop window the cashier stands at
// GAS.cashier {x, y, s} — pass him in opts.inside (world coords), he is drawn behind the counter.
// opts: time 0..1 (default .75), inside (svg), slushJerk 0..1, price ('2.99'), lag 0..1, openFlicker (default 1)
const GAS = { floor: 905, cashier: { x: 1330, y: 880, s: 0.3 }, door: { x: 1690, y: 905 }, pumps: [430, 760] };
function pump(x, base, t, col, num) {
  let o = R(x - 70, base - 20, 140, 24, 6, ol('#BFC6D2', 5));
  o += R(x - 56, base - 300, 112, 282, 22, ol(col, 6)) + R(x - 56, base - 300, 112, 56, 22, ol('#FFFFFF', 6)) + Ci(x, base - 330, 24, ol('#FFF4C8', 5));
  o += T(num, x, base - 258, 36, col) + R(x - 38, base - 230, 76, 48, 8, ol('#1A2A1A', 4)) + TF('$', x - 20, base - 196, 26, '#7CFF8A') + TF(String((Math.floor(t * 3) % 90) + 10), x + 12, base - 196, 24, '#7CFF8A');
  o += R(x - 40, base - 128, 80, 60, 10, { fill: '#FFFFFF', opacity: 0.25 }) + P(`M${x + 52} ${base - 160} Q${x + 100} ${base - 120} ${x + 84} ${base - 40}`, ln(9)) + R(x + 52, base - 176, 26, 50, 8, ol('#3A3F55', 4));
  return o;
}
function gasStation(t, opts = {}) {
  const { time = 0.75, inside = '', slushJerk = 0, price = '2.99', lag = 0, openFlicker = 1, cam = null } = opts;
  const c = desertCols(time);
  let bg = V(cam, skyDesert(cam, time, t, { sunX: 300, sunY: 220 }), 0);
  bg += V(cam, cloudShape(1200, 120, 0.7, '#FFFFFF', '#D6EEFF') + cloudShape(200, 260, 0.5, '#FFFFFF', '#D6EEFF'), 0.05);
  bg += V(cam, R(-600, 690, 3200, 800, 0, { fill: c.sandFar }) + mesaShape(-200, 700, 700, 160, c) + mesaShape(700, 700, 400, 90, c) + mesaShape(1500, 700, 800, 200, c), 0.15);
  bg += V(cam, R(-600, 740, 3200, 800, 0, { fill: c.sandSh }) + cliff(1300, 752, 1100, 240, c, 7) + cliff(-500, 752, 700, 170, c, 3), 0.35);
  // the station (k = 1)
  let s = R(-600, 770, 3200, 800, 0, { fill: c.sand }) + R(-600, 770, 3200, 800, 0, { fill: 'url(#farmSandRip)' });
  s += R(-200, 860, 2400, 120, 0, { fill: '#CFC6B8' }) + R(-200, 860, 2400, 10, 0, { fill: '#B5AB9C' });
  for (let x = -100; x < 2200; x += 220) s += P(`M${x} 870 L${x - 40} 980`, ln(3, '#B5AB9C'));
  s += R(-600, 980, 3200, 140, 0, { fill: c.road }) + R(-600, 980, 3200, 140, 0, { fill: 'url(#farmAsphalt)' }) + R(-600, 986, 3200, 8, 0, { fill: c.roadEdge });
  // shop building
  s += R(1040, 430, 800, 450, 10, ol('#F4D9A8', 7)) + R(1040, 430, 800, 450, 10, { fill: 'url(#farmPanel)' }) + R(1806, 438, 26, 436, 8, { fill: '#000', opacity: 0.08 });
  s += R(1020, 370, 840, 80, 14, ol('#E8504A', 7)) + R(1030, 378, 820, 14, 7, { fill: '#FFFFFF', opacity: 0.35 });
  s += outT('LAST STOP', 1440, 432, 58, '#FFE14D', 9) + R(1030, 450, 820, 26, 0, { fill: '#000', opacity: 0.1 });
  // shop window: interior, cashier slot, counter, slushie
  const wx = 1080, wy = 520, ww = 530, wh = 300;
  let win = R(wx, wy, ww, wh, 0, { fill: '#FFF2D0' }) + R(wx, wy + 40, ww, 140, 0, { fill: 'url(#farmSnacks)' });
  win += Ci(wx + 420, wy + 70, 28, ol('#FFFFFF', 4)) + P(`M${wx + 420} ${wy + 70} L${f(wx + 420 + 16 * Math.cos(K.stutterT(t, lag > 0 ? 1 : 8) * 2))} ${f(wy + 70 + 16 * Math.sin(K.stutterT(t, lag > 0 ? 1 : 8) * 2))}`, ln(4));
  win += inside;
  win += R(wx, wy + 200, ww, 110, 0, ol('#3BA7E0', 5)) + R(wx, wy + 196, ww, 14, 0, ol('#2E86B8', 4));
  win += R(wx + 70, wy + 150, 90, 52, 8, ol('#3A3F55', 5)) + R(wx + 82, wy + 160, 66, 18, 4, { fill: '#7CFF8A' });
  win += slushie(wx + 450, wy + 198, 0.42, t, { jerk: slushJerk, cup: 0 });
  const cid = S.uid('farmGasW');
  s += S.clipDef(cid, R(wx, wy, ww, wh)) + G(win, null, { 'clip-path': `url(#${cid})` });
  s += R(wx, wy, ww, wh, 0, { fill: 'url(#farmGlass)', opacity: 0.18 }) + P(`M${wx + 40} ${wy + wh} L${wx + 160} ${wy} L${wx + 220} ${wy} L${wx + 100} ${wy + wh} Z`, { fill: '#FFFFFF', opacity: 0.22 });
  s += R(wx, wy, ww, wh, 6, { fill: 'none', stroke: LINE, 'stroke-width': 8 }) + P(`M${wx + ww / 2} ${wy} L${wx + ww / 2} ${wy + wh}`, ln(6));
  // OPEN neon (flickers)
  const on = openFlicker > 0 && !(Math.floor(t * 7) % 9 === 0);
  s += R(wx + 20, wy + 16, 150, 56, 12, { fill: '#1A0E22', opacity: 0.8 }) + T(on ? 'OPEN' : 'OP N', wx + 95, wy + 60, 44, on ? '#FF6FB5' : '#7A3A5A');
  // door
  s += R(1640, 560, 160, 320, 8, ol('#3BA7E0', 7)) + R(1660, 580, 120, 200, 6, ol('#BDEBFF', 5)) + R(1764, 700, 14, 50, 6, ol('#DCE2EA', 3));
  s += R(1676, 640, 88, 30, 6, ol('#FFFFFF', 3)) + TF('PUSH', 1720, 662, 22, '#E8504A');
  // ice chest, tyres
  s += R(1086, 846, 130, 70, 10, ol('#FFFFFF', 6)) + R(1086, 846, 130, 20, 8, ol('#5CB8FF', 5)) + T('ICE', 1151, 906, 34, '#2E86B8');
  for (let i = 0; i < 3; i++) s += Ell(1880, 880 - i * 36, 66, 22, ol('#2B2A33', 6)) + Ell(1880, 880 - i * 36, 28, 9, { fill: '#55525E' });
  // canopy + pumps
  s += R(230, 430, 34, 450, 8, ol('#F4F1EA', 6)) + R(900, 430, 34, 450, 8, ol('#F4F1EA', 6));
  s += R(560, 860, 300, 34, 10, ol('#BFC6D2', 5));
  s += pump(GAS.pumps[0], 870, t, '#E8504A', '1') + pump(GAS.pumps[1], 870, t + 1, '#3BA7E0', '2');
  s += R(150, 330, 870, 90, 16, ol('#FFFFFF', 7)) + R(150, 396, 870, 24, 0, { fill: '#E8504A' }) + R(150, 418, 870, 14, 0, { fill: '#000', opacity: 0.12 });
  s += outT('GAS', 585, 392, 64, '#E8504A', 0, { stroke: 'none' });
  for (let i = 0; i < 6; i++) s += R(190 + i * 140, 418, 80, 10, 5, { fill: '#FFF6C8', opacity: 0.9 });
  // tall sign
  const sgx = 115;
  s += R(sgx - 13, 300, 26, 580, 8, ol('#9AA3B2', 5));
  s += R(sgx - 125, 50, 250, 250, 22, ol('#FFFFFF', 7)) + R(sgx - 125, 50, 250, 84, 22, ol('#E8504A', 7)) + T('GAS', sgx, 118, 66, '#FFFFFF', { stroke: LINE, 'stroke-width': 8, 'paint-order': 'stroke' });
  const pr = lag > 0 && Math.floor(t * 4) % 3 === 0 ? '?.??' : price;
  s += R(sgx - 105, 148, 210, 80, 12, ol('#1A1A22', 5)) + T('$' + pr, sgx, 208, 54, '#FFD21F');
  s += TF('SNACKS', sgx, 262, 28, '#3A3F55') + TF('SLUSH', sgx, 290, 24, '#E8504A');
  s += R(240, 560, 210, 110, 12, ol('#FFE14D', 6)) + TF('LAST GAS', 345, 604, 30, '#3A3F55') + TF('FOR 99 MI', 345, 646, 30, '#E8504A');
  bg += V(cam, s, 1);
  // foreground tumbleweed
  const tw = ((t * 260) % 3200) - 600;
  const fgS = V(cam, tumbleweed(tw, 1010 - Math.abs(Math.sin(t * 4)) * 50, 46, t * 260), 1.15);
  return layers(bg, '', fgS);
}

// ---------------------------------------------------------------- gasStationInside(t, opts) — counter close-up
// The cashier stands behind the counter at GASIN.cashier {x, y, s} (feet hidden): draw him between bg and fg.
// Customers stand in front of the counter (draw after fg), feet off-frame (y ≈ 1250 at s .62).
// opts: register ('$2.00' / '...'), slushJerk 0..1, coffee 0..1 (cup on the counter), lag 0..1 (clock + register stutter)
const GASIN = { counterTop: 770, cashier: { x: 960, y: 1025, s: 0.62 }, coffee: { x: 1240, y: 770 } };
function gasStationInside(t, opts = {}) {
  const { register = '$2.00', slushJerk = 0, coffee = 0, lag = 0, cam = null } = opts;
  let bg = R(-400, -300, 2720, 1700, 0, { fill: '#FFE6B8' }) + R(-400, -300, 2720, 260, 0, { fill: '#F2C98A' }) + R(-400, -40, 2720, 20, 0, { fill: '#E8504A' });
  for (let x = -400; x < 2400; x += 160) bg += R(x, -20, 80, 900, 0, { fill: '#FFFFFF', opacity: 0.18 });
  // window to the desert (left) with Betsy-coloured light
  const wcid = S.uid('farmGiW');
  bg += S.clipDef(wcid, R(50, 110, 330, 300, 14)) + G(R(40, 100, 360, 320, 0, { fill: 'url(#farmSkyDay)' }) + R(40, 300, 360, 120, 0, { fill: '#F4C687' }) + mesaShape(60, 304, 220, 80, desertCols(0.8)) + cactus(320, 330, 0.3, desertCols(0.8), 2), null, { 'clip-path': `url(#${wcid})` });
  bg += P('M70 400 L190 120 L240 120 L120 400 Z', { fill: '#FFFFFF', opacity: 0.25 }) + R(50, 110, 330, 300, 14, { fill: 'none', stroke: LINE, 'stroke-width': 8 }) + P('M215 110 L215 410', ln(6));
  bg += R(36, 404, 358, 22, 8, ol('#E8D2A8', 5));
  // shelves of snacks
  for (let r = 0; r < 3; r++) bg += G(R(0, 0, 900, 120, 0, { fill: 'url(#farmSnacks)' }), `translate(430 ${120 + r * 150})`) + R(424, 236 + r * 150, 912, 16, 6, ol('#C98B4A', 4));
  bg += R(424, 110, 912, 470, 10, { fill: 'none', stroke: LINE, 'stroke-width': 6 });
  // clock (stutters when lagging)
  const ct = lag > 0 ? K.stutterT(t, 0.8) : t;
  bg += Ci(1490, 170, 60, ol('#FFFFFF', 7)) + P(`M1490 170 L${f(1490 + 42 * Math.sin(ct * 2))} ${f(170 - 42 * Math.cos(ct * 2))}`, ln(5, '#E8504A')) + P('M1490 170 L1490 136', ln(7)) + P('M1490 170 L1514 178', ln(7)) + Ci(1490, 170, 6, { fill: '#151515' });
  // coffee station + slushie
  bg += R(1380, 420, 220, 160, 14, ol('#3A3F55', 6)) + R(1400, 380, 70, 50, 8, ol('#3A3F55', 5)) + P('M1420 470 L1470 470 L1476 560 L1414 560 Z', ol('#BDEBFF', 5)) + R(1418, 520, 54, 38, 6, { fill: '#6B3A1E' }) + T('COFFEE', 1520, 520, 34, '#FFE14D');
  bg += R(1390, 568, 200, 18, 0, { fill: blink(t, 1.5) ? '#FF5A3A' : '#B53A2A' });
  bg += slushie(1700, 760, 0.95, t, { jerk: slushJerk, cup: 0.7 });
  bg += R(1580, 270, 250, 64, 12, ol('#FFE14D', 6)) + T('SLUSH 99¢', 1705, 318, 42, '#E8504A');
  // ceiling fan
  bg += P('M960 -300 L960 -110', ln(8)) + G(P('M-180 0 L180 0', ln(18)) + P('M-180 0 L180 0', ln(10, '#C98B4A')), `translate(960 -106) scale(${f(Math.cos(t * 8))} 0.25)`);
  bg += Ci(960, -100, 22, ol('#DCE2EA', 5));
  let fg = '';
  // counter
  fg += R(-200, GASIN.counterTop, 2320, 40, 10, ol('#FFF4DC', 7)) + R(-200, GASIN.counterTop + 36, 2320, 400, 0, ol('#3BA7E0', 7));
  for (let x = -200; x < 2200; x += 120) fg += R(x + 10, GASIN.counterTop + 60, 100, 240, 12, { fill: '#2E86B8', opacity: 0.5 });
  fg += R(360, GASIN.counterTop + 100, 320, 120, 16, ol('#FFE14D', 6)) + T('GAS · SNACKS', 520, GASIN.counterTop + 160, 40, '#E8504A') + TF('· COFFEE ·', 520, GASIN.counterTop + 200, 30, '#3A3F55');
  fg += R(1300, GASIN.counterTop + 110, 200, 90, 12, ol('#FFFFFF', 5)) + TF('THANKS FOR', 1400, GASIN.counterTop + 150, 26, '#2E86B8') + TF('STOPPING :)', 1400, GASIN.counterTop + 184, 26, '#2E86B8');
  // register
  fg += P(rp([[460, 770], [480, 640], [760, 640], [780, 770]], 14), ol('#5A6478', 7)) + R(500, 560, 220, 90, 12, ol('#3A3F55', 6)) + R(516, 574, 188, 58, 6, ol('#1A2A1A', 4));
  const rs = lag > 0 && Math.floor(t * 3) % 2 === 0 ? '. . .' : register;
  fg += T(rs, 610, 620, 42, '#7CFF8A');
  for (let r = 0; r < 2; r++) for (let cc = 0; cc < 5; cc++) fg += R(500 + cc * 46, 676 + r * 40, 36, 28, 6, ol(cc === 4 ? '#FF8A3D' : '#E6E8F0', 3));
  // bell, tip jar, gum, donut box
  fg += Ell(860, 768, 36, 8, { fill: '#9AA3B2' }) + P('M830 766 Q830 724 860 722 Q890 724 890 766 Z', ol('#FFD21F', 5)) + Ci(860, 716, 7, ol('#FFD21F', 3));
  fg += P('M1560 770 L1570 670 L1650 670 L1660 770 Z', { fill: '#BDEBFF', opacity: 0.6, stroke: LINE, 'stroke-width': 5 }) + R(1574, 694, 72, 26, 6, ol('#FFFFFF', 3)) + TF('TIPS', 1610, 714, 20, '#3A3F55') + K.coin(1600, 750, 14, 10) + K.coin(1626, 756, 14, -20);
  fg += R(1060, 700, 150, 70, 10, ol('#FF6FB5', 6)) + R(1070, 690, 130, 20, 8, ol('#FF9FC8', 4)) + Ci(1100, 730, 16, ol('#E8A25A', 4)) + Ci(1150, 734, 16, ol('#C97A3A', 4)) + Ci(1100, 730, 5, { fill: '#FFE6B8' });
  if (coffee > 0) {
    const k = ease.outBack(clamp(coffee, 0, 1));
    let cup = P('M-40 0 L40 0 L48 -96 L-48 -96 Z', ol('#FFFFFF', 6)) + R(-50, -104, 100, 16, 6, ol('#E8504A', 5)) + P('M44 -72 Q76 -66 66 -36 Q60 -24 42 -26', ln(8));
    for (let i = 0; i < 3; i++) cup += P(`M${-20 + i * 20} -118 q-12 -20 0 -40 q12 -20 0 -40`, ln(6, '#FFFFFF', 0.5 + 0.3 * Math.sin(t * 4 + i)));
    fg += G(cup, `translate(${GASIN.coffee.x} ${GASIN.coffee.y}) scale(${f(k)})`);
  }
  return layers(V(cam, bg, 1), '', V(cam, fg, 1));
}

// ---------------------------------------------------------------- inside Betsy
// vanInterior(t, opts) → { bg, mid, fg } in world space (opts.cam optional).
// opts.view: 'fwd' (default) — from the back seat looking forward through the split windscreen:
//     bg = outside + dashboard + GPS + steering wheel; fg = the two front seat backs.
//     Slots VANIN.fwd: driver {x:560, y:1150, s:.72} (seen from behind / turning), passenger {x:1360, …}, middle (Pip
//     popping up between the seats) {x:960, y:1180, s:.5}. Draw characters between bg and fg.
//   'rear' — from the dashboard looking back at the cabin (faces visible):
//     bg = back of the van + rear bench; mid = front seat backs; fg = dashboard edge + steering wheel.
//     Order: bg + [rear bench: Dex, Pip] + mid + [front: Grandpa (screen-right), Juno (screen-left)] + fg.
// opts: gps (text), gpsLag 0..1 (spinner), time 0..1, speed (scroll speed factor, default 1), steer (deg),
//       speedo (0..40 mph; the dial ends at 40!), lag 0..1 (outside view lag), bounce 0..1
const VANIN = {
  fwd: { driver: { x: 560, y: 1150, s: 0.72 }, passenger: { x: 1360, y: 1150, s: 0.72 }, middle: { x: 960, y: 1190, s: 0.5 }, seatTop: 790 },
  rear: { driver: { x: 1390, y: 1250, s: 0.7 }, passenger: { x: 530, y: 1250, s: 0.7 }, dex: { x: 780, y: 905, s: 0.42 }, pip: { x: 1150, y: 890, s: 0.36 }, frontSeatTop: 760, benchTop: 600 },
};
function outsideFwd(t, time, speed, lag) {
  const c = desertCols(time);
  const vx = 960, vy = 400;
  let o = R(0, 0, 1920, 640, 0, { fill: 'url(#farmSkyDawn)' }) + (time > 0 ? R(0, 0, 1920, 640, 0, { fill: 'url(#farmSkyDay)', opacity: f(time) }) : '');
  o += Ci(1280, lerp(380, 120, time), 200, { fill: 'url(#farmSunGlow)' }) + R(1240, lerp(340, 80, time), 80, 80, 18, { fill: mix('#FFB04A', '#FFE45C', time) });
  o += cloudShape(260, 120, 0.5, '#FFFFFF', '#D6EEFF') + (lag > 0.2 ? lagCloud(1400, 60, 0.6, (t * 0.15) % 1, t, 3) : cloudShape(1500, 90, 0.45, '#FFFFFF', '#D6EEFF'));
  o += R(0, vy, 1920, 300, 0, { fill: c.sandFar }) + mesaShape(120, vy + 6, 420, 90, c) + mesaShape(1300, vy + 6, 520, 120, c);
  o += cliff(-200, vy + 10, 640, 220, c, 4, 4) + cliff(1500, vy + 10, 700, 250, c, 9, 4);
  o += P(`M${vx - 30} ${vy} L${vx + 30} ${vy} L2300 640 L-100 640 Z`, { fill: c.road }) + P(`M${vx - 30} ${vy} L-100 640 L-300 640 L${vx - 40} ${vy} Z M${vx + 30} ${vy} L2300 640 L2500 640 L${vx + 40} ${vy} Z`, { fill: c.sand });
  // dashes rushing toward us (we drive in the right lane, so the centre line runs off to the left)
  const sp = speed, cx2 = 420;
  for (let i = 0; i < 6; i++) {
    const z = ((i / 6) + t * 0.5 * sp) % 1, z2 = Math.min(1, z + 0.07);
    const y1 = vy + (640 - vy) * z * z, y2 = vy + (640 - vy) * z2 * z2;
    const x1 = lerp(vx, cx2, z * z), x2 = lerp(vx, cx2, z2 * z2);
    const w1 = 2 + 20 * z * z, w2 = 2 + 20 * z2 * z2;
    o += P(`M${f(x1 - w1)} ${f(y1)} L${f(x1 + w1)} ${f(y1)} L${f(x2 + w2)} ${f(y2)} L${f(x2 - w2)} ${f(y2)} Z`, { fill: '#FFD84D' });
  }
  for (let i = 0; i < 3; i++) {
    const z = ((i / 3) + t * 0.32 * sp) % 1, zz = z * z;
    const side = i % 2 ? 1 : -1;
    o += cactus(vx + side * (60 + 1400 * zz), vy + (640 - vy) * zz + 10, 0.1 + 1.1 * zz, c, i + 2);
  }
  if (lag > 0) o += R(1000, 120, 240, 240, 0, { fill: 'url(#farmLowRes)', opacity: f(lag) });
  return o;
}
function gpsScreen(x, y, w, h, t, txt, spin) {
  let o = R(x - 12, y - 12, w + 24, h + 24, 20, ol('#22252F', 7));
  o += R(x, y, w, h, 10, { fill: '#DFF3D8' });
  // a little map: roads + route
  o += P(`M${x + 20} ${y + h - 50} L${x + w * 0.4} ${y + h * 0.45} L${x + w * 0.7} ${y + h * 0.5} L${x + w - 20} ${y + 24}`, ln(16, '#FFFFFF')) + P(`M${x + 20} ${y + h - 50} L${x + w * 0.4} ${y + h * 0.45} L${x + w * 0.7} ${y + h * 0.5} L${x + w - 20} ${y + 24}`, ln(8, '#46A0FF'));
  o += P(`M${x + 30} ${y + 20} L${x + w * 0.4} ${y + h * 0.45}`, ln(10, '#FFFFFF')) + R(x + w * 0.78, y + h * 0.2, 46, 34, 8, ol('#5A6478', 3));
  o += G(P('M0 -18 L14 14 L0 6 L-14 14 Z', ol('#FF5A3A', 3)), `translate(${f(x + w * 0.4)} ${f(y + h * 0.45)})`);
  o += R(x, y + h - 44, w, 44, 0, { fill: '#2A3F82' }) + TF(txt, x + w / 2 + (spin > 0 ? 16 : 0), y + h - 12, Math.min(28, (w - 40) / Math.max(6, txt.length) * 1.8), '#FFFFFF');
  if (spin > 0) o += K.loadingWheel(x + 26, y + h - 22, 12, t, '#FFFFFF', 8, 4) + R(x, y, w, h - 44, 10, op('#9AA3B2', 0.4 * spin));
  return o;
}
function steeringWheel(x, y, r, rot, col = '#3A2E2A') {
  let o = Ci(0, 0, r, { fill: 'none', stroke: LINE, 'stroke-width': r * 0.24 }) + Ci(0, 0, r, { fill: 'none', stroke: col, 'stroke-width': r * 0.15 });
  o += P(`M${f(-r)} 0 L${f(r)} 0 M0 0 L0 ${f(r)}`, ln(r * 0.16)) + P(`M${f(-r)} 0 L${f(r)} 0 M0 0 L0 ${f(r)}`, ln(r * 0.08, '#5A4A40'));
  o += Ci(0, 0, r * 0.26, ol('#5A4A40', 6)) + Ci(0, 0, r * 0.12, ol('#FFD21F', 4));
  o += R(r * 0.82, -r * 0.24, r * 0.32, r * 0.48, 6, { fill: '#AEB6C2', stroke: LINE, 'stroke-width': 4, transform: 'rotate(12)' });
  o += P(`M${f(-r * 0.7)} ${f(-r * 0.64)} A${f(r)} ${f(r)} 0 0 1 ${f(r * 0.2)} ${f(-r * 0.98)}`, ln(r * 0.04, '#FFFFFF', 0.4));
  return G(o, `translate(${f(x)} ${f(y)}) rotate(${f(rot)})`);
}
function vanInterior(t, opts = {}) {
  const { view = 'fwd', gps = 'SERVER FARM · 120 MI', gpsLag = 0, time = 0.6, speed = 1, steer = 0, speedo = 38, lag = 0, bounce = 0.3, cam = null } = opts;
  const by = bounce * (3 * Math.sin(t * 15) + 2 * Math.sin(t * 6.1));
  if (view === 'rear') return vanRear(t, opts, by);
  // outside (clipped to the split windscreen)
  const panes = [[[230, 150, 30], [944, 150, 16], [944, 560, 16], [120, 560, 30]], [[976, 150, 16], [1690, 150, 30], [1800, 560, 30], [976, 560, 16]]];
  const cid = S.uid('farmWs');
  let bg = S.clipDef(cid, P(rp(panes[0]) + rp(panes[1]))) + G(outsideFwd(t, time, speed, lag), null, { 'clip-path': `url(#${cid})` });
  // shell with holes
  bg += P('M-300 -300 L2220 -300 L2220 1400 L-300 1400 Z ' + rp(panes[0]) + ' ' + rp(panes[1]), { fill: '#2F6F6A', stroke: LINE, 'stroke-width': 8, 'fill-rule': 'evenodd' });
  bg += P(rp([[-300, -300], [2220, -300], [2220, 110], [1700, 120, 40], [220, 120, 40], [-300, 110]]), { fill: '#EADBB8', stroke: LINE, 'stroke-width': 7 });
  bg += patch(300, 20, 140, 70, 3, '#D9C8A0') + R(1300, 30, 220, 60, 12, { fill: '#D9C8A0', opacity: 0.6 });
  // sun visors
  bg += R(260, 112, 420, 74, 18, ol('#D9C8A0', 6)) + R(470, 124, 100, 52, 6, ol('#FFFFFF', 4)) + R(480, 132, 80, 36, 4, { fill: '#7FC4EC' }) + Ci(500, 150, 9, { fill: '#F4C08A' }) + Ci(530, 152, 9, { fill: '#F4C08A' });
  // mirror + fuzzy dice
  const sw = Math.sin(t * 2.6) * 10 + by * 2;
  bg += R(855, 128, 210, 56, 16, ol('#3A3F55', 6)) + R(870, 138, 180, 34, 10, { fill: '#9FD6F5' }) + P(`M960 184 L${f(960 + sw)} 260`, ln(4));
  bg += G(R(-22, -22, 44, 44, 9, ol('#FF6FB5', 5)) + Ci(-8, -8, 4, { fill: '#151515' }) + Ci(8, 8, 4, { fill: '#151515' }) + Ci(8, -8, 4, { fill: '#151515' }), `translate(${f(944 + sw)} 282) rotate(${f(sw * 1.5)})`);
  bg += G(R(-20, -20, 40, 40, 8, ol('#FFFFFF', 5)) + Ci(0, 0, 4, { fill: '#151515' }), `translate(${f(984 + sw * 1.2)} 290) rotate(${f(-sw)})`);
  // dashboard
  let d = P(rp([[-300, 600], [300, 560, 60], [700, 548, 60], [1220, 548, 60], [1620, 560, 60], [2220, 600], [2220, 1400], [-300, 1400]]), ol('#3E8F86', 8));
  d += P(rp([[-300, 660], [2220, 660], [2220, 1400], [-300, 1400]]), { fill: '#F2E2BC', stroke: LINE, 'stroke-width': 7 });
  d += R(-300, 660, 2520, 22, 0, { fill: VC.orange }) + R(-300, 682, 2520, 12, 0, { fill: VC.brown });
  // gauge cluster with the speedometer that only goes to 40
  d += P(rp([[340, 700], [360, 560, 40], [740, 560, 40], [760, 700]]), ol('#22252F', 7));
  d += Ci(450, 640, 70, ol('#FFF4DC', 6)) + Ci(650, 640, 60, ol('#FFF4DC', 6));
  for (let i = 0; i <= 4; i++) { const a = Math.PI * (0.8 + i * 0.35); d += TF(String(i * 10), 450 + Math.cos(a) * 48, 650 + Math.sin(a) * 48, 18, i === 4 ? '#E8504A' : '#3A3F55'); }
  const sa = Math.PI * (0.8 + clamp(speedo / 40, 0, 1.03) * 1.4) + Math.sin(t * 30) * 0.03;
  d += P(`M450 640 L${f(450 + Math.cos(sa) * 56)} ${f(640 + Math.sin(sa) * 56)}`, ln(6, '#E8504A')) + Ci(450, 640, 8, { fill: '#151515' }) + TF('MPH', 450, 690, 16, '#3A3F55');
  d += P('M610 640 L650 610', ln(6, '#E8504A')) + TF('E', 612, 666, 18, '#E8504A') + TF('F', 690, 666, 18, '#3A3F55');
  // radio with a cassette, vents, glovebox sticker
  d += R(860, 720, 200, 90, 12, ol('#3A3F55', 6)) + R(890, 736, 140, 22, 4, { fill: '#151515' }) + R(910, 724, 100, 20, 3, ol('#FF8A3D', 3)) + Ci(890, 786, 10, ol('#DCE2EA', 3)) + Ci(1030, 786, 10, ol('#DCE2EA', 3));
  for (const vx of [210, 1290, 1700]) d += Ci(vx, 640, 44, ol('#22252F', 6)) + P(`M${vx - 30} 630 L${vx + 30} 630 M${vx - 30} 650 L${vx + 30} 650`, ln(5, '#5A6478'));
  d += R(1380, 720, 330, 140, 14, ol('#EBD8AE', 6)) + R(1520, 776, 60, 14, 6, ol('#DCE2EA', 3)) + R(1410, 740, 110, 50, 8, ol('#FFE14D', 3)) + TF('DING!', 1465, 773, 24, '#E8504A');
  bg += G(d, `translate(0 ${f(by * 0.5)})`);
  // GPS on a suction stand + bobble toy
  bg += G(P('M960 560 L960 610', ln(14)) + gpsScreen(815, 395, 290, 170, t, gps, gpsLag), `translate(0 ${f(by * 0.5)})`);
  const bob = Math.sin(t * 7) * 12;
  bg += G(R(-22, -50, 44, 52, 10, ol('#3BA7E0', 5)) + G(R(-28, -56, 56, 52, 14, ol('#FFD84D', 5)) + Ci(-10, -32, 5, { fill: '#151515' }) + Ci(10, -32, 5, { fill: '#151515' }) + P('M-8 -18 Q0 -12 8 -18', ln(4)), `translate(0 -50) rotate(${f(bob)})`), `translate(1560 ${f(556 + by * 0.5)})`);
  // steering wheel (behind the driver)
  bg += steeringWheel(550, 690 + by * 0.5, 230, steer);
  // front seats (fg)
  let fg = '';
  for (const [x0, x1] of [[140, 900], [1020, 1780]]) {
    fg += P(rp([[x0, 1400], [x0 + 6, 860, 50], [x0 + 40, VANIN.fwd.seatTop, 80], [x1 - 40, VANIN.fwd.seatTop, 80], [x1 - 6, 860, 50], [x1, 1400]]), { fill: 'url(#farmUphol)', stroke: LINE, 'stroke-width': 8 });
    fg += R(x0 + 50, VANIN.fwd.seatTop + 14, x1 - x0 - 100, 20, 10, { fill: '#FFFFFF', opacity: 0.25 });
  }
  fg += G(R(-70, -14, 140, 28, 4, { fill: '#AEB6C2', stroke: LINE, 'stroke-width': 3 }) + R(-14, -70, 28, 140, 4, { fill: '#AEB6C2', stroke: LINE, 'stroke-width': 3 }), 'translate(1500 960) rotate(-20)');
  return layers(V(cam, G(bg, `translate(0 ${f(by)})`), 1), '', V(cam, G(fg, `translate(0 ${f(by * 1.4)})`), 1));
}
function vanRear(t, opts, by) {
  const { time = 0.6, speed = 1, steer = 0, lag = 0, cam = null } = opts;
  const c = desertCols(time);
  let bg = R(-300, -300, 2520, 1700, 0, { fill: '#2F6F6A' });
  // ceiling, side walls, floor (perspective box)
  bg += P('M-300 -300 L2220 -300 L1420 150 L500 150 Z', { fill: '#EADBB8', stroke: LINE, 'stroke-width': 7 });
  bg += P('M-300 -300 L500 150 L500 820 L-300 1400 Z', { fill: '#3E8F86', stroke: LINE, 'stroke-width': 7 }) + P('M2220 -300 L1420 150 L1420 820 L2220 1400 Z', { fill: '#3E8F86', stroke: LINE, 'stroke-width': 7 });
  bg += P('M500 820 L1420 820 L2220 1400 L-300 1400 Z', { fill: '#5A4A40', stroke: LINE, 'stroke-width': 7 });
  bg += Ell(960, 40, 110, 26, ol('#FFF4C8', 5));
  // side windows with canyon scrolling past
  const side = (pts, dir) => {
    const id = S.uid('farmSw');
    const d = rp(pts, 20);
    const off = ((t * 900 * speed * dir) % 1200 + 1200) % 1200;
    let o = R(-400, -400, 3000, 2000, 0, { fill: 'url(#farmSkyDay)' }) + G(cliff(-1200 + off, 620, 900, 330, c, 3) + cliff(-300 + off, 620, 900, 280, c, 8) + cliff(600 + off, 620, 900, 330, c, 3) + cliff(1500 + off, 620, 900, 280, c, 8), null);
    return S.clipDef(id, P(d)) + G(o, null, { 'clip-path': `url(#${id})` }) + P(d, { fill: 'none', stroke: LINE, 'stroke-width': 7 }) + P(d, { fill: '#FFFFFF', opacity: 0.12 });
  };
  bg += side([[-120, 120], [380, 300], [380, 560], [-120, 560]], 1) + side([[1540, 300], [2040, 120], [2040, 560], [1540, 560]], -1);
  // back doors with rear windows: the road running away from us
  bg += R(560, 190, 800, 630, 12, ol('#4FB2A6', 7)) + P('M960 190 L960 820', ln(6));
  const rw = (x) => {
    const id = S.uid('farmRw');
    let o = R(x, 220, 340, 230, 0, { fill: 'url(#farmSkyDay)' }) + R(x, 360, 340, 120, 0, { fill: c.sand }) + mesaShape(x - 40, 362, 200, 60, c) + mesaShape(x + 200, 362, 180, 46, c);
    o += P(`M${x + 170 - 10} 362 L${x + 170 + 10} 362 L${x + 300} 460 L${x + 40} 460 Z`, { fill: c.road });
    for (let i = 0; i < 4; i++) { const z = 1 - (((i / 4) + t * 0.6 * speed) % 1), yy = 362 + 98 * z * z; o += R(x + 170 - 2 - 6 * z, yy, 4 + 12 * z, 3 + 10 * z, 2, { fill: '#FFD84D' }); }
    return S.clipDef(id, R(x, 220, 340, 230, 18)) + G(o, null, { 'clip-path': `url(#${id})` }) + R(x, 220, 340, 230, 18, { fill: 'none', stroke: LINE, 'stroke-width': 7 }) + P(`M${x + 30} 440 L${x + 110} 230 L${x + 150} 230 L${x + 70} 440 Z`, { fill: '#FFFFFF', opacity: 0.25 });
  };
  bg += rw(600) + rw(980) + R(920, 520, 26, 60, 8, ol('#DCE2EA', 4)) + R(974, 520, 26, 60, 8, ol('#DCE2EA', 4));
  // clutter: keys board, buckets, mop, Pip's box
  bg += R(1460, 260, 220, 200, 12, ol('#C98B4A', 6));
  for (let i = 0; i < 12; i++) { const kx = 1490 + (i % 4) * 50, ky = 290 + Math.floor(i / 4) * 56, sw = Math.sin(t * 3 + i) * 10 * (0.4 + Math.abs(by) * 0.2); bg += Ci(kx, ky, 6, { fill: '#5A4A40' }) + G(Ci(0, 12, 9, ol(i % 3 ? '#FFD21F' : '#DCE2EA', 3)) + R(-3, 18, 6, 22, 2, { fill: i % 3 ? '#FFD21F' : '#DCE2EA', stroke: LINE, 'stroke-width': 2 }), `translate(${kx} ${ky}) rotate(${f(sw)})`); }
  bg += P('M300 820 L380 820 L370 700 L310 700 Z', ol('#FFD21F', 6)) + P('M314 700 Q340 660 366 700', ln(5)) + P('M420 860 L200 300', ln(18)) + P('M420 860 L200 300', ln(10, '#D59A5C')) + mopStrings(200, 290, t, 5, -50, 4, 1);
  bg += R(1480, 640, 200, 170, 8, ol('#C9945A', 6)) + P('M1480 680 L1680 680', ln(4, '#A97A44')) + TF('FRAGILE', 1580, 730, 30, '#E8504A');
  for (let i = 0; i < 6; i++) bg += Ci(1520 + (i % 3) * 30, 760 + Math.floor(i / 3) * 28, 10, { fill: 'none', stroke: '#3A3F55', 'stroke-width': 4 });
  // rear bench
  bg += P(rp([[560, 820], [570, VANIN.rear.benchTop, 40], [1350, VANIN.rear.benchTop, 40], [1360, 820]]), { fill: 'url(#farmUphol)', stroke: LINE, 'stroke-width': 7 });
  bg += R(620, 690, 300, 50, 10, { fill: '#B5B5BE', opacity: 0.9, transform: 'rotate(-8 770 715)' }) + P('M650 700 L880 676', ln(4, '#8A8A96'));
  // front seat backs (mid)
  let mid = '';
  for (const [x0, x1] of [[120, 940], [980, 1800]]) {
    mid += P(rp([[x0, 1400], [x0 + 10, VANIN.rear.frontSeatTop + 40, 50], [x0 + 60, VANIN.rear.frontSeatTop, 90], [x1 - 60, VANIN.rear.frontSeatTop, 90], [x1 - 10, VANIN.rear.frontSeatTop + 40, 50], [x1, 1400]]), { fill: 'url(#farmUphol)', stroke: LINE, 'stroke-width': 8 });
    mid += R(x0 + 70, VANIN.rear.frontSeatTop + 14, x1 - x0 - 140, 18, 9, { fill: '#FFFFFF', opacity: 0.22 });
  }
  mid += P(rp([[1200, 840], [1360, 830], [1350, 900], [1210, 906]], 6), { fill: '#B5B5BE', stroke: LINE, 'stroke-width': 4 }) + P(rp([[1226, 850], [1336, 846], [1334, 886], [1230, 890]], 4), { fill: '#AEB6C2' });
  // dashboard edge + steering wheel (fg)
  let fg = P('M-300 1000 Q960 940 2220 1000 L2220 1400 L-300 1400 Z', ol('#3E8F86', 8)) + P('M-300 1040 Q960 980 2220 1040', ln(16, VC.orange));
  fg += steeringWheel(1390, 1140, 230, steer + Math.sin(t * 1.3) * 4);
  const dsw = Math.sin(t * 2.6) * 8 + by * 2;
  fg += P(`M960 -20 L${f(960 + dsw)} 70`, ln(5)) + G(R(-34, -34, 68, 68, 14, ol('#FF6FB5', 6)) + Ci(-14, -14, 6, { fill: '#151515' }) + Ci(14, 14, 6, { fill: '#151515' }) + Ci(14, -14, 6, { fill: '#151515' }) + Ci(-14, 14, 6, { fill: '#151515' }), `translate(${f(930 + dsw)} 104) rotate(${f(dsw * 2)})`) + G(R(-30, -30, 60, 60, 12, ol('#FFFFFF', 6)) + Ci(0, 0, 6, { fill: '#151515' }), `translate(${f(996 + dsw * 1.2)} 112) rotate(${f(-dsw * 1.5)})`);
  return layers(V(cam, G(bg, `translate(0 ${f(by)})`), 1), V(cam, G(mid, `translate(0 ${f(by * 1.2)})`), 1), V(cam, G(fg, `translate(0 ${f(by * 1.5)})`), 1));
}

// ================================================================ SERVER FARM
// ---------------------------------------------------------------- shared farm pieces
// one server cabinet in LOCAL space: 180 wide, h tall, standing on (0, 0) → top at -h. Patterns are glued to the cabinet.
// o: { seed, green 0..1, alarm 0..1, lowRes 0..1, frost 0..1, dim 0..1, lw }
function rackLocal(h, t, o = {}) {
  const { seed = 0, green = 0, alarm = 0, lowRes = 0, frost = 0, dim = 0, lw = 6 } = o;
  const face = o.face ?? (rnd(seed, 9) < 0.3 ? 1 : 0);
  const ih = h - 34;
  let s = R(0, -h, 180, h, 12, ol(frost > 0 ? mix('#151D3E', '#6E8FB8', frost * 0.6) : '#151D3E', lw));
  const col = Math.floor(rnd(seed, 1) * 3) * 160, row = Math.floor(rnd(seed, 2) * 5) * 36;
  let u = R(0, 0, 160, ih, 0, { fill: face ? 'url(#farmBlade)' : 'url(#farmRack)' });
  const ph = Math.floor(t * 2.6 + rnd(seed, 3) * 2) % 2;
  const blue = (1 - green) * (1 - dim * 0.7);
  const led = (id, a) => (a > 0.02 ? G(R(col, row, 160, ih, 0, { fill: `url(#${id})`, opacity: a < 0.98 ? f(a) : undefined }), `translate(${-col} ${-row})`) : '');
  if (face) u += led('farmLedBlade', blue * (ph ? 1 : 0.45)) + led('farmLedGB', green * (ph ? 1 : 0.6));
  else u += led(ph ? 'farmLedA' : 'farmLedB', blue) + led(ph ? 'farmLedGA' : 'farmLedGB', green);
  if (alarm > 0.02) u += led('farmLedR', alarm * (Math.floor(t * 4 + seed) % 2 ? 1 : 0.3));
  s += G(u, `translate(10 ${-h + 20})`);
  // top light bar, glass streak, handle
  const bar = green > 0.5 ? '#7CFFAE' : alarm > 0.5 && Math.floor(t * 4 + seed) % 2 ? '#FF5A6E' : '#7CF7FF';
  s += R(8, -h + 5, 164, 9, 4, { fill: dim > 0.5 ? '#2A3A70' : bar }) + P(`M24 -16 L96 ${-h + 24} L130 ${-h + 24} L58 -16 Z`, { fill: '#FFFFFF', 'fill-opacity': 0.07 });
  s += R(160, -h * 0.58, 8, 70, 4, { fill: '#9AA6C0' });
  if (frost > 0) {
    s += R(4, -h + 4, 172, h - 8, 10, { fill: 'url(#farmFrost)', opacity: f(frost) });
    s += P(`M-6 ${-h + 6} Q20 ${-h - 34} 60 ${-h - 22} Q100 ${-h - 44} 140 ${-h - 24} Q178 ${-h - 30} 188 ${-h + 8} Z`, { fill: '#FFFFFF', stroke: '#B9E2F5', 'stroke-width': 4, opacity: f(frost) });
    let ic = '';
    for (let i = 0; i < 6; i++) { const ix = 14 + i * 30 + rnd(i, seed) * 10, il = 16 + rnd(i, seed + 3) * 34; ic += `M${f(ix - 6)} ${-h + 8} L${f(ix)} ${f(-h + 8 + il)} L${f(ix + 6)} ${-h + 8} Z `; }
    s += P(ic, { fill: '#E8FAFF', stroke: '#9FD8F0', 'stroke-width': 3, opacity: f(frost) });
  }
  if (lowRes > 0) s += R(0, -h, 180, h, 0, { fill: 'url(#farmLowRes)', opacity: f(lowRes) }) + R(0, -h, 180, h, 10, { fill: '#8A93A6', 'fill-opacity': f(lowRes * 0.45) });
  return s;
}
const rack = (x, base, s, h, t, o) => G(rackLocal(h, t, o), `translate(${f(x)} ${f(base)}) scale(${f(s)})`);
// rotating alarm beacon at (x, y): k 0..1, col 'red' | 'green'
function beacon(x, y, t, k, col = 'red', len = 520) {
  if (k <= 0) return R(x - 26, y - 4, 52, 14, 5, ol('#3A3F55', 4)) + P(`M${x - 22} ${y - 2} Q${x - 22} ${y - 40} ${x} ${y - 42} Q${x + 22} ${y - 40} ${x + 22} ${y - 2} Z`, ol('#5A2A34', 4));
  const red = col === 'red';
  const c1 = red ? '#FF2E4D' : '#46F58C', c2 = red ? '#FF9AA6' : '#C8FFD8';
  const a = t * (red ? 5.5 : 2), c = Math.cos(a);
  let o = '';
  const L = len * Math.abs(c), sp = 30 + 70 * Math.abs(c);
  o += G(P(`M0 -20 L${f(L)} ${f(-20 - sp)} L${f(L)} ${f(-20 + sp)} Z`, { fill: `url(#${red ? 'farmConeRed' : 'farmConeGreen'})`, opacity: f(k) }), `translate(${f(x)} ${f(y)}) scale(${c < 0 ? -1 : 1} 1)`);
  o += Ci(x, y - 20, 90 + 40 * Math.abs(Math.sin(a)), { fill: `url(#${red ? 'farmGlowRed' : 'farmGlowGreen'})`, opacity: f(k * (0.5 + 0.5 * Math.abs(Math.sin(a)))) });
  o += R(x - 26, y - 4, 52, 14, 5, ol('#3A3F55', 4)) + P(`M${x - 22} ${y - 2} Q${x - 22} ${y - 40} ${x} ${y - 42} Q${x + 22} ${y - 40} ${x + 22} ${y - 2} Z`, ol(mix('#5A2A34', c1, k), 4));
  o += P(`M${x - 10} ${y - 30} Q${x - 4} ${y - 38} ${x + 6} ${y - 36}`, ln(5, c2, 0.9));
  return o;
}
// thick cable as a vine: path d, colour; optional zip ties along the polyline points
function cable(d, col, w = 22, hi = true) {
  return P(d, ln(w + 10)) + P(d, ln(w, col)) + (hi ? P(d, { ...ln(w * 0.22, '#FFFFFF', 0.35), transform: `translate(${f(-w * 0.18)} ${f(-w * 0.18)})` }) : '');
}
const CABLE_COLS = ['#3BD16F', '#34C3FF', '#FF9F1C', '#B06BFF', '#FF5A6E', '#FFD21F', '#2EE6FF'];
// big rotating "storm" made of loading wheels; (x, y) centre, r radius, k 0..1
function wheelStorm(x, y, r, t, k) {
  if (k <= 0) return '';
  let o = Ell(x, y + r * 0.1, r * 1.12, r * 0.42, { fill: '#2E3444', 'fill-opacity': f(0.45 * k) });
  // three bands of grey cloud puffs swirling at different speeds (sorted back → front)
  const puffs = [];
  for (let b = 0; b < 3; b++) {
    const rr = r * (1 - b * 0.27), n = 18 - b * 4, sp = 0.18 + b * 0.1;
    for (let i = 0; i < n; i++) {
      const a = t * sp + (i / n) * Math.PI * 2 + b * 0.7;
      puffs.push({ a, b, i, x: x + Math.cos(a) * rr, y: y + Math.sin(a) * rr * 0.3 - b * r * 0.06, pr: r * (0.135 - b * 0.02) * (0.8 + 0.45 * rnd(i, b + 3)) });
    }
  }
  puffs.sort((p, q) => Math.sin(p.a) - Math.sin(q.a));
  for (const p of puffs) {
    const front = Math.sin(p.a);
    o += Ci(p.x, p.y, p.pr, { fill: mix('#5E6678', '#B4BBC8', 0.5 + 0.5 * front), stroke: '#2A2F3C', 'stroke-width': 5, opacity: f(k) });
    if (p.i % 3 === 0 && front > -0.3) o += K.loadingWheel(p.x, p.y, p.pr * 0.55, t + p.i * 0.13, '#F2F5FA', 8, p.pr * 0.13, 1.4);
  }
  // swirl streaks (show the rotation)
  for (let j = 0; j < 4; j++) {
    const a0 = t * 0.5 + j * Math.PI / 2;
    let d = '';
    for (let s2 = 0; s2 <= 6; s2++) { const a = a0 + s2 * 0.22, rr = r * (0.35 + s2 * 0.09); d += (s2 ? ' L' : 'M') + `${f(x + Math.cos(a) * rr)} ${f(y + Math.sin(a) * rr * 0.3 - r * 0.05)}`; }
    o += P(d, ln(7, '#FFFFFF', 0.45 * k));
  }
  // the eye: a giant spinning loading wheel
  o += Ci(x, y - r * 0.05, r * 0.15, { fill: '#1A1E28', stroke: '#2A2F3C', 'stroke-width': 6, opacity: f(k) }) + K.loadingWheel(x, y - r * 0.05, r * 0.1, t, '#FFFFFF', 10, r * 0.022, 1);
  if (Math.floor(t * 2.3) % 7 === 0) o += P(`M${f(x - r * 0.35)} ${f(y + r * 0.2)} l40 60 l-34 12 l56 96`, ln(12, '#F2F5FA', k));
  return o;
}

// ---------------------------------------------------------------- farmExterior(t, opts)
// The Server Farm wedged in a canyon (wide establishing shot). Layers (opts.cam for parallax).
// Ground in front of the door FARM.floor = 950 (characters at s ≈ .2 here — zoom the camera in for the door,
// or use farmDoor() for the close-up). Door centre FARM.door {x: 960, y: 950}, key slot {x: 1052, y: 870}.
// opts: storm 0..1 (rotating grey loading-wheel storm above the roof), doorScreen ('KEY EXPIRED: 1998'),
//       sunset 0..1 (golden hour for SC 10/12), green 0..1 (windows turn green), grass 0..1 (the patch of real grass
//       next to the door glows/sparkles; drawn always), lag 0..1, doorOpen 0..1
const FARM = { floor: 950, door: { x: 960, y: 950, w: 150, h: 190 }, keySlot: { x: 1066, y: 866 }, grass: { x: 1250, y: 952 } };
function farmExterior(t, opts = {}) {
  const { storm = 0.6, doorScreen = 'KEY EXPIRED: 1998', sunset = 0, green = 0, grass = 0, lag = 0, doorOpen = 0, cam = null } = opts;
  const c = desertCols(0.9 - sunset * 0.4);
  let bg = V(cam, skyDesert(cam, 0.95, t, { sunset, storm: storm * 0.8, sunX: 1650, sunY: 300 + sunset * 260 }), 0);
  bg += V(cam, wheelStorm(960, 110, 560, t, storm), 0.12);
  bg += V(cam, R(-800, 640, 3600, 900, 0, { fill: c.sandFar }) + mesaShape(-500, 650, 700, 200, c) + mesaShape(1700, 650, 800, 230, c), 0.2);
  // canyon walls behind (both sides, leaning in)
  let cw = '';
  cw += P(rp([[-900, 1100], [-900, 150], [-300, 120, 30], [-120, 260, 30], [80, 300, 30], [240, 520, 30], [360, 1100]]), ol(c.wall, 6)) + P(rp([[-900, 1100], [-900, 150], [-300, 120, 30], [-120, 260, 30], [80, 300, 30], [240, 520, 30], [360, 1100]]), { fill: 'url(#farmStrata)' });
  cw += P(rp([[2820, 1100], [2820, 140], [2200, 110, 30], [2040, 250, 30], [1840, 290, 30], [1680, 520, 30], [1560, 1100]]), ol(c.wall, 6)) + P(rp([[2820, 1100], [2820, 140], [2200, 110, 30], [2040, 250, 30], [1840, 290, 30], [1680, 520, 30], [1560, 1100]]), { fill: 'url(#farmStrata)' });
  cw += P('M80 300 L240 520 L360 1100 L300 1100 L190 560 Z', { fill: c.wallSh, opacity: 0.7 }) + P('M1840 290 L1680 520 L1560 1100 L1640 1100 L1730 560 Z', { fill: c.wallSh, opacity: 0.5 });
  bg += V(cam, cw, 0.6);
  // the building (k = 1)
  let b = R(-800, 900, 3600, 600, 0, { fill: c.sand }) + R(-800, 900, 3600, 600, 0, { fill: 'url(#farmSandRip)' });
  const bx0 = 250, bx1 = 1670, top = 330;
  // set-back upper tier, roof gear
  b += R(400, 250, 1120, 100, 10, ol('#3A4A7A', 7)) + R(400, 250, 1120, 100, 10, { fill: 'url(#farmPanel)' });
  b += R(520, 170, 120, 90, 10, ol('#5A6890', 6)) + R(560, 120, 40, 60, 6, ol('#5A6890', 5));
  for (let i = 0; i < 3; i++) { const a = (t * 0.6 + i / 3) % 1; b += Ci(580 + Math.sin(t + i) * 10, 110 - a * 120, 20 + a * 40, op('#E9EDF3', 0.5 * (1 - a))); }
  b += P('M1300 250 L1310 180', ln(10)) + G(P('M-74 0 Q0 64 74 0 Z', ol('#DCE2EA', 6)) + P('M0 26 L0 -40', ln(5)) + Ci(0, -44, 8, ol('#3A3F55', 3)), 'translate(1316 170) rotate(-28)');
  b += P('M1450 250 L1450 60', ln(8)) + Ci(1450, 56, 12, { fill: blink(t, 1.2) ? '#FF2E4D' : '#5A2A34', stroke: LINE, 'stroke-width': 4 });
  if (blink(t, 1.2)) b += Ci(1450, 56, 40, { fill: 'url(#farmGlowRed)' });
  // main block
  b += R(bx0, top, bx1 - bx0, 620, 12, ol('#2A3866', 8));
  const wc = S.uid('farmWc');
  const winA = green > 0 ? 'url(#farmWinG)' : 'url(#farmWin)';
  b += S.clipDef(wc, R(bx0 + 30, top + 40, bx1 - bx0 - 60, 420)) + G(R(bx0, top, bx1 - bx0, 500, 0, { fill: 'url(#farmWin)', opacity: f(1 - green) }) + (green > 0 ? R(bx0, top, bx1 - bx0, 500, 0, { fill: 'url(#farmWinG)', opacity: f(green) }) : '') + R(bx0, top, bx1 - bx0, 500, 0, { fill: 'url(#farmWinB)', opacity: f(0.5 + 0.5 * Math.sin(t * 2)) }), null, { 'clip-path': `url(#${wc})` });
  void winA;
  b += R(bx0, top, bx1 - bx0, 620, 12, { fill: 'url(#farmPanel)' }) + R(bx0 + 8, top + 8, 40, 604, 10, { fill: '#000', opacity: 0.15 });
  b += R(bx0 - 20, top - 30, bx1 - bx0 + 40, 44, 10, ol('#3A4A7A', 7)) + R(bx0 - 14, top - 26, bx1 - bx0 + 28, 10, 5, { fill: '#7A8AC0' });
  // huge fans
  for (const [i, fx] of [470, 1450].entries()) {
    const fy = top + 190, r = 120;
    let fan = Ci(0, 0, r + 22, ol('#3A4A7A', 7)) + Ci(0, 0, r, { fill: '#0A1028', stroke: LINE, 'stroke-width': 5 });
    let bl = '';
    for (let j = 0; j < 5; j++) bl += P(`M0 0 Q${f(r * 0.5)} ${f(-r * 0.32)} ${f(r * 0.92)} -8 Q${f(r * 0.6)} ${f(r * 0.2)} 0 0 Z`, { fill: '#5A6AA0', stroke: LINE, 'stroke-width': 4, transform: `rotate(${j * 72})` });
    fan += G(bl, `rotate(${f(t * (lag > 0 ? 40 : 260) * (i ? -1 : 1))})`) + Ci(0, 0, 22, ol('#9AA6C0', 5));
    for (let j = -2; j <= 2; j++) fan += P(`M${f(-r * Math.cos(Math.asin(j / 3)))} ${f(j * r / 3)} L${f(r * Math.cos(Math.asin(j / 3)))} ${f(j * r / 3)}`, ln(3, '#9AA6C0', 0.5));
    fan += Ci(0, 0, r + 60, { fill: 'url(#farmGlowBlue)', opacity: 0.25 });
    b += G(fan, `translate(${fx} ${fy})`);
  }
  // sign
  b += R(700, top + 70, 520, 120, 18, ol('#0B1433', 7)) + outT('SERVER FARM', 960, top + 155, 84, green > 0.5 ? '#9CFFBE' : '#7CF7FF', 10);
  b += R(722, top + 200, 476, 50, 10, ol('#FFC21F', 6)) + TF('AUTHORIZED PERSONNEL ONLY', 960, top + 236, 30, '#1D1D24');
  // entrance block + heavy door + key slot + screen
  b += R(820, 700, 280, 250, 10, ol('#3A4A7A', 7)) + R(830, 712, 260, 22, 0, { fill: 'url(#farmHazard)' });
  const dh = 190 * (1 - clamp(doorOpen, 0, 1));
  b += R(885, 760, 150, 190, 6, { fill: '#050916' }) + (doorOpen > 0 ? R(885, 760, 150, 190, 0, { fill: 'url(#farmGlowBlue)', opacity: f(doorOpen) }) : '');
  if (dh > 1) b += R(885, 760, 150, dh, 6, ol('#8E9AB0', 5)) + R(895, 770, 130, Math.max(0, dh - 20), 4, { fill: 'url(#farmSteelV)' }) + (dh > 120 ? P(`M960 770 L960 ${f(750 + dh)}`, ln(4, '#5A6478')) + Ci(945, 860 - (190 - dh), 6, { fill: '#3A3F55' }) + Ci(975, 860 - (190 - dh), 6, { fill: '#3A3F55' }) : '');
  b += R(1046, 822, 46, 70, 6, ol('#2A2E3E', 4)) + R(1052, 828, 34, 20, 3, { fill: '#0A1A0A' }) + TF(doorScreen.length > 4 ? '!' : doorScreen, 1069, 845, 16, '#FF5A5A') + Ci(1069, 868, 8, ol('#FFD21F', 3)) + R(1067, 864, 4, 10, 1, { fill: '#151515' });
  b += R(860, 942, 200, 18, 4, ol('#8E9AB0', 4)) + R(840, 958, 240, 14, 4, ol('#6E7A90', 4));
  // lamp over the door
  b += R(930, 734, 60, 16, 6, ol('#3A3F55', 4)) + P('M940 750 L980 750 L1040 900 L880 900 Z', { fill: 'url(#farmConeBlue)', opacity: 0.6 });
  // cables like vines
  const sway = (i) => Math.sin(t * 0.9 + i * 1.7) * 8;
  const cables = [
    [`M300 ${top - 10} C320 520 ${f(420 + sway(0))} 600 380 960`, 0], [`M360 ${top - 10} C420 460 ${f(600 + sway(1))} 520 ${f(640 + sway(1))} 700 S700 900 760 960`, 1],
    [`M1560 ${top - 10} C1520 500 ${f(1400 + sway(2))} 640 1420 960`, 2], [`M1620 ${top - 10} C1660 460 ${f(1560 + sway(3))} 760 1640 960`, 3],
    [`M540 ${top - 10} Q${f(610 + sway(4))} 640 690 ${top - 10}`, 4], [`M1230 ${top - 10} Q${f(1310 + sway(5))} 700 1390 ${top - 10}`, 5],
    [`M1000 ${top - 10} Q${f(1090 + sway(6))} ${top + 70} 1180 ${top - 10}`, 6],
  ];
  for (const [d, i] of cables) b += cable(d, CABLE_COLS[i % CABLE_COLS.length], 18);
  // little leaves + zip ties on the vines
  for (const [x, y, r] of [[408, 560, -30], [596, 470, 20], [1420, 640, 30], [1600, 700, -20], [640, 430, 40], [1330, 500, -40]]) b += G(P('M0 0 Q14 -22 34 -14 Q20 4 0 0 Z', ol('#5CD66E', 4)) + P('M2 -2 L26 -12', ln(2.5, '#2E9C47')), `translate(${x} ${y}) rotate(${r})`);
  // grass patch by the door (the only real grass for miles)
  const gx = FARM.grass.x, gy = FARM.grass.y;
  let gr = Ell(gx, gy + 4, 70, 12, { fill: '#2E9C47', opacity: 0.4 });
  for (let i = 0; i < 9; i++) { const xx = gx - 56 + i * 14, hh = 22 + rnd(i, 5) * 22, sw2 = Math.sin(t * 2 + i) * 3; gr += P(`M${xx - 5} ${gy + 2} Q${f(xx + sw2)} ${f(gy - hh)} ${f(xx + 2 + sw2)} ${f(gy - hh - 4)} Q${xx + 4} ${gy - hh * 0.5} ${xx + 6} ${gy + 2} Z`, ol(i % 2 ? '#4CC35E' : '#7BDB5A', 3)); }
  gr += Ci(gx - 30, gy - 30, 6, ol('#FFFFFF', 2)) + Ci(gx + 34, gy - 26, 6, ol('#FFE14D', 2));
  if (grass > 0) gr += Ci(gx, gy - 20, 120, { fill: 'url(#farmGlowGreen)', opacity: f(grass) }) + K.sparkles([[gx - 70, gy - 70, 18], [gx + 60, gy - 60, 14], [gx, gy - 90, 22]], t);
  b += gr;
  // fence + sign posts + rocks on the ground
  b += boulder(180, 960, 0.8, c) + boulder(1760, 970, 0.9, c) + sageBush(700, 966, 0.6, c);
  for (let i = 0; i < 6; i++) b += R(330 + i * 70, 900, 10, 60, 3, ol('#9AA3B2', 3)) + R(1390 + i * 70, 900, 10, 60, 3, ol('#9AA3B2', 3));
  b += P('M330 916 L690 916 M1390 916 L1750 916', ln(3, '#9AA3B2'));
  if (lag > 0) b += R(bx0, top, 480, 240, 0, { fill: 'url(#farmLowRes)', opacity: f(lag) });
  bg += V(cam, b, 1);
  // foreground rocks (canyon mouth)
  let fg = P(rp([[-400, 1200], [-400, 700], [-100, 740, 40], [80, 860, 30], [140, 1200]]), ol(c.rock, 7)) + P(rp([[2320, 1200], [2320, 680], [2020, 720, 40], [1820, 860, 30], [1760, 1200]]), ol(c.rock, 7));
  fg += P('M-100 750 L60 860', ln(10, c.rockHi)) + P('M2020 730 L1840 860', ln(10, c.rockHi));
  if (sunset > 0) fg += fullRect(cam, 1, { fill: '#FF9A4D', 'fill-opacity': f(sunset * 0.16) });
  return layers(bg, '', V(cam, fg, 1.2));
}
// farmDoor(t, opts) — close-up of the heavy entrance door for the key gag + Modbot stand-off.
// Floor DOOR.floor = 940. Key slot DOOR.key {x, y}, screen DOOR.screen. opts: doorScreen, screenCol, open 0..1, alarm 0..1, cam
const DOOR = { floor: 940, key: { x: 1580, y: 640 }, screen: { x: 1580, y: 470 }, door: { x0: 560, x1: 1360, top: 200 } };
function farmDoor(t, opts = {}) {
  const { doorScreen = 'INSERT KEY', screenCol = '#FF5A5A', open = 0, alarm = 0, green = 0, cam = null } = opts;
  let bg = R(-400, -300, 2720, 1700, 0, { fill: '#2A3866' }) + R(-400, -300, 2720, 1700, 0, { fill: 'url(#farmPanel)' });
  // windows strips on both sides
  for (const x0 of [-380, 1720]) bg += G(R(0, 0, 560, 640, 0, { fill: green > 0.5 ? 'url(#farmWinG)' : 'url(#farmWin)' }), `translate(${x0} 40)`) + R(x0, 40, 560, 640, 0, { fill: '#0B1433', opacity: 0.25 });
  bg += cable('M-100 -40 C80 300 -40 600 140 1000', '#3BD16F', 26) + cable('M2000 -40 C1820 260 1980 640 1780 1000', '#B06BFF', 26) + cable('M1700 -40 Q1640 200 1760 420', '#FF9F1C', 22);
  // the door frame (hazard) + sign
  const { x0, x1, top } = DOOR.door;
  bg += R(x0 - 70, top - 70, x1 - x0 + 140, DOOR.floor - top + 70, 18, ol('#3A4A7A', 8)) + R(x0 - 50, top - 50, x1 - x0 + 100, DOOR.floor - top + 50, 10, { fill: 'url(#farmHazard)', stroke: LINE, 'stroke-width': 6 });
  bg += R(x0 + 40, top - 190, x1 - x0 - 80, 100, 14, ol('#FFC21F', 7)) + T('AUTHORIZED PERSONNEL ONLY', 960, top - 124, 50, '#1D1D24');
  // opening + interior glow
  bg += R(x0, top, x1 - x0, DOOR.floor - top, 6, { fill: '#050916' });
  if (open > 0) {
    bg += G(R(0, 0, 800, 740, 0, { fill: 'url(#farmRackFar)' }), `translate(${x0} ${top})`) + R(x0, top, x1 - x0, DOOR.floor - top, 0, { fill: 'url(#farmGlowBlue)', opacity: f(open) });
  }
  // door slab (slides up)
  const dy = -(DOOR.floor - top) * clamp(open, 0, 1);
  const cid = S.uid('farmDr');
  let d = R(x0, top, x1 - x0, DOOR.floor - top, 6, ol('#8E9AB0', 7)) + R(x0 + 20, top + 20, x1 - x0 - 40, DOOR.floor - top - 40, 6, { fill: 'url(#farmSteelV)' });
  for (let i = 0; i < 4; i++) d += R(x0 + 40, top + 70 + i * 170, x1 - x0 - 80, 24, 8, { fill: '#6E7A90', opacity: 0.8 });
  for (let i = 0; i < 10; i++) d += Ci(x0 + 34 + (i % 5) * ((x1 - x0 - 68) / 4), i < 5 ? top + 36 : DOOR.floor - 36, 9, ol('#C9D2E0', 3));
  d += Ci(960, (top + DOOR.floor) / 2, 110, ol('#5A6478', 8)) + Ci(960, (top + DOOR.floor) / 2, 80, { fill: 'none', stroke: '#C9D2E0', 'stroke-width': 10 });
  for (let i = 0; i < 3; i++) d += P('M-90 0 L90 0', { ...ln(14, '#C9D2E0'), transform: `translate(960 ${(top + DOOR.floor) / 2}) rotate(${i * 60 + open * 200})` });
  d += Ci(960, (top + DOOR.floor) / 2, 24, ol('#FFC21F', 5)) + R(x0 + 60, top + 40, 120, 520, 0, { fill: '#FFFFFF', opacity: 0.12 });
  bg += S.clipDef(cid, R(x0, top, x1 - x0, DOOR.floor - top)) + G(G(d, `translate(0 ${f(dy)})`), null, { 'clip-path': `url(#${cid})` });
  // key panel + screen
  const kx = DOOR.key.x, ky = DOOR.key.y, sx = DOOR.screen.x, sy = DOOR.screen.y;
  bg += R(kx - 110, sy - 90, 220, 380, 24, ol('#3A3F55', 7)) + R(kx - 96, sy - 76, 192, 352, 18, { fill: '#2A2E3E' });
  bg += R(sx - 86, sy - 56, 172, 112, 12, ol('#0A1A0A', 5)) + R(sx - 86, sy - 56, 172, 112, 12, { fill: 'url(#farmScan)' });
  const words = doorScreen.split(':');
  bg += TF(words[0] + (words.length > 1 ? ':' : ''), sx, sy + (words.length > 1 ? -8 : 10), words[0].length > 10 ? 22 : 26, screenCol) + (words.length > 1 ? T(words.slice(1).join(':').trim(), sx, sy + 38, 40, screenCol) : '');
  bg += Ci(kx, ky, 58, ol('#FFD21F', 7)) + Ci(kx, ky, 40, ol('#C99A1A', 5)) + R(kx - 9, ky - 28, 18, 56, 6, { fill: '#151515' }) + P(`M${kx - 30} ${ky - 40} Q${kx - 10} ${ky - 56} ${kx + 18} ${ky - 50}`, ln(6, '#FFF4B0', 0.9));
  bg += Ci(kx, ky + 110, 14, { fill: blink(t, 1.5) ? screenCol : '#3A2A2A', stroke: LINE, 'stroke-width': 4 });
  // floor
  bg += R(-400, DOOR.floor, 2720, 500, 0, { fill: '#C9B48A' }) + R(-400, DOOR.floor, 2720, 500, 0, { fill: 'url(#farmSandRip)' }) + R(x0 - 120, DOOR.floor - 6, x1 - x0 + 240, 40, 8, ol('#8E9AB0', 6)) + R(x0 - 120, DOOR.floor + 30, x1 - x0 + 240, 12, 0, { fill: '#000', opacity: 0.15 });
  bg += R(-400, DOOR.floor + 70, 2720, 14, 0, { fill: '#FFC21F', opacity: 0.8 });
  if (alarm > 0) bg += beacon(x0 - 140, top - 120, t, alarm) + beacon(x1 + 140, top - 120, t + 0.4, alarm);
  else bg += beacon(x0 - 140, top - 120, t, 0) + beacon(x1 + 140, top - 120, t, 0);
  return layers(V(cam, bg, 1), '', alarm > 0 ? fullRect(cam, 1, { fill: RED, opacity: f(alarm * 0.12 * (0.6 + 0.4 * Math.sin(t * 11))) }) : '');
}

// ---------------------------------------------------------------- rackHall(t, cam, opts)
// Rows of server racks in a dark-blue hall. Floor FLOOR.hall = 900 (k = 1). Main rack row: racks 180 x 630 every 210 px,
// an aisle gap every 7th slot. opts: alarm 0..1, green 0..1, greenWave 0..1 (left→right across the screen),
// lowRes 0..1 (lag), dist (scroll px), fgRacks (default true)
function rackHall(t, cam, opts = {}) {
  const { alarm = 0, green = 0, greenWave = 1, lowRes = 0, dist = 0, fgRacks = true } = opts;
  const gAt = (wx, k) => { const v = vis(cam, k); const u = (wx - dist * k - v.x0) / (v.x1 - v.x0); return green * clamp((greenWave * 1.25 - u) * 6, 0, 1); };
  const aisle = (i) => ((i % 7) + 7) % 7 === 4;
  let bg = fullRect(cam, 0, { fill: 'url(#farmHall)' });
  // far wall: tiny racks + big painted sector numbers
  bg += V(cam, band(cam, 0.15, 380, 760, { fill: 'url(#farmRackFar)', opacity: 0.45 }) + band(cam, 0.15, 360, 380, { fill: '#1C2D63' }) + band(cam, 0.15, 760, 1400, { fill: '#0A1230' }) + strip(cam, 0.15, dist, 1500, (i, x) => T('SECTOR ' + (7 + (i % 9 + 9) % 9), x + 600, 300, 120, '#1C2D63') + R(x + 1200, 100, 40, 700, 0, { fill: '#0E1A42' })), 0.15);
  // mid row (k .5): one band of small racks + gaps as a single path
  const v5 = vis(cam, 0.5), off5 = dist * 0.5;
  let mr = G(G(R(0, 0, (v5.x1 - v5.x0 + 900) / 1.4, 310, 0, { fill: 'url(#farmRackFar)' }), `translate(${f(v5.x0 - 300 - ((v5.x0 - 300 + off5) % 98))} 400) scale(1.4)`), null);
  let gaps = '';
  const i0 = Math.floor((v5.x0 + off5) / 150) - 2, i1 = Math.ceil((v5.x1 + off5) / 150) + 2;
  for (let i = i0; i <= i1; i++) { const x = i * 150 - off5; gaps += ((i % 8) + 8) % 8 === 3 ? `M${f(x - 10)} 380 h160 v460 h-160 Z ` : `M${f(x - 10)} 380 h20 v460 h-20 Z `; }
  mr += P(gaps, { fill: '#0B1538' }) + band(cam, 0.5, 384, 398, { fill: green > 0.5 ? '#2FD86E' : '#2A6AA8' }) + band(cam, 0.5, 820, 1400, { fill: '#0B1538' });
  if (alarm > 0) mr += band(cam, 0.5, 380, 820, { fill: 'url(#farmLedR)', opacity: f(alarm * blink(t, 3)) });
  if (green > 0) mr += band(cam, 0.5, 380, 820, { fill: GREEN, 'fill-opacity': f(0.14 * green * greenWave) });
  if (lowRes > 0) mr += band(cam, 0.5, 380, 820, { fill: 'url(#farmLowRes)', opacity: f(lowRes) });
  mr += band(cam, 0.5, 380, 840, { fill: '#050916', 'fill-opacity': 0.35 }) + band(cam, 0.5, -400, 300, { fill: '#050916', 'fill-opacity': 0.85 });
  bg += V(cam, mr, 0.5);
  // ceiling: lights (k .8)
  const lightK = 1 - alarm * 0.7;
  bg += V(cam, band(cam, 0.8, -400, 70, { fill: '#070D22' }) + strip(cam, 0.8, dist, 700, (i, x) => R(x + 120, 70, 460, 20, 8, ol(mix('#3A4570', '#C9E8FF', lightK), 5)) + P(`M${x + 130} 90 L${x + 40} 520 L${x + 660} 520 L${x + 570} 90 Z`, { fill: 'url(#farmConeBlue)', opacity: f(0.35 * lightK) }) + P(`M${x + 120} 20 L${x + 120} 70 M${x + 580} 20 L${x + 580} 70`, ln(5, '#3A4570'))), 0.8);
  // main row (k 1)
  let m = band(cam, 1, 140, 176, { fill: '#2A3048' }) + band(cam, 1, 140, 176, { fill: 'url(#farmGrate)' }) + band(cam, 1, 172, 182, { fill: '#151515' });
  let cOut = '', cCol = {};
  m += strip(cam, 1, dist, 210, (i, x) => {
    if (aisle(i)) return R(x + 70, 182, 10, 718, 2, { fill: '#2A3048' }) + Ci(x + 75, 700, 160, { fill: green > 0.5 ? 'url(#farmGlowGreen)' : 'url(#farmGlowBlue)', opacity: 0.35 });
    const g = gAt(x + 90, 1);
    let o = '';
    if (g > 0.05) o += Ci(x + 90, 560, 300, { fill: 'url(#farmGlowGreen)', opacity: f(0.5 * g) });
    o += rack(x, FLOOR.hall, 1, 630, t, { seed: i, green: g, alarm, lowRes, lw: 6 });
    const cc = CABLE_COLS[((i % 5) + 5) % 5];
    const d = `M${x + 40} 182 Q${x + 30} 232 ${x + 52} 262 `;
    const d2 = ((i % 3) + 3) % 3 === 1 ? `M${x + 110} 182 Q${f(x + 160 + Math.sin(t + i) * 6)} 330 ${x + 210} 182 ` : `M${x + 140} 182 Q${x + 160} 236 ${x + 128} 262 `;
    cOut += d + d2; cCol[cc] = (cCol[cc] || '') + d + d2;
    return o;
  });
  m += P(cOut, ln(16)) + Object.entries(cCol).map(([c, d]) => P(d, ln(9, c))).join('');
  if (alarm > 0 || green > 0) m += strip(cam, 1, dist, 840, (i, x) => beacon(x + 300, 140, t + i * 0.37, green > 0.5 ? green : alarm, green > 0.5 ? 'green' : 'red', 600));
  // polished floor with reflections
  const v1 = vis(cam, 1);
  let fl = band(cam, 1, FLOOR.hall, 1600, { fill: '#101C46' }) + band(cam, 1, FLOOR.hall, 1600, { fill: 'url(#farmFloorTile)' });
  fl += G(R(v1.x0 + dist - 300, FLOOR.hall + 4, v1.x1 - v1.x0 + 600, 260, 0, { fill: 'url(#farmReflTile)' }), `translate(${f(-dist)} 0)`);
  if (green > 0) fl += strip(cam, 1, dist, 210, (i, x) => (!aisle(i) && gAt(x + 90, 1) > 0.5 ? R(x + 6, FLOOR.hall + 4, 168, 230, 0, { fill: 'url(#farmReflectG)' }) : ''));
  fl += band(cam, 1, FLOOR.hall - 2, FLOOR.hall + 8, { fill: green > 0.5 ? GREEN : CYAN, 'fill-opacity': 0.3 });
  const mid = V(cam, m + fl, 1);
  // foreground: dark pillars with a few LEDs + a hanging cable loop
  let fg = '';
  if (fgRacks) fg += V(cam, strip(cam, 1.5, dist, 2400, (i, x) => {
    const px = x + 2000;
    let o = R(px, -200, 230, 1500, 14, { fill: '#03060F', stroke: '#141C3A', 'stroke-width': 8 });
    for (let j = 0; j < 7; j++) o += Ci(px + 190, 120 + j * 120, 6, { fill: blink(t, 2, j + i) ? (green > 0.5 ? GREEN : alarm > 0.5 ? RED : CYAN) : '#14305A' });
    o += P(`M${x + 700} -60 Q${f(x + 820 + Math.sin(t * 0.8 + i) * 10)} 150 ${x + 960} -60`, ln(34)) + P(`M${x + 700} -60 Q${f(x + 820 + Math.sin(t * 0.8 + i) * 10)} 150 ${x + 960} -60`, ln(22, CABLE_COLS[((i % 7) + 7) % 7]));
    return o;
  }), 1.5);
  if (alarm > 0) {
    fg += fullRect(cam, 1, { fill: RED, 'fill-opacity': f(alarm * (0.17 + 0.08 * Math.sin(t * 11))) });
    const v = vis(cam, 1);
    for (let j = 0; j < 2; j++) { const sx = v.x0 + (v.x1 - v.x0) * (0.5 + 0.55 * Math.sin(t * 2.2 + j * Math.PI)); fg += V(cam, Ell(sx, 420, 520, 420, { fill: 'url(#farmGlowRed)', opacity: f(alarm * 0.55) }), 1); }
  }
  if (green > 0) fg += fullRect(cam, 1, { fill: GREEN, 'fill-opacity': f(green * greenWave * 0.07) });
  if (lowRes > 0) fg += fullRect(cam, 1, { fill: '#8A93A6', 'fill-opacity': f(lowRes * 0.2) });
  return layers(bg, mid, fg);
}

// ---------------------------------------------------------------- coolingRoom(t, cam, opts)
// Floor 1: icy floor FLOOR.cooling = 900, frosted racks, giant fans, falling snow.
// opts: dist, fanSpeed (default 1), snow (count, default 40), skateMarks (default true), alarm, green
// breath(x, y, t, k, dir) draws a puff of breath mist at a mouth position (use it on the characters).
function breath(x, y, t, k = 1, dir = 1, seed = 0) {
  let o = '';
  for (let i = 0; i < 3; i++) {
    const a = ((t * 0.9 + i / 3 + seed) % 1);
    o += Ci(x + dir * (20 + a * 90), y - a * 30 + Math.sin(t * 3 + i) * 4, 12 + a * 30, { fill: '#FFFFFF', 'fill-opacity': f(k * 0.7 * (1 - a)), stroke: '#9FCBEA', 'stroke-width': 3, 'stroke-opacity': f(k * 0.8 * (1 - a)) });
  }
  return o;
}
function coolingRoom(t, cam, opts = {}) {
  const { dist = 0, fanSpeed = 1, snow = 30, skateMarks = true, alarm = 0, green = 0 } = opts;
  let bg = fullRect(cam, 0, { fill: 'url(#farmIceWall)' });
  // back wall: giant wall fans + frost + sign
  bg += V(cam, band(cam, 0.2, -400, 1400, { fill: 'url(#farmFrost)', opacity: 0.6 }) + strip(cam, 0.2, dist, 900, (i, x) => {
    const cx = x + 450, cy = 330, r = 190;
    let o = R(cx - r - 40, cy - r - 40, 2 * r + 80, 2 * r + 80, 40, ol('#7FA8D8', 7)) + Ci(cx, cy, r, { fill: '#3A5A8A', stroke: LINE, 'stroke-width': 6 });
    let bl = '';
    for (let j = 0; j < 4; j++) bl += P(`M0 0 Q${f(r * 0.6)} ${f(-r * 0.36)} ${f(r * 0.95)} -6 Q${f(r * 0.6)} ${f(r * 0.24)} 0 0 Z`, { fill: '#B9D8F5', stroke: LINE, 'stroke-width': 4, transform: `rotate(${j * 90})` });
    o += G(bl, `translate(${cx} ${cy}) rotate(${f(t * 200 * fanSpeed + i * 40)})`) + Ci(cx, cy, 30, ol('#E8F8FF', 5));
    for (let j = -3; j <= 3; j++) o += P(`M${cx - r} ${cy + j * r / 3.6} L${cx + r} ${cy + j * r / 3.6}`, ln(3, '#E8F8FF', 0.4));
    o += P(`M${cx - r - 40} ${cy - r - 34} Q${cx} ${cy - r - 70} ${cx + r + 40} ${cy - r - 34}`, { fill: '#FFFFFF', stroke: '#B9E2F5', 'stroke-width': 4 });
    return o;
  }) + band(cam, 0.2, 760, 1400, { fill: '#C8E8FA' }), 0.2);
  // frosted rack row (k .6)
  bg += V(cam, band(cam, 0.6, 840, 1400, { fill: '#A8D8F2' }) + strip(cam, 0.6, dist, 230, (i, x) => (((i % 6) + 6) % 6 === 2 ? '' : rack(x, 850, 0.8, 640, t, { seed: i + 40, frost: 0.9, dim: 0.3, alarm, green }) + P(`M${x - 10} 852 Q${x + 80} 820 ${x + 160} 852 Z`, { fill: '#FFFFFF', stroke: '#B9E2F5', 'stroke-width': 3 }))), 0.6);
  // giant ceiling fans (k .85)
  bg += V(cam, band(cam, 0.85, -400, 40, { fill: '#5E8FC8' }) + strip(cam, 0.85, dist, 1100, (i, x) => {
    const cx = x + 550, cy = 150, R0 = 420;
    let o = P(`M${cx} -60 L${cx} ${cy}`, ln(18)) + P(`M${cx} -60 L${cx} ${cy}`, ln(10, '#DCE8F5'));
    let bl = '';
    const a0 = t * 4 * fanSpeed + i;
    const blades = [0, 1, 2, 3].map((j) => { const a = a0 + j * Math.PI / 2; return [Math.cos(a), Math.sin(a)]; }).sort((p, q) => p[1] - q[1]);
    for (const [cc, ss] of blades) {
      const ex = cx + cc * R0, ey = cy + ss * 40;
      bl += P(`M${cx} ${cy} L${f(ex - ss * 18)} ${f(ey - 26)} L${f(ex + ss * 18)} ${f(ey + 6)} Z`, { fill: ss > 0 ? '#C8E2F8' : '#9CC0E8', stroke: LINE, 'stroke-width': 5, 'stroke-linejoin': 'round' });
    }
    o += bl + Ell(cx, cy, 60, 28, ol('#E8F8FF', 6)) + P(`M${cx - 50} ${cy + 26} L${cx - 54} ${cy + 60} M${cx + 10} ${cy + 28} L${cx + 6} ${cy + 74} M${cx + 44} ${cy + 24} L${cx + 46} ${cy + 52}`, ln(8, '#E8FAFF'));
    // hanging sign / thermometer between the fans
    const sx = x + 1000, sw = Math.sin(t * 1.1 + i) * 2;
    if (i % 2 === 0) o += G(P('M-150 -200 L-150 0 M150 -200 L150 0', ln(5, '#7FA8D8')) + R(-200, 0, 400, 120, 18, ol('#E8F8FF', 7)) + T('COOLING ROOM', 0, 62, 50, '#2E6FA8') + TF('FLOOR 1', 0, 100, 28, '#5A8AC0') + P('M-196 4 Q-120 -16 -40 2 Q40 -14 120 4 Q170 -10 196 4 Z', { fill: '#FFFFFF', stroke: '#B9E2F5', 'stroke-width': 3 }), `translate(${sx} 230) rotate(${f(sw)})`);
    else o += G(P('M0 -200 L0 0', ln(5, '#7FA8D8')) + R(-46, 0, 92, 250, 40, ol('#FFFFFF', 7)) + R(-14, 30, 28, 160, 14, { fill: '#D8F2FF', stroke: LINE, 'stroke-width': 3 }) + R(-14, 150, 28, 40, 10, { fill: '#5CE1FF' }) + Ci(0, 205, 26, ol('#5CE1FF', 5)) + TF('-40°', 90, 120, 40, '#2E6FA8'), `translate(${sx} 230) rotate(${f(sw)})`);
    return o;
  }), 0.85);
  // ice floor (k 1)
  let fl = band(cam, 1, FLOOR.cooling, 1600, { fill: 'url(#farmIceFloor)' }) + band(cam, 1, FLOOR.cooling, 1600, { fill: 'url(#farmIce)' });
  fl += band(cam, 1, FLOOR.cooling - 6, FLOOR.cooling + 6, { fill: '#FFFFFF', opacity: 0.8 });
  fl += strip(cam, 1, dist, 600, (i, x) => {
    let o = P(`M${x} ${FLOOR.cooling + 2} Q${x + 70} ${FLOOR.cooling - 40} ${x + 160} ${FLOOR.cooling - 10} Q${x + 220} ${FLOOR.cooling - 34} ${x + 300} ${FLOOR.cooling + 2} Z`, { fill: '#FFFFFF', stroke: '#B9E2F5', 'stroke-width': 4 });
    o += R(x + 340, FLOOR.cooling + 10, 140, 220, 0, { fill: 'url(#farmReflect)', opacity: 0.5 });
    if (skateMarks) o += P(`M${x + 60} ${FLOOR.cooling + 120} Q${x + 260} ${FLOOR.cooling + 40} ${x + 470} ${FLOOR.cooling + 110} T${x + 860} ${FLOOR.cooling + 90}`, ln(4, '#FFFFFF', 0.7)) + P(`M${x + 90} ${FLOOR.cooling + 150} Q${x + 300} ${FLOOR.cooling + 70} ${x + 520} ${FLOOR.cooling + 140}`, ln(3, '#FFFFFF', 0.5));
    return o;
  });
  // snow particles + floor mist
  let sn = '';
  const v = vis(cam, 0.9);
  for (let i = 0; i < snow; i++) {
    const x = v.x0 + ((rnd(i, 81) * 2200 + Math.sin(t * 0.7 + i) * 40 - dist * 0.9) % 2200 + 2200) % 2200 - 140;
    const y = ((rnd(i, 82) * 1100 + t * (40 + rnd(i, 83) * 50)) % 1100) - 40;
    const r = 3 + rnd(i, 84) * 5;
    sn += Ci(x, y, r, { fill: '#FFFFFF', 'fill-opacity': 0.8 });
  }
  let mist = '';
  for (let i = 0; i < 6; i++) { const x = vis(cam, 1).x0 + ((rnd(i, 85) * 2400 + t * 30) % 2400) - 200; mist += Ell(x, FLOOR.cooling + 10 - rnd(i, 86) * 30, 260, 40, op('#FFFFFF', 0.22)); }
  const mid = V(cam, fl, 1) + V(cam, sn, 0.9);
  // foreground icicle pipe
  let fg = V(cam, mist, 1) + V(cam, strip(cam, 1.4, dist, 1300, (i, x) => {
    let o = R(x - 20, -60, 1340, 70, 0, { fill: '#8FB8E0', stroke: LINE, 'stroke-width': 7 }) + R(x - 20, -6, 1340, 10, 0, { fill: '#FFFFFF', opacity: 0.6 });
    let ic = '';
    for (let j = 0; j < 14; j++) { const ix = x + j * 95 + rnd(j, i) * 40, il = 30 + rnd(j, i + 1) * 90; ic += `M${f(ix - 14)} 8 L${f(ix)} ${f(8 + il)} L${f(ix + 14)} 8 Z `; }
    o += P(ic, { fill: '#E8FAFF', stroke: '#7FB8E0', 'stroke-width': 4, 'stroke-linejoin': 'round' });
    return o;
  }), 1.4);
  if (alarm > 0) fg += fullRect(cam, 1, { fill: RED, opacity: f(alarm * 0.12) });
  return layers(bg, mid, fg);
}

// ---------------------------------------------------------------- cableJungle(t, cam, opts)
// Floor 2: thick coloured cables hang like vines over a deep shaft; obby-like platforms hang below.
// Standing surfaces (top y, k = 1): JUNGLE.start {x0, x1, y}, JUNGLE.platforms [{x, w, y}], JUNGLE.end {x0, x1, y}.
// Swing vines JUNGLE.vines [{x, y (anchor), len}] — vineEnd(i, t, opts) gives the swinging end point (hang Dex there).
// opts: obby 0..1 (Dex's imagination: neon obby colours, studs, checkpoint, STAGE 1 sign), swing [angle deg per vine],
//       dist, depthGlow 0..1
const JUNGLE = {
  start: { x0: -900, x1: 380, y: 800 },
  platforms: [{ x: 500, w: 210, y: 740 }, { x: 830, w: 170, y: 660 }, { x: 1440, w: 190, y: 700 }, { x: 1760, w: 170, y: 620 }],
  end: { x0: 2060, x1: 3400, y: 680 },
  vines: [{ x: 1220, y: -60, len: 600 }, { x: 2000, y: -60, len: 440 }],
};
function vineAngle(i, t, opts = {}) {
  if (opts.swing && opts.swing[i] !== undefined && opts.swing[i] !== null) return opts.swing[i];
  return Math.sin(t * 1.3 + i * 2) * 14;
}
function vineEnd(i, t, opts = {}) {
  const V0 = JUNGLE.vines[i], a = (vineAngle(i, t, opts) * Math.PI) / 180;
  return { x: V0.x + Math.sin(a) * V0.len, y: V0.y + Math.cos(a) * V0.len };
}
function platformShape(x, y, w, t, obby, i, hang = true) {
  const OB = ['#FF5A5A', '#FFB000', '#3BD16F', '#3B8BFF', '#B06BFF'];
  let o = '';
  if (hang) o += P(`M${x + 20} ${y} L${x + 40} -80 M${x + w - 20} ${y} L${x + w - 40} -80`, ln(6, '#3A4260'));
  const h = 70;
  o += R(x, y, w, h, 12, ol('#22305E', 6)) + G(R(0, 0, w - 20, h - 30, 0, { fill: 'url(#farmRack)' }), `translate(${x + 10} ${y + 22})`) + R(x, y, w, 18, 8, ol('#8FA2D8', 5)) + R(x + 6, y + h - 6, w - 12, 6, 3, { fill: CYAN, 'fill-opacity': 0.7 });
  o += R(x + 8, y + 3, w - 16, 5, 2, { fill: '#9FB2E8' }) + Ci(x + w - 20, y + 44, 5, { fill: blink(t, 2, i) ? '#5CE1FF' : '#1A2A5A' });
  if (obby > 0) {
    const c = OB[i % OB.length];
    o += R(x - 4, y - 4, w + 8, h + 8, 14, { fill: c, opacity: f(obby * 0.85), stroke: LINE, 'stroke-width': 6 }) + R(x, y, w, 22, 8, { fill: 'url(#studsSm)', opacity: f(obby) });
    o += R(x - 10, y - 10, w + 20, h + 20, 18, { fill: 'none', stroke: c, 'stroke-width': 6, opacity: f(obby * (0.5 + 0.5 * Math.sin(t * 6 + i))) });
  }
  return o;
}
function ledge(x0, x1, y, t, obby, i) {
  let o = R(x0, y, x1 - x0, 1400, 0, { fill: '#1A2550', stroke: LINE, 'stroke-width': 7 }) + G(R(0, 0, x1 - x0 - 40, 900, 0, { fill: 'url(#farmRack)' }), `translate(${x0 + 20} ${y + 40})`);
  o += R(x0, y, x1 - x0, 24, 6, ol('#5A6A9A', 6)) + R(x0, y + 24, x1 - x0, 18, 0, { fill: 'url(#farmHazard)' });
  if (obby > 0) o += R(x0, y - 4, x1 - x0, 46, 6, { fill: ['#3BD16F', '#FF5A5A'][i % 2], opacity: f(obby * 0.85), stroke: LINE, 'stroke-width': 6 }) + R(x0, y - 4, x1 - x0, 26, 0, { fill: 'url(#studsSm)', opacity: f(obby) });
  return o;
}
function cableJungle(t, cam, opts = {}) {
  const { obby = 0, dist = 0, depthGlow = 1 } = opts;
  let bg = fullRect(cam, 0, { fill: 'url(#farmShaft)' });
  // far shaft walls with tiny lights
  bg += V(cam, strip(cam, 0.12, dist, 700, (i, x) => R(x, -400, 300, 2000, 0, { fill: 'url(#farmRackFar)', opacity: 0.35 }) + R(x + 300, -400, 400, 2000, 0, { fill: '#0A1232', 'fill-opacity': 0.6 })) + band(cam, 0.12, 700, 1600, { fill: 'url(#farmFadeDown)' }), 0.12);
  // the bottomless shaft: nested light rings shrinking toward a glow far below
  let pit = Ell(960, 1260, 1300, 420, { fill: 'url(#farmGlowBlue)', opacity: f(0.6 * depthGlow) });
  pit += strip(cam, 0.25, dist, 380, (i, x) => R(x + rnd(i, 97) * 200, 900 + rnd(i, 98) * 140, 70 + rnd(i, 99) * 60, 16, 5, { fill: '#2A4A8A', 'fill-opacity': 0.7 }) + Ci(x + 150, 1000 + rnd(i, 96) * 60, 3, { fill: CYAN }));
  bg += V(cam, pit, 0.25);
  // distant cables + small platforms
  bg += V(cam, strip(cam, 0.4, dist, 260, (i, x) => {
    const len = 500 + rnd(i, 91) * 700, sw = Math.sin(t * 0.6 + i) * 10;
    let o = P(`M${x} -100 Q${f(x + sw)} ${f(len * 0.5)} ${f(x + sw * 1.4)} ${f(len)}`, ln(16, mix(CABLE_COLS[((i % 7) + 7) % 7], '#0A1232', 0.6)));
    if (i % 3 === 0) o += R(x - 50, 700 + rnd(i, 92) * 200, 120, 30, 6, { fill: '#1C2D63', stroke: '#0A1232', 'stroke-width': 4 });
    return o;
  }) + band(cam, 0.4, 600, 1600, { fill: 'url(#farmFadeDown)', opacity: 0.8 }), 0.4);
  // main layer
  let m = '';
  m += band(cam, 1, -400, -30, { fill: '#0B1433' }) + band(cam, 1, -60, 20, { fill: 'url(#farmTruss)' }) + band(cam, 1, 14, 30, { fill: '#2A3048', stroke: LINE, 'stroke-width': 5 });
  // hanging vine cables (decor), anchored on the ceiling
  m += strip(cam, 1, dist, 330, (i, x) => {
    const len = 260 + rnd(i, 93) * 420, sw = Math.sin(t * 0.9 + i * 1.3) * 12;
    let o = cable(`M${x} 20 C${f(x + 10)} ${f(len * 0.4)} ${f(x - 20 + sw)} ${f(len * 0.7)} ${f(x + sw * 1.5)} ${f(len)}`, CABLE_COLS[((i % 7) + 7) % 7], 20);
    o += R(x - 14 + sw * 1.5, len - 8, 28, 36, 6, ol('#C9D2E0', 4)) + R(x - 8 + sw * 1.5, len + 26, 5, 12, 2, { fill: '#FFD21F' }) + R(x + 3 + sw * 1.5, len + 26, 5, 12, 2, { fill: '#FFD21F' });
    if (i % 2 === 0) o += cable(`M${x + 120} 20 Q${f(x + 200 + sw)} ${f(300 + rnd(i, 94) * 200)} ${x + 290} 20`, CABLE_COLS[(((i + 3) % 7) + 7) % 7], 16);
    return o;
  });
  // swing vines (the ones Dex uses)
  JUNGLE.vines.forEach((V0, i) => {
    const e = vineEnd(i, t, opts);
    m += cable(`M${V0.x} ${V0.y} Q${f((V0.x + e.x) / 2 + (e.x - V0.x) * 0.1)} ${f((V0.y + e.y) / 2)} ${f(e.x)} ${f(e.y)}`, i ? '#FF9F1C' : '#3BD16F', 24);
    m += R(e.x - 18, e.y - 10, 36, 44, 8, ol('#C9D2E0', 5)) + R(e.x - 10, e.y + 34, 6, 14, 2, { fill: '#FFD21F' }) + R(e.x + 4, e.y + 34, 6, 14, 2, { fill: '#FFD21F' });
  });
  // ledges + platforms
  const J = JUNGLE;
  m += ledge(J.start.x0, J.start.x1, J.start.y, t, obby, 0) + ledge(J.end.x0, J.end.x1, J.end.y, t, obby, 1);
  m += G(R(-100, 0, 200, 92, 12, ol('#FFC21F', 6)) + TF('MIND', 0, 38, 30, '#1D1D24') + TF('THE GAP', 0, 74, 30, '#1D1D24') + P('M-70 -6 L-70 -30 M70 -6 L70 -30', ln(6, '#3A4260')), `translate(${J.start.x1 - 130} ${J.start.y + 70})`);
  J.platforms.forEach((p, i) => { m += platformShape(p.x, p.y, p.w, t, obby, i); });
  if (obby > 0) {
    const ex = J.end.x0 + 160, ey = J.end.y;
    m += G(R(-70, -10, 140, 16, 6, { fill: '#46F58C', stroke: LINE, 'stroke-width': 5 }) + Ci(0, -20, 90, { fill: 'url(#farmGlowGreen)' }) + P('M-50 -10 L-50 -190', ln(8)) + P('M-50 -190 L30 -165 L-50 -140 Z', ol('#46F58C', 5)), `translate(${ex} ${ey})`, { opacity: f(obby) });
    m += G(R(-170, -60, 340, 110, 22, ol('#FFD21F', 7)) + T('OBBY', 0, -6, 56, '#151515') + TF('STAGE 1', 0, 36, 32, '#E8504A'), `translate(${J.platforms[0].x + 110} ${J.platforms[0].y - 330}) rotate(-4) scale(${f(ease.outBack(clamp(obby, 0, 1)))})`);
  }
  const mid = V(cam, m, 1);
  // the drop below + foreground vines
  let fg = V(cam, band(cam, 1, 900, 1600, { fill: 'url(#farmFadeDown)', opacity: 0.7 }), 1);
  fg += V(cam, strip(cam, 1.45, dist, 1500, (i, x) => cable(`M${x + 100} -80 C${x + 140} 300 ${f(x + 60 + Math.sin(t * 0.7 + i) * 16)} 600 ${x + 120} ${f(800 + rnd(i, 95) * 300)}`, mix(CABLE_COLS[((i % 7) + 7) % 7], '#03060F', 0.45), 40, false) + G(P('M0 0 Q20 -30 50 -20 Q28 6 0 0 Z', ol('#2E7A4A', 4)), `translate(${x + 110} 420) rotate(-20)`)), 1.45);
  return layers(bg, mid, fg);
}

// ---------------------------------------------------------------- lost & found items
// lostItem(kind, x, y, s, rot) — kinds: tophat cap crown bellhop sword wings dog cat hammer wrench shield balloon
//   boombox wand skateboard headphones egg. (x, y) = item centre. 'bellhop' is the elevator operator cap for Pip.
function lostItem(kind, x, y, s = 1, rot = 0, t = 0) {
  let o = '';
  switch (kind) {
    case 'tophat': o = R(-50, -110, 100, 100, 10, ol('#2A2A38', 6)) + R(-50, -40, 100, 18, 0, { fill: '#E8504A' }) + R(-80, -16, 160, 24, 12, ol('#2A2A38', 6)) + R(-40, -100, 14, 60, 6, { fill: '#FFFFFF', opacity: 0.2 }); break;
    case 'cap': o = P('M-60 0 Q-60 -80 0 -80 Q60 -80 60 0 Z', ol('#3B8BFF', 6)) + P('M40 -6 L120 -6 Q120 10 40 10 Z', ol('#2A6ACC', 6)) + Ci(0, -80, 8, ol('#2A6ACC', 4)); break;
    case 'crown': o = P('M-70 0 L-70 -70 L-35 -30 L0 -90 L35 -30 L70 -70 L70 0 Z', ol('#FFD21F', 6)) + Ci(0, -20, 10, ol('#FF5A6E', 4)) + Ci(-40, -16, 8, ol('#3BD16F', 4)) + Ci(40, -16, 8, ol('#34C3FF', 4)); break;
    case 'bellhop': o = R(-56, -70, 112, 66, 14, ol('#E8504A', 6)) + R(-56, -28, 112, 16, 0, { fill: '#FFD21F', stroke: LINE, 'stroke-width': 4 }) + P('M-60 -2 Q0 18 70 -2 L70 8 Q0 30 -60 8 Z', ol('#1D1D24', 5)) + Ci(0, -50, 9, ol('#FFD21F', 4)) + R(-40, -64, 18, 30, 6, { fill: '#FFFFFF', opacity: 0.25 }); break;
    case 'sword': o = P('M0 -150 L18 -120 L14 20 L-14 20 L-18 -120 Z', ol('#C9D6E8', 6)) + P('M0 -140 L0 10', ln(4, '#FFFFFF', 0.7)) + R(-50, 18, 100, 20, 8, ol('#3B8BFF', 5)) + R(-11, 36, 22, 54, 6, ol('#8A5A33', 5)) + Ci(0, 96, 12, ol('#FFD21F', 4)); break;
    case 'wings': for (const sx of [-1, 1]) o += G(P('M0 0 Q30 -90 120 -100 Q100 -70 110 -50 Q80 -40 90 -14 Q50 -10 40 10 Q20 0 0 0 Z', ol('#FFFFFF', 6)) + P('M20 -20 Q60 -60 100 -80', ln(4, '#BFD3E8')), `scale(${sx} 1)`); break;
    case 'dog': o = R(-60, -50, 110, 60, 18, ol('#FF9F1C', 6)) + R(30, -100, 70, 64, 16, ol('#FF9F1C', 6)) + R(28, -110, 20, 30, 6, ol('#C96A10', 4)) + R(82, -110, 20, 30, 6, ol('#C96A10', 4)) + Ci(52, -72, 6, { fill: '#151515' }) + Ci(78, -72, 6, { fill: '#151515' }) + R(58, -60, 16, 10, 4, { fill: '#151515' }) + R(-50, 6, 20, 26, 5, ol('#FF9F1C', 4)) + R(20, 6, 20, 26, 5, ol('#FF9F1C', 4)) + P(`M-60 -40 Q-90 ${f(-70 + Math.sin(t * 8) * 10)} -84 -84`, ln(10)) + P(`M-60 -40 Q-90 ${f(-70 + Math.sin(t * 8) * 10)} -84 -84`, ln(5, '#FF9F1C')); break;
    case 'cat': o = R(-50, -50, 100, 56, 18, ol('#B06BFF', 6)) + R(-36, -110, 76, 66, 18, ol('#B06BFF', 6)) + P('M-34 -100 L-26 -134 L-8 -108 Z M38 -100 L30 -134 L12 -108 Z', ol('#B06BFF', 5)) + Ci(-12, -80, 6, { fill: '#151515' }) + Ci(16, -80, 6, { fill: '#151515' }) + P('M-4 -66 L2 -62 L8 -66', ln(4)); break;
    case 'hammer': o = R(-10, -40, 20, 130, 6, ol('#C98B4A', 5)) + R(-60, -80, 120, 46, 10, ol('#9AA6B8', 6)); break;
    case 'wrench': o = P('M-12 -60 L12 -60 L12 70 L-12 70 Z', ol('#9AA6B8', 5)) + P('M-36 -70 Q-36 -110 0 -110 Q36 -110 36 -70 L14 -70 L14 -94 L-14 -94 L-14 -70 Z', ol('#9AA6B8', 5)); break;
    case 'shield': o = P('M-60 -80 L60 -80 L56 10 Q40 70 0 90 Q-40 70 -56 10 Z', ol('#3B8BFF', 6)) + P('M0 -60 L0 70 M-44 -10 L44 -10', ln(12, '#FFD21F')); break;
    case 'balloon': o = P(`M0 30 Q${f(Math.sin(t * 2) * 10)} 100 0 160`, ln(3)) + Ell(0, -30, 50, 62, ol('#FF6FB5', 6)) + P('M-8 30 L8 30 L0 40 Z', { fill: '#FF6FB5', stroke: LINE, 'stroke-width': 3 }) + Ell(-16, -50, 10, 16, { fill: '#FFFFFF', opacity: 0.6 }); break;
    case 'boombox': o = R(-90, -60, 180, 100, 16, ol('#3A3F55', 6)) + Ci(-50, -10, 30, ol('#22252F', 5)) + Ci(50, -10, 30, ol('#22252F', 5)) + R(-30, -50, 60, 20, 4, { fill: '#7CF7FF' }) + P('M-60 -60 Q0 -110 60 -60', ln(8)); break;
    case 'wand': o = P('M-60 60 L40 -40', ln(16)) + P('M-60 60 L40 -40', ln(9, '#8A5A33')) + K.F.sparkle(50, -50, 34); break;
    case 'skateboard': o = R(-110, -14, 220, 28, 14, ol('#FF5A5A', 6)) + Ci(-70, 22, 14, ol('#FFD21F', 4)) + Ci(70, 22, 14, ol('#FFD21F', 4)); break;
    case 'headphones': o = P('M-50 10 Q-50 -70 0 -70 Q50 -70 50 10', ln(18)) + P('M-50 10 Q-50 -70 0 -70 Q50 -70 50 10', ln(10, '#46F58C')) + R(-70, -10, 34, 50, 12, ol('#22252F', 5)) + R(36, -10, 34, 50, 12, ol('#22252F', 5)); break;
    case 'egg': o = Ell(0, -50, 46, 60, ol('#FFE14D', 6)) + P('M-40 -50 L-20 -66 L0 -50 L20 -66 L40 -50', ln(5, '#FF6FB5')); break;
    default: o = R(-40, -40, 80, 80, 10, ol('#9AA3B2', 6));
  }
  return G(o, `translate(${f(x)} ${f(y)}) rotate(${f(rot)}) scale(${f(s)})`);
}
const LOST_KINDS = ['tophat', 'crown', 'sword', 'wings', 'dog', 'cap', 'shield', 'cat', 'hammer', 'balloon', 'boombox', 'egg', 'wrench', 'headphones', 'wand', 'skateboard'];
// a heap: mound filled with the junk texture + items on its crest
function heap(x, base, w, h, t, seed, nItems = 6, dark = 0) {
  const d = `M${f(x - w)} ${f(base + 30)} Q${f(x - w * 0.8)} ${f(base - h * 0.55)} ${f(x - w * 0.35)} ${f(base - h * 0.85)} Q${f(x)} ${f(base - h * 1.08)} ${f(x + w * 0.35)} ${f(base - h * 0.85)} Q${f(x + w * 0.8)} ${f(base - h * 0.55)} ${f(x + w)} ${f(base + 30)} Z`;
  let o = P(d, { fill: 'url(#farmJunk)', stroke: LINE, 'stroke-width': 7 });
  o += P(d, { fill: 'url(#farmHeapShade)' });
  if (dark > 0) o += P(d, { fill: '#0B1030', 'fill-opacity': f(dark) });
  for (let i = 0; i < nItems; i++) {
    const u = (i + 0.5) / nItems * 2 - 1;
    const ix = x + u * w * 0.8, iy = base - h * (1 - u * u * 0.75) * 0.95 + 20;
    o += lostItem(LOST_KINDS[Math.floor(rnd(i, seed) * LOST_KINDS.length)], ix, iy, 0.55 + rnd(i, seed + 1) * 0.3, (rnd(i, seed + 2) - 0.5) * 60, t + i);
  }
  return o;
}
// lostAndFound(t, cam, opts) — Floor 2½: mountains of lost items. Floor FLOOR.lost = 920. opts: dist, lamp (default 1)
function lostAndFound(t, cam, opts = {}) {
  const { dist = 0, lamp = 1 } = opts;
  let bg = fullRect(cam, 0, { fill: '#1A1640' });
  // back wall: shelves of labelled boxes (pattern) + a few readable labels
  const v2 = vis(cam, 0.2), off2 = dist * 0.2;
  let sh = G(R(v2.x0 + off2 - 300, 150, v2.x1 - v2.x0 + 600, 640, 0, { fill: 'url(#farmBoxes)' }), `translate(${f(-off2)} 0)`);
  const labels = ['HATS', 'PETS', 'SWORDS', 'WINGS', 'TOOLS', '???', 'SOCKS', 'KEYS'];
  sh += strip(cam, 0.2, dist, 525, (i, x) => TF(labels[((i % 8) + 8) % 8], x + 87, 197, 20, '#3A2A20') + TF(labels[((i * 3 + 2) % 8 + 8) % 8], x + 437, 357, 20, '#3A2A20'));
  bg += V(cam, sh + band(cam, 0.2, 790, 1400, { fill: '#120E30' }) + band(cam, 0.2, 100, 150, { fill: '#120E30' }), 0.2);
  // hanging sign (k .5)
  bg += V(cam, strip(cam, 0.5, dist, 2600, (i, x) => P(`M${x + 700} -100 L${x + 700} 120 M${x + 1200} -100 L${x + 1200} 120`, ln(6, '#5A5A8A')) + R(x + 620, 110, 660, 170, 24, ol('#FFD21F', 8)) + outT('LOST & FOUND', x + 950, 205, 82, '#FFFFFF', 10) + TF('FLOOR 2½', x + 950, 256, 34, '#3A2A20')), 0.5);
  // far + mid heaps
  bg += V(cam, strip(cam, 0.45, dist, 900, (i, x) => heap(x + 450, 860, 420 + rnd(i, 101) * 200, 380 + rnd(i, 102) * 200, t, i + 7, 0, 0.5)), 0.45);
  bg += V(cam, band(cam, 0.7, 880, 1400, { fill: '#2A2460' }) + strip(cam, 0.7, dist, 1300, (i, x) => heap(x + 400, 900, 380 + rnd(i, 103) * 140, 330 + rnd(i, 104) * 160, t, i + 30, 3, 0.2)), 0.7);
  // floor + near heaps + counter (k 1)
  let m = band(cam, 1, FLOOR.lost, 1600, { fill: '#5A4A7A' }) + band(cam, 1, FLOOR.lost, FLOOR.lost + 10, { fill: '#7A6A9A' }) + band(cam, 1, FLOOR.lost, 1600, { fill: 'url(#farmFloorTile)', opacity: 0.6 });
  m += strip(cam, 1, dist, 2000, (i, x) => {
    let o = heap(x + 200, FLOOR.lost + 20, 360, 300, t, i + 60, 5);
    o += R(x + 900, FLOOR.lost - 200, 420, 200, 10, ol('#C98B4A', 7)) + R(x + 880, FLOOR.lost - 220, 460, 30, 8, ol('#E8B37A', 6)) + R(x + 960, FLOOR.lost - 160, 300, 80, 10, ol('#FFF4DC', 5)) + TF('RING FOR', x + 1110, FLOOR.lost - 128, 28, '#3A2A20') + TF('SERVICE', x + 1110, FLOOR.lost - 96, 28, '#E8504A');
    o += Ell(x + 1260, FLOOR.lost - 220, 32, 7, { fill: '#9AA3B2' }) + P(`M${x + 1232} ${FLOOR.lost - 222} Q${x + 1232} ${FLOOR.lost - 262} ${x + 1260} ${FLOOR.lost - 264} Q${x + 1288} ${FLOOR.lost - 262} ${x + 1288} ${FLOOR.lost - 222} Z`, ol('#FFD21F', 5));
    o += lostItem('balloon', x + 1000, FLOOR.lost - 380, 1, 0, t) + lostItem('boombox', x + 1500, FLOOR.lost - 50, 0.9, -6, t) + heap(x + 1800, FLOOR.lost + 20, 260, 200, t, i + 90, 3);
    return o;
  });
  if (lamp > 0) m += strip(cam, 1, dist, 1000, (i, x) => P(`M${x + 500} -100 L${x + 500} 120`, ln(5, '#5A5A8A')) + P(`M${x + 450} 160 Q${x + 500} 100 ${x + 550} 160 Z`, ol('#FFB238', 5)) + P(`M${x + 455} 160 L${x + 545} 160 L${x + 700} ${FLOOR.lost} L${x + 300} ${FLOOR.lost} Z`, { fill: 'url(#farmConeDown)', opacity: f(0.18 * lamp) }) + Ell(x + 500, FLOOR.lost + 20, 220, 30, { fill: '#FFE9A8', 'fill-opacity': f(0.15 * lamp) }));
  const mid = V(cam, m, 1);
  const fg = V(cam, strip(cam, 1.4, dist, 1100, (i, x) => lostItem(LOST_KINDS[(((i * 5) % 16) + 16) % 16], x + 200, 1070, 1.5, (rnd(i, 105) - 0.5) * 50, t) + (rnd(i, 106) > 0.5 ? lostItem(LOST_KINDS[(((i * 3 + 7) % 16) + 16) % 16], x + 700, 1100, 1.3, (rnd(i, 107) - 0.5) * 60, t) : '')), 1.4);
  return layers(bg, mid, fg);
}

// ---------------------------------------------------------------- game bubbles
// gameBubble(x, y, r, t, opts) — a glowing bubble with a tiny game world inside.
// opts: label ('Bubble Island — 3 visits'), grey 0..1 (grey + cracks), glow 0..1, kind
//   ('island' (default; has mini bubbles = Bubble Island), 'obby', 'city', 'tycoon', 'race', 'space', 'farm', 'castle', 'pet'), crack 0..1, seed
const BUBBLE_KINDS = ['island', 'obby', 'city', 'tycoon', 'race', 'space', 'farm', 'castle', 'pet'];
function bubbleWorld(kind, r, t, grey) {
  const g = (c) => (grey ? mix(c, '#8A93A6', 0.85) : c);
  const sw = Math.max(1.5, r * 0.035);
  const sk = { space: '#1A1446', castle: '#B8A8FF', pet: '#FFD6E8' }[kind] || '#8FD8FF';
  let o = Ci(0, 0, r * 0.97, { fill: g(sk) });
  const seg = (y0, col) => { const x0 = Math.sqrt(Math.max(0, r * r * 0.94 - y0 * y0)); return P(`M${f(-x0)} ${f(y0)} A${f(r * 0.97)} ${f(r * 0.97)} 0 0 0 ${f(x0)} ${f(y0)} Z`, { fill: g(col) }); };
  const blk = (x, y, w, h, c, rr = 0.06) => R(x * r, y * r, w * r, h * r, r * rr, { fill: g(c), stroke: LINE, 'stroke-width': sw });
  switch (kind) {
    case 'space':
      for (let i = 0; i < 6; i++) o += Ci((rnd(i, 3) - 0.5) * r * 1.2, (rnd(i, 4) - 0.5) * r * 1.2, r * 0.035, { fill: '#FFFFFF' });
      o += Ci(-r * 0.15, r * 0.1, r * 0.32, { fill: g('#FF9F1C'), stroke: LINE, 'stroke-width': sw }) + Ell(-r * 0.15, r * 0.1, r * 0.55, r * 0.11, { fill: 'none', stroke: g('#FFD21F'), 'stroke-width': r * 0.06 }) + Ci(r * 0.42, -r * 0.4, r * 0.12, { fill: g('#B06BFF') });
      return o;
    case 'island':
      o += seg(r * 0.28, '#3BA7E0') + Ell(0, r * 0.3, r * 0.55, r * 0.16, { fill: g('#46D17A'), stroke: LINE, 'stroke-width': sw }) + Ell(0, r * 0.24, r * 0.3, r * 0.07, { fill: g('#F4D98A') });
      o += P(`M${f(-r * 0.02)} ${f(r * 0.26)} Q${f(r * 0.06)} ${f(-r * 0.05)} ${f(-r * 0.04)} ${f(-r * 0.3)}`, ln(r * 0.08, g('#8A5A33'))) + Ci(-r * 0.04, -r * 0.36, r * 0.2, { fill: g('#2FAE6E'), stroke: LINE, 'stroke-width': sw });
      for (const [bx, by, br] of [[-0.55, -0.3, 0.14], [0.5, -0.15, 0.12], [0.32, -0.6, 0.09]]) o += Ci(bx * r, by * r, br * r, { fill: '#FFFFFF', 'fill-opacity': 0.25, stroke: g('#E8FDFF'), 'stroke-width': r * 0.025 }) + Ell(bx * r, (by + br * 0.35) * r, br * r * 0.5, br * r * 0.2, { fill: g('#46D17A') });
      return o;
    case 'obby':
      o += seg(r * 0.55, '#FF5A5A');
      ['#FF5A5A', '#FFB000', '#3BD16F', '#3B8BFF'].forEach((c, i) => { o += blk(-0.7 + i * 0.36, 0.22 - i * 0.2, 0.28, 0.12, c); });
      o += P(`M${f(r * 0.48)} ${f(-r * 0.4)} L${f(r * 0.48)} ${f(-r * 0.72)}`, ln(sw * 1.4)) + P(`M${f(r * 0.48)} ${f(-r * 0.72)} L${f(r * 0.7)} ${f(-r * 0.62)} L${f(r * 0.48)} ${f(-r * 0.52)} Z`, { fill: g('#46F58C') });
      return o;
    case 'city':
      o += seg(r * 0.5, '#5A5466');
      ['#FFB4C8', '#FFE38A', '#C9D6FF', '#B9F0D2'].forEach((c, i) => { const hh = 0.5 + rnd(i, 9) * 0.35; o += blk(-0.62 + i * 0.31, 0.5 - hh, 0.27, hh, c, 0.04) + R((-0.56 + i * 0.31) * r, (0.58 - hh) * r, r * 0.07, r * 0.07, 1, { fill: g('#FFF6C8') }); });
      return o;
    case 'tycoon':
      o += seg(r * 0.45, '#7BCB3A') + blk(-0.5, -0.05, 0.75, 0.5, '#9AA6C0') + blk(0.05, -0.45, 0.16, 0.42, '#E8504A', 0.03) + Ci(r * 0.13, -r * 0.62, r * 0.1, { fill: '#FFFFFF', 'fill-opacity': 0.8 }) + Ci(r * 0.45, r * 0.05, r * 0.15, { fill: g('#FFC93C'), stroke: LINE, 'stroke-width': sw });
      return o;
    case 'race':
      o += seg(r * 0.2, '#5A5466') + R(-r, r * 0.38, r * 2, r * 0.05, 0, { fill: g('#FFFFFF') }) + blk(-0.35, -0.05, 0.6, 0.2, '#E8504A', 0.08) + Ci(-r * 0.2, r * 0.17, r * 0.09, { fill: '#151515' }) + Ci(r * 0.12, r * 0.17, r * 0.09, { fill: '#151515' });
      o += R(r * 0.5, -r * 0.5, r * 0.2, r * 0.2, 0, { fill: '#FFFFFF', stroke: LINE, 'stroke-width': sw }) + R(r * 0.5, -r * 0.5, r * 0.1, r * 0.1, 0, { fill: '#151515' }) + R(r * 0.6, -r * 0.4, r * 0.1, r * 0.1, 0, { fill: '#151515' });
      return o;
    case 'farm':
      o += seg(r * 0.3, '#7BCB3A') + blk(-0.4, -0.15, 0.42, 0.45, '#E8504A', 0.03) + P(`M${f(-r * 0.46)} ${f(-r * 0.15)} L${f(-r * 0.19)} ${f(-r * 0.44)} L${f(r * 0.08)} ${f(-r * 0.15)} Z`, { fill: g('#FFFFFF'), stroke: LINE, 'stroke-width': sw }) + Ci(r * 0.4, r * 0.1, r * 0.13, { fill: g('#FFFFFF'), stroke: LINE, 'stroke-width': sw });
      return o;
    case 'castle':
      o += seg(r * 0.45, '#46D17A') + blk(-0.45, -0.15, 0.9, 0.6, '#C9CED8', 0.02) + blk(-0.55, -0.45, 0.25, 0.9, '#AEB6C2', 0.02) + blk(0.3, -0.45, 0.25, 0.9, '#AEB6C2', 0.02) + blk(-0.1, 0.1, 0.2, 0.35, '#8A5A33', 0.08);
      o += P(`M${f(r * 0.42)} ${f(-r * 0.45)} L${f(r * 0.42)} ${f(-r * 0.75)}`, ln(sw * 1.3)) + P(`M${f(r * 0.42)} ${f(-r * 0.75)} L${f(r * 0.62)} ${f(-r * 0.67)} L${f(r * 0.42)} ${f(-r * 0.59)} Z`, { fill: g('#FF5A5A') });
      return o;
    case 'pet':
      o += seg(r * 0.45, '#FF9FC8') + blk(-0.42, -0.35, 0.84, 0.72, '#FF9F1C', 0.18) + blk(-0.42, -0.55, 0.22, 0.26, '#FF9F1C', 0.06) + blk(0.2, -0.55, 0.22, 0.26, '#FF9F1C', 0.06);
      o += Ci(-r * 0.17, -r * 0.05, r * 0.08, { fill: '#151515' }) + Ci(r * 0.17, -r * 0.05, r * 0.08, { fill: '#151515' }) + P(`M${f(-r * 0.1)} ${f(r * 0.14)} Q0 ${f(r * 0.22)} ${f(r * 0.1)} ${f(r * 0.14)}`, ln(sw * 1.2));
      return o;
    default:
      return o + seg(r * 0.3, '#3BA7E0');
  }
}
function gameBubble(x, y, r, t, opts = {}) {
  const { label = '', grey = 0, glow = 0, kind = 'island', crack = grey > 0.5 ? 1 : 0, seed = 0, bob = true } = opts;
  const by = bob ? Math.sin(t * 1.6 + seed * 1.7) * r * 0.06 : 0;
  const gr = grey > 0.5;
  let o = '';
  if (glow > 0) o += Ci(0, 0, r * 1.7, { fill: `url(#${gr ? 'farmGlowWhite' : 'farmGlowBlue'})`, opacity: f(glow * (0.7 + 0.3 * Math.sin(t * 3 + seed))) });
  o += bubbleWorld(kind, r, t + seed, gr);
  o += Ci(0, 0, r, { fill: `url(#${gr ? 'farmBubbleGrey' : 'farmBubble'})`, stroke: gr ? '#6A7080' : '#151515', 'stroke-width': Math.max(3, r * 0.06) });
  o += Ci(0, 0, r * 0.9, { fill: 'none', stroke: gr ? '#B4BBC8' : '#C9FBFF', 'stroke-width': Math.max(2, r * 0.04), 'stroke-opacity': 0.8 });
  o += P(`M${f(-r * 0.62)} ${f(-r * 0.3)} Q${f(-r * 0.5)} ${f(-r * 0.7)} ${f(-r * 0.08)} ${f(-r * 0.78)}`, ln(Math.max(3, r * 0.1), '#FFFFFF', 0.85)) + Ci(r * 0.48, -r * 0.5, r * 0.07, { fill: '#FFFFFF', 'fill-opacity': 0.8 });
  if (crack > 0) o += P(`M${f(r * 0.15)} ${f(-r)} L${f(r * 0.02)} ${f(-r * 0.45)} L${f(r * 0.32)} ${f(-r * 0.2)} L${f(r * 0.1)} ${f(r * 0.25)} M${f(r * 0.02)} ${f(-r * 0.45)} L${f(-r * 0.3)} ${f(-r * 0.3)}`, { ...ln(Math.max(3, r * 0.06), '#151515'), opacity: f(crack) });
  let out = G(o, `translate(${f(x)} ${f(y + by)})`);
  if (label) {
    const fs = Math.max(16, r * 0.3), w = label.length * fs * 0.52 + fs * 1.4;
    out += R(x - w / 2, y + r * 1.12, w, fs * 1.6, fs * 0.4, ol(gr ? '#C8CED8' : '#FFF4DC', Math.max(3, r * 0.05))) + TF(label, x, y + r * 1.12 + fs * 1.15, fs, gr ? '#5A6070' : '#3A2A20');
  }
  return out;
}

// ---------------------------------------------------------------- archive(t, cam, opts)
// Floor 3: an endless hall of shelves where every game floats in a bubble.
// view 'side' (default, pans): floor FLOOR.archive = 900; shelf planks (bubbles sit on) ARCHIVE.tiers y 330 / 560 / 790.
//   ARCHIVE.juno = {x: 990, y: 738, r: 44} is Juno's tiny 'Bubble Island — 3 visits' bubble on the bottom shelf (k 1).
//   opts.greyFrom 0..1: world x from which bubbles are grey and cracked = lerp(ARCHIVE.x0, ARCHIVE.x1, greyFrom)
//   (default 1 = none); opts.greyX overrides in px. Cracked grey bubbles float up into the dark at the far end.
// view 'deep': one-point perspective down the endless hall (vanishing point 960, 430); greyFrom = depth fraction
//   beyond which bubbles are grey; a loading wheel spins in the darkness at the end. Floor at the near edge ≈ 1000.
// opts: glow 0..1 (default .8), dist, juno (default true: draw Juno's labelled bubble), label (override)
const ARCHIVE = { x0: -800, x1: 3600, tiers: [330, 560, 790], juno: { x: 990, y: 738, r: 44 } };
function archive(t, cam, opts = {}) {
  if (opts.view === 'deep') return archiveDeep(t, cam, opts);
  const { greyFrom = 1, glow = 0.8, dist = 0, juno = true, label = 'Bubble Island — 3 visits' } = opts;
  const greyX = opts.greyX ?? lerp(ARCHIVE.x0, ARCHIVE.x1, greyFrom);
  let bg = fullRect(cam, 0, { fill: '#05081A' });
  let mo = '';
  for (let i = 0; i < 26; i++) mo += Ci(rnd(i, 111) * 2200 - 140, rnd(i, 112) * 900 + Math.sin(t * 0.5 + i) * 20, 2 + rnd(i, 113) * 3, { fill: '#9FF3FF', 'fill-opacity': f(0.3 + 0.4 * Math.abs(Math.sin(t + i))) });
  bg += V(cam, mo, 0.05);
  // a tier of shelved bubbles: tile band aligned so the plank sits at y; split grey/colour at gx (layer x)
  const tier = (cam2, k, y, gx, big, alt = false) => {
    const v = vis(cam2, k), h = big ? 200 : 100, left = v.x0 - 300, right = v.x1 + 300, split = clamp(gx, left, right);
    const pat = big ? (alt ? 'farmShelfB' : 'farmShelf') : 'farmShelfSm';
    let o = '';
    if (split > left) o += G(R(left, 0, split - left, h, 0, { fill: `url(#${pat})` }), `translate(0 ${f(y - h * 0.88)})`);
    if (right > split) o += G(R(split, 0, right - split, h, 0, { fill: `url(#${big ? 'farmShelfGrey' : 'farmShelfSmGrey'})` }), `translate(0 ${f(y - h * 0.88)})`);
    return o;
  };
  const gl = (k) => greyX * k + (1 - k) * 960;
  // far shelves (k .25): many small tiers climbing into the dark
  let far = '';
  for (let i = 0; i < 7; i++) far += tier(cam, 0.25, 760 - i * 120, gl(0.25), false);
  bg += V(cam, far + band(cam, 0.25, -400, 1400, { fill: '#05081A', 'fill-opacity': 0.55 }) + band(cam, 0.25, -400, 500, { fill: 'url(#farmFadeUp)' }) + band(cam, 0.25, 770, 1400, { fill: '#05081A' }), 0.25);
  // mid shelves (k .55)
  let md = '';
  for (let i = 0; i < 4; i++) md += tier(cam, 0.55, 780 - i * 230, gl(0.55), true, i % 2 === 1);
  bg += V(cam, md + band(cam, 0.55, -400, 1400, { fill: '#070B22', 'fill-opacity': 0.45 }) + band(cam, 0.55, -400, 260, { fill: 'url(#farmFadeUp)' }) + band(cam, 0.55, 800, 1400, { fill: '#070B22' }) + strip(cam, 0.55, dist, 880, (i, x) => R(x, -300, 18, 1100, 4, { fill: '#2A2050' })), 0.55);
  // main shelving unit (k 1): planks at ARCHIVE.tiers
  let m = band(cam, 1, 120, 820, { fill: '#0B0A26' });
  ARCHIVE.tiers.forEach((ty, i) => { m += tier(cam, 1, ty, greyX, true, i % 2 === 0) + band(cam, 1, ty + 24, ty + 34, { fill: '#1A1440' }); });
  m += band(cam, 1, -400, 250, { fill: 'url(#farmFadeUp)' });
  m += strip(cam, 1, dist, 660, (i, x) => R(x, -300, 26, 1130, 6, ol('#3A2C5A', 5)) + R(x + 5, -300, 6, 1130, 3, { fill: '#8E6BD8', 'fill-opacity': 0.6 }) + R(x - 74, 726, 174, 34, 8, ol('#FFF4DC', 4)) + TF(['OBBIES A–Z', 'TYCOONS', 'SIMULATORS', 'ISLANDS', 'RACING', 'HANGOUTS'][((i % 6) + 6) % 6], x + 13, 750, 19, '#3A2A20'));
  // floor
  m += band(cam, 1, 820, FLOOR.archive, { fill: '#160F38' }) + band(cam, 1, 812, 826, { fill: '#3A2C5A' });
  m += band(cam, 1, FLOOR.archive, 1600, { fill: '#0E1238' }) + band(cam, 1, FLOOR.archive, FLOOR.archive + 8, { fill: '#8E6BD8', 'fill-opacity': 0.6 }) + band(cam, 1, FLOOR.archive + 8, 1150, { fill: 'url(#farmReflect)', opacity: 0.3 });
  if (juno) {
    const J = ARCHIVE.juno, g = J.x > greyX ? 1 : 0;
    if (!g) m += P(`M${J.x - 50} -100 L${J.x + 50} -100 L${J.x + 150} ${J.y + J.r} L${J.x - 150} ${J.y + J.r} Z`, { fill: 'url(#farmConeDown)', opacity: f(0.35 * glow) });
    m += Ell(J.x, J.y + J.r + 6, 54, 12, ol('#E0B84A', 4)) + gameBubble(J.x, J.y, J.r, t, { kind: 'island', glow: g ? 0 : Math.max(glow, 0.9), grey: g, seed: 3, bob: false });
    if (label) { const w = label.length * 13 + 40; m += R(J.x - w / 2, J.y + J.r + 22, w, 40, 10, ol(g ? '#C8CED8' : '#FFF4DC', 4)) + TF(label, J.x, J.y + J.r + 50, 24, g ? '#5A6070' : '#3A2A20'); }
  }
  // greying end: cracked bubbles drifting up into a loading wheel in the dark
  const v1 = vis(cam, 1);
  let gr = '';
  if (greyX < v1.x1 + 400) {
    const gx0 = Math.max(greyX, v1.x0 - 200);
    gr += R(gx0, -400, v1.x1 - gx0 + 400, 1300, 0, { fill: '#9AA3B2', 'fill-opacity': 0.08 });
    for (let i = 0; i < 6; i++) {
      const a = ((t * 0.08 + i / 6) % 1);
      const bx = gx0 + 140 + rnd(i, 121) * 700 + a * 220, by = 760 - a * 960;
      gr += G(gameBubble(bx, by, 36 + rnd(i, 122) * 22, t, { grey: 1, kind: BUBBLE_KINDS[i % 7], seed: i, bob: false }), `rotate(${f(a * 40 * (i % 2 ? 1 : -1))} ${f(bx)} ${f(by)})`, { opacity: f(1 - a * a) });
    }
    const wx = Math.max(greyX + 520, v1.x1 - 320);
    gr += Ci(wx, 110, 190, { fill: '#000', 'fill-opacity': 0.55 }) + K.loadingWheel(wx, 110, 92, t, '#9AA3B2', 10, 22, 0.8);
  }
  const mid = V(cam, m + gr, 1);
  // foreground drifting bubbles
  let fgb = '';
  for (let i = 0; i < 3; i++) {
    const x = ((rnd(i, 131) * 2600 + t * 30 * (i + 1) - dist * 1.4) % 2600 + 2600) % 2600 - 300, y = 200 + rnd(i, 132) * 500 + Math.sin(t * 0.8 + i) * 30;
    fgb += Ci(x, y, 70 + i * 30, { fill: 'url(#farmBubble)', stroke: '#C9FBFF', 'stroke-width': 4, opacity: 0.7 }) + P(`M${f(x - 40 - i * 10)} ${f(y - 20)} Q${f(x - 30)} ${f(y - 60 - i * 10)} ${f(x)} ${f(y - 66 - i * 18)}`, ln(6, '#FFFFFF', 0.6));
  }
  return layers(bg, mid, V(cam, fgb, 1.4));
}
function archiveDeep(t, cam, opts = {}) {
  const { greyFrom = 1, glow = 0.8 } = opts;
  const vx = 960, vy = 430, N = 14, WALL = 1150, EYE = 640;
  const proj = (X, Y, z) => [vx + X / z, vy + (EYE - Y) / z];
  const quad = (pts, a) => P(poly(pts), a);
  let o = R(-400, -400, 2720, 1900, 0, { fill: '#05081A' });
  // floor + aisle runner
  o += P(`M${vx} ${vy} L2400 1300 L-480 1300 Z`, { fill: '#0E1238' }) + P(`M${vx - 4} ${vy} L${vx + 4} ${vy} L1180 1300 L740 1300 Z`, { fill: '#8E6BD8', 'fill-opacity': 0.35 });
  // side walls (back panels of the shelving)
  for (const side of [-1, 1]) {
    const [a1, b1] = proj(side * (WALL + 260), 1500, 0.9), [a2, b2] = proj(side * (WALL + 260), 1500, 60), [a3, b3] = proj(side * (WALL + 260), -60, 60), [a4, b4] = proj(side * (WALL + 260), -60, 0.9);
    o += quad([[a1, b1], [a2, b2], [a3, b3], [a4, b4]], { fill: '#0B0A26' });
  }
  // the dark end: grey haze + loading wheel
  if (greyFrom < 1) o += Ci(vx, vy, 260, { fill: 'url(#farmGlowWhite)', opacity: f(0.18 * (1 - greyFrom)) }) + Ci(vx, vy, 46, { fill: '#000' }) + K.loadingWheel(vx, vy, 30, t, '#C8CED8', 10, 7, 0.8);
  const TIERS = [120, 470, 820];
  for (let zi = N; zi >= 1; zi--) {
    const z = 0.6 + (zi - 1) * 0.9, z2 = z + 0.9;
    const dep = (zi - 1) / (N - 1);
    const isGrey = dep > greyFrom;
    const fade = clamp(1.1 - dep, 0.12, 1);
    for (const side of [-1, 1]) {
      const X = side * WALL, Xb = side * (WALL + 260);
      // planks: top face quad between depth z and z2, from the wall (Xb) to the front edge (X)
      for (const Y of TIERS) {
        const p1 = proj(X, Y, z), p2 = proj(X, Y, z2), p3 = proj(Xb, Y, z2), p4 = proj(Xb, Y, z);
        const q1 = proj(X, Y - 26, z), q2 = proj(X, Y - 26, z2);
        o += quad([p1, p2, q2, q1], { fill: isGrey ? '#3A3F4E' : '#5A3A9A', 'fill-opacity': f(fade) });
        o += quad([p1, p2, p3, p4], { fill: isGrey ? '#2A2E3A' : '#3A2770', 'fill-opacity': f(fade) });
      }
      const [px, py0] = proj(X, 1300, z), [, py1] = proj(X, -60, z);
      o += P(`M${f(px)} ${f(py0)} L${f(px)} ${f(py1)}`, ln(Math.max(2, 26 / z), '#2A2050', fade));
      // bubbles sitting on each plank
      for (const [j, Y] of TIERS.entries()) {
        const r = 125 / (z + 0.45);
        const [bx, by] = proj(X + side * 130, Y + 125, z + 0.45);
        const kind = BUBBLE_KINDS[(zi * 3 + j + (side > 0 ? 2 : 0)) % 7];
        if (z < 2.6) o += G(gameBubble(bx, by, r, t, { kind, grey: isGrey ? 1 : 0, glow: isGrey ? 0 : glow * 0.7, seed: zi * 7 + j }), null, fade < 0.99 ? { opacity: f(fade) } : {});
        else {
          const c = isGrey ? '#8A93A6' : ['#46D17A', '#FF6FB5', '#5CB8FF', '#FFD84D', '#B06BFF'][(zi + j) % 5];
          if (!isGrey && glow > 0 && zi % 2 === 0) o += Ci(bx, by, r * 1.7, { fill: 'url(#farmGlowBlue)', opacity: f(glow * fade * 0.5) });
          o += Ci(bx, by, r, { fill: '#1D3C7A', 'fill-opacity': f(fade), stroke: isGrey ? '#5A6070' : '#C9FBFF', 'stroke-width': Math.max(1.5, r * 0.08), 'stroke-opacity': f(fade) }) + Ci(bx, by + r * 0.25, r * 0.5, { fill: c, 'fill-opacity': f(fade * 0.9) }) + Ci(bx - r * 0.35, by - r * 0.38, r * 0.2, { fill: '#FFFFFF', 'fill-opacity': f(fade * 0.7) });
          if (isGrey) o += P(`M${f(bx)} ${f(by - r)} L${f(bx - r * 0.2)} ${f(by - r * 0.3)} L${f(bx + r * 0.2)} ${f(by)}`, ln(Math.max(1.5, r * 0.08), '#2A2F3A', fade));
        }
      }
    }
  }
  // grey bubbles drifting into the dark
  if (greyFrom < 1) for (let i = 0; i < 6; i++) {
    const a = ((t * 0.1 + i / 6) % 1), sx = (i % 2 ? 1 : -1) * (260 + rnd(i, 141) * 320);
    const x = lerp(vx + sx, vx, a * a), y = lerp(vy - 240 + rnd(i, 142) * 360, vy, a * a), r = lerp(36, 4, a);
    o += Ci(x, y, r, { fill: '#8A93A6', stroke: '#5A6070', 'stroke-width': 3, opacity: f(1 - a) }) + P(`M${f(x)} ${f(y - r)} L${f(x - r * 0.2)} ${f(y - r * 0.2)} L${f(x + r * 0.25)} ${f(y + r * 0.1)}`, ln(2.5, '#2A2F3A', 1 - a));
  }
  o += R(-400, -400, 2720, 560, 0, { fill: 'url(#farmFadeUp)' });
  return layers(V(cam, o, 1), '', '');
}

// ---------------------------------------------------------------- elevator panel: 400 buttons
// LIFT.panel = {x0, y0, cols: 20, rows: 20, cw: 20, ch: 28}; liftButton(i) → {x, y} centre of button i (0..399, row-major
// from the top-left; 400 = CLOSE DOOR, 401 = OPEN DOOR). Pip's combo: B9 = LIFT.B9, then up two = LIFT.B9 - 40.
const LIFT = { floor: 930, door: { x0: 700, x1: 1220, top: 300 }, panel: { x0: 1320, y0: 250, cols: 20, rows: 20, cw: 20, ch: 28 }, B9: 351 };
function liftButton(i, pan = LIFT.panel) {
  if (i === 400 || i === 'close') return { x: pan.x0 + pan.cols * pan.cw * 0.3, y: pan.y0 + pan.rows * pan.ch + 50 };
  if (i === 401 || i === 'open') return { x: pan.x0 + pan.cols * pan.cw * 0.7, y: pan.y0 + pan.rows * pan.ch + 50 };
  return { x: pan.x0 + (i % pan.cols) * pan.cw + pan.cw / 2, y: pan.y0 + Math.floor(i / pan.cols) * pan.ch + pan.ch / 2 + 3 };
}
// the panel in local coords (top-left at pan.x0, pan.y0): pattern grid + lit buttons + door buttons
function liftPanel(t, pressed = [], pan = LIFT.panel, lit = '#FFE14D') {
  const w = pan.cols * pan.cw, h = pan.rows * pan.ch;
  let o = R(pan.x0 - 24, pan.y0 - 60, w + 48, h + 150, 18, ol('#8E9AB0', 7)) + R(pan.x0 - 12, pan.y0 - 48, w + 24, 36, 8, { fill: '#1A2A1A' }) + TF('SERVICE · 400 FLOORS', pan.x0 + w / 2, pan.y0 - 22, 20, '#7CFF8A');
  o += G(R(0, 0, w, h, 0, { fill: 'url(#farmBtn)' }), `translate(${pan.x0} ${pan.y0})`);
  for (const i of pressed) {
    if (i === 400 || i === 401 || i === 'close' || i === 'open') continue;
    const b = liftButton(i, pan);
    o += Ci(b.x, b.y, 16, { fill: 'url(#farmGlowWarm)' }) + Ci(b.x, b.y, 7.5, { fill: lit, stroke: '#B07A10', 'stroke-width': 2 });
  }
  const cl = liftButton(400, pan), opn = liftButton(401, pan);
  const isOn = (k) => pressed.includes(k) || pressed.includes(k === 400 ? 'close' : 'open');
  for (const [b, k, ic] of [[cl, 400, 'M-14 -10 L-2 0 L-14 10 Z M14 -10 L2 0 L14 10 Z'], [opn, 401, 'M-2 -10 L-14 0 L-2 10 Z M2 -10 L14 0 L2 10 Z']]) {
    if (isOn(k)) o += Ci(b.x, b.y, 50, { fill: 'url(#farmGlowWarm)' });
    o += Ci(b.x, b.y, 28, ol(isOn(k) ? lit : '#E9EDF3', 5)) + G(P(ic, { fill: '#3A3F55' }), `translate(${f(b.x)} ${f(b.y)})`);
  }
  return o;
}
// serviceElevator(t, opts) — the service corridor dead end with the 400-button elevator.
// Layers: bg = corridor + elevator car interior; mid = sliding doors + frame + panel; fg = foreground pipe/edges.
// Order: bg + [characters INSIDE the car] + mid + [characters in the corridor] + fg. Floor LIFT.floor = 930.
// opts: doors 0..1 (open), pressed [indices], floor ('B9' indicator), alarm 0..1, flicker (default true), cam
function serviceElevator(t, opts = {}) {
  const { doors = 0, pressed = [], floor = 'B9', alarm = 0, flicker = true, cam = null } = opts;
  const { x0, x1, top } = LIFT.door;
  // corridor: back wall + side walls in perspective
  let bg = R(-400, -300, 2720, 1700, 0, { fill: '#1C2D63' }) + R(-400, -300, 2720, 1700, 0, { fill: 'url(#farmPanel)' });
  bg += P('M-400 -300 L300 120 L300 930 L-400 1400 Z', { fill: '#13204A', stroke: LINE, 'stroke-width': 7 }) + P('M2320 -300 L1760 120 L1760 930 L2320 1400 Z', { fill: '#13204A', stroke: LINE, 'stroke-width': 7 });
  bg += P('M-400 -300 L2320 -300 L1760 120 L300 120 Z', { fill: '#0B1433', stroke: LINE, 'stroke-width': 7 });
  // ceiling tube light (flickers)
  const fl = flicker && (Math.floor(t * 9) % 13 === 0 || Math.floor(t * 9) % 17 === 3) ? 0.25 : 1;
  bg += R(760, 40, 400, 26, 12, ol(mix('#3A4570', '#E8F8FF', fl), 5)) + P('M780 66 L1140 66 L1400 600 L520 600 Z', { fill: 'url(#farmConeBlue)', opacity: f(0.45 * fl) });
  // pipes along the walls
  bg += P('M-400 40 L300 250', ln(30)) + P('M-400 40 L300 250', ln(20, '#5A6A9A')) + P('M2320 60 L1760 240', ln(30)) + P('M2320 60 L1760 240', ln(20, '#FF9F1C'));
  bg += Ci(80, 184, 22, ol('#E8504A', 5)) + R(74, 160, 12, 22, 3, { fill: '#151515' });
  // floor
  bg += P('M300 930 L1760 930 L2320 1400 L-400 1400 Z', { fill: '#2A3550', stroke: LINE, 'stroke-width': 7 }) + P('M300 930 L1760 930 L2320 1400 L-400 1400 Z', { fill: 'url(#farmTiles)', opacity: 0.35 });
  bg += P(`M${x0 - 60} 940 L${x1 + 60} 940 L${x1 + 180} 1080 L${x0 - 180} 1080 Z`, { fill: 'url(#farmHazard)', opacity: 0.85, stroke: LINE, 'stroke-width': 5 });
  // signs + extinguisher + mop bucket on the back wall
  bg += R(330, 300, 250, 120, 14, ol('#FFC21F', 6)) + T('DEAD END', 455, 372, 46, '#1D1D24') + TF('(sorry)', 455, 404, 22, '#1D1D24');
  bg += R(420, 600, 60, 150, 26, ol('#E8504A', 6)) + R(436, 560, 28, 50, 6, ol('#3A3F55', 4)) + P('M464 580 Q500 590 494 640', ln(6));
  bg += P('M560 520 L640 900', ln(14)) + P('M560 520 L640 900', ln(8, '#D59A5C')) + R(612, 880, 64, 26, 8, ol('#8E99AC', 4)) + mopStrings(616, 902, t, 7, 30, 3, 1);
  bg += P('M440 930 L460 830 L560 830 L580 930 Z', ol('#FFD21F', 6)) + P('M460 830 Q510 790 560 830', ln(5)) + R(470, 860, 80, 26, 6, { fill: '#FFFFFF', 'fill-opacity': 0.35 });
  // elevator car interior (visible when the doors open)
  bg += R(x0, top, x1 - x0, LIFT.floor - top, 0, { fill: 'url(#farmWoodPanel)' }) + R(x0, top, x1 - x0, 60, 0, { fill: '#FFF4C8', opacity: 0.9 }) + R(x0, top + 360, x1 - x0, 18, 6, ol('#E0B84A', 4)) + R(x0, LIFT.floor - 40, x1 - x0, 40, 0, { fill: '#5A4A40' });
  bg += P(`M${x0} ${top + 60} L${x0 + 160} ${LIFT.floor} M${x0 + 80} ${top + 60} L${x0 + 260} ${LIFT.floor}`, ln(30, '#FFFFFF', 0.06));
  // mid: frame, doors, indicator, panel
  const cid = S.uid('farmLd');
  const dw = (x1 - x0) / 2, slide = dw * clamp(doors, 0, 1) * 0.96;
  let d = R(x0 - slide, top, dw, LIFT.floor - top, 0, { fill: 'url(#farmSteel)', stroke: LINE, 'stroke-width': 5 }) + R(x0 + dw + slide, top, dw, LIFT.floor - top, 0, { fill: 'url(#farmSteel)', stroke: LINE, 'stroke-width': 5 });
  d += R(x0 - slide + 30, top + 40, 40, LIFT.floor - top - 80, 6, { fill: '#FFFFFF', opacity: 0.18 }) + R(x0 + dw + slide + 30, top + 40, 40, LIFT.floor - top - 80, 6, { fill: '#FFFFFF', opacity: 0.18 });
  d += R(x0 - slide + dw - 60, top + 300, 40, 12, 4, { fill: '#5A6478' }) + R(x0 + dw + slide + 20, top + 300, 40, 12, 4, { fill: '#5A6478' });
  let mid = S.clipDef(cid, R(x0, top, x1 - x0, LIFT.floor - top)) + G(d, null, { 'clip-path': `url(#${cid})` });
  mid += P(`M${x0 - 50} ${LIFT.floor} L${x0 - 50} ${top - 50} L${x1 + 50} ${top - 50} L${x1 + 50} ${LIFT.floor} L${x1} ${LIFT.floor} L${x1} ${top} L${x0} ${top} L${x0} ${LIFT.floor} Z`, { fill: '#8E9AB0', stroke: LINE, 'stroke-width': 7 });
  mid += R(x0 - 50, top - 50, 40, LIFT.floor - top + 50, 0, { fill: 'url(#farmHazard)', opacity: 0.85 }) + R(x1 + 10, top - 50, 40, LIFT.floor - top + 50, 0, { fill: 'url(#farmHazard)', opacity: 0.85 });
  mid += P(`M${x0 - 50} ${LIFT.floor} L${x0 - 50} ${top - 50} L${x1 + 50} ${top - 50} L${x1 + 50} ${LIFT.floor}`, { fill: 'none', stroke: LINE, 'stroke-width': 7 });
  // floor indicator
  mid += R(860, top - 170, 200, 100, 16, ol('#22252F', 6)) + T(floor, 960, top - 98, 60, '#FF8A3D') + P('M880 -110 L895 -130 L910 -110 Z', { fill: '#FF8A3D', transform: `translate(0 ${top + 20})`, opacity: blink(t, 1) ? 1 : 0.3 });
  mid += R(900, top - 230, 120, 40, 10, ol('#FFC21F', 5)) + TF('SERVICE', 960, top - 202, 22, '#1D1D24');
  mid += Ci(1130, top - 120, 22, ol(doors > 0.05 && doors < 0.95 ? '#FFE14D' : '#C9D2E0', 5));
  mid += liftPanel(t, pressed);
  let fg = '';
  if (alarm > 0) fg += beacon(300, 160, t, alarm) + beacon(1760, 160, t + 0.5, alarm) + fullRect(cam, 1, { fill: RED, opacity: f(alarm * (0.1 + 0.06 * Math.sin(t * 11))) });
  return layers(V(cam, bg, 1), V(cam, mid, 1), fg ? V(cam, fg, 1) : '');
}
// elevatorInside(t, opts) — inside the car, looking at the back wall (characters face camera).
// Floor y where feet go: LIFTIN.floor = 900 (back wall base 820, the floor runs to the bottom of the frame).
// opts: muzak 0..1 (floating notes), floor ('B9'), pressed [indices] (side panel), shake 0..1, light (default 1), cam
const LIFTIN = { floor: 900, panel: { x0: 1588, y0: 300, cols: 10, rows: 20, cw: 14, ch: 22 } };
function elevatorInside(t, opts = {}) {
  const { muzak = 1, floor = 'B9', pressed = [], shake = 0, light = 1, cam = null } = opts;
  const sh = shake > 0 ? Math.sin(t * 50) * 4 * shake : 0;
  let o = R(-400, -300, 2720, 1700, 0, { fill: '#7A4628' });
  // back wall, side walls, ceiling, floor (box)
  o += R(380, 150, 1160, 670, 0, { fill: 'url(#farmWoodPanel)', stroke: LINE, 'stroke-width': 7 });
  o += P('M-400 -300 L380 150 L380 820 L-400 1400 Z', { fill: '#8E5532', stroke: LINE, 'stroke-width': 7 }) + P('M2320 -300 L1540 150 L1540 820 L2320 1400 Z', { fill: '#8E5532', stroke: LINE, 'stroke-width': 7 });
  o += P('M-400 -300 L2320 -300 L1540 150 L380 150 Z', { fill: '#E9E2D6', stroke: LINE, 'stroke-width': 7 });
  for (let i = 1; i < 4; i++) o += P(`M${f(lerp(-400, 2320, i / 4))} -300 L${f(lerp(380, 1540, i / 4))} 150`, ln(5, '#C9C1B4'));
  o += R(560, 40, 800, 70, 14, { fill: '#FFF8E0', stroke: '#C9C1B4', 'stroke-width': 4, opacity: light });
  o += P('M380 820 L1540 820 L2320 1400 L-400 1400 Z', { fill: 'url(#farmCheck)', stroke: LINE, 'stroke-width': 7 });
  // mirror strip + brass handrail
  o += R(520, 220, 880, 300, 12, ol('#BFE3F2', 6)) + P('M600 500 L760 240 L840 240 L680 500 Z M900 500 L1000 240 L1040 240 L940 500 Z', { fill: '#FFFFFF', opacity: 0.35 });
  o += R(380, 600, 1160, 20, 10, ol('#E0B84A', 5)) + P('M-400 760 L380 600', ln(22)) + P('M-400 760 L380 600', ln(14, '#E0B84A')) + P('M2320 760 L1540 600', ln(22)) + P('M2320 760 L1540 600', ln(14, '#E0B84A'));
  // speaker grille + notes
  o += Ci(1450, 70, 50, ol('#C9C1B4', 5));
  for (let i = 0; i < 4; i++) o += P(`M1418 ${52 + i * 12} L1482 ${52 + i * 12}`, ln(4, '#8E8678'));
  let notes = '';
  if (muzak > 0) for (let i = 0; i < 6; i++) {
    const a = ((t * 0.22 + i / 6) % 1);
    const x = 1420 - a * 1100 + Math.sin(t * 2 + i) * 50, y = 150 + a * 300 + Math.sin(t * 3 + i * 2) * 40;
    const col = ['#FF6FB5', '#5CB8FF', '#FFD84D', '#46D17A', '#B06BFF', '#FF9F1C'][i];
    const dbl = i % 2 === 1;
    const stem = dbl ? 'M0 0 L0 -54 L34 -64 L34 -10' : 'M0 0 L0 -58 Q14 -46 22 -30';
    let n = P(stem, ln(13)) + P(stem, ln(6, col)) + Ell(-10, 0, 16, 12, { fill: col, stroke: LINE, 'stroke-width': 5, transform: 'rotate(-20 -10 0)' });
    if (dbl) n += Ell(24, -10, 16, 12, { fill: col, stroke: LINE, 'stroke-width': 5, transform: 'rotate(-20 24 -10)' });
    notes += G(n, `translate(${f(x)} ${f(y)}) rotate(${f(Math.sin(t * 2 + i) * 15)}) scale(${f(0.8 + 0.3 * Math.sin(a * Math.PI))})`, { opacity: f(muzak * clamp(Math.sin(a * Math.PI) * 1.6, 0, 1)) });
  }
  // floor display + DING bell on the back wall
  o += R(860, 160, 200, 54, 10, ol('#22252F', 5)) + T(floor, 960, 203, 42, '#FF8A3D');
  // side panel (skewed onto the right wall): 200 visible buttons
  const pan = LIFTIN.panel;
  o += G(liftPanel(t, pressed, pan), `translate(${pan.x0} 0) skewY(-30) translate(${-pan.x0} 0) translate(0 ${f(0)})`);
  o += R(380, 150, 1160, 670, 0, { fill: 'none', stroke: LINE, 'stroke-width': 7 });
  // the DING bell above the mirror
  o += G(P('M-26 14 Q-26 -22 0 -24 Q26 -22 26 14 Z', ol('#FFD21F', 5)) + R(-32, 12, 64, 10, 5, ol('#E0B84A', 4)) + Ci(0, -28, 6, ol('#FFD21F', 3)), 'translate(1180 194)');
  return layers(V(cam, G(o, `translate(${f(sh)} 0)`), 1), '', notes ? V(cam, notes, 1) : '');
}

// ---------------------------------------------------------------- world map screen
// worldMap(x, y, w, h, t, opts) — a big screen with a blocky world map full of red dots (players online).
// opts: dots 0..1, spam (true | array of strings) floating 'LAST CHANCE!!!' bubbles, online (header text),
//       green 0..1 (calm green map), off 0..1 (screen dark), title ('PLAYERS ONLINE')
const CONTINENTS = [
  [[60, 90], [250, 60], [330, 100], [300, 160], [250, 210], [200, 240], [160, 200], [110, 170], [60, 130]],
  [[200, 262], [262, 252], [292, 300], [262, 372], [232, 420], [212, 360], [192, 300]],
  [[372, 80], [462, 70], [482, 116], [432, 146], [382, 136]],
  [[382, 166], [472, 156], [512, 214], [482, 300], [442, 352], [412, 292], [372, 226]],
  [[492, 60], [702, 62], [742, 116], [702, 176], [622, 206], [562, 186], [502, 146]],
  [[640, 286], [722, 276], [742, 324], [692, 356], [642, 336]],
];
const DOTS = [[130, 120], [220, 150], [270, 110], [240, 330], [420, 100], [440, 220], [600, 110], [680, 140], [560, 160], [690, 310], [180, 190], [470, 270]];
function worldMap(x, y, w, h, t, opts = {}) {
  const { dots = 1, spam = false, online = null, green = 0, off = 0, title = 'PLAYERS ONLINE' } = opts;
  const sx = w / 800, sy = h / 450;
  let o = R(-24, -24, 848, 498, 26, ol('#22252F', 8)) + R(0, 0, 800, 450, 8, { fill: 'url(#farmScreen)' });
  for (let i = 1; i < 8; i++) o += P(`M${i * 100} 0 L${i * 100} 450`, ln(2, '#2E6FA8', 0.25));
  for (let i = 1; i < 5; i++) o += P(`M0 ${i * 90} L800 ${i * 90}`, ln(2, '#2E6FA8', 0.25));
  const land = CONTINENTS.map((c) => rp(c, 22)).join(' ');
  o += P(land, { fill: mix('#17406A', '#1F6A4A', green), stroke: mix('#3A8AD0', '#46F58C', green), 'stroke-width': 4 });
  const dk = dots * (1 - green);
  if (dk > 0) {
    o += P(land, { fill: 'url(#farmDotsA)', opacity: f(clamp(dk * 3, 0, 1)) });
    if (dk > 0.33) o += P(land, { fill: 'url(#farmDotsB)', opacity: f(clamp(dk * 3 - 1, 0, 1)) });
    if (dk > 0.66) o += P(land, { fill: 'url(#farmDotsC)', opacity: f(clamp(dk * 3 - 2, 0, 1)) });
    DOTS.forEach(([dx, dy], i) => { if (rnd(i, 151) < dk + 0.1) { const p = (t * 1.4 + rnd(i, 152)) % 1; o += Ci(dx, dy, 6 + p * 30, { fill: 'none', stroke: '#FF2E4D', 'stroke-width': 4, opacity: f((1 - p) * dk) }) + Ci(dx, dy, 7, { fill: '#FF5A6E' }); } });
  }
  // header
  const cnt = online ?? (dots <= 0.001 ? '0' : Math.round(dots * 812).toLocaleString('en-US') + ',000,000');
  o += R(0, 0, 800, 54, 8, { fill: '#0A1A30', opacity: 0.9 }) + TF(title + ':', 20, 38, 30, '#9AB8E8', { 'text-anchor': 'start' }) + T(cnt, 780, 40, 38, green > 0.5 || dots <= 0.001 ? '#46F58C' : '#FF5A6E', { 'text-anchor': 'end' });
  // spam bubbles
  if (spam) {
    const msgs = Array.isArray(spam) ? spam : ['LAST CHANCE!!!', '1 MORE GAME', 'LAST GAME!!', 'ONE MORE!!!', 'NOOOO', 'DONT LOG OFF'];
    msgs.forEach((m, i) => {
      const a = ((t * 0.35 + i / msgs.length) % 1);
      const bx = 90 + rnd(i, 161) * 620, by = 380 - a * 260;
      const bw = m.length * 15 + 40;
      o += G(R(-bw / 2, -26, bw, 46, 14, ol('#FFFFFF', 4)) + P('M-10 18 L0 34 L10 18 Z', { fill: '#FFFFFF', stroke: LINE, 'stroke-width': 4 }) + R(-bw / 2 + 4, 14, bw - 8, 6, 0, { fill: '#FFFFFF' }) + TF(m, 0, 6, 24, '#E8233B'), `translate(${f(bx)} ${f(by)}) scale(${f(0.8 + 0.2 * Math.sin(a * Math.PI))})`, { opacity: f(Math.sin(a * Math.PI) * 1.4 > 1 ? 1 : Math.sin(a * Math.PI) * 1.4) });
    });
  }
  o += R(0, 0, 800, 450, 8, { fill: 'url(#farmScan)' }) + P('M40 420 L240 30 L300 30 L100 420 Z', { fill: '#FFFFFF', opacity: 0.05 });
  if (off > 0) o += R(0, 0, 800, 450, 8, { fill: '#05070F', opacity: f(off) });
  return G(o, `translate(${f(x)} ${f(y)}) scale(${f(sx)} ${f(sy)})`);
}

// ---------------------------------------------------------------- core(t, cam, opts)
// The Core: a tower of servers rising into darkness, a long metal catwalk and the control wall.
// Catwalk floor CORE.floor = 860 (k = 1) from x CORE.walk.x0 to the control platform; the control wall stands at
// x 2500…3700: button grid CORE.grid (20 x 20 = 400 buttons), mic stand CORE.mic, big button CORE.button (Pip presses
// its top at CORE.button.top). Tower centre x 960 (k .35); wall timer above it (k .45).
// opts: alarm 0..1 (default 1), timer ('00:01:00'), broadcast 0..1 (big button lit), green 0..1, greenWave 0..1
//       (green climbing the tower bottom→top), pressed [grid indices], screens (default true), dots, spam,
//       frontRail (default true), lowRes 0..1 (lag eats the lamps: pixel blocks), towerEaten 0..1 (gap in the tower)
const CORE = {
  floor: 860, walk: { x0: -2400, x1: 2500 },
  grid: { x0: 2560, y0: 180, cols: 20, rows: 20, cw: 38, ch: 30 },
  mic: { x: 3020, y: 860, top: 540 }, button: { x: 3480, y: 860, top: 650, r: 78 },
  timer: { x: 960, y: 170 },
};
function core(t, cam, opts = {}) {
  const { alarm = 1, timer = '00:01:00', broadcast = 0, green = 0, greenWave = green, pressed = [], screens = true, dots = 1, spam = true, frontRail = true, lowRes = 0, towerEaten = 0 } = opts;
  const al = alarm * (1 - green);
  let bg = fullRect(cam, 0, { fill: 'url(#farmCoreSky)' });
  // red / green glow from the abyss
  bg += V(cam, Ci(960, 1300, 1100, { fill: green > 0.5 ? 'url(#farmGlowGreen)' : al > 0 ? 'url(#farmGlowRed)' : 'url(#farmGlowBlue)', opacity: f(0.35 + 0.25 * al * Math.sin(t * 5)) }), 0.05);
  // distant structure
  bg += V(cam, strip(cam, 0.12, 0, 520, (i, x) => R(x + 200, -400, 60, 2000, 0, { fill: '#0A0E22' }) + R(x, 300 + rnd(i, 171) * 200, 520, 30, 0, { fill: '#0A0E22' })), 0.12);
  // the tower (k .35): a cylinder of servers, rings curve with the eye level (≈ y 520)
  let tw = '';
  const TX = 960, TW = 820, tiers = 18, EYE = 520;
  for (let i = 0; i < tiers; i++) {
    const ty = 1500 - i * 170;
    const hgt = (i + 0.5) / tiers;
    const gk = green * clamp((greenWave * 1.15 - hgt) * 5, 0, 1);
    const eaten = towerEaten > 0 && i >= 5 && i <= 7 && rnd(i, 172) < towerEaten;
    if (eaten) { tw += R(TX - TW / 2, ty - 170, TW, 170, 0, { fill: '#03050C' }); continue; }
    const bend = clamp((EYE - ty) / 900, -1, 1) * 46;
    tw += P(`M${TX - TW / 2} ${ty} Q${TX} ${f(ty - bend * 2)} ${TX + TW / 2} ${ty} L${TX + TW / 2} ${ty - 170} Q${TX} ${f(ty - 170 - bend * 2)} ${TX - TW / 2} ${ty - 170} Z`, { fill: '#121A3A', stroke: LINE, 'stroke-width': 5 });
    tw += G(R(0, 0, TW - 80, 120, 0, { fill: 'url(#farmRackFar)' }), `translate(${TX - TW / 2 + 40} ${f(ty - 145 - bend * 0.9)})`);
    const ring = gk > 0.5 ? GREEN : al > 0 ? (Math.floor(t * 6 + i) % 2 ? RED : '#7A1A2A') : CYAN;
    tw += P(`M${TX - TW / 2 - 20} ${ty - 6} Q${TX} ${f(ty - 6 - bend * 2.1)} ${TX + TW / 2 + 20} ${ty - 6}`, ln(20)) + P(`M${TX - TW / 2 - 20} ${ty - 6} Q${TX} ${f(ty - 6 - bend * 2.1)} ${TX + TW / 2 + 20} ${ty - 6}`, ln(11, ring));
    if (gk > 0.05) tw += R(TX - TW / 2, ty - 170, TW, 170, 0, { fill: GREEN, 'fill-opacity': f(0.16 * gk) });
  }
  tw += R(TX - TW / 2, -1600, TW, 3100, 0, { fill: 'url(#farmCyl)' });
  tw += R(TX - 1000, -1600, 2000, 1500, 0, { fill: 'url(#farmFadeDown)', transform: `rotate(180 ${TX} -850)` });
  bg += V(cam, tw, 0.35);
  // wall timer (k .45)
  const tc = green > 0.5 ? GREEN : al > 0 ? '#FF3B4E' : CYAN;
  let tm = P(`M${CORE.timer.x - 300} -400 L${CORE.timer.x - 300} 60 M${CORE.timer.x + 300} -400 L${CORE.timer.x + 300} 60`, ln(12, '#2A3048'));
  tm += R(CORE.timer.x - 440, 50, 880, 250, 30, ol('#14182A', 10)) + R(CORE.timer.x - 410, 76, 820, 198, 18, { fill: '#05070F' });
  tm += Ci(CORE.timer.x, 175, 420, { fill: green > 0.5 ? 'url(#farmGlowGreen)' : 'url(#farmGlowRed)', opacity: f(0.35 * Math.max(al, green)) });
  tm += T(timer, CORE.timer.x + 6, 256, 180, '#000', { 'letter-spacing': 6, opacity: 0.5 }) + T(timer, CORE.timer.x, 250, 180, tc, { 'letter-spacing': 6 }) + R(CORE.timer.x - 410, 76, 820, 198, 18, { fill: 'url(#farmScan)' });
  bg += V(cam, tm, 0.45);
  // big screens with the world map (k .6)
  if (screens) {
    let sc = '';
    for (const [sx, i] of [[-120, 0], [1490, 1]]) {
      sc += P(`M${sx + 120} -300 L${sx + 120} 260 M${sx + 430} -300 L${sx + 430} 260`, ln(8, '#2A3048'));
      sc += worldMap(sx, 260, 560, 315, t + i * 1.3, { dots, spam: spam ? (i ? ['1 MORE GAME', 'LAST GAME!!', 'NOOOO'] : ['LAST CHANCE!!!', 'ONE MORE!!!', 'DONT LOG OFF']) : false, green });
    }
    bg += V(cam, sc, 0.6);
  }
  // abyss haze under the catwalk
  bg += V(cam, band(cam, 0.8, 900, 1600, { fill: '#03050C', opacity: 0.6 }), 0.8);
  // catwalk + control wall (k 1)
  let m = '';
  const W0 = CORE.walk.x0, W1 = 3900;
  // control wall
  const gx = CORE.grid;
  m += R(2440, -300, 1400, CORE.floor + 300, 16, ol('#1A2040', 8)) + R(2440, -300, 1400, CORE.floor + 300, 16, { fill: 'url(#farmPanel)' });
  m += R(gx.x0 - 30, gx.y0 - 80, gx.cols * gx.cw + 60, gx.rows * gx.ch + 110, 16, ol('#2A3048', 7)) + TF('MAIN CONTROL · DO NOT TOUCH', gx.x0 + gx.cols * gx.cw / 2, gx.y0 - 36, 30, '#9AB8E8');
  m += G(R(0, 0, gx.cols * gx.cw, gx.rows * gx.ch, 0, { fill: 'url(#farmBtnBig)' }) + (green > 0 ? R(0, 0, gx.cols * gx.cw, gx.rows * gx.ch, 0, { fill: 'url(#farmBtnBigG)', opacity: f(green) }) : ''), `translate(${gx.x0} ${gx.y0})`);
  // random blinking + pressed buttons
  for (let i = 0; i < 14; i++) {
    const bi = Math.floor(rnd(i + Math.floor(t * 2), 173) * 400), bx = gx.x0 + (bi % 20) * gx.cw + 5, by = gx.y0 + Math.floor(bi / 20) * gx.ch + 3;
    m += R(bx, by, 28, 22, 7, { fill: al > 0 && i % 2 ? RED : green > 0.5 ? '#B8FFC8' : CYAN, opacity: 0.85 });
  }
  for (const bi of pressed) { const bx = gx.x0 + (bi % 20) * gx.cw + 5, by = gx.y0 + Math.floor(bi / 20) * gx.ch + 3; m += Ci(bx + 14, by + 11, 30, { fill: 'url(#farmGlowWarm)' }) + R(bx, by, 28, 22, 7, { fill: '#FFE14D', stroke: LINE, 'stroke-width': 2 }); }
  // levers
  for (let i = 0; i < 3; i++) m += R(2470, 300 + i * 120, 40, 90, 8, ol('#3A3F55', 5)) + P(`M2490 ${330 + i * 120} L${2490 + 30 * Math.sin(t * 0.7 + i)} ${270 + i * 120}`, ln(10)) + Ci(2490 + 30 * Math.sin(t * 0.7 + i), 270 + i * 120, 14, ol(['#FF5A5A', '#FFD21F', '#46F58C'][i], 4));
  // BROADCAST station: sign, pedestal, big button
  const B = CORE.button;
  const lit = clamp(broadcast, 0, 1);
  m += R(B.x - 250, 220, 500, 230, 24, ol(lit > 0.5 ? '#FFE14D' : '#FFFFFF', 8)) + T('BROADCAST', B.x, 300, 72, '#E8233B') + TF('TO ALL SCREENS', B.x, 362, 42, '#1D1D24') + R(B.x - 110, 386, 220, 44, 12, { fill: lit > 0.5 ? '#FF2E4D' : '#3A2A2A', stroke: LINE, 'stroke-width': 5 }) + TF('ON AIR', B.x, 418, 28, lit > 0.5 ? '#FFFFFF' : '#7A5A5A');
  m += P(`M${B.x - 60} ${B.y} L${B.x - 46} ${B.top + 30} L${B.x + 46} ${B.top + 30} L${B.x + 60} ${B.y} Z`, ol('#3A4260', 7)) + R(B.x - 90, B.top + 10, 180, 36, 12, ol('#5A6478', 6));
  if (lit > 0) m += Ci(B.x, B.top - 10, 260, { fill: 'url(#farmGlowWarm)', opacity: f(lit) }) + K.rays(B.x, B.top - 10, 14, 360, '#FFF4C8', 0.25 * lit, t * 30);
  const press = lit > 0.5 ? 12 : 0;
  m += Ell(B.x, B.top + 12, B.r + 6, 26, { fill: '#22252F', stroke: LINE, 'stroke-width': 6 }) + P(`M${B.x - B.r} ${B.top + 10} L${B.x - B.r} ${B.top - 22 + press} A${B.r} 30 0 0 1 ${B.x + B.r} ${B.top - 22 + press} L${B.x + B.r} ${B.top + 10} A${B.r} 26 0 0 1 ${B.x - B.r} ${B.top + 10} Z`, ol(lit > 0.5 ? '#FF6A7A' : '#E8233B', 6)) + Ell(B.x, B.top - 22 + press, B.r, 30, ol(lit > 0.5 ? '#FFC8D0' : '#FF4D63', 6)) + Ell(B.x - 24, B.top - 30 + press, 24, 9, { fill: '#FFFFFF', opacity: 0.7 });
  // mic stand
  const M0 = CORE.mic;
  m += Ell(M0.x, M0.y - 4, 60, 12, ol('#3A3F55', 5)) + P(`M${M0.x} ${M0.y - 6} L${M0.x} ${M0.top + 60}`, ln(14)) + P(`M${M0.x} ${M0.y - 6} L${M0.x} ${M0.top + 60}`, ln(7, '#9AA6C0')) + P(`M${M0.x} ${M0.top + 60} Q${M0.x} ${M0.top} ${M0.x - 60} ${M0.top}`, ln(12)) + P(`M${M0.x} ${M0.top + 60} Q${M0.x} ${M0.top} ${M0.x - 60} ${M0.top}`, ln(6, '#9AA6C0'));
  m += G(R(-46, -22, 70, 44, 22, ol('#3A3F55', 5)) + P('M-36 -12 L14 -12 M-36 0 L14 0 M-36 12 L14 12', ln(3, '#7A8296')), `translate(${M0.x - 70} ${M0.top}) rotate(-10)`) + (lit > 0.5 ? Ci(M0.x - 120, M0.top - 30, 14, { fill: '#FF2E4D', stroke: LINE, 'stroke-width': 4 }) : '');
  // catwalk: back railing, deck, front face, trusses
  m += band(cam, 1, CORE.floor + 40, 1700, { fill: 'url(#farmTruss)', opacity: 0.9 });
  m += R(W0, CORE.floor + 40, W1 - W0, 900, 0, { fill: 'url(#farmFadeDown)', opacity: 0.5 });
  let rail = '';
  for (let x = Math.floor(vis(cam, 1).x0 / 200) * 200; x < Math.min(vis(cam, 1).x1 + 200, 2440); x += 200) rail += R(x - 7, 650, 14, CORE.floor - 650, 4, ol('#3A4260', 4));
  m += rail + R(W0, 640, 2440 - W0, 18, 8, ol('#4A5478', 5)) + R(W0, 750, 2440 - W0, 12, 6, ol('#3A4260', 4));
  // alarm beacons on the rail posts
  for (let x = Math.floor(vis(cam, 1).x0 / 800) * 800 + 200; x < Math.min(vis(cam, 1).x1 + 300, 2440); x += 800) m += beacon(x, 640, t + x * 0.001, green > 0.5 ? green : al, green > 0.5 ? 'green' : 'red', 520);
  m += R(W0, CORE.floor - 14, W1 - W0, 28, 0, { fill: 'url(#farmGrate)' }) + R(W0, CORE.floor - 16, W1 - W0, 6, 0, { fill: '#7A86A8' });
  m += R(W0, CORE.floor + 12, W1 - W0, 36, 0, { fill: '#2A3048', stroke: LINE, 'stroke-width': 5 }) + R(W0, CORE.floor + 18, W1 - W0, 18, 0, { fill: 'url(#farmHazard)', opacity: 0.9 });
  m += R(W0, CORE.floor + 46, W1 - W0, 8, 0, { fill: al > 0 ? RED : green > 0.5 ? GREEN : CYAN, opacity: f(0.6 + 0.3 * Math.sin(t * 8)) });
  if (lowRes > 0) m += R(vis(cam, 1).x0, -200, 2000, 700, 0, { fill: 'url(#farmLowRes)', opacity: f(lowRes) });
  const mid = V(cam, m, 1);
  // foreground: low front railing + big dark beams; colour wash
  let fg = '';
  if (frontRail) {
    let fr = '';
    for (let x = Math.floor(vis(cam, 1).x0 / 260) * 260 + 130; x < Math.min(vis(cam, 1).x1 + 260, 2440); x += 260) fr += R(x - 6, CORE.floor + 10, 12, 140, 4, ol('#3A4260', 4));
    fr += R(W0, CORE.floor + 120, 2440 - W0, 16, 8, ol('#4A5478', 5));
    fg += V(cam, fr, 1);
  }
  fg += V(cam, strip(cam, 1.6, 0, 2600, (i, x) => i > 0 ? '' : R(x + 2040, -400, 130, 1900, 0, { fill: '#05060C', stroke: '#1A1A28', 'stroke-width': 6 }) + P(`M${x + 2170} 40 Q${x + 2420} ${f(300 + Math.sin(t * 0.5 + i) * 20)} ${x + 2640} 0`, ln(40, '#05060C'))), 1.6);
  if (al > 0) fg += fullRect(cam, 1, { fill: RED, opacity: f(al * (0.09 + 0.06 * Math.sin(t * 9))) });
  if (green > 0) fg += fullRect(cam, 1, { fill: GREEN, opacity: f(green * 0.06) });
  if (lowRes > 0) fg += fullRect(cam, 1, { fill: '#8A93A6', opacity: f(lowRes * 0.18) });
  return layers(bg, mid, fg);
}

const FLOOR = { hall: 900, cooling: 900, lost: 920, archive: 900, core: CORE.floor, farm: FARM.floor, door: DOOR.floor, lift: LIFT.floor, liftInside: LIFTIN.floor, gas: GAS.floor, road: ROAD.near };


module.exports = {
  DEFS, mix, vis, layers, strip,
  // road
  VAN, ROAD, GAS, GASIN, VANIN, van, truck, cow, desertRoad, roadDust, cactus, tumbleweed, slushie, gasStation, gasStationInside, vanInterior, steeringWheel,
  // server farm
  FLOOR, FARM, DOOR, LIFT, LIFTIN, JUNGLE, ARCHIVE, CORE, BUBBLE_KINDS, LOST_KINDS,
  farmExterior, farmDoor, rackHall, coolingRoom, breath, cableJungle, vineEnd, lostAndFound, lostItem, archive, gameBubble,
  serviceElevator, elevatorInside, liftButton, worldMap, core, rack, beacon, cable, wheelStorm,
};
