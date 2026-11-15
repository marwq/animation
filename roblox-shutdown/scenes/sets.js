// Shared HOME + WORLD background sets for "What If Roblox Shut Down FOREVER?".
//
// Every set is drawn in WORLD SPACE for the full 1920x1080 frame (camera at rest = the frame). Each one takes
// `t` (absolute seconds, only used for small idle motion) and an `opts` object. Room sets also expose
// `set.layers(t, opts)` -> { bg, mid, fg, light } for parallax:
//   bg    — what is seen through windows (sky, garden...)    draw with view(cam, bg, 0.4..0.6)
//   mid   — the room itself: walls, floor, furniture         draw with view(cam, mid, 1)   (characters stand here)
//   seat  — (living room only) couch front + coffee table: draw AFTER seated characters, BEFORE standing ones
//   fg    — occluders in front of the characters             draw with view(cam, fg, 1.15..1.3)
//   light — night/evening light overlay (may be '')         draw LAST with view(cam, light, 1)
// Calling the set directly, e.g. attic(t, opts), returns all layers composited at k = 1.
// FLOOR[set] = the y where characters' feet go in the default framing (stand line); SPOTS[set] = useful anchors.
// Static gradients/patterns/clips live in DEFS (ids prefixed `sets`); main.js adds DEFS to every frame.
'use strict';

const S = require('../rig/svg');
const { f, clamp, lerp, ease } = S;

const LINE = '#151515';
const ol = (fill, w = 6, extra = {}) => ({ fill, stroke: LINE, 'stroke-width': w, 'stroke-linejoin': 'round', 'stroke-linecap': 'round', ...extra });
const ln = (w, c = LINE, op) => ({ fill: 'none', stroke: c, 'stroke-width': w, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', ...(op !== undefined ? { opacity: op } : {}) });
const R = (x, y, w, h, r = 0, a = {}) => S.rect(x, y, w, h, r, a);
const P = (d, a = {}) => S.path(d, a);
const E = (cx, cy, rx, ry, a = {}) => S.ellipse(cx, cy, rx, ry, a);
const CI = (cx, cy, r, a = {}) => S.circle(cx, cy, r, a);
const G = (inner, tf, extra) => S.g(inner, tf, extra);
const T = (s, x, y, size, fill, extra = {}) => S.el('text', { x, y, 'font-family': 'Lilita One, sans-serif', 'font-size': size, fill, 'text-anchor': 'middle', ...extra }, s);
const TF = (s, x, y, size, fill, extra = {}) => S.el('text', { x, y, 'font-family': 'Fredoka, sans-serif', 'font-weight': 700, 'font-size': size, fill, 'text-anchor': 'middle', ...extra }, s);
const OUTX = (w = 8) => ({ stroke: LINE, 'stroke-width': w, 'paint-order': 'stroke', 'stroke-linejoin': 'round' });
const hash = (n) => { const v = Math.sin(n * 127.1 + 311.7) * 43758.5453; return v - Math.floor(v); };
const seg = (t, a, b) => clamp((t - a) / (b - a), 0, 1);
const tr = (x, y, s = 1, r = 0) => `translate(${f(x)} ${f(y)})${r ? ` rotate(${f(r)})` : ''}${s !== 1 ? ` scale(${f(s)})` : ''}`;
const poly = (pts, a = {}) => P('M' + pts.map(([x, y]) => `${f(x)} ${f(y)}`).join(' L') + ' Z', a);
const pline = (pts) => 'M' + pts.map(([x, y]) => `${f(x)} ${f(y)}`).join(' L');
const circD = (cx, cy, r) => `M${f(cx - r)} ${f(cy)} a${f(r)} ${f(r)} 0 1 0 ${f(2 * r)} 0 a${f(r)} ${f(r)} 0 1 0 ${f(-2 * r)} 0 Z`;
const num = (v) => (typeof v === 'number' ? Math.round(v).toLocaleString('en-US') : String(v));
const stutterT = (t, fps = 5) => Math.floor(t * fps) / fps;

// ---------------------------------------------------------------- colour helpers
const hx = (c) => [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)];
const toHex = (a) => '#' + a.map((v) => Math.round(clamp(v, 0, 255)).toString(16).padStart(2, '0')).join('').toUpperCase();
function mix(a, b, k) {
  if (k <= 0) return a;
  if (k >= 1) return b;
  const A = hx(a), B = hx(b);
  return toHex(A.map((v, i) => lerp(v, B[i], k)));
}
// "lag grey": desaturate toward a cool grey with flattened contrast (no filters needed)
function desat(c, k) {
  if (!k || c[0] !== '#' || c.length !== 7) return c;
  const [r, g, b] = hx(c);
  const l = 0.3 * r + 0.59 * g + 0.11 * b;
  const grey = [lerp(l, 150, 0.35), lerp(l, 156, 0.35), lerp(l, 168, 0.35)];
  return toHex([lerp(r, grey[0], k), lerp(g, grey[1], k), lerp(b, grey[2], k)]);
}

// ---------------------------------------------------------------- small shared pieces
function sparkle(x, y, r, color = '#FFE14D') {
  const d = `M${f(x)} ${f(y - r)} Q${f(x + r * 0.18)} ${f(y - r * 0.18)} ${f(x + r)} ${f(y)} Q${f(x + r * 0.18)} ${f(y + r * 0.18)} ${f(x)} ${f(y + r)} Q${f(x - r * 0.18)} ${f(y + r * 0.18)} ${f(x - r)} ${f(y)} Q${f(x - r * 0.18)} ${f(y - r * 0.18)} ${f(x)} ${f(y - r)} Z`;
  return P(d, { fill: color, stroke: LINE, 'stroke-width': Math.max(2, r * 0.12), 'stroke-linejoin': 'round' });
}
function starD(cx, cy, Ro, ri = Ro * 0.48, n = 5, rot = -90) {
  const p = [];
  for (let i = 0; i < n * 2; i++) {
    const a = ((rot + (i * 180) / n) * Math.PI) / 180;
    const rr = i % 2 ? ri : Ro;
    p.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]);
  }
  return S.roundedPath(p, Ro * 0.08);
}
// the classic loading spinner (same look as K.loadingWheel)
function spinner(x, y, r, t, col = '#B9C0CC', n = 8, dot = null) {
  const d = dot || r * 0.22;
  const head = Math.floor(t * 1.6 * n) % n;
  let o = '';
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 - Math.PI / 2;
    const age = (head - i + n) % n;
    o += CI(x + Math.cos(a) * r, y + Math.sin(a) * r, d * (1 - age * 0.05), { fill: col, opacity: f(1 - (age / n) * 0.85) });
  }
  return o;
}
// grey "texture still loading" blocks creeping over a region. k 0..1; dir: 'l' (from left) 'r' 'u' 'd'
function lagBlocks(x, y, w, h, k, t, seed = 1, size = 44, dir = 'r') {
  if (k <= 0) return '';
  let o = '';
  const nx = Math.ceil(w / size), ny = Math.ceil(h / size);
  const flick = Math.floor(t * 7);
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
    const u = dir === 'l' ? i / nx : dir === 'r' ? 1 - i / nx : dir === 'u' ? j / ny : 1 - j / ny;
    const thr = 0.55 * u + 0.45 * hash(seed * 13.1 + i * 7.3 + j * 3.1);
    const m = k * 1.08 - thr;
    if (m < 0) continue;
    if (m < 0.07 && hash(seed + i * 1.7 + j * 2.9 + flick * 0.37) < 0.5) continue; // edge flicker
    const tone = hash(seed + i * 5.1 + j * 9.7);
    const sz = (m < 0.12 ? 0.62 : 1) * (size - 4);
    const bx = x + i * size + (size - sz) / 2, by = y + j * size + (size - sz) / 2;
    o += R(bx, by, sz, sz, 5, { fill: tone < 0.5 ? '#A3AAB7' : '#9098A6', stroke: '#6E7686', 'stroke-width': 3 }) + R(bx + 4, by + 4, sz * 0.45, sz * 0.2, 3, { fill: '#C9CED8', opacity: 0.8 });
  }
  return o;
}
// silver duct tape strip from (x1,y1) to (x2,y2) with torn ends
function tape(x1, y1, x2, y2, w = 26, col = '#C9CFD8') {
  const a = Math.atan2(y2 - y1, x2 - x1), L = Math.hypot(x2 - x1, y2 - y1);
  let d = `M0 ${f(-w / 2)} L${f(L)} ${f(-w / 2)}`;
  for (let i = 1; i <= 4; i++) d += ` L${f(L - (i % 2 ? 5 : 0))} ${f(-w / 2 + (w * i) / 4)}`;
  d += ` L0 ${f(w / 2)}`;
  for (let i = 1; i <= 4; i++) d += ` L${f(i % 2 ? 5 : 0)} ${f(w / 2 - (w * i) / 4)}`;
  d += ' Z';
  let o = P(d, { fill: col, stroke: LINE, 'stroke-width': 3.5, 'stroke-linejoin': 'round' });
  o += P(`M4 ${f(-w * 0.18)} L${f(L - 6)} ${f(-w * 0.18)}`, ln(2.5, '#FFFFFF', 0.55)) + P(`M6 ${f(w * 0.22)} L${f(L - 8)} ${f(w * 0.22)}`, ln(2, '#8E96A3', 0.6));
  return G(o, `translate(${f(x1)} ${f(y1)}) rotate(${f((a * 180) / Math.PI)})`);
}
function stickyNote(x, y, rot, col, lines, size = 17, w = 92) {
  let o = R(-w / 2 + 3, -w / 2 + 5, w, w, 4, { fill: '#000', opacity: 0.12 });
  o += R(-w / 2, -w / 2, w, w, 4, ol(col, 3.5)) + R(-w / 2, -w / 2, w, 16, 3, { fill: '#000', opacity: 0.08 });
  lines.forEach((s, i) => { o += TF(s, 0, -w / 2 + 38 + i * size * 1.15, size, '#3A2A3A'); });
  return G(o, tr(x, y, 1, rot));
}
function pin(x, y, col = '#E8433A') { return CI(x, y, 7, ol(col, 3)) + CI(x - 2, y - 2, 2.2, { fill: '#FFFFFF', opacity: 0.8 }); }
// screen content: a string drawn in the box centred on (0,0), or a function (w, h) => svg
const screenOf = (inner, w, h) => (typeof inner === 'function' ? inner(w, h) : inner || '');
// fit a full 1920x1080 frame (e.g. bubbleIsland(t)) into a w x h screen box centred on (0,0)
const frameIn = (svg, w, h) => G(svg, `translate(${f(-w / 2)} ${f(-h / 2)}) scale(${f(w / 1920)} ${f(h / 1080)})`);
// a set function with .layers
function makeSet(layersFn) {
  const fn = (t = 0, opts = {}) => { const L = layersFn(t, opts); return (L.bg || '') + (L.mid || '') + (L.seat || '') + (L.fg || '') + (L.light || ''); };
  fn.layers = layersFn;
  return fn;
}

// pattern contents generated once at load: a 6x4 block of framed badges, and a star field tile
function badgeCells() {
  const frames = ['#FFD34D', '#C9D1DD', '#E8A060', '#FFD34D', '#9FE2FF'];
  const cols = ['#FF5A6E', '#3FBF5A', '#5BC0EB', '#B07CFF', '#FFB13B', '#FF6FB5', '#7CF7FF', '#FFE14D'];
  let o = '';
  for (let j = 0; j < 4; j++) for (let i = 0; i < 6; i++) {
    const k = j * 6 + i, x = i * 60 + 30, y = j * 60 + 30;
    const fc = frames[Math.floor(hash(k * 3.1) * frames.length)], c = cols[Math.floor(hash(k * 7.7) * cols.length)];
    o += `<rect x="${x - 25}" y="${y - 25}" width="50" height="50" rx="5" fill="${fc}" stroke="#0E1640" stroke-width="3"/><rect x="${x - 19}" y="${y - 19}" width="38" height="38" rx="3" fill="#1A2560"/>`;
    const sh = k % 5;
    if (sh === 0) o += `<circle cx="${x}" cy="${y}" r="13" fill="${c}"/>`;
    else if (sh === 1) o += `<path d="${starD(x, y + 1, 15, 7)}" fill="${c}"/>`;
    else if (sh === 2) o += `<path d="M${x - 12} ${y - 12} L${x + 12} ${y - 12} L${x + 12} ${y + 2} Q${x} ${y + 16} ${x - 12} ${y + 2} Z" fill="${c}"/>`;
    else if (sh === 3) o += `<path d="M${x} ${y - 15} L${x + 13} ${y} L${x} ${y + 15} L${x - 13} ${y} Z" fill="${c}"/>`;
    else o += `<rect x="${x - 11}" y="${y - 11}" width="22" height="22" rx="6" fill="${c}"/><circle cx="${x}" cy="${y}" r="5" fill="#FFFFFF" opacity="0.8"/>`;
  }
  return o;
}
function starDots() {
  let o = '';
  for (let i = 0; i < 34; i++) o += `<circle cx="${f(hash(i * 3.7 + 1) * 420)}" cy="${f(hash(i * 5.3 + 2) * 380)}" r="${f(1.2 + hash(i * 9.1) * 2.2)}" fill="#FFFFFF" opacity="${f(0.4 + hash(i * 1.3) * 0.5)}"/>`;
  return o;
}

// ---------------------------------------------------------------- static defs
const DEFS = `<defs>
<linearGradient id="setsSkyDay" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3FA2FF"/><stop offset="0.6" stop-color="#8FD6FF"/><stop offset="1" stop-color="#E4F7FF"/></linearGradient>
<linearGradient id="setsSkyEve" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5B4BB7"/><stop offset="0.45" stop-color="#E86F9E"/><stop offset="0.8" stop-color="#FFB36B"/><stop offset="1" stop-color="#FFE29A"/></linearGradient>
<linearGradient id="setsSkyNight" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0D0F3A"/><stop offset="0.7" stop-color="#28307A"/><stop offset="1" stop-color="#3E4A9A"/></linearGradient>
<linearGradient id="setsAtticWall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#A4E3D8"/><stop offset="1" stop-color="#6FC2B7"/></linearGradient>
<linearGradient id="setsAtticKnee" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6CBDB2"/><stop offset="1" stop-color="#4C9E95"/></linearGradient>
<linearGradient id="setsAtticRoof" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#D4914F"/><stop offset="1" stop-color="#9C5E31"/></linearGradient>
<linearGradient id="setsAtticFloor" x1="0" y1="790" x2="0" y2="1080" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#E7AE6E"/><stop offset="0.55" stop-color="#CF9358"/><stop offset="1" stop-color="#B47A45"/></linearGradient>
<pattern id="setsShiplap" width="400" height="46" patternUnits="userSpaceOnUse"><rect y="0" width="400" height="4" fill="#FFFFFF" opacity="0.22"/><rect y="40" width="400" height="6" fill="#1E5F5A" opacity="0.13"/></pattern>
<linearGradient id="setsBeam" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFF4C8" stop-opacity="0.55"/><stop offset="1" stop-color="#FFF4C8" stop-opacity="0"/></linearGradient>
<radialGradient id="setsBulbGlow"><stop offset="0" stop-color="#FFF8D0" stop-opacity="0.75"/><stop offset="0.5" stop-color="#FFF2B0" stop-opacity="0.22"/><stop offset="1" stop-color="#FFF2B0" stop-opacity="0"/></radialGradient>
<radialGradient id="setsAtticNight" cx="640" cy="470" r="1250" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#120C30" stop-opacity="0.04"/><stop offset="0.13" stop-color="#120C30" stop-opacity="0.3"/><stop offset="0.36" stop-color="#120C30" stop-opacity="0.72"/><stop offset="1" stop-color="#0A0720" stop-opacity="0.88"/></radialGradient>
<radialGradient id="setsLaptopGlow" cx="640" cy="480" r="430" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#9FE2FF" stop-opacity="0.42"/><stop offset="0.5" stop-color="#7FB8FF" stop-opacity="0.14"/><stop offset="1" stop-color="#7FB8FF" stop-opacity="0"/></radialGradient>
<radialGradient id="setsLampGlow"><stop offset="0" stop-color="#FFE7A8" stop-opacity="0.6"/><stop offset="1" stop-color="#FFD27A" stop-opacity="0"/></radialGradient>
<radialGradient id="setsHatchGlow" cx="0.5" cy="0.2" r="0.8"><stop offset="0" stop-color="#FFD48A"/><stop offset="1" stop-color="#7A3E1E"/></radialGradient>
<pattern id="setsKeys" width="20" height="13" patternUnits="userSpaceOnUse"><rect width="20" height="13" fill="#2B2F3A"/><rect x="2" y="2" width="16" height="9" rx="2" fill="#4A5163"/></pattern>
<linearGradient id="setsScreenShine" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFFFFF" stop-opacity="0.22"/><stop offset="0.45" stop-color="#FFFFFF" stop-opacity="0"/></linearGradient>
<pattern id="setsWallpaper" width="90" height="90" patternUnits="userSpaceOnUse"><rect width="90" height="90" fill="#FBE2B4"/><path d="M45 18 L52 45 L45 72 L38 45 Z" fill="#F4C98C"/><circle cx="0" cy="0" r="5" fill="#F4C98C"/><circle cx="90" cy="0" r="5" fill="#F4C98C"/><circle cx="0" cy="90" r="5" fill="#F4C98C"/><circle cx="90" cy="90" r="5" fill="#F4C98C"/></pattern>
<linearGradient id="setsHallFloor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#C98B55"/><stop offset="1" stop-color="#A86F40"/></linearGradient>
<linearGradient id="setsBubSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9DB6FF"/><stop offset="0.5" stop-color="#FFC8E8"/><stop offset="1" stop-color="#FFE7C4"/></linearGradient>
<radialGradient id="setsBubFill" cx="0.42" cy="0.4" r="0.62"><stop offset="0" stop-color="#FFFFFF" stop-opacity="0.08"/><stop offset="0.7" stop-color="#EAF4FF" stop-opacity="0.2"/><stop offset="0.9" stop-color="#D8E6FF" stop-opacity="0.42"/><stop offset="1" stop-color="#FFFFFF" stop-opacity="0.7"/></radialGradient>
<linearGradient id="setsBubRim" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FF9ED8"/><stop offset="0.35" stop-color="#FFE58A"/><stop offset="0.65" stop-color="#8AF0FF"/><stop offset="1" stop-color="#B49CFF"/></linearGradient>
<linearGradient id="setsVoid" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#B5B9C1"/><stop offset="0.59" stop-color="#A2A7B0"/><stop offset="0.6" stop-color="#959AA4"/><stop offset="1" stop-color="#80858F"/></linearGradient>
<clipPath id="setsClipEvDoor"><rect x="640" y="250" width="640" height="650"/></clipPath>
<clipPath id="setsClipLaptop"><rect x="-208" y="-117" width="416" height="234" rx="6"/></clipPath>
<pattern id="setsLivStripes" width="120" height="120" patternUnits="userSpaceOnUse"><rect x="0" width="60" height="120" fill="#F8D696"/><circle cx="90" cy="30" r="5" fill="#EDB86A"/><circle cx="90" cy="90" r="5" fill="#EDB86A"/></pattern>
<pattern id="setsLivFloor" width="320" height="56" patternUnits="userSpaceOnUse"><rect width="320" height="56" fill="#C98D58"/><rect y="28" width="320" height="28" fill="#C18552"/><rect y="0" width="320" height="4" fill="#A86F40"/><rect y="27" width="320" height="3" fill="#A86F40"/><rect x="110" y="0" width="4" height="28" fill="#A86F40"/><rect x="250" y="28" width="4" height="28" fill="#A86F40"/></pattern>
<radialGradient id="setsLivNight" cx="1470" cy="420" r="1500" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#140C34" stop-opacity="0.1"/><stop offset="0.22" stop-color="#140C34" stop-opacity="0.45"/><stop offset="1" stop-color="#0A0722" stop-opacity="0.72"/></radialGradient>
<radialGradient id="setsTvGlow"><stop offset="0" stop-color="#9FD8FF" stop-opacity="0.35"/><stop offset="1" stop-color="#9FD8FF" stop-opacity="0"/></radialGradient>
<clipPath id="setsClipTv"><rect x="-170" y="-95" width="340" height="190" rx="6"/></clipPath>
<linearGradient id="setsNewsNight" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0E1438"/><stop offset="0.6" stop-color="#26307A"/><stop offset="1" stop-color="#3A2A7A"/></linearGradient>
<linearGradient id="setsNewsSun" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7FD0FF"/><stop offset="0.6" stop-color="#C9EBFF"/><stop offset="1" stop-color="#FFE7A8"/></linearGradient>
<radialGradient id="setsNewsTimer"><stop offset="0" stop-color="#FF2E4E" stop-opacity="0.45"/><stop offset="1" stop-color="#FF2E4E" stop-opacity="0"/></radialGradient>
<pattern id="setsWinNight" width="80" height="96" patternUnits="userSpaceOnUse"><rect x="8" y="10" width="22" height="28" rx="3" fill="#FFE08A" opacity="0.85"/><rect x="48" y="10" width="22" height="28" rx="3" fill="#3A4A9A" opacity="0.6"/><rect x="8" y="58" width="22" height="28" rx="3" fill="#3A4A9A" opacity="0.6"/><rect x="48" y="58" width="22" height="28" rx="3" fill="#FFE08A" opacity="0.6"/></pattern>
<pattern id="setsWinDay" width="80" height="96" patternUnits="userSpaceOnUse"><rect x="8" y="10" width="22" height="28" rx="3" fill="#E4F4FF" opacity="0.9"/><rect x="48" y="10" width="22" height="28" rx="3" fill="#C9DEFF" opacity="0.7"/><rect x="8" y="58" width="22" height="28" rx="3" fill="#C9DEFF" opacity="0.7"/><rect x="48" y="58" width="22" height="28" rx="3" fill="#E4F4FF" opacity="0.9"/></pattern>
<clipPath id="setsClipNews"><rect x="-320" y="-180" width="640" height="360" rx="10"/></clipPath>
<clipPath id="setsClipPhone"><rect x="-150" y="-300" width="300" height="600" rx="22"/></clipPath>
<clipPath id="setsClipLaptopX"><rect x="-240" y="-135" width="480" height="270" rx="6"/></clipPath>
<clipPath id="setsClipTvX"><rect x="-320" y="-180" width="640" height="360" rx="6"/></clipPath>
<clipPath id="setsClipWatch"><rect x="-88" y="-100" width="176" height="200" rx="40"/></clipPath>
<clipPath id="setsClipMicrowave"><rect x="-90" y="-45" width="180" height="90" rx="6"/></clipPath>
<clipPath id="setsClipRegister"><rect x="-120" y="-68" width="240" height="136" rx="6"/></clipPath>
<clipPath id="setsClipPlaneSeat"><rect x="-180" y="-101" width="360" height="202" rx="6"/></clipPath>
<clipPath id="setsClipBillboard"><rect x="-420" y="-236" width="840" height="472" rx="8"/></clipPath>
<linearGradient id="setsSeatShade" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#FFFFFF" stop-opacity="0.12"/><stop offset="0.5" stop-color="#FFFFFF" stop-opacity="0"/><stop offset="1" stop-color="#000000" stop-opacity="0.12"/></linearGradient>
<linearGradient id="setsDusk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2A1E6A"/><stop offset="0.55" stop-color="#8A3E9A"/><stop offset="0.85" stop-color="#FF7A6A"/><stop offset="1" stop-color="#FFB86B"/></linearGradient>
<pattern id="setsTileMint" width="80" height="80" patternUnits="userSpaceOnUse"><rect width="80" height="80" fill="#9FDCCB"/><rect x="3" y="3" width="74" height="74" rx="8" fill="#BFEDE0"/><rect x="10" y="9" width="30" height="8" rx="4" fill="#FFFFFF" opacity="0.4"/></pattern>
<pattern id="setsBathFloor" width="120" height="120" patternUnits="userSpaceOnUse"><rect width="120" height="120" fill="#FFFFFF"/><rect width="60" height="60" fill="#FFC8D8"/><rect x="60" y="60" width="60" height="60" fill="#FFC8D8"/></pattern>
<clipPath id="setsClipTablet"><rect x="-75" y="-50" width="150" height="100" rx="4"/></clipPath>
<clipPath id="setsClipBathWin"><rect x="580" y="210" width="760" height="530"/></clipPath>
<pattern id="setsSiding" width="200" height="46" patternUnits="userSpaceOnUse"><rect y="38" width="200" height="8" fill="#7E98D8"/><rect y="0" width="200" height="4" fill="#C9D8FF" opacity="0.7"/></pattern>
<pattern id="setsSiding2" width="200" height="46" patternUnits="userSpaceOnUse"><rect y="38" width="200" height="8" fill="#000000" opacity="0.08"/><rect y="0" width="200" height="4" fill="#FFFFFF" opacity="0.35"/></pattern>
<pattern id="setsChalkSmudge" width="420" height="300" patternUnits="userSpaceOnUse"><ellipse cx="120" cy="80" rx="110" ry="30" fill="#FFFFFF" opacity="0.05"/><ellipse cx="330" cy="220" rx="90" ry="26" fill="#FFFFFF" opacity="0.05"/></pattern>
<pattern id="setsClassFloor" width="120" height="60" patternUnits="userSpaceOnUse"><rect width="120" height="60" fill="#C9D4E0"/><rect width="60" height="30" fill="#B9C6D6"/><rect x="60" y="30" width="60" height="30" fill="#B9C6D6"/></pattern>
<linearGradient id="setsStreamWall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2A1E5A"/><stop offset="1" stop-color="#3A2A6E"/></linearGradient>
<pattern id="setsFoam" width="80" height="80" patternUnits="userSpaceOnUse"><rect width="80" height="80" fill="#3A2E78"/><path d="M0 0 L40 0 L40 40 L0 40 Z" fill="#46389A"/><path d="M40 40 L80 40 L80 80 L40 80 Z" fill="#46389A"/><path d="M0 40 L40 0 L40 6 L6 40 Z M40 80 L80 40 L80 46 L46 80 Z" fill="#5A4AB8" opacity="0.8"/></pattern>
<radialGradient id="setsRingGlow"><stop offset="0.45" stop-color="#FFFBE8" stop-opacity="0.5"/><stop offset="1" stop-color="#FFFBE8" stop-opacity="0"/></radialGradient>
<linearGradient id="setsDexWall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1E2A6A"/><stop offset="1" stop-color="#2E3E8E"/></linearGradient>
<pattern id="setsBadges" x="100" y="120" width="360" height="240" patternUnits="userSpaceOnUse"><rect width="360" height="240" fill="#26357E"/>${badgeCells()}</pattern>
<linearGradient id="setsPorchSky0" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7FB8F0"/><stop offset="0.5" stop-color="#FFD9A0"/><stop offset="1" stop-color="#FFC060"/></linearGradient>
<linearGradient id="setsPorchSky1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3A2E7A"/><stop offset="0.45" stop-color="#C85A8A"/><stop offset="0.8" stop-color="#FF8A5A"/><stop offset="1" stop-color="#FFB45A"/></linearGradient>
<radialGradient id="setsSunGlow"><stop offset="0" stop-color="#FFF6C8" stop-opacity="0.9"/><stop offset="0.4" stop-color="#FFD27A" stop-opacity="0.4"/><stop offset="1" stop-color="#FFB45A" stop-opacity="0"/></radialGradient>
<pattern id="setsStars" width="420" height="380" patternUnits="userSpaceOnUse">${starDots()}</pattern>
<radialGradient id="setsOcean" cx="0.38" cy="0.35" r="0.75"><stop offset="0" stop-color="#5FC8FF"/><stop offset="0.6" stop-color="#2E86E0"/><stop offset="1" stop-color="#1A4FB0"/></radialGradient>
<radialGradient id="setsAtmo"><stop offset="0.78" stop-color="#7FD8FF" stop-opacity="0.55"/><stop offset="0.86" stop-color="#5FA8FF" stop-opacity="0.18"/><stop offset="1" stop-color="#5FA8FF" stop-opacity="0"/></radialGradient>
<clipPath id="setsClipEarth"><circle cx="960" cy="560" r="380"/></clipPath>
<linearGradient id="setsHazeNight" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#26307A" stop-opacity="0"/><stop offset="1" stop-color="#3A2A7A" stop-opacity="0.65"/></linearGradient>
<linearGradient id="setsHazeSun" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFE7A8" stop-opacity="0"/><stop offset="1" stop-color="#FFE7A8" stop-opacity="0.7"/></linearGradient>
<!--SETS_MORE_DEFS-->
</defs>`;

// ================================================================= 1. ATTIC — Juno's workshop
// One-point perspective, vanishing point (960, 560). Back gable wall: x 270..1650, floor seam y 790, knee walls
// to y 380, peak above the frame. Stand line for characters: y 1000 (FLOOR.attic).
const AT = { x0: 270, x1: 1650, base: 790, knee: 380, peak: -80, win: { x: 960, y: 250, r: 118 } };
const pk = (x, y, k) => [960 + (x - 960) * k, 560 + (y - 560) * k];
const ATTIC_LAPTOP = { x: 620, y: 590, s: 0.72 };
// hatch in floor coords: back-wall x 1080..1280, depth k 1.313 (back edge y 862) .. 1.661 (front edge y 942)
const HATCH = { X0: 1080, X1: 1280, kb: (862 - 560) / 230, kf: (942 - 560) / 230 };
const hatchPt = (X, k, h = 0) => [960 + (X - 960) * k, 560 + (230 - h) * k];
// point on a knee wall: side -1 left / +1 right; u = distance from the back corner toward camera; Y = height (back-wall px)
const kneeK = (u) => 1 / (1 - u / 1500);
function onKnee(side, u, Y, inner) {
  const k = kneeK(u), kk = (k * k) / 1500;
  const x = 960 + side * 690 * k, y = 560 + (Y - 560) * k;
  return G(inner, `matrix(${f(0.46 * k * k)} ${f(side * (Y - 560) * kk)} 0 ${f(k)} ${f(x)} ${f(y)})`);
}

function skyBg(t, time, cx, cy, opts = {}) {
  // a wide sky (covers the frame with margin for parallax) with details around (cx, cy)
  const id = time === 'night' ? 'setsSkyNight' : time === 'evening' ? 'setsSkyEve' : 'setsSkyDay';
  let o = R(-800, -700, 3520, 2600, 0, { fill: `url(#${id})` });
  if (time === 'night') {
    for (let i = 0; i < 26; i++) {
      const x = cx - 520 + hash(i * 3.3) * 1040, y = cy - 360 + hash(i * 7.9) * 560;
      const tw = 0.55 + 0.45 * Math.sin(t * 2.2 + i * 1.7);
      o += i % 4 ? CI(x, y, 3 + hash(i) * 2.5, { fill: '#FFFFFF', opacity: f(0.5 + 0.4 * tw) }) : P(starD(x, y, 9, 3.5, 4, 0), { fill: '#FFF6C8', opacity: f(0.6 + 0.4 * tw) });
    }
    o += CI(cx + 70, cy - 60, 54, { fill: '#FFF6D6', opacity: 0.18 }) + CI(cx + 70, cy - 60, 40, ol('#FFF3C4', 4)) + CI(cx + 88, cy - 72, 34, { fill: id === 'setsSkyNight' ? '#1E2462' : '#FFF', opacity: 0.0 });
    o += CI(cx + 58, cy - 66, 7, { fill: '#E8D9A8' }) + CI(cx + 82, cy - 46, 5, { fill: '#E8D9A8' });
  } else {
    const cl = time === 'evening' ? '#FFD9E6' : '#FFFFFF', sh = time === 'evening' ? '#F2A3C0' : '#CBE8FF';
    for (const [x0, y0, s, sp] of [[cx - 230, cy - 120, 0.9, 9], [cx + 120, cy - 40, 0.7, 6], [cx - 60, cy + 70, 0.55, 11]]) {
      const x = x0 + ((t * sp) % 600) - 100;
      o += G(R(-80, -10, 180, 44, 22, { fill: sh }) + R(-80, -18, 180, 40, 20, { fill: cl }) + CI(-20, -22, 34, { fill: cl }) + CI(30, -14, 28, { fill: cl }), tr(x, y0, s));
    }
    if (time === 'evening') o += CI(cx + 110, cy + 120, 70, { fill: '#FFE9A8', opacity: 0.35 }) + CI(cx + 110, cy + 120, 48, { fill: '#FFF2C4' });
  }
  if (opts.tree !== false) {
    // neighbour's tree top + roof peeking in at the bottom
    const tc = time === 'night' ? '#1B3A4A' : time === 'evening' ? '#5E7A4E' : '#5DBB63', tc2 = time === 'night' ? '#244A5A' : time === 'evening' ? '#7A9A5A' : '#7FD37A';
    const sw = Math.sin(t * 1.1) * 4;
    o += P(`M${cx - 200} ${cy + 240} L${cx - 80} ${cy + 70} L${cx + 40} ${cy + 240} Z`, ol(time === 'night' ? '#3A2A5A' : '#D9604A', 5)) + R(cx - 112, cy + 120, 30, 50, 4, ol(time === 'night' ? '#FFE08A' : '#BFF0FF', 4));
    o += G(CI(0, 0, 90, ol(tc, 5)) + CI(70, 40, 70, ol(tc, 5)) + CI(-60, 50, 64, ol(tc, 5)) + CI(-20, -30, 40, { fill: tc2 }) + CI(50, 10, 26, { fill: tc2 }), tr(cx + 130 + sw, cy + 110));
  }
  return o;
}

// string-light strand: catenary between points, bulbs every `gap` px. tt = (possibly stuttered) time
function stringLights(pts, tt, opts = {}) {
  const { sag = 60, gap = 66, r = 13, on = 1, seed = 1, lag = 0, jitter = 0, cols = ['#FFD34D', '#FF8A4C', '#4FD1C5', '#FF6FA8', '#FFF1B0'] } = opts;
  let wire = '', bulbs = '', glows = '';
  let bi = 0;
  for (let s = 0; s < pts.length - 1; s++) {
    const [x1, y1] = pts[s], [x2, y2] = pts[s + 1];
    const sw = Math.sin(tt * 1.4 + s * 1.3 + seed) * sag * 0.08 + jitter;
    const cx = (x1 + x2) / 2 + sw * 1.5, cy = (y1 + y2) / 2 + sag * 2 + sw;
    wire += `M${f(x1)} ${f(y1)} Q${f(cx)} ${f(cy)} ${f(x2)} ${f(y2)} `;
    const L = Math.hypot(x2 - x1, y2 - y1), n = Math.max(1, Math.round(L / gap));
    for (let i = 1; i < n; i++) {
      const u = i / n;
      const x = (1 - u) * (1 - u) * x1 + 2 * u * (1 - u) * cx + u * u * x2;
      const y = (1 - u) * (1 - u) * y1 + 2 * u * (1 - u) * cy + u * u * y2;
      const col = cols[(bi + seed) % cols.length];
      const sway = Math.sin(tt * 2 + bi * 0.9) * 6;
      const dead = lag > 0 && hash(bi * 3.7 + seed) < lag * 0.7;
      const lit = on * (dead ? 0 : 0.85 + 0.15 * Math.sin(tt * 3 + bi * 2.1));
      if (lit > 0.05 && !dead) glows += CI(x, y + r * 1.4, r * 3.2, { fill: 'url(#setsBulbGlow)', opacity: f(lit) });
      const bc = dead ? '#8E96A3' : on ? col : mix(col, '#5A5268', 0.55);
      bulbs += G(R(-r * 0.45, -2, r * 0.9, r * 0.9, 2, { fill: '#2C3040' }) + (dead ? R(-r * 0.8, r * 0.5, r * 1.6, r * 1.6, 3, ol(bc, 3)) : E(0, r * 1.45, r * 0.78, r, ol(bc, 3)) + E(-r * 0.25, r * 1.1, r * 0.22, r * 0.34, { fill: '#FFFFFF', opacity: on ? 0.8 : 0.35 })), tr(x, y, 1, sway));
      bi++;
    }
  }
  return glows + P(wire, ln(3.5, '#2C3040')) + bulbs;
}

// Juno's cat: tuxedo, chubby. pose 'sleep' (curled) | 'sit' | 'stand'. origin = floor contact centre.
function cat(x, y, s = 1, t = 0, opts = {}) {
  const pose = opts.pose || 'sleep';
  const c = (v) => desat(v, opts.grey || 0);
  const fur = c('#3A3A4C'), furHi = c('#55556B'), white = c('#FFFFFF'), pink = c('#FF9AB0');
  let o = '';
  if (pose === 'sleep') {
    const br = 1 + 0.03 * Math.sin(t * 2.2);
    const tw = Math.sin(t * 1.6) * 8;
    o += P(`M58 -12 Q96 -8 84 14 Q40 ${f(30 + tw * 0.3)} ${f(-40 + tw)} 14`, ln(20, LINE)) + P(`M58 -12 Q96 -8 84 14 Q40 ${f(30 + tw * 0.3)} ${f(-40 + tw)} 14`, ln(12, fur));
    o += G(E(0, -40, 80, 42, ol(fur, 6)) + P('M-40 -76 Q0 -90 50 -70', ln(7, furHi)), `translate(0 0) scale(1 ${f(br)})`);
    o += E(-58, -10, 22, 13, ol(white, 4)) + E(-24, -4, 20, 12, ol(white, 4));
    // head resting on the paws
    let h = E(0, 0, 40, 34, ol(fur, 6));
    h += P('M-34 -14 L-30 -52 L-8 -30 Z M10 -32 L30 -50 L34 -12 Z', ol(fur, 5)) + P('M-28 -22 L-26 -40 L-15 -30 Z', { fill: pink });
    h += P('M-16 8 Q-6 -8 0 4 Q6 -8 16 8 Q10 26 0 26 Q-10 26 -16 8 Z', { fill: white });
    h += P('M-22 -2 Q-15 4 -8 -2 M8 -2 Q15 4 22 -2', ln(4)) + P('M-4 8 L4 8 L0 13 Z', { fill: pink, stroke: LINE, 'stroke-width': 2 });
    o += G(h, 'translate(-62 -42) rotate(-8)');
    if (opts.zzz !== false) {
      for (let i = 0; i < 3; i++) {
        const ph = (t * 0.45 + i / 3) % 1;
        o += T('z', -40 + ph * 50 + i * 4, -100 - ph * 70, 22 + i * 6, '#FFFFFF', { opacity: f(Math.sin(ph * Math.PI)), ...OUTX(5) });
      }
    }
  } else {
    // sitting, facing camera, tail swishing
    const sw = Math.sin(t * 2.4) * 18;
    o += P(`M34 -14 Q90 -10 ${f(82 + sw * 0.4)} -70 Q${f(80 + sw)} -110 ${f(56 + sw)} -118`, ln(20, LINE)) + P(`M34 -14 Q90 -10 ${f(82 + sw * 0.4)} -70 Q${f(80 + sw)} -110 ${f(56 + sw)} -118`, ln(12, fur));
    o += P('M-56 0 Q-66 -70 -34 -112 L34 -112 Q66 -70 56 0 Z', ol(fur, 6));
    o += P('M-24 -104 Q0 -60 -16 0 L16 0 Q0 -60 24 -104 Z', { fill: white });
    o += E(-24, -6, 20, 12, ol(white, 4)) + E(24, -6, 20, 12, ol(white, 4));
    const bl = (t * 0.7 + 0.3) % 3 < 0.12;
    let h = E(0, 0, 50, 42, ol(fur, 6));
    h += P('M-44 -16 L-40 -64 L-12 -38 Z M12 -38 L40 -64 L44 -16 Z', ol(fur, 5)) + P('M-36 -28 L-35 -50 L-20 -36 Z M20 -36 L35 -50 L36 -28 Z', { fill: pink });
    h += P('M-22 10 Q-8 -10 0 6 Q8 -10 22 10 Q14 32 0 32 Q-14 32 -22 10 Z', { fill: white });
    if (bl) h += P('M-28 -4 Q-20 2 -12 -4 M12 -4 Q20 2 28 -4', ln(4));
    else h += E(-20, -6, 10, 12, ol('#FFE36E', 3)) + E(20, -6, 10, 12, ol('#FFE36E', 3)) + E(-19, -5, 3.5, 9, { fill: LINE }) + E(21, -5, 3.5, 9, { fill: LINE });
    h += P('M-5 10 L5 10 L0 16 Z', { fill: pink, stroke: LINE, 'stroke-width': 2 }) + P('M0 16 Q-6 22 -10 18 M0 16 Q6 22 10 18', ln(3));
    h += P('M-30 12 L-56 8 M-30 18 L-54 22 M30 12 L56 8 M30 18 L54 22', ln(2.5, '#FFFFFF', 0.8));
    o += G(h, 'translate(0 -142)');
  }
  return G(o, tr(x, y, s, opts.rot || 0));
}

// juice box (empty): origin bottom centre
function juiceBox(x, y, s = 1, rot = 0, col = '#FF8A3D', flat = false) {
  let o = R(-17, -50, 34, 50, 4, ol(col, 4)) + R(-17, -50, 10, 50, 3, { fill: '#FFFFFF', opacity: 0.18 }) + CI(0, -26, 9, { fill: '#FFFFFF', opacity: 0.85 }) + CI(0, -26, 5, { fill: col === '#7CD45A' ? '#FF5A6E' : '#7CD45A' });
  o += P('M8 -50 L12 -74 L22 -78', ln(4.5, '#FFFFFF')) + P('M8 -50 L12 -74 L22 -78', ln(1.5, '#FF5A6E'));
  if (flat) o = G(o, 'scale(1 0.78)');
  return G(o, tr(x, y, s, rot));
}
const JUICE_COLS = ['#FF8A3D', '#7CD45A', '#B07CFF', '#FF5A8A', '#3FC7E8'];

// ---------------------------------------------------------------- 2a. Juno's laptop (prop)
// laptop(x, y, s, screen, opts): origin = bottom centre of the base front edge.
// Screen box (local, s = 1): 416 x 234 centred on (0, -192). `screen` = svg centred on (0,0) of that box, or
// fn(w, h) => svg; use frameIn(bubbleIsland(t), 416, 234) to show a full game frame.
// opts: { off, glow (0..1 screen-light spill), lid (0..1 open, default 1), cat:true (cat asleep on the keyboard), grey }
const LAPTOP_SCREEN = { w: 416, h: 234, cx: 0, cy: -192 };
function laptop(x, y, s = 1, screen = '', opts = {}) {
  const c = (v) => desat(v, opts.grey || 0);
  const lid = clamp(opts.lid ?? 1, 0, 1);
  let o = '';
  // base / keyboard deck
  o += P('M-236 -50 L236 -50 L262 -10 L-262 -10 Z', ol(c('#9AA3B2'), 6));
  o += P('M-212 -46 L212 -46 L224 -26 L-224 -26 Z', { fill: 'url(#setsKeys)', stroke: LINE, 'stroke-width': 3 });
  o += R(-60, -23, 120, 11, 4, { fill: c('#B8C0CD'), stroke: LINE, 'stroke-width': 2.5 });
  o += R(-266, -14, 532, 16, 8, ol(c('#7E8796'), 5));
  o += tape(-254, -8, -190, -36, 16) + tape(206, -40, 250, -10, 14); // taped corners of the deck
  if (lid > 0.02) {
    const sy = lid;
    let L = '';
    L += R(-240, -332, 480, 284, 22, ol(c('#2C303C'), 7));
    L += R(-226, -318, 452, 256, 14, { fill: '#1A1D26' });
    const sc = opts.off ? R(-208, -309, 416, 234, 6, { fill: '#0E1018' }) + P('M-180 -300 L-120 -300 L-200 -150 Z', { fill: '#FFFFFF', opacity: 0.06 })
      : G(R(-208, -117, 416, 234, 0, { fill: '#10203A' }) + screenOf(screen, 416, 234), null, { 'clip-path': 'url(#setsClipLaptop)' });
    L += opts.off ? sc : G(sc, 'translate(0 -192)');
    if (!opts.off) L += R(-208, -309, 416, 234, 6, { fill: 'url(#setsScreenShine)' });
    L += R(-208, -309, 416, 234, 6, ln(4, '#0A0B10'));
    L += CI(0, -322, 4, { fill: '#5A6070' }) + CI(0, -322, 1.6, { fill: opts.off ? '#5A6070' : '#46FF8A' });
    // the famous tape: a crack across the top-left corner, patched; hinge wraps; stickers
    L += P('M-240 -250 L-214 -262 L-200 -246 L-176 -268', ln(3, '#0A0B10'));
    L += tape(-250, -250, -176, -340, 22) + tape(-252, -300, -196, -280, 16, '#B9C0CA');
    L += tape(-236, -46, -168, -64, 18);
    L += G(CI(0, 0, 13, ol('#9FE8FF', 3)) + CI(-4, -4, 3.5, { fill: '#FFFFFF' }), 'translate(150 -62)');
    L += G(P('M-14 3 Q-14 -12 0 -12 Q14 -12 14 3 Z', ol('#FFD21F', 3)) + R(-17, 1, 34, 6, 3, ol('#FFD21F', 2.5)), 'translate(184 -60) rotate(8)');
    L += G(R(-22, -9, 44, 18, 4, ol('#FF6FA8', 2.5)) + TF('BUILD', 0, 5, 11, '#FFFFFF'), 'translate(-120 -61) rotate(-4)');
    o += sy < 1 ? G(L, `translate(0 -50) scale(1 ${f(sy)}) translate(0 50)`) : L;
  }
  if (opts.cat) o += cat(30, -40, 0.62, opts.t || 0, { pose: 'sleep', zzz: !!opts.zzz, grey: opts.grey });
  return G(o, tr(x, y, s, opts.rot || 0));
}

// ---------------------------------------------------------------- attic layers
function atticLayers(t, opts = {}) {
  const night = !!opts.night || opts.time === 'night';
  const time = night ? 'night' : opts.time || 'day';
  const lag = clamp(opts.lag || 0, 0, 1);
  const hatchOpen = clamp(opts.hatchOpen === true ? 1 : opts.hatchOpen || 0, 0, 1);
  const lightsOn = opts.lights ?? (night ? 0 : 1);
  // lag: choppy idle time + random jumps
  const tt = lag > 0 ? stutterT(t, lerp(24, 2.5, lag)) : t;
  const jit = lag > 0 ? (hash(Math.floor(t * lerp(24, 2.5, lag)) * 1.37) - 0.5) * 30 * lag : 0;

  // ---- bg: sky through the round window
  const bg = skyBg(tt, time, AT.win.x, AT.win.y);

  // ---- mid: the room
  let m = '';
  const W = AT.win;
  // back wall with a round hole
  const wallD = `M${AT.x0} ${AT.base} L${AT.x0} ${AT.knee} L960 ${AT.peak} L${AT.x1} ${AT.knee} L${AT.x1} ${AT.base} Z ` + circD(W.x, W.y, W.r + 4);
  m += P(wallD, { fill: 'url(#setsAtticWall)', 'fill-rule': 'evenodd' }) + P(wallD, { fill: 'url(#setsShiplap)', 'fill-rule': 'evenodd' });
  // knee walls
  for (const sd of [-1, 1]) {
    const bx = sd < 0 ? AT.x0 : AT.x1;
    m += poly([[bx, AT.base], [bx, AT.knee], pk(bx, AT.knee, 1.75), pk(bx, AT.base, 1.75)], { fill: 'url(#setsAtticKnee)' });
    m += P(pline([pk(bx, AT.base - 26, 1), pk(bx, AT.base - 26, 1.75)]), ln(4, '#2F7C74', 0.5));
  }
  // roof planes (wood boards running toward camera)
  for (const sd of [-1, 1]) {
    const bx = sd < 0 ? AT.x0 : AT.x1;
    const far = sd < 0 ? -300 : 2220;
    m += poly([[bx, AT.knee], [960, AT.peak], [960, -420], [far, -420], pk(bx, AT.knee, Math.abs(960 - far) / 690)], { fill: 'url(#setsAtticRoof)' });
    let rays = '';
    for (let i = 1; i < 7; i++) {
      const u = i / 7;
      const p0 = [lerp(bx, 960, u), lerp(AT.knee, AT.peak, u)];
      rays += pline([p0, pk(p0[0], p0[1], 3)]) + ' ';
    }
    m += P(rays, ln(4, '#8A5129', 0.55));
  }
  // floor
  m += poly([[AT.x0, AT.base], [AT.x1, AT.base], pk(AT.x1, AT.base, 2.5), pk(AT.x0, AT.base, 2.5)], { fill: 'url(#setsAtticFloor)' });
  m += poly([pk(AT.x0, AT.base, 1.75), [AT.x0, AT.base], [AT.x0 - 20, AT.base + 400], [-300, 1200]], { fill: '#CF9358' });
  m += poly([pk(AT.x1, AT.base, 1.75), [AT.x1, AT.base], [AT.x1 + 20, AT.base + 400], [2220, 1200]], { fill: '#CF9358' });
  let fr = '';
  for (let i = -3; i <= 15; i++) { const X = AT.x0 + i * 115; fr += pline([[X, AT.base], pk(X, AT.base, 2.5)]) + ' '; }
  m += P(fr, ln(3.5, '#A8703F', 0.75));
  let butt = '';
  for (let i = -3; i < 15; i++) {
    const X = AT.x0 + i * 115, k = [1.12, 1.38, 1.7, 2.05][Math.floor(hash(i * 2.3 + 4) * 4)];
    butt += pline([pk(X, AT.base, k), pk(X + 115, AT.base, k)]) + ' ';
  }
  m += P(butt, ln(3, '#A8703F', 0.6));
  // light shaft from the window (day / evening)
  if (time !== 'night') {
    const bk = time === 'evening' ? 0.7 : 1;
    m += poly([[W.x - 90, W.y - 60], [W.x + 80, W.y - 100], [1330, 905], [1010, 935]], { fill: 'url(#setsBeam)', opacity: f(0.55 * bk) });
    m += E(1175, 915, 190, 36, { fill: '#FFF4C8', opacity: f(0.16 * bk) });
  }
  // knee walls (between the back trim and the first rafter): pinned blueprint + notes (left), vent + pennant (right)
  m += onKnee(-1, 175, 600, R(-130, -100, 260, 200, 6, ol('#2F6FD6', 5)) + R(-120, -90, 240, 180, 3, { fill: 'none', stroke: '#FFFFFF', 'stroke-width': 2, opacity: 0.5 }) +
    CI(-30, 26, 54, ln(4, '#DDEBFF')) + P('M-70 40 Q-30 18 10 40 L0 66 L-60 66 Z', ln(4, '#DDEBFF')) + P('M-100 -64 L60 -64 M-100 -70 L-100 -58 M60 -70 L60 -58', ln(3, '#DDEBFF')) +
    TF('BUBBLE v2', 64, -24, 22, '#FFFFFF') + TF('top view', 70, 2, 15, '#BFD6FF') + pin(-120, -90) + pin(120, -90, '#FFD21F'));
  m += onKnee(-1, 300, 430, stickyNote(0, 0, -6, '#FFE36E', ['NO', 'BUGS!'], 18, 80));
  m += onKnee(-1, 70, 445, stickyNote(0, 0, 5, '#FF9EC4', ['pop', 'SFX?'], 18, 80));
  m += onKnee(1, 120, 560, CI(0, 0, 62, ol('#F4E6C8', 6)) + CI(0, 0, 48, { fill: '#3A3550' }) + P('M-44 -18 L44 -18 M-46 0 L46 0 M-44 18 L44 18', ln(8, '#F4E6C8')) + CI(0, 0, 48, ln(5)));
  m += onKnee(1, 300, 440, P('M-60 -34 L60 -34 L60 -8 L-34 34 Z', ol('#FF7A59', 5)) + TF('BUILD!', 0, -14, 22, '#FFFFFF', { transform: 'rotate(-12)' }));
  // structure: rafters + studs (bent beams at depth k), back trim, baseboard
  const beam = (pts, w, col = '#9A5B30', hi = '#C58248') => P(pline(pts), ln(w + 11, LINE)) + P(pline(pts), ln(w, col)) + P(pline(pts), ln(w * 0.28, hi, 0.7));
  for (const k of [1.32, 1.78]) for (const bx of [AT.x0, AT.x1]) m += beam([pk(bx, AT.base + 6, k), pk(bx, AT.knee, k), pk(960, AT.peak, k)], 30 * k);
  m += beam([[AT.x0, AT.base], [AT.x0, AT.knee], [960, AT.peak], [AT.x1, AT.knee], [AT.x1, AT.base]], 24, '#B06C38', '#D9934F');
  m += P(pline([[AT.x0, AT.base - 8], [AT.x1, AT.base - 8]]), ln(26, LINE)) + P(pline([[AT.x0, AT.base - 8], [AT.x1, AT.base - 8]]), ln(16, '#F4E6C8'));
  // round window frame + mullions + glass shine
  m += P(circD(W.x, W.y, W.r + 26) + ' ' + circD(W.x, W.y, W.r), { fill: '#FFF1D2', 'fill-rule': 'evenodd', stroke: LINE, 'stroke-width': 7 });
  m += R(W.x - 8, W.y - W.r, 16, W.r * 2, 4, ol('#FFF1D2', 5)) + R(W.x - W.r, W.y - 8, W.r * 2, 16, 4, ol('#FFF1D2', 5));
  m += P(`M${W.x - 80} ${W.y + 20} L${W.x - 20} ${W.y - 74} L${W.x + 6} ${W.y - 74} L${W.x - 56} ${W.y + 30} Z`, { fill: '#FFFFFF', opacity: time === 'night' ? 0.08 : 0.28 });
  for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2 + 0.39; m += CI(W.x + Math.cos(a) * (W.r + 13), W.y + Math.sin(a) * (W.r + 13), 3.5, { fill: '#C9A46A' }); }

  // ---- wall decor
  // back wall: blueprint B right of the window + notes; sticky notes above the laptop
  {
    let b = R(-130, -95, 260, 190, 6, ol('#2F6FD6', 6)) + R(-118, -83, 236, 166, 3, { fill: 'none', stroke: '#FFFFFF', 'stroke-width': 2, opacity: 0.45 });
    b += CI(-40, 10, 52, ln(4, '#DDEBFF')) + P('M-80 26 Q-40 4 0 26 L-12 48 L-68 48 Z', ln(3.5, '#DDEBFF')) + CI(46, -24, 26, ln(3.5, '#DDEBFF')) + CI(70, 40, 18, ln(3, '#DDEBFF'));
    b += P('M-100 -70 L20 -70 M-100 -74 L-100 -66 M20 -74 L20 -66', ln(3, '#DDEBFF')) + TF('12 islands', 66, -56, 18, '#FFFFFF') + TF('300 bubbles', 66, 82, 16, '#BFD6FF');
    b += P('M10 10 L40 -10', ln(3, '#FFE36E')) + pin(-120, -86) + pin(120, -86, '#FFD21F');
    m += G(b, tr(1300, 345, 1, 2));
  }
  m += stickyNote(1475, 270, 7, '#B7F27A', ['VISITS', 'GOAL: 10'], 17);
  m += stickyNote(520, 300, -8, '#FFE36E', ['fix', 'jump!!'], 19, 84);
  m += stickyNote(615, 268, 4, '#FF9EC4', ['MORE', 'BUBBLES'], 16, 84);
  m += stickyNote(712, 300, -3, '#9FE8FF', ['make', 'them POP'], 16, 84);
  // shelf with clutter
  m += R(1175, 512, 300, 18, 5, ol('#C98A52', 5)) + P('M1200 530 L1200 556 L1226 530 M1450 530 L1450 556 L1424 530', ln(7, '#8A5530'));
  m += R(1192, 444, 64, 68, 8, ol('#2EC4B6', 5)) + E(1224, 446, 32, 9, ol('#1E9E94', 4)) + P('M1196 470 L1252 470', ln(4, '#1E9E94')) + P('M1240 446 Q1250 420 1238 404', ln(5, '#FF7A59'));
  m += R(1276, 456, 54, 56, 10, ol('#DDF4FF', 4)) + R(1272, 448, 62, 14, 5, ol('#FF7A59', 4));
  for (let i = 0; i < 5; i++) m += CI(1288 + (i % 3) * 14, 494 - Math.floor(i / 3) * 14, 5, { fill: '#9AA3B2', stroke: LINE, 'stroke-width': 1.5 });
  m += P('M1352 512 L1356 470 L1404 470 L1408 512 Z', ol('#E8603C', 4)) + P('M1380 470 Q1360 430 1370 412 M1380 470 Q1384 420 1400 408 M1380 470 Q1400 440 1414 440', ln(9, '#4FB86A')) + P('M1380 470 Q1360 430 1370 412 M1380 470 Q1384 420 1400 408 M1380 470 Q1400 440 1414 440', ln(4, '#7FDB8E'));
  m += CI(1446, 482, 28, ol('#C9F1FF', 4)) + P('M1430 492 Q1446 482 1462 492 L1456 502 L1436 502 Z', { fill: '#6FD06A', stroke: LINE, 'stroke-width': 2.5 }) + P('M1432 470 Q1438 460 1448 458', ln(3, '#FFFFFF')) + R(1426, 506, 40, 8, 3, ol('#C98A52', 3));
  // boxes in the right corner
  m += R(1478, 676, 166, 120, 6, ol('#D9A866', 6)) + P('M1478 700 L1644 700', ln(4, '#B9884A')) + TF('XMAS', 1561, 760, 30, '#C0392B', { transform: 'rotate(-3 1561 760)' });
  m += R(1500, 590, 130, 90, 6, ol('#E3B676', 6)) + P('M1500 610 L1630 610', ln(4, '#B9884A')) + TF('OLD TOYS', 1565, 652, 20, '#3A2A3A');

  // ---- string lights along the roof trim (mid)
  m += stringLights([[340, 333], [640, 133], [1280, 133], [1580, 333]], tt, { sag: 48, on: lightsOn, seed: 2, lag, jitter: jit });

  // ---- workbench desk
  m += R(296, 732, 618, 20, 4, ol('#B87A44', 5));
  m += R(326, 618, 34, 206, 6, ol('#B87A44', 6)) + R(858, 618, 34, 206, 6, ol('#B87A44', 6));
  m += R(340, 676, 110, 56, 8, ol('#E8503A', 5)) + R(372, 664, 46, 14, 6, ln(5)) + R(388, 696, 16, 10, 2, ol('#FFD21F', 3));
  m += R(700, 670, 140, 62, 6, ol('#D9A866', 5)) + CI(728, 668, 15, ol('#2F6FD6', 4)) + CI(760, 664, 15, ol('#FFFFFF', 4)) + CI(792, 668, 15, ol('#2F6FD6', 4));
  m += R(278, 572, 652, 22, 6, ol('#EDB676', 5)) + R(270, 588, 668, 32, 6, ol('#D08E52', 6)) + P('M282 598 L926 598', ln(3, '#F2C08A', 0.8));
  m += R(256, 584, 30, 40, 4, ol('#8E96A3', 4)) + R(246, 620, 50, 10, 3, ol('#8E96A3', 3)); // little vise
  // desk lamp (left end)
  {
    const on = night ? 0 : 1;
    let l = E(0, 0, 38, 10, ol('#FF7A59', 5)) + P('M0 -6 L-18 -96 L30 -128', ln(15, LINE)) + P('M0 -6 L-18 -96 L30 -128', ln(8, '#FF7A59'));
    l += CI(-18, -96, 8, ol('#FFD21F', 3));
    l += G(P('M-20 -14 L20 -14 L34 20 L-34 20 Z', ol('#FF7A59', 5)) + E(0, 21, 34, 7, ol(on ? '#FFF2B0' : '#C9B98A', 4)), 'translate(42 -120) rotate(-32)');
    if (on) l += P('M40 -100 L150 30 L40 30 L10 -92 Z', { fill: '#FFF2B0', opacity: 0.16 });
    m += G(l, 'translate(318 584)');
  }
  m += G(E(0, 0, 26, 26, ol('#C9CFD8', 5)) + E(0, 0, 11, 11, ol('#E3B676', 4)), 'translate(420 566)');
  // juice boxes (opts.juice = how many empties)
  const nj = Math.max(0, Math.round(opts.juice ?? 2));
  for (let i = 0; i < nj; i++) {
    const slots = [[836, 585], [872, 585], [908, 585], [854, 535], [890, 535], [872, 485], [960, 800, 1], [994, 806, 1], [1028, 800, 1], [977, 752, 1], [1011, 752, 1], [994, 704, 1]];
    const [jx, jy] = slots[i % slots.length];
    m += juiceBox(jx, jy, 0.95, (hash(i * 3.1) - 0.5) * 14, JUICE_COLS[i % JUICE_COLS.length]);
  }
  // laptop on the desk
  const scr = opts.screen !== undefined ? opts.screen : (w, h) => R(-w / 2, -h / 2, w, h, 0, { fill: '#8FB8FF' });
  m += laptop(ATTIC_LAPTOP.x, ATTIC_LAPTOP.y, ATTIC_LAPTOP.s, scr, { off: opts.laptopOff, cat: opts.cat === 'keyboard', t: tt, zzz: false });
  // wobbly stool in front of the desk
  if (opts.stool !== false) {
    const sx = opts.stoolX ?? 640;
    m += P(`M${sx - 46} 748 L${sx - 62} 880 M${sx + 46} 748 L${sx + 62} 880 M${sx} 752 L${sx} 870`, ln(17, LINE)) + P(`M${sx - 46} 748 L${sx - 62} 880 M${sx + 46} 748 L${sx + 62} 880 M${sx} 752 L${sx} 870`, ln(9, '#B87A44'));
    m += P(`M${sx - 54} 820 L${sx + 54} 820`, ln(12, LINE)) + P(`M${sx - 54} 820 L${sx + 54} 820`, ln(5, '#B87A44'));
    m += E(sx, 750, 76, 15, ol('#2EC4B6', 5)) + E(sx, 736, 70, 20, ol('#FFD34D', 5)) + E(sx - 20, 730, 30, 7, { fill: '#FFF2B0' });
  }
  // bucket of rolled blueprints
  m += P('M940 712 L960 800 L1030 800 L1050 712 Z', ol('#2EC4B6', 5)) + P('M944 730 L1046 730', ln(4, '#1E9E94'));
  m += R(958, 640, 22, 80, 10, ol('#2F6FD6', 4)) + R(984, 620, 22, 100, 10, ol('#F4F1E6', 4)) + R(1010, 650, 22, 70, 10, ol('#5A97F0', 4));

  // ---- cat bed + cat (front left)
  const catAt = opts.cat === 'keyboard' || opts.cat === false || opts.cat === 'none' ? null : opts.cat || 'bed';
  m += E(185, 878, 112, 40, ol('#FF8A6B', 6)) + E(185, 870, 86, 24, ol('#E8604A', 4)) + E(185, 874, 78, 18, { fill: '#FFC8B8' });
  if (catAt === 'bed') m += cat(190, 882, 0.8, tt, { pose: 'sleep', zzz: !lag });
  else if (catAt === 'sit') m += cat(opts.catX ?? 190, opts.catY ?? 880, 0.8, tt, { pose: 'sit' });

  // ---- floor hatch
  m += hatchPart(t, hatchOpen, 'back');

  // ---- lag: grey loading blocks creeping over things, spinners, desaturation
  if (lag > 0) {
    m += lagBlocks(1170, 230, 270, 210, lag, t, 3, 45, 'r');
    m += lagBlocks(1180, 400, 300, 132, lag * 0.95, t, 5, 44, 'r');
    m += lagBlocks(1478, 588, 168, 210, lag * 0.9, t, 7, 42, 'u');
    m += lagBlocks(W.x - 150, W.y - 150, 300, 300, lag * 0.7, t, 9, 50, 'r');
    m += lagBlocks(80, 830, 220, 90, lag * 0.8, t, 11, 45, 'l');
    m += lagBlocks(-40, 380, 300, 300, lag * 0.75, t, 13, 50, 'l');
    if (lag > 0.25) m += spinner(1325, 470, 26, t, '#E9EDF3') + spinner(960, 250, 30, t + 0.3, '#E9EDF3');
    m += R(-800, -600, 3520, 2280, 0, { fill: '#8C93A0', opacity: f(0.22 * lag) });
  }

  // ---- fg: close bulbs hanging into the top corners
  let fg = '';
  fg += stringLights([[-60, 40], [430, -30]], tt + 0.7, { sag: 50, gap: 92, r: 22, on: lightsOn, seed: 4, lag, jitter: jit * 1.4 });
  fg += stringLights([[1500, -30], [1990, 40]], tt + 1.3, { sag: 50, gap: 92, r: 22, on: lightsOn, seed: 1, lag, jitter: -jit * 1.4 });
  // ---- light: night = only the laptop glows
  let light = '';
  if (night) light = R(-800, -600, 3520, 2280, 0, { fill: 'url(#setsAtticNight)' }) + R(-800, -600, 3520, 2280, 0, { fill: 'url(#setsLaptopGlow)' });
  else if (time === 'evening') light = R(-800, -600, 3520, 2280, 0, { fill: '#FF9A5A', opacity: 0.12 });
  return { bg, mid: m, fg, light };
}

// the floor hatch: part 'back' (hole + lid, drawn in mid) or 'front' (floor lip + ladder handrail that hides a
// character climbing out — draw after the character). open 0..1.
function hatchPart(t, open, part) {
  const H = HATCH;
  const a = ease.inOut(open) * 2.05; // radians, leans back past vertical when fully open
  const zb = 1500 / H.kb, zf = 1500 / H.kf, L = zb - zf;
  const fp = (X) => { const z = zb - L * Math.cos(a), h = L * Math.sin(a); return hatchPt(X, 1500 / z, h); };
  const b0 = hatchPt(H.X0, H.kb), b1 = hatchPt(H.X1, H.kb), f0 = hatchPt(H.X0, H.kf), f1 = hatchPt(H.X1, H.kf);
  let o = '';
  if (part === 'back') {
    if (open > 0.01) {
      // hole: lit from the hallway below, ladder top inside
      o += poly([b0, b1, f1, f0], { fill: 'url(#setsHatchGlow)', stroke: LINE, 'stroke-width': 6 });
      o += poly([b0, b1, [b1[0] + 4, b1[1] + 22], [b0[0] - 3, b0[1] + 22]], { fill: '#FFE2A0' });
      const r0 = [lerp(f0[0], f1[0], 0.22), f0[1]], r1 = [lerp(f0[0], f1[0], 0.78), f0[1]];
      o += P(pline([r0, [lerp(b0[0], b1[0], 0.24), b0[1] + 30]]) + ' ' + pline([r1, [lerp(b0[0], b1[0], 0.76), b0[1] + 30]]), ln(14, LINE)) + P(pline([r0, [lerp(b0[0], b1[0], 0.24), b0[1] + 30]]) + ' ' + pline([r1, [lerp(b0[0], b1[0], 0.76), b0[1] + 30]]), ln(7, '#C98A52'));
      for (const u of [0.35, 0.75]) o += P(pline([[lerp(r0[0], lerp(b0[0], b1[0], 0.24), u), lerp(r0[1], b0[1] + 30, u)], [lerp(r1[0], lerp(b0[0], b1[0], 0.76), u), lerp(r1[1], b0[1] + 30, u)]]), ln(9, '#8A5530'));
      // the lid
      const q0 = fp(H.X0), q1 = fp(H.X1);
      const under = a > Math.PI / 2 - 0.15;
      o += poly([b0, b1, q1, q0], ol(under ? '#B9804A' : '#C98A52', 6));
      let pl = '';
      for (const u of [0.25, 0.5, 0.75]) pl += pline([lerp2(b0, b1, u), lerp2(q0, q1, u)]) + ' ';
      o += P(pl, ln(3.5, '#8A5530', 0.7));
      if (under) o += P(pline([lerp2(b0, q0, 0.3), lerp2(b1, q1, 0.3)]) + ' ' + pline([lerp2(b0, q0, 0.75), lerp2(b1, q1, 0.75)]), ln(10, '#8A5530')) + CI(lerp(q0[0], q1[0], 0.5), lerp(b0[1], q0[1], 0.55), 9, ol('#8E96A3', 3));
    } else {
      o += poly([b0, b1, f1, f0], ol('#C38A55', 5)) + P(pline([lerp2(b0, f0, 0.5), lerp2(b1, f1, 0.5)]), ln(3, '#A8703F', 0.8));
      const mx = (f0[0] + f1[0]) / 2;
      o += E(mx, f0[1] - 18, 20, 8, ln(5, '#5A6070')) + R(mx - 8, f0[1] - 14, 16, 8, 2, { fill: '#5A6070' });
    }
  } else if (part === 'front' && open > 0.01) {
    // floor in front of the hole (same colours as the floor) + the ladder's handrail post
    o += poly([[f0[0] - 30, f0[1]], [f1[0] + 40, f1[1]], [f1[0] + 120, 1100], [f0[0] - 110, 1100]], { fill: '#C08650' });
    o += P(`M${f(f0[0] - 26)} ${f(f0[1])} L${f(f1[0] + 36)} ${f(f1[1])}`, ln(6, LINE));
    const px = lerp(f0[0], f1[0], 0.06);
    o += P(`M${f(px)} ${f(f0[1] + 6)} L${f(px)} ${f(f0[1] - 150)}`, ln(18, LINE)) + P(`M${f(px)} ${f(f0[1] + 6)} L${f(px)} ${f(f0[1] - 150)}`, ln(9, '#C98A52')) + CI(px, f0[1] - 156, 13, ol('#E3B676', 5));
  }
  return o;
}
const lerp2 = (A, B, u) => [lerp(A[0], B[0], u), lerp(A[1], B[1], u)];

const attic = makeSet(atticLayers);
// floor piece + handrail in front of the open hatch: draw it AFTER a character climbing out of the hatch
attic.hatchFront = (t, opts = {}) => hatchPart(t, clamp(opts.hatchOpen === true ? 1 : opts.hatchOpen ?? 1, 0, 1), 'front');
// the night light overlay alone (draw after characters when not using layers)
attic.light = (t, opts = {}) => atticLayers(t, opts).light;
attic.cat = cat;

// ---------------------------------------------------------------- 1b. attic stairs (hallway below the hatch)
// A steep wooden attic ladder from the hallway floor up into the open hatch (warm light from the attic).
// Layers: mid = hallway + ladder treads + far rail; fg = near handrail (Dex hugs it). FLOOR.atticStairs = 1000.
// atticStairs.at(u) -> {x, y, rot} on the ladder centre line (u 0 = floor, 1 = top) for feet placement.
const LAD = { b: [860, 1000], top: [1160, 150], wb: 300, wt: 230, n: 11 };
function ladderAt(u) {
  const x = lerp(LAD.b[0], LAD.top[0], u), y = lerp(LAD.b[1], LAD.top[1], u);
  return { x, y, rot: (Math.atan2(LAD.top[0] - LAD.b[0], LAD.b[1] - LAD.top[1]) * 180) / Math.PI, w: lerp(LAD.wb, LAD.wt, u) };
}
function stairsLayers(t, opts = {}) {
  let m = '';
  // walls
  m += R(-800, -600, 3520, 1600, 0, { fill: 'url(#setsWallpaper)' });
  m += R(-800, 660, 3520, 330, 0, { fill: '#D9A066' }) + R(-800, 650, 3520, 22, 4, ol('#F4E6C8', 5));
  for (let x = -40; x < 1960; x += 240) m += R(x + 20, 700, 200, 250, 10, { fill: 'none', stroke: '#B87A44', 'stroke-width': 5 });
  // ceiling (seen from below) + the open hatch glowing with attic light
  m += poly([[-200, -100], [2120, -100], [2120, 150], [-200, 150]], { fill: '#EFE2CC' }) + P('M-200 150 L2120 150', ln(10, LINE)) + P('M-200 164 L2120 164', ln(8, '#E3D2B4'));
  m += poly([[990, 150], [1330, 150], [1380, 20], [940, 20]], { fill: '#FFD48A', stroke: LINE, 'stroke-width': 7 });
  m += P('M1000 20 L1060 -40 M1320 20 L1270 -40', ln(16, '#9A5B30')) + P('M960 70 Q1160 120 1360 66', ln(3, '#2C3040'));
  for (let i = 0; i < 5; i++) m += E(1010 + i * 80, 86 + Math.sin(i) * 6, 9, 12, ol(['#FF6FA8', '#4FD1C5', '#FFD34D', '#FF8A4C', '#4FD1C5'][i], 2.5));
  m += poly([[990, 150], [1330, 150], [1130, 1000], [520, 1000]], { fill: '#FFE7A8', opacity: 0.14 });
  m += E(1160, 160, 520, 300, { fill: 'url(#setsLampGlow)' });
  // the lid hanging down from the hatch's left edge
  m += poly([[990, 150], [930, 380], [960, 392], [1012, 156]], ol('#C98A52', 5));
  // door at left + photo frames + switch
  m += R(80, 250, 300, 650, 10, ol('#F4E6C8', 7)) + R(100, 270, 260, 630, 6, ol('#B8794A', 5)) + R(126, 300, 208, 250, 8, { fill: 'none', stroke: '#9A6238', 'stroke-width': 5 }) + R(126, 590, 208, 270, 8, { fill: 'none', stroke: '#9A6238', 'stroke-width': 5 }) + CI(330, 600, 12, ol('#FFD34D', 4));
  m += R(470, 300, 150, 120, 8, ol('#FFFFFF', 6)) + R(484, 314, 122, 92, 4, { fill: '#9FD8FF' }) + CI(520, 380, 18, { fill: '#FFC2A0' }) + CI(560, 372, 22, { fill: '#FFC2A0' }) + R(500, 392, 90, 14, 4, { fill: '#5DBB63' });
  m += R(500, 460, 90, 110, 8, ol('#FFD34D', 6)) + E(545, 515, 26, 34, { fill: '#2EC4B6' }) + R(1560, 520, 40, 64, 8, ol('#FFFFFF', 4)) + R(1572, 536, 16, 22, 4, { fill: '#D9DEE6' });
  // floor + runner
  m += R(-800, 990, 3520, 400, 0, { fill: 'url(#setsHallFloor)' }) + P('M-800 990 L2720 990', ln(8, LINE)) + E(880, 1040, 520, 40, { fill: '#2EC4B6', opacity: 0.85 });
  m += E(880, 1036, 440, 26, { fill: 'none', stroke: '#FFD34D', 'stroke-width': 6, opacity: 0.8 });
  // ladder: far rail, treads
  const rail = (side, w, col) => {
    const pts = [[LAD.b[0] + side * LAD.wb / 2, LAD.b[1]], [LAD.top[0] + side * LAD.wt / 2, LAD.top[1]]];
    return P(pline(pts), ln(w + 12, LINE)) + P(pline(pts), ln(w, col)) + P(pline(pts), ln(w * 0.25, '#E8B072', 0.7));
  };
  m += rail(-1, 30, '#B87A44');
  for (let i = 1; i <= LAD.n; i++) {
    const p = ladderAt(i / (LAD.n + 1));
    m += G(R(-p.w / 2, -14, p.w, 28, 6, ol('#D99A5C', 6)) + R(-p.w / 2 + 6, 6, p.w - 12, 8, 3, { fill: '#9A5B30' }), tr(p.x, p.y));
  }
  m += rail(1, 30, '#C98A52');
  // handrail post + rail in front (fg)
  const hr0 = [LAD.b[0] + LAD.wb / 2 + 70, LAD.b[1] - 330], hr1 = [LAD.top[0] + LAD.wt / 2 + 70, LAD.top[1] - 20];
  let fg = P(pline([hr0, hr1]), ln(30, LINE)) + P(pline([hr0, hr1]), ln(18, '#E3B676')) + P(pline([hr0, hr1]), ln(5, '#FFF0C8', 0.8));
  fg += P(pline([[hr0[0], hr0[1]], [hr0[0] - 20, LAD.b[1]]]), ln(26, LINE)) + P(pline([[hr0[0], hr0[1]], [hr0[0] - 20, LAD.b[1]]]), ln(14, '#C98A52')) + CI(hr0[0], hr0[1] - 4, 18, ol('#E3B676', 6));
  return { bg: '', mid: m, fg, light: R(-800, -600, 3520, 2280, 0, { fill: '#3A2250', opacity: 0.1 }) };
}
const atticStairs = makeSet(stairsLayers);
atticStairs.at = ladderAt;

// ================================================================= 2b. BUBBLE ISLAND — Juno's game (full-frame game view)
// opts: { visits (number|string, default 3; null hides the counter), bites (0..8, fractional animates the last bite),
//   freeze (true = idle motion stops + ping warning; freezeAt = frozen time), grey 0..1, pop 0..1 (bubbles pop one by
//   one; islands stay), void (the "secret underwater level": endless grey), hud:false }
// bubbleIsland.ISLANDS = [{x, y, r, top}] bubble centres/radii + `top` = grass y where an avatar stands (at bob 0);
// bubbleIsland.bob(i, t) = current vertical bob of bubble i. bubbleIsland.avatar(x, y, s, t, opts) = blocky avatar.
const BUB = [
  { x: 720, y: 560, r: 272, deco: 'house', w: 1.35, seed: 1 },
  { x: 1370, y: 400, r: 200, deco: 'tree', w: 1.3, seed: 2 },
  { x: 285, y: 300, r: 150, deco: 'flowers', w: 1.3, seed: 3 },
  { x: 1650, y: 800, r: 170, deco: 'mush', w: 1.3, seed: 4 },
  { x: 1120, y: 165, r: 104, deco: 'palm', w: 1.3, seed: 5 },
  { x: 245, y: 790, r: 138, deco: 'crystal', w: 1.3, seed: 6 },
  { x: 1800, y: 170, r: 72, deco: 'tree', w: 1.3, seed: 7, far: 0.35 },
];
BUB.forEach((b) => { b.top = b.y + b.r * 0.2; });
const POP_ORDER = [4, 2, 6, 1, 5, 3, 0]; // which bubble pops first..last
const bubBob = (i, t) => Math.sin(t * 0.9 + i * 1.7) * 9;

function bubbleD(cx, cy, r, bites) {
  if (!bites.length) return circD(cx, cy, r);
  const bs = [...bites].sort((a, b) => a.a - b.a);
  const pt = (a, rr, ox = cx, oy = cy) => [ox + Math.cos(a) * rr, oy + Math.sin(a) * rr];
  let d = '';
  bs.forEach((b, i) => {
    const phi = 2 * Math.asin(clamp(b.b / (2 * r), 0, 0.99));
    const psi = Math.acos(clamp(b.b / (2 * r), 0, 1));
    const [bx, by] = pt(b.a, r);
    const p1 = pt(b.a - phi, r), p2 = pt(b.a + phi, r);
    if (i === 0) d += `M${f(p1[0])} ${f(p1[1])}`;
    else d += ` A${f(r)} ${f(r)} 0 0 1 ${f(p1[0])} ${f(p1[1])}`;
    const th1 = b.a + Math.PI + psi, th2 = b.a + Math.PI - psi;
    for (let j = 1; j < 18; j++) {
      const u = j / 18, th = lerp(th1, th2, u);
      const rr = b.b * (0.84 + 0.16 * Math.abs(Math.sin(3 * Math.PI * u)));
      const q = pt(th, rr, bx, by);
      d += ` L${f(q[0])} ${f(q[1])}`;
    }
    d += ` L${f(p2[0])} ${f(p2[1])}`;
  });
  const first = bs[0], phi0 = 2 * Math.asin(clamp(first.b / (2 * r), 0, 0.99));
  const p0 = pt(first.a - phi0, r);
  const last = bs[bs.length - 1], phiL = 2 * Math.asin(clamp(last.b / (2 * r), 0, 0.99));
  const span = (first.a - phi0 + Math.PI * 2) - (last.a + phiL);
  d += ` A${f(r)} ${f(r)} 0 ${span > Math.PI ? 1 : 0} 1 ${f(p0[0])} ${f(p0[1])} Z`;
  return d;
}

// a floating grassy island (Roblox-ish blocks): (x, y) = grass top centre, w = width
function floatIsland(x, y, w, tt, deco, seed, gc) {
  const h = w * 0.56;
  let o = '';
  // underside rock
  o += P(`M${f(-w / 2)} 0 L${f(w / 2)} 0 L${f(w * 0.42)} ${f(h * 0.35)} L${f(w * 0.2)} ${f(h * 0.5)} L${f(w * 0.08)} ${f(h)} L${f(-w * 0.12)} ${f(h * 0.62)} L${f(-w * 0.36)} ${f(h * 0.42)} Z`, ol(gc('#B87A4A'), 5));
  o += P(`M${f(-w * 0.36)} ${f(h * 0.2)} L${f(w * 0.3)} ${f(h * 0.2)} M${f(-w * 0.16)} ${f(h * 0.42)} L${f(w * 0.16)} ${f(h * 0.42)}`, ln(4, gc('#94603A'), 0.8));
  o += P(`M${f(w * 0.05)} ${f(h * 0.75)} L${f(w * 0.08)} ${f(h)} L${f(w * 0.12)} ${f(h * 0.6)}`, { fill: gc('#94603A') });
  // grass slab
  o += R(-w / 2 - 8, -w * 0.11, w + 16, w * 0.15, w * 0.05, ol(gc('#5FCB5E'), 5));
  o += R(-w / 2 + 4, -w * 0.1, w - 8, w * 0.045, w * 0.02, { fill: gc('#A2EC8E') });
  for (let i = 0; i < 5; i++) { const gx = -w * 0.42 + i * w * 0.21; o += P(`M${f(gx)} ${f(w * 0.04)} q${f(w * 0.03)} ${f(w * 0.06)} ${f(w * 0.06)} 0`, { fill: gc('#5FCB5E'), stroke: LINE, 'stroke-width': 3 }); }
  const s = w / 300;
  let d = '';
  if (deco === 'house') {
    d += R(-30, -126, 120, 100, 6, ol(gc('#FFF1D6'), 5)) + P('M-44 -120 L30 -184 L104 -120 Z', ol(gc('#FF7A8A'), 5)) + R(14, -80, 32, 54, 6, ol(gc('#5BC0EB'), 4)) + R(56, -104, 26, 26, 4, ol(gc('#BFF0FF'), 4));
    d += R(-122, -96, 10, 70, 3, ol(gc('#A86B3C'), 3)) + G(R(-70, -28, 140, 56, 8, ol(gc('#FFE36E'), 4)) + T('BUBBLE', 0, -2, 22, gc('#FF5A8A')) + T('ISLAND', 0, 20, 20, gc('#2F6FD6')), 'translate(-118 -122) rotate(-6) scale(0.82)');
    d += CI(-100, -34, 20, ol(gc('#3FBF5A'), 4)) + CI(130, -36, 18, ol(gc('#3FBF5A'), 4));
  } else if (deco === 'tree') {
    d += R(-10, -110, 20, 96, 4, ol(gc('#8A5A33'), 4)) + CI(0, -140, 56, ol(gc('#3FBF5A'), 5)) + CI(-34, -114, 34, ol(gc('#3FBF5A'), 5)) + CI(36, -112, 32, ol(gc('#3FBF5A'), 5)) + CI(-14, -158, 20, { fill: gc('#8BE88A') });
    d += CI(-20, -120, 8, ol(gc('#FF5A6E'), 3)) + CI(22, -144, 8, ol(gc('#FF5A6E'), 3));
  } else if (deco === 'flowers') {
    for (let i = 0; i < 5; i++) { const fx = -90 + i * 45, fh = 34 + (i % 2) * 16; d += P(`M${fx} -14 L${fx} ${-14 - fh}`, ln(5, gc('#2E9E4E'))) + CI(fx, -18 - fh, 13, ol(gc(['#FF6FA8', '#FFD34D', '#B07CFF', '#FF8A4C', '#5BC0EB'][i]), 3)) + CI(fx, -18 - fh, 5, { fill: gc('#FFF6C8') }); }
  } else if (deco === 'mush') {
    d += R(-16, -84, 32, 70, 10, ol(gc('#FFF1D6'), 4)) + P('M-70 -80 Q-66 -150 0 -150 Q66 -150 70 -80 Z', ol(gc('#FF5A6E'), 5)) + CI(-30, -112, 11, { fill: gc('#FFFFFF') }) + CI(22, -126, 9, { fill: gc('#FFFFFF') }) + CI(40, -96, 7, { fill: gc('#FFFFFF') });
    d += R(56, -56, 18, 42, 8, ol(gc('#FFF1D6'), 3)) + P('M40 -52 Q44 -84 65 -84 Q86 -84 90 -52 Z', ol(gc('#FFB13B'), 4));
  } else if (deco === 'palm') {
    d += P('M0 -14 Q-6 -80 12 -140', ln(18, LINE)) + P('M0 -14 Q-6 -80 12 -140', ln(10, gc('#B9864E')));
    for (const a of [-160, -120, -60, -20, -95]) d += G(P('M0 0 Q40 -26 92 6 Q44 -6 0 0 Z', ol(gc('#3FBF5A'), 4)), `translate(12 -140) rotate(${a + 90})`);
    d += CI(4, -132, 9, ol(gc('#8A5A33'), 3)) + CI(20, -130, 9, ol(gc('#8A5A33'), 3));
  } else if (deco === 'crystal') {
    d += P('M-40 -14 L-48 -70 L-30 -110 L-14 -70 L-20 -14 Z', ol(gc('#9FE8FF'), 4)) + P('M-4 -14 L-6 -90 L14 -140 L32 -90 L26 -14 Z', ol(gc('#C9A8FF'), 4)) + P('M36 -14 L42 -58 L58 -80 L66 -50 L60 -14 Z', ol(gc('#FF9ED8'), 4));
    d += P('M10 -120 L12 -40', ln(4, '#FFFFFF', 0.6)) + P('M-32 -96 L-34 -40', ln(4, '#FFFFFF', 0.6));
  }
  o += G(d, `scale(${f(s)})`);
  return G(o, tr(x, y));
}

function bubbleIslandFn(t, opts = {}) {
  const g = clamp(opts.grey || 0, 0, 1);
  const gc = (c) => desat(c, g);
  const frozen = !!opts.freeze;
  const tt = frozen ? (opts.freezeAt ?? Math.floor(t)) : t;
  let o = '';
  if (opts.void) return voidLevel(t, opts) + bubbleHud(t, opts, gc);
  // pastel sky
  o += R(-800, -600, 3520, 2280, 0, { fill: 'url(#setsBubSky)' });
  if (g > 0) o += R(-800, -600, 3520, 2280, 0, { fill: '#9AA0AA', opacity: f(g * 0.85) });
  o += CI(1560, 250, 150, { fill: gc('#FFF6D8'), opacity: 0.55 }) + CI(1560, 250, 96, { fill: gc('#FFF3C4') });
  // soft clouds
  for (const [x0, y0, s, sp] of [[100, 560, 1.4, 8], [900, 860, 1.8, 5], [1300, 640, 1.1, 10], [420, 120, 0.9, 7], [1700, 520, 1, 6]]) {
    const x = ((x0 + tt * sp) % 2300) - 200;
    o += G(R(-110, -16, 250, 60, 30, { fill: gc('#F3D9FF') }) + R(-110, -26, 250, 56, 28, { fill: gc('#FFFFFF') }) + CI(-30, -32, 46, { fill: gc('#FFFFFF') }) + CI(40, -20, 38, { fill: gc('#FFFFFF') }), tr(x, y0, s), { opacity: 0.85 });
  }
  // distant tiny bubbles (with specks of islands)
  for (let i = 0; i < 6; i++) {
    const x = 120 + hash(i * 4.1) * 1700, y = 110 + hash(i * 2.7) * 400, r = 18 + hash(i * 9.3) * 18;
    const b = Math.sin(tt * 0.7 + i) * 5;
    o += G(R(-r * 0.55, r * 0.05, r * 1.1, r * 0.22, 3, { fill: gc('#A9D9A0') }) + P(`M${f(-r * 0.5)} ${f(r * 0.26)} L${f(r * 0.5)} ${f(r * 0.26)} L0 ${f(r * 0.62)} Z`, { fill: gc('#D9B8A0') }) + CI(0, 0, r, { fill: '#FFFFFF', opacity: 0.22, stroke: gc('#C2B4F0'), 'stroke-width': 3 }) + CI(-r * 0.4, -r * 0.4, r * 0.18, { fill: '#FFFFFF' }), tr(x, y + b), { opacity: 0.7 });
  }
  // the bubbles
  const nb = clamp(opts.bites || 0, 0, 8);
  const BITES = [[0, -0.62, 0.36], [1, -0.85, 0.42], [3, -1.05, 0.4], [2, -0.4, 0.44], [5, -0.7, 0.42], [0, 0.12, 0.28], [1, -0.05, 0.34], [4, -0.75, 0.5]];
  const pop = clamp(opts.pop || 0, 0, 1);
  const drawOrder = [6, 4, 2, 5, 1, 3, 0];
  for (const i of drawOrder) {
    const b = BUB[i];
    const y = b.y + (frozen ? bubBob(i, tt) : bubBob(i, tt));
    const rank = POP_ORDER.indexOf(i), th = 0.06 + (0.82 * rank) / (POP_ORDER.length - 1);
    const pu = pop > 0 ? (pop - th) / 0.11 : -1;
    const bites = [];
    BITES.forEach(([bi, a, rr], k) => { if (bi === i && k < Math.ceil(nb)) bites.push({ a, b: b.r * rr * (k === Math.ceil(nb) - 1 && nb % 1 ? nb % 1 : 1) }); });
    let isl = floatIsland(b.x, y + b.r * 0.2, b.r * (b.deco === 'house' ? 1.28 : 1.16), tt, b.deco, b.seed, gc);
    if (b.far) isl = G(isl, null, { opacity: 0.75 });
    if (pu >= 1) { o += isl; continue; }
    const wob = pu > -1.5 && pu < 0 ? 1 + 0.03 * Math.sin(t * 30) * (1 + pu / 1.5) : 1;
    const R0 = b.r * wob;
    if (pu >= 0) {
      // popping: droplets + fragments + flash
      o += isl;
      const k = ease.out(pu);
      o += CI(b.x, y, R0 * (1 + 0.25 * k), { fill: 'none', stroke: '#FFFFFF', 'stroke-width': 10 * (1 - k), opacity: f(1 - k) });
      for (let j = 0; j < 14; j++) {
        const a = (j / 14) * Math.PI * 2 + i;
        const rr = R0 * (1 + 0.55 * k), dr = 7 * (1 - k * 0.6);
        o += CI(b.x + Math.cos(a) * rr, y + Math.sin(a) * rr + 40 * k * k, dr, { fill: j % 2 ? gc('#9FE8FF') : gc('#FFB3E6'), opacity: f(1 - k) });
      }
      if (pu < 0.6) o += sparkle(b.x, y, R0 * 0.5 * (1 - pu), '#FFFFFF') + T('POP!', b.x, y - R0 * 0.2, 60 + 50 * k, '#FFFFFF', { ...OUTX(10), opacity: f(1 - pu) });
      continue;
    }
    const d = bubbleD(b.x, y, R0, bites);
    let bo = P(d, { fill: 'url(#setsBubFill)' });
    bo += isl;
    const rw = Math.max(5, R0 * 0.032);
    bo += P(d, { fill: 'none', stroke: '#3A2E6A', 'stroke-width': rw + 8, opacity: 0.55, 'stroke-linejoin': 'round' });
    bo += P(d, { fill: 'none', stroke: 'url(#setsBubRim)', 'stroke-width': rw, opacity: f(1 - g), 'stroke-linejoin': 'round' });
    if (g > 0) bo += P(d, { fill: 'none', stroke: '#D5D9E0', 'stroke-width': rw, opacity: f(g), 'stroke-linejoin': 'round' });
    const a0 = Math.PI * 1.08, a1 = Math.PI * 1.38;
    bo += P(`M${f(b.x + Math.cos(a0) * R0 * 0.82)} ${f(y + Math.sin(a0) * R0 * 0.82)} A${f(R0 * 0.82)} ${f(R0 * 0.82)} 0 0 1 ${f(b.x + Math.cos(a1) * R0 * 0.82)} ${f(y + Math.sin(a1) * R0 * 0.82)}`, ln(R0 * 0.07, '#FFFFFF', 0.85));
    bo += E(b.x - R0 * 0.32, y - R0 * 0.66, R0 * 0.09, R0 * 0.05, { fill: '#FFFFFF', opacity: 0.9, transform: `rotate(-30 ${f(b.x - R0 * 0.32)} ${f(y - R0 * 0.66)})` });
    bo += E(b.x + R0 * 0.55, y + R0 * 0.55, R0 * 0.12, R0 * 0.05, { fill: '#FFFFFF', opacity: 0.5, transform: `rotate(-45 ${f(b.x + R0 * 0.55)} ${f(y + R0 * 0.55)})` });
    // grey pixel crumbs on the bite edges
    for (const bt of bites) {
      const cx = b.x + Math.cos(bt.a) * R0, cy = y + Math.sin(bt.a) * R0;
      for (let j = 0; j < 7; j++) {
        const a = bt.a + Math.PI + (j / 6 - 0.5) * 2.2, rr = bt.b * (0.82 + 0.25 * hash(j + i * 3));
        const sz = 12 + 10 * hash(j * 2.3 + i);
        bo += R(cx + Math.cos(a) * rr - sz / 2, cy + Math.sin(a) * rr - sz / 2, sz, sz, 2, { fill: j % 2 ? '#8A93A6' : '#A3AAB7', stroke: '#5E6676', 'stroke-width': 2.5 });
      }
      bo += R(cx + Math.cos(bt.a) * bt.b * 0.4 - 9, cy + Math.sin(bt.a) * bt.b * 0.4 - 9 - ((t * 20) % 30), 18, 18, 2, { fill: '#9098A6', opacity: 0.8 });
    }
    o += bo;
  }
  // little free bubbles drifting up
  for (let i = 0; i < 12; i++) {
    const r = 8 + hash(i * 3.1) * 16, sp = 30 + hash(i * 5.3) * 40;
    const y = 1150 - ((tt * sp + hash(i * 7.7) * 1300) % 1300);
    const x = hash(i * 1.9) * 1920 + Math.sin(tt * 1.5 + i) * 18;
    if (pop > 0 && hash(i * 11.1) < pop) continue;
    o += CI(x, y, r, { fill: '#FFFFFF', opacity: 0.18, stroke: '#FFFFFF', 'stroke-width': 3 }) + CI(x - r * 0.35, y - r * 0.35, r * 0.22, { fill: '#FFFFFF', opacity: 0.9 });
  }
  if (frozen) o += R(-800, -600, 3520, 2280, 0, { fill: '#B9C0CC', opacity: 0.12 });
  return o + (opts.hud === false ? '' : bubbleHud(t, opts, gc));
}
function bubbleHud(t, opts, gc) {
  let o = '';
  const v = opts.visits === undefined ? 3 : opts.visits;
  if (v !== null && v !== false) {
    const txt = `VISITS: ${num(v)}`;
    const w = 150 + txt.length * 25;
    o += R(40, 36, w, 78, 22, { fill: '#1B2340', opacity: 0.72, stroke: '#FFFFFF', 'stroke-opacity': 0.35, 'stroke-width': 3 });
    o += E(86, 75, 22, 14, { fill: '#FFFFFF' }) + CI(86, 75, 8, { fill: '#1B2340' }) + CI(89, 72, 3, { fill: '#FFFFFF' });
    o += T(txt, 124, 92, 46, '#FFFFFF', { 'text-anchor': 'start' });
  }
  for (let i = 0; i < 3; i++) {
    const x = 1700 + i * 76;
    o += R(x, 40, 62, 62, 16, { fill: '#1B2340', opacity: 0.6, stroke: '#FFFFFF', 'stroke-opacity': 0.35, 'stroke-width': 3 });
    if (i === 0) o += P(`M${x + 16} 58 L${x + 46} 58 M${x + 16} 71 L${x + 46} 71 M${x + 16} 84 L${x + 46} 84`, ln(5, '#FFFFFF'));
    if (i === 1) o += R(x + 16, 56, 30, 32, 6, ln(4.5, '#FFFFFF')) + P(`M${x + 24} 56 Q${x + 31} 46 ${x + 38} 56`, ln(4, '#FFFFFF'));
    if (i === 2) o += P(`M${x + 14} 54 L${x + 48} 54 L${x + 48} 78 L${x + 30} 78 L${x + 20} 88 L${x + 21} 78 L${x + 14} 78 Z`, ln(4.5, '#FFFFFF'));
  }
  if (opts.freeze) {
    o += R(40, 126, 270, 50, 16, { fill: '#3A1020', opacity: 0.75 }) + CI(70, 151, 9, { fill: '#FF3B4E' }) + TF('PING: 9999 ms', 186, 163, 28, '#FF8A9A');
    o += spinner(960, 470, 46, t, '#FFFFFF', 8, 11);
  }
  return o;
}
function voidLevel(t, opts) {
  let o = R(-800, -600, 3520, 2280, 0, { fill: 'url(#setsVoid)' });
  let gr = '';
  for (let i = -12; i <= 12; i++) gr += `M${960 + i * 40} 640 L${960 + i * 520} 1400 `;
  for (let j = 0; j < 7; j++) { const y = 640 + Math.pow(j / 6, 2.2) * 600; gr += `M-200 ${f(y)} L2120 ${f(y)} `; }
  o += P(gr, ln(2.5, '#FFFFFF', 0.13)) + R(-800, 636, 3520, 6, 0, { fill: '#FFFFFF', opacity: 0.12 });
  for (let i = 0; i < 7; i++) {
    const x = 160 + hash(i * 3.3) * 1600, y = 180 + hash(i * 5.1) * 360, s = 20 + hash(i * 7.7) * 40;
    const b = Math.sin(t * 0.6 + i * 2) * 8;
    o += G(R(-s / 2, -s / 2, s, s, 4, { fill: '#9CA1AA', stroke: '#868B95', 'stroke-width': 3 }) + R(-s / 2, -s / 2, s, s * 0.25, 3, { fill: '#B0B5BE' }), tr(x, y + b, 1, hash(i) * 40), { opacity: 0.7 });
  }
  return o;
}

// blocky in-game avatar (origin = feet). who: 'juno' | 'dex' | 'npc' | 'guest'. pose: 'stand' | 'jump' | 'fall' | 'wave'
function avatar(x, y, s = 1, t = 0, opts = {}) {
  const who = opts.who || 'juno', pose = opts.pose || 'stand';
  const gc = (c) => desat(c, opts.grey || 0);
  const L = {
    juno: { skin: '#F2C9A0', shirt: '#3F7FD0', arm: '#FFFFFF', stripe: '#FF5A6E', leg: '#3567B8', shoe: '#FFFFFF' },
    dex: { skin: '#C98E62', shirt: '#22242C', arm: '#C98E62', leg: '#5A6070', shoe: '#2F7BFF' },
    npc: { skin: '#F2C9A0', shirt: '#D9353B', arm: '#D9353B', leg: '#22242C', shoe: '#22242C' },
    guest: { skin: '#FFD21F', shirt: '#5BC0EB', arm: '#FFD21F', leg: '#3FBF5A', shoe: '#3FBF5A' },
  }[who];
  const ph = t * 10;
  let aL = 0, aR = 0, lL = 0, lR = 0;
  if (pose === 'jump') { aL = 150; aR = -150; lL = 20; lR = -20; }
  if (pose === 'fall') { aL = 160 + Math.sin(ph) * 25; aR = -160 - Math.cos(ph) * 25; lL = 25 + Math.sin(ph * 1.3) * 15; lR = -25 - Math.sin(ph * 1.3) * 15; }
  if (pose === 'wave') { aR = -150 - Math.sin(t * 9) * 25; }
  if (opts.armL !== undefined) aL = opts.armL;
  if (opts.armR !== undefined) aR = opts.armR;
  let o = '';
  const limb = (px, py, ang, w, h, col, extra = '') => G(R(-w / 2, 0, w, h, 5, ol(gc(col), 4)) + extra, `translate(${px} ${py}) rotate(${f(ang)})`);
  o += limb(-10, -40, lL, 19, 40, L.leg, R(-9.5, 30, 19, 10, 3, ol(gc(L.shoe), 3))) + limb(10, -40, lR, 19, 40, L.leg, R(-9.5, 30, 19, 10, 3, ol(gc(L.shoe), 3)));
  const stripes = who === 'juno' ? R(-9, 12, 18, 6, 0, { fill: gc(L.stripe) }) + R(-9, 24, 18, 6, 0, { fill: gc(L.stripe) }) : '';
  const glove = who === 'dex' ? R(-9, 30, 18, 10, 2, { fill: '#22242C' }) : '';
  o += limb(-27, -80, aL, 17, 40, L.arm, stripes + glove) + limb(27, -80, aR, 17, 40, L.arm, stripes + glove);
  o += R(-20, -82, 40, 44, 6, ol(gc(L.shirt), 4));
  if (who === 'juno') o += P('M-14 -82 L-12 -60 M14 -82 L12 -60', ln(4, gc('#FFD21F'))) + R(-8, -66, 16, 12, 2, { fill: gc('#2E5FA8') });
  if (who === 'dex') o += TF('PRO 1', 0, -56, 11, '#FFFFFF');
  if (who === 'npc') o += CI(0, -72, 2.6, { fill: '#FFD21F' }) + CI(0, -62, 2.6, { fill: '#FFD21F' }) + CI(0, -52, 2.6, { fill: '#FFD21F' }) + P('M-20 -82 L-8 -70 M20 -82 L8 -70', ln(3, '#FFD21F'));
  // head
  let h = R(-19, -34, 38, 34, 8, ol(gc(L.skin), 4));
  const blink = (t * 0.8) % 3 < 0.1;
  h += blink ? P('M-11 -18 L-5 -18 M5 -18 L11 -18', ln(3)) : CI(-8, -18, 3.2, { fill: LINE }) + CI(8, -18, 3.2, { fill: LINE });
  h += pose === 'fall' ? E(0, -7, 5, 6, { fill: LINE }) : P('M-7 -9 Q0 -3 7 -9', ln(3));
  if (who === 'juno') {
    h += R(-28, -24, 10, 18, 4, ol(gc('#B5501E'), 3)) + R(18, -24, 10, 18, 4, ol(gc('#B5501E'), 3));
    h += CI(-8, -18, 7, ln(2.5)) + CI(8, -18, 7, ln(2.5));
    h += P('M-22 -30 Q-22 -50 0 -50 Q22 -50 22 -30 Z', ol(gc('#FFD21F'), 4)) + R(-26, -33, 52, 7, 3, ol(gc('#FFD21F'), 3)) + R(-3, -50, 6, 18, 2, { fill: gc('#F2B705') });
  } else if (who === 'dex') {
    h += P('M-20 -30 L-24 -48 L-12 -40 L-8 -56 L0 -42 L8 -58 L12 -40 L24 -50 L20 -30 Z', ol(gc('#2F7BFF'), 3.5));
    h += P('M-21 -28 Q-22 -46 0 -46 Q22 -46 21 -28', ln(4, '#22242C')) + R(-26, -26, 9, 16, 4, ol('#22242C', 2.5)) + R(17, -26, 9, 16, 4, ol('#22242C', 2.5));
  } else if (who === 'npc') {
    h += P('M-8 -10 Q-4 -13 0 -10 Q4 -13 8 -10', ln(4, '#6A3E1E'));
    h += R(-21, -46, 42, 16, 5, ol(gc('#D9353B'), 3.5)) + R(-21, -34, 42, 5, 2, { fill: '#FFD21F' }) + P('M-22 -30 L22 -30 L28 -24 L-16 -24 Z', ol('#22242C', 3)) + CI(0, -40, 3.4, { fill: '#FFD21F' });
  }
  o += G(h, 'translate(0 -82)');
  return G(o, tr(x, y, s, (opts.rot || 0) + (pose === 'fall' ? Math.sin(t * 3) * 14 : 0)));
}
const bubbleIsland = (t = 0, opts = {}) => bubbleIslandFn(t, opts);
bubbleIsland.ISLANDS = BUB.map((b) => ({ x: b.x, y: b.y, r: b.r, top: b.top }));
bubbleIsland.bob = bubBob;
bubbleIsland.avatar = avatar;

// ================================================================= 4b. ELEVATOR SIMULATOR — Pip's game (full-frame game view)
// Camera inside the car facing the doors. opts: { doors 0..1 (open), floor (indicator, default 1), dir ('up'|'down'|''),
//   lit (lit button number, default = floor), ding 0..1 (bell flash), wave 0..1 (NPC waves; default idle bob), npc:false,
//   rides (counter, default 41000; null hides), outside: 'lobby'|'party'|'space', grey 0..1 }
// The NPC elevator man stands at x 330, feet y 1000 (s 3.4). elevatorGame.npc(x, y, s, t, opts) draws him elsewhere.
const EV = { x0: 440, x1: 1480, y0: 130, y1: 900, dx0: 640, dx1: 1280, dy0: 250 };
const evk = (x, y, k) => [960 + (x - 960) * k, 520 + (y - 520) * k];
function elevatorGame(t = 0, opts = {}) {
  const g = clamp(opts.grey || 0, 0, 1), gc = (c) => desat(c, g);
  const doors = clamp(opts.doors ?? 0, 0, 1), floor = opts.floor ?? 1;
  let o = R(-800, -600, 3520, 2280, 0, { fill: gc('#AEB8C6') });
  // outside the doors (seen when open)
  const out = opts.outside || 'lobby';
  let ou = '';
  if (out === 'space') {
    ou += R(EV.dx0, EV.dy0, 640, 650, 0, { fill: '#141A44' });
    for (let i = 0; i < 24; i++) ou += CI(EV.dx0 + hash(i * 3.1) * 640, EV.dy0 + hash(i * 5.7) * 600, 2 + hash(i) * 3, { fill: '#FFFFFF' });
    ou += CI(1100, 560, 120, ol(gc('#5BC0EB'), 6)) + P('M1010 520 Q1060 480 1110 520 T1200 540', ln(16, gc('#3FBF5A')));
  } else {
    const party = out === 'party';
    ou += R(EV.dx0, EV.dy0, 640, 400, 0, { fill: gc(party ? '#B07CFF' : '#FFE0A8') }) + R(EV.dx0, 650, 640, 250, 0, { fill: gc(party ? '#FF6FA8' : '#D99A5C') });
    ou += P(`M${EV.dx0} 650 L${EV.dx1} 650`, ln(6, gc('#9A5B30')));
    if (party) for (let i = 0; i < 9; i++) ou += P(`M${700 + i * 70} 260 L${720 + i * 70} 310 L${740 + i * 70} 260`, ol(gc(['#FFD34D', '#4FD1C5', '#FF8A4C'][i % 3]), 3));
    ou += R(820, 330, 280, 90, 14, ol(gc('#2F6FD6'), 5)) + T(party ? 'PARTY FLOOR!' : `FLOOR ${floor}`, 960, 392, 46, '#FFFFFF');
    ou += R(690, 540, 60, 110, 10, ol(gc('#E8603C'), 5)) + P('M720 540 Q690 470 700 440 M720 540 Q730 460 760 450 M720 540 Q760 500 770 500', ln(12, gc('#3FBF5A')));
    ou += R(1150, 470, 90, 180, 8, ol(gc('#FFF1D6'), 5)) + CI(1225, 560, 7, ol('#FFD34D', 3));
  }
  o += G(ou, null, { 'clip-path': 'url(#setsClipEvDoor)' });
  // walls: back wall with the door hole
  const backD = `M${EV.x0} ${EV.y0} L${EV.x1} ${EV.y0} L${EV.x1} ${EV.y1} L${EV.x0} ${EV.y1} Z M${EV.dx0} ${EV.dy0} L${EV.dx0} ${EV.y1} L${EV.dx1} ${EV.y1} L${EV.dx1} ${EV.dy0} Z`;
  o += P(backD, { fill: gc('#C9D2DE'), 'fill-rule': 'evenodd' });
  // side walls, ceiling, floor
  o += poly([[EV.x0, EV.y0], [EV.x0, EV.y1], evk(EV.x0, EV.y1, 2.4), evk(EV.x0, EV.y0, 2.4)], { fill: gc('#B4BFCD') });
  o += poly([[EV.x1, EV.y0], [EV.x1, EV.y1], evk(EV.x1, EV.y1, 2.4), evk(EV.x1, EV.y0, 2.4)], { fill: gc('#A8B3C2') });
  o += poly([[EV.x0, EV.y0], [EV.x1, EV.y0], evk(EV.x1, EV.y0, 2.4), evk(EV.x0, EV.y0, 2.4)], { fill: gc('#E6EBF2') });
  o += poly([[EV.x0, EV.y1], [EV.x1, EV.y1], evk(EV.x1, EV.y1, 2.4), evk(EV.x0, EV.y1, 2.4)], { fill: gc('#4A4E66') });
  // floor tiles + side panel seams + ceiling light
  let fl = '';
  for (let i = 0; i <= 8; i++) { const X = EV.x0 + (i * (EV.x1 - EV.x0)) / 8; fl += pline([[X, EV.y1], evk(X, EV.y1, 2.4)]) + ' '; }
  for (const k of [1.12, 1.3, 1.56, 1.95]) fl += pline([evk(EV.x0, EV.y1, k), evk(EV.x1, EV.y1, k)]) + ' ';
  o += P(fl, ln(4, gc('#6A7090'), 0.8));
  o += poly([evk(EV.x0 + 160, EV.y1, 1.05), evk(EV.x1 - 160, EV.y1, 1.05), evk(EV.x1 - 160, EV.y1, 1.5), evk(EV.x0 + 160, EV.y1, 1.5)], { fill: gc('#D9353B'), opacity: 0.85 });
  let seams = '';
  for (const k of [1.25, 1.6, 2.05]) for (const X of [EV.x0, EV.x1]) seams += pline([evk(X, EV.y0, k), evk(X, EV.y1, k)]) + ' ';
  o += P(seams, ln(5, gc('#8E99A8')));
  o += poly([evk(760, EV.y0, 1.15), evk(1160, EV.y0, 1.15), evk(1160, EV.y0, 1.7), evk(760, EV.y0, 1.7)], ol(gc('#FFFBE6'), 5));
  o += poly([evk(760, EV.y0, 1.15), evk(1160, EV.y0, 1.15), evk(1160, EV.y0, 1.7), evk(760, EV.y0, 1.7)], { fill: '#FFFFFF', opacity: f(0.4 + 0.1 * Math.sin(t * 3)) });
  // handrails (brass) on the side walls
  for (const X of [EV.x0, EV.x1]) { const pts = [evk(X, 600, 1.02), evk(X, 600, 2.2)]; o += P(pline(pts), ln(26, LINE)) + P(pline(pts), ln(16, gc('#E8B84A'))) + P(pline(pts), ln(5, gc('#FFE9A8'))); }
  // edges
  o += P(`M${EV.x0} ${EV.y0} L${EV.x0} ${EV.y1} L${EV.x1} ${EV.y1} L${EV.x1} ${EV.y0} Z`, { fill: 'none', stroke: LINE, 'stroke-width': 6 });
  // the doors (slide apart; clipped to the doorway)
  const dw = (EV.dx1 - EV.dx0) / 2, sh = doors * dw * 0.98;
  let dr = '';
  for (const sd of [-1, 1]) {
    const x = sd < 0 ? EV.dx0 - sh : 960 + sh;
    dr += R(x, EV.dy0, dw, EV.y1 - EV.dy0, 0, ol(gc('#D5DDE8'), 6)) + R(x + 18, EV.dy0 + 20, dw - 36, EV.y1 - EV.dy0 - 40, 6, { fill: 'none', stroke: gc('#B4BFCD'), 'stroke-width': 4 });
    dr += P(`M${x + 40} ${EV.dy0 + 60} L${x + 110} ${EV.dy0 + 330}`, ln(16, '#FFFFFF', 0.35));
  }
  o += G(dr, null, { 'clip-path': 'url(#setsClipEvDoor)' });
  o += P(`M${EV.dx0} ${EV.y1} L${EV.dx0} ${EV.dy0} L${EV.dx1} ${EV.dy0} L${EV.dx1} ${EV.y1}`, { fill: 'none', stroke: LINE, 'stroke-width': 26 }) + P(`M${EV.dx0} ${EV.y1} L${EV.dx0} ${EV.dy0} L${EV.dx1} ${EV.dy0} L${EV.dx1} ${EV.y1}`, { fill: 'none', stroke: gc('#7E8A9C'), 'stroke-width': 16 });
  o += R(EV.dx0 - 10, EV.y1 - 6, EV.dx1 - EV.dx0 + 20, 16, 4, ol(gc('#9AA5B5'), 4));
  // floor indicator above the doors
  const ding = clamp(opts.ding || 0, 0, 1);
  o += R(840, 160, 240, 74, 14, ol('#1A1D26', 6)) + T(String(floor), 990, 216, 58, ding > 0 ? mix('#FFB13B', '#FFFFFF', ding * 0.5) : '#FFB13B');
  const dir = opts.dir ?? 'up';
  if (dir) o += P(dir === 'up' ? 'M882 214 L902 182 L922 214 Z' : 'M882 182 L902 214 L922 182 Z', { fill: '#FFB13B' });
  if (ding > 0) {
    o += G(P('M-26 18 Q-26 -22 0 -24 Q26 -22 26 18 Z', ol('#FFD34D', 5)) + R(-32, 16, 64, 10, 5, ol('#FFD34D', 4)) + CI(0, 32, 7, ol('#FFD34D', 3)), tr(1140, 196, 0.8 + 0.3 * ding, Math.sin(t * 40) * 12 * ding));
    o += sparkle(1196, 160, 18 * ding) + sparkle(1100, 150, 12 * ding);
  }
  // button panel (right of the doors)
  o += R(1318, 330, 126, 420, 16, ol(gc('#E3C27A'), 6)) + R(1330, 342, 102, 396, 10, { fill: gc('#EFD597') });
  const lit = opts.lit ?? floor;
  for (let i = 0; i < 16; i++) {
    const n = 16 - i + (i % 2 ? 1 : -1) * 0, col = i % 2, row = Math.floor(i / 2);
    const bn = 16 - row * 2 - (1 - col);
    const bx = 1358 + col * 46, by = 372 + row * 40;
    const on = bn === lit;
    o += CI(bx, by, 15, ol(on ? '#FFB13B' : gc('#F7F2E6'), 4)) + TF(String(bn), bx, by + 6, 15, on ? '#FFFFFF' : '#5A4A2A');
    if (on) o += CI(bx, by, 26, { fill: '#FFB13B', opacity: 0.3 });
  }
  o += CI(1358, 700, 15, ol(gc('#FF5A5A'), 4)) + P('M1352 704 Q1352 692 1358 691 Q1364 692 1364 704 Z', { fill: '#FFFFFF' });
  o += CI(1404, 700, 15, ol(gc('#7CD45A'), 4)) + P('M1396 700 L1402 694 L1402 706 Z M1412 700 L1406 694 L1406 706 Z', { fill: '#FFFFFF' });
  // elevator music notes
  for (let i = 0; i < 4; i++) {
    const ph = (t * 0.35 + i / 4) % 1;
    const x = 560 + i * 260 + Math.sin(t * 2 + i) * 20, y = 520 - ph * 300;
    o += G(P('M0 0 L0 -40 L22 -48 L22 -8', ln(5, '#FFFFFF')) + E(-6, 0, 9, 7, { fill: '#FFFFFF' }) + E(16, -8, 9, 7, { fill: '#FFFFFF' }), tr(x, y, 1, -10), { opacity: f(0.75 * Math.sin(ph * Math.PI)) });
  }
  // the NPC elevator man
  if (opts.npc !== false) o += elevatorNpc(330, 1000, 3.4, t, { wave: opts.wave, grey: g });
  // game HUD
  const rides = opts.rides === undefined ? 41000 : opts.rides;
  if (rides !== null) {
    const txt = `RIDES: ${num(rides)}`;
    o += R(40, 36, 150 + txt.length * 24, 78, 22, { fill: '#1B2340', opacity: 0.72, stroke: '#FFFFFF', 'stroke-opacity': 0.35, 'stroke-width': 3 }) + P('M66 92 L66 58 L106 58 L106 92 Z M86 58 L86 92', ln(5, '#FFFFFF'));
    o += T(txt, 124, 92, 44, '#FFFFFF', { 'text-anchor': 'start' });
  }
  o += R(1556, 40, 324, 64, 20, { fill: '#1B2340', opacity: 0.6 }) + T('ELEVATOR SIM', 1718, 86, 38, '#FFD34D');
  if (g > 0) o += R(-800, -600, 3520, 2280, 0, { fill: '#9AA0AA', opacity: f(0.25 * g) });
  return o;
}
function elevatorNpc(x, y, s, t, opts = {}) {
  const wave = opts.wave === undefined ? 0 : opts.wave;
  const bob = Math.sin(t * 2.2) * 1.5;
  const armR = wave > 0 ? -lerp(10, 150, wave) - Math.sin(t * 9) * 22 * wave : -8 + Math.sin(t * 2) * 4;
  return G(avatar(0, 0, 1, t, { who: 'npc', armR, armL: 8, grey: opts.grey }), tr(x, y + bob, s));
}
elevatorGame.npc = elevatorNpc;

// ================================================================= 4a. PIP'S BOX — cardboard "elevator" (prop)
// pipBox(x, y, s, t, opts): origin = bottom centre of the front face. Front face 300 x 230 (s = 1), open top.
// Pip goes INSIDE: draw pipBox(...,{part:'back'}), then Pip (feet ~ y + 40*s, s ~0.5), then pipBox(...,{part:'front'}).
// opts: { part: 'back'|'front'|'all', floor (paper indicator, default 1), ding 0..1 (indicator flash + sparkle),
//   doors 0..1 (the cut cardboard doors swing open), tilt (deg) }
function pipBox(x, y, s = 1, t = 0, opts = {}) {
  const part = opts.part || 'all';
  const ding = clamp(opts.ding || 0, 0, 1), doors = clamp(opts.doors || 0, 0, 1);
  const cb = '#D9A866', cbS = '#C08F50', cbD = '#A97A3E', cbIn = '#8E6432';
  const flap = (pts, col) => poly(pts, ol(col, 5));
  const fw = Math.sin(t * 1.7) * 3;
  let back = '', front = '';
  // inside + back flap + side flaps (behind Pip)
  back += poly([[-150, -230], [150, -230], [205, -262], [-95, -262]], ol(cbIn, 5));
  back += flap([[-95, -262], [205, -262], [190 + fw, -318], [-90 + fw, -314]], cbS);
  back += flap([[150, -230], [205, -262], [258, -282 + fw], [214, -246]], cbD);
  // front: side face, front face, front flap, paint job
  front += poly([[150, 0], [150, -230], [205, -262], [205, -32]], ol(cbD, 6));
  front += R(-150, -230, 300, 230, 4, ol(cb, 6));
  front += flap([[-150, -230], [-95, -262], [-150, -290 + fw], [-204, -250]], cbS);
  front += flap([[-150, -230], [150, -230], [168, -196 - fw * 0.5], [-168, -196 - fw * 0.5]], cb);
  front += P('M-150 -224 L150 -224', ln(4, cbS));
  // painted elevator doors (silver marker paint, a bit messy)
  const dW = 92 * (1 - doors * 0.85);
  front += R(-100, -150, 200, 150, 6, { fill: '#B9C2D0', stroke: '#2A2A33', 'stroke-width': 4 });
  if (doors > 0) front += R(-100, -150, 200, 150, 6, { fill: '#2A2230' });
  front += R(-100, -150, dW, 150, 4, { fill: '#C9D1DD', stroke: '#2A2A33', 'stroke-width': 4 }) + R(100 - dW, -150, dW, 150, 4, { fill: '#C9D1DD', stroke: '#2A2A33', 'stroke-width': 4 });
  front += P('M-86 -134 L-62 -30 M60 -134 L80 -50', ln(5, '#FFFFFF', 0.5));
  // marker buttons on the right
  for (let i = 0; i < 3; i++) front += CI(126, -136 + i * 34, 11, { fill: i === 0 ? '#FF5A5A' : 'none', stroke: '#2A2A33', 'stroke-width': 3.5 }) + TF(String(3 - i), 126, -131 + i * 34, 13, '#2A2A33');
  front += P('M112 -42 Q126 -56 140 -42', ln(3, '#2A2A33'));
  // paper "1" indicator taped above the doors
  const dz = ding > 0 ? 1 + 0.12 * ding : 1;
  let ind = R(-40, -28, 80, 56, 4, ol(ding > 0 ? mix('#FFFFFF', '#FFF2A8', ding) : '#FFFFFF', 4)) + T(String(opts.floor ?? 1), 10, 20, 46, '#FF7A1A') + P('M-28 12 L-19 -6 L-10 12 Z', { fill: '#FF7A1A' });
  ind += R(-44, -30, 26, 12, 2, { fill: '#F4F1E6', opacity: 0.85, transform: 'rotate(-20 -31 -24)' }) + R(18, -30, 26, 12, 2, { fill: '#F4F1E6', opacity: 0.85, transform: 'rotate(18 31 -24)' });
  front += TF('ELEVATOR', -96, -182, 17, '#2A2A33', { transform: 'rotate(-4 -96 -182)' });
  front += G(ind, tr(30, -178, dz, -3));
  if (ding > 0) front += sparkle(86, -214, 22 * ding) + sparkle(-20, -222, 14 * ding) + T('DING!', 30, -244 - 24 * ding, 34, '#FFD21F', { ...OUTX(7), opacity: f(ding) });
  const tf = tr(x, y, s, opts.tilt || 0);
  if (part === 'back') return G(back, tf);
  if (part === 'front') return G(front, tf);
  return G(back + front, tf);
}

// ================================================================= 3. LIVING ROOM
// Flat front view. Wall/floor seam y 800; couch centre x 960 (seat top y 740, skirt to the floor at y 900);
// stand line in front of the couch y 1000 (FLOOR.livingRoom). Seated characters: s 0.55, feet y 908 (hips on the
// seat) between x 640..1280, then draw layers.seat over them. TV on a console at left, router on the wall shelf
// at right (SPOTS.livingRoom.router = its top centre, where Buffer lands).
// opts: { time: 'day'|'evening'|'night', routerBlink 0..1 (0 steady .. 1 frantic), wifiDown (red LEDs + no-wifi icon),
//   tv (svg|fn(w,h) for the 340x190 TV screen), tvOff, table:false, lamp (on/off; default on in evening/night), lag 0..1 }
const ROUTER = { x: 1712, y: 470 };
function router(x, y, s = 1, t = 0, opts = {}) {
  const blink = clamp(opts.blink ?? 0.3, 0, 1), down = !!opts.down;
  let o = '';
  o += P('M-56 -44 L-70 -120 M56 -44 L70 -120', ln(13, LINE)) + P('M-56 -44 L-70 -120 M56 -44 L70 -120', ln(6, '#3A3F4E')) + CI(-70, -122, 7, ol('#3A3F4E', 3)) + CI(70, -122, 7, ol('#3A3F4E', 3));
  o += R(-80, -48, 160, 48, 12, ol('#F4F6FA', 6)) + R(-80, -48, 160, 14, 8, { fill: '#FFFFFF' }) + R(-72, -8, 144, 8, 4, { fill: '#D7DCE6' });
  const rate = lerp(1.5, 16, blink);
  for (let i = 0; i < 5; i++) {
    const on = down ? (i === 0 || Math.floor(t * 2) % 2 === 0) : blink <= 0 ? true : hash(Math.floor(t * rate) * 1.7 + i * 3.1) > 0.35;
    const col = down ? (i === 0 ? '#FFB13B' : '#FF3B4E') : '#3BFF7A';
    o += CI(-48 + i * 22, -24, 5.5, { fill: on ? col : '#5A6070', stroke: LINE, 'stroke-width': 2 });
    if (on) o += CI(-48 + i * 22, -24, 11, { fill: col, opacity: 0.3 });
  }
  if (down) {
    let w = '';
    for (let i = 0; i < 3; i++) w += P(`M${-14 - i * 12} ${-6 - i * 9} Q0 ${-22 - i * 16} ${14 + i * 12} ${-6 - i * 9}`, ln(6, '#FFFFFF'));
    w += CI(0, 2, 5, { fill: '#FFFFFF' }) + P('M-30 -40 L30 14', ln(8, '#FF3B4E'));
    o += G(CI(0, -14, 50, { fill: '#1B2340', opacity: 0.75 }) + w, tr(0, -170 + Math.sin(t * 4) * 4));
  } else if (blink > 0.5) {
    for (let i = 0; i < 3; i++) { const ph = (t * 1.5 + i / 3) % 1; o += P(`M${-20 - ph * 40} ${-60 - ph * 30} Q0 ${-80 - ph * 60} ${20 + ph * 40} ${-60 - ph * 30}`, ln(5, '#7CF7FF', f(0.8 * (1 - ph)))); }
  }
  return G(o, tr(x, y, s));
}
function newspaper(x, y, s = 1, t = 0, opts = {}) {
  const shake = clamp(opts.shake || 0, 0, 1);
  const rot = (opts.rot || 0) + Math.sin(t * 31) * 2.2 * shake;
  let o = '';
  if (opts.glow) o += E(0, 0, 300, 220, { fill: '#9FE2FF', opacity: 0.25 });
  o += P('M-260 -170 L-6 -158 L-6 172 L-260 160 Z', ol('#F4F1E6', 6)) + P('M6 -158 L260 -170 L260 160 L6 172 Z', ol('#FBF8EE', 6));
  o += P('M-6 -158 L6 -158 L6 172 L-6 172 Z', { fill: '#D9D3C0' });
  o += T('THE DAILY TOWN', -132, -118, 32, '#2A2A33') + P('M-244 -102 L-22 -98', ln(3, '#2A2A33'));
  o += TF(opts.headline || 'GAMES ROT', -132, -60, 34, '#2A2A33') + TF(opts.headline2 || 'BRAINS!', -132, -24, 34, '#E8243C');
  let lines = '';
  for (let i = 0; i < 6; i++) lines += `M-238 ${8 + i * 22} L${-30 - (i % 3) * 18} ${8 + i * 22} `;
  for (let i = 0; i < 9; i++) lines += `M30 ${-120 + i * 22} L${238 - (i % 4) * 22} ${-120 + i * 22} `;
  o += P(lines, ln(6, '#B9B3A3'));
  o += R(40, 80, 190, 70, 6, ol('#BFE3FF', 4)) + P('M70 116 Q110 90 150 116 Q110 140 70 116 Z M150 116 L176 98 L176 134 Z', ol('#FFD21F', 3)) + CI(92, 112, 3, { fill: LINE });
  return G(o, tr(x, y, s, rot));
}
function livingLayers(t, opts = {}) {
  const time = opts.time || 'day', lag = clamp(opts.lag || 0, 0, 1);
  const tt = lag > 0 ? stutterT(t, lerp(24, 3, lag)) : t;
  const lampOn = opts.lamp ?? time !== 'day';
  // bg: through the window — sky, a neighbour's house, a tree, the fence
  let bg = skyBg(tt, time, 960, 300, { tree: false });
  const nite = time === 'night', eve = time === 'evening';
  bg += R(1020, 330, 300, 260, 0, ol(nite ? '#3A3F7A' : eve ? '#E8A07A' : '#FFB4C8', 5)) + P('M1000 340 L1170 230 L1340 340 Z', ol(nite ? '#2A2A5A' : '#E8506E', 5));
  bg += R(1070, 380, 70, 70, 6, ol(nite || eve ? '#FFE08A' : '#BFF0FF', 4)) + R(1200, 380, 70, 70, 6, ol(nite ? '#3A3F7A' : '#BFF0FF', 4));
  const tc = nite ? '#1E3A46' : eve ? '#6E8A4E' : '#5DBB63';
  bg += R(780, 300, 26, 260, 6, ol(nite ? '#3A2A2A' : '#8A5A33', 4)) + CI(790, 270, 110, ol(tc, 5)) + CI(720, 330, 70, ol(tc, 5)) + CI(870, 330, 76, ol(tc, 5));
  let fence = '';
  for (let x = 640; x < 1300; x += 44) fence += P(`M${x} 560 L${x} 470 L${x + 15} 455 L${x + 30} 470 L${x + 30} 560 Z`, ol(nite ? '#5A6098' : '#FFFFFF', 4));
  bg += fence + R(-800, 540, 3520, 400, 0, { fill: nite ? '#1E3A3A' : eve ? '#8AA35A' : '#7ED36A' });
  // mid
  let m = '';
  m += R(-800, -600, 3520, 1160, 0, { fill: '#F5CB86' }) + R(-800, -600, 3520, 1160, 0, { fill: 'url(#setsLivStripes)' });
  // window (hole cut in the wall via evenodd)
  const wx0 = 700, wx1 = 1220, wy0 = 130, wy1 = 520;
  m = R(-800, -600, 3520, 1160, 0, { fill: 'none' }); // placeholder replaced below
  const wallD = `M-800 -600 L2720 -600 L2720 560 L-800 560 Z M${wx0} ${wy0} L${wx0} ${wy1} L${wx1} ${wy1} L${wx1} ${wy0} Z`;
  m = P(wallD, { fill: '#F5CB86', 'fill-rule': 'evenodd' }) + P(wallD, { fill: 'url(#setsLivStripes)', 'fill-rule': 'evenodd' });
  m += R(wx0 - 22, wy0 - 22, wx1 - wx0 + 44, wy1 - wy0 + 44, 10, { fill: 'none', stroke: LINE, 'stroke-width': 7 });
  m += P(`M${wx0 - 18} ${wy0 - 18} L${wx1 + 18} ${wy0 - 18} L${wx1 + 18} ${wy1 + 18} L${wx0 - 18} ${wy1 + 18} Z M${wx0} ${wy0} L${wx0} ${wy1} L${wx1} ${wy1} L${wx1} ${wy0} Z`, { fill: '#FFFDF4', 'fill-rule': 'evenodd', stroke: LINE, 'stroke-width': 5 });
  m += R((wx0 + wx1) / 2 - 7, wy0, 14, wy1 - wy0, 3, ol('#FFFDF4', 4)) + R(wx0, (wy0 + wy1) / 2 - 7, wx1 - wx0, 14, 3, ol('#FFFDF4', 4));
  m += P(`M${wx0 + 30} ${wy0 + 150} L${wx0 + 110} ${wy0 + 20} L${wx0 + 150} ${wy0 + 20} L${wx0 + 70} ${wy0 + 150} Z`, { fill: '#FFFFFF', opacity: nite ? 0.08 : 0.3 });
  // curtains + rod
  const sw = Math.sin(tt * 1.1) * 6;
  m += R(wx0 - 90, wy0 - 52, wx1 - wx0 + 180, 14, 7, ol('#8A5530', 5)) + CI(wx0 - 96, wy0 - 45, 12, ol('#FFD34D', 4)) + CI(wx1 + 96, wy0 - 45, 12, ol('#FFD34D', 4));
  for (const [cx, d] of [[wx0 - 30, 1], [wx1 + 30, -1]]) {
    m += P(`M${cx - 62} ${wy0 - 44} L${cx + 62} ${wy0 - 44} Q${cx + 40 * d + 30} ${wy0 + 200} ${cx + 52 * d + sw} ${wy1 + 120} Q${cx} ${wy1 + 140} ${cx - 52 * d + sw} ${wy1 + 120} Q${cx - 40} ${wy0 + 200} ${cx - 62} ${wy0 - 44} Z`, ol('#1F8A8F', 6));
    m += P(`M${cx - 20} ${wy0 - 36} Q${cx - 10} ${wy0 + 200} ${cx + sw} ${wy1 + 110} M${cx + 24} ${wy0 - 36} Q${cx + 30} ${wy0 + 200} ${cx + 30 * d + sw} ${wy1 + 110}`, ln(5, '#156A70'));
    m += R(cx - 46, wy0 + 260, 92, 18, 8, ol('#FFD34D', 4));
  }
  // wainscot + chair rail + baseboard
  m += R(-800, 560, 3520, 250, 0, { fill: '#2FA39A' });
  for (let x = -40; x < 1960; x += 240) m += R(x + 18, 600, 204, 170, 10, { fill: 'none', stroke: '#47BDB3', 'stroke-width': 6 });
  m += R(-800, 548, 3520, 24, 4, ol('#FFF1D2', 5)) + R(-800, 790, 3520, 22, 3, ol('#FFF1D2', 5));
  // floor + rug
  m += R(-800, 810, 3520, 600, 0, { fill: 'url(#setsLivFloor)' });
  m += E(960, 990, 700, 84, { fill: '#E9883F' }) + E(960, 988, 610, 64, { fill: 'none', stroke: '#FFD9A0', 'stroke-width': 10, 'stroke-dasharray': '30 16' }) + E(960, 988, 480, 44, { fill: '#F29B52' });
  // wall decor: gallery over the TV, clock, fish plaque, shelf + router
  m += R(96, 130, 130, 160, 8, ol('#FFFDF4', 6)) + R(110, 144, 102, 132, 3, { fill: '#9FD8FF' }) + CI(146, 214, 24, { fill: '#FFC2A0' }) + CI(180, 222, 18, { fill: '#B5501E' }) + R(120, 240, 82, 36, 8, { fill: '#FF7A59' });
  m += R(256, 160, 170, 120, 8, ol('#FFD34D', 6)) + R(270, 174, 142, 92, 3, { fill: '#7ED36A' }) + P('M276 260 L320 200 L350 236 L372 214 L406 260 Z', { fill: '#3FA05A' }) + CI(380, 196, 14, { fill: '#FFF2A8' });
  m += R(456, 140, 96, 128, 8, ol('#FFFDF4', 6)) + R(468, 152, 72, 104, 3, { fill: '#FFB4C8' }) + TF('HOME', 504, 214, 22, '#FFFFFF');
  {
    const hr = ((t / 3600) * 360) % 360, mn = ((t / 60) * 360) % 360;
    m += CI(1468, 170, 58, ol('#FFFDF4', 7)) + CI(1468, 170, 46, ln(3, '#D9C8A8'));
    for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; m += CI(1468 + Math.cos(a) * 40, 170 + Math.sin(a) * 40, 3, { fill: '#8A7A5A' }); }
    m += P(`M1468 170 L${f(1468 + Math.sin((hr + 300) * Math.PI / 180) * 24)} ${f(170 - Math.cos((hr + 300) * Math.PI / 180) * 24)}`, ln(7)) + P(`M1468 170 L${f(1468 + Math.sin((mn + 40) * Math.PI / 180) * 36)} ${f(170 - Math.cos((mn + 40) * Math.PI / 180) * 36)}`, ln(5)) + CI(1468, 170, 6, { fill: '#E8603C' });
  }
  // Dad's mounted fish
  m += P('M1600 190 L1860 190 L1880 300 L1580 300 Z', ol('#A86B3C', 6)) + G(P('M-90 0 Q-40 -46 40 -24 L90 -50 L80 0 L90 50 L40 24 Q-40 46 -90 0 Z', ol('#5BC0EB', 5)) + CI(-56, -8, 7, { fill: LINE }) + P('M-20 -30 Q-6 0 -20 30', ln(4, '#2F8FBF')), 'translate(1730 246) scale(0.85)');
  m += R(1660, 296, 140, 26, 4, ol('#FFD34D', 3)) + TF('BIG ONE · 2019', 1730, 316, 15, '#5A3A10');
  m += R(1580, ROUTER.y, 300, 20, 5, ol('#C98A52', 5)) + P(`M1610 ${ROUTER.y + 20} L1610 ${ROUTER.y + 46} L1636 ${ROUTER.y + 20} M1850 ${ROUTER.y + 20} L1850 ${ROUTER.y + 46} L1824 ${ROUTER.y + 20}`, ln(7, '#8A5530'));
  m += R(1600, ROUTER.y - 66, 34, 66, 6, ol('#FF7A59', 4)) + R(1606, ROUTER.y - 98, 22, 34, 4, ol('#FFD34D', 3)) + CI(1832, ROUTER.y - 26, 26, ol('#E8603C', 4)) + P(`M1832 ${ROUTER.y - 50} Q1820 ${ROUTER.y - 90} 1800 ${ROUTER.y - 96} M1832 ${ROUTER.y - 50} Q1846 ${ROUTER.y - 92} 1866 ${ROUTER.y - 90}`, ln(8, '#3FBF5A'));
  m += router(ROUTER.x, ROUTER.y, 0.9, tt, { blink: opts.routerBlink ?? 0.25, down: opts.wifiDown });
  // TV on its console (left)
  m += R(70, 640, 470, 150, 12, ol('#8A5530', 6)) + R(90, 662, 200, 106, 8, ol('#A86B3C', 4)) + R(320, 662, 200, 106, 8, ol('#A86B3C', 4)) + CI(270, 715, 6, ol('#FFD34D', 2)) + CI(340, 715, 6, ol('#FFD34D', 2));
  m += R(90, 790, 24, 22, 3, ol('#5A3A20', 3)) + R(496, 790, 24, 22, 3, ol('#5A3A20', 3));
  m += R(250, 610, 110, 30, 6, ol('#2C303C', 5));
  m += R(110, 390, 390, 226, 16, ol('#1C1F28', 7));
  const tvOn = !opts.tvOff;
  const tvScr = tvOn ? (opts.tv !== undefined ? screenOf(opts.tv, 340, 190) : R(-170, -95, 340, 190, 0, { fill: '#5BC0EB' }) + CI(-90, 30, 40, { fill: '#FFD34D' }) + R(-170, 50, 340, 45, 0, { fill: '#3FBF5A' }) + R(30, -10, 70, 60, 6, ol('#FF7A8A', 4)) + P('M20 -10 L65 -50 L110 -10 Z', ol('#E8506E', 4))) : R(-170, -95, 340, 190, 0, { fill: '#10121A' });
  m += G(G(R(-170, -95, 340, 190, 0, { fill: '#123' }) + tvScr, null, { 'clip-path': 'url(#setsClipTv)' }), 'translate(305 503)');
  m += R(135, 408, 340, 190, 6, { fill: 'url(#setsScreenShine)' }) + R(135, 408, 340, 190, 6, ln(4, '#0A0B10'));
  m += CI(470, 604, 4, { fill: tvOn ? '#46FF8A' : '#FF3B4E' });
  // floor lamp (right of the couch)
  m += E(1470, 900, 70, 16, ol('#2C303C', 5)) + P('M1470 900 L1470 420', ln(16, LINE)) + P('M1470 900 L1470 420', ln(8, '#D9B36A'));
  m += P('M1406 330 L1534 330 L1566 430 L1374 430 Z', ol(lampOn ? '#FFE6A0' : '#F2D9A0', 6)) + P('M1406 330 L1534 330', ln(4, '#E8C27A'));
  if (lampOn) m += E(1470, 400, 260, 220, { fill: 'url(#setsLampGlow)' }) + P('M1374 430 L1566 430 L1640 620 L1300 620 Z', { fill: '#FFE7A8', opacity: 0.16 });
  // couch: back + back cushions + seat top (characters sit in front of this)
  m += R(560, 540, 800, 220, 40, ol('#D9542F', 7));
  for (let i = 0; i < 3; i++) m += R(586 + i * 254, 566, 240, 170, 34, ol('#EE6E44', 6)) + P(`M${612 + i * 254} 592 Q${706 + i * 254} 576 ${800 + i * 254} 592`, ln(5, '#F8946C', 0.8));
  m += R(578, 712, 764, 52, 18, ol('#F07E52', 6));
  // throw pillows
  m += G(R(-62, -62, 124, 124, 30, ol('#FFD34D', 6)) + P('M-40 -20 L40 -20 M-40 10 L40 10', ln(6, '#F2B705')), 'translate(650 660) rotate(-10)');
  m += G(R(-60, -60, 120, 120, 30, ol('#2EC4B6', 6)) + CI(0, 0, 22, { fill: '#FFFDF4' }) + CI(-30, -30, 8, { fill: '#FFFDF4' }) + CI(30, 30, 8, { fill: '#FFFDF4' }), 'translate(1270 664) rotate(9)');
  if (lag > 0) {
    m += lagBlocks(1580, 380, 300, 120, lag, t, 4, 40, 'r') + lagBlocks(110, 390, 390, 226, lag * 0.8, t, 6, 46, 'l');
    m += R(-800, -600, 3520, 2280, 0, { fill: '#8C93A0', opacity: f(0.2 * lag) });
  }
  // seat layer: couch front + arms + blanket + coffee table
  let seat = '';
  seat += R(566, 752, 788, 150, 26, ol('#D9542F', 7)) + R(586, 762, 748, 34, 14, { fill: '#E8693F' });
  seat += P('M960 760 L960 896', ln(5, '#B8452A'));
  for (const ax of [500, 1330]) seat += R(ax, 630, 92, 272, 34, ol('#E8693F', 7)) + R(ax + 4, 634, 84, 38, 20, { fill: '#F8946C', opacity: 0.7 });
  seat += P('M1330 640 Q1380 620 1420 650 L1426 800 Q1400 830 1372 800 L1340 820 Z', ol('#FFF1D2', 5)) + P('M1340 690 L1420 694 M1342 740 L1424 744', ln(8, '#FF9EC4'));
  seat += R(600, 898, 26, 16, 4, ol('#5A3A20', 3)) + R(1294, 898, 26, 16, 4, ol('#5A3A20', 3));
  if (opts.table !== false) {
    seat += R(790, 940, 22, 56, 6, ol('#8A5530', 4)) + R(1108, 940, 22, 56, 6, ol('#8A5530', 4));
    seat += R(760, 904, 400, 40, 14, ol('#B87A44', 6)) + R(772, 908, 376, 10, 5, { fill: '#D99A5C' });
    seat += P('M840 904 Q840 868 880 866 Q920 868 920 904 Z', ol('#FF7A59', 5)) + CI(856, 868, 10, ol('#FFF6C8', 3)) + CI(878, 860, 11, ol('#FFF6C8', 3)) + CI(900, 868, 10, ol('#FFF6C8', 3));
    seat += G(R(-40, -9, 80, 18, 6, ol('#2C303C', 4)) + CI(-20, 0, 3, { fill: '#FF3B4E' }) + CI(0, 0, 3, { fill: '#9AA3B2' }), 'translate(1010 896) rotate(-8)');
    seat += R(1060, 880, 64, 26, 4, ol('#5BC0EB', 4)) + R(1066, 870, 60, 12, 3, ol('#FFD34D', 3));
  }
  // light
  let light = '';
  if (time === 'night') light = R(-800, -600, 3520, 2280, 0, { fill: 'url(#setsLivNight)' }) + (tvOn ? E(305, 520, 420, 300, { fill: 'url(#setsTvGlow)' }) : '') + (lampOn ? E(1470, 420, 360, 300, { fill: 'url(#setsLampGlow)' }) : '');
  else if (time === 'evening') light = R(-800, -600, 3520, 2280, 0, { fill: '#FF8A4C', opacity: 0.1 });
  return { bg, mid: m, seat, fg: '', light };
}
const livingRoom = makeSet(livingLayers);
livingRoom.router = router;

// ================================================================= 5. NEWS STUDIO
// Anchor stands behind the desk: SPOTS.newsStudio.anchor {x 760, y 985, s 0.62} (desk top y 785 at her waist).
// Big screen at right: centre (1460, 350), inner box 640 x 360. layers: mid = studio, fg = desk (+ ticker).
// opts: { screen (svg|fn(w,h)) | timer ('24:00:00'), label (over the timer, default 'SHUTDOWN IN'), ticker (string),
//   tickerY (default 880), sunny (cheerful morning version), logo (desk text) }
// newsStudio.ticker(t, text, y, sunny) draws just the ticker strip (put it outside the camera to keep it fixed).
function newsTicker(t, text, y = 880, sunny = false) {
  let o = R(-10, y, 1940, 64, 0, { fill: sunny ? '#FFFFFF' : '#10162A', opacity: 0.92 });
  const msg = `${text}   •   ${text}   •   `;
  const w = msg.length * 21;
  const x = 360 - ((t * 190) % w);
  o += TF(msg + msg, x, y + 44, 34, sunny ? '#2A2246' : '#FFE14D', { 'text-anchor': 'start' });
  o += R(-10, y - 6, 350, 76, 0, { fill: sunny ? '#FFB13B' : '#E8243C' }) + T(sunny ? 'GOOD NEWS' : 'BREAKING', 170, y + 50, 46, '#FFFFFF');
  o += P(`M340 ${y - 6} L380 ${y - 6} L340 ${y + 70} Z`, { fill: sunny ? '#FFB13B' : '#E8243C' });
  return o;
}
function newsLayers(t, opts = {}) {
  const sunny = !!opts.sunny;
  let m = R(-800, -600, 3520, 2280, 0, { fill: sunny ? 'url(#setsNewsSun)' : 'url(#setsNewsNight)' });
  // city skyline backdrop
  const blds = [[-40, 300, 150], [100, 420, 120], [210, 250, 170], [370, 360, 110], [470, 200, 150], [610, 330, 130], [730, 260, 120], [840, 380, 150], [980, 230, 140], [1110, 320, 120], [1220, 180, 170], [1380, 300, 130], [1500, 240, 150], [1640, 350, 120], [1750, 210, 190]];
  for (const [x, top, w] of blds) {
    m += R(x, top, w, 760 - top, 6, { fill: sunny ? '#9FB8F0' : '#1E2A66', stroke: sunny ? '#7E98D8' : '#121A48', 'stroke-width': 4 });
    m += R(x + 12, top + 16, w - 24, 760 - top - 30, 0, { fill: sunny ? 'url(#setsWinDay)' : 'url(#setsWinNight)' });
  }
  m += R(-800, 300, 3520, 460, 0, { fill: sunny ? 'url(#setsHazeSun)' : 'url(#setsHazeNight)' });
  if (sunny) m += CI(330, 160, 120, { fill: '#FFF2A8', opacity: 0.6 }) + CI(330, 160, 80, ol('#FFE14D', 6));
  else for (let i = 0; i < 18; i++) m += CI(hash(i * 3.3) * 1920, 30 + hash(i * 5.7) * 200, 3, { fill: '#FFFFFF', opacity: 0.7 });
  // studio frame: columns, light beams, floor
  m += R(-800, 740, 3520, 600, 0, { fill: sunny ? '#F7C66B' : '#141B44' });
  for (const x of [40, 1880]) m += R(x - 60, -100, 120, 900, 0, ol(sunny ? '#FF9A5A' : '#2A2F6A', 6)) + R(x - 20, -100, 40, 900, 0, { fill: sunny ? '#FFB98A' : '#3E4590' });
  for (let i = 0; i < 4; i++) { const x = 260 + i * 460, sw = Math.sin(t * 0.6 + i) * 30; m += P(`M${x - 30} -20 L${x + 30} -20 L${x + 160 + sw} 760 L${x - 160 + sw} 760 Z`, { fill: '#FFFFFF', opacity: sunny ? 0.12 : 0.07 }); }
  m += R(-800, -600, 3520, 650, 0, { fill: 'none' });
  // big screen
  const sx = 1460, sy = 350;
  m += R(sx - 345, sy - 205, 690, 410, 26, ol(sunny ? '#FFFFFF' : '#2A2F48', 8)) + R(sx - 330, sy - 190, 660, 380, 18, { fill: '#0A0C18' });
  let scr = '';
  if (opts.screen !== undefined) scr = screenOf(opts.screen, 640, 360);
  else if (opts.timer !== undefined) {
    scr = R(-320, -180, 640, 360, 0, { fill: '#1A0A1E' }) + R(-320, -180, 640, 360, 0, { fill: 'url(#setsNewsTimer)' });
    scr += TF(opts.label ?? 'SHUTDOWN IN', 0, -82, 44, '#FF9AA6', { 'letter-spacing': 6 }) + T(String(opts.timer), 0, 66, 124, '#FFFFFF', { 'letter-spacing': 2, stroke: '#FF2E4E', 'stroke-width': 6, 'paint-order': 'stroke' });
    scr += spinner(-250, 120, 18, t, '#FF6A7E') + spinner(250, 120, 18, t + 0.2, '#FF6A7E');
  } else if (sunny) {
    scr = R(-320, -180, 640, 360, 0, { fill: '#7FD0FF' }) + CI(-200, -90, 60, ol('#FFE14D', 6)) + R(-320, 100, 640, 80, 0, { fill: '#5DBB63' }) + T('THE GREAT AFK', 0, 20, 76, '#FFFFFF', OUTX(10)) + TF('the whole world went outside', 0, 72, 30, '#2A2246');
  } else {
    scr = R(-320, -180, 640, 360, 0, { fill: '#B3243A' }) + CI(-150, 0, 100, ol('#5BC0EB', 6)) + P('M-210 -40 Q-160 -70 -120 -30 Q-90 10 -130 50 Q-170 40 -200 20 Z M-110 -80 Q-70 -60 -80 -30 Z', { fill: '#3FBF5A' }) + T('BREAKING', 110, -10, 70, '#FFFFFF', OUTX(10)) + T('NEWS', 110, 64, 70, '#FFE14D', OUTX(10));
  }
  m += G(G(scr, null, { 'clip-path': 'url(#setsClipNews)' }), `translate(${sx} ${sy})`) + R(sx - 320, sy - 180, 640, 360, 10, { fill: 'url(#setsScreenShine)' });
  m += R(sx - 60, sy + 205, 120, 120, 0, ol(sunny ? '#FFFFFF' : '#2A2F48', 6));
  // desk (fg)
  let fg = '';
  fg += P('M260 790 Q960 740 1660 790 L1600 1100 L320 1100 Z', ol(sunny ? '#FFFFFF' : '#1E2550', 8));
  fg += P('M290 820 Q960 778 1630 820', ln(8, sunny ? '#FFB13B' : '#E8243C')) + P('M310 1000 Q960 960 1610 1000', ln(4, sunny ? '#FFD9A0' : '#FF7A8A', 0.5));
  fg += P('M240 780 Q960 730 1680 780 L1680 800 Q960 750 240 800 Z', ol(sunny ? '#FFE6A8' : '#3A4590', 6));
  fg += G(R(-120, -30, 240, 60, 16, ol(sunny ? '#FFB13B' : '#E8243C', 5)) + T(opts.logo || 'NEWS 24', 0, 18, 44, '#FFFFFF'), 'translate(960 836)');
  fg += R(560, 752, 130, 28, 4, ol('#FFFFFF', 4)) + R(572, 744, 130, 28, 4, ol('#F4F1E6', 4));
  if (sunny) fg += G(R(-26, -60, 52, 60, 10, ol('#FF7A59', 5)) + P('M26 -46 Q48 -40 26 -22', ln(6)) + P('M-8 -70 Q-16 -86 -6 -100 M10 -70 Q2 -88 12 -102', ln(4, '#FFFFFF', 0.7)), 'translate(1220 772)') + G(R(-30, -50, 60, 50, 8, ol('#E8603C', 5)) + P('M0 -50 Q-30 -100 -10 -120 M0 -50 Q10 -110 40 -110 M0 -50 Q30 -80 50 -70', ln(10, '#3FBF5A')), 'translate(1480 790)');
  else fg += G(R(-22, -50, 44, 50, 8, ol('#5BC0EB', 5)) + P('M22 -38 Q40 -32 22 -16', ln(5)), 'translate(1240 772)');
  if (opts.ticker) fg += newsTicker(t, opts.ticker, opts.tickerY ?? 880, sunny);
  return { bg: '', mid: m, fg, light: '' };
}
const newsStudio = makeSet(newsLayers);
newsStudio.ticker = newsTicker;

// ================================================================= 6. SCREENS — "every screen in the world" montage props
// screens(kind, x, y, s, inner, t, opts): (x, y) = CENTRE OF THE SCREEN, scaled by s; `inner` = svg centred on (0,0)
// of the screen box, or fn(w, h) => svg (pass e.g. (w,h) => K.popup(0, 0, w*0.9, h*0.8, ...)). Box sizes in SCREEN_BOX.
// kind 'billboard' is a whole street scene in world space: (x, y, s) = translate/scale of the 1920x1080 frame
// (0, 0, 1 = default framing); its screen centre is SCREEN_BOX.billboard.cx/cy. opts: { off, hand:false }
const SCREEN_BOX = {
  phone: { w: 300, h: 600 }, laptop: { w: 480, h: 270 }, tv: { w: 640, h: 360 }, watch: { w: 176, h: 200 },
  microwave: { w: 180, h: 90 }, register: { w: 240, h: 136 }, planeSeat: { w: 360, h: 202 }, billboard: { w: 840, h: 472, cx: 1060, cy: 400 },
};
const scr = (kind, inner, opts = {}) => {
  const { w, h } = SCREEN_BOX[kind];
  const id = { laptop: 'setsClipLaptopX', tv: 'setsClipTvX' }[kind] || 'setsClip' + kind[0].toUpperCase() + kind.slice(1);
  const content = opts.off ? R(-w / 2, -h / 2, w, h, 0, { fill: '#0E1018' }) : R(-w / 2, -h / 2, w, h, 0, { fill: '#2A3550' }) + screenOf(inner, w, h);
  return G(content, null, { 'clip-path': `url(#${id})` }) + (opts.off ? '' : R(-w / 2, -h / 2, w, h, kind === 'watch' ? 40 : 8, { fill: 'url(#setsScreenShine)' }));
};
const hand = (fingers = 4, col = '#F2C9A0') => {
  let o = '';
  for (let i = 0; i < fingers; i++) o += R(-30, i * 46, 64, 40, 20, ol(col, 5));
  return o;
};
function screens(kind, x = 960, y = 540, s = 1, inner = '', t = 0, opts = {}) {
  let o = '';
  if (kind === 'phone') {
    if (opts.hand !== false) o += P('M-200 200 Q-230 330 -150 420 L150 430 Q220 330 200 180 Z', ol('#F2C9A0', 7));
    o += R(-176, -346, 352, 692, 52, ol('#7C5CFF', 8)) + R(-162, -332, 324, 664, 42, { fill: '#14161E' });
    o += scr('phone', inner, opts) + R(-38, -322, 76, 16, 8, { fill: '#000' }) + R(-150, -300, 300, 600, 22, ln(4, '#000'));
    o += R(176, -200, 10, 70, 4, ol('#5A40D8', 3)) + R(-186, -230, 10, 50, 4, ol('#5A40D8', 3));
    if (opts.hand !== false) o += G(hand(4), 'translate(190 60) rotate(-4)') + G(R(-30, -26, 130, 52, 26, ol('#F2C9A0', 6)), 'translate(-214 150) rotate(-30)') + P('M-150 300 Q-60 330 40 300', ln(5, '#D9A980'));
  } else if (kind === 'laptop') {
    o += R(-266, -160, 532, 322, 22, ol('#C9D1DD', 7)) + R(-254, -148, 508, 298, 14, { fill: '#14161E' });
    o += scr('laptop', inner, opts) + R(-240, -135, 480, 270, 6, ln(4, '#000'));
    o += P('M-290 162 L290 162 L330 206 L-330 206 Z', ol('#B4BECC', 7)) + R(-340, 204, 680, 18, 9, ol('#9AA5B5', 5)) + R(-70, 166, 140, 12, 6, { fill: '#9AA5B5' });
    o += G(CI(0, 0, 18, ol('#FF6FA8', 3)) + P('M-8 -2 L0 -10 L8 -2 L0 8 Z', { fill: '#FFFFFF' }), 'translate(214 -120)');
  } else if (kind === 'tv') {
    o += R(-346, -206, 692, 412, 16, ol('#1C1F28', 8)) + scr('tv', inner, opts) + R(-320, -180, 640, 360, 6, ln(4, '#000'));
    o += P('M-240 206 L-270 252 M240 206 L270 252', ln(14, LINE)) + P('M-240 206 L-270 252 M240 206 L270 252', ln(6, '#3A3F4E')) + CI(320, 194, 4, { fill: '#46FF8A' });
  } else if (kind === 'watch') {
    o += R(-700, -92, 870, 184, 60, ol('#F2C9A0', 7)) + R(-720, -110, 160, 220, 30, ol('#5BC0EB', 7));
    o += G(R(-60, -70, 150, 140, 60, ol('#F2C9A0', 7)) + P('M30 -40 Q60 -30 50 0 M30 0 Q60 10 50 40', ln(5, '#D9A980')), 'translate(200 0)');
    o += R(-80, -180, 160, 360, 30, ol('#2EC4B6', 7)) + P('M-60 -150 L60 -150 M-60 150 L60 150', ln(6, '#1E9E94'));
    o += R(-112, -124, 224, 248, 58, ol('#22242C', 8)) + scr('watch', inner, opts) + R(-88, -100, 176, 200, 40, ln(4, '#000'));
    o += R(110, -30, 16, 40, 6, ol('#3A3F4E', 4));
  } else if (kind === 'microwave') {
    // origin = display centre (on the control panel at right); body centre is at (-255, 110)
    const sp = Math.cos(t * 2.2);
    let b = R(-380, -210, 760, 420, 26, ol('#F4F1EA', 8)) + R(-360, -190, 490, 380, 18, ol('#2A2F3C', 7));
    b += R(-344, -174, 458, 348, 12, { fill: '#3A3226' }) + E(-115, 120, 170, 34, { fill: '#5A4A3A', stroke: '#2A2218', 'stroke-width': 4 });
    b += G(P('M-70 0 L70 0 L60 -110 L-60 -110 Z', ol('#FFFFFF', 5)) + P('M-60 -110 L60 -110 L40 -150 L-40 -150 Z', ol('#FFFFFF', 5)) + P('M-30 -80 L30 -80 M-34 -50 L34 -50', ln(6, '#FF5A6E')), `translate(-115 120) scale(${f(Math.max(0.25, Math.abs(sp)))} 1)`);
    b += E(-115, -40, 200, 160, { fill: '#FFE9A8', opacity: 0.18 }) + P('M-330 -160 L-200 -160 L-320 -20 Z', { fill: '#FFFFFF', opacity: 0.1 });
    b += R(150, -190, 210, 380, 14, ol('#E3DED2', 5)) + R(-400, -100, 30, 200, 12, ol('#D9D4C8', 5));
    o += G(b, 'translate(-255 110)');
    o += R(-100, -50, 200, 100, 10, ol('#1A1D26', 6)) + scr('microwave', inner, opts) + R(-90, -45, 180, 90, 6, ln(3, '#000'));
    for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) o += R(-70 + c * 52, 74 + r * 42, 40, 30, 8, ol('#FFFFFF', 3.5)) + TF(String(1 + r * 3 + c), -50 + c * 52, 96 + r * 42, 16, '#5A6070');
    o += R(-84, 206, 168, 40, 12, ol('#3FBF5A', 4)) + TF('START', 0, 234, 20, '#FFFFFF');
  } else if (kind === 'register') {
    // origin = customer display centre; register body below, counter at y 330
    o += R(-1200, 330, 2400, 60, 0, ol('#C98A52', 6)) + R(-1200, 386, 2400, 300, 0, { fill: '#A86B3C' });
    o += R(-14, 80, 28, 120, 6, ol('#8E96A3', 5));
    o += P('M-250 330 L250 330 L220 190 L-220 190 Z', ol('#5A6478', 7)) + P('M-200 310 L200 310 L180 210 L-180 210 Z', { fill: '#3E4658' });
    for (let r = 0; r < 3; r++) for (let c = 0; c < 6; c++) o += R(-160 + c * 52 + r * 4, 222 + r * 28, 40, 20, 5, ol(r === 2 && c > 3 ? '#3FBF5A' : '#E9EDF3', 3));
    o += R(-280, 330, 560, 50, 8, ol('#4A5263', 6)) + R(-30, 344, 60, 10, 5, { fill: '#2A2F3C' });
    o += R(180, 140, 70, 60, 8, ol('#E9EDF3', 5)) + P(`M196 140 L196 ${f(60 + Math.sin(t) * 6)} L234 ${f(64 + Math.sin(t) * 6)} L234 140`, ol('#FFFFFF', 4)) + P('M204 90 L226 90 M204 110 L222 110', ln(3, '#B9C0CC'));
    o += R(-144, -92, 288, 184, 18, ol('#2A2F3C', 8)) + scr('register', inner, opts) + R(-120, -68, 240, 136, 6, ln(3, '#000'));
    o += G(R(-70, -110, 140, 110, 10, ol('#FF7A59', 5)) + R(-60, -100, 120, 30, 6, { fill: '#FFFFFF' }) + TF('CANDY', 0, -78, 20, '#FF5A6E') + CI(-36, -40, 14, ol('#FFD34D', 3)) + CI(0, -36, 14, ol('#3FBF5A', 3)) + CI(36, -40, 14, ol('#5BC0EB', 3)), 'translate(-440 330)');
  } else if (kind === 'planeSeat') {
    o += R(-640, -470, 300, 1100, 120, ol('#2F4FA8', 7)) + R(340, -470, 300, 1100, 120, ol('#2F4FA8', 7));
    o += R(-300, -480, 600, 1150, 130, ol('#3A5FC8', 8)) + R(-300, -480, 600, 1150, 130, { fill: 'url(#setsSeatShade)' });
    o += P('M-230 -430 L230 -430 L250 -250 L-250 -250 Z', ol('#F4F1EA', 6)) + R(-250, -300, 500, 24, 0, { fill: '#5BC0EB' });
    o += R(-206, -127, 412, 254, 22, ol('#1A1D26', 7)) + scr('planeSeat', inner, opts) + R(-180, -101, 360, 202, 6, ln(3, '#000'));
    o += R(-226, 170, 452, 230, 24, ol('#2C47A0', 6)) + R(-40, 184, 80, 22, 8, ol('#8E96A3', 4));
    o += P('M-230 430 L230 430 L240 600 L-240 600 Z', ol('#2C47A0', 6)) + R(-120, 400, 150, 120, 6, ol('#FFFFFF', 4)) + TF('SAFETY', -45, 450, 22, '#E8243C') + R(-30, 410, 120, 110, 6, ol('#FFD34D', 4));
  } else if (kind === 'billboard') {
    return G(billboardStreet(t, inner, opts), tr(x, y, s));
  }
  return G(o, tr(x, y, s, opts.rot || 0));
}
function billboardStreet(t, inner, opts = {}) {
  const B = SCREEN_BOX.billboard;
  let o = R(-800, -600, 3520, 2280, 0, { fill: 'url(#setsDusk)' });
  for (let i = 0; i < 14; i++) o += CI(hash(i * 3.1) * 1920, 30 + hash(i * 7.3) * 260, 2.5, { fill: '#FFFFFF', opacity: 0.6 + 0.3 * Math.sin(t * 2 + i) });
  // back buildings
  const back = [[-40, 380, 220], [160, 300, 160], [300, 420, 200], [1500, 340, 180], [1660, 260, 160], [1800, 400, 200]];
  for (const [x, top, w] of back) o += R(x, top, w, 900 - top, 4, { fill: '#3A2E6E', stroke: '#2A2058', 'stroke-width': 4 }) + R(x + 14, top + 20, w - 28, 900 - top - 40, 0, { fill: 'url(#setsWinNight)', opacity: 0.8 });
  // the billboard building + giant screen
  o += R(B.cx - 520, 640, 1040, 400, 6, ol('#4A3A80', 7)) + R(B.cx - 500, 670, 1000, 300, 0, { fill: 'url(#setsWinNight)' });
  o += P(`M${B.cx - 300} 640 L${B.cx - 300} 600 M${B.cx + 300} 640 L${B.cx + 300} 600`, ln(22, LINE)) + P(`M${B.cx - 300} 640 L${B.cx - 300} 600 M${B.cx + 300} 640 L${B.cx + 300} 600`, ln(12, '#6A6F86'));
  o += R(B.cx - B.w / 2 - 30, B.cy - B.h / 2 - 30, B.w + 60, B.h + 60, 18, ol('#2A2F48', 8));
  o += G(scr('billboard', inner, opts), `translate(${B.cx} ${B.cy})`) + R(B.cx - B.w / 2, B.cy - B.h / 2, B.w, B.h, 8, ln(4, '#000'));
  for (let i = 0; i < 5; i++) { const lx = B.cx - 360 + i * 180; o += P(`M${lx} ${B.cy - B.h / 2 - 30} L${lx} ${B.cy - B.h / 2 - 60} L${lx + 30} ${B.cy - B.h / 2 - 60}`, ln(6, '#2A2F48')) + P(`M${lx + 30} ${B.cy - B.h / 2 - 54} L${lx + 70} ${B.cy - B.h / 2 + 40} L${lx - 10} ${B.cy - B.h / 2 + 40} Z`, { fill: '#FFF2B0', opacity: 0.12 }); }
  o += E(B.cx, B.cy + 60, 640, 420, { fill: '#9FB8FF', opacity: 0.08 });
  // left building with neon sign
  o += R(-60, 470, 460, 600, 6, ol('#5A3A8A', 7)) + R(-40, 500, 420, 420, 0, { fill: 'url(#setsWinNight)' });
  const nf = Math.floor(t * 3) % 7 === 0 ? 0.4 : 1;
  o += R(60, 420, 260, 80, 14, ol('#1A1430', 6)) + T('PIZZA', 190, 478, 52, '#FF6FB5', { opacity: f(nf) });
  // street
  o += R(-800, 900, 3520, 400, 0, { fill: '#2A2448' }) + R(-800, 880, 3520, 30, 0, ol('#6A5E9A', 5));
  let dash = '';
  for (let x = -100 - ((t * 240) % 200); x < 2000; x += 200) dash += `M${f(x)} 1000 L${f(x + 100)} 1000 `;
  o += P(dash, ln(8, '#FFE14D', 0.5));
  for (const lx of [560, 1500]) o += P(`M${lx} 880 L${lx} 560 Q${lx} 530 ${lx + 40} 530`, ln(16, LINE)) + P(`M${lx} 880 L${lx} 560 Q${lx} 530 ${lx + 40} 530`, ln(8, '#4A4E66')) + E(lx + 50, 534, 26, 12, ol('#FFF2B0', 4)) + E(lx + 50, 600, 90, 70, { fill: '#FFF2B0', opacity: 0.15 });
  // a car going by
  const cx = ((t * 260) % 2600) - 400;
  o += G(R(-120, -50, 240, 56, 18, ol('#FF7A59', 6)) + P('M-70 -50 L-40 -90 L50 -90 L80 -50 Z', ol('#FF7A59', 6)) + P('M-56 -54 L-34 -84 L4 -84 L4 -54 Z M16 -54 L16 -84 L44 -84 L66 -54 Z', { fill: '#BFE8FF' }) + CI(-70, 8, 22, ol('#2A2A33', 6)) + CI(70, 8, 22, ol('#2A2A33', 6)) + E(126, -24, 12, 8, { fill: '#FFF2B0' }), tr(cx, 960));
  return o;
}

// ================================================================= 7. BATHROOM — Mom's six-hour bath
// Direct view: tiles, clawfoot tub centred (rim y 640), foam, a tray across the tub with three tablets.
// Mom sits in the tub: SPOTS.bathroom.mom {x 960, y 930, s 0.55} — draw layers.mid, Mom, then layers.fg
// (tub front + foam + tray + tablets hide her below the shoulders). FLOOR.bathroom = 1000 (standing in the room).
// opts: { view: 'direct'|'window', tablets (0..3, default 3), tabletsClosed 0..1 (flip shut one after another),
//   tabletScreens [svg|fn(w,h), ...] (box 150 x 100), clock (hours shown on the wall clock, default 6), steam:false, evening }
// bathroom.window(t, opts, insideSvg): the outside wall + window, with insideSvg (bathroom world coords) seen through it.
const BATH_WIN = { x0: 580, y0: 210, x1: 1340, y1: 740, tf: 'translate(960 470) scale(0.62) translate(-960 -560)' };
function tabletGame(i, t, w, h) {
  if (i === 0) { // obby
    let o = R(-w / 2, -h / 2, w, h, 0, { fill: '#7FD0FF' });
    ['#FF5A5A', '#FFD34D', '#3FBF5A', '#B07CFF'].forEach((c, k) => { o += R(-60 + k * 32, 28 - k * 16 + Math.sin(t * 3 + k) * 2, 26, 9, 3, { fill: c, stroke: LINE, 'stroke-width': 2 }); });
    return o + R(-62, 14 - ((t * 40) % 30), 8, 12, 2, { fill: '#FFD21F' });
  }
  if (i === 1) { // pet sim
    let o = R(-w / 2, -h / 2, w, h, 0, { fill: '#FFB4D8' }) + CI(0, 8, 26, ol('#FFF1D6', 3)) + CI(-10, 2, 3, { fill: LINE }) + CI(10, 2, 3, { fill: LINE }) + P('M-18 -14 L-12 -30 L-4 -18 M4 -18 L12 -30 L18 -14', ol('#FFF1D6', 3));
    return o + P(starD(46, -26, 10), { fill: '#FFD34D' });
  }
  let o = R(-w / 2, -h / 2, w, h, 0, { fill: '#9FE8C9' }) + R(-w / 2, 10, w, h / 2, 0, { fill: '#3FBF8A' }); // farm/tycoon
  o += R(-50, -18, 40, 30, 3, ol('#FF7A59', 2.5)) + P('M-54 -18 L-30 -38 L-6 -18 Z', ol('#E8506E', 2.5)) + R(20, -6, 40, 18, 3, ol('#FFD34D', 2.5)) + TF('$$$', 36, -18, 14, '#2A6A2A');
  return o;
}
function bathLayers(t, opts = {}) {
  let m = '';
  m += R(-800, -600, 3520, 960, 0, { fill: '#FFD6E2' }) + R(-800, 340, 3520, 500, 0, { fill: 'url(#setsTileMint)' });
  m += R(-800, 330, 3520, 20, 4, ol('#FFFFFF', 5)) + R(-800, 820, 3520, 400, 0, { fill: 'url(#setsBathFloor)' }) + R(-800, 812, 3520, 16, 3, ol('#E8F7F2', 4));
  // frosted window + plant
  m += R(1170, 100, 260, 210, 12, ol('#FFFFFF', 7)) + R(1186, 116, 228, 178, 6, { fill: opts.evening ? '#E8B8D8' : '#D8F0FF' }) + P('M1200 280 L1290 130 L1330 130 L1240 280 Z M1300 280 L1370 160 L1390 160 L1320 280 Z', { fill: '#FFFFFF', opacity: 0.55 });
  m += R(1300, 116, 8, 178, 2, { fill: '#FFFFFF' }) + R(1150, 304, 300, 18, 6, ol('#FFFFFF', 5));
  m += P('M1220 304 L1226 266 L1266 266 L1272 304 Z', ol('#FF9EC4', 4)) + P('M1246 266 Q1230 230 1212 226 M1246 266 Q1250 222 1270 214 M1246 266 Q1270 246 1290 248', ln(8, '#3FBF5A'));
  // shower rail + curtain gathered at left
  m += R(240, 80, 1460, 14, 7, ol('#C9CED6', 4));
  const cs = Math.sin(t * 0.9) * 5;
  m += P(`M250 86 L520 86 Q500 300 ${510 + cs} 560 Q470 600 ${430 + cs} 820 L270 820 Q300 500 250 86 Z`, ol('#FF8FB8', 6));
  m += P(`M330 92 Q340 400 ${330 + cs} 810 M420 92 Q430 400 ${400 + cs} 810`, ln(5, '#E8669A')) + CI(310, 300, 12, { fill: '#FFFFFF', opacity: 0.7 }) + CI(450, 220, 12, { fill: '#FFFFFF', opacity: 0.7 }) + CI(380, 520, 12, { fill: '#FFFFFF', opacity: 0.7 }) + CI(330, 700, 12, { fill: '#FFFFFF', opacity: 0.7 });
  for (let i = 0; i < 6; i++) m += CI(270 + i * 48, 86, 10, ln(4, '#9AA3B2'));
  // wall clock (shows opts.clock hours — "six hours" gag) + towel rack
  const hrs = opts.clock ?? 6;
  m += CI(760, 200, 62, ol('#FFFFFF', 7)) + CI(760, 200, 50, ln(3, '#FFC2D6'));
  for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; m += CI(760 + Math.cos(a) * 42, 200 + Math.sin(a) * 42, 3.2, { fill: '#C97A9A' }); }
  const ha = (hrs / 12) * Math.PI * 2, ma = ((hrs % 1) * Math.PI * 2) + t * 0.02;
  m += P(`M760 200 L${f(760 + Math.sin(ha) * 26)} ${f(200 - Math.cos(ha) * 26)}`, ln(7)) + P(`M760 200 L${f(760 + Math.sin(ma) * 38)} ${f(200 - Math.cos(ma) * 38)}`, ln(5)) + CI(760, 200, 6, { fill: '#FF5A8A' });
  m += R(1560, 420, 230, 14, 7, ol('#C9CED6', 4)) + P('M1580 428 L1580 640 Q1600 660 1620 640 L1620 428 Z', ol('#FFD34D', 5)) + P('M1630 428 L1640 700 L1760 700 L1770 428 Z', ol('#5BC0EB', 5)) + P('M1646 640 L1754 640 M1648 660 L1752 660', ln(6, '#FFFFFF'));
  // bath mat + slippers
  m += E(960, 960, 300, 36, { fill: '#FFB4D0' }) + E(960, 958, 260, 24, { fill: 'none', stroke: '#FFFFFF', 'stroke-width': 6, 'stroke-dasharray': '18 12' });
  m += E(1420, 900, 46, 18, ol('#FF8FB8', 4)) + E(1490, 904, 46, 18, ol('#FF8FB8', 4));
  // tub: back rim + water (behind Mom)
  m += E(960, 646, 440, 46, ol('#FFFFFF', 7)) + E(960, 650, 410, 32, { fill: '#9FE2F0' });
  // steam
  if (opts.steam !== false) for (let i = 0; i < 4; i++) {
    const ph = (t * 0.25 + i / 4) % 1, x = 700 + i * 170;
    m += P(`M${x} ${560 - ph * 220} q20 -30 0 -60 q-20 -30 0 -60`, ln(10, '#FFFFFF', f(0.5 * Math.sin(ph * Math.PI))));
  }
  // fg: foam, tub body, feet, tray, tablets, duck, candles
  let fg = '';
  let foam = '';
  const fb = [[560, 640, 60], [620, 600, 70], [700, 628, 56], [1220, 628, 60], [1300, 600, 70], [1360, 640, 56], [800, 652, 40], [1120, 652, 40], [960, 660, 36], [880, 650, 34], [1040, 650, 34]];
  fb.forEach(([x, y, r], k) => { foam += CI(x, y + Math.sin(t * 1.3 + k) * 3, r, { fill: '#FFFFFF' }); });
  fg += foam + P(fb.map(([x, y, r]) => circD(x, y, r)).join(' '), { fill: 'none', stroke: '#C9EEF7', 'stroke-width': 4, opacity: 0.6 });
  for (const [x, y, r] of [[600, 560, 14], [1290, 548, 18], [1380, 590, 10], [540, 600, 9]]) fg += CI(x, y + Math.sin(t * 2 + x) * 6, r, { fill: '#FFFFFF', opacity: 0.5, stroke: '#B9E8F5', 'stroke-width': 3 });
  fg += P('M520 650 Q520 860 700 870 L1220 870 Q1400 860 1400 650 Z', ol('#FFFFFF', 7)) + P('M540 690 Q550 840 700 852 L760 852', ln(8, '#E4F1F7')) + E(960, 650, 446, 22, ol('#FFFFFF', 6));
  for (const fx of [600, 1320]) fg += P(`M${fx - 30} 850 Q${fx - 40} 900 ${fx - 60} 912 L${fx + 10} 912 Q${fx} 890 ${fx + 20} 860 Z`, ol('#FFD34D', 5));
  // tray + tablets
  const nT = clamp(Math.round(opts.tablets ?? 3), 0, 3), closed = clamp(opts.tabletsClosed || 0, 0, 1);
  fg += R(640, 698, 640, 26, 8, ol('#C98A52', 5)) + R(650, 702, 620, 8, 4, { fill: '#E3B676' }) + P('M650 724 L660 744 M1270 724 L1260 744', ln(8, '#8A5530'));
  for (let i = 0; i < nT; i++) {
    const x = 960 + (i - (nT - 1) / 2) * 190, ci = clamp(closed * nT - i, 0, 1);
    const scrSvg = opts.tabletScreens && opts.tabletScreens[i] !== undefined ? screenOf(opts.tabletScreens[i], 150, 100) : tabletGame(i, t, 150, 100);
    let tb = R(-86, -122, 172, 122, 14, ol('#2C303C', 6));
    tb += G(G(R(-75, -50, 150, 100, 0, { fill: '#123' }) + scrSvg, null, { 'clip-path': 'url(#setsClipTablet)' }), 'translate(0 -61)') + R(-75, -111, 150, 100, 4, { fill: 'url(#setsScreenShine)' });
    if (ci > 0) tb += R(-86, -122 * ci, 172, 122 * ci, 14, ol('#FF8FB8', 6)) + P(`M-60 ${f(-122 * ci + 20)} L60 ${f(-122 * ci + 20)}`, ln(4, '#FFFFFF', 0.6));
    tb += P('M-40 0 L-56 14 M40 0 L56 14', ln(7, '#2C303C'));
    fg += G(tb, tr(x, 700, 1, (i - 1) * 4));
  }
  fg += G(E(0, 0, 34, 24, ol('#FFD21F', 5)) + CI(-22, -26, 18, ol('#FFD21F', 5)) + P('M-40 -26 L-54 -22 L-40 -18 Z', ol('#FF8A3D', 3)) + CI(-26, -30, 3.5, { fill: LINE }), tr(1394, 626, 0.9, Math.sin(t * 1.5) * 4));
  for (const [cx, h] of [[548, 40], [586, 54]]) fg += R(cx - 12, 630 - h, 24, h, 4, ol('#FFF1D6', 4)) + P(`M${cx} ${630 - h} q${f(-8 + Math.sin(t * 8 + cx) * 3)} -14 0 -26 q8 12 0 26 Z`, { fill: '#FFB13B', stroke: LINE, 'stroke-width': 2.5 });
  return { bg: '', mid: m, fg, light: opts.evening ? R(-800, -600, 3520, 2280, 0, { fill: '#FF8A4C', opacity: 0.08 }) : '' };
}
function bathWindow(t, opts = {}, inside) {
  const W = BATH_WIN;
  let o = R(-800, -600, 3520, 2280, 0, { fill: '#7E8FE0' });
  o += G(G(R(-800, -600, 3520, 2280, 0, { fill: '#FFE9C8' }) + inside, W.tf), null, { 'clip-path': 'url(#setsClipBathWin)' });
  o += R(W.x0, W.y0, W.x1 - W.x0, W.y1 - W.y0, 0, { fill: '#FFE7A8', opacity: 0.1 });
  // outside wall with siding + window hole
  const wallD = `M-800 -600 L2720 -600 L2720 1700 L-800 1700 Z M${W.x0} ${W.y0} L${W.x0} ${W.y1} L${W.x1} ${W.y1} L${W.x1} ${W.y0} Z`;
  o += P(wallD, { fill: '#9FB8F0', 'fill-rule': 'evenodd' }) + P(wallD, { fill: 'url(#setsSiding)', 'fill-rule': 'evenodd' });
  o += P(`M${W.x0 - 36} ${W.y0 - 36} L${W.x1 + 36} ${W.y0 - 36} L${W.x1 + 36} ${W.y1 + 30} L${W.x0 - 36} ${W.y1 + 30} Z M${W.x0} ${W.y0} L${W.x0} ${W.y1} L${W.x1} ${W.y1} L${W.x1} ${W.y0} Z`, { fill: '#FFFFFF', 'fill-rule': 'evenodd', stroke: LINE, 'stroke-width': 7 });
  o += R(W.x0, W.y0, W.x1 - W.x0, W.y1 - W.y0, 0, { fill: 'none', stroke: LINE, 'stroke-width': 6 });
  // half-open sash at the top + lace curtains
  o += R(W.x0, W.y0, W.x1 - W.x0, 130, 0, { fill: '#DFF4FF', opacity: 0.55 }) + R(W.x0, W.y0 + 118, W.x1 - W.x0, 18, 3, ol('#FFFFFF', 5));
  o += P(`M${W.x0} ${W.y0} L${W.x0 + 170} ${W.y0} Q${W.x0 + 120} ${W.y0 + 160} ${W.x0} ${W.y0 + 260} Z`, ol('#FFF4FA', 5)) + P(`M${W.x1} ${W.y0} L${W.x1 - 170} ${W.y0} Q${W.x1 - 120} ${W.y0 + 160} ${W.x1} ${W.y0 + 260} Z`, ol('#FFF4FA', 5));
  // flower box + bush + drainpipe
  o += R(W.x0 - 50, W.y1 + 24, W.x1 - W.x0 + 100, 70, 10, ol('#C98A52', 6));
  for (let i = 0; i < 9; i++) { const x = W.x0 - 10 + i * ((W.x1 - W.x0 + 20) / 8); o += P(`M${x} ${W.y1 + 30} L${x + 4} ${W.y1 - 10}`, ln(6, '#3FBF5A')) + CI(x + 4, W.y1 - 16, 15, ol(['#FF6FA8', '#FFD34D', '#FF8A4C'][i % 3], 4)) + CI(x + 4, W.y1 - 16, 5, { fill: '#FFF6C8' }); }
  o += CI(300, 1000, 160, ol('#4FB86A', 6)) + CI(180, 1040, 120, ol('#4FB86A', 6)) + CI(1680, 1020, 170, ol('#4FB86A', 6)) + CI(1600, 980, 60, { fill: '#7FDB8E' });
  o += R(1560, -100, 40, 980, 10, ol('#E8EDF5', 5)) + R(1550, 300, 60, 20, 5, ol('#C9D1DD', 4));
  return o + R(-800, -600, 3520, 2280, 0, { fill: '#3A2A7A', opacity: opts.evening === false ? 0 : 0.12 });
}
const bathroom = (t = 0, opts = {}) => {
  const L = bathLayers(t, opts);
  if (opts.view === 'window') return bathWindow(t, opts, L.mid + L.fg + L.light);
  return L.mid + L.fg + L.light;
};
bathroom.layers = bathLayers;
bathroom.window = bathWindow;

// ================================================================= 8a. CLASSROOM — the math teacher cancels the test
// Chalkboard centre-left, teacher's desk at right: teacher stands behind it at SPOTS.classroom.teacher
// {x 1270, y 930, s 0.6}; layers.fg = desk front + two student desks in the bottom corners. FLOOR.classroom = 1000.
// opts: { cancel 0..1 (chalk X over TEST, then "NO TEST!"), laptop (svg|fn(w,h) on the teacher's laptop, 300x170;
//   default a tycoon game), laptopOff, students:false }
function classLayers(t, opts = {}) {
  const cancel = clamp(opts.cancel || 0, 0, 1);
  // bg: through the windows
  let bg = skyBg(t, 'day', 200, 330, { tree: false });
  bg += CI(120, 470, 120, ol('#5DBB63', 5)) + CI(280, 520, 100, ol('#4FB86A', 5)) + R(-800, 560, 3520, 400, 0, { fill: '#7ED36A' });
  let m = '';
  const wallD = 'M-800 -600 L2720 -600 L2720 830 L-800 830 Z M60 150 L60 560 L370 560 L370 150 Z';
  m += P(wallD, { fill: '#FFE1B8', 'fill-rule': 'evenodd' }) + R(-800, 600, 3520, 230, 0, { fill: '#9CCB9A' }) + R(-800, 590, 3520, 20, 4, ol('#FFF4E0', 5));
  m += R(40, 130, 350, 450, 10, { fill: 'none', stroke: LINE, 'stroke-width': 7 }) + P('M40 130 L390 130 L390 580 L40 580 Z M60 150 L60 560 L370 560 L370 150 Z', { fill: '#FFFFFF', 'fill-rule': 'evenodd', stroke: LINE, 'stroke-width': 5 });
  m += R(207, 150, 14, 410, 3, ol('#FFFFFF', 4)) + R(60, 348, 310, 14, 3, ol('#FFFFFF', 4)) + R(30, 576, 370, 22, 6, ol('#FFFFFF', 5));
  m += P('M80 330 L170 170 L200 170 L110 330 Z', { fill: '#FFFFFF', opacity: 0.3 });
  // chalkboard
  m += R(450, 130, 1000, 450, 12, ol('#B87A44', 8)) + R(474, 154, 952, 402, 6, { fill: '#2F6B4F' }) + R(474, 154, 952, 402, 6, { fill: 'url(#setsChalkSmudge)' });
  m += R(460, 570, 980, 22, 6, ol('#C98A52', 5)) + R(560, 560, 40, 12, 3, { fill: '#FFFFFF' }) + R(620, 562, 30, 10, 3, { fill: '#FFD34D' }) + R(1300, 556, 70, 18, 4, ol('#8A93A6', 3));
  const chalk = { fill: '#F4F7F2', 'font-family': 'Fredoka, sans-serif', 'font-weight': 600 };
  m += S.el('text', { x: 520, y: 230, 'font-size': 64, ...chalk }, 'MATH TEST TODAY!');
  m += P('M520 250 Q760 262 1010 246', ln(5, '#F4F7F2', 0.8));
  m += S.el('text', { x: 530, y: 330, 'font-size': 46, ...chalk }, '3x + 7 = 22') + S.el('text', { x: 530, y: 400, 'font-size': 46, ...chalk }, 'x = ?') + S.el('text', { x: 530, y: 480, 'font-size': 40, ...chalk, opacity: 0.85 }, '12 × 12 = 144');
  m += P('M1100 470 L1180 330 L1300 470 Z', ln(5, '#F4F7F2', 0.85)) + S.el('text', { x: 1160, y: 510, 'font-size': 34, ...chalk, opacity: 0.85 }, 'a² + b² = c²') + S.el('text', { x: 1250, y: 330, 'font-size': 40, ...chalk, opacity: 0.8 }, 'π ≈ 3.14');
  if (cancel > 0) {
    const a = clamp(cancel * 2, 0, 1), b = clamp(cancel * 2 - 1, 0, 1);
    const L1 = 420;
    const st = (u) => ({ fill: 'none', stroke: '#FF7A8A', 'stroke-width': 14, 'stroke-linecap': 'round', 'stroke-dasharray': `${L1} ${L1}`, 'stroke-dashoffset': f(L1 * (1 - u)) });
    m += P('M760 168 L1000 250', st(a)) + (a >= 1 ? P('M1000 168 L760 250', st(clamp(cancel * 3 - 1.5, 0, 1))) : '');
    if (b > 0) m += G(S.el('text', { x: 0, y: 0, 'font-size': 70, fill: '#FFE14D', 'font-family': 'Lilita One, sans-serif', 'text-anchor': 'middle' }, 'NO TEST!') + P('M110 -30 a24 24 0 1 0 0.1 0 M100 -38 L100 -36 M120 -38 L120 -36 M102 -22 Q110 -14 118 -22', ln(4, '#FFE14D')), `translate(1180 ${f(360 + 0)}) rotate(-6) scale(${f(ease.outBack(b))})`);
  }
  // clock, posters
  m += CI(1590, 120, 54, ol('#FFFFFF', 7)) + P(`M1590 120 L1590 86 M1590 120 L${f(1590 + Math.sin(t * 0.1) * 30)} ${f(120 - Math.cos(t * 0.1) * 30)}`, ln(6)) + CI(1590, 120, 6, { fill: '#E8243C' });
  m += G(R(-120, -150, 240, 300, 10, ol('#FFD34D', 6)) + T('MATH', 0, -96, 52, '#2F6FD6') + T('IS FUN', 0, -46, 40, '#FF5A6E') + CI(0, 40, 54, ol('#FF9EC4', 5)) + T('π', 0, 62, 70, '#FFFFFF', OUTX(8)) + CI(-18, 24, 5, { fill: LINE }) + CI(18, 24, 5, { fill: LINE }), 'translate(1640 360) rotate(3)');
  m += R(1530, 190, 0, 0) + G(R(-90, -60, 180, 120, 8, ol('#C98A52', 5)) + R(-76, -46, 64, 50, 3, { fill: '#FFFFFF' }) + R(4, -46, 72, 40, 3, { fill: '#BFE3FF' }) + R(-60, 14, 110, 30, 3, { fill: '#FFE36E' }) + pin(-44, -46) + pin(40, -46, '#3BD16F'), 'translate(1810 120) rotate(-3)');
  // floor
  m += R(-800, 828, 3520, 600, 0, { fill: 'url(#setsClassFloor)' }) + R(-800, 822, 3520, 16, 3, ol('#7AA87A', 4));
  // teacher's desk (back part: top + items) — the front panel is in fg
  m += R(1040, 742, 470, 36, 8, ol('#B87A44', 6)) + R(1050, 746, 450, 10, 5, { fill: '#D99A5C' });
  if (!opts.laptopOff) {
    const lscr = opts.laptop !== undefined ? opts.laptop : (w, h) => R(-w / 2, -h / 2, w, h, 0, { fill: '#7ED36A' }) + R(-120, 10, 70, 50, 4, ol('#FFD34D', 3)) + R(-40, -20, 80, 80, 4, ol('#FF7A59', 3)) + R(60, 0, 60, 60, 4, ol('#5BC0EB', 3)) + TF('$ 9,999,999', 0, -50, 26, '#FFFFFF', OUTX(5));
    m += G(laptop(0, 0, 1, (w, h) => G(screenOf(lscr, 300, 170), `scale(${f(w / 300)} ${f(h / 170)})`), {}), 'translate(1180 744) scale(0.48)');
  }
  m += CI(1430, 718, 26, ol('#E8243C', 5)) + P('M1430 692 Q1436 680 1446 678', ln(5, '#5A3A20')) + P('M1434 690 Q1452 676 1460 690 Q1446 696 1434 690 Z', ol('#3FBF5A', 2.5));
  m += R(1062, 706, 80, 40, 4, ol('#FFFFFF', 4)) + R(1066, 694, 80, 14, 3, ol('#F4F1E6', 3)) + TF('TESTS', 1104, 734, 16, '#E8243C');
  m += G(R(-22, -46, 44, 46, 8, ol('#FFFFFF', 4)) + TF('#1', 0, -16, 16, '#2F6FD6') + P('M22 -36 Q38 -30 22 -14', ln(4)), 'translate(1340 744)');
  // fg: desk front + student desks
  let fg = R(1030, 772, 490, 180, 8, ol('#A86B3C', 7)) + R(1060, 796, 200, 130, 6, { fill: 'none', stroke: '#8A5530', 'stroke-width': 5 }) + R(1290, 796, 200, 130, 6, { fill: 'none', stroke: '#8A5530', 'stroke-width': 5 });
  if (opts.students !== false) for (const [x, fl] of [[150, 1], [1770, -1]]) {
    fg += G(R(-190, -40, 380, 34, 8, ol('#E3B676', 6)) + P('M-170 -6 L-170 200 M170 -6 L170 200', ln(18, LINE)) + P('M-170 -6 L-170 200 M170 -6 L170 200', ln(9, '#8E96A3')) + R(-140, -90, 120, 50, 4, ol('#FFFFFF', 4)) + P('M-128 -76 L-40 -76 M-128 -60 L-60 -60', ln(3, '#B9C0CC')) + R(60, -60, 90, 16, 6, ol('#FFD34D', 3)), `translate(${x} 960) scale(${fl} 1)`);
  }
  return { bg, mid: m, fg, light: '' };
}
const classroom = makeSet(classLayers);

// ================================================================= 8b. STREAMER ROOM — "LAST STREAM EVER"
// Webcam point of view: the streamer sits in the gaming chair facing camera: SPOTS.streamerRoom.streamer
// {x 960, y 1040, s 0.62}; layers.mid = room + chair, layers.fg = desk (mic, juice boxes, keyboard) + overlay.
// opts: { overlay (stream UI: LIVE, viewers, chat, frame), viewers (number), juice (count, default 14), lightOn (ring
//   light, default true), banner (text) }
function streamLayers(t, opts = {}) {
  let m = R(-800, -600, 3520, 2280, 0, { fill: 'url(#setsStreamWall)' });
  m += R(330, 150, 1260, 560, 10, { fill: 'url(#setsFoam)', stroke: '#1A1438', 'stroke-width': 6 });
  // LED strips
  const hue = (k) => mix('#FF4FD8', '#3FF0FF', 0.5 + 0.5 * Math.sin(t * 1.2 + k));
  m += R(-800, 70, 3520, 10, 5, { fill: hue(0) }) + R(-800, 60, 3520, 30, 15, { fill: hue(0), opacity: 0.25 });
  // banner
  const bs = Math.sin(t * 1.3) * 4;
  m += P(`M380 70 Q960 ${110 + bs} 1540 70`, ln(4, '#E9EDF3'));
  m += P(`M420 90 L1500 90 L1480 ${200 + bs} L440 ${200 + bs} Z`, ol('#FFD34D', 7)) + P(`M420 90 L380 150 L440 ${200 + bs} Z M1500 90 L1540 150 L1480 ${200 + bs} Z`, ol('#E8243C', 6));
  m += T(opts.banner || 'LAST STREAM EVER', 960, 158 + bs * 0.5, 66, '#E8243C', { ...OUTX(8), stroke: '#FFFFFF' }) + TF('(24 HOURS)', 960, 192 + bs * 0.5, 26, '#2A2246');
  // ring light (left)
  const on = opts.lightOn !== false;
  m += P('M260 820 L260 520 M200 900 L260 820 L320 900', ln(14, LINE)) + P('M260 820 L260 520 M200 900 L260 820 L320 900', ln(7, '#5A6070'));
  if (on) m += CI(260, 380, 260, { fill: 'url(#setsRingGlow)' });
  m += P(circD(260, 380, 140) + ' ' + circD(260, 380, 96), { fill: on ? '#FFFDF0' : '#C9CED6', 'fill-rule': 'evenodd', stroke: LINE, 'stroke-width': 7 });
  m += CI(260, 380, 118, ln(4, on ? '#FFF2B0' : '#9AA3B2'));
  // shelf with trophy + figures (right)
  m += R(1610, 430, 260, 16, 5, ol('#3A3060', 4)) + P('M1660 430 L1660 380 Q1700 360 1700 410 L1700 430 Z', ol('#FFD34D', 4)) + R(1650, 394, 60, 10, 3, { fill: '#E8B84A' });
  m += R(1730, 356, 50, 74, 8, ol('#5BC0EB', 4)) + CI(1755, 346, 20, ol('#FFC2A0', 4)) + R(1800, 380, 50, 50, 8, ol('#FF6FB5', 4)) + T('1M', 1825, 414, 24, '#FFFFFF');
  m += R(1610, 600, 260, 16, 5, ol('#3A3060', 4)) + R(1640, 520, 40, 80, 6, ol('#7CD45A', 4)) + R(1700, 540, 40, 60, 6, ol('#FF8A3D', 4)) + R(1760, 510, 60, 90, 8, ol('#B07CFF', 4));
  // gaming chair (behind the streamer)
  m += P('M720 300 Q960 250 1200 300 L1180 840 L740 840 Z', ol('#22242C', 8)) + P('M800 340 Q960 306 1120 340 L1100 820 L820 820 Z', { fill: '#3BE07A' }) + P('M850 360 Q960 336 1070 360 L1056 800 L864 800 Z', { fill: '#22242C' });
  m += R(890, 380, 140, 60, 26, ol('#FF4FD8', 5)) + P('M680 600 L740 560 L740 760 L690 760 Z M1240 600 L1180 560 L1180 760 L1230 760 Z', ol('#2C2E38', 6));
  // fg: desk, keyboard, mic, juice boxes, overlay
  let fg = R(140, 820, 1640, 300, 14, ol('#2A2246', 8)) + R(150, 820, 1620, 26, 10, { fill: '#3A3060' }) + R(150, 846, 1620, 8, 0, { fill: hue(2), opacity: 0.9 }) + R(150, 840, 1620, 26, 0, { fill: hue(2), opacity: 0.2 });
  fg += P('M760 800 L1160 800 L1180 836 L740 836 Z', ol('#1A1D26', 5));
  for (let i = 0; i < 12; i++) fg += R(760 + i * 34, 808, 26, 10, 3, { fill: mix('#FF4FD8', '#3FF0FF', ((i / 12) + t * 0.3) % 1) });
  fg += E(1260, 824, 36, 18, ol('#1A1D26', 4)) + P('M1260 806 L1260 818', ln(3, hue(3)));
  // mic on a boom arm from the left
  fg += P('M300 840 L380 620 L600 590', ln(16, LINE)) + P('M300 840 L380 620 L600 590', ln(8, '#3A3F4E')) + G(R(-34, -70, 68, 120, 34, ol('#2C303C', 6)) + P('M-20 -40 L20 -40 M-20 -20 L20 -20 M-20 0 L20 0', ln(4, '#5A6070')), 'translate(624 600) rotate(-20)');
  const nj = Math.max(0, Math.round(opts.juice ?? 14));
  const pyr = [];
  for (let r = 0, k = 0; k < nj && r < 6; r++) for (let c = 0; c < 6 - r && k < nj; c++, k++) pyr.push([1360 + c * 40 + r * 20, 822 - r * 52]);
  pyr.forEach(([x, y], k) => { fg += juiceBox(x, y, 0.92, (hash(k * 2.1) - 0.5) * 8, JUICE_COLS[k % JUICE_COLS.length]); });
  if (opts.overlay) fg += streamOverlay(t, opts);
  return { bg: '', mid: m, fg, light: '' };
}
function streamOverlay(t, opts = {}) {
  let o = R(26, 26, 1868, 1028, 36, { fill: 'none', stroke: mix('#FF4FD8', '#3FF0FF', 0.5 + 0.5 * Math.sin(t)), 'stroke-width': 10 });
  o += R(60, 60, 170, 58, 18, { fill: '#E8243C' }) + CI(96, 89, 10, { fill: '#FFFFFF', opacity: f(0.6 + 0.4 * Math.sin(t * 6)) }) + T('LIVE', 160, 106, 40, '#FFFFFF');
  const v = opts.viewers ?? 1204551 + Math.floor(t * 37);
  o += R(244, 60, 240, 58, 18, { fill: '#1B1430', opacity: 0.8 }) + E(280, 89, 18, 11, { fill: '#FFFFFF' }) + CI(280, 89, 6, { fill: '#1B1430' }) + TF(num(v), 380, 102, 30, '#FFFFFF');
  // chat column
  o += R(1560, 250, 300, 520, 22, { fill: '#120E24', opacity: 0.72 }) + TF('CHAT', 1610, 290, 26, '#9AA3C0', { 'text-anchor': 'start' });
  const msgs = [['bloxkid', "don't blink!!"], ['pixl', 'W STREAM'], ['nana_g', 'go to bed sweetie'], ['obbyGod', '1 more game'], ['xX_cat', 'POG'], ['zed', 'he blinked'], ['moonpie', 'LAST STREAM 😭'], ['tofu', 'GG'], ['lumi', 'chat is this real'], ['k1ng', 'no sleep!!']];
  const sc = t * 0.9, base = Math.floor(sc), frac = sc - base;
  for (let i = 0; i < 7; i++) {
    const [u, msg] = msgs[(base + i) % msgs.length];
    const y = 740 - i * 62 - frac * 62;
    if (y < 300) continue;
    o += TF(u + ':', 1586, y, 22, ['#7CF7FF', '#FFD34D', '#FF8FD8', '#7CFF8A'][(base + i) % 4], { 'text-anchor': 'start' }) + TF(msg.replace('😭', ':('), 1590, y + 26, 22, '#FFFFFF', { 'text-anchor': 'start' });
  }
  return o;
}
const streamerRoom = makeSet(streamLayers);
streamerRoom.overlay = streamOverlay;

// ================================================================= 8c. DEX'S ROOM — the wall of 9,999 badges
// A wall of framed badges (pattern) with ONE empty frame: SPOTS.dexRoom.emptyFrame {x, y} (frame centre) — spotlit.
// Stand line FLOOR.dexRoom = 1000. opts: { filled 0..1 (the Touch Grass badge pops into the empty frame),
//   spot:false (no spotlight), count (plaque number, default '9,999') }
const DEX_EMPTY = { x: 1290, y: 400 };
function dexLayers(t, opts = {}) {
  const filled = clamp(opts.filled || 0, 0, 1);
  let m = R(-800, -600, 3520, 2280, 0, { fill: 'url(#setsDexWall)' });
  // badge wall
  m += R(100, 120, 1500, 540, 0, { fill: 'url(#setsBadges)' });
  m += R(92, 112, 1516, 556, 12, { fill: 'none', stroke: '#0E1640', 'stroke-width': 10 });
  // plaque
  m += R(560, 40, 580, 64, 16, ol('#FFD34D', 6)) + T(`BADGES: ${opts.count || '9,999'} / 10,000`, 850, 88, 44, '#2A2246');
  // the empty frame (cover one pattern cell)
  const ex = DEX_EMPTY.x, ey = DEX_EMPTY.y;
  m += R(ex - 32, ey - 32, 64, 64, 0, { fill: '#26357E' });
  if (opts.spot !== false) m += P(`M${ex - 40} -20 L${ex + 40} -20 L${ex + 120} ${ey + 70} L${ex - 120} ${ey + 70} Z`, { fill: '#FFF6C8', opacity: 0.16 }) + E(ex, ey + 4, 110, 80, { fill: '#FFF6C8', opacity: 0.14 });
  m += R(ex - 28, ey - 28, 56, 56, 6, { fill: '#1A2560', stroke: '#FFE14D', 'stroke-width': 5, 'stroke-dasharray': '10 7' });
  if (filled > 0) {
    const sc = ease.outBack(filled);
    m += G(CI(0, 0, 22, ol('#5DCB6A', 4)) + P('M-12 8 L-8 -10 L-4 6 L0 -14 L4 6 L8 -10 L12 8 Z', { fill: '#2E9E4E' }) + CI(-7, -6, 4, { fill: '#FFFFFF', opacity: 0.6 }), tr(ex, ey, sc));
    m += sparkle(ex + 36, ey - 30, 14 * filled) + sparkle(ex - 34, ey + 30, 10 * filled);
  } else m += T('?', ex, ey + 16, 44, '#FFE14D', { opacity: f(0.6 + 0.4 * Math.sin(t * 3)) });
  m += R(ex - 70, ey + 40, 140, 30, 6, ol('#FFF6C8', 4)) + TF('TOUCH GRASS', ex, ey + 62, 17, '#2A2246');
  // NO STAIRS poster (right) + door frame edge
  m += G(R(-110, -150, 220, 300, 10, ol('#FFFFFF', 6)) + P('M-70 70 L-70 40 L-30 40 L-30 10 L10 10 L10 -20 L50 -20 L50 -50 L80 -50', ln(10, '#2A2246')) + CI(0, 10, 92, ln(12, '#E8243C')) + P('M-64 -54 L64 74', ln(12, '#E8243C')) + T('NO STAIRS', 0, -110, 36, '#E8243C') + TF('(no checkpoints)', 0, 124, 20, '#5A6070'), 'translate(1760 360) rotate(3)');
  // LED strip + glow
  m += R(-800, 690, 3520, 10, 5, { fill: '#3FB8FF' }) + R(-800, 676, 3520, 40, 20, { fill: '#3FB8FF', opacity: 0.2 });
  // trophy shelf under the wall
  m += R(100, 740, 1500, 18, 5, ol('#1A2560', 5));
  for (let i = 0; i < 7; i++) {
    const x = 220 + i * 210, gold = i % 3 === 0;
    m += G(P('M-30 0 L-22 -20 L22 -20 L30 0 Z', ol('#3A3F4E', 4)) + P('M-26 -20 Q-30 -70 0 -76 Q30 -70 26 -20 Z', ol(gold ? '#FFD34D' : '#C9D1DD', 5)) + P('M-26 -60 Q-46 -60 -40 -40 M26 -60 Q46 -60 40 -40', ln(5, gold ? '#E8B84A' : '#9AA5B5')), tr(x, 740, 0.9));
  }
  // gaming desk at left: monitors + chair back edge
  m += R(-40, 600, 30, 0) + R(-60, 780, 520, 26, 8, ol('#2C303C', 6)) + P('M-20 806 L-20 930 M420 806 L420 930', ln(14, '#2C303C'));
  m += R(-30, 570, 220, 140, 10, ol('#1A1D26', 6)) + R(-18, 582, 196, 116, 4, { fill: '#1E5FC8' }) + T('GG', 80, 660, 60, '#7CF7FF') + R(70, 710, 40, 70, 4, ol('#1A1D26', 4));
  m += R(210, 560, 240, 160, 10, ol('#1A1D26', 6)) + R(222, 572, 216, 136, 4, { fill: '#2A2246' }) + P('M250 680 L290 640 L330 660 L400 600', ln(6, '#3BE07A')) + R(310, 720, 40, 60, 4, ol('#1A1D26', 4));
  m += G(P('M-40 0 Q-46 -50 0 -54 Q46 -50 40 0', ln(12, '#151515')) + R(-52, -20, 22, 34, 8, ol('#3FB8FF', 4)) + R(30, -20, 22, 34, 8, ol('#3FB8FF', 4)), 'translate(500 760)');
  // floor (carpet)
  m += R(-800, 820, 3520, 600, 0, { fill: '#1E2A66' }) + R(-800, 816, 3520, 14, 3, ol('#2E3E8A', 4)) + E(980, 980, 620, 70, { fill: '#2A3A86' }) + E(980, 980, 520, 50, { fill: 'none', stroke: '#3FB8FF', 'stroke-width': 5, opacity: 0.5 });
  return { bg: '', mid: m, fg: '', light: '' };
}
const dexRoom = makeSet(dexLayers);

// ================================================================= 8d. PORCH — golden sunset (ending)
// House front with a deep porch on the left 3/4, open yard + sunset sky at right. Porch deck front edge y 880:
// stand on the porch at y 870 (FLOOR.porch); two wide steps (top y 920, lower y 970) for sitting — SPOTS.porch.
// opts: { sunset 0..1 (0 golden hour .. 1 sun touching the horizon, pink-purple dusk, porch light on, fireflies),
//   phones (count of phones lying face-down on the top step), swing:false }
function porchLayers(t, opts = {}) {
  const k = clamp(opts.sunset ?? 0, 0, 1);
  // bg: sky, sun, distant hills
  let bg = R(-800, -600, 3520, 2280, 0, { fill: 'url(#setsPorchSky0)' }) + R(-800, -600, 3520, 2280, 0, { fill: 'url(#setsPorchSky1)', opacity: f(k) });
  const sunY = lerp(560, 790, k);
  bg += CI(1680, sunY, 260, { fill: 'url(#setsSunGlow)' }) + CI(1680, sunY, 86, { fill: mix('#FFF2A8', '#FFB45A', k), stroke: mix('#FFD34D', '#FF7A3A', k), 'stroke-width': 6 });
  for (let i = 0; i < 3; i++) { const x = 1300 + i * 220 - ((t * 6) % 400); bg += G(R(-100, -14, 220, 36, 18, { fill: mix('#FFE0B0', '#FF9AB0', k), opacity: 0.8 }), tr(x, 220 + i * 70)); }
  bg += P('M1300 820 Q1450 700 1600 760 Q1760 690 1960 780 L1960 900 L1300 900 Z', { fill: mix('#E8A060', '#7A4A8A', k) });
  bg += P('M1300 860 Q1500 790 1700 830 Q1840 800 1960 830 L1960 920 L1300 920 Z', { fill: mix('#C98A50', '#5A3A6A', k) });
  if (k > 0.5) for (let i = 0; i < 10; i++) bg += CI(1300 + hash(i * 2.1) * 620, 40 + hash(i * 3.7) * 260, 2.5, { fill: '#FFFFFF', opacity: f((k - 0.5) * 2 * (0.5 + 0.5 * Math.sin(t * 2 + i))) });
  // mid: lawn, fence, tree, house + porch
  let m = '';
  m += R(-800, 900, 3520, 400, 0, { fill: mix('#9CCB5A', '#6A8A4A', k) }) + R(-800, 1000, 3520, 300, 0, { fill: mix('#8ABB4A', '#5A7A40', k) });
  let fence = '';
  for (let x = 1470; x < 1960; x += 46) fence += P(`M${x} 920 L${x} 830 L${x + 15} 812 L${x + 30} 830 L${x + 30} 920 Z`, ol(mix('#FFF6E8', '#E8C8D0', k), 4));
  m += R(1460, 856, 520, 14, 3, ol(mix('#FFF6E8', '#E8C8D0', k), 3)) + fence;
  m += R(1800, 560, 34, 360, 8, ol('#6A4A30', 5)) + CI(1818, 520, 120, ol(mix('#5DAA4A', '#3A5A4A', k), 6)) + CI(1740, 570, 80, ol(mix('#5DAA4A', '#3A5A4A', k), 6)) + CI(1890, 580, 80, ol(mix('#5DAA4A', '#3A5A4A', k), 6));
  // house wall (siding)
  m += R(-100, -100, 1560, 1000, 0, { fill: mix('#FFE7C0', '#F2B8A8', k) }) + R(-100, -100, 1560, 1000, 0, { fill: 'url(#setsSiding2)' });
  m += R(1440, -100, 30, 1000, 0, ol(mix('#FFFFFF', '#F4D8D8', k), 5));
  // front door + sconce + window
  m += R(560, 330, 220, 470, 10, ol('#FFFFFF', 7)) + R(578, 348, 184, 452, 6, ol('#2EA39A', 5)) + R(600, 376, 140, 150, 8, { fill: 'none', stroke: '#1E8079', 'stroke-width': 5 }) + R(600, 560, 140, 200, 8, { fill: 'none', stroke: '#1E8079', 'stroke-width': 5 }) + CI(740, 590, 11, ol('#FFD34D', 4));
  m += R(610, 270, 120, 40, 20, ol('#FFFFFF', 5)) + R(626, 278, 88, 24, 12, { fill: mix('#BFE8FF', '#FFC890', k) });
  const lamp = k > 0.55;
  m += R(820, 420, 40, 64, 8, ol('#2C303C', 4)) + R(826, 430, 28, 44, 4, { fill: lamp ? '#FFE9A0' : '#E8E0C8' });
  if (lamp) m += CI(840, 452, 90, { fill: 'url(#setsLampGlow)', opacity: f((k - 0.55) * 2.2) });
  m += R(960, 320, 400, 300, 10, ol('#FFFFFF', 7)) + R(978, 338, 364, 264, 4, { fill: mix('#9FD8FF', '#FFB07A', k) }) + P('M1000 580 L1120 360 L1180 360 L1060 580 Z', { fill: '#FFFFFF', opacity: 0.35 }) + R(1152, 338, 14, 264, 2, { fill: '#FFFFFF' }) + R(940, 610, 440, 22, 6, ol('#FFFFFF', 5));
  m += R(960, 640, 400, 60, 8, ol('#C98A52', 5));
  for (let i = 0; i < 7; i++) m += CI(990 + i * 56, 632, 20, ol(['#FF6FA8', '#FFD34D', '#FF8A4C'][i % 3], 4));
  // porch roof + posts
  m += R(-100, -100, 1580, 150, 0, ol(mix('#E8604A', '#B8405A', k), 7)) + R(-100, 40, 1580, 26, 0, ol('#FFFFFF', 6));
  m += P('M-100 0 L1480 0 M-100 -40 L1480 -40', ln(5, mix('#C84A38', '#94304A', k)));
  // deck + steps
  m += R(-100, 800, 1560, 80, 0, ol(mix('#D9A066', '#B87A6A', k), 6)) + P('M-100 826 L1460 826 M-100 852 L1460 852', ln(3, mix('#B87A44', '#8A5A5A', k)));
  m += R(380, 878, 760, 46, 4, ol(mix('#E3B676', '#C88A7A', k), 6)) + R(340, 920, 840, 50, 4, ol(mix('#D9A066', '#B87A6A', k), 6));
  for (const px of [40, 1400]) m += R(px - 22, 60, 44, 744, 6, ol('#FFFFFF', 6)) + R(px - 32, 780, 64, 26, 6, ol('#FFFFFF', 5));
  // side railing (left) + swing
  m += R(-100, 600, 140, 14, 4, ol('#FFFFFF', 4));
  for (let x = -90; x < 30; x += 30) m += R(x, 614, 10, 186, 3, ol('#FFFFFF', 3));
  if (opts.swing !== false) {
    const sw = Math.sin(t * 1.1) * 6;
    m += P(`M150 66 L${150 + sw} 560 M480 66 L${480 + sw} 560`, ln(4, '#8A7A6A'));
    m += G(R(-180, -100, 360, 100, 14, ol('#B87A44', 6)) + R(-180, 0, 360, 30, 8, ol('#C98A52', 6)) + R(-150, -80, 120, 70, 24, ol('#FF8FB8', 5)) + R(40, -70, 110, 60, 22, ol('#5BC0EB', 5)), tr(315 + sw, 560));
  }
  // potted plants by the steps, welcome mat
  for (const [px, s] of [[300, 1], [1220, 0.9]]) m += G(P('M-40 0 L-34 -70 L34 -70 L40 0 Z', ol('#E8603C', 5)) + P('M0 -70 Q-40 -140 -60 -150 M0 -70 Q0 -160 10 -180 M0 -70 Q40 -130 70 -140', ln(14, '#3FA05A')) + P('M0 -70 Q-40 -140 -60 -150 M0 -70 Q0 -160 10 -180 M0 -70 Q40 -130 70 -140', ln(6, '#7FDB8E')), tr(px, 880, s));
  m += P('M570 800 L770 800 L790 820 L550 820 Z', ol('#C9A06A', 4));
  // phones lying face-down on the top step
  const np = clamp(Math.round(opts.phones || 0), 0, 8);
  for (let i = 0; i < np; i++) { const x = 470 + i * 90 + hash(i) * 20; m += G(R(-30, -8, 60, 14, 5, ol(['#7C5CFF', '#FF6FA8', '#3A3F4E', '#3FBF5A', '#FFB13B'][i % 5], 3.5)) + R(-6, -9, 12, 3, 1, { fill: '#2C303C' }), tr(x, 900, 1, (hash(i * 3) - 0.5) * 16)); }
  // long golden light + shadows
  m += P('M1460 -100 L1960 -100 L1960 1200 L-100 1200 Z', { fill: mix('#FFC860', '#FF7A5A', k), opacity: f(0.1 + 0.06 * k) });
  m += P('M40 800 L-120 880 L-60 880 L62 800 Z M1400 800 L1220 880 L1280 880 L1422 800 Z', { fill: '#5A3020', opacity: 0.18 });
  if (k > 0.6) for (let i = 0; i < 9; i++) {
    const fx = 200 + hash(i * 5.1) * 1600 + Math.sin(t * 0.8 + i) * 40, fy = 700 + hash(i * 3.3) * 260 + Math.cos(t * 1.1 + i * 2) * 30;
    const b = 0.5 + 0.5 * Math.sin(t * 3 + i * 1.7);
    m += CI(fx, fy, 14, { fill: '#FFF26A', opacity: f(0.25 * b * (k - 0.6) * 2.5) }) + CI(fx, fy, 4.5, { fill: '#FFFBC8', opacity: f(b * (k - 0.6) * 2.5) });
  }
  return { bg, mid: m, fg: '', light: k > 0 ? R(-800, -600, 3520, 2280, 0, { fill: '#5A2A6A', opacity: f(0.12 * k) }) : '' };
}
const porch = makeSet(porchLayers);

// ================================================================= 9. EARTH — from space
// Globe centre (960, 560), radius 380 (EARTH). opts: { wave 0..1 (the "NOOOO" shockwave rolls over the globe then
// out into space), night 0..1 (dark globe with city lights), lightsOut 0..1 (city lights switch off, city by city),
// spin (rad/s, default 0.05), r (radius), cx, cy }
const EARTH = { cx: 960, cy: 560, r: 380 };
const CONTS = [
  [[-120, 55], [-95, 62], [-70, 58], [-60, 48], [-78, 40], [-82, 28], [-100, 18], [-112, 25], [-124, 40]],
  [[-80, 10], [-60, 6], [-40, -8], [-48, -30], [-62, -50], [-72, -38], [-78, -14]],
  [[-12, 52], [10, 60], [40, 62], [70, 66], [110, 62], [140, 55], [130, 40], [110, 28], [90, 22], [70, 28], [50, 38], [30, 44], [0, 42]],
  [[-16, 30], [12, 34], [34, 30], [44, 10], [40, -20], [24, -34], [14, -20], [8, 0], [-10, 8]],
  [[114, -14], [140, -12], [152, -26], [140, -38], [118, -32]],
  [[-50, 72], [-20, 76], [-30, 62], [-48, 62]],
];
const CITIES = (() => { const a = []; let i = 0; for (const c of CONTS) { const n = c.length > 7 ? 12 : 6; for (let j = 0; j < n; j++, i++) { const p = c[Math.floor(hash(i * 2.3) * c.length)], q = c[Math.floor(hash(i * 4.1) * c.length)]; const u = 0.25 + 0.5 * hash(i * 6.7); a.push([lerp(p[0], q[0], u) * 0.9 + 0.1 * c[0][0], lerp(p[1], q[1], u) * 0.92]); } } return a; })();
function earth(t = 0, opts = {}) {
  const cx = opts.cx ?? EARTH.cx, cy = opts.cy ?? EARTH.cy, Rr = opts.r ?? EARTH.r;
  const night = clamp(opts.night || 0, 0, 1), out = clamp(opts.lightsOut || 0, 0, 1), wave = clamp(opts.wave || 0, 0, 1);
  const lam0 = t * (opts.spin ?? 0.05);
  const proj = (lon, lat) => {
    let dl = ((lon * Math.PI) / 180 - lam0) % (Math.PI * 2);
    if (dl > Math.PI) dl -= Math.PI * 2; if (dl < -Math.PI) dl += Math.PI * 2;
    const back = Math.abs(dl) > Math.PI / 2;
    if (back) dl = Math.sign(dl) * Math.PI / 2;
    const la = (lat * Math.PI) / 180;
    return [cx + Rr * Math.cos(la) * Math.sin(dl), cy - Rr * Math.sin(la), !back];
  };
  let o = R(-800, -600, 3520, 2280, 0, { fill: '#0B0A26' }) + R(-800, -600, 3520, 2280, 0, { fill: 'url(#setsStars)' });
  for (let i = 0; i < 10; i++) o += P(starD(hash(i * 3.9) * 1920, hash(i * 7.1) * 1080, 10, 3, 4, 0), { fill: '#FFF6C8', opacity: f(0.5 + 0.5 * Math.sin(t * 2 + i)) });
  o += CI(cx, cy, Rr * 1.22, { fill: 'url(#setsAtmo)' });
  // moon + satellite
  o += CI(1660, 190, 56, ol('#E9E4F2', 5)) + CI(1644, 176, 12, { fill: '#C9C2DA' }) + CI(1678, 206, 8, { fill: '#C9C2DA' });
  const sa = t * 0.4;
  const sx = cx + Math.cos(sa) * Rr * 1.35, sy = cy + Math.sin(sa) * Rr * 0.35 - 40;
  if (Math.sin(sa) < 0 || true) o += G(R(-10, -8, 20, 16, 3, ol('#D9DEE6', 3)) + R(-40, -5, 26, 10, 2, ol('#5BC0EB', 2.5)) + R(14, -5, 26, 10, 2, ol('#5BC0EB', 2.5)) + CI(0, -12, 3, { fill: Math.floor(t * 2) % 2 ? '#FF3B4E' : '#5A1020' }), tr(sx, sy, 1.2, 15));
  // globe
  let gl = CI(cx, cy, Rr, { fill: 'url(#setsOcean)' });
  for (const c of CONTS) {
    const pts = c.map(([lo, la]) => proj(lo, la));
    if (!pts.some((p) => p[2])) continue;
    gl += P(S.roundedPath(pts.map((p) => [p[0], p[1]]), 26), { fill: '#5DCB6A', stroke: '#2E8A4A', 'stroke-width': 5, 'stroke-linejoin': 'round' });
  }
  // clouds
  for (let i = 0; i < 6; i++) {
    const lo = i * 60 + t * 3 * 0.9, la = -40 + hash(i * 3.3) * 80;
    const p = proj(lo, la);
    if (!p[2]) continue;
    const sh = Math.max(0.2, Math.cos(((lo * Math.PI) / 180) - lam0));
    gl += G(R(-70, -12, 140, 24, 12, { fill: '#FFFFFF', opacity: 0.85 }) + R(-30, -26, 80, 22, 11, { fill: '#FFFFFF', opacity: 0.85 }), `translate(${f(p[0])} ${f(p[1])}) scale(${f(sh)} 1)`);
  }
  // day/night terminator (right side darker) + extra night
  gl += P(`M${cx} ${cy - Rr} A${Rr} ${Rr} 0 0 1 ${cx} ${cy + Rr} A${f(Rr * 0.42)} ${Rr} 0 0 0 ${cx} ${cy - Rr} Z`, { fill: '#0A1240', opacity: f(0.32 + 0.2 * night) });
  if (night > 0) gl += CI(cx, cy, Rr, { fill: '#0A1240', opacity: f(0.6 * night) });
  // city lights
  if (night > 0) {
    let lights = '';
    CITIES.forEach(([lo, la], i) => {
      const p = proj(lo, la);
      if (!p[2]) return;
      if (hash(i * 9.7 + 1) < out) return;
      const fl = 0.85 + 0.15 * Math.sin(t * 5 + i);
      lights += CI(p[0], p[1], 13, { fill: '#FFD86A', opacity: f(0.28 * night * fl) }) + CI(p[0], p[1], 4.5, { fill: '#FFF4C0', opacity: f(night * fl) });
    });
    gl += lights;
  }
  // shine + rim
  gl += E(cx - Rr * 0.38, cy - Rr * 0.42, Rr * 0.32, Rr * 0.2, { fill: '#FFFFFF', opacity: f(0.18 * (1 - night)), transform: `rotate(-35 ${f(cx - Rr * 0.38)} ${f(cy - Rr * 0.42)})` });
  o += G(gl, null, { 'clip-path': 'url(#setsClipEarth)' });
  o += CI(cx, cy, Rr, { fill: 'none', stroke: LINE, 'stroke-width': 8 }) + CI(cx, cy, Rr - 9, { fill: 'none', stroke: '#9FE2FF', 'stroke-width': 6, opacity: 0.6 });
  // shockwave
  if (wave > 0) {
    if (wave < 0.55) {
      const u = wave / 0.55, rr = Rr * Math.sin(u * Math.PI / 2);
      let w = CI(cx, cy, rr, { fill: '#FFFFFF', opacity: f(0.15 * (1 - u)) }) + CI(cx, cy, rr, { fill: 'none', stroke: '#FFB13B', 'stroke-width': 30 * (1 - u * 0.5), opacity: 0.85 }) + CI(cx, cy, rr, { fill: 'none', stroke: '#FFFFFF', 'stroke-width': 12 });
      o += G(w, null, { 'clip-path': 'url(#setsClipEarth)' });
    } else {
      const u = (wave - 0.55) / 0.45, rr = Rr * (1 + u * 1.5);
      o += CI(cx, cy, rr, { fill: 'none', stroke: '#FFB13B', 'stroke-width': 34 * (1 - u), opacity: f(1 - u) }) + CI(cx, cy, rr, { fill: 'none', stroke: '#FFFFFF', 'stroke-width': 12 * (1 - u), opacity: f(1 - u) });
      for (let i = 0; i < 16; i++) {
        const a = (i / 16) * Math.PI * 2;
        o += P(`M${f(cx + Math.cos(a) * rr * 1.04)} ${f(cy + Math.sin(a) * rr * 1.04)} L${f(cx + Math.cos(a) * (rr * 1.04 + 80))} ${f(cy + Math.sin(a) * (rr * 1.04 + 80))}`, ln(8, '#FFFFFF', f(0.8 * (1 - u))));
      }
    }
  }
  return o;
}

// ================================================================= floor lines + anchors
// FLOOR[set] = default stand line (characters' feet y) in the default 1920x1080 framing.
const FLOOR = {
  attic: 1000,        // wall/floor seam y 790 (one-point perspective; anything with feet y 880..1060 reads as "on the floor")
  atticStairs: 1000,  // hallway floor; on the ladder use atticStairs.at(u)
  livingRoom: 1000,   // in front of the couch; seated on the couch: feet y 908 (s 0.55) + draw layers.seat after them
  newsStudio: 985,    // the anchor's feet (hidden by the desk)
  bathroom: 1000,     // standing in the room; Mom in the tub: SPOTS.bathroom.mom
  classroom: 1000,    // in front of the board; teacher behind his desk: SPOTS.classroom.teacher
  streamerRoom: 1040, // the streamer's feet (hidden by the desk)
  dexRoom: 1000,
  porch: 870,         // on the porch deck (front edge y 880); steps: SPOTS.porch.steps
  elevatorGame: 1000, // in-game avatars (the NPC stands at x 330, y 1000, s 3.4)
};
const SPOTS = {
  attic: {
    wallBase: 790, vp: [960, 560],
    laptop: { x: ATTIC_LAPTOP.x, y: ATTIC_LAPTOP.y, s: ATTIC_LAPTOP.s, screen: { cx: ATTIC_LAPTOP.x, cy: ATTIC_LAPTOP.y - 192 * ATTIC_LAPTOP.s, w: 416 * ATTIC_LAPTOP.s, h: 234 * ATTIC_LAPTOP.s } },
    desk: { x0: 270, x1: 938, top: 588 },        // workbench top surface (props sit at y 588)
    stool: { x: 640, seat: 736 },
    window: { x: 960, y: 250, r: 118 },
    catBed: { x: 190, y: 882 },
    hatch: { x: 1300, y: 902, back: 862, front: 942, x0: 1118, x1: 1491 }, // centre of the hole; Dex climbing out: feet ~ y 1150..1250 at x 1300, then attic.hatchFront()
    juice: { x: 870, y: 585 },
    lights: { y: 133 },
  },
  livingRoom: {
    seat: { x0: 640, x1: 1280, y: 740, feet: 908 }, couch: { x: 960, back: 540 },
    router: { x: ROUTER.x, y: ROUTER.y - 44, shelf: ROUTER.y }, // top of the router box (Buffer lands here)
    tv: { cx: 305, cy: 503, w: 340, h: 190 }, lamp: { x: 1470, y: 380 }, window: { x0: 700, x1: 1220, y0: 130, y1: 520 }, table: { x: 960, top: 904 },
  },
  newsStudio: { anchor: { x: 760, y: 985, s: 0.62 }, screen: { cx: 1460, cy: 350, w: 640, h: 360 }, deskTop: 785 },
  bathroom: { mom: { x: 960, y: 930, s: 0.55 }, tubRim: 646, tray: { y: 700, tablets: [770, 960, 1150] }, window: BATH_WIN },
  classroom: { teacher: { x: 1270, y: 930, s: 0.6 }, board: { x0: 474, y0: 154, x1: 1426, y1: 556 }, deskTop: 742 },
  streamerRoom: { streamer: { x: 960, y: 1040, s: 0.62 }, deskTop: 820, ringLight: { x: 260, y: 380 } },
  dexRoom: { emptyFrame: DEX_EMPTY, wall: { x0: 100, y0: 120, x1: 1600, y1: 660 } },
  porch: { deck: 870, steps: [{ y: 920, x0: 380, x1: 1140 }, { y: 970, x0: 340, x1: 1180 }], door: { x: 670, y: 800 }, sun: { x: 1680 } },
  elevatorGame: { npc: { x: 330, y: 1000, s: 3.4 }, doors: { x0: 640, x1: 1280, y0: 250, y1: 900 }, indicator: { x: 960, y: 197 }, panel: { x: 1381, y: 540 } },
  bubbleIsland: { islands: BUB.map((b) => ({ x: b.x, y: b.y, r: b.r, top: b.top })) },
  earth: EARTH,
  atticStairs: { ladder: LAD },
};

module.exports = {
  DEFS, attic, laptop, bubbleIsland, livingRoom, pipBox, elevatorGame, newsStudio, screens, bathroom, classroom, streamerRoom, dexRoom, porch, earth,
  FLOOR, SPOTS,
  // extras
  atticStairs, cat, avatar, router, newspaper, juiceBox, frameIn, SCREEN_BOX, LAPTOP_SCREEN, spinner, lagBlocks, desat, mix,
};

