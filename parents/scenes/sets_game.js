// CUBE CITY — the in-game world sets of "What If Your PARENTS Joined Your Roblox Server?".   Reference: docs/SETS_GAME.md
//
// A blocky, candy-coloured toy city: everything is built from bricks with studs on their top faces, floating grass
// islands, cube clouds and chunky game signs. Bold #151515 outlines, flat colours, one light + one shade per part.
// Static gradients/patterns live in DEFS (ids `gs*`; scenes/main.js loads it automatically).
//
// CAMERA sets: set(t, cam, o) -> svg;  set.layers(t, cam, o) -> { bg, mid, front, fg, light } ALREADY transformed by cam
//   ({ zoom, x, y, fx, fy, sx, sy } as from K.camKeys / K.shake). Every sub-layer has its own parallax k.
//   Draw order:  L.bg + L.mid + <characters BEHIND front occluders> + L.front + <characters on the floor> + L.fg + L.light
//   Anchors carry k: draw on them with K.view(cam, svg, a.k); toScreen(cam, a) -> where an anchor is on screen now.
//   String(L) = every layer.
// ROOM sets (castleInterior, factoryInterior, avatarShop): set(t, o) -> svg; set.layers(t, o) -> { bg, mid, front, fg, light }
//   in world space (you apply the camera: K.view(cam, L.bg, .7) + K.view(cam, L.mid, 1) + ...), or
//   set.compose(t, o, behind, onFloor, cam).
// Common options: time 'day'|'sunset'|'night' (+ per-set extras). Values 0..1 animate: ease them yourself.
// FLOOR[set] = feet line of the main stand line; SPOTS[set] = anchors ({x, y, k, s}), SPOTS[set].lines = crowd stand lines
// (back -> front, {y, k, s, x0, x1}), SPOTS[set].cams = ready framings. helpers: placeCrowd(line, n, seed), camAt, toScreen.
//
// Index:
//   plaza(t, cam, o)        spawn plaza / lobby + the first obby over water
//   arena(t, cam, o)        Battle Arena (colosseum ring, stands crowd, scoreboard; raid variant)
//   tycoon(t, cam, o)       Tycoon Valley: the hero's castle + Granny's plot that grows 0..4 (+ sold / smashed)
//   castleInterior(t, o)    room: lava pool, trophy room, throne
//   factoryInterior(t, o)   room: conveyor belts, ovens, EMPLOYEE OF THE MONTH
//   tower(t, cam, o)        the 100-floor obby tower over a lava sea (crystal on top), long vertical world
//   cityNight(t, cam, o)    Cube City wide under attack (Block King spot); cityDay(t, cam, o) = the same at day
//   avatarShop(t, o)        room: hats + costume racks behind the avatar-editor UI
'use strict';

const S = require('../rig/svg');
const { f, clamp, lerp, ease } = S;

const LINE = '#151515';
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const R = (x, y, w, h, r = 0, a = {}) => S.rect(f(x), f(y), f(Math.max(0, w)), f(Math.max(0, h)), r, a);
const P = (d, a = {}) => (d ? S.path(d, a) : '');
const E = (cx, cy, rx, ry, a = {}) => S.ellipse(f(cx), f(cy), f(rx), f(ry), a);
const CI = (cx, cy, r, a = {}) => S.circle(f(cx), f(cy), f(Math.max(0, r)), a);
const G = (inner, tf, extra) => (inner ? S.g(inner, tf, extra) : '');
const T = (s, x, y, size, fill, extra = {}) => S.el('text', { x: f(x), y: f(y), 'font-family': 'Lilita One, sans-serif', 'font-size': f(size), fill, 'text-anchor': 'middle', ...extra }, esc(s));
const TF = (s, x, y, size, fill, extra = {}) => S.el('text', { x: f(x), y: f(y), 'font-family': 'Fredoka, sans-serif', 'font-weight': 700, 'font-size': f(size), fill, 'text-anchor': 'middle', ...extra }, esc(s));
const OUTX = (w = 8, col = LINE) => ({ stroke: col, 'stroke-width': f(w), 'paint-order': 'stroke', 'stroke-linejoin': 'round' });
const hash = (n) => { const v = Math.sin(n * 127.1 + 311.7) * 43758.5453; return v - Math.floor(v); };
const md = (a, n) => ((a % n) + n) % n;
const sm = (a, b, v) => { const u = clamp((v - a) / (b - a), 0, 1); return u * u * (3 - 2 * u); };
const b01 = (v, d = 0) => (v === true ? 1 : v === false || v === undefined || v === null ? d : clamp(+v, 0, 1));
const tr = (x, y, s = 1, r = 0) => `translate(${f(x)} ${f(y)})${r ? ` rotate(${f(r)})` : ''}${s !== 1 ? ` scale(${f(s)})` : ''}`;
const op = (v) => f(clamp(v, 0, 1));

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

// ---------------------------------------------------------------- colour
const hx = (c) => [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)];
const toHex = (a) => '#' + a.map((v) => Math.round(clamp(v, 0, 255)).toString(16).padStart(2, '0')).join('').toUpperCase();
function mix(a, b, k) {
  if (k <= 0) return a;
  if (k >= 1) return b;
  if (a[0] === '!') return '!' + mix(a.slice(1), b, k);
  const A = hx(a), B = hx(b);
  return toHex(A.map((v, i) => lerp(v, B[i], k)));
}
const lt = (c, k = 0.3) => mix(c, '#FFFFFF', k);
const dk = (c, k = 0.25) => mix(c, '#22163A', k);

// the candy palette of Cube City
const C = {
  red: '#FF4D5E', orange: '#FF8A3D', yellow: '#FFD23F', lime: '#9BE15D', green: '#3DCB6C', mint: '#4FE0B6', teal: '#22B8C8',
  sky: '#39B8FF', blue: '#4C7DFF', purple: '#9B5CFF', pink: '#FF6FB5', peach: '#FFB38A', cream: '#FFF4DE', white: '#F7F5FF',
  stone: '#AEB8CE', stoneD: '#7F8AA6', slate: '#5A6488', dark: '#3A3F5C', grass: '#5ED46A', grassD: '#3CB052', dirt: '#B9784A', dirtD: '#93593A',
  wood: '#C98A4E', woodD: '#9C6235', gold: '#FFC83A', goldD: '#E09A1A', water: '#3FC2F5', lava: '#FF6A1F', sand: '#F2D59A',
};
const CANDY = [C.red, C.orange, C.yellow, C.lime, C.mint, C.sky, C.blue, C.purple, C.pink];

// tone(o) -> colour transformer for one frame: every fill goes through tn.c(col), so a set renders at day / sunset / night /
// under the purple-red attack sky / at the gold victory dawn. '!#RRGGBB' = emissive (lit windows, neon, lava): never toned.
//   o: { sunset, night, raid, dawn, dim, haze, hazeCol } all 0..1 (haze = distance fade toward hazeCol)
function tone(o = {}) {
  const sunset = o.sunset || 0, night = o.night || 0, raid = o.raid || 0, dawn = o.dawn || 0, dim = o.dim || 0, haze = o.haze || 0;
  const hz = haze ? hx(o.hazeCol || '#CDEBFF') : null;
  const any = sunset + night + raid + dawn + dim + haze;
  const cache = new Map();
  const c = (col) => {
    if (typeof col !== 'string') return col;
    if (col[0] === '!') return col.slice(1);
    if (!any || col[0] !== '#' || col.length !== 7) return col;
    let v = cache.get(col);
    if (v) return v;
    let [r, g, b] = hx(col);
    if (sunset) { r = lerp(r, r * 0.95 + 30, sunset); g = lerp(g, g * 0.8 + 18, sunset); b = lerp(b, b * 0.64 + 22, sunset); }
    if (dawn) { r = lerp(r, r * 0.92 + 36, dawn); g = lerp(g, g * 0.86 + 24, dawn); b = lerp(b, b * 0.66 + 10, dawn); }
    if (night) { r = lerp(r, r * 0.3 + 16, night); g = lerp(g, g * 0.3 + 12, night); b = lerp(b, b * 0.44 + 56, night); }
    if (raid) { r = lerp(r, r * 0.42 + 48, raid); g = lerp(g, g * 0.2 + 8, raid); b = lerp(b, b * 0.34 + 44, raid); }
    if (dim) { r *= 1 - 0.4 * dim; g *= 1 - 0.38 * dim; b *= 1 - 0.3 * dim; }
    if (haze) { r = lerp(r, hz[0], haze); g = lerp(g, hz[1], haze); b = lerp(b, hz[2], haze); }
    v = toHex([r, g, b]);
    cache.set(col, v);
    return v;
  };
  const lw = o.lw ?? 1;
  const line = o.line || (haze > 0.3 ? mix(LINE, o.hazeCol || '#CDEBFF', haze * 0.55) : LINE);
  const ol = (fill, w = 6, extra) => ({ fill: c(fill), stroke: line, 'stroke-width': f(w * lw), 'stroke-linejoin': 'round', 'stroke-linecap': 'round', ...extra });
  const ln = (w, col = LINE, o2) => ({ fill: 'none', stroke: col === LINE ? line : c(col), 'stroke-width': f(col === LINE ? w * lw : w), 'stroke-linecap': 'round', 'stroke-linejoin': 'round', ...(o2 !== undefined ? { opacity: op(o2) } : {}) });
  const fl = (col, o2) => (o2 === undefined ? { fill: c(col) } : { fill: c(col), opacity: op(o2) });
  return { c, ol, ln, fl, line, lw, sunset, night, raid, dawn, haze, o };
}
// the time option -> tone weights. time 'day'|'sunset'|'night'; raid adds the purple-red attack tint; dawn the gold victory
function timeTone(o = {}, extra = {}) {
  const time = o.time || 'day';
  return { sunset: time === 'sunset' ? 0.85 : 0, night: time === 'night' ? 0.82 : 0, ...extra };
}

// ---------------------------------------------------------------- static defs
const DEF = [];
const def = (s) => { DEF.push(s); };
const lg = (id, stops, x2 = 0, y2 = 1, extra = '') => `<linearGradient id="${id}" x1="0" y1="0" x2="${x2}" y2="${y2}"${extra}>${stops.map(([o, c, a]) => `<stop offset="${o}" stop-color="${c}"${a !== undefined ? ` stop-opacity="${a}"` : ''}/>`).join('')}</linearGradient>`;
const rg = (id, stops, extra = '') => `<radialGradient id="${id}"${extra}>${stops.map(([o, c, a]) => `<stop offset="${o}" stop-color="${c}"${a !== undefined ? ` stop-opacity="${a}"` : ''}/>`).join('')}</radialGradient>`;
const pat = (id, w, h, inner, extra = '') => `<pattern id="${id}" width="${w}" height="${h}" patternUnits="userSpaceOnUse"${extra}>${inner}</pattern>`;

// skies: candy day, gold sunset, purple night, purple-red attack, gold victory dawn
def(lg('gsSkyDay', [[0, '#2F86FF'], [0.5, '#6FCBFF'], [0.85, '#C9F1FF'], [1, '#E8FBFF']]));
def(lg('gsSkySunset', [[0, '#4B3FB8'], [0.38, '#C0579F'], [0.68, '#FF8E72'], [0.9, '#FFC46E'], [1, '#FFE2A0']]));
def(lg('gsSkyNight', [[0, '#0B0727'], [0.5, '#22155C'], [0.85, '#3C2A86'], [1, '#55409E']]));
def(lg('gsSkyRaid', [[0, '#12041E'], [0.4, '#3E0B44'], [0.75, '#8E1946'], [1, '#FF5A36']]));
def(lg('gsSkyDawn', [[0, '#6C7CFF'], [0.35, '#FF9EC0'], [0.68, '#FFCB6E'], [1, '#FFF2B8']]));
def(pat('gsStars', 260, 200, '<rect x="24" y="30" width="5" height="5" fill="#FFF"/><rect x="150" y="16" width="4" height="4" fill="#FFF" opacity="0.7"/><rect x="104" y="96" width="6" height="6" fill="#FFF4C8"/><rect x="220" y="132" width="4" height="4" fill="#FFF" opacity="0.8"/><rect x="60" y="160" width="3" height="3" fill="#FFF" opacity="0.6"/><path d="M196 62 l3 -10 l3 10 l10 3 l-10 3 l-3 10 l-3 -10 l-10 -3 Z" fill="#FFF" opacity="0.9"/>'));
// light: small radial glows only (keep r <= ~450)
def(rg('gsGlowWarm', [[0, '#FFE9A8', 0.85], [0.45, '#FFC860', 0.3], [1, '#FFB040', 0]]));
def(rg('gsGlowCyan', [[0, '#C8FFFF', 0.85], [0.4, '#4FF0FF', 0.3], [1, '#2AD8FF', 0]]));
def(rg('gsGlowPink', [[0, '#FFD0F0', 0.85], [0.4, '#FF6FD0', 0.3], [1, '#FF4FC0', 0]]));
def(rg('gsGlowPurple', [[0, '#E8C8FF', 0.85], [0.4, '#B06BFF', 0.32], [1, '#8A3DFF', 0]]));
def(rg('gsGlowFire', [[0, '#FFE08A', 0.85], [0.35, '#FF8A2A', 0.4], [1, '#FF4A1A', 0]]));
def(rg('gsGlowWhite', [[0, '#FFFFFF', 0.95], [0.45, '#FFFFFF', 0.3], [1, '#FFFFFF', 0]]));
def(rg('gsGlowGold', [[0, '#FFF6C8', 0.95], [0.4, '#FFD45A', 0.4], [1, '#FFB020', 0]]));
def(lg('gsBeam', [[0, '#FFFFFF', 0.55], [1, '#FFFFFF', 0]]));
def(lg('gsBeamUp', [[0, '#FFFFFF', 0], [1, '#FFFFFF', 0.5]]));
def(lg('gsSearch', [[0, '#FFF6D0', 0], [0.75, '#FFF6D0', 0.16], [1, '#FFF6D0', 0.34]]));
def(lg('gsLavaGlow', [[0, '#FF5A1F', 0], [1, '#FF7A2A', 0.55]]));
def(lg('gsWaterGlow', [[0, '#7FE8FF', 0], [1, '#7FE8FF', 0.35]]));
def(lg('gsGlass', [[0, '#BFF4FF'], [0.5, '#7FD6FF'], [1, '#5AB0F2']], 1, 0));
def(lg('gsGlassN', [[0, '#3A4A9A'], [0.5, '#2A3478'], [1, '#1E2660']], 1, 0));
def(lg('gsShine', [[0, '#FFFFFF', 0.35], [0.5, '#FFFFFF', 0]], 1, 1));
def(lg('gsFloorFade', [[0, '#000000', 0.16], [1, '#000000', 0]]));
// textures (semi-transparent so they work on any toned colour)
def(pat('gsBrick', 64, 32, '<path d="M0 15 H64 M0 31 H64 M32 0 V15 M0 15 V31 M64 15 V31" stroke="#000" stroke-width="3" opacity="0.13" fill="none"/><rect x="36" y="3" width="22" height="5" fill="#FFF" opacity="0.12"/><rect x="4" y="19" width="22" height="5" fill="#FFF" opacity="0.12"/>'));
def(pat('gsBrickBig', 120, 60, '<path d="M0 29 H120 M0 59 H120 M60 0 V29 M0 29 V59 M120 29 V59" stroke="#000" stroke-width="4" opacity="0.14" fill="none"/><rect x="66" y="5" width="44" height="8" fill="#FFF" opacity="0.13"/><rect x="6" y="35" width="44" height="8" fill="#FFF" opacity="0.13"/>'));
def(pat('gsStudsTop', 48, 30, '<ellipse cx="24" cy="17" rx="11" ry="5" fill="#000" opacity="0.12"/><ellipse cx="24" cy="14" rx="11" ry="5" fill="#FFF" opacity="0.28"/>'));
def(pat('gsSand', 90, 60, '<rect x="10" y="12" width="6" height="6" fill="#B5823A" opacity="0.22"/><rect x="58" y="40" width="5" height="5" fill="#B5823A" opacity="0.2"/><rect x="40" y="18" width="4" height="4" fill="#FFF" opacity="0.3"/><rect x="74" y="8" width="4" height="4" fill="#B5823A" opacity="0.16"/><rect x="22" y="46" width="4" height="4" fill="#FFF" opacity="0.25"/>'));
def(pat('gsGrassTex', 70, 44, '<path d="M8 30 l5 -12 l5 12 M40 16 l4 -10 l4 10" stroke="#1E7A30" stroke-width="3" fill="none" opacity="0.22" stroke-linejoin="round"/><rect x="56" y="30" width="6" height="6" fill="#FFF" opacity="0.18"/>'));
def(pat('gsWaterTex', 160, 46, '<path d="M10 14 h42 M96 32 h48 M60 40 h20" stroke="#FFFFFF" stroke-width="5" stroke-linecap="round" opacity="0.45" fill="none"/>'));
def(pat('gsLavaTex', 180, 70, '<path d="M12 20 q20 -10 40 0 M100 48 q24 -12 48 0" stroke="#FFE27A" stroke-width="6" stroke-linecap="round" fill="none" opacity="0.7"/><rect x="70" y="14" width="10" height="10" fill="#FFF2B0" opacity="0.5"/><rect x="150" y="18" width="8" height="8" fill="#B8200E" opacity="0.4"/><rect x="30" y="50" width="10" height="10" fill="#B8200E" opacity="0.35"/>'));
def(pat('gsWinLit', 60, 70, '<rect x="10" y="10" width="40" height="44" rx="4" fill="#FFE07A"/><rect x="14" y="14" width="14" height="14" fill="#FFF6C8" opacity="0.7"/>'));
def(pat('gsWinDay', 60, 70, '<rect x="10" y="10" width="40" height="44" rx="4" fill="#9EE6FF" stroke="#151515" stroke-width="3"/><rect x="14" y="14" width="14" height="10" fill="#FFF" opacity="0.65"/>'));
def(pat('gsWinFar', 40, 46, '<rect x="8" y="8" width="22" height="26" fill="#FFE07A"/>'));
def(pat('gsWinFarOff', 40, 46, '<rect x="8" y="8" width="22" height="26" fill="#000" opacity="0.22"/>'));
def(pat('gsGlassGrid', 80, 90, '<path d="M0 0 H80 M0 0 V90" stroke="#FFFFFF" stroke-width="4" opacity="0.45" fill="none"/><path d="M10 10 L34 10 L10 40 Z" fill="#FFF" opacity="0.22"/>'));
def(pat('gsTrophies', 76, 96, '<path d="M18 22 h40 v10 q0 22 -20 24 q-20 -2 -20 -24 Z M30 56 h16 v12 h-16 Z M24 68 h28 v8 h-28 Z" fill="#FFC83A" stroke="#151515" stroke-width="3" stroke-linejoin="round"/><path d="M18 26 q-12 2 -8 14 q4 6 10 4 M58 26 q12 2 8 14 q-4 6 -10 4" fill="none" stroke="#151515" stroke-width="3"/><rect x="24" y="26" width="6" height="18" fill="#FFF4C0"/><rect x="0" y="80" width="76" height="16" fill="#8A5A34" stroke="#151515" stroke-width="3"/>'));
def(pat('gsConveyor', 60, 40, '<rect width="60" height="40" fill="#3A3F5C"/><path d="M0 0 L20 40 M30 0 L50 40" stroke="#5A6488" stroke-width="10"/>'));
def(pat('gsTileFloor', 120, 120, '<rect width="120" height="120" fill="#FFFFFF" opacity="0"/><rect x="0" y="0" width="60" height="60" fill="#FFF" opacity="0.16"/><rect x="60" y="60" width="60" height="60" fill="#FFF" opacity="0.16"/><path d="M0 0 H120 M0 60 H120 M0 0 V120 M60 0 V120" stroke="#000" stroke-width="3" opacity="0.08"/>'));
def(pat('gsStripes', 60, 60, '<rect width="30" height="60" fill="#FFF" opacity="0.5"/>'));
def(pat('gsPolka', 50, 50, '<circle cx="12" cy="12" r="5" fill="#FFF" opacity="0.4"/><circle cx="37" cy="37" r="5" fill="#FFF" opacity="0.4"/>'));

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
function layersOf(bg = '', mid = '', front = '', fg = '', light = '', extra = {}) {
  const o = { bg, mid, front, fg, light, ...extra };
  Object.defineProperty(o, 'toString', { value() { return this.bg + this.mid + this.front + this.fg + this.light; }, enumerable: false });
  return o;
}
function camSet(layersFn) {
  const fn = (t = 0, cam = {}, o = {}) => String(layersFn(t, cam || {}, o || {}));
  fn.layers = (t = 0, cam = {}, o = {}) => layersFn(t, cam || {}, o || {});
  return fn;
}
// room sets: world-space layers; compose() applies the camera (bg parallax .7) and interleaves characters
function roomSet(layersFn, bgK = 0.7) {
  const fn = (t = 0, o = {}) => { const L = layersFn(t, o || {}); return L.bg + L.mid + L.front + L.fg + L.light; };
  fn.layers = (t = 0, o = {}) => layersFn(t, o || {});
  fn.compose = (t = 0, o = {}, behind = '', onFloor = '', cam = null) => {
    const L = layersFn(t, o || {});
    const v = (s, k) => (cam ? V(cam, s, k) : s);
    return v(L.bg, bgK) + v(L.mid, 1) + v(behind, 1) + v(L.front, 1) + v(onFloor, 1) + v(L.fg, 1) + v(L.light, 1);
  };
  return fn;
}
// spread n crowd members along a stand line {y, k, s, x0, x1, gaps}: [{x, y, s, k, flip, i}] (back -> front order kept)
function placeCrowd(line, n, seed = 1, o = {}) {
  const out = [];
  if (!line || n <= 0) return out;
  const x0 = o.x0 ?? line.x0, x1 = o.x1 ?? line.x1, gaps = o.gaps || line.gaps || [];
  const step = (x1 - x0) / n;
  for (let i = 0; i < n; i++) {
    let x = x0 + step * (i + 0.5) + (hash(i * 3.1 + seed) - 0.5) * step * 0.6;
    if (gaps.some(([a, b]) => x > a && x < b)) continue;
    const dy = (hash(i * 7.7 + seed) - 0.5) * (line.jitter ?? 18);
    out.push({ x: Math.round(x), y: Math.round(line.y + dy), s: line.s * (1 + dy / Math.max(200, (line.y - (line.hor ?? 400)))), k: line.k ?? 1, flip: hash(i * 5.3 + seed) > 0.5, i });
  }
  return out;
}

// ---------------------------------------------------------------- toy primitives
// a brick seen straight-on from a little above: front face (x, y, w, h) + a lighter top face of depth d above it.
// studs: true | step px (studs along the top face). o: { lw, shade (0..1 bottom shade strip), top (top colour), rx }
function brick(x, y, w, h, d, col, tn, o = {}) {
  const lw = o.lw ?? 5, top = o.top || lt(col, 0.32);
  let s = '';
  if (d > 0) s += R(x, y - d, w, d, o.rx ?? 3, tn.ol(top, lw));
  s += R(x, y, w, h, o.rx ?? 3, tn.ol(col, lw));
  if (o.shade !== 0 && h > 16) s += R(x + lw / 2, y + h - Math.min(h * 0.3, 18) - lw / 2, w - lw, Math.min(h * 0.3, 18), 0, tn.fl(dk(col, 0.22), 0.9));
  if (o.hi !== false && h > 24 && w > 24) s += R(x + lw, y + lw, Math.max(0, w - 2 * lw), Math.min(7, h * 0.12), 2, { fill: '#FFF', opacity: 0.25 });
  if (o.studs && d > 6) s += studsD(x, x + w, y - d / 2, d, o.studs === true ? 46 : o.studs, top, tn);
  return s;
}
// studs along a top face (centre line y, face depth d) as two batched paths
function studsD(x0, x1, y, d, step, top, tn, extraOp = 1) {
  const rx = Math.min(step * 0.27, 13), ry = Math.min(d * 0.26, rx * 0.5);
  const n = Math.max(1, Math.floor((x1 - x0) / step)), pad = (x1 - x0 - n * step) / 2;
  let a = '', b = '';
  for (let i = 0; i < n; i++) { const cx = x0 + pad + step * (i + 0.5); a += dE(cx, y + ry * 0.55, rx, ry); b += dE(cx, y - ry * 0.25, rx, ry); }
  return P(a, tn.fl(dk(top, 0.28), 0.8 * extraOp)) + P(b, tn.fl(lt(top, 0.5), extraOp));
}
// batch of bricks (no overlap between them, or the overlap doesn't matter): add() many, out() = 4-5 paths per colour
function brickBatch(tn, o = {}) {
  const groups = new Map();
  const lw = o.lw ?? 5;
  const g = (col) => { let v = groups.get(col); if (!v) { v = { top: '', front: '', shade: '', hi: '', studA: '', studB: '', topCol: lt(col, o.topK ?? 0.32) }; groups.set(col, v); } return v; };
  return {
    add(x, y, w, h, d, col, studs = 0, rx = 3) {
      const q = g(col);
      if (d > 0) q.top += dRR(x, y - d, w, d, rx);
      q.front += dRR(x, y, w, h, rx);
      if (h > 16) q.shade += dR(x + lw / 2, y + h - Math.min(h * 0.3, 18) - lw / 2, w - lw, Math.min(h * 0.3, 18));
      if (h > 24 && w > 24 && o.hi !== false) q.hi += dR(x + lw, y + lw, w - 2 * lw, Math.min(7, h * 0.12));
      if (studs && d > 6) {
        const step = studs === true ? 46 : studs, rx2 = Math.min(step * 0.27, 13), ry = Math.min(d * 0.26, rx2 * 0.5);
        const n = Math.max(1, Math.floor(w / step)), pad = (w - n * step) / 2, yy = y - d / 2;
        for (let i = 0; i < n; i++) { const cx = x + pad + step * (i + 0.5); q.studA += dE(cx, yy + ry * 0.55, rx2, ry); q.studB += dE(cx, yy - ry * 0.25, rx2, ry); }
      }
    },
    out() {
      let s = '';
      for (const [col, q] of groups) {
        s += P(q.front, tn.ol(col, lw)) + P(q.shade, tn.fl(dk(col, 0.22), 0.9)) + P(q.hi, { fill: '#FFF', opacity: 0.25 });
        s += P(q.top, tn.ol(q.topCol, lw)) + P(q.studA, tn.fl(dk(q.topCol, 0.28), 0.8)) + P(q.studB, tn.fl(lt(q.topCol, 0.5)));
      }
      return s;
    },
  };
}
// chunky game-sign text: dark drop shadow + outlined letters
function signText(txt, x, y, size, fill, tn, o = {}) {
  const sh = o.shadow ?? size * 0.07, w = o.w ?? Math.max(6, size * 0.12);
  const ex = { ...(o.anchor ? { 'text-anchor': o.anchor } : {}), ...(o.ls ? { 'letter-spacing': o.ls } : {}) };
  return (sh ? T(txt, x + sh * 0.4, y + sh, size, tn ? tn.c(o.shadowCol || '#2A1650') : '#2A1650', { ...OUTX(w, tn ? tn.line : LINE), ...ex }) : '') + T(txt, x, y, size, tn ? tn.c(fill) : fill, { ...OUTX(w, tn ? tn.line : LINE), ...ex });
}
// cube cloud: a cluster of rounded white cubes (origin = bottom centre), ~300 px wide at s 1
function cubeCloud(x, y, s, tn, col = '#FFFFFF', seed = 0) {
  const sh = mix(col, '#8FB8F0', 0.45);
  const n = 3 + Math.floor(hash(seed * 1.7) * 3);
  const cubes = [];
  for (let i = 0; i < n; i++) {
    const w = 70 + 70 * hash(seed + i * 2.3), cx = (i - (n - 1) / 2) * 62 + (hash(seed + i * 4.1) - 0.5) * 30;
    cubes.push([cx - w / 2, -w * (0.75 + 0.35 * hash(seed + i * 5.3)), w]);
  }
  cubes.push([-130, -58, 260]);
  let dd = '', sd = '', hd = '';
  for (const [cx, cy, w] of cubes) { const h = -cy; dd += dRR(cx, cy, w, h, 16); sd += dR(cx + 8, -16, w - 16, 10); hd += dRR(cx + 10, cy + 8, w * 0.45, 10, 5); }
  const lw = 9 / s;
  return G(P(dd, { fill: tn.line, stroke: tn.line, 'stroke-width': f(lw * tn.lw), 'stroke-linejoin': 'round' }) + P(dd, { fill: tn.c(col) }) + P(sd, tn.fl(sh, 0.9)) + P(hd, { fill: '#FFF', opacity: 0.7 }), tr(x, y, s));
}
// block tree: brick trunk + a canopy of stacked cubes (origin = trunk base). o: col, hi, kind 'round'|'tall'|'blossom', trunkW
function cubeTree(x, y, s, tn, o = {}) {
  const col = o.col || '#3FC266', k = o.kind || 'round', tw = o.trunkW || 70;
  let t = brick(-tw / 2, -200, tw, 200, 0, C.woodD, tn, { lw: 6 }) + P(`M${-tw / 2 + 14} -180 V-20`, tn.ln(6, lt(C.woodD, 0.3), 0.7));
  const cubes = k === 'tall'
    ? [[-110, -470, 220, 280], [-80, -650, 160, 190], [-50, -760, 100, 120]]
    : k === 'blossom'
      ? [[-190, -420, 200, 220], [-10, -440, 200, 240], [-110, -560, 220, 180]]
      : [[-200, -400, 205, 200], [-5, -410, 205, 210], [-130, -560, 260, 190]];
  for (const [cx, cy, w, h] of cubes) t += brick(cx, cy + 40, w, h - 40, 40, col, tn, { lw: 6, studs: 52 });
  if (k === 'blossom' || o.fruit) { let d = ''; for (let i = 0; i < 7; i++) d += dRR(-170 + hash(i * 3.3 + x) * 320, -500 + hash(i * 5.1 + x) * 300, 18, 18, 4); t += P(d, tn.ol(o.fruit || '#FFFFFF', 3)); }
  return G(t, tr(x, y, s));
}
// a row of hedge cubes along y (front faces stand on y), height h
function hedgeRow(x0, x1, y, h, tn, seed = 1, col = '#36B65C') {
  const B = brickBatch(tn, { lw: 5 });
  for (let x = x0, i = 0; x < x1; i++) {
    const w = 80 + 60 * hash(i * 3.7 + seed), hh = h * (0.8 + 0.35 * hash(i * 1.9 + seed));
    B.add(x, y - hh, Math.min(w, x1 - x), hh, 26, hash(i * 2.3 + seed) > 0.8 ? '#2FA650' : col, 40);
    x += w;
  }
  return B.out();
}
// lamp post with a cube lantern (origin = base). on: lit
function cubeLamp(x, y, s, tn, on, t = 0) {
  let l = R(-12, -330, 24, 330, 4, tn.ol(C.dark, 5)) + R(-30, -24, 60, 24, 4, tn.ol(C.dark, 5));
  l += R(-34, -410, 68, 76, 8, tn.ol(on ? '!#FFF1B0' : '#E6F4FF', 6)) + R(-40, -424, 80, 18, 5, tn.ol(C.dark, 5)) + R(-40, -338, 80, 12, 4, tn.ol(C.dark, 4));
  if (!on) l += R(-24, -400, 18, 54, 3, { fill: '#FFF', opacity: 0.6 });
  return G(l, tr(x, y, s));
}
// chunky wooden sign board on two posts (origin = bottom centre)
function signBoard(x, y, w, h, lines, tn, o = {}) {
  const col = o.col || C.wood, ink = o.ink || '#FFFFFF', post = o.post ?? 120;
  let s = '';
  if (post > 0) s += R(-w * 0.32 - 10, -post, 20, post, 3, tn.ol(C.woodD, 5)) + R(w * 0.32 - 10, -post, 20, post, 3, tn.ol(C.woodD, 5));
  s += R(-w / 2, -post - h, w, h, 14, tn.ol(col, 7)) + R(-w / 2 + 10, -post - h + 10, w - 20, h - 20, 9, { fill: 'none', stroke: tn.c(lt(col, 0.35)), 'stroke-width': 4 });
  const L = Array.isArray(lines) ? lines : [lines];
  const size = o.size || Math.min(h * 0.5 / Math.max(1, L.length * 0.82), (w * 1.6) / Math.max(4, Math.max(...L.map((l) => l.length))));
  L.forEach((ln_, i) => { s += T(ln_, 0, -post - h / 2 + size * 0.36 + (i - (L.length - 1) / 2) * size * 1.05, size, tn.c(ink), OUTX(Math.max(3, size * 0.1), tn.line)); });
  return G(s, tr(x, y, o.s || 1, o.rot || 0));
}
// floating-island underside: stepped dirt/stone blocks below a top edge (x0..x1 at y) + dangling cubes
function islandBottom(x0, x1, y, depth, tn, seed = 1, o = {}) {
  const B = brickBatch(tn, { lw: o.lw ?? 5, hi: false });
  const rows = o.rows || 4, rh = depth / rows, W = x1 - x0;
  const cols = [o.dirt || C.dirt, o.stone || '#9AA3C2', o.dirt2 || C.dirtD, o.stone2 || '#7F88A8'];
  let s = '';
  for (let j = 0; j < rows; j++) {
    const k = 1 - (j + 0.8) / (rows + 0.4), w = W * (0.16 + 0.8 * Math.pow(Math.max(0, k), 1.1)), cx = (x0 + x1) / 2 + (hash(seed + j * 1.7) - 0.5) * W * 0.16 * (j / rows);
    const yy = y + j * rh, n = Math.max(1, Math.round(w / 110));
    let xx = cx - w / 2;
    for (let i = 0; i < n; i++) {
      const bw = i === n - 1 ? cx + w / 2 - xx : (w / n) * (0.75 + 0.5 * hash(seed + i * 3.1 + j));
      const c = j === 0 ? cols[0] : cols[Math.floor(hash(seed * 3.3 + j * 1.9 + i * 0.7) * 4)];
      B.add(xx, yy, bw, rh + 3, 0, c);
      xx += bw;
    }
  }
  s += B.out();
  if (o.drips !== false) {
    let d = '';
    for (let i = 0; i < 4; i++) { const u = 0.2 + 0.6 * hash(seed + i * 7.3), j = Math.floor(rows * (0.5 + 0.5 * hash(seed + i * 2.1))); const k = 1 - (j + 0.5) / rows, w = W * (0.18 + 0.82 * Math.pow(k, 1.25)); const xx = (x0 + x1) / 2 + (u - 0.5) * w * 0.8, yy = y + (j + 1) * rh, sz = Math.max(10, rh * (0.35 + 0.3 * hash(i + seed))); d += dRR(xx - sz / 2, yy, sz, sz, 3); }
    s += P(d, tn.ol(C.dirtD, 4));
  }
  return s;
}
// a grass-topped floating plot: top surface (x0..x1, from yTop back edge to yFront) + front grass/dirt face + stepped underside
function grassPlot(x0, x1, yBack, yFront, faceH, tn, seed = 1, o = {}) {
  let s = '';
  const top = o.top || C.grass;
  s += R(x0, yBack, x1 - x0, yFront - yBack, 10, tn.ol(top, 6));
  if (o.tex !== false) s += R(x0 + 6, yBack + 6, x1 - x0 - 12, yFront - yBack - 12, 8, { fill: 'url(#gsGrassTex)', opacity: 0.9 });
  s += R(x0 + 6, yBack + 4, x1 - x0 - 12, 10, 4, { fill: '#FFF', opacity: 0.2 });
  // front face: a grass lip + dirt bricks
  s += R(x0, yFront, x1 - x0, 26, 6, tn.ol(dk(top, 0.12), 6));
  let teeth = '';
  for (let x = x0 + 20; x < x1 - 40; x += 70) teeth += dRR(x + 10 * hash(x * 0.1 + seed), yFront + 20, 34, 16 + 14 * hash(x + seed), 6);
  s += R(x0, yFront + 22, x1 - x0, faceH - 22, 6, tn.ol(o.dirt || C.dirt, 6)) + R(x0, yFront + 22, x1 - x0, faceH - 22, 6, { fill: 'url(#gsBrick)', opacity: 0.9 });
  s += P(teeth, tn.ol(dk(top, 0.12), 4));
  if (o.under !== false) s += islandBottom(x0 + 20, x1 - 20, yFront + faceH, o.depth ?? (x1 - x0) * 0.32, tn, seed, { rows: o.rows || 4 });
  return s;
}
// a fire (flickering, cube-ish flames) origin = base, ~140 wide at s 1
function fire(x, y, s, t, seed = 0, tn = null) {
  let a = '', b = '', c = '';
  for (let i = 0; i < 5; i++) {
    const ph = t * (7 + 3 * hash(seed + i)) + seed * 3 + i * 1.7, fl = 0.75 + 0.25 * Math.sin(ph);
    const xx = (i - 2) * 26 + Math.sin(ph * 0.7) * 6, h = (90 + 70 * hash(seed + i * 3.1) - Math.abs(i - 2) * 22) * fl;
    a += `M${f(xx - 26)} 0 Q${f(xx - 30)} ${f(-h * 0.5)} ${f(xx + Math.sin(ph) * 8)} ${f(-h)} Q${f(xx + 30)} ${f(-h * 0.5)} ${f(xx + 26)} 0 Z`;
    b += `M${f(xx - 14)} 0 Q${f(xx - 16)} ${f(-h * 0.35)} ${f(xx + Math.sin(ph) * 6)} ${f(-h * 0.62)} Q${f(xx + 16)} ${f(-h * 0.35)} ${f(xx + 14)} 0 Z`;
    c += dR(xx - 6 + Math.sin(ph * 1.3) * 10, -h * (1.1 + 0.3 * md(t * 1.3 + i * 0.37, 1)), 10, 10);
  }
  void tn;
  return G(P(a, { fill: '#FF5A1F', stroke: LINE, 'stroke-width': 4, 'stroke-linejoin': 'round' }) + P(b, { fill: '#FFD23F' }) + P(c, { fill: '#FFB23A', opacity: 0.85 }), tr(x, y, s));
}
// smoke column of cube puffs rising from (x, y). k = amount 0..1
function smoke(x, y, s, t, k = 1, seed = 0, col = '#5A5370') {
  if (k <= 0.01) return '';
  let d = '', d2 = '';
  for (let i = 0; i < 6; i++) {
    const u = md(t * 0.16 + i / 6 + seed * 0.13, 1), w = (60 + 80 * u) * (0.8 + 0.4 * hash(seed + i));
    const xx = Math.sin(u * 3 + seed + i) * 40 * u + u * 60, yy = -u * 520;
    d += dRR(xx - w / 2, yy - w / 2, w, w, w * 0.28);
    d2 += dRR(xx - w / 2 + 8, yy - w / 2 + 6, w * 0.4, w * 0.25, 6);
  }
  return G(P(d, { fill: col, opacity: op(0.62 * k) }) + P(d2, { fill: '#FFFFFF', opacity: op(0.12 * k) }), tr(x, y, s));
}
// rubble pile of tumbled bricks (origin = base centre, ~w wide)
function rubble(x, y, w, tn, seed = 1, cols = [C.stone, C.stoneD, '#C9B9A0']) {
  const n = Math.round(w / 34);
  let s = '';
  for (let i = 0; i < n; i++) {
    const u = hash(seed + i * 1.37), xx = (u - 0.5) * w, ht = (1 - Math.abs(u - 0.5) * 2) * w * 0.28, yy = -ht * hash(seed + i * 2.9) - 10;
    const bw = 34 + 30 * hash(seed + i * 4.1), bh = 22 + 18 * hash(seed + i * 6.7), rot = (hash(seed + i * 8.3) - 0.5) * 70;
    s += G(R(-bw / 2, -bh / 2, bw, bh, 4, tn.ol(cols[i % cols.length], 4)) + R(-bw / 2 + 4, -bh / 2 + 4, bw * 0.5, 5, 2, { fill: '#FFF', opacity: 0.3 }), `translate(${f(x + xx)} ${f(y + yy)}) rotate(${f(rot)})`);
  }
  return s;
}
// cheap crowd of blocky avatars, heads + shoulders (+ arms when cheering). rows: [{x0, x1, y (shoulder line), s, seed, gaps, dx}]
// o: { cheer 0..1, t, light 0..1 (1 = lit, 0 = silhouette), dark, signs: ['GO!', ...], tone: tn, back (seen from behind) }
const CROWD_SHIRT = ['#FF4D5E', '#FF8A3D', '#FFD23F', '#3DCB6C', '#22B8C8', '#4C7DFF', '#9B5CFF', '#FF6FB5', '#2E3550', '#F7F5FF', '#7ED957', '#5AC8FA'];
const CROWD_SKIN = ['#FFD23F', '#F9D7B5', '#E8B890', '#C98A5E', '#8E5634', '#FFD23F', '#F2C89E'];
const CROWD_HAIR = ['#3A2418', '#151515', '#C4561D', '#FFE08A', '#6A3FBF', '#FF6FB5', '#2E9C9C', '#8A5A34'];
function crowd(rows, o = {}) {
  const tn = o.tone || tone();
  const cheer = b01(o.cheer), t = o.t || 0, lt_ = o.light ?? 1, dark = o.dark || '#1E1440';
  const col = (c) => mix(tn.c(c), dark, 1 - lt_);
  let out = '';
  rows.forEach((row, ri) => {
    const s = row.s, dx = (row.dx || 300) * s, seed = row.seed ?? ri * 7 + 3;
    const B = { shirt: {}, skin: {}, hair: {}, hat: {}, arm: {} };
    const add = (bk, c, d) => { bk[c] = (bk[c] || '') + d; };
    let eyes = '', mouth = '', signs = '', i = 0;
    for (let x = row.x0 + hash(seed) * dx * 0.5; x < row.x1; x += dx * (0.86 + 0.28 * hash(i * 1.31 + seed)), i++) {
      if (row.gaps && row.gaps.some(([a, b]) => x > a && x < b)) continue;
      const h = (k) => hash(i * k + seed * 13.1);
      const shirt = CROWD_SHIRT[Math.floor(h(3.1) * CROWD_SHIRT.length)], skin = CROWD_SKIN[Math.floor(h(5.3) * CROWD_SKIN.length)];
      const up = cheer * (h(9.1) < 0.85 ? 1 : 0.2);
      const bob = up > 0 ? Math.abs(Math.sin(t * 8 + i * 1.3)) * 22 * s * up : Math.sin(t * 2 + i) * 3 * s;
      const y = row.y + (row.yOff ? row.yOff(x) : 0) + (h(2.7) - 0.5) * 14 * s - bob;
      const hx_ = x + (h(6.1) - 0.5) * 16 * s, hw = 170 * s, hh = 150 * s;
      if (up > 0.05) {
        const sw = Math.sin(t * 7 + i * 1.7) * 26 * s * up, ah = 250 * s * up;
        add(B.arm, shirt, dR(x - 150 * s, y - ah + 20 * s + sw * 0.4, 56 * s, ah) + dR(x + 94 * s, y - ah + 20 * s - sw * 0.4, 56 * s, ah));
        add(B.skin, skin, dR(x - 150 * s, y - ah + sw * 0.4, 56 * s, 40 * s) + dR(x + 94 * s, y - ah - sw * 0.4, 56 * s, 40 * s));
        if (o.signs && h(11.3) < 0.18) {
          const txt = o.signs[Math.floor(h(12.7) * o.signs.length)], sx = x + 120 * s, sy = y - ah - 120 * s;
          signs += R(sx - 150 * s, sy - 60 * s, 300 * s, 120 * s, 10 * s, tn.ol(h(14.1) > 0.5 ? '#FFFFFF' : '#FFE14D', Math.max(2, 10 * s))) + T(txt, sx, sy + 26 * s, 74 * s, tn.c('#E8263A'));
        }
      }
      add(B.shirt, shirt, s < 0.3 ? dR(x - 150 * s, y, 300 * s, 230 * s) : dRR(x - 150 * s, y, 300 * s, 230 * s, 20 * s));
      add(B.skin, skin, s < 0.3 ? dR(hx_ - hw / 2, y - hh - 8 * s, hw, hh) : dRR(hx_ - hw / 2, y - hh - 8 * s, hw, hh, 26 * s));
      const hk = Math.floor(h(13.7) * 5), ht = y - hh - 8 * s;
      if (hk === 0) add(B.hair, CROWD_HAIR[Math.floor(h(7.7) * CROWD_HAIR.length)], dR(hx_ - hw / 2 - 6 * s, ht - 26 * s, hw + 12 * s, 66 * s));
      else if (hk === 1) add(B.hat, CANDY[Math.floor(h(8.3) * CANDY.length)], dR(hx_ - hw / 2 - 4 * s, ht - 30 * s, hw + 8 * s, 56 * s) + dR(hx_ - hw / 2 - 4 * s, ht + 14 * s, hw + 60 * s, 18 * s));
      else if (hk === 2) add(B.hair, CROWD_HAIR[Math.floor(h(4.7) * CROWD_HAIR.length)], `M${f(hx_ - hw / 2 - 8 * s)} ${f(ht + 70 * s)} V${f(ht - 10 * s)} H${f(hx_ + hw / 2 + 8 * s)} V${f(ht + 40 * s)} L${f(hx_ + hw * 0.1)} ${f(ht + 30 * s)} L${f(hx_ - hw * 0.3)} ${f(ht + 44 * s)} Z`);
      else if (hk === 3) add(B.hat, '#FFC83A', `M${f(hx_ - hw * 0.4)} ${f(ht + 6 * s)} l${f(hw * 0.13)} ${f(-56 * s)} l${f(hw * 0.13)} ${f(36 * s)} l${f(hw * 0.14)} ${f(-46 * s)} l${f(hw * 0.14)} ${f(46 * s)} l${f(hw * 0.13)} ${f(-36 * s)} l${f(hw * 0.13)} ${f(56 * s)} Z`);
      if (!o.back && lt_ > 0.3 && s > 0.07) {
        const ey = y - hh * 0.55, ex = 34 * s;
        eyes += dR(hx_ - ex - 9 * s, ey - 16 * s, 18 * s, 30 * s) + dR(hx_ + ex - 9 * s, ey - 16 * s, 18 * s, 30 * s);
        if (up > 0.3) mouth += `M${f(hx_ - 34 * s)} ${f(ey + 30 * s)} H${f(hx_ + 34 * s)} Q${f(hx_)} ${f(ey + 86 * s)} ${f(hx_ - 34 * s)} ${f(ey + 30 * s)} Z`;
        else mouth += `M${f(hx_ - 26 * s)} ${f(ey + 40 * s)} Q${f(hx_)} ${f(ey + 60 * s)} ${f(hx_ + 26 * s)} ${f(ey + 40 * s)}`;
      }
    }
    const outl = row.outline ?? s >= 0.12, sw = Math.max(1.5, 13 * s);
    const fillA = (c) => (outl ? { fill: col(c), stroke: tn.line, 'stroke-width': f(sw), 'stroke-linejoin': 'round' } : { fill: col(c) });
    for (const [c, d] of Object.entries(B.arm)) out += P(d, fillA(c));
    for (const [c, d] of Object.entries(B.shirt)) out += P(d, fillA(c));
    for (const [c, d] of Object.entries(B.skin)) out += P(d, fillA(c));
    for (const [c, d] of Object.entries(B.hair)) out += P(d, fillA(c));
    for (const [c, d] of Object.entries(B.hat)) out += P(d, fillA(c));
    if (eyes) out += P(eyes, { fill: LINE });
    if (mouth && outl) out += P(mouth, cheer > 0.3 ? { fill: '#6A1A2A' } : { fill: 'none', stroke: LINE, 'stroke-width': f(Math.max(1.5, 8 * s)), 'stroke-linecap': 'round' });
    out += signs;
  });
  return out;
}
// sky rectangle covering a layer's visible box
const skyBox = (v, fill, extra = {}) => R(v.x0 - 300, v.y0 - 300, v.x1 - v.x0 + 600, v.y1 - v.y0 + 600, 0, { fill, ...extra });
const glow = (x, y, r, id = 'gsGlowWarm', o_ = 1) => (o_ > 0.003 ? CI(x, y, r, { fill: `url(#${id})`, opacity: op(o_) }) : '');
// sky with time + extra cross-fades (raid / dawn). Returns svg for the k 0 layer.
function skyFor(v, o, extra = {}) {
  const time = o.time || 'day';
  const id = time === 'night' ? 'gsSkyNight' : time === 'sunset' ? 'gsSkySunset' : 'gsSkyDay';
  let s = skyBox(v, `url(#${extra.base || id})`);
  if (extra.raid > 0) s += skyBox(v, 'url(#gsSkyRaid)', { opacity: op(extra.raid) });
  if (time === 'night' || extra.raid > 0 || extra.base === 'gsSkyNight') s += R(v.x0 - 300, v.y0 - 300, v.x1 - v.x0 + 600, (v.y1 - v.y0) * 0.75 + 300, 0, { fill: 'url(#gsStars)', opacity: op((extra.stars ?? 1) * (1 - (extra.dawn || 0))) });
  if (extra.dawn > 0) s += skyBox(v, 'url(#gsSkyDawn)', { opacity: op(extra.dawn) });
  return s;
}
// blocky moon / sun
function moon(x, y, r, tn) {
  let s = glow(x, y, r * 3, 'gsGlowWhite', 0.28) + CI(x, y, r, tn.ol('!#FFF4D0', 7));
  s += P(dRR(x - r * 0.5, y - r * 0.3, r * 0.34, r * 0.34, 4) + dRR(x + r * 0.12, y + r * 0.2, r * 0.26, r * 0.26, 4) + dRR(x + r * 0.2, y - r * 0.55, r * 0.18, r * 0.18, 3), { fill: '#E8D49A' });
  return s;
}
function sun(x, y, r, t, col = '#FFE45C') {
  let rays = '';
  for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2 + t * 0.15; rays += dP([[x + Math.cos(a - 0.08) * r * 1.25, y + Math.sin(a - 0.08) * r * 1.25], [x + Math.cos(a) * r * 1.75, y + Math.sin(a) * r * 1.75], [x + Math.cos(a + 0.08) * r * 1.25, y + Math.sin(a + 0.08) * r * 1.25]]); }
  return glow(x, y, r * 3.2, 'gsGlowWarm', 0.9) + P(rays, { fill: '#FFE98A', opacity: 0.85 }) + R(x - r, y - r, r * 2, r * 2, r * 0.42, { fill: col, stroke: '#FFB42E', 'stroke-width': 8 }) + R(x - r * 0.6, y - r * 0.62, r * 0.5, r * 0.3, 8, { fill: '#FFF', opacity: 0.55 });
}
// pop-in scale for building parts: part with threshold th appears while k passes th (outBack squash)
const popK = (k, th, w = 0.12) => (k <= th ? 0 : k >= th + w ? 1 : ease.outBack((k - th) / w));
const popG = (svg, k, cx, cy) => (k <= 0.001 ? '' : Math.abs(k - 1) < 0.001 ? svg : G(svg, `translate(${f(cx)} ${f(cy)}) scale(${f(k)} ${f(k * (1 + (1 - Math.min(1, k)) * 0.25))}) translate(${f(-cx)} ${f(-cy)})`));
// flying debris cubes for a pop (u 0..1 = age)
function popBits(cx, cy, u, seed, n = 6, r = 140) {
  if (u <= 0 || u >= 1) return '';
  let d = '';
  for (let i = 0; i < n; i++) { const a = -Math.PI * (0.1 + 0.8 * hash(seed + i)), rr = r * u * (0.6 + 0.6 * hash(seed + i * 3)); const w = 18 * (1 - u) + 4; d += dR(cx + Math.cos(a) * rr - w / 2, cy + Math.sin(a) * rr + 200 * u * u - w / 2, w, w); }
  return P(d, { fill: CANDY[Math.floor(hash(seed) * 9)], stroke: LINE, 'stroke-width': 3, opacity: op(1 - u * 0.6) });
}

def(lg('gsPadBeam', [[0, '#7FF6FF', 0], [0.7, '#7FF6FF', 0.22], [1, '#BFFFFF', 0.55]]));
def(lg('gsPadBeamG', [[0, '#FFE58A', 0], [0.7, '#FFE58A', 0.25], [1, '#FFF4C0', 0.6]]));

// ================================================================= 1. SPAWN PLAZA (lobby) + the first obby over water
// World (k 1 plane): the plaza floor (pastel tiles) runs from the back hedge (y 640) to the camera; stand line FLOOR 940 (s .4);
// depth scale sAt(y) = .4·(y − 420)/520. Left → right: the tree grove (the HIDE tree x −900, drawn in `front`), the 4 SPAWN
// PADS (x −300…600, y 858), the signpost, the FOUNTAIN (x 1000), the BLEACHER steps (x 1300…1760), the speech CRATE
// (x 1900), the plain WALL = the obby's start block (x 2250…2560, top 700), the WATER pool (x 2560…3840) with three platforms,
// the STAGE 2 finish block (3840…4440), more trees. Behind: portals terrace (k .8: ARENA / TYCOON VALLEY / OBBY TOWER), the
// giant CUBE CITY letter-block sign on a floating island (k .5), the leaderboard billboard (k .6), skyline (k .25),
// floating islands (k .14), cube clouds (k .06), sky (k 0).
// o: { time 'day'|'sunset'|'night', pads [0..1 ×4] (spawn flash per pad), billboard (true = the TOP PLAYERS board on its scaffold, or svg|fn(w,h) for the screen; default none), skyscraper (Granny's tower
//      on the skyline), wallSign (default true: the "↑ JUMP" sign on the wall), crowdTurn (unused by the set), flash 0..1 }
const PZ = {
  floor: 940, s: 0.4, hor: 420, back: 640,
  pads: [-150, 150, 450, 750], padY: 858,
  fountain: { x: 1380, y: 790 }, bleach: { x0: 1720, x1: 2180, base: 820 }, crate: { x: 2330, y: 990, w: 190, h: 118 },
  wall: { x0: 2600, x1: 2910, top: 700 }, water: { x0: 2910, x1: 4190, y: 955 },
  plats: [{ x0: 3120, x1: 3300, col: C.red }, { x0: 3510, x1: 3670, col: C.yellow }, { x0: 3880, x1: 4030, col: C.mint }],
  finish: { x0: 4190, x1: 4790, top: 700 }, top: 700,
  tree: { x: -620, y: 975 }, sign: { x: 1030, y: 905 },
};
const PZ_LAMPS = [[-900, 700], [300, 700], [1960, 700], [4950, 700], [80, 1060]];
const pzS = (y) => PZ.s * (y - PZ.hor) / (PZ.floor - PZ.hor);
// the floor rows (perspective bands) between y0 and y1
const PZ_ROWS = (() => { const r = [PZ.back]; let h = 26; while (r[r.length - 1] < 1700) { r.push(r[r.length - 1] + h); h *= 1.16; } return r; })();
function plazaFloor(x0, x1, tn, skip = []) {
  let s = '';
  const c1 = '#F4EBFF', c2 = '#E1D2FF', gold = '#FFE7A6';
  for (let j = 0; j < PZ_ROWS.length - 1; j++) {
    const ya = PZ_ROWS[j], yb = PZ_ROWS[j + 1], h = yb - ya, tw = h * 2.6;
    s += R(x0, ya, x1 - x0, h + 1, 0, tn.fl(c1));
    let d = '', dg = '';
    const off = j % 2 ? tw : 0;
    for (let x = Math.floor((x0 - off) / (2 * tw)) * 2 * tw + off; x < x1; x += 2 * tw) {
      if (skip.some(([a, b]) => x + tw > a && x < b)) continue;
      // a golden path runs from the spawn pads to the right
      if (Math.abs(ya - 880) < 70 && x > -500 && x < 2200) dg += dR(x, ya, tw, h); else d += dR(x, ya, tw, h);
    }
    s += P(d, tn.fl(c2)) + P(dg, tn.fl(gold));
    s += P(`M${f(x0)} ${f(ya)} H${f(x1)}`, tn.ln(2.5, '#B9A6E8', 0.55));
  }
  return s;
}
// spawn pad (origin = centre of its top face). k = flash 0..1
function spawnPad(x, y, s, tn, t, k = 0, night = 0) {
  const w = 250, d = 64, h = 34;
  let p = R(-w / 2, d / 2, w, h, 6, tn.ol('#5A6488', 6)) + R(-w / 2, -d / 2, w, d, 10, tn.ol('#C9D3F2', 6));
  p += studsD(-w / 2 + 6, -w / 2 + 50, 0, d, 40, '#C9D3F2', tn) + studsD(w / 2 - 50, w / 2 - 6, 0, d, 40, '#C9D3F2', tn);
  const pulse = 0.5 + 0.5 * Math.sin(t * 3 + x * 0.01);
  p += E(0, 0, 82, 22, tn.ol('!#38E8FF', 5)) + E(0, 0, 56, 14, { fill: '#C8FFFF', opacity: op(0.55 + 0.4 * pulse) });
  p += P('M-62 0 L-46 -9 M46 -9 L62 0', tn.ln(4, '#FFFFFF', 0.6));
  for (let i = 0; i < 4; i++) { const u = md(t * 0.5 + i * 0.25 + x * 0.003, 1); p += R(-50 + i * 30, -20 - u * 260, 12, 12, 2, { fill: '#BFFFFF', opacity: op((1 - u) * (0.5 + night * 0.4)) }); }
  const beam = 0.25 + 0.25 * night + 0.75 * k;
  p += P('M-74 0 L-90 -520 L90 -520 L74 0 Z', { fill: 'url(#gsPadBeam)', opacity: op(beam) });
  if (k > 0) p += E(0, 0, 82 + 120 * k, 22 + 34 * k, { fill: 'none', stroke: '#FFFFFF', 'stroke-width': 8, opacity: op(1 - k) });
  return G(p, tr(x, y, s / 0.34));
}
// the giant CUBE CITY sign: one letter per studded cube, bobbing (origin = bottom centre)
function letterSign(txt, x, y, size, tn, t, cols = [C.red, C.orange, C.yellow, C.green, C.sky, C.blue, C.purple, C.pink]) {
  let s = '';
  const L = txt.split(''), gap = size * 0.16, w = size, n = L.length;
  let ci = 0;
  const total = L.reduce((a, ch) => a + (ch === ' ' ? w * 0.45 : w + gap), -gap);
  let xx = x - total / 2;
  L.forEach((ch, i) => {
    if (ch === ' ') { xx += w * 0.45; return; }
    const col = cols[ci++ % cols.length], bob = Math.sin(t * 2.2 + i * 0.7) * size * 0.04, rot = Math.sin(t * 1.6 + i * 1.3) * 2.5;
    const cx = xx + w / 2, cy = y - w / 2 + bob;
    let b = brick(-w / 2, -w / 2 + w * 0.18, w, w * 0.82, w * 0.18, col, tn, { lw: Math.max(5, w * 0.05), studs: w / 2.05, rx: w * 0.06 });
    b += T(ch, 0, w * 0.4, w * 0.74, tn.c('#FFFFFF'), OUTX(w * 0.075, tn.line));
    s += G(b, `translate(${f(cx)} ${f(cy)}) rotate(${f(rot)})`);
    xx += w + gap;
  });
  void n;
  return s;
}
// a portal arch built of bricks with a swirling inside + a game sign above. origin = base centre
function portalArch(x, base, w, h, col, label, icon, tn, t, night = 0) {
  const bw = 46;
  let s = '';
  // swirl inside
  const ih = h - bw, iw = w - 2 * bw;
  s += R(x - iw / 2, base - ih, iw, ih, iw * 0.5 > 60 ? 60 : iw * 0.3, tn.ol(mix(col, '#22163A', 0.25), 5));
  let sw = '';
  for (let i = 0; i < 4; i++) { const r = (iw * 0.42) * (1 - i * 0.22); const a = t * (1.6 + i * 0.4) + i; sw += `M${f(x + Math.cos(a) * r)} ${f(base - ih / 2 + Math.sin(a) * r * 1.2)} A${f(r)} ${f(r * 1.2)} 0 0 1 ${f(x + Math.cos(a + 2.2) * r)} ${f(base - ih / 2 + Math.sin(a + 2.2) * r * 1.2)} `; }
  s += P(sw, { fill: 'none', stroke: tn.c(lt(col, 0.55)), 'stroke-width': 12, 'stroke-linecap': 'round', opacity: 0.85 });
  s += E(x, base - ih / 2, iw * 0.2, ih * 0.16, { fill: tn.c(lt(col, 0.7)), opacity: 0.7 });
  // the brick frame: two columns + a top beam, keystone in candy
  const B = brickBatch(tn, { lw: 5 });
  for (let yy = base - bw; yy > base - h; yy -= bw) { B.add(x - w / 2, yy, bw, bw, 0, '#C9D3F2'); B.add(x + w / 2 - bw, yy, bw, bw, 0, '#C9D3F2'); }
  for (let xx = x - w / 2; xx < x + w / 2 - 1; xx += bw) B.add(xx, base - h - bw + 14, Math.min(bw, x + w / 2 - xx), bw, 14, Math.abs(xx + bw / 2 - x) < bw / 2 ? col : '#C9D3F2', 24);
  s += B.out();
  // sign board above
  const sw2 = Math.max(w + 40, label.length * 26 + 110), sy = base - h - bw - 120;
  s += P(`M${f(x - sw2 * 0.3)} ${f(sy + 90)} V${f(base - h - bw + 4)} M${f(x + sw2 * 0.3)} ${f(sy + 90)} V${f(base - h - bw + 4)}`, tn.ln(8));
  s += R(x - sw2 / 2, sy, sw2, 92, 18, tn.ol(col, 7)) + R(x - sw2 / 2 + 8, sy + 8, sw2 - 16, 18, 8, { fill: '#FFF', opacity: 0.3 });
  s += gameIcon(icon, x - sw2 / 2 + 52, sy + 46, 0.9, tn);
  s += T(label, x + 24, sy + 62, 44, tn.c('#FFFFFF'), OUTX(7, tn.line));
  if (night) s += glow(x, base - ih / 2, iw * 0.9, col === C.red ? 'gsGlowFire' : col === C.purple ? 'gsGlowPurple' : 'gsGlowCyan', 0.55 * night);
  return s;
}
// small game icons (origin = centre, ~60 px at s 1): swords, coin, tower, cookie, crown, star, hotdog
function gameIcon(kind, x, y, s, tn) {
  let o = '';
  switch (kind) {
    case 'swords': o = P('M-24 24 L22 -22 M-22 -22 L24 24', tn.ln(16)) + P('M-24 24 L22 -22 M-22 -22 L24 24', tn.ln(8, '#E8EEF8')) + P('M-30 14 L-14 30 M30 14 L14 30', tn.ln(9, C.goldD)); break;
    case 'coin': o = CI(0, 0, 28, tn.ol(C.gold, 6)) + R(-9, -14, 18, 28, 4, tn.ol(C.goldD, 4)); break;
    case 'tower': o = R(-16, -26, 32, 52, 3, tn.ol('#C9D3F2', 5)) + R(-24, -34, 48, 14, 3, tn.ol(C.purple, 5)) + R(-6, -10, 12, 14, 2, { fill: LINE }); break;
    case 'cookie': o = CI(0, 0, 28, tn.ol('#E0A35A', 6)) + P(dR(-12, -12, 8, 8) + dR(6, -4, 8, 8) + dR(-6, 8, 8, 8), { fill: tn.c('#5A3018') }); break;
    case 'crown': o = P('M-28 18 L-28 -16 L-14 0 L0 -24 L14 0 L28 -16 L28 18 Z', tn.ol(C.gold, 5)); break;
    case 'star': o = P('M0 -30 L9 -9 L31 -8 L13 6 L19 28 L0 15 L-19 28 L-13 6 L-31 -8 L-9 -9 Z', tn.ol(C.yellow, 5)); break;
    default: o = R(-22, -22, 44, 44, 8, tn.ol('#FFFFFF', 5));
  }
  return G(o, tr(x, y, s));
}
// tiered block fountain (origin = front-bottom centre of the basin)
function fountain(x, y, s, tn, t, night = 0) {
  let o = '';
  // basin: wide block ring (front face) + water top face
  o += R(-300, -70, 600, 70, 8, tn.ol('#C9D3F2', 6)) + R(-300, -70, 600, 70, 8, { fill: 'url(#gsBrick)' });
  o += R(-300, -140, 600, 74, 30, tn.ol('#E4EAFF', 6)) + R(-276, -128, 552, 52, 24, tn.ol(night ? '!#3FA8E8' : C.water, 4));
  o += R(-276, -128, 552, 52, 24, { fill: 'url(#gsWaterTex)', opacity: 0.8 });
  // pedestal + bowl + top cube + star
  o += brick(-46, -250, 92, 140, 0, '#E4EAFF', tn, { lw: 6 }) + brick(-130, -300, 260, 44, 22, '#C9D3F2', tn, { lw: 6, studs: 44 });
  o += R(-112, -318, 224, 20, 10, tn.ol(night ? '!#3FA8E8' : C.water, 4));
  o += brick(-30, -400, 60, 82, 0, '#E4EAFF', tn, { lw: 5 });
  o += G(P('M0 -36 L11 -11 L37 -10 L16 6 L23 32 L0 18 L-23 32 L-16 6 L-37 -10 L-11 -11 Z', tn.ol(night ? '!#FFE27A' : C.gold, 6)), `translate(0 -446) rotate(${f(Math.sin(t * 1.5) * 8)})`);
  // water arcs (animated dashes) + splash bits
  let arcs = '';
  for (const sx of [-1, 1]) { arcs += `M${sx * 30} -380 Q${sx * 150} -470 ${sx * 200} -330 M${sx * 110} -305 Q${sx * 210} -330 ${sx * 250} -110 `; }
  o += P(arcs, { fill: 'none', stroke: tn.c(night ? '!#9FE6FF' : '#BFF0FF'), 'stroke-width': 14, 'stroke-linecap': 'round', 'stroke-dasharray': '34 18', 'stroke-dashoffset': f(-t * 120), opacity: 0.9 });
  let sp = '';
  for (let i = 0; i < 8; i++) { const u = md(t * 1.6 + i * 0.37, 1), sx = i % 2 ? 1 : -1; sp += dR(sx * (200 + 60 * hash(i)) + Math.sin(i) * 20, -110 - Math.sin(u * Math.PI) * 50, 10, 10); }
  o += P(sp, { fill: '#FFFFFF', opacity: 0.85 });
  if (night) o += glow(0, -110, 330, 'gsGlowCyan', 0.45 * night);
  return G(o, tr(x, y, s));
}
// wooden crate (origin = bottom centre) w x h with a depth-d top
function crate(x, y, w, h, d, tn) {
  let o = brick(-w / 2, -h, w, h, d, C.wood, tn, { lw: 6 });
  o += P(`M${-w / 2 + 10} ${-h + 10} L${w / 2 - 10} -10 M${w / 2 - 10} ${-h + 10} L${-w / 2 + 10} -10`, tn.ln(8, C.woodD));
  o += R(-w / 2 + 4, -h + 4, w - 8, h - 8, 4, { fill: 'none', stroke: tn.c(C.woodD), 'stroke-width': 8 });
  o += P(`M${-w / 2 + 6} ${-h - d / 2} H${w / 2 - 6}`, tn.ln(4, C.woodD, 0.7));
  return G(o, tr(x, y));
}
// a tumbleweed ball of cubes (SC04 silence gag). origin = centre, rot in degrees
function cubeWeed(x, y, s = 1, rot = 0, tn = tone()) {
  let d = '', d2 = '';
  for (let i = 0; i < 9; i++) { const a = i * 2.4, r = 26 * Math.sqrt(i / 9) * 1.4; d += dRR(Math.cos(a) * r - 18, Math.sin(a) * r - 18, 36, 36, 6); d2 += dR(Math.cos(a) * r - 12, Math.sin(a) * r - 13, 14, 5); }
  return G(P(d, tn.ol('#C9A86A', 4)) + P(d2, { fill: '#FFF', opacity: 0.35 }), tr(x, y, s, rot));
}
// leaderboard billboard frame (k .6 layer). content: svg centred on (0,0) of the screen box, or fn(w, h)
function billboardFrame(x, y, w, h, tn, t, content, night) {
  let o = R(x - w * 0.3 - 14, y + h / 2, 28, 420, 4, tn.ol(C.slate, 6)) + R(x + w * 0.3 - 14, y + h / 2, 28, 420, 4, tn.ol(C.slate, 6));
  o += P(`M${f(x - w * 0.3)} ${f(y + h / 2 + 40)} L${f(x + w * 0.3)} ${f(y + h / 2 + 200)} M${f(x + w * 0.3)} ${f(y + h / 2 + 40)} L${f(x - w * 0.3)} ${f(y + h / 2 + 200)}`, tn.ln(8, C.slate));
  o += R(x - w / 2 - 26, y - h / 2 - 26, w + 52, h + 52, 22, tn.ol('#2E3550', 8));
  let bulbs = '';
  for (let i = 0; i < 14; i++) { const u = i / 13; bulbs += dC(x - w / 2 + u * w, y - h / 2 - 13, 7) + dC(x - w / 2 + u * w, y + h / 2 + 13, 7); }
  o += P(bulbs, { fill: (Math.floor(t * 3) % 2) ? '#FFE27A' : '#FFF6D0' });
  o += R(x - w / 2, y - h / 2, w, h, 8, { fill: night ? '#141038' : '#1C1850' });
  if (content) o += G(typeof content === 'function' ? content(w, h) : content, `translate(${f(x)} ${f(y)})`);
  else {
    o += T('TOP PLAYERS', x, y - h / 2 + 64, 52, '#FFD23F', OUTX(6));
    const rows = [['1', 'xX_DarkBlade_Xx', '#FFD23F'], ['2', 'YOU', '#E8EEF8'], ['3', 'NoodleBoi', '#FFB38A']];
    rows.forEach(([n, name, c], i) => { const yy = y - h / 2 + 130 + i * 62; o += R(x - w / 2 + 30, yy - 38, w - 60, 52, 12, { fill: '#FFFFFF', opacity: 0.08 }) + T('#' + n, x - w / 2 + 80, yy, 40, c) + TF(name, x - w / 2 + 130, yy - 2, 34, '#FFFFFF', { 'text-anchor': 'start' }); });
  }
  o += R(x - w / 2, y - h / 2, w, h, 8, { fill: 'url(#gsShine)', opacity: 0.6 });
  return o;
}
// a skyline of blocky towers between x0..x1 on base (far layer). o: lit (night windows 0..1), hMin, hVar, skip [[a, b]], pal
function skyline(x0, x1, base, tn, seed, o = {}) {
  let s = '', wins = '';
  const pal = o.pal || ['#F6B6D6', '#B9C8FF', '#FFE0A0', '#B8F0D8', '#D8C2FF', '#FFC8B0', '#A8E6FF'];
  const roofs = o.roofs || [C.red, C.sky, C.purple, C.orange, C.mint, C.pink];
  const lw = o.lw ?? 4;
  for (let x = Math.floor(x0 / 600) * 600 - 300 * hash(seed), i = Math.floor(x0 / 600) * 7; x < x1; i++) {
    const w = 90 + 90 * hash(i * 2.1 + seed), h = (o.hMin ?? 90) + (o.hVar ?? 150) * hash(i * 3.7 + seed), col = pal[Math.floor(hash(i * 5.9 + seed) * pal.length)];
    const bx = x, by = base - h, rc = roofs[Math.floor(hash(i * 8.1 + seed) * roofs.length)], kind = Math.floor(hash(i * 6.7 + seed) * 5);
    x += w + 8 + 30 * hash(i * 9.1 + seed);
    if (bx + w < x0 || (o.skip && o.skip.some(([a, b]) => bx + w > a && bx < b))) continue;
    if (kind === 1) s += P(`M${f(bx - 8)} ${f(by + 4)} L${f(bx + w / 2)} ${f(by - w * 0.5)} L${f(bx + w + 8)} ${f(by + 4)} Z`, tn.ol(rc, lw));
    else if (kind === 2) s += P(`M${f(bx + 6)} ${f(by + 2)} A${f(w / 2 - 6)} ${f(w / 2 - 6)} 0 0 1 ${f(bx + w - 6)} ${f(by + 2)} Z`, tn.ol(rc, lw));
    else if (kind === 3) s += R(bx + w * 0.22, by - h * 0.28, w * 0.56, h * 0.3, 4, tn.ol(lt(col, 0.15), lw)) + R(bx + w * 0.47, by - h * 0.28 - 50, 6, 50, 2, tn.fl(C.slate));
    s += R(bx, by, w, h + 400, 4, tn.ol(col, lw));
    if (kind === 0 || kind === 4) s += R(bx - 6, by - 12, w + 12, 16, 4, tn.ol(rc, lw));
    wins += dR(bx + 12, by + 18, w - 24, h - 30);
  }
  s += P(wins, { fill: o.lit ? 'url(#gsWinFar)' : 'url(#gsWinFarOff)', opacity: o.lit ? op(o.lit) : 0.9 });
  return s;
}
// far landmark silhouettes: the arena colosseum + the obby tower spire (+ Granny's tower)
function farArena(x, base, s, tn) {
  let o = P('M-300 0 L-300 -120 Q0 -170 300 -120 L300 0 Z', tn.ol('#E8C9A0', 5));
  let a = '';
  for (let i = 0; i < 9; i++) a += dRR(-270 + i * 62, -100, 36, 70, 16);
  o += P(a, tn.fl('#9A7A5A')) + R(-310, -136, 620, 22, 6, tn.ol('#F2DBB8', 4));
  o += P('M-200 -136 V-200 M0 -146 V-220 M200 -136 V-200', tn.ln(5)) + P('M-200 -200 h40 l-10 14 l10 14 h-40 M0 -220 h44 l-10 14 l10 14 h-44 M200 -200 h40 l-10 14 l10 14 h-40', tn.ol(C.red, 3));
  return G(o, tr(x, base, s));
}
function farTower(x, base, s, tn, t, night = 0) {
  let o = R(-30, -1500, 60, 1500, 6, tn.ol('#7A5AC8', 5));
  let pl = '';
  for (let i = 0; i < 14; i++) { const yy = -120 - i * 100, xx = Math.sin(i * 1.3) * 70; pl += dRR(xx - 50, yy, 100, 22, 5); }
  o += P(pl, tn.ol('#C9A8FF', 4));
  o += R(-90, -1560, 180, 40, 8, tn.ol('#C9A8FF', 5)) + P('M0 -1660 L34 -1600 L0 -1570 L-34 -1600 Z', tn.ol('!#7FF6FF', 4));
  if (night) o += glow(0, -1610, 120, 'gsGlowCyan', 0.7 * night);
  void t;
  return G(o, tr(x, base, s));
}
function farSkyscraper(x, base, s, tn, night = 0) {
  let o = R(-120, -1300, 240, 1300, 6, tn.ol(night ? '#2A3478' : '#7FD6FF', 5)) + R(-110, -1290, 220, 1280, 0, { fill: 'url(#gsGlassGrid)', opacity: 0.6 });
  o += R(-140, -1330, 280, 40, 6, tn.ol('#FF8FC8', 5)) + CI(0, -1420, 80, tn.ol(night ? '!#FFB45A' : '#E0A35A', 6)) + P(dR(-30, -1450, 18, 18) + dR(14, -1430, 18, 18) + dR(-12, -1400, 18, 18), { fill: '#5A3018' });
  if (night) o += glow(0, -1420, 220, 'gsGlowWarm', 0.8);
  return G(o, tr(x, base, s));
}

function plazaLayers(t, cam, o) {
  const time = o.time || 'day', night = time === 'night' ? 1 : 0, sunset = time === 'sunset' ? 1 : 0;
  const tw = timeTone(o);
  const tn = tone(tw);
  const hazeCol = night ? '#3A2C7A' : sunset ? '#FFB6A8' : '#CDEBFF';
  const tnF = tone({ ...tw, haze: 0.45, hazeCol }), tnM = tone({ ...tw, haze: 0.22, hazeCol });
  const pads = o.pads || [];
  // ---- sky (k 0) + sun/moon (k .03) + clouds (k .06)
  const v0 = vis(cam, 0);
  const sky = skyFor(v0, o);
  const sunm = night ? moon(1540, 190, 74, tn) : sunset ? sun(1380, 430, 70, t, '#FFD06A') : sun(1560, 150, 62, t);
  const vc = vis(cam, 0.06);
  let cl = '';
  for (let i = Math.floor((vc.x0 - 500) / 700); i * 700 < vc.x1 + 500; i++) {
    const x = i * 700 + md(hash(i * 2.7) * 420 + t * 8, 700), y = 110 + 220 * hash(i * 9.3), s = 0.45 + 0.35 * hash(i * 5.5);
    cl += cubeCloud(x, y, s, tn, night ? '#5A4C9A' : sunset ? '#FFE0E6' : '#FFFFFF', i);
  }
  // ---- floating islands (k .14)
  const vi = vis(cam, 0.14);
  let isl = '';
  for (let i = Math.floor((vi.x0 - 600) / 900); i * 900 < vi.x1 + 600; i++) {
    const x = i * 900 + 300 * hash(i * 4.1), y = 330 + 120 * hash(i * 6.3), w = 150 + 110 * hash(i * 3.3);
    isl += G(grassPlot(x - w / 2, x + w / 2, y - 20, y, 20, tnF, i, { depth: w * 0.45, rows: 3, tex: false }) + (hash(i * 7.7) > 0.4 ? cubeTree(x - w * 0.15, y - 6, 0.16, tnF, { col: hash(i) > 0.5 ? '#FF8FC8' : '#3FC266', kind: hash(i * 2) > 0.5 ? 'blossom' : 'round' }) : ''), null);
  }
  // ---- skyline (k .25) with the far arena + obby tower (+ Granny's skyscraper)
  const vs = vis(cam, 0.25);
  let sk = skyline(vs.x0 - 300, vs.x1 + 300, 640, tnF, 3, { lit: night ? 0.9 : 0, skip: [[-420, 40], [1500, 1760], [2140, 2300]] });
  sk = farArena(-190, 610, 0.62, tnF) + farTower(2220, 640, 0.4, tnF, t, night) + (o.skyscraper ? farSkyscraper(1630, 640, 0.36, tnF, night) : '') + sk;
  // ---- the CUBE CITY sign on its floating island (k .5) + the billboard (k .6)
  const vSign = vis(cam, 0.5);
  let sign = '';
  if (vSign.x1 > -200 && vSign.x0 < 1500) {
    sign += grassPlot(-80, 1280, 330, 362, 34, tnM, 7, { depth: 300, rows: 5 }) + cubeTree(-30, 352, 0.22, tnM, { kind: 'blossom', col: '#FF8FC8' }) + cubeTree(1215, 352, 0.2, tnM, { kind: 'round' });
    sign += letterSign('CUBE CITY', 600, 332, 122, tnM, t);
    if (night) sign += glow(600, 260, 430, 'gsGlowPink', 0.3);
  }
  const vb = vis(cam, 0.6);
  let bb = '';
  if (o.billboard && vb.x1 > 1100 && vb.x0 < 2600) bb += billboardFrame(1860, 250, 520, 290, tnM, t, o.billboard === true ? null : o.billboard, night);
  // ---- portal terrace (k .8)
  const vp = vis(cam, 0.8);
  let por = R(vp.x0 - 300, 600, vp.x1 - vp.x0 + 600, 80, 0, tnM.fl('#7ED98A')) + P(`M${f(vp.x0 - 300)} 600 H${f(vp.x1 + 300)}`, tnM.ln(5));
  por += hedgeRow(Math.floor((vp.x0 - 300) / 400) * 400, vp.x1 + 300, 606, 46, tnM, 5, '#45C46A');
  const PORT = [[-640, C.red, 'ARENA', 'swords'], [2560, C.gold, 'TYCOON VALLEY', 'coin'], [3700, C.purple, 'OBBY TOWER', 'tower']];
  for (const [x, col, lab, ic] of PORT) if (x > vp.x0 - 500 && x < vp.x1 + 500) por += portalArch(x, 612, 260, 300, col, lab, ic, tnM, t, night);
  // ---- main plane (k 1)
  const v1 = vis(cam, 1);
  const X0 = Math.floor((v1.x0 - 300) / 100) * 100, X1 = v1.x1 + 300;
  const WT = PZ.water;
  let m = '';
  m += plazaFloor(X0, X1, tn, [[WT.x0, WT.x1]]);
  // back hedge along the floor's back edge (k 1)
  m += hedgeRow(X0, X1, PZ.back + 6, 52, tn, 11);
  // pool: back rim + water body + ripples (the water below the stand line is repeated in `front` for sinking avatars)
  if (WT.x1 > X0 && WT.x0 < X1) {
    m += R(WT.x0, PZ.back - 8, WT.x1 - WT.x0, 40, 4, tn.ol('#C9D3F2', 5));
    m += waterBody(WT.x0, WT.x1, PZ.back + 30, 1700, tn, t, night);
  }
  // trees in the grove + far right (back ones first)
  const trees = [[-1500, 700, 'round', '#3FC266'], [-1180, 760, 'blossom', '#FF8FC8'], [-300, 690, 'tall', '#2FB35A'], [5080, 760, 'round', '#3FC266'], [5600, 700, 'blossom', '#FFB0D8'], [-1900, 990, 'round', '#3FC266'], [6000, 1000, 'tall', '#2FB35A'], [-2500, 760, 'tall', '#2FB35A']];
  for (const [x, y, kind, col] of trees) if (x > X0 - 400 && x < X1 + 400) m += cubeTree(x, y, pzS(y) * 2.3, tn, { kind, col });
  // lamps
  for (const [x, y] of PZ_LAMPS) if (x > X0 - 200 && x < X1 + 200) m += cubeLamp(x, y, pzS(y) * 2.2, tn, night, t);
  // fountain
  const FT = PZ.fountain;
  if (FT.x + 500 > X0 && FT.x - 500 < X1) m += fountain(FT.x, FT.y, pzS(FT.y) * 3.4, tn, t, night);
  // bleacher steps
  const BL = PZ.bleach;
  if (BL.x1 > X0 && BL.x0 < X1) {
    const B = brickBatch(tn, { lw: 5 });
    const cols = ['#9AA8FF', '#FFB38A', '#7FE0C0'];
    for (let j = 2; j >= 0; j--) { const top = BL.base - 60 - j * 90; B.add(BL.x0 + j * 18, top, BL.x1 - BL.x0 - j * 36, BL.base - top, 30, cols[j], 46); }
    m += B.out();
  }
  // spawn pads + signpost
  PZ.pads.forEach((x, i) => { if (x > X0 - 300 && x < X1 + 300) m += spawnPad(x, PZ.padY, pzS(PZ.padY), tn, t, b01(pads[i]), night); });
  {
    const SG = PZ.sign, ss = pzS(SG.y) * 2.4;
    let g = R(-12, -330, 24, 330, 3, tn.ol(C.woodD, 5));
    const arrows = [['ARENA', -1, C.red, -300], ['TYCOON VALLEY', 1, C.gold, -240], ['OBBY TOWER', 1, C.purple, -180]];
    for (const [lab, dir, col, yy] of arrows) {
      const w = lab.length * 15 + 60;
      const pts = dir > 0 ? [[-20, yy - 24], [w - 20, yy - 24], [w + 4, yy], [w - 20, yy + 24], [-20, yy + 24]] : [[20, yy - 24], [-w + 20, yy - 24], [-w - 4, yy], [-w + 20, yy + 24], [20, yy + 24]];
      g += P(dP(pts), tn.ol(col, 5)) + TF(lab, dir > 0 ? w / 2 - 14 : -w / 2 + 14, yy + 10, 26, tn.c('#FFFFFF'), OUTX(4, tn.line));
    }
    if (SG.x > X0 - 300 && SG.x < X1 + 300) m += G(g, tr(SG.x, SG.y, ss));
  }
  // the crate
  const CR = PZ.crate;
  if (CR.x > X0 - 200 && CR.x < X1 + 200) m += crate(CR.x, CR.y, CR.w, CR.h, 36, tn);
  // the plain wall (= the obby's start block) + its sign
  const WL = PZ.wall;
  if (WL.x1 > X0 && WL.x0 < X1) {
    m += brick(WL.x0, WL.top, WL.x1 - WL.x0, PZ.floor - WL.top, 36, '#B9C6E6', tn, { lw: 6, studs: 46 });
    m += R(WL.x0 + 3, WL.top + 3, WL.x1 - WL.x0 - 6, PZ.floor - WL.top - 6, 0, { fill: 'url(#gsBrickBig)' });
    if (o.wallSign !== false) m += signBoard(WL.x0 + 110, WL.top - 18, 170, 96, ['STAGE 1', 'JUMP!'], tn, { col: C.blue, post: 70, size: 30 }) + G(P('M0 -40 L30 0 L12 0 L12 34 L-12 34 L-12 0 L-30 0 Z', tn.ol(C.yellow, 5)), tr(WL.x0 + 110, WL.top - 250, 0.9));
    m += obbyFlag(WL.x1 - 50, WL.top - 18, 0.9, tn, t, C.blue, '1');
  }
  // the platforms over the water
  for (const p of PZ.plats) if (p.x1 > X0 && p.x0 < X1) {
    m += brick(p.x0, PZ.top, p.x1 - p.x0, WT.y - PZ.top + 30, 36, p.col, tn, { lw: 6, studs: 44 });
    m += ripple(p.x0, p.x1, WT.y, t, tn);
  }
  // the STAGE 2 finish block
  const FN = PZ.finish;
  if (FN.x1 > X0 && FN.x0 < X1) {
    m += brick(FN.x0, FN.top, FN.x1 - FN.x0, PZ.floor - FN.top, 36, '#B9C6E6', tn, { lw: 6, studs: 46 }) + R(FN.x0 + 3, FN.top + 3, FN.x1 - FN.x0 - 6, PZ.floor - FN.top - 6, 0, { fill: 'url(#gsBrickBig)' });
    m += ripple(FN.x0, FN.x0 + 40, WT.y, t, tn);
    m += checkpointPad(FN.x0 + 300, FN.top - 18, 1, tn, t, 'STAGE 2', night);
  }
  // ---- front (k 1): the HIDE tree + the water in front of the stand line (sinking avatars)
  let fr = '';
  const TR = PZ.tree;
  if (TR.x > X0 - 500 && TR.x < X1 + 500) fr += cubeTree(TR.x, TR.y, 1.12, tn, { kind: 'round', col: '#36BE5E', trunkW: 128 });
  if (WT.x1 > X0 && WT.x0 < X1) fr += waterFront(WT.x0, WT.x1, WT.y, 1700, tn, t, night);
  // ---- fg (k 1.3): flower cubes at the bottom edge
  const vf = vis(cam, 1.3);
  let fg = '';
  for (let i = Math.floor((vf.x0 - 600) / 1500); o.flowers && i * 1500 < vf.x1 + 600; i++) {
    const x = i * 1500 + 500 * hash(i * 3.9);
    if (!o.flowers || hash(i * 5.1) < 0.45) continue;
    fg += flowerBed(x, 1180, 1.1, tn, i, t);
  }
  // ---- light
  let light = '';
  if (night) {
    let gl = '';
    for (const [x, y] of PZ_LAMPS) { const s = pzS(y) * 2.2; gl += glow(x, y - 372 * s, 150 * s / 0.4, 'gsGlowWarm', 0.85); }
    PZ.pads.forEach((x) => { gl += glow(x, PZ.padY - 40, 190, 'gsGlowCyan', 0.55); });
    light += V(cam, gl, 1);
  }
  if (sunset) light += V(cam, skyBox(v0, '#FF9A50', { opacity: 0.07 }), 0);
  if (o.flash > 0) light += R(0, 0, 1920, 1080, 0, { fill: '#FFFFFF', opacity: op(o.flash) });
  return layersOf(V(cam, sky, 0) + V(cam, sunm, 0.03) + V(cam, cl, 0.06) + V(cam, isl, 0.14) + V(cam, sk, 0.25) + V(cam, sign, 0.5) + V(cam, bb, 0.6) + V(cam, por, 0.8),
    V(cam, m, 1), V(cam, fr, 1), V(cam, fg, 1.3), light);
}
// water body (top view surface) between x0..x1 from y0 down, animated ripples
function waterBody(x0, x1, y0, y1, tn, t, night = 0) {
  const col = night ? '!#2F7FD0' : C.water;
  let s = R(x0, y0, x1 - x0, y1 - y0, 0, { fill: tn.c(col) });
  const dx = md(t * 30, 160);
  s += G(R(x0 - dx, y0, x1 - x0, y1 - y0, 0, { fill: 'url(#gsWaterTex)', opacity: 0.8 }), `translate(${f(dx)} 0)`, { 'clip-path': undefined });
  s += R(x0, y0, x1 - x0, 60, 0, tn.fl(dk(C.water, 0.18), 0.5));
  return s;
}
// the water in front of the stand line (front layer): a band starting at the water line y
function waterFront(x0, x1, y, y1, tn, t, night = 0) {
  const col = night ? '#2F7FD0' : C.water;
  let s = R(x0, y, x1 - x0, y1 - y, 0, { fill: tn.c(col), opacity: 0.9 });
  let wv = `M${f(x0)} ${f(y + 6)}`;
  for (let x = x0; x < x1; x += 60) wv += ` Q${f(x + 15)} ${f(y - 4 + Math.sin(t * 3 + x * 0.05) * 3)} ${f(x + 30)} ${f(y + 6)} T${f(x + 60)} ${f(y + 6)}`;
  s += P(wv, { fill: 'none', stroke: '#FFFFFF', 'stroke-width': 6, opacity: 0.7 });
  return s;
}
function ripple(x0, x1, y, t, tn) {
  const u = md(t * 0.8 + x0 * 0.001, 1);
  return E((x0 + x1) / 2, y + 6, (x1 - x0) / 2 + 20 + 40 * u, 14 + 10 * u, { fill: 'none', stroke: tn.c('#FFFFFF'), 'stroke-width': 5, opacity: op(0.7 * (1 - u)) }) + E((x0 + x1) / 2, y + 4, (x1 - x0) / 2 + 12, 12, { fill: 'none', stroke: tn.c('#E6FAFF'), 'stroke-width': 5, opacity: 0.8 });
}
// an obby stage flag on a pole (origin = pole base)
function obbyFlag(x, y, s, tn, t, col, label = '') {
  const wv = Math.sin(t * 5 + x) * 6;
  let o = R(-6, -210, 12, 210, 4, tn.ol('#E8EEF8', 4)) + CI(0, -216, 10, tn.ol(C.gold, 4));
  o += P(`M6 -204 Q40 ${-210 + wv} 80 -200 L80 -140 Q40 ${-150 - wv} 6 -144 Z`, tn.ol(col, 5));
  if (label) o += T(label, 42, -160, 40, tn.c('#FFFFFF'), OUTX(5, tn.line));
  return G(o, tr(x, y, s));
}
// checkpoint pad with a "STAGE n" flag (origin = pad top centre)
function checkpointPad(x, y, s, tn, t, label = 'STAGE 2', night = 0) {
  let o = E(0, 0, 120, 28, tn.ol('#2BD46A', 6)) + E(0, -3, 84, 16, { fill: '#BFFFD8', opacity: op(0.6 + 0.3 * Math.sin(t * 3)) });
  o += P('M-80 0 L-96 -360 L96 -360 L80 0 Z', { fill: 'url(#gsPadBeamG)', opacity: op(0.35 + 0.3 * night) });
  o += G(R(-6, -300, 12, 300, 4, tn.ol('#E8EEF8', 4)) + P(`M6 -296 Q60 ${-300 + Math.sin(t * 5) * 6} 120 -290 L120 -220 Q60 ${-230 - Math.sin(t * 5) * 6} 6 -226 Z`, tn.ol('#2BD46A', 5)), 'translate(130 0)');
  o += G(R(-104, -36, 208, 62, 14, tn.ol('#1C1850', 5)) + T(label, 0, 12, 36, '#FFFFFF'), 'translate(0 -420)');
  return G(o, tr(x, y, s));
}
// foreground flower bed (k 1.3)
function flowerBed(x, y, s, tn, seed, t) {
  let o = brick(-200, -80, 400, 120, 30, '#45C46A', tn, { lw: 7, studs: 50 });
  let fl = '', st = '';
  for (let i = 0; i < 6; i++) { const xx = -160 + i * 64, h = 60 + 50 * hash(seed + i), sw = Math.sin(t * 2 + i) * 4; st += `M${xx} -100 L${f(xx + sw)} ${f(-100 - h)} `; fl += dRR(xx + sw - 18, -100 - h - 18, 36, 36, 8); }
  o = P(st, tn.ln(8, '#2F9A4A')) + P(fl, tn.ol(CANDY[seed % 9], 5)) + o;
  return G(o, tr(x, y, s));
}
const plaza = camSet(plazaLayers);

// ================================================================= 2. BATTLE ARENA (colosseum ring)
// World (k 1): the raised RING (sand top with a painted emblem, stone border, a stone front face at the bottom of the
// frame) — back edge y 700 (x 180…1740), front edge y 1010 (x −80…2000); stand line FLOOR 900 (s .42), depth scale
// sAt(y) = .42·(y − 380)/520. Four corner pillars with torches. Behind: the barrier wall (k .9: arches, BATTLE ARENA banners,
// torches), the curved stands full of a cheap crowd (k .7, 5 tiers), hanging banners on the rim, the SCOREBOARD (k .6),
// sky (k 0). `raid` = the Block King smashed it: a broken gap in the stands, torn banners, cracked ring, rubble, fires, smoke.
// o: { time 'day'|'sunset'|'night', crowd 0..1 (fill, default 1; raid default 0), cheer 0..1, signs ['GO MOM!', …] (crowd
//      signs), board [lines] | string (scoreboard text; default ['BATTLE ARENA', 'KING OF THE RING']), raid 0..1, near (dark
//      crowd heads at the bottom corners, fg k 1.25), flash 0..1 }
const AR = { floor: 900, s: 0.42, hor: 380, back: 700, front: 1010, bx0: 180, bx1: 1740, fx0: -80, fx1: 2000, wall: 560 };
const AR_BOARD = { x: 960, y: 250, w: 560, h: 210, k: 0.8 };
const arS = (y) => AR.s * (y - AR.hor) / (AR.floor - AR.hor);
const arEdge = (y) => { const u = (y - AR.back) / (AR.front - AR.back); return { x0: lerp(AR.bx0, AR.fx0, u), x1: lerp(AR.bx1, AR.fx1, u) }; };
const AR_TIERS = 4, AR_TY = (j) => 520 - j * 90, AR_CURVE = 70e-6;
const arArc = (x) => AR_CURVE * (x - 960) * (x - 960);
// torch on a bracket (origin = flame base)
function torch(x, y, s, t, tn, seed = 0, night = 0) {
  let o = P('M-22 0 L22 0 L14 46 L-14 46 Z', tn.ol(C.slate, 5)) + R(-8, 46, 16, 60, 3, tn.ol(C.woodD, 4));
  o += fire(0, 4, 0.42, t, seed);
  if (night) o += glow(0, -30, 150, 'gsGlowFire', 0.75);
  return G(o, tr(x, y, s));
}
// a hanging banner (origin = top centre). torn 0..1
function banner(x, y, w, h, col, icon, tn, t, torn = 0, seed = 0) {
  const sw = Math.sin(t * 2 + seed) * 4;
  const hh = h * (1 - 0.45 * torn);
  let bottom = `L${f(w / 2 + sw)} ${f(hh)} L${f(sw)} ${f(hh - 40)} L${f(-w / 2 + sw)} ${f(hh)}`;
  if (torn > 0) bottom = `L${f(w / 2 + sw)} ${f(hh)} L${f(w * 0.2)} ${f(hh - 50)} L${f(w * 0.05)} ${f(hh + 20)} L${f(-w * 0.25)} ${f(hh - 30)} L${f(-w / 2 + sw)} ${f(hh + 10)}`;
  let o = P(`M${-w / 2} 0 L${w / 2} 0 ${bottom} Z`, tn.ol(col, 5));
  o += P(`M${-w / 2 + 12} 10 V${f(hh - 30)} M${w / 2 - 12} 10 V${f(hh - 30)}`, tn.ln(5, lt(col, 0.4), 0.8));
  o += R(-w / 2 - 12, -12, w + 24, 18, 6, tn.ol(C.gold, 4));
  if (icon && hh > 120) o += gameIcon(icon, sw * 0.5, hh * 0.42, w / 110, tn);
  return G(o, tr(x, y, 1, torn * (hash(seed) - 0.5) * 14));
}
function arenaLayers(t, cam, o) {
  const time = o.time || 'day', night = time === 'night' ? 1 : 0, sunset = time === 'sunset' ? 1 : 0;
  const raid = b01(o.raid), crowdK = b01(o.crowd, raid > 0.5 ? 0 : 1), cheer = b01(o.cheer);
  const tw = timeTone(o, { raid: raid * 0.85 });
  const tn = tone(tw);
  const hazeCol = raid > 0.5 ? '#5A1E4A' : night ? '#2E2470' : sunset ? '#FFB6A8' : '#DCEFFF';
  const tnS = tone({ ...tw, haze: 0.16, hazeCol }), tnB = tone({ ...tw, haze: 0.28, hazeCol });
  const lit = night || raid > 0.3 ? 1 : 0;
  // ---- sky
  const v0 = vis(cam, 0);
  let sky = skyFor(v0, o, { raid });
  const vs0 = vis(cam, 0.04);
  let sunm = night || raid ? moon(1560, 160, 64, tn) : sunset ? sun(400, 300, 70, t, '#FFD06A') : sun(1600, 120, 58, t);
  if (!night && !raid) { for (let i = 0; i < 4; i++) sunm += cubeCloud(md(i * 620 + t * 6, 2600) - 300 + (vs0.x0 > 0 ? 0 : 0), 120 + 90 * hash(i * 3.3), 0.4 + 0.2 * hash(i), tn, sunset ? '#FFE0E6' : '#FFFFFF', i + 3); }
  // ---- the gate tower with the SCOREBOARD (k .8)
  let board = '';
  {
    const bx = 960, by = AR_BOARD.y, bw = AR_BOARD.w, bh = AR_BOARD.h;
    const cracked = raid > 0.3;
    let gt = brick(bx - 230, by + bh / 2 + 10, 460, 700 - by - bh / 2, 30, '#D9C4A0', tnB, { lw: 6, studs: 50 }) + R(bx - 227, by + bh / 2 + 13, 454, 700 - by - bh / 2 - 6, 0, { fill: 'url(#gsBrickBig)' });
    gt += P(`M${bx - 110} 700 V${by + bh / 2 + 150} A110 110 0 0 1 ${bx + 110} ${by + bh / 2 + 150} V700 Z`, tnB.ol(raid > 0.3 ? '#2A0A20' : '#3A2A50', 6));
    gt += P(`M${bx - 110} ${by + bh / 2 + 190} H${bx + 110} M${bx - 110} ${by + bh / 2 + 250} H${bx + 110} M${bx - 60} ${by + bh / 2 + 70} V700 M${bx} ${by + bh / 2 + 42} V700 M${bx + 60} ${by + bh / 2 + 70} V700`, tnB.ln(7, '#6A5A7A', 0.9));
    let sb = R(bx - bw / 2 - 24, by - bh / 2 - 24, bw + 48, bh + 48, 24, tnB.ol('#2E3550', 8)) + R(bx - bw / 2, by - bh / 2, bw, bh, 10, { fill: '#160F3A' });
    const L = Array.isArray(o.board) ? o.board : o.board ? [o.board] : ['BATTLE ARENA', 'KING OF THE RING'];
    if (!cracked || Math.sin(t * 23) > -0.3) L.forEach((ln_, i) => { sb += T(ln_, bx, by - bh / 2 + (L.length === 1 ? bh / 2 + 26 : 86 + i * 76), i === 0 ? 68 : 50, i === 0 ? '#FFD23F' : '#7FF6FF', OUTX(5, '#000')); });
    sb += R(bx - bw / 2, by - bh / 2, bw, bh, 10, { fill: 'url(#gsShine)', opacity: 0.5 });
    let bulbs = '';
    for (let i = 0; i < 12; i++) bulbs += dC(bx - bw / 2 + (i / 11) * bw, by - bh / 2 - 12, 6) + dC(bx - bw / 2 + (i / 11) * bw, by + bh / 2 + 12, 6);
    sb += P(bulbs, { fill: Math.floor(t * 3) % 2 ? '#FFE27A' : '#FFF6D0' });
    sb += gameIcon('crown', bx, by - bh / 2 - 60, 1.4, tnB);
    if (cracked) sb += P(`M${bx - 80} ${by - bh / 2} L${bx - 40} ${by - 30} L${bx - 100} ${by + 20} L${bx - 50} ${by + bh / 2}`, tnB.ln(7, '#FFFFFF', 0.8)) + R(bx + 60, by - bh / 2, bw / 2 - 60, bh, 0, { fill: '#000', opacity: 0.6 });
    board = gt + (cracked ? G(sb, `rotate(${f(-6 * raid)} ${bx} ${by + 200})`) : sb);
  }
  // ---- stands (k .7): curved tiers with the crowd, rim banners
  const vS = vis(cam, 0.7);
  const SX0 = vS.x0 - 400, SX1 = vS.x1 + 400;
  const gapA = 1180, gapB = 1720;
  const inGap = (x) => raid > 0.2 && x > gapA && x < gapB;
  let st = '';
  // the rim (top) + banner poles
  const rimY = AR_TY(AR_TIERS - 1) - 70;
  const arcPts = (y, x0, x1) => { const p = []; for (let x = x0; x <= x1 + 1; x += 120) p.push([x, y + arcY(x)]); return p; };
  const arcY = (x) => arAr(x);
  function arAr(x) { return arArc(x); }
  const band = (yTop, yBot, x0, x1) => { const a = arcPts(yTop, x0, x1), b = arcPts(yBot, x0, x1).reverse(); return dP([...a, ...b]); };
  const segs = raid > 0.2 ? [[SX0, gapA], [gapB, SX1]] : [[SX0, SX1]];
  // back wall of the stands (behind the top tier)
  for (const [a, b] of segs) st += P(band(rimY - 60, AR_TY(0) + 200, a, b), tnS.ol('#C9B8A0', 6));
  for (const [a, b] of segs) st += P(band(rimY - 60, rimY - 20, a, b), tnS.ol('#E8D8BE', 5));
  if (raid > 0.2) {
    // broken edges of the gap: jagged teeth
    let jag = '';
    for (const [gx, dir] of [[gapA, 1], [gapB, -1]]) for (let j = 0; j < 7; j++) { const y = rimY - 40 + j * 80, w = 30 + 50 * hash(j * 3.1 + gx); jag += dRR(gx - (dir > 0 ? 0 : w), y + arArc(gx), w, 60, 6); }
    st += P(jag, tnS.ol('#C9B8A0', 5));
  }
  for (let j = AR_TIERS - 1; j >= 0; j--) {
    const y = AR_TY(j);
    for (const [a, b] of segs) st += P(band(y - 26, y, a, b), tnS.ol(j % 2 ? '#E8D8BE' : '#DCC8AA', 5));
    // crowd on this tier
    if (crowdK > 0.02) {
      const rows = [];
      const s = 0.2 - j * 0.014;
      for (const [a, b] of segs) rows.push({ x0: a, x1: b, y: y - 34, s, seed: j * 11 + 5, dx: 300 / Math.max(0.15, crowdK), curve: true });
      // curve: offset each row's y by the arc — draw per segment chunks of 600 px for the arc
      st += crowd(rows.map((r) => ({ ...r, yOff: arArc })), { tone: tnS, cheer, t, signs: o.signs, light: lit && !night ? 0.85 : 1 });
    }
    for (const [a, b] of segs) st += P(band(y, y + 66, a, b), tnS.ol(j % 2 ? '#B8A488' : '#A8947A', 5));
    for (const [a, b] of segs) st += P(band(y + 8, y + 16, a, b), { fill: '#FFF', opacity: 0.18 });
  }
  // rim banners + flags
  for (let x = Math.floor(SX0 / 260) * 260 + 130; x < SX1; x += 260) {
    if (inGap(x)) continue;
    const i = Math.round(x / 260), col = [C.red, C.blue, C.gold, C.purple][md(i, 4)];
    st += R(x - 6, rimY - 180 + arArc(x), 12, 140, 3, tnS.ol(C.slate, 4));
    st += P(`M${x + 6} ${f(rimY - 176 + arArc(x))} l70 ${f(14 + Math.sin(t * 4 + i) * 6)} l-70 ${f(26)} Z`, tnS.ol(col, 4));
  }
  for (let x = Math.floor(SX0 / 520) * 520 + 260; x < SX1; x += 520) {
    if (inGap(x)) continue;
    const i = Math.round(x / 520), col = [C.red, C.blue, C.purple, C.gold][md(i, 4)];
    st += banner(x, rimY - 40 + arArc(x), 120, 250, col, ['swords', 'crown', 'star', 'swords'][md(i, 4)], tnS, t, raid * (hash(i) > 0.4 ? 1 : 0.3), i);
  }
  // ---- barrier wall with arches + torches (k .9)
  const vW = vis(cam, 0.9);
  let wl = '';
  {
    const x0 = vW.x0 - 300, x1 = vW.x1 + 300, top = AR.wall, bot = AR.back + 40;
    wl += R(x0, top, x1 - x0, bot - top, 0, tn.ol('#D9C4A0', 6)) + R(x0, top, x1 - x0, bot - top, 0, { fill: 'url(#gsBrickBig)' });
    wl += R(x0, top - 26, x1 - x0, 30, 4, tn.ol('#F0DEBA', 5)) + studsD(x0, x1, top - 11, 26, 60, '#F0DEBA', tn);
    let arch = '';
    for (let x = Math.floor(x0 / 300) * 300 + 150; x < x1; x += 300) arch += `M${x - 50} ${bot - 4} V${top + 70} A50 50 0 0 1 ${x + 50} ${top + 70} V${bot - 4} Z `;
    wl += P(arch, tn.ol(raid > 0.3 ? '#2A0A20' : '#3A2A50', 5));
    // ads / banners between the arches
    for (let x = Math.floor(x0 / 600) * 600 + 300; x < x1; x += 600) {
      const i = Math.round(x / 600), lab = ['BATTLE ARENA', 'FIGHT!', 'NO NOOBS', 'GG ONLY'][md(i, 4)], col = [C.red, C.blue, C.purple, C.orange][md(i, 4)];
      wl += R(x - 120, top + 26, 240, 66, 12, tn.ol(col, 5)) + T(lab, x, top + 74, lab.length > 8 ? 30 : 40, tn.c('#FFFFFF'), OUTX(5, tn.line));
    }
    for (let x = Math.floor(x0 / 600) * 600; x < x1; x += 600) wl += torch(x, top - 60, 0.9, t, tn, x, lit);
  }
  // ---- the ring (k 1)
  const v1 = vis(cam, 1);
  const X0 = v1.x0 - 300, X1 = v1.x1 + 300;
  let m = R(X0, AR.back - 10, X1 - X0, 1500, 0, tn.fl('#C9A670')) + R(X0, AR.back - 10, X1 - X0, 1500, 0, { fill: 'url(#gsSand)' });
  m += R(X0, AR.back - 10, X1 - X0, 40, 0, { fill: '#000', opacity: 0.12 });
  // ring top surface
  const ring = [[AR.bx0, AR.back], [AR.bx1, AR.back], [AR.fx1, AR.front], [AR.fx0, AR.front]];
  m += P(dP([[AR.fx0, AR.front], [AR.fx1, AR.front], [AR.fx1 + 6, AR.front + 90], [AR.fx0 - 6, AR.front + 90]]), tn.ol('#9A8AA8', 6)) + P(dP([[AR.fx0, AR.front], [AR.fx1, AR.front], [AR.fx1 + 6, AR.front + 90], [AR.fx0 - 6, AR.front + 90]]), { fill: 'url(#gsBrickBig)' });
  m += P(dP(ring), tn.ol('#B9A8C8', 7));
  const inset = (k) => { const e0 = arEdge(AR.back + 24 * k), e1 = arEdge(AR.front - 30 * k); return [[e0.x0 + 34 * k, AR.back + 24 * k], [e0.x1 - 34 * k, AR.back + 24 * k], [e1.x1 - 44 * k, AR.front - 30 * k], [e1.x0 + 44 * k, AR.front - 30 * k]]; };
  m += P(dP(inset(1)), tn.ol(raid > 0.3 ? '#C9A060' : C.sand, 5)) + P(dP(inset(1)), { fill: 'url(#gsSand)' });
  // stone border tiles (joints)
  let jt = '';
  for (let u = 0.04; u < 1; u += 0.06) { const xb = lerp(AR.bx0, AR.bx1, u), xf = lerp(AR.fx0, AR.fx1, u); jt += `M${f(xb)} ${AR.back} L${f(lerp(xb, xf, 0.08))} ${AR.back + 24} M${f(lerp(xb, xf, 0.9))} ${AR.front - 30} L${f(xf)} ${AR.front} `; }
  m += P(jt, tn.ln(3, '#7A6A8A', 0.6));
  // emblem: a big painted star ring with crossed swords
  m += E(960, 840, 380, 95, { fill: 'none', stroke: tn.c(C.red), 'stroke-width': 14, opacity: 0.55 }) + E(960, 840, 300, 74, { fill: 'none', stroke: tn.c('#FFFFFF'), 'stroke-width': 8, opacity: 0.55 });
  m += G(P('M-150 -40 L150 40 M-150 40 L150 -40', { stroke: tn.c(C.red), 'stroke-width': 18, opacity: 0.45, 'stroke-linecap': 'round' }), 'translate(960 840)');
  if (raid > 0.05) {
    let cr = '';
    for (let i = 0; i < 6; i++) { let x = 300 + i * 260 + 80 * hash(i), y = 760 + 180 * hash(i * 2.2); cr += `M${f(x)} ${f(y)}`; for (let k = 0; k < 4; k++) { x += 40 + 30 * hash(i * 7 + k); y += (hash(i * 3 + k) - 0.5) * 50; cr += ` L${f(x)} ${f(y)}`; } }
    m += P(cr, { fill: 'none', stroke: tn.c('#2A1020'), 'stroke-width': 7, opacity: op(raid), 'stroke-linejoin': 'round' });
    m += G(rubble(520, 790, 230, tn, 3, ['#C9B8A0', '#A8947A', '#E8D8BE']) + rubble(1480, 770, 300, tn, 7, ['#C9B8A0', '#A8947A', '#E8D8BE']) + rubble(1150, 990, 200, tn, 11, ['#9A8AA8', '#C9B8A0']), null, { opacity: op(raid * 1.5) });
  }
  // corner pillars (back corners in mid; front corners are in fg)
  const pillar = (x, y, s) => G(brick(-50, -260, 100, 260, 30, '#B9A8C8', tn, { lw: 6, studs: 46 }) + R(-60, -300, 120, 40, 8, tn.ol(C.gold, 5)) + torch(0, -320, 1, t, tn, x, lit), tr(x, y, s));
  m += pillar(AR.bx0, AR.back + 6, arS(AR.back) / AR.s) + pillar(AR.bx1, AR.back + 6, arS(AR.back) / AR.s);
  // ---- fg: front corner pillars (k 1) + near crowd heads (k 1.25)
  let fr = pillar(AR.fx0 - 40, AR.front + 80, 1.15) + pillar(AR.fx1 + 40, AR.front + 80, 1.15);
  let fg = '';
  if (o.near) {
    const vn = vis(cam, 1.25);
    fg += crowd([{ x0: vn.x0 - 200, x1: vn.x0 + 420, y: 1060, s: 0.62, seed: 31, dx: 260 }, { x0: vn.x1 - 420, x1: vn.x1 + 200, y: 1060, s: 0.62, seed: 37, dx: 260 }], { tone: tn, back: true, light: 0.25, dark: night || raid ? '#120A26' : '#3A2A5A', cheer, t });
  }
  // ---- raid fires + smoke (stands k .7) / on the ring (k 1)
  let fireS = '', fireR = '';
  if (raid > 0.05) {
    for (const [x, y, s] of [[gapA - 40, AR_TY(2), 1.1], [gapB + 60, AR_TY(1), 0.9], [300, AR_TY(3), 0.8], [2100, AR_TY(2), 1]]) fireS += smoke(x, y + arArc(x) - 40, 1.3, t, raid, x) + fire(x, y + arArc(x), s * raid, t, x);
    fireR += smoke(1480, 760, 1, t, raid, 5) + fire(1480, 770, 0.8 * raid, t, 9) + fire(560, 800, 0.6 * raid, t, 4);
  }
  // ---- light
  let light = '';
  if (lit) {
    let gl = '';
    for (const x of [AR.bx0, AR.bx1]) gl += glow(x, AR.back - 340 * arS(AR.back) / AR.s, 200, 'gsGlowFire', 0.6);
    light += V(cam, gl, 1);
  }
  if (raid > 0.05) light += V(cam, glow(1450, 380, 520, 'gsGlowFire', 0.35 * raid), 0.7) + R(0, 0, 1920, 1080, 0, { fill: '#FF2A3A', opacity: op(raid * (0.06 + 0.03 * Math.sin(t * 4))) });
  if (sunset) light += R(0, 0, 1920, 1080, 0, { fill: '#FF9A50', opacity: 0.06 });
  if (o.flash > 0) light += R(0, 0, 1920, 1080, 0, { fill: '#FFFFFF', opacity: op(o.flash) });
  return layersOf(V(cam, sky, 0) + V(cam, sunm, 0.04) + V(cam, st + fireS, 0.7) + V(cam, board, 0.8) + V(cam, wl, 0.9), V(cam, m + fireR, 1), V(cam, fr, 1), V(cam, fg, 1.25), light);
}
const arena = camSet(arenaLayers);

// ================================================================= 3. TYCOON VALLEY
// World (k 1): floating grass plots in the sky. Top surface y 700 (back edge) … 990 (front edge), stand line FLOOR 930 (s .4),
// depth scale sAt(y) = .4·(y − 420)/510. Left → right: a mushroom-house plot (x −2700…−1650), YOUR CASTLE plot (x −1350…560:
// castle centred x −330 at base y 760 with the LAVA POOL in front-left, the TROPHY ROOM window on the keep, the gate),
// a plank bridge, GRANNY'S PLOT (x 820…2220, her building centred x 1520 at base y 760, the cookie stand in front), a bridge,
// a pizza-shop plot (x 2480…3500). Behind: floating plots with other players' bases (k .55, k .3), cube clouds, sky.
// Granny's plot GROWS: `granny` 0 empty plot · 1 cookie stand · 2 bakery · 3 factory (+ conveyor belt outside) · 4 glass
// skyscraper GRANNY'S GOODIES INC. up into the clouds (top y −2650) with the neon cookie. Fractional values animate the change:
// the old building pops out top-first while the new one pops in brick by brick (bottom → top).
// o: { time, granny 0..4, billboard 0..1 (the giant billboard of her face rises; default 1 at granny ≥ 4), neon 0..1 (cookie
//      sign flash, default 1), sold 0..1 (SOLD sign slaps on the castle gate), castleSign 'SOLD' (text on that sign, e.g.
//      'COOKIE MUSEUM'), smashed 0..1 (the Block King: Granny's building + castle towers broken, rubble, smoke, broken
//      cookies, fires at night), belt (factory belt speed, default 1), billboardFace (svg centred on the portrait box), flash }
const TY = {
  floor: 930, s: 0.4, hor: 420, back: 700, front: 990, faceH: 90,
  plots: [[-2700, -1650, 11], [-1350, 560, 3], [820, 2220, 5], [2480, 3500, 9]],
  castle: { x: -330, base: 760 }, granny: { x: 1520, base: 760 },
  lava: { x0: -1120, x1: -700, y0: 800, y1: 880 },
  stand: { x: 1520, y: 870, top: 742 },
};
const tyS = (y) => TY.s * (y - TY.hor) / (TY.floor - TY.hor);
// ---- the hero's castle (world coords). o: { sold, sign, smashed, night, t }
function castle(X, B, tn, t, o = {}) {
  const sm_ = o.smashed || 0, night = o.night || 0;
  const stone = '#C9CFE6', stoneD = '#A9B0CE', roof = C.red;
  let s = '';
  const merlons = (x0, x1, y, h = 34) => { const B2 = brickBatch(tn, { lw: 5 }); const n = Math.max(2, Math.round((x1 - x0) / 56)); const w = (x1 - x0) / n; for (let i = 0; i < n; i += 2) B2.add(x0 + i * w, y - h, w, h, 14, stone, 30); return B2.out(); };
  const wall = (x0, x1, top, col = stone) => R(x0, top, x1 - x0, B - top, 4, tn.ol(col, 6)) + R(x0 + 3, top + 3, x1 - x0 - 6, B - top - 6, 0, { fill: 'url(#gsBrickBig)' }) + R(x0 + 3, B - 22, x1 - x0 - 6, 18, 0, tn.fl(dk(col, 0.2), 0.8));
  const tower = (x0, x1, top, broken) => {
    let r = wall(x0, x1, top, stoneD) + R(x0 - 12, top - 14, x1 - x0 + 24, 22, 5, tn.ol(stone, 5));
    if (!broken) {
      r += merlons(x0 - 12, x1 + 12, top - 14);
      const cx = (x0 + x1) / 2, w = x1 - x0;
      r += brick(cx - w * 0.42, top - 90, w * 0.84, 46, 18, roof, tn, { lw: 5, studs: 36 }) + brick(cx - w * 0.28, top - 150, w * 0.56, 44, 16, roof, tn, { lw: 5, studs: 34 }) + brick(cx - w * 0.14, top - 204, w * 0.28, 40, 14, roof, tn, { lw: 5 });
      const wv = Math.sin(t * 5 + x0) * 6;
      r += R(cx - 4, top - 330, 8, 130, 3, tn.ol('#E8EEF8', 3)) + P(`M${cx + 4} ${top - 326} Q${cx + 40} ${top - 330 + wv} ${cx + 80} ${top - 320} L${cx + 80} ${top - 270} Q${cx + 40} ${top - 278 - wv} ${cx + 4} ${top - 274} Z`, tn.ol(C.yellow, 4));
      r += T('YOU', cx + 42, top - 286, 22, tn.c(C.red));
    } else {
      let jag = `M${x0 - 12} ${top - 14}`;
      for (let x = x0; x <= x1 + 12; x += 36) jag += ` L${f(x)} ${f(top - 14 - 30 * hash(x * 0.3))}`;
      r += P(jag + ` L${x1 + 12} ${top + 10} L${x0 - 12} ${top + 10} Z`, tn.ol(stoneD, 5));
    }
    // arrow-slit windows
    const cx = (x0 + x1) / 2;
    r += R(cx - 12, top + 60, 24, 70, 10, { fill: night ? '#FFD86B' : '#3A2A50' }) + R(cx - 12, top + 200, 24, 70, 10, { fill: night ? '#FFD86B' : '#3A2A50' });
    return r;
  };
  // curtain walls
  s += wall(X - 640, X - 400, B - 210) + merlons(X - 640, X - 400, B - 210) + wall(X + 400, X + 640, B - 210) + merlons(X + 400, X + 640, B - 210);
  // towers + keep
  s += tower(X - 410, X - 210, B - 560, sm_ > 0.35) + tower(X + 210, X + 410, B - 520, sm_ > 0.55);
  s += wall(X - 210, X + 210, B - 440, stone) + R(X - 222, B - 454, 444, 24, 5, tn.ol(stoneD, 5)) + (sm_ > 0.75 ? '' : merlons(X - 222, X + 222, B - 454));
  // trophy room window (shows the cups inside)
  const wy = B - 425;
  const winD = `M${X - 110} ${wy + 150} V${wy + 50} A110 110 0 0 1 ${X + 110} ${wy + 50} V${wy + 150} Z`;
  s += P(winD, tn.ol(night ? '!#FFE7A0' : '#FFF0C8', 7)) + P(winD, { fill: 'url(#gsTrophies)' });
  s += P(`M${X} ${wy - 58} V${wy + 150} M${X - 110} ${wy + 70} H${X + 110}`, tn.ln(8, '#8A6AA8'));
  s += R(X - 120, wy + 156, 240, 36, 8, tn.ol(C.gold, 5)) + TF('TROPHY ROOM', X, wy + 182, 22, tn.c('#6A3A14'));
  if (!night) s += P(`M${X - 70} ${wy + 20} l18 -40 l10 6 l-18 40 Z`, { fill: '#FFF', opacity: 0.55 });
  // LVL 99 banner on the right tower
  s += G(P('M-40 0 H40 V150 L0 124 L-40 150 Z', tn.ol(C.red, 5)) + R(-48, -8, 96, 16, 5, tn.ol(C.gold, 4)) + T('LVL', 0, 46, 26, tn.c(C.yellow)) + T('99', 0, 100, 48, tn.c(C.yellow), OUTX(4, tn.line)), tr(X + 310, B - 470, 1, Math.sin(t * 2) * 1.5));
  // the gate (arch + wooden doors + iron studs)
  const gD = `M${X - 96} ${B} V${B - 110} A96 96 0 0 1 ${X + 96} ${B - 110} V${B} Z`;
  s += P(gD, tn.ol(C.woodD, 7)) + P(`M${X} ${B - 206} V${B} M${X - 96} ${B - 90} H${X + 96} M${X - 96} ${B - 40} H${X + 96}`, tn.ln(6, dk(C.woodD, 0.3)));
  s += P(dC(X - 24, B - 80, 7) + dC(X + 24, B - 80, 7), { fill: tn.c(C.gold) });
  s += R(X - 120, B - 6, 240, 14, 4, tn.ol(stoneD, 4));
  return s;
}
// the SOLD sign on the gate: k 0..1 (pops on + swings). origin = hook point
function soldSign(x, y, k, t, tn, text = 'SOLD') {
  if (k <= 0) return '';
  const sc = ease.outBack(clamp(k * 1.4, 0, 1)), sw = Math.sin(t * 3) * 3 * (1 - clamp(k * 1.4 - 0.4, 0, 1) * 0.5) + (1 - clamp(k * 2, 0, 1)) * 30;
  const w = Math.max(230, text.length * 30 + 60), h = text.length > 6 ? 96 : 110;
  let s = P(`M0 0 L${-w * 0.32} 60 M0 0 L${w * 0.32} 60`, tn.ln(5, '#8A93A6')) + CI(0, 0, 9, tn.ol(C.gold, 4));
  s += R(-w / 2, 52, w, h, 12, tn.ol('#FFF4DE', 7)) + R(-w / 2 + 10, 62, w - 20, h - 20, 8, { fill: 'none', stroke: tn.c(C.red), 'stroke-width': 6 });
  s += T(text, 0, 52 + h / 2 + (text.length > 6 ? 14 : 22), text.length > 6 ? 40 : 66, tn.c(C.red), { transform: `rotate(-6 0 ${52 + h / 2})` });
  return G(s, `translate(${f(x)} ${f(y)}) rotate(${f(sw)}) scale(${f(sc)})`);
}
// ---- Granny's buildings as pop-in parts [{ th, cx, cy, svg, front }] (th = build order 0..1, (cx, cy) = pivot)
function grannyParts(stage, X, B, tn, t, o) {
  const night = o.night || 0, parts = [];
  const add = (th, cx, cy, svg, front) => parts.push({ th, cx, cy, svg, front });
  const cookie = (x, y, r, rot = 0) => G(CI(0, 0, r, tn.ol('#E0A35A', Math.max(3, r * 0.14))) + P(dRR(-r * 0.45, -r * 0.4, r * 0.28, r * 0.28, 3) + dRR(r * 0.12, -r * 0.1, r * 0.28, r * 0.28, 3) + dRR(-r * 0.2, r * 0.3, r * 0.26, r * 0.26, 3), { fill: tn.c('#5A3018') }), tr(x, y, 1, rot));
  if (stage === 0) {
    add(0.1, X, 900, signBoard(X - 160, 900, 260, 120, ['EMPTY PLOT', 'CLAIM ME!'], tn, { col: C.wood, post: 90, size: 34 }));
    add(0.3, X + 160, 880, E(X + 160, 870, 120, 30, tn.ol('#2BD46A', 6)) + E(X + 160, 866, 80, 18, { fill: '#BFFFD8', opacity: op(0.6 + 0.3 * Math.sin(t * 3)) }) + P(`M${X + 60} 868 L${X + 50} 600 L${X + 270} 600 L${X + 260} 868 Z`, { fill: 'url(#gsPadBeamG)', opacity: 0.5 }));
  } else if (stage === 1) {
    // the cookie stand: Granny stands behind the counter (front layer = counter front)
    const S0 = TY.stand, cx = S0.x, top = S0.top;
    add(0.05, cx, top + 150, R(cx - 160, top - 230, 18, 236, 4, tn.ol(C.woodD, 5)) + R(cx + 142, top - 230, 18, 236, 4, tn.ol(C.woodD, 5)));
    let aw = `M${cx - 200} ${top - 250} H${cx + 200} V${top - 200}`;
    for (let x = cx + 200; x > cx - 200; x -= 50) aw += ` Q${x - 25} ${top - 172} ${x - 50} ${top - 200}`;
    add(0.5, cx, top - 200, P(aw + ' Z', tn.ol(C.pink, 5)) + P(aw + ' Z', { fill: 'url(#gsStripes)' }) + R(cx - 210, top - 268, 420, 24, 8, tn.ol('#FFFFFF', 5)));
    add(0.75, cx, top - 270, G(cookie(0, -60, 70) + R(-120, 4, 240, 44, 10, tn.ol('#FFFFFF', 5)) + T('COOKIES', 0, 38, 34, tn.c(C.pink)), `translate(${cx} ${top - 330})`));
    add(0.2, cx, top + 158, brick(cx - 180, top, 360, 150, 26, '#FFD6E8', tn, { lw: 6 }) + R(cx - 180, top + 40, 360, 40, 0, { fill: 'url(#gsStripes)', opacity: 0.6 }) + T('2 COINS', cx, top + 120, 34, tn.c('#6A3A14')), true);
    add(0.6, cx, top - 20, cookie(cx - 110, top - 30, 26, 10) + cookie(cx - 70, top - 34, 26, -20) + cookie(cx - 90, top - 64, 26, 30) + G(R(-34, -96, 68, 96, 14, tn.ol('#BFEFFF', 5)) + R(-38, -108, 76, 18, 6, tn.ol(C.pink, 4)) + cookie(0, -40, 20), `translate(${cx + 90} ${top - 18})`), true);
    add(0.9, cx + 240, 900, signBoard(cx + 250, 920, 140, 90, ['3 FOR', 'CUTE ONES'], tn, { col: '#3A3F5C', post: 60, size: 22 }));
  } else if (stage === 2) {
    const x0 = X - 270, x1 = X + 270, top = B - 400;
    add(0.0, X, B, R(x0 - 20, B - 26, x1 - x0 + 40, 30, 6, tn.ol('#E4EAFF', 5)));
    add(0.1, X, B, R(x0, B - 200, x1 - x0, 176, 4, tn.ol('#FFE3EE', 6)) + R(x0 + 3, B - 197, x1 - x0 - 6, 170, 0, { fill: 'url(#gsBrick)' }));
    add(0.25, X, B - 200, R(x0, top, x1 - x0, 200, 4, tn.ol('#FFD0E4', 6)) + R(x0 + 3, top + 3, x1 - x0 - 6, 194, 0, { fill: 'url(#gsBrick)' }) + R(x0 + 50, top + 50, 110, 100, 10, tn.ol(night ? '!#FFE07A' : '#BFF0FF', 5)) + R(x1 - 160, top + 50, 110, 100, 10, tn.ol(night ? '!#FFE07A' : '#BFF0FF', 5)));
    add(0.35, X - 90, B - 30, R(x0 + 40, B - 170, 250, 140, 10, tn.ol(night ? '!#FFE7A8' : '#DFF8FF', 6)) + cookie(x0 + 100, B - 70, 28) + G(R(-40, -60, 80, 60, 10, tn.ol('#FFFFFF', 4)) + R(-40, -70, 80, 16, 6, tn.ol(C.pink, 4)) + R(-6, -86, 12, 16, 3, tn.ol(C.yellow, 3)), `translate(${x0 + 200} ${B - 34})`) + cookie(x0 + 260, B - 60, 22));
    add(0.4, X + 160, B, R(x1 - 170, B - 190, 110, 190, 12, tn.ol(C.woodD, 6)) + CI(x1 - 80, B - 90, 7, tn.fl(C.gold)));
    let aw = `M${x0 + 20} ${B - 230} H${x0 + 320} V${B - 196}`;
    for (let x = x0 + 320; x > x0 + 20; x -= 50) aw += ` Q${x - 25} ${B - 170} ${x - 50} ${B - 196}`;
    add(0.5, x0 + 170, B - 196, P(aw + ' Z', tn.ol(C.pink, 5)) + P(aw + ' Z', { fill: 'url(#gsStripes)' }));
    add(0.65, X, top, brick(x0 - 30, top - 40, x1 - x0 + 60, 40, 20, C.pink, tn, { lw: 6, studs: 46 }));
    add(0.75, X, top - 60, brick(x0 + 20, top - 110, x1 - x0 - 40, 50, 20, '#FF8FC8', tn, { lw: 6, studs: 46 }) + brick(x0 + 90, top - 170, x1 - x0 - 180, 40, 18, C.pink, tn, { lw: 6, studs: 46 }));
    add(0.85, x1 - 90, top - 110, brick(x1 - 120, top - 260, 60, 110, 16, '#B9784A', tn, { lw: 5 }) + smoke(x1 - 90, top - 270, 0.6, t, 0.6, 3, '#FFFFFF'));
    add(0.95, X, top - 200, G(R(-230, -50, 460, 92, 18, tn.ol('#FFFFFF', 6)) + cookie(-180, -4, 34) + T("GRANNY'S BAKERY", 26, 18, 44, tn.c(C.pink), OUTX(4, tn.line)), `translate(${X} ${top - 240})`));
  } else if (stage === 3) {
    const x0 = X - 420, x1 = X + 420, top = B - 360;
    add(0.0, X, B, R(x0 - 20, B - 24, x1 - x0 + 40, 28, 6, tn.ol('#C9D3F2', 5)));
    add(0.1, X, B, R(x0, B - 190, x1 - x0, 166, 4, tn.ol('#FF9AA8', 6)) + R(x0 + 3, B - 187, x1 - x0 - 6, 160, 0, { fill: 'url(#gsBrickBig)' }) + R(x0 + 60, B - 170, 200, 170, 6, tn.ol('#8A93A6', 6)) + P(`M${x0 + 60} ${B - 130} H${x0 + 260} M${x0 + 60} ${B - 90} H${x0 + 260} M${x0 + 60} ${B - 50} H${x0 + 260}`, tn.ln(5, '#6A7090')));
    let wins = '';
    for (let i = 0; i < 4; i++) wins += dRR(x0 + 320 + i * 120, B - 150, 80, 80, 8);
    add(0.2, X + 120, B - 100, P(wins, tn.ol(night ? '!#FFE07A' : '#BFF0FF', 5)));
    let port = '';
    for (let i = 0; i < 5; i++) port += dC(x0 + 300 + i * 100, top + 70, 30);
    add(0.3, X, B - 190, R(x0, top, x1 - x0, 172, 4, tn.ol('#FF8A9A', 6)) + R(x0 + 3, top + 3, x1 - x0 - 6, 166, 0, { fill: 'url(#gsBrickBig)' }) + P(port, tn.ol(night ? '!#FFE07A' : '#BFF0FF', 5)) + G(cookie(0, 0, 56), `translate(${x0 + 130} ${top + 84})`) + P(`M${x0} ${top + 150} H${x1}`, tn.ln(10, '#C9D3F2')) + P(`M${x0 + 220} ${top + 10} V${B - 20} M${x0 + 236} ${top + 10} V${B - 20}`, tn.ln(8, '#8A93A6')));
    // sawtooth roof
    let saw = '', glass = '';
    for (let i = 0; i < 4; i++) { const a = x0 + i * (x1 - x0) / 4, b = a + (x1 - x0) / 4; saw += `M${a} ${top} L${a} ${top - 90} L${b} ${top} Z `; glass += `M${a + 10} ${top - 8} L${a + 10} ${top - 78} L${a + 60} ${top - 58} L${a + 60} ${top - 8} Z `; }
    add(0.5, X, top, P(saw, tn.ol('#8A93A6', 6)) + P(glass, tn.ol(night ? '!#FFE7A0' : '#BFF0FF', 4)));
    // chimneys with cookie-scented steam
    for (const [cxx, h, th] of [[x0 + 120, 280, 0.6], [x1 - 140, 340, 0.7]]) add(th, cxx, top, brick(cxx - 36, top - h, 72, h, 16, '#C96A5A', tn, { lw: 5 }) + R(cxx - 44, top - h - 16, 88, 22, 5, tn.ol('#3A3F5C', 4)) + smoke(cxx, top - h - 20, 0.8, t, 0.8, cxx, '#FFE8F2'));
    add(0.85, X, top - 120, G(R(-330, -56, 660, 104, 18, tn.ol('#FFFFFF', 7)) + cookie(-270, -4, 40) + T("GRANNY'S GOODIES", 30, 22, 54, tn.c(C.pink), OUTX(5, tn.line)) + P('M-240 48 V100 M240 48 V100', tn.ln(10)), `translate(${X} ${top - 170})`));
    // the conveyor belt outside (front row of the plot): cookies ride to the right
    const by = 880, bx0 = X - 360, bx1 = X + 380, sp = o.belt ?? 1;
    let belt = R(bx0, by - 26, bx1 - bx0, 30, 14, { fill: 'url(#gsConveyor)', stroke: tn.line, 'stroke-width': 5 });
    belt += R(bx0 - 6, by, bx1 - bx0 + 12, 30, 8, tn.ol('#8A93A6', 5));
    let legs = '';
    for (let x = bx0 + 40; x < bx1; x += 140) legs += dR(x, by + 28, 18, 60);
    belt = P(legs, tn.ol('#5A6488', 4)) + belt;
    for (let i = 0; i < 7; i++) { const x = bx0 + 30 + md(i * 110 + t * 90 * sp, bx1 - bx0 - 60); belt += cookie(x, by - 36, 22, x * 0.5); }
    add(0.4, X, by + 60, belt, true);
  } else if (stage === 4) {
    const top = -2450;
    // lobby
    add(0.0, X, B, R(X - 260, B - 24, 520, 28, 6, tn.ol('#C9D3F2', 5)));
    add(0.05, X, B, R(X - 260, B - 190, 520, 168, 6, tn.ol('#FFD0E4', 6)) + R(X - 80, B - 150, 160, 128, 8, tn.ol(night ? '!#FFE7A0' : '#BFF0FF', 6)) + P(`M${X} ${B - 150} V${B - 22}`, tn.ln(5)) + R(X - 290, B - 236, 580, 56, 12, tn.ol(C.pink, 6)) + T("GRANNY'S GOODIES INC.", X, B - 194, 38, tn.c('#FFFFFF'), OUTX(4, tn.line)));
    // glass body with setbacks: [x half-width, y0 (bottom), y1 (top)]
    const secs = [[250, B - 230, -700], [205, -700, -1700], [150, -1700, top]];
    secs.forEach(([hw, y0, y1], i) => {
      const n = 6;
      for (let k = 0; k < n; k++) {
        const ya = lerp(y0, y1, k / n), yb = lerp(y0, y1, (k + 1) / n);
        let g = R(X - hw, yb, hw * 2, ya - yb + 2, 0, { fill: night ? 'url(#gsGlassN)' : 'url(#gsGlass)', stroke: tn.line, 'stroke-width': 6 });
        g += R(X - hw, yb, hw * 2, ya - yb, 0, { fill: 'url(#gsGlassGrid)', opacity: night ? 0.5 : 0.8 });
        if (night) g += R(X - hw + 20, yb + 30, hw * 2 - 40, ya - yb - 60, 0, { fill: 'url(#gsWinFar)', opacity: 0.55 });
        add(0.1 + 0.11 * (i * n + k) / n, X, ya, g);
      }
      add(0.1 + 0.11 * (i + 1) - 0.02, X, y1, R(X - hw - 24, y1 - 20, hw * 2 + 48, 26, 8, tn.ol(C.pink, 5)));
    });
    // vertical name banner on the facade + the crown with the neon cookie
    let vb = R(X - 52, -600, 104, 1000, 14, tn.ol(C.pink, 6));
    'GRANNY'.split('').forEach((ch, i) => { vb += T(ch, X, -500 + i * 150, 110, tn.c('#FFFFFF'), OUTX(6, tn.line)); });
    add(0.6, X, 400, vb);
    const neon = b01(o.neon, 1), nc = neon > 0.5 ? '!#FFB04A' : '#C08A4A';
    add(0.9, X, top - 20, R(X - 8, top - 520, 16, 260, 4, tn.ol('#E8EEF8', 4)) + CI(X, top - 524, 12, tn.ol('!#FF4D5E', 4)) + G(CI(0, 0, 150, { fill: 'none', stroke: tn.c(neon > 0.5 ? '!#FF6FB5' : '#8A5A7A'), 'stroke-width': 16 }) + CI(0, 0, 130, tn.ol(nc, 8)) + P(dRR(-60, -50, 36, 36, 6) + dRR(20, -20, 36, 36, 6) + dRR(-30, 40, 32, 32, 6), { fill: tn.c(neon > 0.5 ? '!#7A3A10' : '#5A3018') }), `translate(${X} ${top - 180})`) + (night || neon > 0.5 ? glow(X, top - 180, 380, 'gsGlowPink', 0.55 * neon) : ''));
  }
  return parts;
}
// render parts of one stage at build level u (0..1, bottom→top). out: shrinking top-first
function renderParts(parts, u, out = false) {
  let mid = '', front = '';
  for (const p of parts) {
    let k;
    if (out) k = 1 - ease.in(clamp((u - (1 - p.th) * 0.6) / 0.4, 0, 1));
    else k = popK(u, p.th * 0.85, 0.15);
    let s = popG(p.svg, k, p.cx, p.cy);
    if (!out && k > 0 && u > p.th * 0.85 && u < p.th * 0.85 + 0.2) s += popBits(p.cx, p.cy - 20, (u - p.th * 0.85) / 0.2, Math.round(p.cx + p.cy), 6, 180);
    if (p.front) front += s; else mid += s;
  }
  return { mid, front };
}
// small bases on the other plots (origin = base centre on the plot top). kind: mushroom|rocket|dome|pizza|ship|farm|noob
function miniBase(kind, x, y, s, tn, t, night = 0) {
  let o = '';
  const win = night ? '!#FFE07A' : '#BFF0FF';
  switch (kind) {
    case 'mushroom': o = R(-90, -160, 180, 160, 30, tn.ol('#FFF4DE', 6)) + R(-30, -90, 60, 90, 24, tn.ol(C.woodD, 5)) + P('M-170 -150 Q0 -360 170 -150 Z', tn.ol(C.red, 6)) + P(dC(-80, -200, 22) + dC(20, -250, 26) + dC(90, -190, 18), { fill: tn.c('#FFFFFF') }) + CI(50, -110, 20, tn.ol(win, 4)); break;
    case 'rocket': o = brick(-140, -40, 280, 40, 20, C.slate, tn, { lw: 5 }) + P('M-50 -60 L-50 -330 Q0 -440 50 -330 L50 -60 Z', tn.ol('#F7F5FF', 6)) + P('M-50 -60 L-100 -10 L-50 -130 Z M50 -60 L100 -10 L50 -130 Z', tn.ol(C.red, 5)) + CI(0, -260, 28, tn.ol(win, 5)) + R(-50, -170, 100, 24, 0, tn.ol(C.red, 4)); break;
    case 'dome': o = brick(-150, -200, 300, 200, 24, '#B8F0D8', tn, { lw: 6, studs: 46 }) + P('M-120 -224 A120 120 0 0 1 120 -224 Z', tn.ol(C.sky, 6)) + R(-40, -120, 80, 120, 16, tn.ol(C.woodD, 5)) + R(-120, -170, 60, 50, 6, tn.ol(win, 4)) + R(60, -170, 60, 50, 6, tn.ol(win, 4)); break;
    case 'pizza': o = brick(-200, -210, 400, 210, 24, '#FFE0A0', tn, { lw: 6, studs: 46 }) + R(-150, -160, 140, 110, 8, tn.ol(win, 5)) + R(30, -170, 120, 170, 10, tn.ol(C.red, 5)) + G(P('M0 -120 L80 40 Q0 70 -80 40 Z', tn.ol('#FFC83A', 6)) + P('M-80 40 Q0 70 80 40', tn.ln(14, '#D98A3A')) + P(dC(-14, -20, 16) + dC(22, 10, 14) + dC(-30, 30, 12), { fill: tn.c(C.red) }), 'translate(0 -330)') + T('PIZZA', 0, -246, 40, tn.c(C.red), OUTX(4, tn.line)); break;
    case 'ship': o = P('M-220 -100 L220 -100 L170 0 L-170 0 Z', tn.ol(C.woodD, 6)) + R(-6, -380, 12, 290, 3, tn.ol(C.woodD, 4)) + P('M8 -370 Q120 -300 8 -200 Z', tn.ol('#F7F5FF', 5)) + P('M-8 -340 Q-110 -280 -8 -210 Z', tn.ol('#F7F5FF', 5)) + R(-2, -400, 70, 30, 3, tn.ol('#151515', 3)); break;
    case 'farm': o = brick(-160, -180, 200, 180, 0, C.red, tn, { lw: 6 }) + P('M-176 -180 L-60 -280 L56 -180 Z', tn.ol('#FFF4DE', 6)) + R(-100, -110, 80, 110, 6, tn.ol('#FFF4DE', 5)) + brick(60, -60, 140, 60, 20, '#9BE15D', tn, { lw: 5, studs: 30 }); break;
    default: o = brick(-110, -180, 220, 180, 24, '#D9D9D9', tn, { lw: 6, studs: 46 }) + R(-30, -100, 60, 100, 6, tn.ol(C.woodD, 5)) + T('NOOB', 0, -130, 34, tn.c(C.blue)); break;
  }
  return G(o, tr(x, y, s));
}
const TY_BACK = [
  // [x, y (plot top), w, kind, k]
  [-1500, 520, 520, 'dome', 0.55], [-400, 470, 460, 'rocket', 0.55], [700, 540, 420, 'farm', 0.55], [1700, 470, 480, 'ship', 0.55], [2800, 520, 500, 'mushroom', 0.55], [3900, 490, 460, 'dome', 0.55], [-2600, 480, 460, 'pizza', 0.55],
  [-900, 370, 320, 'mushroom', 0.3], [200, 330, 300, 'noob', 0.3], [1100, 380, 320, 'rocket', 0.3], [2100, 340, 300, 'farm', 0.3], [3000, 360, 300, 'dome', 0.3], [-1900, 350, 300, 'ship', 0.3],
];
// the giant billboard with Granny's face (origin = centre of the board). k = rise 0..1
function grannyBillboard(x, y, tn, t, k, face, o_ground) {
  if (k <= 0) return '';
  const w = 900, h = 470, dy = (1 - ease.out(k)) * 1100;
  const legH = Math.max(0, (o_ground ?? 760) - (y + dy + h / 2));
  let o = R(-280, h / 2, 40, legH, 4, tn.ol(C.slate, 6)) + R(40, h / 2, 40, legH, 4, tn.ol(C.slate, 6));
  for (let yy = h / 2 + 60; yy + 120 < h / 2 + legH; yy += 200) o += P(`M-260 ${yy} L60 ${yy + 110} M60 ${yy} L-260 ${yy + 110}`, tn.ln(8, C.slate));
  o += R(-w / 2 - 22, -h / 2 - 22, w + 44, h + 44, 20, tn.ol('#2E3550', 8)) + R(-w / 2, -h / 2, w, h, 10, tn.ol('#FFE3EE', 0));
  o += R(-w / 2, -h / 2, w, h, 10, { fill: 'url(#gsPolka)' });
  // portrait box (left)
  o += R(-w / 2 + 30, -h / 2 + 30, 380, h - 60, 30, tn.ol('#FF8FC8', 6));
  o += face ? G(face, `translate(${-w / 2 + 220} ${0})`) : G(grannyPortrait(tn, t), `translate(${-w / 2 + 220} 30)`);
  o += T("GRANNY'S", 210, -110, 92, tn.c(C.pink), OUTX(9, tn.line)) + T('GOODIES', 210, -10, 92, tn.c(C.pink), OUTX(9, tn.line));
  o += TF('BAKED WITH LOVE', 210, 80, 46, tn.c('#6A3A14')) + TF('(AND PROFIT)', 210, 136, 40, tn.c(C.red));
  o += P('M140 166 l14 -30 l14 30 M200 166 l14 -30 l14 30', { fill: 'none' });
  return G(o, `translate(${f(x)} ${f(y + dy)})`);
}
// flat portrait of GrannyGoodies for the billboard (origin = chin-ish centre, ~320 px tall)
function grannyPortrait(tn, t = 0) {
  let o = '';
  // fur collar + coat
  o += P('M-170 200 Q-160 120 -90 100 L90 100 Q160 120 170 200 Z', tn.ol('#8A5AC8', 6));
  let fur = '';
  for (let i = 0; i < 9; i++) fur += dC(-120 + i * 30, 104 + Math.sin(i * 1.7) * 6, 26);
  o += P(fur, tn.ol('#FFF6F0', 5));
  // pearls
  let pr = '';
  for (let i = 0; i < 9; i++) pr += dC(-64 + i * 16, 88 + Math.sin((i / 8) * Math.PI) * 18, 8);
  o += P(pr, tn.ol('#FFFFFF', 3));
  // head
  o += R(-100, -150, 200, 230, 46, tn.ol('#F9D7B5', 7));
  // curls
  let cu = '';
  for (let i = 0; i < 7; i++) cu += dC(-108 + i * 36, -150 + Math.abs(i - 3) * 8, 34);
  cu += dC(-112, -96, 30) + dC(112, -96, 30) + dC(-118, -40, 26) + dC(118, -40, 26);
  o += P(cu, tn.ol('#E8E8F2', 6));
  // glasses + monocle
  o += CI(-44, -36, 34, { fill: '#FFFFFF', stroke: tn.line, 'stroke-width': 7 }) + CI(44, -36, 34, { fill: '#FFFFFF', stroke: tn.c(C.gold), 'stroke-width': 9 }) + P('M-10 -36 H10', tn.ln(6));
  o += CI(-40, -32, 12, { fill: LINE }) + CI(40, -32, 12, { fill: LINE }) + CI(-36, -36, 4, { fill: '#FFF' }) + CI(44, -36, 4, { fill: '#FFF' });
  o += P('M78 -16 Q96 40 70 90', tn.ln(4, C.gold));
  o += E(-70, 20, 16, 10, { fill: '#FF9AA8', opacity: 0.7 }) + E(70, 20, 16, 10, { fill: '#FF9AA8', opacity: 0.7 });
  o += P('M-40 38 Q0 70 40 38 Q0 54 -40 38 Z', tn.ol('#E8263A', 5));
  void t;
  return o;
}
function tycoonLayers(t, cam, o) {
  const time = o.time || 'day', night = time === 'night' ? 1 : 0, sunset = time === 'sunset' ? 1 : 0;
  const smashed = b01(o.smashed);
  const tw = timeTone(o, { raid: smashed * night * 0.6 });
  const tn = tone(tw);
  const hazeCol = night ? '#33287A' : sunset ? '#FFB6A8' : '#D6F0FF';
  const tnF = tone({ ...tw, haze: 0.5, hazeCol }), tnM = tone({ ...tw, haze: 0.28, hazeCol });
  // ---- sky + clouds
  const v0 = vis(cam, 0);
  const sky = skyFor(v0, o, { raid: smashed * night * 0.8 });
  const sunm = night ? moon(1560, 170, 70, tn) : sunset ? sun(1300, 420, 70, t, '#FFD06A') : sun(1620, 140, 60, t);
  const vc = vis(cam, 0.08);
  let cl = '';
  for (let i = Math.floor((vc.x0 - 500) / 640); i * 640 < vc.x1 + 500; i++) {
    for (const [yb, sc, seed] of [[140, 0.5, 0], [760, 0.7, 50], [-600, 0.6, 90]]) {
      if (yb < vc.y0 - 300 || yb > vc.y1 + 300) continue;
      const x = i * 640 + md(hash(i * 2.7 + seed) * 380 + t * 7, 640), y = yb + 160 * hash(i * 9.3 + seed);
      cl += cubeCloud(x, y, sc * (0.7 + 0.5 * hash(i * 5.5 + seed)), tn, night ? '#4E4290' : sunset ? '#FFE0E6' : '#FFFFFF', i + seed);
    }
  }
  // ---- back rows of floating plots with other players' bases (k .3, k .55)
  const back = (kk, tnX) => {
    const vb = vis(cam, kk);
    let s = '';
    for (const [x, y, w, kind, k] of TY_BACK) {
      if (k !== kk || x + w < vb.x0 - 300 || x - w > vb.x1 + 300) continue;
      const sc = kk === 0.3 ? 0.45 : 0.7;
      s += grassPlot(x - w / 2, x + w / 2, y - 60 * sc, y, 40 * sc, tnX, Math.round(x), { depth: w * 0.42, rows: 4 });
      s += miniBase(kind, x, y - 24 * sc, sc, tnX, t, night);
      if (smashed > 0.3 && hash(x) > 0.5) s += smoke(x + 40, y - 80 * sc, sc, t, smashed, x) + (night ? fire(x, y - 30 * sc, sc * 0.8, t, x) : '');
    }
    return s;
  };
  const b30 = back(0.3, tnF), b55 = back(0.55, tnM);
  // ---- main plots (k 1)
  const v1 = vis(cam, 1);
  const X0 = v1.x0 - 300, X1 = v1.x1 + 300;
  let m = '', fr = '';
  for (const [x0, x1, seed] of TY.plots) if (x1 > X0 - 600 && x0 < X1 + 600) m += grassPlot(x0, x1, TY.back, TY.front, TY.faceH, tn, seed, { depth: (x1 - x0) * 0.3, rows: 5 });
  // bridges
  for (let i = 0; i < TY.plots.length - 1; i++) {
    const a = TY.plots[i][1] - 30, b = TY.plots[i + 1][0] + 30;
    if (b < X0 || a > X1) continue;
    let pl = '';
    for (let x = a; x < b; x += 46) pl += dRR(x, 880 + Math.sin((x - a) / (b - a) * Math.PI) * 18, 42, 70, 6);
    m += P(`M${a} 870 Q${(a + b) / 2} 910 ${b} 870 M${a} 960 Q${(a + b) / 2} 1000 ${b} 960`, tn.ln(8, C.woodD)) + P(pl, tn.ol(C.wood, 5));
  }
  // mushroom plot + pizza plot bases
  m += miniBase('mushroom', -2180, 790, 1.2, tn, t, night) + cubeTree(-2550, 760, 0.55, tn, { kind: 'round' });
  m += miniBase('pizza', 2990, 780, 1.1, tn, t, night) + cubeTree(3350, 760, 0.5, tn, { kind: 'blossom', col: '#FF8FC8' });
  // the castle + lava pool + trees
  const CA = TY.castle;
  if (CA.x + 800 > X0 && CA.x - 900 < X1) {
    m += cubeTree(-1230, 760, 0.62, tn, { kind: 'tall', col: '#2FB35A' }) + cubeTree(440, 760, 0.55, tn, { kind: 'round' });
    m += castle(CA.x, CA.base, tn, t, { night, smashed });
    // lava pool (sunken, stone rim)
    const LV = TY.lava;
    m += R(LV.x0 - 18, LV.y0 - 14, LV.x1 - LV.x0 + 36, LV.y1 - LV.y0 + 28, 22, tn.ol('#A9B0CE', 6));
    m += R(LV.x0, LV.y0, LV.x1 - LV.x0, LV.y1 - LV.y0, 16, tn.ol('!#FF7A1F', 5));
    const dx = md(t * 20, 180);
    m += G(R(LV.x0 - dx, LV.y0, LV.x1 - LV.x0, LV.y1 - LV.y0, 0, { fill: 'url(#gsLavaTex)' }), `translate(${f(dx)} 0)`);
    let bub = '';
    for (let i = 0; i < 5; i++) { const u = md(t * 0.9 + i * 0.23, 1); bub += dC(LV.x0 + 40 + i * 80, LV.y0 + 40 - u * 18, 8 * (1 - u) + 2); }
    m += P(bub, { fill: '#FFE27A', opacity: 0.9 }) + glow((LV.x0 + LV.x1) / 2, (LV.y0 + LV.y1) / 2, 240, 'gsGlowFire', night ? 0.8 : 0.45);
    m += signBoard(LV.x1 + 70, LV.y1 + 10, 150, 70, ['NO', 'SWIMMING'], tn, { col: C.red, post: 50, size: 20 });
    if (smashed > 0) m += G(rubble(CA.x - 300, CA.base + 30, 260, tn, 21, ['#C9CFE6', '#A9B0CE']) + rubble(CA.x + 320, CA.base + 40, 220, tn, 27, ['#C9CFE6', '#A9B0CE', C.red]), null, { opacity: op(smashed * 2) }) + smoke(CA.x - 300, CA.base - 500, 1.2, t, smashed, 4) + (night ? fire(CA.x + 310, CA.base - 500, 0.9 * smashed, t, 6) : '');
    fr += soldSign(CA.x, CA.base - 196, b01(o.sold), t, tn, o.castleSign || 'SOLD');
  }
  // Granny's plot: her building at its stage
  const GR = TY.granny, g = clamp(o.granny ?? 0, 0, 4);
  let gb = '';
  if (GR.x + 1200 > X0 && GR.x - 1200 < X1) {
    const n = Math.floor(g + 1e-6), u = g - n;
    const opt = { night, belt: o.belt };
    const drawStage = (st, uu, out) => { const r = renderParts(grannyParts(st, GR.x, GR.base, tn, t, opt), uu, out); return r; };
    let A = { mid: '', front: '' }, Bp = { mid: '', front: '' };
    if (u < 1e-6 || n >= 4) A = drawStage(Math.min(4, n), 1, false);
    else { A = drawStage(n, clamp(u / 0.35, 0, 1), true); Bp = drawStage(n + 1, clamp((u - 0.2) / 0.8, 0, 1), false); }
    // building smashed: cut the top off, rubble, smoke, broken cookies
    gb += A.mid + Bp.mid;
    let gfr = A.front + Bp.front;
    if (smashed > 0 && g > 0.5) {
      const topY = g >= 3.5 ? -2600 : g >= 2.5 ? 180 : g >= 1.5 ? 300 : 560;
      const cutY = lerp(topY - 200, GR.base - 120, ease.out(smashed) * (g >= 3.5 ? 0.92 : 0.7));
      gb = G(gb, null, { 'clip-path': `url(#${clipCut(cutY)})` }) + jaggedTop(GR.x - 460, GR.x + 460, cutY, tn, smashed);
      if (g < 1.5) gfr = G(gfr, `rotate(${f(-14 * smashed)} ${GR.x} 900)`);
      gb += G(rubble(GR.x - 150, GR.base + 40, 420, tn, 41, ['#FF9AA8', '#C9D3F2', '#FFD0E4', '#8A93A6']) + rubble(GR.x + 260, GR.base + 60, 300, tn, 47, ['#BFF0FF', '#FF8A9A', '#C9D3F2']), null, { opacity: op(smashed * 1.6) });
      gb += smoke(GR.x - 120, cutY + 40, 1.6, t, smashed, 11) + smoke(GR.x + 180, cutY + 80, 1.3, t, smashed, 17) + (night ? fire(GR.x - 60, cutY + 30, 1.1 * smashed, t, 3) + fire(GR.x + 200, GR.base - 40, 0.8 * smashed, t, 8) : '');
      let ck = '';
      for (let i = 0; i < 6; i++) { const cx = GR.x - 500 + i * 190 + 40 * hash(i), cy = 850 + 90 * hash(i * 3.3); ck += G(P('M-26 0 A26 26 0 0 1 26 0 L14 -4 L6 8 L-4 -2 L-14 6 Z', tn.ol('#E0A35A', 4)), tr(cx, cy, 1, hash(i * 5) * 360)); }
      gb += G(ck, null, { opacity: op(smashed * 2) });
    }
    fr += gfr;
    // the giant billboard (behind the tower, right)
    const bbK = b01(o.billboard, g >= 4 ? 1 : 0);
    const tnBB = tone({ ...tw, night: (tw.night || 0) * 0.15, raid: (tw.raid || 0) * 0.3 });
    if (bbK > 0) m += G(grannyBillboard(2130, 150, tnBB, t, bbK, o.billboardFace) + (night ? glow(2130, 150, 520, 'gsGlowPink', 0.35 * bbK) : ''), null, smashed > 0.5 ? { transform: `rotate(${f(8 * smashed)} 2130 760)` } : undefined);
    // clouds the tower pierces (k 1, in front of the tower)
    if (g > 3.2) { const ck = clamp((g - 3.2) / 0.8, 0, 1); gb += G(cubeCloud(GR.x - 260, -1080, 1.3, tn, night ? '#5A4C9A' : '#FFFFFF', 3) + cubeCloud(GR.x + 300, -1300, 1.1, tn, night ? '#5A4C9A' : '#FFFFFF', 8) + cubeCloud(GR.x - 120, -1900, 1.0, tn, night ? '#5A4C9A' : '#FFFFFF', 12), null, { opacity: op(ck * 0.95) }); }
  }
  m += gb;
  // ---- light
  let light = '';
  if (night) light += V(cam, glow(TY.lava.x0 + 200, TY.lava.y0, 320, 'gsGlowFire', 0.4), 1);
  if (sunset) light += R(0, 0, 1920, 1080, 0, { fill: '#FF9A50', opacity: 0.06 });
  if (smashed > 0 && night) light += R(0, 0, 1920, 1080, 0, { fill: '#FF3A2A', opacity: op(smashed * (0.06 + 0.03 * Math.sin(t * 4))) });
  if (o.flash > 0) light += R(0, 0, 1920, 1080, 0, { fill: '#FFFFFF', opacity: op(o.flash) });
  return layersOf(V(cam, sky, 0) + V(cam, sunm, 0.03) + V(cam, cl, 0.08) + V(cam, b30, 0.3) + V(cam, b55, 0.55), V(cam, m, 1), V(cam, fr, 1), '', light);
}
// clip everything below y (for the smashed building). Returns a clipPath id (defined inline once per frame via DEFS_CUT)
const CUTS = new Map();
function clipCut(y) {
  const id = 'gsCut' + Math.round(y);
  if (!CUTS.has(id)) CUTS.set(id, `<clipPath id="${id}"><rect x="-6000" y="${Math.round(y)}" width="14000" height="9000"/></clipPath>`);
  return id;
}
function jaggedTop(x0, x1, y, tn, k) {
  let d = `M${x0} ${y + 40}`;
  for (let x = x0; x <= x1; x += 40) d += ` L${f(x)} ${f(y - 10 + 40 * hash(x * 0.37))}`;
  return P(d, { fill: 'none', stroke: tn.c('#3A2A40'), 'stroke-width': 14, 'stroke-linejoin': 'round', opacity: op(k * 2) });
}
const tycoon = camSet((t, cam, o) => { CUTS.clear(); const L = tycoonLayers(t, cam, o); if (CUTS.size) L.mid = `<defs>${[...CUTS.values()].join('')}</defs>` + L.mid; return L; });

// ================================================================= 3b. CASTLE INTERIOR (the tour: lava pool, trophy room, throne)
// Room set, world = the 1920×1080 frame padded to x −900…2820, y −700…1800; a wide hall meant for a pan from left to right.
// LEFT: the indoor LAVA POOL (x −640…420) sunk into the floor with a diving board + a NO RUNNING sign. CENTRE: the TROPHY
// WALL (x 520…1640): six shelves of cups + the giant #1 cup on a pedestal + the 400 counter. RIGHT: the THRONE (x 2200) on a
// three-step dais under red curtains — a gold gaming chair with a crown and (o.priceTag) a price tag. Stone walls, arched
// windows (bg = sky), torches, banners with YOUR crest, a long red carpet. Stand line FLOOR 980 (s .5).
// o: { time 'day'|'sunset'|'night', priceTag (default true), lava 0..1 (glow, default 1), count '400', flash }
def(pat('gsCastleFloor', 160, 80, '<rect width="160" height="80" fill="#8E86B0"/><rect width="80" height="40" fill="#9F98C0"/><rect x="80" y="40" width="80" height="40" fill="#9F98C0"/><path d="M0 0 H160 M0 40 H160 M0 0 V80 M80 0 V80" stroke="#000" stroke-width="3" opacity="0.12"/>'));
const CI_ = { floor: 980, wallBase: 770, lava: { x0: -640, x1: 420, y0: 820, y1: 1000 }, trophy: { x0: 520, x1: 1640, y0: 90, y1: 700 }, throne: { x: 2200, top: 900, seat: 750 } };
function castleInteriorLayers(t, o) {
  const time = o.time || 'day', night = time === 'night' ? 1 : 0;
  const tn = tone(timeTone(o, { dim: 0.08 }));
  const XL = -2400, XR = 4300, YT = -1200, YB = 2200, W = XR - XL;
  // bg: sky through the windows
  let bg = R(XL, YT, W, YB - YT, 0, { fill: `url(#${night ? 'gsSkyNight' : time === 'sunset' ? 'gsSkySunset' : 'gsSkyDay'})` });
  if (night) bg += R(XL, YT, W, 900, 0, { fill: 'url(#gsStars)' });
  for (let i = 0; i < 8; i++) bg += cubeCloud(-2000 + i * 760 + md(t * 10, 760), 220 + 120 * hash(i), 0.55, tn, night ? '#4E4290' : '#FFFFFF', i);
  // mid: walls, windows, floor, the three zones
  let m = '';
  const wins = [[-1200, 0], [-380, 0], [300, 0], [2900, 0], [3600, 0]];
  let wallD = dR(XL, YT, W, CI_.wallBase - YT);
  for (const [x] of wins) wallD += `M${x - 110} 520 V200 A110 110 0 0 0 ${x + 110} 200 V520 Z`;
  m += P(wallD, { fill: tn.c('#B8B4D8'), 'fill-rule': 'evenodd' }) + P(wallD, { fill: 'url(#gsBrickBig)', 'fill-rule': 'evenodd' });
  for (const [x] of wins) m += P(`M${x - 110} 520 V200 A110 110 0 0 1 ${x + 110} 200 V520 Z`, tn.ln(10, '#8E86B0')) + P(`M${x} 90 V520 M${x - 110} 330 H${x + 110}`, tn.ln(8, '#6A6290')) + R(x - 130, 520, 260, 26, 6, tn.ol('#D8D4F0', 5));
  m += R(XL, CI_.wallBase - 40, W, 40, 0, tn.ol('#9A94C0', 5));
  m += R(XL, CI_.wallBase, W, YB - CI_.wallBase, 0, { fill: 'url(#gsCastleFloor)' }) + R(XL, CI_.wallBase, W, 40, 0, { fill: '#000', opacity: 0.15 });
  // red carpet
  m += R(XL, 880, W, 70, 0, tn.ol('#D8263A', 5)) + P(`M${XL} 892 H${XR} M${XL} 938 H${XR}`, tn.ln(5, C.gold));
  // banners with the YOU crest
  for (const x of [-800, -40, 1080, 1720, 2700, 3250]) m += G(P('M-70 0 H70 V230 L0 196 L-70 230 Z', tn.ol(C.red, 6)) + R(-80, -12, 160, 22, 7, tn.ol(C.gold, 5)) + T('YOU', 0, 110, 44, tn.c(C.yellow), OUTX(5, tn.line)) + gameIcon('crown', 0, 54, 0.9, tn), tr(x, x === 1080 ? -30 : 40));
  // torches
  for (const x of [80, 1660, 2740, -760]) m += torch(x, 520, 1, t, tn, x, 1);
  // --- LAVA POOL
  const LV = CI_.lava;
  m += R(LV.x0 - 30, LV.y0 - 24, LV.x1 - LV.x0 + 60, LV.y1 - LV.y0 + 40, 26, tn.ol('#C9CFE6', 7));
  m += R(LV.x0, LV.y0, LV.x1 - LV.x0, LV.y1 - LV.y0, 18, tn.ol('!#FF6A1F', 6));
  const dx = md(t * 26, 180);
  m += G(R(LV.x0 - dx, LV.y0 + 4, LV.x1 - LV.x0, LV.y1 - LV.y0 - 8, 0, { fill: 'url(#gsLavaTex)' }), `translate(${f(dx)} 0)`);
  let bub = '';
  for (let i = 0; i < 8; i++) { const u = md(t * 0.8 + i * 0.19, 1); bub += dC(LV.x0 + 60 + i * 125, LV.y0 + 60 + 60 * hash(i) - u * 30, 12 * (1 - u) + 3); }
  m += P(bub, { fill: '#FFE27A' });
  m += R(LV.x1 - 260, LV.y0 - 70, 300, 26, 8, tn.ol('#4FB6E8', 5)) + R(LV.x1 + 10, LV.y0 - 70, 30, 140, 4, tn.ol(C.slate, 5));
  m += signBoard(LV.x0 + 40, LV.y0 - 30, 210, 90, ['LAVA POOL', 'NO RUNNING'], tn, { col: C.red, post: 80, size: 26 });
  // --- TROPHY WALL
  const TW = CI_.trophy;
  m += R(TW.x0 - 30, TW.y0 - 90, TW.x1 - TW.x0 + 60, TW.y1 - TW.y0 + 120, 16, tn.ol('#8A5A34', 8));
  m += R(TW.x0, TW.y0, TW.x1 - TW.x0, TW.y1 - TW.y0, 8, tn.fl(night ? '#5A3A50' : '#FFE9C0'));
  m += G(R(TW.x0 / 0.78, TW.y0 / 0.78, (TW.x1 - TW.x0) / 0.78, (TW.y1 - TW.y0) / 0.78, 0, { fill: 'url(#gsTrophies)' }), 'scale(0.78)');
  m += R(TW.x0 + 300, TW.y0 - 76, TW.x1 - TW.x0 - 600, 62, 14, tn.ol(C.gold, 6)) + T('TROPHY ROOM', (TW.x0 + TW.x1) / 2, TW.y0 - 30, 46, tn.c('#6A3A14'));
  let glint = '';
  for (let i = 0; i < 6; i++) { const u = md(t * 0.6 + i * 0.31, 1); if (u < 0.25) { const gx = TW.x0 + 80 + hash(i * 3.3) * (TW.x1 - TW.x0 - 160), gy = TW.y0 + 40 + hash(i * 7.7) * (TW.y1 - TW.y0 - 80), r = 26 * Math.sin(u / 0.25 * Math.PI); glint += `M${f(gx)} ${f(gy - r)} L${f(gx + r * 0.25)} ${f(gy - r * 0.25)} L${f(gx + r)} ${f(gy)} L${f(gx + r * 0.25)} ${f(gy + r * 0.25)} L${f(gx)} ${f(gy + r)} L${f(gx - r * 0.25)} ${f(gy + r * 0.25)} L${f(gx - r)} ${f(gy)} L${f(gx - r * 0.25)} ${f(gy - r * 0.25)} Z`; } }
  m += P(glint, { fill: '#FFFFFF' });
  // the giant #1 cup on a pedestal + the counter
  const cx = (TW.x0 + TW.x1) / 2;
  m += brick(cx - 110, 700, 220, 130, 30, '#D8D4F0', tn, { lw: 6 }) + G(P('M-110 -300 H110 V-260 Q110 -130 0 -110 Q-110 -130 -110 -260 Z M-40 -110 H40 V-50 H-40 Z M-80 -50 H80 V0 H-80 Z', tn.ol(C.gold, 8)) + P('M-110 -270 Q-180 -260 -160 -190 Q-140 -150 -96 -160 M110 -270 Q180 -260 160 -190 Q140 -150 96 -160', tn.ln(12)) + P('M-110 -270 Q-180 -260 -160 -190 Q-140 -150 -96 -160 M110 -270 Q180 -260 160 -190 Q140 -150 96 -160', tn.ln(6, C.goldD)) + T('#1', 0, -196, 70, tn.c('#FFFFFF'), OUTX(6, tn.line)) + R(-70, -280, 22, 120, 8, { fill: '#FFF', opacity: 0.45 }), tr(cx, 670, 0.9));
  m += R(cx + 180, 610, 230, 80, 14, tn.ol('#1C1850', 6)) + T(String(o.count || '400') + ' CUPS', cx + 295, 666, 40, '#FFD23F');
  // --- THRONE on the dais (curtains behind)
  const TH = CI_.throne;
  let cur = '';
  for (const sx of [-1, 1]) cur += `M${TH.x + sx * 60} -40 Q${TH.x + sx * 260} 300 ${TH.x + sx * 330} 770 L${TH.x + sx * 420} 770 Q${TH.x + sx * 400} 300 ${TH.x + sx * 440} -40 Z `;
  m += R(TH.x - 440, -60, 880, 40, 10, tn.ol(C.gold, 6)) + P(cur, tn.ol('#C81E3A', 6)) + P(`M${TH.x - 300} 100 Q${TH.x - 330} 400 ${TH.x - 370} 760 M${TH.x + 300} 100 Q${TH.x + 330} 400 ${TH.x + 370} 760`, tn.ln(6, '#9A1028', 0.7));
  m += G(P('M-160 0 L160 0 L120 -140 L-120 -140 Z', tn.ol(C.purple, 6)) + gameIcon('crown', 0, -60, 1.4, tn), tr(TH.x, 120));
  const B2 = brickBatch(tn, { lw: 6 });
  B2.add(TH.x - 400, TH.top + 60, 800, 50, 26, '#D8D4F0'); B2.add(TH.x - 330, TH.top + 10, 660, 50, 26, '#E4E0F8'); B2.add(TH.x - 260, TH.top - 40, 520, 50, 26, C.red, 52);
  m += B2.out();
  m += throneChair(TH.x, TH.top - 66, 1, tn, t);
  if (o.priceTag !== false) m += G(P('M0 0 L40 60', tn.ln(4, '#8A93A6')) + G(P('M-20 0 H120 L150 40 L120 80 H-20 Z', tn.ol('#FFE14D', 5)) + CI(0, 40, 9, { fill: LINE }) + T('99,999', 66, 54, 34, tn.c('#151515')), 'translate(30 56) rotate(14)'), tr(TH.x + 120, TH.seat - 330, 1, Math.sin(t * 2) * 4));
  // front: nothing tall — the lava pool rim front lip only (avatars wading into the lava sink behind it)
  let fr = R(LV.x0 - 30, LV.y1 - 10, LV.x1 - LV.x0 + 60, 26, 12, tn.ol('#C9CFE6', 6));
  // light: lava glow, window light, torches
  let light = glow((LV.x0 + LV.x1) / 2, LV.y0 + 20, 460, 'gsGlowFire', b01(o.lava, 1) * (night ? 0.8 : 0.55)) + glow(cx, 400, 420, 'gsGlowGold', night ? 0.35 : 0.2);
  for (const x of [80, 1660, 2740, -760]) light += glow(x, 470, 160, 'gsGlowFire', 0.6);
  if (night) light += R(XL, YT, W, YB - YT, 0, { fill: '#1A1050', opacity: 0.18 });
  if (o.flash > 0) light += R(XL, YT, W, YB - YT, 0, { fill: '#FFFFFF', opacity: op(o.flash) });
  return { bg, mid: m, front: fr, fg: '', light };
}
// the very expensive chair: a gold gaming chair with a crown (origin = base centre, seat at y ≈ −184)
function throneChair(x, y, s, tn, t = 0) {
  let o = '';
  o += P('M-30 -150 L-30 -40 M30 -150 L30 -40 M-110 0 L0 -40 L110 0', tn.ln(16)) + P('M-110 0 L0 -40 L110 0', tn.ln(8, C.goldD));
  o += CI(-110, 0, 16, tn.ol(LINE, 3)) + CI(110, 0, 16, tn.ol(LINE, 3));
  o += R(-150, -560, 300, 380, 60, tn.ol(C.gold, 9)) + R(-108, -520, 216, 300, 40, tn.ol('#D8263A', 6));
  o += P('M-108 -420 H108 M-108 -320 H108', tn.ln(5, '#A8162A', 0.8));
  o += R(-170, -220, 340, 70, 26, tn.ol(C.gold, 8)) + R(-150, -210, 300, 30, 14, tn.ol('#D8263A', 5));
  o += R(-200, -320, 60, 140, 20, tn.ol(C.gold, 7)) + R(140, -320, 60, 140, 20, tn.ol(C.gold, 7));
  o += G(P('M-80 30 L-80 -30 L-40 0 L0 -50 L40 0 L80 -30 L80 30 Z', tn.ol(C.gold, 7)) + P(dC(-40, 10, 9) + dC(40, 10, 9), tn.fl(C.sky)) + P(dC(0, 4, 12), tn.fl(C.red)), 'translate(0 -580)');
  o += R(-120, -540, 40, 200, 16, { fill: '#FFF', opacity: 0.35 });
  let sp = '';
  for (let i = 0; i < 3; i++) { const u = md(t * 0.7 + i * 0.33, 1), r = 18 * Math.sin(u * Math.PI); const gx = -150 + 300 * hash(i * 2.2), gy = -540 + 320 * hash(i * 5.5); sp += `M${f(gx)} ${f(gy - r)} L${f(gx + r * 0.3)} ${f(gy)} L${f(gx)} ${f(gy + r)} L${f(gx - r * 0.3)} ${f(gy)} Z M${f(gx - r)} ${f(gy)} L${f(gx)} ${f(gy - r * 0.3)} L${f(gx + r)} ${f(gy)} L${f(gx)} ${f(gy + r * 0.3)} Z `; }
  o += P(sp, { fill: '#FFFFFF' });
  return G(o, tr(x, y, s));
}
const castleInterior = roomSet(castleInteriorLayers);

// ================================================================= 3c. FACTORY INTERIOR (Granny's Goodies Inc.)
// Room set (frame padded to x −900…2820). Pink-tiled walls, pipes, round windows (bg = sky). LEFT: two big brick OVENS with
// glowing mouths (x −560 / 0). Main CONVEYOR BELT across the room (top y 740, x −700…2600) = `front`: workers stand BEHIND
// it (SPOTS.factoryInterior.workers, feet y 900, s .45 — the belt hides their legs) and cookies ride along it to the right
// (o.belt = speed). Upper belt climbing to the giant cookie hopper (right). Wall: EMPLOYEE OF THE MONTH frame (x 1480; its
// photo slot is SPOTS.factoryInterior.employee — draw a head into it, or pass o.employee svg|fn(w, h)), a DAYS WITHOUT A
// COOKIE INCIDENT board, a price board, the GRANNY'S GOODIES INC. banner. Stand line in front of the belt FLOOR 1000 (s .5).
// o: { time, belt (speed, default 1; 0 = stopped), employee svg|fn(w,h), employeeName 'NoodleBoi', days 0, smashed 0..1, flash }
const FI = { floor: 1000, wallBase: 780, belt: { x0: -1500, x1: 3400, top: 740 }, workerY: 900, emp: { x: 1560, y: 250, w: 230, h: 250 } };
function factoryInteriorLayers(t, o) {
  const time = o.time || 'day', night = time === 'night' ? 1 : 0, smashed = b01(o.smashed);
  const tn = tone(timeTone(o, { raid: smashed * 0.5 }));
  const XL = -2400, XR = 4300, YT = -1200, YB = 2200, W = XR - XL;
  const sp = o.belt ?? 1;
  const cookie = (x, y, r, rot = 0, broken = false) => G((broken ? P(`M${-r} 0 A${r} ${r} 0 0 1 ${r} 0 L${r * 0.5} ${-r * 0.1} L${r * 0.2} ${r * 0.3} L${-r * 0.2} ${-r * 0.05} L${-r * 0.5} ${r * 0.25} Z`, tn.ol('#E0A35A', 4)) : CI(0, 0, r, tn.ol('#E0A35A', Math.max(3, r * 0.14)))) + P(dRR(-r * 0.45, -r * 0.4, r * 0.28, r * 0.28, 3) + dRR(r * 0.12, -r * 0.1, r * 0.28, r * 0.28, 3), { fill: tn.c('#5A3018') }), tr(x, y, 1, rot));
  let bg = R(XL, YT, W, YB - YT, 0, { fill: `url(#${night ? 'gsSkyNight' : 'gsSkyDay'})` });
  for (let i = 0; i < 7; i++) bg += cubeCloud(-2000 + i * 900 + md(t * 12, 900), 140 + 80 * hash(i), 0.5, tn, night ? '#4E4290' : '#FFFFFF', i + 20);
  let m = '';
  // wall with round windows (holes)
  let wallD = dR(XL, YT, W, FI.wallBase - YT);
  const wins = [-1300, -260, 2300, 3400];
  for (const x of wins) wallD += dC(x, 130, 110);
  m += P(wallD, { fill: tn.c('#FFD6E8'), 'fill-rule': 'evenodd' }) + R(XL, 380, W, FI.wallBase - 380, 0, tn.fl('#FFFFFF')) + R(XL, 380, W, FI.wallBase - 380, 0, { fill: 'url(#gsTileFloor)' });
  m += R(XL, 368, W, 22, 0, tn.ol(C.pink, 4));
  for (const x of wins) m += CI(x, 130, 110, { fill: 'none', stroke: tn.c('#8A93A6'), 'stroke-width': 16 }) + P(`M${x - 110} 130 H${x + 110} M${x} 20 V240`, tn.ln(7, '#8A93A6'));
  // pipes along the ceiling
  m += P(`M${XL} -40 H${XR} M${XL} 10 H1900 Q1940 10 1940 50 V360`, tn.ln(34)) + P(`M${XL} -40 H${XR} M${XL} 10 H1900 Q1940 10 1940 50 V360`, tn.ln(24, '#C9D3F2'));
  let bulb = '';
  for (let x = -1500; x < 3600; x += 260) bulb += `M${x} -40 V60 `;
  m += P(bulb, tn.ln(5, '#5A6488')) ;
  for (let x = -1500; x < 3600; x += 260) m += P(`M${x - 40} 100 L${x - 26} 60 H${x + 26} L${x + 40} 100 Z`, tn.ol('#FFE14D', 4)) + (night ? glow(x, 110, 90, 'gsGlowWarm', 0.7) : '');
  for (const x of [-500, 300, 1300, 2600]) m += R(x - 18, -62, 36, 44, 6, tn.ol('#8A93A6', 4));
  // banner
  m += G(R(-420, -60, 840, 112, 22, tn.ol(C.pink, 7)) + T("GRANNY'S GOODIES INC.", 0, 22, 66, tn.c('#FFFFFF'), OUTX(7, tn.line)) + cookie(-460, 0, 50) + cookie(460, 0, 50), tr(860, 150));
  // EMPLOYEE OF THE MONTH
  const EM = FI.emp;
  m += R(EM.x - EM.w / 2 - 40, EM.y - EM.h / 2 - 100, EM.w + 80, EM.h + 190, 18, tn.ol(C.gold, 8)) + R(EM.x - EM.w / 2 - 22, EM.y - EM.h / 2 - 82, EM.w + 44, EM.h + 154, 12, tn.ol('#FFF4DE', 5));
  m += TF('EMPLOYEE', EM.x, EM.y - EM.h / 2 - 44, 30, tn.c('#6A3A14')) + TF('OF THE MONTH', EM.x, EM.y - EM.h / 2 - 12, 26, tn.c('#6A3A14'));
  m += R(EM.x - EM.w / 2, EM.y - EM.h / 2, EM.w, EM.h, 8, tn.ol('#BFE6FF', 5));
  if (o.employee) m += G(typeof o.employee === 'function' ? o.employee(EM.w, EM.h) : o.employee, `translate(${EM.x} ${EM.y})`);
  else m += gameIcon('star', EM.x, EM.y, 2.2, tn);
  m += R(EM.x - EM.w / 2, EM.y + EM.h / 2 + 12, EM.w, 44, 8, tn.ol(C.gold, 4)) + TF(o.employeeName || 'NoodleBoi', EM.x, EM.y + EM.h / 2 + 44, 28, tn.c('#151515'));
  // boards: days without incident + prices
  m += G(R(-170, -110, 340, 220, 16, tn.ol('#2E3550', 7)) + TF('DAYS WITHOUT A', 0, -62, 26, '#FFFFFF') + TF('COOKIE INCIDENT', 0, -30, 26, '#FFFFFF') + R(-60, -8, 120, 96, 10, { fill: '#000' }) + T(String(o.days ?? 0), 0, 70, 80, '#FF4D5E'), tr(560, 560));
  m += G(R(-180, -130, 360, 260, 16, tn.ol('#3A2A20', 7)) + T('PRICES', 0, -80, 40, '#FFE14D') + TF('COOKIE ...... 5', 0, -26, 28, '#FFFFFF') + TF('WEEKENDS ... 10', 0, 16, 28, '#FFFFFF') + TF('IF RUDE ...... 15', 0, 58, 28, '#FF8FA0') + TF('(NO REFUNDS)', 0, 104, 22, '#BFE6FF'), tr(2020, 560));
  // floor with safety stripes
  m += R(XL, FI.wallBase, W, YB - FI.wallBase, 0, tn.fl('#B9C6E6')) + R(XL, FI.wallBase, W, YB - FI.wallBase, 0, { fill: 'url(#gsTileFloor)' }) + R(XL, FI.wallBase, W, 30, 0, { fill: '#000', opacity: 0.12 });
  // OVENS (left)
  for (const [x, i] of [[-560, 0], [10, 1]]) {
    let ov = brick(x - 230, 200, 460, 580, 40, '#D96A5A', tn, { lw: 7, studs: 50 }) + R(x - 227, 203, 454, 574, 0, { fill: 'url(#gsBrickBig)' });
    ov += P(`M${x - 150} 640 V470 A150 150 0 0 1 ${x + 150} 470 V640 Z`, tn.ol('#3A1A20', 7));
    const fl = 0.75 + 0.25 * Math.sin(t * 6 + i);
    ov += P(`M${x - 130} 640 V480 A130 130 0 0 1 ${x + 130} 480 V640 Z`, { fill: '#FF7A2A', opacity: op(fl) }) + P(`M${x - 90} 640 V520 A90 90 0 0 1 ${x + 90} 520 V640 Z`, { fill: '#FFD23F', opacity: op(fl) });
    ov += R(x - 170, 640, 340, 30, 6, tn.ol('#8A93A6', 5)) + R(x - 60, 120, 120, 90, 8, tn.ol('#8A93A6', 5)) + smoke(x, 110, 0.7, t, 0.5, i * 7, '#FFFFFF');
    ov += cookie(x - 60, 625, 18) + cookie(x + 10, 622, 18, 40) + cookie(x + 70, 626, 18, 80);
    m += ov + glow(x, 560, 260, 'gsGlowFire', 0.55);
  }
  // upper belt to the cookie hopper (right, behind)
  const ub = [[2300, 600], [2900, 300]];
  m += P(`M${ub[0][0]} ${ub[0][1]} L${ub[1][0]} ${ub[1][1]} L${ub[1][0]} ${ub[1][1] + 40} L${ub[0][0]} ${ub[0][1] + 40} Z`, tn.ol('#3A3F5C', 6));
  for (let i = 0; i < 6; i++) { const u = md(i / 6 + t * 0.12 * sp, 1); m += cookie(lerp(ub[0][0], ub[1][0], u), lerp(ub[0][1], ub[1][1], u) - 20, 16, u * 400); }
  m += P(`M${ub[0][0] + 100} ${ub[0][1] + 10} L${ub[0][0] + 100} 780 M${ub[1][0] - 200} ${ub[1][1] + 100} L${ub[1][0] - 200} 780`, tn.ln(12, '#5A6488'));
  m += G(P('M-170 -200 H170 L120 120 H-120 Z', tn.ol('#C9D3F2', 7)) + R(-180, -220, 360, 30, 8, tn.ol('#8A93A6', 5)) + cookie(-60, -210, 40, 10) + cookie(30, -228, 40, 40) + cookie(100, -204, 34) + R(-30, 120, 60, 60, 6, tn.ol('#8A93A6', 5)), tr(3050, 470));
  // boxes stack (right)
  const BX = brickBatch(tn, { lw: 5 });
  for (const [x, y, w] of [[3300, 780, 170], [3480, 780, 170], [3380, 650, 170]]) BX.add(x, y - 120, w, 120, 20, '#C98A4E');
  m += BX.out() + T('GOODIES', 3385, 600, 26, tn.c('#6A3A14')) + T('GOODIES', 3565, 730, 26, tn.c('#6A3A14'));
  if (smashed > 0) m += G(R(XL, YT, W, YB - YT, 0, { fill: '#3A1030', opacity: 0.25 }) + rubble(900, 780, 400, tn, 5, ['#FFD6E8', '#C9D3F2', '#8A93A6']) + rubble(1900, 790, 300, tn, 9, ['#FFFFFF', '#D96A5A']), null, { opacity: op(smashed) });
  // FRONT: the main belt (hides workers' legs) + cookies riding on it
  const BL = FI.belt;
  let fr = R(BL.x0, BL.top, BL.x1 - BL.x0, 40, 18, { fill: 'url(#gsConveyor)', stroke: tn.line, 'stroke-width': 6 });
  fr += R(BL.x0 - 10, BL.top + 34, BL.x1 - BL.x0 + 20, 60, 12, tn.ol('#8A93A6', 6)) + R(BL.x0, BL.top + 44, BL.x1 - BL.x0, 14, 0, { fill: 'url(#gsStripes)', opacity: 0.4 });
  let rl = '';
  for (let x = BL.x0 + 40; x < BL.x1; x += 120) rl += dC(x, BL.top + 64, 14);
  fr += P(rl, tn.ol('#5A6488', 4));
  let legs = '';
  for (let x = BL.x0 + 100; x < BL.x1; x += 400) legs += dR(x, BL.top + 94, 26, 1000 - BL.top - 94) + dR(x - 30, 990, 86, 14);
  fr = P(legs, tn.ol('#5A6488', 5)) + fr;
  for (let i = 0; i < 18; i++) { const x = BL.x0 + md(i * 190 + t * 120 * sp, BL.x1 - BL.x0); fr += cookie(x, BL.top - 18, 26, x * 0.7, smashed > 0.5 && i % 3 === 0); }
  let light = glow(-560, 560, 320, 'gsGlowFire', 0.35) + glow(10, 560, 320, 'gsGlowFire', 0.35);
  if (night) light += R(XL, YT, W, YB - YT, 0, { fill: '#1A1050', opacity: 0.16 });
  if (smashed > 0) light += R(XL, YT, W, YB - YT, 0, { fill: '#FF2A3A', opacity: op(smashed * 0.08) });
  if (o.flash > 0) light += R(XL, YT, W, YB - YT, 0, { fill: '#FFFFFF', opacity: op(o.flash) });
  return { bg, mid: m, front: fr, fg: '', light };
}
const factoryInterior = roomSet(factoryInteriorLayers);

// ================================================================= 4. THE OBBY TOWER (100 floors over a lava sea)
// A long VERTICAL world. Lava sea at y 1000 (k 1). LEFT: the basalt BATTLEFIELD plateau (x −2800…700, top y 800…1000,
// stand line FLOOR 960, s .36) where the raid fights happen (SC10) — Dad's spot at the foot of the tower is
// SPOTS.tower.base. The SPIRE (x 1400…1600, purple blocks with glowing seams, a neon ring + number every 10 floors) rises out
// of the lava; floors 1…99 are floating studded platforms zig-zagging around it, 210 px apart (floor i stands at
// y = 760 − 210·(i − 1)), every 10th is a wide CHECKPOINT, a few are icy (slippery). Floor 99 juts far LEFT; the FINAL GAP
// (700 px) leads to the TOP platform (floor 100, y ≈ −19880) centred on the spire with the crystal pedestal
// (SPOTS.tower.crystal — the crystal itself is drawn by scenes/gameui.js). Glowing floor numbers on every platform.
// Behind: far city lights (k .12, near the bottom only), cube clouds + floating decor platforms at every height (k .45 /
// .25), the moon (k .02), stars. Extreme zoom-outs (< .25) switch to a cheap silhouette LOD.
// o: { time 'night' (default) | 'day' | 'sunset', lava 0..1 (glow + bubbles, default 1), burst 0..1 (light burst from the
//      crystal: rays + flash ring), dawn 0..1 (victory: sky + world turn gold, the sun rises), crystal (true: draws a simple
//      placeholder crystal on the pedestal — scenes normally draw gameui's), flash }
const TW = {
  floor: 960, s: 0.36, lava: 1000, cx: 1500, spW: 200, step: 210, y1: 760, n: 99,
  plateau: { x0: -2800, x1: 700, back: 780, front: 1010 },
};
const twS = (y) => TW.s * (y - 420) / (TW.floor - 420);
const TW_ZIG = [-380, -130, 150, 400, 150, -130];
const TW_FLOORS = (() => {
  const a = [];
  for (let i = 1; i <= TW.n; i++) {
    let x = TW.cx + TW_ZIG[(i - 1) % 6] + (hash(i * 3.7) - 0.5) * 40;
    let w = i % 10 === 0 ? 340 : 200 + Math.round(30 * hash(i * 1.3));
    const ice = [7, 23, 46, 71, 88].includes(i);
    if (i === 97) x = TW.cx - 330;
    if (i === 98) x = TW.cx - 760;
    if (i === 99) { x = TW.cx - 1230; w = 240; }
    const y = TW.y1 - TW.step * (i - 1);
    a.push({ i, x: Math.round(x), y, w, x0: Math.round(x - w / 2), x1: Math.round(x + w / 2), k: 1, cp: i % 10 === 0, ice });
  }
  return a;
})();
const TW_TOP = (() => { const y = TW_FLOORS[98].y - 60, w = 900; return { i: 100, x: TW.cx, y, w, x0: TW.cx - w / 2, x1: TW.cx + w / 2, k: 1, top: true }; })();
const TW_COLS = [C.red, C.orange, C.yellow, C.mint, C.sky, C.purple, C.pink, C.lime];
function towerPlatform(p, tn, t, night, lod) {
  const col = p.top ? C.gold : p.cp ? '#2BD46A' : p.ice ? '#BFF2FF' : TW_COLS[(p.i * 3) % TW_COLS.length];
  const h = p.top ? 110 : p.cp ? 64 : 50, d = p.top ? 44 : 30;
  if (lod) return R(p.x0, p.y - 4, p.w, h, 4, tn.ol(col, 10));
  let s = brick(p.x0, p.y, p.w, h, d, col, tn, { lw: 6, studs: 44, rx: 6 });
  s = s.replace(/^/, '');
  // glowing underside
  s += P(`M${p.x0 + 20} ${p.y + h} L${p.x1 - 20} ${p.y + h} L${p.x1 - 50} ${p.y + h + 26} L${p.x0 + 50} ${p.y + h + 26} Z`, { fill: col, opacity: 0.35 });
  if (p.ice) s += P(`M${p.x0 + 30} ${p.y - d + 8} l40 0 M${p.x1 - 80} ${p.y - d + 18} l46 0`, tn.ln(5, '#FFFFFF', 0.9)) + P(`M${p.x0 + 24} ${p.y + h} l8 22 l8 -22 M${p.x1 - 60} ${p.y + h} l6 18 l6 -18`, tn.ol('#E8FBFF', 3));
  // floor number (neon)
  const num = String(p.i);
  s += T(num, p.x, p.y + h * 0.5 + (p.top ? 20 : 14), p.top ? 64 : p.cp ? 46 : 36, tn.c(night ? '!#FFFFFF' : '#FFFFFF'), OUTX(p.top ? 8 : 6, tn.line));
  if (p.cp) s += G(R(-6, -200, 12, 200, 4, tn.ol('#E8EEF8', 4)) + P(`M6 -196 Q50 ${-200 + Math.sin(t * 5 + p.i) * 6} 96 -188 L96 -130 Q50 ${-140 - Math.sin(t * 5 + p.i) * 6} 6 -134 Z`, tn.ol('#2BD46A', 5)) + T(num, 52, -148, 34, tn.c('#FFFFFF'), OUTX(4, tn.line)), tr(p.x1 - 40, p.y - d + 6));
  return s;
}
function towerLayers(t, cam, o) {
  const time = o.time || 'night', night = time === 'night' ? 1 : 0;
  const dawn = b01(o.dawn), burst = b01(o.burst), lavaK = b01(o.lava, 1);
  const tw = { ...timeTone({ time }), dawn: dawn * 0.85 };
  if (night) tw.night = 0.38;
  if (dawn > 0) tw.night = (tw.night || 0) * (1 - dawn);
  const tn = tone(tw);
  const hazeCol = dawn > 0.5 ? '#FFC8A0' : night ? '#2E2470' : '#CDEBFF';
  const tnF = tone({ ...tw, haze: 0.5, hazeCol }), tnM = tone({ ...tw, haze: 0.3, hazeCol });
  const v1 = vis(cam, 1), lod = v1.z < 0.25;
  // ---- sky (k 0) + moon / rising sun (k .02)
  const v0 = vis(cam, 0);
  const sky = skyFor(v0, o, { base: night ? 'gsSkyNight' : undefined, dawn, stars: 1 });
  let sm_ = '';
  if (night && dawn < 1) sm_ += G(moon(1500, 210, 90, tn), null, dawn > 0 ? { opacity: op(1 - dawn) } : undefined);
  if (dawn > 0) sm_ += G(sun(420, 1000 - 520 * ease.out(dawn), 90, t, '#FFE45C'), null, { opacity: op(dawn * 1.5) });
  // ---- far city lights (k .12)
  const vfc = vis(cam, 0.12);
  let city = '';
  if (vfc.y1 > 600) city += G(skyline((vfc.x0 - 300) / 0.5, (vfc.x1 + 300) / 0.5, 1000, tnF, 7, { lit: night * (1 - dawn) + 0.0001, hMin: 60, hVar: 200, lw: 5 }), 'translate(0 1000) scale(0.5) translate(0 -1000)') + R(vfc.x0 - 300, 990, vfc.x1 - vfc.x0 + 600, 600, 0, tnF.fl('#3A2A6A'));
  // ---- decor: floating mini obby bits (k .25) + clouds (k .45), generated per cell over every height
  const cellsAt = (k, cw, ch, fn) => { const v = vis(cam, k); let s = ''; for (let gx = Math.floor((v.x0 - cw) / cw); gx * cw < v.x1 + cw; gx++) for (let gy = Math.floor((v.y0 - ch) / ch); gy * ch < v.y1 + ch; gy++) s += fn(gx, gy, cw, ch); return s; };
  const deco = lod ? '' : cellsAt(0.25, 640, 520, (gx, gy, cw, ch) => {
    const hsh = hash(gx * 7.1 + gy * 13.3);
    if (hsh < 0.55 || gy * ch > 700) return '';
    const x = gx * cw + 400 * hash(gx * 3.3 + gy), y = gy * ch + 300 * hash(gy * 5.1 + gx), w = 90 + 70 * hash(gx + gy * 2.2);
    return R(x - w / 2, y, w, 22, 5, tnF.ol(TW_COLS[Math.floor(hsh * 80) % 8], 4)) + P(`M${f(x - w / 2 + 10)} ${f(y + 22)} H${f(x + w / 2 - 10)} L${f(x + w / 2 - 30)} ${f(y + 36)} H${f(x - w / 2 + 30)} Z`, tnF.fl(TW_COLS[Math.floor(hsh * 80) % 8], 0.4));
  });
  const clouds = cellsAt(0.45, 900, 700, (gx, gy, cw, ch) => {
    const hsh = hash(gx * 5.7 + gy * 11.9 + 3);
    if (hsh < 0.5 || gy * ch > 300) return '';
    const x = gx * cw + 500 * hash(gx * 2.3 + gy) + t * 6, y = gy * ch + 400 * hash(gy * 4.1 + gx), s = 0.55 + 0.5 * hash(gx + gy * 3.1);
    return lod ? R(x - 140 * s, y - 80 * s, 280 * s, 80 * s, 20, tnM.fl(night ? '#4A3C8A' : '#FFFFFF')) : cubeCloud(x, y, s, tnM, night && dawn < 0.5 ? '#4A3C8A' : dawn > 0.5 ? '#FFE0C8' : '#FFFFFF', gx * 31 + gy);
  });
  // ---- main (k 1): plateau, spire, platforms, lava
  const X0 = v1.x0 - 300, X1 = v1.x1 + 300, Y0 = v1.y0 - 400, Y1 = v1.y1 + 400;
  let m = '';
  // lava sea
  if (Y1 > TW.lava - 300) {
    const lx0 = X0, lx1 = X1;
    m += R(lx0, TW.lava - 260, lx1 - lx0, 260, 0, { fill: 'url(#gsLavaGlow)', opacity: op(0.8 * lavaK) });
    m += R(lx0, TW.lava, lx1 - lx0, 1200, 0, { fill: tn.c('!#FF6A1F') });
    if (!lod) {
      const dx = md(t * 24, 180);
      m += G(R(lx0 - dx, TW.lava + 8, lx1 - lx0 + 180, 1200, 0, { fill: 'url(#gsLavaTex)' }), `translate(${f(dx)} 0)`);
      let wv = `M${f(lx0)} ${TW.lava + 6}`;
      for (let x = Math.floor(lx0 / 80) * 80; x < lx1; x += 80) wv += ` Q${x + 20} ${f(TW.lava - 8 + Math.sin(t * 2.6 + x * 0.03) * 5)} ${x + 40} ${TW.lava + 6} T${x + 80} ${TW.lava + 6}`;
      m += P(wv, { fill: 'none', stroke: '#FFE27A', 'stroke-width': 8 });
      let bub = '';
      for (let i = 0; i < 10; i++) { const u = md(t * 0.7 + i * 0.13, 1), bx = lx0 + md(i * 397 + 120, lx1 - lx0); bub += dC(bx, TW.lava + 30 - u * 24, 10 * Math.sin(u * Math.PI) + 2); }
      m += P(bub, { fill: '#FFE27A', opacity: op(lavaK) });
    }
  }
  // the plateau (battlefield)
  const PL = TW.plateau;
  if (Y1 > PL.back - 400 && X0 < PL.x1) {
    m += R(PL.x0, PL.back, PL.x1 - PL.x0, PL.front - PL.back, 10, tn.ol('#857BA8', 7)) + R(PL.x0 + 6, PL.back + 6, PL.x1 - PL.x0 - 12, PL.front - PL.back - 12, 6, { fill: 'url(#gsBrickBig)', opacity: 0.7 }) + R(PL.x0 + 6, PL.back + 6, PL.x1 - PL.x0 - 12, PL.front - PL.back - 12, 6, { fill: 'url(#gsSand)', opacity: 0.6 });
    m += R(PL.x0 + 6, PL.back + 4, PL.x1 - PL.x0 - 12, 12, 4, { fill: '#FFF', opacity: 0.2 });
    // glowing rune circle in the middle of the battlefield + cracks
    m += E(-900, 905, 520, 80, { fill: 'none', stroke: tn.c(night ? '!#B98CFF' : '#9A7AE0'), 'stroke-width': 10, opacity: 0.6 }) + E(-900, 905, 380, 56, { fill: 'none', stroke: tn.c(night ? '!#B98CFF' : '#9A7AE0'), 'stroke-width': 6, opacity: 0.5 });
    m += P('M-2300 880 l60 20 l40 -14 l70 24 M-260 960 l50 -18 l60 22 l50 -10 M300 850 l-40 30 l30 30', tn.ln(5, '#4A3E70', 0.7));
    m += R(PL.x0, PL.front - 4, PL.x1 - PL.x0, 420, 6, tn.ol('#5A4E78', 7)) + R(PL.x0 + 4, PL.front, PL.x1 - PL.x0 - 8, 416, 0, { fill: 'url(#gsBrickBig)' }) + R(PL.x0, PL.front + 300, PL.x1 - PL.x0, 120, 0, { fill: '#FF6A1F', opacity: 0.35 });
    // broken pillars, torches, banners along the back edge
    for (const [x, h] of [[-2300, 260], [-1700, 180], [-1100, 300], [-500, 220], [200, 160]]) {
      if (x < X0 - 300 || x > X1 + 300) continue;
      m += brick(x - 45, PL.back - h, 90, h, 26, '#7A6E9A', tn, { lw: 6, studs: 40 });
      m += torch(x + 80, PL.back - 40, 0.8, t, tn, x, night * (1 - dawn));
    }
    if (!lod) for (const x of [-2000, -1400, -800, -200]) if (x > X0 - 200 && x < X1 + 200) m += banner(x, PL.back - 260, 90, 200, [C.purple, C.red][Math.abs(Math.round(x / 600)) % 2], 'tower', tn, t, 0, x) + R(x - 4, PL.back - 270, 8, 270, 3, tn.ol(C.slate, 3));
    // the edge rocks
    m += rubble(PL.x1 - 40, PL.front + 10, 160, tn, 2, ['#5A4E78', '#3E3460']);
  }
  // the spire
  const spX0 = TW.cx - TW.spW / 2, topY = TW_TOP.y + 110;
  {
    const ya = Math.max(topY, Y0), yb = Math.min(TW.lava + 40, Y1);
    if (yb > ya && X1 > spX0 && X0 < spX0 + TW.spW) {
      m += R(spX0, ya, TW.spW, yb - ya, 0, tn.ol('#4A3A80', 8));
      if (!lod) {
        m += R(spX0 + 4, ya, TW.spW - 8, yb - ya, 0, { fill: 'url(#gsBrickBig)' }) + R(spX0 + 14, ya, 30, yb - ya, 0, { fill: '#FFFFFF', opacity: 0.12 });
        let seams = '';
        for (let y = Math.ceil(ya / 105) * 105; y < yb; y += 105) seams += `M${spX0 + 6} ${y} H${spX0 + TW.spW - 6} `;
        m += P(seams, { stroke: tn.c(night ? '!#B98CFF' : '#9A7AE0'), 'stroke-width': 4, opacity: 0.7, fill: 'none' });
      }
      // neon rings + numbers every 10 floors
      for (let i = 10; i <= 90; i += 10) {
        const y = TW.y1 - TW.step * (i - 1) + 90;
        if (y < Y0 || y > Y1) continue;
        m += R(spX0 - 16, y - 14, TW.spW + 32, 28, 10, tn.ol(night ? '!#FF6FD0' : C.pink, 5));
        if (!lod) m += T(String(i), TW.cx, y + 110, 72, tn.c(night ? '!#7FF6FF' : '#FFFFFF'), OUTX(7, tn.line));
        if (night && !lod) m += glow(TW.cx, y, 160, 'gsGlowPink', 0.4 * (1 - dawn));
      }
    }
  }
  // platforms
  const tnP = tone({ ...tw, night: (tw.night || 0) * 0.45 });
  for (const p of TW_FLOORS) if (p.y > Y0 - 100 && p.y < Y1 + 100 && p.x1 > X0 && p.x0 < X1) m += towerPlatform(p, tnP, t, night, lod);
  // the top platform + crystal pedestal
  const TP = TW_TOP;
  if (lod) m += glow(TP.x, TP.y - 200, 900, 'gsGlowCyan', 0.9 * (1 - burst)) + G(P('M0 -150 L60 -60 L36 40 L-36 40 L-60 -60 Z', { fill: '#BFFFFF', stroke: LINE, 'stroke-width': 20 }), tr(TP.x, TP.y - 150, 2.2));
  if (TP.y > Y0 - 600 && TP.y < Y1 + 200) {
    m += towerPlatform(TP, tnP, t, night, lod);
    if (!lod) {
      m += brick(TP.x - 90, TP.y - 110, 180, 80, 30, '#4A3A80', tn, { lw: 6 }) + R(TP.x - 110, TP.y - 44, 220, 30, 8, tn.ol('#2E2458', 5));
      m += P(`M${TP.x - 60} ${TP.y - 84} h120 M${TP.x - 40} ${TP.y - 64} h80`, { stroke: tn.c('!#7FF6FF'), 'stroke-width': 5, fill: 'none', opacity: 0.9 });
      m += glow(TP.x, TP.y - 220, 260, 'gsGlowCyan', (0.4 + 0.2 * Math.sin(t * 3)) * (1 - burst));
      if (o.crystal) m += G(P('M0 -150 L60 -60 L36 40 L-36 40 L-60 -60 Z', tn.ol('!#7FF6FF', 7)) + P('M0 -150 L-20 -60 L0 40 M-60 -60 H60', tn.ln(4, '#FFFFFF', 0.8)), tr(TP.x, TP.y - 150 + Math.sin(t * 2) * 10));
      // flags on the corners
      m += obbyFlag(TP.x0 + 50, TP.y - 44, 1.1, tn, t, C.gold, '100') + obbyFlag(TP.x1 - 50, TP.y - 44, 1.1, tn, t, C.gold, '100');
    }
  }
  // ---- fg: embers rising from the lava (k 1.2)
  let fg = '';
  const ve = vis(cam, 1.2);
  if (!lod && ve.y1 > 200 && lavaK > 0) {
    let emb = '';
    for (let i = 0; i < 22; i++) { const x = ve.x0 + md(hash(i * 3.1) * 2600 + t * 16, ve.x1 - ve.x0 + 200) - 100, y = 1100 - md(hash(i * 5.9) * 900 + t * (70 + 60 * hash(i)), 1000), w = 7 + 7 * hash(i * 2); emb += dR(x, y, w, w); }
    fg += P(emb, { fill: '#FFB23A', opacity: op(0.75 * lavaK) });
  }
  // ---- light
  let light = '';
  const lavaGlow = V(cam, glow(TW.cx, TW.lava - 100, 700, 'gsGlowFire', 0.3 * lavaK * (1 - dawn * 0.5)), 1);
  light += lavaGlow;
  if (burst > 0) {
    const c = toScreen(cam, { x: TP.x, y: TP.y - 200, k: 1 });
    let rays = '';
    for (let i = 0; i < 18; i++) { const a = (i / 18) * Math.PI * 2 + t * 0.4, r = 3000; rays += dP([[c.x, c.y], [c.x + Math.cos(a - 0.05) * r, c.y + Math.sin(a - 0.05) * r], [c.x + Math.cos(a + 0.05) * r, c.y + Math.sin(a + 0.05) * r]]); }
    light += P(rays, { fill: '#FFFFFF', opacity: op(0.35 * Math.sin(Math.min(1, burst * 1.2) * Math.PI) + 0.12 * burst) });
    const rr = 40 + burst * 2400;
    light += CI(c.x, c.y, rr, { fill: 'none', stroke: '#BFFFFF', 'stroke-width': f(60 * (1 - burst) + 6), opacity: op(1 - burst) });
    light += R(0, 0, 1920, 1080, 0, { fill: '#FFFFFF', opacity: op(0.85 * Math.max(0, 1 - burst * 2.2)) });
  }
  if (dawn > 0) light += R(0, 0, 1920, 1080, 0, { fill: '#FFC060', opacity: op(0.12 * dawn) });
  if (o.flash > 0) light += R(0, 0, 1920, 1080, 0, { fill: '#FFFFFF', opacity: op(o.flash) });
  return layersOf(V(cam, sky, 0) + V(cam, sm_, 0.02) + V(cam, city, 0.12) + V(cam, deco, 0.25) + V(cam, clouds, 0.45), V(cam, m, 1), '', V(cam, fg, 1.2), light);
}
const tower = camSet(towerLayers);
// a cam centred on floor i (1…100) of the tower: towerCam(i, zoom = 1, sx, sy)
const towerCam = (i, zoom = 1, sx = 960, sy = 620) => { const p = i >= 100 ? TW_TOP : TW_FLOORS[clamp(Math.round(i), 1, 99) - 1]; return camAt(p.x, p.y, zoom, sx, sy); };

// ================================================================= 5. CUBE CITY WIDE — cityNight (under attack) / cityDay
// A panorama seen from a rooftop. Rows (back → front): sky (k 0) · moon / sun (k .02) · searchlights (k .3, night) ·
// far skyline (k .18) · LANDMARKS (k .3): the Battle Arena colosseum (x 120), Granny's GRANNY'S GOODIES INC. skyscraper with
// the neon cookie (x 1560), the OBBY TOWER spire with the crystal glow (x 1880) · floating islands (k .12, day) · the MID
// ROW of blocky buildings (k .5, base y 880) with a big EMPTY PLAZA in the middle (x 640…1280) = where the giant BLOCK KING
// stands (SPOTS.cityNight.boss, feet on the k .5 plane) · the FRONT ROW (k .75, framing buildings left + right) · the
// ROOFTOP LEDGE (k 1, stand line FLOOR 990, s .45; `ledge: false` hides it). Night = the attack: purple-red sky, fires,
// smoke, searchlights. `boss` = smash damage on the buildings around the plaza; `victory` = sky to dawn gold, fires out,
// friendly cube confetti.
// o: { time 'night' (default) | 'day' | 'sunset', boss 0..1, victory 0..1, ledge (default true), letters (the CUBE CITY
//      letter blocks on the plaza; day default true, night: knocked over), searchlights (default night), flash 0..1 }
const CN = { floor: 990, s: 0.45, ledge: 930, plaza: { x0: 640, x1: 1280, y: 880 }, boss: { x: 960, y: 900, k: 0.5 } };
const cnS = (y) => CN.s * (y - 420) / (CN.floor - 420);
// a blocky city building (origin = base centre). o: { lit 0..1, day, broken 0..1, seed, sign, roofCol, antenna }
function cityBuilding(x, base, w, h, col, tn, t, o = {}) {
  const seed = o.seed || 0, broken = o.broken || 0;
  const hh = h * (1 - 0.5 * broken);
  const x0 = x - w / 2, top = base - hh;
  let s = '';
  if (broken > 0.05) {
    let d = `M${f(x0)} ${f(base)} L${f(x0)} ${f(top + 30 * hash(seed))}`;
    const n = Math.max(3, Math.round(w / 40));
    for (let i = 1; i < n; i++) d += ` L${f(x0 + (w * i) / n)} ${f(top + (hash(seed + i * 1.7) - 0.3) * 70 * broken)}`;
    d += ` L${f(x0 + w)} ${f(top + 30 * hash(seed + 9))} L${f(x0 + w)} ${f(base)} Z`;
    s += P(d, tn.ol(col, 6)) + P(d, { fill: o.day ? 'url(#gsWinDay)' : 'url(#gsWinLit)', opacity: o.day ? 0.85 : op(o.lit ?? 1) });
  } else {
    s += R(x0, top, w, hh, 4, tn.ol(col, 6));
    s += R(x0 + 16, top + 26, w - 32, hh - 40, 0, { fill: o.day ? 'url(#gsWinDay)' : 'url(#gsWinLit)', opacity: o.day ? 0.85 : op(o.lit ?? 1) });
    const rc = o.roofCol || lt(col, 0.3);
    s += brick(x0 - 10, top - 4, w + 20, 18, 22, rc, tn, { lw: 5, studs: 40 });
    const kind = Math.floor(hash(seed * 3.3) * 4);
    if (kind === 0) s += R(x0 + w * 0.2, top - 90, 60, 66, 6, tn.ol('#C98A4E', 5)) + P(`M${f(x0 + w * 0.2 + 8)} ${top - 24} V${top + 4} M${f(x0 + w * 0.2 + 52)} ${top - 24} V${top + 4}`, tn.ln(5));
    else if (kind === 1) s += R(x + w * 0.1, top - 160, 10, 140, 3, tn.ol(C.slate, 4)) + CI(x + w * 0.1 + 5, top - 166, 9, tn.ol(o.day ? C.red : '!#FF4D5E', 3));
    else if (kind === 2) s += P(`M${f(x0 + 10)} ${f(top - 22)} L${f(x)} ${f(top - 22 - w * 0.35)} L${f(x0 + w - 10)} ${f(top - 22)} Z`, tn.ol(o.roofCol || C.red, 5));
    if (o.sign) s += G(R(-o.sign.length * 15 - 24, -34, o.sign.length * 30 + 48, 64, 12, tn.ol(o.signCol || C.pink, 5)) + T(o.sign, 0, 14, 38, tn.c(o.day ? '#FFFFFF' : '!#FFFFFF'), OUTX(5, tn.line)), tr(x, top + 70));
  }
  return s;
}
const CN_MID = [
  // [x, w, h, col, sign]
  [-760, 300, 340, '#B9C8FF', ''], [-430, 260, 420, '#FFC8B0', 'PETS'], [-120, 300, 300, '#B8F0D8', ''], [175, 260, 250, '#D8C2FF', 'OBBY'], [450, 250, 330, '#FFE0A0', 'PIZZA'],
  [1460, 250, 320, '#F6B6D6', 'SHOP'], [1730, 270, 250, '#A8E6FF', ''], [2040, 260, 400, '#FFC8B0', 'GAMES'], [2340, 300, 300, '#B9C8FF', ''], [2660, 280, 380, '#D8C2FF', 'PETS'],
];
const CN_FRONT = [[-380, 420, 620, '#8E7AD0'], [2300, 420, 640, '#7AC8A8'], [-900, 380, 560, '#E0A070'], [2800, 380, 600, '#8E7AD0']];
function cityLayers(t, cam, o) {
  const time = o.time || 'night', night = time === 'night' ? 1 : 0, day = !night;
  const boss = b01(o.boss), vic = b01(o.victory), atk = night * (1 - vic);
  const tw = { sunset: time === 'sunset' ? 0.85 : 0, night: night ? 0.55 * (1 - vic) : 0, raid: atk * 0.55, dawn: vic * 0.8 };
  const tn = tone(tw);
  const hazeCol = atk > 0.5 ? '#5A1E4A' : vic > 0.5 ? '#FFC8A0' : night ? '#2E2470' : time === 'sunset' ? '#FFB6A8' : '#D6F0FF';
  const tnF = tone({ ...tw, haze: 0.55, hazeCol }), tnL = tone({ ...tw, haze: 0.36, hazeCol }), tnM = tone({ ...tw, haze: 0.16, hazeCol });
  const fireK = atk * (0.55 + 0.45 * boss);
  // ---- sky
  const v0 = vis(cam, 0);
  const sky = skyFor(v0, { time }, { base: night ? 'gsSkyNight' : undefined, raid: atk * 0.9, dawn: vic });
  let sm_ = '';
  if (night) sm_ += G(moon(1640, 170, 80, tn), null, vic > 0 ? { opacity: op(1 - vic) } : undefined);
  else sm_ += time === 'sunset' ? sun(1500, 520, 80, t, '#FFD06A') : sun(1640, 150, 70, t);
  if (vic > 0) sm_ += G(sun(300, 760 - 380 * ease.out(vic), 90, t), null, { opacity: op(vic * 1.4) });
  // clouds / floating islands (day)
  const vc = vis(cam, 0.06);
  let cl = '';
  for (let i = Math.floor((vc.x0 - 500) / 700); i * 700 < vc.x1 + 500; i++) {
    const x = i * 700 + md(hash(i * 2.7) * 420 + t * 8, 700), y = 90 + 200 * hash(i * 9.3), s = 0.4 + 0.35 * hash(i * 5.5);
    if (atk > 0.5 && hash(i * 4.4) > 0.5) continue;
    cl += cubeCloud(x, y, s, tn, atk > 0.5 ? '#5A2A5A' : night ? '#4E4290' : vic > 0.5 ? '#FFE0C8' : '#FFFFFF', i);
  }
  const vi = vis(cam, 0.12);
  let isl = '';
  if (day || vic > 0.3) for (let i = Math.floor((vi.x0 - 600) / 800); i * 800 < vi.x1 + 600; i++) {
    const x = i * 800 + 260 * hash(i * 4.1), y = 300 + 120 * hash(i * 6.3), w = 180 + 100 * hash(i * 3.3);
    isl += grassPlot(x - w / 2, x + w / 2, y - 24, y, 22, tnF, i, { depth: w * 0.45, rows: 3, tex: false }) + miniBase(['dome', 'rocket', 'mushroom', 'farm', 'ship'][md(i, 5)], x, y - 14, 0.32, tnF, t, 0);
  }
  // ---- searchlights (k .3)
  let sl = '';
  if ((o.searchlights ?? night) && atk > 0) {
    for (let i = 0; i < 4; i++) {
      const bx = -200 + i * 760, a = -Math.PI / 2 + Math.sin(t * (0.5 + 0.13 * i) + i * 1.7) * 0.55, L_ = 1500;
      sl += P(dP([[bx - 14, 900], [bx + Math.cos(a - 0.07) * L_, 900 + Math.sin(a - 0.07) * L_], [bx + Math.cos(a + 0.07) * L_, 900 + Math.sin(a + 0.07) * L_], [bx + 14, 900]]), { fill: 'url(#gsSearch)', opacity: op(atk * 0.9) });
    }
  }
  // ---- far skyline (k .18)
  const vf = vis(cam, 0.18);
  const far = G(skyline((vf.x0 - 300) / 0.62, (vf.x1 + 300) / 0.62, 780, tnF, 13, { lit: night ? 0.95 : 0, hMin: 140, hVar: 300, lw: 6 }), 'translate(0 780) scale(0.62) translate(0 -780)') + R(vf.x0 - 300, 770, vf.x1 - vf.x0 + 600, 600, 0, tnF.fl('#9A8AC0'));
  // ---- landmarks (k .3)
  let lmk = '';
  lmk += farArena(330, 620, 1.05, tnL);
  lmk += farSkyscraper(1560, 760, 0.56, tnL, night);
  lmk += farTower(1840, 780, 0.5, tnL, t, night);
  if (boss > 0.2 && atk > 0) lmk += smoke(330, 470, 0.8, t, boss * atk * 0.7, 3, '#3A2040') + fire(260, 500, 0.6 * boss * atk, t, 4) + fire(1600, 300, 0.5 * boss * atk, t, 8);
  // ---- mid row (k .5) + the plaza where the boss stands
  const vm = vis(cam, 0.5);
  let mid = R(vm.x0 - 400, 860, vm.x1 - vm.x0 + 800, 700, 0, tnM.fl('#B9B0D8'));
  const PZc = CN.plaza;
  // plaza floor (lilac tiles) + broken / intact CUBE CITY letters
  mid += R(PZc.x0 - 40, 840, PZc.x1 - PZc.x0 + 80, 80, 10, tnM.ol('#E9DDFF', 5)) + R(PZc.x0 - 40, 840, PZc.x1 - PZc.x0 + 80, 80, 10, { fill: 'url(#gsTileFloor)' });
  const letters = o.letters ?? !night;
  if (letters) mid += letterSign('CUBE CITY', 960, 846, 56, tnM, t);
  else {
    'CUBECITY'.split('').forEach((ch, i) => { const x = PZc.x0 + 30 + i * 80 + 20 * hash(i), r = (hash(i * 3.1) - 0.5) * 120; mid += G(brick(-26, -22, 52, 44, 10, CANDY[i % 9], tnM, { lw: 4 }) + T(ch, 0, 14, 36, tnM.c('#FFFFFF'), OUTX(4, tnM.line)), `translate(${f(x)} ${f(870 + 20 * hash(i * 7))}) rotate(${f(r)})`); });
  }
  mid += fountain(PZc.x1 - 60, 880, 0.24, tnM, t, night);
  for (const [x, w, h, col, sign] of CN_MID) {
    if (x + w < vm.x0 - 300 || x - w > vm.x1 + 300) continue;
    const near = Math.abs(x - 960);
    const br = boss * atk * clamp(1.4 - near / 900, 0, 1);
    mid += cityBuilding(x, 880, w, h, col, tnM, t, { lit: night ? 1 : 0, day: !night, broken: br, seed: x, sign, signCol: CANDY[md(Math.round(x / 97), 9)] });
    if (br > 0.15) mid += rubble(x + (x < 960 ? 120 : -120), 880, 160, tnM, x, [col, lt(col, 0.3), '#8A93A6']);
  }
  let fires = '';
  if (fireK > 0) for (const [x, y, s] of [[-430, 460, 0.9], [175, 630, 1], [450, 550, 0.8], [1460, 560, 0.9], [2040, 480, 1], [-760, 540, 0.7], [1730, 630, 0.8]]) {
    if (x < vm.x0 - 300 || x > vm.x1 + 300) continue;
    const near = Math.abs(x - 960), yy = y + 0.5 * boss * clamp(1.4 - near / 900, 0, 1) * (880 - y);
    fires += (hash(x) > 0.45 ? smoke(x, yy - 20, 0.9, t, fireK * 0.6, x, '#3A2040') : '') + fire(x, yy, s * fireK, t, x);
  }
  // ---- front row (k .75)
  const vF = vis(cam, 0.75);
  let fr = '';
  for (const [x, w, h, col] of CN_FRONT) {
    if (x + w < vF.x0 - 300 || x - w > vF.x1 + 300) continue;
    fr += cityBuilding(x, 1100, w, h, col, tn, t, { lit: night ? 1 : 0, day: !night, seed: x * 1.3, broken: boss * atk * 0.25 * (hash(x) > 0.5 ? 1 : 0) });
  }
  if (fireK > 0) for (const [x, h] of [[-380, 620], [2300, 640]]) if (x > vF.x0 - 300 && x < vF.x1 + 300) fr += fire(x + 80, 1100 - h + 10, 0.9 * fireK, t, x);
  // ---- the rooftop ledge (k 1)
  const v1 = vis(cam, 1);
  let ledge = '';
  if (o.ledge !== false) {
    const X0 = v1.x0 - 300, X1 = v1.x1 + 300, top = CN.ledge;
    ledge += R(X0, top, X1 - X0, 700, 0, tn.ol('#6A6E9A', 6)) + R(X0, top, X1 - X0, 700, 0, { fill: 'url(#gsTileFloor)' });
    ledge += R(X0, top - 6, X1 - X0, 22, 0, { fill: '#000', opacity: 0.18 });
    // parapet blocks with studs along the front edge
    const B = brickBatch(tn, { lw: 6 });
    for (let x = Math.floor(X0 / 220) * 220; x < X1; x += 220) B.add(x, 1050, 220, 80, 24, md(x / 220, 2) ? '#8E92C0' : '#9A9ECC', 46);
    ledge += B.out();
    // props: AC unit, antenna, a vent
    for (const [x, kind] of [[-500, 0], [380, 1], [1700, 0], [2500, 2]]) {
      if (x < X0 - 300 || x > X1 + 300) continue;
      if (kind === 0) ledge += brick(x - 90, top - 110, 180, 110, 30, '#C9D3F2', tn, { lw: 6 }) + CI(x, top - 55, 40, tn.ol('#8A93A6', 5)) + P(`M${x - 30} ${top - 55} H${x + 30} M${x} ${top - 85} V${top - 25}`, tn.ln(5, '#5A6488'));
      else if (kind === 1) ledge += R(x - 8, top - 320, 16, 320, 4, tn.ol(C.slate, 5)) + P(`M${x - 60} ${top - 280} H${x + 60} M${x - 40} ${top - 230} H${x + 40}`, tn.ln(6, C.slate)) + CI(x, top - 326, 12, tn.ol(night ? '!#FF4D5E' : C.red, 4));
      else ledge += brick(x - 50, top - 80, 100, 80, 26, '#B9C6E6', tn, { lw: 5 }) + R(x - 34, top - 70, 68, 40, 6, tn.ol('#5A6488', 4));
    }
  }
  // ---- light: fire glow, red pulse, victory confetti
  let light = '';
  if (fireK > 0) light += V(cam, glow(960, 600, 700, 'gsGlowFire', 0.22 * fireK), 0.5) + R(0, 0, 1920, 1080, 0, { fill: '#FF2A3A', opacity: op(fireK * (0.05 + 0.025 * Math.sin(t * 3.4))) });
  if (vic > 0) {
    let cf = '';
    for (let i = 0; i < 40; i++) { const x = hash(i * 3.7) * 1920 + Math.sin(t * 2 + i) * 30, y = md(hash(i * 1.3) * 1200 + t * 220 * (0.6 + hash(i)), 1200) - 100, w = 18 + 10 * hash(i * 2.2); cf += `<rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(w)}" rx="4" fill="${CANDY[i % 9]}" stroke="${LINE}" stroke-width="3" transform="rotate(${f(t * 140 + i * 37)} ${f(x + w / 2)} ${f(y + w / 2)})"/>`; }
    light += G(cf, null, { opacity: op(clamp(vic * 2.5, 0, 1)) }) + R(0, 0, 1920, 1080, 0, { fill: '#FFC060', opacity: op(0.1 * vic) });
  }
  if (o.flash > 0) light += R(0, 0, 1920, 1080, 0, { fill: '#FFFFFF', opacity: op(o.flash) });
  const skyL = V(cam, sky, 0) + V(cam, sm_, 0.02) + V(cam, cl, 0.06) + V(cam, isl, 0.12) + V(cam, far, 0.18) + V(cam, sl, 0.3) + V(cam, lmk, 0.3), rowL = V(cam, mid + fires, 0.5);
  // extra keys: sky (everything behind the mid row) + row (the mid row + plaza) — draw a RISING boss between them
  return layersOf(skyL + rowL, V(cam, fr, 0.75) + V(cam, ledge, 1), '', '', light, { sky: skyL, row: rowL });
}
const cityNight = camSet((t, cam, o) => cityLayers(t, cam, { time: 'night', ...o }));
const cityDay = camSet((t, cam, o) => cityLayers(t, cam, { time: 'day', ...o }));

// ================================================================= 6. AVATAR SHOP (behind the avatar-editor UI)
// Room set (frame padded to x −900…2820). A pastel boutique: AVATAR SHOP neon sign, hat shelves (LEFT: top hat, cap, crown,
// propeller cap, cowboy hat, wizard hat, beanie, traffic cone, chef hat…), the costume rack (RIGHT: hangers with shirts, a
// tutu, wings) and the HOT DOG costume on a mannequin with a NEW! tag (far right, SPOTS.avatarShop.hotdog). CENTRE: the
// glowing podium where the avatar stands (SPOTS.avatarShop.podium, feet y 900, s .5) under a spotlight; the centre of the wall
// is kept calm for the editor UI panels. o: { time, spot 0..1 (spotlight, default 1), flash }
def(pat('gsShopFloor', 140, 70, '<rect width="140" height="70" fill="#FFE3F0"/><rect width="70" height="35" fill="#FFFFFF"/><rect x="70" y="35" width="70" height="35" fill="#FFFFFF"/>'));
const SH = { floor: 900, podium: { x: 960, y: 900 } };
function hatIcon(kind, x, y, s, tn) {
  let o = '';
  switch (kind) {
    case 'top': o = R(-34, -90, 68, 80, 6, tn.ol('#2E3550', 5)) + R(-56, -14, 112, 16, 6, tn.ol('#2E3550', 5)) + R(-34, -40, 68, 14, 0, tn.fl(C.red)); break;
    case 'cap': o = P('M-50 0 Q-50 -64 0 -64 Q50 -64 50 0 Z', tn.ol(C.blue, 5)) + P('M40 -6 L96 -2 L92 8 L40 6 Z', tn.ol(C.blue, 5)); break;
    case 'crown': o = P('M-50 0 L-50 -50 L-26 -24 L0 -66 L26 -24 L50 -50 L50 0 Z', tn.ol(C.gold, 5)) + CI(0, -16, 9, tn.ol(C.red, 3)); break;
    case 'prop': o = P('M-48 0 Q-48 -56 0 -56 Q48 -56 48 0 Z', tn.ol(C.yellow, 5)) + R(-4, -78, 8, 24, 2, tn.ol(LINE, 2)) + P('M-50 -80 Q0 -96 0 -80 Q0 -64 50 -80 Q0 -96 0 -80', tn.ol(C.red, 4)); break;
    case 'cowboy': o = P('M-80 -6 Q0 14 80 -6 L60 -16 Q0 -2 -60 -16 Z', tn.ol(C.woodD, 5)) + P('M-40 -14 L-34 -64 Q0 -50 34 -64 L40 -14 Z', tn.ol(C.wood, 5)); break;
    case 'wizard': o = P('M-56 0 L0 -130 L56 0 Z', tn.ol(C.purple, 5)) + P('M-14 -60 l4 -10 l4 10 l10 2 l-8 6 l2 10 l-8 -6 l-8 6 l2 -10 l-8 -6 Z', tn.fl(C.yellow)); break;
    case 'beanie': o = P('M-46 0 Q-46 -64 0 -64 Q46 -64 46 0 Z', tn.ol(C.mint, 5)) + CI(0, -68, 14, tn.ol('#FFFFFF', 4)) + R(-48, -14, 96, 16, 4, tn.ol(lt(C.mint, 0.3), 4)); break;
    case 'cone': o = P('M-30 0 L0 -110 L30 0 Z', tn.ol(C.orange, 5)) + P('M-20 -36 H20 M-12 -66 H12', tn.ln(10, '#FFFFFF')) + R(-50, -8, 100, 14, 4, tn.ol(C.orange, 5)); break;
    default: o = R(-36, -40, 72, 40, 10, tn.ol('#FFFFFF', 5)) + P(dC(-24, -56, 22) + dC(0, -68, 26) + dC(24, -56, 22), tn.ol('#FFFFFF', 5));
  }
  return G(o, tr(x, y, s));
}
function shopLayers(t, o) {
  const tn = tone(timeTone(o));
  const XL = -900, XR = 2820, YT = -700, YB = 1800, W = XR - XL;
  const bg = R(XL, YT, W, YB - YT, 0, tn.fl('#EAD8FF'));
  let m = R(XL, YT, W, 760 - YT, 0, tn.fl('#E3CCFF')) + R(XL, YT, W, 760 - YT, 0, { fill: 'url(#gsPolka)' });
  m += R(XL, 700, W, 60, 0, tn.ol('#C9A8F0', 5)) + R(XL, 760, W, YB - 760, 0, { fill: 'url(#gsShopFloor)' }) + R(XL, 760, W, 30, 0, { fill: '#000', opacity: 0.1 });
  // neon sign
  m += G(R(-330, -70, 660, 130, 30, tn.ol('#2E2458', 8)) + T('AVATAR SHOP', 0, 30, 84, tn.c('!#FF8FD8'), OUTX(6, '#7A2A6A')) + P('M-300 -96 q20 -40 40 0', tn.ln(6, C.slate)), tr(960, 110));
  // hat shelves (left)
  const kinds = ['top', 'cap', 'crown', 'prop', 'cowboy', 'wizard', 'beanie', 'cone', 'chef'];
  for (let r = 0; r < 3; r++) {
    const y = 260 + r * 170;
    m += R(40, y, 600, 22, 6, tn.ol('#C98A4E', 5)) + P(`M80 ${y + 22} l20 30 M600 ${y + 22} l-20 30`, tn.ln(6, C.woodD));
    for (let i = 0; i < 3; i++) { const k = kinds[r * 3 + i]; m += hatIcon(k, 140 + i * 200, y, 1, tn) + G(R(-34, 0, 68, 26, 6, tn.ol('#FFE14D', 3)) + TF(String([25, 10, 999, 15, 40, 75, 5, 1, 30][r * 3 + i]), 0, 20, 18, tn.c('#151515')), tr(140 + i * 200 + 40, y + 34)); }
  }
  // costume rack (right)
  m += R(1300, 330, 560, 14, 6, tn.ol('#8A93A6', 5)) + P('M1320 344 V760 M1840 344 V760 M1300 760 H1360 M1800 760 H1860', tn.ln(10, '#8A93A6'));
  const outfits = [[C.red, 'shirt'], [C.sky, 'shirt'], ['#FF8FC8', 'tutu'], [C.lime, 'shirt'], ['#FFFFFF', 'wings'], [C.purple, 'shirt']];
  outfits.forEach(([col, k], i) => {
    const x = 1360 + i * 84 + Math.sin(t * 1.5 + i) * 2;
    let c = P(`M${x} 344 q0 -20 12 -20 M${x - 34} 380 L${x} 352 L${x + 34} 380`, tn.ln(4, '#5A6488'));
    if (k === 'shirt') c += P(`M${x - 40} 380 L${x + 40} 380 L${x + 52} 430 L${x + 34} 436 L${x + 30} 520 L${x - 30} 520 L${x - 34} 436 L${x - 52} 430 Z`, tn.ol(col, 4));
    else if (k === 'tutu') c += P(`M${x - 30} 380 H${x + 30} L${x + 60} 470 Q${x} 490 ${x - 60} 470 Z`, tn.ol(col, 4)) + P(`M${x - 50} 470 l10 -20 l10 20 l10 -20 l10 20 l10 -20 l10 20 l10 -20 l10 20`, tn.ln(3, '#FFFFFF'));
    else c += P(`M${x} 400 Q${x - 80} 360 ${x - 70} 470 Q${x - 30} 450 ${x} 420 Q${x + 30} 450 ${x + 70} 470 Q${x + 80} 360 ${x} 400 Z`, tn.ol(col, 4));
    m += c;
  });
  // the HOT DOG costume on a mannequin (+ NEW! tag)
  const hx = 2140;
  m += R(hx - 8, 600, 16, 160, 4, tn.ol('#8A93A6', 4)) + E(hx, 764, 70, 14, tn.ol('#8A93A6', 4));
  m += R(hx - 90, 230, 180, 380, 90, tn.ol('#E8A24A', 6)) + R(hx - 60, 250, 120, 340, 60, tn.ol('#C8452A', 6)) + P(`M${hx - 40} 280 q20 20 0 40 q-20 20 0 40 q20 20 0 40 q-20 20 0 40 q20 20 0 40`, tn.ln(10, '#FFD23F'));
  m += G(R(-60, -26, 120, 52, 12, tn.ol(C.red, 5)) + T('NEW!', 0, 16, 36, tn.c('#FFFFFF')), tr(hx + 110, 250, 1, 12));
  // mirror (left of centre)
  m += R(700, 300, 150, 380, 70, tn.ol('#FFC83A', 8)) + R(712, 312, 126, 356, 60, tn.fl('#CFF4FF')) + P('M740 360 l40 -30 M740 420 l70 -54', tn.ln(8, '#FFFFFF', 0.8));
  // podium
  const PD = SH.podium;
  m += E(PD.x, PD.y + 26, 250, 52, tn.ol('#B98CFF', 6)) + E(PD.x, PD.y, 250, 52, tn.ol('#E8DAFF', 6)) + E(PD.x, PD.y, 190, 36, { fill: 'none', stroke: tn.c('!#7FF6FF'), 'stroke-width': 8, opacity: op(0.6 + 0.3 * Math.sin(t * 3)) });
  let light = '';
  const sp = b01(o.spot, 1);
  if (sp > 0) light += P(`M${PD.x - 120} -100 L${PD.x + 120} -100 L${PD.x + 280} ${PD.y} L${PD.x - 280} ${PD.y} Z`, { fill: 'url(#gsBeam)', opacity: op(0.5 * sp) }) + E(PD.x, PD.y, 260, 56, { fill: '#FFFFFF', opacity: op(0.18 * sp) });
  if (o.flash > 0) light += R(XL, YT, W, YB - YT, 0, { fill: '#FFFFFF', opacity: op(o.flash) });
  return { bg, mid: m, front: '', fg: '', light };
}
const avatarShop = roomSet(shopLayers);

// ================================================================= floor lines + anchors
// (all anchors are k 1 unless they say otherwise; `s` = the scale of a hero-sized character standing there)
const rs = (v) => Math.round(v * 1000) / 1000;
const line = (y, sAt, x0, x1, gaps = [], hor = 420) => ({ y, k: 1, s: rs(sAt(y)), x0, x1, gaps, hor });
const FLOOR = {
  plaza: PZ.floor, arena: AR.floor, tycoon: TY.floor, castleInterior: CI_.floor, factoryInterior: FI.floor,
  tower: TW.floor, cityNight: CN.floor, cityDay: CN.floor, avatarShop: SH.floor,
};
const PZ_TOP = PZ.top - 16;      // feet line on top of the raised obby blocks (wall / platforms / finish)
const SPOTS = {
  plaza: {
    s: PZ.s, k: 1, floor: PZ.floor, sAt: pzS, worldX: [-3400, 6400],
    pads: PZ.pads.map((x, i) => ({ x, y: PZ.padY, s: rs(pzS(PZ.padY)), k: 1, i })),
    wall: { x0: PZ.wall.x0, x1: PZ.wall.x1, top: PZ.wall.top, y: PZ.floor, k: 1, dad: { x: PZ.wall.x0 - 62, y: PZ.floor, s: PZ.s, k: 1, view: 'side', flip: true } },
    start: { x: (PZ.wall.x0 + PZ.wall.x1) / 2, x0: PZ.wall.x0, x1: PZ.wall.x1, y: PZ_TOP, s: PZ.s, k: 1, edge: PZ.wall.x1 },
    platforms: PZ.plats.map((p, i) => ({ i, x: (p.x0 + p.x1) / 2, x0: p.x0, x1: p.x1, y: PZ_TOP, s: PZ.s, k: 1 })),
    gap: { x0: PZ.wall.x1, x1: PZ.plats[0].x0, mid: (PZ.wall.x1 + PZ.plats[0].x0) / 2, y: PZ_TOP, k: 1 },
    water: { x0: PZ.water.x0, x1: PZ.water.x1, y: PZ.water.y, k: 1, splash: { x: (PZ.wall.x1 + PZ.plats[0].x0) / 2, y: PZ.water.y } },
    finish: { x0: PZ.finish.x0, x1: PZ.finish.x1, y: PZ_TOP, s: PZ.s, k: 1, checkpoint: { x: PZ.finish.x0 + 300, y: PZ_TOP } },
    crate: { x: PZ.crate.x, y: PZ.crate.y - PZ.crate.h - 18, base: PZ.crate.y, s: rs(pzS(PZ.crate.y)), k: 1, w: PZ.crate.w },
    tree: { x: PZ.tree.x, y: PZ.tree.y, k: 1, hide: { x: PZ.tree.x, y: 962, s: rs(pzS(962)), k: 1 }, peekL: { x: PZ.tree.x - 110, y: 962, s: rs(pzS(962)), k: 1 }, peekR: { x: PZ.tree.x + 110, y: 962, s: rs(pzS(962)), k: 1 } },
    bleachers: [0, 1, 2].map((j) => ({ j, y: PZ.bleach.base - 60 - j * 90 - 15, x0: PZ.bleach.x0 + j * 18 + 30, x1: PZ.bleach.x1 - j * 18 - 30, s: rs(pzS(PZ.bleach.base - j * 30)), k: 1 })),
    fountain: { x: PZ.fountain.x, y: PZ.fountain.y, k: 1, rimY: PZ.fountain.y - 100, s: rs(pzS(PZ.fountain.y)) },
    signpost: { x: PZ.sign.x, y: PZ.sign.y, k: 1 },
    sign: { x: 600, y: 270, k: 0.5 },
    billboard: { x: 1860, y: 250, w: 520, h: 290, k: 0.6 },
    portals: [{ name: 'ARENA', x: -640, y: 612, k: 0.8 }, { name: 'TYCOON VALLEY', x: 2560, y: 612, k: 0.8 }, { name: 'OBBY TOWER', x: 3700, y: 612, k: 0.8 }],
    lines: [
      line(700, pzS, -2600, 2560, [[1150, 1610]]), line(780, pzS, -2600, 2560, [[1150, 1610], [1700, 2200]]), line(860, pzS, -2600, 2560),
      line(940, pzS, -2600, 2560), line(1030, pzS, -2600, 2560),
    ],
    cams: {
      spawn: { x: -40, y: 0, zoom: 1 }, wide: { x: 900, y: -140, zoom: 0.62 }, fountain: camAt(1380, 600, 1), crate: camAt(2200, 620, 1),
      wall: camAt(2520, 640, 1.15), gap: camAt(3000, 660, 1.35), obby: camAt(3420, 600, 0.82), tree: camAt(-620, 650, 1.1),
      sign: { x: -360, y: -300, zoom: 1 }, billboard: { x: 1500, y: -483, zoom: 1 }, finish: camAt(4400, 600, 1),
    },
  },
  arena: {
    s: AR.s, k: 1, floor: AR.floor, sAt: arS,
    ring: { bx0: AR.bx0, bx1: AR.bx1, back: AR.back, fx0: AR.fx0, fx1: AR.fx1, front: AR.front, cx: 960, at: arEdge },
    edge: { L: { x: Math.round(arEdge(AR.floor).x0), y: AR.floor, k: 1 }, R: { x: Math.round(arEdge(AR.floor).x1), y: AR.floor, k: 1 } },
    exit: { x: 1560, y: 70, k: 0.7 },
    center: { x: 960, y: 880, s: rs(arS(880)), k: 1 },
    duel: [{ x: 640, y: AR.floor, s: AR.s, k: 1 }, { x: 1280, y: AR.floor, s: AR.s, k: 1 }],
    board: { ...AR_BOARD },
    gate: { x: 960, y: 700, k: 0.8 },
    stands: Array.from({ length: AR_TIERS }, (_, j) => ({ j, y: AR_TY(j) - 34, s: rs(0.2 - j * 0.014), k: 0.7, curve: AR_CURVE, yAt: (x) => AR_TY(j) - 34 + arArc(x) })),
    lines: [760, 830, 900, 980].map((y) => { const e = arEdge(y); return line(y, arS, Math.round(e.x0 + 60), Math.round(e.x1 - 60), [], AR.hor); }),
    cams: { ring: { x: 0, y: 0, zoom: 1 }, wide: { x: 0, y: -60, zoom: 0.8 }, duel: camAt(960, 640, 1.25), board: { x: 0, y: -244, zoom: 1.6 }, stands: { x: -500, y: -420, zoom: 1.7 }, edgeL: camAt(200, 640, 1.3), sky: { x: 300, y: -500, zoom: 1 } },
  },
  tycoon: {
    s: TY.s, k: 1, floor: TY.floor, sAt: tyS,
    plots: TY.plots.map(([x0, x1]) => ({ x0, x1, back: TY.back, front: TY.front })),
    castle: {
      x: TY.castle.x, base: TY.castle.base, k: 1,
      roof: { x: TY.castle.x, y: TY.castle.base - 450, s: rs(tyS(TY.castle.base)), k: 1 },
      gate: { x: TY.castle.x, y: TY.castle.base, k: 1 }, front: { x: TY.castle.x, y: TY.floor, s: TY.s, k: 1 },
      sold: { x: TY.castle.x, y: TY.castle.base - 196, k: 1 }, trophyWindow: { x: TY.castle.x, y0: TY.castle.base - 485, y1: TY.castle.base - 275, k: 1 },
      lava: { ...TY.lava, x: (TY.lava.x0 + TY.lava.x1) / 2, y: (TY.lava.y0 + TY.lava.y1) / 2, k: 1 },
    },
    granny: {
      x: TY.granny.x, base: TY.granny.base, k: 1,
      stand: { x: TY.stand.x, y: TY.stand.y, s: rs(tyS(TY.stand.y)), k: 1, counterTop: TY.stand.top },
      front: { x: TY.granny.x, y: TY.floor, s: TY.s, k: 1 },
      belt: { x0: TY.granny.x - 360, x1: TY.granny.x + 380, y: 854, k: 1, workers: [-260, -60, 140, 320].map((dx) => ({ x: TY.granny.x + dx, y: 836, s: rs(tyS(836)), k: 1 })) },
      skyscraper: { x: TY.granny.x, top: -2630, cookie: { x: TY.granny.x, y: -2630, k: 1 } },
      billboard: { x: 2130, y: 150, w: 900, h: 470, k: 1, portrait: { x: 1900, y: 150, w: 380, h: 410 } },
    },
    lines: [860, 930, 975].map((y) => line(y, tyS, -2650, 3450, [[-1650, -1350], [560, 820], [2220, 2480]])),
    cams: {
      castle: camAt(-330, 520, 0.85), roof: camAt(-330, 230, 1.7), gate: camAt(-330, 700, 1.3), lava: camAt(-900, 760, 1.5), trophyWindow: camAt(-330, 400, 2.2),
      stand: camAt(1520, 690, 1.2), granny: camAt(1400, 560, 0.8), factory: camAt(1520, 470, 0.72), skyscraper: camAt(1650, -1000, 0.28),
      top: camAt(1520, -2500, 0.9), billboard: camAt(2130, 160, 0.95), valley: { x: 400, y: -200, zoom: 0.45 },
    },
  },
  castleInterior: {
    s: 0.5, floor: CI_.floor,
    lava: { ...CI_.lava, x: (CI_.lava.x0 + CI_.lava.x1) / 2, y: CI_.lava.y0 + 20, board: { x: CI_.lava.x1 - 120, y: CI_.lava.y0 - 82 } },
    trophies: { ...CI_.trophy, cup: { x: 1080, y: 420 } },
    throne: { x: CI_.throne.x, seat: 640, s: 0.5, y: 640 + 153, sit: { legL: 90, legR: 90, kneeL: 90, kneeR: 90 } },
    spots: { lava: { x: 560, y: CI_.floor, s: 0.5 }, trophies: { x: 1300, y: CI_.floor, s: 0.5 }, throne: { x: 1800, y: CI_.floor, s: 0.5 } },
    cams: { wide: { x: 400, y: -100, zoom: 0.62 }, lava: camAt(-110, 640, 1.1), trophies: camAt(1080, 420, 1), throne: camAt(2200, 560, 1.15), tag: camAt(2350, 420, 2) },
  },
  factoryInterior: {
    s: 0.5, floor: FI.floor, belt: { ...FI.belt },
    workers: [200, 560, 1000, 1360, 1760, 2160].map((x) => ({ x, y: FI.workerY, s: 0.45 })),
    employee: { ...FI.emp }, pose: { x: 1300, y: FI.floor, s: 0.5 },
    ovens: [{ x: -560, y: 560 }, { x: 10, y: 560 }], hopper: { x: 3050, y: 430 },
    cams: { wide: { x: 0, y: -100, zoom: 0.62 }, belt: camAt(900, 640, 1.2), employee: camAt(1560, 330, 1.6), ovens: camAt(-280, 520, 1), noodle: camAt(1420, 560, 1.15) },
  },
  tower: {
    s: TW.s, k: 1, floor: TW.floor, sAt: twS, lavaY: TW.lava, spire: { x0: TW.cx - TW.spW / 2, x1: TW.cx + TW.spW / 2 },
    base: { x: 560, y: TW.floor, s: TW.s, k: 1 },
    plateau: { ...TW.plateau },
    boss: { x: -1750, y: 830, k: 1, note: 'giant: ~3x the hero at that depth (rig s ≈ 0.9–1.1)' },
    floors: TW_FLOORS.map((p) => ({ i: p.i, x: p.x, x0: p.x0, x1: p.x1, y: p.y - 15, k: 1, s: 0.3, cp: p.cp, ice: p.ice })),
    top: { i: 100, x: TW_TOP.x, x0: TW_TOP.x0, x1: TW_TOP.x1, y: TW_TOP.y - 22, k: 1, s: 0.3 },
    crystal: { x: TW_TOP.x, y: TW_TOP.y - 125, k: 1 },
    finalGap: { x0: TW_FLOORS[98].x1, x1: TW_TOP.x0, mid: (TW_FLOORS[98].x1 + TW_TOP.x0) / 2, y: TW_FLOORS[98].y - 15, k: 1, edge: { x: TW_TOP.x0, y: TW_TOP.y - 30, k: 1 } },
    lines: [850, 910, 960, 1000].map((y) => line(y, twS, -2700, 650)),
    cams: { base: camAt(700, 600, 1), battle: camAt(-900, 470, 0.6), climb: { x: 600, y: -1100, zoom: 0.35 }, full: { x: 600, y: -10000, zoom: 0.048 }, finalGap: towerCam(99, 0.6, 520), top: towerCam(100, 0.8), moon: towerCam(99, 0.55, 1250) },
    camFor: towerCam,
  },
  cityNight: {
    s: CN.s, k: 1, floor: CN.floor, sAt: cnS,
    boss: { ...CN.boss, note: 'feet on the k .5 plaza; ~900–1100 px tall fills the sky at cam zoom 1' },
    plaza: { ...CN.plaza, k: 0.5 },
    landmarks: { arena: { x: 330, y: 560, k: 0.3 }, skyscraper: { x: 1560, y: -35, k: 0.3 }, tower: { x: 1840, y: -25, k: 0.3 } },
    lines: [line(950, cnS, -2000, 4000), line(990, cnS, -2000, 4000)],
    roofs: CN_MID.map(([x, w, h]) => ({ x, y: 880 - h - 26, k: 0.5, s: 0.13 })),
    cams: { wide: { x: 0, y: 0, zoom: 1 }, high: { x: 0, y: -220, zoom: 0.8 }, bossUp: { x: 0, y: -700, zoom: 1 }, ledge: camAt(960, 700, 1.3), low: { x: 0, y: 120, zoom: 1.15 } },
  },
  avatarShop: {
    s: 0.5, floor: SH.floor, podium: { ...SH.podium, s: 0.5 }, hotdog: { x: 2140, y: 760 }, mirror: { x: 775, y: 490 }, hats: { x0: 40, x1: 640, y0: 180, y1: 600 },
    cams: { wide: { x: 0, y: 0, zoom: 1 }, podium: camAt(960, 640, 1.4), rack: camAt(1600, 500, 1.3), hotdog: camAt(2140, 450, 1.6), hats: camAt(340, 400, 1.5) },
  },
};
SPOTS.cityDay = SPOTS.cityNight;

module.exports = {
  plaza, arena, tycoon, castleInterior, factoryInterior, tower, cityNight, cityDay, avatarShop,
  FLOOR, SPOTS, DEFS: `<defs>${DEF.join('')}</defs>`,
  // props
  brick, brickBatch, studsD, cubeCloud, cubeTree, hedgeRow, cubeLamp, signBoard, signText, grassPlot, islandBottom, fire, smoke, rubble, crowd,
  spawnPad, letterSign, portalArch, gameIcon, fountain, crate, cubeWeed, obbyFlag, checkpointPad, moon, sun, torch, banner, castle, soldSign,
  grannyBillboard, grannyPortrait, miniBase, throneChair, cityBuilding, hatIcon, skyline, popBits,
  // helpers
  camTf, vis, toScreen, camAt, towerCam, placeCrowd, tone, timeTone, mix, glow, C, CANDY,
};
