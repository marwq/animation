// REAL-LIFE HOUSE sets for "What If Your PARENTS Joined Your Roblox Server?".   Reference: docs/SETS_HOUSE.md
//
// The family's house (NOT the Respawn family's): butter-yellow kitchen with teal cabinets + a cherry-red fridge, the
// game-night living room (deep-teal couch, Granny's rose armchair, the TV on the side wall, YOUR PC dragged downstairs),
// YOUR bedroom (periwinkle cube wallpaper, one warm lamp), the hallway stairs, the house from the street (sky-blue siding,
// rust roof, red door, porch swing) and the close-up of Dad's ancient laptop keyboard.
//
// Every set is drawn in WORLD SPACE for the full 1920x1080 frame (camera at rest = the frame) and is padded far past the
// frame edges (x -900..2820, y -700..1800), so zoom-outs to ~0.55 and pans never show a gap. `t` = absolute seconds, only
// used for idle motion (steam, curtains, birds, TV flicker, alarm pulse). Static gradients/patterns live in DEFS (ids `hs*`;
// scenes/main.js loads them automatically).
//
// ROOM sets (fixed world, you apply the camera):  set(t, o) -> svg of all layers;  set.layers(t, o) -> { bg, mid, front, fg, light }
//   bg    — what is seen through windows / doors (sky, yard)             draw with view(cam, bg, 0.6..0.85)
//   mid   — the room itself: walls, floor, furniture backs, props        draw with view(cam, mid, 1)
//   front — furniture FRONTS (table + cloth, couch / armchair fronts, the duvet, the desk edge, newel posts). Draw it AFTER
//           the characters sitting behind / inside that furniture and BEFORE the characters standing on the FLOOR line.
//   table — livingRoom only: the coffee table (after the devices on laps / anyone between couch and table, before FLOOR)
//   fg    — occluders close to the camera (may be '')                    draw with view(cam, fg, 1.15..1.3)
//   light — night darkness, lamp / screen glows, sunbeams, alarm wash    draw LAST with view(cam, light, 1)
// CAMERA set (houseExterior): set(t, cam, o) -> svg; set.layers(t, cam, o) -> { bg, mid, fg, light } ALREADY transformed by
//   cam ({ zoom, x, y, fx, fy, sx, sy } as from K.camKeys / K.shake); anchors carry k (K.view(cam, svg, a.k)).
// FLOOR[set] = the stand line (characters' feet y) in the default framing; SPOTS[set] = anchors (seats, devices, faces...).
// Screens take an svg centred on (0,0) of the screen box, or fn(w, h) => svg.
//
// Index:
//   kitchen(t, o)        Saturday breakfast table for 4. o: time 'morning'|'day', meeting, next, chart, paper, steam, birds
//   livingRoom(t, o)     GAME NIGHT: couch + armchair + PC desk + side-wall TV + coffee table. o: time 'evening'|'night'|
//                        'midnight', glow [{x,y,col,k,r}], glowK, mess, asleep, blanket, tvScreen, pcScreen, tv, pc, chair,
//                        lamp, clock, tea, boardGame, flicker, tvGlow      (+ layers.table = the coffee table)
//   bedroom(t, o)        YOUR room for the talk. o: time 'night'|'evening'|'day', lamp, door, hall, alarm, alarmPulse, monitor,
//                        pc, tuck, stars, clock
//   stairs(t, o)         hallway stairs, landing top-right -> 12 steps down-left -> hall + living-room doorway.
//                        o: time 'day'|'evening'|'night', heroDoor, tvGlow, lights, nightLight
//   houseExterior(t, cam, o)  the house from the street (camera set, parallax). o: time 'morning'|'day'|'evening'|'night',
//                        tvGlow, silhouettes, heroWindow, windows, car, carLights, paper, birds, smoke
//   keyboardClose(t, o)  Dad's ancient laptop, POV: QWERTY with a BIG space bar, screen above. o: screen, time, glow,
//                        highlight, press, caps, jumpLabel, crumbs, notes, worn
//   props: newspaper, cerealBox, bowl, mug, cookiePlate, yarnBall, knitBasket, flipChart, bunting, familyFrame, plant,
//          oakTree, hsCloud, hsBird, wallClock, houseFront, nbHouse, dadCar, alarmScreen, keyAt, deviceGlows
//   helpers: toScreen, camTf, vis, mix, tone, frameIn, glow, pool, darkRing, seatPose, makeSet, layersOf
'use strict';

const S = require('../rig/svg');
const { f, clamp, lerp } = S;

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

// padded full-cover bounds for ROOM sets
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
// one set renders in the morning, at dusk, at night / midnight, dimmed or tinted by the red alarm.
//   o: { morn, eve, night, mid, dim, red, soft } all 0..1  (soft = lower the contrast a touch: backgrounds behind people)
//   tn.c(col) colour · tn.ol(fill, w) outlined fill · tn.ln(w, col, op) stroke only · tn.fl(col, op) fill only
//   A colour written as '!#RRGGBB' is emissive (lit windows, LEDs, screens) and is never toned.
function tone(o = {}) {
  const morn = o.morn || 0, eve = o.eve || 0, night = o.night || 0, mid = o.mid || 0, dim = o.dim || 0, red = o.red || 0, soft = o.soft || 0;
  const any = morn + eve + night + mid + dim + red + soft;
  const cache = new Map();
  const c = (col) => {
    if (typeof col === 'string' && col[0] === '!') return col.slice(1);
    if (!any || typeof col !== 'string' || col[0] !== '#' || col.length !== 7) return col;
    let v = cache.get(col);
    if (v) return v;
    let [r, g, b] = hx(col);
    if (soft) { const L = 0.3 * r + 0.59 * g + 0.11 * b; r = lerp(r, L * 0.3 + r * 0.7 + 10, soft * 0.5); g = lerp(g, L * 0.3 + g * 0.7 + 8, soft * 0.5); b = lerp(b, L * 0.3 + b * 0.7 + 6, soft * 0.5); }
    if (morn) { r = lerp(r, r * 0.98 + 10, morn); g = lerp(g, g * 0.94 + 6, morn); b = lerp(b, b * 0.84 + 2, morn); }
    if (eve) { r = lerp(r, r * 0.92 + 14, eve); g = lerp(g, g * 0.76 + 6, eve); b = lerp(b, b * 0.66 + 16, eve); }
    if (night) { r = lerp(r, r * 0.3 + 12, night); g = lerp(g, g * 0.34 + 16, night); b = lerp(b, b * 0.52 + 44, night); }
    if (mid) { r = lerp(r, r * 0.2 + 8, mid); g = lerp(g, g * 0.24 + 12, mid); b = lerp(b, b * 0.42 + 38, mid); }
    if (dim) { r *= 1 - 0.38 * dim; g *= 1 - 0.36 * dim; b *= 1 - 0.3 * dim; }
    if (red) {
      const L = 0.3 * r + 0.59 * g + 0.11 * b;
      r = lerp(r, L * 0.62 + 46, red * 0.8); g = lerp(g, L * 0.24 + 6, red * 0.8); b = lerp(b, L * 0.3 + 14, red * 0.8);
    }
    v = toHex([r, g, b]);
    cache.set(col, v);
    return v;
  };
  const dark = night + mid > 0.5;
  const line = dark ? '#0E0D18' : LINE;
  const ol = (fill, w = 5, extra) => ({ fill: c(fill), stroke: line, 'stroke-width': f(w), 'stroke-linejoin': 'round', 'stroke-linecap': 'round', ...extra });
  const ln = (w, col = LINE, op) => ({ fill: 'none', stroke: col === LINE ? line : c(col), 'stroke-width': f(w), 'stroke-linecap': 'round', 'stroke-linejoin': 'round', ...(op !== undefined ? { opacity: f(clamp(op, 0, 1)) } : {}) });
  const fl = (col, op) => (op === undefined ? { fill: c(col) } : { fill: c(col), opacity: f(clamp(op, 0, 1)) });
  return { c, ol, ln, fl, line, morn, eve, night, mid, dim, red, dark };
}

// ---------------------------------------------------------------- static defs
const DEF = [];
const def = (s) => { DEF.push(s); };
const stops = (st) => st.map(([o, c, a]) => `<stop offset="${o}" stop-color="${c}"${a !== undefined ? ` stop-opacity="${a}"` : ''}/>`).join('');
const lg = (id, st, x2 = 0, y2 = 1, extra = '') => `<linearGradient id="${id}" x1="0" y1="0" x2="${x2}" y2="${y2}"${extra}>${stops(st)}</linearGradient>`;
const rg = (id, st, extra = '') => `<radialGradient id="${id}"${extra}>${stops(st)}</radialGradient>`;
const pat = (id, w, h, inner, extra = '') => `<pattern id="${id}" width="${w}" height="${h}" patternUnits="userSpaceOnUse"${extra}>${inner}</pattern>`;

// skies (windows + exterior)
def(lg('hsSkyMorning', [[0, '#8EC2F2'], [0.5, '#C8E2F5'], [0.8, '#FFE6C4'], [1, '#FFD2A2']]));
def(lg('hsSkyDay', [[0, '#4FA6EE'], [0.6, '#92D0F7'], [1, '#DDF2FF']]));
def(lg('hsSkyEvening', [[0, '#3B3A8E'], [0.42, '#9C5AA6'], [0.74, '#F2876E'], [1, '#FFC27A']]));
def(lg('hsSkyNight', [[0, '#0B1033'], [0.6, '#1A2560'], [1, '#2C3C80']]));
def(lg('hsSkyMidnight', [[0, '#060920'], [0.6, '#10183F'], [1, '#1C2858']]));
def(pat('hsStars', 240, 170, '<circle cx="22" cy="28" r="2.2" fill="#FFF"/><circle cx="150" cy="20" r="1.5" fill="#FFF" opacity="0.7"/><circle cx="100" cy="96" r="2.4" fill="#FFF6C8"/><circle cx="206" cy="128" r="1.6" fill="#FFF" opacity="0.8"/><circle cx="56" cy="146" r="1.3" fill="#FFF" opacity="0.6"/><path d="M184 62 l3 -9 l3 9 l9 3 l-9 3 l-3 9 l-3 -9 l-9 -3 Z" fill="#FFF" opacity="0.85"/>'));
// soft glows (small radii only) + beams
def(rg('hsGlowWarm', [[0, '#FFE6A2', 0.85], [0.45, '#FFCB72', 0.3], [1, '#FFC060', 0]]));
def(rg('hsGlowBlue', [[0, '#C6E8FF', 0.75], [0.45, '#7FBFFF', 0.24], [1, '#7FBFFF', 0]]));
def(rg('hsGlowTV', [[0, '#A8F0FF', 0.7], [0.45, '#55B8FF', 0.22], [1, '#4A9CFF', 0]]));
def(rg('hsGlowRed', [[0, '#FF8C8C', 0.8], [0.4, '#FF2E3E', 0.3], [1, '#FF2E3E', 0]]));
def(rg('hsGlowWhite', [[0, '#FFFFFF', 0.85], [0.45, '#FFFFFF', 0.25], [1, '#FFFFFF', 0]]));
def(rg('hsGlowPurple', [[0, '#E0B8FF', 0.75], [0.45, '#A86BFF', 0.25], [1, '#8A4FFF', 0]]));
def(rg('hsGlowGreen', [[0, '#B8FFD6', 0.75], [0.45, '#4DFF9A', 0.24], [1, '#3DFF9A', 0]]));
def(rg('hsGlowMoon', [[0, '#E8F0FF', 0.6], [0.5, '#B8CCFF', 0.18], [1, '#B8CCFF', 0]]));
def(lg('hsShine', [[0, '#FFFFFF', 0.32], [0.5, '#FFFFFF', 0]], 1, 1));
def(lg('hsBeam', [[0, '#FFF0C2', 0.65], [1, '#FFF0C2', 0]]));
def(lg('hsBeamBlue', [[0, '#C8DCFF', 0.45], [1, '#C8DCFF', 0]]));
def(lg('hsBeamTV', [[0, '#9FE0FF', 0.5], [1, '#9FE0FF', 0]], 1, 0));
def(lg('hsBeamHall', [[0, '#FFD98A', 0.55], [1, '#FFD98A', 0]], 1, 0));
def(lg('hsRGB', [[0, '#FF4FD8'], [0.25, '#FFB13B'], [0.5, '#3DFF9A'], [0.75, '#33D6FF'], [1, '#8A5CFF']], 1, 0));
def(lg('hsScreenOff', [[0, '#232838'], [1, '#0E1018']]));
// generic overlay textures (semi-transparent so they work on any toned colour)
def(pat('hsWoodGrain', 220, 46, '<path d="M0 44 H220 M0 22 Q40 18 80 23 T160 21 T220 22" stroke="#000" stroke-width="2.5" opacity="0.1" fill="none"/><path d="M120 0 V22 M40 22 V44" stroke="#000" stroke-width="2.5" opacity="0.1"/>'));
def(pat('hsSubway', 64, 32, '<path d="M0 31 H64 M32 0 V15.5 M0 15.5 H64 M0 15.5 V31 M64 15.5 V31" stroke="#9FCFC9" stroke-width="2.5" fill="none" opacity="0.9"/><rect x="4" y="3" width="22" height="4" rx="2" fill="#FFF" opacity="0.5"/>'));
def(pat('hsDots', 40, 40, '<circle cx="10" cy="10" r="3.2" fill="#FFF" opacity="0.4"/><circle cx="30" cy="30" r="3.2" fill="#FFF" opacity="0.4"/>'));
def(pat('hsGingham', 36, 36, '<rect width="18" height="36" fill="#FFF" opacity="0.38"/><rect width="36" height="18" fill="#FFF" opacity="0.38"/>'));
def(pat('hsKnit', 34, 30, '<path d="M0 6 L8.5 16 L17 6 L25.5 16 L34 6 M0 20 L8.5 30 L17 20 L25.5 30 L34 20" stroke="#FFF" stroke-width="3" fill="none" opacity="0.35" stroke-linejoin="round"/>'));
def(pat('hsLeafPaper', 90, 90, '<path d="M20 30 q10 -16 22 -6 q-8 14 -22 6 Z M66 72 q10 -16 22 -6 q-8 14 -22 6 Z" fill="#FFFFFF" opacity="0.28"/><circle cx="68" cy="22" r="3" fill="#FFFFFF" opacity="0.3"/><circle cx="22" cy="72" r="3" fill="#FFFFFF" opacity="0.3"/>'));
def(pat('hsDiamond', 70, 90, '<path d="M35 8 L50 45 L35 82 L20 45 Z" fill="none" stroke="#FFFFFF" stroke-width="3" opacity="0.32"/><circle cx="0" cy="45" r="3.5" fill="#FFFFFF" opacity="0.35"/><circle cx="70" cy="45" r="3.5" fill="#FFFFFF" opacity="0.35"/>'));
def(pat('hsCubes', 96, 96, '<g fill="none" stroke="#FFFFFF" stroke-width="3" opacity="0.3" stroke-linejoin="round"><path d="M24 14 L40 22 L40 40 L24 48 L8 40 L8 22 Z M8 22 L24 30 L40 22 M24 30 V48"/><path d="M72 62 L84 68 L84 82 L72 88 L60 82 L60 68 Z M60 68 L72 74 L84 68 M72 74 V88"/></g>'));
def(pat('hsSiding', 40, 28, '<path d="M0 26 H40" stroke="#000" stroke-width="3" opacity="0.12"/><path d="M0 2 H40" stroke="#FFF" stroke-width="2" opacity="0.22"/>'));
def(pat('hsShingle', 48, 28, '<path d="M0 26 H48 M24 0 V13 M0 13 H48 M12 13 V26 M36 13 V26" stroke="#000" stroke-width="2.5" opacity="0.15" fill="none"/>'));
def(pat('hsBrick', 60, 30, '<path d="M0 14 H60 M0 29 H60 M30 0 V14 M0 14 V29 M60 14 V29" stroke="#000" stroke-width="2.5" opacity="0.14" fill="none"/>'));
def(pat('hsLawn', 70, 44, '<path d="M8 32 l4 -12 l4 12 M38 16 l3 -10 l3 10 M54 38 l3 -9 l3 9" stroke="#1E6B2A" stroke-width="2.5" fill="none" opacity="0.26" stroke-linejoin="round"/>'));
def(pat('hsRoad', 130, 64, '<circle cx="14" cy="10" r="2" fill="#FFF" opacity="0.1"/><circle cx="86" cy="44" r="2.5" fill="#000" opacity="0.12"/><circle cx="54" cy="24" r="1.6" fill="#FFF" opacity="0.08"/><circle cx="110" cy="12" r="2" fill="#000" opacity="0.1"/>'));
def(pat('hsCarpet', 24, 24, '<circle cx="6" cy="6" r="1.6" fill="#000" opacity="0.08"/><circle cx="18" cy="18" r="1.6" fill="#FFF" opacity="0.1"/>'));

// ---------------------------------------------------------------- camera helpers (same conventions as scenes/env.js)
function camTf(cam = {}, k = 1) {
  cam = cam || {};
  const z = 1 + ((cam.zoom ?? 1) - 1) * k;
  const fx = cam.fx ?? 960, fy = cam.fy ?? 540;
  const x = (cam.x || 0) * k, y = (cam.y || 0) * k;
  return `translate(${f(fx + (cam.sx || 0))} ${f(fy + (cam.sy || 0))}) scale(${f(z)}) translate(${f(-fx - x)} ${f(-fy - y)})`;
}
const V = (cam, svg, k) => (svg ? S.g(svg, camTf(cam || {}, k)) : '');
function vis(cam = {}, k = 1) {
  cam = cam || {};
  const z = 1 + ((cam.zoom ?? 1) - 1) * k;
  const fx = cam.fx ?? 960, fy = cam.fy ?? 540, sx = cam.sx || 0, sy = cam.sy || 0;
  const x = (cam.x || 0) * k, y = (cam.y || 0) * k;
  return { x0: fx + x - (fx + sx) / z, x1: fx + x + (1920 - fx - sx) / z, y0: fy + y - (fy + sy) / z, y1: fy + y + (1080 - fy - sy) / z, z };
}
function toScreen(cam, a) {
  cam = cam || {};
  const k = a.k ?? 1, z = 1 + ((cam.zoom ?? 1) - 1) * k, fx = cam.fx ?? 960, fy = cam.fy ?? 540;
  return { x: fx + (cam.sx || 0) + z * (a.x - fx - (cam.x || 0) * k), y: fy + (cam.sy || 0) + z * (a.y - fy - (cam.y || 0) * k), z };
}
function layersOf(bg = '', mid = '', fg = '', light = '', extra = {}) {
  const o = { bg, mid, fg, light, ...extra };
  Object.defineProperty(o, 'toString', { value() { return this.bg + this.mid + this.fg + this.light; }, enumerable: false });
  return o;
}
function makeSet(layersFn) {
  const fn = (t = 0, opts = {}) => { const L = layersFn(t, opts); return (L.bg || '') + (L.mid || '') + (L.front || '') + (L.table || '') + (L.fg || '') + (L.light || ''); };
  fn.layers = layersFn;
  return fn;
}
const screenOf = (inner, w, h) => (typeof inner === 'function' ? inner(w, h) : inner || '');
const frameIn = (svg, w, h) => G(svg, `translate(${f(-w / 2)} ${f(-h / 2)}) scale(${f(w / 1920)} ${f(h / 1080)})`);
// seated character pose on a seat anchor: hips on spot.hip, straight legs (hidden by the furniture front). size = the
// character's rig size factor (docs/CAST.md), so a bigger adult's hips still land on the cushion.
// spot.pose (e.g. the bed edge's frog-legged sit) and spot.rot / view are applied too; `extra` wins.
const seatPose = (spot, size = 1, extra = {}) => ({ x: spot.x, y: +f(spot.hip + 306 * spot.s * size), s: spot.s, ...(spot.turn ? { turn: spot.turn } : {}), ...(spot.rot ? { rot: spot.rot } : {}), ...(spot.pose || {}), ...extra });

// ---------------------------------------------------------------- light helpers (no big radial gradients)
const glow = (x, y, r, id = 'hsGlowWarm', op = 1) => (op > 0.003 ? CI(x, y, r, { fill: `url(#${id})`, opacity: f(clamp(op, 0, 1)) }) : '');
// cel-shaded light pool: n nested ellipses of one colour (cheap fake radial)
function pool(x, y, rx, ry, col, op, n = 4) {
  if (op <= 0.003) return '';
  let o = '';
  for (let i = 0; i < n; i++) { const k = 1 - i / n; o += E(x, y, rx * k, ry * k, { fill: col, opacity: f(op / n) }); }
  return o;
}
// darkness everywhere except around (x, y): n full-cover sheets with growing elliptical holes (evenodd)
function darkRing(x, y, rx, ry, col, op, n = 8, box = [XL, YT, XR, YB]) {
  if (op <= 0.003) return '';
  const [x0, y0, x1, y1] = box;
  let o = '';
  for (let i = 0; i < n; i++) {
    const k = 0.62 + i * 0.22 + i * i * 0.025;
    o += P(dR(x0, y0, x1 - x0, y1 - y0) + dE(x, y, rx * k, ry * k), { fill: col, opacity: f(op / n), 'fill-rule': 'evenodd' });
  }
  return o;
}
// screen-light pools on faces: [{x, y, col, k, r}] -> svg (draw in the light layer)
const GLOW_COLS = { laptop: '#BFE4FF', tablet: '#9FF2FF', phone: '#F4F8FF', pc: '#C9A8FF', tv: '#8FD8FF', red: '#FF5A66', warm: '#FFD58A', green: '#8DFFB8' };
const GLOW_IDS = { laptop: 'hsGlowBlue', tablet: 'hsGlowTV', phone: 'hsGlowWhite', pc: 'hsGlowPurple', tv: 'hsGlowTV', red: 'hsGlowRed', warm: 'hsGlowWarm', green: 'hsGlowGreen', moon: 'hsGlowMoon' };
function faceGlows(list, gk = 1) {
  let o = '';
  for (const g of list || []) {
    const k = (g.k ?? 1) * gk;
    if (k <= 0.01) continue;
    const r = g.r || 150, id = GLOW_IDS[g.col || 'laptop'];
    if (id) o += glow(g.x, g.y, r * 1.25, id, 0.8 * k);
    else o += pool(g.x, g.y, r, r * 0.92, g.col, 0.36 * k, 5);
  }
  return o;
}

// ================================================================= shared props
// puffy cloud (one silhouette, outline outside only). origin = bottom centre
function hsCloud(x, y, s = 1, tn = tone(), col = '#FFFFFF', sh = '#DCEBFA') {
  const d = dC(-64, -30, 30) + dC(-14, -58, 46) + dC(40, -40, 36) + dC(80, -22, 22) + dRR(-98, -36, 198, 36, 18);
  return G(P(d, { fill: tn.line, stroke: tn.line, 'stroke-width': f(9 / s), 'stroke-linejoin': 'round' }) + P(d, { fill: tn.c(col) }) + P(dRR(-94, -14, 190, 12, 6), { fill: tn.c(sh) }), tr(x, y, s));
}
// small round songbird. o: flying, flap 0..1, flip, col, belly. origin = feet (perched) / body centre (flying)
function hsBird(x, y, s = 1, tn = tone(), o = {}) {
  const col = o.col || '#E8604A', belly = o.belly || '#FFD9A8';
  let b = '';
  if (o.flying) {
    const fl = Math.sin((o.flap ?? 0.5) * Math.PI * 2);
    b += P(`M-2 -4 Q-20 ${f(-16 - 20 * fl)} -36 ${f(-8 - 24 * fl)} Q-18 0 -4 4 Z M4 -4 Q20 ${f(-16 - 20 * fl)} 36 ${f(-8 - 24 * fl)} Q18 0 4 4 Z`, tn.ol(col, 3.5));
    b += E(0, 0, 15, 11, tn.ol(col, 3.5)) + E(2, 4, 9, 5, tn.fl(belly)) + P('M14 -4 L22 -1 L14 2 Z', tn.ol('#FFB13B', 2)) + CI(8, -4, 2.2, tn.fl(LINE));
  } else {
    b += P('M-4 0 L-5 8 M4 0 L5 8', tn.ln(2.5, '#E09A3A'));
    b += P('M-18 -10 Q-30 -6 -28 2 L-12 -4 Z', tn.ol(col, 3)) + E(0, -14, 16, 14, tn.ol(col, 3.5)) + E(2, -9, 10, 7, tn.fl(belly)) + P('M14 -18 L22 -15 L14 -12 Z', tn.ol('#FFB13B', 2)) + CI(8, -19, 2.3, tn.fl(LINE));
  }
  return G(b, `translate(${f(x)} ${f(y)}) scale(${f(o.flip ? -s : s)} ${f(s)})`);
}
// round-headed leafy tree (origin = trunk base). o: col, hi, trunk, sway, feeder (bird feeder on a branch)
function oakTree(x, y, s = 1, tn = tone(), o = {}) {
  const col = o.col || '#5DB55A', hi = o.hi || '#8FD67A', trunk = o.trunk || '#8A5A36';
  let t = P('M-26 0 Q-18 -90 -16 -190 L16 -190 Q18 -90 26 0 Z', tn.ol(trunk, 6)) + P('M-14 -170 L-70 -250 M10 -180 L60 -270', tn.ln(14, trunk)) + P('M-6 -30 Q-4 -100 -6 -160', tn.ln(5, '#B07A4E', 0.7));
  const cd = dC(0, -330, 130) + dC(-110, -270, 86) + dC(112, -262, 84) + dC(-60, -410, 80) + dC(70, -400, 78) + dRR(-150, -280, 300, 90, 40);
  let cn = P(cd, { fill: tn.line, stroke: tn.line, 'stroke-width': 12, 'stroke-linejoin': 'round' }) + P(cd, { fill: tn.c(col) });
  cn += P(dC(-70, -380, 34) + dC(20, -430, 26) + dC(-130, -290, 22) + dC(96, -320, 20), { fill: tn.c(hi), opacity: 0.9 });
  cn += P('M-90 -220 Q0 -196 100 -222', tn.ln(5, mix(col, '#000000', 0.25), 0.55));
  if (o.feeder) {
    cn += P('M60 -230 V-176', tn.ln(3)) + G(P('M-30 0 L0 -22 L30 0 Z', tn.ol('#E8604A', 3)) + R(-22, 0, 44, 30, 3, tn.ol('#FFE9B8', 3)) + R(-26, 30, 52, 8, 3, tn.ol('#C98A52', 3)) + P('M-14 14 h28', tn.ln(3, '#C98A52')), 'translate(60 -176)');
  }
  t += o.sway ? G(cn, `rotate(${f(o.sway)} 0 -190)`) : cn;
  return G(t, tr(x, y, s));
}
// wall clock showing 'H:MM' (or hours as a number). origin = centre, r = face radius. o: rim, face, numbers
function wallClock(x, y, r, time = '8:00', tn = tone(), o = {}) {
  let h = 8, m = 0;
  if (typeof time === 'number') { h = Math.floor(time); m = (time - h) * 60; } else { const p = String(time).split(':'); h = +p[0] || 0; m = +p[1] || 0; }
  const am = ((h % 12) + m / 60) / 12 * Math.PI * 2, mm = m / 60 * Math.PI * 2;
  let c = CI(3, 5, r * 1.18, { fill: '#000', opacity: 0.12 }) + CI(0, 0, r * 1.18, tn.ol(o.rim || '#E04848', 5)) + CI(0, 0, r, tn.ol(o.face || '#FFF9EE', 3.5));
  let ticks = '';
  for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2, l = i % 3 === 0 ? 0.2 : 0.09; ticks += `M${f(Math.sin(a) * r * 0.84)} ${f(-Math.cos(a) * r * 0.84)} L${f(Math.sin(a) * r * (0.84 - l))} ${f(-Math.cos(a) * r * (0.84 - l))} `; }
  c += P(ticks, tn.ln(Math.max(2, r * 0.05)));
  c += P(`M0 0 L${f(Math.sin(am) * r * 0.48)} ${f(-Math.cos(am) * r * 0.48)}`, tn.ln(r * 0.11)) + P(`M0 0 L${f(Math.sin(mm) * r * 0.74)} ${f(-Math.cos(mm) * r * 0.74)}`, tn.ln(r * 0.07));
  c += CI(0, 0, r * 0.08, tn.fl(o.rim || '#E04848'));
  c += P(`M${f(-r * 0.6)} ${f(-r * 0.52)} A${f(r * 0.8)} ${f(r * 0.8)} 0 0 1 ${f(r * 0.08)} ${f(-r * 0.8)}`, tn.ln(r * 0.06, '#FFFFFF', 0.8));
  return G(c, tr(x, y));
}
// cereal bowl, front view. origin = bottom centre of the bowl. o: col, fill ('cereal'|'empty'|'soup'), spoon
function bowl(x, y, s = 1, tn = tone(), o = {}) {
  const col = o.col || '#5FA8E0';
  let b = P('M-44 -34 Q-42 0 0 0 Q42 0 44 -34 Z', tn.ol(col, 4)) + P('M-36 -22 Q-20 -10 0 -10', tn.ln(4, '#FFFFFF', 0.45));
  b += E(0, -34, 44, 10, tn.ol(mix(col, '#FFFFFF', 0.35), 4));
  if (o.fill !== 'empty') {
    b += E(0, -35, 37, 7, tn.fl('#FFF8EC'));
    let ce = '';
    for (let i = 0; i < 7; i++) ce += dRR(-30 + i * 9 + (i % 2) * 2, -40 + (i % 3) * 3, 8, 8, 2.5);
    b += P(ce, tn.ol('#F2B84B', 1.8));
  }
  if (o.spoon) b += P('M10 -40 L42 -78', tn.ln(9)) + P('M10 -40 L42 -78', tn.ln(5, '#D8DDE4')) + E(44, -81, 7, 5, tn.ol('#D8DDE4', 2.5));
  return G(b, tr(x, y, s));
}
// mug, front view. origin = bottom centre. o: col, label ('#1 MOM'...), handle 'L'|'R', steam (t), tea (bag tag)
function mug(x, y, s = 1, tn = tone(), o = {}) {
  const col = o.col || '#FFFFFF';
  const hs = o.handle === 'L' ? -1 : 1;
  let m = P(`M${f(hs * 24)} -40 q${f(hs * 18)} 0 ${f(hs * 18)} 14 q0 14 ${f(-hs * 18)} 14`, tn.ln(11)) + P(`M${f(hs * 24)} -40 q${f(hs * 18)} 0 ${f(hs * 18)} 14 q0 14 ${f(-hs * 18)} 14`, tn.ln(5.5, col));
  m += R(-26, -54, 52, 54, 8, tn.ol(col, 4)) + E(0, -54, 26, 6, tn.ol(mix(col, '#000000', 0.12), 3)) + E(0, -53, 20, 4, tn.fl(o.tea ? '#C98A4A' : '#6A3E22'));
  if (o.label) m += TF(o.label, 0, -22, o.label.length > 4 ? 12 : 15, tn.c(o.labelCol || '#E04848'));
  if (o.tea) m += P('M8 -54 Q14 -40 12 -24', tn.ln(1.5)) + R(6, -26, 12, 12, 2, tn.ol('#FFE14D', 1.5));
  if (o.steam !== undefined && o.steam !== false) {
    const tt = +o.steam || 0;
    let sd = '';
    for (let i = 0; i < 2; i++) { const u = md(tt * 0.45 + i * 0.5, 1); sd += `M${f(-6 + i * 12 + Math.sin(tt * 2 + i) * 4)} ${f(-64 - u * 50)} q-8 -10 0 -20 q8 -10 0 -20 `; }
    m += P(sd, { fill: 'none', stroke: '#FFFFFF', 'stroke-width': 5, 'stroke-linecap': 'round', opacity: 0.55 });
  }
  return G(m, tr(x, y, s));
}
// Dad's newspaper "THE DAILY LEDGER". origin = centre. o.open: held spread open (two pages facing the camera, ~300 x 200 at
// s 1, for Dad's hands at x ±150); default: folded, lying on the table seen at a slant (origin = front centre on the table)
function newspaper(x, y, s = 1, rot = 0, tn = tone(), o = {}) {
  let n = '';
  if (o.open) {
    n += P('M-152 -100 L0 -92 L152 -100 L150 100 L0 106 L-150 100 Z', tn.ol('#F2EEE4', 4)) + P('M0 -92 V106', tn.ln(3, '#C9C2B2'));
    n += T('THE DAILY LEDGER', -76, -64, 18, tn.c('#2A2A30')) + P('M-140 -54 H-12', tn.ln(2.5, '#2A2A30'));
    n += TF('TAX SEASON', -76, -32, 16, tn.c('#2A2A30')) + TF('IS FUN!', -76, -14, 16, tn.c('#2A2A30'));
    n += R(-136, -2, 56, 46, 2, tn.fl('#B9C6D2')) + P('M-128 34 l14 -18 l10 10 l12 -16 l14 24 Z', tn.fl('#7F93A8'));
    n += P('M-70 4 H-14 M-70 14 H-14 M-70 24 H-14 M-70 34 H-18 M-136 56 H-14 M-136 66 H-14 M-136 76 H-30 M-136 86 H-14', tn.ln(3.5, '#A8A294'));
    n += TF('SPORTS', 76, -66, 15, tn.c('#2A2A30')) + P('M12 -54 H140 M12 -44 H140 M12 -34 H120 M12 -16 H140 M12 -6 H140 M12 4 H100 M12 22 H140 M12 32 H140 M12 42 H130 M12 60 H140 M12 70 H140 M12 80 H90', tn.ln(3.5, '#A8A294'));
    n += R(70, 0, 66, 44, 2, tn.ol('#E8E2D2', 2)) + TF('SUDOKU', 103, 26, 11, tn.c('#5A5650'));
  } else {
    n += P('M-96 0 L-80 -26 L96 -26 L92 0 Z', tn.ol('#F2EEE4', 3.5)) + P('M-90 -6 L88 -6', tn.ln(2, '#C9C2B2'));
    n += P('M-74 -20 L40 -20 M-76 -13 L70 -13', tn.ln(3, '#8A8478')) + P('M48 -21 h30 v10 h-32 Z', tn.fl('#B9C6D2'));
  }
  return G(n, tr(x, y, s, rot));
}
// CUBE-O's cereal box (front). origin = bottom centre, 70 x 104 at s 1
function cerealBox(x, y, s = 1, tn = tone()) {
  let c = R(-35, -104, 70, 104, 4, tn.ol('#3E8FE0', 4)) + R(30, -100, 10, 100, 2, tn.fl('#2A6FB8')) + R(-35, -104, 70, 22, 4, tn.fl('#FFD23F')) + T('CUBE-O\'s', 0, -88, 15, tn.c('#E04848'), OUTX(3, tn.line));
  c += G(R(-16, -16, 32, 32, 6, tn.ol('#FFB13B', 3)) + CI(-6, -4, 3, tn.fl(LINE)) + CI(6, -4, 3, tn.fl(LINE)) + P('M-6 6 Q0 11 6 6', tn.ln(2.5)), 'translate(0 -48) rotate(-8)');
  c += P(dRR(-26, -20, 9, 9, 2) + dRR(14, -26, 9, 9, 2) + dRR(-6, -14, 9, 9, 2), tn.ol('#F2B84B', 1.5));
  return G(c, tr(x, y, s));
}
// plate of Granny's cookies. origin = bottom centre of the plate
function cookiePlate(x, y, s = 1, tn = tone(), n = 5) {
  let c = E(0, -6, 62, 13, tn.ol('#FFFFFF', 3.5)) + E(0, -8, 46, 8, tn.fl('#E8F1F6'));
  const pts = [[-26, -14], [0, -18], [26, -14], [-12, -30], [14, -30], [0, -42]].slice(0, n);
  for (const [cx, cy] of pts) c += E(cx, cy, 18, 9, tn.ol('#D9954A', 2.5)) + P(dC(cx - 6, cy - 2, 2.6) + dC(cx + 5, cy + 1, 2.6) + dC(cx + 1, cy - 4, 2.2), tn.fl('#5A3018'));
  return G(c, tr(x, y, s));
}
// yarn ball (origin = centre, r 20 at s 1)
function yarnBall(x, y, s = 1, tn = tone(), col = '#E86A8A') {
  return G(CI(0, 0, 20, tn.ol(col, 3)) + P('M-16 -10 Q0 -4 14 -14 M-19 2 Q2 8 18 -2 M-12 14 Q4 10 12 16 M-6 -18 Q-12 0 -4 18', tn.ln(2, mix(col, '#000000', 0.25))), tr(x, y, s));
}
// Granny's knitting basket with yarn + needles (origin = bottom centre, ~120 wide at s 1)
function knitBasket(x, y, s = 1, tn = tone()) {
  let k = yarnBall(-26, -52, 1, tn, '#E86A8A') + yarnBall(14, -58, 1.1, tn, '#7FC8E8') + yarnBall(34, -44, 0.85, tn, '#FFD23F');
  k += P('M-10 -50 L-44 -104 M0 -52 L-28 -110', tn.ln(5, '#C9CED8')) + CI(-45, -106, 4, tn.ol('#E04848', 1.5)) + CI(-29, -112, 4, tn.ol('#E04848', 1.5));
  k += P('M-58 -44 L58 -44 L48 0 L-48 0 Z', tn.ol('#D9A45C', 4)) + P('M-54 -30 H54 M-51 -16 H51 M-30 -44 L-26 0 M0 -44 V0 M30 -44 L26 0', tn.ln(2.5, '#A8763A'));
  k += P('M14 -58 Q60 -40 70 0', tn.ln(2.5, '#7FC8E8'));
  return G(k, tr(x, y, s));
}
// framed photos / pictures for the walls. kind: 'wedding' | 'baby' | 'arcade' (teen Mom + ARCADE QUEEN trophy, 1998) |
// 'cert' (Dad: ACCOUNTANT OF THE YEAR) | 'granny' (young Granny + cake) | 'beach' (the family) | 'stitch' (HOME SWEET HOME) |
// 'castle' (YOUR crayon drawing of the Cube City castle) | 'school' (YOUR school photo; o.year 1..6 adds the headset)
function familyFrame(kind, x, y, w, h, rot, tn, o = {}) {
  const C = tn.c, O = tn.ol, LN = tn.ln, FL = tn.fl;
  const frameCol = o.frame || { wedding: '#F2E6C8', baby: '#9A6238', arcade: '#2E3242', cert: '#C9A24A', granny: '#8A5A36', beach: '#FFFFFF', stitch: '#B9764A', castle: '#FFFFFF', school: '#5A7AB8' }[kind] || '#9A6238';
  let g = R(-w / 2 + 5, -h / 2 + 7, w, h, 4, { fill: '#000', opacity: 0.12 }) + R(-w / 2, -h / 2, w, h, 4, O(frameCol, 4));
  const iw = w - 18, ih = h - 18;
  const BG = { wedding: '#F6EEDC', baby: '#CDE9FF', arcade: '#3A2A6A', cert: '#FFFDF4', granny: '#F7E0C6', beach: '#9ED9FF', stitch: '#FFF8EA', castle: '#FFFFFF', school: '#BFD2EE' };
  g += R(-iw / 2, -ih / 2, iw, ih, 2, FL(BG[kind] || '#EEE'));
  const head = (hx, hy, r, hair, extra = '') => R(hx - r, hy - r, 2 * r, 2 * r, r * 0.32, O('#FFFFFF', 2.5)) + CI(hx - r * 0.34, hy + r * 0.05, r * 0.12, FL(LINE)) + CI(hx + r * 0.34, hy + r * 0.05, r * 0.12, FL(LINE)) + extra + P(`M${hx - r * 1.05} ${hy - r * 0.1} L${hx - r * 1.05} ${hy - r * 0.95} Q${hx} ${hy - r * 1.45} ${hx + r * 1.05} ${hy - r * 0.95} L${hx + r * 1.05} ${hy - r * 0.1} L${hx + r * 0.5} ${hy - r * 0.55} L${hx} ${hy - r * 0.4} L${hx - r * 0.5} ${hy - r * 0.55} Z`, O(hair, 2.5));
  const stache = (hx, hy, r) => P(`M${hx - r * 0.5} ${hy + r * 0.5} Q${hx} ${hy + r * 0.25} ${hx + r * 0.5} ${hy + r * 0.5} Q${hx} ${hy + r * 0.65} ${hx - r * 0.5} ${hy + r * 0.5} Z`, O('#6A3E22', 1.5));
  const smile = (hx, hy, r) => P(`M${hx - r * 0.3} ${hy + r * 0.45} Q${hx} ${hy + r * 0.7} ${hx + r * 0.3} ${hy + r * 0.45}`, LN(2));
  if (kind === 'wedding') {
    g += R(-iw / 2 + 8, ih / 2 - 26, iw - 16, 26, 0, FL('#E8D2A8'));
    g += head(-16, -8, 17, '#7A4A2A', stache(-16, -8, 17)) + R(-32, 10, 32, 30, 5, FL('#3A3F52'));
    g += head(18, -8, 16, '#B85A2E', smile(18, -8, 16) + CI(18, -30, 9, O('#B85A2E', 2))) + P('M2 40 L10 10 L26 10 L34 40 Z', FL('#FFFFFF')) + P('M2 10 Q18 -40 34 10', LN(2, '#FFFFFF', 0.8));
  } else if (kind === 'baby') {
    g += E(0, 14, 30, 20, O('#FFE07A', 2.5)) + head(0, -6, 17, '#E0782A', smile(0, -6, 17)) + P('M-6 -26 q6 -8 12 0', LN(2.5, '#E0782A'));
  } else if (kind === 'arcade') {
    g += R(-iw / 2, -ih / 2, iw, 16, 0, FL('#FF4FD8')) + TF('1998', 0, -ih / 2 + 13, 11, C('#FFFFFF'));
    g += R(-iw / 2 + 6, -ih / 2 + 22, 18, ih - 30, 2, FL('#33D6FF')) + R(iw / 2 - 24, -ih / 2 + 22, 18, ih - 30, 2, FL('#3DFF9A'));
    g += head(-6, 4, 15, '#B85A2E', smile(-6, 4, 15) + P('M-21 -4 L-12 -10 L-4 -4 L4 -10 L9 -4', LN(2.5, '#B85A2E'))) + R(-20, 20, 28, 20, 4, FL('#8A5CFF'));
    g += G(P('M-8 -16 Q-8 -2 0 0 Q8 -2 8 -16 Z', O('#FFC23A', 2)) + R(-3, 0, 6, 6, 1, FL('#FFC23A')) + R(-7, 6, 14, 5, 1, FL('#7E4A2A')), 'translate(16 18)');
    g += TF('ARCADE QUEEN', 0, ih / 2 - 4, 9, C('#FFE14D'));
  } else if (kind === 'cert') {
    g += P(`M${-iw / 2 + 6} ${-ih / 2 + 6} h${iw - 12} v${ih - 12} h${-iw + 12} Z`, LN(2, '#C9A24A'));
    g += TF('CERTIFICATE', 0, -ih / 2 + 22, 12, C('#7E5A1E')) + TF('ACCOUNTANT', 0, -4, 12, C('#2A2A30')) + TF('OF THE YEAR', 0, 10, 10, C('#2A2A30'));
    g += P(`M-30 ${ih / 2 - 18} H8`, LN(1.5, '#7E5A1E')) + CI(24, ih / 2 - 20, 10, O('#E04848', 2)) + P(`M20 ${ih / 2 - 12} l-4 12 M28 ${ih / 2 - 12} l4 12`, LN(3, '#E04848'));
  } else if (kind === 'granny') {
    g += R(-iw / 2, ih / 2 - 20, iw, 20, 0, FL('#C9A27A'));
    g += head(-10, -6, 15, '#E8B04A', smile(-10, -6, 15)) + R(-24, 10, 28, 20, 4, FL('#E86A8A'));
    g += R(10, 8, 26, 16, 3, O('#FFF4E0', 2)) + P('M10 8 Q23 -2 36 8', O('#FF9EC4', 2)) + P('M23 -2 V-12', LN(2, '#E04848')) + CI(23, -14, 2.5, FL('#FFC23A'));
  } else if (kind === 'beach') {
    g += R(-iw / 2, 10, iw, ih / 2 - 10, 0, FL('#F2D79A')) + R(-iw / 2, 2, iw, 10, 0, FL('#3FA8D8'));
    g += head(-30, -6, 11, '#7A4A2A', stache(-30, -6, 11)) + head(-8, -8, 11, '#B85A2E') + head(12, -2, 9, '#E0782A') + head(32, -4, 11, '#E8E2DA');
    g += CI(iw / 2 - 12, -ih / 2 + 12, 8, FL('#FFD23F'));
  } else if (kind === 'stitch') {
    g += P(`M${-iw / 2 + 5} ${-ih / 2 + 5} h${iw - 10} v${ih - 10} h${-iw + 10} Z`, { fill: 'none', stroke: C('#E86A8A'), 'stroke-width': 2, 'stroke-dasharray': '4 4' });
    g += TF('HOME', 0, -6, 15, C('#3E9C97')) + TF('SWEET HOME', 0, 12, 11, C('#3E9C97')) + P('M-8 -32 q8 -10 8 0 q0 -10 8 0 q0 8 -8 14 q-8 -6 -8 -14 Z', FL('#E86A8A'));
  } else if (kind === 'castle') {
    g += P(`M${-iw / 2 + 8} ${ih / 2 - 12} H${iw / 2 - 8}`, LN(3, '#5DB55A')) + P('M-30 20 V-6 H-22 V-14 H-14 V-6 H-6 V-18 H6 V-6 H14 V-14 H22 V-6 H30 V20 Z', { fill: 'none', stroke: C('#8A5CFF'), 'stroke-width': 3, 'stroke-linejoin': 'round' });
    g += P('M0 -18 V-32 l12 4 l-12 4', LN(2.5, '#E04848')) + CI(iw / 2 - 14, -ih / 2 + 14, 8, LN(3, '#FFB13B')) + TF('MY CASTLE', 0, ih / 2 - 16, 9, C('#3E8FE0'));
  } else if (kind === 'school') {
    const yr = o.year || 3;
    g += R(-iw / 2, -ih / 2, iw, ih, 2, FL(['#BFD2EE', '#C9E8C8', '#F2D2E8', '#FFE8B8', '#D6CCF2', '#BEE6E6'][(yr - 1) % 6]));
    g += head(0, 2, 15 + yr * 0.6, '#E0782A', smile(0, 2, 15 + yr * 0.6)) + R(-18, 22, 36, 14, 4, FL('#D8262E'));
    if (yr >= 4) g += P(`M-17 -2 Q0 ${-30 - yr} 17 -2`, LN(4, '#2A2D38')) + R(-22, -6, 8, 14, 3, FL('#2A2D38')) + R(14, -6, 8, 14, 3, FL('#2A2D38'));
  }
  g += R(-iw / 2, -ih / 2, iw, ih * 0.45, 2, { fill: 'url(#hsShine)', opacity: 0.5 });
  return G(g, tr(x, y, 1, rot));
}
// Dad's flip chart on an easel. origin = (centre x, floor y). mode: 'meeting' (FAMILY MEETING + Dad's TIME SPENT pie chart:
// 90% "THE NINTENDO") | 'next' (YOUR crayon FAMILY GAME NIGHT page) | 'blank'. Board ~300 x 380 at s 1, its centre at y -470.
function flipChart(x, y, s = 1, tn = tone(), mode = 'meeting') {
  const C = tn.c, O = tn.ol, LN = tn.ln, FL = tn.fl;
  let e = P('M-120 0 L-40 -680 M120 0 L40 -680 M0 -660 L0 -10', LN(16)) + P('M-120 0 L-40 -680 M120 0 L40 -680 M0 -660 L0 -10', LN(8, '#C98A52'));
  e += R(-170, -292, 340, 16, 5, O('#B9764A', 4));
  e += R(-150, -660, 300, 380, 6, O('#FFFFFF', 5)) + R(-160, -676, 320, 26, 8, O('#7A8094', 4));
  e += P('M-150 -650 Q-150 -664 -136 -664 M150 -650 Q150 -664 136 -664', LN(3, '#C9CED8'));
  if (mode === 'meeting') {
    e += T('FAMILY', 0, -606, 40, C('#2E5FB8')) + T('MEETING', 0, -568, 40, C('#2E5FB8')) + P('M-110 -556 Q0 -546 110 -558', LN(4, '#E04848'));
    // the pie chart: TIME SPENT — 90% the Nintendo
    e += CI(-50, -444, 70, O('#7FC8E8', 4)) + P('M-50 -444 L-50 -514 A70 70 0 0 1 -9 -500.6 Z', O('#FFD23F', 4));
    e += TF('NINTENDO', -50, -436, 14, C('#1E4A7A')) + TF('90%', -50, -418, 16, C('#1E4A7A')) + TF('US', -22, -520, 10, C('#7A5A1E'));
    e += TF('TIME', 74, -486, 18, C('#2A2A30')) + TF('SPENT', 74, -466, 18, C('#2A2A30')) + P('M50 -450 L30 -440', LN(3, '#E04848')) + T('!!', 96, -430, 30, C('#E04848'));
    e += TF('11 HRS/DAY', 56, -404, 15, C('#E04848'));
  } else if (mode === 'next') {
    e += T('FAMILY', 0, -612, 38, C('#E04848')) + T('GAME NIGHT!', 0, -574, 36, C('#3DA84A'));
    const fig = (fx, kind) => {
      let q = '';
      if (kind === 'dog') q += R(fx - 14, -540, 28, 62, 14, O('#E87A3A', 3)) + P(`M${fx - 4} -536 Q${fx + 6} -510 ${fx - 4} -486`, LN(3, '#FFD23F'));
      else q += R(fx - 13, -540, 26, 24, 6, O('#FFFFFF', 2.5)) + R(fx - 13, -514, 26, 32, 4, O(kind, 2.5)) + P(`M${fx - 7} -482 v14 M${fx + 7} -482 v14`, LN(3));
      return q;
    };
    e += fig(-96, 'dog') + fig(-36, '#9AA0AE') + fig(24, '#B07AD8') + fig(84, '#D8262E') + P('M-86 -548 l6 -12 l6 12', LN(2.5, '#FFC23A'));
    e += TF('SAME SERVER!', 0, -430, 22, C('#3E8FE0')) + TF('SAME TIME!', 0, -404, 22, C('#8A5CFF')) + TF('EVERY SATURDAY ♥', 0, -334, 18, C('#E04848'));
    e += P('M-120 -380 l8 -8 M-120 -380 l8 8 M120 -380 l-8 -8 M120 -380 l-8 8', LN(3, '#FFB13B'));
  }
  return G(e, tr(x, y, s));
}
// paper bunting with letters (origin = left end of the string). colours cycle; ' ' = a gap
function bunting(x, y, text, tn, w = 46, sag = 18) {
  const n = text.length, cols = ['#E04848', '#F2B84B', '#3E9C97', '#FFF6E4', '#7FC8E8'];
  let s = '', flags = '';
  const span = n * w;
  s += P(`M${f(x - 10)} ${f(y)} Q${f(x + span / 2)} ${f(y + sag * 2)} ${f(x + span + 10)} ${f(y)}`, tn.ln(3));
  for (let i = 0; i < n; i++) {
    const ch = text[i];
    if (ch === ' ') continue;
    const u = (i + 0.5) / n, fx = x + span * u, fy = y + sag * 4 * u * (1 - u) * 1.0 * 1;
    const col = cols[i % cols.length];
    flags += G(P(`M${-w / 2 + 2} 0 L${w / 2 - 2} 0 L0 ${f(w * 1.15)} Z`, tn.ol(col, 3)) + TF(ch, 0, f(w * 0.52), f(w * 0.52), tn.c(col === '#FFF6E4' || col === '#F2B84B' || col === '#7FC8E8' ? '#2A2A30' : '#FFFFFF')), `translate(${f(fx)} ${f(fy)}) rotate(${f((u - 0.5) * -8)})`);
  }
  return s + flags;
}
// potted plant (origin = bottom centre of the pot). kind 'round' | 'tall' | 'trail'
function plant(x, y, s = 1, tn = tone(), kind = 'round', pot = '#E8764A') {
  let p = '';
  if (kind === 'tall') p += P('M0 -40 Q-6 -120 -30 -180 M0 -40 Q10 -130 30 -190 M0 -40 Q0 -110 2 -200', tn.ln(5, '#3E8A4A')) + P(dE(-30, -180, 16, 30) + dE(30, -190, 15, 32) + dE(2, -200, 14, 30) + dE(-16, -120, 13, 24) + dE(18, -128, 13, 24), tn.ol('#5DB55A', 3));
  else if (kind === 'trail') p += P('M-20 -36 Q-46 -10 -40 40 M20 -36 Q50 0 44 50 M0 -38 Q-4 0 -10 30', tn.ln(4, '#3E8A4A')) + P(dC(-42, 8, 9) + dC(-40, 36, 9) + dC(46, 20, 9) + dC(44, 48, 9) + dC(-10, 26, 8) + dC(-10, -50, 18) + dC(12, -54, 18), tn.ol('#5DB55A', 3));
  else p += P(dC(-22, -64, 22) + dC(20, -66, 22) + dC(0, -84, 24), tn.ol('#5DB55A', 3)) + P(dC(-12, -76, 7) + dC(14, -86, 6), tn.fl('#8FD67A'));
  p += P('M-26 -40 L26 -40 L20 0 L-20 0 Z', tn.ol(pot, 3.5)) + R(-30, -46, 60, 10, 3, tn.ol(mix(pot, '#000000', 0.15), 3));
  return G(p, tr(x, y, s));
}

// ================================================================= 1. KITCHEN — the Saturday "family meeting" breakfast
// Front view. Butter-yellow walls, teal cabinets + butcher-block counter with the stove, red kettle and toaster at the LEFT,
// the wide window over the breakfast table (backyard: fence, an oak with a bird feeder, the sun), a wall calendar and the
// clock, the cherry-red retro fridge covered in YOUR drawings at the RIGHT, the hall doorway at the far right. Terracotta
// checker floor. CENTRE: the breakfast table with a long cream cloth (layers.front hides the seated legs) and four seats —
// Dad + Mom behind the table facing camera, YOU at the left end and Granny at the right end (both turned inward).
// Draw the seated family between layers.mid and layers.front (H.seatPose(SPOTS.kitchen.seats.dad, size)).
// Stand line in front of the table: y 990 (FLOOR.kitchen, s .5); beside the table (the "head", the flip chart): y 880, s .45.
// opts: { time 'morning'|'day' (default morning: low warm sun + beam + dust motes), meeting (bunting FAMILY MEETING over the
//   window + Dad's flip chart: TIME SPENT pie chart, 90% "THE NINTENDO"), next (SC12 next Saturday: YOUR crayon FAMILY GAME
//   NIGHT flip chart, YOUR chair pushed back = you stand at SPOTS.kitchen.head), chart 'meeting'|'next'|false (override),
//   paper (Dad's newspaper folded on the table, default true; false when he holds it: H.newspaper(..., {open: true})),
//   tablet (YOUR tablet propped on the table, default true), steam (default true), birds (default true), bowls (default true) }
const KT = {
  ceil: 40, base: 700,
  win: { x0: 700, y0: 150, x1: 1220, y1: 362 },
  table: { x0: 455, x1: 1465, back: 668, top: 712, hem: 912, feet: 934 },
  counter: { x1: 404, top: 520 },
  fridge: { x0: 1560, x1: 1830, top: 120 },
  hall: { x0: 1890, x1: 2140, top: 170 },
  lamp: { x: 960, y: 128 },
  clock: { x: 1385, y: 175, r: 46 },
  cal: { x: 540, y: 200 },
};
const KSEAT = {
  you: { x: 560, hip: 718, s: 0.45, turn: 0.35 },
  dad: { x: 800, hip: 714, s: 0.45 },
  mom: { x: 1120, hip: 714, s: 0.45 },
  grandma: { x: 1360, hip: 718, s: 0.45, turn: -0.35 },
};
function kitchenFloor(tn, y0, c1, c2) {
  const vx = 960, vy = -260, step = 120;
  const rows = [];
  for (let i = 0; i < 18; i++) { const y = y0 + 28 * i + 3.4 * i * i; rows.push(y); if (y > YB) break; }
  const xAt = (x, y) => vx + (x - vx) * (y - vy) / (y0 - vy);
  let d = '';
  for (let i = 0; i < rows.length - 1; i++) {
    for (let j = Math.floor(XL / step) - 6; j * step < XR + 6 * step; j++) {
      if ((i + j) % 2 === 0) continue;
      const xa = j * step, xb = xa + step, ya = rows[i], yb = rows[i + 1];
      d += dP([[xAt(xa, ya), ya], [xAt(xb, ya), ya], [xAt(xb, yb), yb], [xAt(xa, yb), yb]]);
    }
  }
  return R(XL, y0, XR - XL, YB - y0, 0, tn.fl(c1)) + P(d, tn.fl(c2));
}
function kitchenLayers(t, o = {}) {
  const time = o.time || 'morning', morn = time !== 'day';
  const next = !!o.next, meeting = !!o.meeting || next;
  const chartMode = o.chart !== undefined ? o.chart : next ? 'next' : o.meeting ? 'meeting' : false;
  const tn = tone({ morn: morn ? 0.55 : 0 });
  const C = tn.c, O = tn.ol, LN = tn.ln, FL = tn.fl;
  const W = KT.win, TB = KT.table, F = KT.fridge;
  // ---------------- bg: the backyard through the window
  const bx0 = W.x0 - 40, bx1 = W.x1 + 40, by0 = W.y0 - 40, by1 = W.y1 + 40;
  let bg = R(bx0, by0, bx1 - bx0, by1 - by0, 0, { fill: `url(#${morn ? 'hsSkyMorning' : 'hsSkyDay'})` });
  const sunP = morn ? [800, 200] : [1120, 150];
  bg += glow(sunP[0], sunP[1], 150, 'hsGlowWarm', 0.9) + CI(sunP[0], sunP[1], 34, { fill: morn ? '#FFE9A8' : '#FFF0A0', stroke: '#FFC24A', 'stroke-width': 6 });
  bg += hsCloud(1080, 200, 0.5, tn, '#FFFFFF', morn ? '#FFE2CC' : '#DCEBFA');
  // neighbour's roof + shed beyond the fence
  bg += P('M960 340 L960 270 L1060 222 L1160 270 L1160 340 Z', O('#E8D2F2', 4)) + P('M946 276 L1060 216 L1174 276', LN(13, '#8A6AB8')) + R(1040, 280, 40, 36, 3, O('#CDEEFF', 3));
  bg += R(W.x0 - 40, 360, W.x1 - W.x0 + 80, 80, 0, FL('#7CCB64')) + (R(W.x0 - 40, 360, W.x1 - W.x0 + 80, 80, 0, { fill: 'url(#hsLawn)' }));
  let fence = '';
  for (let x = W.x0 - 40; x < W.x1 + 40; x += 30) fence += dP([[x, 372], [x, 318], [x + 13, 308], [x + 26, 318], [x + 26, 372]]);
  bg += P(fence, O('#E8B47A', 3)) + P(`M${W.x0 - 40} 332 H${W.x1 + 40} M${W.x0 - 40} 358 H${W.x1 + 40}`, LN(4, '#B97A44'));
  // the oak with the bird feeder + birds (perched on the fence, at the feeder, one flying)
  bg += oakTree(770, 410, 0.62, tn, { sway: Math.sin(t * 0.8) * 1.2, feeder: true });
  if (o.birds !== false) {
    const hop = Math.max(0, Math.sin(t * 3.1)) * -5;
    bg += hsBird(1110, 312 + hop, 0.7, tn, { col: '#5A8FE0', belly: '#DDEBFF' }) + hsBird(1150, 312, 0.7, tn, { flip: true });
    bg += hsBird(808, 290 + Math.max(0, Math.sin(t * 2.3 + 1)) * -4, 0.6, tn, { flip: true });
    const u = md(t * 0.08, 1);
    bg += hsBird(lerp(W.x0 - 60, W.x1 + 60, u), 190 + Math.sin(u * 12) * 16, 0.55, tn, { flying: true, flap: md(t * 4.5, 1) });
  }
  // ---------------- mid: the room
  let m = '';
  const wallD = `M${XL} ${YT} H${XR} V${KT.base} H${XL} Z M${W.x0} ${W.y0} V${W.y1} H${W.x1} V${W.y0} Z`;
  m += P(wallD, { fill: C('#F9E3AE'), 'fill-rule': 'evenodd' });
  m += R(XL, YT, XR - XL, KT.ceil - YT, 0, FL('#FFF3D8')) + band(KT.ceil - 4, KT.ceil + 16, O('#FFFFFF', 4)) + band(KT.ceil + 16, KT.ceil + 26, FL('#EFD39A'));
  // ---- left: counter run (upper cabinets, subway backsplash, teal lowers, stove, kettle, toaster)
  {
    const cx1 = KT.counter.x1, ct = KT.counter.top;
    let k = R(XL, 300, cx1 - XL, ct - 300, 0, FL('#F7F3EA')) + R(XL, 300, cx1 - XL, ct - 300, 0, { fill: 'url(#hsSubway)' });
    // upper cabinets (cream doors with teal frames) + under-cabinet utensil rail
    k += R(XL, 92, cx1 + 10 - XL, 210, 4, O('#3E9C97', 5));
    let ud = '';
    for (let x = -880; x < cx1 - 20; x += 142) ud += dRR(x, 106, 126, 182, 8);
    k += P(ud, { fill: C('#FFF4DE'), stroke: C('#2E7F7B'), 'stroke-width': 4 }) + P(Array.from({ length: 9 }, (_, i) => dC(-880 + i * 142 + (i % 2 ? 16 : 110), 270, 5)).join(''), O('#E8B84A', 2.5));
    k += R(XL, 300, cx1 + 10 - XL, 10, 0, FL('#2E7F7B'));
    k += P(`M-60 340 H300`, LN(6, '#B9BFC8')) + G(P('M0 0 V40 Q0 56 -14 56', LN(5, '#9AA4B4')) + P('M40 0 V44', LN(5, '#9AA4B4')) + E(40, 52, 10, 12, O('#E8B84A', 3)) + P('M80 0 V36', LN(5, '#9AA4B4')) + P('M70 36 h20 v18 h-20 Z', O('#9AA4B4', 3)), 'translate(-10 340)');
    // stove (white enamel, oven window) + red kettle with steam
    k += R(40, ct - 6, 270, 700 - ct + 6, 6, O('#FFFDF6', 5)) + R(64, ct + 50, 222, 112, 10, O('#3A3F52', 4)) + R(80, ct + 62, 90, 14, 4, { fill: '#FFFFFF', opacity: 0.18 });
    k += R(70, ct + 22, 210, 10, 4, O('#D8DDE4', 3)) + P(dC(90, ct + 12, 7) + dC(130, ct + 12, 7) + dC(220, ct + 12, 7) + dC(260, ct + 12, 7), O('#3A3F52', 2.5));
    k += G(P('M-44 0 Q-50 -56 0 -60 Q50 -56 44 0 Z', O('#E04848', 4)) + E(0, -60, 20, 7, O('#C03838', 3)) + CI(0, -70, 7, O('#3A3F52', 2.5)) + P('M40 -30 Q66 -40 70 -60', LN(9)) + P('M40 -30 Q66 -40 70 -60', LN(5, '#E04848')) + P('M-30 -50 Q0 -96 30 -50', LN(6, '#3A3F52')) + P('M-30 -24 Q-24 -12 -10 -8', LN(4, '#FFFFFF', 0.5)), `translate(130 ${ct - 4})`);
    if (o.steam !== false) {
      let sd = '';
      for (let i = 0; i < 3; i++) { const u = md(t * 0.4 + i / 3, 1); sd += `M${f(202 + Math.sin(t * 2 + i) * 8 + u * 30)} ${f(ct - 70 - u * 120)} q-12 -14 0 -28 q12 -14 0 -28 `; }
      k += P(sd, { fill: 'none', stroke: '#FFFFFF', 'stroke-width': 8, 'stroke-linecap': 'round', opacity: 0.5 });
    }
    // counter top + teal lower cabinets
    k += R(XL, ct, cx1 + 14 - XL, 20, 5, O('#D99A5B', 4)) + R(XL, ct + 4, cx1 + 14 - XL, 5, 2, FL('#F0BE85'));
    k += R(XL, ct + 20, 40 - XL, KT.base - ct - 20, 0, O('#3E9C97', 5)) + R(310, ct + 20, cx1 - 310, KT.base - ct - 20, 0, O('#3E9C97', 5));
    let ld = '';
    for (let x = -880; x < 20; x += 152) ld += dRR(x, ct + 38, 136, 134, 8);
    ld += dRR(322, ct + 38, cx1 - 334, 134, 8);
    k += P(ld, { fill: C('#4FAFA9'), stroke: C('#2E7F7B'), 'stroke-width': 4 }) + P(Array.from({ length: 6 }, (_, i) => dC(-880 + i * 152 + 68, ct + 58, 5)).join('') + dC(360, ct + 58, 5), O('#E8B84A', 2.5));
    // toaster with toast + fruit bowl + coffee maker (left of the stove)
    k += G(R(-50, -60, 100, 60, 18, O('#D8DDE4', 4)) + R(-34, -72, 26, 14, 4, O('#F2C27A', 3)) + R(8, -76, 26, 18, 4, O('#E8A860', 3)) + R(-50, -26, 100, 6, 0, FL('#B9BFC8')) + R(46, -30, 12, 14, 3, O('#3A3F52', 2.5)), `translate(360 ${ct})`);
    k += G(R(-34, -88, 68, 88, 8, O('#3A3F52', 4)) + R(-26, -50, 52, 46, 6, O('#CDEEFF', 3)) + R(-20, -30, 40, 24, 4, FL('#6A3E22')) + R(-30, -88, 60, 16, 6, FL('#2A2D38')) + CI(18, -66, 4, FL('!#3DFF9A')), `translate(-60 ${ct})`);
    k += G(P('M-46 -30 Q-46 0 0 0 Q46 0 46 -30 Z', O('#F2B84B', 4)) + CI(-20, -38, 16, O('#FF8A3A', 3)) + CI(10, -42, 16, O('#E04848', 3)) + CI(30, -34, 13, O('#9ACD4A', 3)) + P('M10 -58 l4 -10', LN(3, '#6A3E22')), `translate(-230 ${ct})`);
    m += k;
  }
  // ---- the window: frame, café curtains (gingham), valance, sill + herb pots
  {
    let w = P(`M${W.x0 - 22} ${W.y0 - 22} H${W.x1 + 22} V${W.y1 + 6} H${W.x0 - 22} Z M${W.x0} ${W.y0} V${W.y1} H${W.x1} V${W.y0} Z`, { fill: C('#FFFFFF'), 'fill-rule': 'evenodd', stroke: tn.line, 'stroke-width': 6 });
    const wc = (W.x0 + W.x1) / 2;
    w += R(wc - 7, W.y0, 14, W.y1 - W.y0, 3, O('#FFFFFF', 4)) + R(W.x0, 246, W.x1 - W.x0, 12, 3, O('#FFFFFF', 3.5));
    w += P(`M${W.x0 + 24} ${W.y0 + 120} L${W.x0 + 90} ${W.y0 + 10} L${W.x0 + 114} ${W.y0 + 10} L${W.x0 + 48} ${W.y0 + 120} Z M${wc + 40} ${W.y1 - 16} L${wc + 96} ${W.y1 - 110} L${wc + 112} ${W.y1 - 110} L${wc + 56} ${W.y1 - 16} Z`, { fill: '#FFFFFF', opacity: 0.26 });
    // café panels tied back + scalloped valance (red gingham)
    const sway = Math.sin(t * 1.1) * 3;
    for (const [x, d] of [[W.x0 + 6, 1], [W.x1 - 6, -1]]) {
      const cp = `M${x} 250 L${x + d * 120} 250 Q${f(x + d * 70 + sway)} 320 ${f(x + d * 26 + sway)} ${W.y1 - 2} L${x} ${W.y1 - 2} Z`;
      w += P(cp, O('#E85A5A', 4)) + P(cp, { fill: 'url(#hsGingham)' }) + R(x + d * 18 - 14 + sway * 0.6, 322, 28, 12, 6, O('#FFF6E4', 3));
    }
    w += P(`M${W.x0 - 20} 254 H${W.x1 + 20}`, LN(5, '#C98A52'));
    let val = `M${W.x0 - 34} ${W.y0 - 34} H${W.x1 + 34} V${W.y0 + 22}`;
    for (let x = W.x1 + 34; x > W.x0 - 34; x -= 48) val += ` Q${x - 24} ${W.y0 + 52} ${x - 48} ${W.y0 + 22}`;
    w += P(val + ' Z', O('#E85A5A', 5)) + P(val + ' Z', { fill: 'url(#hsGingham)' }) + R(W.x0 - 42, W.y0 - 44, W.x1 - W.x0 + 84, 14, 7, O('#C98A52', 4));
    w += R(W.x0 - 34, W.y1 + 2, W.x1 - W.x0 + 68, 22, 6, O('#FFFFFF', 5));
    w += plant(W.x0 + 40, W.y1 + 4, 0.55, tn, 'round', '#E8764A') + plant(W.x1 - 48, W.y1 + 4, 0.5, tn, 'tall', '#3E9C97');
    w += G(P('M-14 0 L-12 -30 L12 -30 L14 0 Z', O('#F2B84B', 3)) + P('M0 -30 Q-2 -56 0 -66 M0 -30 Q10 -50 14 -58', LN(3.5, '#3E8A4A')) + CI(0, -68, 7, O('#FFFFFF', 2.5)) + CI(14, -60, 6, O('#FFFFFF', 2.5)) + CI(0, -68, 2.5, FL('#FFD23F')) + CI(14, -60, 2.2, FL('#FFD23F')), `translate(${wc + 150} ${W.y1 + 4})`);
    m += w;
  }
  // wall calendar (SAT circled) + clock + pendant lamp
  {
    const c = KT.cal;
    let cl = R(c.x - 52, c.y - 76, 104, 152, 3, O('#FFFFFF', 4)) + R(c.x - 52, c.y - 76, 104, 62, 3, O('#7FC8E8', 4)) + P(`M${c.x - 40} ${c.y - 22} l22 -30 l14 16 l12 -22 l22 36 Z`, FL('#5DB55A')) + CI(c.x + 30, c.y - 56, 8, FL('#FFD23F'));
    let gd = '';
    for (let i = 0; i < 4; i++) gd += `M${c.x - 46} ${c.y - 2 + i * 18} H${c.x + 46} `;
    for (let j = 1; j < 7; j++) gd += `M${f(c.x - 46 + j * 13.2)} ${c.y - 8} V${c.y + 66} `;
    cl += P(gd, LN(1.5, '#C9CED8')) + P(dC(c.x + 33, c.y + 34, 9), { fill: 'none', stroke: C('#E04848'), 'stroke-width': 3 }) + CI(c.x, c.y - 84, 5, O('#E04848', 2));
    if (meeting) cl += TF('GAME', c.x + 4, c.y + 62, 11, C('#E04848'));
    m += cl;
  }
  m += wallClock(KT.clock.x, KT.clock.y, KT.clock.r, o.clock ?? (morn ? '8:10' : '11:20'), tn, { rim: '#E04848' });
  if (o.pendant) m += P(`M${KT.lamp.x} ${KT.ceil + 20} V${KT.lamp.y - 50}`, LN(4)) + P(`M${KT.lamp.x - 64} ${KT.lamp.y} Q${KT.lamp.x - 60} ${KT.lamp.y - 56} ${KT.lamp.x} ${KT.lamp.y - 58} Q${KT.lamp.x + 60} ${KT.lamp.y - 56} ${KT.lamp.x + 64} ${KT.lamp.y} Z`, O('#3E9C97', 5)) + E(KT.lamp.x, KT.lamp.y, 64, 8, O('#F2E6C0', 3.5)) + P(`M${KT.lamp.x - 40} ${KT.lamp.y - 40} Q${KT.lamp.x - 20} ${KT.lamp.y - 50} ${KT.lamp.x} ${KT.lamp.y - 50}`, LN(4, '#FFFFFF', 0.4));
  if (meeting) m += bunting(W.x0 - 70, 74, 'FAMILY MEETING', tn, 46, 14);
  // ---- right: the cherry-red retro fridge with YOUR drawings + the cookie jar on top
  {
    let fz = R(F.x0 + 8, F.top + 10, F.x1 - F.x0, KT.base + 12 - F.top, 40, { fill: '#000', opacity: 0.1 });
    fz += P(`M${F.x0} ${KT.base + 10} L${F.x0} ${F.top + 56} Q${F.x0} ${F.top} ${F.x0 + 60} ${F.top} L${F.x1 - 60} ${F.top} Q${F.x1} ${F.top} ${F.x1} ${F.top + 56} L${F.x1} ${KT.base + 10} Z`, O('#E25050', 6));
    fz += P(`M${F.x1 - 30} ${F.top + 40} V${KT.base - 20}`, LN(10, '#C03C3C', 0.6)) + P(`M${F.x0 + 22} ${F.top + 30} Q${F.x0 + 22} ${F.top + 16} ${F.x0 + 40} ${F.top + 14}`, LN(8, '#FF9A9A', 0.7));
    fz += P(`M${F.x0} 300 H${F.x1}`, LN(5)) + R(F.x0 + 18, 200, 16, 76, 8, O('#E6EBF0', 3.5)) + R(F.x0 + 18, 330, 16, 150, 8, O('#E6EBF0', 3.5));
    fz += R(F.x0 + 20, KT.base - 22, F.x1 - F.x0 - 40, 18, 6, O('#E6EBF0', 3));
    // drawings + magnets
    const pg = (x, y, w, h, r, inner, mag) => G(R(-w / 2, -h / 2, w, h, 2, O('#FFFFFF', 3)) + inner + CI(0, -h / 2 + 2, 7, O(mag, 2.5)), tr(x, y, 1, r));
    fz += pg(1700, 400, 104, 92, -4, P('M-30 30 V0 H-22 V-8 H-14 V0 H-6 V-16 H6 V0 H14 V-8 H22 V0 H30 V30 Z', { fill: 'none', stroke: C('#8A5CFF'), 'stroke-width': 3 }) + P('M0 -16 V-30 l12 5 l-12 5', LN(2.5, '#E04848')) + TF('MY CASTLE', 0, 42, 10, C('#3E8FE0')), '#FFD23F');
    fz += pg(1640, 520, 110, 96, 5, R(-14, -18, 28, 24, 5, O('#FFFFFF', 2)) + P('M-12 -26 h24 l-4 -10 l-8 8 l-4 -10 l-4 10 l-8 -8 Z', O('#FFC23A', 2)) + R(-12, 6, 24, 22, 3, FL('#D8262E')) + CI(-5, -8, 2, FL(LINE)) + CI(5, -8, 2, FL(LINE)) + TF('ME', -34, -20, 12, C('#E04848')) + TF('LVL 99', 30, 34, 11, C('#3DA84A')), '#7FC8E8');
    fz += pg(1745, 560, 92, 100, -3, P('M-34 26 V-4 M-14 26 V-8 M6 26 V-2 M24 26 V-6', LN(3, '#2E5FB8')) + P(dC(-34, -14, 9) + dC(-14, -18, 10) + dC(6, -12, 8) + dC(24, -16, 9), { fill: 'none', stroke: C('#E04848'), 'stroke-width': 2.5 }) + TF('MY FAMILY', 0, 40, 10, C('#E86A8A')), '#5DB55A');
    fz += pg(1660, 650, 84, 64, 3, TF('A+', -18, 8, 22, C('#E04848')) + P('M4 -12 H34 M4 -2 H34 M4 8 H28 M4 18 H34', LN(2, '#9AA4B4')), '#FF8A3A');
    fz += G(R(-40, -50, 80, 100, 3, O('#FFF6E4', 3)) + TF('CHORES', 0, -32, 12, C('#3E9C97')) + P('M-30 -18 H30 M-30 0 H30 M-30 18 H30', LN(1.5, '#C9CED8')) + T('★', -22, -6, 12, C('#FFC23A')) + T('★', -6, -6, 12, C('#FFC23A')) + T('★', -22, 12, 12, C('#FFC23A')) + CI(0, -52, 6, O('#E86A8A', 2.5)), 'translate(1640 210) rotate(2)');
    // cookie jar + bread box on top
    fz += G(P('M-34 0 Q-40 -50 -26 -62 L26 -62 Q40 -50 34 0 Z', O('#FFF4E0', 4)) + R(-28, -74, 56, 14, 6, O('#E86A8A', 3)) + CI(0, -80, 8, O('#E86A8A', 3)) + TF('COOKIES', 0, -26, 11, C('#B9764A')), `translate(1650 ${F.top})`);
    fz += G(R(-50, -46, 100, 46, 10, O('#3E9C97', 4)) + P('M-40 -30 H40', LN(3, '#2E7F7B')) + TF('BREAD', 0, -12, 13, C('#FFF4DE')), `translate(1762 ${F.top})`);
    m += fz;
  }
  // hall doorway (far right)
  {
    const H = KT.hall;
    m += R(H.x0 - 20, H.top - 20, H.x1 - H.x0 + 40, KT.base - H.top + 20, 4, O('#FFFFFF', 5)) + R(H.x0, H.top, H.x1 - H.x0, KT.base - H.top, 0, FL('#E6C890'));
    m += R(H.x0, H.top, H.x1 - H.x0, 60, 0, { fill: '#000', opacity: 0.08 }) + R(H.x0 + 60, 300, 90, 120, 3, O('#9A6238', 3)) + R(H.x0 + 70, 310, 70, 100, 2, FL('#BFE0F2'));
  }
  // floor (terracotta checker in perspective) + skirting
  m += kitchenFloor(tn, KT.base, '#F7DDBA', '#F0C7A2');
  m += band(KT.base - 14, KT.base + 2, O('#FFFFFF', 3.5)) + band(KT.base + 2, KT.base + 12, { fill: '#000', opacity: 0.07 });
  // chairs: two back chairs (Dad, Mom) + the end chairs (side view, back on the outer side)
  {
    let c = '';
    const back = (x) => P(`M${x - 82} ${TB.back + 10} L${x - 78} 600 Q${x - 74} 556 ${x} 554 Q${x + 74} 556 ${x + 78} 600 L${x + 82} ${TB.back + 10} Z`, O('#9A5E36', 5)) + P(`M${x - 56} 600 Q${x} 576 ${x + 56} 600 L${x + 56} 640 L${x - 56} 640 Z`, FL('#B87648'));
    c += back(KSEAT.dad.x) + back(KSEAT.mom.x);
    if (!next) c += P(`M461 ${TB.back + 20} L463 560 Q463 540 481 540 Q499 540 499 560 L501 ${TB.back + 20} Z`, O('#9A5E36', 5)) + R(467, 600, 30, 8, 3, FL('#B87648'));
    else c += G(P('M-20 0 L-18 -170 Q-18 -190 0 -190 Q18 -190 18 -170 L20 0 Z', O('#9A5E36', 5)) + R(-70, -10, 150, 22, 6, O('#B87648', 4)) + P('M-60 12 L-64 120 M70 12 L74 120', LN(10)) + P('M-60 12 L-64 120 M70 12 L74 120', LN(5, '#9A5E36')), 'translate(262 770) rotate(-8)');
    c += P(`M1419 ${TB.back + 20} L1421 560 Q1421 540 1439 540 Q1457 540 1457 560 L1459 ${TB.back + 20} Z`, O('#9A5E36', 5)) + P('M1423 596 h34 v40 h-34 Z', O('#E86A8A', 3)) + P('M1423 596 h34 v40 h-34 Z', { fill: 'url(#hsKnit)' });
    m += c;
  }
  // flip chart (meeting / next)
  if (chartMode) m += flipChart(next ? 180 : 220, 884, 0.86, tn, chartMode);
  // Granny's knitting basket beside her chair
  m += knitBasket(1540, 930, 0.9, tn);
  // ---------------- front: the table with the long cloth + breakfast
  let fr = '';
  {
    fr += E((TB.x0 + TB.x1) / 2, TB.feet + 4, (TB.x1 - TB.x0) / 2 + 40, 16, { fill: '#000', opacity: 0.12 });
    fr += R(TB.x0 + 34, TB.hem - 20, 26, TB.feet - TB.hem + 20, 5, O('#9A5E36', 4)) + R(TB.x1 - 60, TB.hem - 20, 26, TB.feet - TB.hem + 20, 5, O('#9A5E36', 4));
    // cloth: top surface + the front drop with a scalloped hem, a red folk band + little flowers
    let cl = `M${TB.x0 - 14} ${TB.top} H${TB.x1 + 14} L${TB.x1 + 22} ${TB.hem - 14}`;
    for (let x = TB.x1 + 22; x > TB.x0 - 22; x -= 52) cl += ` Q${x - 26} ${TB.hem + 12} ${f(Math.max(TB.x0 - 22, x - 52))} ${TB.hem - 14}`;
    cl += ' Z';
    fr += P(`M${TB.x0 - 4} ${TB.back} H${TB.x1 + 4} L${TB.x1 + 14} ${TB.top} H${TB.x0 - 14} Z`, O('#FFF8EA', 5));
    fr += P(cl, O('#FFF3DE', 5));
    fr += R(TB.x0 - 18, TB.hem - 66, TB.x1 - TB.x0 + 36, 24, 0, FL('#E25050')) + P(`M${TB.x0 - 18} ${TB.hem - 54} H${TB.x1 + 18}`, { fill: 'none', stroke: C('#FFF3DE'), 'stroke-width': 5, 'stroke-dasharray': '10 12' });
    let fd = '', fc = '';
    for (let x = TB.x0 + 40; x < TB.x1; x += 120) for (const [cx, cy] of [[x, TB.top + 62], [x + 60, TB.top + 122]]) { for (let k = 0; k < 5; k++) { const a = k / 5 * Math.PI * 2; fd += dC(cx + Math.cos(a) * 6, cy + Math.sin(a) * 6, 4.5); } fc += dC(cx, cy, 3.2); }
    fr += P(fd, FL('#7FC8E8')) + P(fc, FL('#F2B84B'));
    fr += R(TB.x0 - 14, TB.top - 6, TB.x1 - TB.x0 + 28, 12, 6, O('#FFF8EA', 4));
    // breakfast: bowls at every seat, cereal box, milk, newspaper, coffee, OJ, toast, vase, cookies, teapot
    const ty = TB.top - 4;
    if (o.bowls !== false) {
      fr += bowl(KSEAT.you.x + 40, ty, 0.95, tn, { col: '#5FA8E0', spoon: true });
      fr += bowl(KSEAT.dad.x - 10, ty - 6, 0.9, tn, { col: '#B9764A' }) + bowl(KSEAT.mom.x + 6, ty - 6, 0.9, tn, { col: '#E86A8A' }) + bowl(KSEAT.grandma.x - 40, ty, 0.95, tn, { col: '#7FC8B8' });
    }
    if (o.tablet !== false && !next) fr += G(R(-44, -60, 88, 60, 8, O('#2A2D38', 4)) + R(-38, -54, 76, 48, 4, FL('#3A4058')) + P('M-10 0 L-22 16 M10 0 L22 16', LN(5, '#9AA4B4')), `translate(${KSEAT.you.x + 100} ${ty - 12}) rotate(-4)`);
    fr += cerealBox(680, ty - 6, 0.82, tn) + G(R(-18, -60, 36, 60, 4, O('#FFFFFF', 3.5)) + P('M-18 -60 L0 -78 L18 -60 Z', O('#7FC8E8', 3.5)) + TF('MILK', 0, -26, 11, C('#2E5FB8')), `translate(${f(712)} ${ty - 10})`);
    if (o.paper !== false) fr += newspaper(KSEAT.dad.x + 10, ty + 2, 0.9, 0, tn);
    fr += mug(KSEAT.dad.x + 98, ty + 2, 0.72, tn, { col: '#3E9C97', handle: 'R', steam: o.steam === false ? false : t });
    fr += G(P('M-16 0 L-20 -44 Q-20 -58 0 -60 Q20 -58 20 -44 L16 0 Z', O('#7FC8E8', 4)) + P('M0 -60 Q-6 -92 -20 -112 M0 -60 Q4 -96 14 -118 M0 -60 Q10 -86 30 -96', LN(4, '#3E8A4A')) + P(dC(-20, -116, 10) + dC(14, -122, 10) + dC(30, -100, 9), O('#FFFFFF', 2.5)) + P(dC(-20, -116, 3.5) + dC(14, -122, 3.5) + dC(30, -100, 3), FL('#FFD23F')), `translate(958 ${ty - 12})`);
    fr += G(E(0, -4, 40, 8, O('#FFFFFF', 3)) + R(-28, -34, 14, 30, 4, O('#F2C27A', 3)) + R(-8, -38, 14, 34, 4, O('#E8A860', 3)) + R(12, -34, 14, 30, 4, O('#F2C27A', 3)), `translate(902 ${ty - 6})`);
    fr += G(P('M-22 0 L-20 -56 Q-18 -68 -8 -70 L8 -70 Q18 -68 20 -56 L22 0 Z', O('#FFFFFF', 4)) + P('M-20 -40 L20 -40 L22 -4 L-22 -4 Z', FL('#FFB13B')) + P('M20 -56 Q34 -52 32 -34', LN(5)), `translate(1022 ${ty - 8})`);
    fr += mug(KSEAT.mom.x + 74, ty + 2, 0.72, tn, { col: '#FFFFFF', label: '#1 MOM', handle: 'R', steam: o.steam === false ? false : t + 0.4 });
    fr += G(P('M-36 0 Q-44 -40 0 -46 Q44 -40 36 0 Z', O('#FFF6E4', 4)) + P('M34 -26 Q54 -34 58 -54', LN(8)) + P('M34 -26 Q54 -34 58 -54', LN(4, '#FFF6E4')) + E(0, -46, 20, 5, O('#E86A8A', 3)) + CI(0, -53, 5.5, O('#E86A8A', 2.5)) + P('M-27 -21 Q0 -12 27 -21', LN(3, '#7FC8B8')), `translate(1262 ${ty - 6})`);
    fr += cookiePlate(KSEAT.grandma.x - 96, ty + 4, 0.8, tn);
    fr += G(E(0, 0, 30, 6, O('#FFFFFF', 3)) + P('M-18 -4 Q-20 -28 0 -28 Q20 -28 18 -4 Z', O('#FFFFFF', 3.5)) + P('M16 -22 q12 0 11 9 q-2 7 -11 5', LN(3.5)) + P('M-11 -18 q11 6 22 0', LN(2.5, '#E86A8A')), `translate(${KSEAT.grandma.x + 44} ${ty + 4})`);
  }
  // ---------------- light
  let light = '';
  if (morn) {
    light += P(dP([[W.x0 + 10, W.y0 + 10], [W.x1 - 10, W.y0 + 10], [W.x1 + 420, 1000], [W.x0 + 160, 1000]]), { fill: 'url(#hsBeam)', opacity: 0.38 });
    let dm = '';
    for (let i = 0; i < 9; i++) { const u = md(t * 0.03 + hash(i * 3.3), 1), x = lerp(W.x0 + 80, W.x1 + 220, hash(i * 7.1)) + Math.sin(t * 0.7 + i) * 18 + u * 120, y = lerp(W.y0 + 60, 820, u); dm += dC(x, y, 2.6 + hash(i) * 1.8); }
    light += P(dm, { fill: '#FFF6D8', opacity: 0.7 }) + cover({ fill: '#FFB060', opacity: 0.05 });
  } else {
    light += P(dP([[W.x0 + 10, W.y0 + 10], [W.x1 - 10, W.y0 + 10], [W.x1 + 160, 1000], [W.x0 - 60, 1000]]), { fill: 'url(#hsBeam)', opacity: 0.2 });
  }
  return { bg, mid: m, front: fr, fg: '', light };
}
const kitchen = makeSet(kitchenLayers);

// ================================================================= 2. LIVING ROOM — GAME NIGHT
// Front view of the back wall (warm beige damask over a pale sage wainscot) with the LEFT side wall receding (corner x 400):
// the big TV hangs on that side wall above a walnut media console (screen content via o.tvScreen, slightly skewed + clipped).
// Back wall, left -> right: YOUR desk with the gaming PC dragged downstairs (monitor facing camera, RGB tower, keyboard) and
// the gaming chair in front of it; the deep-teal COUCH (Dad left, Mom right) under a gallery wall of family photos (wedding,
// baby YOU, Mom's ARCADE QUEEN 1998 photo, Dad's ACCOUNTANT OF THE YEAR certificate, young Granny, the beach, a cross-stitch);
// the mustard floor lamp; Granny's dusty-rose wingback ARMCHAIR with a doily + her knitting basket; the wall clock above her;
// the hall doorway with the bottom stairs at the far right (x 1920+). Oak floor + a rust rug; the COFFEE TABLE in front.
// Layer order:  bg  ·  mid (room, couch back + seat tops, chair back when facing camera)  ·  [seated family: H.seatPose(...)]  ·
//   front (couch / armchair / gaming-chair fronts: they hide the legs)  ·  [devices on laps + anyone between couch and table]  ·
//   table (the coffee table + snacks)  ·  [people standing on FLOOR 1000]  ·  fg  ·  light (darkness, lamp, TV + screen glows)
// opts: { time 'evening'|'night'|'midnight' (default evening: lamp on, dusk; night: screens light the room; midnight: deep blue),
//   glow [{x, y, col, k, r}] screen-light pools on faces (col: 'laptop'|'tablet'|'phone'|'pc'|'tv'|'red'|'warm'|'#hex'), or
//   'all' = the four default device glows (H.deviceGlows()); glowK 0..1 multiplier, tv (default true; false = TV off),
//   tvScreen svg|fn(w,h) (TV content; default: off in the evening, standby blue at night, "STILL PLAYING?" when asleep),
//   tvGlow 0..1 (light thrown by the TV, default 1 when the TV shows something at night), pc (default true: the PC on the
//   desk; false if you draw extras' PC), pcScreen svg|fn(w,h), chair 'back'|'front'|false (gaming chair: 'back' = YOU face
//   the monitor (chair back in front), 'front' = the chair faces camera; default 'back'), lamp 0..1 (floor lamp; default 1 in
//   the evening, 0 at night), mess 0..1 (snacks everywhere after the raid), asleep (SC12: midnight, mess .8, the TV asks
//   "STILL PLAYING?", the pillows slump, clock 0:30), blanket 0..1 (Granny's knitted throw pulled over Dad's spot), tea (Mom's
//   mug on the coffee table), boardGame (the unused board game box on the table), clock 'H:MM', flicker 0..1 (TV light) }
const LR = {
  ceil: 40, base: 700, cx: 400,
  desk: { x0: 440, x1: 760, top: 632, floor: 862 },
  mon: { cx: 598, cy: 378, w: 290, h: 168 },
  couch: { x0: 800, x1: 1540, back: 520, seat: 722, front: 772, base: 836, floor: 900 },
  arm: { x0: 1598, x1: 1902, seat: 790, floor: 978 },
  table: { x0: 880, x1: 1460, back: 862, top: 902, base: 970, floor: 992 },
  lamp: { x: 1578, top: 248 },
  clock: { x: 1772, y: 196, r: 46 },
  hall: { x0: 1928, x1: 2170, top: 200 },
};
const sideCeil = (x) => LR.ceil - 0.17 * (LR.cx - x);
const sideFloor = (x) => LR.base + 0.15 * (LR.cx - x);
const sideAt = (x, h) => sideFloor(x) + (sideCeil(x) - sideFloor(x)) * h;     // a point on the side wall: h 0 floor .. 1 ceiling
const TVQ = { x0: 60, x1: 372, h0: 0.38, h1: 0.71 };
TVQ.pts = [[TVQ.x0, sideAt(TVQ.x0, TVQ.h1)], [TVQ.x1, sideAt(TVQ.x1, TVQ.h1)], [TVQ.x1, sideAt(TVQ.x1, TVQ.h0)], [TVQ.x0, sideAt(TVQ.x0, TVQ.h0)]];
TVQ.inner = [[TVQ.x0 + 14, sideAt(TVQ.x0 + 14, TVQ.h1 - 0.017)], [TVQ.x1 - 12, sideAt(TVQ.x1 - 12, TVQ.h1 - 0.018)], [TVQ.x1 - 12, sideAt(TVQ.x1 - 12, TVQ.h0 + 0.017)], [TVQ.x0 + 14, sideAt(TVQ.x0 + 14, TVQ.h0 + 0.016)]];
TVQ.w = 300; TVQ.h = 210;
{
  const [a, b, c, d] = TVQ.inner;
  TVQ.cx = (a[0] + b[0]) / 2; TVQ.cy = (a[1] + b[1] + c[1] + d[1]) / 4;
  TVQ.mA = (b[0] - a[0]) / TVQ.w; TVQ.mB = ((b[1] + c[1]) / 2 - (a[1] + d[1]) / 2) / (b[0] - a[0]); TVQ.mD = ((d[1] - a[1]) + (c[1] - b[1])) / 2 / TVQ.h;
}
def(`<clipPath id="hsClipLRTV"><path d="${dP(TVQ.inner)}"/></clipPath>`);
def(`<clipPath id="hsClipLRMon"><rect x="${LR.mon.cx - LR.mon.w / 2}" y="${LR.mon.cy - LR.mon.h / 2}" width="${LR.mon.w}" height="${LR.mon.h}" rx="4"/></clipPath>`);
const LSEAT = {
  you: { x: 598, hip: 772, s: 0.5 },
  dad: { x: 1000, hip: 760, s: 0.5 },
  mom: { x: 1340, hip: 760, s: 0.5 },
  grandma: { x: 1752, hip: 786, s: 0.5, turn: -0.25 },
};
const LFACE = { you: { x: 598, y: 566 }, dad: { x: 1000, y: 548 }, mom: { x: 1340, y: 552 }, grandma: { x: 1745, y: 598 } };
const LDEV = { you: 'pc', dad: 'laptop', mom: 'tablet', grandma: 'phone' };
// default device glows on the four faces (or a subset): H.deviceGlows(['dad', 'mom'], k)
const deviceGlows = (who = ['you', 'dad', 'mom', 'grandma'], k = 1) => who.map((w) => ({ x: LFACE[w].x, y: LFACE[w].y + 18, col: LDEV[w], k, r: w === 'grandma' ? 120 : 140 }));
// the TV's own default pictures
function tvStandby(w, h, t, kind) {
  let s = R(-w / 2, -h / 2, w, h, 0, { fill: '#123A7A' }) + R(-w / 2, -h / 2, w, h * 0.55, 0, { fill: '#1E5AA8', opacity: 0.6 });
  if (kind === 'ask') {
    s += R(-w * 0.36, -h * 0.26, w * 0.72, h * 0.52, 10, { fill: '#F4F8FF', stroke: '#0A1B3A', 'stroke-width': 4 }) + TF('STILL PLAYING?', 0, -h * 0.06, w * 0.075, '#123A7A');
    s += R(-w * 0.26, h * 0.06, w * 0.22, h * 0.13, 6, { fill: '#3DD68C' }) + TF('YES', -w * 0.15, h * 0.16, w * 0.05, '#FFFFFF') + R(w * 0.04, h * 0.06, w * 0.22, h * 0.13, 6, { fill: '#C9D3E6' }) + TF('zzz', w * 0.15, h * 0.16, w * 0.05, '#123A7A');
  } else {
    const u = md(t * 0.12, 1), v = md(t * 0.09 + 0.3, 1);
    const bx = -w / 2 + 30 + (w - 60) * (u < 0.5 ? u * 2 : 2 - u * 2), by = -h / 2 + 24 + (h - 48) * (v < 0.5 ? v * 2 : 2 - v * 2);
    s += R(bx - 26, by - 12, 52, 24, 6, { fill: '#FFFFFF', opacity: 0.75 }) + TF('ZZZ', bx, by + 6, 16, '#123A7A');
  }
  return s;
}
// rust rug with a cream border + mustard diamonds (perspective trapezoid)
function lrRug(tn) {
  const q = [[640, 850], [1700, 850], [1960, 1130], [380, 1130]];
  let r = P(dP(q), tn.ol('#F1E2C2', 5)) + P(dP([[668, 862], [1672, 862], [1918, 1116], [422, 1116]]), { fill: 'none', stroke: tn.c('#3E9C97'), 'stroke-width': 10 }) + P(dP([[690, 872], [1650, 872], [1884, 1104], [456, 1104]]), { fill: 'none', stroke: tn.c('#E8A2AE'), 'stroke-width': 4 });
  let d = '';
  for (let i = 0; i < 9; i++) { const x = 760 + i * 104 + (i - 4) * 6, y = 880; d += dP([[x, y - 10], [x + 18, y], [x, y + 10], [x - 18, y]]); }
  for (let i = 0; i < 10; i++) { const x = 560 + i * 135, y = 1090; d += dP([[x, y - 13], [x + 26, y], [x, y + 13], [x - 26, y]]); }
  r += P(d, tn.fl('#E8A85A'));
  return r;
}
function livingRoomLayers(t, o = {}) {
  const asleep = !!o.asleep;
  const time = o.time || (asleep ? 'midnight' : 'evening');
  const eve = time === 'evening', mid = time === 'midnight', nite = !eve;
  const lampK = b01(o.lamp, eve ? 1 : 0);
  const tn = tone(eve ? { eve: 0.5 } : mid ? { mid: 0.92 } : { night: 0.86 });
  const C = tn.c, O = tn.ol, LN = tn.ln, FL = tn.fl;
  const D = LR.desk, M = LR.mon, CO = LR.couch, AR = LR.arm, TB = LR.table;
  const mess = b01(o.mess, asleep ? 0.8 : 0);
  const tvOn = o.tv !== false && (o.tvScreen !== undefined || nite);
  const flick = 1 - 0.22 * b01(o.flicker, nite ? 0.6 : 0) * (0.5 + 0.5 * Math.sin(t * 17) * Math.sin(t * 5.3));
  const tvGlow = tvOn ? b01(o.tvGlow, 1) * flick : 0;
  const chair = o.chair === undefined ? (asleep ? 'front' : 'back') : o.chair;
  // ---------------- bg: the side-wall window (dusk / night), seen when the camera pans left
  const wx0 = -430, wx1 = -70;
  const wq = [[wx0, sideAt(wx0, 0.82)], [wx1, sideAt(wx1, 0.82)], [wx1, sideAt(wx1, 0.36)], [wx0, sideAt(wx0, 0.36)]];
  let bg = P(dP([[wx0 - 40, wq[0][1] - 60], [wx1 + 40, wq[1][1] - 60], [wx1 + 40, wq[2][1] + 60], [wx0 - 40, wq[3][1] + 60]]), { fill: `url(#${eve ? 'hsSkyEvening' : mid ? 'hsSkyMidnight' : 'hsSkyNight'})` });
  if (nite) bg += P(dP(wq), { fill: 'url(#hsStars)', opacity: 0.8 }) + CI(-250, sideAt(-250, 0.7), 22, O('#FFF3C4', 3));
  bg += P(`M${wx0 - 40} ${f(sideAt(wx0, 0.46))} L${wx0 + 90} ${f(sideAt(wx0 + 90, 0.56))} L${wx0 + 200} ${f(sideAt(wx0 + 200, 0.48))} L${wx1 + 40} ${f(sideAt(wx1 + 40, 0.52))} L${wx1 + 40} ${f(sideAt(wx1, 0.3))} L${wx0 - 40} ${f(sideAt(wx0, 0.3))} Z`, FL(eve ? '#5A4A8A' : '#141C40'));
  // ---------------- mid: the room
  let m = '';
  // back wall (damask beige over a sage wainscot) + ceiling
  m += cover(FL('#E6D5BA')) + R(LR.cx, YT, XR - LR.cx, LR.base - YT, 0, { fill: 'url(#hsDiamond)', opacity: 0.8 });
  m += R(LR.cx, 474, XR - LR.cx, LR.base - 474, 0, FL('#C6DCCF')) + R(LR.cx, 474, XR - LR.cx, 14, 0, O('#FFF6E6', 3.5));
  let wp = '';
  for (let x = LR.cx + 30; x < XR; x += 150) wp += dRR(x, 500, 120, 178, 8);
  m += P(wp, { fill: 'none', stroke: C('#A8C4B6'), 'stroke-width': 4 });
  m += R(XL, YT, XR - XL, LR.ceil - YT, 0, FL('#F6EBD6')) + R(LR.cx, LR.ceil - 4, XR - LR.cx, 18, 0, O('#FFFFFF', 4));
  // side wall (in shade) + its ceiling + skirting + the window
  const sw = dP([[XL, sideCeil(XL)], [LR.cx, LR.ceil], [LR.cx, LR.base], [XL, sideFloor(XL)]]);
  m += P(sw, FL('#D6C3A2')) + P(sw, { fill: 'url(#hsDiamond)', opacity: 0.5 });
  m += P(dP([[XL, sideAt(XL, 0.3)], [LR.cx, sideAt(LR.cx, 0.3)], [LR.cx, LR.base], [XL, sideFloor(XL)]]), FL('#B9CFC2'));
  m += P(`M${XL} ${f(sideAt(XL, 0.3))} L${LR.cx} ${f(sideAt(LR.cx, 0.3))}`, LN(10, '#FFF0DA')) + P(`M${XL} ${f(sideCeil(XL))} L${LR.cx} ${LR.ceil}`, LN(12, '#FFFFFF'));
  m += P(`M${LR.cx} ${LR.ceil} V${LR.base}`, LN(4, '#A88A62', 0.8));
  m += P(dP([[wx0 - 24, wq[0][1] - 26], [wx1 + 24, wq[1][1] - 22], [wx1 + 24, wq[2][1] + 18], [wx0 - 24, wq[3][1] + 20]]) + dP(wq), { fill: C('#FFF8EC'), 'fill-rule': 'evenodd', stroke: tn.line, 'stroke-width': 5 });
  m += P(`M${(wx0 + wx1) / 2} ${f(sideAt((wx0 + wx1) / 2, 0.82))} L${(wx0 + wx1) / 2} ${f(sideAt((wx0 + wx1) / 2, 0.36))}`, LN(10, '#FFF8EC'));
  for (const [cx, w0] of [[wx0 - 60, -60], [wx1 + 40, 70]]) m += P(`M${cx} ${f(sideAt(cx, 0.9))} L${cx + w0} ${f(sideAt(cx + w0, 0.9))} Q${cx + w0 * 0.6} ${f(sideAt(cx, 0.5))} ${cx + w0} ${f(sideFloor(cx + w0) - 30)} L${cx} ${f(sideFloor(cx) - 26)} Z`, O('#C8603A', 4));
  // the TV on the side wall + the media console
  {
    const q = TVQ.pts;
    let tv = P(dP([[q[0][0] + 10, q[0][1] + 14], [q[1][0] + 10, q[1][1] + 12], [q[2][0] + 10, q[2][1] + 12], [q[3][0] + 10, q[3][1] + 14]]), { fill: '#000', opacity: 0.18 });
    tv += P(dP(q), O('#1A1C24', 6)) + P(dP(TVQ.inner), FL(tvOn ? '#05070D' : '#1A2030'));
    if (tvOn) {
      const scr = o.tvScreen !== undefined ? screenOf(o.tvScreen, TVQ.w, TVQ.h) : tvStandby(TVQ.w, TVQ.h, t, asleep ? 'ask' : 'zzz');
      tv += G(G(scr, `matrix(${f(TVQ.mA)} ${f(TVQ.mB * TVQ.mA)} 0 ${f(TVQ.mD)} ${f(TVQ.cx)} ${f(TVQ.cy)})`), null, { 'clip-path': 'url(#hsClipLRTV)' });
    } else tv += P(dP([[TVQ.inner[0][0] + 30, TVQ.inner[0][1] + 2], [TVQ.inner[0][0] + 110, TVQ.inner[0][1] + 6], [TVQ.inner[3][0] + 50, TVQ.inner[3][1] - 4], [TVQ.inner[3][0] + 2, TVQ.inner[3][1] - 2]]), { fill: '#FFFFFF', opacity: 0.07 });
    tv += P(dP(TVQ.inner), { fill: 'url(#hsShine)', opacity: 0.35 }) + P(dP(TVQ.inner), LN(3, '#05060A'));
    tv += CI(q[2][0] - 18, q[2][1] - 8, 3, FL(tvOn ? '!#3DFF9A' : '!#FF5A3A'));
    // console: front face on the wall plane, pushed into the room a little
    const c0 = 40, c1 = 392, ch0 = 0.0, ch1 = 0.2, push = 22;
    const cf = [[c0 + push, sideAt(c0, ch1) + 6], [c1 + push, sideAt(c1, ch1) + 6], [c1 + push, sideFloor(c1) + 8], [c0 + push, sideFloor(c0) + 10]];
    tv += P(dP([[c0, sideAt(c0, ch1)], [c1, sideAt(c1, ch1)], cf[1], cf[0]]), O('#B07A4C', 4));
    tv += P(dP(cf), O('#8A5A36', 5));
    const cmid = (c0 + c1) / 2 + push;
    tv += P(`M${cmid} ${f(sideAt(cmid - push, ch1) + 12)} L${cmid} ${f(sideFloor(cmid - push) + 2)}`, LN(4, '#6A4228')) + CI(cmid - 14, sideAt(cmid - push, 0.1) + 8, 5, O('#E8B84A', 2)) + CI(cmid + 14, sideAt(cmid - push, 0.1) + 8, 5, O('#E8B84A', 2));
    // on the console: game console + a plant + speaker
    const topY = (x) => sideAt(x - push / 2, ch1) + 3;
    tv += G(R(-34, -16, 68, 16, 4, O('#F2F2F2', 3)) + R(-28, -12, 30, 4, 2, FL('#3DA8D8')) + CI(22, -8, 3, FL('!#3DFF9A')), `translate(160 ${f(topY(160))})`);
    tv += plant(340, topY(340) + 2, 0.55, tn, 'trail', '#E8B84A') + G(R(-14, -60, 28, 60, 5, O('#2A2D38', 3)) + CI(0, -40, 8, O('#4A5068', 2)) + CI(0, -16, 6, O('#4A5068', 2)), `translate(78 ${f(topY(78))})`);
    m += tv;
  }
  // shelf above the desk (books, a cactus, YOUR old trophy) + the gallery wall over the couch
  {
    let s = R(450, 214, 300, 14, 4, O('#9A6238', 3.5)) + P('M478 228 l0 16 l14 -16 M722 228 l0 16 l-14 -16', LN(4, '#7A4A2A'));
    const BK = ['#3E9C97', '#E04848', '#F2B84B', '#7FC8E8', '#B07AD8'];
    for (let i = 0; i < 5; i++) s += R(470 + i * 19, 214 - 44 + (i % 2) * 6, 16, 44 - (i % 2) * 6, 2, O(BK[i], 2.5));
    s += G(P('M-14 -40 Q-14 -18 0 -14 Q14 -18 14 -40 Z', O('#FFC23A', 3)) + R(-4, -14, 8, 6, 1, FL('#FFC23A')) + R(-12, -8, 24, 8, 2, O('#7E4A2A', 2.5)), 'translate(640 214)') + plant(704, 214, 0.42, tn, 'round', '#E04848');
    m += s;
    const FR = [['wedding', 948, 252, 150, 116, -2], ['arcade', 1112, 196, 104, 128, 3], ['cert', 1250, 266, 124, 96, -1], ['baby', 1378, 186, 96, 112, 2], ['stitch', 1472, 300, 98, 82, -3], ['beach', 1104, 346, 116, 82, 1], ['granny', 850, 380, 84, 100, 3]];
    for (const [k, x, y, w, h, r] of FR) m += familyFrame(k, x, y, w, h, r, tn);
  }
  m += wallClock(LR.clock.x, LR.clock.y, LR.clock.r, o.clock ?? (asleep ? '0:30' : eve ? '7:05' : '11:00'), tn, { rim: '#8A5A36', face: '#FFF6E4' });
  // hall doorway (bottom steps, warm hall light at night)
  {
    const H = LR.hall;
    m += R(H.x0 - 20, H.top - 20, H.x1 - H.x0 + 40, LR.base - H.top + 20, 4, O('#FFF6E6', 5)) + R(H.x0, H.top, H.x1 - H.x0, LR.base - H.top, 0, FL('#D8B98A'));
    let st = '';
    for (let i = 0; i < 5; i++) st += dR(H.x0 + 40 + i * 44, LR.base - 40 - i * 40, H.x1 - H.x0, 40);
    m += P(st, O('#C98A52', 3.5)) + P(`M${H.x0 + 30} ${LR.base - 10} L${H.x1} ${LR.base - 230}`, LN(8, '#7A4A2A'));
  }
  // floor: oak planks + skirting + rug
  {
    m += R(XL, LR.base - 4, XR - XL, YB - LR.base, 0, FL('#D9A066'));
    let pl = '';
    const vx = 1080, vy = -700;
    for (let x = -900; x <= 2820; x += 96) { const k = (YB - vy) / (LR.base - vy); pl += `M${f(x)} ${LR.base} L${f(vx + (x - vx) * k)} ${YB} `; }
    for (let i = 0; i < 22; i++) { const y = LR.base + 24 + i * i * 2.2 + i * 16, x = -600 + hash(i * 3.1) * 3000; pl += `M${f(x)} ${f(y)} h${f(70 + 60 * hash(i))} `; }
    m += P(pl, LN(3, '#B97A44', 0.7));
    m += P(dP([[XL, sideFloor(XL)], [LR.cx, LR.base], [LR.cx, LR.base + 200], [XL, YB]]), FL('#D9A066'));
    m += P(`M${XL} ${f(sideFloor(XL))} L${LR.cx} ${LR.base} L${XR} ${LR.base}`, LN(12, '#FFF6E6')) + P(`M${XL} ${f(sideFloor(XL))} L${LR.cx} ${LR.base} L${XR} ${LR.base}`, LN(3, tn.line, 0.5));
    m += lrRug(tn);
  }
  // ---- YOUR desk + the gaming PC (monitor faces camera)
  {
    let d = R(D.x0, D.top + 18, 104, D.floor - D.top - 18, 4, O('#F4F1EA', 4.5)) + P(dRR(D.x0 + 10, D.top + 34, 84, 60, 5) + dRR(D.x0 + 10, D.top + 104, 84, 60, 5) + dRR(D.x0 + 10, D.top + 174, 84, 50, 5), { fill: C('#FFFFFF'), stroke: C('#C9C3B4'), 'stroke-width': 3 }) + P(`M${D.x0 + 40} ${D.top + 64} h24 M${D.x0 + 40} ${D.top + 134} h24 M${D.x0 + 40} ${D.top + 199} h24`, LN(4, '#9AA4B4'));
    d += R(D.x1 - 26, D.top + 18, 18, D.floor - D.top - 18, 3, O('#F4F1EA', 4));
    // PC tower under the desk (RGB fan)
    const tw = { x: 640, y: D.floor };
    d += R(tw.x - 44, tw.y - 150, 88, 150, 6, O('#22252E', 4)) + R(tw.x - 34, tw.y - 138, 30, 124, 3, { fill: 'url(#hsRGB)', opacity: nite ? 1 : 0.7 }) + CI(tw.x + 18, tw.y - 104, 16, O('#2E3242', 3)) + CI(tw.x + 18, tw.y - 104, 9, { fill: 'none', stroke: C(nite ? '!#33D6FF' : '#33D6FF'), 'stroke-width': 3 }) + CI(tw.x + 18, tw.y - 54, 16, O('#2E3242', 3)) + CI(tw.x + 18, tw.y - 54, 9, { fill: 'none', stroke: C(nite ? '!#FF4FD8' : '#FF4FD8'), 'stroke-width': 3 });
    d += R(D.x0 - 8, D.top, D.x1 - D.x0 + 16, 22, 5, O('#FFFFFF', 4.5)) + R(D.x0 + 110, D.top + 20, D.x1 - D.x0 - 140, 6, 2, { fill: 'url(#hsRGB)', opacity: nite ? 0.95 : 0.6 });
    if (o.pc !== false) {
      const x0 = M.cx - M.w / 2, y0 = M.cy - M.h / 2;
      const pcOn = o.pcScreen !== undefined && o.pcScreen !== null && o.pcScreen !== false;
      if (nite) d += R(x0 - 30, y0 - 26, M.w + 60, M.h + 56, 34, { fill: 'url(#hsRGB)', opacity: 0.3 });
      d += R(M.cx - 14, y0 + M.h + 8, 28, D.top - y0 - M.h - 8, 3, O('#2A2D38', 3.5)) + E(M.cx, D.top - 1, 60, 7, O('#2A2D38', 3.5));
      d += R(x0 - 12, y0 - 12, M.w + 24, M.h + 30, 10, O('#1E2029', 5)) + CI(x0 + M.w - 6, y0 + M.h + 9, 3, FL(pcOn ? '!#3DFF9A' : '!#FF8A2A'));
      let scr = R(x0, y0, M.w, M.h, 4, FL(pcOn ? '#05060A' : '#161A26'));
      if (pcOn) scr += G(G(screenOf(o.pcScreen, M.w, M.h), tr(M.cx, M.cy)), null, { 'clip-path': 'url(#hsClipLRMon)' });
      else scr += P(`M${x0 + 26} ${y0} L${x0 + 100} ${y0} L${x0 + 34} ${y0 + M.h} L${x0} ${y0 + M.h} L${x0} ${y0 + 50} Z`, { fill: '#FFFFFF', opacity: 0.06 });
      d += scr + R(x0, y0, M.w, M.h, 4, { fill: 'url(#hsShine)', opacity: 0.5 }) + R(x0, y0, M.w, M.h, 4, LN(3, '#0A0B10'));
      d += G(R(-20, -18, 40, 36, 2, O('#FFE45C', 2.5)) + TF('LVL', 0, -2, 10, C('#3A2A55')) + TF('99', 0, 12, 12, C('#E04848')), `translate(${x0 + 6} ${y0 - 4}) rotate(-8)`);
      // keyboard + mouse + headset stand + soda
      const kb = dP([[528, D.top - 12], [668, D.top - 12], [676, D.top + 2], [520, D.top + 2]]);
      d += P(kb, { fill: 'url(#hsRGB)', stroke: tn.line, 'stroke-width': 3.5, 'stroke-linejoin': 'round' }) + P(`M528 ${D.top - 6} H668`, LN(3, '#1E2029', 0.7));
      d += E(704, D.top - 4, 12, 7, O('#2A2D38', 3)) + E(704, D.top - 7, 4, 2.5, FL('!#33D6FF'));
      d += G(P('M-24 0 L-24 -38 Q-24 -60 0 -60 Q24 -60 24 -38 L24 0', LN(9)) + P('M-24 0 L-24 -38 Q-24 -60 0 -60 Q24 -60 24 -38 L24 0', LN(5, '#E04848')) + R(-32, -20, 16, 30, 6, O('#2A2D38', 3)) + R(16, -20, 16, 30, 6, O('#2A2D38', 3)), `translate(486 ${D.top - 4})`);
    }
    m += d;
  }
  // gaming chair, facing camera (empty or YOU facing camera): back in mid, seat front in front
  const chairX = LSEAT.you.x, seatY = 762;
  const chairBack = (front) => {
    const hTop = front ? 234 : 156;
    let c = P(`M${chairX - 92} ${seatY + 6} L${chairX - 86} ${seatY - hTop + 44} Q${chairX - 80} ${seatY - hTop + 2} ${chairX} ${seatY - hTop} Q${chairX + 80} ${seatY - hTop + 2} ${chairX + 86} ${seatY - hTop + 44} L${chairX + 92} ${seatY + 6} Z`, O('#2A2D38', 5));
    c += P(`M${chairX - 34} ${seatY - hTop + 8} V${seatY} M${chairX + 34} ${seatY - hTop + 8} V${seatY}`, LN(12, '#F2B84B')) + (front ? R(chairX - 44, seatY - 214, 88, 30, 12, O('#3A3F52', 3.5)) : P(`M${chairX - 60} ${seatY - 40} H${chairX + 60}`, LN(4, '#3A3F52')));
    return c;
  };
  const chairBase = () => P(`M${chairX} ${seatY + 26} V${seatY + 74}`, LN(15)) + P(`M${chairX} ${seatY + 26} V${seatY + 74}`, LN(8, '#7A8094')) + P(`M${chairX - 66} ${seatY + 96} L${chairX} ${seatY + 74} L${chairX + 66} ${seatY + 96} M${chairX - 30} ${seatY + 104} L${chairX} ${seatY + 74} L${chairX + 30} ${seatY + 104}`, LN(12)) + P(`M${chairX - 66} ${seatY + 96} L${chairX} ${seatY + 74} L${chairX + 66} ${seatY + 96} M${chairX - 30} ${seatY + 104} L${chairX} ${seatY + 74} L${chairX + 30} ${seatY + 104}`, LN(5, '#3A3F52')) + P(dC(chairX - 68, seatY + 102, 8) + dC(chairX + 68, seatY + 102, 8) + dC(chairX - 32, seatY + 110, 8) + dC(chairX + 32, seatY + 110, 8), O('#2A2D38', 3));
  if (chair === 'front') m += chairBack(true);
  // ---- the couch (back frame, back cushions, seat tops, throw pillows)
  {
    let c = P(`M${CO.x0 + 20} ${CO.seat + 20} L${CO.x0 + 20} ${CO.back + 40} Q${CO.x0 + 24} ${CO.back} ${CO.x0 + 80} ${CO.back} L${CO.x1 - 80} ${CO.back} Q${CO.x1 - 24} ${CO.back} ${CO.x1 - 20} ${CO.back + 40} L${CO.x1 - 20} ${CO.seat + 20} Z`, O('#2C7A80', 6));
    const bc = (x0, x1) => P(`M${x0} ${CO.seat + 10} L${x0 + 6} ${CO.back + 44} Q${x0 + 10} ${CO.back + 22} ${x0 + 40} ${CO.back + 22} L${x1 - 40} ${CO.back + 22} Q${x1 - 10} ${CO.back + 22} ${x1 - 6} ${CO.back + 44} L${x1} ${CO.seat + 10} Z`, O('#3A939A', 5));
    const midX = (CO.x0 + CO.x1) / 2;
    c += bc(CO.x0 + 70, midX + 2) + bc(midX - 2, CO.x1 - 70);
    c += P(`M${CO.x0 + 120} ${CO.back + 50} Q${(CO.x0 + midX) / 2} ${CO.back + 40} ${midX - 50} ${CO.back + 50} M${midX + 50} ${CO.back + 50} Q${(midX + CO.x1) / 2} ${CO.back + 40} ${CO.x1 - 120} ${CO.back + 50}`, LN(5, '#5FB4BA', 0.7));
    // seat cushions' top surface (behind the sitters)
    c += P(`M${CO.x0 + 66} ${CO.seat} L${CO.x1 - 66} ${CO.seat} L${CO.x1 - 60} ${CO.front} L${CO.x0 + 60} ${CO.front} Z`, O('#3A939A', 5)) + P(`M${midX} ${CO.seat} L${midX} ${CO.front}`, LN(4, '#1E5A60'));
    // throw pillows (slumped when asleep) + the folded knitted throw on the right arm
    const pil = (x, y, r, col, rot) => G(P('M-46 -40 Q0 -52 46 -40 Q54 0 46 40 Q0 50 -46 40 Q-54 0 -46 -40 Z', O(col, 4)) + P('M-30 -30 Q0 -6 30 -30 M-30 30 Q0 6 30 30', LN(3, mix(col, '#000000', 0.2), 0.6)), tr(x, y, r, rot));
    if (asleep) c += pil(CO.x0 + 110, CO.seat - 20, 0.85, '#F2B84B', -38) + pil(CO.x1 - 100, CO.seat + 4, 0.8, '#E86A8A', 64);
    else c += pil(CO.x0 + 112, CO.seat - 56, 0.9, '#F2B84B', -10) + pil(CO.x1 - 112, CO.seat - 56, 0.9, '#E86A8A', 12);
    const bk = b01(o.blanket);
    if (bk <= 0.02) c += G(P('M-56 -26 L56 -30 L60 24 L-58 28 Z', O('#E86A8A', 4)) + P('M-56 -26 L56 -30 L60 24 L-58 28 Z', { fill: 'url(#hsKnit)' }) + P('M-58 0 L60 -4', LN(4, '#C04A6A')), `translate(${CO.x1 - 30} ${CO.seat - 70}) rotate(-4)`);
    m += c;
  }
  // floor lamp (mustard drum shade)
  {
    const L = LR.lamp, on = lampK > 0.02;
    let l = E(L.x, 718, 40, 9, O('#2A2D38', 4)) + P(`M${L.x} 712 V${L.top + 80}`, LN(10)) + P(`M${L.x} 712 V${L.top + 80}`, LN(5, '#C9A24A'));
    l += P(`M${L.x - 62} ${L.top + 90} L${L.x - 46} ${L.top} L${L.x + 46} ${L.top} L${L.x + 62} ${L.top + 90} Z`, O(on ? '!' + mix('#F2B84B', '#FFE7A8', 0.5 * lampK) : '#F2B84B', 5));
    let pleat = '';
    for (let i = -3; i <= 3; i++) pleat += `M${L.x + i * 14} ${L.top + 6} L${L.x + i * 18} ${L.top + 84} `;
    l += P(pleat, LN(2.5, '#C98A2A', 0.6)) + E(L.x, L.top + 90, 62, 7, O(on ? '!#FFF4C8' : '#E8D2A0', 3));
    m += l;
  }
  // Granny's wingback armchair (back + seat top) + the doily
  {
    const x0 = AR.x0, x1 = AR.x1, cx = (x0 + x1) / 2;
    let a = P(`M${x0 + 34} ${AR.seat} L${x0 + 30} 560 Q${x0 + 30} 496 ${x0 + 80} 482 Q${cx} 452 ${x1 - 80} 482 Q${x1 - 30} 496 ${x1 - 30} 560 L${x1 - 34} ${AR.seat} Z`, O('#D88A9A', 6));
    a += P(`M${x0 + 70} ${AR.seat - 20} L${x0 + 72} 540 Q${cx} 508 ${x1 - 72} 540 L${x1 - 70} ${AR.seat - 20} Z`, O('#E8A2AE', 4));
    let tuft = '';
    for (const [dx, dy] of [[-50, 560], [0, 548], [50, 560], [-50, 630], [0, 620], [50, 630]]) tuft += dC(cx + dx, dy, 4);
    a += P(tuft, FL('#B86A7A'));
    // doily on the headrest
    let dl = `M${cx - 58} 500`;
    for (let i = 0; i < 8; i++) dl += ` q7 ${i % 2 ? -10 : -12} 14.5 0`;
    a += P(dl + ` L${cx + 58} 500 L${cx + 50} 540 Q${cx} 556 ${cx - 50} 540 Z`, O('#FFF8EE', 3)) + P(dC(cx, 520, 9) + dC(cx - 30, 522, 5) + dC(cx + 30, 522, 5), { fill: 'none', stroke: C('#E0D4C2'), 'stroke-width': 2.5 });
    a += P(`M${x0 + 64} ${AR.seat - 40} L${x1 - 64} ${AR.seat - 40} L${x1 - 58} ${AR.seat} L${x0 + 58} ${AR.seat} Z`, O('#E8A2AE', 4.5));
    m += a;
  }
  // ---------------- front: gaming chair / couch front + arms / armchair front + skirt
  let fr = '';
  {
    if (chair === 'back') fr += chairBase() + R(chairX - 96, seatY - 14, 192, 30, 12, O('#2A2D38', 5)) + chairBack(false);
    else if (chair === 'front') fr += chairBase() + R(chairX - 96, seatY - 14, 192, 30, 12, O('#3A3F52', 5)) + R(chairX - 120, seatY - 76, 26, 66, 8, O('#2A2D38', 4)) + R(chairX + 94, seatY - 76, 26, 66, 8, O('#2A2D38', 4));
    // couch front: seat cushion fronts + base + legs + the rolled arms
    const midX = (CO.x0 + CO.x1) / 2;
    let c = R(CO.x0 + 30, CO.base, CO.x1 - CO.x0 - 60, CO.floor - CO.base - 12, 6, O('#21666B', 5)) + P(`M${CO.x0 + 60} ${CO.floor - 12} l-6 16 M${CO.x1 - 60} ${CO.floor - 12} l6 16`, LN(10, '#7A4A2A'));
    c += R(CO.x0 + 60, CO.front - 2, midX - CO.x0 - 60, CO.base - CO.front + 10, 14, O('#338A91', 5)) + R(midX, CO.front - 2, CO.x1 - 60 - midX, CO.base - CO.front + 10, 14, O('#338A91', 5));
    c += P(`M${CO.x0 + 74} ${CO.front + 10} H${midX - 14} M${midX + 14} ${CO.front + 10} H${CO.x1 - 74}`, LN(4, '#5FB4BA', 0.7));
    const arm = (x0, x1, d) => P(`M${x0} ${CO.floor - 10} L${x0} ${CO.seat - 40} Q${x0} ${CO.seat - 84} ${(x0 + x1) / 2} ${CO.seat - 86} Q${x1} ${CO.seat - 84} ${x1} ${CO.seat - 40} L${x1} ${CO.floor - 10} Z`, O('#2C7A80', 6)) + E((x0 + x1) / 2, CO.seat - 54, (x1 - x0) / 2 - 8, 26, O('#3A939A', 4)) + P(`M${(x0 + x1) / 2 + d * 18} ${CO.seat - 20} V${CO.floor - 24}`, LN(4, '#1E5A60', 0.5));
    c += arm(CO.x0 - 10, CO.x0 + 76, 1) + arm(CO.x1 - 76, CO.x1 + 10, -1);
    fr += c;
    // armchair: seat cushion front + arms + ruffled skirt (to the floor: hides Granny's legs)
    const x0 = AR.x0, x1 = AR.x1;
    let sk = `M${x0 + 6} ${AR.seat + 70} L${x1 - 6} ${AR.seat + 70} L${x1 + 4} ${AR.floor - 14}`;
    for (let x = x1 + 4; x > x0 - 4; x -= 34) sk += ` Q${x - 17} ${AR.floor + 4} ${f(Math.max(x0 - 4, x - 34))} ${AR.floor - 14}`;
    let a = P(sk + ' Z', O('#D88A9A', 5)) + P(`M${x0 + 4} ${AR.seat + 76} H${x1 - 4}`, LN(4, '#B86A7A'));
    a += R(x0 + 50, AR.seat - 6, x1 - x0 - 100, 82, 14, O('#E8A2AE', 5));
    const warm = (xa, xb) => P(`M${xa} ${AR.seat + 72} L${xa} ${AR.seat - 70} Q${xa} ${AR.seat - 112} ${(xa + xb) / 2} ${AR.seat - 114} Q${xb} ${AR.seat - 112} ${xb} ${AR.seat - 70} L${xb} ${AR.seat + 72} Z`, O('#D88A9A', 6)) + E((xa + xb) / 2, AR.seat - 84, (xb - xa) / 2 - 6, 22, O('#E8A2AE', 4));
    a += warm(x0, x0 + 64) + warm(x1 - 64, x1);
    fr += a;
    // Granny's knitting basket beside the armchair
    fr += knitBasket(AR.x0 - 22, AR.floor + 4, 0.92, tn);
    // the knitted throw over Dad (blanket 0..1: its top edge rises from his knees to his chest)
    const bk = b01(o.blanket);
    if (bk > 0.02) {
      const top = lerp(CO.front + 40, CO.seat - 92, bk), bx = LSEAT.dad.x;
      const bl = `M${bx - 150} ${f(top + 14)} Q${bx} ${f(top - 10)} ${bx + 150} ${f(top + 10)} L${bx + 170} ${CO.base + 40} Q${bx + 110} ${CO.base + 56} ${bx + 60} ${CO.base + 40} Q${bx} ${CO.base + 58} ${bx - 60} ${CO.base + 42} Q${bx - 120} ${CO.base + 56} ${bx - 170} ${CO.base + 40} Z`;
      fr += P(bl, O('#E86A8A', 5)) + P(bl, { fill: 'url(#hsKnit)' }) + P(`M${bx - 150} ${f(top + 34)} Q${bx} ${f(top + 12)} ${bx + 150} ${f(top + 30)}`, LN(6, '#F2B84B')) + P(`M${bx - 160} ${f(top + 64)} Q${bx} ${f(top + 44)} ${bx + 160} ${f(top + 60)}`, LN(6, '#7FC8E8'));
    }
  }
  // ---------------- table: the coffee table + snacks (+ mess) + the beanbag (front left)
  let tb = '';
  {
    const bb = 'M90 1010 Q70 900 170 880 Q240 840 300 884 Q390 900 380 1000 Q360 1046 236 1048 Q110 1048 90 1010 Z';
    tb += G(E(236, 1044, 160, 18, { fill: '#000', opacity: 0.14 }) + P(bb, O('#E8A84A', 6)) + P('M130 960 Q200 930 260 940 Q320 948 350 990', LN(5, '#C8862A', 0.7)) + P('M176 892 Q236 870 290 896', LN(4, '#FFE0A0', 0.8)), 'translate(176 1046) scale(0.82) translate(-236 -1046)');
    tb += E((TB.x0 + TB.x1) / 2, TB.floor + 2, (TB.x1 - TB.x0) / 2 + 30, 12, { fill: '#000', opacity: 0.14 });
    tb += P(`M${TB.x0 + 40} ${TB.base - 6} L${TB.x0 + 52} ${TB.floor} M${TB.x1 - 40} ${TB.base - 6} L${TB.x1 - 52} ${TB.floor}`, LN(16)) + P(`M${TB.x0 + 40} ${TB.base - 6} L${TB.x0 + 52} ${TB.floor} M${TB.x1 - 40} ${TB.base - 6} L${TB.x1 - 52} ${TB.floor}`, LN(9, '#8A5A36'));
    tb += R(TB.x0, TB.top, TB.x1 - TB.x0, TB.base - TB.top, 6, O('#8A5A36', 5)) + R(TB.x0 + 20, TB.top + 12, TB.x1 - TB.x0 - 40, TB.base - TB.top - 24, 5, { fill: 'none', stroke: C('#6A4228'), 'stroke-width': 3.5 }) + R((TB.x0 + TB.x1) / 2 - 22, TB.top + 28, 44, 9, 4, O('#E8B84A', 2.5));
    tb += P(`M${TB.x0 - 8} ${TB.top} L${TB.x0 + 22} ${TB.back} L${TB.x1 - 22} ${TB.back} L${TB.x1 + 8} ${TB.top} Z`, O('#A8703F', 5)) + P(`M${TB.x0 + 30} ${TB.back + 10} L${TB.x1 - 30} ${TB.back + 10}`, LN(3, '#C99060', 0.7));
    // snacks
    const ty = TB.top - 10;
    tb += G(P('M-56 -6 Q-52 18 0 20 Q52 18 56 -6 Z', O('#E04848', 4)) + E(0, -6, 56, 12, O('#F2B84B', 3.5)) + P(dE(-20, -14, 14, 7) + dE(8, -18, 16, 7) + dE(30, -12, 12, 6), O('#FFD86A', 2)), `translate(${TB.x0 + 120} ${ty})`);
    tb += G(P('M-44 -4 Q-40 16 0 18 Q40 16 44 -4 Z', O('#7FC8E8', 4)) + E(0, -4, 44, 10, O('#FFF8EC', 3)) + P(dC(-18, -12, 9) + dC(0, -16, 10) + dC(18, -12, 9) + dC(-6, -6, 8) + dC(12, -6, 8), O('#FFFDF4', 2)), `translate(${TB.x0 + 250} ${ty - 2})`);
    tb += cookiePlate(TB.x1 - 86, ty + 6, 0.8, tn);
    const can = (x, y, col, r = 0) => G(R(-12, -34, 24, 34, 4, O(col, 3)) + R(-12, -28, 24, 8, 0, FL('#FFFFFF')) + E(0, -34, 12, 3, FL('#D8DDE4')), tr(x, y, 1, r));
    tb += can(TB.x0 + 330, ty + 2, '#E04848') + can(TB.x0 + 362, ty + 4, '#3DA84A') + can(TB.x1 - 220, ty + 2, '#3E8FE0');
    tb += G(R(-34, -8, 68, 16, 7, O('#2A2D38', 3)) + CI(-20, 0, 3, FL('#E04848')) + CI(-10, 0, 3, FL('#3DA84A')), `translate(${TB.x0 + 52} ${ty + 6}) rotate(-8)`);
    if (o.tea) tb += mug(LR.table.x1 - 168, ty + 8, 0.8, tn, { col: '#FFFFFF', label: '#1 MOM', handle: 'L', tea: true, steam: t });
    if (o.boardGame) tb += G(R(-80, -26, 160, 26, 4, O('#3E9C97', 4)) + R(-80, -26, 160, 10, 4, FL('#F2B84B')) + TF('WORD TILES', 0, -4, 13, C('#FFFFFF')), `translate(${TB.x0 + 300} ${ty + 4}) rotate(-2)`);
    // mess: spilled chips + popcorn, tipped cans, pizza box, juice boxes, a sock, the yarn trail
    if (mess > 0) {
      const items = [
        () => P(dE(TB.x0 + 170, ty + 6, 10, 5) + dE(TB.x0 + 196, ty + 10, 9, 4) + dE(TB.x0 + 60, ty + 8, 8, 4), O('#FFD86A', 2)) + P(dC(TB.x0 + 300, ty + 6, 7) + dC(TB.x0 + 318, ty + 10, 6), O('#FFFDF4', 2)),
        () => G(R(-12, -34, 24, 34, 4, O('#F2B84B', 3)) + E(0, -34, 12, 3, FL('#D8DDE4')), tr(TB.x1 - 300, ty + 4, 1, 82)),
        () => G(R(-110, -16, 220, 22, 4, O('#E8C890', 4)) + P('M-100 -16 L-90 -44 L96 -44 L106 -16', O('#F4DCA8', 4)) + P('M-60 -20 L-20 -40 L20 -20 Z', O('#F2B84B', 3)) + P(dC(-34, -26, 5) + dC(-12, -30, 5), FL('#E04848')) + TF('PIZZA', 50, -24, 16, C('#E04848')), `translate(700 1050) rotate(-4)`),
        () => P(dC(1520, 1010, 7) + dC(1548, 1030, 6) + dC(760, 960, 6) + dC(1130, 1046, 7) + dC(1600, 1060, 6), O('#FFFDF4', 2)) + P(dE(830, 1000, 10, 5) + dE(1440, 1060, 9, 4), O('#FFD86A', 2)),
        () => G(R(-16, -36, 32, 36, 3, O('#FF8FC0', 3)) + R(4, -46, 4, 12, 1, FL('#FFFFFF')), tr(1660, 1050, 1, -70)) + G(R(-16, -36, 32, 36, 3, O('#7FC8E8', 3)), tr(860, 1060, 1, 20)),
        () => P(`M${AR.x0 - 30} ${AR.floor - 20} Q1500 1040 1340 1010 Q1200 990 1100 1050 Q1000 1100 900 1060`, LN(5, '#7FC8E8')) + yarnBall(905, 1062, 0.9, tn, '#7FC8E8'),
        () => P('M1220 1050 q10 -18 30 -10 l24 8 q8 4 2 12 l-36 2 q-18 0 -20 -12 Z', O('#FFFFFF', 3.5)) + P('M1236 1042 l26 8', LN(4, '#3E9C97')) + G(P('M-40 -20 Q0 -36 40 -20 L44 10 Q0 18 -44 10 Z', O('#F2B84B', 3.5)) + TF('CHIPS', 0, 0, 12, C('#E04848')), tr(1380, 1040, 1, 14)),
      ];
      const n = mess * items.length;
      items.forEach((fn, i) => { if (n - i > 0.4) tb += fn(); });
    }
  }
  // ---------------- light
  let light = '';
  if (eve) {
    light += glow(LR.lamp.x, LR.lamp.top + 70, 330, 'hsGlowWarm', 0.85 * lampK) + pool(LR.lamp.x - 120, 760, 520, 260, '#FFD58A', 0.14 * lampK, 4);
    light += cover({ fill: '#FF9A50', opacity: 0.05 });
    if (tvGlow > 0) light += glow(TVQ.cx, TVQ.cy, 260, 'hsGlowTV', 0.45 * tvGlow);
  } else {
    // darkness (dims the characters too), then the light pools
    light += cover({ fill: mid ? '#04061A' : '#070B26', opacity: mid ? 0.3 : 0.22 }) + darkRing(1180, 620, 820, 500, '#03051A', mid ? 0.42 : 0.32, 10);
    if (tvGlow > 0) {
      light += glow(TVQ.cx, TVQ.cy, 300, 'hsGlowTV', 0.75 * tvGlow);
      light += P(dP([[TVQ.x1, TVQ.pts[1][1]], [TVQ.x1, TVQ.pts[2][1]], [1560, 1100], [560, 1100]]), { fill: 'url(#hsBeamTV)', opacity: f(0.14 * tvGlow) }) + P(dP([[TVQ.x1, TVQ.pts[1][1] + 30], [TVQ.x1, TVQ.pts[2][1] - 20], [1300, 1000], [820, 1000]]), { fill: 'url(#hsBeamTV)', opacity: f(0.12 * tvGlow) });
      light += pool(1150, 760, 520, 230, '#8FD8FF', 0.16 * tvGlow, 4);
    }
    if (o.pc !== false && (o.pcScreen || !asleep)) light += glow(M.cx, M.cy, 240, 'hsGlowPurple', 0.55);
    if (lampK > 0.02) light += glow(LR.lamp.x, LR.lamp.top + 70, 300, 'hsGlowWarm', 0.8 * lampK) + pool(LR.lamp.x - 120, 760, 480, 240, '#FFD58A', 0.18 * lampK, 4);
  }
  const gl = o.glow === 'all' ? deviceGlows() : o.glow;
  if (gl) light += faceGlows(gl, b01(o.glowK, 1));
  return { bg, mid: m, front: fr, table: tb, fg: '', light };
}
const livingRoom = makeSet(livingRoomLayers);

// ================================================================= 3. BEDROOM — YOUR room (the talk, the 11 p.m. alarm)
// Front view. Periwinkle walls with a cube stencil + a pixel-block frieze, glow-in-the-dark stars around the window, a soft
// grey-blue carpet with a round mustard rug. LEFT: the bedside table with THE warm lamp (o.lamp) + a digital clock (10:59 PM),
// the BED along the back wall (headboard at the left, pillow, a cube plushie; the duvet's front drop = layers.front) under the
// window (night sky + moon + a branch). YOU lie facing the wall (back view, rot -90) on SPOTS.bedroom.bed.lie; Dad sits on
// the bed edge near the foot end (SPOTS.bedroom.bed.sit, draw him AFTER front: he is in front of the bed). RIGHT: the trophy
// shelf, the CUBE CITY poster + the BLOCK KING "coming soon" poster, the desk with the gaming PC (o.monitor; o.alarm floods it
// red), the green gaming chair, the door (o.door opens onto the lit hallway).
// opts: { time 'night'|'evening'|'day' (default night: dim blue, moonlight), lamp 0..1 (the bedside lamp; default 1 at night,
//   0 by day), door 0..1, hall (hall light on when the door is open; default true), alarm 0..1 (the PC flashes RED: warning
//   screen + red pulsing light filling the room; it pulses by itself unless alarmPulse: false), monitor svg|fn(w,h),
//   pc (default true), tuck 0..1 (duvet pulled over YOU up to the shoulders), stars (glow stars, default true at night),
//   clock (bedside clock text, default '10:59') }
const BR = {
  ceil: 40, base: 724,
  win: { x0: 330, y0: 150, x1: 650, y1: 430 },
  bed: { x0: 190, x1: 1010, top: 690, front: 718, drop: 868, floor: 900 },
  night: { x0: 24, x1: 166, top: 600 },
  desk: { x0: 1180, x1: 1620, top: 640, floor: 880 },
  mon: { cx: 1398, cy: 476, w: 296, h: 172 },
  door: { x0: 1690, x1: 1880, top: 236 },
  shelf: { x0: 1000, x1: 1170, y: 300 },
};
def(`<clipPath id="hsClipBRMon"><rect x="${BR.mon.cx - BR.mon.w / 2}" y="${BR.mon.cy - BR.mon.h / 2}" width="${BR.mon.w}" height="${BR.mon.h}" rx="4"/></clipPath>`);
// the red WARNING screen (alarm) for any w x h box centred on (0,0)
function alarmScreen(w, h, t = 0, k = 1) {
  const p = 0.5 + 0.5 * Math.sin(t * 9);
  let s = R(-w / 2, -h / 2, w, h, 0, { fill: mix('#5A0610', '#C8102A', p * k) });
  s += P(`M0 ${f(-h * 0.36)} L${f(h * 0.3)} ${f(h * 0.16)} L${f(-h * 0.3)} ${f(h * 0.16)} Z`, { fill: '#FFD23F', stroke: '#2A0206', 'stroke-width': f(h * 0.03), 'stroke-linejoin': 'round' });
  s += R(-h * 0.025, -h * 0.18, h * 0.05, h * 0.2, h * 0.02, { fill: '#2A0206' }) + CI(0, h * 0.08, h * 0.03, { fill: '#2A0206' });
  s += TF('WARNING!', 0, h * 0.36, h * 0.15, '#FFFFFF', OUTX(f(h * 0.03), '#5A0610'));
  return s;
}
function bedroomLayers(t, o = {}) {
  const time = o.time || 'night', nite = time === 'night', eve = time === 'evening';
  const lampK = b01(o.lamp, nite ? 1 : 0), doorK = b01(o.door), alarm0 = b01(o.alarm);
  const alarm = alarm0 * (o.alarmPulse === false ? 1 : 0.62 + 0.38 * Math.sin(t * Math.PI * 2 * 1.4));
  const tn = tone(nite ? { night: 0.8, red: 0.7 * alarm } : eve ? { eve: 0.6, red: 0.7 * alarm } : { red: 0.7 * alarm });
  const C = tn.c, O = tn.ol, LN = tn.ln, FL = tn.fl;
  const W = BR.win, B = BR.bed, D = BR.desk, M = BR.mon;
  const monOn = (o.monitor !== undefined && o.monitor !== null && o.monitor !== false) || alarm0 > 0;
  // ---------------- bg: night sky + moon + a branch through the window
  let bg = R(W.x0 - 40, W.y0 - 40, W.x1 - W.x0 + 80, W.y1 - W.y0 + 80, 0, { fill: `url(#${nite ? 'hsSkyNight' : eve ? 'hsSkyEvening' : 'hsSkyDay'})` });
  if (nite) bg += R(W.x0 - 40, W.y0 - 40, W.x1 - W.x0 + 80, 240, 0, { fill: 'url(#hsStars)' }) + glow(570, 220, 110, 'hsGlowMoon', 0.9) + CI(570, 220, 34, { fill: '#FFF4C8', stroke: '#E8D490', 'stroke-width': 4 }) + CI(558, 210, 7, { fill: '#F0E2A8' }) + CI(580, 232, 5, { fill: '#F0E2A8' });
  else bg += hsCloud(460, 300, 0.5, tn, '#FFFFFF', eve ? '#F2B0C0' : '#DCEBFA');
  bg += P(`M${W.x0 - 40} 400 Q420 380 480 404 Q560 386 ${W.x1 + 40} 396 L${W.x1 + 40} ${W.y1 + 40} L${W.x0 - 40} ${W.y1 + 40} Z`, FL(nite ? '#1A2450' : '#6FB86A'));
  const sw = Math.sin(t * 0.7) * 1.5;
  bg += G(P('M300 180 Q380 210 450 200', LN(14, nite ? '#141A38' : '#7A4A2A')) + P(dE(450, 196, 34, 20) + dE(410, 214, 30, 18) + dE(480, 216, 26, 16), FL(nite ? '#1C2752' : '#5DB55A')), `rotate(${f(sw)} 300 180)`);
  // ---------------- mid
  let m = '';
  const wallD = `M${XL} ${YT} H${XR} V${BR.base} H${XL} Z M${W.x0} ${W.y0} V${W.y1} H${W.x1} V${W.y0} Z`;
  m += P(wallD, { fill: C('#A3B8EA'), 'fill-rule': 'evenodd' }) + P(wallD, { fill: 'url(#hsCubes)', 'fill-rule': 'evenodd', opacity: 0.4 });
  m += R(XL, YT, XR - XL, BR.ceil - YT, 0, FL('#EEF2FF')) + band(BR.ceil - 4, BR.ceil + 14, O('#FFFFFF', 4));
  // pixel-block frieze
  {
    const cols = ['#F2B84B', '#E25050', '#5DB55A', '#7FC8E8'];
    const ds = ['', '', '', ''];
    for (let i = 0; i * 28 + XL < XR; i++) ds[i % 4] += dR(XL + i * 28, 70 + (i % 2) * 0, 28, 22);
    ds.forEach((d, i) => { m += P(d, FL(cols[i])); });
    m += P(`M${XL} 70 H${XR} M${XL} 92 H${XR}`, LN(3, tn.line, 0.6));
  }
  // window frame + navy star curtains
  {
    let w = P(`M${W.x0 - 20} ${W.y0 - 20} H${W.x1 + 20} V${W.y1 + 6} H${W.x0 - 20} Z M${W.x0} ${W.y0} V${W.y1} H${W.x1} V${W.y0} Z`, { fill: C('#FFFFFF'), 'fill-rule': 'evenodd', stroke: tn.line, 'stroke-width': 6 });
    const wc = (W.x0 + W.x1) / 2;
    w += R(wc - 6, W.y0, 12, W.y1 - W.y0, 3, O('#FFFFFF', 3.5)) + R(W.x0, 282, W.x1 - W.x0, 12, 3, O('#FFFFFF', 3.5)) + R(W.x0 - 30, W.y1 + 2, W.x1 - W.x0 + 60, 20, 6, O('#FFFFFF', 4.5));
    w += P(`M${W.x0 + 22} ${W.y0 + 110} L${W.x0 + 82} ${W.y0 + 8} L${W.x0 + 104} ${W.y0 + 8} L${W.x0 + 44} ${W.y0 + 110} Z`, { fill: '#FFFFFF', opacity: nite ? 0.08 : 0.25 });
    const cs = Math.sin(t * 1.1) * 3;
    for (const [cx, d] of [[W.x0 - 30, 1], [W.x1 + 30, -1]]) {
      const cp = `M${cx - 44 * d} ${W.y0 - 42} L${cx + 44 * d} ${W.y0 - 42} Q${f(cx + 30 * d + cs)} 300 ${f(cx + 14 * d + cs)} ${W.y1 + 70} L${f(cx - 44 * d + cs)} ${W.y1 + 76} Z`;
      w += P(cp, O('#34447E', 5)) + P(`M${cx} ${W.y0 - 30} Q${f(cx + 4 * d)} 300 ${f(cx + cs)} ${W.y1 + 60}`, LN(4, '#26346A', 0.8));
      w += P(dC(cx - 14 * d, 220, 5) + dC(cx + 10 * d, 300, 5) + dC(cx - 8 * d, 380, 5) + dC(cx + 14 * d, 450, 5), FL('#F2D04A'));
    }
    w += R(W.x0 - 84, W.y0 - 50, W.x1 - W.x0 + 168, 12, 6, O('#C9CED8', 3.5));
    m += w;
  }
  // glow-in-the-dark stars on the wall
  if (o.stars !== false) {
    let st = '';
    for (const [x, y, r] of [[250, 150], [700, 130], [760, 250], [180, 300], [880, 180], [1020, 140]].map(([x, y], i) => [x, y, 10 + (i % 3) * 3])) st += `M${x} ${y - r} L${x + r * 0.3} ${y - r * 0.3} L${x + r} ${y} L${x + r * 0.3} ${y + r * 0.3} L${x} ${y + r} L${x - r * 0.3} ${y + r * 0.3} L${x - r} ${y} L${x - r * 0.3} ${y - r * 0.3} Z `;
    m += P(st, nite ? { fill: '#E8FF9A', opacity: 0.9 } : FL('#F2F0C8'));
  }
  // trophy shelf: cups, a medal, a 2000 WINS plaque, a cube plushie
  {
    const S0 = BR.shelf;
    let s = R(S0.x0, S0.y, S0.x1 - S0.x0, 14, 4, O('#9A6238', 3.5)) + P(`M${S0.x0 + 20} ${S0.y + 14} l0 16 l14 -16 M${S0.x1 - 20} ${S0.y + 14} l0 16 l-14 -16`, LN(4, '#7A4A2A'));
    const cup = (x, h, col) => G(P(`M-16 ${-h} Q-16 ${-h + 26} 0 ${-h + 30} Q16 ${-h + 26} 16 ${-h} Z`, O(col, 3)) + R(-4, -h + 30, 8, h - 40, 2, FL(col)) + R(-12, -10, 24, 10, 2, O('#7E4A2A', 2.5)) + P(`M-16 ${-h + 6} q-10 0 -8 10 M16 ${-h + 6} q10 0 8 10`, LN(2.5)), `translate(${x} ${S0.y})`);
    s += cup(S0.x0 + 30, 62, '#FFC23A') + cup(S0.x0 + 70, 48, '#C9CED8') + G(R(-26, -40, 52, 40, 4, O('#2E3242', 3)) + TF('2000', 0, -22, 13, C('#FFE14D')) + TF('WINS', 0, -8, 10, C('#FFFFFF')), `translate(${S0.x0 + 118} ${S0.y})`);
    s += G(R(-16, -32, 32, 32, 6, O('#5DB55A', 3)) + CI(-6, -18, 3, FL(LINE)) + CI(6, -18, 3, FL(LINE)) + P('M-5 -10 Q0 -6 5 -10', LN(2)), `translate(${S0.x1 - 18} ${S0.y})`);
    s += P(`M${S0.x0 + 150} ${S0.y + 14} V${S0.y + 60}`, LN(3, '#3E8FE0')) + CI(S0.x0 + 150, S0.y + 70, 12, O('#FFC23A', 3));
    m += s;
  }
  // posters: CUBE CITY (castle + logo) and BLOCK KING — COMING SOON
  {
    let pc = R(-96, -126, 192, 252, 6, O('#2E5FB8', 5)) + R(-86, -116, 172, 232, 3, FL('#5AB4F0')) + R(-86, 40, 172, 76, 0, FL('#5DB55A'));
    pc += P('M-60 40 V-10 H-46 V-26 H-32 V-10 H-14 V-44 H14 V-10 H32 V-26 H46 V-10 H60 V40 Z', O('#C9CED8', 3)) + P('M0 -44 V-70 l22 7 l-22 7', LN(3)) + P('M0 -70 l22 7 l-22 7 Z', O('#E25050', 2));
    pc += T('CUBE', 0, -82, 34, C('#FFE14D'), OUTX(6, tn.line)) + T('CITY', 0, 92, 34, C('#FFFFFF'), OUTX(6, tn.line));
    m += G(pc, 'translate(1280 230) rotate(-2)');
    let pk = R(-80, -104, 160, 208, 6, O('#3A1A5A', 5)) + R(-70, -94, 140, 188, 3, FL('#5A2A8A'));
    pk += R(-34, -30, 68, 64, 6, O('#8A8FA6', 3)) + P('M-34 -30 L-24 -56 L-12 -40 L0 -62 L12 -40 L24 -56 L34 -30 Z', O('#FFC23A', 3)) + R(-22, -14, 14, 10, 2, FL('!#FF4A4A')) + R(8, -14, 14, 10, 2, FL('!#FF4A4A'));
    pk += T('BLOCK KING', 0, 66, 22, C('#FFC23A'), OUTX(5, tn.line)) + TF('COMING SOON', 0, 86, 12, C('#FFFFFF'));
    m += G(pk, 'translate(1530 214) rotate(3)');
  }
  // the door (opens onto the lit hall)
  {
    const Dr = BR.door, x0 = Dr.x0, x1 = Dr.x1, y0 = Dr.top, y1 = BR.base;
    let dd = R(x0 - 18, y0 - 18, x1 - x0 + 36, y1 - y0 + 22, 4, O('#FFFFFF', 5));
    if (doorK > 0) {
      const lit = o.hall !== false;
      dd += R(x0, y0, x1 - x0, y1 - y0, 0, FL(lit ? '!' + mix('#3A3550', '#FFD89A', nite ? 0.85 : 0.6) : '#3A3550')) + R(x0, y1 - 50, x1 - x0, 50, 0, FL(lit ? '!#E8B878' : '#2A2540'));
      const xf = lerp(x0, x1 - 40, doorK), lift = 22 * doorK;
      dd += P(dP([[xf, y0 - lift], [x1, y0], [x1, y1], [xf, y1 + lift]]), O('#E8E2F2', 5)) + P(`M${f(xf)} ${f(y0 - lift)} L${f(xf - 14 * doorK)} ${f(y0 - lift + 6)} L${f(xf - 14 * doorK)} ${f(y1 + lift - 4)} L${f(xf)} ${f(y1 + lift)}`, O('#C9C2DA', 4));
    } else {
      dd += R(x0, y0, x1 - x0, y1 - y0, 4, O('#E8E2F2', 5)) + P(dRR(x0 + 22, y0 + 26, x1 - x0 - 44, 170, 8) + dRR(x0 + 22, y0 + 224, x1 - x0 - 44, 220, 8), { fill: 'none', stroke: C('#C9C2DA'), 'stroke-width': 4 });
      dd += CI(x0 + 24, 500, 10, O('#FFC23A', 3)) + G(R(-60, -30, 120, 60, 6, O('#FFFFFF', 3.5)) + TF('KNOCK', 0, -6, 16, C('#E25050')) + TF('FIRST!', 0, 14, 16, C('#E25050')), `translate(${(x0 + x1) / 2} ${y0 + 110}) rotate(-3)`);
    }
    m += dd;
  }
  // floor: grey-blue carpet + round mustard rug + skirting
  m += R(XL, BR.base, XR - XL, YB - BR.base, 0, FL('#B9BEDA')) + R(XL, BR.base, XR - XL, YB - BR.base, 0, { fill: 'url(#hsCarpet)' });
  m += band(BR.base - 12, BR.base + 2, O('#FFFFFF', 3.5)) + band(BR.base + 2, BR.base + 12, { fill: '#000', opacity: 0.08 });
  m += E(1180, 980, 300, 70, O('#F2B84B', 5)) + E(1180, 980, 240, 52, { fill: 'none', stroke: C('#E25050'), 'stroke-width': 6 }) + E(1180, 980, 170, 36, { fill: 'none', stroke: C('#FFF4D0'), 'stroke-width': 5 });
  // bedside table + THE lamp + the digital clock + a water glass
  {
    const N = BR.night;
    let n = R(N.x0, N.top, N.x1 - N.x0, BR.base + 80 - N.top, 6, O('#C98A52', 5)) + R(N.x0 + 12, N.top + 40, N.x1 - N.x0 - 24, 70, 5, O('#B07A44', 3.5)) + CI((N.x0 + N.x1) / 2, N.top + 75, 6, O('#FFC23A', 2));
    n += R(N.x0 - 6, N.top - 6, N.x1 - N.x0 + 12, 16, 5, O('#D99A62', 4));
    const lx = N.x0 + 40, on = lampK > 0.02;
    n += E(lx, N.top - 4, 26, 7, O('#3E9C97', 3.5)) + P(`M${lx} ${N.top - 8} V${N.top - 70}`, LN(8)) + P(`M${lx} ${N.top - 8} V${N.top - 70}`, LN(4, '#3E9C97'));
    n += P(`M${lx - 46} ${N.top - 66} L${lx - 32} ${N.top - 132} L${lx + 32} ${N.top - 132} L${lx + 46} ${N.top - 66} Z`, O(on ? '!' + mix('#F2D48A', '#FFF0C0', lampK) : '#F2D48A', 4.5)) + E(lx, N.top - 66, 46, 6, O(on ? '!#FFF6D0' : '#E8D2A0', 3));
    n += G(R(-34, -32, 68, 32, 6, O('#2A2D38', 3.5)) + R(-28, -27, 56, 22, 3, FL('#120808')) + TF(o.clock ?? '10:59', 0, -10, 17, C('!#FF4A3A')), `translate(${N.x1 - 34} ${N.top})`);
    m += n;
  }
  // the bed: headboard, footboard, mattress top, pillow, cube plushie (the duvet front = layers.front)
  {
    let b = P(`M${B.x0} ${B.floor} L${B.x0} 500 Q${B.x0} 460 ${B.x0 + 40} 460 Q${B.x0 + 80} 460 ${B.x0 + 80} 500 L${B.x0 + 80} ${B.floor} Z`, O('#3E9C97', 6)) + R(B.x0 + 14, 492, 52, 150, 10, FL('#5FB4AE'));
    b += P(`M${B.x0 + 8} 500 Q${B.x0 + 40} 470 ${B.x0 + 72} 500`, LN(4, '#FFFFFF', 0.4));
    b += R(B.x0 + 60, B.top - 4, B.x1 - B.x0 - 70, B.front - B.top + 14, 12, O('#FFFFFF', 5));
    b += P(`M${B.x0 + 90} ${B.top + 6} Q${B.x0 + 80} ${B.top - 70} ${B.x0 + 150} ${B.top - 74} L${B.x0 + 230} ${B.top - 74} Q${B.x0 + 280} ${B.top - 70} ${B.x0 + 270} ${B.top + 6} Q${B.x0 + 180} ${B.top + 20} ${B.x0 + 90} ${B.top + 6} Z`, O('#FFFFFF', 5)) + P(`M${B.x0 + 106} ${B.top - 22} Q${B.x0 + 180} ${B.top - 6} ${B.x0 + 256} ${B.top - 26}`, LN(4, '#C9D3F0'));
    b += G(R(-28, -54, 56, 54, 10, O('#5DB55A', 4)) + R(-22, -70, 44, 22, 8, O('#5DB55A', 4)) + CI(-10, -30, 4, FL(LINE)) + CI(10, -30, 4, FL(LINE)) + P('M-8 -18 Q0 -12 8 -18', LN(2.5)) + R(-8, -48, 16, 6, 2, FL('#3E8A4A')), `translate(${B.x1 - 60} ${B.top + 2}) rotate(8)`);
    b += P(`M${B.x1 - 8} ${B.floor} L${B.x1 - 8} 610 Q${B.x1 - 8} 586 ${B.x1 + 16} 586 Q${B.x1 + 40} 586 ${B.x1 + 40} 610 L${B.x1 + 40} ${B.floor} Z`, O('#3E9C97', 6));
    m += b;
  }
  // desk + the gaming PC (monitor, RGB tower) + chair
  {
    let d = R(D.x0, D.top + 16, 26, D.floor - D.top - 16, 4, O('#E8E2D4', 4)) + R(D.x1 - 150, D.top + 16, 140, D.floor - D.top - 16, 5, O('#E8E2D4', 4.5)) + P(dRR(D.x1 - 140, D.top + 34, 120, 70, 5) + dRR(D.x1 - 140, D.top + 114, 120, 70, 5), { fill: C('#F4F0E6'), stroke: C('#C9C3B4'), 'stroke-width': 3 });
    const tw = { x: D.x0 + 110, y: D.floor };
    d += R(tw.x - 44, tw.y - 150, 88, 150, 6, O('#22252E', 4)) + R(tw.x - 34, tw.y - 138, 30, 124, 3, { fill: alarm0 > 0 ? C('!#FF3A4A') : 'url(#hsRGB)', opacity: nite ? 1 : 0.7 }) + CI(tw.x + 18, tw.y - 104, 16, O('#2E3242', 3)) + CI(tw.x + 18, tw.y - 54, 16, O('#2E3242', 3));
    d += R(D.x0 - 8, D.top, D.x1 - D.x0 + 16, 20, 5, O('#F4F0E6', 4.5));
    if (o.pc !== false) {
      const x0 = M.cx - M.w / 2, y0 = M.cy - M.h / 2;
      if (nite && alarm0 <= 0) d += R(x0 - 26, y0 - 22, M.w + 52, M.h + 46, 30, { fill: 'url(#hsRGB)', opacity: 0.3 });
      d += R(M.cx - 14, y0 + M.h + 8, 28, D.top - y0 - M.h - 8, 3, O('#2A2D38', 3.5)) + E(M.cx, D.top - 1, 60, 7, O('#2A2D38', 3.5));
      d += R(x0 - 12, y0 - 12, M.w + 24, M.h + 30, 10, O('#1E2029', 5)) + CI(x0 + M.w - 6, y0 + M.h + 9, 3, FL(monOn ? '!#3DFF9A' : '!#FF8A2A'));
      let scr = R(x0, y0, M.w, M.h, 4, FL(monOn ? '#05060A' : '#161A26'));
      if (alarm0 > 0) scr += G(G(alarmScreen(M.w, M.h, t, alarm0), tr(M.cx, M.cy)), null, { 'clip-path': 'url(#hsClipBRMon)' });
      else if (monOn) scr += G(G(screenOf(o.monitor, M.w, M.h), tr(M.cx, M.cy)), null, { 'clip-path': 'url(#hsClipBRMon)' });
      else scr += P(`M${x0 + 26} ${y0} L${x0 + 100} ${y0} L${x0 + 34} ${y0 + M.h} L${x0} ${y0 + M.h} L${x0} ${y0 + 50} Z`, { fill: '#FFFFFF', opacity: 0.06 });
      d += scr + R(x0, y0, M.w, M.h, 4, { fill: 'url(#hsShine)', opacity: 0.45 }) + R(x0, y0, M.w, M.h, 4, LN(3, '#0A0B10'));
      const kb = dP([[1330, D.top - 12], [1470, D.top - 12], [1478, D.top + 2], [1322, D.top + 2]]);
      d += P(kb, { fill: alarm0 > 0 ? C('!#FF3A4A') : 'url(#hsRGB)', stroke: tn.line, 'stroke-width': 3.5, 'stroke-linejoin': 'round' }) + E(1520, D.top - 4, 12, 7, O('#2A2D38', 3));
    }
    // headphones on the desk + the empty gaming chair (turned a little)
    d += G(P('M-26 0 L-26 -36 Q-26 -58 0 -58 Q26 -58 26 -36 L26 0', LN(9)) + P('M-26 0 L-26 -36 Q-26 -58 0 -58 Q26 -58 26 -36 L26 0', LN(5, '#5DB55A')) + R(-34, -18, 16, 28, 6, O('#2A2D38', 3)) + R(18, -18, 16, 28, 6, O('#2A2D38', 3)), `translate(1242 ${D.top - 4})`);
    const cx = 1420, sy = 770;
    let ch = P(`M${cx - 80} ${sy} L${cx - 76} ${sy - 170} Q${cx - 70} ${sy - 206} ${cx} ${sy - 208} Q${cx + 70} ${sy - 206} ${cx + 76} ${sy - 170} L${cx + 80} ${sy} Z`, O('#2A2D38', 5)) + P(`M${cx - 28} ${sy - 200} V${sy} M${cx + 28} ${sy - 200} V${sy}`, LN(11, '#5DB55A'));
    ch += R(cx - 90, sy - 12, 180, 28, 12, O('#3A3F52', 5)) + P(`M${cx} ${sy + 16} V${sy + 64}`, LN(14)) + P(`M${cx} ${sy + 16} V${sy + 64}`, LN(7, '#7A8094')) + P(`M${cx - 62} ${sy + 86} L${cx} ${sy + 64} L${cx + 62} ${sy + 86} M${cx - 28} ${sy + 92} L${cx} ${sy + 64} L${cx + 28} ${sy + 92}`, LN(11)) + P(`M${cx - 62} ${sy + 86} L${cx} ${sy + 64} L${cx + 62} ${sy + 86} M${cx - 28} ${sy + 92} L${cx} ${sy + 64} L${cx + 28} ${sy + 92}`, LN(5, '#3A3F52'));
    ch += G(R(-30, -40, 60, 80, 14, O('#E25050', 4)) + R(-20, -28, 40, 26, 6, FL('#C03C3C')) + P('M-18 -40 Q0 -60 18 -40', LN(5)), `translate(${cx + 58} ${sy - 120}) rotate(10)`);
    d += ch;
    m += d;
  }
  // floor clutter: sneakers + a laundry basket by the bed
  m += G(P('M-30 0 L-26 -22 Q0 -30 26 -22 L30 0 Z', O('#E25050', 4)) + P('M-20 -18 h40', LN(3, '#FFFFFF')), 'translate(1080 950)') + G(P('M-30 0 L-26 -22 Q0 -30 26 -22 L30 0 Z', O('#E25050', 4)), 'translate(1136 966) rotate(8)');
  // ---------------- front: the duvet's front drop (+ tucked over YOU)
  let fr = '';
  {
    const tuck = b01(o.tuck);
    let dv = `M${B.x0 + 66} ${B.front - 8} L${B.x1 - 14} ${B.front - 8} L${B.x1 - 6} ${B.drop - 10}`;
    for (let x = B.x1 - 6; x > B.x0 + 70; x -= 60) dv += ` Q${x - 30} ${B.drop + 8} ${f(Math.max(B.x0 + 70, x - 60))} ${B.drop - 10}`;
    dv += ' Z';
    fr += R(B.x0 + 70, B.drop - 30, B.x1 - B.x0 - 80, B.floor - B.drop + 22, 4, O('#7A5A8A', 4));
    fr += P(dv, O('#2E8A82', 5)) + P(dv, { fill: 'url(#hsCubes)' }) + P(`M${B.x0 + 70} ${B.front + 8} H${B.x1 - 12}`, LN(6, '#F2B84B'));
    if (tuck > 0.02) {
      const top = lerp(B.front - 6, B.top - 136, tuck);
      const tq = `M${B.x0 + 280} ${f(top + 40)} Q${B.x0 + 286} ${f(top - 4)} ${B.x0 + 350} ${f(top - 6)} Q${(B.x0 + B.x1) / 2 + 40} ${f(top + 4)} ${B.x0 + 560} ${f(top + 12)} Q${B.x1 - 140} ${f(top + 14)} ${B.x1 - 14} ${f(top + 34)} L${B.x1 - 14} ${B.front + 2} L${B.x0 + 280} ${B.front + 2} Z`;
      fr += P(tq, O('#2E8A82', 5)) + P(tq, { fill: 'url(#hsCubes)' }) + P(`M${B.x0 + 300} ${f(top + 18)} Q${B.x0 + 330} ${f(top + 2)} ${B.x0 + 380} ${f(top + 4)}`, LN(8, '#FFFFFF', 0.85));
    }
  }
  // ---------------- light
  let light = '';
  if (nite) {
    light += cover({ fill: '#060A26', opacity: 0.2 }) + darkRing(700, 560, 820, 480, '#03051A', 0.35, 10);
    light += P(dP([[W.x0 + 6, W.y0 + 6], [W.x1 - 6, W.y0 + 6], [W.x1 + 260, B.front + 20], [W.x0 + 80, B.front + 20]]), { fill: 'url(#hsBeamBlue)', opacity: 0.3 });
    if (monOn && alarm0 <= 0) light += glow(M.cx, M.cy, 230, 'hsGlowPurple', 0.45);
  } else if (eve) light += cover({ fill: '#FF8A50', opacity: 0.06 });
  else light += P(dP([[W.x0 + 6, W.y0 + 6], [W.x1 - 6, W.y0 + 6], [W.x1 + 300, 1000], [W.x0 + 120, 1000]]), { fill: 'url(#hsBeam)', opacity: 0.22 });
  if (lampK > 0.02) {
    const lx = BR.night.x0 + 40, ly = BR.night.top - 100;
    light += glow(lx, ly, 300, 'hsGlowWarm', 0.9 * lampK) + glow(lx + 260, 640, 380, 'hsGlowWarm', 0.42 * lampK) + pool(lx + 240, 820, 520, 160, '#FFD58A', 0.14 * lampK, 4);
  }
  if (doorK > 0 && o.hall !== false) light += P(dP([[BR.door.x0, BR.base], [BR.door.x1, BR.base], [BR.door.x1 + 40, 1080], [BR.door.x0 - 360 * doorK, 1080]]), { fill: 'url(#hsBeamHall)', opacity: f(0.5 * doorK) }) + glow((BR.door.x0 + BR.door.x1) / 2, 500, 260, 'hsGlowWarm', 0.45 * doorK);
  if (alarm > 0) light += cover({ fill: '#FF1028', opacity: f(0.2 * alarm) }) + glow(M.cx, M.cy, 460, 'hsGlowRed', alarm) + glow(M.cx - 520, 640, 420, 'hsGlowRed', 0.45 * alarm) + pool(M.cx - 240, 880, 760, 220, '#FF3A4A', 0.2 * alarm, 3);
  return { bg, mid: m, front: fr, fg: '', light };
}
const bedroom = makeSet(bedroomLayers);

// ================================================================= 4. STAIRS — upstairs landing (right) -> 12 steps down-LEFT -> hall
// Side view. The upstairs landing at the top RIGHT (floor y 420) with YOUR door (KNOCK FIRST!) and the bathroom door, a
// night-light; 12 carpeted steps descend to the LEFT (mustard runner on walnut treads) to the downstairs hall (floor y 940)
// with the archway into the LIVING ROOM (TV flicker at night) and the coat hooks (Dad's jacket, Granny's umbrella). Sage leaf
// wallpaper over a deep-green wainscot that follows the slope; YOUR school photos climb the wall year by year (from year 4 on you
// wear a headset). Front layer = the banister: handrail, one baluster per step, two newel posts (YOU run BEHIND them).
// Hero scale s .32 (SPOTS.stairs.s): running down = side view (faces left by default) along SPOTS.stairs.steps[i].
// opts: { time 'night'|'evening'|'day' (default night = 11 p.m.), heroDoor 0..1 (YOUR door opens), heroLight 'red'|'warm'|
//   'blue'|false (light spilling from YOUR room when the door is open; default 'red' at night = the alarm), tvGlow 0..1 (blue
//   flicker from the living-room archway; default 1 at night), lights (hall sconce on, default true in the evening),
//   nightLight (default true) }
const ST = { land: 420, x1: 1380, rise: 40, run: 80, n: 12 };
ST.floor = ST.land + (ST.n + 1) * ST.rise;                // 940
ST.x0 = ST.x1 - ST.n * ST.run;                             // 420
const stStep = (i) => ({ x: ST.x1 - (i + 0.5) * ST.run, y: ST.land + (i + 1) * ST.rise });
const stNose = (x) => clamp(ST.land + (ST.x1 - x) * (ST.rise / ST.run), ST.land, ST.floor - ST.rise);
function stairsLayers(t, o = {}) {
  const time = o.time || 'night', nite = time === 'night', eve = time === 'evening';
  const tvK = b01(o.tvGlow, nite ? 1 : 0), hk = b01(o.heroDoor);
  const lights = o.lights === undefined ? eve : !!o.lights;
  const tn = tone(nite ? { night: 0.82 } : eve ? { eve: 0.55 } : {});
  const C = tn.c, O = tn.ol, LN = tn.ln, FL = tn.fl;
  const flick = 0.75 + 0.25 * Math.sin(t * 13) * Math.sin(t * 4.1);
  let m = '';
  // walls: sage leaf paper + the cream wainscot following the slope
  m += cover(FL('#B9D0A6')) + cover({ fill: 'url(#hsLeafPaper)' });
  const railOff = 118;
  const wain = dP([[XL, ST.floor - railOff + 40], [ST.x0 - 40, ST.floor - railOff + 40], [ST.x0, ST.floor - ST.rise - railOff], [ST.x1, ST.land - railOff], [XR, ST.land - railOff], [XR, YB], [XL, YB]]);
  m += P(wain, FL('#5E9C88'));
  const dado = `M${XL} ${ST.floor - railOff + 40} L${ST.x0 - 40} ${ST.floor - railOff + 40} L${ST.x0} ${ST.floor - ST.rise - railOff} L${ST.x1} ${ST.land - railOff} L${XR} ${ST.land - railOff}`;
  m += P(dado, LN(13)) + P(dado, LN(7, '#FFF6E6'));
  m += R(XL, YT, XR - XL, 30 - YT, 0, FL('#F2EEE2')) + band(26, 40, O('#FFFFFF', 3.5));
  // upstairs: YOUR door (KNOCK FIRST!) + bathroom door + hamper + night-light
  {
    const dx0 = 1480, dx1 = 1660, dy = ST.land - 404;
    m += R(dx0 - 16, dy - 16, dx1 - dx0 + 32, ST.land - dy + 16, 4, O('#FFFFFF', 5));
    if (hk > 0) {
      const lc = o.heroLight === undefined ? (nite ? 'red' : 'warm') : o.heroLight;
      const inside = lc === 'red' ? '!#C8304A' : lc === 'blue' ? '!#4A6AC8' : lc === 'warm' ? '!#F2C27A' : '#2A2A40';
      m += R(dx0, dy, dx1 - dx0, ST.land - dy, 0, FL(inside));
      const xe = lerp(dx1, dx0 + 40, hk);
      m += P(dP([[dx0, dy], [xe, dy - 12 * hk], [xe, ST.land + 12 * hk], [dx0, ST.land]]), O('#E8E2F2', 5));
    } else m += R(dx0, dy, dx1 - dx0, ST.land - dy, 4, O('#E8E2F2', 5)) + P(dRR(dx0 + 20, dy + 24, dx1 - dx0 - 40, 140, 8) + dRR(dx0 + 20, dy + 190, dx1 - dx0 - 40, 160, 8), { fill: 'none', stroke: C('#C9C2DA'), 'stroke-width': 4 }) + CI(dx0 + 22, dy + 210, 9, O('#FFC23A', 3)) + G(R(-56, -28, 112, 56, 5, O('#FFFFFF', 3.5)) + TF('KNOCK', 0, -5, 15, C('#E25050')) + TF('FIRST!', 0, 14, 15, C('#E25050')), `translate(${(dx0 + dx1) / 2} ${dy + 96}) rotate(-3)`);
    m += R(1900, dy, 170, ST.land - dy, 4, O('#FFFFFF', 5)) + CI(1914, dy + 210, 8, O('#C9CED8', 3)) + G(R(-24, -16, 48, 32, 4, O('#7FC8E8', 3)) + P('M-12 4 q12 -16 24 0', LN(3, '#FFFFFF')), `translate(1985 ${dy + 90})`);
    m += R(1720, ST.land - 84, 72, 84, 10, O('#D9A45C', 4)) + P(`M1720 ${ST.land - 60} H1792 M1720 ${ST.land - 36} H1792`, LN(3, '#A8763A')) + P(`M1734 ${ST.land - 84} q14 -24 34 -4`, O('#E25050', 3));
    if (o.nightLight !== false) m += R(1424, ST.land - 64, 24, 30, 6, O('#FFFFFF', 3)) + CI(1436, ST.land - 52, 7, FL(nite ? '!#FFE28A' : '#F2E2B8'));
  }
  // school photos up the wall (year 1 at the bottom .. year 6 at the top) + a family portrait
  for (let i = 0; i < 6; i++) {
    const x = ST.x0 + 110 + i * 150, y = stNose(x) - railOff - 150 - (i % 2) * 18;
    m += familyFrame('school', x, y, 96, 112, (i % 2 ? 3 : -3), tn, { year: i + 1 });
  }
  m += familyFrame('beach', 1822, 160, 140, 96, 2, tn) + G(R(-18, -30, 36, 46, 8, O('#E8B84A', 3.5)) + P('M-14 16 h28 l-6 14 h-16 Z', O('#C98A2A', 3)) + E(0, -8, 10, 16, FL(lights ? '!#FFF2C0' : '#F2E2B8')), 'translate(1722 236)');
  // downstairs: the archway into the living room (TV flicker) + coat hooks + shoes
  {
    const ax0 = 70, ax1 = 330, ay = 560;
    m += P(`M${ax0 - 20} ${ST.floor} L${ax0 - 20} ${ay + 40} Q${ax0 - 20} ${ay - 40} ${(ax0 + ax1) / 2} ${ay - 46} Q${ax1 + 20} ${ay - 40} ${ax1 + 20} ${ay + 40} L${ax1 + 20} ${ST.floor} Z`, O('#FFFFFF', 5));
    const inside = nite ? '!' + mix('#1A2A5A', '#5AA8E8', 0.55 * tvK * flick) : eve ? '#E8B878' : '#E6CFAA';
    m += P(`M${ax0} ${ST.floor} L${ax0} ${ay + 40} Q${ax0} ${ay - 22} ${(ax0 + ax1) / 2} ${ay - 26} Q${ax1} ${ay - 22} ${ax1} ${ay + 40} L${ax1} ${ST.floor} Z`, FL(inside));
    m += P(`M${ax0} ${ST.floor - 40} L${ax0} ${ST.floor - 130} Q${ax0} ${ST.floor - 156} ${ax0 + 30} ${ST.floor - 156} L${ax0 + 150} ${ST.floor - 156} Q${ax0 + 176} ${ST.floor - 156} ${ax0 + 176} ${ST.floor - 130} L${ax0 + 176} ${ST.floor - 40} Z`, FL(nite ? '#0E1530' : '#2C7A80')) + R(ax0, ST.floor - 70, ax1 - ax0, 70, 0, { fill: '#000', opacity: 0.12 });
    m += R(-260, 600, 170, 16, 5, O('#9A6238', 3.5)) + CI(-230, 626, 6, O('#FFC23A', 2)) + CI(-120, 626, 6, O('#FFC23A', 2));
    m += P('M-230 628 Q-262 700 -250 800 L-196 800 Q-196 700 -226 628 Z', O('#B98A5A', 4)) + P('M-120 628 L-120 830 M-120 830 q0 22 -18 22', LN(7, '#8A5CFF')) + P('M-150 640 Q-120 600 -90 640 L-120 700 Z', O('#B07AD8', 3));
    m += P(`M380 ${ST.floor} q4 -24 30 -22 l24 6 q6 6 0 16 Z`, O('#5A5A6A', 3.5)) + P(`M-60 ${ST.floor} q4 -24 30 -22 l24 6 q6 6 0 16 Z`, O('#E25050', 3.5));
  }
  // the stairs: side panel (cream), walnut treads + mustard runner, under-stair cupboard
  {
    let prof = [[ST.x1, ST.land]];
    for (let i = 0; i < ST.n; i++) { const y = ST.land + (i + 1) * ST.rise; prof.push([ST.x1 - i * ST.run, y], [ST.x1 - (i + 1) * ST.run, y]); }
    m += P(dP([...prof, [ST.x0 - 10, ST.floor - ST.rise], [ST.x0 - 10, ST.floor], [ST.x1, ST.floor]]), O('#FFF6E6', 6));
    m += P(`M${ST.x1} ${ST.land + 66} L${ST.x0 - 10} ${ST.floor - 12}`, LN(5, '#E2D2B2'));
    m += P(dP([[ST.x1 - 60, ST.land + 120], [ST.x1 - 60, ST.floor - 30], [1230, ST.floor - 30], [1230, stNose(1230) + 90]]) + dP([[980, stNose(980) + 90], [980, ST.floor - 30], [ST.x0 + 120, ST.floor - 30], [ST.x0 + 120, stNose(ST.x0 + 120) + 90]]), { fill: 'none', stroke: C('#E8DCC2'), 'stroke-width': 5, 'stroke-linejoin': 'round' });
    m += P(dP([[1000, ST.floor], [1000, 800], [1044, 766], [1210, 766], [1210, ST.floor]]), O('#E8D8B8', 5)) + R(1040, 808, 130, 52, 6, { fill: 'none', stroke: C('#C9B48A'), 'stroke-width': 4 }) + CI(1022, 870, 8, O('#FFC23A', 2.5));
    const runner = 'M' + prof.map(([x, y]) => `${f(x)} ${f(y)}`).join(' L');
    m += P(runner, LN(24)) + P(runner, LN(14, '#E8A83A'));
    let nos = '';
    for (let i = 0; i < ST.n; i++) { const x = ST.x1 - (i + 1) * ST.run, y = ST.land + (i + 1) * ST.rise; nos += dRR(x - 8, y - 4, 22, 12, 5); }
    m += P(nos, O('#8A5A36', 3));
  }
  // floors: the landing (walnut edge) + the hall (oak + runner rug)
  m += R(ST.x1 - 4, ST.land - 6, XR - ST.x1, 14, 0, FL('#8A5A36')) + R(ST.x1, ST.land + 8, XR - ST.x1, 70, 0, O('#C9A070', 4));
  m += R(XL, ST.floor, XR - XL, YB - ST.floor, 0, FL('#D9A066')) + R(XL, ST.floor, XR - XL, YB - ST.floor, 0, { fill: 'url(#hsWoodGrain)' }) + P(`M${XL} ${ST.floor} H${XR}`, LN(5));
  m += P(dP([[-200, ST.floor + 20], [900, ST.floor + 20], [960, ST.floor + 90], [-260, ST.floor + 90]]), O('#C8603A', 4)) + P(dP([[-180, ST.floor + 32], [886, ST.floor + 32], [934, ST.floor + 78], [-232, ST.floor + 78]]), { fill: 'none', stroke: C('#F2B84B'), 'stroke-width': 4 });
  // ---------------- front: the banister (handrail + balusters + newels)
  let fr = '';
  {
    const ry = (x) => stNose(x) - 150;
    const xa = ST.x0 - 30, xb = ST.x1 + 10;
    let bal = '';
    for (let i = 0; i < ST.n; i++) { const s0 = stStep(i); bal += `M${f(s0.x)} ${f(s0.y - 4)} L${f(s0.x)} ${f(ry(s0.x) + 8)} `; }
    fr += P(bal, LN(12)) + P(bal, LN(6, '#FFF6E6'));
    fr += P(`M${xa} ${f(ry(xa) + 26)} L${xb} ${f(ry(xb))}`, LN(18)) + P(`M${xa} ${f(ry(xa) + 26)} L${xb} ${f(ry(xb))}`, LN(10, '#8A5A36'));
    const post = (x, y, h) => R(x - 18, y - h, 36, h, 5, O('#FFF6E6', 5)) + R(x - 24, y - h - 14, 48, 18, 6, O('#8A5A36', 4.5)) + CI(x, y - h - 28, 16, O('#A8703F', 4.5)) + R(x - 24, y - 20, 48, 20, 4, O('#8A5A36', 4));
    fr += post(ST.x0 - 40, ST.floor + 2, 210) + post(ST.x1 + 26, ST.land + 2, 150);
  }
  // ---------------- light
  let light = '';
  if (nite) {
    light += cover({ fill: '#070B26', opacity: 0.18 }) + darkRing(820, 560, 760, 440, '#03051A', 0.32, 10);
    if (o.nightLight !== false) light += glow(1436, ST.land - 52, 130, 'hsGlowWarm', 0.85);
    if (tvK > 0) light += glow(200, 760, 300, 'hsGlowTV', 0.7 * tvK * flick) + P(dP([[330, ST.floor - 380], [330, ST.floor], [760, ST.floor + 140], [700, ST.floor - 60]]), { fill: 'url(#hsBeamTV)', opacity: f(0.22 * tvK * flick) });
    if (hk > 0) {
      const lc = o.heroLight === undefined ? 'red' : o.heroLight;
      if (lc) light += glow(1570, 260, 300, lc === 'red' ? 'hsGlowRed' : lc === 'blue' ? 'hsGlowBlue' : 'hsGlowWarm', 0.75 * hk);
    }
  } else if (eve) light += cover({ fill: '#FF8A50', opacity: 0.05 });
  if (lights) light += glow(1722, 232, 260, 'hsGlowWarm', 0.7);
  return { bg: '', mid: m, front: fr, fg: '', light };
}
const stairs = makeSet(stairsLayers);

// ================================================================= 5. HOUSE EXTERIOR — the family's house from the street (camera set)
// One plane at k 1 holds the houses, front lawns, the box hedge, the sidewalk (stand line y 935) and the road (bottom).
// OUR HOUSE at x 960: two storeys, sky-blue siding with white trim, rust hip roof + a centre dormer, the chimney (smoke),
// the porch with white columns + the mustard porch swing + the RED front door + porch light, the living-room BAY WINDOW at
// the left (TV glow + family silhouettes at night), the kitchen window with a flower box at the right, three upstairs windows
// (parents' left, Granny's lace centre, YOURS right — o.heroWindow), the garage at the right (basketball hoop) with Dad's
// beige minivan on the driveway (plate DAD 78), the big oak with a tire swing at the left, the mailbox at the path.
// Neighbours repeat every 1700 px both ways; back row of roofs + trees (k .5), hills (k .2), sky (k 0), clouds (k .06),
// birds (k .7); flower bushes at the bottom corners (fg k 1.25). Hero s .22 on the sidewalk (s .18 on the lawn / porch).
// opts: { time 'morning'|'day'|'evening'|'night' (default morning = Saturday), tvGlow 0..1 (blue flicker in the bay window;
//   default 1 in the evening / at night), silhouettes (the family on the couch as silhouettes in the bay window),
//   heroWindow 'off'|'lit'|'glow'|'alarm' (default: evening 'lit', night 'glow' = PC blue; 'alarm' pulses red),
//   windows { living, kitchen, parents, granny, hero, porch } true/false overrides, car (default true), paper (the rolled
//   Saturday paper on the lawn; default true in the morning), smoke (default true), birds (default true by day),
//   carLights (the minivan's headlights on) }
const EX = { base: 700, stand: 935, walk: { y0: 880, y1: 962 }, road: 972, house: 960, every: 1700 };
function dadCar(x, y, s = 1, tn = tone(), o = {}) {
  const C = tn.c, O = tn.ol, LN = tn.ln, FL = tn.fl;
  let c = E(0, 0, 150, 14, { fill: '#000', opacity: 0.18 });
  c += R(-136, -40, 38, 44, 8, O('#2A2D38', 4)) + R(98, -40, 38, 44, 8, O('#2A2D38', 4));
  c += P('M-140 -36 L-140 -110 Q-138 -134 -112 -140 L-96 -196 Q-90 -214 -66 -214 L66 -214 Q90 -214 96 -196 L112 -140 Q138 -134 140 -110 L140 -36 Z', O('#E8D2A8', 5));
  c += P('M-88 -144 L-76 -196 Q-72 -204 -60 -204 L60 -204 Q72 -204 76 -196 L88 -144 Z', O(o.night ? '#2A3458' : '#A8D4EE', 4)) + P('M-60 -196 L-74 -150 M-30 -198 L-48 -150', LN(5, '#FFFFFF', 0.45));
  c += R(-124, -112, 54, 34, 10, O(o.lights ? '!#FFF4C0' : '#FFF8E0', 3.5)) + R(70, -112, 54, 34, 10, O(o.lights ? '!#FFF4C0' : '#FFF8E0', 3.5));
  c += R(-58, -110, 116, 40, 6, O('#C9B48A', 3.5)) + P('M-48 -100 H48 M-48 -90 H48 M-48 -80 H48', LN(2.5, '#9A8A62'));
  c += R(-150, -66, 300, 26, 8, O('#C9CED8', 4)) + R(-40, -60, 80, 22, 3, O('#FFFFFF', 2.5)) + TF('DAD 78', 0, -44, 14, C('#2E5FB8'));
  c += R(-150, -150, 18, 12, 4, O('#E8D2A8', 3)) + R(132, -150, 18, 12, 4, O('#E8D2A8', 3));
  return G(c, tr(x, y, s));
}
// a neighbour house (origin = centre x, base y). i picks the palette + shape
const NB_PAL = [['#F7D8A8', '#7A5CB8', '#3E9C97'], ['#CDE8C8', '#C8553D', '#F2B84B'], ['#F2D2DC', '#4A63A8', '#E25050'], ['#FFF0B8', '#3E8A6A', '#8A5CFF'], ['#D8E2F2', '#B9764A', '#3DA8D8']];
function nbHouse(x, y, i, tn, o = {}) {
  const [wall, roof, door] = NB_PAL[md(i, NB_PAL.length)];
  const w = 520 + 90 * hash(i * 2.3), h = 300 + 70 * hash(i * 3.1), two = hash(i * 7.7) > 0.5, H = two ? h + 110 : h;
  const lit = o.lit, win = (wx, wy, ww, wh, on) => R(wx, wy, ww, wh, 5, tn.ol(on ? '!#FFD27A' : '#BFE2F6', 4)) + P(`M${wx + ww / 2} ${wy} V${wy + wh} M${wx} ${wy + wh / 2} H${wx + ww}`, tn.ln(4, '#FFFFFF'));
  let s = R(x - w / 2, y - H, w, H, 4, tn.ol(wall, 5)) + R(x - w / 2, y - H, w, H, 4, { fill: 'url(#hsSiding)' });
  s += P(`M${x - w / 2 - 30} ${y - H + 8} L${x} ${y - H - 150} L${x + w / 2 + 30} ${y - H + 8} Z`, tn.ol(roof, 5)) + P(`M${x - w / 2 - 30} ${y - H + 8} L${x} ${y - H - 150} L${x + w / 2 + 30} ${y - H + 8} Z`, { fill: 'url(#hsShingle)' });
  s += win(x - w / 2 + 50, y - H + 46, 100, 86, lit && hash(i * 5.1) > 0.4) + win(x + w / 2 - 150, y - H + 46, 100, 86, lit && hash(i * 6.3) > 0.5);
  if (two) s += win(x - w / 2 + 50, y - 190, 100, 86, lit && hash(i * 8.9) > 0.6);
  s += R(x - 40, y - 176, 80, 176, 6, tn.ol(door, 4)) + CI(x + 24, y - 88, 6, tn.ol('#FFC23A', 2));
  return s;
}
// OUR HOUSE (origin = centre x, base y). o: night, tv (0..1 flicker k), sil, hero ('off'|'lit'|'glow'|'alarm'), win {..},
// t (smoke, swing, alarm pulse), smoke
function houseFront(x, y, tn, o = {}) {
  const C = tn.c, O = tn.ol, LN = tn.ln, FL = tn.fl;
  const t = o.t || 0, W = o.win || {};
  const dx = x - 960, X = (v) => v + dx, Y = (v) => v + (y - 700);
  let h = '';
  // garage (right) + basketball hoop
  h += R(X(1310), Y(450), 330, 250, 4, O('#9CC4E0', 6)) + R(X(1310), Y(450), 330, 250, 4, { fill: 'url(#hsSiding)' });
  h += P(`M${X(1294)} ${Y(462)} L${X(1475)} ${Y(372)} L${X(1656)} ${Y(462)} Z`, O('#C25A3C', 6)) + P(`M${X(1294)} ${Y(462)} L${X(1475)} ${Y(372)} L${X(1656)} ${Y(462)} Z`, { fill: 'url(#hsShingle)' });
  h += R(X(1340), Y(510), 270, 190, 4, O('#F6F2EA', 5)) + P(`M${X(1340)} ${Y(557)} H${X(1610)} M${X(1340)} ${Y(604)} H${X(1610)} M${X(1340)} ${Y(651)} H${X(1610)}`, LN(4, '#C9C3B4'));
  h += R(X(1440), Y(396), 72, 50, 4, O('#FFFFFF', 4)) + P(`M${X(1476)} ${Y(446)} v6`, LN(4)) + E(X(1476), Y(456), 24, 6, O('#E8603C', 3)) + P(`M${X(1454)} ${Y(460)} L${X(1462)} ${Y(490)} L${X(1490)} ${Y(490)} L${X(1498)} ${Y(460)}`, LN(2.5, '#FFFFFF'));
  // chimney + smoke
  h += R(X(690), Y(60), 64, 150, 4, O('#B9603C', 5)) + R(X(690), Y(60), 64, 150, 4, { fill: 'url(#hsBrick)' }) + R(X(682), Y(46), 80, 22, 4, O('#8A4228', 4));
  if (o.smoke !== false) {
    let sd = '';
    for (let i = 0; i < 4; i++) { const u = md(t * 0.12 + i / 4, 1); sd += dC(X(722) + u * 60 + Math.sin(t * 0.8 + i) * 10, Y(30) - u * 180, 14 + u * 22); }
    h += P(sd, { fill: o.night ? '#8A94B8' : '#FFFFFF', opacity: 0.45 });
  }
  // main block: siding + trim band between the floors
  h += R(X(600), Y(232), 720, 468, 4, O('#9CC4E0', 7)) + R(X(600), Y(232), 720, 468, 4, { fill: 'url(#hsSiding)' });
  h += R(X(600), Y(462), 720, 16, 0, O('#FFFFFF', 4)) + R(X(600), Y(670), 720, 30, 0, FL('#8AA8C2')) + R(X(590), Y(232), 20, 468, 3, O('#FFFFFF', 4)) + R(X(1310), Y(232), 20, 468, 3, O('#FFFFFF', 4));
  // rust hip roof + dormer (round window)
  h += P(`M${X(566)} ${Y(246)} L${X(700)} ${Y(96)} L${X(1220)} ${Y(96)} L${X(1354)} ${Y(246)} Z`, O('#C25A3C', 7)) + P(`M${X(566)} ${Y(246)} L${X(700)} ${Y(96)} L${X(1220)} ${Y(96)} L${X(1354)} ${Y(246)} Z`, { fill: 'url(#hsShingle)' });
  h += P(`M${X(556)} ${Y(250)} L${X(1364)} ${Y(250)}`, LN(14)) + P(`M${X(556)} ${Y(250)} L${X(1364)} ${Y(250)}`, LN(7, '#FFFFFF'));
  h += R(X(900), Y(96), 120, 110, 4, O('#9CC4E0', 5)) + P(`M${X(884)} ${Y(104)} L${X(960)} ${Y(40)} L${X(1036)} ${Y(104)} Z`, O('#C25A3C', 5)) + CI(X(960), Y(150), 32, O(W.attic ? '!#FFD27A' : '#BFE2F6', 4)) + P(`M${X(928)} ${Y(150)} H${X(992)} M${X(960)} ${Y(118)} V${Y(182)}`, LN(4, '#FFFFFF'));
  // windows
  const glass = (on, col) => (on ? '!' + (col || '#FFD27A') : (o.night ? '#2A3458' : '#BFE2F6'));
  const win = (x0, y0, w, hh, on, col, extra = '') => R(X(x0) - 10, Y(y0) - 10, w + 20, hh + 20, 4, O('#FFFFFF', 4)) + R(X(x0), Y(y0), w, hh, 3, O(glass(on, col), 3.5)) + extra + P(`M${X(x0 + w / 2)} ${Y(y0)} V${Y(y0 + hh)} M${X(x0)} ${Y(y0 + hh / 2)} H${X(x0 + w)}`, LN(5, '#FFFFFF')) + (on ? '' : P(`M${X(x0 + 8)} ${Y(y0 + hh - 10)} L${X(x0 + w * 0.42)} ${Y(y0 + 8)}`, LN(6, '#FFFFFF', o.night ? 0.12 : 0.5)));
  // upstairs: parents (left), Granny (centre, lace), YOURS (right)
  h += win(668, 300, 120, 112, W.parents) + R(X(658), Y(414), 140, 14, 4, O('#FFFFFF', 3));
  h += win(902, 310, 116, 100, W.granny, '#FFE2A8', P(`M${X(902)} ${Y(310)} Q${X(930)} ${Y(360)} ${X(902)} ${Y(410)} M${X(1018)} ${Y(310)} Q${X(990)} ${Y(360)} ${X(1018)} ${Y(410)}`, LN(8, '#FFFFFF', 0.85)));
  const hw = o.hero || 'off';
  const pulse = 0.6 + 0.4 * Math.sin(t * Math.PI * 2 * 1.4);
  const hcol = hw === 'alarm' ? mix('#8A1020', '#FF3A4A', pulse) : hw === 'glow' ? '#6A9CFF' : '#FFD27A';
  h += win(1132, 300, 120, 112, hw !== 'off', hcol, hw !== 'off' ? R(X(1150), Y(318), 36, 46, 2, FL(hw === 'alarm' ? '!#5A0A14' : hw === 'glow' ? '!#2A3A8A' : '!#C98A3A')) + T('CC', X(1168), Y(350), 16, C('!#FFE14D')) : '') + R(X(1122), Y(414), 140, 14, 4, O('#FFFFFF', 3));
  // ground floor: the bay window (living room), porch + door, kitchen window + flower box
  {
    const tv = o.tv || 0, lit = W.living !== undefined ? W.living : o.night;
    const bx0 = 626, bx1 = 846, by0 = 522, by1 = 646;
    h += P(`M${X(bx0 - 20)} ${Y(by1 + 24)} L${X(bx0 - 20)} ${Y(by0 - 4)} L${X(bx0 + 30)} ${Y(by0 - 26)} L${X(bx1 - 30)} ${Y(by0 - 26)} L${X(bx1 + 20)} ${Y(by0 - 4)} L${X(bx1 + 20)} ${Y(by1 + 24)} Z`, O('#FFFFFF', 5));
    const inside = tv > 0 ? '!' + mix('#2A4A8A', '#8FD8FF', 0.6 * tv) : lit ? '!#FFD27A' : (o.night ? '#2A3458' : '#BFE2F6');
    h += P(`M${X(bx0)} ${Y(by1)} L${X(bx0)} ${Y(by0)} L${X(bx0 + 40)} ${Y(by0 - 12)} L${X(bx1 - 40)} ${Y(by0 - 12)} L${X(bx1)} ${Y(by0)} L${X(bx1)} ${Y(by1)} Z`, O(inside, 3.5));
    if (o.sil) {
      const sc = tv > 0 ? '!#1A2448' : '!#7A4A2A';
      h += P(dRR(X(672), Y(586), 34, 34, 8) + dRR(X(712), Y(578), 36, 36, 8) + dRR(X(752), Y(584), 34, 34, 8) + dRR(X(796), Y(592), 30, 30, 8) + dRR(X(650), Y(616), 200, 40, 10), FL(sc)) + P(dC(X(676), Y(578), 8) + dC(X(702), Y(578), 8) + dC(X(790), Y(586), 8) + dC(X(806), Y(586), 8), FL(sc));
    }
    h += P(`M${X(bx0 + 40)} ${Y(by0 - 12)} L${X(bx0 + 40)} ${Y(by1)} M${X(bx1 - 40)} ${Y(by0 - 12)} L${X(bx1 - 40)} ${Y(by1)} M${X(bx0)} ${Y(560)} H${X(bx1)}`, LN(6, '#FFFFFF'));
    h += P(`M${X(bx0 - 30)} ${Y(by0 - 4)} L${X(bx0 + 30)} ${Y(by0 - 40)} L${X(bx1 - 20)} ${Y(by0 - 40)} L${X(bx1 + 16)} ${Y(by0 - 4)} Z`, O('#C25A3C', 4));
    // porch: floor + steps, the red door, number, porch light, the swing, porch roof on two columns, rail
    h += R(X(858), Y(676), 340, 26, 3, O('#E8E2D4', 4)) + R(X(884), Y(700), 140, 14, 3, O('#D8D2C4', 3.5)) + R(X(896), Y(712), 116, 14, 3, O('#C9C3B4', 3.5));
    h += R(X(886), Y(492), 108, 184, 6, O('#E25050', 5)) + R(X(906), Y(512), 68, 50, 6, O(glass(W.porch ?? false, '#FFE6B0'), 3)) + P(dRR(X(904), Y(578), 72, 82, 5), { fill: 'none', stroke: C('#B83A3A'), 'stroke-width': 4 }) + CI(X(976), Y(602), 6, O('#FFC23A', 2.5));
    h += G(R(-24, -10, 48, 20, 4, O('#FFFFFF', 3)) + TF('27', 0, 6, 14, C('#2E5FB8')), `translate(${X(1030)} ${Y(524)})`);
    h += R(X(1018), Y(552), 18, 26, 5, O('#2A2D38', 3)) + R(X(1021), Y(556), 12, 18, 3, FL(o.night || W.porch ? '!#FFE28A' : '#F2E2B8'));
    const sw = Math.sin(t * 0.9) * 3;
    h += G(P('M-38 0 V62 M38 0 V62', LN(3)) + R(-48, 62, 96, 14, 4, O('#F2B84B', 3.5)) + R(-44, 38, 88, 26, 6, O('#F2B84B', 3.5)) + R(-30, 44, 28, 18, 6, O('#E86A8A', 2.5)), `translate(${X(1112)} ${Y(498)}) rotate(${f(sw)})`);
    h += P(`M${X(860)} ${Y(490)} L${X(1210)} ${Y(490)} L${X(1188)} ${Y(458)} L${X(882)} ${Y(458)} Z`, O('#C25A3C', 5)) + R(X(860), Y(488), 350, 14, 3, O('#FFFFFF', 4));
    h += R(X(866), Y(500), 16, 178, 4, O('#FFFFFF', 4)) + R(X(1182), Y(500), 16, 178, 4, O('#FFFFFF', 4));
    let rail = '';
    for (let i = 0; i < 5; i++) rail += `M${X(1050 + i * 28)} ${Y(642)} V${Y(676)} `;
    h += P(`M${X(1036)} ${Y(642)} H${X(1180)}`, LN(8, '#FFFFFF')) + P(rail, LN(5, '#FFFFFF'));
    // kitchen window + flower box
    const kl = W.kitchen !== undefined ? W.kitchen : !!o.eve;
    h += win(1218, 532, 82, 92, kl) + R(X(1206), Y(628), 106, 20, 4, O('#C98A52', 3.5)) + P(dC(X(1222), Y(626), 10) + dC(X(1246), Y(622), 11) + dC(X(1272), Y(624), 10) + dC(X(1294), Y(626), 9), O('#E86A8A', 2.5)) + P(dC(X(1234), Y(630), 7) + dC(X(1284), Y(630), 7), FL('#5DB55A'));
  }
  // foundation bushes along the front
  const fb = dC(X(612), Y(690), 30) + dC(X(650), Y(684), 34) + dC(X(1236), Y(688), 32) + dC(X(1282), Y(692), 28) + dR(X(590), Y(686), 100, 18) + dR(X(1210), Y(686), 110, 18);
  h += P(fb, { fill: tn.line, stroke: tn.line, 'stroke-width': 8, 'stroke-linejoin': 'round' }) + P(fb, FL('#4FA85A')) + P(dC(X(640), Y(672), 6) + dC(X(1262), Y(676), 6) + dC(X(620), Y(690), 5), FL('#FF8FC0'));
  return h;
}
function houseExteriorLayers(t, cam = {}, o = {}) {
  cam = cam || {};
  const time = o.time || 'morning', morn = time === 'morning', eve = time === 'evening', nite = time === 'night';
  const dark = eve || nite;
  const tn = tone(nite ? { night: 0.85 } : eve ? { eve: 0.7 } : morn ? { morn: 0.5 } : {});
  const C = tn.c, O = tn.ol, LN = tn.ln, FL = tn.fl;
  const flick = 0.7 + 0.3 * Math.sin(t * 15) * Math.sin(t * 4.3);
  const tvK = b01(o.tvGlow, dark ? 1 : 0) * flick;
  // ---- sky (k 0)
  const v0 = vis(cam, 0);
  const SK = [v0.x0 - 200, v0.y0 - 200, v0.x1 + 200, v0.y1 + 200];
  let sky = R(SK[0], SK[1], SK[2] - SK[0], SK[3] - SK[1], 0, { fill: `url(#${nite ? 'hsSkyNight' : eve ? 'hsSkyEvening' : morn ? 'hsSkyMorning' : 'hsSkyDay'})` });
  if (nite) sky += R(SK[0], SK[1], SK[2] - SK[0], 620 - SK[1], 0, { fill: 'url(#hsStars)' });
  const sunP = nite ? [1560, 150] : eve ? [1620, 560] : morn ? [330, 300] : [1500, 150];
  let sun = nite ? glow(sunP[0], sunP[1], 170, 'hsGlowMoon', 0.9) + CI(sunP[0], sunP[1], 44, { fill: '#FFF4C8', stroke: '#E8D490', 'stroke-width': 5 }) + CI(sunP[0] - 14, sunP[1] - 10, 9, { fill: '#F0E2A8' }) + CI(sunP[0] + 14, sunP[1] + 14, 6, { fill: '#F0E2A8' })
    : glow(sunP[0], sunP[1], 220, 'hsGlowWarm', 0.9) + CI(sunP[0], sunP[1], 60, { fill: eve ? '#FFD08A' : '#FFE45C', stroke: '#FFB42E', 'stroke-width': 7 });
  // ---- clouds (k .06)
  const vc = vis(cam, 0.06);
  let cl = '';
  for (let i = Math.floor((vc.x0 - 500) / 760); i * 760 < vc.x1 + 500; i++) {
    const x = i * 760 + md(hash(i * 2.7) * 400 + t * (5 + 5 * hash(i)), 760), y = 110 + 200 * hash(i * 9.3), s = 0.5 + 0.45 * hash(i * 5.5);
    cl += hsCloud(x, y, s, tn, nite ? '#3A4A80' : eve ? '#FFD6E6' : '#FFFFFF', nite ? '#2A3666' : eve ? '#F2A0C0' : morn ? '#FFE2CC' : '#DCEBFA');
  }
  // ---- hills (k .2) + far pines
  const vh = vis(cam, 0.2);
  let hills = '';
  {
    const pts = [];
    for (let x = Math.floor((vh.x0 - 400) / 160) * 160; x < vh.x1 + 400; x += 160) pts.push([x, 520 - 50 * Math.sin(x * 0.0024) - 36 * hash(Math.round(x / 160) * 1.7)]);
    let d = `M${pts[0][0]} 1400 L${pts[0][0]} ${f(pts[0][1])}`;
    for (let j = 1; j < pts.length; j++) d += ` Q${f((pts[j - 1][0] + pts[j][0]) / 2)} ${f(Math.min(pts[j - 1][1], pts[j][1]) - 28)} ${f(pts[j][0])} ${f(pts[j][1])}`;
    d += ` L${pts[pts.length - 1][0]} 1400 Z`;
    hills += P(d, FL(eve ? '#9A86B8' : '#A6D8A4'));
    let tr2 = '';
    for (let x = Math.floor(vh.x0 / 230) * 230; x < vh.x1; x += 230) if (hash(x * 0.013) > 0.4) { const by = 540 - 50 * Math.sin(x * 0.0024); tr2 += dE(x + 60 * hash(x), by - 30, 34, 40); }
    hills += P(tr2, FL(eve ? '#7A6A9A' : '#7CC08A'));
  }
  // ---- back row of roofs + trees (k .5)
  const vb = vis(cam, 0.5);
  let back = R(vb.x0 - 300, 590, vb.x1 - vb.x0 + 600, 900, 0, FL(eve ? '#7EA060' : '#86C874'));
  for (let i = Math.floor((vb.x0 - 500) / 600); i * 600 < vb.x1 + 500; i++) {
    const x = i * 600 + 120 * hash(i * 3.7), pal = NB_PAL[md(i * 3, NB_PAL.length)];
    const hz = (c) => mix(c, eve ? '#E8B0C8' : nite ? '#4A5A90' : '#CFE8FF', 0.4);
    back += R(x - 170, 450, 340, 150, 4, O(hz(pal[0]), 4)) + P(`M${x - 196} 458 L${x} 340 L${x + 196} 458 Z`, O(hz(pal[1]), 4)) + R(x - 110, 490, 56, 46, 4, O(dark && hash(i * 2.2) > 0.4 ? '!#FFD27A' : hz('#BFE2F6'), 3)) + R(x + 54, 490, 56, 46, 4, O(dark && hash(i * 4.4) > 0.6 ? '!#FFD27A' : hz('#BFE2F6'), 3));
    if (hash(i * 4.9) > 0.3) back += oakTree(x + 300, 640, 0.6, tn, { col: hz('#5DB55A'), hi: hz('#8FD67A'), sway: Math.sin(t * 0.8 + i) * 1.1 });
  }
  // ---- birds (k .7)
  let fly = '';
  if (o.birds === undefined ? !dark : o.birds) {
    for (let i = 0; i < 4; i++) {
      const u = md(t * 0.03 + i * 0.09, 1), x = -400 + u * 3200 + i * 60 + (cam.x || 0) * 0.7, y = 240 + i * 26 + Math.sin(t * 1.3 + i) * 12;
      fly += hsBird(x, y, 0.7, tn, { flying: true, flap: md(t * 4.4 + i * 0.37, 1), col: '#4A5A7A', belly: '#C9D3E6' });
    }
  }
  // ---- the street plane (k 1)
  const v1 = vis(cam, 1);
  const X0 = v1.x0 - 400, X1 = v1.x1 + 400;
  let m = '';
  m += R(X0, 560, X1 - X0, EX.walk.y0 - 560, 0, FL('#6CC85E')) + R(X0, 560, X1 - X0, EX.walk.y0 - 560, 0, { fill: 'url(#hsLawn)' });
  // neighbours
  for (let i = -4; i <= 4; i++) {
    if (i === 0) continue;
    const x = EX.house + i * EX.every;
    if (x + 500 < X0 || x - 500 > X1) continue;
    m += nbHouse(x, EX.base, i + 10, tn, { lit: dark });
    m += oakTree(x + (i % 2 ? 420 : -440), EX.base + 40, 0.9, tn, { sway: Math.sin(t * 0.8 + i) * 1.2 });
  }
  // driveway + path + OUR HOUSE
  m += P(dP([[1338, EX.base], [1612, EX.base], [1700, EX.walk.y0], [1290, EX.walk.y0]]), O('#D6D2CA', 4)) + P(`M1475 ${EX.base} L1495 ${EX.walk.y0}`, LN(3, '#B9B4AA'));
  m += P(dE(948, 742, 52, 12) + dE(946, 782, 58, 14) + dE(944, 826, 64, 16) + dE(942, 868, 70, 16), O('#E8E2D4', 3.5));
  const W = { ...(o.windows || {}) };
  if (W.porch === undefined) W.porch = dark;
  if (W.parents === undefined) W.parents = eve;
  if (W.granny === undefined) W.granny = eve;
  if (W.living === undefined && !tvK) W.living = eve;
  const hero = o.heroWindow || (W.hero === true ? 'lit' : W.hero === false ? 'off' : nite ? 'glow' : eve ? 'lit' : 'off');
  if (EX.house + 800 > X0 && EX.house - 800 < X1) {
    m += houseFront(EX.house, EX.base, tn, { night: dark, eve, t, tv: W.living === false ? 0 : tvK, sil: !!o.silhouettes, hero, win: W, smoke: o.smoke });
    // the oak with the tire swing (left), the mailbox, the car, the paper
    m += oakTree(360, EX.base + 60, 1.15, tn, { sway: Math.sin(t * 0.7) * 1.2 });
    const ts = Math.sin(t * 1.1) * 4;
    m += G(P('M0 0 V190', LN(4)) + E(0, 214, 34, 28, O('#2A2D38', 5)) + E(0, 214, 16, 12, FL('#6CC85E')), `translate(268 ${EX.base - 266}) rotate(${f(ts)})`);
    m += G(R(-7, -150, 14, 150, 3, O('#8A5A36', 4)) + P('M-40 -150 L-40 -186 Q-40 -210 0 -210 Q40 -210 40 -186 L40 -150 Z', O('#3E9C97', 4.5)) + R(36, -218, 7, 40, 2, O('#E25050', 2.5)) + R(36, -218, 22, 14, 2, O('#E25050', 2.5)) + TF('27', 0, -168, 15, C('#FFFFFF')), `translate(840 ${EX.stand - 30})`);
    if (o.car !== false) m += dadCar(1478, EX.walk.y0 + 8, 1, tn, { night: dark, lights: !!o.carLights });
    if (o.paper === undefined ? morn : o.paper) m += G(R(-30, -12, 60, 24, 12, O('#F2EEE4', 3)) + P('M-14 -12 V12 M10 -12 V12', LN(3, '#E25050')), `translate(1120 790) rotate(-12)`);
  }
  // hedge along the sidewalk (gaps at the path + the driveway)
  {
    let hd = '';
    const gaps = [[870, 1020], [1270, 1720]];
    for (let x = Math.floor(X0 / 60) * 60; x < X1; x += 60) {
      const xr = md(x - 300, EX.every) + 300;
      if (gaps.some(([a, b]) => xr > a && xr < b)) continue;
      hd += dC(x + 30, EX.walk.y0 - 30, 34) + dR(x, EX.walk.y0 - 30, 60, 30);
    }
    m += P(hd, { fill: tn.line, stroke: tn.line, 'stroke-width': 8 }) + P(hd, FL('#4FA85A'));
  }
  // sidewalk, curb, road + centre dashes
  m += R(X0, EX.walk.y0, X1 - X0, EX.walk.y1 - EX.walk.y0, 0, FL('#E9E2D6')) + R(X0, EX.walk.y1, X1 - X0, EX.road - EX.walk.y1, 0, FL('#BDB6AA')) + R(X0, EX.road, X1 - X0, 1500 - EX.road, 0, FL(dark ? '#5A5A78' : '#7C8096')) + R(X0, EX.road, X1 - X0, 1500 - EX.road, 0, { fill: 'url(#hsRoad)' });
  let jn = '';
  for (let x = Math.floor(X0 / 150) * 150; x < X1; x += 150) jn += `M${x} ${EX.walk.y0} L${x - 20} ${EX.walk.y1} `;
  m += P(jn, LN(3, '#C9C1B2')) + P(`M${X0} ${EX.walk.y0} H${X1} M${X0} ${EX.walk.y1} H${X1} M${X0} ${EX.road} H${X1}`, LN(4, LINE, 0.55)) + P(`M${X0} 1130 H${X1}`, { fill: 'none', stroke: C('#FFE6A0'), 'stroke-width': 9, 'stroke-dasharray': '70 60' });
  // streetlamps (lit at dusk / night)
  let lamps = '', lampGlow = '';
  for (let i = Math.floor((X0 - 60) / EX.every) - 1; 60 + i * EX.every < X1 + 200; i++) {
    const lx = 60 + i * EX.every;
    lamps += R(lx - 8, EX.walk.y0 - 330, 16, 340, 4, O('#3A3F52', 4)) + P(`M${lx} ${EX.walk.y0 - 330} Q${lx} ${EX.walk.y0 - 370} ${lx + 40} ${EX.walk.y0 - 372}`, LN(8)) + P(`M${lx + 20} ${EX.walk.y0 - 378} L${lx + 64} ${EX.walk.y0 - 378} L${lx + 56} ${EX.walk.y0 - 356} L${lx + 28} ${EX.walk.y0 - 356} Z`, O('#3A3F52', 4)) + E(lx + 42, EX.walk.y0 - 354, 14, 5, FL(dark ? '!#FFF0B0' : '#E8E2C8'));
    if (dark) lampGlow += glow(lx + 42, EX.walk.y0 - 340, 200, 'hsGlowWarm', 0.8) + P(dP([[lx + 28, EX.walk.y0 - 356], [lx + 56, EX.walk.y0 - 356], [lx + 160, EX.walk.y1], [lx - 76, EX.walk.y1]]), { fill: 'url(#hsBeam)', opacity: 0.3 });
  }
  m += lamps;
  // ---- fg (k 1.25): flower bushes at the bottom corners
  const vf = vis(cam, 1.25);
  let fg = '';
  for (let i = Math.floor((vf.x0 - 600) / 2400); i * 2400 < vf.x1 + 600; i++) {
    for (const bx of [i * 2400 - 120, i * 2400 + 2000]) {
      const bd = dC(bx - 70, 1130, 70) + dC(bx + 20, 1100, 84) + dC(bx + 110, 1134, 66) + dR(bx - 140, 1120, 320, 120);
      fg += P(bd, { fill: tn.line, stroke: tn.line, 'stroke-width': 12, 'stroke-linejoin': 'round' }) + P(bd, FL('#3E9A52')) + P(dC(bx - 40, 1110, 30) + dC(bx + 40, 1070, 34), FL('#5DB55A')) + P(dC(bx - 30, 1070, 10) + dC(bx + 60, 1058, 10) + dC(bx + 120, 1096, 9), O(nite ? '#C86A9A' : '#FF8FC0', 3)) + P(dC(bx + 10, 1090, 9) + dC(bx - 80, 1100, 8), O('#FFE14D', 3));
    }
  }
  // ---- light
  let light = '';
  if (dark) light += V(cam, lampGlow, 1);
  if (dark && tvK > 0) light += V(cam, glow(736, 590, 190, 'hsGlowTV', 0.7 * tvK) + pool(740, 720, 200, 40, '#8FD8FF', 0.14 * tvK, 3), 1);
  if (dark && hero === 'alarm') light += V(cam, glow(1192, 356, 190, 'hsGlowRed', 0.6 + 0.4 * Math.sin(t * Math.PI * 2 * 1.4)), 1);
  else if (dark && hero === 'glow') light += V(cam, glow(1192, 356, 150, 'hsGlowBlue', 0.6), 1);
  if (dark) light += V(cam, glow(1028, 566, 110, 'hsGlowWarm', 0.8), 1);
  if (nite) light += V(cam, R(v0.x0 - 300, v0.y0 - 300, v0.x1 - v0.x0 + 600, v0.y1 - v0.y0 + 600, 0, { fill: '#060A26', opacity: 0.12 }), 0);
  else if (morn) light += V(cam, R(v0.x0 - 300, v0.y0 - 300, v0.x1 - v0.x0 + 600, v0.y1 - v0.y0 + 600, 0, { fill: '#FFB060', opacity: 0.05 }), 0);
  else if (eve) light += V(cam, R(v0.x0 - 300, v0.y0 - 300, v0.x1 - v0.x0 + 600, v0.y1 - v0.y0 + 600, 0, { fill: '#FF6A9A', opacity: 0.06 }), 0);
  return layersOf(V(cam, sky, 0) + V(cam, sun, 0.03) + V(cam, cl, 0.06) + V(cam, hills, 0.2) + V(cam, back, 0.5) + V(cam, fly, 0.7), V(cam, m, 1), V(cam, fg, 1.25), light);
}
const houseExterior = (t = 0, cam = {}, o = {}) => String(houseExteriorLayers(t, cam, o));
houseExterior.layers = houseExteriorLayers;

// ================================================================= 6. KEYBOARD CLOSE — Dad's ancient laptop, POV ("Where's the B?", "SPACE! BAR!")
// Dad's chunky grey "DELL-O" laptop (the same one as rig/extras.js laptopOld: gold #1 star sticker on the bezel) seen from
// above + in front (his lap). The keyboard deck fills the lower frame in
// perspective (rows grow toward the camera; it is wider than the frame): ESC/F-row, numbers, QWERTY, ASDF, ZXCV and a HUGE SPACE BAR (~760 px wide, y ~700..770,
// clear of the captions); the trackpad + palm rest below (an I ♥ TAXES sticker, a coffee ring); the sticky note
// "PASSWORD: password" on the bezel. The lid rises from the hinge (y 400): the screen's lower part is in frame (o.screen svg|fn(w,h) is
// drawn into SPOTS.keyboardClose.screen = 1400 x 840 centred (960, -50); only y 0..370 (its bottom 45%) shows at the default
// framing — put the username field low, or pan the camera up: {y: -420, zoom .85} shows the whole display). Around it: the living room out of focus.
// Anchors: SPOTS.keyboardClose.keys[label] = { x, y (top-face centre), w, h, s (row scale) } for EVERY key ('A'..'Z', '0'..'9',
// 'SPACE', 'ENTER', 'SHIFT', 'CAPS', 'TAB', 'BACK', 'ESC', 'F1'..'F12', ...), .finger = the hover point above the keyboard,
// .hand = where Dad's arm enters (bottom right), H.keyAt(label) -> the key box.
// opts: { screen svg|fn(w,h), time 'evening'|'night'|'day' (default evening), glow 0..1 (screen light on the keys; default
//   .5 evening, 1 at night), glowCol (default '#9FD0FF'), highlight 'B' | ['B', 'SPACE'] (glowing yellow key tops + a ring),
//   press { key, k } or [{...}] (key pushed down k 0..1), caps (CAPS LOCK LED on), jumpLabel (masking tape "JUMP!" on the space
//   bar — Dad has been practicing), crumbs (cookie crumbs), notes (sticker + coffee ring + PASSWORD note; default true), worn
//   (rubbed-off letters on E, A, S, N; default true) }
const KB = { hinge: 400, front: 1300, wTop: 1560, wFront: 3000, cx: 960 };
KB.yh = (KB.wFront * KB.hinge - KB.wTop * KB.front) / (KB.wFront - KB.wTop);
KB.z0 = (KB.front - KB.yh) / (KB.hinge - KB.yh);
KB.K = KB.front - KB.yh;
const kbZ = (v) => KB.z0 - (KB.z0 - 1) * v;
const kbY = (v) => KB.yh + KB.K / kbZ(v);
const kbPt = (u, v) => [KB.cx + (u - 0.5) * KB.wFront / kbZ(v), kbY(v)];
const kbQ = (u0, v0, u1, v1) => dP([kbPt(u0, v0), kbPt(u1, v0), kbPt(u1, v1), kbPt(u0, v1)]);
// key layout: rows of [label, width in u], 15u per row (F-row 14 keys)
const KB_ROWS = [
  { v0: 0.05, v1: 0.1, keys: [['ESC', 1.07], ...Array.from({ length: 12 }, (_, i) => ['F' + (i + 1), 1.07]), ['DEL', 1.09]] },
  { v0: 0.11, v1: 0.198, keys: [['`', 1], ['1', 1], ['2', 1], ['3', 1], ['4', 1], ['5', 1], ['6', 1], ['7', 1], ['8', 1], ['9', 1], ['0', 1], ['-', 1], ['=', 1], ['BACK', 2]] },
  { v0: 0.204, v1: 0.292, keys: [['TAB', 1.5], ...'QWERTYUIOP'.split('').map((k) => [k, 1]), ['[', 1], [']', 1], ['\\', 1.5]] },
  { v0: 0.298, v1: 0.386, keys: [['CAPS', 1.75], ...'ASDFGHJKL'.split('').map((k) => [k, 1]), [';', 1], ["'", 1], ['ENTER', 2.25]] },
  { v0: 0.392, v1: 0.48, keys: [['SHIFT', 2.25], ...'ZXCVBNM'.split('').map((k) => [k, 1]), [',', 1], ['.', 1], ['/', 1], ['RSHIFT', 2.75]] },
  { v0: 0.486, v1: 0.574, keys: [['CTRL', 1.5], ['FN', 1], ['ALT', 1.5], ['SPACE', 6.5], ['RALT', 1.5], ['LEFT', 1], ['DOWN', 1], ['RIGHT', 1]] },
];
const KB_U0 = 0.08, KB_U1 = 0.92;
const KEYS = {};
for (const row of KB_ROWS) {
  const tot = row.keys.reduce((a, [, w]) => a + w, 0), unit = (KB_U1 - KB_U0) / tot;
  let u = KB_U0;
  for (const [lab, w] of row.keys) {
    const u0 = u + unit * 0.06, u1 = u + unit * w - unit * 0.06, v0 = row.v0, v1 = row.v1;
    const vm = (v0 + v1) / 2, [x0] = kbPt(u0, vm), [x1] = kbPt(u1, vm), y0 = kbY(v0), y1 = kbY(v1);
    const r1 = (n) => Math.round(n * 10) / 10;
    KEYS[lab] = { x: r1((x0 + x1) / 2), y: r1((y0 + y1) / 2 - 4), w: r1(x1 - x0), h: r1(y1 - y0), s: Math.round(100 / kbZ(vm)) / 100, u0, u1, v0, v1 };
    u += unit * w;
  }
}
const keyAt = (k) => { const v = KEYS[String(k).toUpperCase()] || KEYS[k]; return v ? { x: v.x, y: v.y, w: v.w, h: v.h, s: v.s } : null; };
const KB_LABEL = { BACK: '⌫', ENTER: 'ENTER', SHIFT: 'SHIFT', RSHIFT: 'SHIFT', CAPS: 'CAPS', TAB: 'TAB', CTRL: 'CTRL', ALT: 'ALT', RALT: 'ALT', FN: 'FN', SPACE: '', LEFT: '◀', DOWN: '▼', RIGHT: '▶', ESC: 'ESC', DEL: 'DEL' };
// screen: the lid's display (trapezoid), content box 1060 x 630 centred (960, 125)
const KBS = { cx: 960, cy: -50, w: 1400, h: 840, pts: [[262, -470], [1658, -470], [1698, 370], [222, 370]] };
def(`<clipPath id="hsClipKBScr"><path d="${dP(KBS.pts)}"/></clipPath>`);
function keyboardCloseLayers(t, o = {}) {
  const time = o.time || 'evening', nite = time === 'night', day = time === 'day';
  const tn = tone(nite ? { night: 0.6 } : day ? {} : { eve: 0.35 });
  const C = tn.c, O = tn.ol, LN = tn.ln, FL = tn.fl;
  const gk = b01(o.glow, nite ? 1 : day ? 0.2 : 0.5), gcol = o.glowCol || '#9FD0FF';
  const hl = new Set([].concat(o.highlight || []).map((k) => String(k).toUpperCase()));
  const presses = {};
  for (const p of [].concat(o.press || [])) if (p && p.key) presses[String(p.key).toUpperCase()] = b01(p.k ?? 1);
  // ---------------- bg: the living room, out of focus
  let bg = cover(FL('#E2CFAE')) + cover({ fill: 'url(#hsDiamond)', opacity: 0.5 }) + R(XL, 330, XR - XL, 1400, 0, FL('#2C7A80'));
  bg += P(dRR(-300, 300, 660, 320, 70) + dRR(1560, 300, 700, 320, 70), FL('#3A939A')) + R(80, 70, 200, 150, 8, O('#9A6238', 6)) + R(96, 86, 168, 118, 4, FL('#F6EEDC'));
  bg += R(1660, 40, 130, 160, 8, O('#C9A24A', 6)) + R(1674, 54, 102, 132, 4, FL('#FFFDF4')) + P('M1600 640 Q1680 560 1780 600 L1800 700 L1600 720 Z', O('#F2B84B', 6));
  // ---------------- mid: the laptop
  let m = '';
  // lid back edge + bezel + display
  const lid = [[196, -540], [1724, -540], [1764, KB.hinge + 6], [156, KB.hinge + 6]];
  m += P(dP(lid), O('#9AA0AE', 7)) + P(dP([[226, -510], [1694, -510], [1732, KB.hinge - 12], [188, KB.hinge - 12]]), FL('#8A909E'));
  const scrOn = o.screen !== undefined && o.screen !== null && o.screen !== false;
  m += P(dP(KBS.pts), O(scrOn ? '#05060A' : '#1E2430', 5));
  if (scrOn) m += G(G(screenOf(o.screen, KBS.w, KBS.h), `translate(${KBS.cx} ${KBS.cy}) scale(${f((KBS.pts[2][0] - KBS.pts[3][0] + KBS.pts[1][0] - KBS.pts[0][0]) / 2 / KBS.w)} ${f((KBS.pts[3][1] - KBS.pts[0][1]) / KBS.h)})`), null, { 'clip-path': 'url(#hsClipKBScr)' });
  else m += P(dP([[420, -470], [640, -470], [420, 370], [300, 370]]), { fill: '#FFFFFF', opacity: 0.06 });
  m += P(dP(KBS.pts), { fill: 'url(#hsShine)', opacity: 0.35 }) + P(dP(KBS.pts), LN(4, '#05060A'));
  m += T('DELL-O', 960, KB.hinge - 2, 24, C('#5A606E'));
  { let st = ''; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 26 : 50; st += (i ? 'L' : 'M') + f(Math.cos(a) * r) + ' ' + f(Math.sin(a) * r); } m += G(P(st + 'Z', O('#FFD23F', 4)) + T('#1', 0, 9, 26, C('#E8453C')), `translate(1640 ${KB.hinge - 40}) rotate(10)`); }
  if (o.notes !== false) m += G(R(-72, -56, 144, 112, 3, O('#FFE45C', 3)) + TF('PASSWORD:', 0, -16, 19, C('#3A2A55')) + TF('password', 0, 14, 23, C('#E25050')) + P('M-46 30 H46', LN(2.5, '#E25050')), `translate(290 ${KB.hinge - 44}) rotate(-6)`);
  // deck (body) + hinge strip
  const deck = [kbPt(0, 0), kbPt(1, 0), kbPt(1, 1), kbPt(0, 1)];
  m += P(dP(deck), O('#A6ACBA', 7)) + P(kbQ(0, 0, 1, 0.025), FL('#7A808E'));
  m += P(kbQ(KB_U0 - 0.012, 0.04, KB_U1 + 0.012, 0.584), O('#5A606E', 4));
  // keys: bodies (one path), tops (one path), special tops, letters
  let bodies = '', tops = '', hiTops = '', pressedTops = '', labels = '', worn = '';
  const WORN = o.worn === false ? new Set() : new Set(['E', 'A', 'S', 'N']);
  for (const [lab, k] of Object.entries(KEYS)) {
    const pk = presses[lab] || 0, sunk = pk * 0.35;
    bodies += kbQ(k.u0, k.v0, k.u1, k.v1);
    const tu = (k.u1 - k.u0) * 0.07, tv = (k.v1 - k.v0) * 0.08;
    const top = kbQ(k.u0 + tu, k.v0 + tv * 0.4 + (k.v1 - k.v0) * sunk * 0.2, k.u1 - tu, k.v1 - tv * 3.2 + (k.v1 - k.v0) * sunk * 0.25);
    if (hl.has(lab)) hiTops += top; else if (pk > 0) pressedTops += top; else tops += top;
    const txt = KB_LABEL[lab] !== undefined ? KB_LABEL[lab] : lab;
    if (!txt) continue;
    const sz = k.h * (txt.length > 2 ? 0.27 : txt.length > 1 ? 0.34 : 0.48), ty = k.y + sz * 0.36 + (k.h) * sunk * 0.25;
    const el = TF(txt, k.x, f(ty), f(sz), C(hl.has(lab) ? '#2A2A30' : '#EEF0F6'), { transform: `translate(0 ${f(ty * 0.12)}) scale(1 0.88)` });
    if (WORN.has(lab)) worn += el; else labels += el;
  }
  m += P(bodies, O('#2E323C', 3)) + P(tops, FL('#555B69')) + (pressedTops ? P(pressedTops, FL('#40444F')) : '') + (hiTops ? P(hiTops, FL('!#FFE45C')) : '');
  m += G(labels, null, {}) + (worn ? G(worn, null, { opacity: 0.32 }) : '');
  // CAPS LOCK LED + status LEDs
  const ck = KEYS.CAPS;
  m += CI(ck.x - ck.w * 0.34, ck.y - ck.h * 0.16, ck.h * 0.09, FL(o.caps ? '!#3DFF6A' : '#2E323C'));
  m += P(dC(...kbPt(0.86, 0.022), 4) + dC(...kbPt(0.88, 0.022), 4), FL('#4A505E')) + CI(...kbPt(0.9, 0.022), 4, FL(o.caps ? '!#3DFF6A' : '#4A505E'));
  // masking tape "JUMP!" on the space bar
  const sp = KEYS.SPACE;
  if (o.jumpLabel) m += G(R(-110, -22, 220, 44, 3, { fill: C('#F6EBC2'), stroke: C('#D8C890'), 'stroke-width': 3, opacity: 0.95 }) + T('JUMP!', 0, 14, 36, C('#E25050')), `translate(${sp.x} ${sp.y}) rotate(-3) scale(${f(sp.w / 380)} ${f(sp.h / 62)})`);
  // trackpad + buttons + palm rest stickers
  m += P(kbQ(0.34, 0.64, 0.66, 0.9), O('#959BA9', 4)) + P(kbQ(0.34, 0.905, 0.495, 0.97) + kbQ(0.505, 0.905, 0.66, 0.97), O('#7A808E', 3.5));
  if (o.notes !== false) {
    const [sx, sy] = kbPt(0.18, 0.72), [cx2, cy2] = kbPt(0.82, 0.74);
    m += G(R(-80, -40, 160, 80, 14, O('#FFFFFF', 3)) + TF('I', -50, 12, 30, C('#2E5FB8')) + P('M-28 -6 q12 -16 24 0 q12 -16 24 0 q0 16 -24 30 q-24 -14 -24 -30 Z', FL('#E25050')) + TF('TAXES', 46, 12, 22, C('#2E5FB8')), `translate(${f(sx)} ${f(sy)}) rotate(-6) scale(1 0.8)`);
    m += E(cx2, cy2, 74, 40, { fill: 'none', stroke: C('#7A5A3A'), 'stroke-width': 6, opacity: 0.45 }) + E(cx2 + 6, cy2 - 2, 66, 35, { fill: 'none', stroke: C('#7A5A3A'), 'stroke-width': 3, opacity: 0.35 });
  }
  if (o.crumbs) {
    let cr = '';
    for (let i = 0; i < 16; i++) { const [x, y] = kbPt(0.2 + 0.6 * hash(i * 3.3), 0.15 + 0.5 * hash(i * 7.1)); cr += dC(x, y, 3 + 3 * hash(i)); }
    m += P(cr, O('#D9954A', 1.5));
  }
  // highlight rings
  let fr = '';
  for (const lab of hl) { const k = KEYS[lab]; if (k) fr += E(k.x, k.y, k.w * 0.66 + 10, k.h * 0.7 + 10, { fill: 'none', stroke: '#FFE45C', 'stroke-width': 7, opacity: 0.9 }) + E(k.x, k.y, k.w * 0.8 + 20, k.h * 0.86 + 20, { fill: 'none', stroke: '#FFFFFF', 'stroke-width': 3.5, opacity: 0.6 }); }
  // ---------------- light: the screen washes the keys
  let light = '';
  if (gk > 0.01) light += pool(960, 560, 1000, 300, gcol, 0.22 * gk, 5) + glow(960, 240, 420, 'hsGlowBlue', 0.35 * gk);
  if (nite) light += darkRing(960, 520, 900, 520, '#03051A', 0.5, 10);
  else if (!day) light += glow(1780, 160, 380, 'hsGlowWarm', 0.5) + cover({ fill: '#FF9A50', opacity: 0.04 });
  return { bg, mid: m, front: fr, fg: '', light };
}
const keyboardClose = makeSet(keyboardCloseLayers);

// ================================================================= floor lines + anchors
const FLOOR = { kitchen: 990, livingRoom: 1000, bedroom: 990, stairs: ST.floor, houseExterior: EX.stand, keyboardClose: 1080 };
const SPOTS = {};
SPOTS.kitchen = {
  ceiling: KT.ceil, wallBase: KT.base, window: KT.win,
  seats: KSEAT,
  head: { x: 372, y: 884, s: 0.45 },                 // next: true — YOU standing at the head of the table (left end)
  presenter: { x: 392, y: 884, s: 0.45 },            // meeting: Dad presenting at his flip chart
  table: { x0: KT.table.x0, x1: KT.table.x1, back: KT.table.back, top: KT.table.top, hem: KT.table.hem },
};
SPOTS.livingRoom = {
  ceiling: LR.ceil, wallBase: LR.base, corner: LR.cx, sideAt,
  seats: LSEAT,                                                         // H.seatPose(SPOTS.livingRoom.seats.dad, size)
  faces: LFACE,                                                         // where the screen light hits (glow pools)
  devices: {
    laptop: { x: LSEAT.dad.x, y: LR.couch.front + 40, s: 0.5 },        // Dad's laptop on his knees: bottom centre (X.laptopOld face 'lid'), draw after front
    tablet: { x: LSEAT.mom.x, y: 716, s: 0.5 },                         // Mom's tablet held at chest height (centre; X.tablet face 'back')
    phone: { x: 1632, y: 548, s: 0.5 },                                 // Granny's phone at arm's length (centre; X.phone face 'back')
    pc: { screen: { ...LR.mon }, keyboard: { x: 598, y: LR.desk.top - 6 }, desk: { x0: LR.desk.x0, x1: LR.desk.x1, top: LR.desk.top },
      extras: { x: LR.mon.cx, y: LR.desk.top + 2, s: 0.44 } },          // X.gamingPC({...extras, tower: false}) with o.pc: false
  },
  tv: { cx: TVQ.cx, cy: TVQ.cy, w: TVQ.w, h: TVQ.h, pts: TVQ.inner },   // tvScreen fn(w, h) gets w 300 x h 210
  couch: { x0: LR.couch.x0, x1: LR.couch.x1, seat: LR.couch.seat, front: LR.couch.front, back: LR.couch.back },
  armchair: { x0: LR.arm.x0, x1: LR.arm.x1, seat: LR.arm.seat },
  coffeeTable: { x0: LR.table.x0, x1: LR.table.x1, back: LR.table.back, top: LR.table.top, x: (LR.table.x0 + LR.table.x1) / 2 },
  tea: { x: LR.table.x1 - 168, y: LR.table.top - 2 },                   // Mom's tea mug on the coffee table (bottom centre)
  clock: { ...LR.clock }, lamp: { x: LR.lamp.x, y: LR.lamp.top + 60 },
  hall: { x0: LR.hall.x0, x1: LR.hall.x1, top: LR.hall.top, enter: { x: 2050, y: 1000, s: 0.5 } },
  front: { y: 1000, s: 0.5 },                                           // in front of the coffee table
  blanket: { x: LSEAT.dad.x, top0: LR.couch.front + 40, top1: LR.couch.seat - 92 },
  asleep: {
    dad: { x: 1000, hip: 768, s: 0.5, rot: -5 }, mom: { x: 1290, hip: 772, s: 0.5, rot: -15 },
    grandma: { x: 1752, hip: 790, s: 0.5, rot: 9, turn: -0.25 }, you: { x: 750, y: 1012, s: 0.5 },
    cam: { zoom: 1.22, x: 250, y: 60 },
  },
};
SPOTS.bedroom = {
  ceiling: BR.ceil, wallBase: BR.base, window: BR.win,
  bed: {
    x0: BR.bed.x0, x1: BR.bed.x1, top: BR.bed.top, front: BR.bed.front,
    lie: { x: 520, y: BR.bed.top + 175, s: 0.5, rot: -90, view: 'back' },   // YOU on your side facing the wall (head on the pillow, left)
    sit: { x: 860, hip: 726, s: 0.5, turn: -0.4, floor: BR.bed.floor + 4, pose: { legL: 90, legR: 90, kneeL: 90, kneeR: 90 } }, // Dad on the bed edge (frog-legged sit reads best): H.seatPose(sit, size); draw AFTER front
    pillow: { x: BR.bed.x0 + 180, y: BR.bed.top - 40 },
  },
  lamp: { x: BR.night.x0 + 40, y: BR.night.top - 100 }, clock: { x: BR.night.x1 - 34, y: BR.night.top - 16 },
  desk: { x0: BR.desk.x0, x1: BR.desk.x1, top: BR.desk.top }, monitor: { screen: { ...BR.mon } },
  chair: { x: 1420, seat: 770, s: 0.5 },
  door: { x0: BR.door.x0, x1: BR.door.x1, top: BR.door.top, knob: { x: BR.door.x0 + 24, y: 500 }, exit: { x: 1786, y: 930, s: 0.48 } },
  rug: { x: 1180, y: 980 }, stand: { y: 990, s: 0.5 },
};
SPOTS.stairs = {
  s: 0.32, floor: ST.floor, rise: ST.rise, run: ST.run, slope: ST.rise / ST.run,
  landing: { x0: ST.x1, x1: XR, y: ST.land, x: 1460 },                  // upstairs (YOUR door at x 1480..1660)
  steps: Array.from({ length: ST.n }, (_, i) => stStep(i)),               // centre of each tread: 0 = top .. 11 = bottom
  bottom: { x: 330, y: ST.floor },                                        // foot of the stairs (hall)
  heroDoor: { x0: 1480, x1: 1660, top: ST.land - 404, x: 1570 },
  arch: { x0: 70, x1: 330, top: 514, x: 200, enter: { x: 200, y: ST.floor, s: 0.32 } },   // into the living room
  rail: { x0: ST.x0 - 30, y0: stNose(ST.x0 - 30) - 124, x1: ST.x1 + 10, y1: stNose(ST.x1 + 10) - 150 },
  noseY: stNose,                                                          // stair nosing line y at any x
};
SPOTS.houseExterior = {
  s: 0.22, stand: EX.stand, k: 1, base: EX.base,                         // hero s .22 on the sidewalk (feet y 935)
  house: { x: EX.house, base: EX.base, door: { x: 940, y: 676 }, porch: { x: 1030, y: 676, s: 0.17 }, roofTop: { x: 960, y: 40 } },
  windows: { living: { x: 736, y: 584 }, hero: { x: 1192, y: 356 }, parents: { x: 728, y: 356 }, granny: { x: 960, y: 360 }, kitchen: { x: 1259, y: 578 }, attic: { x: 960, y: 150 } },
  path: { x: 944, y0: 730, y1: 880 }, lawn: { y0: 720, y1: 860, s: 0.19 }, driveway: { x: 1490, y: 870 }, car: { x: 1478, y: EX.walk.y0 + 8 },
  mailbox: { x: 840, y: EX.stand - 30 }, oak: { x: 360, swing: { x: 268, y: EX.base - 52 } }, every: EX.every,
};
SPOTS.keyboardClose = {
  screen: { cx: KBS.cx, cy: KBS.cy, w: KBS.w, h: KBS.h, visible: { y0: 0, y1: 370 } },   // only y 0..370 of it is in frame at rest
  keys: Object.fromEntries(Object.entries(KEYS).map(([k, v]) => [k, { x: v.x, y: v.y, w: v.w, h: v.h, s: v.s }])),
  space: { x: KEYS.SPACE.x, y: KEYS.SPACE.y, w: KEYS.SPACE.w, h: KEYS.SPACE.h, s: KEYS.SPACE.s },
  finger: { x: KEYS.G.x, y: KEYS.G.y - 70 },              // Dad's fingertip hovering, hunting for the B
  hand: { x: 1500, y: 1090 },                              // where his arm enters the frame (bottom right)
  hinge: KB.hinge, trackpad: { x: 960, y: 990 },
};
const DEFS = '<defs>' + DEF.join('') + '</defs>';
module.exports = {
  DEFS, FLOOR, SPOTS,
  kitchen, livingRoom, deviceGlows, bedroom, alarmScreen, stairs, houseExterior, houseFront, dadCar, nbHouse, keyboardClose, keyAt,
  newspaper, cerealBox, bowl, mug, cookiePlate, yarnBall, knitBasket, flipChart, familyFrame, oakTree, hsCloud, hsBird, wallClock, plant, bunting,
  toScreen, camTf, vis, mix, tone, frameIn, glow, pool, darkRing, faceGlows, seatPose, makeSet, layersOf,
};
