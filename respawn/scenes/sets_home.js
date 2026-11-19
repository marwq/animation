// Shared HOME + TOWN background sets for "What If You Could RESPAWN in Real Life?".   Reference: docs/SETS_HOME.md
//
// Every set is drawn in WORLD SPACE for the full 1920x1080 frame (camera at rest = the frame) and is padded far past
// the frame edges, so camera moves / zoom-outs never show a gap. `t` = absolute seconds, only used for idle motion
// (curtains, rain, steam, string lights, clouds). Static gradients/patterns live in DEFS (ids `sh*`; main.js loads it).
//
// ROOM sets (fixed world, you apply the camera):  set(t, o) -> svg of all layers;  set.layers(t, o) -> { bg, mid, front, fg, light }
//   bg    — what is seen through windows / doors (sky, yard, street)    draw with view(cam, bg, 0.6..0.85)
//   mid   — the room itself: walls, floor, furniture backs              draw with view(cam, mid, 1)
//   front — furniture FRONTS (blanket, gaming chair back, kitchen island, table, rehearsal table). Draw it AFTER the
//           characters behind/inside that furniture (sleeping, seated, Dad behind the island) and BEFORE the characters
//           standing on the FLOOR line.
//   fg    — occluders close to the camera (may be '')                   draw with view(cam, fg, 1.15..1.3)
//   light — night / glow / flash overlays (may be '')                   draw LAST with view(cam, light, 1)
// CAMERA sets (street, town, obbyWorld): set(t, cam, o) -> svg; set.layers(t, cam, o) -> { bg, mid, fg, light } ALREADY
//   transformed by cam ({ zoom, x, y, fx, fy, sx, sy } as from K.camKeys / K.shake). Every sub-layer has its own parallax k.
//   Anchors carry k: draw things on them with K.view(cam, svg, a.k) between L.mid and L.fg; toScreen(cam, a) -> screen point.
// FLOOR[set] = the stand line (characters' feet y) in the default framing; SPOTS[set] = anchors.
// Screens take an svg centred on (0,0) of the screen box, or fn(w, h) => svg (e.g. gameScreen(t, {...})).
//
// Index (details in the comment above each function):
//   heroRoom(t, o)   YOUR attic bedroom. o: time 'morning'|'day'|'night', clock '7:30', monitor (svg|fn), monitorGlow, storm,
//                    flash, greenGlow, redBlink, door 0..1, sleep, chair, chairX, mess 0..1, blind 0..1, lights 0..1, lamp,
//                    headphones, lowGfx, glitch. + .layers (front = blanket + gaming chair)
//   deskClose(t, o)  close framing of the desk: big monitor + keyboard + hands area + Gary's bowl spot (same light opts)
//   deskFace(t, o)   reverse shot from the monitor: the hero in his gaming chair lit by the screen (light opts + glow colour,
//                    glowK, flicker). front = desk edge + keyboard
//   stairs(t, o)     side view, upstairs landing -> 12 steps -> downstairs hallway. o: time, skate, heroDoor, lowGfx, glitch
//   kitchen(t, o)    sunny family kitchen (Dad behind the island, table in front). o: time 'morning'|'evening', meal,
//                    panCake, stack, steam, coat, birds, frozen + freezeAt, lowGfx, glitch, clock
//   workshop(t, o)   Ivy's garage lab. o: time 'day'|'evening', soot, boom, poster, quiet, days, door 0..1, lowGfx
//   gameScreen(t, o) -> fn(w, h): MEGA OBBY: 1000 STAGES. o: stage, falls, respawns, jump, fall, respawn, win, lava, hud
//   obbyWorld(t, cam, o)  full-frame "inside the game" course over lava. o: stage, lava, win, flag
//   street(t, cam, o)     the family's street (house, trampoline, picket fence, power lines, bus stop corner, hill).
//                    o: time 'morning'|'day'|'sunset', lowGfx, frozen, freezeAt, red, dog, bus, birds, leaves, checkpoint
//   town(t, cam, o)  wide town (water tower, school, rows of roofs, park, main street). o: time 'day'|'sunset'|'golden'|
//                    'night', red, crack, frozen, freezeAt, lowGfx, gray, colorBack, colorFrom, colorTime, bus
//   props: skateboard, pancake, schoolBus, streetDog, bird, wallClock, cloud, tree, pine, famHouse, suburbHouse, trampoline,
//          willowbrook, shopFront, lampPost, miniAvatar, obbyPlat
//   helpers: toScreen, camTf, vis, mix, tone, frameIn, glow, pool, darkRing, redSky, lowPop, makeSet
'use strict';

const S = require('../rig/svg');
const { f, clamp, lerp, ease } = S;

const LINE = '#151515';
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const R = (x, y, w, h, r = 0, a = {}) => S.rect(f(x), f(y), f(Math.max(0, w)), f(Math.max(0, h)), r, a);
const P = (d, a = {}) => (d ? S.path(d, a) : '');
const E = (cx, cy, rx, ry, a = {}) => S.ellipse(f(cx), f(cy), f(rx), f(ry), a);
const CI = (cx, cy, r, a = {}) => S.circle(f(cx), f(cy), f(r), a);
const G = (inner, tf, extra) => (inner ? S.g(inner, tf, extra) : '');
const T = (s, x, y, size, fill, extra = {}) => S.el('text', { x: f(x), y: f(y), 'font-family': 'Lilita One, sans-serif', 'font-size': size, fill, 'text-anchor': 'middle', ...extra }, esc(s));
const TF = (s, x, y, size, fill, extra = {}) => S.el('text', { x: f(x), y: f(y), 'font-family': 'Fredoka, sans-serif', 'font-weight': 700, 'font-size': size, fill, 'text-anchor': 'middle', ...extra }, esc(s));
const OUTX = (w = 8, col = LINE) => ({ stroke: col, 'stroke-width': w, 'paint-order': 'stroke', 'stroke-linejoin': 'round' });
const hash = (n) => { const v = Math.sin(n * 127.1 + 311.7) * 43758.5453; return v - Math.floor(v); };
const md = (a, n) => ((a % n) + n) % n;
const sm = (a, b, v) => { const u = clamp((v - a) / (b - a), 0, 1); return u * u * (3 - 2 * u); };
const b01 = (v, d = 0) => (v === true ? 1 : v === false || v === undefined || v === null ? d : clamp(+v, 0, 1));
const tr = (x, y, s = 1, r = 0) => `translate(${f(x)} ${f(y)})${r ? ` rotate(${f(r)})` : ''}${s !== 1 ? ` scale(${f(s)})` : ''}`;

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

// padded full-cover bounds for ROOM sets (camera zoom-outs to ~0.55 and pans never show the edge)
const XL = -900, XR = 2820, YT = -700, YB = 1800;
const cover = (a) => R(XL, YT, XR - XL, YB - YT, 0, a);
const band = (y0, y1, a) => R(XL, y0, XR - XL, y1 - y0, 0, a);

// ---------------------------------------------------------------- colour
const hx = (c) => [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)];
const toHex = (a) => '#' + a.map((v) => Math.round(clamp(v, 0, 255)).toString(16).padStart(2, '0')).join('').toUpperCase();
function mix(a, b, k) {
  if (k <= 0) return a;
  if (k >= 1) return b;
  const A = hx(a), B = hx(b);
  return toHex(A.map((v, i) => lerp(v, B[i], k)));
}
// tone(o) -> a colour transformer + outline helpers for one frame of one set. Every fill in this file goes through it, so
// one set can be shown at night, in the evening, in "2006 low graphics", drained of colour or tinted by the red alarm sky.
//   o: { morn, eve, night, dim, low, gray, red } all 0..1.
//   tn.c(col) colour · tn.ol(fill, w) outlined fill · tn.ln(w, col, op) stroke only · tn.fl(col, op) fill only ·
//   tn.detail = 1 - low (fade texture/detail groups with it) · tn.lw outline width factor
function tone(o = {}) {
  const morn = o.morn || 0, eve = o.eve || 0, night = o.night || 0, dim = o.dim || 0, low = o.low || 0, gray = o.gray || 0, red = o.red || 0;
  const any = morn + eve + night + dim + low + gray + red;
  const cache = new Map();
  const c = (col) => {
    if (typeof col === 'string' && col[0] === '!') return col.slice(1);          // '!#RRGGBB' = emissive: never toned
    if (!any || typeof col !== 'string' || col[0] !== '#' || col.length !== 7) return col;
    let v = cache.get(col);
    if (v) return v;
    let [r, g, b] = hx(col);
    if (morn) { r = lerp(r, r * 0.99 + 8, morn); g = lerp(g, g * 0.95 + 6, morn); b = lerp(b, b * 0.86 + 4, morn); }
    if (eve) { r = lerp(r, r * 0.94 + 20, eve); g = lerp(g, g * 0.78 + 8, eve); b = lerp(b, b * 0.7 + 18, eve); }
    if (night) { r = lerp(r, r * 0.25 + 10, night); g = lerp(g, g * 0.31 + 14, night); b = lerp(b, b * 0.5 + 42, night); }
    if (dim) { r *= 1 - 0.38 * dim; g *= 1 - 0.36 * dim; b *= 1 - 0.3 * dim; }
    if (low) {
      const L = 0.3 * r + 0.59 * g + 0.11 * b, l2 = 124 + (L - 124) * 0.62;
      r = lerp(r, l2 * 1.03 + 6, low); g = lerp(g, l2 * 1.0 + 3, low); b = lerp(b, l2 * 0.9 - 2, low);
    }
    if (gray) { const L = 0.3 * r + 0.59 * g + 0.11 * b; r = lerp(r, L * 0.98, gray); g = lerp(g, L, gray); b = lerp(b, L * 1.04 + 4, gray); }
    if (red) {
      const L = 0.3 * r + 0.59 * g + 0.11 * b;
      r = lerp(r, L * 0.52 + 50, red * 0.85); g = lerp(g, L * 0.22 + 6, red * 0.85); b = lerp(b, L * 0.28 + 14, red * 0.85);
    }
    v = toHex([r, g, b]);
    cache.set(col, v);
    return v;
  };
  const lw = 1 - 0.7 * low;
  const line = low ? mix(LINE, '#4E4C48', low) : LINE;
  const ol = (fill, w = 6, extra) => ({ fill: c(fill), stroke: line, 'stroke-width': f(w * lw), 'stroke-linejoin': 'round', 'stroke-linecap': 'round', ...extra });
  const ln = (w, col = LINE, op) => ({ fill: 'none', stroke: col === LINE ? line : c(col), 'stroke-width': f(col === LINE ? w * lw : w), 'stroke-linecap': 'round', 'stroke-linejoin': 'round', ...(op !== undefined ? { opacity: f(clamp(op, 0, 1)) } : {}) });
  const fl = (col, op) => (op === undefined ? { fill: c(col) } : { fill: c(col), opacity: f(clamp(op, 0, 1)) });
  return { c, ol, ln, fl, line, lw, detail: 1 - low, morn, eve, night, dim, low, gray, red };
}

// ---------------------------------------------------------------- static defs
const DEF = [];
const def = (s) => { DEF.push(s); };
const lg = (id, stops, x2 = 0, y2 = 1, extra = '') => `<linearGradient id="${id}" x1="0" y1="0" x2="${x2}" y2="${y2}"${extra}>${stops.map(([o, c, a]) => `<stop offset="${o}" stop-color="${c}"${a !== undefined ? ` stop-opacity="${a}"` : ''}/>`).join('')}</linearGradient>`;
const rg = (id, stops, extra = '') => `<radialGradient id="${id}"${extra}>${stops.map(([o, c, a]) => `<stop offset="${o}" stop-color="${c}"${a !== undefined ? ` stop-opacity="${a}"` : ''}/>`).join('')}</radialGradient>`;
const pat = (id, w, h, inner, extra = '') => `<pattern id="${id}" width="${w}" height="${h}" patternUnits="userSpaceOnUse"${extra}>${inner}</pattern>`;

// skies (windows + exteriors). Low-graphics / red / storm skies are separate gradients cross-faded by opacity.
def(lg('shSkyMorning', [[0, '#7FB8F5'], [0.5, '#BFDDF7'], [0.82, '#FFE0C2'], [1, '#FFC9A0']]));
def(lg('shSkyDay', [[0, '#3E9CF2'], [0.55, '#86CCFA'], [1, '#D8F1FF']]));
def(lg('shSkySunset', [[0, '#4A3C9E'], [0.4, '#C2609E'], [0.72, '#FF8E6A'], [1, '#FFCB80']]));
def(lg('shSkyGolden', [[0, '#5D8FE0'], [0.45, '#F2B58C'], [0.78, '#FFC870'], [1, '#FFE6A0']]));
def(lg('shSkyNight', [[0, '#0C1238'], [0.6, '#1D2A6A'], [1, '#33478F']]));
def(lg('shSkyStorm', [[0, '#141A33'], [0.55, '#25305A'], [1, '#3A4775']]));
def(lg('shSkyLow', [[0, '#9AA7B2'], [1, '#C9CED0']]));
def(lg('shSkyRed', [[0, '#2A0208'], [0.42, '#7A0614'], [0.78, '#D8152A'], [1, '#FF6A3A']]));
def(lg('shSkyGame', [[0, '#1C0E4A'], [0.45, '#4A1D7E'], [0.8, '#A0307E'], [1, '#FF6A3D']]));
def(pat('shStars', 220, 160, '<circle cx="20" cy="30" r="2.2" fill="#FFF"/><circle cx="140" cy="18" r="1.5" fill="#FFF" opacity="0.7"/><circle cx="96" cy="88" r="2.6" fill="#FFF8D0"/><circle cx="188" cy="120" r="1.6" fill="#FFF" opacity="0.8"/><circle cx="52" cy="136" r="1.3" fill="#FFF" opacity="0.6"/><path d="M170 60 l3 -9 l3 9 l9 3 l-9 3 l-3 9 l-3 -9 l-9 -3 Z" fill="#FFF" opacity="0.9"/>'));
// red alarm void: pixel grid + scanlines
def(pat('shRedPix', 48, 48, '<rect width="48" height="48" fill="none" stroke="#FF5A5A" stroke-width="2" opacity="0.18"/><rect x="2" y="2" width="20" height="20" fill="#000" opacity="0.10"/><rect x="26" y="26" width="20" height="20" fill="#FF8080" opacity="0.07"/>'));
def(pat('shScan', 8, 6, '<rect width="8" height="2" fill="#000" opacity="0.3"/>'));
// rain streaks (move the filled rect to animate)
def(pat('shRain', 90, 120, '<path d="M12 0 l-9 34 M58 40 l-9 34 M80 84 l-7 26 M36 70 l-6 22 M70 4 l-5 18" stroke="#CFE3FF" stroke-width="3" stroke-linecap="round" opacity="0.75"/>'));
// soft light + glows (small radii only)
def(rg('shGlowWarm', [[0, '#FFE9A8', 0.8], [0.45, '#FFD27A', 0.28], [1, '#FFC860', 0]]));
def(rg('shGlowGreen', [[0, '#9DFFCB', 0.75], [0.4, '#3DFF9A', 0.26], [1, '#3DFF9A', 0]]));
def(rg('shGlowBlue', [[0, '#BFE6FF', 0.7], [0.45, '#7FC0FF', 0.22], [1, '#7FC0FF', 0]]));
def(rg('shGlowRed', [[0, '#FF8A8A', 0.75], [0.4, '#FF2E3E', 0.26], [1, '#FF2E3E', 0]]));
def(rg('shGlowWhite', [[0, '#FFFFFF', 0.85], [0.45, '#FFFFFF', 0.25], [1, '#FFFFFF', 0]]));
def(rg('shGlowLava', [[0, '#FFD36A', 0.75], [0.4, '#FF7A2E', 0.3], [1, '#FF5A1F', 0]]));
def(lg('shShine', [[0, '#FFFFFF', 0.3], [0.5, '#FFFFFF', 0]], 1, 1));
def(lg('shBeam', [[0, '#FFF1C8', 0.6], [1, '#FFF1C8', 0]]));
def(lg('shBeamBlue', [[0, '#BFE0FF', 0.5], [1, '#BFE0FF', 0]]));
// generic overlay textures (semi-transparent, so they work on any toned colour)
def(pat('shSiding', 40, 26, '<rect width="40" height="26" fill="none"/><path d="M0 24 H40" stroke="#000" stroke-width="3" opacity="0.13"/><path d="M0 2 H40" stroke="#FFF" stroke-width="2" opacity="0.2"/>'));
def(pat('shShingle', 44, 26, '<path d="M0 24 H44 M22 0 V12 M0 12 H44 M11 12 V24 M33 12 V24" stroke="#000" stroke-width="2.5" opacity="0.16" fill="none"/>'));
def(pat('shBrick', 60, 30, '<path d="M0 14 H60 M0 29 H60 M30 0 V14 M0 14 V29 M60 14 V29" stroke="#000" stroke-width="2.5" opacity="0.14" fill="none"/><rect x="34" y="3" width="20" height="6" fill="#FFF" opacity="0.08"/>'));
def(pat('shLawn', 64, 40, '<path d="M6 30 l4 -12 l4 12 M34 14 l3 -10 l3 10 M50 36 l3 -9 l3 9" stroke="#1E6B2A" stroke-width="2.5" fill="none" opacity="0.28" stroke-linejoin="round"/>'));
def(pat('shRoad', 120, 60, '<circle cx="14" cy="10" r="2" fill="#FFF" opacity="0.1"/><circle cx="80" cy="40" r="2.5" fill="#000" opacity="0.12"/><circle cx="50" cy="22" r="1.6" fill="#FFF" opacity="0.08"/><circle cx="104" cy="12" r="2" fill="#000" opacity="0.1"/>'));
def(pat('shPlanks', 150, 34, '<path d="M0 33 H150 M60 0 V33" stroke="#000" stroke-width="3" opacity="0.14" fill="none"/>'));
def(pat('shDots', 46, 46, '<circle cx="11" cy="11" r="3" fill="#FFF" opacity="0.35"/><circle cx="34" cy="34" r="3" fill="#FFF" opacity="0.35"/>'));

// ---------------------------------------------------------------- camera helpers (same conventions as scenes/env.js)
function camTf(cam = {}, k = 1) {
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
// vis() limited to a screen-space box [x0, y0, x1, y1] (cull what a clip will hide anyway)
function visBox(cam = {}, k = 1, box) {
  const v = vis(cam, k);
  if (!box) return v;
  const fx = cam.fx ?? 960, fy = cam.fy ?? 540;
  const inv = (xs, ys) => [fx + (cam.x || 0) * k + (xs - fx - (cam.sx || 0)) / v.z, fy + (cam.y || 0) * k + (ys - fy - (cam.sy || 0)) / v.z];
  const [ax, ay] = inv(box[0], box[1]), [bx, by] = inv(box[2], box[3]);
  return { ...v, x0: Math.max(v.x0, ax), x1: Math.max(Math.max(v.x0, ax) + 1, Math.min(v.x1, bx)), y0: Math.max(v.y0, ay), y1: Math.min(v.y1, by) };
}
// screen position of a layer point {x, y, k} seen through cam
function toScreen(cam, a) {
  cam = cam || {};
  const k = a.k ?? 1, z = 1 + ((cam.zoom ?? 1) - 1) * k, fx = cam.fx ?? 960, fy = cam.fy ?? 540;
  return { x: fx + (cam.sx || 0) + z * (a.x - fx - (cam.x || 0) * k), y: fy + (cam.sy || 0) + z * (a.y - fy - (cam.y || 0) * k), z };
}
// layers object whose String() is the whole picture
function layersOf(bg = '', mid = '', fg = '', light = '', extra = {}) {
  const o = { bg, mid, fg, light, ...extra };
  Object.defineProperty(o, 'toString', { value() { return this.bg + this.mid + this.fg + this.light; }, enumerable: false });
  return o;
}
function makeSet(layersFn) {
  const fn = (t = 0, opts = {}) => { const L = layersFn(t, opts); return (L.bg || '') + (L.mid || '') + (L.front || '') + (L.fg || '') + (L.light || ''); };
  fn.layers = layersFn;
  return fn;
}
// screen content: svg centred on (0,0) of the box, or fn(w, h)
const screenOf = (inner, w, h) => (typeof inner === 'function' ? inner(w, h) : inner || '');
// fit a full 1920x1080 frame into a w x h box centred on (0,0)
const frameIn = (svg, w, h) => G(svg, `translate(${f(-w / 2)} ${f(-h / 2)}) scale(${f(w / 1920)} ${f(h / 1080)})`);

// ---------------------------------------------------------------- light helpers (no big radial gradients)
// soft glow: a small radial-gradient circle (keep r <= ~420)
const glow = (x, y, r, id = 'shGlowWarm', op = 1) => (op > 0.003 ? CI(x, y, r, { fill: `url(#${id})`, opacity: f(clamp(op, 0, 1)) }) : '');
// cel-shaded light pool: n nested ellipses of one colour (cheap fake radial)
function pool(x, y, rx, ry, col, op, n = 4) {
  if (op <= 0.003) return '';
  let o = '';
  for (let i = 0; i < n; i++) { const k = 1 - i / n; o += E(x, y, rx * k, ry * k, { fill: col, opacity: f(op / n) }); }
  return o;
}
// darkness everywhere except around (x, y): n full-cover sheets with growing elliptical holes (evenodd)
function darkRing(x, y, rx, ry, col, op, n = 9, box = [XL, YT, XR, YB]) {
  if (op <= 0.003) return '';
  const [x0, y0, x1, y1] = box;
  let o = '';
  for (let i = 0; i < n; i++) {
    const k = 0.62 + i * 0.22 + i * i * 0.025;
    o += P(dR(x0, y0, x1 - x0, y1 - y0) + dE(x, y, rx * k, ry * k), { fill: col, opacity: f(op / n), 'fill-rule': 'evenodd' });
  }
  return o;
}
// lightning bolt path (zig-zag) from (x, y) down h px
function boltD(x, y, h, seed = 1) {
  const pts = [[x, y]];
  let cx = x;
  for (let i = 1; i <= 7; i++) { cx += (hash(i * 3.7 + seed) - 0.5) * h * 0.28; pts.push([cx, y + (h * i) / 7]); }
  let d = dL(pts);
  const b = pts[3];
  d += ` M${f(b[0])} ${f(b[1])} L${f(b[0] + h * 0.16)} ${f(b[1] + h * 0.14)} L${f(b[0] + h * 0.2)} ${f(b[1] + h * 0.3)}`;
  return d;
}

// ---------------------------------------------------------------- shared props
// puffy outlined cloud (one silhouette, outline only outside): origin = bottom centre
function cloud(x, y, s = 1, tn = tone(), col = '#FFFFFF', sh = '#D6E9FF') {
  const d = dC(-70, -34, 34) + dC(-20, -62, 50) + dC(42, -44, 40) + dC(84, -24, 24) + dRR(-108, -40, 216, 40, 20);
  const lw = 5 / s;
  return G(P(d, { fill: tn.line, stroke: tn.line, 'stroke-width': f(lw * 2 * tn.lw), 'stroke-linejoin': 'round' }) + P(d, { fill: tn.c(col) }) + P(dRR(-104, -16, 208, 14, 7), { fill: tn.c(sh) }), tr(x, y, s));
}
// low-graphics cloud: a flat box
const cloudLow = (x, y, s, tn) => R(x - 100 * s, y - 56 * s, 200 * s, 56 * s, 0, { fill: tn.c('#E4E6E6') });
// round "lollipop" tree (origin = trunk base). o: col, hi, trunk, sway (deg), lowK (1 = cube/cone low-graphics tree)
function tree(x, y, s = 1, tn = tone(), o = {}) {
  const col = o.col || '#4DB85E', hi = o.hi || '#8BDB7C', trunk = o.trunk || '#9A6238';
  if (o.lowK) {
    // 2006: a box trunk + a cube or a cone
    let lo = R(-16, -150, 32, 150, 0, tn.ol(trunk, 3));
    if (hash(x * 0.37) > 0.5) lo += R(-90, -330, 180, 190, 0, tn.ol(col, 3)) + R(-90, -330, 180, 40, 0, { fill: '#FFF', opacity: 0.12 });
    else lo += P('M0 -390 L104 -130 L-104 -130 Z', tn.ol(col, 3)) + P('M0 -390 L0 -130 L-104 -130 Z', { fill: '#000', opacity: 0.08 });
    return G(lo, tr(x, y, s));
  }
  const sw = o.sway || 0;
  let t = P('M-20 0 L-13 -170 Q0 -184 13 -170 L20 0 Z', tn.ol(trunk, 6)) + P('M-4 -24 L-3 -150', tn.ln(5, '#C08A58', 0.7));
  const cd = dE(0, -280, 128, 120) + dC(-92, -228, 64) + dC(96, -222, 62) + dC(-40, -368, 66) + dC(54, -360, 60);
  let cn = P(cd, { fill: tn.line, stroke: tn.line, 'stroke-width': f(12 * tn.lw), 'stroke-linejoin': 'round' }) + P(cd, { fill: tn.c(col) });
  cn += P(dC(-56, -320, 34) + dC(10, -380, 26) + dC(-112, -244, 20), { fill: tn.c(hi), opacity: f(0.9 * tn.detail) });
  cn += P('M-70 -190 Q0 -170 80 -192', tn.ln(5, mix(col, '#000000', 0.25), 0.6 * tn.detail));
  t += sw ? G(cn, `rotate(${f(sw)} 0 -170)`) : cn;
  return G(t, tr(x, y, s));
}
// pine tree (origin = base)
function pine(x, y, s = 1, tn = tone(), o = {}) {
  const col = o.col || '#2F9A62';
  if (o.lowK) return G(R(-12, -60, 24, 60, 0, tn.ol('#8A6238', 3)) + P('M0 -330 L80 -60 L-80 -60 Z', tn.ol(col, 3)), tr(x, y, s));
  let t = R(-12, -60, 24, 62, 4, tn.ol('#8A5A33', 5));
  t += P('M0 -340 L58 -250 L36 -250 L86 -160 L58 -160 L104 -60 L-104 -60 L-58 -160 L-86 -160 L-36 -250 L-58 -250 Z', tn.ol(col, 6));
  t += P('M0 -330 L-30 -262 M-20 -240 L-58 -170 M-30 -150 L-78 -70', tn.ln(6, o.hi || '#5CC98A', 0.8 * tn.detail));
  return G(t, tr(x, y, s));
}
// small bird. o: flap 0..1 (wing phase), flying, col. origin = feet (perched) / body centre (flying)
function bird(x, y, s = 1, tn = tone(), o = {}) {
  const col = o.col || '#4A5A7A';
  if (o.lowK) return G(P('M-14 0 L14 0 L0 -16 Z', tn.fl('#5A5A5A')), tr(x, y, s));
  let b = '';
  if (o.flying) {
    const fl = Math.sin((o.flap ?? 0.5) * Math.PI * 2);
    b += P(`M-4 -2 Q-22 ${f(-14 - 22 * fl)} -40 ${f(-6 - 26 * fl)} Q-22 -2 -6 4 Z M4 -2 Q22 ${f(-14 - 22 * fl)} 40 ${f(-6 - 26 * fl)} Q22 -2 6 4 Z`, tn.ol(col, 3.5));
    b += E(0, 0, 16, 10, tn.ol(col, 3.5)) + CI(12, -6, 8, tn.ol(col, 3)) + P('M19 -6 L27 -3 L19 0 Z', tn.ol('#FFB13B', 2)) + CI(13, -8, 2, { fill: '#FFF' });
  } else {
    b += P('M-4 0 L-6 10 M4 0 L6 10', tn.ln(2.5, '#E8A040'));
    b += P('M-20 -14 Q-30 -6 -26 2 L-12 -6 Z', tn.ol(col, 3)) + E(-2, -14, 17, 13, tn.ol(col, 3.5)) + CI(10, -26, 9, tn.ol(col, 3)) + P('M18 -26 L26 -23 L18 -20 Z', tn.ol('#FFB13B', 2)) + CI(12, -28, 2.2, { fill: '#FFF' });
    b += P('M-12 -14 Q-2 -6 8 -12', tn.ln(2.5, mix(col, '#FFFFFF', 0.3)));
  }
  return G(b, `translate(${f(x)} ${f(y)}) scale(${f(o.flip ? -s : s)} ${f(s)})`);
}
// wall clock showing 'H:MM' (or a number of hours). origin = centre, r = face radius. o: rim colour, bells
function wallClock(x, y, r, time = '7:30', tn = tone(), o = {}) {
  let h = 7, m = 30;
  if (typeof time === 'number') { h = Math.floor(time); m = (time - h) * 60; } else { const p = String(time).split(':'); h = +p[0] || 0; m = +p[1] || 0; }
  const am = ((h % 12) + m / 60) / 12 * Math.PI * 2, mm = m / 60 * Math.PI * 2;
  let c = '';
  if (o.bells !== false) c += P(`M${f(-r * 0.86)} ${f(-r * 0.6)} a${f(r * 0.34)} ${f(r * 0.34)} 0 0 1 ${f(r * 0.5)} ${f(-r * 0.42)} Z M${f(r * 0.86)} ${f(-r * 0.6)} a${f(r * 0.34)} ${f(r * 0.34)} 0 0 0 ${f(-r * 0.5)} ${f(-r * 0.42)} Z`, tn.ol(o.bell || '#FFC23A', 4));
  c += CI(0, 0, r * 1.16, tn.ol(o.rim || '#2E9C9C', 6)) + CI(0, 0, r, tn.ol('#FFF8EC', 4));
  let ticks = '';
  for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2, l = i % 3 === 0 ? 0.2 : 0.1; ticks += `M${f(Math.sin(a) * r * 0.86)} ${f(-Math.cos(a) * r * 0.86)} L${f(Math.sin(a) * r * (0.86 - l))} ${f(-Math.cos(a) * r * (0.86 - l))} `; }
  c += P(ticks, tn.ln(Math.max(2, r * 0.05)));
  c += P(`M0 0 L${f(Math.sin(am) * r * 0.5)} ${f(-Math.cos(am) * r * 0.5)}`, tn.ln(r * 0.11)) + P(`M0 0 L${f(Math.sin(mm) * r * 0.76)} ${f(-Math.cos(mm) * r * 0.76)}`, tn.ln(r * 0.07));
  c += CI(0, 0, r * 0.08, { fill: tn.c('#E8503A') });
  c += P(`M${f(-r * 0.62)} ${f(-r * 0.5)} A${f(r * 0.8)} ${f(r * 0.8)} 0 0 1 ${f(r * 0.1)} ${f(-r * 0.8)}`, tn.ln(r * 0.06, '#FFFFFF', 0.8));
  return G(c, tr(x, y));
}
// Bea's skateboard (pink deck, star stickers), side view. origin = bottom centre of the wheels, ~190 px long at s = 1
function skateboard(x, y, s = 1, rot = 0, tn = tone()) {
  let o = CI(-58, -11, 11, tn.ol('#FFE066', 4)) + CI(58, -11, 11, tn.ol('#FFE066', 4)) + P('M-66 -22 L-50 -22 M50 -22 L66 -22', tn.ln(6, '#9AA4B4'));
  o += P('M-96 -40 Q-104 -24 -88 -24 L88 -24 Q104 -24 96 -40 Z', tn.ol('#FF6FB5', 5)) + P('M-80 -32 L80 -32', tn.ln(3, '#FFB3D9'));
  o += P('M-30 -36 l3 -6 l3 6 l6 1 l-5 4 l1 6 l-5 -3 l-5 3 l1 -6 l-5 -4 Z M24 -36 l3 -6 l3 6 l6 1 l-5 4 l1 6 l-5 -3 l-5 3 l1 -6 l-5 -4 Z', { fill: tn.c('#FFF4A0') });
  return G(o, tr(x, y, s, rot));
}
// a pancake (origin = centre), r ~ 70 at s = 1
function pancake(x, y, s = 1, rot = 0, tn = tone()) {
  return G(E(0, 6, 72, 20, tn.ol('#C9852F', 5)) + E(0, 0, 70, 18, tn.ol('#F4BE62', 5)) + E(-8, -4, 40, 8, { fill: tn.c('#FFE0A0'), opacity: 0.8 }) + P('M-30 2 Q-20 -4 -6 2 M14 -2 Q26 -8 38 0', tn.ln(3, '#D99A40')), tr(x, y, s, rot));
}
// the yellow school bus, side view facing LEFT (o.flip faces right). origin = bottom centre of the wheels; 780 x 330 at s = 1.
// o: { lowK, sign 0..1 (stop arm out), ghost }
function schoolBus(x, y, s = 1, tn = tone(), o = {}) {
  let b = '';
  if (o.lowK) {
    b += R(-390, -320, 780, 270, 0, tn.ol('#C9B064', 3)) + R(-390, -190, 780, 24, 0, { fill: tn.c('#55524C') });
    for (let i = 0; i < 7; i++) b += R(-330 + i * 96, -290, 70, 70, 0, { fill: tn.c('#6E7478') });
    b += R(-300, -60, 90, 60, 0, { fill: tn.c('#3A3A3A') }) + R(190, -60, 90, 60, 0, { fill: tn.c('#3A3A3A') });
    return G(b, `translate(${f(x)} ${f(y)}) scale(${f(o.flip ? -s : s)} ${f(s)})`);
  }
  b += E(0, -4, 380, 14, { fill: '#000', opacity: 0.16 });
  b += P('M-390 -60 L-390 -230 Q-390 -320 -320 -320 L360 -320 Q392 -320 392 -290 L392 -60 Z', tn.ol('#FFC21F', 7));
  b += P('M-450 -60 L-450 -150 Q-450 -176 -420 -180 L-390 -184 L-390 -60 Z', tn.ol('#FFC21F', 7));
  b += R(-460, -96, 40, 30, 6, tn.ol('#2A2D38', 4)) + R(-452, -170, 26, 24, 5, tn.ol('#FFF4B8', 3));
  b += R(-392, -150, 784, 16, 0, { fill: tn.c('#2A2D38') }) + R(-392, -110, 784, 12, 0, { fill: tn.c('#2A2D38') });
  let w = '';
  for (let i = 0; i < 7; i++) w += dRR(-330 + i * 98, -292, 76, 76, 10);
  b += P(w, tn.ol('#BFE8FF', 5)) + P(w.replace(/Z/g, 'Z'), { fill: 'url(#shShine)' });
  b += R(-380, -296, 44, 150, 6, tn.ol('#BFE8FF', 5)) + P('M-358 -296 V-146', tn.ln(4));
  b += o.flip ? G(T('SCHOOL BUS', 0, 0, 34, tn.c('#2A2D38')), 'translate(20 -172) scale(-1 1)') : T('SCHOOL BUS', 20, -172, 34, tn.c('#2A2D38'));
  b += R(370, -300, 18, 26, 4, tn.ol('#FF5A3A', 3)) + R(-398, -300, 14, 22, 4, tn.ol('#FF8A2A', 3));
  if (o.sign) b += G(P('M0 -24 L17 -17 L24 0 L17 17 L0 24 L-17 17 L-24 0 L-17 -17 Z', tn.ol('#E8243C', 4)) + TF('STOP', 0, 6, 13, '#FFF'), `translate(${f(-330 - 40 * o.sign)} -200) scale(${f(0.4 + 0.6 * o.sign)} 1)`);
  for (const wx of [-260, 250]) b += CI(wx, -50, 50, tn.ol('#2A2D38', 6)) + CI(wx, -50, 22, tn.ol('#B9C0CC', 4)) + P(`M${wx - 72} -60 Q${wx} -126 ${wx + 72} -60`, tn.ln(7));
  return G(b, `translate(${f(x)} ${f(y)}) scale(${f(o.flip ? -s : s)} ${f(s)})`, o.ghost ? { opacity: f(o.ghost) } : undefined);
}
// a friendly neighbourhood dog (beagle-ish), side view facing RIGHT (o.flip faces left). origin = feet, ~150 px tall at s = 1.
// o: { walk (phase, radians), lowK }
function streetDog(x, y, s = 1, tn = tone(), o = {}) {
  const ph = o.walk || 0, a = Math.sin(ph) * 14;
  let d = '';
  if (o.lowK) {
    d += R(-60, -90, 110, 46, 0, tn.fl('#9A8670')) + R(36, -122, 48, 40, 0, tn.fl('#9A8670')) + R(-52, -46, 14, 46, 0, tn.fl('#7A6650')) + R(28, -46, 14, 46, 0, tn.fl('#7A6650'));
    return G(d, `translate(${f(x)} ${f(y)}) scale(${f(o.flip ? -s : s)} ${f(s)})`);
  }
  d += E(0, 0, 70, 9, { fill: '#000', opacity: 0.14 });
  const leg = (lx, ang) => P(`M${lx} -48 l${f(Math.sin(ang * Math.PI / 180) * 44)} 46`, tn.ln(18)) + P(`M${lx} -48 l${f(Math.sin(ang * Math.PI / 180) * 44)} 46`, tn.ln(10, '#FFF4E2'));
  d += leg(-44, -a) + leg(26, a);
  d += P('M-66 -86 Q-96 -120 -84 -132', tn.ln(14)) + P('M-66 -86 Q-96 -120 -84 -132', tn.ln(7, '#E8A04A'));
  d += P('M-70 -60 Q-74 -104 -40 -104 L34 -104 Q60 -100 56 -62 Q50 -40 20 -42 L-40 -42 Q-68 -42 -70 -60 Z', tn.ol('#E8A04A', 6));
  d += P('M-30 -104 Q0 -84 26 -104 L28 -60 Q0 -48 -30 -60 Z', { fill: tn.c('#FFF4E2') }) + leg(-30, a * 0.6) + leg(40, -a * 0.6);
  d += G(P('M-22 -16 Q-26 -54 6 -56 Q34 -56 40 -30 L58 -22 Q62 -6 44 -4 L10 -2 Q-18 0 -22 -16 Z', tn.ol('#E8A04A', 6)) + P('M-14 -50 Q-34 -36 -22 0 Q-10 -6 -6 -26 Z', tn.ol('#8A4F22', 4)) + CI(22, -30, 5, { fill: tn.line }) + CI(58, -16, 6, { fill: tn.line }) + P('M20 -4 Q30 4 40 -4', tn.ln(4, '#E8506E')), `translate(54 -96) rotate(${f(Math.sin(ph * 2) * 3)})`);
  d += R(36, -100, 34, 8, 4, tn.ol('#3DA8D8', 3));
  return G(d, `translate(${f(x)} ${f(y)}) scale(${f(o.flip ? -s : s)} ${f(s)})`);
}
// LOD pop: an object switching to its low-graphics version gets a white blink + squash for a moment.
// lowK(k, threshold) -> 0/1 for the object; popAt(k, th) -> 0..1 pop strength near the threshold
const lowAt = (k, th) => (k >= th ? 1 : 0);
const popAt = (k, th, w = 0.06) => (k > th && k < th + w ? 1 - (k - th) / w : 0);
function lowPop(svg, k, th, cx, cy, box) {
  const p = popAt(k, th);
  if (!p || cx === undefined || cy === undefined) return svg;
  const sy = 1 - 0.12 * p, sx = 1 + 0.06 * p;
  let o = G(svg, `translate(${f(cx)} ${f(cy)}) scale(${f(sx)} ${f(sy)}) translate(${f(-cx)} ${f(-cy)})`);
  if (box) o += R(box[0], box[1], box[2], box[3], 0, { fill: '#FFFFFF', opacity: f(0.55 * p) });
  return o;
}
// RED ALARM VOID (corrupted save): fills [x0..x1] x [y0..y1] (layer coords). k 0..1 fade, t for the siren pulse.
// The top-centre stays EMPTY for the giant system window.
function redSky(x0, y0, x1, y1, k, t, o = {}) {
  if (k <= 0.003) return '';
  const pulse = 0.5 + 0.5 * Math.sin(t * 5.2);
  let s = R(x0, y0, x1 - x0, y1 - y0, 0, { fill: 'url(#shSkyRed)' });
  s += R(x0, y0, x1 - x0, y1 - y0, 0, { fill: 'url(#shRedPix)' });
  s += R(x0, y0, x1 - x0, y1 - y0, 0, { fill: 'url(#shScan)', opacity: 0.55 });
  // drifting dead pixels (grey / white squares rising), away from the window area
  let d = '', dw = '';
  const W = x1 - x0, H = y1 - y0, tm = o.tm ?? t;
  for (let i = 0; i < 26; i++) {
    const px = x0 + hash(i * 3.3 + 1) * W, sp = 18 + 30 * hash(i * 1.9);
    const py = y0 + md(hash(i * 7.1) * H - tm * sp, H);
    const sz = 10 + 26 * hash(i * 5.7);
    if (o.hole && px > o.hole[0] && px < o.hole[2] && py > o.hole[1] && py < o.hole[3]) continue;
    const sq = dR(Math.round(px / 8) * 8, Math.round(py / 8) * 8, sz, sz);
    if (i % 3) d += sq; else dw += sq;
  }
  s += P(d, { fill: '#2A0A10', opacity: 0.45 }) + P(dw, { fill: '#FFB0B0', opacity: 0.35 });
  s += R(x0, y0, x1 - x0, y1 - y0, 0, { fill: '#FF2A3A', opacity: f(0.1 * pulse) });
  return k < 1 ? G(s, null, { opacity: f(k) }) : s;
}

// glitch sprinkles for lagging rooms: grey "texture missing" squares + slice offsets. Returns { bits, dx }.
function glitchBits(t, k, x0, y0, w, h, seed = 1) {
  if (k <= 0.003) return { bits: '', dx: 0 };
  const fr = Math.floor(t * 12);
  let d = '';
  const n = Math.round(4 + 10 * k);
  for (let i = 0; i < n; i++) {
    if (hash(i * 9.1 + fr * 0.37 + seed) > 0.35 + 0.5 * k) continue;
    const sz = 30 + 70 * hash(i * 2.3 + seed);
    d += dR(Math.round((x0 + hash(i * 4.7 + seed + fr * 0.11) * w) / 20) * 20, Math.round((y0 + hash(i * 6.1 + seed) * h) / 20) * 20, sz, sz * (0.5 + hash(i)));
  }
  const dx = hash(fr * 1.3 + seed) < k * 0.35 ? (hash(fr * 2.1) - 0.5) * 26 * k : 0;
  return { bits: P(d, { fill: '#8A8F98', opacity: f(0.55 + 0.3 * k) }), dx };
}

// ================================================================= 1. HERO ROOM — YOUR attic bedroom
// Flat front view. Mint wallpaper over a peach wainscot, attic slope at the upper LEFT (ceiling line y 70 from x 400 on),
// honey plank floor (wall seam y 770) with a lavender rug in the middle: the CHECKPOINT pad's spot (SPOTS.heroRoom.checkpoint,
// clear floor ~420 x 140 around it). LEFT: the bed (head + pillow at the left; layers.front = blanket); posters + cork board
// under the slope; string lights along it. Window centre-left (x 660..940, y 170..520) with a roller blind + coral curtains.
// Wall clock (SPOTS.heroRoom.clock) above Gary's bowl spot on the desk's left end (SPOTS.heroRoom.bowl: the bowl's bottom
// centre on the desk top). RIGHT: the gaming desk with a big monitor (screen box SPOTS.heroRoom.monitor.screen 470 x 264),
// RGB keyboard, the red gaming chair seen from behind (layers.front), shelf, the door (far right).
// Stand line y 990 (FLOOR.heroRoom, hero s .5). On the pad: hero s .5 at SPOTS.heroRoom.checkpoint.
// opts: { time 'morning'|'day'|'night' (default 'day'), clock 'H:MM' or hours as a number (default '7:30'), headphones (default true),
//   monitor (svg|fn(w,h) screen content; default off), monitorGlow 0..1 (light thrown by the screen, default 1 when monitor is set),
//   storm 0..1 (storm sky, rain on the glass, wind in the curtains + tree), flash 0..1 (lightning: bolt + white flash in the room),
//   greenGlow 0..1 (room lit green from the screen/checkpoint), redBlink 0..1 (red alarm light; blink it yourself),
//   door 0..1 (open), sleep (blanket pulled up for a sleeping hero), chair (default true), chairX (default 1210),
//   mess 0..1 (default .35: sock, comics... up to pizza box + laundry), blind 0..1 (roller blind down, default .22),
//   lights 0..1 (string lights glow; default 1 at night), lamp (desk lamp on), lowGfx 0..1, glitch 0..1 }
const HR = {
  ceil: 70, base: 770, slope: -0.65,
  win: { x0: 660, y0: 170, x1: 940, y1: 520 },
  clock: { x: 1035, y: 200, r: 50 },
  desk: { x0: 980, x1: 1660, top: 630 },
  mon: { cx: 1355, cy: 455, w: 470, h: 264 },
  bowl: { x: 1058, y: 630 },
  chair: { x: 1210, seat: 742 },
  bed: { x0: 84, x1: 644, top: 690 },
  door: { x0: 1700, x1: 1888, y0: 286 },
  checkpoint: { x: 870, y: 905 },
  rug: [[570, 790], [1170, 790], [1280, 1012], [460, 1012]],
};
const slopeY = (x) => 330 + HR.slope * x;     // attic slope line (ceiling over the bed)
def(pat('shHRPaper', 72, 72, '<path d="M14 10 h6 v6 h6 v6 h-6 v6 h-6 v-6 h-6 v-6 h6 Z" fill="#FFFFFF" opacity="0.32"/><circle cx="54" cy="52" r="4" fill="#FFFFFF" opacity="0.3"/><rect x="50" y="14" width="5" height="5" fill="#5FB89A" opacity="0.25"/><rect x="14" y="54" width="5" height="5" fill="#5FB89A" opacity="0.25"/>'));
def(pat('shWains', 96, 220, '<rect x="10" y="22" width="76" height="150" rx="6" fill="none" stroke="#000" stroke-width="3" opacity="0.1"/><path d="M12 24 H84" stroke="#FFF" stroke-width="3" opacity="0.25"/>'));
def(pat('shQuiltPix', 64, 64, '<rect x="6" y="6" width="14" height="14" fill="#FFD23F" opacity="0.55"/><rect x="38" y="38" width="14" height="14" fill="#FFFFFF" opacity="0.22"/><rect x="38" y="6" width="14" height="14" fill="#000" opacity="0.08"/><rect x="6" y="38" width="14" height="14" fill="#000" opacity="0.08"/>'));
def(lg('shRGB', [[0, '#FF4FD8'], [0.25, '#FFB13B'], [0.5, '#3DFF9A'], [0.75, '#33D6FF'], [1, '#8A5CFF']], 1, 0));
def(pat('shKeys', 15, 10, '<rect width="15" height="10" fill="none"/><path d="M0 0 H15 V10 H0 Z M2 1.5 V7.5 H13 V1.5 Z" fill="#1E2029" fill-rule="evenodd"/><rect x="2" y="1.5" width="11" height="6" rx="1.5" fill="#2C303C"/><rect x="3" y="2" width="9" height="2" rx="1" fill="#FFFFFF" opacity="0.12"/>'));
def(lg('shScreenOff', [[0, '#1B1F2C'], [1, '#0C0E16']]));

// MEGA OBBY poster (original): purple, lava, a zig-zag tower and a flag
function obbyPoster(x, y, w, h, rot, tn) {
  let o = R(-w / 2 + 6, -h / 2 + 8, w, h, 6, { fill: '#000', opacity: 0.12 });
  o += R(-w / 2, -h / 2, w, h, 6, tn.ol('#4A2A8A', 5)) + R(-w / 2 + 9, -h / 2 + 9, w - 18, h - 18, 3, tn.fl('#6A3AB8'));
  o += R(-w / 2 + 9, h / 2 - 46, w - 18, 37, 0, tn.fl('#FF6A2E')) + P(`M${-w / 2 + 9} ${h / 2 - 46} q14 -10 28 0 t28 0 t28 0 t28 0 t28 0`, tn.ln(4, '#FFD23F'));
  const cols = ['#3DFF9A', '#33D6FF', '#FF4FD8', '#FFD23F'];
  for (let i = 0; i < 4; i++) o += R((i % 2 ? 6 : -50), h / 2 - 76 - i * 30, 44, 12, 3, tn.ol(cols[i], 2.5));
  o += P(`M14 ${-h / 2 + 76} V${-h / 2 + 108}`, tn.ln(3)) + P(`M14 ${-h / 2 + 76} l24 7 l-24 7 Z`, tn.ol('#3DFF9A', 2.5));
  o += T('MEGA', 0, -h / 2 + 40, 30, tn.c('#FFE14D'), OUTX(6, tn.line)) + T('OBBY', 0, -h / 2 + 68, 26, tn.c('#FFFFFF'), OUTX(5, tn.line));
  return G(o, tr(x, y, 1, rot));
}
function heroRoomLayers(t, o = {}) {
  const time = o.time || 'day', nite = time === 'night', morn = time === 'morning';
  const storm = b01(o.storm), flash = b01(o.flash), green = b01(o.greenGlow), red = b01(o.redBlink), low = b01(o.lowGfx);
  const tn = tone({ night: nite ? 1 : 0, morn: morn ? 0.6 : 0, low, dim: storm && !nite ? 0.35 * storm : 0 });
  const C = tn.c, O = tn.ol, LN = tn.ln, FL = tn.fl, det = tn.detail;
  const W = HR.win, D = HR.desk, M = HR.mon;
  const monOn = o.monitor !== undefined && o.monitor !== null && o.monitor !== false;
  const wind = storm * (0.6 + 0.4 * Math.sin(t * 2.3));
  // ---------------- bg: the backyard through the window
  const wcx = (W.x0 + W.x1) / 2;
  let bg = R(W.x0 - 60, W.y0 - 60, W.x1 - W.x0 + 120, W.y1 - W.y0 + 120, 0, { fill: `url(#${nite ? 'shSkyNight' : morn ? 'shSkyMorning' : 'shSkyDay'})` });
  if (storm > 0) bg += R(W.x0 - 60, W.y0 - 60, W.x1 - W.x0 + 120, W.y1 - W.y0 + 120, 0, { fill: 'url(#shSkyStorm)', opacity: f(storm) });
  if (nite && storm < 1) bg += R(W.x0 - 60, W.y0 - 60, W.x1 - W.x0 + 120, 260, 0, { fill: 'url(#shStars)', opacity: f(1 - storm) }) + G(CI(870, 240, 30, O('#FFF3C4', 4)) + CI(882, 232, 26, FL(nite ? '#1D2A6A' : '#86CCFA')), null, { opacity: f(1 - storm) });
  else if (!nite && storm < 1) bg += G(cloud(740, 270, 0.42, tn) + CI(900, 230, 26, O(morn ? '#FFE8A0' : '#FFE45C', 4)), null, { opacity: f(1 - storm) });
  if (storm > 0) bg += P(dC(700, 220, 60) + dC(780, 200, 70) + dC(870, 230, 60) + dR(640, 220, 320, 60), { fill: C('#2B3354'), opacity: f(storm) });
  // neighbour's roof + fence + a tree branch
  bg += P(`M600 600 L600 430 L760 360 L920 430 L920 600 Z`, O(nite ? '#5A6A9A' : '#F2A66E', 5)) + P('M584 440 L760 352 L936 440', LN(16, nite ? '#3A3F70' : '#C0504A')) + R(700, 448, 56, 52, 4, O(nite ? '!#FFD86B' : '#CDEEFF', 4));
  let fence = '';
  for (let x = 600; x < 1000; x += 34) fence += dP([[x, 520], [x, 470], [x + 12, 458], [x + 24, 470], [x + 24, 520]]);
  bg += P(fence, O(nite ? '#6A75A8' : '#FFF8EC', 3.5));
  const sw = Math.sin(t * 0.9) * 2 + wind * 9 * Math.sin(t * 7.3);
  bg += G(P('M1000 180 Q900 230 820 300', LN(16)) + P('M1000 180 Q900 230 820 300', LN(9, '#8A5A33')) + P(dC(840, 290, 46) + dC(890, 250, 40) + dC(800, 250, 34) + dC(940, 210, 38), O(storm ? '#3D7A5A' : '#4DB85E', 5)), `rotate(${f(sw)} 1000 180)`);
  if (storm > 0) bg += G(R(W.x0 - 20 - md(t * 40, 90), W.y0 - 120 + md(t * 900, 120), W.x1 - W.x0 + 200, W.y1 - W.y0 + 240, 0, { fill: 'url(#shRain)' }), null, { opacity: f(0.8 * storm) });
  if (flash > 0) bg += R(W.x0 - 60, W.y0 - 60, W.x1 - W.x0 + 120, W.y1 - W.y0 + 120, 0, { fill: '#E8F0FF', opacity: f(0.55 * flash) }) + P(boltD(860, 150, 330, 3), { fill: 'none', stroke: '#9FD0FF', 'stroke-width': 22, opacity: f(0.45 * flash), 'stroke-linejoin': 'round' }) + P(boltD(860, 150, 330, 3), { fill: 'none', stroke: '#FFFFFF', 'stroke-width': 9, opacity: f(flash), 'stroke-linejoin': 'round' });
  // ---------------- mid: the room
  let m = '';
  // wall: mint wallpaper / chair rail / peach wainscot / baseboard
  const wallD = `M${XL} ${YT} H${XR} V${HR.base} H${XL} Z M${W.x0} ${W.y0} V${W.y1} H${W.x1} V${W.y0} Z`;
  m += P(wallD, { fill: C('#A6DEC7'), 'fill-rule': 'evenodd' });
  if (det > 0) m += P(wallD, { fill: 'url(#shHRPaper)', 'fill-rule': 'evenodd', opacity: f(det) });
  m += band(556, HR.base, FL('#FFBE96')) + (det > 0 ? band(556, HR.base, { fill: 'url(#shWains)', opacity: f(det) }) : '');
  m += band(542, 560, O('#FFF3DC', 4)) + band(746, HR.base + 4, O('#FFF3DC', 4));
  // ceiling: flat strip + attic slope (with a wooden trim beam)
  const slD = dP([[XL, YT], [XR, YT], [XR, HR.ceil], [400, HR.ceil], [0, slopeY(0)], [-677, HR.base], [XL, HR.base]]);
  m += P(slD, FL('#FFF0D6'));
  m += P(`M${XR} ${HR.ceil} L400 ${HR.ceil} L0 ${f(slopeY(0))} L-677 ${HR.base}`, LN(26)) + P(`M${XR} ${HR.ceil} L400 ${HR.ceil} L0 ${f(slopeY(0))} L-677 ${HR.base}`, LN(16, '#D9A066'));
  if (det > 0) m += P(`M-300 ${f(slopeY(-300) - 70)} L360 ${f(slopeY(360) - 70)} M-520 ${f(slopeY(-520) - 150)} L250 ${f(slopeY(250) - 150)}`, LN(4, '#E2CFAE', 0.8 * det));
  // window: frame, mullions, sill, roller blind, coral curtains
  m += P(`M${W.x0 - 22} ${W.y0 - 22} H${W.x1 + 22} V${W.y1 + 8} H${W.x0 - 22} Z M${W.x0} ${W.y0} V${W.y1} H${W.x1} V${W.y0} Z`, { fill: C('#FFF8EC'), 'fill-rule': 'evenodd', stroke: tn.line, 'stroke-width': f(6 * tn.lw) });
  m += R(wcx - 7, W.y0, 14, W.y1 - W.y0, 3, O('#FFF8EC', 4)) + R(W.x0, 340, W.x1 - W.x0, 14, 3, O('#FFF8EC', 4));
  m += P(`M${W.x0 + 20} ${W.y0 + 150} L${W.x0 + 100} ${W.y0 + 14} L${W.x0 + 128} ${W.y0 + 14} L${W.x0 + 48} ${W.y0 + 150} Z M${W.x0 + 170} ${W.y1 - 20} L${W.x0 + 236} ${W.y1 - 150} L${W.x0 + 252} ${W.y1 - 150} L${W.x0 + 186} ${W.y1 - 20} Z`, { fill: '#FFFFFF', opacity: f(nite ? 0.07 : 0.28) });
  const blind = b01(o.blind, 0.22), bh = (W.y1 - W.y0) * blind;
  m += R(W.x0 - 12, W.y0 - 34, W.x1 - W.x0 + 24, 26, 10, O('#FFF3DC', 4));
  if (bh > 4) m += R(W.x0 - 4, W.y0 - 10, W.x1 - W.x0 + 8, bh, 0, O('#F7C75A', 4)) + R(W.x0 - 6, W.y0 - 16 + bh, W.x1 - W.x0 + 12, 12, 5, O('#D99A2B', 3)) + P(`M${wcx} ${W.y0 - 4 + bh} v26`, LN(3)) + CI(wcx, W.y0 + 26 + bh, 7, O('#FFF3DC', 3));
  m += R(W.x0 - 30, W.y1 + 2, W.x1 - W.x0 + 60, 24, 6, O('#FFF8EC', 5));
  m += R(W.x0 - 74, W.y0 - 56, W.x1 - W.x0 + 148, 12, 6, O('#8A5A33', 4)) + CI(W.x0 - 78, W.y0 - 50, 10, O('#FFC23A', 3.5)) + CI(W.x1 + 78, W.y0 - 50, 10, O('#FFC23A', 3.5));
  const cs = Math.sin(t * 1.2) * 4 + wind * 18 * Math.sin(t * 6.1);
  for (const [cx, d] of [[W.x0 - 34, 1], [W.x1 + 34, -1]]) {
    const tieY = W.y1 - 40;
    m += P(`M${cx - 46} ${W.y0 - 50} L${cx + 46} ${W.y0 - 50} Q${f(cx + 30 * d + 20)} ${tieY - 120} ${f(cx + 12 * d + cs * d)} ${tieY} Q${f(cx + 40 * d + cs)} ${W.y1 + 80} ${f(cx + 30 * d + cs)} ${W.y1 + 120} L${f(cx - 38 * d + cs)} ${W.y1 + 126} Q${f(cx - 30 * d)} ${W.y1 + 70} ${f(cx - 12 * d)} ${tieY} Q${cx - 46} ${tieY - 150} ${cx - 46} ${W.y0 - 50} Z`, O('#F2735A', 6));
    m += P(`M${cx - 8} ${W.y0 - 44} Q${cx - 2} ${tieY - 120} ${f(cx + 6 * d)} ${tieY - 4} M${cx + 20} ${W.y0 - 44} Q${cx + 24} ${tieY - 130} ${f(cx + 16 * d)} ${tieY - 6}`, LN(4, '#C9503F', 0.9 * det + 0.1));
    m += R(cx + 12 * d - 24, tieY - 8, 48, 16, 8, O('#FFD23F', 3.5));
  }
  // low bookshelf under the window (books, a toy robot Ivy built, a succulent)
  {
    let b = R(690, 600, 230, 176, 8, O('#E8B07A', 5)) + R(702, 612, 206, 70, 4, FL('#9A6238')) + R(702, 694, 206, 70, 4, FL('#9A6238')) + R(690, 600, 230, 12, 6, O('#F2C48E', 4));
    const BK = ['#E8503A', '#3DA8D8', '#FFD23F', '#5CB85A', '#8A5CFF', '#FF8A2A', '#F2F2F2'];
    let bd = '';
    for (let i = 0; i < 9; i++) bd += `<rect x="${708 + i * 22}" y="${f(622 + hash(i) * 14)}" width="19" height="${f(60 - hash(i) * 14)}" rx="2" fill="${C(BK[i % 7])}" stroke="${tn.line}" stroke-width="${f(2.5 * tn.lw)}"/>`;
    b += bd + R(712, 712, 60, 52, 6, O('#FF8A2A', 3)) + R(780, 704, 54, 60, 6, O('#3DA8D8', 3)) + T('?', 807, 744, 26, C('#FFFFFF'));
    b += G(R(-24, -44, 48, 40, 8, O('#B9C3CF', 3.5)) + CI(-9, -26, 6, FL('#3DFF9A')) + CI(9, -26, 6, FL('#3DFF9A')) + R(-18, -4, 36, 30, 6, O('#9AA4B4', 3.5)) + P('M0 -44 V-58', LN(3)) + CI(0, -60, 5, O('#FF4D5E', 2)) + P('M-18 6 L-34 -10 M18 6 L34 16', LN(6, '#7A8494')), 'translate(870 762)');
    b += P('M846 600 L850 576 L880 576 L884 600 Z', O('#E8603C', 3.5)) + P(dC(856, 566, 11) + dC(874, 562, 12) + dC(865, 552, 10), O('#5CB85A', 3));
    m += b;
  }
  // posters + cork board under the slope
  m += obbyPoster(204, 412, 160, 212, -3, tn);
  {
    let c = R(-108, -78, 216, 156, 8, O('#C98A52', 5)) + R(-98, -68, 196, 136, 4, FL('#E0B17A'));
    if (det > 0) c += P('M-80 -50 h4 M-40 20 h4 M50 -40 h4 M70 40 h4 M-70 50 h4 M10 -10 h4', LN(4, '#B8824A', det));
    // photo: hero + Ivy (kindergarten), Bea's drawing, a "STAGE 500" screenshot
    c += G(R(-36, -34, 72, 68, 3, O('#FFFFFF', 3)) + R(-30, -28, 60, 46, 0, FL('#9FD8FF')) + R(-22, -6, 16, 24, 3, FL('#D8262E')) + R(-24, -20, 20, 16, 5, FL('#B84B02')) + R(6, -6, 16, 24, 3, FL('#3FA650')) + CI(14, -16, 10, FL('#3A2A2A')), 'translate(-52 -8) rotate(-6)');
    c += G(R(-34, -30, 68, 60, 2, O('#FFF8EC', 3)) + P('M-20 10 L-8 -14 L4 10 Z M-14 0 H-2', LN(3, '#FF4FB0')) + CI(16, -8, 9, LN(3, '#FFB13B')) + P('M-24 22 Q0 12 24 22', LN(3, '#3DA8D8')), 'translate(30 -24) rotate(5)');
    c += G(R(-30, -20, 60, 40, 2, O('#2A1A4A', 3)) + R(-22, 4, 14, 5, 1, FL('#3DFF9A')) + R(2, -6, 14, 5, 1, FL('#33D6FF')) + TF('500!', 0, -4, 12, C('#FFE14D')), 'translate(44 34) rotate(-3)');
    c += CI(-52, -42, 5, O('#FF4D5E', 2)) + CI(30, -54, 5, O('#3DA8D8', 2)) + CI(44, 14, 5, O('#FFD23F', 2));
    m += G(c, 'translate(430 386) rotate(2)');
  }
  // string lights along the slope + ceiling edge (glow at night)
  const LIGHT_PTS = [];
  {
    let wire = 'M-320 ' + f(slopeY(-320) + 40);
    for (let i = 0; i < 12; i++) {
      const xa = -320 + i * 72, xb = xa + 72;
      const ya = Math.min(slopeY(xa), slopeY(-9999)) + 40, yb = Math.max(slopeY(xb), HR.ceil) + 40;
      const yA = xa < 400 ? slopeY(xa) + 40 : HR.ceil + 40, yB = xb < 400 ? slopeY(xb) + 40 : HR.ceil + 40;
      wire += ` Q${f((xa + xb) / 2)} ${f((yA + yB) / 2 + 26)} ${f(xb)} ${f(yB)}`;
      LIGHT_PTS.push([(xa + xb) / 2, (yA + yB) / 2 + 16 + 4, i]);
      void ya; void yb;
    }
    m += P(wire, LN(3));
    const BC = ['#FFE066', '#FF8A6A', '#7DFFC0', '#8FD0FF'];
    let bulbs = ['', '', '', ''];
    for (const [x, y, i] of LIGHT_PTS) bulbs[i % 4] += dE(x, y + 10, 7, 10);
    bulbs.forEach((d, i) => { m += P(d, O(nite || o.lights ? '!' + BC[i] : mix(BC[i], '#FFFFFF', 0.4), 2.5)); });
  }
  // wall clock above Gary's spot
  m += wallClock(HR.clock.x, HR.clock.y, HR.clock.r, o.clock ?? '7:30', tn, { rim: '#2E9C9C', bell: '#FFC23A' });
  // shelf over the desk: trophy, model rocket (Ivy), mini figure, plant, books
  {
    let s = R(1110, 250, 560, 18, 5, O('#C98A52', 4)) + P('M1140 268 L1140 290 L1162 268 M1640 268 L1640 290 L1618 268', LN(6, '#8A5A33'));
    s += G(P('M-20 -54 Q-20 -24 0 -20 Q20 -24 20 -54 Z', O('#FFC23A', 4)) + P('M-20 -48 Q-34 -48 -30 -36 Q-26 -28 -16 -30 M20 -48 Q34 -48 30 -36 Q26 -28 16 -30', LN(4)) + R(-6, -20, 12, 8, 2, O('#FFC23A', 3)) + R(-18, -12, 36, 12, 3, O('#7E4A2A', 3)) + TF('500', 0, -32, 11, C('#7E4A2A')), 'translate(1160 250)');
    s += G(P('M0 -86 Q12 -70 12 -40 L12 -10 L-12 -10 L-12 -40 Q-12 -70 0 -86 Z', O('#F2F2F2', 3.5)) + P('M-12 -24 L-24 -6 L-12 -10 Z M12 -24 L24 -6 L12 -10 Z', O('#E8503A', 3)) + CI(0, -50, 6, O('#33D6FF', 2.5)) + P('M-6 -10 L0 0 L6 -10', O('#FFB13B', 2.5)), 'translate(1240 250) rotate(-8)');
    let bk = '';
    const BK = ['#3DA8D8', '#FFD23F', '#E8503A', '#8A5CFF', '#5CB85A'];
    for (let i = 0; i < 5; i++) bk += `<rect x="${1300 + i * 20}" y="${f(196 + hash(i + 7) * 12)}" width="17" height="${f(54 - hash(i + 7) * 12)}" rx="2" fill="${C(BK[i])}" stroke="${tn.line}" stroke-width="${f(2.5 * tn.lw)}"/>`;
    s += bk + G(R(-12, -40, 24, 22, 4, O('#FFFFFF', 2.5)) + R(-14, -44, 28, 10, 3, FL('#B84B02')) + R(-12, -18, 24, 18, 2, O('#D8262E', 2.5)) + CI(-5, -30, 2.5, FL(LINE)) + CI(5, -30, 2.5, FL(LINE)), 'translate(1430 250)');
    s += P('M1500 250 L1504 226 L1536 226 L1540 250 Z', O('#E8603C', 3.5)) + P('M1520 226 Q1500 200 1488 206 M1520 226 Q1530 196 1548 192 M1520 226 Q1516 190 1520 180', LN(6, '#5CB85A'));
    s += G(R(-26, -30, 52, 30, 4, O('#2A2D38', 3)) + R(-20, -24, 40, 18, 2, FL('#33D6FF')) + TF('GG', 0, -10, 13, C('#FFFFFF')), 'translate(1600 250)');
    m += s;
  }
  // headphones on a hook at the shelf end (o.headphones false hides them)
  if (o.headphones !== false) m += P('M1640 268 V286', LN(5)) + G(P('M-34 30 Q-34 -12 0 -12 Q34 -12 34 30', LN(14)) + P('M-34 30 Q-34 -12 0 -12 Q34 -12 34 30', LN(7, '#E8503A')) + R(-46, 20, 22, 40, 9, O('#2A2D38', 4)) + R(24, 20, 22, 40, 9, O('#2A2D38', 4)), 'translate(1640 300)');
  // ---- the gaming desk
  {
    let d = R(D.x0 + 14, D.top + 18, 166, HR.base + 22 - D.top - 18, 6, O('#3A3F52', 5)) + R(D.x0 + 26, D.top + 32, 142, 60, 5, O('#4A5068', 3.5)) + R(D.x0 + 26, D.top + 104, 142, 60, 5, O('#4A5068', 3.5));
    d += R(D.x0 + 82, D.top + 56, 30, 8, 4, FL('#9AA4B4')) + R(D.x0 + 82, D.top + 128, 30, 8, 4, FL('#9AA4B4'));
    d += R(D.x1 - 46, D.top + 18, 26, HR.base + 22 - D.top - 18, 5, O('#3A3F52', 5)) + P(`M${D.x0 + 180} ${D.top + 60} L${D.x1 - 46} ${D.top + 60}`, LN(10, '#2A2D38'));
    d += R(D.x0, D.top - 4, D.x1 - D.x0, 26, 6, O('#2E3242', 5)) + R(D.x0 + 6, D.top, D.x1 - D.x0 - 12, 5, 2, FL('#4A5068'));
    d += R(D.x0 + 186, D.top + 22, D.x1 - D.x0 - 240, 7, 3, { fill: 'url(#shRGB)', opacity: f(nite ? 1 : 0.75) });
    m += d;
  }
  // monitor (front, big) with RGB back-glow, keyboard, mouse, juice box
  {
    const x0 = M.cx - M.w / 2, y0 = M.cy - M.h / 2;
    let mn = '';
    if (nite) mn += R(x0 - 26, y0 - 22, M.w + 52, M.h + 46, 30, { fill: 'url(#shRGB)', opacity: 0.35 });
    mn += R(M.cx - 16, y0 + M.h + 8, 32, 26, 3, O('#2A2D38', 4)) + E(M.cx, D.top - 2, 76, 9, O('#2A2D38', 4));
    mn += R(x0 - 14, y0 - 14, M.w + 28, M.h + 36, 12, O('#24262E', 6)) + R(M.cx - 30, y0 + M.h + 8, 60, 8, 4, FL('#3A3F52')) + CI(x0 + M.w - 6, y0 + M.h + 12, 3, FL(monOn ? '#3DFF9A' : '#FF8A2A'));
    let scr = R(x0, y0, M.w, M.h, 4, FL(monOn ? '#05060A' : '#141824'));
    if (monOn) scr += G(G(screenOf(o.monitor, M.w, M.h), tr(M.cx, M.cy)), null, { 'clip-path': 'url(#shClipHRMon)' });
    else scr += P(`M${x0 + 30} ${y0} L${x0 + 120} ${y0} L${x0 + 40} ${y0 + M.h} L${x0} ${y0 + M.h} L${x0} ${y0 + 60} Z`, { fill: '#FFFFFF', opacity: 0.06 });
    scr += R(x0, y0, M.w, M.h, 4, { fill: 'url(#shShine)', opacity: 0.6 });
    mn += scr + R(x0, y0, M.w, M.h, 4, LN(3.5, '#0A0B10'));
    // sticky note on the bezel
    mn += G(R(-22, -20, 44, 40, 2, O('#FFE45C', 2.5)) + TF('999', 0, 2, 12, C('#3A2A55')) + TF('!!!', 0, 14, 10, C('#E8503A')), `translate(${x0 + 8} ${y0 - 2}) rotate(-8)`);
    m += mn;
    // keyboard (RGB under dark keys) + mouse + juice box
    const kb = dP([[1238, 604], [1472, 604], [1484, 628], [1226, 628]]);
    m += P(kb, { fill: 'url(#shRGB)', stroke: tn.line, 'stroke-width': f(4 * tn.lw), 'stroke-linejoin': 'round' }) + P(kb, { fill: 'url(#shKeys)', opacity: f(0.85) });
    m += E(1528, 622, 15, 8, O('#2A2D38', 3)) + E(1528, 618, 5, 3, FL('#33D6FF')) + R(1500, 626, 70, 6, 2, FL('#1E2029'));
    m += G(R(-14, -40, 28, 40, 3, O('#5CB85A', 3)) + R(-14, -26, 28, 12, 0, FL('#FFFFFF')) + P('M6 -40 L10 -58', LN(3.5, '#FF4D5E')), 'translate(1175 630)');
  }
  // desk lamp (right end)
  {
    const on = !!o.lamp;
    let l = E(0, 0, 26, 7, O('#2A2D38', 4)) + P('M0 -4 L12 -110 L-40 -150', LN(12)) + P('M0 -4 L12 -110 L-40 -150', LN(6, '#7DD8C0')) + CI(12, -110, 6, O('#FFC23A', 2.5));
    l += G(P('M-24 -10 L24 -10 L32 22 L-32 22 Z', O('#7DD8C0', 4)) + E(0, 22, 32, 6, O(on ? '#FFF4B8' : '#E9D9A8', 3)), 'translate(-44 -144) rotate(-24)');
    m += G(l, `translate(${D.x1 - 30} ${D.top - 4})`);
  }
  // the door (far right), opens toward the room (o.door 0..1) onto the dark landing
  {
    const Dr = HR.door, dk = b01(o.door), x0 = Dr.x0, x1 = Dr.x1, y0 = Dr.y0, y1 = HR.base;
    let dd = R(x0 - 18, y0 - 18, x1 - x0 + 36, y1 - y0 + 20, 4, O('#FFF3DC', 5));
    if (dk > 0) {
      dd += R(x0, y0, x1 - x0, y1 - y0, 0, FL('#5A4A6A')) + R(x0, y0, x1 - x0, 230, 0, FL('#D9C29A')) + P(`M${x0} ${y0 + 300} H${x1} M${x0 + 40} ${y0 + 300} V${y1} M${x0 + 110} ${y0 + 300} V${y1}`, LN(8, '#7A5236'));
      const xf = lerp(x0, x1 - 46, dk), lift = 26 * dk;
      dd += P(dP([[xf, y0 - lift], [x1, y0], [x1, y1], [xf, y1 + lift]]), O('#F28A5B', 6)) + P(`M${f(xf)} ${f(y0 - lift)} L${f(xf - 14 * dk)} ${f(y0 - lift + 6)} L${f(xf - 14 * dk)} ${f(y1 + lift - 4)} L${f(xf)} ${f(y1 + lift)}`, O('#C9663E', 4));
      dd += CI(lerp(x0 + 24, x1 - 40, dk) + 4, lerp(540, 540, dk), 9, O('#FFC23A', 3));
    } else {
      dd += R(x0, y0, x1 - x0, y1 - y0, 4, O('#F28A5B', 6));
      dd += P(dRR(x0 + 22, y0 + 24, x1 - x0 - 44, 170, 8) + dRR(x0 + 22, y0 + 224, x1 - x0 - 44, 230, 8), { fill: C('#F59A70'), stroke: C('#C9663E'), 'stroke-width': 4 });
      dd += CI(x0 + 22, 540, 10, O('#FFC23A', 3.5));
      // sign + mini hoop
      dd += G(R(-62, -34, 124, 68, 6, O('#FFFFFF', 4)) + TF('DO NOT', 0, -8, 18, C('#E8503A')) + TF('DISTURB', 0, 12, 18, C('#E8503A')) + TF('(speedrunning)', 0, 28, 11, C('#3A3F52')), `translate(${(x0 + x1) / 2} ${y0 + 112}) rotate(-3)`);
      dd += R((x0 + x1) / 2 - 34, y0 + 4, 68, 40, 3, O('#FFFFFF', 3)) + P(`M${(x0 + x1) / 2 - 22} ${y0 + 44} h44`, LN(5, '#FF6A2E')) + P(`M${(x0 + x1) / 2 - 20} ${y0 + 46} l6 22 h28 l6 -22`, LN(2.5, '#FFFFFF'));
    }
    dd += R(x1 + 44, 470, 22, 36, 4, O('#FFF8EC', 3)) + R(x1 + 51, 478, 8, 14, 2, FL('#C9C3B4'));
    m += dd;
  }
  // ---- bed (head at the left)
  {
    const by = HR.bed.top;
    let b = P(`M26 ${by + 178} L26 ${by - 196} Q26 ${by - 236} 61 ${by - 236} Q96 ${by - 236} 96 ${by - 196} L96 ${by + 178} Z`, O('#C98A52', 6)) + R(40, by - 180, 42, 150, 10, FL('#E0A468'));
    b += R(70, by + 50, 590, 76, 8, O('#B9764A', 5)) + R(80, by + 60, 570, 12, 6, FL('#D99A5C'));
    b += R(94, by + 124, 26, 52, 4, O('#8A5A33', 4)) + R(610, by + 124, 26, 52, 4, O('#8A5A33', 4));
    b += R(84, by - 4, 560, 58, 18, O('#FFF6E8', 5)) + R(92, by + 38, 544, 10, 5, FL('#E6D8C4'));
    b += P(`M104 ${by + 2} Q96 ${by - 56} 148 ${by - 60} L224 ${by - 60} Q262 ${by - 56} 256 ${by + 2} Q224 ${by + 12} 180 ${by + 10} Q130 ${by + 12} 104 ${by + 2} Z`, O('#FFFFFF', 5)) + P(`M120 ${by - 18} Q180 ${by - 4} 244 ${by - 22}`, LN(5, '#8FD8C0'));
    b += P(`M624 ${by + 178} L624 ${by - 40} Q624 ${by - 64} 645 ${by - 64} Q666 ${by - 64} 666 ${by - 40} L666 ${by + 178} Z`, O('#C98A52', 6));
    m += b;
  }
  // floor: honey planks in perspective + the lavender rug
  {
    let fl = R(XL, HR.base, XR - XL, YB - HR.base, 0, FL('#E9B37C'));
    if (det > 0) {
      let dl = '';
      const vx = 960, vy = -900;
      for (let x = -900; x <= 2820; x += 116) { const k = (YB - vy) / (HR.base - vy); dl += `M${f(x)} ${HR.base} L${f(vx + (x - vx) * k)} ${YB} `; }
      for (let i = 0; i < 26; i++) { const y = HR.base + 30 + i * i * 2.2 + i * 18; const x = -600 + hash(i * 3.1) * 3000; dl += `M${f(x)} ${f(y)} h${f(60 + 60 * hash(i))} `; }
      fl += P(dl, LN(3, '#C98A52', 0.7 * det));
    }
    fl += P(dP(HR.rug), O('#8D6CE0', 5));
    fl += P(dP([[598, 804], [1142, 804], [1238, 996], [502, 996]]), { fill: 'none', stroke: C('#FFF3DC'), 'stroke-width': 7, 'stroke-dasharray': '22 14', opacity: f(0.75) });
    fl += P(dP([[640, 826], [1100, 826], [1176, 976], [564, 976]]), { fill: 'none', stroke: C('#A88CF0'), 'stroke-width': 5 });
    // the baseboard shadow
    fl += band(HR.base, HR.base + 12, { fill: '#000', opacity: 0.08 });
    m += fl;
  }
  // mess on the floor (keeps the rug centre clear)
  {
    const mess = b01(o.mess, 0.35);
    const items = [
      () => P('M330 940 q10 -18 30 -10 l24 8 q8 4 2 12 l-36 2 q-18 0 -20 -12 Z', O('#FFFFFF', 4)) + P('M346 932 l26 8', LN(4, '#E8503A')),        // sock
      () => G(R(-46, -12, 92, 24, 3, O('#FFD23F', 4)) + R(-40, -8, 36, 16, 2, FL('#3DA8D8')) + TF('ZAP!', 18, 6, 13, C('#E8503A')), 'translate(1450 980) rotate(-8)'),   // comic
      () => G(P('M-30 0 L-26 -22 Q0 -30 26 -22 L30 0 Z', O('#E8503A', 4)) + P('M-20 -18 h40', LN(3, '#FFFFFF')), 'translate(1630 860)') + G(P('M-30 0 L-26 -22 Q0 -30 26 -22 L30 0 Z', O('#E8503A', 4)), 'translate(1580 880) rotate(6)'),  // sneakers
      () => G(R(-50, -14, 100, 18, 3, O('#3DA8D8', 3.5)) + R(-46, -26, 90, 14, 3, O('#FF8A2A', 3.5)) + R(-40, -38, 82, 14, 3, O('#8A5CFF', 3.5)), 'translate(1440 900) rotate(4)'),  // game cases
      () => G(R(-90, -16, 180, 22, 4, O('#E8C890', 4)) + P('M-80 -16 L-70 -40 L76 -40 L86 -16', O('#F4DCA8', 4)) + TF('PIZZA', 0, -22, 16, C('#E8503A')), 'translate(250 1010) rotate(-4)'),   // pizza box
      () => P('M560 900 Q600 860 650 880 Q690 864 720 890 L712 912 L566 914 Z', O('#3FA650', 4)) + P('M590 890 Q630 870 660 896', LN(4, '#2E8A40')),   // hoodie on the floor (left of rug)
      () => G(P('M-14 -10 Q0 -22 14 -10 Q20 6 0 12 Q-20 6 -14 -10 Z', O('#FFFFFF', 3)), 'translate(1260 1040)') + G(P('M-14 -10 Q0 -22 14 -10 Q20 6 0 12 Q-20 6 -14 -10 Z', O('#FFFFFF', 3)), 'translate(380 1056) rotate(30)'),  // paper balls
    ];
    const n = mess * items.length;
    items.forEach((fn, i) => { if (n - i > 0.5) m += fn(); });
  }
  // glitch
  const gl = glitchBits(t, b01(o.glitch), 0, 80, 1920, 700, 3);
  m += gl.bits;
  // ---------------- front: blanket + gaming chair (back view)
  let fr = '';
  {
    const by = HR.bed.top;
    if (o.sleep) {
      const bl = `M236 ${by - 40} Q330 ${by - 92} 450 ${by - 74} Q560 ${by - 62} 646 ${by - 30} L656 ${by + 116} Q610 ${by + 132} 566 ${by + 116} Q516 ${by + 136} 466 ${by + 116} Q416 ${by + 134} 366 ${by + 116} Q316 ${by + 134} 266 ${by + 116} Q240 ${by + 124} 230 ${by + 112} Z`;
      fr += P(bl, O('#E8503A', 6)) + (det > 0 ? P(bl, { fill: 'url(#shQuiltPix)', opacity: f(det) }) : '');
      fr += P(`M222 ${by - 42} Q250 ${by - 66} 290 ${by - 70} L292 ${by + 110} Q256 ${by + 118} 226 ${by + 108} Z`, O('#FFF6E8', 5)) + P(`M380 ${by - 40} Q390 ${by + 30} 372 ${by + 112} M540 ${by - 30} Q548 ${by + 40} 530 ${by + 114}`, LN(4, '#B83A2A', 0.8));
    } else {
      const bl = `M360 ${by - 4} Q400 ${by - 40} 470 ${by - 30} Q520 ${by - 58} 590 ${by - 36} Q648 ${by - 30} 650 ${by + 10} L656 ${by + 116} Q610 ${by + 132} 566 ${by + 112} Q520 ${by + 128} 470 ${by + 104} Q420 ${by + 112} 380 ${by + 80} Q350 ${by + 50} 360 ${by - 4} Z`;
      fr += P(bl, O('#E8503A', 6)) + (det > 0 ? P(bl, { fill: 'url(#shQuiltPix)', opacity: f(det) }) : '') + P(`M400 ${by - 12} Q470 ${by + 6} 520 ${by - 24} M480 ${by + 30} Q540 ${by + 50} 600 ${by + 20}`, LN(4, '#B83A2A', 0.8));
    }
  }
  if (o.chair !== false) {
    const cx = o.chairX ?? HR.chair.x, sy = HR.chair.seat;
    let c = P(`M${cx} ${sy + 20} V${sy + 74}`, LN(16)) + P(`M${cx} ${sy + 20} V${sy + 74}`, LN(8, '#7A8094'));
    c += P(`M${cx - 70} ${sy + 96} L${cx} ${sy + 74} L${cx + 70} ${sy + 96} M${cx - 36} ${sy + 104} L${cx} ${sy + 74} L${cx + 36} ${sy + 104}`, LN(13)) + P(`M${cx - 70} ${sy + 96} L${cx} ${sy + 74} L${cx + 70} ${sy + 96} M${cx - 36} ${sy + 104} L${cx} ${sy + 74} L${cx + 36} ${sy + 104}`, LN(6, '#3A3F52'));
    c += CI(cx - 72, sy + 102, 9, O('#2A2D38', 3)) + CI(cx + 72, sy + 102, 9, O('#2A2D38', 3)) + CI(cx - 36, sy + 110, 9, O('#2A2D38', 3)) + CI(cx + 36, sy + 110, 9, O('#2A2D38', 3));
    c += R(cx - 104, sy - 14, 208, 36, 14, O('#2A2D38', 5)) + R(cx - 118, sy - 60, 26, 60, 8, O('#2A2D38', 4)) + R(cx + 92, sy - 60, 26, 60, 8, O('#2A2D38', 4));
    c += P(`M${cx - 86} ${sy + 10} L${cx - 80} ${sy - 150} Q${cx - 76} ${sy - 188} ${cx} ${sy - 190} Q${cx + 76} ${sy - 188} ${cx + 80} ${sy - 150} L${cx + 86} ${sy + 10} Z`, O('#D8262E', 6));
    c += P(`M${cx - 30} ${sy - 182} L${cx - 30} ${sy + 4} M${cx + 30} ${sy - 182} L${cx + 30} ${sy + 4}`, LN(14, '#2A2D38')) + P(`M${cx} ${sy - 174} V${sy}`, LN(8, '#FFD23F', 0.9));
    c += R(cx - 46, sy - 168, 92, 30, 13, O('#2A2D38', 4)) + R(cx - 60, sy - 64, 120, 24, 10, FL('#B01D24'));
    fr += c;
  }
  // ---------------- light
  let light = '';
  const cpt = HR.checkpoint;
  if (nite) {
    const mg = monOn ? b01(o.monitorGlow, 1) : 0;
    if (mg > 0) {
      light += pool(M.cx - 80, 930, 620, 130, '#9FD0FF', 0.22 * mg, 4) + glow(M.cx, M.cy, 420, 'shGlowBlue', 0.5 * mg);
      light += darkRing(M.cx - 60, M.cy + 140, 560, 420, '#05081C', 0.5);
    } else {
      light += P(dP([[W.x0, W.y1], [W.x1, W.y1], [W.x1 + 120, 1010], [W.x0 - 220, 1010]]), { fill: 'url(#shBeamBlue)', opacity: 0.3 }) + darkRing(800, 640, 640, 420, '#05081C', 0.45);
    }
    const lk = o.lights === undefined ? 1 : b01(o.lights);
    if (lk > 0) for (const [x, y] of LIGHT_PTS) light += glow(x, y + 10, 40, 'shGlowWarm', 0.75 * lk);
    light += P(`M${D.x0 + 190} ${D.top + 30} L${D.x1 - 60} ${D.top + 30} L${D.x1 - 20} ${HR.base + 60} L${D.x0 + 170} ${HR.base + 60} Z`, { fill: 'url(#shRGB)', opacity: 0.1 });
  } else if (morn || time === 'day') {
    const k = morn ? 1 : 0.6;
    light += P(dP([[W.x0 + 10, W.y0 + 10], [W.x1 - 10, W.y0 + 10], [W.x1 + 330, 1000], [W.x0 + 20, 1000]]), { fill: 'url(#shBeam)', opacity: f(0.42 * k * (1 - storm)) });
    if (morn) light += cover({ fill: '#FFB070', opacity: 0.06 });
  }
  if (o.lamp) light += glow(D.x1 - 80, D.top - 60, 300, 'shGlowWarm', 0.8);
  if (green > 0) light += cover({ fill: '#2BFF8A', opacity: f(0.15 * green) }) + glow(cpt.x, cpt.y - 40, 380, 'shGlowGreen', green) + glow(M.cx, M.cy, 380, 'shGlowGreen', 0.8 * green);
  if (red > 0) light += cover({ fill: '#FF2440', opacity: f(0.13 * red) }) + glow(cpt.x, cpt.y - 40, 360, 'shGlowRed', red);
  if (flash > 0) light += cover({ fill: '#EEF4FF', opacity: f(0.4 * flash) }) + P(dP([[W.x0, W.y1], [W.x1, W.y1], [W.x1 + 260, 1040], [W.x0 - 140, 1040]]), { fill: '#FFFFFF', opacity: f(0.4 * flash) });
  if (gl.dx) { m = G(m, `translate(${f(gl.dx)} 0)`); }
  return { bg, mid: m, front: fr, fg: '', light };
}
def('<clipPath id="shClipHRMon"><rect x="1120" y="323" width="470" height="264" rx="4"/></clipPath>');
const heroRoom = makeSet(heroRoomLayers);

// ================================================================= 5. MEGA OBBY: 1000 STAGES — the game
// Shared look: violet night sky, neon studded platforms, red kill bricks, green checkpoint pads, orange lava below.
const OBBY_COLS = ['#3DFF9A', '#33D6FF', '#FF4FD8', '#FFD23F', '#9A7CFF', '#FF8A3D'];
def(pat('shStud', 28, 16, '<ellipse cx="14" cy="9" rx="7" ry="3.4" fill="#000" opacity="0.12"/><ellipse cx="14" cy="7.4" rx="7" ry="3.4" fill="#FFF" opacity="0.28"/>'));
def(lg('shLavaGlow', [[0, '#FF6A2E', 0], [1, '#FF6A2E', 0.55]]));
def(lg('shLava', [[0, '#FFB23A'], [0.25, '#FF6A1F'], [1, '#C8300E']]));
// tiny blocky YOU avatar (red jacket, yellow shirt, green pants, orange bowl cut). origin = feet; 56 px tall at s = 1.
// pose: { run (phase rad), up 0..1 (arms up), rot (deg), sq (squash) }
function miniAvatar(x, y, s = 1, pose = {}) {
  const ph = pose.run, up = pose.up || 0, sw = 2.4;
  const lg1 = ph !== undefined ? Math.sin(ph) * 30 : 0;
  const o = { stroke: LINE, 'stroke-width': sw, 'stroke-linejoin': 'round' };
  let a = '';
  a += G(R(-4, 0, 8, 17, 1.5, { fill: '#1F5A36', ...o }), `translate(-5 -17) rotate(${f(lg1)} 0 0)`) + G(R(-4, 0, 8, 17, 1.5, { fill: '#1F5A36', ...o }), `translate(5 -17) rotate(${f(-lg1)} 0 0)`);
  const armA = lerp(8, 160, up) + (ph !== undefined ? Math.sin(ph) * 30 : 0);
  a += G(R(-3.5, 0, 7, 17, 1.5, { fill: '#D8262E', ...o }), `translate(-11 -35) rotate(${f(armA)})`) + G(R(-3.5, 0, 7, 17, 1.5, { fill: '#D8262E', ...o }), `translate(11 -35) rotate(${f(-armA)})`);
  a += R(-11, -37, 22, 21, 2, { fill: '#D8262E', ...o }) + R(-4, -36, 8, 19, 0, { fill: '#F2D04A' });
  a += R(-9.5, -55, 19, 18, 3, { fill: '#FFFFFF', ...o }) + CI(-3.6, -45.5, 2.3, { fill: LINE }) + CI(3.6, -45.5, 2.3, { fill: LINE });
  a += P('M-11 -45 L-11 -56 Q0 -61 11 -56 L11 -45 L7 -49 L4 -50 L0 -48.5 L-4 -50 L-7 -49 Z', { fill: '#B84B02', ...o });
  const sq = pose.sq || 0;
  return G(a, `translate(${f(x)} ${f(y)}) rotate(${f(pose.rot || 0)} 0 -28) scale(${f(s * (1 + sq * 0.3))} ${f(s * (1 - sq * 0.3))})`);
}
// one obby platform: (x, y) = centre of the stand line; w wide. o: col, kill (red neon brick), cp (green checkpoint pad +
// flag, o.cpLabel), final (big golden pad + giant flag), h (front face height), t, flag 0..1 (raised), wave
function obbyPlat(x, y, w, o = {}) {
  const col = o.final ? '#FFD23F' : o.kill ? '#FF2E3E' : (o.col || '#33D6FF'), h = o.h || clamp(w * 0.14, 22, 44), t = o.t || 0;
  const top = mix(col, '#FFFFFF', 0.45);
  let p = '';
  if (o.kill) p += E(x, y, w * 0.75, 40, { fill: '#FF2E3E', opacity: f(0.18 + 0.1 * Math.sin(t * 6)) });
  p += P(dP([[x - w / 2, y - 6], [x + w / 2, y - 6], [x + w / 2 + 12, y - 20], [x - w / 2 + 12, y - 20]]), { fill: top, stroke: LINE, 'stroke-width': 3.5, 'stroke-linejoin': 'round' });
  p += R(x - w / 2, y - 6, w, h, 3, { fill: col, stroke: LINE, 'stroke-width': 4 }) + R(x - w / 2 + 2, y - 4, w - 4, h - 4, 2, { fill: 'url(#shStud)' });
  p += P(dP([[x + w / 2, y - 6], [x + w / 2 + 12, y - 20], [x + w / 2 + 12, y - 20 + h], [x + w / 2, y - 6 + h]]), { fill: mix(col, '#000000', 0.3), stroke: LINE, 'stroke-width': 3.5, 'stroke-linejoin': 'round' });
  if (o.cp || o.final) {
    const big = o.final ? 2.2 : 1, fx = o.final ? x + 20 : x + (o.cpX || 0);
    p += R(fx - 34 * big, y - 12, 68 * big, 9, 3, { fill: '#9DFFCB', stroke: LINE, 'stroke-width': 3 });
    const raise = o.flag ?? 1, ph = Math.sin(t * 5) * 5 * big;
    const ty = y - 12 - lerp(26, 120, raise) * big;
    p += P(`M${f(fx)} ${f(y - 12)} V${f(y - 12 - 130 * big)}`, { stroke: LINE, 'stroke-width': 4 * Math.sqrt(big), fill: 'none' }) + CI(fx, y - 12 - 132 * big, 5 * Math.sqrt(big), { fill: '#FFD23F', stroke: LINE, 'stroke-width': 2.5 });
    p += P(`M${f(fx)} ${f(ty - 40 * big)} Q${f(fx + 30 * big)} ${f(ty - 40 * big + ph)} ${f(fx + 62 * big)} ${f(ty - 34 * big)} L${f(fx + 62 * big)} ${f(ty - 4 * big)} Q${f(fx + 30 * big)} ${f(ty - 10 * big - ph)} ${f(fx)} ${f(ty)} Z`, { fill: '#3DFF9A', stroke: LINE, 'stroke-width': 3.5, 'stroke-linejoin': 'round' });
    if (o.cpLabel || o.final) p += TF(o.final ? '1000' : o.cpLabel, fx + 30 * big, ty - 15 * big, 15 * big, '#0E3A22');
  }
  return p;
}
// pixel moon + far tower silhouettes for the game sky (design coords)
function obbyFar(x0, x1, base, sc = 1, seed = 1) {
  let d = '', wd = '';
  for (let i = Math.floor(x0 / (260 * sc)) - 1; i * 260 * sc < x1 + 260 * sc; i++) {
    const x = i * 260 * sc + hash(i * 3.1 + seed) * 80 * sc, w = (50 + 50 * hash(i * 1.7 + seed)) * sc, h = (180 + 360 * hash(i * 5.3 + seed)) * sc;
    d += dR(x - w / 2, base - h, w, h + 400) + dR(x - w * 0.9, base - h * 0.55, w * 1.8, 16 * sc) + dR(x - w * 0.8, base - h * 0.2, w * 1.6, 14 * sc);
    wd += dR(x - 6 * sc, base - h + 20 * sc, 12 * sc, 12 * sc);
  }
  return P(d, { fill: '#2A1560', opacity: 0.85 }) + P(wd, { fill: '#FF4FD8', opacity: 0.6 });
}
function lavaBand(x0, x1, y, y1, t, amp = 12) {
  let d = `M${f(x0)} ${f(y1)} L${f(x0)} ${f(y)}`;
  for (let x = x0; x <= x1 + 60; x += 60) d += ` Q${f(x + 30)} ${f(y - amp * Math.sin(t * 2.4 + x * 0.013))} ${f(x + 60)} ${f(y + amp * 0.3 * Math.sin(t * 1.7 + x * 0.02))}`;
  d += ` L${f(x1 + 60)} ${f(y1)} Z`;
  let o = P(d, { fill: 'url(#shLava)', stroke: '#FFD23F', 'stroke-width': 6, 'stroke-linejoin': 'round' });
  let crust = '', bub = '';
  for (let i = Math.floor(x0 / 170); i * 170 < x1; i++) {
    const cx = i * 170 + 60 * hash(i * 2.2), cy = y + 40 + 50 * hash(i * 4.1);
    if (cy < y1 - 10) crust += dE(cx, cy, 34 + 20 * hash(i), 9);
    const u = md(t * 0.6 + hash(i * 7.7), 1);
    if (hash(i * 3.3) > 0.5) bub += dC(cx + 40, y + 12 - u * 26, 6 + 8 * u);
  }
  o += P(crust, { fill: '#9A2408', opacity: 0.55 }) + P(bub, { fill: '#FFD23F', opacity: 0.8 });
  return o;
}

// gameScreen(t, o) -> fn(w, h): the MEGA OBBY monitor picture for any screen box (heroRoom monitor, deskClose, phone, a
// giant sky window...). Laid out on a 1600 x 900 design box that is FIT into w x h (the sky fills the rest; the HUD hugs
// the real corners). An endless zig-zag tower of neon platforms over lava; the hero's mini avatar on the current stage;
// the final golden checkpoint flag on stage 1000 at the top.
// o: { stage (999), falls (4816), respawns (4816), jump 0..1 (the final jump: arc to the next platform; the view follows),
//   fall 0..1 (falls off into the lava + block bits), respawn 0..1 (pops on the stage's checkpoint inside a forcefield ring),
//   win 0..1 (green flood + "FINAL CHECKPOINT!" banner + block confetti), lava 0..1 (default 1), hud (default true),
//   title (default true), run (avatar run phase, rad), avatar (false hides him) }
function gameScreen(t = 0, o = {}) {
  return (w = 1600, h = 900) => {
    const k = Math.min(w / 1600, h / 900), vw = w / k, vh = h / k;
    const X0 = 800 - vw / 2, Y0 = 450 - vh / 2, X1 = X0 + vw, Y1 = Y0 + vh;
    const stage = o.stage ?? 999, jump = b01(o.jump), fall = b01(o.fall), resp = b01(o.respawn), win = b01(o.win), lava = b01(o.lava, 1);
    const zig = (i) => [0, 1, 0, -1][md(i, 4)];
    const scroll = ease.inOut(jump) * 120 + win * 0;
    const px = (i) => (i >= 1000 ? 800 : 800 + zig(i) * 300), py = (i) => 600 - (i - stage) * 150 + scroll;
    let c = R(X0, Y0, vw, vh, 0, { fill: 'url(#shSkyGame)' }) + R(X0, Y0, vw, vh * 0.7, 0, { fill: 'url(#shStars)', opacity: 0.7 });
    c += P('M1240 120 h60 v12 h12 v48 h-12 v12 h-60 v-12 h-12 v-48 h12 Z', { fill: '#FFF0C8', stroke: LINE, 'stroke-width': 4 }) + R(1262, 140, 14, 14, 0, { fill: '#E8D2A0' });
    c += obbyFar(X0, X1, 900, 1, 2);
    // the spire
    const topY = stage >= 999 ? py(1000) : Y0 - 50;
    c += R(788, topY + 10, 24, 1000, 4, { fill: '#3A2280', stroke: LINE, 'stroke-width': 4 });
    let rungs = '';
    for (let y = topY + 40; y < 900; y += 60) rungs += dR(794, y, 12, 6);
    c += P(rungs, { fill: '#FF4FD8', opacity: 0.7 });
    // platforms (current-3 .. current+3), lower ones fade into the lava haze
    for (let i = stage - 4; i <= Math.min(stage + 4, 1000); i++) {
      const y = py(i);
      if (y < Y0 - 80 || y > Y1 + 60) continue;
      const fin = i >= 1000;
      const plat = obbyPlat(px(i), y, fin ? 360 : 220, { col: OBBY_COLS[md(i, OBBY_COLS.length)], kill: !fin && md(i, 3) === 1 && i !== stage, cp: !fin && i === stage, cpX: -50, cpLabel: String(i), final: fin, cpLabel2: '', t, flag: fin ? 0.6 + 0.4 * Math.max(jump >= 1 ? 1 : 0, win) : 1 });
      if (fin && win > 0) c += K_rays(px(i) + 30, y - 150, 14, 520, '#FFF4A8', 0.18 * win, t * 30);
      c += i < stage ? G(plat, null, { opacity: f(clamp(1 - (stage - i) * 0.22, 0.3, 1)) }) : plat;
    }
    // lava
    if (lava > 0) c += R(X0, 640, vw, Y1 - 640, 0, { fill: 'url(#shLavaGlow)', opacity: f(lava) }) + lavaBand(X0 - 60, X1 + 60, 832, Y1 + 40, t, 14);
    // the avatar
    if (o.avatar !== false) {
      const x0 = px(stage) - 50, y0 = py(stage) - 12;
      let av = '';
      if (fall > 0) {
        const u = ease.in(fall);
        const ax = x0 - 140 * fall, ay = y0 + u * (832 - y0 + 20);
        if (fall < 0.9) av += miniAvatar(ax, ay, 1.5, { up: 1, rot: -fall * 500 });
        else {
          // block bits + lava splash
          const v = (fall - 0.9) / 0.1;
          let bits = '';
          const BC = ['#D8262E', '#F2D04A', '#1F5A36', '#B84B02', '#FFFFFF'];
          for (let i = 0; i < 10; i++) { const a = -Math.PI * (0.1 + 0.8 * hash(i * 2.1)); bits += R(ax + Math.cos(a) * 90 * v - 6, 820 + Math.sin(a) * 120 * v + 60 * v * v - 6, 12, 12, 2, { fill: BC[i % 5], stroke: LINE, 'stroke-width': 2 }); }
          av += bits + P(`M${f(ax - 40)} 830 Q${f(ax - 20)} ${f(800 - 50 * (1 - v))} ${f(ax)} 830 Q${f(ax + 20)} ${f(790 - 60 * (1 - v))} ${f(ax + 40)} 830 Z`, { fill: '#FFD23F', stroke: LINE, 'stroke-width': 3 });
        }
      } else if (jump > 0) {
        const j = ease.inOut(jump), x1 = px(stage + 1) - (stage + 1 >= 1000 ? 60 : 30), y1 = py(stage + 1) - 12;
        const ax = lerp(x0, x1, j), ay = lerp(y0, y1, j) - 4 * 170 * j * (1 - j);
        av += miniAvatar(ax, ay, 1.5, { up: jump < 0.95 ? 1 : 0.3, rot: jump < 0.95 ? -12 + 24 * j : 0, sq: jump > 0.95 ? (1 - jump) * 8 : 0 });
      } else if (resp > 0) {
        const pop = ease.outBack(clamp((resp - 0.15) / 0.35, 0, 1)), ring = clamp(resp / 0.4, 0, 1), fade = 1 - clamp((resp - 0.6) / 0.4, 0, 1);
        if (pop > 0.01) av += G(miniAvatar(0, 0, 1.5), `translate(${f(x0)} ${f(y0)}) scale(${f(pop)})`);
        av += E(x0, y0 - 42, 46 * ring + 6, 62 * ring + 6, { fill: '#7DFFD0', opacity: f(0.18 * fade), stroke: '#9DFFE0', 'stroke-width': 5 });
        if (resp < 0.3) av += R(x0 - 70, y0 - 140 * (1 - resp / 0.3), 140, 10, 4, { fill: '#9DFFE0', opacity: 0.8 });
      } else av += miniAvatar(x0, y0, 1.5, o.run !== undefined ? { run: o.run } : {});
      c += av;
    }
    // win: green flood + banner + confetti
    if (win > 0) {
      c += R(X0, Y0, vw, vh, 0, { fill: '#3DFF9A', opacity: f(0.72 * ease.out(win)) });
      let cf = '';
      for (let i = 0; i < 22; i++) cf += `<rect x="${f(X0 + hash(i * 3.7) * vw)}" y="${f(Y0 + md(hash(i * 1.3) * vh + t * 260 * (0.6 + hash(i)), vh))}" width="22" height="22" rx="3" fill="${OBBY_COLS[i % 6]}" stroke="${LINE}" stroke-width="3" transform="rotate(${f(t * 90 + i * 40)} ${f(X0 + hash(i * 3.7) * vw + 11)} ${f(Y0 + md(hash(i * 1.3) * vh + t * 260 * (0.6 + hash(i)), vh) + 11)})"/>`;
      c += G(cf, null, { opacity: f(clamp(win * 3, 0, 1)) });
      const bs = ease.outBack(clamp((win - 0.1) / 0.4, 0, 1));
      if (bs > 0.01) c += G(R(-470, -80, 940, 160, 40, { fill: '#0E3A22', stroke: LINE, 'stroke-width': 8 }) + R(-456, -66, 912, 132, 32, { fill: 'none', stroke: '#9DFFCB', 'stroke-width': 5 }) + T('FINAL CHECKPOINT!', 0, 28, 84, '#FFFFFF'), `translate(800 450) scale(${f(bs)})`);
    }
    // HUD
    if (o.hud !== false) {
      const st = jump >= 1 || win > 0 ? Math.min(stage + 1, 1000) : stage;
      c += G(R(0, 0, 330, 84, 26, { fill: '#140A33', opacity: 0.78, stroke: '#FFFFFF', 'stroke-width': 4 }) + TF('STAGE', 24, 56, 34, '#FFFFFF', { 'text-anchor': 'start' }) + T(String(st), 150, 62, 58, '#FFE14D', { 'text-anchor': 'start' }), `translate(${f(X0 + 30)} ${f(Y0 + 28)})`);
      if (o.title !== false) c += T('MEGA OBBY · 1000 STAGES', 800, Y0 + 70, 40, '#FFFFFF', { ...OUTX(7), opacity: 0.9 });
      const fl = (o.falls ?? 4816).toLocaleString('en-US'), rs = (o.respawns ?? 4816).toLocaleString('en-US');
      const txt = `FALLS: ${fl}  ·  RESPAWNS: ${rs}`, bw = 160 + txt.length * 21;
      c += G(R(-bw / 2, -36, bw, 72, 30, { fill: '#140A33', opacity: 0.8, stroke: '#FFFFFF', 'stroke-width': 4 }) + TF(txt, 0, 14, 38, '#FFFFFF'), `translate(800 ${f(Y1 - 62)})`);
      // progress bar (right)
      const pr = clamp(st / 1000, 0, 1);
      c += G(R(-14, 0, 28, 400, 14, { fill: '#140A33', opacity: 0.7, stroke: '#FFFFFF', 'stroke-width': 3 }) + R(-8, 6 + 388 * (1 - pr), 16, 388 * pr, 8, { fill: '#3DFF9A' }) + CI(0, 6 + 388 * (1 - pr), 14, { fill: '#FFE14D', stroke: LINE, 'stroke-width': 3 }), `translate(${f(X1 - 50)} ${f(Y0 + 160)})`);
    }
    const id = S.uid('shGS');
    return `<defs><clipPath id="${id}"><rect x="${f(-w / 2)}" y="${f(-h / 2)}" width="${f(w)}" height="${f(h)}"/></clipPath></defs>` + G(G(c, `scale(${f(k)}) translate(-800 -450)`), null, { 'clip-path': `url(#${id})` });
  };
}
// sun rays (local, like K.rays)
function K_rays(cx, cy, n, r, col, op, rot = 0) {
  let d = '';
  for (let i = 0; i < n; i++) {
    const a0 = ((i / n) * 360 + rot) * Math.PI / 180, a1 = (((i + 0.5) / n) * 360 + rot) * Math.PI / 180;
    d += `M${f(cx)} ${f(cy)} L${f(cx + r * Math.cos(a0))} ${f(cy + r * Math.sin(a0))} L${f(cx + r * Math.cos(a1))} ${f(cy + r * Math.sin(a1))} Z `;
  }
  return P(d, { fill: col, opacity: f(op) });
}

// obbyWorld(t, cam, o) — FULL-FRAME "inside the game": the hero (rig, s .4) runs and jumps along a course of neon platforms
// over a lava sea (world x -700..5200; walk/jump to the RIGHT). Same look as gameScreen. Layers (parallax k): sky 0, moon .03,
// far towers .12, floating deco .4, course + lava 1 (SPOTS.obbyWorld.platforms[i] = {x, x0, x1, y (stand line), k 1, kill, cp}),
// embers 1.2 (fg). Checkpoints (green pads + flags) at SPOTS.obbyWorld.checkpoints (stages o.stage .. +2), the giant FINAL
// flag platform at SPOTS.obbyWorld.final. Lava surface y 950 (SPOTS.obbyWorld.lavaY): fall in and crumble.
// o: { stage (997: the first checkpoint's number), lava 0..1 (glow, default 1), win 0..1 (green flash + confetti + flag up),
//   flag 0..1 (final flag raised, default .6) }
const OBBY_COURSE = [
  { x: 260, w: 640, y: 760, cp: 0 }, { x: 900, w: 200, y: 700 }, { x: 1240, w: 170, y: 640, kill: true }, { x: 1590, w: 230, y: 720 },
  { x: 1960, w: 180, y: 610 }, { x: 2340, w: 300, y: 680, cp: 1 }, { x: 2720, w: 150, y: 600 }, { x: 3040, w: 210, y: 520, kill: true },
  { x: 3380, w: 170, y: 600 }, { x: 3760, w: 300, y: 560, cp: 2 }, { x: 4140, w: 170, y: 480 }, { x: 4480, w: 190, y: 430, kill: true },
  { x: 5020, w: 620, y: 400, final: true },
];
function obbyWorldLayers(t, cam = {}, o = {}) {
  const lava = b01(o.lava, 1), win = b01(o.win), st = o.stage ?? 997;
  const v0 = vis(cam, 0);
  let sky = R(v0.x0 - 200, v0.y0 - 200, v0.x1 - v0.x0 + 400, v0.y1 - v0.y0 + 400, 0, { fill: 'url(#shSkyGame)' }) + R(v0.x0 - 200, v0.y0 - 200, v0.x1 - v0.x0 + 400, (v0.y1 - v0.y0) * 0.7 + 200, 0, { fill: 'url(#shStars)', opacity: 0.7 });
  const moon = P('M1500 130 h90 v18 h18 v72 h-18 v18 h-90 v-18 h-18 v-72 h18 Z', { fill: '#FFF0C8', stroke: LINE, 'stroke-width': 5 }) + R(1530, 160, 20, 20, 0, { fill: '#E8D2A0' }) + R(1560, 200, 14, 14, 0, { fill: '#E8D2A0' });
  const vf = vis(cam, 0.12);
  const far = obbyFar(vf.x0 - 300, vf.x1 + 300, 1000, 1.3, 5);
  // floating deco (k .4): small platforms + a giant "MEGA OBBY" sign
  const vd = vis(cam, 0.4);
  let deco = '';
  for (let i = Math.floor((vd.x0 - 400) / 520); i * 520 < vd.x1 + 400; i++) {
    const x = i * 520 + 200 * hash(i * 2.9), y = 300 + 260 * hash(i * 4.3);
    deco += G(obbyPlat(x, y, 120 + 60 * hash(i), { col: OBBY_COLS[md(i, 6)], h: 20 }), null, { opacity: 0.55 });
  }
  deco += G(R(-260, -70, 520, 140, 24, { fill: '#140A33', stroke: '#FF4FD8', 'stroke-width': 6, opacity: 0.85 }) + T('MEGA OBBY', 0, 26, 76, '#FFE14D', OUTX(8)), 'translate(1000 230) rotate(-3)');
  // course (k 1)
  const v1 = vis(cam, 1);
  let crs = '';
  let cpn = 0;
  for (const p of OBBY_COURSE) {
    if (p.x + p.w / 2 < v1.x0 - 200 || p.x - p.w / 2 > v1.x1 + 200) { if (p.cp !== undefined) cpn++; continue; }
    // a pillar down into the lava
    crs += R(p.x - 16, p.y + 20, 32, 980 - p.y, 3, { fill: '#3A2280', stroke: LINE, 'stroke-width': 4 });
    crs += obbyPlat(p.x, p.y, p.w, { col: OBBY_COLS[md(Math.round(p.x / 97), 6)], kill: p.kill, cp: p.cp !== undefined, cpLabel: p.cp !== undefined ? String(st + p.cp) : '', final: p.final, t, flag: p.final ? Math.max(o.flag ?? 0.6, win) : 1, h: 40 });
    if (p.cp !== undefined) crs += G(R(-90, -34, 180, 68, 14, { fill: '#140A33', stroke: '#FFFFFF', 'stroke-width': 4 }) + T(`STAGE ${st + p.cp}`, 0, 13, 36, '#FFFFFF'), `translate(${p.x + p.w / 2 - 90} ${p.y - 300})`) + P(`M${p.x + p.w / 2 - 90} ${p.y - 266} V${p.y - 8}`, { stroke: LINE, 'stroke-width': 6 });
    if (p.final) crs += T('1000', p.x + 120, p.y - 420, 120, '#FFE14D', OUTX(12)) + (win > 0 ? K_rays(p.x + 60, p.y - 200, 16, 900, '#FFF4A8', 0.2 * win, t * 25) : '');
  }
  void cpn;
  if (lava > 0) crs = R(v1.x0 - 300, 600, v1.x1 - v1.x0 + 600, 360, 0, { fill: 'url(#shLavaGlow)', opacity: f(lava) }) + crs;
  crs += lavaBand(v1.x0 - 200, v1.x1 + 200, 950, v1.y1 + 400, t, 16);
  // embers (k 1.2)
  const ve = vis(cam, 1.2);
  let emb = '';
  for (let i = 0; i < 24; i++) {
    const x = ve.x0 + md(hash(i * 3.1) * 2400 + t * 20, ve.x1 - ve.x0 + 200) - 100, y = 1100 - md(hash(i * 5.9) * 900 + t * (60 + 60 * hash(i)), 900);
    emb += dR(x, y, 8 + 8 * hash(i * 2), 8 + 8 * hash(i * 2));
  }
  let fg = P(emb, { fill: '#FFB23A', opacity: 0.75 });
  let light = '';
  if (win > 0) {
    light += V(cam, R(v0.x0 - 300, v0.y0 - 300, v0.x1 - v0.x0 + 600, v0.y1 - v0.y0 + 600, 0, { fill: '#3DFF9A', opacity: f(0.35 * (1 - win) + 0.12) }), 0);
    let cf = '';
    for (let i = 0; i < 30; i++) { const x = hash(i * 3.7) * 1920, y = md(hash(i * 1.3) * 1200 + t * 300 * (0.6 + hash(i)), 1200) - 100; cf += `<rect x="${f(x)}" y="${f(y)}" width="26" height="26" rx="4" fill="${OBBY_COLS[i % 6]}" stroke="${LINE}" stroke-width="3" transform="rotate(${f(t * 120 + i * 37)} ${f(x + 13)} ${f(y + 13)})"/>`; }
    light += G(cf, null, { opacity: f(clamp(win * 3, 0, 1)) });
  }
  return layersOf(V(cam, sky, 0) + V(cam, moon, 0.03) + V(cam, far, 0.12) + V(cam, deco, 0.4), V(cam, crs, 1), V(cam, fg, 1.2), light);
}
const obbyWorld = (t = 0, cam = {}, o = {}) => String(obbyWorldLayers(t, cam, o));
obbyWorld.layers = obbyWorldLayers;

// ================================================================= 1b. DESK CLOSE-UP (gaming shots)
// deskClose(t, o): the camera right at the desk. Big monitor (screen box SPOTS.deskClose.screen 1100 x 620, centre 1000, 420),
// RGB keyboard + mouse pad on the desk surface (back edge y 800) = the HANDS AREA (SPOTS.deskClose.hands: L on WASD,
// R on the mouse; arms come in from the bottom edge), Gary's bowl spot at the left (SPOTS.deskClose.bowl, ~2.3x the room scale),
// the wall clock above it, a slice of the stormy window at the far left, the desk lamp at the right.
// opts: same light opts as heroRoom { time, clock, monitor, monitorGlow, storm, flash, greenGlow, redBlink, lamp, lowGfx, glitch }
// + headphones (default true: on their stand at the right).
const DC = { scr: { cx: 1000, cy: 420, w: 1100, h: 620 }, top: 800, bowl: { x: 240, y: 884 }, clock: { x: 286, y: 196, r: 84 } };
def('<clipPath id="shClipDCMon"><rect x="450" y="110" width="1100" height="620" rx="6"/></clipPath>');
function deskCloseLayers(t, o = {}) {
  const time = o.time || 'day', nite = time === 'night', morn = time === 'morning';
  const storm = b01(o.storm), flash = b01(o.flash), green = b01(o.greenGlow), red = b01(o.redBlink), low = b01(o.lowGfx);
  const tn = tone({ night: nite ? 1 : 0, morn: morn ? 0.6 : 0, low, dim: storm && !nite ? 0.35 * storm : 0 });
  const C = tn.c, O = tn.ol, LN = tn.ln, FL = tn.fl, det = tn.detail;
  const M = DC.scr, x0 = M.cx - M.w / 2, y0 = M.cy - M.h / 2;
  const monOn = o.monitor !== undefined && o.monitor !== null && o.monitor !== false;
  // bg: the window slice at the far left
  const wx0 = -420, wx1 = 10, wy0 = 40, wy1 = 640;
  let bg = R(wx0 - 40, wy0 - 40, wx1 - wx0 + 80, wy1 - wy0 + 80, 0, { fill: `url(#${nite ? 'shSkyNight' : morn ? 'shSkyMorning' : 'shSkyDay'})` });
  if (storm > 0) bg += R(wx0 - 40, wy0 - 40, wx1 - wx0 + 80, wy1 - wy0 + 80, 0, { fill: 'url(#shSkyStorm)', opacity: f(storm) }) + G(R(wx0 - md(t * 40, 90), wy0 - 120 + md(t * 900, 120), wx1 - wx0 + 200, wy1 - wy0 + 240, 0, { fill: 'url(#shRain)' }), null, { opacity: f(0.8 * storm) });
  if (flash > 0) bg += R(wx0 - 40, wy0 - 40, wx1 - wx0 + 80, wy1 - wy0 + 80, 0, { fill: '#E8F0FF', opacity: f(0.6 * flash) }) + P(boltD(-40, 30, 420, 7), { fill: 'none', stroke: '#FFFFFF', 'stroke-width': 10, opacity: f(flash), 'stroke-linejoin': 'round' });
  // mid
  let m = '';
  const wallD = `M${XL} ${YT} H${XR} V${DC.top} H${XL} Z M${wx0} ${wy0} V${wy1} H${wx1} V${wy0} Z`;
  m += P(wallD, { fill: C('#A6DEC7'), 'fill-rule': 'evenodd' }) + (det > 0 ? G(P(wallD, { fill: 'url(#shHRPaper)', 'fill-rule': 'evenodd' }), 'scale(1.6)', { opacity: f(det) }) : '');
  m += P(`M${wx0 - 30} ${wy0 - 30} H${wx1 + 30} V${wy1 + 12} H${wx0 - 30} Z M${wx0} ${wy0} V${wy1} H${wx1} V${wy0} Z`, { fill: C('#FFF8EC'), 'fill-rule': 'evenodd', stroke: tn.line, 'stroke-width': f(8 * tn.lw) }) + R(-110, wy0, 20, wy1 - wy0, 4, O('#FFF8EC', 5));
  const cs = Math.sin(t * 1.2) * 4 + storm * 16 * Math.sin(t * 6.1);
  m += P(`M20 -60 L150 -60 Q140 300 ${f(118 + cs)} 640 Q${f(150 + cs)} 760 ${f(136 + cs)} 800 L${f(30 + cs)} 800 Q20 500 20 -60 Z`, O('#F2735A', 7)) + P(`M66 -50 Q76 300 ${f(76 + cs)} 790 M110 -50 Q110 300 ${f(104 + cs)} 790`, LN(5, '#C9503F', 0.9));
  m += wallClock(DC.clock.x, DC.clock.y, DC.clock.r, o.clock ?? '7:30', tn, { rim: '#2E9C9C', bell: '#FFC23A' });
  // shelf edge top-right
  m += R(1640, 30, 1300, 26, 6, O('#C98A52', 5)) + G(P('M-20 -54 Q-20 -24 0 -20 Q20 -24 20 -54 Z', O('#FFC23A', 4)) + R(-18, -16, 36, 16, 3, O('#7E4A2A', 3)), 'translate(1720 30) scale(1.6)') + P('M1800 30 L1804 -6 L1850 -6 L1854 30 Z', O('#E8603C', 4));
  // monitor glow halo (night) + stand + body
  if (nite) m += R(x0 - 46, y0 - 40, M.w + 92, M.h + 90, 50, { fill: 'url(#shRGB)', opacity: 0.32 });
  m += R(M.cx - 40, y0 + M.h + 20, 80, 70, 6, O('#2A2D38', 6));
  // desk surface (seen from above) + front edge RGB strip
  m += R(XL, DC.top, XR - XL, YB - DC.top, 0, FL('#3A3F52')) + R(XL, DC.top, XR - XL, 10, 0, { fill: '#000', opacity: 0.18 }) + P(`M${XL} ${DC.top} H${XR}`, LN(5));
  if (det > 0) m += P(`M${XL} ${DC.top + 120} H${XR} M${XL} ${DC.top + 260} H${XR}`, LN(3, '#4A5068', 0.6 * det));
  m += R(XL, 1060, XR - XL, 10, 0, { fill: 'url(#shRGB)', opacity: f(nite ? 0.9 : 0.6) });
  m += E(M.cx, y0 + M.h + 92, 190, 20, O('#2A2D38', 5));
  m += R(x0 - 22, y0 - 22, M.w + 44, M.h + 56, 18, O('#24262E', 8)) + R(M.cx - 60, y0 + M.h + 12, 120, 12, 6, FL('#3A3F52')) + CI(x0 + M.w - 10, y0 + M.h + 18, 5, FL(monOn ? '#3DFF9A' : '#FF8A2A'));
  let scr = R(x0, y0, M.w, M.h, 6, FL(monOn ? '#05060A' : '#141824'));
  if (monOn) scr += G(G(screenOf(o.monitor, M.w, M.h), tr(M.cx, M.cy)), null, { 'clip-path': 'url(#shClipDCMon)' });
  else scr += P(`M${x0 + 60} ${y0} L${x0 + 260} ${y0} L${x0 + 80} ${y0 + M.h} L${x0} ${y0 + M.h} L${x0} ${y0 + 140} Z`, { fill: '#FFFFFF', opacity: 0.06 });
  scr += R(x0, y0, M.w, M.h, 6, { fill: 'url(#shShine)', opacity: 0.45 });
  m += scr + R(x0, y0, M.w, M.h, 6, LN(5, '#0A0B10'));
  m += G(R(-46, -40, 92, 80, 3, O('#FFE45C', 3.5)) + TF('STAGE', 0, -10, 18, C('#3A2A55')) + TF('999', 0, 14, 26, C('#3A2A55')) + TF('!!!', 0, 34, 16, C('#E8503A')), `translate(${x0 + M.w + 6} ${y0 + M.h - 30}) rotate(9)`);
  // keyboard (perspective) + mouse pad + mouse + juice box
  const kb = dP([[640, 852], [1250, 852], [1300, 968], [596, 968]]);
  m += R(560, 960, 780, 14, 6, { fill: '#000', opacity: 0.2 });
  m += P(kb, { fill: 'url(#shRGB)', stroke: tn.line, 'stroke-width': f(6 * tn.lw), 'stroke-linejoin': 'round' }) + G(P(kb, { fill: 'url(#shKeys)' }), null, { transform: 'translate(0 0)' }) + G(P(dP([[0, 0], [610, 0], [660, 116], [-44, 116]]), { fill: 'url(#shKeys)' }), 'translate(640 852) scale(1 1)', { opacity: 0 });
  m += P(dP([[1360, 862], [1660, 862], [1700, 990], [1340, 990]]), O('#2A2D38', 5)) + P(dP([[1370, 870], [1652, 870], [1688, 980], [1352, 980]]), { fill: 'none', stroke: 'url(#shRGB)', 'stroke-width': 4 });
  m += P('M1460 950 Q1456 890 1500 884 Q1544 890 1540 950 Q1536 978 1500 978 Q1464 978 1460 950 Z', O('#2A2D38', 5)) + P('M1500 886 V920', LN(3, '#55607A')) + E(1500, 902, 7, 10, FL('#33D6FF'));
  m += G(R(-34, -96, 68, 96, 6, O('#5CB85A', 5)) + R(-34, -64, 68, 28, 0, FL('#FFFFFF')) + TF('JUICE', 0, -44, 14, C('#5CB85A')) + P('M14 -96 L24 -140', LN(7, '#FF4D5E')), 'translate(1790 900)');
  if (o.headphones !== false) m += G(P('M-60 40 Q-60 -40 0 -40 Q60 -40 60 40', LN(24)) + P('M-60 40 Q-60 -40 0 -40 Q60 -40 60 40', LN(13, '#E8503A')) + R(-84, 20, 40, 76, 16, O('#2A2D38', 5)) + R(44, 20, 40, 76, 16, O('#2A2D38', 5)) + R(-6, 40, 12, 120, 4, O('#7A8094', 4)) + E(0, 162, 46, 10, O('#2A2D38', 4)), 'translate(1720 640)');
  const gl = glitchBits(t, b01(o.glitch), 0, 0, 1920, 800, 5);
  m += gl.bits;
  if (gl.dx) m = G(m, `translate(${f(gl.dx)} 0)`);
  // light
  let light = '';
  if (nite) {
    const mg = monOn ? b01(o.monitorGlow, 1) : 0;
    light += pool(M.cx, 920, 900, 160, '#9FD0FF', 0.2 * mg, 4) + darkRing(M.cx, M.cy + 60, 760, 520, '#05081C', mg ? 0.45 : 0.6);
  }
  if (o.lamp) light += glow(1760, 500, 380, 'shGlowWarm', 0.7);
  if (green > 0) light += cover({ fill: '#2BFF8A', opacity: f(0.16 * green) }) + glow(M.cx, M.cy, 420, 'shGlowGreen', green);
  if (red > 0) light += cover({ fill: '#FF2440', opacity: f(0.14 * red) });
  if (flash > 0) light += cover({ fill: '#EEF4FF', opacity: f(0.42 * flash) });
  return { bg, mid: m, front: '', fg: '', light };
}
const deskClose = makeSet(deskCloseLayers);

// deskFace(t, o): REVERSE shot from inside the monitor: the hero sits in his big red gaming chair facing the camera, lit by
// the screen. Draw him (front view, s .9, hips on SPOTS.deskFace.hero.seat) between layers.mid (room + chair) and
// layers.front (the desk edge + keyboard seen from the far side; his hands rest at SPOTS.deskFace.hands). Behind him: the dark
// bedroom (window with the storm at the left, posters, the door at the right), kept low-contrast.
// opts: { time, storm, flash, greenGlow, redBlink, glow 'blue'|'green'|'red'|'orange'|'white'|'#hex' (screen light colour,
//   default blue at night / none by day), glowK 0..1 (default 1), flicker 0..1 (game light flicker), headphones, lowGfx }
const DF = { seat: 830, top: 870 };
function deskFaceLayers(t, o = {}) {
  const time = o.time || 'day', nite = time === 'night', morn = time === 'morning';
  const storm = b01(o.storm), flash = b01(o.flash), green = b01(o.greenGlow), red = b01(o.redBlink), low = b01(o.lowGfx);
  const tn = tone({ night: nite ? 1 : 0, morn: morn ? 0.6 : 0, low, dim: (nite ? 0.25 : 0) + (storm && !nite ? 0.3 * storm : 0) });
  const C = tn.c, O = tn.ol, LN = tn.ln, FL = tn.fl, det = tn.detail;
  const W = { x0: 90, y0: 150, x1: 520, y1: 560 };
  let bg = R(W.x0 - 40, W.y0 - 40, W.x1 - W.x0 + 80, W.y1 - W.y0 + 80, 0, { fill: `url(#${nite ? 'shSkyNight' : morn ? 'shSkyMorning' : 'shSkyDay'})` });
  if (nite && storm < 1) bg += R(W.x0, W.y0, W.x1 - W.x0, 200, 0, { fill: 'url(#shStars)', opacity: f(1 - storm) });
  if (!nite && storm < 1) bg += cloud(260, 300, 0.6, tn);
  if (storm > 0) bg += R(W.x0 - 40, W.y0 - 40, W.x1 - W.x0 + 80, W.y1 - W.y0 + 80, 0, { fill: 'url(#shSkyStorm)', opacity: f(storm) }) + G(R(W.x0 - md(t * 40, 90), W.y0 - 120 + md(t * 900, 120), W.x1 - W.x0 + 200, W.y1 - W.y0 + 240, 0, { fill: 'url(#shRain)' }), null, { opacity: f(0.8 * storm) });
  bg += P(`M40 ${W.y1} L40 450 L200 380 L360 450 L360 ${W.y1} Z M330 ${W.y1} L330 470 L470 410 L600 470 L600 ${W.y1} Z`, O(nite ? '#3A4470' : '#F2A66E', 5));
  if (flash > 0) bg += R(W.x0 - 40, W.y0 - 40, W.x1 - W.x0 + 80, W.y1 - W.y0 + 80, 0, { fill: '#E8F0FF', opacity: f(0.6 * flash) }) + P(boltD(330, 140, 300, 11), { fill: 'none', stroke: '#FFFFFF', 'stroke-width': 9, opacity: f(flash), 'stroke-linejoin': 'round' });
  let m = '';
  const wallD = `M${XL} ${YT} H${XR} V900 H${XL} Z M${W.x0} ${W.y0} V${W.y1} H${W.x1} V${W.y0} Z`;
  m += P(wallD, { fill: C('#A6DEC7'), 'fill-rule': 'evenodd' }) + (det > 0 ? P(wallD, { fill: 'url(#shHRPaper)', 'fill-rule': 'evenodd', opacity: f(det) }) : '');
  m += band(640, 900, FL('#FFBE96')) + band(628, 644, O('#FFF3DC', 4));
  m += P(`M${W.x0 - 22} ${W.y0 - 22} H${W.x1 + 22} V${W.y1 + 8} H${W.x0 - 22} Z M${W.x0} ${W.y0} V${W.y1} H${W.x1} V${W.y0} Z`, { fill: C('#FFF8EC'), 'fill-rule': 'evenodd', stroke: tn.line, 'stroke-width': f(6 * tn.lw) }) + R((W.x0 + W.x1) / 2 - 7, W.y0, 14, W.y1 - W.y0, 3, O('#FFF8EC', 4)) + R(W.x0 - 30, W.y1 + 2, W.x1 - W.x0 + 60, 22, 6, O('#FFF8EC', 5));
  const cs = Math.sin(t * 1.2) * 4 + storm * 16 * Math.sin(t * 6.1);
  m += P(`M${W.x1 + 4} ${W.y0 - 50} L${W.x1 + 96} ${W.y0 - 50} Q${W.x1 + 80} 400 ${f(W.x1 + 70 + cs)} 690 L${f(W.x1 - 6 + cs)} 696 Q${W.x1 + 10} 400 ${W.x1 + 4} ${W.y0 - 50} Z`, O('#F2735A', 6));
  // the door + a poster at the right, the bed corner at the left
  m += R(1560, 200, 240, 700, 4, O('#F28A5B', 6)) + P(dRR(1584, 230, 192, 230, 8) + dRR(1584, 490, 192, 330, 8), { fill: C('#F59A70'), stroke: C('#C9663E'), 'stroke-width': 4 }) + CI(1582, 560, 11, O('#FFC23A', 3));
  m += obbyPoster(1340, 330, 150, 200, 4, tn);
  m += P('M-200 760 L400 760 Q430 760 430 790 L430 900 L-200 900 Z', O('#E8503A', 6)) + (det > 0 ? P('M-200 760 L400 760 Q430 760 430 790 L430 900 L-200 900 Z', { fill: 'url(#shQuiltPix)', opacity: f(det) }) : '');
  m += R(XL, 900, XR - XL, YB - 900, 0, FL('#E9B37C'));
  // the gaming chair (front view): wings, headrest pillow, stripes
  {
    const cx = 960;
    let c = P(`M${cx - 230} 1000 L${cx - 214} 240 Q${cx - 210} 126 ${cx - 120} 120 L${cx + 120} 120 Q${cx + 210} 126 ${cx + 214} 240 L${cx + 230} 1000 Z`, O('#D8262E', 8));
    c += P(`M${cx - 120} 126 L${cx - 120} 1000 M${cx + 120} 126 L${cx + 120} 1000`, LN(28, '#2A2D38')) + P(`M${cx - 200} 260 L${cx - 120} 270 M${cx + 200} 260 L${cx + 120} 270`, LN(8, '#B01D24'));
    c += R(cx - 100, 140, 200, 64, 26, O('#2A2D38', 6)) + TF('GG', cx, 184, 32, C('#FFD23F'));
    c += P(`M${cx - 236} 640 L${cx - 290} 640 L${cx - 290} 700 L${cx - 236} 700 M${cx + 236} 640 L${cx + 290} 640 L${cx + 290} 700 L${cx + 236} 700`, O('#2A2D38', 6));
    m += c;
  }
  // front: the desk edge + keyboard from the far side + a can + mouse
  let fr = R(XL, DF.top, XR - XL, YB - DF.top, 0, FL('#3A3F52')) + P(`M${XL} ${DF.top} H${XR}`, LN(6)) + R(XL, DF.top + 6, XR - XL, 8, 0, { fill: 'url(#shRGB)', opacity: f(nite ? 0.9 : 0.55) });
  fr += P(dP([[640, 940], [1280, 940], [1250, 1010], [670, 1010]]), O('#1E2029', 6)) + R(660, 932, 600, 14, 5, FL('#2C303C'));
  fr += G(P('M-40 30 Q-44 -30 0 -36 Q44 -30 40 30 Z', O('#2A2D38', 5)) + E(0, -14, 8, 11, FL('#33D6FF')), 'translate(1420 976) scale(1.2)');
  fr += G(R(-30, -84, 60, 84, 8, O('#5CB85A', 5)) + R(-30, -56, 60, 24, 0, FL('#FFFFFF')), 'translate(400 990)');
  // light: the screen washes the hero
  const cols = { blue: '#9FD0FF', green: '#5DFFAA', red: '#FF5A6A', orange: '#FFB060', white: '#FFFFFF' };
  let gcol = o.glow ? (cols[o.glow] || o.glow) : nite ? cols.blue : null;
  if (green > 0) gcol = cols.green;
  if (red > 0) gcol = cols.red;
  const gk = b01(o.glowK, 1) * (1 - 0.25 * b01(o.flicker) * (0.5 + 0.5 * Math.sin(t * 23) * Math.sin(t * 7)));
  let light = '';
  if (gcol) light += pool(960, 480, 520, 470, gcol, 0.32 * gk, 5);
  if (nite) light += darkRing(960, 480, 560, 480, '#05081C', 0.55);
  if (green > 0) light += cover({ fill: '#2BFF8A', opacity: f(0.14 * green) });
  if (red > 0) light += cover({ fill: '#FF2440', opacity: f(0.12 * red) });
  if (flash > 0) light += cover({ fill: '#EEF4FF', opacity: f(0.45 * flash) });
  return { bg, mid: m, front: fr, fg: '', light };
}
const deskFace = makeSet(deskFaceLayers);

// ================================================================= 2. STAIRS — side view, upstairs landing -> hallway
// The hero's door on the landing (top-left, floor y 430), 12 carpeted steps down to the RIGHT, the downstairs hallway (floor
// y 937) with the front door. Family photos climb the wall along the slope above a wall handrail; a round window throws
// the morning sun across the steps. Hero scale s .34 here (SPOTS.stairs.s): the whole staircase fits the frame.
// SPOTS.stairs.steps[i] = centre of tread i's top (0 = first step below the landing ... 11 = last before the floor);
// .skate = Bea's skateboard on step 1 (o.skate draws it; or draw skateboard(x, y, s, rot) yourself when it flies).
// layers.front = the two newel posts (top + bottom). opts: { time 'morning'|'day'|'night', skate, heroDoor 0..1 (open),
//   lowGfx, glitch }
const ST = { land: 430, x0: 560, rise: 39, run: 78, n: 12 };
ST.floor = ST.land + (ST.n + 1) * ST.rise;                 // 937
ST.x1 = ST.x0 + ST.n * ST.run;                             // 1496
const stairLine = (x) => clamp(ST.land + (x - ST.x0) * (ST.rise / ST.run), ST.land, ST.floor - ST.rise);   // nosing line
const stepAt = (i) => ({ x: ST.x0 + (i + 0.5) * ST.run, y: ST.land + (i + 1) * ST.rise });
def(pat('shStripeW', 60, 60, '<rect width="30" height="60" fill="#FFFFFF" opacity="0.18"/>'));
function familyPhoto(kind, x, y, w, h, rot, tn) {
  const C = tn.c, O = tn.ol, LN = tn.ln, FL = tn.fl;
  let o = R(-w / 2 + 5, -h / 2 + 7, w, h, 4, { fill: '#000', opacity: 0.12 }) + R(-w / 2, -h / 2, w, h, 4, O(['#8A5A33', '#FFF8EC', '#2E3242'][kind % 3], 5));
  const iw = w - 22, ih = h - 22;
  const BG = ['#9FD8FF', '#FFD0E6', '#C9F2B0', '#FFE9A0', '#BFE6FF', '#FFDCC2'];
  o += R(-iw / 2, -ih / 2, iw, ih, 2, FL(BG[kind % 6]));
  const head = (hx, hy, r, hair, extra = '') => R(hx - r, hy - r, 2 * r, 2 * r, r * 0.3, O('#FFFFFF', 3)) + CI(hx - r * 0.35, hy, r * 0.13, FL(LINE)) + CI(hx + r * 0.35, hy, r * 0.13, FL(LINE)) + P(`M${hx - r} ${hy - r * 0.2} L${hx - r} ${hy - r * 1.05} Q${hx} ${hy - r * 1.4} ${hx + r} ${hy - r * 1.05} L${hx + r} ${hy - r * 0.2} L${hx} ${hy - r * 0.6} Z`, O(hair, 3)) + extra;
  if (kind === 0) o += head(0, -6, 26, '#C8551E', P('M-24 6 Q0 44 24 6 Q12 18 0 16 Q-12 18 -24 6 Z', O('#E0622A', 3))) + R(-30, 30, 60, 20, 4, FL('#FFFFFF'));                 // Dad + beard
  else if (kind === 1) o += head(0, -4, 25, '#5A3A2A', CI(0, -32, 10, O('#5A3A2A', 3))) + R(-30, 26, 60, 26, 6, FL('#34C3B8'));                                  // Mom in scrubs
  else if (kind === 2) o += head(0, -2, 22, '#8A4F22', CI(-26, -12, 9, O('#8A4F22', 3)) + CI(26, -12, 9, O('#8A4F22', 3)) + R(-4, 8, 8, 6, 1, FL('#FFFFFF'))) + R(-24, 22, 48, 26, 6, FL('#FF8FC0'));   // Bea
  else if (kind === 3) o += E(0, 20, 34, 22, O('#8FD0FF', 3)) + head(0, -10, 20, '#C8551E');                                                                        // baby you
  else if (kind === 4) o += CI(0, 4, 32, O('#D6F2FF', 3)) + P('M-14 6 Q0 -10 14 6 Q0 20 -14 6 Z M14 6 L24 -4 L24 16 Z', O('#FF8A2A', 3)) + CI(-6, 4, 2.5, FL(LINE));      // Gary
  else o += head(-26, 0, 14, '#C8551E') + head(-2, -4, 16, '#5A3A2A') + head(22, 4, 12, '#8A4F22') + head(40, 6, 10, '#B84B02');                                  // family
  return G(o, tr(x, y, 1, rot));
}
function stairsLayers(t, o = {}) {
  const time = o.time || 'morning', nite = time === 'night', morn = time === 'morning';
  const low = b01(o.lowGfx);
  const tn = tone({ night: nite ? 1 : 0, morn: morn ? 0.6 : 0, low });
  const C = tn.c, O = tn.ol, LN = tn.ln, FL = tn.fl, det = tn.detail;
  let m = '';
  // walls (butter upper / mint wainscot along the slope) + the round window
  m += cover(FL('#FFE7B4')) + (det > 0 ? cover({ fill: 'url(#shStripeW)', opacity: f(0.6 * det) }) : '');
  const wy = (x) => stairLine(x) - 120;
  const wain = dP([[XL, ST.land - 120], [ST.x0, ST.land - 120], [ST.x1, ST.floor - ST.rise - 120], [XR, ST.floor - ST.rise - 120], [XR, YB], [XL, YB]]);
  m += P(wain, FL('#9ED9C4')) + P(`M${XL} ${ST.land - 120} L${ST.x0} ${ST.land - 120} L${ST.x1} ${ST.floor - ST.rise - 120} L${XR} ${ST.floor - ST.rise - 120}`, LN(14)) + P(`M${XL} ${ST.land - 120} L${ST.x0} ${ST.land - 120} L${ST.x1} ${ST.floor - ST.rise - 120} L${XR} ${ST.floor - ST.rise - 120}`, LN(8, '#FFF3DC'));
  void wy;
  const rw = { x: 112, y: 150, r: 72 };
  m += CI(rw.x, rw.y, rw.r + 16, O('#FFF8EC', 6)) + CI(rw.x, rw.y, rw.r, { fill: `url(#${nite ? 'shSkyNight' : morn ? 'shSkyMorning' : 'shSkyDay'})`, stroke: tn.line, 'stroke-width': 4 }) + P(`M${rw.x - rw.r} ${rw.y} H${rw.x + rw.r} M${rw.x} ${rw.y - rw.r} V${rw.y + rw.r}`, LN(9, '#FFF8EC'));
  if (!nite) m += P(dC(rw.x - 20, rw.y - 30, 12) + dC(rw.x + 8, rw.y - 36, 16) + dC(rw.x + 30, rw.y - 28, 11), FL('#FFFFFF'));
  // upstairs: the hero's door (coral, DO NOT DISTURB) + hamper
  {
    const dx0 = 230, dx1 = 410, dy = ST.land - 420, hk = b01(o.heroDoor);
    m += R(dx0 - 16, dy - 16, dx1 - dx0 + 32, ST.land - dy + 16, 4, O('#FFF3DC', 5));
    if (hk > 0) m += R(dx0, dy, dx1 - dx0, ST.land - dy, 0, FL('#7A8CC8')) + P(dP([[dx0, dy], [lerp(dx1, dx0 + 40, 1 - hk * 0.8), dy - 14 * hk], [lerp(dx1, dx0 + 40, 1 - hk * 0.8), ST.land + 14 * hk], [dx0, ST.land]]), O('#F28A5B', 5));
    else m += R(dx0, dy, dx1 - dx0, ST.land - dy, 4, O('#F28A5B', 6)) + P(dRR(dx0 + 20, dy + 24, dx1 - dx0 - 40, 150, 8) + dRR(dx0 + 20, dy + 200, dx1 - dx0 - 40, 190, 8), { fill: C('#F59A70'), stroke: C('#C9663E'), 'stroke-width': 4 }) + CI(dx1 - 22, dy + 230, 9, O('#FFC23A', 3)) + G(R(-56, -30, 112, 60, 5, O('#FFFFFF', 3.5)) + TF('DO NOT', 0, -6, 16, C('#E8503A')) + TF('DISTURB', 0, 13, 16, C('#E8503A')), `translate(${(dx0 + dx1) / 2} ${dy + 100}) rotate(-3)`);
    m += R(450, ST.land - 90, 74, 90, 10, O('#8FD0FF', 5)) + P(`M450 ${ST.land - 70} H524`, LN(4, '#5FA8E0')) + P(`M462 ${ST.land - 90} Q480 ${ST.land - 118} 500 ${ST.land - 92}`, O('#FFFFFF', 4)) + P(`M470 ${ST.land - 96} q16 -20 34 -4`, LN(6, '#E8503A'));
  }
  // family photos along the slope + the wall handrail
  const PH = [[650, 0, -4], [820, 1, 3], [990, 2, -2], [1160, 3, 4], [1330, 4, -3], [1500, 5, 2]];
  PH.forEach(([x, k, r]) => { m += familyPhoto(k, x, stairLine(x) - 300 - (k % 2) * 16, k === 5 ? 150 : 112, k === 5 ? 110 : 132, r, tn); });
  const hr0 = [ST.x0 - 40, ST.land - 150], hr1 = [ST.x1 + 20, ST.floor - ST.rise - 150];
  m += P(`M${hr0[0]} ${hr0[1]} L${hr1[0]} ${f(hr1[1])}`, LN(16)) + P(`M${hr0[0]} ${hr0[1]} L${hr1[0]} ${f(hr1[1])}`, LN(9, '#C98A52'));
  for (const u of [0.1, 0.5, 0.9]) { const x = lerp(hr0[0], hr1[0], u), y = lerp(hr0[1], hr1[1], u); m += P(`M${f(x)} ${f(y)} v26`, LN(7, '#8A5A33')); }
  // downstairs under the landing: the living-room doorway (warm)
  m += R(XL, ST.land, ST.x0 - XL, 70, 0, O('#C98A52', 5)) + R(XL, ST.land, ST.x0 - XL, 14, 0, FL('#E8B07A'));
  m += R(130, 600, 260, ST.floor - 600, 6, O('#FFF3DC', 6)) + R(146, 616, 228, ST.floor - 616, 2, FL(nite ? '#3A2A5A' : '#FFD98A')) + R(150, ST.floor - 70, 220, 70, 0, FL(nite ? '#2A2046' : '#E8B07A'));
  // the stairs (side): painted stringer + coral runner on every tread
  let prof = [[ST.x0, ST.land]];
  for (let i = 0; i < ST.n; i++) { const y = ST.land + (i + 1) * ST.rise; prof.push([ST.x0 + i * ST.run, y], [ST.x0 + (i + 1) * ST.run, y]); }
  m += P(dP([...prof, [ST.x1 + 10, ST.floor - ST.rise], [ST.x1 + 10, ST.floor], [ST.x0, ST.floor]]), O('#FFF6E8', 6));
  // the stringer band + panels + under-stairs cupboard
  m += P(`M${ST.x0} ${ST.land + 70} L${ST.x1 + 10} ${ST.floor - 10}`, LN(5, '#E0CDB0'));
  if (det > 0) m += P(`M${ST.x0 + 60} ${ST.land + 160} L${ST.x0 + 60} ${ST.floor - 30} M${ST.x0 + 300} ${ST.land + 270} L${ST.x0 + 300} ${ST.floor - 30} M${ST.x0 + 60} ${ST.floor - 30} H${ST.x0 + 420}`, LN(4, '#E6D6BC', det));
  m += P(dP([[960, ST.floor], [960, 790], [1010, 746], [1200, 746], [1200, ST.floor]]), O('#F2C48E', 5)) + R(1000, 800, 160, 60, 6, { fill: 'none', stroke: C('#D9A066'), 'stroke-width': 4 }) + CI(1176, 860, 8, O('#FFC23A', 2.5));
  let runner = 'M' + prof.map(([x, y]) => `${f(x)} ${f(y)}`).join(' L');
  m += P(runner, LN(26)) + P(runner, LN(16, '#E8735A'));
  let nos = '';
  for (let i = 0; i < ST.n; i++) { const x = ST.x0 + (i + 1) * ST.run, y = ST.land + (i + 1) * ST.rise; nos += dRR(x - 14, y - 4, 22, 12, 5); }
  m += P(nos, O('#C98A52', 3));
  if (det > 0) m += P(prof.filter((_, i) => i % 2).map(([x, y]) => `M${f(x + 10)} ${f(y + 10)} h${ST.run - 30}`).join(' '), LN(3, '#E0CDB0', 0.8 * det));
  // landing floor + hallway floor
  m += R(XL, ST.land - 6, ST.x0 - XL + 4, 12, 0, FL('#C98A52'));
  m += R(ST.x1 - 4, ST.floor, XR - ST.x1, YB - ST.floor, 0, FL('#E9B37C')) + R(XL, ST.floor, ST.x1 - XL, YB - ST.floor, 0, FL('#E9B37C')) + P(`M${XL} ${ST.floor} H${XR}`, LN(5));
  if (det > 0) m += R(XL, ST.floor, XR - XL, YB - ST.floor, 0, { fill: 'url(#shPlanks)', opacity: f(det) });
  // hallway: front door, coat hooks + raincoat + Bea's backpack, shoes, mat, plant
  {
    const fx0 = 1690, fx1 = 1880, fy = ST.floor - 470;
    m += R(fx0 - 18, fy - 18, fx1 - fx0 + 36, ST.floor - fy + 18, 4, O('#FFF3DC', 5)) + R(fx0, fy, fx1 - fx0, ST.floor - fy, 4, O('#2E9C9C', 6));
    m += P(`M${fx0 + 30} ${fy + 120} A65 65 0 0 1 ${fx1 - 30} ${fy + 120} Z`, O(nite ? '#3A4A8A' : '#BFE8FF', 4)) + P(dRR(fx0 + 30, fy + 160, fx1 - fx0 - 60, 250, 8), { fill: 'none', stroke: C('#1E7D86'), 'stroke-width': 5 }) + CI(fx0 + 24, fy + 270, 10, O('#FFC23A', 3));
    m += R(fx0 - 10, ST.floor - 6, fx1 - fx0 + 20, 22, 6, O('#C9A070', 4)) + TF('HOME', (fx0 + fx1) / 2, ST.floor + 12, 18, C('#8A5A33'));
    m += R(1560, 560, 110, 14, 5, O('#8A5A33', 4)) + CI(1580, 584, 6, O('#FFC23A', 2.5)) + CI(1650, 584, 6, O('#FFC23A', 2.5));
    m += P('M1560 590 Q1544 700 1556 760 L1608 760 Q1612 680 1590 590 Z', O('#FFD23F', 5)) + G(R(-34, -10, 68, 90, 14, O('#FF8FC0', 5)) + R(-24, 30, 48, 30, 8, O('#FF6FB5', 3)) + P('M-14 -10 Q0 -34 14 -10', LN(6)), 'translate(1650 600)');
    m += P(`M1560 ${ST.floor} q4 -26 30 -24 l26 6 q6 6 0 18 Z M1604 ${ST.floor + 6} q4 -26 30 -24 l26 6 q6 6 0 18 Z`, O('#3DA8D8', 4));
    m += P(`M1910 ${ST.floor} L1904 ${ST.floor - 70} L1960 ${ST.floor - 70} L1954 ${ST.floor} Z`, O('#E8603C', 5)) + P(dC(1920, ST.floor - 110, 30) + dC(1950, ST.floor - 130, 30) + dC(1930, ST.floor - 160, 26), O('#5CB85A', 5));
  }
  if (o.skate) { const s1 = stepAt(1); m += skateboard(s1.x, s1.y, 0.6, 0, tn); }
  const gl = glitchBits(t, b01(o.glitch), 0, 0, 1920, 900, 7);
  m += gl.bits;
  if (gl.dx) m = G(m, `translate(${f(gl.dx)} 0)`);
  // front: newel posts
  const post = (x, y, h) => R(x - 20, y - h, 40, h, 6, O('#C98A52', 6)) + R(x - 26, y - h - 14, 52, 18, 6, O('#B9764A', 5)) + CI(x, y - h - 30, 18, O('#E0A468', 5)) + R(x - 26, y - 22, 52, 22, 4, O('#B9764A', 5));
  const fr = post(ST.x0 - 6, ST.land + 2, 150) + post(ST.x1 + 34, ST.floor + 2, 190);
  // light
  let light = '';
  if (morn || time === 'day') light += P(dP([[rw.x - rw.r * 0.7, rw.y - rw.r * 0.7], [rw.x + rw.r * 0.7, rw.y + rw.r * 0.7], [1500, 1000], [900, 1000]]), { fill: 'url(#shBeam)', opacity: f(morn ? 0.22 : 0.14) });
  if (nite) light += glow(1530, ST.floor - 30, 150, 'shGlowWarm', 0.8) + glow(320, ST.land - 40, 260, 'shGlowBlue', 0.35) + darkRing(900, 560, 700, 460, '#05081C', 0.4);
  return { bg: '', mid: m, front: fr, fg: '', light };
}
const stairs = makeSet(stairsLayers);

// ================================================================= 3. KITCHEN — sunny family kitchen
// Front view. Cream walls + mint hex-tile backsplash, open shelves, the window over the sink shows the STREET (a lavender
// house, a power line with birds; flying birds cross it — they freeze with o.frozen). LEFT: the fridge (Bea's mushroom
// drawings, the calendar with FRI ★ TALENT SHOW). CENTRE-LEFT: the KITCHEN ISLAND with the cooktop + frying pan
// (SPOTS.kitchen.pan): DAD stands BEHIND it facing camera (SPOTS.kitchen.dad; draw him between mid and front — the island
// is layers.front). The pancake hang point SPOTS.kitchen.panHang. RIGHT: breakfast table (layers.front) with three chairs
// behind it (SPOTS.kitchen.seats: Bea's chair has the pink booster), Mom's coat hooks by the back door (SPOTS.kitchen.coat).
// Pendant lamp over the table, frying-pan clock. Stand line y 990 (FLOOR.kitchen, s .5).
// opts: { time 'morning'|'evening' (dinner: lamp on, dusk window, dinner plates), meal 'pancakes'|'dinner', panCake (default
//   true), stack (pancake stack on the island, default true), steam (default true), coat (default true), birds (default true),
//   frozen 0..1 + freezeAt (birds / steam stop), clock 'H:MM' (default 7:30 / 6:30 pm), lowGfx 0..1, glitch 0..1 }
const KT = { ceil: 50, base: 780, counter: 560, win: { x0: 640, y0: 150, x1: 1080, y1: 470 }, fridge: { x0: 24, x1: 300, top: 120 }, island: { x0: 300, x1: 1060, top: 640, base: 900 }, pan: { x: 650, y: 630 }, table: { x0: 1150, x1: 1830, top: 742 }, door: { x0: 1660, x1: 1860, y0: 250 }, hooks: { x0: 1340, x1: 1470, y: 330 }, lamp: 1580 };
def(pat('shHex', 52, 90, '<path d="M13 0 L39 0 L52 22.5 L39 45 L13 45 L0 22.5 Z M-13 45 L13 45 L26 67.5 L13 90 L-13 90 M39 45 L65 45 L78 67.5" fill="none" stroke="#FFFFFF" stroke-width="3" opacity="0.65"/>'));
def(pat('shKCheck', 48, 48, '<rect width="24" height="48" fill="#7CD8B8" opacity="0.55"/><rect width="48" height="24" fill="#7CD8B8" opacity="0.55"/>'));
def(pat('shTiles', 120, 120, '<rect width="120" height="120" fill="none" stroke="#000" stroke-width="3" opacity="0.1"/><rect x="0" y="0" width="60" height="60" fill="#FFF" opacity="0.08"/><rect x="60" y="60" width="60" height="60" fill="#FFF" opacity="0.08"/>'));
function kitchenLayers(t, o = {}) {
  const time = o.time || 'morning', eve = time === 'evening' || time === 'night';
  const low = b01(o.lowGfx), frz = b01(o.frozen);
  const tm = frz >= 1 ? (o.freezeAt ?? 0) : frz > 0 ? Math.floor(t * lerp(30, 3, frz)) / lerp(30, 3, frz) : t;
  const tn = tone({ eve: eve ? 0.75 : 0, morn: eve ? 0 : 0.5, low });
  const C = tn.c, O = tn.ol, LN = tn.ln, FL = tn.fl, det = tn.detail;
  const W = KT.win, I = KT.island, TB = KT.table;
  // ---- bg: the street through the window
  let bg = R(W.x0 - 40, W.y0 - 40, W.x1 - W.x0 + 80, W.y1 - W.y0 + 80, 0, { fill: `url(#${eve ? 'shSkySunset' : 'shSkyMorning'})` });
  bg += cloud(760, 230, 0.45, tn, eve ? '#FFD6E6' : '#FFFFFF', eve ? '#F2A0C0' : '#D6E9FF');
  bg += P(`M${W.x0 + 140} 470 L${W.x0 + 140} 330 L${W.x0 + 260} 260 L${W.x0 + 380} 330 L${W.x0 + 380} 470 Z`, O('#C9B0F2', 5)) + P(`M${W.x0 + 124} 338 L${W.x0 + 260} 252 L${W.x0 + 396} 338`, LN(14, '#7A5CC8')) + R(W.x0 + 230, 360, 60, 50, 4, O(eve ? '#FFD86B' : '#CDEEFF', 4));
  bg += tree(W.x0 + 40, 520, 0.62, tn, { sway: Math.sin(tm * 0.9) * 1.5 });
  bg += R(W.x0 - 40, 440, W.x1 - W.x0 + 80, 40, 0, FL('#79C96A')) + R(W.x0 - 40, 456, W.x1 - W.x0 + 80, 30, 0, FL('#C9C3D6'));
  // power line + birds (sitting + 2 flying across)
  bg += P(`M${W.x0 - 40} 236 Q${(W.x0 + W.x1) / 2} 262 ${W.x1 + 40} 230`, LN(3)) + R(W.x1 - 30, 160, 16, 330, 3, O('#8A5A33', 3.5));
  if (o.birds !== false) {
    bg += bird(760, 252, 0.8, tn) + bird(800, 254, 0.8, tn, { flip: true }) + bird(950, 250, 0.8, tn);
    for (let i = 0; i < 2; i++) {
      const u = md(tm * 0.11 + i * 0.5, 1), bx = lerp(W.x0 - 60, W.x1 + 60, u), by = 300 - 40 * i + Math.sin(u * 9 + i) * 14;
      bg += bird(bx, by, 0.75, tn, { flying: true, flap: frz >= 1 ? 0.25 : md(tm * 5 + i * 0.3, 1) });
    }
  }
  // ---- mid
  let m = '';
  const wallD = `M${XL} ${YT} H${XR} V${KT.base} H${XL} Z M${W.x0} ${W.y0} V${W.y1} H${W.x1} V${W.y0} Z`;
  m += P(wallD, { fill: C('#FFEFD2'), 'fill-rule': 'evenodd' });
  m += R(XL, YT, XR - XL, KT.ceil - YT, 0, FL('#FFF7E8')) + band(KT.ceil - 6, KT.ceil + 14, O('#FFFFFF', 4));
  // backsplash: mint hex tiles between counter and the shelves
  const bsD = `M${KT.fridge.x1} 410 H${W.x0 - 20} V${W.y1 + 8} H${W.x1 + 20} V410 H1310 V${KT.counter} H${KT.fridge.x1} Z`;
  m += P(bsD, { fill: C('#A6E3CF'), 'fill-rule': 'evenodd' }) + (det > 0 ? P(bsD, { fill: 'url(#shHex)', 'fill-rule': 'evenodd', opacity: f(det) }) : '');
  // window frame + café curtain + sill plant
  m += P(`M${W.x0 - 20} ${W.y0 - 20} H${W.x1 + 20} V${W.y1 + 8} H${W.x0 - 20} Z M${W.x0} ${W.y0} V${W.y1} H${W.x1} V${W.y0} Z`, { fill: C('#FFFFFF'), 'fill-rule': 'evenodd', stroke: tn.line, 'stroke-width': f(6 * tn.lw) });
  m += R((W.x0 + W.x1) / 2 - 7, W.y0, 14, W.y1 - W.y0, 3, O('#FFFFFF', 4)) + P(`M${W.x0 + 24} ${W.y0 + 130} L${W.x0 + 96} ${W.y0 + 12} L${W.x0 + 122} ${W.y0 + 12} L${W.x0 + 50} ${W.y0 + 130} Z`, { fill: '#FFFFFF', opacity: 0.3 });
  let val = `M${W.x0 - 30} ${W.y0 - 30} H${W.x1 + 30} V${W.y0 + 30}`;
  for (let x = W.x1 + 30; x > W.x0 - 30; x -= 46) val += ` Q${x - 23} ${W.y0 + 56} ${x - 46} ${W.y0 + 30}`;
  m += P(val + ' Z', O('#FF9E7A', 5)) + (det > 0 ? P(val + ' Z', { fill: 'url(#shDots)', opacity: f(det) }) : '');
  m += R(W.x0 - 30, W.y1 + 2, W.x1 - W.x0 + 60, 22, 6, O('#FFFFFF', 5)) + P(`M${W.x1 - 70} ${W.y1 + 2} L${W.x1 - 76} ${W.y1 - 30} L${W.x1 - 40} ${W.y1 - 30} L${W.x1 - 46} ${W.y1 + 2} Z`, O('#E8603C', 4)) + P(dC(W.x1 - 64, W.y1 - 40, 12) + dC(W.x1 - 50, W.y1 - 48, 12), O('#5CB85A', 3.5));
  // open shelves left of the window (jars, mugs, plates)
  {
    let s = '';
    for (const y of [270, 380]) s += R(330, y, 270, 16, 5, O('#C98A52', 4)) + P(`M350 ${y + 16} l0 18 l18 -18 M580 ${y + 16} l0 18 l-18 -18`, LN(5, '#8A5A33'));
    s += G(R(-22, -56, 44, 56, 8, O('#FFFFFF', 3.5)) + R(-24, -64, 48, 12, 4, O('#E8603C', 3)) + R(-16, -40, 32, 30, 4, FL('#F4BE62')), 'translate(370 270)') + G(R(-22, -56, 44, 56, 8, O('#FFFFFF', 3.5)) + R(-24, -64, 48, 12, 4, O('#5CB85A', 3)) + R(-16, -34, 32, 24, 4, FL('#F2E2C4')), 'translate(430 270)');
    s += TF('FLOUR', 430, 238, 9, C('#8A5A33')) + TF('SUGAR', 370, 238, 9, C('#8A5A33'));
    s += P(dE(520, 242, 34, 30) + dE(548, 244, 30, 28), O('#FFD23F', 3.5)) + P(dE(520, 242, 22, 18), { fill: 'none', stroke: C('#E8A020'), 'stroke-width': 3 });
    s += G(R(-18, -34, 36, 34, 6, O('#3DA8D8', 3.5)) + P('M18 -26 q14 0 14 12 q0 12 -14 10', LN(4, '#3DA8D8')), 'translate(370 380)') + G(R(-18, -34, 36, 34, 6, O('#FF8FC0', 3.5)) + P('M18 -26 q14 0 14 12 q0 12 -14 10', LN(4, '#FF8FC0')), 'translate(440 380)') + G(R(-18, -34, 36, 34, 6, O('#FFD23F', 3.5)), 'translate(510 380)');
    m += s;
  }
  // copper hood over the island cooktop
  m += P(`M600 ${KT.ceil} L600 120 L520 210 L800 210 L720 120 L720 ${KT.ceil} Z`, O('#E89A5C', 6)) + R(510, 200, 300, 18, 6, O('#C97A3E', 4)) + P('M640 130 L640 196 M680 130 L680 196', LN(4, '#FFC890', 0.7));
  // fridge (cream, two doors, magnets, Bea's drawings, calendar)
  {
    const F = KT.fridge;
    let fz = R(F.x0, F.top, F.x1 - F.x0, KT.base + 10 - F.top, 18, O('#F6F2EA', 7)) + P(`M${F.x0} 330 H${F.x1}`, LN(6)) + R(F.x1 - 34, 180, 14, 110, 6, O('#C9CED8', 4)) + R(F.x1 - 34, 370, 14, 180, 6, O('#C9CED8', 4));
    fz += G(R(-46, -54, 92, 108, 2, O('#FFFFFF', 3)) + P('M-28 20 Q-30 -12 0 -16 Q30 -12 28 20 Z', O('#E8503A', 3)) + R(-10, 20, 20, 24, 3, O('#FFF4E2', 3)) + CI(-12, -2, 5, FL('#FFFFFF')) + CI(10, 4, 4, FL('#FFFFFF')) + TF('BRO', 0, -36, 14, C('#3DA8D8')), 'translate(110 440) rotate(-5)');
    fz += G(R(-40, -46, 80, 92, 2, O('#FFFFFF', 3)) + P('M-20 20 L0 -24 L20 20 Z', O('#FFD23F', 3)) + CI(0, 30, 6, FL('#FF8FC0')), 'translate(200 600) rotate(6)');
    fz += G(R(-56, -60, 112, 120, 3, O('#FFFFFF', 3)) + R(-56, -60, 112, 26, 3, FL('#E8503A')) + TF('MAY', 0, -41, 15, C('#FFFFFF')) + P('M-46 -24 H46 M-46 0 H46 M-46 24 H46 M-22 -34 V50 M8 -34 V50 M32 -34 V50', LN(1.6, '#C9CED8')) + P(dC(20, 12, 12), { fill: 'none', stroke: C('#E8503A'), 'stroke-width': 3 }) + TF('FRI', 20, 16, 9, C('#3A2A55')) + TF('★ TALENT SHOW', 0, 50, 10, C('#E8503A')), 'translate(150 230) rotate(2)');
    fz += CI(96, 380, 9, O('#FF4D5E', 2.5)) + CI(220, 400, 9, O('#3DA8D8', 2.5)) + R(60, 700, 26, 26, 4, O('#FFD23F', 2.5)) + R(240, 680, 26, 26, 4, O('#5CB85A', 2.5));
    m += fz;
  }
  // back counter (right part visible) + sink + toaster
  m += R(KT.fridge.x1, KT.counter, 1310 - KT.fridge.x1, KT.base + 10 - KT.counter, 0, O('#7CC7A8', 5)) + R(KT.fridge.x1 - 6, KT.counter - 16, 1322 - KT.fridge.x1, 22, 6, O('#FFF3DC', 5));
  let doors = '';
  for (let x = KT.fridge.x1 + 16; x < 1290; x += 124) doors += dRR(x, KT.counter + 26, 108, 190, 8);
  m += P(doors, { fill: C('#8FD8B8'), stroke: C('#5FA88A'), 'stroke-width': 4 });
  m += P(`M820 ${KT.counter - 16} L820 500 Q820 470 856 470 Q890 470 890 500`, LN(14)) + P(`M820 ${KT.counter - 16} L820 500 Q820 470 856 470 Q890 470 890 500`, LN(8, '#C9CED8'));
  m += G(R(-52, -56, 104, 56, 16, O('#F2F2F2', 5)) + R(-34, -64, 26, 10, 3, FL('#2A2D38')) + R(8, -64, 26, 10, 3, FL('#2A2D38')) + R(52, -34, 10, 16, 3, O('#2A2D38', 3)), `translate(1200 ${KT.counter - 14})`);
  // frying-pan wall clock
  m += G(R(70, -12, 110, 24, 10, O('#2A2D38', 5)), 'translate(1240 170)') + wallClock(1240, 170, 62, o.clock ?? (eve ? '6:30' : '7:30'), tn, { rim: '#2A2D38', bells: false });
  // coat hooks (Mom's teal coat + bag) + back door
  {
    const H = KT.hooks;
    m += R(H.x0, H.y - 12, H.x1 - H.x0, 20, 6, O('#C98A52', 4)) + CI(H.x0 + 30, H.y + 14, 7, O('#FFC23A', 2.5)) + CI(H.x1 - 30, H.y + 14, 7, O('#FFC23A', 2.5));
    if (o.coat !== false) m += P(`M${H.x0 + 30} ${H.y + 10} L${H.x0 - 4} ${H.y + 40} L${H.x0 - 16} ${H.y + 300} L${H.x0 + 80} ${H.y + 300} L${H.x0 + 64} ${H.y + 40} Z`, O('#34C3B8', 5)) + P(`M${H.x0 + 30} ${H.y + 20} L${H.x0 + 30} ${H.y + 290}`, LN(4, '#1E9C92')) + G(R(-34, 0, 68, 80, 10, O('#FFB3CF', 4)) + P('M-18 0 Q0 -40 18 0', LN(5)), `translate(${H.x1 - 30} ${H.y + 30})`);
    const D = KT.door;
    m += R(D.x0 - 18, D.y0 - 18, D.x1 - D.x0 + 36, KT.base - D.y0 + 18, 4, O('#FFFFFF', 5)) + R(D.x0, D.y0, D.x1 - D.x0, KT.base - D.y0, 4, O('#FFC23A', 6)) + R(D.x0 + 26, D.y0 + 26, D.x1 - D.x0 - 52, 200, 6, O(eve ? '#4A3A7A' : '#BFE8FF', 4)) + P(`M${D.x0 + 26} ${D.y0 + 126} H${D.x1 - 26} M${(D.x0 + D.x1) / 2} ${D.y0 + 26} V${D.y0 + 226}`, LN(5, '#FFFFFF')) + CI(D.x0 + 24, 540, 10, O('#C9CED8', 3));
  }
  // pendant lamp over the table
  {
    const lx = KT.lamp;
    m += P(`M${lx} ${KT.ceil} V260`, LN(4)) + P(`M${lx - 70} 330 Q${lx - 70} 252 ${lx} 252 Q${lx + 70} 252 ${lx + 70} 330 Z`, O('#FFC23A', 5)) + E(lx, 330, 70, 9, O(eve ? '!#FFF4B8' : '#F2E2B8', 4));
  }
  // chairs behind the table (Bea's with the pink booster) + floor
  {
    let c = '';
    for (const [x, boost] of [[1300, true], [1490, false], [1680, false]]) {
      c += R(x - 70, 560, 140, 200, 12, O('#E0A468', 5)) + R(x - 52, 582, 104, 22, 6, FL('#C98A52')) + R(x - 52, 620, 104, 22, 6, FL('#C98A52'));
      if (boost) c += R(x - 58, 640, 116, 110, 18, O('#FF8FC0', 5)) + R(x - 40, 656, 80, 14, 6, FL('#FFC0DD'));
    }
    m += c;
  }
  m += R(XL, KT.base, XR - XL, YB - KT.base, 0, FL('#F4CDA4'));
  if (det > 0) {
    let gd = '';
    const vx = 960, vy = -1200;
    for (let x = -900; x <= 2820; x += 150) { const k = (YB - vy) / (KT.base - vy); gd += `M${f(x)} ${KT.base} L${f(vx + (x - vx) * k)} ${YB} `; }
    for (let i = 1; i < 12; i++) { const y = KT.base + i * 22 + i * i * 6; gd += `M${XL} ${f(y)} H${XR} `; }
    m += P(gd, LN(3, '#D9A77A', 0.8 * det));
  }
  m += band(KT.base, KT.base + 10, { fill: '#000', opacity: 0.08 });
  const gl = glitchBits(t, b01(o.glitch), 0, 60, 1920, 700, 11);
  m += gl.bits;
  if (gl.dx) m = G(m, `translate(${f(gl.dx)} 0)`);
  // ---- front: the island (cooktop, pan, pancake stack, crock) + the table
  let fr = '';
  {
    fr += R(I.x0, I.top + 8, I.x1 - I.x0, I.base - I.top - 8, 0, O('#5FB896', 6));
    let dd = '';
    for (let x = I.x0 + 20; x < I.x1 - 40; x += 250) dd += dRR(x, I.top + 56, 230, 180, 10);
    fr += P(dd, { fill: C('#74C8A6'), stroke: C('#3E8E70'), 'stroke-width': 4 }) + P(`M${I.x0 + 115} ${I.top + 80} h40 M${I.x0 + 365} ${I.top + 80} h40 M${I.x0 + 615} ${I.top + 80} h40`, LN(8, '#FFC23A'));
    fr += R(I.x0, I.base - 16, I.x1 - I.x0, 16, 0, { fill: '#000', opacity: 0.2 });
    fr += R(I.x0 - 16, I.top - 14, I.x1 - I.x0 + 32, 30, 8, O('#E8B07A', 5)) + R(I.x0 - 8, I.top - 10, I.x1 - I.x0 + 16, 6, 3, FL('#F6CB94'));
    fr += R(500, I.top - 18, 300, 10, 3, O('#2A2D38', 3));
    // pan + pancake + steam
    const pan = KT.pan;
    fr += P(`M${pan.x - 90} ${pan.y - 2} L${pan.x - 200} ${pan.y - 22}`, LN(16)) + P(`M${pan.x - 90} ${pan.y - 2} L${pan.x - 200} ${pan.y - 22}`, LN(9, '#3A3F52'));
    fr += P(`M${pan.x - 96} ${pan.y - 14} L${pan.x + 96} ${pan.y - 14} L${pan.x + 84} ${pan.y + 6} Q${pan.x} ${pan.y + 16} ${pan.x - 84} ${pan.y + 6} Z`, O('#3A3F52', 5)) + E(pan.x, pan.y - 14, 96, 14, O('#2A2D38', 4));
    if (o.panCake !== false) fr += E(pan.x, pan.y - 18, 62, 10, O('#F4BE62', 3.5)) + E(pan.x - 10, pan.y - 20, 30, 4, { fill: C('#FFE0A0') });
    if (o.steam !== false && !low) {
      let sd = '';
      for (let i = 0; i < 3; i++) { const u = md(tm * 0.5 + i / 3, 1), x = pan.x - 40 + i * 40 + Math.sin(tm * 2 + i) * 10, y = pan.y - 40 - u * 140; sd += `M${f(x)} ${f(y + 50)} q-14 -18 0 -34 q14 -16 0 -34 `; }
      fr += P(sd, { fill: 'none', stroke: '#FFFFFF', 'stroke-width': 9, 'stroke-linecap': 'round', opacity: 0.55 });
    }
    if (o.stack !== false) fr += G(E(0, 8, 74, 14, O('#FFFFFF', 4)) + [0, 1, 2, 3, 4].map((i) => E(0, -i * 13, 56, 12, O(i % 2 ? '#E8A84A' : '#F4BE62', 3.5))).join('') + R(-12, -70, 24, 14, 3, O('#FFF2A8', 3)) + P('M-20 -60 Q-26 -40 -22 -30 Q-18 -26 -14 -40 Z', O('#B9561E', 2.5)), `translate(930 ${I.top - 8})`);
    fr += G(R(-26, -56, 52, 56, 8, O('#FFFFFF', 4)) + P('M-12 -56 L-20 -110 M0 -56 L4 -116 M12 -56 L22 -104', LN(7, '#C98A52')) + R(-28, -124, 22, 16, 4, O('#E8503A', 3)) + E(10, -118, 12, 7, O('#3A3F52', 3)), `translate(380 ${I.top - 12})`);
  }
  {
    const meal = o.meal || (eve ? 'dinner' : 'pancakes');
    fr += R(TB.x0 + 30, TB.top + 36, 30, 990 - TB.top - 36, 5, O('#B9764A', 5)) + R(TB.x1 - 60, TB.top + 36, 30, 990 - TB.top - 36, 5, O('#B9764A', 5));
    let cl = `M${TB.x0 - 10} ${TB.top} H${TB.x1 + 10} L${TB.x1 + 14} ${TB.top + 160}`;
    for (let x = TB.x1 + 14; x > TB.x0 - 14; x -= 56) cl += ` Q${x - 28} ${TB.top + 176} ${x - 56} ${TB.top + 160}`;
    fr += P(cl + ' Z', O('#FFFFFF', 6)) + (det > 0 ? P(cl + ' Z', { fill: 'url(#shKCheck)', opacity: f(det) }) : '') + R(TB.x0 - 10, TB.top - 4, TB.x1 - TB.x0 + 20, 16, 6, O('#FFFFFF', 5));
    fr += R(TB.x0 + 200, TB.top - 6, 280, 10, 4, O('#7CD8B8', 3));
    for (const x of [1300, 1490, 1680]) {
      fr += E(x, TB.top - 4, 66, 12, O('#FFFFFF', 4));
      if (meal === 'dinner') fr += E(x - 14, TB.top - 10, 26, 8, O('#E8A04A', 3)) + E(x + 22, TB.top - 9, 16, 6, O('#6CCB5A', 3));
      else fr += E(x, TB.top - 10, 40, 8, O('#F4BE62', 3)) + R(x - 7, TB.top - 20, 14, 8, 2, O('#FFF2A8', 2));
    }
    fr += R(1390, TB.top - 64, 34, 60, 6, O('#FFFFFF', 4)) + R(1390, TB.top - 40, 34, 20, 0, FL('#FFB13B'));
    fr += P(`M1586 ${TB.top - 4} L1582 ${TB.top - 70} Q1594 ${TB.top - 86} 1606 ${TB.top - 70} L1602 ${TB.top - 4} Z`, O('#B9561E', 4)) + R(1586, TB.top - 96, 16, 16, 3, O('#FFFFFF', 3));
  }
  // ---- light
  let light = '';
  if (!eve) light += P(dP([[W.x0 + 10, W.y0 + 10], [W.x1 - 10, W.y0 + 10], [W.x1 + 220, 1000], [W.x0 + 80, 1000]]), { fill: 'url(#shBeam)', opacity: 0.32 });
  else light += glow(KT.lamp, 380, 380, 'shGlowWarm', 0.75) + cover({ fill: '#FF8A3D', opacity: 0.06 });
  return { bg, mid: m, front: fr, fg: '', light };
}
const kitchen = makeSet(kitchenLayers);

// ================================================================= 4. WORKSHOP — Ivy's garage lab (next door)
// Front view. The OPEN garage door on the LEFT (opening x -260..620) shows the driveway and the street in daylight (or
// evening). Plywood back wall: the rocket sneakers' SCORCH MARK (SPOTS.workshop.scorch), the pegboard with painted tool
// outlines over the workbench (vise, half-built gadget, clamp lamp), the metal rack of half-built inventions (robot arm,
// toaster-drone, jars, "BOOM?" box), the sign IVY'S LAB — KNOCK FIRST (OR EXPLODE), a chalkboard DAYS SINCE LAST EXPLOSION,
// rafters with string lights, a fire extinguisher. FRONT-CENTRE: the folding REHEARSAL TABLE (purple star cloth,
// layers.front) — put the flasks + top hat on SPOTS.workshop.table / .hat / .flasks. Stand line y 990 (FLOOR.workshop, s .5).
// opts: { time 'day'|'evening', soot 0..1 (smudges everywhere), boom 0..1 (fresh scorch: smoke + embers; 0 = the old
//   faint mark), poster (talent-show poster pinned on the pegboard), quiet (sad beat: dim, dusk outside, string lights off,
//   one warm work lamp), days (chalkboard number, default 0), door 0..1 (garage door down; default 0, .55 when quiet),
//   table (default true), lowGfx 0..1 }
const WS = { ceil: 40, base: 800, open: { x0: -260, x1: 620, y0: 150 }, peg: { x0: 930, x1: 1470, y0: 200, y1: 560 }, bench: { x0: 900, x1: 1520, top: 600 }, rack: { x0: 1560, x1: 1860 }, scorch: { x: 780, y: 430 }, table: { x0: 700, x1: 1180, top: 760 } };
def(pat('shPeg', 30, 30, '<circle cx="15" cy="15" r="3.4" fill="#000" opacity="0.28"/>'));
def(pat('shConcrete', 90, 70, '<circle cx="12" cy="18" r="2" fill="#000" opacity="0.1"/><circle cx="60" cy="50" r="2.6" fill="#FFF" opacity="0.14"/><circle cx="74" cy="12" r="1.6" fill="#000" opacity="0.12"/><circle cx="30" cy="58" r="1.4" fill="#FFF" opacity="0.12"/>'));
def(pat('shStarCloth', 70, 70, '<path d="M20 12 l3 7 l7 1 l-5 5 l1 7 l-6 -3 l-6 3 l1 -7 l-5 -5 l7 -1 Z" fill="#FFD23F" opacity="0.85"/><circle cx="52" cy="48" r="3" fill="#FFF" opacity="0.6"/>'));
function workshopLayers(t, o = {}) {
  const quiet = !!o.quiet, eve = quiet || o.time === 'evening' || o.time === 'night';
  const low = b01(o.lowGfx), soot = b01(o.soot), boom = b01(o.boom);
  const tn = tone({ eve: eve ? 0.7 : 0, dim: quiet ? 0.45 : 0, gray: quiet ? 0.25 : 0, low });
  const C = tn.c, O = tn.ol, LN = tn.ln, FL = tn.fl, det = tn.detail;
  const OP = WS.open, door = b01(o.door, quiet ? 0.55 : 0);
  // ---- bg: driveway + the street outside
  let bg = R(OP.x0 - 60, OP.y0 - 60, OP.x1 - OP.x0 + 120, WS.base - OP.y0 + 120, 0, { fill: `url(#${quiet ? 'shSkyNight' : eve ? 'shSkySunset' : 'shSkyDay'})` });
  bg += cloud(160, 260, 0.6, tn, eve ? '#FFD6E6' : '#FFFFFF', eve ? '#F2A0C0' : '#D6E9FF');
  bg += P(`M-180 640 L-180 470 L-20 390 L140 470 L140 640 Z`, O('#F7B48C', 5)) + P('M-200 480 L-20 380 L160 480', LN(16, '#2E7D8A')) + R(-60, 500, 70, 60, 4, O(eve ? '#FFD86B' : '#CDEEFF', 4));
  bg += P(`M300 640 L300 500 L420 440 L560 500 L560 640 Z`, O('#C9B0F2', 5)) + P('M282 508 L420 430 L578 508', LN(14, '#7A5CC8'));
  bg += tree(230, 660, 0.7, tn, { sway: Math.sin(t * 0.9) * 1.5 });
  bg += R(OP.x0 - 60, 640, OP.x1 - OP.x0 + 120, 40, 0, FL('#79C96A')) + R(OP.x0 - 60, 680, OP.x1 - OP.x0 + 120, 50, 0, FL('#8A8FA6')) + P(`M${OP.x0 - 60} 704 H${OP.x1 + 60}`, { stroke: C('#FFE14D'), 'stroke-width': 5, 'stroke-dasharray': '40 30' });
  bg += R(OP.x0 - 60, 730, OP.x1 - OP.x0 + 120, 80, 0, FL('#D2CCC2'));
  // ---- mid
  let m = '';
  const wallD = `M${XL} ${YT} H${XR} V${WS.base} H${XL} Z M${OP.x0} ${OP.y0} V${WS.base} H${OP.x1} V${OP.y0} Z`;
  m += P(wallD, { fill: C('#EBCB9C'), 'fill-rule': 'evenodd' });
  if (det > 0) { let sd = ''; for (let x = OP.x1 + 240; x < XR; x += 240) sd += `M${x} ${WS.ceil} V${WS.base} `; m += P(sd, LN(3, '#C9A070', 0.8 * det)) + P(`M${OP.x1} 420 H${XR}`, LN(3, '#C9A070', 0.6 * det)); }
  // the garage door: rolled up at the top of the opening (or coming down)
  {
    const dh = (WS.base - OP.y0) * door;
    let gd = R(OP.x0 - 20, OP.y0 - 10, OP.x1 - OP.x0 + 40, 70 + dh, 4, O('#F2F2F2', 6));
    let seams = '';
    for (let y = OP.y0 + 20; y < OP.y0 + 60 + dh; y += 54) seams += `M${OP.x0 - 10} ${f(y)} H${OP.x1 + 10} `;
    gd += P(seams, LN(4, '#C9CED8'));
    if (door > 0.05) gd += R(OP.x0 + 40, OP.y0 + dh - 60, OP.x1 - OP.x0 - 80, 36, 6, O(eve ? '#4A3A7A' : '#BFE8FF', 4));
    m += P(`M${OP.x0 - 30} ${OP.y0 - 10} V${WS.base} M${OP.x1 + 30} ${OP.y0 - 10} V${WS.base}`, LN(16, '#8A93A6')) + gd;
    m += P(`M${OP.x0 - 30} ${OP.y0 - 30} H${OP.x1 + 30}`, LN(26)) + P(`M${OP.x0 - 30} ${OP.y0 - 30} H${OP.x1 + 30}`, LN(16, '#C98A52'));
  }
  // rafters + string lights
  m += R(XL, YT, XR - XL, WS.ceil - YT, 0, FL('#D9B080')) + P(`M${XL} ${WS.ceil} H${XR}`, LN(6));
  let raf = '';
  for (let x = -200; x < 2600; x += 320) raf += dR(x, WS.ceil - 4, 34, 30);
  m += P(raf, O('#B9864E', 4));
  const SL = [];
  {
    let w = `M-100 70`;
    for (let i = 0; i < 12; i++) { const xa = -100 + i * 190, xb = xa + 190, ya = i % 2 ? 110 : 70, yb = i % 2 ? 70 : 110; w += ` Q${(xa + xb) / 2} ${(ya + yb) / 2 + 40} ${xb} ${yb}`; for (const u of [0.25, 0.5, 0.75]) SL.push([lerp(xa, xb, u), lerp(ya, yb, u) + 40 * 2 * u * (1 - u) * 2 + 12, i * 3 + Math.round(u * 4)]); }
    m += P(w, LN(3));
    const on = !quiet;
    const BC = ['#FFE066', '#FF8A6A', '#7DFFC0', '#8FD0FF'];
    const bd = ['', '', '', ''];
    SL.forEach(([x, y, i]) => { bd[i % 4] += dE(x, y, 7, 10); });
    bd.forEach((d, i) => { m += P(d, O(on ? BC[i] : '#9A9488', 2.5)); });
  }
  // sign: IVY'S LAB — KNOCK FIRST (OR EXPLODE)
  m += G(P('M-300 -54 L300 -62 L306 56 L-296 60 Z', O('#C98A52', 6)) + P('M-280 -30 L286 -36 M-280 30 L290 26', LN(3, '#A8703E', 0.8)) + T("IVY'S LAB", 0, 6, 64, C('#FFE14D'), OUTX(8, tn.line)) + TF('KNOCK FIRST (OR EXPLODE)', 0, 44, 26, C('#FFFFFF'), OUTX(5, tn.line)) + P('M-270 -60 L-250 -130 M270 -66 L250 -130', LN(4)), `translate(1200 140) rotate(-2)`);
  // scorch mark (old, faint) / fresh with boom
  {
    const S0 = WS.scorch, k = Math.max(0.42, boom > 0 ? 1 : 0, soot * 0.7);
    let sp = '';
    for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2, r = (i % 2 ? 70 : 150) * (0.8 + 0.4 * hash(i * 3.3)); sp += (i ? 'L' : 'M') + `${f(S0.x + Math.cos(a) * r)} ${f(S0.y + Math.sin(a) * r * 0.85)}`; }
    m += P(sp + 'Z', { fill: '#2A2420', opacity: f(0.55 * k) }) + P(dE(S0.x, S0.y, 64, 56), { fill: '#120E0C', opacity: f(0.6 * k) });
    m += G(P('M-26 -12 Q-34 -40 -10 -46 Q14 -48 18 -26 L22 12 Q24 30 4 32 L-14 32 Q-30 30 -26 -12 Z', { fill: '#000', opacity: f(0.5 * k) }), `translate(${S0.x - 24} ${S0.y + 4}) rotate(-20)`) + G(P('M-26 -12 Q-34 -40 -10 -46 Q14 -48 18 -26 L22 12 Q24 30 4 32 L-14 32 Q-30 30 -26 -12 Z', { fill: '#000', opacity: f(0.5 * k) }), `translate(${S0.x + 30} ${S0.y - 6}) rotate(14)`);
    m += P(`M${S0.x + 60} ${S0.y - 50} l40 -30 l10 -26 M${S0.x - 70} ${S0.y + 40} l-36 20 l-30 -6 M${S0.x + 40} ${S0.y + 60} l20 40`, LN(4, '#3A2E26', k));

  }
  // chalkboard: DAYS SINCE LAST EXPLOSION
  m += G(R(-120, -70, 240, 140, 8, O('#C98A52', 6)) + R(-108, -58, 216, 116, 4, FL('#2E4A3E')) + TF('DAYS SINCE LAST', 0, -26, 20, C('#FFFFFF')) + TF('EXPLOSION:', 0, -4, 20, C('#FFFFFF')) + T(String(o.days ?? 0), 0, 46, 48, C('#FFE14D')), `translate(770 205) rotate(2) scale(0.85)`);
  // pegboard + tools (painted outlines)
  {
    const Pg = WS.peg;
    m += R(Pg.x0, Pg.y0, Pg.x1 - Pg.x0, Pg.y1 - Pg.y0, 6, O('#D9A066', 6)) + (det > 0 ? R(Pg.x0 + 6, Pg.y0 + 6, Pg.x1 - Pg.x0 - 12, Pg.y1 - Pg.y0 - 12, 0, { fill: 'url(#shPeg)', opacity: f(det) }) : '');
    const tool = (d, col, x, y, r = 0) => G(P(d, { fill: 'none', stroke: C('#FFFFFF'), 'stroke-width': 16, opacity: 0.5, 'stroke-linejoin': 'round' }) + P(d, O(col, 4)), tr(x, y, 1, r));
    m += tool('M-10 -70 h20 v90 h-20 Z M-34 -96 h68 v30 h-68 Z', '#E8503A', 990, 360) + tool('M-6 -80 h12 v120 h-12 Z M-22 -100 q22 -24 44 0 l-10 20 h-24 Z', '#9AA4B4', 1060, 380, 10);
    m += tool('M-50 -10 h100 l20 -16 v52 l-20 -16 h-100 Z', '#FFD23F', 1190, 270) + tool('M-8 -60 h16 v40 h-16 Z M-3 -20 h6 v80 h-6 Z', '#3DA8D8', 1300, 350) + tool('M-8 -60 h16 v40 h-16 Z M-3 -20 h6 v80 h-6 Z', '#5CB85A', 1340, 350) + tool('M-4 -60 l-26 120 h12 l18 -80 l18 80 h12 l-26 -120 Z', '#FF8A2A', 1410, 380);
    m += tool('M-70 -14 h110 l30 -14 v42 l-30 -14 h-110 Z', '#8A93A6', 1170, 470, -4) + tool('M-30 -30 a30 30 0 1 1 0.1 0 Z', '#FFD23F', 1050, 490);
  }
  // talent show poster pinned on the pegboard
  if (o.poster) {
    let pp = R(-118, -150, 236, 300, 6, O('#FFFFFF', 5)) + R(-104, -136, 208, 120, 4, FL('#8A4FD8')) + T('SCHOOL', 0, -96, 34, C('#FFE14D'), OUTX(5, tn.line)) + T('TALENT SHOW', 0, -54, 34, C('#FFFFFF'), OUTX(5, tn.line));
    pp += P('M-90 6 l8 -16 l8 16 l18 2 l-13 12 l3 18 l-16 -9 l-16 9 l3 -18 l-13 -12 Z', O('#FFD23F', 3)) + T('FRIDAY', 26, 22, 34, C('#E8503A'));
    pp += TF('IVY & YOU:', 0, 76, 24, C('#2E7D8A'), { transform: 'rotate(-4)' }) + TF('SCIENCE MAGIC!', 0, 108, 26, C('#E8503A'), { transform: 'rotate(-4)' }) + P('M-80 120 Q0 132 80 112', LN(3, '#E8503A'));
    pp += CI(-96, -136, 7, O('#FF4D5E', 2.5)) + CI(96, -136, 7, O('#3DA8D8', 2.5));
    m += G(pp, 'translate(1120 380) rotate(-3) scale(0.92)');
  }
  // workbench: top, drawers, vise, gadget, clamp lamp, mug
  {
    const B = WS.bench;
    m += R(B.x0 + 20, B.top + 30, B.x1 - B.x0 - 40, WS.base + 20 - B.top - 30, 4, O('#B9864E', 5)) + R(B.x0 + 40, B.top + 60, 200, 70, 6, O('#D9A066', 4)) + R(B.x0 + 40, B.top + 140, 200, 70, 6, O('#D9A066', 4)) + R(B.x0 + 260, B.top + 180, B.x1 - B.x0 - 300, 14, 4, O('#8A5A33', 4));
    m += G(R(-60, -24, 120, 26, 4, O('#8A93A6', 4)) + R(-70, -34, 140, 14, 3, FL('#FFFFFF')) + R(0, -10, 24, 30, 4, O('#9AA4B4', 4)), `translate(${B.x0 + 330} ${B.top + 220})`);
    m += R(B.x0, B.top, B.x1 - B.x0, 34, 6, O('#C98A52', 6)) + R(B.x0 + 8, B.top + 6, B.x1 - B.x0 - 16, 6, 3, FL('#E0A468'));
    m += G(R(-40, -40, 50, 40, 6, O('#5A6070', 4)) + R(-50, -50, 70, 14, 4, O('#7A8094', 4)) + R(10, -26, 60, 10, 3, O('#7A8094', 3)) + CI(70, -21, 9, O('#E8503A', 3)), `translate(${B.x0 + 60} ${B.top + 2})`);
    m += G(R(-56, -70, 112, 70, 12, O('#B9C3CF', 4)) + CI(-22, -40, 13, O('#FFF8D0', 3)) + CI(22, -40, 13, O('#FFF8D0', 3)) + CI(-22, -40, 5, FL(LINE)) + CI(22, -40, 5, FL(LINE)) + P('M-20 -12 h40', LN(4)) + P('M-60 -30 q-30 10 -20 40 M60 -30 q30 10 18 40', LN(4, '#E8503A')) + P('M0 -70 V-100', LN(4)) + CI(0, -104, 8, O('#FFD23F', 3)), `translate(${B.x0 + 300} ${B.top + 2})`);
    m += G(R(-20, -44, 40, 44, 6, O('#FF8FC0', 4)) + P('M-8 -44 L-14 -76 M2 -44 L4 -80 M12 -44 L20 -70', LN(5, '#3DA8D8')), `translate(${B.x1 - 70} ${B.top + 2})`);
    m += G(P('M0 0 L-30 -90 L40 -150', LN(12)) + P('M0 0 L-30 -90 L40 -150', LN(6, '#5A6070')) + G(P('M-26 -10 L26 -10 L34 22 L-34 22 Z', O('#3DA8D8', 4)), 'translate(52 -150) rotate(30)') + R(-16, -6, 32, 12, 3, O('#5A6070', 3)), `translate(${B.x1 - 170} ${B.top + 2})`);
  }
  // metal rack with half-built inventions
  {
    const K = WS.rack;
    let r = P(`M${K.x0} ${WS.base + 10} V170 M${K.x1} ${WS.base + 10} V170`, LN(14)) + P(`M${K.x0} ${WS.base + 10} V170 M${K.x1} ${WS.base + 10} V170`, LN(7, '#7A8CA8'));
    for (const y of [300, 480, 660]) r += R(K.x0 - 10, y, K.x1 - K.x0 + 20, 16, 3, O('#9AAAC4', 4));
    // robot arm (top)
    r += G(R(-40, -16, 80, 16, 4, O('#5A6070', 4)) + P('M0 -16 L-20 -90 L50 -140', LN(16)) + P('M0 -16 L-20 -90 L50 -140', LN(9, '#FFB13B')) + CI(-20, -90, 9, O('#5A6070', 3)) + P('M50 -140 l24 -10 M50 -140 l20 14', LN(6)) + P('M-14 -50 q-30 10 -24 40', LN(3, '#E8503A')), `translate(${K.x0 + 80} 300)`);
    r += G(R(-26, -34, 52, 34, 4, O('#FFFFFF', 3.5)) + TF('BOLTS', 0, -12, 12, C('#3A3F52')), `translate(${K.x1 - 60} 300)`);
    // toaster-drone (middle)
    r += G(R(-54, -54, 108, 54, 16, O('#C9CED8', 4)) + R(-34, -62, 24, 10, 3, FL('#2A2D38')) + R(10, -62, 24, 10, 3, FL('#2A2D38')) + P('M-54 -40 L-90 -62 M54 -40 L90 -62', LN(5)) + E(-90, -64, 30, 6, O('#E8503A', 3)) + E(90, -64, 30, 6, O('#E8503A', 3)) + CI(-12, -26, 5, FL('#3DFF9A')), `translate(${K.x0 + 110} 480)`);
    r += G(R(-34, -44, 68, 44, 4, O('#E8C890', 3.5)) + TF('BOOM?', 0, -16, 16, C('#E8503A')), `translate(${K.x1 - 60} 480)`);
    // jars + goggles (bottom)
    r += G(R(-22, -50, 44, 50, 8, O('#BFE8FF', 3.5)) + R(-24, -58, 48, 12, 4, O('#E8503A', 3)) + R(-16, -30, 32, 22, 4, FL('#9DFFCB')), `translate(${K.x0 + 50} 660)`) + G(R(-22, -40, 44, 40, 8, O('#BFE8FF', 3.5)) + R(-24, -48, 48, 12, 4, O('#3DA8D8', 3)) + R(-16, -24, 32, 18, 4, FL('#FF8FC0')), `translate(${K.x0 + 110} 660)`);
    r += G(P('M-40 -14 Q-40 -34 -20 -34 L20 -34 Q40 -34 40 -14 Q40 6 20 6 L-20 6 Q-40 6 -40 -14 Z', O('#2A2D38', 4)) + CI(-18, -14, 13, O('#9FE8FF', 3)) + CI(18, -14, 13, O('#9FE8FF', 3)), `translate(${K.x1 - 70} 650)`);
    m += r;
    // fire extinguisher (essential)
    m += G(R(-24, -110, 48, 110, 14, O('#E8243C', 5)) + R(-12, -130, 24, 22, 4, O('#2A2D38', 4)) + P('M12 -122 q30 0 26 40', LN(6)) + R(-24, -70, 48, 26, 0, FL('#FFFFFF')), `translate(1888 ${WS.base + 6})`);
  }
  // fresh boom: smoke cloud (one outlined silhouette) + embers, in front of the wall props
  if (boom > 0) {
    const S0 = WS.scorch;
    let sd = '';
    for (let i = 0; i < 8; i++) { const u = clamp(boom * 1.3 - hash(i) * 0.3, 0, 1); if (u <= 0) continue; sd += dC(S0.x + (hash(i * 2.7) - 0.5) * 220 + Math.sin(t * 2 + i) * 10, S0.y - 30 - u * 240 * (0.4 + hash(i * 5.1)), 44 + 56 * u); }
    if (sd) m += G(P(sd, { fill: tn.line, stroke: tn.line, 'stroke-width': 10 }) + P(sd, { fill: C('#8A8480') }) + P(sd, { fill: '#FFFFFF', opacity: 0.12 }), null, { opacity: f(0.85 * (1 - boom * 0.6)) });
    m += glow(S0.x, S0.y, 180, 'shGlowLava', 0.8 * (1 - boom));
    let em = '';
    for (let i = 0; i < 10; i++) { const a = hash(i * 7.3) * Math.PI * 2, d = 60 + boom * 220 * hash(i); em += dR(S0.x + Math.cos(a) * d, S0.y + Math.sin(a) * d * 0.8, 9, 9); }
    m += P(em, { fill: '#FFB23A', stroke: LINE, 'stroke-width': 2, opacity: f(1 - boom) });
  }
  // floor: concrete with an oil stain + expansion joint
  m += R(XL, WS.base, XR - XL, YB - WS.base, 0, FL('#BDB7AE')) + (det > 0 ? R(XL, WS.base, XR - XL, YB - WS.base, 0, { fill: 'url(#shConcrete)', opacity: f(det) }) : '') + P(`M${XL} ${WS.base} H${XR}`, LN(5)) + P(`M${OP.x1 + 80} ${WS.base} L${OP.x1 + 260} ${YB}`, LN(4, '#9A948A', 0.7));
  m += E(1400, 900, 120, 22, { fill: C('#5A5660'), opacity: 0.3 }) + E(300, 940, 90, 16, { fill: C('#5A5660'), opacity: 0.25 });
  // soot smudges
  if (soot > 0) {
    let sd = '';
    for (let i = 0; i < 16; i++) sd += dE(OP.x1 + 80 + hash(i * 3.9) * 1300, 120 + hash(i * 6.1) * 760, 40 + 70 * hash(i), 20 + 30 * hash(i * 2));
    m += P(sd, { fill: '#2A2420', opacity: f(0.3 * soot) });
  }
  // ---- front: the rehearsal table
  let fr = '';
  if (o.table !== false) {
    const Tb = WS.table;
    fr += R(Tb.x0 + 40, Tb.top + 20, 14, 990 - Tb.top - 20, 3, O('#7A8094', 3)) + R(Tb.x1 - 54, Tb.top + 20, 14, 990 - Tb.top - 20, 3, O('#7A8094', 3));
    let cl = `M${Tb.x0 - 14} ${Tb.top - 6} H${Tb.x1 + 14} L${Tb.x1 + 20} ${Tb.top + 130}`;
    for (let x = Tb.x1 + 20; x > Tb.x0 - 20; x -= 40) cl += ` Q${x - 20} ${Tb.top + 146} ${x - 40} ${Tb.top + 130}`;
    fr += P(cl + ' Z', O('#5A2E9A', 6)) + (det > 0 ? P(cl + ' Z', { fill: 'url(#shStarCloth)', opacity: f(det) }) : '') + P(`M${Tb.x0 - 14} ${Tb.top + 6} H${Tb.x1 + 14}`, LN(4, '#FFD23F', 0.9));
  }
  // ---- light
  let light = '';
  if (!quiet && eve) { for (const [x, y] of SL) light += glow(x, y, 34, 'shGlowWarm', 0.7); light += cover({ fill: '#FF8A3D', opacity: 0.05 }); }
  if (!eve) light += P(dP([[OP.x0, OP.y0], [OP.x1, OP.y0], [OP.x1 + 420, 1100], [OP.x0 + 200, 1100]]), { fill: 'url(#shBeam)', opacity: 0.22 });
  if (quiet) light += glow(1210, 520, 380, 'shGlowWarm', 0.7) + darkRing(1150, 600, 560, 380, '#0A0820', 0.5);
  return { bg, mid: m, front: fr, fg: '', light };
}
const workshop = makeSet(workshopLayers);

// ================================================================= 6. STREET — the family's street (camera-taking, parallax)
// One plane at k 1 holds the houses, front yards, the white picket fence, the sidewalk (stand line y 935, SPOTS.street.stand)
// and the road (bottom). World x -2600..6400: the HILL at the left (x -1500..250, the sidewalk climbs 470 px; ground height
// at any x = SPOTS.street.standY(x)), the cold-open BUMP at x 300, OUR HOUSE (x 900: two storeys, peach siding, dark-teal
// roof, gable window = YOUR room), Bea's TRAMPOLINE in the yard (x 1560), IVY'S HOUSE with the open garage (x 2320), a
// yellow house (x 3000), the BUS STOP (x 3420) + STOP sign at the CORNER (side street x 3560..3860), more houses after.
// Behind: a back row of roofs + trees (k .55), hills with the town's water tower (k .2), sky (k 0), clouds (k .06), flying
// birds (k .7); power poles + wires on the sidewalk's back edge (k 1) with birds on the top wire (SPOTS.street.wireBirds).
// Foreground (k 1.25): branches hanging in from the top every 2600 px. Hero s .34 on the sidewalk (SPOTS.street.s).
// opts: { time 'morning'|'day'|'sunset' (default morning), lowGfx 0..1 (objects pop one by one into 2006 grey boxes / cones /
//   cubes, ground + sky flatten; animate k 0 -> 1 over ~1.5 s), frozen 0..1 (motion stutters then stops at freezeAt: birds
//   stuck mid-flap, leaves hang in the air, clouds stop), freezeAt (s), red 0..1 (corrupted alarm sky + red-tinted world),
//   dog { x, flip, walk, through } (the neighbourhood dog on the sidewalk; through: true = it is half inside the fence),
//   bus (x of the school bus on the road, wheels SPOTS.street.busLane) | { x, flip, sign, lowK }, birds (default true),
//   leaves (default true), checkpoint (true: a faint green glow on SPOTS.street.checkpoint — the pad itself is the FX kit's) }
const SR = { stand: 935, hill: { x0: -1500, x1: 250, h: 470 }, house: 900, tramp: 1560, ivy: 2320, yellow: 3000, corner: { x0: 3560, x1: 3860 }, busStop: 3420, gate: { x0: 800, x1: 1000 }, bump: 300 };
const standY = (x) => SR.stand - SR.hill.h * sm(0, 1, (SR.hill.x1 - x) / (SR.hill.x1 - SR.hill.x0));
const houseBase = (x) => standY(x) - 255;
const fenceY = (x) => standY(x) - 55;
const STREET_PAL = [['#FFD6A8', '#C8553D', '#3DA8D8'], ['#CFE3FF', '#4A63E8', '#E8503A'], ['#D9F5C9', '#2FA37A', '#8A5AD8'], ['#FFE8A0', '#E8803A', '#2F7290'], ['#E8D6FF', '#8A4FD8', '#FFC23A'], ['#FFD1D8', '#D8506E', '#3FA650']];
// samples of the ground profile in [x0, x1] (dense only on the hill)
function profile(x0, x1, off = 0) {
  const pts = [];
  const h0 = SR.hill.x0 - 40, h1 = SR.hill.x1 + 40;
  pts.push([x0, standY(x0) + off]);
  for (let x = Math.max(x0, h0); x < Math.min(x1, h1); x += 50) if (x > x0) pts.push([x, standY(x) + off]);
  pts.push([x1, standY(x1) + off]);
  return pts;
}
const bandBetween = (x0, x1, a, b) => dP([...profile(x0, x1, a), ...profile(x0, x1, b).reverse()]);
// a window with mullions (+ optional shutters)
function houseWin(x, y, w, h, tn, o = {}) {
  let s = '';
  if (o.shut) s += R(x - 22, y - 4, 20, h + 8, 3, tn.ol(o.shut, 4)) + R(x + w + 2, y - 4, 20, h + 8, 3, tn.ol(o.shut, 4));
  s += R(x, y, w, h, 5, tn.ol(o.lit ? '!#FFD86B' : '#BFE6FF', 5)) + P(`M${x + w / 2} ${y} V${y + h} M${x} ${y + h / 2} H${x + w}`, tn.ln(5, '#FFFFFF')) + P(`M${x + 8} ${y + h - 10} L${x + w * 0.45} ${y + 8}`, tn.ln(6, '#FFFFFF', 0.5 * tn.detail));
  if (o.box) s += R(x - 8, y + h, w + 16, 20, 4, tn.ol('#C98A52', 4)) + P(dC(x + 10, y + h - 2, 9) + dC(x + w / 2, y + h - 4, 10) + dC(x + w - 10, y + h - 2, 9), tn.ol(o.box, 3));
  return s;
}
// OUR HOUSE: origin = (centre x, foundation base y). 640 wide, ~640 tall.
function famHouse(x, y, tn, o = {}) {
  if (o.lowK) {
    let l = R(x - 270, y - 460, 540, 460, 0, tn.fl('#B8A898')) + P(`M${x - 290} ${y - 450} L${x} ${y - 650} L${x + 290} ${y - 450} Z`, tn.fl('#6E7A7E')) + R(x + 270, y - 250, 120, 250, 0, tn.fl('#A89888'));
    l += P(dR(x - 200, y - 400, 100, 90) + dR(x + 100, y - 400, 100, 90) + dR(x - 200, y - 190, 100, 90) + dR(x + 100, y - 190, 100, 90) + dR(x - 50, y - 560, 100, 70), tn.fl('#5A6066')) + R(x - 50, y - 190, 100, 190, 0, tn.fl('#4A4E52'));
    l += P(`M${x + 390} ${y - 250} l40 -24 V${y - 24} L${x + 390} ${y} Z`, { fill: '#000', opacity: 0.16 });
    return l;
  }
  const lit = !!o.lit;
  let h = '';
  // chimney + right wing (one storey, flat roof)
  h += R(x + 140, y - 640, 70, 170, 4, tn.ol('#C8553D', 6)) + (tn.detail > 0 ? R(x + 140, y - 640, 70, 170, 4, { fill: 'url(#shBrick)', opacity: f(tn.detail) }) : '') + R(x + 130, y - 660, 90, 24, 4, tn.ol('#9A3E2C', 5));
  h += R(x + 270, y - 250, 130, 250, 4, tn.ol('#F2A47A', 6)) + R(x + 258, y - 270, 154, 28, 6, tn.ol('#2E7D8A', 6)) + CI(x + 335, y - 150, 34, tn.ol(lit ? '#FFD86B' : '#BFE6FF', 5)) + P(`M${x + 301} ${y - 150} H${x + 369} M${x + 335} ${y - 184} V${y - 116}`, tn.ln(4, '#FFFFFF'));
  // main block
  h += R(x - 270, y - 460, 540, 460, 4, tn.ol('#F7B48C', 7)) + (tn.detail > 0 ? R(x - 270, y - 460, 540, 460, 4, { fill: 'url(#shSiding)', opacity: f(tn.detail) }) : '');
  h += R(x - 270, y - 30, 540, 30, 0, tn.fl('#C98A6A')) + P(`M${x - 270} ${y - 230} H${x + 270}`, tn.ln(10, '#FFF3DC')) + P(`M${x - 270} ${y - 230} H${x + 270}`, tn.ln(3));
  // gable roof with your window
  h += P(`M${x - 300} ${y - 440} L${x} ${y - 660} L${x + 300} ${y - 440} Z`, tn.ol('#2E7D8A', 7)) + (tn.detail > 0 ? P(`M${x - 300} ${y - 440} L${x} ${y - 660} L${x + 300} ${y - 440} Z`, { fill: 'url(#shShingle)', opacity: f(tn.detail) }) : '');
  h += P(`M${x - 210} ${y - 460} L${x} ${y - 614} L${x + 210} ${y - 460} Z`, tn.ol('#FFE0C4', 5));
  h += houseWin(x - 60, y - 580, 120, 90, tn, { lit: o.heroLit ?? lit }) + P(`M${x - 60} ${y - 580} q30 30 0 60 M${x + 60} ${y - 580} q-30 30 0 60`, tn.ln(6, '#F2735A', tn.detail));
  h += P(`M${x - 320} ${y - 432} L${x} ${y - 678} L${x + 320} ${y - 432}`, tn.ln(14)) + P(`M${x - 320} ${y - 432} L${x} ${y - 678} L${x + 320} ${y - 432}`, tn.ln(7, '#FFF3DC'));
  // upstairs + downstairs windows, porch + door + steps
  h += houseWin(x - 210, y - 400, 110, 100, tn, { shut: '#2E9C9C', lit }) + houseWin(x + 100, y - 400, 110, 100, tn, { shut: '#2E9C9C', lit });
  h += houseWin(x - 220, y - 190, 120, 100, tn, { box: '#FF6FB5', lit }) + houseWin(x + 100, y - 190, 120, 100, tn, { box: '#FFD23F', lit });
  h += R(x - 55, y - 200, 110, 200, 6, tn.ol('#2E9C9C', 6)) + R(x - 36, y - 180, 72, 60, 6, tn.ol(lit ? '#FFD86B' : '#BFE6FF', 4)) + CI(x + 36, y - 96, 7, tn.ol('#FFC23A', 2.5));
  h += P(`M${x - 100} ${y - 216} L${x} ${y - 276} L${x + 100} ${y - 216} Z`, tn.ol('#2E7D8A', 6)) + P(`M${x - 84} ${y - 216} V${y - 10} M${x + 84} ${y - 216} V${y - 10}`, tn.ln(12)) + P(`M${x - 84} ${y - 216} V${y - 10} M${x + 84} ${y - 216} V${y - 10}`, tn.ln(6, '#FFF3DC'));
  h += R(x - 90, y - 14, 180, 16, 4, tn.ol('#D9D2C8', 4)) + R(x - 110, y, 220, 16, 4, tn.ol('#C9C3BC', 4));
  h += R(x + 150, y - 100, 40, 30, 4, tn.ol('#FFFFFF', 3)) + TF('42', x + 170, y - 78, 18, tn.c('#2E7D8A'));
  return h;
}
// a generic neighbour house. origin = (centre x, base y)
function suburbHouse(x, y, i, tn, o = {}) {
  const [wall, roof, door] = STREET_PAL[md(i, STREET_PAL.length)];
  const w = 420 + 80 * hash(i * 2.3), hgt = 300 + 80 * hash(i * 3.1), two = hash(i * 7.7) > 0.45;
  const H = two ? hgt + 120 : hgt;
  if (o.lowK) {
    let l = R(x - w / 2, y - H, w, H, 0, tn.fl(wall)) + P(`M${x - w / 2 - 20} ${y - H} L${x} ${y - H - 150} L${x + w / 2 + 20} ${y - H} Z`, tn.fl(roof));
    l += P(dR(x - w / 2 + 50, y - H + 50, 90, 80) + dR(x + w / 2 - 140, y - H + 50, 90, 80), tn.fl('#5A6066')) + R(x - 40, y - 170, 80, 170, 0, tn.fl('#4A4E52'));
    l += P(`M${x + w / 2} ${y - H} l40 -24 V${y - 24} L${x + w / 2} ${y} Z`, { fill: '#000', opacity: 0.16 });
    return l;
  }
  let h = R(x - w / 2, y - H, w, H, 4, tn.ol(wall, 6)) + (tn.detail > 0 ? R(x - w / 2, y - H, w, H, 4, { fill: 'url(#shSiding)', opacity: f(tn.detail) }) : '');
  h += P(`M${x - w / 2 - 30} ${y - H + 10} L${x} ${y - H - 160} L${x + w / 2 + 30} ${y - H + 10} Z`, tn.ol(roof, 6)) + (tn.detail > 0 ? P(`M${x - w / 2 - 30} ${y - H + 10} L${x} ${y - H - 160} L${x + w / 2 + 30} ${y - H + 10} Z`, { fill: 'url(#shShingle)', opacity: f(tn.detail) }) : '');
  h += houseWin(x - w / 2 + 50, y - H + 50, 96, 84, tn, { lit: o.lit }) + houseWin(x + w / 2 - 146, y - H + 50, 96, 84, tn, { lit: o.lit });
  if (two) h += houseWin(x - w / 2 + 50, y - 200, 96, 84, tn, { box: '#FF6FB5', lit: o.lit });
  h += R(x - 42, y - 180, 84, 180, 6, tn.ol(door, 5)) + CI(x + 26, y - 90, 6, tn.ol('#FFC23A', 2));
  return h;
}
// Ivy's house: lavender, one storey + the OPEN garage (lab glimpse: string lights, rack, the scorch)
function ivyHouse(x, y, tn, t, o = {}) {
  if (o.lowK) return R(x - 380, y - 330, 760, 330, 0, tn.fl('#A8A0B4')) + P(`M${x - 400} ${y - 330} L${x - 60} ${y - 470} L${x + 400} ${y - 330} Z`, tn.fl('#5E5A70')) + R(x + 40, y - 250, 300, 250, 0, tn.fl('#3A3A40')) + R(x - 300, y - 250, 110, 90, 0, tn.fl('#5A6066'));
  let h = R(x - 380, y - 330, 760, 330, 4, tn.ol('#D9C8F2', 7)) + (tn.detail > 0 ? R(x - 380, y - 330, 760, 330, 4, { fill: 'url(#shSiding)', opacity: f(tn.detail) }) : '');
  h += P(`M${x - 410} ${y - 320} L${x - 60} ${y - 480} L${x + 410} ${y - 320} Z`, tn.ol('#6A4FB8', 7)) + (tn.detail > 0 ? P(`M${x - 410} ${y - 320} L${x - 60} ${y - 480} L${x + 410} ${y - 320} Z`, { fill: 'url(#shShingle)', opacity: f(tn.detail) }) : '');
  h += houseWin(x - 310, y - 260, 110, 96, tn, { shut: '#6A4FB8', box: '#FFD23F', lit: o.lit });
  h += R(x - 160, y - 200, 90, 200, 6, tn.ol('#FF8A2A', 5)) + CI(x - 88, y - 100, 6, tn.ol('#FFC23A', 2));
  // open garage
  const gx0 = x + 30, gx1 = x + 350;
  h += R(gx0, y - 260, gx1 - gx0, 260, 2, tn.ol('#3A3050', 6)) + R(gx0 + 6, y - 260, gx1 - gx0 - 12, 34, 0, tn.fl('#F2F2F2')) + P(`M${gx0 + 6} ${y - 243} H${gx1 - 6}`, tn.ln(3, '#C9CED8'));
  let sl = '';
  for (let i = 0; i < 9; i++) sl += dC(gx0 + 24 + i * 34, y - 206 + (i % 2) * 8, 5);
  h += P(sl, { fill: tn.c('#FFE066') }) + R(gx0 + 200, y - 190, 100, 190, 0, tn.ol('#7A8CA8', 3)) + P(`M${gx0 + 200} ${y - 130} H${gx0 + 300} M${gx0 + 200} ${y - 70} H${gx0 + 300}`, tn.ln(4)) + R(gx0 + 30, y - 110, 150, 16, 3, tn.ol('#C98A52', 3));
  h += E(gx0 + 100, y - 160, 30, 26, { fill: '#000', opacity: 0.4 }) + R(gx0 - 6, y - 4, gx1 - gx0 + 12, 8, 0, tn.fl('#C9C3BC'));
  h += G(R(-60, -16, 120, 32, 4, tn.ol('#C98A52', 3)) + TF("IVY'S LAB", 0, 8, 18, tn.c('#FFE14D')), `translate(${(gx0 + gx1) / 2} ${y - 290})`);
  return h;
}
// Bea's trampoline (side-ish view). origin = centre of the mat (characters jump on it: mat y = origin y)
function trampoline(x, y, tn, o = {}) {
  if (o.lowK) return R(x - 170, y - 6, 340, 14, 0, tn.fl('#3A3A3A')) + R(x - 150, y + 8, 14, 60, 0, tn.fl('#6E6E6E')) + R(x + 136, y + 8, 14, 60, 0, tn.fl('#6E6E6E'));
  let s = E(x, y + 72, 190, 16, { fill: '#000', opacity: 0.14 });
  s += P(`M${x - 150} ${y + 10} L${x - 170} ${y + 72} M${x - 150} ${y + 10} L${x - 110} ${y + 72} M${x + 150} ${y + 10} L${x + 170} ${y + 72} M${x + 150} ${y + 10} L${x + 110} ${y + 72}`, tn.ln(12)) + P(`M${x - 150} ${y + 10} L${x - 170} ${y + 72} M${x - 150} ${y + 10} L${x - 110} ${y + 72} M${x + 150} ${y + 10} L${x + 170} ${y + 72} M${x + 150} ${y + 10} L${x + 110} ${y + 72}`, tn.ln(6, '#9AA4B4'));
  s += E(x, y, 186, 34, tn.ol('#FF6FB5', 6)) + E(x, y - 2, 150, 22, tn.ol('#2A2D38', 4));
  let pd = '';
  for (let i = 0; i < 8; i++) { const a = Math.PI * (0.06 + 0.88 * i / 7); pd += dE(x - Math.cos(a) * 168, y + Math.sin(a) * 28, 16, 8); }
  s += P(pd, { fill: tn.c('#3DA8D8') });
  return s;
}
function picketFence(x0, x1, tn, o = {}) {
  // white pickets along the back edge of the sidewalk (gaps: the gates)
  if (o.lowK) return P(bandBetween(x0, x1, -150, -55), tn.fl('#C8C4BC'));
  let pk = '', rail = '';
  for (let x = Math.ceil(x0 / 44) * 44; x < x1; x += 44) {
    if (o.gaps && o.gaps.some(([a, b]) => x > a && x < b)) continue;
    const y = fenceY(x);
    pk += dP([[x - 15, y], [x - 15, y - 104], [x, y - 124], [x + 15, y - 104], [x + 15, y]]);
  }
  for (const off of [-90, -40]) { const pts = profile(x0, x1, -55 + off); rail += 'M' + pts.map(([a, b]) => `${f(a)} ${f(b)}`).join('L') + ' '; }
  return P(rail, tn.ln(16)) + P(rail, tn.ln(9, '#FFF8EC')) + P(pk, tn.ol('#FFFFFF', 4.5));
}
function powerPole(x, base, tn, o = {}) {
  if (o.lowK) return R(x - 12, base - 760, 24, 760, 0, tn.fl('#6E6458')) + R(x - 90, base - 730, 180, 14, 0, tn.fl('#6E6458'));
  return R(x - 14, base - 770, 28, 770, 6, tn.ol('#9A7A58', 5)) + R(x - 100, base - 736, 200, 18, 4, tn.ol('#8A6A48', 5)) + CI(x - 86, base - 744, 7, tn.ol('#BFE6FF', 2.5)) + CI(x + 86, base - 744, 7, tn.ol('#BFE6FF', 2.5)) + CI(x, base - 776, 7, tn.ol('#BFE6FF', 2.5)) + R(x - 20, base - 560, 40, 26, 4, tn.ol('#7A8094', 3));
}
const POLE_EVERY = 1250, POLE_X0 = 470;
function wirePts(i) {
  const xa = POLE_X0 + i * POLE_EVERY, xb = xa + POLE_EVERY;
  return [[xa, fenceY(xa) - 776], [xb, fenceY(xb) - 776]];
}
function streetLayers(t, cam = {}, o = {}) {
  const time = o.time || 'morning', sunset = time === 'sunset', morn = time === 'morning';
  const lowG = b01(o.lowGfx), red = b01(o.red), frz = b01(o.frozen);
  const tm = frz >= 1 ? (o.freezeAt ?? 0) : frz > 0 ? Math.floor(t * lerp(24, 3, frz)) / lerp(24, 3, frz) : t;
  const tone0 = { morn: morn ? 0.5 : 0, eve: sunset ? 0.55 : 0, red };
  const tnB = tone({ ...tone0, low: lowG });                       // bands, ground, sky things (smooth)
  const tnH = tone({ ...tone0, low: lowG * 0.45 });                // objects still in high graphics
  const tnL = tone({ ...tone0, low: 1 });                          // popped objects
  const obj = (th, hiFn, loFn, cx, cy, box) => { const lk = lowAt(lowG, th); const s = lk ? loFn(tnL) : hiFn(tnH); return lk ? lowPop(s, lowG, th, cx, cy, box) : s; };
  const thOf = (x, salt = 0) => 0.06 + 0.82 * hash(x * 0.0137 + salt);
  // ---- sky (k 0)
  const v0 = vis(cam, 0);
  const SKYB = [v0.x0 - 200, v0.y0 - 200, v0.x1 + 200, v0.y1 + 200];
  let sky = R(SKYB[0], SKYB[1], SKYB[2] - SKYB[0], SKYB[3] - SKYB[1], 0, { fill: `url(#${sunset ? 'shSkySunset' : morn ? 'shSkyMorning' : 'shSkyDay'})` });
  if (lowG > 0) sky += R(SKYB[0], SKYB[1], SKYB[2] - SKYB[0], SKYB[3] - SKYB[1], 0, { fill: 'url(#shSkyLow)', opacity: f(sm(0, 0.6, lowG)) });
  // sun
  const sunP = sunset ? [1500, 620] : morn ? [380, 330] : [1560, 170];
  let sunS = lowAt(lowG, 0.3) ? R(sunP[0] - 46, sunP[1] - 46, 92, 92, 0, { fill: '#F2F2EA' }) : glow(sunP[0], sunP[1], 200, 'shGlowWarm', 0.9) + CI(sunP[0], sunP[1], 62, { fill: sunset ? '#FFE09A' : '#FFE45C', stroke: '#FFB42E', 'stroke-width': 7 });
  if (red > 0) sky += redSky(SKYB[0], SKYB[1], SKYB[2], SKYB[3], red, t, { tm, hole: [560, 40, 1360, 420] });
  // clouds (k .06)
  const vc = vis(cam, 0.06);
  let cl = '';
  for (let i = Math.floor((vc.x0 - 400) / 700); i * 700 < vc.x1 + 400; i++) {
    const x = i * 700 + md(hash(i * 2.7) * 400 + tm * (6 + 6 * hash(i)), 700), y = 130 + 220 * hash(i * 9.3), s = 0.55 + 0.5 * hash(i * 5.5);
    cl += obj(thOf(i * 700, 3), (tn) => cloud(x, y, s, tn, sunset ? '#FFE3EC' : '#FFFFFF', sunset ? '#F4AFC8' : '#D6E9FF'), (tn) => cloudLow(x, y, s, tn));
  }
  // hills + water tower (k .2)
  const vh = vis(cam, 0.2);
  let hills = '';
  {
    const pts = [];
    for (let x = Math.floor((vh.x0 - 400) / 160) * 160; x < vh.x1 + 400; x += 160) pts.push([x, 470 - 60 * Math.sin(x * 0.0021) - 40 * hash(Math.round(x / 160) * 1.7)]);
    const hc = tnB.c(sunset ? '#B98AA8' : '#9ED6A0');
    if (lowG > 0.5) hills += P(dP([[pts[0][0], 1400], ...pts, [pts[pts.length - 1][0], 1400]]), { fill: tnB.c('#8E9C88') });
    else {
      let d = `M${pts[0][0]} 1400 L${pts[0][0]} ${f(pts[0][1])}`;
      for (let j = 1; j < pts.length; j++) d += ` Q${f((pts[j - 1][0] + pts[j][0]) / 2)} ${f(Math.min(pts[j - 1][1], pts[j][1]) - 30)} ${f(pts[j][0])} ${f(pts[j][1])}`;
      d += ` L${pts[pts.length - 1][0]} 1400 Z`;
      hills += P(d, { fill: hc });
      for (let x = Math.floor(vh.x0 / 260) * 260; x < vh.x1; x += 260) if (hash(x * 0.01) > 0.45) hills += pine(x + 80 * hash(x), 500 - 50 * Math.sin(x * 0.0021), 0.3, tnB, { col: sunset ? '#7A5A8A' : '#5FAE7A' });
    }
    // the water tower far away (k .2, x 1450)
    if (vh.x1 > 1300 && vh.x0 < 1600) hills += obj(0.5, (tn) => G(P('M-40 0 L-26 -120 M40 0 L26 -120 M-34 -50 L34 -50', tn.ln(8, '#8A93A6')) + R(-50, -200, 100, 80, 26, tn.ol('#E8F2FF', 5)) + TF('W', 0, -150, 26, tn.c('#3DA8D8')), 'translate(1450 420) scale(0.5)'), (tn) => R(1425, 320, 50, 40, 0, tn.fl('#B0B4B8')) + R(1436, 360, 5, 60, 0, tn.fl('#8E8E8E')) + R(1459, 360, 5, 60, 0, tn.fl('#8E8E8E')));
  }
  // back row of roofs + trees (k .55)
  const vb = vis(cam, 0.55);
  let back = R(vb.x0 - 300, 560, vb.x1 - vb.x0 + 600, 900, 0, { fill: tnB.c(sunset ? '#8DB45E' : '#86CC74') });
  for (let i = Math.floor((vb.x0 - 500) / 560); i * 560 < vb.x1 + 500; i++) {
    const x = i * 560 + 120 * hash(i * 3.7), pal = STREET_PAL[md(i * 7, STREET_PAL.length)];
    const hz = (c) => mix(c, sunset ? '#E8B0C8' : '#CFE8FF', 0.35);
    back += obj(thOf(x, 5), (tn) => R(x - 160, 430, 320, 160, 4, tn.ol(hz(pal[0]), 5)) + P(`M${x - 190} 440 L${x} 320 L${x + 190} 440 Z`, tn.ol(hz(pal[1]), 5)) + R(x - 110, 470, 60, 50, 4, tn.ol(hz('#BFE6FF'), 3)) + R(x + 50, 470, 60, 50, 4, tn.ol(hz('#BFE6FF'), 3)), (tn) => R(x - 160, 430, 320, 160, 0, tn.fl(hz(pal[0]))) + P(`M${x - 180} 430 L${x} 330 L${x + 180} 430 Z`, tn.fl(hz(pal[1]))));
    if (hash(i * 4.9) > 0.35) back += obj(thOf(x + 280, 6), (tn) => tree(x + 280, 600, 0.75, tn, { col: hz('#4DB85E'), hi: hz('#8BDB7C'), sway: Math.sin(tm * 0.9 + i) * 1.2 }), (tn) => tree(x + 280, 600, 0.75, tn, { lowK: 1, col: '#6E8A62' }));
  }
  // flying birds (k .7)
  let fly = '';
  if (o.birds !== false) {
    for (let i = 0; i < 5; i++) {
      const u = md(tm * 0.025 + i * 0.07, 1), x = -400 + u * 3200 + i * 70 + (cam.x || 0) * 0.7, y = 300 + i * 24 + Math.sin(tm * 1.3 + i) * 12 - (i % 2) * 30;
      fly += obj(thOf(i * 97, 8), (tn) => bird(x, y, 0.8, tn, { flying: true, flap: frz >= 1 ? 0.25 + 0.1 * i : md(tm * 4.5 + i * 0.37, 1), flip: true }), (tn) => bird(x, y, 0.8, tn, { lowK: 1 }));
    }
  }
  // ---- the street plane (k 1)
  const v1 = vis(cam, 1);
  const X0 = v1.x0 - 400, X1 = v1.x1 + 400;
  let m = '';
  // yards (lawn) from far up down to the fence line
  m += P(bandBetween(X0, X1, -420, -55), { fill: tnB.c(sunset ? '#86AE58' : '#6CCB5F') }) + (tnB.detail > 0 ? P(bandBetween(X0, X1, -420, -55), { fill: 'url(#shLawn)', opacity: f(tnB.detail) }) : '');
  // houses
  const HOUSES = [
    { x: SR.house, fn: (tn, lk) => G(famHouse(SR.house, houseBase(SR.house), tn, { lowK: lk }), `translate(${SR.house} ${houseBase(SR.house)}) scale(0.9) translate(${-SR.house} ${-houseBase(SR.house)})`) },
    { x: SR.ivy, fn: (tn, lk) => ivyHouse(SR.ivy, houseBase(SR.ivy), tn, tm, { lowK: lk }) },
    { x: SR.yellow, fn: (tn, lk) => suburbHouse(SR.yellow, houseBase(SR.yellow), 3, tn, { lowK: lk }) },
  ];
  for (let i = -6; i <= -1; i++) { const x = SR.house + i * 620 - 40; HOUSES.push({ x, fn: (tn, lk) => (x < SR.hill.x1 - 100 ? R(x - 260, houseBase(x) - 10, 520, 300, 0, tn.ol('#B9A48A', lk ? 2 : 6)) : '') + suburbHouse(x, houseBase(x) - (x < SR.hill.x1 ? 0 : 0), 10 + i, tn, { lowK: lk }) }); }
  for (let i = 0; i < 6; i++) { const x = SR.corner.x1 + 380 + i * 640; HOUSES.push({ x, fn: (tn, lk) => suburbHouse(x, houseBase(x), 20 + i, tn, { lowK: lk }) }); }
  for (const hs of HOUSES) {
    if (hs.x + 500 < X0 || hs.x - 500 > X1) continue;
    const th = thOf(hs.x, 1);
    const lk = lowAt(lowG, th);
    const s = hs.fn(lk ? tnL : tnH, lk);
    m += lk ? lowPop(s, lowG, th, hs.x, houseBase(hs.x), null) : s;
  }
  // the side street at the corner (recedes to the horizon) + bushes + trees in the yards
  if (SR.corner.x1 > X0 && SR.corner.x0 < X1) {
    const c0 = SR.corner.x0, c1 = SR.corner.x1, fy = fenceY(c0);
    m += P(dP([[c0, fy + 8], [c1, fy + 8], [c1 - 110, 600], [c0 + 110, 600]]), { fill: tnB.c('#8A8FA6') }) + P(`M${(c0 + c1) / 2} ${fy} L${(c0 + c1) / 2} 610`, { stroke: tnB.c('#FFE14D'), 'stroke-width': 6, 'stroke-dasharray': '30 26', fill: 'none' });
  }
  const BUSH = [[SR.house - 330, 0], [SR.house + 420, 1], [SR.ivy - 470, 2], [SR.yellow + 300, 3], [1900, 4]];
  for (const [x, i] of BUSH) {
    if (x < X0 || x > X1) continue;
    const y = houseBase(x) + 10;
    m += obj(thOf(x, 2), (tn) => P(dC(x - 50, y - 20, 40) + dC(x, y - 40, 50) + dC(x + 50, y - 20, 40) + dR(x - 90, y - 30, 180, 30), tn.ol('#3FA650', 6)) + P(dC(x - 20, y - 54, 14) + dC(x + 40, y - 34, 10), { fill: tn.c('#7CD978') }) + (i % 2 ? P(dC(x - 40, y - 30, 7) + dC(x + 20, y - 50, 7) + dC(x + 56, y - 24, 7), { fill: tn.c('#FF6FB5') }) : ''), (tn) => R(x - 90, y - 80, 180, 80, 0, tn.fl('#5E7A52')), x, y);
  }
  const YT = [[1260, 0.9], [2780, 1], [-500, 0.95], [4400, 1.05], [-1200, 0.9]];
  for (const [x, s] of YT) {
    if (x < X0 - 200 || x > X1 + 200) continue;
    const y = houseBase(x) + 120;
    m += obj(thOf(x, 4), (tn) => tree(x, y, s, tn, { sway: frz >= 1 ? 0 : Math.sin(tm * 0.9 + x) * 1.6 }), (tn) => tree(x, y, s, tn, { lowK: 1, col: '#6E8A62' }), x, y);
  }
  // the yard path (stepping stones) to the gate + the trampoline
  if (SR.house > X0 && SR.house < X1) m += obj(0.4, (tn) => P(dE(900, houseBase(900) + 60, 50, 12) + dE(900, houseBase(900) + 110, 56, 14) + dE(900, houseBase(900) + 165, 62, 16), tn.ol('#D9D2C8', 4)), (tn) => R(850, houseBase(900) + 40, 100, 160, 0, tn.fl('#9A968E')));
  if (SR.tramp > X0 && SR.tramp < X1) m += obj(0.22, (tn) => trampoline(SR.tramp, 728, tn), (tn) => trampoline(SR.tramp, 728, tn, { lowK: 1 }), SR.tramp, 728, null);
  // sidewalk, curb, road
  m += P(bandBetween(X0, X1, -55, 33), { fill: tnB.c('#E9E2D6') }) + P(bandBetween(X0, X1, 33, 48), { fill: tnB.c('#BDB6AA') }) + P(bandBetween(X0, X1, 48, 1400), { fill: tnB.c(sunset ? '#6A6484' : '#7C8096') });
  if (tnB.detail > 0) m += P(bandBetween(X0, X1, 48, 1400), { fill: 'url(#shRoad)', opacity: f(tnB.detail) });
  {
    let j = '';
    for (let x = Math.floor(X0 / 140) * 140; x < X1; x += 140) { const y = standY(x); j += `M${x} ${f(y - 55)} L${x - 24} ${f(y + 33)} `; }
    const top = profile(X0, X1, -55), cur = profile(X0, X1, 33), cur2 = profile(X0, X1, 48);
    const pl = (pts) => 'M' + pts.map(([a, b]) => `${f(a)} ${f(b)}`).join('L') + ' ';
    m += P(j, tnB.ln(3, '#C9C1B2', tnB.detail)) + P(pl(top) + pl(cur) + pl(cur2), tnB.ln(4, LINE, 0.55));
    const dash = profile(X0, X1, 150);
    m += P(pl(dash), { fill: 'none', stroke: tnB.c('#FFE6A0'), 'stroke-width': 8, 'stroke-dasharray': '60 50', opacity: f(0.8) });
  }
  // the bump (raised slab + root) at x 300
  if (SR.bump > X0 && SR.bump < X1) { const y = standY(SR.bump); m += P(`M${SR.bump - 70} ${f(y + 6)} Q${SR.bump} ${f(y - 30)} ${SR.bump + 70} ${f(y + 6)}`, tnB.ol('#D9D2C8', 5)) + P(`M${SR.bump - 40} ${f(y - 6)} q20 -14 40 -4 q20 8 36 -4`, tnB.ln(5, '#8A5A33')); }
  // fence (with the gate gap at the path; the dog may pass THROUGH it)
  const fenceSvg = obj(0.33, (tn) => picketFence(Math.max(X0, -2000), Math.min(X1, 3500), tn, { gaps: [[SR.gate.x0 + 20, SR.gate.x1 - 20], [SR.corner.x0 - 30, SR.corner.x1 + 30]] }), (tn) => picketFence(Math.max(X0, -2000), Math.min(X1, 3500), tn, { lowK: 1 }));
  // mailbox at the gate, bus stop + bench + STOP sign at the corner, hydrant
  let props = '';
  if (SR.gate.x1 > X0 && SR.gate.x0 < X1) props += obj(0.45, (tn) => G(R(-8, -150, 16, 150, 3, tn.ol('#8A5A33', 4)) + P('M-44 -150 L-44 -190 Q-44 -216 0 -216 Q44 -216 44 -190 L44 -150 Z', tn.ol('#E8503A', 5)) + R(40, -226, 8, 44, 2, tn.ol('#FFD23F', 2.5)) + R(40, -226, 24, 15, 2, tn.ol('#FFD23F', 2.5)) + TF('42', 0, -172, 16, tn.c('#FFFFFF')), `translate(${SR.gate.x1 + 30} ${fenceY(SR.gate.x1) + 20})`), (tn) => R(SR.gate.x1 + 6, fenceY(SR.gate.x1) - 196, 50, 50, 0, tn.fl('#7A7068')) + R(SR.gate.x1 + 26, fenceY(SR.gate.x1) - 146, 10, 160, 0, tn.fl('#6E6458')));
  if (SR.busStop + 300 > X0 && SR.busStop - 300 < X1) {
    const bx = SR.busStop, by = standY(bx) - 40;
    props += obj(0.55, (tn) => R(bx - 9, by - 330, 18, 330, 4, tn.ol('#7A8094', 5)) + G(R(-70, -56, 140, 112, 12, tn.ol('#2E9C9C', 5)) + R(-54, -40, 108, 46, 6, tn.fl('#FFFFFF')) + T('BUS', 0, -6, 34, tn.c('#2E9C9C')) + TF('STOP', 0, 34, 24, tn.c('#FFFFFF')) + R(-40, 44, 80, 10, 3, tn.fl('#FFD23F')), `translate(${bx} ${by - 360})`) + G(R(-120, -60, 240, 18, 6, tn.ol('#C98A52', 4)) + R(-120, -100, 240, 16, 6, tn.ol('#C98A52', 4)) + P('M-100 -42 V0 M100 -42 V0', tn.ln(8, '#5A6070')), `translate(${bx - 220} ${by + 10})`), (tn) => R(bx - 8, by - 330, 16, 330, 0, tn.fl('#6E6E6E')) + R(bx - 70, by - 420, 140, 110, 0, tn.fl('#5E7A7A')) + R(bx - 340, by - 60, 240, 30, 0, tn.fl('#7A7068')));
    const sx = SR.corner.x0 - 40, sy = standY(sx) - 40;
    props += obj(0.62, (tn) => R(sx - 8, sy - 300, 16, 300, 3, tn.ol('#7A8094', 4)) + G(P('M0 -56 L40 -40 L56 0 L40 40 L0 56 L-40 40 L-56 0 L-40 -40 Z', tn.ol('#E8243C', 5)) + T('STOP', 0, 12, 30, tn.c('#FFFFFF')), `translate(${sx} ${sy - 330}) rotate(22.5) rotate(-22.5)`), (tn) => R(sx - 6, sy - 300, 12, 300, 0, tn.fl('#6E6E6E')) + R(sx - 50, sy - 380, 100, 100, 0, tn.fl('#8A5858')));
  }
  if (1980 > X0 && 1980 < X1) props += obj(0.7, (tn) => G(R(-22, -62, 44, 56, 10, tn.ol('#E8243C', 4)) + R(-30, -68, 60, 14, 6, tn.ol('#E8243C', 4)) + CI(0, -38, 9, tn.ol('#FFC23A', 3)) + R(-12, -6, 24, 8, 2, tn.ol('#C81E30', 3)), `translate(1980 ${standY(1980) + 24})`), (tn) => R(1960, standY(1980) - 40, 40, 64, 0, tn.fl('#7A5858')));
  // power poles + wires + birds on the wire
  let poles = '', wires = '';
  const birdsOnWire = [];
  for (let i = Math.floor((X0 - POLE_X0) / POLE_EVERY) - 1; POLE_X0 + i * POLE_EVERY < X1 + POLE_EVERY; i++) {
    const x = POLE_X0 + i * POLE_EVERY, base = fenceY(x);
    const lk = lowAt(lowG, thOf(x, 9));
    poles += powerPole(x, base, lk ? tnL : tnH, { lowK: lk });
    const [[xa, ya], [xb, yb]] = wirePts(i);
    for (const [dx, dy] of [[-86, 30], [86, 30], [0, 0]]) wires += lowG > 0.5 ? `M${xa + dx} ${f(ya + dy)} L${xb + dx} ${f(yb + dy)} ` : `M${xa + dx} ${f(ya + dy)} Q${(xa + xb) / 2 + dx} ${f((ya + yb) / 2 + dy + 70)} ${xb + dx} ${f(yb + dy)} `;
    if (o.birds !== false && md(i, 2) === 0) for (const u of [0.32, 0.4, 0.62]) { const bx = lerp(xa, xb, u), by = lerp(ya, yb, u) + 70 * 4 * u * (1 - u) * 0.5 * 2 - 2; birdsOnWire.push([bx, by]); }
  }
  let wireBirds = '';
  birdsOnWire.forEach(([x, y], j) => { wireBirds += obj(thOf(x, 12), (tn) => bird(x, y + Math.max(0, Math.sin(tm * 2.2 + j)) * -3, 0.75, tn, { flip: j % 2 === 1 }), (tn) => bird(x, y, 0.75, tn, { lowK: 1 })); });
  m += poles + P(wires, tnB.ln(3.5, LINE, 0.9)) + wireBirds;
  // the dog (half inside the fence when o.dog.through) — drawn around the fence
  let dogBack = '', dogFront = '';
  if (o.dog) {
    const d = typeof o.dog === 'object' ? o.dog : { x: +o.dog };
    const dy = d.through ? fenceY(d.x) - 6 : standY(d.x) - 10;
    const dsvg = streetDog(d.x, dy, d.s ?? 0.9, lowG > 0.5 ? tnL : tnH, { walk: d.walk ?? tm * 7, flip: d.flip, lowK: lowG > 0.5 });
    if (d.through) {
      const id = S.uid('shDogClip');
      dogBack = dsvg;
      dogFront = `<defs><clipPath id="${id}"><rect x="${f(d.x + (d.flip ? -400 : 0))}" y="-2000" width="400" height="4000"/></clipPath></defs>` + G(dsvg, null, { 'clip-path': `url(#${id})` });
    } else dogFront = dsvg;
  }
  m += dogBack + fenceSvg + dogFront + props;
  // the checkpoint's glow on the sidewalk (the pad is drawn by the FX kit)
  if (o.checkpoint) m += glow(700, SR.stand - 40, 220, 'shGlowGreen', 0.7);
  // falling leaves (k 1): freeze in the air with o.frozen
  if (o.leaves !== false && lowG < 0.5) {
    let lv = '';
    for (let i = 0; i < 7; i++) {
      const u = md(tm * 0.09 + hash(i * 3.1), 1), x = v1.x0 + hash(i * 7.7) * (v1.x1 - v1.x0) + Math.sin(tm * 1.5 + i) * 40, y = 120 + u * 800;
      lv += G(P('M0 -12 Q12 -4 0 12 Q-12 -4 0 -12 Z', tnB.ol(i % 2 ? '#FFB13B' : '#7CC85A', 2.5)), tr(x, y, 1.3, tm * 90 + i * 50));
    }
    m += lv;
  }
  // the bus (on the road, in front)
  if (o.bus !== undefined && o.bus !== false && o.bus !== null) {
    const b = typeof o.bus === 'object' ? o.bus : { x: +o.bus };
    m += schoolBus(b.x, SR.stand + 150, b.s ?? 1, lowG > 0.5 ? tnL : tnH, { flip: b.flip, sign: b.sign, lowK: b.lowK ?? lowG > 0.5, ghost: b.ghost });
  }
  // ---- fg (k 1.25): branches from the top
  const vf = vis(cam, 1.25);
  let fg = '';
  for (let i = Math.floor((vf.x0 - 600) / 2600); i * 2600 < vf.x1 + 600; i++) {
    const bx = i * 2600 + 1700;
    fg += obj(thOf(bx, 13), (tn) => P(`M${bx - 360} -80 Q${bx - 140} 0 ${bx + 100} 40`, tn.ln(26)) + P(`M${bx - 360} -80 Q${bx - 140} 0 ${bx + 100} 40`, tn.ln(16, '#8A5A33')) + P(dC(bx - 120, 30, 70) + dC(bx, 60, 80) + dC(bx + 120, 40, 64) + dC(bx + 40, -20, 70), tn.ol('#3FA650', 6)) + P(dC(bx - 40, 20, 24) + dC(bx + 90, 30, 16), { fill: tn.c('#7CD978') }), (tn) => R(bx - 160, -60, 320, 160, 0, tn.fl('#5E7A52')));
  }
  // ---- light
  let light = '';
  if (sunset) light += V(cam, R(v0.x0 - 300, v0.y0 - 300, v0.x1 - v0.x0 + 600, v0.y1 - v0.y0 + 600, 0, { fill: '#FF6A9A', opacity: 0.07 }), 0);
  if (morn) light += V(cam, R(v0.x0 - 300, v0.y0 - 300, v0.x1 - v0.x0 + 600, v0.y1 - v0.y0 + 600, 0, { fill: '#FFB070', opacity: 0.05 }), 0);
  if (red > 0) light += V(cam, R(v0.x0 - 300, v0.y0 - 300, v0.x1 - v0.x0 + 600, v0.y1 - v0.y0 + 600, 0, { fill: '#FF1A2E', opacity: f(red * (0.08 + 0.05 * Math.sin(t * 5.2))) }), 0);
  return layersOf(V(cam, sky, 0) + V(cam, sunS, 0.03) + V(cam, cl, 0.06) + V(cam, hills, 0.2) + V(cam, back, 0.55) + V(cam, fly, 0.7), V(cam, m, 1), V(cam, fg, 1.25), light);
}
const street = (t = 0, cam = {}, o = {}) => String(streetLayers(t, cam, o));
street.layers = streetLayers;

// ================================================================= 7. TOWN — wide shots of Willowbrook (camera-taking, parallax)
// Seen from a little above: rows step up the frame with depth. Sky (k 0, the TOP-CENTRE is kept empty for the giant system
// window: SPOTS.town.skyWindow, screen coords at the default camera), hills + the WATER TOWER (k .12, left), the back row with
// WILLOWBROOK MIDDLE SCHOOL (k .25: long single-storey cream building, teal fascia, lime panels, teal entrance block + clock,
// sky-blue barrel-roof gym, tall silver flagpole), the roofs row + the PARK with a pond (k .42), MAIN STREET shops with
// awnings and flat roofs (k .68), the street (k 1: sidewalk stand line y 985, lamps, planter trees, the parked school bus).
// GHOST ANCHORS (each {x, y, k, s}: draw a grey ghost hero there with K.view(cam, svg, a.k) between L.mid and L.fg, s = his
// scale at that depth): SPOTS.town.roofs[] (ridges / parapets of rows .42 and .68 + the school roof), lamps[] (lamp heads),
// trees[] (tree tops: planters k 1 + park k .42), busRoof, street[] = stand lines per depth.
// opts: { time 'day'|'sunset'|'golden'|'night' (default day), red 0..1 (corrupted Friday: alarm-red void sky with pixels +
//   scanlines + siren pulse; the world tinted red), crack 0..1 (only darkens the sky a little: the FX kit draws the crack
//   in SPOTS.town.crack), frozen 0..1 + freezeAt (clouds, birds, flags, fountain stop), lowGfx 0..1 (LOD pops to grey boxes),
//   gray 0..1 (drained of colour), colorBack 0..1 (colour floods back: a circle grows from colorFrom — {x, y} screen point or
//   an anchor {x, y, k} — revealing the town at colorTime (default 'golden') with red/gray/lowGfx/frozen off; a white-gold
//   ring rides the edge), colorFrom, colorTime, bus (x on the road, default 1560; false = none), birds (default true) }
const TW = { hills: 440, school: 540, roofs: 700, shops: 900, stand: 990, road: 1004, park: { x0: 1300, x1: 2000 }, school0: 1270 };
const TOWN_PAL = [['#FFC9A0', '#2E7D8A'], ['#BFE8D2', '#C8553D'], ['#FFF0C0', '#7A4FB8'], ['#FFD0DC', '#2F7290'], ['#D6E4FF', '#E8803A'], ['#F2E0C8', '#3FA650']];
const SHOP_DEF = [
  { name: 'BAKERY', wall: '#FFD6A8', aw: '#E8503A' }, { name: 'LEVEL UP', wall: '#C9B0F2', aw: '#3DA8D8' }, { name: 'SCOOPS', wall: '#BFE8D2', aw: '#FF6FB5' },
  { name: 'HARDWARE', wall: '#FFE8A0', aw: '#2FA37A' }, { name: 'BOOKS', wall: '#FFD0DC', aw: '#7A4FB8' }, { name: 'PIZZA', wall: '#F2E0C8', aw: '#E8803A' },
  { name: 'FLOWERS', wall: '#D6F2FF', aw: '#5CB85A' }, { name: 'DINER', wall: '#FFE0C4', aw: '#2E7D8A' },
];
const shopX = (i) => i * 330 - 200;            // shops row k .68: 300 wide, gap 30
const shopH = (i) => 195 + 55 * hash(i * 2.9);
const roofX = (i) => i * 300 - 700;            // roofs row k .42 (skips the park)
const inPark = (x) => x > TW.park.x0 - 120 && x < TW.park.x1 + 120;
const roofH = (i) => ({ w: 180 + 40 * hash(i * 3.3), h: 88 + 26 * hash(i * 5.1), r: 58 + 32 * hash(i * 1.7) });
const LAMP_X = (i) => i * 900 + 250, TREE_X = (i) => i * 900 + 700;
function townHouse(x, base, i, tn, lk, hz) {
  const [wall, roof] = TOWN_PAL[md(i, TOWN_PAL.length)], { w, h, r } = roofH(i);
  if (lk) return R(x - w / 2, base - h, w, h, 0, tn.fl(hz(wall))) + P(`M${f(x - w / 2 - 14)} ${f(base - h)} L${f(x)} ${f(base - h - r)} L${f(x + w / 2 + 14)} ${f(base - h)} Z`, tn.fl(hz(roof))) + P(`M${f(x + w / 2)} ${f(base - h)} l22 -14 V${base - 14} L${f(x + w / 2)} ${base} Z`, { fill: '#000', opacity: 0.15 });
  let s = R(x - w / 2, base - h, w, h, 3, tn.ol(hz(wall), 5)) + P(`M${f(x - w / 2 - 18)} ${f(base - h + 8)} L${f(x)} ${f(base - h - r)} L${f(x + w / 2 + 18)} ${f(base - h + 8)} Z`, tn.ol(hz(roof), 5));
  if (tn.detail > 0) s += P(`M${f(x - w / 2 - 18)} ${f(base - h + 8)} L${f(x)} ${f(base - h - r)} L${f(x + w / 2 + 18)} ${f(base - h + 8)} Z`, { fill: 'url(#shShingle)', opacity: f(tn.detail * 0.8) });
  if (hash(i * 6.1) > 0.5) s += R(x + w * 0.18, base - h - r * 0.75, 26, r * 0.6, 2, tn.ol(hz('#C8553D'), 4));
  return s;
}
function shopFront(i, base, tn, lk, t, night) {
  const D = SHOP_DEF[md(i, SHOP_DEF.length)], x = shopX(i), w = 300, h = shopH(i);
  if (lk) return R(x - w / 2, base - h, w, h, 0, tn.fl(D.wall)) + R(x - w / 2, base - 100, w, 100, 0, tn.fl('#6E7478')) + R(x - w / 2, base - 130, w, 24, 0, tn.fl(D.aw)) + P(`M${x + w / 2} ${base - h} l24 -14 V${base - 14} L${x + w / 2} ${base} Z`, { fill: '#000', opacity: 0.16 });
  let s = R(x - w / 2, base - h, w, h, 2, tn.ol(D.wall, 5)) + (tn.detail > 0 ? R(x - w / 2, base - h, w, h, 2, { fill: 'url(#shBrick)', opacity: f(0.5 * tn.detail) }) : '');
  s += R(x - w / 2 - 8, base - h - 16, w + 16, 20, 4, tn.ol(mix(D.wall, '#000000', 0.18), 4));
  s += R(x - 104, base - h + 12, 208, 36, 8, tn.ol('#FFF8EC', 4)) + TF(D.name, x, base - h + 39, 25, tn.c(D.aw));
  if (h > 225) s += R(x - 110, base - h + 58, 70, 36, 4, tn.ol(night ? '!#FFD86B' : '#BFE6FF', 3.5)) + R(x + 40, base - h + 58, 70, 36, 4, tn.ol(night ? '!#FFE9A0' : '#BFE6FF', 3.5));
  s += R(x - 134, base - 94, 178, 82, 4, tn.ol(night ? '!#FFE9A0' : '#CFEFFF', 4)) + R(x + 58, base - 104, 70, 104, 4, tn.ol(D.aw, 4));
  let aw = `M${x - w / 2 - 6} ${base - 134} H${x + w / 2 + 6} V${base - 110}`;
  for (let xx = x + w / 2 + 6; xx > x - w / 2 - 6; xx -= 39) aw += ` Q${f(xx - 19.5)} ${base - 92} ${f(xx - 39)} ${base - 110}`;
  let st = '';
  for (let k = 0; k < 7; k++) st += `M${x - w / 2 + 14 + k * 40} ${base - 134} V${base - 112} `;
  s += P(aw + ' Z', tn.ol(D.aw, 4)) + (tn.detail > 0 ? P(st, tn.ln(14, '#FFFFFF', 0.55 * tn.detail)) : '');
  if (hash(i * 4.3) > 0.45) s += R(x - 120, base - h - 52, 80, 38, 6, tn.ol('#B9C3CF', 4)) + P(`M${x - 110} ${base - h - 33} h60`, tn.ln(3, '#7A8094'));
  return s;
}
function willowbrook(x, base, tn, lk, t, night, flag = 1) {
  // WILLOWBROOK MIDDLE SCHOOL (matches scenes/sets_school.js), seen far away. origin = left end of the main wing at the base.
  if (lk) return R(x, base - 80, 480, 80, 0, tn.fl('#C8C0B0')) + R(x + 170, base - 120, 90, 120, 0, tn.fl('#6E8A8C')) + R(x + 480, base - 100, 150, 100, 0, tn.fl('#8EA0B0')) + R(x + 110, base - 290, 6, 290, 0, tn.fl('#8E8E8E'));
  let s = R(x - 6, base - 6, 650, 10, 2, tn.fl('#B9C3CF'));
  s += R(x, base - 82, 480, 82, 2, tn.ol('#FFEFD0', 4)) + R(x, base - 92, 480, 14, 2, tn.ol('#34B0B8', 3)) + R(x - 4, base - 98, 488, 8, 2, tn.fl('#1E7D86'));
  let wd = '', pd = '';
  for (let k = 0; k < 9; k++) { const wx = x + 14 + k * 52; if (wx > x + 160 && wx < x + 270) continue; if (k % 4 === 1) pd += dR(wx, base - 70, 40, 52); else wd += dRR(wx, base - 68, 40, 44, 4); }
  s += P(pd, tn.fl('#9AD94E')) + P(wd, { fill: tn.c(night ? '!#FFD86B' : '#9FD8FF'), stroke: tn.c('#FFFFFF'), 'stroke-width': 4 });
  // gym annex with the barrel roof
  s += R(x + 480, base - 92, 160, 92, 2, tn.ol('#FFEFD0', 4)) + P(`M${x + 474} ${base - 88} Q${x + 560} ${base - 150} ${x + 646} ${base - 88} Z`, tn.ol('#7CC7F2', 4));
  // entrance block + sign + clock + canopy + doors
  s += R(x + 176, base - 132, 92, 132, 3, tn.ol('#2FA7B0', 4)) + R(x + 186, base - 116, 72, 18, 3, tn.ol('#FFEFD0', 2.5)) + TF('WILLOWBROOK', x + 222, base - 103, 9.5, tn.c('#1E7D86'));
  s += CI(x + 222, base - 148, 16, tn.ol('#FFFFFF', 3)) + P(`M${x + 222} ${base - 148} v-9 M${x + 222} ${base - 148} h7`, tn.ln(2.5));
  s += R(x + 180, base - 44, 84, 8, 2, tn.ol('#FFFFFF', 2.5)) + R(x + 198, base - 36, 48, 36, 2, tn.ol('#7CCB3A', 3));
  // the tall silver flagpole (left of the entrance) + lime/teal flag
  const fx = x + 120, fy = base - 300, wv = Math.sin(t * 5) * 4;
  s += P(`M${fx} ${base} V${fy}`, tn.ln(6)) + P(`M${fx} ${base} V${fy}`, tn.ln(3, '#D9DEE8')) + CI(fx, fy - 4, 6, tn.ol('#FFD23F', 2));
  s += G(P(`M${fx} ${fy + 8} Q${fx + 24} ${fy + 4 + wv} ${fx + 50} ${fy + 10} L${fx + 50} ${fy + 40} Q${fx + 24} ${fy + 34 - wv} ${fx} ${fy + 38} Z`, tn.ol('#9AD94E', 3)) + P(`M${fx} ${fy + 23} Q${fx + 24} ${fy + 19 + wv} ${fx + 50} ${fy + 25}`, tn.ln(6, '#34B0B8')), null, flag < 1 ? { transform: `translate(0 ${f((1 - flag) * 200)})` } : undefined);
  return s;
}
function lampPost(x, base, tn, lk, on) {
  if (lk) return R(x - 8, base - 330, 16, 330, 0, tn.fl('#5A5A5A')) + R(x - 26, base - 380, 52, 50, 0, tn.fl(on ? '#E8E2C8' : '#8A8A8A'));
  let s = R(x - 9, base - 340, 18, 340, 4, tn.ol('#2E3550', 5)) + R(x - 24, base - 22, 48, 22, 4, tn.ol('#2E3550', 4));
  s += P(`M${x - 22} ${base - 340} L${x + 22} ${base - 340} L${x + 30} ${base - 392} L${x - 30} ${base - 392} Z`, tn.ol(on ? '!#FFF4B8' : '#DDE6F2', 4)) + P(`M${x - 34} ${base - 392} L${x + 34} ${base - 392} L${x} ${base - 420} Z`, tn.ol('#2E3550', 4)) + CI(x, base - 426, 7, tn.ol('#2E3550', 3));
  s += P(`M${x} ${base - 290} q-46 6 -50 40`, tn.ln(5)) + R(x - 74, base - 252, 50, 34, 4, tn.ol('#3DA8D8', 3));
  return s;
}
function townCore(t, cam = {}, o = {}) {
  const visB = (k) => visBox(cam, k, o._box);
  const time = o.time || 'day', night = time === 'night', sunset = time === 'sunset', golden = time === 'golden';
  const lowG = b01(o.lowGfx), red = b01(o.red), frz = b01(o.frozen), gray = b01(o.gray), crack = b01(o.crack);
  const tm = frz >= 1 ? (o.freezeAt ?? 0) : frz > 0 ? Math.floor(t * lerp(24, 3, frz)) / lerp(24, 3, frz) : t;
  const t0 = { night: night ? 0.85 : 0, eve: sunset ? 0.6 : 0, morn: golden ? 0.9 : 0, red, gray };
  const tnB = tone({ ...t0, low: lowG }), tnH = tone({ ...t0, low: lowG * 0.45 }), tnL = tone({ ...t0, low: 1 });
  const thOf = (x, salt = 0) => 0.06 + 0.82 * hash(x * 0.0137 + salt);
  const pick = (th) => (lowAt(lowG, th) ? tnL : tnH);
  const obj = (th, fn, cx, cy) => { const lk = lowAt(lowG, th); const s = fn(lk ? tnL : tnH, lk); return lk ? lowPop(s, lowG, th, cx, cy) : s; };
  const hazeCol = night ? '#2A3A7A' : sunset ? '#E8A0B8' : golden ? '#FFD9A0' : '#CFE8FF';
  const hzK = (k) => (c) => mix(c, hazeCol, k);
  // ---- sky (k 0)
  const v0 = visB(0);
  const SB = [v0.x0 - 200, v0.y0 - 200, v0.x1 + 200, v0.y1 + 200];
  const skyId = night ? 'shSkyNight' : sunset ? 'shSkySunset' : golden ? 'shSkyGolden' : 'shSkyDay';
  let sky = R(SB[0], SB[1], SB[2] - SB[0], SB[3] - SB[1], 0, { fill: `url(#${skyId})` });
  if (night) sky += R(SB[0], SB[1], SB[2] - SB[0], 700, 0, { fill: 'url(#shStars)' });
  if (lowG > 0) sky += R(SB[0], SB[1], SB[2] - SB[0], SB[3] - SB[1], 0, { fill: 'url(#shSkyLow)', opacity: f(sm(0, 0.6, lowG)) });
  if (gray > 0) sky += R(SB[0], SB[1], SB[2] - SB[0], SB[3] - SB[1], 0, { fill: '#B8BCC4', opacity: f(0.7 * gray) });
  if (red > 0) sky += redSky(SB[0], SB[1], SB[2], SB[3], red, t, { tm, hole: [520, 30, 1400, 440] });
  if (crack > 0) sky += R(SB[0], SB[1], SB[2] - SB[0], SB[3] - SB[1], 0, { fill: '#000', opacity: f(0.12 * crack) });
  // sun / moon (k .03)
  let sun = '';
  if (red < 0.9 && !lowAt(lowG, 0.3)) {
    if (night) sun = glow(1660, 170, 160, 'shGlowWhite', 0.3) + P('M1660 120 A50 50 0 1 0 1660 220 A36 50 0 1 1 1660 120 Z', tnH.ol('#FFF3C4', 5));
    else { const sp = sunset ? [1500, 360] : golden ? [1580, 300] : [1640, 130]; sun = glow(sp[0], sp[1], 220, 'shGlowWarm', 0.9) + CI(sp[0], sp[1], 64, { fill: sunset ? '#FFE09A' : '#FFE45C', stroke: '#FFB42E', 'stroke-width': 7 }); }
    if (red > 0) sun = G(sun, null, { opacity: f(1 - red) });
  } else if (lowAt(lowG, 0.3)) sun = R(1600, 90, 90, 90, 0, { fill: '#F2F2EA' });
  // clouds (k .06), skipping the window area a bit
  const vc = visB(0.06);
  let cl = '';
  if (red < 1) {
    for (let i = Math.floor((vc.x0 - 400) / 640); i * 640 < vc.x1 + 400; i++) {
      const x = i * 640 + md(hash(i * 2.7) * 380 + tm * (5 + 5 * hash(i)), 640), y = 70 + 230 * hash(i * 9.3), s = 0.45 + 0.4 * hash(i * 5.5);
      cl += obj(thOf(i * 640, 3), (tn, lk) => (lk ? cloudLow(x, y, s, tn) : cloud(x, y, s, tn, night ? '#5A5A9A' : sunset ? '#FFE3EC' : golden ? '#FFF0D8' : '#FFFFFF', night ? '#3A3A78' : sunset ? '#F4AFC8' : golden ? '#F2C8A0' : '#D6E9FF')));
    }
    if (red > 0) cl = G(cl, null, { opacity: f(1 - red) });
  }
  // birds flock (k .3)
  let fl = '';
  if (o.birds !== false && !night) {
    for (let i = 0; i < 6; i++) {
      const u = md(tm * 0.02 + i * 0.05, 1), x = -300 + u * 2600 + (cam.x || 0) * 0.3 + i * 60, y = 330 + (i % 3) * 22 + Math.sin(tm + i) * 8;
      fl += bird(x, y, 0.55, lowAt(lowG, 0.5) ? tnL : tnH, { flying: true, flap: frz >= 1 ? 0.2 + 0.13 * i : md(tm * 4 + i * 0.3, 1), flip: true, lowK: lowAt(lowG, 0.5) });
    }
  }
  // ---- hills + water tower (k .12)
  const vh = visB(0.12);
  let hills = '';
  {
    const pts = [];
    for (let x = Math.floor((vh.x0 - 400) / 180) * 180; x < vh.x1 + 400; x += 180) pts.push([x, TW.hills - 50 * Math.sin(x * 0.0019 + 1) - 30 * hash(Math.round(x / 180) * 1.3)]);
    const hc = tnB.c(hzK(0.25)(night ? '#2F5A6A' : '#7FC29A'));
    if (lowG > 0.5) hills += P(dP([[pts[0][0], 1500], ...pts, [pts[pts.length - 1][0], 1500]]), { fill: tnB.c('#8E9C88') });
    else {
      let d = `M${pts[0][0]} 1500 L${pts[0][0]} ${f(pts[0][1])}`;
      for (let j = 1; j < pts.length; j++) d += ` Q${f((pts[j - 1][0] + pts[j][0]) / 2)} ${f(Math.min(pts[j - 1][1], pts[j][1]) - 26)} ${f(pts[j][0])} ${f(pts[j][1])}`;
      hills += P(d + ` L${pts[pts.length - 1][0]} 1500 Z`, { fill: hc });
      let pn = '';
      for (let x = Math.floor(vh.x0 / 120) * 120; x < vh.x1; x += 120) if (hash(x * 0.013) > 0.4) { const y = TW.hills - 50 * Math.sin(x * 0.0019 + 1) + 10, h = 40 + 30 * hash(x); pn += `M${x - h * 0.32} ${f(y)} L${x} ${f(y - h)} L${x + h * 0.32} ${f(y)} Z `; }
      hills += P(pn, { fill: tnB.c(hzK(0.2)(night ? '#1E4050' : '#4E9A70')) });
    }
    hills += obj(0.36, (tn, lk) => (lk ? R(250, 230, 120, 90, 0, tn.fl('#B0B4B8')) + R(268, 320, 10, 100, 0, tn.fl('#8E8E8E')) + R(342, 320, 10, 100, 0, tn.fl('#8E8E8E'))
      : P('M262 410 L280 300 M358 410 L340 300 M270 360 L350 360 M280 300 L350 410 M340 300 L270 410', tn.ln(7, '#8A93A6')) + R(232, 236, 156, 76, 30, tn.ol('#E8F2FF', 5)) + P('M240 236 L310 196 L380 236 Z', tn.ol('#8A93A6', 5)) + TF('WILLOWBROOK', 310, 282, 17, tn.c('#3DA8D8')) + R(236, 300, 148, 8, 3, tn.fl('#8A93A6'))), 310, 410);
  }
  // ---- back row: tiny houses + the school (k .25)
  const vs = visB(0.25);
  let row1 = R(vs.x0 - 300, TW.school - 10, vs.x1 - vs.x0 + 600, 1200, 0, { fill: tnB.c(hzK(0.3)(night ? '#2A5A4A' : '#86CC74')) });
  const SCH = { x0: TW.school0, x1: TW.school0 + 650 };
  for (let i = Math.floor((vs.x0 - 200) / 150); i * 150 < vs.x1 + 200; i++) {
    const x = i * 150 + 40 * hash(i * 7.1);
    if (x > SCH.x0 - 80 && x < SCH.x1 + 60) continue;
    const pal = TOWN_PAL[md(i * 5, TOWN_PAL.length)], hz = hzK(0.32), w = 96, h = 46 + 14 * hash(i), r = 34;
    const lk = lowAt(lowG, thOf(x, 7)), tn = lk ? tnL : tnH;
    row1 += R(x - w / 2, TW.school - h, w, h, 2, lk ? tn.fl(hz(pal[0])) : tn.ol(hz(pal[0]), 3)) + P(`M${f(x - w / 2 - 8)} ${f(TW.school - h + 4)} L${f(x)} ${f(TW.school - h - r)} L${f(x + w / 2 + 8)} ${f(TW.school - h + 4)} Z`, lk ? tn.fl(hz(pal[1])) : tn.ol(hz(pal[1]), 3));
  }
  row1 += obj(0.58, (tn, lk) => willowbrook(SCH.x0, TW.school, tn, lk, tm, night), SCH.x0 + 300, TW.school);
  // ---- roofs row + park (k .42)
  const vr = visB(0.42);
  let row2 = R(vr.x0 - 300, TW.roofs - 30, vr.x1 - vr.x0 + 600, 1200, 0, { fill: tnB.c(hzK(0.18)(night ? '#2F6A4A' : '#74C866')) });
  // park: lawn path, pond, trees, bench, fountain
  {
    const P0 = TW.park, py = TW.roofs - 20;
    row2 += obj(0.44, (tn, lk) => (lk ? R(P0.x0 + 200, py - 30, 260, 40, 0, tn.fl('#6E8494')) : E((P0.x0 + P0.x1) / 2 - 60, py - 10, 150, 24, tn.ol('#6FC6F2', 5)) + E((P0.x0 + P0.x1) / 2 - 100, py - 16, 60, 8, { fill: tn.c('#BFE8FF') })));
    row2 += obj(0.52, (tn, lk) => (lk ? R(P0.x0 + 80, py - 40, 120, 40, 0, tn.fl('#7A7068')) : G(R(-60, -34, 120, 12, 4, tn.ol('#C98A52', 4)) + R(-60, -58, 120, 12, 4, tn.ol('#C98A52', 4)) + P('M-50 -22 V0 M50 -22 V0', tn.ln(6, '#5A6070')), `translate(${P0.x0 + 140} ${py})`)));
    const fx = P0.x1 - 140;
    row2 += obj(0.66, (tn, lk) => (lk ? R(fx - 50, py - 70, 100, 70, 0, tn.fl('#9A9A9A')) : E(fx, py - 4, 70, 14, tn.ol('#C9CED8', 4)) + R(fx - 10, py - 60, 20, 56, 4, tn.ol('#C9CED8', 4)) + P(`M${fx} ${py - 60} q-30 ${f(-20 - 6 * Math.sin(tm * 6))} -46 30 M${fx} ${py - 60} q30 ${f(-20 - 6 * Math.cos(tm * 6))} 46 30`, tn.ln(6, '#9FDCFF'))));
  }
  for (let i = Math.floor((vr.x0 + 300) / 300) - 1; roofX(i) < vr.x1 + 300; i++) {
    const x = roofX(i);
    if (inPark(x)) continue;
    row2 += obj(thOf(x, 8), (tn, lk) => townHouse(x, TW.roofs, i, tn, lk, hzK(0.12)), x, TW.roofs);
  }
  const PARK_TREES = [[TW.park.x0 + 20, 0.5], [TW.park.x1 - 10, 0.52], [TW.park.x0 + 520, 0.42], [-560, 0.55], [2250, 0.55]];
  for (const [x, s] of PARK_TREES) if (x > vr.x0 - 300 && x < vr.x1 + 300) row2 += obj(thOf(x, 14), (tn, lk) => tree(x, TW.roofs, s, tn, { lowK: lk, col: hzK(0.1)('#4DB85E'), hi: '#8BDB7C', sway: frz >= 1 ? 0 : Math.sin(tm * 0.8 + x) * 1.2 }), x, TW.roofs);
  // ---- shops row (k .68)
  const vp = visB(0.68);
  let row3 = R(vp.x0 - 300, TW.shops - 40, vp.x1 - vp.x0 + 600, 1200, 0, { fill: tnB.c('#D9D2C8') });
  for (let i = Math.floor((vp.x0 + 50) / 330) - 1; shopX(i) < vp.x1 + 330; i++) {
    const x = shopX(i);
    row3 += obj(thOf(x, 9), (tn, lk) => shopFront(i, TW.shops, tn, lk, tm, night), x, TW.shops);
  }
  row3 += R(vp.x0 - 300, TW.shops, vp.x1 - vp.x0 + 600, 24, 0, { fill: tnB.c('#C9C1B2') }) + P(`M${vp.x0 - 300} ${TW.shops} H${vp.x1 + 300}`, tnB.ln(4, LINE, 0.6));
  // ---- street (k 1)
  const v1 = visB(1);
  const X0 = v1.x0 - 300, X1 = v1.x1 + 300;
  let st = R(X0, TW.shops + 16, X1 - X0, TW.road - TW.shops - 16, 0, { fill: tnB.c('#E9E2D6') }) + R(X0, TW.road - 6, X1 - X0, 16, 0, { fill: tnB.c('#BDB6AA') }) + R(X0, TW.road + 10, X1 - X0, 900, 0, { fill: tnB.c(night ? '#3A3858' : sunset ? '#6A6484' : '#7C8096') });
  if (tnB.detail > 0) st += R(X0, TW.road + 10, X1 - X0, 900, 0, { fill: 'url(#shRoad)', opacity: f(tnB.detail) });
  let jn = '';
  for (let x = Math.floor(X0 / 150) * 150; x < X1; x += 150) jn += `M${x} ${TW.shops + 16} L${x - 16} ${TW.road - 6} `;
  st += P(jn, tnB.ln(3, '#C9C1B2', tnB.detail)) + P(`M${X0} ${TW.road - 6} H${X1} M${X0} ${TW.road + 10} H${X1}`, tnB.ln(4, LINE, 0.55)) + P(`M${X0} ${TW.road + 100} H${X1}`, { stroke: tnB.c('#FFE6A0'), 'stroke-width': 8, 'stroke-dasharray': '60 50', fill: 'none' });
  for (let i = Math.floor((X0 - 700) / 900); TREE_X(i) < X1; i++) {
    const x = TREE_X(i);
    st += obj(thOf(x, 10), (tn, lk) => (lk ? R(x - 40, 890, 80, 40, 0, tn.fl('#8A7A6A')) : R(x - 44, 884, 88, 42, 7, tn.ol('#C98A52', 5))) + tree(x, 900, 0.7, tn, { lowK: lk, sway: frz >= 1 ? 0 : Math.sin(tm * 0.9 + i) * 1.5 }), x, 925);
  }
  for (let i = Math.floor((X0 - 250) / 900); LAMP_X(i) < X1; i++) { const x = LAMP_X(i); st += obj(thOf(x, 11), (tn, lk) => G(lampPost(x, 925, tn, lk, night), `translate(${x} 925) scale(0.8) translate(${-x} -925)`), x, 925); }
  st += obj(0.74, (tn, lk) => (lk ? R(1050, 885, 180, 36, 0, tn.fl('#7A7068')) : G(R(-90, -34, 180, 14, 6, tn.ol('#2E7D8A', 4)) + R(-90, -58, 180, 14, 6, tn.ol('#2E7D8A', 4)) + P('M-74 -20 V0 M74 -20 V0', tn.ln(7, '#2E3550')), 'translate(1140 925)')));
  const bus = o.bus === undefined ? { x: 1560 } : o.bus === false || o.bus === null ? null : typeof o.bus === 'object' ? o.bus : { x: +o.bus };
  if (bus) st += schoolBus(bus.x ?? 1560, TW.road + 66, bus.s ?? 0.6, pick(0.8), { lowK: bus.lowK ?? lowAt(lowG, 0.8), flip: bus.flip ?? true, sign: bus.sign, ghost: bus.ghost });
  // ---- light
  let light = '';
  const wash = (col, op) => (op > 0.003 ? V(cam, R(v0.x0 - 300, v0.y0 - 300, v0.x1 - v0.x0 + 600, v0.y1 - v0.y0 + 600, 0, { fill: col, opacity: f(op) }), 0) : '');
  if (golden) light += wash('#FFB040', 0.08);
  if (sunset) light += wash('#FF6A9A', 0.07);
  if (night) { let lg = ''; for (let i = Math.floor((X0 - 250) / 900); LAMP_X(i) < X1; i++) lg += glow(LAMP_X(i), 925 - 293, 130, 'shGlowWarm', 0.85); light += V(cam, lg, 1); }
  if (red > 0) light += wash('#FF1A2E', red * (0.08 + 0.05 * Math.sin(t * 5.2)));
  return layersOf(V(cam, sky, 0) + V(cam, sun, 0.03) + V(cam, cl, 0.06) + V(cam, hills, 0.12) + V(cam, row1, 0.25) + V(cam, fl, 0.3), V(cam, row2, 0.42) + V(cam, row3, 0.68) + V(cam, st, 1), '', light);
}
function townLayers(t, cam = {}, o = {}) {
  const cb = b01(o.colorBack);
  if (cb <= 0) return townCore(t, cam, o);
  const colOpts = { ...o, time: o.colorTime || 'golden', red: 0, gray: 0, lowGfx: 0, frozen: 0, crack: 0, colorBack: 0 };
  if (cb >= 1) return townCore(t, cam, colOpts);
  const c = o.colorFrom ? (o.colorFrom.k !== undefined ? toScreen(cam, o.colorFrom) : o.colorFrom) : { x: 960, y: 860 };
  const far = Math.max(Math.hypot(c.x, c.y), Math.hypot(1920 - c.x, c.y), Math.hypot(c.x, 1080 - c.y), Math.hypot(1920 - c.x, 1080 - c.y)) + 60;
  const r = ease.inOut(cb) * far;
  const A = townCore(t, cam, o), B = townCore(t, cam, { ...colOpts, _box: [c.x - r - 40, c.y - r - 40, c.x + r + 40, c.y + r + 40] });
  const id = S.uid('shCB'), idO = S.uid('shCBo');
  const defs = `<defs><clipPath id="${id}"><circle cx="${f(c.x)}" cy="${f(c.y)}" r="${f(r)}"/></clipPath><clipPath id="${idO}"><path clip-rule="evenodd" d="M-2000 -2000 H4000 V4000 H-2000 Z ${dC(c.x, c.y, r)}"/></clipPath></defs>`;
  const inC = (s) => (s ? G(s, null, { 'clip-path': `url(#${id})` }) : '');
  const outC = (s) => (s ? G(s, null, { 'clip-path': `url(#${idO})` }) : '');
  let ring = CI(c.x, c.y, r, { fill: 'none', stroke: '#FFF1B8', 'stroke-width': 26, opacity: 0.35 }) + CI(c.x, c.y, r, { fill: 'none', stroke: '#FFFFFF', 'stroke-width': 8, opacity: 0.85 });
  let bits = '';
  const BC = ['#FF5A5A', '#FFD21F', '#3BD16F', '#34C3FF', '#B06BFF', '#FF6FB5'];
  for (let i = 0; i < 18; i++) { const a = hash(i * 3.3) * Math.PI * 2, rr = r + (hash(i * 7.1) - 0.5) * 60; bits += R(c.x + Math.cos(a) * rr - 9, c.y + Math.sin(a) * rr - 9, 18, 18, 3, { fill: BC[i % 6], stroke: LINE, 'stroke-width': 3, opacity: 0.9 }); }
  return layersOf(A.bg, A.mid + defs + inC(B.bg + B.mid), A.fg + inC(B.fg), outC(A.light) + inC(B.light) + ring + bits);
}
const town = (t = 0, cam = {}, o = {}) => String(townLayers(t, cam, o));
town.layers = townLayers;

// ================================================================= floor lines + anchors
const FLOOR = {
  heroRoom: 990,
  deskClose: 1080,      // (no floor: hands area SPOTS.deskClose.hands)
  deskFace: 830,        // the chair seat (hips), hero s .9
  stairs: 937,          // the downstairs hallway (landing y 430); hero s .34
  kitchen: 990,
  workshop: 990,
  street: 935,          // the sidewalk (hero s .34); on the hill use SPOTS.street.standY(x)
  town: 990,            // the main-street sidewalk (k 1, hero s .26); other depths: SPOTS.town.street[]
  obbyWorld: 748,
};
const SPOTS = {
  heroRoom: {
    wallBase: HR.base, ceiling: HR.ceil, slopeY, window: HR.win,
    checkpoint: { x: HR.checkpoint.x, y: HR.checkpoint.y, s: 0.5 },
    bowl: { x: HR.bowl.x, y: HR.bowl.y },
    clock: { x: HR.clock.x, y: HR.clock.y, r: HR.clock.r },
    desk: { x0: HR.desk.x0, x1: HR.desk.x1, top: HR.desk.top },
    monitor: { x: HR.mon.cx, y: HR.desk.top, screen: { cx: HR.mon.cx, cy: HR.mon.cy, w: HR.mon.w, h: HR.mon.h } },
    chair: { x: HR.chair.x, seat: HR.chair.seat, s: 0.42 },
    door: { x0: HR.door.x0, x1: HR.door.x1, top: HR.door.y0, knob: { x: HR.door.x0 + 22, y: 540 }, exit: { x: 1794, y: 778, s: 0.38 } },
    bed: { x0: HR.bed.x0, x1: HR.bed.x1, top: HR.bed.top, pillow: { x: 180, y: HR.bed.top - 30 }, lie: { x: 330, y: 905, s: 0.45, rot: -90 }, sit: { hip: HR.bed.top + 8, feet: 880, x0: 300, x1: 600 } },
  },
};
SPOTS.deskClose = {
  screen: { ...DC.scr }, deskTop: DC.top, clock: { x: DC.clock.x, y: DC.clock.y, r: DC.clock.r },
  bowl: { x: DC.bowl.x, y: DC.bowl.y, scale: 2.34 },        // the bowl ~2.34x its heroRoom size
  hands: { L: { x: 760, y: 905 }, R: { x: 1500, y: 925 }, keyboard: { x0: 600, x1: 1300, y0: 852, y1: 968 }, mouse: { x: 1500, y: 930 } },
};
SPOTS.deskFace = { hero: { x: 960, seat: DF.seat, s: 0.9 }, deskTop: DF.top, hands: { L: { x: 820, y: 960 }, R: { x: 1420, y: 960 } }, window: { x0: 90, y0: 150, x1: 520, y1: 560 } };
SPOTS.stairs = {
  s: 0.34, landing: { x0: XL, x1: ST.x0, y: ST.land, x: 470 }, floor: ST.floor, bottom: { x: 1630, y: ST.floor },
  steps: Array.from({ length: ST.n }, (_, i) => stepAt(i)), rise: ST.rise, run: ST.run, slope: ST.rise / ST.run,
  skate: { ...stepAt(1), s: 0.6, rot: 0, step: 1 },
  heroDoor: { x0: 230, x1: 410, top: ST.land - 420, x: 320 }, frontDoor: { x0: 1690, x1: 1880, top: ST.floor - 470 }, livingDoor: { x0: 146, x1: 374, top: 616 },
  rail: { x0: ST.x0 - 40, y0: ST.land - 150, x1: ST.x1 + 20, y1: ST.floor - ST.rise - 150 }, roundWindow: { x: 112, y: 150, r: 72 },
};
SPOTS.kitchen = {
  ceiling: KT.ceil, wallBase: KT.base, counterTop: KT.counter, window: KT.win,
  dad: { x: 650, y: 820, s: 0.5 },                                   // behind the island: draw him BEFORE layers.front
  pan: { x: KT.pan.x, y: KT.pan.y - 18 }, panHang: { x: KT.pan.x, y: 300 }, stack: { x: 930, y: KT.island.top - 8 },
  island: { x0: KT.island.x0, x1: KT.island.x1, top: KT.island.top },
  table: { x0: KT.table.x0, x1: KT.table.x1, top: KT.table.top },
  seats: [{ x: 1300, hip: 712, s: 0.3, who: 'bea (booster)' }, { x: 1490, hip: 830, s: 0.42, who: 'you' }, { x: 1680, hip: 840, s: 0.45, who: 'mom/dad' }].map((p) => ({ ...p, y: p.hip + 306 * p.s })),   // y = feet if the legs hang straight (hidden by the tablecloth)
  coat: { x: KT.hooks.x0 + 30, y: KT.hooks.y }, backDoor: { x0: KT.door.x0, x1: KT.door.x1, top: KT.door.y0, exit: { x: 1760, y: 800, s: 0.42 } },
  fridge: { x0: KT.fridge.x0, x1: KT.fridge.x1, top: KT.fridge.top }, clock: { x: 1240, y: 170, r: 62 }, lamp: { x: KT.lamp, y: 330 },
  birds: { y: 252, x0: KT.win.x0, x1: KT.win.x1 },
};
SPOTS.workshop = {
  table: { x0: WS.table.x0, x1: WS.table.x1, top: WS.table.top, x: (WS.table.x0 + WS.table.x1) / 2 },
  hat: { x: 1070, y: WS.table.top - 6 }, flasks: { x: 820, y: WS.table.top - 6 },
  scorch: { ...WS.scorch }, bench: { x0: WS.bench.x0, x1: WS.bench.x1, top: WS.bench.top }, peg: { ...WS.peg }, opening: { ...WS.open },
  rack: { x0: WS.rack.x0, x1: WS.rack.x1, shelves: [300, 480, 660] }, ivy: { x: 1300, y: 990, s: 0.5 }, behindTable: { x: 940, y: 900, s: 0.46 },
  outside: { y: 800, s: 0.3 },
};
SPOTS.street = {
  s: 0.34, stand: SR.stand, standY, k: 1, worldX: [-2600, 6400],
  hill: { x0: SR.hill.x0, x1: SR.hill.x1, top: SR.stand - SR.hill.h, start: { x: -1700, y: SR.stand - SR.hill.h } }, bump: { x: SR.bump, y: standY(SR.bump) },
  checkpoint: { x: 700, y: SR.stand, k: 1 },
  house: { x: SR.house, base: houseBase(SR.house), door: { x: SR.house, y: houseBase(SR.house) }, heroWindow: { x: SR.house, y: houseBase(SR.house) - 482 }, roofTop: { x: SR.house, y: houseBase(SR.house) - 610 } },
  yard: { y0: houseBase(SR.house) + 20, y1: fenceY(SR.house) - 20, s: 0.27 },                 // front-yard depth band (Dad frozen in the yard: y ~830, s .3)
  trampoline: { x: SR.tramp, y: 728, s: 0.22 },                                                // Bea on the mat (feet y 728)
  fence: { y: fenceY(SR.house), x0: -2000, x1: 3500, gate: { x0: SR.gate.x0, x1: SR.gate.x1 } },
  ivy: { x: SR.ivy, garage: { x0: SR.ivy + 30, x1: SR.ivy + 350, y: houseBase(SR.ivy) } },
  busStop: { x: SR.busStop, y: SR.stand }, corner: { x0: SR.corner.x0, x1: SR.corner.x1 }, busLane: { y: SR.stand + 150, s: 1 },
  poles: { x0: POLE_X0, every: POLE_EVERY, topY: (x) => fenceY(x) - 776 },
};
// town ghost anchors over a canonical stretch (x -700..2700 in each row's coords)
SPOTS.town = (() => {
  const roofs = [];
  for (let i = -1; i <= 10; i++) { const x = roofX(i); if (inPark(x)) continue; const { h, r } = roofH(i); roofs.push({ x, y: TW.roofs - h - r + 6, k: 0.42, s: 0.11, row: 'houses' }); }
  for (let i = -1; i <= 8; i++) roofs.push({ x: shopX(i) + 20 + 40 * hash(i), y: TW.shops - shopH(i) - 16, k: 0.68, s: 0.17, row: 'shops' });
  roofs.push({ x: TW.school0 + 380, y: TW.school - 98, k: 0.25, s: 0.065, row: 'school' }, { x: TW.school0 + 560, y: TW.school - 150, k: 0.25, s: 0.065, row: 'gym' });
  const lamps = [], trees = [];
  for (let i = -1; i <= 2; i++) lamps.push({ x: LAMP_X(i), y: 925 - 344, k: 1, s: 0.26 });
  for (let i = -1; i <= 2; i++) trees.push({ x: TREE_X(i), y: 900 - 300 * 0.7, k: 1, s: 0.26 });
  trees.push({ x: TW.park.x0 + 20, y: TW.roofs - 300 * 0.5, k: 0.42, s: 0.11 }, { x: TW.park.x1 - 10, y: TW.roofs - 300 * 0.52, k: 0.42, s: 0.11 }, { x: TW.park.x0 + 520, y: TW.roofs - 300 * 0.42, k: 0.42, s: 0.11 });
  return {
    roofs, lamps, trees,
    busRoof: { x: 1560, y: TW.road + 66 - 320 * 0.6, k: 1, s: 0.26, x0: 1560 - 230, x1: 1560 + 230 },
    street: [{ y: TW.stand, k: 1, s: 0.26 }, { y: TW.shops + 8, k: 0.68, s: 0.17 }, { y: TW.roofs - 10, k: 0.42, s: 0.11 }, { y: TW.school + 2, k: 0.25, s: 0.065 }],
    skyWindow: { x: 960, y: 230, w: 860, h: 360, k: 0 }, crack: { x: 960, y: 230, r: 440, k: 0 },
    school: { x: TW.school0 + 222, y: TW.school, k: 0.25, flagTop: { x: TW.school0 + 120, y: TW.school - 300 } }, waterTower: { x: 310, y: 270, k: 0.12 },
    park: { x0: TW.park.x0, x1: TW.park.x1, y: TW.roofs - 20, k: 0.42 }, bench: { x: 1140, y: 925, k: 1 },
  };
})();
SPOTS.obbyWorld = {
  platforms: OBBY_COURSE.map((p) => ({ x: p.x, x0: p.x - p.w / 2, x1: p.x + p.w / 2, y: p.y - 12, k: 1, kill: !!p.kill, cp: p.cp !== undefined, final: !!p.final })),
  checkpoints: OBBY_COURSE.filter((p) => p.cp !== undefined).map((p) => ({ x: p.x, y: p.y - 12, k: 1, i: p.cp })),
  start: { x: 200, y: 748, k: 1 }, final: { x: 5020, y: 388, k: 1, flag: { x: 5040, y: 388 - 300 } }, lavaY: 950, s: 0.4, worldX: [-300, 5600],
};
const DEFS = '<defs>' + DEF.join('') + '</defs>';

module.exports = {
  DEFS, FLOOR, SPOTS,
  heroRoom, deskClose, deskFace, stairs, kitchen, workshop, gameScreen, obbyWorld, street, town,
  // props + helpers
  miniAvatar, obbyPlat, skateboard, pancake, schoolBus, streetDog, famHouse, suburbHouse, trampoline, willowbrook, shopFront, lampPost, bird, wallClock, cloud, tree, pine, redSky, lowPop, glow, pool, darkRing,
  toScreen, camTf, vis, mix, tone, frameIn, makeSet,
};
