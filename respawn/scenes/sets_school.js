// Shared SCHOOL background sets for "What If You Could RESPAWN in Real Life?" — WILLOWBROOK MIDDLE SCHOOL (the Comets).
//
// Look: a long single-storey cream school with a teal fascia, lime colour-block panels and white-framed windows, a teal
// entrance block with a round clock, a sky-blue barrel-roofed gym annex, a skate area behind a chain-link fence.
// Inside: sky-blue / lime / mint walls, lime + teal school colours, the yellow comet star as the school logo.
//
// Every set is drawn in WORLD SPACE for the full 1920x1080 frame (camera at rest = the frame) and is padded far past
// the frame edges, so camera moves / zoom-outs never show a gap. `t` (absolute seconds) is only used for small idle
// motion (flag, clouds, rope sway, steam): pass a constant t to freeze it. Room sets expose
// `set.layers(t, opts)` -> { bg, mid, front, fg, light }:
//   bg    — what is seen through windows (sky, trees)                     draw with view(cam, bg, 0.5..0.8)
//   mid   — the room itself: walls, floor, furniture backs, chairs         draw with view(cam, mid, 1)
//   front — furniture FRONTS (desk tops, lunch tables, the lounge table, seat backs of the row in front...). Draw it
//           AFTER the characters who sit behind it and BEFORE the characters standing on the FLOOR line.
//   fg    — occluders close to the camera (may be '')                     draw with view(cam, fg, 1.15..1.3)
//   light — light beams / glows / tints in WORLD space (may be '')        draw with view(cam, light, 1) after fg
//   screen — (some sets) screen-space overlay: slow-mo grade, vignette bars (may be '') — draw LAST, without a camera
// Calling the set directly, e.g. gym(t, opts), returns all layers composited at k = 1.
// schoolyard(t, cam, opts) takes the camera itself (parallax): schoolyard.layers(t, cam, opts) ->
//   { bg, mid, pole, front, fg, light } already transformed (draw world-space characters with K.view(cam, svg, 1)).
// FLOOR[set] = feet y of the main stand line in the default framing; SPOTS[set] = anchors (WORLD coordinates of the
// k = 1 layer) with recommended scales `s`; SPOTS[set].cams = ready-made camera framings for K.camKeys / K.view.
// Static gradients/patterns live in DEFS (ids prefixed `ss`); main.js adds DEFS to every frame.
// Contact sheet: `node tools/sheet_school.js` -> concept/sets_school.png (hero s .5 on each FLOOR line; --only, --full).
// Reference for scene writers: docs/SETS_SCHOOL.md.
//
// Index:
//   schoolyard(t, cam, o)   the school front + entrance doors/steps, the VERY tall flagpole, skate area (quarter-pipe,
//                           rail, dented trash can, crowd line, benches), basketball hoop, trees.
//                           o: time 'morning'|'day'|'sunset', red 0..1, frozen 0..1, lowGfx 0..1, colorBack 0..1,
//                           colorFrom [x,y] (screen), flag (default true), pole (default true), crowdBench (true)
//   classroom(t, o)         Mr. Fig's maths class. o: view 'class' (default: kids facing camera) | 'board' (whiteboard +
//                           teacher, backs of the kids), board ['7 × 8 = ?'], clock '8:00', quiz, time, fill.
//                           layers.frontRows = desk fronts per row (back -> front) for exact depth; or use compose()
//   gym(t, o)               o: scoreboard (['HOME','03','GUEST','05'] | 'TEXT'), slowmo 0..1, rope, balls (floor balls)
//   cafeteria(t, o)         o: menu [lines], puddle 0..1 (spaghetti/milk puddle at the wet-floor sign), sign, trays, steam
//                           layers.frontRows = [counter, back table, front table]
//   lounge(t, o)            teachers' lounge, birthday. o: banner (text), balloons, steam, frozen 0..1
//   auditorium(t, o)        TALENT SHOW. o: view 'stage'|'house'|'wings', lights 0..1 (house lights), spots [{x,y,w}],
//                           confetti 0..1, curtain 0..1 (stage: 1 = open), cheer 0..1, gasp 0..1, phones, wave, mic,
//                           banner, family (gap), cam (house: cull the crowd to the view)
//   hallway(t, o)           bonus: a locker corridor (Room 104, TALENT SHOW poster). o: doorOpen, poster
//   set.compose(t, o, between, after, cam)  every room set: the whole set with characters slotted in at the right depth
//   props: locker, lockerRow, schoolPoster, trophyCase, wetFloorSign, trashCan, bench, wallClock, comet, pennant, bunting,
//          schoolTree, skateRamp, grindRail, basketHoop, floorBall, balloon, spotlight, confettiFall, marqueeBanner,
//          sconce, stageMic, cloud, bush, crowd (cheap audience fill). Hero-held props (skateboard, dodgeball, tray,
//          spaghetti, ballBin, birthdayCake, micStand) live in rig/extras.js.
//   helpers: camTf, toScreen(cam, x, y, k), camAt(x, y, zoom, sx, sy), makeSet, mix, softGlow
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
const G = (inner, tf, extra) => (inner ? S.g(inner, tf, extra) : '');
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const T = (s, x, y, size, fill, extra = {}) => S.el('text', { x, y, 'font-family': 'Lilita One, sans-serif', 'font-size': size, fill, 'text-anchor': 'middle', ...extra }, esc(s));
const TF = (s, x, y, size, fill, extra = {}) => S.el('text', { x, y, 'font-family': 'Fredoka, sans-serif', 'font-weight': 700, 'font-size': size, fill, 'text-anchor': 'middle', ...extra }, esc(s));
const OUTX = (w = 8, c = LINE) => ({ stroke: c, 'stroke-width': w, 'paint-order': 'stroke', 'stroke-linejoin': 'round' });
const hash = (n) => { const v = Math.sin(n * 127.1 + 311.7) * 43758.5453; return v - Math.floor(v); };
const tr = (x, y, s = 1, r = 0) => `translate(${f(x)} ${f(y)})${r ? ` rotate(${f(r)})` : ''}${s !== 1 ? ` scale(${f(s)})` : ''}`;
const pts = (a) => a.map(([x, y]) => `${f(x)} ${f(y)}`).join(' L');
const poly = (a, at = {}) => P('M' + pts(a) + ' Z', at);
const circD = (cx, cy, r) => `M${f(cx - r)} ${f(cy)} a${f(r)} ${f(r)} 0 1 0 ${f(2 * r)} 0 a${f(r)} ${f(r)} 0 1 0 ${f(-2 * r)} 0 Z`;
const ellD = (cx, cy, rx, ry) => `M${f(cx - rx)} ${f(cy)} a${f(rx)} ${f(ry)} 0 1 0 ${f(2 * rx)} 0 a${f(rx)} ${f(ry)} 0 1 0 ${f(-2 * rx)} 0 Z`;
const rrD = (x, y, w, h, r) => { r = Math.min(r, w / 2, h / 2); return `M${f(x + r)} ${f(y)} H${f(x + w - r)} Q${f(x + w)} ${f(y)} ${f(x + w)} ${f(y + r)} V${f(y + h - r)} Q${f(x + w)} ${f(y + h)} ${f(x + w - r)} ${f(y + h)} H${f(x + r)} Q${f(x)} ${f(y + h)} ${f(x)} ${f(y + h - r)} V${f(y + r)} Q${f(x)} ${f(y)} ${f(x + r)} ${f(y)} Z`; };
const md = (a, n) => ((a % n) + n) % n;
// compact path builders for big crowds (1-decimal coordinates; string size is most of a full house's cost)
const g1 = (n) => Math.round(n * 10) / 10;
const rrQ = (x, y, w, h, r) => { r = Math.min(r, w / 2, h / 2); const a = g1(x), b = g1(y), c = g1(x + w), d = g1(y + h), R_ = g1(r); return `M${g1(a + R_)} ${b}H${g1(c - R_)}Q${c} ${b} ${c} ${g1(b + R_)}V${g1(d - R_)}Q${c} ${d} ${g1(c - R_)} ${d}H${g1(a + R_)}Q${a} ${d} ${a} ${g1(d - R_)}V${g1(b + R_)}Q${a} ${b} ${g1(a + R_)} ${b}Z`; };
const elQ = (cx, cy, rx, ry) => `M${g1(cx - rx)} ${g1(cy)}a${g1(rx)} ${g1(ry)} 0 1 0 ${g1(2 * rx)} 0a${g1(rx)} ${g1(ry)} 0 1 0 ${g1(-2 * rx)} 0Z`;
const bool01 = (v, d = 0) => (v === true ? 1 : v === false || v === undefined || v === null ? d : clamp(+v, 0, 1));
const smooth = (a, b, v) => { const u = clamp((v - a) / (b - a), 0, 1); return u * u * (3 - 2 * u); };

// padded full-cover bounds for ROOM sets (zoom .5 and pans of ±600 px never show the edge)
const XL = -1100, XR = 3020, YT = -900, YB = 2000;
const cover = (fill, extra = {}) => R(XL, YT, XR - XL, YB - YT, 0, { fill, ...extra });
const band = (y0, y1, fill, extra = {}) => R(XL, y0, XR - XL, y1 - y0, 0, { fill, ...extra });
const SCREEN = (fill, op = 1) => R(-60, -60, 2040, 1200, 0, { fill, opacity: f(op) });
const TINT = (fill, op = 1) => cover(fill, { opacity: f(op) });

// ---------------------------------------------------------------- colour helpers
const hx = (c) => [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)];
const toHex = (a) => '#' + a.map((v) => Math.round(clamp(v, 0, 255)).toString(16).padStart(2, '0')).join('').toUpperCase();
function mix(a, b, k) {
  if (k <= 0) return a;
  if (k >= 1) return b;
  const A = hx(a), B = hx(b);
  return toHex(A.map((v, i) => lerp(v, B[i], k)));
}
const grey = (c, k = 1) => { const [r, g, b] = hx(c); const l = 0.3 * r + 0.59 * g + 0.11 * b; return mix(c, toHex([l, l, l]), k); };

// ---------------------------------------------------------------- static defs
const DEF = [];
const def = (s) => { DEF.push(s); };
const lg = (id, stops, x2 = 0, y2 = 1, extra = '') => `<linearGradient id="${id}" x1="0" y1="0" x2="${x2}" y2="${y2}"${extra}>${stops.map(([o, c, a]) => `<stop offset="${o}" stop-color="${c}"${a !== undefined ? ` stop-opacity="${a}"` : ''}/>`).join('')}</linearGradient>`;
const lgU = (id, y1, y2, stops) => `<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="0" y1="${y1}" x2="0" y2="${y2}">${stops.map(([o, c, a]) => `<stop offset="${o}" stop-color="${c}"${a !== undefined ? ` stop-opacity="${a}"` : ''}/>`).join('')}</linearGradient>`;

// skies in user space (the colours run from y -700 (top) to y 760 (horizon) and pad beyond) — used by the yard + windows
def(lgU('ssSkyDay', -700, 760, [[0, '#2A7FF0'], [0.45, '#55B3FF'], [0.8, '#A6DFFF'], [1, '#DDF4FF']]));
def(lgU('ssSkyMorning', -700, 760, [[0, '#4C8FF0'], [0.45, '#8EC6FF'], [0.78, '#FFD8C4'], [1, '#FFE8B0']]));
def(lgU('ssSkySunset', -700, 760, [[0, '#2E2A86'], [0.38, '#8C47A8'], [0.68, '#F07C6A'], [0.9, '#FFB866'], [1, '#FFE08A']]));
def(lgU('ssSkyRed', -700, 760, [[0, '#2A030B'], [0.35, '#6E0A18'], [0.72, '#D41E2A'], [1, '#FF6A3D']]));
def(lgU('ssSkyLow', -700, 760, [[0, '#A9B6C4'], [1, '#D3D9DF']]));
// small sky for windows (object bbox)
def(lg('ssWinSky', [[0, '#5BB8FF'], [0.7, '#A8DEFF'], [1, '#D8F2FF']]));
def(lg('ssWinSkyEve', [[0, '#7A5AC8'], [0.6, '#F08A7A'], [1, '#FFD08A']]));
def(lg('ssShine', [[0, '#FFFFFF', 0.35], [0.5, '#FFFFFF', 0]], 1, 1));
def(lg('ssBeam', [[0, '#FFF6D0', 0.5], [1, '#FFF6D0', 0]]));
def(lg('ssBeamCool', [[0, '#DFF4FF', 0.38], [1, '#DFF4FF', 0]]));
def('<pattern id="ssScan" width="12" height="8" patternUnits="userSpaceOnUse"><rect width="12" height="3" fill="#000" opacity="0.32"/></pattern>');
def('<pattern id="ssScanLt" width="12" height="6" patternUnits="userSpaceOnUse"><rect width="12" height="2" fill="#FFF" opacity="0.10"/></pattern>');
// red "pixel" texture: scattered square blocks
{
  let p = '';
  for (let i = 0; i < 26; i++) {
    const x = Math.floor(hash(i * 3.1 + 7) * 12) * 24, y = Math.floor(hash(i * 5.7 + 1) * 12) * 24;
    p += `<rect x="${x}" y="${y}" width="${hash(i) > 0.6 ? 48 : 24}" height="24" fill="${hash(i * 2.3) > 0.5 ? '#FF6A5A' : '#3A0008'}" opacity="${f(0.16 + 0.22 * hash(i * 9.1))}"/>`;
  }
  def(`<pattern id="ssPix" width="288" height="288" patternUnits="userSpaceOnUse">${p}</pattern>`);
}

// ---------------------------------------------------------------- small shared pieces
function makeSet(layersFn) {
  const fn = (t = 0, opts = {}) => { const L = layersFn(t, opts); return (L.bg || '') + (L.mid || '') + (L.front || '') + (L.fg || '') + (L.light || '') + (L.screen || ''); };
  fn.layers = layersFn;
  // compose(t, opts, between, after, cam): the whole set with characters slotted in at the right depth, in WORLD space.
  //   between: svg | [svg per front row, back -> front] — drawn just before that row's furniture front (sets with
  //   layers.frontRows: classroom 'class', cafeteria); after: svg drawn after the front layer (the FLOOR line).
  //   cam: optional camera — bg is drawn with parallax .6, the rest with k 1, screen overlays without a camera.
  fn.compose = (t = 0, opts = {}, between = '', after = '', cam = null) => {
    const L = layersFn(t, cam && opts.cam === undefined ? { ...opts, cam } : opts);
    const rows = L.frontRows || [L.front || ''];
    const B = Array.isArray(between) ? between : [between];
    let w = (L.mid || '') + rows.map((r, i) => (B[i] || '') + r).join('') + B.slice(rows.length).join('') + (after || '') + (L.fg || '') + (L.light || '');
    return cam ? layer(L.bg || '', cam, 0.6) + layer(w, cam, 1) + (L.screen || '') : (L.bg || '') + w + (L.screen || '');
  };
  return fn;
}
// camera transform (same as env.camTf): parallax factor k
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

// cheap soft glow: 3 stacked translucent ellipses (no radial gradients)
function softGlow(x, y, rx, ry, col, op = 1) {
  if (op <= 0.003) return '';
  return E(x, y, rx, ry, { fill: col, opacity: f(0.12 * op) }) + E(x, y, rx * 0.68, ry * 0.68, { fill: col, opacity: f(0.14 * op) }) + E(x, y, rx * 0.38, ry * 0.38, { fill: col, opacity: f(0.18 * op) });
}
function starD(cx, cy, Ro, ri = Ro * 0.48, n = 5, rot = -90) {
  const p = [];
  for (let i = 0; i < n * 2; i++) {
    const a = ((rot + (i * 180) / n) * Math.PI) / 180, rr = i % 2 ? ri : Ro;
    p.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]);
  }
  return S.roundedPath(p, Ro * 0.12);
}
// the school logo: the Willowbrook comet (yellow star + lime/teal tail); origin = star centre, s 1 ~ 120 px wide
function comet(x, y, s = 1, rot = 0, opts = {}) {
  const tail = opts.tail || '#8EDB4F', tail2 = opts.tail2 || '#2FB3B8', star = opts.star || '#FFD23F';
  let o = P('M-6 -30 Q-60 -40 -118 -6 Q-70 -14 -30 6 Q-74 6 -112 30 Q-56 30 -6 26 Z', ol(tail2, 5));
  o += P('M-8 -22 Q-56 -28 -96 -6 Q-60 -8 -26 6 Q-60 10 -88 22 Q-46 20 -8 20 Z', { fill: tail });
  o += P(starD(10, 0, 40, 19), ol(star, 5)) + P(starD(10, 0, 40, 19), { fill: 'url(#ssShine)' });
  return G(o, tr(x, y, s, rot));
}
// wall clock: time '8:00' | hours (number) | null -> uses t as a slow running clock
function wallClock(x, y, r, time = '8:00', opts = {}) {
  let h = 8, m = 0;
  if (typeof time === 'string') { const [a, b] = time.split(':'); h = +a; m = +(b || 0); } else if (typeof time === 'number') { h = Math.floor(time); m = (time - h) * 60; }
  const ha = ((h % 12) + m / 60) * 30, ma = m * 6;
  const rim = opts.rim || '#2FA7B0';
  let o = CI(0, 0, r, ol(rim, Math.max(4, r * 0.09))) + CI(0, 0, r * 0.84, { fill: opts.face || '#FFFFFF' });
  let d = '';
  for (let i = 0; i < 12; i++) { const a = (i * 30 * Math.PI) / 180, r0 = i % 3 ? r * 0.7 : r * 0.62; d += `M${f(Math.sin(a) * r0)} ${f(-Math.cos(a) * r0)} L${f(Math.sin(a) * r * 0.78)} ${f(-Math.cos(a) * r * 0.78)} `; }
  o += P(d, ln(Math.max(2, r * 0.05), '#3A4A5A'));
  const hand = (deg, len, w, c) => P(`M0 0 L${f(Math.sin((deg * Math.PI) / 180) * len)} ${f(-Math.cos((deg * Math.PI) / 180) * len)}`, ln(w, c));
  o += hand(ha, r * 0.42, Math.max(3, r * 0.1), LINE) + hand(ma, r * 0.66, Math.max(2.5, r * 0.07), LINE);
  if (opts.second !== false && opts.t !== undefined) o += hand((opts.t * 6) % 360, r * 0.7, Math.max(1.5, r * 0.03), '#E8243C');
  o += CI(0, 0, Math.max(3, r * 0.08), { fill: '#E8243C' }) + P(`M${f(-r * 0.55)} ${f(-r * 0.35)} Q${f(-r * 0.2)} ${f(-r * 0.72)} ${f(r * 0.3)} ${f(-r * 0.7)}`, ln(Math.max(2, r * 0.06), '#FFFFFF', 0.6));
  return G(o, tr(x, y, 1, opts.rot || 0));
}
// triangular pennant flag on a string point (x, y); s 1 ~ 70 wide
function pennant(x, y, s, col, rot = 0) { return G(P('M-35 0 L35 0 L0 70 Z', ol(col, 4)) + P('M-26 6 L26 6', ln(5, '#FFFFFF', 0.45)), tr(x, y, s, rot)); }
// bunting line between x0..x1, sagging, n flags
function bunting(x0, x1, y, sag, n, cols, s = 1) {
  let o = P(`M${x0} ${y} Q${(x0 + x1) / 2} ${y + sag * 2} ${x1} ${y}`, ln(3, '#5A5048'));
  for (let i = 0; i < n; i++) {
    const u = (i + 0.5) / n, xx = lerp(x0, x1, u), yy = y + 4 * sag * u * (1 - u);
    o += pennant(xx, yy, s, cols[i % cols.length], (u - 0.5) * -20 * (sag / 60));
  }
  return o;
}
// cartoon school tree. kind 'round' | 'pine' | 'willow'; low: 'cone' | 'cube' (2006 graphics)
function schoolTree(x, y, s = 1, opts = {}) {
  const kind = opts.kind || 'round', c = opts.col || '#4FBF5E', hi = opts.hi || '#86E07A', dk = opts.dk || mix(c, '#0A3A2A', 0.3), trunk = opts.trunk || '#8A5A36';
  const sw = opts.sway || 0;
  let o = '';
  if (opts.low) {
    const lc = opts.lowCol || '#5E8A52';
    if (opts.low === 'cube') o = R(-14, -150, 28, 150, 0, { fill: '#7A6450', stroke: '#3A3A3A', 'stroke-width': 2 }) + R(-110, -380, 220, 230, 0, { fill: lc, stroke: '#3A3A3A', 'stroke-width': 2 }) + R(-110, -380, 220, 40, 0, { fill: '#FFFFFF', opacity: 0.12 });
    else o = R(-14, -110, 28, 110, 0, { fill: '#7A6450', stroke: '#3A3A3A', 'stroke-width': 2 }) + P('M-120 -100 L0 -470 L120 -100 Z', { fill: lc, stroke: '#3A3A3A', 'stroke-width': 2 }) + P('M0 -470 L120 -100 L40 -100 Z', { fill: '#000', opacity: 0.12 });
    return G(o, tr(x, y, s));
  }
  if (kind === 'pine') {
    o += R(-16, -90, 32, 92, 4, ol(trunk, 5));
    const tiers = [[-90, 150, 120], [-190, 120, 110], [-280, 90, 100]];
    for (const [ty, w, h] of tiers) o += P(`M${-w} ${ty + 10} Q0 ${ty + 30} ${w} ${ty + 10} L12 ${ty - h} Q0 ${ty - h - 10} -12 ${ty - h} Z`, ol(c, 6)) + P(`M${-w * 0.6} ${ty} Q0 ${ty + 14} ${w * 0.6} ${ty}`, ln(8, dk, 0.5)) + P(`M-10 ${ty - h + 16} L${-w * 0.45} ${ty - 6}`, ln(8, hi, 0.75));
    return G(o, tr(x, y, s));
  }
  o += P('M-24 0 L-15 -190 Q0 -204 15 -190 L24 0 Z', ol(trunk, 6)) + P('M-6 -20 L-4 -170', ln(6, '#A8743F', 0.7));
  if (kind === 'willow') {
    // drooping canopy + hanging fronds
    let cn = P(`M-220 -150 Q-250 -330 -120 -400 Q0 -460 120 -400 Q250 -330 220 -150 Q200 -90 170 -110 Q140 -60 100 -100 Q60 -50 20 -96 Q-20 -50 -60 -100 Q-100 -56 -140 -104 Q-180 -70 -220 -150 Z`, ol(c, 6));
    cn += P('M-150 -320 Q-170 -200 -160 -120 M-80 -380 Q-100 -240 -90 -110 M0 -410 Q-10 -260 -4 -110 M80 -380 Q96 -240 90 -110 M150 -320 Q170 -200 164 -126', ln(7, dk, 0.55));
    cn += P('M-120 -360 Q-60 -420 20 -420', ln(14, hi, 0.8)) + P('M-170 -300 Q-160 -340 -130 -360', ln(10, hi, 0.6));
    o += G(cn, `rotate(${f(sw)} 0 -190)`);
    return G(o, tr(x, y, s));
  }
  // round: two-tone egg canopy
  let cn = P(`${circD(0, -330, 150)} ${circD(-110, -250, 100)} ${circD(110, -250, 104)}`, { fill: LINE, stroke: LINE, 'stroke-width': 12, 'stroke-linejoin': 'round' });
  cn += P(`${circD(0, -330, 150)} ${circD(-110, -250, 100)} ${circD(110, -250, 104)}`, { fill: c });
  cn += P(`M-190 -240 Q-150 -160 -60 -158 Q60 -150 150 -170 Q200 -190 206 -240 Q190 -180 120 -168 Q20 -156 -60 -170 Q-150 -180 -190 -240 Z`, { fill: dk, opacity: 0.45 });
  cn += P(`${circD(-60, -390, 40)} ${circD(-150, -280, 22)} ${circD(20, -430, 18)}`, { fill: hi, opacity: 0.9 });
  o += G(cn, `rotate(${f(sw)} 0 -190)`);
  return G(o, tr(x, y, s));
}
function bush(x, y, s = 1, c = '#4CB65A', hi = '#86E07A') {
  const d = `${circD(-60, -40, 50)} ${circD(10, -62, 62)} ${circD(78, -36, 46)} M-110 -30 H124 V12 H-110 Z`;
  return G(P(d, { fill: LINE, stroke: LINE, 'stroke-width': 11, 'stroke-linejoin': 'round' }) + P(d, { fill: c }) + P(`${circD(-10, -88, 16)} ${circD(-74, -62, 10)}`, { fill: hi, opacity: 0.85 }), tr(x, y, s));
}
const CLOUD_D = 'M-150 30 Q-176 30 -170 6 Q-166 -16 -134 -14 Q-128 -60 -76 -58 Q-56 -104 0 -100 Q58 -98 70 -50 Q112 -64 134 -30 Q176 -30 172 4 Q170 30 140 30 Z';
function cloud(x, y, s = 1, col = '#FFFFFF', shade = '#D6EDFF', op = 1) {
  return G(P(CLOUD_D, { fill: col }) + P('M-166 14 Q0 34 170 12 Q168 30 140 30 L-150 30 Q-170 28 -166 14 Z', { fill: shade }), tr(x, y, s), op < 1 ? { opacity: f(op) } : undefined);
}
function bird(x, y, s, t, ph = 0, col = '#2A2E44', flap = true) {
  const fl = flap ? Math.sin(t * 9 + ph) : 0.4;
  return P(`M${f(x - 26 * s)} ${f(y - (8 + 12 * fl) * s)} Q${f(x - 12 * s)} ${f(y - 8 * s)} ${f(x)} ${f(y)} Q${f(x + 12 * s)} ${f(y - 8 * s)} ${f(x + 26 * s)} ${f(y - (8 + 12 * fl) * s)}`, ln(5 * s, col));
}

// ---------------------------------------------------------------- generic school props
// locker: one tall locker, origin = bottom-left at floor; w x h (default 110 x 420). opts: col, open 0..1, num, dent
function locker(x, y, opts = {}) {
  const w = opts.w || 110, h = opts.h || 420, col = opts.col || '#3FA9E0', dk = mix(col, '#0A2A50', 0.35), lt = mix(col, '#FFFFFF', 0.35);
  let o = R(0, -h, w, h, 4, ol(col, 5));
  o += R(4, -h + 4, 10, h - 8, 3, { fill: lt, opacity: 0.6 });
  let v = '';
  for (let i = 0; i < 4; i++) v += `M${w * 0.22} ${-h + 28 + i * 13} H${w * 0.78} `;
  for (let i = 0; i < 3; i++) v += `M${w * 0.22} ${-50 + i * 13} H${w * 0.78} `;
  o += P(v, ln(6, dk));
  o += R(w * 0.32, -h + 96, w * 0.36, 26, 4, ol('#F4F7FB', 3)) + TF(opts.num || '', w * 0.5, -h + 116, 18, '#2A3A55');
  o += R(w * 0.72, -h * 0.5 - 22, 12, 44, 5, ol('#D9E0EA', 3));
  const op = bool01(opts.open);
  if (op > 0) {
    o += R(2, -h + 2, w - 4, h - 4, 3, { fill: '#1E2A3C' }) + R(10, -h * 0.62, w - 20, 8, 2, { fill: '#5A6478' });
    o += poly([[w, -h], [w + w * 0.7 * op, -h - 18 * op], [w + w * 0.7 * op, 18 * op], [w, 0]], ol(dk, 5));
  }
  return G(o, tr(x, y, opts.s || 1));
}
// row of lockers from x0 to x1 standing on floor y (pattern-filled: cheap). opts: col 'blue'|'lime'|'teal', s (1 = 420 tall)
function lockerRow(x0, x1, y, opts = {}) {
  const sc = opts.s || 1, id = { lime: 'ssLockLime', teal: 'ssLockTeal' }[opts.col] || 'ssLockBlue', w = (x1 - x0) / sc;
  return G(R(0, -420, w, 420, 0, { fill: `url(#${id})`, stroke: LINE, 'stroke-width': 5 }) + R(-4, -434, w + 8, 16, 3, ol('#24507E', 3)) + R(0, -8, w, 8, 0, { fill: '#1B2A44' }), `translate(${f(x0)} ${f(y)}) scale(${f(sc)})`);
}
for (const [id, c, dk, lt] of [['ssLockBlue', '#3FA9E0', '#23679A', '#8FD0F4'], ['ssLockLime', '#8ED24E', '#4F8E28', '#C4EE94'], ['ssLockTeal', '#2FB3B8', '#1C7880', '#86DDE0']]) {
  def(`<pattern id="${id}" x="0" y="-420" width="110" height="420" patternUnits="userSpaceOnUse"><rect width="110" height="420" fill="${dk}"/><rect x="3" y="0" width="104" height="416" rx="4" fill="${c}"/><rect x="7" y="4" width="9" height="406" fill="${lt}" opacity="0.6"/>` +
    `<path d="M24 28 H86 M24 41 H86 M24 54 H86 M24 67 H86 M24 370 H86 M24 383 H86 M24 396 H86" stroke="${dk}" stroke-width="6" stroke-linecap="round"/><rect x="35" y="96" width="40" height="24" rx="4" fill="#F4F7FB" stroke="#151515" stroke-width="2.5"/>` +
    `<rect x="79" y="188" width="12" height="44" rx="5" fill="#D9E0EA" stroke="#151515" stroke-width="2.5"/><rect x="107" y="0" width="3" height="420" fill="#151515" opacity="0.55"/></pattern>`);
}
// school poster: text (string or ['LINE1','LINE2']), centred at (x, y). opts: w, h, col, ink, rot, s, icon 'star'|'pi'|'book'|'heart'|'brain'|'none', tape
function schoolPoster(text, x, y, opts = {}) {
  const w = opts.w || 200, h = opts.h || 150, col = opts.col || '#FFE45C', ink = opts.ink || '#2A2246';
  const L = Array.isArray(text) ? text : String(text).split('\n');
  let o = R(-w / 2, -h / 2, w, h, 8, ol(col, 5)) + R(-w / 2 + 8, -h / 2 + 8, w - 16, h - 16, 5, { fill: 'none', stroke: '#FFFFFF', 'stroke-width': 3, opacity: 0.55 });
  const icon = opts.icon || 'none', hasIcon = icon !== 'none';
  const size = opts.size || Math.min(44, (w * 0.9) / Math.max(...L.map((s) => s.length * 0.55 + 0.5)));
  const ty0 = hasIcon ? -h / 2 + size * 1.05 + 4 : -((L.length - 1) * size * 1.08) / 2 + size * 0.36;
  L.forEach((s, i) => { o += T(s, 0, ty0 + i * size * 1.08, size, ink, i === 0 && opts.shout ? OUTX(5, '#FFFFFF') : {}); });
  const iy = h / 2 - 34;
  if (icon === 'star') o += P(starD(0, iy, 24, 11), ol('#FFD23F', 3.5));
  else if (icon === 'pi') o += T('π', 0, iy + 16, 48, '#E8243C');
  else if (icon === 'heart') o += P('M0 ' + (iy + 18) + ' C-30 ' + (iy - 4) + ' -24 ' + (iy - 24) + ' 0 ' + (iy - 10) + ' C24 ' + (iy - 24) + ' 30 ' + (iy - 4) + ' 0 ' + (iy + 18) + ' Z', ol('#FF6F91', 3.5));
  else if (icon === 'book') o += R(-30, iy - 16, 60, 34, 4, ol('#3FA9E0', 3.5)) + P(`M0 ${iy - 16} V${iy + 18}`, ln(3));
  else if (icon === 'brain') o += P(`${circD(-12, iy, 16)} ${circD(12, iy, 16)} ${circD(0, iy - 10, 14)}`, ol('#FF9EC4', 3.5));
  if (opts.tape !== false) o += R(-26, -h / 2 - 10, 52, 20, 3, { fill: '#FFF6C0', opacity: 0.85, transform: 'rotate(-4)' });
  return G(o, tr(x, y, opts.s || 1, opts.rot || 0));
}
// trophy case on legs, origin bottom-centre at the floor; ~360 x 330
function trophyCase(x, y, s = 1) {
  let o = R(-180, -330, 360, 300, 10, ol('#9A6238', 6)) + R(-164, -314, 328, 268, 4, { fill: '#DDF2FF' }) + R(-164, -314, 328, 268, 4, { fill: 'url(#ssShine)' });
  o += P('M-164 -224 H164 M-164 -136 H164', ln(6, '#9A6238'));
  const cup = (cx, cy, c, sc = 1) => G(P('M-20 -46 Q-22 -14 0 -10 Q22 -14 20 -46 Z', ol(c, 3.5)) + P('M-20 -40 Q-34 -36 -24 -24 M20 -40 Q34 -36 24 -24', ln(3.5)) + R(-5, -10, 10, 8, 1, ol(c, 3)) + R(-14, -2, 28, 8, 2, ol('#5A3A20', 3)), tr(cx, cy, sc));
  o += cup(-110, -226, '#FFD23F') + cup(-30, -226, '#D9E0EA', 0.8) + cup(70, -226, '#FFD23F', 1.2) + cup(-80, -138, '#E8A24A', 0.9) + R(10, -186, 90, 50, 4, ol('#2FB3B8', 3)) + TF('2019', 55, -154, 18, '#FFFFFF');
  o += P('M-150 -30 L-150 0 M150 -30 L150 0', ln(10, '#6A4428'));
  return G(o, tr(x, y, s));
}
// yellow "CAUTION WET FLOOR" A-frame sign; origin = floor centre, ~110 x 190
function wetFloorSign(x, y, s = 1, opts = {}) {
  let o = P('M-56 0 L-30 -190 L30 -190 L56 0 Z', ol('#FFD23F', 5)) + P('M-30 -190 L30 -190 L26 -176 L-26 -176 Z', { fill: '#E8B400' });
  o += TF('CAUTION', 0, -146, 17, LINE) + P('M0 -132 L-26 -86 L26 -86 Z', ol('#FFD23F', 3.5)) + T('!', 0, -92, 30, LINE);
  o += G(CI(-4, -66, 7, { fill: LINE }) + P('M-4 -58 L2 -38 L14 -30 M2 -38 L-14 -28 M-2 -52 L14 -60 M-2 -52 L-20 -46', ln(5)), '') + P('M-30 -22 Q0 -12 30 -22', ln(4, '#3FA9E0'));
  o += TF('WET FLOOR', 0, -4, 15, LINE);
  return G(o, tr(x, y, s, opts.rot || 0));
}
// galvanised trash can, origin = floor centre (~130 x 190). opts: dent 0..1, lid 'on'|'tilt'|'off', col
function trashCan(x, y, s = 1, opts = {}) {
  const dent = opts.dent ?? 0, col = opts.col || '#B9C6D3', dk = mix(col, '#2A3A4A', 0.3);
  const dx = 26 * dent;
  let body = `M-62 -168 L62 -168 L52 0 L-52 0 L-56 -60 Q${f(-56 + dx * 1.6)} -90 ${f(-58 + dx * 0.3)} -122 Z`;
  let o = P(body, ol(col, 6));
  o += P(`M-58 -126 H58 M-55 -86 H56 M-54 -40 H54`, ln(5, dk, 0.8));
  if (dent > 0) o += P(`M${f(-54 + dx * 0.4)} -120 Q${f(-50 + dx * 1.7)} -92 ${f(-54 + dx * 0.2)} -62`, ln(5, LINE)) + P(`M${f(-40 + dx)} -112 Q${f(-36 + dx * 1.3)} -92 ${f(-40 + dx)} -72`, ln(5, '#FFFFFF', 0.6));
  o += P('M28 -160 L34 -10', ln(8, '#FFFFFF', 0.35));
  const lid = opts.lid || 'tilt';
  if (lid !== 'off') {
    const lr = lid === 'tilt' ? -9 : 0, ly = lid === 'tilt' ? -6 : 0;
    o += G(E(0, -172, 72, 16, ol(col, 6)) + R(-14, -196, 28, 14, 6, ol(dk, 4)) + P('M-60 -176 Q0 -164 60 -176', ln(4, '#FFFFFF', 0.4)), `translate(0 ${ly}) rotate(${lr} 60 -172)`);
  } else o += E(0, -168, 62, 12, ol('#2A3240', 5));
  return G(o, tr(x, y, s));
}
// park bench (side-on front view), origin = floor centre, ~300 x 120. opts: col, low (2006 box)
function bench(x, y, s = 1, opts = {}) {
  if (opts.low) return G(R(-150, -64, 300, 22, 0, { fill: '#8A7058', stroke: '#3A3A3A', 'stroke-width': 2 }) + R(-150, -120, 300, 20, 0, { fill: '#8A7058', stroke: '#3A3A3A', 'stroke-width': 2 }) + R(-140, -42, 16, 42, 0, { fill: '#666' }) + R(124, -42, 16, 42, 0, { fill: '#666' }), tr(x, y, s));
  const c = opts.col || '#E8944A';
  let o = P('M-130 0 L-126 -70 M130 0 L126 -70 M-120 -64 L-112 -126 M120 -64 L112 -126', ln(12, LINE)) + P('M-130 0 L-126 -70 M130 0 L126 -70 M-120 -64 L-112 -126 M120 -64 L112 -126', ln(6, '#3E4A5C'));
  o += R(-152, -76, 304, 20, 6, ol(c, 5)) + R(-148, -132, 296, 18, 6, ol(c, 5)) + R(-148, -108, 296, 18, 6, ol(c, 5));
  o += P('M-140 -70 H140 M-138 -126 H138 M-138 -102 H138', ln(3, '#FFFFFF', 0.35));
  return G(o, tr(x, y, s));
}
// basketball hoop on a pole (front view), origin = pole base; ~ 230 wide, 700 tall
function basketHoop(x, y, s = 1, opts = {}) {
  if (opts.low) return G(R(-10, -620, 20, 620, 0, { fill: '#8A8E94', stroke: '#3A3A3A', 'stroke-width': 2 }) + R(-110, -700, 220, 140, 0, { fill: '#E8E8E8', stroke: '#3A3A3A', 'stroke-width': 2 }) + R(-40, -560, 80, 10, 0, { fill: '#C86A3A' }), tr(x, y, s));
  let o = R(-12, -600, 24, 600, 6, ol('#3E4A5C', 5)) + R(-30, -14, 60, 16, 4, ol('#3E4A5C', 4));
  o += R(-115, -720, 230, 150, 10, ol('#FFFFFF', 6)) + R(-44, -660, 88, 64, 4, { fill: 'none', stroke: '#2FB3B8', 'stroke-width': 7 }) + P('M-115 -720 L-60 -720 L-115 -665 Z', { fill: '#2FB3B8', opacity: 0.25 });
  o += R(-8, -572, 16, 20, 3, ol('#9AA4B8', 3)) + E(0, -552, 50, 11, { fill: 'none', stroke: '#FF7A2E', 'stroke-width': 9 });
  o += P('M-46 -548 L-32 -486 L32 -486 L46 -548 M-24 -546 L-14 -486 M0 -544 L0 -486 M24 -546 L14 -486 M-40 -518 H40', ln(3.5, '#FFFFFF'));
  return G(o, tr(x, y, s));
}
// grind rail, origin = left post base; length L, height h. opts: low
function grindRail(x, y, L = 400, h = 120, opts = {}) {
  if (opts.low) return G(R(20, -h, 14, h, 0, { fill: '#777' }) + R(L - 34, -h, 14, h, 0, { fill: '#777' }) + R(0, -h - 14, L, 14, 0, { fill: '#8A8E94', stroke: '#3A3A3A', 'stroke-width': 2 }), tr(x, y));
  let o = P(`M30 0 L30 ${-h} M${L - 30} 0 L${L - 30} ${-h}`, ln(18, LINE)) + P(`M30 0 L30 ${-h} M${L - 30} 0 L${L - 30} ${-h}`, ln(10, '#3E4A5C'));
  o += R(14, -10, 32, 12, 3, ol('#3E4A5C', 3)) + R(L - 46, -10, 32, 12, 3, ol('#3E4A5C', 3));
  o += R(-6, -h - 18, L + 12, 20, 10, ol('#FFD23F', 5)) + P(Array.from({ length: Math.floor(L / 40) }, (_, i) => `M${10 + i * 40} ${-h - 16} l14 16`).join(' '), ln(8, LINE, 0.85)) + P(`M4 ${-h - 13} H${L - 4}`, ln(3, '#FFFFFF', 0.55));
  return G(o, tr(x, y));
}
// quarter-pipe (side-on), origin = ground contact of the curve (left), faces LEFT; R = transition radius, deck length D.
// Lip (coping) at (x + R, y - R). opts: col, low
function skateRamp(x, y, Rr = 380, D = 320, opts = {}) {
  const c = opts.col || '#8B66F0', dk = mix(c, '#1A0A40', 0.35);
  const curve = `M0 0 A${Rr} ${Rr} 0 0 0 ${Rr} ${-Rr}`;
  if (opts.low) return G(P(`M0 0 L${Rr} ${-Rr} L${Rr + D} ${-Rr} L${Rr + D} 0 Z`, { fill: '#9A9C98', stroke: '#3A3A3A', 'stroke-width': 2 }) + P(`M0 0 L${Rr} ${-Rr}`, ln(6, '#BDBDB8')), tr(x, y));
  let o = P(`${curve} L${Rr + D} ${-Rr} L${Rr + D} 0 Z`, ol(c, 6));
  // panels + bolts + stars on the side
  o += P(`M${Rr * 0.55} ${-Rr * 0.18} L${Rr * 0.55} 0 M${Rr} ${-Rr} L${Rr} 0 M${Rr + D * 0.5} ${-Rr} L${Rr + D * 0.5} 0`, ln(4, dk, 0.7));
  o += P(`M${Rr * 0.25} ${-12} H${Rr + D - 10}`, ln(10, dk, 0.35));
  o += P(starD(Rr + D * 0.25, -Rr * 0.45, 46, 21), ol('#FFD23F', 4)) + P(starD(Rr + D * 0.72, -Rr * 0.22, 26, 12), ol('#8EDB4F', 3.5)) + P(starD(Rr * 0.72, -Rr * 0.12, 20, 9), ol('#FFFFFF', 3));
  o += T('SKATE', Rr + D * 0.5, -Rr * 0.68, 46, '#FFFFFF', { ...OUTX(7), transform: '' });
  // riding surface edge (plywood) + coping + deck rail
  o += P(curve, ln(22, LINE)) + P(curve, ln(13, '#F2C988')) + P(`M${Rr * 0.08} ${-Rr * 0.01} A${Rr} ${Rr} 0 0 0 ${Rr * 0.94} ${-Rr * 0.66}`, ln(4, '#FFE2B0', 0.8));
  o += R(Rr - 6, -Rr - 12, D + 12, 16, 4, ol('#F2C988', 5));
  o += CI(Rr, -Rr - 2, 11, ol('#D9E0EA', 4));
  o += P(`M${Rr + D - 20} ${-Rr - 8} V${-Rr - 110} M${Rr + D - 120} ${-Rr - 8} V${-Rr - 110} M${Rr + D - 130} ${-Rr - 104} H${Rr + D - 12}`, ln(16, LINE)) + P(`M${Rr + D - 20} ${-Rr - 8} V${-Rr - 110} M${Rr + D - 120} ${-Rr - 8} V${-Rr - 110} M${Rr + D - 130} ${-Rr - 104} H${Rr + D - 12}`, ln(8, '#9AA4B8'));
  return G(o, tr(x, y));
}

// ================================================================= 1. SCHOOLYARD (camera-taking, parallax)
// World (k = 1 layer). Ground: the facade base line is y 700, the yard is paved from y 745 down; depth scale for
// characters: s(y) = 0.5 * (y - 160) / 800  (y 960 -> .5, y 800 -> .4, y 700 -> .34) = SPOTS.schoolyard.scaleAt(y).
//   x -3450..-1830  basketball court (hoop x -2650), willow tree, bench
//   x -1820..  780  left wing (single storey, windows, lime/sky colour-block panels)     flagpole at x 140 (base y 830)
//   x   780.. 1300  entrance block: double doors (centre x 1040), canopy, 3 steps, name sign, round clock
//   x  1300.. 2340  right wing          x 2340..3120 gym annex (barrel roof, GO COMETS mural)
//   x  3150.. 5600  skate area on a concrete pad: rail x 3300..3700, dented trash can x 3880, quarter-pipe 4200..4900
//                   (lip x 4580 y 588), crowd line y 800 x 3330..4120, benches x 3330 / 3700 y 770 (behind the crowd)
// Layers back to front: bg (sky k .1, sun, clouds, birds k .12, far hills k .3, tree row k .6) · mid (building, ground,
// hoop, benches) · pole (flagpole + flag — separate so the hero can hug it: draw him between mid and pole) · front (rail,
// trash can, quarter-pipe: draw the crowd BEFORE it, the riders AFTER it) · fg (bushes k 1.3) · light (screen tint).
// opts: time 'morning'|'day'|'sunset', red 0..1, frozen 0..1, lowGfx 0..1, colorBack 0..1 (undefined = no drain;
// 0 = fully grey; grows golden-edged colour circles from colorFrom [sx, sy] screen point), flag:false, pole:false
const SY = {
  base: 700, roof: 236, door: 1040, doorY: 692, poleX: 140, poleBase: 830, poleTop: -1900,
  rail: { x0: 3300, x1: 3700, h: 122, y: 968 }, trash: { x: 3880, y: 968 }, ramp: { x: 4200, y: 968, R: 380, D: 320 },
};
const scaleAt = (y) => +(0.5 * (y - 160) / 800).toFixed(3);
const YARD_TIME = {
  morning: { sky: 'ssSkyMorning', sun: [1560, 420, 78, '#FFF3B8', '#FFC870'], cloud: '#FFF8F2', cloudSh: '#FFD9C8', far: '#A9CFC0', far2: '#8DBFAA', tree: ['#56C26A', '#3FA85A', '#8FE38A'], tint: '#FFB27A', tintOp: 0.07, win: 'ssWinSky' },
  day: { sky: 'ssSkyDay', sun: [1640, 120, 70, '#FFF6C0', '#FFD84A'], cloud: '#FFFFFF', cloudSh: '#D2EAFF', far: '#9CD6B4', far2: '#7EC39C', tree: ['#4FBF5E', '#38A552', '#86E07A'], tint: null, tintOp: 0, win: 'ssWinSky' },
  sunset: { sky: 'ssSkySunset', sun: [420, 560, 110, '#FFF0A8', '#FF9A4A'], cloud: '#FFD6E0', cloudSh: '#E890B0', far: '#B07A9C', far2: '#8E5F8A', tree: ['#5E9A5A', '#46804A', '#A8C870'], tint: '#FF8A4A', tintOp: 0.16, win: 'ssWinSkyEve' },
};
def(`<pattern id="ssWinRow" x="0" y="340" width="260" height="280" patternUnits="userSpaceOnUse"><rect x="32" y="0" width="196" height="252" rx="6" fill="#FFFFFF" stroke="#151515" stroke-width="5"/><rect x="46" y="14" width="168" height="224" rx="3" fill="url(#ssWinSky)"/>` +
  `<path d="M60 220 L150 14 L176 14 L86 220 Z M120 220 L200 40 L210 40 L132 220 Z" fill="#FFFFFF" opacity="0.32"/><path d="M130 14 V238 M46 92 H214" stroke="#FFFFFF" stroke-width="9"/><path d="M130 14 V238 M46 92 H214" stroke="#151515" stroke-width="2" opacity="0.35"/>` +
  `<rect x="24" y="246" width="212" height="16" rx="4" fill="#E9EEF3" stroke="#151515" stroke-width="4"/></pattern>`);
def(`<pattern id="ssWinRowEve" x="0" y="340" width="260" height="280" patternUnits="userSpaceOnUse"><rect x="32" y="0" width="196" height="252" rx="6" fill="#FFF4E6" stroke="#151515" stroke-width="5"/><rect x="46" y="14" width="168" height="224" rx="3" fill="url(#ssWinSkyEve)"/>` +
  `<path d="M60 220 L150 14 L176 14 L86 220 Z" fill="#FFFFFF" opacity="0.25"/><path d="M130 14 V238 M46 92 H214" stroke="#FFF4E6" stroke-width="9"/><rect x="24" y="246" width="212" height="16" rx="4" fill="#F0E4D8" stroke="#151515" stroke-width="4"/></pattern>`);
def('<pattern id="ssWinLow" x="0" y="340" width="260" height="280" patternUnits="userSpaceOnUse"><rect x="40" y="10" width="180" height="236" fill="#6E747A" stroke="#3A3A3A" stroke-width="2"/></pattern>');
def('<pattern id="ssAsphalt" width="140" height="90" patternUnits="userSpaceOnUse"><rect width="140" height="90" fill="#B5BECA"/><circle cx="14" cy="18" r="2.4" fill="#9EA9B7"/><circle cx="62" cy="8" r="1.8" fill="#C9D1DB"/><circle cx="96" cy="44" r="2.6" fill="#9EA9B7"/><circle cx="30" cy="66" r="1.6" fill="#C9D1DB"/><circle cx="120" cy="78" r="2" fill="#A6B0BD"/><circle cx="78" cy="70" r="1.4" fill="#9EA9B7"/></pattern>');
def('<pattern id="ssSlab" x="0" y="728" width="300" height="130" patternUnits="userSpaceOnUse"><rect width="300" height="130" fill="#D6DEE7"/><path d="M0 1 H300 M1 0 V130" stroke="#B4C0CD" stroke-width="3"/><circle cx="80" cy="50" r="2" fill="#BFC9D4"/><circle cx="210" cy="90" r="2.4" fill="#C2CCD7"/></pattern>');
def('<pattern id="ssPavers" x="0" y="774" width="120" height="60" patternUnits="userSpaceOnUse"><rect width="120" height="60" fill="#ECE4D4"/><path d="M0 1 H120 M1 0 V30 M61 30 V60 M0 31 H120" stroke="#CDBFA6" stroke-width="3"/></pattern>');
def('<pattern id="ssGrass" width="60" height="40" patternUnits="userSpaceOnUse"><rect width="60" height="40" fill="#78C85A"/><path d="M8 30 l4 -10 l4 10 M34 16 l4 -10 l4 10 M50 36 l3 -8 l3 8" fill="none" stroke="#5DAE44" stroke-width="3"/></pattern>');
def('<pattern id="ssChain" width="34" height="34" patternUnits="userSpaceOnUse"><path d="M0 17 L17 0 L34 17 L17 34 Z" fill="none" stroke="#E2E8F0" stroke-width="3" opacity="0.85"/><path d="M0 18 L17 1 L34 18" fill="none" stroke="#7A8698" stroke-width="1.5" opacity="0.6"/></pattern>');
def('<pattern id="ssRoofSeam" width="70" height="200" patternUnits="userSpaceOnUse"><rect width="70" height="200" fill="#E4ECF4"/><rect width="5" height="200" fill="#B8C6D6"/></pattern>');

// the yard's tree row (k .6) + far layer data (deterministic)
const YARD_TREES = (() => { const a = []; for (let x = -4200, i = 0; x < 7600; i++) { a.push({ x, s: 0.82 + 0.5 * hash(i * 3.3), kind: hash(i * 7.7) > 0.72 ? 'pine' : 'round', g: i % 3 }); x += 300 + 220 * hash(i * 1.9); } return a; })();

function yardLayers(t, cam = {}, opts = {}) {
  const time = YARD_TIME[opts.time] ? opts.time : 'day', TM = YARD_TIME[time];
  const red = bool01(opts.red), frozen = bool01(opts.frozen), low = bool01(opts.lowGfx);
  const cb = opts.colorBack === undefined || opts.colorBack === null ? null : clamp(+opts.colorBack, 0, 1);
  const fl = 1 - frozen;                                  // idle motion amplitude
  const lodK = (i, x) => 0.06 + 0.82 * (0.55 * hash(i * 9.7 + 3) + 0.45 * clamp((x + 300) / 2600, 0, 1));
  const isLow = (i, x) => low > 0 && low >= lodK(i, x);
  const lowSky = smooth(0.15, 0.75, low);
  const tc = (c) => (red > 0 ? mix(c, '#5A0A14', red * 0.55) : c);

  // ---------------- bg: sky (k .1)
  let sky = R(-4000, -4400, 11000, 7000, 0, { fill: `url(#${TM.sky})` });
  if (red > 0) sky += R(-4000, -4400, 11000, 7000, 0, { fill: 'url(#ssSkyRed)', opacity: f(red) });
  if (lowSky > 0) sky += R(-4000, -4400, 11000, 7000, 0, { fill: 'url(#ssSkyLow)', opacity: f(lowSky * (1 - red * 0.7)) });
  if (red > 0) sky += R(-4000, -4400, 11000, 7000, 0, { fill: 'url(#ssScan)', opacity: f(red * 0.8) }) + G(R(-4300, -4400, 11300, 7000, 0, { fill: 'url(#ssPix)' }), `translate(${f(Math.floor(t * 6) * 24 % 288)} 0)`, { opacity: f(red) });
  // sun (k .04)
  let sun = '';
  {
    const [sx, sy, sr, c1, c2] = TM.sun, k = 1 - red;
    if (k > 0.01 && lowSky < 1) sun += G(softGlow(sx, sy, sr * 3.2, sr * 3.2, c1, 1) + CI(sx, sy, sr, { fill: c1, stroke: c2, 'stroke-width': sr * 0.14 }) + CI(sx - sr * 0.3, sy - sr * 0.3, sr * 0.28, { fill: '#FFFFFF', opacity: 0.5 }), '', { opacity: f(k * (1 - lowSky)) });
    if (lowSky > 0 && k > 0.01) sun += R(sx - sr * 0.8, sy - sr * 0.8, sr * 1.6, sr * 1.6, 0, { fill: '#F2E6A0', stroke: '#3A3A3A', 'stroke-width': 2, opacity: f(lowSky * k) });
  }
  // clouds + birds (k .12)
  let cl = '';
  {
    const cols = red > 0 ? [mix(TM.cloud, '#4A0610', red), mix(TM.cloudSh, '#2A0008', red)] : [TM.cloud, TM.cloudSh];
    for (let i = 0; i < 9; i++) {
      const sp = (6 + hash(i * 4.1) * 8) * fl;
      const x = -1800 + md(hash(i * 2.7) * 6400 + t * sp, 6400), y = -900 + 1250 * hash(i * 9.3) + (i % 3 === 0 ? 300 : 0);
      const s = 0.7 + 0.8 * hash(i * 5.5);
      // keep the top-centre sky clear for the system window when red
      const clear = red > 0 && Math.abs(x - 960) < 900 && y < 400 ? 1 - red : 1;
      if (isLow(40 + i, x)) cl += G(R(-160, -60, 320, 90, 0, { fill: '#F0F2F4', stroke: '#3A3A3A', 'stroke-width': 2 }), tr(x, y, s), { opacity: f(clear) });
      else cl += cloud(x, y, s, cols[0], cols[1], clear);
    }
    if (red < 0.5) for (let i = 0; i < 5; i++) {
      const bx = -400 + md(i * 520 + t * 70 * fl, 2600), by = -1500 + i * 140 + Math.sin(t * 1.3 + i) * 20 * fl;
      cl += bird(bx, by, 1.1 - i * 0.08, t, i * 1.7, '#2A2E44', frozen < 0.5);
    }
  }
  // far hills + far treeline (k .3)
  let far = '';
  {
    const fc = tc(isLow(60, 960) ? '#9AA79A' : TM.far), fc2 = tc(isLow(61, 960) ? '#8A968A' : TM.far2);
    let d = 'M-4000 1600 L-4000 420';
    for (let i = 0; i <= 30; i++) { const x = -4000 + i * 400; d += ` Q${f(x + 200)} ${f(330 + 80 * hash(i * 3.7))} ${f(x + 400)} ${f(420 + 40 * hash(i * 1.3))}`; }
    d += ' L8000 1600 Z';
    far += P(d, { fill: fc });
    let tl = '';
    for (let i = 0; i < 60; i++) { const x = -4000 + i * 200 + 60 * hash(i * 2.1); tl += circD(x, 470 + 20 * hash(i * 4.4), 70 + 40 * hash(i * 6.6)); }
    far += P(tl + ' M-4000 480 H8000 V1600 H-4000 Z', { fill: fc2 });
  }
  // tree row (k .6) — tops peek over the roofline (y 236)
  let trees = '';
  {
    const [vx0, vx1] = [toWorldX(cam, 0.6, -400), toWorldX(cam, 0.6, 2320)];
    YARD_TREES.forEach((tt, i) => {
      if (tt.x < vx0 - 300 || tt.x > vx1 + 300) return;
      const g = TM.tree;
      const c = tc(tt.g === 0 ? g[0] : tt.g === 1 ? g[1] : mix(g[0], '#2FB3B8', 0.25));
      const lowT = isLow(80 + i, tt.x);
      trees += schoolTree(tt.x, 720, tt.s, { kind: tt.kind, col: c, hi: tc(g[2]), sway: Math.sin(t * 0.8 + i) * 1.5 * fl, low: lowT ? (i % 2 ? 'cube' : 'cone') : null, lowCol: '#6A8A5E' });
    });
  }
  const bg = layer(sky, cam, 0.1) + layer(sun, cam, 0.04) + layer(cl, cam, 0.12) + layer(far, cam, 0.3) + layer(trees, cam, 0.6);

  // ---------------- mid (k 1): ground, building, court, benches
  let m = '';
  const W0 = -4600, W1 = 7400;
  // ground: asphalt everywhere, grass strip along the building, concrete pad for the skate area
  const lowG = smooth(0.2, 0.7, low);
  m += R(W0, 690, W1 - W0, 3200, 0, { fill: 'url(#ssAsphalt)' });
  m += R(W0, 690, W1 - W0, 60, 0, { fill: 'url(#ssGrass)' }) + R(W0, 744, W1 - W0, 10, 0, { fill: '#9AA6B4' });
  m += R(3150, 728, 2450, 3200, 0, { fill: 'url(#ssSlab)' }) + P('M3150 728 V3900', ln(5, '#9AA6B4'));
  // painted games: hopscotch + four-square (faint)
  {
    let hop = '';
    [[-520, 830], [-520, 872], [-570, 916], [-470, 916], [-520, 962], [-570, 1010], [-470, 1010], [-520, 1060]].forEach(([x, y]) => { hop += `M${x - 44} ${y - 20} h88 v40 h-88 Z `; });
    m += P(hop, ln(5, '#FFFFFF', 0.55)) + TF('1', -520, 1072, 26, '#FFFFFF', { opacity: 0.55 });
    m += P('M-1300 840 L-860 840 L-820 1000 L-1340 1000 Z M-1080 840 L-1080 1000 M-1320 920 H-840', ln(5, '#FFE45C', 0.6));
    // court lines (left)
    m += P('M-3450 800 H-1850 M-2650 800 V1200 M-2950 800 Q-2950 940 -2650 960 Q-2350 940 -2350 800', ln(6, '#FFFFFF', 0.6)) + E(-2650, 1110, 220, 50, ln(6, '#FFFFFF', 0.45));
    // SKATE ZONE stencil on the pad
    m += T('SKATE ZONE', 3720, 1150, 80, '#FFFFFF', { opacity: 0.35, 'letter-spacing': 6 });
  }
  if (lowG > 0) m += R(W0, 690, W1 - W0, 3200, 0, { fill: '#A8A8A2', opacity: f(lowG) }) + R(3150, 728, 2450, 3200, 0, { fill: '#BCBCB6', opacity: f(lowG) }) + R(W0, 690, W1 - W0, 56, 0, { fill: '#7E9A6E', opacity: f(lowG) });

  // the building ---------------------------------------------------------------
  const wallC = tc('#FFEFD0'), wallSh = tc('#F2D9AE'), fasc = tc('#34B0B8'), cope = tc('#1E7D86'), plinth = tc('#B9C3CF');
  const winPat = time === 'sunset' ? 'ssWinRowEve' : 'ssWinRow';
  const wing = (x0, x1, i) => {
    if (isLow(i, (x0 + x1) / 2)) {
      return R(x0, 236, x1 - x0, 464, 0, { fill: '#CFC3A8', stroke: '#3A3A3A', 'stroke-width': 2 }) + R(x0, 220, x1 - x0, 30, 0, { fill: '#9E9686', stroke: '#3A3A3A', 'stroke-width': 2 }) + R(x0, 340, x1 - x0, 270, 0, { fill: 'url(#ssWinLow)' });
    }
    let o = R(x0, 236, x1 - x0, 464, 0, ol(wallC, 6));
    // colour-block panels behind some window bays
    for (let b = Math.ceil(x0 / 260); b * 260 < x1; b++) {
      const k = md(b, 5);
      if (k === 1) o += R(b * 260 + 6, 300, 248, 360, 0, { fill: tc('#9AD94E') });
      else if (k === 3) o += R(b * 260 + 6, 300, 248, 360, 0, { fill: tc('#8FD3F5') });
    }
    o += R(x0, 340, x1 - x0, 270, 0, { fill: `url(#${winPat})` });
    o += R(x0, 236, x1 - x0, 64, 0, ol(fasc, 6)) + R(x0 - 10, 218, x1 - x0 + 20, 22, 4, ol(cope, 5)) + P(`M${x0} 262 H${x1}`, ln(4, '#FFFFFF', 0.25));
    o += R(x0, 660, x1 - x0, 40, 0, ol(plinth, 5));
    o += R(x1 - 26, 300, 20, 360, 0, { fill: wallSh, opacity: 0.8 });
    // roof units peeking over the parapet
    o += R(x0 + 140, 190, 120, 30, 4, ol(tc('#C9D2DC'), 4)) + R(x1 - 360, 176, 160, 44, 4, ol(tc('#C9D2DC'), 4)) + P(`M${x1 - 340} 190 H${x1 - 220} M${x1 - 340} 204 H${x1 - 220}`, ln(3, '#8A96A6'));
    return o;
  };
  m += wing(-1820, 780, 1) + wing(1300, 2340, 2);
  // gym annex (barrel roof, mural)
  if (isLow(3, 2730)) m += R(2340, 40, 780, 660, 0, { fill: '#B4BEC6', stroke: '#3A3A3A', 'stroke-width': 2 }) + P('M2340 40 L2730 -60 L3120 40 Z', { fill: '#9A9E9E', stroke: '#3A3A3A', 'stroke-width': 2 });
  else {
    const gw = tc('#7CC7F2'), gd = tc('#5AAEDF');
    m += P('M2330 60 Q2730 -110 3130 60 Z', ol(tc('#E4ECF4'), 6)) + P('M2330 60 Q2730 -110 3130 60 Z', { fill: 'url(#ssRoofSeam)', opacity: 0.8 }) + P('M2360 50 Q2730 -88 3100 50', ln(4, '#FFFFFF', 0.6));
    m += R(2340, 50, 780, 650, 0, ol(gw, 6)) + R(2340, 50, 780, 40, 0, ol(gd, 5));
    m += R(2380, 118, 700, 70, 6, ol(tc('#BFE8FF'), 5)) + P(Array.from({ length: 9 }, (_, i) => `M${2380 + (i + 1) * 70} 118 V188`).join(' '), ln(5, '#FFFFFF'));
    m += comet(2610, 360, 1.5, -8) + T('GO', 2850, 320, 92, tc('#FFD23F'), OUTX(10)) + T('COMETS!', 2810, 420, 92, '#FFFFFF', OUTX(10));
    m += R(2950, 470, 130, 230, 6, ol(tc('#2FA7B0'), 5)) + P('M3015 470 V700', ln(4)) + R(2964, 490, 38, 60, 4, ol('#BFE8FF', 3)) + R(3028, 490, 38, 60, 4, ol('#BFE8FF', 3));
    m += R(2340, 660, 780, 40, 0, ol(plinth, 5)) + R(3100, 90, 20, 570, 0, { fill: gd, opacity: 0.8 });
  }
  // entrance block
  if (isLow(4, 1040)) {
    m += R(780, -40, 520, 740, 0, { fill: '#A8B4B4', stroke: '#3A3A3A', 'stroke-width': 2 }) + R(900, 300, 280, 392, 0, { fill: '#5E6266', stroke: '#3A3A3A', 'stroke-width': 2 }) + R(850, 250, 380, 40, 0, { fill: '#D8D8D0', stroke: '#3A3A3A', 'stroke-width': 2 });
    m += R(860, 70, 360, 120, 0, { fill: '#E0DCCF', stroke: '#3A3A3A', 'stroke-width': 2 }) + TF('SCHOOL', 1040, 150, 54, '#5A5A5A') + R(980, -130, 120, 100, 0, { fill: '#D8D8D0', stroke: '#3A3A3A', 'stroke-width': 2 });
  } else {
    const ec = tc('#2FA7B0'), ed = tc('#1E8890');
    // crown with the clock
    m += P('M930 -36 L930 -80 Q1040 -190 1150 -80 L1150 -36 Z', ol(ec, 6)) + wallClock(1040, -66, 62, opts.clock ?? '8:00', { rim: tc('#FFD23F'), t: frozen > 0.5 ? undefined : t });
    m += R(780, -40, 520, 740, 0, ol(ec, 6)) + R(770, -56, 540, 22, 4, ol(tc('#1A6E76'), 5)) + R(1270, -34, 24, 734, 0, { fill: ed, opacity: 0.8 });
    // vertical lime fins
    m += R(800, 20, 26, 640, 4, ol(tc('#9AD94E'), 4)) + R(1254, 20, 26, 640, 4, ol(tc('#9AD94E'), 4));
    // name sign
    m += R(846, 52, 388, 150, 14, ol(tc('#FFF6E2'), 6)) + T('WILLOWBROOK', 1040, 122, 47, tc('#1E7D86')) + TF('MIDDLE SCHOOL', 1040, 168, 30, tc('#3A4A5A'), { 'letter-spacing': 3 }) + comet(838, 48, 0.5, -12);
    // canopy + doors
    m += R(900, 300, 280, 392, 6, ol(tc('#1A5E66'), 6));
    for (const dx of [900, 1040]) {
      m += R(dx + 6, 304, 128, 386, 4, ol(tc('#7CCB3A'), 5)) + R(dx + 22, 324, 96, 250, 4, ol(tc('#BFE8FF'), 4)) + P(`M${dx + 34} 560 L${dx + 82} 330 L${dx + 100} 330 L${dx + 52} 560 Z`, { fill: '#FFFFFF', opacity: 0.4 });
      m += R(dx + 20, 594, 100, 14, 6, ol('#D9E0EA', 3)) + R(dx + 14, 640, 112, 40, 3, { fill: tc('#5EAA2C') });
    }
    m += R(850, 252, 380, 40, 8, ol(tc('#FFFFFF'), 6)) + R(850, 280, 380, 12, 0, { fill: tc('#9AD94E') }) + P('M860 296 H1220', ln(8, '#000', 0.12));
    m += R(780, 660, 520, 40, 0, ol(plinth, 5));
  }
  // steps (porch + 3 steps) + rails
  if (isLow(5, 1040)) m += R(840, 692, 400, 84, 0, { fill: '#B8B8B2', stroke: '#3A3A3A', 'stroke-width': 2 });
  else {
    const st = [[692, 704, 0], [704, 724, 1], [724, 732, 2], [732, 752, 3], [752, 760, 4], [760, 780, 5]];
    for (const [y0, y1, i] of st) {
      const w = Math.floor(i / 2) * 26, top = i % 2 === 0;
      m += R(846 - w, y0, 388 + 2 * w, y1 - y0, 2, { fill: tc(top ? '#EEF1F5' : '#C3CCD6'), stroke: LINE, 'stroke-width': 4 });
    }
    for (const sx of [-1, 1]) {
      const x0 = 1040 + sx * 170, x1 = 1040 + sx * 214;
      m += P(`M${x0} 690 L${x0} 600 M${x1} 776 L${x1} 680 M${x0} 604 L${x1} 684`, ln(12, LINE)) + P(`M${x0} 690 L${x0} 600 M${x1} 776 L${x1} 680 M${x0} 604 L${x1} 684`, ln(6, tc('#D9E0EA')));
    }
  }
  // walkway from the steps toward the camera
  m += P('M820 780 L1260 780 L1560 1500 L520 1500 Z', { fill: 'url(#ssPavers)', opacity: f(1 - lowG) }) + P('M820 780 L520 1500 M1260 780 L1560 1500', ln(5, '#B8AC94', 1 - lowG));
  if (lowG > 0) m += P('M820 780 L1260 780 L1560 1500 L520 1500 Z', { fill: '#C4C0B4', opacity: f(lowG) });
  // planters flanking the steps
  for (const px of [770, 1310]) {
    m += isLow(16 + px, px) ? R(px - 50, 740, 100, 60, 0, { fill: '#9A9E9E', stroke: '#3A3A3A', 'stroke-width': 2 }) :
      P(`M${px - 52} 742 L${px + 52} 742 L${px + 40} 806 L${px - 40} 806 Z`, ol(tc('#2FA7B0'), 5)) + R(px - 58, 732, 116, 16, 5, ol(tc('#1E7D86'), 4)) + P(`${circD(px - 30, 722, 20)} ${circD(px + 4, 712, 24)} ${circD(px + 34, 724, 18)}`, ol(tc('#4CB65A'), 4)) + P(`${circD(px - 26, 708, 7)} ${circD(px + 10, 696, 8)} ${circD(px + 32, 712, 6)}`, ol(tc(px < 1000 ? '#FF6F91' : '#FFD23F'), 2.5));
  }
  // shrubs along the facade (skip the steps)
  {
    let sh = '';
    for (let i = 0, x = -1780; x < 3100; i++, x += 230 + 90 * hash(i * 2.2)) {
      if (x > 720 && x < 1360) continue;
      if (Math.abs(x - SY.poleX) < 120) continue;
      sh += isLow(100 + i, x) ? R(x - 70, 680, 140, 60, 0, { fill: '#6E9A5A', stroke: '#3A3A3A', 'stroke-width': 2 }) : bush(x, 744, 0.62 + 0.18 * hash(i * 3.1), tc(i % 2 ? '#4CB65A' : '#3FA85A'), tc('#8FE38A'));
    }
    m += sh;
  }
  // left: court + willow + bench; trees in front of the wing ends
  m += isLow(6, -2650) ? basketHoop(-2650, 800, 0.9, { low: true }) : basketHoop(-2650, 800, 0.9);
  m += schoolTree(-1980, 760, 1.15, { kind: 'willow', col: tc('#6CC24A'), hi: tc('#A8E87A'), sway: Math.sin(t * 0.7) * 2 * fl, low: isLow(7, -1980) ? 'cube' : null });
  m += bench(-1500, 790, 0.85, { low: isLow(8, -1500), col: tc('#E8944A') }) + bench(-3300, 790, 0.85, { low: isLow(9, -3300), col: tc('#2FB3B8') });
  // fence behind the skate area + trees beyond
  if (isLow(10, 4200)) m += R(3120, 470, 2800, 250, 0, { fill: '#9A9E9E', opacity: 0.5 }) + R(3120, 460, 2800, 12, 0, { fill: '#777' });
  else {
    m += R(3120, 470, 2800, 250, 0, { fill: 'url(#ssChain)' }) + R(3120, 460, 2800, 14, 6, ol('#AEB8C6', 3));
    let pd = '';
    for (let x = 3140; x < 5900; x += 320) pd += `M${x} 462 V726 `;
    m += P(pd, ln(16, LINE)) + P(pd, ln(9, '#AEB8C6'));
  }
  // benches for the crowd (behind the crowd line)
  if (opts.crowdBench !== false) m += bench(3330, 772, 0.78, { low: isLow(11, 3330), col: tc('#9AD94E') }) + bench(3700, 772, 0.78, { low: isLow(12, 3700), col: tc('#9AD94E') });
  // a bike rack + backpacks by the gym
  if (!isLow(13, 2500)) { let br = ''; for (let i = 0; i < 5; i++) br += `M${2420 + i * 56} 760 v-50 a24 24 0 0 1 48 0 v50 `; m += P(br, ln(12, LINE)) + P(br, ln(6, '#9AA4B8')); }
  // flagpole base (planter) is in mid; the pole + flag are their own layer
  m += isLow(14, SY.poleX) ? R(SY.poleX - 90, 800, 180, 50, 0, { fill: '#9A9E9E', stroke: '#3A3A3A', 'stroke-width': 2 }) :
    P(`M${SY.poleX - 120} 832 L${SY.poleX - 116} 866 Q${SY.poleX} 886 ${SY.poleX + 116} 866 L${SY.poleX + 120} 832 Z`, ol(tc('#C9D2DC'), 5)) + E(SY.poleX, 832, 120, 24, ol(tc('#7A5236'), 5)) +
    P(Array.from({ length: 9 }, (_, i) => circD(SY.poleX - 96 + i * 24, 826 - 6 * Math.sin(i), 10)).join(' '), ol(tc(['#FF6F91', '#FFD23F', '#FFFFFF'][0]), 3)) + P(Array.from({ length: 8 }, (_, i) => circD(SY.poleX - 84 + i * 24, 834, 9)).join(' '), ol(tc('#FFD23F'), 3)) +
    R(SY.poleX - 20, 818, 40, 16, 4, ol(tc('#9AA4B8'), 4));

  // ---------------- pole (k 1)
  let pole = '';
  if (opts.pole !== false) {
    const px = SY.poleX, top = SY.poleTop;
    if (isLow(15, px)) {
      pole += R(px - 6, top, 12, SY.poleBase - top - 10, 0, { fill: '#9A9E9E', stroke: '#3A3A3A', 'stroke-width': 2 }) + R(px - 12, top - 22, 24, 24, 0, { fill: '#B8A850' });
      if (opts.flag !== false) pole += R(px + 6, top + 10, 250, 160, 0, { fill: '#8AA070', stroke: '#3A3A3A', 'stroke-width': 2 });
    } else {
      pole += P(`M${px - 9} ${SY.poleBase - 8} L${px - 5} ${top} L${px + 5} ${top} L${px + 9} ${SY.poleBase - 8} Z`, ol(tc('#D9E0EA'), 5)) + P(`M${px - 2} ${SY.poleBase - 20} L${px} ${top + 20}`, ln(3, '#FFFFFF', 0.7));
      pole += P(`M${px + 7} ${top + 14} L${px + 9} ${SY.poleBase - 60}`, ln(2.5, '#6A7488', 0.8)) + R(px + 6, SY.poleBase - 120, 10, 26, 3, ol('#9AA4B8', 2.5));
      pole += R(px - 14, top - 6, 28, 12, 3, ol(tc('#C9D2DC'), 4)) + CI(px, top - 22, 17, ol(tc('#FFD23F'), 5)) + CI(px - 5, top - 27, 5, { fill: '#FFFFFF', opacity: 0.7 });
      if (opts.flag !== false) pole += flag(px + 6, top + 14, t, fl, tc);
    }
  }

  // ---------------- front (k 1): rail, trash can, quarter-pipe
  let fr = '';
  fr += grindRail(SY.rail.x0, SY.rail.y, SY.rail.x1 - SY.rail.x0, SY.rail.h, { low: isLow(20, SY.rail.x0) });
  fr += isLow(21, SY.trash.x) ? G(R(-56, -180, 112, 180, 0, { fill: '#8A8E94', stroke: '#3A3A3A', 'stroke-width': 2 }), tr(SY.trash.x, SY.trash.y)) : trashCan(SY.trash.x, SY.trash.y, 1, { dent: 1, lid: 'tilt', col: tc('#B9C6D3') });
  fr += skateRamp(SY.ramp.x, SY.ramp.y, SY.ramp.R, SY.ramp.D, { low: isLow(22, SY.ramp.x), col: tc('#8B66F0') });

  // ---------------- fg (k 1.3): bushes at the far edges
  let fg = '';
  for (const [x, s, c] of [[-700, 1.4, '#3FA85A'], [1990, 1.3, '#4CB65A'], [3450, 1.5, '#3FA85A'], [6200, 1.4, '#4CB65A']]) {
    fg += isLow(30 + x, x) ? R(x - 150, 1080, 300, 140, 0, { fill: '#6E9A5A', stroke: '#3A3A3A', 'stroke-width': 2 }) : bush(x, 1230, s, tc(c), tc('#8FE38A'));
  }

  // ---------------- light (screen space)
  let light = '';
  if (TM.tint) light += SCREEN(TM.tint, TM.tintOp * (1 - red));
  if (time === 'sunset') light += R(-60, 700, 2040, 500, 0, { fill: '#5A2A6A', opacity: f(0.12 * (1 - red)) });
  if (red > 0) light += SCREEN('#FF1A2E', red * (0.14 + 0.07 * Math.sin(t * 6))) + SCREEN('#2A0008', red * 0.12);
  if (frozen > 0) light += SCREEN('#B8CCE4', 0.26 * frozen) + SCREEN('#8A929C', 0.14 * frozen) + R(-60, -60, 2040, 1200, 0, { fill: 'url(#ssScanLt)', opacity: f(frozen) });
  if (cb !== null) light += drain(cb, opts.colorFrom);
  return { bg, mid: layer(m, cam, 1), pole: layer(pole, cam, 1), front: layer(fr, cam, 1), fg: layer(fg, cam, 1.3), light };
}
// world x / y at screen x / y for layer k
function toWorldX(cam, k, sx) { const z = 1 + ((cam.zoom ?? 1) - 1) * k; const fx = cam.fx ?? 960; return fx + (cam.x || 0) * k + (sx - fx) / z; }
function toWorldY(cam, k, sy) { const z = 1 + ((cam.zoom ?? 1) - 1) * k; const fy = cam.fy ?? 540; return fy + (cam.y || 0) * k + (sy - fy) / z; }
// the school flag (waving), attached at (x, y) = top of the hoist; ~250 x 160
function flag(x, y, t, amp = 1, tc = (c) => c) {
  const w = 250, h = 160, N = 8;
  const wave = (u, ph) => Math.sin(t * 6 - u * 5 + ph) * 12 * u * amp + u * u * 10 * (1 - amp);
  const top = [], bot = [];
  for (let i = 0; i <= N; i++) { const u = i / N; top.push([x + u * w, y + wave(u, 0)]); bot.push([x + u * w, y + h + wave(u, 0.6) - u * 6]); }
  const d = 'M' + pts(top) + ' L' + pts(bot.slice().reverse()) + ' Z';
  let o = P(d, ol(tc('#8EDB4F'), 5));
  // teal stripe (band in the middle third)
  const mt = [], mb = [];
  for (let i = 0; i <= N; i++) { const u = i / N; mt.push([x + u * w, y + h * 0.36 + wave(u, 0.2) - u * 2]); mb.push([x + u * w, y + h * 0.64 + wave(u, 0.4) - u * 4]); }
  o += P('M' + pts(mt) + ' L' + pts(mb.slice().reverse()) + ' Z', { fill: tc('#2FB3B8') });
  o += P(starD(x + w * 0.3, y + h * 0.5 + wave(0.3, 0.3), 40, 19), ol(tc('#FFD23F'), 4));
  o += P(d, { fill: 'none', stroke: LINE, 'stroke-width': 5, 'stroke-linejoin': 'round' });
  return o;
}
// grey "drained" overlay with colour circles growing back (colour floods back): k 0 = grey, 1 = full colour.
// Each circle is a hole cut by its own evenodd clip; nested clips intersect, so overlapping circles stay holes.
function drain(k, from, col = '#8E929A', op = 0.8) {
  if (k >= 1) return '';
  const [cx, cy] = from || [960, 620];
  const circles = [[cx, cy, ease.inOut(clamp(k / 0.85, 0, 1)) * 2300], [cx - 760, cy - 380, ease.inOut(clamp((k - 0.12) / 0.7, 0, 1)) * 900], [cx + 700, cy - 300, ease.inOut(clamp((k - 0.2) / 0.65, 0, 1)) * 950], [cx + 180, cy + 380, ease.inOut(clamp((k - 0.28) / 0.6, 0, 1)) * 700]];
  let o = P('M-80 -80 H2000 V1160 H-80 Z', { fill: col, opacity: op });
  let rings = '';
  for (const [x, y, r] of circles) {
    if (r <= 2) continue;
    const id = S.uid('ssDr');
    o = S.clipDef(id, P(`M-80 -80 H2000 V1160 H-80 Z ${circD(x, y, r)}`, { 'clip-rule': 'evenodd' })) + G(o, null, { 'clip-path': `url(#${id})` });
    rings += CI(x, y, r, { fill: 'none', stroke: '#FFE58A', 'stroke-width': f(26 * (1 - k) + 6), opacity: f(0.55 * (1 - k)) });
  }
  return o + rings;
}
function schoolyard(t = 0, cam = {}, opts = {}) { const L = yardLayers(t, cam, opts); return L.bg + L.mid + L.pole + L.front + L.fg + L.light; }
schoolyard.layers = yardLayers;
const POLE_HUG = { x: SY.poleX, y: SY.poleTop + 470, s: 0.5 };

// ================================================================= 2. CLASSROOM — Mr. Fig's maths class
// Two framings of the same room (opts.view):
//  'class' (default): looking at the KIDS from the whiteboard. Back wall: windows (left), the wall clock (centre top,
//    opts.clock '8:00'), a pi strip, a bulletin board with maths posters, cubbies with backpacks. Three rows of student
//    desks facing the camera; seated kids stand on SPOTS.classroom.seats (feet hidden below the desks; desk tops are in
//    layers.front). YOUR desk = front row centre (SPOTS.classroom.heroDesk), the "56!" neighbour = SPOTS.classroom.neighbour
//    (front row, right). Front row desks have an open space under the top: sliding down behind the desk works
//    (cams.heroDesk). Mr. Fig stands at the left (SPOTS.classroom.teacher). For exact depth sorting use
//    layers.frontRows (back row -> front row): mid, row-3 kids, frontRows[0], row-2 kids, frontRows[1], row-1 kids, frontRows[2].
//  'board': looking at the WHITEBOARD from the back of the room (opts.board lines, default ['7 × 8 = ?']). Mr. Fig stands
//    left of the board (SPOTS.classroom.board.teacher; draw him after mid, before front), a middle row of cheap seated
//    kids (backs of heads, opts.fill:false hides them) is the front layer, the foreground row (hero + neighbour in
//    view:'back') stands on SPOTS.classroom.board.seats; their chair backs are layers.fg (draw with k 1).
// opts: { view, board [lines], clock ('8:00' | hours), quiz (papers on desks), time 'morning'|'day', fill }
def(`<pattern id="ssLino" width="160" height="80" patternUnits="userSpaceOnUse"><rect width="160" height="80" fill="#F2E6CF"/><rect width="80" height="40" fill="#EADBC0"/><rect x="80" y="40" width="80" height="40" fill="#EADBC0"/><path d="M0 0.5 H160 M0 40 H160 M0.5 0 V80 M80 0 V80" stroke="#D8C6A6" stroke-width="2"/><circle cx="26" cy="20" r="2" fill="#D2BE9C"/><circle cx="118" cy="58" r="2" fill="#D2BE9C"/></pattern>`);
def(`<pattern id="ssCork" width="60" height="60" patternUnits="userSpaceOnUse"><rect width="60" height="60" fill="#E2B57A"/><circle cx="10" cy="12" r="2.5" fill="#C99558"/><circle cx="40" cy="30" r="2" fill="#F0C890"/><circle cx="24" cy="48" r="2.4" fill="#C99558"/><circle cx="52" cy="8" r="1.8" fill="#C99558"/></pattern>`);
def(lg('ssClassWall', [[0, '#E2F7F1'], [1, '#CBEFE6']]));
def(lg('ssBoard', [[0, '#FFFFFF'], [1, '#EEF4F8']]));
const CHAIR_COLS = ['#8ED24E', '#FF9F43', '#3FA9E0', '#2FB3B8', '#FF6F91'];
// student desk seen from the FRONT: chair back (behind the kid) + desk front (top, book box, legs). k = s / .5.
function deskFront(x, top, k, opts = {}) {
  const ch = CHAIR_COLS[opts.chair ?? 0];
  const back = G(R(-92, -150, 184, 150, 26, ol(ch, 5)) + R(-76, -136, 152, 30, 14, { fill: '#FFFFFF', opacity: 0.3 }) + P('M-70 0 L-76 230 M70 0 L76 230', ln(10, '#3E4A5C')), tr(x, top, k));
  let fr = R(-176, -12, 352, 26, 8, ol('#F4D59C', 5)) + P('M-166 -4 H166', ln(4, '#FFFFFF', 0.55));
  fr += R(-160, 14, 320, 128, 6, ol('#93CFE6', 5)) + R(-150, 22, 300, 18, 4, { fill: '#6CB4D2' }) + R(-150, 112, 300, 22, 4, { fill: '#7FC1DC' });
  fr += P('M-150 142 L-154 220 M150 142 L154 220 M-150 196 H150', ln(13, LINE)) + P('M-150 142 L-154 220 M150 142 L154 220 M-150 196 H150', ln(6, '#8A96A8'));
  if (opts.books !== false) fr += R(-130, 30, 70, 14, 3, ol(opts.bookCol || '#FF6F91', 2.5)) + R(-56, 32, 54, 12, 3, ol('#FFD23F', 2.5));
  if (opts.paper) fr += G(P('M-60 -16 L50 -20 L54 -6 L-56 -2 Z', ol('#FFFFFF', 2.5)) + P('M-44 -12 H30 M-44 -7 H20', ln(1.5, '#7A8AA8')) + P('M60 -12 L96 -30', ln(5, '#FFD23F')), '');
  if (opts.pencil) fr += P('M70 -8 L126 -14', ln(6, '#FFB43A'));
  return [back, G(fr, tr(x, top, k))];
}
// desk + chair seen from BEHIND (board view): desk (far) + chair back (near); a cheap seated kid in between
function deskBack(x, top, k, opts = {}) {
  const ch = CHAIR_COLS[opts.chair ?? 0];
  const desk = G(R(-170, -14, 340, 22, 7, ol('#F4D59C', 5)) + P('M-150 8 L-150 120 M150 8 L150 120', ln(12, LINE)) + P('M-150 8 L-150 120 M150 8 L150 120', ln(6, '#8A96A8')), tr(x, top, k));
  const chair = G(R(-96, -10, 192, 130, 24, ol(ch, 5)) + R(-80, 2, 160, 24, 12, { fill: '#FFFFFF', opacity: 0.25 }) + P('M-80 120 L-84 220 M80 120 L84 220', ln(10, '#3E4A5C')), tr(x, top + 60 * k, k));
  return [desk, chair];
}
// cheap seated kid from behind: shoulders + head + hair; origin = chair-back top centre; k = s / .5
const KID_HAIR = ['#3A2618', '#7A4A22', '#1E1A22', '#E8B04A', '#B85A2A', '#5A3A2A', '#2A2438'];
const KID_SHIRT = ['#FF6F91', '#3FA9E0', '#8ED24E', '#FFB43A', '#9B6BFF', '#2FB3B8', '#FF5A5A', '#F4F7FB'];
function kidBack(x, y, k, i) {
  const sh = KID_SHIRT[i % KID_SHIRT.length], hc = KID_HAIR[(i * 3 + 1) % KID_HAIR.length], skin = ['#FFFFFF', '#F2C9A0', '#C98A5E', '#8A5A3A'][(i * 7) % 4];
  let o = P('M-100 40 L-92 -60 Q-90 -96 -50 -100 L50 -100 Q90 -96 92 -60 L100 40 Z', ol(sh, 5));
  o += R(-66, -250, 132, 150, 34, ol(skin, 5));
  o += (i % 3 === 0) ? P('M-72 -170 Q-80 -262 0 -266 Q80 -262 72 -170 Q72 -110 40 -104 L-40 -104 Q-72 -110 -72 -170 Z', ol(hc, 5)) : P('M-70 -150 Q-78 -262 0 -266 Q78 -262 70 -150 Q40 -170 0 -166 Q-40 -170 -70 -150 Z', ol(hc, 5));
  if (i % 4 === 1) o += P('M40 -230 Q90 -250 96 -170 Q80 -200 50 -200', ol(hc, 4));
  return G(o, tr(x, y, k));
}
function classroomLayers(t, opts = {}) {
  const view = opts.view === 'board' ? 'board' : 'class';
  const morning = opts.time === 'morning';
  const winSky = morning ? 'ssSkyMorning' : 'ssSkyDay';
  if (view === 'board') {
    let m = cover('url(#ssClassWall)') + band(470, 700, '#A6DCEB') + band(462, 478, '#9AD94E') + P(`M${XL} 462 H${XR} M${XL} 478 H${XR}`, ln(3.5, LINE, 0.6));
    m += band(YT, 40, '#F4FAFB') + band(36, 46, '#2FB3B8');
    // pi strip
    m += R(XL, 52, XR - XL, 40, 0, { fill: '#2FB3B8', opacity: 0.18 }) + TF('π = 3.14159 26535 89793 23846 26433 83279 50288 41971 69399 37510 58209 74944 59230 78164', 960, 82, 28, '#1E7D86', { opacity: 0.7, 'letter-spacing': 4 });
    // door (left)
    m += R(40, 200, 270, 500, 6, ol('#FFFFFF', 6)) + R(58, 216, 234, 484, 4, ol('#E39A5A', 5)) + R(96, 250, 100, 150, 6, ol('#BFE8FF', 4)) + CI(262, 470, 12, ol('#FFD23F', 3)) + R(100, 160, 160, 36, 6, ol('#2A3A55', 4)) + TF('ROOM 104', 180, 186, 22, '#FFFFFF');
    // whiteboard
    m += R(450, 106, 1020, 22, 10, ol('#C9D2DC', 4)) + R(450, 118, 1020, 6, 0, { fill: '#8A96A8' });
    m += R(390, 136, 1140, 384, 12, ol('#C9D2DC', 7)) + R(406, 152, 1108, 352, 6, { fill: 'url(#ssBoard)' }) + P('M440 180 L520 152 M1380 480 L1500 440', ln(10, '#FFFFFF', 0.8));
    m += R(400, 516, 1120, 18, 4, ol('#C9D2DC', 4)) + R(470, 506, 70, 12, 4, ol('#2457C5', 2.5)) + R(560, 506, 70, 12, 4, ol('#E8243C', 2.5)) + R(650, 506, 70, 12, 4, ol('#2E9E4A', 2.5)) + R(1300, 500, 90, 18, 5, ol('#3E4A5C', 2.5));
    const lines = opts.board || ['7 × 8 = ?'];
    const big = lines.length === 1;
    lines.forEach((l, i) => {
      const size = big ? 150 : i === 0 ? 96 : 60;
      const y = big ? 380 : 250 + i * (i === 0 ? 0 : 74) + (i ? 60 : 0);
      m += TF(l, 960, y, size, i === 0 ? '#2457C5' : '#2A3A55');
    });
    if (big) m += P('M600 430 Q960 456 1320 430', ln(6, '#E8243C', 0.75));
    m += TF('Mr. Fig ♥ maths', 1380, 488, 22, '#2E9E4A', { opacity: 0.7 });
    // right: clock, posters, teacher's desk
    m += wallClock(1730, 210, 62, opts.clock ?? '8:00', { t });
    m += schoolPoster(['MATH', 'IS FUN'], 1730, 360, { w: 190, h: 120, col: '#FFD23F', rot: 3, size: 38 });
    m += band(700, YB, 'url(#ssLino)') + band(696, 708, '#2E7FA8');
    m += R(XL, 700, XR - XL, 40, 0, { fill: '#000', opacity: 0.06 });
    // teacher's desk (right)
    let td = R(1530, 640, 400, 28, 8, ol('#C98A52', 5)) + R(1546, 668, 368, 150, 6, ol('#A86B3C', 5)) + R(1566, 690, 160, 110, 6, { fill: 'none', stroke: '#8A5530', 'stroke-width': 4 });
    td += R(1600, 600, 70, 40, 5, ol('#FFFFFF', 3)) + R(1604, 604, 62, 8, 2, { fill: '#7A8AA8' }) + R(1596, 592, 78, 10, 3, ol('#FFFFFF', 3));
    td += G(R(-24, -54, 48, 54, 8, ol('#2FB3B8', 4)) + P('M24 -40 Q44 -36 24 -14', ln(5)) + TF('#1', 0, -20, 18, '#FFFFFF'), 'translate(1760 640)');
    td += G(R(-26, -40, 52, 40, 6, ol('#E8704A', 4)) + R(-12, -100, 24, 64, 12, ol('#5CB85A', 4)) + R(-34, -78, 16, 34, 8, ol('#5CB85A', 3.5)) + R(18, -86, 16, 40, 8, ol('#5CB85A', 3.5)), 'translate(1850 640)');
    td += G(R(-70, -22, 140, 30, 4, ol('#2A3A55', 3.5)) + TF('MR. FIG', 0, 0, 20, '#FFD23F'), 'translate(1680 770)');
    m += td;
    // front: the middle row (desks + cheap kids + chair backs); fg: the foreground chair backs
    let fr = '';
    const MID = [180, 560, 940, 1320, 1700];
    MID.forEach((x, i) => {
      const [desk, chair] = deskBack(x, 820, 0.84, { chair: (i + 2) % 5 });
      fr += desk;
      if (opts.fill !== false) fr += kidBack(x + (i % 2 ? 10 : -10), 880, 0.84, i + 3);
      fr += chair;
    });
    if (opts.quiz) MID.forEach((x) => { fr += P(`M${x - 90} 800 L${x - 10} 796 L${x - 8} 808 L${x - 88} 812 Z`, ol('#FFFFFF', 2.5)); });
    let fg = '';
    for (const [x, c] of [[380, 1], [1540, 3]]) fg += G(R(-96, -10, 192, 170, 26, ol(CHAIR_COLS[c], 6)) + R(-80, 4, 160, 30, 14, { fill: '#FFFFFF', opacity: 0.25 }), tr(x, 1000, 1.25));
    let light = morning ? TINT('#FFB27A', 0.06) : '';
    return { bg: '', mid: m, front: fr, fg, light, frontRows: [fr] };
  }
  // ---------------- view 'class'
  let bg = R(-600, -600, 1800, 1400, 0, { fill: `url(#${winSky})` }) + cloud(300, 210, 0.6, '#FFFFFF', '#D2EAFF') + cloud(620, 300, 0.45, '#FFFFFF', '#D2EAFF');
  bg += P('M-400 420 Q0 340 400 400 Q700 440 1000 380 L1000 900 L-400 900 Z', { fill: '#9CD6B4' }) + schoolTree(160, 520, 0.75, { col: '#4FBF5E', hi: '#86E07A' }) + schoolTree(560, 540, 0.6, { kind: 'pine', col: '#3AA85A', hi: '#86E07A' });
  bg += R(-400, 470, 1400, 400, 0, { fill: '#B5BECA' }) + R(-400, 460, 1400, 14, 0, { fill: '#78C85A' });
  let m = P(`M${XL} ${YT} H${XR} V660 H${XL} Z M90 140 V450 H690 V140 Z`, { fill: 'url(#ssClassWall)', 'fill-rule': 'evenodd' });
  m += band(YT, 30, '#F4FAFB') + band(26, 36, '#2FB3B8');
  m += R(XL, 44, XR - XL, 40, 0, { fill: '#2FB3B8', opacity: 0.18 }) + TF('3.14159 26535 89793 23846 26433 83279 50288 41971 69399 37510 58209 74944 59230 78164 06286', 960, 74, 28, '#1E7D86', { opacity: 0.7, 'letter-spacing': 4 });
  // windows (3 panes) + sill
  m += P('M70 120 H710 V470 H70 Z M90 140 V450 H690 V140 Z', { fill: '#FFFFFF', 'fill-rule': 'evenodd', stroke: LINE, 'stroke-width': 6 }) + P('M290 140 V450 M490 140 V450', ln(16, '#FFFFFF')) + P('M290 140 V450 M490 140 V450', ln(4, LINE, 0.35));
  m += P('M120 430 L200 160 L232 160 L152 430 Z M330 430 L400 200 L420 200 L350 430 Z', { fill: '#FFFFFF', opacity: 0.25 }) + R(58, 466, 664, 22, 6, ol('#FFFFFF', 5));
  m += G(R(-30, -46, 60, 46, 6, ol('#E8704A', 4)) + P('M0 -46 Q-30 -100 -56 -96 M0 -46 Q6 -110 30 -120 M0 -46 Q30 -80 56 -74', ln(9, '#4CB65A')), 'translate(620 468)') + G(R(-20, -30, 40, 30, 5, ol('#FFD23F', 3.5)) + R(-6, -60, 12, 32, 6, ol('#5CB85A', 3)), 'translate(170 468)');
  // clock + posters + bulletin board
  m += wallClock(960, 170, 62, opts.clock ?? '8:00', { t });
  m += R(1150, 136, 720, 340, 10, ol('#2FB3B8', 7)) + R(1164, 150, 692, 312, 4, { fill: 'url(#ssCork)' });
  {
    let tt = R(-120, -120, 240, 240, 6, ol('#FFFFFF', 4)) + R(-120, -120, 240, 44, 6, { fill: '#3FA9E0' }) + T('TIMES TABLES', 0, -88, 26, '#FFFFFF');
    let gd = '';
    for (let i = 1; i < 6; i++) gd += `M-120 ${-76 + i * 32} H120 M${-120 + i * 40} -76 V120 `;
    tt += P(gd, ln(2, '#C9D2DC')) + TF('7×8=56', 0, 20, 30, '#E8243C') + TF('6×7=42', -10, 84, 20, '#2A3A55');
    m += G(tt, tr(1300, 300, 1, -2));
    m += schoolPoster(['MISTAKES', 'HELP YOU', 'GROW'], 1550, 240, { w: 220, h: 150, col: '#9AD94E', size: 32, icon: 'none' }) + G(R(-14, -10, 28, 26, 4, ol('#E8704A', 3)) + P('M0 -10 Q-10 -36 -26 -34 M0 -10 Q8 -40 24 -40', ln(5, '#2E9E4A')), 'translate(1650 290)');
    m += schoolPoster(['STAR', 'STUDENTS'], 1560, 400, { w: 200, h: 100, col: '#FFD23F', size: 30, rot: 3 });
    m += G(R(-80, -80, 160, 160, 6, ol('#FF9EC4', 4)) + P('M-50 40 L-10 -40 L30 40 Z', ol('#FFFFFF', 3)) + CI(40, -30, 24, ol('#3FA9E0', 3)) + R(-60, -60, 40, 40, 3, ol('#FFD23F', 3)) + TF('SHAPES', 0, 66, 20, '#2A2246'), tr(1770, 330, 1, 4));
  }
  // cubbies with backpacks (under the bulletin board) + wainscot
  m += band(500, 660, '#A6DCEB') + band(492, 508, '#9AD94E') + P(`M${XL} 492 H${XR} M${XL} 508 H${XR}`, ln(3.5, LINE, 0.6));
  m += R(760, 520, 1180, 140, 6, ol('#F4D59C', 5));
  for (let i = 0; i < 8; i++) {
    const cx = 760 + i * 147.5;
    m += R(cx + 10, 532, 128, 116, 4, { fill: '#C9A068' });
    if (i % 3 !== 2) m += G(R(-40, -70, 80, 84, 22, ol(KID_SHIRT[(i * 3) % 8], 4)) + R(-28, -30, 56, 34, 10, ol(mix(KID_SHIRT[(i * 3) % 8], '#000000', 0.15), 3)) + P('M-20 -70 Q0 -96 20 -70', ln(6)), tr(cx + 74, 640, 0.9, (i % 2 ? 6 : -5)));
  }
  // floor
  m += band(660, YB, 'url(#ssLino)') + band(654, 668, '#2E7FA8') + R(XL, 660, XR - XL, 50, 0, { fill: '#000', opacity: 0.06 });
  // desks
  const ROWS = [{ y: 600, s: 0.3, xs: [380, 700, 1020, 1340, 1660] }, { y: 712, s: 0.4, xs: [140, 540, 940, 1340, 1740] }, { y: 860, s: 0.5, xs: [-10, 480, 960, 1440, 1930] }];
  const frontRows = [];
  ROWS.forEach((row, ri) => {
    let fr = '';
    const k = row.s / 0.5;
    row.xs.forEach((x, i) => {
      const [back, front] = deskFront(x, row.y, k, { chair: (i + ri * 2) % 5, paper: !!opts.quiz, pencil: !!opts.quiz && i % 2 === 0, bookCol: KID_SHIRT[(i + ri) % 8] });
      m += back; fr += front;
    });
    frontRows.push(fr);
  });
  let light = '';
  const beam = morning ? 0.9 : 0.55;
  light += P('M90 140 L690 140 L1500 1200 L380 1200 Z', { fill: 'url(#ssBeam)', opacity: f(0.35 * beam) });
  if (morning) light += TINT('#FFB27A', 0.06);
  return { bg, mid: m, front: frontRows.join(''), fg: '', light, frontRows };
}
const classroom = makeSet(classroomLayers);
const CLASS_ROWS = [{ y: 600, s: 0.3, xs: [380, 700, 1020, 1340, 1660] }, { y: 712, s: 0.4, xs: [140, 540, 940, 1340, 1740] }, { y: 860, s: 0.5, xs: [-10, 480, 960, 1440, 1930] }];
// seated kid on a desk: feet below the desk (hidden), belly at the desk top
const seatAt = (x, top, s) => ({ x, y: Math.round(top + 440 * s), s, desk: top });

// ================================================================= 3. GYM — dodgeball
// The gym seen across the court: back wall (pale-blue blocks over a teal wainscot), steel trusses + dome lamps, high
// windows with light beams, championship banners, the scoreboard (opts.scoreboard), a wall-mounted hoop (left), the
// climbing rope (right), pulled-out bleachers at the far left (SPOTS.gym.bleachers). The floor runs from y 680; the
// centre line is x 960 (centre circle with the comet). Dodgeball: the THROWERS team stands left of the line facing
// right (SPOTS.gym.throwers), YOUR team right of it (SPOTS.gym.team); the hero's dodge zone is SPOTS.gym.dodge. The ball
// bin on wheels (rig/extras ballBin) goes at SPOTS.gym.bin; Coach Dee at SPOTS.gym.coach. Stand line y 960.
// opts: { scoreboard: ['HOME', '03', 'GUEST', '05'] | 'TEXT', clock '2:45', slowmo 0..1 (blue bullet-time light),
//   rope (default true), balls (loose balls on the floor, default true), bleacherKids (cheap crowd, default true) }
def(`<pattern id="ssCinderB" width="120" height="60" patternUnits="userSpaceOnUse"><rect width="120" height="60" fill="#BFDDF0"/><rect x="2" y="2" width="116" height="26" rx="3" fill="#D8ECF8"/><rect x="-58" y="32" width="116" height="26" rx="3" fill="#D8ECF8"/><rect x="62" y="32" width="116" height="26" rx="3" fill="#D8ECF8"/></pattern>`);
def(`<pattern id="ssMaple" width="360" height="44" patternUnits="userSpaceOnUse"><rect width="360" height="44" fill="#F2C887"/><rect y="22" width="360" height="22" fill="#EEC07C"/><path d="M0 0.5 H360 M0 22 H360 M120 0 V22 M300 22 V44" stroke="#D9A45E" stroke-width="2"/></pattern>`);
def(`<pattern id="ssBleach" x="0" y="0" width="200" height="70" patternUnits="userSpaceOnUse"><rect width="200" height="70" fill="#7A5236"/><rect width="200" height="26" fill="#E8B87A"/><rect y="0" width="200" height="6" fill="#F6D7A6"/><path d="M0 26 H200" stroke="#151515" stroke-width="3"/><path d="M0 70 H200" stroke="#151515" stroke-width="2" opacity="0.5"/></pattern>`);
def(lg('ssSlowmo', [[0, '#0A1430', 0.55], [0.22, '#0A1430', 0], [0.78, '#0A1430', 0], [1, '#0A1430', 0.6]]));
// dodgeball prop (red rubber ball), centre (x, y), radius r
function dodgeball(x, y, r = 30, rot = 0) {
  return G(CI(0, 0, r, ol('#EE4B4B', Math.max(3, r * 0.14))) + P(`M${f(-r)} 0 Q0 ${f(r * 0.5)} ${f(r)} 0`, ln(Math.max(2, r * 0.08), '#B42E3A')) + E(-r * 0.32, -r * 0.36, r * 0.32, r * 0.18, { fill: '#FFFFFF', opacity: 0.55, transform: `rotate(-30 ${f(-r * 0.32)} ${f(-r * 0.36)})` }), tr(x, y, 1, rot));
}
function gymLayers(t, opts = {}) {
  const sm = bool01(opts.slowmo);
  let m = cover('url(#ssCinderB)');
  // ceiling: trusses + lamps
  m += band(YT, 70, '#3E5F78') + band(60, 78, '#2FB3B8');
  let tr_ = '';
  for (let x = -1100; x < 3100; x += 160) tr_ += `M${x} 70 L${x + 80} -60 L${x + 160} 70 `;
  m += P(`M${XL} -60 H${XR} ` + tr_, ln(7, '#2A475C'));
  for (const lx of [160, 640, 1120, 1600, 2080, -320]) m += P(`M${lx} -60 V12`, ln(4, '#2A475C')) + P(`M${lx - 50} 50 Q${lx} -4 ${lx + 50} 50 Z`, ol('#9AA8B8', 4)) + E(lx, 50, 40, 8, { fill: '#FFF8D8', stroke: LINE, 'stroke-width': 3 }) + softGlow(lx, 64, 120, 60, '#FFF8D8', 0.8);
  // high windows + beams
  for (let i = 0; i < 6; i++) { const wx = -160 + i * 420; m += R(wx, 120, 300, 96, 6, ol('#BFE8FF', 5)) + P(`M${wx + 100} 120 V216 M${wx + 200} 120 V216`, ln(6, '#FFFFFF')) + P(`M${wx + 20} 200 L${wx + 90} 130 L${wx + 110} 130 L${wx + 40} 200 Z`, { fill: '#FFFFFF', opacity: 0.4 }); }
  // wainscot + stripe
  m += band(470, 690, '#63C4C1') + band(458, 474, '#9AD94E') + band(474, 482, '#FFD23F') + P(`M${XL} 458 H${XR} M${XL} 482 H${XR}`, ln(3.5, LINE, 0.55));
  // banners (hanging)
  const banner = (x, w, h, col, l1, l2, txt = '#FFFFFF') => G(P(`M${-w / 2} 0 H${w / 2} V${h} L0 ${h + 40} L${-w / 2} ${h} Z`, ol(col, 5)) + R(-w / 2 + 8, 8, w - 16, 8, 3, { fill: '#FFFFFF', opacity: 0.3 }) + T(l1, 0, h * 0.42, Math.min(40, w * 0.22), txt, txt === '#FFFFFF' ? OUTX(5) : {}) + TF(l2, 0, h * 0.42 + 40, Math.min(22, w * 0.13), txt), `translate(${x} 78)`);
  m += banner(520, 180, 170, '#2FB3B8', 'CHAMPS', 'DODGEBALL 2023') + banner(760, 150, 140, '#FFD23F', 'STATE', 'FINALS', '#2A3A55') + banner(-120, 170, 160, '#8ED24E', 'COMETS', 'TRACK 2021');
  // big comet mural on the back wall (centre)
  m += comet(960, 330, 1.6, -6) + T('COMETS', 1120, 360, 84, '#FFFFFF', OUTX(9, '#1E7D86'));
  // scoreboard
  {
    let sb = R(-200, -96, 400, 192, 14, ol('#1B2030', 6)) + R(-186, -82, 372, 164, 8, { fill: '#0E1320' }) + R(-60, -112, 120, 24, 6, ol('#2FB3B8', 4)) + TF('COMETS', 0, -94, 16, '#FFFFFF');
    const v = opts.scoreboard;
    if (typeof v === 'string') sb += T(v, 0, 26, v.length > 9 ? 50 : 68, '#FFB23E');
    else {
      const [a, b, c, d] = v || ['HOME', '03', 'GUEST', '05'];
      sb += TF(a, -100, -46, 22, '#8EDB4F') + TF(c, 100, -46, 22, '#8EDB4F') + T(b, -100, 26, 72, '#FF4D3A') + T(d, 100, 26, 72, '#FF4D3A') + T(opts.clock || '2:45', 0, 66, 30, '#FFB23E') + P('M0 -66 V36', ln(3, '#2A3242'));
    }
    m += G(sb, 'translate(1560 300) scale(0.9)');
  }
  // wall hoop (left)
  m += P('M300 470 L300 380 M250 470 L300 400', ln(12, LINE)) + P('M300 470 L300 380 M250 470 L300 400', ln(6, '#9AA4B8')) + R(190, 250, 220, 140, 10, { fill: '#DDF4FF', stroke: LINE, 'stroke-width': 6, opacity: 0.85 }) + R(256, 300, 88, 62, 4, { fill: 'none', stroke: '#FFFFFF', 'stroke-width': 6 });
  m += R(292, 386, 16, 16, 3, ol('#9AA4B8', 3)) + E(300, 404, 52, 11, { fill: 'none', stroke: '#FF7A2E', 'stroke-width': 8 }) + P('M254 408 L268 460 L332 460 L346 408 M276 408 L286 460 M300 410 L300 460 M324 408 L314 460 M262 436 H338', ln(3, '#FFFFFF'));
  // climbing rope (right)
  if (opts.rope !== false) { const sw = Math.sin(t * 0.9) * 10; const rd = `M1880 -60 Q${1880 + sw * 0.5} 300 ${1880 + sw} 640`; m += P(rd, ln(18, LINE)) + P(rd, ln(10, '#E8C27A')) + P(rd, { fill: 'none', stroke: '#C9A060', 'stroke-width': 10, 'stroke-dasharray': '7 11' }) + E(1880 + sw, 646, 14, 20, ol('#E8C27A', 4)); }
  // bleachers (pulled out, far left)
  {
    const rows = 6;
    let bl = R(XL, 400, 700 - XL, 300, 0, { fill: '#4E3826' });
    for (let i = 0; i < rows; i++) {
      const y = 420 + i * 46, x1 = 520 + i * 26;
      bl += R(XL, y, x1 - XL, 46, 0, { fill: 'url(#ssBleach)', stroke: LINE, 'stroke-width': 3 });
    }
    bl += P('M560 400 L690 690 M420 400 L420 690', ln(12, LINE)) + P('M560 400 L690 690 M420 400 L420 690', ln(6, '#3FA9E0'));
    m += bl;
    if (opts.bleacherKids !== false) m += crowd([{ x0: -1000, x1: 420, y: 452, s: 0.17, seed: 2 }, { x0: -1000, x1: 360, y: 544, s: 0.19, seed: 5 }], { light: 1, t: 0 });
  }
  // floor
  m += band(680, YB, 'url(#ssMaple)') + band(676, 690, '#2A475C') + R(XL, 690, XR - XL, 50, 0, { fill: '#000', opacity: 0.07 });
  m += P('M-1100 760 Q960 700 3020 760', ln(30, '#FFFFFF', 0.18));
  // court lines: boundary, centre line + circle with the comet
  m += P(`M${XL} 720 H${XR}`, ln(8, '#FFFFFF', 0.9)) + P('M960 690 L960 2000', ln(9, '#FFFFFF', 0.95)) + E(960, 880, 300, 70, { fill: '#8EDB4F', opacity: 0.85, stroke: '#FFFFFF', 'stroke-width': 8 }) + G(comet(0, 0, 1.3), 'translate(960 880) scale(1 0.24)');
  m += P('M-200 690 Q-60 800 -200 1000 M2120 690 Q1980 800 2120 1000', ln(8, '#2FB3B8', 0.8)) + P('M300 690 L240 1100 M1620 690 L1680 1100', ln(6, '#FFFFFF', 0.5));
  if (opts.balls !== false) m += dodgeball(110, 712, 22) + dodgeball(160, 722, 24) + dodgeball(1790, 716, 22, 40) + dodgeball(2240, 740, 26);
  // light: beams from the windows, slow-mo
  let light = '';
  const beams = [[140, 120], [560, 120], [980, 120], [1400, 120]];
  for (const [bx, by] of beams) light += P(`M${bx} ${by + 96} L${bx + 300} ${by + 96} L${bx + 560} 1100 L${bx + 140} 1100 Z`, { fill: 'url(#ssBeam)', opacity: f(0.32 * (1 - sm * 0.6)) });
  let screen = '';
  if (sm > 0) {
    light += TINT('#4A6FB8', 0.26 * sm) + TINT('#9AA6B8', 0.14 * sm);
    screen += R(-60, -60, 2040, 1200, 0, { fill: 'url(#ssSlowmo)', opacity: f(sm) });
    let st = '';
    for (let i = 0; i < 9; i++) { const y = 140 + i * 105 + 30 * hash(i * 3.3), x = -200 + md(hash(i * 7.1) * 2400 + t * 60, 2400), w = 300 + 400 * hash(i * 1.7); st += `M${f(x)} ${f(y)} h${f(w)} `; }
    screen += P(st, ln(3, '#DDEEFF', 0.35 * sm));
  }
  return { bg: '', mid: m, front: '', fg: '', light, screen };
}
const gym = makeSet(gymLayers);

// ---------------------------------------------------------------- cheap crowd fill (heads + shoulders), bucketed by colour
// Sizes are in RIG units: a crowd member at s matches a rig character at s (head ~ 300*s wide). Every colour is one
// <path> per row, so a full house of ~150 people is a few hundred elements.
// rows: [{ x0, x1, y (shoulder line), s, seed, gaps: [[xa, xb]...], dx (seat spacing at s 1, default 360) }]
// opts: { light 0..1 (0 = dark silhouettes), lit '#hex' (warm wash on faces when dark), cheer 0..1 (arms up), gasp 0..1,
//   phones 0..1 (some raised phones), wave (cheer travels as a wave), t, dark '#hex' (silhouette colour), eyes (true) }
const CROWD_SKIN = ['#FFFFFF', '#F6D2B4', '#E2A97E', '#B97A50', '#7A4E32'];
const CROWD_HAIR = ['#3A2618', '#7A4A22', '#1E1A22', '#E8B04A', '#B85A2A', '#5A3A2A', '#8A8A92', '#2A2438'];
const CROWD_TOP = ['#FF6F91', '#3FA9E0', '#8ED24E', '#FFB43A', '#9B6BFF', '#2FB3B8', '#FF5A5A', '#F4F7FB', '#5A6CD8', '#FFD23F'];
function crowd(rows, opts = {}) {
  const lt = opts.light ?? 1, cheer = bool01(opts.cheer), gasp = bool01(opts.gasp), phones = bool01(opts.phones), t = opts.t || 0;
  const dark = opts.dark || '#2A1A40';
  let o = '';
  rows.forEach((row, ri) => {
    const s = row.s, dx = (row.dx || 360) * s, seed = row.seed ?? ri;
    const rl = row.light ?? lt;
    const B = { top: {}, skin: {}, hair: {}, arm: {}, eyes: '', pup: '', mouth: '', phone: '', screen: '' };
    const add = (bk, c, d) => { bk[c] = (bk[c] || '') + d; };
    let i = 0;
    const jit = row.jit ?? 0.22;
    for (let x = row.x0 + (row.off ?? hash(seed) * 0.5) * dx; x < row.x1; x += dx * (1 - jit * 0.4 + jit * hash(i * 1.3 + seed)), i++) {
      if ((row.gaps && row.gaps.some(([ga, gb]) => x > ga && x < gb)) || (row.cx0 !== undefined && x < row.cx0)) continue;
      const h = (k) => hash(i * k + seed * 13.1);
      const y = row.y + (h(2.7) - 0.5) * 24 * s;
      const top = mix(CROWD_TOP[Math.floor(h(3.1) * CROWD_TOP.length)], dark, 1 - rl), hair = mix(CROWD_HAIR[Math.floor(h(7.7) * CROWD_HAIR.length)], dark, (1 - rl) * 0.9);
      const skin = opts.back ? hair : mix(CROWD_SKIN[Math.floor(h(5.3) * CROWD_SKIN.length)], dark, (1 - rl) * 0.92);
      const wv = opts.wave ? clamp(Math.sin(t * 5 - x * 0.006) * 1.4, 0, 1) : 1;
      const up = cheer * wv * (h(9.1) < 0.82 ? 1 : 0);
      const bob = up > 0 ? Math.abs(Math.sin(t * 9 + i)) * 26 * s * up : 0;
      const hy = y - bob;                         // shoulder line of this person
      const tilt = gasp * 18 * s * (h(4.4) < 0.7 ? 1 : 0);
      const hw = 290 * s, hh = 290 * s, hx = x + (h(6.1) - 0.5) * 20 * s, hb = hy - 6 * s - tilt;   // head box bottom
      // arms up (cheer) — drawn first, behind the body
      if (up > 0) {
        const sw = Math.sin(t * 8 + i * 1.7) * 40 * s * up;
        const ad = `M${f(x - 100 * s)} ${f(hy + 40 * s)} L${f(x - 170 * s + sw)} ${f(hy - 330 * s * up)} M${f(x + 100 * s)} ${f(hy + 40 * s)} L${f(x + 170 * s + sw)} ${f(hy - 330 * s * up)} `;
        add(B.arm, top, ad);
        if (phones > 0 && h(11.3) < 0.4 * phones) { const px = x + 170 * s + sw, py = hy - 330 * s * up - 70 * s; B.phone += rrQ(px - 36 * s, py - 60 * s, 72 * s, 120 * s, 12 * s) + ' '; B.screen += rrQ(px - 26 * s, py - 50 * s, 52 * s, 96 * s, 8 * s) + ' '; }
      }
      add(B.top, top, rrQ(x - 125 * s, hy, 250 * s, 260 * s, 80 * s) + ' ');
      add(B.skin, skin, rrQ(hx - hw / 2, hb - hh, hw, hh, 70 * s) + ' ');
      const hk = Math.floor(h(13.7) * 4), ht = hb - hh;
      if (hk === 0) add(B.hair, hair, `M${f(hx - hw / 2 - 12 * s)} ${f(ht + 120 * s)} Q${f(hx - hw / 2 - 10 * s)} ${f(ht - 50 * s)} ${f(hx)} ${f(ht - 52 * s)} Q${f(hx + hw / 2 + 10 * s)} ${f(ht - 50 * s)} ${f(hx + hw / 2 + 12 * s)} ${f(ht + 120 * s)} L${f(hx + hw * 0.3)} ${f(ht + 70 * s)} L${f(hx)} ${f(ht + 96 * s)} L${f(hx - hw * 0.3)} ${f(ht + 70 * s)} Z `);
      else if (hk === 1) add(B.hair, hair, rrQ(hx - hw / 2 - 10 * s, ht - 40 * s, hw + 20 * s, 100 * s, 40 * s) + ` ${((cx, cy, r) => elQ(cx, cy, r, r))(hx + hw * 0.42, ht + 10 * s, 56 * s)} `);
      else if (hk === 2) add(B.hair, hair, `M${f(hx - hw / 2 - 16 * s)} ${f(hb - 20 * s)} L${f(hx - hw / 2 - 16 * s)} ${f(ht + 20 * s)} Q${f(hx)} ${f(ht - 90 * s)} ${f(hx + hw / 2 + 16 * s)} ${f(ht + 20 * s)} L${f(hx + hw / 2 + 16 * s)} ${f(hb - 40 * s)} L${f(hx + hw / 2 - 20 * s)} ${f(ht + 60 * s)} Q${f(hx)} ${f(ht + 40 * s)} ${f(hx - hw / 2 + 20 * s)} ${f(ht + 60 * s)} Z `);
      else add(B.hair, hair, `M${f(hx - hw / 2 - 6 * s)} ${f(ht + 50 * s)} Q${f(hx - hw / 2)} ${f(ht - 30 * s)} ${f(hx)} ${f(ht - 30 * s)} Q${f(hx + hw / 2)} ${f(ht - 30 * s)} ${f(hx + hw / 2 + 6 * s)} ${f(ht + 50 * s)} Q${f(hx)} ${f(ht + 20 * s)} ${f(hx - hw / 2 - 6 * s)} ${f(ht + 50 * s)} Z `);
      if (rl > 0.3 && opts.eyes !== false && !opts.back && s > 0.06) {
        const ey = hb - hh * 0.42, ex = 58 * s, er = 34 * s * (1 + gasp * 0.25);
        const look = (h(8.8) - 0.5) * 10 * s;
        B.eyes += elQ(hx - ex, ey, er * 0.86, er) + ' ' + elQ(hx + ex, ey, er * 0.86, er) + ' ';
        B.pup += elQ(hx - ex + look, ey + 4 * s, er * 0.42, er * 0.5) + ' ' + elQ(hx + ex + look, ey + 4 * s, er * 0.42, er * 0.5) + ' ';
        if (gasp > 0.3) B.mouth += elQ(hx, ey + 76 * s, 20 * s * gasp, 28 * s * gasp) + ' ';
        else if (up > 0.3) B.mouth += `M${f(hx - 36 * s)} ${f(ey + 56 * s)} Q${f(hx)} ${f(ey + 110 * s)} ${f(hx + 36 * s)} ${f(ey + 56 * s)} Z `;
        else if (h(15.1) < 0.6) B.mouth += `M${f(hx - 26 * s)} ${f(ey + 64 * s)} Q${f(hx)} ${f(ey + 84 * s)} ${f(hx + 26 * s)} ${f(ey + 64 * s)} `;
      }
    }
    // far rows (small s): fills only, pupils only — strokes on hundreds of tiny shapes are the expensive part
    const outl = row.outline ?? (s >= 0.19), sw = Math.max(1.5, 14 * s);
    const fillA = (c, w) => (outl ? ol(c, w) : { fill: c });
    for (const [c, d] of Object.entries(B.arm)) o += (outl ? P(d, ln(84 * s + sw * 2, LINE)) : '') + P(d, ln(84 * s, c));
    for (const [c, d] of Object.entries(B.top)) o += P(d, fillA(c, sw));
    for (const [c, d] of Object.entries(B.skin)) o += P(d, fillA(c, sw));
    for (const [c, d] of Object.entries(B.hair)) o += P(d, fillA(c, sw));
    if (B.eyes) o += (outl ? P(B.eyes, s >= 0.3 ? ol(mix('#FFFFFF', dark, (1 - rl) * 0.8), Math.max(1, sw * 0.6)) : { fill: mix('#FFFFFF', dark, (1 - rl) * 0.8) }) : '') + P(B.pup, { fill: LINE });
    if (B.mouth && outl) o += P(B.mouth, s >= 0.3 ? { fill: '#6A1A2A', stroke: LINE, 'stroke-width': f(Math.max(1, sw * 0.5)), 'stroke-linejoin': 'round' } : { fill: '#6A1A2A' });
    if (B.phone) o += P(B.phone, fillA('#2A2E3A', Math.max(1.5, 8 * s))) + P(B.screen, { fill: '#BFF4FF' });
    if (opts.lit && rl < 1) o += P(Object.values(B.skin).join(' '), { fill: opts.lit, opacity: f(0.45 * (1 - rl)) });
  });
  return o;
}

// ================================================================= 4. CAFETERIA
// Back wall: sunny yellow over a white/teal tiled wainscot, big windows (right) with the yard, the "PIZZA DAY" menu
// board above the LUNCH LINE (left): steel counter + sneeze guard + food pans; the lunch lady stands behind it
// (SPOTS.cafeteria.lunchLady; the counter front is layers.frontRows[0]). Kids in line stand on SPOTS.cafeteria.line.
// Right: two long lunch tables (frontRows[1] back table, frontRows[2] front table); seated kids on SPOTS.cafeteria.seats
// (back / front), YOUR seat = SPOTS.cafeteria.heroSeat; the joke "stage" = SPOTS.cafeteria.stage (standing up at the seat).
// The walking lane is the stand line y 960 (FLOOR): the principal's path SPOTS.cafeteria.path (right -> left), the
// puddle (opts.puddle 0..1: spilt milk/sauce) + the wet-floor sign at SPOTS.cafeteria.puddle.
// opts: { menu: ['PIZZA DAY!', ...], puddle (default 1), sign (default true), trays (on the tables, default true),
//   steam (default true), time }
def(`<pattern id="ssCafTile" width="60" height="60" patternUnits="userSpaceOnUse"><rect width="60" height="60" fill="#D7EEF0"/><rect x="2" y="2" width="56" height="56" rx="6" fill="#F6FBFB"/></pattern>`);
def(`<pattern id="ssCafFloor" width="140" height="70" patternUnits="userSpaceOnUse"><rect width="140" height="70" fill="#F4ECDA"/><rect width="70" height="35" fill="#BDE7D9"/><rect x="70" y="35" width="70" height="35" fill="#BDE7D9"/></pattern>`);
def(lg('ssSteel', [[0, '#F2F5FA'], [0.5, '#C9D1DE'], [1, '#A3ADBF']]));
def(lg('ssCafWall', [[0, '#FFF1BE'], [1, '#FFE49A']]));
function lunchTable(x0, x1, top, k, opts = {}) {
  const c = opts.col || '#FF9F43', bc = opts.bench || '#2FB3B8', ed = mix(c, '#5A2A10', 0.3);
  // shadow under the table (hides the seated kids' legs) + far bench hint
  let o = R(x0 + 24 * k, top + 20 * k, x1 - x0 - 48 * k, 180 * k, 0, { fill: '#2A2440', opacity: 0.5 });
  let lg_ = '';
  for (const lx of [x0 + 90 * k, x1 - 90 * k]) lg_ += `M${lx} ${top + 26 * k} L${lx - 40 * k} ${top + 200 * k} M${lx} ${top + 26 * k} L${lx + 40 * k} ${top + 200 * k} `;
  o += P(lg_, ln(12 * k, LINE)) + P(lg_, ln(6 * k, '#8A96A8'));
  // top surface + front edge
  o += R(x0, top - 44 * k, x1 - x0, 46 * k, 12 * k, ol(mix(c, '#FFFFFF', 0.25), 5)) + R(x0, top, x1 - x0, 24 * k, 8 * k, ol(ed, 5)) + P(`M${x0 + 16} ${f(top - 34 * k)} H${x1 - 16}`, ln(4, '#FFFFFF', 0.5));
  // near bench (empty, toward the camera)
  o += R(x0 + 40 * k, top + 118 * k, x1 - x0 - 80 * k, 26 * k, 9 * k, ol(bc, 5)) + R(x0 + 40 * k, top + 144 * k, x1 - x0 - 80 * k, 12 * k, 4, { fill: mix(bc, '#000000', 0.3) });
  return o;
}
function tray(x, y, s = 1, opts = {}) {
  let o = R(-120, -50, 240, 100, 16, ol(opts.col || '#5AC8E8', 5)) + R(-108, -38, 110, 76, 10, { fill: '#41B2D6' }) + R(14, -38, 94, 34, 8, { fill: '#41B2D6' }) + R(14, 4, 94, 34, 8, { fill: '#41B2D6' });
  if (opts.food !== false) {
    o += P('M-96 26 L-18 -30 L-22 30 Z', ol('#FFD86A', 3)) + P('M-96 26 L-18 -30 L-12 -22 L-90 32 Z', { fill: '#E8A24A' }) + CI(-48, 4, 7, { fill: '#E84A4A' }) + CI(-34, 16, 6, { fill: '#E84A4A' });
    o += P(`${circD(40, -22, 9)} ${circD(60, -18, 9)} ${circD(80, -24, 9)}`, ol('#6CC24A', 2.5)) + R(34, 10, 30, 28, 4, ol('#FFFFFF', 2.5)) + R(34, 18, 30, 8, 0, { fill: '#3FA9E0' }) + CI(88, 22, 13, ol('#FF6F91', 2.5));
  }
  return G(o, tr(x, y, s, opts.rot || 0));
}
// spaghetti plate / spill props
function spaghetti(x, y, s = 1, opts = {}) {
  let o = E(0, 0, 90, 26, ol('#FFFFFF', 4)) + P('M-60 -6 Q-40 -46 0 -44 Q44 -46 62 -8 Q20 6 -60 -6 Z', ol('#FFD98A', 3.5));
  o += P('M-44 -14 Q-20 -40 6 -16 Q30 -40 46 -14 M-30 -24 Q0 -10 30 -26', ln(3, '#E8B64A')) + P(`${circD(-12, -34, 10)} ${circD(16, -30, 11)}`, ol('#C8402E', 3)) + P('M-40 -30 Q0 -60 30 -38', ln(9, '#E8462E', 0.85));
  return G(o, tr(x, y, s, opts.rot || 0));
}
function cafeteriaLayers(t, opts = {}) {
  const pud = opts.puddle === undefined ? 1 : bool01(opts.puddle);
  let bg = R(-200, -400, 2600, 1100, 0, { fill: 'url(#ssSkyDay)' }) + cloud(1300, 210, 0.6) + cloud(1720, 280, 0.45);
  bg += P('M600 420 Q1100 330 1500 390 Q1800 430 2300 360 L2300 900 L600 900 Z', { fill: '#9CD6B4' }) + schoolTree(1280, 520, 0.8, {}) + schoolTree(1820, 520, 0.7, { kind: 'pine', col: '#3AA85A' });
  bg += R(600, 460, 1800, 400, 0, { fill: '#B5BECA' }) + R(600, 452, 1800, 12, 0, { fill: '#78C85A' }) + grindRail(1450, 470, 260, 50) + R(1000, 410, 120, 50, 0, { fill: '#8B66F0' });
  let m = P(`M${XL} ${YT} H${XR} V610 H${XL} Z M1040 130 V440 H1880 V130 Z`, { fill: 'url(#ssCafWall)', 'fill-rule': 'evenodd' });
  m += band(YT, 30, '#F4FAFB') + band(26, 38, '#FF9F43');
  // windows
  m += P('M1020 110 H1900 V460 H1020 Z M1040 130 V440 H1880 V130 Z', { fill: '#FFFFFF', 'fill-rule': 'evenodd', stroke: LINE, 'stroke-width': 6 }) + P('M1250 130 V440 M1460 130 V440 M1670 130 V440', ln(14, '#FFFFFF')) + P('M1250 130 V440 M1460 130 V440 M1670 130 V440', ln(3, LINE, 0.3));
  m += P('M1070 420 L1150 150 L1180 150 L1100 420 Z M1500 420 L1570 170 L1590 170 L1520 420 Z', { fill: '#FFFFFF', opacity: 0.25 });
  // bunting + clock + posters
  m += bunting(1040, 1880, 96, 22, 11, ['#FF6F91', '#FFD23F', '#3FA9E0', '#8ED24E', '#9B6BFF'], 0.6);
  m += wallClock(950, 200, 50, opts.clock ?? '12:10', { t, rim: '#FF9F43' });
  m += schoolPoster(['EAT', 'YOUR', 'COLORS'], 1980, 260, { w: 160, h: 170, col: '#8ED24E', size: 34, rot: 3 }) + schoolPoster(['MILK', 'CLUB'], -60, 280, { w: 160, h: 120, col: '#FFFFFF', size: 36, ink: '#3FA9E0', rot: -3 });
  // tiled wainscot
  m += band(470, 610, 'url(#ssCafTile)') + band(458, 474, '#2FB3B8') + P(`M${XL} 458 H${XR} M${XL} 474 H${XR}`, ln(3.5, LINE, 0.55));
  // PIZZA DAY menu board over the lunch line
  {
    const menu = opts.menu || ['PIZZA DAY!', 'PEPPERONI · CHEESE', 'SALAD BAR · FRUIT CUP', 'MILK · JUICE'];
    let mb = R(-380, -150, 760, 300, 18, ol('#2A2E3A', 7)) + R(-366, -136, 732, 272, 12, { fill: '#1E2430' });
    mb += R(-366, -136, 732, 92, 12, { fill: '#E8462E' }) + R(-366, -60, 732, 16, 0, { fill: '#E8462E' }) + P(Array.from({ length: 12 }, (_, i) => `M${-366 + i * 61} -44 l30 -16 l31 16`).join(' '), ol('#FFD23F', 0));
    mb += T(menu[0], 40, -66, 72, '#FFD23F', OUTX(8));
    mb += G(P('M-40 -40 L40 -40 L0 50 Z', ol('#FFD86A', 4)) + P('M-40 -40 L40 -40 L36 -28 L-36 -28 Z', ol('#E8A24A', 3)) + CI(-8, -12, 8, { fill: '#E84A4A' }) + CI(10, 6, 7, { fill: '#E84A4A' }) + CI(-2, 26, 5, { fill: '#E84A4A' }), 'translate(-280 -80) rotate(-16)');
    menu.slice(1).forEach((l, i) => { mb += TF(l, 0, 6 + i * 46, 34, i === 0 ? '#FFFFFF' : '#BFF4FF'); });
    mb += TF('$2.75', 300, 118, 26, '#8EDB4F');
    m += G(mb, 'translate(400 260)');
  }
  // kitchen pass-through behind the counter
  m += R(-460, 440, 1300, 150, 0, { fill: '#E9EEF5', stroke: LINE, 'stroke-width': 5 }) + R(-440, 460, 1260, 110, 6, { fill: '#3A4250' }) + R(-400, 486, 180, 60, 6, ol('#C9D1DE', 3)) + E(560, 540, 90, 26, ol('#A3ADBF', 3)) + R(200, 470, 120, 90, 8, ol('#D9E0EA', 3));
  // floor
  m += band(610, YB, 'url(#ssCafFloor)') + band(604, 616, '#2FB3B8') + R(XL, 616, XR - XL, 40, 0, { fill: '#000', opacity: 0.06 });
  // puddle + wet floor sign (on the lane)
  if (pud > 0) m += G(P('M-150 0 Q-140 -30 -60 -34 Q0 -50 70 -30 Q150 -26 140 6 Q120 34 20 30 Q-60 40 -120 26 Q-170 18 -150 0 Z', { fill: '#E8F6FF', stroke: '#9FD4F0', 'stroke-width': 5, opacity: 0.9 }) + P('M-70 -12 Q-20 -24 30 -14', ln(6, '#FFFFFF', 0.9)), tr(860, 968, pud));
  if (opts.sign !== false) m += wetFloorSign(650, 940, 1);
  // trash + tray return (between the line and the tables)
  m += trashCan(990, 690, 0.62, { lid: 'on', col: '#3FA9E0' }) + G(R(-26, -10, 52, 10, 3, ol('#FFFFFF', 2)) + TF('THANKS!', 0, -2, 7, '#3FA9E0'), 'translate(990 640) scale(1.6)');
  // ---- front rows
  const CT = 610;
  let counter = '';
  const pans = [['#FFD86A', 'pizza'], ['#6CC24A', 'salad'], ['#FF6F91', 'fruit'], ['#FFD86A', 'pizza'], ['#E8462E', 'sauce']];
  pans.forEach(([c, k], i) => {
    const px = -380 + i * 230, py = CT - 30;
    counter += R(px, py, 190, 34, 6, ol('#C9D1DE', 4));
    if (k === 'pizza') counter += P(`M${px + 14} ${py + 8} L${px + 90} ${py - 26} L${px + 96} ${py + 8} Z M${px + 96} ${py + 8} L${px + 170} ${py - 26} L${px + 176} ${py + 8} Z`, ol(c, 3)) + CI(px + 70, py - 4, 6, { fill: '#E84A4A' }) + CI(px + 150, py - 4, 6, { fill: '#E84A4A' });
    else counter += P(`M${px + 12} ${py + 6} Q${px + 95} ${py - 30} ${px + 178} ${py + 6} Z`, ol(c, 3));
    if (opts.steam !== false) { const ph = md(t * 0.6 + i * 0.3, 1); counter += P(`M${px + 95} ${py - 26} q${f(-10 + ph * 20)} -30 0 ${f(-40 - ph * 40)}`, ln(5, '#FFFFFF', f(0.5 * (1 - ph)))); }
  });
  counter += R(-460, CT, 1300, 24, 6, ol('url(#ssSteel)', 5)) + R(-470, CT + 22, 1320, 130, 4, ol('#9FB3CC', 6)) + R(-470, CT + 22, 1320, 130, 4, { fill: 'url(#ssSteel)', opacity: 0.5 });
  for (let i = 0; i < 6; i++) counter += R(-440 + i * 210, CT + 60, 180, 80, 8, { fill: 'none', stroke: '#8296B4', 'stroke-width': 4 });
  counter += R(-480, CT + 34, 1340, 22, 6, ol('#C9D1DE', 4)) + P(`M-470 ${CT + 44} H850`, ln(3, '#FFFFFF', 0.7));
  counter += P(`M-420 ${CT - 8} L-400 ${CT - 120} L780 ${CT - 120} L800 ${CT - 8} Z`, { fill: '#DDF4FF', opacity: 0.3, stroke: LINE, 'stroke-width': 4 }) + P(`M-360 ${CT - 26} L-344 ${CT - 104} M300 ${CT - 26} L314 ${CT - 104}`, ln(5, '#FFFFFF', 0.6));
  counter += G(R(-60, -120, 120, 120, 10, ol('#FFFFFF', 4)) + R(-48, -108, 96, 70, 6, { fill: '#BFF4FF' }) + TF('MILK', 0, -64, 22, '#3FA9E0') + R(-44, -32, 24, 28, 3, ol('#FFFFFF', 2)) + R(-12, -32, 24, 28, 3, ol('#FF9EC4', 2)) + R(20, -32, 24, 28, 3, ol('#FFFFFF', 2)), `translate(${780} ${CT})`);
  const BT = 700, FT = 820;   // back / front table tops
  let backT = lunchTable(1080, 2900, BT, 0.72, { col: '#FFB43A', bench: '#3FA9E0' });
  let frontT = lunchTable(1180, 3020, FT, 0.92, { col: '#FF9F43', bench: '#2FB3B8' });
  if (opts.trays !== false) {
    [1240, 1560, 1880, 2200].forEach((x, i) => { backT += G(tray(0, 0, 0.42, { food: true }), `translate(${x + 60} ${BT - 16}) scale(1 0.42)`); });
    [1330, 1720, 2060, 2420].forEach((x, i) => { frontT += G(tray(0, 0, 0.52, { food: i !== 1 }), `translate(${x + (i % 2 ? -90 : 90)} ${FT - 20}) scale(1 0.42)`); });
  }
  let light = TINT('#FFF2C0', 0.05) + P('M1040 130 L1880 130 L2300 1200 L1400 1200 Z', { fill: 'url(#ssBeam)', opacity: 0.22 });
  return { bg, mid: m, front: counter + backT + frontT, fg: '', light, frontRows: [counter, backT, frontT] };
}
const cafeteria = makeSet(cafeteriaLayers);

// ================================================================= 5. TEACHERS' LOUNGE — Mr. Fig's birthday
// Cosy staff room: striped wallpaper, a window with blinds (left), "HAPPY BIRTHDAY MR. FIG" banner + balloons, a
// kitchenette (right): coffee machine, mugs, microwave, a staff fridge with notes; an OUT OF ORDER copier; a corkboard.
// The TABLE (centre, tablecloth) is layers.front: seated teachers on SPOTS.lounge.seats (behind it); the birthday cake
// (rig/extras birthdayCake) stands on SPOTS.lounge.cake. Standing spots at the table ends + the coffee machine.
// opts: { banner (text), balloons (default true), steam (default true), frozen 0..1 (balloons stop + cool tint), time }
def(`<pattern id="ssStripe" width="80" height="80" patternUnits="userSpaceOnUse"><rect width="80" height="80" fill="#FFE8D2"/><rect width="34" height="80" fill="#FFDCC0"/><circle cx="57" cy="20" r="4" fill="#FFC9A6"/><circle cx="57" cy="60" r="4" fill="#FFC9A6"/></pattern>`);
def(`<pattern id="ssCarpet" width="70" height="70" patternUnits="userSpaceOnUse"><rect width="70" height="70" fill="#7C8FC8"/><circle cx="14" cy="16" r="3" fill="#8FA1D6"/><circle cx="48" cy="40" r="3" fill="#6E80B8"/><circle cx="28" cy="58" r="2.5" fill="#8FA1D6"/></pattern>`);
function balloon(x, y, r, col, t, ph = 0, amp = 1) {
  const sw = Math.sin(t * 1.4 + ph) * 6 * amp, bx = x + sw, by = y + Math.sin(t * 1.1 + ph) * 4 * amp;
  return P(`M${f(bx)} ${f(by + r * 1.15)} Q${f(bx + 16)} ${f(by + r * 2)} ${f(x)} ${f(by + r * 3.6)}`, ln(2.5, '#5A5048')) + P(`M${f(bx)} ${f(by - r)} C${f(bx + r * 1.3)} ${f(by - r)} ${f(bx + r * 1.2)} ${f(by + r * 0.9)} ${f(bx)} ${f(by + r * 1.12)} C${f(bx - r * 1.2)} ${f(by + r * 0.9)} ${f(bx - r * 1.3)} ${f(by - r)} ${f(bx)} ${f(by - r)} Z`, ol(col, 4)) +
    P(`M${f(bx - 6)} ${f(by + r * 1.1)} L${f(bx + 6)} ${f(by + r * 1.1)} L${f(bx)} ${f(by + r * 1.28)} Z`, ol(col, 3)) + E(bx - r * 0.38, by - r * 0.4, r * 0.18, r * 0.3, { fill: '#FFFFFF', opacity: 0.6, transform: `rotate(25 ${f(bx - r * 0.38)} ${f(by - r * 0.4)})` });
}
function loungeLayers(t, opts = {}) {
  const fz = bool01(opts.frozen), amp = 1 - fz;
  let bg = R(-300, -300, 1100, 1200, 0, { fill: 'url(#ssSkyDay)' }) + cloud(260, 260, 0.5) + schoolTree(300, 620, 0.8, {}) + R(-300, 600, 1100, 300, 0, { fill: '#78C85A' });
  let m = P(`M${XL} ${YT} H${XR} V640 H${XL} Z M110 170 V500 H490 V170 Z`, { fill: 'url(#ssStripe)', 'fill-rule': 'evenodd' });
  m += band(YT, 40, '#FFF6EA') + band(36, 48, '#E8704A');
  m += band(500, 640, '#E8A27A') + band(490, 504, '#FFFFFF') + P(`M${XL} 490 H${XR} M${XL} 504 H${XR}`, ln(3.5, LINE, 0.5));
  // window with blinds (half up)
  m += P('M90 150 H510 V520 H90 Z M110 170 V500 H490 V170 Z', { fill: '#FFFFFF', 'fill-rule': 'evenodd', stroke: LINE, 'stroke-width': 6 });
  let bl = '';
  for (let y = 178; y < 330; y += 20) bl += `M110 ${y} H490 `;
  m += P(bl, ln(10, '#F4F1E6')) + P(bl, ln(2, '#C9C2AC')) + R(100, 330, 400, 14, 4, ol('#F4F1E6', 3)) + R(80, 514, 440, 18, 5, ol('#FFFFFF', 4));
  m += G(R(-30, -50, 60, 50, 6, ol('#2FB3B8', 4)) + P('M0 -50 Q-40 -110 -70 -100 M0 -50 Q10 -120 40 -130 M0 -50 Q40 -90 70 -80', ln(10, '#4CB65A')), 'translate(400 514)');
  // banner + bunting + balloons
  const btxt = opts.banner || 'HAPPY BIRTHDAY MR. FIG';
  m += P('M600 120 Q1100 190 1600 120', ln(4, '#5A5048'));
  {
    const letters = btxt.split('');
    const n = letters.length, cols = ['#FF6F91', '#FFD23F', '#3FA9E0', '#8ED24E', '#9B6BFF', '#FF9F43'];
    let bn = '';
    letters.forEach((ch, i) => {
      if (ch === ' ') return;
      const u = (i + 0.5) / n, x = lerp(610, 1590, u), y = 120 + 4 * 70 * u * (1 - u) * 0.95;
      bn += G(P('M-24 0 H24 V54 L0 70 L-24 54 Z', ol(cols[i % cols.length], 4)) + T(ch, 0, 42, 34, '#FFFFFF', OUTX(5)), tr(x, y, 1, (u - 0.5) * -14));
    });
    m += bn;
  }
  // corkboard + copier
  m += R(640, 300, 340, 180, 8, ol('#9A6238', 6)) + R(652, 312, 316, 156, 3, { fill: 'url(#ssCork)' });
  m += schoolPoster(['STAFF', 'MEETING', 'THURS'], 720, 390, { w: 110, h: 110, col: '#FFFFFF', size: 22, tape: false }) + schoolPoster(['WHO TOOK', 'MY', 'YOGURT?'], 880, 384, { w: 130, h: 110, col: '#FFE45C', size: 20, rot: 4, tape: false });
  m += G(R(-140, -170, 280, 170, 10, ol('#D9E0EA', 6)) + R(-150, -200, 300, 40, 8, ol('#C9D1DE', 5)) + R(-110, -140, 120, 60, 6, ol('#A3ADBF', 4)) + R(40, -140, 70, 30, 4, ol('#2A3242', 3)) + CI(60, -96, 8, { fill: '#E8462E' }) + R(-120, -40, 240, 26, 4, ol('#FFFFFF', 3)) +
    G(R(-60, -26, 120, 52, 4, ol('#FFFFFF', 3)) + TF('OUT OF', 0, -4, 18, '#E8462E') + TF('ORDER', 0, 18, 18, '#E8462E'), 'translate(0 -110) rotate(-6)'), 'translate(1120 640)');
  // kitchenette (right): cabinets, counter, coffee machine, mugs, microwave, fridge
  m += R(1340, 250, 520, 130, 8, ol('#FFFFFF', 5)) + P('M1600 250 V380', ln(4)) + CI(1580, 330, 7, ol('#FFD23F', 3)) + CI(1620, 330, 7, ol('#FFD23F', 3));
  m += R(1330, 520, 560, 30, 6, ol('#E8E0D0', 5)) + R(1340, 550, 540, 90, 6, ol('#FFFFFF', 5)) + P('M1520 550 V640 M1700 550 V640', ln(4));
  m += G(R(-70, -190, 140, 190, 14, ol('#3A4250', 6)) + R(-56, -176, 112, 60, 8, { fill: '#1E2430' }) + CI(-30, -146, 9, { fill: '#8EDB4F' }) + TF('COFFEE', 20, -140, 16, '#FFD23F') + R(-34, -96, 68, 40, 6, ol('#C9D1DE', 3)) + R(-50, -30, 100, 18, 4, ol('#5A6070', 3)) +
    G(R(-18, -30, 36, 30, 6, ol('#FFFFFF', 3)) + P('M18 -24 Q30 -20 18 -8', ln(3)), 'translate(0 -18)'), 'translate(1420 520)');
  if (opts.steam !== false) { for (let i = 0; i < 2; i++) { const ph = md(t * 0.5 + i * 0.5, 1); m += P(`M${1414 + i * 12} 462 q${f(-8 + 16 * ph)} -24 0 ${f(-30 - ph * 30)}`, ln(5, '#FFFFFF', f(0.7 * (1 - ph) * amp + 0.2))); } }
  m += P('M1520 470 H1640', ln(5, '#8A5530')) + [1536, 1570, 1604].map((x, i) => G(R(-14, -26, 28, 26, 5, ol(['#FF6F91', '#3FA9E0', '#FFD23F'][i], 3)) + P('M14 -20 Q24 -16 14 -6', ln(3)), `translate(${x} 494)`)).join('');
  m += G(R(-90, -80, 180, 80, 8, ol('#E9EEF5', 5)) + R(-76, -68, 110, 56, 4, { fill: '#2A3242' }) + R(50, -66, 26, 50, 4, ol('#C9D1DE', 2.5)), 'translate(1760 520)');
  m += R(1900, 200, 260, 440, 14, ol('#F4F7FB', 6)) + P('M1900 360 H2160', ln(5)) + R(1916, 300, 14, 50, 5, ol('#C9D1DE', 3)) + R(1916, 380, 14, 70, 5, ol('#C9D1DE', 3));
  m += [[1990, 260, '#FFE45C', -6], [2060, 290, '#FF9EC4', 5], [2010, 420, '#9FE0FF', 3], [2090, 470, '#FFE45C', -4]].map(([x, y, c, r]) => G(R(-26, -26, 52, 52, 3, ol(c, 3)) + P('M-14 -6 H14 M-14 6 H8', ln(3, '#5A4A3A')), tr(x, y, 1, r))).join('');
  // floor (carpet) + chairs behind the table
  m += band(640, YB, 'url(#ssCarpet)') + band(634, 646, '#5A6CA8') + R(XL, 646, XR - XL, 40, 0, { fill: '#000', opacity: 0.08 });
  for (const [x, c] of [[640, '#E8704A'], [1280, '#9B6BFF']]) m += R(x - 80, 560, 160, 190, 30, ol(c, 5)) + R(x - 66, 574, 132, 36, 16, { fill: '#FFFFFF', opacity: 0.25 });
  // balloons
  if (opts.balloons !== false) {
    m += balloon(560, 230, 44, '#FF6F91', t, 0, amp) + balloon(620, 290, 38, '#FFD23F', t, 1.3, amp) + balloon(520, 320, 36, '#3FA9E0', t, 2.1, amp);
    m += balloon(1640, 220, 44, '#8ED24E', t, 0.7, amp) + balloon(1700, 290, 38, '#9B6BFF', t, 1.9, amp) + balloon(1590, 310, 34, '#FF9F43', t, 2.7, amp);
  }
  // front: the table with a tablecloth
  let fr = R(520, 880, 880, 130, 0, { fill: '#2A2440', opacity: 0.5 });
  fr += P('M600 870 L590 1010 M1320 870 L1330 1010', ln(14, LINE)) + P('M600 870 L590 1010 M1320 870 L1330 1010', ln(7, '#8A5530'));
  fr += R(500, 712, 920, 40, 10, ol('#C98A52', 5)) + P('M490 740 H1430 L1450 920 Q1300 900 1180 930 Q1040 906 960 932 Q860 906 740 930 Q620 904 470 920 Z', ol('#FFFFFF', 5));
  fr += P('M540 750 Q560 840 520 914 M760 750 Q780 860 740 926 M1180 750 Q1200 860 1160 926 M1380 750 Q1400 840 1420 914', ln(4, '#DCE6EE')) + R(490, 736, 940, 26, 6, ol('#FF6F91', 4)) + P(Array.from({ length: 16 }, (_, i) => `M${500 + i * 58} 762 l29 22 l29 -22`).join(' '), ol('#FF6F91', 3));
  fr += G(R(-40, -10, 80, 12, 4, ol('#FFFFFF', 3)) + P('M-20 -10 L-26 -40 M0 -10 L0 -46 M20 -10 L26 -40', ln(4, '#FFD23F')), 'translate(620 724)') + G(R(-30, -24, 60, 24, 6, ol('#FF6F91', 3)) + P('M30 -18 Q40 -14 30 -6', ln(3)), 'translate(1330 726)') + G(R(-50, -8, 100, 10, 3, ol('#FFFFFF', 3)) + R(-40, -16, 80, 10, 3, ol('#9FE0FF', 3)), 'translate(1180 726)');
  let light = TINT('#FFD9A8', 0.06);
  if (fz > 0) light += TINT('#B8CCE4', 0.24 * fz) + TINT('#8A929C', 0.12 * fz);
  return { bg, mid: m, front: fr, fg: '', light };
}
const lounge = makeSet(loungeLayers);

// ================================================================= 6. AUDITORIUM — the TALENT SHOW
// Purple house, gold proscenium, crimson curtains, warm stage light. opts.view:
//  'stage' (default): from the audience. Proscenium opening x 220..1700 / y 120..800; "TALENT SHOW" marquee banner;
//    starry cyclorama with bulb strings; wooden stage floor y 600..800 (performers stand on FLOOR.auditorium = 770, s .45);
//    the mic stand (SPOTS.auditorium.stage.mic; it is layers.front: draw whoever speaks into it BEFORE front) and its
//    cable snaking to the left wing on the floor (SPOTS...cable = the trip point). opts.mic: x | false (use extras.micStand).
//    Spotlight cones (opts.spots [{x, y, w}] = pool centre on the floor + pool width; default one centre spot; [] = none).
//    Foreground = layers.fg: the first rows of audience heads as dark silhouettes (cheer: arms up). opts.curtain 0..1
//    (1 = open, 0 = closed), opts.confetti 0..1 (falling paper, layer light).
//  'house': from the stage. Raked rows of a full house (cheap crowd fill) under a balcony + projection booth beam;
//    the FAMILY sits in the front row gap: SPOTS.auditorium.house.dad / mom / bea (Bea stands on her seat). Draw them
//    between mid and fg; fg = the stage lip + footlights (hides their legs). opts.cheer, gasp, phones, wave.
//  'wings': backstage, stage left: dark, fly-rail ropes + sandbags, road cases, the stage manager's desk, a QUIET sign;
//    the crimson curtain edge with a sliver of bright stage (SPOTS.auditorium.wings.gap) spilling warm light onto the
//    hero/Ivy spots. Stand line y 960.
// opts.lights 0..1 = HOUSE lights (1 = house lit, before the show; 0 = show: house dark, stage bright). Default 1.
def(lg('ssCyc', [[0, '#1E1250'], [0.55, '#46289A'], [1, '#7C52D8']]));
def(lg('ssSpotCone', [[0, '#FFF6D8', 0.03], [1, '#FFF6D8', 0.3]]));
def(lg('ssBooth', [[0, '#FFF0C8', 0.32], [1, '#FFF0C8', 0.02]]));
def(lg('ssGap', [[0, '#FFE9B0'], [0.5, '#FFFFFF'], [1, '#FFE0A0']], 1, 0));
def(lg('ssSpill', [[0, '#FFD98A', 0.42], [1, '#FFD98A', 0]], 1, 0));
def(lg('ssStageFloor', [[0, '#B8743E'], [1, '#D9965A']]));
def(`<pattern id="ssVelvet" width="90" height="200" patternUnits="userSpaceOnUse"><rect width="90" height="200" fill="#B3164C"/><rect x="0" width="22" height="200" fill="#7E0D36"/><rect x="40" width="16" height="200" fill="#D6336C"/><rect x="58" width="6" height="200" fill="#E85A88" opacity="0.6"/></pattern>`);
def(`<pattern id="ssMask" width="70" height="200" patternUnits="userSpaceOnUse"><rect width="70" height="200" fill="#1E1628"/><rect width="18" height="200" fill="#120C1A"/><rect x="34" width="10" height="200" fill="#2C2238"/></pattern>`);
def(`<pattern id="ssHouseWall" width="200" height="300" patternUnits="userSpaceOnUse"><rect width="200" height="300" fill="#4A2A86"/><rect x="16" y="20" width="168" height="260" rx="10" fill="#55329A"/><rect x="16" y="20" width="168" height="260" rx="10" fill="none" stroke="#C9A24A" stroke-width="3" opacity="0.55"/><path d="M100 110 l14 40 l-14 40 l-14 -40 Z" fill="#6A44B0"/></pattern>`);
def(`<pattern id="ssPlanksSt" width="300" height="40" patternUnits="userSpaceOnUse"><rect width="300" height="40" fill="none"/><path d="M0 0.5 H300 M100 0 V40 M250 0 V20" stroke="#8A4E26" stroke-width="2.5" opacity="0.55"/></pattern>`);
def(`<pattern id="ssSeatBack" width="360" height="900" patternUnits="userSpaceOnUse"><rect width="360" height="900" fill="#2A0C26"/><rect x="18" y="0" width="324" height="900" rx="70" fill="#A3164A"/><rect x="18" y="0" width="324" height="56" rx="28" fill="#C9285E"/><rect x="40" y="70" width="40" height="800" fill="#7E0D36" opacity="0.6"/><rect x="150" y="96" width="60" height="30" rx="6" fill="#E8C060"/></pattern>`);
def(`<pattern id="ssBackstage" width="160" height="80" patternUnits="userSpaceOnUse"><rect width="160" height="80" fill="#2A2238"/><rect x="3" y="3" width="154" height="34" rx="3" fill="#30283F"/><rect x="-77" y="43" width="154" height="34" rx="3" fill="#30283F"/><rect x="83" y="43" width="154" height="34" rx="3" fill="#30283F"/></pattern>`);
def(`<pattern id="ssDarkPlanks" width="320" height="50" patternUnits="userSpaceOnUse"><rect width="320" height="50" fill="#3A2C30"/><path d="M0 0.5 H320 M140 0 V50" stroke="#2A1E22" stroke-width="3"/></pattern>`);
// spotlight: cone from above the frame to a pool on the stage floor
function spotlight(x, y, w, op = 1, srcY = -160) {
  const xs = x + (x - 960) * 0.25;
  return P(`M${f(xs - w * 0.07)} ${srcY} L${f(xs + w * 0.07)} ${srcY} L${f(x + w / 2)} ${f(y)} L${f(x - w / 2)} ${f(y)} Z`, { fill: 'url(#ssSpotCone)', opacity: f(op) }) +
    E(x, y, w / 2, w * 0.11, { fill: '#FFF4D0', opacity: f(0.32 * op) }) + E(x, y, w * 0.36, w * 0.075, { fill: '#FFFFFF', opacity: f(0.22 * op) });
}
// falling paper confetti over a region; k 0..1 = density
function confettiFall(t, k, x0, x1, y0 = -120, y1 = 1100, seed = 3) {
  if (k <= 0) return '';
  const n = Math.round(70 * k), cols = ['#FF6F91', '#FFD23F', '#3FA9E0', '#8ED24E', '#9B6BFF', '#FF9F43', '#FFFFFF'];
  const B = {};
  for (let i = 0; i < n; i++) {
    const sp = 140 + 120 * hash(i * 3.1 + seed), span = y1 - y0;
    const y = y0 + md(hash(i * 7.3 + seed) * span + t * sp, span);
    const x = x0 + hash(i * 1.9 + seed) * (x1 - x0) + Math.sin(t * 2 + i) * 30;
    const fl = Math.cos(t * (4 + 4 * hash(i)) + i), w = 22 * Math.max(0.15, Math.abs(fl)), h = 14, a = (t * 90 + i * 40) % 360;
    const c = cols[i % cols.length];
    const r = (a * Math.PI) / 180, ca = Math.cos(r), sa = Math.sin(r);
    const pt = (u, v) => `${f(x + u * ca - v * sa)} ${f(y + u * sa + v * ca)}`;
    B[c] = (B[c] || '') + `M${pt(-w / 2, -h / 2)} L${pt(w / 2, -h / 2)} L${pt(w / 2, h / 2)} L${pt(-w / 2, h / 2)} Z `;
  }
  return Object.entries(B).map(([c, d]) => P(d, { fill: c })).join('');
}
function sconce(x, y, on = 1) {
  return softGlow(x, y - 20, 110, 90, '#FFD98A', 0.9 * on) + P(`M${x - 28} ${y} L${x + 28} ${y} L${x + 18} ${y - 50} L${x - 18} ${y - 50} Z`, ol(mix('#5A3A80', '#FFE6A8', on), 4)) + R(x - 34, y, 68, 12, 4, ol('#C9A24A', 3)) + P(`M${x} ${y + 12} Q${x} ${y + 40} ${x - 14} ${y + 50}`, ln(5, '#C9A24A'));
}
function marqueeBanner(x, y, s, t, text = 'TALENT SHOW', lit = 1) {
  const w = 820, h = 170;
  let o = P(`M${-w / 2 + 120} ${-h / 2 - 90} L${-w / 2 + 120} ${-h / 2} M${w / 2 - 120} ${-h / 2 - 90} L${w / 2 - 120} ${-h / 2}`, ln(4, '#2A2032'));
  o += R(-w / 2 - 14, -h / 2 - 14, w + 28, h + 28, 26, ol('#E8B84A', 6)) + R(-w / 2, -h / 2, w, h, 18, ol('#4A1240', 5)) + R(-w / 2 + 10, -h / 2 + 10, w - 20, 24, 10, { fill: '#FFFFFF', opacity: 0.08 });
  let bulbs = '', bulbsOff = '';
  const nb = 26;
  for (let i = 0; i < nb; i++) {
    const u = i / nb, per = 2 * (w + h);
    let d = u * per, bx, by;
    if (d < w) { bx = -w / 2 + d; by = -h / 2 - 7; } else if ((d -= w) < h) { bx = w / 2 + 7; by = -h / 2 + d; } else if ((d -= h) < w) { bx = w / 2 - d; by = h / 2 + 7; } else { d -= w; bx = -w / 2 - 7; by = h / 2 - d; }
    const on = lit > 0.5 && (Math.floor(t * 6) + i) % 3 !== 0;
    if (on) bulbs += circD(bx, by, 8) + ' '; else bulbsOff += circD(bx, by, 7) + ' ';
  }
  o += P(bulbsOff, { fill: '#B8925A', stroke: LINE, 'stroke-width': 2.5 }) + (bulbs ? P(bulbs, { fill: '#FFF6C8', stroke: '#FFB84A', 'stroke-width': 3 }) : '');
  o += P(starD(-w / 2 + 64, 0, 34, 15), ol('#FFD23F', 4)) + P(starD(w / 2 - 64, 0, 34, 15), ol('#FFD23F', 4));
  o += T(text, 0, 34, 98, '#FFE14D', { ...OUTX(10, '#2A0A26'), 'letter-spacing': 2 }) + T(text, 0, 34, 98, '#FFE14D') + P(`M${-w / 2 + 130} -8 H${w / 2 - 130}`, ln(6, '#FFFFFF', 0.0));
  return G(o, tr(x, y, s));
}
// mic stand on the stage floor; origin = base
function micStand(x, y, s = 1, opts = {}) {
  let o = P('M0 0 L-46 14 M0 0 L46 14 M0 0 L0 18', ln(10, LINE)) + P('M0 0 L-46 14 M0 0 L46 14 M0 0 L0 18', ln(5, '#5A6070'));
  o += P('M0 0 V-300', ln(12, LINE)) + P('M0 0 V-300', ln(6, '#9AA4B8')) + P('M0 -300 L26 -338', ln(10, LINE)) + P('M0 -300 L26 -338', ln(5, '#9AA4B8'));
  o += G(R(-14, -40, 28, 52, 12, ol('#2A2E3A', 4)) + R(-12, -38, 24, 26, 10, { fill: '#5A6070' }) + P('M-10 -30 H10 M-10 -22 H10', ln(2, '#2A2E3A')), 'translate(30 -344) rotate(30)');
  return G(o, tr(x, y, s));
}
function auditoriumStage(t, opts) {
  const lights = opts.lights ?? 1, cur = opts.curtain ?? 1, dim = 1 - lights;
  let m = cover('url(#ssHouseWall)') + band(YT, 0, '#2E1A56') + band(-6, 10, '#C9A24A');
  // sconces on the house walls
  m += sconce(40, 470, lights) + sconce(1880, 470, lights) + sconce(-300, 470, lights) + sconce(2220, 470, lights);
  // inside the opening: cyclorama, stars, bulb strings
  m += R(200, 100, 1520, 520, 0, { fill: 'url(#ssCyc)' });
  m += P([[420, 260, 30], [640, 200, 18], [880, 330, 22], [1100, 230, 34], [1320, 300, 20], [1520, 210, 26], [560, 420, 16], [1240, 440, 18], [760, 480, 14], [1460, 470, 15]].map(([x, y, r]) => starD(x, y, r, r * 0.45)).join(' '), { fill: '#FFE14D', opacity: 0.85 });
  for (const [yy, sag] of [[300, 70], [420, 60]]) {
    m += P(`M220 ${yy} Q960 ${yy + sag * 2} 1700 ${yy}`, ln(3, '#2A1A40', 0.8));
    let bb = '';
    for (let i = 1; i < 18; i++) { const u = i / 18, bx = lerp(220, 1700, u), by = yy + 4 * sag * u * (1 - u) + 10; bb += circD(bx, by, 7) + ' '; }
    m += P(bb, { fill: '#FFF0B0', stroke: '#FFB84A', 'stroke-width': 3, opacity: f(0.7 + 0.3 * dim) });
  }
  // stage floor
  m += R(200, 600, 1520, 200, 0, { fill: 'url(#ssStageFloor)' }) + R(200, 600, 1520, 200, 0, { fill: 'url(#ssPlanksSt)' }) + P('M200 600 H1720', ln(5, '#5A3018'));
  let pl = '';
  for (let i = -6; i <= 6; i++) pl += `M${960 + i * 70} 600 L${960 + i * 150} 800 `;
  m += P(pl, ln(2.5, '#8A4E26', 0.45)) + P('M260 780 Q960 760 1660 780', ln(14, '#FFFFFF', 0.12));
  // tape marks + the mic stand + cable
  m += P('M690 762 l24 0 M702 750 l0 24 M1230 762 l24 0 M1242 750 l0 24', ln(5, '#7DFFB8', 0.9));
  const mic = opts.mic ?? 960;
  if (mic !== false) {
    m += P(`M${mic} 778 Q${mic - 60} 800 ${mic - 180} 786 Q${mic - 320} 768 ${mic - 420} 790 Q${mic - 520} 806 ${mic - 600} 760 Q${mic - 640} 730 300 720`, ln(12, LINE)) + P(`M${mic} 778 Q${mic - 60} 800 ${mic - 180} 786 Q${mic - 320} 768 ${mic - 420} 790 Q${mic - 520} 806 ${mic - 600} 760 Q${mic - 640} 730 300 720`, ln(6, '#2E3442'));
  }
  // wing masking legs
  m += R(200, 100, 110, 700, 0, { fill: 'url(#ssMask)' }) + R(1610, 100, 110, 700, 0, { fill: 'url(#ssMask)' });
  // main curtains (open: gathered with gold tiebacks)
  const cx = lerp(960, 470, cur);
  const curtainL = (x0, x1) => {
    const tie = 560, nip = lerp(0, 70, cur);
    return P(`M${x0} 100 L${x1} 100 Q${x1 + 6} 330 ${x1 - nip} ${tie} Q${x1 - nip * 0.3} 690 ${x1 + 10} 806 L${x0} 806 Z`, { fill: 'url(#ssVelvet)', stroke: LINE, 'stroke-width': 6, 'stroke-linejoin': 'round' }) +
      (cur > 0.2 ? P(`M${x0} ${tie - 10} Q${(x0 + x1 - nip) / 2} ${tie + 18} ${x1 - nip + 8} ${tie - 6}`, ln(16, LINE)) + P(`M${x0} ${tie - 10} Q${(x0 + x1 - nip) / 2} ${tie + 18} ${x1 - nip + 8} ${tie - 6}`, ln(9, '#E8B84A')) + CI(x1 - nip + 6, tie + 6, 14, ol('#E8B84A', 4)) + P(`M${x1 - nip + 2} ${tie + 18} l-8 40 M${x1 - nip + 10} ${tie + 18} l6 40`, ln(5, '#E8B84A')) : '');
  };
  m += curtainL(160, cx) + G(curtainL(160, cx), 'translate(1920 0) scale(-1 1)');
  // valance (three swags)
  {
    let v = R(160, 90, 1600, 70, 0, { fill: 'url(#ssVelvet)' });
    let sw = '';
    for (let i = 0; i < 4; i++) { const x0 = 160 + i * 400; sw += `M${x0} 150 Q${x0 + 200} 250 ${x0 + 400} 150 `; }
    let vd = 'M160 90 H1760 V150';
    for (let i = 3; i >= 0; i--) { const x0 = 160 + i * 400; vd += ` Q${x0 + 200} 250 ${x0} 150`; }
    v += P(vd + ' Z', { fill: 'url(#ssVelvet)', stroke: LINE, 'stroke-width': 6, 'stroke-linejoin': 'round' });
    v += P(sw, ln(10, '#E8B84A')) + P(Array.from({ length: 5 }, (_, i) => `M${160 + i * 400} 150 l0 40`).join(' '), ln(8, '#E8B84A')) + P(Array.from({ length: 5 }, (_, i) => circD(160 + i * 400, 196, 10)).join(' '), ol('#E8B84A', 3));
    m += v;
  }
  // spotlight cones + pools: behind the performers (the proscenium frame hides the cone tops)
  const spots = opts.spots || [{ x: 960, y: 760, w: 560 }];
  for (const sp of spots) m += spotlight(sp.x, sp.y, sp.w || 500, 0.55 + 0.45 * dim);
  // banner
  m += marqueeBanner(960, 205, 0.85, t, opts.banner || 'TALENT SHOW', 1);
  // proscenium frame
  m += P('M80 -20 H1840 V880 H80 Z M200 100 V806 H1720 V100 Z', { fill: '#E9C676', 'fill-rule': 'evenodd', stroke: LINE, 'stroke-width': 7 });
  m += P('M112 12 H1808 V880 M200 100 V806 M112 12 V880', ln(5, '#C9A24A')) + P('M200 100 H1720 V806', ln(10, '#B8893A', 0.6)) + P('M96 -4 H1824', ln(6, '#FFF0C0', 0.7));
  m += G(E(0, 0, 112, 46, ol('#E9C676', 6)) + E(0, 0, 90, 34, ol('#4A2A86', 4)) + comet(-6, 2, 0.45), 'translate(960 52)');
  for (const x of [140, 1780]) m += P(Array.from({ length: 8 }, (_, i) => `M${x - 16} ${150 + i * 90} l16 -20 l16 20 l-16 20 Z`).join(' '), ol('#C9A24A', 3));
  // apron + footlights + house floor
  m += R(80, 806, 1760, 84, 0, ol('#2A1A38', 6)) + P('M80 820 H1840', ln(4, '#4A3060'));
  let fl_ = '', fg_ = '';
  for (let x = 240; x < 1720; x += 120) { fl_ += rrD(x - 20, 800, 40, 18, 6) + ' '; fg_ += softGlow(x, 796, 70, 26, '#FFE9A8', 0.7); }
  m += fg_ + P(fl_, ol('#3A3040', 3));
  m += R(XL, 890, XR - XL, YB - 890, 0, { fill: '#2A1838' });
  // ---- fg: audience silhouettes
  const cheer = bool01(opts.cheer);
  let fg = '';
  const fgRows = [{ y: 1000, s: 0.42, seed: 11 }, { y: 1120, s: 0.56, seed: 17 }];
  const fl0 = lerp(0.12, 0.62, lights);
  fgRows.forEach((rw, i) => {
    fg += crowd([{ x0: -600, x1: 2520, y: rw.y, s: rw.s, seed: rw.seed, jit: 0.12 }], { light: fl0, dark: '#170C26', cheer, phones: bool01(opts.phones) * cheer, t: t + i, wave: !!opts.wave, back: true });
    let sd = '';
    for (let x = -600 + (i ? 140 : 0); x < 2600; x += 360 * rw.s) sd += rrD(x - 160 * rw.s, rw.y + 70 * rw.s, 320 * rw.s, 600 * rw.s, 60 * rw.s) + ' ';
    fg += P(sd, { fill: mix('#7E0D36', '#170C26', 1 - fl0), stroke: LINE, 'stroke-width': f(10 * rw.s) });
  });
  // ---- light: house dim (outside the opening), spots, warm stage wash, confetti
  let light = '';
  if (dim > 0) light += P(`M${XL} ${YT} H${XR} V${YB} H${XL} Z M200 100 V806 H1720 V100 Z`, { fill: '#12081F', 'fill-rule': 'evenodd', opacity: f(0.6 * dim) }) + R(200, 100, 1520, 706, 0, { fill: '#FFD98A', opacity: f(0.03 * dim) });
  // a faint haze where the beams cross the performers (keeps them readable)
  for (const sp of spots) light += E(sp.x, sp.y - (sp.w || 500) * 0.55, (sp.w || 500) * 0.32, (sp.w || 500) * 0.5, { fill: '#FFF6D8', opacity: f(0.025 + 0.02 * dim) });
  light += confettiFall(t, bool01(opts.confetti), 120, 1800, -120, 1000, 3);
  const front = mic !== false ? micStand(mic, 776, 0.95) : '';
  return { bg: '', mid: m, front, fg, light };
}
// raked house rows: index 0 = front row
const HOUSE_ROWS = (() => { const a = []; for (let i = 0; i < 7; i++) { const d = 1 / (1 + 0.5 * i), y = 200 + 760 * d; a.push({ y: Math.round(y), s: +(0.5 * (y - 200) / 760).toFixed(3) }); } return a; })();
const FAMILY = { dad: 770, mom: 950, bea: 1130 };
function auditoriumHouse(t, opts) {
  const lights = opts.lights ?? 1, dim = 1 - lights;
  let m = band(YT, 520, 'url(#ssHouseWall)') + band(500, YB, '#2A0C26') + band(YT, 40, '#2E1A56');
  // balcony + booth
  m += R(XL, 60, XR - XL, 250, 0, { fill: '#3A2070' }) + R(820, 90, 280, 80, 10, ol('#1A1030', 5)) + R(836, 104, 120, 52, 4, { fill: '#2A3A60' }) + R(964, 104, 120, 52, 4, { fill: '#2A3A60' }) + softGlow(1030, 130, 60, 40, '#FFF0C8', 0.6 + dim * 0.4) + CI(1030, 130, 14, { fill: '#FFF6D8' });
  m += crowd([{ x0: -520, x1: 2440, y: 232, s: 0.085, seed: 41, dx: 560, jit: 0.1 }, { x0: -520, x1: 2440, y: 264, s: 0.095, seed: 43, dx: 520, jit: 0.1 }], { light: lerp(0.75, 0.15, dim), dark: '#1A0E2E', cheer: bool01(opts.cheer), t, eyes: false });
  m += R(XL, 280, XR - XL, 56, 0, ol('#E9C676', 6)) + P(`M${XL} 296 H${XR} M${XL} 320 H${XR}`, ln(3, '#C9A24A')) + P(Array.from({ length: 22 }, (_, i) => `M${-1060 + i * 190} 284 v48`).join(' '), ln(5, '#C9A24A'));
  m += R(XL, 336, XR - XL, 60, 0, { fill: '#000', opacity: 0.25 });
  // exit signs + side sconces
  for (const x of [100, 1820]) m += R(x - 60, 350, 120, 44, 6, ol('#1E6E3A', 4)) + TF('EXIT', x, 382, 28, '#8EFFB0') + softGlow(x, 372, 90, 40, '#8EFFB0', 0.5);
  m += sconce(-200, 470, lights) + sconce(2120, 470, lights);
  // rows back -> front: seat backs (one path per row, no patterns: small-scale patterns are slow), then people.
  // opts.cam (the camera the layers are viewed with) culls people / rows outside the view: pass it for close-ups.
  const cheer = bool01(opts.cheer), gasp = bool01(opts.gasp), phones = bool01(opts.phones);
  const cv = opts.cam ? { x0: toWorldX(opts.cam, 1, -160), x1: toWorldX(opts.cam, 1, 2080), y0: toWorldY(opts.cam, 1, -120), y1: toWorldY(opts.cam, 1, 1200) } : { x0: -520, x1: 2460, y0: -2000, y1: 4000 };
  for (let r = HOUSE_ROWS.length - 1; r >= 0; r--) {
    const { y, s: sc } = HOUSE_ROWS[r];
    if (y - 400 * sc > cv.y1 || (r > 0 && HOUSE_ROWS[r - 1].y < cv.y0)) continue;
    const next = r > 0 ? HOUSE_ROWS[r - 1] : null;
    const bandTop = y - 40 * sc, bandBot = next ? next.y - 40 * next.s + 12 : 1120;
    const haze = clamp(0.07 * r, 0, 0.6) * (0.55 + 0.45 * dim) + 0.25 * dim;
    const dx = 360 * sc, x0 = -520 + (r % 2) * dx * 0.5;
    m += R(XL, bandTop + 30 * sc, XR - XL, bandBot - bandTop, 0, { fill: mix('#3A0E30', '#12081F', haze) });
    let sd = '', hd = '';
    for (let x = x0; x < cv.x1; x += dx) { if (x < cv.x0 - dx) continue; sd += rrQ(x - 162 * sc, bandTop, 324 * sc, bandBot - bandTop + 20, 60 * sc); hd += rrQ(x - 150 * sc, bandTop + 6 * sc, 300 * sc, 40 * sc, 20 * sc); }
    m += P(sd, sc >= 0.19 ? { fill: mix('#A3164A', '#1A0A24', haze), stroke: LINE, 'stroke-width': f(Math.max(1.5, 10 * sc)) } : { fill: mix('#A3164A', '#1A0A24', haze) }) + P(hd, { fill: mix('#D23A6E', '#1A0A24', haze) });
    const rl = clamp(1 - haze * 1.15, 0.08, 1);
    m += crowd([{ x0: x0 - dx * 0.5, x1: cv.x1, cx0: cv.x0, y, s: sc, seed: 50 + r, dx: 360, jit: 0, off: 0.5, light: rl, gaps: r === 0 && opts.family !== false ? [[680, 1220]] : null }], { cheer, gasp, phones, t, wave: !!opts.wave, dark: '#1A0E2E', lit: '#FFD98A', eyes: sc > 0.11 });
  }
  // booth beam (follow spot toward the stage = the camera)
  let light = '';
  if (dim > 0) light += P('M1010 130 L1050 130 L1500 1200 L560 1200 Z', { fill: 'url(#ssBooth)', opacity: f(0.75 * dim) });
  light += TINT('#FFD98A', 0.05 + 0.05 * dim);
  // fg: stage lip + footlights (we stand on the stage)
  let fg = R(XL, 1010, XR - XL, 600, 0, { fill: 'url(#ssStageFloor)' }) + R(XL, 1010, XR - XL, 600, 0, { fill: 'url(#ssPlanksSt)' }) + P(`M${XL} 1010 H${XR}`, ln(7, '#5A3018'));
  let fh = '';
  for (let x = -1000; x < 3000; x += 160) { fh += rrD(x - 34, 990, 68, 34, 8) + ' '; fg += softGlow(x, 980, 90, 40, '#FFE9A8', 0.6 + 0.4 * dim); }
  fg += P(fh, ol('#2A2432', 4));
  return { bg: '', mid: m, front: '', fg, light };
}
function auditoriumWings(t, opts) {
  let m = cover('url(#ssBackstage)') + band(YT, 40, '#15101E');
  // fly rail: ropes + sandbags
  let ropes = '';
  const RX = [-200, -120, -40, 40, 120, 200, 280, 360, 440];
  RX.forEach((x) => { ropes += `M${x} ${YT} V640 `; });
  m += P(ropes, ln(9, '#151015')) + P(ropes, ln(5, '#C9A060'));
  RX.forEach((x, i) => { if (i % 2 === 0) { const y = 220 + 90 * hash(i * 3.7); m += G(P('M-34 0 Q-40 -60 -20 -76 L20 -76 Q40 -60 34 0 Q0 14 -34 0 Z', ol('#8A6A48', 4)) + P('M-20 -76 L0 -96 L20 -76', ln(5, '#C9A060')) + P('M-24 -40 H24', ln(3, '#6A4A30')), tr(x, y + 80, 1)); } });
  m += R(-280, 600, 800, 22, 8, ol('#5A5A66', 4)) + P(Array.from({ length: 14 }, (_, i) => `M${-260 + i * 56} 590 v-22 M${-260 + i * 56} 622 v18`).join(' '), ln(7, '#9AA4B8'));
  // QUIET sign with a red light
  m += G(R(-140, -50, 280, 100, 10, ol('#2A2232', 5)) + TF('QUIET PLEASE', 0, -6, 30, '#FFFFFF') + TF('SHOW IN PROGRESS', 0, 30, 20, '#FF7A8A') + CI(124, -36, 12, { fill: '#FF3B4E' }) + softGlow(124, -36, 50, 50, '#FF3B4E', 0.8), 'translate(900 260)');
  // ladder + road cases + SM desk
  m += P('M620 300 L560 900 M720 300 L660 900', ln(14, LINE)) + P('M620 300 L560 900 M720 300 L660 900', ln(7, '#9AA4B8')) + P(Array.from({ length: 7 }, (_, i) => `M${614 - i * 8.5} ${370 + i * 80} H${712 - i * 8.5}`).join(' '), ln(7, '#9AA4B8'));
  const roadCase = (x, y, w, h) => R(x, y - h, w, h, 8, ol('#22222A', 5)) + P(`M${x + 6} ${y - h + 6} h24 M${x + w - 30} ${y - h + 6} h24 M${x + 6} ${y - 6} h24 M${x + w - 30} ${y - 6} h24`, ln(7, '#B9C2D2')) + R(x + w / 2 - 20, y - h / 2 - 8, 40, 16, 4, ol('#B9C2D2', 3)) + TF('FRAGILE', x + w / 2, y - h + 34, 18, '#FFD23F');
  m += roadCase(-60, 960, 300, 190) + roadCase(-20, 770, 220, 130);
  // costume rack (colourful) behind the stage manager's desk
  {
    let cr = P('M-200 0 L-200 -330 M200 0 L200 -330 M-220 -330 H220', ln(14, LINE)) + P('M-200 0 L-200 -330 M200 0 L200 -330 M-220 -330 H220', ln(7, '#9AA4B8')) + P('M-240 0 H-160 M160 0 H240', ln(10, '#5A6070'));
    const cos = [['#FF6F91', 'dress'], ['#FFD23F', 'cape'], ['#3FA9E0', 'coat'], ['#9B6BFF', 'cape'], ['#8ED24E', 'dress'], ['#FF9F43', 'coat']];
    cos.forEach(([c, k], i) => {
      const x = -160 + i * 64;
      cr += P(`M${x} -330 l0 -14 q8 -10 14 0`, ln(3, '#C9D1DE'));
      if (k === 'dress') cr += P(`M${x - 20} -320 L${x + 20} -320 L${x + 40} -150 L${x - 40} -150 Z`, ol(c, 4));
      else if (k === 'cape') cr += P(`M${x - 24} -322 L${x + 24} -322 L${x + 34} -110 Q${x} -96 ${x - 34} -110 Z`, ol(c, 4)) + P(starD(x, -220, 12, 5), { fill: '#FFFFFF', opacity: 0.8 });
      else cr += R(x - 26, -322, 52, 180, 8, ol(c, 4)) + P(`M${x} -322 V-150`, ln(3, LINE, 0.5));
    });
    cr += G(R(-50, -40, 100, 30, 6, ol('#2A2232', 4)) + R(-32, -110, 64, 74, 8, ol('#2A2232', 4)) + R(-32, -60, 64, 14, 0, { fill: '#E8462E' }), 'translate(-120 -330)');
    m += G(cr, 'translate(860 800)');
  }
  m += G(R(-110, -150, 220, 150, 8, ol('#3A3448', 5)) + R(-110, -170, 220, 26, 6, ol('#4A4458', 4)) + P('M70 -170 L90 -230 L60 -246', ln(6, '#2A2432')) + E(60, -246, 26, 12, ol('#4A8AFF', 3)) + softGlow(40, -180, 80, 30, '#7FB8FF', 0.8) + R(-80, -168, 90, 12, 2, ol('#FFFFFF', 2)) + E(-30, -184, 34, 10, ol('#2A2A2A', 3)), 'translate(420 900)');
  // floor
  m += band(760, YB, 'url(#ssDarkPlanks)') + band(756, 768, '#151015') + P('M120 880 l30 0 M135 866 l0 28 M1000 920 l30 0 M1015 906 l0 28', ln(6, '#7DFFB8', 0.8));
  m += P('M780 1000 Q860 940 980 990 Q1060 1030 1000 1060 Q900 1080 860 1040', ln(9, '#151015')) + P('M780 1000 Q860 940 980 990 Q1060 1030 1000 1060 Q900 1080 860 1040', ln(5, '#3A3440'));
  // the curtain edge (right) with the bright gap
  m += R(1700, YT, 1400, YB - YT, 0, { fill: 'url(#ssGap)' }) + R(1700, 700, 1400, 300, 0, { fill: '#E8B070', opacity: 0.6 });
  m += R(1790, YT, 1300, YB - YT, 0, { fill: 'url(#ssMask)' }) + P(`M1790 ${YT} V${YB}`, ln(6, LINE));
  m += P(`M1380 ${YT} L1700 ${YT} L1700 1010 Q1640 1030 1600 1004 Q1540 1030 1480 1004 Q1420 1030 1360 1008 Q1380 400 1380 ${YT} Z`, { fill: 'url(#ssVelvet)', stroke: LINE, 'stroke-width': 6, 'stroke-linejoin': 'round' }) + P(`M1690 ${YT} V1000`, ln(12, '#FFE9B0', 0.5));
  // light: warm spill from the gap onto the floor + hero spots; darkness elsewhere
  let light = P('M1700 260 L1700 1000 L700 1300 L700 700 Z', { fill: 'url(#ssSpill)', opacity: 0.85 }) + P('M1700 820 L1700 1000 L-200 1200 L300 900 Z', { fill: 'url(#ssSpill)', opacity: 0.6 });
  light += P(`M${XL} ${YT} H${XR} V${YB} H${XL} Z M1700 ${YT} V${YB} H${XR} V${YT} Z`, { fill: '#0A0614', opacity: 0.18, 'fill-rule': 'evenodd' });
  return { bg: '', mid: m, front: '', fg: '', light };
}
function auditoriumLayers(t, opts = {}) {
  const v = opts.view || 'stage';
  if (v === 'house') return auditoriumHouse(t, opts);
  if (v === 'wings') return auditoriumWings(t, opts);
  return auditoriumStage(t, opts);
}
const auditorium = makeSet(auditoriumLayers);
// rig feet y for a person seated in a house row (shoulders on the row line)
const houseSeat = (x, r, extra = 0) => ({ x, y: Math.round(HOUSE_ROWS[r].y + 556 * HOUSE_ROWS[r].s + extra), s: HOUSE_ROWS[r].s });

// ================================================================= 7. HALLWAY (bonus) — lockers, Room 104, the talent-show poster
// A wide corridor (world x -1100..3020: pan along it): sky-blue walls, blue/lime locker banks (y 320..740), Mr. Fig's
// door ROOM 104 (SPOTS.hallway.door), a water fountain, the trophy case, posters incl. "SCHOOL TALENT SHOW · FRIDAY",
// fluorescent ceiling panels, glossy floor. Run line = FLOOR 960 (s .5). opts: { doorOpen 0..1, poster (text lines) }
def(`<pattern id="ssHallFloor" width="160" height="80" patternUnits="userSpaceOnUse"><rect width="160" height="80" fill="#E6ECF2"/><rect width="80" height="40" fill="#D8E2EC"/><rect x="80" y="40" width="80" height="40" fill="#D8E2EC"/><path d="M0 0.5 H160 M0.5 0 V80" stroke="#C6D2DE" stroke-width="2"/></pattern>`);
function hallwayLayers(t, opts = {}) {
  let m = cover('#BEE6F7') + band(YT, 50, '#EEF4FA') + band(46, 58, '#2FB3B8');
  for (let x = -1000; x < 3000; x += 520) m += R(x, 6, 300, 30, 6, ol('#FFFFFF', 4)) + softGlow(x + 150, 40, 200, 50, '#FFFFFF', 0.6);
  m += band(286, 300, '#9AD94E') + P(`M${XL} 286 H${XR} M${XL} 300 H${XR}`, ln(3, LINE, 0.5));
  // locker banks
  m += lockerRow(-1100, -660, 740, { col: 'blue' }) + lockerRow(-340, 420, 740, { col: 'lime' }) + lockerRow(700, 1440, 740, { col: 'blue' }) + lockerRow(1860, 2140, 740, { col: 'lime' }) + lockerRow(2560, 3020, 740, { col: 'blue' });
  // ROOM 105 (left) + ROOM 104 Mr. Fig (right)
  const door = (x, num, sign, open = 0) => {
    let o = R(x - 140, 250, 280, 490, 6, ol('#FFFFFF', 6));
    if (open > 0) o += R(x - 120, 270, 240, 470, 4, { fill: '#2A3A55' }) + poly([[x - 120, 270], [x - 120 + 120 * (1 - open), 290], [x - 120 + 120 * (1 - open), 720], [x - 120, 740]], ol('#E39A5A', 5));
    else o += R(x - 120, 270, 240, 470, 4, ol('#E39A5A', 5)) + R(x - 70, 310, 100, 150, 6, ol('#BFE8FF', 4)) + CI(x + 90, 520, 12, ol('#FFD23F', 3));
    o += R(x - 90, 200, 180, 40, 6, ol('#2A3A55', 4)) + TF(num, x, 228, 24, '#FFFFFF');
    if (sign) o += G(R(-80, -40, 160, 80, 8, ol('#FFD23F', 4)) + TF(sign[0], 0, -6, 22, '#2A2246') + TF(sign[1], 0, 22, 18, '#2457C5'), tr(x + 230, 380, 1, 3));
    return o;
  };
  m += door(-500, 'ROOM 105', null) + door(1650, 'ROOM 104', ['MR. FIG', '7 × 8 = 56'], bool01(opts.doorOpen));
  // water fountain + trophy case
  m += G(R(-70, -40, 140, 60, 12, ol('#C9D1DE', 5)) + R(-56, -52, 112, 20, 8, ol('#E6EEF8', 4)) + P('M0 -52 Q16 -76 30 -58', ln(5, '#7FD8FF')) + R(-20, 20, 40, 150, 4, ol('#A3ADBF', 4)), 'translate(560 570)');
  m += trophyCase(2350, 740, 1);
  // posters above the lockers
  const tp = opts.poster || ['SCHOOL', 'TALENT SHOW', 'FRIDAY!'];
  m += schoolPoster(tp, 250, 170, { w: 300, h: 190, col: '#9B6BFF', ink: '#FFFFFF', size: 40, shout: false, rot: -2, icon: 'star' });
  m += schoolPoster(['GO', 'COMETS!'], 1060, 180, { w: 220, h: 160, col: '#2FB3B8', ink: '#FFFFFF', size: 46, rot: 2 }) + comet(1110, 236, 0.4);
  m += schoolPoster(['BE', 'KIND'], -880, 180, { w: 180, h: 150, col: '#FFD23F', size: 48, icon: 'none', rot: 3 }) + schoolPoster(['SCIENCE', 'FAIR'], 2000, 170, { w: 200, h: 150, col: '#8ED24E', size: 36, rot: -3 });
  m += schoolPoster(['MISTAKES', 'ARE PROOF', "YOU'RE TRYING"], 2780, 170, { w: 240, h: 170, col: '#FF9EC4', size: 28, rot: 2 });
  // floor
  m += band(740, YB, 'url(#ssHallFloor)') + band(736, 748, '#2A3A55') + R(XL, 748, XR - XL, 40, 0, { fill: '#000', opacity: 0.06 });
  let refl = '';
  for (let x = -1000; x < 3000; x += 520) refl += `M${x + 40} 790 L${x + 260} 790 L${x + 320} 900 L${x - 20} 900 Z `;
  m += P(refl, { fill: '#FFFFFF', opacity: 0.35 });
  return { bg: '', mid: m, front: '', fg: '', light: TINT('#FFF6E0', 0.04) };
}
const hallway = makeSet(hallwayLayers);

// ================================================================= anchors + exports
const FLOOR = { hallway: 960, schoolyard: 960, classroom: 1040, classroomBoard: 800, gym: 960, cafeteria: 960, lounge: 980, auditorium: 770, auditoriumWings: 960 };
const SPOTS = {
  schoolyard: {
    scaleAt,
    door: { x: SY.door, y: SY.doorY, s: scaleAt(SY.doorY) },                 // on the porch, in front of the double doors
    doorL: { x: SY.door - 70, y: SY.doorY }, doorR: { x: SY.door + 70, y: SY.doorY },
    steps: { x: SY.door, top: SY.doorY, bottom: 780, s: 0.38 },
    flagSpot: { x: 700, y: 840, s: scaleAt(840) },                         // checkpoint flag by the door (left of the steps)
    walk: { x: SY.door, y: 960, s: 0.5 },                                  // on the walkway, the stand line
    pole: { x: SY.poleX, base: SY.poleBase, top: SY.poleTop },
    poleTop: { x: SY.poleX, y: SY.poleTop - 22 },                          // the gold ball
    hug: POLE_HUG,                                                         // hero s .5 hugging the very top (feet dangling)
    flag: { x: SY.poleX + 6, y: SY.poleTop + 14, w: 250, h: 160 },
    rail: { x0: SY.rail.x0, x1: SY.rail.x1, y: SY.rail.y - SY.rail.h - 18, ground: SY.rail.y, s: 0.5 },   // y = rail top (board line)
    trash: { x: SY.trash.x, y: SY.trash.y, top: SY.trash.y - 190, s: 0.5 },
    ramp: { base: { x: SY.ramp.x, y: SY.ramp.y }, lip: { x: SY.ramp.x + SY.ramp.R, y: SY.ramp.y - SY.ramp.R }, deck: { x: SY.ramp.x + SY.ramp.R + 150, y: SY.ramp.y - SY.ramp.R - 12 },
      air: { x: SY.ramp.x + SY.ramp.R - 40, y: SY.ramp.y - SY.ramp.R - 330 }, landing: { x: SY.ramp.x - 140, y: SY.ramp.y }, R: SY.ramp.R, s: 0.5 },
    crowd: [3300, 3410, 3520, 3630, 3740, 3850, 3960, 4070].map((x, i) => ({ x, y: 800 + (i % 2) * 14, s: scaleAt(800 + (i % 2) * 14) })),
    benchSeats: [3250, 3410, 3620, 3780].map((x) => ({ x, y: 744, s: scaleAt(772) })),   // hips on the bench seat (y 744)
    deckKids: [{ x: 4700, y: 576, s: 0.5 }, { x: 4820, y: 576, s: 0.5 }],
    hoop: { x: -2650, y: 800 - 552 * 0.9, base: 800 },
    court: { x: -2650, y: 960, s: 0.5 },
    skyWindow: { x: 960, y: 250, w: 1080, h: 400 },                         // SCREEN space, for cams.wide / cams.red
    cams: {
      door: { x: 80, y: 0, zoom: 1 },                                      // the entrance, flag spot, walkway
      doorClose: camAt(880, 600, 1.7),                                     // planting the flag
      wide: { x: 200, y: -230, zoom: 0.6 },                                // the whole school + sky (red-sky window framing)
      red: { x: 200, y: -230, zoom: 0.6 },
      skate: { x: 3120, y: 0, zoom: 1 },                                   // rail, trash can, ramp, crowd
      ramp: camAt(4420, 640, 1.25),                                        // the quarter-pipe and the air above it
      crowd: camAt(3650, 560, 1.35),
      poleTop: camAt(SY.poleX, SY.poleTop + 230, 1),                       // the hero hugging the top, sky only
      poleClose: camAt(SY.poleX, SY.poleTop + 220, 1.8),
      poleWide: camAt(SY.poleX + 420, -560, 0.36),                         // the whole pole: tiny hero on top, school below
      court: { x: -3550, y: 0, zoom: 1 },
    },
  },
};
SPOTS.classroom = {
  // view 'class': seats by row (back -> front); kids stand at seat.y (feet hidden by the desk front), s as given
  rows: CLASS_ROWS.map((r) => r.xs.map((x) => seatAt(x, r.y, r.s))),
  seats: CLASS_ROWS.flatMap((r) => r.xs.filter((x) => x > 0 && x < 1920).map((x) => seatAt(x, r.y, r.s))),
  heroDesk: seatAt(960, 860, 0.5),                    // YOU (front row centre); desk top y 860
  neighbour: seatAt(1440, 860, 0.5),                  // the kid who shouts "Fifty-six!"
  underDesk: { x: 960, y: 1080, s: 0.5 },             // crouched under the desk top (hidden by the book box down to y 1002)
  teacher: { x: 170, y: 1060, s: 0.52 },              // Mr. Fig standing at the front-left (view 'class')
  clock: { x: 960, y: 170, r: 62 },
  board: {                                            // view 'board'
    teacher: { x: 300, y: 790, s: 0.42 },             // left of the whiteboard (point right at the sum)
    teacherDesk: { x: 1730, y: 800, s: 0.44 },        // behind his desk
    text: { x: 960, y: 330 },                         // the board sum (single line = 150 px tall)
    seats: [{ x: 380, y: 1250, s: 0.6 }, { x: 1540, y: 1250, s: 0.6 }],   // foreground kids (draw view:'back'); fg = their chair backs
    clock: { x: 1730, y: 210, r: 62 },
  },
  cams: {
    class: { x: 0, y: 0, zoom: 1 },
    heroDesk: camAt(960, 760, 1.65),                  // the hand that rises 1 cm / sliding under the desk
    heroAndNeighbour: camAt(1200, 720, 1.35),
    teacher: camAt(330, 720, 1.4),
    board: { x: 0, y: 0, zoom: 1 },
    boardClose: camAt(960, 340, 1.6),
  },
};
SPOTS.gym = {
  centre: { x: 960, y: 880 },                                                  // centre circle (no one stands on the line)
  throwers: [{ x: 230, y: 900, s: 0.45 }, { x: 430, y: 960, s: 0.5 }, { x: 640, y: 920, s: 0.47 }],   // left team, face right (view side + flip)
  team: [{ x: 1290, y: 930, s: 0.48 }, { x: 1700, y: 905, s: 0.46 }],          // YOUR team-mates, face left
  dodge: { x: 1480, y: 960, s: 0.5, x0: 1180, x1: 1820 },                      // the hero's dodge zone (calm wall behind)
  ballFace: { x: 1420, y: 560 },                                               // where the frozen last ball hangs (hero at dodge, s .5)
  bin: { x: 1760, y: 780, s: 0.42 },                                           // ball bin on wheels (rig/extras ballBin), floor contact
  coach: { x: 1540, y: 800, s: 0.43 },                                         // Coach Dee next to the bin (SC07) / at the whistle
  coachFront: { x: 200, y: 1000, s: 0.53 },                                    // Coach Dee at the left foreground (SC05)
  bleachers: [{ x: 120, y: 466, s: 0.3 }, { x: 260, y: 512, s: 0.32 }, { x: 330, y: 558, s: 0.33 }],   // seated on the bleacher rows (hips)
  hoop: { x: 300, y: 404 }, scoreboard: { x: 1560, y: 300 }, rope: { x: 1880, y: 640 },
  cams: {
    court: { x: 0, y: 0, zoom: 1 },
    dodge: camAt(1480, 720, 1.4),
    ballFace: camAt(1440, 600, 2.2),
    bin: camAt(1680, 620, 1.6),
    throwers: camAt(440, 700, 1.4),
  },
};
SPOTS.cafeteria = {
  lunchLady: { x: 300, y: 790, s: 0.36 },                                      // behind the counter (frontRows[0])
  line: [{ x: 660, y: 760, s: 0.38 }, { x: 470, y: 770, s: 0.38 }, { x: 280, y: 760, s: 0.38 }, { x: 90, y: 770, s: 0.38 }],   // front of the line first, facing left
  seats: {
    back: [1240, 1560, 1880, 2200, 2520].map((x) => ({ x, y: 844, s: 0.35 })),   // behind the back table (frontRows[1]); table top y 700
    front: [1330, 1720, 2060, 2420].map((x) => ({ x, y: 1004, s: 0.45 })),       // behind the front table (frontRows[2]); table top y 820
  },
  heroSeat: { x: 1720, y: 1004, s: 0.45 },                                     // YOUR seat (front table)
  stage: { x: 1720, y: 905, s: 0.45 },                                         // standing ON the bench behind the front table to tell the joke
  path: [{ x: 2300, y: 960 }, { x: 1300, y: 960 }, { x: 860, y: 960 }, { x: -300, y: 960 }],   // the principal's walk (right -> left)
  puddle: { x: 860, y: 968 }, sign: { x: 650, y: 940 },
  slip: { x: 880, y: 960, s: 0.5 },                                            // the hero slips here (tray flies up-right)
  principalHit: { x: 1180, y: 960, s: 0.52 },                                  // where the spaghetti lands on the principal
  cams: {
    wide: { x: 0, y: 0, zoom: 1 },
    line: camAt(420, 640, 1.35),
    spill: camAt(1000, 700, 1.25),
    table: camAt(1720, 760, 1.45),
    laugh: { x: 380, y: -40, zoom: 0.92 },
  },
};
SPOTS.lounge = {
  cake: { x: 960, y: 724, s: 0.5 },                                            // centre of the table top (rig/extras birthdayCake)
  seats: [{ x: 640, y: 980, s: 0.44 }, { x: 1280, y: 980, s: 0.44 }],         // seated behind the table, left/right of the cake
  behindCake: { x: 960, y: 860, s: 0.42 },                                     // standing behind the table centre (face above the cake)
  ends: [{ x: 330, y: 980, s: 0.5 }, { x: 1590, y: 980, s: 0.5 }],             // standing at the table ends
  coffee: { x: 1420, y: 960, s: 0.48 },                                        // at the coffee machine
  window: { x: 300, y: 340 },
  cams: { wide: { x: 0, y: 0, zoom: 1 }, cake: camAt(960, 640, 1.7), table: camAt(960, 700, 1.25) },
};
SPOTS.auditorium = {
  stage: {                                                                     // view 'stage' (from the audience)
    mic: { x: 960, y: 776, top: 776 - 344 * 0.95 },                            // mic stand base / mic head y
    cable: { x: 600, y: 790 },                                                 // where the hero trips on the mic cable
    ivy: { x: 700, y: 770, s: 0.45 }, hero: { x: 1180, y: 770, s: 0.45 },      // performers (FLOOR.auditorium = 770)
    principal: { x: 960, y: 770, s: 0.46 },                                    // announcing at the mic
    principalSide: { x: 1460, y: 760, s: 0.45 },                               // stepped aside -> gets foamed
    front: { x: 960, y: 795, s: 0.47 },                                        // downstage edge (bows)
    back: { x: 960, y: 640, s: 0.38 },                                         // upstage
    opening: { x0: 200, x1: 1720, y0: 100, y1: 806 },
    banner: { x: 960, y: 205 },
    spots: { centre: { x: 960, y: 760, w: 560 }, left: { x: 700, y: 765, w: 420 }, right: { x: 1220, y: 765, w: 420 } },
  },
  house: {                                                                     // view 'house' (from the stage)
    rows: HOUSE_ROWS,                                                          // [{y (shoulder line), s}] front -> back
    dad: houseSeat(FAMILY.dad, 0), mom: houseSeat(FAMILY.mom, 0),              // seated in the front row gap (legs under fg)
    bea: { x: FAMILY.bea, y: 1036, s: 0.5 },                                   // standing ON her seat (Bea's own size makes her small)
    seat: (x, row = 0) => houseSeat(x, row),                                   // any seat: rig feet for shoulders on that row
    booth: { x: 1030, y: 130 },
  },
  wings: {                                                                     // view 'wings' (backstage)
    hero: { x: 1150, y: 960, s: 0.5 }, ivy: { x: 1420, y: 980, s: 0.5 },
    peek: { x: 1640, y: 960, s: 0.5 },                                         // peeking through the gap
    gap: { x: 1745, y0: 0, y1: 1000 },                                         // the bright sliver of stage
    desk: { x: 420, y: 900 }, rack: { x: 860, y: 800 },
  },
  cams: {
    stage: { x: 0, y: 0, zoom: 1 },
    stageClose: camAt(960, 560, 1.6),
    banner: camAt(960, 230, 1.8),
    house: { x: 0, y: 0, zoom: 1 },
    family: camAt(960, 800, 1.6),
    wings: { x: 0, y: 0, zoom: 1 },
    wingsClose: camAt(1180, 640, 1.5),
  },
};
SPOTS.hallway = {
  door: { x: 1650, y: 745, s: 0.36 },                 // in Mr. Fig's doorway (ROOM 104)
  door105: { x: -500, y: 745, s: 0.36 },
  run: { x0: -900, x1: 2900, y: 960, s: 0.5 },        // run along the stand line
  lockers: { x: 900, y: 745, s: 0.36 },               // leaning on the lockers
  poster: { x: 250, y: 170 },                         // the TALENT SHOW poster
  cams: { wide: { x: 0, y: 0, zoom: 1 }, door: camAt(1650, 560, 1.3), poster: camAt(250, 300, 1.6), pan: [{ x: -900, y: 0, zoom: 1 }, { x: 1000, y: 0, zoom: 1 }] },
};
const DEFS = `<defs>${DEF.join('')}</defs>`;

module.exports = {
  DEFS, FLOOR, SPOTS,
  schoolyard, classroom, gym, cafeteria, lounge, auditorium, hallway, crowd,
  locker, lockerRow, schoolPoster, trophyCase, wetFloorSign, trashCan, bench, wallClock, comet, pennant, bunting, floorBall: dodgeball, balloon, spotlight, confettiFall, marqueeBanner, sconce, stageMic: micStand, schoolTree, skateRamp, grindRail, basketHoop, cloud, bush,
  camTf, toScreen, camAt, makeSet, mix, softGlow,
};
