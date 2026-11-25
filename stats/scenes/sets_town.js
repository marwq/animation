// SCHOOL background sets for "What If You Could See Everyone's STATS in Real Life?" — OAKHILL MIDDLE SCHOOL (the Owls).
//
// Look: a red-brick two-storey school with a white columned entrance, a cupola with an owl weather vane and a letter-board
// marquee out front. Inside: cream walls over violet + sage locker banks, a checker floor of lilac tiles, purple + gold
// school colours, the OWL face as the logo. Mrs. Krump's Room 12 is dusty blue with a green CHALKBOARD and oak desks; the gym
// is pale-lilac block with purple wall mats and a hanging scoreboard; the cafeteria is sage with a letter-board menu.
//
// Every set is drawn in WORLD SPACE for the full 1920x1080 frame (camera at rest = the frame) and is padded far past the
// frame edges (pans of ±600 px and zoom-outs to ~.5 never show a gap). `t` (absolute seconds) only drives idle motion
// (clouds, flag, hamster wheel, steam, crowd bob, bus exhaust): pass a constant t to freeze it.
//
// ROOM sets — set(t, o) returns everything composited at k 1; set.layers(t, o) -> { bg, mid, front, fg, light, frontRows }:
//   bg     what is seen through the windows                          draw with view(cam, bg, 0.6)
//   mid    the room: walls, floor, back furniture (+ cheap crowd)       draw with view(cam, mid, 1)
//   frontRows[i]  furniture fronts back -> front (desk/table fronts, counters); characters of a row go just BEFORE it
//   front  all frontRows joined
//   fg     occluders close to the camera ('' in most sets)           view(cam, fg, 1)
//   light  beams / glows / tints in world space                      view(cam, light, 1)
//   set.compose(t, o, between, after, cam): the whole set with characters slotted in (between = svg | [svg per row]).
// CAMERA sets — hallway(t, cam, o) and schoolExterior(t, cam, o) take the camera (parallax); set.layers(t, cam, o)
//   returns the layers ALREADY transformed; set.compose(t, cam, o, back, after) slots world-space characters in.
// FLOOR[set] = feet y of the main stand line (s .5 there); SPOTS[set] = anchors (world coords of the k 1 layer) with
// recommended scales; SPOTS[set].cams = framings for K.camKeys / K.view. DEFS ids are prefixed `st`.
// Reference: docs/SETS_TOWN.md · contact sheet: node tools/sheet_town.js -> concept/sets_town.png
//
// Index:
//   hallway(t, cam, o)     side view (default): lockers, ROOM 10 / ROOM 12 (Mrs. Krump) / BOYS doors, trophy case, courtyard
//                          windows, posters, crowd lines. view 'deep': one-point perspective down the hall (Tank's walk).
//                          o: view, doorOpen 0..1 (Room 12), restroomOpen 0..1, crowd 0..1, scatter 0..1, pillars, banner
//   mirror(t, o)           the boys' room mirror: view 'over' (over the shoulder, reflection clipped by #stMirrorClip) | 'face'
//   classroom(t, o)        Room 12: chalkboard (board: [lines]), Mrs. Krump's desk, 3 rows of paired tables, the smart kids'
//                          table, windows + hamster. o: board, quiz, clock, outside (svg seen through the windows)
//   gym(t, o)              dodgeball (team lines, lineup, bleachers + crowd, scoreboard) | fair: true -> SCIENCE FAIR
//                          (tri-fold tables, the potato battery, the smart kids' table, parents walking)
//   cafeteria(t, o)        long tables, the lunch line + lunch lady, pizza / broccoli / mystery meat, Tank's path; quiet 0..1
//   schoolExterior(t, cam, o)  the front of the school in the morning (bus, marquee, flag, walkway, kids walking in)
//   people(list, o)        cheap R6 background people (kids / adults), colour-bucketed paths
//   props: owl, poster, wallClock, lockerBank, hallDoor, trophyCase, chalkboard, triFold, potatoBattery, foamBall, tray,
//          schoolBus, marquee, tree, cloud, bush
//   helpers: camTf, layer, toScreen, camAt, viewRect, makeSet, mix
'use strict';

const S = require('../rig/svg');
const { f, clamp, lerp } = S;

const LINE = '#151515';
const ol = (fill, w = 6, extra = {}) => ({ fill, stroke: LINE, 'stroke-width': w, 'stroke-linejoin': 'round', 'stroke-linecap': 'round', ...extra });
const ln = (w, c = LINE, op) => ({ fill: 'none', stroke: c, 'stroke-width': w, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', ...(op !== undefined ? { opacity: op } : {}) });
const R = (x, y, w, h, r = 0, a = {}) => S.rect(x, y, w, h, r, a);
const P = (d, a = {}) => S.path(d, a);
const E = (cx, cy, rx, ry, a = {}) => S.ellipse(cx, cy, rx, ry, a);
const CI = (cx, cy, r, a = {}) => S.circle(cx, cy, r, a);
const G = (inner, tf, extra) => (inner ? S.g(inner, tf, extra) : '');
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const T = (s, x, y, size, fill, extra = {}) => S.el('text', { x, y, 'font-family': 'Lilita One, sans-serif', 'font-size': size, fill, 'text-anchor': 'middle', ...extra }, esc(s));
const TF = (s, x, y, size, fill, extra = {}) => S.el('text', { x, y, 'font-family': 'Fredoka, sans-serif', 'font-weight': 700, 'font-size': size, fill, 'text-anchor': 'middle', ...extra }, esc(s));
const OUTL = (w = 8, c = LINE) => ({ stroke: c, 'stroke-width': w, 'paint-order': 'stroke', 'stroke-linejoin': 'round' });
const hash = (n) => { const v = Math.sin(n * 127.1 + 311.7) * 43758.5453; return v - Math.floor(v); };
const tr = (x, y, s = 1, r = 0) => `translate(${f(x)} ${f(y)})${r ? ` rotate(${f(r)})` : ''}${s !== 1 ? ` scale(${f(s)})` : ''}`;
const bool01 = (v, d = 0) => (v === true ? 1 : v === false || v === undefined || v === null ? d : clamp(+v, 0, 1));
const md = (a, n) => ((a % n) + n) % n;
// compact path builders (1-decimal coordinates)
const g1 = (n) => Math.round(n * 10) / 10;
const pt = (x, y) => `${g1(x)} ${g1(y)}`;
const quadD = (a, b, c, d) => `M${pt(a[0], a[1])} L${pt(b[0], b[1])} L${pt(c[0], c[1])} L${pt(d[0], d[1])} Z`;
const polyD = (a) => 'M' + a.map(([x, y]) => pt(x, y)).join(' L') + ' Z';
const rrD = (x, y, w, h, r) => { r = Math.max(0, Math.min(r, w / 2, h / 2)); const a = g1(x), b = g1(y), c = g1(x + w), d = g1(y + h), q = g1(r); return `M${g1(a + q)} ${b}H${g1(c - q)}Q${c} ${b} ${c} ${g1(b + q)}V${g1(d - q)}Q${c} ${d} ${g1(c - q)} ${d}H${g1(a + q)}Q${a} ${d} ${a} ${g1(d - q)}V${g1(b + q)}Q${a} ${b} ${g1(a + q)} ${b}Z`; };
const elD = (cx, cy, rx, ry) => `M${g1(cx - rx)} ${g1(cy)}a${g1(rx)} ${g1(ry)} 0 1 0 ${g1(2 * rx)} 0a${g1(rx)} ${g1(ry)} 0 1 0 ${g1(-2 * rx)} 0Z`;
const circD = (cx, cy, r) => elD(cx, cy, r, r);

// padded bounds for ROOM sets
const XL = -1700, XR = 4300, YT = -1000, YB = 2100;
const cover = (fill, extra = {}) => R(XL, YT, XR - XL, YB - YT, 0, { fill, ...extra });
const band = (y0, y1, fill, extra = {}) => R(XL, y0, XR - XL, y1 - y0, 0, { fill, ...extra });

// ---------------------------------------------------------------- colour helpers
const hx = (c) => [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)];
const toHex = (a) => '#' + a.map((v) => Math.round(clamp(v, 0, 255)).toString(16).padStart(2, '0')).join('').toUpperCase();
function mix(a, b, k) {
  if (k <= 0 || !a || a[0] !== '#' || a.length !== 7) return a;
  if (k >= 1) return b;
  const A = hx(a), B = hx(b);
  return toHex(A.map((v, i) => lerp(v, B[i], k)));
}

// ---------------------------------------------------------------- school palette
const PUR = '#6B4FD8', PUR_D = '#4A35A8', PUR_L = '#A996F2', GOLD = '#FFC233', GOLD_D = '#E09A10', CREAM = '#FFF3DE';
const LOCK = {
  v: { col: '#8A70EA', dark: '#5B44B8', hi: '#C2B4FA', cap: '#6A52CC' },
  s: { col: '#86C9A0', dark: '#4E9470', hi: '#C6EED6', cap: '#5FA882' },
};

// ---------------------------------------------------------------- static defs
const DEF = [];
const def = (s) => { DEF.push(s); };
const stops = (a) => a.map(([o, c, op]) => `<stop offset="${o}" stop-color="${c}"${op !== undefined ? ` stop-opacity="${op}"` : ''}/>`).join('');
const lg = (id, st, x2 = 0, y2 = 1) => `<linearGradient id="${id}" x1="0" y1="0" x2="${x2}" y2="${y2}">${stops(st)}</linearGradient>`;
const lgU = (id, y1, y2, st) => `<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="0" y1="${y1}" x2="0" y2="${y2}">${stops(st)}</linearGradient>`;
// skies in user space: colours run from y -900 (top) to y 640 (horizon) and pad beyond
def(lgU('stSkyMorning', -900, 640, [[0, '#4F8FE6'], [0.45, '#8DC2F4'], [0.78, '#FFD6B8'], [1, '#FFE7BE']]));
def(lgU('stSkyDay', -900, 640, [[0, '#3C8CEB'], [0.5, '#78BAF6'], [1, '#CFEAFF']]));
def(lg('stWinSky', [[0, '#7FC0FA'], [0.62, '#B8E0FF'], [1, '#E2F4FF']]));
def(lg('stBeam', [[0, '#FFF3CF', 0.55], [1, '#FFF3CF', 0]]));
def(lg('stBeamW', [[0, '#FFFFFF', 0.5], [1, '#FFFFFF', 0]]));
def(lg('stSheen', [[0, '#FFFFFF', 0.45], [0.45, '#FFFFFF', 0.06], [1, '#FFFFFF', 0.22]], 1, 1));
def(lg('stSteel', [[0, '#F3F5F9'], [0.5, '#CDD3DE'], [1, '#A8B1C2']]));
def(lg('stDeepLight', [[0, '#FFF6D8', 0.55], [1, '#FFF6D8', 0]]));
def(lg('stChalk', [[0, '#35664F'], [1, '#2A5442']]));
// lockers: double-stacked, 92 x 330 tile (origin = bank top-left)
for (const [k, C] of Object.entries(LOCK)) {
  const id = k === 'v' ? 'stLockV' : 'stLockS';
  def(`<pattern id="${id}" width="92" height="330" patternUnits="userSpaceOnUse"><rect width="92" height="330" fill="${C.dark}"/>` +
    `<rect x="3" y="3" width="86" height="158" rx="5" fill="${C.col}"/><rect x="3" y="166" width="86" height="152" rx="5" fill="${C.col}"/>` +
    `<rect x="8" y="9" width="7" height="146" rx="3" fill="${C.hi}" opacity="0.55"/><rect x="8" y="172" width="7" height="140" rx="3" fill="${C.hi}" opacity="0.55"/>` +
    `<path d="M30 20 H62 M30 30 H62 M30 40 H62 M30 183 H62 M30 193 H62 M30 203 H62" stroke="${C.dark}" stroke-width="5" stroke-linecap="round"/>` +
    `<rect x="33" y="56" width="26" height="13" rx="3" fill="#FFF1C2" stroke="#151515" stroke-width="2"/><rect x="33" y="219" width="26" height="13" rx="3" fill="#FFF1C2" stroke="#151515" stroke-width="2"/>` +
    `<rect x="70" y="112" width="9" height="30" rx="4" fill="#EEEAF6" stroke="#151515" stroke-width="2.5"/><rect x="70" y="272" width="9" height="30" rx="4" fill="#EEEAF6" stroke="#151515" stroke-width="2.5"/>` +
    `<rect x="89.5" y="0" width="2.5" height="330" fill="#151515" opacity="0.7"/></pattern>`);
}
def('<pattern id="stCeil" width="180" height="60" patternUnits="userSpaceOnUse"><rect width="180" height="60" fill="#F2EEE7"/><path d="M0 0.5 H180 M0.5 0 V60" stroke="#D9D2C6" stroke-width="3"/><circle cx="40" cy="20" r="2" fill="#DCD5C9"/><circle cx="120" cy="42" r="2" fill="#DCD5C9"/><circle cx="90" cy="12" r="1.6" fill="#DCD5C9"/></pattern>');
def('<pattern id="stCork" width="70" height="70" patternUnits="userSpaceOnUse"><rect width="70" height="70" fill="#D9A566"/><circle cx="12" cy="14" r="2.4" fill="#BE874A"/><circle cx="44" cy="34" r="2" fill="#EDC08A"/><circle cx="26" cy="56" r="2.6" fill="#BE874A"/><circle cx="60" cy="10" r="1.8" fill="#BE874A"/><circle cx="58" cy="60" r="2" fill="#EDC08A"/></pattern>');
def('<pattern id="stBlinds" width="40" height="18" patternUnits="userSpaceOnUse"><rect width="40" height="18" fill="#F6F2EA"/><rect y="13" width="40" height="5" fill="#D7D0C2"/></pattern>');
def('<pattern id="stCinder" width="140" height="64" patternUnits="userSpaceOnUse"><rect width="140" height="64" fill="#D3CBEA"/><rect x="3" y="3" width="134" height="26" rx="4" fill="#E3DDF4"/><rect x="-67" y="35" width="134" height="26" rx="4" fill="#E3DDF4"/><rect x="73" y="35" width="134" height="26" rx="4" fill="#E3DDF4"/></pattern>');
def('<pattern id="stMaple" width="420" height="40" patternUnits="userSpaceOnUse"><rect width="420" height="40" fill="#F3C47F"/><rect y="20" width="420" height="20" fill="#EDBA72"/><path d="M0 0.5 H420 M0 20 H420 M160 0 V20 M340 20 V40 M60 20 V40" stroke="#D69C52" stroke-width="2"/><path d="M20 10 H120 M220 30 H300" stroke="#F8D49E" stroke-width="3" stroke-linecap="round"/></pattern>');
def('<pattern id="stMat" width="150" height="180" patternUnits="userSpaceOnUse"><rect width="150" height="180" fill="#7357DD"/><rect x="5" y="4" width="140" height="172" rx="10" fill="#8165E6"/><rect x="12" y="10" width="10" height="160" rx="5" fill="#A48EF2" opacity="0.7"/><rect x="146" width="4" height="180" fill="#3E2C8E"/></pattern>');
def('<pattern id="stBrick" width="72" height="36" patternUnits="userSpaceOnUse"><rect width="72" height="36" fill="#E9D3BE"/><rect x="2" y="2" width="32" height="14" rx="2" fill="#C8735A"/><rect x="38" y="2" width="32" height="14" rx="2" fill="#BF6A52"/><rect x="-16" y="20" width="32" height="14" rx="2" fill="#C26E56"/><rect x="20" y="20" width="32" height="14" rx="2" fill="#CC7A60"/><rect x="56" y="20" width="32" height="14" rx="2" fill="#C26E56"/></pattern>');
def('<pattern id="stBathTile" width="76" height="76" patternUnits="userSpaceOnUse"><rect width="76" height="76" fill="#9CC9AC"/><rect x="3" y="3" width="70" height="70" rx="6" fill="#BFE2CB"/><rect x="9" y="8" width="26" height="7" rx="3" fill="#FFFFFF" opacity="0.45"/></pattern>');
def('<pattern id="stCafTile" width="64" height="64" patternUnits="userSpaceOnUse"><rect width="64" height="64" fill="#D8D2C2"/><rect x="2.5" y="2.5" width="59" height="59" rx="5" fill="#FBF8F0"/></pattern>');
def('<pattern id="stCafFloor" width="180" height="90" patternUnits="userSpaceOnUse"><rect width="180" height="90" fill="#F3ECDB"/><rect width="90" height="45" fill="#CFE2C2"/><rect x="90" y="45" width="90" height="45" fill="#CFE2C2"/><path d="M0 0.5 H180 M0 45 H180 M0.5 0 V90 M90 0 V90" stroke="#DCD3BE" stroke-width="2"/></pattern>');
def('<pattern id="stClassFloor" width="160" height="80" patternUnits="userSpaceOnUse"><rect width="160" height="80" fill="#EEE2CB"/><rect x="80" width="80" height="40" fill="#E2D0EE"/><path d="M0 0.5 H160 M0 40 H160 M0.5 0 V80 M80 0 V80" stroke="#D6C6A8" stroke-width="2"/><circle cx="30" cy="24" r="2" fill="#D9C9AC"/><circle cx="110" cy="62" r="2" fill="#D9C9AC"/></pattern>');
def('<pattern id="stChevron" width="80" height="40" patternUnits="userSpaceOnUse"><rect width="80" height="40" fill="#FFD35C"/><path d="M0 30 L20 10 L40 30 L60 10 L80 30" fill="none" stroke="#8F78EC" stroke-width="7" stroke-linejoin="miter"/></pattern>');
def('<pattern id="stGrille" width="36" height="36" patternUnits="userSpaceOnUse"><path d="M0 0 L36 36 M36 0 L0 36" stroke="#5E557E" stroke-width="2.5" opacity="0.55"/></pattern>');
def('<pattern id="stWinPane" width="96" height="120" patternUnits="userSpaceOnUse"><rect width="96" height="120" fill="#E8D8C6"/><rect x="14" y="14" width="68" height="92" rx="3" fill="#FFFFFF"/><rect x="20" y="20" width="56" height="80" rx="2" fill="#9ED0F2"/><path d="M48 20 V100 M20 58 H76" stroke="#FFFFFF" stroke-width="5"/><path d="M24 92 L46 24 L56 24 L34 92 Z" fill="#FFFFFF" opacity="0.4"/></pattern>');
def('<clipPath id="stMirrorClip"><rect x="300" y="110" width="1320" height="510" rx="10"/></clipPath>');

// ---------------------------------------------------------------- camera helpers (same math as K.E.camTf)
function camTf(cam = {}, k = 1) {
  const z = 1 + ((cam.zoom ?? 1) - 1) * k;
  const fx = cam.fx ?? 960, fy = cam.fy ?? 540;
  const x = (cam.x || 0) * k, y = (cam.y || 0) * k;
  return `translate(${f(fx + (cam.sx || 0))} ${f(fy + (cam.sy || 0))}) scale(${f(z)}) translate(${f(-fx - x)} ${f(-fy - y)})`;
}
const layer = (svg, cam, k) => (svg ? G(svg, camTf(cam, k)) : '');
// world point (layer k) -> screen [x, y, zoom]
function toScreen(cam = {}, x, y, k = 1) {
  const z = 1 + ((cam.zoom ?? 1) - 1) * k;
  const fx = cam.fx ?? 960, fy = cam.fy ?? 540;
  return [fx + (cam.sx || 0) + (x - fx - (cam.x || 0) * k) * z, fy + (cam.sy || 0) + (y - fy - (cam.y || 0) * k) * z, z];
}
// cam that puts world point (x, y) at screen (sx, sy) with zoom z
const camAt = (x, y, z = 1, sx = 960, sy = 540) => ({ x: Math.round(x - 960 - (sx - 960) / z), y: Math.round(y - 540 - (sy - 540) / z), zoom: z });
// world rect [x0, x1, y0, y1] visible through cam at layer k (+ pad)
function viewRect(cam = {}, k = 1, pad = 0) {
  const z = 1 + ((cam.zoom ?? 1) - 1) * k;
  const fx = cam.fx ?? 960, fy = cam.fy ?? 540, sx = cam.sx || 0, sy = cam.sy || 0;
  const ox = fx + (cam.x || 0) * k, oy = fy + (cam.y || 0) * k;
  return [ox + (-fx - sx) / z - pad, ox + (1920 - fx - sx) / z + pad, oy + (-fy - sy) / z - pad, oy + (1080 - fy - sy) / z + pad];
}

function makeSet(layersFn) {
  const fn = (t = 0, opts = {}) => { const L = layersFn(t, opts); return (L.bg || '') + (L.mid || '') + (L.front || '') + (L.fg || '') + (L.light || ''); };
  fn.layers = layersFn;
  fn.compose = (t = 0, opts = {}, between = '', after = '', cam = null) => {
    const L = layersFn(t, opts);
    const rows = L.frontRows || [L.front || ''];
    const B = Array.isArray(between) ? between : [between];
    const w = (L.mid || '') + rows.map((r, i) => (B[i] || '') + r).join('') + B.slice(rows.length).join('') + (after || '') + (L.fg || '') + (L.light || '');
    return cam ? layer(L.bg || '', cam, 0.6) + layer(w, cam, 1) : (L.bg || '') + w;
  };
  return fn;
}
// camera-taking sets: layersFn(t, cam, o) returns transformed layers { bg, mid, front, fg, light }
function makeCamSet(layersFn) {
  const fn = (t = 0, cam = {}, opts = {}) => { const L = layersFn(t, cam, opts); return L.bg + L.mid + L.front + L.fg + L.light; };
  fn.layers = layersFn;
  fn.compose = (t = 0, cam = {}, opts = {}, back = '', after = '') => {
    const L = layersFn(t, cam, opts);
    return L.bg + L.mid + layer(back, cam, 1) + L.front + layer(after, cam, 1) + L.fg + L.light;
  };
  return fn;
}

// cheap soft glow: stacked translucent ellipses (no radial gradients)
function glow(x, y, rx, ry, col, op = 1) {
  if (op <= 0.003) return '';
  return E(x, y, rx, ry, { fill: col, opacity: f(0.1 * op) }) + E(x, y, rx * 0.66, ry * 0.66, { fill: col, opacity: f(0.13 * op) }) + E(x, y, rx * 0.36, ry * 0.36, { fill: col, opacity: f(0.18 * op) });
}

// ================================================================= CHEAP PEOPLE (background fill)
// R6 block people drawn as a handful of colour-bucketed paths. Sizes are in rig units, so a person at s matches a rig
// character at s (s .5 ~ 475 px tall; head top = y - 900 s for kids, y - 1020 s for adults).
// list: [{ x, y (feet), s, i (look seed), kind 'kid'|'adult', pose 'stand'|'walk', ph (walk phase), speed, view 'front'|'back',
//          arms 'down'|'up'|'wave', look -1..1, mouth 'smile'|'o'|'line'|'talk', lean deg, top/pants/hair (colour overrides) }]
// o: { t, dim 0..1, dimCol, quiet (no bob, closed mouths), look (eyes, overrides), scared 0..1 (arms up, O mouths) }
const SKIN = ['#FFFFFF', '#F7D6BC', '#E9B48A', '#C98A5E', '#8E5A3A', '#F2C7A2'];
const HAIR = ['#3B2416', '#6E3F1E', '#1F1A24', '#E6B04C', '#B5542A', '#4A3A30', '#2E2440', '#9A6A3A'];
const KTOP = ['#4F86F7', '#3FBF8F', '#F7A43B', '#A86BF2', '#F26F8F', '#2FB7C9', '#FFFFFF', '#F6D14A', '#5CC659', '#7A8BA6', '#FF8A5C', '#69A7FF'];
const KPANTS = ['#2E3E66', '#3A4A5A', '#5A4636', '#2A2A38', '#4A6EA8', '#6A5A8A', '#3E5E4A'];
const ATOP = ['#3A5A8A', '#8A4A5A', '#4A7A5A', '#C8A26A', '#6A6A7A', '#2E3E66', '#B86A3A', '#E8E2D2', '#7A5A9A', '#D86A6A'];
const APANTS = ['#2A3450', '#4A4A52', '#6A5A46', '#2A2A30', '#3A4A6A', '#5A4A3A'];
const AHAIR = ['#3B2416', '#8A8A92', '#C8C8D0', '#1F1A24', '#6E3F1E', '#B08A5A', '#4A3A30'];
const KD = { hip: 305, legX: [8, 90], torso: [-118, -562, 236, 262, 28], arm: [122, 172, -552, -340], hand: 46, head: [-156, -890, 312, 334, 82], eye: [56, -722, 20, 30], mouth: -636 };
const AD = { hip: 380, legX: [10, 96], torso: [-132, -712, 264, 336, 34], arm: [136, 190, -702, -420], hand: 50, head: [-134, -1010, 268, 300, 68], eye: [48, -866, 17, 25], mouth: -786 };
// hair shapes, authored for the kid head (x ±150, top -940); m(u, v) maps a point
const HAIRS = [
  (m) => `M${m(-162, -790)} Q${m(-166, -958)} ${m(0, -962)} Q${m(166, -958)} ${m(162, -790)} Q${m(150, -846)} ${m(92, -852)} L${m(-92, -852)} Q${m(-150, -846)} ${m(-162, -790)} Z`,
  (m) => `M${m(-156, -850)} L${m(-156, -935)} Q${m(-150, -966)} ${m(-110, -968)} L${m(110, -968)} Q${m(150, -966)} ${m(156, -935)} L${m(156, -850)} Q${m(100, -884)} ${m(0, -880)} Q${m(-100, -884)} ${m(-156, -850)} Z`,
  (m) => `M${m(-172, -630)} L${m(-172, -860)} Q${m(-168, -972)} ${m(0, -974)} Q${m(168, -972)} ${m(172, -860)} L${m(172, -630)} L${m(128, -630)} L${m(128, -838)} Q${m(60, -880)} ${m(0, -872)} Q${m(-60, -880)} ${m(-128, -838)} L${m(-128, -630)} Z`,
  (m) => `M${m(-178, -860)} Q${m(-190, -960)} ${m(-90, -984)} Q${m(0, -1024)} ${m(90, -984)} Q${m(190, -960)} ${m(178, -860)} Q${m(120, -900)} ${m(0, -896)} Q${m(-120, -900)} ${m(-178, -860)} Z`,
  (m) => `M${m(-160, -800)} Q${m(-170, -962)} ${m(-20, -968)} Q${m(150, -968)} ${m(162, -872)} L${m(162, -822)} Q${m(100, -900)} ${m(-40, -882)} Q${m(-120, -872)} ${m(-160, -800)} Z`,
  (m) => `M${m(-158, -850)} Q${m(-160, -960)} ${m(0, -962)} Q${m(160, -960)} ${m(158, -850)} Q${m(80, -892)} ${m(0, -888)} Q${m(-80, -892)} ${m(-158, -850)} Z`,
  (m) => `M${m(-162, -858)} Q${m(-162, -968)} ${m(0, -970)} Q${m(162, -968)} ${m(162, -858)} Z M${m(-20, -868)} L${m(236, -868)} Q${m(242, -842)} ${m(214, -838)} L${m(-20, -842)} Z`,
  (m) => `M${m(-158, -780)} L${m(-158, -850)} Q${m(-150, -880)} ${m(-130, -870)} L${m(-130, -770)} Z M${m(158, -780)} L${m(158, -850)} Q${m(150, -880)} ${m(130, -870)} L${m(130, -770)} Z`,
];
const PART_ORDER = { leg: 0, shoe: 1, armB: 2, body: 3, hand: 4, head: 5, hair: 6, bun: 7, eye: 8, glint: 9, mouth: 10, mouthO: 11 };
function people(list, o = {}) {
  if (!list || !list.length) return '';
  const t = o.t || 0, dim = clamp(o.dim || 0, 0, 1), dimCol = o.dimCol || '#7A7492';
  const sorted = list.slice().sort((a, b) => a.y - b.y);
  const groups = [];
  for (const p of sorted) { const g = groups[groups.length - 1]; if (g && p.y - g[0].y < 26) g.push(p); else groups.push([p]); }
  let out = '';
  for (const grp of groups) {
    const B = new Map();
    const add = (kind, col, w, d) => { const key = kind + col + w; let b = B.get(key); if (!b) { b = { kind, col, w, d: '' }; B.set(key, b); } b.d += d + ' '; };
    for (const p of grp) personInto(p, add, t, o);
    const arr = [...B.values()].sort((a, b) => PART_ORDER[a.kind] - PART_ORDER[b.kind]);
    for (const b of arr) {
      const c = mix(b.col, dimCol, dim);
      if (b.kind === 'mouth') out += P(b.d, ln(b.w, mix('#3A1A22', dimCol, dim)));
      else if (b.kind === 'eye' || b.kind === 'glint') out += P(b.d, { fill: b.kind === 'eye' ? mix(LINE, dimCol, dim * 0.6) : '#FFFFFF', opacity: b.kind === 'glint' ? 0.9 : 1 });
      else if (b.kind === 'mouthO') out += P(b.d, { fill: mix('#7A2A3A', dimCol, dim), stroke: LINE, 'stroke-width': b.w * 0.5 });
      else if (b.kind === 'armB') out += P(b.d, ln(b.w * 6.2, LINE)) + P(b.d, ln(b.w * 4.6, c));
      else out += P(b.d, b.w < 1.6 ? { fill: c } : ol(c, b.w));
    }
  }
  return out;
}
function personInto(p, add, t, o) {
  const s = p.s, adult = p.kind === 'adult', i = p.i || 0, D = adult ? AD : KD;
  const h = (k) => hash(i * k + 0.37);
  const top = p.top || (adult ? ATOP : KTOP)[Math.floor(h(3.1) * (adult ? ATOP.length : KTOP.length))];
  const pants = p.pants || (adult ? APANTS : KPANTS)[Math.floor(h(5.7) * (adult ? APANTS.length : KPANTS.length))];
  const skin = p.skin || SKIN[Math.floor(h(7.3) * SKIN.length)];
  const hairC = p.hair || (adult ? AHAIR : HAIR)[Math.floor(h(9.9) * (adult ? AHAIR.length : HAIR.length))];
  const hk = p.hairStyle ?? Math.floor(h(11.7) * (adult ? 8 : 7));
  const walk = p.pose === 'walk', ph = (p.ph || 0) + (walk ? t * (p.speed || 7) : 0);
  const scared = clamp(p.scared ?? o.scared ?? 0, 0, 1);
  const bob = walk ? -Math.abs(Math.cos(ph)) * 16 : (o.quiet || scared ? 0 : Math.sin(t * 2.6 + i * 1.7) * 4);
  const back = p.view === 'back';
  const lean = (p.lean || 0) * Math.PI / 180;
  const x0 = p.x, y0 = p.y;
  // body point (u, v) -> world (lean = shear around the feet)
  const X = (u, v = 0) => x0 + (u - Math.sin(lean) * v) * s;
  const Y = (v) => y0 + (v + (v < -D.hip ? bob : 0)) * s;
  const m = (u, v) => pt(X(u, v), Y(v));
  const sw = Math.max(1.2, 11 * s);
  const key = Math.round(sw * 4) / 4;
  // legs + shoes
  const st = walk ? Math.sin(ph) * 64 : 0;
  const [l0, l1] = D.legX;
  const leg = (a, b, dx) => `M${m(a, -D.hip)} L${m(b, -D.hip)} L${m(b + dx, -30)} L${m(a + dx, -30)} Z`;
  add('leg', pants, key, leg(-l1, -l0, st) + ' ' + leg(l0, l1, -st));
  add('shoe', '#2B2733', key, rrD(X(-l1 - 8 + st, 0), Y(-40), (l1 - l0 + 16) * s, 40 * s, 10 * s) + ' ' + rrD(X(l0 - 8 - st, 0), Y(-40), (l1 - l0 + 16) * s, 40 * s, 10 * s));
  // arms
  const [a0, a1, ay0, ay1] = D.arm;
  const armsUp = p.arms === 'up' || scared > 0.3, wave = p.arms === 'wave';
  if (armsUp || wave) {
    const shY = ay0 + 40, aw = a1 - a0;
    for (const side of [-1, 1]) {
      const up = armsUp || side > 0;
      const sx = X(side * (a0 + a1) / 2, shY), sy = Y(shY);
      let ex = sx, ey = sy + (ay1 - ay0) * 0.9 * s;
      if (up) {
        const A = (armsUp ? 26 + 8 * Math.sin(t * 9 + i + side) : 34 + 24 * Math.sin(t * 8 + i)) * Math.PI / 180, L = (ay1 - ay0) * 0.95 * s;
        ex = sx + side * Math.sin(A) * L; ey = sy - Math.cos(A) * L;
      }
      add('armB', top, g1(aw * s / 4.6), `M${pt(sx, sy)} L${pt(ex, ey)}`);
      add('hand', skin, key, circD(ex, ey, D.hand * 0.55 * s));
    }
  } else {
    const swg = walk ? Math.sin(ph) * 46 : 0;
    for (const side of [-1, 1]) {
      const dx = side * swg;
      const a = side < 0 ? -a1 : a0, b = side < 0 ? -a0 : a1;
      add('body', top, key, `M${m(a, ay0)} L${m(b, ay0)} L${m(b + dx, ay1)} L${m(a + dx, ay1)} Z`);
      add('hand', skin, key, rrD(X(a + dx, ay1), Y(ay1 - 4), (b - a) * s, D.hand * s, 14 * s));
    }
  }
  // torso
  const [tx, ty, tw, th, trr] = D.torso;
  add('body', top, key, rrD(X(tx, ty + th / 2), Y(ty), tw * s, th * s, trr * s));
  // head
  const [hxx, hy, hw, hh, hr] = D.head;
  const headX = X(hxx, hy + hh / 2);
  add('head', back ? hairC : skin, key, rrD(headX, Y(hy), hw * s, hh * s, hr * s));
  // hair (mapped from the kid head)
  const hm = adult ? (u, v) => m(u * (134 / 150), -1010 + (v + 940) * (300 / 340)) : (u, v) => m(u * 1.04, v + 50);
  if (!back) {
    if (adult && hk === 7) add('hair', hairC, key, HAIRS[7](hm));
    else if (hk !== 7) add('hair', hairC, key, HAIRS[hk % 7](hm));
    if (hk === 5) add('bun', hairC, key, circD(X(0, hy), Y(hy - 34 * (adult ? 0.86 : 1)), 46 * s));
    // face
    const [ex, ey, erx, ery] = D.eye;
    const lk = (o.look ?? p.look ?? (h(13.3) - 0.5) * 0.6) * 9;
    const big = 1 + scared * 0.25;
    const cx = X(0, ey);
    add('eye', LINE, 0, elD(cx - ex * s + lk * s, Y(ey), erx * s * big, ery * s * big) + ' ' + elD(cx + ex * s + lk * s, Y(ey), erx * s * big, ery * s * big));
    if (s > 0.2) add('glint', '#FFFFFF', 0, circD(cx - ex * s + (lk - 6) * s, Y(ey - 9), 6.5 * s) + ' ' + circD(cx + ex * s + (lk - 6) * s, Y(ey - 9), 6.5 * s));
    const my = D.mouth, mw = adult ? 26 : 30;
    const talk = !o.quiet && (p.mouth === 'talk' || (p.mouth === undefined && h(17.1) < 0.35)) && Math.sin(t * 11 + i * 3) > 0.1;
    if (scared > 0.3 || p.mouth === 'o') add('mouthO', '#7A2A3A', key, elD(cx, Y(my + 8), 16 * s, 22 * s));
    else if (talk) add('mouthO', '#7A2A3A', key, elD(cx, Y(my + 4), 18 * s, 12 * s));
    else if (p.mouth === 'line' || o.quiet) add('mouth', '', Math.max(1, 7 * s), `M${pt(cx - mw * 0.7 * s, Y(my))} L${pt(cx + mw * 0.7 * s, Y(my))}`);
    else add('mouth', '', Math.max(1, 7 * s), `M${pt(cx - mw * s, Y(my - 4))} Q${pt(cx, Y(my + 22))} ${pt(cx + mw * s, Y(my - 4))}`);
  } else if (hk === 5) add('bun', hairC, key, circD(X(0, hy), Y(hy - 34), 46 * s));
}
// layout helper: a row of people from x0 to x1 (deterministic), skipping gaps
function crowdRow(x0, x1, y, s, opts = {}) {
  const out = [];
  const step = (opts.dx || 300) * s / 0.5, seed = opts.seed || 1;
  let i = 0;
  for (let x = x0 + hash(seed) * step * 0.4; x < x1; x += step * (0.8 + 0.4 * hash(i * 2.1 + seed)), i++) {
    if (opts.gaps && opts.gaps.some(([a, b]) => x > a && x < b)) continue;
    if (opts.density !== undefined && hash(i * 4.3 + seed * 1.9) > opts.density) continue;
    const yy = y + (hash(i * 3.3 + seed) - 0.5) * (opts.jit ?? 16);
    out.push({ x: Math.round(x), y: Math.round(yy), s: opts.scaleAt ? opts.scaleAt(yy) : s, i: Math.floor(seed * 31 + i * 7), kind: opts.kind || 'kid', pose: opts.pose, view: opts.view, mouth: opts.mouth });
  }
  return out;
}

// ================================================================= SHARED PROPS
// the school logo: an owl face (purple head with ear tufts, big gold-rimmed eyes, orange beak); origin = face centre, s 1 ~ 130 wide
function owl(x, y, s = 1, opts = {}) {
  const c = opts.col || PUR, belly = opts.belly || GOLD;
  let o = P('M-56 -36 L-66 -84 L-28 -58 Q0 -66 28 -58 L66 -84 L56 -36 Q72 0 62 32 Q46 70 0 72 Q-46 70 -62 32 Q-72 0 -56 -36 Z', ol(c, 5));
  o += P('M-34 34 Q0 22 34 34 Q30 60 0 64 Q-30 60 -34 34 Z', { fill: belly });
  o += P('M-40 44 l8 6 M-12 40 l8 6 M16 40 l8 6', ln(3.5, GOLD_D));
  for (const sx of [-1, 1]) o += CI(sx * 26, -12, 24, ol('#FFFFFF', 4)) + CI(sx * 26, -12, 24, ln(5, belly)) + CI(sx * 26 + 3, -10, 10, { fill: LINE }) + CI(sx * 26 - 1, -15, 3.5, { fill: '#FFFFFF' });
  o += P('M-9 8 L9 8 L0 24 Z', ol('#FF9F1C', 3));
  o += P('M-46 -36 Q-26 -48 -8 -36 M46 -36 Q26 -48 8 -36', ln(5, mix(c, '#000000', 0.3)));
  return G(o, tr(x, y, s, opts.rot || 0));
}
// little icons for posters (centre 0,0, ~60 px)
function icon(kind) {
  switch (kind) {
    case 'volcano': return P('M-36 26 L-10 -14 L10 -14 L36 26 Z', ol('#9A6440', 3.5)) + P('M-10 -14 L-4 -6 L2 -12 L10 -14 Z', ol('#FF5A3C', 3)) + P(`${circD(-4, -26, 9)} ${circD(8, -32, 10)} ${circD(0, -42, 8)}`, ol('#E8E2EE', 3));
    case 'heart': return P('M0 24 C-34 2 -30 -26 -2 -14 L0 -12 L2 -14 C30 -26 34 2 0 24 Z', ol('#FF6F91', 3.5));
    case 'hamster': return E(0, 6, 30, 22, ol('#E9B97A', 3.5)) + CI(-18, -12, 8, ol('#E9B97A', 3)) + CI(18, -12, 8, ol('#E9B97A', 3)) + CI(-9, 2, 3.5, { fill: LINE }) + CI(9, 2, 3.5, { fill: LINE }) + CI(0, 9, 3, { fill: '#FF7A8A' }) + E(0, 16, 14, 7, { fill: '#FFF1DC' });
    case 'ball': return CI(0, 0, 26, ol('#FF8A3D', 3.5)) + P('M-26 0 Q0 14 26 0 M0 -26 Q-12 0 0 26', ln(3, '#C85A1E'));
    case 'book': return P('M-32 -18 L0 -12 L32 -18 L32 20 L0 26 L-32 20 Z', ol('#5AA8F0', 3.5)) + P('M0 -12 V26', ln(3));
    case 'star': return P('M0 -28 L8 -9 L28 -8 L12 5 L18 26 L0 14 L-18 26 L-12 5 L-28 -8 L-8 -9 Z', ol(GOLD, 3.5));
    case 'potato': return P('M-30 4 Q-34 -18 -8 -20 Q16 -26 28 -8 Q36 12 14 20 Q-20 26 -30 4 Z', ol('#D9A85E', 3.5)) + CI(-10, -6, 2.5, { fill: '#9A6A30' }) + CI(10, 6, 2.5, { fill: '#9A6A30' }) + P('M2 -30 L-6 -12 L4 -12 L-4 6', ln(4, GOLD));
    case 'atom': return E(0, 0, 30, 11, ln(3.5, PUR)) + G(E(0, 0, 30, 11, ln(3.5, PUR)), 'rotate(60)') + G(E(0, 0, 30, 11, ln(3.5, PUR)), 'rotate(-60)') + CI(0, 0, 6, { fill: '#FF6F91' });
    case 'owl': return owl(0, 4, 0.42);
    case 'arrow': return P('M-30 -8 H8 V-22 L32 0 L8 22 V8 H-30 Z', ol('#FFFFFF', 3.5));
    case 'chess': return P('M-12 24 H12 L8 6 Q16 -4 8 -14 Q14 -24 0 -28 Q-14 -24 -8 -14 Q-16 -4 -8 6 Z', ol('#2A2246', 3));
    case 'cupcake': return P('M-20 2 L20 2 L14 26 L-14 26 Z', ol('#5AA8F0', 3)) + P('M-24 4 Q-28 -16 -8 -18 Q0 -32 10 -20 Q28 -18 24 4 Z', ol('#FFB3CC', 3)) + CI(0, -24, 5, ol('#FF4D5A', 2.5));
    default: return '';
  }
}
// paper poster: lines (array or 'a\nb'), centred at (x, y). o: w, h, col, ink, head (header colour: first line in white on it),
// icon, size, rot, s, tape
function poster(text, x, y, o = {}) {
  const w = o.w || 200, h = o.h || 160, col = o.col || '#FFE07A', ink = o.ink || '#2A2246';
  const L = Array.isArray(text) ? text : String(text).split('\n');
  let s = R(-w / 2, -h / 2, w, h, 7, ol(col, 5));
  let y0 = -h / 2 + 10, body = L;
  if (o.head) {
    const hh = o.headH || 46, hs = Math.min(o.headSize || 32, (w - 26) / (L[0].length * 0.56 + 0.4));
    s += R(-w / 2 + 8, -h / 2 + 8, w - 16, hh, 5, { fill: o.head }) + T(L[0], 0, -h / 2 + 8 + hh / 2 + hs * 0.36, hs, '#FFFFFF');
    y0 = -h / 2 + 8 + hh + 6; body = L.slice(1);
  }
  const hasIcon = !!o.icon;
  const room = (h / 2 - (hasIcon ? 84 : 12)) - y0;
  const size = o.size || Math.max(12, Math.min(44, (w - 24) / Math.max(1, ...body.map((l) => l.length * 0.56 + 0.4)), room / Math.max(1, body.length * 1.1)));
  const by = y0 + (room - body.length * size * 1.1) / 2 + size * 0.86;
  body.forEach((l, i) => { s += T(l, 0, by + i * size * 1.1, size, i === 0 && o.accent ? o.accent : ink); });
  if (hasIcon) s += G(icon(o.icon), `translate(0 ${f(h / 2 - 36)}) scale(0.9)`);
  if (o.tape !== false) s += R(-w / 2 - 14, -h / 2 - 8, 42, 16, 2, { fill: '#F4EFDF', opacity: 0.92, transform: `rotate(-32 ${f(-w / 2 + 7)} ${f(-h / 2)})` }) + R(w / 2 - 28, -h / 2 - 8, 42, 16, 2, { fill: '#F4EFDF', opacity: 0.92, transform: `rotate(32 ${f(w / 2 - 7)} ${f(-h / 2)})` });
  return G(s, tr(x, y, o.s || 1, o.rot || 0));
}
// round wall clock: time '8:05' | hours (number); o.t -> running second hand; o.rim colour
function wallClock(x, y, r, time = '8:05', o = {}) {
  let hh = 8, mm = 5;
  if (typeof time === 'string') { const [a, b] = time.split(':'); hh = +a; mm = +(b || 0); } else if (typeof time === 'number') { hh = Math.floor(time); mm = (time - hh) * 60; }
  const rim = o.rim || PUR;
  let s = CI(0, 0, r, ol(rim, Math.max(4, r * 0.1))) + CI(0, 0, r * 0.82, { fill: '#FFFDF6' });
  let d = '';
  for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6, r0 = i % 3 ? r * 0.66 : r * 0.56; d += `M${f(Math.sin(a) * r0)} ${f(-Math.cos(a) * r0)} L${f(Math.sin(a) * r * 0.74)} ${f(-Math.cos(a) * r * 0.74)} `; }
  s += P(d, ln(Math.max(2, r * 0.06), '#5A5470'));
  const hand = (deg, len, w, c) => P(`M0 0 L${f(Math.sin(deg * Math.PI / 180) * len)} ${f(-Math.cos(deg * Math.PI / 180) * len)}`, ln(w, c));
  s += hand(((hh % 12) + mm / 60) * 30, r * 0.4, Math.max(3, r * 0.11), LINE) + hand(mm * 6, r * 0.64, Math.max(2.5, r * 0.075), LINE);
  if (o.t !== undefined) s += hand((Math.floor(o.t) * 6) % 360, r * 0.68, Math.max(1.5, r * 0.035), '#E8463C');
  s += CI(0, 0, Math.max(3, r * 0.09), { fill: GOLD, stroke: LINE, 'stroke-width': 2 }) + P(`M${f(-r * 0.5)} ${f(-r * 0.42)} Q${f(-r * 0.2)} ${f(-r * 0.7)} ${f(r * 0.24)} ${f(-r * 0.7)}`, ln(Math.max(2, r * 0.06), '#FFFFFF', 0.7));
  return G(s, tr(x, y));
}
// a bank of n double lockers (92 px columns) from x0, top..bot. o: col 'v'|'s', open [column indices], stickers
function lockerBank(x0, n, top = 470, bot = 800, o = {}) {
  const C = LOCK[o.col || 'v'], id = o.col === 's' ? 'stLockS' : 'stLockV', w = n * 92, h = bot - top;
  let s = R(0, 0, w, h, 0, { fill: `url(#${id})` }) + R(0, h - 12, w, 12, 0, { fill: '#2E2650' });
  s += R(-5, -16, w + 10, 18, 4, ol(C.cap, 4)) + R(0, 0, w, h, 0, ln(5));
  for (const c of o.open || []) {
    const lx = c * 92;
    s += R(lx + 3, 3, 86, 158, 4, { fill: '#2A2340' }) + R(lx + 10, 60, 72, 6, 2, { fill: '#5A5274' }) + R(lx + 22, 100, 46, 60, 8, ol(KTOP[(c * 3) % KTOP.length], 3)) + R(lx + 14, 18, 30, 40, 3, ol('#FFFFFF', 2.5));
    s += P(`M${lx + 3} 3 L${lx - 46} -10 L${lx - 46} 172 L${lx + 3} 161 Z`, ol(C.col, 4)) + P(`M${lx - 30} 20 H${lx - 12} M${lx - 30} 30 H${lx - 12}`, ln(4, C.dark));
  }
  for (const [c, kind] of o.stickers || []) {
    const sx = c * 92 + 46, sy = kind === 'star' ? 120 : 270;
    s += kind === 'star' ? G(icon('star'), tr(sx, sy, 0.5)) : kind === 'owl' ? owl(sx, sy, 0.24) : G(icon(kind), tr(sx, sy, 0.5));
  }
  return G(s, tr(x0, top));
}
// classroom door in a wall (side view), centred x, floor y base. o: open 0..1, label, name, col, inside (warm room colour), restroom
function hallDoor(x, base, o = {}) {
  const w = 250, h = 560, top = base - h, k = bool01(o.open), col = o.col || '#C98A52', dk = mix(col, '#3A2010', 0.35);
  let s = R(x - w / 2 - 24, top - 24, w + 48, h + 24, 6, ol('#F7F1E6', 6)) + R(x - w / 2 - 24, top - 24, w + 48, 10, 4, { fill: '#FFFFFF', opacity: 0.6 });
  if (k > 0) {
    if (o.restroom) {
      s += R(x - w / 2, top, w, h, 0, { fill: '#E7E2F0' }) + R(x - w / 2, top + h * 0.3, w, h * 0.48, 0, { fill: 'url(#stBathTile)' }) + R(x - w / 2, top + h * 0.78, w, h * 0.22, 0, { fill: '#B7C3CF' });
      s += R(x - w / 2 + w * 0.5, top + 70, w * 0.5, h * 0.68, 3, ol('#8A70EA', 4)) + R(x - w / 2 + w * 0.1, top + 120, w * 0.34, 120, 6, ol('#DCEFF0', 4));
    } else {
      s += R(x - w / 2, top, w, h, 0, { fill: o.inside || '#CFDDF0' }) + R(x - w / 2, top + h * 0.62, w, h * 0.38, 0, { fill: '#E6D7BD' });
      s += R(x - w / 2 + w * 0.45, top + 90, w * 0.55, 150, 0, { fill: '#2F5E4C', stroke: '#B9783E', 'stroke-width': 8 }) + R(x - w / 2 + w * 0.2, top + h * 0.6, w * 0.7, 26, 4, ol('#E8C38A', 4)) + R(x - w / 2 + w * 0.26, top + h * 0.6 + 26, 10, 110, 2, { fill: '#7A7088' });
    }
    s += R(x - w / 2, top, w, h, 0, { fill: '#FFE9B8', opacity: 0.25 });
    const pw = w * (1 - k * 0.8);
    s += P(`M${x - w / 2} ${top} L${f(x - w / 2 + pw)} ${f(top + 22 * k)} L${f(x - w / 2 + pw)} ${f(base - 12 * k)} L${x - w / 2} ${base} Z`, ol(col, 5));
    s += P(`M${f(x - w / 2 + pw * 0.2)} ${f(top + 70)} L${f(x - w / 2 + pw * 0.45)} ${f(top + 74)} L${f(x - w / 2 + pw * 0.45)} ${f(top + 270)} L${f(x - w / 2 + pw * 0.2)} ${f(top + 270)} Z`, ol('#BFE3FF', 3.5));
  } else {
    s += R(x - w / 2, top, w, h, 4, ol(col, 5)) + R(x - w / 2 + 12, top + 12, 14, h - 24, 4, { fill: '#FFFFFF', opacity: 0.18 });
    if (o.restroom) {
      s += R(x - 70, top + 120, 140, 140, 10, ol('#3E7BD8', 4)) + CI(x, top + 152, 13, { fill: '#FFFFFF' }) + P(`M${x - 22} ${top + 236} L${x - 22} ${top + 186} Q${x} ${top + 168} ${x + 22} ${top + 186} L${x + 22} ${top + 236}`, ln(9, '#FFFFFF'));
      s += R(x - w / 2 + 20, top + 330, w - 40, 26, 6, ol('#C9CED8', 3.5));
    } else {
      s += R(x - w / 2 + 30, top + 54, 74, 230, 4, ol('#C7E6FF', 4)) + P(`M${x - w / 2 + 40} ${top + 250} L${x - w / 2 + 80} ${top + 80} L${x - w / 2 + 94} ${top + 80} L${x - w / 2 + 54} ${top + 250} Z`, { fill: '#FFFFFF', opacity: 0.55 });
      s += P(`M${x - w / 2 + 30} ${top + 130} H${x - w / 2 + 104} M${x - w / 2 + 30} ${top + 207} H${x - w / 2 + 104}`, ln(2, '#7AA6C8', 0.7));
    }
    s += R(x + w / 2 - 56, top + 296, 36, 14, 6, ol('#D9DEE8', 3)) + R(x + w / 2 - 42, top + 286, 14, 30, 5, ol('#C9CED8', 3));
    s += R(x - w / 2 + 6, base - 54, w - 12, 46, 3, { fill: '#C9CED8', stroke: LINE, 'stroke-width': 3 });
    s += P(`M${x - w / 2} ${top + h * 0.5} H${x + w / 2}`, ln(3, dk, 0.35));
  }
  // sign above the frame
  if (o.label) s += R(x - 84, top - 92, 168, 50, 10, ol('#3A2E6A', 4)) + TF(o.label, x, top - 56, 28, '#FFFFFF') + R(x - 84, top - 92, 168, 8, 4, { fill: GOLD });
  if (o.name) s += G(R(-78, -26, 156, 52, 8, ol('#FFFFFF', 4)) + TF(o.name, 0, 9, o.name.length > 10 ? 19 : 23, '#2A2246'), tr(x + w / 2 + 104, top + 150, 1, 2));
  return s;
}
// trophy pieces (origin = base centre on the shelf)
function trophy(kind, x, y, s = 1) {
  let o = '';
  if (kind === 'cup') o = R(-22, -12, 44, 12, 2, ol('#7A4A2A', 3)) + R(-6, -30, 12, 18, 2, ol(GOLD, 3)) + P('M-26 -78 L26 -78 Q24 -40 0 -32 Q-24 -40 -26 -78 Z', ol(GOLD, 3)) + P('M-26 -70 Q-46 -66 -30 -48 M26 -70 Q46 -66 30 -48', ln(4)) + P('M-14 -70 Q-12 -50 -2 -42', ln(4, '#FFF0B8'));
  else if (kind === 'star') o = R(-20, -14, 40, 14, 2, ol('#4A3A8A', 3)) + R(-5, -50, 10, 36, 2, ol(GOLD, 3)) + G(icon('star'), 'translate(0 -72) scale(0.8)');
  else if (kind === 'figure') o = R(-20, -14, 40, 14, 2, ol('#7A4A2A', 3)) + R(-14, -30, 28, 16, 2, ol('#2A2246', 3)) + P('M-6 -30 L-10 -58 L10 -58 L6 -30 Z', ol(GOLD, 3)) + CI(0, -68, 9, ol(GOLD, 3)) + P('M-8 -54 L-24 -74 M8 -54 L20 -46', ln(5, GOLD)) + CI(-26, -80, 7, ol('#FF8A3D', 2.5));
  else if (kind === 'medal') o = P('M-10 -70 L0 -40 L10 -70', ln(6, '#3E7BD8')) + CI(0, -30, 16, ol(GOLD, 3)) + T('1', 0, -23, 18, '#9A6A10');
  else if (kind === 'plaque') o = R(-34, -70, 68, 70, 5, ol('#8A5A30', 3)) + R(-24, -60, 48, 34, 3, ol(GOLD, 2.5)) + P('M-20 -16 H20', ln(3, GOLD));
  else if (kind === 'pennant') o = P('M-40 -70 L44 -52 L-40 -34 Z', ol(PUR, 3)) + TF('OWLS', -6, -46, 15, GOLD);
  return G(o, tr(x, y, s));
}
function trophyCase(x0, x1, top, base) {
  const w = x1 - x0;
  let s = R(x0, top, w, base - top, 8, ol('#A86A3A', 6));
  s += R(x0 + 18, top + 18, w - 36, 400, 4, { fill: '#4A3A8A' }) + R(x0 + 18, top + 18, w - 36, 30, 4, { fill: '#5E4CA6' });
  const shelves = [top + 160, top + 300, top + 418];
  s += P(shelves.map((y) => `M${x0 + 18} ${y} H${x1 - 18}`).join(' '), ln(8, '#D8EEFF')) + P(shelves.map((y) => `M${x0 + 18} ${y + 5} H${x1 - 18}`).join(' '), ln(3, '#8EA6C8'));
  const u = w / 6;
  s += trophy('cup', x0 + u, shelves[0], 1.1) + trophy('star', x0 + u * 2.4, shelves[0]) + trophy('plaque', x0 + u * 3.7, shelves[0]) + trophy('cup', x0 + u * 5, shelves[0], 0.85);
  s += trophy('figure', x0 + u * 1.2, shelves[1]) + trophy('medal', x0 + u * 2.4, shelves[1] - 20) + trophy('medal', x0 + u * 3, shelves[1] - 20) + trophy('pennant', x0 + u * 4.4, shelves[1], 1.1);
  s += trophy('figure', x0 + u * 5.2, shelves[1], 0.9) + trophy('cup', x0 + u * 2, shelves[2], 0.9) + trophy('star', x0 + u * 4, shelves[2], 0.9) + owl(x0 + u * 3, shelves[2] - 40, 0.36);
  s += P(`M${x0 + 40} ${top + 380} L${x0 + 160} ${top + 30} L${x0 + 200} ${top + 30} L${x0 + 80} ${top + 380} Z M${x1 - 150} ${top + 390} L${x1 - 70} ${top + 160} L${x1 - 52} ${top + 160} L${x1 - 132} ${top + 390} Z`, { fill: '#FFFFFF', opacity: 0.2 });
  s += R(x0 + 18, top + 18, w - 36, 400, 4, ln(4, '#2A2246'));
  s += R(x0 + 10, top + 430, w - 20, base - top - 440, 4, ol('#B97A44', 4)) + P(`M${(x0 + x1) / 2} ${top + 436} V${base - 14}`, ln(4)) + CI((x0 + x1) / 2 - 18, top + 480, 6, ol(GOLD, 2.5)) + CI((x0 + x1) / 2 + 18, top + 480, 6, ol(GOLD, 2.5));
  s += R(x0 + w / 2 - 150, top - 64, 300, 52, 10, ol(PUR, 5)) + TF('HALL OF FAME', x0 + w / 2, top - 27, 30, GOLD) + R(x0 + w / 2 - 150, top - 64, 300, 52, 10, ln(5));
  return s;
}
// cartoon trees: kind 'round' | 'tall'; origin = trunk base
function tree(x, y, s = 1, o = {}) {
  const c = o.col || '#5DBB63', hi = o.hi || '#93DD8A', dk = mix(c, '#123A22', 0.32), sway = o.sway || 0;
  let t = P('M-22 0 L-14 -200 L14 -200 L22 0 Z', ol(o.trunk || '#8C5C38', 6)) + P('M-14 -170 L-34 -230 M10 -150 L32 -214', ln(10, o.trunk || '#8C5C38'));
  let cn;
  if (o.kind === 'tall') {
    const d = elD(0, -380, 120, 230);
    cn = P(d, { fill: LINE, stroke: LINE, 'stroke-width': 12 }) + P(d, { fill: c }) + P('M-110 -320 Q-60 -170 0 -160 Q70 -170 110 -320 Q100 -190 0 -160 Q-100 -190 -110 -320 Z', { fill: dk, opacity: 0.4 }) + P(`${elD(-40, -500, 34, 60)} ${circD(40, -420, 18)}`, { fill: hi, opacity: 0.85 });
  } else {
    const d = `${circD(0, -360, 150)} ${circD(-120, -270, 105)} ${circD(120, -270, 110)} ${circD(-40, -230, 100)} ${circD(60, -220, 96)}`;
    cn = P(d, { fill: LINE, stroke: LINE, 'stroke-width': 12, 'stroke-linejoin': 'round' }) + P(d, { fill: c }) + P('M-210 -250 Q-140 -140 0 -134 Q140 -136 220 -250 Q200 -160 120 -140 Q0 -118 -110 -142 Q-190 -160 -210 -250 Z', { fill: dk, opacity: 0.45 }) + P(`${circD(-60, -430, 44)} ${circD(-160, -300, 26)} ${circD(40, -470, 20)}`, { fill: hi, opacity: 0.9 });
  }
  return G(t + G(cn, sway ? `rotate(${f(sway)} 0 -200)` : ''), tr(x, y, s));
}
function bush(x, y, s = 1, c = '#4FAF5E', hi = '#86D97F') {
  const d = `${circD(-70, -44, 54)} ${circD(4, -70, 66)} ${circD(80, -40, 50)} M-124 -30 H130 V8 H-124 Z`;
  return G(P(d, { fill: LINE, stroke: LINE, 'stroke-width': 11, 'stroke-linejoin': 'round' }) + P(d, { fill: c }) + P(`${circD(-14, -100, 17)} ${circD(-86, -66, 11)}`, { fill: hi, opacity: 0.85 }), tr(x, y, s));
}
const CLOUD = 'M-150 30 H146 Q182 30 174 -2 Q166 -32 124 -26 Q114 -76 58 -72 Q22 -114 -30 -88 Q-82 -100 -98 -52 Q-152 -58 -162 -12 Q-172 30 -150 30 Z';
function cloud(x, y, s = 1, col = '#FFFFFF', shade = '#DDEBFA') {
  return G(P(CLOUD, { fill: col }) + P('M-168 6 Q0 26 176 6 Q178 30 146 30 H-150 Q-170 28 -168 6 Z', { fill: shade }), tr(x, y, s));
}
function bird(x, y, s, t, ph = 0, col = '#3A3456') {
  const fl = Math.sin(t * 9 + ph);
  return P(`M${f(x - 26 * s)} ${f(y - (8 + 12 * fl) * s)} Q${f(x - 12 * s)} ${f(y - 8 * s)} ${f(x)} ${f(y)} Q${f(x + 12 * s)} ${f(y - 8 * s)} ${f(x + 26 * s)} ${f(y - (8 + 12 * fl) * s)}`, ln(5 * s, col));
}
function sunDisc(x, y, r, t, col = '#FFE57A') {
  let rays = '';
  for (let i = 0; i < 10; i++) rays += P(`M0 0 L${f(-r * 0.26)} ${f(-r * 3)} L${f(r * 0.26)} ${f(-r * 3)} Z`, { fill: '#FFF8D6', opacity: 0.16, transform: `rotate(${f(i * 36 + t * 6)})` });
  return glow(x, y, r * 3.2, r * 3.2, '#FFF1B8', 1) + G(rays, tr(x, y)) + CI(x, y, r, { fill: col, stroke: '#FFC93C', 'stroke-width': 6 }) + CI(x - r * 0.3, y - r * 0.3, r * 0.3, { fill: '#FFFBE0', opacity: 0.8 });
}
// foam dodgeball (purple / gold / orange), centre (x, y), radius r
function foamBall(x, y, r = 28, col = '#FF8A3D') {
  return CI(x, y, r, ol(col, Math.max(3, r * 0.14))) + P(`M${f(x - r * 0.9)} ${f(y + r * 0.1)} Q${f(x)} ${f(y + r * 0.6)} ${f(x + r * 0.9)} ${f(y + r * 0.1)}`, ln(Math.max(2, r * 0.09), mix(col, '#000000', 0.25))) + E(x - r * 0.35, y - r * 0.38, r * 0.3, r * 0.17, { fill: '#FFFFFF', opacity: 0.55, transform: `rotate(-28 ${f(x - r * 0.35)} ${f(y - r * 0.38)})` });
}

// ================================================================= 1. HALLWAY
// SIDE view (default): the camera looks at the locker wall; pan along x (world -3300..5600). Wall/floor junction y 800.
// Stand lines (feet): back 850 (s .45, along the lockers) · main 960 (s .5) · front 1050 (s .55); scaleAt(y).
// Features (x): courtyard windows -2840..-1500 (bench under them) · ROOM 10 door -1240 · bulletin board -660 ·
//   lockers · hall clock + HOMEWORK poster 955 · ROOM 12 door (MRS. KRUMP) 1190 (o.doorOpen) · fountain 1995 ·
//   trophy case 2130..2730 · ROOM 14... · BOYS restroom door 3920 (o.restroomOpen) · CAFETERIA arrow 4560.
// Layers: bg (courtyard through the windows, k .5) · mid (k 1) · [back-line characters] · front ('') · [main/front line] ·
//   fg (hanging GO OWLS! banners k 1.12 + foreground pillars k 1.3 — o.pillars false hides them) · light.
// DEEP view (o.view 'deep'): one-point perspective down the hall (vanishing point 960, 420): lockers + doors on both walls,
//   the bright double doors at the far end, a GO OWLS! banner across, checker floor. Feet y -> s = .5 (y - 420) / 540.
//   Krump's door on the left wall; the restroom + trophy case on the right. Use it for Tank's walk down the middle.
// o: { view 'side'|'deep', doorOpen 0..1, restroomOpen 0..1, crowd 0..1 (cheap students: at the lockers / walking),
//      scatter 0..1 (students press against the lockers, arms up), pillars (side, default true), banner (text, default 'GO OWLS!'), clock }
const HL = { x0: -3300, x1: 5600, ceil: 120, lockTop: 470, base: 800 };
const HALL_WIN = [[-2840, -2420], [-2380, -1960], [-1920, -1500]];
const HALL_BANKS = [[-3260, 4, 's'], [-1050, 10, 's', [], [[2, 'star']]], [40, 9, 'v', [6], [[1, 'owl'], [4, 'heart']]], [1370, 6, 's', [], [[3, 'ball']]], [2780, 11, 'v', [2], [[7, 'star']]], [4100, 9, 's', [], [[5, 'heart']]], [4960, 8, 'v']];
const HALL_DOORS = { room10: -1240, krump: 1190, restroom: 3920 };
const hallScale = (y) => Math.round(500 * (y + 140) / 1100) / 1000;
// the cheap student crowd of the side view (deterministic): at the lockers + walking on the back line
function hallCrowd(t, o = {}) {
  const k = bool01(o.crowd), sc = bool01(o.scatter);
  if (k <= 0) return [];
  const list = [];
  const gaps = [[-2900, -1400], [-1400, -1080], [1000, 1440], [2100, 2760], [3740, 4100]];
  let i = 0;
  for (let x = -3200; x < 5500; x += 230 + 120 * hash(i * 1.7), i++) {
    if (gaps.some(([a, b]) => x > a && x < b)) continue;
    if (hash(i * 5.1 + 2) > k) continue;
    const y = 836 + Math.round(hash(i * 2.9) * 26) - sc * 18;
    const s = hallScale(y);
    const walking = hash(i * 7.7) < 0.35 && sc < 0.3;
    const p = { x: Math.round(x), y, s, i: i * 3 + 5, view: !walking && hash(i * 3.3) < 0.22 ? 'back' : 'front', look: hash(i * 9.1) - 0.5 };
    if (walking) { const dir = hash(i * 4.4) < 0.5 ? -1 : 1; p.pose = 'walk'; p.ph = i; p.x = Math.round(md(x + dir * t * 70 + 3300, 8800) - 3300); }
    if (sc > 0) { p.scared = sc; p.look = 0.8; p.lean = -6 * sc; }
    list.push(p);
  }
  return list;
}
function hallSideLayers(t, cam = {}, o = {}) {
  const [vx0, vx1, , vy1] = viewRect(cam, 1, 160);
  // ---------- bg: the courtyard (k .5)
  let bg = R(-4600, -1800, 9200, 3200, 0, { fill: 'url(#stSkyDay)' });
  for (const [cx, cy, cs, sp] of [[-3000, 150, 0.9, 9], [-1900, 260, 0.6, 12], [-900, 120, 0.8, 8], [400, 210, 0.7, 11], [1500, 140, 0.9, 9]]) bg += cloud(md(cx + t * sp + 4000, 7600) - 4000, cy, cs);
  bg += P('M-4600 560 Q-3000 470 -1800 540 Q-600 600 600 520 Q1800 470 3000 540 L3000 1400 L-4600 1400 Z', { fill: '#A9DCA0' });
  bg += R(-4600, 640, 7600, 900, 0, { fill: '#86CC7E' }) + R(-4600, 630, 7600, 14, 0, { fill: '#6FBA68' });
  bg += R(-3400, 470, 1400, 180, 0, { fill: '#D98C6C', stroke: LINE, 'stroke-width': 4 }) + R(-3400, 470, 1400, 180, 0, { fill: 'url(#stWinPane)', opacity: 0.5 }) + R(-3420, 452, 1440, 24, 4, ol('#F2E6D6', 4));
  for (const [tx, ts, kk] of [[-2950, 0.7, 'round'], [-2200, 0.55, 'tall'], [-1650, 0.75, 'round'], [-900, 0.6, 'tall'], [-200, 0.7, 'round'], [700, 0.6, 'tall']]) bg += tree(tx, 700, ts, { kind: kk, sway: Math.sin(t * 1.3 + tx) * 1.5 });
  bg += G(R(-90, -60, 180, 16, 5, ol('#C98A52', 4)) + R(-90, -30, 180, 14, 5, ol('#C98A52', 4)) + P('M-70 -16 V20 M70 -16 V20', ln(8, '#5A5470')), tr(-2300, 760, 0.8)) + bush(-2600, 780, 0.7) + bush(-1500, 790, 0.6, '#5CB86A');
  // ---------- mid
  let m = '';
  const W = HL.x1 - HL.x0;
  m += P(`M${HL.x0} ${YT} H${HL.x1} V${HL.base + 10} H${HL.x0} Z ` + HALL_WIN.map(([a, b]) => `M${a} 210 V760 H${b} V210 Z`).join(' '), { fill: CREAM, 'fill-rule': 'evenodd' });
  m += R(HL.x0, 150, W, 26, 0, { fill: '#F7E7CB' });
  // ceiling + lights
  m += R(HL.x0, YT, W, HL.ceil - YT, 0, { fill: 'url(#stCeil)' }) + R(HL.x0, 90, W, 22, 0, { fill: '#E6DFD3' });
  let lights = '';
  for (let x = HL.x0 + 160; x < HL.x1; x += 520) lights += R(x - 150, 50, 300, 36, 8, { fill: '#FFFFFF', stroke: '#B7AECB', 'stroke-width': 4 }) + P(`M${x - 130} 62 H${x + 130} M${x - 130} 74 H${x + 130}`, ln(3, '#ECE6F6'));
  m += lights + R(HL.x0, 112, W, 16, 0, { fill: PUR }) + R(HL.x0, 128, W, 7, 0, { fill: GOLD }) + P(`M${HL.x0} 112 H${HL.x1} M${HL.x0} 135 H${HL.x1}`, ln(3.5, LINE, 0.7));
  // courtyard windows
  for (const [a, b] of HALL_WIN) {
    m += R(a - 16, 194, b - a + 32, 582, 10, { fill: 'none', stroke: '#FFFFFF', 'stroke-width': 20 }) + R(a - 26, 184, b - a + 52, 602, 12, ln(5)) + R(a, 210, b - a, 550, 0, ln(4));
    m += P(`M${(a + b) / 2} 210 V760 M${a} 400 H${b}`, ln(14, '#FFFFFF')) + P(`M${(a + b) / 2} 210 V760 M${a} 400 H${b}`, ln(3, LINE, 0.35));
    m += P(`M${a + 30} 740 L${a + 150} 420 L${a + 190} 420 L${a + 70} 740 Z M${b - 120} 380 L${b - 70} 230 L${b - 52} 230 L${b - 102} 380 Z`, { fill: '#FFFFFF', opacity: 0.22 });
  }
  m += R(HALL_WIN[0][0] - 40, 766, HALL_WIN[2][1] - HALL_WIN[0][0] + 80, 30, 6, ol('#E8DCC6', 5));
  m += G(R(-300, -86, 600, 22, 6, ol('#C98A52', 5)) + R(-300, -52, 600, 20, 6, ol('#B77B46', 5)) + P('M-260 -30 V0 M260 -30 V0', ln(12)) + P('M-260 -30 V0 M260 -30 V0', ln(6, '#6A6288')), tr(-2170, 800));
  // locker banks
  for (const [x0, n, c, open, st] of HALL_BANKS) m += lockerBank(x0, n, HL.lockTop, HL.base, { col: c, open: open || [], stickers: st || [] });
  // doors
  m += hallDoor(HALL_DOORS.room10, 806, { label: 'ROOM 10', name: 'SCIENCE LAB', open: 0, col: '#B98352' });
  m += hallDoor(HALL_DOORS.krump, 806, { label: 'ROOM 12', name: 'MRS. KRUMP', open: o.doorOpen, inside: '#CFDDF0' });
  m += hallDoor(HALL_DOORS.restroom, 806, { label: 'BOYS', restroom: true, open: o.restroomOpen, col: '#8A70EA', inside: '#BFE2CB' });
  // bulletin board (cork) + notes
  {
    let bb = R(-240, -100, 480, 210, 8, ol('#B97A44', 6)) + R(-226, -86, 452, 182, 4, { fill: 'url(#stCork)' });
    bb += poster(['LOST:', 'GERALD', 'reward: 1 cookie'], -140, 0, { w: 140, h: 160, col: '#FFF59A', icon: 'hamster', rot: -4, tape: false, size: 22 }) + CI(-140, -74, 6, ol('#FF4D5A', 2.5));
    bb += poster(['CHESS', 'CLUB'], 20, -20, { w: 120, h: 110, col: '#FFFFFF', icon: 'chess', rot: 3, tape: false, size: 24 }) + CI(20, -70, 6, ol('#3E7BD8', 2.5));
    bb += poster(['BAKE', 'SALE!'], 150, 10, { w: 120, h: 130, col: '#FFC6DA', icon: 'cupcake', rot: -2, tape: false, size: 24 }) + CI(150, -50, 6, ol(GOLD, 2.5));
    m += G(bb, tr(-650, 290));
  }
  // posters + clock + signs (upper wall, kept clear of the plate zone y 330..470 where possible)
  m += poster(['SCIENCE FAIR', 'FRIDAY!', 'IN THE GYM'], 300, 290, { w: 240, h: 230, col: '#FFFFFF', head: PUR, icon: 'volcano', rot: -2 });
  m += wallClock(955, 205, 46, o.clock ?? '8:05', { t });
  m += poster(['HOMEWORK', 'IS DUE.', '— K.'], 955, 346, { w: 130, h: 120, col: '#FFFFFF', ink: '#C0262E', rot: 3, size: 24 });
  m += poster(['BE KIND', "IT'S FREE"], 1650, 250, { w: 230, h: 170, col: '#FFC6DA', icon: 'heart', rot: 2 });
  m += poster(['DODGEBALL', 'TODAY · GYM'], 3340, 262, { w: 240, h: 170, col: '#FFD9A8', icon: 'ball', rot: -3 });
  m += poster(['READ', 'MORE!'], 3650, 250, { w: 170, h: 170, col: '#CDEBC9', icon: 'book', rot: 3 });
  m += G(R(-150, -44, 300, 88, 12, ol(PUR, 5)) + TF('CAFETERIA', -24, 14, 34, '#FFFFFF') + G(icon('arrow'), 'translate(104 0) scale(0.8)'), tr(4560, 250));
  m += poster(['OWLS', 'SEE', 'EVERYTHING'], 5300, 260, { w: 220, h: 190, col: GOLD, icon: 'owl', rot: -2 });
  m += G(R(-60, -24, 120, 48, 8, ol('#FFFFFF', 4)) + T('EXIT', 0, 14, 34, '#E8333C'), tr(-1450, 100));
  m += G(R(-22, -32, 44, 64, 8, ol('#E8443C', 4)) + R(-12, -14, 24, 18, 3, ol('#FFFFFF', 2.5)) + TF('PULL', 0, 22, 11, '#FFFFFF'), tr(-60, 560)) + G(R(-26, -50, 52, 100, 8, ol('#E8443C', 4)) + R(-18, -20, 36, 56, 6, { fill: '#FFFFFF', opacity: 0.3 }), tr(1010, 640));
  // water fountain (bottle filler)
  m += G(R(-46, -330, 92, 150, 12, ol('#DDE2EA', 5)) + R(-30, -310, 60, 60, 8, { fill: '#4FA6E8' }) + TF('FILL', 0, -270, 18, '#FFFFFF') + P('M0 -250 V-214', ln(6, '#9FD8FF')) +
    R(-70, -170, 140, 46, 16, ol('url(#stSteel)', 5)) + P('M-40 -170 Q-24 -200 -6 -176', ln(5, '#7FD0FF')) + R(-26, -124, 52, 110, 6, ol('#BCC4D2', 4)), tr(1995, 800));
  m += trophyCase(2130, 2730, 330, 800);
  // floor: checker in perspective (the vanishing point follows the camera)
  const fy1 = Math.max(1300, vy1 + 60);
  m += R(vx0, HL.base, vx1 - vx0, fy1 - HL.base, 0, { fill: '#EEE8F4' });
  {
    const vpx = (cam.x || 0) + 960, vpy = -140, Hh = HL.base - vpy, tile = 140;
    const rows = [];
    for (let i = 0; i < 40; i++) { const dp = 1 - i * 0.08; if (dp <= 0.12) break; const y = vpy + Hh / dp; rows.push(y); if (y > fy1) break; }
    let d = '';
    for (let r = 0; r < rows.length - 1; r++) {
      const ya = rows[r], yb = rows[r + 1], ka = (ya - vpy) / Hh, kb = (yb - vpy) / Hh;
      const Xa = vpx + (vx0 - vpx) / ka, Xb = vpx + (vx1 - vpx) / ka;
      for (let c = Math.floor(Xa / tile) - 1; c <= Math.ceil(Xb / tile); c++) {
        if (md(c + r, 2)) continue;
        const X0 = c * tile, X1 = X0 + tile;
        d += quadD([vpx + (X0 - vpx) * ka, ya], [vpx + (X1 - vpx) * ka, ya], [vpx + (X1 - vpx) * kb, yb], [vpx + (X0 - vpx) * kb, yb]);
      }
    }
    m += P(d, { fill: '#DFD6EC' });
  }
  m += R(vx0, HL.base, vx1 - vx0, 44, 0, { fill: '#3A2E6A', opacity: 0.08 });
  let refl = '';
  for (const [x0, n, c] of HALL_BANKS) refl += R(x0, HL.base + 10, n * 92, 46, 0, { fill: LOCK[c].col, opacity: 0.16 });
  for (let x = HL.x0 + 160; x < HL.x1; x += 520) refl += E(x, 905, 170, 16, { fill: '#FFFFFF', opacity: 0.5 });
  m += refl + R(HL.x0, HL.base - 2, W, 12, 0, { fill: '#3A2E6A' }) + P(`M${HL.x0} ${HL.base + 10} H${HL.x1}`, ln(3, LINE, 0.6));
  for (const [a, b] of HALL_WIN) m += P(`M${a} 806 L${b} 806 L${b + 520} 1300 L${a + 360} 1300 Z`, { fill: 'url(#stBeam)', opacity: 0.45 });
  const dk = bool01(o.doorOpen);
  if (dk > 0) m += P(`M${HALL_DOORS.krump - 125} 808 L${HALL_DOORS.krump + 125} 808 L${HALL_DOORS.krump + 240} 1020 L${HALL_DOORS.krump - 180} 1020 Z`, { fill: 'url(#stBeam)', opacity: f(0.75 * dk) });
  // cheap crowd at the lockers
  m += people(hallCrowd(t, o), { t, scared: bool01(o.scatter) });
  // ---------- fg: hanging banners (k 1.12) + pillars (k 1.3)
  let ban = '';
  for (const bx of [690, 2950, -1900]) {
    const sw = Math.sin(t * 1.4 + bx) * 1.2;
    let b = P('M-200 0 V-30 M200 0 V-30', ln(4, '#6A6288')) + P('M-220 0 H220 V78 L180 98 L140 78 L100 98 L60 78 L20 98 L-20 78 L-60 98 L-100 78 L-140 98 L-180 78 L-220 98 Z', ol(PUR, 5));
    b += P('M-220 9 H220', ln(6, GOLD)) + T(o.banner || 'GO OWLS!', 34, 64, 46, GOLD, OUTL(7, PUR_D)) + owl(-160, 46, 0.34);
    ban += G(b, `translate(${bx} 132) rotate(${f(sw)})`);
  }
  let pil = '';
  if (o.pillars !== false) for (const px of [-1250, 2150, 4400]) pil += R(px - 80, -1200, 160, 3400, 0, ol('#F6ECD8', 7)) + R(px + 30, -1200, 50, 3400, 0, { fill: '#000000', opacity: 0.08 }) + R(px - 86, 980, 172, 1220, 6, ol(PUR, 7)) + R(px - 86, 970, 172, 22, 4, ol(GOLD, 5));
  // ---------- light
  let light = '';
  return { bg: layer(bg, cam, 0.5), mid: layer(m, cam, 1), front: '', fg: layer(ban, cam, 1.12) + layer(pil, cam, 1.3), light: layer(light, cam, 1) };
}

// ---------------- DEEP view geometry: depth D (1/k); near plane half-width 820, floor +760, ceiling -700 (from VP 960, 420)
const DV = { x: 960, y: 420, w: 820, fl: 760, ce: -700, lt: 246, dt: -130, far: 5.9, near: 0.4 };
const dX = (side, D, off = 0) => DV.x + (side * DV.w + off) / D;
const dY = (yo, D) => DV.y + yo / D;
const wallQ = (side, a, b, y0, y1) => quadD([dX(side, a), dY(y0, a)], [dX(side, b), dY(y0, b)], [dX(side, b), dY(y1, b)], [dX(side, a), dY(y1, a)]);
const deepScale = (y) => Math.round(500 * (y - DV.y) / 540) / 1000;
const deepAt = (D, off = 0) => { const y = dY(DV.fl, D); return { x: Math.round(dX(0, D, off)), y: Math.round(y), s: deepScale(y) }; };
const DEEP_L = [[0.4, 1.62, 'v'], [2.12, 3.55, 's'], [3.95, 5.9, 'v']], DEEP_R = [[0.4, 1.3, 's'], [2.05, 3.2, 'v'], [3.95, 5.9, 's']];
function deepLockers(side, a, b, col) {
  const C = LOCK[col];
  let o = P(wallQ(side, a, b, DV.lt, DV.fl), { fill: C.col }) + P(wallQ(side, a, b, DV.lt - 20, DV.lt), { fill: C.cap }) + P(wallQ(side, a, b, DV.fl - 26, DV.fl), { fill: '#2E2650' });
  const n = Math.max(1, Math.round((b - a) / 0.16)), st = (b - a) / n;
  let d = '', v = '', hl = '';
  for (let i = 0; i <= n; i++) { const D = a + i * st; d += `M${pt(dX(side, D), dY(DV.lt, D))} L${pt(dX(side, D), dY(DV.fl - 26, D))} `; }
  d += `M${pt(dX(side, a), dY(503, a))} L${pt(dX(side, b), dY(503, b))} `;
  for (let i = 0; i < n; i++) {
    const D0 = a + (i + 0.28) * st, D1 = a + (i + 0.72) * st;
    if (D0 < 3.2) for (const yo of [282, 304, 540, 562]) v += `M${pt(dX(side, D0), dY(yo, D0))} L${pt(dX(side, D1), dY(yo, D1))} `;
    const Dh = a + (i + (side < 0 ? 0.86 : 0.14)) * st;
    if (Dh < 3) hl += `M${pt(dX(side, Dh), dY(430, Dh))} L${pt(dX(side, Dh), dY(470, Dh))} M${pt(dX(side, Dh), dY(680, Dh))} L${pt(dX(side, Dh), dY(715, Dh))} `;
  }
  o += P(d, ln(3, C.dark)) + P(v, ln(3, C.dark)) + P(hl, ln(4, '#EEEAF6'));
  o += P(wallQ(side, a, b, DV.lt - 20, DV.fl), { fill: 'none', stroke: LINE, 'stroke-width': 4, 'stroke-linejoin': 'round' });
  return o;
}
function deepDoor(side, a, b, o = {}) {
  const k = bool01(o.open);
  let s = P(wallQ(side, a - 0.05, b + 0.05, DV.dt - 40, DV.fl), ol('#F7F1E6', 4));
  if (k > 0) {
    s += P(wallQ(side, a, b, DV.dt, DV.fl), { fill: '#FFE6B0' }) + P(wallQ(side, a, b, DV.dt, DV.fl), { fill: o.inside || '#CFDDF0', opacity: f(1 - 0.5 * k) });
    s += P(wallQ(side, a, a + (b - a) * (1 - k * 0.85), DV.dt, DV.fl), ol(o.col || '#C98A52', 3.5));
  } else {
    s += P(wallQ(side, a, b, DV.dt, DV.fl), ol(o.col || '#C98A52', 4));
    if (o.restroom) s += P(wallQ(side, a + (b - a) * 0.3, a + (b - a) * 0.7, 40, 180), ol('#3E7BD8', 3));
    else s += P(wallQ(side, a + (b - a) * 0.14, a + (b - a) * 0.36, DV.dt + 60, DV.dt + 330), ol('#C7E6FF', 3));
    const Dh = a + (b - a) * 0.86;
    s += P(`M${pt(dX(side, Dh), dY(380, Dh))} L${pt(dX(side, Dh), dY(420, Dh))}`, ln(Math.max(3, 9 / Dh), '#D9DEE8'));
  }
  s += P(wallQ(side, a + (b - a) * 0.15, a + (b - a) * 0.85, DV.dt - 140, DV.dt - 70), ol('#3A2E6A', 3)) + P(wallQ(side, a + (b - a) * 0.15, a + (b - a) * 0.85, DV.dt - 140, DV.dt - 128), { fill: GOLD });
  return s;
}
// cheap crowd of the deep view: pressed to the walls + walking in the middle (scatter moves walkers to the walls)
function deepCrowd(t, o = {}) {
  const k = bool01(o.crowd), sc = bool01(o.scatter);
  if (k <= 0) return [];
  const out = [];
  const spots = [[1.5, 1], [1.62, -1], [2.35, 1], [2.6, -1], [2.95, 1], [3.3, -1], [4.25, -1], [4.5, 1], [5.2, -1], [5.4, 1]];
  spots.forEach(([D, side], i) => {
    if (hash(i * 3.7 + 1) > k) return;
    const p = deepAt(D, side * (DV.w - 130 - 30 * sc));
    out.push({ ...p, i: i * 5 + 2, view: 'front', look: -side * 0.8, scared: sc, lean: side * 5 * sc });
  });
  for (let i = 0; i < 4; i++) {
    if (hash(i * 6.1 + 4) > k) continue;
    const D = 2.1 + md(i * 0.71 + t * 0.1 * (i % 2 ? 1 : -1), 2.6);
    const side = i % 2 ? 1 : -1;
    const off = lerp(side * (260 + 90 * (i % 3)), side * (DV.w - 160), sc);
    out.push({ ...deepAt(D, off), i: i * 7 + 40, pose: sc > 0.5 ? undefined : 'walk', ph: i * 1.3, view: i % 2 ? 'back' : 'front', scared: sc, look: -side * 0.6 * sc });
  }
  return out;
}
function hallDeepLayers(t, cam = {}, o = {}) {
  let m = R(-1600, -1200, 5200, 3600, 0, { fill: CREAM });
  const N = 0.32, F = DV.far;
  // ceiling
  m += P(quadD([dX(-1, N), dY(DV.ce, N)], [dX(-1, F), dY(DV.ce, F)], [dX(1, F), dY(DV.ce, F)], [dX(1, N), dY(DV.ce, N)]), { fill: '#F2EEE7' });
  let cg = '';
  for (let j = -3; j <= 3; j++) cg += `M${pt(dX(0, N, j * 270), dY(DV.ce, N))} L${pt(dX(0, F, j * 270), dY(DV.ce, F))} `;
  for (let D = 0.5; D < F; D += 0.32) cg += `M${pt(dX(-1, D), dY(DV.ce, D))} L${pt(dX(1, D), dY(DV.ce, D))} `;
  m += P(cg, ln(2.5, '#D6CEC2'));
  let lt = '';
  for (let D = 0.9; D < F - 0.3; D += 0.72) lt += quadD([dX(0, D, -200), dY(DV.ce, D)], [dX(0, D, 200), dY(DV.ce, D)], [dX(0, D + 0.22, 200), dY(DV.ce, D + 0.22)], [dX(0, D + 0.22, -200), dY(DV.ce, D + 0.22)]);
  m += P(lt, { fill: '#FFFFFF', stroke: '#B7AECB', 'stroke-width': 3 });
  // walls (cream) + top trim
  for (const side of [-1, 1]) {
    m += P(wallQ(side, N, F, DV.ce, DV.fl), { fill: CREAM }) + P(wallQ(side, N, F, DV.ce, DV.ce + 70), { fill: PUR }) + P(wallQ(side, N, F, DV.ce + 70, DV.ce + 88), { fill: GOLD });
    m += P(wallQ(side, N, F, DV.ce, DV.fl), { fill: 'none', stroke: LINE, 'stroke-width': 3 });
  }
  // far end: bright double doors + EXIT
  {
    const xl = dX(-1, F), xr = dX(1, F), yt = dY(DV.ce, F), yb = dY(DV.fl, F);
    m += R(xl, yt, xr - xl, yb - yt, 0, { fill: '#F7E9CF' }) + R(xl, yt, xr - xl, (DV.ce + 88 - DV.ce) / F, 0, { fill: PUR });
    const dl = dX(0, F, -470), dr = dX(0, F, 470), dt = dY(-60, F);
    m += glow((dl + dr) / 2, (dt + yb) / 2, 220, 160, '#FFF6D8', 1.2);
    m += R(dl - 6, dt - 6, dr - dl + 12, yb - dt + 6, 3, ol('#F4EEE2', 3)) + R(dl, dt, (dr - dl) / 2, yb - dt, 2, ol(PUR, 2.5)) + R((dl + dr) / 2, dt, (dr - dl) / 2, yb - dt, 2, ol(PUR, 2.5));
    m += R(dl + 8, dt + 8, (dr - dl) / 2 - 16, (yb - dt) * 0.5, 2, { fill: '#FFFBEA' }) + R((dl + dr) / 2 + 8, dt + 8, (dr - dl) / 2 - 16, (yb - dt) * 0.5, 2, { fill: '#FFFBEA' });
    m += R(dl + 4, dt + (yb - dt) * 0.62, dr - dl - 8, 5, 2, { fill: '#D9DEE8' });
    m += R((dl + dr) / 2 - 24, dt - 26, 48, 16, 3, ol('#FFFFFF', 2)) + TF('EXIT', (dl + dr) / 2, dt - 13, 12, '#E8333C');
  }
  // floor (checker)
  m += P(quadD([dX(-1, N), dY(DV.fl, N)], [dX(-1, F), dY(DV.fl, F)], [dX(1, F), dY(DV.fl, F)], [dX(1, N), dY(DV.fl, N)]), { fill: '#EEE8F4' });
  {
    let d = '';
    const lanes = 6, lw = (2 * DV.w) / lanes, step = 0.31;
    let r = 0;
    for (let D = F; D > N - step; D -= step, r++) {
      const D0 = Math.max(N * 0.8, D - step);
      for (let j = 0; j < lanes; j++) {
        if (md(j + r, 2)) continue;
        const e0 = -DV.w + j * lw, e1 = e0 + lw;
        d += quadD([dX(0, D, e0), dY(DV.fl, D)], [dX(0, D, e1), dY(DV.fl, D)], [dX(0, D0, e1), dY(DV.fl, D0)], [dX(0, D0, e0), dY(DV.fl, D0)]);
      }
    }
    m += P(d, { fill: '#DFD6EC' });
  }
  // floor shine: light from the far doors + under the ceiling lights
  m += P(quadD([dX(0, F, -380), dY(DV.fl, F)], [dX(0, F, 380), dY(DV.fl, F)], [dX(0, 0.6, 520), dY(DV.fl, 0.6)], [dX(0, 0.6, -520), dY(DV.fl, 0.6)]), { fill: 'url(#stDeepLight)', opacity: 0.8 });
  let sh = '';
  for (let D = 0.9; D < F - 0.3; D += 0.72) sh += elD(dX(0, D + 0.1), dY(DV.fl, D + 0.1), 260 / D, 22 / D) + ' ';
  m += P(sh, { fill: '#FFFFFF', opacity: 0.45 });
  // lockers, doors, trophy case, fountain, posters
  for (const [a, b, c] of DEEP_L) m += deepLockers(-1, a, b, c);
  for (const [a, b, c] of DEEP_R) m += deepLockers(1, a, b, c);
  m += deepDoor(-1, 1.65, 2.09, { open: o.doorOpen }) + deepDoor(-1, 3.58, 3.92, { col: '#B98352' }) + deepDoor(1, 3.5, 3.9, { restroom: true, col: '#8A70EA', open: o.restroomOpen, inside: '#BFE2CB' });
  {
    const a = 1.35, b = 2.0;
    m += P(wallQ(1, a, b, DV.dt + 20, DV.fl), ol('#B97A44', 4)) + P(wallQ(1, a + 0.03, b - 0.03, DV.dt + 50, 520), { fill: '#6A58B8' }) + P(wallQ(1, a, b, DV.dt - 60, DV.dt + 4), ol(PUR, 3));
    for (const yo of [140, 330]) m += P(`M${pt(dX(1, a + 0.03), dY(yo, a + 0.03))} L${pt(dX(1, b - 0.03), dY(yo, b - 0.03))}`, ln(5, '#E8F4FF'));
    for (const [D, yo, kk] of [[1.45, 140, 'cup'], [1.62, 140, 'star'], [1.82, 140, 'cup'], [1.5, 330, 'figure'], [1.72, 330, 'plaque'], [1.9, 330, 'medal']]) m += trophy(kk, dX(1, D, -6), dY(yo, D), 1.05 / D);
    m += P(wallQ(1, a + 0.03, b - 0.03, DV.dt + 50, 520), { fill: 'url(#stSheen)', opacity: 0.8 }) + P(wallQ(1, a + 0.03, b - 0.03, DV.dt + 50, 520), { fill: 'none', stroke: '#2A2246', 'stroke-width': 3 });
  }
  {
    const D = 3.3;
    m += P(wallQ(1, D, D + 0.12, 360, 420), ol('#CDD3DE', 3)) + P(wallQ(1, D + 0.02, D + 0.1, 420, 600), ol('#B8C0CE', 2.5));
  }
  const wallPoster = (side, a, b, y0, y1, col, stripe) => P(wallQ(side, a, b, y0, y1), ol(col, 3)) + P(wallQ(side, a + (b - a) * 0.12, b - (b - a) * 0.12, y0 + (y1 - y0) * 0.14, y0 + (y1 - y0) * 0.34), { fill: stripe });
  m += wallPoster(-1, 0.75, 1.05, -380, -90, '#FFFFFF', PUR) + wallPoster(-1, 2.4, 2.75, -400, -140, '#FFC6DA', '#FF6F91') + wallPoster(-1, 4.3, 4.7, -380, -120, '#FFD9A8', '#FF8A3D');
  m += wallPoster(1, 0.62, 0.86, -360, -60, '#CDEBC9', '#3E9E5A') + wallPoster(1, 2.3, 2.62, -380, -100, '#FFFFFF', '#3E7BD8') + wallPoster(1, 4.4, 4.8, -400, -150, GOLD, PUR);
  // the banner across the hall
  {
    const D = 2.6, sw = Math.sin(t * 1.3) * 0.8;
    const bl = dX(-1, D, 90), br = dX(1, D, -90), by = dY(DV.ce + 90, D), bh = 250 / D;
    let b = P(`M${f(bl + 30)} ${f(dY(DV.ce, D))} V${f(by)} M${f(br - 30)} ${f(dY(DV.ce, D))} V${f(by)}`, ln(3, '#6A6288'));
    b += R(bl, by, br - bl, bh, 6, ol(PUR, 4)) + R(bl, by + 6, br - bl, 6, 0, { fill: GOLD }) + T(o.banner || 'GO OWLS!', (bl + br) / 2 + 26, by + bh * 0.74, bh * 0.62, GOLD, OUTL(6, PUR_D)) + owl(bl + 70, by + bh * 0.52, bh / 190);
    m += G(b, `rotate(${f(sw)} ${f((bl + br) / 2)} ${f(by)})`);
  }
  let light = '';
  if (bool01(o.doorOpen) > 0) m += P(quadD([dX(-1, 1.65), dY(DV.fl, 1.65)], [dX(-1, 2.09), dY(DV.fl, 2.09)], [dX(0, 2.0, -200), dY(DV.fl, 2.0)], [dX(0, 1.6, -260), dY(DV.fl, 1.6)]), { fill: 'url(#stBeam)', opacity: f(0.7 * bool01(o.doorOpen)) });
  m += people(deepCrowd(t, o), { t, scared: bool01(o.scatter) });
  return { bg: '', mid: layer(m, cam, 1), front: '', fg: '', light: layer(light, cam, 1) };
}
const hallway = makeCamSet((t, cam = {}, o = {}) => (o.view === 'deep' ? hallDeepLayers(t, cam, o) : hallSideLayers(t, cam, o)));
hallway.crowdAt = (t, o = {}) => (o.view === 'deep' ? deepCrowd(t, o) : hallCrowd(t, o));

// ================================================================= 1b. MIRROR — the boys' room
// view 'over' (default): over the hero's shoulder into the long wall mirror (glass x 300..1620, y 110..620). The mirror
// shows the reflected restroom (stalls, hand dryer, door). Draw the REFLECTION (flipped hero, SPOTS.mirror.reflection)
// clipped by the static clip path: S.g(svg, null, {'clip-path': 'url(#stMirrorClip)'}) — in the same camera group.
// Order: mid · [reflection, clipped] · frontRows[0] (frame, glare, sticky note) · frontRows[1] (counter + sinks) ·
//   [hero from behind, SPOTS.mirror.hero] · light.  compose(t, o, [reflection], hero, cam) does exactly this.
// view 'face': the camera IS the mirror: the hero faces us across the sink, the restroom behind him; the mirror frame
//   rims the screen (fg). Order: mid · [hero] · front (counter edge) · fg (frame) · light.
// o: { view, flicker 0..1 (the light buzzes), note (sticky note text, default 'YOU LOOK GREAT :)') | false }
const MIR = { x0: 300, x1: 1620, y0: 110, y1: 620 };
function restroomBack(x0, x1, yFloor, s = 1) {
  // stalls + tiles + hand dryer, used for the reflection and the face view (origin-free, world coords)
  let o = R(x0, -400, x1 - x0, yFloor + 400, 0, { fill: '#E7E2F0' }) + R(x0, yFloor - 470 * s, x1 - x0, 470 * s, 0, { fill: 'url(#stBathTile)' }) + R(x0, yFloor - 486 * s, x1 - x0, 18 * s, 0, { fill: PUR });
  o += R(x0, yFloor, x1 - x0, 900, 0, { fill: '#B7C3CF' }) + R(x0, yFloor, x1 - x0, 14 * s, 0, { fill: '#8C98A8' });
  return o;
}
function stall(x, yFloor, s, open = 0) {
  const w = 230 * s, h = 520 * s, top = yFloor - h - 50 * s;
  let o = R(x - 8 * s, top - 20 * s, w + 16 * s, h + 20 * s, 4 * s, ol('#6A52CC', 4)) + R(x, top, w, h, 4 * s, ol(open ? '#3A3456' : '#8A70EA', 4));
  if (!open) o += R(x + w * 0.78, top + h * 0.45, 12 * s, 26 * s, 3, ol('#D9DEE8', 2.5)) + R(x + w * 0.66, top + h * 0.42, 24 * s, 10 * s, 3, { fill: '#3FBF6A' });
  o += R(x, yFloor - 50 * s, 10 * s, 50 * s, 2, { fill: '#9AA4B4' }) + R(x + w - 10 * s, yFloor - 50 * s, 10 * s, 50 * s, 2, { fill: '#9AA4B4' });
  return o;
}
function mirrorLayers(t, o = {}) {
  const fl = bool01(o.flicker);
  const flick = fl > 0 && Math.sin(t * 37) * Math.sin(t * 11.3) > 0.55 ? 1 : 0;
  if (o.view === 'face') {
    let m = restroomBack(XL, XR, 820, 1);
    for (const [x, op] of [[180, 0], [470, 1], [760, 0]]) m += stall(x, 820, 1, op);
    m += R(1280, 160, 300, 620, 8, ol('#F7F1E6', 6)) + R(1300, 180, 260, 600, 4, ol('#8A70EA', 5)) + R(1330, 380, 120, 120, 8, ol('#3E7BD8', 4)) + CI(1390, 410, 12, { fill: '#FFFFFF' }) + P('M1368 486 L1368 442 Q1390 426 1412 442 L1412 486', ln(8, '#FFFFFF')) + R(1500, 480, 34, 14, 5, ol('#D9DEE8', 3));
    m += G(R(-70, -60, 140, 110, 18, ol('#E8ECF2', 5)) + R(-50, 50, 100, 22, 6, ol('#BCC4D2', 4)) + TF('PUSH', 0, 0, 22, '#5A5470') + CI(0, 26, 8, { fill: '#5A5470' }), tr(1760, 470));
    m += G(R(-90, -40, 180, 80, 10, ol('#FFFFFF', 4)) + TF('WASH YOUR', 0, -6, 24, PUR) + TF('HANDS!', 0, 22, 24, PUR), tr(1060, 260, 1, -3));
    m += R(XL, YT, XR - XL, 60 - YT, 0, { fill: '#F2EEE7' }) + R(200, 20, 1500, 40, 10, { fill: '#FFFFFF', stroke: '#B7AECB', 'stroke-width': 4 });
    let fr = R(XL, 920, XR - XL, 60, 0, ol('#F4F6FA', 6)) + R(XL, 980, XR - XL, 400, 0, ol('#E2E6EE', 6)) + E(960, 950, 300, 24, ol('#D3DAE4', 5)) + E(960, 954, 250, 14, { fill: '#B7C0CE' }) + P('M960 1060 V1000 Q960 974 930 974 H906', ln(20)) + P('M960 1060 V1000 Q960 974 930 974 H906', ln(11, '#D8DEE8'));
    fr += G(R(-30, -96, 60, 96, 12, ol('#FF8FB0', 4)) + R(-12, -120, 24, 26, 4, ol('#FFFFFF', 3)), tr(1460, 950));
    const th = 70;
    let fg = P(`M-200 -200 H2120 V1280 H-200 Z M${th} ${th} V${1080 - th} H${1920 - th} V${th} Z`, { fill: '#C7CEDA', 'fill-rule': 'evenodd' }) + R(th, th, 1920 - 2 * th, 1080 - 2 * th, 18, ln(7)) + R(th - 20, th - 20, 1920 - 2 * th + 40, 1080 - 2 * th + 40, 26, ln(5, '#FFFFFF', 0.6));
    fg += P('M140 600 L420 120 L520 120 L240 600 Z M1500 1000 L1780 520 L1820 520 L1540 1000 Z', { fill: '#FFFFFF', opacity: 0.14 });
    let light = flick ? R(-500, -500, 2920, 2080, 0, { fill: '#1A1630', opacity: 0.25 }) : '';
    return { bg: '', mid: m, front: fr, fg, light, frontRows: [fr] };
  }
  const M = MIR, w = M.x1 - M.x0, h = M.y1 - M.y0;
  let m = cover('#E7E2F0') + band(300, YB, 'url(#stBathTile)') + band(290, 310, PUR) + band(310, 318, GOLD);
  m += band(YT, 30, '#F2EEE7');
  // light fixture over the mirror
  m += R(520, 36, 880, 40, 12, { fill: flick ? '#CFCADB' : '#FFFFFF', stroke: '#B7AECB', 'stroke-width': 5 }) + (flick ? '' : glow(960, 70, 640, 80, '#FFF8E0', 0.8));
  // the glass: reflected restroom (clipped)
  let refl = restroomBack(M.x0 - 100, M.x1 + 100, 690, 0.62);
  refl += stall(380, 690, 0.62, 0) + stall(560, 690, 0.62, 1) + stall(740, 690, 0.62, 0);
  refl += R(1380, 300, 180, 390, 6, ol('#F7F1E6', 4)) + R(1392, 312, 156, 378, 3, ol('#8A70EA', 4)) + G(R(-46, -40, 92, 74, 12, ol('#E8ECF2', 4)) + R(-32, 34, 64, 14, 4, ol('#BCC4D2', 3)), tr(1250, 400));
  refl += R(M.x0, M.y0, w, h, 0, { fill: '#BFE6EA', opacity: 0.18 });
  m += R(M.x0, M.y0, w, h, 10, { fill: '#DCEFF0' }) + G(refl, null, { 'clip-path': 'url(#stMirrorClip)' });
  // the frame (drawn after the reflection)
  let frame = R(M.x0 - 22, M.y0 - 22, w + 44, h + 44, 16, { fill: 'none', stroke: '#C9D0DB', 'stroke-width': 26 }) + R(M.x0 - 36, M.y0 - 36, w + 72, h + 72, 22, ln(6)) + R(M.x0 - 8, M.y0 - 8, w + 16, h + 16, 12, ln(5)) + R(M.x0 - 30, M.y0 - 30, w + 60, 8, 4, { fill: '#FFFFFF', opacity: 0.6 });
  frame += P(`M${M.x0 + 40} ${M.y0 + 360} L${M.x0 + 230} ${M.y0} L${M.x0 + 330} ${M.y0} L${M.x0 + 80} ${M.y0 + 470} Z M${M.x1 - 260} ${M.y1} L${M.x1 - 40} ${M.y0 + 140} L${M.x1} ${M.y0 + 140} L${M.x1 - 200} ${M.y1} Z`, { fill: '#FFFFFF', opacity: 0.2 });
  if (o.note !== false) {
    const nw = String(o.note || 'YOU LOOK GREAT :)').split(' '), l1 = nw.slice(0, 2).join(' '), l2 = nw.slice(2).join(' ');
    frame += G(R(-70, -64, 140, 128, 4, ol('#FFF27A', 3)) + R(-70, -64, 140, 22, 3, { fill: '#F5DE4A' }) + TF(l1, 0, 4, 20, '#3A3456') + TF(l2, 0, 34, 20, '#3A3456'), tr(M.x1 - 120, M.y0 + 120, 1, 5));
  }
  // counter + sinks (in front of the reflection, behind the hero)
  let ct = R(XL, 640, XR - XL, 34, 6, ol('#F4F6FA', 6)) + R(XL, 674, XR - XL, 140, 0, ol('#E2E6EE', 6)) + R(XL, 674, XR - XL, 16, 0, { fill: '#000000', opacity: 0.08 });
  for (const sx of [600, 1320]) {
    ct += E(sx, 654, 150, 18, ol('#D3DAE4', 5)) + E(sx, 658, 120, 10, { fill: '#B7C0CE' });
    ct += P(`M${sx - 20} 648 V600 Q${sx - 20} 572 ${sx + 16} 572 H${sx + 40}`, ln(22)) + P(`M${sx - 20} 648 V600 Q${sx - 20} 572 ${sx + 16} 572 H${sx + 40}`, ln(12, '#DDE3EC')) + R(sx - 50, 620, 26, 18, 5, ol('#DDE3EC', 3)) + R(sx + 6, 620, 26, 18, 5, ol('#DDE3EC', 3));
    if (sx === 1320) { const dr = md(t * 1.6, 1); ct += E(sx + 40, 584 + dr * 60, 5, 7, { fill: '#9FD8FF', opacity: f(1 - dr) }); }
    ct += P(`M${sx - 40} 814 V880 Q${sx - 40} 920 ${sx} 920 Q${sx + 40} 920 ${sx + 40} 880 V840 H${sx + 110}`, ln(16, '#9AA4B4')) ;
  }
  ct += G(R(-28, -84, 56, 84, 10, ol('#FF8FB0', 4)) + R(-10, -108, 20, 26, 4, ol('#FFFFFF', 3)), tr(790, 642, 0.85));
  ct += G(R(-90, -150, 180, 220, 14, ol('#F2F4F8', 5)) + R(-70, 50, 140, 24, 4, ol('#FFFFFF', 3)) + TF('PAPER', 0, -60, 26, '#8A93A6'), tr(1800, 430));
  let light = flick ? R(-500, -500, 2920, 2080, 0, { fill: '#1A1630', opacity: 0.22 }) : '';
  return { bg: '', mid: m, front: frame + ct, fg: '', light, frontRows: [frame, ct] };
}
const mirror = makeSet(mirrorLayers);

// ================================================================= 2. CLASSROOM — Room 12, Mrs. Krump
// One wide view of the room: the green CHALKBOARD + Mrs. Krump's oak desk at the front-left, three rows of paired
// student tables on the right (kids face the camera; turn them a little left toward the board), windows with blinds on
// the back wall (the yard outside = bg, k .6), Gerald the hamster on the sill, the smart kids' table off-frame right
// (pan to cams.smart). Wall/floor junction y 700.
// Depth order: mid · row-3 kids · frontRows[0] (row-3 tables + row-2 chairs) · row-2 kids + teacher (behind her desk) ·
//   frontRows[1] (row-2 tables + the teacher's desk + row-1 chairs) · row-1 kids · frontRows[2] (row-1 tables + the smart
//   table) · [FLOOR-line characters: teacherFront] · light.   compose(t, o, [row3, row2 + teacher, row1 + smart], after, cam).
// o: { board: [lines] (chalk; default ['HOMEWORK', 'ON MY DESK.', 'NOW.']; quiz -> ['POP QUIZ!', '20 QUESTIONS']),
//      quiz (papers + pencils on every table, the hero's paper at SPOTS.classroom.quizPaper), clock ('9:15'),
//      outside (svg drawn in the window view, bg space — e.g. Benji alone on the yard bench, SPOTS.classroom.outside),
//      blinds 0..1 (how far the blinds are down, default .3), hamster (default true) }
const CR = {
  floor: 700,
  rows: [{ top: 640, s: 0.34, xs: [1100, 1660, 2220] }, { top: 748, s: 0.42, xs: [840, 1380, 1940] }, { top: 872, s: 0.5, xs: [1100, 1660, 2220] }],
  desk: { x0: 110, x1: 640, top: 768 },
  smart: { x: 2780, top: 820, s: 0.46 },
  win: [[1180, 1600], [1640, 2060], [2100, 2520]],
};
const CHAIR = ['#6B4FD8', '#3FBF8F', '#F7A43B', '#4F86F7', '#F26F8F'];
const seatOff = 112;
// rig feet y for a kid seated behind a table whose top is at `top` (belly at the table top)
const seatY = (top, s) => Math.round(top + 420 * s);
function chalkboard(x0, y0, w, h, lines, o = {}) {
  let s = R(x0 - 20, y0 - 20, w + 40, h + 40, 10, ol('#B9783E', 6)) + R(x0 - 12, y0 - 12, w + 24, 8, 4, { fill: '#D9A066' });
  s += R(x0, y0, w, h, 4, ol('url(#stChalk)', 4));
  s += P(`M${x0 + 60} ${y0 + h * 0.7} q120 -40 240 10 q100 30 220 -20 M${x0 + w - 300} ${y0 + 70} q90 -30 200 10`, ln(30, '#FFFFFF', 0.05));
  const L = lines.length;
  const big = L === 1 ? 104 : 78, small = L <= 2 ? 64 : 56;
  const sizes = lines.map((l, i) => Math.min(i === 0 ? big : small, (w - 60) / (l.length * 0.55 + 0.2)));
  const total = sizes.reduce((a, b) => a + b * 1.2, 0);
  let y = y0 + (h - total) / 2;
  lines.forEach((l, i) => { y += sizes[i] * 1.2; s += S.el('text', { x: x0 + w / 2, y: f(y - sizes[i] * 0.22), 'font-family': 'Fredoka, sans-serif', 'font-weight': 600, 'font-size': f(sizes[i]), fill: '#F4F6EC', 'text-anchor': 'middle', opacity: 0.94, transform: `rotate(${i % 2 ? 0.8 : -1} ${x0 + w / 2} ${f(y)})` }, esc(l)); });
  if (o.underline !== false && L > 1) s += P(`M${x0 + w * 0.28} ${f(y0 + (h - total) / 2 + sizes[0] * 0.98 + 8)} q${w * 0.22} 10 ${w * 0.44} -4`, ln(5, '#F4F6EC', 0.8));
  s += R(x0 - 26, y0 + h + 14, w + 52, 18, 5, ol('#A8692F', 4)) + R(x0 + 70, y0 + h + 4, 54, 12, 5, ol('#FFFFFF', 2.5)) + R(x0 + 140, y0 + h + 6, 40, 10, 5, ol('#FFE07A', 2.5)) + R(x0 + w - 180, y0 + h - 2, 90, 20, 5, ol('#5A4A6A', 3)) + R(x0 + w - 180, y0 + h - 2, 90, 7, 3, { fill: '#C9C2D8' });
  return s;
}
// paired student table seen from the front; returns [chair backs (behind the kids), table front]. k = s / .5
function studentTable(cx, top, k, o = {}) {
  const w = 470 * k;
  let ch = '';
  for (const side of [-1, 1]) {
    const c = CHAIR[(o.ci + (side > 0 ? 1 : 0)) % CHAIR.length];
    const sx = cx + side * seatOff * k;
    ch += R(sx - 80 * k, top - 160 * k, 160 * k, 120 * k, 24 * k, ol(c, 5 * Math.max(0.7, k))) + R(sx - 64 * k, top - 148 * k, 128 * k, 22 * k, 10 * k, { fill: '#FFFFFF', opacity: 0.28 });
    ch += P(`M${f(sx - 60 * k)} ${f(top - 40 * k)} L${f(sx - 66 * k)} ${f(top + 230 * k)} M${f(sx + 60 * k)} ${f(top - 40 * k)} L${f(sx + 66 * k)} ${f(top + 230 * k)}`, ln(9 * k, '#4A4466'));
  }
  let fr = R(cx - w / 2, top - 20 * k, w, 30 * k, 9 * k, ol('#EBC48A', 5 * Math.max(0.7, k))) + P(`M${f(cx - w / 2 + 14 * k)} ${f(top - 8 * k)} H${f(cx + w / 2 - 14 * k)}`, ln(4 * k, '#FFFFFF', 0.5));
  const lg_ = `M${f(cx - w / 2 + 30 * k)} ${f(top + 200 * k)} L${f(cx - w / 2 + 28 * k)} ${f(top + 246 * k)} M${f(cx + w / 2 - 30 * k)} ${f(top + 200 * k)} L${f(cx + w / 2 - 28 * k)} ${f(top + 246 * k)}`;
  fr += P(lg_, ln(15 * k, LINE)) + P(lg_, ln(8 * k, '#8A86A0'));
  fr += R(cx - w / 2 + 14 * k, top + 8 * k, w - 28 * k, 212 * k, 8 * k, ol('#9A8FC4', 5 * Math.max(0.7, k))) + R(cx - w / 2 + 26 * k, top + 18 * k, w - 52 * k, 84 * k, 6 * k, { fill: '#7E72B0' }) + R(cx - w / 2 + 26 * k, top + 112 * k, w - 52 * k, 12 * k, 4 * k, { fill: '#B4AAD8' }) + P(`M${f(cx)} ${f(top + 112 * k)} V${f(top + 214 * k)}`, ln(3 * k, '#7E72B0'));
  fr += R(cx - w / 2 + 40 * k, top + 66 * k, 80 * k, 34 * k, 4 * k, ol(o.book || '#FF6F91', 2.5)) + R(cx - w / 2 + 126 * k, top + 72 * k, 60 * k, 28 * k, 4 * k, ol('#FFD86A', 2.5)) + R(cx + w / 2 - 150 * k, top + 62 * k, 90 * k, 38 * k, 4 * k, ol('#5AA8F0', 2.5));
  if (o.quiz) for (const side of [-1, 1]) {
    const sx = cx + side * seatOff * k;
    fr += P(`M${f(sx - 62 * k)} ${f(top - 14 * k)} L${f(sx + 54 * k)} ${f(top - 22 * k)} L${f(sx + 60 * k)} ${f(top - 4 * k)} L${f(sx - 56 * k)} ${f(top + 2 * k)} Z`, ol('#FFFFFF', 2.5)) + P(`M${f(sx - 44 * k)} ${f(top - 12 * k)} H${f(sx + 30 * k)} M${f(sx - 44 * k)} ${f(top - 5 * k)} H${f(sx + 20 * k)}`, ln(1.6, '#8A93B0'));
    fr += P(`M${f(sx + 64 * k)} ${f(top - 6 * k)} L${f(sx + 112 * k)} ${f(top - 26 * k)}`, ln(7 * k, '#FFB43A')) + P(`M${f(sx + 108 * k)} ${f(top - 24 * k)} L${f(sx + 118 * k)} ${f(top - 28 * k)}`, ln(7 * k, '#FF8FB0'));
  }
  return [ch, fr];
}
function teacherDesk(o = {}) {
  const { x0, x1, top } = CR.desk, w = x1 - x0;
  let s = R(x0 - 10, top - 26, w + 20, 32, 8, ol('#C98A52', 6)) + P(`M${x0 + 6} ${top - 16} H${x1 - 6}`, ln(4, '#E8B27A'));
  s += R(x0, top + 6, w, 150, 6, ol('#A86A3A', 6)) + R(x0 + 20, top + 24, w * 0.4, 112, 5, { fill: 'none', stroke: '#8A5228', 'stroke-width': 4 }) + R(x0 + w * 0.5, top + 24, w * 0.45, 50, 5, { fill: 'none', stroke: '#8A5228', 'stroke-width': 4 }) + R(x0 + w * 0.5, top + 86, w * 0.45, 50, 5, { fill: 'none', stroke: '#8A5228', 'stroke-width': 4 });
  s += CI(x0 + w * 0.725, top + 49, 6, ol(GOLD, 2.5)) + CI(x0 + w * 0.725, top + 111, 6, ol(GOLD, 2.5)) + R(x0 + 10, top + 156, 30, 14, 3, { fill: '#7A4A26' }) + R(x1 - 40, top + 156, 30, 14, 3, { fill: '#7A4A26' });
  // on the desk: apple, homework pile (IN tray), nameplate, PATIENCE mug, red pens, pointer, bell
  s += CI(x0 + 46, top - 50, 24, ol('#E8333C', 4)) + P(`M${x0 + 46} ${top - 74} q4 -14 12 -18`, ln(4, '#6A3A1A')) + P(`M${x0 + 50} ${top - 76} q16 -12 26 0 q-14 8 -26 0 Z`, ol('#5CC659', 2.5)) + E(x0 + 38, top - 58, 6, 9, { fill: '#FFFFFF', opacity: 0.5 });
  s += R(x0 + 100, top - 44, 130, 18, 3, ol('#8A93A6', 3));
  for (let i = 0; i < 9; i++) s += R(x0 + 104 + (i % 2) * 4, top - 58 - i * 9, 120, 10, 2, ol('#FFFFFF', 2));
  s += TF('HOMEWORK', x0 + 166, top - 66, 14, '#C0262E');
  s += G(P('M-110 0 L-96 -50 L96 -50 L110 0 Z', ol('#5A3418', 4)) + R(-86, -44, 172, 36, 4, ol(GOLD, 2.5)) + TF('MRS. KRUMP', 0, -18, 22, '#3A2A10'), tr(x0 + 350, top - 22));
  s += G(R(-26, -60, 52, 60, 8, ol('#FFFFFF', 4)) + P('M26 -46 Q46 -40 26 -16', ln(5)) + TF('PATIENCE', 0, -26, 9, '#3A3456') + R(-20, -10, 40, 4, 2, { fill: '#C9C2D8' }), tr(x0 + 482, top - 26, 1.15));
  s += G(R(-18, -52, 36, 52, 6, ol('#3E7BD8', 4)) + P('M-8 -52 L-12 -84 M2 -52 L4 -88 M10 -52 L16 -80', ln(6, '#E8333C')), tr(x1 - 6, top - 26));
  s += P(`M${x0 - 30} ${top - 34} L${x0 + 300} ${top - 30}`, ln(9)) + P(`M${x0 - 30} ${top - 34} L${x0 + 300} ${top - 30}`, ln(5, '#C98A52')) + CI(x0 - 30, top - 34, 5, { fill: '#E8333C' });
  return s;
}
function hamsterCage(x, y, t) {
  let s = R(x - 90, y - 100, 180, 100, 8, { fill: '#FFF8EA', opacity: 0.5 }) + R(x - 96, y - 10, 192, 14, 4, ol('#3FBF8F', 4));
  let bars = '';
  for (let bx = x - 84; bx <= x + 84; bx += 14) bars += `M${bx} ${y - 96} V${y - 10} `;
  s += P(bars, ln(2.5, '#8A93A6')) + P(`M${x - 92} ${y - 100} Q${x} ${y - 140} ${x + 92} ${y - 100}`, ln(5, '#8A93A6')) + R(x - 92, y - 104, 184, 8, 4, ol('#3FBF8F', 3));
  const a = t * 420;
  let sp = '';
  for (let i = 0; i < 6; i++) { const r = (a + i * 60) * Math.PI / 180; sp += `M${x + 40} ${y - 52} L${f(x + 40 + Math.cos(r) * 34)} ${f(y - 52 + Math.sin(r) * 34)} `; }
  s += CI(x + 40, y - 52, 36, ln(5, '#FF8A3D')) + P(sp, ln(2.5, '#FF8A3D'));
  const hb = Math.abs(Math.sin(t * 14)) * 3;
  s += G(E(0, 0, 18, 13, ol('#E9B97A', 3)) + CI(-10, -10, 5, ol('#E9B97A', 2)) + CI(-12, -2, 2.2, { fill: LINE }) + E(4, 6, 10, 5, { fill: '#FFF1DC' }), tr(x + 40, y - 30 - hb));
  s += R(x - 70, y - 40, 40, 30, 4, ol('#5AA8F0', 2.5)) + R(x - 50, y + 4, 88, 22, 4, ol('#FFFFFF', 2.5)) + TF('GERALD', x - 6, y + 21, 15, PUR);
  return s;
}
function classroomLayers(t, o = {}) {
  const quiz = !!o.quiz;
  // bg (k .6): the yard
  let bg = R(-200, -700, 4400, 1500, 0, { fill: 'url(#stSkyDay)' });
  for (const [cx, cy, cs, sp] of [[1300, 230, 0.55, 8], [1900, 300, 0.42, 6], [2500, 210, 0.5, 9]]) bg += cloud(md(cx + t * sp - 900, 2400) + 900, cy, cs);
  bg += P('M0 430 Q1200 360 1800 410 Q2400 450 4200 380 L4200 900 L0 900 Z', { fill: '#9AD493' }) + R(0, 470, 4200, 500, 0, { fill: '#7DC777' });
  bg += R(700, 400, 700, 120, 0, { fill: '#D98C6C', stroke: LINE, 'stroke-width': 3 }) + R(700, 400, 700, 120, 0, { fill: 'url(#stWinPane)', opacity: 0.5 }) + R(690, 388, 720, 16, 4, ol('#F2E6D6', 3));
  bg += tree(1500, 520, 0.6, { sway: Math.sin(t * 1.2) * 1.5 }) + tree(2300, 510, 0.5, { kind: 'tall' }) + tree(2650, 525, 0.55, { sway: Math.sin(t * 1.1 + 2) * 1.5 });
  let fence = '';
  for (let x = 20; x < 4200; x += 40) fence += `M${x} 470 V520 `;
  bg += P(fence + 'M0 482 H4200 M0 506 H4200', ln(3, '#7A7290'));
  bg += G(R(-120, -50, 240, 16, 5, ol('#C98A52', 3)) + R(-120, -24, 240, 14, 5, ol('#B77B46', 3)) + P('M-100 -10 V22 M100 -10 V22', ln(7, '#5A5470')), tr(1900, 560, 0.75));
  if (o.outside) bg += o.outside;
  // mid: walls with window holes
  let m = P(`M${XL} ${YT} H${XR} V${CR.floor + 10} H${XL} Z ` + CR.win.map(([a, b]) => `M${a} 140 V540 H${b} V140 Z`).join(' '), { fill: '#CFDDF0', 'fill-rule': 'evenodd' });
  m += band(YT, 40, '#F1EEE8') + band(40, 54, '#8FA3C8') + band(54, 60, GOLD);
  m += band(520, CR.floor, '#B98A5C') + band(512, 528, '#D9A066') + P(`M${XL} 512 H${XR} M${XL} 528 H${XR}`, ln(3.5, LINE, 0.55));
  let pan = '';
  for (let x = XL + 20; x < XR; x += 200) pan += `M${x} 548 h170 v136 h-170 Z `;
  m += P(pan, { fill: 'none', stroke: '#A3754A', 'stroke-width': 4 });
  // windows
  const bl = o.blinds === undefined ? 0.3 : clamp(o.blinds, 0, 1);
  for (const [a, b] of CR.win) {
    m += R(a, 140, b - a, 400 * bl, 0, { fill: 'url(#stBlinds)' }) + R(a, 140 + 400 * bl - 10, b - a, 14, 3, ol('#E8E2D4', 3)) + P(`M${b - 30} 140 V${f(140 + 400 * bl + 60)}`, ln(2.5, '#8A8470'));
    m += R(a - 14, 126, b - a + 28, 428, 8, { fill: 'none', stroke: '#FFFFFF', 'stroke-width': 18 }) + R(a - 24, 116, b - a + 48, 448, 10, ln(5)) + R(a, 140, b - a, 400, 0, ln(4));
    m += P(`M${(a + b) / 2} 140 V540`, ln(12, '#FFFFFF')) + P(`M${(a + b) / 2} 140 V540`, ln(3, LINE, 0.35));
    m += P(`M${a + 30} 530 L${a + 140} ${f(160 + 400 * bl)} L${a + 172} ${f(160 + 400 * bl)} L${a + 62} 530 Z`, { fill: '#FFFFFF', opacity: 0.2 });
  }
  m += R(1150, 540, 1400, 22, 6, ol('#F6F1E8', 5));
  if (o.hamster !== false) m += hamsterCage(2420, 540, t);
  m += G(R(-30, -40, 60, 40, 6, ol('#E8704A', 4)) + P('M0 -40 Q-26 -90 -48 -84 M0 -40 Q8 -100 30 -106 M0 -40 Q30 -76 52 -70', ln(9, '#4FAF5E')), tr(1250, 540)) + G(R(-60, -24, 120, 24, 3, ol('#5AA8F0', 3)) + R(-50, -46, 100, 22, 3, ol('#FF6F91', 3)), tr(1900, 540));
  // bookshelf under the windows
  m += R(1160, 580, 1380, 120, 6, ol('#C98A52', 5)) + P('M1160 640 H2540', ln(5, '#8A5228'));
  let books = '';
  for (let i = 0; i < 40; i++) { const bx = 1176 + i * 33 + (i > 19 ? 20 : 0); if (bx > 2520) break; const bh = 40 + hash(i * 3.1) * 14; books += R(bx, (i % 2 ? 636 : 696) - bh, 26, bh, 3, ol(KTOP[i % KTOP.length], 2.5)); }
  m += books;
  // chalkboard + rules + clock + door + map + flag-ish pennants
  const lines = o.board || (quiz ? ['POP QUIZ!', '20 QUESTIONS'] : ['HOMEWORK', 'ON MY DESK.', 'NOW.']);
  m += chalkboard(70, 130, 800, 330, lines);
  m += TF('MRS. KRUMP · ROOM 12', 470, 100, 26, '#4A5A88');
  m += poster(['CLASS RULES', '1. BE ON TIME', '2. NO EXCUSES', '3. SEE RULE 2'], 1020, 330, { w: 220, h: 230, col: '#FFFFFF', head: '#C0262E', headSize: 24, size: 22, ink: '#2A2246', rot: 1 });
  m += wallClock(1020, 120, 46, o.clock ?? '9:15', { t, rim: '#4A5A88' });
  m += R(-480, 160, 300, 540, 6, ol('#F7F1E6', 6)) + R(-462, 178, 264, 522, 4, ol('#C98A52', 5)) + R(-430, 220, 80, 210, 4, ol('#C7E6FF', 4)) + R(-250, 450, 34, 14, 6, ol('#D9DEE8', 3)) + R(-420, 100, 180, 44, 8, ol('#3A2E6A', 4)) + TF('ROOM 12', -330, 132, 26, '#FFFFFF');
  m += G(R(-180, -110, 360, 220, 8, ol('#BFE3F5', 5)) + P('M-140 -60 q40 -30 80 0 q20 40 -20 60 q-50 10 -60 -60 Z M10 -70 q60 -20 110 10 q10 50 -40 70 q-40 -10 -70 -80 Z M40 30 q40 0 50 40 q-30 20 -50 -40 Z', ol('#9AD493', 3)) + TF('WORLD', 0, 98, 18, '#3A5A88'), tr(-900, 330));
  m += G(R(-14, -24, 28, 48, 6, ol('#C9CED8', 3)) + CI(0, -6, 8, ol('#8A93A6', 2)) + R(10, -6, 18, 6, 2, { fill: '#5A5470' }), tr(920, 530));
  // smart kids' corner (right): science posters, a skeleton-free shelf, the INT trophy shelf
  m += poster(['THE SCIENTIFIC', 'METHOD', 'ASK · TEST · REPEAT'], 2780, 300, { w: 300, h: 190, col: '#FFFFFF', head: '#3E7BD8', size: 24, icon: 'atom' });
  m += G(R(-140, -16, 280, 20, 4, ol('#C98A52', 4)) + trophy('cup', -90, -16, 0.7) + trophy('star', -20, -16, 0.7) + trophy('medal', 50, -36, 0.8) + trophy('plaque', 100, -16, 0.6), tr(3080, 470));
  // floor
  m += band(CR.floor, YB, 'url(#stClassFloor)') + band(CR.floor - 4, CR.floor + 10, '#6A5A8A') + R(XL, CR.floor + 10, XR - XL, 40, 0, { fill: '#000', opacity: 0.06 });
  for (const [a, b] of CR.win) m += P(`M${a - 40} ${CR.floor + 12} L${b - 40} ${CR.floor + 12} L${b - 300} 1300 L${a - 460} 1300 Z`, { fill: 'url(#stBeam)', opacity: 0.5 });
  // rows (chairs of row 3 in mid; chairs of row i+1 go into frontRows[i])
  const tabs = CR.rows.map((row, ri) => row.xs.map((x, i) => studentTable(x, row.top, row.s / 0.5, { ci: i + ri * 2, quiz, book: KTOP[(i * 3 + ri) % KTOP.length] })));
  m += tabs[0].map((p) => p[0]).join('');
  const fr0 = tabs[0].map((p) => p[1]).join('') + tabs[1].map((p) => p[0]).join('');
  let fr1 = tabs[1].map((p) => p[1]).join('') + teacherDesk(o) + tabs[2].map((p) => p[0]).join('');
  // the smart kids' table: round-ended group table with a microscope, globe, books and a MATHLETES pennant
  let sm = '';
  {
    const { x, top, s } = CR.smart, k = s / 0.5, w = 560 * k;
    for (const dx of [-170, 0, 170]) sm += R(x + dx * k - 78 * k, top - 150 * k, 156 * k, 112 * k, 22 * k, ol('#3E7BD8', 5)) + P(`M${f(x + dx * k - 56 * k)} ${f(top - 40 * k)} L${f(x + dx * k - 60 * k)} ${f(top + 220 * k)} M${f(x + dx * k + 56 * k)} ${f(top - 40 * k)} L${f(x + dx * k + 60 * k)} ${f(top + 220 * k)}`, ln(9 * k, '#4A4466'));
    sm = [sm];
    let tf = R(x - w / 2, top - 22 * k, w, 34 * k, 17 * k, ol('#F0F2F6', 5)) + R(x - w / 2 + 30 * k, top + 12 * k, w - 60 * k, 70 * k, 8 * k, ol('#3E7BD8', 5)) + P(`M${f(x - w / 2 + 50 * k)} ${f(top + 80 * k)} L${f(x - w / 2 + 44 * k)} ${f(top + 240 * k)} M${f(x + w / 2 - 50 * k)} ${f(top + 80 * k)} L${f(x + w / 2 - 44 * k)} ${f(top + 240 * k)}`, ln(14 * k, '#5A5470'));
    tf += R(x - w / 2 + 30 * k, top + 80 * k, w - 60 * k, 140 * k, 6 * k, ol('#2E5EB0', 5)) + TF('MATHLETES', x, top + 58 * k, 30 * k, '#FFFFFF');
    tf += G(R(-30, -10, 60, 10, 3, ol('#3A3456', 3)) + P('M-6 -10 L-16 -70 L6 -96 L18 -86 L-2 -62 L4 -10 Z', ol('#5A5470', 3)) + R(-4, -110, 30, 18, 4, ol('#3A3456', 3)) + R(-20, -46, 40, 8, 2, ol('#C9CED8', 2)), tr(x - 170 * k, top - 20 * k, k));
    tf += G(CI(0, -60, 38, ol('#5AA8F0', 4)) + P('M-24 -84 q20 10 10 30 q-10 14 -26 4 Z M8 -40 q16 -16 26 4 q-6 14 -20 8 Z', ol('#7DC777', 2.5)) + P('M0 -22 V0 M-24 0 H24', ln(6, '#8A5228')) + P('M-40 -60 A40 40 0 0 1 0 -100', ln(4, GOLD)), tr(x + 160 * k, top - 20 * k, k));
    tf += G(R(-50, -16, 100, 16, 3, ol('#FF6F91', 2.5)) + R(-44, -32, 88, 16, 3, ol(GOLD, 2.5)) + R(-48, -48, 96, 16, 3, ol('#3FBF8F', 2.5)), tr(x + 10 * k, top - 20 * k, k));
    tf += G(P('M0 0 L0 -120 M0 -120 L110 -96 L0 -72', ol(PUR, 4)) + TF('INT', 40, -90, 18, GOLD), tr(x + w / 2 - 30 * k, top - 20 * k, k));
    sm.push(tf);
  }
  fr1 += sm[0];
  const fr2 = tabs[2].map((p) => p[1]).join('') + sm[1];
  // light: window beams across the floor + a warm wash
  let light = '';
  return { bg, mid: m, front: fr0 + fr1 + fr2, fg: '', light, frontRows: [fr0, fr1, fr2] };
}
const classroom = makeSet(classroomLayers);

// ================================================================= 3. GYM — dodgeball / SCIENCE FAIR
// Across the court: pale-lilac block wall with a purple/gold stripe, purple wall mats, steel trusses with caged lamps,
// clerestory windows, the hanging SCOREBOARD (centre), CHAMPS banners, pulled-out bleachers at the left (cheap crowd), a
// climbing wall + hoop at the right. Maple floor (junction y 680) with the purple centre line (x 960) and the owl circle.
// Dodgeball: teamA left of the line (facing right: view 'side', flip), teamB right (facing left); the picking lineup
// along the mats; the hero = SPOTS.gym.hero (team B). Stand line y 960, scaleAt(y).
// o: { scoreboard: ['HOME','3','GUEST','0'] | 'TEXT', clock ('2:00'), balls 'line' (default) | 'scatter' | false,
//      crowd 0..1 (bleacher kids, default .8), cheer 0..1 (bleacher kids arms up), fair (SCIENCE FAIR dressing),
//      bulb 0..1 (potato bulb glow, default .25), ribbon 'smart' | 'potato' | false (1st place), parents 0..1 (default 1) }
// Fair: rows of project tables with tri-fold boards; front row: the hero + Benji's POTATO POWER table (SPOTS.gym.fair.potato)
//   and the smart kids' fancy table (fair.smart); parents walk the aisle (cheap crowd). Order: mid · back-row exhibitors ·
//   frontRows[0] (back tables) · aisle people · frontRows[1] (front tables) · floor line (judge / visitors) · light.
const GY = { floor: 680, yh: -40 };
const gymScale = (y) => Math.round(500 * (y - GY.yh) / (960 - GY.yh)) / 1000;
function scoreboard(x, y, o = {}) {
  let s = P('M-200 -150 V-120 M200 -150 V-120', ln(5, '#5A5470'));
  s += R(-290, -120, 580, 220, 18, ol('#26203A', 7)) + R(-280, -110, 560, 200, 12, { fill: 'none', stroke: GOLD, 'stroke-width': 4 });
  s += owl(0, -126, 0.5);
  const sb = o.scoreboard;
  if (typeof sb === 'string') {
    s += T(sb, 0, 22, Math.min(80, 520 / (sb.length * 0.56)), '#FFB23E', { 'letter-spacing': 2 });
  } else {
    const [h1, v1, h2, v2] = sb || ['HOME', '0', 'GUEST', '0'];
    for (const [sx, lab, val, c] of [[-170, h1, v1, PUR], [170, h2, v2, '#C98A1A']]) {
      s += R(sx - 90, -92, 180, 34, 8, { fill: c }) + TF(lab, sx, -66, 24, '#FFFFFF') + R(sx - 80, -48, 160, 116, 8, { fill: '#120E1E' });
      s += T(String(val).padStart(2, '0'), sx, 46, 96, '#FF8A2E', { 'letter-spacing': 6 });
    }
    s += R(-62, -60, 124, 56, 8, { fill: '#120E1E' }) + T(o.clock || '2:00', 0, -18, 40, '#FFE04A') + TF('PERIOD', 0, 22, 16, '#C9C2D8') + T('2', 0, 66, 40, '#FF8A2E');
  }
  return G(s, tr(x, y));
}
function bleachers(x0, x1, base, o = {}) {
  // 5 tiers rising to the back; returns { svg, seats: [{x, y (feet), s}] } with cheap kids interleaved
  let s = '';
  const tiers = 5, th = 64;
  const kids = [];
  for (let i = tiers - 1; i >= 0; i--) {
    const y = base - 30 - i * th;
    s += R(x0 + i * 18, y, x1 - x0 - i * 18, th + 4, 0, { fill: '#5A4466' }) + R(x0 + i * 18, y - 4, x1 - x0 - i * 18, 22, 4, ol('#E8B06A', 4)) + R(x0 + i * 18, y + 18, x1 - x0 - i * 18, 8, 0, { fill: '#B97E44' });
    const row = [];
    if (o.crowd > 0) {
      const sc = 0.36 - i * 0.012;
      for (const p of crowdRow(x0 + 40 + i * 18, x1 - 50, y + 4 + 300 * sc, sc, { seed: i * 3 + 2, dx: 250, density: o.crowd, jit: 0 })) row.push({ ...p, arms: o.cheer > 0.4 ? (hash(p.i) < 0.6 ? 'up' : 'wave') : undefined, mouth: o.cheer > 0.4 ? 'o' : undefined });
      s += people(row, { t: o.t });
      kids.push(...row);
    }
  }
  s += R(x1 - 10, base - 30 - tiers * th, 16, tiers * th + 40, 4, ol('#C9CED8', 4)) + P(`M${x1 + 6} ${base - 30 - tiers * th + 20} L${x1 + 60} ${base}`, ln(8, '#C9CED8'));
  s += R(x0, base - 30, x1 - x0, 40, 0, { fill: '#3E2E4E' });
  return { svg: s, seats: kids };
}
// tri-fold project board on a table: kind volcano|solar|plants|magnet|crystal|rocket|music|fish|potato|smart; origin = table
// top centre; k = scale (1 at the front row)
function triFold(x, top, k, kind, t = 0, o = {}) {
  const W = 200, H = kind === 'smart' ? 300 : 250, side = 96;
  let s = P(`M${-W / 2} 0 L${-W / 2 - side} -14 L${-W / 2 - side} ${-H + 34} L${-W / 2} ${-H} Z`, ol(o.col2 || '#F3F0E8', 4)) + P(`M${W / 2} 0 L${W / 2 + side} -14 L${W / 2 + side} ${-H + 34} L${W / 2} ${-H} Z`, ol(o.col2 || '#F3F0E8', 4));
  s += R(-W / 2, -H, W, H, 3, ol(o.col || '#FFFFFF', 4));
  const head = { volcano: ['VOLCANOES!', '#E8443C'], solar: ['OUR SOLAR', '#3E4A9A'], plants: ['DO PLANTS', '#3E9E5A'], magnet: ['MAGNETS', '#C0262E'], crystal: ['CRYSTALS', '#8A4FD8'], rocket: ['FIZZ ROCKET', '#FF8A3D'], music: ['PLANTS + MUSIC?', '#E05A9A'], fish: ['DO FISH SLEEP?', '#2FA7C9'], potato: ['POTATO POWER!', '#7A5A2A'], smart: ['QUANTUM PHOTO-', '#1E2A4A'] }[kind] || ['SCIENCE!', PUR];
  s += R(-W / 2 + 10, -H + 10, W - 20, 40, 4, { fill: head[1] }) + T(head[0], 0, -H + 40, Math.min(30, (W - 40) / (head[0].length * 0.6)), '#FFFFFF');
  const sheet = (sx, sy, w, h, c = '#FFFFFF') => R(sx - w / 2, sy, w, h, 3, ol(c, 2.5)) + P(`M${sx - w / 2 + 8} ${sy + 14} H${sx + w / 2 - 8} M${sx - w / 2 + 8} ${sy + 24} H${sx + w / 2 - 14} M${sx - w / 2 + 8} ${sy + 34} H${sx + w / 2 - 20}`, ln(2, '#9A93B0'));
  s += sheet(-W / 2 - side / 2, -H + 60, 66, 54) + sheet(W / 2 + side / 2, -H + 60, 66, 54, '#FFF59A') + sheet(W / 2 + side / 2, -H + 130, 60, 44);
  if (kind === 'volcano') s += P('M-50 -40 L-14 -150 L14 -150 L50 -40 Z', ol('#9A6440', 3.5)) + P('M-14 -150 L-6 -128 L4 -146 L14 -150 Z', ol('#FF5A3C', 3)) + P('M-16 -140 q-6 30 -20 60 M10 -140 q8 26 16 50', ln(6, '#FF5A3C'));
  else if (kind === 'solar') { s += CI(-50, -120, 30, ol(GOLD, 3)); [[0, -140, 9, '#5AA8F0'], [30, -100, 12, '#E8704A'], [62, -150, 14, '#C9A26A'], [76, -96, 8, '#FF6F91']].forEach(([px, py, r, c]) => { s += CI(px, py, r, ol(c, 2.5)); }); s += E(30, -120, 70, 26, ln(2, '#9A93B0')); }
  else if (kind === 'plants') { for (const [px, hh] of [[-50, 40], [0, 70], [50, 100]]) s += R(px - 16, -60, 32, 30, 4, ol('#E8704A', 2.5)) + P(`M${px} -60 V${-60 - hh} M${px} ${-70 - hh / 2} q-16 -8 -20 -20 M${px} ${-80 - hh / 2} q16 -8 20 -20`, ln(5, '#4FAF5E')); s += TF('GROW?', 0, -190, 22, '#3E9E5A'); }
  else if (kind === 'magnet') s += P('M-40 -60 V-120 A40 40 0 0 1 40 -120 V-60 H18 V-120 A18 18 0 0 0 -18 -120 V-60 Z', ol('#E8443C', 3.5)) + R(-40, -76, 22, 16, 2, { fill: '#D9DEE8' }) + R(18, -76, 22, 16, 2, { fill: '#D9DEE8' });
  else if (kind === 'crystal') s += P('M-30 -50 L-40 -110 L-20 -150 L0 -110 Z M0 -50 L10 -130 L30 -170 L40 -120 Z', ol('#C9A8FF', 3)) + P('M-20 -150 L-20 -60 M30 -170 L20 -60', ln(2, '#FFFFFF', 0.7));
  else if (kind === 'rocket') s += P('M0 -180 Q20 -150 20 -90 H-20 Q-20 -150 0 -180 Z', ol('#FFFFFF', 3)) + P('M-20 -100 L-34 -70 H-20 Z M20 -100 L34 -70 H20 Z', ol('#E8443C', 2.5)) + P('M-12 -86 Q0 -40 12 -86', ol('#FFB23E', 2.5));
  else if (kind === 'music') s += P('M-30 -70 V-150 L30 -164 V-84', ln(6)) + CI(-40, -70, 12, { fill: LINE }) + CI(20, -84, 12, { fill: LINE }) + R(-20, -60, 40, 30, 4, ol('#E8704A', 2.5));
  else if (kind === 'fish') s += CI(0, -110, 56, ol('#CDEFFF', 3)) + P('M-20 -110 q20 -20 40 0 q-20 20 -40 0 Z M20 -110 l14 -10 v20 Z', ol('#FF8A3D', 2.5)) + TF('Zzz', 30, -170, 20, '#2FA7C9');
  else if (kind === 'potato') {
    s += P('M-70 -110 q30 -40 60 -10 M10 -120 l20 -40 l-10 30 h20 l-30 50', ln(6, GOLD)) + G(icon('potato'), 'translate(-40 -150) scale(1.1)') + TF('it works!', 30, -70, 22, '#7A5A2A', { transform: 'rotate(-6 30 -70)' }) + TF('(kind of)', 30, -46, 18, '#9A8A6A');
    s += P('M-80 -190 q10 -10 20 0 M-74 -184 v-10', ln(3, '#7A5A2A'));
  } else if (kind === 'smart') {
    s += R(-80, -230, 160, 100, 4, ol('#0E1424', 3)) + P('M-70 -150 L-40 -170 L-10 -160 L20 -200 L50 -190 L70 -220', ln(5, '#3FE07A')) + P('M-70 -140 H70', ln(2, '#3A4A6A'));
    s += sheet(0, -116, 150, 50) + TF('p < 0.001', 0, -40, 20, '#1E2A4A') + R(-W / 2 - side + 6, -H + 140, side - 12, 60, 3, ol('#DFF2FF', 2.5)) + P(`M${-W / 2 - side + 14} ${-H + 190} V${-H + 160} M${-W / 2 - side + 34} ${-H + 190} V${-H + 150} M${-W / 2 - side + 54} ${-H + 190} V${-H + 170} M${-W / 2 - side + 74} ${-H + 190} V${-H + 146}`, ln(8, '#3E7BD8'));
    const blink = (Math.floor(t * 4) % 3);
    for (let i = 0; i < 9; i++) s += CI(-W / 2 - side + 12 + i * ((W + 2 * side - 24) / 8), -H - 6, 6, { fill: ['#FF4D5A', '#FFE04A', '#3FE07A'][(i + blink) % 3], stroke: LINE, 'stroke-width': 2 });
  }
  return G(s, tr(x, top - 4 * k, k));
}
// the potato battery: two potatoes, copper/zinc strips, wires, a tiny bulb (glow 0..1); origin = table top centre
function potatoBattery(x, top, k = 1, bulb = 0.25) {
  let s = '';
  for (const px of [-70, 30]) s += P(`M${px - 44} -4 Q${px - 50} -50 ${px - 6} -54 Q${px + 40} -60 ${px + 46} -20 Q${px + 50} 4 ${px} 2 Q${px - 40} 4 ${px - 44} -4 Z`, ol('#D9A85E', 4)) + CI(px - 14, -30, 3, { fill: '#9A6A30' }) + CI(px + 18, -18, 3, { fill: '#9A6A30' }) + R(px - 20, -78, 8, 34, 2, ol('#E8904A', 2)) + R(px + 10, -78, 8, 34, 2, ol('#C9CED8', 2));
  s += P('M-86 -78 Q-110 -130 -40 -120 Q10 -116 26 -78 M-56 -78 Q-40 -100 -14 -96 M44 -78 Q80 -150 120 -110', ln(4, '#E8333C')) + P('M40 -78 Q60 -110 110 -96', ln(4, '#3A3456'));
  s += R(100, -60, 50, 12, 3, ol('#5A5470', 2.5)) + R(118, -100, 14, 40, 3, ol('#8A93A6', 2.5));
  const g = clamp(bulb, 0, 1);
  if (g > 0.01) s += glow(125, -118, 90 * (0.4 + g), 90 * (0.4 + g), '#FFE88A', 0.8 + g);
  s += CI(125, -118, 20, { fill: mix('#E8EEF6', '#FFF3A0', g), stroke: LINE, 'stroke-width': 3.5 }) + P('M118 -108 q7 -14 14 0', ln(2.5, mix('#8A93A6', '#FFB23E', g)));
  return G(s, tr(x, top, k));
}
function fairTable(cx, top, k, kind, t, o = {}) {
  const w = (o.w || 470) * k;
  let s = R(cx - w / 2, top - 16 * k, w, 26 * k, 8 * k, ol('#FFFFFF', 5)) + R(cx - w / 2 + 6 * k, top + 8 * k, w - 12 * k, 190 * k, 4 * k, ol(o.cloth || PUR, 5));
  let pl = '';
  for (let x = cx - w / 2 + 40 * k; x < cx + w / 2 - 20 * k; x += 60 * k) pl += `M${f(x)} ${f(top + 14 * k)} V${f(top + 192 * k)} `;
  s += P(pl, ln(3, mix(o.cloth || PUR, '#000000', 0.25), 0.7)) + R(cx - w / 2 + 6 * k, top + 8 * k, w - 12 * k, 14 * k, 2, { fill: o.trim || GOLD });
  s += triFold(cx, top, k * (o.board || 1), kind, t);
  if (o.ribbon) s += G(P('M-14 10 L-24 60 L-6 50 L0 66 L8 48 L24 60 L14 10 Z', ol('#3E7BD8', 3)) + CI(0, 0, 26, ol('#3E7BD8', 4)) + CI(0, 0, 16, ol('#FFFFFF', 2.5)) + T(o.ribbon, 0, 7, 18, '#3E7BD8'), tr(cx + w / 2 - 40 * k, top + 60 * k, k));
  return s;
}
const FAIR = {
  back: { top: 712, s: 0.38, xs: [-470, 30, 530, 1030, 1530, 2030, 2530], kinds: ['crystal', 'magnet', 'volcano', 'solar', 'plants', 'music', 'fish'] },
  aisle: 862,
  front: { top: 890, s: 0.5, potato: 620, smart: 1420, extra: [[-320, 'solar'], [2280, 'rocket']] },
};
function gymLayers(t, o = {}) {
  const fair = !!o.fair;
  let m = cover('#3A3352');
  // trusses + lamps
  let tr_ = `M${XL} 28 H${XR} M${XL} 104 H${XR} `;
  for (let x = XL; x < XR; x += 120) tr_ += `M${x} 104 L${x + 60} 28 L${x + 120} 104 `;
  m += P(tr_, ln(12, LINE)) + P(tr_, ln(6, '#7A7298'));
  // wall
  m += R(XL, 110, XR - XL, GY.floor - 110, 0, { fill: 'url(#stCinder)' }) + R(XL, 104, XR - XL, 12, 0, { fill: '#2E2846' });
  for (const [a, b] of [[-1100, -700], [-560, -160], [140, 600], [1320, 1780], [2060, 2520], [2700, 3160]]) m += R(a, 140, b - a, 130, 6, ol('url(#stWinSky)', 5)) + R(a, 140, b - a, 130, 6, { fill: 'url(#stGrille)' }) + P(`M${(a + b) / 2} 140 V270`, ln(6, '#FFFFFF'));
  m += R(XL, 396, XR - XL, 40, 0, { fill: PUR }) + R(XL, 436, XR - XL, 12, 0, { fill: GOLD }) + P(`M${XL} 396 H${XR} M${XL} 448 H${XR}`, ln(3.5, LINE, 0.6));
  m += R(XL, 500, XR - XL, GY.floor - 500, 0, { fill: 'url(#stMat)' }) + P(`M${XL} 500 H${XR}`, ln(5));
  for (let x = XL + 180; x < XR; x += 480) m += P(`M${x} 104 V132`, ln(4, '#5A5470')) + P(`M${x - 34} 160 Q${x} 118 ${x + 34} 160 Z`, ol('#5A5470', 4)) + P(`M${x - 30} 160 L${x - 20} 176 H${x + 20} L${x + 30} 160`, ln(3, '#8A84A6')) + glow(x, 190, 140, 60, '#FFF6D8', 0.7);
  // banners
  for (const [bx, txt, yr] of [[360, 'CHAMPS', '2019'], [1540, 'CHAMPS', '2023'], [2900, 'STATE', 'FINALS']]) {
    const sw = Math.sin(t * 1.2 + bx) * 1;
    m += G(P('M-60 0 H60 V190 L0 226 L-60 190 Z', ol(PUR, 5)) + P('M-60 10 H60', ln(6, GOLD)) + G(icon('star'), 'translate(0 56) scale(0.9)') + TF(txt, 0, 126, 26, '#FFFFFF') + TF(yr, 0, 160, 26, GOLD), `translate(${bx} 112) rotate(${f(sw)})`);
  }
  // scoreboard
  if (!fair || o.scoreboard !== undefined) m += scoreboard(960, 220, { scoreboard: o.scoreboard, clock: o.clock });
  else {
    const sw = Math.sin(t * 1.1) * 0.6;
    let b = P('M-420 -96 V0 M420 -96 V0', ln(5, '#5A5470')) + R(-500, 0, 1000, 200, 18, ol('#FFFFFF', 6)) + R(-486, 14, 972, 172, 12, { fill: PUR }) + R(-486, 14, 972, 10, 4, { fill: GOLD });
    b += TF('OAKHILL', 0, 70, 40, '#FFFFFF', { 'letter-spacing': 10 }) + T('SCIENCE FAIR', 0, 160, 92, GOLD, OUTL(9, PUR_D)) + owl(-400, 100, 0.62) + G(E(0, 0, 30, 11, ln(4, GOLD)) + G(E(0, 0, 30, 11, ln(4, GOLD)), 'rotate(60)') + G(E(0, 0, 30, 11, ln(4, GOLD)), 'rotate(-60)') + CI(0, 0, 7, ol('#FF6F91', 2)), 'translate(400 100) scale(1.6)');
    m += G(b, `translate(960 112) rotate(${f(sw)})`);
  }
  // right: climbing wall + hoop
  m += R(1900, 150, 420, 350, 8, ol('#8FA3C8', 5));
  const holds = ['#FF6F91', GOLD, '#3FBF8F', '#FF8A3D', '#4F86F7'];
  for (let i = 0; i < 18; i++) m += P(`M${f(1930 + hash(i * 2.3) * 360)} ${f(180 + hash(i * 5.1) * 290)} l18 -8 l12 14 l-10 14 l-20 -4 Z`, ol(holds[i % 5], 3));
  m += G(R(-130, -90, 260, 170, 8, ol('#E9F6FF', 5)) + R(-50, -30, 100, 70, 4, ln(5, '#E8443C')) + P('M-40 80 L40 80 L30 140 L-30 140 Z', { fill: 'none', stroke: '#FFFFFF', 'stroke-width': 4 }) + E(0, 82, 46, 10, ln(6, '#FF6A2E')) + R(-20, -150, 40, 60, 4, ol('#5A5470', 4)), tr(2640, 260));
  m += R(3000, 230, 260, 450, 6, ol('#F7F1E6', 6)) + R(3016, 246, 228, 434, 4, ol(PUR, 5)) + TF('LOCKERS', 3130, 216, 26, PUR);
  // floor + court lines
  m += R(XL, GY.floor, XR - XL, YB - GY.floor, 0, { fill: 'url(#stMaple)' }) + R(XL, GY.floor - 4, XR - XL, 14, 0, { fill: '#2E2846' }) + R(XL, GY.floor + 10, XR - XL, 50, 0, { fill: '#5A3A1A', opacity: 0.08 });
  const fanX = (X, y) => 960 + (X - 960) * (y - GY.yh) / (724 - GY.yh);
  let cl = `M${XL} 724 H${XR} M960 724 V${YB} `;
  for (const X of [540, 1380, -300, 2220]) cl += `M${f(X)} 724 L${f(fanX(X, 1500))} 1500 `;
  m += P(cl, ln(9, PUR, 0.85)) + P(`M${f(fanX(540, 724) - 6)} 724 L${f(fanX(540, 1500) - 6)} 1500 M${f(fanX(1380, 724) + 6)} 724 L${f(fanX(1380, 1500) + 6)} 1500`, ln(3, '#FFFFFF', 0.4));
  m += E(960, 905, 330, 92, ln(12, GOLD)) + E(960, 905, 330, 92, ln(3, LINE, 0.4)) + E(960, 905, 250, 66, { fill: PUR, opacity: 0.75 }) + G(T('OWLS', 0, 40, 140, GOLD, { 'letter-spacing': 12 }), 'translate(960 902) scale(1 0.42)');
  m += P(`M${f(fanX(2050, 724))} 724 L${f(fanX(2050, 1500))} 1500 L${f(fanX(2600, 1500))} 1500 L${f(fanX(2600, 724))} 724 Z`, { fill: PUR, opacity: 0.35 });
  // floor shine
  let sh = '';
  for (let x = XL + 180; x < XR; x += 480) sh += elD(x, 760, 120, 10) + ' ';
  m += P(sh, { fill: '#FFFFFF', opacity: 0.4 });
  for (const [a, b] of [[140, 600], [1320, 1780]]) m += P(`M${a} 270 L${b} 270 L${b + 300} 1100 L${a + 160} 1100 Z`, { fill: 'url(#stBeam)', opacity: 0.22 });
  // bleachers (left)
  const bl = bleachers(-900, 300, GY.floor + 70, { crowd: bool01(o.crowd, fair ? 0.35 : 0.8), cheer: bool01(o.cheer), t });
  m += bl.svg;
  let fr0 = '', fr1 = '', light = '';
  if (!fair) {
    const bm = o.balls === undefined ? 'line' : o.balls;
    const cols = [PUR_L, GOLD, '#FF8A3D'];
    if (bm === 'line') for (let i = 0; i < 4; i++) { const y = [748, 820, 912, 1036][i], sc = gymScale(y); m += E(960, y + 2, 40 * sc / 0.5, 9 * sc / 0.5, { fill: '#5A3A1A', opacity: 0.2 }) + foamBall(960, y - 28 * sc / 0.5, 30 * sc / 0.5, cols[i % 3]); }
    if (bm === 'scatter' || bm === 'line') for (const [bx, by, c] of [[160, 1040, 0], [1780, 1060, 2], [1240, 760, 1], [700, 770, 2]]) { const sc = gymScale(by); m += E(bx, by + 2, 40 * sc / 0.5, 9 * sc / 0.5, { fill: '#5A3A1A', opacity: 0.2 }) + foamBall(bx, by - 28 * sc / 0.5, 30 * sc / 0.5, cols[c]); }
    // ball cart near the coach
    m += G(R(-90, -150, 180, 130, 10, { fill: 'none', stroke: '#8A93A6', 'stroke-width': 6 }) + foamBall(-50, -120, 30, GOLD) + foamBall(10, -112, 30, PUR_L) + foamBall(56, -124, 30, '#FF8A3D') + foamBall(-20, -66, 30, '#FF8A3D') + foamBall(40, -60, 30, GOLD) + P('M-90 -20 H90 M-90 -86 H90 M-30 -150 V-20 M30 -150 V-20', ln(4, '#8A93A6')) + CI(-70, 0, 14, ol('#3A3456', 3)) + CI(70, 0, 14, ol('#3A3456', 3)), tr(-150, 840, 0.86));
  } else {
    // SCIENCE FAIR: banner over the scoreboard area, bunting, tables
    for (const [x0, x1] of [[-1500, -200], [-200, 420], [1500, 2120], [2120, 3900]]) {
      const cols = ['#FF6F91', GOLD, '#3FBF8F', '#4F86F7', PUR_L];
      let bu = P(`M${x0} 110 Q${(x0 + x1) / 2} 220 ${x1} 110`, ln(3, '#5A5470'));
      const n = Math.round((x1 - x0) / 110);
      for (let i = 0; i < n; i++) { const u = (i + 0.5) / n, bx = lerp(x0, x1, u), by = 110 + 4 * 55 * u * (1 - u); bu += P(`M${f(bx - 26)} ${f(by)} L${f(bx + 26)} ${f(by)} L${f(bx)} ${f(by + 50)} Z`, ol(cols[i % 5], 3)); }
      m += bu;
    }
    const B = FAIR.back, kb = B.s / 0.5;
    B.xs.forEach((x, i) => { fr0 += fairTable(x, B.top, kb, B.kinds[i], t, { cloth: i % 2 ? '#3E7BD8' : PUR }); });
    const Fr = FAIR.front;
    for (const [x, kind] of Fr.extra) fr1 += fairTable(x, Fr.top, 1, kind, t, { cloth: '#3E7BD8' });
    fr1 += fairTable(Fr.potato, Fr.top, 1, 'potato', t, { w: 480, cloth: '#8A6A4A', trim: '#E8C38A', ribbon: o.ribbon === 'potato' ? '1st' : null }) + potatoBattery(Fr.potato - 10, Fr.top - 10, 0.95, o.bulb === undefined ? 0.25 : o.bulb);
    fr1 += fairTable(Fr.smart, Fr.top, 1, 'smart', t, { w: 620, cloth: '#1E2A4A', trim: '#3FE07A', board: 1.12, ribbon: o.ribbon === 'smart' ? '1st' : null });
    // smart table gadgets: laptop with a graph, molecule model, mini wind turbine
    const sx = Fr.smart, ty = Fr.top - 12;
    fr1 += G(P('M-70 0 L-60 -70 L60 -70 L70 0 Z', ol('#C9CED8', 4)) + R(-54, -64, 108, 56, 3, { fill: '#0E1424' }) + P('M-46 -18 L-20 -34 L4 -26 L30 -52 L46 -46', ln(4, '#3FE07A')) + R(-80, 0, 160, 10, 4, ol('#AEB6C4', 3)), tr(sx - 230, ty));
    fr1 += G(P('M-30 -40 L0 -70 L34 -46 M0 -70 V-110', ln(5, '#5A5470')) + CI(-30, -40, 14, ol('#E8443C', 3)) + CI(0, -70, 18, ol('#4F86F7', 3)) + CI(34, -46, 12, ol('#FFFFFF', 3)) + CI(0, -110, 12, ol('#FFFFFF', 3)) + R(-34, -14, 68, 14, 3, ol('#3A3456', 3)), tr(sx + 220, ty));
    const a = t * 300;
    let bl_ = '';
    for (let i = 0; i < 3; i++) { const r = (a + i * 120) * Math.PI / 180; bl_ += `M0 -130 L${f(Math.cos(r) * 46)} ${f(-130 + Math.sin(r) * 46)} `; }
    fr1 += G(P('M0 0 V-130', ln(6, '#C9CED8')) + P(bl_, ln(8, '#FFFFFF')) + P(bl_, ln(3, LINE, 0.4)) + CI(0, -130, 7, ol('#C9CED8', 2.5)), tr(sx + 290, ty, 0.8));
    // parents walking the aisle (between the rows)
    const pk = bool01(o.parents, 1);
    if (pk > 0) {
      const ppl = [];
      for (let i = 0; i < 7; i++) {
        if (hash(i * 3.3 + 1) > pk) continue;
        const dir = i % 2 ? 1 : -1, y = FAIR.aisle + (hash(i * 1.7) - 0.5) * 30;
        const stop = hash(i * 5.5) < 0.3;
        const x = md(i * 560 + (stop ? 0 : dir * t * 60) + 1400, 4400) - 1400;
        ppl.push({ x, y, s: gymScale(y), i: i * 11 + 3, kind: hash(i * 2.2) < 0.75 ? 'adult' : 'kid', pose: stop ? 'stand' : 'walk', ph: i, view: hash(i * 8.1) < 0.3 ? 'back' : 'front' });
      }
      fr0 += people(ppl, { t });
    }
  }
  return { bg: '', mid: m, front: fr0 + fr1, fg: '', light, frontRows: [fr0, fr1] };
}
const gym = makeSet(gymLayers);

// ================================================================= 4. CAFETERIA
// Sage walls over a chevron frieze and white tiles, three tall windows (left), the FUEL UP owl mural + clock, the lunch
// line on the right: kitchen pass-through (stock pot, cans, ladles), the letter-board menu, a steel counter with the
// food pans (rectangle pizza, broccoli, MYSTERY MEAT, mashed potatoes, corn) behind a sneeze guard. The lunch lady stands
// behind the counter (draw her before frontRows[2]). Three long lunch tables with attached benches on the left: far (cheap crowd),
// back, front (YOU + Benji at the right end of the front table, trays in front of them). Tank walks in along the lane
// (y 1000) from the doors at the right and stops by the end of the front table (SPOTS.cafeteria.tankStop).
// Order: mid (+ far table + its crowd) · back-table kids · frontRows[0] (back table) · front-table kids ·
//   frontRows[1] (front table + trays) · lunch lady · frontRows[2] (counter) · [lane: Tank, the line kids] · light.
//   compose(t, o, [backKids, frontKids, lunchLady], laneCharacters, cam).
// o: { quiet 0..1 (noise drops: room dims + desaturates, crowd stops talking and looks right at Tank, soft light on Tank),
//      crowd 0..1 (cheap kids at the far + back tables, default 1), trays (default true), heroTray (default true: pizza,
//      broccoli, mystery meat, milk), steam (default true), menu [lines], clock ('12:05') }
const CF = { floor: 640, far: { top: 668, s: 0.32, x0: -1300, x1: 1120 }, back: { top: 752, s: 0.4, x0: -1300, x1: 1080 }, front: { top: 874, s: 0.5, x0: -1400, x1: 900 }, counter: { x0: 1180, x1: 2600, top: 712 } };
const CAF_WIN = [[-760, -420], [-360, -20], [40, 380]];
function lunchTable(x0, x1, top, k, o = {}) {
  // long table with an attached near bench; the dark space under the top hides the seated kids' legs
  const c = o.col || '#B9A6F0', ed = mix(c, '#2A1A60', 0.3), bc = o.stool || GOLD, bd = mix(c, '#3A2A70', 0.12);
  const ud = mix(ed, '#FFFFFF', 0.18);
  let s = R(x0 + 16 * k, top, x1 - x0 - 32 * k, 150 * k, 0, { fill: ud }) + R(x0 + 16 * k, top, x1 - x0 - 32 * k, 46 * k, 0, { fill: mix(ed, '#1A1240', 0.3) });
  let lg_ = '';
  for (let x = x0 + 150 * k; x < x1 - 60 * k; x += 520 * k) lg_ += `M${f(x - 46 * k)} ${f(top + 140 * k)} Q${f(x)} ${f(top + 30 * k)} ${f(x + 46 * k)} ${f(top + 140 * k)} `;
  s += P(lg_, ln(10 * k, mix(ed, '#1A1240', 0.35), 0.9));
  s += R(x0 + 30 * k, top + 128 * k, x1 - x0 - 60 * k, 26 * k, 9 * k, ol(bc, 5)) + P(`M${f(x0 + 44 * k)} ${f(top + 136 * k)} H${f(x1 - 44 * k)}`, ln(4 * k, '#FFFFFF', 0.4));
  s += R(x0 + 46 * k, top + 154 * k, x1 - x0 - 92 * k, 90 * k, 6 * k, ol(bd, 5)) + R(x0 + 46 * k, top + 154 * k, x1 - x0 - 92 * k, 14 * k, 0, { fill: '#000000', opacity: 0.15 });
  let ft = '';
  for (let x = x0 + 120 * k; x < x1 - 60 * k; x += 520 * k) ft += rrD(x - 30 * k, top + 236 * k, 60 * k, 16 * k, 5 * k) + ' ';
  s += P(ft, ol('#6A6488', 4));
  s += R(x0, top - 30 * k, x1 - x0, 36 * k, 12 * k, ol(c, 5)) + R(x0, top + 4 * k, x1 - x0, 18 * k, 6 * k, ol(ed, 5)) + P(`M${f(x0 + 18)} ${f(top - 20 * k)} H${f(x1 - 18)}`, ln(4, '#FFFFFF', 0.45));
  return s;
}
// lunch tray (flattened onto the table). items: subset of ['pizza', 'broccoli', 'meat', 'milk', 'apple']; origin = centre
function tray(x, y, k = 1, items = ['pizza', 'broccoli', 'milk'], t = 0) {
  let s = R(-130, -42, 260, 84, 16, ol('#7AC6E8', 5)) + R(-118, -32, 120, 64, 10, { fill: '#5FB2D8' }) + R(10, -32, 50, 64, 8, { fill: '#5FB2D8' }) + R(68, -32, 52, 64, 8, { fill: '#5FB2D8' });
  if (items.includes('pizza')) s += R(-110, -26, 100, 50, 6, ol('#F6C25A', 3)) + R(-104, -20, 88, 38, 4, { fill: '#E8573C' }) + R(-100, -16, 80, 30, 4, { fill: '#FFE08A' }) + CI(-80, -6, 6, { fill: '#C0262E' }) + CI(-50, 4, 6, { fill: '#C0262E' }) + CI(-30, -8, 5, { fill: '#C0262E' });
  if (items.includes('broccoli')) s += P(`${circD(24, -10, 11)} ${circD(42, -14, 12)} ${circD(32, 4, 11)} ${circD(48, 6, 10)}`, ol('#4FAF5E', 2.5)) + P('M28 14 V24 M44 14 V24', ln(5, '#8ACB6A'));
  if (items.includes('meat')) {
    s += P('M74 6 Q70 -24 94 -26 Q120 -24 116 0 Q118 20 96 20 Q76 22 74 6 Z', ol('#8A7A6A', 3)) + P('M84 -6 q8 -6 16 2 M90 8 q8 -4 14 2', ln(2.5, '#5A4A3A'));
    const bp = md(t * 0.8, 1);
    s += CI(100, -10 - bp * 6, 4 + bp * 2, { fill: '#B9AA8A', opacity: f(1 - bp), stroke: LINE, 'stroke-width': 1.5 });
  }
  if (items.includes('apple')) s += CI(94, 0, 18, ol('#E8333C', 3));
  let top = G(s, `scale(1 0.5)`);
  if (items.includes('milk')) top += G(R(-16, -50, 32, 50, 3, ol('#FFFFFF', 3)) + P('M-16 -50 L0 -66 L16 -50 Z', ol('#5AA8F0', 3)) + R(-16, -34, 32, 14, 0, { fill: '#5AA8F0' }) + TF('MILK', 0, -23, 10, '#FFFFFF'), 'translate(150 10)');
  return G(top, tr(x, y, k));
}
function cafeteriaLayers(t, o = {}) {
  const q = bool01(o.quiet), cr = bool01(o.crowd, 1);
  // bg: the yard (k .6)
  let bg = R(-1600, -700, 2800, 1500, 0, { fill: 'url(#stSkyDay)' }) + cloud(md(-500 + t * 8, 1600) - 1000, 220, 0.6) + cloud(md(200 + t * 6, 1600) - 1000, 300, 0.45);
  bg += P('M-1500 430 Q-900 370 -300 420 Q200 450 700 400 L700 900 L-1500 900 Z', { fill: '#9AD493' }) + R(-1500, 480, 2200, 500, 0, { fill: '#7DC777' });
  bg += tree(-560, 530, 0.62, { sway: Math.sin(t * 1.2) * 1.4 }) + tree(-60, 520, 0.5, { kind: 'tall' }) + tree(330, 540, 0.58) + G(R(-120, -50, 240, 16, 5, ol('#C98A52', 3)) + R(-130, -20, 260, 12, 4, ol('#B77B46', 3)) + P('M-100 -8 V22 M100 -8 V22', ln(7, '#5A5470')), tr(-300, 560, 0.7));
  // walls
  let m = P(`M${XL} ${YT} H${XR} V${CF.floor + 10} H${XL} Z ` + CAF_WIN.map(([a, b]) => `M${a} 230 A${(b - a) / 2} ${(b - a) / 2} 0 0 1 ${b} 230 V560 H${a} Z`).join(' '), { fill: '#CFE6C4', 'fill-rule': 'evenodd' });
  m += band(YT, 40, '#F2EEE7') + band(40, 52, PUR);
  for (const [a, b] of CAF_WIN) {
    const r = (b - a) / 2;
    m += P(`M${a - 14} 560 V230 A${r + 14} ${r + 14} 0 0 1 ${b + 14} 230 V560`, { fill: 'none', stroke: '#FFFFFF', 'stroke-width': 18 }) + P(`M${a - 24} 562 V230 A${r + 24} ${r + 24} 0 0 1 ${b + 24} 230 V562`, ln(5)) + P(`M${a} 560 V230 A${r} ${r} 0 0 1 ${b} 230 V560`, ln(4));
    m += P(`M${(a + b) / 2} ${230 - r} V560 M${a} 330 H${b} M${a} 450 H${b}`, ln(11, '#FFFFFF')) + P(`M${a + 30} 540 L${a + 120} 260 L${a + 150} 260 L${a + 60} 540 Z`, { fill: '#FFFFFF', opacity: 0.2 });
  }
  m += R(-790, 556, 1200, 20, 6, ol('#F6F1E8', 4));
  m += R(XL, 420, XR - XL, 38, 0, { fill: 'url(#stChevron)' }) + P(`M${XL} 420 H${XR} M${XL} 458 H${XR}`, ln(4, LINE, 0.6));
  m += R(XL, 458, XR - XL, CF.floor - 458, 0, { fill: 'url(#stCafTile)' });
  // mural + clock + recycling
  m += G(R(-230, -150, 460, 290, 30, ol('#FFF6DE', 5)) + owl(-110, 0, 1.25) + P('M-30 30 L40 -60', ln(8, '#C9CED8')) + P('M34 -76 l12 20 M42 -80 l12 20 M50 -84 l12 20', ln(5, '#C9CED8')) + T('FUEL UP,', 110, -10, 50, PUR) + T('OWLS!', 110, 46, 56, GOLD, OUTL(7, PUR_D)) + G(icon('star'), 'translate(196 96) scale(0.6)'), tr(780, 250, 1, -2));
  m += wallClock(1120, 140, 44, o.clock ?? '12:05', { t });
  m += G(R(-60, -130, 120, 130, 10, ol('#3E7BD8', 4)) + R(-50, -150, 100, 26, 6, ol('#2E5EB0', 4)) + TF('RECYCLE', 0, -60, 18, '#FFFFFF') + R(70, -120, 110, 120, 10, ol('#5A5470', 4)) + R(78, -140, 94, 26, 6, ol('#3A3456', 4)) + TF('TRASH', 125, -54, 18, '#FFFFFF'), tr(920, CF.floor));
  // lunch line: kitchen pass-through, menu letter board
  const C = CF.counter;
  m += R(C.x0, 320, C.x1 - C.x0, C.top - 320, 0, { fill: '#C9D0DC' }) + R(C.x0, 320, C.x1 - C.x0, C.top - 320, 0, { fill: 'url(#stCafTile)', opacity: 0.35 });
  m += R(C.x0 + 40, 360, 520, 18, 4, ol('#AEB6C4', 4)) + R(C.x0 + 840, 360, 500, 18, 4, ol('#AEB6C4', 4));
  for (let i = 0; i < 6; i++) m += G(R(-30, -70, 60, 70, 6, ol(['#E8573C', '#FFD86A', '#4FAF5E'][i % 3], 3.5)) + R(-30, -50, 60, 26, 0, { fill: '#FFFFFF' }) + TF(['BEANS', 'CORN', 'PEAS'][i % 3], 0, -32, 13, '#3A3456'), tr(C.x0 + 90 + i * 80, 360));
  for (let i = 0; i < 4; i++) m += P(`M${C.x0 + 900 + i * 90} 380 V470`, ln(5, '#8A93A6')) + E(C.x0 + 900 + i * 90, 482, 22, 14, ol('#AEB6C4', 3));
  m += G(R(-110, -150, 220, 150, 14, ol('#AEB6C4', 6)) + R(-126, -166, 252, 26, 10, ol('#C9D0DC', 5)) + R(-140, 0, 280, 30, 4, ol('#3A3456', 4)), tr(C.x0 + 1250, 600));
  if (o.steam !== false) for (let i = 0; i < 3; i++) { const ph = md(t * 0.5 + i * 0.33, 1); m += P(`M${f(C.x0 + 1210 + i * 40)} ${f(430 - ph * 80)} q-14 -30 0 -60 q14 -30 0 -60`, ln(10, '#FFFFFF', f(0.5 * (1 - ph)))); }
  {
    const menu = o.menu || ["TODAY'S LUNCH", 'PIZZA · $2', 'BROCCOLI · FREE', 'MYSTERY MEAT · ???'];
    let mb = R(-340, -120, 680, 240, 12, ol('#3A3456', 7)) + R(-324, -104, 648, 208, 6, { fill: '#1E1A2C' });
    let gr = '';
    for (let y = -96; y < 104; y += 12) gr += `M-324 ${y} H324 `;
    mb += P(gr, ln(1.5, '#2C2640')) + R(-324, -104, 648, 56, 6, { fill: PUR }) + T(menu[0], 0, -62, 42, GOLD, { 'letter-spacing': 3 });
    menu.slice(1).forEach((l, i) => { mb += TF(l, 0, -6 + i * 44, Math.min(34, 600 / (l.length * 0.62)), i === 2 ? '#FFB3C6' : '#F4F1FA', { 'letter-spacing': 2 }); });
    m += G(mb, tr(1570, 170));
  }
  // floor
  m += band(CF.floor, YB, 'url(#stCafFloor)') + band(CF.floor - 4, CF.floor + 10, '#4E7A56') + R(XL, CF.floor + 10, XR - XL, 40, 0, { fill: '#000', opacity: 0.06 });
  m += G(R(-140, -390, 280, 390, 8, ol('#F7F1E6', 6)) + R(-126, -376, 124, 376, 4, ol('#8A70EA', 4)) + R(2, -376, 124, 376, 4, ol('#8A70EA', 4)) + CI(-64, -270, 34, ol('#C7E6FF', 4)) + CI(64, -270, 34, ol('#C7E6FF', 4)) + R(-110, -190, 92, 12, 5, ol('#D9DEE8', 3)) + R(18, -190, 92, 12, 5, ol('#D9DEE8', 3)) + R(-110, -440, 220, 44, 8, ol('#FFFFFF', 4)) + T('EXIT', 0, -405, 32, '#E8333C'), tr(2880, CF.floor + 4));
  for (const [a, b] of CAF_WIN) m += P(`M${a} ${CF.floor + 10} L${b} ${CF.floor + 10} L${b + 380} 1300 L${a + 240} 1300 Z`, { fill: 'url(#stBeam)', opacity: f(0.45 * (1 - q * 0.6)) });
  // far table + cheap crowd
  const kf = CF.far.s / 0.5;
  if (cr > 0) m += people(crowdRow(CF.far.x0 + 60, CF.far.x1 - 40, seatY(CF.far.top, CF.far.s), CF.far.s, { seed: 4, dx: 300, density: cr, jit: 0 }).map((p) => ({ ...p, mouth: q > 0.3 ? 'line' : 'talk', look: q > 0.3 ? 0.9 : undefined })), { t, quiet: q > 0.3, dim: q * 0.5 });
  m += lunchTable(CF.far.x0, CF.far.x1, CF.far.top, kf, { col: '#C9B8F2', stool: '#FFD86A' });
  if (o.trays !== false) for (let x = CF.far.x0 + 200; x < CF.far.x1 - 100; x += 300) m += tray(x, CF.far.top - 14 * kf, kf * 0.8, hash(x) < 0.5 ? ['pizza', 'milk'] : ['broccoli', 'apple'], t);
  // the room fades back when it goes quiet
  if (q > 0) m += R(XL, YT, XR - XL, YB - YT, 0, { fill: '#2A2346', opacity: f(0.34 * q) }) + R(XL, YT, XR - XL, YB - YT, 0, { fill: '#B8B2C8', opacity: f(0.12 * q) });
  // back table (+ cheap crowd on its left part)
  const kb = CF.back.s / 0.5;
  let fr0 = '';
  if (cr > 0) fr0 += people(crowdRow(CF.back.x0 + 80, -260, seatY(CF.back.top, CF.back.s), CF.back.s, { seed: 9, dx: 290, density: cr, jit: 0 }).map((p) => ({ ...p, mouth: q > 0.3 ? 'line' : 'talk', look: q > 0.3 ? 0.9 : undefined })), { t, quiet: q > 0.3, dim: q * 0.35 });
  fr0 += lunchTable(CF.back.x0, CF.back.x1, CF.back.top, kb, { col: '#B9A6F0', stool: '#7FD3A8' });
  if (o.trays !== false) for (const x of [-1100, -820, -540, -100, 380, 860]) fr0 += tray(x, CF.back.top - 14 * kb, kb * 0.85, hash(x * 0.3) < 0.5 ? ['pizza', 'broccoli', 'milk'] : ['meat', 'apple', 'milk'], t);
  // front table + trays
  let fr1 = lunchTable(CF.front.x0, CF.front.x1, CF.front.top, 1, { col: '#A996F2', stool: GOLD });
  if (o.trays !== false) {
    for (const x of [-1100, -760, -420, 100]) fr1 += tray(x, CF.front.top - 14, 0.9, ['pizza', 'milk'], t);
    fr1 += tray(530, CF.front.top - 14, 0.9, ['pizza', 'broccoli', 'milk'], t);
    if (o.heroTray !== false) fr1 += tray(760, CF.front.top - 14, 0.9, ['pizza', 'broccoli', 'meat', 'milk'], t);
  }
  // counter (front of the lunch line)
  let fr2 = '';
  const pans = [[1360, 'pizza'], [1580, 'broccoli'], [1800, 'meat'], [2020, 'potato'], [2240, 'corn']];
  for (const [px, kind] of pans) {
    const py = C.top - 6;
    fr2 += R(px - 100, py - 10, 200, 30, 6, ol('#C9D0DC', 4));
    if (kind === 'pizza') { for (let i = 0; i < 3; i++) fr2 += R(px - 90 + i * 60, py - 26, 56, 30, 4, ol('#F6C25A', 3)) + R(px - 84 + i * 60, py - 22, 44, 20, 3, { fill: '#E8573C' }) + R(px - 80 + i * 60, py - 20, 36, 16, 3, { fill: '#FFE08A' }) + CI(px - 70 + i * 60, py - 14, 4, { fill: '#C0262E' }); }
    else if (kind === 'broccoli') fr2 += P(`${circD(px - 50, py - 16, 18)} ${circD(px - 18, py - 24, 20)} ${circD(px + 16, py - 18, 19)} ${circD(px + 50, py - 22, 18)} ${circD(px - 2, py - 38, 16)}`, ol('#4FAF5E', 3)) + P(`${circD(px - 26, py - 34, 6)} ${circD(px + 24, py - 30, 6)}`, { fill: '#86D97F' });
    else if (kind === 'meat') {
      fr2 += P(`M${px - 90} ${py} Q${px - 86} ${py - 40} ${px - 30} ${py - 36} Q${px} ${py - 56} ${px + 40} ${py - 38} Q${px + 92} ${py - 36} ${px + 90} ${py} Z`, ol('#8A7A6A', 3.5)) + P(`M${px - 50} ${py - 18} q14 -10 28 2 M${px + 10} ${py - 26} q14 -8 26 4`, ln(3, '#5A4A3A'));
      for (let i = 0; i < 3; i++) { const bp = md(t * 0.7 + i * 0.37, 1); fr2 += CI(px - 40 + i * 40, py - 36 - bp * 14, 6 + bp * 4, { fill: '#B9AA8A', opacity: f(1 - bp), stroke: LINE, 'stroke-width': 2 }); }
      const sk = Math.sin(t * 3) * 6;
      fr2 += P(`M${px - 30} ${py - 60} q${f(-10 + sk)} -20 0 -40 q${f(10 - sk)} -20 0 -40 M${px + 30} ${py - 56} q${f(10 - sk)} -20 0 -40 q${f(-10 + sk)} -20 0 -40`, ln(5, '#9ACB4A', 0.75));
    } else if (kind === 'potato') fr2 += P(`${circD(px - 46, py - 14, 24)} ${circD(px + 6, py - 18, 26)} ${circD(px + 54, py - 12, 22)}`, ol('#FFF6DE', 3)) + E(px + 6, py - 30, 10, 5, { fill: '#FFD86A' });
    else fr2 += P(`M${px - 86} ${py} Q${px} ${py - 40} ${px + 86} ${py} Z`, ol('#FFD84A', 3)) + P(`M${px - 50} ${py - 10} h10 M${px - 10} ${py - 18} h10 M${px + 30} ${py - 12} h10`, ln(4, '#E8B020'));
    if (o.steam !== false && kind !== 'broccoli') { const ph = md(t * 0.6 + px * 0.001, 1); fr2 += P(`M${f(px + 10)} ${f(py - 50 - ph * 40)} q${f(-12 + ph * 24)} -26 0 -52`, ln(6, '#FFFFFF', f(0.5 * (1 - ph)))); }
  }
  fr2 += P(`M${C.x0 + 40} ${C.top - 8} L${C.x0 + 62} ${C.top - 72} L${C.x1 - 62} ${C.top - 72} L${C.x1 - 40} ${C.top - 8} Z`, { fill: '#DDF4FF', opacity: 0.3, stroke: LINE, 'stroke-width': 4 }) + P(`M${C.x0 + 56} ${C.top - 72} H${C.x1 - 56}`, ln(8, '#C9D0DC'));
  fr2 += R(C.x0, C.top, C.x1 - C.x0, 26, 6, ol('url(#stSteel)', 5)) + R(C.x0 - 10, C.top + 24, C.x1 - C.x0 + 20, 190, 4, ol('#9AA8BE', 6)) + R(C.x0 - 10, C.top + 24, C.x1 - C.x0 + 20, 190, 4, { fill: 'url(#stSteel)', opacity: 0.45 });
  for (let x = C.x0 + 20; x < C.x1 - 100; x += 240) fr2 += R(x, C.top + 80, 210, 110, 8, { fill: 'none', stroke: '#7F8EA8', 'stroke-width': 4 });
  fr2 += R(C.x0 - 30, C.top + 48, C.x1 - C.x0 + 60, 26, 6, ol('#C9D0DC', 5)) + P(`M${C.x0 - 20} ${C.top + 58} H${C.x1 + 20}`, ln(3, '#FFFFFF', 0.7));
  const tag = (x, txt, col) => G(P('M-60 0 L-50 -40 L50 -40 L60 0 Z', ol('#FFFFFF', 3)) + TF(txt, 0, -12, txt.length > 8 ? 16 : 20, col), tr(x, C.top + 48));
  fr2 += tag(1360, 'PIZZA', '#E8573C') + tag(1580, 'BROCCOLI', '#3E9E5A') + tag(1800, '???', '#8A7A6A') + tag(2020, 'MASH', '#9A8A6A') + tag(2240, 'CORN', '#C89A10');
  if (q > 0) fr2 += R(C.x0 - 40, C.top - 140, C.x1 - C.x0 + 80, 360, 0, { fill: '#2A2346', opacity: f(0.22 * q) });
  let light = '';
  if (q > 0) light += glow(1080, 1000, 300, 70, '#FFF1C8', q * 1.3) + P('M960 -200 L1200 -200 L1300 1000 L860 1000 Z', { fill: 'url(#stBeamW)', opacity: f(0.18 * q) });
  return { bg, mid: m, front: fr0 + fr1 + fr2, fg: '', light, frontRows: [fr0, fr1, fr2] };
}
const cafeteria = makeSet(cafeteriaLayers);

// ================================================================= 5. SCHOOL EXTERIOR — morning establishing shot
// Red-brick two-storey OAKHILL MIDDLE SCHOOL with a cream columned entrance pavilion (pediment clock, cupola + owl weather
// vane), the flag, a letter-board marquee on the lawn, a yellow bus in the bus loop (right), big trees, hedges, the
// walkway from the doors (y 600) to the sidewalk (stand line y 960). Strong perspective: scaleAt(y) = .5 (y - 425) / 535
// (door .164 · marquee .27 · bus door .26 · sidewalk .5). Parallax: sky k 0 · sun .04 · clouds .1 · town + water tower .3 ·
// trees behind the roof .65 · school/grounds 1 · foreground bushes 1.3.
// o: { time 'morning' (default) | 'day', crowd 0..1 (kids walking in, default .7), bus (default true), busX (offset),
//      marquee [line1, line2], flag (default true) }
const EX = { yh: 425, base: 560, x0: -1000, x1: 2900, pav: [740, 1180] };
const extScale = (y) => Math.round(500 * (y - EX.yh) / (960 - EX.yh)) / 1000;
function schoolBus(x, y, s = 1, t = 0) {
  // side view facing LEFT; origin = front-wheel ground point? -> origin = left (front) end at the ground
  let o = E(560, 6, 600, 22, { fill: '#000', opacity: 0.18 });
  o += P('M0 -60 L0 -250 Q0 -300 60 -310 L140 -320 L140 -400 Q140 -440 190 -440 L1140 -440 Q1180 -440 1180 -400 L1180 -60 Z', ol('#FFC21F', 8));
  o += R(0, -120, 1180, 40, 0, { fill: '#151515', opacity: 0.85 }) + R(0, -230, 1180, 14, 0, { fill: '#151515', opacity: 0.7 }) + TF('OAKHILL SCHOOL DISTRICT', 640, -175, 44, '#151515');
  let w = '';
  for (let i = 0; i < 9; i++) w += rrD(230 + i * 102, -400, 82, 120, 10) + ' ';
  o += P(w, ol('#BFE6FF', 5)) + P('M30 -240 L40 -300 L130 -310 L130 -240 Z', ol('#BFE6FF', 5));
  o += R(150, -400, 60, 330, 6, ol('#BFE6FF', 5)) + P('M180 -400 V-70', ln(4));
  o += G(R(-70, -24, 140, 48, 10, ol('#E8333C', 5)) + TF('STOP', 0, 12, 30, '#FFFFFF'), 'translate(-26 -170) scale(0.6)');
  o += R(-14, -110, 30, 40, 6, ol('#FFFFFF', 4)) + R(1170, -380, 24, 50, 6, ol('#E8333C', 4)) + R(1150, -110, 40, 30, 6, ol('#E8333C', 4));
  for (const wx of [200, 960]) o += CI(wx, -40, 62, ol('#2A2633', 8)) + CI(wx, -40, 26, ol('#C9CED8', 4)) + P(`M${wx - 18} -40 H${wx + 18}`, { stroke: '#7A8090', 'stroke-width': 6, transform: `rotate(${f(t * 30)} ${wx} -40)` });
  return G(o, tr(x, y, s));
}
function marquee(x, y, s, lines) {
  let o = R(-260, -40, 60, 40, 4, ol('#C8735A', 5)) + R(200, -40, 60, 40, 4, ol('#C8735A', 5)) + R(-250, -300, 40, 270, 4, ol('#B8634A', 5)) + R(210, -300, 40, 270, 4, ol('#B8634A', 5));
  o += R(-230, -330, 460, 250, 12, ol('#F2E6D6', 6)) + R(-214, -314, 428, 54, 6, { fill: PUR }) + T('OAKHILL MIDDLE', 0, -276, 36, GOLD) + R(-214, -252, 428, 156, 6, { fill: '#FFFFFF', stroke: LINE, 'stroke-width': 4 });
  let gr = '';
  for (let yy = -240; yy < -100; yy += 30) gr += `M-206 ${yy} H206 `;
  o += P(gr, ln(1.5, '#D8D2E6'));
  lines.forEach((l, i) => { o += T(l, 0, -196 + i * 64, Math.min(46, 370 / (l.length * 0.6 + 0.5)), '#2A2246', { 'letter-spacing': 2 }); });
  o += owl(-190, -330, 0.5) + bush(-120, 0, 0.5, '#5CB86A') + bush(140, 0, 0.45);
  return G(o, tr(x, y, s));
}
function extCrowd(t, o = {}) {
  const k = bool01(o.crowd, 0.6);
  if (k <= 0) return [];
  const out = [];
  // walking up the walkway toward the doors
  for (let i = 0; i < 5; i++) {
    if (hash(i * 2.7 + 3) > k) continue;
    const u = md(i / 6 + t * 0.045, 1);
    const y = lerp(880, 610, u), s = extScale(y);
    out.push({ x: 960 + (hash(i * 4.1) - 0.5) * 900 * s, y, s, i: i * 13 + 1, pose: 'walk', ph: i * 1.7, view: 'back', speed: 6 });
  }
  // along the sidewalk
  for (let i = 0; i < 6; i++) {
    if (hash(i * 5.3 + 7) > k) continue;
    const dir = i % 2 ? 1 : -1, y = 930 + hash(i * 1.9) * 60;
    out.push({ x: md(i * 900 + dir * t * 75 + 2400, 6600) - 2400, y, s: extScale(y), i: i * 7 + 30, pose: 'walk', ph: i, view: 'front', speed: 7 });
  }
  // at the bus door + by the marquee
  if (o.bus !== false) for (let i = 0; i < 3; i++) if (hash(i * 9.1) < k) { const y = 712 + i * 22; out.push({ x: 1580 + i * 70 + (o.busX || 0), y, s: extScale(y), i: i * 5 + 60, view: i === 1 ? 'back' : 'front' }); }
  return out;
}
function exteriorLayers(t, cam = {}, o = {}) {
  const day = o.time === 'day';
  const sky = R(-400, -400, 2720, 1880, 0, { fill: day ? 'url(#stSkyDay)' : 'url(#stSkyMorning)', transform: 'translate(0 -120) scale(1 0.9)' });
  const sun = sunDisc(day ? 1500 : 360, day ? 150 : 250, 74, t, day ? '#FFE57A' : '#FFD86A');
  let clouds = '';
  for (const [cx, cy, cs, sp] of [[-200, 120, 0.9, 10], [600, 60, 0.7, 7], [1300, 170, 0.8, 12], [2100, 90, 1, 9], [2900, 150, 0.7, 8]]) clouds += cloud(md(cx + t * sp + 1200, 4400) - 1200, cy, cs, day ? '#FFFFFF' : '#FFF6F0', day ? '#DDEBFA' : '#FFD9CC');
  for (let i = 0; i < 4; i++) clouds += bird(md(t * 120 + i * 260, 3200) - 600, 220 + i * 24 + Math.sin(t * 2 + i) * 8, 0.8, t, i);
  // far town (k .3)
  let far = P('M-1800 470 Q-1000 380 -200 440 Q600 490 1400 420 Q2200 370 3600 450 L3600 800 L-1800 800 Z', { fill: day ? '#A8D6A0' : '#B9CFA0' });
  const rr = (seed) => hash(seed * 3.7);
  for (let i = 0; i < 26; i++) { const x = -1700 + i * 200 + rr(i) * 60, w = 120 + rr(i + 40) * 60, h = 50 + rr(i + 80) * 60; far += R(x, 470 - h, w, h + 60, 4, { fill: ['#E3B9A6', '#D9C3E6', '#F0D9A6', '#BFD3E6'][i % 4] }) + P(`M${f(x - 10)} ${f(470 - h)} L${f(x + w / 2)} ${f(470 - h - 40)} L${f(x + w + 10)} ${f(470 - h)} Z`, { fill: ['#B8634A', '#7A5A9A', '#C9824A', '#5A7AA8'][i % 4] }); }
  far += G(P('M-70 0 L-50 -190 M70 0 L50 -190 M-60 -80 L60 -80 M-56 -140 L56 -140', ln(9, '#8A93B0')) + P('M-96 -190 H96 V-290 Q96 -332 0 -336 Q-96 -332 -96 -290 Z', ol('#C9D0E6', 5)) + T('OAKHILL', 0, -232, 36, PUR) + P('M0 -336 V-372', ln(5, '#8A93B0')), tr(1560, 420));
  // trees behind the roof (k .65)
  let back = '';
  for (let i = 0; i < 14; i++) if (i !== 8 && i % 3 !== 2) back += tree(-1400 + i * 360 + hash(i) * 100, 430 + hash(i * 2) * 40, 0.42 + hash(i * 3) * 0.2, { kind: i % 3 === 1 ? 'tall' : 'round', col: i % 2 ? '#56B060' : '#4CA85A', sway: Math.sin(t * 1.1 + i) * 1 });
  // ---------- school + grounds (k 1)
  let m = '';
  m += R(-4000, EX.base - 20, 9000, 2400, 0, { fill: '#78C46E' }) + P(`M-4000 ${EX.base + 60} H5000`, ln(0));
  // main block
  const bx0 = EX.x0, bx1 = EX.x1, roof = 230;
  m += R(bx0, roof, bx1 - bx0, EX.base - roof, 0, { fill: 'url(#stBrick)' }) + R(bx0, roof, bx1 - bx0, EX.base - roof, 0, ln(6));
  m += R(bx0 - 20, roof - 26, bx1 - bx0 + 40, 30, 4, ol('#F2E6D6', 5)) + R(bx0 - 10, roof - 40, bx1 - bx0 + 20, 16, 3, ol('#D9CBB6', 4)) + R(bx0, 392, bx1 - bx0, 12, 0, { fill: '#F2E6D6', stroke: LINE, 'stroke-width': 3 }) + R(bx0, EX.base - 28, bx1 - bx0, 28, 0, { fill: '#D9CBB6', stroke: LINE, 'stroke-width': 3 });
  // windows (merged paths)
  let fr = '', gl = '', mu = '', sh = '', sl = '';
  for (let x = bx0 + 50; x < bx1 - 60; x += 128) {
    if (x > EX.pav[0] - 100 && x < EX.pav[1] + 20) continue;
    for (const wy of [262, 424]) {
      fr += rrD(x - 6, wy - 6, 86, 112, 4) + ' '; gl += rrD(x, wy, 74, 100, 3) + ' ';
      mu += `M${x + 37} ${wy} V${wy + 100} M${x} ${wy + 44} H${x + 74} `; sh += `M${x + 6} ${wy + 92} L${x + 30} ${wy + 8} L${x + 44} ${wy + 8} L${x + 20} ${wy + 92} Z `; sl += rrD(x - 10, wy + 104, 94, 12, 3) + ' ';
    }
  }
  m += P(fr, ol('#FFFFFF', 4)) + P(gl, { fill: day ? '#9ED0F2' : '#A9C8EE' }) + P(sh, { fill: '#FFFFFF', opacity: 0.4 }) + P(mu, ln(6, '#FFFFFF')) + P(sl, ol('#F2E6D6', 3));
  // entrance pavilion
  {
    const [p0, p1] = EX.pav, pc = (p0 + p1) / 2;
    m += R(p0, 150, p1 - p0, EX.base - 150, 0, ol('#F2E6D6', 6)) + R(p0 + 20, 150, 40, EX.base - 150, 0, { fill: '#FFFFFF', opacity: 0.35 });
    // cupola + vane
    m += R(pc - 50, -40, 100, 110, 6, ol('#FFFFFF', 5)) + P(`M${pc - 26} 60 V0 Q${pc} -26 ${pc + 26} 0 V60 Z`, ol('#3A2E6A', 4)) + P(`M${pc - 12} 20 Q${pc} -6 ${pc + 12} 20 L${pc + 8} 36 H${pc - 8} Z`, ol(GOLD, 3));
    m += P(`M${pc - 70} -40 L${pc} -130 L${pc + 70} -40 Z`, ol('#5B44B8', 5)) + R(pc - 74, -46, 148, 14, 4, ol('#FFFFFF', 4)) + P(`M${pc} -130 V-178`, ln(5)) + P(`M${pc - 34} -168 H${pc + 34}`, ln(4)) + G(owl(0, 0, 0.3, { col: '#3A3456', belly: '#3A3456' }), tr(pc + 6, -196, 1, Math.sin(t * 0.7) * 8));
    m += P(`M${p0 - 30} 158 L${pc} 50 L${p1 + 30} 158 Z`, ol('#F2E6D6', 6)) + P(`M${p0 + 30} 150 L${pc} 76 L${p1 - 30} 150 Z`, { fill: '#E3D3BC', stroke: LINE, 'stroke-width': 3 }) + wallClock(pc, 118, 28, '8:05', { rim: PUR });
    m += R(p0 - 34, 150, p1 - p0 + 68, 24, 4, ol('#FFFFFF', 5)) + R(p0 - 10, 174, p1 - p0 + 20, 46, 0, ol(PUR, 5)) + T('OAKHILL MIDDLE SCHOOL', pc, 207, 30, GOLD);
    // doors + transom
    m += P(`M${pc - 80} ${EX.base - 4} V400 Q${pc - 80} 330 ${pc} 330 Q${pc + 80} 330 ${pc + 80} 400 V${EX.base - 4} Z`, ol('#E3D3BC', 5)) + P(`M${pc - 64} 392 Q${pc} 340 ${pc + 64} 392 Z`, ol('#BFE6FF', 4)) + P(`M${pc} 346 V392 M${pc - 40} 360 L${pc - 26} 392 M${pc + 40} 360 L${pc + 26} 392`, ln(3, '#FFFFFF'));
    m += R(pc - 64, 400, 62, EX.base - 404, 3, ol(PUR, 4)) + R(pc + 2, 400, 62, EX.base - 404, 3, ol(PUR, 4)) + R(pc - 54, 412, 42, 70, 3, ol('#BFE6FF', 3)) + R(pc + 12, 412, 42, 70, 3, ol('#BFE6FF', 3)) + R(pc - 22, 492, 14, 26, 4, ol(GOLD, 2.5)) + R(pc + 8, 492, 14, 26, 4, ol(GOLD, 2.5));
    // columns
    for (const cx of [p0 + 34, p0 + 120, p1 - 120, p1 - 34]) m += R(cx - 18, 226, 36, EX.base - 236, 0, ol('#FFFFFF', 4)) + P(`M${cx - 6} 236 V${EX.base - 14} M${cx + 8} 236 V${EX.base - 14}`, ln(2.5, '#D9CBB6')) + R(cx - 26, 220, 52, 14, 3, ol('#FFFFFF', 3.5)) + R(cx - 26, EX.base - 16, 52, 14, 3, ol('#FFFFFF', 3.5));
    // steps
    m += R(pc - 140, EX.base - 6, 280, 16, 3, ol('#E9E4DA', 4)) + R(pc - 160, EX.base + 8, 320, 16, 3, ol('#E2DCD0', 4)) + R(pc - 180, EX.base + 22, 360, 18, 3, ol('#DAD3C6', 4));
  }
  // hedges along the facade
  for (let x = bx0 + 40; x < bx1; x += 170) if (x < EX.pav[0] - 160 || x > EX.pav[1] + 120) m += bush(x, EX.base + 16, 0.42, x % 340 < 170 ? '#4FAF5E' : '#5CB86A');
  // flagpole + flag
  if (o.flag !== false) {
    const fx = 230, fb = 610, ft = -20;
    m += R(fx - 34, fb - 10, 68, 22, 4, ol('#D9CBB6', 4)) + P(`M${fx} ${fb} V${ft}`, ln(10)) + P(`M${fx} ${fb} V${ft}`, ln(5, '#E2E6EE')) + CI(fx, ft - 8, 9, ol(GOLD, 3));
    let fl = `M${fx + 4} ${ft + 4}`;
    for (let i = 1; i <= 6; i++) { const u = i / 6; fl += ` L${f(fx + 4 + u * 150)} ${f(ft + 4 + Math.sin(t * 5 - u * 4) * 8 * u)}`; }
    for (let i = 6; i >= 0; i--) { const u = i / 6; fl += ` L${f(fx + 4 + u * 150)} ${f(ft + 90 + Math.sin(t * 5 - u * 4) * 8 * u)}`; }
    m += P(fl + ' Z', ol(PUR, 4)) + G(owl(0, 0, 0.36), `translate(${fx + 74} ${f(ft + 46 + Math.sin(t * 5 - 2) * 4)})`);
  }
  // bus loop + bus
  m += P(`M1240 ${EX.base + 40} H3600 V720 H1240 Q1200 680 1240 ${EX.base + 40} Z`, { fill: '#8E95A6' }) + P(`M1240 ${EX.base + 40} H3600 M1240 720 H3600`, ln(5, '#D9DCE4')) + P('M1400 640 H1520 M1640 640 H1760 M1880 640 H2000 M2120 640 H2240 M2360 640 H2480 M2600 640 H2720', ln(6, '#FFE066'));
  // walkway + lawn edges
  m += P(`M${EX.pav[0] + 30} ${EX.base + 40} L${EX.pav[1] - 30} ${EX.base + 40} L1500 1000 L420 1000 Z`, { fill: '#ECE6DA' }) + P(`M${EX.pav[0] + 30} ${EX.base + 40} L420 1000 M${EX.pav[1] - 30} ${EX.base + 40} L1500 1000`, ln(4, LINE, 0.5));
  let wl = '';
  for (const y of [640, 700, 780, 880]) { const u = (y - EX.base - 40) / (1000 - EX.base - 40); wl += `M${f(lerp(EX.pav[0] + 30, 420, u))} ${y} H${f(lerp(EX.pav[1] - 30, 1500, u))} `; }
  m += P(wl, ln(3, '#CFC6B4'));
  // tree shadows (morning: long, to the right)
  m += E(-100, 830, 380, 40, { fill: '#3A6A3A', opacity: 0.25 }) + E(3060, 820, 340, 36, { fill: '#3A6A3A', opacity: 0.25 });
  // sidewalk + street
  m += R(-4000, 900, 9000, 110, 0, { fill: '#E8E4DA' }) + P(Array.from({ length: 45 }, (_, i) => `M${-4000 + i * 200} 900 L${-4040 + i * 200} 1010`).join(' '), ln(3, '#CFC8B8')) + R(-4000, 896, 9000, 8, 0, { fill: '#5FA85A' });
  m += R(-4000, 1010, 9000, 22, 0, { fill: '#C9C4B8', stroke: LINE, 'stroke-width': 3 }) + R(-4000, 1032, 9000, 1200, 0, { fill: '#7D8497' }) + P(Array.from({ length: 40 }, (_, i) => `M${-4000 + i * 240} 1200 H${-3880 + i * 240}`).join(' '), ln(12, '#FFE066'));
  m += marquee(420, 760, 0.62, o.marquee || ['WELCOME BACK OWLS!', 'SCIENCE FAIR FRI']);
  m += tree(-150, 860, 1.05, { sway: Math.sin(t * 1.1) * 1.2 }) + tree(3000, 850, 1.0, { sway: Math.sin(t * 1.2 + 1) * 1.2 });
  m += G(P('M-110 0 V-70 Q-110 -90 -90 -90 H90 Q110 -90 110 -70 V0 M-40 0 V-90 M40 0 V-90', ln(8, '#8A93A6')) + CI(-70, -30, 30, ln(5, '#3E7BD8')) + CI(10, -30, 30, ln(5, '#3E7BD8')) + P('M-70 -30 L-30 -60 L10 -30 M-30 -60 H-14', ln(5, '#E8443C')), tr(1700, 880, 0.75));
  if (o.bus !== false) m += schoolBus(1380 + (o.busX || 0), 700, 0.92, t) + glow(2480 + (o.busX || 0), 660, 40, 20, '#E2E6EE', 0.8 + 0.4 * Math.sin(t * 4));
  m += people(extCrowd(t, o), { t });
  // foreground bushes (k 1.3)
  let fg = '';
  for (const [x, s] of [[-500, 1.3], [-80, 1.05], [2300, 1.2], [2750, 1.4]]) fg += bush(x, 1220, s, '#4CA85A', '#7FD27A');
  let light = '';
  if (!day) light += P('M-400 -400 L700 -400 L2000 1400 L1000 1400 Z', { fill: 'url(#stBeam)', opacity: 0.16 });
  return {
    bg: layer(sky, cam, 0) + layer(sun, cam, 0.04) + layer(clouds, cam, 0.1) + layer(far, cam, 0.3) + layer(back, cam, 0.65),
    mid: layer(m, cam, 1), front: '', fg: layer(fg, cam, 1.3), light: layer(light, cam, 1),
  };
}
const schoolExterior = makeCamSet(exteriorLayers);
schoolExterior.crowdAt = (t, o = {}) => extCrowd(t, o);

// ================================================================= anchors + exports
const FLOOR = { hallway: 960, hallwayDeep: 960, mirror: 1460, classroom: 1082, gym: 960, fair: 1060, cafeteria: 1000, schoolExterior: 960 };
const seatsOf = (row, ri) => row.xs.flatMap((x) => [-1, 1].map((sd) => ({ x: Math.round(x + sd * seatOff * row.s / 0.5), y: seatY(row.top, row.s), s: row.s, row: ri })));
const CLASS_SEATS = CR.rows.map(seatsOf);
const smartSeats = [-170, 0, 170].map((dx) => ({ x: Math.round(CR.smart.x + dx * CR.smart.s / 0.5), y: seatY(CR.smart.top, CR.smart.s), s: CR.smart.s }));
const hallCams = {
  wide: { x: 0, y: 0, zoom: 1 },
  krump: camAt(1190, 560, 1.45),
  krumpClose: camAt(1220, 470, 2.1),
  room10: camAt(-1240, 560, 1.25),
  trophy: camAt(2430, 520, 1.35),
  restroom: camAt(3920, 560, 1.25),
  windows: camAt(-2170, 520, 1),
  long: camAt(1100, 560, 0.62),
  low: camAt(960, 760, 1.25),
  pan: [{ x: -800, y: 0, zoom: 1 }, { x: 2600, y: 0, zoom: 1 }],
  deep: { x: 0, y: 0, zoom: 1 },
  deepPush: camAt(960, 560, 1.4),
  deepKrump: camAt(660, 620, 1.9),
  deepLow: camAt(960, 700, 1.15),
};
const SPOTS = {
  hallway: {
    scaleAt: hallScale,
    lines: { back: { y: 850, s: hallScale(850) }, main: { y: 960, s: 0.5 }, front: { y: 1050, s: hallScale(1050) } },
    walk: { x0: -3100, x1: 5400, y: 960, s: 0.5 },
    walkers: [-600, -200, 300, 700, 1600, 2100, 2500].map((x, i) => ({ x, y: i % 2 ? 960 : 880, s: hallScale(i % 2 ? 960 : 880) })),
    krumpDoor: { x: 1190, y: 812, s: hallScale(812), top: 246 },
    krumpOut: { x: 1250, y: 905, s: hallScale(905) },
    room10Door: { x: -1240, y: 812, s: hallScale(812) },
    restroomDoor: { x: 3920, y: 812, s: hallScale(812) },
    fountain: { x: 1960, y: 840, s: hallScale(840) },
    trophy: { x: 2430, y: 330, x0: 2130, x1: 2730 },
    bench: { x: -2170, y: 800, seats: [-2330, -2170, -2010].map((x) => ({ x, y: 858, s: 0.44 })) },
    clock: { x: 955, y: 205 },
    posters: { scienceFair: { x: 300, y: 290 }, homework: { x: 955, y: 346 }, lostHamster: { x: -790, y: 290 }, beKind: { x: 1650, y: 250 } },
    windows: HALL_WIN.map(([a, b]) => ({ x0: a, x1: b, y0: 210, y1: 760 })),
    deep: {
      scaleAt: deepScale, vp: { x: DV.x, y: DV.y },
      at: deepAt,                                   // at(D, off): floor point at depth D (0.4 near .. 5.9 far), off = sideways (±820 = walls)
      centre: { x: 960, y0: 600, y1: 1060 },        // Tank's walk line (x 960)
      tankStart: deepAt(4.6), tankMid: deepAt(2.0), tankEnd: deepAt(1.25),
      krumpDoor: deepAt(1.87, -700), krumpOut: deepAt(1.8, -520),
      restroomDoor: deepAt(3.7, 700),
      maxRun: [deepAt(4.4, 520), deepAt(1.25, -520)],
      wallL: (D) => deepAt(D, -690), wallR: (D) => deepAt(D, 690),
    },
    cams: hallCams,
  },
  mirror: {
    hero: { x: 560, y: 1460, s: 0.82, view: 'back' },
    reflection: { x: 1030, y: 780, s: 0.52, flip: true },
    qmarks: { x: 1030, y: 215 },
    clip: 'stMirrorClip', glass: { ...MIR },
    sink: { x: 600, y: 650 }, sinkR: { x: 1320, y: 650 },
    face: { hero: { x: 960, y: 1090, s: 0.7 }, qmarks: { x: 960, y: 330 } },
    cams: { over: { x: 0, y: 0, zoom: 1 }, reflection: camAt(1030, 400, 1.7), qmarks: camAt(1030, 300, 2.2), face: { x: 0, y: 0, zoom: 1 }, faceClose: camAt(960, 560, 1.35) },
  },
  classroom: {
    rows: CLASS_SEATS,                                         // [row3, row2, row1] seats (back -> front), 2 per table
    seats: CLASS_SEATS.flat(),
    heroDesk: { ...CLASS_SEATS[2][0] }, benjiDesk: { ...CLASS_SEATS[2][1] },
    dogKid: { ...CLASS_SEATS[1][3] },
    smartTable: { x: CR.smart.x, top: CR.smart.top, seats: smartSeats },
    teacher: { x: 370, y: 930, s: 0.5 },                        // behind her desk (desk top y 768)
    teacherFront: { x: 760, y: 1000, s: 0.52 },                 // in front, by the board (FLOOR line, draw after frontRows)
    teacherDesk: { x0: CR.desk.x0, x1: CR.desk.x1, top: CR.desk.top, homework: { x: 276, y: 690 }, apple: { x: 156, y: 718 }, mug: { x: 592, y: 712 } },
    board: { x: 470, y: 295, x0: 70, x1: 870, y0: 130, y1: 460 }, boardPoint: { x: 820, y: 330 },
    quizPaper: { x: CLASS_SEATS[2][0].x, y: 860 },
    clock: { x: 1020, y: 120 }, hamster: { x: 2460, y: 490 }, window: { x: 1850, y: 340 },
    outside: { x: 1900, y: 560, s: 0.18 },                      // bg space (k .6): the yard bench under the windows
    cams: {
      wide: { x: 0, y: 0, zoom: 1 }, room: camAt(1340, 560, 0.72),
      teacher: camAt(470, 480, 1.3), teacherClose: camAt(380, 600, 1.9), board: camAt(470, 300, 1.75),
      heroDesk: camAt(1100, 760, 1.6), heroClose: camAt(988, 700, 2.3), benji: camAt(1212, 700, 2.3),
      dogKid: camAt(1474, 650, 1.9), quiz: camAt(988, 840, 3), smart: camAt(2780, 740, 1.5), window: camAt(1850, 380, 1.4),
    },
  },
  gym: {
    scaleAt: gymScale,
    teamA: [[200, 1010], [430, 935], [660, 1000], [320, 862]].map(([x, y]) => ({ x, y, s: gymScale(y), flip: true })),
    teamB: [[1720, 1010], [1290, 940], [1520, 1000], [1600, 862]].map(([x, y]) => ({ x, y, s: gymScale(y) })),   // [2] = the hero
    hero: { x: 1520, y: 1000, s: gymScale(1000) },
    lineup: [520, 710, 900, 1090, 1280, 1470].map((x) => ({ x, y: 840, s: gymScale(840) })),
    captain: { x: 1660, y: 1030, s: gymScale(1030) },
    coach: { x: 70, y: 990, s: gymScale(990) },
    bleachers: [0, 1, 2, 3].map((i) => ({ x: [-200, 60, -420, 160][i], y: Math.round(GY.floor + 70 - 30 - i * 64 + 4 + 300 * (0.36 - i * 0.012)), s: Math.round(1000 * (0.36 - i * 0.012)) / 1000 })),
    scoreboard: { x: 960, y: 220 }, centre: { x: 960, y: 905 }, hoop: { x: 2640, y: 342 },
    fair: {
      potato: { x: FAIR.front.potato, top: FAIR.front.top }, bulb: { x: 729, y: 768 },
      heroFair: { x: 400, y: 1060, s: 0.5 }, benjiFair: { x: 850, y: 1060, s: 0.5 },
      smart: { x: FAIR.front.smart, top: FAIR.front.top }, smartKids: [{ x: 1100, y: 1060, s: 0.5 }, { x: 1740, y: 1060, s: 0.5 }, { x: 1880, y: 1075, s: 0.51 }],
      judge: { x: 990, y: 1070, s: 0.53 },
      aisle: { y: FAIR.aisle, s: gymScale(FAIR.aisle) },
      backKids: FAIR.back.xs.map((x) => ({ x: Math.round(x + 150 * FAIR.back.s / 0.5), y: Math.round(FAIR.back.top + 170 * FAIR.back.s / 0.5), s: FAIR.back.s })),
    },
    cams: {
      court: { x: 0, y: 0, zoom: 1 }, wide: { x: 0, y: -60, zoom: 0.8 },
      teamA: camAt(440, 640, 1.5), teamB: camAt(1480, 640, 1.5), lineup: camAt(1000, 580, 1.25), hero: camAt(1520, 620, 1.9),
      scoreboard: camAt(960, 230, 2), bleachers: camAt(-250, 480, 1.3),
      fair: { x: 0, y: 0, zoom: 1 }, potato: camAt(620, 720, 1.7), bulb: camAt(729, 768, 3.2), smart: camAt(1420, 700, 1.6), aisle: camAt(960, 640, 1.25),
    },
  },
  cafeteria: {
    scaleAt: (y) => Math.round(500 * (y - 180) / 820) / 1000,
    lane: { x0: -1200, x1: 3000, y: 1000, s: 0.5 },
    heroSeat: { x: 760, y: seatY(CF.front.top, 0.5), s: 0.5 }, benjiSeat: { x: 540, y: seatY(CF.front.top, 0.5), s: 0.5 },
    seats: {
      front: [-1080, -760, -420, 100, 330, 540, 760].map((x) => ({ x, y: seatY(CF.front.top, 0.5), s: 0.5 })),
      back: [-120, 140, 380, 620, 860].map((x) => ({ x, y: seatY(CF.back.top, CF.back.s), s: CF.back.s })),
    },
    tray: { pizza: { x: 707, y: 846 }, broccoli: { x: 790, y: 852 }, meat: { x: 845, y: 848 }, milk: { x: 895, y: 842 }, sandwich: { x: 640, y: 846 } },
    food: { pizza: { x: 1360, y: 670 }, broccoli: { x: 1580, y: 656 }, meat: { x: 1800, y: 650 }, potato: { x: 2020, y: 664 } },
    lunchLady: { x: 1730, y: 885, s: 0.47 },
    line: [1380, 1600, 1820, 2040].map((x, i) => ({ x, y: 940 + (i % 2) * 10, s: 0.47 })),
    tankPath: [{ x: 2900, y: 1000 }, { x: 1900, y: 1000 }, { x: 1080, y: 1000 }], tankStop: { x: 1080, y: 1000, s: 0.5 },
    doors: { x: 2880, y: 644 },
    cams: {
      wide: { x: 0, y: 0, zoom: 1 }, room: { x: 300, y: -40, zoom: 0.8 },
      table: camAt(700, 780, 1.6), heroClose: camAt(760, 700, 2.3), tray: camAt(780, 850, 3), tank: camAt(980, 560, 1.3), tankLow: camAt(1080, 640, 1.6),
      line: camAt(1700, 580, 1.35), food: camAt(1580, 640, 2.2), meat: camAt(1800, 630, 2.8), lunchLady: camAt(1740, 560, 1.7),
    },
  },
  schoolExterior: {
    scaleAt: extScale,
    sidewalk: { x0: -2400, x1: 4200, y: 960, s: 0.5 },
    walkway: { x: 960, y0: 610, y1: 990 },
    door: { x: 960, y: 600, s: extScale(600) },
    marquee: { x: 420, y: 760, text: { x: 420, y: 650 } },
    bus: { x: 1960, y: 700 }, busDoor: { x: 1580, y: 712, s: extScale(712) },
    flag: { x: 300, y: 20 },
    cams: { front: { x: 0, y: 0, zoom: 1 }, establish: { x: 0, y: -140, zoom: 0.75 }, sky: camAt(960, 60, 1), door: camAt(960, 470, 1.8), marquee: camAt(420, 620, 1.9), bus: camAt(1900, 560, 1.35), sidewalk: camAt(960, 800, 1.3), cupola: camAt(960, 0, 2) },
  },
};
const DEFS = `<defs>${DEF.join('')}</defs>`;

module.exports = {
  hallway, mirror, classroom, gym, cafeteria, schoolExterior,
  FLOOR, SPOTS, DEFS,
  camTf, layer, toScreen, camAt, viewRect, makeSet, makeCamSet, mix, glow,
  people, crowdRow, owl, icon, poster, wallClock, lockerBank, hallDoor, trophy, trophyCase, chalkboard, studentTable, teacherDesk,
  triFold, potatoBattery, fairTable, foamBall, scoreboard, lunchTable, tray, schoolBus, marquee, tree, cloud, bush, bird, sunDisc,
};
