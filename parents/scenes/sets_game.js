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
      : [[-200, -400, 190, 200], [10, -410, 190, 210], [-130, -560, 260, 190]];
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
    const k = 1 - (j + 0.5) / rows, w = W * (0.18 + 0.82 * Math.pow(k, 1.25)), cx = (x0 + x1) / 2 + (hash(seed + j * 1.7) - 0.5) * W * 0.16 * (j / rows);
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
      const y = row.y + (h(2.7) - 0.5) * 14 * s - bob;
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
      add(B.shirt, shirt, dRR(x - 150 * s, y, 300 * s, 230 * s, 20 * s));
      add(B.skin, skin, dRR(hx_ - hw / 2, y - hh - 8 * s, hw, hh, 26 * s));
      const hk = Math.floor(h(13.7) * 5), ht = y - hh - 8 * s;
      if (hk === 0) add(B.hair, CROWD_HAIR[Math.floor(h(7.7) * CROWD_HAIR.length)], dRR(hx_ - hw / 2 - 6 * s, ht - 26 * s, hw + 12 * s, 66 * s, 14 * s));
      else if (hk === 1) add(B.hat, CANDY[Math.floor(h(8.3) * CANDY.length)], dRR(hx_ - hw / 2 - 4 * s, ht - 30 * s, hw + 8 * s, 56 * s, 10 * s) + dR(hx_ - hw / 2 - 4 * s, ht + 14 * s, hw + 60 * s, 18 * s));
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
// o: { time 'day'|'sunset'|'night', pads [0..1 ×4] (spawn flash per pad), billboard svg|fn(w,h), skyscraper (Granny's tower
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
  if (vb.x1 > 1100 && vb.x0 < 2600) bb += billboardFrame(1860, 250, 520, 290, tnM, t, o.billboard, night);
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

// ================================================================= floor lines + anchors
const FLOOR = {
  plaza: PZ.floor,
};
const SPOTS = {
  plaza: {
    s: PZ.s, k: 1, floor: PZ.floor, sAt: pzS, worldX: [-3400, 6400],
    pads: PZ.pads.map((x, i) => ({ x, y: PZ.padY, s: +pzS(PZ.padY).toFixed(3), k: 1, i })),
    wall: { x0: PZ.wall.x0, x1: PZ.wall.x1, top: PZ.wall.top, y: PZ.floor, k: 1, dad: { x: PZ.wall.x0 - 70, y: PZ.floor, s: PZ.s, k: 1 } },
    cams: { wide: { x: 800, y: -120, zoom: 0.7 } },
  },
};

module.exports = {
  plaza,
  FLOOR, SPOTS, DEFS: `<defs>${DEF.join('')}</defs>`,
  // props
  brick, brickBatch, cubeCloud, cubeTree, hedgeRow, cubeLamp, signBoard, signText, grassPlot, islandBottom, fire, smoke, rubble, crowd,
  spawnPad, letterSign, portalArch, gameIcon, fountain, crate, cubeWeed, obbyFlag, checkpointPad, moon, sun,
  // helpers
  camTf, vis, toScreen, camAt, placeCrowd, tone, timeTone, mix, glow, C, CANDY,
};
