// HOME + NEIGHBOURHOOD sets for "What If You Could See Everyone's STATS in Real Life?".   Reference: docs/SETS_HOME.md
//
// The hero's family home (NOT the Parents' or the Respawn family's): YOUR teal-and-navy gamer bedroom (pixel-heart frieze,
// hearts duvet, controller rug, purple gaming chair, DRAGON PEAK poster, the wardrobe mirror, the red twin-bell ALARM CLOCK),
// Mom's bakery-warm kitchen (peach walls, blueberry cabinets, fish-scale backsplash, cherry tablecloth, the cream fridge
// covered in Max's dinosaurs, a tower of FLOUR POWER cupcake boxes, the toaster), the sage living room (denim corduroy
// couch under the big window, Grandpa Lou's cognac recliner, the 1979 arm-wrestling photo + the "79" trophy shelf, the
// braided rug = the pillow-fort floor, Biscuit's dog bed, the TV), the neighbourhood street (Mrs. Wells' lavender cottage
// + gate, the oak with the ball stuck in it, the corner shop) and the house from the street (coral siding, navy roof,
// mustard door, Mom's bakery van).
//
// Every set is drawn in WORLD SPACE for the full 1920x1080 frame (camera at rest = the frame). Room sets are padded far
// past the frame (x -900..2820, y -700..1800) so zoom-outs to ~0.55 and pans never show a gap. `t` = absolute seconds,
// used only for idle motion (steam, curtains, LEDs, birds, the clock ringing, smoke). Static gradients/patterns live in
// DEFS (ids `sh*`; scenes/main.js loads them automatically).
//
// ROOM sets (fixed world, you apply the camera):  set(t, o) -> svg of all layers;  set.layers(t, o) -> { bg, mid, front, fg, light }
//   bg    — what is seen through windows (sky, yard, street)               draw with view(cam, bg, 0.7..0.85)
//   mid   — the room itself: walls, floor, furniture backs, props          draw with view(cam, mid, 1)
//   front — furniture FRONTS (duvet + bed front, the breakfast table + cloth, couch / recliner fronts, chair backs). Draw
//           it AFTER the characters sitting behind / inside that furniture and BEFORE the characters on the FLOOR line.
//   fg    — occluders close to the camera ('' unless noted)               draw with view(cam, fg, 1.15..1.3)
//   light — sunbeams, lamp pools, night darkness, screen glows, flashes    draw LAST with view(cam, light, 1)
// CAMERA sets (street, houseExterior): set(t, cam, o) -> svg; set.layers(t, cam, o) -> { bg, mid, fg, light } ALREADY
//   transformed by cam ({ zoom, x, y, fx, fy, sx, sy } straight from K.camKeys / K.shake); anchors carry k:
//   draw on them with K.view(cam, svg, a.k) between L.mid and L.fg; H.toScreen(cam, a) -> where an anchor is on screen.
// FLOOR[set] = the stand line (feet y) in the default framing; SPOTS[set] = anchors (seats, props, tooltips, faces...).
// Screens take an svg centred on (0,0) of the screen box, or fn(w, h) => svg.
//
// Index:
//   bedroom(t, o)      o: time 'night'|'morning'|'day'|'evening', pcScreen, pc, glow, glowCol, pixels, blackout, ring, clock,
//                      tuck, sock, led, lamp, chair 'back'|'front'|false, mirrorView, curtains, mess
//   kitchen(t, o)      o: time 'morning'|'evening'|'day', mess, dishes, pancakes, toast, burnt, smoke, coffee, cups, boxes,
//                      bowls, steam, lamp, clock, outside, birds, chairs
//   livingRoom(t, o)   o: time 'day'|'evening'|'night', fort, tvScreen, tv, tvGlow, lamp, clock, pillows, toys, dogBed, birds
//   street(t, cam, o)  o: time 'day'|'sunset'|'morning', ball, bags, birds, cars, leaves
//   houseExterior(t, cam, o)  o: time 'night'|'morning'|'day'|'evening', heroWindow 'off'|'lit'|'glow'|'update', update,
//                      windows, van, porchLight, birds, smoke, stars
//   props: mug, bowl, cupcake, cupcakeBox, toaster, toast, alarmClock, sock, groceryBag, ball, photoFrame, trophy79, dogBed,
//          plant, leafTree, shCloud, shBird, wallClock, familyHouse, nbHouse, wellsCottage, cornerShop, bakeryVan, pixelBurst
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
// one silhouette made of circles + rects with a single outside outline (clouds, bushes, tree crowns)
const blob = (d, fill, w = 6, line = LINE) => P(d, { fill: line, stroke: line, 'stroke-width': f(w * 2), 'stroke-linejoin': 'round' }) + P(d, { fill });

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
// one set renders in the morning, at sunset / dusk, at night, dimmed (blackout) or softened.
//   o: { morn, eve, sunset, night, dim, soft } all 0..1
//   tn.c(col) colour · tn.ol(fill, w) outlined fill · tn.ln(w, col, op) stroke only · tn.fl(col, op) fill only
//   A colour written as '!#RRGGBB' is emissive (lit windows, LEDs, screens) and is never toned.
function tone(o = {}) {
  const morn = o.morn || 0, eve = o.eve || 0, sunset = o.sunset || 0, night = o.night || 0, dim = o.dim || 0, soft = o.soft || 0;
  const any = morn + eve + sunset + night + dim + soft;
  const cache = new Map();
  const c = (col) => {
    if (typeof col === 'string' && col[0] === '!') return col.slice(1);
    if (!any || typeof col !== 'string' || col[0] !== '#' || col.length !== 7) return col;
    let v = cache.get(col);
    if (v) return v;
    let [r, g, b] = hx(col);
    if (soft) { const L = 0.3 * r + 0.59 * g + 0.11 * b; r = lerp(r, L * 0.3 + r * 0.7 + 10, soft * 0.5); g = lerp(g, L * 0.3 + g * 0.7 + 8, soft * 0.5); b = lerp(b, L * 0.3 + b * 0.7 + 6, soft * 0.5); }
    if (morn) { r = lerp(r, r * 0.97 + 12, morn); g = lerp(g, g * 0.93 + 8, morn); b = lerp(b, b * 0.84 + 4, morn); }
    if (sunset) { r = lerp(r, r * 0.96 + 22, sunset); g = lerp(g, g * 0.8 + 10, sunset); b = lerp(b, b * 0.7 + 18, sunset); }
    if (eve) { r = lerp(r, r * 0.86 + 14, eve); g = lerp(g, g * 0.7 + 8, eve); b = lerp(b, b * 0.68 + 30, eve); }
    if (night) { r = lerp(r, r * 0.3 + 10, night); g = lerp(g, g * 0.36 + 16, night); b = lerp(b, b * 0.55 + 48, night); }
    if (dim) { r *= 1 - 0.5 * dim; g *= 1 - 0.47 * dim; b *= 1 - 0.4 * dim; }
    v = toHex([r, g, b]);
    cache.set(col, v);
    return v;
  };
  const dark = night > 0.5;
  const line = dark ? '#0D0C18' : LINE;
  const ol = (fill, w = 5, extra) => ({ fill: c(fill), stroke: line, 'stroke-width': f(w), 'stroke-linejoin': 'round', 'stroke-linecap': 'round', ...extra });
  const ln = (w, col = LINE, op) => ({ fill: 'none', stroke: col === LINE ? line : c(col), 'stroke-width': f(w), 'stroke-linecap': 'round', 'stroke-linejoin': 'round', ...(op !== undefined ? { opacity: f(clamp(op, 0, 1)) } : {}) });
  const fl = (col, op) => (op === undefined ? { fill: c(col) } : { fill: c(col), opacity: f(clamp(op, 0, 1)) });
  return { c, ol, ln, fl, line, morn, eve, sunset, night, dim, dark };
}

// ---------------------------------------------------------------- static defs
const DEF = [];
const def = (s) => { DEF.push(s); };
const stops = (st) => st.map(([o, c, a]) => `<stop offset="${o}" stop-color="${c}"${a !== undefined ? ` stop-opacity="${a}"` : ''}/>`).join('');
const lg = (id, st, x2 = 0, y2 = 1, extra = '') => `<linearGradient id="${id}" x1="0" y1="0" x2="${x2}" y2="${y2}"${extra}>${stops(st)}</linearGradient>`;
const rg = (id, st, extra = '') => `<radialGradient id="${id}"${extra}>${stops(st)}</radialGradient>`;
const pat = (id, w, h, inner, extra = '') => `<pattern id="${id}" width="${w}" height="${h}" patternUnits="userSpaceOnUse"${extra}>${inner}</pattern>`;

// skies (windows + exterior)
def(lg('shSkyMorning', [[0, '#7FB6F0'], [0.45, '#BFDDF6'], [0.78, '#FFE2BC'], [1, '#FFC892']]));
def(lg('shSkyDay', [[0, '#4C9FEA'], [0.6, '#8ECCF6'], [1, '#D6F0FF']]));
def(lg('shSkySunset', [[0, '#5A4FA8'], [0.38, '#C468A6'], [0.68, '#FF8E6A'], [1, '#FFCB72']]));
def(lg('shSkyEvening', [[0, '#26306E'], [0.5, '#5E4A96'], [0.85, '#C77AA0'], [1, '#F2A07E']]));
def(lg('shSkyNight', [[0, '#090E30'], [0.6, '#16215A'], [1, '#26387A']]));
def(pat('shStars', 260, 180, '<circle cx="24" cy="30" r="2.3" fill="#FFF"/><circle cx="160" cy="22" r="1.6" fill="#FFF" opacity="0.7"/><circle cx="104" cy="100" r="2.5" fill="#FFF6C8"/><circle cx="222" cy="136" r="1.7" fill="#FFF" opacity="0.8"/><circle cx="60" cy="150" r="1.4" fill="#FFF" opacity="0.6"/><path d="M196 66 l3 -9 l3 9 l9 3 l-9 3 l-3 9 l-3 -9 l-9 -3 Z" fill="#FFF" opacity="0.85"/>'));
// soft glows (small radii only) + beams
def(rg('shGlowWarm', [[0, '#FFE8A8', 0.85], [0.45, '#FFC872', 0.3], [1, '#FFC060', 0]]));
def(rg('shGlowBlue', [[0, '#BFE6FF', 0.8], [0.45, '#5FB0FF', 0.28], [1, '#4A90FF', 0]]));
def(rg('shGlowCyan', [[0, '#C8FFFF', 0.85], [0.4, '#4DE8FF', 0.3], [1, '#2AC8FF', 0]]));
def(rg('shGlowWhite', [[0, '#FFFFFF', 0.9], [0.45, '#FFFFFF', 0.28], [1, '#FFFFFF', 0]]));
def(rg('shGlowMoon', [[0, '#E8F0FF', 0.6], [0.5, '#B8CCFF', 0.18], [1, '#B8CCFF', 0]]));
def(rg('shGlowPink', [[0, '#FFC8E8', 0.7], [0.45, '#FF7AC8', 0.24], [1, '#FF5AB8', 0]]));
def(rg('shGlowTV', [[0, '#B8F4FF', 0.7], [0.45, '#6CC8FF', 0.22], [1, '#4A9CFF', 0]]));
def(lg('shShine', [[0, '#FFFFFF', 0.34], [0.5, '#FFFFFF', 0]], 1, 1));
def(lg('shBeam', [[0, '#FFF0C2', 0.7], [1, '#FFF0C2', 0]]));
def(lg('shBeamBlue', [[0, '#C8DCFF', 0.45], [1, '#C8DCFF', 0]]));
def(lg('shBeamScreen', [[0, '#9FE8FF', 0.55], [1, '#9FE8FF', 0]], 0, 1));
def(lg('shRGB', [[0, '#FF4FD8'], [0.25, '#8A5CFF'], [0.5, '#33D6FF'], [0.75, '#3DFF9A'], [1, '#FFB13B']], 1, 0));
def(lg('shScreenOff', [[0, '#252A3C'], [1, '#0E1018']]));
// textures (semi-transparent overlays so they work on any toned colour)
def(pat('shGrain', 260, 50, '<path d="M0 49 H260 M0 24 Q50 19 100 25 T200 22 T260 24" stroke="#000" stroke-width="2.5" opacity="0.1" fill="none"/><path d="M150 0 V24 M60 24 V49" stroke="#000" stroke-width="2.5" opacity="0.12"/>'));
def(pat('shBoards', 64, 200, '<path d="M0 0 V200" stroke="#000" stroke-width="3" opacity="0.16"/><path d="M5 0 V200" stroke="#FFF" stroke-width="2" opacity="0.12"/>'));
def(pat('shHearts', 96, 84, '<g fill="#E8484E"><path d="M12 10 h8 v4 h4 v-4 h8 v4 h4 v12 h-4 v4 h-4 v4 h-4 v4 h-4 v-4 h-4 v-4 h-4 v-4 h-4 v-12 h4 Z"/><path d="M60 52 h8 v4 h4 v-4 h8 v4 h4 v12 h-4 v4 h-4 v4 h-4 v4 h-4 v-4 h-4 v-4 h-4 v-4 h-4 v-12 h4 Z"/></g><g fill="#FFFFFF" opacity="0.55"><rect x="12" y="14" width="4" height="4"/><rect x="60" y="56" width="4" height="4"/></g>'));
def(pat('shDots', 46, 46, '<circle cx="11" cy="11" r="3.2" fill="#FFF" opacity="0.42"/><circle cx="34" cy="34" r="3.2" fill="#FFF" opacity="0.42"/>'));
def(pat('shScale', 44, 30, '<rect width="44" height="30" fill="#FFF5E4"/><path d="M0 15 A11 11 0 0 1 22 15 A11 11 0 0 1 44 15 M-11 30 A11 11 0 0 1 11 30 A11 11 0 0 1 33 30 A11 11 0 0 1 55 30 M-11 0 A11 11 0 0 1 11 0 A11 11 0 0 1 33 0 A11 11 0 0 1 55 0" fill="none" stroke="#E4B98A" stroke-width="2.4"/>'));
def(pat('shCherry', 120, 110, '<g><path d="M30 26 Q36 8 50 4 M42 28 Q44 12 50 4" fill="none" stroke="#3E8A4A" stroke-width="3" stroke-linecap="round"/><path d="M50 4 q10 -4 14 4 q-8 4 -14 -4 Z" fill="#5DB55A"/><circle cx="29" cy="32" r="8" fill="#E2434B"/><circle cx="43" cy="34" r="8" fill="#E2434B"/><circle cx="26" cy="29" r="2.4" fill="#FFF" opacity="0.7"/><circle cx="40" cy="31" r="2.4" fill="#FFF" opacity="0.7"/></g><g transform="translate(60 56)"><path d="M30 26 Q36 8 50 4 M42 28 Q44 12 50 4" fill="none" stroke="#3E8A4A" stroke-width="3" stroke-linecap="round"/><path d="M50 4 q10 -4 14 4 q-8 4 -14 -4 Z" fill="#5DB55A"/><circle cx="29" cy="32" r="8" fill="#E2434B"/><circle cx="43" cy="34" r="8" fill="#E2434B"/><circle cx="26" cy="29" r="2.4" fill="#FFF" opacity="0.7"/><circle cx="40" cy="31" r="2.4" fill="#FFF" opacity="0.7"/></g>'));
def(pat('shHex', 104, 60, '<rect width="104" height="60" fill="#F8E6CE"/><path d="M17 0 L35 0 L43 15 L35 30 L17 30 L9 15 Z M69 30 L87 30 L95 45 L87 60 L69 60 L61 45 Z" fill="#EFC6A2"/><path d="M17 0 L35 0 L43 15 L35 30 L17 30 L9 15 Z M69 30 L87 30 L95 45 L87 60 L69 60 L61 45 Z M43 15 H61 M9 15 H-9 M95 45 H113 M35 30 L43 45 L35 60 M87 0 L95 15 L87 30 M17 30 L9 45 L17 60 M69 0 L61 15 L69 30" fill="none" stroke="#D9A27E" stroke-width="2.4"/>', ' patternTransform="scale(1 0.6)"'));
def(pat('shCord', 18, 60, '<path d="M9 0 V60" stroke="#000" stroke-width="3" opacity="0.12"/><path d="M3 0 V60" stroke="#FFF" stroke-width="2" opacity="0.12"/>'));
def(pat('shLeafPaper', 110, 110, '<path d="M24 34 q12 -20 28 -8 q-10 18 -28 8 Z M80 86 q12 -20 28 -8 q-10 18 -28 8 Z" fill="#FFFFFF" opacity="0.26"/><path d="M24 34 L44 22 M80 86 L100 74" stroke="#FFFFFF" stroke-width="2" opacity="0.3"/><circle cx="84" cy="24" r="3.2" fill="#FFFFFF" opacity="0.3"/><circle cx="26" cy="84" r="3.2" fill="#FFFFFF" opacity="0.3"/>'));
def(pat('shKnit', 30, 28, '<path d="M0 6 L7.5 15 L15 6 L22.5 15 L30 6 M0 20 L7.5 29 L15 20 L22.5 29 L30 20" stroke="#FFF" stroke-width="3" fill="none" opacity="0.35" stroke-linejoin="round"/>'));
def(pat('shPlaid', 56, 56, '<rect width="56" height="56" fill="none"/><rect x="0" y="20" width="56" height="14" fill="#000" opacity="0.14"/><rect x="20" y="0" width="14" height="56" fill="#000" opacity="0.14"/><path d="M0 27 H56 M27 0 V56" stroke="#FFF" stroke-width="2.5" opacity="0.35"/>'));
def(pat('shStripeBox', 40, 40, '<rect width="20" height="40" fill="#FFFFFF" opacity="0.55"/>'));
def(pat('shSiding', 40, 30, '<path d="M0 28 H40" stroke="#000" stroke-width="3" opacity="0.13"/><path d="M0 2 H40" stroke="#FFF" stroke-width="2" opacity="0.22"/>'));
def(pat('shShingle', 52, 30, '<path d="M0 28 H52 M26 0 V14 M0 14 H52 M13 14 V28 M39 14 V28" stroke="#000" stroke-width="2.5" opacity="0.16" fill="none"/>'));
def(pat('shScallop', 36, 26, '<path d="M0 24 A9 9 0 0 1 18 24 A9 9 0 0 1 36 24 M-9 11 A9 9 0 0 1 9 11 A9 9 0 0 1 27 11 A9 9 0 0 1 45 11" fill="none" stroke="#000" stroke-width="2.5" opacity="0.16"/>'));
def(pat('shBrick', 64, 32, '<path d="M0 15 H64 M0 31 H64 M32 0 V15 M0 15 V31 M64 15 V31" stroke="#000" stroke-width="2.5" opacity="0.14" fill="none"/>'));
def(pat('shLawn', 76, 46, '<path d="M8 34 l4 -12 l4 12 M42 16 l3 -10 l3 10 M58 40 l3 -9 l3 9" stroke="#1E6B2A" stroke-width="2.5" fill="none" opacity="0.26" stroke-linejoin="round"/>'));
def(pat('shRoad', 140, 70, '<circle cx="14" cy="10" r="2" fill="#FFF" opacity="0.1"/><circle cx="92" cy="48" r="2.5" fill="#000" opacity="0.12"/><circle cx="58" cy="26" r="1.6" fill="#FFF" opacity="0.08"/><circle cx="120" cy="14" r="2" fill="#000" opacity="0.1"/>'));
def(pat('shCarpet', 26, 26, '<circle cx="6" cy="6" r="1.7" fill="#000" opacity="0.08"/><circle cx="19" cy="19" r="1.7" fill="#FFF" opacity="0.1"/>'));
def(pat('shStucco', 70, 60, '<circle cx="12" cy="14" r="2" fill="#000" opacity="0.06"/><circle cx="48" cy="40" r="2.4" fill="#000" opacity="0.05"/><circle cx="30" cy="52" r="1.6" fill="#FFF" opacity="0.18"/><circle cx="60" cy="10" r="1.6" fill="#FFF" opacity="0.18"/>'));

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
  return { x: fx + (cam.sx || 0) + z * (a.x - fx - (cam.x || 0) * k), y: fy + (cam.sy || 0) + z * (a.y - fy - (cam.y || 0) * k), z, s: (a.s || 1) * z };
}
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
const screenOf = (inner, w, h) => (typeof inner === 'function' ? inner(w, h) : inner || '');
const frameIn = (svg, w, h) => G(svg, `translate(${f(-w / 2)} ${f(-h / 2)}) scale(${f(w / 1920)} ${f(h / 1080)})`);
// seated character pose on a seat anchor: hips on spot.hip, straight legs (hidden by the furniture front). size = the
// character's rig size factor (docs/CAST.md), so a bigger adult's hips still land on the cushion.
// spot.pose (e.g. a frog-legged edge sit) and spot.rot / turn / view are applied too; `extra` wins.
const seatPose = (spot, size = 1, extra = {}) => ({ x: spot.x, y: +f(spot.hip + 306 * spot.s * size), s: spot.s, ...(spot.turn ? { turn: spot.turn } : {}), ...(spot.rot ? { rot: spot.rot } : {}), ...(spot.view ? { view: spot.view } : {}), ...(spot.pose || {}), ...extra });

// ---------------------------------------------------------------- light helpers (no big radial gradients)
const glow = (x, y, r, id = 'shGlowWarm', op = 1) => (op > 0.003 ? CI(x, y, r, { fill: `url(#${id})`, opacity: f(clamp(op, 0, 1)) }) : '');
// cel-shaded light pool: n nested ellipses of one colour (cheap fake radial)
function pool(x, y, rx, ry, col, op, n = 4) {
  if (op <= 0.003) return '';
  let o = '';
  for (let i = 0; i < n; i++) { const k = 1 - i / n; o += E(x, y, rx * k, ry * k, { fill: col, opacity: f(op / n) }); }
  return o;
}
// darkness everywhere except around (x, y): n full-cover sheets with growing elliptical holes (evenodd)
function darkRing(x, y, rx, ry, col, op, n = 7, box = [XL, YT, XR, YB]) {
  if (op <= 0.003) return '';
  const [x0, y0, x1, y1] = box;
  let o = '';
  for (let i = 0; i < n; i++) {
    const k = 0.62 + i * 0.24 + i * i * 0.03;
    o += P(dR(x0, y0, x1 - x0, y1 - y0) + dE(x, y, rx * k, ry * k), { fill: col, opacity: f(op / n), 'fill-rule': 'evenodd' });
  }
  return o;
}

// ================================================================= shared props
// puffy cloud (one silhouette, outline outside only). origin = bottom centre
function shCloud(x, y, s = 1, tn = tone(), col = '#FFFFFF', sh = '#DDEBF8') {
  const d = dC(-70, -30, 30) + dC(-22, -60, 44) + dC(30, -46, 38) + dC(78, -24, 24) + dRR(-100, -36, 204, 36, 18);
  return G(blob(d, tn.c(col), 4.5 / s, tn.line) + P(dRR(-96, -14, 196, 12, 6), { fill: tn.c(sh) }), tr(x, y, s));
}
// small flying bird. origin = body centre. o: flap 0..1, col, flip
function shBird(x, y, s = 1, tn = tone(), o = {}) {
  const col = o.col || '#4A5A7A';
  const fl = Math.sin((o.flap ?? 0.5) * Math.PI * 2);
  let b = P(`M-2 -2 Q-18 ${f(-14 - 18 * fl)} -34 ${f(-6 - 22 * fl)} Q-16 2 -2 4 Z M2 -2 Q18 ${f(-14 - 18 * fl)} 34 ${f(-6 - 22 * fl)} Q16 2 2 4 Z`, tn.ol(col, 3.5));
  b += E(0, 0, 13, 9, tn.ol(col, 3.5)) + P('M12 -3 L20 0 L12 3 Z', tn.ol('#FFB13B', 2));
  return G(b, `translate(${f(x)} ${f(y)}) scale(${f(o.flip ? -s : s)} ${f(s)})`);
}
// big rounded street tree (origin = trunk base; crown ±190 wide, ~560 tall at s 1). o: col, hi, dark, trunk, sway (deg),
// ball (draw the stuck ball in the branches: true | { col }), fall (autumn dots)
function leafTree(x, y, s = 1, tn = tone(), o = {}) {
  const col = o.col || '#4FAE5A', hi = o.hi || '#86D477', dk = o.dark || '#3A8C48', trunk = o.trunk || '#8A5634';
  let t = P('M-30 0 Q-20 -110 -18 -230 L18 -230 Q20 -110 30 0 Z', tn.ol(trunk, 6)) + P('M-10 -40 Q-6 -120 -8 -200', tn.ln(5, '#B07A4E', 0.7));
  t += P('M-12 -200 L-96 -300 M8 -214 L84 -322 M0 -230 L-6 -340', tn.ln(16, tn.line)) + P('M-12 -200 L-96 -300 M8 -214 L84 -322 M0 -230 L-6 -340', tn.ln(9, trunk));
  const cd = dC(0, -400, 150) + dC(-130, -330, 100) + dC(132, -320, 98) + dC(-80, -480, 96) + dC(86, -470, 92) + dRR(-190, -340, 380, 96, 46);
  let cn = blob(cd, tn.c(col), 6, tn.line);
  cn += P(dC(-120, -290, 50) + dC(120, -282, 48) + dRR(-170, -300, 340, 52, 26), { fill: tn.c(dk), opacity: 0.6 });
  cn += P(dC(-84, -450, 40) + dC(26, -508, 30) + dC(-150, -350, 26) + dC(110, -400, 24), { fill: tn.c(hi), opacity: 0.9 });
  // inner branches peeking through
  cn += P('M-50 -330 L-80 -300 M60 -350 L96 -318', tn.ln(9, trunk));
  if (o.ball) {
    const bc = (o.ball && o.ball.col) || '#E8484E';
    cn += P('M30 -362 L70 -330 L104 -352', tn.ln(12, tn.line)) + P('M30 -362 L70 -330 L104 -352', tn.ln(6, trunk));
    cn += ball(66, -334, 1, tn, { col: bc, rot: 20 });
    cn += P(dC(40, -322, 20) + dC(98, -318, 18), { fill: tn.c(col) }) + P('M26 -318 l10 -10 M100 -310 l8 -12', tn.ln(3, dk));
  }
  if (o.fall) cn += P(dC(-60, -360, 9) + dC(40, -440, 8) + dC(120, -340, 9) + dC(-140, -400, 8), { fill: tn.c('#F2A23A') });
  t += o.sway ? G(cn, `rotate(${f(o.sway)} 0 -230)`) : cn;
  return G(t, tr(x, y, s));
}
// playground ball (origin = centre, r 30 at s 1). o: col, rot
function ball(x, y, s = 1, tn = tone(), o = {}) {
  const col = o.col || '#E8484E';
  let b = CI(0, 0, 30, tn.ol(col, 4.5)) + P('M-29 -6 Q0 10 29 -6 M-27 10 Q0 26 27 10', tn.ln(5, '#FFD23F')) + P('M-16 -18 Q-8 -24 2 -24', tn.ln(5, '#FFFFFF', 0.7));
  return G(b, tr(x, y, s, o.rot || 0));
}
// wall clock showing 'H:MM'. origin = centre, r = face radius. o: rim, face
function wallClock(x, y, r, time = '7:30', tn = tone(), o = {}) {
  let h = 7, m = 30;
  if (typeof time === 'number') { h = Math.floor(time); m = (time - h) * 60; } else { const p = String(time).split(':'); h = +p[0] || 0; m = +p[1] || 0; }
  const am = ((h % 12) + m / 60) / 12 * Math.PI * 2, mm = m / 60 * Math.PI * 2;
  let c = CI(4, 6, r * 1.16, { fill: '#000', opacity: 0.1 }) + CI(0, 0, r * 1.16, tn.ol(o.rim || '#F2B84B', 5)) + CI(0, 0, r, tn.ol(o.face || '#FFF8EC', 3.5));
  let ticks = '';
  for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2, l = i % 3 === 0 ? 0.2 : 0.08; ticks += `M${f(Math.sin(a) * r * 0.84)} ${f(-Math.cos(a) * r * 0.84)} L${f(Math.sin(a) * r * (0.84 - l))} ${f(-Math.cos(a) * r * (0.84 - l))} `; }
  c += P(ticks, tn.ln(Math.max(2, r * 0.05)));
  c += P(`M0 0 L${f(Math.sin(am) * r * 0.5)} ${f(-Math.cos(am) * r * 0.5)}`, tn.ln(r * 0.11)) + P(`M0 0 L${f(Math.sin(mm) * r * 0.75)} ${f(-Math.cos(mm) * r * 0.75)}`, tn.ln(r * 0.07));
  c += CI(0, 0, r * 0.08, tn.fl(o.rim || '#F2B84B'));
  return G(c, tr(x, y));
}
// mug, front view. origin = bottom centre (52 x 54 at s 1). o: col, label, labelCol, handle 'L'|'R', steam (t), empty
function mug(x, y, s = 1, tn = tone(), o = {}) {
  const col = o.col || '#FFFFFF', hs = o.handle === 'L' ? -1 : 1;
  const hd = `M${f(hs * 24)} -42 q${f(hs * 18)} 0 ${f(hs * 18)} 14 q0 14 ${f(-hs * 18)} 14`;
  let m = P(hd, tn.ln(11)) + P(hd, tn.ln(5.5, col));
  m += R(-26, -56, 52, 56, 9, tn.ol(col, 4)) + E(0, -56, 26, 6, tn.ol(mix(col, '#000000', 0.12), 3));
  if (!o.empty) m += E(0, -55, 20, 4, tn.fl('#6A3E22'));
  m += P('M-16 -46 V-14', tn.ln(5, '#FFFFFF', 0.45));
  if (o.label) m += TF(o.label, 0, -22, o.label.length > 4 ? 12 : 15, tn.c(o.labelCol || '#E2434B'));
  if (o.steam !== undefined && o.steam !== false) {
    const tt = +o.steam || 0;
    let sd = '';
    for (let i = 0; i < 2; i++) { const u = md(tt * 0.45 + i * 0.5, 1); sd += `M${f(-6 + i * 12 + Math.sin(tt * 2 + i) * 4)} ${f(-66 - u * 50)} q-8 -10 0 -20 q8 -10 0 -20 `; }
    m += P(sd, { fill: 'none', stroke: '#FFFFFF', 'stroke-width': 5, 'stroke-linecap': 'round', opacity: 0.55 });
  }
  return G(m, tr(x, y, s));
}
// cereal bowl, front view. origin = bottom centre (96 wide at s 1). o: col, fill 'cereal'|'milk'|'empty', spoon, splash (0..1 milk crown)
function bowl(x, y, s = 1, tn = tone(), o = {}) {
  const col = o.col || '#5FA8E0';
  let b = P('M-48 -36 Q-46 0 0 0 Q46 0 48 -36 Z', tn.ol(col, 4)) + P('M-38 -24 Q-22 -10 0 -10', tn.ln(4, '#FFFFFF', 0.45));
  b += E(0, -36, 48, 10, tn.ol(mix(col, '#FFFFFF', 0.35), 4));
  if (o.fill !== 'empty') {
    b += E(0, -37, 40, 7, tn.fl('#FFFBF2'));
    if (o.fill !== 'milk') {
      let ce = '';
      for (let i = 0; i < 7; i++) ce += dC(-30 + i * 10, -40 + (i % 3) * 2.5, 5.5);
      b += P(ce, tn.ol('#F2B84B', 1.8)) + P(Array.from({ length: 7 }, (_, i) => dC(-30 + i * 10, -40 + (i % 3) * 2.5, 1.8)).join(''), tn.fl('#C9852E'));
    }
  }
  if (o.spoon) b += P('M12 -42 L44 -82', tn.ln(9)) + P('M12 -42 L44 -82', tn.ln(5, '#D8DDE4')) + E(46, -85, 7, 5, tn.ol('#D8DDE4', 2.5));
  const sp = b01(o.splash);
  if (sp > 0.01) {
    const h = 70 * sp;
    let cr = `M-44 -36 Q-50 ${f(-36 - h * 0.6)} -36 ${f(-36 - h)} Q-28 ${f(-36 - h * 0.5)} -18 ${f(-36 - h * 1.2)} Q-8 ${f(-36 - h * 0.5)} 0 ${f(-36 - h * 1.35)} Q8 ${f(-36 - h * 0.5)} 18 ${f(-36 - h * 1.15)} Q28 ${f(-36 - h * 0.5)} 36 ${f(-36 - h)} Q50 ${f(-36 - h * 0.6)} 44 -36 Z`;
    b += P(cr, tn.ol('#FFFBF2', 3.5));
    b += P(dC(-40, -40 - h * 1.5, 6 * sp) + dC(-6, -40 - h * 1.8, 7 * sp) + dC(30, -40 - h * 1.6, 6 * sp), tn.ol('#FFFBF2', 2.5));
  }
  return G(b, tr(x, y, s));
}
// cupcake (origin = bottom centre, ~44 x 52 at s 1). o: frost colour, cherry, sprinkles
function cupcake(x, y, s = 1, tn = tone(), o = {}) {
  const fr = o.frost || '#FF9EBB';
  let c = P('M-20 0 L-24 -26 L24 -26 L20 0 Z', tn.ol(o.wrap || '#F2B84B', 3.5)) + P('M-12 -26 L-10 0 M0 -26 V0 M12 -26 L10 0', tn.ln(2, '#C98A2E', 0.8));
  c += P('M-28 -24 Q-30 -40 -14 -42 Q-12 -56 2 -54 Q16 -56 16 -44 Q30 -42 28 -24 Z', tn.ol(fr, 3.5)) + P('M-18 -38 Q-10 -44 -2 -42', tn.ln(3, '#FFFFFF', 0.55));
  if (o.sprinkles !== false) c += P('M-14 -32 l4 -2 M4 -36 l3 3 M14 -30 l-3 -3 M-4 -28 l4 1', tn.ln(2.5, o.spr || '#3DA8D8'));
  if (o.cherry) c += CI(0, -58, 6, tn.ol('#E2434B', 2.5));
  return G(c, tr(x, y, s));
}
// FLOUR POWER bakery box (origin = bottom centre, 130 x 74 at s 1). o: col, open (lid up, cupcakes visible)
function cupcakeBox(x, y, s = 1, tn = tone(), o = {}) {
  const col = o.col || '#FF9EBB';
  let b = R(-65, -74, 130, 74, 6, tn.fl(col)) + R(-65, -74, 130, 74, 6, { fill: 'url(#shStripeBox)', stroke: tn.line, 'stroke-width': 4 });
  b += R(-44, -58, 88, 38, 16, tn.ol('#FFFFFF', 3)) + P('M-36 -30 L-38 -42 L-22 -42 L-24 -30 Z M-40 -42 Q-40 -54 -30 -54 Q-20 -54 -20 -42 Z', tn.ol('#C8456A', 2)) + TF('FLOUR POWER', 8, -34, 10, tn.c('#C8456A'));
  if (o.open) b += P('M-65 -74 L-56 -132 L74 -132 L65 -74 Z', tn.ol(mix(col, '#FFFFFF', 0.25), 4)) + cupcake(-30, -72, 0.7, tn) + cupcake(4, -72, 0.7, tn, { frost: '#FFF4E0', cherry: true }) + cupcake(36, -72, 0.7, tn, { frost: '#B98A5A' });
  return G(b, tr(x, y, s));
}
// slice of toast (origin = bottom centre, 60 x 66 at s 1). o: burnt 0..1
function toast(x, y, s = 1, rot = 0, tn = tone(), o = {}) {
  const bk = b01(o.burnt);
  const crust = mix('#C98A3E', '#2A1E1A', bk), mid = mix('#F4CE8A', '#3A2A24', bk);
  let b = P('M-30 0 L-30 -46 Q-36 -66 -14 -66 Q0 -74 14 -66 Q36 -66 30 -46 L30 0 Z', tn.ol(crust, 4)) + P('M-22 -6 L-22 -44 Q-26 -58 -10 -58 Q0 -64 10 -58 Q26 -58 22 -44 L22 -6 Z', tn.fl(mid));
  if (bk > 0.5) b += P('M-12 -44 l6 6 M8 -30 l-4 6 M-4 -20 l6 2', tn.ln(3, '#151012', 0.8));
  else b += P('M-14 -40 q8 -6 16 0', tn.ln(3, '#FFF0C8', 0.6));
  return G(b, tr(x, y, s, rot));
}
// retro mint toaster (origin = bottom centre, 150 x 96 at s 1). o: toast 0..1 (0 down in the slots .. .35 popped up ..
// 1 flying high + spinning), burnt 0..1, smoke (t: rising smoke puffs), lever 0..1 (pushed down), glow (slots glow red)
function toaster(x, y, s = 1, tn = tone(), o = {}) {
  const k = b01(o.toast), bk = o.burnt === undefined ? 1 : b01(o.burnt);
  let b = '';
  // toast slices behind the body
  const up = k < 0.35 ? (k / 0.35) * 46 : 46 + (k - 0.35) / 0.65 * 360;
  const spin = k > 0.35 ? (k - 0.35) / 0.65 * 300 : 0;
  b += toast(-28 - spin * 0.1, -70 - up, 0.85, -spin * 0.6, tn, { burnt: bk }) + toast(28 + spin * 0.15, -70 - up * 1.06, 0.85, spin * 0.8, tn, { burnt: bk });
  b += P('M-75 0 L-75 -60 Q-75 -96 -40 -96 L40 -96 Q75 -96 75 -60 L75 0 Z', tn.ol('#8FD8C4', 5)) + P('M-60 -8 L-60 -58 Q-60 -82 -36 -84', tn.ln(8, '#FFFFFF', 0.45));
  b += R(-58, -100, 50, 12, 5, tn.ol('#2A2D38', 3)) + R(8, -100, 50, 12, 5, tn.ol('#2A2D38', 3));
  if (o.glow) b += R(-54, -97, 42, 6, 3, { fill: '#FF5A2A', opacity: 0.9 }) + R(12, -97, 42, 6, 3, { fill: '#FF5A2A', opacity: 0.9 });
  b += R(-75, -30, 150, 10, 0, tn.fl('#6FBCA8')) + R(-80, -6, 160, 8, 4, tn.ol('#C9CED8', 3));
  const lv = b01(o.lever);
  b += R(70, -70 + lv * 34, 22, 14, 4, tn.ol('#2A2D38', 3)) + CI(-40, -50, 9, tn.ol('#FFFFFF', 2.5)) + P('M-40 -50 l5 -4', tn.ln(2.5));
  if (o.smoke !== undefined && o.smoke !== false) {
    const tt = +o.smoke || 0;
    let sd = '';
    for (let i = 0; i < 5; i++) { const u = md(tt * 0.5 + i / 5, 1); sd += dC(-20 + Math.sin(tt * 1.7 + i * 2) * 26 + u * 20, -110 - u * 220, 14 + u * 26); }
    b += P(sd, { fill: tn.c('#5A5560'), opacity: 0.45 });
  }
  return G(b, tr(x, y, s));
}
// red twin-bell alarm clock (origin = bottom centre, ~120 x 130 at s 1). o: ring 0..1 (shakes, hammer + motion lines), t, time
function alarmClock(x, y, s = 1, tn = tone(), o = {}) {
  const rk = b01(o.ring), t = o.t || 0;
  const sh = rk * Math.sin(t * 60) * 7, jump = rk * Math.abs(Math.sin(t * 30)) * 8;
  let c = P('M-34 0 L-44 16 M34 0 L44 16', tn.ln(8)) + P('M-34 0 L-44 16 M34 0 L44 16', tn.ln(4, '#C9CED8'));
  c += P('M-40 -96 A26 26 0 0 1 -6 -124 Z', tn.ol('#E2434B', 4)) + P('M40 -96 A26 26 0 0 0 6 -124 Z', tn.ol('#E2434B', 4));
  c += P(`M0 -112 L${f(rk ? Math.sin(t * 60) * 22 : -16)} -132`, tn.ln(5)) + CI(rk ? Math.sin(t * 60) * 22 : -16, -134, 5, tn.ol('#C9CED8', 2.5));
  c += CI(0, -54, 52, tn.ol('#E2434B', 5)) + CI(0, -54, 40, tn.ol('#FFF8EC', 3.5));
  let tk = '';
  for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; tk += `M${f(Math.sin(a) * 34)} ${f(-54 - Math.cos(a) * 34)} L${f(Math.sin(a) * (i % 3 ? 30 : 27))} ${f(-54 - Math.cos(a) * (i % 3 ? 30 : 27))} `; }
  c += P(tk, tn.ln(2.5));
  let h = 7, m = 0;
  const p = String(o.time || '7:00').split(':'); h = +p[0] || 0; m = +p[1] || 0;
  const am = ((h % 12) + m / 60) / 12 * Math.PI * 2, mm = m / 60 * Math.PI * 2;
  c += P(`M0 -54 L${f(Math.sin(am) * 18)} ${f(-54 - Math.cos(am) * 18)}`, tn.ln(5)) + P(`M0 -54 L${f(Math.sin(mm) * 27)} ${f(-54 - Math.cos(mm) * 27)}`, tn.ln(3.5)) + CI(0, -54, 4, tn.fl('#E2434B'));
  c += P('M-30 -80 A40 40 0 0 1 -6 -92', tn.ln(5, '#FFFFFF', 0.6));
  let lines = '';
  if (rk > 0.05) {
    for (const sx of [-1, 1]) lines += `M${f(sx * 62)} -110 l${f(sx * 18)} -14 M${f(sx * 70)} -76 l${f(sx * 22)} 0 M${f(sx * 62)} -42 l${f(sx * 18)} 12 `;
    lines = P(lines, tn.ln(5, LINE, rk));
  }
  return G(G(c, `translate(${f(sh)} ${f(-jump)}) rotate(${f(sh * 0.8)} 0 -54)`) + lines, tr(x, y, s));
}
// a smelly white sock lying on the floor (origin = bottom centre, ~120 x 46 at s 1). o: stink (t: wavy green lines), col
function sock(x, y, s = 1, tn = tone(), o = {}) {
  const col = o.col || '#F2F0EA';
  let c = P('M-60 -40 L-12 -40 Q4 -40 10 -30 Q16 -20 34 -20 Q62 -20 62 -8 Q62 2 44 2 L-50 2 Q-60 2 -60 -8 Z', tn.ol(col, 4));
  c += P('M-60 -40 L-40 -40 L-40 2 L-50 2 Q-60 2 -60 -8 Z', tn.ol('#FFFFFF', 3.5)) + P('M-54 -34 V-4 M-47 -36 V-2', tn.ln(2.5, '#C9C9D2'));
  c += P('M-36 -30 H-4 M-36 -20 H-2', tn.ln(5, '#E2434B')) + P('M36 -18 Q60 -18 60 -6 Q58 2 44 2 L32 2 Q26 -8 36 -18 Z', tn.fl('#C9C2A8')) + P('M-2 -40 Q8 -36 10 -28', tn.fl('#C9C2A8'));
  c += P(dC(-18, -8, 5) + dC(14, -6, 4), tn.fl('#D8D2BC'));
  if (o.stink !== undefined && o.stink !== false) {
    const tt = +o.stink || 0;
    let sd = '';
    for (let i = 0; i < 3; i++) { const u = md(tt * 0.6 + i / 3, 1); sd += `M${f(-24 + i * 26)} ${f(-50 - u * 70)} q-10 -10 0 -20 q10 -10 0 -20 `; }
    c += P(sd, { fill: 'none', stroke: tn.c('#7ACB4A'), 'stroke-width': 5, 'stroke-linecap': 'round', opacity: 0.7 });
  }
  return G(c, tr(x, y, s));
}
// brown-paper grocery bag (origin = bottom centre, 110 x 130 at s 1 + produce on top). o: kind 0|1|2 (what sticks out)
function groceryBag(x, y, s = 1, tn = tone(), o = {}) {
  const kd = (o.kind || 0) % 3;
  let b = '';
  if (kd === 0) b += P('M-14 -120 L30 -200', tn.ln(22)) + P('M-14 -120 L30 -200', tn.ln(14, '#E8B05A')) + P('M-4 -146 l10 -6 M8 -168 l10 -6', tn.ln(3, '#B9762E'));
  if (kd === 1) b += P('M-20 -122 Q-26 -170 -10 -190 M-6 -122 Q-4 -176 10 -196 M8 -122 Q16 -168 34 -180', tn.ln(9, '#3E8A4A')) + P(dC(-10, -192, 10) + dC(10, -198, 11) + dC(34, -182, 10), tn.ol('#5DB55A', 3));
  if (kd === 2) b += R(-30, -170, 40, 56, 6, tn.ol('#FFFFFF', 3.5)) + P('M-30 -170 L-10 -188 L10 -170', tn.ol('#7FC8E8', 3)) + CI(28, -134, 18, tn.ol('#E2434B', 3)) + P('M28 -152 l4 -8', tn.ln(3, '#6A3E22'));
  b += P('M-54 0 L-50 -124 L50 -124 L54 0 Z', tn.ol('#D9A66A', 4.5)) + P('M-50 -124 L-42 -112 L-34 -124 L-26 -112 L-18 -124 L-10 -112 L-2 -124 L6 -112 L14 -124 L22 -112 L30 -124 L38 -112 L46 -124', tn.ln(3, '#B9824A'));
  b += P('M-36 -18 L-34 -100', tn.ln(4, '#FFFFFF', 0.3)) + R(-26, -84, 52, 34, 6, tn.fl('#C8925A')) + TF('SHOP', 0, -61, 15, tn.c('#7A4A22'));
  return G(b, tr(x, y, s));
}
// framed picture (origin = centre). kind: 'wrestle79' (THE 1979 final: young Lou with a big moustache + hair, the crowd,
// a young woman with a heart = Grandma), 'bakery' (Mom's grand opening), 'babyYou', 'maxDino', 'biscuitPup', 'family',
// 'beach', 'wedding'. o: col (frame colour), mat
function photoFrame(kind, x, y, w, h, rot = 0, tn = tone(), o = {}) {
  const C = tn.c, O = tn.ol, LN = tn.ln, FL = tn.fl;
  const fw = Math.max(8, Math.min(w, h) * 0.09);
  let p = R(-w / 2 + 5, -h / 2 + 7, w, h, 4, { fill: '#000', opacity: 0.14 }) + R(-w / 2, -h / 2, w, h, 4, O(o.col || '#8A5634', 4));
  const iw = w - 2 * fw, ih = h - 2 * fw;
  p += R(-iw / 2, -ih / 2, iw, ih, 2, O(o.mat || '#FFF8EC', 2.5));
  const pw = iw - fw * 0.8, ph = ih - fw * 0.8;
  const k = Math.min(pw / 100, ph / 80);
  let c = '';
  const head = (hx_, hy, r, skin = '#F6D5BC') => dRR(hx_ - r, hy - r, 2 * r, 2 * r, r * 0.45);
  if (kind === 'wrestle79') {
    c += R(-50, -40, 100, 80, 0, FL('#D8B88A')) + R(-50, -40, 100, 24, 0, FL('#8A6A9A'));
    c += R(-44, -38, 88, 12, 2, O('#E2434B', 1.5)) + TF('FINALS 1979', 0, -29, 8, C('#FFF4D0'));
    c += P(head(-38, -14, 6) + head(-24, -16, 6) + head(26, -16, 6) + head(40, -14, 6), FL('#B99A7A'));
    c += P(head(-8, -14, 6), FL('#F2C9B0')) + P('M-12 -24 l4 -6 l4 6', LN(1.2, '#E2434B')) + P('M-12 -28 q4 -4 8 0 q-4 6 -8 0', FL('#E2434B'));
    c += R(-46, 18, 92, 22, 2, O('#7A4A2A', 1.5));
    c += R(-34, -6, 22, 24, 4, O('#E8C07A', 1.5)) + P(head(-23, -12, 8), O('#F6D5BC', 1.5)) + P('M-31 -18 Q-23 -24 -15 -18 L-15 -14 L-31 -14 Z', FL('#6A3E22')) + P('M-29 -8 q6 4 12 0', LN(2.5, '#4A2A16'));
    c += R(12, -8, 26, 26, 4, O('#6A7A9A', 1.5)) + P(head(25, -14, 9), O('#E8B898', 1.5));
    c += P('M-14 8 L0 0 L14 6', LN(5, '#151515')) + P('M-14 8 L0 0 L14 6', LN(3, '#F6D5BC')) + CI(0, 0, 3.5, O('#F6D5BC', 1.2));
  } else if (kind === 'bakery') {
    c += R(-50, -40, 100, 80, 0, FL('#BFE2F6')) + R(-40, -24, 80, 64, 0, O('#FFE8CC', 1.5)) + R(-44, -34, 88, 14, 2, O('#FF9EBB', 1.5)) + TF('FLOUR POWER', 0, -24, 8, C('#FFFFFF'));
    c += R(-30, -10, 24, 30, 2, O('#BFE2F6', 1.2)) + R(8, -4, 18, 44, 2, O('#C8456A', 1.2));
    c += P('M-46 12 H46', LN(2.5, '#E2434B')) + P(head(-16, 4, 7), O('#F6D5BC', 1.5)) + R(-24, 12, 16, 28, 3, O('#FFFFFF', 1.5)) + P('M-23 -2 h14 v-5 h-14 Z', FL('#8A3B22'));
  } else if (kind === 'babyYou') {
    c += R(-50, -40, 100, 80, 0, FL('#FFE1EC')) + P(dE(0, 30, 34, 20), O('#BFE2F6', 1.5)) + P(head(0, -2, 20), O('#FFFFFF', 1.5)) + P('M-20 -12 Q-18 -26 0 -26 Q18 -26 20 -12 L10 -14 L0 -8 L-10 -14 Z', O('#C86A1E', 1.5)) + CI(-7, -2, 4, FL('#151515')) + CI(7, -2, 4, FL('#151515')) + P('M-4 8 q4 3 8 0', LN(1.5));
  } else if (kind === 'maxDino') {
    c += R(-50, -40, 100, 80, 0, FL('#FFF2B8')) + P('M-22 40 L-22 -6 Q-22 -30 0 -30 Q22 -30 22 -6 L22 40 Z', O('#5DB55A', 1.5)) + P('M-18 -26 l6 -10 l6 8 l6 -10 l6 8 l6 -8', O('#3E8A4A', 1.2)) + P(head(0, 0, 12), O('#F6D5BC', 1.5)) + CI(-4, -1, 2, FL('#151515')) + CI(4, -1, 2, FL('#151515')) + P('M-5 6 q5 4 10 0', LN(1.5)) + TF('RAWR', 28, -22, 9, C('#E2434B'));
  } else if (kind === 'biscuitPup') {
    c += R(-50, -40, 100, 80, 0, FL('#CDEBC8')) + P(dE(0, 18, 28, 16), O('#E8A35A', 1.5)) + P(dE(0, -6, 18, 15), O('#E8A35A', 1.5)) + P('M-16 -14 L-14 -32 L-4 -18 Z M16 -14 L14 -32 L4 -18 Z', O('#E8A35A', 1.5)) + P(dE(0, 0, 9, 6), FL('#FFF4E4')) + CI(-6, -8, 2.2, FL('#151515')) + CI(6, -8, 2.2, FL('#151515')) + CI(0, -2, 2.5, FL('#151515'));
  } else if (kind === 'family') {
    c += R(-50, -40, 100, 80, 0, FL('#FFE6C4')) + R(-50, 10, 100, 30, 0, FL('#8FD06A'));
    const ppl = [[-34, -2, '#7A8AA8', '#E8E2D4'], [-14, -8, '#FF9EBB', '#8A3B22'], [6, 0, '#D8262E', '#C86A1E'], [22, 8, '#5DB55A', '#6A3E22'], [38, -4, '#C9A06A', '#F2F2F2']];
    for (const [px, py, cc, hc] of ppl) c += R(px - 7, py + 6, 14, 30, 3, O(cc, 1.2)) + P(head(px, py, 7), O('#F6D5BC', 1.2)) + P(`M${px - 7} ${py - 2} h14 v-5 h-14 Z`, FL(hc));
  } else if (kind === 'beach') {
    c += R(-50, -40, 100, 80, 0, FL('#8FD0F6')) + R(-50, 8, 100, 32, 0, FL('#3E8FD0')) + R(-50, 22, 100, 18, 0, FL('#F7DCA0')) + CI(30, -20, 10, FL('#FFE14D')) + P(head(-12, 10, 7), O('#F6D5BC', 1.2)) + P(head(6, 12, 6), O('#F6D5BC', 1.2));
  } else if (kind === 'wedding') {
    c += R(-50, -40, 100, 80, 0, FL('#E8DCC8')) + P(head(-12, -10, 9), O('#F6D5BC', 1.5)) + P('M-22 -16 Q-12 -26 -2 -16 L-2 -14 L-22 -14 Z', FL('#6A3E22')) + R(-22, 0, 20, 40, 3, O('#3A3F52', 1.5)) + P('M-18 -4 q6 4 12 0', LN(2, '#4A2A16'));
    c += P(head(12, -8, 8), O('#F6D5BC', 1.5)) + P('M2 -14 Q12 -26 22 -14 L24 0 L0 0 Z', FL('#E0A040')) + P('M2 2 L22 2 L28 40 L-4 40 Z', O('#FFFFFF', 1.5)) + P('M8 -18 q4 -6 8 0', LN(1.5, '#FFFFFF'));
  }
  p += G(c, `scale(${f(k)})`);
  p += P(`M${f(-iw / 2 + 4)} ${f(ih / 2 - 6)} L${f(-iw / 2 + iw * 0.3)} ${f(-ih / 2 + 4)}`, LN(3, '#FFFFFF', 0.35));
  return G(p, tr(x, y, 1, rot));
}
// Grandpa's "79" trophy: gold cup with an arm-wrestling topper on a walnut base (origin = bottom centre, ~120 x 230 at s 1)
function trophy79(x, y, s = 1, tn = tone(), o = {}) {
  const gold = o.col || '#F5C33B', gs = mix(gold, '#8A5A00', 0.35);
  let b = R(-56, -34, 112, 34, 5, tn.ol('#7A4A2A', 4)) + R(-46, -26, 92, 18, 3, tn.ol('#E8C77A', 2.5)) + TF('FINALIST', 0, -13, 10, tn.c('#5A3A1A'));
  b += R(-34, -52, 68, 18, 4, tn.ol(gs, 4)) + P('M-12 -52 L-8 -82 L8 -82 L12 -52 Z', tn.ol(gold, 4));
  b += P('M-52 -176 Q-54 -100 0 -86 Q54 -100 52 -176 Z', tn.ol(gold, 5)) + P('M-52 -166 Q-86 -164 -80 -134 Q-74 -112 -44 -112', tn.ln(9)) + P('M-52 -166 Q-86 -164 -80 -134 Q-74 -112 -44 -112', tn.ln(5, gold)) + P('M52 -166 Q86 -164 80 -134 Q74 -112 44 -112', tn.ln(9)) + P('M52 -166 Q86 -164 80 -134 Q74 -112 44 -112', tn.ln(5, gold));
  b += E(0, -176, 52, 9, tn.ol(gs, 4)) + P('M-36 -160 Q-36 -118 -10 -104', tn.ln(6, '#FFF4C0', 0.75));
  b += T('79', 2, -122, 40, tn.c('#FFF4C0'), OUTX(5, tn.line));
  // topper: two forearms clasped (arm wrestling)
  b += P('M-30 -184 L-6 -222 M30 -184 L6 -222', tn.ln(16)) + P('M-30 -184 L-6 -222 M30 -184 L6 -222', tn.ln(9, gold)) + CI(0, -226, 12, tn.ol(gold, 3.5));
  return G(b, tr(x, y, s));
}
// Biscuit's dog bed: plaid rim + cream cushion + bone toy (origin = bottom centre, 520 x 150 at s 1 — use the hero's s)
function dogBed(x, y, s = 1, tn = tone(), o = {}) {
  let b = E(0, 4, 270, 34, { fill: '#000', opacity: 0.14 });
  b += P('M-260 -40 Q-270 0 -200 2 L200 2 Q270 0 260 -40 Q250 -96 0 -100 Q-250 -96 -260 -40 Z', tn.ol(o.col || '#D9484E', 6)) + P('M-260 -40 Q-270 0 -200 2 L200 2 Q270 0 260 -40 Q250 -96 0 -100 Q-250 -96 -260 -40 Z', { fill: 'url(#shPlaid)' });
  b += E(0, -62, 200, 34, tn.ol('#FFF1DA', 5)) + E(0, -58, 170, 22, tn.fl('#F2DDBE'));
  b += P('M-250 -50 Q0 -24 250 -50', tn.ln(5, '#FFFFFF', 0.35));
  if (o.bone !== false) b += G(R(-34, -8, 68, 16, 8, tn.ol('#FFFFFF', 3.5)) + P(dC(-36, -8, 10) + dC(-36, 8, 10) + dC(36, -8, 10) + dC(36, 8, 10), tn.ol('#FFFFFF', 3.5)) + R(-30, -6, 60, 12, 6, tn.fl('#FFFFFF')), 'translate(150 -70) rotate(-14)');
  if (o.plate !== false) b += G(R(-70, -20, 140, 40, 12, tn.ol('#FFE14D', 4)) + TF('BISCUIT', 0, 9, 24, tn.c('#7A4A22')), 'translate(0 -16)');
  return G(b, tr(x, y, s));
}
// potted plant (origin = pot bottom centre). kind 'fern'|'snake'|'round'|'monstera'
function plant(x, y, s = 1, tn = tone(), kind = 'fern', pot = '#E8764A') {
  let p = '';
  if (kind === 'snake') p += P('M-26 -60 L-34 -190 L-14 -70 M-6 -60 L-2 -230 L10 -64 M14 -60 L36 -176 L26 -62', tn.ol('#3E8A4A', 4)) + P('M-30 -150 l4 -6 M0 -180 l3 -8 M30 -140 l-3 -6', tn.ln(3, '#9ACD6A'));
  else if (kind === 'round') p += blob(dC(0, -110, 56) + dC(-40, -84, 38) + dC(40, -84, 38), tn.c('#5DB55A'), 4, tn.line) + P(dC(-20, -130, 18) + dC(26, -112, 12), tn.fl('#8FD67A'));
  else if (kind === 'monstera') {
    for (const [a, l] of [[-50, 150], [-15, 190], [25, 170], [60, 130]]) p += G(P(`M0 0 L0 ${-l * 0.5}`, tn.ln(5, '#3E8A4A')) + P(`M0 ${-l * 0.45} Q-46 ${-l * 0.7} 0 ${-l} Q46 ${-l * 0.7} 0 ${-l * 0.45} Z`, tn.ol('#3FA05A', 4)) + P(`M0 ${-l * 0.5} V${-l * 0.95}`, tn.ln(3, '#2E7A44')), `translate(0 -62) rotate(${a})`);
  } else for (let i = -3; i <= 3; i++) p += P(`M0 -62 Q${i * 22} -150 ${i * 46} ${-120 - (3 - Math.abs(i)) * 20}`, tn.ln(12)) + P(`M0 -62 Q${i * 22} -150 ${i * 46} ${-120 - (3 - Math.abs(i)) * 20}`, tn.ln(7, i % 2 ? '#5DB55A' : '#4AA050'));
  p += P('M-42 -64 L-32 0 L32 0 L42 -64 Z', tn.ol(pot, 4.5)) + R(-48, -74, 96, 16, 5, tn.ol(mix(pot, '#000000', 0.12), 4));
  return G(p, tr(x, y, s));
}
// pixels bursting out of a point (the Reality HUD update). k 0..1 (0 = nothing, .1 = burst starts, 1 = spread over ~1300 px)
// o: n (default 44), seed, spread (px), dir ('all' | 'front': mostly toward camera/down-left-right), cols
function pixelBurst(cx, cy, k, o = {}) {
  if (k <= 0.001) return '';
  const n = o.n || 44, seed = o.seed || 3, spread = o.spread || 1300;
  const cols = o.cols || ['#7CF7FF', '#3DA8FF', '#FFFFFF', '#B07CFF', '#4DE8FF', '#FF7AD8'];
  const ds = cols.map(() => '');
  for (let i = 0; i < n; i++) {
    const a = hash(i * 1.37 + seed) * Math.PI * 2, v = 0.25 + 0.75 * hash(i * 2.11 + seed);
    const d = spread * v * Math.pow(k, 0.8) * (0.6 + 0.4 * hash(i * 5.3 + seed));
    const x = cx + Math.cos(a) * d * 1.25, y = cy + Math.sin(a) * d * 0.75 + 220 * k * k * hash(i * 7.7);
    const sz = (10 + 26 * hash(i * 3.9 + seed)) * (0.5 + 1.1 * k);
    if (hash(i * 9.1 + seed) > 1.15 - k) continue;
    ds[i % cols.length] += dR(x - sz / 2, y - sz / 2, sz, sz);
  }
  const op = k > 0.85 ? (1 - k) / 0.15 : 1;
  return ds.map((d, i) => P(d, { fill: cols[i], opacity: f(0.92 * op) })).join('');
}

// ================================================================= 1. BEDROOM — YOUR gamer room (SC02 gaming, SC03 the update night + HUD morning)
// Front view of the back wall: teal upper wall under a navy band with a row of red PIXEL HEARTS (an HP bar frieze), white
// chair rail, navy board wainscot, honey plank floor with the CONTROLLER RUG. LEFT: the nightstand with the red twin-bell
// ALARM CLOCK; the walnut bed (pillow at the left, navy duvet with pixel hearts) under the window (mustard curtains; night
// sky + moon / sunrise, the neighbour's roof, an oak branch). The DRAGON PEAK poster. RIGHT: the charcoal gaming desk with
// an RGB edge, the big monitor on its stand (o.pcScreen), speakers, RGB keyboard, the goblin + dragon figurines, the RGB
// tower under the desk; the purple gaming chair; the standing MIRROR; the door (off-frame right, x 1950+). The sock lies on
// the floor in front of the bed.
// Layer order:  bg (window view) · mid (room, bed back + mattress, desk, chair when 'front') · [YOU lying / sitting up in
//   bed, YOU in the chair (back view)] · front (duvet front + footboard, the chair back when 'back') · [people on FLOOR 990]
//   · fg ('') · light (night darkness, screen glow, update flash, sunbeam)
// opts: { time 'night'|'morning'|'day'|'evening' (default night), pcScreen svg|fn(w, h) (the monitor, 400 x 230; default:
//   a DRAGON PEAK title screen at night, off by day), pc (default true), glow 0..1 or [{x, y, k, col, r}] (screen light on
//   YOU; default 1 at night when the monitor is on), glowCol ('blue'|'cyan'|'white'|'pink'|'warm'), pixels 0..1 (the
//   update: the screen flashes white, pixels fly out of the monitor across the room), blackout 0..1 (everything goes dark —
//   after the install), ring 0..1 (the alarm clock rings: shakes, bell hammer, motion lines), clock 'H:MM' (alarm clock,
//   default 7:00), tuck 0..1 (the duvet pulled up over YOU lying in bed: 0 folded at the foot .. 1 up to the chin; default
//   .7 in the morning, else 0 — use .9 with SPOTS.bedroom.bed.lie, .7 with .sitUp), sock (default true; stink lines), led (ceiling RGB strip, default on at night/evening),
//   lamp 0..1 (nightstand lamp), chair 'back'|'front'|false (default 'back'), mirrorView svg|fn(w, h) (the reflection inside
//   the mirror glass, 130 x 380), curtains 0..1 (0 open .. 1 drawn; default .15), mess 0..1 (default .5: backpack, controller,
//   game cases, hoodie), stars (default true at night) }
const BD = {
  ceil: 40, base: 720, rail: 470,
  win: { x0: 360, y0: 130, x1: 700, y1: 410 },
  bed: { x0: 160, x1: 930, top: 676, drop: 862, floor: 905 },
  stand: { x0: 4, x1: 136, top: 604 },
  desk: { x0: 1040, x1: 1610, top: 620, floor: 866 },
  mon: { cx: 1325, cy: 344, w: 400, h: 230 },
  mirror: { x0: 1680, x1: 1830, y0: 236, y1: 716, floor: 808 },
  door: { x0: 1950, x1: 2150, top: 200 },
  chair: { x: 1325, seat: 790 },
  rug: { x: 1030, y: 968 },
  sock: { x: 730, y: 948 },
  poster: { x: 870, y: 270 },
};
def(`<clipPath id="shClipBDMon"><rect x="${BD.mon.cx - BD.mon.w / 2}" y="${BD.mon.cy - BD.mon.h / 2}" width="${BD.mon.w}" height="${BD.mon.h}" rx="5"/></clipPath>`);
def(`<clipPath id="shClipBDMirror"><rect x="${BD.mirror.x0 + 12}" y="${BD.mirror.y0 + 12}" width="${BD.mirror.x1 - BD.mirror.x0 - 24}" height="${BD.mirror.y1 - BD.mirror.y0 - 24}" rx="40"/></clipPath>`);
// default monitor picture: the DRAGON PEAK title screen (w x h box centred on 0,0)
function dragonTitle(w, h, t = 0) {
  let s = R(-w / 2, -h / 2, w, h, 0, { fill: '#2A1A5A' }) + R(-w / 2, -h * 0.1, w, h * 0.6, 0, { fill: '#4A2A7A' });
  s += P(`M${f(-w / 2)} ${f(h / 2)} L${f(-w * 0.2)} ${f(-h * 0.18)} L${f(-w * 0.05)} ${f(h * 0.05)} L${f(w * 0.12)} ${f(-h * 0.3)} L${f(w / 2)} ${f(h / 2)} Z`, { fill: '#1A0E3A' });
  s += CI(w * 0.3, -h * 0.25, h * 0.1, { fill: '#FFE7A8' });
  const fl = Math.sin(t * 6) * 6;
  s += G(P('M0 0 Q20 -18 44 -6 Q30 4 0 0 Z M-30 6 Q-50 -30 -20 -28 Q-10 -6 -30 6 Z', { fill: '#E2434B', stroke: '#151515', 'stroke-width': 3 }) + P(`M-10 -4 L-40 ${f(-30 + fl)} L-6 -14 Z M10 -4 L36 ${f(-34 - fl)} L8 -16 Z`, { fill: '#B8303A', stroke: '#151515', 'stroke-width': 3 }), `translate(${f(w * 0.1)} ${f(-h * 0.02)}) scale(${f(h / 230)})`);
  s += T('DRAGON PEAK', 0, -h * 0.3, h * 0.15, '#FFD23F', OUTX(h * 0.03, '#151515'));
  if (Math.floor(t * 2) % 2 === 0) s += TF('PRESS START', 0, h * 0.38, h * 0.08, '#FFFFFF');
  return s;
}
// one row of pixel hearts (the HP frieze): returns path data
function heartRow(x0, x1, y, size, gap) {
  let d = '';
  const u = size / 9;
  for (let x = x0; x < x1; x += size + gap) {
    d += `M${f(x + u)} ${f(y)}h${f(2 * u)}v${f(u)}h${f(u)}v${f(-u)}h${f(2 * u)}v${f(u)}h${f(u)}v${f(3 * u)}h${f(-u)}v${f(u)}h${f(-u)}v${f(u)}h${f(-u)}v${f(u)}h${f(-u)}v${f(u)}h${f(-u)}v${f(-u)}h${f(-u)}v${f(-u)}h${f(-u)}v${f(-u)}h${f(-u)}v${f(-u)}h${f(-u)}v${f(-3 * u)}h${f(u)}Z`;
  }
  return d;
}
const GLOWID = { blue: 'shGlowBlue', cyan: 'shGlowCyan', white: 'shGlowWhite', pink: 'shGlowPink', warm: 'shGlowWarm', tv: 'shGlowTV', moon: 'shGlowMoon' };
function bedroomLayers(t, o = {}) {
  const time = o.time || 'night', nite = time === 'night', morn = time === 'morning', eve = time === 'evening';
  const px = b01(o.pixels), black = b01(o.blackout);
  const flash = px > 0 ? sm(0.02, 0.12, px) * (1 - sm(0.3, 0.75, px)) : 0;        // white flash at the start of the burst
  const tn = tone(nite ? { night: 0.82, dim: black * 0.8 } : morn ? { morn: 0.6, dim: black * 0.8 } : eve ? { eve: 0.6, dim: black * 0.8 } : { dim: black * 0.8 });
  const C = tn.c, O = tn.ol, LN = tn.ln, FL = tn.fl;
  const W = BD.win, B = BD.bed, D = BD.desk, M = BD.mon, MR = BD.mirror;
  const pcOn = o.pc !== false;
  const monOn = pcOn && black < 0.9 && ((o.pcScreen !== undefined && o.pcScreen !== null && o.pcScreen !== false) || nite || px > 0);
  const ledOn = o.led === undefined ? (nite || eve) : !!o.led;
  const curt = o.curtains === undefined ? 0.15 : b01(o.curtains);
  // ---------------- bg: through the window
  let bg = R(W.x0 - 40, W.y0 - 40, W.x1 - W.x0 + 80, W.y1 - W.y0 + 80, 0, { fill: `url(#${nite ? 'shSkyNight' : morn ? 'shSkyMorning' : eve ? 'shSkyEvening' : 'shSkyDay'})` });
  if (nite) bg += R(W.x0 - 40, W.y0 - 40, W.x1 - W.x0 + 80, 220, 0, { fill: 'url(#shStars)' }) + glow(610, 200, 110, 'shGlowMoon', 0.9) + CI(610, 200, 30, { fill: '#FFF4C8', stroke: '#E8D490', 'stroke-width': 4 }) + CI(600, 192, 6, { fill: '#F0E2A8' }) + CI(620, 210, 4.5, { fill: '#F0E2A8' });
  else if (morn) bg += glow(450, 360, 130, 'shGlowWarm', 0.95) + CI(450, 372, 34, { fill: '#FFE9A8', stroke: '#FFC24A', 'stroke-width': 5 }) + shCloud(620, 230, 0.42, tn, '#FFFFFF', '#FFD8C0');
  else bg += shCloud(560, 230, 0.45, tn, '#FFFFFF', eve ? '#F2B0C0' : '#DCEBFA');
  // the neighbour's roof + a lit attic window, then the branch
  bg += P(`M${W.x0 - 40} 410 L${W.x0 - 40} 330 L470 290 L580 330 L580 410 Z`, O(nite ? '#2A3466' : '#F2B8A0', 4)) + P(`M${W.x0 - 50} 336 L470 282 L590 336`, LN(12, nite ? '#1A2048' : '#7A4FB8')) + R(450, 330, 40, 40, 4, O(nite ? '!#FFD27A' : '#CDEEFF', 3));
  bg += R(580, 360, W.x1 + 40 - 580, 60, 0, FL(nite ? '#1A2450' : '#7CC86A'));
  const sw = Math.sin(t * 0.7) * 1.5;
  bg += G(P('M720 170 Q640 200 580 186', LN(14, nite ? '#141A38' : '#7A4A2A')) + blob(dE(586, 182, 38, 22) + dE(630, 204, 30, 18) + dE(660, 172, 26, 16), C(nite ? '#1C2752' : '#5DB55A'), 3, tn.line), `rotate(${f(sw)} 720 170)`);
  // ---------------- mid: the room
  let m = '';
  const wallD = `M${XL} ${YT} H${XR} V${BD.base} H${XL} Z M${W.x0} ${W.y0} V${W.y1} H${W.x1} V${W.y0} Z`;
  m += P(wallD, { fill: C('#3E9EA2'), 'fill-rule': 'evenodd' });
  m += R(XL, YT, XR - XL, BD.ceil - YT, 0, FL('#E8F0EC')) + band(BD.ceil - 4, BD.ceil + 10, O('#FFFFFF', 4));
  // HP frieze: navy band + pixel hearts
  m += band(BD.ceil + 10, BD.ceil + 56, FL('#2E4374')) + P(heartRow(XL + 20, XR, BD.ceil + 20, 27, 31), FL('#E8484E')) + P(`M${XL} ${BD.ceil + 56} H${XR}`, LN(4, LINE, 0.6));
  // RGB led strip under the ceiling trim
  if (ledOn) m += band(BD.ceil + 8, BD.ceil + 14, { fill: 'url(#shRGB)' });
  // wainscot (navy boards) + chair rail
  m += band(BD.rail, BD.base, FL('#2E4374')) + band(BD.rail, BD.base, { fill: 'url(#shBoards)' }) + band(BD.rail - 6, BD.rail + 12, O('#FFFFFF', 4));
  // window: frame, mullions, mustard curtains, sill
  {
    let w = P(`M${W.x0 - 20} ${W.y0 - 20} H${W.x1 + 20} V${W.y1 + 6} H${W.x0 - 20} Z M${W.x0} ${W.y0} V${W.y1} H${W.x1} V${W.y0} Z`, { fill: C('#FFFFFF'), 'fill-rule': 'evenodd', stroke: tn.line, 'stroke-width': 6 });
    const wc = (W.x0 + W.x1) / 2;
    w += R(wc - 6, W.y0, 12, W.y1 - W.y0, 3, O('#FFFFFF', 3.5)) + R(W.x0, 262, W.x1 - W.x0, 11, 3, O('#FFFFFF', 3.5));
    w += P(`M${W.x0 + 20} ${W.y0 + 100} L${W.x0 + 76} ${W.y0 + 8} L${W.x0 + 98} ${W.y0 + 8} L${W.x0 + 42} ${W.y0 + 100} Z M${wc + 30} ${W.y1 - 12} L${wc + 84} ${W.y1 - 100} L${wc + 98} ${W.y1 - 100} L${wc + 44} ${W.y1 - 12} Z`, { fill: '#FFFFFF', opacity: nite ? 0.07 : 0.24 });
    w += R(W.x0 - 34, W.y1 + 2, W.x1 - W.x0 + 68, 20, 6, O('#FFFFFF', 4.5));
    const cs = Math.sin(t * 1.1) * 3, cw = 70 + curt * (W.x1 - W.x0) * 0.42;
    for (const [cx, d] of [[W.x0 - 30, 1], [W.x1 + 30, -1]]) {
      const inner = cx + d * cw;
      const cp = `M${cx - 30 * d} ${W.y0 - 40} L${f(inner)} ${W.y0 - 40} Q${f(inner - d * 16 + cs)} 300 ${f(inner - d * 26 + cs)} ${W.y1 + 50} Q${f(cx + d * 10)} ${W.y1 + 64} ${f(cx - 30 * d + cs)} ${W.y1 + 56} Z`;
      w += P(cp, O('#F2A33A', 5)) + P(`M${f(cx + d * cw * 0.35)} ${W.y0 - 30} Q${f(cx + d * cw * 0.4 + cs)} 300 ${f(cx + d * cw * 0.3 + cs)} ${W.y1 + 44} M${f(cx + d * cw * 0.7)} ${W.y0 - 30} Q${f(cx + d * cw * 0.75 + cs)} 300 ${f(cx + d * cw * 0.62 + cs)} ${W.y1 + 46}`, LN(4, '#C97A1E', 0.8));
    }
    w += R(W.x0 - 80, W.y0 - 50, W.x1 - W.x0 + 160, 12, 6, O('#2E4374', 3.5)) + CI(W.x0 - 80, W.y0 - 44, 10, O('#F2A33A', 3)) + CI(W.x1 + 80, W.y0 - 44, 10, O('#F2A33A', 3));
    m += w;
  }
  // glow-in-the-dark stars on the ceiling band area (night)
  if (o.stars === undefined ? nite : o.stars) {
    let st = '';
    for (const [x, y, r] of [[230, 140, 11], [790, 120, 9], [1000, 470, 0], [180, 330, 9], [990, 140, 12], [1630, 130, 10], [1560, 210, 7]]) if (r) st += `M${x} ${y - r} L${x + r * 0.3} ${y - r * 0.3} L${x + r} ${y} L${x + r * 0.3} ${y + r * 0.3} L${x} ${y + r} L${x - r * 0.3} ${y + r * 0.3} L${x - r} ${y} L${x - r * 0.3} ${y - r * 0.3} Z `;
    m += P(st, nite ? { fill: '#E8FF9A', opacity: 0.85 } : FL('#F2F0C8'));
  }
  // DRAGON PEAK poster (LV 90 dragon) + a small PIXEL KNIGHTS poster
  {
    const p0 = BD.poster;
    let pc = R(-104, -138, 208, 276, 6, O('#2A1A5A', 5)) + R(-94, -128, 188, 256, 3, FL('#4A2A8A')) + R(-94, 40, 188, 88, 0, FL('#2A1A4A'));
    pc += P('M-94 128 L-40 20 L0 70 L50 -10 L94 60 L94 128 Z', FL('#1A0E36')) + CI(52, -78, 22, FL('#FFE7A8'));
    const dr = P('M-8 -16 L-30 -84 L-2 -56 L12 -96 L26 -44 L14 -10 Z', O('#B8303A', 4)) + P('M-40 6 Q-74 22 -84 -10 Q-76 2 -62 0 Q-50 -2 -38 -8 Z', O('#E2434B', 4)) + E(0, 0, 42, 22, O('#E2434B', 4)) + P('M30 -8 Q54 -22 58 -50 L74 -46 Q70 -10 40 10 Z', O('#E2434B', 4));
    pc += G(dr + P('M54 -58 L88 -54 Q96 -46 86 -40 L62 -38 Z', O('#E2434B', 4)) + P('M58 -58 L54 -72 L66 -60', O('#B8303A', 3)) + CI(72, -50, 3.5, FL('!#FFE14D')) + P('M90 -46 Q106 -52 118 -40 Q104 -42 112 -30 Q98 -36 92 -40 Z', O('#FFB13B', 3)) + P('M-20 18 v14 M16 18 v14', LN(8)) + P('M-20 4 Q0 14 24 6', LN(4, '#FFC0B0', 0.6)), 'translate(-24 -6) scale(0.82)');
    pc += T('DRAGON PEAK', 0, -98, 28, C('#FFD23F'), OUTX(6, tn.line)) + R(-44, 92, 88, 26, 8, O('#E2434B', 3)) + TF('LV 90', 0, 112, 18, C('#FFFFFF'));
    m += G(pc, `translate(${p0.x} ${p0.y}) rotate(2)`);
  }
  // nightstand + the ALARM CLOCK + a little lamp
  {
    const N = BD.stand;
    let n = R(N.x0, N.top, N.x1 - N.x0, BD.base + 70 - N.top, 6, O('#C98A52', 5)) + R(N.x0 + 12, N.top + 34, N.x1 - N.x0 - 24, 64, 5, O('#B07A44', 3.5)) + CI((N.x0 + N.x1) / 2, N.top + 66, 6, O('#F2A33A', 2));
    n += R(N.x0 - 6, N.top - 6, N.x1 - N.x0 + 12, 16, 5, O('#D99A62', 4));
    const lampK = b01(o.lamp);
    n += G(E(0, -2, 18, 5, O('#2E4374', 3)) + P('M0 -4 V-52', LN(6)) + P('M0 -4 V-52', LN(3, '#2E4374')) + P('M-28 -48 L-18 -92 L18 -92 L28 -48 Z', O(lampK > 0.02 ? '!' + mix('#F2D48A', '#FFF0C0', lampK) : '#F2D48A', 4)), `translate(${N.x0 + 26} ${N.top})`);
    m += n;
    if (o.alarmClock !== false) m += alarmClock(N.x1 - 46, N.top, 0.72, tn, { ring: o.ring, t, time: o.clock || '7:00' });
  }
  // the bed: headboard, footboard, mattress + sheet, pillow, folded duvet back part
  {
    let b = P(`M${B.x0} ${B.floor} L${B.x0} 470 Q${B.x0} 430 ${B.x0 + 46} 430 Q${B.x0 + 92} 430 ${B.x0 + 92} 470 L${B.x0 + 92} ${B.floor} Z`, O('#8A5434', 6)) + R(B.x0 + 16, 470, 60, 170, 10, FL('#A0683E')) + P(`M${B.x0 + 10} 470 Q${B.x0 + 46} 446 ${B.x0 + 82} 470`, LN(4, '#FFFFFF', 0.35));
    b += R(B.x0 + 80, B.top - 6, B.x1 - B.x0 - 110, 40, 12, O('#FFFFFF', 5));
    b += P(`M${B.x0 + 96} ${B.top + 2} Q${B.x0 + 86} ${B.top - 66} ${B.x0 + 150} ${B.top - 70} L${B.x0 + 232} ${B.top - 70} Q${B.x0 + 282} ${B.top - 66} ${B.x0 + 272} ${B.top + 2} Q${B.x0 + 184} ${B.top + 16} ${B.x0 + 96} ${B.top + 2} Z`, O('#FFFFFF', 5)) + P(`M${B.x0 + 112} ${B.top - 22} Q${B.x0 + 184} ${B.top - 8} ${B.x0 + 258} ${B.top - 26}`, LN(4, '#C9D8E8'));
    b += P(`M${B.x1 - 40} ${B.floor} L${B.x1 - 40} 620 Q${B.x1 - 40} 590 ${B.x1 - 10} 590 Q${B.x1 + 20} 590 ${B.x1 + 20} 620 L${B.x1 + 20} ${B.floor} Z`, O('#8A5434', 6)) + R(B.x1 - 28, 624, 36, 120, 8, FL('#A0683E'));
    // a plush goblin on the bed + a controller
    b += G(R(-26, -50, 52, 50, 12, O('#7ACB4A', 4)) + P('M-26 -40 L-46 -54 L-24 -30 M26 -40 L46 -54 L24 -30', O('#7ACB4A', 3.5)) + CI(-9, -28, 4.5, FL(LINE)) + CI(9, -28, 4.5, FL(LINE)) + P('M-8 -14 Q0 -8 8 -14', LN(3)) + P('M-4 -14 l2 5 l2 -5', FL('#FFFFFF')), `translate(${B.x1 - 92} ${B.top + 4}) rotate(-8)`);
    m += b;
  }
  // the gaming desk: charcoal top with an RGB edge, monitor on its stand, speakers, keyboard, figurines, tower underneath
  {
    let d = R(D.x0 + 10, D.top + 18, 22, D.floor - D.top - 18, 4, O('#2C2F3A', 4)) + R(D.x1 - 32, D.top + 18, 22, D.floor - D.top - 18, 4, O('#2C2F3A', 4));
    d += R(D.x0 + 34, D.top + 18, 170, 90, 6, O('#3A3E4C', 4)) + R(D.x0 + 50, D.top + 40, 138, 10, 4, FL('#545A6C'));
    // tower (glass side, RGB fans)
    const tx = D.x1 - 160, ty = D.floor;
    d += R(tx - 56, ty - 190, 112, 190, 8, O('#22252E', 4.5)) + R(tx - 44, ty - 176, 64, 160, 5, FL(black > 0.5 ? '#14161C' : '#1A1C24'));
    const fanCol = black > 0.5 || !pcOn ? '#2A2D38' : null;
    for (const fy of [-140, -92, -44]) d += CI(tx - 12, ty + fy, 19, fanCol ? O(fanCol, 3) : { fill: 'url(#shRGB)', stroke: tn.line, 'stroke-width': 3, opacity: nite ? 1 : 0.8 }) + CI(tx - 12, ty + fy, 6, FL('#151515'));
    d += R(tx + 26, ty - 176, 16, 6, 2, FL(pcOn && black < 0.5 ? '!#3DFF9A' : '#2A2D38'));
    // desk top + RGB edge
    d += R(D.x0 - 10, D.top - 16, D.x1 - D.x0 + 20, 24, 6, O('#2C2F3A', 5)) + R(D.x0, D.top + 2, D.x1 - D.x0, 6, 3, pcOn && black < 0.5 ? { fill: 'url(#shRGB)', opacity: nite ? 1 : 0.75 } : FL('#3A3E4C'));
    // monitor
    if (pcOn) {
      const x0 = M.cx - M.w / 2, y0 = M.cy - M.h / 2;
      d += R(M.cx - 16, y0 + M.h + 6, 32, D.top - 16 - y0 - M.h - 6, 4, O('#2A2D38', 4)) + E(M.cx, D.top - 16, 74, 9, O('#2A2D38', 4));
      d += R(x0 - 14, y0 - 14, M.w + 28, M.h + 34, 12, O('#1C1E27', 5)) + CI(x0 + M.w - 8, y0 + M.h + 10, 3.5, FL(monOn ? '!#3DFF9A' : '!#FF8A2A'));
      let scr = R(x0, y0, M.w, M.h, 5, FL(monOn ? '#05060A' : '#161A26'));
      if (monOn) {
        const inner = o.pcScreen !== undefined && o.pcScreen !== null && o.pcScreen !== false ? screenOf(o.pcScreen, M.w, M.h) : dragonTitle(M.w, M.h, t);
        scr += G(G(inner, tr(M.cx, M.cy)), null, { 'clip-path': 'url(#shClipBDMon)' });
        if (flash > 0.01) scr += R(x0, y0, M.w, M.h, 5, { fill: '#F2FFFF', opacity: f(flash) });
        if (black > 0) scr += R(x0, y0, M.w, M.h, 5, { fill: '#05060A', opacity: f(black) });
      } else scr += P(`M${x0 + 30} ${y0} L${x0 + 110} ${y0} L${x0 + 36} ${y0 + M.h} L${x0} ${y0 + M.h} L${x0} ${y0 + 60} Z`, { fill: '#FFFFFF', opacity: 0.06 });
      d += scr + R(x0, y0, M.w, M.h, 5, { fill: 'url(#shShine)', opacity: 0.4 }) + R(x0, y0, M.w, M.h, 5, LN(3, '#0A0B10'));
      // speakers, keyboard, mouse, figurines, a soda can
      d += R(D.x0 + 16, D.top - 110, 56, 96, 10, O('#2A2D38', 4)) + CI(D.x0 + 44, D.top - 80, 15, O('#3A3E4C', 3)) + CI(D.x0 + 44, D.top - 38, 9, O('#3A3E4C', 3));
      d += R(D.x1 - 72, D.top - 110, 56, 96, 10, O('#2A2D38', 4)) + CI(D.x1 - 44, D.top - 80, 15, O('#3A3E4C', 3)) + CI(D.x1 - 44, D.top - 38, 9, O('#3A3E4C', 3));
      const kb = dP([[M.cx - 120, D.top - 26], [M.cx + 120, D.top - 26], [M.cx + 130, D.top - 10], [M.cx - 130, D.top - 10]]);
      d += P(kb, { fill: black < 0.5 ? 'url(#shRGB)' : C('#2A2D38'), stroke: tn.line, 'stroke-width': 3.5, 'stroke-linejoin': 'round' }) + E(M.cx + 180, D.top - 16, 16, 8, O('#2A2D38', 3));
      d += G(R(-18, -40, 36, 40, 8, O('#7ACB4A', 3.5)) + P('M-18 -34 L-30 -46 L-16 -26 M18 -34 L30 -46 L16 -26', O('#7ACB4A', 3)) + CI(-6, -24, 3, FL(LINE)) + CI(6, -24, 3, FL(LINE)) + R(-16, -2, 32, 6, 2, FL('#2E4374')), `translate(${D.x0 + 120} ${D.top - 16})`);
      d += G(P('M-24 0 Q-30 -36 0 -40 Q26 -44 30 -20 L40 -30 L34 -8 Q30 0 24 0 Z', O('#E2434B', 3.5)) + P('M-6 -40 L-14 -60 L4 -42 Z', O('#B8303A', 3)) + CI(14, -30, 3, FL('!#FFE14D')), `translate(${D.x1 - 130} ${D.top - 16})`);
      d += G(R(-11, -34, 22, 34, 5, O('#3DA8D8', 3)) + R(-11, -24, 22, 10, 0, FL('#FFFFFF')), `translate(${M.cx - 200} ${D.top - 16})`);
    }
    m += d;
  }
  // standing mirror (o.mirrorView = the reflection)
  {
    const x0 = MR.x0, x1 = MR.x1, y0 = MR.y0, y1 = MR.y1, cx = (x0 + x1) / 2;
    let mr = P(`M${cx - 40} ${MR.floor} L${cx - 10} ${y1 - 20} M${cx + 40} ${MR.floor} L${cx + 10} ${y1 - 20}`, LN(14)) + P(`M${cx - 40} ${MR.floor} L${cx - 10} ${y1 - 20} M${cx + 40} ${MR.floor} L${cx + 10} ${y1 - 20}`, LN(8, '#E0B07A'));
    mr += R(x0, y0, x1 - x0, y1 - y0, 52, O('#E0B07A', 6)) + R(x0 + 12, y0 + 12, x1 - x0 - 24, y1 - y0 - 24, 40, O(nite ? '#3A4A78' : '#BFE4EE', 3.5));
    if (o.mirrorView) mr += G(G(screenOf(o.mirrorView, x1 - x0 - 24, y1 - y0 - 24), tr(cx, (y0 + y1) / 2)), null, { 'clip-path': 'url(#shClipBDMirror)' });
    else mr += G(P(`M${x0 + 12} ${y0 + 380} L${x1 - 12} ${y0 + 300} L${x1 - 12} ${y1} L${x0 + 12} ${y1} Z`, FL(nite ? '#2E3A62' : '#9FC8D8')) + R(x0 + 30, y0 + 250, 50, 90, 6, FL(nite ? '#2E4374' : '#7AA6C2')), null, { 'clip-path': 'url(#shClipBDMirror)' });
    mr += P(`M${x0 + 30} ${y0 + 140} L${x0 + 90} ${y0 + 60} M${x0 + 30} ${y0 + 200} L${x0 + 118} ${y0 + 84}`, LN(9, '#FFFFFF', nite ? 0.15 : 0.55)) + R(x0 + 12, y0 + 12, x1 - x0 - 24, y1 - y0 - 24, 40, LN(3.5));
    m += mr;
  }
  // the door (just off-frame right)
  {
    const Dr = BD.door;
    m += R(Dr.x0 - 18, Dr.top - 18, Dr.x1 - Dr.x0 + 36, BD.base - Dr.top + 22, 4, O('#FFFFFF', 5)) + R(Dr.x0, Dr.top, Dr.x1 - Dr.x0, BD.base - Dr.top, 4, O('#F2E8D8', 5)) + P(dRR(Dr.x0 + 22, Dr.top + 26, Dr.x1 - Dr.x0 - 44, 180, 8) + dRR(Dr.x0 + 22, Dr.top + 236, Dr.x1 - Dr.x0 - 44, 230, 8), { fill: 'none', stroke: C('#D8CCB8'), 'stroke-width': 4 }) + CI(Dr.x0 + 26, 480, 10, O('#F2A33A', 3));
    m += G(R(-62, -26, 124, 52, 6, O('#2E4374', 3.5)) + TF('GAMER', 0, -3, 17, C('#FFD23F')) + TF('ZONE', 0, 17, 17, C('#FFD23F')), `translate(${(Dr.x0 + Dr.x1) / 2} ${Dr.top + 120}) rotate(-4)`);
  }
  // floor: honey planks + skirting + the CONTROLLER RUG
  {
    m += R(XL, BD.base, XR - XL, YB - BD.base, 0, FL('#D99A5C')) + R(XL, BD.base, XR - XL, YB - BD.base, 0, { fill: 'url(#shGrain)' });
    let jn = '';
    for (let i = 0; i < 6; i++) { const y = BD.base + 26 + i * 26 + i * i * 8; jn += `M${XL} ${f(y)} H${XR} `; }
    m += P(jn, LN(3, '#B07A44', 0.6)) + band(BD.base - 12, BD.base + 2, O('#FFFFFF', 3.5)) + band(BD.base + 2, BD.base + 12, { fill: '#000', opacity: 0.08 });
    const rx = BD.rug.x, ry = BD.rug.y;
    const body = `M${rx - 250} ${ry - 26} Q${rx - 250} ${ry - 70} ${rx - 170} ${ry - 72} L${rx + 170} ${ry - 72} Q${rx + 250} ${ry - 70} ${rx + 250} ${ry - 26} Q${rx + 270} ${ry + 50} ${rx + 200} ${ry + 58} Q${rx + 140} ${ry + 60} ${rx + 100} ${ry + 20} L${rx - 100} ${ry + 20} Q${rx - 140} ${ry + 60} ${rx - 200} ${ry + 58} Q${rx - 270} ${ry + 50} ${rx - 250} ${ry - 26} Z`;
    m += P(body, O('#8A93A8', 5)) + P(body, { fill: 'url(#shCarpet)' });
    m += P(`M${rx - 186} ${ry - 26} h22 v-18 h22 v18 h22 v22 h-22 v18 h-22 v-18 h-22 Z`, O('#3A3F52', 3));
    m += E(rx + 150, ry - 46, 15, 7, O('#3DA8FF', 2.5)) + E(rx + 190, ry - 28, 15, 7, O('#E8484E', 2.5)) + E(rx + 110, ry - 28, 15, 7, O('#F2C14E', 2.5)) + E(rx + 150, ry - 10, 15, 7, O('#5DC85A', 2.5));
    m += E(rx - 60, ry - 4, 34, 14, O('#3A3F52', 3)) + E(rx + 60, ry - 4, 34, 14, O('#3A3F52', 3)) + R(rx - 30, ry - 52, 60, 14, 7, O('#5A6278', 2.5));
  }
  // mess: backpack by the desk, game cases, hoodie on the floor, controller
  {
    const mk = o.mess === undefined ? 0.5 : b01(o.mess);
    if (mk > 0.05) m += G(R(-46, -100, 92, 100, 22, O('#E8743A', 4.5)) + R(-30, -50, 60, 40, 10, O('#C9582A', 3.5)) + P('M-28 -100 Q0 -136 28 -100', LN(7)) + P('M-28 -100 Q0 -136 28 -100', LN(3.5, '#2E4374')) + R(-30, -98, 14, 70, 6, FL('#2E4374')), `translate(${D.x0 + 6} 872) rotate(-6)`);
    if (mk > 0.3) m += G(R(-30, -8, 60, 10, 3, O('#2E4374', 3)) + R(-24, -16, 54, 10, 3, O('#E2434B', 3)), 'translate(1160 900) rotate(6)') + G(R(-26, -6, 52, 10, 3, O('#5DB55A', 3)), 'translate(1190 884) rotate(-10)');
    if (mk > 0.6) m += P('M480 930 Q520 900 600 912 Q660 906 640 940 Q560 954 480 930 Z', O('#E2434B', 4)) + P('M520 922 Q560 916 600 922', LN(3, '#B8303A'));
  }
  // the gaming chair facing camera (o.chair 'front'): its back sits in mid
  const chairMode = o.chair === undefined ? 'back' : o.chair;
  const CH = BD.chair;
  const chairBack = (front) => {
    const hb = front ? 254 : 160;
    let c = P(`M${CH.x - 92} ${CH.seat - 4} L${CH.x - 84} ${CH.seat - hb + 54} Q${CH.x - 78} ${CH.seat - hb + 4} ${CH.x} ${CH.seat - hb} Q${CH.x + 78} ${CH.seat - hb + 4} ${CH.x + 84} ${CH.seat - hb + 54} L${CH.x + 92} ${CH.seat - 4} Z`, O('#2A2438', 5));
    c += P(`M${CH.x - 46} ${CH.seat - 6} L${CH.x - 42} ${CH.seat - hb + 26} Q${CH.x} ${CH.seat - hb + 12} ${CH.x + 42} ${CH.seat - hb + 26} L${CH.x + 46} ${CH.seat - 6} Z`, FL('#7A4FD6'));
    if (!front) c += P(`M${CH.x - 84} ${CH.seat - hb + 60} L${CH.x - 108} ${CH.seat - 70} L${CH.x - 92} ${CH.seat - 40} M${CH.x + 84} ${CH.seat - hb + 60} L${CH.x + 108} ${CH.seat - 70} L${CH.x + 92} ${CH.seat - 40}`, LN(14)) + P(`M${CH.x - 84} ${CH.seat - hb + 60} L${CH.x - 108} ${CH.seat - 70} L${CH.x - 92} ${CH.seat - 40} M${CH.x + 84} ${CH.seat - hb + 60} L${CH.x + 108} ${CH.seat - 70} L${CH.x + 92} ${CH.seat - 40}`, LN(7, '#3A3150'));
    if (front) c += R(CH.x - 40, CH.seat - 220, 80, 46, 14, O('#2A2438', 3)) + TF('GG', CH.x, CH.seat - 188, 22, C('#7A4FD6'));
    else c += P(`M${CH.x - 30} ${CH.seat - 230} L${CH.x + 30} ${CH.seat - 230}`, LN(4, '#9A78F0', 0.6));
    return c;
  };
  const chairBase = () => R(CH.x - 96, CH.seat - 8, 192, 30, 13, O('#3A3150', 5)) + P(`M${CH.x} ${CH.seat + 20} V${CH.seat + 66}`, LN(15)) + P(`M${CH.x} ${CH.seat + 20} V${CH.seat + 66}`, LN(8, '#7A8094')) + P(`M${CH.x - 66} ${CH.seat + 90} L${CH.x} ${CH.seat + 66} L${CH.x + 66} ${CH.seat + 90} M${CH.x - 30} ${CH.seat + 96} L${CH.x} ${CH.seat + 66} L${CH.x + 30} ${CH.seat + 96}`, LN(12)) + P(`M${CH.x - 66} ${CH.seat + 90} L${CH.x} ${CH.seat + 66} L${CH.x + 66} ${CH.seat + 90} M${CH.x - 30} ${CH.seat + 96} L${CH.x} ${CH.seat + 66} L${CH.x + 30} ${CH.seat + 96}`, LN(6, '#3A3150'));
  if (chairMode === 'front') m += chairBack(true) + chairBase();
  else if (chairMode === 'back') m += chairBase();
  // the sock (Smell +99)
  if (o.sock !== false) m += sock(BD.sock.x, BD.sock.y, 0.75, tn, { stink: t });
  // ---------------- front: the duvet + bed front, the footboard post, the chair back
  let fr = '';
  {
    const tuck = o.tuck === undefined ? (morn ? 0.7 : 0) : b01(o.tuck);
    // bed rail + legs + duvet front drop (navy, pixel hearts) with a scalloped hem
    fr += R(B.x0 + 80, B.drop - 30, B.x1 - B.x0 - 110, B.floor - B.drop + 18, 4, O('#7A4A2E', 4)) + R(B.x0 + 90, B.floor - 20, 22, 26, 3, O('#6A3E24', 3)) + R(B.x1 - 62, B.floor - 20, 22, 26, 3, O('#6A3E24', 3));
    const dd = B.drop - 40;
    let dv = `M${B.x0 + 86} ${B.top + 18} L${B.x1 - 26} ${B.top + 18} L${B.x1 - 18} ${dd - 10}`;
    for (let x = B.x1 - 18; x > B.x0 + 90; x -= 58) dv += ` Q${x - 29} ${dd + 10} ${f(Math.max(B.x0 + 90, x - 58))} ${dd - 10}`;
    dv += ' Z';
    fr += R(B.x0 + 84, B.top + 30, B.x1 - B.x0 - 100, B.drop - B.top - 8, 10, O('#FFFFFF', 4)) + P(`M${B.x0 + 96} ${B.drop - 12} H${B.x1 - 26}`, LN(4, '#C9D8E8'));
    fr += P(dv, O('#2F3F7A', 5)) + P(dv, { fill: 'url(#shHearts)' }) + P(`M${B.x0 + 90} ${B.top + 36} H${B.x1 - 24}`, LN(6, '#F2C14E'));
    let fo = '';
    for (const fx of [300, 470, 660, 820]) fo += `M${fx} ${B.top + 50} Q${fx - 10} ${(B.top + B.drop) / 2} ${fx + 6} ${B.drop - 20} `;
    fr += P(fo, LN(4, '#1E2A5A', 0.55));
    // the duvet top: folded at the foot (tuck 0) .. pulled up to the chin (tuck 1)
    const xl = lerp(B.x1 - 230, B.x0 + 236, tuck), hump = 24 + 92 * tuck;
    const tq = `M${f(xl - 6)} ${B.top + 22} Q${f(xl - 18)} ${f(B.top - hump)} ${f(xl + 40)} ${f(B.top - hump)} L${f(lerp(xl, B.x1, 0.55))} ${f(B.top - hump * 0.86)} Q${f(B.x1 - 90)} ${f(B.top - hump * 0.84)} ${f(B.x1 - 60)} ${f(B.top - hump * 0.55)} Q${B.x1 - 24} ${f(B.top - hump * 0.2)} ${B.x1 - 24} ${B.top + 22} Z`;
    fr += P(tq, O('#33468A', 5)) + P(tq, { fill: 'url(#shHearts)' }) + P(`M${f(xl - 4)} ${f(B.top - hump * 0.4)} Q${f(xl + 4)} ${f(B.top - hump * 0.92)} ${f(xl + 50)} ${f(B.top - hump * 0.92)}`, LN(9, '#FFFFFF', 0.95)) + P(`M${f(xl + 100)} ${f(B.top - hump * 0.7)} Q${f(xl + 140)} ${f(B.top - hump * 0.4)} ${f(xl + 130)} ${B.top + 10}`, LN(4, '#1E2A5A', 0.5));
    // footboard post in front
    fr += R(B.x1 - 40, 640, 60, B.floor - 640, 4, O('#8A5434', 6)) + R(B.x1 - 30, 660, 14, B.floor - 690, 5, FL('#A0683E')) + R(B.x1 - 46, 630, 72, 18, 6, O('#9A6038', 4));
  }
  if (chairMode === 'back') fr += R(CH.x - 110, CH.seat - 14, 220, 40, 16, O('#3A3150', 5)) + P(`M${CH.x - 114} ${CH.seat + 20} L${CH.x - 98} ${CH.seat + 74} L${CH.x + 98} ${CH.seat + 74} L${CH.x + 114} ${CH.seat + 20} Z`, O('#2A2438', 4.5)) + P(`M${CH.x - 90} ${CH.seat + 46} H${CH.x + 90}`, LN(4, '#4A4060')) + chairBack(false);
  // ---------------- light
  let light = '';
  const glowK = Array.isArray(o.glow) ? 0 : b01(o.glow, nite && monOn ? 1 : 0) * (1 - black);
  const gid = GLOWID[o.glowCol || 'blue'] || 'shGlowBlue';
  if (nite) {
    light += cover({ fill: '#050A26', opacity: 0.16 }) + darkRing(monOn ? M.cx - 200 : 700, 560, 900, 520, '#02041A', 0.36, 8);
    light += P(dP([[W.x0 + 6, W.y0 + 6], [W.x1 - 6, W.y0 + 6], [W.x1 + 200, B.top + 10], [W.x0 + 60, B.top + 10]]), { fill: 'url(#shBeamBlue)', opacity: 0.3 });
    if (ledOn) light += band(BD.ceil + 14, BD.ceil + 120, { fill: '#B07CFF', opacity: 0.06 });
  } else if (morn) {
    light += P(dP([[W.x0 + 6, W.y0 + 6], [W.x1 - 6, W.y0 + 6], [W.x1 + 520, 1000], [W.x0 + 220, 1000]]), { fill: 'url(#shBeam)', opacity: 0.32 });
    let dm = '';
    for (let i = 0; i < 9; i++) { const u = md(t * 0.03 + hash(i * 3.3), 1), x = lerp(W.x0 + 60, W.x1 + 300, hash(i * 7.1)) + Math.sin(t * 0.7 + i) * 18 + u * 140, y = lerp(W.y0 + 60, 860, u); dm += dC(x, y, 2.6 + hash(i) * 1.8); }
    light += P(dm, { fill: '#FFF6D8', opacity: 0.7 }) + cover({ fill: '#FFB060', opacity: 0.05 });
  } else if (eve) light += cover({ fill: '#FF7A50', opacity: 0.05 });
  else light += P(dP([[W.x0 + 6, W.y0 + 6], [W.x1 - 6, W.y0 + 6], [W.x1 + 300, 1000], [W.x0 + 120, 1000]]), { fill: 'url(#shBeam)', opacity: 0.2 });
  if (monOn && black < 0.95) {
    const mk = nite ? 1 : 0.4;
    light += glow(M.cx, M.cy, 300, 'shGlowBlue', 0.5 * mk * (1 - black)) + P(dP([[M.cx - M.w / 2, M.cy + M.h / 2], [M.cx + M.w / 2, M.cy + M.h / 2], [M.cx + 330, 1000], [M.cx - 330, 1000]]), { fill: 'url(#shBeamScreen)', opacity: f(0.22 * mk * (1 - black)) });
  }
  if (glowK > 0.01) light += glow(CH.x, 560, 190, gid, 0.75 * glowK) + pool(CH.x, 900, 260, 60, '#7FD0FF', 0.12 * glowK, 3);
  if (Array.isArray(o.glow)) for (const g of o.glow) { const k = g.k ?? 1; if (k > 0.01) light += glow(g.x, g.y, g.r || 170, GLOWID[g.col] || gid, 0.75 * k); }
  if (o.lamp && b01(o.lamp) > 0.02) { const lk = b01(o.lamp); light += glow(BD.stand.x0 + 26, BD.stand.top - 70, 240, 'shGlowWarm', 0.9 * lk) + pool(240, 720, 360, 140, '#FFD58A', 0.12 * lk, 3); }
  if (px > 0) {
    light += cover({ fill: '#D8FFFF', opacity: f(0.55 * flash) }) + glow(M.cx, M.cy, 520, 'shGlowCyan', Math.min(1, flash * 1.4 + 0.3 * (1 - px)));
    light += pixelBurst(M.cx, M.cy, sm(0.06, 1, px), { n: 48, seed: 5, spread: 1250 });
  }
  if (black > 0) light += cover({ fill: '#02030E', opacity: f(0.55 * black) });
  return { bg, mid: m, front: fr, fg: '', light };
}
const bedroom = makeSet(bedroomLayers);

// ================================================================= 2. KITCHEN — Mom's bakery-warm family kitchen (SC02, SC03, SC07 evening, SC11)
// Peach walls with white dots, blueberry-blue cabinets with brass knobs, a cream fish-scale backsplash, a honey butcher-
// block counter, terracotta + cream hex floor. LEFT (off-frame at rest, x < 40): the back door, flour / sugar / cocoa
// canisters + Mom's pink stand mixer + a stack of FLOUR POWER boxes, the cream STOVE (frying pan, red kettle). In frame:
// the big COFFEE MACHINE + the 4-mug tree, the SINK under the window (cherry valance; the back yard: lawn, picket fence, a
// yellow neighbour house, a tree, birds), the mint TOASTER (SPOT). CENTRE: the breakfast table — cream cherry-print cloth
// with a red border (= layers.front) — 3 chairs behind it (Max's orange booster, YOU, Grandpa) + Mom's chair at the left
// end; breakfast: DINO-O's cereal, bowls, milk, toast, OJ, the cupcake stand, Grandpa's #79 mug, Mom's mugs. RIGHT: the
// TOWER of pink FLOUR POWER cupcake boxes (300 cupcakes before sunrise), the cream retro FRIDGE covered in Max's dinosaur
// drawings, YOUR knight-vs-dragon drawing, the bakery ORDERS note (300 CUPCAKES) and the calendar (SAT: FAIR ♥ DAY OFF);
// the wall clock; the doorway to the living room (x 1990+).
// Layer order:  bg (yard through the window) · [someone passing OUTSIDE: SPOTS.kitchen.outside, draw with k .8] · mid (room,
//   counter, chairs) · [seated family: H.seatPose(SPOTS.kitchen.seats.x, size)] · front (table + cloth + breakfast) ·
//   [people standing on FLOOR 990 / at the counter (SPOTS.kitchen.counterStand / sinkStand / stoveStand)] · fg ('') · light
// opts: { time 'morning'|'evening'|'day' (default morning: low sun through the window + sunbeam + dust; evening: dusk
//   window, pendant lamp + under-cabinet lights on), mess 0..1 (Max's cereal splash: milk splats + cereal O's spread from
//   his bowl over the wall, window, fridge, table and floor), dishes (evening: the sink full of suds, a wobbly tower of dirty
//   plates, pots, the drying rack), pancakes (SC11: YOUR messy breakfast for Mom — crooked pancake stack + syrup heart +
//   FOR MOM card + OJ + a dandelion in a glass at Mom's seat, batter bowl + whisk + egg shells + flour on the counter, a
//   pancake in the pan), toast 0..1 (the toaster: 0 down .. .35 popped .. 1 flying), burnt 0..1 (default 1), smoke (default
//   true when toast > 0 and burnt), cups 0..4 (Mom's empty coffee mugs lined up at her seat), coffee (default true: the
//   carafe half full + steam), boxes (default true: the cupcake box tower), bowls (default true), steam (default true),
//   lamp 0..1 (pendant; default 1 in the evening), clock 'H:MM', birds (default true by day), chairs (default true) }
const KT = {
  ceil: 40, base: 700,
  win: { x0: 230, y0: 120, x1: 520, y1: 380 },
  counter: { x1: 740, top: 548, front: 566 },
  stove: { x0: -250, x1: 40 },
  table: { x0: 760, x1: 1590, back: 640, top: 690, hem: 878, feet: 905 },
  tower: { x: 1650 },
  fridge: { x0: 1716, x1: 1960, top: 104 },
  door: { x0: 1990, x1: 2250, top: 150 },
  clock: { x: 1650, y: 176, r: 44 },
  lamp: { x: 1175, y: 160 },
};
const KSEAT = {
  mom: { x: 808, hip: 712, s: 0.45, turn: 0.45 },
  max: { x: 948, hip: 648, s: 0.45 },
  you: { x: 1205, hip: 708, s: 0.45 },
  grandpa: { x: 1462, hip: 708, s: 0.45 },
};
function kitchenLayers(t, o = {}) {
  const time = o.time || 'morning', morn = time === 'morning', eve = time === 'evening';
  const tn = tone(morn ? { morn: 0.5 } : eve ? { eve: 0.55 } : {});
  const C = tn.c, O = tn.ol, LN = tn.ln, FL = tn.fl;
  const W = KT.win, TB = KT.table, CT = KT.counter, F = KT.fridge;
  const mess = b01(o.mess), dishes = !!o.dishes, pc = !!o.pancakes;
  const lampK = b01(o.lamp, eve ? 1 : 0);
  // ---------------- bg: the back yard through the window
  const bx0 = W.x0 - 40, bx1 = W.x1 + 40, by0 = W.y0 - 40, by1 = W.y1 + 40;
  let bg = R(bx0, by0, bx1 - bx0, by1 - by0, 0, { fill: `url(#${eve ? 'shSkyEvening' : morn ? 'shSkyMorning' : 'shSkyDay'})` });
  if (morn) bg += glow(300, 250, 120, 'shGlowWarm', 0.95) + CI(300, 254, 28, { fill: '#FFE9A8', stroke: '#FFC24A', 'stroke-width': 5 });
  else if (!eve) bg += CI(470, 170, 26, { fill: '#FFF0A0', stroke: '#FFC24A', 'stroke-width': 5 });
  bg += shCloud(440, 200, 0.42, tn, eve ? '#F8C8D8' : '#FFFFFF', eve ? '#D890B8' : morn ? '#FFDCC4' : '#DCEBFA');
  bg += P('M330 330 L330 262 L420 222 L510 262 L510 330 Z', O('#FFE08A', 4)) + P('M318 268 L420 214 L522 268', LN(12, '#C8553D')) + R(350, 280, 34, 32, 3, O(eve ? '!#FFD27A' : '#CDEEFF', 3)) + R(450, 280, 34, 32, 3, O('#CDEEFF', 3));
  bg += R(bx0, 320, bx1 - bx0, by1 - 320, 0, FL('#7CC864')) + R(bx0, 320, bx1 - bx0, by1 - 320, 0, { fill: 'url(#shLawn)' });
  let fence = '';
  for (let x = bx0; x < bx1; x += 28) fence += dP([[x, 360], [x, 312], [x + 12, 302], [x + 24, 312], [x + 24, 360]]);
  bg += P(fence, O('#FFFFFF', 3)) + P(`M${bx0} 322 H${bx1} M${bx0} 348 H${bx1}`, LN(4, '#C9CED8'));
  bg += leafTree(250, 400, 0.48, tn, { sway: Math.sin(t * 0.8) * 1.2 });
  if (o.birds === undefined ? !eve : o.birds) { const u = md(t * 0.07, 1); bg += shBird(lerp(bx0 - 40, bx1 + 40, u), 170 + Math.sin(u * 12) * 14, 0.5, tn, { flap: md(t * 4.5, 1) }) + shBird(476, 300 + Math.min(0, -Math.sin(t * 3) * 4), 0.45, tn, { flap: 0.25, col: '#E8604A' }); }
  // ---------------- mid: the room
  let m = '';
  const wallD = `M${XL} ${YT} H${XR} V${KT.base} H${XL} Z M${W.x0} ${W.y0} V${W.y1} H${W.x1} V${W.y0} Z`;
  m += P(wallD, { fill: C('#F6C29C'), 'fill-rule': 'evenodd' }) + P(wallD, { fill: 'url(#shDots)', 'fill-rule': 'evenodd' });
  m += R(XL, YT, XR - XL, KT.ceil - YT, 0, FL('#FFF4E2')) + band(KT.ceil - 4, KT.ceil + 16, O('#FFFFFF', 4)) + band(KT.ceil + 16, KT.ceil + 24, FL('#E8A77A'));
  // ---- the counter run (left)
  {
    let k = '';
    // backsplash
    const bsD = `M${XL} 290 H${CT.x1} V${CT.top} H${XL} Z M${W.x0} 290 V${W.y1} H${W.x1} V290 Z`;
    k += P(bsD, { fill: 'url(#shScale)', 'fill-rule': 'evenodd' }) + P(`M${XL} 290 H${W.x0 - 22} M${W.x1 + 22} 290 H${CT.x1}`, LN(4));
    // upper cabinets (blueberry) left of the window + right of it
    const upper = (x0, x1) => {
      let u = R(x0, 84, x1 - x0, 206, 4, O('#4C5E9E', 5));
      let ud = '', kn = '';
      for (let x = x0 + 12; x + 60 < x1; x += 136) { const w = Math.min(124, x1 - 12 - x); ud += dRR(x, 98, w, 178, 8); kn += dC(x + (((x - x0) / 136) % 2 ? 16 : w - 16), 252, 6); }
      return u + P(ud, { fill: C('#5E72B6'), stroke: C('#3A4A82'), 'stroke-width': 4 }) + P(kn, O('#F2C14E', 2.5)) + R(x0, 284, x1 - x0, 10, 0, FL('#3A4A82'));
    };
    k += upper(XL, KT.stove.x0 - 30) + upper(KT.stove.x1 + 20, W.x0 - 40) + upper(W.x1 + 40, CT.x1);
    // open shelf over the stove with spice jars + utensil rail
    k += R(-262, 196, 300, 14, 4, O('#D99A5B', 4)) + R(-262, 110, 300, 14, 4, O('#D99A5B', 4));
    let jars = '';
    for (let i = 0; i < 6; i++) jars += G(R(-14, -38, 28, 38, 6, O(['#E2434B', '#F2B84B', '#5DB55A', '#E8764A', '#8A5CFF', '#3DA8D8'][i], 3)) + R(-14, -44, 28, 10, 3, O('#FFFFFF', 2.5)), `translate(${-230 + i * 48} 196)`);
    jars += G(R(-50, -50, 100, 50, 6, O('#FFF6E4', 3.5)) + TF('RECIPES', 0, -20, 14, C('#E8764A')), 'translate(-180 110)') + cupcake(-60, 110, 0.9, tn, { cherry: true }) + G(P('M-26 0 Q-30 -40 0 -44 Q30 -40 26 0 Z', O('#8FD1B8', 3.5)) + P('M-6 -44 V-58', LN(4)), 'translate(0 110)');
    k += jars + P('M-240 340 H20', LN(6, '#B9BFC8')) + G(P('M0 0 V40 Q0 56 -14 56', LN(5, '#9AA4B4')) + P('M44 0 V44', LN(5, '#9AA4B4')) + E(44, 52, 10, 12, O('#F2C14E', 3)) + P('M90 0 V36', LN(5, '#9AA4B4')) + P('M80 36 h20 v18 h-20 Z', O('#9AA4B4', 3)) + P('M150 0 V50', LN(5, '#9AA4B4')) + P('M138 50 h24 l-4 12 h-16 Z', O('#E2434B', 3)), 'translate(-210 340)');
    // the stove: cream enamel, oven window, knobs + cooktop
    const sx0 = KT.stove.x0, sx1 = KT.stove.x1;
    k += R(sx0, CT.top - 8, sx1 - sx0, KT.base + 12 - CT.top + 8, 8, O('#FFF6E4', 5)) + R(sx0 + 28, CT.top + 60, sx1 - sx0 - 56, 100, 10, O('#3A3F52', 4)) + R(sx0 + 42, CT.top + 72, 90, 14, 4, { fill: '#FFFFFF', opacity: 0.18 }) + R(sx0 + 34, CT.top + 34, sx1 - sx0 - 68, 10, 4, O('#D8DDE4', 3));
    k += P(dC(sx0 + 40, CT.top + 16, 8) + dC(sx0 + 76, CT.top + 16, 8) + dC(sx1 - 76, CT.top + 16, 8) + dC(sx1 - 40, CT.top + 16, 8), O('#3A3F52', 2.5));
    // frying pan + kettle on the cooktop
    const panX = sx0 + 90;
    k += G(P('M-70 0 Q-70 18 -50 18 L50 18 Q70 18 70 0 Z', O('#2A2D38', 4)) + P('M66 4 L150 -6', LN(14)) + P('M66 4 L150 -6', LN(8, '#2A2D38')) + E(0, 0, 70, 9, O('#3A3F52', 3)), `translate(${panX} ${CT.top - 20})`);
    if (pc) k += E(panX - 4, CT.top - 22, 46, 8, O('#F2C46A', 3)) + E(panX - 12, CT.top - 24, 12, 3, FL('#D99A3A'));
    k += G(P('M-40 0 Q-46 -52 0 -56 Q46 -52 40 0 Z', O('#E2434B', 4)) + E(0, -56, 18, 6, O('#C03838', 3)) + CI(0, -64, 6, O('#3A3F52', 2.5)) + P('M36 -28 Q60 -36 64 -54', LN(9)) + P('M36 -28 Q60 -36 64 -54', LN(5, '#E2434B')) + P('M-26 -46 Q0 -88 26 -46', LN(6, '#3A3F52')) + P('M-28 -22 Q-22 -12 -10 -8', LN(4, '#FFFFFF', 0.5)), `translate(${sx1 - 70} ${CT.top - 4})`);
    // counter top + blueberry lower cabinets
    k += R(XL, CT.top, CT.x1 + 14 - XL, CT.front - CT.top, 5, O('#D99A5B', 4)) + R(XL, CT.top + 4, CT.x1 + 14 - XL, 4, 2, FL('#F0BE85'));
    const lowD = (x0, x1) => R(x0, CT.front, x1 - x0, KT.base + 12 - CT.front, 0, O('#4C5E9E', 5));
    k += lowD(XL, sx0) + lowD(sx1, CT.x1);
    let ld = '', lk = '';
    for (let x = XL + 20; x + 80 < sx0; x += 150) { ld += dRR(x, CT.front + 16, 134, 116, 8); lk += dC(x + 67, CT.front + 34, 5.5); }
    for (let x = sx1 + 14; x + 80 < CT.x1; x += 140) { const w = Math.min(126, CT.x1 - 12 - x); ld += dRR(x, CT.front + 16, w, 116, 8); lk += dC(x + w / 2, CT.front + 34, 5.5); }
    k += P(ld, { fill: C('#5E72B6'), stroke: C('#3A4A82'), 'stroke-width': 4 }) + P(lk, O('#F2C14E', 2.5)) + R(XL, KT.base, CT.x1 + 14 - XL, 12, 0, FL('#2E3A66'));
    // far left: back door, canisters, pink stand mixer, a stack of bakery boxes on the counter
    k += R(-760, 160, 220, KT.base - 160, 4, O('#E8DCC8', 5)) + R(-730, 190, 160, 150, 6, O(eve ? '#4A3E7A' : '#BFE4F4', 4)) + P('M-650 190 V340 M-730 265 H-570', LN(4, '#FFFFFF')) + CI(-570, 450, 9, O('#F2C14E', 3));
    const can = (x, label, col) => G(R(-30, -66, 60, 66, 10, O('#FFF6E4', 4)) + R(-34, -80, 68, 18, 8, O(col, 3.5)) + TF(label, 0, -26, 13, C(col)), `translate(${x} ${CT.top})`);
    k += can(-480, 'FLOUR', '#E8764A') + can(-410, 'SUGAR', '#3DA8D8') + can(-340, 'COCOA', '#8A5634');
    k += G(P('M-40 0 L-40 -20 L40 -20 L40 0 Z', O('#FF9EBB', 4)) + P('M24 -20 L24 -120 Q24 -140 0 -140 L-40 -140 Q-64 -140 -64 -116 L-64 -96 L-10 -96 L-10 -20', O('#FF9EBB', 4)) + P('M-56 -96 Q-58 -40 -26 -36 Q4 -40 2 -96 Z', O('#D8DDE4', 4)) + P('M-28 -96 V-60', LN(4, '#9AA4B4')), `translate(-292 ${CT.top})`);
    if (o.boxes !== false) for (let i = 0; i < 4; i++) k += cupcakeBox(-610 + (i % 2) * 8, CT.top - i * 62, 0.86, tn);
    // the coffee machine (+ carafe) and the 4-mug tree
    {
      const cx = 108, cy = CT.top;
      let cm = R(-58, -150, 116, 150, 12, O('#2A2D38', 4.5)) + R(-58, -150, 116, 34, 12, O('#E2434B', 4)) + R(-44, -104, 88, 8, 4, FL('#3A3F52'));
      cm += P('M-38 -8 L-42 -72 L42 -72 L38 -8 Z', O('#CDEAF4', 3.5));
      if (o.coffee !== false) cm += P('M-38 -10 L-40 -40 L40 -40 L38 -10 Z', FL('#6A3E22'));
      cm += P('M38 -60 Q58 -58 56 -30', LN(8)) + P('M38 -60 Q58 -58 56 -30', LN(4, '#2A2D38')) + R(-48, -8, 96, 8, 3, O('#3A3F52', 3)) + CI(40, -132, 5, FL('!#3DFF9A')) + TF('BREW', -10, -126, 13, C('#FFFFFF'));
      if (o.steam !== false && o.coffee !== false) { let sd = ''; for (let i = 0; i < 2; i++) { const u = md(t * 0.4 + i / 2, 1); sd += `M${f(-8 + i * 16 + Math.sin(t * 2 + i) * 5)} ${f(-156 - u * 70)} q-10 -12 0 -24 q10 -12 0 -24 `; } cm += P(sd, { fill: 'none', stroke: '#FFFFFF', 'stroke-width': 6, 'stroke-linecap': 'round', opacity: 0.5 }); }
      k += G(cm, `translate(${cx} ${cy})`);
      // mug tree
      k += P(`M196 ${cy} V${cy - 120} M196 ${cy - 100} l-26 -10 M196 ${cy - 70} l26 -10 M196 ${cy - 46} l-26 -10 M196 ${cy - 22} l26 -10`, LN(6, '#8A5634')) + E(196, cy - 2, 26, 6, O('#8A5634', 3));
      k += mug(166, cy - 72, 0.5, tn, { col: '#FF9EBB', handle: 'R', empty: true }) + mug(226, cy - 50, 0.5, tn, { col: '#F2C14E', handle: 'L', empty: true }) + mug(166, cy - 22, 0.5, tn, { col: '#3DA8D8', handle: 'R', empty: true });
    }
    // window: frame, cherry valance, sill with a herb pot
    {
      let w = P(`M${W.x0 - 22} ${W.y0 - 22} H${W.x1 + 22} V${W.y1 + 6} H${W.x0 - 22} Z M${W.x0} ${W.y0} V${W.y1} H${W.x1} V${W.y0} Z`, { fill: C('#FFFFFF'), 'fill-rule': 'evenodd', stroke: tn.line, 'stroke-width': 6 });
      const wc = (W.x0 + W.x1) / 2;
      w += R(wc - 6, W.y0, 12, W.y1 - W.y0, 3, O('#FFFFFF', 3.5)) + P(`M${W.x0 + 20} ${W.y0 + 110} L${W.x0 + 70} ${W.y0 + 10} L${W.x0 + 90} ${W.y0 + 10} L${W.x0 + 40} ${W.y0 + 110} Z`, { fill: '#FFFFFF', opacity: 0.24 });
      let val = `M${W.x0 - 34} ${W.y0 - 30} H${W.x1 + 34} V${W.y0 + 16}`;
      for (let x = W.x1 + 34; x > W.x0 - 34; x -= 44) val += ` Q${x - 22} ${W.y0 + 46} ${x - 44} ${W.y0 + 16}`;
      w += P(val + ' Z', O('#FFF4E2', 5)) + P(val + ' Z', { fill: 'url(#shCherry)' }) + R(W.x0 - 42, W.y0 - 40, W.x1 - W.x0 + 84, 14, 7, O('#E2434B', 4));
      w += R(W.x0 - 30, W.y1 + 2, W.x1 - W.x0 + 60, 18, 5, O('#FFFFFF', 4.5)) + plant(W.x1 - 30, W.y1 + 4, 0.42, tn, 'round', '#E2434B') + plant(W.x0 + 30, W.y1 + 4, 0.38, tn, 'snake', '#F2C14E');
      m += k + w;
    }
    // sink + faucet (+ dishes in the evening)
    {
      const sx = (W.x0 + W.x1) / 2;
      let s = R(sx - 130, CT.top - 2, 260, 12, 4, O('#C9CED8', 3.5)) + P(`M${sx} ${CT.top - 2} V${CT.top - 70} Q${sx} ${CT.top - 96} ${sx + 30} ${CT.top - 96} Q${sx + 56} ${CT.top - 96} ${sx + 56} ${CT.top - 74}`, LN(12)) + P(`M${sx} ${CT.top - 2} V${CT.top - 70} Q${sx} ${CT.top - 96} ${sx + 30} ${CT.top - 96} Q${sx + 56} ${CT.top - 96} ${sx + 56} ${CT.top - 74}`, LN(6, '#D8DDE4')) + R(sx - 40, CT.top - 22, 22, 20, 4, O('#D8DDE4', 3));
      if (dishes) {
        let sd = dC(sx - 90, CT.top - 6, 26) + dC(sx - 50, CT.top - 16, 30) + dC(sx - 6, CT.top - 8, 26) + dC(sx + 40, CT.top - 14, 28) + dC(sx + 86, CT.top - 6, 24);
        s += blob(sd, C('#FFFFFF'), 3, tn.line) + P(dC(sx - 60, CT.top - 50, 8) + dC(sx + 20, CT.top - 56, 6) + dC(sx + 60, CT.top - 44, 7) + dC(sx - 20, CT.top - 70 - md(t * 20, 30), 5), O('#DDF4FF', 2.5));
        s += G(R(-14, -60, 28, 60, 6, O('#F2C14E', 3)) + R(-10, -70, 20, 12, 4, O('#E2434B', 2.5)) + TF('SOAP', 0, -26, 9, C('#7A4A22')), `translate(${sx - 150} ${CT.top})`);
        // the wobbly tower of dirty plates to the right of the sink + a pot
        let pl = '';
        for (let i = 0; i < 9; i++) pl += G(E(0, 0, 58, 10, O(i % 3 === 1 ? '#BFE4F4' : '#FFFFFF', 3)) + E(0, -2, 36, 5, FL(i % 2 ? '#F2C46A' : '#E8D8B8')), `translate(${f(sx + 200 + Math.sin(i * 1.7) * 6 + i * i * 0.4)} ${CT.top - 10 - i * 14}) rotate(${f(Math.sin(i * 2.3) * 4 + i * 0.6)})`);
        s += pl + G(P('M-46 0 L-42 -46 L42 -46 L46 0 Z', O('#9AA4B4', 4)) + P('M42 -36 L74 -40', LN(10)) + P('M42 -36 L74 -40', LN(5, '#3A3F52')), `translate(${sx - 230} ${CT.top})`);
        s += G(P('M-40 0 L-40 -50 M-20 0 L-20 -60 M0 0 L0 -60 M20 0 L20 -60 M40 0 L40 -50 M-48 0 H48', LN(5, '#9AA4B4')) + E(-30, -40, 6, 30, O('#FFFFFF', 3)) + E(-10, -44, 6, 34, O('#BFE4F4', 3)), `translate(${CT.x1 - 60} ${CT.top})`);
        s += G(P('M-12 0 L-14 -40 L14 -40 L12 0 Z', O('#FFE14D', 3)) + P('M-14 -40 L-10 -60 M14 -40 L10 -58', LN(4, '#FFE14D')), `translate(${sx + 120} ${CT.top - 2}) rotate(10)`);
      }
      m += s;
    }
    // the toaster (SPOT) — unless dishes cover the right counter
    const tk = b01(o.toast);
    if (!dishes) m += toaster(640, CT.top, 0.88, tn, { toast: tk, burnt: o.burnt, smoke: (o.smoke === undefined ? tk > 0.2 && (o.burnt === undefined || o.burnt > 0.5) : o.smoke) ? t : false, glow: tk > 0 && tk < 0.05 });
    // SC11 pancake making mess on the counter
    if (pc) {
      m += G(P('M-56 -50 Q-56 0 0 0 Q56 0 56 -50 Z', O('#FFFFFF', 4)) + E(0, -50, 56, 11, O('#F2E2B8', 3.5)) + P('M10 -56 L50 -120', LN(8)) + P('M10 -56 L50 -120', LN(4, '#C9CED8')) + P('M42 -108 q8 -30 22 -24 q-2 20 -14 34', LN(3, '#9AA4B4')), `translate(${KT.stove.x1 + 110} ${CT.top})`);
      m += P(dE(KT.stove.x1 + 40, CT.top - 2, 30, 6) + dE(KT.stove.x1 + 190, CT.top - 1, 22, 5) + dE(-120, CT.top - 1, 26, 5), FL('#F2E2B8')) + P(dC(KT.stove.x1 + 60, CT.top + 30, 9) + dC(KT.stove.x1 + 64, CT.top + 50, 6), FL('#F2E2B8'));
      m += G(P('M-16 0 Q-22 -26 0 -28 Q12 -26 14 -14 L4 -16 L8 -6 L0 -10 Z', O('#FFF8EC', 2.5)) + P('M24 0 Q20 -18 34 -20 Q46 -18 42 0 Z', O('#FFF8EC', 2.5)), `translate(${KT.stove.x1 + 238} ${CT.top})`);
      m += P(`M${XL} ${CT.top - 1} H${CT.x1}`, LN(0.1)) + P(dE(160, 760, 60, 10) + dE(260, 790, 34, 7) + dE(-20, 772, 44, 8), { fill: C('#FFFFFF'), opacity: 0.8 });
    }
  }
  // wall clock + pendant lamp
  m += wallClock(KT.clock.x, KT.clock.y, KT.clock.r, o.clock ?? (eve ? '7:40' : '7:15'), tn, { rim: '#4C5E9E' });
  {
    const lx = KT.lamp.x, ly = KT.lamp.y;
    m += P(`M${lx} ${KT.ceil + 20} V${ly - 46}`, LN(4)) + P(`M${lx - 70} ${ly} Q${lx - 64} ${ly - 54} ${lx} ${ly - 56} Q${lx + 64} ${ly - 54} ${lx + 70} ${ly} Z`, O('#F2B84B', 5)) + E(lx, ly, 70, 8, O(lampK > 0.02 ? '!' + mix('#F2E6C0', '#FFF6D0', lampK) : '#F2E6C0', 3.5)) + P(`M${lx - 44} ${ly - 36} Q${lx - 22} ${ly - 48} ${lx} ${ly - 48}`, LN(4, '#FFFFFF', 0.45));
  }
  // ---- right: the cupcake-box tower + the fridge + the living-room doorway
  if (o.boxes !== false) {
    const tx = KT.tower.x;
    let bt = '';
    for (let i = 0; i < 8; i++) bt += cupcakeBox(tx + Math.sin(i * 2.1) * 6, 760 - i * 64, 0.86, tn, { col: i % 3 === 2 ? '#FFC0D2' : '#FF9EBB' });
    bt += cupcakeBox(tx - 120, 760, 0.86, tn) + cupcakeBox(tx - 116, 696, 0.86, tn, { open: true });
    m += bt;
  }
  {
    const Dr = KT.door;
    m += R(Dr.x0 - 20, Dr.top - 20, Dr.x1 - Dr.x0 + 40, KT.base - Dr.top + 20, 4, O('#FFFFFF', 5)) + R(Dr.x0, Dr.top, Dr.x1 - Dr.x0, KT.base - Dr.top, 0, FL('#A9C79B')) + R(Dr.x0, Dr.top, Dr.x1 - Dr.x0, 60, 0, { fill: '#000', opacity: 0.08 }) + R(Dr.x0 + 70, 300, 110, 90, 3, O('#8A5634', 3)) + R(Dr.x0 + 80, 310, 90, 70, 2, FL('#FFE6C4'));
  }
  {
    let fz = R(F.x0 + 8, F.top + 10, F.x1 - F.x0, KT.base + 12 - F.top, 40, { fill: '#000', opacity: 0.1 });
    fz += P(`M${F.x0} ${KT.base + 12} L${F.x0} ${F.top + 54} Q${F.x0} ${F.top} ${F.x0 + 58} ${F.top} L${F.x1 - 58} ${F.top} Q${F.x1} ${F.top} ${F.x1} ${F.top + 54} L${F.x1} ${KT.base + 12} Z`, O('#FFF1DC', 6));
    fz += P(`M${F.x1 - 26} ${F.top + 40} V${KT.base - 20}`, LN(10, '#E8D2B4', 0.8)) + P(`M${F.x0 + 22} ${F.top + 30} Q${F.x0 + 22} ${F.top + 16} ${F.x0 + 40} ${F.top + 14}`, LN(8, '#FFFFFF', 0.9));
    fz += P(`M${F.x0} 300 H${F.x1}`, LN(5)) + R(F.x0 + 16, 196, 16, 80, 8, O('#D8DDE4', 3.5)) + R(F.x0 + 16, 326, 16, 150, 8, O('#D8DDE4', 3.5)) + R(F.x0 + 20, KT.base - 22, F.x1 - F.x0 - 40, 18, 6, O('#E8D2B4', 3));
    const pg = (x, y, w, h, r, inner, mag) => G(R(-w / 2, -h / 2, w, h, 2, O('#FFFFFF', 3)) + inner + CI(0, -h / 2 + 2, 7, O(mag, 2.5)), tr(x, y, 1, r));
    // Max's T-rex (RAWR!), YOUR knight vs dragon, Max's dino family, the bakery ORDERS note, the calendar
    fz += pg(F.x0 + 70, 380, 104, 92, -5, P('M-34 26 L-30 -2 Q-26 -26 0 -24 Q20 -24 22 -8 L36 -8 L34 4 L20 4 L18 26 M-30 26 L-26 10 M8 26 L10 12 M-30 -2 Q-44 -6 -46 10', { fill: 'none', stroke: C('#3E9C4A'), 'stroke-width': 4, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }) + CI(8, -14, 2.5, FL(LINE)) + TF('RAWR!', 6, 42, 13, C('#E2434B')) + TF('MAX', 32, -30, 9, C('#3DA8D8')), '#E2434B');
    fz += pg(F.x0 + 176, 418, 100, 96, 4, P('M-34 30 V2 M-40 6 h12 M-34 -6 l6 -14 M-26 -6 l-6 -10', LN(3, '#8A93A8')) + P(dC(-34, -6, 7), { fill: 'none', stroke: C('#E8743A'), 'stroke-width': 3 }) + P('M4 10 Q16 -20 36 -12 Q26 -2 40 6 Q24 8 26 22 Q10 12 4 10 Z', { fill: C('#E2434B'), stroke: C('#B8303A'), 'stroke-width': 2 }) + P('M-24 -2 L2 6', LN(2.5, '#F2B84B')) + TF('LV 90', 22, 40, 10, C('#8A5CFF')), '#5DB55A');
    fz += pg(F.x0 + 88, 520, 116, 84, 3, P('M-44 20 Q-40 -10 -20 -10 Q-8 -10 -6 2 L-6 20 M-4 20 Q0 0 14 0 Q24 0 24 10 L24 20 M28 20 Q30 8 40 8 Q46 8 46 14 L46 20', { fill: 'none', stroke: C('#5DB55A'), 'stroke-width': 3.5 }) + P('M-46 22 H48', LN(2.5, '#8A5634')) + TF('MY FAMLY', 0, -22, 11, C('#E8764A')), '#F2C14E');
    fz += pg(F.x0 + 180, 540, 84, 104, -3, R(-36, -40, 72, 16, 3, FL('#FF9EBB')) + TF('ORDERS', 0, -28, 11, C('#FFFFFF')) + TF('300', 0, -2, 22, C('#E2434B')) + TF('CUPCAKES', 0, 14, 10, C('#7A4A22')) + P('M-26 26 l8 8 l16 -16', LN(4, '#3DA84A')), '#3DA8D8');
    // calendar on the freezer door
    {
      let cl = R(-56, -66, 112, 132, 3, O('#FFFFFF', 3.5)) + R(-56, -66, 112, 30, 3, O('#E8764A', 3.5)) + TF('THIS WEEK', 0, -46, 11, C('#FFFFFF'));
      const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
      for (let i = 0; i < 7; i++) cl += TF(days[i], -46 + i * 15.3, -24, 9, C(i === 5 ? '#E2434B' : '#5A6070'));
      let gd = '';
      for (let i = 0; i < 6; i++) gd += `M${f(-46 + i * 15.3)} -14 l8 6 M${f(-46 + i * 15.3 + 8)} -14 l-8 6 `;
      cl += P(gd, LN(2, '#9AA4B4')) + TF('WORK', -10, 2, 9, C('#9AA4B4')) + P(dC(30.5, -12, 9), { fill: 'none', stroke: C('#E2434B'), 'stroke-width': 3 });
      cl += TF('SAT: FAIR', 0, 30, 13, C('#E2434B')) + TF('DAY OFF ♥', 0, 50, 13, C('#E2434B'));
      fz += G(cl, `translate(${F.x0 + 150} 210) rotate(2)`) + CI(F.x0 + 150, 146, 7, O('#5DB55A', 2.5));
    }
    // more bakery boxes on top of the fridge
    if (o.boxes !== false) fz += cupcakeBox(F.x0 + 80, F.top, 0.8, tn) + cupcakeBox(F.x0 + 186, F.top, 0.8, tn, { col: '#FFC0D2' }) + cupcakeBox(F.x0 + 130, F.top - 60, 0.8, tn);
    m += fz;
  }
  // floor: terracotta + cream hexes, skirting
  m += R(XL, KT.base, XR - XL, YB - KT.base, 0, FL('#F7E2C6')) + R(XL, KT.base, XR - XL, YB - KT.base, 0, { fill: 'url(#shHex)' });
  m += band(KT.base + 12, KT.base + 24, { fill: '#000', opacity: 0.07 });
  m += R(CT.x1 + 14, KT.base - 14, XR - CT.x1 - 14, 16, 0, O('#FFFFFF', 3.5));
  // chairs behind the table: Mom's at the left end (side), Max's orange booster, YOURS, Grandpa's
  if (o.chairs !== false) {
    let c = '';
    const back = (x, col) => P(`M${x - 76} ${TB.back + 12} L${x - 72} 586 Q${x - 70} 546 ${x} 544 Q${x + 70} 546 ${x + 72} 586 L${x + 76} ${TB.back + 12} Z`, O(col, 5)) + P(`M${x - 48} ${TB.back + 10} V592 M${x - 16} ${TB.back + 10} V580 M${x + 16} ${TB.back + 10} V580 M${x + 48} ${TB.back + 10} V592`, LN(5, mix(col, '#000000', 0.25)));
    c += back(KSEAT.you.x, '#8FD1B8') + back(KSEAT.grandpa.x, '#8FD1B8') + back(KSEAT.max.x, '#8FD1B8');
    c += R(KSEAT.max.x - 66, KSEAT.max.hip + 2, 132, TB.back - KSEAT.max.hip + 20, 12, O('#F2963A', 4)) + TF('RAWR', KSEAT.max.x, KSEAT.max.hip + 30, 15, C('#FFFFFF'));
    c += G(P('M-22 0 L-20 -166 Q-20 -186 0 -186 Q20 -186 20 -166 L22 0 Z', O('#8FD1B8', 5)) + R(-12, -150, 24, 110, 6, FL('#B8E6D2')), `translate(${KSEAT.mom.x - 66} ${TB.back + 70}) rotate(-4)`);
    m += c;
  }
  // mess: milk splats + cereal O's on the wall / window / fridge / floor
  if (mess > 0.01) {
    const src = [KSEAT.max.x, 600];
    let sp = '', ce = '', dr = '';
    for (let i = 0; i < 22; i++) {
      const th = hash(i * 3.7 + 1) > 1 - mess * 1.05 ? 1 : 0;
      if (!th) continue;
      const a = -Math.PI * (0.05 + 0.9 * hash(i * 1.9)), d = 140 + 760 * hash(i * 4.3);
      const x = src[0] + Math.cos(a) * d * 1.35, y = clamp(src[1] + Math.sin(a) * d * 0.62, 70, 690);
      const r = 12 + 22 * hash(i * 6.1), a0 = hash(i * 8.3) * 6.28;
      sp += dC(x, y, r * 0.7);
      for (let j = 0; j < 6; j++) { const aj = a0 + j * 1.047 + (hash(i + j * 1.3) - 0.5) * 0.6, dj = r * (0.62 + 0.25 * hash(i * 2 + j)); sp += dC(x + Math.cos(aj) * dj, y + Math.sin(aj) * dj, r * (0.26 + 0.14 * hash(i + j))); }
      for (let j = 0; j < 4; j++) { const aj = a0 + j * 1.57 + 0.5, dj = r * (1.35 + 0.4 * hash(i * 3 + j)); ce += dC(x + Math.cos(aj) * dj, y + Math.sin(aj) * dj * 0.9, r * 0.12 + 2); }
      if (hash(i * 5.5) > 0.4) dr += dRR(x - r * 0.12, y, r * 0.24, r * (1 + hash(i) * 1.4), r * 0.12);
    }
    m += P(ce, O('#FFFBF2', 2));
    ce = '';
    for (let i = 0; i < 22; i++) if (hash(i * 3.7 + 1) > 1 - mess * 1.05) { const a = -Math.PI * (0.05 + 0.9 * hash(i * 1.9)), d = 140 + 760 * hash(i * 4.3); ce += dC(src[0] + Math.cos(a) * d * 1.35 + 30 * (hash(i) - 0.5), clamp(src[1] + Math.sin(a) * d * 0.62, 70, 690) + 34, 6); }
    for (let i = 0; i < Math.round(26 * mess); i++) ce += dC(lerp(300, 1900, hash(i * 9.3)), 760 + 280 * hash(i * 2.9), 7);
    m += P(sp + dr, { fill: C('#FFFBF2'), stroke: tn.line, 'stroke-width': 3, 'stroke-linejoin': 'round' }) + P(sp + dr, { fill: C('#FFFBF2') });
    m += P(ce, O('#F2B84B', 2.5));
  }
  // ---------------- front: the table, the cherry cloth, breakfast
  let fr = '';
  {
    fr += E((TB.x0 + TB.x1) / 2, TB.feet + 4, (TB.x1 - TB.x0) / 2 + 40, 16, { fill: '#000', opacity: 0.12 });
    fr += R(TB.x0 + 30, TB.hem - 20, 28, TB.feet - TB.hem + 20, 5, O('#B9763E', 4)) + R(TB.x1 - 58, TB.hem - 20, 28, TB.feet - TB.hem + 20, 5, O('#B9763E', 4));
    fr += P(`M${TB.x0 - 4} ${TB.back} H${TB.x1 + 4} L${TB.x1 + 14} ${TB.top} H${TB.x0 - 14} Z`, O('#FFF4E2', 5)) + P(`M${TB.x0 - 4} ${TB.back} H${TB.x1 + 4} L${TB.x1 + 14} ${TB.top} H${TB.x0 - 14} Z`, { fill: 'url(#shCherry)', opacity: 0.6 });
    const cl = `M${TB.x0 - 14} ${TB.top} H${TB.x1 + 14} L${TB.x1 + 22} ${TB.hem} H${TB.x0 - 22} Z`;
    fr += P(cl, O('#FFF4E2', 5)) + P(cl, { fill: 'url(#shCherry)' });
    fr += P(`M${TB.x0 - 22} ${TB.hem - 26} H${TB.x1 + 22} V${TB.hem} H${TB.x0 - 22} Z`, O('#E2434B', 4)) + P(`M${TB.x0 - 20} ${TB.hem - 13} H${TB.x1 + 20}`, { fill: 'none', stroke: C('#FFFFFF'), 'stroke-width': 4, 'stroke-dasharray': '4 10', 'stroke-linecap': 'round' });
    let folds = '';
    for (let x = TB.x0 + 100; x < TB.x1 - 40; x += 160) folds += `M${x} ${TB.top + 30} Q${x - 8} ${(TB.top + TB.hem) / 2} ${x + 4} ${TB.hem - 30} `;
    fr += P(folds, LN(3.5, '#E8CBA8', 0.8)) + R(TB.x0 - 14, TB.top - 6, TB.x1 - TB.x0 + 28, 12, 6, O('#FFF4E2', 4));
    const ty = TB.top - 4;
    if (o.bowls !== false) {
      fr += bowl(KSEAT.max.x + 4, ty, 0.95, tn, { col: '#5DB55A', fill: mess > 0.5 ? 'milk' : 'cereal' }) + G(P('M-14 -30 l6 -10 l6 8 l6 -10 l6 8', O('#3E8A4A', 2.5)), `translate(${KSEAT.max.x + 4} ${ty})`);
      fr += bowl(KSEAT.you.x - 10, ty - 4, 0.92, tn, { col: '#3DA8D8', spoon: true }) + bowl(KSEAT.grandpa.x - 16, ty - 4, 0.92, tn, { col: '#C98A52' });
    }
    // cereal box DINO-O's + milk carton (between Max and YOU)
    fr += G(R(-40, -112, 80, 112, 5, O('#F2C14E', 4)) + R(-34, -104, 68, 30, 4, O('#E2434B', 3)) + TF('DINO-O', 0, -84, 15, C('#FFFFFF')) + P('M-22 -20 L-20 -50 Q-18 -66 0 -64 Q12 -62 14 -50 L26 -50 L24 -40 L14 -40 L12 -20 Z', O('#5DB55A', 3)) + CI(2, -54, 2.5, FL(LINE)) + P(dC(-24, -34, 6) + dC(28, -24, 6), O('#F2B84B', 2)), `translate(1076 ${ty - 4}) rotate(-3)`);
    fr += G(R(-20, -66, 40, 66, 4, O('#FFFFFF', 3.5)) + P('M-20 -66 L0 -84 L20 -66 Z', O('#3DA8D8', 3.5)) + TF('MILK', 0, -30, 11, C('#3DA8D8')), `translate(1134 ${ty - 6})`);
    // the cupcake stand with a glass dome (centre, between YOU and Grandpa)
    fr += G(E(0, 0, 54, 8, O('#FFFFFF', 3.5)) + R(-6, -30, 12, 30, 3, O('#FFFFFF', 3)) + E(0, -32, 70, 9, O('#FFFFFF', 3.5)) + cupcake(-36, -38, 0.62, tn) + cupcake(0, -38, 0.62, tn, { frost: '#FFF4E0', cherry: true }) + cupcake(36, -38, 0.62, tn, { frost: '#B98A5A' }) + P('M-64 -36 Q-70 -120 0 -126 Q70 -120 64 -36', { fill: C('#DDF4FF'), opacity: 0.28 }) + P('M-64 -36 Q-70 -120 0 -126 Q70 -120 64 -36', LN(3.5)) + CI(0, -130, 8, O('#DDF4FF', 3)) + P('M-44 -60 Q-44 -100 -16 -108', LN(5, '#FFFFFF', 0.8)), `translate(1334 ${ty - 4})`);
    // Grandpa's #79 mug + toast plate + OJ
    fr += mug(KSEAT.grandpa.x + 78, ty + 2, 0.72, tn, { col: '#3A4A82', label: '#79', labelCol: '#F2C14E', handle: 'R', steam: o.steam === false ? false : t + 0.3 });
    fr += G(E(0, -4, 44, 8, O('#FFFFFF', 3)) + toast(-14, -6, 0.5, -6, tn, { burnt: 0 }) + toast(14, -6, 0.5, 8, tn, { burnt: 0.2 }), `translate(${KSEAT.grandpa.x + 150} ${ty})`);
    fr += G(P('M-16 0 L-18 -52 Q-18 -60 -8 -62 L8 -62 Q18 -60 18 -52 L16 0 Z', O('#FFFFFF', 3.5)) + P('M-17 -38 L17 -38 L16 -4 L-16 -4 Z', FL('#FFB13B')) + P('M18 -50 Q30 -46 28 -30', LN(5)), `translate(${TB.x1 - 40} ${ty - 4})`);
    // Mom's mugs (o.cups) at her end
    const cups = Math.round(clamp(o.cups || 0, 0, 4));
    for (let i = 0; i < cups; i++) fr += mug(TB.x0 + 96 + i * 30, ty + 2 - (i % 2) * 6, 0.56, tn, { col: ['#FF9EBB', '#F2C14E', '#3DA8D8', '#FFFFFF'][i], empty: true, handle: 'R', label: i === 3 ? '#1' : undefined });
    // SC11: YOUR pancakes for Mom
    if (pc) {
      const px = TB.x0 + 190;
      let pk = E(0, -4, 64, 11, O('#FFFFFF', 3.5));
      for (let i = 0; i < 5; i++) pk += E(Math.sin(i * 2.4) * 8, -14 - i * 12, 44 - i * 2 + Math.sin(i * 1.3) * 5, 9, O(i === 2 ? '#C98A3A' : '#F2C46A', 3));
      pk += P('M-26 -66 Q-30 -76 -18 -78 Q-10 -78 -10 -70 Q-10 -78 -2 -78 Q10 -76 6 -66 Q-2 -56 -10 -50 Q-20 -58 -26 -66 Z', { fill: C('#B8642A'), stroke: C('#8A4A1A'), 'stroke-width': 2 }) + P('M30 -62 Q36 -40 30 -20', LN(5, '#C98A3A', 0.8)) + R(-6, -82, 22, 10, 3, O('#FFF6A8', 2.5));
      fr += G(pk, `translate(${px} ${ty})`);
      fr += G(P('M-34 0 L-30 -40 L30 -40 L34 0 Z', O('#FFFFFF', 3.5)) + TF('FOR', 0, -24, 11, C('#E2434B')) + TF('MOM ♥', 0, -8, 11, C('#E2434B')), `translate(${px + 120} ${ty}) rotate(4)`);
      fr += G(R(-12, -46, 24, 46, 5, O('#DDF4FF', 3)) + P('M0 -40 Q2 -74 -4 -96', LN(3.5, '#3E8A4A')) + CI(-4, -100, 12, O('#FFE14D', 3)) + CI(-4, -100, 4, FL('#F2A33A')), `translate(${px + 196} ${ty})`);
      fr += G(P('M-12 0 L-14 -60 Q-14 -72 0 -76 Q14 -72 14 -60 L12 0 Z', O('#C98A3A', 3.5)) + R(-12, -42, 24, 22, 3, O('#FFF4E2', 2.5)) + TF('SYRUP', 0, -27, 7, C('#8A4A1A')), `translate(${px - 96} ${ty})`);
    }
    // mess on the table: puddles + cereal
    if (mess > 0.01) {
      fr += P(dE(KSEAT.max.x - 60, ty + 4, 50 * mess, 8 * mess) + dE(KSEAT.max.x + 120, ty + 2, 40 * mess, 7 * mess) + dE(KSEAT.you.x + 60, ty + 4, 36 * mess, 6 * mess), { fill: C('#FFFBF2'), stroke: tn.line, 'stroke-width': 3 });
      let ce = '';
      for (let i = 0; i < Math.round(14 * mess); i++) ce += dC(lerp(TB.x0 + 40, TB.x1 - 40, hash(i * 5.7)), ty + 6 + 14 * hash(i * 3.1), 6);
      fr += P(ce, O('#F2B84B', 2.5));
      let dd = '';
      for (const dx of [TB.x0 + 180, TB.x0 + 420, TB.x1 - 300]) dd += dRR(dx, TB.top + 4, 12, 30 + 40 * mess, 6);
      fr += P(dd, { fill: C('#FFFBF2'), stroke: tn.line, 'stroke-width': 3 });
    }
  }
  // ---------------- light
  let light = '';
  if (morn) {
    light += P(dP([[W.x0 + 10, W.y0 + 10], [W.x1 - 10, W.y0 + 10], [W.x1 + 640, 1000], [W.x0 + 260, 1000]]), { fill: 'url(#shBeam)', opacity: 0.34 });
    let dm = '';
    for (let i = 0; i < 9; i++) { const u = md(t * 0.03 + hash(i * 3.3), 1), x = lerp(W.x0 + 80, W.x1 + 400, hash(i * 7.1)) + Math.sin(t * 0.7 + i) * 18 + u * 160, y = lerp(W.y0 + 60, 860, u); dm += dC(x, y, 2.6 + hash(i) * 1.8); }
    light += P(dm, { fill: '#FFF6D8', opacity: 0.7 }) + cover({ fill: '#FFB060', opacity: 0.05 });
  } else if (eve) {
    light += cover({ fill: '#3A2A6A', opacity: 0.12 }) + band(CT.top - 260, CT.top + 2, { fill: 'none' });
    light += pool(-100, CT.top - 10, 820, 50, '#FFE2A0', 0.3, 3);
  } else light += P(dP([[W.x0 + 10, W.y0 + 10], [W.x1 - 10, W.y0 + 10], [W.x1 + 300, 1000], [W.x0 + 60, 1000]]), { fill: 'url(#shBeam)', opacity: 0.18 });
  if (lampK > 0.02) light += glow(KT.lamp.x, KT.lamp.y + 10, 260, 'shGlowWarm', 0.85 * lampK) + pool(KT.lamp.x, TB.top - 10, 520, 90, '#FFD58A', 0.2 * lampK, 4) + P(dP([[KT.lamp.x - 60, KT.lamp.y + 6], [KT.lamp.x + 60, KT.lamp.y + 6], [KT.lamp.x + 420, TB.top], [KT.lamp.x - 420, TB.top]]), { fill: 'url(#shBeam)', opacity: f(0.22 * lampK) });
  return { bg, mid: m, front: fr, fg: '', light };
}
const kitchen = makeSet(kitchenLayers);

// ================================================================= 3. LIVING ROOM — the couch, Grandpa's recliner, the pillow-fort floor (SC06, SC07, SC12)
// Sage leaf wallpaper over a cream panelled wainscot, walnut plank floor. LEFT: the TV on a low walnut console (Max's toy
// dinos + a game console), the family photo wall above it (family, baby YOU, Max as a dino, Biscuit as a pup, Mom's
// bakery opening, Grandma + Grandpa's wedding); the big monstera. CENTRE: the denim-blue corduroy COUCH under the wide
// window (curtains; the street outside), mustard / coral / dino-print cushions and an orange knitted throw; the big round
// BRAIDED RUG in front = the PILLOW FORT floor. RIGHT: the side table (lamp, Grandpa's newspaper + glasses case), Biscuit's
// plaid DOG BED in front of it, Grandpa Lou's cognac leather RECLINER (doily, a patch, his slippers) turned toward the room,
// THE 1979 ARM-WRESTLING PHOTO above it, the trophy shelf with the "79" trophy + a medal + the newspaper clipping; the doorway
// to the kitchen (x 1990+).
// Layer order:  bg (window view) · mid (room, couch back + cushions, recliner back, TV, rug) · [seated: couch / recliner via
//   H.seatPose; Max on the rug] · front (couch front + arms, recliner arms + footrest, the dog bed) · [the pillow fort
//   X.pillowFort({...SPOTS.livingRoom.fort, k}), Biscuit on the bed, people on FLOOR 1000] · fg ('') · light
// opts: { time 'day'|'evening'|'night' (default day; evening: dusk window + both lamps on; night: dark blue + lamps),
//   fort 0..1 (the couch gives its cushions to the fort: the throw goes first, then the back cushions, the pillows, the seat
//   cushions; at 1 the couch is a bare frame), tvScreen svg|fn(w, h) (330 x 190; default off), tv (default true), tvGlow
//   0..1, lamp 0..1 (default 1 evening / night), clock 'H:MM', toys (default true: Max's blocks + a toy T-rex), dogBed (default
//   true), birds (default true by day), recline 0..1 (the recliner's footrest up) }
const LR = {
  ceil: 40, base: 700, rail: 520,
  win: { x0: 590, y0: 96, x1: 1150, y1: 350 },
  tv: { cx: 232, cy: 440, w: 330, h: 190 },
  console: { x0: 20, x1: 444, top: 604 },
  couch: { x0: 478, x1: 1262, seat: 740, front: 792, back: 520, arm: 632, floor: 918 },
  side: { x: 1338, top: 640 },
  arm: { x0: 1418, x1: 1726, seat: 776, back: 470, x: 1568 },
  photo: { x: 1572, y: 196, w: 232, h: 172 },
  shelf: { x0: 1744, x1: 1960, y: 386 },
  door: { x0: 1996, x1: 2240, top: 150 },
  rug: { x: 860, y: 912, rx: 560, ry: 112 },
  bed: { x: 1300, y: 958, s: 0.5 },
  lamp: { x: 1338, y: 430 },
};
const LSEAT = {
  couchL: { x: 640, hip: 750, s: 0.5 },
  couchM: { x: 870, hip: 750, s: 0.5 },
  couchR: { x: 1100, hip: 750, s: 0.5 },
  armchair: { x: 1566, hip: 780, s: 0.5, turn: -0.3 },
};
def(`<clipPath id="shClipLRTV"><rect x="${LR.tv.cx - LR.tv.w / 2}" y="${LR.tv.cy - LR.tv.h / 2}" width="${LR.tv.w}" height="${LR.tv.h}" rx="4"/></clipPath>`);
function livingRoomLayers(t, o = {}) {
  const time = o.time || 'day', eve = time === 'evening', nite = time === 'night', day = !eve && !nite;
  const tn = tone(nite ? { night: 0.72 } : eve ? { eve: 0.55 } : {});
  const C = tn.c, O = tn.ol, LN = tn.ln, FL = tn.fl;
  const W = LR.win, CO = LR.couch, AR = LR.arm;
  const fort = b01(o.fort);
  const lampK = b01(o.lamp, eve || nite ? 1 : 0);
  const tvOn = o.tv !== false && o.tvScreen !== undefined && o.tvScreen !== null && o.tvScreen !== false;
  // ---------------- bg: the street through the window
  let bg = R(W.x0 - 40, W.y0 - 40, W.x1 - W.x0 + 80, W.y1 - W.y0 + 80, 0, { fill: `url(#${nite ? 'shSkyNight' : eve ? 'shSkyEvening' : 'shSkyDay'})` });
  if (nite) bg += R(W.x0 - 40, W.y0 - 40, W.x1 - W.x0 + 80, 170, 0, { fill: 'url(#shStars)' }) + CI(1060, 150, 22, { fill: '#FFF4C8', stroke: '#E8D490', 'stroke-width': 4 });
  else if (day) bg += shCloud(760, 170, 0.5, tn) + shCloud(1060, 140, 0.36, tn);
  else bg += shCloud(800, 180, 0.46, tn, '#F8C8D8', '#D890B8');
  bg += P('M640 330 L640 236 L740 190 L840 236 L840 330 Z', O('#B9D8F2', 4)) + P('M626 242 L740 182 L854 242', LN(13, '#4A63A8')) + R(668, 254, 44, 40, 3, O(day ? '#FFFFFF' : '!#FFD27A', 3)) + R(770, 254, 44, 40, 3, O(day ? '#FFFFFF' : '!#FFD27A', 3));
  bg += P('M900 330 L900 246 L1000 210 L1100 246 L1100 330 Z', O('#FFE0B8', 4)) + P('M888 252 L1000 202 L1112 252', LN(13, '#C8553D')) + R(980, 270, 40, 60, 4, O('#5DB55A', 3));
  bg += leafTree(870, 380, 0.42, tn, { sway: Math.sin(t * 0.8) * 1.2 }) + R(W.x0 - 40, 318, W.x1 - W.x0 + 80, 80, 0, FL('#7CC864')) + R(W.x0 - 40, 336, W.x1 - W.x0 + 80, 60, 0, FL('#C9C3B8'));
  if (o.birds === undefined ? day : o.birds) { const u = md(t * 0.06, 1); bg += shBird(lerp(W.x0 - 40, W.x1 + 40, u), 150 + Math.sin(u * 10) * 16, 0.5, tn, { flap: md(t * 4.2, 1) }); }
  // ---------------- mid
  let m = '';
  const wallD = `M${XL} ${YT} H${XR} V${LR.base} H${XL} Z M${W.x0} ${W.y0} V${W.y1} H${W.x1} V${W.y0} Z`;
  m += P(wallD, { fill: C('#A7C49A'), 'fill-rule': 'evenodd' }) + P(wallD, { fill: 'url(#shLeafPaper)', 'fill-rule': 'evenodd' });
  m += R(XL, YT, XR - XL, LR.ceil - YT, 0, FL('#F6F1E4')) + band(LR.ceil - 4, LR.ceil + 16, O('#FFFFFF', 4)) + band(LR.ceil + 16, LR.ceil + 22, FL('#8AAA7E'));
  // cream panelled wainscot
  m += band(LR.rail, LR.base, FL('#F4E8D2'));
  let pn = '';
  for (let x = XL + 30; x < XR; x += 170) pn += dRR(x, LR.rail + 26, 140, LR.base - LR.rail - 50, 6);
  m += P(pn, { fill: 'none', stroke: C('#DCCBAA'), 'stroke-width': 4 }) + band(LR.rail - 8, LR.rail + 10, O('#FFFFFF', 4));
  // window: white frame, mullions, sill, mustard curtains on a rod
  {
    let w = P(`M${W.x0 - 22} ${W.y0 - 22} H${W.x1 + 22} V${W.y1 + 6} H${W.x0 - 22} Z M${W.x0} ${W.y0} V${W.y1} H${W.x1} V${W.y0} Z`, { fill: C('#FFFFFF'), 'fill-rule': 'evenodd', stroke: tn.line, 'stroke-width': 6 });
    const third = (W.x1 - W.x0) / 3;
    w += R(W.x0 + third - 6, W.y0, 12, W.y1 - W.y0, 3, O('#FFFFFF', 3.5)) + R(W.x0 + 2 * third - 6, W.y0, 12, W.y1 - W.y0, 3, O('#FFFFFF', 3.5)) + R(W.x0, 176, W.x1 - W.x0, 10, 3, O('#FFFFFF', 3.5));
    w += P(`M${W.x0 + 20} ${W.y0 + 120} L${W.x0 + 80} ${W.y0 + 8} L${W.x0 + 100} ${W.y0 + 8} L${W.x0 + 40} ${W.y0 + 120} Z`, { fill: '#FFFFFF', opacity: day ? 0.24 : 0.08 });
    w += R(W.x0 - 34, W.y1 + 2, W.x1 - W.x0 + 68, 18, 5, O('#FFFFFF', 4.5));
    const cs = Math.sin(t * 1.1) * 3;
    for (const [cx, d] of [[W.x0 - 26, 1], [W.x1 + 26, -1]]) {
      const cp = `M${cx - 40 * d} ${W.y0 - 44} L${cx + 52 * d} ${W.y0 - 44} Q${f(cx + 40 * d + cs)} 250 ${f(cx + 34 * d + cs)} ${W.y1 + 80} Q${cx} ${W.y1 + 92} ${f(cx - 40 * d + cs)} ${W.y1 + 84} Z`;
      w += P(cp, O('#E8A23A', 5)) + P(`M${cx + 6 * d} ${W.y0 - 32} Q${f(cx + 10 * d + cs)} 250 ${f(cx + 4 * d + cs)} ${W.y1 + 74}`, LN(4, '#B97A1E', 0.8)) + R(cx - 24, W.y1 - 4, 48, 14, 7, O('#F4E8D2', 3));
    }
    w += R(W.x0 - 90, W.y0 - 52, W.x1 - W.x0 + 180, 12, 6, O('#7A4A2A', 3.5)) + CI(W.x0 - 92, W.y0 - 46, 10, O('#F2C14E', 3)) + CI(W.x1 + 92, W.y0 - 46, 10, O('#F2C14E', 3));
    m += w;
  }
  // the photo wall above the TV
  {
    m += photoFrame('family', 140, 168, 168, 124, -2, tn, { col: '#7A4A2A' }) + photoFrame('babyYou', 314, 150, 104, 96, 3, tn, { col: '#F2C14E' }) + photoFrame('maxDino', 410, 252, 96, 112, -3, tn, { col: '#E2434B' });
    m += photoFrame('biscuitPup', 72, 300, 100, 86, 2, tn, { col: '#3DA8D8' }) + photoFrame('bakery', 214, 300, 128, 100, 1, tn, { col: '#FF9EBB' }) + photoFrame('wedding', 470, 130, 84, 104, 2, tn, { col: '#C9A06A' });
  }
  // TV on the walnut console + Max's toys + a game console
  {
    const T0 = LR.tv, K0 = LR.console, x0 = T0.cx - T0.w / 2, y0 = T0.cy - T0.h / 2;
    let v = R(K0.x0, K0.top, K0.x1 - K0.x0, LR.base + 40 - K0.top, 8, O('#8A5634', 5)) + R(K0.x0 + 16, K0.top + 22, (K0.x1 - K0.x0) / 2 - 24, 76, 6, O('#A0683E', 3.5)) + R((K0.x0 + K0.x1) / 2 + 8, K0.top + 22, (K0.x1 - K0.x0) / 2 - 24, 76, 6, O('#A0683E', 3.5));
    v += R(K0.x0 - 8, K0.top - 8, K0.x1 - K0.x0 + 16, 18, 6, O('#9A6038', 4)) + R(K0.x0 + 16, LR.base + 40, 14, 20, 3, O('#6A3E24', 3)) + R(K0.x1 - 30, LR.base + 40, 14, 20, 3, O('#6A3E24', 3));
    v += R(T0.cx - 50, K0.top - 30, 100, 26, 6, O('#2A2D38', 4)) + R(T0.cx - 10, y0 + T0.h + 10, 20, K0.top - 30 - y0 - T0.h - 10, 3, O('#2A2D38', 3.5));
    v += R(x0 - 14, y0 - 14, T0.w + 28, T0.h + 30, 10, O('#1C1E27', 5));
    let scr = R(x0, y0, T0.w, T0.h, 4, FL(tvOn ? '#05060A' : '#1A1E2C'));
    if (tvOn) scr += G(G(screenOf(o.tvScreen, T0.w, T0.h), tr(T0.cx, T0.cy)), null, { 'clip-path': 'url(#shClipLRTV)' });
    else scr += P(`M${x0 + 26} ${y0} L${x0 + 100} ${y0} L${x0 + 34} ${y0 + T0.h} L${x0} ${y0 + T0.h} L${x0} ${y0 + 50} Z`, { fill: '#FFFFFF', opacity: 0.07 });
    v += scr + R(x0, y0, T0.w, T0.h, 4, { fill: 'url(#shShine)', opacity: 0.35 }) + R(x0, y0, T0.w, T0.h, 4, LN(3, '#0A0B10'));
    v += G(R(-40, -16, 80, 16, 4, O('#FFFFFF', 3)) + CI(28, -8, 3, FL('!#3DA8FF')), `translate(${K0.x0 + 70} ${K0.top - 8})`);
    v += G(P('M-24 0 L-22 -30 Q-20 -46 -2 -44 Q10 -42 12 -32 L24 -32 L22 -22 L12 -22 L10 0 Z', O('#5DB55A', 3.5)) + CI(0, -36, 2.5, FL(LINE)) + P('M-20 -16 Q-34 -12 -36 0', LN(5)) + P('M-20 -16 Q-34 -12 -36 0', LN(2.5, '#5DB55A')), `translate(${K0.x1 - 60} ${K0.top - 8})`);
    m += v;
  }
  // the monstera between the console and the couch
  m += plant(462, LR.base + 30, 0.9, tn, 'monstera', '#F2C14E');
  // the couch: frame + back cushions + seat tops (fronts + arms in layers.front)
  {
    const nBack = fort < 0.3 ? 3 : fort < 0.45 ? 2 : fort < 0.55 ? 1 : 0;
    let c = R(CO.x0 + 30, CO.back - 10, CO.x1 - CO.x0 - 60, CO.seat - CO.back + 30, 26, O('#4A6CB0', 6)) + R(CO.x0 + 30, CO.back - 10, CO.x1 - CO.x0 - 60, CO.seat - CO.back + 30, 26, { fill: 'url(#shCord)' });
    const cw = (CO.x1 - CO.x0 - 120) / 3;
    for (let i = 0; i < nBack; i++) {
      const x = CO.x0 + 60 + i * cw;
      c += R(x, CO.back + 6, cw - 8, 150, 26, O('#5A7EC4', 5)) + R(x, CO.back + 6, cw - 8, 150, 26, { fill: 'url(#shCord)' }) + P(`M${x + 24} ${CO.back + 30} Q${x + cw / 2} ${CO.back + 20} ${x + cw - 32} ${CO.back + 30}`, LN(5, '#FFFFFF', 0.25));
    }
    // seat cushion tops (they go to the fort last)
    if (fort < 0.75) c += R(CO.x0 + 60, CO.seat - 30, CO.x1 - CO.x0 - 120, 46, 18, O('#5A7EC4', 5));
    else c += R(CO.x0 + 60, CO.seat - 4, CO.x1 - CO.x0 - 120, 22, 8, O('#3A5490', 4));
    // throw pillows: mustard, coral, dino print
    if (fort < 0.5) {
      c += G(R(-46, -46, 92, 92, 22, O('#F2C14E', 4.5)) + P('M-30 -30 L30 30 M30 -30 L-30 30', LN(3, '#D9A83A', 0.6)), `translate(${CO.x0 + 100} ${CO.seat - 66}) rotate(-12)`);
      c += G(R(-42, -42, 84, 84, 20, O('#F27A6A', 4.5)) + CI(0, 0, 12, O('#FFFFFF', 3)), `translate(${CO.x1 - 112} ${CO.seat - 62}) rotate(10)`);
      c += G(R(-40, -36, 80, 72, 18, O('#8FD1B8', 4)) + P('M-20 10 L-18 -8 Q-16 -18 -4 -16 Q4 -14 6 -8 L14 -8 L12 0 L6 0 L4 10 Z', O('#5DB55A', 2.5)), `translate(${(CO.x0 + CO.x1) / 2 + 40} ${CO.seat - 56}) rotate(4)`);
    }
    // the orange knitted throw over the back (goes first)
    if (fort < 0.15) c += P(`M${CO.x1 - 290} ${CO.back - 14} Q${CO.x1 - 200} ${CO.back - 30} ${CO.x1 - 120} ${CO.back - 12} L${CO.x1 - 100} ${CO.back + 120} Q${CO.x1 - 180} ${CO.back + 140} ${CO.x1 - 270} ${CO.back + 110} Z`, O('#E8743A', 5)) + P(`M${CO.x1 - 290} ${CO.back - 14} Q${CO.x1 - 200} ${CO.back - 30} ${CO.x1 - 120} ${CO.back - 12} L${CO.x1 - 100} ${CO.back + 120} Q${CO.x1 - 180} ${CO.back + 140} ${CO.x1 - 270} ${CO.back + 110} Z`, { fill: 'url(#shKnit)' });
    m += c;
  }
  // side table: lamp, newspaper, glasses case, a mug
  {
    const sx = LR.side.x, st = LR.side.top;
    let s = R(sx - 62, st, 124, LR.base + 60 - st, 6, O('#8A5634', 5)) + R(sx - 50, st + 30, 100, 60, 5, O('#A0683E', 3.5)) + CI(sx, st + 60, 6, O('#F2C14E', 2)) + R(sx - 72, st - 12, 144, 18, 6, O('#9A6038', 4));
    s += E(sx - 14, st - 12, 30, 7, O('#C9A06A', 3)) + P(`M${sx - 14} ${st - 16} V${st - 120}`, LN(8)) + P(`M${sx - 14} ${st - 16} V${st - 120}`, LN(4, '#C9A06A'));
    s += P(`M${sx - 76} ${st - 116} L${sx - 56} ${st - 200} L${sx + 28} ${st - 200} L${sx + 48} ${st - 116} Z`, O(lampK > 0.02 ? '!' + mix('#F4E2B8', '#FFF4CC', lampK) : '#F4E2B8', 4.5)) + E(sx - 14, st - 116, 62, 7, O(lampK > 0.02 ? '!#FFF6D8' : '#E8D2A0', 3));
    s += G(P('M-30 0 L30 0 L34 -10 L-26 -10 Z', O('#F2EEE4', 3)) + P('M-22 -5 H20', LN(2, '#9AA4B4')), `translate(${sx + 34} ${st - 4}) rotate(-6)`) + G(R(-18, -10, 36, 10, 5, O('#3A4A82', 2.5)), `translate(${sx + 40} ${st - 14}) rotate(4)`);
    m += s;
  }
  // the 1979 photo above the recliner + the trophy shelf
  {
    const ph = LR.photo;
    m += photoFrame('wrestle79', ph.x, ph.y, ph.w, ph.h, -1.5, tn, { col: '#C9A06A', mat: '#FFF4D8' }) + G(R(-46, -14, 92, 28, 6, O('#F2C14E', 3)) + TF('1979', 0, 8, 20, C('#5A3A1A')), `translate(${ph.x} ${ph.y + ph.h / 2 + 4})`);
    const S0 = LR.shelf;
    let sh = R(S0.x0, S0.y, S0.x1 - S0.x0, 16, 4, O('#8A5634', 4)) + P(`M${S0.x0 + 24} ${S0.y + 16} l0 18 l16 -18 M${S0.x1 - 24} ${S0.y + 16} l0 18 l-16 -18`, LN(4, '#6A3E24'));
    sh += trophy79(S0.x0 + 70, S0.y, 0.8, tn);
    sh += G(R(-36, -96, 72, 96, 3, O('#F2EEE4', 3)) + TF('THE ARM', 0, -76, 12, C('#3A3F52')) + R(-26, -66, 52, 34, 2, FL('#C9C2B2')) + P('M-26 -24 H26 M-26 -16 H26 M-26 -8 H18', LN(2, '#9AA4B4')), `translate(${S0.x0 + 160} ${S0.y}) rotate(3)`);
    sh += P(`M${S0.x1 - 40} ${S0.y + 16} L${S0.x1 - 50} ${S0.y + 70} M${S0.x1 - 40} ${S0.y + 16} L${S0.x1 - 30} ${S0.y + 70}`, LN(5, '#3DA8D8')) + CI(S0.x1 - 40, S0.y + 84, 16, O('#F2C14E', 3.5)) + TF('1', S0.x1 - 40, S0.y + 90, 15, C('#8A5A00'));
    m += sh;
  }
  // the doorway to the kitchen (far right)
  {
    const Dr = LR.door;
    m += R(Dr.x0 - 20, Dr.top - 20, Dr.x1 - Dr.x0 + 40, LR.base - Dr.top + 20, 4, O('#FFFFFF', 5)) + R(Dr.x0, Dr.top, Dr.x1 - Dr.x0, LR.base - Dr.top, 0, FL('#F6C29C')) + R(Dr.x0, Dr.top, Dr.x1 - Dr.x0, 60, 0, { fill: '#000', opacity: 0.08 }) + R(Dr.x0 + 60, 380, Dr.x1 - Dr.x0 - 60, 170, 0, FL('#4C5E9E')) + R(Dr.x0 + 60, 370, Dr.x1 - Dr.x0 - 60, 14, 0, FL('#D99A5B'));
  }
  // floor: walnut planks + skirting + the braided rug
  {
    m += R(XL, LR.base, XR - XL, YB - LR.base, 0, FL('#B9783F')) + R(XL, LR.base, XR - XL, YB - LR.base, 0, { fill: 'url(#shGrain)' });
    let jn = '';
    for (let i = 0; i < 6; i++) { const y = LR.base + 24 + i * 26 + i * i * 8; jn += `M${XL} ${f(y)} H${XR} `; }
    m += P(jn, LN(3, '#94592A', 0.6)) + band(LR.base - 12, LR.base + 2, O('#FFFFFF', 3.5)) + band(LR.base + 2, LR.base + 12, { fill: '#000', opacity: 0.08 });
    const rg_ = LR.rug, cols = ['#E8743A', '#F4E2C0', '#3E8F8A', '#F2C14E', '#E86A6A', '#F4E2C0', '#5A7EC4'];
    m += E(rg_.x, rg_.y, rg_.rx, rg_.ry, O(cols[0], 5));
    for (let i = 1; i < cols.length; i++) { const k = 1 - i / cols.length; m += E(rg_.x, rg_.y, rg_.rx * k, rg_.ry * k, FL(cols[i])); }
    let rings = '';
    for (let i = 1; i < cols.length; i++) { const k = 1 - i / cols.length; rings += dE(rg_.x, rg_.y, rg_.rx * k, rg_.ry * k); }
    m += P(rings, { fill: 'none', stroke: C('#000000'), 'stroke-width': 2, opacity: 0.12 });
  }
  // the recliner's back + seat (arms / footrest in front)
  {
    const cx = AR.x;
    let r = P(`M${AR.x0 + 30} ${AR.seat + 10} L${AR.x0 + 20} ${AR.back + 70} Q${AR.x0 + 30} ${AR.back} ${cx - 10} ${AR.back - 6} Q${AR.x1 - 40} ${AR.back} ${AR.x1 - 30} ${AR.back + 70} L${AR.x1 - 40} ${AR.seat + 10} Z`, O('#B5652E', 6));
    r += P(`M${AR.x0 + 64} ${AR.back + 50} Q${cx - 10} ${AR.back + 26} ${AR.x1 - 76} ${AR.back + 50} M${AR.x0 + 60} ${AR.back + 130} Q${cx - 10} ${AR.back + 110} ${AR.x1 - 70} ${AR.back + 130}`, LN(5, '#8E4A1E', 0.7));
    r += P(dC(cx - 70, AR.back + 90, 5) + dC(cx - 10, AR.back + 84, 5) + dC(cx + 50, AR.back + 90, 5), FL('#8E4A1E'));
    r += P(`M${cx - 70} ${AR.back + 2} Q${cx - 10} ${AR.back - 30} ${cx + 50} ${AR.back + 2} L${cx + 40} ${AR.back + 40} Q${cx - 10} ${AR.back + 52} ${cx - 60} ${AR.back + 40} Z`, O('#FFFFFF', 3.5)) + P(`M${cx - 54} ${AR.back + 30} Q${cx - 10} ${AR.back + 40} ${cx + 34} ${AR.back + 30}`, { fill: 'none', stroke: C('#D8D2C4'), 'stroke-width': 3, 'stroke-dasharray': '3 6' });
    r += R(AR.x0 + 50, AR.seat - 30, AR.x1 - AR.x0 - 110, 44, 16, O('#C2723A', 5));
    m += r;
  }
  // Max's toys on the rug (blocks + toy T-rex)
  if (o.toys !== false && fort < 0.5) {
    m += G(R(-22, -40, 40, 40, 5, O('#E2434B', 3.5)) + TF('A', -2, -11, 22, C('#FFFFFF')), 'translate(380 930) rotate(-8)') + G(R(-20, -36, 36, 36, 5, O('#3DA8D8', 3.5)) + TF('B', -2, -10, 20, C('#FFFFFF')), 'translate(424 936) rotate(6)') + G(R(-18, -34, 34, 34, 5, O('#F2C14E', 3.5)) + TF('C', -1, -10, 18, C('#FFFFFF')), 'translate(402 900) rotate(12)');
    m += G(P('M-40 0 L-36 -46 Q-30 -76 4 -74 Q24 -72 28 -54 L52 -54 L50 -38 L28 -38 L26 0 Z M-36 -40 Q-60 -36 -66 -6', O('#5DB55A', 4)) + CI(6, -62, 3.5, FL(LINE)) + P('M-20 -76 l6 -12 l6 10 l6 -12 l6 10', O('#3E8A4A', 3)) + P('M30 -40 l6 4 l6 -4 l6 4', LN(2.5, '#FFFFFF')), 'translate(1100 978) scale(0.9)');
  }
  // ---------------- front: couch front + arms, recliner arms + footrest, the dog bed
  let fr = '';
  {
    // couch front + arms
    fr += R(CO.x0 + 20, CO.seat + 6, CO.x1 - CO.x0 - 40, CO.floor - CO.seat - 6, 14, O('#4A6CB0', 6)) + R(CO.x0 + 20, CO.seat + 6, CO.x1 - CO.x0 - 40, CO.floor - CO.seat - 6, 14, { fill: 'url(#shCord)' }) + P(`M${CO.x0 + 30} ${CO.front + 30} H${CO.x1 - 30}`, LN(5, '#3A5490', 0.6));
    if (fort < 0.75) fr += R(CO.x0 + 54, CO.seat - 2, CO.x1 - CO.x0 - 108, 60, 16, O('#5A7EC4', 5)) + P(`M${(CO.x0 * 2 + CO.x1) / 3} ${CO.seat + 4} V${CO.seat + 54} M${(CO.x0 + CO.x1 * 2) / 3} ${CO.seat + 4} V${CO.seat + 54}`, LN(4, '#3A5490'));
    fr += R(CO.x0 + 40, CO.floor - 4, 22, 24, 4, O('#6A3E24', 3.5)) + R(CO.x1 - 62, CO.floor - 4, 22, 24, 4, O('#6A3E24', 3.5));
    for (const [ax, d] of [[CO.x0, 1], [CO.x1, -1]]) {
      const x0 = d > 0 ? ax : ax - 96;
      fr += R(x0, CO.arm, 96, CO.floor - CO.arm, 30, O('#4A6CB0', 6)) + R(x0, CO.arm, 96, CO.floor - CO.arm, 30, { fill: 'url(#shCord)' }) + P(`M${x0 + 18} ${CO.arm + 22} Q${x0 + 48} ${CO.arm + 10} ${x0 + 78} ${CO.arm + 22}`, LN(5, '#FFFFFF', 0.3));
    }
    // recliner arms + footrest / front skirt
    const rec = b01(o.recline);
    fr += P(`M${AR.x0 + 46} ${AR.seat + 4} L${AR.x1 - 56} ${AR.seat + 4} L${AR.x1 - 60} ${AR.seat + 176} L${AR.x0 + 50} ${AR.seat + 176} Z`, O('#B5652E', 5)) + P(`M${AR.x0 + 70} ${AR.seat + 30} H${AR.x1 - 80} M${AR.x0 + 64} ${AR.seat + 120} H${AR.x1 - 74}`, LN(4, '#8E4A1E', 0.6)) + R(AR.x0 + 50, AR.seat + 150, AR.x1 - AR.x0 - 110, 26, 6, O('#9A5222', 4));
    const recF = rec > 0.02 ? P(`M${AR.x0 + 60} ${AR.seat + 60} L${AR.x1 - 70} ${AR.seat + 60} L${f(AR.x1 - 50 + 20 * rec)} ${f(AR.seat + 176 - 30 * rec)} L${f(AR.x0 + 40 - 20 * rec)} ${f(AR.seat + 176 - 30 * rec)} Z`, O('#C2723A', 5)) + P(`M${f(AR.x0 + 60 - 10 * rec)} ${f(AR.seat + 120)} H${f(AR.x1 - 60 + 10 * rec)}`, LN(4, '#8E4A1E', 0.6)) : '';
    fr += recF + R(AR.x0 + 120, AR.seat + 40, 46, 30, 6, O('#C9A06A', 3)) + P(`M${AR.x0 + 126} ${AR.seat + 46} l34 18 M${AR.x0 + 160} ${AR.seat + 46} l-34 18`, LN(2, '#8E6A3A'));
    for (const [ax, w, hi] of [[AR.x0, 86, 0], [AR.x1 - 96, 96, 1]]) {
      const top = AR.seat - 76 + hi * 6, d = `M${ax + 6} ${AR.seat + 176} L${ax + 4} ${top + 40} Q${ax - 8} ${top} ${ax + w / 2} ${top - 6} Q${ax + w + 8} ${top} ${ax + w - 4} ${top + 40} L${ax + w - 6} ${AR.seat + 176} Z`;
      fr += P(d, O('#B5652E', 6)) + P(`M${ax + 16} ${top + 18} Q${ax + w / 2} ${top + 2} ${ax + w - 16} ${top + 18}`, LN(5, '#E09A62', 0.6)) + CI(ax + w / 2, top + 36, 13, O('#C2723A', 3.5)) + P(`M${ax + w / 2 - 6} ${top + 36} a6 6 0 1 1 6 6`, LN(2.5, '#8E4A1E'));
    }
    fr += R(AR.x1 - 66, AR.seat + 60, 40, 30, 8, O('#E8A35A', 3.5)) + P(`M${AR.x1 - 58} ${AR.seat + 68} l24 14`, LN(2.5, '#8E4A1E'));
    // Grandpa's slippers
    fr += G(P('M-34 0 Q-40 -22 -10 -24 L30 -20 Q44 -10 30 0 Z', O('#7A2E3A', 3.5)) + P('M-30 -12 Q-10 -22 10 -14', LN(4, '#F4E2C0')), `translate(${AR.x0 - 40} ${AR.seat + 182}) rotate(-4)`) + G(P('M-34 0 Q-40 -22 -10 -24 L30 -20 Q44 -10 30 0 Z', O('#7A2E3A', 3.5)) + P('M-30 -12 Q-10 -22 10 -14', LN(4, '#F4E2C0')), `translate(${AR.x0 + 16} ${AR.seat + 198}) rotate(6)`);
    if (o.dogBed !== false) fr += dogBed(LR.bed.x, LR.bed.y, LR.bed.s, tn);
    // floor pillows that later join the fort
    if (fort < 0.65) fr += G(R(-60, -40, 120, 46, 20, O('#E86A6A', 4.5)) + P('M-40 -26 Q0 -34 40 -26', LN(4, '#FFFFFF', 0.4)), 'translate(560 980) rotate(-4)');
  }
  // ---------------- light
  let light = '';
  if (day) light += P(dP([[W.x0 + 10, W.y0 + 10], [W.x1 - 10, W.y0 + 10], [W.x1 + 300, 1000], [W.x0 - 160, 1000]]), { fill: 'url(#shBeam)', opacity: 0.24 });
  else if (eve) light += cover({ fill: '#4A2A7A', opacity: 0.12 });
  else light += cover({ fill: '#050A26', opacity: 0.2 }) + darkRing(LR.side.x - 200, 560, 900, 500, '#02041A', 0.3, 7);
  if (lampK > 0.02) light += glow(LR.side.x - 14, LR.side.top - 150, 280, 'shGlowWarm', 0.9 * lampK) + pool(LR.side.x - 100, 760, 520, 220, '#FFD58A', 0.14 * lampK, 4);
  const tvK = tvOn ? b01(o.tvGlow, eve || nite ? 1 : 0.4) : 0;
  if (tvK > 0.02) light += glow(LR.tv.cx, LR.tv.cy, 300, 'shGlowTV', 0.6 * tvK) + pool(LR.tv.cx + 120, 900, 380, 90, '#8FD8FF', 0.12 * tvK, 3);
  return { bg, mid: m, front: fr, fg: '', light };
}
const livingRoom = makeSet(livingRoomLayers);

// ================================================================= exterior pieces (shared by street + houseExterior)
// OUR HOUSE (origin = bottom centre on the lawn line, ~780 wide x 760 tall at s 1): coral siding with white trim, slate-navy
// roof with a front gable on the right (YOUR round-top window + a flower box), Mom's window (left), Max's window (centre,
// a dino sticker), the porch with the mustard door (number 12) + porch light + Grandpa's rocking chair, the living-room
// window (TV glow at night), the brick chimney (smoke). o: t, night, dark (dusk), hero 'off'|'lit'|'glow'|'update',
// update 0..1, win { mom, max, living, porch }, smoke
function familyHouse(x, y, s = 1, tn = tone(), o = {}) {
  const C = tn.c, O = tn.ol, LN = tn.ln, FL = tn.fl;
  const t = o.t || 0, W = o.win || {}, nite = !!o.night;
  const glass = (on, col) => (on ? '!' + (col || '#FFD27A') : nite ? '#26315A' : '#BFE2F6');
  const win = (x0, y0, w, h, on, col, extra = '') => R(x0 - 10, y0 - 10, w + 20, h + 20, 5, O('#FFFFFF', 4)) + R(x0, y0, w, h, 3, O(glass(on, col), 3.5)) + extra + P(`M${x0 + w / 2} ${y0} V${y0 + h} M${x0} ${y0 + h / 2} H${x0 + w}`, LN(5, '#FFFFFF')) + (on ? '' : P(`M${x0 + 8} ${y0 + h - 10} L${x0 + w * 0.42} ${y0 + 8}`, LN(6, '#FFFFFF', nite ? 0.12 : 0.5)));
  let h = '';
  // chimney + smoke
  h += R(-300, -690, 66, 170, 4, O('#B9603C', 5)) + R(-300, -690, 66, 170, 4, { fill: 'url(#shBrick)' }) + R(-310, -706, 86, 22, 4, O('#7A3A26', 4));
  if (o.smoke !== false) { let sd = ''; for (let i = 0; i < 4; i++) { const u = md(t * 0.12 + i / 4, 1); sd += dC(-266 + u * 70 + Math.sin(t * 0.8 + i) * 10, -730 - u * 190, 15 + u * 24); } h += P(sd, { fill: nite ? '#6A7498' : '#FFFFFF', opacity: 0.45 }); }
  // walls
  h += R(-380, -480, 760, 480, 4, O('#F08A6E', 7)) + R(-380, -480, 760, 480, 4, { fill: 'url(#shSiding)' });
  h += R(-380, -250, 760, 18, 0, O('#FFFFFF', 4)) + R(-392, -480, 22, 480, 3, O('#FFFFFF', 4)) + R(370, -480, 22, 480, 3, O('#FFFFFF', 4)) + R(-380, -26, 760, 26, 0, FL('#C9604A'));
  // roof (hip) + front gable on the right
  h += P('M-420 -466 L-300 -640 L300 -640 L420 -466 Z', O('#3A4676', 7)) + P('M-420 -466 L-300 -640 L300 -640 L420 -466 Z', { fill: 'url(#shShingle)' });
  h += P('M60 -470 L210 -716 L360 -470 Z', O('#F08A6E', 6)) + P('M60 -470 L210 -716 L360 -470 Z', { fill: 'url(#shScallop)' });
  h += P('M36 -458 L210 -744 L384 -458', LN(22)) + P('M36 -458 L210 -744 L384 -458', LN(13, '#3A4676')) + P('M-432 -462 H44 M376 -462 H432', LN(14)) + P('M-432 -462 H44 M376 -462 H432', LN(7, '#FFFFFF'));
  // YOUR window: round-top in the gable + flower box
  const hw = o.hero || 'off', upd = b01(o.update);
  const pulse = 0.6 + 0.4 * Math.sin(t * 9);
  const hcol = hw === 'update' ? mix('#7AB8FF', '#F2FFFF', clamp(upd * 1.6, 0, 1) * pulse) : hw === 'glow' ? mix('#4A7AE8', '#7AA8FF', 0.5 + 0.5 * Math.sin(t * 3) * Math.sin(t * 7.3)) : '#FFD27A';
  const hwOn = hw !== 'off';
  const hwd = 'M150 -490 L150 -580 Q150 -640 210 -640 Q270 -640 270 -580 L270 -490 Z';
  h += P('M136 -478 L136 -582 Q136 -654 210 -654 Q284 -654 284 -582 L284 -478 Z', O('#FFFFFF', 4)) + P(hwd, O(hwOn ? '!' + hcol : glass(false), 3.5));
  if (hwOn) h += P('M168 -490 L168 -552 Q190 -566 214 -556 L214 -490 Z', FL(hw === 'lit' ? '!#E0A050' : '!#2A3A9A')) + R(222, -548, 30, 40, 3, FL(hw === 'lit' ? '!#C98A3A' : '!#4A5ACA'));
  h += P('M210 -640 V-490 M150 -560 H270', LN(5, '#FFFFFF')) + (hwOn ? '' : P('M162 -500 L196 -620', LN(6, '#FFFFFF', nite ? 0.12 : 0.5)));
  h += R(140, -490, 140, 24, 5, O('#8A5634', 4)) + P(dC(160, -494, 11) + dC(186, -498, 12) + dC(214, -495, 11) + dC(242, -498, 12) + dC(266, -494, 10), O('#FF8FB0', 3)) + P(dC(174, -490, 6) + dC(228, -490, 6), FL('#5DB55A'));
  // upstairs: Mom's window (left), Max's (centre, a dino sticker)
  h += win(-320, -420, 120, 120, W.mom) + win(-140, -420, 120, 120, W.max, '#FFE2A8', G(P('M-12 10 L-10 -6 Q-8 -16 2 -14 Q8 -12 9 -6 L16 -6 L15 0 L9 0 L8 10 Z', O('#5DB55A', 2)), 'translate(-80 -380) scale(1.4)'));
  h += R(-330, -296, 140, 12, 4, O('#FFFFFF', 3)) + R(-150, -296, 140, 12, 4, O('#FFFFFF', 3));
  // ground floor: porch + mustard door (left), living-room window (right)
  {
    h += R(-370, -26, 330, 26, 3, O('#E8E2D4', 4)) + R(-292, 0, 150, 14, 3, O('#D8D2C4', 3.5));
    h += R(-270, -214, 108, 188, 6, O('#F2B23A', 5)) + R(-250, -194, 68, 52, 6, O(glass(W.porch, '#FFE6B0'), 3)) + P(dRR(-252, -128, 72, 86, 5), { fill: 'none', stroke: C('#C98A1E'), 'stroke-width': 4 }) + CI(-180, -112, 6, O('#7A4A22', 2.5));
    h += G(R(-24, -12, 48, 24, 4, O('#FFFFFF', 3)) + TF('12', 0, 6, 16, C('#3A4676')), 'translate(-120 -170)') + R(-132, -140, 20, 28, 5, O('#2A2D38', 3)) + R(-128, -136, 12, 18, 3, FL(nite || W.porch ? '!#FFE28A' : '#F2E2B8'));
    h += P('M-392 -236 L-20 -236 L-38 -266 L-374 -266 Z', O('#3A4676', 5)) + R(-392, -238, 372, 14, 3, O('#FFFFFF', 4)) + R(-382, -226, 16, 202, 4, O('#FFFFFF', 4)) + R(-44, -226, 16, 202, 4, O('#FFFFFF', 4));
    // Grandpa's rocking chair on the porch
    h += G(P('M-26 0 Q0 8 26 0', LN(5, '#8A5634')) + R(-24, -46, 48, 10, 3, O('#A0683E', 3)) + P('M-22 -46 L-26 -100 M22 -46 L24 -100 M-26 -100 H24 M-24 -80 H22', LN(5, '#8A5634')) + P('M-20 -36 L-18 -6 M20 -36 L18 -6', LN(4, '#8A5634')), 'translate(-336 -26) scale(0.95)');
    const tvK = o.tv || 0, lit = W.living !== undefined ? W.living : !!o.dark;
    const inside = tvK > 0 ? '!' + mix('#2A4A8A', '#8FD8FF', 0.6 * tvK) : lit ? '!#FFD27A' : glass(false);
    h += R(20, -216, 320, 170, 5, O('#FFFFFF', 4));
    h += R(30, -206, 300, 150, 3, O(inside, 3.5)) + P('M130 -206 V-56 M230 -206 V-56', LN(5, '#FFFFFF')) + (tvK > 0 || lit ? '' : P('M40 -66 L90 -196 M150 -66 L190 -170', LN(6, '#FFFFFF', nite ? 0.12 : 0.45)));
    h += R(20, -50, 320, 18, 4, O('#FFFFFF', 3.5)) + R(26, -32, 308, 24, 5, O('#8A5634', 3.5)) + P(dC(50, -34, 12) + dC(86, -38, 13) + dC(124, -34, 12) + dC(164, -38, 13) + dC(204, -34, 12) + dC(244, -38, 13) + dC(284, -34, 12) + dC(314, -36, 11), O('#FFD23F', 3)) + P(dC(68, -28, 7) + dC(144, -28, 7) + dC(224, -28, 7) + dC(300, -28, 7), FL('#5DB55A'));
  }
  // foundation bushes
  const fb = dC(-350, -10, 30) + dC(-300, -16, 34) + dC(330, -12, 32) + dC(362, -8, 26) + dR(-380, -14, 120, 16) + dR(300, -12, 90, 14);
  h += blob(fb, C('#4FA85A'), 4, tn.line) + P(dC(-330, -30, 6) + dC(346, -28, 6) + dC(-290, -14, 5), FL('#FF8FC0'));
  return G(h, tr(x, y, s));
}
// Mom's FLOUR POWER bakery van (origin = bottom centre under the wheels, ~560 x 300 at s 1, faces left). o: lights, flip
function bakeryVan(x, y, s = 1, tn = tone(), o = {}) {
  const C = tn.c, O = tn.ol, LN = tn.ln, FL = tn.fl;
  let v = E(0, 0, 270, 16, { fill: '#000', opacity: 0.18 });
  v += P('M-270 -40 L-270 -150 Q-266 -186 -230 -196 L-190 -270 Q-180 -290 -150 -290 L250 -290 Q276 -290 276 -262 L276 -40 Z', O('#FFF8F0', 5));
  v += P('M-264 -96 L276 -96 L276 -74 L-268 -74 Z', FL('#FF9EBB')) + P('M-180 -274 L-150 -274 L-150 -200 L-238 -200 Z', O(o.night ? '#26315A' : '#BFE2F6', 4)) + P('M-200 -262 L-224 -212', LN(5, '#FFFFFF', 0.5));
  v += G(CI(0, 0, 56, O('#FFFFFF', 4)) + cupcake(0, 32, 1.1, tn, { cherry: true }), 'translate(-20 -180)') + T('FLOUR POWER', 128, -204, 34, C('#C8456A'), OUTX(7, '#FFFFFF')) + TF('BAKERY', 128, -164, 24, C('#3A4676'));
  v += R(-276, -60, 56, 24, 8, O('#C9CED8', 3.5)) + R(-262, -150, 26, 20, 6, O(o.lights ? '!#FFF4C0' : '#FFF8E0', 3)) + R(230, -60, 50, 24, 8, O('#C9CED8', 3.5)) + R(262, -160, 14, 30, 4, O('#E2434B', 3));
  v += P('M-120 -96 V-280 M-120 -190 h-20', LN(4, '#D8D2C4'));
  for (const wx of [-170, 170]) v += CI(wx, -30, 42, O('#2A2D38', 5)) + CI(wx, -30, 18, O('#C9CED8', 3.5));
  return G(v, `translate(${f(x)} ${f(y)}) scale(${f(o.flip ? -s : s)} ${f(s)})`);
}
// a neighbour house (origin = bottom centre). i picks palette + shape. o: lit (some windows lit), dark
const NB_PAL = [['#B8E3C8', '#2F7A6A', '#F2B23A'], ['#FFE6A0', '#C8553D', '#3A4676'], ['#C8DAF6', '#4A5AA8', '#E2434B'], ['#F6D2DA', '#7A4FB8', '#3E9C8A'], ['#E8E0D0', '#8A5634', '#5DB55A'], ['#D8EEF2', '#3A7AB8', '#F27A6A']];
function nbHouse(x, y, i, tn = tone(), o = {}) {
  const [wall, roof, door] = NB_PAL[md(i, NB_PAL.length)];
  const w = 500 + 100 * hash(i * 2.3), two = hash(i * 7.7) > 0.45, hh = two ? 380 : 250;
  const glass = (on) => tn.ol(on ? '!#FFD27A' : o.night ? '#26315A' : '#BFE2F6', 3.5);
  const win = (wx, wy, ww, wh, on) => R(wx - 8, wy - 8, ww + 16, wh + 16, 4, tn.ol('#FFFFFF', 3.5)) + R(wx, wy, ww, wh, 3, glass(on)) + P(`M${wx + ww / 2} ${wy} V${wy + wh} M${wx} ${wy + wh / 2} H${wx + ww}`, tn.ln(4, '#FFFFFF'));
  let s = R(x - w / 2, y - hh, w, hh, 4, tn.ol(wall, 6)) + R(x - w / 2, y - hh, w, hh, 4, { fill: 'url(#shSiding)' });
  const peak = y - hh - 150 - 30 * hash(i * 4.1);
  if (hash(i * 5.9) > 0.5) s += P(`M${x - w / 2 - 30} ${y - hh + 8} L${x} ${peak} L${x + w / 2 + 30} ${y - hh + 8} Z`, tn.ol(roof, 6)) + P(`M${x - w / 2 - 30} ${y - hh + 8} L${x} ${peak} L${x + w / 2 + 30} ${y - hh + 8} Z`, { fill: 'url(#shShingle)' }) + CI(x, peak + 70, 22, glass(o.lit && hash(i * 3.3) > 0.5));
  else s += P(`M${x - w / 2 - 30} ${y - hh + 8} L${x - w / 2 + 70} ${peak + 40} L${x + w / 2 - 70} ${peak + 40} L${x + w / 2 + 30} ${y - hh + 8} Z`, tn.ol(roof, 6)) + P(`M${x - w / 2 - 30} ${y - hh + 8} L${x - w / 2 + 70} ${peak + 40} L${x + w / 2 - 70} ${peak + 40} L${x + w / 2 + 30} ${y - hh + 8} Z`, { fill: 'url(#shShingle)' });
  s += win(x - w / 2 + 46, y - hh + 40, 96, 82, o.lit && hash(i * 5.1) > 0.4) + win(x + w / 2 - 142, y - hh + 40, 96, 82, o.lit && hash(i * 6.3) > 0.55);
  if (two) s += win(x - w / 2 + 46, y - 170, 96, 82, o.lit && hash(i * 8.9) > 0.6) + R(x - w / 2, y - 220, w, 12, 0, tn.ol('#FFFFFF', 3));
  s += R(x + 20, y - 170, 76, 170, 6, tn.ol(door, 4.5)) + CI(x + 82, y - 84, 6, tn.ol('#FFC23A', 2)) + R(x + 6, y - 6, 104, 10, 3, tn.ol('#E8E2D4', 3));
  s += blob(dC(x - w / 2 + 40, y - 14, 28) + dC(x - 40, y - 12, 24) + dR(x - w / 2 + 12, y - 16, 120, 16), tn.c('#4FA85A'), 4, tn.line);
  return s;
}
// Mrs. Wells' lavender cottage (origin = bottom centre, ~560 wide). Scalloped trim, rose bushes, a cat in the window.
function wellsCottage(x, y, tn = tone(), o = {}) {
  const C = tn.c, O = tn.ol, LN = tn.ln, FL = tn.fl;
  const t = o.t || 0;
  let s = R(x - 270, y - 290, 540, 290, 4, O('#C9B2E8', 6)) + R(x - 270, y - 290, 540, 290, 4, { fill: 'url(#shSiding)' });
  s += P(`M${x - 310} ${y - 280} L${x} ${y - 470} L${x + 310} ${y - 280} Z`, O('#6A4A9A', 6)) + P(`M${x - 310} ${y - 280} L${x} ${y - 470} L${x + 310} ${y - 280} Z`, { fill: 'url(#shScallop)' });
  s += P(`M${x - 300} ${y - 282} L${x} ${y - 462} L${x + 300} ${y - 282}`, LN(8, '#FFFFFF'));
  s += R(x - 22, y - 400, 44, 44, 22, O(o.lit ? '!#FFD27A' : o.night ? '#26315A' : '#BFE2F6', 3.5));
  const glass = (on) => O(on ? '!#FFD27A' : o.night ? '#26315A' : '#BFE2F6', 3.5);
  for (const wx of [x - 210, x + 90]) {
    s += R(wx - 10, y - 226, 140, 120, 5, O('#FFFFFF', 4)) + R(wx, y - 216, 120, 100, 3, glass(o.lit)) + P(`M${wx + 60} ${y - 216} V${y - 116} M${wx} ${y - 166} H${wx + 120}`, LN(4, '#FFFFFF'));
    s += P(`M${wx - 14} ${y - 230} L${wx + 134} ${y - 230} L${wx + 134} ${y - 206} Q${wx + 60} ${y - 190} ${wx - 14} ${y - 206} Z`, O('#F27A9A', 3.5));
    s += R(wx - 8, y - 112, 136, 18, 4, O('#8A5634', 3)) + P(dC(wx + 10, y - 114, 10) + dC(wx + 40, y - 118, 11) + dC(wx + 72, y - 114, 10) + dC(wx + 104, y - 118, 11), O('#FF8FB0', 2.5));
  }
  // the cat in the right window (tail flick)
  const tf = Math.sin(t * 2) * 10;
  s += G(P('M-26 0 Q-30 -34 -14 -40 L-18 -58 L-4 -46 L6 -46 L18 -58 L16 -40 Q30 -34 26 0 Z', O('#F2A33A', 3)) + CI(-8, -30, 2.5, FL(LINE)) + CI(8, -30, 2.5, FL(LINE)) + P(`M24 -6 Q46 -10 ${f(40 + tf * 0.3)} ${f(-34 - tf)}`, LN(6)) + P(`M24 -6 Q46 -10 ${f(40 + tf * 0.3)} ${f(-34 - tf)}`, LN(3, '#F2A33A')), `translate(${x + 140} ${y - 124})`);
  // door (sage) with a wreath + WELLS plate
  s += R(x - 52, y - 200, 104, 200, 8, O('#7ABAA0', 5)) + CI(x + 30, y - 100, 6, O('#FFC23A', 2.5)) + CI(x, y - 150, 24, { fill: 'none', stroke: C('#4FA85A'), 'stroke-width': 9 }) + CI(x - 12, y - 168, 5, FL('#E2434B')) + CI(x + 14, y - 132, 5, FL('#E2434B'));
  s += R(x - 68, y - 8, 136, 12, 3, O('#E8E2D4', 3));
  s += G(R(-40, -14, 80, 28, 5, O('#FFFFFF', 3)) + TF('WELLS', 0, 6, 15, C('#6A4A9A')), `translate(${x} ${y - 236})`);
  // rose bushes
  const rb = dC(x - 240, y - 16, 30) + dC(x - 190, y - 20, 34) + dC(x + 200, y - 18, 32) + dC(x + 248, y - 14, 28) + dR(x - 270, y - 20, 120, 20) + dR(x + 170, y - 18, 100, 18);
  s += blob(rb, C('#3E9A52'), 4, tn.line) + P(dC(x - 232, y - 32, 7) + dC(x - 196, y - 40, 7) + dC(x - 168, y - 22, 6) + dC(x + 190, y - 34, 7) + dC(x + 232, y - 28, 7), O('#FF5A7A', 2.5));
  return s;
}
// the CORNER SHOP (origin = bottom centre on the sidewalk line, ~720 wide, flat roof + parapet sign, striped awning,
// produce crates outside). o: night, lit, t
function cornerShop(x, y, tn = tone(), o = {}) {
  const C = tn.c, O = tn.ol, LN = tn.ln, FL = tn.fl;
  const w = 720, x0 = x - w / 2, x1 = x + w / 2;
  let s = R(x0, y - 520, w, 520, 4, O('#C86A4A', 7)) + R(x0, y - 520, w, 520, 4, { fill: 'url(#shBrick)' });
  s += R(x0 - 14, y - 560, w + 28, 54, 6, O('#2F6A5A', 6)) + R(x0 + 70, y - 552, w - 140, 38, 8, O('#FFF4E2', 4)) + T('CORNER SHOP', x, y - 521, 32, C('#2F6A5A'));
  // display windows + door
  const lit = o.lit || o.night;
  const glass = O(lit ? '!#FFE6A8' : '#BFE2F6', 4);
  s += R(x0 + 40, y - 330, 250, 250, 5, glass) + R(x1 - 290, y - 330, 250, 250, 5, glass);
  // shelves seen through the windows
  let sh = '';
  for (const wx of [x0 + 40, x1 - 290]) for (let r = 0; r < 3; r++) { sh += dR(wx + 10, y - 260 + r * 66, 230, 8); }
  s += P(sh, FL('#8A5634'));
  let it = '';
  for (let i = 0; i < 18; i++) { const wx = i < 9 ? x0 + 56 : x1 - 274, r = Math.floor((i % 9) / 3), c = i % 3; it += dRR(wx + c * 74 + (r % 2) * 10, y - 300 + r * 66, 44, 38, 6); }
  s += P(it, O('#F27A6A', 2.5));
  s += R(x - 70, y - 380, 140, 380, 6, O('#2F6A5A', 5)) + R(x - 52, y - 360, 104, 200, 5, glass) + CI(x + 46, y - 150, 7, O('#FFC23A', 2.5)) + G(R(-44, -16, 88, 32, 6, O('#FFFFFF', 3)) + TF('OPEN', 0, 7, 18, C('#E2434B')), `translate(${x} ${y - 300})`);
  // striped awning
  let aw = '', aw2 = '';
  for (let i = 0; i < 12; i++) { const ax = x0 + i * (w / 12); const dd = dP([[ax, y - 420], [ax + w / 12, y - 420], [ax + w / 12 + 12, y - 350], [ax + 12, y - 350]]); if (i % 2) aw += dd; else aw2 += dd; }
  s += P(aw2, FL('#FFFFFF')) + P(aw, FL('#3E9C8A')) + P(`M${x0} ${y - 420} H${x1} L${x1 + 12} ${y - 350} H${x0 + 12} Z`, LN(5));
  let sc = `M${x0 + 12} ${y - 350}`;
  for (let i = 0; i < 12; i++) { const ax = x0 + 12 + i * (w / 12); sc += ` Q${f(ax + w / 24)} ${y - 322} ${f(ax + w / 12)} ${y - 350}`; }
  s += P(sc + ' Z', O('#3E9C8A', 4));
  // produce crates on the sidewalk (apples, oranges, melons) + the ice-cream sign
  const crate = (cx, col) => R(cx - 60, -70, 120, 70, 4, O('#C9925A', 4)) + P(`M${cx - 60} -36 H${cx + 60}`, LN(3, '#8A5634')) + P(Array.from({ length: 5 }, (_, i) => dC(cx - 44 + i * 22, -74 - (i % 2) * 6, 14)).join(''), O(col, 3));
  s += G(crate(-40, '#E2434B') + crate(90, '#F2963A') + crate(220, '#8FD06A'), `translate(${x0 + 40} ${y + 8})`);
  s += G(R(-6, -120, 12, 120, 3, O('#8A93A8', 3)) + P('M-40 -120 L40 -120 L32 -200 L-32 -200 Z', O('#FFFFFF', 4)) + P('M-16 -150 L0 -116 L16 -150 Z', O('#F2B84B', 3)) + CI(0, -160, 16, O('#FF9EBB', 3)) + TF('ICE CREAM', 0, -180, 11, C('#E2434B')), `translate(${x1 - 40} ${y + 12})`);
  return s;
}
// streetlamp (origin = base). o: on
function streetLamp(x, y, tn, on) {
  return R(x - 8, y - 380, 16, 380, 4, tn.ol('#3A4676', 4)) + P(`M${x} ${y - 380} Q${x} ${y - 420} ${x + 42} ${y - 422}`, tn.ln(8)) + P(`M${x} ${y - 380} Q${x} ${y - 420} ${x + 42} ${y - 422}`, tn.ln(4, '#3A4676')) + P(`M${x + 22} ${y - 428} L${x + 66} ${y - 428} L${x + 58} ${y - 404} L${x + 30} ${y - 404} Z`, tn.ol('#3A4676', 4)) + E(x + 44, y - 402, 14, 5, tn.fl(on ? '!#FFF0B0' : '#E8E2C8'));
}

// ================================================================= 4. STREET — the neighbourhood for the quest montage (SC06) (camera set)
// One plane at k 1: front lawns (houses stand on y 700), the white picket fence / hedges along the sidewalk (y 880..975,
// stand line 935), the curb and the road below. World x: OUR HOUSE at x -760 (s .72, the bakery van on the driveway), a
// mint neighbour at -1560; MRS. WELLS' lavender cottage at x 520 with its picket fence + GATE (x 470..570) and the grocery
// bags on the sidewalk; the big OAK at x 1380 with the BALL stuck in it; a yellow house at 2150 (a kid's bike), a blue one at
// 2860; the CORNER SHOP at 3720 (awning, crates, ICE CREAM sign), the side street at 4160..4560 (crosswalk, STOP sign);
// more neighbours both ways (every 760 px). Behind: back roofs + trees (k .55), hills (k .2), sky (k 0), sun (k .03),
// clouds (k .06), birds (k .7); fg (k 1.25): flower bushes at the bottom edge. Hero s .4 on the sidewalk.
// opts: { time 'day'|'sunset'|'morning' (default day), ball (default true: the ball in the oak; false = rescued),
//   bags (default true: Mrs. Wells' grocery bags at her gate), birds (default true), leaves (default true: a few falling),
//   cars (default false: a parked car at x 2900 by the curb), lamps (streetlamps on; default true at sunset) }
const STR = { base: 700, walk: { y0: 880, y1: 975 }, stand: 935, road: 990, home: -760, wells: 520, gate: { x0: 470, x1: 570 }, oak: 1380, shop: 3720, side: { x0: 4160, x1: 4560 }, every: 760 };
const STR_HOUSES = [[-1560, 0], [2150, 1], [2860, 2], [4980, 3], [5740, 4], [-2320, 5], [-3080, 2]];
function streetLayers(t, cam = {}, o = {}) {
  cam = cam || {};
  const time = o.time || 'day', sunset = time === 'sunset', morn = time === 'morning';
  const tn = tone(sunset ? { sunset: 0.6 } : morn ? { morn: 0.5 } : {});
  const C = tn.c, O = tn.ol, LN = tn.ln, FL = tn.fl;
  const lampsOn = o.lamps === undefined ? sunset : !!o.lamps;
  // ---- sky (k 0) + sun (k .03) + clouds (k .06)
  const v0 = vis(cam, 0);
  let sky = R(v0.x0 - 200, v0.y0 - 200, v0.x1 - v0.x0 + 400, v0.y1 - v0.y0 + 400, 0, { fill: `url(#${sunset ? 'shSkySunset' : morn ? 'shSkyMorning' : 'shSkyDay'})` });
  const sunP = sunset ? [1500, 520] : morn ? [360, 360] : [1560, 150];
  const sun = glow(sunP[0], sunP[1], 210, 'shGlowWarm', 0.9) + CI(sunP[0], sunP[1], 56, { fill: sunset ? '#FFD08A' : '#FFE45C', stroke: '#FFB42E', 'stroke-width': 7 });
  const vc = vis(cam, 0.06);
  let cl = '';
  for (let i = Math.floor((vc.x0 - 500) / 720); i * 720 < vc.x1 + 500; i++) {
    const x = i * 720 + md(hash(i * 2.7) * 400 + t * (5 + 5 * hash(i)), 720), y = 100 + 180 * hash(i * 9.3), s = 0.5 + 0.45 * hash(i * 5.5);
    cl += shCloud(x, y, s, tn, sunset ? '#FFD6E6' : '#FFFFFF', sunset ? '#F2A0C0' : morn ? '#FFE2CC' : '#DCEBFA');
  }
  // ---- hills (k .2)
  const vh = vis(cam, 0.2);
  let hills = '';
  {
    const pts = [];
    for (let x = Math.floor((vh.x0 - 400) / 160) * 160; x < vh.x1 + 400; x += 160) pts.push([x, 500 - 46 * Math.sin(x * 0.0024) - 30 * hash(Math.round(x / 160) * 1.7)]);
    let d = `M${pts[0][0]} 1400 L${pts[0][0]} ${f(pts[0][1])}`;
    for (let j = 1; j < pts.length; j++) d += ` Q${f((pts[j - 1][0] + pts[j][0]) / 2)} ${f(Math.min(pts[j - 1][1], pts[j][1]) - 26)} ${f(pts[j][0])} ${f(pts[j][1])}`;
    d += ` L${pts[pts.length - 1][0]} 1400 Z`;
    hills += P(d, FL(sunset ? '#B48AB8' : '#A8D8A6'));
    let tr2 = '';
    for (let x = Math.floor(vh.x0 / 210) * 210; x < vh.x1; x += 210) if (hash(x * 0.013) > 0.35) { const by = 520 - 46 * Math.sin(x * 0.0024); tr2 += dE(x + 60 * hash(x), by - 26, 32, 38); }
    hills += P(tr2, FL(sunset ? '#8A6A9A' : '#7CC08A'));
  }
  // ---- back row of roofs + trees (k .55)
  const vb = vis(cam, 0.55);
  let back = R(vb.x0 - 300, 580, vb.x1 - vb.x0 + 600, 900, 0, FL(sunset ? '#86A066' : '#8ACB78'));
  for (let i = Math.floor((vb.x0 - 500) / 560); i * 560 < vb.x1 + 500; i++) {
    const x = i * 560 + 110 * hash(i * 3.7), pal = NB_PAL[md(i * 5, NB_PAL.length)];
    const hz = (c) => mix(c, sunset ? '#F0B8C8' : '#D8ECFF', 0.55);
    back += R(x - 120, 490, 240, 100, 4, O(hz(pal[0]), 3.5)) + P(`M${x - 142} 496 L${x} 410 L${x + 142} 496 Z`, O(hz(pal[1]), 3.5)) + R(x - 80, 516, 40, 34, 4, O(hz('#BFE2F6'), 3)) + R(x + 40, 516, 40, 34, 4, O(sunset && hash(i * 4.4) > 0.5 ? '!#FFD27A' : hz('#BFE2F6'), 3));
    if (hash(i * 4.9) > 0.35) back += leafTree(x + 280, 620, 0.5, tn, { col: hz('#4FAE5A'), hi: hz('#86D477'), dark: hz('#3A8C48'), sway: Math.sin(t * 0.8 + i) * 1.1 });
  }
  // ---- birds (k .7)
  let fly = '';
  if (o.birds !== false) for (let i = 0; i < 4; i++) {
    const u = md(t * 0.03 + i * 0.09, 1), x = -400 + u * 3200 + i * 60 + (cam.x || 0) * 0.7, y = 230 + i * 26 + Math.sin(t * 1.3 + i) * 12;
    fly += shBird(x, y, 0.7, tn, { flap: md(t * 4.4 + i * 0.37, 1), col: '#4A5A7A' });
  }
  // ---- the street plane (k 1)
  const v1 = vis(cam, 1);
  const X0 = v1.x0 - 500, X1 = v1.x1 + 500;
  const inV = (x, r) => x + r > X0 && x - r < X1;
  let m = R(X0, 560, X1 - X0, STR.walk.y0 - 560, 0, FL('#6CC85E')) + R(X0, 560, X1 - X0, STR.walk.y0 - 560, 0, { fill: 'url(#shLawn)' });
  // the side street cuts the lawn
  if (inV((STR.side.x0 + STR.side.x1) / 2, 400)) m += P(dP([[STR.side.x0 + 60, 560], [STR.side.x1 - 60, 560], [STR.side.x1, STR.walk.y0], [STR.side.x0, STR.walk.y0]]), FL('#8A8EA2'));
  for (const [hx_, i] of STR_HOUSES) if (inV(hx_, 400)) m += nbHouse(hx_, STR.base, i, tn, { lit: sunset }) + P(dP([[hx_ + 40, STR.base], [hx_ + 130, STR.base], [hx_ + 150, STR.walk.y0], [hx_ + 20, STR.walk.y0]]), O('#E8E2D4', 3.5));
  // procedural neighbours beyond the hand-placed block
  for (let i = Math.floor((X0 - 400) / STR.every); i * STR.every < X1 + 400; i++) {
    const hx_ = i * STR.every + 380;
    if (hx_ > -3500 && hx_ < 6200) continue;
    m += nbHouse(hx_, STR.base, i + 20, tn, { lit: sunset }) + P(dP([[hx_ + 40, STR.base], [hx_ + 130, STR.base], [hx_ + 150, STR.walk.y0], [hx_ + 20, STR.walk.y0]]), O('#E8E2D4', 3.5));
  }
  // OUR HOUSE + the bakery van on the driveway
  if (inV(STR.home, 700)) {
    m += P(dP([[STR.home + 300, STR.base], [STR.home + 560, STR.base], [STR.home + 620, STR.walk.y0], [STR.home + 260, STR.walk.y0]]), O('#D6D2CA', 4));
    m += P(dE(STR.home - 150, 730, 44, 10) + dE(STR.home - 154, 768, 50, 12) + dE(STR.home - 158, 810, 56, 13) + dE(STR.home - 162, 852, 60, 13), O('#E8E2D4', 3.5));
    m += familyHouse(STR.home, STR.base, 0.72, tn, { t, dark: sunset, hero: sunset ? 'lit' : 'off', win: { living: sunset } });
    m += bakeryVan(STR.home + 440, 862, 0.6, tn, {});
    m += G(R(-7, -130, 14, 130, 3, O('#8A5634', 4)) + R(-34, -176, 68, 50, 12, O('#F08A6E', 4)) + R(30, -186, 6, 34, 2, O('#E2434B', 2.5)) + R(30, -186, 20, 12, 2, O('#E2434B', 2.5)) + TF('12', 0, -144, 15, C('#FFFFFF')), `translate(${STR.home - 230} ${STR.walk.y0 - 6})`);
  }
  // MRS. WELLS' cottage + path + picket fence with the gate
  if (inV(STR.wells, 600)) {
    m += wellsCottage(STR.wells, STR.base, tn, { t, lit: sunset });
    m += P(dE(STR.wells, 732, 46, 10) + dE(STR.wells, 770, 52, 12) + dE(STR.wells, 812, 58, 13) + dE(STR.wells, 854, 62, 13), O('#E8E2D4', 3.5));
    // birdbath + a garden gnome
    m += G(R(-10, -90, 20, 90, 4, O('#D8D2C4', 3.5)) + E(0, -92, 46, 12, O('#D8D2C4', 4)) + E(0, -94, 34, 6, FL('#8FD0F6')) + R(-28, -6, 56, 10, 3, O('#C9C2B2', 3)), `translate(${STR.wells + 200} 820)`);
    m += G(P('M-14 0 L-12 -40 L12 -40 L14 0 Z', O('#3E6EB8', 3)) + CI(0, -48, 10, O('#F6D5BC', 2.5)) + P('M-12 -52 L0 -86 L12 -52 Z', O('#E2434B', 3)) + P('M-8 -42 Q0 -30 8 -42', FL('#FFFFFF')), `translate(${STR.wells - 190} 828)`);
  }
  // the big oak with the ball
  if (inV(STR.oak, 400)) m += leafTree(STR.oak, 868, 1.05, tn, { sway: Math.sin(t * 0.7) * 1.1, ball: o.ball === false ? false : true });
  // the corner shop + the side street (crosswalk, STOP sign)
  if (inV(STR.shop, 600)) m += cornerShop(STR.shop, STR.walk.y0, tn, { lit: sunset, t });
  // fences: Wells' picket fence + low hedges along the other lots (gaps for paths, driveways, the side street, the shop)
  {
    let pk = '', hd = '';
    for (let x = Math.floor(X0 / 40) * 40; x < X1; x += 40) {
      if (x >= STR.wells - 300 && x < STR.wells + 300) { if (x + 30 > STR.gate.x0 && x < STR.gate.x1) continue; pk += dP([[x, STR.walk.y0 - 4], [x, 796], [x + 14, 780], [x + 28, 796], [x + 28, STR.walk.y0 - 4]]); continue; }
      const xr = x;
      if (xr > STR.shop - 420 && xr < STR.side.x1 + 20) continue;
      if (xr > STR.home + 230 && xr < STR.home + 640) continue;
      if (xr > STR.home - 210 && xr < STR.home - 110) continue;
      if (STR_HOUSES.some(([hx_]) => xr > hx_ + 10 && xr < hx_ + 160)) continue;
      if (Math.abs(xr - STR.oak) < 60) continue;
      if (x % 80 === 0) hd += dC(x + 40, STR.walk.y0 - 30, 36) + dR(x, STR.walk.y0 - 30, 80, 30);
    }
    if (pk) m += P(pk, O('#FFFFFF', 3.5)) + P(`M${STR.wells - 300} 812 H${STR.gate.x0} M${STR.gate.x1} 812 H${STR.wells + 300} M${STR.wells - 300} 852 H${STR.gate.x0} M${STR.gate.x1} 852 H${STR.wells + 300}`, LN(5, '#D8DCE4'));
    if (inV(STR.wells, 600)) m += G(P('M0 0 L-46 -8 L-46 -84 L0 -76 Z', O('#FFFFFF', 3.5)) + P('M-12 -10 V-74 M-24 -12 V-76 M-36 -14 V-80', LN(3, '#D8DCE4')), `translate(${STR.gate.x0} ${STR.walk.y0 - 4})`) + R(STR.gate.x0 - 6, 770, 14, 110, 3, O('#FFFFFF', 3.5)) + R(STR.gate.x1 - 8, 770, 14, 110, 3, O('#FFFFFF', 3.5));
    m += blob(hd, C('#4FA85A'), 4, tn.line);
  }
  // sidewalk, curb, road, crosswalk
  {
    m += R(X0, STR.walk.y0, X1 - X0, STR.walk.y1 - STR.walk.y0, 0, FL('#EAE3D6')) + R(X0, STR.walk.y1, X1 - X0, STR.road - STR.walk.y1, 0, FL('#C2BBAE')) + R(X0, STR.road, X1 - X0, 1600 - STR.road, 0, FL('#7C8096')) + R(X0, STR.road, X1 - X0, 1600 - STR.road, 0, { fill: 'url(#shRoad)' });
    let jn = '';
    for (let x = Math.floor(X0 / 160) * 160; x < X1; x += 160) jn += `M${x} ${STR.walk.y0} L${x - 22} ${STR.walk.y1} `;
    m += P(jn, LN(3, '#CFC6B6')) + P(`M${X0} ${STR.walk.y0} H${X1} M${X0} ${STR.walk.y1} H${X1} M${X0} ${STR.road} H${X1}`, LN(4, LINE, 0.55)) + P(`M${X0} 1140 H${X1}`, { fill: 'none', stroke: C('#FFE6A0'), 'stroke-width': 9, 'stroke-dasharray': '70 60' });
    if (inV((STR.side.x0 + STR.side.x1) / 2, 400)) {
      let zb = '';
      for (let x = STR.side.x0 + 20; x < STR.side.x1 - 20; x += 54) zb += dR(x, STR.walk.y0 + 6, 32, STR.walk.y1 - STR.walk.y0 - 12);
      m += R(STR.side.x0, STR.walk.y0, STR.side.x1 - STR.side.x0, STR.walk.y1 - STR.walk.y0, 0, FL('#7C8096')) + P(zb, FL('#FFFFFF'));
      m += G(R(-6, -300, 12, 300, 3, O('#9AA4B4', 3)) + P('M-40 -300 L-17 -323 L17 -323 L40 -300 L40 -266 L17 -243 L-17 -243 L-40 -266 Z', O('#E2434B', 4)) + TF('STOP', 0, -275, 22, C('#FFFFFF')), `translate(${STR.side.x0 - 40} ${STR.walk.y0 + 10})`);
    }
  }
  // streetlamps
  let lamps = '', lampGlow = '';
  for (let i = Math.floor((X0 - 240) / 1600) - 1; 240 + i * 1600 < X1 + 200; i++) {
    const lx = 240 + i * 1600;
    if (lx < X0 - 100) continue;
    lamps += streetLamp(lx, STR.walk.y0 + 10, tn, lampsOn);
    if (lampsOn) lampGlow += glow(lx + 44, STR.walk.y0 - 380, 190, 'shGlowWarm', 0.75);
  }
  m += lamps;
  // Mrs. Wells' grocery bags at the gate
  if (o.bags !== false && inV(STR.wells, 600)) m += groceryBag(STR.gate.x1 + 64, STR.stand + 6, 0.82, tn, { kind: 0 }) + groceryBag(STR.gate.x1 + 170, STR.stand + 10, 0.82, tn, { kind: 1 }) + groceryBag(STR.gate.x1 + 118, STR.stand + 30, 0.82, tn, { kind: 2 });
  if (o.cars) m += G(E(0, 0, 230, 14, { fill: '#000', opacity: 0.18 }) + P('M-220 -30 L-220 -110 Q-214 -130 -180 -136 L-120 -196 Q-104 -210 -70 -210 L80 -210 Q110 -210 126 -190 L170 -136 Q214 -130 220 -100 L220 -30 Z', O('#3DA8D8', 5)) + P('M-110 -136 L-66 -186 L0 -186 L0 -136 Z M14 -136 L14 -186 L76 -186 L116 -136 Z', O('#CDEEFF', 3.5)) + CI(-130, -30, 34, O('#2A2D38', 5)) + CI(130, -30, 34, O('#2A2D38', 5)) + CI(-130, -30, 14, O('#C9CED8', 3)) + CI(130, -30, 14, O('#C9CED8', 3)), `translate(2900 ${STR.road + 66})`);
  // falling leaves (k 1)
  if (o.leaves !== false && inV(STR.oak, 900)) {
    let lv = '';
    for (let i = 0; i < 5; i++) { const u = md(t * 0.12 + i / 5, 1), lx = STR.oak - 180 + 360 * hash(i * 3.1) + Math.sin(t * 2 + i) * 40, ly = 460 + u * 480; lv += G(P('M0 -8 Q8 0 0 8 Q-8 0 0 -8 Z', O(i % 2 ? '#86D477' : '#F2B84B', 2)), tr(lx, ly, 1.2, t * 120 + i * 60)); }
    m += lv;
  }
  // ---- fg (k 1.25): flower bushes peeking at the bottom edge
  const vf = vis(cam, 1.25);
  let fg = '';
  for (let i = Math.floor((vf.x0 - 600) / 2600); i * 2600 < vf.x1 + 600; i++) {
    const bx = i * 2600 + 2240;
    const bd = dC(bx - 70, 1150, 70) + dC(bx + 20, 1120, 84) + dC(bx + 110, 1154, 66) + dR(bx - 140, 1140, 320, 120);
    fg += blob(bd, C('#3E9A52'), 6, tn.line) + P(dC(bx - 40, 1130, 30) + dC(bx + 40, 1090, 34), FL('#5DB55A')) + P(dC(bx - 30, 1090, 10) + dC(bx + 60, 1078, 10) + dC(bx + 120, 1116, 9), O('#FF8FC0', 3)) + P(dC(bx + 10, 1110, 9) + dC(bx - 80, 1120, 8), O('#FFE14D', 3));
  }
  // ---- light
  let light = '';
  if (lampsOn) light += V(cam, lampGlow, 1);
  const lv0 = vis(cam, 0);
  const wash = (col, op) => V(cam, R(lv0.x0 - 300, lv0.y0 - 300, lv0.x1 - lv0.x0 + 600, lv0.y1 - lv0.y0 + 600, 0, { fill: col, opacity: op }), 0);
  if (sunset) light += wash('#FF6A5A', 0.08);
  else if (morn) light += wash('#FFB060', 0.05);
  return layersOf(V(cam, sky, 0) + V(cam, sun, 0.03) + V(cam, cl, 0.06) + V(cam, hills, 0.2) + V(cam, back, 0.55) + V(cam, fly, 0.7), V(cam, m, 1), V(cam, fg, 1.25), light);
}
const street = (t = 0, cam = {}, o = {}) => String(streetLayers(t, cam, o));
street.layers = streetLayers;

// ================================================================= 5. HOUSE EXTERIOR — establishing shots (SC03 the update night, mornings) (camera set)
// OUR HOUSE big at x 960 (base 780 on the lawn): coral siding, navy roof, YOUR round-top gable window upper right, the
// porch + mustard door (12), the living-room window, the chimney; the bakery van on the driveway (right), the mailbox, a
// young maple at the left with Max's tire swing, Max's dino sprinkler on the lawn; the sidewalk (stand 930) + road;
// neighbours left / right (k 1), back roofs + trees (k .5), hills (k .2), sky (k 0), moon / sun (k .03), clouds (k .06).
// opts: { time 'night'|'morning'|'day'|'evening' (default night), heroWindow 'off'|'lit'|'glow'|'update' (default night:
//   'glow' = the blue screen light), update 0..1 (the install: the window flashes white-cyan and pixels burst out of it into
//   the night), windows { mom, max, living, porch } overrides, van (default true), vanLights, porchLight (default on at
//   night / evening), birds (default true by day), smoke (default true), stars (default true at night) }
const EXH = { base: 780, walk: { y0: 880, y1: 960 }, stand: 930, road: 975, house: 960, s: 1, win: { x: 960 + 210, y: 780 - 565 } };
function houseExteriorLayers(t, cam = {}, o = {}) {
  cam = cam || {};
  const time = o.time || 'night', nite = time === 'night', eve = time === 'evening', morn = time === 'morning';
  const dark = nite || eve;
  const tn = tone(nite ? { night: 0.84 } : eve ? { eve: 0.65 } : morn ? { morn: 0.55 } : {});
  const C = tn.c, O = tn.ol, LN = tn.ln, FL = tn.fl;
  const upd = b01(o.update);
  const hero = o.heroWindow || (upd > 0 ? 'update' : nite ? 'glow' : eve ? 'lit' : 'off');
  const v0 = vis(cam, 0);
  let sky = R(v0.x0 - 200, v0.y0 - 200, v0.x1 - v0.x0 + 400, v0.y1 - v0.y0 + 400, 0, { fill: `url(#${nite ? 'shSkyNight' : eve ? 'shSkyEvening' : morn ? 'shSkyMorning' : 'shSkyDay'})` });
  if (nite && o.stars !== false) sky += R(v0.x0 - 200, v0.y0 - 200, v0.x1 - v0.x0 + 400, 760 - v0.y0, 0, { fill: 'url(#shStars)' });
  const sunP = nite ? [1580, 170] : eve ? [1640, 560] : morn ? [300, 420] : [1540, 150];
  const sun = nite ? glow(sunP[0], sunP[1], 170, 'shGlowMoon', 0.9) + CI(sunP[0], sunP[1], 46, { fill: '#FFF4C8', stroke: '#E8D490', 'stroke-width': 5 }) + CI(sunP[0] - 14, sunP[1] - 10, 9, { fill: '#F0E2A8' }) + CI(sunP[0] + 14, sunP[1] + 14, 6, { fill: '#F0E2A8' })
    : glow(sunP[0], sunP[1], 220, 'shGlowWarm', 0.9) + CI(sunP[0], sunP[1], 60, { fill: eve ? '#FFD08A' : '#FFE45C', stroke: '#FFB42E', 'stroke-width': 7 });
  const vc = vis(cam, 0.06);
  let cl = '';
  for (let i = Math.floor((vc.x0 - 500) / 760); i * 760 < vc.x1 + 500; i++) {
    const x = i * 760 + md(hash(i * 2.7) * 400 + t * (5 + 5 * hash(i)), 760), y = 100 + 170 * hash(i * 9.3), s = 0.5 + 0.4 * hash(i * 5.5);
    cl += shCloud(x, y, s, tn, nite ? '#34406E' : eve ? '#FFD6E6' : '#FFFFFF', nite ? '#26305A' : eve ? '#F2A0C0' : morn ? '#FFE2CC' : '#DCEBFA');
  }
  const vh = vis(cam, 0.2);
  let hills = '';
  {
    const pts = [];
    for (let x = Math.floor((vh.x0 - 400) / 160) * 160; x < vh.x1 + 400; x += 160) pts.push([x, 560 - 46 * Math.sin(x * 0.0024) - 30 * hash(Math.round(x / 160) * 1.7)]);
    let d = `M${pts[0][0]} 1400 L${pts[0][0]} ${f(pts[0][1])}`;
    for (let j = 1; j < pts.length; j++) d += ` Q${f((pts[j - 1][0] + pts[j][0]) / 2)} ${f(Math.min(pts[j - 1][1], pts[j][1]) - 26)} ${f(pts[j][0])} ${f(pts[j][1])}`;
    hills += P(d + ` L${pts[pts.length - 1][0]} 1400 Z`, FL(eve ? '#9A86B8' : '#A6D8A4'));
  }
  const vb = vis(cam, 0.5);
  let back = R(vb.x0 - 300, 640, vb.x1 - vb.x0 + 600, 900, 0, FL(eve ? '#7EA060' : '#86C874'));
  for (let i = Math.floor((vb.x0 - 500) / 600); i * 600 < vb.x1 + 500; i++) {
    const x = i * 600 + 120 * hash(i * 3.7), pal = NB_PAL[md(i * 3, NB_PAL.length)];
    const hz = (c) => mix(c, eve ? '#E8B0C8' : nite ? '#4A5A90' : '#CFE8FF', 0.4);
    back += R(x - 160, 520, 320, 140, 4, O(hz(pal[0]), 4)) + P(`M${x - 186} 528 L${x} 420 L${x + 186} 528 Z`, O(hz(pal[1]), 4)) + R(x - 104, 556, 52, 44, 4, O(dark && hash(i * 2.2) > 0.5 ? '!#FFD27A' : hz('#BFE2F6'), 3)) + R(x + 52, 556, 52, 44, 4, O(dark && hash(i * 4.4) > 0.7 ? '!#FFD27A' : hz('#BFE2F6'), 3));
    if (hash(i * 4.9) > 0.3) back += leafTree(x + 300, 700, 0.55, tn, { col: hz('#4FAE5A'), hi: hz('#86D477'), dark: hz('#3A8C48'), sway: Math.sin(t * 0.8 + i) * 1.1 });
  }
  let fly = '';
  if (o.birds === undefined ? !dark : o.birds) for (let i = 0; i < 4; i++) {
    const u = md(t * 0.03 + i * 0.09, 1), x = -400 + u * 3200 + i * 60 + (cam.x || 0) * 0.7, y = 220 + i * 26 + Math.sin(t * 1.3 + i) * 12;
    fly += shBird(x, y, 0.7, tn, { flap: md(t * 4.4 + i * 0.37, 1) });
  }
  // ---- the plane (k 1)
  const v1 = vis(cam, 1);
  const X0 = v1.x0 - 400, X1 = v1.x1 + 400;
  let m = R(X0, 640, X1 - X0, EXH.walk.y0 - 640, 0, FL('#6CC85E')) + R(X0, 640, X1 - X0, EXH.walk.y0 - 640, 0, { fill: 'url(#shLawn)' });
  for (const [hx_, i] of [[-180, 2], [2120, 0], [-1080, 4], [3000, 3]]) if (hx_ + 400 > X0 && hx_ - 400 < X1) m += nbHouse(hx_, EXH.base - 40, i, tn, { lit: dark, night: nite });
  const W = { ...(o.windows || {}) };
  if (W.porch === undefined) W.porch = dark;
  if (W.mom === undefined) W.mom = eve;
  if (W.living === undefined) W.living = eve;
  // driveway + path + the house + van + mailbox + the maple with the tire swing + the dino sprinkler
  m += P(dP([[1390, EXH.base], [1640, EXH.base], [1720, EXH.walk.y0], [1340, EXH.walk.y0]]), O('#D6D2CA', 4));
  m += P(dE(840, 806, 52, 11) + dE(834, 840, 58, 12) + dE(828, 868, 62, 10), O('#E8E2D4', 3.5));
  m += familyHouse(EXH.house, EXH.base, EXH.s, tn, { t, night: nite, dark, hero, update: upd, win: W, smoke: o.smoke });
  if (o.van !== false) m += bakeryVan(1530, EXH.walk.y0 - 6, 0.78, tn, { lights: !!o.vanLights, night: nite });
  m += G(R(-7, -150, 14, 150, 3, O('#8A5634', 4)) + R(-40, -200, 80, 56, 14, O('#F08A6E', 4.5)) + R(36, -212, 7, 40, 2, O('#E2434B', 2.5)) + R(36, -212, 22, 14, 2, O('#E2434B', 2.5)) + TF('12', 0, -164, 17, C('#FFFFFF')), `translate(700 ${EXH.walk.y0 - 4})`);
  m += leafTree(300, EXH.base + 60, 0.95, tn, { col: '#5DB55A', sway: Math.sin(t * 0.7) * 1.2 });
  const ts = Math.sin(t * 1.1) * 4;
  m += G(P('M0 0 V170', LN(4)) + E(0, 194, 32, 26, O('#2A2D38', 5)) + E(0, 194, 15, 11, FL('#6CC85E')), `translate(${300 - 70} ${EXH.base - 300}) rotate(${f(ts)})`);
  m += G(P('M-40 0 L-36 -46 Q-30 -76 4 -74 Q24 -72 28 -54 L52 -54 L50 -38 L28 -38 L26 0 Z', O('#5DB55A', 4)) + CI(6, -62, 3.5, FL(LINE)) + P('M-20 -76 l6 -12 l6 10 l6 -12 l6 10', O('#3E8A4A', 3)), `translate(520 ${EXH.base + 70})`);
  // hedge, sidewalk, road
  {
    let hd = '';
    for (let x = Math.floor(X0 / 60) * 60; x < X1; x += 60) { if ((x > 770 && x < 900) || (x > 1300 && x < 1760)) continue; hd += dC(x + 30, EXH.walk.y0 - 26, 30) + dR(x, EXH.walk.y0 - 26, 60, 26); }
    m += blob(hd, C('#4FA85A'), 4, tn.line);
    m += R(X0, EXH.walk.y0, X1 - X0, EXH.walk.y1 - EXH.walk.y0, 0, FL('#EAE3D6')) + R(X0, EXH.walk.y1, X1 - X0, EXH.road - EXH.walk.y1, 0, FL('#C2BBAE')) + R(X0, EXH.road, X1 - X0, 1500 - EXH.road, 0, FL(dark ? '#4E5070' : '#7C8096')) + R(X0, EXH.road, X1 - X0, 1500 - EXH.road, 0, { fill: 'url(#shRoad)' });
    let jn = '';
    for (let x = Math.floor(X0 / 150) * 150; x < X1; x += 150) jn += `M${x} ${EXH.walk.y0} L${x - 20} ${EXH.walk.y1} `;
    m += P(jn, LN(3, '#CFC6B6')) + P(`M${X0} ${EXH.walk.y0} H${X1} M${X0} ${EXH.walk.y1} H${X1} M${X0} ${EXH.road} H${X1}`, LN(4, LINE, 0.55)) + P(`M${X0} 1120 H${X1}`, { fill: 'none', stroke: C('#FFE6A0'), 'stroke-width': 9, 'stroke-dasharray': '70 60' });
  }
  let lamps = '', lampGlow = '';
  for (let i = Math.floor((X0 - 100) / 1800) - 1; 100 + i * 1800 < X1 + 200; i++) { const lx = 100 + i * 1800; if (lx < X0 - 100) continue; lamps += streetLamp(lx, EXH.walk.y0 + 10, tn, dark); if (dark) lampGlow += glow(lx + 44, EXH.walk.y0 - 380, 200, 'shGlowWarm', 0.8) + P(dP([[lx + 30, EXH.walk.y0 - 402], [lx + 58, EXH.walk.y0 - 402], [lx + 160, EXH.walk.y1], [lx - 70, EXH.walk.y1]]), { fill: 'url(#shBeam)', opacity: 0.28 }); }
  m += lamps;
  // ---- light
  let light = '';
  const lv0 = vis(cam, 0);
  const wash = (col, op) => V(cam, R(lv0.x0 - 300, lv0.y0 - 300, lv0.x1 - lv0.x0 + 600, lv0.y1 - lv0.y0 + 600, 0, { fill: col, opacity: op }), 0);
  if (dark) light += V(cam, lampGlow, 1);
  const hw = EXH.win;
  if (dark && (W.porch)) light += V(cam, glow(EXH.house - 122, EXH.base - 126, 110, 'shGlowWarm', 0.8), 1);
  if (hero === 'glow') light += V(cam, glow(hw.x, hw.y, 200, 'shGlowBlue', 0.75) + glow(hw.x, hw.y, 90, 'shGlowCyan', 0.4), 1);
  else if (hero === 'lit') light += V(cam, glow(hw.x, hw.y, 170, 'shGlowWarm', 0.7), 1);
  else if (hero === 'update') {
    const fl = sm(0.02, 0.15, upd) * (1 - sm(0.4, 0.9, upd));
    light += V(cam, glow(hw.x, hw.y, 240 + 260 * fl, 'shGlowCyan', 0.6 + 0.4 * fl) + pixelBurst(hw.x, hw.y, sm(0.05, 1, upd), { n: 40, seed: 11, spread: 900 }), 1);
    if (fl > 0.01) light += wash('#DFFFFF', 0.22 * fl);
  }
  if (nite) light += wash('#060A26', 0.12);
  else if (morn) light += wash('#FFB060', 0.06);
  else if (eve) light += wash('#FF6A9A', 0.06);
  return layersOf(V(cam, sky, 0) + V(cam, sun, 0.03) + V(cam, cl, 0.06) + V(cam, hills, 0.2) + V(cam, back, 0.5) + V(cam, fly, 0.7), V(cam, m, 1), '', light);
}
const houseExterior = (t = 0, cam = {}, o = {}) => String(houseExteriorLayers(t, cam, o));
houseExterior.layers = houseExteriorLayers;

// ================================================================= floor lines + anchors
// Room sets: anchors in world px (= screen px at cam rest). Camera sets: anchors carry k (draw with K.view(cam, svg, a.k)).
const FLOOR = { bedroom: 990, kitchen: 990, livingRoom: 1000, street: STR.stand, houseExterior: EXH.stand };
const FROG = { legL: 90, legR: 90, kneeL: 90, kneeR: 90 };
const SPOTS = {};
SPOTS.bedroom = {
  ceiling: BD.ceil, wallBase: BD.base, stand: { y: 990, s: 0.5 },
  bed: {
    x0: BD.bed.x0, x1: BD.bed.x1, top: BD.bed.top, floor: BD.bed.floor, pillow: { x: BD.bed.x0 + 184, y: BD.bed.top - 36 },
    lie: { x: 495, y: 892, s: 0.5, rot: -90 },                         // YOU asleep on your back, head on the pillow; draw before front (tuck .9)
    sitUp: { x: 380, hip: 690, s: 0.5 },                               // waking up, sitting up under the duvet: H.seatPose(sitUp); draw before front (tuck .7)
    edge: { x: 760, hip: 714, s: 0.5, pose: FROG },                    // sitting on the bed edge, feet on the floor: draw AFTER front
  },
  chair: { x: BD.chair.x, hip: BD.chair.seat + 2, s: 0.5, view: 'back', pose: { legL: -60, legR: -60, kneeL: 60, kneeR: 60 } }, // chair 'back': YOU facing the monitor
  chairFront: { x: BD.chair.x, hip: BD.chair.seat + 2, s: 0.5, pose: FROG },   // chair 'front': YOU facing camera
  head: { x: BD.chair.x, y: 560 },                                     // YOUR head in the chair (screen-light glow target)
  monitor: { screen: { ...BD.mon } }, desk: { x0: BD.desk.x0, x1: BD.desk.x1, top: BD.desk.top },
  alarm: { x: BD.stand.x1 - 46, y: BD.stand.top - 39, s: 0.72 },     // the alarm clock's face centre (H.alarmClock at {x, 604} s .72)
  sock: { x: BD.sock.x, y: BD.sock.y, s: 0.75 },
  tips: { bed: { x: 640, y: 600 }, sock: { x: BD.sock.x, y: BD.sock.y - 50 }, alarm: { x: BD.stand.x1 - 46, y: 470 }, pc: { x: BD.mon.cx, y: 200 }, poster: { x: BD.poster.x, y: 120 }, chair: { x: BD.chair.x, y: 520 }, rug: { x: BD.rug.x, y: 900 } },
  mirror: { x0: BD.mirror.x0, x1: BD.mirror.x1, y0: BD.mirror.y0, y1: BD.mirror.y1, glass: { cx: (BD.mirror.x0 + BD.mirror.x1) / 2, cy: (BD.mirror.y0 + BD.mirror.y1) / 2, w: BD.mirror.x1 - BD.mirror.x0 - 24, h: BD.mirror.y1 - BD.mirror.y0 - 24 }, stand: { x: 1755, y: 990, s: 0.5 } },
  window: { ...BD.win }, door: { x0: BD.door.x0, x1: BD.door.x1, top: BD.door.top, exit: { x: 2050, y: 990, s: 0.5 } }, rug: { ...BD.rug },
};
SPOTS.kitchen = {
  ceiling: KT.ceil, wallBase: KT.base, window: { ...KT.win },
  seats: KSEAT,                                                        // H.seatPose(SPOTS.kitchen.seats.max, size) — draw before front
  table: { ...KT.table },
  counterStand: { x: 420, y: 800, s: 0.46 }, sinkStand: { x: 375, y: 790, s: 0.46 }, stoveStand: { x: -105, y: 800, s: 0.46 },
  toaster: { x: 640, y: KT.counter.top, s: 0.88, slot: { x: 640, y: 460 }, tip: { x: 640, y: 380 }, toastTop: { x: 640, y: 140 } },
  coffee: { x: 108, y: KT.counter.top, carafe: { x: 108, y: 510 }, tip: { x: 108, y: 330 } },
  pan: { x: KT.stove.x0 + 90, y: KT.counter.top - 22 },
  fridge: { x0: KT.fridge.x0, x1: KT.fridge.x1, top: KT.fridge.top, drawings: { x: 1800, y: 400 }, calendar: { x: 1866, y: 212 } },
  tower: { x: KT.tower.x, y: 760, top: 250, tip: { x: KT.tower.x, y: 220 } },
  maxBowl: { x: KSEAT.max.x + 4, y: KT.table.top - 4 }, youBowl: { x: KSEAT.you.x - 10, y: KT.table.top - 8 }, momPlate: { x: KT.table.x0 + 190, y: KT.table.top - 4 }, momCups: { x: KT.table.x0 + 96, y: KT.table.top - 2 },
  outside: { x: 380, y: 560, s: 0.32, k: 0.8, x0: 210, x1: 540 },     // someone passing by OUTSIDE the window: draw between bg and mid with view(cam, svg, .8)
  lamp: { ...KT.lamp }, clock: { ...KT.clock }, door: { x0: KT.door.x0, x1: KT.door.x1, top: KT.door.top, enter: { x: 2120, y: 990, s: 0.5 } },
  front: { y: 990, s: 0.5 },
};
SPOTS.livingRoom = {
  ceiling: LR.ceil, wallBase: LR.base, window: { ...LR.win },
  seats: LSEAT,                                                        // couchL / couchM / couchR / armchair (Grandpa) — draw before front
  fort: { x: 860, y: 930, s: 0.5, x0: 485, x1: 1235, top: 80 },      // X.pillowFort({ ...SPOTS.livingRoom.fort, k, t }) after front
  dogBed: { x: LR.bed.x, y: LR.bed.y, s: 0.5, dog: { x: LR.bed.x - 10, y: LR.bed.y - 30, s: 0.5 } },   // Biscuit on the cushion (after front)
  rug: { ...LR.rug }, rugSit: { x: 560, y: 940, s: 0.5 }, front: { y: 1000, s: 0.5 },
  tv: { ...LR.tv }, photo79: { ...LR.photo }, trophy: { x: LR.shelf.x0 + 70, y: LR.shelf.y - 100 }, shelf: { ...LR.shelf },
  lamp: { ...LR.lamp }, door: { x0: LR.door.x0, x1: LR.door.x1, top: LR.door.top, enter: { x: 2110, y: 1000, s: 0.5 } },
  heads: { armchair: { x: 1560, y: 520 }, couchL: { x: 640, y: 520 }, couchM: { x: 870, y: 520 }, couchR: { x: 1100, y: 520 } },
};
SPOTS.street = {
  s: 0.4, k: 1, stand: STR.stand, walk: { ...STR.walk }, base: STR.base,
  wells: { x: STR.wells, y: STR.stand, s: 0.4, k: 1 },                 // Mrs. Wells in her gate opening
  gate: { x: (STR.gate.x0 + STR.gate.x1) / 2, y: STR.stand, k: 1, x0: STR.gate.x0, x1: STR.gate.x1 },
  bags: { x: STR.gate.x1 + 118, y: STR.stand + 10, k: 1, s: 0.82 },   // the three bags on the sidewalk (H.groceryBag(x, y, .82, tn, {kind}))
  wellsDoor: { x: STR.wells, y: STR.base, k: 1, s: 0.3 },
  ball: { x: STR.oak + 69, y: 868 - 351, k: 1, s: 1.05 },             // the ball stuck in the oak (H.ball(x, y, s) to draw it in a hand)
  oak: { x: STR.oak, y: STR.stand, k: 1, trunk: { x: STR.oak, y: 868 }, crownTop: 280 },
  home: { x: STR.home, y: STR.stand, k: 1, door: { x: STR.home - 156, y: STR.base - 19, s: 0.3 }, mailbox: { x: STR.home - 230, y: STR.walk.y0 }, van: { x: STR.home + 440, y: 862 } },
  shop: { x: STR.shop, y: STR.stand, k: 1, door: { x: STR.shop, y: STR.walk.y0, s: 0.4 } },
  side: { ...STR.side, y: STR.stand }, lamps: { x0: 240, every: 1600 },
  cams: { wells: { x: 0 }, oak: { x: 520 }, home: { x: -1300 }, shop: { x: 2800 }, wide: { zoom: 0.6, x: 300 } },
};
SPOTS.houseExterior = {
  s: 0.22, k: 1, stand: EXH.stand, walk: { ...EXH.walk },
  house: { x: EXH.house, base: EXH.base, roofTop: { x: EXH.house + 210, y: EXH.base - 744 } },
  heroWindow: { x: EXH.win.x, y: EXH.win.y, k: 1 },
  windows: { mom: { x: EXH.house - 260, y: EXH.base - 360 }, max: { x: EXH.house - 80, y: EXH.base - 360 }, living: { x: EXH.house + 180, y: EXH.base - 131 }, hero: { x: EXH.win.x, y: EXH.win.y } },
  door: { x: EXH.house - 216, y: EXH.base - 26 }, porch: { x: EXH.house - 250, y: EXH.base - 26, s: 0.19 },
  lawn: { y0: EXH.base, y1: EXH.walk.y0 - 20, s: 0.2 }, van: { x: 1530, y: EXH.walk.y0 - 6 }, mailbox: { x: 700, y: EXH.walk.y0 - 4 },
  cams: { establish: { zoom: 1 }, wide: { zoom: 0.6 }, window: { zoom: 2.4, x: 210, y: -325 } },
};
const DEFS = '<defs>' + DEF.join('') + '</defs>';
module.exports = {
  DEFS, FLOOR, SPOTS,
  bedroom, kitchen, livingRoom, street, houseExterior,
  dragonTitle, mug, bowl, cupcake, cupcakeBox, toaster, toast, alarmClock, sock, groceryBag, ball, photoFrame, trophy79, dogBed, plant,
  leafTree, shCloud, shBird, wallClock, familyHouse, nbHouse, wellsCottage, cornerShop, bakeryVan, streetLamp, pixelBurst,
  toScreen, camTf, vis, mix, tone, frameIn, glow, pool, darkRing, seatPose, makeSet, layersOf,
};
