// THE TOWN FAIR — background sets of "What If You Could See Everyone's STATS in Real Life?" (SC08–SC10).   Reference: docs/SETS_FAIR.md
//
// A small-town carnival at dusk: candy-striped tents and food stalls, the Ferris wheel, the giant teacups, string lights,
// balloons, a game booth, Grandpa's bench under a lamp and THE GIANT INFLATABLE DINOSAUR (Max ends up on its head).
// Cut-out style: bold #151515 outlines, flat colours, one light + one shade per part. Static gradients/patterns live in DEFS
// (ids `sf*`; scenes/main.js loads it automatically).
//
// CAMERA sets: set(t, cam, o) -> svg;  set.layers(t, cam, o) -> { bg, mid, front, crowd, fg, light } ALREADY transformed by
//   cam ({ zoom, x, y, fx, fy, sx, sy } as from K.camKeys / K.shake). Every sub-layer has its own parallax k.
//   Draw order:  L.bg + L.mid + <characters BEHIND front occluders> + L.front + <characters on the stand lines>
//                + L.crowd (packed crowd rows in FRONT of the stand line) + L.fg + L.light.      String(L) = all layers.
// ROOM set fairBench(t, o): world-space layers (no camera) + compose(t, o, behind, onFloor, cam).
// Common options: time 'afternoon'|'dusk'|'golden' (or weights {dusk: .5, golden: .5}), lights 0..1, crowd 0..1, quiet 0..1
//   (HUD-off silence: the crowd desaturates), cheer 0..1, wobble 0..1 (the dinosaur), flash 0..1. Values 0..1 animate: ease
//   them yourself. t (absolute seconds) only drives idle motion (wheel, teacups, bulbs, balloons, crowd bob, dino wobble).
// FLOOR[set] = feet line of the main stand line; SPOTS[set] = anchors ({x, y, k, s}); SPOTS[set].lines = crowd stand lines
//   (back -> front, {y, k, s, x0, x1, gaps}); SPOTS[set].cams = ready framings. Helpers: placeCrowd, crowdHeads, camAt, toScreen.
//
// Index:
//   fair(t, cam, o)          the long fair world (arch, bench, game booth, balloons, Ferris wheel, cotton candy, teacups, dinosaur)
//   fairBench(t, o)          close two-shot of Grandpa's bench under the lamp, bokeh carnival behind (room set)
//   dinoTop(t, cam, o)       close framing on the inflatable dinosaur's head + neck (Max on top, hero climbing, crowd below)
//   fairEntrance(t, cam, o)  the family arriving under the TOWN FAIR arch
'use strict';

const S = require('../rig/svg');
const { f, clamp, lerp, ease } = S;

const LINE = '#151515';
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const R = (x, y, w, h, r = 0, a = {}) => S.rect(f(x), f(y), f(Math.max(0, w)), f(Math.max(0, h)), r ? f(r) : 0, a);
const P = (d, a = {}) => (d ? S.path(d, a) : '');
const E = (cx, cy, rx, ry, a = {}) => S.ellipse(f(cx), f(cy), f(Math.max(0, rx)), f(Math.max(0, ry)), a);
const CI = (cx, cy, r, a = {}) => S.circle(f(cx), f(cy), f(Math.max(0, r)), a);
const G = (inner, tf, extra) => (inner ? S.g(inner, tf, extra) : '');
const T = (s, x, y, size, fill, extra = {}) => S.el('text', { x: f(x), y: f(y), 'font-family': 'Lilita One, sans-serif', 'font-size': f(size), fill, 'text-anchor': 'middle', ...extra }, esc(s));
const TF = (s, x, y, size, fill, extra = {}) => S.el('text', { x: f(x), y: f(y), 'font-family': 'Fredoka, sans-serif', 'font-weight': 700, 'font-size': f(size), fill, 'text-anchor': 'middle', ...extra }, esc(s));
const OUTX = (w = 8, col = LINE) => ({ stroke: col, 'stroke-width': f(w), 'paint-order': 'stroke', 'stroke-linejoin': 'round' });
const hash = (n) => { const v = Math.sin(n * 127.1 + 311.7) * 43758.5453; return v - Math.floor(v); };
const md = (a, n) => ((a % n) + n) % n;
const b01 = (v, d = 0) => (v === true ? 1 : v === false || v === undefined || v === null ? d : clamp(+v, 0, 1));
const tr = (x, y, s = 1, r = 0) => `translate(${f(x)} ${f(y)})${r ? ` rotate(${f(r)})` : ''}${s !== 1 ? ` scale(${f(s)})` : ''}`;
const op = (v) => f(clamp(v, 0, 1));
const TAU = Math.PI * 2;

// path-data builders (batch many shapes of one style into ONE <path>)
const dR = (x, y, w, h) => `M${f(x)} ${f(y)}h${f(w)}v${f(h)}h${f(-w)}Z`;
function dRR(x, y, w, h, r) {
  r = Math.max(0, Math.min(r, w / 2, h / 2));
  if (!r) return dR(x, y, w, h);
  const a = `a${f(r)} ${f(r)} 0 0 1`;
  return `M${f(x + r)} ${f(y)}h${f(w - 2 * r)}${a} ${f(r)} ${f(r)}v${f(h - 2 * r)}${a} ${f(-r)} ${f(r)}h${f(-(w - 2 * r))}${a} ${f(-r)} ${f(-r)}v${f(-(h - 2 * r))}${a} ${f(r)} ${f(-r)}Z`;
}
const dC = (cx, cy, r) => `M${f(cx - r)} ${f(cy)}a${f(r)} ${f(r)} 0 1 1 ${f(2 * r)} 0a${f(r)} ${f(r)} 0 1 1 ${f(-2 * r)} 0Z`;
const dE = (cx, cy, rx, ry) => `M${f(cx - rx)} ${f(cy)}a${f(rx)} ${f(ry)} 0 1 1 ${f(2 * rx)} 0a${f(rx)} ${f(ry)} 0 1 1 ${f(-2 * rx)} 0Z`;
const dP = (pts) => 'M' + pts.map(([x, y]) => `${f(x)} ${f(y)}`).join('L') + 'Z';
const dL = (pts) => 'M' + pts.map(([x, y]) => `${f(x)} ${f(y)}`).join('L');
// smooth closed / open curves through points (Catmull-Rom -> cubic Bézier)
function dSmooth(pts, closed = true, k = 1) {
  const n = pts.length;
  const at = (i) => (closed ? pts[md(i, n)] : pts[clamp(i, 0, n - 1)]);
  let d = `M${f(pts[0][0])} ${f(pts[0][1])}`;
  for (let i = 0; i < (closed ? n : n - 1); i++) {
    const p0 = at(i - 1), p1 = at(i), p2 = at(i + 1), p3 = at(i + 2);
    d += `C${f(p1[0] + ((p2[0] - p0[0]) / 6) * k)} ${f(p1[1] + ((p2[1] - p0[1]) / 6) * k)} ${f(p2[0] - ((p3[0] - p1[0]) / 6) * k)} ${f(p2[1] - ((p3[1] - p1[1]) / 6) * k)} ${f(p2[0])} ${f(p2[1])}`;
  }
  return d + (closed ? 'Z' : '');
}
// points of a hanging string between two points (sag d at the middle)
const sagPts = (x0, y0, x1, y1, d, n = 12) => Array.from({ length: n + 1 }, (_, i) => { const u = i / n; return [lerp(x0, x1, u), lerp(y0, y1, u) + 4 * d * u * (1 - u)]; });

// ---------------------------------------------------------------- colour
const hx = (c) => [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)];
const toHex = (a) => '#' + a.map((v) => Math.round(clamp(v, 0, 255)).toString(16).padStart(2, '0')).join('').toUpperCase();
function mix(a, b, k) {
  if (k <= 0) return a;
  if (k >= 1) return b;
  const em = a[0] === '!';
  if (em) a = a.slice(1);
  if (b[0] === '!') b = b.slice(1);
  const A = hx(a), B = hx(b);
  return (em ? '!' : '') + toHex(A.map((v, i) => lerp(v, B[i], k)));
}
const lt = (c, k = 0.3) => mix(c, '#FFFFFF', k);
const dk = (c, k = 0.25) => mix(c, '#2A1838', k);
// a fill that glows when lit: the toned base colour blended toward an emissive (never-toned) colour by k
const litFill = (tn, base, litCol, k) => (k > 0.02 ? mix(tn.c(base), litCol.replace('!', ''), clamp(k, 0, 1)) : tn.c(base));

// the fair palette
const C = {
  red: '#EE3B4C', cherry: '#D92E5A', orange: '#FF8A2E', tangerine: '#FF7A3A', yellow: '#FFD23F', butter: '#FFE68A', lime: '#A6E05A',
  mint: '#5FE0B8', teal: '#22B4BE', sky: '#5CC6F2', blue: '#4A72E6', navy: '#2B2F6B', purple: '#8E5CE6', lilac: '#C9A6FF', pink: '#FF6FAE',
  bubble: '#FFB3D6', cream: '#FFF4DE', white: '#FFFDF6', wood: '#C98A4E', woodD: '#9C6235', woodL: '#E0A868', iron: '#2E3448', ironL: '#4A5370',
  steel: '#C7CEDC', steelD: '#9099AE', sand: '#EAC594', sandD: '#D6A874', grass: '#73C255', grassD: '#4FA142', ink: '#2A2246',
};
const STRIPES = [[C.red, C.white], [C.teal, C.white], [C.yellow, C.red], [C.purple, C.butter], [C.pink, C.white], [C.blue, C.yellow], [C.orange, C.cream], [C.mint, C.white]];
const BULBS_LIT = ['!#FFF2B8', '!#FFC14D', '!#FF7AB8', '!#8AEBFF', '!#C6FF86'];
const BULBS_OFF = ['#F4EEDC', '#F2D7A4', '#F2C4D8', '#CDEAF2', '#DDEFC8'];

// tone(o) -> colour transformer for one frame. Every fill goes through tn.c(col): afternoon (base colours), dusk (purple-
// rose evening), golden (warm reunion light), desat (quiet / HUD-off silence), dim, haze (distance fade toward hazeCol).
// '!#RRGGBB' = emissive (bulbs, lit signs, lamps): never toned (only the quiet desaturation touches it a little).
function tone(o = {}) {
  const du = o.dusk || 0, go = o.golden || 0, ds = o.desat || 0, dim = o.dim || 0, hz = o.haze || 0;
  const H = hz ? hx(o.hazeCol || '#A88BC8') : null;
  const cache = new Map();
  const c = (col) => {
    if (typeof col !== 'string' || col[0] === 'u' || col === 'none') return col;
    let v = cache.get(col);
    if (v) return v;
    const em = col[0] === '!';
    const raw = em ? col.slice(1) : col;
    if (raw[0] !== '#' || raw.length !== 7) return raw;
    let [r, g, b] = hx(raw);
    if (!em) {
      if (du) { r = lerp(r, r * 0.8 + 22, du); g = lerp(g, g * 0.62 + 14, du); b = lerp(b, b * 0.72 + 40, du); }
      if (go) { r = lerp(r, r * 0.9 + 30, go); g = lerp(g, g * 0.78 + 18, go); b = lerp(b, b * 0.6 + 8, go); }
      if (dim) { r *= 1 - 0.4 * dim; g *= 1 - 0.42 * dim; b *= 1 - 0.3 * dim; }
      if (hz) { r = lerp(r, H[0], hz); g = lerp(g, H[1], hz); b = lerp(b, H[2], hz); }
    }
    if (ds) { const y = 0.3 * r + 0.59 * g + 0.11 * b, k = em ? ds * 0.4 : ds; r = lerp(r, y * 1.0, k); g = lerp(g, y * 0.98, k); b = lerp(b, y * 1.06, k); }
    v = toHex([r, g, b]);
    cache.set(col, v);
    return v;
  };
  const lw = o.lw ?? 1;
  const line = o.line || (hz > 0.25 ? mix(LINE, o.hazeCol || '#A88BC8', hz * 0.6) : LINE);
  const ol = (fill, w = 6, extra) => ({ fill: c(fill), stroke: line, 'stroke-width': f(w * lw), 'stroke-linejoin': 'round', 'stroke-linecap': 'round', ...extra });
  const ln = (w, col = LINE, o2) => ({ fill: 'none', stroke: col === LINE ? line : c(col), 'stroke-width': f(col === LINE ? w * lw : w), 'stroke-linecap': 'round', 'stroke-linejoin': 'round', ...(o2 !== undefined ? { opacity: op(o2) } : {}) });
  const fl = (col, o2) => (o2 === undefined ? { fill: c(col) } : { fill: c(col), opacity: op(o2) });
  return { c, ol, ln, fl, line, lw, dusk: du, golden: go, o };
}
// time option -> weights {afternoon, dusk, golden} (sum 1). time: 'afternoon'|'dusk'|'golden' or {dusk: .4, golden: .6}
function timeW(o = {}, def = 'dusk') {
  const t = o.time ?? def;
  let w = typeof t === 'string' ? { afternoon: 0, dusk: 0, golden: 0, [t in { afternoon: 1, dusk: 1, golden: 1 } ? t : def]: 1 } : { afternoon: t.afternoon || 0, dusk: t.dusk || 0, golden: t.golden || 0 };
  const sum = w.afternoon + w.dusk + w.golden || 1;
  return { afternoon: w.afternoon / sum, dusk: w.dusk / sum, golden: w.golden / sum };
}
// the shared per-frame state of a set: weights, tones (main / far haze), lights, quiet
function frameState(o, def = 'dusk') {
  const w = timeW(o, def);
  const lights = o.lights ?? clamp(w.dusk + w.golden * 0.6, 0, 1);
  const quiet = b01(o.quiet);
  const hazeCol = mix(mix('#BFD8F0', '#9A7CC0', w.dusk), '#F2C29A', w.golden);
  const base = { dusk: w.dusk * 0.88, golden: w.golden * 0.9, desat: quiet * 0.35 };
  return {
    w, lights, quiet, hazeCol,
    tn: tone(base),
    tnFar: (h) => tone({ ...base, haze: h, hazeCol }),
    tnCrowd: tone({ ...base, dusk: base.dusk * 0.8, desat: quiet * 0.78, dim: quiet * 0.12 }),
  };
}

// ---------------------------------------------------------------- static defs
const DEF = [];
const def = (s) => { DEF.push(s); };
const lg = (id, stops, x2 = 0, y2 = 1, extra = '') => `<linearGradient id="${id}" x1="0" y1="0" x2="${x2}" y2="${y2}"${extra}>${stops.map(([o, c, a]) => `<stop offset="${o}" stop-color="${c}"${a !== undefined ? ` stop-opacity="${a}"` : ''}/>`).join('')}</linearGradient>`;
const rg = (id, stops, extra = '') => `<radialGradient id="${id}"${extra}>${stops.map(([o, c, a]) => `<stop offset="${o}" stop-color="${c}"${a !== undefined ? ` stop-opacity="${a}"` : ''}/>`).join('')}</radialGradient>`;
const pat = (id, w, h, inner, extra = '') => `<pattern id="${id}" width="${w}" height="${h}" patternUnits="userSpaceOnUse"${extra}>${inner}</pattern>`;

def(pat('sfStars', 610, 430, '<rect x="30" y="34" width="5" height="5" fill="#FFF" opacity="0.9"/><rect x="170" y="18" width="4" height="4" fill="#FFF" opacity="0.65"/><rect x="118" y="124" width="4" height="4" fill="#FFF4C8" opacity="0.8"/><rect x="286" y="190" width="3" height="3" fill="#FFF" opacity="0.7"/><rect x="64" y="236" width="3" height="3" fill="#FFF" opacity="0.5"/><rect x="420" y="60" width="4" height="4" fill="#FFF" opacity="0.75"/><rect x="560" y="150" width="3" height="3" fill="#FFF" opacity="0.6"/><rect x="380" y="300" width="4" height="4" fill="#FFF4C8" opacity="0.7"/><rect x="200" y="380" width="3" height="3" fill="#FFF" opacity="0.5"/><rect x="520" y="390" width="4" height="4" fill="#FFF" opacity="0.6"/><rect x="20" y="330" width="3" height="3" fill="#FFF" opacity="0.6"/><path d="M250 76 l3 -10 l3 10 l10 3 l-10 3 l-3 10 l-3 -10 l-10 -3 Z" fill="#FFF" opacity="0.85"/><path d="M480 236 l2.4 -8 l2.4 8 l8 2.4 l-8 2.4 l-2.4 8 l-2.4 -8 l-8 -2.4 Z" fill="#FFF" opacity="0.7"/><path d="M110 300 l2 -7 l2 7 l7 2 l-7 2 l-2 7 l-2 -7 l-7 -2 Z" fill="#FFF4C8" opacity="0.6"/>'));
// light: small radial glows only (r <= ~300)
def(rg('sfGlowWarm', [[0, '#FFF0B8', 0.9], [0.4, '#FFC867', 0.34], [1, '#FFB040', 0]]));
def(rg('sfGlowPink', [[0, '#FFD6EC', 0.85], [0.4, '#FF7AC0', 0.3], [1, '#FF4FA8', 0]]));
def(rg('sfGlowCyan', [[0, '#D6FFFF', 0.85], [0.4, '#6FE6FF', 0.3], [1, '#3AC8FF', 0]]));
def(rg('sfGlowGold', [[0, '#FFF6CC', 0.95], [0.4, '#FFD45A', 0.42], [1, '#FFB020', 0]]));
def(rg('sfGlowWhite', [[0, '#FFFFFF', 0.95], [0.45, '#FFFFFF', 0.3], [1, '#FFFFFF', 0]]));
def(lg('sfLampCone', [[0, '#FFE9A8', 0.42], [1, '#FFE9A8', 0]]));
def(lg('sfRay', [[0, '#FFF1C0', 0.0], [0.25, '#FFE8A8', 0.5], [1, '#FFD890', 0]], 1, 0));
def(lg('sfFloorFade', [[0, '#1A0E2E', 0], [1, '#1A0E2E', 0.32]]));
def(lg('sfGlass', [[0, '#FFFFFF', 0.55], [0.5, '#FFFFFF', 0]], 1, 1));
// textures (semi-transparent: they work on any toned colour)
def(pat('sfGrassTex', 90, 50, '<path d="M10 36 l5 -14 l5 14 M52 22 l4 -11 l4 11" stroke="#1E6A30" stroke-width="3" fill="none" opacity="0.25" stroke-linejoin="round"/><rect x="72" y="34" width="6" height="6" rx="3" fill="#FFF" opacity="0.2"/>'));
def(pat('sfPolka', 60, 60, '<circle cx="15" cy="15" r="7" fill="#FFF" opacity="0.5"/><circle cx="45" cy="45" r="7" fill="#FFF" opacity="0.5"/>'));
def(pat('sfPolkaS', 36, 36, '<circle cx="9" cy="9" r="4.5" fill="#FFF" opacity="0.55"/><circle cx="27" cy="27" r="4.5" fill="#FFF" opacity="0.55"/>'));
def(pat('sfPlank', 200, 50, '<rect width="200" height="50" fill="none" stroke="#000" stroke-width="4" opacity="0.12"/><line x1="100" y1="0" x2="100" y2="25" stroke="#000" stroke-width="4" opacity="0.12"/>'));
def(pat('sfWinLit', 40, 46, '<rect x="9" y="9" width="20" height="24" fill="#FFE07A"/>'));

// ---------------------------------------------------------------- camera helpers (same conventions as scenes/env.js)
function camTf(cam = {}, k = 1) {
  cam = cam || {};
  const z = 1 + ((cam.zoom ?? 1) - 1) * k;
  const fx = cam.fx ?? 960, fy = cam.fy ?? 540;
  const x = (cam.x || 0) * k, y = (cam.y || 0) * k;
  return `translate(${f(fx + (cam.sx || 0))} ${f(fy + (cam.sy || 0))}) scale(${f(z)}) translate(${f(-fx - x)} ${f(-fy - y)})`;
}
const V = (cam, svg, k) => (svg ? S.g(svg, camTf(cam || {}, k)) : '');
// visible world rectangle of a layer with parallax k
function vis(cam = {}, k = 1) {
  cam = cam || {};
  const z = 1 + ((cam.zoom ?? 1) - 1) * k;
  const fx = cam.fx ?? 960, fy = cam.fy ?? 540, sx = cam.sx || 0, sy = cam.sy || 0;
  const x = (cam.x || 0) * k, y = (cam.y || 0) * k;
  return { x0: fx + x - (fx + sx) / z, x1: fx + x + (1920 - fx - sx) / z, y0: fy + y - (fy + sy) / z, y1: fy + y + (1080 - fy - sy) / z, z };
}
// screen position of a layer point {x, y, k} seen through cam (also toScreen(cam, x, y, k))
function toScreen(cam, a, y, k) {
  if (typeof a === 'number') a = { x: a, y, k: k ?? 1 };
  cam = cam || {};
  const kk = a.k ?? 1, z = 1 + ((cam.zoom ?? 1) - 1) * kk, fx = cam.fx ?? 960, fy = cam.fy ?? 540;
  return { x: fx + (cam.sx || 0) + z * (a.x - fx - (cam.x || 0) * kk), y: fy + (cam.sy || 0) + z * (a.y - fy - (cam.y || 0) * kk), z };
}
// a cam that puts world point (x, y) of the k 1 plane at screen (sx, sy) with this zoom
const camAt = (x, y, zoom = 1, sx = 960, sy = 540) => ({ x: Math.round(x - 960 - (sx - 960) / zoom), y: Math.round(y - 540 - (sy - 540) / zoom), zoom });
// layers object whose String() is the whole picture
function layersOf(bg = '', mid = '', front = '', crowd = '', fg = '', light = '', extra = {}) {
  const o = { bg, mid, front, crowd, fg, light, ...extra };
  Object.defineProperty(o, 'toString', { value() { return this.bg + this.mid + this.front + this.crowd + this.fg + this.light; }, enumerable: false });
  return o;
}
function camSet(layersFn) {
  const fn = (t = 0, cam = {}, o = {}) => String(layersFn(t, cam || {}, o || {}));
  fn.layers = (t = 0, cam = {}, o = {}) => layersFn(t, cam || {}, o || {});
  return fn;
}
function roomSet(layersFn, bgK = 0.6) {
  const fn = (t = 0, o = {}) => String(layersFn(t, o || {}));
  fn.layers = (t = 0, o = {}) => layersFn(t, o || {});
  fn.compose = (t = 0, o = {}, behind = '', onFloor = '', cam = null) => {
    const L = layersFn(t, o || {});
    const v = (s, k) => (cam ? V(cam, s, k) : s);
    return v(L.bg, bgK) + v(L.mid, 1) + v(behind, 1) + v(L.front, 1) + v(onFloor, 1) + v(L.crowd, 1) + v(L.fg, 1.15) + L.light;
  };
  return fn;
}
// spread n crowd members along a stand line {y, k, s, x0, x1, gaps}: [{x, y, s, k, flip, i}] (sorted back -> front)
function placeCrowd(line, n, seed = 1, o = {}) {
  const out = [];
  if (!line || n <= 0) return out;
  const x0 = o.x0 ?? line.x0, x1 = o.x1 ?? line.x1, gaps = o.gaps || line.gaps || [];
  const step = (x1 - x0) / n;
  for (let i = 0; i < n; i++) {
    const x = x0 + step * (i + 0.5) + (hash(i * 3.1 + seed) - 0.5) * step * 0.6;
    if (gaps.some(([a, b]) => x > a && x < b)) continue;
    const dy = (hash(i * 7.7 + seed) - 0.5) * (line.jitter ?? 16);
    const y = Math.round(line.y + dy);
    out.push({ x: Math.round(x), y, s: line.sAt ? line.sAt(y) : line.s, k: line.k ?? 1, flip: hash(i * 5.3 + seed) > 0.5, i });
  }
  return out.sort((a, b) => a.y - b.y);
}
const rs = (v) => Math.round(v * 1000) / 1000;
const glow = (x, y, r, id = 'sfGlowWarm', o_ = 1) => (o_ > 0.003 ? CI(x, y, r, { fill: `url(#${id})`, opacity: op(o_) }) : '');

// ================================================================= SKY + FAR LAYERS (shared by the camera sets)
// skies: the screen-fixed k 0 layer as flat stepped bands (a full-frame gradient costs ~15 ms; 30 flat bands ~1 ms and
// read as a stylised sunset). Stops: [u 0..1 over screen y -80..1180, colour]. The horizon glow sits around y 600-760.
const SKY_STOPS = {
  afternoon: [[0, '#3C8DF0'], [0.45, '#7CC4F6'], [0.72, '#BFE4F8'], [0.88, '#FFE9C6'], [1, '#FFE2B0']],
  dusk: [[0, '#1B1248'], [0.22, '#3A2470'], [0.44, '#7A3A8E'], [0.6, '#C9527F'], [0.72, '#F27A6E'], [0.84, '#FFA766'], [1, '#FFC88A']],
  golden: [[0, '#5868D6'], [0.26, '#A48CDA'], [0.46, '#F49AA6'], [0.62, '#FFB27E'], [0.78, '#FFCF86'], [1, '#FFE9AE']],
};
function stopCol(stops, u) {
  if (u <= stops[0][0]) return stops[0][1];
  for (let i = 1; i < stops.length; i++) if (u <= stops[i][0]) return mix(stops[i - 1][1], stops[i][1], (u - stops[i - 1][0]) / (stops[i][0] - stops[i - 1][0]));
  return stops[stops.length - 1][1];
}
function skyCol(w, u) {
  let c = null, acc = 0;
  for (const k of ['afternoon', 'dusk', 'golden']) { if (w[k] <= 0.001) continue; acc += w[k]; const ck = stopCol(SKY_STOPS[k], u); c = c ? mix(c, ck, w[k] / acc) : ck; }
  return c || stopCol(SKY_STOPS.dusk, u);
}
function sky(v, st) {
  const { w } = st, N = 30, y0 = -80, h = 1260 / N, x0 = v.x0 - 200, wd = v.x1 - v.x0 + 400;
  let s = R(x0, v.y0 - 400, wd, 1260 + 800 + Math.max(0, v.y1 - 1180), 0, { fill: skyCol(w, 1) }) + R(x0, Math.min(y0, v.y0) - 400, wd, Math.max(0, y0 - v.y0) + 401, 0, { fill: skyCol(w, 0) });
  for (let i = 0; i < N - 1; i++) s += R(x0, y0 + i * h, wd, h + 1, 0, { fill: skyCol(w, (i + 0.5) / N) });
  if (w.dusk > 0.05) s += R(x0, -80, wd, 520, 0, { fill: 'url(#sfStars)', opacity: op(w.dusk * 0.85) });
  return s;
}
// ground specks (dirt, popcorn, confetti) over a visible box — replaces a full-frame pattern (~17 ms) with a few paths
function specks(x0, x1, y0, y1, tn, seed = 0, cell = 130) {
  let dkd = '', ltd = '', cfd = '';
  for (let j = Math.floor(y0 / (cell * 0.6)); j * cell * 0.6 < y1; j++) for (let i = Math.floor(x0 / cell); i * cell < x1; i++) {
    const h = hash(i * 7.31 + j * 13.7 + seed), x = i * cell + cell * hash(i * 3.1 + j * 1.7 + seed), y = j * cell * 0.6 + cell * 0.6 * hash(i * 5.9 + j * 2.3 + seed);
    if (h < 0.42) dkd += dR(x, y, 10, 6); else if (h < 0.72) ltd += dR(x, y, 7, 7); else if (h < 0.8) cfd += dR(x, y, 12, 5);
  }
  return P(dkd, { fill: '#7A4A2A', opacity: 0.16 }) + P(ltd, { fill: '#FFFFFF', opacity: 0.26 }) + P(cfd, { fill: tn.c(C.pink), opacity: 0.4 });
}
// sun (k .02) per time: high in the afternoon, low gold, half-set at dusk; flat concentric halo discs (no big gradients)
function sunDisc(st) {
  const { w } = st;
  const x = 1500 * w.afternoon + 1420 * w.golden + 1330 * w.dusk, y = 150 * w.afternoon + 500 * w.golden + 660 * w.dusk;
  const r = 70 * w.afternoon + 92 * w.golden + 118 * w.dusk;
  const col = mix(mix('#FFF4C0', '#FFE08A', w.golden), '#FFB070', w.dusk);
  let s = '';
  [[3, 0.16], [1.7, 0.22]].forEach(([k, a]) => { s += CI(x, y, r * k, { fill: col, opacity: op(a * (0.7 + 0.3 * w.dusk)) }); });
  s += CI(x, y, r, { fill: mix(col, '#FFFFFF', 0.45) });
  return s;
}
function moon(st) {
  if (st.w.dusk < 0.05) return '';
  return G(CI(0, 0, 34, { fill: '#FFF6DA' }) + CI(14, -8, 30, { fill: st.tn.c('#3A2470') }), tr(380, 130), { opacity: op(st.w.dusk) });
}
// long soft dusk clouds (k .04)
function clouds(v, st, t) {
  const { w } = st;
  const col = mix(mix('#FFFFFF', '#F0A0B8', w.dusk), '#FFE2C8', w.golden), under = mix(mix('#D8ECFF', '#B76A9E', w.dusk), '#F2B490', w.golden);
  let a = '', b = '';
  for (let i = Math.floor((v.x0 - 900) / 820); i * 820 < v.x1 + 900; i++) {
    if (hash(i * 3.7) < 0.35) continue;
    const x = i * 820 + md(hash(i * 1.9) * 400 + t * 6, 820), y = 140 + 300 * hash(i * 5.1), s = 0.6 + 0.6 * hash(i * 2.3);
    a += dRR(x, y, 420 * s, 46 * s, 23 * s) + dRR(x + 70 * s, y - 34 * s, 200 * s, 50 * s, 25 * s);
    b += dRR(x + 30 * s, y + 30 * s, 400 * s, 18 * s, 9 * s);
  }
  return P(b, { fill: under, opacity: 0.75 }) + P(a, { fill: col, opacity: 0.85 });
}
// far hills + the town on them (k .12): rolling silhouette, houses, a water tower, a church steeple; lit windows at dusk
function farTown(v, st, t, base = 700) {
  const tn = st.tnFar(0.55), lit = st.lights;
  const x0 = Math.floor((v.x0 - 400) / 120) * 120, x1 = v.x1 + 400;
  let hill = `M${f(x0)} ${f(base + 400)}`;
  for (let x = x0; x <= x1; x += 120) hill += `L${f(x)} ${f(base - 60 - 55 * Math.sin(x * 0.0021) - 35 * Math.sin(x * 0.0057 + 1))}`;
  hill += `L${f(x1)} ${f(base + 400)}Z`;
  let s = P(hill, tn.fl('#7A86B8'));
  let houses = '', roofs = '', wins = '';
  for (let i = Math.floor(x0 / 150); i * 150 < x1; i++) {
    if (hash(i * 4.3) < 0.3) continue;
    const x = i * 150 + 40 * hash(i), hy = base - 40 - 55 * Math.sin(x * 0.0021) - 35 * Math.sin(x * 0.0057 + 1) + 30;
    const w = 70 + 40 * hash(i * 2.1), h = 40 + 40 * hash(i * 3.3);
    houses += dR(x, hy - h, w, h + 30);
    roofs += dP([[x - 8, hy - h], [x + w / 2, hy - h - 30 - 10 * hash(i)], [x + w + 8, hy - h]]);
    if (lit > 0.05 && hash(i * 9.1) > 0.35) wins += dR(x + w * 0.25, hy - h + 12, 12, 14) + (hash(i * 7.7) > 0.5 ? dR(x + w * 0.62, hy - h + 12, 12, 14) : '');
  }
  s += P(houses, tn.fl('#8F98C8')) + P(roofs, tn.fl('#6C74A6'));
  if (wins) s += P(wins, { fill: '#FFD878', opacity: op(0.85 * lit) });
  // water tower + steeple landmarks
  const lm = (x, inner) => (x > v.x0 - 300 && x < v.x1 + 300 ? inner : '');
  s += lm(-620, P('M-680 640 L-650 520 L-590 520 L-560 640 M-670 600 L-570 560 M-570 600 L-670 560', tn.ln(6, '#6C74A6')) + P(dRR(-700, 440, 160, 90, 30), tn.fl('#8F98C8')) + P(dP([[-700, 446], [-620, 400], [-540, 446]]), tn.fl('#6C74A6')));
  s += lm(1720, P(dR(1690, 500, 60, 140) + dP([[1684, 500], [1720, 380], [1756, 500]]), tn.fl('#8F98C8')) + R(1712, 340, 16, 50, 0, tn.fl('#6C74A6')) + R(1704, 352, 32, 10, 0, tn.fl('#6C74A6')));
  return s;
}
// tree line (k .3): rounded blobs + trunks, hazed
function treeLine(v, st, base = 720, seed = 3) {
  const tn = st.tnFar(0.36);
  let blobs = '', dark = '';
  for (let i = Math.floor((v.x0 - 300) / 110); i * 110 < v.x1 + 300; i++) {
    const x = i * 110 + 40 * hash(i * 1.3 + seed), r = 70 + 50 * hash(i * 2.9 + seed), h = 40 + 70 * hash(i * 5.3 + seed);
    blobs += dC(x, base - h - r * 0.6, r) + dC(x + r * 0.6, base - h - r * 0.2, r * 0.75);
    dark += dR(x - 10, base - h, 20, h + 40);
  }
  return P(dark, tn.fl('#4A3E5E')) + P(blobs, tn.fl('#4E8C6A')) + R(v.x0 - 300, base - 20, v.x1 - v.x0 + 600, 1000, 0, tn.fl('#5B8A62'));
}

// ================================================================= STRING LIGHTS + BUNTING (batched)
// acc = lightsAcc(tn, lit, t); acc.string(x0, y0, x1, y1, sag, step, r, seed); ...; acc.out(wireW)
function lightsAcc(tn, lit, t, cols = BULBS_LIT, offCols = BULBS_OFF) {
  const wire = [], bulbs = new Map(), halo = [[], []];
  const add = (col, d) => bulbs.set(col, (bulbs.get(col) || '') + d);
  const bulb = (x, y, r, ci, i) => {
    const col = litFill(tn, offCols[md(ci, offCols.length)], cols[md(ci, cols.length)], lit);
    add(col, dC(x, y, r));
    if (lit > 0.02) halo[md(i, 2)].push(dC(x, y, r * 2.5));
  };
  return {
    string(x0, y0, x1, y1, sag, step = 60, r = 9, seed = 0) {
      const pts = sagPts(x0, y0, x1, y1, sag, 10);
      wire.push(dL(pts));
      const n = Math.max(2, Math.round(Math.hypot(x1 - x0, y1 - y0) / step));
      for (let i = 1; i < n; i++) { const u = i / n; bulb(lerp(x0, x1, u), lerp(y0, y1, u) + 4 * sag * u * (1 - u) + r * 0.9, r, i + seed, i + seed); }
    },
    ring(cx, cy, rx, ry, n, r, seed = 0, a0 = 0) { for (let i = 0; i < n; i++) { const a = a0 + (i / n) * TAU; bulb(cx + rx * Math.cos(a), cy + ry * Math.sin(a), r, i + seed, i); } },
    row(x0, x1, y, n, r, seed = 0) { for (let i = 0; i < n; i++) bulb(lerp(x0, x1, (i + 0.5) / n), y, r, i + seed, i); },
    bulb,
    out(wireW = 3) {
      let s = wire.length ? P(wire.join(''), tn.ln(wireW, '#3A2E3A')) : '';
      if (lit > 0.02) {
        const tw = 0.5 + 0.5 * Math.sin(t * 3.1);
        if (halo[0].length) s += P(halo[0].join(''), { fill: '#FFE6A0', opacity: op(lit * (0.16 + 0.1 * tw)) });
        if (halo[1].length) s += P(halo[1].join(''), { fill: '#FFD0E8', opacity: op(lit * (0.16 + 0.1 * (1 - tw))) });
      }
      for (const [col, d] of bulbs) s += P(d, { fill: col, stroke: tn.line, 'stroke-width': f(Math.max(1, wireW * 0.6)) });
      return s;
    },
  };
}
// triangle flags along a hanging string; acc-free (one path per colour)
function bunting(x0, y0, x1, y1, sag, size, tn, cols = [C.red, C.yellow, C.teal, C.pink, C.blue, C.orange], t = 0, seed = 0, lw = 3) {
  const pts = sagPts(x0, y0, x1, y1, sag, 10);
  const n = Math.max(2, Math.round(Math.hypot(x1 - x0, y1 - y0) / (size * 1.25)));
  const by = new Map();
  for (let i = 0; i < n; i++) {
    const u = (i + 0.5) / n, x = lerp(x0, x1, u), y = lerp(y0, y1, u) + 4 * sag * u * (1 - u);
    const sw = Math.sin(t * 2.4 + i * 0.9 + seed) * size * 0.08;
    const c = cols[md(i + seed, cols.length)];
    by.set(c, (by.get(c) || '') + dP([[x - size * 0.45, y], [x + size * 0.45, y], [x + sw, y + size * 0.95]]));
  }
  let s = P(dL(pts), tn.ln(lw, '#3A2E3A'));
  for (const [c, d] of by) s += P(d, tn.ol(c, lw));
  return s;
}

// ================================================================= THE CROWD (cheap fill: blocky R6 carnival-goers)
// Deterministic: a person's look depends on (row seed, index), so rows don't flicker while the camera moves.
// row: { y (feet), s (scale; default sAt(y)), seed, dens 0..1, gaps [[x0, x1]], x0, x1, jit }
const CR_SHIRT = ['#EE3B4C', '#FF8A2E', '#FFD23F', '#3FB86A', '#22B4BE', '#4A72E6', '#8E5CE6', '#FF6FAE', '#F6F0E2', '#39405E', '#7ED0F0', '#C6E85A'];
const CR_SKIN = ['#FFE3C8', '#F4C9A0', '#D9A06E', '#A86C44', '#74472A'];
const CR_HAIR = ['#2A1E18', '#5A3A22', '#B8642A', '#E8C070', '#1C1C24', '#9A96A6', '#C24A2A'];
const CR_PANTS = ['#2E3A5A', '#3A3040', '#5A4632', '#2A4A6A'];
const CR_HAT = ['#EE3B4C', '#4A72E6', '#FFD23F', '#F6F0E2', '#3FB86A', '#FF6FAE'];
const CR_BALL = ['#FF4D6D', '#FFD23F', '#4A9CFF', '#7AE05A', '#C77DFF', '#FF8A2E'];
function crowdPeople(row, vx0, vx1, dens = 1) {
  const s = row.s, dx = 268 * s, seed = row.seed ?? 1, out = [];
  const d = clamp(dens * (row.dens ?? 1), 0, 1);
  if (d <= 0.001) return out;
  const i0 = Math.floor((Math.max(vx0, row.x0 ?? -1e9) - 200 * s) / dx), i1 = Math.ceil((Math.min(vx1, row.x1 ?? 1e9) + 200 * s) / dx);
  for (let i = i0; i <= i1; i++) {
    const h = (k) => hash(i * k + seed * 13.71);
    if (h(1.73) > d * 0.96) continue;
    const x = i * dx + (h(2.31) - 0.5) * dx * 0.7;
    if (row.gaps && row.gaps.some(([a, b]) => x > a && x < b)) continue;
    const kid = h(3.13) < 0.3, sc = s * (kid ? 0.72 : 0.94 + 0.14 * h(4.41));
    out.push({
      i, x, y: row.y + (h(5.53) - 0.5) * (row.jit ?? 10), s: sc, kid, back: h(6.61) < 0.3,
      shirt: CR_SHIRT[Math.floor(h(7.17) * CR_SHIRT.length)], skin: CR_SKIN[Math.floor(h(8.19) * CR_SKIN.length)],
      hair: CR_HAIR[Math.floor(h(9.23) * CR_HAIR.length)], hk: Math.floor(h(10.37) * 6), hat: CR_HAT[Math.floor(h(11.41) * CR_HAT.length)],
      pants: CR_PANTS[Math.floor(h(12.43) * CR_PANTS.length)], ball: kid && h(13.47) < 0.35 ? CR_BALL[Math.floor(h(14.53) * CR_BALL.length)] : null,
      ph: h(15.59) * TAU, up: h(16.61),
    });
  }
  return out;
}
// draw crowd rows (world space). o: { tone, t, cheer 0..1, light 0..1 (0 = silhouette), sil (silhouette colour), dens, faces,
//   zoom (screen scale of the layer: picks the level of detail), x0, x1 (visible range) }
// One stroked silhouette per person (torso + arms as one shape), stroked head + hair/hat; legs/hands are plain fills.
// LOD by on-screen scale: < .12 no outlines / faces, < .22 no leg outlines, else full.
function crowd(rows, o = {}) {
  const tn = o.tone || tone(), t = o.t || 0, cheer = b01(o.cheer), lt_ = o.light ?? 1, sil = o.sil || '#2A1E44', zs = o.zoom ?? 1;
  const col = (c) => (lt_ >= 1 ? tn.c(c) : mix(tn.c(c), sil, 1 - lt_));
  let out = '';
  for (const row of rows) {
    const ppl = row.people || crowdPeople(row, o.x0 ?? -1e9, o.x1 ?? 1e9, o.dens ?? 1);
    if (!ppl.length) continue;
    const ss = row.s * zs, lod = ss < 0.12 ? 0 : ss < 0.22 ? 1 : 2;
    const B = { legs: new Map(), body: new Map(), head: new Map(), hands: new Map(), hair: new Map(), hat: new Map(), ball: new Map() };
    const add = (m, c, d) => m.set(c, (m.get(c) || '') + d);
    let eyes = '', mouth = '', strings = '', seams = '';
    const faces = o.faces !== false && lt_ > 0.45 && lod > 0;
    for (const p of ppl) {
      const s = p.s, x = p.x;
      const up = cheer * (p.up < 0.85 ? 1 : 0.15);
      const bob = up > 0.05 ? Math.abs(Math.sin(t * 7.5 + p.ph)) * 26 * s * up : Math.sin(t * 2.1 + p.ph) * 4 * s;
      const y = p.y - bob, X_ = (v) => f(x + v * s), Y_ = (v) => f(y + v * s);
      if (row.legs !== false) add(B.legs, p.pants, `M${X_(-92)} ${Y_(-300)}H${X_(92)}V${f(p.y)}H${X_(10)}V${Y_(-150)}H${X_(-10)}V${f(p.y)}H${X_(-92)}Z`);
      if (up > 0.05) {
        const sw = Math.sin(t * 6.5 + p.ph) * 22 * up, ah = 230 * up, tl = -520 - ah + sw, trr = -520 - ah - sw;
        add(B.body, p.shirt, `M${X_(-158)} ${Y_(tl)}H${X_(-106)}V${Y_(-530)}H${X_(106)}V${Y_(trr)}H${X_(158)}V${Y_(-462)}H${X_(104)}V${Y_(-280)}H${X_(-104)}V${Y_(-462)}H${X_(-158)}Z`);
        add(B.hands, p.skin, dR(x - 158 * s, y + (tl - 42) * s, 52 * s, 44 * s) + dR(x + 106 * s, y + (trr - 42) * s, 52 * s, 44 * s));
      } else {
        add(B.body, p.shirt, `M${X_(-156)} ${Y_(-528)}H${X_(156)}V${Y_(-338)}H${X_(104)}V${Y_(-280)}H${X_(-104)}V${Y_(-338)}H${X_(-156)}Z`);
        add(B.hands, p.skin, dR(x - 156 * s, y - 338 * s, 50 * s, 46 * s) + dR(x + 106 * s, y - 338 * s, 50 * s, 46 * s));
      }
      // head (R6 block) + hair / hat
      const hw = 196 * s, hh = 210 * s, hx_ = x + Math.sin(t * 1.3 + p.ph) * 4 * s, ht = y - 540 * s - hh;
      add(p.back ? B.hair : B.head, p.back ? p.hair : p.skin, lod === 0 ? dR(hx_ - hw / 2, ht, hw, hh) : dRR(hx_ - hw / 2, ht, hw, hh, 30 * s));
      if (p.hk === 0) add(B.hat, p.hat, `M${f(hx_ - hw / 2 - 4 * s)} ${f(ht - 26 * s)}H${f(hx_ + hw / 2 + 4 * s)}V${f(ht + 22 * s)}H${f(p.back ? hx_ + hw / 2 + 4 * s : hx_ + hw / 2 + 50 * s)}V${f(ht + 42 * s)}H${f(p.back ? hx_ - hw / 2 - 50 * s : hx_ - hw / 2 - 4 * s)}Z`);
      else if (p.hk === 1) add(B.hair, p.hair, `M${f(hx_ - hw / 2 - 8 * s)} ${f(ht + 80 * s)}V${f(ht - 14 * s)}H${f(hx_ + hw / 2 + 8 * s)}V${f(ht + 54 * s)}L${f(hx_ + hw * 0.12)} ${f(ht + 36 * s)}L${f(hx_ - hw * 0.28)} ${f(ht + 52 * s)}Z`);
      else if (p.hk === 2) add(B.hair, p.hair, `M${f(hx_ - hw / 2 - 6 * s)} ${f(ht + hh * 0.75)}V${f(ht - 22 * s)}H${f(hx_ + hw / 2 + 6 * s)}V${f(ht + hh * 0.75)}H${f(hx_ + hw / 2 - 28 * s)}V${f(ht + 36 * s)}H${f(hx_ - hw / 2 + 28 * s)}V${f(ht + hh * 0.75)}Z`);
      else if (p.hk === 3) add(B.hat, p.hat, dP([[hx_ - hw * 0.62, ht + 10 * s], [hx_ + hw * 0.62, ht + 10 * s], [hx_ + hw * 0.34, ht - 14 * s], [hx_ + hw * 0.24, ht - 74 * s], [hx_ - hw * 0.24, ht - 74 * s], [hx_ - hw * 0.34, ht - 14 * s]]));
      else add(B.hair, p.hair, dR(hx_ - hw / 2 - 4 * s, ht - 18 * s, hw + 8 * s, 50 * s));
      if (faces && !p.back) {
        const ey = ht + hh * 0.5, ex = 38 * s;
        eyes += dR(hx_ - ex - 11 * s, ey - 17 * s, 22 * s, 34 * s) + dR(hx_ + ex - 11 * s, ey - 17 * s, 22 * s, 34 * s);
        if (lod === 2) {
          if (up > 0.3) mouth += `M${f(hx_ - 34 * s)} ${f(ey + 36 * s)}H${f(hx_ + 34 * s)}Q${f(hx_)} ${f(ey + 92 * s)} ${f(hx_ - 34 * s)} ${f(ey + 36 * s)}Z`;
          else mouth += `M${f(hx_ - 26 * s)} ${f(ey + 44 * s)}Q${f(hx_)} ${f(ey + 66 * s)} ${f(hx_ + 26 * s)} ${f(ey + 44 * s)}`;
        }
      }
      if (p.ball) {
        const bx = x + 150 * s + Math.sin(t * 1.7 + p.ph) * 18 * s, by = y - 1050 * s + Math.sin(t * 2.3 + p.ph) * 12 * s;
        strings += `M${f(x + 132 * s)} ${f(y - 330 * s)}Q${f(x + 170 * s)} ${f(y - 640 * s)} ${f(bx)} ${f(by + 95 * s)}`;
        add(B.ball, p.ball, dE(bx, by, 80 * s, 95 * s));
      }
    }
    const sw = Math.max(1.4, 12 * row.s);
    const st = lod === 0 || row.outline === false ? null : { stroke: tn.line, 'stroke-width': f(sw), 'stroke-linejoin': 'miter' };
    const fa = (c, stroke = true) => (stroke && st ? { fill: col(c), ...st } : { fill: col(c) });
    for (const [c, d] of B.legs) out += P(d, fa(c, lod === 2));
    for (const [c, d] of B.body) out += P(d, fa(c));
    for (const [c, d] of B.hands) out += P(d, fa(c, false));
    for (const k of ['head', 'hair', 'hat']) for (const [c, d] of B[k]) out += P(d, fa(c));
    if (eyes) out += P(eyes, { fill: LINE });
    if (mouth) out += P(mouth, cheer > 0.3 ? { fill: '#6A1A2A' } : { fill: 'none', stroke: LINE, 'stroke-width': f(Math.max(1.4, 8 * row.s)), 'stroke-linecap': 'round' });
    if (strings) out += P(strings, { fill: 'none', stroke: col('#F6F0E2'), 'stroke-width': f(Math.max(1, 5 * row.s)) });
    for (const [c, d] of B.ball) out += P(d, { ...fa(c), fill: lt_ >= 1 ? c : col(c) });
  }
  return out;
}

// ================================================================= PROPS / BUILDING BLOCKS
// Components below are authored in BODY UNITS (a person is ~950 tall, feet at y 0) and placed with tr(x, base, sc), sc = the
// character scale at that depth — so props always match the cast. lw = outline width in body units (6 px / sc).

// candy-striped vertical pole (diagonal bands), origin = bottom centre
function stripePole(h, w, cA, cB, tn, lw, n = 0) {
  n = n || Math.max(3, Math.round(h / (w * 1.4)));
  let st = '';
  for (let i = 0; i < n; i += 2) { const y0 = -h + (i / n) * h, y1 = -h + ((i + 1) / n) * h; st += dP([[-w / 2, y0 + w * 0.5], [w / 2, y0], [w / 2, y1], [-w / 2, y1 + w * 0.5]]); }
  return R(-w / 2, -h, w, h, w * 0.2, tn.fl(cA)) + P(st, tn.fl(cB)) + R(-w / 2, -h, w, h, w * 0.2, { fill: 'none', stroke: tn.line, 'stroke-width': f(lw) });
}
// striped scalloped awning: (x0..x1) top y, height h, n stripes; scallops hang below
function awning(x0, x1, y, h, cA, cB, tn, lw, n = 8, slope = 0) {
  const w = (x1 - x0) / n;
  let a = '', b = '', sc = '';
  for (let i = 0; i < n; i++) {
    const xa = x0 + i * w, xb = xa + w;
    const d = dP([[xa + slope * (i / n - 0.5) * 2, y], [xb + slope * ((i + 1) / n - 0.5) * 2, y], [xb, y + h], [xa, y + h]]);
    const sd = `M${f(xa)} ${f(y + h)}A${f(w / 2)} ${f(w * 0.42)} 0 0 0 ${f(xb)} ${f(y + h)}Z`;
    if (i % 2) { b += d; sc += ''; } else a += d;
    if (i % 2) b += sd; else a += sd;
  }
  const outline = `M${f(x0 - slope)} ${f(y)}H${f(x1 + slope)}L${f(x1)} ${f(y + h)}` + Array.from({ length: n }, (_, i) => `A${f(w / 2)} ${f(w * 0.42)} 0 0 1 ${f(x1 - (i + 1) * w)} ${f(y + h)}`).join('') + 'Z';
  return P(a, tn.fl(cA)) + P(b, tn.fl(cB)) + P(outline, { fill: 'none', stroke: tn.line, 'stroke-width': f(lw), 'stroke-linejoin': 'round' }) + sc;
}
// generic sign board with Lilita lettering; lit = marquee bulbs around it
function signBoard(cx, cy, w, h, text, size, tn, lw, o = {}) {
  const fill = o.fill || C.ink, txt = o.txt || C.yellow;
  let s = R(cx - w / 2, cy - h / 2, w, h, o.r ?? h * 0.25, tn.ol(fill, lw));
  if (o.inner !== false) s += R(cx - w / 2 + lw * 1.6, cy - h / 2 + lw * 1.6, w - lw * 3.2, h - lw * 3.2, (o.r ?? h * 0.25) * 0.7, { fill: 'none', stroke: tn.c(o.trim || C.yellow), 'stroke-width': f(lw * 0.8) });
  s += T(text, cx, cy + size * 0.36, size, o.lit ? txt.replace('!', '') : tn.c(txt.replace('!', '')), OUTX(lw * 1.1, tn.line));
  return s;
}
// vintage lamp post (dark iron, fluted base, globe), origin = foot; on 0..1
function lampPost(tn, lw, on = 0, h = 1900) {
  let s = R(-70, -120, 140, 120, 18, tn.ol(C.iron, lw)) + R(-46, -240, 92, 130, 14, tn.ol(C.ironL, lw));
  s += R(-22, -h + 120, 44, h - 360, 10, tn.ol(C.iron, lw));
  s += R(-60, -h + 100, 120, 40, 12, tn.ol(C.ironL, lw)) + P(`M-60 ${-h + 120} Q-110 ${-h + 170} -90 ${-h + 240} M60 ${-h + 120} Q110 ${-h + 170} 90 ${-h + 240}`, tn.ln(lw * 0.8));
  s += CI(0, -h - 30, 110, { fill: litFill(tn, '#F4EEDC', '#FFF6D0', on), stroke: tn.line, 'stroke-width': f(lw) });
  if (on < 0.5) s += P(`M-60 ${-h - 70} Q-40 ${-h - 110} 0 ${-h - 118}`, tn.ln(lw * 1.4, '#FFFFFF', 0.6));
  s += R(-50, -h - 170, 100, 40, 14, tn.ol(C.iron, lw)) + CI(0, -h - 190, 22, tn.ol(C.iron, lw * 0.8));
  return s;
}
// park bench (wood slats, black iron frame), origin = floor centre; seat top at y -SEAT_H
const SEAT_H = 262;
function bench(tn, lw, w = 1500) {
  const hw = w / 2;
  let s = '';
  // back legs + back slats
  s += P(`M${-hw + 90} 0 V${-SEAT_H - 30} M${hw - 90} 0 V${-SEAT_H - 30}`, tn.ln(lw * 4.2, LINE)) + P(`M${-hw + 90} 0 V${-SEAT_H - 30} M${hw - 90} 0 V${-SEAT_H - 30}`, tn.ln(lw * 2.4, C.iron));
  const backB = -SEAT_H - 70;
  for (let i = 0; i < 3; i++) s += R(-hw + 30, backB - 250 + i * 86, w - 60, 62, 12, tn.ol(i === 1 ? C.woodL : C.wood, lw));
  s += P(`M${-hw + 120} ${-SEAT_H - 20} V${backB - 270} M${hw - 120} ${-SEAT_H - 20} V${backB - 270}`, tn.ln(lw * 2.6, C.iron));
  // seat slats (seen from a little above)
  s += R(-hw, -SEAT_H - 40, w, 44, 10, tn.ol(C.woodL, lw)) + R(-hw - 10, -SEAT_H + 2, w + 20, 46, 12, tn.ol(C.wood, lw));
  // front legs + armrests (curly iron)
  for (const sx of [-1, 1]) {
    const x = sx * (hw - 50);
    s += P(`M${x} 0 V${-SEAT_H + 40}`, tn.ln(lw * 4.4, LINE)) + P(`M${x} 0 V${-SEAT_H + 40}`, tn.ln(lw * 2.6, C.iron));
    s += P(`M${x} ${-SEAT_H + 10} Q${x + sx * 20} ${-SEAT_H - 150} ${x - sx * 60} ${-SEAT_H - 160} Q${x - sx * 130} ${-SEAT_H - 150} ${x - sx * 150} ${-SEAT_H - 90}`, tn.ln(lw * 2.2, C.iron));
    s += R(x - 50, -22, 100, 22, 8, tn.ol(C.iron, lw * 0.8));
  }
  s += R(-hw + 40, -SEAT_H + 40, w - 80, 14, 6, { fill: tn.c('#000000'), opacity: 0.15 });
  return s;
}
// ticket kiosk, origin = floor centre
function ticketBooth(tn, lw, lit, t) {
  let s = R(-380, -1050, 760, 1050, 40, tn.ol(C.red, lw)) + R(-380, -1050, 760, 1050, 40, { fill: 'url(#sfPolka)', opacity: 0.35 });
  s += R(-260, -860, 520, 380, 30, { ...tn.ol('#3A2E5A', lw), fill: litFill(tn, '#3A2E5A', '#FFD98A', lit * 0.85) });
  s += R(-300, -470, 600, 60, 12, tn.ol(C.woodL, lw)) + R(-380, -120, 760, 120, 30, tn.ol(C.cherry, lw));
  s += P('M-430 -1050 Q0 -1420 430 -1050 Z', tn.ol(C.yellow, lw)) + P('M-300 -1090 Q0 -1330 300 -1090', tn.ln(lw * 0.8, C.red));
  s += CI(0, -1330, 46, tn.ol(C.red, lw)) + R(-4, -1480, 8, 130, 3, tn.fl(C.iron)) + P(`M4 -1478 L${110 + Math.sin(t * 4) * 8} -1450 L4 -1420Z`, tn.ol(C.teal, lw * 0.7));
  s += signBoard(0, -960, 560, 120, 'TICKETS', 96, tn, lw, { fill: C.ink, txt: lit > 0.3 ? '!#FFE27A' : C.yellow, lit: lit > 0.3 });
  return s;
}

// ---------------------------------------------------------------- the TOWN FAIR entrance arch (origin = floor centre, posts at x ±1300)
function archSign(tn, lw, lit, t, acc) {
  let s = '';
  for (const sx of [-1, 1]) {
    const x = sx * 1300;
    s += G(R(-160, -170, 320, 170, 24, tn.ol(C.woodD, lw)) + stripePole(1960, 200, C.red, C.white, tn, lw, 14) + CI(0, -2030, 100, tn.ol(C.yellow, lw)) +
      R(-5, -2330, 10, 220, 4, tn.fl(C.iron)) + P(`M5 -2326 Q${150} ${-2310 + Math.sin(t * 4 + sx) * 14} ${260} -2296 L5 -2236Z`, tn.ol(sx < 0 ? C.teal : C.pink, lw * 0.8)), `translate(${x} 0)`);
  }
  // header board: arched top
  const hb = -1830, he = -2190, hp = -2440;
  const d = `M-1480 ${hb} L-1480 ${he} Q0 ${hp - 250} 1480 ${he} L1480 ${hb} Z`;
  s += P(d, tn.ol(C.navy, lw * 1.2));
  s += P(`M-1400 ${hb - 70} L-1400 ${he + 30} Q0 ${hp - 190} 1400 ${he + 30} L1400 ${hb - 70} Z`, { fill: 'none', stroke: tn.c(C.yellow), 'stroke-width': f(lw * 1.4) });
  // marquee bulbs along the arch
  for (let i = 0; i <= 26; i++) { const u = i / 26, x = lerp(-1440, 1440, u), y = lerp(he, he, u) + (hp - 250 - he) * 2 * u * (1 - u) * 0.98 + 40; acc.bulb(x, y, 26, i % 2 ? 1 : 0, i + Math.floor(t * 6)); }
  for (let i = 0; i < 18; i++) acc.bulb(lerp(-1440, 1440, (i + 0.5) / 18), hb - 30, 22, i % 2 ? 0 : 1, i + Math.floor(t * 6) + 1);
  // letters, each its own colour, on a gentle arc
  const word = 'TOWN FAIR', cols = [C.red, C.orange, C.yellow, C.lime, null, C.sky, C.pink, C.purple, C.yellow];
  let x = -1150;
  [...word].forEach((ch, i) => {
    if (ch === ' ') { x += 190; return; }
    const u = (x + 1480) / 2960, y = hb - 120 + (hp - 250 - he) * 2 * u * (1 - u) * 0.55 - 40;
    s += T(ch, x, y, 330, lit > 0.4 ? tn.c(cols[i]) : tn.c(cols[i]), { ...OUTX(lw * 2.2, tn.line), transform: `rotate(${f((u - 0.5) * 14)} ${f(x)} ${f(y)})` });
    x += ch === 'I' ? 170 : 300;
  });
  s += R(-520, hb - 6, 1040, 120, 50, tn.ol(C.yellow, lw)) + T('WELCOME!', 0, hb + 86, 100, tn.c(C.navy));
  s += bunting(-1300, -1640, 1300, -1640, 160, 200, tn, undefined, t, 1, lw * 0.7);
  return s;
}

// ---------------------------------------------------------------- cotton candy stand (origin = floor centre front of the counter)
function cottonCandyStand(tn, lw, lit, t) {
  let s = '';
  // posts + back wall (glows at dusk)
  s += R(-700, -1420, 1400, 1000, 0, { ...tn.ol('#FFC8E0', lw), fill: litFill(tn, '#FFC8E0', '#FFE4F2', lit * 0.85) });
  // shelves of bagged cotton candy (pink / blue puffs in clear bags)
  let pk = '', bl = '', bags = '';
  for (let r = 0; r < 2; r++) for (let i = 0; i < 7; i++) {
    const x = -560 + i * 186, y = -1200 + r * 300;
    (i + r) % 2 ? (bl += dC(x, y, 62) + dC(x + 34, y - 26, 46)) : (pk += dC(x, y, 62) + dC(x - 30, y - 28, 46));
    bags += dRR(x - 78, y - 96, 156, 176, 40);
  }
  s += R(-680, -1080, 1360, 24, 6, tn.ol(C.woodL, lw * 0.7)) + R(-680, -780, 1360, 24, 6, tn.ol(C.woodL, lw * 0.7));
  s += P(pk, tn.fl(C.bubble)) + P(bl, tn.fl('#A8DEFF')) + P(bags, { fill: '#FFFFFF', opacity: 0.25, stroke: tn.line, 'stroke-width': f(lw * 0.6) });
  for (const sx of [-1, 1]) s += G(stripePole(1520, 110, C.pink, C.white, tn, lw, 12), `translate(${sx * 720} 0)`);
  // awning + bulbs
  s += awning(-800, 800, -1560, 170, C.pink, C.white, tn, lw, 10, 30);
  // the big sign: a giant cotton candy on its paper cone rising behind the name board
  const bw = Math.sin(t * 1.3) * 3;
  s += P('M-150 -1960 L0 -1600 L150 -1960 Z', tn.ol(C.cream, lw)) + P('M-96 -1960 L-24 -1700 M-30 -1960 L0 -1640 M40 -1960 L30 -1690 M106 -1960 L40 -1740', tn.ln(lw * 1.1, C.pink));
  // fluff = a union of soft puffs (outline pass + fill pass, so only the outer edge gets a line)
  const puffs = [[-170, -2060, 150], [-120, -2210, 150], [10, -2280, 160], [150, -2220, 150], [200, -2080, 140], [90, -1980, 140], [-60, -1980, 140], [10, -2120, 190]];
  const pd = puffs.map(([x, y, r], i) => dC(x, y + Math.sin(t * 1.6 + i) * 6, r)).join('');
  const swirl = [[-60, -2190, 70], [60, -2230, 64], [120, -2120, 56]].map(([x, y, r]) => dC(x, y, r)).join('');
  s += G(P(pd, { fill: tn.c(C.bubble), stroke: tn.line, 'stroke-width': f(lw * 2) }) + P(pd, tn.fl(C.bubble)) + P(swirl, tn.fl('#A8DEFF', 0.9)) + P('M-230 -2080 Q-210 -2230 -90 -2290 M70 -2000 Q170 -2010 230 -2100', tn.ln(lw * 1.6, '#FFFFFF', 0.7)), `rotate(${f(bw)} 0 -1960)`);
  s += R(-640, -1720, 1280, 200, 90, tn.ol(C.white, lw * 1.1));
  s += T('COTTON CANDY', 0, -1580, 150, tn.c(C.pink), OUTX(lw * 1.4, tn.line));
  // the spinning machine on the counter
  const spin = t * 3;
  s += R(-470, -560, 200, 120, 16, tn.ol(C.steelD, lw)) + E(-370, -560, 170, 46, tn.ol(C.steel, lw));
  s += P(dSmooth([[-500, -600], [-430, -690 - 10 * Math.sin(spin)], [-350, -720], [-260, -690 + 10 * Math.sin(spin)], [-240, -610], [-370, -580]]), tn.ol(C.bubble, lw * 0.8));
  s += P(`M-460 -640 Q-370 ${-700 + 8 * Math.sin(spin * 2)} -280 -640`, tn.ln(lw * 0.6, '#FFFFFF', 0.8));
  // cones in a holder
  s += R(180, -520, 330, 90, 14, tn.ol(C.woodD, lw));
  [[230, C.bubble], [320, '#A8DEFF'], [410, C.bubble]].forEach(([x, c], i) => {
    s += P(`M${x - 22} -560 L${x} -470 L${x + 22} -560 Z`, tn.ol(C.cream, lw * 0.7)) + CI(x, -610 - (i % 2) * 20, 62, tn.ol(c, lw * 0.8));
  });
  s += signBoard(560, -760, 180, 110, '$3', 80, tn, lw * 0.8, { fill: C.yellow, txt: C.cherry, trim: C.white, r: 20 });
  return s;
}
// counter front (front layer: a vendor drawn before it stands behind)
function cottonCounter(tn, lw) {
  let s = R(-760, -470, 1520, 470, 26, tn.ol('#7FD3F0', lw)) + R(-760, -470, 1520, 470, 26, { fill: 'url(#sfPolka)', opacity: 0.6 });
  s += R(-800, -500, 1600, 64, 20, tn.ol(C.white, lw)) + R(-760, -120, 1520, 120, 0, tn.fl('#5BB8DE')) + R(-760, -470, 1520, 470, 26, { fill: 'none', stroke: tn.line, 'stroke-width': f(lw) });
  s += P(dSmooth([[-300, -330], [-220, -390], [-100, -380], [-40, -320], [-120, -280], [-260, -280]]), tn.ol(C.white, lw * 0.8)) + P(dSmooth([[140, -300], [220, -350], [330, -340], [370, -280], [260, -250], [160, -260]]), tn.ol(C.white, lw * 0.8));
  return s;
}

// ---------------------------------------------------------------- game booth: BALLOON POP (origin = floor centre)
function gameBooth(tn, lw, lit, t) {
  let s = '';
  s += R(-760, -1440, 1520, 1000, 0, { ...tn.ol('#2E6A8A', lw), fill: litFill(tn, '#2E6A8A', '#4FA0C8', lit * 0.6) });
  // balloon wall
  const bc = [C.red, C.yellow, C.sky, C.pink, C.lime, C.orange];
  const by = new Map();
  for (let r = 0; r < 3; r++) for (let i = 0; i < 8; i++) {
    if ((r * 3 + i * 5) % 11 === 4) continue;      // some already popped
    const c = bc[(i + r * 2) % bc.length], x = -600 + i * 172 + (r % 2) * 40, y = -1250 + r * 210 + Math.sin(t * 2 + i + r) * 4;
    by.set(c, (by.get(c) || '') + dE(x, y, 66, 80) + dP([[x - 12, y + 92], [x + 12, y + 92], [x, y + 78]]));
  }
  for (const [c, d] of by) s += P(d, tn.ol(c, lw * 0.7));
  // prizes hanging from the top bar: a green plush T-rex, a bear, a star
  s += P('M-760 -1420 H760', tn.ln(lw * 1.6, C.woodD));
  const sw = (i) => Math.sin(t * 1.6 + i) * 3;
  s += G(P('M0 0 V60', tn.ln(lw * 0.6)) + P(dSmooth([[-90, 100], [-40, 70], [40, 80], [110, 140], [70, 240], [-60, 250], [-110, 180]]), tn.ol('#5FC85A', lw)) + CI(-70, 90, 55, tn.ol('#5FC85A', lw)) + CI(-82, 80, 10, tn.fl(LINE)) + P('M120 200 L190 230 L120 240Z', tn.ol('#5FC85A', lw * 0.8)), `translate(-560 -1420) rotate(${f(sw(1))})`);
  s += G(P('M0 0 V50', tn.ln(lw * 0.6)) + CI(0, 150, 100, tn.ol('#B9824E', lw)) + CI(-70, 70, 34, tn.ol('#B9824E', lw)) + CI(70, 70, 34, tn.ol('#B9824E', lw)) + CI(-30, 140, 9, tn.fl(LINE)) + CI(30, 140, 9, tn.fl(LINE)) + E(0, 180, 30, 22, tn.fl('#E8C8A0')), `translate(560 -1420) rotate(${f(sw(2))})`);
  s += G(P('M0 0 V40', tn.ln(lw * 0.6)) + P(dP(Array.from({ length: 10 }, (_, i) => { const a = -Math.PI / 2 + (i * Math.PI) / 5, r = i % 2 ? 50 : 110; return [Math.cos(a) * r, 150 + Math.sin(a) * r]; })), tn.ol(C.yellow, lw)), `translate(0 -1420) rotate(${f(sw(3))})`);
  for (const sx of [-1, 1]) s += G(stripePole(1500, 100, C.teal, C.yellow, tn, lw, 12), `translate(${sx * 770} 0)`);
  s += awning(-840, 840, -1600, 160, C.teal, C.yellow, tn, lw, 10, 30);
  s += signBoard(0, -1760, 1120, 210, 'BALLOON POP', 150, tn, lw, { fill: C.ink, txt: lit > 0.3 ? '!#FFE27A' : C.yellow, lit: lit > 0.3, trim: C.pink });
  return s;
}
function gameCounter(tn, lw) {
  let s = R(-800, -470, 1600, 470, 20, tn.ol(C.yellow, lw)) + R(-800, -500, 1600, 64, 18, tn.ol(C.woodL, lw));
  let stars = '';
  for (let i = 0; i < 5; i++) { const cx = -620 + i * 310, cy = -250; stars += dP(Array.from({ length: 10 }, (_, k) => { const a = -Math.PI / 2 + (k * Math.PI) / 5, r = k % 2 ? 34 : 80; return [cx + Math.cos(a) * r, cy + Math.sin(a) * r]; })); }
  s += P(stars, tn.fl(C.red)) + R(-260, -420, 520, 110, 20, tn.ol(C.white, lw * 0.8)) + T('3 DARTS $2', 0, -340, 74, tn.c(C.navy));
  // darts on the counter
  s += P('M380 -520 L520 -560 M420 -510 L560 -540', tn.ln(lw * 1.2, C.iron)) + P('M520 -560 l30 -20 l-6 26 Z M560 -540 l30 -20 l-6 26 Z', tn.ol(C.red, lw * 0.6));
  return s;
}
// balloon vendor cart with a big bunch (origin = floor centre). Two dino-shaped balloons in the bunch.
function balloonCart(tn, lw, t) {
  let s = '';
  const bc = [C.red, C.yellow, C.sky, C.pink, C.lime, C.orange, C.purple, '#FF4D6D', '#4A9CFF'];
  const tie = [0, -760];
  let strings = '';
  const by = new Map();
  const balls = [];
  for (let i = 0; i < 16; i++) {
    const a = -Math.PI / 2 + (hash(i * 3.3) - 0.5) * 1.9, r = 520 + 260 * hash(i * 7.1);
    const x = tie[0] + Math.cos(a) * r * 0.8 + Math.sin(t * 1.3 + i) * 14, y = tie[1] + Math.sin(a) * r + Math.cos(t * 1.7 + i) * 10;
    balls.push([x, y, i]);
  }
  balls.sort((a, b) => b[1] - a[1]);
  for (const [x, y, i] of balls) {
    strings += `M${tie[0]} ${tie[1]}Q${f((x + tie[0]) / 2 + 20)} ${f((y + tie[1]) / 2)} ${f(x)} ${f(y + 120)}`;
    if (i === 3 || i === 11) continue;
    const c = bc[i % bc.length];
    by.set(c, (by.get(c) || '') + dE(x, y, 96, 116) + dP([[x - 14, y + 128], [x + 14, y + 128], [x, y + 112]]));
  }
  s += P(strings, tn.ln(lw * 0.5, '#F6F0E2'));
  for (const [c, d] of by) s += P(d, tn.ol(c, lw * 0.8));
  for (const [x, y, i] of balls) if (i === 3 || i === 11) s += dinoBalloon(x, y + 60, 0.62, t + i, { tone: tn, lw: lw / 0.62, string: false });
  // cart
  s += R(-300, -760, 600, 420, 30, tn.ol(C.cream, lw)) + R(-300, -760, 600, 420, 30, { fill: 'url(#sfPolka)', opacity: 0.5 }) + R(-330, -380, 660, 70, 20, tn.ol(C.red, lw));
  s += signBoard(0, -580, 440, 140, 'BALLOONS', 96, tn, lw * 0.8, { fill: C.red, txt: C.white, trim: C.yellow });
  for (const sx of [-1, 1]) s += CI(sx * 200, -140, 130, tn.ol(C.iron, lw)) + CI(sx * 200, -140, 50, tn.ol(C.steel, lw * 0.8));
  s += P('M300 -320 L470 -440', tn.ln(lw * 1.6, C.iron));
  return s;
}
// Max's DINOSAUR BALLOON (a green foil T-rex head-and-body balloon on a string). origin = balloon centre; s = scale
// (s 1 ≈ 300 px tall). o: { tone, lw, string (true | length px), t }
function dinoBalloon(x, y, s = 1, t = 0, o = {}) {
  const tn = o.tone || tone(), lw = o.lw ?? 6 / s;
  const bob = Math.sin(t * 1.8) * 6, rot = Math.sin(t * 1.3) * 5;
  let b = '';
  if (o.string !== false) { const L = o.string === true || o.string === undefined ? 520 : o.string; b += P(`M0 150 Q${f(30 + Math.sin(t * 2) * 20)} ${f(150 + L * 0.5)} ${f(-10)} ${f(150 + L)}`, tn.ln(lw * 0.8, '#F6F0E2')); }
  b += P(dSmooth([[-120, 20], [-110, -70], [-40, -120], [60, -150], [150, -130], [190, -70], [170, -20], [90, 0], [60, 60], [80, 120], [20, 150], [-70, 140], [-120, 90]]), tn.ol('#5FD45A', lw));
  b += P(dSmooth([[-70, 40], [-20, 0], [30, 30], [20, 110], [-50, 110]]), tn.fl('#BFF09A'));
  b += CI(80, -80, 24, tn.fl('#FFFFFF')) + CI(86, -78, 11, tn.fl(LINE)) + P('M120 -40 Q150 -30 175 -45', tn.ln(lw * 0.6));
  b += P('M-60 -110 l20 -40 l20 30 l20 -45 l22 38 l20 -36 l16 34', tn.ln(lw * 0.8, '#3FA84A')) + P('M-80 -60 Q-40 -100 10 -100', tn.ln(lw * 1.2, '#FFFFFF', 0.7));
  b += P('M20 150 l-14 22 l28 0 Z', tn.ol('#5FD45A', lw * 0.6));
  return G(b, `translate(${f(x)} ${f(y + bob)}) rotate(${f(rot)}) scale(${f(s)})`);
}
// small hand props: a cotton candy cone (origin = the grip) and a plain balloon on a string
function cottonCandy(x, y, s = 1, col = C.bubble, o = {}) {
  const tn = o.tone || tone(), lw = o.lw ?? 6 / s;
  const b = P('M-26 -10 L0 140 L26 -10 Z', tn.ol(C.cream, lw)) + P(dSmooth([[-110, -40], [-90, -130], [-10, -170], [80, -140], [110, -60], [60, -10], [-60, -10]]), tn.ol(col, lw)) + P('M-70 -90 Q-40 -130 0 -130', tn.ln(lw * 1.2, '#FFFFFF', 0.7));
  return G(b, `translate(${f(x)} ${f(y)}) scale(${f(s)})`);
}
function balloon(x, y, s = 1, col = C.red, t = 0, o = {}) {
  const tn = o.tone || tone(), lw = o.lw ?? 6 / s, L = o.string ?? 420;
  let b = P(`M0 120 Q${f(30 + Math.sin(t * 2) * 20)} ${f(120 + L * 0.5)} -10 ${f(120 + L)}`, tn.ln(lw * 0.8, '#F6F0E2'));
  b += E(0, 0, 90, 108, tn.ol(col, lw)) + P('M-14 120 L14 120 L0 104Z', tn.ol(col, lw * 0.7)) + P('M-50 -50 Q-30 -80 0 -82', tn.ln(lw * 1.3, '#FFFFFF', 0.65));
  return G(b, `translate(${f(x)} ${f(y + Math.sin(t * 1.8) * 6)}) rotate(${f(Math.sin(t * 1.3) * 4)}) scale(${f(s)})`);
}

// ---------------------------------------------------------------- back-row stalls + tents (k .8 row)
const STALL_KINDS = [
  { kind: 'tent', cols: STRIPES[0] }, { kind: 'stall', label: 'POPCORN', cols: [C.red, C.white] }, { kind: 'tent', cols: STRIPES[3] },
  { kind: 'stall', label: 'CORN DOGS', cols: [C.yellow, C.red] }, { kind: 'tent', cols: STRIPES[1] }, { kind: 'stall', label: 'LEMONADE', cols: [C.yellow, C.white] },
  { kind: 'tent', cols: STRIPES[4] }, { kind: 'stall', label: 'SNOW CONES', cols: [C.sky, C.white] }, { kind: 'tent', cols: STRIPES[5] },
  { kind: 'stall', label: 'FUNNEL CAKE', cols: [C.pink, C.white] }, { kind: 'tent', cols: STRIPES[6] }, { kind: 'stall', label: 'CANDY APPLES', cols: [C.cherry, C.cream] },
  { kind: 'tent', cols: STRIPES[7] }, { kind: 'stall', label: 'PRIZES', cols: [C.purple, C.yellow] },
];
// a striped peaked tent, origin = floor centre, size w (width) x h (peak height)
function tent(w, h, cA, cB, tn, lw, lit, t, seed = 0) {
  const hw = w / 2, wallH = h * 0.42, eave = -wallH, peak = -h;
  const n = 8, sw = w / n;
  let a = '', b = '';
  for (let i = 0; i < n; i++) { const d = dR(-hw + i * sw, eave, sw, wallH); i % 2 ? (b += d) : (a += d); }
  let s = P(a, tn.fl(cA)) + P(b, tn.fl(cB)) + R(-hw, eave, w, wallH, 0, { fill: 'none', stroke: tn.line, 'stroke-width': f(lw) });
  // door (lit inside at dusk)
  s += P(`M${-w * 0.14} 0 L${-w * 0.1} ${eave + 10} L${w * 0.1} ${eave + 10} L${w * 0.14} 0 Z`, { fill: litFill(tn, '#3A2440', '#FFD27A', lit * 0.9), stroke: tn.line, 'stroke-width': f(lw) });
  s += P(`M${-w * 0.14} 0 Q${-w * 0.2} ${eave * 0.5} ${-w * 0.1} ${eave + 10} L${-w * 0.2} ${eave + 10} Z M${w * 0.14} 0 Q${w * 0.2} ${eave * 0.5} ${w * 0.1} ${eave + 10} L${w * 0.2} ${eave + 10} Z`, tn.ol(cA, lw * 0.8));
  // roof: radiating stripes to the peak
  const rw = hw + 40;
  let ra = '', rb = '';
  for (let i = 0; i < n; i++) { const d = dP([[0, peak], [-rw + (i * 2 * rw) / n, eave], [-rw + ((i + 1) * 2 * rw) / n, eave]]); i % 2 ? (rb += d) : (ra += d); }
  s += P(ra, tn.fl(cA)) + P(rb, tn.fl(cB)) + P(dP([[0, peak], [-rw, eave], [rw, eave]]), { fill: 'none', stroke: tn.line, 'stroke-width': f(lw) });
  // scalloped valance
  let sc = `M${-rw} ${eave}`;
  const ns = 7;
  for (let i = 0; i < ns; i++) sc += `A${f(rw / ns)} ${f(rw / ns * 0.7)} 0 0 0 ${f(-rw + ((i + 1) * 2 * rw) / ns)} ${eave}`;
  s += P(sc + 'Z', tn.ol(cB, lw * 0.9));
  s += R(-4, peak - 160, 8, 170, 3, tn.fl(C.iron)) + P(`M4 ${peak - 158} Q${80} ${peak - 150 + Math.sin(t * 4 + seed) * 12} ${150} ${peak - 140} L4 ${peak - 100} Z`, tn.ol(STRIPES[md(seed + 2, STRIPES.length)][0], lw * 0.7));
  return s;
}
// a box stall with an awning + sign, origin = floor centre
function stall(w, label, cA, cB, tn, lw, lit) {
  const hw = w / 2;
  let s = R(-hw, -1150, w, 1150, 0, tn.ol('#5A3A5A', lw));
  s += R(-hw + 50, -1020, w - 100, 560, 10, { fill: litFill(tn, '#F2D6A8', '#FFE6A8', lit * 0.9), stroke: tn.line, 'stroke-width': f(lw) });
  s += R(-hw + 80, -760, w - 160, 30, 6, tn.fl(C.woodL)) + R(-hw - 20, -470, w + 40, 470, 16, tn.ol(cA, lw)) + R(-hw - 20, -470, w + 40, 470, 16, { fill: 'url(#sfPolka)', opacity: 0.4 });
  s += R(-hw - 40, -500, w + 80, 56, 16, tn.ol(C.woodL, lw));
  s += awning(-hw - 60, hw + 60, -1180, 150, cA, cB, tn, lw, 8, 26);
  s += signBoard(0, -1330, w * 0.92, 190, label, Math.min(140, (w * 0.86) / (label.length * 0.62)), tn, lw, { fill: C.ink, txt: lit > 0.3 ? '!#FFE27A' : C.yellow, lit: lit > 0.3 });
  return s;
}

// ---------------------------------------------------------------- the FERRIS WHEEL (layer units; origin = hub)
const FW_COLS = [C.red, C.yellow, C.teal, C.pink, C.blue, C.orange];
function ferrisWheel(r, tn, lw, lit, t, o = {}) {
  const speed = o.speed ?? 1, a0 = t * 0.1 * speed, n = 12, legH = r + 170;
  let s = '';
  // A-frame legs (back pair lighter, then front)
  const leg = (sx, col) => P(`M0 0 L${sx * r * 0.62} ${legH} M0 0 L${sx * r * 0.3} ${legH}`, tn.ln(lw * 4.6, LINE)) + P(`M0 0 L${sx * r * 0.62} ${legH} M0 0 L${sx * r * 0.3} ${legH}`, tn.ln(lw * 2.8, col));
  s += leg(-1, C.steelD) + leg(1, C.steelD);
  // rim + spokes
  let spokes = '';
  for (let i = 0; i < 16; i++) { const a = a0 + (i / 16) * TAU; spokes += `M0 0L${f(Math.cos(a) * r)} ${f(Math.sin(a) * r)}`; }
  s += P(spokes, tn.ln(lw * 0.9, '#E8E2F2'));
  s += CI(0, 0, r, { fill: 'none', stroke: tn.line, 'stroke-width': f(lw * 3.2) }) + CI(0, 0, r, { fill: 'none', stroke: tn.c(C.purple), 'stroke-width': f(lw * 1.6) });
  s += CI(0, 0, r * 0.82, { fill: 'none', stroke: tn.line, 'stroke-width': f(lw * 2.2) }) + CI(0, 0, r * 0.82, { fill: 'none', stroke: tn.c(C.pink), 'stroke-width': f(lw) });
  let zig = '';
  for (let i = 0; i < 32; i++) { const a = a0 + (i / 32) * TAU, a2 = a0 + ((i + 0.5) / 32) * TAU; zig += `${i ? 'L' : 'M'}${f(Math.cos(a) * r)} ${f(Math.sin(a) * r)}L${f(Math.cos(a2) * r * 0.82)} ${f(Math.sin(a2) * r * 0.82)}`; }
  s += P(zig + 'Z', tn.ln(lw * 0.6, '#E8E2F2'));
  // lights: rim chase + spoke dots
  if (o.acc) {
    for (let i = 0; i < 32; i++) { const a = a0 + (i / 32) * TAU; o.acc.bulb(Math.cos(a) * r, Math.sin(a) * r, lw * 2.3, (i + Math.floor(t * 4)) % 3 === 0 ? 0 : 2, i); }
    for (let i = 0; i < 16; i += 2) { const a = a0 + (i / 16) * TAU; for (const u of [0.35, 0.6]) o.acc.bulb(Math.cos(a) * r * u, Math.sin(a) * r * u, lw * 1.7, 3, i); }
  }
  // hub
  s += CI(0, 0, r * 0.13, tn.ol(C.yellow, lw)) + P(dP(Array.from({ length: 10 }, (_, k) => { const a = a0 * 2 - Math.PI / 2 + (k * Math.PI) / 5, rr = k % 2 ? r * 0.04 : r * 0.1; return [Math.cos(a) * rr, Math.sin(a) * rr]; })), tn.fl(C.red));
  // gondolas, always hanging
  const by = new Map(), roofs = new Map();
  let wins = '';
  const gw = r * 0.2;
  for (let i = 0; i < n; i++) {
    const a = a0 + (i / n) * TAU, px = Math.cos(a) * r, py = Math.sin(a) * r, sw = Math.sin(t * 1.3 + i) * 2;
    const x = px + sw, c = FW_COLS[i % FW_COLS.length];
    by.set(c, (by.get(c) || '') + `M${f(x - gw / 2)} ${f(py + gw * 0.42)}H${f(x + gw / 2)}V${f(py + gw * 0.8)}Q${f(x + gw / 2)} ${f(py + gw * 1.18)} ${f(x)} ${f(py + gw * 1.18)}Q${f(x - gw / 2)} ${f(py + gw * 1.18)} ${f(x - gw / 2)} ${f(py + gw * 0.8)}Z`);
    roofs.set(c, (roofs.get(c) || '') + `M${f(x - gw * 0.6)} ${f(py + gw * 0.22)}Q${f(x)} ${f(py - gw * 0.2)} ${f(x + gw * 0.6)} ${f(py + gw * 0.22)}Z`);
    wins += `M${f(px)} ${f(py)}L${f(x - gw * 0.42)} ${f(py + gw * 0.42)}M${f(px)} ${f(py)}L${f(x + gw * 0.42)} ${f(py + gw * 0.42)}`;
  }
  s += P(wins, tn.ln(lw * 0.7, C.iron));
  for (const [c, d] of by) s += P(d, tn.ol(c, lw));
  for (const [c, d] of roofs) s += P(d, tn.ol(lt(c, 0.35), lw * 0.8));
  // boarding deck
  s += R(-r * 0.75, legH - 30, r * 1.5, 70, 10, tn.ol(C.woodL, lw)) + R(-r * 0.75, legH + 40, r * 1.5, 200, 0, tn.ol('#6A4A7A', lw));
  s += signBoard(0, legH - 120, r * 0.9, r * 0.2, 'FERRIS WHEEL', r * 0.12, tn, lw, { fill: C.ink, txt: lit > 0.3 ? '!#FFE27A' : C.yellow, lit: lit > 0.3, trim: C.pink });
  return s;
}
// the swing ride (wave swinger) — layer units, origin = tower base
function swingRide(tn, lw, lit, t, acc) {
  const top = -820, R_ = 330, a0 = t * 1.1, n = 12;
  let back = '', front = '';
  const seat = (i, behind) => {
    const a = a0 + (i / n) * TAU, sn = Math.sin(a);
    if ((sn < 0) !== behind) return '';
    const cx = Math.cos(a) * 150, cy = top + 40 + sn * 18, sx = Math.cos(a) * R_, sy = top + 300 + sn * 40;
    return P(`M${f(cx)} ${f(cy)}L${f(sx)} ${f(sy)}`, tn.ln(lw * 0.5, C.steelD)) + R(sx - 26, sy, 52, 26, 8, tn.ol(FW_COLS[i % 6], lw * 0.7)) + R(sx - 14, sy - 34, 28, 34, 6, tn.ol(CR_SKIN[i % 4], lw * 0.6));
  };
  for (let i = 0; i < n; i++) back += seat(i, true);
  let s = back + R(-34, top, 68, -top, 10, tn.ol(C.steel, lw)) + R(-70, -90, 140, 90, 14, tn.ol(C.purple, lw));
  // canopy (rotating stripes)
  const cn = 10;
  let ca = '', cb = '';
  for (let i = 0; i < cn; i++) {
    const u0 = md(i / cn + a0 / TAU, 1), u1 = u0 + 1 / cn;
    if (u1 > 1.001) continue;
    const d = dP([[0, top - 150], [lerp(-190, 190, u0), top + 30], [lerp(-190, 190, u1), top + 30]]);
    i % 2 ? (cb += d) : (ca += d);
  }
  s += P(dP([[0, top - 150], [-190, top + 30], [190, top + 30]]), tn.ol(C.yellow, lw)) + P(ca, tn.fl(C.red)) + P(dP([[0, top - 150], [-190, top + 30], [190, top + 30]]), { fill: 'none', stroke: tn.line, 'stroke-width': f(lw) });
  s += E(0, top + 30, 200, 24, tn.ol(C.cherry, lw * 0.8));
  if (acc) acc.ring(0, top + 30, 200, 24, 14, lw * 1.6, 0, t * 0.5);
  for (let i = 0; i < n; i++) front += seat(i, false);
  return s + front;
}
// a far drop tower with lights (layer units, origin = base)
function dropTower(tn, lw, lit, t, acc) {
  const h = 1100, car = -200 - (0.5 + 0.5 * Math.sin(t * 0.6)) * 800;
  let s = R(-40, -h, 80, h, 6, tn.ol('#D6D0E8', lw)) + P(`M-40 ${-h} V0 M40 ${-h} V0`, tn.ln(lw * 0.5, C.steelD));
  for (let y = -h + 60; y < 0; y += 80) s += P(`M-40 ${y} L40 ${y + 80}`, tn.ln(lw * 0.4, C.steelD));
  s += R(-90, car - 40, 180, 60, 16, tn.ol(C.red, lw)) + R(-70, -h - 60, 140, 70, 14, tn.ol(C.purple, lw));
  if (acc) for (let i = 0; i < 10; i++) acc.bulb(0, -h + 40 + i * 100, lw * 1.6, i % 4, i);
  return s;
}
// the big top (far circus tent), layer units, origin = floor centre
function bigTop(tn, lw, t) {
  let s = '';
  const n = 12, w = 900;
  let a = '', b = '';
  for (let i = 0; i < n; i++) { const d = dR(-w / 2 + (i * w) / n, -260, w / n, 260); i % 2 ? (b += d) : (a += d); }
  s += P(a, tn.fl(C.red)) + P(b, tn.fl(C.white)) + R(-w / 2, -260, w, 260, 0, { fill: 'none', stroke: tn.line, 'stroke-width': f(lw) });
  const roof = (cx, top, hw) => { let ra = '', rb = ''; for (let i = 0; i < 8; i++) { const d = dP([[cx, top], [cx - hw + (i * 2 * hw) / 8, -260], [cx - hw + ((i + 1) * 2 * hw) / 8, -260]]); i % 2 ? (rb += d) : (ra += d); } return P(ra, tn.fl(C.red)) + P(rb, tn.fl(C.white)) + P(dP([[cx, top], [cx - hw, -260], [cx + hw, -260]]), { fill: 'none', stroke: tn.line, 'stroke-width': f(lw) }) + R(cx - 3, top - 70, 6, 72, 2, tn.fl(C.iron)) + P(`M${cx + 3} ${top - 68} l60 ${f(10 + Math.sin(t * 4 + cx) * 6)} l-60 22Z`, tn.fl(C.yellow)); };
  s += roof(-260, -560, 230) + roof(260, -560, 230) + roof(0, -700, 300);
  return s;
}

// ---------------------------------------------------------------- the GIANT TEACUPS (origin = platform centre on the floor)
// geometry in body units: platform top ellipse rx 1900 ry 330 at y -380; cups orbit at (1220, 230)
const TC = { rx: 1900, ry: 330, top: -380, orx: 1220, ory: 220 };
const TC_COLS = [['#FF8AC0', '#E8609E'], ['#7FE6C8', '#4FC6A6'], ['#C9A6FF', '#A07CE8'], ['#FFD86A', '#F2B63A']];
function teacupsRide(tn, lw, lit, t, o = {}) {
  const spin = o.spin ?? 1, a0 = t * 0.55 * spin;
  let s = '';
  // platform skirt + top
  s += P(`M${-TC.rx} ${TC.top} A${TC.rx} ${TC.ry} 0 0 0 ${TC.rx} ${TC.top} V${TC.top + 210} A${TC.rx} ${TC.ry} 0 0 1 ${-TC.rx} ${TC.top + 210} Z`, tn.ol('#7A5AC8', lw));
  let scal = '';
  for (let i = 0; i < 24; i++) { const u0 = Math.PI - (i / 24) * Math.PI, u1 = Math.PI - ((i + 1) / 24) * Math.PI; const x0 = Math.cos(u0) * TC.rx, y0 = TC.top + Math.sin(u0) * TC.ry, x1 = Math.cos(u1) * TC.rx, y1 = TC.top + Math.sin(u1) * TC.ry; scal += `M${f(x0)} ${f(y0)}Q${f((x0 + x1) / 2)} ${f((y0 + y1) / 2 + 90)} ${f(x1)} ${f(y1)}Z`; }
  s += P(scal, tn.ol(C.butter, lw * 0.7));
  s += E(0, TC.top, TC.rx, TC.ry, tn.ol('#F4E6FF', lw)) + E(0, TC.top, TC.rx * 0.78, TC.ry * 0.78, { fill: 'none', stroke: tn.c('#E2CCFF'), 'stroke-width': f(lw * 5) });
  if (o.acc) for (let i = 0; i <= 18; i++) { const u = Math.PI - (i / 18) * Math.PI; o.acc.bulb(Math.cos(u) * TC.rx * 0.985, TC.top + 150 + Math.sin(u) * TC.ry, lw * 2.2, i % 3, i + Math.floor(t * 5)); }
  // cups behind the teapot, the teapot, cups in front
  const cups = [];
  for (let i = 0; i < 4; i++) { const a = a0 + (i / 4) * TAU; cups.push({ i, x: Math.cos(a) * TC.orx, y: TC.top + Math.sin(a) * TC.ory, depth: Math.sin(a), self: t * 1.6 * spin + i * 1.7 }); }
  cups.sort((a, b) => a.depth - b.depth);
  const cup = (c) => teacup(c.x, c.y, 1 + c.depth * 0.06, TC_COLS[c.i], c.self, tn, lw, t, c.i, o.riders !== false);
  for (const c of cups) if (c.depth < 0) s += cup(c);
  s += teapot(0, TC.top + 20, tn, lw, t);
  for (const c of cups) if (c.depth >= 0) s += cup(c);
  return s;
}
function teapot(x, y, tn, lw, t) {
  let s = E(x, y - 6, 300, 60, tn.fl('#000000', 0.12));
  s += P(`M${x + 270} ${y - 380} Q${x + 470} ${y - 420} ${x + 420} ${y - 250} Q${x + 380} ${y - 140} ${x + 250} ${y - 160}`, { fill: 'none', stroke: tn.line, 'stroke-width': f(lw * 7) }) + P(`M${x + 270} ${y - 380} Q${x + 470} ${y - 420} ${x + 420} ${y - 250} Q${x + 380} ${y - 140} ${x + 250} ${y - 160}`, { fill: 'none', stroke: tn.c(C.white), 'stroke-width': f(lw * 4.6) });
  s += P(`M${x - 270} ${y - 300} Q${x - 420} ${y - 330} ${x - 520} ${y - 560} L${x - 440} ${y - 570} Q${x - 360} ${y - 420} ${x - 250} ${y - 200} Z`, tn.ol(C.white, lw));
  s += E(x, y - 280, 330, 290, tn.ol(C.white, lw)) + P(`M${x - 300} ${y - 180} Q${x} ${y - 60} ${x + 300} ${y - 180}`, tn.ln(lw * 0.8, '#D8CCE8'));
  let fl = '';
  for (const [dx, dy] of [[-150, -320], [80, -230], [170, -400], [-60, -140]]) for (let k = 0; k < 5; k++) { const a = (k / 5) * TAU; fl += dC(x + dx + Math.cos(a) * 34, y + dy + Math.sin(a) * 34, 26); }
  s += P(fl, tn.fl(C.pink)) + [[-150, -320], [80, -230], [170, -400], [-60, -140]].map(([dx, dy]) => CI(x + dx, y + dy, 20, tn.fl(C.yellow))).join('');
  s += E(x, y - 560, 230, 50, tn.ol(C.lilac, lw)) + P(`M${x - 170} ${y - 570} Q${x} ${y - 740} ${x + 170} ${y - 570} Z`, tn.ol(C.lilac, lw)) + CI(x, y - 700, 50, tn.ol(C.pink, lw));
  s += P(`M${x - 200} ${y - 420} Q${x - 120} ${y - 500} ${x - 20} ${y - 510}`, tn.ln(lw * 2, '#FFFFFF', 0.7));
  return s;
}
// one giant cup (centre x, platform y), colours [main, shade], self = its own spin angle
function teacup(x, y, sc, cols, self, tn, lw, t, seed, riders) {
  const [c0, c1] = cols, w = 330 * sc, h = 300 * sc, rimY = y - h;
  let s = E(x, y - 10, w * 1.25, 58 * sc, tn.ol(lt(c0, 0.45), lw)) + E(x, y - 18, w * 0.8, 30 * sc, tn.fl(c1, 0.55));
  // handle (behind when it faces away)
  const hxp = Math.cos(self), back = Math.sin(self) < 0;
  const handle = () => P(`M${f(x + hxp * w * 0.86)} ${f(rimY + 50 * sc)} Q${f(x + hxp * w * 1.34)} ${f(rimY + 80 * sc)} ${f(x + hxp * w * 0.8)} ${f(rimY + 210 * sc)}`, { fill: 'none', stroke: tn.line, 'stroke-width': f(lw * 6.4 * sc) }) + P(`M${f(x + hxp * w * 0.86)} ${f(rimY + 50 * sc)} Q${f(x + hxp * w * 1.34)} ${f(rimY + 80 * sc)} ${f(x + hxp * w * 0.8)} ${f(rimY + 210 * sc)}`, { fill: 'none', stroke: tn.c(c0), 'stroke-width': f(lw * 4 * sc) });
  if (back) s += handle();
  // inside (dark), riders, then the bowl front
  s += E(x, rimY, w, 66 * sc, tn.ol(dk(c1, 0.35), lw));
  if (riders) {
    const n = 1 + (seed % 2), cheer = 0.6 + 0.4 * Math.sin(t * 3 + seed);
    const ppl = Array.from({ length: n }, (_, k) => ({ i: k, x: x + (n === 1 ? 0 : (k - 0.5) * 190 * sc), y: rimY + 380 * sc * 0.55, s: 0.5 * sc * (k ? 0.78 : 0.95), kid: !!k, back: false, shirt: CR_SHIRT[(seed * 3 + k * 5) % CR_SHIRT.length], skin: CR_SKIN[(seed + k * 2) % CR_SKIN.length], hair: CR_HAIR[(seed * 2 + k) % CR_HAIR.length], hk: (seed + k) % 5, hat: CR_HAT[seed % CR_HAT.length], pants: CR_PANTS[0], ball: null, ph: seed + k, up: 0.2 }));
    s += crowd([{ y: 0, s: 0.5 * sc, people: ppl }], { tone: tn, t, cheer: cheer > 0.5 ? 1 : 0.6 });
  }
  s += P(`M${f(x - w)} ${f(rimY)} Q${f(x - w * 0.98)} ${f(y - 30 * sc)} ${f(x - w * 0.35)} ${f(y - 30 * sc)} H${f(x + w * 0.35)} Q${f(x + w * 0.98)} ${f(y - 30 * sc)} ${f(x + w)} ${f(rimY)} A${f(w)} ${f(66 * sc)} 0 0 1 ${f(x - w)} ${f(rimY)} Z`, tn.ol(c0, lw));
  s += P(`M${f(x - w)} ${f(rimY)} Q${f(x - w * 0.98)} ${f(y - 30 * sc)} ${f(x - w * 0.35)} ${f(y - 30 * sc)} H${f(x + w * 0.35)} Q${f(x + w * 0.98)} ${f(y - 30 * sc)} ${f(x + w)} ${f(rimY)} A${f(w)} ${f(66 * sc)} 0 0 1 ${f(x - w)} ${f(rimY)} Z`, { fill: 'url(#sfPolka)', opacity: 0.55 });
  s += P(`M${f(x - w * 0.82)} ${f(rimY + 70 * sc)} Q${f(x - w * 0.78)} ${f(y - 80 * sc)} ${f(x - w * 0.4)} ${f(y - 66 * sc)}`, tn.ln(lw * 1.6 * sc, '#FFFFFF', 0.55));
  s += P(`M${f(x - w)} ${f(rimY)} A${f(w)} ${f(66 * sc)} 0 0 0 ${f(x + w)} ${f(rimY)}`, tn.ln(lw * 1.6, LINE)) + P(`M${f(x - w)} ${f(rimY)} A${f(w)} ${f(66 * sc)} 0 0 0 ${f(x + w)} ${f(rimY)}`, tn.ln(lw * 0.9, '#FFFFFF', 0.85));
  if (!back) s += handle();
  return s;
}
function teacupsFence(tn, lw, gate = [-600, -200]) {
  let rails = '', posts = '';
  const x0 = -TC.rx - 120, x1 = TC.rx + 120, y = 30;
  for (const [a, b] of [[x0, gate[0]], [gate[1], x1]]) { rails += dR(a, y - 210, b - a, 34) + dR(a, y - 110, b - a, 30); for (let x = a; x <= b + 1; x += 300) posts += dRR(x - 26, y - 250, 52, 250, 12); }
  return P(rails, tn.ol(C.white, lw * 0.8)) + P(posts, tn.ol(C.pink, lw * 0.8)) + signBoard(1980, -1240, 1000, 240, 'TEACUPS', 170, tn, lw, { fill: C.pink, txt: C.white, trim: C.butter }) + R(1850, -1120, 30, 1120, 8, tn.ol(C.white, lw * 0.8)) + R(2110, -1120, 30, 1120, 8, tn.ol(C.white, lw * 0.8));
}

// ================================================================= THE GIANT INFLATABLE DINOSAUR
// Local units (px at the fair's scale: a hero standing on it is s ≈ .28 = 1/5 of its height), origin = the ground under its
// body, facing screen-LEFT (head left, tail sloping down to the right). Bright orange with a butter belly, purple spots and
// yellow back plates, puffy tube segments with seams, tether ropes, a blower duct and a DINO BOUNCE sign.
// Wobble: the neck + head sway around the neck base, the tail around its root, the body squashes a little (feet fixed).
const DINO_COL = { body: '#FF7F3A', shade: '#E0602A', belly: '#FFE38A', spots: '#B356E0', plates: '#FFD23F', claws: '#FFF4D0', mouth: '#B8304A', tongue: '#FF7A9A' };
const DN = {
  neckPivot: [-150, -640], tailPivot: [270, -520],
  body: { cx: 0, cy: -470, rx: 400, ry: 320, rot: -8 },
  neck: [[-110, -600], [-190, -810], [-262, -980], [-330, -1130]], neckR: [195, 140],
  tail: [[260, -600], [540, -560], [720, -300], [930, -50]], tailR: [205, 34],
  legB: [[150, -330], [162, -220], [174, -120], [186, -44]], legF: [[-176, -250], [-184, -180], [-192, -110], [-202, -44]],
  arm: [[-330, -600], [-390, -585], [-440, -545], [-470, -500]],
  head: [[-235, -1125], [-262, -1290], [-360, -1388], [-490, -1392], [-610, -1340], [-740, -1280], [-800, -1205], [-782, -1122], [-700, -1078], [-530, -1058], [-385, -1032], [-275, -1052]],
  seat: [-450, -1390], hug: [-330, -1376],
};
function bez3(Pp, u) { const v = 1 - u; return [v * v * v * Pp[0][0] + 3 * v * v * u * Pp[1][0] + 3 * v * u * u * Pp[2][0] + u * u * u * Pp[3][0], v * v * v * Pp[0][1] + 3 * v * v * u * Pp[1][1] + 3 * v * u * u * Pp[2][1] + u * u * u * Pp[3][1]]; }
function bez3d(Pp, u) { const v = 1 - u; return [3 * v * v * (Pp[1][0] - Pp[0][0]) + 6 * v * u * (Pp[2][0] - Pp[1][0]) + 3 * u * u * (Pp[3][0] - Pp[2][0]), 3 * v * v * (Pp[1][1] - Pp[0][1]) + 6 * v * u * (Pp[2][1] - Pp[1][1]) + 3 * u * u * (Pp[3][1] - Pp[2][1])]; }
// tube along a cubic: { L, Rr (offset sides), C (centres), N (unit normals), r } with puffy segments
function tubeGeo(Pp, r0, r1, n = 22, segs = 4, puff = 0.07) {
  const L = [], Rr = [], Cc = [], N = [], rr = [];
  for (let i = 0; i <= n; i++) {
    const u = i / n, c = bez3(Pp, u), d = bez3d(Pp, u), len = Math.hypot(d[0], d[1]) || 1, nn = [-d[1] / len, d[0] / len];
    const fr = (u * segs) % 1, r = lerp(r0, r1, u) * (1 - puff + puff * 1.6 * Math.sin(Math.PI * fr));
    Cc.push(c); N.push(nn); rr.push(r);
    L.push([c[0] + nn[0] * r, c[1] + nn[1] * r]); Rr.push([c[0] - nn[0] * r, c[1] - nn[1] * r]);
  }
  return { L, R: Rr, C: Cc, N, r: rr, n, segs };
}
function tubeD(g) {
  const e = g.n, rE = g.r[e];
  let d = dL(g.L) + `A${f(rE)} ${f(rE)} 0 0 0 ${f(g.R[e][0])} ${f(g.R[e][1])}`;
  for (let i = e - 1; i >= 0; i--) d += `L${f(g.R[i][0])} ${f(g.R[i][1])}`;
  return d + 'Z';
}
// inner highlight version of a tube (offset toward its upper-left normal side, thinner)
function tubeInnerD(g, k = 0.78, off = [-0.12, -0.18]) {
  const L = [], Rr = [];
  for (let i = 0; i <= g.n; i++) { const c = g.C[i], nn = g.N[i], r = g.r[i] * k, ox = off[0] * g.r[i], oy = off[1] * g.r[i]; L.push([c[0] + nn[0] * r + ox, c[1] + nn[1] * r + oy]); Rr.push([c[0] - nn[0] * r + ox, c[1] - nn[1] * r + oy]); }
  return tubeD({ L, R: Rr, n: g.n, r: g.r.map((v) => v * k) });
}
function tubeSeams(g) { let d = ''; for (let j = 1; j < g.segs; j++) { const i = Math.round((j / g.segs) * g.n); const c = g.C[i], a = g.L[i], b = g.R[i]; d += `M${f(a[0])} ${f(a[1])}Q${f(c[0] + (c[0] - (a[0] + b[0]) / 2) * 0.4 + 8)} ${f(c[1] + 14)} ${f(b[0])} ${f(b[1])}`; } return d; }
const DG = (() => {
  const neck = tubeGeo(DN.neck, DN.neckR[0], DN.neckR[1], 20, 3, 0.06), tail = tubeGeo(DN.tail, DN.tailR[0], DN.tailR[1], 26, 5, 0.08);
  const legB = tubeGeo(DN.legB, 118, 108, 10, 2, 0.05), legF = tubeGeo(DN.legF, 124, 114, 10, 2, 0.05), arm = tubeGeo(DN.arm, 50, 40, 8, 1, 0.04);
  // the upper surface (climb) points: for each tube choose the side with the smaller y
  const upper = (g, k = 1) => g.C.map((c, i) => { const q = g.L[i][1] < g.R[i][1] ? g.L[i] : g.R[i]; return [c[0] + (q[0] - c[0]) * k, c[1] + (q[1] - c[1]) * k]; });
  return { neck, tail, legB, legF, arm, neckUp: upper(neck), tailUp: upper(tail), neckIn: upper(neck, 0.86), tailIn: upper(tail, 0.86) };
})();
const dinoPose = (t, wob) => ({ th: wob * (5.5 * Math.sin(t * 1.9) + 2 * Math.sin(t * 3.3 + 1)), tl: -wob * 3.5 * Math.sin(t * 1.9 + 0.7), sq: 1 + wob * 0.018 * Math.sin(t * 3.8) });
const rotAbout = (p, c, deg) => { const a = (deg * Math.PI) / 180, dx = p[0] - c[0], dy = p[1] - c[1]; return [c[0] + dx * Math.cos(a) - dy * Math.sin(a), c[1] + dx * Math.sin(a) + dy * Math.cos(a)]; };
// a local dino point (part 'body'|'neck'|'head'|'tail') -> local coords after the wobble
function dinoPt(p, part, pose) {
  let q = p;
  if (part === 'neck' || part === 'head') q = rotAbout(p, DN.neckPivot, pose.th);
  else if (part === 'tail') q = rotAbout(p, DN.tailPivot, pose.tl);
  return [q[0], q[1] * pose.sq];
}
// the climb path (tail tip on the ground -> up the tail -> over the back -> up the neck -> the head top), local
const DINO_CLIMB = (() => {
  const pts = [];
  const tu = DG.tailIn;
  for (let i = tu.length - 1; i >= 4; i -= 3) pts.push({ p: tu[i], part: 'tail' });
  const B = DN.body;
  for (const a of [-60, -80, -100, -118]) { const r = (a * Math.PI) / 180, rr = (B.rot * Math.PI) / 180; const ex = B.rx * 0.95 * Math.cos(r), ey = B.ry * 0.95 * Math.sin(r); pts.push({ p: [B.cx + ex * Math.cos(rr) - ey * Math.sin(rr), B.cy + ex * Math.sin(rr) + ey * Math.cos(rr)], part: 'body' }); }
  const nu = DG.neckIn;
  for (let i = 4; i < nu.length - 2; i += 3) pts.push({ p: nu[i], part: 'neck' });
  pts.push({ p: [-300, -1290], part: 'head' }, { p: [DN.hug[0], DN.hug[1]], part: 'head' });
  // cumulative length for climbAt(u)
  let L = 0;
  pts.forEach((q, i) => { if (i) L += Math.hypot(q.p[0] - pts[i - 1].p[0], q.p[1] - pts[i - 1].p[1]); q.l = L; });
  pts.forEach((q) => { q.u = q.l / L; });
  return pts;
})();
// u 0..1 along the climb -> { x, y, rot } local (after wobble); rot = surface slope (deg, + = clockwise)
function dinoClimbLocal(u, pose) {
  u = clamp(u, 0, 1);
  const pts = DINO_CLIMB;
  let i = 1;
  while (i < pts.length - 1 && pts[i].u < u) i++;
  const a = pts[i - 1], b = pts[i], k = (u - a.u) / Math.max(1e-6, b.u - a.u);
  const pa = dinoPt(a.p, a.part, pose), pb = dinoPt(b.p, b.part, pose);
  const x = lerp(pa[0], pb[0], k), y = lerp(pa[1], pb[1], k);
  const rot = (Math.atan2(pb[1] - pa[1], pb[0] - pa[0]) * 180) / Math.PI;
  return { x, y, rot: rot > 90 ? rot - 180 : rot < -90 ? rot + 180 : rot };
}
// draw the dinosaur (local units). o: { col, lw, wobble, t, tone, sign (true), ropes (true), face ('happy' | 'roar') }
function inflatableDino(t, o = {}) {
  const tn = o.tone || tone(), lw = o.lw ?? 6, col = { ...DINO_COL, ...(o.col || {}) }, pose = dinoPose(t, o.wobble ?? 0.5);
  const c = (k) => col[k];
  const part = (g, main, shade, extra = '') => P(tubeD(g), tn.ol(shade, lw)) + P(tubeInnerD(g), tn.fl(main)) + P(tubeSeams(g), tn.ln(lw * 0.6, dk(shade, 0.25), 0.55)) + extra;
  const plates = (pts, sizes) => {
    let d = '';
    pts.forEach(([p, nn], i) => { const s = sizes[i], bx = p[0], by = p[1], tx = -nn[1], ty = nn[0]; d += dSmooth([[bx - tx * s * 0.55, by - ty * s * 0.55], [bx + nn[0] * s * 0.9, by + nn[1] * s * 0.9], [bx + tx * s * 0.55, by + ty * s * 0.55]], true, 0.6); });
    return P(d, tn.ol(c('plates'), lw * 0.9));
  };
  const upN = (g, i) => (g.L[i][1] < g.R[i][1] ? g.N[i] : [-g.N[i][0], -g.N[i][1]]);
  let back = '', s = '';
  // ground shadow + blower duct + far rope
  back += E(60, -6, 760, 60, tn.fl('#000000', 0.16));
  if (o.ropes !== false) back += P('M120 -700 L560 0 M-260 -760 L-760 0', tn.ln(lw * 0.6, '#F6F0E2')) + R(548, -30, 24, 34, 4, tn.ol(C.iron, lw * 0.6)) + R(-772, -30, 24, 34, 4, tn.ol(C.iron, lw * 0.6));
  back += P('M330 -180 Q420 -120 460 -60 Q500 -10 600 -20', tn.ln(lw * 9, LINE)) + P('M330 -180 Q420 -120 460 -60 Q500 -10 600 -20', tn.ln(lw * 7, '#3A6AC8')) + R(580, -140, 190, 140, 20, tn.ol(C.iron, lw)) + CI(675, -70, 46, tn.ol(C.steelD, lw * 0.8));
  // back leg (shaded), tail (+ plates), body
  back += part(DG.legB, dk(c('body'), 0.18), dk(c('shade'), 0.18)) + E(196, -40, 160, 50, tn.ol(dk(c('shade'), 0.18), lw));
  const tailPl = [3, 7, 11, 15, 19].map((i) => [DG.tailUp[i], upN(DG.tail, i)]);
  const tailG = plates(tailPl, [120, 105, 88, 70, 52]) + part(DG.tail, c('body'), c('shade')) + P([4, 9, 15].map((i) => dC(DG.tail.C[i][0] + 10, DG.tail.C[i][1] - 6, DG.tail.r[i] * 0.32)).join(''), tn.fl(c('spots'), 0.85));
  s += G(tailG, `rotate(${f(pose.tl)} ${DN.tailPivot[0]} ${DN.tailPivot[1]})`);
  // neck + head group (wobble)
  const nu = DG.neckUp;
  let nh = plates([4, 9, 14].map((i) => [nu[i], upN(DG.neck, i)]), [130, 125, 115]);
  nh += part(DG.neck, c('body'), c('shade'), P(dSmooth(DG.neck.C.slice(2, 19).map((p, i) => { const k = i + 2, nn = DG.neck.N[k], sgn = DG.neck.L[k][1] < DG.neck.R[k][1] ? -1 : 1; return [p[0] + nn[0] * DG.neck.r[k] * 0.55 * sgn, p[1] + nn[1] * DG.neck.r[k] * 0.55 * sgn]; }), false), tn.ln(lw * 9, c('belly'), 0.9)));
  // head: plates on top, skull, snout, eyes, mouth
  nh += plates([[[-300, -1330], [0.55, -0.83]], [[-400, -1385], [0.1, -1]]], [110, 96]);
  nh += P(dSmooth(DN.head), tn.ol(c('shade'), lw)) + P(dSmooth(DN.head.map(([x, y]) => [x + (x + 500) * -0.06 - 6, y + (y + 1220) * -0.1 - 12])), tn.fl(c('body')));
  nh += P(dC(-640, -1330, 30) + dC(-300, -1220, 34) + dC(-560, -1110, 22), tn.fl(c('spots'), 0.85));
  const roar = o.face === 'roar';
  const mouthD = roar ? 'M-796 -1180 Q-700 -1120 -560 -1140 Q-640 -1020 -770 -1060 Z' : 'M-790 -1168 Q-680 -1098 -520 -1140 Q-640 -1080 -760 -1100 Z';
  nh += P(mouthD, tn.ol(c('mouth'), lw * 0.9)) + (roar ? E(-690, -1085, 60, 24, tn.fl(c('tongue'))) : E(-660, -1108, 60, 16, tn.fl(c('tongue'))));
  nh += P('M-770 -1168 l18 34 l18 -30 M-725 -1150 l18 32 l18 -28 M-680 -1138 l17 30 l17 -26 M-635 -1132 l16 28 l16 -26', { fill: tn.c('#FFFFFF'), stroke: tn.line, 'stroke-width': f(lw * 0.5), 'stroke-linejoin': 'round' });
  nh += P('M-520 -1140 q-10 -26 14 -34', tn.ln(lw * 0.8));
  nh += E(-752, -1236, 12, 9, tn.fl(dk(c('shade'), 0.5))) + E(-716, -1252, 12, 9, tn.fl(dk(c('shade'), 0.5)));
  // eyes (3/4: both on the upper head, looking a little down at the crowd)
  const look = o.look || [-0.25, 0.35];
  for (const [ex, ey, rx, ry] of [[-560, -1262, 60, 70], [-418, -1290, 54, 64]]) {
    nh += E(ex, ey - 30, rx + 10, 34, tn.fl(c('shade'))) + E(ex, ey, rx, ry, tn.ol('#FFFFFF', lw)) + CI(ex + look[0] * rx * 0.45, ey + look[1] * ry * 0.45, rx * 0.46, tn.fl(LINE)) + CI(ex + look[0] * rx * 0.45 - rx * 0.18, ey + look[1] * ry * 0.45 - ry * 0.2, rx * 0.15, tn.fl('#FFFFFF'));
  }
  nh += E(-640, -1170, 40, 22, tn.fl('#FF6F8F', 0.45)) + P('M-470 -1360 Q-380 -1400 -300 -1350', tn.ln(lw * 2.6, '#FFFFFF', 0.45));
  // the neck comes out from BEHIND the body (its base stays hidden while it sways)
  s += G(nh, `rotate(${f(pose.th)} ${DN.neckPivot[0]} ${DN.neckPivot[1]})`);
  const B = DN.body;
  const bodyPl = [-70, -88, -106].map((a) => { const r = (a * Math.PI) / 180, rr = (B.rot * Math.PI) / 180, ex = B.rx * Math.cos(r), ey = B.ry * Math.sin(r); const p = [B.cx + ex * Math.cos(rr) - ey * Math.sin(rr), B.cy + ex * Math.sin(rr) + ey * Math.cos(rr)]; const nl = Math.hypot(p[0] - B.cx, p[1] - B.cy); return [p, [(p[0] - B.cx) / nl, (p[1] - B.cy) / nl]]; });
  s += plates(bodyPl, [140, 150, 140]);
  s += G(E(0, 0, B.rx, B.ry, tn.ol(c('shade'), lw)) + E(-22, -30, B.rx - 34, B.ry - 46, tn.fl(c('body'))), `translate(${B.cx} ${B.cy}) rotate(${B.rot})`);
  s += G(E(-170, 40, 210, 220, tn.fl(c('belly'))) + P('M-340 -40 Q-170 -10 -10 -40 M-360 60 Q-170 90 0 60 M-330 160 Q-170 185 -40 160', tn.ln(lw * 0.7, dk(c('belly'), 0.2), 0.6)), `translate(${B.cx} ${B.cy}) rotate(${B.rot})`);
  s += P(dC(120, -620, 54) + dC(220, -470, 40) + dC(40, -700, 30) + dC(160, -330, 34), tn.fl(c('spots'), 0.85));
  s += P('M-260 -700 Q-120 -780 60 -770', tn.ln(lw * 3.2, '#FFFFFF', 0.45));
  // front leg + foot + claws, arm
  s += part(DG.legF, c('body'), c('shade')) + G(E(0, 0, 175, 150, tn.ol(c('shade'), lw)) + E(-16, -20, 145, 118, tn.fl(c('body'))) + P('M-110 -60 Q-40 -120 60 -110', tn.ln(lw * 2.2, '#FFFFFF', 0.4)), 'translate(-150 -300) rotate(-15)');
  s += E(-218, -40, 175, 54, tn.ol(c('shade'), lw)) + E(-228, -52, 150, 36, tn.fl(c('body')));
  s += P(dE(-360, -44, 34, 26) + dE(-290, -24, 34, 26) + dE(-215, -16, 32, 24), tn.ol(c('claws'), lw * 0.7));
  // near arm on the body (not in the wobble group)
  s += part(DG.arm, c('body'), c('shade')) + P(dE(-488, -480, 20, 14) + dE(-470, -462, 20, 14), tn.ol(c('claws'), lw * 0.6));
  let front = '';
  if (o.ropes !== false) front += P('M-120 -230 L-520 0 M300 -260 L780 0', tn.ln(lw * 0.6, '#F6F0E2')) + R(-532, -30, 24, 34, 4, tn.ol(C.iron, lw * 0.6)) + R(768, -30, 24, 34, 4, tn.ol(C.iron, lw * 0.6));
  if (o.sign !== false) front += G(P('M-150 0 L-110 -330 M150 0 L110 -330', tn.ln(lw * 1.6, C.woodD)) + R(-230, -420, 460, 220, 26, tn.ol(C.lime, lw)) + T('DINO', 0, -326, 96, tn.c('#FFFFFF'), OUTX(lw * 1.2, tn.line)) + T('BOUNCE', 0, -228, 80, tn.c(C.yellow), OUTX(lw * 1.2, tn.line)), 'translate(-980 0)');
  return back + G(s, pose.sq !== 1 ? `scale(1 ${f(pose.sq)})` : null) + front;
}

// ================================================================= 1. THE FAIR (long camera-taking world)
// World (k 1 plane): the fairground from the back grass (y 700) to the camera; stand line FLOOR 960 (hero s .4); depth
// scale sAt(y) = .4·(y − 420)/540. Left → right: the TOWN FAIR arch (x −2300) + ticket booth, GRANDPA'S BENCH under its
// lamp (x −1050), the BALLOON POP game booth (x 150), the balloon cart (x 880), the COTTON CANDY stand (x 1720), the GIANT
// TEACUPS (x 3200), the GIANT INFLATABLE DINOSAUR (x 5250). Behind: the back row of tents + food stalls + string lights
// (k .8), the FERRIS WHEEL (k .6, hub x 1150) and the swing ride (k .6), far rides (k .3: big top, drop tower) + tree line,
// the hills with the town (k .12), clouds (k .04), sun/moon (k .02), sky (k 0).
const FA = { floor: 960, s: 0.4, hor: 420, back: 700 };
const faS = (y) => FA.s * (y - FA.hor) / (FA.floor - FA.hor);
const FA_X = { arch: -2300, ticket: -1660, bench: -1050, lamp: -680, booth: 150, cart: 880, cotton: 1720, teacups: 3200, dino: 5250 };
const FA_Y = { arch: 780, ticket: 800, bench: 905, lamp: 880, booth: 830, cart: 880, cotton: 845, teacups: 870, dino: 800 };
const FA_LAMPS = [[-680, 880], [1250, 870], [2450, 860], [4150, 860], [6350, 860]];
const FA_POLES = [-2900, -1900, -1520, -380, 500, 1300, 2150, 2750, 3850, 4550, 6050, 6900];
const FA_FERRIS = { x: 1150, y: 190, r: 430, k: 0.6 };
const FA_LAMP_H = 1750;
const FA_SWING = { x: 2950, y: 760, k: 0.6 };
// crowd fill rows (k 1): behind the stand lines (in mid) and the packed rows in front of it (L.crowd)
const FA_BACK_ROWS = [752, 784, 816, 848];
// the packed rows in front of the stand line: a fixed sequence (stable looks), only the visible ones are drawn
const FA_FRONT_ROWS = (() => { const r = []; let y = 1010; while (y <= 1520) { r.push(Math.round(y)); y += 72 * faS(y) / faS(1010); } return r; })();
const FA_GAPS = [[-1420, -560]];
const rowFor = (y, i, front) => ({ y, s: faS(y), seed: 11 + i * 7 + (front ? 50 : 0), dens: front ? 0.94 : [0.6, 0.72, 0.8, 0.86][i] ?? 0.8, gaps: front ? [] : FA_GAPS, jit: 12 });
// rows of one group that can be seen through this cam (head tops above the frame bottom, feet below the frame top)
function fairRows(front, cam) {
  const v = vis(cam, 1);
  const ys = front ? FA_FRONT_ROWS : FA_BACK_ROWS;
  const out = [];
  for (let i = 0; i < ys.length; i++) {
    const y = ys[i], s = faS(y);
    if (y - 1150 * s > v.y1 + 20) break;
    if (y < v.y0 - 20) continue;
    out.push(rowFor(y, i, front));
  }
  out.forEach((r, i) => { if (i < out.length - 1) r.legs = false; });
  return out;
}

function fairLayers(t, cam, o) {
  const st = frameState(o, 'dusk');
  const { tn, lights: lit } = st;
  const crowdD = b01(o.crowd, 0.6), packed = b01(o.packed), cheer = b01(o.cheer), wob = o.wobble ?? 0.5;
  const tF = st.tnFar(0.18);
  // ---- sky (k 0), sun/moon (k .02), clouds (k .04), far town (k .12), far rides + tree line (k .3)
  const v0 = vis(cam, 0);
  let bg = V(cam, sky(v0, st) + moon(st), 0) + V(cam, sunDisc(st), 0.02) + V(cam, clouds(vis(cam, 0.04), st, t), 0.04);
  bg += V(cam, farTown(vis(cam, 0.12), st, t, 690), 0.12);
  const v3 = vis(cam, 0.3), tn3 = st.tnFar(0.42);
  let far = '';
  if (v3.x1 > -900 && v3.x0 < 500) { const a = lightsAcc(tn3, lit, t); far += G(dropTower(tn3, 6, lit, t, a) + a.out(2.4), tr(-380, 745, 0.7)); }
  if (v3.x1 > 1500 && v3.x0 < 2600) far += G(bigTop(tn3, 8, t), tr(2050, 742, 0.5));
  if (v3.x1 > 3500 && v3.x0 < 4300) far += G(bigTop(tn3, 8, t + 3), tr(3900, 745, 0.42));
  bg += V(cam, treeLine(v3, st, 750) + far, 0.3);
  // drifting balloons (k .45) — a few lost balloons rising into the evening
  const v45 = vis(cam, 0.45);
  let fl = '';
  for (let i = Math.floor((v45.x0 - 400) / 900); i * 900 < v45.x1 + 400; i++) {
    if (hash(i * 4.7) < 0.4) continue;
    const x = i * 900 + 600 * hash(i * 2.2) + Math.sin(t * 0.7 + i) * 20, y = 760 - md(t * 26 + hash(i * 3.9) * 1400, 1400);
    fl += balloon(x, y, 0.22, CR_BALL[md(i, CR_BALL.length)], t + i, { tone: tF, string: 260, lw: 22 });
  }
  bg += V(cam, fl, 0.45);
  // ---- Ferris wheel + swing ride (k .6)
  const v6 = vis(cam, 0.6), tn6 = st.tnFar(0.12);
  let rides = R(v6.x0 - 300, 740, v6.x1 - v6.x0 + 600, 900, 0, tn6.fl('#6E5A8A'));
  if (v6.x1 > FA_FERRIS.x - 800 && v6.x0 < FA_FERRIS.x + 800) { const a = lightsAcc(tn6, lit, t); rides += G(ferrisWheel(FA_FERRIS.r, tn6, 4, lit, t, { acc: a, speed: o.wheel ?? 1 }) + a.out(2.4), tr(FA_FERRIS.x, FA_FERRIS.y)); }
  if (v6.x1 > FA_SWING.x - 600 && v6.x0 < FA_SWING.x + 600) { const a = lightsAcc(tn6, lit, t); rides += G(swingRide(tn6, 5, lit, t, a) + a.out(2.4), tr(FA_SWING.x, FA_SWING.y, 0.8)); }
  bg += V(cam, rides, 0.6);
  // ---- back row of tents + stalls + string lights (k .8)
  const v8 = vis(cam, 0.8), tn8 = st.tnFar(0.08), acc8 = lightsAcc(tn8, lit, t), sc8 = 0.27;
  let row = R(v8.x0 - 300, 732, v8.x1 - v8.x0 + 600, 900, 0, tn8.fl(C.sandD));
  const step8 = 460;
  for (let i = Math.floor((v8.x0 - 400) / step8); i * step8 < v8.x1 + 400; i++) {
    const K_ = STALL_KINDS[md(i, STALL_KINDS.length)], x = i * step8 + 60 * hash(i * 1.7), lw8 = 6 / sc8;
    const svg = K_.kind === 'tent' ? tent(1300 + 280 * hash(i * 3.1), 980 + 200 * hash(i * 5.3), K_.cols[0], K_.cols[1], tn8, lw8, lit, t, i) : stall(1150, K_.label, K_.cols[0], K_.cols[1], tn8, lw8, lit);
    row += G(svg, tr(x, 740, sc8 * (0.92 + 0.12 * hash(i * 2.9))));
    if (md(i, 2) === 0) { const px = x + step8 / 2; row += R(px - 4, 400, 8, 340, 3, tn8.fl(C.iron)); acc8.string(px, 412, px + step8, 412, 46, 40, 5.5, i); }
  }
  bg += V(cam, row + acc8.out(2), 0.8);
  // ---- main plane (k 1)
  const v1 = vis(cam, 1), X0 = Math.floor((v1.x0 - 300) / 100) * 100, X1 = v1.x1 + 300;
  const inX = (x, w = 900) => x + w > X0 && x - w < X1;
  let ground = R(X0, FA.back, X1 - X0, 60, 0, tn.fl(C.grassD)) + R(X0, FA.back, X1 - X0, 60, 0, { fill: 'url(#sfGrassTex)' });
  ground += R(X0, FA.back + 40, X1 - X0, 2600, 0, tn.fl(C.sand)) + specks(X0, X1, FA.back + 50, Math.min(v1.y1 + 40, 3300), tn);
  ground += P(`M${X0} ${FA.back + 40}H${X1}`, tn.ln(4, C.sandD, 0.8));
  // the trodden midway: a lighter walkway band with soft edges + scattered litter (popcorn boxes, tickets, cups)
  ground += P(`M${X0} 872 H${X1} V1050 H${X0} Z`, tn.fl(C.sand2 || '#F0D0A4', 0.55)) + P(`M${X0} 872 H${X1} M${X0} 1050 H${X1}`, tn.ln(3, C.sandD, 0.35));
  let litter = '', litR = '';
  for (let i = Math.floor(X0 / 380); i * 380 < X1; i++) {
    const h = hash(i * 6.3), x = i * 380 + 300 * hash(i * 2.9), y = 780 + 420 * hash(i * 4.1), s = faS(y);
    if (h < 0.45) litter += dR(x, y - 14 * s, 60 * s, 16 * s); else if (h < 0.7) litR += dP([[x, y], [x + 70 * s, y - 6 * s], [x + 78 * s, y + 18 * s], [x + 6 * s, y + 22 * s]]);
  }
  ground += P(litter, tn.fl('#FFFFFF', 0.5)) + P(litR, tn.fl(C.red, 0.55));
  // light pools on the ground (lamps / stalls) at dusk
  if (lit > 0.05) { let pools = ''; for (const [x, y] of FA_LAMPS) if (inX(x)) pools += dE(x, y + 30, 260, 50); for (const x of [FA_X.booth, FA_X.cotton]) if (inX(x)) pools += dE(x, FA_Y.cotton + 50, 380, 64); ground += P(pools, { fill: '#FFE6A0', opacity: op(0.3 * lit) }); }
  // the depth-sorted items
  const items = [];
  const add = (y, svg) => { if (svg) items.push([y, svg]); };
  // string-light poles (k 1, back line) + strings over the fair (behind everything nearer than the poles)
  const acc1 = lightsAcc(tn, lit, t);
  for (let i = 0; i < FA_POLES.length - 1; i++) {
    const a = FA_POLES[i], b = FA_POLES[i + 1];
    if (b < X0 - 200 || a > X1 + 200) continue;
    acc1.string(a, 230 + 30 * hash(i), b, 230 + 30 * hash(i + 1), 64, 64, 9, i * 3);
  }
  let poles = '';
  for (const x of FA_POLES) if (inX(x, 100)) poles += G(R(-14, -530, 28, 530, 6, tn.ol(C.woodD, 5)) + CI(0, -536, 14, tn.ol(C.yellow, 4)), tr(x, 752));
  add(752, poles + acc1.out(3));
  // arch + ticket booth
  if (inX(FA_X.arch, 1000)) { const sc = faS(FA_Y.arch), accA = lightsAcc(tn, lit, t); add(FA_Y.arch, G(archSign(tn, 6 / sc, lit, t, accA) + accA.out(6 / sc * 0.4), tr(FA_X.arch, FA_Y.arch, sc))); }
  if (inX(FA_X.ticket, 300)) { const sc = faS(FA_Y.ticket); add(FA_Y.ticket, G(ticketBooth(tn, 6 / sc, lit, t), tr(FA_X.ticket, FA_Y.ticket, sc))); }
  // bench + its lamp
  if (inX(FA_X.bench, 600)) { const sc = faS(FA_Y.bench); add(FA_Y.bench, G(bench(tn, 6 / sc), tr(FA_X.bench, FA_Y.bench, sc))); }
  for (const [x, y] of FA_LAMPS) if (inX(x, 200)) { const sc = faS(y); add(y, G(lampPost(tn, 6 / sc, lit, FA_LAMP_H), tr(x, y, sc))); }
  // game booth, balloon cart, cotton candy (their counters go to `front`)
  let front = '';
  if (inX(FA_X.booth, 400)) { const sc = faS(FA_Y.booth); add(FA_Y.booth, G(gameBooth(tn, 6 / sc, lit, t), tr(FA_X.booth, FA_Y.booth, sc))); front += G(gameCounter(tn, 6 / sc), tr(FA_X.booth, FA_Y.booth, sc)); }
  if (inX(FA_X.cart, 400)) { const sc = faS(FA_Y.cart); add(FA_Y.cart, G(balloonCart(tn, 6 / sc, t), tr(FA_X.cart, FA_Y.cart, sc))); }
  if (inX(FA_X.cotton, 400)) { const sc = faS(FA_Y.cotton); add(FA_Y.cotton, G(cottonCandyStand(tn, 6 / sc, lit, t), tr(FA_X.cotton, FA_Y.cotton, sc))); front += G(cottonCounter(tn, 6 / sc), tr(FA_X.cotton, FA_Y.cotton, sc)); }
  // teacups (+ fence just in front of the platform)
  if (inX(FA_X.teacups, 900)) {
    const sc = faS(FA_Y.teacups), accT = lightsAcc(tn, lit, t);
    add(FA_Y.teacups - 1, G(teacupsRide(tn, 6 / sc, lit, t, { acc: accT, spin: o.spin ?? 1, riders: o.riders }) + accT.out(6 / sc * 0.4), tr(FA_X.teacups, FA_Y.teacups - 10, sc)));
    add(FA_Y.teacups + 18, G(teacupsFence(tn, 6 / sc), tr(FA_X.teacups, FA_Y.teacups + 18, sc)));
  }
  // THE DINOSAUR
  if (inX(FA_X.dino, 1300)) add(FA_Y.dino, G(inflatableDino(t, { tone: tn, wobble: wob, face: o.dinoFace, col: o.dinoCol, look: o.dinoLook }), tr(FA_X.dino, FA_Y.dino)));
  // crowd fill rows behind the stand lines
  const cx0 = v1.x0 - 200, cx1 = v1.x1 + 200;
  if (crowdD > 0.001) for (const r of fairRows(false, cam)) add(r.y + 0.5, crowd([{ ...r, people: crowdPeople(r, cx0, cx1, crowdD) }], { tone: st.tnCrowd, t, cheer, zoom: v1.z, light: 0.84 + 0.16 * clamp((r.y - 740) / 110, 0, 1) }));
  items.sort((a, b) => a[0] - b[0]);
  let mid = ground + items.map((x) => x[1]).join('');
  if (o.balloon) { const b = o.balloon; mid += dinoBalloon(b.x, b.y, b.s ?? 0.5, t, { tone: tn }); }
  // ---- packed crowd rows in front of the stand line (L.crowd)
  let crowdL = '';
  if (packed > 0.001) crowdL = V(cam, crowd(fairRows(true, cam).map((r) => ({ ...r, people: crowdPeople(r, cx0, cx1, packed) })), { tone: st.tnCrowd, t, cheer, zoom: v1.z }), 1);
  // ---- fg (k 1.3): near heads (dark backs of heads along the bottom edge) + canopy string lights
  const v13 = vis(cam, 1.3);
  let fg = '';
  const near = b01(o.near);
  if (near > 0) { const sN = 0.62 / v13.z; fg += crowd([{ y: v13.y1 + 330 * sN, s: sN, seed: 91, dens: 0.75 * near, jit: 40 * sN }], { tone: st.tnCrowd, t, cheer: cheer * 0.6, light: 0.16, faces: false, x0: v13.x0 - 200, x1: v13.x1 + 200, zoom: v13.z }); }
  if (o.canopy) {
    const accF = lightsAcc(tn, lit, t), cy = v13.y0 + 60;
    for (let i = Math.floor((v13.x0 - 800) / 700); i * 700 < v13.x1 + 800; i++) accF.string(i * 700, cy, (i + 1) * 700, cy, 110, 96, 22, i);
    fg += accF.out(5);
  }
  // ---- light
  let light = '';
  if (lit > 0.03) {
    let gl = '';
    for (const [x, y] of FA_LAMPS) if (inX(x, 300)) { const sc = faS(y); gl += glow(x, y - (FA_LAMP_H + 30) * sc, 440 * sc, 'sfGlowWarm', 0.85 * lit); }
    if (inX(FA_X.cotton, 500)) gl += glow(FA_X.cotton, FA_Y.cotton - 900 * faS(FA_Y.cotton), 280, 'sfGlowPink', 0.5 * lit);
    if (inX(FA_X.booth, 500)) gl += glow(FA_X.booth, FA_Y.booth - 1000 * faS(FA_Y.booth), 250, 'sfGlowCyan', 0.35 * lit);
    if (inX(FA_X.arch, 900)) gl += glow(FA_X.arch, FA_Y.arch - 2200 * faS(FA_Y.arch), 300, 'sfGlowGold', 0.4 * lit);
    light += V(cam, gl, 1);
    if (v6.x1 > FA_FERRIS.x - 500 && v6.x0 < FA_FERRIS.x + 500) light += V(cam, glow(FA_FERRIS.x, FA_FERRIS.y, 160, 'sfGlowPink', 0.45 * lit), 0.6);
  }
  if (st.w.golden > 0.05) {
    let rays = '';
    for (let i = 0; i < 5; i++) { const a = 200 + i * 9, len = 2600; rays += dP([[1430, 480], [1430 + Math.cos(((a - 2) * Math.PI) / 180) * len, 480 + Math.sin(((a - 2) * Math.PI) / 180) * len], [1430 + Math.cos(((a + 2) * Math.PI) / 180) * len, 480 + Math.sin(((a + 2) * Math.PI) / 180) * len]]); }
    light += G(P(rays, { fill: '#FFE6A8', opacity: op(0.07 * st.w.golden) }), camTf(cam, 0.02)) + R(-50, -50, 2020, 1180, 0, { fill: '#FFB85A', opacity: op(0.05 * st.w.golden) });
  }
  if (st.w.dusk + st.w.golden > 0.05) light += R(-50, 760, 2020, 400, 0, { fill: 'url(#sfFloorFade)', opacity: op(0.6 * st.w.dusk + 0.4 * st.w.golden) });
  if (o.flash > 0) light += R(-50, -50, 2020, 1180, 0, { fill: '#FFFFFF', opacity: op(o.flash) });
  return layersOf(bg, V(cam, mid, 1), V(cam, front, 1), crowdL, V(cam, fg, 1.3), light);
}
const fair = camSet(fairLayers);
// screen positions of the visible crowd-fill heads (for HUD plates over the crowd): [{x, y (top of head), s (screen scale), row, i}]
// o: the same options you pass to fair (crowd, packed); which: 'back' | 'front' | 'all'
function crowdHeads(cam, o = {}, which = 'all') {
  const v1 = vis(cam, 1), out = [];
  const crowdD = b01(o.crowd, 0.6), packed = b01(o.packed);
  const rows = [...(which !== 'front' ? fairRows(false, cam).map((r) => [r, crowdD]) : []), ...(which !== 'back' ? fairRows(true, cam).map((r) => [r, packed]) : [])];
  for (const [r, d] of rows) {
    if (d <= 0.001) continue;
    for (const p of crowdPeople(r, v1.x0 - 200, v1.x1 + 200, d)) {
      const sp = toScreen(cam, { x: p.x, y: p.y - 750 * p.s, k: 1 });
      if (sp.x < -80 || sp.x > 2000 || sp.y < -80 || sp.y > 1160) continue;
      out.push({ x: Math.round(sp.x), y: Math.round(sp.y), s: rs(p.s * sp.z), row: r.y, i: p.i, kid: p.kid });
    }
  }
  return out;
}
// the dinosaur in fair-world coords at time t: seat (Max on its head), climbAt(u), hug spot. All {x, y, rot, s, k: 1}
const FA_DINO_S = rs(faS(FA_Y.dino));
function fairDinoAt(fn, wob) {
  return (t, w = wob) => { const pose = dinoPose(t, w); const p = fn(pose); return { x: Math.round(FA_X.dino + p.x), y: Math.round(FA_Y.dino + p.y), rot: rs(p.rot || 0), s: FA_DINO_S, k: 1 }; };
}
const dinoLocalSpot = (pt) => (pose) => { const q = dinoPt(pt, 'head', pose); return { x: q[0], y: q[1], rot: pose.th }; };

// ================================================================= 2. GRANDPA'S BENCH (close two-shot, room set)
// World = the 1920×1080 frame (padded x −700…2620 for pans / zoom-outs to ~.7): the bench (centre x 960, floor 1000) under the
// lamp (x 300), a soft out-of-focus carnival behind (no outlines, low contrast: Ferris wheel, tents, bokeh light discs).
// Seats at s .58: the hero / Grandpa sit with their hips on the seat (y SEAT) using the SIT pose.
const BN = { floor: 1000, s: 0.58, x: 960, w: 1520, lamp: 300, lampH: 1340 };
const BN_SEAT = BN.floor - SEAT_H * BN.s;
function fairBenchLayers(t, o) {
  const st = frameState(o, 'dusk');
  const { tn, lights: lit, w } = st;
  const soft = st.tnFar(0.42);
  const bok = b01(o.bokeh, 1);
  // ---- bg (blurred carnival; composed at parallax .6)
  let bg = sky({ x0: -900, x1: 2820 }, st) + G(sunDisc(st), 'translate(380 -20)');
  bg += P(`M-900 760 Q-300 690 300 730 T1500 720 T2820 740 V1400 H-900 Z`, soft.fl('#6E6A9A'));
  // soft Ferris wheel (no outline)
  const wc = soft.c('#E8C8F0'), a0 = t * 0.06;
  let sp = '';
  for (let i = 0; i < 16; i++) { const a = a0 + (i / 16) * TAU; sp += `M1420 380L${f(1420 + Math.cos(a) * 420)} ${f(380 + Math.sin(a) * 420)}`; }
  bg += P(sp, { fill: 'none', stroke: wc, 'stroke-width': 10, opacity: 0.35 }) + CI(1420, 380, 420, { fill: 'none', stroke: wc, 'stroke-width': 26, opacity: 0.45 }) + CI(1420, 380, 350, { fill: 'none', stroke: wc, 'stroke-width': 12, opacity: 0.35 });
  bg += P('M1420 380 L1180 860 M1420 380 L1660 860', { fill: 'none', stroke: wc, 'stroke-width': 26, opacity: 0.4 });
  let gond = '';
  for (let i = 0; i < 12; i++) { const a = a0 + (i / 12) * TAU; gond += dRR(1420 + Math.cos(a) * 420 - 40, 380 + Math.sin(a) * 420 + 10, 80, 70, 24); }
  bg += P(gond, { fill: soft.c('#C87AB8'), opacity: 0.6 });
  // soft tents
  let tents = '';
  for (const [x, wdt, h] of [[-420, 520, 300], [140, 600, 360], [760, 480, 280], [2100, 620, 340], [2600, 500, 300]]) tents += dP([[x - wdt / 2, 800], [x - wdt / 2, 800 - h * 0.45], [x, 800 - h], [x + wdt / 2, 800 - h * 0.45], [x + wdt / 2, 800]]);
  bg += P(tents, { fill: soft.c('#C86A8A'), opacity: 0.55 }) + R(-900, 790, 3720, 700, 0, soft.fl('#8A6A9A'));
  // bokeh discs (string lights out of focus)
  if (bok > 0) {
    const cols = ['#FFE6A0', '#FFB870', '#FF8AC0', '#9AE8FF', '#FFF4D0'];
    const by = cols.map(() => ['', '']);
    for (let i = 0; i < 64; i++) {
      const arc = i % 3, u = hash(i * 3.7), x = -700 + u * 3300, y = [250, 470, 640][arc] + 4 * [110, 70, 50][arc] * (md(u * 3, 1)) * (1 - md(u * 3, 1)) + 30 * hash(i * 5.1);
      const r = [26, 34, 44][Math.floor(hash(i * 7.3) * 3)] * (lit > 0.2 ? 1 : 0.8) * (1 + 0.08 * Math.sin(t * 2 + i));
      by[i % cols.length][hash(i * 9.1) > 0.5 ? 0 : 1] += dC(x, y, r);
    }
    by.forEach(([a, b], i) => { bg += P(a, { fill: cols[i], opacity: op((0.18 + 0.32 * lit) * bok) }) + P(b, { fill: cols[i], opacity: op((0.1 + 0.2 * lit) * bok) }); });
    let big = '';
    for (let i = 0; i < 9; i++) big += dC(-500 + hash(i * 2.9) * 3000, 120 + hash(i * 4.4) * 600, 70 + 50 * hash(i * 6.1));
    bg += P(big, { fill: '#FFE6C0', opacity: op(0.08 * bok * (0.5 + lit)) });
  }
  // ---- mid: ground, flower bed behind the bench, the lamp, the bench
  let mid = R(-900, 880, 3720, 900, 0, tn.fl(C.grassD)) + R(-900, 880, 3720, 900, 0, { fill: 'url(#sfGrassTex)' });
  mid += P('M-900 930 Q960 900 2820 930 V1800 H-900 Z', tn.fl(C.sand)) + specks(-300, 2220, 935, 1300, tn, 3) + P('M-900 930 Q960 900 2820 930', tn.ln(5, C.sandD, 0.8));
  // hedge + flowers behind the bench
  let hedge = '', flw = new Map();
  for (let i = 0; i < 16; i++) { const x = 330 + i * 86; hedge += dC(x, 820 - 18 * hash(i), 70 + 16 * hash(i * 2.1)); }
  mid += P(hedge, tn.ol('#4F9A52', 5)) + R(240, 806, 1440, 110, 20, tn.ol('#4F9A52', 5));
  for (let i = 0; i < 22; i++) { const x = 300 + i * 64 + 20 * hash(i * 3.3), y = 770 + 70 * hash(i * 5.7), c = [C.pink, C.yellow, '#FFFFFF', C.orange][i % 4]; flw.set(c, (flw.get(c) || '') + dC(x, y, 14)); }
  for (const [c, d] of flw) mid += P(d, tn.ol(c, 3));
  mid += G(lampPost(tn, 6 / BN.s, lit, BN.lampH), tr(BN.lamp, BN.floor - 40, BN.s));
  mid += E(BN.x, BN.floor + 8, BN.w * BN.s * 0.62, 34, tn.fl('#000000', 0.16));
  mid += G(bench(tn, 6 / BN.s, BN.w), tr(BN.x, BN.floor, BN.s));
  // a popcorn box on the bench end + Max's balloon tied to the armrest (opt-in)
  if (o.popcorn) mid += G(P('M-60 0 L-80 -200 L80 -200 L60 0 Z', tn.ol(C.white, 10)) + P('M-40 0 L-56 -200 M0 0 L0 -200 M40 0 L56 -200', tn.ln(16, C.red)) + P(dSmooth([[-90, -200], [-70, -260], [-20, -280], [30, -270], [80, -250], [90, -200]]), tn.ol(C.butter, 8)), tr(BN.x + 610 * BN.s, BN_SEAT, BN.s));
  if (o.balloon) mid += dinoBalloon(BN.x + 720 * BN.s - 20, BN_SEAT - 330, 0.55, t, { tone: tn, string: 280 });
  // ---- front / fg: soft foreground bokeh in the corners (opt-in fg)
  let fg = '';
  if (o.fgBokeh) fg += P(dC(80, 1020, 150) + dC(1840, 980, 120) + dC(1760, 80, 90), { fill: '#FFE0A0', opacity: op(0.12 * (0.5 + lit)) });
  // ---- light (screen space): lamp glow + pool, golden wash, quiet dim
  let light = '';
  const gy = BN.floor - 40 - (BN.lampH + 30) * BN.s;
  if (lit > 0.03) light += glow(BN.lamp, gy, 330, 'sfGlowWarm', 0.9 * lit) + E(BN.lamp + 60, BN.floor + 10, 380, 70, { fill: '#FFE6A0', opacity: op(0.22 * lit) }) + P(`M${BN.lamp - 40} ${gy + 40} L${BN.lamp + 40} ${gy + 40} L${BN.lamp + 620} ${BN.floor + 40} L${BN.lamp - 560} ${BN.floor + 40} Z`, { fill: 'url(#sfLampCone)', opacity: op(0.5 * lit) });
  if (w.golden > 0.05) light += R(-50, -50, 2020, 1180, 0, { fill: '#FFB85A', opacity: op(0.07 * w.golden) });
  if (o.flash > 0) light += R(-50, -50, 2020, 1180, 0, { fill: '#FFFFFF', opacity: op(o.flash) });
  return layersOf(bg, mid, '', '', fg, light);
}
const fairBench = roomSet(fairBenchLayers, 0.6);

// ================================================================= 3. DINO TOP (close on the inflatable dinosaur's head + neck)
// World (k 1): the dinosaur drawn ×1.42 (hero s ≈ .4 on it) with its head top at about (830, 300) — Max sits on the head, the
// hero climbs up the neck from the bottom of the frame. Behind: the fair seen from up high (k .45: the ground with a
// cheering crowd far below, stalls + string lights), the Ferris wheel (k .3), the hills (k .12), sky (k 0).
const DT = { sc: 1.42, ox: 1450, oy: 2275 };
const dtW = (p) => [DT.ox + DT.sc * p[0], DT.oy + DT.sc * p[1]];
const DT_S = rs(FA_DINO_S * DT.sc);
function dinoTopLayers(t, cam, o) {
  const st = frameState(o, 'golden');
  const { tn, lights: lit } = st;
  const cheer = b01(o.cheer, 1), wob = o.wobble ?? 0.5;
  const v0 = vis(cam, 0);
  let bg = V(cam, sky(v0, st) + moon(st), 0) + V(cam, sunDisc(st), 0.02) + V(cam, clouds(vis(cam, 0.04), st, t), 0.04) + V(cam, farTown(vis(cam, 0.12), st, t, 900), 0.12);
  // Ferris wheel far right (k .3)
  const tn3 = st.tnFar(0.25), acc3 = lightsAcc(tn3, lit, t);
  bg += V(cam, R(-1500, 900, 5000, 900, 0, tn3.fl('#6E5A8A')) + G(ferrisWheel(360, tn3, 4, lit, t, { acc: acc3 }) + acc3.out(2), tr(1650, 560)), 0.3);
  // the fair far below (k .45): stall tops, string lights, the cheering crowd
  const v45 = vis(cam, 0.45), tn45 = st.tnFar(0.1), acc45 = lightsAcc(tn45, lit, t);
  let below = R(v45.x0 - 300, 905, v45.x1 - v45.x0 + 600, 900, 0, tn45.fl(C.sand));
  for (let i = Math.floor((v45.x0 - 400) / 420); i * 420 < v45.x1 + 400; i++) {
    const K_ = STALL_KINDS[md(i + 3, STALL_KINDS.length)], x = i * 420 + 40 * hash(i);
    below += G(K_.kind === 'tent' ? tent(1300, 1100, K_.cols[0], K_.cols[1], tn45, 22, lit, t, i) : stall(1100, K_.label, K_.cols[0], K_.cols[1], tn45, 22, lit), tr(x, 920, 0.24));
    acc45.string(x, 640, x + 420, 640, 40, 36, 5, i);
  }
  below += acc45.out(2);
  below += crowd([960, 990, 1025, 1065].map((y, i) => ({ y, s: 0.1 + i * 0.016, seed: 70 + i * 3, dens: 0.95, jit: 8 })), { tone: st.tnCrowd, t, cheer, x0: v45.x0 - 100, x1: v45.x1 + 100, zoom: v45.z });
  bg += V(cam, below, 0.45);
  // the dinosaur (k 1)
  const mid = V(cam, G(inflatableDino(t, { tone: tn, wobble: wob, face: o.dinoFace, col: o.dinoCol, lw: 6 / DT.sc, sign: false, ropes: false, look: o.dinoLook || [0.3, 0.6] }), `translate(${DT.ox} ${DT.oy}) scale(${DT.sc})`), 1);
  let light = '';
  if (st.w.golden > 0.05) light += R(-50, -50, 2020, 1180, 0, { fill: '#FFB85A', opacity: op(0.06 * st.w.golden) });
  if (o.confetti) {
    const k = clamp(o.confetti, 0, 3);
    let cd = new Map();
    for (let i = 0; i < 46; i++) { const x = md(hash(i * 3.1) * 2200 + Math.sin(t + i) * 40, 2200) - 140, y = md(hash(i * 5.7) * 1300 + t * (160 + 120 * hash(i)), 1300) - 120, c = CR_BALL[i % CR_BALL.length]; cd.set(c, (cd.get(c) || '') + `M${f(x)} ${f(y)}l${f(14 * Math.cos(t * 4 + i))} 6l-4 18l${f(-14 * Math.cos(t * 4 + i))} -6Z`); }
    for (const [c, d] of cd) light += P(d, { fill: c, opacity: op(k) });
  }
  if (o.flash > 0) light += R(-50, -50, 2020, 1180, 0, { fill: '#FFFFFF', opacity: op(o.flash) });
  return layersOf(bg, mid, '', '', '', light);
}
const dinoTop = camSet(dinoTopLayers);

// ================================================================= 4. FAIR ENTRANCE (the family arriving under the arch)
// World (k 1): the TOWN FAIR arch spans the path (posts x 960 ± 1300·.36, base 960, header bottom y ~300); the ticket booth
// left, a picket fence with bunting on both sides, balloons tied to the posts. Stand line FLOOR 960 (s .36) under the arch;
// walkers nearer the camera get bigger (sAt). Behind the arch: the midway (k .7: tents + stalls + string lights + a crowd),
// the Ferris wheel (k .5), the tree line (k .3), hills (k .12), sky.
const FE = { floor: 960, s: 0.36, hor: 520, x: 960 };
const feS = (y) => FE.s * (y - FE.hor) / (FE.floor - FE.hor);
function fairEntranceLayers(t, cam, o) {
  const st = frameState(o, 'afternoon');
  const { tn, lights: lit } = st;
  const crowdD = b01(o.crowd, 0.6);
  const v0 = vis(cam, 0);
  let bg = V(cam, sky(v0, st) + moon(st), 0) + V(cam, sunDisc(st), 0.02) + V(cam, clouds(vis(cam, 0.04), st, t), 0.04) + V(cam, farTown(vis(cam, 0.12), st, t, 700), 0.12);
  bg += V(cam, treeLine(vis(cam, 0.3), st, 760, 5), 0.3);
  const tn5 = st.tnFar(0.16), acc5 = lightsAcc(tn5, lit, t), acc5b = lightsAcc(tn5, lit, t);
  bg += V(cam, G(ferrisWheel(380, tn5, 4, lit, t, { acc: acc5 }) + acc5.out(2), tr(1320, 250)) + G(dropTower(tn5, 5, lit, t, acc5b) + acc5b.out(2.6), tr(260, 780, 0.7)), 0.5);
  // midway (k .7)
  const v7 = vis(cam, 0.7), tn7 = st.tnFar(0.08), acc7 = lightsAcc(tn7, lit, t);
  let mw = R(v7.x0 - 300, 790, v7.x1 - v7.x0 + 600, 900, 0, tn7.fl(C.sandD));
  for (let i = Math.floor((v7.x0 - 400) / 400); i * 400 < v7.x1 + 400; i++) {
    const K_ = STALL_KINDS[md(i + 5, STALL_KINDS.length)], x = i * 400 + 50 * hash(i * 1.3);
    mw += G(K_.kind === 'tent' ? tent(1300, 1150, K_.cols[0], K_.cols[1], tn7, 24, lit, t, i) : stall(1150, K_.label, K_.cols[0], K_.cols[1], tn7, 24, lit), tr(x, 800, 0.25));
    if (i % 2 === 0) acc7.string(x, 470, x + 800, 470, 60, 44, 6, i);
  }
  mw += acc7.out(2);
  if (crowdD > 0) mw += crowd([820, 845, 870].map((y, i) => ({ y, s: 0.17 + i * 0.02, seed: 40 + i * 5, dens: 0.8, jit: 8 })), { tone: st.tnCrowd, t, dens: crowdD, x0: v7.x0 - 100, x1: v7.x1 + 100, cheer: b01(o.cheer), zoom: v7.z });
  bg += V(cam, mw, 0.7);
  // main plane (k 1)
  const v1 = vis(cam, 1);
  let mid = R(v1.x0 - 300, 860, v1.x1 - v1.x0 + 600, 1200, 0, tn.fl(C.grass)) + R(v1.x0 - 300, 860, v1.x1 - v1.x0 + 600, 1200, 0, { fill: 'url(#sfGrassTex)' });
  mid += P(`M${FE.x - 560} 860 L${FE.x + 560} 860 L${FE.x + 1500} 1500 L${FE.x - 1500} 1500 Z`, tn.fl(C.sand)) + specks(FE.x - 520, FE.x + 520, 880, 1080, tn, 5, 110);
  // picket fence both sides (k 1, y 900)
  let pk = '', rails = '';
  for (let x = Math.floor((v1.x0 - 200) / 70) * 70; x < v1.x1 + 200; x += 70) { if (x > FE.x - 520 && x < FE.x + 520) continue; pk += `M${x - 22} 900V${f(790)}L${x} 768L${x + 22} 790V900Z`; }
  rails += dR(v1.x0 - 300, 806, FE.x - 520 - v1.x0 + 300, 22) + dR(FE.x + 520, 806, v1.x1 - FE.x + 300, 22) + dR(v1.x0 - 300, 856, FE.x - 520 - v1.x0 + 300, 20) + dR(FE.x + 520, 856, v1.x1 - FE.x + 300, 20);
  mid += P(rails, tn.ol(C.white, 4)) + P(pk, tn.ol(C.white, 4));
  mid += bunting(v1.x0 - 300, 770, FE.x - 560, 770, 30, 44, tn, undefined, t, 0, 3) + bunting(FE.x + 560, 770, v1.x1 + 300, 770, 30, 44, tn, undefined, t, 2, 3);
  // ticket booth (left, outside the arch)
  mid += G(ticketBooth(tn, 6 / 0.34, lit, t), tr(FE.x - 760, 940, 0.34));
  // the arch
  const accA = lightsAcc(tn, lit, t);
  mid += G(archSign(tn, 6 / FE.s, lit, t, accA) + accA.out(6 / FE.s * 0.4), tr(FE.x, FE.floor, FE.s));
  // balloons tied to the posts
  for (const sx of [-1, 1]) { const px = FE.x + sx * 1300 * FE.s; [[70, -590, C.red], [150, -640, C.yellow], [200, -560, C.sky], [120, -500, C.pink]].forEach(([dx, dy, c], i) => { mid += balloon(px + sx * dx, FE.floor + dy, 0.45, c, t + i + sx, { tone: tn, string: 240 }); }); }
  let light = '';
  if (lit > 0.03) light += V(cam, glow(FE.x, FE.floor - 2250 * FE.s, 520, 'sfGlowGold', 0.4 * lit), 1);
  if (st.w.golden > 0.05) light += R(-50, -50, 2020, 1180, 0, { fill: '#FFB85A', opacity: op(0.06 * st.w.golden) });
  if (st.w.dusk > 0.05) light += R(-50, 760, 2020, 400, 0, { fill: 'url(#sfFloorFade)', opacity: op(0.6 * st.w.dusk) });
  if (o.flash > 0) light += R(-50, -50, 2020, 1180, 0, { fill: '#FFFFFF', opacity: op(o.flash) });
  return layersOf(bg, V(cam, mid, 1), '', '', '', light);
}
const fairEntrance = camSet(fairEntranceLayers);

// ================================================================= anchors
// SIT: front-view seated pose (hips on the seat: pose.y = seatY + 306·s). SIT_SIDE: profile sit (view 'side').
const SIT = { legL: 45, legR: 45, kneeL: 60, kneeR: 60 };
const SIT_SIDE = { view: 'side', legL: 90, legR: 90, kneeL: 90, kneeR: 90 };
const line = (y, sAt, x0, x1, gaps = [], k = 1) => ({ y, k, s: rs(sAt(y)), x0, x1, gaps, sAt, jitter: 14 });
const FLOOR = { fair: FA.floor, fairBench: BN.floor, dinoTop: Math.round(dtW(DN.seat)[1]), fairEntrance: FE.floor };
const benchSeats = (cx, seatY, s, half) => [-1, 1].map((sx) => ({ x: Math.round(cx + sx * half), y: Math.round(seatY + 306 * s), seat: Math.round(seatY), s: rs(s), k: 1, ...SIT }));
const FA_BSEAT = FA_Y.bench - SEAT_H * faS(FA_Y.bench);
const SPOTS = {
  fair: {
    s: FA.s, k: 1, floor: FA.floor, sAt: faS, hor: FA.hor,
    lines: [line(880, faS, -2600, 6800, FA_GAPS), line(920, faS, -2600, 6800), line(960, faS, -2600, 6800), line(1010, faS, -2600, 6800)],
    crowdRows: { back: FA_BACK_ROWS.slice(), front: FA_FRONT_ROWS.slice() },
    arch: { x: FA_X.arch, y: FA_Y.arch, k: 1, s: rs(faS(FA_Y.arch)), under: { x: FA_X.arch, y: FA_Y.arch + 6, s: rs(faS(FA_Y.arch + 6)), k: 1 }, sign: { x: FA_X.arch, y: Math.round(FA_Y.arch - 2150 * faS(FA_Y.arch)), k: 1 } },
    ticket: { x: FA_X.ticket, y: FA_Y.ticket, k: 1 },
    bench: { x: FA_X.bench, y: FA_Y.bench, k: 1, seatY: Math.round(FA_BSEAT), seats: benchSeats(FA_X.bench, FA_BSEAT, faS(FA_Y.bench), 190), front: { x: FA_X.bench, y: 960, s: FA.s, k: 1 }, lamp: { x: FA_X.lamp, y: Math.round(FA_Y.lamp - (FA_LAMP_H + 30) * faS(FA_Y.lamp)), k: 1 } },
    booth: { x: FA_X.booth, y: FA_Y.booth, k: 1, vendor: { x: FA_X.booth, y: FA_Y.booth - 40, s: rs(faS(FA_Y.booth - 40)), k: 1 }, front: { x: FA_X.booth - 120, y: 960, s: FA.s, k: 1 }, counterTop: Math.round(FA_Y.booth - 500 * faS(FA_Y.booth)) },
    cart: { x: FA_X.cart, y: FA_Y.cart, k: 1, bunch: { x: FA_X.cart, y: Math.round(FA_Y.cart - 1300 * faS(FA_Y.cart)), k: 1 } },
    cotton: { x: FA_X.cotton, y: FA_Y.cotton, k: 1, vendor: { x: FA_X.cotton, y: FA_Y.cotton - 40, s: rs(faS(FA_Y.cotton - 40)), k: 1 }, front: { x: FA_X.cotton + 260, y: 960, s: FA.s, k: 1 }, counterTop: Math.round(FA_Y.cotton - 500 * faS(FA_Y.cotton)), sign: { x: FA_X.cotton, y: Math.round(FA_Y.cotton - 1700 * faS(FA_Y.cotton)), k: 1 } },
    teacups: { x: FA_X.teacups, y: FA_Y.teacups, k: 1, s: rs(faS(FA_Y.teacups)), gate: { x: Math.round(FA_X.teacups - 400 * faS(FA_Y.teacups)), y: 930, s: rs(faS(930)), k: 1 }, x0: Math.round(FA_X.teacups - TC.rx * faS(FA_Y.teacups)), x1: Math.round(FA_X.teacups + TC.rx * faS(FA_Y.teacups)), front: { x: FA_X.teacups, y: 960, s: FA.s, k: 1 } },
    ferris: { x: FA_FERRIS.x, y: FA_FERRIS.y, r: FA_FERRIS.r, k: FA_FERRIS.k, top: { x: FA_FERRIS.x, y: FA_FERRIS.y - FA_FERRIS.r, k: FA_FERRIS.k }, stand: { x: 1150, y: 960, s: FA.s, k: 1 } },
    dino: {
      x: FA_X.dino, y: FA_Y.dino, k: 1, s: FA_DINO_S, height: 1392, headTop: { x: Math.round(FA_X.dino + DN.seat[0]), y: Math.round(FA_Y.dino + DN.seat[1]), k: 1 },
      seat: fairDinoAt(dinoLocalSpot(DN.seat), 0.5), hug: fairDinoAt(dinoLocalSpot(DN.hug), 0.5),
      climbAt: (u, t = 0, w = 0.5) => fairDinoAt((pose) => dinoClimbLocal(u, pose), w)(t),
      base: { x: FA_X.dino + 930, y: FA_Y.dino, k: 1 }, front: { x: FA_X.dino - 300, y: 960, s: FA.s, k: 1 },
    },
    cams: {
      main: { x: 0, y: 0, zoom: 1 }, wide: camAt(1700, 300, 0.5), crowd: camAt(1300, 720, 0.62), over: camAt(1500, 860, 0.75),
      arch: camAt(-2250, 520, 0.85), bench: camAt(-1000, 650, 1.2), booth: camAt(250, 640, 1.05), ferris: camAt(1150, 520, 0.85, 960, 600),
      cotton: camAt(1800, 660, 1.1), teacups: camAt(3200, 600, 0.9), dino: camAt(5200, 240, 0.6), dinoFar: camAt(4100, 260, 0.42),
      dinoHead: camAt(4850, -560, 1.15), run: [camAt(800, 470, 0.8), camAt(1900, 470, 0.8), camAt(3300, 470, 0.8), camAt(4800, 420, 0.8)],
    },
  },
  fairBench: {
    s: BN.s, k: 1, floor: BN.floor, seatY: Math.round(BN_SEAT), sit: SIT, sitSide: SIT_SIDE,
    seats: benchSeats(BN.x, BN_SEAT, BN.s, 230),
    hero: null, grandpa: null,
    stand: [{ x: 520, y: 1000, s: 0.6, k: 1 }, { x: 1440, y: 1000, s: 0.6, k: 1 }],
    lamp: { x: BN.lamp, y: Math.round(BN.floor - 40 - (BN.lampH + 30) * BN.s), k: 1 },
    cams: { wide: { x: 0, y: 0, zoom: 1 }, two: camAt(960, 640, 1.12), hero: camAt(760, 600, 1.6), grandpa: camAt(1180, 560, 1.6), lamp: camAt(420, 460, 1.3), up: camAt(960, 420, 1.05) },
  },
  dinoTop: {
    s: DT_S, k: 1, sc: DT.sc,
    headTop: { x: Math.round(dtW(DN.seat)[0]), y: Math.round(dtW(DN.seat)[1]), k: 1 },
    seat: (t = 0, w = 0.5) => { const pose = dinoPose(t, w), q = dinoPt(DN.seat, 'head', pose), p = dtW(q); return { x: Math.round(p[0]), y: Math.round(p[1]), rot: rs(pose.th), s: DT_S, k: 1 }; },
    hug: (t = 0, w = 0.5) => { const pose = dinoPose(t, w), q = dinoPt(DN.hug, 'head', pose), p = dtW(q); return { x: Math.round(p[0]), y: Math.round(p[1]), rot: rs(pose.th), s: DT_S, k: 1 }; },
    climbAt: (u, t = 0, w = 0.5) => { const pose = dinoPose(t, w), c0 = DINO_CLIMB.find((q) => q.part === 'neck').u, q = dinoClimbLocal(lerp(c0 - 0.06, 1, clamp(u, 0, 1)), pose), p = dtW([q.x, q.y]); return { x: Math.round(p[0]), y: Math.round(p[1]), rot: rs(q.rot), s: DT_S, k: 1 }; },
    crowd: { y: 1030, k: 0.45, s: 0.13 },
    cams: { close: { x: 0, y: 0, zoom: 1 }, wide: camAt(1000, 620, 0.78), hug: camAt(860, 360, 1.35), max: camAt(780, 300, 1.7), below: camAt(1100, 900, 0.9) },
  },
  fairEntrance: {
    s: FE.s, k: 1, floor: FE.floor, sAt: feS, hor: FE.hor,
    arch: { x: FE.x, y: FE.floor, k: 1, posts: [Math.round(FE.x - 1300 * FE.s), Math.round(FE.x + 1300 * FE.s)], sign: { x: FE.x, y: Math.round(FE.floor - 2150 * FE.s), k: 1 } },
    under: { x: FE.x, y: FE.floor, s: FE.s, k: 1 },
    lines: [line(920, feS, 560, 1360), line(960, feS, 560, 1360), line(1010, feS, -200, 2120), line(1060, feS, -200, 2120)],
    walkIn: { from: { x: 1180, y: 1180, s: rs(feS(1180)), k: 1 }, to: { x: 960, y: 900, s: rs(feS(900)), k: 1 } },
    ticket: { x: FE.x - 760, y: 940, k: 1, window: { x: FE.x - 760, y: Math.round(940 - 670 * 0.34), k: 1 } },
    cams: { wide: { x: 0, y: 0, zoom: 1 }, family: camAt(960, 700, 1.35), sign: camAt(960, 260, 1.4), low: camAt(960, 560, 0.85, 960, 600) },
  },
};
SPOTS.fairBench.hero = SPOTS.fairBench.seats[0];
SPOTS.fairBench.grandpa = SPOTS.fairBench.seats[1];

module.exports = {
  fair, fairBench, dinoTop, fairEntrance,
  FLOOR, SPOTS, SIT, SIT_SIDE, DEFS: `<defs>${DEF.join('')}</defs>`,
  // props
  inflatableDino, dinoBalloon, balloon, cottonCandy, bench, lampPost, tent, stall, ferrisWheel, teacupsRide, teacup, teapot, cottonCandyStand, cottonCounter,
  gameBooth, gameCounter, balloonCart, ticketBooth, archSign, swingRide, dropTower, bigTop, bunting, lightsAcc, stripePole, awning, signBoard,
  // helpers
  crowd, crowdPeople, crowdHeads, placeCrowd, camTf, vis, toScreen, camAt, tone, frameState, mix, glow, C, dinoPose,
};
